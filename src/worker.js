const VERSION = "4.0.0";
const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const SITE = "https://nowpulse.tavengers16.workers.dev";

const MAX_ARTICLES = 180;
const FRESH_HOURS = 72;

const CATEGORIES = {
  latest: { ar: "آخر الأخبار", en: "Latest", icon: "✦", tone: "latest" },
  egypt: { ar: "مصر", en: "Egypt", icon: "𓂀", tone: "egypt" },
  world: { ar: "العالم", en: "World", icon: "◉", tone: "world" },
  politics: { ar: "سياسة", en: "Politics", icon: "▣", tone: "politics" },
  sports: { ar: "رياضة", en: "Sports", icon: "⚽", tone: "sports" },
  economy: { ar: "اقتصاد", en: "Economy", icon: "◈", tone: "economy" },
  tech: { ar: "تكنولوجيا", en: "Technology", icon: "⌘", tone: "tech" },
  arts: { ar: "فن", en: "Arts", icon: "✦", tone: "arts" },
  health: { ar: "صحة", en: "Health", icon: "✚", tone: "health" },
  travel: { ar: "سفر", en: "Travel", icon: "✈", tone: "travel" },
  trends: { ar: "الترند", en: "Trending", icon: "⌁", tone: "trends" },
  markets: { ar: "الأسواق", en: "Markets", icon: "₿", tone: "markets" },
  weather: { ar: "الطقس", en: "Weather", icon: "☁", tone: "weather" }
};

const SOURCES = [
  [
    "egypt",
    "https://news.google.com/rss/search?q=Egypt%20when%3A3d&hl=en-US&gl=US&ceid=US%3Aen"
  ],
  [
    "world",
    "https://news.google.com/rss/search?q=world%20news%20when%3A3d&hl=en-US&gl=US&ceid=US%3Aen"
  ],
  [
    "politics",
    "https://news.google.com/rss/search?q=politics%20when%3A3d&hl=en-US&gl=US&ceid=US%3Aen"
  ],
  [
    "sports",
    "https://news.google.com/rss/search?q=sports%20when%3A3d&hl=en-US&gl=US&ceid=US%3Aen"
  ],
  [
    "economy",
    "https://news.google.com/rss/search?q=economy%20finance%20when%3A3d&hl=en-US&gl=US&ceid=US%3Aen"
  ],
  [
    "tech",
    "https://news.google.com/rss/search?q=technology%20AI%20when%3A3d&hl=en-US&gl=US&ceid=US%3Aen"
  ],
  [
    "arts",
    "https://news.google.com/rss/search?q=entertainment%20arts%20when%3A3d&hl=en-US&gl=US&ceid=US%3Aen"
  ],
  [
    "health",
    "https://news.google.com/rss/search?q=health%20when%3A3d&hl=en-US&gl=US&ceid=US%3Aen"
  ],
  [
    "travel",
    "https://news.google.com/rss/search?q=travel%20when%3A3d&hl=en-US&gl=US&ceid=US%3Aen"
  ]
];

const QUOTES = [
  ["العربية", "كل خبر يبدأ بسؤال، وكل معرفة تبدأ بالتحقق."],
  ["العربية", "المعلومة الدقيقة أقوى من الخبر الأسرع."],
  ["العربية", "اسأل، تحقق، ثم كوّن رأيك."],
  ["English", "Good information starts with verification."],
  ["English", "Read the facts. Then make up your mind."],
  ["English", "Speed matters, but accuracy matters more."]
];

const CITY = {
  cairo: [30.0444, 31.2357, "القاهرة", "Cairo"],
  giza: [30.0131, 31.2089, "الجيزة", "Giza"],
  alexandria: [31.2001, 29.9187, "الإسكندرية", "Alexandria"],
  hurghada: [27.2579, 33.8116, "الغردقة", "Hurghada"],
  luxor: [25.6872, 32.6396, "الأقصر", "Luxor"],
  aswan: [24.0889, 32.8998, "أسوان", "Aswan"],
  portsaid: [31.2653, 32.3019, "بورسعيد", "Port Said"],
  suez: [29.9668, 32.5498, "السويس", "Suez"]
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=30, stale-while-revalidate=120",
      ...headers
    }
  });
}

function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[c]
  );
}

function attr(s) {
  return esc(s).replace(/`/g, "&#96;");
}

function decodeEntities(s) {
  return String(s).replace(
    /&(#x[0-9a-f]+|#\d+|nbsp|amp|quot|apos|lt|gt);?/gi,
    (m, x) => {
      const k = x.toLowerCase();

      if (k === "nbsp") return " ";
      if (k === "amp") return "&";
      if (k === "quot") return '"';
      if (k === "apos") return "'";
      if (k === "lt") return "<";
      if (k === "gt") return ">";

      if (k.startsWith("#x")) {
        return String.fromCodePoint(parseInt(k.slice(2), 16));
      }

      if (k.startsWith("#")) {
        return String.fromCodePoint(parseInt(k.slice(1), 10));
      }

      return m;
    }
  );
}

function normalize(s) {
  return decodeEntities(String(s ?? ""))
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\\#/g, "")
    .replace(/^\s*#+\s*/g, "")
    .replace(/&nbsp;|nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s, n = 220) {
  const x = normalize(s);

  if (x.length <= n) {
    return x;
  }

  return x.slice(0, n - 1).trimEnd() + "…";
}

function hash(s) {
  let h = 2166136261;

  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return (h >>> 0).toString(36);
}

function uid(a, b) {
  return hash(`${a}|${b}`).slice(0, 12);
}

function absUrl(u, base) {
  try {
    return new URL(u, base).href;
  } catch {
    return "";
  }
}

function timeoutSignal(ms) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort("timeout");
  }, ms);

  return {
    signal: controller.signal,
    done: () => clearTimeout(timer)
  };
}

async function fetchText(url, ms = 6500, headers = {}) {
  const t = timeoutSignal(ms);

  try {
    const response = await fetch(url, {
      signal: t.signal,
      redirect: "follow",
      headers: {
        "user-agent": "NowPulse/4.0 News Reader",
        accept: "text/html,application/xml,text/xml,*/*",
        ...headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    t.done();
  }
}

async function safeFetch(url, ms = 6500, headers = {}) {
  try {
    return await fetchText(url, ms, headers);
  } catch {
    return "";
  }
}

function xmlItems(xml) {
  const out = [];
  const re = /<item[\s\S]*?<\/item>/gi;

  let match;

  while ((match = re.exec(xml)) && out.length < 40) {
    const item = match[0];

    const value = tag => {
      const r = new RegExp(
        `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
        "i"
      ).exec(item);

      return r ? r[1] : "";
    };

    const title = normalize(value("title"));
    const link = normalize(value("link"));
    const pubDate = normalize(value("pubDate"));
    const description = normalize(value("description"));
    const source = normalize(value("source"));

    const imageMatch =
      /<(?:media:content|media:thumbnail)[^>]+url=["']([^"']+)["']/i.exec(
        item
      );

    const image = imageMatch ? decodeEntities(imageMatch[1]) : "";

    if (title && link) {
      out.push({
        title,
        link,
        pubDate,
        description,
        source,
        image
      });
    }
  }

  return out;
}

function dateMs(value) {
  const time = Date.parse(value || "");
  return Number.isFinite(time) ? time : 0;
}

function isFresh(time) {
  return (
    time > 0 &&
    time <= Date.now() + 2 * 3600 * 1000 &&
    time >= Date.now() - FRESH_HOURS * 3600 * 1000
  );
}

function cleanTitle(title) {
  return normalize(title)
    .replace(/\s*[-|–—]\s*[^-–—|]{1,80}$/u, "")
    .trim();
}

function sourceHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function quality(article) {
  const bad = [
    "pinterest",
    "facebook",
    "tiktok",
    "youtube.com",
    "medium.com",
    "blogspot",
    "wordpress",
    "pressrelease",
    "prnewswire",
    "unknown"
  ];

  const host = sourceHost(article.link);
  let score = 0;

  if (article.title.length > 25) score += 2;
  if (article.description.length > 40) score += 1;
  if (isFresh(article.time)) score += 4;
  if (host) score += 1;

  if (!bad.some(x => host.includes(x))) {
    score += 2;
  }

  if (/^(200\d|201\d|2020|2021|2022)\b/.test(article.title)) {
    score -= 5;
  }

  return score;
}

function classify(title, preferred = "latest") {
  const text = title.toLowerCase();

  const rules = {
    sports:
      /football|soccer|match|goal|league|champions|premier|arsenal|chelsea|liverpool|manchester|real madrid|barcelona|al ahly|zamalek|tennis|basketball|olympic|رياضة|الأهلي|الزمالك|مباراة|الدوري|كرة/,
    economy:
      /economy|finance|market|stock|gold|oil|inflation|interest rate|bank|currency|dollar|euro|اقتصاد|ذهب|دولار|أسعار|بنك|بورصة|نفط/,
    tech:
      /technology|tech|ai|artificial intelligence|iphone|android|google|microsoft|apple|openai|chip|cyber|تكنولوجيا|ذكاء اصطناعي|هاتف|أبل|جوجل|مايكروسوفت/,
    arts:
      /film|movie|music|actor|actress|singer|celebrity|festival|cinema|فن|فيلم|سينما|ممثل|مغني|مهرجان/,
    health:
      /health|medical|hospital|disease|vaccine|doctor|صحة|مرض|مستشفى|دواء|لقاح|طبيب/,
    travel:
      /travel|tourism|flight|airport|hotel|tour|سفر|سياحة|طيران|مطار|فنادق/,
    politics:
      /president|minister|government|election|parliament|senate|politics|ترامب|رئيس|وزير|حكومة|انتخابات|برلمان|سياسة/,
    egypt:
      /egypt|cairo|giza|alexandria|hurghada|luxor|aswan|egyptian|مصر|القاهرة|الجيزة|الإسكندرية|الغردقة|الأقصر|أسوان|مصري/
  };

  for (const [category, regex] of Object.entries(rules)) {
    if (regex.test(text)) {
      return category;
    }
  }

  return preferred && CATEGORIES[preferred] ? preferred : "world";
}

async function fetchFeed(category, url) {
  const xml = await safeFetch(url, 7000);

  if (!xml) {
    return [];
  }

  return xmlItems(xml)
    .map(item => ({
      id: uid(item.link, item.title),
      title: cleanTitle(item.title),
      description: truncate(item.description, 280),
      link: item.link,
      source: item.source || sourceHost(item.link),
      time: dateMs(item.pubDate),
      category: classify(item.title, category),
      image: absUrl(item.image || "", url) || "",
      originalImage: absUrl(item.image || "", url) || "",
      lang: /[\u0600-\u06ff]/.test(item.title) ? "ar" : "en"
    }))
    .filter(
      article =>
        article.time &&
        isFresh(article.time) &&
        article.title.length >= 18
    );
}

async function ingest(env) {
  const jobs = await Promise.allSettled(
    SOURCES.map(source => fetchFeed(source[0], source[1]))
  );

  const map = new Map();

  for (const result of jobs) {
    if (result.status !== "fulfilled") continue;

    for (const article of result.value) {
      const old = map.get(article.id);

      if (!old || quality(article) > quality(old)) {
        map.set(article.id, article);
      }
    }
  }

  const incoming = [...map.values()]
    .sort((a, b) => b.time - a.time)
    .slice(0, MAX_ARTICLES);

  if (!env.NOWPULSE_KV) {
    return incoming;
  }

  try {
    const oldValue =
      (await env.NOWPULSE_KV.get("feed:latest")) || "[]";

    const old = JSON.parse(oldValue);
    const merged = new Map(old.map(item => [item.id, item]));

    for (const article of incoming) {
      merged.set(article.id, {
        ...merged.get(article.id),
        ...article
      });
    }

    const final = [...merged.values()]
      .filter(
        article =>
          article.time &&
          article.time >= Date.now() - 14 * 86400000
      )
      .sort((a, b) => b.time - a.time)
      .slice(0, MAX_ARTICLES);

    const oldIds = old.map(x => x.id).join(",");
    const newIds = final.map(x => x.id).join(",");

    if (oldIds !== newIds || old.length !== final.length) {
      await env.NOWPULSE_KV.put(
        "feed:latest",
        JSON.stringify(final),
        {
          expirationTtl: 86400
        }
      );
    }

    return final;
  } catch {
    return incoming;
  }
}

async function getFeed(env) {
  if (env.NOWPULSE_KV) {
    try {
      const value = await env.NOWPULSE_KV.get("feed:latest");

      if (value) {
        const articles = JSON.parse(value);

        if (articles.length) {
          return articles;
        }
      }
    } catch {}
  }

  return ingest(env);
}

function relevantImageUrl(id, title = "", url = "") {
  return `/api/image?id=${encodeURIComponent(id)}&title=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(url)}`;
}

async function resolveImage(env, article) {
  if (
    article.originalImage &&
    /^https?:\/\//i.test(article.originalImage)
  ) {
    return article.originalImage;
  }

  const page = await safeFetch(article.link, 6000);

  if (page) {
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    ];

    for (const regex of patterns) {
      const match = regex.exec(page);

      if (match) {
        const url = absUrl(
          decodeEntities(match[1]),
          article.link
        );

        if (/^https?:\/\//i.test(url)) {
          return url;
        }
      }
    }

    const jsonLd = page.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
    );

    if (jsonLd) {
      try {
        const parsed = JSON.parse(jsonLd[1]);
        const objects = Array.isArray(parsed) ? parsed : [parsed];

        for (const object of objects) {
          const image = object?.image;

          const url =
            Array.isArray(image)
              ? image[0]
              : typeof image === "object"
              ? image?.url
              : image;

          if (url) {
            const absolute = absUrl(url, article.link);

            if (absolute) {
              return absolute;
            }
          }
        }
      } catch {}
    }
  }

  const query = encodeURIComponent(
    article.title
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .slice(0, 100)
  );

  const commons = await safeFetch(
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${query}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json`,
    5000,
    {
      accept: "application/json"
    }
  );

  try {
    const data = JSON.parse(commons);
    const page = Object.values(data.query?.pages || {})[0];
    const url = page?.imageinfo?.[0]?.url;

    if (url) {
      return url;
    }
  } catch {}

  return "";
}

async function storeImage(env, id, url) {
  if (!env.NOWPULSE_KV || !url) return;

  try {
    await env.NOWPULSE_KV.put(
      `img:${id}`,
      url,
      {
        expirationTtl: 604800
      }
    );
  } catch {}
}

async function getArticle(env, id) {
  const feed = await getFeed(env);

  return feed.find(article => article.id === id) || null;
}

async function ai(env, messages, max_tokens = 900) {
  if (!env.AI) {
    return "";
  }

  try {
    const task = env.AI.run(
      env.NOWPULSE_AI_MODEL || AI_MODEL,
      {
        messages,
        max_tokens,
        temperature: 0.2
      }
    );

    const result = await Promise.race([
      task,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), 9000)
      )
    ]);

    return typeof result?.response === "string"
      ? result.response
      : typeof result?.result === "string"
      ? result.result
      : "";
  } catch {
    return "";
  }
}

function factsText(items) {
  return items
    .slice(0, 8)
    .map(
      (item, index) =>
        `SOURCE ${index + 1}
Title: ${item.title}
Publisher: ${item.source}
Time: ${new Date(item.time).toISOString()}
Summary: ${item.description}
URL: ${item.link}`
    )
    .join("\n\n");
}

async function writeArticle(env, article, lang) {
  const feed = await getFeed(env);

  const related = feed
    .filter(
      item =>
        item.id !== article.id &&
        (
          item.category === article.category ||
          normalize(item.title)
            .split(/\s+/)
            .some(
              word =>
                word.length > 5 &&
                normalize(article.title).includes(word)
            )
        )
    )
    .slice(0, 7);

  const sources = [article, ...related];

  const system = `You are the editorial engine of NowPulse.

Write an original factual news article in ${
    lang === "ar" ? "Arabic" : "English"
  }.

Use ONLY the supplied source facts.

Compare sources before writing.

Repeated facts across independent sources are stronger.

Never invent:
- names
- dates
- numbers
- quotes
- motives
- causes
- events
- locations

If sources conflict, describe the conflict neutrally.

Do not copy wording from any source.

Return clean HTML only using:
<p>
<h2>
<ul>
<li>
<strong>

No markdown.
No external links.
No source list.
No preamble.

The article must be a real readable article, normally 5 to 9 paragraphs.`;

  const output = await ai(
    env,
    [
      {
        role: "system",
        content: system
      },
      {
        role: "user",
        content:
          `MAIN STORY:\n${article.title}\n\n` +
          factsText(sources)
      }
    ],
    1100
  );

  return normalizeAIHtml(output) ||
    `<p>${esc(article.description || article.title)}</p>`;
}

function normalizeAIHtml(text) {
  if (!text) return "";

  return text
    .replace(/```(?:html)?/gi, "")
    .replace(/```/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .trim();
}

async function searchNews(env, query) {
  const q = String(query || "").trim().slice(0, 100);

  if (q.length < 2) {
    return [];
  }

  const urls = [
    `https://news.google.com/rss/search?q=${encodeURIComponent(
      `${q} when:3d`
    )}&hl=en-US&gl=US&ceid=US:en`,
    `https://news.google.com/rss/search?q=${encodeURIComponent(
      `${q} أخبار when:3d`
    )}&hl=ar&gl=EG&ceid=EG:ar`
  ];

  const results = await Promise.allSettled(
    urls.map(url => safeFetch(url, 6500))
  );

  const map = new Map();

  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value) {
      continue;
    }

    for (const item of xmlItems(result.value)) {
      const article = {
        id: uid(item.link, item.title),
        title: cleanTitle(item.title),
        description: truncate(item.description),
        link: item.link,
        source: item.source || sourceHost(item.link),
        time: dateMs(item.pubDate),
        category: classify(item.title),
        image: absUrl(item.image || "", urls[0]) || "",
        originalImage: absUrl(item.image || "", urls[0]) || "",
        lang: /[\u0600-\u06ff]/.test(item.title)
          ? "ar"
          : "en"
      };

      if (
        article.time &&
        isFresh(article.time) &&
        article.title.length > 10
      ) {
        map.set(article.id, article);
      }
    }
  }

  return [...map.values()]
    .sort((a, b) => b.time - a.time)
    .slice(0, 30);
}

async function markets() {
  const result = {
    gold: null,
    fx: {}
  };

  try {
    const controller = timeoutSignal(5000);

    const response = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=EGP,EUR,GBP,CHF",
      {
        signal: controller.signal
      }
    );

    controller.done();

    const data = await response.json();

    result.fx = data.rates || {};
  } catch {}

  try {
    const controller = timeoutSignal(5000);

    const response = await fetch(
      "https://api.gold-api.com/price/XAU",
      {
        signal: controller.signal
      }
    );

    controller.done();

    const data = await response.json();

    result.gold = Number(data.price) || null;
  } catch {}

  return result;
}

async function weather(city = "cairo") {
  const selected = CITY[city] || CITY.cairo;

  try {
    const controller = timeoutSignal(5000);

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${selected[0]}` +
      `&longitude=${selected[1]}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&timezone=auto`;

    const response = await fetch(url, {
      signal: controller.signal
    });

    controller.done();

    const data = await response.json();

    return {
      city,
      ar: selected[2],
      en: selected[3],
      ...(data.current || {})
    };
  } catch {
    return {
      city,
      ar: selected[2],
      en: selected[3]
    };
  }
}

function iconSvg(category) {
  const icons = {
    sports: "⚽",
    economy: "▥",
    politics: "▣",
    tech: "⌘",
    arts: "✦",
    health: "✚",
    travel: "✈",
    world: "◎",
    egypt: "𓂀",
    latest: "✦",
    trends: "⌁",
    markets: "₿",
    weather: "☁"
  };

  return `<span class="cat-icon" aria-hidden="true">${
    icons[category] || "•"
  }</span>`;
}

function timeAgo(ms, lang) {
  const difference = Math.max(0, Date.now() - ms);
  const minutes = Math.floor(difference / 60000);

  if (lang === "ar") {
    if (minutes < 1) return "الآن";

    if (minutes < 60) {
      return `منذ ${minutes} دقيقة`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `منذ ${hours} ساعة`;
    }

    return `منذ ${Math.floor(hours / 24)} يوم`;
  }

  if (minutes < 1) return "Now";

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function card(article, lang, hero = false) {
  const category =
    CATEGORIES[article.category] || CATEGORIES.world;

  const image =
    article.originalImage ||
    article.image ||
    relevantImageUrl(
      article.id,
      article.title,
      article.link
    );

  return `
<article class="card ${hero ? "hero" : ""} tone-${category.tone}">
<a href="/article/${article.id}?lang=${lang}">
<div class="thumb">
<img
src="${attr(image)}"
data-image-id="${attr(article.id)}"
loading="${hero ? "eager" : "lazy"}"
decoding="async"
fetchpriority="${hero ? "high" : "auto"}"
onerror="this.style.display='none';this.parentElement.classList.add('no-image')">
<span>${iconSvg(article.category)}</span>
</div>

<div class="card-body">
<div class="meta">
<b>${esc(category[lang])}</b>
<span>${esc(article.source || "NowPulse")}</span>
<time>${timeAgo(article.time, lang)}</time>
</div>

<h2>${esc(article.title)}</h2>
<p>${esc(article.description)}</p>
</div>
</a>
</article>`;
}

function quote() {
  return `
<section class="quote" id="quote">
<strong>حكمة اليوم</strong>
<span></span>
</section>`;
}

function shell(
  lang,
  title,
  description,
  content,
  options = {}
) {
  const ar = lang === "ar";
  const canonical =
    options.canonical || `${SITE}/?lang=${lang}`;

  const direction = ar ? "rtl" : "ltr";

  return `<!doctype html>
<html lang="${ar ? "ar" : "en"}" dir="${direction}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">

<title>${esc(title)}</title>

<meta
name="description"
content="${attr(description)}">

<link
rel="canonical"
href="${attr(canonical)}">

<meta
property="og:title"
content="${attr(title)}">

<meta
property="og:description"
content="${attr(description)}">

<meta
property="og:type"
content="website">

<meta
property="og:url"
content="${attr(canonical)}">

<meta
name="theme-color"
content="#10141c">

<style>${CSS}</style>
</head>

<body class="${direction}">

<header class="top">

<a
class="brand"
href="/?lang=${lang}"
aria-label="NowPulse">

<span class="brand-mark">N</span>
<span>NowPulse</span>

</a>

<form
class="search"
action="/search"
method="get">

<input
name="q"
placeholder="${
    ar
      ? "ابحث عن أي شخص أو موضوع…"
      : "Search any person or topic…"
  }"
autocomplete="off">

<input
type="hidden"
name="lang"
value="${lang}">

<button>⌕</button>

</form>

<nav class="top-actions">

<a href="?lang=${lang === "ar" ? "en" : "ar"}">
${lang === "ar" ? "EN" : "عربي"}
</a>

<button
onclick="toggleTheme()"
aria-label="theme">
☀️
</button>

<button
onclick="location.reload()"
aria-label="refresh">
↻
</button>

</nav>

</header>

<nav class="nav">

${Object.entries(CATEGORIES)
  .filter(
    ([key]) =>
      !["markets", "weather", "latest"].includes(key)
  )
  .map(
    ([key, value]) => `
<a
class="nav-${key}"
href="/?category=${key}&lang=${lang}">
${iconSvg(key)}
<span>${value[lang]}</span>
</a>`
  )
  .join("")}

<a
class="nav-trends"
href="/?category=trends&lang=${lang}">
${iconSvg("trends")}
<span>${CATEGORIES.trends[lang]}</span>
</a>

</nav>

${content}

<footer>
Created by Taha · NowPulse ${VERSION}
</footer>

<script>${CLIENT}</script>

</body>
</html>`;
}

function trendArticles(feed) {
  const scores = new Map();

  for (const article of feed) {
    const words = normalize(article.title)
      .toLowerCase()
      .split(/\s+/)
      .filter(
        word =>
          word.length >= 4 &&
          !/^(the|and|from|with|this|that|news|latest|about|بعد|اليوم|الآن|خبر|اخبار)$/.test(
            word
          )
      );

    for (const word of words) {
      scores.set(
        word,
        (scores.get(word) || 0) + 1
      );
    }
  }

  const top = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(item => item[0]);

  return feed
    .filter(article =>
      top.some(word =>
        article.title.toLowerCase().includes(word)
      )
    )
    .slice(0, 25);
}

async function home(env, lang, category) {
  let feed = await getFeed(env);

  if (
    category &&
    category !== "latest" &&
    category !== "trends"
  ) {
    feed = feed.filter(
      article => article.category === category
    );
  }

  if (category === "trends") {
    feed = trendArticles(feed);
  }

  const featured = feed[0];
  const rest = feed.slice(1, 25);

  const dashboard = `
<div class="dashboard">

<section class="info-panel markets">

<div class="panel-head">
<h2>${CATEGORIES.markets[lang]}</h2>

<a href="/markets?lang=${lang}">
${lang === "ar" ? "عرض الكل" : "View all"}
</a>
</div>

<div
class="market-grid"
id="market-grid">

<div>
<small>Gold XAU/USD</small>
<b>…</b>
</div>

<div>
<small>USD / EGP</small>
<b>…</b>
</div>

<div>
<small>EUR / USD</small>
<b>…</b>
</div>

<div>
<small>GBP / USD</small>
<b>…</b>
</div>

</div>

<small class="muted">
${lang === "ar"
      ? "جارٍ تحديث الأسعار…"
      : "Updating prices…"}
</small>

</section>

<section class="info-panel weather">

<div class="panel-head">

<h2>${CATEGORIES.weather[lang]}</h2>

<select
id="city"
onchange="loadWeather(this.value)">

${Object.entries(CITY)
  .map(
    ([key, value]) =>
      `<option value="${key}">
${value[lang === "ar" ? 2 : 3]}
</option>`
  )
  .join("")}

</select>

</div>

<div
class="weather-main"
id="weather-main">

<span>☁︎</span>

<b>…°</b>

<small>
${lang === "ar"
      ? "جارٍ التحديث…"
      : "Updating…"}
</small>

</div>

</section>

</div>`;

  return shell(
    lang,
    category
      ? CATEGORIES[category]?.[lang] || "NowPulse"
      : "NowPulse",
    lang === "ar"
      ? "آخر الأخبار والمعلومات المحدثة"
      : "Latest verified news and information",
    `
<main class="page">

<div class="page-title">

<div>

<span class="eyebrow">
NowPulse
</span>

<h1>
${
  category && CATEGORIES[category]
    ? CATEGORIES[category][lang]
    : lang === "ar"
    ? "آخر الأخبار"
    : "Latest News"
}
</h1>

</div>

<span class="live">
● LIVE
</span>

</div>

${quote()}

${dashboard}

${
  featured
    ? `
<section class="news-grid">

<div class="featured">
${card(featured, lang, true)}
</div>

<div class="feed">
${rest.map(article => card(article, lang)).join("")}
</div>

</section>`
    : `
<div class="empty">
${
  lang === "ar"
    ? "لا توجد أخبار حديثة مطابقة حاليًا."
    : "No recent matching news is available."
}
</div>`
}

</main>`
  );
}

async function articlePage(env, id, lang) {
  const article = await getArticle(env, id);

  if (!article) {
    return html("<h1>404</h1>", 404);
  }

  let image =
    article.originalImage ||
    article.image ||
    "";

  if (!image && env.NOWPULSE_KV) {
    try {
      image =
        (await env.NOWPULSE_KV.get(`img:${id}`)) ||
        "";
    } catch {}
  }

  if (!image) {
    image = relevantImageUrl(
      id,
      article.title,
      article.link
    );
  }

  const body = await writeArticle(
    env,
    article,
    lang
  );

  const category =
    CATEGORIES[article.category] ||
    CATEGORIES.world;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    datePublished: new Date(
      article.time
    ).toISOString(),
    dateModified: new Date(
      article.time
    ).toISOString(),
    image: [image],
    publisher: {
      "@type": "Organization",
      name: "NowPulse",
      url: SITE
    },
    mainEntityOfPage:
      `${SITE}/article/${article.id}?lang=${lang}`
  };

  return shell(
    lang,
    article.title,
    article.description,
    `
<main class="article-page">

<div class="article-kicker">
${iconSvg(article.category)}
${esc(category[lang])}
·
${timeAgo(article.time, lang)}
</div>

<h1>
${esc(article.title)}
</h1>

<div class="article-source">
${esc(article.source || "NowPulse")}
</div>

<figure class="article-image">

<img
src="${attr(image)}"
onerror="this.style.display='none'">

<figcaption>
${
  lang === "ar"
    ? "صورة مرتبطة بالخبر"
    : "Image related to the story"
}
</figcaption>

</figure>

<div class="article-body">
${body}
</div>

<div class="article-note">
${
  lang === "ar"
    ? "تمت صياغة المقال داخل NowPulse اعتمادًا على المعلومات المتاحة من المصادر التي تم جمعها للخبر، دون نسخ نص المصدر."
    : "This article was written inside NowPulse from the available collected source facts and is not copied from a publisher."
}
</div>

</main>`,
    {
      canonical:
        `${SITE}/article/${article.id}?lang=${lang}`
    }
  ).replace(
    "</head>",
    `<script type="application/ld+json">${JSON.stringify(
      structuredData
    ).replace(/</g, "\\u003c")}</script></head>`
  );
}

async function searchPage(env, query, lang) {
  const rows = await searchNews(env, query);

  return shell(
    lang,
    `${query} · NowPulse`,
    lang === "ar"
      ? `نتائج البحث عن ${query}`
      : `Search results for ${query}`,
    `
<main class="page">

<div class="page-title">

<div>

<span class="eyebrow">
NowPulse Search
</span>

<h1>
${
  lang === "ar"
    ? "نتائج البحث"
    : "Search results"
}
</h1>

<p>
${esc(query)}
</p>

</div>

</div>

<div class="search-results">

${
  rows.length
    ? rows.map(article => card(article, lang)).join("")
    : `
<div class="empty">
${
  lang === "ar"
    ? "لم نجد أخبارًا حديثة مطابقة. جرّب اسمًا أو موضوعًا آخر."
    : "No recent matching stories were found. Try another person or topic."
}
</div>`
}

</div>

</main>`
  );
}

const CSS = `
:root{
--bg:#f5f7fb;
--surface:#fff;
--text:#111827;
--muted:#667085;
--line:#e5e7eb;
--accent:#2563eb;
--shadow:0 10px 30px rgba(15,23,42,.07)
}

*{
box-sizing:border-box
}

html{
scroll-behavior:smooth
}

body{
margin:0;
background:var(--bg);
color:var(--text);
font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif
}

.top{
height:72px;
display:grid;
grid-template-columns:auto minmax(300px,720px) auto;
gap:24px;
align-items:center;
padding:0 5%;
background:var(--surface);
border-bottom:1px solid var(--line);
position:sticky;
top:0;
z-index:20
}

.brand{
display:flex;
align-items:center;
gap:10px;
color:var(--text);
font-size:24px;
font-weight:900;
text-decoration:none
}

.brand-mark{
width:38px;
height:38px;
border-radius:12px;
display:grid;
place-items:center;
background:linear-gradient(135deg,#111827,#2563eb);
color:white
}

.search{
display:flex;
border:1px solid var(--line);
background:var(--bg);
border-radius:14px;
overflow:hidden
}

.search input{
min-width:0;
flex:1;
border:0;
background:transparent;
padding:12px 15px;
font-size:15px;
outline:0
}

.search button{
border:0;
background:var(--text);
color:white;
width:48px;
font-size:22px
}

.top-actions{
display:flex;
gap:8px;
align-items:center
}

.top-actions a,
.top-actions button{
border:1px solid var(--line);
background:var(--surface);
color:var(--text);
padding:9px 11px;
border-radius:10px;
text-decoration:none;
cursor:pointer
}

.nav{
display:flex;
gap:8px;
padding:12px 5%;
background:var(--surface);
border-bottom:1px solid var(--line);
overflow:auto;
scrollbar-width:none
}

.nav a{
white-space:nowrap;
text-decoration:none;
color:var(--muted);
font-weight:700;
padding:9px 12px;
border-radius:12px;
display:flex;
align-items:center;
gap:7px
}

.nav a:hover{
background:var(--bg);
color:var(--text)
}

.cat-icon{
font-size:1.05em;
font-weight:900
}

.page{
max-width:1380px;
margin:auto;
padding:32px 5% 60px
}

.page-title{
display:flex;
justify-content:space-between;
align-items:end;
gap:20px;
margin-bottom:20px
}

.eyebrow{
color:var(--accent);
font-weight:800;
font-size:13px;
text-transform:uppercase;
letter-spacing:.08em
}

.page-title h1{
font-size:42px;
margin:5px 0 0;
line-height:1.05
}

.page-title p{
color:var(--muted);
margin:8px 0
}

.live{
color:#dc2626;
font-weight:900
}

.quote{
display:flex;
justify-content:space-between;
gap:20px;
align-items:center;
background:linear-gradient(135deg,#111827,#243b64);
color:white;
border-radius:18px;
padding:18px 22px;
margin-bottom:18px;
min-height:68px
}

.quote strong{
font-size:13px;
opacity:.75
}

.quote span{
font-size:17px;
font-weight:700
}

.dashboard{
display:grid;
grid-template-columns:1fr 1fr;
gap:16px;
margin-bottom:20px
}

.info-panel{
background:var(--surface);
border:1px solid var(--line);
border-radius:18px;
padding:18px;
box-shadow:var(--shadow)
}

.panel-head{
display:flex;
justify-content:space-between;
align-items:center;
gap:10px
}

.panel-head h2{
font-size:18px;
margin:0
}

.panel-head a,
.panel-head select{
border:0;
background:var(--bg);
color:var(--text);
padding:7px 10px;
border-radius:9px;
text-decoration:none
}

.market-grid{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:10px;
margin-top:14px
}

.market-grid div{
padding:12px;
border-radius:12px;
background:var(--bg)
}

.market-grid small,
.weather small{
display:block;
color:var(--muted)
}

.market-grid b{
display:block;
margin-top:5px
}

.muted{
color:var(--muted);
display:block;
margin-top:10px
}

.weather-main{
display:flex;
align-items:center;
gap:16px;
margin-top:12px
}

.weather-main span{
font-size:38px
}

.weather-main b{
font-size:32px
}

.news-grid{
display:grid;
grid-template-columns:minmax(0,1.15fr) minmax(0,1.85fr);
gap:18px;
align-items:start
}

.feed{
display:grid;
grid-template-columns:1fr 1fr;
gap:16px
}

.card{
background:var(--surface);
border:1px solid var(--line);
border-radius:18px;
overflow:hidden;
box-shadow:var(--shadow);
transition:transform .15s ease,box-shadow .15s ease
}

.card:hover{
transform:translateY(-2px);
box-shadow:0 15px 36px rgba(15,23,42,.1)
}

.card a{
color:inherit;
text-decoration:none
}

.thumb{
aspect-ratio:16/9;
background:linear-gradient(135deg,#dbeafe,#eef2ff);
position:relative;
overflow:hidden
}

.thumb img{
width:100%;
height:100%;
object-fit:cover;
display:block
}

.thumb>span{
position:absolute;
inset:10px auto auto 10px;
width:34px;
height:34px;
border-radius:10px;
display:grid;
place-items:center;
background:rgba(255,255,255,.9);
color:#111827
}

.card-body{
padding:15px
}

.meta{
display:flex;
gap:8px;
align-items:center;
color:var(--muted);
font-size:11px;
margin-bottom:9px
}

.meta b{
padding:4px 7px;
border-radius:7px;
background:#eff6ff;
color:var(--accent)
}

.meta span{
overflow:hidden;
text-overflow:ellipsis;
white-space:nowrap
}

.meta time{
margin-inline-start:auto;
white-space:nowrap
}

.card h2{
font-size:18px;
line-height:1.35;
margin:0 0 8px
}

.card p{
color:var(--muted);
font-size:13px;
line-height:1.65;
margin:0
}

.hero{
position:sticky;
top:145px
}

.hero .thumb{
aspect-ratio:16/10
}

.hero h2{
font-size:27px
}

.tone-sports .thumb{
background:linear-gradient(135deg,#ffe4e6,#fff1f2)
}

.tone-economy .thumb{
background:linear-gradient(135deg,#d1fae5,#ecfdf5)
}

.tone-politics .thumb{
background:linear-gradient(135deg,#ede9fe,#f5f3ff)
}

.tone-tech .thumb{
background:linear-gradient(135deg,#dbeafe,#eff6ff)
}

.tone-arts .thumb{
background:linear-gradient(135deg,#fce7f3,#fdf2f8)
}

.tone-health .thumb{
background:linear-gradient(135deg,#fee2e2,#fff1f2)
}

.tone-travel .thumb{
background:linear-gradient(135deg,#cffafe,#ecfeff)
}

.tone-world .thumb{
background:linear-gradient(135deg,#e2e8f0,#f8fafc)
}

.article-page{
max-width:940px;
margin:auto;
padding:48px 5% 70px
}

.article-kicker{
color:var(--accent);
font-weight:800;
margin-bottom:14px
}

.article-page>h1{
font-size:48px;
line-height:1.15;
margin:0 0 10px
}

.article-source{
color:var(--muted);
margin-bottom:24px
}

.article-image{
margin:0 0 30px
}

.article-image img{
width:100%;
max-height:560px;
object-fit:cover;
border-radius:20px;
display:block
}

.article-image figcaption{
font-size:12px;
color:var(--muted);
padding-top:7px
}

.article-body{
font-size:19px;
line-height:1.95
}

.article-body h2{
font-size:26px;
margin-top:32px
}

.article-body p{
margin:0 0 18px
}

.article-note{
margin-top:35px;
border-top:1px solid var(--line);
padding-top:15px;
color:var(--muted);
font-size:12px
}

.search-results{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:16px
}

.empty{
padding:60px 20px;
text-align:center;
background:var(--surface);
border:1px dashed var(--line);
border-radius:18px;
color:var(--muted)
}

footer{
text-align:center;
padding:28px;
color:var(--muted);
font-size:12px;
border-top:1px solid var(--line)
}

body.dark{
--bg:#0b0f15;
--surface:#121821;
--text:#f3f4f6;
--muted:#9ca3af;
--line:#263241;
--accent:#60a5fa
}

body.dark .thumb>span{
background:rgba(18,24,33,.88);
color:white
}

body.dark .brand-mark{
background:linear-gradient(135deg,#e5e7eb,#2563eb);
color:#0b0f15
}

@media(max-width:1050px){

.top{
grid-template-columns:auto 1fr auto
}

.news-grid{
grid-template-columns:1fr
}

.hero{
position:relative;
top:auto
}

.search-results{
grid-template-columns:1fr 1fr
}

}

@media(max-width:700px){

.top{
height:auto;
grid-template-columns:1fr auto;
gap:10px;
padding:10px 14px
}

.brand{
font-size:20px
}

.brand-mark{
width:34px;
height:34px
}

.search{
grid-column:1/-1;
grid-row:2
}

.top-actions{
grid-column:2;
grid-row:1
}

.top-actions a{
font-size:12px
}

.top-actions button{
padding:8px
}

.nav{
padding:9px 12px
}

.nav a{
padding:8px 10px;
background:var(--bg)
}

.page{
padding:20px 12px 45px
}

.page-title h1{
font-size:31px
}

.dashboard{
grid-template-columns:1fr
}

.market-grid{
grid-template-columns:1fr 1fr
}

.feed{
grid-template-columns:1fr
}

.card .thumb{
aspect-ratio:1.55
}

.hero .thumb{
aspect-ratio:1.5
}

.hero h2{
font-size:23px
}

.card h2{
font-size:17px
}

.card p{
font-size:12px
}

.meta{
font-size:10px
}

.quote{
display:block;
padding:15px
}

.quote span{
display:block;
margin-top:7px;
font-size:14px
}

.search-results{
grid-template-columns:1fr
}

.article-page{
padding:28px 14px 50px
}

.article-page>h1{
font-size:32px
}

.article-body{
font-size:17px;
line-height:1.85
}

.article-image img{
border-radius:14px;
max-height:420px
}

}
`;

const CLIENT = (() => {
  const quotes = JSON.stringify(QUOTES);

  return [
    "(function(){",
    'var k="np-theme",root=document.body;',
    'if(localStorage.getItem(k)==="dark")root.classList.add("dark");',
    'window.toggleTheme=function(){root.classList.toggle("dark");localStorage.setItem(k,root.classList.contains("dark")?"dark":"light")};',

    'var q=document.querySelector("#quote span");',

    "if(q){",
    "var a=",
    quotes,
    ";",
    "var i=Math.floor(Date.now()/30000)%a.length;",
    'var draw=function(){q.textContent=a[i][1];i=(i+1)%a.length};',
    "draw();",
    "setInterval(draw,30000)",
    "}",

    'window.loadWeather=async function(city){',
    "try{",
    'var lang=document.documentElement.lang;',
    'var r=await fetch("/api/weather?city="+encodeURIComponent(city)+"&lang="+lang);',
    "var x=await r.json(),b=document.querySelector('#weather-main');",
    'if(b&&x.temperature_2m!=null)b.innerHTML="<span>☀︎</span><b>"+Math.round(x.temperature_2m)+"°</b><small>"+(x[lang==="ar"?"ar":"en"]||"")+" · "+(x.relative_humidity_2m??"—")+"%</small>";',
    "}catch(e){}",
    "};",

    'fetch("/api/markets")',
    ".then(function(r){return r.json()})",
    ".then(function(m){",
    'var g=document.querySelector("#market-grid");',
    "if(!g)return;",
    'g.innerHTML="<div><small>Gold XAU/USD</small><b>"+(m.gold?"$"+m.gold.toFixed(2):"—")+"</b></div><div><small>USD / EGP</small><b>"+(m.fx&&m.fx.EGP?m.fx.EGP.toFixed(2):"—")+"</b></div><div><small>EUR / USD</small><b>"+(m.fx&&m.fx.EUR?m.fx.EUR.toFixed(4):"—")+"</b></div><div><small>GBP / USD</small><b>"+(m.fx&&m.fx.GBP?m.fx.GBP.toFixed(4):"—")+"</b></div>";',
    "})",
    ".catch(function(){});",

    "window.loadWeather('cairo');",

    "})();"
  ].join("");
})();

async function imageEndpoint(env, id, request) {
  let article = await getArticle(env, id);

  const requestUrl = new URL(request.url);

  if (!article) {
    const title =
      requestUrl.searchParams.get("title") || "";

    const link =
      requestUrl.searchParams.get("url") || "";

    if (title || link) {
      article = {
        id,
        title,
        link,
        description: "",
        source: "",
        time: Date.now(),
        category: classify(title),
        originalImage: "",
        image: ""
      };
    }
  }

  if (!article) {
    return new Response("", { status: 404 });
  }

  if (env.NOWPULSE_KV) {
    try {
      const cached =
        await env.NOWPULSE_KV.get(`img:${id}`);

      if (cached) {
        return Response.redirect(cached, 302);
      }
    } catch {}
  }

  const image = await resolveImage(
    env,
    article
  );

  if (image) {
    await storeImage(env, id, image);

    return Response.redirect(image, 302);
  }

  return new Response("", {
    status: 404
  });
}

async function sitemap(env) {
  const feed = await getFeed(env);

  const urls = [
    `${SITE}/`,
    `${SITE}/search`,
    `${SITE}/about`,
    `${SITE}/privacy`,
    `${SITE}/terms`,
    `${SITE}/contact`
  ];

  for (const article of feed) {
    urls.push(
      `${SITE}/article/${article.id}?lang=ar`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    url => `<url><loc>${esc(url)}</loc></url>`
  )
  .join("")}
</urlset>`;
}

function staticPage(lang, type) {
  const ar = lang === "ar";

  const texts = {
    about: ar
      ? [
          "عن NowPulse",
          "NowPulse منصة معلومات وأخبار تجمع الأخبار الحديثة من مصادر متعددة، وتعيد تنظيمها وصياغة المقالات داخل المنصة مع الحفاظ على التحقق من الحقائق."
        ]
      : [
          "About NowPulse",
          "NowPulse is a news and information platform that collects recent stories from multiple sources and presents readable original articles inside the platform."
        ],

    privacy: ar
      ? [
          "الخصوصية",
          "نحترم خصوصية الزوار. قد نستخدم ملفات التخزين المحلية والتقنيات اللازمة لتشغيل الموقع وتحسين الأداء. لا نطلب بيانات شخصية لمجرد قراءة الأخبار."
        ]
      : [
          "Privacy",
          "We respect visitor privacy. Local storage and essential technologies may be used to operate and improve the site. Reading news does not require personal information."
        ],

    terms: ar
      ? [
          "الشروط",
          "المحتوى المعلوماتي في NowPulse مقدم لأغراض المعرفة والإطلاع. يجب الرجوع إلى المصادر الرسمية عند اتخاذ قرارات مهمة."
        ]
      : [
          "Terms",
          "NowPulse provides information for reading and general knowledge. Consult official sources for important decisions."
        ],

    contact: ar
      ? [
          "اتصل بنا",
          "للتواصل مع NowPulse استخدم قنوات المشروع المرتبطة بالموقع."
        ]
      : [
          "Contact",
          "For contact information, use the project channels associated with NowPulse."
        ]
  };

  const [heading, paragraph] = texts[type];

  return shell(
    lang,
    heading,
    paragraph,
    `
<main class="article-page">

<h1>
${esc(heading)}
</h1>

<div class="article-body">

<p>
${esc(paragraph)}
</p>

</div>

</main>`
  );
}

async function diagnostics(env) {
  const result = {
    version: VERSION,
    ai: Boolean(env.AI),
    kv: Boolean(env.NOWPULSE_KV),
    aiModel:
      env.NOWPULSE_AI_MODEL || AI_MODEL,
    autoRepair:
      env.NOWPULSE_AUTO_REPAIR === "enabled",
    time: new Date().toISOString()
  };

  if (env.AI) {
    const response = await ai(
      env,
      [
        {
          role: "system",
          content: "Reply with only OK."
        },
        {
          role: "user",
          content: "Health check"
        }
      ],
      20
    );

    result.aiOk = Boolean(response);
  }

  return result;
}

async function autonomousRepair(
  env,
  ctx,
  errorText
) {
  if (
    env.NOWPULSE_AUTO_REPAIR !== "enabled" ||
    !env.GITHUB_TOKEN
  ) {
    return {
      ok: false,
      reason: "disabled"
    };
  }

  try {
    const repo =
      env.NOWPULSE_GITHUB_REPO ||
      "Taha8880/NowPulse";

    const branch =
      env.NOWPULSE_GITHUB_BRANCH ||
      "main";

    const source = await github(
      env,
      `/repos/${repo}/contents/src/worker.js?ref=${encodeURIComponent(
        branch
      )}`
    );

    const current = decodeBase64(
      source.content
    );

    const replacement = await ai(
      env,
      [
        {
          role: "system",
          content:
            "You are the autonomous maintenance engineer for NowPulse. " +
            "Diagnose the supplied Worker error. " +
            "Return ONLY a complete replacement src/worker.js. " +
            "Preserve working functionality. " +
            "Never add secrets. " +
            "Never use browser globals in server code. " +
            "Use the active Cloudflare Workers AI fast model. " +
            "Keep the code syntactically valid JavaScript."
        },
        {
          role: "user",
          content:
            `ERROR:\n${errorText}\n\nCURRENT SOURCE:\n${current}`
        }
      ],
      3500
    );

    const candidate =
      extractCode(replacement);

    if (
      !candidate ||
      candidate.length < 5000
    ) {
      return {
        ok: false,
        reason:
          "AI did not return a safe replacement"
      };
    }

    const branchName =
      `ai-repair-${Date.now()}`;

    const ref = await github(
      env,
      `/repos/${repo}/git/ref/heads/${branch}`
    );

    await github(
      env,
      `/repos/${repo}/git/refs`,
      {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: ref.object.sha
        })
      }
    );

    await github(
      env,
      `/repos/${repo}/contents/src/worker.js`,
      {
        method: "PUT",
        body: JSON.stringify({
          message:
            "chore(ai): repair NowPulse automatically",
          content: encodeBase64(candidate),
          sha: source.sha,
          branch: branchName
        })
      }
    );

    const workflow =
      env.NOWPULSE_DEPLOY_WORKFLOW ||
      "deploy.yml";

    await github(
      env,
      `/repos/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: "POST",
        body: JSON.stringify({
          ref: branchName
        })
      }
    );

    return {
      ok: true,
      branch: branchName
    };
  } catch (error) {
    return {
      ok: false,
      reason: error.message
    };
  }
}

function decodeBase64(value) {
  return decodeURIComponent(
    escape(
      atob(
        String(value).replace(/\n/g, "")
      )
    )
  );
}

function encodeBase64(value) {
  return btoa(
    unescape(
      encodeURIComponent(value)
    )
  );
}

function extractCode(value) {
  return String(value || "")
    .replace(/^```(?:javascript|js)?/i, "")
    .replace(/```$/g, "")
    .trim();
}

async function github(
  env,
  path,
  options = {}
) {
  const response = await fetch(
    "https://api.github.com" + path,
    {
      ...options,
      headers: {
        Authorization:
          `Bearer ${env.GITHUB_TOKEN}`,
        Accept:
          "application/vnd.github+json",
        "X-GitHub-Api-Version":
          "2022-11-28",
        "User-Agent":
          "NowPulse-AutoRepair",
        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = {
      raw: text
    };
  }

  if (!response.ok) {
    throw new Error(
      `GitHub ${response.status}: ${text.slice(
        0,
        500
      )}`
    );
  }

  return data;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const lang =
      url.searchParams.get("lang") === "en"
        ? "en"
        : "ar";

    try {
      if (url.pathname === "/health") {
        return json(
          await diagnostics(env)
        );
      }

      if (url.pathname === "/robots.txt") {
        return new Response(
          `User-agent: *
Allow: /
Disallow: /api/
Sitemap: ${SITE}/sitemap.xml`,
          {
            headers: {
              "content-type":
                "text/plain; charset=utf-8"
            }
          }
        );
      }

      if (url.pathname === "/sitemap.xml") {
        return new Response(
          await sitemap(env),
          {
            headers: {
              "content-type":
                "application/xml; charset=utf-8",
              "cache-control":
                "public,max-age=900"
            }
          }
        );
      }

      if (url.pathname === "/rss.xml") {
        const feed =
          await getFeed(env);

        return new Response(
          `<?xml version="1.0"?>
<rss version="2.0">
<channel>
<title>NowPulse</title>
<link>${SITE}</link>
<description>NowPulse news</description>
${feed
  .slice(0, 30)
  .map(
    article => `
<item>
<title>${esc(article.title)}</title>
<link>${esc(
      `${SITE}/article/${article.id}?lang=ar`
    )}</link>
<pubDate>${new Date(
      article.time
    ).toUTCString()}</pubDate>
<description>${esc(
      article.description
    )}</description>
</item>`
  )
  .join("")}
</channel>
</rss>`,
          {
            headers: {
              "content-type":
                "application/rss+xml; charset=utf-8"
            }
          }
        );
      }

      if (url.pathname === "/api/news") {
        return json(
          (await getFeed(env)).slice(0, 40)
        );
      }

      if (url.pathname === "/api/search") {
        return json(
          await searchNews(
            env,
            url.searchParams.get("q") || ""
          )
        );
      }

      if (url.pathname === "/api/image") {
        return imageEndpoint(
          env,
          url.searchParams.get("id") || "",
          request
        );
      }

      if (url.pathname === "/api/weather") {
        return json(
          await weather(
            url.searchParams.get("city") ||
              "cairo"
          )
        );
      }

      if (url.pathname === "/api/markets") {
        return json(
          await markets()
        );
      }

      if (
        url.pathname ===
        "/api/ai/diagnose"
      ) {
        return json(
          await diagnostics(env)
        );
      }

      if (
        url.pathname ===
          "/api/ai/repair" &&
        request.method === "POST"
      ) {
        const body =
          await request
            .json()
            .catch(() => ({}));

        const result =
          await autonomousRepair(
            env,
            ctx,
            body.error ||
              "manual repair request"
          );

        return json(
          result,
          result.ok ? 200 : 503
        );
      }

      if (
        url.pathname.startsWith(
          "/article/"
        )
      ) {
        return articlePage(
          env,
          url.pathname.split("/")[2],
          lang
        );
      }

      if (url.pathname === "/search") {
        return searchPage(
          env,
          url.searchParams.get("q") || "",
          lang
        );
      }

      if (
        [
          "about",
          "privacy",
          "terms",
          "contact"
        ].includes(
          url.pathname.slice(1)
        )
      ) {
        return staticPage(
          lang,
          url.pathname.slice(1)
        );
      }

      if (url.pathname === "/markets") {
        return shell(
          lang,
          CATEGORIES.markets[lang],
          "",
          `
<main class="page">

<div class="page-title">
<h1>
${CATEGORIES.markets[lang]}
</h1>
</div>

<div class="dashboard">

<div
class="info-panel"
id="market-full">

Loading…

</div>

</div>

</main>`
        );
      }

      return home(
        env,
        lang,
        url.searchParams.get(
          "category"
        ) || "latest"
      );
    } catch (error) {
      console.error(
        "NowPulse error",
        error
      );

      ctx.waitUntil(
        autonomousRepair(
          env,
          ctx,
          error.stack ||
            error.message ||
            String(error)
        ).catch(() => {})
      );

      return html(
        `
<main
style="
font-family:system-ui;
max-width:720px;
margin:80px auto;
padding:20px">

<h1>NowPulse</h1>

<p>
حدث خطأ مؤقت وتم تسجيله لمحرك الصيانة.
</p>

<a href="/">
إعادة المحاولة
</a>

</main>`,
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
      ingest(env).catch(error =>
        console.error(
          "cron ingest",
          error
        )
      )
    );
  }
};
