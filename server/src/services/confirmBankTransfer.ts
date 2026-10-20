import { Types } from "mongoose";
import Order, { IOrder } from "../models/Order";

export interface ConfirmBankTransferResult {
  order: IOrder;
  newlyConfirmed: boolean;
}

export class PaymentActionError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "PaymentActionError";
  }
}

export const confirmBankTransfer = async (orderId: string): Promise<ConfirmBankTransferResult> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new PaymentActionError("Invalid order ID", 400);
  }

  const confirmedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paymentMethod: "bank_transfer",
      status: { $ne: "cancelled" },
      isPaid: false,
    },
    { $set: { isPaid: true, paidAt: new Date() } },
    { new: true, runValidators: true }
  );
  if (confirmedOrder) return { order: confirmedOrder, newlyConfirmed: true };

  const order = await Order.findById(orderId);
  if (!order) throw new PaymentActionError("Order not found", 404);
  if (order.paymentMethod !== "bank_transfer") {
    throw new PaymentActionError("This order was not placed by bank transfer", 409);
  }
  if (order.status === "cancelled") {
    throw new PaymentActionError("A cancelled order cannot be marked as paid", 409);
  }
  if (order.isPaid) return { order, newlyConfirmed: false };

  throw new PaymentActionError("The order changed while its payment was being confirmed; refresh and try again", 409);
};
