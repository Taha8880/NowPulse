import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root=process.cwd();
const read=(p)=>readFileSync(join(root,p),"utf8");
const required=[
  "src/worker.js",
  "src/ai-guardian.js",
  "src/nowpulse-maintenance-workflow.js",
  "wrangler.jsonc",
  "ai-manager.js",
  "ai-manager.wrangler.jsonc"
];
for(const p of required){
  if(!existsSync(join(root,p))) throw new Error("Missing required file: "+p);
}
const worker=read("src/worker.js");
const wrangler=read("wrangler.jsonc");
const ai=read("ai-manager.js");
const aiCfg=read("ai-manager.wrangler.jsonc");
const checks=[
  ['worker version',worker.includes('const VERSION = "6.1.5"')],
  ['RSS parser',worker.includes('function between(xml,tag)')],
  ['GDELT fallback',worker.includes('gdeltFeed')],
  ['semantic image fallback',worker.includes('wikipediaImage')&&worker.includes('wikimediaImage')],
  ['markets FX',worker.includes('api.frankfurter.dev/v2/rates')&&worker.includes('chfEgp')],
  ['search query cache',worker.includes('search:v11:')&&worker.includes('encodeURIComponent(q.toLowerCase())')],
  ['weather cache',worker.includes('weather:v2:')],
  ['image cache',worker.includes('img:v11:')],
  ['markets gold',worker.includes('api.goldprice.dev/v1/carat')],
  ['article evidence',worker.includes('sourceEvidence')&&worker.includes('PRIMARY SOURCE EVIDENCE')],
  ['story hub',worker.includes('article-kicker')],
  ['ads.txt',worker.includes('google.com, pub-1235197294708204')],
  ['guardian',wrangler.includes('"NowPulseGuardian"')],
  ['maintenance workflow',read('src/nowpulse-maintenance-workflow.js').includes('class NowPulseMaintenanceWorkflow')],
  ['AI primary',ai.includes('@cf/zai-org/glm-5.2')],
  ['AI fallback',ai.includes('@cf/meta/llama-3.1-8b-instruct-fast')],
  ['AI manager version',ai.includes('const VERSION = "10.1.0"')],
  ['AI manager schedule',aiCfg.includes('*/15 * * * *')]
];
const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length) throw new Error("Contract failures: "+failed.join(", "));
console.log("NowPulse contract test passed:",checks.length,"checks");
