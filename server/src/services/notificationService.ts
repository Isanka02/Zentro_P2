import { Types } from "mongoose";
import Notification, { NotificationType } from "../models/Notification";

export const notifyUser = async (input: {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
}): Promise<void> => {
  try {
    if (!input.link.startsWith("/")) return;
    await Notification.create({
      user: input.userId,
      type: input.type,
      title: input.title.trim().slice(0, 100),
      message: input.message.trim().slice(0, 400),
      link: input.link.slice(0, 200),
    });
  } catch (error) {
    // Notification delivery must not fail the order, payment, or support action.
    console.error("Failed to create user notification", error instanceof Error ? error.message : error);
  }
};
