import { api } from "./axios";
import type { ShippingInfo, PaymentMethod } from "../store/checkoutStore";
import type { CartItem } from "../store/cartStore";

export interface CreateOrderRequest {
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    expectedPrice: number;
  }[];
  shippingAddress: ShippingInfo;
  paymentMethod: PaymentMethod;
  discountCode?: string;
}

export interface CreatedOrder {
  id: string;
  ownerId: string | null;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface CreateOrderResponse {
  message: string;
  order: CreatedOrder;
}

export interface OrderItem {
  product: string;
  variantId?: string;
  variantLabel?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user?: string;
  items: OrderItem[];
  shippingAddress: ShippingInfo;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  paidAt?: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discountAmount: number;
  discountCode?: string;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetOrdersResponse {
  orders: Order[];
}

export interface GetOrderByIdResponse {
  order: Order;
}

export const createOrder = async (
  items: CartItem[],
  shippingAddress: ShippingInfo,
  paymentMethod: PaymentMethod,
  discountCode: string | undefined,
  idempotencyKey: string
): Promise<CreateOrderResponse> => {
  const payload: CreateOrderRequest = {
    items: items.map((item) => ({
      productId: item.productId,
      ...(item.variantId ? { variantId: item.variantId } : {}),
      quantity: item.quantity,
      expectedPrice: item.price,
    })),
    shippingAddress,
    paymentMethod,
    ...(discountCode ? { discountCode } : {}),
  };

  const response = await api.post<CreateOrderResponse>(
    "/orders",
    payload,
    { headers: { "Idempotency-Key": idempotencyKey } }
  );

  return response.data;
};

export const getMyOrders = async (): Promise<Order[]> => {
  const response = await api.get<GetOrdersResponse>("/orders");
  return response.data.orders;
};

export const getOrderById = async (id: string): Promise<Order> => {
  const response = await api.get<GetOrderByIdResponse>(`/orders/${id}`);
  return response.data.order;
};

export type CustomerOrderStatus = Pick<Order, "orderNumber" | "status" | "trackingNumber" | "carrier" | "trackingUrl" | "estimatedDelivery" | "createdAt" | "updatedAt">;

export const getMyOrderStatus = async (id: string): Promise<CustomerOrderStatus> => {
  const response = await api.get<{ order: CustomerOrderStatus }>(`/orders/${id}/status`);
  return response.data.order;
};

export interface TrackableOrder {
  orderNumber: string;
  status: Order['status'];
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export const trackOrder = async (orderNumber: string): Promise<TrackableOrder> => {
  const response = await api.get<{ order: TrackableOrder }>(`/orders/track/${encodeURIComponent(orderNumber)}`);
  return response.data.order;
};


export const cancelMyOrder = async (id: string): Promise<Order> => {
  const response = await api.patch<{ message: string; order: Order }>(`/orders/${id}/cancel`);
  return response.data.order;
};

export interface CustomerReturnRequest {
  _id: string;
  order: string;
  reason: string;
  details?: string;
  status: "requested" | "approved" | "rejected" | "received" | "refunded";
  adminNote?: string;
  refundAmount?: number;
  refundMethod?: "cash" | "bank_transfer";
  refundReference?: string;
  returnCarrier?: string;
  returnTrackingNumber?: string;
  returnTrackingUrl?: string;
  returnEstimatedPickup?: string;
  createdAt: string;
  updatedAt: string;
}

export const getMyReturnRequest = async (orderId: string): Promise<CustomerReturnRequest | null> => {
  const response = await api.get<{ returnRequest: CustomerReturnRequest | null }>(`/orders/${orderId}/return`);
  return response.data.returnRequest;
};

export const createMyReturnRequest = async (orderId: string, data: { reason: string; details?: string }): Promise<CustomerReturnRequest> => {
  const response = await api.post<{ returnRequest: CustomerReturnRequest }>(`/orders/${orderId}/return`, data);
  return response.data.returnRequest;
};
