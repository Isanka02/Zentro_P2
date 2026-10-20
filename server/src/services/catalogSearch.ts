import Product from "../models/Product";
import { escapeRegex } from "../utils/escapeRegex";

export type ProductSort = "relevance" | "newest" | "price_asc" | "price_desc" | "rating" | "featured";

export interface CatalogSearchInput {
  keyword?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  tag?: string;
  featuredOnly?: boolean;
  sort?: ProductSort;
  page: number;
  limit: number;
}

const legacyEffectivePriceExpression = {
  $cond: [
    { $and: [
      { $ne: [{ $ifNull: ["$discountPrice", null] }, null] },
      { $lt: ["$discountPrice", "$price"] },
    ] },
    "$discountPrice",
    "$price",
  ],
};

const variantEffectivePriceExpression = {
  $min: {
    $map: {
      input: "$variants",
      as: "variant",
      in: {
        $cond: [
          { $and: [
            { $ne: [{ $ifNull: ["$$variant.discountPrice", null] }, null] },
            { $lt: ["$$variant.discountPrice", "$$variant.price"] },
          ] },
          "$$variant.discountPrice",
          "$$variant.price",
        ],
      },
    },
  },
};

const effectivePriceExpression = {
  $cond: [
    { $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] },
    variantEffectivePriceExpression,
    legacyEffectivePriceExpression,
  ],
};

const runCatalogSearch = async (input: CatalogSearchInput, includeArchived: boolean) => {
  const keyword = input.keyword?.trim();
  const filter: Record<string, any> = {};
  if (!includeArchived) filter.isActive = { $ne: false };
  if (input.featuredOnly) filter.isFeatured = true;
  if (keyword) filter.$text = { $search: keyword };
  if (input.categoryId) filter.category = input.categoryId;
  if (input.inStock) filter.stock = { $gt: 0 };
  if (input.minRating !== undefined) filter.rating = { $gte: input.minRating };
  if (input.tag) filter.tags = { $regex: `^${escapeRegex(input.tag)}$`, $options: "i" };

  if (input.minPrice !== undefined || input.maxPrice !== undefined) {
    const priceRange: Record<string, unknown>[] = [];
    if (input.minPrice !== undefined) priceRange.push({ $gte: [effectivePriceExpression, input.minPrice] });
    if (input.maxPrice !== undefined) priceRange.push({ $lte: [effectivePriceExpression, input.maxPrice] });
    filter.$expr = { $and: priceRange };
  }

  const sort = input.sort ?? (keyword ? "relevance" : "featured");
  let sortOption: Record<string, 1 | -1 | { $meta: "textScore" }>;
  switch (sort) {
    case "relevance":
      sortOption = keyword ? { score: { $meta: "textScore" } } : { isFeatured: -1, createdAt: -1 };
      break;
    case "newest":
      sortOption = { createdAt: -1 };
      break;
    case "price_asc":
      sortOption = { _effectivePrice: 1 };
      break;
    case "price_desc":
      sortOption = { _effectivePrice: -1 };
      break;
    case "rating":
      sortOption = { rating: -1 };
      break;
    case "featured":
      sortOption = { isFeatured: -1, createdAt: -1 };
      break;
  }

  const page = input.page;
  const limit = Math.min(100, input.limit);
  const skip = (page - 1) * limit;
  const queryProducts = sort === "price_asc" || sort === "price_desc"
    ? Product.aggregate([
        { $match: filter },
        { $addFields: { _effectivePrice: effectivePriceExpression } },
        { $sort: sortOption },
        { $skip: skip },
        { $limit: limit },
        { $project: { _effectivePrice: 0 } },
      ]).then((products) => Product.populate(products, { path: "category", select: "name slug" }))
    : Product.find(filter).populate("category", "name slug").sort(sortOption).skip(skip).limit(limit);

  const [products, total] = await Promise.all([queryProducts, Product.countDocuments(filter)]);
  return {
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/** Searches products visible to shoppers; suitable for a future product-assistant tool. */
export const searchCatalog = (input: CatalogSearchInput) => runCatalogSearch(input, false);

/** Searches all catalog records for the authenticated admin catalog. */
export const searchAdminCatalog = (input: CatalogSearchInput) => runCatalogSearch(input, true);
