import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { useToastStore } from "@/stores/toastStore";

interface Comment {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

interface CommentSectionProps {
  targetType: string;
  targetId: string;
}

export function CommentSection({ targetType, targetId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const fetchComments = () => {
    if (!targetId) return;
    setLoading(true);
    api
      .get(`/api/v1/${targetType}/${targetId}/comments`)
      .then((r) => setComments(r.data as Comment[]))
      .catch(() => addToast("Failed to load comments", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchComments, [targetType, targetId]);

  const handlePost = async () => {
    if (!newBody.trim()) return;
    setPosting(true);
    try {
      await api.post(`/api/v1/${targetType}/${targetId}/comments`, { body: newBody.trim() });
      setNewBody("");
      fetchComments();
    } catch {
      addToast("Failed to post comment", "error");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Comments ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Spinner />
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No comments yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar name={c.author_id} className="h-5 w-5 text-[8px]" />
                  <span className="text-xs text-muted-foreground">
                    {c.author_id.slice(0, 8)} &middot; {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{c.body}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-2 border-t">
          <textarea
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm min-h-[60px] resize-none"
            placeholder="Write a comment..."
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
          />
          <Button size="sm" onClick={handlePost} disabled={posting || !newBody.trim()} className="self-end">
            {posting ? "..." : "Post"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
