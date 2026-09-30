const VERSION = "5.0.0";
const SITE = "https://nowpulse.tavengers16.workers.dev";
const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const MAX_LATEST = 120;
const ARCHIVE_DAYS = 14;
const FRESH_HOURS = 72;
const FETCH_TIMEOUT = 7000;

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
  trends: { ar: "ترند", en: "Trends" }
};

const FEEDS = [
  [
    "egypt",
    "https://news.google.com/rss/search?q=Egypt+OR+Cairo+when:3d&hl=ar&gl=EG&ceid=EG:ar"
  ],
  [
    "world",
    "https://news.google.com/rss/search?q=world+news+when:3d&hl=en&gl=US&ceid=US:en"
  ],
  [
    "politics",
    "https://news.google.com/rss/search?q=politics+when:3d&hl=en&gl=US&ceid=US:en"
  ],
  [
    "sports",
    "https://news.google.com/rss/search?q=sports+when:3d&hl=en&gl=US&ceid=US:en"
  ],
  [
    "economy",
    "https://news.google.com/rss/search?q=economy+OR+business+when:3d&hl=en&gl=US&ceid=US:en"
  ],
  [
    "tech",
    "https://news.google.com/rss/search?q=technology+when:3d&hl=en&gl=US&ceid=US:en"
  ],
  [
    "arts",
    "https://news.google.com/rss/search?q=entertainment+OR+arts+when:3d&hl=en&gl=US&ceid=US:en"
  ],
  [
    "health",
    "https://news.google.com/rss/search?q=health+when:3d&hl=en&gl=US&ceid=US:en"
  ],
  [
    "travel",
    "https://news.google.com/rss/search?q=travel+when:3d&hl=en&gl=US&ceid=US:en"
  ]
];

const CITY_COORDS = {
  cairo: [30.0444, 31.2357],
  alexandria: [31.2001, 29.9187],
  giza: [30.0131, 31.2089],
  hurghada: [27.2579, 33.8116],
  luxor: [25.6872, 32.6396],
  aswan: [24.0889, 32.8998],
  qena: [26.1551, 32.716],
  sohag: [26.5591, 31.6959],
  assiut: [27.1801, 31.1837],
  mansoura: [31.0409, 31.3785],
  tanta: [30.7865, 31.0004],
  ismailia: [30.5965, 32.2715],
  suez: [29.9668, 32.5498],
  portsaid: [31.2653, 32.3019],
  fayoum: [29.3084, 30.8428]
};

const QUOTES = [
  {
    ar: "المعلومة الدقيقة تبدأ من مصدر موثوق.",
    en: "Accurate information starts with a trusted source."
  },
  {
    ar: "تابع الخبر، وافهم الصورة كاملة.",
    en: "Follow the story. Understand the full picture."
  },
  {
    ar: "الأخبار تتغير، والمعلومة تحتاج إلى تحقق.",
    en: "News changes. Information needs verification."
  },
  {
    ar: "كل خبر جديد يضيف جزءًا من الصورة.",
    en: "Every new story adds another piece to the picture."
  }
];

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanText(value) {
  let s = String(value ?? "");

  for (let i = 0; i < 3; i++) {
    s = s.replace(
      /&(#x[0-9a-f]+|#\d+|nbsp|amp|quot|apos|lt|gt);?/gi,
      (match, entity) => {
        const k = entity.toLowerCase();

        if (k === "nbsp") return " ";
        if (k === "amp") return "&";
        if (k === "quot") return '"';
        if (k === "apos") return "'";
        if (k === "lt") return "<";
        if (k === "gt") return ">";

        const number = k.startsWith("#x")
          ? parseInt(k.slice(2), 16)
          : parseInt(k.slice(1), 10);

        if (
          Number.isFinite(number) &&
          number >= 0 &&
          number <= 0x10ffff
        ) {
          return String.fromCodePoint(number);
        }

        return " ";
      }
    );
  }

  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/\\#{1,6}\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value) {
  return cleanText(value);
}

function isoDate(value) {
  const date = new Date(value || 0);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function timeoutFetch(url, init = {}, milliseconds = FETCH_TIMEOUT) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    try {
      controller.abort("timeout");
    } catch {}
  }, milliseconds);

  return fetch(url, {
    ...init,
    signal: controller.signal
  }).finally(() => clearTimeout(timer));
}

function between(xml, tag) {
  const expression = new RegExp(
    `<${tag}[^>]*>([\\s\\S]*?)</${tag}>`,
    "i"
  );

  const match = String(xml).match(expression);

  return match ? match[1] : "";
}

function xmlItems(xml) {
  const result = [];

  const blocks =
    String(xml).match(/<item\b[\s\S]*?<\/item>/gi) || [];

  for (const block of blocks) {
    const title = stripHtml(between(block, "title"));
    const link = stripHtml(between(block, "link"));

    const pubDate = stripHtml(
      between(block, "pubDate") ||
        between(block, "dc:date")
    );

    const description = stripHtml(
      between(block, "description")
    );

    const source = stripHtml(
      between(block, "source")
    );

    const media =
      block.match(
        /<(?:media:content|media:thumbnail)[^>]+url=["']([^"']+)["']/i
      );

    if (!title || !link) {
      continue;
    }

    result.push({
      title,
      link,
      description,
      source,
      date: isoDate(pubDate),
      originalImage: media ? media[1] : ""
    });
  }

  return result;
}

function classify(title, category) {
  if (category && CATEGORIES[category]) {
    return category;
  }

  const value = String(title).toLowerCase();

  if (
    /football|soccer|match|goal|premier|champions|sport|محمد صلاح|أهلي|زمالك/.test(
      value
    )
  ) {
    return "sports";
  }

  if (
    /stock|market|gold|oil|economy|business|bank|currency|اقتصاد|ذهب|دولار/.test(
      value
    )
  ) {
    return "economy";
  }

  if (
    /technology|tech|ai|apple|google|microsoft|iphone|تكنولوجيا|ذكاء اصطناعي/.test(
      value
    )
  ) {
    return "tech";
  }

  if (/health|medical|hospital|doctor|صحة|طب/.test(value)) {
    return "health";
  }

  if (
    /movie|film|music|actor|actress|entertainment|فن|فيلم|مسلسل/.test(
      value
    )
  ) {
    return "arts";
  }

  if (
    /travel|tourism|flight|airport|سياحة|سفر|طيران/.test(
      value
    )
  ) {
    return "travel";
  }

  if (
    /president|government|election|minister|politic|رئيس|حكومة|انتخابات|سياسة/.test(
      value
    )
  ) {
    return "politics";
  }

  return "world";
}

function makeId(article) {
  const base =
    `${article.category}-${article.title}-${article.link}`
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);

  return `${base}-${new Date(article.date).getTime()}`;
}

function normalizeArticle(raw, category) {
  const article = {
    ...raw
  };

  article.title = cleanText(article.title);
  article.description = cleanText(article.description);
  article.source = cleanText(article.source) || "News source";
  article.date = isoDate(article.date);
  article.category = classify(article.title, category);

  article.id =
    article.id ||
    makeId(article);

  article.originalImage =
    /^https?:\/\//i.test(article.originalImage || "")
      ? article.originalImage
      : "";

  return article;
}

async function fetchFeed(category, url) {
  try {
    const response = await timeoutFetch(
      url,
      {
        headers: {
          accept:
            "application/rss+xml, application/xml, text/xml"
        }
      }
    );

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();

    const cutoff =
      Date.now() -
      FRESH_HOURS * 60 * 60 * 1000;

    return xmlItems(xml)
      .filter(
        item =>
          new Date(item.date).getTime() >= cutoff
      )
      .map(item =>
        normalizeArticle(item, category)
      );
  } catch {
    return [];
  }
}

async function loadFeed(env, force = false) {
  let cached = null;

  if (env.NOWPULSE_KV) {
    cached = await env.NOWPULSE_KV
      .get("feed:latest", "json")
      .catch(() => null);
  }

  if (
    !force &&
    Array.isArray(cached) &&
    cached.length
  ) {
    return cached;
  }

  const groups = await Promise.all(
    FEEDS.map(([category, url]) =>
      fetchFeed(category, url)
    )
  );

  const map = new Map();

  for (const group of groups) {
    for (const article of group) {
      const key =
        article.link ||
        article.title;

      if (!map.has(key)) {
        map.set(key, article);
      }
    }
  }

  const items = [...map.values()]
    .filter(
      article =>
        Date.now() -
          new Date(article.date).getTime() <=
        FRESH_HOURS * 60 * 60 * 1000
    )
    .sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    )
    .slice(0, MAX_LATEST);

  if (
    env.NOWPULSE_KV &&
    items.length
  ) {
    await env.NOWPULSE_KV
      .put(
        "feed:latest",
        JSON.stringify(items),
        {
          expirationTtl: 3600
        }
      )
      .catch(() => {});
  }

  return items;
}

async function archiveFeed(env, items) {
  if (
    !env.NOWPULSE_KV ||
    !items.length
  ) {
    return;
  }

  const old =
    await env.NOWPULSE_KV
      .get("feed:archive", "json")
      .catch(() => []);

  const merged = [
    ...items,
    ...(Array.isArray(old) ? old : [])
  ];

  const cutoff =
    Date.now() -
    ARCHIVE_DAYS * 24 * 60 * 60 * 1000;

  const map = new Map();

  for (const article of merged) {
    if (
      new Date(article.date).getTime() <
      cutoff
    ) {
      continue;
    }

    const key =
      article.link ||
      article.title;

    if (!map.has(key)) {
      map.set(key, article);
    }
  }

  await env.NOWPULSE_KV
    .put(
      "feed:archive",
      JSON.stringify(
        [...map.values()].slice(0, 1000)
      ),
      {
        expirationTtl:
          ARCHIVE_DAYS * 24 * 60 * 60
      }
    )
    .catch(() => {});
}

async function extractImage(article) {
  if (
    article.originalImage &&
    /^https?:\/\//i.test(
      article.originalImage
    )
  ) {
    return article.originalImage;
  }

  try {
    const response = await timeoutFetch(
      article.link,
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 NowPulseBot/1.0"
        }
      },
      6000
    );

    if (!response.ok) {
      return "";
    }

    const html =
      await response.text();

    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    ];

    for (const pattern of patterns) {
      const match =
        html.match(pattern);

      if (
        match &&
        /^https?:\/\//i.test(match[1])
      ) {
        return match[1];
      }
    }

    const wikiUrl =
      "https://commons.wikimedia.org/w/api.php" +
      "?action=query" +
      "&generator=search" +
      "&gsrnamespace=6" +
      "&prop=imageinfo" +
      "&iiprop=url" +
      "&iiurlwidth=900" +
      "&format=json" +
      "&origin=*" +
      `&gsrsearch=${encodeURIComponent(article.title)}`;

    const wiki =
      await timeoutFetch(
        wikiUrl,
        {},
        5000
      );

    if (wiki.ok) {
      const data =
        await wiki.json();

      const pages =
        Object.values(
          data?.query?.pages || {}
        );

      const image =
        pages[0]?.imageinfo?.[0]
          ?.thumburl ||
        pages[0]?.imageinfo?.[0]?.url;

      if (
        /^https?:\/\//i.test(
          image || ""
        )
      ) {
        return image;
      }
    }
  } catch {}

  return "";
}

async function enrichImages(env, items) {
  const result =
    items.map(article => ({
      ...article
    }));

  const batch =
    result.slice(0, 30);

  await Promise.all(
    batch.map(async article => {
      const key =
        `img:${article.id}`;

      let cached = null;

      if (env.NOWPULSE_KV) {
        cached =
          await env.NOWPULSE_KV
            .get(key)
            .catch(() => null);
      }

      if (cached) {
        article.image = cached;
        return;
      }

      const image =
        await extractImage(article);

      if (image) {
        article.image = image;

        if (env.NOWPULSE_KV) {
          await env.NOWPULSE_KV
            .put(
              key,
              image,
              {
                expirationTtl:
                  7 * 24 * 60 * 60
              }
            )
            .catch(() => {});
        }
      }
    })
  );

  return result;
}

function aiText(result) {
  return (
    result?.response ||
    result?.result?.response ||
    result?.output_text ||
    ""
  );
}

function fallbackArticle(article) {
  const description =
    article.description ||
    article.title;

  return [
    article.title,
    "",
    description,
    "",
    "تستند هذه المادة إلى المعلومات المتاحة في المصدر المشار إليه. وقد تتغير التفاصيل مع ورود تحديثات جديدة من مصادر موثوقة.",
    "",
    "سيتم تحديث القصة في NowPulse عند توفر معلومات إضافية مؤكدة."
  ].join("\n");
}

async function writeArticle(
  env,
  article,
  related
) {
  if (!env.AI) {
    return fallbackArticle(article);
  }

  const sources = [
    article,
    ...related
      .filter(
        item =>
          item.link !== article.link
      )
      .slice(0, 5)
  ]
    .map(
      (item, index) =>
        `SOURCE ${index + 1}
Title: ${item.title}
Source: ${item.source}
Date: ${item.date}
Description: ${item.description}`
    )
    .join("\n\n");

  try {
    const result =
      await env.AI.run(
        AI_MODEL,
        {
          messages: [
            {
              role: "system",
              content:
                "You write original neutral news articles for NowPulse. " +
                "Use only supplied facts. Never invent names, dates, numbers, quotes or events. " +
                "If sources conflict, clearly say reports differ. " +
                "Never copy source wording. Write a complete readable article in Arabic with 5 to 8 paragraphs. " +
                "Return plain text only."
            },
            {
              role: "user",
              content:
                `Create a complete original Arabic news article from these sources:\n\n${sources}`
            }
          ],
          max_tokens: 1800
        }
      );

    const output =
      aiText(result).trim();

    return output ||
      fallbackArticle(article);
  } catch {
    return fallbackArticle(article);
  }
}

async function searchNews(
  env,
  query
) {
  const q =
    cleanText(query).slice(0, 120);

  if (!q) {
    return [];
  }

  const key =
    `search:${q.toLowerCase()}`;

  if (env.NOWPULSE_KV) {
    const cached =
      await env.NOWPULSE_KV
        .get(key, "json")
        .catch(() => null);

    if (Array.isArray(cached)) {
      return cached;
    }
  }

  const urls = [
    "https://news.google.com/rss/search" +
      `?q=${encodeURIComponent(`${q} when:7d`)}` +
      "&hl=ar&gl=EG&ceid=EG:ar",

    "https://news.google.com/rss/search" +
      `?q=${encodeURIComponent(`${q} when:7d`)}` +
      "&hl=en&gl=US&ceid=US:en"
  ];

  const groups =
    await Promise.all(
      urls.map(async url => {
        try {
          const response =
            await timeoutFetch(
              url
            );

          if (!response.ok) {
            return [];
          }

          const xml =
            await response.text();

          return xmlItems(xml).map(
            item =>
              normalizeArticle(
                item,
                classify(q, "world")
              )
          );
        } catch {
          return [];
        }
      })
    );

  const map = new Map();

  for (const group of groups) {
    for (const article of group) {
      if (!map.has(article.link)) {
        map.set(
          article.link,
          article
        );
      }
    }
  }

  const result =
    [...map.values()]
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      )
      .slice(0, 40);

  if (env.NOWPULSE_KV) {
    await env.NOWPULSE_KV
      .put(
        key,
        JSON.stringify(result),
        {
          expirationTtl: 600
        }
      )
      .catch(() => {});
  }

  return result;
}

async function markets(env) {
  let cached = null;

  if (env.NOWPULSE_KV) {
    cached =
      await env.NOWPULSE_KV
        .get("markets", "json")
        .catch(() => null);
  }

  if (cached) {
    return cached;
  }

  try {
    const response =
      await timeoutFetch(
        "https://api.frankfurter.app/latest?from=USD&to=EGP,EUR,GBP,CHF",
        {},
        5000
      );

    if (!response.ok) {
      throw new Error(
        "Market source unavailable"
      );
    }

    const data =
      await response.json();

    const usdEgp =
      Number(data.rates?.EGP || 0);

    const result = {
      updated:
        new Date().toISOString(),

      usdEgp,

      eurEgp:
        usdEgp &&
        data.rates?.EUR
          ? usdEgp /
            Number(data.rates.EUR)
          : 0,

      gbpEgp:
        usdEgp &&
        data.rates?.GBP
          ? usdEgp /
            Number(data.rates.GBP)
          : 0,

      chfEgp:
        usdEgp &&
        data.rates?.CHF
          ? usdEgp /
            Number(data.rates.CHF)
          : 0
    };

    if (env.NOWPULSE_KV) {
      await env.NOWPULSE_KV
        .put(
          "markets",
          JSON.stringify(result),
          {
            expirationTtl: 900
          }
        )
        .catch(() => {});
    }

    return result;
  } catch {
    return (
      cached || {
        updated: null,
        usdEgp: 0,
        eurEgp: 0,
        gbpEgp: 0,
        chfEgp: 0
      }
    );
  }
}

async function weather(
  env,
  city = "cairo"
) {
  const selected =
    CITY_COORDS[city]
      ? city
      : "cairo";

  const key =
    `weather:${selected}`;

  let cached = null;

  if (env.NOWPULSE_KV) {
    cached =
      await env.NOWPULSE_KV
        .get(key, "json")
        .catch(() => null);
  }

  if (cached) {
    return cached;
  }

  const [
    latitude,
    longitude
  ] = CITY_COORDS[selected];

  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      "&current=temperature_2m,relative_humidity_2m,weather_code" +
      "&timezone=auto";

    const response =
      await timeoutFetch(
        url,
        {},
        5000
      );

    if (!response.ok) {
      throw new Error(
        "Weather source unavailable"
      );
    }

    const data =
      await response.json();

    const result = {
      city: selected,
      temperature:
        data.current?.temperature_2m,
      humidity:
        data.current
          ?.relative_humidity_2m,
      code:
        data.current?.weather_code,
      updated:
        new Date().toISOString()
    };

    if (env.NOWPULSE_KV) {
      await env.NOWPULSE_KV
        .put(
          key,
          JSON.stringify(result),
          {
            expirationTtl: 900
          }
        )
        .catch(() => {});
    }

    return result;
  } catch {
    return (
      cached || {
        city: selected,
        temperature: null,
        humidity: null,
        code: null
      }
    );
  }
}

function ageLabel(
  date,
  lang
) {
  const minutes =
    Math.max(
      0,
      Math.floor(
        (Date.now() -
          new Date(date).getTime()) /
          60000
      )
    );

  if (lang === "en") {
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (minutes < 1440) {
      return `${Math.floor(
        minutes / 60
      )}h ago`;
    }

    return `${Math.floor(
      minutes / 1440
    )}d ago`;
  }

  if (minutes < 60) {
    return `منذ ${minutes} د`;
  }

  if (minutes < 1440) {
    return `منذ ${Math.floor(
      minutes / 60
    )} س`;
  }

  return `منذ ${Math.floor(
    minutes / 1440
  )} يوم`;
}

function icon(category) {
  return {
    sports: "⚽",
    economy: "📈",
    politics: "🏛️",
    tech: "⚡",
    arts: "🎬",
    health: "🩺",
    travel: "✈️",
    egypt: "🇪🇬",
    world: "🌍",
    trends: "🔥",
    latest: "📰"
  }[category] || "📰";
}

function card(
  article,
  lang,
  featured = false
) {
  const title =
    esc(article.title);

  const summary =
    esc(
      article.description ||
        article.title
    );

  const image =
    article.image ||
    `/api/image?id=${encodeURIComponent(
      article.id
    )}`;

  return `
<article class="card ${featured ? "featured" : ""}">
  <a
    class="card-image"
    href="/article/${encodeURIComponent(
      article.id
    )}?lang=${lang}"
  >
    <img
      src="${esc(image)}"
      loading="${featured ? "eager" : "lazy"}"
      decoding="async"
      width="900"
      height="560"
      alt=""
    >
  </a>

  <div class="card-body">
    <div class="meta">
      ${icon(article.category)}
      ${esc(
        CATEGORIES[
          article.category
        ]?.[lang] ||
          CATEGORIES.world[lang]
      )}
      ·
      ${ageLabel(
        article.date,
        lang
      )}
    </div>

    <h2>
      <a href="/article/${encodeURIComponent(
        article.id
      )}?lang=${lang}">
        ${title}
      </a>
    </h2>

    <p>${summary}</p>

    <div class="source">
      ${esc(article.source)}
    </div>
  </div>
</article>`;
}

function layout({
  lang,
  title,
  body,
  active = "latest"
}) {
  const rtl =
    lang === "ar";

  const nav =
    Object.entries(
      CATEGORIES
    )
      .map(
        ([key, value]) => `
<a
  class="nav-${key} ${
          active === key
            ? "active"
            : ""
        }"
  href="/?lang=${lang}&category=${key}"
>
  ${icon(key)}
  ${esc(value[lang])}
</a>`
      )
      .join("");

  return `
<!doctype html>
<html
  lang="${lang}"
  dir="${rtl ? "rtl" : "ltr"}"
>
<head>
<meta charset="utf-8">
<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>
<meta
  name="theme-color"
  content="#101827"
>
<title>${esc(title)} — NowPulse</title>

<meta
  name="description"
  content="${esc(
    lang === "ar"
      ? "NowPulse منصة أخبار ومعلومات محدثة باستمرار."
      : "NowPulse is a continuously updated news and information platform."
  )}"
>

<style>
${CSS}
</style>
</head>

<body>

<header>

<div class="top">

<a
  class="logo"
  href="/?lang=${lang}"
>
  Now<span>Pulse</span>
</a>

<form
  action="/search"
  method="get"
>
  <input
    name="q"
    placeholder="${
      lang === "ar"
        ? "ابحث عن شخص أو موضوع..."
        : "Search a person or topic..."
    }"
    required
  >

  <input
    type="hidden"
    name="lang"
    value="${lang}"
  >

  <button>🔎</button>
</form>

<div class="actions">

<a
  href="?lang=${
    lang === "ar"
      ? "en"
      : "ar"
  }"
>
  ${
    lang === "ar"
      ? "EN"
      : "ع"
  }
</a>

<button
  onclick="toggleTheme()"
  title="theme"
>
  ☀️
</button>

<a href="/">
  ↻
</a>

</div>

</div>

<nav>
${nav}
</nav>

</header>

<main>
${body}
</main>

<footer>
Created by Taha · NowPulse v${VERSION}
</footer>

<script>
${CLIENT}
</script>

</body>
</html>`;
}

function homeBody(
  items,
  lang,
  category,
  marketData,
  weatherData
) {
  const filtered =
    category &&
    category !== "latest"
      ? items.filter(
          article =>
            article.category ===
            category
        )
      : items;

  const list =
    filtered.length
      ? filtered
      : items;

  const featured =
    list[0];

  const rest =
    list.slice(1, 30);

  const quote =
    QUOTES[0][lang];

  const market = `
<section class="panel">
  <h3>
    💹
    ${
      lang === "ar"
        ? "الأسواق"
        : "Markets"
    }
  </h3>

  <div class="market-grid">

    <b>
      USD/EGP
      <br>
      <span>
        ${
          marketData.usdEgp
            ? marketData.usdEgp.toFixed(2)
            : "—"
        }
      </span>
    </b>

    <b>
      EUR/EGP
      <br>
      <span>
        ${
          marketData.eurEgp
            ? marketData.eurEgp.toFixed(2)
            : "—"
        }
      </span>
    </b>

    <b>
      GBP/EGP
      <br>
      <span>
        ${
          marketData.gbpEgp
            ? marketData.gbpEgp.toFixed(2)
            : "—"
        }
      </span>
    </b>

  </div>
</section>`;

  const weatherBox = `
<section class="panel">

<h3>
🌤️
${
  lang === "ar"
    ? "الطقس"
    : "Weather"
}
</h3>

<div id="weatherBox">

${
  weatherData.temperature ==
  null
    ? "—"
    : `${weatherData.temperature}°C · ${weatherData.humidity}%`
}

</div>

</section>`;

  return `
<section class="hero">

<div>
  <div class="eyebrow">
    ${icon(category || "latest")}
  </div>

  <h1>
    ${esc(
      category
        ? CATEGORIES[
            category
          ]?.[lang] ||
            CATEGORIES.latest[
              lang
            ]
        : CATEGORIES.latest[
            lang
          ]
    )}
  </h1>
</div>

<div
  class="quote"
  id="quote"
>
${esc(quote)}
</div>

</section>

<div class="dashboard">
${market}
${weatherBox}
</div>

${
  featured
    ? `
<section class="news-grid">

<div>
${card(
  featured,
  lang,
  true
)}
</div>

<div class="list">
${rest
  .map(article =>
    card(
      article,
      lang
    )
  )
  .join("")}
</div>

</section>`
    : `
<div class="empty">
${
  lang === "ar"
    ? "لا توجد أخبار حديثة حاليًا."
    : "No recent stories are available."
}
</div>`
}`;
}

function articleBody(
  article,
  body,
  lang
) {
  const paragraphs =
    body
      .split(/\n+/)
      .filter(Boolean)
      .map(
        paragraph =>
          `<p>${esc(
            paragraph
          )}</p>`
      )
      .join("");

  const image =
    article.image ||
    `/api/image?id=${encodeURIComponent(
      article.id
    )}`;

  return `
<article class="article">

<div class="meta">
${icon(article.category)}
${esc(
  CATEGORIES[
    article.category
  ]?.[lang] ||
    "News"
)}
·
${ageLabel(
  article.date,
  lang
)}
</div>

<h1>
${esc(article.title)}
</h1>

<div class="source">
${esc(article.source)}
</div>

<img
  class="article-image"
  src="${esc(image)}"
  loading="eager"
  width="1200"
  height="750"
  alt=""
>

<div class="article-text">
${paragraphs}
</div>

<div class="article-updated">
${
  lang === "ar"
    ? "آخر تحديث للمادة"
    : "Article update"
}
:
${esc(
  new Date().toLocaleString(
    lang === "ar"
      ? "ar-EG"
      : "en-US"
  )
)}
</div>

</article>`;
}

const CSS = `
:root{
  --bg:#f5f7fb;
  --panel:#ffffff;
  --text:#111827;
  --muted:#667085;
  --line:#e6eaf0;
  --accent:#0b63f6;
  --header:#101827;
}

*{
  box-sizing:border-box;
}

body{
  margin:0;
  background:var(--bg);
  color:var(--text);
  font-family:
    system-ui,
    -apple-system,
    "Segoe UI",
    Arial,
    sans-serif;
}

a{
  color:inherit;
  text-decoration:none;
}

header{
  position:sticky;
  top:0;
  z-index:10;
  background:rgba(16,24,39,.97);
  color:#fff;
  box-shadow:
    0 2px 16px #0002;
}

.top{
  max-width:1450px;
  margin:auto;
  display:flex;
  gap:18px;
  align-items:center;
  padding:13px 20px;
}

.logo{
  font-size:27px;
  font-weight:900;
  letter-spacing:-1px;
  white-space:nowrap;
}

.logo span{
  color:#45a3ff;
}

form{
  display:flex;
  flex:1;
  max-width:700px;
  margin:auto;
}

form input{
  min-width:0;
  flex:1;
  border:0;
  border-radius:
    12px 0 0 12px;
  padding:12px 15px;
  font-size:15px;
  outline:0;
}

form button{
  border:0;
  padding:0 17px;
  border-radius:
    0 12px 12px 0;
  background:#1677ff;
  color:#fff;
  font-size:18px;
}

.actions{
  display:flex;
  align-items:center;
  gap:8px;
}

.actions a,
.actions button{
  background:#ffffff18;
  border:1px solid #ffffff22;
  color:#fff;
  padding:8px 10px;
  border-radius:9px;
}

.actions button{
  cursor:pointer;
}

nav{
  max-width:1450px;
  margin:auto;
  display:flex;
  gap:5px;
  overflow:auto;
  padding:
    0 20px 10px;
  scrollbar-width:none;
}

nav a{
  white-space:nowrap;
  padding:8px 11px;
  border-radius:9px;
  color:#cbd5e1;
  font-size:14px;
}

nav a.active,
nav a:hover{
  background:#ffffff15;
  color:#fff;
}

main{
  max-width:1450px;
  margin:auto;
  padding:24px 20px;
}

.hero{
  display:flex;
  justify-content:space-between;
  gap:20px;
  align-items:end;
  margin-bottom:20px;
}

.hero h1{
  font-size:42px;
  margin:5px 0;
}

.eyebrow{
  font-size:30px;
}

.quote{
  max-width:430px;
  background:var(--panel);
  border:1px solid var(--line);
  border-radius:18px;
  padding:18px;
  font-weight:700;
  color:var(--muted);
}

.dashboard{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:15px;
  margin-bottom:20px;
}

.panel{
  background:var(--panel);
  border:1px solid var(--line);
  border-radius:18px;
  padding:18px;
}

.panel h3{
  margin:
    0 0 12px;
}

.market-grid{
  display:grid;
  grid-template-columns:
    repeat(3,1fr);
  gap:10px;
}

.market-grid b{
  background:var(--bg);
  padding:12px;
  border-radius:12px;
}

.market-grid span{
  font-size:20px;
}

.news-grid{
  display:grid;
  grid-template-columns:
    minmax(0,1.2fr)
    minmax(0,1fr);
  gap:20px;
}

.list{
  display:grid;
  gap:14px;
}

.card{
  background:var(--panel);
  border:1px solid var(--line);
  border-radius:18px;
  overflow:hidden;
  display:grid;
  grid-template-columns:
    220px 1fr;
  min-width:0;
}

.card.featured{
  display:block;
}

.card-image{
  display:block;
  background:#e9edf3;
  aspect-ratio:16/10;
  overflow:hidden;
}

.card-image img{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}

.card-body{
  padding:15px;
}

.meta{
  font-size:13px;
  color:var(--muted);
  margin-bottom:7px;
}

.card h2{
  font-size:19px;
  line-height:1.35;
  margin:
    0 0 8px;
}

.featured h2{
  font-size:28px;
}

.card p{
  color:var(--muted);
  line-height:1.55;
  margin:
    0 0 10px;
}

.source,
.article-updated{
  font-size:12px;
  color:var(--muted);
}

.article{
  max-width:900px;
  margin:auto;
  background:var(--panel);
  padding:25px;
  border-radius:22px;
  border:1px solid var(--line);
}

.article h1{
  font-size:42px;
  line-height:1.2;
  margin:8px 0;
}

.article-image{
  width:100%;
  height:auto;
  aspect-ratio:16/10;
  object-fit:cover;
  border-radius:16px;
  margin:20px 0;
}

.article-text{
  font-size:19px;
  line-height:1.9;
}

.article-text p{
  margin:
    0 0 20px;
}

.empty{
  padding:50px;
  text-align:center;
  background:var(--panel);
  border-radius:18px;
}

footer{
  text-align:center;
  color:var(--muted);
  padding:35px 20px;
}

body.dark{
  --bg:#0b1220;
  --panel:#111a2a;
  --text:#eef2f7;
  --muted:#9aa7b7;
  --line:#263246;
}

.dark .market-grid b{
  background:#182236;
}

@media(max-width:1050px){

  .hero h1{
    font-size:34px;
  }

  .news-grid{
    grid-template-columns:1fr;
  }

  .card.featured{
    display:grid;
    grid-template-columns:300px 1fr;
  }

  .featured .card-image{
    aspect-ratio:auto;
    min-height:220px;
  }
}

@media(max-width:700px){

  .top{
    padding:10px 12px;
    gap:8px;
    flex-wrap:wrap;
  }

  .logo{
    font-size:23px;
  }

  .top form{
    order:3;
    flex-basis:100%;
    max-width:none;
  }

  nav{
    padding:
      0 10px 8px;
  }

  nav a{
    font-size:13px;
    padding:7px 9px;
  }

  main{
    padding:15px 11px;
  }

  .hero{
    display:block;
  }

  .hero h1{
    font-size:30px;
  }

  .quote{
    margin-top:12px;
  }

  .dashboard{
    grid-template-columns:1fr;
  }

  .market-grid{
    grid-template-columns:
      1fr 1fr 1fr;
  }

  .news-grid{
    display:block;
  }

  .card,
  .card.featured{
    display:grid;
    grid-template-columns:
      135px 1fr;
    margin-bottom:12px;
    border-radius:14px;
  }

  .card-image{
    aspect-ratio:1/1;
  }

  .card-body{
    padding:11px;
  }

  .card h2,
  .featured h2{
    font-size:16px;
  }

  .card p{
    font-size:13px;
    display:-webkit-box;
    -webkit-line-clamp:2;
    -webkit-box-orient:vertical;
    overflow:hidden;
  }

  .meta{
    font-size:11px;
  }

  .article{
    padding:16px;
    border-radius:15px;
  }

  .article h1{
    font-size:29px;
  }

  .article-text{
    font-size:17px;
    line-height:1.8;
  }

  .actions{
    margin-left:auto;
  }

  .actions a,
  .actions button{
    padding:7px 8px;
  }
}
`;

const CLIENT = `
(function(){

  const key =
    "np-theme";

  if(
    localStorage.getItem(key) ===
    "dark"
  ){
    document.body.classList.add(
      "dark"
    );
  }

  window.toggleTheme =
    function(){

      document.body.classList.toggle(
        "dark"
      );

      localStorage.setItem(
        key,
        document.body.classList.contains(
          "dark"
        )
          ? "dark"
          : "light"
      );

    };

  const quote =
    document.getElementById(
      "quote"
    );

  const quotes =
    ${JSON.stringify(QUOTES)};

  if(quote){

    let index = 0;

    setInterval(
      function(){

        index =
          (index + 1) %
          quotes.length;

        quote.textContent =
          document.documentElement
            .lang === "ar"
            ? quotes[index].ar
            : quotes[index].en;

      },
      30000
    );
  }

})();
`;

async function findArticle(
  env,
  id
) {
  const latest =
    env.NOWPULSE_KV
      ? await env.NOWPULSE_KV
          .get(
            "feed:latest",
            "json"
          )
          .catch(() => [])
      : [];

  const archive =
    env.NOWPULSE_KV
      ? await env.NOWPULSE_KV
          .get(
            "feed:archive",
            "json"
          )
          .catch(() => [])
      : [];

  return [
    ...(Array.isArray(latest)
      ? latest
      : []),
    ...(Array.isArray(archive)
      ? archive
      : [])
  ].find(
    article =>
      article.id === id ||
      article.link === id
  ) || null;
}

async function imageEndpoint(
  request,
  env
) {
  const url =
    new URL(request.url);

  const id =
    url.searchParams.get("id") ||
    "";

  const article =
    await findArticle(
      env,
      id
    );

  if (!article) {
    return new Response(
      "",
      { status:404 }
    );
  }

  const key =
    `img:${article.id}`;

  let cached = null;

  if (env.NOWPULSE_KV) {
    cached =
      await env.NOWPULSE_KV
        .get(key)
        .catch(() => null);
  }

  const image =
    cached ||
    await extractImage(
      article
    );

  if (image &&
      env.NOWPULSE_KV) {

    await env.NOWPULSE_KV
      .put(
        key,
        image,
        {
          expirationTtl:
            7 * 24 * 60 * 60
        }
      )
      .catch(() => {});
  }

  if (!image) {
    return new Response(
      "",
      { status:404 }
    );
  }

  return Response.redirect(
    image,
    302
  );
}

async function sitemap(
  env
) {
  const latest =
    env.NOWPULSE_KV
      ? await env.NOWPULSE_KV
          .get(
            "feed:latest",
            "json"
          )
          .catch(() => [])
      : [];

  const archive =
    env.NOWPULSE_KV
      ? await env.NOWPULSE_KV
          .get(
            "feed:archive",
            "json"
          )
          .catch(() => [])
      : [];

  const all = [
    ...(Array.isArray(latest)
      ? latest
      : []),
    ...(Array.isArray(archive)
      ? archive
      : [])
  ];

  const map =
    new Map();

  for (const article of all) {
    if (!map.has(article.id)) {
      map.set(
        article.id,
        article
      );
    }
  }

  const urls =
    [...map.values()]
      .slice(0, 1000)
      .map(
        article =>
          `<url>
<loc>${esc(
            SITE +
            "/article/" +
            encodeURIComponent(
              article.id
            )
          )}</loc>
<lastmod>${esc(
            article.date
          )}</lastmod>
</url>`
      )
      .join("");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>${SITE}/</loc>
</url>
${urls}
</urlset>`,
    {
      headers:{
        "content-type":
          "application/xml; charset=UTF-8",
        "cache-control":
          "public,max-age=300"
      }
    }
  );
}

async function scheduled(
  env
) {
  try {
    const items =
      await loadFeed(
        env,
        true
      );

    await archiveFeed(
      env,
      items
    );
  } catch(error){
    console.error(
      "Scheduled ingestion failed",
      error?.stack ||
        error
    );
  }
}

export default {

  async fetch(
    request,
    env,
    ctx
  ){

    const url =
      new URL(request.url);

    try{

      if(
        url.pathname ===
        "/robots.txt"
      ){

        return new Response(
          `User-agent: *
Allow: /
Sitemap: ${SITE}/sitemap.xml`,
          {
            headers:{
              "content-type":
                "text/plain; charset=UTF-8"
            }
          }
        );

      }

      if(
        url.pathname ===
        "/sitemap.xml"
      ){
        return sitemap(env);
      }

      if(
        url.pathname ===
        "/health"
      ){

        return Response.json({
          ok:true,
          service:"NowPulse",
          version:VERSION,
          kv:Boolean(
            env.NOWPULSE_KV
          ),
          ai:Boolean(
            env.AI
          ),
          time:
            new Date().toISOString()
        });

      }

      if(
        url.pathname ===
        "/api/image"
      ){
        return imageEndpoint(
          request,
          env
        );
      }

      if(
        url.pathname ===
        "/api/markets"
      ){

        return Response.json(
          await markets(env),
          {
            headers:{
              "cache-control":
                "public,max-age=300"
            }
          }
        );

      }

      if(
        url.pathname ===
        "/api/weather"
      ){

        const city =
          (
            url.searchParams.get(
              "city"
            ) ||
            "cairo"
          ).toLowerCase();

        return Response.json(
          await weather(
            env,
            city
          ),
          {
            headers:{
              "cache-control":
                "public,max-age=300"
            }
          }
        );

      }

      if(
        url.pathname ===
        "/search"
      ){

        const lang =
          url.searchParams.get(
            "lang"
          ) === "en"
            ? "en"
            : "ar";

        const query =
          url.searchParams.get(
            "q"
          ) || "";

        const results =
          await searchNews(
            env,
            query
          );

        const body = `
<section class="hero">

<div>
<div class="eyebrow">
🔎
</div>

<h1>
${esc(
  lang === "ar"
    ? `نتائج البحث عن: ${query}`
    : `Search results: ${query}`
)}
</h1>

</div>

</section>

<div class="list">

${
  results
    .map(
      article =>
        card(
          article,
          lang
        )
    )
    .join("") ||
  `<div class="empty">
${
  lang === "ar"
    ? "لم نجد أخبارًا حديثة بهذا البحث."
    : "No recent results found."
}
</div>`
}

</div>`;

        return new Response(
          layout({
            lang,
            title:
              query ||
              "Search",
            body
          }),
          {
            headers:{
              "content-type":
                "text/html; charset=UTF-8",
              "cache-control":
                "no-store"
            }
          }
        );

      }

      if(
        url.pathname.startsWith(
          "/article/"
        )
      ){

        const lang =
          url.searchParams.get(
            "lang"
          ) === "en"
            ? "en"
            : "ar";

        const id =
          decodeURIComponent(
            url.pathname.slice(
              "/article/"
                .length
            )
          );

        const article =
          await findArticle(
            env,
            id
          );

        if(!article){

          return new Response(
            layout({
              lang,
              title:"Not found",
              body:`
<div class="empty">

<h1>
${
  lang === "ar"
    ? "الخبر غير متاح حاليًا."
    : "Article unavailable."
}
</h1>

</div>`
            }),
            {
              status:404,
              headers:{
                "content-type":
                  "text/html; charset=UTF-8"
              }
            }
          );

        }

        const related =
          (
            await loadFeed(
              env
            )
          ).filter(
            item =>
              item.category ===
                article.category &&
              item.id !==
                article.id
          );

        const articleText =
          await writeArticle(
            env,
            article,
            related
          );

        return new Response(
          layout({
            lang,
            title:
              article.title,
            body:
              articleBody(
                article,
                articleText,
                lang
              ),
            active:
              article.category
          }),
          {
            headers:{
              "content-type":
                "text/html; charset=UTF-8",
              "cache-control":
                "public,max-age=60"
            }
          }
        );

      }

      const lang =
        url.searchParams.get(
          "lang"
        ) === "en"
          ? "en"
          : "ar";

      const category =
        url.searchParams.get(
          "category"
        ) || "latest";

      const items =
        await loadFeed(env);

      const enriched =
        await enrichImages(
          env,
          items
        );

      const marketData =
        await markets(env);

      const weatherData =
        await weather(
          env,
          "cairo"
        );

      const body =
        homeBody(
          enriched,
          lang,
          CATEGORIES[category]
            ? category
            : "latest",
          marketData,
          weatherData
        );

      return new Response(
        layout({
          lang,
          title:
            CATEGORIES[
              category
            ]?.[lang] ||
            CATEGORIES.latest[
              lang
            ],
          body,
          active:category
        }),
        {
          headers:{
            "content-type":
              "text/html; charset=UTF-8",
            "cache-control":
              "public,max-age=60,stale-while-revalidate=300"
          }
        }
      );

    }catch(error){

      console.error(
        "NowPulse request error",
        {
          path:
            url.pathname,
          error:
            error?.stack ||
            String(error)
        }
      );

      const lang =
        url.searchParams.get(
          "lang"
        ) === "en"
          ? "en"
          : "ar";

      return new Response(
        layout({
          lang,
          title:"NowPulse",
          body:`
<div class="empty">

<h1>
${
  lang === "ar"
    ? "حدث خطأ مؤقت"
    : "Temporary error"
}
</h1>

<p>
${
  lang === "ar"
    ? "سيحاول النظام معالجة المشكلة تلقائيًا. أعد تحميل الصفحة بعد لحظات."
    : "The system will try to recover automatically. Reload in a moment."
}
</p>

</div>`
        }),
        {
          status:503,
          headers:{
            "content-type":
              "text/html; charset=UTF-8",
            "cache-control":
              "no-store",
            "retry-after":"10"
          }
        }
      );

    }
  },

  async scheduled(
    controller,
    env,
    ctx
  ){

    ctx.waitUntil(
      scheduled(env)
    );

  }

};
