import { Request, Response } from "express";
import Order from "../models/Order";
import Product from "../models/Product";
import User from "../models/User";

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [
      totalOrders,
      ordersByStatus,
      revenueResult,
      totalProducts,
      lowStockCount,
      totalUsers,
      recentOrders,
    ] = await Promise.all([
      // Total order count
      Order.countDocuments(),

      // Orders grouped by status
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Total revenue (sum of all non-cancelled order totals)
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // Total product count
      Product.countDocuments(),

      // Products with stock <= 5 (low stock alert)
      Product.countDocuments({ stock: { $lte: 5 } }),

      // Total registered user count
      User.countDocuments(),

      // Most recent 5 orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber shippingAddress total status createdAt paymentMethod items"),
    ]);

    // Build status map from aggregation result
    const statusMap: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const s of ordersByStatus) {
      if (s._id && s._id in statusMap) {
        statusMap[s._id] = s.count;
      }
    }

    const totalRevenue = revenueResult[0]?.total ?? 0;

    return res.json({
      totalOrders,
      totalRevenue,
      totalProducts,
      lowStockCount,
      totalUsers,
      ordersByStatus: statusMap,
      recentOrders,
    });
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to fetch dashboard stats",
    });
  }
};
