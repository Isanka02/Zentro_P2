import { api } from "./axios";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: "customer" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getAdminUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<AdminUsersResponse> => {
  const response = await api.get<AdminUsersResponse>("/admin/users", {
    params,
  });

  return response.data;
};

export const updateAdminUserRole = async (
  userId: string,
  role: "customer" | "admin"
): Promise<AdminUser> => {
  const response = await api.patch<{ user: AdminUser }>(
    `/admin/users/${userId}/role`,
    { role }
  );

  return response.data.user;
};