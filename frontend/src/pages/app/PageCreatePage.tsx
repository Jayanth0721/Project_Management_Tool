import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useToastStore } from "@/stores/toastStore";

interface SpaceDetail {
  id: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
}

interface PageNode {
  id: string;
  parent_page_id: string | null;
  title: string;
  slug: string;
  version: number;
  status: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export function PageCreatePage() {
  const { spaceKey } = useParams({ from: "/app/spaces/$spaceKey/page/new" }) as {
    spaceKey: string;
  };
  const { selectedWorkspaceId } = useWorkspaceStore();
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [pages, setPages] = useState<PageNode[]>([]);
  const [loadingSpace, setLoadingSpace] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [parentPageId, setParentPageId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
  });

  useEffect(() => {
    if (!selectedWorkspaceId || !spaceKey) {
      setLoadingSpace(false);
      return;
    }
    setLoadingSpace(true);
    api
      .get(`/api/v1/workspaces/${selectedWorkspaceId}/spaces/${encodeURIComponent(spaceKey)}`)
      .then((res) => {
        const sp = res.data as SpaceDetail;
        setSpace(sp);
        return api.get(`/api/v1/spaces/${sp.id}/pages`);
      })
      .then((pagesRes) => {
        const list = pagesRes.data as PageNode[];
        setPages(list.sort((a, b) => a.position - b.position));
      })
      .catch(() => addToast("Failed to load space", "error"))
      .finally(() => setLoadingSpace(false));
  }, [selectedWorkspaceId, spaceKey]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto-generate slug: lowercase, replace spaces/special chars with hyphens
    let gen = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (gen === "") gen = slug;
    setSlug(gen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !space || !editor) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/v1/spaces/${space.id}/pages`, {
        title: title.trim(),
        slug: slug.trim(),
        body: editor.getHTML() || undefined,
        parent_page_id: parentPageId || null,
        status: "draft",
      });
      const newPageId = res.data.id;
      navigate({
        to: "/app/spaces/$spaceKey/page/$pageId",
        params: { spaceKey, pageId: newPageId },
      });
    } catch (err: any) {
      addToast(err?.response?.data?.detail || err.message || "Failed to create page", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSpace) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Create Page</h1>
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">Space not found.</p>
            <Button variant="outline" asChild className="mt-3">
              <Link to="/app/spaces">Back to Spaces</Link>
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
        <span className="font-medium text-foreground">New Page</span>
      </div>

      <h1 className="text-2xl font-bold">Create Page</h1>
      <p className="text-sm text-muted-foreground">
        In space <span className="font-mono">{space.key}</span>
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Page Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <Input
                placeholder="Page title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Slug
                <span className="ml-1 font-normal text-muted-foreground">(URL-friendly)</span>
              </label>
              <Input
                placeholder="auto-generated"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
            {pages.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium">Parent Page (optional)</label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={parentPageId ?? ""}
                  onChange={(e) => setParentPageId(e.target.value || null)}
                >
                  <option value="">— Root (no parent) —</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Body
              </label>
              <div className="min-h-[16rem] rounded-md border bg-background p-4">
                <EditorContent editor={editor} className="prose max-w-none [&_.ProseMirror]:min-h-[14rem] [&_.ProseMirror]:outline-none" />
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creating..." : "Create Page"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}