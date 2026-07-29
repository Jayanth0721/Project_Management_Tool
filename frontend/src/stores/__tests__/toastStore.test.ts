import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useToastStore } from "../toastStore";

describe("toastStore", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with empty toasts", () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("adds a toast", () => {
    useToastStore.getState().addToast("Hello", "success");
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]!.message).toBe("Hello");
    expect(toasts[0]!.type).toBe("success");
  });

  it("adds toast with default type 'info'", () => {
    useToastStore.getState().addToast("Info only");
    const toasts = useToastStore.getState().toasts;
    expect(toasts[0]!.type).toBe("info");
  });

  it("removes a toast by id", () => {
    useToastStore.getState().addToast("Toast A");
    const { id } = useToastStore.getState().toasts[0]!;
    useToastStore.getState().removeToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("auto-removes toast after 4 seconds", () => {
    useToastStore.getState().addToast("Auto remove");
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(4000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
