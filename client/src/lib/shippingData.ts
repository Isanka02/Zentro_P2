export const PROVINCES = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa",
] as const;

export type Province = (typeof PROVINCES)[number];

export const DISTRICTS_BY_PROVINCE: Record<Province, string[]> = {
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

// Flat-ish rate by zone, Western (capital region) cheapest since most fulfillment is likely based there
const SHIPPING_RATES: Record<Province, number> = {
  Western: 300,
  Central: 450,
  Southern: 450,
  "North Western": 450,
  Sabaragamuwa: 450,
  Northern: 600,
  Eastern: 600,
  "North Central": 600,
  Uva: 600,
};

const FREE_SHIPPING_THRESHOLD = 5000;

export const calculateShipping = (province: Province | "", subtotal: number): number => {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  if (!province) return 0;
  return SHIPPING_RATES[province];
};

export { FREE_SHIPPING_THRESHOLD };