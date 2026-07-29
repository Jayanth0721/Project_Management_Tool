import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "@/router";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useSessionStore } from "@/stores/sessionStore";
import { ToastContainer } from "@/components/ui/ToastContainer";
import api from "@/lib/api";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

export function App() {
  const theme = useThemeStore((s) => s.theme);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const logout = useAuthStore((s) => s.logout);
  const autoLogout = useSessionStore((s) => s.autoLogout);
  const autoLogoutMinutes = useSessionStore((s) => s.autoLogoutMinutes);
  const loginTime = useSessionStore((s) => s.loginTime);
  const recordLogin = useSessionStore((s) => s.recordLogin);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Record login time when authenticated
  useEffect(() => {
    if (isAuthenticated && !loginTime) {
      recordLogin();
    }
  }, [isAuthenticated, loginTime, recordLogin]);

  // Auto-logout checker
  useEffect(() => {
    if (!autoLogout || !loginTime) return;
    const check = setInterval(() => {
      const elapsed = Date.now() - loginTime;
      const maxMs = autoLogoutMinutes * 60 * 1000;
      if (elapsed >= maxMs) {
        logout();
      }
    }, 10000);
    return () => clearInterval(check);
  }, [autoLogout, autoLogoutMinutes, loginTime, logout]);

  useEffect(() => {
    const stored = localStorage.getItem("tolab_refresh");
    if (!stored) {
      setLoading(false);
      return;
    }
    api.post("/api/v1/auth/refresh", { refresh_token: stored })
      .then((r) => {
        setTokens(r.data.access_token, r.data.refresh_token);
        setUser(r.data.user_id, r.data.email, r.data.full_name);
        localStorage.setItem("tolab_refresh", r.data.refresh_token);
        recordLogin();
      })
      .catch(() => {
        localStorage.removeItem("tolab_refresh");
        setLoading(false);
      });
  }, [setTokens, setUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastContainer />
    </QueryClientProvider>
  );
}