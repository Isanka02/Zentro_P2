import { Router } from "express";
import {
  getMyConversationMessages,
  getMyConversations,
  sendMyConversationMessage,
  startMyConversation,
} from "../controllers/supportController";
import { protect } from "../middleware/auth";
import { supportMessageLimiter } from "../middleware/rateLimiter";

const router = Router();
router.use(protect);
router.get("/conversations", getMyConversations);
router.post("/conversations", supportMessageLimiter, startMyConversation);
router.get("/conversations/:id/messages", getMyConversationMessages);
router.post("/conversations/:id/messages", supportMessageLimiter, sendMyConversationMessage);

export default router;
