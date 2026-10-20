import { Router } from "express";
import {
  getDashboardStats,
  getAllUsersAdmin,
  updateUserRoleAdmin,
} from "../controllers/adminController";
import {
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  confirmBankTransferAdmin,
} from "../controllers/adminOrderController";
import { protect, adminOnly } from "../middleware/auth";
import { supportMessageLimiter } from "../middleware/rateLimiter";
import { getAdminConversationMessages, getAdminConversations, sendAdminConversationMessage, setAdminConversationStatus } from "../controllers/supportController";
import { getAdminReturnRequests, updateAdminReturnRequest } from "../controllers/returnController";

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// Dashboard
router.get("/stats", getDashboardStats);

// Orders
router.get("/orders", getAllOrdersAdmin);
router.patch("/orders/:id/status", updateOrderStatusAdmin);
router.patch("/orders/:id/bank-transfer/confirm", confirmBankTransferAdmin);
router.get("/returns", getAdminReturnRequests);
router.patch("/returns/:id", updateAdminReturnRequest);

// Customer support
router.get("/support/conversations", getAdminConversations);
router.get("/support/conversations/:id/messages", getAdminConversationMessages);
router.post("/support/conversations/:id/messages", supportMessageLimiter, sendAdminConversationMessage);
router.patch("/support/conversations/:id/status", setAdminConversationStatus);

// Users
router.get("/users", getAllUsersAdmin);
router.patch("/users/:id/role", updateUserRoleAdmin);

export default router;
