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