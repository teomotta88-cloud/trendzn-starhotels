// Estrae gli URL dei post pubblici mostrati nella pagina hashtag di TikTok.
// Uso: node scrape-tiktok-hashtag.mjs <hashtag>
// Stampa su stdout un array JSON di URL.
//
// Note:
// - TikTok carica i post via scroll infinito: lo script scrolla la pagina più volte
//   per far apparire più video prima di leggere il DOM.
// - Il markup di TikTok cambia spesso: se lo script smette di trovare video, controlla
//   GRID_CONTAINER_SELECTOR e VIDEO_LINK_SELECTOR ispezionando la pagina hashtag.
// - Non usa cookie/token: legge solo ciò che è visibile pubblicamente nel DOM.
// - Senza una sessione utente, TikTok può rilevare l'automazione e mostrare un muro di
//   verifica ("Verify to continue" / captcha) o un feed generico al posto dei veri
//   risultati dell'hashtag. In questi casi lo script NON deve restituire link presi da
//   quella pagina, altrimenti si inquina il database con contenuti non correlati.

import { chromium } from "playwright";

// Contenitore della griglia di risultati dell'hashtag (challenge page).
// Se non trovato, non sappiamo distinguere i video dell'hashtag da contenuti
// suggeriti/sidebar: meglio non restituire nulla che restituire link sbagliati.
const GRID_CONTAINER_SELECTOR = '[data-e2e="challenge-item-list"]';
const VIDEO_LINK_SELECTOR = 'a[href*="/video/"]';
const VERIFY_WALL_SELECTOR = '#captcha_container, [data-e2e="captcha-verify-iframe"]';
const VERIFY_WALL_TEXT = /verify to continue|verifica per continuare|conferma che sei un essere umano/i;
const SCROLL_STEPS = 8;
const SCROLL_DELAY_MS = 1500;

async function isVerificationWall(page) {
  const hasWallElement = await page.$(VERIFY_WALL_SELECTOR);
  if (hasWallElement) return true;

  const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
  return VERIFY_WALL_TEXT.test(bodyText);
}

export async function scrapeHashtag(tag) {
  const url = `https://www.tiktok.com/tag/${encodeURIComponent(tag)}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);

    if (await isVerificationWall(page)) {
      console.error(
        "TikTok ha mostrato un muro di verifica/captcha invece dei risultati dell'hashtag: nessun URL restituito.",
      );
      return [];
    }

    for (let i = 0; i < SCROLL_STEPS; i++) {
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(SCROLL_DELAY_MS);
    }

    const gridExists = await page.$(GRID_CONTAINER_SELECTOR);
    if (!gridExists) {
      console.error(
        `Contenitore risultati hashtag (${GRID_CONTAINER_SELECTOR}) non trovato: la pagina potrebbe mostrare un feed generico invece dei risultati di #${tag}. Nessun URL restituito.`,
      );
      return [];
    }

    const hrefs = await page.$$eval(
      `${GRID_CONTAINER_SELECTOR} ${VIDEO_LINK_SELECTOR}`,
      (els) => els.map((el) => el.getAttribute("href")).filter(Boolean),
    );

    return Array.from(
      new Set(hrefs.map((h) => (h.startsWith("http") ? h : `https://www.tiktok.com${h}`))),
    );
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tag = process.argv[2];
  if (!tag) {
    console.error("Uso: node scrape-tiktok-hashtag.mjs <hashtag>");
    process.exit(1);
  }
  const urls = await scrapeHashtag(tag);
  console.log(JSON.stringify(urls, null, 2));
  console.error(`\nTrovati ${urls.length} URL per #${tag}`);
}
