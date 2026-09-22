import { Request, Response } from "express";
import Order from "../models/Order";

export const getAllOrdersAdmin = async (req: Request, res: Response) => {
  try {
    const {
      status,
      page = "1",
      limit = "20",
      search,
    } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search?.trim()) {
      filter.$or = [
        { orderNumber: { $regex: search.trim(), $options: "i" } },
        { "shippingAddress.fullName": { $regex: search.trim(), $options: "i" } },
        { "shippingAddress.email": { $regex: search.trim(), $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("user", "name email"),
      Order.countDocuments(filter),
    ]);

    return res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to fetch orders",
    });
  }
};
