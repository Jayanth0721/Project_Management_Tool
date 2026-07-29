import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setTokens: (access: string, refresh: string) => void;
  setUser: (id: string, email: string, fullName: string) => void;
  setLoading: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  userId: null,
  email: null,
  fullName: null,
  isLoading: true,
  isAuthenticated: false,

  setTokens: (access, refresh) => {
    localStorage.setItem("tolab_refresh", refresh);
    set({
      accessToken: access,
      refreshToken: refresh,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: (id, email, fullName) =>
    set({
      userId: id,
      email,
      fullName,
    }),

  setLoading: (v) => set({ isLoading: v }),

  logout: () => {
    localStorage.removeItem("tolab_refresh");
    set({
      accessToken: null,
      refreshToken: null,
      userId: null,
      email: null,
      fullName: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));