import { useEffect, useState } from "react";
import { Link, useMatchRoute, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Briefcase, FileText, Search, Bell, Settings, LogOut, BookOpen, UserPlus, Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToastStore } from "@/stores/toastStore";

interface SidebarLinkProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  exact?: boolean;
}

function SidebarLink({ to, icon: Icon, label, badge, exact }: SidebarLinkProps) {
  const matchRoute = useMatchRoute();
  const isActive = matchRoute({ to, fuzzy: !exact });

  return (
    <Link
      to={to}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-neutral-400 hover:bg-muted/60 hover:text-neutral-600",
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <Icon className={cn("h-4 w-4 shrink-0 transition-all duration-200", isActive ? "text-primary" : "text-neutral-400 grayscale group-hover:text-neutral-600 group-hover:grayscale-0")} />
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{badge}</span>
      )}
    </Link>
  );
}

const links = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/app/projects", icon: Briefcase, label: "Projects" },
  { to: "/app/spaces", icon: FileText, label: "Spaces" },
  { to: "/app/search", icon: Search, label: "Search" },
];

export function Sidebar() {
  const [unread, setUnread] = useState(0);
  const { logout } = useAuth();
  const navigate = useNavigate();
  // const addToast = useToastStore((s) => s.addToast); #to test in versel deployment commented

  useEffect(() => {
    api.get("/api/v1/notifications").then((r) => {
      setUnread(r.data?.unread_count ?? 0);
    }).catch(() => {}); // notification badge is optional — no toast needed
  }, []);

  return (
    <aside className="flex w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-600 font-bold text-primary-foreground text-sm shadow-sm">
          T
        </div>
        <span className="font-bold text-base tracking-tight">Tolab</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => (
          <SidebarLink key={link.to} {...link} />
        ))}
        <div className="my-2 border-t border-dashed border-muted/60" />
        <SidebarLink to="/app/invite" icon={UserPlus} label="Invite" />
        <SidebarLink to="/app/plugins" icon={Puzzle} label="Plugins" />
        <SidebarLink to="/app/notifications" icon={Bell} label="Notifications" badge={unread} />
      </nav>
      <div className="border-t p-3 space-y-1">
        <SidebarLink to="/app/about" icon={BookOpen} label="About" />
        <SidebarLink to="/app/settings/profile" icon={Settings} label="Settings" />
        <button
          onClick={() => { logout(); navigate({ to: "/login" }); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
