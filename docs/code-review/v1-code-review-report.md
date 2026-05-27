# Code Review Report V1

Review date: 2026-05-25

Scope: `apps/web`, `packages/usage-daemons`, `supabase/migrations`, related docs.

## Executive Summary

整体质量不错：Web 侧 lint、类型检查、单测都通过，usage-daemons 也能通过 TypeScript 检查，生产构建在允许访问 Google Fonts 后通过。主要风险集中在 token usage 数据链路、Notion CMS 输入边界、以及少量文档/运行时一致性问题。

Token usage 专项复查后，最高风险仍是 usage 数据链路：组织级 poller 会重复计数，成本字段目前系统性低估，且当前 `session_id,model` 去重策略对非 ccusage 的事件式上报不安全。

## Findings

### P1 - Org usage pollers are still not idempotent when `session_id` is null

Files:
- `packages/usage-daemons/openai-poller/index.ts:57`
- `packages/usage-daemons/openai-poller/index.ts:70`
- `packages/usage-daemons/anthropic-poller/index.ts:59`
- `packages/usage-daemons/anthropic-poller/index.ts:70`
- `supabase/migrations/0005_dedup_by_session_model.sql:28`
- `apps/web/src/app/api/usage/ingest/route.ts:56`

`0005` changes dedup to `UNIQUE (session_id, model)`, and ingest now upserts on `session_id,model`. That fixes cumulative `ccusage` session snapshots, but both OpenAI and Anthropic org pollers emit `session_id: null` while polling a rolling last-24h window. PostgreSQL unique constraints do not treat `NULL` values as equal, so every scheduled org poll can insert another copy of the same model bucket. The dashboard aggregates `usage_daily`, so those duplicates inflate token totals and costs.

Recommended fix: generate deterministic non-null session IDs for org API buckets, for example `openai-usage-api:${bucketStart}:${model}` and `anthropic-usage-api:${starting_at}:${model}`, or use a dedicated unique index that coalesces nulls/source/bucket identity safely. Add an ingest/poller test covering repeated org poll payloads.

### P2 - Org pollers hard-code `cost_usd: 0`, so Spend metrics are underreported

Files:
- `packages/usage-daemons/openai-poller/index.ts:69`
- `packages/usage-daemons/anthropic-poller/index.ts:69`
- `apps/web/src/lib/cms/usage.ts:83`
- `apps/web/src/lib/cms/usage.ts:103`
- `apps/web/src/components/home/token-preview.tsx:61`
- `apps/web/src/components/home/token-preview.tsx:66`

Both organization pollers persist real token counts but write `cost_usd: 0`. The homepage then sums `cost_usd` from `usage_daily` for "7d Spend" and "All-time" spend, so any usage coming from the OpenAI or Anthropic org APIs contributes tokens but no dollars. This makes spend look lower than reality and mixes priced ccusage rows with unpriced org rows.

This is not just a missing UI label. OpenAI documents separate Usage and Cost API workflows, and the Anthropic docs expose a Cost API for USD cost breakdowns. Current code only ingests usage buckets.

Recommended fix: either ingest provider cost reports and join/merge by bucket/provider/model, or rename the UI copy to make clear it is "known/local estimated spend" until provider costs are implemented.

References:
- OpenAI cookbook: https://developers.openai.com/cookbook/examples/completions_usage_api
- Anthropic Usage and Cost API: https://platform.claude.com/docs/en/manage-claude/usage-cost-api

### P2 - `session_id,model` dedup is too coarse for event-style ingest

Files:
- `apps/web/src/app/api/usage/ingest/route.ts:7`
- `apps/web/src/app/api/usage/ingest/route.ts:23`
- `apps/web/src/app/api/usage/ingest/route.ts:56`
- `apps/web/src/app/api/usage/ingest/route.ts:57`
- `packages/usage-daemons/shared/types.ts:6`
- `packages/usage-daemons/shared/types.ts:21`
- `supabase/migrations/0005_dedup_by_session_model.sql:28`

The current unique key is tailored to cumulative ccusage snapshots: one row per `session_id + model`, overwritten with newer cumulative counters. The ingest route, however, explicitly accepts free-form future sources and custom agents. If an integration sends per-request or per-message events that share a session and model, later events overwrite earlier ones instead of adding to them. That undercounts real usage.

Recommended fix: separate cumulative snapshot ingestion from event ingestion. For example, require a stable `event_id` for event-style sources, use `(source, event_id)` for idempotency, and keep `(source, session_id, model)` only for cumulative snapshot sources. At minimum include `source` in conflict design and document the expected event semantics.

### P2 - `/api/usage/stats?days=abc` can throw before returning JSON

Files:
- `apps/web/src/app/api/usage/stats/route.ts:10`
- `apps/web/src/app/api/usage/stats/route.ts:29`
- `apps/web/src/app/api/usage/stats/route.ts:37`

`days` is parsed with `Number(...)` and then clamped with `Math.min/Math.max`. For non-numeric input, the result stays `NaN`. `shanghaiDateNDaysAgo(days - 1)` then formats `new Date(NaN)`, which throws `RangeError: Invalid time value`. This turns a bad query parameter into an unhandled 500.

Recommended fix: parse with a finite-number guard and default invalid values to 30, or return 400 for invalid input.

### P2 - Token chart mixes Shanghai day buckets with UTC "today"

Files:
- `apps/web/src/lib/cms/usage.ts:45`
- `apps/web/src/lib/cms/usage.ts:69`
- `apps/web/src/components/home/token-preview.tsx:31`
- `apps/web/src/components/home/token-chart.tsx:112`

`usage_daily` is bucketed by Asia/Shanghai, and `getUsageSummary` now correctly uses Shanghai-local date strings. `TokenPreview` still computes `todayStr` with `new Date().toISOString().slice(0, 10)`, which is UTC. During 16:00-23:59 UTC, the highlighted "today" bar will point to the previous Shanghai-local day.

Recommended fix: centralize the Shanghai date formatter and use it for `todayStr` as well.

### P2 - Notion links/bookmarks are rendered without URL scheme validation

Files:
- `apps/web/src/components/notion/rich-text.tsx:75`
- `apps/web/src/components/notion/rich-text.tsx:79`
- `apps/web/src/components/notion/notion-block.tsx:169`
- `apps/web/src/components/notion/notion-block.tsx:178`

Rich text links and bookmarks are taken directly from Notion and placed into `href`. If CMS content ever contains `javascript:` or another unsafe scheme, the public page can render a dangerous link. This is lower risk if only the site owner edits Notion, but it is still a public rendering boundary.

Recommended fix: allow only `http:`, `https:`, and optionally `mailto:`/`tel:`. Drop or render unsafe links as plain text.

### P2 - External Notion images can crash pages unless their host is allowlisted

Files:
- `apps/web/src/components/notion/notion-block.tsx:130`
- `apps/web/src/components/notion/notion-block.tsx:140`
- `apps/web/next.config.ts:4`

Notion image blocks may use arbitrary `external.url` hosts, but `next/image` only allows a short remote host list. A Notion external image from an unlisted domain can trigger a runtime image configuration error for that page.

Recommended fix: validate image hosts before rendering with `Image`, use a safe fallback for unsupported hosts, or expand the image pipeline/proxy intentionally.

### P2 - Notion select values are cast to unions but not validated

Files:
- `apps/web/src/lib/cms/resume.ts:14`
- `apps/web/src/lib/cms/resume.ts:33`
- `apps/web/src/lib/cms/uses.ts:17`
- `apps/web/src/lib/cms/uses.ts:29`
- `apps/web/src/lib/cms/projects.ts:24`
- `apps/web/src/lib/cms/timeline.ts:16`

The mappers cast Notion select strings to TypeScript unions. For `resume` and `uses`, downstream grouping indexes object keys from those values. A typo or new select option in Notion, such as `Experiences` or `Services`, can produce `bundle[key]`/`grouped[key]` as `undefined` and crash the page.

Recommended fix: add runtime enum parsers with explicit fallback or skip invalid rows with a logged warning. Add tests for unknown select values.

### P3 - List queries silently truncate after 100 Notion rows

Files:
- `apps/web/src/lib/cms/projects.ts:53`
- `apps/web/src/lib/cms/projects.ts:58`
- `apps/web/src/lib/cms/thinking.ts:42`
- `apps/web/src/lib/cms/thinking.ts:47`

`resume`, `uses`, and `timeline` paginate. `projects` and `thinking` do not; they only request `page_size: opts.limit ?? 100`. Once more than 100 published rows exist, older entries silently disappear from index pages and sitemap.

Recommended fix: share a paginated query helper and only short-circuit when an explicit `limit` has been satisfied.

### P3 - Ingest response fields are now misleading after UPSERT-replace

Files:
- `apps/web/src/app/api/usage/ingest/route.ts:56`
- `apps/web/src/app/api/usage/ingest/route.ts:69`
- `apps/web/src/app/api/usage/ingest/route.ts:78`
- `apps/web/src/app/api/usage/ingest/route.ts:79`

After moving away from `ignoreDuplicates`, Supabase returns selected rows for both inserts and updates. `inserted` is therefore "affected rows", and `skipped_duplicates` is no longer meaningful for ccusage updates. Operational logs in the daemons can give a false sense of how much new data arrived.

Recommended fix: rename the response field to `affected`, or implement separate insert/update accounting if that signal matters.

### P3 - Client component imports server data module

Files:
- `apps/web/src/components/home/token-chart.tsx:4`
- `apps/web/src/lib/cms/usage.ts:1`

`TokenChart` is a client component but imports formatting helpers from `@/lib/cms/usage`, a module that also imports the Supabase admin client. The current build passes, but this blurs the server/client boundary and can bloat the client bundle or accidentally make future server-only code reachable from client code.

Recommended fix: move `formatTokens`, `formatUsd`, and shared display types into a pure shared module, and mark Supabase-backed modules with `server-only`.

### P3 - Usage summary silently turns backend/schema errors into zero usage

Files:
- `apps/web/src/lib/cms/usage.ts:56`
- `apps/web/src/lib/cms/usage.ts:65`
- `apps/web/src/lib/cms/usage.ts:118`
- `apps/web/src/lib/cms/usage.ts:119`

`getUsageSummary` catches every error and returns `EMPTY_SUMMARY`. That is friendly for a public homepage, but it makes calculation failures indistinguishable from true zero usage. A missing Supabase env var, a stale materialized view schema, a permission problem, or a query failure all render as "no tokens/no spend" without any log or status signal.

Recommended fix: preserve graceful UI degradation but log the error server-side and expose a lightweight status flag to the component, so the page can avoid presenting a backend failure as a real zero.

### P3 - Supabase/daemon docs are stale relative to current migrations

Files:
- `supabase/README.md:5`
- `supabase/README.md:7`
- `packages/usage-daemons/README.md:24`
- `packages/usage-daemons/README.md:25`
- `supabase/migrations/0004_usage_daily_include_cache.sql`
- `supabase/migrations/0005_dedup_by_session_model.sql`

The Supabase README lists only migrations `0001` through `0003`, while the repo now has `0004` and `0005`. The daemon README still describes the old dedup key `(session_id, ts, model, input_tokens, output_tokens)`. Following the docs from scratch can leave the database on the wrong schema or teach operators the wrong idempotency model.

Recommended fix: update both READMEs after finalizing the dedup strategy.

## Verification

Commands run against the current worktree:

- `apps/web`: ESLint passed.
- `apps/web`: TypeScript `tsc --noEmit` passed.
- `apps/web`: Vitest passed, 17 files / 72 tests.
- `packages/usage-daemons`: TypeScript `tsc --noEmit` passed.
- `apps/web`: `next build` failed under sandboxed network because Google Fonts could not be fetched, then passed when network access was allowed.
- Token usage follow-up: manually reviewed ingest/upsert semantics, `usage_daily` formulas, `getUsageSummary`, `/api/usage/stats`, `TokenPreview`/`TokenChart`, and all three usage daemons. No dedicated automated tests currently cover these usage calculation edge cases.

## Notes

This report is based on the current clean worktree at HEAD `8287b0e`. The recent usage dedup/window/timezone fixes are included in that HEAD and were reviewed as part of V1.

`docs/` is ignored by `.gitignore`, so this report file exists locally but will not appear in `git status` unless it is force-added or the ignore rule changes.
