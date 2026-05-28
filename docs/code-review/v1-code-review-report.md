# Code Review Report V1

Review date: 2026-05-25

Latest token-usage follow-up: 2026-05-28

Scope: `apps/web`, `packages/usage-daemons`, `supabase/migrations`, related docs.

## Executive Summary

整体质量不错：Web 侧 lint、类型检查、单测都通过，usage-daemons 也能通过 TypeScript 检查，生产构建在允许访问 Google Fonts 后通过。主要风险集中在 token usage 数据链路、Notion CMS 输入边界、以及少量文档/运行时一致性问题。

2026-05-28 Token Usage 专项复查结论：目前没有看到导致“大量 token”被项目侧重复计算的证据；本机和远端的大头都来自 `cache_read_tokens`，而当前产品口径明确把 cache read/write 计入 `total_tokens`。真正的计算缺口是反方向的：Hermes 的 reasoning/extra tokens 在 `ccusage.totalTokens` 里存在，但同步器只消费 `modelBreakdowns`，会少算这部分。

本次复查覆盖本机 Codex/Claude Code/OpenCode 输出、远端 cortana-box Hermes/OpenClaw/Claude/Codex 输出、`ccusage` v20.0.4 源码、ingest/upsert、`usage_daily` 聚合公式、OpenAI/Anthropic org poller。

## 2026-05-28 Token Usage Deep Review Addendum

### Summary

- 本机 `ccusage --json --breakdown session --since 2026-05-25`：54 个 session，`totalTokens` 与 `modelBreakdowns` 分项合计完全一致，mismatch = 0。
- 本机大数来源：Claude 约 2.224B tokens，其中 cache read 约 2.177B；Codex 约 289.7M tokens，其中 cache read 约 262.5M。
- 远端 cortana-box `ccusage` v20.0.4：OpenClaw 约 334.9M tokens，其中 cache read 约 242.8M；Hermes 约 11.84M tokens，其中 cache read 约 4.80M。
- 远端 OpenClaw / Codex / Claude 的 `totalTokens` 与 breakdown 合计一致；Hermes 有 10,221 tokens 差额，来源是 `ccusage` 的 `extra_total_tokens`/reasoning tokens。
- 远端运行项目版本为 `49cf460`，本地当前 review 版本为 `e9d9f2e`；本次涉及的同步逻辑在两边没有发现会造成重复放大的差异。
- 追加核查：`ccusage` v20.0.4 默认不会自动扫描 Hermes named profiles（`~/.hermes/profiles/<name>/state.db`）。如果使用非 default profile 且没有手动设置 `HERMES_HOME` 包含这些 profile home，会漏统 Hermes 用量。

### P1 - ccusage does not discover Hermes named profiles by default

Files:
- External: `ccusage` v20.0.4 `rust/crates/ccusage/src/adapter/hermes.rs:134`
- External: `ccusage` v20.0.4 `rust/crates/ccusage/src/adapter/hermes.rs:135`
- External: `ccusage` v20.0.4 `rust/crates/ccusage/src/adapter/hermes.rs:145`
- External: `ccusage` v20.0.4 `rust/crates/ccusage/src/adapter/hermes.rs:150`
- Runtime: `packages/usage-daemons/ccusage-sync/index.ts:134`
- Runtime: `packages/usage-daemons/ccusage-sync/index.ts:139`

This is a real `ccusage` v20.0.4 limitation/bug for Hermes profile users.

Hermes Agent's own profile implementation documents named profiles as independent `HERMES_HOME` directories under `~/.hermes/profiles/<name>/`, while the built-in default profile remains `~/.hermes`. However, `ccusage`'s Hermes adapter only does this:

- If `HERMES_HOME` is set, split it by comma and read `<each>/state.db`.
- Otherwise, read only `~/.hermes/state.db`.

It does not scan `~/.hermes/profiles/*/state.db`, does not read Hermes `active_profile`, and has no `--hermes-path` option comparable to OpenClaw/pi options.

Local minimal repro:

- Created `HOME=/private/tmp/ccusage-hermes-profile-repro`.
- Added default DB: `.hermes/state.db`, one session, total = 150.
- Added named profile DB: `.hermes/profiles/work/state.db`, one session, total = 1,500.
- Ran `ccusage hermes session --json` without `HERMES_HOME`: result = 1 session, total = 150.
- Ran with `HERMES_HOME=<root>/.hermes,<root>/.hermes/profiles/work`: result = 2 sessions, total = 1,650.

So if the production host has active usage in non-default Hermes profiles and the sync daemon runs plain `ccusage --json --breakdown session`, those profile tokens are not ingested into this project's dashboard at all. This is an undercount bug, not an overcount bug.

Remote cortana-box status at review time:

- `find ~/.hermes -name state.db` returned only `/home/jason/.hermes/state.db`.
- `~/.hermes/profiles` did not exist on that host, so this specific host is not currently affected.

Recommended fix:

- Short-term operational workaround: set daemon environment `HERMES_HOME=/home/jason/.hermes,/home/jason/.hermes/profiles/<profile1>,...` on any machine using named Hermes profiles.
- Better project-side hardening: before spawning `ccusage`, detect `~/.hermes/profiles/*/state.db` and construct `HERMES_HOME` automatically if the user has not set it.
- Upstream fix: `ccusage` Hermes adapter should discover `~/.hermes/profiles/*/state.db` by default and/or add an explicit `--hermes-path` option.

### P1 - Hermes reasoning/extra tokens are dropped by project-side sync

Files:
- `packages/usage-daemons/ccusage-sync/index.ts:37`
- `packages/usage-daemons/ccusage-sync/index.ts:46`
- `packages/usage-daemons/ccusage-sync/index.ts:190`
- `packages/usage-daemons/ccusage-sync/index.ts:197`
- `packages/usage-daemons/ccusage-sync/index.ts:198`
- `packages/usage-daemons/ccusage-sync/index.ts:199`
- `packages/usage-daemons/ccusage-sync/index.ts:200`
- `supabase/migrations/0007_usage_daily_berlin_tz.sql:18`

`ccusage` 的总体 token 口径是 `input + output + cache_creation + cache_read + extra_total_tokens`。Hermes adapter 会把 `reasoning_tokens` 写入 `extra_total_tokens`，但 `ModelBreakdown` 在 JSON 中不会序列化这个字段。当前同步器只从 `modelBreakdowns` 读取 `inputTokens/outputTokens/cacheReadTokens/cacheCreationTokens`，完全没有读取 session-level `totalTokens` 与 breakdown sum 的差值。

远端实测：
- Hermes total = 11,841,197
- breakdown sum = 11,830,976
- dropped diff = 10,221

这个问题不会解释“用量很大”，因为它是少算，不是多算。但它会让 Hermes 总量与 `ccusage` UI/CLI 报告不一致。

Recommended fix:
- 最稳妥：给 `usage_events` 增加 `reasoning_tokens` 或 `extra_tokens` 字段，并把 `usage_daily.total_tokens` 改成包含该字段。
- 兼容性方案：同步器检测 `s.totalTokens - sum(modelBreakdowns)`，在单模型 session 中把 diff 记到 `output_tokens` 或新增一个 synthetic model row，并写清楚来源。多模型 session 需要明确分摊规则，不能静默丢弃。
- 加单测覆盖 Hermes `reasoning_tokens` / `extra_total_tokens`。

### P2 - Current dashboard metric is raw token traffic, not billable token usage

Files:
- `supabase/migrations/0007_usage_daily_berlin_tz.sql:18`
- `apps/web/src/components/home/token-preview.tsx:66`
- `packages/usage-daemons/openai-poller/index.ts:70`
- `packages/usage-daemons/anthropic-poller/index.ts:75`

`usage_daily.total_tokens` 当前计算为 `input_tokens + output_tokens + cache_read_tokens + cache_write_tokens`。这与 `ccusage` 的 raw token traffic 口径一致，也解释了为什么数值会很大：Claude、Codex、OpenClaw 的 cache read 都占绝大部分。

如果你想回答“实际消耗了多少上下文/模型处理量”，当前口径是合理的；如果你想回答“这相当于多少 billable usage / 真实花费”，当前 token 图会显著高于非缓存 input/output 口径。Spend 也不是完整账单口径，因为 org pollers 仍写 `cost_usd: 0`。

Recommended fix:
- UI 上拆成至少两个指标：`Raw tokens` 和 `Non-cache tokens`，Spend 标注为 estimated/known spend。
- 后续接入 OpenAI costs API 与 Anthropic cost report 后，再把 spend 当成账单级指标展示。

### P2 - No-timestamp Hermes/OpenCode API sessions have stable totals but approximate day attribution

Files:
- `packages/usage-daemons/ccusage-sync/index.ts:100`
- `packages/usage-daemons/ccusage-sync/index.ts:123`
- `packages/usage-daemons/ccusage-sync/index.ts:176`
- `packages/usage-daemons/ccusage-sync/state.ts:12`

当前逻辑会为没有可解析时间的 session 分配 first-seen timestamp，并持久化到 `~/.token-sync/state.json`。这避免了每小时重新落到 "now" 造成重复漂移，当前实现是合理的。

剩余风险是日归属不准确：远端 Hermes 有 9 个 `api-<hex>` session 没有嵌入时间，本机会看到 8 个 OpenCode 类 session 无可用时间。它们的总量不会因此重复，但会落在“首次同步看到它们”的那一天。历史回填或跨天 API-mode session 会影响 daily chart。

Recommended fix:
- 如果 Hermes/OpenCode 原始数据里可以拿到 started_at/created_at，优先从源头补时间。
- UI 或报告中把这类 fallback session 的数量暴露出来，避免误读单日峰值。

### P2 - Ingest schema still permits null session IDs for custom sources

Files:
- `apps/web/src/app/api/usage/ingest/route.ts:23`
- `apps/web/src/app/api/usage/ingest/route.ts:56`
- `supabase/migrations/0006_dedup_org_pollers.sql:21`
- `supabase/migrations/0006_dedup_org_pollers.sql:50`

已修复的 OpenAI/Anthropic poller 现在都会生成 deterministic non-null `session_id`，重复轮询不会再膨胀。数据库约束也已扩展为 `(source, session_id, model)`。

但 route schema 仍允许 `session_id: null`。Postgres unique constraint 仍会把 `NULL` 当成互不相等，所以任何未来 custom source 如果传 null，就可能恢复旧的重复插入问题。

Recommended fix:
- production ingest 直接拒绝 `session_id: null`，或按 source 类型走不同 schema。
- 如果必须兼容 null，增加表达式唯一索引或在 route 中为 null session 生成 deterministic id。

### P3 - Token calculation edge cases lack local automated tests

Files:
- `packages/usage-daemons/ccusage-sync/index.ts:100`
- `packages/usage-daemons/ccusage-sync/index.ts:161`
- `apps/web/src/lib/date/local-tz.ts:23`

`ccusage-sync` 目前没有测试覆盖高风险映射逻辑。建议至少覆盖：
- Codex `YYYY/MM/DD/...` period timestamp fallback。
- Hermes `YYYYMMDD_HHMMSS_...` period timestamp fallback。
- `api-<hex>` first-seen timestamp 持久化。
- multi-model session breakdown 合计。
- `totalTokens > sum(modelBreakdowns)` 时的 extra/reasoning token 处理。
- Berlin DST 边界下 `localDateNDaysAgo` 的滚动窗口是否仍是“本地日历天”，而不是固定 24h instant。

### Verified OK In This Follow-up

- 本机 Claude Code/Codex/OpenCode 的 `ccusage` session totals 与 breakdown 合计一致，未发现项目侧重复计算。
- 远端 OpenClaw totals 与 breakdown 合计一致，未发现 OpenClaw 自身或项目映射导致的重复计算。
- OpenAI/Anthropic org poller 的 deterministic `session_id` 已经解决早期 null-session 重复插入风险。
- 当前大 token 数主要由 cache read 驱动；这是当前 raw-token 口径的预期结果，不是导入层 double count。

References checked:
- `ccusage` v20.0.4 source tag: https://github.com/ryoppippi/ccusage/tree/v20.0.4
- Relevant source files reviewed locally from that tag: `rust/crates/ccusage/src/types.rs`, `utils.rs`, `adapter/all.rs`, `adapter/codex.rs`, `adapter/hermes.rs`, `adapter/openclaw.rs`.

## Original 2026-05-25 Findings (Historical)

The findings below are the original V1 review record. Token-usage findings that conflict with the 2026-05-28 addendum should be treated as superseded by the addendum above; several of the earlier usage-chain issues have since been fixed in code and migrations.

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
- 2026-05-28 Token Usage follow-up: compared local `ccusage` v20.0.4 session totals against model breakdown sums; mismatch = 0.
- 2026-05-28 Token Usage follow-up: compared remote cortana-box `ccusage` v20.0.4 session totals against model breakdown sums; OpenClaw/Codex/Claude mismatch = 0, Hermes diff = 10,221 reasoning/extra tokens.
- 2026-05-28 Token Usage follow-up: cloned and inspected `ryoppippi/ccusage` tag `v20.0.4` source locally to confirm cache and extra-token aggregation behavior.
- 2026-05-28 Hermes profile follow-up: inspected `ccusage` Hermes adapter source and Hermes Agent profile implementation; built a minimal two-DB repro proving named profiles are not counted unless `HERMES_HOME` explicitly includes each profile directory.

## Notes

This report is based on the current clean worktree at HEAD `8287b0e`. The recent usage dedup/window/timezone fixes are included in that HEAD and were reviewed as part of V1.

`docs/` is ignored by `.gitignore`, so this report file exists locally but will not appear in `git status` unless it is force-added or the ignore rule changes.
