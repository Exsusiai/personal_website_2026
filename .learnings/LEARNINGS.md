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

## 添加新 learning 的格式

```markdown
## LRN-NNN · 简短标题

**问题**：现象 / 错误
**根因**：底层原因
**做法**：怎么解决
**含义**（可选）：对后续工作的影响
```
