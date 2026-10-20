import { Request, Response } from "express";
import { Types } from "mongoose";
import Discount from "../models/Discount";
import { isMoneyAmount, MAX_ORDER_AMOUNT } from "../utils/money";
import { getRequestBody } from "../utils/requestBody";

const isValidCode = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Z0-9_-]{3,32}$/.test(value.trim().toUpperCase());

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= 1_000_000_000;

const isNonNegativeAmount = (value: unknown): value is number =>
  isMoneyAmount(value, MAX_ORDER_AMOUNT);

const isValidType = (value: unknown): value is "percentage" | "fixed" =>
  value === "percentage" || value === "fixed";

const isDuplicateKey = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000;

// Public preview only; checkout repeats all checks and consumes usage atomically.
export const validateDiscount = async (req: Request, res: Response) => {
  try {
    const { code, subtotal } = getRequestBody(req.body);
    if (!isValidCode(code) || !isNonNegativeAmount(subtotal)) {
      return res.status(400).json({ message: "Enter a valid code and subtotal" });
    }

    const discount = await Discount.findOne({ code: code.trim().toUpperCase() });
    if (!discount) return res.status(404).json({ message: "Invalid discount code" });
    if (!discount.isActive) return res.status(400).json({ message: "This code is no longer active" });
    if (discount.expiresAt <= new Date()) return res.status(400).json({ message: "This code has expired" });
    if (discount.usedCount >= discount.maxUses) return res.status(400).json({ message: "This code has reached its usage limit" });
    if (subtotal < discount.minPurchase) {
      return res.status(400).json({ message: `Minimum purchase of LKR ${discount.minPurchase} required for this code` });
    }

    const subtotalMinor = Math.round((subtotal + Number.EPSILON) * 100);
    const discountMinor = discount.type === "percentage"
      ? Math.round(subtotalMinor * discount.value / 100)
      : Math.round((discount.value + Number.EPSILON) * 100);

    return res.json({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount: Math.min(discountMinor, subtotalMinor) / 100,
    });
  } catch {
    return res.status(500).json({ message: "Failed to validate discount" });
  }
};

export const getDiscounts = async (_req: Request, res: Response) => {
  try {
    const discounts = await Discount.find().sort({ createdAt: -1 });
    return res.json({ discounts });
  } catch {
    return res.status(500).json({ message: "Failed to fetch discounts" });
  }
};

export const createDiscount = async (req: Request, res: Response) => {
  try {
    const { code, type, value, minPurchase = 0, maxUses = 1, expiresAt } = getRequestBody(req.body);

    if (!isValidCode(code) || !isValidType(type) || !isMoneyAmount(value) || value === 0 ||
        (type === "percentage" && value > 100) || !isNonNegativeAmount(minPurchase) ||
        !isPositiveInteger(maxUses) || typeof expiresAt !== "string" || !Number.isFinite(Date.parse(expiresAt)) ||
        new Date(expiresAt) <= new Date()) {
      return res.status(400).json({ message: "Enter a valid code, discount, usage limit, and future expiry date" });
    }

    const normalizedCode = code.trim().toUpperCase();
    if (await Discount.exists({ code: normalizedCode })) {
      return res.status(409).json({ message: "A discount with this code already exists" });
    }

    const discount = await Discount.create({
      code: normalizedCode,
      type,
      value,
      minPurchase,
      maxUses,
      expiresAt: new Date(expiresAt),
    });
    return res.status(201).json({ discount });
  } catch (err) {
    if (isDuplicateKey(err)) return res.status(409).json({ message: "A discount with this code already exists" });
    return res.status(500).json({ message: "Failed to create discount" });
  }
};

export const updateDiscount = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid discount ID" });

    const discount = await Discount.findById(id);
    if (!discount) return res.status(404).json({ message: "Discount not found" });

    const input = getRequestBody(req.body);
    const allowedFields = new Set(["code", "type", "value", "minPurchase", "maxUses", "expiresAt", "isActive"]);
    if (Object.keys(input).length === 0 || Object.keys(input).some((key) => !allowedFields.has(key))) {
      return res.status(400).json({ message: "Request contains unsupported discount fields" });
    }

    if (input.code !== undefined) {
      if (!isValidCode(input.code)) return res.status(400).json({ message: "Code must use 3 to 32 letters, numbers, hyphens, or underscores" });
      discount.code = input.code.trim().toUpperCase();
    }
    if (input.type !== undefined) {
      if (!isValidType(input.type)) return res.status(400).json({ message: "Discount type must be percentage or fixed" });
      discount.type = input.type;
    }
    if (input.value !== undefined) {
      if (!isMoneyAmount(input.value) || input.value === 0) return res.status(400).json({ message: "Discount value must be a positive LKR amount or percentage with up to two decimals" });
      discount.value = input.value;
    }
    if (discount.type === "percentage" && discount.value > 100) {
      return res.status(400).json({ message: "Percentage discounts cannot exceed 100%" });
    }
    if (input.minPurchase !== undefined) {
      if (!isNonNegativeAmount(input.minPurchase)) return res.status(400).json({ message: "Minimum purchase must be non-negative" });
      discount.minPurchase = input.minPurchase;
    }
    if (input.maxUses !== undefined) {
      if (!isPositiveInteger(input.maxUses) || input.maxUses < discount.usedCount) {
        return res.status(400).json({ message: "Usage limit must be a positive whole number no lower than current usage" });
      }
      discount.maxUses = input.maxUses;
    }
    if (input.expiresAt !== undefined) {
      if (typeof input.expiresAt !== "string" || !Number.isFinite(Date.parse(input.expiresAt))) {
        return res.status(400).json({ message: "Expiry date is invalid" });
      }
      discount.expiresAt = new Date(input.expiresAt);
    }
    if (input.isActive !== undefined) {
      if (typeof input.isActive !== "boolean") return res.status(400).json({ message: "Active status must be true or false" });
      discount.isActive = input.isActive;
    }

    await discount.save();
    return res.json({ discount });
  } catch (err) {
    if (isDuplicateKey(err)) return res.status(409).json({ message: "A discount with this code already exists" });
    return res.status(500).json({ message: "Failed to update discount" });
  }
};

export const deleteDiscount = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid discount ID" });

    const discount = await Discount.findByIdAndDelete(id);
    if (!discount) return res.status(404).json({ message: "Discount not found" });
    return res.json({ message: "Discount deleted" });
  } catch {
    return res.status(500).json({ message: "Failed to delete discount" });
  }
};
