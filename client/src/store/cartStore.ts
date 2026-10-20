import { create } from "zustand";
import { useAuthStore } from "./authStore";

export interface CartItem {
  productId: string;
  variantId?: string;
  variantLabel?: string;
  name: string;
  image: string;
  price: number;
  sellerName?: string;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

const storageKey = (userId: string | null) => `zentro-cart:${userId ?? "guest"}`;

const isCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.image === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    typeof item.stock === "number" &&
    Number.isFinite(item.stock) &&
    (item.variantId === undefined || typeof item.variantId === "string") &&
    (item.variantLabel === undefined || typeof item.variantLabel === "string") &&
    (item.sellerName === undefined || typeof item.sellerName === "string")
  );
};

const readCart = (userId: string | null): CartItem[] => {
  try {
    const stored = localStorage.getItem(storageKey(userId));
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
};

const saveCart = (userId: string | null, items: CartItem[]) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(items));
  } catch {
    // Keep the cart usable for the current session if browser storage is unavailable.
  }
};

const currentUserId = () => useAuthStore.getState().user?.id ?? null;
const sameCartLine = (left: CartItem, right: Pick<CartItem, "productId" | "variantId">) =>
  left.productId === right.productId && left.variantId === right.variantId;

export const useCartStore = create<CartState>((set, get) => ({
  items: readCart(currentUserId()),

  addItem: (item, quantity = 1) => {
    const userId = currentUserId();
    const existing = get().items.find((cartItem) => sameCartLine(cartItem, item));
    const items = existing
      ? get().items.map((cartItem) =>
          sameCartLine(cartItem, item)
            ? { ...cartItem, quantity: Math.min(cartItem.quantity + quantity, item.stock) }
            : cartItem
        )
      : [...get().items, { ...item, quantity: Math.min(quantity, item.stock) }];

    set({ items });
    saveCart(userId, items);
  },

  removeItem: (productId, variantId) => {
    const userId = currentUserId();
    const items = get().items.filter((item) => !sameCartLine(item, { productId, variantId }));
    set({ items });
    saveCart(userId, items);
  },

  updateQuantity: (productId, variantId, quantity) => {
    if (quantity < 1) return;
    const userId = currentUserId();
    const items = get().items.map((item) =>
      sameCartLine(item, { productId, variantId })
        ? { ...item, quantity: Math.min(quantity, item.stock) }
        : item
    );
    set({ items });
    saveCart(userId, items);
  },

  clearCart: () => {
    const userId = currentUserId();
    set({ items: [] });
    saveCart(userId, []);
  },

  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  subtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));

// Keep each account's cart separate on shared browsers. The previous shared
// cart key is intentionally not migrated because it cannot be attributed safely.
useAuthStore.subscribe((state, previousState) => {
  const userId = state.user?.id ?? null;
  const previousUserId = previousState.user?.id ?? null;

  if (userId !== previousUserId) {
    useCartStore.setState({ items: readCart(userId) });
  }
});
