import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../Modal";

describe("Modal", () => {
  it("renders title and content when open", () => {
    render(
      <Modal open onOpenChange={() => {}} title="Test Modal">
        <p>Modal content here</p>
      </Modal>,
    );
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content here")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(
      <Modal open={false} onOpenChange={() => {}} title="Hidden">
        <p>Should not be visible</p>
      </Modal>,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("calls onOpenChange when close button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal open onOpenChange={onOpenChange} title="Close Test">
        <p>Content</p>
      </Modal>,
    );
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("applies size classes", () => {
    render(
      <Modal open onOpenChange={() => {}} title="Small" size="sm">
        <p>Content</p>
      </Modal>,
    );
    const dialog = screen.getByText("Small").closest('[role="dialog"]');
    expect(dialog?.className).toContain("max-w-sm");
  });
});
