import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Check, ArrowRight } from "lucide-react";
import { CoffeeMascot } from "@/components/ui/CoffeeMascot";

const passwordChecks = [
  { label: "At least 6 characters", test: (p: string) => p.length >= 6 },
  { label: "At least one letter", test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: "At least one number", test: (p: string) => /\d/.test(p) },
];

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusField, setFocusField] = useState<"email" | "password" | null>(null);
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const recordLogin = useSessionStore((s) => s.recordLogin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await api.post("/api/v1/auth/register", {
        email,
        full_name: fullName,
        password,
      });
      setTokens(resp.data.access_token, resp.data.refresh_token);
      setUser(resp.data.user_id, resp.data.email, resp.data.full_name);
      recordLogin();
      navigate({ to: "/onboarding" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isStrong = passwordChecks.every((c) => c.test(password));

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[#0a0a1a]">
      {/* ────────── LEFT: Wall with hanging framed tea photo + machines ────────── */}
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        {/* Wall texture — ice green wall */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4ede0] via-[#c8e6d8] to-[#b8dcc8]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_20%_30%,#fff_1px,transparent_1px),radial-gradient(circle_at_70%_60%,#fff_1px,transparent_1px)] bg-[length:24px_24px]" />

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
            <div className="-mt-1 h-40 w-36 rounded-md border-4 border-[#c0d4c8] bg-[#e8f2ec] p-1 shadow-2xl">
              <img
                src="/assets/tea.jpg"
                alt="A warm cup of tea"
                className="h-full w-full rounded-sm object-cover"
              />
            </div>
          </div>
          {/* ── Welcome text ── */}
          <div className="mt-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0a2e1e] mb-3 whitespace-nowrap drop-shadow-sm">
              Join <span className="bg-gradient-to-r from-[#0a4a2e] to-[#0d6b42] bg-clip-text text-transparent">Tolab</span>
            </h2>
            <p className="text-sm text-[#0a3a24]/90 drop-shadow-sm mb-4 whitespace-nowrap">
              Start your journey with a workspace built for teams. Projects, docs, and issues — all in one place.
            </p>
            {/* Feature tabs */}
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Unlimited projects & spaces", to: "/app/projects" },
                { label: "Kanban boards & sprint planning", to: "/app/projects" },
                { label: "Real-time activity & notifications", to: "/app/notifications" },
              ].map(({ label, to }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate({ to })}
                  className="flex items-center gap-2 text-sm text-[#0a3a24] transition-colors hover:text-[#0d6b42]"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0a4a2e]/25 text-[#0d6b42]">
                    <Check className="h-3 w-3" />
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tea machine — centered + slightly low */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="translate-y-10">
            <CoffeeMascot
              beverage="tea"
              focusField={focusField}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* ────────── RIGHT: Form Panel ────────── */}
      <div className="relative flex w-full items-center justify-center bg-[#0a0a1a] p-6 lg:w-[480px] lg:p-12">
        {/* Accent edges */}
        <div className="absolute left-0 top-0 h-1/2 w-px bg-gradient-to-b from-transparent via-fuchsia-500/40 to-transparent" />
        <div className="absolute left-0 bottom-0 h-1/2 w-px bg-gradient-to-t from-transparent via-violet-500/40 to-transparent" />

        <div className="w-full max-w-sm animate-fade-in">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-600/30">
                <span className="text-lg font-bold text-white">T</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Tolab</h2>
                <p className="text-xs text-gray-400">Create your account</p>
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white">
              Let's get <span className="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">you started</span>
            </h1>
            <p className="mt-2 text-sm text-gray-400">Join thousands of teams using Tolab today.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div className="group">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 transition-colors group-focus-within:text-fuchsia-400">
                <User className="h-3 w-3" /> Full name
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFocusField("email")}
                onBlur={() => setFocusField(null)}
                placeholder="Jane Smith"
                required
                className="h-12 rounded-xl border-white/10 bg-white/[0.03] text-white placeholder:text-gray-600 transition-all focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/20"
              />
            </div>

            <div className="group">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 transition-colors group-focus-within:text-fuchsia-400">
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
                className="h-12 rounded-xl border-white/10 bg-white/[0.03] text-white placeholder:text-gray-600 transition-all focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/20"
              />
            </div>

            <div className="group">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400 transition-colors group-focus-within:text-fuchsia-400">
                <Lock className="h-3 w-3" /> Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField("password")}
                  onBlur={() => setFocusField(null)}
                  placeholder="Create a secure password"
                  required
                  className="h-12 rounded-xl border-white/10 bg-white/[0.03] pr-12 text-white placeholder:text-gray-600 transition-all focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength */}
              {password.length > 0 && (
                <>
                  <div className="mt-2 flex gap-1">
                    {passwordChecks.map(({ test }, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          test(password) ? (isStrong ? "bg-green-500" : "bg-yellow-500") : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 grid gap-1.5">
                    {passwordChecks.map(({ label, test }) => {
                      const passed = test(password);
                      return (
                        <div key={label} className="flex items-center gap-2 text-xs">
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                              passed ? "bg-green-500/20 text-green-400" : "bg-white/5 text-gray-600"
                            }`}
                          >
                            <Check className="h-2.5 w-2.5" />
                          </span>
                          <span className={passed ? "text-green-400" : "text-gray-500"}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <Button
              type="submit"
              className="group h-12 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30 transition-all hover:shadow-violet-600/50 hover:shadow-xl"
              disabled={loading}
            >
              {loading ? <Spinner /> : (
                <>
                  <UserPlus className="h-4 w-4" /> Create account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate({ to: "/login" })}
              className="font-semibold text-fuchsia-400 transition-colors hover:text-fuchsia-300"
            >
              Sign in →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
