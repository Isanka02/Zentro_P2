import { Request, Response } from "express";
import Product from "../models/Product";
import { uploadImageBuffer } from "../config/cloudinary";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      sort,
      page = "1",
      limit = "12",
    } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};

    if (keyword) {
      filter.$text = { $search: keyword };
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 }; // default: featured/newest-ish
    switch (sort) {
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      case "rating":
        sortOption = { rating: -1 };
        break;
      case "featured":
        sortOption = { isFeatured: -1, createdAt: -1 };
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).populate("category", "name slug").sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: (err as Error).message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name slug");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ product });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch product", error: (err as Error).message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      category,
      tags,
      stock,
      isFeatured,
    } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({
        message: "Name, description, price, and category are required",
      });
    }

    const files = (req.files as Express.Multer.File[]) || [];

    const imageUrls = await Promise.all(
      files.map((file) => uploadImageBuffer(file.buffer))
    );

    const product = await Product.create({
      name,
      description,
      price,
      discountPrice,
      category,
      images: imageUrls,
      tags: Array.isArray(tags)
        ? tags
        : tags
          ? String(tags)
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      stock: stock ?? 0,
      isFeatured: isFeatured === "true" || isFeatured === true,
    });

    const populatedProduct = await product.populate(
      "category",
      "name slug"
    );

    res.status(201).json({
      product: populatedProduct,
    });
  } catch (err) {
    console.error("Create product error:", err);

    res.status(500).json({
      message: "Failed to create product",
      error: (err as Error).message,
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const {
      name,
      description,
      price,
      discountPrice,
      category,
      tags,
      stock,
      isFeatured,
      existingImages,
    } = req.body;

    const files = (req.files as Express.Multer.File[]) || [];

    const uploadedImageUrls = await Promise.all(
      files.map((file) => uploadImageBuffer(file.buffer))
    );

    let keptImages: string[] = [];

    if (existingImages) {
      try {
        keptImages =
          typeof existingImages === "string"
            ? JSON.parse(existingImages)
            : existingImages;
      } catch {
        keptImages = [];
      }
    }

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.discountPrice =
      discountPrice === ""
        ? undefined
        : discountPrice ?? product.discountPrice;
    product.category = category ?? product.category;

    product.tags = Array.isArray(tags)
      ? tags
      : tags
        ? String(tags)
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : product.tags;

    product.stock = stock ?? product.stock;

    product.isFeatured =
      isFeatured === "true"
        ? true
        : isFeatured === "false"
          ? false
          : isFeatured ?? product.isFeatured;

    product.images = [
      ...keptImages,
      ...uploadedImageUrls,
    ];

    await product.save();

    const populatedProduct = await product.populate(
      "category",
      "name slug"
    );

    res.status(200).json({
      product: populatedProduct,
    });
  } catch (err) {
    console.error("Update product error:", err);

    res.status(500).json({
      message: "Failed to update product",
      error: (err as Error).message,
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product", error: (err as Error).message });
  }
};