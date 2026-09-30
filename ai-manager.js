const GITHUB_API = "https://api.github.com";

const DEFAULT_REPO = "Taha8880/NowPulse";
const DEFAULT_BRANCH = "main";
const WORKER_FILE = "src/worker.js";

const AI_MODEL =
  "@cf/meta/llama-3.1-8b-instruct-fast";

const PROJECT_RULES = `
NOWPULSE ARCHITECTURE

NowPulse is a Cloudflare Workers ES Modules application.

Runtime:
- Cloudflare Worker
- src/worker.js is the production entry point
- No browser APIs are allowed in server-side Worker code
- window, document, localStorage and DOM APIs must never be used by server-side code

Bindings:
- AI = Cloudflare Workers AI
- NOWPULSE_KV = Cloudflare KV namespace

Scheduled processing:
- Cloudflare Cron runs every 5 minutes
- scheduled() is responsible for background news ingestion

Deployment:
- GitHub repository: Taha8880/NowPulse
- production branch: main
- production worker: nowpulse

Core functionality that must never be intentionally removed:
- latest news
- categories
- Arabic RTL
- English LTR
- search
- article pages
- image handling
- weather
- markets
- trends
- sitemap
- robots.txt
- responsive desktop/tablet/mobile layouts
- SEO
- KV caching
- Workers AI
- scheduled news updates

Security:
- Never expose tokens
- Never write secrets into source files
- Never modify Cloudflare credentials
- Never replace KV IDs without explicit configuration
- Never introduce eval()
- Never introduce new remote JavaScript execution
- Never trust arbitrary user HTML

Performance:
- External requests must have timeouts
- News rendering must not depend on successful image retrieval
- Images must load independently
- AI must not block the basic homepage unnecessarily
- Avoid unnecessary external requests
- Cache expensive operations

Self-healing:
- Diagnose before modifying
- Never blindly rewrite the entire project
- Preserve working functionality
- Validate syntax before deployment
- Validate required architecture
- Keep rollback possible
- Do not repeatedly apply the same failed repair
`;

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=UTF-8",
        "cache-control":
          "no-store"
      }
    }
  );
}

function textFromAI(result) {
  if (!result) {
    return "";
  }

  if (typeof result === "string") {
    return result;
  }

  return (
    result.response ||
    result.result?.response ||
    result.output_text ||
    ""
  );
}

function encodeBase64Utf8(value) {
  const bytes =
    new TextEncoder().encode(
      String(value)
    );

  let binary = "";

  const chunkSize = 0x8000;

  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {
    binary += String.fromCharCode(
      ...bytes.subarray(
        i,
        i + chunkSize
      )
    );
  }

  return btoa(binary);
}

function decodeBase64Utf8(value) {
  const binary =
    atob(
      String(value)
        .replace(/\s/g, "")
    );

  const bytes =
    Uint8Array.from(
      binary,
      character =>
        character.charCodeAt(0)
    );

  return new TextDecoder()
    .decode(bytes);
}

async function githubRequest(
  env,
  path,
  options = {}
) {
  if (!env.GITHUB_TOKEN) {
    throw new Error(
      "GITHUB_TOKEN is not configured"
    );
  }

  const response =
    await fetch(
      GITHUB_API + path,
      {
        ...options,
        headers: {
          Authorization:
            `Bearer ${env.GITHUB_TOKEN}`,

          Accept:
            "application/vnd.github+json",

          "X-GitHub-Api-Version":
            "2022-11-28",

          "User-Agent":
            "NowPulse-Self-Healing",

          ...(options.headers || {})
        }
      }
    );

  const raw =
    await response.text();

  let data;

  try {
    data =
      JSON.parse(raw);
  } catch {
    data = {
      raw
    };
  }

  if (!response.ok) {
    throw new Error(
      `GitHub API ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function getRepositoryFile(
  env,
  repo,
  path,
  branch
) {
  const data =
    await githubRequest(
      env,
      `/repos/${repo}/contents/${path}?ref=${encodeURIComponent(
        branch
      )}`
    );

  return {
    path,
    sha: data.sha,
    content:
      decodeBase64Utf8(
        data.content
      )
  };
}

async function getRepositoryTree(
  env,
  repo,
  branch
) {
  const data =
    await githubRequest(
      env,
      `/repos/${repo}/git/trees/${encodeURIComponent(
        branch
      )}?recursive=1`
    );

  return (
    data.tree || []
  );
}

function architectureCheck(
  source
) {
  const problems = [];

  if (
    !source ||
    typeof source !== "string"
  ) {
    problems.push(
      "Worker source is empty."
    );

    return {
      ok: false,
      problems
    };
  }

  if (
    !source.includes(
      "export default"
    )
  ) {
    problems.push(
      "Production Worker does not contain export default."
    );
  }

  if (
    !source.includes(
      "async fetch"
    )
  ) {
    problems.push(
      "Production Worker does not contain an async fetch handler."
    );
  }

  if (
    !source.includes(
      "scheduled"
    )
  ) {
    problems.push(
      "Scheduled handler is missing."
    );
  }

  if (
    !source.includes(
      "NOWPULSE_KV"
    )
  ) {
    problems.push(
      "NOWPULSE_KV binding is not referenced."
    );
  }

  if (
    !source.includes(
      "env.AI"
    )
  ) {
    problems.push(
      "Workers AI binding is not referenced."
    );
  }

  if (
    /\bwindow\s*\./.test(source) ||
    /\bdocument\s*\./.test(source)
  ) {
    problems.push(
      "Browser APIs were detected in Worker server code."
    );
  }

  if (
    /\blocalStorage\s*\./.test(source)
  ) {
    problems.push(
      "localStorage was detected in Worker server code."
    );
  }

  if (
    /CLOUDFLARE_API_TOKEN\s*=\s*["'`]/.test(
      source
    )
  ) {
    problems.push(
      "Potential Cloudflare API token exposure."
    );
  }

  if (
    /GITHUB_TOKEN\s*=\s*["'`]/.test(
      source
    )
  ) {
    problems.push(
      "Potential GitHub token exposure."
    );
  }

  if (
    /BEGIN PRIVATE KEY/.test(
      source
    )
  ) {
    problems.push(
      "Private key material detected."
    );
  }

  if (
    /\beval\s*\(/.test(source)
  ) {
    problems.push(
      "eval() detected."
    );
  }

  return {
    ok:
      problems.length === 0,
    problems
  };
}

async function askAI(
  env,
  prompt
) {
  if (!env.AI) {
    throw new Error(
      "Workers AI binding is missing."
    );
  }

  const result =
    await env.AI.run(
      AI_MODEL,
      {
        messages: [
          {
            role: "system",
            content:
              `You are the controlled self-healing engineering manager for NowPulse.

${PROJECT_RULES}

Your job is to diagnose and repair the NowPulse project.

Rules:
1. Never invent external facts.
2. Never expose secrets.
3. Never remove working features without evidence.
4. Never convert a Cloudflare Worker into browser JavaScript.
5. Never use window/document/localStorage in server code.
6. Preserve Arabic RTL and English LTR.
7. Preserve search, news, images, weather, markets, trends and article pages.
8. Preserve KV and Workers AI.
9. Preserve scheduled updates.
10. Prefer the smallest safe correction.
11. If a complete replacement is necessary, preserve all required architecture.
12. Return machine-readable JSON.
13. Do not return markdown fences.

Required JSON:
{
  "severity": "low|medium|high|critical",
  "diagnosis": "string",
  "rootCause": "string",
  "repairRequired": true,
  "changes": ["string"],
  "validation": ["string"],
  "source": "complete worker source or empty string"
}`
          },
          {
            role: "user",
            content:
              prompt
          }
        ],
        max_tokens: 7000
      }
    );

  const output =
    textFromAI(result).trim();

  if (!output) {
    throw new Error(
      "Workers AI returned an empty response."
    );
  }

  return output;
}

function parseAIJson(value) {
  let text =
    String(value || "")
      .trim();

  text =
    text
      .replace(
        /^```(?:json)?/i,
        ""
      )
      .replace(
        /```$/i,
        ""
      )
      .trim();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      "AI returned invalid JSON."
    );
  }
}

function safetyCheck(
  source,
  original
) {
  if (
    !source ||
    typeof source !== "string"
  ) {
    return {
      ok: false,
      problems: [
        "AI did not return source code."
      ]
    };
  }

  const problems = [];

  if (
    source.length < 5000
  ) {
    problems.push(
      "Replacement source is suspiciously small."
    );
  }

  const architecture =
    architectureCheck(
      source
    );

  problems.push(
    ...architecture.problems
  );

  const dangerousPatterns = [
    "BEGIN PRIVATE KEY",
    "CLOUDFLARE_API_TOKEN=",
    "GITHUB_TOKEN=",
    "process.env.CLOUDFLARE_API_TOKEN",
    "console.log(env.GITHUB_TOKEN)",
    "console.log(env.CLOUDFLARE_API_TOKEN)"
  ];

  for (
    const pattern of dangerousPatterns
  ) {
    if (
      source.includes(pattern)
    ) {
      problems.push(
        `Potential secret exposure: ${pattern}`
      );
    }
  }

  if (
    original &&
    original.includes(
      "NOWPULSE_KV"
    ) &&
    !source.includes(
      "NOWPULSE_KV"
    )
  ) {
    problems.push(
      "AI attempted to remove KV."
    );
  }

  if (
    original &&
    original.includes(
      "env.AI"
    ) &&
    !source.includes(
      "env.AI"
    )
  ) {
    problems.push(
      "AI attempted to remove Workers AI."
    );
  }

  if (
    original &&
    original.includes(
      "scheduled"
    ) &&
    !source.includes(
      "scheduled"
    )
  ) {
    problems.push(
      "AI attempted to remove scheduled processing."
    );
  }

  return {
    ok:
      problems.length === 0,
    problems
  };
}

async function createBranch(
  env,
  repo,
  branch,
  baseBranch
) {
  const base =
    await githubRequest(
      env,
      `/repos/${repo}/git/ref/heads/${encodeURIComponent(
        baseBranch
      )}`
    );

  return githubRequest(
    env,
    `/repos/${repo}/git/refs`,
    {
      method: "POST",
      headers: {
        "content-type":
          "application/json"
      },
      body:
        JSON.stringify({
          ref:
            `refs/heads/${branch}`,
          sha:
            base.object.sha
        })
    }
  );
}

async function updateFile(
  env,
  repo,
  path,
  branch,
  content,
  sha,
  message
) {
  return githubRequest(
    env,
    `/repos/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        "content-type":
          "application/json"
      },
      body:
        JSON.stringify({
          message,
          content:
            encodeBase64Utf8(
              content
            ),
          sha,
          branch
        })
    }
  );
}

async function createPullRequest(
  env,
  repo,
  head,
  base,
  title,
  body
) {
  return githubRequest(
    env,
    `/repos/${repo}/pulls`,
    {
      method: "POST",
      headers: {
        "content-type":
          "application/json"
      },
      body:
        JSON.stringify({
          title,
          head,
          base,
          body
        })
    }
  );
}

async function inspectProject(
  env
) {
  const repo =
    env.NOWPULSE_GITHUB_REPO ||
    DEFAULT_REPO;

  const branch =
    env.NOWPULSE_GITHUB_BRANCH ||
    DEFAULT_BRANCH;

  const worker =
    await getRepositoryFile(
      env,
      repo,
      WORKER_FILE,
      branch
    );

  const architecture =
    architectureCheck(
      worker.content
    );

  const tree =
    await getRepositoryTree(
      env,
      repo,
      branch
    );

  return {
    repository: repo,
    branch,
    worker,
    architecture,
    files:
      tree.map(
        item => item.path
      )
  };
}

async function prepareRepair(
  env,
  problem
) {
  const project =
    await inspectProject(
      env
    );

  const prompt = `
NOWPULSE SELF-HEALING REQUEST

Detected problem:
${problem}

Repository:
${project.repository}

Branch:
${project.branch}

Architecture check:
${JSON.stringify(
  project.architecture,
  null,
  2
)}

Current project files:
${project.files.join("\n")}

Current worker source:
----- BEGIN CURRENT WORKER -----
${project.worker.content}
----- END CURRENT WORKER -----

${PROJECT_RULES}

Diagnose the problem.

Do not make changes unless a repair is actually required.

If repair is required:
- preserve the existing architecture
- preserve working functionality
- correct only what is necessary
- return a complete replacement for src/worker.js
- do not include markdown fences
`;

  const ai =
    await askAI(
      env,
      prompt
    );

  const result =
    parseAIJson(ai);

  if (
    !result.repairRequired
  ) {
    return {
      ok: true,
      repaired: false,
      diagnosis:
        result.diagnosis ||
        "No repair required."
    };
  }

  const source =
    String(
      result.source || ""
    ).trim();

  const safety =
    safetyCheck(
      source,
      project.worker.content
    );

  if (!safety.ok) {
    return {
      ok: false,
      repaired: false,
      diagnosis:
        result.diagnosis || "",
      rootCause:
        result.rootCause || "",
      safety
    };
  }

  const branch =
    `ai-repair-${Date.now()}`;

  await createBranch(
    env,
    project.repository,
    branch,
    project.branch
  );

  await updateFile(
    env,
    project.repository,
    WORKER_FILE,
    branch,
    source,
    project.worker.sha,
    `AI repair: ${String(
      result.rootCause ||
        "NowPulse self-healing"
    ).slice(0, 120)}`
  );

  const pull =
    await createPullRequest(
      env,
      project.repository,
      branch,
      project.branch,
      "NowPulse AI Self-Healing Repair",
      `
## Automated NowPulse repair

### Diagnosis
${result.diagnosis || "N/A"}

### Root cause
${result.rootCause || "N/A"}

### Changes
${
  Array.isArray(
    result.changes
  )
    ? result.changes
        .map(
          item =>
            `- ${item}`
        )
        .join("\n")
    : "- Automated repair"
}

### Validation
${
  Array.isArray(
    result.validation
  )
    ? result.validation
        .map(
          item =>
            `- ${item}`
        )
        .join("\n")
    : "- Architecture safety checks passed"
}

This repair was generated by the NowPulse controlled self-healing system.

The repair must pass repository validation before production deployment.
`
    );

  return {
    ok: true,
    repaired: true,
    branch,
    pullRequest:
      pull.html_url,
    diagnosis:
      result.diagnosis,
    rootCause:
      result.rootCause,
    changes:
      result.changes || [],
    validation:
      result.validation || []
  };
}

export default {

  async fetch(
    request,
    env
  ) {
    const url =
      new URL(request.url);

    if (
      url.pathname ===
      "/health"
    ) {
      return json({
        ok: true,
        service:
          "NowPulse AI Manager",
        mode:
          env.NOWPULSE_AI_REPAIR_MODE ||
          "safe",
        ai:
          Boolean(env.AI),
        github:
          Boolean(env.GITHUB_TOKEN),
        repository:
          env.NOWPULSE_GITHUB_REPO ||
          DEFAULT_REPO
      });
    }

    if (
      url.pathname ===
      "/inspect"
    ) {
      try {
        const result =
          await inspectProject(
            env
          );

        return json({
          ok: true,
          architecture:
            result.architecture,
          repository:
            result.repository,
          branch:
            result.branch,
          files:
            result.files
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error?.message ||
              String(error)
          },
          500
        );
      }
    }

    if (
      url.pathname ===
      "/repair"
    ) {
      if (
        request.method !==
        "POST"
      ) {
        return json(
          {
            ok: false,
            error:
              "POST required"
          },
          405
        );
      }

      if (
        env.NOWPULSE_AI_REPAIR_MODE ===
        "disabled"
      ) {
        return json(
          {
            ok: false,
            error:
              "Self-healing is disabled"
          },
          403
        );
      }

      try {
        const body =
          await request.json();

        const problem =
          String(
            body.problem ||
              ""
          ).trim();

        if (
          !problem
        ) {
          return json(
            {
              ok: false,
              error:
                "problem is required"
            },
            400
          );
        }

        const result =
          await prepareRepair(
            env,
            problem
          );

        return json(
          result,
          result.ok
            ? 200
            : 422
        );
      } catch (error) {
        return json(
          {
            ok: false,
            error:
              error?.message ||
              String(error)
          },
          500
        );
      }
    }

    return json({
      ok: true,
      service:
        "NowPulse AI Manager",
      version:"5.0.0"
    });
  }

};
