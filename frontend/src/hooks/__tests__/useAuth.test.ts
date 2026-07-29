import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../useAuth";
import { useAuthStore } from "@/stores/authStore";

describe("useAuth", () => {
  beforeEach(() => {
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

  it("returns the current auth state", () => {
    useAuthStore.setState({ isAuthenticated: true, fullName: "Bob" });
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.fullName).toBe("Bob");
  });

  it("reflects auth state changes", () => {
    const { result, rerender } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    act(() => useAuthStore.getState().setTokens("t1", "t2"));
    rerender();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.accessToken).toBe("t1");
  });
});
