const GITHUB_API = "https://api.github.com";

const DEFAULT_REPO = "Taha8880/NowPulse";
const DEFAULT_BRANCH = "main";
const WORKER_FILE = "src/worker.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8"
    }
  });
}

async function githubRequest(env, path, options = {}) {
  if (!env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not configured");
  }

  const response = await fetch(GITHUB_API + path, {
    ...options,
    headers: {
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "NowPulse-AI-Manager",
      ...(options.headers || {})
    }
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `GitHub API ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function getFile(env, repo, path, branch) {
  const data = await githubRequest(
    env,
    `/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`
  );

  const content = atob(
    String(data.content || "").replace(/\n/g, "")
  );

  return {
    path,
    sha: data.sha,
    content
  };
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
  const encoded = btoa(unescape(encodeURIComponent(content)));

  return githubRequest(
    env,
    `/repos/${repo}/contents/${path}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: encoded,
        sha,
        branch
      })
    }
  );
}

async function askAI(env, prompt) {
  if (!env.AI) {
    throw new Error("Workers AI binding is missing");
  }

  const result = await env.AI.run(
    "@cf/meta/llama-3.1-8b-instruct",
    {
      messages: [
        {
          role: "system",
          content:
            "You are the engineering manager for the NowPulse project. " +
            "Your job is to diagnose technical problems, improve reliability, " +
            "performance, SEO, news processing, search, multilingual behavior, " +
            "responsive UI and monetization infrastructure. " +
            "Never invent facts. Never expose secrets. " +
            "Never remove working functionality without evidence. " +
            "Return precise engineering instructions and code when requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 6000
    }
  );

  return result;
}

function basicSafetyCheck(source) {
  if (!source || typeof source !== "string") {
    return {
      ok: false,
      reason: "Empty source"
    };
  }

  if (source.length < 500) {
    return {
      ok: false,
      reason: "Source is suspiciously small"
    };
  }

  const dangerousPatterns = [
    "process.env.CLOUDFLARE_API_TOKEN",
    "console.log(env.CLOUDFLARE_API_TOKEN)",
    "CLOUDFLARE_API_TOKEN=",
    "GITHUB_TOKEN=",
    "BEGIN PRIVATE KEY"
  ];

  for (const pattern of dangerousPatterns) {
    if (source.includes(pattern)) {
      return {
        ok: false,
        reason: `Potential secret exposure: ${pattern}`
      };
    }
  }

  return {
    ok: true,
    reason: "Basic safety checks passed"
  };
}

export async function analyzeAndPrepareRepair(env, problem) {
  const repo = env.NOWPULSE_GITHUB_REPO || DEFAULT_REPO;
  const branch = env.NOWPULSE_GITHUB_BRANCH || DEFAULT_BRANCH;
  const file = env.NOWPULSE_WORKER_FILE || WORKER_FILE;

  const current = await getFile(
    env,
    repo,
    file,
    branch
  );

  const analysis = await askAI(
    env,
    `
NOWPULSE ENGINEERING TASK

Repository:
${repo}

Branch:
${branch}

File:
${file}

Problem detected:
${problem}

Current source code:
----- BEGIN SOURCE -----
${current.content}
----- END SOURCE -----

Analyze the problem carefully.

Requirements:
1. Preserve existing working functionality.
2. Do not expose secrets.
3. Do not invent external data.
4. Do not remove news/search/image/language functionality unless required.
5. Keep Arabic RTL and English LTR support.
6. Keep mobile, tablet and desktop support.
7. Keep the site fast.
8. Keep AI article generation based on verified source information.
9. Keep KV storage.
10. Keep Workers AI.
11. Keep scheduled news updates.
12. Avoid unnecessary dependencies.

Return:
- diagnosis
- exact cause
- proposed fix
- complete replacement source only if a source modification is actually required

Do not return markdown fences around the replacement source.
`
  );

  return {
    repo,
    branch,
    file,
    currentSha: current.sha,
    analysis
  };
}

export async function applyRepair(env, repair) {
  if (!repair || !repair.analysis) {
    throw new Error("Invalid repair object");
  }

  const text =
    typeof repair.analysis === "string"
      ? repair.analysis
      : JSON.stringify(repair.analysis);

  /*
   * We deliberately do NOT automatically commit arbitrary AI output yet.
   *
   * The GitHub Actions validation layer will be added next.
   * That layer will:
   *
   * 1. receive the proposed change
   * 2. run syntax checks
   * 3. run safety checks
   * 4. build the Worker
   * 5. deploy only after successful validation
   * 6. keep the previous deployment available for rollback
   */

  return {
    status: "repair_prepared",
    repository: repair.repo,
    branch: repair.branch,
    file: repair.file,
    currentSha: repair.currentSha,
    analysis: text
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/ai-manager/health") {
      return json({
        ok: true,
        service: "NowPulse AI Manager",
        mode: env.NOWPULSE_AI_REPAIR_MODE || "safe",
        githubConfigured: Boolean(env.GITHUB_TOKEN),
        aiConfigured: Boolean(env.AI),
        repository:
          env.NOWPULSE_GITHUB_REPO || DEFAULT_REPO
      });
    }

    if (url.pathname === "/api/ai-manager/analyze") {
      if (request.method !== "POST") {
        return json(
          {
            ok: false,
            error: "POST required"
          },
          405
        );
      }

      try {
        const body = await request.json();

        const problem =
          body.problem ||
          "Unknown NowPulse technical problem";

        const repair =
          await analyzeAndPrepareRepair(
            env,
            problem
          );

        return json({
          ok: true,
          repair
        });
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

    return json({
      ok: true,
      service: "NowPulse AI Manager"
    });
  }
};
