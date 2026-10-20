import { api } from "./axios";

export interface DiscountValidation {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  discountAmount: number;
}

export interface AdminDiscount {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minPurchase: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface DiscountInput {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minPurchase: number;
  maxUses: number;
  expiresAt: string;
  isActive?: boolean;
}

export const validateDiscountCode = async (
  code: string,
  subtotal: number
): Promise<DiscountValidation> => {
  const res = await api.post<DiscountValidation>("/discounts/validate", { code, subtotal });
  return res.data;
};

export const getAdminDiscounts = async (): Promise<AdminDiscount[]> => {
  const response = await api.get<{ discounts: AdminDiscount[] }>("/discounts");
  return response.data.discounts;
};

export const createAdminDiscount = async (input: DiscountInput): Promise<AdminDiscount> => {
  const response = await api.post<{ discount: AdminDiscount }>("/discounts", input);
  return response.data.discount;
};

export const updateAdminDiscount = async (
  id: string,
  input: DiscountInput
): Promise<AdminDiscount> => {
  const response = await api.put<{ discount: AdminDiscount }>(`/discounts/${id}`, input);
  return response.data.discount;
};

export const deleteAdminDiscount = async (id: string): Promise<void> => {
  await api.delete(`/discounts/${id}`);
};
