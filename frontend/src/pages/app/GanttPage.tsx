import { useState, useEffect, useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useToastStore } from "@/stores/toastStore";
import api from "@/lib/api";

interface GanttIssue {
  id: string;
  key: string;
  summary: string;
  status_id: string | null;
  status_name: string | null;
  assignee_id: string | null;
  sprint_id: string | null;
  story_points: number | null;
  parent_issue_id: string | null;
  created_at: string | null;
  due_date: string | null;
}

interface GanttSprint {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  state: string;
}

interface GanttData {
  issues: GanttIssue[];
  sprints: GanttSprint[];
}

const STATUS_COLORS: Record<string, string> = {
  "To Do": "#3b82f6",
  "In Progress": "#f59e0b",
  Resolved: "#22c55e",
  Closed: "#6b7280",
};

const BAR_HEIGHT = 28;
const ROW_GAP = 4;
const DAY_WIDTH = 28;
const HEADER_HEIGHT = 60;
const LABEL_WIDTH = 280;

function toDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function dayOffset(date: Date, origin: Date): number {
  return Math.floor((date.getTime() - origin.getTime()) / 86400000);
}

export function GanttPage() {
  const { projectKey } = useParams({ from: "/app/projects/$projectKey/gantt" });
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const addToast = useToastStore((s) => s.addToast);
  const [data, setData] = useState<GanttData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectKey || !selectedWorkspaceId) return;
    setLoading(true);
    api.get(`/api/v1/projects/${projectKey}/gantt`)
      .then((r) => setData(r.data as GanttData))
      .catch(() => addToast("Failed to load Gantt data", "error"))
      .finally(() => setLoading(false));
  }, [projectKey, selectedWorkspaceId, addToast]);

  const { dateOrigin, totalDays, weeks } = useMemo(() => {
    if (!data || data.issues.length === 0)
      return { dateOrigin: new Date(), totalDays: 30, weeks: [] as { start: Date; end: Date }[] };

    const dates = data.issues.flatMap((i) => {
      const ds: Date[] = [];
      const c = toDate(i.created_at);
      const d = toDate(i.due_date);
      if (c) ds.push(c);
      if (d) ds.push(d);
      return ds;
    });
    data.sprints.forEach((s) => {
      const st = toDate(s.start_date);
      const en = toDate(s.end_date);
      if (st) dates.push(st);
      if (en) dates.push(en);
    });

    if (dates.length === 0) return { dateOrigin: new Date(), totalDays: 30, weeks: [] };

    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 14);

    const total = Math.max(30, Math.ceil((max.getTime() - min.getTime()) / 86400000));
    const weeks: { start: Date; end: Date }[] = [];
    for (let d = new Date(min); d <= max; d.setDate(d.getDate() + 7)) {
      const end = new Date(d);
      end.setDate(end.getDate() + 6);
      weeks.push({ start: new Date(d), end });
    }
    return { dateOrigin: min, totalDays: total, weeks };
  }, [data]);

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">Loading Gantt...</div>;
  if (!data) return <div className="p-8 text-gray-500 dark:text-gray-400">No data</div>;
  if (data.issues.length === 0) return <div className="p-8 text-gray-500 dark:text-gray-400">No issues to display on the Gantt chart.</div>;

  const issuesWithDates = data.issues.filter((i) => toDate(i.created_at) || toDate(i.due_date));
  if (issuesWithDates.length === 0) return <div className="p-8 text-gray-500 dark:text-gray-400">No issues with dates. Set due dates on issues to see them on the chart.</div>;

  const chartWidth = totalDays * DAY_WIDTH + 20;
  const bodyHeight = issuesWithDates.length * (BAR_HEIGHT + ROW_GAP) + 10;

  return (
    <div className="mx-auto max-w-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gantt Chart</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{projectKey} &mdash; {issuesWithDates.length} issues with dates</p>
      </div>

      <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex" style={{ minWidth: LABEL_WIDTH + chartWidth }}>
          {/* Labels column */}
          <div className="shrink-0 border-r border-gray-200 dark:border-gray-700" style={{ width: LABEL_WIDTH }}>
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 px-3 font-semibold text-sm text-gray-600 dark:text-gray-300" style={{ height: HEADER_HEIGHT }}>
              Issue
            </div>
            {issuesWithDates.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700/50 px-3 text-sm"
                style={{ height: BAR_HEIGHT + ROW_GAP }}
              >
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 shrink-0">{issue.key}</span>
                <span className="truncate text-gray-800 dark:text-gray-200">{issue.summary}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="overflow-hidden">
            <div style={{ width: chartWidth }}>
              {/* Week headers */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750" style={{ height: HEADER_HEIGHT }}>
                {weeks.map((w, i) => {
                  const left = dayOffset(w.start, dateOrigin) * DAY_WIDTH;
                  const label = w.start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <div
                      key={i}
                      className="absolute text-xs text-gray-500 dark:text-gray-400 px-1 pt-1 border-l border-gray-200 dark:border-gray-700"
                      style={{ left: left + "px", width: DAY_WIDTH * 7 }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* Grid lines */}
              <div className="relative" style={{ height: bodyHeight }}>
                {weeks.map((w, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-gray-100 dark:border-gray-700/30"
                    style={{ left: dayOffset(w.start, dateOrigin) * DAY_WIDTH + "px", width: DAY_WIDTH * 7 }}
                  />
                ))}

                {/* Sprint bands */}
                {data.sprints.map((sprint) => {
                  const st = toDate(sprint.start_date);
                  const en = toDate(sprint.end_date);
                  if (!st || !en) return null;
                  const left = dayOffset(st, dateOrigin) * DAY_WIDTH;
                  const width = (dayOffset(en, dateOrigin) - dayOffset(st, dateOrigin) + 1) * DAY_WIDTH;
                  return (
                    <div
                      key={sprint.id}
                      className="absolute top-0 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 overflow-hidden"
                      style={{ left: left + "px", width: Math.max(width, 20) + "px", height: bodyHeight, pointerEvents: "none" }}
                      title={sprint.name}
                    >
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 px-1 leading-tight block">{sprint.name}</span>
                    </div>
                  );
                })}

                {/* Issue bars */}
                {issuesWithDates.map((issue, idx) => {
                  const created = toDate(issue.created_at);
                  const due = toDate(issue.due_date);
                    let start = created || due || new Date();
                    let end = due || created || new Date();
                    if (end < start) { const t = start; start = end; end = t; }
                  const left = dayOffset(start, dateOrigin) * DAY_WIDTH;
                  const width = Math.max((dayOffset(end, dateOrigin) - dayOffset(start, dateOrigin) + 1) * DAY_WIDTH, DAY_WIDTH);
                  const top = idx * (BAR_HEIGHT + ROW_GAP) + 5;
                  const barColor = STATUS_COLORS[issue.status_name || ""] || "#8b5cf6";

                  return (
                    <div
                      key={issue.id}
                      className="absolute rounded cursor-pointer transition-opacity hover:opacity-80 flex items-center px-2 text-white text-xs font-medium"
                      style={{
                        left: left + "px",
                        width: Math.max(width, 16) + "px",
                        top: top + "px",
                        height: BAR_HEIGHT + "px",
                        backgroundColor: barColor,
                        minWidth: 16,
                      }}
                      title={`${issue.key}: ${issue.summary} (${issue.status_name || "No status"})`}
                    >
                      {width > 40 && <span className="truncate">{issue.key}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
