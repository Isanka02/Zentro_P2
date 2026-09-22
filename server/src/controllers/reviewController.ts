import { Request, Response } from "express";
import { Types } from "mongoose";
import Review from "../models/Review";
import Product from "../models/Product";

const recalculateProductRating = async (productId: Types.ObjectId) => {
  const reviews = await Review.find({ product: productId });
  const numReviews = reviews.length;
  const rating =
    numReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews).toFixed(1))
      : 0;

  await Product.findByIdAndUpdate(productId, { rating, numReviews });
};

export const createReview = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const productId = req.params.productId as string;
    const { rating, comment } = req.body;

    if (!productId || !Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({ message: "Review comment is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
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
    });

    await recalculateProductRating(product._id);

    const populatedReview = await review.populate("user", "name avatar");

    return res.status(201).json({
      message: "Review submitted successfully",
      review: populatedReview,
    });
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to submit review",
    });
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;

    if (!productId || !Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const reviews = await Review.find({ product: productId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    return res.json({ reviews });
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to fetch reviews",
    });
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
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to delete review",
    });
  }
};
