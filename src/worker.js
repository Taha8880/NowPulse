const APP = {
  name: "NowPulse",
  origin: "https://nowpulse.tavengers16.workers.dev",
  aiModel: "@cf/meta/llama-3.1-8b-instruct-fast",
  freshMs: 72 * 60 * 60 * 1000,
  searchMs: 14 * 24 * 60 * 60 * 1000,
  cacheSeconds: 300,
  archiveLimit: 300
};

const GOOGLE_VERIFICATION =
  "google-site-verification: google1dc3867d61891f77.html";

const CATEGORIES = {
  latest: { ar:"آخر الأخبار", en:"Latest", icon:"newspaper", tone:"news" },
  world: { ar:"العالم", en:"World", icon:"globe", tone:"world" },
  egypt: { ar:"مصر", en:"Egypt", icon:"flag", tone:"egypt" },
  politics: { ar:"سياسة", en:"Politics", icon:"landmark", tone:"politics" },
  sports: { ar:"رياضة", en:"Sports", icon:"trophy", tone:"sports" },
  economy: { ar:"اقتصاد", en:"Economy", icon:"chart", tone:"economy" },
  technology: { ar:"تكنولوجيا", en:"Technology", icon:"cpu", tone:"tech" },
  entertainment: { ar:"فن وترفيه", en:"Entertainment", icon:"film", tone:"entertainment" },
  health: { ar:"صحة", en:"Health", icon:"heart", tone:"health" },
  travel: { ar:"سفر", en:"Travel", icon:"plane", tone:"travel" }
};

const WEATHER_CITIES = {
  Cairo:[30.0444,31.2357],
  Giza:[30.0131,31.2089],
  Alexandria:[31.2001,29.9187],
  Hurghada:[27.2579,33.8116],
  Luxor:[25.6872,32.6396],
  Aswan:[24.0889,32.8998],
  Qena:[26.1551,32.716],
  Sohag:[26.5591,31.6957],
  Asyut:[27.1801,31.1837],
  Minya:[28.1099,30.7503],
  Suez:[29.9668,32.5498],
  Ismailia:[30.5965,32.2715],
  PortSaid:[31.2653,32.3019],
  Damietta:[31.4175,31.8144],
  Faiyum:[29.3084,30.8428],
  Tanta:[30.7865,31.0004],
  Mansoura:[31.0409,31.3785],
  Zagazig:[30.5877,31.502],
  Damanhur:[31.0341,30.4682],
  KafrElSheikh:[31.1107,30.9388],
  SharmElSheikh:[27.9158,34.3299],
  MarsaAlam:[25.0676,34.879],
  Matruh:[31.3543,27.2373]
};

const WEATHER_NAMES = {
  Cairo:"القاهرة",
  Giza:"الجيزة",
  Alexandria:"الإسكندرية",
  Hurghada:"الغردقة",
  Luxor:"الأقصر",
  Aswan:"أسوان",
  Qena:"قنا",
  Sohag:"سوهاج",
  Asyut:"أسيوط",
  Minya:"المنيا",
  Suez:"السويس",
  Ismailia:"الإسماعيلية",
  PortSaid:"بورسعيد",
  Damietta:"دمياط",
  Faiyum:"الفيوم",
  Tanta:"طنطا",
  Mansoura:"المنصورة",
  Zagazig:"الزقازيق",
  Damanhur:"دمنهور",
  KafrElSheikh:"كفر الشيخ",
  SharmElSheikh:"شرم الشيخ",
  MarsaAlam:"مرسى علم",
  Matruh:"مرسى مطروح"
};

const QUOTES_AR = [
  "لا تؤجل خطوة تستطيع أن تبدأها اليوم.",
  "النجاح نتيجة خطوات صغيرة تتكرر كل يوم.",
  "المعرفة تفتح أبوابًا لا تفتحها القوة.",
  "الوضوح بداية جيدة لأي قرار.",
  "الاستمرار يصنع فرقًا أكبر من البداية القوية.",
  "كل تجربة تضيف شيئًا إلى الطريق.",
  "ابدأ بما تستطيع ثم طوره مع الوقت.",
  "الوقت الذي تستثمره في التعلم لا يضيع."
];

const QUOTES_EN = [
  "Start with what you can do today.",
  "Small steps become meaningful progress.",
  "Knowledge opens doors that force cannot.",
  "Clarity is the beginning of a good decision.",
  "Consistency often matters more than a strong start.",
  "Every experience adds something to the journey.",
  "Start with what you can, then improve it.",
  "Time invested in learning is never wasted."
];

function json(data,status=200,cache="no-store"){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      "content-type":"application/json; charset=UTF-8",
      "cache-control":cache
    }
  });
}

function esc(value=""){
  return String(value).replace(/[&<>"']/g,c=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[c]));
}

function cleanText(value=""){
  let text=String(value||"");

  text=text
    .replace(/<!\[CDATA\[|\]\]>/gi,"")
    .replace(/\\n/g," ")
    .replace(/\\r/g," ")
    .replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]*>/g," ")
    .replace(/&nbsp;|nbsp;/gi," ")
    .replace(/&#160;/gi," ")
    .replace(/&amp;/gi,"&")
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&lt;/gi,"<")
    .replace(/&gt;/gi,">")
    .replace(/\\#+/g,"")
    .replace(/^#+\s*/g,"")
    .replace(/^[•*-]\s+/,"")
    .replace(/\s+/g," ")
    .trim();

  return text;
}

function safeUrl(value){
  try{
    const u=new URL(String(value||""));
    if(!["http:","https:"].includes(u.protocol)) return "";
    return u.href;
  }catch{
    return "";
  }
}

function hash(input){
  let h=2166136261;

  for(let i=0;i<input.length;i++){
    h^=input.charCodeAt(i);
    h=Math.imul(h,16777619);
  }

  return (h>>>0).toString(16);
}

function ago(date,lang){
  const diff=Date.now()-new Date(date).getTime();

  if(!Number.isFinite(diff)||diff<0) return "";

  const min=Math.max(1,Math.floor(diff/60000));

  if(lang==="ar"){
    if(min<60)return `منذ ${min} دقيقة`;

    const h=Math.floor(min/60);

    if(h<24)return `منذ ${h} ساعة`;

    return `منذ ${Math.floor(h/24)} يوم`;
  }

  if(min<60)return `${min} min ago`;

  const h=Math.floor(min/60);

  if(h<24)return `${h} hr ago`;

  return `${Math.floor(h/24)} d ago`;
}

function xmlTag(xml,tag){
  const m=xml.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`,"i")
  );

  return m?.[1]?.trim()||"";
}

function xmlAttr(xml,tag,attr){
  const m=xml.match(
    new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']+)["']`,"i")
  );

  return m?.[1]?.trim()||"";
}

function parseRSS(xml,category){
  const blocks=xml.match(/<item[\s\S]*?<\/item>/gi)||[];
  const result=[];

  for(const block of blocks){
    const title=cleanText(xmlTag(block,"title"));
    const link=safeUrl(xmlTag(block,"link"));

    const published=
      xmlTag(block,"pubDate")||
      xmlTag(block,"published")||
      xmlTag(block,"updated");

    const date=new Date(published);

    if(!title||!link||!Number.isFinite(date.getTime()))continue;

    const source=
      cleanText(xmlTag(block,"source"))||
      cleanText(xmlTag(block,"publisher"));

    const description=cleanText(xmlTag(block,"description"));

    const image=
      safeUrl(
        xmlAttr(block,"media:content","url")||
        xmlAttr(block,"media:thumbnail","url")||
        xmlAttr(block,"enclosure","url")
      );

    result.push({
      id:"n"+hash(link+"|"+title),
      title,
      link,
      source,
      description,
      publishedAt:date.toISOString(),
      category,
      image
    });
  }

  return result;
}

async function fetchText(url,timeout=5500){
  const controller=new AbortController();

  const timer=setTimeout(
    ()=>controller.abort(),
    timeout
  );

  try{
    const response=await fetch(url,{
      signal:controller.signal,
      redirect:"follow",
      headers:{
        "User-Agent":
          "Mozilla/5.0 (compatible; NowPulse/1.0; +https://nowpulse.tavengers16.workers.dev)"
      }
    });

    if(!response.ok){
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  }finally{
    clearTimeout(timer);
  }
}

function cacheKey(url){
  return new Request(url,{
    method:"GET"
  });
}

async function cachedText(url,ttl=300){
  const cache=caches.default;
  const key=cacheKey(url);

  const hit=await cache.match(key);

  if(hit){
    return hit.text();
  }

  const text=await fetchText(url);

  const response=new Response(text,{
    headers:{
      "content-type":"text/plain; charset=UTF-8",
      "cache-control":`public,max-age=${ttl}`
    }
  });

  await cache.put(key,response.clone());

  return text;
}

async function newsFeed(query,category,lang){
  const url=
    "https://news.google.com/rss/search?q="+
    encodeURIComponent(query)+
    "&hl="+(lang==="ar"?"ar":"en")+
    "&gl=EG&ceid=EG:"+
    (lang==="ar"?"ar":"en");

  try{
    const xml=await cachedText(url,APP.cacheSeconds);
    return parseRSS(xml,category);
  }catch{
    return [];
  }
}

function dedupe(items){
  const map=new Map();

  for(const item of items){
    const key=
      cleanText(item.title)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu," ")
      .trim();

    if(!key)continue;

    const old=map.get(key);

    if(
      !old||
      new Date(item.publishedAt)>
      new Date(old.publishedAt)
    ){
      map.set(key,item);
    }
  }

  return [...map.values()].sort(
    (a,b)=>
      new Date(b.publishedAt)-
      new Date(a.publishedAt)
  );
}

function recent(items,maxAge=APP.freshMs){
  const now=Date.now();

  return items.filter(item=>{
    const t=new Date(item.publishedAt).getTime();

    return Number.isFinite(t)&&
      t<=now+10*60*1000&&
      now-t<=maxAge;
  });
}

function queries(lang){
  if(lang==="en"){
    return {
      latest:[
        "latest Egypt news",
        "latest world news",
        "breaking news Egypt"
      ],
      world:[
        "world breaking news",
        "international latest news"
      ],
      egypt:[
        "Egypt breaking news",
        "Egypt latest news"
      ],
      politics:[
        "Egypt politics latest",
        "Middle East politics latest"
      ],
      sports:[
        "Egypt sports latest",
        "football latest"
      ],
      economy:[
        "Egypt economy latest",
        "Egypt markets latest"
      ],
      technology:[
        "technology latest",
        "AI technology latest"
      ],
      entertainment:[
        "entertainment latest",
        "Egypt entertainment latest"
      ],
      health:[
        "health latest Egypt",
        "health latest"
      ],
      travel:[
        "Egypt travel tourism latest",
        "travel latest"
      ]
    };
  }

  return {
    latest:[
      "أخبار مصر العاجلة",
      "أخبار العالم العاجلة",
      "آخر الأخبار"
    ],
    world:[
      "أخبار العالم العاجلة",
      "أخبار دولية"
    ],
    egypt:[
      "أخبار مصر العاجلة",
      "آخر أخبار مصر"
    ],
    politics:[
      "أخبار السياسة مصر",
      "السياسة المصرية اليوم"
    ],
    sports:[
      "أخبار الرياضة مصر",
      "كرة القدم اليوم"
    ],
    economy:[
      "أخبار الاقتصاد مصر",
      "اقتصاد مصر اليوم"
    ],
    technology:[
      "أخبار التكنولوجيا",
      "الذكاء الاصطناعي اليوم"
    ],
    entertainment:[
      "أخبار الفن والترفيه",
      "فن مصر اليوم"
    ],
    health:[
      "أخبار الصحة",
      "الصحة مصر اليوم"
    ],
    travel:[
      "السياحة والسفر مصر",
      "أخبار السياحة اليوم"
    ]
  };
}

async function loadCategory(category,lang){
  const qs=queries(lang)[category]||queries(lang).latest;

  const groups=await Promise.all(
    qs.map(q=>newsFeed(q,category,lang))
  );

  return recent(
    dedupe(groups.flat()),
    APP.freshMs
  ).slice(0,40);
}

async function loadLatestFast(lang){
  const qs=queries(lang).latest;

  const groups=await Promise.all(
    qs.map(q=>newsFeed(q,"latest",lang))
  );

  return recent(
    dedupe(groups.flat()),
    APP.freshMs
  ).slice(0,40);
}

async function extractImage(pageUrl){
  try{
    const html=await fetchText(pageUrl,4500);

    const patterns=[
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ];

    for(const pattern of patterns){
      const m=html.match(pattern);

      if(!m?.[1])continue;

      if(pattern.source.includes("ld+json")){
        try{
          const data=JSON.parse(m[1]);

          const list=
            Array.isArray(data)
              ? data
              : [data];

          for(const x of list){
            const image=
              typeof x?.image==="string"
                ? x.image
                : Array.isArray(x?.image)
                  ? x.image[0]
                  : x?.image?.url;

            const u=safeUrl(image||"");

            if(u)return u;
          }
        }catch{}
      }else{
        const u=safeUrl(
          m[1].replace(/\\\//g,"/")
        );

        if(u)return u;
      }
    }
  }catch{}

  return "";
}

async function wikiImage(query){
  try{
    const url=
      "https://commons.wikimedia.org/w/api.php"+
      "?action=query"+
      "&generator=search"+
      "&gsrsearch="+encodeURIComponent(query)+
      "&gsrnamespace=6"+
      "&gsrlimit=1"+
      "&prop=imageinfo"+
      "&iiprop=url"+
      "&format=json"+
      "&origin=*";

    const response=await fetch(url,{
      headers:{
        "User-Agent":"NowPulse/1.0"
      }
    });

    if(!response.ok)return "";

    const data=await response.json();

    const page=
      Object.values(data.query?.pages||{})[0];

    return safeUrl(
      page?.imageinfo?.[0]?.url||""
    );
  }catch{
    return "";
  }
}

function normalizeSearchQuery(q){
  return cleanText(q).slice(0,160);
}

async function searchNews(query,lang){
  const q=normalizeSearchQuery(query);

  if(!q)return [];

  const variants=
    lang==="ar"
      ? [
          q,
          `${q} أخبار`,
          `${q} اليوم`,
          `${q} news`
        ]
      : [
          q,
          `${q} latest news`,
          `${q} news`,
          `${q} أخبار`
        ];

  const groups=await Promise.all(
    variants.map(x=>newsFeed(x,"latest",lang))
  );

  return recent(
    dedupe(groups.flat()),
    APP.searchMs
  ).slice(0,50);
}

function trendTopics(items,lang){
  const stop=
    lang==="ar"
      ? new Set(
          "من في على عن إلى هذا هذه ذلك التي الذي مع بعد قبل كان تكون تم قد حيث لدى كما بين خبر أخبار اليوم مصر".split(" ")
        )
      : new Set(
          "the a an of in on for to from and or is are was were with this that latest news egypt".split(" ")
        );

  const counts=new Map();

  for(const item of items){
    const words=
      cleanText(item.title)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu," ")
      .split(/\s+/)
      .filter(x=>x.length>=3&&!stop.has(x));

    for(const word of [...new Set(words)]){
      counts.set(word,(counts.get(word)||0)+1);
    }
  }

  return [...counts.entries()]
    .sort((a,b)=>b[1]-a[1])
    .slice(0,8)
    .map(([name,count])=>({name,count}));
}

async function getArchive(env,lang){
  if(!env.NOWPULSE_KV)return [];

  try{
    const data=
      await env.NOWPULSE_KV.get(
        `archive:${lang}`,
        "json"
      );

    return Array.isArray(data?.items)
      ? data.items
      : [];
  }catch{
    return [];
  }
}

async function saveArchive(env,lang,items){
  if(!env.NOWPULSE_KV||!items.length)return;

  try{
    const old=await getArchive(env,lang);

    const merged=dedupe(
      [...items,...old]
    ).slice(0,APP.archiveLimit);

    const oldIds=
      old.map(x=>x.id).join("|");

    const newIds=
      merged.map(x=>x.id).join("|");

    if(oldIds===newIds)return;

    await env.NOWPULSE_KV.put(
      `archive:${lang}`,
      JSON.stringify({
        updatedAt:new Date().toISOString(),
        items:merged
      }),
      {
        expirationTtl:60*60*24*30
      }
    );
  }catch{}
}

async function aiArticle(env,item,related,lang){
  if(!env.AI)return null;

  const sources=[
    item,
    ...related.slice(0,5)
  ].map((x,i)=>
    `${i+1}. ${x.title}\n`+
    `Source: ${x.source||"unknown"}\n`+
    `Time: ${x.publishedAt}\n`+
    `Details: ${x.description||""}`
  ).join("\n\n");

  const prompt=
    lang==="ar"
      ? `اكتب مقالًا إخباريًا عربيًا أصليًا اعتمادًا فقط على المعلومات التالية.

الشروط:
- لا تخترع أي معلومة.
- لا تخترع أرقامًا أو تصريحات.
- لا تنسب شيئًا إلى مصدر لم يذكره.
- إذا اختلفت المصادر اذكر الاختلاف.
- لا تنسخ صياغة أي مصدر.
- لا تستخدم روابط.
- لا تستخدم HTML.
- اكتب عنوانًا واضحًا ثم 5 إلى 8 فقرات.
- استخدم فقط الحقائق المدعومة.
- إذا كانت المعلومات محدودة، اكتب مقالًا أقصر بدل اختراع تفاصيل.

المصادر:

${sources}`
      : `Write an original English news article using only the information below.

Rules:
- Never invent facts.
- Never invent numbers or quotes.
- Never attribute unsupported information.
- Mention source conflicts when relevant.
- Do not copy publisher wording.
- No links.
- No HTML.
- Write a clear headline and 5 to 8 paragraphs.
- Use only supported facts.
- If information is limited, write a shorter article instead of inventing details.

Sources:

${sources}`;

  try{
    const result=await env.AI.run(
      APP.aiModel,
      {
        messages:[
          {
            role:"system",
            content:
              "You are the NowPulse editorial AI. " +
              "Use only supplied facts. Never fabricate."
          },
          {
            role:"user",
            content:prompt
          }
        ],
        max_tokens:1800,
        temperature:.2
      }
    );

    const text=
      result?.response||
      result?.result||
      "";

    return cleanText(text)||null;
  }catch{
    return null;
  }
}

function fallbackArticle(item,lang){
  if(lang==="ar"){
    return (
      `يتناول هذا التقرير أحدث المعلومات المتاحة حول ${item.title}.\n\n`+
      `${item.description||"المعلومات المتاحة حاليًا محدودة، وسيتم تحديث التقرير عند توفر تفاصيل موثوقة جديدة."}\n\n`+
      `يعتمد هذا التقرير على المعلومات المتاحة وقت النشر، دون إضافة تفاصيل غير مؤكدة.`
    );
  }

  return (
    `This report covers the latest available information about ${item.title}.\n\n`+
    `${item.description||"Available information is currently limited and the report can be updated when new verified details emerge."}\n\n`+
    `This report is based on information available at publication time and avoids unverified details.`
  );
}

function icon(name){
  const p={
    newspaper:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6M7 16h10"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    flag:'<path d="M6 21V3M6 4c5-3 8 3 12 0v8c-4 3-7-3-12 0"/>',
    landmark:'<path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18M12 3l9 5H3z"/>',
    trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM12 13v4M8 20h8M6 6H3v2a4 4 0 0 0 4 4M18 6h3v2a4 4 0 0 1-4 4"/>',
    chart:'<path d="M4 19V9M10 19V5M16 19v-8M22 19H2"/>',
    cpu:'<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    film:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v16M16 4v16M4 8h4M16 8h4M4 16h4M16 16h4"/>',
    heart:'<path d="M20 8c0 6-8 11-8 11S4 14 4 8a4 4 0 0 1 7-2 4 4 0 0 1 9 2z"/>',
    plane:'<path d="M3 12l18-7-7 18-3-8-8-3zM11 15l-3 3"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    moon:'<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5z"/>'
  };

  return `<svg viewBox="0 0 24 24" aria-hidden="true">${p[name]||p.newspaper}</svg>`;
}

function weatherIcon(code){
  if(code===0)return "☀️";
  if(code<=3)return "⛅";
  if(code>=95)return "⛈️";
  if(code>=51)return "🌧️";
  return "🌫️";
}

function weatherLabel(code,lang){
  const ar={
    0:"صافي",1:"غائم جزئيًا",2:"غائم جزئيًا",3:"غائم",
    45:"ضباب",48:"ضباب",51:"رذاذ",53:"رذاذ",55:"رذاذ",
    61:"مطر",63:"مطر",65:"أمطار غزيرة",
    71:"ثلوج",73:"ثلوج",75:"ثلوج غزيرة",
    80:"زخات مطر",81:"زخات مطر",82:"زخات قوية",
    95:"عواصف رعدية"
  };

  const en={
    0:"Clear",1:"Partly cloudy",2:"Partly cloudy",3:"Cloudy",
    45:"Fog",48:"Fog",51:"Drizzle",53:"Drizzle",55:"Drizzle",
    61:"Rain",63:"Rain",65:"Heavy rain",
    71:"Snow",73:"Snow",75:"Heavy snow",
    80:"Rain showers",81:"Rain showers",82:"Heavy showers",
    95:"Thunderstorms"
  };

  return (lang==="ar"?ar:en)[code]||
    (lang==="ar"?"حالة جوية":"Weather");
}

async function getWeather(city="Cairo"){
  const key=
    Object.keys(WEATHER_CITIES)
      .find(x=>x.toLowerCase()===String(city).toLowerCase())||
    "Cairo";

  const [lat,lon]=WEATHER_CITIES[key];

  const url=
    `https://api.open-meteo.com/v1/forecast`+
    `?latitude=${lat}&longitude=${lon}`+
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`+
    `&daily=temperature_2m_max,temperature_2m_min,weather_code`+
    `&timezone=Africa%2FCairo&forecast_days=5`;

  try{
    const response=await fetch(url,{
      headers:{"User-Agent":"NowPulse/1.0"}
    });

    const data=await response.json();

    return {
      city:key,
      name:WEATHER_NAMES[key]||key,
      current:data.current||null,
      daily:data.daily||null
    };
  }catch{
    return {
      city:key,
      name:WEATHER_NAMES[key]||key,
      current:null,
      daily:null
    };
  }
}

async function getMarket(){
  const result={
    gold:null,
    silver:null,
    fx:{}
  };

  const calls=await Promise.allSettled([
    fetch("https://api.gold-api.com/price/XAU"),
    fetch("https://api.gold-api.com/price/XAG"),
    fetch("https://open.er-api.com/v6/latest/USD")
  ]);

  try{
    if(calls[0].status==="fulfilled"){
      const d=await calls[0].value.json();
      result.gold=Number(d.price||d.rate||d.value)||null;
    }
  }catch{}

  try{
    if(calls[1].status==="fulfilled"){
      const d=await calls[1].value.json();
      result.silver=Number(d.price||d.rate||d.value)||null;
    }
  }catch{}

  try{
    if(calls[2].status==="fulfilled"){
      const d=await calls[2].value.json();

      for(const x of ["EGP","EUR","GBP","SAR","AED"]){
        if(Number(d.rates?.[x])){
          result.fx[x]=Number(d.rates[x]);
        }
      }
    }
  }catch{}

  return result;
}

function articleHref(item,lang){
  return `/article/${encodeURIComponent(item.id)}?lang=${lang}&q=${encodeURIComponent(item.title)}`;
}

function card(item,lang,featured=false){
  const cat=CATEGORIES[item.category]||CATEGORIES.latest;

  const image=
    item.image
      ? `/api/image?url=${encodeURIComponent(item.image)}`
      : `/api/resolve-image?url=${encodeURIComponent(item.link)}&q=${encodeURIComponent(item.title)}`;

  return `
<article class="story ${featured?"featured":""} tone-${cat.tone}">
  <a class="story-link" href="${articleHref(item,lang)}">

    <div class="story-media">
      <img
        src="${esc(image)}"
        alt=""
        loading="${featured?"eager":"lazy"}"
        decoding="async"
        fetchpriority="${featured?"high":"auto"}"
        referrerpolicy="no-referrer"
        onerror="this.remove();this.parentElement.classList.add('no-image')"
      >
      <div class="media-fallback">
        ${icon(cat.icon)}
      </div>
    </div>

    <div class="story-body">

      <div class="story-meta">
        <span class="badge">
          ${esc(lang==="ar"?cat.ar:cat.en)}
        </span>
        <span>${esc(ago(item.publishedAt,lang))}</span>
      </div>

      <h2>${esc(item.title)}</h2>

      ${
        item.description
          ? `<p>${esc(item.description)}</p>`
          : ""
      }

      <span class="source">
        ${esc(item.source||"NowPulse")}
      </span>

    </div>

  </a>
</article>`;
}

function quoteBox(lang){
  return `
<div class="quote">
  <div class="quote-label">
    ${lang==="ar"?"كلمة اليوم":"THOUGHT OF THE MOMENT"}
  </div>
  <div class="quote-text">
    ${esc((lang==="ar"?QUOTES_AR:QUOTES_EN)[0])}
  </div>
</div>`;
}

function baseCSS(){
  return `
:root{
--bg:#f4f6fb;
--panel:#fff;
--text:#101522;
--muted:#70798c;
--line:#e5e9f1;
--accent:#5368ff;
--shadow:0 10px 30px rgba(20,30,60,.07);
--radius:20px;
}

body.dark{
--bg:#080c15;
--panel:#111827;
--text:#f5f7fb;
--muted:#9da8bb;
--line:#20293b;
--accent:#8291ff;
--shadow:0 12px 35px rgba(0,0,0,.3);
}

*{box-sizing:border-box}

html{scroll-behavior:smooth}

body{
margin:0;
background:var(--bg);
color:var(--text);
font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;
}

a{text-decoration:none;color:inherit}

button,input,select{font:inherit}

.top{
position:sticky;
top:0;
z-index:50;
background:color-mix(in srgb,var(--panel) 94%,transparent);
backdrop-filter:blur(14px);
border-bottom:1px solid var(--line);
}

.top-in{
max-width:1440px;
margin:auto;
padding:12px 22px;
display:flex;
align-items:center;
gap:10px;
}

.logo{
font-size:25px;
font-weight:950;
letter-spacing:-1px;
margin-inline-end:auto;
}

.logo b{color:var(--accent)}

.search{
width:min(410px,38vw);
display:flex;
align-items:center;
gap:8px;
background:var(--bg);
border:1px solid var(--line);
border-radius:14px;
padding:8px 10px;
}

.search input{
border:0;
outline:0;
background:transparent;
color:var(--text);
width:100%;
min-width:0;
}

.icon-btn,.lang-btn{
height:42px;
min-width:42px;
display:grid;
place-items:center;
border:1px solid var(--line);
border-radius:13px;
background:var(--panel);
color:var(--text);
cursor:pointer;
}

.lang-btn{
padding:0 13px;
font-weight:850;
}

.icon-btn svg,.search svg,.nav-icon svg{
width:20px;
height:20px;
fill:none;
stroke:currentColor;
stroke-width:1.8;
stroke-linecap:round;
stroke-linejoin:round;
}

.wrap{
max-width:1440px;
margin:auto;
padding:18px 22px 55px;
}

.nav{
display:flex;
gap:9px;
overflow:auto;
padding:3px 1px 13px;
scrollbar-width:none;
}

.nav::-webkit-scrollbar{display:none}

.nav-item{
display:flex;
align-items:center;
gap:8px;
min-width:max-content;
padding:9px 12px;
background:var(--panel);
border:1px solid var(--line);
border-radius:14px;
color:var(--muted);
font-weight:800;
transition:.18s;
}

.nav-item:hover,.nav-item.active{
color:var(--text);
transform:translateY(-1px);
box-shadow:var(--shadow);
}

.nav-icon{
width:27px;
height:27px;
display:grid;
place-items:center;
border-radius:8px;
background:var(--bg);
}

.hero{
display:grid;
grid-template-columns:minmax(0,1.6fr) minmax(290px,.75fr);
gap:18px;
margin-top:5px;
}

.hero-main,.side-panel,.quote,.market,.weather,.trend,.section{
background:var(--panel);
border:1px solid var(--line);
border-radius:var(--radius);
box-shadow:var(--shadow);
}

.hero-main{overflow:hidden}

.hero-main .story-media{
height:410px;
}

.hero-main h2{
font-size:clamp(26px,3vw,42px);
line-height:1.13;
}

.hero-main .story-body{padding:21px}

.side{
display:grid;
gap:14px;
}

.quote{
padding:22px;
min-height:155px;
display:flex;
flex-direction:column;
justify-content:center;
background:linear-gradient(135deg,var(--panel),color-mix(in srgb,var(--accent) 7%,var(--panel)));
}

.quote-label{
font-size:11px;
font-weight:900;
color:var(--accent);
letter-spacing:.08em;
}

.quote-text{
font-size:21px;
line-height:1.55;
font-weight:850;
margin-top:9px;
transition:opacity .2s;
}

.dashboard{
display:grid;
grid-template-columns:1fr 1fr;
gap:14px;
margin-top:14px;
}

.market,.weather,.trend{padding:17px}

.panel-title{
display:flex;
align-items:center;
justify-content:space-between;
margin-bottom:12px;
}

.panel-title h3{margin:0;font-size:18px}

.panel-title a{
color:var(--accent);
font-size:12px;
font-weight:850;
}

.market-grid{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:8px;
}

.market-item{
padding:10px;
background:var(--bg);
border:1px solid var(--line);
border-radius:13px;
}

.market-item small{
display:block;
color:var(--muted);
font-weight:700;
}

.market-item strong{
display:block;
margin-top:4px;
font-size:15px;
}

.weather-row{
display:flex;
align-items:center;
gap:12px;
}

.weather-temp{
font-size:34px;
font-weight:950;
}

.weather-city{font-weight:900}

.weather-muted{
font-size:12px;
color:var(--muted);
}

.trend-list{
display:grid;
gap:7px;
}

.trend-item{
display:flex;
justify-content:space-between;
padding:9px 11px;
border-radius:11px;
background:var(--bg);
}

.trend-item strong{color:var(--accent)}

.section{
margin-top:20px;
padding:19px;
}

.section-head{
display:flex;
align-items:end;
justify-content:space-between;
margin-bottom:14px;
}

.section-head h1,.section-head h2{
margin:0;
font-size:26px;
}

.section-head p{
margin:4px 0 0;
color:var(--muted);
}

.grid{
display:grid;
grid-template-columns:repeat(3,minmax(0,1fr));
gap:14px;
}

.story{
background:var(--panel);
border:1px solid var(--line);
border-radius:18px;
overflow:hidden;
min-width:0;
}

.story-link{display:block;height:100%}

.story-media{
position:relative;
aspect-ratio:16/9;
background:linear-gradient(135deg,#e7ebf4,#d5dbea);
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
width:100%;
height:100%;
display:grid;
place-items:center;
background:linear-gradient(135deg,#33405e,#6979aa);
color:#fff;
}

.media-fallback svg{
width:48px;
height:48px;
fill:none;
stroke:currentColor;
stroke-width:1.5;
}

.story-media:not(.no-image) .media-fallback{display:none}

.story-body{padding:14px}

.story-meta{
display:flex;
gap:8px;
align-items:center;
color:var(--muted);
font-size:11px;
margin-bottom:7px;
}

.badge{
padding:4px 8px;
border-radius:999px;
background:color-mix(in srgb,var(--accent) 10%,var(--panel));
color:var(--accent);
font-weight:900;
}

.story h2{
font-size:18px;
line-height:1.4;
margin:0 0 6px;
}

.story p{
margin:0 0 8px;
color:var(--muted);
font-size:13px;
line-height:1.6;
display:-webkit-box;
-webkit-line-clamp:3;
-webkit-box-orient:vertical;
overflow:hidden;
}

.source{
font-size:11px;
color:var(--muted);
}

.featured{grid-column:span 2}

.featured .story-body{padding:18px}

.featured h2{font-size:25px}

.article{
max-width:940px;
margin:18px auto;
background:var(--panel);
border:1px solid var(--line);
border-radius:24px;
overflow:hidden;
box-shadow:var(--shadow);
}

.article-cover{
width:100%;
aspect-ratio:16/8;
object-fit:cover;
display:block;
background:var(--bg);
}

.article-head{
padding:27px 30px 10px;
}

.article h1{
margin:0 0 14px;
font-size:clamp(29px,4vw,48px);
line-height:1.14;
}

.article-body{
padding:8px 30px 35px;
font-size:19px;
line-height:2;
}

.article-body p{margin:0 0 21px}

.empty{
padding:50px 20px;
text-align:center;
color:var(--muted);
}

.forecast{
display:grid;
grid-template-columns:repeat(5,1fr);
gap:9px;
margin-top:17px;
}

.day{
background:var(--bg);
border:1px solid var(--line);
border-radius:15px;
padding:13px;
text-align:center;
}

.city-select{
padding:11px 13px;
border:1px solid var(--line);
border-radius:12px;
background:var(--panel);
color:var(--text);
}

.footer{
max-width:1440px;
margin:auto;
padding:28px 22px;
border-top:1px solid var(--line);
display:flex;
justify-content:space-between;
gap:14px;
flex-wrap:wrap;
color:var(--muted);
font-size:13px;
}

.footer a{margin-inline:6px}

.created{
font-weight:900;
color:var(--text);
}

@media(max-width:1050px){
.hero{grid-template-columns:1fr}
.dashboard{grid-template-columns:1fr}
.grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.featured{grid-column:span 2}
}

@media(max-width:700px){
.top-in{
padding:9px 12px;
gap:7px;
flex-wrap:wrap;
}

.logo{font-size:21px}

.search{
order:5;
width:100%;
flex-basis:100%;
}

.wrap{padding:10px 11px 38px}

.nav{
margin-inline:-11px;
padding-inline:11px;
}

.nav-item{
padding:8px 10px;
font-size:12px;
}

.hero-main .story-media{
height:auto;
aspect-ratio:16/10;
}

.hero-main h2{font-size:23px}

.dashboard{gap:10px}

.market-grid{grid-template-columns:repeat(2,1fr)}

.grid{
grid-template-columns:1fr;
gap:10px;
}

.featured{grid-column:auto}

.story-link{
display:grid;
grid-template-columns:130px minmax(0,1fr);
}

.story-media{aspect-ratio:1/1}

.featured .story-link{display:block}

.featured .story-media{
aspect-ratio:16/10;
}

.story-body{padding:11px}

.story h2,.featured h2{font-size:15.5px}

.story p{display:none}

.story-meta{font-size:10px}

.section{
padding:13px;
border-radius:17px;
}

.section-head h1,.section-head h2{font-size:21px}

.article{
margin:8px 0;
border-radius:19px;
}

.article-head{padding:21px 17px 8px}

.article-body{
padding:7px 17px 27px;
font-size:17px;
line-height:1.9;
}

.forecast{grid-template-columns:repeat(2,1fr)}

.footer{
padding:23px 12px;
font-size:11px;
}
}
`;
}

function shell({lang="ar",title=APP.name,content="",active="",description=""}){
  const ar=lang==="ar";

  const nav=Object.entries(CATEGORIES).map(([key,c])=>`
<a class="nav-item ${active===key?"active":""} tone-${c.tone}" href="/?category=${key}&lang=${lang}">
<span class="nav-icon">${icon(c.icon)}</span>
<span>${ar?c.ar:c.en}</span>
</a>`).join("");

  const canonical=
    title===APP.name
      ? `${APP.origin}/`
      : `${APP.origin}${locationPathForTitle(title)}`;

  return `<!doctype html>
<html lang="${lang}" dir="${ar?"rtl":"ltr"}">
<head>

<meta charset="utf-8">

<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">

<title>${esc(title)} | NowPulse</title>

<meta name="description" content="${esc(
  description||
  (ar
    ?"NowPulse منصة أخبار ومعلومات حديثة."
    :"NowPulse news and information platform.")
)}">

<meta name="theme-color" content="#0b1020">

<link rel="canonical" href="${esc(canonical)}">

<link rel="alternate" hreflang="ar" href="${APP.origin}/?lang=ar">
<link rel="alternate" hreflang="en" href="${APP.origin}/?lang=en">

<style>${baseCSS()}</style>

</head>

<body>

<header class="top">
<div class="top-in">

<a class="logo" href="/?lang=${lang}">
Now<b>Pulse</b>
</a>

<form class="search" action="/search" method="get">
<input
name="q"
required
placeholder="${ar?"ابحث عن أي شخص أو موضوع...":"Search any person or topic..."}">
<input type="hidden" name="lang" value="${lang}">
${icon("search")}
</form>

<button class="icon-btn" id="theme" type="button">
${icon("moon")}
</button>

<a class="lang-btn" href="/?lang=${ar?"en":"ar"}">
${ar?"EN":"عربي"}
</a>

</div>
</header>

<main class="wrap">

<nav class="nav">
${nav}
</nav>

${content}

</main>

<footer class="footer">

<div>
<a href="/?lang=${lang}">${ar?"الرئيسية":"Home"}</a>
<a href="/page/about?lang=${lang}">${ar?"عن الموقع":"About"}</a>
<a href="/page/privacy?lang=${lang}">${ar?"الخصوصية":"Privacy"}</a>
<a href="/page/terms?lang=${lang}">${ar?"الشروط":"Terms"}</a>
<a href="/page/contact?lang=${lang}">${ar?"اتصل بنا":"Contact"}</a>
</div>

<div class="created">Created by Taha</div>

</footer>

<script>
(function(){

const body=document.body;
const key="np-theme";

if(localStorage.getItem(key)==="dark"){
body.classList.add("dark");
}

const button=document.getElementById("theme");

if(button){
button.onclick=function(){
body.classList.toggle("dark");
localStorage.setItem(
key,
body.classList.contains("dark")?"dark":"light"
);
};
}

const quote=document.querySelector(".quote-text");

if(quote){

const quotes=${JSON.stringify(ar?QUOTES_AR:QUOTES_EN)};
let i=0;

setInterval(function(){

quote.style.opacity="0";

setTimeout(function(){
i=(i+1)%quotes.length;
quote.textContent=quotes[i];
quote.style.opacity="1";
},200);

},30000);
}

})();
</script>

</body>
</html>`;
}

function locationPathForTitle(){
  return "/";
}

async function home(env,lang,category){
  let items=[];

  if(category&&category!=="latest"){
    items=await loadCategory(category,lang);
  }else{
    items=await loadLatestFast(lang);
  }

  if(!items.length){
    items=await getArchive(env,lang);
  }

  items=recent(dedupe(items),APP.freshMs);

  if(items.length){
    saveArchive(env,lang,items).catch(()=>{});
  }

  const featured=items[0];
  const rest=items.slice(1,19);
  const trends=trendTopics(items,lang);

  const title=
    category&&CATEGORIES[category]
      ? (lang==="ar"
          ?CATEGORIES[category].ar
          :CATEGORIES[category].en)
      : (lang==="ar"?"آخر الأخبار":"Latest News");

  const content=`

<section class="hero">

${featured
?`<div class="hero-main">${card(featured,lang,true)}</div>`
:`<div class="hero-main empty">
${lang==="ar"?"جارٍ جلب الأخبار الحديثة...":"Loading recent news..."}
</div>`}

<div class="side">

${quoteBox(lang)}

<div class="trend">

<div class="panel-title">
<h3>${lang==="ar"?"🔥 الترند الآن":"🔥 Trending now"}</h3>
</div>

<div class="trend-list">

${
trends.length
?trends.map((x,i)=>`
<div class="trend-item">
<span>${i+1}. ${esc(x.name)}</span>
<strong>${x.count}</strong>
</div>`).join("")
:`<div class="empty">${lang==="ar"?"يتم تحديث الترند...":"Updating trends..."}</div>`
}

</div>
</div>

</div>

</section>

<section class="dashboard">

<div class="market">

<div class="panel-title">
<h3>💰 ${lang==="ar"?"الأسواق":"Markets"}</h3>
<a href="/markets?lang=${lang}">${lang==="ar"?"عرض الكل":"View all"}</a>
</div>

<div class="market-grid">

${["gold","usd","eur","gbp","sar","aed"].map(x=>`
<div class="market-item">
<small>${
x==="gold"?"Gold XAU":
x==="usd"?"USD / EGP":
x==="eur"?"EUR / EGP":
x==="gbp"?"GBP / EGP":
x==="sar"?"SAR / EGP":"AED / EGP"
}</small>
<strong id="${x}">—</strong>
</div>`).join("")}

</div>
</div>

<div class="weather">

<div class="panel-title">
<h3>🌤️ ${lang==="ar"?"الطقس":"Weather"}</h3>
<a href="/weather?lang=${lang}">${lang==="ar"?"كل المدن":"All cities"}</a>
</div>

<div class="weather-row">

<div class="weather-temp" id="wtemp">—</div>

<div>
<div class="weather-city" id="wcity">
${lang==="ar"?"القاهرة":"Cairo"}
</div>

<div class="weather-muted" id="wdesc">
${lang==="ar"?"جارٍ التحميل...":"Loading..."}
</div>
</div>

</div>
</div>

</section>

<section class="section">

<div class="section-head">
<div>
<h1>${esc(title)}</h1>
<p>${lang==="ar"
?"أحدث الأخبار المتاحة الآن."
:"Latest available news."}</p>
</div>
</div>

<div class="grid">

${
rest.length
?rest.map(x=>card(x,lang)).join("")
:`<div class="empty">${lang==="ar"?"لا توجد أخبار حديثة الآن.":"No recent news available."}</div>`
}

</div>

</section>

<script>
Promise.allSettled([
fetch("/api/market").then(x=>x.json()),
fetch("/api/weather?city=Cairo&lang=${lang}").then(x=>x.json())
]).then(function(results){

const market=results[0].status==="fulfilled"?results[0].value:null;
const weather=results[1].status==="fulfilled"?results[1].value:null;

if(market){

const set=(id,value)=>{
const e=document.getElementById(id);
if(e)e.textContent=value;
};

set(
"gold",
market.gold
?"$"+Number(market.gold).toLocaleString(undefined,{maximumFractionDigits:1})
:"—"
);

for(const [id,key] of [
["usd","EGP"],
["eur","EUR"],
["gbp","GBP"],
["sar","SAR"],
["aed","AED"]
]){
set(
id,
market.fx?.[key]
?Number(market.fx[key]).toFixed(2)
:"—"
);
}

}

if(weather?.current){

const c=weather.current;

const temp=document.getElementById("wtemp");
const city=document.getElementById("wcity");
const desc=document.getElementById("wdesc");

if(temp)temp.textContent=Number(c.temperature_2m).toFixed(1)+"°";
if(city)city.textContent=weather.name;

if(desc){
desc.textContent=
"${lang==="ar"?"الرطوبة":"Humidity"} "+
c.relative_humidity_2m+
"% · "+
"${lang==="ar"?"الإحساس":"Feels like"} "+
Number(c.apparent_temperature).toFixed(1)+"°";
}

}

});
</script>
`;

  return shell({
    lang,
    title,
    active:category||"latest",
    content
  });
}

async function searchPage(env,lang,q){
  const items=await searchNews(q,lang);

  return shell({
    lang,
    title:q?`${q} | NowPulse`:"Search | NowPulse",
    content:`
<section class="section">

<div class="section-head">
<div>
<h1>${lang==="ar"?"نتائج البحث":"Search results"}</h1>
<p>${esc(q)}</p>
</div>
</div>

${
items.length
?`<div class="grid">${items.map(x=>card(x,lang)).join("")}</div>`
:`<div class="empty">
${lang==="ar"
?"لم نجد أخبارًا حديثة عن هذا البحث."
:"No recent news was found for this search."}
</div>`
}

</section>`
  });
}

async function findArticle(env,lang,id,q){
  const archive=await getArchive(env,lang);

  let item=archive.find(x=>x.id===id);

  if(item)return item;

  const latest=await loadLatestFast(lang);

  item=latest.find(x=>x.id===id);

  if(item)return item;

  if(q){
    const found=await searchNews(q,lang);

    item=
      found.find(x=>x.id===id)||
      found.find(
        x=>cleanText(x.title).toLowerCase()===
        cleanText(q).toLowerCase()
      )||
      found[0];
  }

  return item||null;
}

async function articlePage(env,lang,id,q){
  let item=await findArticle(env,lang,id,q);

  if(!item){
    return shell({
      lang,
      title:lang==="ar"?"الخبر غير متاح":"Article unavailable",
      content:`
<section class="section empty">
<h1>${lang==="ar"?"الخبر غير متاح":"Article unavailable"}</h1>
<p>${lang==="ar"
?"استخدم البحث للعثور على الخبر."
:"Use search to find this story."}</p>
</section>`
    });
  }

  if(!item.image){
    const image=await extractImage(item.link);

    if(image)item={...item,image};
  }

  const related=
    (await searchNews(item.title,lang))
      .filter(x=>x.id!==item.id)
      .slice(0,6);

  const article=
    await aiArticle(env,item,related,lang)||
    fallbackArticle(item,lang);

  const paragraphs=
    article
      .split(/\n{2,}/)
      .map(x=>cleanText(x))
      .filter(Boolean)
      .map(x=>`<p>${esc(x)}</p>`)
      .join("");

  const cat=CATEGORIES[item.category]||CATEGORIES.latest;

  const cover=item.image
    ?`<img
        class="article-cover"
        src="/api/image?url=${encodeURIComponent(item.image)}"
        alt="${esc(item.title)}"
        loading="eager"
        fetchpriority="high"
        decoding="async"
        referrerpolicy="no-referrer">`
    :`<div class="article-cover" style="display:grid;place-items:center">
        ${icon(cat.icon)}
      </div>`;

  const schema={
    "@context":"https://schema.org",
    "@type":"NewsArticle",
    headline:item.title,
    datePublished:item.publishedAt,
    dateModified:item.publishedAt,
    mainEntityOfPage:`${APP.origin}/article/${encodeURIComponent(item.id)}`,
    publisher:{
      "@type":"Organization",
      name:"NowPulse"
    }
  };

  if(item.image)schema.image=[item.image];

  return shell({
    lang,
    title:item.title,
    active:item.category,
    description:item.description,
    content:`
<script type="application/ld+json">
${JSON.stringify(schema).replace(/</g,"\\u003c")}
</script>

<article class="article">

${cover}

<div class="article-head">

<div class="story-meta">

<span class="badge">
${esc(lang==="ar"?cat.ar:cat.en)}
</span>

<span>${esc(ago(item.publishedAt,lang))}</span>

<span>${esc(item.source||"NowPulse")}</span>

</div>

<h1>${esc(item.title)}</h1>

</div>

<div class="article-body">

${paragraphs}

</div>

</article>`
  });
}

async function weatherPage(lang,city){
  const w=await getWeather(city);

  const options=
    Object.keys(WEATHER_CITIES).map(x=>`
<option value="${x}" ${x===w.city?"selected":""}>
${esc(WEATHER_NAMES[x])}
</option>`).join("");

  const days=
    w.daily?.time?.map((d,i)=>`
<div class="day">
<strong>${esc(d.slice(5))}</strong>
<div style="font-size:27px;margin:9px">
${weatherIcon(w.daily.weather_code?.[i])}
</div>
<div>
${Number(w.daily.temperature_2m_max?.[i]||0).toFixed(0)}°
/
${Number(w.daily.temperature_2m_min?.[i]||0).toFixed(0)}°
</div>
<small>
${esc(weatherLabel(w.daily.weather_code?.[i],lang))}
</small>
</div>`).join("")||"";

  return shell({
    lang,
    title:lang==="ar"?"الطقس":"Weather",
    content:`
<section class="section">

<div class="section-head">
<div>
<h1>🌤️ ${lang==="ar"?"الطقس":"Weather"}</h1>
<p>${lang==="ar"?"اختر أي مدينة مصرية":"Choose an Egyptian city"}</p>
</div>

<select class="city-select" id="city">
${options}
</select>

</div>

<div class="weather">

<div class="weather-row">

<div class="weather-temp">
${w.current?Number(w.current.temperature_2m).toFixed(1)+"°":"—"}
</div>

<div>
<div class="weather-city">${esc(w.name)}</div>
<div class="weather-muted">
${w.current
?esc(weatherLabel(w.current.weather_code,lang))+
" · "+(lang==="ar"?"الرطوبة":"Humidity")+
" "+w.current.relative_humidity_2m+"%"
:"—"}
</div>
</div>

</div>

<div class="forecast">
${days}
</div>

</div>

</section>

<script>
document.getElementById("city").onchange=function(e){
location.href="/weather?lang=${lang}&city="+encodeURIComponent(e.target.value);
};
</script>`
  });
}

async function marketPage(lang){
  const m=await getMarket();

  const values=[
    ["Gold XAU",m.gold?"$"+Number(m.gold).toLocaleString(undefined,{maximumFractionDigits:1}):"—"],
    ["Silver XAG",m.silver?"$"+Number(m.silver).toFixed(2):"—"],
    ["USD / EGP",m.fx.EGP?m.fx.EGP.toFixed(2):"—"],
    ["EUR / EGP",m.fx.EUR?m.fx.EUR.toFixed(2):"—"],
    ["GBP / EGP",m.fx.GBP?m.fx.GBP.toFixed(2):"—"],
    ["SAR / EGP",m.fx.SAR?m.fx.SAR.toFixed(2):"—"],
    ["AED / EGP",m.fx.AED?m.fx.AED.toFixed(2):"—"]
  ];

  return shell({
    lang,
    title:lang==="ar"?"الأسواق":"Markets",
    content:`
<section class="section">

<div class="section-head">
<div>
<h1>💰 ${lang==="ar"?"الأسواق":"Markets"}</h1>
<p>${lang==="ar"
?"بيانات السوق قد تتأخر عن الأسعار الفعلية."
:"Market data may be delayed."}</p>
</div>
</div>

<div class="market-grid">
${values.map(x=>`
<div class="market-item">
<small>${esc(x[0])}</small>
<strong>${esc(x[1])}</strong>
</div>`).join("")}
</div>

</section>`
  });
}

function staticPage(lang,type){
  const ar=lang==="ar";

  const data={
    about:ar
      ?["عن NowPulse","NowPulse منصة رقمية تجمع الأخبار والمعلومات الحديثة في واجهة واحدة، مع البحث والطقس والأسواق والترند."]
      :["About NowPulse","NowPulse is a digital platform for recent news, search, weather, markets and trends."],

    privacy:ar
      ?["الخصوصية","نحترم خصوصية الزوار. قد تستخدم خدمات التحليلات والإعلانات عند تفعيلها وفق سياسات مزوديها."]
      :["Privacy","We respect visitor privacy. Analytics and advertising services may be used when enabled under their providers policies."],

    terms:ar
      ?["الشروط","المحتوى يعرض لأغراض معلوماتية. تحقق من المصادر الموثوقة عند اتخاذ قرارات مالية أو صحية أو قانونية."]
      :["Terms","Content is provided for informational purposes. Verify important financial, health or legal matters with authoritative sources."],

    contact:ar
      ?["اتصل بنا","للاستفسارات والملاحظات يمكن استخدام وسيلة التواصل التي يحددها مالك الموقع."]
      :["Contact","For questions and feedback, use the contact method configured by the site owner."]
  };

  const x=data[type]||data.about;

  return shell({
    lang,
    title:x[0],
    content:`
<section class="article">

<div class="article-head">
<h1>${esc(x[0])}</h1>
</div>

<div class="article-body">
<p>${esc(x[1])}</p>
</div>

</section>`
  });
}

async function proxyImage(target){
  const response=await fetch(target,{
    redirect:"follow",
    headers:{
      "User-Agent":"Mozilla/5.0 (compatible; NowPulse/1.0)"
    }
  });

  if(!response.ok)throw new Error("Image unavailable");

  const type=
    response.headers.get("content-type")||"image/jpeg";

  if(!type.startsWith("image/")){
    throw new Error("Not an image");
  }

  return new Response(response.body,{
    headers:{
      "content-type":type,
      "cache-control":
        "public,max-age=86400,stale-while-revalidate=604800"
    }
  });
}

async function api(request,env,url){

  if(url.pathname==="/api/image"){
    const target=safeUrl(url.searchParams.get("url")||"");

    if(!target)return new Response("Bad URL",{status:400});

    try{
      return await proxyImage(target);
    }catch{
      return new Response("Image unavailable",{status:404});
    }
  }

  if(url.pathname==="/api/resolve-image"){
    const target=safeUrl(url.searchParams.get("url")||"");
    const q=cleanText(url.searchParams.get("q")||"");

    let image="";

    if(target){
      image=await extractImage(target);
    }

    if(!image&&q){
      image=await wikiImage(q);
    }

    if(!image){
      return new Response("Image unavailable",{status:404});
    }

    try{
      return await proxyImage(image);
    }catch{
      return new Response("Image unavailable",{status:404});
    }
  }

  if(url.pathname==="/api/search"){
    const q=url.searchParams.get("q")||"";
    const lang=url.searchParams.get("lang")==="en"?"en":"ar";

    return json({
      ok:true,
      q,
      items:await searchNews(q,lang)
    },"200","public,max-age=60");
  }

  if(url.pathname==="/api/weather"){
    return json(
      await getWeather(
        url.searchParams.get("city")||"Cairo"
      ),
      200,
      "public,max-age=300"
    );
  }

  if(url.pathname==="/api/market"){
    return json(
      await getMarket(),
      200,
      "public,max-age=300"
    );
  }

  if(url.pathname==="/health"){
    return json({
      ok:true,
      service:APP.name,
      ai:Boolean(env.AI),
      kv:Boolean(env.NOWPULSE_KV),
      model:APP.aiModel,
      time:new Date().toISOString()
    });
  }

  return null;
}

function sitemap(){
  const urls=[
    "/",
    "/?lang=ar",
    "/?lang=en",
    "/weather",
    "/markets",
    "/search?q=news&lang=en",
    "/page/about?lang=ar",
    "/page/privacy?lang=ar",
    "/page/terms?lang=ar",
    "/page/contact?lang=ar"
  ];

  for(const key of Object.keys(CATEGORIES)){
    urls.push(`/?category=${key}&lang=ar`);
    urls.push(`/?category=${key}&lang=en`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(x=>`<url><loc>${esc(APP.origin+x)}</loc></url>`).join("")}
</urlset>`;
}

async function rss(env,lang){
  let items=await loadLatestFast(lang);

  if(!items.length){
    items=await getArchive(env,lang);
  }

  const xml=items.slice(0,30).map(x=>`
<item>
<title>${esc(x.title)}</title>
<link>${esc(APP.origin+articleHref(x,lang))}</link>
<pubDate>${new Date(x.publishedAt).toUTCString()}</pubDate>
<description>${esc(x.description||"")}</description>
</item>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>NowPulse</title>
<link>${APP.origin}</link>
<description>NowPulse News</description>
${xml}
</channel>
</rss>`;
}

async function refresh(env){
  if(!env.NOWPULSE_KV)return;

  try{
    const [ar,en]=await Promise.all([
      loadLatestFast("ar"),
      loadLatestFast("en")
    ]);

    const tasks=[];

    if(ar.length)tasks.push(saveArchive(env,"ar",ar));
    if(en.length)tasks.push(saveArchive(env,"en",en));

    await Promise.allSettled(tasks);
  }catch(error){
    console.error("refresh error",error);
  }
}

export default {

async fetch(request,env,ctx){

  const url=new URL(request.url);

  try{

    /*
      Google Search Console HTML verification.
    */
    if(
      url.pathname===
      "/google1dc3867d61891f77.html"
    ){
      return new Response(
        GOOGLE_VERIFICATION,
        {
          headers:{
            "content-type":
              "text/plain; charset=UTF-8",
            "cache-control":
              "public,max-age=86400"
          }
        }
      );
    }

    const response=await api(
      request,
      env,
      url
    );

    if(response)return response;

    const lang=
      url.searchParams.get("lang")==="en"
        ?"en"
        :"ar";

    if(url.pathname==="/"){
      const category=
        url.searchParams.get("category")||
        "latest";

      return new Response(
        await home(env,lang,category),
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

    if(url.pathname==="/search"){
      return new Response(
        await searchPage(
          env,
          lang,
          url.searchParams.get("q")||""
        ),
        {
          headers:{
            "content-type":
              "text/html; charset=UTF-8",
            "cache-control":
              "public,max-age=30"
          }
        }
      );
    }

    if(url.pathname.startsWith("/article/")){
      const id=decodeURIComponent(
        url.pathname.split("/").pop()
      );

      return new Response(
        await articlePage(
          env,
          lang,
          id,
          url.searchParams.get("q")||""
        ),
        {
          headers:{
            "content-type":
              "text/html; charset=UTF-8",
            "cache-control":
              "public,max-age=60,stale-while-revalidate=300"
          }
        }
      );
    }

    if(url.pathname==="/weather"){
      return new Response(
        await weatherPage(
          lang,
          url.searchParams.get("city")||"Cairo"
        ),
        {
          headers:{
            "content-type":
              "text/html; charset=UTF-8",
            "cache-control":
              "public,max-age=120"
          }
        }
      );
    }

    if(url.pathname==="/markets"){
      return new Response(
        await marketPage(lang),
        {
          headers:{
            "content-type":
              "text/html; charset=UTF-8",
            "cache-control":
              "public,max-age=120"
          }
        }
      );
    }

    if(url.pathname.startsWith("/page/")){
      return new Response(
        staticPage(
          lang,
          url.pathname.split("/").pop()
        ),
        {
          headers:{
            "content-type":
              "text/html; charset=UTF-8"
          }
        }
      );
    }

    if(url.pathname==="/robots.txt"){
      return new Response(
`User-agent: *
Allow: /
Disallow: /api/
Disallow: /health

Sitemap: ${APP.origin}/sitemap.xml`,
        {
          headers:{
            "content-type":
              "text/plain; charset=UTF-8",
            "cache-control":
              "public,max-age=86400"
          }
        }
      );
    }

    if(url.pathname==="/sitemap.xml"){
      return new Response(
        sitemap(),
        {
          headers:{
            "content-type":
              "application/xml; charset=UTF-8",
            "cache-control":
              "public,max-age=3600"
          }
        }
      );
    }

    if(url.pathname==="/rss.xml"){
      return new Response(
        await rss(env,lang),
        {
          headers:{
            "content-type":
              "application/rss+xml; charset=UTF-8",
            "cache-control":
              "public,max-age=300"
          }
        }
      );
    }

    return new Response("Not Found",{
      status:404,
      headers:{
        "content-type":
          "text/plain; charset=UTF-8"
      }
    });

  }catch(error){

    console.error(
      "NowPulse request error:",
      error
    );

    return new Response(
      `<!doctype html>
<html lang="${langFromUrl(url)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NowPulse</title>
</head>
<body>
<h1>NowPulse</h1>
<p>Temporary service error.</p>
</body>
</html>`,
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

async scheduled(event,env,ctx){
  ctx.waitUntil(refresh(env));
}

};

function langFromUrl(url){
  return url.searchParams.get("lang")==="en"?"en":"ar";
}
