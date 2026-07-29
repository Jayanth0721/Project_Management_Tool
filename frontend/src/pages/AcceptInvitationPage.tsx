import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface InvitationInfo {
  workspace_name: string;
  role: string;
  email: string;
}

export function AcceptInvitationPage() {
  const { token } = useParams({ from: "/accept-invitation/$token" }) as { token: string };
  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/api/v1/invitations/${token}`).then((r) => {
      setInfo(r.data);
      setLoading(false);
    }).catch(() => {
      setError("Invitation not found or expired.");
      setLoading(false);
    });
  }, [token]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await api.post(`/api/v1/invitations/${token}/accept`);
      navigate({ to: "/onboarding" });
    } catch {
      setError("Could not accept invitation. It may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          {info && (
            <>
              <p className="mb-2 text-sm">
                You've been invited to <strong>{info.workspace_name}</strong> as {info.role}.
              </p>
              {!isAuthenticated ? (
                <p className="mb-4 text-sm text-muted-foreground">
                  Create an account or sign in to accept.
                  <br />
                  <a href="/login" className="text-primary underline">Sign in</a> |{" "}
                  <a href="/register" className="text-primary underline">Register</a>
                </p>
              ) : (
                <Button onClick={handleAccept} className="w-full" disabled={loading}>
                  {loading ? <Spinner /> : "Accept invitation"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}