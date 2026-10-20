import { Router } from "express";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notificationController";
import { protect } from "../middleware/auth";

const router = Router();
router.use(protect);
router.get("/", getMyNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;
