import { useQuery } from "@tanstack/react-query";
import { fetchProductById } from "../api/products";

export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id as string),
    enabled: !!id,
  });
};