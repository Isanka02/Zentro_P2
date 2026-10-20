import { Schema, model, Document, Types } from "mongoose";
import { OrderStatus } from "../types/index";
import { isMoneyAmount, MAX_ORDER_AMOUNT, toMinorUnits } from "../utils/money";

interface IOrderItem {
  product: Types.ObjectId;
  variantId?: Types.ObjectId;
  variantLabel?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface IShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  district: string;
  postalCode: string;
  country: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user?: Types.ObjectId;
  orderNumber: string;
  idempotencyKey?: string;
  checkoutFingerprint?: string;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  paymentIntentId?: string;
  isPaid: boolean;
  paidAt?: Date;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discountAmount: number;
  discountCode?: string;
  discount?: Types.ObjectId;
  total: number;
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId },
    variantLabel: { type: String, maxlength: 80 },
    name: { type: String, required: true, maxlength: 120 },
    image: { type: String, default: "", maxlength: 2048 },
    price: { type: Number, required: true, min: 0, max: 1_000_000_000, validate: isMoneyAmount },
    quantity: { type: Number, required: true, min: 1, max: 100, validate: Number.isSafeInteger },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    email: { type: String, required: true, trim: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { type: String, required: true, trim: true, maxlength: 16, match: /^\+94[1-9]\d{8}$/ },
    address: { type: String, required: true, trim: true, minlength: 1, maxlength: 300 },
    city: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    province: { type: String, required: true, trim: true, minlength: 1, maxlength: 40 },
    district: { type: String, required: true, trim: true, minlength: 1, maxlength: 60 },
    postalCode: { type: String, required: true, trim: true, match: /^\d{5}$/ },
    country: { type: String, required: true, trim: true, enum: ["Sri Lanka"] },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: false },
    orderNumber: { type: String, required: true, unique: true },
    idempotencyKey: { type: String, maxlength: 100, select: false },
    checkoutFingerprint: { type: String, maxlength: 64, select: false },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: { validator: (items: IOrderItem[]) => items.length >= 1 && items.length <= 50, message: "An order must contain between 1 and 50 items" },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ["cod", "bank_transfer"], required: true },
    paymentIntentId: { type: String },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    subtotal: { type: Number, required: true, min: 0, max: MAX_ORDER_AMOUNT, validate: (value: number) => isMoneyAmount(value, MAX_ORDER_AMOUNT) },
    shippingCost: { type: Number, required: true, default: 0, min: 0, max: MAX_ORDER_AMOUNT, validate: (value: number) => isMoneyAmount(value, MAX_ORDER_AMOUNT) },
    tax: { type: Number, required: true, default: 0, min: 0, max: MAX_ORDER_AMOUNT, validate: (value: number) => isMoneyAmount(value, MAX_ORDER_AMOUNT) },
    discountAmount: { type: Number, default: 0, min: 0, max: MAX_ORDER_AMOUNT, validate: (value: number) => isMoneyAmount(value, MAX_ORDER_AMOUNT) },
    discountCode: { type: String },
    discount: { type: Schema.Types.ObjectId, ref: "Discount" },
    total: { type: Number, required: true, min: 0, max: MAX_ORDER_AMOUNT, validate: (value: number) => isMoneyAmount(value, MAX_ORDER_AMOUNT) },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    trackingNumber: { type: String },
    carrier: { type: String },
    trackingUrl: { type: String, maxlength: 2048 },
    estimatedDelivery: { type: Date },
  },
  { timestamps: true }
);

orderSchema.pre("validate", function () {
  if (!isMoneyAmount(this.subtotal, MAX_ORDER_AMOUNT) ||
      !isMoneyAmount(this.shippingCost, MAX_ORDER_AMOUNT) ||
      !isMoneyAmount(this.tax, MAX_ORDER_AMOUNT) ||
      !isMoneyAmount(this.discountAmount, MAX_ORDER_AMOUNT) ||
      !isMoneyAmount(this.total, MAX_ORDER_AMOUNT)) return;

  if (this.discountAmount > this.subtotal) {
    this.invalidate("discountAmount", "Order discount cannot exceed the subtotal");
  }

  const expectedTotal = Math.max(0, toMinorUnits(this.subtotal) + toMinorUnits(this.shippingCost) + toMinorUnits(this.tax) - toMinorUnits(this.discountAmount));
  if (toMinorUnits(this.total) !== expectedTotal) {
    this.invalidate("total", "Order total must match its subtotal, shipping, tax, and discount");
  }
});

orderSchema.index({ user: 1, status: 1, "items.product": 1 });
orderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export default model<IOrder>("Order", orderSchema);
