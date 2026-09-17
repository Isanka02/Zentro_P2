import { Request, Response } from "express";
import Discount from "../models/Discount";

// Public: validate a code against a given subtotal, without consuming a use yet
export const validateDiscount = async (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || subtotal === undefined) {
      return res.status(400).json({ message: "Code and subtotal are required" });
    }

    const discount = await Discount.findOne({ code: code.toUpperCase().trim() });

    if (!discount) {
      return res.status(404).json({ message: "Invalid discount code" });
    }
    if (!discount.isActive) {
      return res.status(400).json({ message: "This code is no longer active" });
    }
    if (discount.expiresAt < new Date()) {
      return res.status(400).json({ message: "This code has expired" });
    }
    if (discount.usedCount >= discount.maxUses) {
      return res.status(400).json({ message: "This code has reached its usage limit" });
    }
    if (subtotal < discount.minPurchase) {
      return res.status(400).json({
        message: `Minimum purchase of LKR ${discount.minPurchase} required for this code`,
      });
    }

    const discountAmount =
      discount.type === "percentage" ? (subtotal * discount.value) / 100 : discount.value;

    res.status(200).json({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount: Math.min(discountAmount, subtotal), // never discount below zero
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to validate discount", error: (err as Error).message });
  }
};

// Admin: full CRUD (built now so the admin dashboard day can just wire UI to these)
export const getDiscounts = async (_req: Request, res: Response) => {
  try {
    const discounts = await Discount.find().sort({ createdAt: -1 });
    res.status(200).json({ discounts });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch discounts", error: (err as Error).message });
  }
};

export const createDiscount = async (req: Request, res: Response) => {
  try {
    const { code, type, value, minPurchase, maxUses, expiresAt } = req.body;

    if (!code || !type || value === undefined || !expiresAt) {
      return res.status(400).json({ message: "Code, type, value, and expiry date are required" });
    }

    const existing = await Discount.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "A discount with this code already exists" });
    }

    const discount = await Discount.create({
      code,
      type,
      value,
      minPurchase: minPurchase ?? 0,
      maxUses: maxUses ?? 1,
      expiresAt,
    });

    res.status(201).json({ discount });
  } catch (err) {
    res.status(500).json({ message: "Failed to create discount", error: (err as Error).message });
  }
};

export const updateDiscount = async (req: Request, res: Response) => {
  try {
    const discount = await Discount.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }
    res.status(200).json({ discount });
  } catch (err) {
    res.status(500).json({ message: "Failed to update discount", error: (err as Error).message });
  }
};

export const deleteDiscount = async (req: Request, res: Response) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }
    res.status(200).json({ message: "Discount deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete discount", error: (err as Error).message });
  }
};