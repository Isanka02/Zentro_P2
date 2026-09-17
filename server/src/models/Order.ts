import { Schema, model, Document, Types } from "mongoose";
import { OrderStatus } from "../types/index";

interface IOrderItem {
  product: Types.ObjectId;
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
  total: number;
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    district: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: false },
    orderNumber: { type: String, required: true, unique: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, required: true },
    paymentIntentId: { type: String },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountCode: { type: String },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    trackingNumber: { type: String },
    carrier: { type: String },
    estimatedDelivery: { type: Date },
  },
  { timestamps: true }
);

export default model<IOrder>("Order", orderSchema);