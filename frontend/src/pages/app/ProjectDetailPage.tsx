import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "@tanstack/react-router";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useToastStore } from "@/stores/toastStore";

interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  state: string;
  created_at: string | null;
}

interface Issue {
  id: string;
  key: string;
  summary: string;
  description: string | null;
  status_id: string | null;
  priority_id: string | null;
  assignee_id: string | null;
  reporter_id: string | null;
  due_date: string | null;
  story_points: number | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  workspace_id: string;
  key: string;
  name: string;
  type: string;
  is_archived: boolean;
  lead_user_id: string | null;
  created_at: string;
}

export function ProjectDetailPage() {
  const { projectKey } = useParams({ from: "/app/projects/$projectKey" }) as { projectKey: string };
  const { selectedWorkspaceId } = useWorkspaceStore();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [activeTab, setActiveTab] = useState<"issues" | "board" | "backlog" | "gantt" | "sprints" | "settings">("issues");

  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [newSummary, setNewSummary] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState("");

  // Sprints
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [actionSprintId, setActionSprintId] = useState<string | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    if (!selectedWorkspaceId || !projectKey) return;
    setLoadingProject(true);
    api
      .get(`/api/v1/workspaces/${selectedWorkspaceId}/projects/${projectKey}`)
      .then((r) => {
        setProject(r.data);
        setLoadingProject(false);
      })
      .catch(() => setLoadingProject(false));
  }, [selectedWorkspaceId, projectKey]);

  useEffect(() => {
    if (!projectKey) return;
    setLoadingIssues(true);
    api
      .get(`/api/v1/projects/${projectKey}/issues`)
      .then((r) => {
        setIssues(r.data as Issue[]);
        setLoadingIssues(false);
      })
      .catch(() => setLoadingIssues(false));
  }, [projectKey]);

  const fetchSprints = () => {
    if (!projectKey) return;
    setLoadingSprints(true);
    api.get(`/api/v1/projects/${projectKey}/sprints`)
      .then((r) => setSprints(r.data as Sprint[]))
      .catch(() => addToast("Failed to load sprints", "error"))
      .finally(() => setLoadingSprints(false));
  };

  useEffect(fetchSprints, [projectKey]);

  const handleCreateSprint = async () => {
    if (!projectKey || !sprintName.trim()) return;
    setCreatingSprint(true);
    try {
      await api.post(`/api/v1/projects/${projectKey}/sprints`, {
        name: sprintName.trim(),
        goal: sprintGoal.trim() || undefined,
      });
      setCreateSprintOpen(false);
      setSprintName("");
      setSprintGoal("");
      fetchSprints();
    } catch {
      addToast("Failed to create sprint", "error");
    } finally {
      setCreatingSprint(false);
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    setActionSprintId(sprintId);
    try {
      await api.post(`/api/v1/projects/${projectKey}/sprints/${sprintId}/start`);
      fetchSprints();
    } catch {
      addToast("Failed to start sprint", "error");
    } finally {
      setActionSprintId(null);
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    if (!window.confirm("Complete this sprint?")) return;
    setActionSprintId(sprintId);
    try {
      await api.post(`/api/v1/projects/${projectKey}/sprints/${sprintId}/complete`);
      fetchSprints();
    } catch {
      addToast("Failed to complete sprint", "error");
    } finally {
      setActionSprintId(null);
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (!window.confirm("Delete this sprint?")) return;
    setActionSprintId(sprintId);
    try {
      await api.delete(`/api/v1/projects/${projectKey}/sprints/${sprintId}`);
      fetchSprints();
    } catch {
      addToast("Failed to delete sprint", "error");
    } finally {
      setActionSprintId(null);
    }
  };

  const handleCreateIssue = async () => {
    if (!newSummary.trim() || !projectKey) return;
    setCreating(true);
    try {
      await api.post(`/api/v1/projects/${projectKey}/issues`, {
        summary: newSummary.trim(),
        description: newDescription || undefined,
      });
      setShowCreateIssue(false);
      setNewSummary("");
      setNewDescription("");
      const r = await api.get(`/api/v1/projects/${projectKey}/issues`);
      setIssues(r.data as Issue[]);
    } catch {
      addToast("Failed to create issue", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedWorkspaceId || !projectKey) return;
    if (!window.confirm(`Delete project ${projectKey}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/api/v1/workspaces/${selectedWorkspaceId}/projects/${projectKey}`);
      navigate({ to: "/app/projects" });
    } catch {
      addToast("Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loadingProject) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!project) return <Card><CardContent className="py-6 text-center text-muted-foreground">Project not found</CardContent></Card>;

  const q = filter.toLowerCase().trim();
  const filteredIssues = q ? issues.filter((i) =>
    i.key.toLowerCase().includes(q) ||
    i.summary.toLowerCase().includes(q)
  ) : issues;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <Link to="/app/projects" className="hover:underline">Projects</Link>
        <span className="mx-1">/</span>
        <span className="font-medium text-foreground">{project.key}</span>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project.name} ({project.key})</h1>
        <span className="text-xs rounded-full border px-2 py-0.5 text-muted-foreground">{project.type}</span>
      </div>

      <div className="flex gap-1 border-b pb-2">
        {(["issues","board","backlog","gantt","sprints","settings"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-sm rounded-t ${activeTab === tab ? "border bg-card font-medium" : "text-muted-foreground hover:text-foreground"}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "issues" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => setShowCreateIssue(true)}>+ Create Issue</Button>
            <Input placeholder="Filter by keyword..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48" />
          </div>
          {loadingIssues ? <Spinner /> : (
            <div className="overflow-x-auto rounded border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="p-2">Key</th>
                    <th className="p-2">Summary</th>
                    <th className="p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.length === 0 ? (
                    <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No issues yet</td></tr>
                  ) : (
                    filteredIssues.map((i) => (
                      <tr key={i.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-2 font-mono">
                          <Link to="/app/projects/$projectKey/issues/$issueKey" params={{ projectKey, issueKey: i.key }} className="text-primary hover:underline">{i.key}</Link>
                        </td>
                        <td className="p-2">{i.summary}</td>
                        <td className="p-2 text-xs text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <Modal open={showCreateIssue} onOpenChange={setShowCreateIssue} title="Create Issue">
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Summary</label><Input value={newSummary} onChange={(e) => setNewSummary(e.target.value)} placeholder="What needs to be done?" className="bg-[#f6f8fa] dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600" /></div>
              <div><label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Description</label><textarea className="h-24 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-[#f6f8fa] dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Details..." /></div>
              <Button onClick={handleCreateIssue} disabled={creating} className="w-full bg-red-600 text-white hover:bg-red-700">{creating ? "Creating..." : "Create Issue"}</Button>
            </div>
          </Modal>
        </div>
      )}

      {activeTab === "board" && (
        <Card><CardHeader><CardTitle className="text-lg">Board</CardTitle></CardHeader><CardContent className="space-y-2">
          <Link to="/app/projects/$projectKey/board" params={{ projectKey }} className="text-primary hover:underline text-sm">Open Kanban Board &rarr;</Link>
          <p className="text-muted-foreground text-sm">{filteredIssues.length} issues available for the board</p>
        </CardContent></Card>
      )}

      {activeTab === "backlog" && (
        <Card><CardHeader><CardTitle className="text-lg">Backlog</CardTitle></CardHeader><CardContent className="space-y-2">
          <Link to="/app/projects/$projectKey/backlog" params={{ projectKey }} className="text-primary hover:underline text-sm">Open Backlog &rarr;</Link>
          <p className="text-muted-foreground text-sm">Manage unassigned issues and plan sprints</p>
        </CardContent></Card>
      )}

      {activeTab === "gantt" && (
        <Card><CardHeader><CardTitle className="text-lg">Gantt Chart</CardTitle></CardHeader><CardContent className="space-y-2">
          <Link to="/app/projects/$projectKey/gantt" params={{ projectKey }} className="text-primary hover:underline text-sm">Open Gantt Chart &rarr;</Link>
          <p className="text-muted-foreground text-sm">Timeline view of issues with due dates</p>
        </CardContent></Card>
      )}

      {activeTab === "sprints" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sprints</h2>
            <Button size="sm" onClick={() => setCreateSprintOpen(true)}>+ Create Sprint</Button>
          </div>
          {loadingSprints ? (
            <Spinner />
          ) : sprints.length === 0 ? (
            <Card><CardContent className="py-6 text-center text-muted-foreground">No sprints yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {sprints.map((s) => (
                <Card key={s.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                        s.state === "active" ? "bg-green-100 text-green-700" :
                        s.state === "completed" ? "bg-muted text-muted-foreground" :
                        "bg-blue-100 text-blue-700"
                      }`}>{s.state}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {s.goal && <p className="text-sm text-muted-foreground mb-2">{s.goal}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {s.start_date && <span>Start: {new Date(s.start_date).toLocaleDateString()}</span>}
                      {s.end_date && <span>End: {new Date(s.end_date).toLocaleDateString()}</span>}
                    </div>
                    <div className="flex gap-2 mt-3">
                      {s.state === "future" && (
                        <Button size="sm" variant="outline" onClick={() => handleStartSprint(s.id)} disabled={actionSprintId === s.id}>
                          {actionSprintId === s.id ? "..." : "Start"}
                        </Button>
                      )}
                      {s.state === "active" && (
                        <Button size="sm" variant="outline" onClick={() => handleCompleteSprint(s.id)} disabled={actionSprintId === s.id}>
                          {actionSprintId === s.id ? "..." : "Complete"}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteSprint(s.id)} disabled={actionSprintId === s.id}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Modal open={createSprintOpen} onOpenChange={setCreateSprintOpen} title="Create Sprint">
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Name</label><Input value={sprintName} onChange={(e) => setSprintName(e.target.value)} placeholder="Sprint 1" className="bg-[#f6f8fa] dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600" /></div>
              <div><label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Goal (optional)</label><textarea className="h-20 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-[#f6f8fa] dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={sprintGoal} onChange={(e) => setSprintGoal(e.target.value)} placeholder="What should this sprint achieve?" /></div>
              <Button onClick={handleCreateSprint} disabled={creatingSprint || !sprintName.trim()} className="w-full bg-red-600 text-white hover:bg-red-700">{creatingSprint ? "Creating..." : "Create Sprint"}</Button>
            </div>
          </Modal>
        </div>
      )}

      {activeTab === "settings" && (
        <Card><CardHeader><CardTitle className="text-lg">Project Settings</CardTitle></CardHeader><CardContent className="space-y-3">
          <div><label className="text-sm font-medium">Key</label><Input value={project.key} disabled /></div>
          <div><label className="text-sm font-medium">Name</label><Input value={project.name} disabled /></div>
          <Button variant="destructive" onClick={handleDeleteProject} disabled={deleting}>{deleting ? "Deleting..." : "Delete Project"}</Button>
        </CardContent></Card>
      )}
    </div>
  );
}