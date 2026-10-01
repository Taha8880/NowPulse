# NowPulse — Clean Project Baseline

This repository treats all pre-8.0 implementations as test history. The project requirements below are the source of truth.

## Product
- Name: NowPulse / نبض الآن.
- Production: Cloudflare Worker backed by GitHub.
- Repository: Taha8880/NowPulse.
- Default branch: main.
- Arabic is the default language; English is a full language mode, not mixed content.
- Footer must contain: Created by Taha.
- The site is an information/news platform, not an AI-only site.
- Editorial tone: transparent, factual, neutral.
- Priority: Egypt, then Arab world, then international. Politics is global and must not be restricted to Egypt/Arab news.

## Required user experience
- Professional responsive layout on Android, iPhone and desktop.
- Correct Arabic RTL and English LTR typography with no overlapping or oversized elements.
- Search must accept arbitrary people, events, organizations and topics and search beyond NowPulse's own feed.
- Articles must be structured: headline, summary, details, what is known, and source.
- Never expose raw extraction labels, scraping artifacts, social/share blocks, or source names appended to headlines.
- No duplicate stories.
- Clean, short story IDs/URLs.
- Images must be topic/article-specific. Reject Google News logos, favicons and generic placeholders; use a relevant external fallback when the source has no usable image.
- Markets: USD/EGP, EUR/EGP, GBP/EGP, CHF/EGP, Gold 24K/21K/18K.
- Weather remains compact.
- Rotating non-repetitive quotes.
- SEO: canonical, sitemap, RSS, robots, structured article metadata.
- AdSense publisher: ca-pub-1235197294708204. Do not claim AdSense approval; workers.dev has domain limitations.
- Analytics measurement ID: G-RVP9Q52085.

## Architecture rules
- Protect the homepage critical path. Do not run heavy AI, broad web search, large parsing or repeated external calls on every homepage request.
- Cache news, markets, weather, search and localized article data in KV.
- Refresh news/markets/weather on scheduled execution where possible.
- Keep search work isolated to /search and /api/search.
- AI is an assistant for translation, diagnostics and repair; it is not the site's sole content engine.
- Never allow AI repair to invent secrets or rewrite unrelated infrastructure.
- Every repair must pass syntax, contract, Wrangler dry-run and production verification before being considered complete.
- Prefer root-cause fixes over repeated patches.
- Keep a rollback path and make small, validated changes.

## Known failures that must not return
- Cloudflare Error 1102 from CPU/memory-heavy HTTP work.
- Homepage depending on AI or many external requests.
- Broken Arabic rendering/overlap.
- Broken search button/URL construction.
- Search limited to local NowPulse stories.
- English source text appearing in Arabic mode.
- Generic site/logo images used as article images.
- Missing market values.
- Oversized weather icon/widget.
- Duplicate or misclassified stories.
- Raw extraction/source artifacts in article pages.
- Long or unstable story slugs.
- Stale deployments where GitHub changes do not reach production.
- AI Manager operating without a valid GitHub token while claiming autonomous repair.
- AI repair PRs bypassing validation.
