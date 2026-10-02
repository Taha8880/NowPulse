const SITE="https://nowpulse.tavengers16.workers.dev";
const REPO="Taha8880/NowPulse";
const BRANCH="main";
const FILE="src/worker.js";
const MODEL="openai/gpt-6-sol";
const CATS=["latest","egypt","arab","world","politics","sports","economy","tech","arts","health","travel","trends"];

async function req(url,init={}){const r=await fetch(url,{...init,headers:{"accept":"application/json",...(init.headers||{})}});const t=await r.text();let data={};try{data=JSON.parse(t)}catch{}return{ok:r.ok,status:r.status,data,text:t}}
async function site(path){try{const r=await fetch(SITE+path,{redirect:"follow",headers:{"user-agent":"NowPulse-AI-Manager/2.0","accept":"text/html,application/json,*/*"}});return{ok:r.ok,status:r.status,contentType:r.headers.get("content-type")||"",text:(await r.text()).slice(0,12000)}}catch(e){return{ok:false,status:0,text:String(e)}}}
function b64(s){const a=new TextEncoder().encode(s);let x="";for(let i=0;i<a.length;i+=32768)x+=String.fromCharCode(...a.slice(i,i+32768));return btoa(x)}
function aiText(x){if(typeof x==="string")return x;if(x?.choices?.[0]?.message)return x.choices[0].message.content||"";if(x?.output_text)return x.output_text;if(x?.response)return x.response;if(Array.isArray(x?.output)){let s="";for(const o of x.output)for(const c of o.content||[])if(c?.text)s+=c.text;return s}return""}
function codeOnly(s){let x=String(s||"").trim();const m=x.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i);return m?m[1].trim():x}
function validSource(s){
  const x=String(s||"");
  if(x.length<12000||x.length>220000)return false;
  if(!x.includes("export default")||!x.includes("NowPulse")||!x.includes("async function news")||!x.includes("function shell")||!x.includes("/api/markets"))return false;
  const opens=(x.match(/[{}]/g)||[]).reduce((n,c)=>n+(c==="{"?1:-1),0);
  return opens===0;
}
function cleanPlanText(s){let x=String(s||"").trim();const m=x.match(/\\`\\`\\`(?:json)?\\s*([\\s\\S]*?)\\`\\`\\`/i);return m?m[1].trim():x}
function parsePlan(s){try{const o=JSON.parse(cleanPlanText(s));if(!o||typeof o!=="object"||!o.files||typeof o.files!=="object")return null;return o}catch{return null}}
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
  for(const k of ["usd","eur","gbp","sar","aed"])if(!(Number(m.fx?.[k]?.mid)>0))d.broken.push("market:"+k);for(const k of ["24K","21K","18K"])if(!(Number(m.gold?.[k]?.mid)>0))d.broken.push("market:"+k);
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
async function repoSnapshot(env){
  const h={"authorization":"Bearer "+env.NOWPULSE_GITHUB_TOKEN,"x-github-api-version":"2026-03-10","user-agent":"NowPulse-AI-Manager/3.0"};
  const r=await req("https://api.github.com/repos/"+REPO+"/git/trees/"+BRANCH+"?recursive=1",{headers:h});
  if(!r.ok)return{ok:false,status:r.status,text:r.text};
  const files=(r.data.tree||[]).filter(x=>x.type==="blob"&&/\\.(js|mjs|json|jsonc|yaml|yml|md|html|css|txt)$/i.test(x.path)&&x.size<220000);
  const out={};
  for(const f of files){
    const q=await req("https://api.github.com/repos/"+REPO+"/contents/"+encodeURIComponent(f.path).replace(/%2F/g,"/")+"?ref="+BRANCH,{headers:h});
    if(q.ok&&q.data?.content)out[f.path]=atob(String(q.data.content).replace(/\\n/g,""));
  }
  return{ok:true,files:out,tree:r.data.tree||[]};
}
async function generate(env,diag,mode,snapshot){
  const mission=mode==="repair"?"Find and fix every real defect you can identify across the entire repository, not only the listed diagnostics.":"Perform a deep preventive code review across every repository file and improve only clear reliability, security, performance, maintainability, SEO, accessibility, or UX defects without unnecessary redesign.";
  const rules="You are the senior autonomous software engineer for NowPulse. "+mission+" You MUST inspect every supplied source/config/workflow/test file and reason about cross-file dependencies. Do not limit your review to predefined checks. Look for syntax/runtime errors, broken routes, incorrect API contracts, stale assumptions, encoding/RTL issues, async/concurrency bugs, caching, timeouts, error handling, security headers, injection/XSS risks, open redirects, URL validation, SSR/HTML escaping, SEO, accessibility, responsive CSS, performance, Cloudflare Workers compatibility, Wrangler configuration, Durable Objects, GitHub Actions, tests, deployment, secrets handling, dead code, duplicated logic, broken references, and regressions. Fix code when a defect is found. Preserve working behavior and all intended NowPulse features. Arabic remains RTL and English LTR. Preserve the NowPulseGuardian Durable Object export. Never expose raw RSS HTML/entities or Google News wrapper pages. Cards must preserve their own story metadata and open their own article. Article pages MUST be complete internal reading pages: never redirect the user to the source, never depend on an external click to read the story, resolve the original source when possible, extract verified metadata and available article sections, and present a professional structured summary/details/context page while respecting copyright (do not reproduce an entire third-party article verbatim). /api/image must return image bytes. Relevant images must not be logos/placeholders; resolve article-specific og:image/media images before generic fallback. Keep internal search fully functional with internal story IDs, categories, markets, quotes, dark/light mode, animated background, SEO, ads and footer 'NowPulse · Created by Taha'. News must be cache-first: previously loaded news should render immediately from browser/local storage or another durable cache, then refresh silently in the background; do not make users wait for all feeds again on every visit. Search results and article pages should also use internal caching where safe. Ads must never block the initial content render. Do not add npm dependencies unless absolutely required and already supported by the repository.\n\nRETURN ONLY VALID JSON, no Markdown, in this exact shape: {\"summary\":\"brief audit summary\",\"findings\":[{\"path\":\"file\",\"severity\":\"critical|high|medium|low\",\"issue\":\"...\",\"fix\":\"...\"}],\"files\":{\"path/to/file\":\"COMPLETE NEW FILE CONTENT\"}}. The files object must contain ONLY files that you actually changed, and every changed file must contain its COMPLETE final content, not a diff. Never delete a file unless it is demonstrably harmful; if deletion is required, state it in findings but do not perform it automatically. Do not invent files. If no code change is justified, return an empty files object.\n\nProduction diagnostics:\n"+JSON.stringify(diag)+"\n\nRepository files:\n"+JSON.stringify(snapshot.files);
  let ai;try{ai=await env.AI.run(env.NOWPULSE_AI_MODEL||MODEL,{messages:[{role:"system",content:"Autonomous repository-wide code auditor, debugger, and maintainer for Cloudflare Workers."},{role:"user",content:rules}],max_completion_tokens:60000,temperature:0.02,reasoning_effort:"high"},{gateway:{id:env.NOWPULSE_AI_GATEWAY_ID||"default",skipCache:true,collectLog:true,metadata:{service:"nowpulse-ai-manager",mode,scope:"repository-wide"}}})}catch(e){return{ok:false,reason:"AI inference failed",error:String(e)}}
  const plan=parsePlan(aiText(ai));if(!plan)return{ok:false,reason:"AI returned invalid JSON plan"};
  for(const [path,content] of Object.entries(plan.files||{})){if(!snapshot.files[path]&&path!=="src/worker.js")return{ok:false,reason:"AI attempted to create an unknown file",path};if(typeof content!=="string"||content.length>220000)return{ok:false,reason:"AI returned invalid file content",path};if(path==="src/worker.js"&&!validSource(content))return{ok:false,reason:"AI returned invalid worker source"}}
  return{ok:true,plan};
}
async function commitFiles(env,files,message,parentSha,treeSha){
  const h={"authorization":"Bearer "+env.NOWPULSE_GITHUB_TOKEN,"content-type":"application/json","x-github-api-version":"2026-03-10","user-agent":"NowPulse-AI-Manager/3.0"};
  const entries=[];
  for(const [path,content] of Object.entries(files)){const b=await req("https://api.github.com/repos/"+REPO+"/git/blobs",{method:"POST",headers:h,body:JSON.stringify({content,encoding:"utf-8"})});if(!b.ok)return{ok:false,stage:"blob",path,status:b.status,text:b.text};entries.push({path,mode:"100644",type:"blob",sha:b.data.sha})}
  const t=await req("https://api.github.com/repos/"+REPO+"/git/trees",{method:"POST",headers:h,body:JSON.stringify({base_tree:treeSha,tree:entries})});if(!t.ok)return{ok:false,stage:"tree",status:t.status,text:t.text};
  const c=await req("https://api.github.com/repos/"+REPO+"/git/commits",{method:"POST",headers:h,body:JSON.stringify({message,tree:t.data.sha,parents:[parentSha]})});if(!c.ok)return{ok:false,stage:"commit",status:c.status,text:c.text};
  const u=await req("https://api.github.com/repos/"+REPO+"/git/refs/heads/"+BRANCH,{method:"PATCH",headers:h,body:JSON.stringify({sha:c.data.sha,force:false})});if(!u.ok)return{ok:false,stage:"ref",status:u.status,text:u.text};
  return{ok:true,sha:c.data.sha,tree:t.data.sha};
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
  if(!img.ok||!/image\//i.test(img.contentType||""))issues.push("image");
  if(!a.ok||!/<h1>/i.test(a.text)||/news\.google\.com\/rss/i.test(a.text))issues.push("article");
  return{ok:issues.length===0,issues};
}
async function record(env,key,value){
  if(env.NOWPULSE_KV)await env.NOWPULSE_KV.put(key,JSON.stringify(value),{expirationTtl:2592000});
}

async function run(env,force=false){
  if(!env.NOWPULSE_GITHUB_TOKEN)return{ok:false,reason:"NOWPULSE_GITHUB_TOKEN missing"};
  const diag=await diagnose();
  const maintenanceEnabled=env.NOWPULSE_AI_MAINTENANCE!=="disabled";
  let maintenanceDue=false;
  if(maintenanceEnabled&&env.NOWPULSE_KV){const last=await env.NOWPULSE_KV.get("last-maintenance");maintenanceDue=!last||(Date.now()-Date.parse(last)>3600000)}
  if(!force&&!diag.broken.length&&!maintenanceDue)return{ok:true,action:"healthy",quality:diag.quality};
  if(env.NOWPULSE_KV){const lock=await env.NOWPULSE_KV.get("repair-lock");if(lock&&!force)return{ok:true,action:"cooldown",broken:diag.broken}}
  const snapshot=await repoSnapshot(env);if(!snapshot.ok)return{ok:false,reason:"Repository snapshot failed",detail:snapshot.text};
  const history=env.NOWPULSE_KV?await env.NOWPULSE_KV.get("last-change"):null;
  const rollback=env.NOWPULSE_KV?await env.NOWPULSE_KV.get("last-rollback"):null;
  diag.repository={files:Object.keys(snapshot.files),fileCount:Object.keys(snapshot.files).length,previousChange:history,previousRollback:rollback};
  const mode=diag.broken.length?"repair":"maintenance";
  const generated=await generate(env,diag,mode,snapshot);if(!generated.ok)return{...generated,broken:diag.broken};
  const changes=generated.plan.files||{};
  if(!Object.keys(changes).length){if(env.NOWPULSE_KV)await env.NOWPULSE_KV.put("last-maintenance",new Date().toISOString());return{ok:true,action:"audited-no-change",broken:diag.broken,findings:generated.plan.findings||[]}}
  const currentRef=await req("https://api.github.com/repos/"+REPO+"/git/ref/heads/"+BRANCH,{headers:{"authorization":"Bearer "+env.NOWPULSE_GITHUB_TOKEN,"x-github-api-version":"2026-03-10","user-agent":"NowPulse-AI-Manager/3.0"}});if(!currentRef.ok)return{ok:false,reason:"Git ref read failed"};
  const parent=currentRef.data.object.sha;
  const commitInfo=await req("https://api.github.com/repos/"+REPO+"/git/commits/"+parent,{headers:{"authorization":"Bearer "+env.NOWPULSE_GITHUB_TOKEN,"x-github-api-version":"2026-03-10","user-agent":"NowPulse-AI-Manager/3.0"}});if(!commitInfo.ok)return{ok:false,reason:"Commit read failed"};
  const changed={};const original={};for(const [p,c] of Object.entries(changes)){changed[p]=c;original[p]=snapshot.files[p]}
  const put=await commitFiles(env,changed,"AI repository-wide "+mode+": autonomous code audit and repair",parent,commitInfo.data.tree.sha);
  if(!put.ok)return{ok:false,reason:"Repository commit failed",detail:put};
  await record(env,"last-change",{time:new Date().toISOString(),mode,commit:put.sha,changed:Object.keys(changes),findings:generated.plan.findings||[],broken:diag.broken});
  const deploy=await waitForDeploy(env,put.sha);const production=await verifyProduction();
  if(!deploy.ok||!production.ok){
    const rb=await commitFiles(env,original,"AI safety rollback: failed repository post-deploy verification",put.sha,commitInfo.data.tree.sha);
    await record(env,"last-rollback",{time:new Date().toISOString(),failedCommit:put.sha,changed:Object.keys(changes),deploy,production,rollback:rb});
    return{ok:false,action:"rolled-back",commit:put.sha,rollback:rb,changed:Object.keys(changes),findings:generated.plan.findings||[],postDeploy:production,deploy};
  }
  if(env.NOWPULSE_KV){await env.NOWPULSE_KV.put("repair-lock",new Date().toISOString(),{expirationTtl:1800});await env.NOWPULSE_KV.put("last-maintenance",new Date().toISOString())}
  return{ok:true,action:mode==="repair"?"repaired":"maintained",commit:put.sha,changed:Object.keys(changes),findings:generated.plan.findings||[],broken:diag.broken,postDeploy:production,deploy};
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