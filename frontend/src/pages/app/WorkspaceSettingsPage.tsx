import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import api from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface Member {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  joined_at: string | null;
}

export function WorkspaceSettingsPage() {
  const { selectedWorkspaceId, selectedWorkspaceName } = useWorkspaceStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState("");

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    api.get(`/api/v1/workspaces/${selectedWorkspaceId}/members`)
      .then((r) => setMembers(r.data))
      .finally(() => setLoading(false));
  }, [selectedWorkspaceId]);

  const handleInvite = async () => {
    if (!selectedWorkspaceId) return;
    setInviting(true);
    setInviteResult("");
    try {
      const r = await api.post(`/api/v1/workspaces/${selectedWorkspaceId}/invitations`, {
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteResult(`Invitation sent! Token: ${r.data.token}`);
      setInviteEmail("");
    } catch (err: unknown) {
      setInviteResult((err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Failed to invite");
    } finally {
      setInviting(false);
    }
  };

  if (!selectedWorkspaceId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Workspace Settings</h1>
        <p className="text-muted-foreground">Select a workspace from the onboarding page first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{selectedWorkspaceName ?? "Workspace"}</h1>
        <p className="text-muted-foreground">Settings</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Members</CardTitle>
          <Button size="sm" onClick={() => setInviteOpen(true)}>Invite</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.user_id} className="border-b last:border-0">
                    <td className="py-2">{m.full_name}</td>
                    <td className="py-2">{m.email}</td>
                    <td className="py-2 capitalize">{m.role}</td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground">
                      No members yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal open={inviteOpen} onOpenChange={setInviteOpen} title="Invite member">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Email</label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="bg-[#f6f8fa] dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-[#f6f8fa] dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="guest">Guest</option>
            </select>
          </div>
          {inviteResult && (
            <p className="text-xs break-all text-gray-500 dark:text-gray-400">{inviteResult}</p>
          )}
          <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="w-full bg-red-600 text-white hover:bg-red-700">
            {inviting ? <Spinner /> : "Send invitation"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}