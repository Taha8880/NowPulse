const SITE="https://nowpulse.tavengers16.workers.dev";
const REPO="Taha8880/NowPulse";
const BRANCH="main";
const FILE="src/worker.js";
const MODEL="openai/gpt-6-sol";
const CATS=["latest","egypt","arab","world","politics","sports","economy","tech","arts","health","travel","trends"];

async function req(url,init={}){const r=await fetch(url,{...init,headers:{"accept":"application/json",...(init.headers||{})}});const t=await r.text();let data={};try{data=JSON.parse(t)}catch{}return{ok:r.ok,status:r.status,data,text:t}}
async function site(path){try{const r=await fetch(SITE+path,{redirect:"follow",headers:{"user-agent":"NowPulse-AI-Manager/2.0","accept":"text/html,application/json,*/*"}});return{ok:r.ok,status:r.status,text:(await r.text()).slice(0,12000)}}catch(e){return{ok:false,status:0,text:String(e)}}}
function b64(s){const a=new TextEncoder().encode(s);let x="";for(let i=0;i<a.length;i+=32768)x+=String.fromCharCode(...a.slice(i,i+32768));return btoa(x)}
function aiText(x){if(typeof x==="string")return x;if(x?.choices?.[0]?.message)return x.choices[0].message.content||"";if(x?.output_text)return x.output_text;if(x?.response)return x.response;if(Array.isArray(x?.output)){let s="";for(const o of x.output)for(const c of o.content||[])if(c?.text)s+=c.text;return s}return""}
function codeOnly(s){let x=String(s||"").trim();const m=x.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i);return m?m[1].trim():x}
function validSource(s){
  const x=String(s||"");
  if(x.length<12000||x.length>180000)return false;
  if(!x.includes("export default")||!x.includes("NowPulse")||!x.includes("async function news")||!x.includes("function shell")||!x.includes("/api/markets"))return false;
  const opens=(x.match(/[{}]/g)||[]).reduce((n,c)=>n+(c==="{"?1:-1),0);
  return opens===0;
}
async function diagnose(){
  const d={time:new Date().toISOString(),broken:[],quality:{}};
  d.health=await site("/health"); d.markets=await site("/api/markets"); d.news=await site("/api/news?lang=ar");
  d.search=await site("/search?q=%D9%85%D8%AD%D9%85%D8%AF%20%D8%B5%D9%84%D8%A7%D8%AD&lang=ar");
  d.home=await site("/?lang=ar");
  d.categories={};
  for(const c of CATS)d.categories[c]=await site("/category/"+c+"?lang=ar");
  let n={},m={};try{n=JSON.parse(d.news.text||"{}")}catch{}try{m=JSON.parse(d.markets.text||"{}")}catch{}
  const id=n.latest?.[0]?.id;
  d.article=id?await site("/article/"+encodeURIComponent(id)+"?lang=ar"):{ok:false,text:"no article"};
  if(!d.health.ok||!/"ok":true/.test(d.health.text))d.broken.push("health");
  if(!d.news.ok||!Array.isArray(n.latest)||n.latest.length<5)d.broken.push("news");
  for(const k of ["usdEgp","eurEgp","gbpEgp","gold24","gold21","gold18"])if(!(Number(m[k])>0))d.broken.push("market:"+k);
  if(!d.search.ok||!d.search.text.includes("نتائج البحث"))d.broken.push("search");
  if(!d.home.text.includes("/api/image?q="))d.broken.push("image-fallback-ui");
  if(/news\.google\.com\/rss\/articles|https:\/\/news\.google\.com\/rss/i.test(d.article.text))d.broken.push("article-wrapper");
  for(const c of CATS)if(!d.categories[c].ok||!/<html/i.test(d.categories[c].text))d.broken.push("category:"+c);
  if(!d.article.ok||!/<h1>/i.test(d.article.text)||/Google News/i.test(d.article.text))d.broken.push("article");
  const raw=JSON.stringify(n);
  if(/<a\b|&lt;\s*a|news\.google\.com\/rss/i.test(raw))d.broken.push("raw-rss");
  if(d.search.text.includes("news.google.com")||/&lt;/.test(d.search.text))d.broken.push("search-rss");
  if(d.home.text.includes("لا توجد صورة من المصدر")||d.home.text.includes("No source image"))d.broken.push("image-ui");
  if(!d.home.text.includes("class='nav'")||!d.home.text.includes("/category/egypt?lang="))d.broken.push("navigation");
  if(!d.home.text.includes("class='iconbtn'"))d.broken.push("controls");
  if(!/animation:float|@keyframes float/.test(d.home.text))d.broken.push("dynamic-background");
  if(!/dir='(ar|en)'/.test(d.home.text))d.broken.push("direction");
  d.quality.newsWithImages=(n.latest||[]).filter(x=>x.image).length;
  d.quality.imageCoverage=d.quality.newsTotal?Math.round(d.quality.newsWithImages/d.quality.newsTotal*100):0;
  d.quality.newsTotal=(n.latest||[]).length;
  d.quality.rawRss=/<a\b|&lt;\s*a|news\.google\.com\/rss/i.test(raw);
  return d;
}
async function githubFile(env){
  return req("https://api.github.com/repos/"+REPO+"/contents/"+FILE+"?ref="+BRANCH,{headers:{"authorization":"Bearer "+env.NOWPULSE_GITHUB_TOKEN,"x-github-api-version":"2026-03-10","user-agent":"NowPulse-AI-Manager/2.0"}});
}
async function generate(env,diag,mode,current){
  const mission=mode==="repair"
    ?"Fix every failing production check while preserving existing working behavior."
    :"Perform conservative production maintenance: improve only clear quality/reliability issues visible in the diagnostics. Do not redesign the site, remove routes, remove bilingual behavior, weaken SEO, or replace working APIs without a concrete reason.";
  const rules="You are the senior production engineer for NowPulse. "+mission+" Return ONLY the complete src/worker.js JavaScript source, no Markdown. Keep Cloudflare Workers compatibility and the NowPulseGuardian Durable Object export. Arabic is primary RTL and English must remain complete LTR. Preserve all routes: /health /api/news /api/markets /api/weather /api/image /search /article/* /category/* /robots.txt /sitemap.xml /rss.xml /ads.txt and homepage. Never expose raw RSS HTML/entities or Google News wrapper pages. Every article/card must retain its title, description, source, date, original link and image metadata in an internal story ID so navigation never collapses to a generic event page. The /api/image route must return actual image bytes with an image content-type, not JSON. If a source image is missing, use a relevant Wikimedia Commons image through the proxy and reject logos/icons/placeholders. Verify that category navigation remains category-specific and that every card opens its own story. Article pages must show clean title/source/date/summary/relevant image and an original-source link, not republish full third-party articles. Prefer Egypt and Arab coverage, then world. Use real source images or relevant Wikimedia Commons fallback, never logos. Keep responsive professional formatting, balanced Arabic/English typography, visible controls/icons, dark/light mode, animated category-aware background, page transitions, working internal search, ads, SEO, and footer 'NowPulse · Created by Taha'. Do not add npm dependencies.";
  const history=env.NOWPULSE_KV?await env.NOWPULSE_KV.get("last-change"):null;
  const rollback=env.NOWPULSE_KV?await env.NOWPULSE_KV.get("last-rollback"):null;
  const prompt=rules+"\nDiagnostics:\n"+JSON.stringify(diag)+"\nPrevious change:\n"+String(history||"none")+"\nPrevious rollback:\n"+String(rollback||"none")+"\nCurrent source:\n"+current;
  let ai;try{ai=await env.AI.run(env.NOWPULSE_AI_MODEL||MODEL,{messages:[{role:"system",content:"Production Cloudflare Workers repair and maintenance agent."},{role:"user",content:prompt}],max_completion_tokens:30000,temperature:0.05,reasoning_effort:"high"},{gateway:{id:env.NOWPULSE_AI_GATEWAY_ID||"default",skipCache:true,collectLog:true,metadata:{service:"nowpulse-ai-manager",mode}}})}catch(e){return{ok:false,reason:"AI inference failed",error:String(e)}}
  const next=codeOnly(aiText(ai));if(!validSource(next))return{ok:false,reason:"AI returned invalid source",length:next.length};
  return{ok:true,next};
}
async function commit(env,next,message,sha){
  return req("https://api.github.com/repos/"+REPO+"/contents/"+FILE,{method:"PUT",headers:{"authorization":"Bearer "+env.NOWPULSE_GITHUB_TOKEN,"content-type":"application/json","x-github-api-version":"2026-03-10","user-agent":"NowPulse-AI-Manager/2.0"},body:JSON.stringify({message,content:b64(next),sha,branch:BRANCH})});
}


async function sleep(ms){await new Promise(r=>setTimeout(r,ms))}
async function githubRuns(env,sha){
  const r=await req("https://api.github.com/repos/"+REPO+"/actions/runs?branch="+encodeURIComponent(BRANCH)+"&per_page=10",{headers:{"authorization":"Bearer "+env.NOWPULSE_GITHUB_TOKEN,"x-github-api-version":"2026-03-10","user-agent":"NowPulse-AI-Manager/2.1"}});
  if(!r.ok)return{ok:false,status:r.status,text:r.text};
  const runs=(r.data.workflow_runs||[]).filter(x=>!sha||x.head_sha===sha);
  return{ok:true,runs};
}
async function waitForDeploy(env,sha){
  for(let i=0;i<18;i++){
    const q=await githubRuns(env,sha);
    if(q.ok&&q.runs?.length){
      const run=q.runs[0];
      if(run.status==="completed")return{ok:run.conclusion==="success",run};
    }
    await sleep(10000);
  }
  return{ok:false,timeout:true};
}
async function verifyProduction(){
  const h=await site("/health");
  const home=await site("/?lang=ar");
  const n=await site("/api/news?lang=ar");
  const m=await site("/api/markets");
  const img=await site("/api/image?q=football");
  let nx={},mx={};try{nx=JSON.parse(n.text||"{}")}catch{}try{mx=JSON.parse(m.text||"{}")}catch{}
  const id=nx.latest?.[0]?.id;
  const a=id?await site("/article/"+encodeURIComponent(id)+"?lang=ar"):{ok:false,text:"no story"};
  const issues=[];
  if(!h.ok||!/"ok":true/.test(h.text))issues.push("health");
  if(!home.ok||!/NowPulse/.test(home.text))issues.push("home");
  if(!n.ok||!Array.isArray(nx.latest)||nx.latest.length<5)issues.push("news");
  if(!m.ok||!(Number(mx.fx?.usd?.mid)>0)||!(Number(mx.gold?.["24K"]?.mid)>0))issues.push("markets");
  if(!img.ok||!/image\//i.test(img.text.slice(0,200)))issues.push("image");
  if(!a.ok||!/<h1>/i.test(a.text)||/news\.google\.com\/rss/i.test(a.text))issues.push("article");
  return{ok:issues.length===0,issues};
}
async function record(env,key,value){
  if(env.NOWPULSE_KV)await env.NOWPULSE_KV.put(key,JSON.stringify(value),{expirationTtl:2592000});
}

async function run(env,force=false){
  if(!env.NOWPULSE_GITHUB_TOKEN)return{ok:false,reason:"NOWPULSE_GITHUB_TOKEN missing"};
  const diag=await diagnose();
  const repairNeeded=diag.broken.length>0;
  const maintenanceEnabled=env.NOWPULSE_AI_MAINTENANCE!=="disabled";
  let maintenanceDue=false;
  if(maintenanceEnabled&&env.NOWPULSE_KV){const last=await env.NOWPULSE_KV.get("last-maintenance");maintenanceDue=!last||(Date.now()-Date.parse(last)>21600000)}
  if(!force&&!repairNeeded&&!maintenanceDue)return{ok:true,action:"healthy",quality:diag.quality};
  if(env.NOWPULSE_KV){const lock=await env.NOWPULSE_KV.get("repair-lock");if(lock&&!force)return{ok:true,action:"cooldown",broken:diag.broken}}
  const g=await githubFile(env);if(!g.ok)return{ok:false,reason:"GitHub read failed",status:g.status,detail:g.text};
  const current=atob(String(g.data.content||"").replace(/\n/g,""));
  const generated=await generate(env,diag,repairNeeded?"repair":"maintenance",current);if(!generated.ok)return{...generated,broken:diag.broken};
  if(generated.next===current)return{ok:true,action:"no-change",broken:diag.broken};
  const message=repairNeeded?"AI repair: fix NowPulse production quality checks":"AI maintenance: conservative NowPulse quality improvement";
  const put=await commit(env,generated.next,message,g.data.sha);
  if(!put.ok)return{ok:false,reason:"GitHub write failed",status:put.status,detail:put.text,broken:diag.broken};
  const sha=put.data.commit?.sha;
  await record(env,"last-change",{time:new Date().toISOString(),mode:repairNeeded?"repair":"maintenance",commit:sha,broken:diag.broken});
  const deploy=await waitForDeploy(env,sha);
  const production=await verifyProduction();
  if(!deploy.ok||!production.ok){
    const rollback=await commit(env,current,"AI safety rollback: failed post-deploy verification",sha);
    await record(env,"last-rollback",{time:new Date().toISOString(),failedCommit:sha,deploy,production,rollback:rollback.data?.commit?.sha||null});
    return{ok:false,action:"rolled-back",commit:sha,rollback:rollback.data?.commit?.sha||null,broken:diag.broken,postDeploy:production,deploy};
  }
  if(env.NOWPULSE_KV){await env.NOWPULSE_KV.put("repair-lock",new Date().toISOString(),{expirationTtl:3600});if(!repairNeeded)await env.NOWPULSE_KV.put("last-maintenance",new Date().toISOString())}
  return{ok:true,action:repairNeeded?"repaired":"maintained",commit:sha,broken:diag.broken,quality:diag.quality,postDeploy:production,deploy};
}
export default{
  async fetch(req,env){
    const u=new URL(req.url);
    if(u.pathname==="/health")return Response.json({ok:true,service:"nowpulse-ai-manager",model:env.NOWPULSE_AI_MODEL||MODEL,gateway:env.NOWPULSE_AI_GATEWAY_ID||"default",maintenance:env.NOWPULSE_AI_MAINTENANCE||"enabled"});
    if(u.pathname==="/run")return Response.json(await run(env,true));
    if(u.pathname==="/diagnose")return Response.json(await diagnose());
    return new Response("NowPulse AI Manager",{status:404});
  },
  async scheduled(c,env,ctx){ctx.waitUntil(run(env).then(x=>console.log(JSON.stringify(x))).catch(e=>console.error(e)))}
};