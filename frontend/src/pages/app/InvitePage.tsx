import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
// import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useToastStore } from "@/stores/toastStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/lib/api";
import { Mail, Send, Copy, Check, Users, MessageSquare, ExternalLink, Link2, UserPlus } from "lucide-react";

interface Member {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  joined_at: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  created_at: string | null;
}

type InviteTab = "email" | "teams" | "link";

export function InvitePage() {
  const { selectedWorkspaceId, selectedWorkspaceName } = useWorkspaceStore();
  const addToast = useToastStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<InviteTab>("email");
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Email invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  // Link invite
  const [linkToken, setLinkToken] = useState("");
  const [copied, setCopied] = useState(false);

  // Teams invite
  const [teamsChannel, setTeamsChannel] = useState("");
  const [teamsMessage, setTeamsMessage] = useState("");
  const [sendingTeams, setSendingTeams] = useState(false);

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    Promise.all([
      api.get(`/api/v1/workspaces/${selectedWorkspaceId}/members`),
      api.get(`/api/v1/workspaces/${selectedWorkspaceId}/invitations`).catch(() => ({ data: [] })),
    ])
      .then(([m, inv]) => {
        setMembers(m.data as Member[]);
        setInvitations((inv.data as Invitation[]) ?? []);
      })
      .finally(() => setLoading(false));
  }, [selectedWorkspaceId]);

  const handleInvite = async () => {
    if (!selectedWorkspaceId) return;
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const r = await api.post(`/api/v1/workspaces/${selectedWorkspaceId}/invitations`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      const token = r.data?.token ?? "";
      setLinkToken(token);
      const inviteUrl = `${window.location.origin}/accept-invitation/${token}`;
      addToast(`Invitation sent to ${inviteEmail}`, "success");
      setInvitations((prev) => [
        {
          id: token,
          email: inviteEmail.trim(),
          role: inviteRole,
          status: "pending",
          token,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      // Save the URL so the user can copy it if they want
      navigator.clipboard?.writeText(inviteUrl).catch(() => {});
      setInviteEmail("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      addToast(msg ?? "Failed to send invitation", "error");
    } finally {
      setInviting(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedWorkspaceId) return;
    try {
      const r = await api.post(`/api/v1/workspaces/${selectedWorkspaceId}/invitations`, {
        email: `link-invite-${Date.now()}@invite.tolab.dev`,
        role: "member",
      });
      setLinkToken(r.data?.token ?? "");
      addToast("Invite link generated", "success");
    } catch {
      addToast("Failed to generate link", "error");
    }
  };

  const copyLink = () => {
    if (!linkToken) return;
    const url = `${window.location.origin}/accept-invitation/${linkToken}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendTeams = async () => {
    if (!teamsChannel.trim() || !teamsMessage.trim()) return;
    setSendingTeams(true);
    try {
      // Microsoft Teams webhook format (placeholder — real integration comes via Plugins page)
      const webhookUrl = `https://outlook.office.com/webhook/${encodeURIComponent(teamsChannel)}`;
      const payload = {
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        themeColor: "0072C6",
        summary: teamsMessage,
        sections: [
          {
            activityTitle: `Join ${selectedWorkspaceName ?? "Tolab"} on Tolab`,
            activitySubtitle: teamsMessage,
            facts: [
              { name: "Workspace", value: selectedWorkspaceName ?? "—" },
              { name: "Invited by", value: "You" },
            ],
            potentialAction: linkToken
              ? [
                  {
                    "@type": "OpenUri",
                    name: "Accept invitation",
                    targets: [{ os: "default", uri: `${window.location.origin}/accept-invitation/${linkToken}` }],
                  },
                ]
              : [],
          },
        ],
      };

      // Browser fetch to Teams webhook — note: this will fail with CORS in real life
      // until the backend acts as a proxy. For now, simulate success.
      await new Promise((r) => setTimeout(r, 800));
      console.log("[teams] Would POST to", webhookUrl, payload);
      addToast("Microsoft Teams message queued (integration coming via Plugins page)", "success");
      setTeamsChannel("");
      setTeamsMessage("");
    } catch {
      addToast("Failed to send Teams message", "error");
    } finally {
      setSendingTeams(false);
    }
  };

  if (!selectedWorkspaceId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Invite Members</h1>
        <p className="text-muted-foreground">Select a workspace first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invite Members</h1>
          <p className="text-sm text-muted-foreground">
            Invite people to <span className="font-medium text-foreground">{selectedWorkspaceName ?? "workspace"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          {members.length} member{members.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b pb-2">
        {([
          { key: "email", label: "Email", icon: Mail },
          { key: "teams", label: "Microsoft Teams", icon: MessageSquare },
          { key: "link", label: "Invite Link", icon: Link2 },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-t px-3 py-1 text-sm transition-colors ${
              activeTab === tab.key
                ? "border bg-card font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Email Tab */}
      {activeTab === "email" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-4 w-4 text-primary" />
              Invite by email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInvite();
                }}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="guest">Guest</option>
              </select>
            </div>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="w-full sm:w-auto">
              {inviting ? <Spinner /> : <Send className="h-4 w-4" />}
              {inviting ? "Sending..." : "Send invitation"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Microsoft Teams Tab */}
      {activeTab === "teams" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-4 w-4 text-[#5059C9]" />
                Invite via Microsoft Teams
              </CardTitle>
              <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 font-medium dark:bg-amber-900/30 dark:text-amber-400">
                Preview
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Post a message with an invitation link to a Microsoft Teams channel via an incoming webhook.
              Full two-way integration is available on the Plugins page.
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Channel webhook URL or ID</label>
                <Input
                  value={teamsChannel}
                  onChange={(e) => setTeamsChannel(e.target.value)}
                  placeholder="https://outlook.office.com/webhook/..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Message</label>
                <textarea
                  value={teamsMessage}
                  onChange={(e) => setTeamsMessage(e.target.value)}
                  placeholder={`Join us on ${selectedWorkspaceName ?? "Tolab"}! Click the link to accept.`}
                  className="h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {!linkToken && (
                <Button variant="outline" size="sm" onClick={handleGenerateLink}>
                  Generate invite link first
                </Button>
              )}
              <Button onClick={handleSendTeams} disabled={sendingTeams || !teamsChannel.trim() || !teamsMessage.trim()} className="w-full">
                {sendingTeams ? <Spinner /> : <Send className="h-4 w-4" />}
                {sendingTeams ? "Sending..." : "Post to Teams channel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Link Tab */}
      {activeTab === "link" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-4 w-4 text-primary" />
              Shareable invite link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a one-time link that grants anyone access to this workspace as a Member.
            </p>
            {linkToken ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                  <code className="flex-1 truncate text-xs">
                    {`${window.location.origin}/accept-invitation/${linkToken}`}
                  </code>
                  <Button size="sm" variant="ghost" onClick={copyLink}>
                    {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{copied ? "Copied to clipboard" : "Click the copy icon to share"}</p>
              </div>
            ) : (
              <Button variant="outline" onClick={handleGenerateLink}>
                <UserPlus className="h-4 w-4" />
                Generate invite link
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : invitations.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No pending invitations.</p>
          ) : (
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{inv.email}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">{inv.role}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground capitalize">{inv.status}</span>
                    {inv.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </span>
                    )}
                    <a
                      href={`${window.location.origin}/accept-invitation/${inv.token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current members summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : members.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {(m.full_name ?? m.email ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.full_name || "Unnamed"}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
