import { Request, Response } from "express";
import { Types } from "mongoose";
import Review from "../models/Review";
import Product from "../models/Product";
import Order from "../models/Order";
import { getRequestBody } from "../utils/requestBody";

const recalculateProductRating = async (productId: Types.ObjectId) => {
  const [stats] = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: null, numReviews: { $sum: 1 }, rating: { $avg: "$rating" } } },
  ]);
  const numReviews = stats?.numReviews ?? 0;
  const rating = stats ? Number(stats.rating.toFixed(1)) : 0;

  await Product.findByIdAndUpdate(productId, { rating, numReviews });
};

export const createReview = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const productId = req.params.productId as string;
    const { rating, comment } = getRequestBody(req.body);

    if (!productId || !Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({ message: "Review comment is required" });
    }
    if (comment.trim().length > 2000) return res.status(400).json({ message: "Review comment must be 2000 characters or fewer" });

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const deliveredPurchase = await Order.exists({
      user: req.user._id,
      status: "delivered",
      "items.product": product._id,
    });

    if (!deliveredPurchase) {
      return res.status(403).json({ message: "You can review this product after your order has been delivered" });
    }

    const existingReview = await Review.findOne({
      product: product._id,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    const review = await Review.create({
      product: product._id,
      user: req.user._id,
      rating,
      comment: comment.trim(),
      verifiedPurchase: true,
    });

    await recalculateProductRating(product._id);

    const populatedReview = await review.populate("user", "name avatar");

    return res.status(201).json({
      message: "Review submitted successfully",
      review: populatedReview,
    });
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
      return res.status(409).json({ message: "You have already reviewed this product" });
    }
    return res.status(500).json({ message: "Failed to submit review" });
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;

    if (!productId || !Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const pageValue = Number(req.query.page ?? 1);
    if (!Number.isSafeInteger(pageValue) || pageValue < 1 || pageValue > 100000) {
      return res.status(400).json({ message: "Page must be a whole number between 1 and 100000" });
    }
    const limit = 10;
    const filter = { product: productId };
    const [reviews, total, hasReviewed] = await Promise.all([
      Review.find(filter)
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .skip((pageValue - 1) * limit)
      .limit(limit),
      Review.countDocuments(filter),
      req.user ? Review.exists({ ...filter, user: req.user._id }) : Promise.resolve(false),
    ]);

    return res.json({
      reviews,
      hasReviewed: Boolean(hasReviewed),
      pagination: { page: pageValue, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id as string;

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    const productId = review.product;
    await review.deleteOne();
    await recalculateProductRating(productId);

    return res.json({ message: "Review deleted successfully" });
  } catch {
    return res.status(500).json({ message: "Failed to delete review" });
  }
};
