import { useToastStore, type ToastType } from "@/stores/toastStore";

export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  return {
    success: (msg: string) => addToast(msg, "success"),
    error: (msg: string) => addToast(msg, "error"),
    info: (msg: string) => addToast(msg, "info"),
  };
}
