import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { getCurrentUser } from "../api/auth";

export const useAuthCheck = () => {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setUser(user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [setUser, setLoading]);
};