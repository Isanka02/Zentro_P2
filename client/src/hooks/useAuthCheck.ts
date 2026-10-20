import { useEffect } from "react";
import { getAuthRevision, useAuthStore } from "../store/authStore";
import { getCurrentUser } from "../api/auth";

export const useAuthCheck = () => {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const revision = getAuthRevision();
      try {
        const user = await getCurrentUser();
        if (revision === getAuthRevision()) setUser(user);
      } catch {
        if (revision === getAuthRevision()) setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [setUser, setLoading]);
};
