const VERSION = "8.3.1";

const REPOSITORY = "Taha8880/NowPulse";
const DEFAULT_BRANCH = "main";
const WORKER_FILE = "src/worker.js";
const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const PRODUCTION_URL = "https://nowpulse.tavengers16.workers.dev";

const ALLOWED_REPAIR_FILES = new Set([
  "src/worker.js",
  "ai-manager.js",
  "wrangler.jsonc",
  "ai-manager.wrangler.jsonc",
  ".github/workflows/deploy.yml",
  ".github/workflows/deploy-ai-manager.yml"
]);

const REQUIRED_FILES = [
  "src/worker.js",
  "wrangler.jsonc",
  "ai-manager.js",
  "ai-manager.wrangler.jsonc",
  ".github/workflows/deploy.yml",
  ".github/workflows/deploy-ai-manager.yml"
];

const REQUIRED_FEATURES = [
  ["fetch handler", /\bexport\s+default\s+[\s\S]*?\bfetch\s*\(/i],
  ["scheduled handler", /\bscheduled\s*\(/i],
  ["Created by Taha", /Created\s+by\s+Taha/i],
  ["AI binding", /\bAI\b/i],
  ["KV binding", /NOWPULSE_KV/i],
  ["RSS/news feeds", /\bRSS\b|rss|FEEDS/i],
  ["article rendering", /articleBody|article|renderArticle/i],
  ["search", /search/i],
  ["sitemap", /sitemap/i]
];

const PROJECT_RULES = `
You are the maintenance AI for the NowPulse project.

Repository:
Taha8880/NowPulse

Main Worker:
src/worker.js

Runtime:
Cloudflare Workers

Required bindings:
AI
NOWPULSE_KV

Core requirements:
1. News must be visible without user interests.
2. Arabic and English must work.
3. RTL and LTR must work correctly.
4. Desktop, tablet and mobile must work.
5. Search must support arbitrary people and topics.
6. Search must support Arabic and English.
7. Articles must be readable inside NowPulse.
8. AI articles must synthesize multiple sources.
9. Images must not block article rendering.
10. Image fallback must exist.
11. Weather must exist.
12. Gold, currency and market data must exist.
13. Sitemap must exist.
14. robots.txt must exist.
15. RSS/news feeds must exist.
16. Trends must exist.
17. SEO must exist.
18. Created by Taha must remain.
19. Articles must be readable inside NowPulse.
20. Worker must remain Cloudflare Worker compatible.
21. Browser APIs are allowed only inside client-side template strings.
22. Browser APIs must not execute in Worker server code.
23. Node.js-only APIs must not be introduced.
24. Secrets must never be hard-coded.
25. Existing working features must not be deleted.
26. Never replace the project with a reduced demo.
27. Never remove AI or KV bindings.
28. Never expose GITHUB_TOKEN.
29. Only modify the NowPulse repository.
30. Political/news content must remain factual and neutral.
31. Egypt is the primary news market and must receive the strongest feed coverage.
32. Arab-country news is the second priority; international news is secondary.
33. Arabic is the default site language; English is an alternate interface/content language.
34. Never use a publisher logo, favicon, avatar, masthead or generic site image as an article image.
35. Prefer a relevant article image; if unavailable, use a semantically matched fallback image or omit the image.
36. Never invent article facts, quotations, prices, dates or people.
37. Preserve AdSense integration and ads.txt; do not hard-code new ad slot IDs.
`;

function isAuthorized(request, env){
  const configured=env.AI_MANAGER_AUTH_TOKEN||env.GITHUB_TOKEN||"";
  if(!configured)return false;
  const header=request.headers.get("authorization")||"";
  return header===`Bearer ${configured}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function text(value) {
  return typeof value === "string" ? value : "";
}

function truncate(value, max = 50000) {
  const valueText = text(value);
  return valueText.length > max
    ? valueText.slice(0, max) + "\n/* truncated */"
    : valueText;
}

function githubHeaders(env) {
  const token = env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN secret is missing.");
  }

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": `NowPulse-AI-Manager/${VERSION}`
  };
}

async function github(env, path, options = {}) {
  const response = await fetch(
    `https://api.github.com/repos/${REPOSITORY}${path}`,
    {
      ...options,
      headers: {
        ...githubHeaders(env),
        ...(options.headers || {})
      }
    }
  );

  const body = await response.text();

  let data;

  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    data = {
      raw: body
    };
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `GitHub API error ${response.status}`;

    const acceptedPermissions =
      response.headers.get("X-Accepted-GitHub-Permissions") || "";

    const oauthScopes =
      response.headers.get("X-OAuth-Scopes") || "";

    const documentation =
      response.headers.get("documentation_url") || "";

    throw new Error(
      [
        `GitHub API ${response.status}`,
        `message=${message}`,
        acceptedPermissions
          ? `accepted_permissions=${acceptedPermissions}`
          : "",
        oauthScopes
          ? `oauth_scopes=${oauthScopes}`
          : "",
        documentation
          ? `documentation=${documentation}`
          : ""
      ]
        .filter(Boolean)
        .join(" | ")
    );
  }

  return data;
}

async function githubRaw(env, path, options = {}) {
  try {
    const data = await github(env, path, options);

    return {
      ok: true,
      status: 200,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      error: text(error?.message || error)
    };
  }
}

async function getRepository(env) {
  return github(env, "");
}

async function getBranch(env, branch = DEFAULT_BRANCH) {
  return github(
    env,
    `/branches/${encodeURIComponent(branch)}`
  );
}

async function getTree(env, branch = DEFAULT_BRANCH) {
  return github(
    env,
    `/git/trees/${encodeURIComponent(branch)}?recursive=1`
  );
}

function decodeBase64Utf8(value) {
  const clean = text(value).replace(/\s/g, "");
  const binary = atob(clean);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);

  let binary = "";

  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + 0x8000)
    );
  }

  return btoa(binary);
}

async function getFile(
  env,
  path,
  branch = DEFAULT_BRANCH
) {
  const data = await github(
    env,
    `/contents/${path}?ref=${encodeURIComponent(branch)}`
  );

  if (!data?.content) {
    throw new Error(
      `GitHub file content unavailable: ${path}`
    );
  }

  return {
    path,
    sha: data.sha,
    content: decodeBase64Utf8(data.content)
  };
}

/*
 * Lightweight JavaScript delimiter scanner.
 *
 * Important:
 * It understands strings, comments and regular-expression
 * literals so characters such as ] inside:
 *
 * /foo[bar]baz/
 *
 * are NOT treated as JavaScript delimiters.
 */
function scanDelimiters(source) {
  const stack = [];

  const pairs = {
    "(": ")",
    "[": "]",
    "{": "}"
  };

  const closing = new Set([
    ")",
    "]",
    "}"
  ]);

  let state = "code";
  let quote = "";
  let escaped = false;

  let line = 1;
  let column = 0;

  let regexAllowed = true;

  function advanceCharacter(c) {
    if (c === "\n") {
      line++;
      column = 0;
    } else {
      column++;
    }
  }

  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    const n = source[i + 1];

    if (c === "\n") {
      if (
        state === "lineComment" ||
        state === "regex"
      ) {
        if (state === "regex") {
          return {
            ok: false,
            message:
              `Unterminated regular expression at line ${line}, column ${column}.`
          };
        }

        state = "code";
      }

      advanceCharacter(c);
      continue;
    }

    if (state === "lineComment") {
      advanceCharacter(c);
      continue;
    }

    if (state === "blockComment") {
      if (c === "*" && n === "/") {
        state = "code";
        advanceCharacter(c);
        i++;
        advanceCharacter("/");
      } else {
        advanceCharacter(c);
      }

      continue;
    }

    if (state === "string") {
      if (escaped) {
        escaped = false;
        advanceCharacter(c);
        continue;
      }

      if (c === "\\") {
        escaped = true;
        advanceCharacter(c);
        continue;
      }

      if (c === quote) {
        state = "code";
        quote = "";
      }

      advanceCharacter(c);
      continue;
    }

    if (state === "regex") {
      if (escaped) {
        escaped = false;
        advanceCharacter(c);
        continue;
      }

      if (c === "\\") {
        escaped = true;
        advanceCharacter(c);
        continue;
      }

      if (c === "[") {
        advanceCharacter(c);

        let inClass = true;
        let classEscaped = false;

        for (i++; i < source.length; i++) {
          const rc = source[i];

          if (rc === "\n") {
            return {
              ok: false,
              message:
                `Unterminated regular expression character class at line ${line}, column ${column}.`
            };
          }

          if (classEscaped) {
            classEscaped = false;
            advanceCharacter(rc);
            continue;
          }

          if (rc === "\\") {
            classEscaped = true;
            advanceCharacter(rc);
            continue;
          }

          if (rc === "]") {
            inClass = false;
            advanceCharacter(rc);
            break;
          }

          advanceCharacter(rc);
        }

        if (inClass) {
          return {
            ok: false,
            message:
              `Unterminated regular expression character class at line ${line}, column ${column}.`
          };
        }

        continue;
      }

      if (c === "/") {
        state = "code";
        regexAllowed = false;

        advanceCharacter(c);

        while (i + 1 < source.length) {
          const flag = source[i + 1];

          if (!/[a-z]/i.test(flag)) {
            break;
          }

          i++;
          advanceCharacter(flag);
        }

        continue;
      }

      advanceCharacter(c);
      continue;
    }

    if (state === "template") {
      if (escaped) {
        escaped = false;
        advanceCharacter(c);
        continue;
      }

      if (c === "\\") {
        escaped = true;
        advanceCharacter(c);
        continue;
      }

      if (c === "`") {
        state = "code";
        regexAllowed = false;
      }

      advanceCharacter(c);
      continue;
    }

    /*
     * code state
     */

    if (c === "/" && n === "/") {
      state = "lineComment";
      advanceCharacter(c);
      i++;
      advanceCharacter("/");
      continue;
    }

    if (c === "/" && n === "*") {
      state = "blockComment";
      advanceCharacter(c);
      i++;
      advanceCharacter("*");
      continue;
    }

    if (
      c === "'" ||
      c === '"'
    ) {
      state = "string";
      quote = c;
      escaped = false;
      advanceCharacter(c);
      continue;
    }

    if (c === "`") {
      state = "template";
      advanceCharacter(c);
      continue;
    }

    /*
     * Detect likely regular expressions.
     *
     * A slash after operators, opening delimiters or
     * certain keywords is normally a regex literal.
     */
    if (c === "/") {
      const before = source
        .slice(0, i)
        .trimEnd();

      const previous = before.at(-1) || "";

      const regexContext =
        regexAllowed ||
        !previous ||
        /[=(:,!&|?{};[\]]/.test(previous) ||
        /\b(return|throw|case|delete|typeof|void|new|in|of|instanceof)\s*$/.test(
          before
        );

      if (regexContext) {
        state = "regex";
        advanceCharacter(c);
        continue;
      }
    }

    if (pairs[c]) {
      stack.push({
        open: c,
        line,
        column: column + 1
      });

      regexAllowed = true;
      advanceCharacter(c);
      continue;
    }

    if (closing.has(c)) {
      if (!stack.length) {
        return {
          ok: false,
          message:
            `Unexpected closing ${c} at line ${line}, column ${column + 1}.`
        };
      }

      const last = stack.pop();
      const expected = pairs[last.open];

      if (expected !== c) {
        return {
          ok: false,
          message:
            `Mismatched closing ${c} at line ${line}, column ${column + 1}. ` +
            `Expected ${expected}.`
        };
      }

      regexAllowed = true;
      advanceCharacter(c);
      continue;
    }

    if (
      /[=,:;!?&|+\-*%^<>]/.test(c)
    ) {
      regexAllowed = true;
    } else if (
      /[A-Za-z0-9_$'"`]/.test(c)
    ) {
      regexAllowed = false;
    }

    advanceCharacter(c);
  }

  if (state === "string") {
    return {
      ok: false,
      message:
        `Unclosed string literal near line ${line}.`
    };
  }

  if (state === "blockComment") {
    return {
      ok: false,
      message:
        `Unclosed block comment near line ${line}.`
    };
  }

  if (state === "regex") {
    return {
      ok: false,
      message:
        `Unclosed regular expression near line ${line}.`
    };
  }

  if (state === "template") {
    return {
      ok: false,
      message:
        `Unclosed template literal near line ${line}.`
    };
  }

  if (stack.length) {
    const last = stack[stack.length - 1];

    return {
      ok: false,
      message:
        `Unclosed delimiter ${last.open} opened at line ${last.line}, column ${last.column}.`
    };
  }

  return {
    ok: true,
    message: "Delimiter structure is balanced."
  };
}

function maskCode(source) {
  let output = "";

  let state = "code";
  let quote = "";
  let escaped = false;

  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    const n = source[i + 1];

    if (state === "code") {
      if (c === "/" && n === "/") {
        output += "  ";
        i++;
        state = "lineComment";
        continue;
      }

      if (c === "/" && n === "*") {
        output += "  ";
        i++;
        state = "blockComment";
        continue;
      }

      if (
        c === "'" ||
        c === '"' ||
        c === "`"
      ) {
        quote = c;
        output += " ";
        state = "string";
        continue;
      }

      output += c;
      continue;
    }

    if (state === "lineComment") {
      if (c === "\n") {
        output += "\n";
        state = "code";
      } else {
        output += " ";
      }

      continue;
    }

    if (state === "blockComment") {
      if (c === "*" && n === "/") {
        output += "  ";
        i++;
        state = "code";
      } else {
        output += c === "\n" ? "\n" : " ";
      }

      continue;
    }

    if (state === "string") {
      if (escaped) {
        output += c === "\n" ? "\n" : " ";
        escaped = false;
        continue;
      }

      if (c === "\\") {
        output += " ";
        escaped = true;
        continue;
      }

      if (c === quote) {
        output += " ";
        state = "code";
        continue;
      }

      output += c === "\n" ? "\n" : " ";
    }
  }

  return output;
}

function detectWorkerBrowserApis(source) {
  const code = maskCode(source);

  const found = [];

  const patterns = [
    /\bwindow\b/,
    /\bdocument\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/
  ];

  for (const pattern of patterns) {
    if (pattern.test(code)) {
      found.push(pattern.source);
    }
  }

  return found;
}

function hasClientTemplate(source) {
  return /\b(?:const|let|var)\s+CLIENT\s*=\s*`/.test(
    source
  );
}

function detectForbiddenServerApis(source) {
  const code = maskCode(source);

  const checks = [
    [/\bprocess\.env\b/, "process.env"],
    [/\brequire\s*\(/, "require()"],
    [/\b__dirname\b/, "__dirname"],
    [/\b__filename\b/, "__filename"],
    [/\bfs\./, "fs API"],
    [/\bchild_process\b/, "child_process"]
  ];

  const forbidden = [];

  for (const [pattern, name] of checks) {
    if (pattern.test(code)) {
      forbidden.push(name);
    }
  }

  return forbidden;
}

function featureChecks(source) {
  return REQUIRED_FEATURES.map(
    ([name, pattern]) => ({
      name,
      present: pattern.test(source)
    })
  );
}

function architectureInspection(source) {
  const problems = [];
  const warnings = [];

  const delimiters = scanDelimiters(source);

  if (!delimiters.ok) {
    problems.push(delimiters.message);
  }

  const browserApis =
    detectWorkerBrowserApis(source);

  if (
    browserApis.length &&
    !hasClientTemplate(source)
  ) {
    problems.push(
      `Browser APIs detected outside a CLIENT template: ${browserApis.join(", ")}`
    );
  } else if (browserApis.length) {
    warnings.push(
      "Browser APIs exist in the Worker source and may belong to the CLIENT template."
    );
  }

  const forbidden =
    detectForbiddenServerApis(source);

  if (forbidden.length) {
    problems.push(
      `Node-only APIs detected in Worker code: ${forbidden.join(", ")}`
    );
  }

  const features =
    featureChecks(source);

  for (const item of features) {
    if (!item.present) {
      problems.push(
        `Required feature missing: ${item.name}`
      );
    }
  }

  return {
    ok: problems.length === 0,
    problems,
    warnings,
    features
  };
}

function configurationInspection(source) {
  const problems = [];

  if (
    !/"name"\s*:\s*"nowpulse"/.test(source)
  ) {
    problems.push(
      "wrangler.jsonc does not appear to target the nowpulse Worker."
    );
  }

  if (
    !/"main"\s*:\s*"src\/worker\.js"/.test(source)
  ) {
    problems.push(
      "wrangler.jsonc main should be src/worker.js."
    );
  }

  if (
    !/"binding"\s*:\s*"AI"/.test(source)
  ) {
    problems.push(
      "Workers AI binding AI was not found."
    );
  }

  if (
    !/"binding"\s*:\s*"NOWPULSE_KV"/.test(source)
  ) {
    problems.push(
      "KV binding NOWPULSE_KV was not found."
    );
  }

  return {
    ok: problems.length === 0,
    problems
  };
}

async function inspectProject(env) {
  const repository =
    await getRepository(env);

  const branch =
    await getBranch(env, DEFAULT_BRANCH);

  const tree =
    await getTree(env, DEFAULT_BRANCH);

  const worker =
    await getFile(
      env,
      WORKER_FILE,
      DEFAULT_BRANCH
    );

  const manager =
    await getFile(
      env,
      "ai-manager.js",
      DEFAULT_BRANCH
    );

  const config =
    await getFile(
      env,
      "wrangler.jsonc",
      DEFAULT_BRANCH
    );

  const workerArchitecture =
    architectureInspection(worker.content);

  const managerDelimiters =
    scanDelimiters(manager.content);

  const managerProblems = [];

  if (!managerDelimiters.ok) {
    managerProblems.push(
      managerDelimiters.message
    );
  }

  const configuration =
    configurationInspection(
      config.content
    );

  const treePaths = new Set(
    (tree.tree || []).map(
      item => item.path
    )
  );

  const missingFiles =
    REQUIRED_FILES.filter(
      file => !treePaths.has(file)
    );

  const deploymentProblems = [];

  if (missingFiles.length) {
    deploymentProblems.push(
      `Required files missing: ${missingFiles.join(", ")}`
    );
  }

  const files = (tree.tree || [])
    .filter(
      item => item.type === "blob"
    )
    .map(
      item => item.path
    )
    .filter(
      path =>
        path.startsWith(".github/") ||
        path.startsWith("src/") ||
        path === "ai-manager.js" ||
        path === "ai-manager.wrangler.jsonc" ||
        path === "wrangler.jsonc"
    );

  return {
    ok:
      workerArchitecture.ok &&
      managerProblems.length === 0 &&
      configuration.ok &&
      deploymentProblems.length === 0,

    repository:
      repository.full_name,

    repositoryPrivate:
      repository.private,

    defaultBranch:
      repository.default_branch,

    branch:
      branch.name,

    architecture:
      workerArchitecture,

    manager: {
      ok:
        managerProblems.length === 0,
      problems:
        managerProblems
    },

    configuration,

    deployment: {
      ok:
        deploymentProblems.length === 0,
      problems:
        deploymentProblems
    },

    files
  };
}

function protectedFeatures(source) {
  const checks = [
    ["search", /search/i],
    ["weather", /weather/i],
    ["market", /market/i],
    ["gold", /gold/i],
    ["currency", /currency/i],
    ["sitemap", /sitemap/i],
    ["robots", /robots/i],
    ["rss", /rss/i],
    ["article", /article/i],
    ["trend", /trend/i],
    ["image", /image/i],
    ["Created by Taha", /Created\s+by\s+Taha/i]
  ];

  const result = {};

  for (const [name, pattern] of checks) {
    result[name] = pattern.test(source);
  }

  return result;
}

function compareProtectedFeatures(
  before,
  after
) {
  const oldFeatures =
    protectedFeatures(before);

  const newFeatures =
    protectedFeatures(after);

  const removed = [];

  for (const key of Object.keys(oldFeatures)) {
    if (
      oldFeatures[key] &&
      !newFeatures[key]
    ) {
      removed.push(key);
    }
  }

  return removed;
}

function cleanAIJson(value) {
  let result = text(value).trim();

  if (result.startsWith("```")) {
    result = result.replace(
      /^```(?:json)?/i,
      ""
    );

    result = result.replace(
      /```$/i,
      ""
    );
  }

  const first =
    result.indexOf("{");

  const last =
    result.lastIndexOf("}");

  if (
    first >= 0 &&
    last > first
  ) {
    result =
      result.slice(
        first,
        last + 1
      );
  }

  return result.trim();
}

async function runtimeInspection(){const paths=["/health","/","/?lang=ar","/?lang=en","/search?q=Egypt&lang=en","/search?q=مصر&lang=ar","/api/markets","/sitemap.xml","/ads.txt"];const checks=[];for(const path of paths){try{const r=await fetch(PRODUCTION_URL+path,{redirect:"follow"});const body=await r.text();checks.push({path,status:r.status,ok:r.ok,contentType:r.headers.get("content-type")||"",hasNews:/article|news|خبر|أخبار|NowPulse/i.test(body),hasNoNews:/لا توجد أخبار|No recent stories/i.test(body),size:body.length});}catch(e){checks.push({path,status:0,ok:false,error:text(e?.message||e)});}}const home=checks.find(x=>x.path==="/?lang=ar");return{ok:checks.every(x=>x.ok),production:PRODUCTION_URL,checks,newsProblem:Boolean(home?.hasNoNews||home?.size<3000)};}

async function askAI(
  env,
  inspection,
  workerSource
) {
  if (!env.AI) {
    throw new Error(
      "Workers AI binding AI is missing."
    );
  }

  const prompt = `
${PROJECT_RULES}

Current inspection:
${JSON.stringify(
  inspection,
  null,
  2
)}

You must decide whether a repair is actually necessary.

If no repair is necessary:
{
  "repairRequired": false,
  "diagnosis": "...",
  "changes": [],
  "validation": ["..."]
}

If repair is necessary:
{
  "repairRequired": true,
  "diagnosis": "...",
  "changes": [
    {
      "path": "src/worker.js",
      "content": "COMPLETE FILE CONTENT"
    }
  ],
  "validation": ["..."],
  "notes": ["..."]
}

Rules:
- Never return partial files.
- Never return patches.
- Only modify allowed files.
- Preserve existing features.
- Never invent credentials.
- Never invent bindings.
- Do not remove CLIENT browser code.
- Do not rewrite the Worker merely because browser APIs exist in CLIENT.
- Do not rewrite the entire Worker unless genuinely necessary.
- Prefer safe complete-file repairs.
- Never include GITHUB_TOKEN.
- Before deciding that no repair is needed, inspect the live production endpoints and treat empty news, broken search, missing images, malformed text, or runtime errors as real defects requiring repair.
- If the live site has no news, repair the ingestion/fallback path so the homepage can recover news without waiting for a user action.
- Search must return relevant results from both local cached news and a reliable external fallback when local news is empty.
- Image failures must never prevent news cards from rendering; use relevant semantic fallbacks or omit the image.
- Worker must remain Cloudflare Worker compatible.

Current Worker source:
${truncate(workerSource, 70000)}
`;

  const result =
    await env.AI.run(
      AI_MODEL,
      {
        messages: [
          {
            role: "system",
            content:
              "You are a conservative production JavaScript repair engineer."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 12000
      }
    );

  const raw =
    result?.response ||
    result?.result?.response ||
    result?.text ||
    "";

  if (!raw) {
    throw new Error(
      "Workers AI returned an empty response."
    );
  }

  try {
    return JSON.parse(
      cleanAIJson(raw)
    );
  } catch {
    throw new Error(
      "Workers AI returned invalid JSON."
    );
  }
}

function validateRepairPlan(
  plan,
  beforeWorker
) {
  if (
    !plan ||
    typeof plan !== "object"
  ) {
    throw new Error(
      "Invalid AI repair plan."
    );
  }

  if (
    !Array.isArray(plan.changes)
  ) {
    throw new Error(
      "AI repair plan has no changes array."
    );
  }

  for (const change of plan.changes) {
    if (
      !change ||
      typeof change !== "object"
    ) {
      throw new Error(
        "Invalid repair change."
      );
    }

    if (
      !ALLOWED_REPAIR_FILES.has(
        change.path
      )
    ) {
      throw new Error(
        `Repair attempted to modify forbidden file: ${change.path}`
      );
    }

    if (
      typeof change.content !== "string" ||
      change.content.length < 20
    ) {
      throw new Error(
        `Repair content is invalid for ${change.path}.`
      );
    }

    if (
      /GITHUB_TOKEN\s*[:=]\s*["'`][^"'`]+/.test(
        change.content
      )
    ) {
      throw new Error(
        `Possible hard-coded secret in ${change.path}.`
      );
    }
  }

  const workerChange =
    plan.changes.find(
      item =>
        item.path === WORKER_FILE
    );

  if (workerChange) {
    const removed =
      compareProtectedFeatures(
        beforeWorker,
        workerChange.content
      );

    if (removed.length) {
      throw new Error(
        `Repair would remove protected features: ${removed.join(", ")}`
      );
    }

    const architecture =
      architectureInspection(
        workerChange.content
      );

    if (!architecture.ok) {
      throw new Error(
        `Proposed Worker failed validation: ${architecture.problems.join(" | ")}`
      );
    }
  }

  return true;
}

async function createBranch(
  env,
  branchName
) {
  const main =
    await getBranch(
      env,
      DEFAULT_BRANCH
    );

  return github(
    env,
    "/git/refs",
    {
      method: "POST",
      body: JSON.stringify({
        ref:
          `refs/heads/${branchName}`,
        sha:
          main.commit.sha
      })
    }
  );
}

async function updateFile(
  env,
  path,
  content,
  message,
  branch
) {
  let existingSha = null;

  try {
    const existing =
      await getFile(
        env,
        path,
        branch
      );

    existingSha = existing.sha;
  } catch {
    existingSha = null;
  }

  const body = {
    message,
    content:
      encodeBase64Utf8(content),
    branch
  };

  if (existingSha) {
    body.sha = existingSha;
  }

  return github(
    env,
    `/contents/${path}`,
    {
      method: "PUT",
      body: JSON.stringify(body)
    }
  );
}

async function hasOpenRepairPR(env){
  try{
    const prs=await github(env, "/pulls?state=open&base="+encodeURIComponent(DEFAULT_BRANCH)+"&per_page=20");
    return Array.isArray(prs)&&prs.some(p=>String(p.title||"").includes("NowPulse AI safe repair"));
  }catch{return false;}
}

async function createPullRequest(
  env,
  branch,
  title,
  body
) {
  return github(
    env,
    "/pulls",
    {
      method: "POST",
      body: JSON.stringify({
        title,
        head: branch,
        base: DEFAULT_BRANCH,
        body
      })
    }
  );
}

function safeBranchName() {
  const timestamp =
    new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);

  return `ai-repair/${timestamp}`;
}

async function runRepair(env) {
  const inspection =
    await inspectProject(env);

  const runtime = await runtimeInspection();
  inspection.runtime = runtime;

  const worker =
    await getFile(
      env,
      WORKER_FILE,
      DEFAULT_BRANCH
    );

  const plan =
    await askAI(
      env,
      inspection,
      worker.content
    );

  if (!plan.repairRequired) {
    return {
      ok: true,
      repaired: false,
      message:
        "AI determined that no repair is required.",
      plan
    };
  }

  validateRepairPlan(
    plan,
    worker.content
  );

  if(await hasOpenRepairPR(env)){
    return {ok:true,repaired:false,message:"An AI repair pull request is already open."};
  }

  const branchName =
    safeBranchName();

  await createBranch(
    env,
    branchName
  );

  const updatedFiles = [];

  for (const change of plan.changes) {
    await updateFile(
      env,
      change.path,
      change.content,
      `AI repair: ${change.path}`,
      branchName
    );

    updatedFiles.push(
      change.path
    );
  }

  const pullRequest =
    await createPullRequest(
      env,
      branchName,
      "NowPulse AI safe repair",
      [
        "Automated safe repair generated by NowPulse AI Manager.",
        "",
        `Manager version: ${VERSION}`,
        "",
        "Diagnosis:",
        text(plan.diagnosis),
        "",
        "Validation:",
        ...(Array.isArray(plan.validation)
          ? plan.validation.map(
              item => `- ${item}`
            )
          : []),
        "",
        "Changed files:",
        ...updatedFiles.map(
          file => `- ${file}`
        )
      ].join("\n")
    );

  return {
    ok: true,
    repaired: true,
    branch: branchName,
    pullRequest: {
      number: pullRequest.number,
      url: pullRequest.html_url,
      state: pullRequest.state
    },
    diagnosis: plan.diagnosis,
    changedFiles: updatedFiles
  };
}

async function githubTest(env) {
  const tokenPresent =
    Boolean(env.GITHUB_TOKEN);

  if (!tokenPresent) {
    return {
      ok: false,
      tokenPresent: false,
      error:
        "GITHUB_TOKEN secret is missing."
    };
  }

  const userResponse =
    await fetch(
      "https://api.github.com/user",
      {
        headers:
          githubHeaders(env)
      }
    );

  const userBody =
    await userResponse.text();

  let userData;

  try {
    userData =
      JSON.parse(userBody);
  } catch {
    userData = {};
  }

  const repository =
    await githubRaw(
      env,
      ""
    );

  const branch =
    await githubRaw(
      env,
      `/branches/${DEFAULT_BRANCH}`
    );

  return {
    ok:
      userResponse.ok &&
      repository.ok &&
      branch.ok,

    tokenPresent: true,

    githubUser: {
      ok: userResponse.ok,
      status: userResponse.status,
      login:
        userData?.login || null,
      type:
        userData?.type || null,
      message:
        userData?.message || null,
      documentation:
        userData?.documentation_url || ""
    },

    repository: {
      ok: repository.ok,
      status: repository.status,
      fullName:
        repository.data?.full_name || null,
      private:
        repository.data?.private ?? null,
      permissions:
        repository.data?.permissions || null,
      message:
        repository.data?.message ||
        repository.error ||
        null,
      documentation:
        repository.data?.documentation_url || ""
    },

    branch: {
      ok: branch.ok,
      status: branch.status,
      name:
        branch.data?.name || null,
      protected:
        branch.data?.protected ?? null,
      message:
        branch.data?.message ||
        branch.error ||
        null,
      documentation:
        branch.data?.documentation_url || ""
    },

    timestamp:
      new Date().toISOString()
  };
}

async function health(env) {
  return {
    ok: true,
    service:
      "NowPulse AI Manager",
    version: VERSION,
    mode:
      env.NOWPULSE_AI_REPAIR_MODE ||
      "safe",
    ai:
      Boolean(env.AI),
    repository: REPOSITORY,
    branch: DEFAULT_BRANCH,
    workerFile: WORKER_FILE,
    timestamp:
      new Date().toISOString()
  };
}

async function handleRepair(env) {
  try {
    const result =
      await runRepair(env);

    return json(
      result,
      result.ok ? 200 : 500
    );
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          text(error?.message || error),
        version: VERSION,
        timestamp:
          new Date().toISOString()
      },
      500
    );
  }
}

async function handleInspect(env) {
  try {
    const result =
      await inspectProject(env);

    return json(
      result,
      result.ok ? 200 : 500
    );
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          text(error?.message || error),
        version: VERSION,
        timestamp:
          new Date().toISOString()
      },
      500
    );
  }
}

export default {
  async fetch(request, env) {
    const url =
      new URL(request.url);

    const pathname =
      url.pathname.replace(
        /\/+$/,
        ""
      ) || "/";

    if (
      request.method !== "GET" &&
      request.method !== "POST"
    ) {
      return json(
        {
          ok: false,
          error:
            "Method not allowed."
        },
        405
      );
    }

    if (pathname === "/") {
      return json({
        ok: true,
        service:
          "NowPulse AI Manager",
        version: VERSION,
        repository: REPOSITORY,
        endpoints: [
          "/health",
          "/github-test",
          "/inspect",
          "/repair"
        ]
      });
    }

    if (pathname === "/health") {
      return json(
        await health(env)
      );
    }

    if (pathname === "/github-test") {
      if (!isAuthorized(request, env)) return json({ok:false,error:"Unauthorized."},401);
      try {
        return json(
          await githubTest(env)
        );
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              text(error?.message || error),
            version: VERSION
          },
          500
        );
      }
    }

    if (pathname === "/inspect") {
      if (!isAuthorized(request, env)) return json({ok:false,error:"Unauthorized."},401);
      return handleInspect(env);
    }

    if (pathname === "/repair") {
      if (!isAuthorized(request, env)) return json({ok:false,error:"Unauthorized."},401);
      if (
        env.NOWPULSE_AI_REPAIR_MODE ===
        "disabled"
      ) {
        return json(
          {
            ok: false,
            error:
              "AI repair is disabled."
          },
          403
        );
      }

      return handleRepair(env);
    }

    return json(
      {
        ok: false,
        error: "Not found."
      },
      404
    );
  },

  async scheduled(event, env, ctx) {
    const mode = env.NOWPULSE_AI_REPAIR_MODE || "safe";

    try {
      if (mode === "auto") {
        await runRepair(env);
        return;
      }

      if (mode === "safe") {
        await inspectProject(env);
      }
    } catch (error) {
      console.error("Scheduled AI maintenance failed", error?.stack || error);
    }
  }
};
