import fs from "node:fs";
const worker=fs.readFileSync("src/worker.js","utf8");
const manager=fs.readFileSync("ai-manager.js","utf8");

const required=[
  ["version","const VERSION = \"6.0.0\""],
  ["semantic image blacklist","logo|icon|sprite|favicon|avatar|placeholder"],
  ["semantic image fallback","wikipediaImage"],
  ["GDELT image fallback","gdeltImage"],
  ["live FX provider","api.frankfurter.dev/v2/rates"],
  ["live gold provider","api.goldprice.dev/v1/carat"],
  ["independent market provider state","provider.fx"],
  ["article evidence","sourceEvidence"],
  ["source-grounded AI","PRIMARY SOURCE EVIDENCE"],
  ["Story Hub","story-hub"],
  ["life quotes","كل يوم جديد يحمل فرصة جديدة"],
  ["sitemap","/sitemap.xml"],
  ["ads.txt","google.com, pub-1235197294708204"],
  ["AI primary reasoning","@cf/zai-org/glm-5.2"],
  ["AI fallback","@cf/meta/llama-3.1-8b-instruct-fast"]
];

for(const [name,needle] of required){
  if(!worker.includes(needle)&&!manager.includes(needle)) throw new Error("Missing contract: "+name);
}
if(worker.includes('const category=url.searchParams.get("category")||"latest",items=await loadFeed(env,false,lang),enriched=')
  throw new Error("Home render must not block on bulk image enrichment.");
if(!worker.includes('const key="img:v5:"+a.id')) throw new Error("Image cache generation was not bumped.");
console.log("NowPulse product contract checks passed:",required.length);
