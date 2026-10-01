const VERSION="9.0.0";
const SITE="https://nowpulse.tavengers16.workers.dev";
const TTL={news:120,markets:60,weather:300,search:90};

const CATEGORIES={
 latest:["الأحدث","Latest"],
 egypt:["مصر","Egypt"],
 arab:["العالم العربي","Arab World"],
 world:["العالم","World"],
 politics:["سياسة","Politics"],
 sports:["رياضة","Sports"],
 economy:["اقتصاد","Economy"],
 tech:["تكنولوجيا","Technology"],
 arts:["فن وترفيه","Arts & Entertainment"],
 health:["صحة","Health"],
 travel:["سفر","Travel"],
 trends:["ترند","Trends"]
};

const QUOTES=[
 "المعلومة الدقيقة بداية القرار الجيد.",
 "الوضوح يوفر وقتًا كثيرًا.",
 "اسأل أولًا، ثم تحقّق، ثم قرّر.",
 "الاستمرار الهادئ يصنع فرقًا.",
 "المعرفة تصبح أقوى عندما تتحول إلى عمل.",
 "التخطيط الجيد يجعل التنفيذ أبسط.",
 "لا تتعجل الحكم قبل اكتمال الصورة.",
 "كل يوم فرصة لتصحيح المسار.",
 "البداية البسيطة أفضل من انتظار البداية المثالية.",
 "التعلّم استثمار لا يضيع.",
 "الخبرة تنمو مع المحاولة والمراجعة.",
 "استمع أكثر، وتحقق أكثر، وافترض أقل.",
 "التفاصيل الصغيرة تصنع الصورة الكبيرة.",
 "ما تتعلمه اليوم قد يفتح لك بابًا غدًا.",
 "القرار الجيد يبدأ بمعلومة جيدة.",
 "الهدوء يساعدك على رؤية ما لا تراه العجلة."
];

const REGIONS={
 ar:[
  ["Egypt","مصر"],
  ["Arab world","العالم العربي"],
  ["World news","العالم"]
 ],
 en:[
  ["Egypt","Egypt"],
  ["Arab world","Arab World"],
  ["World news","World"]
 ]
};

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const clean=v=>String(v??"").replace(/\s+/g," ").trim();
const strip=v=>clean(String(v??"").replace(/<!\[CDATA\[|\]\]>/g,"").replace(/<[^>]*>/g," "));
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=UTF-8","cache-control":"no-store",...headers}});
const text=(data,status=200,headers={})=>new Response(data,{status,headers:{"content-type":"text/plain; charset=UTF-8",...headers}});
const html=(data,status=200)=>new Response(data,{status,headers:{"content-type":"text/html; charset=UTF-8","cache-control":"no-cache, no-store, must-revalidate"}});

function now(){return Date.now();}
function b64(s){return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function unb64(s){try{return decodeURIComponent(escape(atob(s.replace(/-/g,"+").replace(/_/g,"/"))))}catch{return ""}}
function safeUrl(v){try{const u=new URL(v);return /^https?:$/.test(u.protocol)?u.toString():""}catch{return ""}}

async function fetchText(url,headers={}){
 const r=await fetch(url,{headers:{"user-agent":"NowPulse/9.0 (+https://nowpulse.tavengers16.workers.dev)",...headers}});
 if(!r.ok)throw Error("HTTP "+r.status);
 return await r.text();
}
async function fetchJson(url,headers={}){
 const r=await fetch(url,{headers:{"user-agent":"NowPulse/9.0 (+https://nowpulse.tavengers16.workers.dev)","accept":"application/json",...headers}});
 if(!r.ok)throw Error("HTTP "+r.status);
 return await r.json();
}

async function cacheRead(env,key){
 if(!env.NOWPULSE_KV)return null;
 try{
  const v=await env.NOWPULSE_KV.get(key,"json");
  if(v&&v.data&&Number(v.saved)>0)return v;
 }catch{}
 return null;
}
async function cacheWrite(env,key,data,ttl){
 if(!env.NOWPULSE_KV)return;
 try{await env.NOWPULSE_KV.put(key,JSON.stringify({saved:now(),data}),{expirationTtl:Math.max(30,ttl)})}catch{}
}

function xmlTag(xml,tag){
 const re=new RegExp("<"+tag+"(?:\\s[^>]*)?>([\\s\\S]*?)</"+tag+">","i");
 const m=xml.match(re);
 return m?strip(m[1]):"";
}
function xmlAttr(block,tag,attr){
 const re=new RegExp("<"+tag+"\\b[^>]*\\b"+attr+"=[\"']([^\"']+)[\"'][^>]*>","i");
 const m=block.match(re);
 return m?m[1]:"";
}
function mediaUrl(v){return String(v||"").startsWith("//")?"https:"+String(v):String(v||"")}
function goodImage(v){
 const u=safeUrl(v);
 if(!u)return "";
 const x=u.toLowerCase();
 if(/googleusercontent|gstatic|favicon|logo|avatar|icon|placeholder|default[-_ ]?image|sprite/.test(x))return "";
 return u;
}
function parseRss(xml,region){
 const blocks=xml.match(/<item\b[\s\S]*?<\/item>/gi)||[];
 return blocks.map(block=>{
  const link=safeUrl(xmlTag(block,"link"));
  const rawTitle=xmlTag(block,"title");
  const desc=strip(xmlTag(block,"description"));
  const pub=xmlTag(block,"pubDate")||xmlTag(block,"published")||xmlTag(block,"updated");
  const source=xmlTag(block,"source")||region;
  const image=goodImage(xmlAttr(block,"media:content","url"))||goodImage(xmlAttr(block,"media:thumbnail","url"))||goodImage(xmlAttr(block,"enclosure","url"));
  return link&&rawTitle?{id:b64(link),title:clean(rawTitle),description:desc,date:pub?new Date(pub).toISOString():"",link,source:clean(source),image,region}:null;
 }).filter(Boolean);
}

function dedupe(items){
 const seen=new Set();
 return items.filter(x=>{
  const k=(x.link||"").toLowerCase()||clean(x.title).toLowerCase();
  if(seen.has(k))return false;
  seen.add(k);return true;
 });
}

function queryFor(cat,lang){
 const ar=lang==="ar";
 const base=ar?" when:1d":" when:1d";
 const q={
  latest:ar?"أخبار مصر العالم العربي العالم":"Egypt Arab World world news",
  egypt:ar?"مصر أخبار":"Egypt news",
  arab:ar?"العالم العربي أخبار":"Arab World news",
  world:ar?"أخبار العالم":"World news",
  politics:ar?"السياسة أخبار العالم":"world politics news",
  sports:ar?"رياضة مصر العالم":"sports Egypt world",
  economy:ar?"اقتصاد مصر الدولار الذهب":"Egypt economy markets gold currency",
  tech:ar?"تكنولوجيا مصر العالم":"technology Egypt world",
  arts:ar?"فن وترفيه مصر العالم":"arts entertainment Egypt world",
  health:ar?"صحة مصر العالم":"health Egypt world",
  travel:ar?"سفر سياحة مصر العالم":"travel tourism Egypt world",
  trends:ar?"ترند مصر العالم":"trending news Egypt world"
 };
 return q[cat]||q.latest ? (q[cat]||q.latest)+base : q.latest+base;
}

async function feed(env,lang,cat="latest"){
 const key="np9:feed:"+lang+":"+cat;
 const old=await cacheRead(env,key);
 if(old&&now()-old.saved<TTL.news*1000)return old.data;
 const ar=lang==="ar";
 const q=queryFor(cat,lang);
 const regions=REGIONS[lang]||REGIONS.ar;
 const urls=[
  ["regional", "https://news.google.com/rss/search?q="+encodeURIComponent((cat==="latest"?"Egypt":(ar?"مصر": "Egypt"))+" when:1d")+"&hl="+(ar?"ar":"en-US")+"&gl="+(ar?"EG":"US")+"&ceid="+(ar?"EG:ar":"US:en")],
  ["arab", "https://news.google.com/rss/search?q="+encodeURIComponent((cat==="politics"?"politics ": "")+(ar?"العالم العربي":"Arab World")+" when:1d")+"&hl="+(ar?"ar":"en-US")+"&gl="+(ar?"EG":"US")+"&ceid="+(ar?"EG:ar":"US:en"),
  ["world", "https://news.google.com/rss/search?q="+encodeURIComponent(q)+"&hl="+(ar?"ar":"en-US")+"&gl="+(ar?"EG":"US")+"&ceid="+(ar?"EG:ar":"US:en")]
 ];
 const all=[];
 for(const [region,url] of urls){
  try{all.push(...parseRss(await fetchText(url),region))}catch{}
 }
 const data=dedupe(all).sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)).slice(0,36);
 if(data.length)await cacheWrite(env,key,data,TTL.news);
 return data.length?data:(old?.data||[]);
}

function classify(item){
 const s=(item.title+" "+item.description).toLowerCase();
 if(/sport|football|soccer|tennis|basket|رياض|مباراة|منتخب|دوري|كرة/.test(s))return"sports";
 if(/econom|market|gold|dollar|currency|inflation|اقتصاد|ذهب|دولار|عملات|بورصة/.test(s))return"economy";
 if(/technolog|ai |artificial intelligence|technology|تكنولوجيا|ذكاء اصطناعي|تقنية/.test(s))return"tech";
 if(/health|medical|medicine|doctor|صحة|طب|مرض/.test(s))return"health";
 if(/travel|tourism|سفر|سياحة/.test(s))return"travel";
 if(/politic|election|government|president|parliament|سياس|انتخاب|حكومة|رئيس|برلمان/.test(s))return"politics";
 if(/film|movie|music|actor|actress|فن|فيلم|موسيقى|ممثل|ترفيه/.test(s))return"arts";
 return"world";
}

async function news(env,lang="ar",cat="latest"){
 const direct=await feed(env,lang,cat);
 if(cat!=="latest")return direct;
 const out={latest:[],egypt:[],arab:[],world:[],politics:[],sports:[],economy:[],tech:[],arts:[],health:[],travel:[],trends:[]};
 for(const item of direct){
  const c=classify(item);
  out.latest.push(item);
  if(out[c])out[c].push(item);
  const ar=lang==="ar";
  const s=(item.title+" "+item.description).toLowerCase();
  if(ar?s.includes("مصر"):s.includes("egypt"))out.egypt.push(item);
  if(ar?s.includes("العالم العربي"):s.includes("arab"))out.arab.push(item);
  if(/trend|ترند/.test(s))out.trends.push(item);
  if(out.world.length<24)out.world.push(item);
 }
 for(const k of Object.keys(out))out[k]=dedupe(out[k]).slice(0,k==="latest"?18:8);
 return out;
}

async function markets(env){
 const key="np9:markets";
 const old=await cacheRead(env,key);
 if(old&&now()-old.saved<TTL.markets*1000)return old.data;
 let data={usdEgp:null,eurEgp:null,gbpEgp:null,chfEgp:null,gold24:null,gold21:null,gold18:null,updated:null};
 try{
  const r=await fetchJson("https://api.frankfurter.dev/v2/rates?base=USD&symbols=EGP,EUR,GBP,CHF");
  const e=Number(r?.rates?.EGP),eur=Number(r?.rates?.EUR),gbp=Number(r?.rates?.GBP),chf=Number(r?.rates?.CHF);
  if(e>0){data.usdEgp=e; if(eur>0)data.eurEgp=e/eur; if(gbp>0)data.gbpEgp=e/gbp; if(chf>0)data.chfEgp=e/chf;}
 }catch{}
 try{
  const g=await fetchJson("https://goldprice.dev/api/v1/carat?currency=EGP");
  for(const k of ["price_gram_24k","price_gram_21k","price_gram_18k"]){
   if(Number(g?.[k])>0)data[{price_gram_24k:"gold24",price_gram_21k:"gold21",price_gram_18k:"gold18"}[k]]=Number(g[k]);
  }
 }catch{}
 data.updated=new Date().toISOString();
 if(Object.values(data).some(v=>typeof v==="number"&&v>0))await cacheWrite(env,key,data,TTL.markets);
 return old?.data&&!Object.values(data).some(v=>typeof v==="number"&&v>0)?old.data:data;
}

async function weather(env,city="cairo"){
 const key="np9:weather:"+city;
 const old=await cacheRead(env,key);
 if(old&&now()-old.saved<TTL.weather*1000)return old.data;
 const places={cairo:[30.0444,31.2357,"القاهرة","Cairo"],hurghada:[27.2579,33.8116,"الغردقة","Hurghada"],luxor:[25.6872,32.6396,"الأقصر","Luxor"]};
 const p=places[city]||places.cairo;
 try{
  const u="https://api.open-meteo.com/v1/forecast?latitude="+p[0]+"&longitude="+p[1]+"&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto";
  const r=await fetchJson(u);
  const data={cityAr:p[2],cityEn:p[3],temperature:r?.current?.temperature_2m,humidity:r?.current?.relative_humidity_2m,code:r?.current?.weather_code,updated:new Date().toISOString()};
  await cacheWrite(env,key,data,TTL.weather);return data;
 }catch{return old?.data||{cityAr:p[2],cityEn:p[3],temperature:null,humidity:null,code:null}}
}

async function externalSearch(q,lang){
 const results=[];
 const gd="https://api.gdeltproject.org/api/v2/doc/doc?query="+encodeURIComponent(q)+"&mode=artlist&maxrecords=10&format=rss&timespan=7d&sort=HybridRel";
 try{
  const xml=await fetchText(gd);results.push(...parseRss(xml,"Web"));
 }catch{}
 try{
  const wiki=(lang==="ar"?"https://ar.wikipedia.org/w/rest.php/v1/search/page?q=":"https://en.wikipedia.org/w/rest.php/v1/search/page?q=")+encodeURIComponent(q)+"&limit=6";
  const d=await fetchJson(wiki);
  for(const x of (d.pages||[])){
   const img=goodImage(x?.thumbnail?.url?("https:"+x.thumbnail.url):"");
   results.push({id:"wiki-"+b64(x.key||x.title),title:x.title,description:strip(x.description||x.excerpt||""),date:"",link:(lang==="ar"?"https://ar.wikipedia.org/wiki/":"https://en.wikipedia.org/wiki/")+encodeURIComponent(x.key||x.title),source:"Wikipedia",image:img,knowledge:true});
  }
 }catch{}
 return dedupe(results).slice(0,18);
}

function imageSearchUrl(q){
 return "https://commons.wikimedia.org/w/rest.php/v1/search/page?q="+encodeURIComponent(q)+"&limit=4";
}

async function relatedImage(q){
 try{
  const d=await fetchJson(imageSearchUrl(q));
  const x=(d.pages||[]).find(v=>goodImage(mediaUrl(v?.thumbnail?.url)));
  return x?.thumbnail?.url?("https:"+x.thumbnail.url):"";
 }catch{return ""}
}

function langOf(url){return new URL(url).searchParams.get("lang")==="en"?"en":"ar"}
function fmtDate(v,lang){
 if(!v)return "";
 const d=new Date(v);if(Number.isNaN(d.getTime()))return "";
 return new Intl.DateTimeFormat(lang==="ar"?"ar-EG":"en-US",{dateStyle:"medium",timeStyle:"short"}).format(d);
}
function quote(lang){
 const q=QUOTES[Math.floor(Date.now()/3600000)%QUOTES.length];
 return lang==="ar"?q:"Accurate information is the beginning of a good decision.";
}

const CSS=[
":root{--bg:#f5f7fb;--card:#fff;--ink:#172033;--muted:#687386;--line:#e4e8ef;--brand:#0b63ce;--brand2:#084a98;--shadow:0 8px 28px rgba(20,35,60,.07)}",
"*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:'Noto Sans Arabic',Tahoma,Arial,sans-serif;line-height:1.7;overflow-x:hidden}",
"a{color:inherit;text-decoration:none}button,input{font:inherit}.wrap{width:min(1180px,calc(100% - 28px));margin:auto}",
".top{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:20}.bar{min-height:68px;display:flex;align-items:center;gap:18px;justify-content:space-between}.brand{font-weight:900;font-size:24px;letter-spacing:-.5px;color:var(--brand)}.brand small{display:block;font-size:10px;color:var(--muted);font-weight:600;letter-spacing:1.4px}",
".nav{display:flex;gap:6px;overflow:auto;white-space:nowrap;padding:8px 0}.nav a{padding:7px 10px;border-radius:9px;color:#4f5c70;font-size:14px}.nav a:hover,.nav a.active{background:#edf4ff;color:var(--brand);font-weight:700}",
".tools{display:flex;gap:8px}.search{width:min(310px,52vw);height:42px;border:1px solid var(--line);border-radius:11px;padding:0 13px;background:#fff;outline:none}.search:focus{border-color:#9cc4f5;box-shadow:0 0 0 3px #eaf3ff}.btn{border:0;background:var(--brand);color:#fff;border-radius:11px;padding:0 15px;min-height:42px;font-weight:800;cursor:pointer}",
".hero{padding:26px 0 18px}.hero h1{font-size:clamp(25px,4vw,42px);line-height:1.25;margin:0 0 8px}.hero p{color:var(--muted);margin:0}.quote{margin-top:18px;background:linear-gradient(135deg,#0b63ce,#084a98);color:#fff;border-radius:18px;padding:16px 18px;box-shadow:var(--shadow);font-weight:700}",
".markets{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;margin:8px 0 20px}.market{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:11px;min-width:0}.market b{display:block;font-size:12px;color:var(--muted)}.market strong{display:block;font-size:16px;margin-top:2px;white-space:nowrap}.market em{font-size:10px;color:var(--muted);font-style:normal}",
".weather{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:8px 12px;color:#526074;font-size:13px}",
".section{margin:25px 0}.section-head{display:flex;align-items:end;justify-content:space-between;gap:10px;margin-bottom:12px}.section h2{font-size:21px;margin:0}.section-head a{font-size:13px;color:var(--brand);font-weight:700}",
".grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.lead{grid-column:span 2}.card{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);min-width:0}.thumb{aspect-ratio:16/9;background:#eaf0f7;overflow:hidden}.thumb img{width:100%;height:100%;object-fit:cover;display:block}.placeholder{height:100%;display:grid;place-items:center;color:#8793a5;font-weight:800;font-size:13px;padding:20px;text-align:center}.card-body{padding:14px}.meta{font-size:11px;color:var(--brand);font-weight:800;margin-bottom:5px}.card h3{font-size:17px;line-height:1.5;margin:0;overflow-wrap:anywhere}.lead h3{font-size:22px}.desc{font-size:13px;color:var(--muted);line-height:1.8;margin:7px 0 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}",
".article{max-width:900px;margin:32px auto 60px}.article .kicker{color:var(--brand);font-weight:900;font-size:13px}.article h1{font-size:clamp(30px,5vw,48px);line-height:1.35;margin:8px 0 12px;overflow-wrap:anywhere}.article .dek{font-size:18px;color:#596579;line-height:1.9;margin:0 0 16px}.article .meta-line{color:#778295;font-size:13px;border-bottom:1px solid var(--line);padding-bottom:14px}.article .hero-img{width:100%;max-height:540px;object-fit:cover;border-radius:18px;margin:20px 0}.article section{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;margin:14px 0}.article section h2{font-size:20px;margin:0 0 8px}.article section p{font-size:16px;line-height:2;margin:0 0 10px}.source{display:inline-flex;margin-top:8px;color:var(--brand);font-weight:800}",
".search-list{display:grid;gap:12px}.result{background:#fff;border:1px solid var(--line);border-radius:14px;padding:15px}.result h3{margin:0 0 5px;font-size:18px}.result p{margin:0;color:var(--muted);font-size:13px}.result .source{font-size:11px;margin:5px 0 0}",
".empty{background:#fff;border:1px dashed #cbd3df;border-radius:15px;padding:30px;text-align:center;color:var(--muted)}footer{border-top:1px solid var(--line);margin-top:40px;padding:25px 0;color:#778295;font-size:12px}",
"@media(max-width:900px){.markets{grid-template-columns:repeat(4,1fr)}.grid{grid-template-columns:repeat(2,1fr)}.lead{grid-column:span 2}.bar{flex-wrap:wrap;padding:10px 0}.tools{order:3;width:100%}.search{flex:1;width:auto}}",
"@media(max-width:560px){.wrap{width:min(100% - 18px,1180px)}.markets{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}.lead{grid-column:span 1}.lead h3{font-size:19px}.nav a{font-size:13px;padding:6px 8px}.article h1{font-size:29px}.article .dek{font-size:16px}.article section{padding:16px}.article section p{font-size:15px}.hero{padding-top:20px}}"
].join("");

function navHtml(lang,active){
 const ar=lang==="ar";
 return Object.entries(CATEGORIES).map(([k,v])=>"<a class='"+(active===k?"active":"")+"' href='/category/"+k+"?lang="+lang+"'>"+esc(ar?v[0]:v[1])+"</a>").join("");
}
function shell(lang,titleText,active,body){
 const ar=lang==="ar";
 const dir=ar?"rtl":"ltr";
 const other=ar?"en":"ar";
 return "<!doctype html><html lang='"+lang+"' dir='"+dir+"'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><meta name='description' content='"+esc(titleText)+" | NowPulse'><link rel='canonical' href='"+SITE+"'><title>"+esc(titleText)+" | NowPulse</title><style>"+CSS+"</style></head><body><header class='top'><div class='wrap'><div class='bar'><a class='brand' href='/?lang="+lang+"'>NowPulse<small>نبض الآن</small></a><div class='tools'><form action='/search' method='get'><input type='hidden' name='lang' value='"+lang+"'><input class='search' name='q' required placeholder='"+(ar?"ابحث عن شخص أو حدث أو موضوع...":"Search a person, event or topic...")+"' aria-label='Search'><button class='btn' type='submit'>"+(ar?"بحث":"Search")+"</button></form><a class='btn' href='/?lang="+other+"'>"+(ar?"EN":"عربي")+"</a></div></div><nav class='nav' aria-label='Categories'>"+navHtml(lang,active)+"</nav></div></header><main class='wrap'>"+body+"</main><footer><div class='wrap'>NowPulse · Created by Taha</div></footer></body></html>";
}

function card(item,lang,lead=false){
 const ar=lang==="ar";
 const href="/article/"+encodeURIComponent(item.id)+"?lang="+lang;
 const img=goodImage(item.image);
 const fallback="<div class='placeholder' data-image-query='"+esc(item.title)+"'>"+(ar?"صورة مرتبطة بالموضوع":"Topic image")+"</div>";
 return "<article class='card "+(lead?"lead":"")+"'><a href='"+href+"'><div class='thumb'>"+(img?"<img src='"+esc(img)+"' alt='"+esc(item.title)+"' loading='lazy' referrerpolicy='no-referrer'>":fallback)+"</div><div class='card-body'><div class='meta'>"+esc(item.source||"NowPulse")+" · "+esc(fmtDate(item.date,lang))+"</div><h3>"+esc(item.title)+"</h3>"+(item.description?"<p class='desc'>"+esc(item.description)+"</p>":"")+"</div></a></article>";
}

function sectionHtml(key,items,lang){
 if(!items?.length)return "";
 const ar=lang==="ar";
 const label=CATEGORIES[key]?.[ar?0:1]||key;
 return "<section class='section'><div class='section-head'><h2>"+esc(label)+"</h2><a href='/category/"+key+"?lang="+lang+"'>"+(ar?"عرض الكل":"View all")+"</a></div><div class='grid'>"+items.slice(0,6).map((x,i)=>card(x,lang,i===0)).join("")+"</div></section>";
}

async function home(env,lang){
 const data=await news(env,lang,"latest");
 const m=await markets(env);
 const w=await weather(env,"cairo");
 const ar=lang==="ar";
 const value=v=>typeof v==="number"&&v>0?v.toFixed(2):"—";
 const body="<section class='hero'><h1>"+(ar?"المعلومة الدقيقة تبدأ من مصدر موثوق":"Accurate information starts with a trusted source")+"</h1><p>"+(ar?"أخبار مصر والعالم العربي أولًا، ثم الأخبار العالمية، مع فصل واضح بين الخبر والمعلومة.":"Egypt and Arab news first, followed by global coverage, with clear separation between news and knowledge.")+"</p><div class='quote'>"+esc(quote(lang))+"</div></section><div class='markets' aria-label='Markets'><div class='market'><b>USD / EGP</b><strong>"+value(m.usdEgp)+"</strong><em>"+(ar?"دولار":"USD")+"</em></div><div class='market'><b>EUR / EGP</b><strong>"+value(m.eurEgp)+"</strong><em>"+(ar?"يورو":"EUR")+"</em></div><div class='market'><b>GBP / EGP</b><strong>"+value(m.gbpEgp)+"</strong><em>"+(ar?"جنيه إسترليني":"GBP")+"</em></div><div class='market'><b>CHF / EGP</b><strong>"+value(m.chfEgp)+"</strong><em>"+(ar?"فرنك":"CHF")+"</em></div><div class='market'><b>Gold 24K</b><strong>"+value(m.gold24)+"</strong><em>EGP / g</em></div><div class='market'><b>Gold 21K</b><strong>"+value(m.gold21)+"</strong><em>EGP / g</em></div><div class='market'><b>Gold 18K</b><strong>"+value(m.gold18)+"</strong><em>EGP / g</em></div></div><div class='weather'>☁ <span>"+(ar?w.cityAr:w.cityEn)+" · "+(typeof w.temperature==="number"?w.temperature.toFixed(1):"—")+"°C · "+(typeof w.humidity==="number"?w.humidity.toFixed(0):"—")+"%</span></div>"+sectionHtml("egypt",data.egypt,lang)+sectionHtml("arab",data.arab,lang)+sectionHtml("world",data.world,lang)+sectionHtml("politics",data.politics,lang)+sectionHtml("sports",data.sports,lang)+sectionHtml("economy",data.economy,lang)+sectionHtml("tech",data.tech,lang);
 return shell(lang,ar?"نبض الآن":"NowPulse","latest",body);
}

async function categoryPage(env,lang,cat){
 const items=await feed(env,lang,cat);
 const ar=lang==="ar", label=CATEGORIES[cat]?.[ar?0:1]||cat;
 const body="<section class='hero'><h1>"+esc(label)+"</h1><p>"+(ar?"أحدث النتائج من مصادر الأخبار المتاحة":"Latest results from available news sources")+"</p></section>"+(items.length?"<div class='grid'>"+items.map((x,i)=>card(x,lang,i===0)).join("")+"</div>":"<div class='empty'>"+(ar?"لا توجد أخبار حديثة متاحة الآن.":"No recent news is available right now.")+"</div>");
 return shell(lang,label,cat,body);
}

async function articlePage(env,lang,id){
 const link=unb64(decodeURIComponent(id));
 let item=null;
 const all=await feed(env,lang,"latest");
 item=all.find(x=>x.id===id||x.link===link)||null;
 if(!item&&link){
  try{
   const u=safeUrl(link);
   if(u){
    const page=await fetchText(u);
    const og=page.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i);
    const desc=page.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
    item={id:b64(u),title:strip((page.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||link),description:strip((desc||[])[1]||""),date:"",link:u,source:new URL(u).hostname,image:goodImage((og||[])[1])};
   }
  }catch{}
 }
 if(!item)return html(shell(lang,lang==="ar"?"المقال غير متاح":"Article unavailable","", "<div class='empty'>"+(lang==="ar"?"هذا المقال لم يعد متاحًا.":"This article is no longer available.")+"</div>"),404);
 const ar=lang==="ar";
 let img=goodImage(item.image);
 if(!img)img=await relatedImage(item.title);
 const desc=item.description|| (ar?"تفاصيل الخبر متاحة عبر المصدر الأصلي.":"The story details are available at the original source.");
 const body="<article class='article'><div class='kicker'>"+esc(item.source||"NowPulse")+"</div><h1>"+esc(item.title)+"</h1><p class='dek'>"+esc(desc)+"</p><div class='meta-line'>"+esc(fmtDate(item.date,lang))+"</div>"+(img?"<img class='hero-img' src='"+esc(img)+"' alt='"+esc(item.title)+"' referrerpolicy='no-referrer'>":"")+"<section><h2>"+(ar?"ملخص الخبر":"Summary")+"</h2><p>"+esc(desc)+"</p></section><section><h2>"+(ar?"ماذا نعرف حتى الآن؟":"What we know so far")+"</h2><p>"+(ar?"هذه الصفحة تعرض المعلومات المتاحة في موجز المصدر، مع الحفاظ على رابط المصدر الأصلي. لم تتم إضافة تفاصيل غير موجودة في المصدر.":"This page presents the information available in the source feed and keeps the original source link. No unsupported details are added.")+"</p></section><a class='source' href='"+esc(item.link)+"' target='_blank' rel='noopener noreferrer'>"+(ar?"قراءة المصدر الأصلي ↗":"Read original source ↗")+"</a></article>";
 return shell(lang,item.title,"",body);
}

async function searchPage(env,url){
 const lang=langOf(url),q=clean(url.searchParams.get("q"));
 const ar=lang==="ar";
 if(!q)return html(shell(lang,ar?"البحث":"Search","", "<div class='hero'><h1>"+(ar?"البحث":"Search")+"</h1></div><div class='empty'>"+(ar?"اكتب كلمة أو اسمًا للبحث.":"Enter a name, topic or keyword.")+"</div>"));
 const key="np9:search:"+lang+":"+q.toLowerCase();
 const old=await cacheRead(env,key);
 const results=old&&now()-old.saved<TTL.search*1000?old.data:await externalSearch(q,lang);
 if(results.length)await cacheWrite(env,key,results,TTL.search);
 const body="<section class='hero'><h1>"+(ar?"نتائج البحث عن: ":"Search results for: ")+esc(q)+"</h1><p>"+(ar?"النتائج تشمل الأخبار والمصادر المعرفية المتاحة خارج الموقع أيضًا.":"Results include available news and knowledge sources beyond this site.")+"</p></section><div class='search-list'>"+(results.length?results.map(x=>"<article class='result'><h3><a href='"+(x.knowledge?esc(x.link):"/article/"+encodeURIComponent(x.id)+"?lang="+lang)+"'>"+esc(x.title)+"</a></h3><p>"+esc(x.description||"")+"</p><div class='source'>"+esc(x.source||"Web")+"</div></article>").join(""):"<div class='empty'>"+(ar?"لم نعثر على نتائج متاحة.":"No results were found.")+"</div>")+"</div>";
 return shell(lang,ar?"البحث":"Search","",body);
}

function robots(){return "User-agent: *\nAllow: /\nSitemap: "+SITE+"/sitemap.xml\n";}
function sitemap(){const cats=Object.keys(CATEGORIES);return "<?xml version='1.0' encoding='UTF-8'?><urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'><url><loc>"+SITE+"/</loc></url>"+cats.map(c=>"<url><loc>"+SITE+"/category/"+c+"</loc></url>").join("")+"</urlset>"}
function rss(){return "<?xml version='1.0' encoding='UTF-8'?><rss version='2.0'><channel><title>NowPulse</title><link>"+SITE+"</link><description>NowPulse news and information</description></channel></rss>"}

export default {
 async fetch(request,env){
  const u=new URL(request.url),p=u.pathname,lang=langOf(u);
  try{
   if(p==="/health")return json({ok:true,service:"NowPulse",version:VERSION,time:new Date().toISOString()});
   if(p==="/ads.txt")return text("google.com, pub-1235197294708204, DIRECT, f08c47fec0942fa0\n");
   if(p==="/robots.txt")return text(robots());
   if(p==="/sitemap.xml")return new Response(sitemap(),{headers:{"content-type":"application/xml; charset=UTF-8"}});
   if(p==="/rss.xml")return new Response(rss(),{headers:{"content-type":"application/rss+xml; charset=UTF-8"}});
   if(p==="/api/news")return json(await news(env,lang,"latest"));
   if(p==="/api/markets")return json(await markets(env));
   if(p==="/api/weather")return json(await weather(env,u.searchParams.get("city")||"cairo"));
   if(p==="/api/image"){const q=clean(u.searchParams.get("q"));return json({image:q?await relatedImage(q):""})}
   if(p==="/search")return await searchPage(env,u);
   if(p.startsWith("/article/"))return await articlePage(env,lang,p.split("/")[2]||"");
   if(p.startsWith("/category/"))return await categoryPage(env,lang,p.split("/")[2]||"latest");
   return await home(env,lang);
  }catch(e){
   console.error("NowPulse error",e?.stack||e);
   return json({ok:false,error:"internal_error",version:VERSION},500);
  }
 },
 async scheduled(controller,env,ctx){ctx.waitUntil(markets(env).catch(()=>{}));}
};
