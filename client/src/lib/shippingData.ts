import type { ShippingOptions } from "../api/shipping";

export type Province = string;

export const calculateShipping = (
  province: Province | "",
  subtotal: number,
  options?: ShippingOptions
): number => {
  if (!province || !options || subtotal >= options.freeShippingThreshold) return 0;
  return options.ratesByProvince[province] ?? 0;
};

export const normalizeSriLankanPhone = (value: string): string | null => {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (/^0[1-9]\d{8}$/.test(compact)) return `+94${compact.slice(1)}`;
  if (/^\+94[1-9]\d{8}$/.test(compact)) return compact;
  if (/^94[1-9]\d{8}$/.test(compact)) return `+${compact}`;
  if (/^0094[1-9]\d{8}$/.test(compact)) return `+${compact.slice(2)}`;
  return null;
};
