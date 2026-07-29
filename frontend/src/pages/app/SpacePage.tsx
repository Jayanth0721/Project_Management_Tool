import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useWorkspaceStore } from "@/stores/workspaceStore";

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

function buildIndent(pages: PageNode[], page: PageNode): number {
  let indent = 0;
  let current = page;
  while (current.parent_page_id) {
    indent++;
    const parent = pages.find((p) => p.id === current.parent_page_id);
    if (!parent) break;
    current = parent;
  }
  return indent;
}

export function SpacePage() {
  const { spaceKey } = useParams({ from: "/app/spaces/$spaceKey" }) as { spaceKey: string };
  const { selectedWorkspaceId } = useWorkspaceStore();

  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [pages, setPages] = useState<PageNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedWorkspaceId || !spaceKey) {
      setLoading(false);
      setError("No workspace selected");
      return;
    }
    setLoading(true);
    setError(null);

    api
      .get(`/api/v1/workspaces/${selectedWorkspaceId}/spaces/${encodeURIComponent(spaceKey)}`)
      .then((res) => {
        const sp = res.data as SpaceDetail;
        setSpace(sp);
        return api.get(`/api/v1/spaces/${sp.id}/pages`);
      })
      .then((pagesRes) => {
        const sorted = (pagesRes.data as PageNode[]).sort((a, b) => a.position - b.position);
        setPages(sorted);
      })
      .catch((err) => setError(err?.response?.data?.detail || err.message || "Failed to load space"))
      .finally(() => setLoading(false));
  }, [selectedWorkspaceId, spaceKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Space</h1>
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">{error || "Space not found"}</p>
            <Button variant="outline" asChild className="mt-3">
              <Link to="/app/spaces">Back to Spaces</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar: page tree */}
      <aside className="w-64 shrink-0">
        <div className="sticky top-6 rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Pages</h3>
          {pages.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pages yet — create the first one.</p>
          ) : (
            <ul className="space-y-0.5">
              {pages.map((p) => {
                const indent = buildIndent(pages, p);
                return (
                  <li key={p.id}>
                    <Link
                      to="/app/spaces/$spaceKey/page/$pageId"
                      params={{ spaceKey, pageId: p.id }}
                      className="block truncate rounded px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                      style={{ paddingLeft: `${8 + indent * 16}px` }}
                    >
                      {indent > 0 && (
                        <span className="mr-1 inline-block w-3 border-l border-b border-muted-foreground/30 align-middle" />
                      )}
                      {p.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 border-t pt-3">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/app/spaces/$spaceKey/page/new" params={{ spaceKey }}>
                + New Page
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground">
          <Link to="/app/spaces" className="hover:underline">
            Spaces
          </Link>
          <span className="mx-1">/</span>
          <span className="font-medium text-foreground">{space.name}</span>
        </div>

        {/* Space info */}
        <Card>
          <CardHeader>
            <CardTitle>{space.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {space.description ? (
              <p className="text-muted-foreground">{space.description}</p>
            ) : (
              <p className="text-muted-foreground italic">No description set.</p>
            )}
            <p className="mt-2 text-xs font-mono text-muted-foreground">Key: {space.key}</p>
          </CardContent>
        </Card>

        <Button asChild>
          <Link to="/app/spaces/$spaceKey/page/new" params={{ spaceKey }}>
            Create Page
          </Link>
        </Button>
      </div>
    </div>
  );
}