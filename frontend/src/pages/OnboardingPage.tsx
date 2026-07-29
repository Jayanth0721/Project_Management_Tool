import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import api from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { Building2, Zap, Sparkles } from "lucide-react";

const DEMO_WS_NAME = "Tolab HQ";
const DEMO_WS_SLUG = "tolab-hq";

export function OnboardingPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [skipLoading, setSkipLoading] = useState(false);
  const navigate = useNavigate();
  const { setWorkspace } = useWorkspaceStore();

  const generateSlug = (from: string) =>
    from.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await api.post("/api/v1/workspaces", { name, slug, plan: "free" });
      setWorkspace(resp.data.id, resp.data.name);
      setTimeout(() => navigate({ to: "/app" }), 100);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(msg || "Could not create workspace.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipLoading(true);
    setError("");
    try {
      const r = await api.get("/api/v1/workspaces");
      if (r.data.length > 0) {
        setWorkspace(r.data[0].id, r.data[0].name);
        setTimeout(() => navigate({ to: "/app" }), 100);
        return;
      }
      const wsResp = await api.post("/api/v1/workspaces", {
        name: DEMO_WS_NAME, slug: DEMO_WS_SLUG, plan: "free",
      });
      setWorkspace(wsResp.data.id, wsResp.data.name);
      setTimeout(() => navigate({ to: "/app" }), 100);
    } catch {
      setError("Could not create workspace. Is the backend running?");
    } finally {
      setSkipLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMjBMMCAwaDQweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvc3ZnPg==')] opacity-30" />
      <div className="relative w-full max-w-md animate-[fadeIn_0.5s_ease-out] px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set up your workspace</h1>
          <p className="text-sm text-blue-200/70">Create a workspace or jump straight in</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-black/20">
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-blue-100">Workspace name</label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setSlug(generateSlug(e.target.value)); }}
                placeholder="My Team"
                required
                className="border-white/10 bg-white/5 text-white placeholder:text-blue-300/50 focus:border-blue-500/50 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-blue-100">URL slug</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-team"
                required
                className="border-white/10 bg-white/5 text-white placeholder:text-blue-300/50 focus:border-blue-500/50 focus:ring-blue-500/30"
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-violet-700" disabled={loading}>
              {loading ? <Spinner /> : <><Building2 className="h-4 w-4" /> Create workspace</>}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-blue-300/50 font-medium">Quick start</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button
            variant="outline"
            className="mt-4 w-full border-blue-500/30 bg-blue-500/5 text-blue-200 hover:bg-blue-500/10 hover:text-blue-100 hover:border-blue-500/50"
            onClick={handleSkip}
            disabled={skipLoading}
          >
            {skipLoading ? <Spinner /> : <><Zap className="h-4 w-4" /> Use demo workspace</>}
          </Button>
          <p className="mt-2 text-center text-xs text-blue-300/40">
            Auto-creates "Tolab HQ" workspace
          </p>
        </div>
      </div>
    </div>
  );
}
