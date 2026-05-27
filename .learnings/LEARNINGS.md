# Project Learnings — Personal Website (Next.js 16)

工程中冒出来的非显然知识，固化以免下次 phase 重新踩。

## LRN-001 · Next.js 16 移除 `next lint`

**问题**：`package.json` 里 `"lint": "next lint"` 在 Next 16 下报 `Invalid project directory provided, no such directory: .../lint`（把 lint 当成路径解析）。

**根因**：Next 16 移除了 `next lint` 子命令；`next build` 也不再自动跑 lint。

**做法**：脚本改为 `"lint": "eslint ."`。CI 流水线需要单独跑 lint。

**官方迁移说明**：`apps/web/node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`

---

## LRN-002 · Next.js 16 scaffold 忽略 `--src-dir false`

**问题**：用 `create-next-app@latest --src-dir false` 时，Next 16 仍把所有应用代码放入 `apps/web/src/`，`@/` 别名映射到 `./src/`。

**做法**：接受 src/ 结构。规划文档时所有应用文件路径都用 `apps/web/src/app/...` 和 `apps/web/src/lib/...`。config / tests / public 仍在 `apps/web/` 根下。

**含义**：任何后续 plan 写 `apps/web/components/` 都是错的，应是 `apps/web/src/components/`。

---

## LRN-003 · Tailwind v4 spacing scale 是动态的

**问题**：plan 用了 `py-18`，担心不存在。

**事实**：Tailwind v4 把 spacing 改成 `calc(var(--spacing) * n)`，任何整数 `n` 都自动生成对应 padding/margin。`py-18 = 4.5rem = 72px`、`py-30 = 7.5rem` 全部 valid。

**含义**：跟旧版 Tailwind 不一样，不再需要查 spacing 字典或写 arbitrary values。

---

## LRN-004 · Next.js 15+ 动态路由 `params` 是 Promise

**问题**：旧版本 `params` 是同步对象 `{ slug: string }`，Next 15+ 是 `Promise<{ slug: string }>`，要 await。

**做法**：

```tsx
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  // ...
}
```

`generateMetadata` 也要 async + await params。

---

## LRN-005 · pnpm 不在 PATH，用 corepack

**问题**：直接跑 `pnpm` 报 `command not found`。

**原因**：本机没全局装 pnpm；项目通过根 `package.json` 的 `"packageManager": "pnpm@9.15.0"` 声明，由 corepack 解析。

**做法**：所有 pnpm 命令前面加 `corepack`，例如 `corepack pnpm --filter web build`。subagent 拿不到提示就会瞎试，dispatch prompt 里要明确写。

---

## LRN-006 · apps/web/AGENTS.md 是 Next 16 的"读我"

**问题**：subagent 凭训练数据写 Next 代码，可能用 Next 15 之前的 API。

**事实**：`create-next-app@latest`（Next 16）会自动生成 `apps/web/AGENTS.md` 和 `CLAUDE.md`，指向 `apps/web/node_modules/next/dist/docs/01-app/`，要求 agent 写 Next 代码前先查那里的官方文档。

**做法**：所有 dispatch subagent 的 prompt 都要带一条：
> 写任何 Next-specific 代码（Link / Image / metadata / 动态路由 / ImageResponse 等）前，先查 `apps/web/node_modules/next/dist/docs/01-app/`。

---

## LRN-007 · subagent-driven-development 对纯模板批次性价比低

**观察**：Batch 4（7 个路由占位页）是纯模板复制，跑 implementer + spec reviewer + code reviewer 3 个 subagent 性价比很低（每个 reviewer 都是 token 大头）。

**做法**：
- 复杂 / 判断重的批次（设置工具链、设计 token、首次组件）→ 完整 3-step review
- 机械模板复制批次 → implementer + 控制层（我）做轻量 spot check 即可
- 全 phase 完成后做一次 holistic review

**取舍**：违反 skill 严格规定但符合用户"合理分配"的指令。

---

## LRN-008 · Spec 与 Plan 在 phase 中可能漂移

**观察**：Phase 1 执行过程中 IA 改了（timeline/tokens/hire-me 合并/重命名），但执行用的 plan 文件不应回填重写（那是历史记录）。

**做法**：
- Spec 永远反映"当前权威设计"，phase 间漂移时立即同步
- Plan 文件是"该 phase 怎么执行的"的历史记录，加 status header 标注变更指向 spec，但不大改正文
- 后续 phase 的 plan 直接用最新 spec 当输入

---

## LRN-009 · pnpm workspace 与 git init 顺序坑

**观察**：用 `pnpm dlx create-next-app` 之前如果根目录不是 git repo，scaffold 不会自动 init。但如果先 git init 再 scaffold，scaffold 创建的 .gitignore 与根 .gitignore 会重叠（apps/web/.gitignore 和根 .gitignore 都管 node_modules / .next）。

**做法**：保留两个 .gitignore，分工清晰：
- 根 .gitignore：跨工作区共用规则（.superpowers/、.env、pnpm-store）
- apps/web/.gitignore：Next.js scaffold 自带，保持原状

不要试图合并删除。

---

## LRN-010 · Notion SDK v5 + API 2025-09-03 用 data_source_id 而非 database_id

**问题**：用 `@notionhq/client` v5 调 `dataSources.query({ data_source_id: <DB_ID> })` 报 `invalid_request_url`。

**根因**：Notion 2025-09 引入了 **data sources** 概念，把可查询单位从 database 分离出来。SDK v5 移除了 `databases.query`，全部走 `dataSources.query`。data_source_id ≠ database_id：一个 database 包含一个或多个 data sources（简单情况下 1 个）。

**做法**：
1. notionVersion 设 `2025-09-03`（旧 `2022-06-28` 没这个端点）
2. 拿 data_source_id：`GET /v1/databases/{db_id}` → 响应里的 `data_sources[0].id`
3. env vars 命名用 `NOTION_DS_*` 不用 `NOTION_DB_*`，避免后续维护混淆

**含义**：所有 Notion 集成项目升 v5 都要做一次 ID 重新收集。

---

## LRN-011 · Next.js 16 禁止 Server Component 里 `dynamic(..., { ssr: false })`

**问题**：在 Server Component（如 `app/projects/[slug]/page.tsx`）里 `dynamic(() => import(...), { ssr: false })` 编译报错 `ssr: false is not allowed with next/dynamic in Server Components`。

**根因**：Next 16 App Router 强约束 —— `ssr:false` 是客户端边界控制语义，必须在 client component 里用。

**做法**：建一个 thin client wrapper：
```tsx
// loader.tsx
'use client';
import dynamic from 'next/dynamic';
export const Heavy = dynamic(() => import('./heavy'), { ssr: false });
```
Server Component 引用 wrapper。运行时行为不变（heavy 代码仍 client-only），架构上更清晰。

---

## LRN-012 · pnpm workspace `type: "module"` 的 TS 导入要加 `.js` 后缀

**问题**：`packages/usage-daemons` package.json 里 `"type": "module"`，TS 文件之间相对 import 写 `from './shared/env'` 跑 tsx 会报模块找不到。

**根因**：ESM resolution 严格——必须带扩展名。TS 编译时 .ts 文件目标 .js，所以源里写 `.js` 后缀是惯用法。

**做法**：源代码里写 `from './shared/env.js'`（即使源文件是 .ts）。tsx 和 tsc 都能识别这种"虚扩展名"指向同名 .ts。

---

## LRN-013 · Zod v4 错误消息结构变了

**问题**：Zod v3 的 `error.message` 字符串里带字段名；v4 不带，只在 `error.issues[i].path` 里有。

**做法**：用 `safeParse`，失败时手动 join `result.error.issues.map(i => i.path.join('.'))` 构造错误消息。

---

## LRN-014 · Next 16 sitemap / robots / opengraph-image 用文件约定

**做法**：在 `app/` 下放：
- `sitemap.ts` → 自动生成 `/sitemap.xml`（导出 default 函数返回 `MetadataRoute.Sitemap`）
- `robots.ts` → 自动生成 `/robots.txt`
- `opengraph-image.tsx` → 任意路由级别 OG 图（用 next/og 的 ImageResponse）

不需要手写 API route。`runtime = 'edge'` + ImageResponse 标配。

---

## LRN-015 · Supabase SQL Editor 默认 read-only 模式静默拒绝 DDL

**问题**：用户在 Supabase Dashboard SQL Editor 粘贴 `CREATE TABLE` 后点 Run，UI 显示像跑成功了（没有红色错误弹窗），但实际报 `25006: cannot execute CREATE TABLE in a read-only transaction`，并且任何后续 view / 关联表全部失败。Checklist 被错误地勾选为"已完成"。

**根因**：Supabase Dashboard SQL Editor 有"Read-only"模式开关，**默认开启**。所有 DDL（CREATE / ALTER / DROP）+ DML（INSERT/UPDATE/DELETE）都被拒。错误消息容易被忽略——很多用户以为运行成功了。

**做法**：
1. 跑 migration 前先关 SQL Editor 顶部的 "Read-only" 开关
2. 跑完后用 `SELECT table_name FROM information_schema.tables WHERE table_schema='public'` 验证表确实建好了
3. PHASE4_CHECKLIST 已更新加这条 hint

---

## LRN-016 · Supabase 复制的 Project URL 可能含 `/rest/v1/` 路径

**问题**：用户从 Supabase Dashboard 复制 Project URL 时，可能复制成 `https://xxx.supabase.co/rest/v1/`（含 REST API 路径），结果后端 supabase-js 拼接成 `https://xxx.supabase.co/rest/v1//rest/v1/usage_events`，PostgREST 返回 `PGRST125: Invalid path specified in request URL`。

**根因**：Dashboard UI 把 "Project URL" 显示在 "Data API" tab 下，旁边还有可点的链接片段——容易复制错。

**做法**：env loader 应该 strip 末尾的 `/rest/v1/` 和 trailing slash。或文档里强调 SUPABASE_URL 只填裸 origin。

---

## LRN-017 · Notion / ccusage / OpenClaw / Hermes 之间的 token 用量追踪关系

**事实**（2026-05-25 经实测确认）：

- **ccusage v20+** 原生支持识别多个 AI agent CLI：
  - `agent: 'claude'` — Claude Code（`~/.claude/projects/*.jsonl`）
  - `agent: 'codex'` — Codex CLI（`~/.codex/*`）
  - `agent: 'opencode'` — sst/opencode（`~/.opencode/*`，注意是 sst/opencode 不是 OpenClaw）
  - `agent: 'openclaw'` — OpenClaw（openclaw/openclaw，~/.openclaw/lcm.db）
  - `agent: 'hermes'` — Hermes Agent（NousResearch/hermes-agent，`~/.hermes/*`）

- **订阅模式**（Claude Max / ChatGPT Pro / Codex sub）的实际消耗**不通过** Anthropic / OpenAI 的 Admin Usage API 暴露——它们只统计 per-token billing。所有订阅用量必须通过本地 CLI 日志（ccusage）才能拿到。

- ccusage 给出的 `cost_usd` 对订阅用户是"假如按 API 计费的等价值"——这是订阅 ROI 指标，对个人 IP 网站是更有意义的展示数字。

**含义**：Phase 4 daemon 架构大幅简化——单一 ccusage-sync 已经能搜集所有 4 个 agent 的数据，**完全不需要写 OpenClaw / Hermes plugin**。

---

## LRN-018 · tsx 不自动 dotenv；用 Node 22+ 原生 `--env-file-if-exists`

**问题**：`tsx daemon.ts` 不自动加载同目录 `.env`，daemon 启动时 `process.env.INGEST_URL` 是 undefined。

**做法**：package.json script 改成 `tsx --env-file-if-exists=.env daemon.ts`。Node 22+ 原生支持 `--env-file` 和 `--env-file-if-exists`，tsx 透传 Node 旗。`-if-exists` 变体避免 CI 等无 .env 环境报错。

---

## LRN-019 · ccusage `total_tokens` 必须包含 cache tokens

**问题**：物化视图 `usage_daily.total_tokens = SUM(input + output)` 看起来天经地义但**严重低估** Claude Code 类 agent 的真实用量。

实测对比同一个 session：
- ccusage 报告：302M tokens / $220.98
- DB 物化视图：697K tokens / $220.98 ← **433× 低估**

**根因**：Claude Code 默认开启 prompt cache，每次请求 cache_read_tokens 可以是 input_tokens 的 100-1000 倍。Anthropic 计费 cache_read 按 input 的 10% 算 → cost 算对了；但 token 总量必须把 cache_read + cache_write 加进去才反映真实用量。

**做法**：
```sql
SUM(input_tokens + output_tokens + cache_read_tokens + cache_write_tokens) AS total_tokens
```
同时单独暴露 `cache_read_tokens` / `cache_write_tokens` 列，未来可以做 cache-hit 比例分析。

**含义**：任何接 ccusage / Claude API / Anthropic SDK 的项目，统计 tokens 时**必须算 cache token**，不然会 100-500× 低估。

---

## LRN-020 · Next.js Server Component → Client Component 的滚动+归一化模式

**问题**：bar chart 滚动时按"当前可见窗口"重新归一化 Y 轴。Server-rendered HTML 是静态的，无法响应 scroll 事件。

**做法**：拆成两层：
- 父组件 `TokenPreview` (server) — fetch data + KPI + legend
- 子组件 `TokenChart` (client, `'use client'`) — 接 `daily: DailyPoint[]` 数据 prop，自己持有 `scrollLeft → visStart` 状态，render bars with normalized heights

scroll 监听用 rAF 节流：
```ts
useEffect(() => {
  const el = scrollRef.current;
  if (!el) return;
  let ticking = false;
  const update = () => {
    const start = Math.floor(el.scrollLeft / (BAR_WIDTH + BAR_GAP));
    setVisStart(start);
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  };
  el.addEventListener('scroll', onScroll, { passive: true });
  return () => el.removeEventListener('scroll', onScroll);
}, []);
```

每次 scroll 重渲染 bars，CSS `transition` 让高度动画过渡。Slot 宽度（BAR + GAP）需要固定，便于计算 visStart。

---

## LRN-021 · UNIQUE 约束不能包含累积计数字段

**问题**：dedup 约束 `(session_id, ts, model, input_tokens, output_tokens)` 看起来很严密，但实际**让相同 session 被多次插入**。

**根因**：ccusage（以及大多数 LLM 日志统计工具）每次跑都返回**累积计数**——同一个进行中的 session 在第 1 小时是 (i=1000, o=500)，第 2 小时变成 (i=1500, o=800)。约束里有 input/output → 主键变 → 触发 INSERT 而不是 ON CONFLICT。后果：N 次 sync = N 倍数据。

**实测影响**：长时间运行的 Claude Code session 被算 3-6 次，**总账膨胀 50%+**。

**做法**：dedup 约束**只能含稳定 ID**（session_id + model 这种永不变的字段）。计数列必须用 UPSERT-replace 模式（`ignoreDuplicates: false` + 新数据覆盖旧的）。

```sql
-- 错误
UNIQUE (session_id, ts, model, input_tokens, output_tokens)
-- 正确
UNIQUE (session_id, model)
-- + Supabase: .upsert(events, { onConflict: 'session_id,model' /* no ignoreDuplicates */ })
```

**含义**：任何 cumulative counter 数据源（ccusage、网络流量、subscription usage），dedup key 都要严格剔除"会变的字段"。

---

## LRN-022 · 时间窗口 `Date.now() - N*day` 包含 N+1 个日历日

**问题**：要"过去 7 天"，写 `Date.now() - 7 * 86400_000` 然后 `WHERE day >= start` —— 实际包含 **8** 个日历日（含今天）。

**实测**：今天 5/25 18:00 UTC，`Date.now() - 7*86400000` = 5/18 18:00 UTC → ISO date string `"2026-05-18"`。`day >= "2026-05-18"` 包含 5/18, 5/19, ..., 5/25 = 8 天。

**做法**：要"过去 N 天含今天"，用 `(days - 1)`：
```ts
const windowStart = new Date(Date.now() - (days - 1) * 86400_000);
```

**含义**：所有滑动窗口的 cutoff 计算要明确说"含 N 个日历日（含今天）"或"距今 N 天前的同一时刻"，二者算法不同。

---

## LRN-023 · 数据库日期截断 TZ 必须跟 client 日期算法 TZ 一致

**问题**：物化视图用 `DATE_TRUNC('day', ts AT TIME ZONE 'Asia/Shanghai')` 存 day 列，但 client 端 `Date.now().toISOString().slice(0, 10)` 拿 UTC 日期。

**结果**：UTC 16:00-23:59 是 Shanghai 次日 00:00-07:59。这 8 小时内任何 client 端"今天"是 UTC date X，但 DB `day` 列是 X+1。`dailyMap.get(dayStr)` miss、`.gte('day', ...)` 漏行。

**做法**：跨 TZ 的 day 字符串，必须用同一个 TZ 算：
```ts
function shanghaiDateStr(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(d);
}
```
`en-CA` locale 输出格式正好是 `YYYY-MM-DD`，方便。

**含义**：DB 端做了 TZ truncation 的设计，所有 client 端 day 数学都要在同一个 TZ 里做。检查所有 `.toISOString().slice(0, 10)` 调用是否合理。

---

## LRN-024 · `Supabase upsert ignoreDuplicates: true` 静默吞掉成功插入

**问题**：用 `ignoreDuplicates: true` 时，PostgREST 返回 `data: []` （即使真的有新行插入）。代码用 `data.length === 0` 当作"无新数据"信号 → 跳过后续动作（如刷新物化视图）。

**做法**：要么改用 `ignoreDuplicates: false`（UPSERT-replace 默认行为，data 含被影响行）；要么不依赖 data.length 判断是否有插入，改用别的信号。

---

## LRN-025 · Postgres `UNIQUE` 对 NULL 不视为相等 → "看似有约束实则零拦截"

**问题**：`ALTER TABLE usage_events ADD CONSTRAINT ... UNIQUE (session_id, model)`。代码上每次 24h 滚动 poll 都重新 UPSERT 同一批 (ts, model) bucket，预期被去重。实际：org pollers 用 `session_id: null`，因此每次 poll 又 insert 一份新行，物化视图被持续放大。

**根因**：Postgres 标准把 `NULL` 视为"未知"，因此 `(NULL, 'gpt-4o') ≠ (NULL, 'gpt-4o')`，约束放行。

**做法**：要么 PG15+ 用 `UNIQUE NULLS NOT DISTINCT (...)`，要么所有源都强制非 null —— 用确定性 ID 如 `<provider>-org:<unix_epoch_seconds>:<model>`。本项目选后者并配合迁移 0006 把历史 NULL 行 dedup + 回填。

**含义**：任何 UPSERT 设计如果 conflict 列里可能出现 NULL，先想清楚 Postgres 的 NULL 语义。检查 supabase `.upsert({ onConflict })` 用到的列是否都 NOT NULL。

---

## LRN-026 · `.upsert(...).select('id')` 同时返回 insert 和 update 行

**问题**：旧 ingest API 报告 `inserted = data.length; skipped_duplicates = events.length - inserted`。改成 UPSERT-replace 后 `data` 长度永远 ≈ events.length，`skipped_duplicates` 总是 0，daemon 日志失真。

**根因**：UPSERT 没有"skip" —— conflict 时是 update。`.select('id')` 返回的是"被影响的行"，包含 insert 与 update。

**做法**：字段重命名为 `affected` 表达 UPSERT 语义。如果一定要区分 insert vs update，需要用 `xmin = txid_current()::text::xid` 或 `RETURNING (xmax = 0) AS inserted` 这类技巧（PostgREST 难支持）。

**含义**：UPSERT 的可观测性比 INSERT IGNORE 弱，重要的统计指标改用 daemon 端 dry-run 比对，而不是依赖 ingest 响应。

---

## LRN-027 · `next/image` host 必须 allowlist，Notion external image 会运行时崩页

**问题**：Notion image block 的 `external.url` 可以是任意 host。若该 host 不在 `next.config.ts` 的 `images.remotePatterns` 里，`<Image src={url} />` 在渲染时抛错，整个页面 500。

**根因**：Next.js 强制要求远程图片的 host 显式列出，未列出时不走优化器、直接拒绝。错误是运行时的，不是构建期。

**做法**：渲染前先用 `isAllowedImageHost(url)` 校验，未在白名单则降级为纯链接（`safeHref` 后的 `<a>`）。`safe-url.ts` 与 `next.config.ts` 必须保持同步，加注释提醒。

**含义**：任何来自 CMS / 用户输入的 URL，进入 `<Image>` 之前都要 allowlist；同理任何 href 都要 scheme allowlist（`http/https/mailto/tel`），防御 `javascript:` 注入。

---

## LRN-028 · Notion select 字段 `as UnionType` 会撞 select 改名

**问题**：`type: (parseSelect(...) ?? 'Skill') as ResumeType` 直接断言成 union 类型，再 `bundle[item.type.toLowerCase()].push(...)`。Notion 上把 select 选项 "Experience" 改成 "Experiences"，TypeScript 编译期看不见，运行时 `bundle.experiences = undefined`，整页崩。

**根因**：`as` 是无运行时检查的强转。Notion 的 select 可以被随时改名 / 新增，CMS 与代码之间没有 schema lock。

**做法**：写 `parseEnum(value, allowed, fallback, fieldName?)` 在解析阶段 fail-soft —— 不在 allow list 就 fallback + `console.warn`。所有 Notion select 都走它，把"未知值"挡在数据层。

**含义**：把 Notion 当成 CMS 时，每个 select / status / tag-with-grouping 都是潜在的 schema break point。`as X` 替换成显式 enum 验证 + tests，CMS 改 schema 不再有静默页面崩溃风险。

---

## LRN-029 · ccusage "api-mode" session 既无 lastActivity 也无可解析 period

**问题**：Hermes 的网关/代理调用在 ccusage 输出里 `period = "api-<hex>"`、`metadata` 字段直接缺失。`ccusage-sync` 的 `tsForSession` 三个解析分支（lastActivity / codex `YYYY/MM/DD` / hermes `YYYYMMDD_HHMMSS_`）全部失败，整条 session 被静默 skip，token + cost 都丢。

**根因**：ccusage 对 stateless API gateway 请求只记录 token 计数，不存时间。文件系统上也没有对应 `session_*.json` 可借 mtime —— 这类调用是无状态的，没有 session 文件。

**做法**：在 `state.json` 里维护 `firstSeenTs: Record<sessionId, isoString>` 持久化映射。`toEvents` 拿不到 ts 时：
1. 查 `firstSeenTs[sessionId]` —— 有就用（稳定，跨 daemon 运行不变）
2. 否则用 `now()`，并写回 state，下次复用

**含义**：合成时间戳的核心要求是"稳定"——绝不能每次 daemon 运行都重新算"now"，否则同一个真实历史 session 的 token 会在图上一天一天往前漂。把 first-seen 持久化是最小代价的稳定性保证。

**位置**：`packages/usage-daemons/ccusage-sync/{state.ts, index.ts}`

---

## LRN-030 · ESLint `react-hooks/error-boundaries`: 不能在 try/catch 里构造 JSX

**问题**：写 `async function ChildDatabase()` 时把 `try { ... return <table>{rows.map...} } catch { ... }` 全包在一起，ESLint 报 9 个 `react-hooks/error-boundaries` 错误。

**根因**：JSX 是惰性渲染的——`return <Component />` 只是创建一个 React element 对象，真正 render 发生在 React 树调度时。彼时 try/catch 早就 popped out 了，渲染错误根本不会被那个 catch 抓住。规则强制把 fetch（同步可抓）和 render（惰性，需 error boundary 兜底）拆开。

**做法**：把 try/catch 限制在数据 fetch 函数里，返回一个 discriminated union `{kind: 'ok'|'empty'|'error', ...}`；调用方 await 拿到结果后再无 try/catch 地渲染 JSX：

```ts
async function fetchData(): Promise<{kind: 'ok'|'error', ...}> {
  try { return {kind: 'ok', data: ...} } catch { return {kind: 'error', message: ...} }
}
async function Component() {
  const r = await fetchData();
  if (r.kind === 'error') return <Fallback />;
  return <DataTable data={r.data} />;
}
```

**含义**：所有 async server component 里需要"fetch 可能失败、UI 要兜底"的场景，都走这个 fetch→union→render 的模式。

---

## LRN-031 · Notion API SDK v2025-09 `databases.retrieve` 返回 `data_sources[]`

**问题**：早期 Notion SDK 直接用 `database_id` 查 rows。新版本必须先拿 `data_source_id`。文档变化但很多教程没更新，第一次接触时容易卡。

**做法**：
```ts
const db = await client.databases.retrieve({ database_id });
// db.data_sources 是个数组，每个 db 至少一个 data source
const resp = await client.dataSources.query({
  data_source_id: db.data_sources[0].id,
  ...
});
```

**含义**：所有 `child_database` block / inline DB 渲染都要走这个二段式查询。可以缓存 `data_source_id` 减少一次 RTT。

---

## LRN-032 · Notion column_list / column 的 width_ratio 路径会因 API 版本不同

**问题**：实现 column 布局时不确定 ratio 字段叫什么。

**做法**：
- 官方 API (2025-09)：`block.column.width_ratio`
- SPA 内部 dump：`block.column_ratio`（顶层）或 `block.column.column_ratio`
- 缺失时用 `1 / N` 等分

**含义**：渲染 column 时双 fallback：`col.width_ratio ?? col.column_ratio ?? 0`，然后总和归一化。零值就走等分分支，永远不能产生 0% width 的 flex item（会塌成不可见列）。

---

## LRN-033 · Notion DB row 的 body = 一个完整 Notion 页，可以塞任意 block

**问题**：简历 DB schema 要不要给 "工作经历的 bullet 详情"加 Description rich_text 字段？Markdown 编辑体验差。

**关键洞察**：Notion 里每一条 DB row 本身就是 page，有自己的 `content / children`，可以放任何 block —— bullet / callout / code / image / column。"properties" 是结构化元数据，"body" 是自由文档。

**做法**：
- properties 装"能查询 / 能筛选 / 能导出 JSON"的结构化字段（Type / Tags / Org / FocusArea / Level / RepoUrl …）
- bullet 详情 / 长内容塞进每行的 body（用 `pages.create({ ..., children })` 一次性写入；后续编辑直接在 Notion row 里像写文档）
- 渲染端对需要 body 的类型并行 `getBlockChildren(row.id)`，套 NotionBlocks 渲染

**含义**：DB-driven CMS 不必把所有内容硬塞进 properties。"properties = 结构 / body = 内容"这个分工让结构化筛选和自由排版兼得。Resume / 任何"列表中每项又是一份小文档"的场景都适用。

---

## LRN-034 · Notion parser 必须默认对 undefined property 容忍

**问题**：扩展 schema 加新列后，老 row 不带新 property → 解析器读 `(prop as ...).select` 时 prop 是 undefined，整页崩。

**根因**：Notion API 返回的 `properties` map 只包含**显式被设过值**的列；老 row 在新列上没值则该 key 直接缺失，不是 null。

**做法**：所有 `parseX(prop: NotionProperty | undefined)` 在第一行 `if (!prop) return defaultValue` 兜底。

**含义**：Schema migration 永远是单向的 —— 加一列不会回填老 row。任何"新列被全行使用"的假设都是错的，parser 必须独立于 schema 历史。这条比想象中常被忽略，加新字段时一定要回头加 null guard。

---

## 添加新 learning 的格式

```markdown
## LRN-NNN · 简短标题

**问题**：现象 / 错误
**根因**：底层原因
**做法**：怎么解决
**含义**（可选）：对后续工作的影响
```
