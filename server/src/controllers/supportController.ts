import { Request, Response } from "express";
import Conversation from "../models/Conversation";
import User from "../models/User";
import { notifyUser } from "../services/notificationService";
import { escapeRegex } from "../utils/escapeRegex";
import {
  assertConversationAccess,
  changeConversationStatus,
  createConversation,
  getConversationMessages,
  markConversationRead,
  sendConversationMessage,
  SupportServiceError,
} from "../services/supportConversationService";
import { getRequestBody } from "../utils/requestBody";

const requireCustomer = (req: Request, res: Response): boolean => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated" });
    return false;
  }
  if (req.user.role !== "customer") {
    res.status(403).json({ message: "Customer support access required" });
    return false;
  }
  return true;
};

const handleError = (res: Response, err: unknown, fallback: string) => {
  if (err instanceof SupportServiceError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  return res.status(500).json({ message: fallback });
};

export const getMyConversations = async (req: Request, res: Response) => {
  if (!requireCustomer(req, res)) return;
  try {
    const conversations = await Conversation.find({ user: req.user!._id }).sort({ lastMessageAt: -1 });
    return res.json({ conversations });
  } catch (err) {
    return handleError(res, err, "Failed to load support conversations");
  }
};

export const startMyConversation = async (req: Request, res: Response) => {
  if (!requireCustomer(req, res)) return;
  try {
    const body = getRequestBody(req.body);
    const { conversation, message } = await createConversation(
      req.user!._id,
      body.subject,
      body.content
    );
    return res.status(201).json({ conversation, message });
  } catch (err) {
    return handleError(res, err, "Failed to start support conversation");
  }
};

export const getMyConversationMessages = async (req: Request, res: Response) => {
  if (!requireCustomer(req, res)) return;
  try {
    const conversation = await assertConversationAccess(req.params.id as string, req.user!._id, "customer");
    await markConversationRead(conversation, "customer");
    const messages = await getConversationMessages(conversation._id.toString());
    return res.json({ messages });
  } catch (err) {
    return handleError(res, err, "Failed to load conversation messages");
  }
};

export const sendMyConversationMessage = async (req: Request, res: Response) => {
  if (!requireCustomer(req, res)) return;
  try {
    const body = getRequestBody(req.body);
    const message = await sendConversationMessage(
      req.params.id as string,
      req.user!._id,
      "customer",
      body.content
    );
    return res.status(201).json({ message });
  } catch (err) {
    return handleError(res, err, "Failed to send support message");
  }
};

export const getAdminConversations = async (req: Request, res: Response) => {
  try {
    for (const key of ["status", "page", "limit", "search"] as const) {
      if (req.query[key] !== undefined && typeof req.query[key] !== "string") {
        return res.status(400).json({ message: "Search parameters must each have one text value" });
      }
    }
    const status = typeof req.query.status === "string" ? req.query.status : "open";
    if (!(["open", "closed", "all"] as string[]).includes(status)) {
      return res.status(400).json({ message: "Status must be open, closed, or all" });
    }

    const pageText = typeof req.query.page === "string" ? req.query.page : "1";
    const limitText = typeof req.query.limit === "string" ? req.query.limit : "25";
    const page = Number(pageText);
    const limit = Number(limitText);
    if (!/^\d+$/.test(pageText) || !Number.isSafeInteger(page) || page < 1 || page > 100000) {
      return res.status(400).json({ message: "Page must be a whole number between 1 and 100000" });
    }
    if (!/^\d+$/.test(limitText) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ message: "Limit must be a whole number between 1 and 100" });
    }
    const filter: Record<string, unknown> = {};
    if (status !== "all") filter.status = status;

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search.length > 100) return res.status(400).json({ message: "Search text must be 100 characters or fewer" });
    if (search) {
      const regex = { $regex: escapeRegex(search), $options: "i" };
      const userIds = await User.find({ $or: [{ name: regex }, { email: regex }] }).distinct("_id");
      filter.$or = [
        { subject: regex },
        { user: { $in: userIds } },
      ];
    }

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .populate("user", "name email")
        .sort({ lastMessageAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Conversation.countDocuments(filter),
    ]);
    return res.json({ conversations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    return handleError(res, err, "Failed to load support inbox");
  }
};

export const getAdminConversationMessages = async (req: Request, res: Response) => {
  try {
    const conversation = await assertConversationAccess(req.params.id as string, req.user!._id, "admin");
    await markConversationRead(conversation, "admin");
    const messages = await getConversationMessages(conversation._id.toString());
    return res.json({ messages });
  } catch (err) {
    return handleError(res, err, "Failed to load conversation messages");
  }
};

export const sendAdminConversationMessage = async (req: Request, res: Response) => {
  try {
    const body = getRequestBody(req.body);
    const message = await sendConversationMessage(
      req.params.id as string,
      req.user!._id,
      "admin",
      body.content
    );
    const conversation = await Conversation.findById(req.params.id).select("user subject");
    if (conversation) {
      await notifyUser({
        userId: conversation.user,
        type: "support",
        title: "Support replied",
        message: `Zentro Support replied to ${conversation.subject}.`,
        link: "/support",
      });
    }
    return res.status(201).json({ message });
  } catch (err) {
    return handleError(res, err, "Failed to send support message");
  }
};

export const setAdminConversationStatus = async (req: Request, res: Response) => {
  try {
    const conversation = await changeConversationStatus(req.params.id as string, getRequestBody(req.body).status);
    return res.json({ conversation });
  } catch (err) {
    return handleError(res, err, "Failed to update conversation");
  }
};
