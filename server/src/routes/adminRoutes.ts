import { Router } from "express";
import { getDashboardStats } from "../controllers/adminController";
import { getAllOrdersAdmin } from "../controllers/adminOrderController";
import { protect, adminOnly } from "../middleware/auth";

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.get("/stats", getDashboardStats);
router.get("/orders", getAllOrdersAdmin);

export default router;
