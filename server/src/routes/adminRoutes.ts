import { Router } from "express";
import {
  getDashboardStats,
  getAllUsersAdmin,
  updateUserRoleAdmin,
} from "../controllers/adminController";
import { getAllOrdersAdmin } from "../controllers/adminOrderController";
import { protect, adminOnly } from "../middleware/auth";

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.get("/stats", getDashboardStats);
router.get("/orders", getAllOrdersAdmin);

router.get("/users", getAllUsersAdmin);
router.patch("/users/:id/role", updateUserRoleAdmin);

export default router;