import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast } from "../useToast";
import { useToastStore } from "@/stores/toastStore";

describe("useToast", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("success adds a success toast", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.success("Done!"));
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]!.message).toBe("Done!");
    expect(toasts[0]!.type).toBe("success");
  });

  it("error adds an error toast", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.error("Failed!"));
    const toasts = useToastStore.getState().toasts;
    expect(toasts[0]!.type).toBe("error");
  });

  it("info adds an info toast", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.info("Heads up!"));
    const toasts = useToastStore.getState().toasts;
    expect(toasts[0]!.type).toBe("info");
  });
});
