import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("overrides conflicting tailwind classes", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("accepts array inputs", () => {
    expect(cn(["flex", "items-center"], "gap-2")).toBe("flex items-center gap-2");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});
