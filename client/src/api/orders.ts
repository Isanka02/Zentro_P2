import { api } from "./axios";
import type { ShippingInfo, PaymentMethod } from "../store/checkoutStore";
import type { CartItem } from "../store/cartStore";

export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: ShippingInfo;
  paymentMethod: PaymentMethod;
  discountCode?: string;
}

export interface CreatedOrder {
  id: string;
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
  discountCode?: string
): Promise<CreateOrderResponse> => {
  const payload: CreateOrderRequest = {
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
    shippingAddress,
    paymentMethod,
    ...(discountCode ? { discountCode } : {}),
  };

  const response = await api.post<CreateOrderResponse>(
    "/orders",
    payload
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

export const trackOrder = async (orderNumber: string): Promise<Order> => {
  const response = await api.get<GetOrderByIdResponse>(`/orders/track/${encodeURIComponent(orderNumber)}`);
  return response.data.order;
};

export const updateOrderStatus = async (
  id: string,
  data: {
    status?: Order["status"];
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
  }
): Promise<Order> => {
  const response = await api.patch<{ message: string; order: Order }>(`/orders/${id}/status`, data);
  return response.data.order;
};