import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "../api/categories";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // categories change rarely, cache 5 min
  });
};