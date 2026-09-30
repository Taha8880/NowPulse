const VERSION = "8.0.0";

const REPOSITORY =
  "Taha8880/NowPulse";

const DEFAULT_BRANCH =
  "main";

const WORKER_FILE =
  "src/worker.js";

const AI_MODEL =
  "@cf/meta/llama-3.1-8b-instruct-fast";

const ALLOWED_REPAIR_FILES = new Set([
  "src/worker.js",
  "wrangler.jsonc",
  "ai-manager.js",
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
  ["fetch handler", /export\s+default\s*\{[\s\S]*?fetch\s*\(/],
  ["scheduled handler", /scheduled\s*\(/],
  ["Created by Taha", /Created\s+by\s+Taha/i],
  ["AI binding", /env\.AI|AI_MODEL/],
  ["KV binding", /NOWPULSE_KV/],
  ["RSS/news feeds", /rss|feed|xmlItems/i],
  ["article rendering", /articleBody|homeBody|card/i],
  ["search", /searchNews/i],
  ["sitemap", /sitemap/i]
];

const PROTECTED_FEATURES = [
  "Created by Taha",
  "NOWPULSE_KV",
  "AI_MODEL",
  "searchNews",
  "sitemap",
  "scheduled",
  "export default",
  "articleBody",
  "homeBody"
];

const PROJECT_RULES = `
You are the repair engine for the NowPulse Cloudflare Worker.

Repository:
Taha8880/NowPulse

Main Worker:
src/worker.js

Rules:

1. This is a Cloudflare Worker project.
2. Do not use Node-only server APIs in Worker code.
3. Do not use process.env.
4. Do not use require().
5. Do not use fs.
6. Do not use child_process.
7. Do not use __dirname.
8. Do not use __filename.
9. Browser APIs such as window, document and localStorage are allowed ONLY
   inside the CLIENT template/string intended for browser execution.
10. Keep the Worker compatible with Cloudflare Workers.
11. Preserve existing working functionality.
12. Never remove the "Created by Taha" footer.
13. Preserve Arabic RTL and English LTR support.
14. Preserve news, search, weather, markets, sitemap and scheduled functionality.
15. Never hard-code GitHub tokens, API keys or secrets.
16. Never modify files outside the allowed repair files.
17. Do not invent news.
18. Do not fabricate images, prices, currencies, weather or market data.
19. News should remain accessible even when external sources fail.
20. External API failure must degrade gracefully.
21. Do not make page rendering depend on slow image or AI requests.
22. Keep the public site responsive on mobile, tablet and desktop.
23. Do not introduce ?m=1 mobile routing.
24. Do not replace the entire project with a different architecture.
25. Make the smallest complete-file repair necessary.
26. Return valid JSON only.
`;

function text(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        "cache-control":
          "no-store"
      }
    }
  );
}

function truncate(value, max = 50000) {
  const s = text(value);

  if (s.length <= max) {
    return s;
  }

  return (
    s.slice(0, max) +
    "\n/* truncated */"
  );
}

function githubHeaders(env) {
  const token =
    env.GITHUB_TOKEN;

  if (!token) {
    throw new Error(
      "GITHUB_TOKEN secret is missing."
    );
  }

  return {
    Authorization:
      `Bearer ${token}`,

    Accept:
      "application/vnd.github+json",

    "X-GitHub-Api-Version":
      "2022-11-28",

    "User-Agent":
      "NowPulse-AI-Manager/8.0.0",

    "Content-Type":
      "application/json"
  };
}

async function readGitHubResponse(response) {
  const body =
    await response.text();

  let data;

  try {
    data =
      body
        ? JSON.parse(body)
        : {};
  } catch {
    data = {
      raw: body
    };
  }

  return {
    data,
    body
  };
}

async function github(
  env,
  path,
  options = {}
) {
  const response =
    await fetch(
      `https://api.github.com${path}`,
      {
        ...options,
        headers: {
          ...githubHeaders(env),
          ...(options.headers || {})
        }
      }
    );

  const {
    data,
    body
  } =
    await readGitHubResponse(
      response
    );

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      body ||
      `GitHub API error ${response.status}`;

    const acceptedPermissions =
      response.headers.get(
        "X-Accepted-GitHub-Permissions"
      ) || "";

    const oauthScopes =
      response.headers.get(
        "X-OAuth-Scopes"
      ) || "";

    const documentation =
      response.headers.get(
        "documentation_url"
      ) || "";

    const details = [
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
    ].filter(Boolean);

    throw new Error(
      details.join(" | ")
    );
  }

  return data;
}

async function githubRaw(
  env,
  path,
  options = {}
) {
  const response =
    await fetch(
      `https://api.github.com${path}`,
      {
        ...options,
        headers: {
          ...githubHeaders(env),
          ...(options.headers || {})
        }
      }
    );

  const {
    data,
    body
  } =
    await readGitHubResponse(
      response
    );

  return {
    status: response.status,
    ok: response.ok,
    data,
    body: truncate(body, 4000),
    headers: {
      acceptedPermissions:
        response.headers.get(
          "X-Accepted-GitHub-Permissions"
        ) || "",

      oauthScopes:
        response.headers.get(
          "X-OAuth-Scopes"
        ) || "",

      documentation:
        response.headers.get(
          "documentation_url"
        ) || "",

      requestId:
        response.headers.get(
          "x-github-request-id"
        ) || ""
    }
  };
}

async function getRepository(env) {
  return github(
    env,
    `/repos/${REPOSITORY}`
  );
}

async function getBranch(
  env,
  branch = DEFAULT_BRANCH
) {
  return github(
    env,
    `/repos/${REPOSITORY}/branches/${encodeURIComponent(branch)}`
  );
}

async function getTree(
  env,
  branch = DEFAULT_BRANCH
) {
  const branchData =
    await getBranch(
      env,
      branch
    );

  const sha =
    branchData?.commit?.sha;

  if (!sha) {
    throw new Error(
      `GitHub branch SHA unavailable: ${branch}`
    );
  }

  return github(
    env,
    `/repos/${REPOSITORY}/git/trees/${sha}?recursive=1`
  );
}

function base64DecodeUtf8(value) {
  const normalized =
    text(value)
      .replace(/\s/g, "");

  const binary =
    atob(normalized);

  const bytes =
    Uint8Array.from(
      binary,
      char => char.charCodeAt(0)
    );

  return new TextDecoder()
    .decode(bytes);
}

function base64EncodeUtf8(value) {
  const bytes =
    new TextEncoder()
      .encode(text(value));

  let binary = "";

  const chunkSize =
    0x8000;

  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {
    const chunk =
      bytes.subarray(
        i,
        Math.min(
          i + chunkSize,
          bytes.length
        )
      );

    binary += String.fromCharCode(
      ...chunk
    );
  }

  return btoa(binary);
}

async function getFile(
  env,
  path,
  branch = DEFAULT_BRANCH
) {
  const data =
    await github(
      env,
      `/repos/${REPOSITORY}/contents/${path}?ref=${encodeURIComponent(branch)}`
    );

  if (
    !data ||
    !data.content
  ) {
    throw new Error(
      `GitHub file content unavailable: ${path}`
    );
  }

  return {
    path,
    sha: data.sha || "",
    content:
      base64DecodeUtf8(
        data.content
      )
  };
}

function maskCode(source) {
  const s =
    text(source);

  let output = "";

  let state = "code";
  let quote = "";
  let escaped = false;

  for (
    let i = 0;
    i < s.length;
    i++
  ) {
    const c = s[i];
    const next = s[i + 1];

    if (state === "code") {
      if (
        c === "/" &&
        next === "/"
      ) {
        output += "  ";
        state = "line-comment";
        i++;
        continue;
      }

      if (
        c === "/" &&
        next === "*"
      ) {
        output += "  ";
        state = "block-comment";
        i++;
        continue;
      }

      if (
        c === "'" ||
        c === '"' ||
        c === "`"
      ) {
        quote = c;
        escaped = false;
        output += " ";
        state = "string";
        continue;
      }

      output += c;
      continue;
    }

    if (
      state === "line-comment"
    ) {
      if (c === "\n") {
        output += "\n";
        state = "code";
      } else {
        output += " ";
      }

      continue;
    }

    if (
      state === "block-comment"
    ) {
      if (
        c === "*" &&
        next === "/"
      ) {
        output += "  ";
        state = "code";
        i++;
      } else {
        output +=
          c === "\n"
            ? "\n"
            : " ";
      }

      continue;
    }

    if (
      state === "string"
    ) {
      if (escaped) {
        output +=
          c === "\n"
            ? "\n"
            : " ";

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

      output +=
        c === "\n"
          ? "\n"
          : " ";
    }
  }

  return output;
}

function scanDelimiters(source) {
  const masked =
    maskCode(source);

  const stack = [];

  const opening = {
    "(": ")",
    "[": "]",
    "{": "}"
  };

  const closing =
    new Set([
      ")",
      "]",
      "}"
    ]);

  const lineStarts = [0];

  for (
    let i = 0;
    i < masked.length;
    i++
  ) {
    if (
      masked[i] === "\n"
    ) {
      lineStarts.push(i + 1);
    }
  }

  function location(index) {
    let low = 0;
    let high =
      lineStarts.length - 1;

    while (low <= high) {
      const mid =
        Math.floor(
          (low + high) / 2
        );

      if (
        lineStarts[mid] <= index
      ) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const line =
      high + 1;

    const column =
      index -
      lineStarts[high] +
      1;

    return {
      line,
      column
    };
  }

  for (
    let i = 0;
    i < masked.length;
    i++
  ) {
    const c =
      masked[i];

    if (opening[c]) {
      stack.push({
        expected:
          opening[c],
        index: i
      });

      continue;
    }

    if (
      closing.has(c)
    ) {
      if (!stack.length) {
        const loc =
          location(i);

        return {
          ok: false,
          message:
            `Unexpected closing ${c} at line ${loc.line}, column ${loc.column}.`
        };
      }

      const last =
        stack.pop();

      if (
        last.expected !== c
      ) {
        const loc =
          location(i);

        return {
          ok: false,
          message:
            `Mismatched closing ${c} at line ${loc.line}, column ${loc.column}. Expected ${last.expected}.`
        };
      }
    }
  }

  if (stack.length) {
    const last =
      stack[stack.length - 1];

    const loc =
      location(last.index);

    return {
      ok: false,
      message:
        `Unclosed ${last.expected === ")" ? "(" : last.expected === "]" ? "[" : "{"} at line ${loc.line}, column ${loc.column}.`
    };
  }

  return {
    ok: true,
    message: "Delimiter scan passed."
  };
}

function detectWorkerBrowserApis(
  source
) {
  const matches = [];

  const checks = [
    [/\bwindow\b/, "window"],
    [/\bdocument\b/, "document"],
    [/\blocalStorage\b/, "localStorage"],
    [/\bsessionStorage\b/, "sessionStorage"],
    [/\bnavigator\b/, "navigator"]
  ];

  for (
    const [pattern, name]
    of checks
  ) {
    if (
      pattern.test(source)
    ) {
      matches.push(name);
    }
  }

  return [
    ...new Set(matches)
  ];
}

function hasClientTemplate(
  source
) {
  return /\b(?:const|let|var)\s+CLIENT\s*=\s*`/.test(
    source
  );
}

function detectForbiddenServerApis(
  source
) {
  const checks = [
    [/\bprocess\.env\b/, "process.env"],
    [/\brequire\s*\(/, "require()"],
    [/\b__dirname\b/, "__dirname"],
    [/\b__filename\b/, "__filename"],
    [/\bfs\./, "fs API"],
    [/\bchild_process\b/, "child_process"]
  ];

  const found = [];

  for (
    const [pattern, name]
    of checks
  ) {
    if (
      pattern.test(source)
    ) {
      found.push(name);
    }
  }

  return found;
}

function featureChecks(
  source
) {
  return REQUIRED_FEATURES.map(
    ([name, pattern]) => ({
      name,
      present:
        pattern.test(source)
    })
  );
}

function architectureInspection(
  source
) {
  const problems = [];
  const warnings = [];

  const delimiters =
    scanDelimiters(source);

  if (!delimiters.ok) {
    problems.push(
      delimiters.message
    );
  }

  const browserApis =
    detectWorkerBrowserApis(
      source
    );

  if (
    browserApis.length &&
    !hasClientTemplate(source)
  ) {
    problems.push(
      `Browser APIs detected in Worker server code: ${browserApis.join(", ")}`
    );
  }

  if (
    browserApis.length &&
    hasClientTemplate(source)
  ) {
    warnings.push(
      "Browser APIs exist in the Worker source and may belong to the CLIENT template."
    );
  }

  const forbidden =
    detectForbiddenServerApis(
      source
    );

  if (forbidden.length) {
    problems.push(
      `Node-only APIs detected in Worker code: ${forbidden.join(", ")}`
    );
  }

  const features =
    featureChecks(source);

  for (
    const item of features
  ) {
    if (!item.present) {
      problems.push(
        `Required feature missing: ${item.name}`
      );
    }
  }

  return {
    ok:
      problems.length === 0,

    problems,

    warnings,

    features
  };
}

async function inspectProject(
  env
) {
  const repository =
    await getRepository(env);

  const branch =
    await getBranch(
      env,
      DEFAULT_BRANCH
    );

  const tree =
    await getTree(
      env,
      DEFAULT_BRANCH
    );

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
    architectureInspection(
      worker.content
    );

  const managerScan =
    scanDelimiters(
      manager.content
    );

  const managerProblems = [];

  if (!managerScan.ok) {
    managerProblems.push(
      managerScan.message
    );
  }

  const configProblems = [];

  if (
    !/"name"\s*:\s*"nowpulse"/.test(
      config.content
    )
  ) {
    configProblems.push(
      "wrangler.jsonc does not appear to target the nowpulse Worker."
    );
  }

  if (
    !/"main"\s*:\s*"src\/worker\.js"/.test(
      config.content
    )
  ) {
    configProblems.push(
      "wrangler.jsonc main should be src/worker.js."
    );
  }

  if (
    !/"binding"\s*:\s*"AI"/.test(
      config.content
    )
  ) {
    configProblems.push(
      "Workers AI binding AI was not found."
    );
  }

  if (
    !/"binding"\s*:\s*"NOWPULSE_KV"/.test(
      config.content
    )
  ) {
    configProblems.push(
      "KV binding NOWPULSE_KV was not found."
    );
  }

  const treePaths =
    new Set(
      (tree.tree || [])
        .map(
          item => item.path
        )
    );

  const missingFiles =
    REQUIRED_FILES.filter(
      file =>
        !treePaths.has(file)
    );

  const deploymentProblems =
    [];

  if (
    missingFiles.length
  ) {
    deploymentProblems.push(
      `Missing required files: ${missingFiles.join(", ")}`
    );
  }

  const files =
    (tree.tree || [])
      .filter(
        item =>
          item.type === "blob"
      )
      .map(
        item =>
          item.path
      )
      .filter(
        path =>
          path.startsWith(
            ".github/"
          ) ||
          path.startsWith(
            "src/"
          ) ||
          path ===
            "ai-manager.js" ||
          path ===
            "ai-manager.wrangler.jsonc" ||
          path ===
            "wrangler.jsonc"
      );

  const ok =
    workerArchitecture.ok &&
    managerProblems.length === 0 &&
    configProblems.length === 0 &&
    deploymentProblems.length === 0;

  return {
    ok,

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

    configuration: {
      ok:
        configProblems.length === 0,

      problems:
        configProblems
    },

    deployment: {
      ok:
        deploymentProblems.length === 0,

      problems:
        deploymentProblems
    },

    files
  };
}

function protectedFeatures(
  source
) {
  const result = {};

  for (
    const name of PROTECTED_FEATURES
  ) {
    const pattern =
      name === "Created by Taha"
        ? /Created\s+by\s+Taha/i
        : new RegExp(
            name.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            ),
            "i"
          );

    result[name] =
      pattern.test(source);
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

  for (
    const key of Object.keys(
      oldFeatures
    )
  ) {
    if (
      oldFeatures[key] &&
      !newFeatures[key]
    ) {
      removed.push(key);
    }
  }

  return removed;
}

function cleanAIJson(
  value
) {
  let s =
    text(value).trim();

  if (
    s.startsWith("```")
  ) {
    s =
      s.replace(
        /^```(?:json)?/i,
        ""
      );

    s =
      s.replace(
        /```$/i,
        ""
      );
  }

  const first =
    s.indexOf("{");

  const last =
    s.lastIndexOf("}");

  if (
    first >= 0 &&
    last > first
  ) {
    s =
      s.slice(
        first,
        last + 1
      );
  }

  return s.trim();
}

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

If no repair is required:
{
  "repairRequired": false,
  "diagnosis": "...",
  "validation": [],
  "changes": [],
  "notes": []
}

If a repair is required:
{
  "repairRequired": true,
  "diagnosis": "...",
  "validation": [],
  "changes": [
    {
      "path": "src/worker.js",
      "content": "COMPLETE FILE CONTENT"
    }
  ],
  "notes": []
}

Rules for changes:

- Every changed file must contain the COMPLETE file.
- Never return patches.
- Never return diff syntax.
- Never use placeholders.
- Never use "...".
- Never omit existing required functionality.
- Only change files in the allowed repair list.
- Do not put secrets in any file.
- Do not remove protected NowPulse functionality.
- If the problem cannot be safely repaired, return repairRequired=false
  and explain why.

Current Worker source:

${truncate(
  workerSource,
  70000
)}
`;

  const result =
    await env.AI.run(
      AI_MODEL,
      {
        messages: [
          {
            role: "system",
            content:
              "You are a conservative production JavaScript repair engineer. Return JSON only."
          },
          {
            role: "user",
            content:
              prompt
          }
        ],

        temperature: 0.1,

        max_tokens: 12000
      }
    );

  const raw =
    result?.response ||
    result?.result ||
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
    !Array.isArray(
      plan.changes
    )
  ) {
    throw new Error(
      "AI repair plan has no changes array."
    );
  }

  for (
    const change of plan.changes
  ) {
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
      typeof change.content !==
      "string"
    ) {
      throw new Error(
        `Repair content is not a string: ${change.path}`
      );
    }

    if (
      !change.content.trim()
    ) {
      throw new Error(
        `Repair content is empty: ${change.path}`
      );
    }

    if (
      change.content.includes(
        "GITHUB_TOKEN"
      ) &&
      /GITHUB_TOKEN\s*[:=]\s*["'`][^"'`]+/.test(
        change.content
      )
    ) {
      throw new Error(
        `Possible hard-coded secret in ${change.path}.`
      );
    }

    if (
      change.content.includes(
        "CLOUDFLARE_API_TOKEN"
      ) &&
      /CLOUDFLARE_API_TOKEN\s*[:=]\s*["'`][^"'`]+/.test(
        change.content
      )
    ) {
      throw new Error(
        `Possible Cloudflare secret in ${change.path}.`
      );
    }
  }

  const workerChange =
    plan.changes.find(
      item =>
        item.path ===
        WORKER_FILE
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
        `Repaired Worker failed architecture validation: ${architecture.problems.join(" | ")}`
      );
    }
  }

  return true;
}

function createBranchName() {
  const stamp =
    new Date()
      .toISOString()
      .replace(
        /[^0-9]/g,
        ""
      )
      .slice(
        0,
        14
      );

  return `ai-repair/${stamp}`;
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

  const sha =
    main?.commit?.sha;

  if (!sha) {
    throw new Error(
      "Main branch commit SHA unavailable."
    );
  }

  return github(
    env,
    `/repos/${REPOSITORY}/git/refs`,
    {
      method: "POST",

      body:
        JSON.stringify({
          ref:
            `refs/heads/${branchName}`,
          sha
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
    existing =
      await getFile(
        env,
        path,
        branch
      );
  } catch {
    existing = null;
  }

  const body = {
    message,

    content:
      base64EncodeUtf8(
        content
      ),

    branch
  };

  if (
    existing?.sha
  ) {
    body.sha =
      existing.sha;
  }

  return github(
    env,
    `/repos/${REPOSITORY}/contents/${path}`,
    {
      method: "PUT",

      body:
        JSON.stringify(body)
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
    `/repos/${REPOSITORY}/pulls`,
    {
      method: "POST",

      body:
        JSON.stringify({
          title,
          head: branch,
          base:
            DEFAULT_BRANCH,
          body
        })
    }
  );
}

async function prepareRepair(
  env
) {
  const inspection =
    await inspectProject(
      env
    );

  if (
    inspection.ok
  ) {
    return {
      ok: true,

      repairRequired:
        false,

      message:
        "Project is healthy; no repair required.",

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

  if (
    !plan.repairRequired
  ) {
    return {
      ok: true,

      repairRequired:
        false,

      message:
        "AI determined that no safe repair is required.",

      diagnosis:
        plan.diagnosis || "",

      validation:
        plan.validation || [],

      notes:
        plan.notes || [],

      inspection
    };
  }

  validateRepairPlan(
    plan,
    worker.content
  );

  if (
    !plan.changes.length
  ) {
    throw new Error(
      "AI marked repairRequired=true but returned no changes."
    );
  }

  const branchName =
    createBranchName();

  await createBranch(
    env,
    branchName
  );

  for (
    const change of plan.changes
  ) {
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
      "AI repair: NowPulse",
      [
        "Automated NowPulse repair.",
        "",
        `Diagnosis: ${plan.diagnosis || "Not provided."}`,
        "",
        "Validation:",
        ...(plan.validation || []).map(
          item => `- ${item}`
        ),
        "",
        "Notes:",
        ...(plan.notes || []).map(
          item => `- ${item}`
        ),
        "",
        "This PR was created by the NowPulse AI Manager."
      ].join("\n")
    );

  return {
    ok: true,

    repairRequired:
      true,

    branch:
      branchName,

    pullRequest: {
      number:
        pullRequest.number,

      url:
        pullRequest.html_url,

      state:
        pullRequest.state
    },

    diagnosis:
      plan.diagnosis || "",

    validation:
      plan.validation || [],

    notes:
      plan.notes || [],

    inspection
  };
}

function health(env) {
  return {
    ok: true,

    service:
      "NowPulse AI Manager",

    version:
      VERSION,

    mode:
      env.NOWPULSE_AI_REPAIR_MODE ||
      "safe",

    ai:
      Boolean(env.AI),

    github:
      Boolean(env.GITHUB_TOKEN),

    repository:
      env.NOWPULSE_GITHUB_REPO ||
      REPOSITORY,

    branch:
      env.NOWPULSE_GITHUB_BRANCH ||
      DEFAULT_BRANCH,

    workerFile:
      env.NOWPULSE_WORKER_FILE ||
      WORKER_FILE,

    timestamp:
      new Date().toISOString()
  };
}

async function githubDiagnostic(
  env
) {
  const tokenPresent =
    Boolean(
      env.GITHUB_TOKEN
    );

  if (!tokenPresent) {
    return {
      ok: false,
      tokenPresent: false,
      error:
        "GITHUB_TOKEN secret is missing."
    };
  }

  const user =
    await githubRaw(
      env,
      "/user"
    );

  const repository =
    await githubRaw(
      env,
      `/repos/${REPOSITORY}`
    );

  const branch =
    await githubRaw(
      env,
      `/repos/${REPOSITORY}/branches/${DEFAULT_BRANCH}`
    );

  return {
    ok:
      user.ok &&
      repository.ok &&
      branch.ok,

    tokenPresent: true,

    githubUser: {
      ok:
        user.ok,

      status:
        user.status,

      login:
        user.data?.login ||
        null,

      type:
        user.data?.type ||
        null,

      message:
        user.data?.message ||
        null,

      documentation:
        user.headers
          .documentation ||
        ""
    },

    repository: {
      ok:
        repository.ok,

      status:
        repository.status,

      fullName:
        repository.data?.full_name ||
        null,

      private:
        repository.data?.private ??
        null,

      permissions:
        repository.data?.permissions ||
        null,

      message:
        repository.data?.message ||
        null,

      documentation:
        repository.headers
          .documentation ||
        ""
    },

    branch: {
      ok:
        branch.ok,

      status:
        branch.status,

      name:
        branch.data?.name ||
        null,

      protected:
        branch.data?.protected ??
        null,

      message:
        branch.data?.message ||
        null,

      documentation:
        branch.headers
          .documentation ||
        ""
    },

    timestamp:
      new Date().toISOString()
  };
}

export default {
  async fetch(
    request,
    env
  ) {
    const url =
      new URL(
        request.url
      );

    try {
      if (
        url.pathname === "/"
      ) {
        return json({
          ok: true,

          service:
            "NowPulse AI Manager",

          version:
            VERSION,

          endpoints: [
            "/health",
            "/github-test",
            "/inspect",
            "/repair"
          ]
        });
      }

      if (
        url.pathname ===
        "/health"
      ) {
        return json(
          health(env)
        );
      }

      if (
        url.pathname ===
        "/github-test"
      ) {
        const result =
          await githubDiagnostic(
            env
          );

        return json(
          result,
          result.ok
            ? 200
            : 502
        );
      }

      if (
        url.pathname ===
        "/inspect"
      ) {
        const result =
          await inspectProject(
            env
          );

        return json(
          result,
          result.ok
            ? 200
            : 409
        );
      }

      if (
        url.pathname ===
        "/repair"
      ) {
        if (
          request.method !==
            "GET" &&
          request.method !==
            "POST"
        ) {
          return json(
            {
              ok: false,
              error:
                "Use GET or POST."
            },
            405
          );
        }

        const result =
          await prepareRepair(
            env
          );

        return json(
          result
        );
      }

      return json(
        {
          ok: false,
          error:
            "Not found."
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

          service:
            "NowPulse AI Manager",

          version:
            VERSION
        },
        500
      );
    }
  },

  async scheduled(
    event,
    env,
    ctx
  ) {
    if (
      (
        env.NOWPULSE_AI_REPAIR_MODE ||
        "safe"
      ) !== "safe"
    ) {
      return;
    }

    ctx.waitUntil(
      (async () => {
        try {
          const inspection =
            await inspectProject(
              env
            );

          if (
            !inspection.ok
          ) {
            await prepareRepair(
              env
            );
          }
        } catch {
          // Scheduled self-healing
          // must never break the Worker.
        }
      })()
    );
  }
};
