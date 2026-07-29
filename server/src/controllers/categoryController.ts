import { Request, Response } from "express";
import Category from "../models/Category";

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories", error: (err as Error).message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const slug = name.toLowerCase().trim().replace(/\s+/g, "-");

    const existing = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      return res.status(409).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name, slug });
    res.status(201).json({ category });
  } catch (err) {
    res.status(500).json({ message: "Failed to create category", error: (err as Error).message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const updateData: { name?: string; slug?: string } = {};

    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().trim().replace(/\s+/g, "-");
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ category });
  } catch (err) {
    res.status(500).json({ message: "Failed to update category", error: (err as Error).message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category", error: (err as Error).message });
  }
};