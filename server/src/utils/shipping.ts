const SHIPPING_RATES: Record<string, number> = {
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

const FREE_SHIPPING_THRESHOLD = 5000;

export const calculateShipping = (
  province: string,
  subtotal: number
): number => {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  return SHIPPING_RATES[province] ?? 0;
};