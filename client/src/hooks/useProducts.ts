import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../api/products";
import type { ProductQueryParams } from "../api/products";

export const useProducts = (params: ProductQueryParams) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts(params),
    placeholderData: (prev) => prev,
  });
};