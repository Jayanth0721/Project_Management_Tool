import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "../Input";

describe("Input", () => {
  it("renders with default type text", () => {
    render(<Input placeholder="Name" />);
    expect(screen.getByPlaceholderText("Name")).toHaveProperty("type", "text");
  });

  it("supports different input types", () => {
    render(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute("type", "email");
  });

  it("accepts value changes", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="test" />);
    const input = screen.getByPlaceholderText("test");
    await user.type(input, "hello");
    expect(input).toHaveValue("hello");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<Input ref={ref} placeholder="ref-test" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("applies custom className", () => {
    render(<Input className="custom-class" placeholder="class-test" />);
    expect(screen.getByPlaceholderText("class-test")).toHaveClass("custom-class");
  });

  it("can be disabled", () => {
    render(<Input disabled placeholder="disabled" />);
    expect(screen.getByPlaceholderText("disabled")).toBeDisabled();
  });
});
