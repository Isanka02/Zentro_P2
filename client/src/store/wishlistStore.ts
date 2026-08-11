import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  productIds: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],

      toggleWishlist: (productId) => {
        const exists = get().productIds.includes(productId);
        set({
          productIds: exists
            ? get().productIds.filter((id) => id !== productId)
            : [...get().productIds, productId],
        });
      },

      isWishlisted: (productId) => get().productIds.includes(productId),
    }),
    { name: "zentro-wishlist" }
  )
);