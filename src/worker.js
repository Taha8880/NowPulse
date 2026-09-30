const APP = {
  name: "NowPulse",
  version: "1.0.0",
  aiModel: "@cf/meta/llama-3.1-8b-instruct-fast",
  feedKey: "nowpulse:feed:v1",
  feedTtl: 21600,
  maxArticles: 120
};

const CATEGORIES = [
  { id: "latest", ar: "آخر الأخبار", en: "Latest", query: "latest news" },
  { id: "world", ar: "العالم", en: "World", query: "world news" },
  { id: "egypt", ar: "مصر", en: "Egypt", query: "Egypt news" },
  { id: "politics", ar: "سياسة", en: "Politics", query: "politics news" },
  { id: "sports", ar: "رياضة", en: "Sports", query: "sports news" },
  { id: "economy", ar: "اقتصاد", en: "Economy", query: "economy business news" },
  { id: "technology", ar: "تكنولوجيا", en: "Technology", query: "technology AI news" },
  { id: "entertainment", ar: "فن وترفيه", en: "Entertainment", query: "entertainment culture news" },
  { id: "health", ar: "صحة", en: "Health", query: "health science news" },
  { id: "travel", ar: "سفر", en: "Travel", query: "travel tourism news" }
];

const RSS_SOURCES = [
  "https://news.google.com/rss?hl=ar&gl=EG&ceid=EG:ar",
  "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
];

const STATIC_PAGES = {
  about: {
    ar: {
      title: "عن NowPulse",
      body: `
        <h2>عن NowPulse</h2>
        <p>NowPulse منصة معلومات وأخبار رقمية تجمع الأخبار والموضوعات الرائجة والمعلومات اليومية في واجهة واحدة سريعة.</p>
        <p>يتم تنظيم الأخبار حسب الموضوع واللغة، مع محاولة التحقق من المعلومات من أكثر من مصدر قبل إنشاء المحتوى التحريري.</p>
      `
    },
    en: {
      title: "About NowPulse",
      body: `
        <h2>About NowPulse</h2>
        <p>NowPulse is a digital information and news platform that brings news, trends and useful daily information together in one fast interface.</p>
        <p>Stories are organized by topic and language, with an effort to cross-check information across multiple sources before editorial generation.</p>
      `
    }
  },
  contact: {
    ar: {
      title: "اتصل بنا",
      body: `
        <h2>اتصل بنا</h2>
        <p>للاستفسارات والملاحظات المتعلقة بالموقع، يمكن التواصل مع إدارة NowPulse عبر قنوات الاتصال المنشورة على الموقع عند توفرها.</p>
      `
    },
    en: {
      title: "Contact",
      body: `
        <h2>Contact</h2>
        <p>For questions, feedback or issues related to NowPulse, please use the contact channels published by the site when available.</p>
      `
    }
  },
  privacy: {
    ar: {
      title: "سياسة الخصوصية",
      body: `
        <h2>سياسة الخصوصية</h2>
        <p>نحترم خصوصية زوار NowPulse. قد يستخدم الموقع ملفات تعريف الارتباط والتقنيات اللازمة لتشغيل الموقع وقياس الأداء وعرض الإعلانات عند تفعيلها.</p>
        <p>لا يطلب الموقع معلومات شخصية لإنشاء تجربة القراءة الأساسية.</p>
        <p>قد تستخدم خدمات الطرف الثالث، مثل خدمات الإعلانات والتحليلات، تقنيات خاصة بها وفق سياساتها وشروطها.</p>
      `
    },
    en: {
      title: "Privacy Policy",
      body: `
        <h2>Privacy Policy</h2>
        <p>NowPulse respects visitor privacy. The site may use cookies and technologies required to operate the website, measure performance and display advertising when enabled.</p>
        <p>The core reading experience does not require visitors to create an account or provide personal information.</p>
        <p>Third-party services such as advertising and analytics providers may use their own technologies according to their policies.</p>
      `
    }
  },
  terms: {
    ar: {
      title: "الشروط والأحكام",
      body: `
        <h2>الشروط والأحكام</h2>
        <p>استخدامك لـNowPulse يعني موافقتك على استخدام الموقع لأغراض قانونية وعدم إساءة استخدام خدماته.</p>
        <p>المعلومات المنشورة لأغراض إعلامية عامة، وقد تتغير بعض المعلومات مع تطور الأحداث أو تحديث المصادر.</p>
      `
    },
    en: {
      title: "Terms",
      body: `
        <h2>Terms</h2>
        <p>By using NowPulse, you agree to use the website lawfully and not misuse its services.</p>
        <p>Published information is provided for general informational purposes and may change as events develop or sources are updated.</p>
      `
    }
  }
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      ...headers
    }
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#039;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCodePoint(Number(n));
      } catch {
        return "";
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      try {
        return String.fromCodePoint(parseInt(n, 16));
      } catch {
        return "";
      }
    });
}

function stripTags(value) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return stripTags(value)
    .replace(/[^\p{L}\p{N}\s.,!?،؟:;'"()\-–—%/$€£]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return encodeURIComponent(
    String(value || "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 180)
  );
}

function absoluteUrl(request, path) {
  const url = new URL(request.url);
  return `${url.origin}${path}`;
}

function getLanguage(request) {
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang");
  if (lang === "en") return "en";
  return "ar";
}

function categoryById(id) {
  return CATEGORIES.find(x => x.id === id) || CATEGORIES[0];
}

function cleanDate(dateValue) {
  const d = new Date(dateValue || "");
  if (!Number.isFinite(d.getTime())) {
    return new Date().toISOString();
  }
  return d.toISOString();
}

function timeAgo(dateValue, lang = "ar") {
  const date = new Date(dateValue);
  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());
  const minutes = Math.floor(diff / 60000);

  if (lang === "en") {
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

function makeId(title, url = "") {
  const raw = `${title}|${url}`.toLowerCase();
  let hash = 2166136261;

  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return `n${(hash >>> 0).toString(16)}`;
}

function parseXmlItems(xml) {
  const items = [];
  const matches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  for (const block of matches) {
    const title = xmlTag(block, "title");
    const link = xmlTag(block, "link");
    const description = xmlTag(block, "description");
    const pubDate = xmlTag(block, "pubDate");
    const source = xmlTag(block, "source");

    if (!title || !link) continue;

    const image =
      extractImageFromXml(block) ||
      "";

    items.push({
      title: normalizeText(title),
      link: decodeHtml(link).trim(),
      description: normalizeText(description).slice(0, 1800),
      pubDate: cleanDate(pubDate),
      source: normalizeText(source),
      image
    });
  }

  return items;
}

function xmlTag(xml, tag) {
  const re = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );
  const m = xml.match(re);
  return m ? m[1] : "";
}

function extractImageFromXml(xml) {
  const enclosure = xml.match(
    /<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i
  );

  if (enclosure && /^https?:\/\//i.test(enclosure[1])) {
    return enclosure[1];
  }

  const media = xml.match(
    /<(?:media:content|media:thumbnail)[^>]+url=["']([^"']+)["'][^>]*>/i
  );

  if (media && /^https?:\/\//i.test(media[1])) {
    return media[1];
  }

  return "";
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeout || 7000
  );

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "NowPulse/1.0 (+news platform)",
        "accept": options.accept || "*/*"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url, options = {}) {
  const text = await fetchText(url, {
    ...options,
    accept: "application/json"
  });

  return JSON.parse(text);
}

function detectLanguage(text) {
  const value = String(text || "");
  const arabic = (value.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (value.match(/[A-Za-z]/g) || []).length;
  return arabic >= latin ? "ar" : "en";
}

function classifyArticle(article) {
  const text = `${article.title} ${article.description}`.toLowerCase();

  if (/\b(sport|football|soccer|match|goal|league|champions|tennis|basketball|f1)\b/i.test(text) ||
      /رياض|كرة|مباراة|هدف|دوري|بطولة|تنس|سلة/.test(text)) {
    return "sports";
  }

  if (/\b(ai|artificial intelligence|technology|tech|iphone|android|google|microsoft|apple|cyber)\b/i.test(text) ||
      /تكنولوجيا|ذكاء اصطناعي|هاتف|جوجل|مايكروسوفت|آبل|تقنية/.test(text)) {
    return "technology";
  }

  if (/\b(economy|business|market|stock|oil|gold|currency|inflation|bank)\b/i.test(text) ||
      /اقتصاد|أسواق|بورصة|ذهب|عملات|تضخم|بنك|نفط/.test(text)) {
    return "economy";
  }

  if (/\b(movie|film|music|actor|actress|celebrity|entertainment|artist)\b/i.test(text) ||
      /فن|فنان|فيلم|مسلسل|موسيقى|ترفيه|ممثل|ممثلة/.test(text)) {
    return "entertainment";
  }

  if (/\b(health|medical|hospital|disease|doctor|medicine|science)\b/i.test(text) ||
      /صحة|طب|مستشفى|مرض|طبيب|دواء|علوم/.test(text)) {
    return "health";
  }

  if (/\b(travel|tourism|hotel|flight|airport|tourist)\b/i.test(text) ||
      /سفر|سياحة|فندق|طيران|مطار|سياح/.test(text)) {
    return "travel";
  }

  if (/\b(egypt|cairo|hurghada|alexandria|luxor|giza)\b/i.test(text) ||
      /مصر|القاهرة|الغردقة|الإسكندرية|الأقصر|الجيزة/.test(text)) {
    return "egypt";
  }

  if (/\b(president|government|election|minister|parliament|politics|war|conflict)\b/i.test(text) ||
      /رئيس|حكومة|انتخابات|وزير|برلمان|سياسة|حرب|صراع/.test(text)) {
    return "politics";
  }

  return "world";
}

async function getGoogleNewsFeed(query, lang = "ar") {
  const encoded = encodeURIComponent(query);

  const url =
    lang === "ar"
      ? `https://news.google.com/rss/search?q=${encoded}&hl=ar&gl=EG&ceid=EG:ar`
      : `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const xml = await fetchText(url, {
      timeout: 6500,
      accept: "application/rss+xml, application/xml, text/xml"
    });

    return parseXmlItems(xml);
  } catch {
    return [];
  }
}

async function getImageFromArticlePage(url) {
  if (!url || !/^https?:\/\//i.test(url)) return "";

  try {
    const html = await fetchText(url, {
      timeout: 6000,
      accept: "text/html,application/xhtml+xml"
    });

    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);

      if (match && /^https?:\/\//i.test(match[1])) {
        return decodeHtml(match[1]);
      }
    }

    const jsonLdMatches =
      html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];

    for (const block of jsonLdMatches) {
      const raw = block
        .replace(/<script[^>]*>/i, "")
        .replace(/<\/script>/i, "")
        .trim();

      try {
        const data = JSON.parse(raw);
        const list = Array.isArray(data) ? data : [data];

        for (const item of list) {
          const image = item?.image;

          if (typeof image === "string" && /^https?:\/\//i.test(image)) {
            return image;
          }

          if (Array.isArray(image)) {
            const found = image.find(x => /^https?:\/\//i.test(String(x)));
            if (found) return found;
          }

          if (image && typeof image === "object" && image.url) {
            if (/^https?:\/\//i.test(image.url)) {
              return image.url;
            }
          }
        }
      } catch {
        // Ignore invalid JSON-LD.
      }
    }
  } catch {
    // Ignore image extraction failures.
  }

  return "";
}

async function getWikimediaImage(query) {
  if (!query) return "";

  try {
    const url =
      "https://commons.wikimedia.org/w/api.php" +
      "?action=query" +
      "&generator=search" +
      "&gsrsearch=" +
      encodeURIComponent(query) +
      "&gsrnamespace=6" +
      "&gsrlimit=5" +
      "&prop=imageinfo" +
      "&iiprop=url" +
      "&iiurlwidth=1000" +
      "&format=json" +
      "&origin=*";

    const data = await fetchJson(url, { timeout: 6000 });
    const pages = Object.values(data?.query?.pages || {});

    const usable = pages.find(page => {
      const imageUrl = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
      return /^https?:\/\//i.test(imageUrl || "");
    });

    return usable?.imageinfo?.[0]?.thumburl ||
      usable?.imageinfo?.[0]?.url ||
      "";
  } catch {
    return "";
  }
}

async function resolveImage(article) {
  if (article.image && /^https?:\/\//i.test(article.image)) {
    return article.image;
  }

  const sourceImage = await getImageFromArticlePage(article.link);

  if (sourceImage) {
    return sourceImage;
  }

  return getWikimediaImage(article.title);
}

async function enrichImages(articles, limit = 12) {
  const result = [...articles];

  const selected = result.slice(0, limit);

  await Promise.all(
    selected.map(async article => {
      if (!article.image) {
        article.image = await resolveImage(article);
      }
    })
  );

  return result;
}

function dedupeArticles(items) {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    const titleKey = normalizeText(item.title)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();

    if (!titleKey) continue;

    if (seen.has(titleKey)) continue;

    seen.add(titleKey);

    const article = {
      ...item,
      id: item.id || makeId(item.title, item.link),
      category: item.category || classifyArticle(item),
      pubDate: cleanDate(item.pubDate)
    };

    output.push(article);
  }

  return output;
}

async function buildHomeFeed() {
  const queries = [
    "latest news",
    "Egypt news",
    "world news",
    "sports news",
    "technology AI news",
    "business economy markets",
    "entertainment culture",
    "health science",
    "travel tourism"
  ];

  const tasks = [];

  for (const query of queries) {
    tasks.push(getGoogleNewsFeed(query, "ar"));
    tasks.push(getGoogleNewsFeed(query, "en"));
  }

  const results = await Promise.all(tasks);
  const flat = results.flat();

  const classified = flat.map(item => ({
    ...item,
    category: classifyArticle(item),
    id: makeId(item.title, item.link)
  }));

  const unique = dedupeArticles(classified);

  unique.sort(
    (a, b) =>
      new Date(b.pubDate).getTime() -
      new Date(a.pubDate).getTime()
  );

  const enriched = await enrichImages(unique, 18);

  return {
    generatedAt: new Date().toISOString(),
    articles: enriched.slice(0, APP.maxArticles)
  };
}

async function loadFeed(env) {
  if (!env.NOWPULSE_KV) {
    return buildHomeFeed();
  }

  try {
    const cached = await env.NOWPULSE_KV.get(APP.feedKey, "json");

    if (cached?.articles?.length) {
      return cached;
    }
  } catch {
    // Continue with live fetch.
  }

  return buildHomeFeed();
}

async function refreshFeed(env) {
  const feed = await buildHomeFeed();

  if (env.NOWPULSE_KV && feed.articles.length) {
    try {
      await env.NOWPULSE_KV.put(
        APP.feedKey,
        JSON.stringify(feed),
        {
          expirationTtl: APP.feedTtl
        }
      );
    } catch {
      // News must remain available even if KV write fails.
    }
  }

  return feed;
}

async function searchNews(query, lang = "ar") {
  const cleanQuery = normalizeText(query).slice(0, 180);

  if (!cleanQuery) return [];

  const searches = [
    getGoogleNewsFeed(cleanQuery, lang),
    getGoogleNewsFeed(`${cleanQuery} news`, lang)
  ];

  if (lang === "ar") {
    searches.push(
      getGoogleNewsFeed(cleanQuery, "en")
    );
  }

  const results = await Promise.all(searches);

  const articles = dedupeArticles(
    results.flat().map(item => ({
      ...item,
      category: classifyArticle(item)
    }))
  );

  articles.sort(
    (a, b) =>
      new Date(b.pubDate).getTime() -
      new Date(a.pubDate).getTime()
  );

  return enrichImages(articles.slice(0, 40), 12);
}

async function getArticleSources(article, lang) {
  const title = article.title;

  const searches = [
    getGoogleNewsFeed(title, lang),
    getGoogleNewsFeed(title, lang === "ar" ? "en" : "ar")
  ];

  const results = await Promise.all(searches);

  const all = dedupeArticles(
    results.flat().map(item => ({
      ...item,
      category: classifyArticle(item)
    }))
  );

  const related = all
    .filter(item => item.title !== title)
    .slice(0, 8);

  return [
    {
      title: article.title,
      description: article.description,
      source: article.source,
      pubDate: article.pubDate
    },
    ...related.map(item => ({
      title: item.title,
      description: item.description,
      source: item.source,
      pubDate: item.pubDate
    }))
  ];
}

function extractAIText(result) {
  if (!result) return "";

  if (typeof result === "string") {
    return result.trim();
  }

  if (typeof result.response === "string") {
    return result.response.trim();
  }

  if (typeof result.output_text === "string") {
    return result.output_text.trim();
  }

  if (Array.isArray(result.result)) {
    return result.result
      .map(x => typeof x === "string" ? x : x?.text || "")
      .join("\n")
      .trim();
  }

  return "";
}

async function generateArticle(env, article, lang = "ar") {
  const sources = await getArticleSources(article, lang);

  const sourceText = sources
    .map((item, index) => {
      return [
        `SOURCE ${index + 1}`,
        `Title: ${item.title}`,
        `Description: ${item.description}`,
        `Publisher: ${item.source}`,
        `Published: ${item.pubDate}`
      ].join("\n");
    })
    .join("\n\n");

  if (!env.AI) {
    return fallbackArticle(article, lang);
  }

  const system =
    lang === "ar"
      ? `
أنت محرر أخبار لمنصة NowPulse.
اكتب مقالًا إخباريًا أصليًا باللغة العربية.

قواعد صارمة:
- لا تنسخ نص أي مصدر.
- لا تخترع أي معلومة.
- استخدم المعلومات المتكررة أو المدعومة من أكثر من مصدر كحقائق أساسية.
- إذا اختلفت المصادر، اذكر الاختلاف بوضوح ولا تخترع حسمًا.
- لا تضف أرقامًا أو أسماء أو تواريخ غير موجودة في المادة المصدرية.
- لا تذكر أنك نموذج ذكاء اصطناعي.
- لا تضع روابط خارجية.
- لا تكتب قائمة مصادر داخل المقال.
- المقال يجب أن يكون مقالًا حقيقيًا قابلًا للقراءة، وليس سطرًا واحدًا.
- استخدم عنوانًا واضحًا ثم مقدمة ثم فقرات مرتبة.
- إذا كانت المعلومات المتاحة محدودة، اجعل المقال أقصر ولكن كاملًا.
- لا تستخدم Markdown.
`
      : `
You are a news editor for NowPulse.
Write an original English news article.

Strict rules:
- Do not copy any source text.
- Do not invent facts.
- Treat repeated or independently supported information as core facts.
- If sources conflict, clearly state the disagreement instead of inventing a resolution.
- Do not add names, numbers or dates that are not supported by the source material.
- Do not mention that you are an AI.
- Do not include external links.
- Do not add a source list inside the article.
- The result must be a real readable article, not a one-line summary.
- Use a clear headline, introduction and organized paragraphs.
- If available information is limited, make the article shorter but still complete.
- Do not use Markdown.
`;

  const prompt = `
ARTICLE TO DEVELOP:
Title: ${article.title}
Description: ${article.description}
Publisher: ${article.source}
Published: ${article.pubDate}

ADDITIONAL SOURCE MATERIAL:
${sourceText}

Create the final article now.
`;

  try {
    const result = await env.AI.run(
      APP.aiModel,
      {
        messages: [
          {
            role: "system",
            content: system
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1800
      }
    );

    const generated = normalizeText(
      extractAIText(result)
    );

    if (generated.length >= 300) {
      return {
        title: article.title,
        body: generated,
        sourcesCount: sources.length,
        generated: true
      };
    }
  } catch {
    // Fallback below.
  }

  return fallbackArticle(article, lang, sources);
}

function fallbackArticle(article, lang, sources = []) {
  if (lang === "en") {
    return {
      title: article.title,
      body:
        `${article.title}\n\n` +
        `${article.description || "The latest available information is being monitored by NowPulse."}\n\n` +
        `NowPulse is continuing to monitor developments related to this story. ` +
        `Additional information will be incorporated as independently reported details become available.`,
      sourcesCount: Math.max(1, sources.length),
      generated: false
    };
  }

  return {
    title: article.title,
    body:
      `${article.title}\n\n` +
      `${article.description || "تتابع NowPulse أحدث المعلومات المتاحة حول هذا الخبر."}\n\n` +
      `وتواصل NowPulse متابعة تطورات الموضوع، مع إضافة المعلومات الجديدة عندما تتوفر تفاصيل مؤكدة من مصادر متعددة.`,
    sourcesCount: Math.max(1, sources.length),
    generated: false
  };
}

async function getMarketData() {
  const result = {
    currency: null,
    gold: null,
    updatedAt: new Date().toISOString()
  };

  try {
    const rates = await fetchJson(
      "https://api.frankfurter.dev/v2/rates?base=USD&quotes=EGP,EUR,GBP,SAR,AED",
      { timeout: 5000 }
    );

    result.currency = {
      base: "USD",
      rates: rates
    };
  } catch {
    result.currency = null;
  }

  try {
    const gold = await fetchJson(
      "https://api.gold-api.com/price/XAU",
      { timeout: 5000 }
    );

    result.gold = {
      symbol: "XAU",
      usdPerOunce: Number(gold?.price || 0),
      updatedAt: gold?.updatedAt || null
    };
  } catch {
    result.gold = null;
  }

  return result;
}

async function getWeather() {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=30.0444" +
      "&longitude=31.2357" +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
      "&timezone=Africa%2FCairo";

    const data = await fetchJson(url, { timeout: 5000 });

    return {
      city: "Cairo",
      temperature: data?.current?.temperature_2m ?? null,
      apparent: data?.current?.apparent_temperature ?? null,
      humidity: data?.current?.relative_humidity_2m ?? null,
      wind: data?.current?.wind_speed_10m ?? null,
      code: data?.current?.weather_code ?? null,
      updatedAt: new Date().toISOString()
    };
  } catch {
    return null;
  }
}

function categoryTheme(category) {
  const themes = {
    sports: "sports",
    economy: "economy",
    politics: "politics",
    technology: "technology",
    entertainment: "entertainment",
    health: "health",
    travel: "travel",
    egypt: "egypt",
    world: "world",
    latest: "latest"
  };

  return themes[category] || "world";
}

function articleCard(article, lang = "ar", featured = false) {
  const category = categoryById(article.category);
  const image = article.image
    ? `<img src="${escapeHtml(article.image)}" alt="" loading="${featured ? "eager" : "lazy"}" decoding="async" onerror="this.parentElement.classList.add('no-image');this.remove()">`
    : "";

  return `
    <article class="story ${featured ? "featured" : ""} theme-${escapeHtml(categoryTheme(article.category))}"
      data-id="${escapeHtml(article.id)}"
      data-title="${escapeHtml(article.title)}">
      <a class="story-link" href="/article/${encodeURIComponent(article.id)}?lang=${lang}">
        <div class="story-media ${image ? "" : "empty"}">
          ${image}
          ${!image ? `<span class="image-placeholder">NP</span>` : ""}
        </div>
        <div class="story-content">
          <div class="story-meta">
            <span>${escapeHtml(lang === "ar" ? category.ar : category.en)}</span>
            <time datetime="${escapeHtml(article.pubDate)}">${escapeHtml(timeAgo(article.pubDate, lang))}</time>
          </div>
          <h2>${escapeHtml(article.title)}</h2>
          <p>${escapeHtml(article.description || "")}</p>
          <div class="story-source">${escapeHtml(article.source || "NowPulse")}</div>
        </div>
      </a>
    </article>
  `;
}

function renderShell({
  lang = "ar",
  title = "NowPulse",
  description = "",
  body = "",
  active = "latest",
  searchQuery = ""
}) {
  const rtl = lang === "ar";
  const direction = rtl ? "rtl" : "ltr";

  const nav = CATEGORIES
    .map(category => `
      <a
        class="${active === category.id ? "active" : ""}"
        href="/?category=${encodeURIComponent(category.id)}&lang=${lang}">
        ${escapeHtml(rtl ? category.ar : category.en)}
      </a>
    `)
    .join("");

  const labels = rtl
    ? {
        search: "ابحث عن أي شخص أو موضوع",
        searchButton: "بحث",
        home: "الرئيسية",
        latest: "آخر الأخبار",
        weather: "الطقس",
        markets: "الأسواق",
        about: "عن الموقع",
        privacy: "الخصوصية",
        terms: "الشروط",
        contact: "اتصل بنا",
        created: "Created by Taha",
        loading: "جاري التحميل...",
        more: "تحميل المزيد"
      }
    : {
        search: "Search any person or topic",
        searchButton: "Search",
        home: "Home",
        latest: "Latest News",
        weather: "Weather",
        markets: "Markets",
        about: "About",
        privacy: "Privacy",
        terms: "Terms",
        contact: "Contact",
        created: "Created by Taha",
        loading: "Loading...",
        more: "Load more"
      };

  return `<!doctype html>
<html lang="${lang}" dir="${direction}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b1220">
<meta name="description" content="${escapeHtml(description || "NowPulse - الأخبار والمعلومات الحديثة") }">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${escapeHtml("https://nowpulse.tavengers16.workers.dev/")}">
<title>${escapeHtml(title)}</title>
<style>
:root{
  --bg:#f5f7fb;
  --surface:#fff;
  --surface2:#eef2f7;
  --text:#101827;
  --muted:#687386;
  --border:#dfe5ed;
  --accent:#155eef;
  --accent2:#0b3aa4;
  --shadow:0 12px 30px rgba(15,23,42,.08);
  --radius:18px;
}
[data-theme="dark"]{
  --bg:#080d16;
  --surface:#111827;
  --surface2:#182234;
  --text:#f5f7fb;
  --muted:#9aa7ba;
  --border:#273247;
  --accent:#6ea0ff;
  --accent2:#8db5ff;
  --shadow:0 15px 35px rgba(0,0,0,.25);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;
  background:var(--bg);
  color:var(--text);
  font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif;
  line-height:1.65;
}
a{color:inherit;text-decoration:none}
button,input{font:inherit}
button{cursor:pointer}
.top{
  position:sticky;
  top:0;
  z-index:100;
  backdrop-filter:blur(16px);
  background:color-mix(in srgb,var(--surface) 90%,transparent);
  border-bottom:1px solid var(--border);
}
.header{
  max-width:1440px;
  margin:auto;
  min-height:74px;
  padding:12px 22px;
  display:flex;
  align-items:center;
  gap:16px;
}
.logo{
  font-size:25px;
  font-weight:900;
  letter-spacing:-1px;
  white-space:nowrap;
}
.logo b{color:var(--accent)}
.search{
  flex:1;
  display:flex;
  min-width:120px;
  max-width:680px;
  margin:auto;
}
.search input{
  width:100%;
  border:1px solid var(--border);
  background:var(--surface2);
  color:var(--text);
  padding:12px 16px;
  outline:none;
}
[dir="rtl"] .search input{border-radius:14px 0 0 14px}
[dir="ltr"] .search input{border-radius:0 14px 14px 0}
.search button{
  border:0;
  background:var(--accent);
  color:#fff;
  padding:0 20px;
  font-weight:800;
}
[dir="rtl"] .search button{border-radius:0 14px 14px 0}
[dir="ltr"] .search button{border-radius:14px 0 0 14px}
.actions{display:flex;gap:8px}
.icon-btn{
  width:42px;
  height:42px;
  border:1px solid var(--border);
  border-radius:12px;
  background:var(--surface);
  color:var(--text);
}
.nav-wrap{
  border-top:1px solid var(--border);
  overflow:auto;
  scrollbar-width:none;
}
.nav{
  max-width:1440px;
  margin:auto;
  padding:8px 22px;
  display:flex;
  gap:8px;
  white-space:nowrap;
}
.nav a{
  padding:8px 13px;
  border-radius:10px;
  color:var(--muted);
  font-weight:700;
}
.nav a.active,.nav a:hover{
  background:var(--accent);
  color:#fff;
}
.container{
  max-width:1440px;
  margin:auto;
  padding:24px 22px 60px;
}
.hero-title{
  display:flex;
  align-items:end;
  justify-content:space-between;
  gap:20px;
  margin-bottom:22px;
}
.hero-title h1{
  margin:0;
  font-size:clamp(30px,4vw,52px);
  letter-spacing:-1.8px;
}
.hero-title p{
  margin:5px 0 0;
  color:var(--muted);
}
.grid{
  display:grid;
  grid-template-columns:minmax(0,2fr) minmax(260px,1fr);
  gap:20px;
}
.stories{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:18px;
}
.story{
  overflow:hidden;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--radius);
  box-shadow:var(--shadow);
  transition:transform .18s ease,box-shadow .18s ease;
}
.story:hover{
  transform:translateY(-2px);
}
.story.featured{
  grid-column:span 2;
}
.story-link{display:block}
.story-media{
  position:relative;
  aspect-ratio:16/9;
  background:var(--surface2);
  overflow:hidden;
}
.story.featured .story-media{
  aspect-ratio:2/1;
}
.story-media img{
  width:100%;
  height:100%;
  display:block;
  object-fit:cover;
  transition:transform .3s ease;
}
.story:hover .story-media img{transform:scale(1.02)}
.image-placeholder{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  font-size:30px;
  font-weight:900;
  color:var(--muted);
}
.story-content{padding:17px}
.story-meta{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  color:var(--muted);
  font-size:12px;
  font-weight:800;
}
.story-meta span{
  color:var(--accent);
}
.story h2{
  margin:8px 0;
  font-size:clamp(18px,2vw,25px);
  line-height:1.35;
}
.story:not(.featured) h2{
  font-size:19px;
}
.story p{
  margin:0;
  color:var(--muted);
  display:-webkit-box;
  -webkit-line-clamp:3;
  -webkit-box-orient:vertical;
  overflow:hidden;
}
.story-source{
  margin-top:12px;
  font-size:12px;
  color:var(--muted);
}
.sidebar{
  display:flex;
  flex-direction:column;
  gap:16px;
}
.panel{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--radius);
  padding:18px;
  box-shadow:var(--shadow);
}
.panel h3{margin:0 0 14px}
.market-row{
  display:flex;
  justify-content:space-between;
  padding:10px 0;
  border-bottom:1px solid var(--border);
}
.market-row:last-child{border-bottom:0}
.value{font-weight:900}
.loading{
  padding:40px;
  text-align:center;
  color:var(--muted);
}
.article{
  max-width:950px;
  margin:auto;
}
.article-head{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:24px;
  overflow:hidden;
  box-shadow:var(--shadow);
}
.article-image{
  width:100%;
  aspect-ratio:16/8;
  object-fit:cover;
  display:block;
  background:var(--surface2);
}
.article-body{
  padding:clamp(22px,5vw,55px);
}
.article-body h1{
  font-size:clamp(30px,5vw,54px);
  line-height:1.2;
  margin:0 0 15px;
}
.article-meta{
  color:var(--muted);
  margin-bottom:28px;
}
.article-text{
  white-space:pre-line;
  font-size:19px;
  line-height:2;
}
.article-text p{margin:0 0 20px}
.footer{
  border-top:1px solid var(--border);
  padding:25px 22px;
  color:var(--muted);
}
.footer-inner{
  max-width:1440px;
  margin:auto;
  display:flex;
  justify-content:space-between;
  gap:20px;
  flex-wrap:wrap;
}
.footer-links{display:flex;gap:15px;flex-wrap:wrap}
.ad-slot{
  min-height:0;
  margin:18px 0;
}
.theme-sports{--accent:#d91c3c}
.theme-economy{--accent:#008b68}
.theme-politics{--accent:#7c3aed}
.theme-technology{--accent:#0b82f0}
.theme-entertainment{--accent:#db2777}
.theme-health{--accent:#008fba}
.theme-travel{--accent:#ea7b00}
.theme-egypt{--accent:#b67b00}
.error{
  padding:30px;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:18px;
  text-align:center;
}
@media(max-width:1100px){
  .grid{grid-template-columns:1fr}
  .sidebar{
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
}
@media(max-width:760px){
  body{font-size:14px}
  .header{
    min-height:64px;
    padding:8px 12px;
    gap:7px;
    flex-wrap:wrap;
  }
  .logo{
    font-size:21px;
  }
  .search{
    order:3;
    flex-basis:100%;
    max-width:none;
  }
  .actions{margin-inline-start:auto}
  .nav{
    padding:7px 12px;
    gap:5px;
  }
  .nav a{
    padding:7px 10px;
    font-size:13px;
  }
  .container{
    padding:16px 12px 40px;
  }
  .hero-title{
    margin-bottom:15px;
  }
  .hero-title h1{
    font-size:30px;
  }
  .grid{display:block}
  .stories{
    display:flex;
    flex-direction:column;
    gap:10px;
  }
  .story,
  .story.featured{
    display:block;
    border-radius:15px;
  }
  .story-link{
    display:grid;
    grid-template-columns:115px minmax(0,1fr);
    min-height:112px;
  }
  .story-media,
  .story.featured .story-media{
    aspect-ratio:auto;
    height:100%;
    min-height:112px;
    order:2;
  }
  [dir="rtl"] .story-media{order:2}
  [dir="ltr"] .story-media{order:1}
  [dir="rtl"] .story-content{order:1}
  [dir="ltr"] .story-content{order:2}
  .story-content{
    padding:11px 12px;
  }
  .story h2,
  .story:not(.featured) h2{
    font-size:15px;
    line-height:1.4;
    margin:5px 0;
    display:-webkit-box;
    -webkit-line-clamp:3;
    -webkit-box-orient:vertical;
    overflow:hidden;
  }
  .story p{
    display:none;
  }
  .story-source{
    margin-top:5px;
    font-size:10px;
  }
  .story-meta{
    font-size:10px;
  }
  .sidebar{
    display:grid;
    grid-template-columns:1fr;
    margin-top:14px;
  }
  .panel{padding:14px}
  .article-body{
    padding:22px 16px;
  }
  .article-body h1{
    font-size:29px;
  }
  .article-text{
    font-size:17px;
    line-height:1.9;
  }
}
@media(min-width:761px) and (max-width:1100px){
  .stories{grid-template-columns:repeat(2,minmax(0,1fr))}
}
</style>
</head>
<body>
<header class="top">
  <div class="header">
    <a class="logo" href="/?lang=${lang}" aria-label="NowPulse">
      Now<b>Pulse</b>
    </a>

    <form class="search" action="/search" method="get">
      <input
        name="q"
        value="${escapeHtml(searchQuery)}"
        placeholder="${escapeHtml(labels.search)}"
        autocomplete="off">
      <input type="hidden" name="lang" value="${lang}">
      <button type="submit">${escapeHtml(labels.searchButton)}</button>
    </form>

    <div class="actions">
      <button class="icon-btn" id="themeBtn" aria-label="Theme">☀️</button>
      <button class="icon-btn" id="langBtn" aria-label="Language">${lang === "ar" ? "EN" : "ع"}</button>
    </div>
  </div>

  <div class="nav-wrap">
    <nav class="nav">
      ${nav}
    </nav>
  </div>
</header>

<main class="container">
  ${body}
</main>

<footer class="footer">
  <div class="footer-inner">
    <div class="footer-links">
      <a href="/?lang=${lang}">${escapeHtml(labels.home)}</a>
      <a href="/page/about?lang=${lang}">${escapeHtml(labels.about)}</a>
      <a href="/page/privacy?lang=${lang}">${escapeHtml(labels.privacy)}</a>
      <a href="/page/terms?lang=${lang}">${escapeHtml(labels.terms)}</a>
      <a href="/page/contact?lang=${lang}">${escapeHtml(labels.contact)}</a>
    </div>
    <strong>${escapeHtml(labels.created)}</strong>
  </div>
</footer>

<script>
(function(){
  const key = "nowpulse-theme";
  const root = document.documentElement;
  const saved = localStorage.getItem(key);

  if(saved === "dark"){
    root.setAttribute("data-theme","dark");
  }

  const themeBtn = document.getElementById("themeBtn");
  const langBtn = document.getElementById("langBtn");

  if(themeBtn){
    themeBtn.textContent =
      root.getAttribute("data-theme") === "dark" ? "🌙" : "☀️";

    themeBtn.addEventListener("click", function(){
      const dark = root.getAttribute("data-theme") === "dark";

      if(dark){
        root.removeAttribute("data-theme");
        localStorage.setItem(key,"light");
        themeBtn.textContent = "☀️";
      }else{
        root.setAttribute("data-theme","dark");
        localStorage.setItem(key,"dark");
        themeBtn.textContent = "🌙";
      }
    });
  }

  if(langBtn){
    langBtn.addEventListener("click", function(){
      const url = new URL(location.href);
      const next = url.searchParams.get("lang") === "en" ? "ar" : "en";
      url.searchParams.set("lang", next);
      location.href = url.toString();
    });
  }
})();
</script>
</body>
</html>`;
}

function renderHome(feed, lang, active = "latest") {
  const articles =
    active === "latest"
      ? feed.articles
      : feed.articles.filter(x => x.category === active);

  const list = articles.length
    ? articles.map((article, index) =>
        articleCard(article, lang, index === 0)
      ).join("")
    : `
      <div class="error">
        ${lang === "ar" ? "لا توجد أخبار متاحة لهذا القسم حاليًا." : "No stories are available for this section right now."}
      </div>
    `;

  const title =
    active === "latest"
      ? lang === "ar" ? "آخر الأخبار" : "Latest News"
      : lang === "ar"
        ? categoryById(active).ar
        : categoryById(active).en;

  const body = `
    <section class="hero-title">
      <div>
        <h1>${escapeHtml(title)}</h1>
        ${active === "latest" ? "" : `<p>${escapeHtml(lang === "ar" ? "أحدث الأخبار في هذا القسم" : "Latest stories in this category")}</p>`}
      </div>
    </section>

    <div class="grid">
      <section class="stories" id="stories">
        ${list}
      </section>

      <aside class="sidebar">
        <div class="panel">
          <h3>${lang === "ar" ? "الأسواق" : "Markets"}</h3>
          <div id="marketBox">${lang === "ar" ? "جاري تحديث الأسعار..." : "Updating prices..."}</div>
        </div>

        <div class="panel">
          <h3>${lang === "ar" ? "الطقس" : "Weather"}</h3>
          <div id="weatherBox">${lang === "ar" ? "جاري تحديث الطقس..." : "Updating weather..."}</div>
        </div>
      </aside>
    </div>

    <script>
    (function(){
      const marketBox = document.getElementById("marketBox");
      const weatherBox = document.getElementById("weatherBox");

      fetch("/api/market")
        .then(r => r.json())
        .then(data => {
          let html = "";

          if(data.gold && data.gold.usdPerOunce){
            html += '<div class="market-row"><span>Gold XAU</span><strong class="value">$' +
              Number(data.gold.usdPerOunce).toLocaleString(undefined,{maximumFractionDigits:2}) +
              '</strong></div>';
          }

          const rates = data.currency?.rates || {};
          const list = [
            ["EGP","EGP"],
            ["EUR","EUR"],
            ["GBP","GBP"],
            ["SAR","SAR"],
            ["AED","AED"]
          ];

          for(const item of list){
            const v = rates[item[0]];
            if(v != null){
              html += '<div class="market-row"><span>USD/' + item[1] +
                '</span><strong class="value">' +
                Number(v).toLocaleString(undefined,{maximumFractionDigits:4}) +
                '</strong></div>';
            }
          }

          marketBox.innerHTML = html || "${lang === "ar" ? "تعذر تحديث الأسعار حاليًا." : "Prices are temporarily unavailable."}";
        })
        .catch(() => {
          marketBox.textContent = "${lang === "ar" ? "تعذر تحديث الأسعار حاليًا." : "Prices are temporarily unavailable."}";
        });

      fetch("/api/weather")
        .then(r => r.json())
        .then(data => {
          if(!data || data.temperature == null){
            weatherBox.textContent = "${lang === "ar" ? "تعذر تحديث الطقس حاليًا." : "Weather is temporarily unavailable."}";
            return;
          }

          weatherBox.innerHTML =
            '<div class="market-row"><span>${lang === "ar" ? "القاهرة" : "Cairo"}</span><strong class="value">' +
            Number(data.temperature).toFixed(1) + '°C</strong></div>' +
            '<div class="market-row"><span>${lang === "ar" ? "الإحساس" : "Feels like"}</span><strong class="value">' +
            Number(data.apparent).toFixed(1) + '°C</strong></div>' +
            '<div class="market-row"><span>${lang === "ar" ? "الرطوبة" : "Humidity"}</span><strong class="value">' +
            Number(data.humidity) + '%</strong></div>';
        })
        .catch(() => {
          weatherBox.textContent = "${lang === "ar" ? "تعذر تحديث الطقس حاليًا." : "Weather is temporarily unavailable."}";
        });
    })();
    </script>
  `;

  return renderShell({
    lang,
    title: `${title} | NowPulse`,
    description: title,
    body,
    active
  });
}

async function renderArticle(request, env, id) {
  const lang = getLanguage(request);
  const feed = await loadFeed(env);

  let article =
    feed.articles.find(x => x.id === id) ||
    null;

  if (!article) {
    return renderShell({
      lang,
      title: "NowPulse",
      body: `
        <div class="error">
          <h1>${lang === "ar" ? "الخبر غير متاح" : "Article unavailable"}</h1>
          <p>${lang === "ar" ? "تعذر العثور على هذا الخبر حاليًا." : "This article could not be found right now."}</p>
        </div>
      `
    });
  }

  if (!article.image) {
    article = {
      ...article,
      image: await resolveImage(article)
    };
  }

  const generated = await generateArticle(
    env,
    article,
    lang
  );

  const paragraphs = String(generated.body || "")
    .split(/\n{2,}/)
    .map(x => x.trim())
    .filter(Boolean)
    .map(x => `<p>${escapeHtml(x)}</p>`)
    .join("");

  const image = article.image
    ? `<img class="article-image" src="${escapeHtml(article.image)}" alt="" fetchpriority="high" decoding="async">`
    : "";

  const body = `
    <article class="article">
      <div class="article-head">
        ${image}
        <div class="article-body">
          <div class="article-meta">
            ${escapeHtml(timeAgo(article.pubDate, lang))}
            ${article.source ? ` · ${escapeHtml(article.source)}` : ""}
          </div>

          <h1>${escapeHtml(generated.title || article.title)}</h1>

          <div class="article-text">
            ${paragraphs}
          </div>
        </div>
      </div>
    </article>
  `;

  return renderShell({
    lang,
    title: `${generated.title || article.title} | NowPulse`,
    description: article.description,
    body,
    active: article.category
  });
}

async function handleSearch(request, env) {
  const url = new URL(request.url);
  const lang = getLanguage(request);
  const query = normalizeText(url.searchParams.get("q") || "");

  if (!query) {
    return renderShell({
      lang,
      title: lang === "ar" ? "بحث | NowPulse" : "Search | NowPulse",
      body: `
        <div class="error">
          <h1>${lang === "ar" ? "اكتب ما تريد البحث عنه" : "Enter a search query"}</h1>
        </div>
      `,
      searchQuery: ""
    });
  }

  const results = await searchNews(query, lang);

  const body = `
    <section class="hero-title">
      <div>
        <h1>${lang === "ar" ? "نتائج البحث" : "Search Results"}</h1>
        <p>${escapeHtml(query)}</p>
      </div>
    </section>

    <section class="stories">
      ${
        results.length
          ? results.map((article, index) =>
              articleCard(article, lang, index === 0)
            ).join("")
          : `
            <div class="error">
              <h2>${lang === "ar" ? "لم نجد نتائج حاليًا" : "No results found"}</h2>
              <p>${lang === "ar" ? "حاول استخدام اسم شخص أو موضوع مختلف." : "Try another person or topic."}</p>
            </div>
          `
      }
    </section>
  `;

  return renderShell({
    lang,
    title: `${query} | NowPulse`,
    description: `${lang === "ar" ? "بحث عن" : "Search"} ${query}`,
    body,
    searchQuery: query
  });
}

async function handleApi(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/api/news") {
    const lang = getLanguage(request);
    const category = url.searchParams.get("category") || "latest";

    const feed = await loadFeed(env);

    let articles = feed.articles;

    if (category !== "latest") {
      articles = articles.filter(x => x.category === category);
    }

    return json({
      ok: true,
      generatedAt: feed.generatedAt,
      articles
    }, 200, {
      "cache-control": "public, max-age=30, s-maxage=60"
    });
  }

  if (url.pathname === "/api/search") {
    const lang = getLanguage(request);
    const q = url.searchParams.get("q") || "";

    const results = await searchNews(q, lang);

    return json({
      ok: true,
      query: q,
      articles: results
    }, 200, {
      "cache-control": "public, max-age=30, s-maxage=60"
    });
  }

  if (url.pathname === "/api/market") {
    const data = await getMarketData();

    return json(data, 200, {
      "cache-control": "public, max-age=60, s-maxage=120"
    });
  }

  if (url.pathname === "/api/weather") {
    const data = await getWeather();

    return json(data, 200, {
      "cache-control": "public, max-age=300, s-maxage=600"
    });
  }

  if (url.pathname === "/api/refresh") {
    const feed = await refreshFeed(env);

    return json({
      ok: true,
      generatedAt: feed.generatedAt,
      count: feed.articles.length
    });
  }

  if (url.pathname === "/health") {
    let ai = {
      configured: Boolean(env.AI),
      ok: false,
      model: APP.aiModel,
      error: null
    };

    if (env.AI) {
      try {
        const result = await env.AI.run(
          APP.aiModel,
          {
            messages: [
              {
                role: "user",
                content: "Reply with exactly OK"
              }
            ],
            max_tokens: 5
          }
        );

        ai.ok = Boolean(extractAIText(result));
      } catch (error) {
        ai.error = String(error?.message || error);
      }
    }

    return json({
      ok: true,
      service: APP.name,
      version: APP.version,
      bindings: {
        kv: Boolean(env.NOWPULSE_KV),
        ai: Boolean(env.AI)
      },
      ai,
      cron: "enabled",
      time: new Date().toISOString()
    });
  }

  return json({
    ok: false,
    error: "API endpoint not found"
  }, 404);
}

function robotsResponse(request) {
  const origin = new URL(request.url).origin;

  return new Response(
`User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${origin}/sitemap.xml
`,
    {
      headers: {
        "content-type": "text/plain; charset=UTF-8",
        "cache-control": "public, max-age=3600"
      }
    }
  );
}

async function sitemapResponse(request, env) {
  const origin = new URL(request.url).origin;
  const feed = await loadFeed(env);

  const urls = [
    `${origin}/`,
    `${origin}/page/about`,
    `${origin}/page/privacy`,
    `${origin}/page/terms`,
    `${origin}/page/contact`
  ];

  for (const article of feed.articles.slice(0, 100)) {
    urls.push(
      `${origin}/article/${encodeURIComponent(article.id)}`
    );
  }

  const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `<url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=UTF-8",
      "cache-control": "public, max-age=1800"
    }
  });
}

async function rssResponse(request, env) {
  const origin = new URL(request.url).origin;
  const feed = await loadFeed(env);

  const items = feed.articles.slice(0, 50).map(article => {
    const link =
      `${origin}/article/${encodeURIComponent(article.id)}?lang=en`;

    return `
<item>
<title>${escapeHtml(article.title)}</title>
<link>${escapeHtml(link)}</link>
<description>${escapeHtml(article.description)}</description>
<pubDate>${new Date(article.pubDate).toUTCString()}</pubDate>
<guid>${escapeHtml(article.id)}</guid>
</item>`;
  }).join("");

  const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>NowPulse</title>
<link>${escapeHtml(origin)}</link>
<description>NowPulse latest news</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=UTF-8",
      "cache-control": "public, max-age=300"
    }
  });
}

async function pageHandler(request, env) {
  const url = new URL(request.url);
  const lang = getLanguage(request);

  if (url.pathname === "/") {
    const category = url.searchParams.get("category") || "latest";
    const valid =
      category === "latest" ||
      CATEGORIES.some(x => x.id === category);

    const feed = await loadFeed(env);

    return html(
      renderHome(
        feed,
        lang,
        valid ? category : "latest"
      ),
      200,
      {
        "cache-control": "public, max-age=20, s-maxage=60"
      }
    );
  }

  if (url.pathname === "/search") {
    return html(
      await handleSearch(request, env),
      200,
      {
        "cache-control": "public, max-age=20, s-maxage=60"
      }
    );
  }

  if (url.pathname.startsWith("/article/")) {
    const id = decodeURIComponent(
      url.pathname.substring("/article/".length)
    );

    return html(
      await renderArticle(request, env, id),
      200,
      {
        "cache-control": "public, max-age=20, s-maxage=60"
      }
    );
  }

  if (url.pathname.startsWith("/page/")) {
    const key = url.pathname.substring("/page/".length);
    const page = STATIC_PAGES[key]?.[lang];

    if (!page) {
      return html(
        renderShell({
          lang,
          title: "404 | NowPulse",
          body: `<div class="error"><h1>404</h1></div>`
        }),
        404
      );
    }

    return html(
      renderShell({
        lang,
        title: `${page.title} | NowPulse`,
        body: `
          <article class="article">
            <div class="article-head">
              <div class="article-body">
                <h1>${escapeHtml(page.title)}</h1>
                <div class="article-text">
                  ${page.body}
                </div>
              </div>
            </div>
          </article>
        `
      })
    );
  }

  return html(
    renderShell({
      lang,
      title: "404 | NowPulse",
      body: `
        <div class="error">
          <h1>404</h1>
          <p>${lang === "ar" ? "الصفحة غير موجودة." : "Page not found."}</p>
        </div>
      `
    }),
    404
  );
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      if (
        url.pathname.startsWith("/api/") ||
        url.pathname === "/health"
      ) {
        return await handleApi(request, env);
      }

      if (url.pathname === "/robots.txt") {
        return robotsResponse(request);
      }

      if (url.pathname === "/sitemap.xml") {
        return await sitemapResponse(request, env);
      }

      if (url.pathname === "/rss.xml") {
        return await rssResponse(request, env);
      }

      return await pageHandler(request, env);
    } catch (error) {
      console.error("NowPulse request error", error);

      const lang = getLanguage(request);

      return html(
        renderShell({
          lang,
          title: "NowPulse",
          body: `
            <div class="error">
              <h1>${lang === "ar" ? "حدث خطأ مؤقت" : "Temporary error"}</h1>
              <p>${lang === "ar"
                ? "تعذر تحميل هذه الصفحة حاليًا. حاول مرة أخرى."
                : "This page could not be loaded right now. Please try again."}</p>
            </div>
          `
        }),
        500
      );
    }
  },

  async scheduled(controller, env, ctx) {
    /*
     * Cron runs every five minutes.
     *
     * We deliberately use ONE KV key for the feed rather than writing
     * a new key for every article or every health check.
     *
     * This keeps KV usage under control while preserving a rolling feed.
     */
    ctx.waitUntil(
      refreshFeed(env).catch(error => {
        console.error("NowPulse scheduled refresh failed", error);
      })
    );
  }
};
