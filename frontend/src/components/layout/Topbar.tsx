import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useThemeStore, type Theme } from "@/stores/themeStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useToastStore } from "@/stores/toastStore";
import { Avatar } from "@/components/ui/Avatar";
import { Sun, Moon, ChevronDown } from "lucide-react";
import api from "@/lib/api";

export function Topbar() {
  const { fullName } = useAuth();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const { selectedWorkspaceId, selectedWorkspaceName, setWorkspace } = useWorkspaceStore();
  const addToast = useToastStore((s) => s.addToast);
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (selectedWorkspaceId) {
      setWorkspaces([]);
      return;
    }
    api.get("/api/v1/workspaces").then((r) => {
      const list = r.data as { id: string; name: string }[];
      setWorkspaces(list);
      const first = list[0];
      if (first) {
        setWorkspace(first.id, first.name);
      }
    }).catch(() => addToast("Could not load workspaces", "error"));
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
  };

  const iconMap = { light: Sun, dark: Moon };
  const ThemeIcon = iconMap[theme];

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-4">
        {selectedWorkspaceName && (
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <span>{selectedWorkspaceName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {open && workspaces.length > 1 && (
              <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border bg-popover p-1 shadow-lg z-50">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => { setWorkspace(ws.id, ws.name); setOpen(false); }}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      ws.id === selectedWorkspaceId
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-popover-foreground hover:bg-muted"
                    }`}
                  >
                    {ws.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <span className="text-sm text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{fullName || "User"}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>
        <Avatar name={fullName || "User"} />
      </div>
    </header>
  );
}
