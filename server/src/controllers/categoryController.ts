import { Request, Response } from "express";
import { Types } from "mongoose";
import Category from "../models/Category";
import Product from "../models/Product";

const normalizeCategoryName = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 60 ? name : null;
};

const normalizeCategorySlug = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const slug = value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug.length >= 2 && slug.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ? slug
    : null;
};

const categorySlugError = "Category slug must be 2–80 lowercase letters or numbers separated by single hyphens";

const isDuplicateKey = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000;

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ categories });
  } catch {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const name = normalizeCategoryName(req.body?.name);
    if (!name) {
      return res.status(400).json({ message: "Category name must be between 2 and 60 characters" });
    }

    const slug = normalizeCategorySlug(req.body?.slug ?? name);
    if (!slug) return res.status(400).json({ message: categorySlugError });

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(409).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name, slug });
    res.status(201).json({ category });
  } catch (err) {
    if (isDuplicateKey(err)) return res.status(409).json({ message: "Category already exists" });
    res.status(500).json({ message: "Failed to create category" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid category ID" });
    const name = normalizeCategoryName(req.body?.name);
    if (!name) return res.status(400).json({ message: "Category name must be between 2 and 60 characters" });
    const slug = normalizeCategorySlug(req.body?.slug ?? name);
    if (!slug) return res.status(400).json({ message: categorySlugError });

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.name = name;
    category.slug = slug;
    await category.save();

    res.status(200).json({ category });
  } catch (err) {
    if (isDuplicateKey(err)) return res.status(409).json({ message: "Category already exists" });
    res.status(500).json({ message: "Failed to update category" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid category ID" });
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (await Product.exists({ category: category._id })) {
      return res.status(409).json({ message: "Move or remove this category’s products before deleting it" });
    }
    await category.deleteOne();
    res.status(200).json({ message: "Category deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete category" });
  }
};
