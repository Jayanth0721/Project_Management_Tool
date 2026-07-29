import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/stores/toastStore";
import {
  Puzzle,
  MessageSquare,
  Slack,
  Clock,
  Rocket,
  Sparkles,
  Check,
  ChevronRight,
  Webhook,
  Bell,
  Calendar,
  Github,
  GitBranch,
  Mail,
  Cloud,
  Bot,
} from "lucide-react";

type Status = "upcoming" | "planned" | "exploring";

const STATUS_LABEL: Record<Status, string> = {
  upcoming: "Upcoming",
  planned: "Planned",
  exploring: "Exploring",
};

const STATUS_CLASSES: Record<Status, string> = {
  upcoming: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  planned: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  exploring: "bg-muted text-muted-foreground",
};

interface Plugin {
  id: string;
  name: string;
  description: string;
  category: "Messaging" | "DevOps" | "Productivity" | "Notifications" | "Other";
  status: Status;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  features: string[];
  docsUrl?: string;
}

const PLUGINS: Plugin[] = [
  {
    id: "ms-teams",
    name: "Microsoft Teams",
    description: "Post notifications to channels, send invitations through Teams, and receive issue updates as adaptive cards.",
    category: "Messaging",
    status: "upcoming",
    icon: MessageSquare,
    accent: "from-[#5059C9] to-[#7B83EB]",
    features: [
      "Incoming webhook: post to a channel when an issue is created or transitioned",
      "Outgoing webhook: create an issue from a Teams message via /tolab command",
      "Adaptive card acceptance buttons for pending invitations",
      "Two-way mention sync with Tolab comments",
    ],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Slack app with slash commands, channel notifications, and slash-driven issue creation.",
    category: "Messaging",
    status: "planned",
    icon: Slack,
    accent: "from-[#4A154B] to-[#611f69]",
    features: [
      "/tolab new <summary> — create issue from Slack",
      "/tolab link <project-key> — bind a channel to a project",
      "Slack notifications when issues transition, get assigned, or are @-mentioned",
      "Mirror Tolab comments back into a linked Slack thread",
    ],
  },
  {
    id: "github",
    name: "GitHub",
    description: "Link commits, branches, and pull requests to Tolab issues. Auto-resolve issues from a closed PR or commit message.",
    category: "DevOps",
    status: "exploring",
    icon: Github,
    accent: "from-[#181717] to-[#303030]",
    features: [
      "Auto-link PROJ-123 in commit messages and PR titles",
      "Transition issues to Closed when a related PR is merged",
      "Surface merged PRs in the issue activity timeline",
    ],
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "Mirror GitHub integration for self-hosted GitLab — commit/PR linkage and webhook-driven transitions.",
    category: "DevOps",
    status: "exploring",
    icon: GitBranch,
    accent: "from-[#FC6D26] to-[#E24329]",
    features: [
      "Commit and MR mentions create issue links",
      "Push events update sprint progress",
      "Pipeline failures post to a configurable channel",
    ],
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Bidirectional sync of sprint start/end dates and issue due dates with Google Calendar events.",
    category: "Productivity",
    status: "planned",
    icon: Calendar,
    accent: "from-[#4285F4] to-[#34A853]",
    features: [
      "Create a calendar event per sprint with goal as the description",
      "Issue due dates appear as all-day events",
      "Edit on either side; sync runs every 5 minutes",
    ],
  },
  {
    id: "outlook",
    name: "Outlook 365",
    description: "Send invitation emails and meeting invites via Outlook. Reply-to-approve invitations directly from the email client.",
    category: "Productivity",
    status: "exploring",
    icon: Mail,
    accent: "from-[#0078D4] to-[#106EBE]",
    features: [
      "OAUTH2 flow to bind a user mailbox",
      "Actionable messages for Outlook desktop & web",
      "Calendar invite attached to the accept-invitation flow",
    ],
  },
  {
    id: "discord",
    name: "Discord",
    description: "Channel bot for project updates, issue triage commands, and slash-driven board moves.",
    category: "Messaging",
    status: "exploring",
    icon: Bot,
    accent: "from-[#5865F2] to-[#4752C4]",
    features: [
      "!move <issue-key> <status> from a project channel",
      "Post new issues to a project's Discord channel",
      "Threaded replies mirror Tolab comments",
    ],
  },
  {
    id: "twilio-sms",
    name: "Twilio SMS",
    description: "Send SMS reminders for overdue issues, sprint start/end, and high-priority assignments.",
    category: "Notifications",
    status: "exploring",
    icon: Bell,
    accent: "from-[#F22F46] to-[#CB1F2D]",
    features: [
      "Per-user SMS preferences for priority and quiet hours",
      "Daily digest of assigned issues at user-set time",
      "Opt-out reply STOP across the workspace",
    ],
  },
  {
    id: "webhooks",
    name: "Generic Webhooks",
    description: "Outgoing webhooks for every domain event: issue.created, issue.transitioned, sprint.stopped, page.published.",
    category: "Notifications",
    status: "upcoming",
    icon: Webhook,
    accent: "from-[#7E22CE] to-[#9333EA]",
    features: [
      "Define multiple listeners per event with HMAC signing",
      "Retry with exponential backoff (1m, 5m, 15m, 1h, 4h)",
      "Inspect delivery history and replay individual events",
    ],
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Official Tolab app on Zapier — trigger workflows from issue events, or push updates into Tolab.",
    category: "Productivity",
    status: "planned",
    icon: Rocket,
    accent: "from-[#FF4F00] to-[#FF6B35]",
    features: [
      "Triggers: New issue, Status changed, Sprint completed",
      "Actions: Create issue, Update status, Search issues",
      "Prebuilt Zap templates for Sheets, Notion, Airtable, Slack",
    ],
  },
];

const CATEGORIES = ["All", "Messaging", "DevOps", "Productivity", "Notifications", "Other"] as const;

export function PluginsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All");
  const [selected, setSelected] = useState<string | null>(null);

  const plugins = filter === "All" ? PLUGINS : PLUGINS.filter((p) => p.category === filter);
  const selectedPlugin = PLUGINS.find((p) => p.id === selected);

  const handleNotify = (name: string) => {
    addToast(`Got it. We'll let you know when ${name} is ready.`, "success");
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Hero */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-violet-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/25">
            <Puzzle className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Plugins & Integrations</h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Connect Tolab with the tools your team already uses. Some integrations are shipping soon —
              subscribe to be notified when they land.
            </p>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === cat
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Plugins grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {plugins.map((plugin) => (
          <Card key={plugin.id} className="overflow-hidden transition-all hover:shadow-md">
            <div className={`h-1.5 w-full bg-gradient-to-r ${plugin.accent}`} />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${plugin.accent} text-white shadow-sm`}>
                  <plugin.icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[plugin.status]}`}>
                    {STATUS_LABEL[plugin.status]}
                  </span>
                </div>
              </div>
              <CardTitle className="mt-3 text-lg flex items-center gap-2">
                {plugin.name}
                <span className="text-xs rounded-md border bg-muted/40 px-1.5 py-0.5 text-muted-foreground font-normal">
                  {plugin.category}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{plugin.description}</p>

              <div className="space-y-1.5">
                {plugin.features.slice(0, 3).map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelected(plugin.id)}
                >
                  View details
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                {plugin.status === "upcoming" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleNotify(plugin.name)}
                    className="text-primary"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Notify me
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail modal — replaces Modal component so we can show the full feature list */}
      {selectedPlugin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${selectedPlugin.accent} text-white shadow-lg`}>
                <selectedPlugin.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{selectedPlugin.name}</h2>
                  <button
                    onClick={() => setSelected(null)}
                    className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[selectedPlugin.status]}`}>
                    {STATUS_LABEL[selectedPlugin.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">{selectedPlugin.category}</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">{selectedPlugin.description}</p>

            <ul className="mt-4 space-y-2">
              {selectedPlugin.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {selectedPlugin.status === "upcoming"
                  ? "Shipping in the next release"
                  : selectedPlugin.status === "planned"
                  ? "On the near-term roadmap"
                  : "Under consideration — vote for it to move up"}
              </p>
              {selectedPlugin.status !== "exploring" ? (
                <Button size="sm" onClick={() => handleNotify(selectedPlugin.name)}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Notify me
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => handleNotify(selectedPlugin.name)}>
                  Vote for this
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footnote */}
      <div className="rounded-xl border bg-muted/20 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Don't see an integration you need?{" "}
          <a href="#" className="font-medium text-primary hover:underline" onClick={(e) => { e.preventDefault(); addToast("Thanks! Sumbit a request at hi@tolab.dev", "success"); }}>
            Request a new plugin
          </a>
        </p>
      </div>
    </div>
  );
}
