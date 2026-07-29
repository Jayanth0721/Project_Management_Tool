import { create } from "zustand";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const stored = (typeof localStorage !== "undefined" ? localStorage.getItem("tolab_theme") : null) as Theme | null;
const initial: Theme = stored && ["light", "dark"].includes(stored) ? stored : "light";

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initial,
  setTheme: (theme) => {
    localStorage.setItem("tolab_theme", theme);
    set({ theme });
  },
}));
