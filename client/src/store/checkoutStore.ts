import { create } from "zustand";
import type { Province } from "../lib/shippingData";
import type { DiscountValidation } from "../api/discounts";

export interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: Province | "";
  district: string;
  postalCode: string;
  country: string;
}

export type PaymentMethod = "cod" | "bank_transfer";

interface CheckoutState {
  shippingInfo: ShippingInfo;
  setShippingInfo: (info: ShippingInfo) => void;
  discount: DiscountValidation | null;
  setDiscount: (discount: DiscountValidation | null) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
}

const emptyShippingInfo: ShippingInfo = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  district: "",
  postalCode: "",
  country: "Sri Lanka",
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  shippingInfo: emptyShippingInfo,
  setShippingInfo: (info) => set({ shippingInfo: info }),
  discount: null,
  setDiscount: (discount) => set({ discount }),
  paymentMethod: "cod",
  setPaymentMethod: (method) => set({ paymentMethod: method }),
}));