import { useEffect, useState } from "react";

export function TikTokTagEmbed() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const existing = document.querySelector('script[data-tiktok-embed]');
    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    script.dataset.tiktokEmbed = "true";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <blockquote
      className="tiktok-embed"
      cite="https://www.tiktok.com/tag/starhotels"
      data-tag-id="starhotels"
      data-embed-from="embed_page"
      data-embed-type="tag"
      style={{ maxWidth: 780, minWidth: 288 }}
    >
      <section>
        <a
          target="_blank"
          rel="noreferrer"
          href="https://www.tiktok.com/tag/starhotels?refer=hashtag_embed"
        >
          #starhotels
        </a>
      </section>
    </blockquote>
  );
}
