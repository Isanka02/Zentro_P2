import { api } from "../api/axios";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
}

interface AuthResponse {
  user: User;
}

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}): Promise<User> => {
  const res = await api.post<AuthResponse>("/auth/register", data);
  return res.data.user;
};

export const loginUser = async (data: {
  email: string;
  password: string;
}): Promise<User> => {
  const res = await api.post<AuthResponse>("/auth/login", data);
  return res.data.user;
};

export const logoutUser = async (): Promise<void> => {
  await api.post("/auth/logout");
};

export const getCurrentUser = async (): Promise<User> => {
  const res = await api.get<AuthResponse>("/auth/me");
  return res.data.user;
};