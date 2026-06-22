import { createFileRoute } from "@tanstack/react-router";

const SECTION = "tiktok-hashtag";
const CATEGORY = "TikTok Hashtag";

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.pathname = u.pathname.replace(/\/$/, "") || "/";
    return u.toString();
  } catch {
    return url.replace(/[).,;]+$/, "").trim();
  }
}

export const Route = createFileRoute("/api/public/hooks/sync-tiktok-hashtag")({
  server: {
    handlers: {
      // Riceve gli URL trovati dallo scraper GitHub Actions (scripts/sync-tiktok-hashtag.mjs)
      // e li inserisce in trend_submissions usando supabaseAdmin, che gira solo lato server
      // e ha quindi accesso alla service role key senza che lo script esterno la conosca.
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { urls?: string[]; hashtag?: string };
          const urls = Array.isArray(body.urls) ? body.urls : [];
          const hashtag = body.hashtag?.trim() || "starhotels";

          if (urls.length === 0) {
            return Response.json({ ok: true, inserted: 0 });
          }

          const rows = urls.map((url) => ({
            url: normalizeUrl(url),
            section: SECTION,
            category: CATEGORY,
            tags: [hashtag],
            status: "approved" as const,
            submitted_by: "tiktok-hashtag-scraper",
          }));

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // onConflict + ignoreDuplicates richiede il vincolo UNIQUE su trend_submissions.url
          // (vedi migration 20260619120000_unique_url_trend_submissions.sql)
          const { data, error } = await supabaseAdmin
            .from("trend_submissions")
            .upsert(rows, { onConflict: "url", ignoreDuplicates: true })
            .select("id");

          if (error) {
            return Response.json({ ok: false, error: error.message }, { status: 500 });
          }

          return Response.json({ ok: true, inserted: data?.length ?? 0 });
        } catch (err) {
          return Response.json({ ok: false, error: String(err).slice(0, 200) }, { status: 500 });
        }
      },
    },
  },
});
