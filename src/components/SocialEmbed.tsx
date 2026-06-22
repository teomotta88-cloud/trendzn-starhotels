import { useMemo } from "react";

export type Platform = "tiktok" | "instagram" | "youtube" | "linkedin" | "other";

export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("linkedin.com")) return "linkedin";
  return "other";
}

function toEmbedUrl(url: string, platform: Platform): string | null {
  try {
    if (platform === "tiktok") {
      const match = url.match(/\/video\/(\d+)/);
      if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`;
      return null;
    }
    if (platform === "youtube") {
      const idMatch = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
      if (idMatch) return `https://www.youtube.com/embed/${idMatch[1]}`;
      return null;
    }
    if (platform === "instagram") {
      const clean = url.split("?")[0].replace(/\/$/, "");
      return `${clean}/embed`;
    }
    return null;
  } catch {
    return null;
  }
}

export default function SocialEmbed({ url }: { url: string }) {
  const platform = detectPlatform(url);
  const embed = useMemo(() => toEmbedUrl(url, platform), [url, platform]);

  if (!embed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground hover:underline"
      >
        Apri contenuto originale
      </a>
    );
  }

  // Il player embed v2 di TikTok ha un rapporto nativo ~325x739 (non 9:16) e
  // include la caption sotto il video: per mostrarla tutta senza ritagli il
  // box deve essere più alto del riquadro 9:16 standard, con scroll interno
  // controllato dal contenitore esterno (l'iframe stesso non è scrollabile
  // da qui essendo cross-origin).
  const aspect = platform === "youtube" ? "aspect-video" : platform === "tiktok" ? "" : "aspect-[9/16]";

  if (platform === "tiktok") {
    return (
      <div className="relative h-[560px] w-full overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-black">
        <iframe
          src={embed}
          className="h-[640px] w-full"
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`relative ${aspect} w-full overflow-hidden rounded-xl border border-border bg-black`}>
      <iframe
        src={embed}
        className="absolute inset-0 size-full"
        scrolling="no"
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
