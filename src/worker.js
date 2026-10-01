import { NowPulseGuardian } from "./ai-guardian.js";
import { getAgentByName } from "agents";
import { NowPulseMaintenanceWorkflow } from "./nowpulse-maintenance-workflow.js";
const VERSION = "6.1.1";
const SITE = "https://nowpulse.tavengers16.workers.dev";
const AI_MODEL = "@cf/zai-org/glm-5.2";
const AI_FALLBACK_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MAX_LATEST = 120;
const ARCHIVE_DAYS = 14;
const FRESH_HOURS = 72;
const FETCH_TIMEOUT = 7000;

const CATEGORIES = {
  latest:{ar:"آخر الأخبار",en:"Latest"}, egypt:{ar:"مصر",en:"Egypt"},
  world:{ar:"العالم",en:"World"}, politics:{ar:"سياسة",en:"Politics"},
  sports:{ar:"رياضة",en:"Sports"}, economy:{ar:"اقتصاد",en:"Economy"},
  tech:{ar:"تكنولوجيا",en:"Technology"}, arts:{ar:"فن",en:"Arts"},
  health:{ar:"صحة",en:"Health"}, travel:{ar:"سفر",en:"Travel"}, trends:{ar:"ترند",en:"Trends"}
};
const FEEDS_EN=[["egypt","https://news.google.com/rss/search?q=Egypt+OR+Cairo+OR+Alexandria+OR+Giza+OR+Hurghada+OR+Luxor+when:2d&hl=en&gl=EG&ceid=EG:en"],["politics","https://news.google.com/rss/search?q=Egypt+government+OR+Egypt+president+OR+Egypt+parliament+when:2d&hl=en&gl=EG&ceid=EG:en"],["sports","https://news.google.com/rss/search?q=Egypt+football+OR+Al+Ahly+OR+Zamalek+OR+Mohamed+Salah+when:2d&hl=en&gl=EG&ceid=EG:en"],["economy","https://news.google.com/rss/search?q=Egypt+economy+OR+Egypt+pound+OR+gold+OR+dollar+when:2d&hl=en&gl=EG&ceid=EG:en"],["tech","https://news.google.com/rss/search?q=Egypt+technology+OR+AI+OR+telecom+when:3d&hl=en&gl=EG&ceid=EG:en"],["arts","https://news.google.com/rss/search?q=Egypt+entertainment+OR+Egypt+artists+when:3d&hl=en&gl=EG&ceid=EG:en"],["health","https://news.google.com/rss/search?q=Egypt+health+OR+Egypt+medicine+when:3d&hl=en&gl=EG&ceid=EG:en"],["world","https://news.google.com/rss/search?q=Saudi+Arabia+OR+UAE+OR+Qatar+OR+Kuwait+OR+Bahrain+OR+Oman+when:2d&hl=en&gl=SA&ceid=SA:en"],["world","https://news.google.com/rss/search?q=Iraq+OR+Jordan+OR+Lebanon+OR+Syria+OR+Palestine+when:2d&hl=en&gl=JO&ceid=JO:en"],["world","https://news.google.com/rss/search?q=Morocco+OR+Algeria+OR+Tunisia+OR+Libya+OR+Mauritania+when:2d&hl=en&gl=MA&ceid=MA:en"],["world","https://news.google.com/rss/search?q=Sudan+OR+Yemen+OR+Somalia+OR+Djibouti+when:2d&hl=en&gl=SA&ceid=SA:en"],["sports","https://news.google.com/rss/search?q=Arab+football+OR+Saudi+football+OR+Qatar+football+OR+UAE+football+when:2d&hl=en&gl=SA&ceid=SA:en"],["economy","https://news.google.com/rss/search?q=Saudi+economy+OR+UAE+economy+OR+Qatar+economy+OR+Arab+markets+when:2d&hl=en&gl=SA&ceid=SA:en"],["world","https://news.google.com/rss/search?q=Middle+East+OR+Arab+world+OR+international+when:2d&hl=en&gl=EG&ceid=EG:en"],["world","https://news.google.com/rss/search?q=world+news+when:2d&hl=en&gl=US&ceid=US:en"],["trends","https://news.google.com/rss/search?q=Egypt+OR+Arab+viral+OR+trending+when:12h&hl=en&gl=EG&ceid=EG:en"]
];
const DIRECT_FALLBACK_FEEDS=[
 ["egypt","https://english.ahram.org.eg/RSS/News/NewsFeed.aspx"],
 ["world","https://www.aljazeera.com/xml/rss/all.xml"],
 ["world","https://www.aljazeera.net/aljazeerarss/a7c186be-1adb-4b11-a982-4783e765316e/4e17ecdc-8fb9-40de-a5d6-d00f72384a51"]
];
const FEEDS=[
 ["egypt","https://news.google.com/rss/search?q=Egypt+OR+Cairo+OR+Alexandria+OR+Giza+OR+Hurghada+OR+Luxor+when:2d&hl=ar&gl=EG&ceid=EG:ar"],
 ["egypt","https://news.google.com/rss/search?q=مصر+OR+القاهرة+OR+الإسكندرية+OR+الجيزة+OR+الغردقة+OR+الأقصر+when:2d&hl=ar&gl=EG&ceid=EG:ar"],
 ["egypt","https://news.google.com/rss/search?q=Egypt+government+OR+Egypt+economy+OR+Egypt+sports+when:2d&hl=en&gl=EG&ceid=EG:en"],
 ["politics","https://news.google.com/rss/search?q=Egypt+president+OR+Egypt+government+OR+Egypt+parliament+when:2d&hl=ar&gl=EG&ceid=EG:ar"],
 ["sports","https://news.google.com/rss/search?q=Egypt+football+OR+Al+Ahly+OR+Zamalek+OR+Mohamed+Salah+when:2d&hl=ar&gl=EG&ceid=EG:ar"],
 ["economy","https://news.google.com/rss/search?q=Egypt+economy+OR+Egypt+pound+OR+gold+OR+dollar+when:2d&hl=ar&gl=EG&ceid=EG:ar"],
 ["tech","https://news.google.com/rss/search?q=Egypt+technology+OR+AI+OR+telecom+when:3d&hl=ar&gl=EG&ceid=EG:ar"],
 ["arts","https://news.google.com/rss/search?q=Egypt+entertainment+OR+Egypt+artists+when:3d&hl=ar&gl=EG&ceid=EG:ar"],
 ["health","https://news.google.com/rss/search?q=Egypt+health+OR+Egypt+medicine+when:3d&hl=ar&gl=EG&ceid=EG:ar"],
 ["world","https://news.google.com/rss/search?q=السعودية+OR+الإمارات+OR+قطر+OR+الكويت+OR+البحرين+OR+عمان+when:2d&hl=ar&gl=EG&ceid=EG:ar"],
 ["world","https://news.google.com/rss/search?q=العراق+OR+الأردن+OR+لبنان+OR+سوريا+OR+فلسطين+when:2d&hl=ar&gl=EG&ceid=EG:ar"],
 ["world","https://news.google.com/rss/search?q=المغرب+OR+الجزائر+OR+تونس+OR+ليبيا+OR+موريتانيا+when:2d&hl=ar&gl=EG&ceid=EG:ar"],
 ["world","https://news.google.com/rss/search?q=السودان+OR+اليمن+OR+الصومال+OR+جيبوتي+when:2d&hl=ar&gl=EG&ceid=EG:ar"],
 ["world","https://news.google.com/rss/search?q=Saudi+Arabia+OR+UAE+OR+Qatar+OR+Kuwait+OR+Bahrain+OR+Oman+when:2d&hl=en&gl=SA&ceid=SA:en"],
 ["world","https://news.google.com/rss/search?q=Iraq+OR+Jordan+OR+Lebanon+OR+Syria+OR+Palestine+when:2d&hl=en&gl=JO&ceid=JO:en"],
 ["world","https://news.google.com/rss/search?q=Morocco+OR+Algeria+OR+Tunisia+OR+Libya+when:2d&hl=en&gl=MA&ceid=MA:en"],
 ["world","https://news.google.com/rss/search?q=Sudan+OR+Yemen+OR+Somalia+when:2d&hl=en&gl=SA&ceid=SA:en"],
 ["sports","https://news.google.com/rss/search?q=Arab+football+OR+Saudi+football+OR+Qatar+football+OR+UAE+football+when:2d&hl=ar&gl=SA&ceid=SA:ar"],
 ["economy","https://news.google.com/rss/search?q=Saudi+economy+OR+UAE+economy+OR+Qatar+economy+OR+Arab+markets+when:2d&hl=en&gl=SA&ceid=SA:en"],
 ["world","https://news.google.com/rss/search?q=Middle+East+OR+Arab+world+when:2d&hl=ar&gl=EG&ceid=EG:ar"],
 ["world","https://news.google.com/rss/search?q=العالم+OR+دولي+OR+أخبار+عالمية+when:2d&hl=ar&gl=EG&ceid=EG:ar"],
 ["trends","https://news.google.com/rss/search?q=ترند+OR+متداول+OR+عاجل+مصر+when:12h&hl=ar&gl=EG&ceid=EG:ar"],
 ["trends","https://news.google.com/rss/search?q=ترند+OR+متداول+OR+عاجل+عربي+when:12h&hl=ar&gl=EG&ceid=EG:ar"]
];
const CITY_COORDS={cairo:[30.0444,31.2357],alexandria:[31.2001,29.9187],giza:[30.0131,31.2089],hurghada:[27.2579,33.8116],luxor:[25.6872,32.6396],aswan:[24.0889,32.8998],qena:[26.1551,32.716],sohag:[26.5591,31.6959],assiut:[27.1801,31.1837],mansoura:[31.0409,31.3785],tanta:[30.7865,31.0004],ismailia:[30.5965,32.2715],suez:[29.9668,32.5498],portsaid:[31.2653,32.3019],fayoum:[29.3084,30.8428]};
const QUOTES=[
{ar:"كل يوم جديد يحمل فرصة جديدة.",en:"Every new day brings a new opportunity."},
{ar:"ابدأ بخطوة، وستصل.",en:"Take the first step, and you will get there."},
{ar:"النجاح يبدأ بخطوة صغيرة.",en:"Success starts with a small step."},
{ar:"لا تؤجل ما تستطيع فعله اليوم.",en:"Do not postpone what you can do today."},
{ar:"اجعل اليوم أفضل من الأمس.",en:"Make today better than yesterday."},
{ar:"الصبر مفتاح الفرج.",en:"Patience is the key to relief."},
{ar:"من جدّ وجد، ومن زرع حصد.",en:"Those who work hard will find success."},
{ar:"الوقت الذي يمضي لا يعود.",en:"Time that passes never returns."},
{ar:"ثق بنفسك وابدأ.",en:"Believe in yourself and begin."},
{ar:"الأيام الصعبة لا تدوم.",en:"Hard days do not last."},
{ar:"كل نجاح كبير بدأ بمحاولة.",en:"Every great success began with an attempt."},
{ar:"لا تخف من البداية الجديدة.",en:"Do not fear a new beginning."},
{ar:"خطوة واحدة كل يوم تصنع فرقًا.",en:"One step each day makes a difference."},
{ar:"لا تستسلم لمجرد أن الطريق طويل.",en:"Do not give up just because the road is long."},
{ar:"التعلم اليوم يصنع نجاح الغد.",en:"Learning today builds tomorrow's success."},
{ar:"تقدم ولو ببطء، المهم ألا تتوقف.",en:"Move forward slowly if needed, but keep moving."},
{ar:"الكلمة الطيبة تترك أثرًا جميلًا.",en:"A kind word leaves a lasting impression."},
{ar:"ابتسامتك قد تغيّر يوم شخص.",en:"Your smile may brighten someone's day."},
{ar:"كن أفضل نسخة من نفسك.",en:"Be the best version of yourself."},
{ar:"الفرص تأتي لمن يستعد لها.",en:"Opportunities come to those who prepare."},
{ar:"لا تقارن بدايتك بنهاية غيرك.",en:"Do not compare your beginning with someone else's end."},
{ar:"كل تجربة تعلمك شيئًا.",en:"Every experience teaches you something."},
{ar:"لا تيأس، فالأمور قد تتغير للأفضل.",en:"Do not lose hope; things can change for the better."},
{ar:"خطط جيدًا، ثم ابدأ.",en:"Plan well, then begin."},
{ar:"الهدوء يساعدك على رؤية الأمور بوضوح.",en:"Calmness helps you see things clearly."},
{ar:"احفظ وقتك، فهو لا يعود.",en:"Value your time; it does not return."},
{ar:"ما تزرعه اليوم تحصده غدًا.",en:"What you plant today, you harvest tomorrow."},
{ar:"لا تجعل الخوف يمنعك من المحاولة.",en:"Do not let fear stop you from trying."},
{ar:"الأمل يجعل الطريق أسهل.",en:"Hope makes the road easier."},
{ar:"القليل المستمر أفضل من الكثير المنقطع.",en:"Small consistent effort is better than occasional bursts."},
{ar:"كن صبورًا مع نفسك.",en:"Be patient with yourself."},
{ar:"ابدأ بما لديك، ومن حيث أنت.",en:"Start with what you have, where you are."},
{ar:"لا يوجد وقت أفضل من الآن للبدء.",en:"There is no better time than now to begin."},
{ar:"التغيير يبدأ بقرار.",en:"Change begins with a decision."},
{ar:"حافظ على حلمك واعمل من أجله.",en:"Keep your dream and work for it."},
{ar:"بعد كل عسر يأتي يسر.",en:"After hardship comes ease."},
{ar:"اجعل نيتك طيبة، وسعيك صادقًا.",en:"Keep your intentions good and your effort sincere."},
{ar:"كل صباح فرصة لتبدأ من جديد.",en:"Every morning is a chance to start again."},
{ar:"لا تستهن بخطوة صغيرة.",en:"Never underestimate a small step."},
{ar:"افعل الخير، وسيبقى أثره.",en:"Do good, and its impact will remain."}
];
const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
function cleanText(v){let s=String(v??"");for(let i=0;i<3;i++)s=s.replace(/&(#x[0-9a-f]+|#\d+|nbsp|amp|quot|apos|lt|gt);?/gi,(m,e)=>{const k=e.toLowerCase();if(k==="nbsp")return" ";if(k==="amp")return"&";if(k==="quot")return'"';if(k==="apos")return"'";if(k==="lt")return"<";if(k==="gt")return">";const n=k.startsWith("#x")?parseInt(k.slice(2),16):parseInt(k.slice(1),10);return Number.isFinite(n)&&n>=0&&n<=0x10ffff?String.fromCodePoint(n):" ";});return s.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();}
const stripHtml=cleanText;
const isoDate=v=>{const d=new Date(v||0);return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString();};
function timeoutFetch(url,init={},ms=FETCH_TIMEOUT){const c=new AbortController();const t=setTimeout(()=>{try{c.abort("timeout")}catch{}},ms);return fetch(url,{...init,signal:c.signal}).finally(()=>clearTimeout(t));}
function between(xml,tag){const source=String(xml);const escaped=String(tag).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");const pattern="<"+escaped+"(?:\\s+[^>]*)?>([\\s\\S]*?)</"+escaped+">";const m=source.match(new RegExp(pattern,"i"));return m?m[1]:"";}
function xmlItems(xml){const out=[];for(const block of String(xml).match(/<item\b[\s\S]*?<\/item>/gi)||[]){const title=stripHtml(between(block,"title")),link=stripHtml(between(block,"link")),date=isoDate(stripHtml(between(block,"pubDate")||between(block,"dc:date"))),description=stripHtml(between(block,"description")),source=stripHtml(between(block,"source"));const media=block.match(/<(?:media:content|media:thumbnail)[^>]+url=["']([^"']+)["']/i);const enclosure=block.match(/<enclosure[^>]+url=["']([^"']+)["']/i);const image=media?.[1]||enclosure?.[1]||"";if(title&&link)out.push({title,link,description,source,date,originalImage:image});}return out;}
function classify(title,category){if(category&&CATEGORIES[category])return category;const v=String(title).toLowerCase();if(/football|soccer|match|goal|premier|champions|sport|محمد صلاح|أهلي|زمالك/.test(v))return"sports";if(/stock|market|gold|oil|economy|business|bank|currency|اقتصاد|ذهب|دولار/.test(v))return"economy";if(/technology|tech|ai|apple|google|microsoft|iphone|تكنولوجيا|ذكاء اصطناعي/.test(v))return"tech";if(/health|medical|hospital|doctor|صحة|طب/.test(v))return"health";if(/movie|film|music|actor|actress|entertainment|فن|فيلم|مسلسل/.test(v))return"arts";if(/travel|tourism|flight|airport|سياحة|سفر|طيران/.test(v))return"travel";if(/president|government|election|minister|politic|رئيس|حكومة|انتخابات|سياسة/.test(v))return"politics";return"world";}
function makeId(a){return(`${a.category}-${a.title}-${a.link}`.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi,"-").replace(/^-+|-+$/g,"").slice(0,100))+"-"+new Date(a.date).getTime();}
function normalizeArticle(raw,category){const a={...raw};a.title=cleanText(a.title);a.description=cleanText(a.description);a.source=cleanText(a.source)||"News source";a.date=isoDate(a.date);a.category=classify(a.title,category);a.id=a.id||makeId(a);a.originalImage=/^https?:\/\//i.test(a.originalImage||"")?a.originalImage:"";a.image=a.originalImage||"";const rt=(a.title+" "+a.source).toLowerCase();a.region=/مصر|القاهرة|الإسكندرية|الجيزة|الغردقة|الأقصر|egypt|cairo|alexandria|giza|hurghada|luxor/.test(rt)?"egypt":/السعودية|الإمارات|قطر|الكويت|البحرين|عمان|العراق|الأردن|لبنان|سوريا|فلسطين|المغرب|الجزائر|تونس|ليبيا|موريتانيا|السودان|اليمن|الصومال|saudi|uae|qatar|kuwait|bahrain|oman|iraq|jordan|lebanon|syria|palestine|morocco|algeria|tunisia|libya|mauritania|sudan|yemen|somalia/.test(rt)?"arab":"world";return a;}
async function gdeltFeed(query,category="world",lang="ar"){try{const u="https://api.gdeltproject.org/api/v2/doc/doc?query="+encodeURIComponent(query)+"&mode=artlist&format=json&maxrecords=50&timespan=3d&sort=datedesc";const r=await timeoutFetch(u,{headers:{accept:"application/json","user-agent":"NowPulse/1.0"}},7000);if(!r.ok)return[];const d=await r.json();return(Array.isArray(d?.articles)?d.articles:[]).map(x=>normalizeArticle({title:x.title||"",link:x.url||"",description:x.description||"",source:x.domain||x.sourcecountry||"GDELT",date:x.seendate||new Date().toISOString(),originalImage:x.socialimage||""},category)).filter(a=>a.title&&a.link);}catch{return[];}}
async function gdeltImage(title){try{const q=cleanText(title).slice(0,180);if(!q)return"";const u="https://api.gdeltproject.org/api/v2/doc/doc?query="+encodeURIComponent('"'+q.replace(/"/g," ")+'"')+"&mode=artlist&format=json&maxrecords=12&timespan=30d&sort=datedesc";const r=await timeoutFetch(u,{headers:{accept:"application/json","user-agent":"NowPulseImageBot/1.0"}},5000);if(!r.ok)return"";const d=await r.json();for(const x of Array.isArray(d?.articles)?d.articles:[]){const u=x?.socialimage;if(validArticleImage(u))return u;}}catch{}return"";}
async function fetchHtmlNews(url,category){try{
  const r=await timeoutFetch(url,{headers:{"accept":"text/html,application/xhtml+xml","user-agent":"Mozilla/5.0 NowPulse/6.1"}},7000);
  if(!r.ok)return[];
  const html=await r.text(),out=[],seen=new Set(),base=new URL(url).origin;
  const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for(const m of html.matchAll(re)){
    const href=resolveUrl(m[1],url),title=cleanText(m[2]);
    if(!href||!title||title.length<18||title.length>240||seen.has(href))continue;
    const validPath=/\/(news|portal)\//i.test(new URL(href).pathname);
    if(!validPath)continue;
    if(/^(home|egypt|politics|business|world|sports|health|tourism|latest news|more news|read more|full story)$/i.test(title))continue;
    seen.add(href);
    out.push(normalizeArticle({title,link:href,description:title,source:new URL(url).hostname.replace(/^www\./,""),date:new Date().toISOString(),originalImage:""},category));
    if(out.length>=30)break;
  }
  return out;
}catch{return[]}}
async function fetchFeed(category,url){try{const r=await timeoutFetch(url,{headers:{accept:"application/rss+xml, application/xml, text/xml","user-agent":"Mozilla/5.0 NowPulse/6.1 (+https://nowpulse.tavengers16.workers.dev/)","cache-control":"no-cache"}});if(!r.ok)return[];const cutoff=Date.now()-FRESH_HOURS*3600000;return xmlItems(await r.text()).filter(x=>new Date(x.date).getTime()>=cutoff).map(x=>normalizeArticle(x,category));}catch{return[];}}
function newsPriority(a){const t=(a.title+" "+a.source).toLowerCase();if(a.region==="egypt"||a.category==="egypt"||/مصر|القاهرة|الإسكندرية|الجيزة|الغردقة|الأقصر|egypt|cairo|alexandria|giza|hurghada|luxor/.test(t))return 3;if(a.region==="arab"||/السعودية|الإمارات|قطر|الكويت|البحرين|عمان|العراق|الأردن|لبنان|سوريا|فلسطين|المغرب|الجزائر|تونس|ليبيا|موريتانيا|السودان|اليمن|الصومال|saudi|uae|qatar|kuwait|bahrain|oman|iraq|jordan|lebanon|syria|palestine|morocco|algeria|tunisia|libya|mauritania|sudan|yemen|somalia/.test(t))return 2;return 0;}
async function loadFeed(env,force=false,lang="ar"){const feedKey="feed:latest:"+lang;const cached=env.NOWPULSE_KV?await env.NOWPULSE_KV.get(feedKey,"json").catch(()=>null):null;if(!force&&Array.isArray(cached)&&cached.length)return cached;const feeds=lang==="en"?FEEDS_EN:FEEDS;const groups=await Promise.all(feeds.map(([cat,u])=>fetchFeed(cat,u)));const map=new Map();for(const g of groups)for(const a of g)if(!map.has(a.link||a.title))map.set(a.link||a.title,a);let items=[...map.values()];if(items.length<10){const direct=await Promise.all(DIRECT_FALLBACK_FEEDS.map(([cat,u])=>fetchFeed(cat,u)));for(const g of direct)for(const a of g)if(!map.has(a.link||a.title))map.set(a.link||a.title,a);}if(map.size<10){const htmlFallback=await Promise.all(["https://english.ahram.org.eg/","https://www.aljazeera.net/","https://www.aljazeera.com/"].map(u=>fetchHtmlNews(u,"world")));for(const g of htmlFallback)for(const a of g)if(!map.has(a.link||a.title))map.set(a.link||a.title,a);}if(map.size<10){const fallback=lang==="en"?await gdeltFeed("(Egypt OR Cairo OR Alexandria OR Giza OR Hurghada OR Luxor)","egypt","en"):await gdeltFeed("(Egypt OR Cairo OR Alexandria OR Giza OR Hurghada OR Luxor OR مصر OR القاهرة OR الإسكندرية)","egypt","ar");for(const a of fallback)if(!map.has(a.link||a.title))map.set(a.link||a.title,a);}items=[...map.values()].sort((a,b)=>((newsPriority(b)-newsPriority(a))*6*3600000+(new Date(b.date).getTime()-new Date(a.date).getTime()))).slice(0,MAX_LATEST);if(env.NOWPULSE_KV&&items.length)await env.NOWPULSE_KV.put(feedKey,JSON.stringify(items),{expirationTtl:300}).catch(()=>{});return items;}
async function loadCategoryFeed(env,category,lang="ar"){
  if(!CATEGORIES[category]||category==="latest")return[];
  const feeds=lang==="en"?FEEDS_EN:FEEDS;
  const selected=feeds.filter(([cat])=>cat===category||(category==="egypt"&&cat==="egypt"));
  const groups=await Promise.all(selected.map(([cat,u])=>fetchFeed(cat,u)));
  const map=new Map();
  for(const g of groups)for(const a of g)if(!map.has(a.link||a.title))map.set(a.link||a.title,a);
  if(map.size<6){
    const queries={
      egypt:"Egypt OR Cairo OR Alexandria OR Giza OR Hurghada OR Luxor OR مصر OR القاهرة OR الإسكندرية",
      sports:"Egypt football OR Al Ahly OR Zamalek OR Mohamed Salah OR Arab football OR رياضة OR كرة القدم",
      economy:"Egypt economy OR gold OR dollar OR currency OR markets OR اقتصاد OR ذهب OR دولار",
      politics:"Egypt president OR government OR parliament OR politics OR رئيس مصر OR الحكومة OR البرلمان",
      tech:"Egypt technology OR AI OR telecom OR تكنولوجيا OR ذكاء اصطناعي",
      arts:"Egypt entertainment OR artists OR film OR music OR فن OR سينما OR موسيقى",
      health:"Egypt health OR medicine OR hospital OR صحة OR طب",
      travel:"Egypt tourism OR travel OR flights OR airport OR سياحة OR سفر OR طيران",
      trends:"Egypt trending OR viral OR ترند OR متداول"
    };
    const extra=await gdeltFeed(queries[category]||category,category,lang);
    for(const a of extra)if(!map.has(a.link||a.title))map.set(a.link||a.title,a);
  }
  return [...map.values()].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,60);
}
async function archiveFeed(env,items,lang="ar"){if(!env.NOWPULSE_KV||!items.length)return;const old=await env.NOWPULSE_KV.get("feed:archive:"+lang,"json").catch(()=>[]);const cutoff=Date.now()-ARCHIVE_DAYS*86400000,map=new Map();for(const a of [...items,...(Array.isArray(old)?old:[])]){if(new Date(a.date).getTime()<cutoff)continue;if(!map.has(a.link||a.title))map.set(a.link||a.title,a);}await env.NOWPULSE_KV.put("feed:archive:"+lang,JSON.stringify([...map.values()].slice(0,1000)),{expirationTtl:ARCHIVE_DAYS*86400}).catch(()=>{});}
function resolveUrl(raw,base){try{return new URL(raw,base).href}catch{return"";}}
function imageFromHtml(html,base,title=""){
  const bs=String.fromCharCode(92);
  const bad=/logo|icon|sprite|favicon|avatar|placeholder|default-image|brand|masthead|header-image|site-image|publisher/i;
  const tokens=new Set(cleanText(title).toLowerCase().split(/\s+/).map(x=>x.replace(/[^a-z0-9\u0600-\u06ff]/gi,"")).filter(x=>x.length>2));
  const candidates=[];
  const add=(raw,context="",priority=0)=>{
    const u=resolveUrl(raw,base);
    if(!(u.startsWith("http://")||u.startsWith("https://"))||bad.test(u))return;
    const text=cleanText(context).toLowerCase();
    const path=u.toLowerCase();
    let score=priority;
    for(const t of tokens){
      if(text.includes(t))score+=5;
      if(path.includes(t))score+=2;
    }
    if(/article|story|content|main|featured|hero|news|og:image|twitter:image/i.test(context))score+=3;
    if(/thumb|thumbnail/i.test(context))score+=1;
    if(/logo|icon|avatar|favicon|brand|masthead|header/i.test(text))score-=20;
    candidates.push({u,score});
  };
  const tagRe=new RegExp("<(?:img|meta|link)"+bs+"b[^>]*>","gi");
  const attrRe=new RegExp("(?:src|data-src|data-lazy-src|data-original|content|href)=[\\\"']([^\\\"']+)[\\\"']","i");
  const ctxRe=new RegExp("(?:alt|title|class|id|property|name|rel)=[\\\"']([^\\\"']+)[\\\"']","gi");
  for(const m of String(html).matchAll(tagRe)){
    const tag=m[0];
    const src=tag.match(attrRe);
    if(!src)continue;
    const ctx=[...tag.matchAll(ctxRe)].map(x=>x[1]).join(" ");
    const priority=/property=["'](?:og:image|og:image:url|twitter:image)["']/i.test(tag)?20:0;
    add(src[1],ctx,priority);
  }
  const ld=String(html).match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)||[];
  for(const block of ld){
    try{
      const raw=block.replace(/^<script[^>]*>|<\/script>$/gi,"");
      const data=JSON.parse(raw);
      const nodes=Array.isArray(data)?data:[data,...(Array.isArray(data["@graph"])?data["@graph"]:[])];
      for(const n of nodes){
        const im=n&&n.image;
        for(const v of Array.isArray(im)?im:[im]){
          const u=typeof v==="string"?v:v&&v.url;
          add(u,JSON.stringify(n).slice(0,1800),12);
        }
      }
    }catch{}
  }
  candidates.sort((a,b)=>b.score-a.score);
  return candidates[0]?.u||"";
}
function semanticImageQueries(title){const raw=cleanText(title);const compact=raw.replace(/\b(news|today|latest|breaking|خبر|عاجل|آخر الأخبار|اليوم)\b/gi," ").replace(/\s+/g," ").trim();const tokens=compact.split(/\s+/).filter(Boolean);const queries=[];if(compact)queries.push(compact);if(tokens.length>2)queries.push(tokens.slice(0,6).join(" "));const people=compact.match(/[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3}/g)||[];queries.push(...people);if(/محمد صلاح|mohamed salah/i.test(compact))queries.unshift("Mohamed Salah football");if(/الأهلي|al ahly/i.test(compact))queries.push("Al Ahly football");if(/الزمالك|zamalek/i.test(compact))queries.push("Zamalek football");return [...new Set(queries.map(x=>x.trim()).filter(Boolean))].slice(0,5);}
async function wikipediaImage(query){for(const q of semanticImageQueries(query)){for(const lang of ["en","ar"]){try{const url="https://"+lang+".wikipedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(q)+"&gsrnamespace=0&prop=pageimages&piprop=thumbnail&pithumbsize=1000&format=json&origin=*";const r=await timeoutFetch(url,{},3500);if(!r.ok)continue;const d=await r.json();const pages=Object.values(d?.query?.pages||{});for(const p of pages){const u=p?.thumbnail?.source;if(u&&/^https?:\/\//i.test(u)&&!/logo|icon|symbol|flag/i.test(u))return u;}}catch{}}}return"";}
async function wikimediaImage(query){for(const q of semanticImageQueries(query)){try{const url="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch="+encodeURIComponent(q)+"&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000&format=json&origin=*";const r=await timeoutFetch(url,{},3500);if(!r.ok)continue;const d=await r.json();for(const p of Object.values(d?.query?.pages||{})){const u=p?.imageinfo?.[0]?.thumburl||p?.imageinfo?.[0]?.url;if(u&&/^https?:\/\//i.test(u)&&!/logo|icon|symbol|flag|sprite/i.test(u))return u;}}catch{}}return"";}
function validArticleImage(u){return /^https?:\/\//i.test(u||"")&&!/logo|icon|sprite|favicon|avatar|placeholder|default-image|brand|masthead|header-image|site-image/i.test(u);}
async function extractImage(article){
  try{
    const r=await timeoutFetch(article.link,{redirect:"follow",headers:{"user-agent":"Mozilla/5.0 NowPulseImageBot/2.0","accept":"text/html,application/xhtml+xml"}},6000);
    if(r.ok){const image=imageFromHtml(await r.text(),article.link,article.title);if(validArticleImage(image))return image;}
  }catch{}
  const gd=await gdeltImage(article.title);if(validArticleImage(gd))return gd;
  const semantic=await wikipediaImage(article.title);if(validArticleImage(semantic))return semantic;
  const commons=await wikimediaImage(article.title);if(validArticleImage(commons))return commons;
  return "";
}
async function enrichImages(env,items){
  const list=Array.isArray(items)?items:[];
  const target=list.slice(0,12);
  const rest=list.slice(12);
  const out=[];
  for(let i=0;i<target.length;i+=6){
    const batch=target.slice(i,i+6);
    const results=await Promise.all(batch.map(async a=>{
      const key="img:v6:"+a.id;
      let image=env.NOWPULSE_KV?await env.NOWPULSE_KV.get(key).catch(()=>null):null;
      if(!validArticleImage(image)&&validArticleImage(a.image)) image=a.image;
      if(!validArticleImage(image)) image=await extractImage(a);
      if(!image) image=await wikipediaImage(a.title);
      if(!image) image=await wikimediaImage(a.title);
      if(image && env.NOWPULSE_KV) await env.NOWPULSE_KV.put(key,image,{expirationTtl:604800}).catch(()=>{});
      return {...a,image:image||""};
    }));
    out.push(...results);
  }
  return [...out,...rest];
}
function aiText(r){return r?.response||r?.result?.response||r?.output_text||"";}
function relatedFor(article,items){const stop=new Set(["من","في","على","عن","إلى","مع","هذا","هذه","ذلك","التي","الذي","the","and","for","with","from","news","بعد","قبل","اليوم","أمس"]);const tokens=new Set(cleanText(article.title).toLowerCase().split(/\s+/).map(x=>x.replace(/[^\p{L}\p{N}]/gu,"")).filter(x=>x.length>3&&!stop.has(x)));return items.filter(x=>x.id!==article.id).map(x=>{const xt=cleanText(x.title).toLowerCase().split(/\s+/).map(t=>t.replace(/[^\p{L}\p{N}]/gu,""));const score=xt.reduce((n,t)=>n+(tokens.has(t)?1:0),0);return{...x,score};}).filter(x=>x.score>=2).sort((a,b)=>b.score-a.score).slice(0,5);}
function htmlArticleText(html){
  const src=String(html||"");
  const bodies=[];
  for(const m of src.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{
      const d=JSON.parse(m[1].trim());
      const arr=Array.isArray(d)?d:[d];
      for(const x of arr){if(typeof x?.articleBody==="string")bodies.push(x.articleBody);for(const g of (x?.["@graph"]||[]))if(typeof g?.articleBody==="string")bodies.push(g.articleBody);}
    }catch{}
  }
  const p=[...src.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(x=>cleanText(x[1])).filter(x=>x.length>=45);
  bodies.push(p.join("\n"));
  for(const tag of ["article","main"]){const m=src.match(new RegExp("<"+tag+"\\b[^>]*>([\\s\\S]*?)</"+tag+">","i"));if(m)bodies.push(cleanText(m[1]));}
  return bodies.map(cleanText).sort((a,b)=>b.length-a.length)[0]?.slice(0,18000)||"";
}
async function sourceEvidence(article,env,lang="ar"){const evidence=[];if(article.description)evidence.push("FEED DESCRIPTION:\n"+article.description);try{const r=await timeoutFetch(article.link,{redirect:"follow",headers:{"user-agent":"Mozilla/5.0 NowPulse/7.0","accept":"text/html,application/xhtml+xml,text/plain"}},9000);if(r.ok){const t=htmlArticleText(await r.text());if(t.length>=500)evidence.push("PRIMARY PAGE EXTRACT:\n"+t.slice(0,14000));}}catch{}try{const ext=await externalSearchEvidence(env,article.title,lang);const rel=ext.results.filter(x=>x.link&&x.link!==article.link).slice(0,8);if(rel.length)evidence.push("INDEPENDENT EXTERNAL COVERAGE:\n"+rel.map(x=>x.source+" | "+x.title+"\n"+(x.description||"")+"\n"+(x.link||"")).join("\n\n"));}catch{}return evidence.join("\n\n").slice(0,26000)}
async function writeArticle(env,article,related,lang="ar"){
  const cacheKey="article:v2:"+lang+":"+article.id;
  if(env.NOWPULSE_KV){const cached=await env.NOWPULSE_KV.get(cacheKey).catch(()=>null);if(cached&&cached.length>600)return cached;}
  const evidence=await sourceEvidence(article,env,lang);
  if(!env.AI)return fallbackArticle(article,evidence);
  const requestedLanguage=lang==="en"?"English":"Arabic";
  const relatedText=(related||[]).slice(0,3).map((x,i)=>`RELATED ${i+1}: ${x.title} | ${x.source} | ${x.description}`).join("\n");
  const prompt={messages:[
    {role:"system",content:"You are NowPulse senior news editor. Write a REAL, substantive news article about the primary event, not filler. Use only supplied evidence. Paraphrase; never invent names, numbers, dates, quotes, causes or motives. Explain the confirmed event, people or institutions involved, important figures/details, context and next steps only when supported. Never repeat generic sentences such as 'لا توجد معلومات متاحة'. If evidence is incomplete, state the confirmed facts clearly instead of inventing. Write 7-10 substantial paragraphs in the requested language, plain text, no headings, bullets, labels or source list. Prioritize concrete names, actions, dates, figures and context that are actually present in the evidence. If the primary page is unavailable, use the independent external coverage supplied below to reconstruct the confirmed facts."},
    {role:"user",content:`Language: ${requestedLanguage}
Headline: ${article.title}
Source: ${article.source}
Date: ${article.date}
Feed description: ${article.description||"(none)"}
PRIMARY SOURCE EVIDENCE:
${evidence||"(source page could not be extracted; do not invent beyond the supplied headline/description)"}
RELATED:
${relatedText}
Write the finished article now. Every factual claim must be grounded in the supplied evidence.`}
  ],max_tokens:3200,temperature:0.15};
  try{
    let out="";
    try { out=aiText(await env.AI.run(AI_MODEL,prompt,{reasoning_effort:"high",temperature:0.2,max_completion_tokens:12000})).trim(); }
    catch { out=aiText(await env.AI.run(AI_FALLBACK_MODEL,prompt)).trim(); }
    if(out.length<700)out=aiText(await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast",prompt)).trim();
    out=out.replace(/\r/g,"").replace(/^\`\`\`[a-z]*\s*/i,"").replace(/\s*\`\`\`$/,"").replace(/^#+\s*/gm,"").replace(/^[-*•]\s+/gm,"").trim();
    if(out.length<700)throw Error("AI article output too short");
    if(env.NOWPULSE_KV)await env.NOWPULSE_KV.put(cacheKey,out,{expirationTtl:21600}).catch(()=>{});
    return out;
  }catch(e){console.error("AI article generation failed",e?.message||e);return fallbackArticle(article,evidence);}
}
function fallbackArticle(a,evidence=""){
  const t=cleanText(evidence);
  if(t.length>=500){const p=t.replace(/\n+/g," ").split(/(?<=[.!؟])\s+/u).filter(x=>x.length>45).slice(0,14);if(p.length>=5)return p.join(" ");}
  return [a.title,a.description||"تعذر استخراج نص المصدر الأصلي حاليًا، ولن يتم اختلاق تفاصيل غير مؤكدة.","سيعاد بناء المادة عند توفر المصدر."].filter(Boolean).join("\n\n");
}
async function externalSearchEvidence(env,q,lang="ar"){const query=cleanText(q).slice(0,160);if(!query)return{results:[],evidence:""};const newsUrl="https://news.google.com/rss/search?q="+encodeURIComponent(query+" when:30d")+"&hl="+(lang==="ar"?"ar":"en")+"&gl=EG&ceid=EG:"+(lang==="ar"?"ar":"en");const gdUrl="https://api.gdeltproject.org/api/v2/doc/doc?query="+encodeURIComponent(query)+"&mode=artlist&format=json&maxrecords=20&timespan=30d&sort=datedesc";const wikiUrl="https://"+(lang==="ar"?"ar":"en")+".wikipedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(query)+"&gsrnamespace=0&gsrlimit=5&prop=extracts&exintro=1&explaintext=1&format=json&origin=*";const [news,gd,wiki]=await Promise.all([timeoutFetch(newsUrl,{headers:{accept:"application/rss+xml, application/xml, text/xml"}},6000).catch(()=>null),timeoutFetch(gdUrl,{headers:{accept:"application/json","user-agent":"NowPulse/1.0"}},6000).catch(()=>null),timeoutFetch(wikiUrl,{headers:{accept:"application/json"}},5000).catch(()=>null)]);const out=[];try{if(news?.ok)out.push(...xmlItems(await news.text()).map(x=>normalizeArticle(x,"world")).filter(x=>x.title));}catch{}try{if(gd?.ok){const d=await gd.json();out.push(...(Array.isArray(d?.articles)?d.articles:[]).map(x=>normalizeArticle({title:x.title,link:x.url,description:x.description||"",source:x.domain||"GDELT",date:x.seendate,originalImage:x.socialimage||""},"world")).filter(x=>x.title&&x.link));}}catch{}const wikiItems=[];try{if(wiki?.ok){const d=await wiki.json();for(const x of Object.values(d?.query?.pages||{})){if(x?.title&&x?.extract)wikiItems.push({title:x.title,description:x.extract.slice(0,1800),source:"Wikipedia",link:"https://"+(lang==="ar"?"ar":"en")+".wikipedia.org/wiki/"+encodeURIComponent(String(x.title).replace(/ /g,"_")),date:new Date().toISOString(),category:"world",region:"world",id:"wiki-"+makeId({title:x.title,link:x.title})});}}}catch{}const map=new Map();for(const a of [...out,...wikiItems]){const k=a.link||a.title;if(!map.has(k))map.set(k,a)}const results=[...map.values()].slice(0,30);const evidence=results.slice(0,15).map((a,i)=>"SOURCE "+(i+1)+": "+a.source+" | "+a.title+"\n"+(a.description||"")+"\nURL: "+(a.link||"")).join("\n\n");return{results,evidence};}
async function searchNews(env,q,lang="ar"){q=cleanText(q).slice(0,120);if(!q)return[];const key="search:v9:"+lang+":"+q.toLowerCase();if(env.NOWPULSE_KV){const cached=await env.NOWPULSE_KV.get(key,"json").catch(()=>null);if(Array.isArray(cached)&&cached.length)return cached;}const ext=await externalSearchEvidence(env,q,lang),norm=s=>cleanText(s).toLowerCase().normalize("NFKD").replace(/[\u064B-\u065F\u0670]/g,"").replace(/[إأآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/[^\p{L}\p{N}]+/gu," ").trim(),terms=norm(q).split(/\s+/).filter(t=>t.length>1),local=[];for(const l of lang==="en"?["en","ar"]:["ar","en"]){const a=env.NOWPULSE_KV?await env.NOWPULSE_KV.get("feed:latest:"+l,"json").catch(()=>[]):[],b=env.NOWPULSE_KV?await env.NOWPULSE_KV.get("feed:archive:"+l,"json").catch(()=>[]):[];local.push(...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[]));}const score=a=>{const h=norm((a.title||"")+" "+(a.description||"")+" "+(a.source||""));return terms.reduce((n,t)=>n+(h.includes(t)?1:0),0)};const map=new Map();for(const a of [...local.filter(a=>score(a)>0),...ext.results]){const k=a.link||a.title;if(!map.has(k))map.set(k,a)}const result=[...map.values()].sort((a,b)=>score(b)-score(a)||new Date(b.date)-new Date(a.date)).slice(0,40);if(env.NOWPULSE_KV&&result.length){await env.NOWPULSE_KV.put(key,JSON.stringify(result),{expirationTtl:60}).catch(()=>{});for(const a of result.slice(0,20))await env.NOWPULSE_KV.put("article:"+a.id,JSON.stringify(a),{expirationTtl:604800}).catch(()=>{})}return result;}
async function searchAnswer(env,q,lang="ar"){const ext=await externalSearchEvidence(env,q,lang);if(!ext.results.length)return"";if(!env.AI)return ext.results.slice(0,4).map(x=>x.description||x.title).filter(Boolean).join("\n\n");const p={messages:[{role:"system",content:"You are the NowPulse research assistant. Answer using ONLY supplied external evidence. Give useful factual information, not filler. If evidence is insufficient, say what is confirmed and what is not. Never invent. For current events include dates when supplied. Write 3-6 concise paragraphs in the requested language."},{role:"user",content:"Language: "+(lang==="ar"?"Arabic":"English")+"\nQuestion: "+q+"\nEXTERNAL EVIDENCE:\n"+ext.evidence}],max_tokens:2200,temperature:0.1};try{let o=aiText(await env.AI.run(AI_MODEL,p,{reasoning_effort:"medium",temperature:0.1,max_completion_tokens:5000})).trim();if(o.length<180)o=aiText(await env.AI.run(AI_FALLBACK_MODEL,p)).trim();return o.replace(/^\`\`\`[a-z]*\s*/i,"").replace(/\s*\`\`\`$/,"").trim()}catch{return ext.results.slice(0,4).map(x=>x.description||x.title).filter(Boolean).join("\n\n")}}
async function markets(env){
  const cacheKey="markets:v3";
  const cached=env.NOWPULSE_KV?await env.NOWPULSE_KV.get(cacheKey,"json").catch(()=>null):null;
  const cachedAt=Date.parse(cached?.fetchedAt||cached?.updated||"");
  if(cached&&Number.isFinite(cachedAt)&&Date.now()-cachedAt<60000){
    return cached;
  }
  let usdEgp=0,eurEgp=0,gbpEgp=0,chfEgp=0,gold24k=0,gold21k=0,gold18k=0,ratesDate=null,goldUpdated=null;
  const provider={fx:false,gold:false,fxSource:"",goldSource:""};
  let fxFetchedAt=null,goldFetchedAt=null;
  try{
    const r=await timeoutFetch("https://api.frankfurter.dev/v2/rates?base=USD&quotes=EGP,EUR,GBP,CHF",{headers:{accept:"application/json","cache-control":"no-cache"}},7000);
    if(r.ok){
      const rows=await r.json();
      const rates=Object.fromEntries((Array.isArray(rows)?rows:[]).map(x=>[String(x.quote||"").toUpperCase(),Number(x.rate)||0]));
      usdEgp=rates.EGP||0;
      eurEgp=usdEgp&&rates.EUR?usdEgp/rates.EUR:0;
      gbpEgp=usdEgp&&rates.GBP?usdEgp/rates.GBP:0;
      chfEgp=usdEgp&&rates.CHF?usdEgp/rates.CHF:0;
      ratesDate=(Array.isArray(rows)?rows:[]).map(x=>x.date).filter(Boolean).sort().pop()||null;
      provider.fx=Boolean(usdEgp&&eurEgp&&gbpEgp);
      if(provider.fx){provider.fxSource="frankfurter";fxFetchedAt=new Date().toISOString();}
    }
  }catch{}
  if(!provider.fx){
    try{
      const r=await timeoutFetch("https://open.er-api.com/v6/latest/USD",{headers:{accept:"application/json","cache-control":"no-cache"}},7000);
      if(r.ok){
        const d=await r.json();
        const rates=d?.rates||{};
        usdEgp=Number(rates.EGP)||0;
        eurEgp=usdEgp&&Number(rates.EUR)?usdEgp/Number(rates.EUR):0;
        gbpEgp=usdEgp&&Number(rates.GBP)?usdEgp/Number(rates.GBP):0;
        chfEgp=usdEgp&&Number(rates.CHF)?usdEgp/Number(rates.CHF):0;
        ratesDate=d?.time_last_update_utc||null;
        provider.fx=Boolean(usdEgp&&eurEgp&&gbpEgp);
        if(provider.fx){provider.fxSource="open-er-api";fxFetchedAt=new Date().toISOString();}
      }
    }catch{}
  }
  try{
    const r=await timeoutFetch("https://api.goldprice.dev/v1/carat?currency=EGP",{headers:{accept:"application/json","cache-control":"no-cache"}},7000);
    if(r.ok){
      const gd=await r.json();
      gold24k=Number(gd.price_gram_24k)||0;
      gold21k=Number(gd.price_gram_21k)||0;
      gold18k=Number(gd.price_gram_18k)||0;
      goldUpdated=gd.timestamp||null;
      provider.gold=Boolean(gold24k&&gold21k&&gold18k);
      if(provider.gold){provider.goldSource="goldprice.dev";goldFetchedAt=new Date().toISOString();}
    }
  }catch{}
  if(!provider.gold){
    try{
      const r=await timeoutFetch("https://api.goldprice.dev/v1/convert?from=XAU&to=EGP&amount=1&unit=gram",{headers:{accept:"application/json","cache-control":"no-cache"}},7000);
      if(r.ok){
        const gd=await r.json();
        const gram24=Number(gd?.result)||Number(gd?.rate)||Number(gd?.xau?.price)||Number(gd?.price)||0;
        if(gram24>0){
          gold24k=gram24;
          gold21k=gram24*21/24;
          gold18k=gram24*18/24;
          goldUpdated=gd?.updated_at||gd?.data_state?.as_of||null;
          provider.gold=true;
          provider.goldSource="xaus";
          goldFetchedAt=new Date().toISOString();
        }
      }
    }catch{}
  }
  if(!usdEgp&&cached?.usdEgp)usdEgp=Number(cached.usdEgp)||0;
  if(!eurEgp&&cached?.eurEgp)eurEgp=Number(cached.eurEgp)||0;
  if(!gbpEgp&&cached?.gbpEgp)gbpEgp=Number(cached.gbpEgp)||0;
  if(!chfEgp&&cached?.chfEgp)chfEgp=Number(cached.chfEgp)||0;
  if(!gold24k&&cached?.gold24k)gold24k=Number(cached.gold24k)||0;
  if(!gold21k&&cached?.gold21k)gold21k=Number(cached.gold21k)||0;
  if(!gold18k&&cached?.gold18k)gold18k=Number(cached.gold18k)||0;
  const v={
    updated:fxFetchedAt||goldFetchedAt||cached?.updated||new Date().toISOString(),
    fetchedAt:fxFetchedAt||goldFetchedAt||cached?.fetchedAt||new Date().toISOString(),
    ratesDate:ratesDate||cached?.ratesDate||null,
    usdEgp,eurEgp,gbpEgp,chfEgp,
    gold24k,gold21k,gold18k,
    goldUpdated:goldUpdated||cached?.goldUpdated||null,
    provider:{
      fx:provider.fx||Boolean(cached?.provider?.fx),
      gold:provider.gold||Boolean(cached?.provider?.gold),
      fxSource:provider.fxSource||cached?.provider?.fxSource||"",
      goldSource:provider.goldSource||cached?.provider?.goldSource||""
    }
  };
  if(env.NOWPULSE_KV&&[v.usdEgp,v.eurEgp,v.gbpEgp,v.gold24k,v.gold21k,v.gold18k].every(x=>Number(x)>0))
    await env.NOWPULSE_KV.put(cacheKey,JSON.stringify(v),{expirationTtl:120}).catch(()=>{});
  return v;
}
async function weather(env,city="cairo"){const s=CITY_COORDS[city]?city:"cairo",k="weather:"+s,c=env.NOWPULSE_KV?await env.NOWPULSE_KV.get(k,"json").catch(()=>null):null;if(c)return c;try{const r=await timeoutFetch("https://api.open-meteo.com/v1/forecast?latitude="+CITY_COORDS[s][0]+"&longitude="+CITY_COORDS[s][1]+"&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto",{},5000);if(!r.ok)throw Error();const d=await r.json(),v={city:s,temperature:d.current?.temperature_2m,humidity:d.current?.relative_humidity_2m,code:d.current?.weather_code,updated:new Date().toISOString()};if(env.NOWPULSE_KV)await env.NOWPULSE_KV.put(k,JSON.stringify(v),{expirationTtl:900}).catch(()=>{});return v;}catch{return c||{city:s,temperature:null,humidity:null,code:null};}}
function ageLabel(d,l){const m=Math.max(0,Math.floor((Date.now()-new Date(d).getTime())/60000));if(l==="en")return m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ago`:`${Math.floor(m/1440)}d ago`;return m<60?`منذ ${m} دقيقة`:m<1440?`منذ ${Math.floor(m/60)} ساعة`:`منذ ${Math.floor(m/1440)} يوم`;}
function icon(c){return{sports:"⚽",economy:"📈",politics:"🏛️",tech:"⚡",arts:"🎬",health:"🩺",travel:"✈️",egypt:"🇪🇬",world:"🌍",trends:"🔥",latest:"📰"}[c]||"📰";}
function articleUrl(a,l){return"/article/"+encodeURIComponent(a.id)+"?lang="+l;}
function card(a,l,featured=false){const image=validArticleImage(a.image)?a.image:"/api/image?id="+encodeURIComponent(a.id);return`<article class="card ${featured?"featured":""}"><a class="card-image" href="${articleUrl(a,l)}"><img src="${esc(image)}" loading="${featured?"eager":"lazy"}" decoding="async" width="900" height="560" alt="${esc(a.title)}" onerror="this.closest('.card-image').style.display='none'"></a><div class="card-body"><div class="meta"><span class="category-icon">${icon(a.category)}</span><span>${esc(CATEGORIES[a.category]?.[l]||CATEGORIES.world[l])}</span><span>•</span><span>${ageLabel(a.date,l)}</span></div><h2><a href="${articleUrl(a,l)}">${esc(a.title)}</a></h2><p>${esc(a.description||a.title)}</p><div class="source">${esc(a.source)}</div></div></article>`;}
async function aiStatus(env){try{if(env.NowPulseGuardian){const agent=await getAgentByName(env.NowPulseGuardian,"primary");const state=await agent.getStatus();return {ok:true,configured:true,service:"NowPulse AI Guardian",mode:"autonomous",schedule:"every 15 minutes",githubConfigured:Boolean(env.NOWPULSE_GITHUB_TOKEN),...state};}}catch(e){console.error("AI Guardian status read failed",e?.message||e);}if(env.NOWPULSE_KV){try{const raw=await env.NOWPULSE_KV.get("ai:guardian:status");return {ok:true,configured:true,service:"NowPulse AI Guardian",mode:"autonomous",schedule:"every 15 minutes",...(raw?JSON.parse(raw):{status:"waiting"})};}catch(e){return {ok:false,configured:true,error:String(e?.message||e)};}}return {ok:false,configured:false,service:"NowPulse AI Guardian",status:"unavailable"};}
function envAdsense(lang){
  const client="ca-pub-1235197294708204";
  return '<meta name="google-adsense-account" content="'+client+'"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+client+'" crossorigin="anonymous"></script>';
}
function layout({lang,title,body,active="latest",canonical="",meta=""}){const rtl=lang==="ar";const nav=Object.entries(CATEGORIES).map(([k,v])=>`<a class="${active===k?"active":""}" href="/?lang=${lang}&category=${k}"><span class="nav-icon">${icon(k)}</span><span>${esc(v[lang])}</span></a>`).join("");const canonicalUrl=canonical||`${SITE}/?lang=${lang}`;const baseDescription=lang==="ar"?"NowPulse منصة أخبار ومعلومات محدثة باستمرار تركز على مصر والعالم العربي.":"NowPulse is a continuously updated news and information platform focused on Egypt and the Arab world.";const seoMeta=`<link rel="canonical" href="${esc(canonicalUrl)}"><meta property="og:type" content="${meta.includes('article:published_time')?"article":"website"}"><meta property="og:site_name" content="NowPulse"><meta property="og:title" content="${esc(title)} — NowPulse"><meta property="og:description" content="${esc(baseDescription)}"><meta property="og:url" content="${esc(canonicalUrl)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)} — NowPulse"><meta name="twitter:description" content="${esc(baseDescription)}">${meta}`;return`<!doctype html><html lang="${lang}" dir="${rtl?"rtl":"ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#101827"><link rel="ard" href="/.well-known/ard.json"><link rel="ai-catalog" href="/.well-known/ai-catalog.json"><link rel="alternate" type="text/markdown" href="/llms.txt" title="NowPulse AI-readable documentation"><title>${esc(title)} — NowPulse</title><meta name="description" content="${esc(baseDescription)}">${seoMeta}${envAdsense(lang)}<style>${CSS}/* NowPulse professional design system */
:root{--np-bg:#07111f;--np-surface:#0d1a2b;--np-surface2:#12243a;--np-text:#eef5ff;--np-muted:#9fb0c5;--np-accent:#36d399;--np-accent2:#5b8cff;--np-border:rgba(159,176,197,.16);--np-shadow:0 18px 50px rgba(0,0,0,.24)}
body{background:radial-gradient(900px 420px at 50% -120px,rgba(91,140,255,.13),transparent 65%),var(--np-bg);color:var(--np-text)}
header{background:rgba(7,17,31,.88);backdrop-filter:blur(16px);border-bottom:1px solid var(--np-border)}
.top{max-width:1240px;margin:auto;min-height:72px;display:flex;align-items:center;gap:22px}
.logo{display:flex!important;align-items:center;gap:10px;text-decoration:none!important;font-weight:900}
.brand-mark{width:42px;height:42px;display:block;filter:drop-shadow(0 8px 18px rgba(54,211,153,.18))}
.brand-mark rect{fill:var(--np-accent);stroke:rgba(255,255,255,.16);stroke-width:1}
.brand-mark path{fill:#06121f}
.brand-mark .brand-pulse{fill:none;stroke:#06121f;stroke-width:2;stroke-linecap:round;opacity:.75}
.brand-word{font-size:23px;letter-spacing:-.04em;color:#fff}
.brand-word span{color:var(--np-accent)}
main{max-width:1240px;margin:auto}
.card,.article-card,.news-card{border:1px solid var(--np-border)!important;background:linear-gradient(145deg,rgba(18,36,58,.88),rgba(13,26,43,.92))!important;box-shadow:var(--np-shadow);border-radius:18px!important}
.card:hover,.article-card:hover,.news-card:hover{transform:translateY(-2px);border-color:rgba(54,211,153,.28)!important;transition:transform .18s ease,border-color .18s ease}
h1,h2,h3{letter-spacing:-.02em}
button,input,select{border-radius:12px}
footer{border-top:1px solid var(--np-border);color:var(--np-muted)}
.ai-link{color:var(--np-accent)!important}
@media(max-width:700px){.top{min-height:62px;padding-inline:12px}.brand-mark{width:38px;height:38px}.brand-word{font-size:20px}.card,.article-card,.news-card{border-radius:15px!important}}
</style></head><body><a class="skip-link" href="#main-content">Skip to content</a><header><div class="top"><a class="logo" href="/?lang=${lang}" aria-label="NowPulse"><svg class="brand-mark" viewBox="0 0 44 44" aria-hidden="true"><rect x="2" y="2" width="40" height="40" rx="12"></rect><path d="M11 29V15h4l8 9V15h4v14h-4l-8-9v9z"></path><path d="M31 14v16M34 17v10" class="brand-pulse"></path></svg><span class="brand-word">Now<span>Pulse</span></span></a><form action="/search" method="get" toolname="search_nowpulse" tooldescription="Search NowPulse news by person, topic, or keyword."><input name="q" aria-label="${lang==="ar"?"بحث في NowPulse":"Search NowPulse"}" toolparamdescription="${lang==="ar"?"الشخص أو الموضوع أو الكلمة المفتاحية التي تريد البحث عنها":"The person, topic, or keyword to search for"}" placeholder="${lang==="ar"?"ابحث عن شخص أو موضوع...":"Search a person or topic..."}" required><input type="hidden" name="lang" value="${lang}"><button aria-label="search">⌕</button></form><div class="actions"><a href="?lang=${lang==="ar"?"en":"ar"}">${lang==="ar"?"EN":"ع"}</a><button id="themeBtn" onclick="toggleTheme()" aria-label="theme">☾</button><a href="/" aria-label="refresh">↻</a></div></div><nav>${nav}</nav></header><main id="main-content">${body}</main><footer>Created by Taha · NowPulse v${VERSION}<div class="footer-links"><a href="/about?lang=${lang}">${lang==="ar"?"عن الموقع":"About"}</a><a href="/privacy?lang=${lang}">${lang==="ar"?"الخصوصية":"Privacy"}</a><a href="/terms?lang=${lang}">${lang==="ar"?"الشروط":"Terms"}</a></div></footer><script>${CLIENT}</script></body></html>`;}
function homeBody(items,lang,category,marketData,weatherData){const filtered=category&&category!=="latest"?(category==="egypt"?items.filter(a=>a.region==="egypt"):items.filter(a=>a.category===category)):items;const list=category&&category!=="latest"?filtered:items;const featured=list[0],rest=list.slice(1,30),quoteIndex=Math.floor(Date.now()/30000)%QUOTES.length;const market=`<section class="panel"><h3>💹 ${lang==="ar"?"الأسواق والأسعار":"Markets & Prices"}</h3><div class="market-grid"><b>USD/EGP<br><span id="m-usd">${marketData.usdEgp?marketData.usdEgp.toFixed(2):"—"}</span></b><b>EUR/EGP<br><span id="m-eur">${marketData.eurEgp?marketData.eurEgp.toFixed(2):"—"}</span></b><b>GBP/EGP<br><span id="m-gbp">${marketData.gbpEgp?marketData.gbpEgp.toFixed(2):"—"}</span></b><b>ذهب 24K<br><span id="m-g24">${marketData.gold24k?marketData.gold24k.toFixed(2):"—"}</span></b><b>ذهب 21K<br><span id="m-g21">${marketData.gold21k?marketData.gold21k.toFixed(2):"—"}</span></b><b>ذهب 18K<br><span id="m-g18">${marketData.gold18k?marketData.gold18k.toFixed(2):"—"}</span></b></div><div class="updated-line" id="markets-updated">${lang==="ar"?"تحديث":"Updated"}: ${marketData.updated?new Date(marketData.updated).toLocaleTimeString(lang==="ar"?"ar-EG":"en-US",{hour:"2-digit",minute:"2-digit"}):"—"}</div></section>`;const weatherBox=`<section class="panel"><h3>🌤️ ${lang==="ar"?"الطقس":"Weather"}</h3><div>${weatherData.temperature==null?"—":weatherData.temperature+"°C · "+weatherData.humidity+"%"}</div></section>`;return`<section class="hero"><div><div class="eyebrow">${icon(category||"latest")}</div><h1>${esc(category?CATEGORIES[category]?.[lang]||CATEGORIES.latest[lang]:CATEGORIES.latest[lang])}</h1></div><div class="quote" id="quote" data-i="${quoteIndex}">${esc(QUOTES[quoteIndex][lang])}</div></section><div class="dashboard">${market}${weatherBox}</div>${list.length?`<section class="news-grid">${list.slice(0,30).map((a,i)=>card(a,lang,i===0)).join("")}</section>`:`<div class="empty">${lang==="ar"?"لا توجد أخبار حديثة في هذا القسم حاليًا.":"No recent stories are available in this section."}</div>`}`;}
function articleBody(a,body,l,related=[]){const cleanBody=String(body||"").replace(/\r/g,"").split(/\n{2,}|(?<=[.!؟])\s+(?=[\u0621-\u064A])/u).map(x=>x.trim()).filter(Boolean);const paras=cleanBody.map(p=>`<p>${esc(p)}</p>`).join("");const image=validArticleImage(a.image)?a.image:"/api/image?id="+encodeURIComponent(a.id);const summary=cleanBody[0]||a.description||a.title;const keyPoints=cleanBody.slice(0,3);const relatedItems=(related||[]).slice(0,4);const storyHub=`<section class="story-hub" aria-label="${l==="ar"?"مركز الخبر":"Story hub"}"><div class="story-hub-head"><div><div class="story-hub-kicker">◉ NOWPULSE / ${l==="ar"?"مركز الخبر":"STORY HUB"}</div><h2>${l==="ar"?"افهم القصة بسرعة":"Understand the story faster"}</h2></div><span class="story-live">${l==="ar"?"مبني على محتوى الخبر":"Source-grounded"}</span></div><div class="story-summary"><strong>${l==="ar"?"في دقيقة":"In a minute"}</strong><p>${esc(summary)}</p></div><div class="story-points"><strong>${l==="ar"?"أهم ما ورد في الخبر":"Key points from the story"}</strong><ul>${keyPoints.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>${relatedItems.length?`<div class="story-related"><strong>${l==="ar"?"تابع الموضوع من أخبار مرتبطة":"Follow the topic through related coverage"}</strong><div class="story-related-list">${relatedItems.map(x=>`<a href="/article/${encodeURIComponent(x.id)}?lang=${l}"><span>${esc(x.title)}</span><small>${esc(x.source||"NowPulse")} · ${ageLabel(x.date,l)}</small></a>`).join("")}</div></div>`:""}</section>`;return`<article class="article" dir="${l==="ar"?"rtl":"ltr"}" data-timeshift-id="${esc(a.id)}" data-timeshift-title="${esc(a.title)}"><div class="meta"><span class="category-icon">${icon(a.category)}</span><span>${esc(CATEGORIES[a.category]?.[l]||"News")}</span><span>•</span><span>${ageLabel(a.date,l)}</span></div><h1>${esc(a.title)}</h1><div class="source">${esc(a.source)}</div><img class="article-image" src="${esc(image)}" loading="eager" width="1200" height="750" alt="${esc(a.title)}" onerror="this.style.display='none'">${storyHub}<div class="article-text">${paras}</div><div class="article-updated">${l==="ar"?"آخر تحديث للمادة":"Article update"}: ${esc(new Date().toLocaleString(l==="ar"?"ar-EG":"en-US"))}</div></article>`;}

const CSS=`
:root{--bg:#f4f6f9;--panel:#fff;--text:#101828;--muted:#667085;--line:#e4e7ec;--accent:#1769e0;--header:#0d1626}
.skip-link{position:absolute;inset-inline-start:12px;top:-60px;z-index:1000;padding:10px 14px;border-radius:10px;background:#1769e0;color:#fff;font-weight:800}.skip-link:focus{top:12px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:"Noto Sans Arabic","Segoe UI",Tahoma,Arial,sans-serif;line-height:1.6;text-rendering:optimizeLegibility}a{color:inherit;text-decoration:none}header{position:sticky;top:0;z-index:20;background:rgba(13,22,38,.98);color:#fff;box-shadow:0 2px 16px #0002}.top{max-width:1450px;margin:auto;display:flex;gap:14px;align-items:center;padding:12px 20px}.logo{font-size:27px;font-weight:900;letter-spacing:-1px;white-space:nowrap}.logo span{color:#45a3ff}.top form{display:flex;flex:1;max-width:700px;margin:auto;direction:ltr}.top form input{min-width:0;flex:1;border:0;border-radius:12px 0 0 12px;padding:12px 15px;font-size:15px;outline:0;line-height:1.5}.top form button{border:0;padding:0 18px;border-radius:0 12px 12px 0;background:#1769e0;color:#fff;font-size:21px}.actions{display:flex;align-items:center;gap:7px}.actions a,.actions button{background:#ffffff18;border:1px solid #ffffff22;color:#fff;padding:8px 10px;border-radius:9px}.actions button{cursor:pointer}nav{max-width:1450px;margin:auto;display:flex;gap:5px;overflow:auto;padding:0 20px 10px;scrollbar-width:none}nav a{white-space:nowrap;display:inline-flex;align-items:center;gap:6px;padding:8px 11px;border-radius:9px;color:#cbd5e1;font-size:14px}nav a.active,nav a:hover{background:#ffffff15;color:#fff}main{max-width:1450px;margin:auto;padding:24px 20px}.hero{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:20px}.hero h1{font-size:42px;line-height:1.3;margin:5px 0;overflow-wrap:anywhere}.eyebrow{font-size:30px}.quote{max-width:430px;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px;font-weight:700;color:var(--muted);line-height:1.8;overflow-wrap:anywhere}.dashboard{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px}.panel{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px}.panel h3{margin:0 0 12px;line-height:1.5}.market-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.market-grid b{background:var(--bg);padding:12px;border-radius:12px;font-size:13px;line-height:1.6;overflow-wrap:anywhere}.market-grid span{font-size:20px;display:inline-block;margin-top:3px;direction:ltr}.updated-line{font-size:11px;color:var(--muted);margin-top:10px}.news-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:20px}.list{display:grid;gap:14px}.card{background:var(--panel);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:grid;grid-template-columns:220px minmax(0,1fr);min-width:0}.card.featured{display:block}.card-image{display:block;background:#e9edf3;aspect-ratio:16/10;overflow:hidden;min-width:0}.card-image img{width:100%;height:100%;object-fit:cover;display:block}.card-body{padding:15px;min-width:0;overflow-wrap:anywhere;word-break:normal;white-space:normal}.meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:13px;color:var(--muted);margin-bottom:8px;line-height:1.5}.card h2{overflow-wrap:anywhere;word-break:normal;white-space:normal;font-size:19px;line-height:1.55;margin:0 0 10px}.featured h2{font-size:28px}.card p{color:var(--muted);line-height:1.8;margin:0 0 10px;overflow-wrap:anywhere}.source,.article-updated{font-size:12px;color:var(--muted);overflow-wrap:anywhere}.article{max-width:920px;margin:auto;background:var(--panel);padding:32px 34px;border-radius:22px;border:1px solid var(--line)}.article h1{overflow-wrap:anywhere;word-break:normal;white-space:normal;font-size:42px;line-height:1.45;margin:8px 0 12px;font-weight:850}.article .source{margin-bottom:18px}.article-image{width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;border-radius:16px;margin:20px 0;display:block}.story-hub{margin:20px 0 30px;padding:22px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(145deg,var(--panel),var(--bg));box-shadow:0 8px 28px rgba(16,24,40,.06)}.story-hub-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:16px}.story-hub-kicker{font-size:11px;font-weight:800;letter-spacing:.12em;color:var(--accent);margin-bottom:4px}.story-hub h2{margin:0;font-size:24px;line-height:1.4}.story-live{font-size:11px;border:1px solid var(--line);border-radius:999px;padding:5px 9px;color:var(--muted);white-space:nowrap}.story-summary,.story-points,.story-related{padding:15px 0;border-top:1px solid var(--line)}.story-summary p{margin:7px 0 0;font-size:17px;line-height:1.85}.story-points ul{margin:8px 0 0;padding-inline-start:22px}.story-points li{margin:7px 0;line-height:1.75}.story-related-list{display:grid;gap:8px;margin-top:10px}.story-related-list a{display:block;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:var(--panel);transition:.15s}.story-related-list a:hover{border-color:var(--accent);transform:translateY(-1px)}.story-related-list span{display:block;font-weight:700;line-height:1.6}.story-related-list small{display:block;color:var(--muted);font-size:11px;margin-top:3px}.timeshift{margin:20px 0 28px;padding:20px;border:1px solid rgba(23,105,224,.22);border-radius:18px;background:linear-gradient(135deg,rgba(23,105,224,.07),rgba(69,163,255,.04));position:relative;overflow:hidden}.timeshift:before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:linear-gradient(#1769e0,#45a3ff)}.timeshift-kicker{font-size:11px;letter-spacing:.08em;font-weight:900;color:#1769e0;margin-bottom:6px}.timeshift h2{font-size:22px;margin:0 0 6px;line-height:1.45}.timeshift p{margin:0;color:var(--muted);font-size:14px;line-height:1.8}.timeshift-state{margin-top:14px;padding:12px;border-radius:12px;background:var(--bg);font-weight:800;line-height:1.7}.timeshift-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.timeshift-actions button{border:1px solid var(--line);background:var(--panel);color:var(--text);padding:9px 12px;border-radius:10px;cursor:pointer;font-weight:700}.timeshift-actions button:first-child{background:#1769e0;color:#fff;border-color:#1769e0}.timeshift-change{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.timeshift-change b{display:block;padding:10px;border-radius:10px;background:var(--panel);font-size:12px;text-align:center}.timeshift-change span{display:block;font-size:22px;margin-top:2px}@media(max-width:700px){.timeshift-change{grid-template-columns:1fr}.timeshift h2{font-size:19px}}.article-text{overflow-wrap:anywhere;word-break:normal;white-space:normal;font-size:19px;line-height:2.1;max-width:820px}.article-text p{margin:0 0 24px;text-align:start}.article-text p:first-child{font-weight:700;font-size:20px}.empty{padding:50px;text-align:center;background:var(--panel);border-radius:18px}footer{text-align:center;color:var(--muted);padding:35px 20px}.footer-links{display:flex;justify-content:center;flex-wrap:wrap;gap:14px;margin-top:10px}body.dark{--bg:#09111f;--panel:#111b2c;--text:#edf2f7;--muted:#9aa7b7;--line:#263246}.dark .market-grid b{background:#182236}@media(max-width:1050px){.hero h1{font-size:34px}.news-grid{grid-template-columns:1fr}.card.featured{display:grid;grid-template-columns:300px 1fr}.featured .card-image{aspect-ratio:auto;min-height:220px}}@media(max-width:700px){.top{padding:10px 12px;gap:8px;flex-wrap:wrap}.logo{font-size:23px}.top form{order:3;flex-basis:100%;max-width:none}.top form input{font-size:14px}nav{padding:0 10px 8px}nav a{font-size:13px;padding:7px 9px}main{padding:15px 11px}.hero{display:block}.hero h1{font-size:30px}.quote{margin-top:12px}.dashboard{grid-template-columns:1fr}.market-grid{grid-template-columns:repeat(3,1fr);gap:8px}.market-grid b{padding:10px 7px;font-size:11px}.market-grid span{font-size:17px}.news-grid{display:block}.card,.card.featured{display:grid;grid-template-columns:135px minmax(0,1fr);margin-bottom:12px;border-radius:14px}.card-image{aspect-ratio:1/1}.card-body{padding:11px}.card h2,.featured h2{font-size:16px;line-height:1.55}.card p{font-size:13px;line-height:1.7;-webkit-line-clamp:2}.meta{font-size:11px}.article{padding:16px;border-radius:15px}.article h1{font-size:29px;line-height:1.5}.article-text{font-size:17px;line-height:1.95}.actions{margin-left:auto}.actions a,.actions button{padding:7px 8px}}
/* NowPulse 6.0 product layer */
main{width:min(100%,1450px)}
.card h2,.card p,.article h1,.article-text p{overflow-wrap:anywhere}
.article-text{font-size:18px;line-height:2}.article-text p{margin:0 0 1.2em}.story-hub{scroll-margin-top:90px}
@media(max-width:900px){.top{flex-wrap:wrap;padding:10px 14px}.top form{order:3;flex-basis:100%;max-width:none}nav{padding-inline:14px}main{padding:18px 14px}.hero{align-items:stretch;flex-direction:column}.hero h1{font-size:34px}.dashboard{grid-template-columns:1fr}.news-grid{grid-template-columns:1fr}}
/* NowPulse consistency + theme repair v6.1.1 */
body{background:var(--bg)!important;color:var(--text)!important}header{background:var(--header)!important;color:#fff!important}nav a{color:#cbd5e1}nav a.active,nav a:hover{background:#ffffff15;color:#fff}.news-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}.news-grid>.card{display:flex!important;flex-direction:column!important;height:100%;min-height:420px}.news-grid>.card .card-image{width:100%;height:210px;aspect-ratio:auto!important;flex:0 0 210px}.news-grid>.card .card-body{display:flex;flex-direction:column;min-height:210px}.news-grid>.card h2{font-size:18px!important;line-height:1.55!important;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}.news-grid>.card p{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}.news-grid>.card .source{margin-top:auto}.card:hover{transform:translateY(-2px)}.quote{background:var(--panel)!important;color:var(--muted)!important;border-color:var(--line)!important}.panel,.empty,.article,.story-hub{background:var(--panel)!important;color:var(--text)!important;border-color:var(--line)!important}.market-grid b{background:var(--bg)!important;color:var(--text)!important}.market-grid span{color:var(--text)!important}.top form input{background:#fff!important;color:#101828!important}@media(max-width:1050px){.news-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.news-grid>.card{min-height:400px}.news-grid>.card .card-image{height:190px;flex-basis:190px}}@media(max-width:700px){.news-grid{grid-template-columns:1fr!important;gap:12px}.news-grid>.card{min-height:0}.news-grid>.card .card-image{height:auto;aspect-ratio:16/9!important;flex-basis:auto}.news-grid>.card .card-body{min-height:0}.news-grid>.card h2{font-size:17px!important}.top form input{border-radius:12px 0 0 12px!important}}body.dark{--bg:#09111f;--panel:#111b2c;--text:#edf2f7;--muted:#9aa7b7;--line:#263246;--accent:#4ea1ff;--header:#0b1422}body.dark header{background:var(--header)!important}body.dark .top form input{background:#162235!important;color:#edf2f7!important}body.dark .market-grid b{background:#182236!important;color:#edf2f7!important}
@media(max-width:620px){.top{gap:9px}.logo{font-size:22px}.actions{margin-inline-start:auto}.actions a,.actions button{padding:7px 8px}.hero h1{font-size:29px}.quote{font-size:14px;padding:14px}.market-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.card{display:block}.card-image{aspect-ratio:16/9}.featured h2{font-size:23px}.card h2{font-size:18px}.article{padding:20px 16px;border-radius:16px}.article h1{font-size:28px;line-height:1.5}.article-text{font-size:17px;line-height:2}.story-hub{padding:16px;border-radius:16px}.story-hub-head{flex-direction:column}}
`;
const CLIENT=`(function(){const key="np-theme";function apply(){const dark=localStorage.getItem(key)==="dark";document.body.classList.toggle("dark",dark);const b=document.getElementById("themeBtn");if(b)b.textContent=dark?"☀":"☾";}window.toggleTheme=function(){localStorage.setItem(key,document.body.classList.contains("dark")?"light":"dark");apply()};apply();const q=document.getElementById("quote"),quotes=\${JSON.stringify(QUOTES)};if(q)setInterval(()=>{let i=Number(q.dataset.i||0);i=(i+1)%quotes.length;q.dataset.i=i;q.textContent=document.documentElement.lang==="ar"?quotes[i].ar:quotes[i].en},30000);async function refreshMarkets(){try{const r=await fetch("/api/markets",{cache:"no-store"});if(!r.ok)return;const m=await r.json();const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=Number(v)>0?Number(v).toFixed(2):"—"};set("m-usd",m.usdEgp);set("m-eur",m.eurEgp);set("m-gbp",m.gbpEgp);set("m-g24",m.gold24k);set("m-g21",m.gold21k);set("m-g18",m.gold18k);const u=document.getElementById("markets-updated");if(u&&m.updated)u.textContent=(document.documentElement.lang==="ar"?"تحديث: ":"Updated: ")+new Date(m.updated).toLocaleTimeString(document.documentElement.lang==="ar"?"ar-EG":"en-US",{hour:"2-digit",minute:"2-digit"})}catch{}}refreshMarkets();setInterval(refreshMarkets,60000)})();`
async function findArticle(env,id,lang="ar"){const langs=lang==="en"?["en","ar"]:["ar","en"];for(const l of langs){const latest=env.NOWPULSE_KV?await env.NOWPULSE_KV.get("feed:latest:"+l,"json").catch(()=>[]):[];const archive=env.NOWPULSE_KV?await env.NOWPULSE_KV.get("feed:archive:"+l,"json").catch(()=>[]):[];const found=[...(Array.isArray(latest)?latest:[]),...(Array.isArray(archive)?archive:[])].find(a=>a.id===id||a.link===id);if(found)return found;}if(env.NOWPULSE_KV){const direct=await env.NOWPULSE_KV.get("article:"+id,"json").catch(()=>null);if(direct)return direct;}return null;}
async function imageEndpoint(request,env){const id=new URL(request.url).searchParams.get("id")||"";let a=await findArticle(env,id);if(!a){const raw=decodeURIComponent(id).replace(/^[^-]+-/,"").replace(/-\d{8,}$/,"");const title=raw.replace(/-https?-.*$/i,"").replace(/-/g," ").trim().slice(0,220);if(title)a={id,title,description:title,link:"",source:"NowPulse"};}const fallback=()=>secureResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1200\" height=\"750\"><rect width=\"1200\" height=\"750\" fill=\"#e9eef5\"/><text x=\"600\" y=\"375\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-family=\"Arial\" font-size=\"42\" fill=\"#667085\">NowPulse</text></svg>",{status:200,headers:{"content-type":"image/svg+xml; charset=UTF-8","cache-control":"public,max-age=86400"}});if(!a)return fallback();const key="img:v8:"+a.id;const candidates=[];const cached=env.NOWPULSE_KV?await env.NOWPULSE_KV.get(key).catch(()=>null):null;if(validArticleImage(cached))candidates.push(cached);if(validArticleImage(a.image))candidates.push(a.image);if(a.link)candidates.push(await extractImage(a));candidates.push(await gdeltImage(a.title));candidates.push(await wikipediaImage(a.title));candidates.push(await wikimediaImage(a.title));for(const image of [...new Set(candidates.filter(validArticleImage))]){try{const r=await timeoutFetch(image,{headers:{"user-agent":"Mozilla/5.0 NowPulseImage/8.0","accept":"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"}},7000);if(!r.ok)continue;const type=r.headers.get("content-type")||"";if(!/^image\//i.test(type))continue;if(env.NOWPULSE_KV)await env.NOWPULSE_KV.put(key,image,{expirationTtl:604800}).catch(()=>{});return secureResponse(r.body,{status:200,headers:{"content-type":type,"cache-control":"public,max-age=86400,stale-while-revalidate=604800","x-nowpulse-image":"resolved"}});}catch{}}return fallback();}
const SECURITY_HEADERS={
  "Content-Security-Policy":"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.open-meteo.com https://open.er-api.com https://api.goldprice.dev https://api.gdeltproject.org https://www.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net; frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; worker-src 'self' blob:;",
  "Strict-Transport-Security":"max-age=63072000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy":"same-origin-allow-popups",
  "X-Frame-Options":"DENY",
  "Referrer-Policy":"strict-origin-when-cross-origin",
  "X-Content-Type-Options":"nosniff",
  "Permissions-Policy":"camera=(), microphone=(), geolocation=(), notifications=()"
};
function secureResponse(body,init={}){const headers=new Headers(init.headers||{});for(const [k,v] of Object.entries(SECURITY_HEADERS))if(!headers.has(k))headers.set(k,v);return new Response(body,{...init,headers});}
function secureJson(data,init={}){const headers=new Headers(init.headers||{});if(!headers.has("content-type"))headers.set("content-type","application/json; charset=UTF-8");return secureResponse(JSON.stringify(data),{...init,headers});}
const AGENT_CATALOG={"specVersion":"0.91","@context":"https://agenticresourcediscovery.org/context/v1","entries":[{"identifier":"urn:air:nowpulse.tavengers16.workers.dev:site:news","displayName":"NowPulse News","type":"text/html","url":"https://nowpulse.tavengers16.workers.dev/","description":"Continuously updated news and information platform focused on Egypt and the Arab world, with selected international coverage.","representativeQueries":["show the latest Egypt news","find the latest Arab world news","find news about Mohamed Salah","show Egypt economy and gold news"],"capabilities":["news","search","categories","articles","markets","weather"]},{"identifier":"urn:air:nowpulse.tavengers16.workers.dev:api:search","displayName":"NowPulse News Search","type":"application/json","url":"https://nowpulse.tavengers16.workers.dev/search","description":"Search NowPulse news by person, topic, or keyword.","representativeQueries":["search NowPulse for Egypt news","find Mohamed Salah news","find gold and dollar news"],"capabilities":["search"]}]};
const AGENT_CATALOG_JSON=JSON.stringify(AGENT_CATALOG);
const LLMS_TXT=`# NowPulse

> NowPulse is a continuously updated news and information platform focused on Egypt and the Arab world, with selected international coverage.

## Main pages

- [NowPulse home](https://nowpulse.tavengers16.workers.dev/)
- [Latest news](https://nowpulse.tavengers16.workers.dev/?category=latest)
- [Egypt news](https://nowpulse.tavengers16.workers.dev/?category=egypt)
- [World news](https://nowpulse.tavengers16.workers.dev/?category=world)
- [Politics](https://nowpulse.tavengers16.workers.dev/?category=politics)
- [Sports](https://nowpulse.tavengers16.workers.dev/?category=sports)
- [Economy](https://nowpulse.tavengers16.workers.dev/?category=economy)
- [Technology](https://nowpulse.tavengers16.workers.dev/?category=tech)
- [Arts](https://nowpulse.tavengers16.workers.dev/?category=arts)
- [Health](https://nowpulse.tavengers16.workers.dev/?category=health)
- [Travel](https://nowpulse.tavengers16.workers.dev/?category=travel)
- [Trends](https://nowpulse.tavengers16.workers.dev/?category=trends)
- [Search](https://nowpulse.tavengers16.workers.dev/search)
- [Sitemap](https://nowpulse.tavengers16.workers.dev/sitemap.xml)
- [ARD manifest](https://nowpulse.tavengers16.workers.dev/.well-known/ard.json)
- [AI catalog compatibility manifest](https://nowpulse.tavengers16.workers.dev/.well-known/ai-catalog.json)
- [Markets API](https://nowpulse.tavengers16.workers.dev/api/markets)
- [Weather API](https://nowpulse.tavengers16.workers.dev/api/weather?city=cairo)
`;
async function sitemap(env){const all=[];for(const l of ["ar","en"]){const latest=env.NOWPULSE_KV?await env.NOWPULSE_KV.get("feed:latest:"+l,"json").catch(()=>[]):[];const archive=env.NOWPULSE_KV?await env.NOWPULSE_KV.get("feed:archive:"+l,"json").catch(()=>[]):[];all.push(...(Array.isArray(latest)?latest:[]),...(Array.isArray(archive)?archive:[]));}const map=new Map();for(const a of all)if(!map.has(a.id))map.set(a.id,a);const urls=[...map.values()].slice(0,1000).map(a=>"<url><loc>"+esc(SITE+"/article/"+encodeURIComponent(a.id))+"</loc><lastmod>"+esc(a.date)+"</lastmod></url>").join("");return secureResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+SITE+'/</loc></url>'+urls+'</urlset>',{headers:{"content-type":"application/xml; charset=UTF-8","cache-control":"public,max-age=300"}});}
async function scheduled(_controller,env,ctx){try{
  const ar=await loadFeed(env,true,"ar");await archiveFeed(env,ar,"ar");
  const en=await loadFeed(env,true,"en");await archiveFeed(env,en,"en");
}catch(e){console.error("Scheduled ingestion failed",e?.stack||e);}}
export default{async fetch(request,env,ctx){const url=new URL(request.url);const lang=url.searchParams.get("lang")==="en"?"en":"ar";try{if(url.pathname==="/llms.txt")return secureResponse(LLMS_TXT,{headers:{"content-type":"text/markdown; charset=UTF-8","cache-control":"public,max-age=3600"}});
if(url.pathname==="/.well-known/ard.json"||url.pathname==="/.well-known/ai-catalog.json"||url.pathname==="/ai-catalog.json")return secureResponse(AGENT_CATALOG_JSON,{headers:{"content-type":"application/json; charset=UTF-8","cache-control":"public,max-age=3600"}});
if(url.pathname==="/ads.txt")return secureResponse("google.com, pub-1235197294708204, DIRECT, f08c47fec0942fa0\n",{headers:{"content-type":"text/plain; charset=UTF-8","cache-control":"public,max-age=3600"}});if(url.pathname==="/robots.txt")return secureResponse(`User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml`,{headers:{"content-type":"text/plain; charset=UTF-8"}});if(url.pathname==="/sitemap.xml")return sitemap(env);if(url.pathname==="/health")return secureJson({ok:true,service:"NowPulse",version:VERSION,kv:Boolean(env.NOWPULSE_KV),ai:Boolean(env.AI),time:new Date().toISOString()});if(url.pathname==="/ai"){const body="<section class=\"panel\" dir=\""+(lang==="en"?"ltr":"rtl")+"\"><h1>"+(lang==="ar"?"مركز إدارة الذكاء الاصطناعي":"AI Control Center")+"</h1><p>"+(lang==="ar"?"لوحة مراقبة للحالة دون عرض أي أسرار.":"Read-only maintenance dashboard. No secrets are exposed.")+"</p><div id=\"ai-state\" class=\"empty\">"+(lang==="ar"?"جاري تحميل الحالة…":"Loading status…")+"</div><script>(async()=>{try{const r=await fetch(\"/api/ai/status\",{cache:\"no-store\"});const d=await r.json();document.getElementById(\"ai-state\").innerHTML=\"<b>\"+(d.status||\"unknown\")+\"</b><br><span>\"+(d.diagnosis||\"\")+\"</span><br><small>Version: \"+(d.version||\"\")+\"</small><br><small>Last run: \"+(d.lastRun||\"—\")+\"</small>\"}catch(e){document.getElementById(\"ai-state\").textContent="+(lang==="ar"?"\"تعذر تحميل الحالة\"":"\"Unable to load status\"")+"}})();</script></section>";return secureResponse(layout({lang,title:lang==="ar"?"مركز الذكاء الاصطناعي":"AI Control Center",body,canonical:SITE+"/ai?lang="+lang}),{headers:{"content-type":"text/html; charset=UTF-8","cache-control":"no-store"}});}
if(url.pathname==="/api/ai/status")return secureJson(await aiStatus(env),{headers:{"cache-control":"no-store"}});if(url.pathname==="/api/image")return imageEndpoint(request,env);if(url.pathname==="/api/markets")return secureJson(await markets(env),{headers:{"cache-control":"public,max-age=60"}});if(url.pathname==="/api/weather")return secureJson(await weather(env,(url.searchParams.get("city")||"cairo").toLowerCase()),{headers:{"cache-control":"public,max-age=300"}});if(url.pathname==="/about"||url.pathname==="/privacy"||url.pathname==="/terms"){const page=url.pathname.slice(1);const data={about:{ar:["عن NowPulse","NowPulse منصة أخبار ومعلومات تركز على مصر والعالم العربي، مع متابعة مختارة للأخبار الدولية والأسواق والطقس والرياضة والتقنية والفن والصحة."],en:["About NowPulse","NowPulse is a news and information platform focused on Egypt and the Arab world, with selected international coverage, markets, weather, sports, technology, arts and health."]},privacy:{ar:["سياسة الخصوصية","يحترم NowPulse خصوصية الزوار. قد تستخدم المنصة ملفات تعريف الارتباط وخدمات الإعلانات والتحليلات والأدوات التقنية اللازمة لتشغيل الموقع وتحسينه. قد تستخدم Google وشركاء الإعلان تقنيات لتقديم الإعلانات وقياس الأداء وفق سياساتهم."],en:["Privacy Policy","NowPulse respects visitor privacy. The platform may use cookies, advertising and analytics services, and technical tools needed to operate and improve the site. Google and advertising partners may use technologies for advertising and measurement according to their policies."]},terms:{ar:["الشروط","المحتوى المنشور في NowPulse يهدف إلى تقديم المعلومات والأخبار، وقد يتغير مع ظهور معلومات جديدة. يجب الرجوع إلى المصادر الأصلية عند الحاجة إلى قرارات مهمة. لا يضمن NowPulse اكتمال أو دقة كل معلومة واردة من المصادر الخارجية."],en:["Terms","NowPulse provides news and information that may change as new information becomes available. Consult original sources when making important decisions. NowPulse does not guarantee that every item supplied by external sources is complete or accurate."]}}[page];const body="<div class=\"panel page\"><h1>"+esc(data[lang][0])+"</h1><p>"+esc(data[lang][1])+"</p>"+(page==="privacy"?"<p><a href=\"https://policies.google.com/technologies/partner-sites\" rel=\"noopener noreferrer\">"+(lang==="ar"?"معلومات Google عن استخدام ملفات تعريف الارتباط":"Google information about cookie use")+"</a></p>":"")+"</div>";return secureResponse(layout({lang,title:data[lang][0],body,canonical:SITE+"/"+page+"?lang="+lang}),{headers:{"content-type":"text/html; charset=UTF-8","cache-control":"public,max-age=3600"}});}
if(url.pathname==="/search"){const q=url.searchParams.get("q")||"",results=await searchNews(env,q,lang),answer=q?await searchAnswer(env,q,lang):"";const body=`<section class="hero"><div><div class="eyebrow">⌕</div><h1>${esc(lang==="ar"?"بحث شامل عن: "+q:"Web search: "+q)}</h1><p>${esc(lang==="ar"?"البحث يجمع أخبار الموقع ونتائج خارجية، ثم يقدم خلاصة معلوماتية مبنية على المصادر المتاحة.":"Search combines site coverage with external sources and provides a source-grounded summary.")}</p></div></section>${answer?`<section class="panel search-answer"><h2>${lang==="ar"?"الخلاصة":"Answer"}</h2><div class="article-text">${answer.split(/\n+/).filter(Boolean).map(x=>`<p>${esc(x)}</p>`).join("")}</div></section>`:""}<h2 class="section-title">${lang==="ar"?"النتائج والمصادر":"Results & sources"}</h2><div class="list">${results.map(a=>card(a,lang)).join("")||`<div class="empty">${lang==="ar"?"لم نجد نتائج كافية لهذا البحث.":"No useful results were found."}</div>`}</div>`;return secureResponse(layout({lang,title:q||"Search",body,canonical:SITE+"/search?lang="+lang+"&q="+encodeURIComponent(q)}),{headers:{"content-type":"text/html; charset=UTF-8","cache-control":"no-store"}});}if(url.pathname.startsWith("/article/")){const id=decodeURIComponent(url.pathname.slice(9)),a=await findArticle(env,id,lang);if(!a)return secureResponse(layout({lang,title:"Not found",body:`<div class="empty"><h1>${lang==="ar"?"الخبر غير متاح حاليًا.":"Article unavailable."}</h1></div>`}),{status:404,headers:{"content-type":"text/html; charset=UTF-8"}});let image=a.image||"";if(!image)image=await extractImage(a);const related=relatedFor(a,await loadFeed(env,false,lang));const text=await writeArticle(env,{...a,image},related,lang);return secureResponse(layout({lang,title:a.title,body:articleBody({...a,image},text,lang,related),active:a.category,canonical:SITE+"/article/"+encodeURIComponent(a.id)+"?lang="+lang,meta:`<meta property="article:published_time" content="${esc(a.date)}"><meta property="og:image" content="${esc(SITE+"/api/image?id="+encodeURIComponent(a.id))}"><script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"NewsArticle","headline":a.title,"datePublished":a.date,"dateModified":a.date,"mainEntityOfPage":SITE+"/article/"+encodeURIComponent(a.id)+"?lang="+lang,"image":[SITE+"/api/image?id="+encodeURIComponent(a.id)],"publisher":{"@type":"Organization","name":"NowPulse"}}).replace(/</g,"\\u003c")}</script>`}),{headers:{"content-type":"text/html; charset=UTF-8","cache-control":"public,max-age=60"}});}
const category=url.searchParams.get("category")||"latest";let items=await loadFeed(env,false,lang);if(category!=="latest"&&CATEGORIES[category]){const specific=await loadCategoryFeed(env,category,lang);if(specific.length)items=specific;}const [marketData,weatherData]=await Promise.all([markets(env),weather(env,"cairo")]);const body=homeBody(items,lang,CATEGORIES[category]?category:"latest",marketData,weatherData);return secureResponse(layout({lang,title:CATEGORIES[category]?.[lang]||CATEGORIES.latest[lang],body,active:category,canonical:SITE+"/?lang="+lang+(category!=="latest"?"&category="+encodeURIComponent(category):"")}),{headers:{"content-type":"text/html; charset=UTF-8","cache-control":"public,max-age=30,stale-while-revalidate=300"}});}catch(error){console.error("NowPulse request error",{path:url.pathname,error:error?.stack||String(error)});const lang=url.searchParams.get("lang")==="en"?"en":"ar";return secureResponse(layout({lang,title:"NowPulse",body:`<div class="empty"><h1>${lang==="ar"?"حدث خطأ مؤقت":"Temporary error"}</h1><p>${lang==="ar"?"سيحاول النظام معالجة المشكلة تلقائيًا. أعد تحميل الصفحة بعد لحظات.":"The system will try to recover automatically. Reload in a moment."}</p></div>`}),{status:503,headers:{"content-type":"text/html; charset=UTF-8","cache-control":"no-store","retry-after":"10"}});}},async scheduled(controller,env,ctx){return scheduled(controller,env,ctx);}};

export { NowPulseGuardian, NowPulseMaintenanceWorkflow };
