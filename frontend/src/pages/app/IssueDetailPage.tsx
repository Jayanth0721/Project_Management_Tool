import { useEffect, useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { CommentSection } from "@/components/comments/CommentSection";
import { AttachmentSection } from "@/components/attachments/AttachmentSection";
import { Avatar } from "@/components/ui/Avatar";
import { useToastStore } from "@/stores/toastStore";

interface IssueDetail {
  id: string;
  project_id: string;
  key: string;
  issue_type_id: string | null;
  status_id: string | null;
  priority_id: string | null;
  summary: string;
  description: string | null;
  reporter_id: string | null;
  assignee_id: string | null;
  due_date: string | null;
  story_points: number | null;
  sprint_id: string | null;
  parent_issue_id: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
}

const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export function IssueDetailPage() {
  const { projectKey, issueKey } = useParams({
    from: "/app/projects/$projectKey/issues/$issueKey",
  }) as { projectKey: string; issueKey: string };

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editSummary, setEditSummary] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const fetchIssue = () => {
    if (!projectKey || !issueKey) return;
    setLoading(true);
    api
      .get(`/api/v1/projects/${projectKey}/issues/${issueKey}`)
      .then((r) => {
        const d = r.data as IssueDetail;
        setIssue(d);
        setEditSummary(d.summary);
        setEditDescription(d.description || "");
        setEditStatus(STATUSES.includes(d.status_id || "") ? d.status_id || "" : "Open");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(fetchIssue, [projectKey, issueKey]);

  const handleSave = async () => {
    if (!issue || !projectKey || !issueKey) return;
    setSaving(true);
    try {
      await api.patch(`/api/v1/projects/${projectKey}/issues/${issueKey}`, {
        summary: editSummary,
        description: editDescription || undefined,
      });
      if (editStatus !== issue.status_id) {
        await api.post(`/api/v1/projects/${projectKey}/issues/${issueKey}/transition`, {
          status_id: editStatus,
        });
      }
      setEditMode(false);
      fetchIssue();
    } catch {
      addToast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!issue) return <Card><CardContent className="py-6 text-center text-muted-foreground">Issue not found</CardContent></Card>;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <Link to="/app/projects" className="hover:underline">Projects</Link>
        <span className="mx-1">/</span>
        <Link to="/app/projects/$projectKey" params={{ projectKey }} className="hover:underline">{projectKey}</Link>
        <span className="mx-1">/</span>
        <span className="font-medium text-foreground">{issueKey}</span>
      </div>

      {editMode ? (
        <div className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Summary</label><Input value={editSummary} onChange={(e) => setEditSummary(e.target.value)} placeholder="Summary" className="text-lg font-bold bg-[#f6f8fa] dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Description</label><textarea className="h-48 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-[#f6f8fa] dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description..." /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Status</label>
            <select className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-[#f6f8fa] dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="bg-red-600 text-white hover:bg-red-700">{saving ? "Saving..." : "Save"}</Button>
            <Button variant="ghost" onClick={() => setEditMode(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-bold">{issueKey} — {issue.summary}</h1>
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>Edit</Button>
          </div>
          <Card>
            <CardContent className="pt-3">
              {issue.description ? (
                <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: issue.description }} />
              ) : (
                <p className="italic text-muted-foreground text-sm">No description</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Status:</span> {issue.status_id || "—"}</div>
              <div><span className="text-muted-foreground">Priority:</span> {issue.priority_id || "—"}</div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Assignee:</span>
                {issue.assignee_id ? <Avatar name={issue.assignee_id} className="h-5 w-5 text-[8px]" /> : "Unassigned"}
              </div>
              <div><span className="text-muted-foreground">Reporter:</span> {issue.reporter_id ? issue.reporter_id.slice(0,8) : "—"}</div>
              <div><span className="text-muted-foreground">Story Points:</span> {issue.story_points ?? "—"}</div>
              <div><span className="text-muted-foreground">Due:</span> {issue.due_date || "—"}</div>
              <div><span className="text-muted-foreground">Created:</span> {new Date(issue.created_at).toLocaleString()}</div>
              <div><span className="text-muted-foreground">Updated:</span> {new Date(issue.updated_at).toLocaleString()}</div>
            </CardContent>
          </Card>
          <CommentSection targetType="issues" targetId={issue.key} />
          <AttachmentSection targetType="issues" targetId={issue.key} />
        </>
      )}
    </div>
  );
}