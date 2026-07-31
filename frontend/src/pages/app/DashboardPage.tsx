import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useProjects, useIssuesForProjects, useActivityFeed, useStatusDistribution, useStatusMap, useCounts, useVelocity } from "@/hooks/useDashboard";
import { Link } from "@tanstack/react-router";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Briefcase, Bug, FileText, User, ArrowRight, Activity, TrendingUp } from "lucide-react";

const statCards = [
  { label: "Projects", icon: Briefcase, gradient: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/20" },
  { label: "Issues", icon: Bug, gradient: "from-violet-500 to-purple-500", shadow: "shadow-violet-500/20" },
  { label: "Spaces", icon: FileText, gradient: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-500/20" },
  { label: "User", icon: User, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20" },
];

export function DashboardPage() {
  const { fullName } = useAuth();
  const { selectedWorkspaceName } = useWorkspaceStore();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: issues, isLoading: loadingIssues } = useIssuesForProjects(projects);
  const { data: statusMap } = useStatusMap(projects);
  const { spacesCount, membersCount } = useCounts(projects);
  const { data: activity } = useActivityFeed();
  const { data: velocity } = useVelocity();
  const statusData = useStatusDistribution(issues, statusMap);

  const activeProjects = projects?.filter((p) => !p.is_archived) ?? [];
  const issueCount = issues?.length ?? 0;

  const statValues = [
    loadingProjects ? "..." : activeProjects.length,
    loadingIssues ? "..." : issueCount,
    spacesCount,
    membersCount,
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {selectedWorkspaceName
            ? `Workspace: ${selectedWorkspaceName}`
            : "No workspace selected"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} ${card.shadow} shadow-lg p-5 text-white`}
          >
            <div className="absolute right-2 top-2 opacity-10 transition-transform duration-300 group-hover:scale-110">
              <card.icon className="h-12 w-12" />
            </div>
            <p className="text-sm font-medium text-white/80">{card.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {statValues[i] !== null ? statValues[i] : (
                i === 0 ? activeProjects.length : i === 1 ? issueCount : null
              )}
            </p>
            {i === 0 && (
              <Link to="/app/projects" className="mt-2 inline-flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            {i === 2 && (
              <Link to="/app/spaces" className="mt-2 inline-flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors">
                Manage <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            {i === 3 && (
              <p className="mt-1 text-sm text-white/70 truncate">{fullName}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingProjects ? (
              <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
            ) : activeProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <div className="space-y-2">
                {activeProjects.map((p, idx) => (
                  <div
                    key={p.id}
                    className="group flex items-center justify-between rounded-lg border bg-card p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {p.key.slice(0, 2)}
                      </div>
                      <div>
                        <Link
                          to="/app/projects/$projectKey"
                          params={{ projectKey: p.key }}
                          className="font-medium text-sm hover:text-primary transition-colors"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{p.key} &middot; {p.type}</p>
                      </div>
                    </div>
                    <Link
                      to="/app/projects/$projectKey"
                      params={{ projectKey: p.key }}
                      className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Open &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}
            <Link to="/app/projects" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all projects <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <Bug className="h-4 w-4 text-violet-500" />
              Issue Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingIssues ? (
              <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
            ) : statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No issues yet.</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5 w-full">
                  {statusData.map((s) => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                        {s.name}
                      </span>
                      <span className="font-semibold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {!activity || activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-1">
              {activity.slice(0, 8).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <Activity className="h-3 w-3 text-primary" />
                  </div>
                  <span className="font-medium capitalize min-w-[80px] text-foreground">{a.verb}</span>
                  <span className="text-muted-foreground">
                    {a.target_type} <span className="mx-1">&mdash;</span> {a.target_id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Sprint Velocity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {!velocity || velocity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed sprints yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={velocity.slice().reverse()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Bar dataKey="total_points" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Story Points" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
