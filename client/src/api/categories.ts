import { api } from "./axios";

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export const fetchCategories = async (): Promise<Category[]> => {
  const res = await api.get<{ categories: Category[] }>("/categories");
  return res.data.categories;
};