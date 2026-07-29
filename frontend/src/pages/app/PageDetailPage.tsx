import { useEffect, useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { CommentSection } from "@/components/comments/CommentSection";
import { AttachmentSection } from "@/components/attachments/AttachmentSection";
import { useToastStore } from "@/stores/toastStore";

interface SpaceDetail {
  id: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
}

interface PageVersion {
  id: string;
  version: number;
  body: string;
  author_id: string;
  message: string;
  created_at: string;
}

interface PageDetail {
  page: {
    id: string;
    parent_page_id: string | null;
    title: string;
    slug: string;
    version: number;
    status: string;
    space_id: string;
    created_at: string;
    updated_at: string;
    body?: string;
  };
  versions: PageVersion[];
}

export function PageDetailPage() {
  const { spaceKey, pageId } = useParams({
    from: "/app/spaces/$spaceKey/page/$pageId",
  }) as { spaceKey: string; pageId: string };
  const { selectedWorkspaceId } = useWorkspaceStore();

  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [pageData, setPageData] = useState<PageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editable: editMode,
    onUpdate: ({ editor: ed }) => {
      // body is tracked via editor.getHTML() at save time
    },
  });

  // Sync editor content when page data loads
  useEffect(() => {
    if (pageData?.page.body && editor) {
      editor.commands.setContent(pageData.page.body);
    }
  }, [pageData?.page.body, editor]);

  // Sync editor editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editMode);
    }
  }, [editMode, editor]);

  const fetchData = () => {
    if (!selectedWorkspaceId || !spaceKey || !pageId) {
      setLoading(false);
      setError("Missing parameters");
      return;
    }
    setLoading(true);
    setError(null);

    api
      .get(`/api/v1/workspaces/${selectedWorkspaceId}/spaces/${encodeURIComponent(spaceKey)}`)
      .then((res) => {
        const sp = res.data as SpaceDetail;
        setSpace(sp);
        return api.get(`/api/v1/spaces/${sp.id}/pages/${pageId}`);
      })
      .then((res) => {
        const data = res.data as PageDetail;
        setPageData(data);
        setEditTitle(data.page.title);
      })
      .catch((err) =>
        setError(err?.response?.data?.detail || err.message || "Failed to load page"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, [selectedWorkspaceId, spaceKey, pageId]);

  const handleSave = async () => {
    if (!pageData || !space || !editor) return;
    setSaving(true);
    try {
      await api.patch(`/api/v1/spaces/${space.id}/pages/${pageId}`, {
        title: editTitle,
        slug: pageData.page.slug,
        body: editor.getHTML(),
      });
      setEditMode(false);
      fetchData();
    } catch (err: any) {
      addToast(err?.response?.data?.detail || err.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !pageData || !space) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Page</h1>
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">{error || "Page not found"}</p>
            <Button variant="outline" asChild className="mt-3">
              <Link to="/app/spaces/$spaceKey" params={{ spaceKey }}>
                Back to {spaceKey}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <Link to="/app/spaces" className="hover:underline">
          Spaces
        </Link>
        <span className="mx-1">/</span>
        <Link
          to="/app/spaces/$spaceKey"
          params={{ spaceKey }}
          className="hover:underline"
        >
          {space.name}
        </Link>
        <span className="mx-1">/</span>
        <span className="font-medium text-foreground">{pageData.page.title}</span>
      </div>

      {/* Title & Actions */}
      <div className="flex items-start justify-between gap-4">
        {editMode ? (
          <div className="flex-1 space-y-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Page title"
              className="text-xl font-bold"
            />
            <div className="min-h-[24rem] rounded-md border bg-background p-4">
              <EditorContent editor={editor} className="prose max-w-none [&_.ProseMirror]:min-h-[22rem] [&_.ProseMirror]:outline-none" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{pageData.page.title}</h1>
            <Button variant="outline" onClick={() => setEditMode(true)}>
              Edit
            </Button>
          </>
        )}
      </div>

      {/* Body */}
      {!editMode && (
        <Card>
          <CardContent className="pt-6">
            {pageData.page.body ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: pageData.page.body }}
              />
            ) : (
              <p className="text-muted-foreground italic">This page has no content yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Version History */}
      {pageData.versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Version History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pageData.versions
                .sort((a, b) => b.version - a.version)
                .map((v) => (
                  <div key={v.id} className="rounded border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Version {v.version}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleString()}
                      </span>
                    </div>
                    {v.message && (
                      <p className="mt-1 text-xs text-muted-foreground">{v.message}</p>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <CommentSection targetType="pages" targetId={pageData.page.id} />
      <AttachmentSection targetType="pages" targetId={pageData.page.id} />
    </div>
  );
}