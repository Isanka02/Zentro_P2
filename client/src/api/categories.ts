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

export const createCategory = async (
  data: { name: string; slug: string }
): Promise<Category> => {
  const res = await api.post<{ category: Category }>("/categories", data);

  return res.data.category;
};

export const updateCategory = async (
  id: string,
  data: { name?: string; slug?: string }
): Promise<Category> => {
  const res = await api.put<{ category: Category }>(
    `/categories/${id}`,
    data
  );

  return res.data.category;
};

export const deleteCategory = async (
  id: string
): Promise<void> => {
  await api.delete(`/categories/${id}`);
};