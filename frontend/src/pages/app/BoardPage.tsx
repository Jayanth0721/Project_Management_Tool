import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { useToastStore } from "@/stores/toastStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface Issue {
  id: string;
  key: string;
  summary: string;
  status_id: string | null;
  assignee_id: string | null;
}

interface Status {
  id: string;
  name: string;
  category: string;
}

function SortableCard({ issue }: { issue: Issue }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-lg border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 ring-2 ring-primary" : ""
      }`}
    >
      <Link
        to="/app/projects/$projectKey/issues/$issueKey"
        params={{ projectKey: issue.key.split("-")[0], issueKey: issue.key }}
        className="text-xs font-mono text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {issue.key}
      </Link>
      <p className="mt-1 text-sm line-clamp-2">{issue.summary}</p>
    </div>
  );
}

export function BoardPage() {
  const { projectKey } = useParams({ from: "/app/projects/$projectKey/board" }) as { projectKey: string };
  const { selectedWorkspaceId } = useWorkspaceStore();
  const addToast = useToastStore((s) => s.addToast);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSummary, setNewSummary] = useState("");
  const [creating, setCreating] = useState(false);
  const [filterAssigneeId, setFilterAssigneeId] = useState("");
  const [members, setMembers] = useState<{ user_id: string; user_name: string }[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!projectKey || !selectedWorkspaceId) return;
    setLoading(true);
    Promise.all([
      api.get(`/api/v1/projects/${projectKey}/issues`).then((r) => setIssues(r.data as Issue[])),
      api.get(`/api/v1/workspaces/${selectedWorkspaceId}/projects/${projectKey}/statuses`).then((r) => setStatuses(r.data as Status[])),
    ]).catch(() => addToast("Failed to load board", "error")).finally(() => setLoading(false));
    api.get(`/api/v1/workspaces/${selectedWorkspaceId}/members`).then((r) => {
      setMembers(r.data as { user_id: string; user_name: string }[]);
    }).catch(() => {});
  }, [projectKey, selectedWorkspaceId]);

  const columnMap = useMemo(() => {
    const map: Record<string, Issue[]> = {};
    for (const s of statuses) map[s.name] = [];
    for (const i of issues) {
      const status = statuses.find((s) => s.id === i.status_id);
      const colName = status?.name ?? "To Do";
      if (map[colName]) map[colName].push(i);
      else map[colName] = [i];
    }
    return map;
  }, [issues, statuses]);

  const columnNames = useMemo(() => statuses.map((s) => s.name), [statuses]);

  const filteredColumns = useMemo(() => {
    if (!filterAssigneeId) return columnMap;
    const f: Record<string, Issue[]> = {};
    for (const [col, items] of Object.entries(columnMap)) {
      f[col] = items.filter((i) => i.assignee_id === filterAssigneeId);
    }
    return f;
  }, [columnMap, filterAssigneeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIssue = issues.find((i) => i.id === active.id);
    if (!activeIssue) return;

    const overId = over.id as string;
    const targetCol = columnNames.find((col) =>
      filteredColumns[col]?.some((i) => i.id === overId)
    ) || (columnNames.includes(overId) ? overId : null);

    if (!targetCol) return;

    const targetStatus = statuses.find((s) => s.name === targetCol);
    if (!targetStatus || targetStatus.id === activeIssue.status_id) return;

    try {
      await api.post(`/api/v1/projects/${projectKey}/issues/${activeIssue.key}/transition`, {
        status_id: targetStatus.id,
      });
      setIssues((prev) =>
        prev.map((i) => (i.id === activeIssue.id ? { ...i, status_id: targetStatus.id } : i))
      );
    } catch {
      addToast("Failed to move issue", "error");
    }
  };

  const handleCreate = async () => {
    if (!newSummary.trim() || !projectKey) return;
    setCreating(true);
    try {
      await api.post(`/api/v1/projects/${projectKey}/issues`, { summary: newSummary.trim() });
      setShowCreate(false);
      setNewSummary("");
      const r = await api.get(`/api/v1/projects/${projectKey}/issues`);
      setIssues(r.data as Issue[]);
    } catch { addToast("Failed to create issue", "error"); } finally { setCreating(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const draggedIssue = activeId ? issues.find((i) => i.id === activeId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <Link to="/app/projects" className="hover:underline">Projects</Link>
          <span className="mx-1">/</span>
          <Link to="/app/projects/$projectKey" params={{ projectKey }} className="hover:underline">{projectKey}</Link>
          <span className="mx-1">/</span>
          <span className="font-medium text-foreground">Board</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterAssigneeId}
            onChange={(e) => setFilterAssigneeId(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-xs"
          >
            <option value="">All assignees</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.user_name}</option>
            ))}
          </select>
          <Button size="sm" onClick={() => setShowCreate(true)}>+ Add Issue</Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-3">
          {columnNames.map((col) => (
            <div key={col} className="rounded-xl border bg-muted/20 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                    col === "To Do" ? "bg-blue-500" :
                    col === "In Progress" ? "bg-amber-500" :
                    col === "Resolved" ? "bg-violet-500" :
                    col === "Closed" ? "bg-emerald-500" : "bg-gray-500"
                  }`} />
                  {col}
                </h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {filteredColumns[col]?.length ?? 0}
                </span>
              </div>
              <SortableContext items={filteredColumns[col]?.map((i) => i.id) ?? []} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 min-h-[60px]">
                  {filteredColumns[col]?.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2 text-center">Empty</p>
                  ) : (
                    filteredColumns[col]?.map((i) => <SortableCard key={i.id} issue={i} />)
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
        <DragOverlay>
          {draggedIssue && (
            <div className="rounded-lg border bg-card p-3 shadow-xl opacity-90">
              <p className="text-xs font-mono text-primary">{draggedIssue.key}</p>
              <p className="mt-1 text-sm">{draggedIssue.summary}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <Modal open={showCreate} onOpenChange={setShowCreate} title="Add Issue">
        <div className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Summary</label><Input value={newSummary} onChange={(e) => setNewSummary(e.target.value)} placeholder="Task summary" className="bg-[#f6f8fa] dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600" /></div>
          <Button onClick={handleCreate} disabled={creating} className="w-full bg-red-600 text-white hover:bg-red-700">{creating ? "Creating..." : "Create"}</Button>
        </div>
      </Modal>
    </div>
  );
}
