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
        .select(
          "orderNumber shippingAddress total status createdAt paymentMethod items"
        ),
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
      message:
        err instanceof Error
          ? err.message
          : "Failed to fetch dashboard stats",
    });
  }
};

// ============================================================
// ADMIN USER MANAGEMENT
// ============================================================

export const getAllUsersAdmin = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      page = "1",
      limit = "20",
      search = "",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit, 10) || 20)
    );

    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};

    // Search users by name or email
    if (search.trim()) {
      const searchRegex = {
        $regex: search.trim(),
        $options: "i",
      };

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),

      User.countDocuments(filter),
    ]);

    return res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return res.status(500).json({
      message:
        err instanceof Error
          ? err.message
          : "Failed to fetch users",
    });
  }
};

export const updateUserRoleAdmin = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (role !== "customer" && role !== "admin") {
      return res.status(400).json({
        message: "Role must be either customer or admin",
      });
    }

    // Validate user ID parameter
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    // Prevent an admin from changing their own role
    if (req.user?._id.toString() === id) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.role = role;

    await user.save();

    return res.json({
      message: "User role updated successfully",
      user,
    });
  } catch (err) {
    return res.status(500).json({
      message:
        err instanceof Error
          ? err.message
          : "Failed to update user role",
    });
  }
};