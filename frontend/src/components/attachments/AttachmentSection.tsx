import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useToastStore } from "@/stores/toastStore";

interface Attachment {
  id: string;
  filename: string;
  storage_key: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
}

interface AttachmentSectionProps {
  targetType: "issues" | "pages";
  targetId: string;
}

export function AttachmentSection({ targetType, targetId }: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addToast = useToastStore((s) => s.addToast);

  const fetchAttachments = () => {
    if (!targetId) return;
    setLoading(true);
    api
      .get(`/api/v1/${targetType}/${targetId}/attachments`)
      .then((r) => setAttachments(r.data as Attachment[]))
      .catch(() => addToast("Failed to load attachments", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAttachments, [targetType, targetId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/api/v1/${targetType}/${targetId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchAttachments();
    } catch {
      addToast("Upload failed", "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!window.confirm(`Delete ${attachment.filename}?`)) return;
    try {
      await api.delete(`/api/v1/attachments/${attachment.id}`);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch {
      addToast("Delete failed", "error");
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Attachments ({attachments.length})</CardTitle>
        <div>
          <input
            type="file"
            ref={fileRef}
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Spinner />
        ) : attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No attachments.</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div className="flex-1 min-w-0">
                  <a
                    href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/files/${a.storage_key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline truncate block"
                  >
                    {a.filename}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {a.mime_type || "Unknown"} &middot; {formatSize(a.size_bytes)}
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="text-destructive ml-2" onClick={() => handleDelete(a)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
