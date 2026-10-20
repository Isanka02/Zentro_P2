import { Types } from "mongoose";
import Order, { IOrder } from "../models/Order";
import { OrderStatus } from "../types/index";
import { canTransitionOrderStatus } from "./orderStatusPolicy";

export class OrderStatusUpdateError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "OrderStatusUpdateError";
  }
}

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
  trackingNumber?: string | null;
  carrier?: string | null;
  trackingUrl?: string | null;
  estimatedDelivery?: Date | null;
}

export interface UpdateOrderStatusResult {
  order: IOrder;
  previousStatus: OrderStatus;
}

/** Applies a fulfillment transition only if the order has not changed since it was read. */
export const updateOrderStatus = async (input: UpdateOrderStatusInput): Promise<UpdateOrderStatusResult> => {
  if (!Types.ObjectId.isValid(input.orderId)) {
    throw new OrderStatusUpdateError("Invalid order ID", 400);
  }

  const currentOrder = await Order.findById(input.orderId);
  if (!currentOrder) throw new OrderStatusUpdateError("Order not found", 404);
  if (input.status === "cancelled") {
    throw new OrderStatusUpdateError("Use the cancellation action to cancel an order", 400);
  }
  if (!canTransitionOrderStatus(currentOrder.status, input.status)) {
    throw new OrderStatusUpdateError(`Order cannot move from ${currentOrder.status} to ${input.status}`, 409);
  }
  if ((input.status === "shipped" || input.status === "delivered") &&
      currentOrder.paymentMethod === "bank_transfer" && !currentOrder.isPaid) {
    throw new OrderStatusUpdateError("Confirm the bank transfer before shipping this order", 409);
  }
  if (input.status === "shipped" && !(input.carrier?.trim() || currentOrder.carrier?.trim())) {
    throw new OrderStatusUpdateError("Assign a courier before marking this order as shipped", 400);
  }

  const previousStatus = currentOrder.status;
  const update: Record<string, unknown> = { status: input.status };
  if (input.trackingNumber !== undefined) update.trackingNumber = input.trackingNumber || undefined;
  if (input.carrier !== undefined) update.carrier = input.carrier || undefined;
  if (input.trackingUrl !== undefined) update.trackingUrl = input.trackingUrl || undefined;
  if (input.estimatedDelivery !== undefined) update.estimatedDelivery = input.estimatedDelivery || undefined;
  if (input.status === "delivered" && !currentOrder.isPaid && currentOrder.paymentMethod === "cod") {
    update.isPaid = true;
    update.paidAt = new Date();
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: input.orderId, status: previousStatus },
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!updatedOrder) {
    throw new OrderStatusUpdateError("The order changed while it was being updated; refresh and try again", 409);
  }

  return { order: updatedOrder, previousStatus };
};
