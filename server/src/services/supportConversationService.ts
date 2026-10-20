import { Types } from "mongoose";
import Conversation, { IConversation } from "../models/Conversation";
import Message, { IMessage } from "../models/Message";
import { UserRole } from "../types";

export class SupportServiceError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "SupportServiceError";
  }
}

export const assertConversationAccess = async (
  conversationId: string,
  userId: Types.ObjectId,
  role: UserRole
): Promise<IConversation> => {
  if (!Types.ObjectId.isValid(conversationId)) throw new SupportServiceError("Invalid conversation ID", 400);
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new SupportServiceError("Conversation not found", 404);
  if (role !== "admin" && conversation.user.toString() !== userId.toString()) {
    throw new SupportServiceError("Not authorized to access this conversation", 403);
  }
  return conversation;
};

const validateMessageContent = (content: unknown): string => {
  if (typeof content !== "string" || !content.trim()) {
    throw new SupportServiceError("Message cannot be empty", 400);
  }
  const trimmed = content.trim();
  if (trimmed.length > 4000) throw new SupportServiceError("Message must be 4000 characters or fewer", 400);
  return trimmed;
};

export const createConversation = async (
  userId: Types.ObjectId,
  subjectInput: unknown,
  firstMessage: unknown
): Promise<{ conversation: IConversation; message: IMessage }> => {
  const content = validateMessageContent(firstMessage);
  const subject = typeof subjectInput === "string" && subjectInput.trim()
    ? subjectInput.trim().slice(0, 120)
    : "Support request";
  const session = await Conversation.startSession();
  let result: { conversation: IConversation; message: IMessage } | null = null;

  try {
    await session.withTransaction(async () => {
      const [conversation] = await Conversation.create([{
        user: userId,
        subject,
        status: "open",
        lastMessageAt: new Date(),
        unreadCountAdmin: 1,
      }], { session });
      const [message] = await Message.create([{
        conversation: conversation._id,
        sender: userId,
        senderRole: "customer",
        content,
      }], { session });
      result = { conversation, message };
    });

    if (!result) throw new Error("Could not create support conversation");
    return result;
  } finally {
    await session.endSession();
  }
};

export const sendConversationMessage = async (
  conversationId: string,
  senderId: Types.ObjectId,
  senderRole: Extract<UserRole, "customer" | "admin">,
  contentInput: unknown
): Promise<IMessage> => {
  const content = validateMessageContent(contentInput);
  if (!Types.ObjectId.isValid(conversationId)) throw new SupportServiceError("Invalid conversation ID", 400);

  const session = await Conversation.startSession();
  let createdMessage: IMessage | null = null;

  try {
    await session.withTransaction(async () => {
      const conversation = await Conversation.findById(conversationId).session(session);
      if (!conversation) throw new SupportServiceError("Conversation not found", 404);
      if (senderRole === "customer" && conversation.user.toString() !== senderId.toString()) {
        throw new SupportServiceError("Not authorized to access this conversation", 403);
      }
      if (conversation.status === "closed") {
        throw new SupportServiceError("This conversation is closed", 409);
      }

      const [message] = await Message.create([{
        conversation: conversation._id,
        sender: senderId,
        senderRole,
        content,
      }], { session });

      conversation.lastMessageAt = message.createdAt;
      if (senderRole === "customer") conversation.unreadCountAdmin += 1;
      else conversation.unreadCountUser += 1;
      await conversation.save({ session });
      createdMessage = message;
    });

    if (!createdMessage) throw new Error("Could not save support message");
    return createdMessage;
  } finally {
    await session.endSession();
  }
};

export const markConversationRead = async (
  conversation: IConversation,
  readerRole: Extract<UserRole, "customer" | "admin">
): Promise<void> => {
  const session = await Conversation.startSession();
  try {
    await session.withTransaction(async () => {
      await Message.updateMany(
        { conversation: conversation._id, senderRole: readerRole === "admin" ? "customer" : "admin", isRead: false },
        { $set: { isRead: true } },
        { session }
      );
      await Conversation.updateOne(
        { _id: conversation._id },
        { $set: readerRole === "admin" ? { unreadCountAdmin: 0 } : { unreadCountUser: 0 } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
};

export const changeConversationStatus = async (
  conversationId: string,
  status: unknown
): Promise<IConversation> => {
  if (!Types.ObjectId.isValid(conversationId)) throw new SupportServiceError("Invalid conversation ID", 400);
  if (status !== "open" && status !== "closed") throw new SupportServiceError("Status must be open or closed", 400);
  const conversation = await Conversation.findByIdAndUpdate(
    conversationId,
    { $set: { status } },
    { new: true, runValidators: true }
  );
  if (!conversation) throw new SupportServiceError("Conversation not found", 404);
  return conversation;
};

export const getConversationMessages = async (conversationId: string) => {
  if (!Types.ObjectId.isValid(conversationId)) throw new SupportServiceError("Invalid conversation ID", 400);
  const messages = await Message.find({ conversation: conversationId })
    .populate("sender", "name avatar role")
    .sort({ createdAt: -1 })
    .limit(200);
  return messages.reverse();
};
