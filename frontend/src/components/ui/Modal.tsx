import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onOpenChange, title, children, size = "md" }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/80" />
        <Dialog.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-6 shadow-2xl sm:rounded-lg",
            size === "sm" && "max-w-sm",
            size === "md" && "max-w-lg",
            size === "lg" && "max-w-2xl",
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</Dialog.Title>
          <Dialog.Close className="absolute right-4 top-4 rounded-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}