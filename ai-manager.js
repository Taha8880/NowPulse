const VERSION = "7.0.0";

const REPOSITORY = "Taha8880/NowPulse";
const DEFAULT_BRANCH = "main";
const WORKER_FILE = "src/worker.js";
const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const ALLOWED_REPAIR_FILES = new Set([
  "src/worker.js",
  "ai-manager.js",
  "wrangler.jsonc",
  "wrangler.toml",
  ".github/workflows/deploy.yml",
  ".github/workflows/deploy-ai-manager.yml",
  ".github/workflows/self-heal.yml",
  "README.md"
]);

const REQUIRED_FEATURES = [
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
  ["RTL/LTR", /RTL|LTR/i],
  ["Created by Taha", /Created\s+by\s+Taha/i]
];

const PROJECT_RULES = `
You are the maintenance AI for the NowPulse project.

Repository:
Taha8880/NowPulse

Main Worker:
src/worker.js

AI Manager:
ai-manager.js

Runtime:
Cloudflare Workers

Required bindings:
AI
NOWPULSE_KV

Required deployment:
GitHub Actions

Core requirements that must never be removed:

1. News must be visible without user interests.
2. Arabic and English must work.
3. RTL and LTR must work correctly.
4. Desktop, tablet and mobile must have appropriate layouts.
5. Search must search for arbitrary people/topics.
6. Search must support Arabic and English.
7. Articles must be readable inside NowPulse.
8. Articles must be original AI-written synthesis from multiple sources.
9. Images must load independently from article rendering.
10. Image fallback must exist.
11. Weather must exist.
12. Gold and currency/market data must exist.
13. Sitemap must exist.
14. robots.txt must exist.
15. RSS must exist.
16. Trends must exist.
17. SEO must exist.
18. Created by Taha must remain in the footer.
19. The site must not redirect readers to external websites merely to read an article.
20. The Worker must remain Cloudflare Worker compatible.
21. Browser APIs such as window, document and localStorage are allowed ONLY inside client-side code strings such as CLIENT.
22. Browser APIs must not be executed by Worker server code.
23. No Node.js-only runtime APIs may be introduced into Worker code.
24. No secrets may be hard-coded.
25. Existing working features must not be deleted during repair.
26. Repairs must be minimal and justified.
27. Never replace a whole project with a reduced demo.
28. Never remove KV or Workers AI bindings.
29. Never expose GITHUB_TOKEN or other secrets.
30. Never modify unrelated repositories.
31. Do not make political editorial decisions. News aggregation must remain factual and neutral.
`;

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
  const s = text(value);
  return s.length > max ? s.slice(0, max) + "\n/* truncated */" : s;
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
    "Content-Type": "application/json"
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
    data = JSON.parse(body);
  } catch {
    data = { raw: body };
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `GitHub API error ${response.status}`;

    throw new Error(message);
  }

  return data;
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

async function getFile(env, path, branch = DEFAULT_BRANCH) {
  const data = await github(
    env,
    `/contents/${path}?ref=${encodeURIComponent(branch)}`
  );

  if (!data || !data.content) {
    throw new Error(`GitHub file content unavailable: ${path}`);
  }

  const decoded = atob(
    data.content.replace(/\n/g, "")
  );

  return {
    path,
    sha: data.sha,
    content: decoded
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

      if (c === "'" || c === '"' || c === "`") {
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

function scanDelimiters(source) {
  const code = maskCode(source);
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

  let line = 1;
  let column = 0;

  for (let i = 0; i < code.length; i++) {
    const c = code[i];

    if (c === "\n") {
      line++;
      column = 0;
      continue;
    }

    column++;

    if (pairs[c]) {
      stack.push({
        open: c,
        line,
        column
      });
      continue;
    }

    if (closing.has(c)) {
      if (!stack.length) {
        return {
          ok: false,
          message: `Unexpected closing ${c} at line ${line}, column ${column}.`
        };
      }

      const last = stack.pop();
      const expected = pairs[last.open];

      if (expected !== c) {
        return {
          ok: false,
          message:
            `Mismatched delimiter at line ${line}, column ${column}. ` +
            `Expected ${expected} for ${last.open} opened at line ${last.line}.`
        };
      }
    }
  }

  if (stack.length) {
    const last = stack[stack.length - 1];

    return {
      ok: false,
      message:
        `Unclosed delimiter ${last.open} opened at ` +
        `line ${last.line}, column ${last.column}.`
    };
  }

  return {
    ok: true,
    message: "Delimiter structure is balanced."
  };
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
  return /\b(?:const|let|var)\s+CLIENT\s*=\s*`/.test(source);
}

function detectForbiddenServerApis(source) {
  const code = maskCode(source);

  const forbidden = [];

  const checks = [
    [/\bprocess\.env\b/, "process.env"],
    [/\brequire\s*\(/, "require()"],
    [/\b__dirname\b/, "__dirname"],
    [/\b__filename\b/, "__filename"],
    [/\bfs\./, "fs API"],
    [/\bchild_process\b/, "child_process"]
  ];

  for (const [pattern, name] of checks) {
    if (pattern.test(code)) {
      forbidden.push(name);
    }
  }

  return forbidden;
}

function featureChecks(source) {
  return REQUIRED_FEATURES.map(([name, pattern]) => ({
    name,
    present: pattern.test(source)
  }));
}

function architectureInspection(source) {
  const problems = [];
  const warnings = [];

  const delimiters = scanDelimiters(source);

  if (!delimiters.ok) {
    problems.push(delimiters.message);
  }

  const browserApis = detectWorkerBrowserApis(source);

  if (browserApis.length && !hasClientTemplate(source)) {
    problems.push(
      `Browser APIs detected outside a CLIENT template: ${browserApis.join(", ")}`
    );
  }

  if (hasClientTemplate(source)) {
    warnings.push(
      "Client-side browser code exists inside a CLIENT template string; this is allowed."
    );
  }

  const forbidden = detectForbiddenServerApis(source);

  if (forbidden.length) {
    problems.push(
      `Node-only APIs detected in Worker code: ${forbidden.join(", ")}`
    );
  }

  const features = featureChecks(source);

  for (const item of features) {
    if (!item.present) {
      problems.push(`Required feature missing: ${item.name}`);
    }
  }

  return {
    ok: problems.length === 0,
    problems,
    warnings,
    featureChecks: features,
    sourceLength: source.length
  };
}

async function inspectProject(env) {
  const repository = await getRepository(env);
  const branch = await getBranch(env, DEFAULT_BRANCH);
  const tree = await getTree(env, DEFAULT_BRANCH);

  const worker = await getFile(
    env,
    WORKER_FILE,
    DEFAULT_BRANCH
  );

  const manager = await getFile(
    env,
    "ai-manager.js",
    DEFAULT_BRANCH
  );

  const config = await getFile(
    env,
    "wrangler.jsonc",
    DEFAULT_BRANCH
  );

  const workerArchitecture =
    architectureInspection(worker.content);

  const managerDelimiter =
    scanDelimiters(manager.content);

  const managerProblems = [];

  if (!managerDelimiter.ok) {
    managerProblems.push(managerDelimiter.message);
  }

  const configProblems = [];

  if (!/"name"\s*:\s*"nowpulse"/.test(config.content)) {
    configProblems.push(
      "wrangler.jsonc does not appear to target the nowpulse Worker."
    );
  }

  if (!/"main"\s*:\s*"src\/worker\.js"/.test(config.content)) {
    configProblems.push(
      "wrangler.jsonc main should be src/worker.js."
    );
  }

  if (!/"binding"\s*:\s*"AI"/.test(config.content)) {
    configProblems.push(
      "Workers AI binding AI was not found."
    );
  }

  if (!/"binding"\s*:\s*"NOWPULSE_KV"/.test(config.content)) {
    configProblems.push(
      "KV binding NOWPULSE_KV was not found."
    );
  }

  const requiredFiles = [
    ".github/workflows/deploy.yml",
    ".github/workflows/deploy-ai-manager.yml",
    "src/worker.js",
    "wrangler.jsonc",
    "ai-manager.js",
    "ai-manager.wrangler.jsonc"
  ];

  const treePaths = new Set(
    (tree.tree || []).map(item => item.path)
  );

  const missingFiles = requiredFiles.filter(
    file => !treePaths.has(file)
  );

  const deploymentProblems = [];

  if (missingFiles.length) {
    deploymentProblems.push(
      `Required files missing: ${missingFiles.join(", ")}`
    );
  }

  const files = (tree.tree || [])
    .filter(item => item.type === "blob")
    .map(item => item.path)
    .filter(path =>
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
      configProblems.length === 0 &&
      deploymentProblems.length === 0,

    repository: repository.full_name,
    branch: branch.name,
    repositoryPrivate: repository.private,
    defaultBranch: repository.default_branch,

    architecture: workerArchitecture,

    manager: {
      ok: managerProblems.length === 0,
      problems: managerProblems
    },

    configuration: {
      ok: configProblems.length === 0,
      problems: configProblems
    },

    deployment: {
      ok: deploymentProblems.length === 0,
      problems: deploymentProblems
    },

    files
  };
}

function protectedFeatures(source) {
  const checks = [
    "search",
    "weather",
    "market",
    "gold",
    "currency",
    "sitemap",
    "robots",
    "rss",
    "article",
    "trend",
    "image",
    "Created by Taha"
  ];

  const result = {};

  for (const name of checks) {
    result[name] = new RegExp(
      name === "Created by Taha"
        ? "Created\\s+by\\s+Taha"
        : name,
      "i"
    ).test(source);
  }

  return result;
}

function compareProtectedFeatures(before, after) {
  const oldFeatures = protectedFeatures(before);
  const newFeatures = protectedFeatures(after);

  const removed = [];

  for (const key of Object.keys(oldFeatures)) {
    if (oldFeatures[key] && !newFeatures[key]) {
      removed.push(key);
    }
  }

  return removed;
}

function cleanAIJson(value) {
  let s = text(value).trim();

  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?/i, "");
    s = s.replace(/```$/i, "");
  }

  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");

  if (first >= 0 && last > first) {
    s = s.slice(first, last + 1);
  }

  return s.trim();
}

async function askAI(env, inspection, workerSource) {
  if (!env.AI) {
    throw new Error("Workers AI binding AI is missing.");
  }

  const prompt = `
${PROJECT_RULES}

Current inspection:
${JSON.stringify(inspection, null, 2)}

You must decide whether a repair is actually necessary.

If repair is NOT necessary:
return exactly:
{
  "repairRequired": false,
  "diagnosis": "...",
  "changes": [],
  "validation": ["..."]
}

If repair IS necessary:
return:
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
- Preserve all existing features.
- Do not invent credentials.
- Do not invent APIs or bindings.
- Do not remove CLIENT browser code merely because it contains browser APIs.
- Do not repair based only on the generic word "browser".
- If a syntax problem is uncertain, do not rewrite the entire Worker.
- Prefer the smallest safe complete-file change.
- The Worker must remain Cloudflare Worker compatible.

Current worker source:
${truncate(workerSource, 70000)}
`;

  const result = await env.AI.run(
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
    throw new Error("Workers AI returned an empty response.");
  }

  try {
    return JSON.parse(cleanAIJson(raw));
  } catch {
    throw new Error(
      "Workers AI returned invalid JSON."
    );
  }
}

function validateRepairPlan(plan, beforeWorker) {
  if (!plan || typeof plan !== "object") {
    throw new Error("Invalid AI repair plan.");
  }

  if (!Array.isArray(plan.changes)) {
    throw new Error("AI repair plan has no changes array.");
  }

  for (const change of plan.changes) {
    if (!change || typeof change !== "object") {
      throw new Error("Invalid repair change.");
    }

    if (!ALLOWED_REPAIR_FILES.has(change.path)) {
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
      change.content.includes("GITHUB_TOKEN") &&
      /GITHUB_TOKEN\s*[:=]\s*["'`][^"'`]+/.test(change.content)
    ) {
      throw new Error(
        `Possible hard-coded secret in ${change.path}.`
      );
    }
  }

  const workerChange = plan.changes.find(
    item => item.path === WORKER_FILE
  );

  if (workerChange) {
    const removed = compareProtectedFeatures(
      beforeWorker,
      workerChange.content
    );

    if (removed.length) {
      throw new Error(
        `Repair would remove protected features: ${removed.join(", ")}`
      );
    }

    const architecture =
      architectureInspection(workerChange.content);

    if (!architecture.ok) {
      throw new Error(
        `Proposed Worker failed validation: ${architecture.problems.join(" | ")}`
      );
    }
  }

  return true;
}

async function createBranch(env, branchName) {
  const main = await getBranch(
    env,
    DEFAULT_BRANCH
  );

  return github(
    env,
    "/git/refs",
    {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: main.commit.sha
      })
    }
  );
}

async function updateFile(
  env,
  path,
  content,
  branch,
  message
) {
  let existing = null;

  try {
    existing = await getFile(
      env,
      path,
      branch
    );
  } catch {
    existing = null;
  }

  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch
  };

  if (existing?.sha) {
    body.sha = existing.sha;
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

async function prepareRepair(env) {
  const inspection =
    await inspectProject(env);

  if (inspection.ok) {
    return {
      ok: true,
      repairRequired: false,
      message: "Project is healthy; no repair required.",
      inspection
    };
  }

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
      repairRequired: false,
      message: "AI determined that no safe repair is required.",
      diagnosis: plan.diagnosis || "",
      validation: plan.validation || [],
      inspection
    };
  }

  validateRepairPlan(
    plan,
    worker.content
  );

  const branchName =
    `ai-repair/${Date.now()}`;

  await createBranch(
    env,
    branchName
  );

  for (const change of plan.changes) {
    await updateFile(
      env,
      change.path,
      change.content,
      branchName,
      `AI repair: ${change.path}`
    );
  }

  const pullRequest =
    await createPullRequest(
      env,
      branchName,
      `NowPulse AI repair ${new Date().toISOString()}`,
      [
        "Automated NowPulse AI repair.",
        "",
        `Diagnosis: ${plan.diagnosis || "Not provided"}`,
        "",
        "Validation:",
        ...(plan.validation || []).map(
          item => `- ${item}`
        ),
        "",
        "This repair must pass GitHub Actions validation before deployment."
      ].join("\n")
    );

  return {
    ok: true,
    repairRequired: true,
    branch: branchName,
    pullRequest: {
      number: pullRequest.number,
      url: pullRequest.html_url,
      state: pullRequest.state
    },
    diagnosis: plan.diagnosis || "",
    validation: plan.validation || [],
    notes: plan.notes || [],
    inspection
  };
}

function health(env) {
  return {
    ok: true,
    service: "NowPulse AI Manager",
    version: VERSION,
    mode: env.NOWPULSE_AI_REPAIR_MODE || "safe",
    ai: Boolean(env.AI),
    github: Boolean(env.GITHUB_TOKEN),
    repository: env.NOWPULSE_GITHUB_REPO || REPOSITORY,
    branch: env.NOWPULSE_GITHUB_BRANCH || DEFAULT_BRANCH,
    workerFile: env.NOWPULSE_WORKER_FILE || WORKER_FILE,
    timestamp: new Date().toISOString()
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/") {
        return json({
          ok: true,
          service: "NowPulse AI Manager",
          version: VERSION,
          endpoints: [
            "/health",
            "/inspect",
            "/repair"
          ]
        });
      }

      if (url.pathname === "/health") {
        return json(health(env));
      }

      if (url.pathname === "/inspect") {
        const result =
          await inspectProject(env);

        return json(
          result,
          result.ok ? 200 : 409
        );
      }

      if (url.pathname === "/repair") {
        if (
          request.method !== "POST" &&
          request.method !== "GET"
        ) {
          return json(
            {
              ok: false,
              error: "Use POST or GET."
            },
            405
          );
        }

        const result =
          await prepareRepair(env);

        return json(result);
      }

      return json(
        {
          ok: false,
          error: "Not found."
        },
        404
      );
    } catch (error) {
      return json(
        {
          ok: false,
          error:
            error?.message ||
            String(error),
          service: "NowPulse AI Manager",
          version: VERSION
        },
        500
      );
    }
  },

  async scheduled(event, env, ctx) {
    if (
      (env.NOWPULSE_AI_REPAIR_MODE || "safe") !==
      "safe"
    ) {
      return;
    }

    ctx.waitUntil(
      (async () => {
        try {
          const inspection =
            await inspectProject(env);

          if (!inspection.ok) {
            await prepareRepair(env);
          }
        } catch {
          // Scheduled self-healing must never
          // break the Worker or affect visitors.
        }
      })()
    );
  }
};
