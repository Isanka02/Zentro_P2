import { Request, Response } from "express";
import Product from "../models/Product";
import Order from "../models/Order";
import { Types } from "mongoose";
import Category from "../models/Category";
import { uploadImageBuffer } from "../config/cloudinary";
import { isMoneyAmount } from "../utils/money";
import { getRequestBody } from "../utils/requestBody";
import { searchAdminCatalog, searchCatalog, type ProductSort } from "../services/catalogSearch";

const parseProductFields = (body: Record<string, unknown>) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const parseNumber = (value: unknown) =>
    typeof value === "number" || (typeof value === "string" && value.trim() !== "")
      ? Number(value)
      : Number.NaN;
  const parseVariants = (raw: unknown): { error: string } | { value: Array<{ _id?: string; label: string; sku?: string; price: number; discountPrice?: number; stock: number }> } => {
    if (raw === undefined || raw === "") return { value: [] };
    let value: unknown = raw;
    if (typeof raw === "string") {
      try { value = JSON.parse(raw) as unknown; } catch { return { error: "Product variants are invalid JSON" }; }
    }
    if (!Array.isArray(value) || value.length > 50) return { error: "A product can have at most 50 variants" };
    const labels = new Set<string>();
    const skus = new Set<string>();
    const variantIds = new Set<string>();
    const variants = [];
    for (const rawVariant of value) {
      if (!rawVariant || typeof rawVariant !== "object" || Array.isArray(rawVariant)) return { error: "Each variant must be an object" };
      const variant = rawVariant as Record<string, unknown>;
      const label = typeof variant.label === "string" ? variant.label.trim() : "";
      const sku = typeof variant.sku === "string" && variant.sku.trim() ? variant.sku.trim() : undefined;
      const variantPrice = parseNumber(variant.price);
      const variantDiscountPrice = variant.discountPrice === undefined || variant.discountPrice === "" ? undefined : parseNumber(variant.discountPrice);
      const variantStock = parseNumber(variant.stock);
      const id = variant._id;
      if (id !== undefined && (typeof id !== "string" || !Types.ObjectId.isValid(id))) return { error: "A variant ID is invalid" };
      if (typeof id === "string") {
        if (variantIds.has(id)) return { error: "A variant ID cannot appear more than once" };
        variantIds.add(id);
      }
      if (!label || label.length > 80) return { error: "Variant labels must be between 1 and 80 characters" };
      const normalizedLabel = label.toLowerCase();
      if (labels.has(normalizedLabel)) return { error: "Variant labels must be unique within a product" };
      labels.add(normalizedLabel);
      if (sku && sku.length > 40) return { error: "Variant SKUs must be 40 characters or fewer" };
      if (sku) {
        const normalizedSku = sku.toLowerCase();
        if (skus.has(normalizedSku)) return { error: "Variant SKUs must be unique within a product" };
        skus.add(normalizedSku);
      }
      if (!isMoneyAmount(variantPrice)) return { error: `Variant "${label}" needs a valid LKR price` };
      if (variantDiscountPrice !== undefined && (!isMoneyAmount(variantDiscountPrice) || variantDiscountPrice >= variantPrice)) {
        return { error: `Variant "${label}" discount must be below its price` };
      }
      if (!Number.isSafeInteger(variantStock) || variantStock < 0 || variantStock > 1_000_000_000) {
        return { error: `Variant "${label}" stock must be a whole number from 0 to 1000000000` };
      }
      variants.push({ ...(id ? { _id: id } : {}), label, ...(sku ? { sku } : {}), price: variantPrice, discountPrice: variantDiscountPrice, stock: variantStock });
    }
    const totalStock = variants.reduce((total, variant) => total + variant.stock, 0);
    if (!Number.isSafeInteger(totalStock) || totalStock > 1_000_000_000) return { error: "Combined variant stock cannot exceed 1000000000" };
    return { value: variants };
  };
  const parsedVariants = parseVariants(body.variants);
  if ("error" in parsedVariants) return parsedVariants;
  const variants = parsedVariants.value;
  const suppliedPrice = parseNumber(body.price);
  const suppliedDiscountPrice = body.discountPrice === undefined || body.discountPrice === "" ? undefined : parseNumber(body.discountPrice);
  const price = variants.length
    ? Math.min(...variants.map((variant) => variant.discountPrice ?? variant.price))
    : suppliedPrice;
  const discountPrice = variants.length ? undefined : suppliedDiscountPrice;
  const category = typeof body.category === "string" ? body.category : "";
  const suppliedStock = body.stock === undefined ? 0 : parseNumber(body.stock);
  const stock = variants.length ? variants.reduce((total, variant) => total + variant.stock, 0) : suppliedStock;
  const rawTags: unknown[] = Array.isArray(body.tags)
    ? body.tags
    : typeof body.tags === "string"
      ? body.tags.split(",")
      : [];
  if (rawTags.some((tag) => typeof tag !== "string")) return { error: "Product tags must be text" } as const;
  const tags = rawTags.map((tag) => typeof tag === "string" ? tag.trim() : "").filter(Boolean);
  let isFeatured: boolean;
  if (body.isFeatured === true || body.isFeatured === "true") isFeatured = true;
  else if (body.isFeatured === false || body.isFeatured === "false" || body.isFeatured === undefined) isFeatured = false;
  else return { error: "Featured status must be true or false" } as const;

  if (name.length < 2 || name.length > 120) return { error: "Product name must be between 2 and 120 characters" } as const;
  if (!description || description.length > 5000) return { error: "Product description is required and must be 5000 characters or fewer" } as const;
  if (!isMoneyAmount(price)) return { error: "Product price must be a non-negative LKR amount with up to two decimals (maximum LKR 1,000,000,000)" } as const;
  if (discountPrice !== undefined && (!isMoneyAmount(discountPrice) || discountPrice >= price)) {
    return { error: "Discount price must be a valid LKR amount below the regular price" } as const;
  }
  if (!Types.ObjectId.isValid(category)) return { error: "Select a valid product category" } as const;
  if (!Number.isSafeInteger(stock) || stock < 0 || stock > 1_000_000_000) return { error: "Stock must be a whole number between 0 and 1000000000" } as const;
  if (tags.length > 20 || tags.some((tag) => tag.length > 40)) return { error: "Products can have at most 20 tags, each up to 40 characters" } as const;

  return { value: { name, description, price, discountPrice, category, stock, tags, isFeatured, variants } } as const;
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const queryKeys = ["keyword", "category", "minPrice", "maxPrice", "inStock", "minRating", "tag", "sort", "page", "limit", "featuredOnly"];
    queryKeys.push("includeInactive");
    if (queryKeys.some((key) => req.query[key] !== undefined && typeof req.query[key] !== "string")) {
      return res.status(400).json({ message: "Search parameters must each have one text value" });
    }
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      inStock,
      minRating,
      tag,
      sort,
      page = "1",
      limit = "12",
      includeInactive = "false",
    } = req.query as Record<string, string>;

    if (includeInactive !== "true" && includeInactive !== "false") {
      return res.status(400).json({ message: "includeInactive must be true or false" });
    }
    const featuredOnly = req.query.featuredOnly === "true";
    if (req.query.featuredOnly !== undefined && req.query.featuredOnly !== "true" && req.query.featuredOnly !== "false") {
      return res.status(400).json({ message: "featuredOnly must be true or false" });
    }
    if (includeInactive === "true" && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access is required to view archived products" });
    }

    const pageValue = Number(page);
    const limitValue = Number(limit);
    if (!Number.isSafeInteger(pageValue) || pageValue < 1 || pageValue > 100000) {
      return res.status(400).json({ message: "Page must be a whole number between 1 and 100000" });
    }
    if (!Number.isSafeInteger(limitValue) || limitValue < 1) {
      return res.status(400).json({ message: "Limit must be a positive whole number" });
    }

    const minPriceValue = minPrice === undefined || minPrice === "" ? undefined : Number(minPrice);
    const maxPriceValue = maxPrice === undefined || maxPrice === "" ? undefined : Number(maxPrice);
    if ((minPriceValue !== undefined && (!Number.isFinite(minPriceValue) || minPriceValue < 0)) ||
        (maxPriceValue !== undefined && (!Number.isFinite(maxPriceValue) || maxPriceValue < 0)) ||
        (minPriceValue !== undefined && maxPriceValue !== undefined && minPriceValue > maxPriceValue)) {
      return res.status(400).json({ message: "Price filters must be valid non-negative values with minimum not greater than maximum" });
    }

    if (inStock !== undefined && inStock !== "true" && inStock !== "false") {
      return res.status(400).json({ message: "inStock must be true or false" });
    }
    const minRatingValue = minRating === undefined || minRating === "" ? undefined : Number(minRating);
    if (minRatingValue !== undefined && (!Number.isFinite(minRatingValue) || minRatingValue < 0 || minRatingValue > 5)) {
      return res.status(400).json({ message: "Minimum rating must be between 0 and 5" });
    }
    const normalizedTag = tag?.trim();
    if (normalizedTag && (normalizedTag.length > 40 || /[\r\n\0]/.test(normalizedTag))) {
      return res.status(400).json({ message: "Product tag must be 40 characters or fewer" });
    }

    if (keyword && keyword.length > 100) {
      return res.status(400).json({ message: "Search text must be 100 characters or fewer" });
    }
    const normalizedKeyword = keyword?.trim();
    const allowedSorts = ["relevance", "newest", "price_asc", "price_desc", "rating", "featured"];
    if (sort && !allowedSorts.includes(sort)) {
      return res.status(400).json({ message: "Unsupported product sort option" });
    }
    let categoryId: string | undefined;
    if (category && category !== "all") {
      if (Types.ObjectId.isValid(category)) {
        categoryId = category;
      } else {
        const matchingCategory = await Category.findOne({ slug: category }).select("_id").lean();
        if (!matchingCategory) return res.status(400).json({ message: "Invalid category" });
        categoryId = matchingCategory._id.toString();
      }
    }
    const search = includeInactive === "true" ? searchAdminCatalog : searchCatalog;
    const result = await search({
      keyword: normalizedKeyword,
      categoryId,
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
      inStock: inStock === "true",
      minRating: minRatingValue,
      tag: normalizedTag || undefined,
      featuredOnly,
      sort: sort as ProductSort | undefined,
      page: pageValue,
      limit: limitValue,
    });

    return res.status(200).json(result);
  } catch {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findOne({ _id: id, isActive: { $ne: false } }).populate("category", "name slug");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ product });
  } catch {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const body = getRequestBody(req.body);
    const parsed = parseProductFields(body);
    if ("error" in parsed) return res.status(400).json({ message: parsed.error });
    const fields = parsed.value;
    if (fields.variants.some((variant) => variant._id)) {
      return res.status(400).json({ message: "New products cannot reuse variant IDs" });
    }
    if (!(await Category.exists({ _id: fields.category }))) return res.status(400).json({ message: "Select an existing product category" });

    const files = (req.files as Express.Multer.File[]) || [];

    const imageUrls = await Promise.all(
      files.map((file) => uploadImageBuffer(file.buffer))
    );

    const product = await Product.create({
      ...fields,
      images: imageUrls,
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
    return res.status(500).json({ message: "Failed to create product" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const body = getRequestBody(req.body);
    const parsed = parseProductFields(body);
    if ("error" in parsed) return res.status(400).json({ message: parsed.error });
    const fields = parsed.value;
    const existingVariantIds = new Set(product.variants.map((variant) => variant._id.toString()));
    const submittedVariantIds = new Set(fields.variants.flatMap((variant) => variant._id ? [variant._id] : []));
    if ([...submittedVariantIds].some((variantId) => !existingVariantIds.has(variantId))) {
      return res.status(400).json({ message: "A variant does not belong to this product" });
    }
    const removedVariantIds = [...existingVariantIds].filter((variantId) => !submittedVariantIds.has(variantId));
    if (removedVariantIds.length && await Order.exists({
      status: { $in: ["pending", "confirmed"] },
      "items.variantId": { $in: removedVariantIds },
    })) {
      return res.status(409).json({ message: "A variant in an active order cannot be removed" });
    }
    if (!(await Category.exists({ _id: fields.category }))) return res.status(400).json({ message: "Select an existing product category" });

    const files = (req.files as Express.Multer.File[]) || [];

    let keptImages: unknown;
    try {
      keptImages = typeof body.existingImages === "string"
        ? JSON.parse(body.existingImages)
        : body.existingImages;
    } catch {
      return res.status(400).json({ message: "Existing product images are invalid" });
    }
    if (!Array.isArray(keptImages) || keptImages.length + files.length > 5 ||
        keptImages.some((image) => typeof image !== "string" || !product.images.includes(image))) {
      return res.status(400).json({ message: "Choose at most five images already attached to this product or upload new images" });
    }

    const uploadedImageUrls = await Promise.all(
      files.map((file) => uploadImageBuffer(file.buffer))
    );
    product.set({ ...fields, images: [...keptImages, ...uploadedImageUrls] });

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
    return res.status(500).json({ message: "Failed to update product" });
  }
};

export const updateProductAvailability = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid product ID" });
    const body = getRequestBody(req.body);
    if (typeof body.isActive !== "boolean") {
      return res.status(400).json({ message: "Availability must be true or false" });
    }
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { isActive: body.isActive } },
      { new: true, runValidators: true }
    ).populate("category", "name slug");
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json({ message: product.isActive ? "Product restored to the store" : "Product archived", product });
  } catch {
    return res.status(500).json({ message: "Failed to update product availability" });
  }
};
