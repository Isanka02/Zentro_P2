import { Schema, model, Document, Types } from "mongoose";
import { DiscountType } from "../types/index";
import { isMoneyAmount } from "../utils/money";

export interface IDiscount extends Document {
  _id: Types.ObjectId;
  code: string;
  type: DiscountType;
  value: number;
  minPurchase: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const discountSchema = new Schema<IDiscount>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: {
      type: Number,
      required: true,
      min: 0,
      max: 1_000_000_000,
      validate: isMoneyAmount,
    },
    minPurchase: { type: Number, default: 0, min: 0, max: 5_000_000_000_000, validate: (value: number) => isMoneyAmount(value, 5_000_000_000_000) },
    maxUses: { type: Number, required: true, default: 1, min: 1, max: 1_000_000_000, validate: Number.isSafeInteger },
    usedCount: { type: Number, default: 0, min: 0, max: 1_000_000_000, validate: Number.isSafeInteger },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

discountSchema.pre("validate", function () {
  if (this.type === "percentage" && this.value > 100) {
    this.invalidate("value", "Percentage discounts cannot exceed 100%");
  }
});

export default model<IDiscount>("Discount", discountSchema);
