import { Request, Response } from "express";
import { Types } from "mongoose";
import Order from "../models/Order";
import ReturnRequest, { ReturnStatus, ManualRefundMethod } from "../models/ReturnRequest";
import { notifyUser } from "../services/notificationService";
import { getRequestBody } from "../utils/requestBody";

const statuses: ReturnStatus[] = ["requested", "approved", "rejected", "received", "refunded"];
const money = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && Math.round(value * 100) === value * 100;

export const createMyReturnRequest = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  try {
    const orderId = req.params.orderId as string;
    if (!Types.ObjectId.isValid(orderId)) return res.status(400).json({ message: "Invalid order ID" });
    const { reason, details } = getRequestBody(req.body);
    if (typeof reason !== "string" || reason.trim().length < 3 || reason.trim().length > 80) {
      return res.status(400).json({ message: "Choose a return reason (3–80 characters)" });
    }
    if (details !== undefined && (typeof details !== "string" || details.trim().length > 1000)) {
      return res.status(400).json({ message: "Additional details must be 1,000 characters or fewer" });
    }
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "delivered") return res.status(400).json({ message: "Returns can only be requested for delivered orders" });
    const existing = await ReturnRequest.findOne({ order: order._id });
    if (existing) return res.status(409).json({ message: "A return request already exists for this order", returnRequest: existing });
    const returnRequest = await ReturnRequest.create({ order: order._id, user: req.user._id, reason: reason.trim(), details: typeof details === "string" ? details.trim() : undefined });
    return res.status(201).json({ message: "Return request submitted", returnRequest });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return res.status(409).json({ message: "A return request already exists for this order" });
    return res.status(500).json({ message: "Failed to submit return request" });
  }
};

export const getMyReturnRequest = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  try {
    const orderId = req.params.orderId as string;
    if (!Types.ObjectId.isValid(orderId)) return res.status(400).json({ message: "Invalid order ID" });
    const order = await Order.findOne({ _id: orderId, user: req.user._id }).select("_id");
    if (!order) return res.status(404).json({ message: "Order not found" });
    const returnRequest = await ReturnRequest.findOne({ order: order._id });
    return res.json({ returnRequest });
  } catch {
    return res.status(500).json({ message: "Failed to load return request" });
  }
};

export const getAdminReturnRequests = async (_req: Request, res: Response) => {
  try {
    const requests = await ReturnRequest.find().sort({ createdAt: -1 }).populate("user", "name email").populate("order", "orderNumber total items status");
    return res.json({ returnRequests: requests });
  } catch {
    return res.status(500).json({ message: "Failed to load return requests" });
  }
};

export const updateAdminReturnRequest = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid return request ID" });
    const body = getRequestBody(req.body);
    const status = body.status;
    const adminNote = body.adminNote;
    const refundAmount = body.refundAmount;
    const refundMethod = body.refundMethod;
    const refundReference = body.refundReference;
    const returnCarrier = body.returnCarrier;
    const returnTrackingNumber = body.returnTrackingNumber;
    const returnTrackingUrl = body.returnTrackingUrl;
    const returnEstimatedPickup = body.returnEstimatedPickup;
    if (typeof status !== "string" || !statuses.includes(status as ReturnStatus) || status === "requested") return res.status(400).json({ message: "Choose a valid review status" });
    if (adminNote !== undefined && (typeof adminNote !== "string" || adminNote.trim().length > 1000)) return res.status(400).json({ message: "Admin note must be 1,000 characters or fewer" });
    if (status === "rejected" && (typeof adminNote !== "string" || !adminNote.trim())) return res.status(400).json({ message: "Add a short explanation before rejecting a return request" });
    if (returnCarrier !== undefined && (typeof returnCarrier !== "string" || returnCarrier.trim().length > 80)) return res.status(400).json({ message: "Return courier name must be 80 characters or fewer" });
    if (returnTrackingNumber !== undefined && (typeof returnTrackingNumber !== "string" || returnTrackingNumber.trim().length > 100)) return res.status(400).json({ message: "Return tracking number must be 100 characters or fewer" });
    if (returnTrackingUrl !== undefined && returnTrackingUrl !== "") {
      try { if (typeof returnTrackingUrl !== "string" || returnTrackingUrl.trim().length > 2048 || new URL(returnTrackingUrl.trim()).protocol !== "https:") throw new Error(); }
      catch { return res.status(400).json({ message: "Enter a valid HTTPS return tracking link" }); }
    }
    if (returnEstimatedPickup !== undefined && returnEstimatedPickup !== "" && (typeof returnEstimatedPickup !== "string" || !Number.isFinite(Date.parse(returnEstimatedPickup)))) return res.status(400).json({ message: "Estimated pickup date is invalid" });
    const request = await ReturnRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Return request not found" });
    const allowed: Record<ReturnStatus, ReturnStatus[]> = { requested: ["requested", "approved", "rejected"], approved: ["approved", "received"], rejected: [], received: ["received", "refunded"], refunded: [] };
    if (!allowed[request.status].includes(status as ReturnStatus)) return res.status(409).json({ message: `Cannot change a ${request.status} request to ${status}` });
    if (status === "refunded") {
      if (!money(refundAmount) || (refundMethod !== "cash" && refundMethod !== "bank_transfer")) return res.status(400).json({ message: "Record the refund amount and manual refund method" });
      const order = await Order.findById(request.order).select("total");
      if (!order || refundAmount > order.total) return res.status(400).json({ message: "Refund amount cannot exceed the order total" });
      if (refundReference !== undefined && (typeof refundReference !== "string" || refundReference.trim().length > 100)) return res.status(400).json({ message: "Refund reference must be 100 characters or fewer" });
      request.refundAmount = refundAmount;
      request.refundMethod = refundMethod as ManualRefundMethod;
      request.refundReference = typeof refundReference === "string" ? refundReference.trim() : undefined;
    }
    const previousStatus = request.status;
    request.status = status as ReturnStatus;
    if (typeof adminNote === "string") request.adminNote = adminNote.trim();
    if (typeof returnCarrier === "string") request.returnCarrier = returnCarrier.trim();
    if (typeof returnTrackingNumber === "string") request.returnTrackingNumber = returnTrackingNumber.trim();
    if (typeof returnTrackingUrl === "string") request.returnTrackingUrl = returnTrackingUrl.trim();
    if (typeof returnEstimatedPickup === "string") request.returnEstimatedPickup = returnEstimatedPickup ? new Date(returnEstimatedPickup) : undefined;
    await request.save();
    if (previousStatus !== request.status) {
      await notifyUser({ userId: request.user, type: "order", title: "Return request updated", message: `Your return request is now ${request.status}.`, link: `/orders/${request.order}` });
    }
    return res.json({ message: "Return request updated", returnRequest: request });
  } catch {
    return res.status(500).json({ message: "Failed to update return request" });
  }
};
