import { Schema, model, Document, Types } from "mongoose";
import { isMoneyAmount, toMinorUnits } from "../utils/money";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: Types.ObjectId;
  images: string[];
  tags: string[];
  stock: number;
  variants: IProductVariant[];
  rating: number;
  numReviews: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariant {
  _id: Types.ObjectId;
  label: string;
  sku?: string;
  price: number;
  discountPrice?: number;
  stock: number;
}

const productVariantSchema = new Schema<IProductVariant>({
  label: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
  sku: { type: String, trim: true, maxlength: 40 },
  price: { type: Number, required: true, min: 0, max: 1_000_000_000, validate: isMoneyAmount },
  discountPrice: { type: Number, min: 0, max: 1_000_000_000, validate: isMoneyAmount },
  stock: { type: Number, required: true, min: 0, max: 1_000_000_000, validate: Number.isSafeInteger },
});

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0, max: 1_000_000_000, validate: isMoneyAmount },
    discountPrice: { type: Number, min: 0, max: 1_000_000_000, validate: isMoneyAmount },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    images: { type: [String], default: [], validate: { validator: (value: string[]) => value.length <= 5, message: "A product can have at most five images" } },
    tags: { type: [String], default: [], validate: { validator: (value: string[]) => value.length <= 20 && value.every((tag) => tag.length <= 40), message: "Products can have at most 20 tags, each up to 40 characters" } },
    stock: { type: Number, required: true, min: 0, max: 1_000_000_000, default: 0, validate: Number.isSafeInteger },
    variants: { type: [productVariantSchema], default: [], validate: { validator: (value: IProductVariant[]) => value.length <= 50, message: "A product can have at most 50 variants" } },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

productSchema.pre("validate", function () {
  if (this.discountPrice !== undefined && this.discountPrice >= this.price) {
    this.invalidate("discountPrice", "Discount price must be below the regular price");
  }

  const labels = new Set<string>();
  const skus = new Set<string>();
  let totalVariantStock = 0;
  for (const variant of this.variants) {
    if (variant.discountPrice !== undefined && variant.discountPrice >= variant.price) {
      this.invalidate("variants", `Variant discount for "${variant.label}" must be below its regular price`);
    }
    const normalizedLabel = variant.label.trim().toLowerCase();
    if (labels.has(normalizedLabel)) {
      this.invalidate("variants", "Variant labels must be unique within a product");
    }
    labels.add(normalizedLabel);

    const normalizedSku = variant.sku?.trim().toLowerCase();
    if (normalizedSku) {
      if (skus.has(normalizedSku)) this.invalidate("variants", "Variant SKUs must be unique within a product");
      skus.add(normalizedSku);
    }
    totalVariantStock += variant.stock;
  }

  if (this.variants.length > 0) {
    if (!Number.isSafeInteger(totalVariantStock) || totalVariantStock > 1_000_000_000) {
      this.invalidate("variants", "Combined variant stock cannot exceed 1000000000");
    }
    if (this.stock !== totalVariantStock) {
      this.invalidate("stock", "Product stock must equal the total stock across its variants");
    }
    if (this.discountPrice !== undefined) {
      this.invalidate("discountPrice", "Products with variants must set discounts on each variant");
    }
    const minimumEffectivePrice = Math.min(...this.variants.map((variant) =>
      variant.discountPrice !== undefined && variant.discountPrice < variant.price
        ? variant.discountPrice
        : variant.price
    ));
    if (toMinorUnits(this.price) !== toMinorUnits(minimumEffectivePrice)) {
      this.invalidate("price", "Product price must match the lowest effective variant price");
    }
  }
});

productSchema.index({ name: "text", description: "text", tags: "text" });

export default model<IProduct>("Product", productSchema);
