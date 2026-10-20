import { Types } from "mongoose";
import Order, { IOrder } from "../models/Order";
import Product from "../models/Product";
import Discount from "../models/Discount";
import { notifyUser } from "./notificationService";

export class OrderCancellationError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "OrderCancellationError";
  }
}

export const cancelOrder = async (orderId: string, requesterId?: Types.ObjectId): Promise<IOrder> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new OrderCancellationError("Invalid order ID", 400);
  }

  const session = await Order.startSession();
  let cancelledOrder: IOrder | null = null;
  let newlyCancelled = false;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new OrderCancellationError("Order not found", 404);

      if (requesterId && order.user?.toString() !== requesterId.toString()) {
        throw new OrderCancellationError("Not authorized to cancel this order", 403);
      }

      // Repeated cancellation must not restore stock or discount usage twice.
      if (order.status === "cancelled") {
        cancelledOrder = order;
        return;
      }

      if (order.isPaid) {
        throw new OrderCancellationError("Paid orders must be refunded before they can be cancelled", 409);
      }

      if (order.status === "shipped" || order.status === "delivered") {
        throw new OrderCancellationError("Shipped or delivered orders cannot be cancelled", 409);
      }
      for (const item of order.items) {
        await Product.updateOne(
          item.variantId
            ? { _id: item.product, "variants._id": item.variantId }
            : { _id: item.product },
          item.variantId
            ? { $inc: { "variants.$.stock": item.quantity, stock: item.quantity } }
            : { $inc: { stock: item.quantity } },
          { session }
        );
      }

      if (order.discount) {
        await Discount.updateOne(
          { _id: order.discount, usedCount: { $gt: 0 } },
          { $inc: { usedCount: -1 } },
          { session }
        );
      }

      order.status = "cancelled";
      await order.save({ session });
      cancelledOrder = order;
      newlyCancelled = true;
    });

    const completedOrder = cancelledOrder as IOrder | null;
    if (!completedOrder) {
      throw new Error("Cancellation transaction did not return an order");
    }
    if (newlyCancelled && completedOrder.user) {
      await notifyUser({
        userId: completedOrder.user,
        type: "order",
        title: "Order cancelled",
        message: `Order ${completedOrder.orderNumber} has been cancelled.`,
        link: `/orders/${completedOrder._id}`,
      });
    }
    return completedOrder;
  } finally {
    await session.endSession();
  }
};
