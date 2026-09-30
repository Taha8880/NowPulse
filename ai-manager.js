const VERSION = "6.0.0";

const REPOSITORY = "Taha8880/NowPulse";
const DEFAULT_BRANCH = "main";
const WORKER_FILE = "src/worker.js";

const GITHUB_API = "https://api.github.com";
const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const MAX_FILE_BYTES = 180000;
const MAX_PROMPT_CHARS = 180000;

const ALLOWED_REPAIR_FILES = new Set([
  "src/worker.js",
  "ai-manager.js",
  "wrangler.jsonc",
  "wrangler.toml",
  ".github/workflows/deploy.yml",
  ".github/workflows/self-heal.yml",
  "README.md"
]);

const PROJECT_SPEC = {
  name: "NowPulse",
  purpose:
    "A fast general news and information platform serving Arabic and English users.",
  runtime: "Cloudflare Workers ES Modules",
  repository: REPOSITORY,
  branch: DEFAULT_BRANCH,
  mainFile: WORKER_FILE,

  bindings: {
    workerAI: "AI",
    kv: "NOWPULSE_KV"
  },

  deployment: {
    platform: "Cloudflare Workers",
    deploymentPath: "GitHub Actions",
    avoidWorkerBuildRacing: true,
    validateBeforeDeploy: true,
    rollbackOnFailedHealthCheck: true
  },

  scheduled: {
    enabled: true,
    cron: "*/5 * * * *"
  },

  coreRequirements: [
    "News must be visible to visitors without requiring interests.",
    "Interests may enhance personalization but must never be required.",
    "Latest news must remain available instead of disappearing when newer stories arrive.",
    "News ingestion must support gradual continuous updates.",
    "Old or stale articles must not dominate the Latest News section.",
    "Very old feed items must be filtered or archived instead of appearing as current news.",
    "Search must fetch relevant news about arbitrary people, topics, events and keywords.",
    "Search must work in Arabic and English.",
    "Search must not depend only on already loaded site articles.",
    "AI-written articles must be based on multiple sources when available.",
    "AI must compare names, dates, numbers and facts across sources.",
    "AI must not invent unsupported facts.",
    "Conflicting information must not be silently invented or resolved.",
    "Articles must be readable inside NowPulse.",
    "Users should not be forced to leave NowPulse to read the article.",
    "Article pages must contain a real article, not a one-line summary.",
    "Article images must be consistent between cards and article pages.",
    "RSS images must be extracted when available.",
    "Article pages should support og:image, Twitter image and JSON-LD image extraction.",
    "Relevant image fallback should be attempted when the original source has no image.",
    "Images must never block the initial text/news rendering.",
    "Images should load independently and progressively.",
    "Hero images should be prioritized while below-fold images are lazy loaded.",
    "News HTML must appear before slow image requests.",
    "Gold and currency prices are data modules, not ordinary news articles.",
    "Price changes should update the current price instead of generating fake news.",
    "Weather must support cities/governorates instead of Cairo only.",
    "Trending/news trends must be supported.",
    "A changing quote/word component should be supported.",
    "Desktop, tablet and mobile must have intentionally different responsive layouts.",
    "The mobile experience must not simply be a scaled desktop page.",
    "Dark and light modes must work.",
    "Arabic must use RTL correctly.",
    "English must use LTR correctly.",
    "Category visuals/icons should have meaningful category-specific identities.",
    "No random decorative icons should be inserted without purpose.",
    "No raw RSS HTML or entities should appear to users.",
    "No raw markdown markers such as ## should appear in article titles.",
    "No raw HTML attributes or encoded garbage should appear in article text.",
    "Footer must contain Created by Taha.",
    "SEO metadata must exist.",
    "Canonical URLs must exist.",
    "Open Graph metadata should exist.",
    "Twitter metadata should exist.",
    "Structured data should exist where appropriate.",
    "Sitemap must exist.",
    "Robots.txt must exist.",
    "RSS output should exist.",
    "Privacy Policy, Terms, About and Contact should be supported.",
    "AdSense-ready ad placements should not block or cover content.",
    "Ads must never be allowed to break the article layout.",
    "Performance and caching must be prioritized.",
    "Worker must not execute browser APIs directly.",
    "Browser APIs are allowed only inside client-side JavaScript strings that are returned to visitors.",
    "No secrets may be committed to GitHub.",
    "No Node.js-only APIs may be used inside the Cloudflare Worker.",
    "No unsafe eval-based repair system should be used.",
    "AI repair must preserve existing core functionality.",
    "AI repair must be validated before deployment."
  ],

  protectedArchitecture: [
    "Cloudflare Worker runtime",
    "ES module default export",
    "fetch handler",
    "scheduled handler",
    "AI binding",
    "NOWPULSE_KV binding",
    "GitHub Actions deployment",
    "existing working news functionality"
  ]
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function text(data, status = 200) {
  return new Response(String(data), {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "NowPulse-AI-Manager"
  };
}

async function githubRequest(path, token, options = {}) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      ...githubHeaders(token),
      ...(options.headers || {})
    }
  });

  const raw = await response.text();

  let data;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {
      raw: raw.slice(0, 4000)
    };
  }

  if (!response.ok) {
    throw new Error(
      `GitHub API ${response.status}: ${JSON.stringify(data).slice(0, 4000)}`
    );
  }

  return data;
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
    );
  }

  return btoa(binary);
}

function base64ToUtf8(value) {
  const binary = atob(value.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
}

function randomId(prefix = "repair") {
  const stamp = Date.now().toString(36);

  let random = "";

  try {
    random = crypto.randomUUID().slice(0, 8);
  } catch {
    random = Math.random().toString(36).slice(2, 10);
  }

  return `${prefix}-${stamp}-${random}`;
}

function normalizePath(path) {
  return String(path || "")
    .replace(/^\/+/, "")
    .replace(/\\/g, "/");
}

function isAllowedRepairFile(path) {
  const normalized = normalizePath(path);

  if (ALLOWED_REPAIR_FILES.has(normalized)) {
    return true;
  }

  if (
    normalized.startsWith(".github/workflows/") &&
    normalized.endsWith(".yml")
  ) {
    return true;
  }

  if (
    normalized.startsWith(".github/workflows/") &&
    normalized.endsWith(".yaml")
  ) {
    return true;
  }

  return false;
}

function stripCommentsAndStrings(source) {
  let output = "";
  let state = "code";
  let quote = "";
  let escaped = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];

    if (state === "code") {
      if (char === "/" && next === "/") {
        output += "  ";
        state = "lineComment";
        i++;
        continue;
      }

      if (char === "/" && next === "*") {
        output += "  ";
        state = "blockComment";
        i++;
        continue;
      }

      if (char === "'" || char === '"' || char === "`") {
        quote = char;
        state = "string";
        output += " ";
        continue;
      }

      output += char;
      continue;
    }

    if (state === "lineComment") {
      if (char === "\n") {
        output += "\n";
        state = "code";
      } else {
        output += " ";
      }

      continue;
    }

    if (state === "blockComment") {
      if (char === "*" && next === "/") {
        output += "  ";
        state = "code";
        i++;
      } else if (char === "\n") {
        output += "\n";
      } else {
        output += " ";
      }

      continue;
    }

    if (state === "string") {
      if (escaped) {
        escaped = false;
        output += " ";
        continue;
      }

      if (char === "\\") {
        escaped = true;
        output += " ";
        continue;
      }

      if (char === quote) {
        state = "code";
        output += " ";
        continue;
      }

      if (char === "\n") {
        output += "\n";
      } else {
        output += " ";
      }
    }
  }

  return output;
}

function findBrowserApiViolations(source) {
  const code = stripCommentsAndStrings(source);
  const problems = [];

  const patterns = [
    {
      name: "window",
      regex: /\bwindow\s*\./
    },
    {
      name: "document",
      regex: /\bdocument\s*\./
    },
    {
      name: "localStorage",
      regex: /\blocalStorage\s*\./
    },
    {
      name: "sessionStorage",
      regex: /\bsessionStorage\s*\./
    },
    {
      name: "navigator",
      regex: /\bnavigator\s*\./
    }
  ];

  for (const item of patterns) {
    if (item.regex.test(code)) {
      problems.push(`Browser API "${item.name}" detected in executable Worker code.`);
    }
  }

  return problems;
}

function findSecurityProblems(source) {
  const problems = [];
  const code = stripCommentsAndStrings(source);

  if (/\bprocess\s*\./.test(code)) {
    problems.push("Node.js process API detected.");
  }

  if (/\brequire\s*\(/.test(code)) {
    problems.push("Node.js require() detected.");
  }

  if (/\bmodule\.exports\b/.test(code)) {
    problems.push("CommonJS module.exports detected.");
  }

  if (/\beval\s*\(/.test(code)) {
    problems.push("eval() detected.");
  }

  if (/\bnew\s+Function\s*\(/.test(code)) {
    problems.push("Dynamic Function constructor detected.");
  }

  const secretPatterns = [
    /ghp_[A-Za-z0-9]{20,}/,
    /github_pat_[A-Za-z0-9_]{20,}/,
    /sk-[A-Za-z0-9]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /Bearer\s+[A-Za-z0-9._-]{30,}/
  ];

  for (const pattern of secretPatterns) {
    if (pattern.test(source)) {
      problems.push("Possible secret/token detected in source.");
      break;
    }
  }

  return problems;
}

function braceBalance(source) {
  const code = stripCommentsAndStrings(source);

  let curly = 0;
  let square = 0;
  let round = 0;

  for (const char of code) {
    if (char === "{") curly++;
    if (char === "}") curly--;

    if (char === "[") square++;
    if (char === "]") square--;

    if (char === "(") round++;
    if (char === ")") round--;

    if (curly < 0 || square < 0 || round < 0) {
      return false;
    }
  }

  return curly === 0 && square === 0 && round === 0;
}

function hasDefaultExport(source) {
  return /\bexport\s+default\b/.test(source);
}

function hasFetchHandler(source) {
  return /\bfetch\s*\(/.test(source) || /\basync\s+fetch\s*\(/.test(source);
}

function hasScheduledHandler(source) {
  return /\bscheduled\s*\(/.test(source) || /\bscheduled\s*:/m.test(source);
}

function hasAIUsage(source) {
  return /\benv\.AI\b|\bAI\.run\b/.test(source);
}

function hasKVUsage(source) {
  return /\bNOWPULSE_KV\b|\benv\.[A-Z0-9_]*KV\b/.test(source);
}

function detectClientScriptBlock(source) {
  return /\b(?:const|let|var)\s+CLIENT\s*=\s*`/.test(source);
}

function requiredFeatureChecks(source) {
  const checks = [];

  const patterns = [
    ["search", /\bsearch/i],
    ["weather", /\bweather/i],
    ["market", /\bmarket/i],
    ["gold", /\bgold/i],
    ["currency", /\bcurrenc/i],
    ["sitemap", /\bsitemap/i],
    ["robots", /\brobots/i],
    ["rss", /\brss/i],
    ["article", /\barticle/i],
    ["trend", /\btrend/i],
    ["image", /\bimage/i],
    ["RTL/LTR", /\b(?:rtl|ltr)\b/i],
    ["Created by Taha", /Created\s+by\s+Taha/i]
  ];

  for (const [name, pattern] of patterns) {
    checks.push({
      name,
      present: pattern.test(source)
    });
  }

  return checks;
}

async function getRepository(token) {
  return githubRequest(`/repos/${REPOSITORY}`, token);
}

async function getBranch(token, branch = DEFAULT_BRANCH) {
  return githubRequest(
    `/repos/${REPOSITORY}/git/ref/heads/${encodeURIComponent(branch)}`,
    token
  );
}

async function getCommit(token, sha) {
  return githubRequest(
    `/repos/${REPOSITORY}/git/commits/${encodeURIComponent(sha)}`,
    token
  );
}

async function getTree(token, treeSha) {
  return githubRequest(
    `/repos/${REPOSITORY}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`,
    token
  );
}

async function getFile(token, path, ref = DEFAULT_BRANCH) {
  const normalized = normalizePath(path);

  const result = await githubRequest(
    `/repos/${REPOSITORY}/contents/${encodeURIComponent(normalized)}?ref=${encodeURIComponent(
      ref
    )}`,
    token
  );

  if (Array.isArray(result)) {
    throw new Error(`Path is a directory: ${normalized}`);
  }

  if (!result.content) {
    return {
      path: normalized,
      exists: false,
      sha: result.sha || null,
      content: ""
    };
  }

  return {
    path: normalized,
    exists: true,
    sha: result.sha || null,
    content: base64ToUtf8(result.content)
  };
}

async function listRepositoryFiles(token, branch = DEFAULT_BRANCH) {
  const branchRef = await getBranch(token, branch);
  const commit = await getCommit(token, branchRef.object.sha);
  const tree = await getTree(token, commit.tree.sha);

  return {
    branchSha: branchRef.object.sha,
    commitSha: commit.sha,
    treeSha: commit.tree.sha,
    files: (tree.tree || [])
      .filter((item) => item.type === "blob")
      .map((item) => item.path)
      .filter(Boolean)
  };
}

async function loadProjectFiles(token, branch = DEFAULT_BRANCH) {
  const listing = await listRepositoryFiles(token, branch);

  const selected = listing.files.filter((path) => {
    if (ALLOWED_REPAIR_FILES.has(path)) return true;

    if (
      path.startsWith(".github/workflows/") &&
      (path.endsWith(".yml") || path.endsWith(".yaml"))
    ) {
      return true;
    }

    return false;
  });

  const results = [];

  for (const path of selected) {
    try {
      const file = await getFile(token, path, branch);

      if (file.content.length <= MAX_FILE_BYTES) {
        results.push(file);
      } else {
        results.push({
          ...file,
          content: file.content.slice(0, MAX_FILE_BYTES),
          truncated: true
        });
      }
    } catch (error) {
      results.push({
        path,
        exists: false,
        error: error.message
      });
    }
  }

  return {
    listing,
    files: results
  };
}

function inspectWorkerSource(source) {
  const problems = [];
  const warnings = [];

  if (!source || source.length < 1000) {
    problems.push("Worker source is missing or suspiciously small.");
  }

  if (!hasDefaultExport(source)) {
    problems.push("Worker has no export default.");
  }

  if (!hasFetchHandler(source)) {
    problems.push("Worker fetch handler is missing.");
  }

  if (!hasScheduledHandler(source)) {
    problems.push("Worker scheduled handler is missing.");
  }

  if (!hasAIUsage(source)) {
    warnings.push("Workers AI usage was not detected.");
  }

  if (!hasKVUsage(source)) {
    warnings.push("NOWPULSE_KV usage was not detected.");
  }

  if (!braceBalance(source)) {
    problems.push("Worker source has unbalanced braces, brackets or parentheses.");
  }

  problems.push(...findBrowserApiViolations(source));
  problems.push(...findSecurityProblems(source));

  const clientBlock = detectClientScriptBlock(source);

  if (
    clientBlock &&
    (/\bwindow\b/.test(source) || /\blocalStorage\b/.test(source))
  ) {
    warnings.push(
      "Client-side browser code exists inside a CLIENT template string; this is allowed."
    );
  }

  const featureChecks = requiredFeatureChecks(source);

  const missingFeatures = featureChecks
    .filter((item) => !item.present)
    .map((item) => item.name);

  if (missingFeatures.length) {
    warnings.push(
      `Feature markers not detected: ${missingFeatures.join(", ")}`
    );
  }

  return {
    ok: problems.length === 0,
    problems,
    warnings,
    featureChecks,
    sourceLength: source.length
  };
}

async function inspectProject(token) {
  const repo = await getRepository(token);
  const project = await loadProjectFiles(token, DEFAULT_BRANCH);

  const workerFile = project.files.find(
    (file) => file.path === WORKER_FILE
  );

  const managerFile = project.files.find(
    (file) => file.path === "ai-manager.js"
  );

  const wranglerFile = project.files.find(
    (file) => file.path === "wrangler.jsonc"
  );

  const workflowFiles = project.files.filter((file) =>
    file.path.startsWith(".github/workflows/")
  );

  const architecture = workerFile
    ? inspectWorkerSource(workerFile.content)
    : {
        ok: false,
        problems: ["src/worker.js is missing."],
        warnings: [],
        featureChecks: [],
        sourceLength: 0
      };

  const managerProblems = [];

  if (!managerFile) {
    managerProblems.push("ai-manager.js is missing from repository.");
  } else {
    if (!hasDefaultExport(managerFile.content)) {
      managerProblems.push("ai-manager.js has no export default.");
    }

    if (!braceBalance(managerFile.content)) {
      managerProblems.push(
        "ai-manager.js has unbalanced braces, brackets or parentheses."
      );
    }

    managerProblems.push(...findSecurityProblems(managerFile.content));
  }

  const configurationProblems = [];

  if (!wranglerFile) {
    configurationProblems.push("wrangler.jsonc is missing.");
  } else {
    if (!/"AI"/.test(wranglerFile.content)) {
      configurationProblems.push("AI binding was not detected in wrangler.jsonc.");
    }

    if (!/NOWPULSE_KV/.test(wranglerFile.content)) {
      configurationProblems.push(
        "NOWPULSE_KV binding was not detected in wrangler.jsonc."
      );
    }

    if (!/src\/worker\.js/.test(wranglerFile.content)) {
      configurationProblems.push(
        "src/worker.js is not configured as the Worker main file."
      );
    }

    if (!/cron|crons/i.test(wranglerFile.content)) {
      configurationProblems.push(
        "Cron configuration was not detected in wrangler.jsonc."
      );
    }
  }

  const deploymentWorkflow = workflowFiles.find((file) =>
    file.path.endsWith("deploy.yml")
  );

  const workflowProblems = [];

  if (!deploymentWorkflow) {
    workflowProblems.push(
      ".github/workflows/deploy.yml is missing."
    );
  } else {
    if (!/wrangler\s+deploy/i.test(deploymentWorkflow.content)) {
      workflowProblems.push(
        "Deploy workflow does not contain wrangler deploy."
      );
    }

    if (!/node\s+--check\s+src\/worker\.js/i.test(deploymentWorkflow.content)) {
      workflowProblems.push(
        "Deploy workflow does not syntax-check src/worker.js."
      );
    }
  }

  const allProblems = [
    ...architecture.problems,
    ...managerProblems,
    ...configurationProblems,
    ...workflowProblems
  ];

  return {
    ok: allProblems.length === 0,
    repository: REPOSITORY,
    branch: DEFAULT_BRANCH,
    repositoryPrivate: Boolean(repo.private),
    defaultBranch: repo.default_branch,
    architecture,
    manager: {
      ok: managerProblems.length === 0,
      problems: managerProblems
    },
    configuration: {
      ok: configurationProblems.length === 0,
      problems: configurationProblems
    },
    deployment: {
      ok: workflowProblems.length === 0,
      problems: workflowProblems
    },
    files: project.listing.files,
    inspectedFiles: project.files.map((file) => ({
      path: file.path,
      exists: file.exists,
      truncated: Boolean(file.truncated),
      size: file.content ? file.content.length : 0
    })),
    generatedAt: new Date().toISOString()
  };
}

function extractJsonObject(value) {
  if (value && typeof value === "object") {
    return value;
  }

  const source = String(value || "").trim();

  const fenced = source.match(
    /```(?:json)?\s*([\s\S]*?)\s*```/i
  );

  const candidate = fenced ? fenced[1].trim() : source;

  try {
    return JSON.parse(candidate);
  } catch {}

  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");

  if (first >= 0 && last > first) {
    try {
      return JSON.parse(candidate.slice(first, last + 1));
    } catch {}
  }

  throw new Error("AI did not return valid JSON.");
}

async function askAI(env, payload) {
  if (!env.AI || typeof env.AI.run !== "function") {
    throw new Error("Workers AI binding AI is unavailable.");
  }

  const system = `
You are the senior autonomous engineering manager for the NowPulse project.

You are responsible for understanding the complete project specification,
finding missing or broken functionality, and preparing safe repository repairs.

You are NOT allowed to invent facts about the website's runtime state.
Use the repository files and inspection report as evidence.

Important architecture rules:

1. The main application is a Cloudflare Worker.
2. The Worker runs server-side.
3. Browser APIs such as window, document and localStorage are allowed only
   when they are inside a client-side JavaScript string returned as HTML.
4. Do not remove legitimate CLIENT browser code merely because it contains
   window or localStorage.
5. Do not use Node.js-only APIs in the Worker.
6. Do not expose or create secrets.
7. Do not use eval or dynamic code execution.
8. Preserve export default, fetch, scheduled, AI and KV functionality.
9. Never replace real news with invented content.
10. Never invent images.
11. Do not remove existing working features just to simplify the code.
12. Keep the site fast.
13. HTML/news must not wait for slow images or AI.
14. Search must be able to find arbitrary people/topics, not only cached site items.
15. Articles must be complete readable articles based on verified source information.
16. Prices are data modules, not fake news.
17. Arabic and English must both work correctly.
18. RTL/LTR must be correct.
19. Mobile, tablet and desktop need intentionally different responsive layouts.
20. No random icons, random symbols or raw RSS/HTML garbage.
21. Preserve "Created by Taha".
22. Preserve SEO, sitemap and robots functionality.
23. Repairs must be minimal, coherent and production-oriented.

Return ONLY a JSON object.

Required JSON structure:

{
  "diagnosis": ["..."],
  "repairRequired": true,
  "changes": [
    {
      "path": "src/worker.js",
      "action": "update",
      "reason": "...",
      "content": "complete file content"
    }
  ],
  "validation": [
    "..."
  ],
  "notes": ["..."]
}

Rules for changes:

- Only modify files that are actually necessary.
- Every update must contain the COMPLETE file content.
- Never return partial patches.
- Never return markdown inside content.
- Never include secrets.
- Never change unrelated files.
- Do not create arbitrary files.
- Allowed files are explicitly listed in the prompt.
- If no repair is necessary, return repairRequired=false and changes=[].
`;

  const user = JSON.stringify(payload);

  if (user.length > MAX_PROMPT_CHARS) {
    throw new Error(
      `AI prompt is too large: ${user.length} characters.`
    );
  }

  const result = await env.AI.run(AI_MODEL, {
    messages: [
      {
        role: "system",
        content: system
      },
      {
        role: "user",
        content: user
      }
    ],
    temperature: 0.1,
    max_tokens: 24000
  });

  const output =
    result?.response ??
    result?.result?.response ??
    result?.text ??
    result;

  return extractJsonObject(output);
}

function validateAIPlan(plan) {
  const errors = [];

  if (!plan || typeof plan !== "object") {
    return ["AI plan is not an object."];
  }

  if (!Array.isArray(plan.changes)) {
    errors.push("AI plan changes must be an array.");
  }

  if (plan.changes && plan.changes.length > 12) {
    errors.push("AI attempted to modify too many files.");
  }

  for (const change of plan.changes || []) {
    const path = normalizePath(change?.path);

    if (!path) {
      errors.push("A repair change has no path.");
      continue;
    }

    if (!isAllowedRepairFile(path)) {
      errors.push(`File is not allowed for AI repair: ${path}`);
    }

    if (change.action !== "update") {
      errors.push(`Unsupported repair action for ${path}.`);
    }

    if (
      typeof change.content !== "string" ||
      change.content.trim().length < 20
    ) {
      errors.push(`Missing complete content for ${path}.`);
    }

    if (
      typeof change.content === "string" &&
      /ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/.test(
        change.content
      )
    ) {
      errors.push(`Possible GitHub token detected in ${path}.`);
    }
  }

  return errors;
}

function validateCandidateFile(path, content) {
  const problems = [];

  if (!isAllowedRepairFile(path)) {
    problems.push(`Unauthorized repair path: ${path}`);
    return problems;
  }

  if (!content || content.length < 20) {
    problems.push(`${path} is empty or too small.`);
    return problems;
  }

  if (content.length > MAX_FILE_BYTES * 2) {
    problems.push(`${path} is suspiciously large.`);
  }

  problems.push(...findSecurityProblems(content));

  if (path === "src/worker.js") {
    const worker = inspectWorkerSource(content);

    problems.push(...worker.problems);

    if (!hasDefaultExport(content)) {
      problems.push("src/worker.js lost export default.");
    }

    if (!hasFetchHandler(content)) {
      problems.push("src/worker.js lost fetch handler.");
    }

    if (!hasScheduledHandler(content)) {
      problems.push("src/worker.js lost scheduled handler.");
    }

    if (!hasAIUsage(content)) {
      problems.push("src/worker.js appears to have lost Workers AI.");
    }

    if (!hasKVUsage(content)) {
      problems.push("src/worker.js appears to have lost KV usage.");
    }

    if (!/Created\s+by\s+Taha/i.test(content)) {
      problems.push("src/worker.js appears to have lost Created by Taha.");
    }
  }

  if (path === "ai-manager.js") {
    if (!hasDefaultExport(content)) {
      problems.push("ai-manager.js lost export default.");
    }
  }

  return problems;
}

function compareProtectedFeatures(before, after) {
  const problems = [];

  const checks = [
    {
      name: "export default",
      test: hasDefaultExport
    },
    {
      name: "fetch handler",
      test: hasFetchHandler
    },
    {
      name: "scheduled handler",
      test: hasScheduledHandler
    },
    {
      name: "Workers AI",
      test: hasAIUsage
    },
    {
      name: "KV",
      test: hasKVUsage
    },
    {
      name: "Created by Taha",
      test: (source) => /Created\s+by\s+Taha/i.test(source)
    },
    {
      name: "search",
      test: (source) => /\bsearch/i.test(source)
    },
    {
      name: "image",
      test: (source) => /\bimage/i.test(source)
    },
    {
      name: "weather",
      test: (source) => /\bweather/i.test(source)
    },
    {
      name: "market",
      test: (source) => /\bmarket/i.test(source)
    },
    {
      name: "sitemap",
      test: (source) => /\bsitemap/i.test(source)
    },
    {
      name: "robots",
      test: (source) => /\brobots/i.test(source)
    }
  ];

  for (const check of checks) {
    if (check.test(before) && !check.test(after)) {
      problems.push(`Protected feature lost: ${check.name}`);
    }
  }

  return problems;
}

function findFileChanges(originalFiles, changes) {
  const map = new Map(
    originalFiles
      .filter((file) => file.exists)
      .map((file) => [file.path, file.content])
  );

  return changes.map((change) => {
    const path = normalizePath(change.path);
    const before = map.get(path) || "";

    return {
      ...change,
      path,
      before
    };
  });
}

async function createBranch(token, branchName, baseBranch) {
  const baseRef = await getBranch(token, baseBranch);

  await githubRequest(
    `/repos/${REPOSITORY}/git/refs`,
    token,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha
      })
    }
  );

  return baseRef.object.sha;
}

async function updateFile(
  token,
  branch,
  path,
  content,
  existingSha,
  message
) {
  const body = {
    message,
    content: utf8ToBase64(content),
    branch
  };

  if (existingSha) {
    body.sha = existingSha;
  }

  return githubRequest(
    `/repos/${REPOSITORY}/contents/${encodeURIComponent(path)}`,
    token,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );
}

async function getPullRequestForBranch(token, branch) {
  const pulls = await githubRequest(
    `/repos/${REPOSITORY}/pulls?state=open&head=${encodeURIComponent(
      `${REPOSITORY.split("/")[0]}:${branch}`
    )}&per_page=20`,
    token
  );

  return Array.isArray(pulls) ? pulls[0] || null : null;
}

async function createPullRequest(token, branch, title, body) {
  return githubRequest(
    `/repos/${REPOSITORY}/pulls`,
    token,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        title,
        head: branch,
        base: DEFAULT_BRANCH,
        body
      })
    }
  );
}

function repairSummary(plan, inspection) {
  const changes = Array.isArray(plan.changes) ? plan.changes : [];

  return [
    "## NowPulse AI Repair",
    "",
    `AI Manager version: ${VERSION}`,
    `Repository: ${REPOSITORY}`,
    "",
    "### Detected state",
    `Inspection healthy: ${inspection.ok ? "yes" : "no"}`,
    "",
    "### Diagnosis",
    ...(Array.isArray(plan.diagnosis)
      ? plan.diagnosis.map((item) => `- ${item}`)
      : ["- No diagnosis supplied."]),
    "",
    "### Changed files",
    ...(changes.length
      ? changes.map((item) => `- \`${normalizePath(item.path)}\`: ${item.reason || "AI repair"}`)
      : ["- No files changed."]),
    "",
    "### Validation",
    ...(Array.isArray(plan.validation)
      ? plan.validation.map((item) => `- ${item}`)
      : ["- GitHub Actions must validate the repair before deployment."]),
    "",
    "This repair was generated by the NowPulse AI Manager.",
    "GitHub Actions remains the final validation/deployment gate."
  ].join("\n");
}

async function prepareRepair(env, providedProblem = "") {
  const token = env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN secret is missing.");
  }

  const inspection = await inspectProject(token);
  const project = await loadProjectFiles(token, DEFAULT_BRANCH);

  const existingRepairPR = await getPullRequestForBranch(
    token,
    "nowpulse-ai-repair"
  );

  if (existingRepairPR) {
    return {
      ok: false,
      skipped: true,
      reason: "An existing NowPulse AI repair PR is already open.",
      pullRequest: {
        number: existingRepairPR.number,
        url: existingRepairPR.html_url
      }
    };
  }

  const worker = project.files.find(
    (file) => file.path === WORKER_FILE
  );

  const payload = {
    projectSpec: PROJECT_SPEC,
    userProblem: providedProblem || null,
    inspection,
    files: project.files.map((file) => ({
      path: file.path,
      exists: file.exists,
      content: file.content
    })),
    importantInstruction:
      "Determine missing or incomplete requirements from evidence. Do not blindly rewrite healthy code."
  };

  const plan = await askAI(env, payload);

  const planErrors = validateAIPlan(plan);

  if (planErrors.length) {
    return {
      ok: false,
      stage: "plan-validation",
      errors: planErrors,
      diagnosis: plan.diagnosis || []
    };
  }

  if (!plan.repairRequired || !plan.changes.length) {
    return {
      ok: true,
      repaired: false,
      inspection,
      diagnosis: plan.diagnosis || [],
      notes: plan.notes || []
    };
  }

  const preparedChanges = findFileChanges(
    project.files,
    plan.changes
  );

  const candidateProblems = [];

  for (const change of preparedChanges) {
    candidateProblems.push(
      ...validateCandidateFile(change.path, change.content).map(
        (problem) => `${change.path}: ${problem}`
      )
    );

    if (change.path === WORKER_FILE) {
      candidateProblems.push(
        ...compareProtectedFeatures(
          change.before,
          change.content
        ).map(
          (problem) => `${change.path}: ${problem}`
        )
      );

      if (
        change.before.length > 10000 &&
        change.content.length < change.before.length * 0.35
      ) {
        candidateProblems.push(
          `${change.path}: candidate source is suspiciously smaller than the existing source.`
        );
      }
    }
  }

  if (candidateProblems.length) {
    return {
      ok: false,
      stage: "candidate-validation",
      errors: candidateProblems,
      diagnosis: plan.diagnosis || []
    };
  }

  const branchName = randomId("nowpulse-ai-repair");

  await createBranch(
    token,
    branchName,
    DEFAULT_BRANCH
  );

  const shaMap = new Map(
    project.files
      .filter((file) => file.exists)
      .map((file) => [file.path, file.sha])
  );

  const commits = [];

  for (const change of preparedChanges) {
    const result = await updateFile(
      token,
      branchName,
      change.path,
      change.content,
      shaMap.get(change.path) || null,
      `AI repair: update ${change.path}`
    );

    commits.push({
      path: change.path,
      commit: result.commit?.sha || null
    });
  }

  const pullRequest = await createPullRequest(
    token,
    branchName,
    `NowPulse AI Repair: ${new Date().toISOString().slice(0, 10)}`,
    repairSummary(plan, inspection)
  );

  return {
    ok: true,
    repaired: true,
    branch: branchName,
    pullRequest: {
      number: pullRequest.number,
      url: pullRequest.html_url,
      title: pullRequest.title
    },
    changes: preparedChanges.map((change) => ({
      path: change.path,
      reason: change.reason
    })),
    commits,
    diagnosis: plan.diagnosis || [],
    validation: plan.validation || []
  };
}

async function handleHealth(env) {
  return json({
    ok: true,
    service: "NowPulse AI Manager",
    version: VERSION,
    mode: env.NOWPULSE_AI_REPAIR_MODE || "safe",
    ai: Boolean(env.AI),
    github: Boolean(env.GITHUB_TOKEN),
    repository: REPOSITORY,
    branch: DEFAULT_BRANCH,
    workerFile: WORKER_FILE,
    timestamp: new Date().toISOString()
  });
}

async function handleInspect(env) {
  if (!env.GITHUB_TOKEN) {
    return json(
      {
        ok: false,
        error: "GITHUB_TOKEN secret is missing."
      },
      500
    );
  }

  try {
    const result = await inspectProject(env.GITHUB_TOKEN);
    return json(result);
  } catch (error) {
    return json(
      {
        ok: false,
        error: error.message
      },
      500
    );
  }
}

async function handleRepair(request, env) {
  if (request.method !== "POST") {
    return json(
      {
        ok: false,
        error: "POST required."
      },
      405
    );
  }

  if (!env.GITHUB_TOKEN) {
    return json(
      {
        ok: false,
        error: "GITHUB_TOKEN secret is missing."
      },
      500
    );
  }

  try {
    let body = {};

    try {
      body = await request.json();
    } catch {}

    const problem =
      typeof body.problem === "string"
        ? body.problem.slice(0, 12000)
        : "";

    const result = await prepareRepair(
      env,
      problem
    );

    return json(result);
  } catch (error) {
    return json(
      {
        ok: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      500
    );
  }
}

async function handleRoot() {
  return json({
    ok: true,
    service: "NowPulse AI Manager",
    version: VERSION,
    purpose:
      "Autonomous project inspection, requirement validation and safe GitHub repair preparation.",
    repository: REPOSITORY,
    endpoints: {
      health: "GET /health",
      inspect: "GET /inspect",
      repair: "POST /repair"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    try {
      if (path === "/") {
        return handleRoot();
      }

      if (path === "/health") {
        return handleHealth(env);
      }

      if (path === "/inspect") {
        return handleInspect(env);
      }

      if (path === "/repair") {
        return handleRepair(request, env);
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
          error: error.message
        },
        500
      );
    }
  },

  async scheduled(controller, env, ctx) {
    /*
      Automatic supervision is intentionally separated from visitor requests.

      The scheduled trigger should be enabled in ai-manager.wrangler.jsonc
      after this file is deployed.

      The manager will inspect the repository and prepare a repair only when
      a problem is actually detected.
    */

    if (!env.GITHUB_TOKEN || !env.AI) {
      return;
    }

    ctx.waitUntil(
      (async () => {
        try {
          const inspection = await inspectProject(
            env.GITHUB_TOKEN
          );

          if (!inspection.ok) {
            await prepareRepair(
              env,
              `Automatic scheduled inspection detected project problems:\n${JSON.stringify(
                inspection,
                null,
                2
              )}`
            );
          }
        } catch (error) {
          console.error(
            "NowPulse AI Manager scheduled inspection failed:",
            error.message
          );
        }
      })()
    );
  }
};
