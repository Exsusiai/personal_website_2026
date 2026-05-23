# Phase 2: Notion CMS Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement Part B task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Part A requires manual user work in Notion's web UI; cannot be delegated to subagents.

**Goal:** 让网站所有内容页从 Notion 拉真实数据渲染。覆盖：5 个 database（projects / thinking / resume / uses / timeline）+ 3 个 page（about / now / contact），自写 Notion Block Renderer 支持 MVP block 类型，所有 8 个内容路由（含 timeline-as-section-in-about）接入。

**Architecture:** 
- `lib/cms/*` 作为唯一 Notion 访问层；Server Components 直接调用，不经 client
- 每个 database 一个 `cms/<entity>.ts`，提供 list + getBySlug 等函数
- 富文本通过自写 `<NotionBlockRenderer>` 渲染，不引入 react-notion-x（避免样式失控）
- 图片走 MVP 代理（`next/image` + `remotePatterns` 配置 Notion 域名 + 5min ISR）；R2 持久化代理留到 Phase 5
- 所有页面 `revalidate: 300`（5min ISR）

**Tech Stack:** `@notionhq/client` (Notion 官方 SDK), shiki (代码高亮，构建期), zod (env + Notion 响应验证), 现有 Tailwind v4 + R19 + Next 16 栈不变。

**Branch Strategy:** 从 `main` 起步 — `git checkout main && git checkout -b phase2-notion-cms`。所有 task commit 落到该分支，Phase 2 完成后合并回 main + tag。

**TDD Adaptation（同 Phase 1）:**
- 数据访问层（cms/*）：纯逻辑，严格 TDD with mocked Notion responses（fixture-based）
- Block Renderer：先写 fixture-driven snapshot + smoke test，再实现
- 页面：手动 dev server 验证 + 端到端真实 Notion 拉取

---

## File Structure

```
apps/web/src/
├── app/
│   ├── about/page.tsx                # 改：拉 about page + timeline DB
│   ├── now/page.tsx                  # 改：拉 now page
│   ├── contact/page.tsx              # 改：拉 contact page
│   ├── uses/page.tsx                 # 改：拉 uses DB（按 category 分组）
│   ├── resume/page.tsx               # 改：拉 resume DB（按 type 分组）
│   ├── projects/page.tsx             # 改：拉 projects DB
│   ├── projects/[slug]/page.tsx      # 改：拉 project by slug + 渲染富文本
│   ├── thinking/page.tsx             # 改：拉 thinking DB
│   ├── thinking/[slug]/page.tsx      # 改：拉 article by slug + 渲染富文本
│   ├── page.tsx                      # 改：Featured 和 Thinking 拉真数据
│   └── api/
│       └── notion-image/route.ts     # 新：MVP 不需要，留占位待 Phase 5
├── components/
│   ├── home/
│   │   ├── featured-projects.tsx     # 改：接受 projects prop，删占位常量
│   │   └── thinking-list.tsx         # 改：接受 articles prop
│   ├── notion/
│   │   ├── rich-text.tsx             # 新：渲染 rich_text[] spans
│   │   ├── rich-text.test.tsx        # 新
│   │   ├── notion-block.tsx          # 新：单个 block 类型分发
│   │   ├── notion-block.test.tsx     # 新
│   │   ├── notion-blocks.tsx         # 新：列表 + 嵌套处理
│   │   ├── notion-blocks.test.tsx    # 新
│   │   ├── code-block.tsx            # 新：shiki 高亮
│   │   └── callout.tsx               # 新
│   ├── timeline/
│   │   └── timeline-section.tsx      # 新：嵌入 About 页
│   ├── resume/
│   │   └── resume-section.tsx        # 新：按 type 分组渲染
│   ├── uses/
│   │   └── uses-section.tsx          # 新：按 category 分组
│   ├── projects/
│   │   └── project-meta.tsx          # 新：项目详情页的元信息卡（slug/year/stack/repo/demo）
│   └── ui/
│       └── empty-state.tsx           # 新：Notion 未配置时友好回退
├── lib/
│   ├── env.ts                        # 新：zod 校验 process.env
│   ├── cms/
│   │   ├── notion-client.ts          # 新：单例 + 重试 + 速率限制 backoff
│   │   ├── types.ts                  # 新：所有 entity 类型 + Notion 响应解析
│   │   ├── parsers.ts                # 新：Notion property → 应用类型
│   │   ├── parsers.test.ts           # 新
│   │   ├── projects.ts               # 新
│   │   ├── projects.test.ts          # 新
│   │   ├── thinking.ts               # 新
│   │   ├── thinking.test.ts          # 新
│   │   ├── resume.ts                 # 新
│   │   ├── uses.ts                   # 新
│   │   ├── timeline.ts               # 新
│   │   ├── pages.ts                  # 新：通用 page body fetch
│   │   ├── blocks.ts                 # 新：通用 block tree fetch（含子块）
│   │   └── reading-time.ts           # 新：根据 blocks 估算阅读时长
│   └── ...
└── tests/
    └── fixtures/
        └── notion/                    # 新：Notion API mock 数据
            ├── projects-list.json
            ├── project-detail.json
            ├── thinking-list.json
            ├── article-blocks.json
            ├── resume-list.json
            ├── timeline-list.json
            ├── uses-list.json
            ├── about-blocks.json
            ├── now-blocks.json
            └── contact-blocks.json
```

---

# Part A · User Prerequisites (你手动做)

下面这些步骤需要你在 Notion web UI 完成。一次性投入 30-60 分钟。完成后填好 `.env.local`，subagent 才能跑通 Part B。

## A.1 创建 Notion Integration

- [ ] 访问 <https://www.notion.so/profile/integrations>
- [ ] 点 "New integration" → 名字填 `Personal Website (Local)`，关联到你的 workspace
- [ ] 类型选 **Internal**（不需要 public OAuth）
- [ ] Capabilities 勾选：`Read content`、`Read user information without email`
- [ ] 创建后保存 token（形如 `secret_xxxx...`）到本地 `.env.local` 的 `NOTION_TOKEN`

## A.2 创建工作区根页面

- [ ] 在 Notion 创建一个 page 叫 `Personal Website CMS`（用作所有 CMS 内容的容器）
- [ ] 右上角 ··· → Connections → 选刚才创建的 integration（这样下面所有子页/数据库都自动继承权限）

## A.3 创建 5 个 Database

在 `Personal Website CMS` 页面下，依次创建 5 个 inline database。每个 database 的字段必须**严格匹配**下面的 schema（subagent 解析 Notion 响应时按字段名硬绑定）。

### A.3.1 `projects` Database

| Field | Type | Notes |
|---|---|---|
| Title | Title | 项目名 |
| Slug | Text | URL slug，唯一，不含空格（如 `finance-tracker`） |
| Type | Select | 选项：`Software` / `Mechanical` / `AI` / `Other` |
| Status | Select | 选项：`Active` / `Archived` / `Draft` |
| Year | Number | 整数 |
| Summary | Text | 卡片描述，< 200 字 |
| Cover | Files & media | 卡片封面，1 张图 |
| Tags | Multi-select | 任意标签 |
| Stack | Multi-select | 技术栈，如 FastAPI / Postgres |
| RepoURL | URL | 可空 |
| DemoURL | URL | 可空 |
| ModelGLB_URL | URL | 可空，Phase 3 使用 |
| Featured | Checkbox | 是否首页精选 |
| Published | Checkbox | 是否发布 |
| Order | Number | 显式排序，越小越前 |

**先填 3 条 seed**：复制 Phase 1 占位的 finance-tracker / desktop-arm / ecc-agent-workflow 3 个项目。Published 勾上，Featured 勾上，Order 分别 1/2/3。

### A.3.2 `thinking` Database

| Field | Type |
|---|---|
| Title | Title |
| Slug | Text |
| Tags | Multi-select |
| Summary | Text |
| Cover | Files & media（可空） |
| Published | Checkbox |
| PublishedDate | Date |
| ReadTime | Number（手填或代码自动算，先建好字段） |

**先填 1 条 seed**：写一篇 200-500 字的真实业务思考（任何主题）。Published 勾上。

### A.3.3 `resume` Database

| Field | Type | Notes |
|---|---|---|
| Type | Select | 选项：`Experience` / `Education` / `Skill` / `Award` |
| Title | Title | 职位 / 学位 / 技能名 |
| Org | Text | 公司 / 学校 / 颁发机构 |
| Location | Text | 可空 |
| StartDate | Date | |
| EndDate | Date | 可空（在职 / 当前） |
| Tags | Multi-select | 可空 |
| Order | Number | 同 type 内排序 |

**先填 seed**：至少 2 条 Experience + 1 条 Education + 5 条 Skill。

### A.3.4 `uses` Database

| Field | Type | Notes |
|---|---|---|
| Title | Title | 设备 / 软件 / 服务名 |
| Category | Select | 选项：`Hardware` / `Software` / `Service` |
| Subcategory | Select | 如 `Computer` / `Editor` / `IDE` / `Tool` |
| Brand | Text | 可空 |
| Note | Text | 可空，使用心得 |
| URL | URL | 可空 |
| YearStarted | Number | 开始使用的年份 |

**先填 seed**：至少 8 条覆盖你的真实开发栈。

### A.3.5 `timeline` Database

| Field | Type | Notes |
|---|---|---|
| Year | Number | 必填 |
| Month | Number | 可空 |
| Title | Title | 事件标题 |
| Type | Select | 选项：`Career` / `Education` / `Project` / `Personal` / `Milestone` |
| Cover | Files & media | 可空 |
| Order | Number | 同年份内排序 |

**先填 seed**：4-6 条覆盖近 3 年里程碑。

## A.4 创建 3 个 Page

在 `Personal Website CMS` 页面下，创建 3 个普通 page（非 database），名字精确为：

- [ ] `About` — 内容：你的自我介绍长文（300-800 字，可插入图片）
- [ ] `Now` — 内容：当下在忙什么（100-300 字，月度更新）
- [ ] `Contact` — 内容：联系方式说明（邮箱 / 社交链接 / 二维码 / 合作意向）

每个 page 自然写作即可，subagent 自带的 Block Renderer 会渲染。

## A.5 收集 ID 填 .env.local

每个 database 和 page 都需要拿 ID 填到 `apps/web/.env.local`。

**拿 Database ID**：在 Notion 里打开该 database 为 full page → 复制浏览器地址栏 URL。形如 `https://www.notion.so/workspace/abc123def456...?v=xxx`。**Database ID 是 URL 里 `?v=` 之前那 32 位字符串**（去掉中间的 `-`）。

**拿 Page ID**：打开 page → 复制 URL → 取 `?` 之前最后一段 32 位字符串。

填到 `apps/web/.env.local`（这个文件 git 忽略，仅本地）：

```bash
# 复制 apps/web/.env.example 为 apps/web/.env.local，填以下值
NOTION_TOKEN=secret_xxx
NOTION_DB_PROJECTS=abc123...
NOTION_DB_THINKING=abc123...
NOTION_DB_RESUME=abc123...
NOTION_DB_USES=abc123...
NOTION_DB_TIMELINE=abc123...
NOTION_PAGE_ABOUT=abc123...
NOTION_PAGE_NOW=abc123...
NOTION_PAGE_CONTACT=abc123...

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## A.6 通报 subagent

完成 A.1–A.5 后，告诉 controller："Notion 准备完毕"。我会启动 Part B。Part B 不会动 Notion 内容，但需要 .env.local 才能跑通端到端验证。

---

# Part B · 代码实现（subagent 友好）

## Batch 1: Foundation + Env + Notion Client

### Task B1: 安装 Phase 2 依赖

**Files:** `apps/web/package.json`

- [ ] **Step 1** Run from `/Users/jason/Project/personal_website_new`:

```bash
corepack pnpm --filter web add @notionhq/client zod
corepack pnpm --filter web add -D shiki
```

- [ ] **Step 2** Verify `apps/web/package.json` `dependencies` now has `@notionhq/client`, `zod`; `devDependencies` has `shiki`.

- [ ] **Step 3** Commit:
```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(phase2): install @notionhq/client, zod, shiki"
```

### Task B2: 环境变量校验 `lib/env.ts`

**Files:** `apps/web/src/lib/env.ts` (new), `apps/web/src/lib/env.test.ts` (new)

- [ ] **Step 1 — failing test first** Create `apps/web/src/lib/env.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('env validation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('parses valid env', async () => {
    process.env.NOTION_TOKEN = 'secret_test';
    process.env.NOTION_DB_PROJECTS = 'a'.repeat(32);
    process.env.NOTION_DB_THINKING = 'a'.repeat(32);
    process.env.NOTION_DB_RESUME = 'a'.repeat(32);
    process.env.NOTION_DB_USES = 'a'.repeat(32);
    process.env.NOTION_DB_TIMELINE = 'a'.repeat(32);
    process.env.NOTION_PAGE_ABOUT = 'a'.repeat(32);
    process.env.NOTION_PAGE_NOW = 'a'.repeat(32);
    process.env.NOTION_PAGE_CONTACT = 'a'.repeat(32);
    const { getEnv } = await import('./env');
    const env = getEnv();
    expect(env.NOTION_TOKEN).toBe('secret_test');
    expect(env.NOTION_DB_PROJECTS).toHaveLength(32);
  });

  it('throws on missing token', async () => {
    delete process.env.NOTION_TOKEN;
    const { getEnv } = await import('./env');
    expect(() => getEnv()).toThrow(/NOTION_TOKEN/);
  });
});
```

- [ ] **Step 2** Run `corepack pnpm --filter web test`, expect failure (module not found).

- [ ] **Step 3 — impl** Create `apps/web/src/lib/env.ts`:

```ts
import { z } from 'zod';

const envSchema = z.object({
  NOTION_TOKEN: z.string().min(1, 'NOTION_TOKEN required'),
  NOTION_DB_PROJECTS: z.string().min(32),
  NOTION_DB_THINKING: z.string().min(32),
  NOTION_DB_RESUME: z.string().min(32),
  NOTION_DB_USES: z.string().min(32),
  NOTION_DB_TIMELINE: z.string().min(32),
  NOTION_PAGE_ABOUT: z.string().min(32),
  NOTION_PAGE_NOW: z.string().min(32),
  NOTION_PAGE_CONTACT: z.string().min(32),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  cached = envSchema.parse(process.env);
  return cached;
}
```

- [ ] **Step 4** Run tests, expect both pass.

- [ ] **Step 5** Commit:
```bash
git add apps/web/src/lib/env.ts apps/web/src/lib/env.test.ts
git commit -m "feat(env): zod-validated env loader with cached singleton"
```

### Task B3: Notion 客户端 + 重试

**Files:** `apps/web/src/lib/cms/notion-client.ts` (new)

- [ ] **Step 1 — impl** Create `apps/web/src/lib/cms/notion-client.ts`:

```ts
import { Client } from '@notionhq/client';
import { getEnv } from '@/lib/env';

let _client: Client | null = null;

export function getNotionClient(): Client {
  if (_client) return _client;
  _client = new Client({
    auth: getEnv().NOTION_TOKEN,
    notionVersion: '2022-06-28',
  });
  return _client;
}

/**
 * Wrap a Notion call with exponential backoff for rate-limit / 5xx errors.
 * Notion limits to ~3 req/sec; we keep this simple and avoid sophistication.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const retries = opts.retries ?? 3;
  const baseDelay = opts.baseDelayMs ?? 300;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const code = (err as { code?: string } | null)?.code;
      const isRetriable =
        code === 'rate_limited' ||
        code === 'service_unavailable' ||
        code === 'internal_server_error';
      if (!isRetriable || attempt === retries) throw err;
      const delay = baseDelay * 2 ** attempt;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
```

- [ ] **Step 2** No test for this file directly (integration tested via cms/* tests). Commit:
```bash
git add apps/web/src/lib/cms/notion-client.ts
git commit -m "feat(cms): Notion client singleton with retry/backoff"
```

### Task B4: 应用类型 `cms/types.ts`

**Files:** `apps/web/src/lib/cms/types.ts` (new)

- [ ] **Step 1** Create `apps/web/src/lib/cms/types.ts`:

```ts
// 所有应用层 entity 类型 — Notion 响应解析后的形状

export interface Project {
  id: string;                   // Notion page id
  slug: string;
  title: string;
  type: 'Software' | 'Mechanical' | 'AI' | 'Other';
  status: 'Active' | 'Archived' | 'Draft';
  year: number;
  summary: string;
  coverUrl: string | null;
  tags: string[];
  stack: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  modelGlbUrl: string | null;
  featured: boolean;
  order: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  coverUrl: string | null;
  publishedDate: string;        // ISO yyyy-mm-dd
  readTime: number;             // minutes
}

export type ResumeType = 'Experience' | 'Education' | 'Skill' | 'Award';

export interface ResumeItem {
  id: string;
  type: ResumeType;
  title: string;
  org: string;
  location: string | null;
  startDate: string;            // ISO
  endDate: string | null;       // null = ongoing
  tags: string[];
  order: number;
}

export interface ResumeBundle {
  experience: ResumeItem[];
  education: ResumeItem[];
  skill: ResumeItem[];
  award: ResumeItem[];
}

export type UsesCategory = 'Hardware' | 'Software' | 'Service';

export interface UsesItem {
  id: string;
  title: string;
  category: UsesCategory;
  subcategory: string | null;
  brand: string | null;
  note: string | null;
  url: string | null;
  yearStarted: number;
}

export interface UsesGrouped {
  hardware: UsesItem[];
  software: UsesItem[];
  service: UsesItem[];
}

export type TimelineType = 'Career' | 'Education' | 'Project' | 'Personal' | 'Milestone';

export interface TimelineNode {
  id: string;
  year: number;
  month: number | null;
  title: string;
  type: TimelineType;
  coverUrl: string | null;
  order: number;
}
```

- [ ] **Step 2** Commit:
```bash
git add apps/web/src/lib/cms/types.ts
git commit -m "feat(cms): application-level entity types"
```

### Task B5: Property parsers `cms/parsers.ts` (TDD)

**Files:** `apps/web/src/lib/cms/parsers.ts` (new), `apps/web/src/lib/cms/parsers.test.ts` (new)

- [ ] **Step 1 — failing tests** Create `apps/web/src/lib/cms/parsers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  parseTitle, parseRichText, parseSelect, parseMultiSelect,
  parseNumber, parseCheckbox, parseUrl, parseDate, parseFiles,
} from './parsers';

describe('parseTitle', () => {
  it('extracts plain text from title array', () => {
    const prop = {
      type: 'title',
      title: [{ plain_text: 'Finance Tracker' }],
    };
    expect(parseTitle(prop as any)).toBe('Finance Tracker');
  });
  it('returns empty string for empty title', () => {
    expect(parseTitle({ type: 'title', title: [] } as any)).toBe('');
  });
});

describe('parseSelect', () => {
  it('extracts name from select', () => {
    expect(parseSelect({ type: 'select', select: { name: 'Software' } } as any)).toBe('Software');
  });
  it('returns null when select is unset', () => {
    expect(parseSelect({ type: 'select', select: null } as any)).toBeNull();
  });
});

describe('parseMultiSelect', () => {
  it('extracts names array', () => {
    const prop = { type: 'multi_select', multi_select: [{ name: 'a' }, { name: 'b' }] };
    expect(parseMultiSelect(prop as any)).toEqual(['a', 'b']);
  });
});

describe('parseNumber', () => {
  it('returns number', () => {
    expect(parseNumber({ type: 'number', number: 42 } as any)).toBe(42);
  });
  it('returns null when unset', () => {
    expect(parseNumber({ type: 'number', number: null } as any)).toBeNull();
  });
});

describe('parseCheckbox', () => {
  it('returns boolean', () => {
    expect(parseCheckbox({ type: 'checkbox', checkbox: true } as any)).toBe(true);
    expect(parseCheckbox({ type: 'checkbox', checkbox: false } as any)).toBe(false);
  });
});

describe('parseUrl', () => {
  it('returns url string', () => {
    expect(parseUrl({ type: 'url', url: 'https://example.com' } as any)).toBe('https://example.com');
  });
  it('returns null on empty', () => {
    expect(parseUrl({ type: 'url', url: null } as any)).toBeNull();
    expect(parseUrl({ type: 'url', url: '' } as any)).toBeNull();
  });
});

describe('parseDate', () => {
  it('extracts start date string', () => {
    expect(parseDate({ type: 'date', date: { start: '2026-05-23' } } as any)).toEqual({ start: '2026-05-23', end: null });
  });
  it('returns null when unset', () => {
    expect(parseDate({ type: 'date', date: null } as any)).toBeNull();
  });
});

describe('parseFiles', () => {
  it('extracts first file URL (external)', () => {
    const prop = {
      type: 'files',
      files: [{ name: 'cover.jpg', type: 'external', external: { url: 'https://cdn/x.jpg' } }],
    };
    expect(parseFiles(prop as any)).toBe('https://cdn/x.jpg');
  });
  it('extracts first file URL (file)', () => {
    const prop = {
      type: 'files',
      files: [{ name: 'cover.jpg', type: 'file', file: { url: 'https://notion/x.jpg' } }],
    };
    expect(parseFiles(prop as any)).toBe('https://notion/x.jpg');
  });
  it('returns null when no files', () => {
    expect(parseFiles({ type: 'files', files: [] } as any)).toBeNull();
  });
});

describe('parseRichText', () => {
  it('joins plain_text spans', () => {
    const prop = {
      type: 'rich_text',
      rich_text: [{ plain_text: 'Hello ' }, { plain_text: 'world' }],
    };
    expect(parseRichText(prop as any)).toBe('Hello world');
  });
});
```

- [ ] **Step 2** Run tests, expect all 11+ assertions fail.

- [ ] **Step 3 — impl** Create `apps/web/src/lib/cms/parsers.ts`:

```ts
// 把 Notion property 对象解析为应用层类型 — 不暴露 Notion SDK 类型

interface NotionProperty {
  type: string;
  [key: string]: unknown;
}

interface RichTextSpan { plain_text: string }
interface FileObject {
  type: 'external' | 'file';
  external?: { url: string };
  file?: { url: string };
}

export function parseTitle(prop: NotionProperty): string {
  const spans = (prop as { title?: RichTextSpan[] }).title ?? [];
  return spans.map((s) => s.plain_text).join('');
}

export function parseRichText(prop: NotionProperty): string {
  const spans = (prop as { rich_text?: RichTextSpan[] }).rich_text ?? [];
  return spans.map((s) => s.plain_text).join('');
}

export function parseSelect(prop: NotionProperty): string | null {
  const sel = (prop as { select?: { name: string } | null }).select;
  return sel?.name ?? null;
}

export function parseMultiSelect(prop: NotionProperty): string[] {
  const arr = (prop as { multi_select?: { name: string }[] }).multi_select ?? [];
  return arr.map((s) => s.name);
}

export function parseNumber(prop: NotionProperty): number | null {
  return (prop as { number?: number | null }).number ?? null;
}

export function parseCheckbox(prop: NotionProperty): boolean {
  return !!(prop as { checkbox?: boolean }).checkbox;
}

export function parseUrl(prop: NotionProperty): string | null {
  const url = (prop as { url?: string | null }).url;
  return url && url.length > 0 ? url : null;
}

export function parseDate(prop: NotionProperty): { start: string; end: string | null } | null {
  const d = (prop as { date?: { start: string; end: string | null } | null }).date;
  if (!d) return null;
  return { start: d.start, end: d.end ?? null };
}

export function parseFiles(prop: NotionProperty): string | null {
  const files = (prop as { files?: FileObject[] }).files ?? [];
  const first = files[0];
  if (!first) return null;
  if (first.type === 'external') return first.external?.url ?? null;
  if (first.type === 'file') return first.file?.url ?? null;
  return null;
}
```

- [ ] **Step 4** Run tests, all pass.

- [ ] **Step 5** Commit:
```bash
git add apps/web/src/lib/cms/parsers.ts apps/web/src/lib/cms/parsers.test.ts
git commit -m "feat(cms): typed parsers for Notion properties with full test coverage"
```

### Task B6: Notion block tree fetcher `cms/blocks.ts`

**Files:** `apps/web/src/lib/cms/blocks.ts` (new)

- [ ] **Step 1 — impl** Create `apps/web/src/lib/cms/blocks.ts`:

```ts
import { getNotionClient, withRetry } from './notion-client';

export interface NotionBlock {
  id: string;
  type: string;
  // Notion block payload — kept untyped on purpose; the renderer narrows per type.
  [key: string]: unknown;
  children?: NotionBlock[];
}

/**
 * Recursively fetch all blocks under a page or block id, including nested children.
 * Notion's API is paginated and shallow; we walk the tree.
 */
export async function getBlockChildren(blockId: string): Promise<NotionBlock[]> {
  const client = getNotionClient();
  const out: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const resp = await withRetry(() =>
      client.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
        page_size: 100,
      }),
    );
    for (const block of resp.results) {
      const b = block as unknown as NotionBlock;
      if ((b as { has_children?: boolean }).has_children) {
        b.children = await getBlockChildren(b.id);
      }
      out.push(b);
    }
    cursor = resp.next_cursor ?? undefined;
  } while (cursor);

  return out;
}
```

- [ ] **Step 2** Commit:
```bash
git add apps/web/src/lib/cms/blocks.ts
git commit -m "feat(cms): recursive Notion block tree fetcher"
```

---

## Batch 2: CMS Entity Modules (projects / thinking / resume / uses / timeline / pages)

Each module follows the pattern: fixture-based TDD test → impl. Each task ends with a commit.

### Task B7: `cms/projects.ts` + test

**Files:** `apps/web/src/lib/cms/projects.ts` (new), `apps/web/src/lib/cms/projects.test.ts` (new), `apps/web/tests/fixtures/notion/projects-list.json` (new)

- [ ] **Step 1** Save a real Notion query response as fixture. Since we can't run the agent against real Notion in tests, the agent should construct a representative fixture file from the Notion SDK's TypeScript types:

Create `apps/web/tests/fixtures/notion/projects-list.json` with 2 sample pages:

```json
{
  "results": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "properties": {
        "Title":         { "type": "title", "title": [{ "plain_text": "Finance Tracker" }] },
        "Slug":          { "type": "rich_text", "rich_text": [{ "plain_text": "finance-tracker" }] },
        "Type":          { "type": "select", "select": { "name": "Software" } },
        "Status":        { "type": "select", "select": { "name": "Active" } },
        "Year":          { "type": "number", "number": 2026 },
        "Summary":       { "type": "rich_text", "rich_text": [{ "plain_text": "多账户资产追踪。" }] },
        "Cover":         { "type": "files", "files": [{ "type": "external", "external": { "url": "https://cdn/cover.jpg" } }] },
        "Tags":          { "type": "multi_select", "multi_select": [{ "name": "Web" }] },
        "Stack":         { "type": "multi_select", "multi_select": [{ "name": "FastAPI" }, { "name": "Postgres" }] },
        "RepoURL":       { "type": "url", "url": "https://github.com/jason/ft" },
        "DemoURL":       { "type": "url", "url": null },
        "ModelGLB_URL":  { "type": "url", "url": null },
        "Featured":      { "type": "checkbox", "checkbox": true },
        "Published":     { "type": "checkbox", "checkbox": true },
        "Order":         { "type": "number", "number": 1 }
      }
    },
    {
      "id": "00000000-0000-0000-0000-000000000002",
      "properties": {
        "Title":         { "type": "title", "title": [{ "plain_text": "桌面机械臂" }] },
        "Slug":          { "type": "rich_text", "rich_text": [{ "plain_text": "desktop-arm" }] },
        "Type":          { "type": "select", "select": { "name": "Mechanical" } },
        "Status":        { "type": "select", "select": { "name": "Active" } },
        "Year":          { "type": "number", "number": 2025 },
        "Summary":       { "type": "rich_text", "rich_text": [{ "plain_text": "6 自由度机械臂。" }] },
        "Cover":         { "type": "files", "files": [] },
        "Tags":          { "type": "multi_select", "multi_select": [] },
        "Stack":         { "type": "multi_select", "multi_select": [{ "name": "SolidWorks" }] },
        "RepoURL":       { "type": "url", "url": null },
        "DemoURL":       { "type": "url", "url": null },
        "ModelGLB_URL":  { "type": "url", "url": "https://r2/arm.glb" },
        "Featured":      { "type": "checkbox", "checkbox": true },
        "Published":     { "type": "checkbox", "checkbox": true },
        "Order":         { "type": "number", "number": 2 }
      }
    }
  ],
  "next_cursor": null
}
```

- [ ] **Step 2 — failing test** Create `apps/web/src/lib/cms/projects.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import fixture from '@/tests/fixtures/notion/projects-list.json';
import { mapProjectFromNotion } from './projects';

describe('mapProjectFromNotion', () => {
  it('maps the first fixture page', () => {
    const project = mapProjectFromNotion(fixture.results[0] as never);
    expect(project).toMatchObject({
      slug: 'finance-tracker',
      title: 'Finance Tracker',
      type: 'Software',
      status: 'Active',
      year: 2026,
      summary: '多账户资产追踪。',
      coverUrl: 'https://cdn/cover.jpg',
      tags: ['Web'],
      stack: ['FastAPI', 'Postgres'],
      repoUrl: 'https://github.com/jason/ft',
      demoUrl: null,
      modelGlbUrl: null,
      featured: true,
      order: 1,
    });
  });

  it('handles empty cover & null URLs', () => {
    const project = mapProjectFromNotion(fixture.results[1] as never);
    expect(project.coverUrl).toBeNull();
    expect(project.repoUrl).toBeNull();
    expect(project.modelGlbUrl).toBe('https://r2/arm.glb');
  });
});
```

Note on tsconfig: the `@/tests/...` import requires `@/` alias to map to `./` (covering both src/ and tests/). If current alias is restricted to `./src/`, the test should import via relative path `../../../tests/fixtures/...` instead. Adapt as needed.

- [ ] **Step 3** Run tests, expect failure.

- [ ] **Step 4 — impl** Create `apps/web/src/lib/cms/projects.ts`:

```ts
import { getNotionClient, withRetry } from './notion-client';
import { getEnv } from '@/lib/env';
import {
  parseTitle, parseRichText, parseSelect, parseMultiSelect,
  parseNumber, parseCheckbox, parseUrl, parseFiles,
} from './parsers';
import type { Project } from './types';

export function mapProjectFromNotion(page: { id: string; properties: Record<string, unknown> }): Project {
  const p = page.properties;
  return {
    id: page.id,
    slug: parseRichText(p.Slug as never),
    title: parseTitle(p.Title as never),
    type: (parseSelect(p.Type as never) ?? 'Other') as Project['type'],
    status: (parseSelect(p.Status as never) ?? 'Draft') as Project['status'],
    year: parseNumber(p.Year as never) ?? 0,
    summary: parseRichText(p.Summary as never),
    coverUrl: parseFiles(p.Cover as never),
    tags: parseMultiSelect(p.Tags as never),
    stack: parseMultiSelect(p.Stack as never),
    repoUrl: parseUrl(p.RepoURL as never),
    demoUrl: parseUrl(p.DemoURL as never),
    modelGlbUrl: parseUrl(p.ModelGLB_URL as never),
    featured: parseCheckbox(p.Featured as never),
    order: parseNumber(p.Order as never) ?? 999,
  };
}

export interface ListProjectsOpts {
  featured?: boolean;
  limit?: number;
}

export async function listProjects(opts: ListProjectsOpts = {}): Promise<Project[]> {
  const client = getNotionClient();
  const filter: { and: unknown[] } = {
    and: [{ property: 'Published', checkbox: { equals: true } }],
  };
  if (opts.featured !== undefined) {
    filter.and.push({ property: 'Featured', checkbox: { equals: opts.featured } });
  }

  const resp = await withRetry(() =>
    client.databases.query({
      database_id: getEnv().NOTION_DB_PROJECTS,
      filter,
      sorts: [{ property: 'Order', direction: 'ascending' }],
      page_size: opts.limit ?? 100,
    }),
  );

  return resp.results
    .filter((r): r is typeof r & { properties: Record<string, unknown> } => 'properties' in r)
    .map(mapProjectFromNotion);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const client = getNotionClient();
  const resp = await withRetry(() =>
    client.databases.query({
      database_id: getEnv().NOTION_DB_PROJECTS,
      filter: {
        and: [
          { property: 'Slug', rich_text: { equals: slug } },
          { property: 'Published', checkbox: { equals: true } },
        ],
      },
      page_size: 1,
    }),
  );
  const first = resp.results[0];
  if (!first || !('properties' in first)) return null;
  return mapProjectFromNotion(first as never);
}
```

- [ ] **Step 5** Run tests, expect pass.

- [ ] **Step 6** Commit:
```bash
git add apps/web/src/lib/cms/projects.ts apps/web/src/lib/cms/projects.test.ts apps/web/tests/fixtures/notion/projects-list.json
git commit -m "feat(cms): projects fetcher + mapper with TDD"
```

### Task B8: `cms/thinking.ts`

Same pattern as B7. Fixture `tests/fixtures/notion/thinking-list.json`, test, impl.

Mapper extracts: id, slug, title, summary, tags, coverUrl, publishedDate (`parseDate(p.PublishedDate).start`), readTime (`parseNumber(p.ReadTime) ?? 0`).

List API: filter `Published=true`, sort by `PublishedDate descending`. `getArticleBySlug(slug)` mirrors B7.

Commit: `feat(cms): thinking articles fetcher + mapper`

### Task B9: `cms/resume.ts`

Fixture `tests/fixtures/notion/resume-list.json` with 1 sample per type.

Mapper extracts: id, type, title, org, location, startDate, endDate (from `parseDate(p.EndDate)?.start ?? null`), tags, order.

`getResume(): Promise<ResumeBundle>` fetches all rows, groups by type into the bundle. Sort within each group by Order asc then StartDate desc.

Commit: `feat(cms): resume fetcher with type-grouped bundle`

### Task B10: `cms/uses.ts`

Similar pattern. `getUses(): Promise<UsesGrouped>` groups by Category.

Sort within group by YearStarted desc, then Title asc.

Commit: `feat(cms): uses fetcher with category-grouped bundle`

### Task B11: `cms/timeline.ts`

Fixture + mapper + `getTimeline(): Promise<TimelineNode[]>`. Sort by Year desc, then Month desc, then Order asc.

Commit: `feat(cms): timeline fetcher`

### Task B12: `cms/pages.ts` + reading time

**Files:** `apps/web/src/lib/cms/pages.ts` (new), `apps/web/src/lib/cms/reading-time.ts` (new)

```ts
// pages.ts
import { getBlockChildren, type NotionBlock } from './blocks';
import { getEnv } from '@/lib/env';

export async function getAboutBlocks(): Promise<NotionBlock[]> {
  return getBlockChildren(getEnv().NOTION_PAGE_ABOUT);
}
export async function getNowBlocks(): Promise<NotionBlock[]> {
  return getBlockChildren(getEnv().NOTION_PAGE_NOW);
}
export async function getContactBlocks(): Promise<NotionBlock[]> {
  return getBlockChildren(getEnv().NOTION_PAGE_CONTACT);
}
```

```ts
// reading-time.ts
import type { NotionBlock } from './blocks';

const WORDS_PER_MIN = 250;

function blockToText(block: NotionBlock): string {
  const richArr = ((block as Record<string, unknown>)[block.type] as { rich_text?: { plain_text: string }[] } | undefined)?.rich_text ?? [];
  return richArr.map((r) => r.plain_text).join('');
}

export function estimateReadingTime(blocks: NotionBlock[]): number {
  let text = '';
  const walk = (b: NotionBlock) => {
    text += ' ' + blockToText(b);
    b.children?.forEach(walk);
  };
  blocks.forEach(walk);
  // Chinese chars vs English words: treat Chinese char as 1 word equivalent
  const words = text.trim().length / 3; // rough heuristic
  return Math.max(1, Math.ceil(words / WORDS_PER_MIN));
}
```

Test reading-time with a small fixture. Commit: `feat(cms): page block fetchers + reading-time estimator`

---

## Batch 3: Notion Block Renderer

### Task B13: RichText component (TDD)

**Files:** `apps/web/src/components/notion/rich-text.tsx`, `rich-text.test.tsx`

Render `rich_text[]` array honoring bold/italic/strike/underline/code/link/color annotations.

Test cases: plain text, bold span, link span, multi-annotation span (bold + italic + link), empty input.

Commit: `feat(notion): RichText renderer with annotation support`

### Task B14: NotionBlock dispatcher (TDD)

**Files:** `apps/web/src/components/notion/notion-block.tsx`, `notion-block.test.tsx`

Dispatch on `block.type`:
- `paragraph` → `<p>` with RichText
- `heading_1/2/3` → `<h2>`/`<h3>`/`<h4>` (NOT h1 — page title is h1)
- `bulleted_list_item`, `numbered_list_item` → `<li>` (parent ul/ol handled by NotionBlocks)
- `quote` → blockquote
- `divider` → `<hr>`
- `to_do` → checkbox + RichText
- `image` → next/image with Notion file URL
- `code` → delegate to CodeBlock
- `callout` → delegate to Callout
- `bookmark` → bookmark card
- `table` → render `table_row` children
- unknown → `<pre>` showing block.type (development aid)

Test: snapshot or screen.getByText assertions for each type.

Commit: `feat(notion): per-type block renderer`

### Task B15: NotionBlocks list wrapper (TDD)

**Files:** `apps/web/src/components/notion/notion-blocks.tsx`, test

Iterate `blocks[]`, group consecutive list items into `<ul>`/`<ol>`, render others independently. Handle nesting via `block.children`.

Test: grouping consecutive bulleted_list_item into one `<ul>`; nested list inside list item.

Commit: `feat(notion): NotionBlocks wrapper handling list grouping and nesting`

### Task B16: CodeBlock with shiki

**Files:** `apps/web/src/components/notion/code-block.tsx`

Use `shiki` (sync API in server components since they run at build time). Use theme `github-light` for light mode, `github-dark` for dark.

```tsx
import { codeToHtml } from 'shiki';

interface Props {
  code: string;
  language: string;
}

export async function CodeBlock({ code, language }: Props) {
  const html = await codeToHtml(code, {
    lang: language,
    themes: { light: 'github-light', dark: 'github-dark' },
  });
  return (
    <div
      className="font-[family-name:var(--font-mono)] my-4 overflow-x-auto rounded border border-[var(--color-border)] text-sm"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

Test: snapshot a TS code block, assert html contains shiki token classes.

Commit: `feat(notion): code-block with shiki dual-theme highlighting`

### Task B17: Callout

`callout` block has emoji + rich_text + color. Render with left brick-red border + light surface bg.

Commit: `feat(notion): callout block`

### Task B18: next.config.ts — Notion image remotePatterns

**Files:** `apps/web/next.config.ts`

Update to allow Notion image hosts:

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com' },
      { protocol: 'https', hostname: 's3.us-west-2.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'www.notion.so' },
    ],
  },
};
```

Commit: `chore(next): allow Notion image hosts via remotePatterns`

---

## Batch 4: Page Wiring (8 routes)

For each page below, two steps:
1. Replace ComingSoon placeholder with real Notion-backed component
2. Add `export const revalidate = 300;` for 5min ISR

### Task B19: /projects list page

Wire `app/projects/page.tsx` to `listProjects()` (no `featured` filter — show all published). Render via existing `<ProjectCard>` in a 3-col grid (reuse `<FeaturedProjects>` grid styling). Handle empty state via `<EmptyState>`.

Commit: `feat(routes): /projects list backed by Notion`

### Task B20: /projects/[slug] detail page

Wire `app/projects/[slug]/page.tsx` to `getProjectBySlug(slug)`. If null, `notFound()`. Layout:
- ProjectMeta card (year, type, stack, repo/demo links)
- Cover image (if any)
- Body: NotionBlocks rendered from `getBlockChildren(project.id)`
- Phase 3 will add 3D viewer here when `project.modelGlbUrl` exists — leave a TODO comment

`generateMetadata` builds title from project.title.

Commit: `feat(routes): /projects/[slug] detail backed by Notion`

### Task B21: /thinking list

Wire to `listThinking()`. Reuse `<ThinkingList>` styling but accept articles prop. Add tag filter (URL query string) — defer to V2.

Commit: `feat(routes): /thinking list backed by Notion`

### Task B22: /thinking/[slug] detail

Wire to `getArticleBySlug(slug)`. Article header (title + date + readTime + tags), then NotionBlocks body in `.prose-zh` container with `max-w-[680px] mx-auto`.

Commit: `feat(routes): /thinking/[slug] detail backed by Notion`

### Task B23: /about + Timeline section

Wire `app/about/page.tsx`:
1. Fetch `getAboutBlocks()` + `getTimeline()` in parallel via `Promise.all`
2. Render About blocks in prose container
3. After the blocks, render `<TimelineSection nodes={timeline} />`

Build `components/timeline/timeline-section.tsx`:
- Vertical line + year markers on left, nodes on right
- Type color coding (Career = ink, Project = brick-red, Education = gray, Personal = mono, Milestone = brick-red filled circle)
- Default expanded for nodes in last 3 years, older years collapsed via `<details>`

Commit: `feat(routes): /about page with embedded Timeline section`

### Task B24: /now page

Wire to `getNowBlocks()`. Single column with footer showing last edit time (use page's `last_edited_time` from Notion).

Commit: `feat(routes): /now page backed by Notion`

### Task B25: /contact page

Wire to `getContactBlocks()`. Same simple page-body rendering.

Commit: `feat(routes): /contact page backed by Notion`

### Task B26: /uses page

Wire to `getUses()`. Render 3 sections (Hardware / Software / Service), each as a list with title + brand + note + URL.

Commit: `feat(routes): /uses page backed by Notion`

### Task B27: /resume page

Wire to `getResume()`. Render 4 sections (Experience / Education / Skill / Award). Experience uses a vertical timeline-like layout (date range left, title + org + tags right). Skills as tag cloud / grouped chips.

No PDF export in Phase 2 — that's Phase 5.

Commit: `feat(routes): /resume page backed by Notion`

### Task B28: Homepage real data

Update `app/page.tsx` (or the home components) to fetch from Notion:
- `<FeaturedProjects>` consumes `await listProjects({ featured: true, limit: 3 })`
- `<ThinkingList>` consumes `await listThinking({ limit: 3 })`
- `<NowBlock>` lifts content from `getNowBlocks()` — render only the first paragraph block as a teaser (rest visible on /now)

Delete the PLACEHOLDER constants from `featured-projects.tsx` and `thinking-list.tsx` — they're no longer needed.

Commit: `feat(home): homepage Featured + Thinking + Now sections pull from Notion`

---

## Batch 5: ISR + Empty State + Verification

### Task B29: ISR revalidate config

Add `export const revalidate = 300;` to all 9 page files (`page.tsx`, `/projects/page.tsx`, `/projects/[slug]/page.tsx`, etc.). Skip /api routes.

Commit: `feat(perf): 5-minute ISR across all Notion-backed routes`

### Task B30: EmptyState component

**Files:** `apps/web/src/components/ui/empty-state.tsx`

Show when Notion query returns empty list. Used by /projects, /thinking, /uses etc.

```tsx
interface EmptyStateProps {
  titleEn: string;
  titleZh: string;
  hint: string;
}

export function EmptyState({ titleEn, titleZh, hint }: EmptyStateProps) {
  return (
    <div className="py-20 text-center">
      <div className="font-[family-name:var(--font-tight)] mb-3 text-2xl">
        <span className="font-[family-name:var(--font-zh-serif)] font-medium">{titleZh}</span> · {titleEn}
      </div>
      <p className="text-sm text-[var(--color-text-2)]">{hint}</p>
    </div>
  );
}
```

Commit: `feat(ui): EmptyState fallback component`

### Task B31: Final verification

- [ ] Tests: `corepack pnpm --filter web test` — expect previous 13 + ~30 new = 40+ pass
- [ ] Lint: clean
- [ ] Build: clean, all 13 routes
- [ ] Dev server: visit each route, confirm real Notion data renders correctly
- [ ] Images: verify Notion-hosted images render via next/image (DevTools Network shows them loading)
- [ ] Tag: `git tag -a v0.2.0-phase2 -m "Phase 2: Notion CMS data layer + Block Renderer"`

Commit any fixes; if all green, tag.

---

## Self-Review

**Spec coverage check (Phase 2 milestone: 所有内容页能从 Notion 拉数据渲染，timeline 作为 About 页内的 section):**

| Spec Phase 2 item | Covered by |
|---|---|
| 5 databases + 3 pages 工作区 | Part A |
| lib/cms/* 全套封装 | Tasks B3, B4, B5, B6, B7-B12 |
| 自写 Notion Block Renderer | Tasks B13-B17 |
| 跑通所有内容页 | Tasks B19-B27 |
| 图片代理 MVP (next/image + remotePatterns) | Task B18 |
| Timeline 嵌入 About | Task B23 |
| 首页接真实数据 | Task B28 |
| ISR 5min | Task B29 |
| **里程碑：所有内容页能从 Notion 拉数据** | Task B31 |

**Placeholder scan**: No "TBD" / "TODO" placeholders in plan body; Phase 5 mentions (PDF export, R2 image proxy) are deferred deliberately and tagged as such.

**Type consistency**: `Project`, `Article`, `ResumeBundle`, `UsesGrouped`, `TimelineNode` defined once in Task B4 `cms/types.ts`, consumed everywhere. `NotionBlock` defined in Task B6 `cms/blocks.ts`, consumed by Block Renderer.

**Out-of-scope (deliberately deferred to Phase 3/4/5)**:
- 3D viewer on /projects/[slug] (Phase 3)
- Token usage data — TokenPreview still uses placeholder; Phase 4 swaps in real data
- PDF export from /resume (Phase 5)
- R2 image proxy (Phase 5)
- `/api/notion-image/route.ts` route (Phase 5)
- Article tag filter (V2)

---

## Phase 2 完成判定

1. ✅ Part A 完成（Notion 工作区 + .env.local）
2. ✅ 所有 8 个内容路由从 Notion 拉真数据，UI 一致符合设计系统
3. ✅ About 页正确嵌入 Timeline section
4. ✅ 首页 Featured / Thinking / Now 部分使用真实 Notion 数据
5. ✅ 图片通过 next/image + Notion remotePatterns 正确加载
6. ✅ Tests 全绿（+30 新测试）、lint 干净、build 成功
7. ✅ Tag `v0.2.0-phase2`
