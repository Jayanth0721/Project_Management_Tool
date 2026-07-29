import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "../themeStore";

describe("themeStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to light theme", () => {
    const state = useThemeStore.getState();
    expect(state.theme).toBe("light");
  });

  it("setTheme updates theme and persists to localStorage", () => {
    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
    expect(localStorage.getItem("tolab_theme")).toBe("dark");
  });

  it("persists theme across store initialization", () => {
    localStorage.setItem("tolab_theme", "dark");
    const state = useThemeStore.getState();
    expect(state.theme).toBe("dark");
  });
});
