export const MAX_UNIT_AMOUNT = 1_000_000_000;
export const MAX_ORDER_AMOUNT = 5_000_000_000_000;

export const isMoneyAmount = (value: unknown, maximum = MAX_UNIT_AMOUNT): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= maximum &&
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-7;

export const toMinorUnits = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * 100);

export const fromMinorUnits = (amount: number): number => amount / 100;
