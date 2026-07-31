import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface Project {
  id: string;
  key: string;
  name: string;
  type: string;
  is_archived: boolean;
}

interface Issue {
  id: string;
  key: string;
  summary: string;
  status_id: string | null;
  priority_id: string | null;
  project_id: string;
}

interface ActivityItem {
  id: string;
  verb: string;
  target_type: string;
  target_id: string;
  payload: string | null;
  created_at: string;
}

// interface StatusCount {
//   name: string;
//   value: number;
//   fill: string;
// }

interface StatusInfo {
  id: string;
  name: string;
  category: string;
}

const STATUS_COLORS: Record<string, string> = {
  "To Do": "#3b82f6",
  "In Progress": "#f59e0b",
  Done: "#22c55e",
  "No Status": "#6b7280",
};

export function useProjects() {
  const { selectedWorkspaceId } = useWorkspaceStore();

  return useQuery({
    queryKey: ["dashboard-projects", selectedWorkspaceId],
    queryFn: () =>
      api
        .get<Project[]>(`/api/v1/workspaces/${selectedWorkspaceId}/projects`)
        .then((r) => r.data),
    enabled: !!selectedWorkspaceId,
  });
}

export function useIssuesForProjects(projects: Project[] | undefined) {
  const { selectedWorkspaceId } = useWorkspaceStore();

  return useQuery({
    queryKey: ["dashboard-issues", selectedWorkspaceId],
    queryFn: async () => {
      if (!projects || projects.length === 0) return [];
      const results = await Promise.all(
        projects.map((p) =>
          api.get<Issue[]>(`/api/v1/projects/${p.key}/issues`).then((r) => r.data)
        )
      );
      return results.flat();
    },
    enabled: !!selectedWorkspaceId && !!projects && projects.length > 0,
    staleTime: 60000,
  });
}

export function useStatusMap(projects: Project[] | undefined) {
  const { selectedWorkspaceId } = useWorkspaceStore();

  return useQuery({
    queryKey: ["dashboard-status-map", selectedWorkspaceId],
    queryFn: async () => {
      if (!projects || projects.length === 0) return new Map<string, string>();
      const results = await Promise.all(
        projects.map((p) =>
          api
            .get<StatusInfo[]>(`/api/v1/workspaces/${selectedWorkspaceId}/projects/${p.key}/statuses`)
            .then((r) => r.data)
        )
      );
      const map = new Map<string, string>();
      for (const list of results) {
        for (const s of list) {
          map.set(s.id, s.name);
        }
      }
      return map;
    },
    enabled: !!selectedWorkspaceId && !!projects && projects.length > 0,
    staleTime: 60000,
  });
}

export function useCounts() {
  const { selectedWorkspaceId } = useWorkspaceStore();

  const spaces = useQuery({
    queryKey: ["dashboard-spaces-count", selectedWorkspaceId],
    queryFn: () =>
      api
        .get<unknown[]>(`/api/v1/workspaces/${selectedWorkspaceId}/spaces`)
        .then((r) => (r.data as unknown[]).length),
    enabled: !!selectedWorkspaceId,
  });

  const members = useQuery({
    queryKey: ["dashboard-members-count", selectedWorkspaceId],
    queryFn: () =>
      api
        .get<unknown[]>(`/api/v1/workspaces/${selectedWorkspaceId}/members`)
        .then((r) => (r.data as unknown[]).length),
    enabled: !!selectedWorkspaceId,
  });

  return {
    spacesCount: spaces.data ?? 0,
    membersCount: members.data ?? 0,
  };
}

// export function useCounts(projects: Project[] | undefined) {
//   const { selectedWorkspaceId } = useWorkspaceStore();

//   const spaces = useQuery({
//     queryKey: ["dashboard-spaces-count", selectedWorkspaceId],
//     queryFn: () =>
//       api
//         .get<unknown[]>(`/api/v1/workspaces/${selectedWorkspaceId}/spaces`)
//         .then((r) => (r.data as unknown[]).length),
//     enabled: !!selectedWorkspaceId,
//   });

//   const members = useQuery({
//     queryKey: ["dashboard-members-count", selectedWorkspaceId],
//     queryFn: () =>
//       api
//         .get<unknown[]>(`/api/v1/workspaces/${selectedWorkspaceId}/members`)
//         .then((r) => (r.data as unknown[]).length),
//     enabled: !!selectedWorkspaceId,
//   });

//   return { spacesCount: spaces.data ?? 0, membersCount: members.data ?? 0 };
// }

export function useActivityFeed() {
  const { selectedWorkspaceId } = useWorkspaceStore();

  return useQuery({
    queryKey: ["dashboard-activity", selectedWorkspaceId],
    queryFn: () =>
      api
        .get<ActivityItem[]>("/api/v1/activity", {
          params: { workspace: selectedWorkspaceId, limit: 10 },
        })
        .then((r) => r.data),
    enabled: !!selectedWorkspaceId,
  });
}

export function useVelocity() {
  const { selectedWorkspaceId } = useWorkspaceStore();

  return useQuery({
    queryKey: ["dashboard-velocity", selectedWorkspaceId],
    queryFn: () =>
      api
        .get<{ sprint_id: string; name: string; end_date: string | null; total_points: number }[]>(
          `/api/v1/workspaces/${selectedWorkspaceId}/velocity`
        )
        .then((r) => r.data),
    enabled: !!selectedWorkspaceId,
    staleTime: 60000,
  });
}

export function useStatusDistribution(issues: Issue[] | undefined, statusMap: Map<string, string> | undefined) {
  if (!issues || issues.length === 0) return [];

  const counts: Record<string, number> = {};
  for (const issue of issues) {
    const name = (issue.status_id && statusMap?.get(issue.status_id)) ?? "No Status";
    counts[name] = (counts[name] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] ?? "#6b7280",
    }))
    .sort((a, b) => b.value - a.value);
}
