import { Router } from "express";
import { createOrder, getMyOrders, getOrderById, getMyOrderStatus, trackOrder, cancelMyOrder } from "../controllers/orderController";
import { protect, optionalProtect } from "../middleware/auth";
import { orderCreationLimiter, orderTrackingLimiter } from "../middleware/rateLimiter";
import { createMyReturnRequest, getMyReturnRequest } from "../controllers/returnController";

const router = Router();

router.post("/", optionalProtect, orderCreationLimiter, createOrder);
router.get("/", protect, getMyOrders);
router.get("/track/:orderNumber", orderTrackingLimiter, trackOrder);
router.get("/:orderId/return", protect, getMyReturnRequest);
router.post("/:orderId/return", protect, createMyReturnRequest);
router.get("/:id/status", protect, getMyOrderStatus);
router.get("/:id", protect, getOrderById);
router.patch("/:id/cancel", protect, cancelMyOrder);

export default router;
