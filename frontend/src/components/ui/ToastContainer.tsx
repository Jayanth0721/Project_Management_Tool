import { useToastStore } from "@/stores/toastStore";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: "bg-emerald-600 text-white border-emerald-500",
  error: "bg-red-600 text-white border-red-500",
  info: "bg-blue-600 text-white border-blue-500",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl animate-[slideUp_0.2s_ease-out]",
              styles[t.type],
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
