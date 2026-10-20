import { api } from "./axios";

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  images: string[];
  tags: string[];
  stock: number;
  variants: ProductVariant[];
  rating: number;
  numReviews: number;
  isFeatured: boolean;
  isActive?: boolean;
  createdAt: string;
}

export interface ProductVariant {
  _id: string;
  label: string;
  sku?: string;
  price: number;
  discountPrice?: number;
  stock: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductQueryParams {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  tag?: string;
  sort?: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
  featuredOnly?: boolean;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  tags: string[];
  stock: number;
  isFeatured: boolean;
  variants: Array<Omit<ProductVariant, "_id"> & { _id?: string }>;
}

export const fetchProducts = async (
  params: ProductQueryParams
): Promise<ProductsResponse> => {
  const res = await api.get<ProductsResponse>("/products", {
    params,
  });

  return res.data;
};

export const fetchProductById = async (
  id: string
): Promise<Product> => {
  const res = await api.get<{ product: Product }>(
    `/products/${id}`
  );

  return res.data.product;
};

export const createProduct = async (
  data: ProductInput,
  imageFiles: File[]
): Promise<Product> => {
  const formData = new FormData();

  formData.append("name", data.name);
  formData.append("description", data.description);
  formData.append("price", String(data.price));
  formData.append("category", data.category);
  formData.append("stock", String(data.stock));
  formData.append("isFeatured", String(data.isFeatured));
  formData.append("variants", JSON.stringify(data.variants));

  if (data.discountPrice !== undefined) {
    formData.append(
      "discountPrice",
      String(data.discountPrice)
    );
  }

  formData.append("tags", data.tags.join(","));

  imageFiles.forEach((file) => {
    formData.append("images", file);
  });

  const res = await api.post<{ product: Product }>(
    "/products",
    formData
  );

  return res.data.product;
};

export const updateProduct = async (
  id: string,
  data: ProductInput,
  imageFiles: File[],
  existingImages: string[]
): Promise<Product> => {
  const formData = new FormData();

  formData.append("name", data.name);
  formData.append("description", data.description);
  formData.append("price", String(data.price));
  formData.append("category", data.category);
  formData.append("stock", String(data.stock));
  formData.append("isFeatured", String(data.isFeatured));
  formData.append("variants", JSON.stringify(data.variants));

  if (data.discountPrice !== undefined) {
    formData.append(
      "discountPrice",
      String(data.discountPrice)
    );
  }

  formData.append("tags", data.tags.join(","));

  formData.append(
    "existingImages",
    JSON.stringify(existingImages)
  );

  imageFiles.forEach((file) => {
    formData.append("images", file);
  });

  const res = await api.put<{ product: Product }>(
    `/products/${id}`,
    formData
  );

  return res.data.product;
};

export const setProductAvailability = async (
  id: string,
  isActive: boolean
): Promise<Product> => {
  const response = await api.patch<{ product: Product }>(`/products/${id}/availability`, { isActive });
  return response.data.product;
};
