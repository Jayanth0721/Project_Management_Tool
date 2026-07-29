import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Emoji } from "../Emoji";

describe("Emoji", () => {
  it("renders an img for known emoji names", () => {
    render(<Emoji name="party" />);
    const img = screen.getByAltText("party");
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe("IMG");
  });

  it("uses correct image path", () => {
    render(<Emoji name="heart" />);
    expect(screen.getByAltText("heart")).toHaveAttribute("src", "/emoji/heart.png");
  });

  it("renders fallback text for unknown emoji names", () => {
    render(<Emoji name="unknown-emoji" />);
    expect(screen.getByText("unknown-emoji")).toBeInTheDocument();
  });

  it("applies default size", () => {
    render(<Emoji name="smile" />);
    expect(screen.getByAltText("smile")).toHaveAttribute("width", "20");
  });

  it("accepts custom size", () => {
    render(<Emoji name="fire" size={32} />);
    expect(screen.getByAltText("fire")).toHaveAttribute("width", "32");
    expect(screen.getByAltText("fire")).toHaveAttribute("height", "32");
  });
});
