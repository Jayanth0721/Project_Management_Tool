import { useState, useEffect, useCallback } from "react";
import { useParams } from "@tanstack/react-router";
import { Plus, ArrowRight, Target, Calendar, GripVertical } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useToastStore } from "@/stores/toastStore";
import api from "@/lib/api";

interface Issue {
  id: string;
  key: string;
  summary: string;
  status_id: string | null;
  assignee_id: string | null;
  priority_id: string | null;
  sprint_id: string | null;
  story_points: number | null;
  created_at: string | null;
}

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  state: string;
  start_date: string | null;
  end_date: string | null;
  issues: Issue[];
}

interface BacklogData {
  backlog: Issue[];
  sprints: Sprint[];
}

export function BacklogPage() {
  const { projectKey } = useParams({ from: "/app/projects/$projectKey/backlog" });
  // const navigate = useNavigate();
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const addToast = useToastStore((s) => s.addToast);
  const [data, setData] = useState<BacklogData | null>(null);
  const [loading, setLoading] = useState(true);
  // const [draggedIssue, setDraggedIssue] = useState<string | null>(null);

  const fetchBacklog = useCallback(async () => {
    if (!projectKey || !selectedWorkspaceId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/projects/${projectKey}/backlog`);
      setData(res.data as BacklogData);
    } catch {
      addToast("Failed to load backlog", "error");
    } finally {
      setLoading(false);
    }
  }, [projectKey, selectedWorkspaceId, addToast]);

  useEffect(() => { fetchBacklog(); }, [fetchBacklog]);

  const handleDropOnSprint = async (sprintId: string | null, issueId: string) => {
    try {
      await api.post(`/api/v1/projects/${projectKey}/backlog/assign`, {
        issue_ids: [issueId],
        sprint_id: sprintId,
      });
      addToast("Issue assigned", "success");
      fetchBacklog();
    } catch {
      addToast("Failed to assign", "error");
    }
  };

  const handleCreateSprint = async () => {
    try {
      await api.post(`/api/v1/projects/${projectKey}/sprints`, { name: `Sprint ${(data?.sprints.length ?? 0) + 1}` });
      addToast("Sprint created", "success");
      fetchBacklog();
    } catch {
      addToast("Failed to create sprint", "error");
    }
  };

  if (loading && !data) {
    return <div className="p-8 text-gray-500 dark:text-gray-400">Loading backlog...</div>;
  }

  if (!projectKey) {
    return <div className="p-8 text-gray-500 dark:text-gray-400">No project selected</div>;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Backlog</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{projectKey}</p>
        </div>
        <button
          onClick={handleCreateSprint}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Create Sprint
        </button>
      </div>

      <div className="space-y-8">
        {/* Unassigned issues */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Backlog ({data?.backlog.length ?? 0})
          </h2>
          <div className="space-y-1">
            {data?.backlog.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                sprints={data?.sprints ?? []}
                onDrop={handleDropOnSprint}
              />
            ))}
            {data?.backlog.length === 0 && (
              <p className="py-4 text-sm text-gray-400 dark:text-gray-500">No unassigned issues</p>
            )}
          </div>
        </section>

        {/* Sprints */}
        {data?.sprints.map((sprint) => (
          <section key={sprint.id}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  {sprint.name}
                  <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {sprint.state}
                  </span>
                </h2>
                {sprint.goal && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{sprint.goal}</p>
                )}
                {sprint.start_date && (
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {sprint.start_date} — {sprint.end_date ?? "TBD"}
                  </p>
                )}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {sprint.issues.reduce((sum, i) => sum + (i.story_points ?? 0), 0)} pts
              </span>
            </div>
            <div className="space-y-1">
              {sprint.issues.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  sprints={data?.sprints ?? []}
                  onDrop={handleDropOnSprint}
                />
              ))}
              {sprint.issues.length === 0 && (
                <p className="py-2 text-sm text-gray-400 dark:text-gray-500">No issues in this sprint</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function IssueRow({ issue, sprints, onDrop }: { issue: Issue; sprints: Sprint[]; onDrop: (sprintId: string | null, issueId: string) => void }) {
  const [assignTo, setAssignTo] = useState("");

  const handleAssign = () => {
    if (!assignTo) return;
    onDrop(assignTo === "backlog" ? null : assignTo, issue.id);
    setAssignTo("");
  };

  return (
    <div className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0 cursor-grab" />
        <span className="text-xs font-mono text-blue-600 dark:text-blue-400 shrink-0">{issue.key}</span>
        <span className="truncate text-sm text-gray-800 dark:text-gray-200">{issue.summary}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {issue.story_points != null && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{issue.story_points}pt</span>
        )}
        <select
          value={assignTo}
          onChange={(e) => { setAssignTo(e.target.value); }}
          className="h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 text-xs text-gray-700 dark:text-gray-300"
        >
          <option value="">Move to...</option>
          <option value="backlog">Backlog (unassign)</option>
          {sprints.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {assignTo && (
          <button onClick={handleAssign} className="rounded bg-blue-600 p-1 text-white hover:bg-blue-700">
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
