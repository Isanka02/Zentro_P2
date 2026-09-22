import { Router } from "express";
import { createOrder, getMyOrders, getOrderById, trackOrder, updateOrderStatus } from "../controllers/orderController";
import { protect, optionalProtect, adminOnly } from "../middleware/auth";

const router = Router();

router.post("/", optionalProtect, createOrder);
router.get("/", protect, getMyOrders);
router.get("/track/:orderNumber", trackOrder);
router.get("/:id", protect, getOrderById);
router.patch("/:id/status", protect, adminOnly, updateOrderStatus);

export default router;