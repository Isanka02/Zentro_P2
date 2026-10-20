import { Request, Response } from "express";
import { Types } from "mongoose";
import Notification from "../models/Notification";

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50),
      Notification.countDocuments({ user: req.user._id, readAt: { $exists: false } }),
    ]);
    return res.json({ notifications, unreadCount });
  } catch {
    return res.status(500).json({ message: "Failed to load notifications" });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid notification ID" });
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id, readAt: { $exists: false } },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!notification) {
      const exists = await Notification.exists({ _id: id, user: req.user._id });
      return exists
        ? res.json({ message: "Notification already read" })
        : res.status(404).json({ message: "Notification not found" });
    }
    return res.json({ message: "Notification marked as read", notification });
  } catch {
    return res.status(500).json({ message: "Failed to update notification" });
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    await Notification.updateMany(
      { user: req.user._id, readAt: { $exists: false } },
      { $set: { readAt: new Date() } }
    );
    return res.json({ message: "Notifications marked as read" });
  } catch {
    return res.status(500).json({ message: "Failed to update notifications" });
  }
};
