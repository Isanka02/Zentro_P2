import { OrderStatus } from "../types/index";

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["pending", "confirmed", "cancelled"],
  confirmed: ["confirmed", "shipped", "cancelled"],
  shipped: ["shipped", "delivered"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

export const canTransitionOrderStatus = (
  current: OrderStatus,
  next: OrderStatus
): boolean => allowedTransitions[current].includes(next);
