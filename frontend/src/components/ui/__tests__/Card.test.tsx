import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardContent } from "../Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Content</Card>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("has the correct base class", () => {
    render(<Card data-testid="card">Card</Card>);
    expect(screen.getByTestId("card")).toHaveClass("rounded-xl");
  });

  it("applies custom className", () => {
    render(<Card className="custom-card" data-testid="card">Card</Card>);
    expect(screen.getByTestId("card")).toHaveClass("custom-card");
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });
});

describe("CardTitle", () => {
  it("renders title text", () => {
    render(<CardTitle>My Title</CardTitle>);
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });
});

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent>Body</CardContent>);
    expect(screen.getByText("Body")).toBeInTheDocument();
  });
});
