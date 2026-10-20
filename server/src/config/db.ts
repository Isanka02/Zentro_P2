import mongoose from "mongoose";
import Order from "../models/Order";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI as string;
    await mongoose.connect(uri);
    // Ensure unique order/idempotency constraints exist before HTTP traffic is accepted.
    await Order.createIndexes();
    console.log("MongoDB connected");
  } catch {
    throw new Error("MongoDB connection or required order-index initialization failed");
  }
};
