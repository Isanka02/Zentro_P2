import { Request, Response } from "express";
import Product from "../models/Product";

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
    const { name, description, price, discountPrice, category, images, tags, stock, isFeatured } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: "Name, description, price, and category are required" });
    }

    const product = await Product.create({
      name,
      description,
      price,
      discountPrice,
      category,
      images: images || [],
      tags: tags || [],
      stock: stock ?? 0,
      isFeatured: isFeatured ?? false,
    });

    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ message: "Failed to create product", error: (err as Error).message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product });
  } catch (err) {
    res.status(500).json({ message: "Failed to update product", error: (err as Error).message });
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