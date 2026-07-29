import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../authStore";

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      userId: null,
      email: null,
      fullName: null,
      isLoading: true,
      isAuthenticated: false,
    });
  });

  it("starts with default state (loading, not authenticated)", () => {
    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });

  it("setTokens marks user as authenticated and saves refresh to localStorage", () => {
    useAuthStore.getState().setTokens("access123", "refresh456");
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("access123");
    expect(state.refreshToken).toBe("refresh456");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(localStorage.getItem("tolab_refresh")).toBe("refresh456");
  });

  it("setUser updates user info", () => {
    useAuthStore.getState().setUser("u1", "a@b.com", "Alice");
    const state = useAuthStore.getState();
    expect(state.userId).toBe("u1");
    expect(state.email).toBe("a@b.com");
    expect(state.fullName).toBe("Alice");
  });

  it("setLoading updates loading state", () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("logout clears everything and removes localStorage", () => {
    useAuthStore.getState().setTokens("access", "refresh");
    useAuthStore.getState().setUser("u1", "a@b.com", "Alice");
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.userId).toBeNull();
    expect(state.email).toBeNull();
    expect(state.fullName).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(localStorage.getItem("tolab_refresh")).toBeNull();
  });
});
