const APP = {
  name: "NowPulse",
  origin: "https://nowpulse.tavengers16.workers.dev",
  aiModel: "@cf/meta/llama-3.1-8b-instruct-fast",
  feedTtl: 900,
  maxAgeMs: 72 * 60 * 60 * 1000,
  searchMaxAgeMs: 14 * 24 * 60 * 60 * 1000
};

const CATEGORIES = {
  latest: {
    ar: "آخر الأخبار",
    en: "Latest",
    icon: "newspaper",
    tone: "news"
  },
  world: {
    ar: "العالم",
    en: "World",
    icon: "globe",
    tone: "world"
  },
  egypt: {
    ar: "مصر",
    en: "Egypt",
    icon: "flag",
    tone: "egypt"
  },
  politics: {
    ar: "سياسة",
    en: "Politics",
    icon: "landmark",
    tone: "politics"
  },
  sports: {
    ar: "رياضة",
    en: "Sports",
    icon: "trophy",
    tone: "sports"
  },
  economy: {
    ar: "اقتصاد",
    en: "Economy",
    icon: "chart",
    tone: "economy"
  },
  technology: {
    ar: "تكنولوجيا",
    en: "Technology",
    icon: "cpu",
    tone: "tech"
  },
  entertainment: {
    ar: "فن وترفيه",
    en: "Entertainment",
    icon: "film",
    tone: "entertainment"
  },
  health: {
    ar: "صحة",
    en: "Health",
    icon: "heart",
    tone: "health"
  },
  travel: {
    ar: "سفر",
    en: "Travel",
    icon: "plane",
    tone: "travel"
  }
};

const WEATHER_CITIES = {
  Cairo: [30.0444, 31.2357],
  Giza: [30.0131, 31.2089],
  Alexandria: [31.2001, 29.9187],
  Hurghada: [27.2579, 33.8116],
  Luxor: [25.6872, 32.6396],
  Aswan: [24.0889, 32.8998],
  Qena: [26.1551, 32.716],
  Sohag: [26.5591, 31.6957],
  Asyut: [27.1801, 31.1837],
  Minya: [28.1099, 30.7503],
  Suez: [29.9668, 32.5498],
  Ismailia: [30.5965, 32.2715],
  PortSaid: [31.2653, 32.3019],
  Damietta: [31.4175, 31.8144],
  Faiyum: [29.3084, 30.8428],
  Tanta: [30.7865, 31.0004],
  Mansoura: [31.0409, 31.3785],
  Zagazig: [30.5877, 31.502],
  Damanhur: [31.0341, 30.4682],
  KafrElSheikh: [31.1107, 30.9388],
  SharmElSheikh: [27.9158, 34.3299],
  MarsaAlam: [25.0676, 34.879],
  Matruh: [31.3543, 27.2373]
};

const WEATHER_NAMES = {
  Cairo: "القاهرة",
  Giza: "الجيزة",
  Alexandria: "الإسكندرية",
  Hurghada: "الغردقة",
  Luxor: "الأقصر",
  Aswan: "أسوان",
  Qena: "قنا",
  Sohag: "سوهاج",
  Asyut: "أسيوط",
  Minya: "المنيا",
  Suez: "السويس",
  Ismailia: "الإسماعيلية",
  PortSaid: "بورسعيد",
  Damietta: "دمياط",
  Faiyum: "الفيوم",
  Tanta: "طنطا",
  Mansoura: "المنصورة",
  Zagazig: "الزقازيق",
  Damanhur: "دمنهور",
  KafrElSheikh: "كفر الشيخ",
  SharmElSheikh: "شرم الشيخ",
  MarsaAlam: "مرسى علم",
  Matruh: "مرسى مطروح"
};

const QUOTES_AR = [
  "لا تؤجل خطوة تستطيع أن تبدأها اليوم.",
  "النجاح نتيجة خطوات صغيرة تتكرر كل يوم.",
  "المعرفة تفتح أبوابًا لا تفتحها القوة.",
  "الهدوء يساعدك على رؤية الصورة كاملة.",
  "كل تجربة تضيف شيئًا إلى الطريق.",
  "الوقت الذي تستثمره في التعلم لا يضيع.",
  "ابدأ بما تستطيع، ثم طوره مع الوقت.",
  "الوضوح بداية جيدة لأي قرار.",
  "الاستمرار يصنع فرقًا أكبر من البداية القوية.",
  "لا تجعل الخوف من الخطأ يمنعك من المحاولة."
];

const QUOTES_EN = [
  "Start with what you can do today.",
  "Small steps become meaningful progress.",
  "Knowledge opens doors that force cannot.",
  "Clarity is the beginning of a good decision.",
  "Consistency often matters more than a strong start.",
  "Every experience adds something to the journey.",
  "Time invested in learning is never wasted.",
  "Keep moving, then improve along the way.",
  "A calm mind sees the bigger picture.",
  "Do not let fear of mistakes stop you from trying."
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function cleanText(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\\##+/g, "")
    .replace(/^\s*#+\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }
    return url.href;
  } catch {
    return "";
  }
}

function hash(input) {
  let h = 2166136261;

  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return (h >>> 0).toString(16);
}

function timeAgo(timestamp, lang) {
  const difference = Date.now() - new Date(timestamp).getTime();

  if (!Number.isFinite(difference)) {
    return "";
  }

  const minutes = Math.max(1, Math.floor(difference / 60000));

  if (lang === "ar") {
    if (minutes < 60) {
      return `منذ ${minutes} دقيقة`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `منذ ${hours} ساعة`;
    }

    const days = Math.floor(hours / 24);

    return `منذ ${days} يوم`;
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  return `${Math.floor(hours / 24)} d ago`;
}

function xmlTag(xml, tag) {
  const regex = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`,
    "i"
  );

  return (xml.match(regex)?.[1] || "").trim();
}

function xmlAttr(block, tag, attribute) {
  const regex = new RegExp(
    `<${tag}[^>]*\\b${attribute}=["']([^"']+)["']`,
    "i"
  );

  return (block.match(regex)?.[1] || "").trim();
}

function parseRss(xml, category) {
  const items = [];

  const blocks =
    xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const block of blocks) {
    const title = cleanText(xmlTag(block, "title"));

    const link = safeUrl(xmlTag(block, "link"));

    const published =
      xmlTag(block, "pubDate") ||
      xmlTag(block, "published") ||
      xmlTag(block, "updated");

    const parsedDate = new Date(published);

    if (!Number.isFinite(parsedDate.getTime())) {
      continue;
    }

    const date = parsedDate.toISOString();

    const source =
      cleanText(xmlTag(block, "source")) ||
      cleanText(xmlTag(block, "publisher"));

    const description = cleanText(
      xmlTag(block, "description")
    );

    const enclosure =
      xmlAttr(block, "enclosure", "url");

    const media =
      xmlAttr(block, "media:content", "url") ||
      xmlAttr(block, "media:thumbnail", "url");

    if (!title || !link) {
      continue;
    }

    items.push({
      id: "n" + hash(link + title),
      title,
      link,
      source,
      description,
      publishedAt: date,
      category,
      image: safeUrl(enclosure || media)
    });
  }

  return items;
}

async function fetchText(url, timeout = 6500) {
  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeout
  );

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "NowPulse/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function newsFeed(query, category, lang) {
  const encoded = encodeURIComponent(query);

  const url =
    `https://news.google.com/rss/search?q=${encoded}` +
    `&hl=${lang === "ar" ? "ar" : "en"}` +
    `&gl=EG&ceid=EG:${lang === "ar" ? "ar" : "en"}`;

  try {
    const xml = await fetchText(url);
    return parseRss(xml, category);
  } catch {
    return [];
  }
}

function dedupe(items) {
  const map = new Map();

  for (const item of items) {
    const key = cleanText(item.title)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();

    const previous = map.get(key);

    if (
      !previous ||
      new Date(item.publishedAt) >
        new Date(previous.publishedAt)
    ) {
      map.set(key, item);
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      new Date(b.publishedAt) -
      new Date(a.publishedAt)
  );
}

function recent(items, maxAge) {
  const now = Date.now();

  return items.filter(item => {
    const time =
      new Date(item.publishedAt).getTime();

    return (
      Number.isFinite(time) &&
      now - time <= maxAge
    );
  });
}

function categoryQueries(lang) {
  if (lang === "en") {
    return {
      latest: [
        "latest Egypt news",
        "latest world news",
        "breaking news"
      ],
      world: ["world breaking news"],
      egypt: ["Egypt breaking news"],
      politics: ["Egypt politics latest"],
      sports: [
        "Egypt sports latest",
        "football latest"
      ],
      economy: [
        "Egypt economy latest",
        "Egypt markets"
      ],
      technology: [
        "technology latest",
        "AI technology latest"
      ],
      entertainment: [
        "entertainment latest Egypt"
      ],
      health: [
        "health latest Egypt"
      ],
      travel: [
        "travel Egypt latest"
      ]
    };
  }

  return {
    latest: [
      "أحدث الأخبار مصر",
      "أخبار العالم العاجلة"
    ],
    world: [
      "أخبار العالم العاجلة"
    ],
    egypt: [
      "أخبار مصر العاجلة"
    ],
    politics: [
      "أخبار السياسة مصر"
    ],
    sports: [
      "أخبار الرياضة مصر",
      "كرة القدم اليوم"
    ],
    economy: [
      "أخبار الاقتصاد مصر",
      "أسعار الأسواق مصر"
    ],
    technology: [
      "أخبار التكنولوجيا والذكاء الاصطناعي"
    ],
    entertainment: [
      "أخبار الفن والترفيه"
    ],
    health: [
      "أخبار الصحة مصر"
    ],
    travel: [
      "أخبار السفر والسياحة"
    ]
  };
}

async function loadCategory(category, lang) {
  const queries =
    categoryQueries(lang)[category] ||
    categoryQueries(lang).latest;

  const groups = await Promise.all(
    queries.map(query =>
      newsFeed(query, category, lang)
    )
  );

  return dedupe(groups.flat())
    .filter(
      item =>
        Date.now() -
          new Date(item.publishedAt).getTime() <=
        APP.maxAgeMs
    )
    .slice(0, 24);
}

async function extractImage(pageUrl) {
  try {
    const html = await fetchText(pageUrl, 5000);

    const patterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      /"image"\s*:\s*"([^"]+)"/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);

      if (!match?.[1]) {
        continue;
      }

      const image = safeUrl(
        match[1].replace(/\\\//g, "/")
      );

      if (image) {
        return image;
      }
    }
  } catch {}

  return "";
}

async function wikiImage(query) {
  try {
    const url =
      "https://commons.wikimedia.org/w/api.php" +
      "?action=query" +
      "&generator=search" +
      "&gsrsearch=" +
      encodeURIComponent(query) +
      "&gsrnamespace=6" +
      "&gsrlimit=1" +
      "&prop=imageinfo" +
      "&iiprop=url" +
      "&format=json" +
      "&origin=*";

    const response = await fetch(url, {
      headers: {
        "User-Agent": "NowPulse/1.0"
      }
    });

    const data = await response.json();

    const page =
      Object.values(
        data.query?.pages || {}
      )[0];

    return safeUrl(
      page?.imageinfo?.[0]?.url || ""
    );
  } catch {
    return "";
  }
}

async function enrichImages(items) {
  return Promise.all(
    items.map(async item => {
      if (item.image) {
        return item;
      }

      const image =
        await extractImage(item.link) ||
        await wikiImage(item.title);

      return {
        ...item,
        image
      };
    })
  );
}

function normalizeSearchQuery(query) {
  return cleanText(query).slice(0, 120);
}

async function searchNews(query, lang) {
  const normalized =
    normalizeSearchQuery(query);

  if (!normalized) {
    return [];
  }

  const variants =
    lang === "ar"
      ? [
          normalized,
          `${normalized} أخبار`,
          `${normalized} news`
        ]
      : [
          normalized,
          `${normalized} latest news`,
          `${normalized} أخبار`
        ];

  const groups = await Promise.all(
    variants.map(item =>
      newsFeed(item, "latest", lang)
    )
  );

  return dedupe(
    recent(
      groups.flat(),
      APP.searchMaxAgeMs
    )
  ).slice(0, 40);
}

async function aiArticle(
  env,
  item,
  related,
  lang
) {
  if (!env.AI) {
    return null;
  }

  const sources = [
    item,
    ...related.slice(0, 5)
  ]
    .map(
      (source, index) =>
        `${index + 1}. ${source.title}\n` +
        `Source: ${source.source || "unknown"}\n` +
        `Time: ${source.publishedAt}\n` +
        `Description: ${source.description || ""}`
    )
    .join("\n\n");

  const prompt =
    lang === "ar"
      ? `اكتب مقالًا إخباريًا عربيًا أصليًا كاملًا اعتمادًا فقط على المعلومات الموجودة في المصادر التالية.

القواعد:
- لا تخترع أي حقيقة.
- لا تخترع أرقامًا.
- لا تخترع تصريحات.
- لا تنسب معلومة إلى مصدر لم يذكرها.
- إذا اختلفت المصادر، اذكر وجود الاختلاف.
- لا تنسخ صياغة أي مصدر.
- لا تضع روابط.
- لا تضع HTML.
- اكتب عنوانًا ثم 5 إلى 9 فقرات.
- اجعل المقال قابلًا للقراءة كخبر حقيقي.
- استخدم المعلومات المشتركة والمؤكدة باعتبارها أساس المقال.

المصادر:

${sources}`
      : `Write a complete original English news article using only the information in the sources below.

Rules:
- Never invent facts.
- Never invent numbers.
- Never invent quotes.
- Never attribute information to a source that did not provide it.
- If sources conflict, mention the conflict.
- Do not copy any publisher wording.
- Do not include links.
- Do not include HTML.
- Write a headline and 5 to 9 readable paragraphs.
- Use repeated and supported information as the factual core.

Sources:

${sources}`;

  try {
    const result = await env.AI.run(
      APP.aiModel,
      {
        messages: [
          {
            role: "system",
            content:
              "You are NowPulse editorial AI. " +
              "Facts must come only from supplied sources. " +
              "Never fabricate."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1600
      }
    );

    return cleanText(
      result?.response ||
      result?.result ||
      ""
    );
  } catch {
    return null;
  }
}

function fallbackArticle(item, lang) {
  const intro =
    lang === "ar"
      ? `يتناول هذا التقرير أحدث المعلومات المتاحة حول: ${item.title}.`
      : `This report covers the latest available information about: ${item.title}.`;

  const body =
    item.description ||
    (
      lang === "ar"
        ? "تتوفر المعلومات الأولية من المصدر المشار إليه، وسيتم تحديث التقرير مع ظهور تفاصيل موثوقة جديدة."
        : "Initial information is available from the referenced source and the report can be updated as verified details emerge."
    );

  const closing =
    lang === "ar"
      ? "يستند NowPulse في هذا التقرير إلى المعلومات المتاحة وقت النشر، مع تجنب إضافة تفاصيل غير مؤكدة."
      : "NowPulse bases this report on information available at publication time and avoids adding unverified details.";

  return `${intro}\n\n${body}\n\n${closing}`;
}

function svgIcon(name) {
  const paths = {
    newspaper:
      '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6M7 16h10"/>',

    globe:
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',

    flag:
      '<path d="M6 21V3M6 4c5-3 8 3 12 0v8c-4 3-7-3-12 0"/>',

    landmark:
      '<path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18M12 3l9 5H3z"/>',

    trophy:
      '<path d="M8 4h8v5a4 4 0 0 1-8 0zM12 13v4M8 20h8M6 6H3v2a4 4 0 0 0 4 4M18 6h3v2a4 4 0 0 1-4 4"/>',

    chart:
      '<path d="M4 19V9M10 19V5M16 19v-8M22 19H2"/>',

    cpu:
      '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',

    film:
      '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v16M16 4v16M4 8h4M16 8h4M4 16h4M16 16h4"/>',

    heart:
      '<path d="M20 8c0 6-8 11-8 11S4 14 4 8a4 4 0 0 1 7-2 4 4 0 0 1 9 2z"/>',

    plane:
      '<path d="M3 12l18-7-7 18-3-8-8-3zM11 15l-3 3"/>',

    search:
      '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',

    moon:
      '<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5z"/>'
  };

  return `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      ${paths[name] || paths.newspaper}
    </svg>
  `;
}

function weatherIcon(code) {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code >= 95) return "⛈️";
  if (code >= 51) return "🌧️";
  return "🌫️";
}

function weatherLabel(code, lang) {
  const ar = {
    0: "صافي",
    1: "غائم جزئيًا",
    2: "غائم جزئيًا",
    3: "غائم",
    45: "ضباب",
    48: "ضباب",
    51: "رذاذ",
    53: "رذاذ",
    55: "رذاذ",
    61: "مطر",
    63: "مطر",
    65: "أمطار غزيرة",
    71: "ثلوج",
    73: "ثلوج",
    75: "ثلوج غزيرة",
    80: "زخات مطر",
    81: "زخات مطر",
    82: "زخات قوية",
    95: "عواصف رعدية"
  };

  const en = {
    0: "Clear",
    1: "Partly cloudy",
    2: "Partly cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Fog",
    51: "Drizzle",
    53: "Drizzle",
    55: "Drizzle",
    61: "Rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy showers",
    95: "Thunderstorms"
  };

  return (
    lang === "ar" ? ar : en
  )[code] ||
    (lang === "ar"
      ? "حالة جوية"
      : "Weather");
}

async function getWeather(city = "Cairo") {
  const key =
    Object.keys(WEATHER_CITIES).find(
      item =>
        item.toLowerCase() ===
        String(city).toLowerCase()
    ) || "Cairo";

  const [latitude, longitude] =
    WEATHER_CITIES[key];

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
      `&timezone=Africa%2FCairo` +
      `&forecast_days=5`;

    const response = await fetch(url);
    const data = await response.json();

    return {
      city: key,
      name: WEATHER_NAMES[key] || key,
      current: data.current,
      daily: data.daily
    };
  } catch {
    return {
      city: key,
      name: WEATHER_NAMES[key] || key,
      current: null,
      daily: null
    };
  }
}

async function getMarket() {
  const result = {
    gold: null,
    silver: null,
    fx: {}
  };

  try {
    const response =
      await fetch(
        "https://api.gold-api.com/price/XAU"
      );

    const data =
      await response.json();

    result.gold =
      Number(
        data.price ||
        data.rate ||
        data.value
      ) || null;
  } catch {}

  try {
    const response =
      await fetch(
        "https://api.gold-api.com/price/XAG"
      );

    const data =
      await response.json();

    result.silver =
      Number(
        data.price ||
        data.rate ||
        data.value
      ) || null;
  } catch {}

  try {
    const response =
      await fetch(
        "https://open.er-api.com/v6/latest/USD"
      );

    const data =
      await response.json();

    for (
      const currency of [
        "EGP",
        "EUR",
        "GBP",
        "SAR",
        "AED"
      ]
    ) {
      if (
        Number(data.rates?.[currency])
      ) {
        result.fx[currency] =
          Number(data.rates[currency]);
      }
    }
  } catch {}

  return result;
}

function trendTopics(items, lang) {
  const stopWords =
    lang === "ar"
      ? new Set(
          "من في على عن إلى هذا هذه ذلك التي الذي مع بعد قبل كان تكون تم قد حيث لدى كما بين خبر أخبار مصر اليوم"
            .split(" ")
        )
      : new Set(
          "the a an of in on for to from and or is are was were with this that latest news egypt"
            .split(" ")
        );

  const counts = new Map();

  for (const item of items) {
    const words = cleanText(item.title)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(
        word =>
          word.length >= 3 &&
          !stopWords.has(word)
      );

    const unique =
      [...new Set(words)].slice(0, 10);

    for (const word of unique) {
      counts.set(
        word,
        (counts.get(word) || 0) + 1
      );
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      count
    }));
}

function card(item, lang, featured = false) {
  const category =
    CATEGORIES[item.category] ||
    CATEGORIES.latest;

  const href =
    `/article/${encodeURIComponent(item.id)}` +
    `?lang=${lang}` +
    `&q=${encodeURIComponent(item.title)}`;

  const directImage =
    item.image
      ? safeUrl(item.image)
      : "";

  const imageSrc =
    directImage
      ? "/api/image?url=" +
        encodeURIComponent(directImage)
      : "/api/resolve-image?url=" +
        encodeURIComponent(item.link) +
        "&q=" +
        encodeURIComponent(item.title);

  return `
    <article
      class="story ${featured ? "featured" : ""} tone-${category.tone}"
    >
      <a
        class="story-link"
        href="${href}"
      >
        <div class="story-media">
          <img
            src="${esc(imageSrc)}"
            alt=""
            loading="${featured ? "eager" : "lazy"}"
            decoding="async"
            referrerpolicy="no-referrer"
            onerror="this.closest('.story-media').classList.add('no-image');this.remove()"
          >
          <span class="media-fallback">
            ${svgIcon(category.icon)}
          </span>
        </div>

        <div class="story-body">
          <div class="story-meta">
            <span class="badge">
              ${esc(
                lang === "ar"
                  ? category.ar
                  : category.en
              )}
            </span>

            <span>
              ${esc(
                timeAgo(
                  item.publishedAt,
                  lang
                )
              )}
            </span>
          </div>

          <h2>
            ${esc(item.title)}
          </h2>

          <p>
            ${esc(
              item.description || ""
            )}
          </p>

          <span class="source">
            ${esc(
              item.source ||
                "NowPulse"
            )}
          </span>
        </div>
      </a>
    </article>
  `;
}

function quoteBox(lang) {
  const quote =
    lang === "ar"
      ? QUOTES_AR[0]
      : QUOTES_EN[0];

  return `
    <div class="quote">
      <div class="quote-label">
        ${
          lang === "ar"
            ? "كلمة اليوم"
            : "THOUGHT OF THE MOMENT"
        }
      </div>

      <div class="quote-text">
        ${esc(quote)}
      </div>
    </div>
  `;
}

function shell({
  lang = "ar",
  title = APP.name,
  content = "",
  active = "",
  description = ""
}) {
  const arabic = lang === "ar";

  const navigation =
    Object.entries(CATEGORIES)
      .map(
        ([key, category]) => `
          <a
            class="nav-item ${
              active === key
                ? "active"
                : ""
            } tone-${category.tone}"
            href="/?category=${key}&lang=${lang}"
          >
            <span class="nav-icon">
              ${svgIcon(category.icon)}
            </span>

            <span>
              ${
                arabic
                  ? category.ar
                  : category.en
              }
            </span>
          </a>
        `
      )
      .join("");

  return `
<!doctype html>
<html
  lang="${lang}"
  dir="${arabic ? "rtl" : "ltr"}"
>
<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>

<title>
  ${esc(title)} | NowPulse
</title>

<meta
  name="description"
  content="${esc(
    description ||
      (arabic
        ? "NowPulse منصة أخبار ومعلومات حديثة."
        : "NowPulse news and information platform.")
  )}"
>

<meta
  name="theme-color"
  content="#0b1020"
>

<link
  rel="canonical"
  href="${esc(APP.origin + "/")}"
>

<style>

:root{
  --bg:#f4f6fb;
  --panel:#ffffff;
  --text:#101522;
  --muted:#6c7485;
  --line:#e7eaf1;
  --accent:#5267ff;
  --shadow:0 10px 35px rgba(22,30,55,.08);
  --radius:22px;
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
    "Segoe UI",
    Tahoma,
    Arial,
    sans-serif;
}

body.dark{
  --bg:#090d17;
  --panel:#111827;
  --text:#f5f7fb;
  --muted:#9ba5b8;
  --line:#20283a;
  --accent:#8291ff;
  --shadow:0 14px 40px rgba(0,0,0,.28);
}

a{
  text-decoration:none;
  color:inherit;
}

button,
input,
select{
  font:inherit;
}

.top{
  position:sticky;
  top:0;
  z-index:50;
  background:
    color-mix(
      in srgb,
      var(--panel) 92%,
      transparent
    );
  backdrop-filter:blur(16px);
  border-bottom:1px solid var(--line);
}

.top-in{
  max-width:1440px;
  margin:auto;
  padding:13px 24px;
  display:flex;
  align-items:center;
  gap:14px;
}

.logo{
  font-weight:900;
  font-size:25px;
  letter-spacing:-1px;
  margin-inline-end:auto;
}

.logo b{
  color:var(--accent);
}

.search{
  display:flex;
  align-items:center;
  gap:8px;
  background:var(--bg);
  border:1px solid var(--line);
  border-radius:15px;
  padding:7px 10px;
  width:min(390px,38vw);
}

.search input{
  border:0;
  outline:0;
  background:transparent;
  color:var(--text);
  min-width:0;
  width:100%;
}

.icon-btn,
.lang-btn{
  border:1px solid var(--line);
  background:var(--panel);
  color:var(--text);
  height:42px;
  min-width:42px;
  border-radius:13px;
  display:grid;
  place-items:center;
  cursor:pointer;
}

.icon-btn svg,
.search svg,
.nav-icon svg{
  width:20px;
  height:20px;
  fill:none;
  stroke:currentColor;
  stroke-width:1.8;
  stroke-linecap:round;
  stroke-linejoin:round;
}

.lang-btn{
  padding:0 13px;
  font-weight:800;
}

.wrap{
  max-width:1440px;
  margin:auto;
  padding:22px 24px 60px;
}

.nav{
  display:flex;
  gap:10px;
  overflow:auto;
  padding:4px 1px 13px;
  scrollbar-width:none;
}

.nav::-webkit-scrollbar{
  display:none;
}

.nav-item{
  min-width:max-content;
  display:flex;
  align-items:center;
  gap:8px;
  padding:10px 13px;
  border:1px solid var(--line);
  border-radius:15px;
  background:var(--panel);
  color:var(--muted);
  font-weight:750;
  transition:.2s;
}

.nav-item:hover,
.nav-item.active{
  color:var(--text);
  transform:translateY(-1px);
  box-shadow:var(--shadow);
}

.nav-icon{
  width:27px;
  height:27px;
  border-radius:9px;
  display:grid;
  place-items:center;
  background:var(--bg);
}

.hero{
  display:grid;
  grid-template-columns:
    minmax(0,1.6fr)
    minmax(320px,.8fr);
  gap:20px;
  margin-top:8px;
}

.hero-main,
.side-panel,
.quote,
.market,
.weather,
.trend,
.section{
  background:var(--panel);
  border:1px solid var(--line);
  border-radius:var(--radius);
  box-shadow:var(--shadow);
}

.hero-main{
  overflow:hidden;
}

.hero-main .story-media{
  height:410px;
}

.hero-main h2{
  font-size:clamp(25px,3vw,42px);
  line-height:1.12;
}

.hero-main .story-body{
  padding:22px;
}

.side{
  display:grid;
  gap:16px;
}

.quote{
  padding:24px;
  min-height:160px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  background:
    linear-gradient(
      135deg,
      var(--panel),
      color-mix(
        in srgb,
        var(--accent) 8%,
        var(--panel)
      )
    );
}

.quote-label{
  font-size:12px;
  color:var(--accent);
  font-weight:900;
  letter-spacing:.08em;
}

.quote-text{
  font-size:22px;
  line-height:1.55;
  font-weight:800;
  margin:10px 0 0;
  transition:opacity .22s ease;
}

.dashboard{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:16px;
  margin-top:16px;
}

.market,
.weather,
.trend{
  padding:18px;
}

.panel-title{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:13px;
}

.panel-title h3{
  margin:0;
  font-size:18px;
}

.panel-title a{
  color:var(--accent);
  font-size:13px;
  font-weight:800;
}

.market-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:9px;
}

.market-item{
  padding:11px;
  border-radius:14px;
  background:var(--bg);
  border:1px solid var(--line);
}

.market-item small{
  display:block;
  color:var(--muted);
  font-weight:700;
}

.market-item strong{
  display:block;
  margin-top:4px;
  font-size:16px;
}

.weather-row{
  display:flex;
  align-items:center;
  gap:12px;
}

.weather-temp{
  font-size:34px;
  font-weight:900;
}

.weather-city{
  font-weight:850;
}

.weather-muted{
  color:var(--muted);
  font-size:13px;
}

.trend-list{
  display:grid;
  gap:8px;
}

.trend-item{
  display:flex;
  justify-content:space-between;
  padding:10px 12px;
  background:var(--bg);
  border-radius:12px;
}

.trend-item strong{
  color:var(--accent);
}

.section{
  margin-top:22px;
  padding:20px;
}

.section-head{
  display:flex;
  align-items:end;
  justify-content:space-between;
  margin-bottom:15px;
}

.section-head h1,
.section-head h2{
  margin:0;
  font-size:26px;
}

.section-head p{
  margin:0;
  color:var(--muted);
}

.grid{
  display:grid;
  grid-template-columns:
    repeat(3,minmax(0,1fr));
  gap:16px;
}

.story{
  background:var(--panel);
  border:1px solid var(--line);
  border-radius:19px;
  overflow:hidden;
  min-width:0;
}

.story-link{
  display:block;
  height:100%;
}

.story-media{
  position:relative;
  background:
    linear-gradient(
      135deg,
      #e9edf7,
      #d8deed
    );
  aspect-ratio:16/9;
  overflow:hidden;
  display:grid;
  place-items:center;
}

.story-media img{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}

.media-fallback{
  display:grid;
  place-items:center;
  color:#fff;
  background:
    linear-gradient(
      135deg,
      #34405f,
      #6777a8
    );
  width:100%;
  height:100%;
}

.media-fallback svg{
  width:48px;
  height:48px;
  fill:none;
  stroke:currentColor;
  stroke-width:1.5;
}

.story-media:not(.no-image)
.media-fallback{
  display:none;
}

.story-body{
  padding:15px;
}

.story-meta{
  display:flex;
  align-items:center;
  gap:8px;
  color:var(--muted);
  font-size:12px;
  margin-bottom:8px;
}

.badge{
  font-weight:850;
  padding:4px 8px;
  border-radius:999px;
  background:
    color-mix(
      in srgb,
      var(--accent) 10%,
      var(--panel)
    );
  color:var(--accent);
}

.story h2{
  font-size:18px;
  line-height:1.4;
  margin:0 0 7px;
}

.story p{
  font-size:13px;
  line-height:1.65;
  color:var(--muted);
  margin:0 0 9px;
  display:-webkit-box;
  -webkit-line-clamp:3;
  -webkit-box-orient:vertical;
  overflow:hidden;
}

.source{
  font-size:11px;
  color:var(--muted);
}

.featured{
  grid-column:span 2;
}

.featured .story-body{
  padding:18px;
}

.featured h2{
  font-size:25px;
}

.article{
  max-width:930px;
  margin:22px auto;
  background:var(--panel);
  border:1px solid var(--line);
  border-radius:26px;
  overflow:hidden;
  box-shadow:var(--shadow);
}

.article-cover{
  width:100%;
  aspect-ratio:16/8;
  object-fit:cover;
  background:#dfe4ef;
  display:block;
}

.article-head{
  padding:28px 30px 10px;
}

.article h1{
  font-size:clamp(29px,4vw,48px);
  line-height:1.15;
  margin:0 0 14px;
}

.article-meta{
  color:var(--muted);
  font-size:13px;
}

.article-body{
  padding:10px 30px 35px;
  font-size:19px;
  line-height:2;
}

.article-body p{
  margin:0 0 22px;
}

.search-page{
  max-width:1100px;
  margin:auto;
}

.weather-page,
.market-page{
  max-width:1000px;
  margin:auto;
}

.city-select{
  padding:12px 14px;
  border:1px solid var(--line);
  border-radius:13px;
  background:var(--panel);
  color:var(--text);
}

.forecast{
  display:grid;
  grid-template-columns:
    repeat(5,1fr);
  gap:10px;
  margin-top:18px;
}

.day{
  background:var(--bg);
  border:1px solid var(--line);
  border-radius:16px;
  padding:14px;
  text-align:center;
}

.footer{
  max-width:1440px;
  margin:auto;
  padding:30px 24px;
  color:var(--muted);
  border-top:1px solid var(--line);
  display:flex;
  justify-content:space-between;
  gap:15px;
  flex-wrap:wrap;
}

.footer a{
  margin-inline:6px;
}

.created{
  font-weight:900;
  color:var(--text);
}

.empty{
  padding:50px;
  text-align:center;
  color:var(--muted);
}

@media(max-width:1050px){

  .hero{
    grid-template-columns:1fr;
  }

  .dashboard{
    grid-template-columns:1fr;
  }

  .grid{
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }

  .featured{
    grid-column:span 2;
  }

  .hero-main .story-media{
    height:350px;
  }

}

@media(max-width:700px){

  .top-in{
    padding:10px 13px;
    gap:8px;
    flex-wrap:wrap;
  }

  .logo{
    font-size:21px;
  }

  .search{
    order:5;
    width:100%;
    flex-basis:100%;
  }

  .wrap{
    padding:12px 12px 40px;
  }

  .nav{
    margin-inline:-12px;
    padding-inline:12px;
  }

  .nav-item{
    padding:8px 10px;
    font-size:13px;
  }

  .nav-icon{
    width:25px;
    height:25px;
  }

  .hero{
    margin-top:5px;
  }

  .hero-main .story-media{
    height:auto;
    aspect-ratio:16/10;
  }

  .hero-main h2{
    font-size:24px;
  }

  .dashboard{
    gap:10px;
  }

  .market-grid{
    grid-template-columns:
      repeat(2,1fr);
  }

  .grid{
    grid-template-columns:1fr;
    gap:11px;
  }

  .featured{
    grid-column:auto;
  }

  .story{
    border-radius:17px;
  }

  .story-link{
    display:grid;
    grid-template-columns:
      132px minmax(0,1fr);
  }

  .story-media{
    aspect-ratio:1/1;
  }

  .featured .story-link{
    display:block;
  }

  .featured .story-media{
    aspect-ratio:16/10;
  }

  .story-body{
    padding:12px;
  }

  .story h2,
  .featured h2{
    font-size:16px;
  }

  .story p{
    display:none;
  }

  .story-meta{
    font-size:10px;
  }

  .section{
    padding:14px;
    border-radius:18px;
  }

  .section-head h1,
  .section-head h2{
    font-size:21px;
  }

  .article{
    margin:10px 0;
    border-radius:20px;
  }

  .article-head{
    padding:22px 18px 8px;
  }

  .article-body{
    padding:8px 18px 28px;
    font-size:17px;
    line-height:1.9;
  }

  .forecast{
    grid-template-columns:
      repeat(2,1fr);
  }

  .footer{
    padding:24px 13px;
    font-size:12px;
  }

}

</style>

</head>

<body>

<header class="top">

  <div class="top-in">

    <a
      class="logo"
      href="/?lang=${lang}"
    >
      Now<b>Pulse</b>
    </a>

    <form
      class="search"
      action="/search"
      method="get"
    >

      <input
        name="q"
        placeholder="${
          arabic
            ? "ابحث عن أي شخص أو موضوع..."
            : "Search any person or topic..."
        }"
        required
      >

      <input
        type="hidden"
        name="lang"
        value="${lang}"
      >

      ${svgIcon("search")}

    </form>

    <button
      class="icon-btn"
      id="theme"
      aria-label="theme"
    >
      ${svgIcon("moon")}
    </button>

    <a
      class="lang-btn"
      href="${arabic ? "?lang=en" : "?lang=ar"}"
    >
      ${arabic ? "EN" : "عربي"}
    </a>

  </div>

</header>

<main class="wrap">

  <nav class="nav">
    ${navigation}
  </nav>

  ${content}

</main>

<footer class="footer">

  <div>

    <a href="/?lang=${lang}">
      ${arabic ? "الرئيسية" : "Home"}
    </a>

    <a href="/page/about?lang=${lang}">
      ${arabic ? "عن الموقع" : "About"}
    </a>

    <a href="/page/privacy?lang=${lang}">
      ${arabic ? "الخصوصية" : "Privacy"}
    </a>

    <a href="/page/terms?lang=${lang}">
      ${arabic ? "الشروط" : "Terms"}
    </a>

    <a href="/page/contact?lang=${lang}">
      ${arabic ? "اتصل بنا" : "Contact"}
    </a>

  </div>

  <div class="created">
    Created by Taha
  </div>

</footer>

<script>

(function(){

  const body =
    document.body;

  const storageKey =
    "np-theme";

  if(
    localStorage.getItem(storageKey)
    === "dark"
  ){
    body.classList.add("dark");
  }

  const button =
    document.getElementById("theme");

  if(button){

    button.onclick =
      function(){

        body.classList.toggle("dark");

        localStorage.setItem(
          storageKey,
          body.classList.contains("dark")
            ? "dark"
            : "light"
        );

      };

  }

  const quote =
    document.querySelector(
      ".quote-text"
    );

  if(quote){

    const arabic =
      ${JSON.stringify(arabic)};

    const quotes =
      arabic
        ? ${JSON.stringify(QUOTES_AR)}
        : ${JSON.stringify(QUOTES_EN)};

    let index = 0;

    setInterval(
      function(){

        quote.style.opacity = "0";

        setTimeout(
          function(){

            index =
              (index + 1) %
              quotes.length;

            quote.textContent =
              quotes[index];

            quote.style.opacity = "1";

          },
          220
        );

      },
      30000
    );

  }

})();

</script>

</body>
</html>
`;
}

async function home(
  env,
  lang,
  category
) {
  const categories =
    category &&
    category !== "latest"
      ? [category]
      : [
          "latest",
          "sports",
          "economy",
          "technology"
        ];

  const groups =
    await Promise.all(
      categories.map(
        item =>
          loadCategory(
            item,
            lang
          )
      )
    );

  let items =
    dedupe(groups.flat());

  if(
    category &&
    category !== "latest"
  ){
    items =
      groups[0] || [];
  }

  items =
    recent(
      items,
      APP.maxAgeMs
    ).slice(0,30);

  const featured =
    items[0];

  const trends =
    trendTopics(
      items,
      lang
    );

  const rest =
    items.slice(1,16);

  const title =
    category &&
    CATEGORIES[category]
      ? (
          lang === "ar"
            ? CATEGORIES[category].ar
            : CATEGORIES[category].en
        )
      : (
          lang === "ar"
            ? "آخر الأخبار"
            : "Latest News"
        );

  const content = `

<section class="hero">

  ${
    featured
      ? `
        <div class="hero-main">
          ${card(
            featured,
            lang,
            true
          )}
        </div>
      `
      : `
        <div class="hero-main empty">
          ${
            lang === "ar"
              ? "لا توجد أخبار حديثة متاحة الآن."
              : "No recent news is available right now."
          }
        </div>
      `
  }

  <div class="side">

    ${quoteBox(lang)}

    <div class="trend">

      <div class="panel-title">

        <h3>
          ${
            lang === "ar"
              ? "🔥 الترند الآن"
              : "🔥 Trending now"
          }
        </h3>

      </div>

      <div class="trend-list">

        ${
          trends.length
            ? trends
                .map(
                  (trend, index) => `
                    <div class="trend-item">
                      <span>
                        ${index + 1}.
                        ${esc(trend.name)}
                      </span>

                      <strong>
                        ${trend.count}
                      </strong>
                    </div>
                  `
                )
                .join("")
            : `
              <div class="empty">
                ${
                  lang === "ar"
                    ? "يتم تحديث الترند..."
                    : "Updating trends..."
                }
              </div>
            `
        }

      </div>

    </div>

  </div>

</section>

<section class="dashboard">

  <div
    class="market"
    id="market-mini"
  >

    <div class="panel-title">

      <h3>
        💰 ${
          lang === "ar"
            ? "الأسواق"
            : "Markets"
        }
      </h3>

      <a href="/markets?lang=${lang}">
        ${
          lang === "ar"
            ? "عرض الكل"
            : "View all"
        }
      </a>

    </div>

    <div class="market-grid">

      <div class="market-item">
        <small>Gold XAU</small>
        <strong id="gold">—</strong>
      </div>

      <div class="market-item">
        <small>USD / EGP</small>
        <strong id="usd">—</strong>
      </div>

      <div class="market-item">
        <small>EUR / EGP</small>
        <strong id="eur">—</strong>
      </div>

      <div class="market-item">
        <small>GBP / EGP</small>
        <strong id="gbp">—</strong>
      </div>

      <div class="market-item">
        <small>SAR / EGP</small>
        <strong id="sar">—</strong>
      </div>

      <div class="market-item">
        <small>AED / EGP</small>
        <strong id="aed">—</strong>
      </div>

    </div>

  </div>

  <div
    class="weather"
    id="weather-mini"
  >

    <div class="panel-title">

      <h3>
        🌤️ ${
          lang === "ar"
            ? "الطقس"
            : "Weather"
        }
      </h3>

      <a href="/weather?lang=${lang}">
        ${
          lang === "ar"
            ? "كل المدن"
            : "All cities"
        }
      </a>

    </div>

    <div class="weather-row">

      <div
        class="weather-temp"
        id="wtemp"
      >
        —
      </div>

      <div>

        <div
          class="weather-city"
          id="wcity"
        >
          ${
            lang === "ar"
              ? "القاهرة"
              : "Cairo"
          }
        </div>

        <div
          class="weather-muted"
          id="wdesc"
        >
          ${
            lang === "ar"
              ? "جارٍ التحميل..."
              : "Loading..."
          }
        </div>

      </div>

    </div>

  </div>

</section>

<section class="section">

  <div class="section-head">

    <div>

      <h1>
        ${esc(title)}
      </h1>

      <p>
        ${
          lang === "ar"
            ? "أخبار حديثة مرتبة حسب الصلة والوقت."
            : "Recent news ordered by relevance and time."
        }
      </p>

    </div>

  </div>

  <div class="grid">

    ${
      rest.length
        ? rest
            .map(
              item =>
                card(
                  item,
                  lang
                )
            )
            .join("")
        : `
          <div class="empty">
            ${
              lang === "ar"
                ? "لا توجد نتائج حديثة."
                : "No recent results."
            }
          </div>
        `
    }

  </div>

</section>

<script>

Promise.all([

  fetch("/api/market")
    .then(response =>
      response.json()
    )
    .catch(() => null),

  fetch(
    "/api/weather?city=Cairo&lang=${lang}"
  )
    .then(response =>
      response.json()
    )
    .catch(() => null)

])

.then(function(results){

  const market =
    results[0];

  const weather =
    results[1];

  if(market){

    const gold =
      document.getElementById(
        "gold"
      );

    const usd =
      document.getElementById(
        "usd"
      );

    const eur =
      document.getElementById(
        "eur"
      );

    const gbp =
      document.getElementById(
        "gbp"
      );

    const sar =
      document.getElementById(
        "sar"
      );

    const aed =
      document.getElementById(
        "aed"
      );

    if(gold){

      gold.textContent =
        market.gold
          ? "$" +
            Number(
              market.gold
            ).toLocaleString(
              undefined,
              {
                maximumFractionDigits:1
              }
            )
          : "—";

    }

    const fields = [
      [usd,"EGP"],
      [eur,"EUR"],
      [gbp,"GBP"],
      [sar,"SAR"],
      [aed,"AED"]
    ];

    for(
      const field of fields
    ){

      if(
        field[0] &&
        market.fx &&
        market.fx[field[1]]
      ){

        field[0].textContent =
          Number(
            market.fx[field[1]]
          ).toFixed(2);

      }

    }

  }

  if(
    weather &&
    weather.current
  ){

    const temp =
      document.getElementById(
        "wtemp"
      );

    const city =
      document.getElementById(
        "wcity"
      );

    const description =
      document.getElementById(
        "wdesc"
      );

    if(temp){

      temp.textContent =
        Number(
          weather.current
            .temperature_2m
        ).toFixed(1) +
        "°";

    }

    if(city){

      city.textContent =
        weather.name;

    }

    if(description){

      description.textContent =
        ${
          lang === "ar"
            ? JSON.stringify("الرطوبة")
            : JSON.stringify("Humidity")
        } +
        " " +
        weather.current
          .relative_humidity_2m +
        "% · " +
        ${
          lang === "ar"
            ? JSON.stringify("الإحساس")
            : JSON.stringify("Feels like")
        } +
        " " +
        Number(
          weather.current
            .apparent_temperature
        ).toFixed(1) +
        "°";

    }

  }

});

</script>

`;

  return shell({
    lang,
    title,
    active:
      category || "latest",
    content
  });
}

async function searchPage(
  env,
  lang,
  query
) {
  const items =
    await searchNews(
      query,
      lang
    );

  const content = `

<section class="section search-page">

  <div class="section-head">

    <div>

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

  ${
    items.length
      ? `
        <div class="grid">
          ${items
            .map(
              item =>
                card(
                  item,
                  lang
                )
            )
            .join("")}
        </div>
      `
      : `
        <div class="empty">

          ${
            lang === "ar"
              ? "لم نجد أخبارًا حديثة عن هذا البحث. جرّب اسمًا أو موضوعًا آخر."
              : "No recent news found. Try another person or topic."
          }

        </div>
      `
  }

</section>

`;

  return shell({
    lang,
    title:
      `${query} | ${APP.name}`,
    content
  });
}

async function articlePage(
  env,
  lang,
  id,
  query = ""
) {
  const candidates =
    await loadCategory(
      "latest",
      lang
    );

  let item =
    candidates.find(
      candidate =>
        candidate.id === id
    );

  if(!item){

    const categories = [
      "egypt",
      "world",
      "sports",
      "economy",
      "technology",
      "entertainment"
    ];

    const groups =
      await Promise.all(
        categories.map(
          category =>
            loadCategory(
              category,
              lang
            )
        )
      );

    item =
      dedupe(
        groups.flat()
      ).find(
        candidate =>
          candidate.id === id
      );

  }

  if(!item && query){

    const found =
      await searchNews(
        query,
        lang
      );

    item =
      found.find(
        candidate =>
          candidate.id === id
      ) ||
      found.find(
        candidate =>
          cleanText(
            candidate.title
          ).toLowerCase() ===
          cleanText(
            query
          ).toLowerCase()
      ) ||
      found[0];

  }

  if(!item){

    return shell({
      lang,
      title:
        lang === "ar"
          ? "الخبر غير متاح"
          : "Article unavailable",
      content: `
        <section
          class="section empty"
        >

          <h1>
            ${
              lang === "ar"
                ? "الخبر غير متاح حاليًا"
                : "Article unavailable"
            }
          </h1>

          <p>
            ${
              lang === "ar"
                ? "قد يكون الخبر خارج نافذة الأخبار الحديثة. استخدم البحث للعثور عليه."
                : "This article is outside the current news window. Use search to find it."
            }
          </p>

        </section>
      `
    });

  }

  item =
    (
      await enrichImages([item])
    )[0];

  const related =
    (
      await searchNews(
        item.title,
        lang
      )
    )
      .filter(
        candidate =>
          candidate.id !==
          item.id
      )
      .slice(0,6);

  const article =
    await aiArticle(
      env,
      item,
      related,
      lang
    ) ||
    fallbackArticle(
      item,
      lang
    );

  const paragraphs =
    article
      .split(/\n{2,}/)
      .filter(Boolean)
      .map(
        paragraph =>
          `<p>${esc(
            paragraph
          )}</p>`
      )
      .join("");

  const cover =
    item.image
      ? `
        <img
          class="article-cover"
          src="/api/image?url=${encodeURIComponent(item.image)}"
          alt=""
          decoding="async"
          referrerpolicy="no-referrer"
        >
      `
      : `
        <div
          class="article-cover"
          style="display:grid;place-items:center"
        >
          ${svgIcon(
            (
              CATEGORIES[
                item.category
              ] ||
              CATEGORIES.latest
            ).icon
          )}
        </div>
      `;

  const category =
    CATEGORIES[
      item.category
    ] ||
    CATEGORIES.latest;

  const content = `

<article class="article">

  ${cover}

  <div class="article-head">

    <div class="story-meta">

      <span class="badge">

        ${esc(
          lang === "ar"
            ? category.ar
            : category.en
        )}

      </span>

      <span>
        ${esc(
          timeAgo(
            item.publishedAt,
            lang
          )
        )}
      </span>

      <span>
        ${esc(
          item.source ||
            "NowPulse"
        )}
      </span>

    </div>

    <h1>
      ${esc(item.title)}
    </h1>

  </div>

  <div class="article-body">

    ${paragraphs}

  </div>

</article>

`;

  return shell({
    lang,
    title:item.title,
    active:item.category,
    content,
    description:item.description
  });
}

async function weatherPage(
  lang,
  city = "Cairo"
) {
  const weather =
    await getWeather(
      city
    );

  const options =
    Object.keys(
      WEATHER_CITIES
    )
      .map(
        key => `
          <option
            value="${key}"
            ${
              key === weather.city
                ? "selected"
                : ""
            }
          >
            ${esc(
              WEATHER_NAMES[key] ||
              key
            )}
          </option>
        `
      )
      .join("");

  const forecast =
    weather.daily?.time
      ?.map(
        (date,index) => `
          <div class="day">

            <strong>
              ${esc(
                date.slice(5)
              )}
            </strong>

            <div
              style="
                font-size:28px;
                margin:10px
              "
            >
              ${weatherIcon(
                weather.daily
                  .weather_code?.[
                    index
                  ]
              )}
            </div>

            <div>
              ${Number(
                weather.daily
                  .temperature_2m_max?.[
                    index
                  ] || 0
              ).toFixed(0)}
              °
              /
              ${Number(
                weather.daily
                  .temperature_2m_min?.[
                    index
                  ] || 0
              ).toFixed(0)}
              °
            </div>

            <small>
              ${esc(
                weatherLabel(
                  weather.daily
                    .weather_code?.[
                      index
                    ],
                  lang
                )
              )}
            </small>

          </div>
        `
      )
      .join("") || "";

  const content = `

<section class="section weather-page">

  <div class="section-head">

    <div>

      <h1>
        🌤️ ${
          lang === "ar"
            ? "الطقس"
            : "Weather"
        }
      </h1>

      <p>
        ${
          lang === "ar"
            ? "اختر أي مدينة مصرية"
            : "Choose an Egyptian city"
        }
      </p>

    </div>

    <select
      class="city-select"
      id="city"
    >
      ${options}
    </select>

  </div>

  <div
    class="weather"
    style="margin-top:10px"
  >

    <div class="weather-row">

      <div class="weather-temp">

        ${
          weather.current
            ? Number(
                weather.current
                  .temperature_2m
              ).toFixed(1) + "°"
            : "—"
        }

      </div>

      <div>

        <div class="weather-city">
          ${esc(
            weather.name
          )}
        </div>

        <div class="weather-muted">

          ${
            weather.current
              ? esc(
                  weatherLabel(
                    weather.current
                      .weather_code,
                    lang
                  )
                ) +
                " · " +
                (
                  lang === "ar"
                    ? "الرطوبة"
                    : "Humidity"
                ) +
                " " +
                weather.current
                  .relative_humidity_2m +
                "%"
              : "—"
          }

        </div>

      </div>

    </div>

    <div class="forecast">

      ${forecast}

    </div>

  </div>

</section>

<script>

document.getElementById(
  "city"
).onchange =
  function(event){

    location.href =
      "/weather?lang=${lang}" +
      "&city=" +
      encodeURIComponent(
        event.target.value
      );

  };

</script>

`;

  return shell({
    lang,
    title:
      lang === "ar"
        ? "الطقس"
        : "Weather",
    content
  });
}

async function marketPage(
  lang
) {
  const market =
    await getMarket();

  const labels = [
    [
      "gold",
      "Gold XAU",
      market.gold
        ? "$" +
          Number(
            market.gold
          ).toLocaleString(
            undefined,
            {
              maximumFractionDigits:1
            }
          )
        : "—"
    ],
    [
      "silver",
      "Silver XAG",
      market.silver
        ? "$" +
          Number(
            market.silver
          ).toFixed(2)
        : "—"
    ],
    [
      "USD",
      "USD / EGP",
      market.fx.EGP
        ? market.fx.EGP.toFixed(2)
        : "—"
    ],
    [
      "EUR",
      "EUR / EGP",
      market.fx.EUR
        ? market.fx.EUR.toFixed(2)
        : "—"
    ],
    [
      "GBP",
      "GBP / EGP",
      market.fx.GBP
        ? market.fx.GBP.toFixed(2)
        : "—"
    ],
    [
      "SAR",
      "SAR / EGP",
      market.fx.SAR
        ? market.fx.SAR.toFixed(2)
        : "—"
    ],
    [
      "AED",
      "AED / EGP",
      market.fx.AED
        ? market.fx.AED.toFixed(2)
        : "—"
    ]
  ];

  const content = `

<section class="section market-page">

  <div class="section-head">

    <div>

      <h1>
        💰 ${
          lang === "ar"
            ? "الأسواق"
            : "Markets"
        }
      </h1>

      <p>
        ${
          lang === "ar"
            ? "أسعار من مصادر بيانات عامة وقد تتأخر عن السوق الفعلي."
            : "Public market data; values may be delayed."
        }
      </p>

    </div>

  </div>

  <div class="market-grid">

    ${labels
      .map(
        item => `
          <div class="market-item">

            <small>
              ${esc(item[1])}
            </small>

            <strong>
              ${esc(item[2])}
            </strong>

          </div>
        `
      )
      .join("")}

  </div>

</section>

`;

  return shell({
    lang,
    title:
      lang === "ar"
        ? "الأسواق"
        : "Markets",
    content
  });
}

function staticPage(
  lang,
  kind
) {
  const arabic =
    lang === "ar";

  const pages = {

    about:
      arabic
        ? [
            "عن NowPulse",
            "NowPulse منصة رقمية تجمع الأخبار والمعلومات الحديثة في واجهة واحدة، مع أدوات للبحث والطقس والأسواق والترند."
          ]
        : [
            "About NowPulse",
            "NowPulse is a digital platform for recent news, search, weather, markets and trends in one interface."
          ],

    privacy:
      arabic
        ? [
            "الخصوصية",
            "نحترم خصوصية الزوار. لا نطلب معلومات شخصية لإنشاء حساب من أجل تصفح الأخبار. قد تستخدم خدمات الإعلانات والتحليلات عند تفعيلها وفق سياسات الجهات المزودة."
          ]
        : [
            "Privacy",
            "We respect visitor privacy. No account is required to browse news. Advertising and analytics services may be used when enabled under their providers policies."
          ],

    terms:
      arabic
        ? [
            "الشروط",
            "المحتوى الإخباري يعرض لأغراض المعلومات. يجب الرجوع إلى مصادر موثوقة عند اتخاذ قرارات مالية أو صحية أو قانونية."
          ]
        : [
            "Terms",
            "News and information are provided for general informational purposes. Verify important financial, health or legal matters with authoritative sources."
          ],

    contact:
      arabic
        ? [
            "اتصل بنا",
            "للاستفسارات والملاحظات استخدم وسيلة التواصل التي سيضيفها مالك الموقع في إعدادات NowPulse."
          ]
        : [
            "Contact",
            "For questions and feedback, use the contact method configured by the NowPulse owner."
          ]

  };

  const data =
    pages[kind] ||
    pages.about;

  return shell({
    lang,
    title:data[0],
    content:`
      <section class="article">

        <div class="article-head">
          <h1>
            ${esc(data[0])}
          </h1>
        </div>

        <div class="article-body">
          <p>
            ${esc(data[1])}
          </p>
        </div>

      </section>
    `
  });
}

async function apiResponse(
  request,
  env,
  url
) {

  if(
    url.pathname ===
    "/api/image"
  ){

    const target =
      safeUrl(
        url.searchParams.get(
          "url"
        ) || ""
      );

    if(!target){

      return new Response(
        "Bad image URL",
        {status:400}
      );

    }

    try{

      const response =
        await fetch(
          target,
          {
            headers:{
              "User-Agent":
                "NowPulse/1.0"
            }
          }
        );

      if(!response.ok){

        return new Response(
          "Image unavailable",
          {status:404}
        );

      }

      const headers =
        new Headers();

      headers.set(
        "content-type",
        response.headers.get(
          "content-type"
        ) || "image/jpeg"
      );

      headers.set(
        "cache-control",
        "public,max-age=86400,stale-while-revalidate=604800"
      );

      return new Response(
        response.body,
        {headers}
      );

    }catch{

      return new Response(
        "Image unavailable",
        {status:404}
      );

    }

  }

  if(
    url.pathname ===
    "/api/resolve-image"
  ){

    const target =
      safeUrl(
        url.searchParams.get(
          "url"
        ) || ""
      );

    const query =
      cleanText(
        url.searchParams.get(
          "q"
        ) || ""
      );

    let image = "";

    if(target){

      image =
        await extractImage(
          target
        );

    }

    if(!image && query){

      image =
        await wikiImage(
          query
        );

    }

    if(!image){

      return new Response(
        "Image unavailable",
        {status:404}
      );

    }

    try{

      const response =
        await fetch(
          image,
          {
            headers:{
              "User-Agent":
                "NowPulse/1.0"
            }
          }
        );

      if(!response.ok){

        return new Response(
          "Image unavailable",
          {status:404}
        );

      }

      const headers =
        new Headers();

      headers.set(
        "content-type",
        response.headers.get(
          "content-type"
        ) || "image/jpeg"
      );

      headers.set(
        "cache-control",
        "public,max-age=86400,stale-while-revalidate=604800"
      );

      return new Response(
        response.body,
        {headers}
      );

    }catch{

      return new Response(
        "Image unavailable",
        {status:404}
      );

    }

  }

  if(
    url.pathname ===
    "/api/market"
  ){

    return json(
      await getMarket()
    );

  }

  if(
    url.pathname ===
    "/api/weather"
  ){

    return json(
      await getWeather(
        url.searchParams.get(
          "city"
        ) || "Cairo"
      )
    );

  }

  if(
    url.pathname ===
    "/api/search"
  ){

    const query =
      url.searchParams.get(
        "q"
      ) || "";

    const lang =
      url.searchParams.get(
        "lang"
      ) === "en"
        ? "en"
        : "ar";

    return json({
      ok:true,
      q:query,
      items:
        await searchNews(
          query,
          lang
        )
    });

  }

  if(
    url.pathname ===
    "/health"
  ){

    return json({
      ok:true,
      service:APP.name,
      ai:Boolean(env.AI),
      kv:Boolean(
        env.NOWPULSE_KV
      ),
      time:
        new Date().toISOString()
    });

  }

  return null;
}

async function refresh(env) {

  if(
    !env.NOWPULSE_KV
  ){

    return;

  }

  try{

    const old =
      await env.NOWPULSE_KV.get(
        "home:ar",
        "json"
      );

    const fresh =
      await loadCategory(
        "latest",
        "ar"
      );

    const payload = {
      updatedAt:
        new Date().toISOString(),
      items:fresh
    };

    if(
      JSON.stringify(
        old?.items || []
      ) !==
      JSON.stringify(fresh)
    ){

      await env.NOWPULSE_KV.put(
        "home:ar",
        JSON.stringify(
          payload
        ),
        {
          expirationTtl:3600
        }
      );

    }

  }catch{

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

      const api =
        await apiResponse(
          request,
          env,
          url
        );

      if(api){

        return api;

      }

      const lang =
        url.searchParams.get(
          "lang"
        ) === "en"
          ? "en"
          : "ar";

      if(
        url.pathname === "/"
      ){

        return new Response(
          await home(
            env,
            lang,
            url.searchParams.get(
              "category"
            ) || "latest"
          ),
          {
            headers:{
              "content-type":
                "text/html; charset=UTF-8",
              "cache-control":
                "public,max-age=30,stale-while-revalidate=120"
            }
          }
        );

      }

      if(
        url.pathname ===
        "/search"
      ){

        return new Response(
          await searchPage(
            env,
            lang,
            url.searchParams.get(
              "q"
            ) || ""
          ),
          {
            headers:{
              "content-type":
                "text/html; charset=UTF-8"
            }
          }
        );

      }

      if(
        url.pathname.startsWith(
          "/article/"
        )
      ){

        const id =
          decodeURIComponent(
            url.pathname
              .split("/")
              .pop()
          );

        return new Response(
          await articlePage(
            env,
            lang,
            id,
            url.searchParams.get(
              "q"
            ) || ""
          ),
          {
            headers:{
              "content-type":
                "text/html; charset=UTF-8"
            }
          }
        );

      }

      if(
        url.pathname ===
        "/weather"
      ){

        return new Response(
          await weatherPage(
            lang,
            url.searchParams.get(
              "city"
            ) || "Cairo"
          ),
          {
            headers:{
              "content-type":
                "text/html; charset=UTF-8"
            }
          }
        );

      }

      if(
        url.pathname ===
        "/markets"
      ){

        return new Response(
          await marketPage(
            lang
          ),
          {
            headers:{
              "content-type":
                "text/html; charset=UTF-8"
            }
          }
        );

      }

      if(
        url.pathname.startsWith(
          "/page/"
        )
      ){

        return new Response(
          staticPage(
            lang,
            url.pathname
              .split("/")
              .pop()
          ),
          {
            headers:{
              "content-type":
                "text/html; charset=UTF-8"
            }
          }
        );

      }

      if(
        url.pathname ===
        "/robots.txt"
      ){

        return new Response(
          `User-agent: *
Allow: /
Sitemap: ${APP.origin}/sitemap.xml`,
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

        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>${APP.origin}/</loc>
</url>
<url>
<loc>${APP.origin}/weather</loc>
</url>
<url>
<loc>${APP.origin}/markets</loc>
</url>
</urlset>`,
          {
            headers:{
              "content-type":
                "application/xml; charset=UTF-8"
            }
          }
        );

      }

      if(
        url.pathname ===
        "/rss.xml"
      ){

        const items =
          await loadCategory(
            "latest",
            lang
          );

        const xml =
          items
            .slice(0,20)
            .map(
              item =>
                `<item>
<title>${esc(item.title)}</title>
<link>${esc(
  APP.origin +
  "/article/" +
  item.id +
  "?lang=" +
  lang
)}</link>
<pubDate>${new Date(
  item.publishedAt
).toUTCString()}</pubDate>
<description>${esc(
  item.description || ""
)}</description>
</item>`
            )
            .join("");

        return new Response(
          `<?xml version="1.0"?>
<rss version="2.0">
<channel>
<title>NowPulse</title>
<link>${APP.origin}</link>
<description>NowPulse</description>
${xml}
</channel>
</rss>`,
          {
            headers:{
              "content-type":
                "application/rss+xml; charset=UTF-8"
            }
          }
        );

      }

      return new Response(
        "Not Found",
        {
          status:404,
          headers:{
            "content-type":
              "text/plain; charset=UTF-8"
          }
        }
      );

    }catch(error){

      console.error(
        "NowPulse request error:",
        error
      );

      return new Response(
        `<h1>NowPulse</h1><p>Temporary service error.</p>`,
        {
          status:500,
          headers:{
            "content-type":
              "text/html; charset=UTF-8"
          }
        }
      );

    }

  },

  async scheduled(
    event,
    env,
    ctx
  ){

    ctx.waitUntil(
      refresh(env)
    );

  }

};
