import { create } from "zustand";
import { getMyWishlist, importMyWishlist, toggleMyWishlistProduct } from "../api/wishlist";
import { useAuthStore } from "./authStore";

interface WishlistState {
  productIds: string[];
  isLoading: boolean;
  error: string | null;
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  loadForUser: (userId: string) => Promise<void>;
}

const guestStorageKey = "zentro-wishlist:guest";
const accountStorageKey = (userId: string) => `zentro-wishlist:${userId}`;

const readGuestWishlist = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(guestStorageKey) ?? "[]");
    return Array.isArray(parsed) && parsed.every((id) => typeof id === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
};

const saveGuestWishlist = (productIds: string[]) => {
  try {
    localStorage.setItem(guestStorageKey, JSON.stringify(productIds));
  } catch {
    // Guest wishlists remain available in memory if browser storage is unavailable.
  }
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  productIds: readGuestWishlist(),
  isLoading: false,
  error: null,

  loadForUser: async (userId) => {
    set({ productIds: [], isLoading: true, error: null });
    try {
      const legacyStored = localStorage.getItem(accountStorageKey(userId));
      let productIds: string[];
      if (legacyStored) {
        try {
          const parsed: unknown = JSON.parse(legacyStored);
          const legacyIds = Array.isArray(parsed) && parsed.every((id) => typeof id === "string") ? parsed : [];
          productIds = await importMyWishlist(legacyIds);
          localStorage.removeItem(accountStorageKey(userId));
        } catch {
          productIds = await getMyWishlist();
        }
      } else {
        productIds = await getMyWishlist();
      }
      if (useAuthStore.getState().user?.id === userId) {
        set({ productIds, isLoading: false });
      }
    } catch (err) {
      if (useAuthStore.getState().user?.id === userId) {
        set({
          productIds: [],
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load wishlist",
        });
      }
    }
  },

  toggleWishlist: async (productId) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      const currentIds = get().productIds;
      const productIds = currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId];
      set({ productIds, error: null });
      saveGuestWishlist(productIds);
      return;
    }

    set({ error: null });
    try {
      const productIds = await toggleMyWishlistProduct(productId);
      if (useAuthStore.getState().user?.id === userId) set({ productIds });
    } catch (err) {
      if (useAuthStore.getState().user?.id === userId) {
        set({ error: err instanceof Error ? err.message : "Failed to update wishlist" });
      }
    }
  },

  isWishlisted: (productId) => get().productIds.includes(productId),
}));

useAuthStore.subscribe((state, previousState) => {
  const userId = state.user?.id ?? null;
  const previousUserId = previousState.user?.id ?? null;
  if (userId === previousUserId) return;

  if (userId) {
    void useWishlistStore.getState().loadForUser(userId);
  } else {
    useWishlistStore.setState({ productIds: readGuestWishlist(), isLoading: false, error: null });
  }
});
