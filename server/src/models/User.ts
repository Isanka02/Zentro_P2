import { Schema, model, Document, Types } from "mongoose";
import { UserRole } from "../types/index";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: UserRole;
  authVersion: number;
  wishlist: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password: { type: String, required: true, minlength: 12, select: false },
    phone: { type: String, trim: true, maxlength: 32 },
    address: { type: String, trim: true, maxlength: 300 },
    avatar: { type: String, trim: true, maxlength: 500_000 },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    wishlist: {
      type: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      default: [],
      validate: { validator: (items: Types.ObjectId[]) => items.length <= 200, message: "Wishlist can contain up to 200 products" },
    },
    authVersion: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default model<IUser>("User", userSchema);
