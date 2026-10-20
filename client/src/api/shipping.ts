import { api } from "./axios";

export interface ShippingOptions {
  provinces: string[];
  districtsByProvince: Record<string, string[]>;
  ratesByProvince: Record<string, number>;
  freeShippingThreshold: number;
}

export const fetchShippingOptions = async (): Promise<ShippingOptions> => {
  const response = await api.get<ShippingOptions>("/shipping/options");
  return response.data;
};
