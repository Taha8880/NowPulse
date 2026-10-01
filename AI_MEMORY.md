# NowPulse Persistent AI Memory

## Product identity
NowPulse is a production Arabic-first information/news platform. It is Egypt-first, Arab countries second, international coverage third. It is not a demo blog.

## Owner requirements
- Owner wants direct execution, not claims that work was merely prepared.
- Accuracy is more important than speed; never guess or fabricate.
- Arabic is the default language; English is supported.
- Correct RTL/LTR, mobile Android/iPhone/tablet and desktop behavior.
- Footer must contain exactly: Created by Taha.
- Professional, clean, fast visual design.
- Life-wisdom quote area must contain short everyday wisdom, not journalism slogans.
- Search must work for Arabic/English people, topics, names, multi-word queries and no-result cases.
- Article images must depict the actual article subject. Never use publisher logos, favicons, avatars, mastheads, site screenshots or generic source branding.
- If an article has no reliable image, use a semantically matched fallback; otherwise omit the image.
- News must be substantive and source-grounded. Never invent facts, quotes, dates or prices.
- Gold, USD/EGP, EUR/EGP, GBP/EGP and other market values must update independently; one provider failure must not erase valid values.
- Preserve AdSense integration and ads.txt.
- Preserve SEO, sitemap, robots, structured data and canonical URLs.
- AI maintenance must not slow normal page rendering.

## Known architecture
- Main Worker: src/worker.js
- Autonomous Agent: src/ai-guardian.js
- Durable Workflow: src/nowpulse-maintenance-workflow.js
- Legacy/fallback manager: ai-manager.js
- Product contract: AGENTS.md
- Wrangler: wrangler.jsonc
- AI manager Wrangler: ai-manager.wrangler.jsonc
- GitHub repository: Taha8880/NowPulse
- Production URL: https://nowpulse.tavengers16.workers.dev/
- Shared KV binding: NOWPULSE_KV
- AI binding: AI
- Primary reasoning model: @cf/zai-org/glm-5.2
- Fast/reviewer fallback: @cf/meta/llama-3.1-8b-instruct-fast

## Autonomous behavior required
The AI is expected to inspect the complete product on schedule without waiting for a human complaint. It should:
1. audit production behavior, not just HTTP 200;
2. inspect news, article substance, semantic images, markets, search, SEO, responsive markup and localization;
3. separate confirmed defects from uncertainty;
4. trace confirmed defects to the root-cause file;
5. create the smallest safe repair;
6. independently review it;
7. use GitHub PR + CI gates;
8. verify production after merge;
9. record failures and recurring issues;
10. avoid repeating rejected approaches;
11. improve the maintenance system itself when evidence supports it;
12. never weaken safety gates to make a repair easier.

## Safety and quality
- Never expose GitHub/Cloudflare secrets.
- Never claim deployment success without verification.
- Never delete working features to fix a symptom.
- Never replace the project with a minimal demo.
- Never fabricate missing news/market/image data.
- Political/news output must remain factual and neutral.
- Maintenance runs in background/scheduled execution, never on the critical render path.
- If evidence is insufficient, preserve working behavior and record uncertainty.

## Engineering history
- Article cache was upgraded to article:v2 and source evidence extraction was added.
- Semantic image selection uses article image/source HTML/GDELT/Wikipedia/Wikimedia fallbacks while rejecting logos/icons/avatars/placeholders/branding.
- Markets use independent providers and stale-value isolation.
- Search normalizes Arabic variants and supports Arabic/English.
- Quotes were changed from journalism-themed phrases to simple life wisdom.
- Professional inline SVG NowPulse branding and responsive design were added.
- AI Manager reached 9.x and uses persistent KV maintenance memory.
- Durable Agent + Workflow control plane is part of the v6.0.0 architecture.
- GitHub validation now includes dependency installation, JavaScript syntax, Wrangler dry-run and production smoke tests.
- The current objective is a continuously improving production platform, not a one-time bug fix.

## Current product architecture target
- v6.0.0 is a cohesive product release, not a collection of symptom patches.
- Homepage rendering must stay fast: article images resolve through the semantic image endpoint instead of bulk-blocking page generation.
- Image selection is source-first and semantic, with GDELT/Wikipedia/Wikimedia fallbacks and an explicit blacklist for publisher branding.
- Market data uses independent live FX and gold providers with per-provider status and isolated cached fallback.
- AI Manager uses GLM-5.2 as primary reasoning with Llama fallback.
- Product contract tests must run in CI and protect news, images, markets, article evidence, Story Hub, SEO and AdSense requirements.
- No dead TimeShift UI is required; future story-evolution features must be implemented only when they have a complete user-facing flow and reliable evidence.
