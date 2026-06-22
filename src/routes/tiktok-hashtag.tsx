import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import type { TrendItem } from "@/lib/trends";
import { TrendGrid } from "@/components/TrendGrid";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tiktok-hashtag")({
  head: () => ({
    meta: [{ title: "TikTok Hashtag — TRENDZN" }],
  }),
  component: Page,
});

const SECTION = "tiktok-hashtag";
const PAGE_SIZE = 12;

type DbRow = {
  id: string;
  url: string;
  title: string | null;
  category: string | null;
  industry: string | null;
  tags: string[] | null;
};

function rowToTrendItem(row: DbRow): TrendItem {
  return {
    category: row.category ?? "TikTok Hashtag",
    links: [row.url],
    descrizione: null,
    nome_trend: row.title ?? null,
    industry: row.industry ?? null,
    applicazione: null,
    canali: null,
  };
}

function Page() {
  const [dbRows, setDbRows] = useState<DbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback((page: number) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    return supabase
      .from("trend_submissions")
      .select("id, url, title, category, industry, tags")
      .eq("section", SECTION)
      .eq("status", "approved")
      .order("posted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, to)
      .then(({ data }) => {
        const rows = (data as DbRow[]) ?? [];
        setHasMore(rows.length === PAGE_SIZE);
        return rows;
      });
  }, []);

  useEffect(() => {
    fetchPage(0).then((rows) => {
      setDbRows(rows);
      setLoading(false);
    });
  }, [fetchPage]);

  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    const page = Math.floor(dbRows.length / PAGE_SIZE);
    fetchPage(page).then((rows) => {
      setDbRows((prev) => [...prev, ...rows]);
      setLoadingMore(false);
    });
  }, [dbRows.length, fetchPage]);

  const handleDelete = useCallback((url: string) => {
    setDbRows((prev) => prev.filter((r) => r.url !== url));
  }, []);

  const dbIds: Record<string, string> = Object.fromEntries(dbRows.map((r) => [r.url, r.id]));
  const allItems: TrendItem[] = dbRows.map(rowToTrendItem);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">TikTok Hashtag</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Post raccolti automaticamente dall'hashtag{" "}
          <a
            href="https://www.tiktok.com/tag/starhotels"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary"
          >
            #starhotels
          </a>{" "}
          su TikTok. Pubblicati
          qui automaticamente senza revisione manuale.
        </p>
      </header>
      {loading ? (
        <div className="text-sm text-muted-foreground">Caricamento…</div>
      ) : allItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Nessun post trovato ancora per questo hashtag.
        </div>
      ) : (
        <>
          <TrendGrid items={allItems} dbIds={dbIds} onDelete={handleDelete} />
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? "Caricamento…" : "Carica altri"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
