import { Request, Response } from "express";
import Order from "../models/Order";
import Product from "../models/Product";
import User from "../models/User";
import { Types } from "mongoose";
import { getRequestBody } from "../utils/requestBody";
import { escapeRegex } from "../utils/escapeRegex";

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

      // Revenue includes only captured/received payments; pending bank transfers and COD orders are excluded.
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" }, isPaid: true } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // Active products available in the catalog (including legacy documents without isActive).
      Product.countDocuments({ isActive: { $ne: false } }),

      // Active products with stock <= 5 (low stock alert)
      Product.countDocuments({ isActive: { $ne: false }, stock: { $lte: 5 } }),

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
  } catch {
    return res.status(500).json({ message: "Failed to fetch dashboard stats" });
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
    for (const key of ["page", "limit", "search"] as const) {
      if (req.query[key] !== undefined && typeof req.query[key] !== "string") {
        return res.status(400).json({ message: "Search parameters must each have one text value" });
      }
    }
    const page = typeof req.query.page === "string" ? req.query.page : "1";
    const limit = typeof req.query.limit === "string" ? req.query.limit : "20";
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const pageNum = Number(page);
    const limitNum = Number(limit);
    if (!/^\d+$/.test(page) || !Number.isSafeInteger(pageNum) || pageNum < 1 || pageNum > 100000) {
      return res.status(400).json({ message: "Page must be a whole number between 1 and 100000" });
    }
    if (!/^\d+$/.test(limit) || !Number.isSafeInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ message: "Limit must be a whole number between 1 and 100" });
    }
    if (search.length > 100) return res.status(400).json({ message: "Search text must be 100 characters or fewer" });

    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};

    // Search users by name or email
    if (search.trim()) {
      const searchRegex = {
        $regex: escapeRegex(search.trim().slice(0, 100)),
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
  } catch {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const updateUserRoleAdmin = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { role } = getRequestBody(req.body);

    // Validate role
    if (role !== "customer" && role !== "admin") {
      return res.status(400).json({
        message: "Role must be either customer or admin",
      });
    }

    // Validate user ID parameter
    if (!id || Array.isArray(id) || !Types.ObjectId.isValid(id)) {
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

    if (user.role === "admin" && role === "customer") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(409).json({ message: "The last administrator cannot be demoted" });
      }
    }

    if (user.role !== role) {
      user.role = role;
      // Role changes must revoke sessions signed with the previous authorization state.
      user.authVersion += 1;
      await user.save();
    }

    return res.json({
      message: "User role updated successfully",
      user,
    });
  } catch {
    return res.status(500).json({ message: "Failed to update user role" });
  }
};
