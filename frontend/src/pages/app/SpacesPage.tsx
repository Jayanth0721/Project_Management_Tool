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

interface Space {
  id: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
}

export function SpacesPage() {
  const { selectedWorkspaceId } = useWorkspaceStore();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [createKey, setCreateKey] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const fetchSpaces = () => {
    if (!selectedWorkspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get(`/api/v1/workspaces/${selectedWorkspaceId}/spaces`)
      .then((res) => setSpaces(res.data as Space[]))
      .catch((err) => setError(err?.response?.data?.detail || err.message || "Failed to load spaces"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchSpaces, [selectedWorkspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createKey.trim() || !createName.trim() || !selectedWorkspaceId) return;
    const body: Record<string, string> = { key: createKey.trim(), name: createName.trim() };
    if (createDesc.trim()) body.description = createDesc.trim();
    setCreating(true);
    try {
      await api.post(`/api/v1/workspaces/${selectedWorkspaceId}/spaces`, body);
      setModalOpen(false);
      setCreateKey("");
      setCreateName("");
      setCreateDesc("");
      fetchSpaces();
    } catch (err: any) {
      addToast(err?.response?.data?.detail || err.message || "Failed to create space", "error");
    } finally {
      setCreating(false);
    }
  };

  if (!selectedWorkspaceId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Spaces</h1>
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-3">Select a workspace first</p>
            <Button asChild>
              <Link to="/app/settings/workspace">Go to Workspace Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Spaces</h1>
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button className="mt-3" variant="outline" onClick={fetchSpaces}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Spaces</h1>
        <Button onClick={() => setModalOpen(true)}>Create Space</Button>
      </div>

      {spaces.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            No spaces yet — create your first one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {spaces.map((s) => (
            <Link key={s.id} to="/app/spaces/$spaceKey" params={{ spaceKey: s.key }}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {s.icon ? `${s.icon} ` : ""}
                    {s.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-mono text-muted-foreground">
                    Key: {s.key}
                  </p>
                  {s.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onOpenChange={setModalOpen} title="Create Space">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Key</label>
            <Input
              placeholder="e.g. ENG"
              value={createKey}
              onChange={(e) => setCreateKey(e.target.value)}
              required
              className="bg-[#f6f8fa] dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Short unique identifier (uppercase recommended)
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Name</label>
            <Input
              placeholder="e.g. Engineering Docs"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
              className="bg-[#f6f8fa] dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Description (optional)</label>
            <Input
              placeholder="Brief description"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              className="bg-[#f6f8fa] dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600"
            />
          </div>
          <Button type="submit" className="w-full bg-red-600 text-white hover:bg-red-700" disabled={creating}>
            {creating ? "Creating..." : "Create Space"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}