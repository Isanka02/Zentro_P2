import { Schema, model, Document, Types } from "mongoose";

export type ReturnStatus = "requested" | "approved" | "rejected" | "received" | "refunded";
export type ManualRefundMethod = "cash" | "bank_transfer";

export interface IReturnRequest extends Document {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  user: Types.ObjectId;
  reason: string;
  details?: string;
  status: ReturnStatus;
  adminNote?: string;
  refundAmount?: number;
  refundMethod?: ManualRefundMethod;
  refundReference?: string;
  returnCarrier?: string;
  returnTrackingNumber?: string;
  returnTrackingUrl?: string;
  returnEstimatedPickup?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const returnRequestSchema = new Schema<IReturnRequest>({
  order: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  reason: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
  details: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ["requested", "approved", "rejected", "received", "refunded"], default: "requested", required: true },
  adminNote: { type: String, trim: true, maxlength: 1000 },
  refundAmount: { type: Number, min: 0 },
  refundMethod: { type: String, enum: ["cash", "bank_transfer"] },
  refundReference: { type: String, trim: true, maxlength: 100 },
  returnCarrier: { type: String, trim: true, maxlength: 80 },
  returnTrackingNumber: { type: String, trim: true, maxlength: 100 },
  returnTrackingUrl: { type: String, trim: true, maxlength: 2048 },
  returnEstimatedPickup: { type: Date },
}, { timestamps: true });

returnRequestSchema.index({ status: 1, createdAt: -1 });

export default model<IReturnRequest>("ReturnRequest", returnRequestSchema);
