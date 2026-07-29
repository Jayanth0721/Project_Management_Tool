import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useToastStore } from "@/stores/toastStore";

interface Project {
  id: string;
  key: string;
  name: string;
  type: string;
  is_archived: boolean;
  created_at: string | null;
}

export function ProjectsPage() {
  const { selectedWorkspaceId } = useWorkspaceStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState("");
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState("software");
  const [creating, setCreating] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const fetchProjects = () => {
    if (!selectedWorkspaceId) { setLoading(false); return; }
    setLoading(true); setError(null);
    api.get(`/api/v1/workspaces/${selectedWorkspaceId}/projects`)
      .then((r) => setProjects(r.data as Project[]))
      .catch((err) => setError(err?.response?.data?.detail || err.message || "Failed to load projects"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchProjects, [selectedWorkspaceId]);

  const handleCreate = async () => {
    if (!selectedWorkspaceId || !createKey.trim() || !createName.trim()) return;
    setCreating(true);
    try {
      await api.post(`/api/v1/workspaces/${selectedWorkspaceId}/projects`, {
        key: createKey.trim().toUpperCase(),
        name: createName.trim(),
        type: createType,
      });
      setCreateOpen(false);
      setCreateKey(""); setCreateName(""); setCreateType("software");
      fetchProjects();
    } catch (err: any) {
      addToast(err?.response?.data?.detail || err.message || "Failed to create project", "error");
    } finally {
      setCreating(false);
    }
  };

  if (!selectedWorkspaceId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Card><CardContent className="py-6 text-center text-muted-foreground">Select a workspace first</CardContent></Card>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Card><CardContent className="py-6 text-center"><p className="text-sm text-destructive">{error}</p><Button className="mt-3" variant="outline" onClick={fetchProjects}>Retry</Button></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={() => setCreateOpen(true)}>Create Project</Button>
      </div>

      {projects.length === 0 ? (
        <Card><CardContent className="py-6 text-center text-muted-foreground">No projects yet — create your first one.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} to="/app/projects/$projectKey" params={{ projectKey: p.key }}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-mono text-muted-foreground">{p.key} &middot; {p.type}</p>
                  {p.is_archived && <span className="text-xs text-muted-foreground mt-1 block">Archived</span>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Create Project">
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Key</label>
            <Input placeholder="e.g. PROJ" value={createKey} onChange={(e) => setCreateKey(e.target.value)} required className="bg-[#f6f8fa] dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600" />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Uppercase letters and digits, 1–10 chars</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Name</label>
            <Input placeholder="e.g. My Project" value={createName} onChange={(e) => setCreateName(e.target.value)} required className="bg-[#f6f8fa] dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Type</label>
            <select value={createType} onChange={(e) => setCreateType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-[#f6f8fa] dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600">
              <option value="software">Software</option>
              <option value="business">Business</option>
            </select>
          </div>
          <Button type="submit" className="w-full bg-red-600 text-white hover:bg-red-700" disabled={creating}>{creating ? "Creating..." : "Create Project"}</Button>
        </form>
      </Modal>
    </div>
  );
}
