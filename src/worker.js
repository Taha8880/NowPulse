const APP = "NowPulse";
const VERSION = "3.0.0";
const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const CACHE_TTL = 300;
const SEARCH_TTL = 300;
const ARTICLE_TTL = 86400 * 30;

const CATEGORIES = {
  latest: { ar: "آخر الأخبار", en: "Latest" },
  egypt: { ar: "مصر", en: "Egypt" },
  world: { ar: "العالم", en: "World" },
  politics: { ar: "سياسة", en: "Politics" },
  sports: { ar: "رياضة", en: "Sports" },
  economy: { ar: "اقتصاد", en: "Economy" },
  tech: { ar: "تكنولوجيا", en: "Technology" },
  arts: { ar: "فن", en: "Arts" },
  health: { ar: "صحة", en: "Health" },
  travel: { ar: "سفر", en: "Travel" },
  trending: { ar: "الترند", en: "Trending" }
};

const SOURCES = [
  ["BBC", "https://feeds.bbci.co.uk/news/rss.xml"],
  ["Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml"],
  ["France 24", "https://www.france24.com/en/rss"],
  ["Sky News", "https://feeds.skynews.com/feeds/rss/home.xml"],
  ["Google News", "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"]
];

const CATEGORY_TERMS = {
  sports:
    /\b(sport|football|soccer|tennis|basketball|olympic|premier league|champions league|fifa|nba|nfl|cricket|match|goal|club|player|athlete|رياضة|كرة|أهلي|زمالك|مباراة|لاعب|بطولة)\b/i,

  economy:
    /\b(economy|economic|market|markets|business|finance|financial|stock|stocks|oil|gold|currency|dollar|inflation|bank|trade|اقتصاد|اقتصادية|أسواق|ذهب|دولار|بنك|بورصة|تجارة)\b/i,

  tech:
    /\b(technology|tech|ai|artificial intelligence|software|apple|google|microsoft|meta|openai|chip|cyber|internet|iphone|android|تكنولوجيا|تقنية|ذكاء اصطناعي|برمجيات|جوجل|آبل|مايكروسوفت)\b/i,

  arts:
    /\b(art|arts|culture|film|movie|cinema|music|actor|actress|celebrity|singer|festival|فن|ثقافة|سينما|فيلم|موسيقى|ممثل|مغني|مهرجان)\b/i,

  health:
    /\b(health|medical|medicine|hospital|disease|doctor|vaccine|healthcare|صحة|طب|مستشفى|مرض|طبيب|لقاح)\b/i,

  travel:
    /\b(travel|tourism|flight|airport|hotel|tourist|airline|سفر|سياحة|طيران|مطار|فندق|سائح)\b/i,

  politics:
    /\b(politic|politics|government|president|minister|parliament|election|elections|senate|congress|prime minister|war|conflict|policy|سياسة|حكومة|رئيس|وزير|برلمان|انتخابات|حرب|صراع)\b/i
};

const CITY = {
  cairo: [30.0444, 31.2357, "القاهرة"],
  giza: [30.0131, 31.2089, "الجيزة"],
  alexandria: [31.2001, 29.9187, "الإسكندرية"],
  hurghada: [27.2579, 33.8116, "الغردقة"],
  luxor: [25.6872, 32.6396, "الأقصر"],
  aswan: [24.0889, 32.8998, "أسوان"],
  portsaid: [31.2653, 32.3019, "بورسعيد"],
  suez: [29.9668, 32.5498, "السويس"]
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extra
    }
  });
}

function html(body, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60",
      ...extra
    }
  });
}

function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeEntities(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCharCode(parseInt(n, 16))
    );
}

function cleanText(value = "") {
  let text = decodeEntities(value);

  text = text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  text = text
    .replace(/^\s*[#]+\s*/g, "")
    .replace(/\\#+\s*/g, "")
    .replace(/\\&/g, "&")
    .replace(/\bnbsp;\b/gi, " ");

  return text.replace(/\s+/g, " ").trim();
}

function hash(value = "") {
  let h = 2166136261;

  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return (h >>> 0).toString(36);
}

function timeout(ms = 7000) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, ms);

  return {
    signal: controller.signal,
    done: () => clearTimeout(timer)
  };
}

async function fetchText(url, ms = 7000, headers = {}) {
  const t = timeout(ms);

  try {
    const response = await fetch(url, {
      signal: t.signal,
      headers: {
        "user-agent":
          "NowPulse/3.0 (+https://nowpulse.tavengers16.workers.dev)",
        ...headers
      }
    });

    const text = await response.text();

    return response.ok ? text : "";
  } catch {
    return "";
  } finally {
    t.done();
  }
}

function xmlTag(xml, tag) {
  const re = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );

  return xml.match(re)?.[1] || "";
}

function xmlAttr(xml, tag, attr) {
  const re = new RegExp(
    `<${tag}[^>]*\\b${attr}=["']([^"']+)["']`,
    "i"
  );

  return xml.match(re)?.[1] || "";
}

function splitItems(xml) {
  return (
    xml.match(/<item\b[\s\S]*?<\/item>/gi) ||
    xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ||
    []
  );
}

function parseRSS(xml, source) {
  return splitItems(xml)
    .slice(0, 30)
    .map((item) => {
      const title = cleanText(xmlTag(item, "title"));

      const description = cleanText(
        xmlTag(item, "description") ||
          xmlTag(item, "summary") ||
          xmlTag(item, "content")
      );

      const link =
        decodeEntities(xmlTag(item, "link")) ||
        xmlAttr(item, "link", "href");

      const pub =
        xmlTag(item, "pubDate") ||
        xmlTag(item, "published") ||
        xmlTag(item, "updated");

      const image =
        xmlAttr(item, "media:content", "url") ||
        xmlAttr(item, "media:thumbnail", "url") ||
        xmlAttr(item, "enclosure", "url") ||
        xmlAttr(item, "content", "url");

      const date = Date.parse(pub);
      const now = Date.now();

      if (
        !title ||
        !link ||
        !/^https?:\/\//i.test(link) ||
        !Number.isFinite(date) ||
        date > now + 86400000 ||
        date < now - 7 * 86400000
      ) {
        return null;
      }

      return {
        id: hash(title + "|" + link),
        title,
        description,
        url: link,
        image:
          image && /^https?:\/\//i.test(image)
            ? image
            : "",
        source,
        publishedAt: new Date(date).toISOString()
      };
    })
    .filter(Boolean);
}

function categoryFor(article) {
  const text = `${article.title} ${article.description}`;

  if (
    /\b(Egypt|Cairo|Alexandria|Hurghada|Luxor|Aswan|Egyptian|مصر|القاهرة|الإسكندرية|الغردقة|الأقصر|أسوان)\b/i.test(
      text
    )
  ) {
    return "egypt";
  }

  for (const [category, regex] of Object.entries(CATEGORY_TERMS)) {
    if (regex.test(text)) {
      return category;
    }
  }

  return "world";
}

function quality(article) {
  const bad =
    /casino|betting|coupon|seo|press release|sponsored|giveaway|adult/i;

  let score = 50;

  if (
    ["Reuters", "BBC", "Al Jazeera", "France 24", "Sky News"].includes(
      article.source
    )
  ) {
    score += 35;
  }

  if (bad.test(`${article.title} ${article.description}`)) {
    score -= 50;
  }

  if (article.description.length > 80) {
    score += 5;
  }

  return score;
}

function dedupe(items) {
  const map = new Map();

  for (const article of items) {
    const key = cleanText(article.title)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .split(" ")
      .slice(0, 10)
      .join(" ");

    const old = map.get(key);

    if (
      !old ||
      quality(article) > quality(old) ||
      article.publishedAt > old.publishedAt
    ) {
      map.set(key, article);
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() -
      new Date(a.publishedAt).getTime()
  );
}

async function collectNews(lang = "ar") {
  const sources = [...SOURCES];

  if (lang === "ar") {
    sources.push([
      "Google News AR",
      "https://news.google.com/rss?hl=ar&gl=EG&ceid=EG:ar"
    ]);
  }

  const results = await Promise.allSettled(
    sources.map(async ([source, url]) => {
      const xml = await fetchText(url);
      return parseRSS(xml, source);
    })
  );

  let all = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    }
  }

  all = dedupe(all)
    .filter((article) => quality(article) > 30)
    .map((article) => ({
      ...article,
      category: categoryFor(article)
    }));

  all.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() -
      new Date(a.publishedAt).getTime()
  );

  return all.slice(0, 120);
}

async function getCached(env, key) {
  if (!env.NOWPULSE_KV) {
    return null;
  }

  try {
    return await env.NOWPULSE_KV.get(key, "json");
  } catch {
    return null;
  }
}

async function putCached(env, key, value, ttl = CACHE_TTL) {
  if (!env.NOWPULSE_KV) {
    return;
  }

  try {
    await env.NOWPULSE_KV.put(
      key,
      JSON.stringify(value),
      {
        expirationTtl: ttl
      }
    );
  } catch {
    /*
      KV errors must never break the site.
      In particular, daily KV limits must not
      cause HTTP 1101 or page failures.
    */
  }
}

async function getNews(env, lang = "ar", force = false) {
  const key = `feed:${lang}`;

  if (!force) {
    const cached = await getCached(env, key);

    if (cached?.items?.length) {
      return cached.items;
    }
  }

  const items = await collectNews(lang);

  if (items.length) {
    await putCached(
      env,
      key,
      {
        items,
        updatedAt: new Date().toISOString()
      },
      CACHE_TTL * 2
    );
  }

  return items;
}

/* =========================
   IMAGE ENGINE
========================= */

async function resolveImage(article) {
  if (article.image) {
    return article.image;
  }

  const page = await fetchText(
    article.url,
    5000,
    {
      accept: "text/html"
    }
  );

  if (page) {
    const metaPatterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i
    ];

    for (const pattern of metaPatterns) {
      const match = page.match(pattern);

      if (
        match?.[1] &&
        /^https?:\/\//i.test(match[1])
      ) {
        return decodeEntities(match[1]);
      }
    }

    const jsonLdRegex =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

    const scripts = [...page.matchAll(jsonLdRegex)];

    for (const match of scripts) {
      try {
        const data = JSON.parse(match[1]);
        const objects = Array.isArray(data)
          ? data
          : [data];

        for (const object of objects) {
          const image = object?.image;

          const url =
            typeof image === "string"
              ? image
              : image?.url;

          if (
            url &&
            /^https?:\/\//i.test(url)
          ) {
            return url;
          }
        }
      } catch {
        /* ignore malformed JSON-LD */
      }
    }
  }

  /*
    Fallback image search.
    This is deliberately independent from the article URL.
  */

  const query = encodeURIComponent(
    article.title.replace(/[|]/g, " ")
  );

  const wikipedia = await fetchText(
    `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${query}&gsrlimit=1&prop=pageimages&pithumbsize=900&format=json`,
    4500
  );

  try {
    const data = JSON.parse(wikipedia);

    const page = Object.values(
      data.query?.pages || {}
    )[0];

    if (page?.thumbnail?.source) {
      return page.thumbnail.source;
    }
  } catch {
    /* fallback failed */
  }

  return "";
}

async function imageFor(env, article) {
  const key = `img:${article.id}`;

  const cached = await getCached(env, key);

  if (cached?.url) {
    return cached.url;
  }

  const image = await resolveImage(article);

  if (image) {
    await putCached(
      env,
      key,
      {
        url: image
      },
      ARTICLE_TTL
    );
  }

  return image;
}

/* =========================
   AI ARTICLE ENGINE
========================= */

async function aiArticle(env, article, related = []) {
  if (!env.AI) {
    return null;
  }

  const facts = [
    article,
    ...related
      .filter((item) => item.id !== article.id)
      .slice(0, 5)
  ]
    .map(
      (item, index) =>
        `SOURCE ${index + 1}
Title: ${cleanText(item.title)}
Source: ${item.source}
Time: ${item.publishedAt}
Description: ${cleanText(item.description)}`
    )
    .join("\n\n");

  const language = /^[\u0600-\u06ff]/.test(
    article.title
  )
    ? "Arabic"
    : "English";

  const prompt = `
Write an original news article in ${language}.

Rules:
- Use only facts supported by the supplied sources.
- Never invent names.
- Never invent numbers.
- Never invent quotes.
- Never invent causes or motives.
- Never copy source wording.
- If sources conflict, mention the conflict carefully.
- Do not pretend one-source information is confirmed by multiple sources.
- The result must be a real readable article.
- The body must contain multiple paragraphs.
- Do not return markdown.
- Return JSON only.

Format:
{
  "headline": "...",
  "summary": "...",
  "body": "..."
}

Sources:

${facts}
`;

  try {
    const result = await env.AI.run(
      AI_MODEL,
      {
        messages: [
          {
            role: "system",
            content:
              "You are a factual newsroom editor. Accuracy is more important than completeness. Never invent facts."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1800
      }
    );

    const raw =
      typeof result === "string"
        ? result
        : result?.response ||
          result?.result ||
          "";

    const match = String(raw).match(
      /\{[\s\S]*\}/
    );

    if (!match) {
      return null;
    }

    const data = JSON.parse(match[0]);

    if (!data.body) {
      return null;
    }

    return {
      headline: cleanText(
        data.headline || article.title
      ),
      summary: cleanText(
        data.summary || article.description
      ),
      body: cleanText(data.body)
    };
  } catch {
    return null;
  }
}

/* =========================
   ARTICLE DATA
========================= */

async function articleData(
  env,
  id,
  lang = "ar"
) {
  const cached = await getCached(
    env,
    `article:${id}`
  );

  if (cached) {
    return cached;
  }

  const items = await getNews(
    env,
    lang
  );

  const article = items.find(
    (item) => item.id === id
  );

  if (!article) {
    return null;
  }

  /*
    The article itself may resolve its image,
    but this does not block the homepage.
  */

  const image = await imageFor(
    env,
    article
  );

  const related = items.filter(
    (item) =>
      item.category === article.category
  );

  const ai = await aiArticle(
    env,
    article,
    related
  );

  const result = {
    ...article,
    image,
    article:
      ai || {
        headline: article.title,
        summary: article.description,
        body:
          article.description ||
          article.title
      },
    updatedAt:
      new Date().toISOString()
  };

  await putCached(
    env,
    `article:${id}`,
    result,
    ARTICLE_TTL
  );

  return result;
}

/* =========================
   SEARCH ENGINE
========================= */

async function searchNews(
  env,
  query,
  lang = "ar"
) {
  query = cleanText(query).slice(
    0,
    120
  );

  if (!query) {
    return [];
  }

  const key =
    `search:${lang}:${hash(
      query.toLowerCase()
    )}`;

  const cached = await getCached(
    env,
    key
  );

  if (cached?.items) {
    return cached.items;
  }

  const encoded =
    encodeURIComponent(query);

  const feeds = [
    `https://news.google.com/rss/search?q=${encoded}&hl=${
      lang === "ar" ? "ar" : "en"
    }&gl=${lang === "ar" ? "EG" : "US"}&ceid=${
      lang === "ar" ? "EG:ar" : "US:en"
    }`
  ];

  const results =
    await Promise.allSettled(
      feeds.map((url) =>
        fetchText(url, 6500)
      )
    );

  let items = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      items.push(
        ...parseRSS(
          result.value,
          "Search"
        )
      );
    }
  }

  items = dedupe(items)
    .slice(0, 30)
    .map((article) => ({
      ...article,
      category:
        categoryFor(article),
      image: ""
    }));

  await putCached(
    env,
    key,
    {
      items
    },
    SEARCH_TTL
  );

  return items;
}

/* =========================
   WEATHER
========================= */

async function weather(
  city = "cairo"
) {
  const location =
    CITY[city] || CITY.cairo;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${location[0]}&longitude=${location[1]}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&timezone=Africa%2FCairo`;

  try {
    const data = JSON.parse(
      await fetchText(url, 4500)
    );

    return {
      city: location[2],
      temperature:
        data.current?.temperature_2m,
      feels:
        data.current?.apparent_temperature,
      humidity:
        data.current?.relative_humidity_2m,
      code:
        data.current?.weather_code
    };
  } catch {
    return {
      city: location[2],
      error: true
    };
  }
}

/* =========================
   MARKETS
========================= */

async function markets() {
  try {
    const data = JSON.parse(
      await fetchText(
        "https://api.frankfurter.app/latest?from=USD&to=EGP,EUR,GBP,SAR,AED",
        4500
      )
    );

    const rates =
      data.rates || {};

    return {
      usd: rates.EGP,
      eur:
        rates.EGP && rates.EUR
          ? rates.EGP / rates.EUR
          : null,
      gbp:
        rates.EGP && rates.GBP
          ? rates.EGP / rates.GBP
          : null,
      sar:
        rates.EGP && rates.SAR
          ? rates.EGP / rates.SAR
          : null,
      aed:
        rates.EGP && rates.AED
          ? rates.EGP / rates.AED
          : null
    };
  } catch {
    return {};
  }
}

/* =========================
   ICONS
========================= */

function icon(category) {
  return (
    {
      latest: "◉",
      egypt: "⌂",
      world: "◎",
      politics: "▣",
      sports: "⚽",
      economy: "▤",
      tech: "⌘",
      arts: "✦",
      health: "✚",
      travel: "✈",
      trending: "⌁"
    }[category] || "•"
  );
}

/* =========================
   UI
========================= */

function layout(lang) {
  const rtl = lang === "ar";

  return `<!doctype html>
<html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>

<meta
  name="theme-color"
  content="#0b1220"
>

<title>
NowPulse — ${
    rtl
      ? "آخر الأخبار"
      : "Latest News"
  }
</title>

<meta
  name="description"
  content="${
    rtl
      ? "NowPulse منصة أخبار ومعلومات حديثة."
      : "NowPulse news and information platform."
  }"
>

<style>

:root{
  --bg:#f5f7fb;
  --card:#ffffff;
  --text:#111827;
  --muted:#64748b;
  --line:#e5e7eb;
  --brand:#2563eb;
  --soft:#eef4ff;
}

*{
  box-sizing:border-box;
}

html{
  scroll-behavior:smooth;
}

body{
  margin:0;
  background:var(--bg);
  color:var(--text);
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Tahoma,
    Arial,
    sans-serif;
}

body.dark{
  --bg:#07101d;
  --card:#101a29;
  --text:#f8fafc;
  --muted:#94a3b8;
  --line:#243244;
  --soft:#162640;
}

a{
  color:inherit;
  text-decoration:none;
}

button,
input{
  font:inherit;
}

.wrap{
  max-width:1380px;
  margin:auto;
  padding:0 22px;
}

.top{
  position:sticky;
  top:0;
  z-index:20;
  background:rgba(255,255,255,.94);
  backdrop-filter:blur(14px);
  border-bottom:1px solid var(--line);
}

.dark .top{
  background:rgba(7,16,29,.94);
}

.head{
  min-height:70px;
  display:flex;
  align-items:center;
  gap:18px;
}

.logo{
  font-size:25px;
  font-weight:900;
  letter-spacing:-.7px;
  cursor:pointer;
  white-space:nowrap;
}

.pulse{
  color:var(--brand);
}

.search{
  flex:1;
  display:flex;
  max-width:650px;
  margin:auto;
}

.search input{
  width:100%;
  border:1px solid var(--line);
  background:var(--card);
  color:var(--text);
  padding:12px 15px;
  border-radius:13px;
  font-size:15px;
  outline:0;
}

.search button,
.tool{
  border:0;
  background:var(--soft);
  color:var(--brand);
  padding:10px 13px;
  border-radius:11px;
  font-weight:800;
  cursor:pointer;
}

.nav{
  display:flex;
  gap:8px;
  overflow:auto;
  padding:10px 0;
  scrollbar-width:none;
}

.nav::-webkit-scrollbar{
  display:none;
}

.nav a{
  white-space:nowrap;
  padding:9px 12px;
  border-radius:12px;
  background:var(--card);
  border:1px solid var(--line);
  font-size:13px;
}

.nav a:hover{
  background:var(--soft);
  color:var(--brand);
}

main{
  padding:24px 0 50px;
}

.sectionTitle{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin:12px 0 16px;
}

.sectionTitle h1{
  font-size:30px;
  margin:0;
}

.hero{
  display:grid;
  grid-template-columns:1.7fr 1fr;
  gap:18px;
}

.grid{
  display:grid;
  grid-template-columns:
    repeat(3,minmax(0,1fr));
  gap:18px;
}

.card{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:18px;
  overflow:hidden;
  box-shadow:
    0 5px 20px
    rgba(15,23,42,.04);
}

.card .media{
  aspect-ratio:16/9;
  background:
    linear-gradient(
      135deg,
      #e9eef7,
      #f8fafc
    );
  position:relative;
  overflow:hidden;
}

.dark .card .media{
  background:
    linear-gradient(
      135deg,
      #172235,
      #0f172a
    );
}

.card img{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}

.ph{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  color:#94a3b8;
  font-weight:800;
}

.body{
  padding:16px;
}

.meta{
  font-size:12px;
  color:var(--muted);
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  margin-bottom:8px;
}

.title{
  font-size:18px;
  line-height:1.5;
  font-weight:850;
  margin:0 0 9px;
}

.summary{
  color:var(--muted);
  line-height:1.65;
  font-size:14px;
}

.heroCard .title{
  font-size:25px;
}

.tools{
  display:flex;
  gap:8px;
  align-items:center;
}

.dash{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:18px;
  margin:25px 0;
}

.panel{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:18px;
  padding:17px;
}

.panel h2{
  font-size:18px;
  margin:0 0 14px;
}

.markets{
  display:grid;
  grid-template-columns:
    repeat(5,1fr);
  gap:8px;
}

.market{
  background:
    rgba(148,163,184,.08);
  border-radius:12px;
  padding:12px;
}

.market b{
  display:block;
  margin-top:4px;
}

.trends{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
}

.trend{
  padding:9px 12px;
  background:
    rgba(148,163,184,.08);
  border-radius:999px;
  font-size:13px;
}

.article{
  max-width:900px;
  margin:auto;
  background:var(--card);
  border:1px solid var(--line);
  border-radius:20px;
  overflow:hidden;
}

.article .cover{
  aspect-ratio:16/7;
  background:
    linear-gradient(
      135deg,
      #e9eef7,
      #f8fafc
    );
  position:relative;
}

.article .cover img{
  width:100%;
  height:100%;
  object-fit:cover;
}

.articleContent{
  padding:28px;
}

.articleContent h1{
  font-size:38px;
  line-height:1.25;
  margin:0 0 14px;
}

.articleContent .lead{
  font-size:18px;
  color:var(--muted);
  line-height:1.8;
}

.articleContent p{
  font-size:17px;
  line-height:2;
  margin:18px 0;
}

.footer{
  border-top:1px solid var(--line);
  padding:25px 0;
  color:var(--muted);
  text-align:center;
}

.empty{
  padding:40px;
  text-align:center;
  color:var(--muted);
}

.catSports{
  border-top:4px solid #16a34a;
}

.catEconomy{
  border-top:4px solid #f59e0b;
}

.catPolitics{
  border-top:4px solid #7c3aed;
}

.catTech{
  border-top:4px solid #0891b2;
}

.catArts{
  border-top:4px solid #db2777;
}

.catHealth{
  border-top:4px solid #dc2626;
}

.catTravel{
  border-top:4px solid #0ea5e9;
}

.catWorld{
  border-top:4px solid #2563eb;
}

.catEgypt{
  border-top:4px solid #059669;
}

@media(max-width:900px){

  .hero{
    grid-template-columns:1fr 1fr;
  }

  .grid{
    grid-template-columns:
      repeat(2,1fr);
  }

  .dash{
    grid-template-columns:1fr;
  }

  .markets{
    grid-template-columns:
      repeat(3,1fr);
  }
}

@media(max-width:620px){

  .wrap{
    padding:0 12px;
  }

  .head{
    height:62px;
    gap:8px;
  }

  .logo{
    font-size:21px;
  }

  .search{
    order:3;
    position:absolute;
    top:62px;
    left:12px;
    right:12px;
    max-width:none;
  }

  .top{
    padding-bottom:53px;
  }

  .nav{
    margin-top:5px;
  }

  .nav a{
    font-size:12px;
    padding:8px 10px;
  }

  .hero{
    display:block;
  }

  .hero .card{
    margin-bottom:12px;
  }

  .grid{
    display:block;
  }

  .grid .card{
    display:grid;
    grid-template-columns:
      118px 1fr;
    margin-bottom:10px;
    border-radius:14px;
  }

  .grid .media{
    aspect-ratio:1/1;
    grid-row:1;
  }

  .grid .body{
    padding:11px;
  }

  .grid .title{
    font-size:14px;
    line-height:1.45;
  }

  .grid .summary{
    display:none;
  }

  .meta{
    font-size:10px;
  }

  .heroCard .title{
    font-size:19px;
  }

  .sectionTitle h1{
    font-size:23px;
  }

  .dash{
    margin-top:15px;
  }

  .markets{
    grid-template-columns:
      repeat(2,1fr);
  }

  .article{
    border-radius:14px;
  }

  .articleContent{
    padding:18px;
  }

  .articleContent h1{
    font-size:27px;
  }

  .articleContent p{
    font-size:16px;
    line-height:1.9;
  }

  .tools .tool{
    padding:8px 9px;
  }
}

</style>

</head>

<body>

<header class="top">

<div class="wrap">

<div class="head">

<div
  class="logo"
  onclick="location.href='/?lang=${lang}'"
>
Now<span class="pulse">Pulse</span>
</div>

<form
  class="search"
  action="/search"
>

<input
  name="q"
  placeholder="${
    rtl
      ? "ابحث عن أي شخص أو موضوع…"
      : "Search any person or topic…"
  }"
>

<input
  type="hidden"
  name="lang"
  value="${lang}"
>

<button type="submit">
⌕
</button>

</form>

<div class="tools">

<button
  class="tool"
  onclick="location.href='/?lang=${
    lang === "ar" ? "en" : "ar"
  }'"
>
${lang === "ar" ? "EN" : "ع"}
</button>

<button
  class="tool"
  onclick="document.body.classList.toggle('dark')"
>
☀️/🌙
</button>

</div>

</div>

<nav class="nav">

${Object.entries(CATEGORIES)
  .map(
    ([key, value]) =>
      `<a href="/?category=${key}&lang=${lang}">
        ${icon(key)} ${esc(value[lang])}
      </a>`
  )
  .join("")}

</nav>

</div>

</header>

<main
  class="wrap"
  id="app"
></main>

<footer class="footer">
Created by Taha · NowPulse ${VERSION}
</footer>

</body>

</html>`;
}

function timeAgo(
  iso,
  lang
) {
  const diff =
    Date.now() -
    new Date(iso).getTime();

  const minutes = Math.max(
    1,
    Math.floor(diff / 60000)
  );

  if (lang === "ar") {
    return minutes < 60
      ? `منذ ${minutes} د`
      : `منذ ${Math.floor(
          minutes / 60
        )} س`;
  }

  return minutes < 60
    ? `${minutes}m ago`
    : `${Math.floor(
        minutes / 60
      )}h ago`;
}

function card(
  article,
  lang,
  hero = false
) {
  const category =
    article.category ||
    "world";

  const className =
    category.charAt(0).toUpperCase() +
    category.slice(1);

  return `
<article
  data-id="${esc(article.id)}"
  class="card ${
    hero ? "heroCard " : ""
  }cat${className}"
>

<a
  href="/article/${article.id}?lang=${lang}"
>

<div class="media">

<div class="ph">
NowPulse
</div>

${
  article.image
    ? `
<img
  src="${esc(article.image)}"
  loading="${
    hero ? "eager" : "lazy"
  }"
  decoding="async"
  ${
    hero
      ? 'fetchpriority="high"'
      : ""
  }
  onerror="this.remove()"
>
`
    : ""
}

</div>

<div class="body">

<div class="meta">
<span>
${esc(article.source)}
</span>

<span>
${timeAgo(
  article.publishedAt,
  lang
)}
</span>
</div>

<h2 class="title">
${esc(article.title)}
</h2>

<div class="summary">
${esc(
  article.description || ""
)}
</div>

</div>

</a>

</article>
`;
}

function trends(items) {
  const words = new Map();

  for (const article of items) {
    const text =
      cleanText(
        article.title
      ).toLowerCase();

    for (const word of text.split(
      /\s+/
    )) {
      if (
        word.length < 4 ||
        /^(this|that|with|from|about|the|news|after|before|على|من|في|عن|إلى|هذا|هذه|الخبر|اليوم)$/.test(
          word
        )
      ) {
        continue;
      }

      words.set(
        word,
        (words.get(word) || 0) + 1
      );
    }
  }

  return [...words.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
}

/* =========================
   HOME
========================= */

async function home(
  env,
  url,
  lang
) {
  const category =
    url.searchParams.get(
      "category"
    ) || "latest";

  /*
    IMPORTANT:
    Homepage does NOT wait for image resolution.
  */

  const items =
    await getNews(
      env,
      lang
    );

  let list;

  if (
    category === "latest" ||
    category === "trending"
  ) {
    list = items;
  } else {
    list = items.filter(
      (item) =>
        item.category ===
        category
    );
  }

  list = list.slice(0, 30);

  const weatherPromise =
    weather(
      url.searchParams.get(
        "city"
      ) || "cairo"
    );

  const marketsPromise =
    markets();

  const [
    weatherData,
    marketData
  ] = await Promise.all([
    weatherPromise,
    marketsPromise
  ]);

  const trendData =
    trends(items);

  const title =
    CATEGORIES[
      category
    ]?.[lang] ||
    CATEGORIES.latest[lang];

  const featured =
    list[0];

  const rest =
    list.slice(1);

  const app = `

<div class="sectionTitle">

<h1>
${esc(title)}
</h1>

<div class="tools">

<button
  class="tool"
  onclick="location.reload()"
>
↻
</button>

</div>

</div>

${
  featured
    ? `
<section class="hero">

${card(
  featured,
  lang,
  true
)}

<div class="panel">

<h2>
${
  lang === "ar"
    ? "الترند الآن"
    : "Trending now"
}
</h2>

<div class="trends">

${trendData
  .map(
    ([word, count]) =>
      `<span class="trend">
        ${esc(word)} · ${count}
      </span>`
  )
  .join("")}

</div>

</div>

</section>
`
    : `
<div class="empty">
${
  lang === "ar"
    ? "لا توجد أخبار حديثة متاحة حاليًا"
    : "No recent news available"
}
</div>
`
}

<div class="dash">

<section class="panel">

<h2>
💰
${
  lang === "ar"
    ? "الأسواق"
    : "Markets"
}
</h2>

<div class="markets">

<div class="market">
USD/EGP
<b>
${
  marketData.usd
    ? marketData.usd.toFixed(2)
    : "—"
}
</b>
</div>

<div class="market">
EUR/EGP
<b>
${
  marketData.eur
    ? marketData.eur.toFixed(2)
    : "—"
}
</b>
</div>

<div class="market">
GBP/EGP
<b>
${
  marketData.gbp
    ? marketData.gbp.toFixed(2)
    : "—"
}
</b>
</div>

<div class="market">
SAR/EGP
<b>
${
  marketData.sar
    ? marketData.sar.toFixed(2)
    : "—"
}
</b>
</div>

<div class="market">
AED/EGP
<b>
${
  marketData.aed
    ? marketData.aed.toFixed(2)
    : "—"
}
</b>
</div>

</div>

</section>

<section class="panel">

<h2>
☁️
${
  lang === "ar"
    ? "الطقس"
    : "Weather"
}
</h2>

<div>

<b>
${esc(
  weatherData.city
)}
</b>

 ·

${
  weatherData.temperature ??
  "—"
}°C

 ·

${
  lang === "ar"
    ? "محسوس"
    : "Feels"
}

${
  weatherData.feels ??
  "—"
}°C

 ·

${
  weatherData.humidity ??
  "—"
}%

</div>

</section>

</div>

<div class="grid">

${rest
  .map(
    (article) =>
      card(
        article,
        lang
      )
  )
  .join("")}

</div>

<section
  class="panel"
  style="margin-top:25px"
>

<h2>
${
  lang === "ar"
    ? "كلمة اليوم"
    : "Word of the moment"
}
</h2>

<div id="quote">
${
  lang === "ar"
    ? "المعلومة الدقيقة تبدأ من مصدر واضح."
    : "Accurate information starts with a clear source."
}
</div>

</section>

<script>

const quotes =
${JSON.stringify(
  lang === "ar"
    ? [
        "المعلومة الدقيقة تبدأ من مصدر واضح.",
        "اعرف أكثر قبل أن تحكم.",
        "كل دقيقة تحمل قصة جديدة.",
        "الخبر الجيد يبدأ من حقيقة."
      ]
    : [
        "Accurate information starts with a clear source.",
        "Know more before you judge.",
        "Every minute carries a new story.",
        "Good news starts with facts."
      ]
)}

let quoteIndex = 0;

setInterval(() => {

  quoteIndex =
    (quoteIndex + 1) %
    quotes.length;

  const element =
    document.getElementById(
      "quote"
    );

  if (element) {
    element.textContent =
      quotes[quoteIndex];
  }

}, 30000);

</script>

<script>

/*
  IMAGE ENGINE:
  The news cards render first.
  Images are requested independently.
*/

document
  .querySelectorAll(
    "[data-id]"
  )
  .forEach(async (card) => {

    const existing =
      card.querySelector(
        "img"
      );

    if (existing) {
      return;
    }

    try {

      const response =
        await fetch(
          "/api/image?id=" +
          encodeURIComponent(
            card.dataset.id
          ) +
          "&lang=${lang}"
        );

      const data =
        await response.json();

      if (!data.url) {
        return;
      }

      const media =
        card.querySelector(
          ".media"
        );

      if (!media) {
        return;
      }

      const placeholder =
        media.querySelector(
          ".ph"
        );

      const image =
        new Image();

      image.loading =
        "lazy";

      image.decoding =
        "async";

      image.src =
        data.url;

      image.onload = () => {

        if (
          placeholder
        ) {
          placeholder.remove();
        }

        media.appendChild(
          image
        );

      };

    } catch {
      /*
        Image failure must never
        affect article rendering.
      */
    }

  });

</script>
`;

  return html(
    layout(lang).replace(
      '<main class="wrap" id="app"></main>',
      `<main class="wrap" id="app">
        ${app}
      </main>`
    )
  );
}

/* =========================
   SEARCH PAGE
========================= */

async function searchPage(
  env,
  url,
  lang
) {
  const query =
    url.searchParams.get(
      "q"
    ) || "";

  const items =
    await searchNews(
      env,
      query,
      lang
    );

  const app = `

<div class="sectionTitle">

<h1>
${
  lang === "ar"
    ? "نتائج البحث عن: "
    : "Search results: "
}

${esc(query)}

</h1>

</div>

<div class="grid">

${items
  .map(
    (article) =>
      card(
        article,
        lang
      )
  )
  .join("")}

</div>

${
  !items.length
    ? `
<div class="empty">
${
  lang === "ar"
    ? "لا توجد نتائج حديثة."
    : "No recent results."
}
</div>
`
    : ""
}

<script>

document
  .querySelectorAll(
    "[data-id]"
  )
  .forEach(async (card) => {

    try {

      const response =
        await fetch(
          "/api/image?id=" +
          encodeURIComponent(
            card.dataset.id
          ) +
          "&lang=${lang}"
        );

      const data =
        await response.json();

      if (!data.url) {
        return;
      }

      const media =
        card.querySelector(
          ".media"
        );

      if (!media) {
        return;
      }

      const image =
        new Image();

      image.loading =
        "lazy";

      image.decoding =
        "async";

      image.src =
        data.url;

      image.onload = () => {

        media
          .querySelector(
            ".ph"
          )
          ?.remove();

        media.appendChild(
          image
        );

      };

    } catch {}

  });

</script>
`;

  return html(
    layout(lang).replace(
      '<main class="wrap" id="app"></main>',
      `<main class="wrap" id="app">
        ${app}
      </main>`
    )
  );
}

/* =========================
   ARTICLE PAGE
========================= */

async function articlePage(
  env,
  url,
  id,
  lang
) {
  const article =
    await articleData(
      env,
      id,
      lang
    );

  if (!article) {
    return html(
      layout(lang).replace(
        '<main class="wrap" id="app"></main>',
        `<main class="wrap" id="app">
          <div class="empty">
            ${
              lang === "ar"
                ? "الخبر غير متاح حاليًا"
                : "Article unavailable"
            }
          </div>
        </main>`
      ),
      404
    );
  }

  const paragraphs = String(
    article.article.body ||
      ""
  )
    .split(/\n+/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map(
      (text) =>
        `<p>${esc(text)}</p>`
    )
    .join("");

  const structuredData = {
    "@context":
      "https://schema.org",
    "@type":
      "NewsArticle",

    headline:
      article.article.headline,

    image: article.image
      ? [article.image]
      : [],

    datePublished:
      article.publishedAt,

    dateModified:
      article.updatedAt,

    publisher: {
      "@type":
        "Organization",
      name: "NowPulse"
    },

    mainEntityOfPage: {
      "@type":
        "WebPage",
      "@id": url.href
    }
  };

  const app = `

<article class="article">

<div class="cover">

${
  article.image
    ? `
<img
  src="${esc(
    article.image
  )}"
  fetchpriority="high"
  decoding="async"
  onerror="this.remove()"
>
`
    : `
<div class="ph">
NowPulse
</div>
`
}

</div>

<div class="articleContent">

<div class="meta">

${esc(
  article.source
)}

 ·

${timeAgo(
  article.publishedAt,
  lang
)}

</div>

<h1>
${esc(
  article.article
    .headline
)}
</h1>

<div class="lead">

${esc(
  article.article
    .summary || ""
)}

</div>

${paragraphs}

</div>

</article>

<script type="application/ld+json">

${JSON.stringify(
  structuredData
).replace(
  /</g,
  "\\u003c"
)}

</script>
`;

  return html(
    layout(lang).replace(
      '<main class="wrap" id="app"></main>',
      `<main class="wrap" id="app">
        ${app}
      </main>`
    )
  );
}

/* =========================
   SITEMAP
========================= */

async function sitemap(env) {
  const items =
    await getNews(
      env,
      "ar"
    );

  const base =
    "https://nowpulse.tavengers16.workers.dev";

  const urls = [
    "/",
    "/?lang=ar",
    "/?lang=en",

    "/?category=egypt&lang=ar",
    "/?category=world&lang=ar",
    "/?category=politics&lang=ar",
    "/?category=sports&lang=ar",
    "/?category=economy&lang=ar",
    "/?category=tech&lang=ar",
    "/?category=arts&lang=ar",
    "/?category=health&lang=ar",
    "/?category=travel&lang=ar",

    ...items
      .slice(0, 80)
      .map(
        (article) =>
          `/article/${article.id}?lang=ar`
      )
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset
 xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${urls
  .map(
    (url) =>
      `<url><loc>${esc(
        base + url
      )}</loc></url>`
  )
  .join("")}
</urlset>`,
    {
      headers: {
        "content-type":
          "application/xml; charset=utf-8",
        "cache-control":
          "public,max-age=300"
      }
    }
  );
}

/* =========================
   ROBOTS
========================= */

function robots() {
  return new Response(
    `User-agent: *
Allow: /

Sitemap: https://nowpulse.tavengers16.workers.dev/sitemap.xml
`,
    {
      headers: {
        "content-type":
          "text/plain; charset=utf-8"
      }
    }
  );
}

/* =========================
   RSS
========================= */

function rss(items) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>

<rss version="2.0">

<channel>

<title>NowPulse</title>

<link>
https://nowpulse.tavengers16.workers.dev/
</link>

<description>
NowPulse latest news
</description>

${items
  .slice(0, 40)
  .map(
    (article) => `
<item>

<title>
${esc(article.title)}
</title>

<link>
https://nowpulse.tavengers16.workers.dev/article/${article.id}?lang=ar
</link>

<pubDate>
${new Date(
  article.publishedAt
).toUTCString()}
</pubDate>

<description>
${esc(
  article.description
)}
</description>

</item>
`
  )
  .join("")}

</channel>

</rss>`,
    {
      headers: {
        "content-type":
          "application/rss+xml; charset=utf-8",
        "cache-control":
          "public,max-age=300"
      }
    }
  );
}

/* =========================
   REFRESH ENGINE
========================= */

async function refresh(env) {
  try {
    const [
      arabic,
      english
    ] = await Promise.all([
      collectNews("ar"),
      collectNews("en")
    ]);

    /*
      Only write when usable data exists.
      KV failures never break the worker.
    */

    if (arabic.length) {
      await putCached(
        env,
        "feed:ar",
        {
          items: arabic,
          updatedAt:
            new Date().toISOString()
        },
        CACHE_TTL * 2
      );
    }

    if (english.length) {
      await putCached(
        env,
        "feed:en",
        {
          items: english,
          updatedAt:
            new Date().toISOString()
        },
        CACHE_TTL * 2
      );
    }

    return {
      ok: true,
      ar: arabic.length,
      en: english.length
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error?.message ||
        "Refresh failed"
    };
  }
}

async function scheduledJob(env) {
  try {
    await refresh(env);
  } catch {
    /*
      Cron failures must never
      generate an unhandled exception.
    */
  }
}

/* =========================
   MAIN WORKER
========================= */

export default {

  async fetch(
    request,
    env,
    ctx
  ) {
    const url =
      new URL(request.url);

    const lang =
      url.searchParams.get(
        "lang"
      ) === "en"
        ? "en"
        : "ar";

    try {

      /*
        HEALTH
        No KV writes.
      */

      if (
        url.pathname ===
        "/health"
      ) {
        return json({
          ok: true,
          service: APP,
          version: VERSION,
          bindings: {
            kv:
              !!env.NOWPULSE_KV,
            ai:
              !!env.AI
          },
          aiModel:
            AI_MODEL,
          time:
            new Date().toISOString()
        });
      }

      /*
        ROBOTS
      */

      if (
        url.pathname ===
        "/robots.txt"
      ) {
        return robots();
      }

      /*
        SITEMAP
      */

      if (
        url.pathname ===
        "/sitemap.xml"
      ) {
        return sitemap(env);
      }

      /*
        RSS
      */

      if (
        url.pathname ===
        "/rss.xml"
      ) {
        return rss(
          await getNews(
            env,
            "ar"
          )
        );
      }

      /*
        NEWS API
      */

      if (
        url.pathname ===
        "/api/news"
      ) {
        return json({
          ok: true,
          items:
            (
              await getNews(
                env,
                lang
              )
            ).slice(0, 50)
        });
      }

      /*
        SEARCH API
      */

      if (
        url.pathname ===
        "/api/search"
      ) {
        const query =
          url.searchParams.get(
            "q"
          ) || "";

        return json({
          ok: true,
          q: query,
          items:
            await searchNews(
              env,
              query,
              lang
            )
        });
      }

      /*
        WEATHER API
      */

      if (
        url.pathname ===
        "/api/weather"
      ) {
        return json(
          await weather(
            url.searchParams.get(
              "city"
            ) || "cairo"
          )
        );
      }

      /*
        MARKETS API
      */

      if (
        url.pathname ===
        "/api/markets"
      ) {
        return json(
          await markets()
        );
      }

      /*
        IMAGE API

        Images are resolved separately,
        so homepage rendering never waits
        for image scraping.
      */

      if (
        url.pathname ===
        "/api/image"
      ) {
        const id =
          url.searchParams.get(
            "id"
          );

        if (!id) {
          return json(
            {
              ok: false
            },
            400
          );
        }

        const items =
          await getNews(
            env,
            lang
          );

        const article =
          items.find(
            (item) =>
              item.id === id
          );

        if (!article) {
          return json(
            {
              ok: false
            },
            404
          );
        }

        const image =
          await imageFor(
            env,
            article
          );

        return json({
          ok: true,
          url: image
        });
      }

      /*
        ARTICLE
      */

      if (
        url.pathname.startsWith(
          "/article/"
        )
      ) {
        const id =
          url.pathname
            .split("/")
            .filter(Boolean)[1];

        return articlePage(
          env,
          url,
          id,
          lang
        );
      }

      /*
        SEARCH PAGE
      */

      if (
        url.pathname ===
        "/search"
      ) {
        return searchPage(
          env,
          url,
          lang
        );
      }

      /*
        MANUAL REFRESH
        Optional secret.
      */

      if (
        url.pathname ===
        "/api/refresh"
      ) {
        if (
          env.NOWPULSE_REFRESH_KEY &&
          url.searchParams.get(
            "key"
          ) !==
            env.NOWPULSE_REFRESH_KEY
        ) {
          return json(
            {
              ok: false,
              error:
                "Unauthorized"
            },
            401
          );
        }

        return json(
          await refresh(env)
        );
      }

      /*
        DEFAULT PAGE
      */

      return home(
        env,
        url,
        lang
      );

    } catch (error) {

      /*
        FINAL SAFETY NET.
        No uncaught Worker error.
      */

      return json(
        {
          ok: false,
          error:
            "Internal error",

          detail:
            env.NOWPULSE_ENV ===
            "development"
              ? error?.message
              : undefined
        },
        500
      );
    }
  },

  async scheduled(
    controller,
    env,
    ctx
  ) {
    ctx.waitUntil(
      scheduledJob(env)
    );
  }

};
