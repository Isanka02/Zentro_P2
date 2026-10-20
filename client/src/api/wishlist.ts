import { api } from "./axios";

interface WishlistResponse {
  productIds: string[];
}

export const getMyWishlist = async (): Promise<string[]> => {
  const response = await api.get<WishlistResponse>("/wishlist");
  return response.data.productIds;
};

export const toggleMyWishlistProduct = async (productId: string): Promise<string[]> => {
  const response = await api.post<WishlistResponse>(`/wishlist/${productId}/toggle`);
  return response.data.productIds;
};

export const importMyWishlist = async (productIds: string[]): Promise<string[]> => {
  const response = await api.post<WishlistResponse>("/wishlist/import", { productIds });
  return response.data.productIds;
};
