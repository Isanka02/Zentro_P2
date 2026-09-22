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
    city?: string;
    district?: string;
    province?: string;
  };
  items?: Array<{
    product: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
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

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const response = await api.get<AdminDashboardStats>("/admin/stats");
  return response.data;
};