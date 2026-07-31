import { useState } from "react";
// import { Link } from "@tanstack/react-router";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface SearchResult {
  id: string;
  type: "issue" | "page";
  key?: string;
  title?: string;
  summary?: string;
  slug?: string;
  project_id?: string;
  space_id?: string;
  status_id?: string | null;
}

export function SearchPage() {
  const { selectedWorkspaceId } = useWorkspaceStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || !selectedWorkspaceId) return;
    setLoading(true);
    setSearched(true);
    try {
      const r = await api.get("/api/v1/search", {
        params: { q: query, workspace_id: selectedWorkspaceId },
      });
      setResults(r.data as SearchResult[]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedWorkspaceId) {
    return <Card><CardContent className="py-6 text-center text-muted-foreground">Select a workspace first</CardContent></Card>;
  }

  const total = results.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search issues and pages..." className="flex-1" />
        <Button type="submit" disabled={loading || !query.trim()}>{loading ? <Spinner /> : "Search"}</Button>
      </form>

      {loading && <div className="flex justify-center"><Spinner /></div>}

      {searched && !loading && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">{total} results for "{query}"</p>
          {total === 0 ? (
            <Card><CardContent className="py-6 text-center text-muted-foreground">No results found</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {results.map((r) => (
                <Card key={r.id} className="p-3 hover:shadow-sm">
                  {r.type === "issue" ? (
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs text-primary">{r.key}</span>
                        <p className="mt-1 text-sm">{r.summary}</p>
                      </div>
                      <span className="text-xs rounded bg-primary/10 text-primary px-1.5 py-0.5">issue</span>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{r.slug}</p>
                      </div>
                      <span className="text-xs rounded bg-muted px-1.5 py-0.5">page</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
