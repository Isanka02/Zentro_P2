import { Types } from "mongoose";
import Order from "../models/Order";
import { OrderStatus } from "../types";

export interface CustomerOrderStatus {
  orderNumber: string;
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerOrderStatusError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "CustomerOrderStatusError";
  }
}

/** Returns only fulfillment status fields for an order owned by the requesting customer. */
export const getCustomerOrderStatus = async (
  orderId: string,
  customerId: Types.ObjectId
): Promise<CustomerOrderStatus> => {
  if (!Types.ObjectId.isValid(orderId)) throw new CustomerOrderStatusError("Invalid order ID", 400);

  const order = await Order.findOne({ _id: orderId, user: customerId })
    .select("orderNumber status trackingNumber carrier trackingUrl estimatedDelivery createdAt updatedAt")
    .lean();
  if (!order) throw new CustomerOrderStatusError("Order not found", 404);

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    ...(order.trackingNumber ? { trackingNumber: order.trackingNumber } : {}),
    ...(order.carrier ? { carrier: order.carrier } : {}),
    ...(order.trackingUrl ? { trackingUrl: order.trackingUrl } : {}),
    ...(order.estimatedDelivery ? { estimatedDelivery: order.estimatedDelivery } : {}),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};
