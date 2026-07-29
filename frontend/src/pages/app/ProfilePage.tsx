import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { useThemeStore, type Theme } from "@/stores/themeStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useToastStore } from "@/stores/toastStore";
import { Sun, Moon, Timer } from "lucide-react";

const themes: { key: Theme; label: string; icon: typeof Sun }[] = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
];

export function ProfilePage() {
  const { email, setUser } = useAuth();
  const userId = useAuthStore((s) => s.userId);
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const addToast = useToastStore((s) => s.addToast);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!userId) return;
    api.get("/api/v1/auth/me").then((r) => {
      setFullName(r.data.full_name);
      setUser(r.data.id, r.data.email, r.data.full_name);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId || !selectedWorkspaceId) return;
    api.get(`/api/v1/workspaces/${selectedWorkspaceId}/members`).then((r) => {
      const me = (r.data as any[]).find((m: any) => m.user_id === userId);
      if (me) setRole(me.role);
    }).catch(() => setRole("member"));
  }, [userId, selectedWorkspaceId]);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const r = await api.patch("/api/v1/users/me", { full_name: fullName });
      setUser(r.data.id, r.data.email, r.data.full_name);
      setSaved(true);
    } catch {
      addToast("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input value={email ?? ""} disabled />
            <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <Input value={role || "—"} disabled className="capitalize" />
            <p className="mt-1 text-xs text-muted-foreground">Role in current workspace</p>
          </div>
          {saved && <p className="text-sm text-green-600">Profile updated.</p>}
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Spinner /> : "Save"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <ThemeSelector />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Timer className="h-4 w-4" /> Auto Logout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SessionSettings />
        </CardContent>
      </Card>
    </div>
  );
}

const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "4 hours", value: 240 },
  { label: "8 hours", value: 480 },
  { label: "1 day", value: 1440 },
];

function SessionSettings() {
  const autoLogout = useSessionStore((s) => s.autoLogout);
  const autoLogoutMinutes = useSessionStore((s) => s.autoLogoutMinutes);
  const setAutoLogout = useSessionStore((s) => s.setAutoLogout);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Automatic logout</p>
          <p className="text-xs text-muted-foreground">Log out after a set time since login</p>
        </div>
        <button
          onClick={() => setAutoLogout(!autoLogout, autoLogoutMinutes)}
          className={`relative h-7 w-12 rounded-full transition-all duration-300 shadow-inner ${
            autoLogout
              ? "bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/30"
              : "bg-gradient-to-r from-neutral-300 to-neutral-400 dark:from-neutral-600 dark:to-neutral-700"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ${
              autoLogout ? "left-[22px] shadow-emerald-500/30" : "left-0.5"
            } ${autoLogout ? "ring-2 ring-emerald-500/20" : ""}`}
          />
        </button>
      </div>
      {autoLogout && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Timeout</label>
          <select
            value={autoLogoutMinutes}
            onChange={(e) => setAutoLogout(true, Number(e.target.value))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}

function ThemeSelector() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="flex gap-3">
      {themes.map(({ key, label, icon: Icon }) => {
        const active = theme === key;
        return (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className={`relative flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
              active
                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            {active && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                ✓
              </span>
            )}
            <Icon className={`h-6 w-6 ${active ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-sm font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}