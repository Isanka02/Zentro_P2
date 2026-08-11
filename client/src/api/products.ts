import { api } from "./axios";

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: { _id: string; name: string; slug: string };
  images: string[];
  tags: string[];
  stock: number;
  rating: number;
  numReviews: number;
  isFeatured: boolean;
  createdAt: string;
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
  sort?: string;
  page?: number;
  limit?: number;
}

export const fetchProducts = async (params: ProductQueryParams): Promise<ProductsResponse> => {
  const res = await api.get<ProductsResponse>("/products", { params });
  return res.data;
}

export const fetchProductById = async (id: string): Promise<Product> => {
  const res = await api.get<{ product: Product }>(`/products/${id}`);
  return res.data.product;
};