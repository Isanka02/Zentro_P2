import { api } from "./axios";

export interface DiscountValidation {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  discountAmount: number;
}

export const validateDiscountCode = async (
  code: string,
  subtotal: number
): Promise<DiscountValidation> => {
  const res = await api.post<DiscountValidation>("/discounts/validate", { code, subtotal });
  return res.data;
};