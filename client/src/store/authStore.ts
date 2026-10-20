import { create } from "zustand";
import type { User } from "../api/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearUser: () => set({ user: null }),
}));

let authRevision = 0;
useAuthStore.subscribe((state, previousState) => {
  if (state.user?.id !== previousState.user?.id) authRevision += 1;
});

export const getAuthRevision = () => authRevision;
