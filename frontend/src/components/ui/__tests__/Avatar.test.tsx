import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "../Avatar";

describe("Avatar", () => {
  it("renders initials from a two-part name", () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders single initial for single-part name", () => {
    render(<Avatar name="Admin" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("limits to two initials", () => {
    render(<Avatar name="John Michael Doe" />);
    expect(screen.getByText("JM")).toBeInTheDocument();
  });

  it("returns null for empty name", () => {
    const { container } = render(<Avatar name="" />);
    expect(container.innerHTML).toBe("");
  });

  it("has rounded-full class", () => {
    render(<Avatar name="Test User" />);
    expect(screen.getByText("TU")).toHaveClass("rounded-full");
  });

  it("sets the title attribute", () => {
    render(<Avatar name="Alice Smith" />);
    expect(screen.getByText("AS")).toHaveAttribute("title", "Alice Smith");
  });

  it("applies custom className", () => {
    render(<Avatar name="Test User" className="h-10 w-10" />);
    expect(screen.getByText("TU")).toHaveClass("h-10 w-10");
  });
});
