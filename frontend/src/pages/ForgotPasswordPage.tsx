import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import api from "@/lib/api";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post("/api/v1/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
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
          <h1 className="text-2xl font-bold text-white">Reset password</h1>
          <p className="text-sm text-blue-200/70">
            {sent ? "Check your email for the reset link" : "Enter your email to receive a reset link"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-black/20">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-sm text-blue-200/70">
                If <strong className="text-blue-100">{email}</strong> is registered, you'll receive a reset link shortly.
              </p>
              <p className="text-xs text-blue-300/50">No email? Check the server console for the reset link.</p>
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="mx-auto flex items-center gap-1 text-sm text-blue-300/70 hover:text-blue-200 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-blue-100">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-blue-300/50 focus:border-blue-500/50 focus:ring-blue-500/30"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-violet-700"
              >
                {loading ? <Spinner /> : <><Mail className="h-4 w-4" /> Send reset link</>}
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