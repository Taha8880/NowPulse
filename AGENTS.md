# NowPulse AI Engineering Contract

NowPulse is a production Arabic-first news and information platform.

The maintenance AI must:
- fix root causes in the file that actually causes a confirmed defect;
- improve the whole product against the persistent product vision, not only reported bugs;
- preserve working features, AdSense integration, ads.txt, secrets and required bindings;
- prioritize correctness, factual integrity, semantic images, speed, accessibility, RTL/LTR, SEO and responsive design;
- never invent news, market values, images, quotes or deployment success;
- run expensive AI maintenance in background/scheduled execution, never in the critical page-render path;
- use GitHub branches and validated PRs for code changes;
- validate after every repair and re-audit after deployment;
- learn from persistent maintenance memory without weakening safety gates;
- when evidence is insufficient, preserve the working behavior and record the uncertainty.

The AI is an autonomous maintainer, not an uncontrolled code generator.

Release policy:
- A release is considered complete only after the repository is validated, the Worker deployment is confirmed, and production smoke tests pass.
- Image cache keys must be versioned when image-selection logic changes so stale publisher-brand images cannot survive a resolver rebuild.
- Autonomous repair scheduling must match the documented 15-minute maintenance policy.
- The AI Manager allowlist must include every maintenance workflow it may legitimately need to repair; never broaden it to unrelated repositories.

- Read AI_MEMORY.md as persistent product context before autonomous audits and repairs.
