import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Spinner } from "../Spinner";

describe("Spinner", () => {
  it("renders an SVG", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("has animate-spin class", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")).toHaveClass("animate-spin");
  });

  it("applies custom className", () => {
    const { container } = render(<Spinner className="h-10 w-10" />);
    expect(container.querySelector("svg")).toHaveClass("h-10 w-10");
  });
});
