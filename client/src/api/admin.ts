import { api } from "./axios";

export interface AdminOrder {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
  shippingAddress?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
  items?: Array<{
    product: string;
    variantId?: string;
    variantLabel?: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  isPaid?: boolean;
  paidAt?: string;
  subtotal?: number;
  shippingCost?: number;
  tax?: number;
  discountAmount?: number;
  discountCode?: string;
}

export interface AdminDashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  totalUsers: number;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  recentOrders: AdminOrder[];
}

export interface AdminOrdersResponse {
  orders: AdminOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateAdminOrderStatusData {
  status: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const response = await api.get<AdminDashboardStats>("/admin/stats");
  return response.data;
};

export const getAdminOrders = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<AdminOrdersResponse> => {
  const response = await api.get<AdminOrdersResponse>("/admin/orders", {
    params,
  });

  return response.data;
};

export const updateAdminOrderStatus = async (
  id: string,
  data: UpdateAdminOrderStatusData
): Promise<AdminOrder> => {
  const response = await api.patch<{ order: AdminOrder }>(
    `/admin/orders/${id}/status`,
    data
  );

  return response.data.order;
};
export const confirmBankTransferPayment = async (id: string): Promise<AdminOrder> => {
  const response = await api.patch<{ order: AdminOrder }>(`/admin/orders/${id}/bank-transfer/confirm`);
  return response.data.order;
};

export interface AdminReturnRequest {
  _id: string;
  order: { _id: string; orderNumber: string; total: number; status: string };
  user: { _id: string; name: string; email: string };
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

export const getAdminReturnRequests = async (): Promise<AdminReturnRequest[]> => {
  const response = await api.get<{ returnRequests: AdminReturnRequest[] }>("/admin/returns");
  return response.data.returnRequests;
};

export const updateAdminReturnRequest = async (id: string, data: {
  status: AdminReturnRequest["status"];
  adminNote?: string;
  refundAmount?: number;
  refundMethod?: "cash" | "bank_transfer";
  refundReference?: string;
  returnCarrier?: string;
  returnTrackingNumber?: string;
  returnTrackingUrl?: string;
  returnEstimatedPickup?: string;
}): Promise<AdminReturnRequest> => {
  const response = await api.patch<{ returnRequest: AdminReturnRequest }>(`/admin/returns/${id}`, data);
  return response.data.returnRequest;
};
