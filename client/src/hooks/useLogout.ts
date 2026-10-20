import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api/auth";
import { getAuthRevision, useAuthStore } from "../store/authStore";

/** Ends the local session even when the API cannot clear its HTTP-only cookies. */
export const useLogout = () => {
  const navigate = useNavigate();
  const clearUser = useAuthStore((state) => state.clearUser);

  return useCallback(async () => {
    const revision = getAuthRevision();
    try {
      await logoutUser();
    } catch {
      // The browser cannot clear HTTP-only cookies itself; still remove local account data.
    } finally {
      if (revision === getAuthRevision()) {
        clearUser();
        navigate("/login", { replace: true });
      }
    }
  }, [clearUser, navigate]);
};
