import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Mail, Lock, LogIn, Zap, Eye, EyeOff, ArrowRight } from "lucide-react";
import { CoffeeMascot } from "@/components/ui/CoffeeMascot";

const DEMO_EMAIL = "admin@tolab.dev";
const DEMO_PASSWORD = "tolab-admin";
const DEMO_WS_NAME = "Tolab HQ";
const DEMO_WS_SLUG = "tolab-hq";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusField, setFocusField] = useState<"email" | "password" | null>(null);
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const recordLogin = useSessionStore((s) => s.recordLogin);
  const { setWorkspace } = useWorkspaceStore();

  const navigateToWorkspace = async (isDemo = false) => {
    try {
      const wsResp = await api.get("/api/v1/workspaces");
      if (wsResp.data.length > 0) {
        setWorkspace(wsResp.data[0].id, wsResp.data[0].name);
        await navigate({ to: "/app" });
        return;
      }

      if (isDemo) {
        try {
          const newWs = await api.post("/api/v1/workspaces", {
            name: DEMO_WS_NAME,
            slug: DEMO_WS_SLUG,
            plan: "free",
          });
          setWorkspace(newWs.data.id, newWs.data.name);
          await navigate({ to: "/app" });
          return;
        } catch {
          // Fallback to onboarding if auto-creation fails
        }
      }

      await navigate({ to: "/onboarding" });
    } catch {
      await navigate({ to: "/onboarding" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await api.post("/api/v1/auth/login", { email, password });
      setTokens(resp.data.access_token, resp.data.refresh_token);
      setUser(resp.data.user_id, resp.data.email, resp.data.full_name);
      recordLogin();
      await navigateToWorkspace(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(msg || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipLoading(true);
    setError("");
    try {
      let data;
      try {
        const r = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
        });
        if (!r.ok) throw new Error("login failed");
        data = await r.json();
      } catch {
        const r = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: DEMO_EMAIL, full_name: "Tolab Admin", password: DEMO_PASSWORD }),
        });
        if (!r.ok) throw new Error("register failed");
        data = await r.json();
      }
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user_id, data.email, data.full_name);
      recordLogin();
      await navigateToWorkspace(true);
    } catch {
      setError("Could not access demo. Is the backend server running on port 8000?");
    } finally {
      setSkipLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[#0a0a1a]">
      {/* ────────── LEFT: Wall with coffee machine behind ────────── */}
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        {/* Wall texture — gray background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4a4a4a] via-[#3a3a3a] to-[#2a2a2a]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_20%_30%,#fff_1px,transparent_1px),radial-gradient(circle_at_70%_60%,#fff_1px,transparent_1px)] bg-[length:24px_24px]" />

        {/* Coffee vending machine — centered + slightly low */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="translate-y-10">
            <CoffeeMascot
              beverage="coffee"
              focusField={focusField}
              loading={loading || skipLoading}
            />
          </div>
        </div>

        {/* Hanging framed photo + welcome text side-by-side — top-left */}
        <div className="absolute left-10 top-10 flex items-start gap-6">
          {/* ── Photo frame ── */}
          <div className="flex flex-col items-center">
            <div className="relative h-10 w-40">
              <div className="absolute left-2 top-0 h-2 w-2 rounded-full bg-gray-400 shadow-md" />
              <div className="absolute right-2 top-0 h-2 w-2 rounded-full bg-gray-400 shadow-md" />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 40" preserveAspectRatio="none">
                <polyline points="6,2 80,38 154,2" fill="none" stroke="#9ca3af" strokeWidth="1" />
              </svg>
            </div>
            <div className="-mt-1 h-40 w-36 rounded-md border-4 border-[#9ca3af] bg-[#d1d5db] p-1 shadow-2xl">
              <img
                src="/assets/coffee.jpg"
                alt="A warm cup of coffee"
                className="h-full w-full rounded-sm object-cover"
              />
            </div>
          </div>
          {/* ── Welcome text ── */}
          <div className="mt-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-3 drop-shadow-lg whitespace-nowrap">
              Welcome to <span className="bg-gradient-to-r from-[#9ca3af] to-[#d1d5db] bg-clip-text text-transparent">Tolab</span>
            </h2>
            <p className="text-sm text-gray-300/80 leading-relaxed drop-shadow mb-4">
              Your all-in-one workspace for projects, documentation, and seamless team collaboration.
            </p>
            {/* Feature tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Projects", to: "/app/projects" },
                { label: "Kanban", to: "/app/projects" },
                { label: "Docs", to: "/app/spaces" },
                { label: "Sprints", to: "/app/projects" },
                { label: "Search", to: "/app/search" },
              ].map(({ label, to }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate({ to })}
                  className="rounded-full border border-gray-500/40 bg-gray-700/60 px-3 py-1 text-xs font-medium text-gray-300 backdrop-blur transition-colors hover:bg-gray-600/60 hover:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ────────── RIGHT: Form Panel ────────── */}
      <div className="relative flex w-full items-center justify-center bg-[#0a0a1a] p-6 lg:w-[480px] lg:p-12">
        {/* Subtle accent glow on the right edge */}
        <div className="absolute right-0 top-0 h-1/2 w-px bg-gradient-to-b from-transparent via-blue-500/40 to-transparent" />
        <div className="absolute right-0 bottom-0 h-1/2 w-px bg-gradient-to-t from-transparent via-violet-500/40 to-transparent" />

        <div className="w-full max-w-sm animate-fade-in">
          {/* Header */}
          <div className="mb-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-600/30">
                <span className="text-lg font-bold text-white">T</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Tolab</h2>
                <p className="text-xs text-gray-400">Sign in to continue</p>
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white">
              Hello, <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">welcome back</span>
            </h1>
            <p className="mt-2 text-sm text-gray-400">Enter your credentials to access your workspace.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            {/* Floating-label Email */}
            <div className="group">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 transition-colors group-focus-within:text-blue-400">
                <Mail className="h-3 w-3" /> Email
              </label>
              <Input
                type="email"
                autoComplete="new-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusField("email")}
                onBlur={() => setFocusField(null)}
                placeholder="you@example.com"
                required
                className="h-12 rounded-xl border-white/10 bg-white/[0.03] text-white placeholder:text-gray-600 transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Floating-label Password */}
            <div className="group">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 transition-colors group-focus-within:text-blue-400">
                  <Lock className="h-3 w-3" /> Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/forgot-password" })}
                  className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField("password")}
                  onBlur={() => setFocusField(null)}
                  placeholder="Enter your password"
                  required
                  className="h-12 rounded-xl border-white/10 bg-white/[0.03] pr-12 text-white placeholder:text-gray-600 transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="group h-12 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-600/30 transition-all hover:shadow-blue-600/50 hover:shadow-xl"
              disabled={loading}
            >
              {loading ? <Spinner /> : (
                <>
                  <LogIn className="h-4 w-4" /> Sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">or continue with</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
          </div>

          {/* Skip demo */}
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl border-white/10 bg-white/[0.03] text-gray-200 transition-all hover:bg-white/[0.06] hover:border-white/20"
            onClick={handleSkip}
            disabled={skipLoading}
          >
            {skipLoading ? <Spinner /> : <><Zap className="h-4 w-4 text-yellow-400" /> Skip to Demo</>}
          </Button>

          {/* Sign up */}
          <p className="mt-8 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate({ to: "/register" })}
              className="font-semibold text-blue-400 transition-colors hover:text-blue-300"
            >
              Create one →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
