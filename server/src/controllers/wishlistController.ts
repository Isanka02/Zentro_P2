import { Request, Response } from "express";
import { Types } from "mongoose";
import Product from "../models/Product";
import User from "../models/User";
import { getRequestBody } from "../utils/requestBody";

export const getMyWishlist = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const savedIds = req.user.wishlist ?? [];
    const existingProducts = await Product.find({ _id: { $in: savedIds }, isActive: { $ne: false } }).select("_id");
    const existingIdSet = new Set(existingProducts.map((product) => product._id.toString()));
    const productIds = savedIds
      .map((id) => id.toString())
      .filter((id) => existingIdSet.has(id));

    if (productIds.length !== savedIds.length) {
      req.user.wishlist = productIds.map((id) => new Types.ObjectId(id));
      await req.user.save();
    }

    return res.json({ productIds });
  } catch {
    return res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};

export const importMyWishlist = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { productIds } = getRequestBody(req.body);
    if (!Array.isArray(productIds) || productIds.length > 200 || !productIds.every((id) => typeof id === "string" && Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: "Wishlist must contain up to 200 valid product IDs" });
    }

    const uniqueIds = [...new Set(productIds as string[])].map((id) => new Types.ObjectId(id));
    const existingProducts = await Product.find({ _id: { $in: uniqueIds }, isActive: { $ne: false } }).select("_id");
    const validIds = existingProducts.map((product) => product._id);
    const currentWishlist = new Set((req.user.wishlist ?? []).map((id) => id.toString()));
    const additionalCount = validIds.filter((id) => !currentWishlist.has(id.toString())).length;
    if (currentWishlist.size + additionalCount > 200) {
      return res.status(409).json({ message: "A wishlist can contain up to 200 products" });
    }
    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { wishlist: { $each: validIds } } }
    );

    const user = await User.findById(req.user._id).select("wishlist");
    return res.json({ productIds: (user?.wishlist ?? []).map((id) => id.toString()) });
  } catch {
    return res.status(500).json({ message: "Failed to import wishlist" });
  }
};
export const toggleMyWishlistProduct = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const productId = req.params.productId as string;
    if (!Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(productId).select("isActive");
    if (!product) return res.status(404).json({ message: "Product not found" });

    const id = new Types.ObjectId(productId);
    const alreadySaved = await User.exists({
      _id: req.user._id,
      wishlist: id,
    });

    if (alreadySaved) {
      await User.updateOne(
        { _id: req.user._id, wishlist: id },
        { $pull: { wishlist: id } }
      );
    } else {
      if (product.isActive === false) return res.status(404).json({ message: "Archived products cannot be added to a wishlist" });
      const result = await User.updateOne(
        {
          _id: req.user._id,
          wishlist: { $ne: id },
          $expr: { $lt: [{ $size: { $ifNull: ["$wishlist", []] } }, 200] },
        },
        { $addToSet: { wishlist: id } }
      );
      if (result.matchedCount === 0) {
        const latestUser = await User.findById(req.user._id).select("wishlist");
        if (!latestUser) return res.status(401).json({ message: "Not authenticated" });
        if (!latestUser.wishlist.some((savedId) => savedId.equals(id))) {
          return res.status(409).json({ message: "A wishlist can contain up to 200 products" });
        }
      }
    }

    const user = await User.findById(req.user._id).select("wishlist");
    const productIds = (user?.wishlist ?? []).map((savedId: Types.ObjectId) => savedId.toString());
    return res.json({ productIds });
  } catch {
    return res.status(500).json({ message: "Failed to update wishlist" });
  }
};
