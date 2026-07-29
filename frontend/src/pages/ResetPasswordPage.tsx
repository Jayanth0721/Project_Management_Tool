import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft, Lock, CheckCircle } from "lucide-react";
import api from "@/lib/api";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) { setError("Missing reset token"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await api.post("/api/v1/auth/reset-password", { token, new_password: password });
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(msg || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
      <div className="relative w-full max-w-md animate-[fadeIn_0.5s_ease-out] px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/25">
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
          <p className="text-sm text-blue-200/70">
            {done ? "Password has been reset" : "Enter your new password"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-black/20">
          {done ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-sm text-blue-200/70">Your password has been reset successfully.</p>
              <Button
                onClick={() => navigate({ to: "/login" })}
                className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-violet-700"
              >
                Sign in with new password
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-blue-100">New password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-blue-300/50 focus:border-blue-500/50 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-blue-100">Confirm password</label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-blue-300/50 focus:border-blue-500/50 focus:ring-blue-500/30"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-violet-700"
              >
                {loading ? <Spinner /> : <><Lock className="h-4 w-4" /> Reset password</>}
              </Button>
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="mx-auto flex items-center gap-1 text-sm text-blue-300/70 hover:text-blue-200 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}