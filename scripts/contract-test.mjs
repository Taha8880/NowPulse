import {readFileSync} from "node:fs";
const w=readFileSync("src/worker.js","utf8");
const c=readFileSync("wrangler.jsonc","utf8");
const checks=[
 ["version",w.includes('const VERSION="9.0.0"')],
 ["health",w.includes('service:"NowPulse"')],
 ["news api",w.includes('p==="/api/news"')],
 ["markets api",w.includes('p==="/api/markets"')],
 ["weather api",w.includes('p==="/api/weather"')],
 ["search",w.includes('p==="/search"')],
 ["article route",w.includes('p.startsWith("/article/")')],
 ["category route",w.includes('p.startsWith("/category/")')],
 ["ads",w.includes("google.com, pub-1235197294708204")],
 ["kv",c.includes("184c64ea1ed443e1bac081453cd599bf")],
 ["version var",c.includes("NOWPULSE_VERSION")],
 ["footer",w.includes("Created by Taha")]
];
const bad=checks.filter(x=>!x[1]).map(x=>x[0]);
if(bad.length)throw Error("Contract failures: "+bad.join(", "));
console.log("NowPulse v9 contract passed",checks.length);