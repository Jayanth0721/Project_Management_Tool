import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useToastStore } from "@/stores/toastStore";

interface NotificationItem {
  id: string;
  kind: string;
  payload: string | null;
  read_at: string | null;
  created_at: string;
}

export function NotificationsPage() {
  const [data, setData] = useState<{ items: NotificationItem[]; unread_count: number }>({ items: [], unread_count: 0 });
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore((s) => s.addToast);

  const fetchNotifications = () => {
    setLoading(true);
    api.get("/api/v1/notifications")
      .then((r) => setData(r.data))
      .catch(() => addToast("Failed to load notifications", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchNotifications, []);

  const handleMarkRead = async (id: string) => {
    await api.post(`/api/v1/notifications/${id}/read`);
    fetchNotifications();
  };

  const handleMarkAll = async () => {
    await api.post("/api/v1/notifications/read-all");
    fetchNotifications();
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {data.unread_count > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll}>Mark all read ({data.unread_count})</Button>
        )}
      </div>

      {data.items.length === 0 ? (
        <Card><CardContent className="py-6 text-center text-muted-foreground">No notifications yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {data.items.map((n) => (
            <Card key={n.id} className={`p-3 ${n.read_at ? "opacity-60" : "border-primary/30 bg-primary/5"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium capitalize">{n.kind}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.payload || "No details"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.read_at && (
                  <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>Mark read</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}