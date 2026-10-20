export const DISTRICTS_BY_PROVINCE: Record<string, readonly string[]> = {
  Western: ["Colombo", "Gampaha", "Kalutara"],
  Central: ["Kandy", "Matale", "Nuwara Eliya"],
  Southern: ["Galle", "Matara", "Hambantota"],
  Northern: ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"],
  Eastern: ["Trincomalee", "Batticaloa", "Ampara"],
  "North Western": ["Kurunegala", "Puttalam"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  Uva: ["Badulla", "Monaragala"],
  Sabaragamuwa: ["Ratnapura", "Kegalle"],
};

export const SHIPPING_RATES: Record<string, number> = {
  Western: 300,
  Central: 450,
  Southern: 450,
  Northern: 600,
  Eastern: 600,
  "North Western": 450,
  "North Central": 600,
  Uva: 600,
  Sabaragamuwa: 450,
};

export const FREE_SHIPPING_THRESHOLD = 5000;

export const getShippingOptions = () => ({
  provinces: Object.keys(DISTRICTS_BY_PROVINCE),
  districtsByProvince: DISTRICTS_BY_PROVINCE,
  ratesByProvince: SHIPPING_RATES,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
});

export const calculateShipping = (
  province: string,
  subtotal: number
): number => {
  if (!(province in SHIPPING_RATES)) {
    throw new Error("Select a valid Sri Lankan province");
  }

  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  return SHIPPING_RATES[province];
};

export const isValidSriLankanDistrict = (province: string, district: string): boolean =>
  DISTRICTS_BY_PROVINCE[province]?.includes(district) ?? false;

/** Returns a Sri Lankan telephone number in E.164 form, or null when invalid. */
export const normalizeSriLankanPhone = (value: string): string | null => {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (/^0[1-9]\d{8}$/.test(compact)) return `+94${compact.slice(1)}`;
  if (/^\+94[1-9]\d{8}$/.test(compact)) return compact;
  if (/^94[1-9]\d{8}$/.test(compact)) return `+${compact}`;
  if (/^0094[1-9]\d{8}$/.test(compact)) return `+${compact.slice(2)}`;
  return null;
};
