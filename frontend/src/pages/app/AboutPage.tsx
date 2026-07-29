import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard, Briefcase, Columns3, ListTodo, FileText, Search, Bell,
  MessageSquare, Paperclip, User, Sun, Moon, Coffee, Sparkles, ArrowRight,
} from "lucide-react";

const sections = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    desc: "Your workspace at a glance. See project stats, issue distribution (pie chart), and recent activity all in one place.",
    link: "/app",
    linkLabel: "Go to Dashboard",
  },
  {
    icon: Briefcase,
    title: "Projects & Issues",
    desc: "Create projects with a unique key (e.g. PROJ). Each project auto-numbers issues like PROJ-1, PROJ-2. Track summary, description, assignee, priority, story points, and due dates.",
    link: "/app/projects",
    linkLabel: "View Projects",
  },
  {
    icon: Columns3,
    title: "Kanban Board",
    desc: "Drag and drop issues between columns (To Do, In Progress, Resolved, Closed). Filter by assignee to focus on specific work. Statuses are auto-created per project.",
    link: "/app/projects",
    linkLabel: "Open a project → Board",
  },
  {
    icon: ListTodo,
    title: "Sprints",
    desc: "Plan work in sprints. Create sprints with a goal, start them to begin tracking, and complete them when done. Each sprint has a future → active → completed lifecycle.",
    link: "/app/projects",
    linkLabel: "Open a project → Sprints",
  },
  {
    icon: FileText,
    title: "Spaces & Pages",
    desc: "Documentation spaces like Confluence. Create spaces (e.g. Engineering, Design), then write pages with the TipTap rich-text editor. View version history and restore previous versions.",
    link: "/app/spaces",
    linkLabel: "View Spaces",
  },
  {
    icon: MessageSquare,
    title: "Comments & Attachments",
    desc: "Discuss issues and pages with threaded comments. Upload files as attachments — images, PDFs, or documents. Download them directly from the attachment list.",
    link: "/app/spaces",
    linkLabel: "Open any issue or page",
  },
  {
    icon: Search,
    title: "Search",
    desc: "Cross-workspace search across both issues and pages. Results are grouped by type with direct links to each resource.",
    link: "/app/search",
    linkLabel: "Try Search",
  },
  {
    icon: Bell,
    title: "Notifications",
    desc: "Stay updated with a notification badge on the sidebar. Mark individual notifications as read or clear all at once.",
    link: "/app/notifications",
    linkLabel: "View Notifications",
  },
  {
    icon: User,
    title: "Profile & Themes",
    desc: "Edit your profile name and choose between Light and Dark themes. Switch quickly from the topbar sun/moon icon.",
    link: "/app/settings/profile",
    linkLabel: "Open Settings",
  },
  {
    icon: User,
    title: "Workspace Members",
    desc: "Invite members by email with roles (Admin, Member, Guest). Manage your workspace team from the Settings page.",
    link: "/app/settings/workspace",
    linkLabel: "Manage Members",
  },
];

export function AboutPage() {
  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/25">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Tolab</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          A fusion of Confluence & Jira — manage projects, track issues, document knowledge, and collaborate with your team.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((s, i) => (
          <Card key={i} className="border-0 shadow-md transition-all duration-200 hover:shadow-lg">
            <CardHeader className="flex flex-row items-start gap-3 pb-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{s.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              <Link
                to={s.link as any}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {s.linkLabel} <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 to-violet-500/5">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Built with FastAPI + SQLAlchemy (backend) &bull; React 19 + TanStack Router + Tailwind v4 (frontend)
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">Tolab &mdash; All-in-one workspace</p>
        </CardContent>
      </Card>
    </div>
  );
}
