import { Request, Response } from "express";
import { Types } from "mongoose";
import Order from "../models/Order";
import { cancelOrder, OrderCancellationError } from "../services/cancelOrder";
import { OrderStatusUpdateError, updateOrderStatus } from "../services/updateOrderStatus";
import { escapeRegex } from "../utils/escapeRegex";
import { notifyUser } from "../services/notificationService";
import { confirmBankTransfer, PaymentActionError } from "../services/confirmBankTransfer";
import { getRequestBody } from "../utils/requestBody";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const getAllOrdersAdmin = async (req: Request, res: Response) => {
  try {
    for (const key of ["status", "page", "limit", "search"] as const) {
      if (req.query[key] !== undefined && typeof req.query[key] !== "string") {
        return res.status(400).json({ message: "Search parameters must each have one text value" });
      }
    }
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const page = typeof req.query.page === "string" ? req.query.page : "1";
    const limit = typeof req.query.limit === "string" ? req.query.limit : "20";
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    if (status && status !== "all" && !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      return res.status(400).json({ message: "Unsupported order status filter" });
    }
    const pageNum = Number(page);
    const limitNum = Number(limit);
    if (!/^\d+$/.test(page) || !Number.isSafeInteger(pageNum) || pageNum < 1 || pageNum > 100000) {
      return res.status(400).json({ message: "Page must be a whole number between 1 and 100000" });
    }
    if (!/^\d+$/.test(limit) || !Number.isSafeInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ message: "Limit must be a whole number between 1 and 100" });
    }
    if (search && search.length > 100) return res.status(400).json({ message: "Search text must be 100 characters or fewer" });

    const filter: Record<string, any> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search?.trim()) {
      filter.$or = [
        { orderNumber: { $regex: escapeRegex(search.trim().slice(0, 100)), $options: "i" } },
        { "shippingAddress.fullName": { $regex: escapeRegex(search.trim().slice(0, 100)), $options: "i" } },
        { "shippingAddress.email": { $regex: escapeRegex(search.trim().slice(0, 100)), $options: "i" } },
      ];
    }

    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("user", "name email"),
      Order.countDocuments(filter),
    ]);

    return res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const updateOrderStatusAdmin = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const {
      status,
      trackingNumber,
      carrier,
      trackingUrl,
      estimatedDelivery,
    } = getRequestBody(req.body);

    if (typeof status !== "string" || !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    if (trackingNumber !== undefined && trackingNumber !== null &&
      (typeof trackingNumber !== "string" || trackingNumber.trim().length > 100)) {
      return res.status(400).json({ message: "Tracking number must be 100 characters or fewer" });
    }
    if (carrier !== undefined && carrier !== null &&
      (typeof carrier !== "string" || carrier.trim().length > 80)) {
      return res.status(400).json({ message: "Carrier must be 80 characters or fewer" });
    }
    if (estimatedDelivery !== undefined && estimatedDelivery !== null && estimatedDelivery !== "") {
      if (typeof estimatedDelivery !== "string" || !Number.isFinite(Date.parse(estimatedDelivery))) {
        return res.status(400).json({ message: "Estimated delivery date is invalid" });
      }
    }
    if (trackingUrl !== undefined && trackingUrl !== null && trackingUrl !== "") {
      if (typeof trackingUrl !== "string" || trackingUrl.trim().length > 2048) return res.status(400).json({ message: "Courier tracking link is too long" });
      try { if (new URL(trackingUrl.trim()).protocol !== "https:") throw new Error(); }
      catch { return res.status(400).json({ message: "Enter a valid HTTPS courier tracking link" }); }
    }

    const nextStatus = status as (typeof ORDER_STATUSES)[number];
    if (nextStatus === "cancelled") {
      const cancelledOrder = await cancelOrder(id);
      return res.json({ message: "Order cancelled successfully", order: cancelledOrder });
    }

    const { order, previousStatus } = await updateOrderStatus({
      orderId: id,
      status: nextStatus,
      trackingNumber: trackingNumber === undefined
        ? undefined
        : typeof trackingNumber === "string" ? trackingNumber.trim() : null,
      carrier: carrier === undefined
        ? undefined
        : typeof carrier === "string" ? carrier.trim() : null,
      trackingUrl: trackingUrl === undefined
        ? undefined
        : typeof trackingUrl === "string" ? trackingUrl.trim() : null,
      estimatedDelivery: estimatedDelivery === undefined
        ? undefined
        : typeof estimatedDelivery === "string" && estimatedDelivery ? new Date(estimatedDelivery) : null,
    });

    if (order.user && previousStatus !== order.status) {
      await notifyUser({
        userId: order.user,
        type: "order",
        title: "Order status updated",
        message: `Order ${order.orderNumber} is now ${order.status}.`,
        link: `/orders/${order._id}`,
      });
    }

    return res.json({
      message: "Order updated successfully",
      order,
    });
  } catch (err) {
    if (err instanceof OrderStatusUpdateError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    if (err instanceof OrderCancellationError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: "Failed to update order" });
  }
};
export const confirmBankTransferAdmin = async (req: Request, res: Response) => {
  try {
    const { order, newlyConfirmed } = await confirmBankTransfer(req.params.id as string);
    if (newlyConfirmed && order.user) {
      await notifyUser({
        userId: order.user,
        type: "payment",
        title: "Bank transfer confirmed",
        message: `Payment for order ${order.orderNumber} has been confirmed.`,
        link: `/orders/${order._id}`,
      });
    }
    return res.json({ message: "Bank transfer confirmed", order });
  } catch (err) {
    if (err instanceof PaymentActionError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: "Failed to confirm bank transfer" });
  }
};
