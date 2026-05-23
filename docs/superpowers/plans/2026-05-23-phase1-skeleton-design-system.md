# Phase 1: Skeleton + Design System Implementation Plan

> **Status (2026-05-23)**: ✅ Executed and tagged `v0.1.0-phase1`. Post-execution IA refactor consolidated `/timeline` into `/about` page, removed `/tokens` (data shows in homepage card only), and renamed `/hire-me` → `/contact`. Current routes & navigation are authoritative in `docs/superpowers/specs/2026-05-23-personal-website-design.md`. This plan file is preserved as the **historical execution record**; references below to `/timeline`, `/tokens`, `/hire-me`, "Next.js 15" etc. reflect the original drafted spec, not the live codebase.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 初始化 pnpm monorepo + Next.js 15 + Tailwind v4 项目骨架，实现 Nordic Editorial 设计系统，产出 11 个路由全部可访问，其中首页完全符合视觉 mockup。

**Architecture:** pnpm workspace（为 Phase 4 daemons 预留 packages/）。`apps/web` 用 Next.js 15 App Router + TS + Tailwind v4。设计系统通过 CSS 变量 + Tailwind theme 联动实现：颜色/字体/间距全部 token 化。组件用 React Server Components 默认，需要交互的局部加 `'use client'`。

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS v4, Vitest + React Testing Library, next/font（自托管 Google Fonts）, shadcn/ui（Phase 2 才用），pnpm 9。

**TDD 适配说明:**
- **纯逻辑/工具函数**：严格 TDD（先写测试 → 失败 → 实现 → 通过）
- **UI 组件**：先写组件 → 加 smoke test（断言渲染不报错 + 关键文本/aria 存在）→ 通过 → 提交
- **页面（page.tsx）**：手动 dev server 验证，不强求自动化测试

---

## File Structure

```
personal_website_new/
├── .gitignore
├── .env.example
├── package.json                          # workspace root
├── pnpm-workspace.yaml
├── README.md
├── docs/
│   └── superpowers/
│       ├── specs/
│       └── plans/
└── apps/
    └── web/
        ├── src/                          # Next.js 16 默认 src/ 结构
        │   ├── app/
        │   │   ├── globals.css           # Nordic 设计 token + base 样式
        │   │   ├── layout.tsx            # 根 layout：字体 + Nav + Footer
        │   │   ├── page.tsx              # 首页（完整版，符合 mockup）
        │   │   ├── not-found.tsx
        │   │   ├── about/page.tsx        # 占位
        │   │   ├── resume/page.tsx       # 占位
        │   │   ├── projects/
        │   │   │   ├── page.tsx          # 占位
        │   │   │   └── [slug]/page.tsx   # 占位
        │   │   ├── thinking/
        │   │   │   ├── page.tsx          # 占位
        │   │   │   └── [slug]/page.tsx   # 占位
        │   │   ├── timeline/page.tsx     # 占位
        │   │   ├── now/page.tsx          # 占位
        │   │   ├── uses/page.tsx         # 占位
        │   │   ├── tokens/page.tsx       # 占位
        │   │   └── hire-me/page.tsx      # 占位
        │   ├── components/
        │   │   ├── ui/
        │   │   │   ├── container.tsx     # 内容居中容器
        │   │   │   └── section-head.tsx  # h2 + "VIEW ALL →"
        │   │   ├── nav/
        │   │   │   ├── top-nav.tsx
        │   │   │   ├── top-nav.test.tsx
        │   │   │   ├── footer.tsx
        │   │   │   └── footer.test.tsx
        │   │   ├── home/
        │   │   │   ├── hero.tsx
        │   │   │   ├── featured-projects.tsx
        │   │   │   ├── project-card.tsx
        │   │   │   ├── project-card.test.tsx
        │   │   │   ├── now-block.tsx
        │   │   │   ├── token-preview.tsx
        │   │   │   └── thinking-list.tsx
        │   │   └── placeholder/
        │   │       └── coming-soon.tsx
        │   └── lib/
        │       ├── fonts.ts              # next/font 配置
        │       ├── nav-items.ts          # 顶部导航的链接列表
        │       └── site.ts               # 站点元信息常量
        ├── public/
        │   └── favicon.ico
        ├── tests/                        # vitest setup（在 src/ 之外）
        │   └── setup.ts
        ├── next.config.ts
        ├── tsconfig.json
        ├── vitest.config.ts
        ├── postcss.config.mjs
        ├── eslint.config.mjs
        └── package.json
```

> **环境备注（Batch 1 实测）**：实际使用 Next.js **16.2.6** + Tailwind v4.3 + React 19.2 + TypeScript 5.9。Next.js 16 与 spec 中 15.x 的所有用法兼容；scaffold 强制把 `app/` `components/` `lib/` 放进 `src/` 目录，`@/` alias 映射到 `./src/`。本节路径以此为准。

---

## Task 1: Initialize monorepo root

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`

- [ ] **Step 1: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Save as `/Users/jason/Project/personal_website_new/pnpm-workspace.yaml`.

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "personal-website",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm --filter web build",
    "start": "pnpm --filter web start",
    "lint": "pnpm --filter web lint",
    "test": "pnpm --filter web test"
  },
  "devDependencies": {}
}
```

Save as `/Users/jason/Project/personal_website_new/package.json`.

- [ ] **Step 3: Create .gitignore**

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Next.js
.next/
out/
next-env.d.ts

# Build outputs
dist/
build/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Env
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/*
!.vscode/extensions.json
.idea/

# Test
coverage/
.nyc_output/

# Vercel
.vercel

# Brainstorm session
.superpowers/

# Misc
*.pem
.cache/
```

Save as `/Users/jason/Project/personal_website_new/.gitignore`.

- [ ] **Step 4: Create .env.example**

```bash
# Notion (Phase 2)
NOTION_TOKEN=
NOTION_DB_PROJECTS=
NOTION_DB_THINKING=
NOTION_DB_RESUME=
NOTION_DB_USES=
NOTION_DB_TIMELINE=
NOTION_PAGE_ABOUT=
NOTION_PAGE_NOW=
NOTION_PAGE_HIRE=

# Supabase (Phase 4)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

# Cloudflare R2 (Phase 3/5)
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ACCOUNT_ID=
R2_BUCKET=
R2_PUBLIC_URL=

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Save as `/Users/jason/Project/personal_website_new/.env.example`.

- [ ] **Step 5: Create README.md**

```markdown
# Personal Website

Jason Chen (陈敬升) 的个人门户。

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript 5
- Tailwind CSS v4
- Notion as CMS (Phase 2)
- Supabase Postgres + Cloudflare R2 (Phase 4+)
- pnpm monorepo

## Quick Start

```bash
pnpm install
pnpm dev
```

打开 http://localhost:3000

## Docs

- Spec: `docs/superpowers/specs/2026-05-23-personal-website-design.md`
- Plans: `docs/superpowers/plans/`
```

Save as `/Users/jason/Project/personal_website_new/README.md`.

- [ ] **Step 6: Verify workspace setup**

Run: `cd /Users/jason/Project/personal_website_new && pnpm install`

Expected output:
```
Already up to date
Done in <1s
```

(no errors; workspace recognized even though no packages exist yet)

- [ ] **Step 7: Commit**

```bash
cd /Users/jason/Project/personal_website_new
git init
git add .gitignore .env.example package.json pnpm-workspace.yaml README.md
git commit -m "chore: initialize pnpm monorepo skeleton"
```

---

## Task 2: Initialize Next.js 15 app in apps/web

**Files:**
- Create: `apps/web/` (Next.js scaffolding)

- [ ] **Step 1: Scaffold Next.js app**

Run from `/Users/jason/Project/personal_website_new`:

```bash
pnpm dlx create-next-app@latest apps/web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir false \
  --turbopack \
  --import-alias "@/*" \
  --use-pnpm \
  --no-install
```

Expected: directory `apps/web/` created with Next.js 15 boilerplate.

- [ ] **Step 2: Install dependencies via workspace**

Run from `/Users/jason/Project/personal_website_new`:

```bash
pnpm install
```

Expected: Lockfile generated, all deps installed.

- [ ] **Step 3: Update apps/web/package.json name**

Edit `apps/web/package.json`, change the `"name"` field to:

```json
"name": "web",
```

(keeps workspace addressing simple: `pnpm --filter web dev`)

- [ ] **Step 4: Smoke test dev server**

Run: `pnpm --filter web dev`

Open http://localhost:3000

Expected: Next.js default landing page loads, no errors in terminal.

Stop the server with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat: scaffold Next.js 15 + Tailwind + TS in apps/web"
```

---

## Task 3: Install Phase 1 design system deps

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install fonts + utility deps**

Run from repo root:

```bash
pnpm --filter web add clsx tailwind-merge lucide-react
pnpm --filter web add -D @types/node
```

- [ ] **Step 2: Install vitest + testing deps**

```bash
pnpm --filter web add -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  @vitest/coverage-v8
```

- [ ] **Step 3: Verify dependencies installed**

Run: `cat apps/web/package.json`

Expected: `dependencies` includes `clsx`, `tailwind-merge`, `lucide-react`; `devDependencies` includes `vitest`, `@testing-library/react`, `jsdom`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore: install Phase 1 deps (fonts, vitest, RTL, utils)"
```

---

## Task 4: Configure Vitest + React Testing Library

**Files:**
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/tests/setup.ts`
- Modify: `apps/web/package.json` (add test scripts)
- Modify: `apps/web/tsconfig.json` (include vitest types)

- [ ] **Step 1: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

Save as `apps/web/vitest.config.ts`.

- [ ] **Step 2: Create tests/setup.ts**

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

Save as `apps/web/tests/setup.ts`.

- [ ] **Step 3: Add test scripts to apps/web/package.json**

In `apps/web/package.json`, replace the `"scripts"` block with:

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: Update apps/web/tsconfig.json types**

In `apps/web/tsconfig.json` `compilerOptions.types`, ensure it includes:

```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

If `types` does not exist yet, add it as a new key inside `compilerOptions`.

- [ ] **Step 5: Verify test setup with a trivial sanity test**

Create `apps/web/tests/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `pnpm --filter web test`

Expected output:
```
✓ tests/sanity.test.ts (1 test) ...ms
  ✓ sanity > runs vitest
Test Files  1 passed (1)
     Tests  1 passed (1)
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/vitest.config.ts apps/web/tests/ apps/web/package.json apps/web/tsconfig.json
git commit -m "test: configure vitest + React Testing Library"
```

---

## Task 5: Define Nordic color tokens in globals.css

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Replace globals.css with Nordic tokens**

Replace **entire contents** of `apps/web/src/app/globals.css` with:

```css
@import "tailwindcss";

/* ============================================================
   Nordic Editorial Design Tokens
   ============================================================ */

@theme {
  /* ---- Colors (Light mode default) ---- */
  --color-bg: #FAFAF7;
  --color-surface: #F2F1EC;
  --color-text: #1A1A1A;
  --color-text-2: #6B6B66;
  --color-border: #E5E4DE;
  --color-accent: #C84B31;

  /* ---- Font families (Inter via next/font) ---- */
  --font-sans: var(--font-inter), system-ui, -apple-system, sans-serif;
  --font-tight: var(--font-inter-tight), system-ui, sans-serif;
  --font-zh-sans: var(--font-noto-sans-sc), 'PingFang SC', system-ui, sans-serif;
  --font-zh-serif: var(--font-noto-serif-sc), Georgia, serif;
  --font-mono: var(--font-jetbrains-mono), 'SF Mono', Menlo, monospace;

  /* ---- Type scale ---- */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 24px;
  --text-2xl: 32px;
  --text-3xl: 48px;
  --text-4xl: 64px;

  /* ---- Spacing ---- */
  --max-w-reading: 680px;
  --max-w-container: 1080px;
}

/* ---- Dark mode tokens ---- */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1A1817;
    --color-surface: #242120;
    --color-text: #EDEAE3;
    --color-text-2: #8C8780;
    --color-border: #2E2A28;
    --color-accent: #E5704F;
  }
}

/* ============================================================
   Base styles
   ============================================================ */

* {
  box-sizing: border-box;
}

html,
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Chinese characters get serif by default in content blocks via .prose-zh */

a {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: var(--color-accent);
}

::selection {
  background: var(--color-accent);
  color: var(--color-bg);
}

/* ---- Utility: hairline border ---- */
.hairline {
  border: 1px solid var(--color-border);
}
.hairline-t { border-top: 1px solid var(--color-border); }
.hairline-b { border-bottom: 1px solid var(--color-border); }

/* ---- Prose styles (for long-form content from Notion) ---- */
.prose-zh {
  font-family: var(--font-zh-serif);
  font-size: 17px;
  line-height: 1.85;
  max-width: var(--max-w-reading);
}

.prose-zh p { margin-bottom: 1em; }
.prose-zh h2 {
  font-family: var(--font-tight);
  font-size: var(--text-xl);
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-top: 2em;
  margin-bottom: 0.5em;
  line-height: 1.2;
}
.prose-zh h3 {
  font-family: var(--font-tight);
  font-size: var(--text-lg);
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}
.prose-zh code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  padding: 2px 6px;
  border: 1px solid var(--color-border);
  border-radius: 2px;
}
.prose-zh blockquote {
  border-left: 2px solid var(--color-accent);
  padding-left: 1em;
  font-style: italic;
  color: var(--color-text-2);
}
```

- [ ] **Step 2: Verify dev server still loads**

Run: `pnpm --filter web dev`

Open http://localhost:3000.

Expected: Page loads with warm off-white background (`#FAFAF7`). No console errors.

Stop server.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(design): add Nordic color tokens and base styles"
```

---

## Task 6: Configure fonts via next/font

**Files:**
- Create: `apps/web/src/lib/fonts.ts`

- [ ] **Step 1: Create lib/fonts.ts**

```ts
import { Inter, Inter_Tight, Noto_Sans_SC, Noto_Serif_SC, JetBrains_Mono } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
});

export const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  preload: false, // 中文字体文件大，延迟加载
});

export const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  preload: false,
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const fontClassNames = [
  inter.variable,
  interTight.variable,
  notoSansSC.variable,
  notoSerifSC.variable,
  jetbrainsMono.variable,
].join(' ');
```

Save as `apps/web/src/lib/fonts.ts`.

- [ ] **Step 2: Wire fonts into root layout**

Open `apps/web/src/app/layout.tsx`. Replace **entire contents** with:

```tsx
import type { Metadata } from 'next';
import { fontClassNames } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '陈敬升 Jason Chen',
    template: '%s · 陈敬升',
  },
  description: '工程师 / Builder · 个人门户、项目、思考',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={fontClassNames}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Smoke test fonts load**

Run: `pnpm --filter web dev`

Open http://localhost:3000. Open DevTools Network tab, filter by "Font". Refresh.

Expected: At least Inter + Inter Tight + JetBrains Mono request `.woff2` files with HTTP 200. Noto Sans/Serif may not load yet (preload disabled), this is correct.

Stop server.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/fonts.ts apps/web/src/app/layout.tsx
git commit -m "feat(design): wire next/font for Inter, Noto SC, JetBrains Mono"
```

---

## Task 7: Build utility helpers (lib/utils.ts, lib/site.ts, lib/nav-items.ts)

**Files:**
- Create: `apps/web/src/lib/utils.ts`
- Create: `apps/web/src/lib/site.ts`
- Create: `apps/web/src/lib/nav-items.ts`
- Create: `apps/web/src/lib/utils.test.ts`

- [ ] **Step 1: Write failing test for `cn` utility**

Create `apps/web/src/lib/utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (className merger)', () => {
  it('joins multiple strings', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('merges conflicting tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
```

- [ ] **Step 2: Run test, verify fails**

Run: `pnpm --filter web test`

Expected: FAIL — `cn` not exported from `./utils`.

- [ ] **Step 3: Implement utils.ts**

Create `apps/web/src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Run test, verify passes**

Run: `pnpm --filter web test`

Expected: PASS — all 3 `cn` tests green.

- [ ] **Step 5: Create site.ts**

```ts
export const site = {
  name: 'Jason Chen',
  nameZh: '陈敬升',
  monogram: 'CJS',
  description: '工程师 / Builder · 在机械与软件之间',
  email: 'chjingsheng@gmail.com',
  github: 'https://github.com/chjingsheng',
  twitter: '',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  locale: 'zh-CN',
  location: 'Shenzhen · Beijing',
} as const;
```

Save as `apps/web/src/lib/site.ts`.

- [ ] **Step 6: Create nav-items.ts**

```ts
export interface NavItem {
  href: string;
  label: string;
}

export const navItems: NavItem[] = [
  { href: '/about', label: 'About' },
  { href: '/resume', label: 'Resume' },
  { href: '/projects', label: 'Projects' },
  { href: '/thinking', label: 'Thinking' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/tokens', label: 'Tokens' },
  { href: '/now', label: 'Now' },
];

export const footerLinks: NavItem[] = [
  { href: 'mailto:chjingsheng@gmail.com', label: 'Email' },
  { href: 'https://github.com/chjingsheng', label: 'GitHub' },
  { href: '/hire-me', label: 'Hire me' },
  { href: '/uses', label: 'Uses' },
];
```

Save as `apps/web/src/lib/nav-items.ts`.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/
git commit -m "feat(lib): add cn utility, site metadata, nav items"
```

---

## Task 8: Build Container component

**Files:**
- Create: `apps/web/src/components/ui/container.tsx`

- [ ] **Step 1: Implement Container**

```tsx
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'footer' | 'main';
}

export function Container({
  children,
  className,
  as: Tag = 'div',
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full px-8',
        'max-w-[1080px]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
```

Save as `apps/web/src/components/ui/container.tsx`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/container.tsx
git commit -m "feat(ui): add Container component"
```

---

## Task 9: Build TopNav component (with test)

**Files:**
- Create: `apps/web/src/components/nav/top-nav.tsx`
- Create: `apps/web/src/components/nav/top-nav.test.tsx`

- [ ] **Step 1: Implement TopNav**

```tsx
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { navItems } from '@/lib/nav-items';
import { site } from '@/lib/site';

export function TopNav() {
  return (
    <nav
      className="sticky top-0 z-10 hairline-b bg-[var(--color-bg)]/90 backdrop-blur"
      aria-label="Primary"
    >
      <Container as="div" className="flex items-center justify-between py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-tight)] text-lg font-bold tracking-tight"
          aria-label={site.name + ' homepage'}
        >
          {site.monogram}
        </Link>
        <ul className="flex gap-8">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-[var(--color-text-2)] hover:text-[var(--color-text)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
```

Save as `apps/web/src/components/nav/top-nav.tsx`.

- [ ] **Step 2: Write smoke test**

Create `apps/web/src/components/nav/top-nav.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopNav } from './top-nav';

describe('TopNav', () => {
  it('renders the logo monogram', () => {
    render(<TopNav />);
    expect(screen.getByText('CJS')).toBeInTheDocument();
  });

  it('renders all primary nav links', () => {
    render(<TopNav />);
    const expected = ['About', 'Resume', 'Projects', 'Thinking', 'Timeline', 'Tokens', 'Now'];
    for (const label of expected) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('has an accessible label', () => {
    render(<TopNav />);
    expect(screen.getByLabelText('Primary')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test, verify pass**

Run: `pnpm --filter web test`

Expected: 3 tests pass for TopNav, plus the prior sanity + utils tests.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/nav/top-nav.tsx apps/web/src/components/nav/top-nav.test.tsx
git commit -m "feat(nav): add TopNav component with tests"
```

---

## Task 10: Build Footer component (with test)

**Files:**
- Create: `apps/web/src/components/nav/footer.tsx`
- Create: `apps/web/src/components/nav/footer.test.tsx`

- [ ] **Step 1: Implement Footer**

```tsx
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { footerLinks } from '@/lib/nav-items';
import { site } from '@/lib/site';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="hairline-t mt-24 py-12">
      <Container className="flex flex-col gap-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-2)] sm:flex-row sm:justify-between">
        <div>
          © {year} {site.nameZh} · Built with Next.js
        </div>
        <ul className="flex gap-6">
          {footerLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </Container>
    </footer>
  );
}
```

Save as `apps/web/src/components/nav/footer.tsx`.

- [ ] **Step 2: Write smoke test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './footer';

describe('Footer', () => {
  it('renders current year', () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });

  it('renders the author name', () => {
    render(<Footer />);
    expect(screen.getByText(/陈敬升/)).toBeInTheDocument();
  });

  it('renders Email, GitHub, Hire me, Uses links', () => {
    render(<Footer />);
    for (const label of ['Email', 'GitHub', 'Hire me', 'Uses']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
```

Save as `apps/web/src/components/nav/footer.test.tsx`.

- [ ] **Step 3: Run test, verify pass**

Run: `pnpm --filter web test`

Expected: 3 new Footer tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/nav/footer.tsx apps/web/src/components/nav/footer.test.tsx
git commit -m "feat(nav): add Footer component with tests"
```

---

## Task 11: Update root layout to include Nav + Footer

**Files:**
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Update layout.tsx**

Replace **entire contents** of `apps/web/src/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next';
import { fontClassNames } from '@/lib/fonts';
import { TopNav } from '@/components/nav/top-nav';
import { Footer } from '@/components/nav/footer';
import { site } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${site.nameZh} ${site.name}`,
    template: `%s · ${site.nameZh}`,
  },
  description: site.description,
  metadataBase: new URL(site.url),
  openGraph: {
    title: `${site.nameZh} ${site.name}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={site.locale} className={fontClassNames}>
      <body className="flex min-h-screen flex-col">
        <TopNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Smoke test dev server**

Run: `pnpm --filter web dev`

Open http://localhost:3000.

Expected:
- Top nav visible with "CJS" left, 7 links right
- Default Next.js page content in middle
- Footer at bottom with year + name + 4 links
- All on Nordic warm-off-white background

Stop server.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/layout.tsx
git commit -m "feat(layout): wire TopNav and Footer into root layout"
```

---

## Task 12: Build SectionHead component

**Files:**
- Create: `apps/web/src/components/ui/section-head.tsx`

- [ ] **Step 1: Implement SectionHead**

```tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SectionHeadProps {
  /** English part of the title */
  titleEn: string;
  /** Chinese part of the title (optional, rendered with serif) */
  titleZh?: string;
  /** Optional "view all" link */
  more?: { href: string; label?: string };
  className?: string;
}

export function SectionHead({
  titleEn,
  titleZh,
  more,
  className,
}: SectionHeadProps) {
  return (
    <div
      className={cn(
        'mb-12 flex items-baseline justify-between',
        className,
      )}
    >
      <h2 className="font-[family-name:var(--font-tight)] text-2xl font-semibold tracking-tight">
        {titleZh && (
          <span className="font-[family-name:var(--font-zh-serif)] font-medium">
            {titleZh}
          </span>
        )}
        {titleZh && ' · '}
        {titleEn}
      </h2>
      {more && (
        <Link
          href={more.href}
          className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-2)] hover:text-[var(--color-text)]"
        >
          {(more.label ?? 'VIEW ALL').toUpperCase()} →
        </Link>
      )}
    </div>
  );
}
```

Save as `apps/web/src/components/ui/section-head.tsx`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/section-head.tsx
git commit -m "feat(ui): add SectionHead component"
```

---

## Task 13: Build Hero component

**Files:**
- Create: `apps/web/src/components/home/hero.tsx`

- [ ] **Step 1: Implement Hero**

```tsx
import { Container } from '@/components/ui/container';
import { site } from '@/lib/site';

export function Hero() {
  return (
    <Container as="section" className="py-32">
      <div className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        {site.nameZh} · Engineer / Builder
      </div>

      <h1 className="mb-8 max-w-[760px] font-[family-name:var(--font-tight)] text-5xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
        <span className="font-[family-name:var(--font-zh-serif)] font-medium">
          在机械与软件之间
        </span>
        <br />
        Building products at the intersection of{' '}
        <span className="font-[family-name:var(--font-zh-serif)] font-medium">
          硬件、算法与人
        </span>
        .
      </h1>

      <p className="font-[family-name:var(--font-zh-serif)] mb-10 max-w-[600px] text-lg leading-[1.75]">
        我是一名同时在写代码与画机械图的工程师。这个网站记录我做过的项目、读过的书、烧掉的 token，以及一些关于产品与业务的不成熟的想法。
      </p>

      <div className="font-[family-name:var(--font-mono)] flex flex-col gap-2 text-[13px] text-[var(--color-text-2)] sm:flex-row sm:gap-6">
        <span>
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] align-middle" />
          Now · 在做个人主页与 Finance Tracker
        </span>
        <span>{site.location}</span>
      </div>
    </Container>
  );
}
```

Save as `apps/web/src/components/home/hero.tsx`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/home/hero.tsx
git commit -m "feat(home): add Hero section"
```

---

## Task 14: Build ProjectCard component (with test)

**Files:**
- Create: `apps/web/src/components/home/project-card.tsx`
- Create: `apps/web/src/components/home/project-card.test.tsx`

- [ ] **Step 1: Implement ProjectCard**

```tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface ProjectCardData {
  slug: string;
  ptype: string;
  title: string;
  summary: string;
  tags: string[];
}

interface ProjectCardProps {
  project: ProjectCardData;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        'flex min-h-[260px] flex-col bg-[var(--color-bg)] p-8 transition-colors hover:bg-[var(--color-surface)]',
        className,
      )}
    >
      <div className="font-[family-name:var(--font-mono)] mb-4 text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-2)]">
        {project.ptype}
      </div>
      <h3 className="font-[family-name:var(--font-zh-serif)] mb-3 text-[22px] font-semibold leading-[1.3]">
        {project.title}
      </h3>
      <p className="flex-grow text-sm leading-[1.7] text-[var(--color-text-2)]">
        {project.summary}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="font-[family-name:var(--font-mono)] rounded-sm border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-text-2)]"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
```

Save as `apps/web/src/components/home/project-card.tsx`.

- [ ] **Step 2: Write smoke test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCard, type ProjectCardData } from './project-card';

const sample: ProjectCardData = {
  slug: 'finance-tracker',
  ptype: 'Software · Finance',
  title: 'Finance Tracker',
  summary: '多账户资产追踪系统。',
  tags: ['FastAPI', 'Postgres'],
};

describe('ProjectCard', () => {
  it('renders title, ptype, and summary', () => {
    render(<ProjectCard project={sample} />);
    expect(screen.getByText('Finance Tracker')).toBeInTheDocument();
    expect(screen.getByText('Software · Finance')).toBeInTheDocument();
    expect(screen.getByText('多账户资产追踪系统。')).toBeInTheDocument();
  });

  it('renders all tags', () => {
    render(<ProjectCard project={sample} />);
    expect(screen.getByText('FastAPI')).toBeInTheDocument();
    expect(screen.getByText('Postgres')).toBeInTheDocument();
  });

  it('links to /projects/[slug]', () => {
    render(<ProjectCard project={sample} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/projects/finance-tracker');
  });
});
```

Save as `apps/web/src/components/home/project-card.test.tsx`.

- [ ] **Step 3: Run test, verify pass**

Run: `pnpm --filter web test`

Expected: 3 new ProjectCard tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/home/project-card.tsx apps/web/src/components/home/project-card.test.tsx
git commit -m "feat(home): add ProjectCard component with tests"
```

---

## Task 15: Build FeaturedProjects section

**Files:**
- Create: `apps/web/src/components/home/featured-projects.tsx`

- [ ] **Step 1: Implement FeaturedProjects (with Phase 1 hardcoded data)**

```tsx
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { ProjectCard, type ProjectCardData } from './project-card';

const PLACEHOLDER_PROJECTS: ProjectCardData[] = [
  {
    slug: 'finance-tracker',
    ptype: 'Software · Finance',
    title: 'Finance Tracker',
    summary: '多账户资产追踪系统，覆盖银行卡、加密钱包、交易所、股票等 8 种资产类型。FastAPI + Next.js + Postgres。',
    tags: ['FastAPI', 'Postgres', 'Crypto'],
  },
  {
    slug: 'desktop-arm',
    ptype: 'Mechanical · 3D',
    title: '桌面级机械臂',
    summary: '6 自由度桌面机械臂，SolidWorks 建模 + STM32 控制 + Python 上位机。装配体可直接在网页 3D 查看。',
    tags: ['SolidWorks', 'STM32', 'Three.js'],
  },
  {
    slug: 'ecc-agent-workflow',
    ptype: 'AI · Tools',
    title: 'ECC Agent Workflow',
    summary: '基于 Claude Code 的 Agent Teams 强化工作流：模型路由、并行调研、确定性验证、Taste→Rule 管道。',
    tags: ['Claude Code', 'Workflow'],
  },
];

export function FeaturedProjects() {
  return (
    <section className="hairline-t py-18 sm:py-20">
      <Container>
        <SectionHead
          titleEn="Selected Work"
          titleZh="精选项目"
          more={{ href: '/projects' }}
        />
        <div className="grid grid-cols-1 gap-px border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-3">
          {PLACEHOLDER_PROJECTS.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}
```

Save as `apps/web/src/components/home/featured-projects.tsx`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/home/featured-projects.tsx
git commit -m "feat(home): add FeaturedProjects section with Phase 1 placeholder data"
```

---

## Task 16: Build NowBlock + TokenPreview (the duo)

**Files:**
- Create: `apps/web/src/components/home/now-block.tsx`
- Create: `apps/web/src/components/home/token-preview.tsx`
- Create: `apps/web/src/components/home/now-tokens-duo.tsx`

- [ ] **Step 1: Implement NowBlock**

```tsx
export function NowBlock() {
  return (
    <div className="bg-[var(--color-bg)] p-9">
      <h3 className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        Now
      </h3>
      <div className="font-[family-name:var(--font-zh-serif)] text-[17px] leading-[1.85]">
        目前在打磨{' '}
        <strong className="font-semibold text-[var(--color-accent)]">
          Finance Tracker
        </strong>{' '}
        的加密资产模块，同时把{' '}
        <strong className="font-semibold text-[var(--color-accent)]">
          个人主页
        </strong>{' '}
        这件事正式推进起来。读完了《The Score Takes Care of Itself》，正在重读《Working in Public》。这周末打算把桌面机械臂的上位机 UI 重做一遍。
      </div>
      <p className="font-[family-name:var(--font-mono)] mt-5 text-xs text-[var(--color-text-2)]">
        UPDATED · 2026-05-23 · SHENZHEN
      </p>
    </div>
  );
}
```

Save as `apps/web/src/components/home/now-block.tsx`.

- [ ] **Step 2: Implement TokenPreview**

```tsx
interface BarSpec {
  height: number;
  accent?: boolean;
}

const SAMPLE_BARS: BarSpec[] = [
  { height: 30 },
  { height: 45 },
  { height: 60 },
  { height: 38 },
  { height: 90, accent: true },
  { height: 55 },
  { height: 70 },
];

export function TokenPreview() {
  return (
    <div className="bg-[var(--color-bg)] p-9">
      <h3 className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        Token Usage · 30 days
      </h3>

      <div className="mb-6 grid grid-cols-2 gap-5">
        <div>
          <div className="font-[family-name:var(--font-mono)] mb-1.5 text-[28px] font-medium leading-none">
            142.8M
          </div>
          <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wide text-[var(--color-text-2)]">
            Total Tokens
          </div>
        </div>
        <div>
          <div className="font-[family-name:var(--font-mono)] mb-1.5 text-[28px] font-medium leading-none">
            $1,847
          </div>
          <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wide text-[var(--color-text-2)]">
            Spend (USD)
          </div>
        </div>
      </div>

      <div className="mt-4 flex h-[60px] items-end gap-1.5">
        {SAMPLE_BARS.map((bar, i) => (
          <div
            key={i}
            className={
              bar.accent
                ? 'flex-1 bg-[var(--color-accent)]'
                : 'flex-1 bg-[var(--color-text)]/85'
            }
            style={{ height: `${bar.height}%` }}
          />
        ))}
      </div>

      <div className="font-[family-name:var(--font-mono)] mt-3 flex flex-wrap gap-4 text-[11px] text-[var(--color-text-2)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 bg-[var(--color-text)]/85" />
          Anthropic 78%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 bg-[var(--color-accent)]" />
          OpenAI 18%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 bg-[var(--color-text-2)]" />
          Other 4%
        </span>
      </div>
    </div>
  );
}
```

Save as `apps/web/src/components/home/token-preview.tsx`.

- [ ] **Step 3: Combine into NowTokensDuo**

```tsx
import { Container } from '@/components/ui/container';
import { NowBlock } from './now-block';
import { TokenPreview } from './token-preview';

export function NowTokensDuo() {
  return (
    <section className="hairline-t py-18 sm:py-20">
      <Container>
        <div className="grid grid-cols-1 gap-px border border-[var(--color-border)] bg-[var(--color-border)] lg:grid-cols-[1.4fr_1fr]">
          <NowBlock />
          <TokenPreview />
        </div>
      </Container>
    </section>
  );
}
```

Save as `apps/web/src/components/home/now-tokens-duo.tsx`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/home/now-block.tsx apps/web/src/components/home/token-preview.tsx apps/web/src/components/home/now-tokens-duo.tsx
git commit -m "feat(home): add Now block and Token preview duo"
```

---

## Task 17: Build ThinkingList section

**Files:**
- Create: `apps/web/src/components/home/thinking-list.tsx`

- [ ] **Step 1: Implement ThinkingList (Phase 1 hardcoded)**

```tsx
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';

interface ArticlePreview {
  slug: string;
  title: string;
  summary: string;
  date: string;
}

const PLACEHOLDER_ARTICLES: ArticlePreview[] = [
  {
    slug: 'why-track-token-usage',
    title: '为什么独立开发者应该把"用量本身"当成产品的一部分',
    summary: '谈谈把 Token 计量、API 调用、用户行为做成可观察界面的产品价值。',
    date: '2026-05-20',
  },
  {
    slug: 'cad-to-web',
    title: '从 SolidWorks 装配体到网页：一个完整的 CAD-to-Web 工作流',
    summary: 'STEP → glTF → Three.js 的实测笔记，含装配体颜色保留、移动端性能优化。',
    date: '2026-05-12',
  },
  {
    slug: 'personal-ip-needs-facade',
    title: '个人 IP 不需要"运营"，但需要一个像样的门面',
    summary: '为什么我决定花两周时间重做个人主页：把所有作品、思考、工具都放到一个可访问的地方。',
    date: '2026-05-08',
  },
];

export function ThinkingList() {
  return (
    <section className="hairline-t py-18 sm:py-20">
      <Container>
        <SectionHead
          titleEn="Thinking"
          titleZh="业务思考"
          more={{ href: '/thinking', label: 'ALL POSTS' }}
        />
        <ul className="max-w-[720px]">
          {PLACEHOLDER_ARTICLES.map((a, i) => (
            <li
              key={a.slug}
              className={
                i < PLACEHOLDER_ARTICLES.length - 1
                  ? 'hairline-b py-5'
                  : 'py-5'
              }
            >
              <Link
                href={`/thinking/${a.slug}`}
                className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
              >
                <div className="flex-1">
                  <h3 className="font-[family-name:var(--font-zh-serif)] mb-2 text-lg font-semibold">
                    {a.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-2)]">
                    {a.summary}
                  </p>
                </div>
                <span className="font-[family-name:var(--font-mono)] whitespace-nowrap pt-1 text-xs text-[var(--color-text-2)]">
                  {a.date}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
```

Save as `apps/web/src/components/home/thinking-list.tsx`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/home/thinking-list.tsx
git commit -m "feat(home): add Thinking list section"
```

---

## Task 18: Assemble homepage (page.tsx)

**Files:**
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Replace page.tsx entirely**

Replace **entire contents** of `apps/web/src/app/page.tsx` with:

```tsx
import { Hero } from '@/components/home/hero';
import { FeaturedProjects } from '@/components/home/featured-projects';
import { NowTokensDuo } from '@/components/home/now-tokens-duo';
import { ThinkingList } from '@/components/home/thinking-list';

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProjects />
      <NowTokensDuo />
      <ThinkingList />
    </>
  );
}
```

- [ ] **Step 2: Smoke test the homepage**

Run: `pnpm --filter web dev`

Open http://localhost:3000.

Expected:
- Top nav with monogram + 7 links
- Hero with bilingual heading and brick-red `Now` dot
- Featured Projects: 3 cards in a row (1 column on mobile) with hairline dividers
- Now block + Token preview side-by-side
- Thinking list with 3 article entries
- Footer at bottom
- Overall warm-off-white background, no shadows, no gradients
- Brick-red `#C84B31` visible on: Now dot, Now block strong text, Token chart accent bar, OpenAI legend swatch

Compare to mockup at `.superpowers/brainstorm/98440-1779547535/content/homepage-v1.html` — should match closely.

- [ ] **Step 3: Run tests, verify all pass**

Run: `pnpm --filter web test`

Expected: All tests green (sanity + utils + TopNav + Footer + ProjectCard).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat(home): assemble homepage matching approved mockup"
```

---

## Task 19: Build ComingSoon placeholder component

**Files:**
- Create: `apps/web/src/components/placeholder/coming-soon.tsx`

- [ ] **Step 1: Implement ComingSoon**

```tsx
import { Container } from '@/components/ui/container';

interface ComingSoonProps {
  titleEn: string;
  titleZh: string;
  description?: string;
}

export function ComingSoon({ titleEn, titleZh, description }: ComingSoonProps) {
  return (
    <Container as="section" className="py-32">
      <div className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        Phase 1 · Placeholder
      </div>
      <h1 className="mb-8 max-w-[760px] font-[family-name:var(--font-tight)] text-4xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl">
        <span className="font-[family-name:var(--font-zh-serif)] font-medium">
          {titleZh}
        </span>{' '}
        · {titleEn}
      </h1>
      <p className="font-[family-name:var(--font-zh-serif)] max-w-[600px] text-lg leading-[1.75] text-[var(--color-text-2)]">
        {description ??
          '这个页面将在 Phase 2 接入 Notion 后填充真实内容。'}
      </p>
    </Container>
  );
}
```

Save as `apps/web/src/components/placeholder/coming-soon.tsx`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/placeholder/coming-soon.tsx
git commit -m "feat(placeholder): add ComingSoon component for Phase 1 stubs"
```

---

## Task 20: Stub /about page

**Files:**
- Create: `apps/web/src/app/about/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <ComingSoon
      titleEn="About"
      titleZh="我是谁"
      description="完整版自我介绍将在 Phase 2 从 Notion 拉取。"
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/about/page.tsx
git commit -m "feat(routes): stub /about page"
```

---

## Task 21: Stub /resume page

**Files:**
- Create: `apps/web/src/app/resume/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Resume' };

export default function ResumePage() {
  return (
    <ComingSoon
      titleEn="Resume"
      titleZh="简历"
      description="结构化简历 + PDF 下载将在 Phase 2 / Phase 5 实现。"
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/resume/page.tsx
git commit -m "feat(routes): stub /resume page"
```

---

## Task 22: Stub /projects list + detail pages

**Files:**
- Create: `apps/web/src/app/projects/page.tsx`
- Create: `apps/web/src/app/projects/[slug]/page.tsx`

- [ ] **Step 1: List page**

```tsx
import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <ComingSoon
      titleEn="Projects"
      titleZh="项目"
      description="完整项目列表将在 Phase 2 从 Notion projects database 拉取。"
    />
  );
}
```

Save as `apps/web/src/app/projects/page.tsx`.

- [ ] **Step 2: Detail page (with dynamic slug)**

```tsx
import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Project · ${slug}` };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <ComingSoon
      titleEn={`Project: ${slug}`}
      titleZh="项目详情"
      description="项目详情 + 3D 模型查看器将在 Phase 2 / Phase 3 实现。"
    />
  );
}
```

Save as `apps/web/src/app/projects/[slug]/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/projects/
git commit -m "feat(routes): stub /projects list and [slug] detail pages"
```

---

## Task 23: Stub /thinking list + detail pages

**Files:**
- Create: `apps/web/src/app/thinking/page.tsx`
- Create: `apps/web/src/app/thinking/[slug]/page.tsx`

- [ ] **Step 1: List page**

```tsx
import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Thinking' };

export default function ThinkingPage() {
  return (
    <ComingSoon
      titleEn="Thinking"
      titleZh="业务思考"
      description="完整博客列表将在 Phase 2 从 Notion thinking database 拉取。"
    />
  );
}
```

Save as `apps/web/src/app/thinking/page.tsx`.

- [ ] **Step 2: Detail page**

```tsx
import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Article · ${slug}` };
}

export default async function ThinkingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <ComingSoon
      titleEn={`Article: ${slug}`}
      titleZh="文章详情"
      description="文章正文将在 Phase 2 通过 Notion Block Renderer 渲染。"
    />
  );
}
```

Save as `apps/web/src/app/thinking/[slug]/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/thinking/
git commit -m "feat(routes): stub /thinking list and [slug] detail pages"
```

---

## Task 24: Stub /timeline /now /uses /tokens /hire-me

**Files:**
- Create: `apps/web/src/app/timeline/page.tsx`
- Create: `apps/web/src/app/now/page.tsx`
- Create: `apps/web/src/app/uses/page.tsx`
- Create: `apps/web/src/app/tokens/page.tsx`
- Create: `apps/web/src/app/hire-me/page.tsx`

- [ ] **Step 1: /timeline**

```tsx
import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Timeline' };

export default function TimelinePage() {
  return (
    <ComingSoon
      titleEn="Timeline"
      titleZh="成长时间轴"
      description="纵向时间线将在 Phase 2 从 Notion timeline database 拉取。"
    />
  );
}
```

Save as `apps/web/src/app/timeline/page.tsx`.

- [ ] **Step 2: /now**

```tsx
import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Now' };

export default function NowPage() {
  return (
    <ComingSoon
      titleEn="Now"
      titleZh="近况"
      description="当下在忙什么，将在 Phase 2 从 Notion now page 拉取。"
    />
  );
}
```

Save as `apps/web/src/app/now/page.tsx`.

- [ ] **Step 3: /uses**

```tsx
import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Uses' };

export default function UsesPage() {
  return (
    <ComingSoon
      titleEn="Uses"
      titleZh="装备清单"
      description="硬件/软件/服务清单将在 Phase 2 从 Notion uses database 拉取。"
    />
  );
}
```

Save as `apps/web/src/app/uses/page.tsx`.

- [ ] **Step 4: /tokens**

```tsx
import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Tokens' };

export default function TokensPage() {
  return (
    <ComingSoon
      titleEn="Token Usage"
      titleZh="用量看板"
      description="多平台 + 多设备 Token 用量看板将在 Phase 4 上线。"
    />
  );
}
```

Save as `apps/web/src/app/tokens/page.tsx`.

- [ ] **Step 5: /hire-me**

```tsx
import type { Metadata } from 'next';
import { ComingSoon } from '@/components/placeholder/coming-soon';

export const metadata: Metadata = { title: 'Hire me' };

export default function HireMePage() {
  return (
    <ComingSoon
      titleEn="Hire me"
      titleZh="联系方式"
      description="联系方式 + 合作意向将在 Phase 2 从 Notion hire-me page 拉取。"
    />
  );
}
```

Save as `apps/web/src/app/hire-me/page.tsx`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/timeline apps/web/src/app/now apps/web/src/app/uses apps/web/src/app/tokens apps/web/src/app/hire-me
git commit -m "feat(routes): stub /timeline /now /uses /tokens /hire-me"
```

---

## Task 25: Add not-found page

**Files:**
- Create: `apps/web/src/app/not-found.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from 'next/link';
import { Container } from '@/components/ui/container';

export default function NotFound() {
  return (
    <Container as="section" className="py-32">
      <div className="font-[family-name:var(--font-mono)] mb-6 text-xs uppercase tracking-[0.12em] text-[var(--color-text-2)]">
        404
      </div>
      <h1 className="mb-8 font-[family-name:var(--font-tight)] text-5xl font-semibold leading-[1.05] tracking-[-0.03em]">
        <span className="font-[family-name:var(--font-zh-serif)] font-medium">
          页面不存在
        </span>{' '}
        · Not Found
      </h1>
      <p className="font-[family-name:var(--font-zh-serif)] mb-6 text-lg leading-[1.75] text-[var(--color-text-2)]">
        你访问的页面不存在或已经被移走了。
      </p>
      <Link
        href="/"
        className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-accent)] hover:underline"
      >
        ← BACK TO HOME
      </Link>
    </Container>
  );
}
```

Save as `apps/web/src/app/not-found.tsx`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/not-found.tsx
git commit -m "feat(routes): add custom 404 page"
```

---

## Task 26: Add favicon + verify metadata

**Files:**
- Create: `apps/web/src/app/icon.tsx` (dynamic favicon from monogram)

- [ ] **Step 1: Create dynamic favicon using Next.js metadata icons**

```tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAFAF7',
          color: '#1A1A1A',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.04em',
        }}
      >
        CJS
      </div>
    ),
    size,
  );
}
```

Save as `apps/web/src/app/icon.tsx`.

- [ ] **Step 2: Verify favicon in dev server**

Run: `pnpm --filter web dev`

Open http://localhost:3000. Check browser tab — favicon should show "CJS" on warm off-white.

Stop server.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/icon.tsx
git commit -m "feat(branding): generate CJS favicon from monogram"
```

---

## Task 27: Run full test suite + production build

**Files:**
- None (verification task)

- [ ] **Step 1: Run all tests**

Run: `pnpm --filter web test`

Expected:
```
Test Files  X passed
     Tests  Y passed
```

All green. If any fail, fix the underlying component and re-run.

- [ ] **Step 2: Run lint**

Run: `pnpm --filter web lint`

Expected: 0 errors. Warnings OK.

- [ ] **Step 3: Run production build**

Run: `pnpm --filter web build`

Expected:
- Build succeeds
- All 12 routes listed (`/`, `/about`, `/resume`, `/projects`, `/projects/[slug]`, `/thinking`, `/thinking/[slug]`, `/timeline`, `/now`, `/uses`, `/tokens`, `/hire-me`)
- No TypeScript errors

- [ ] **Step 4: Start production server and verify**

Run: `pnpm --filter web start`

Open http://localhost:3000. Click through every nav link. Each should land on a styled placeholder (or the full homepage). Footer link clicks should work.

Stop server.

- [ ] **Step 5: Commit (only if any fixes were made)**

If everything passed without changes, skip this step. Otherwise:

```bash
git add -A
git commit -m "fix: address build/test issues"
```

---

## Task 28: Tag Phase 1 release

**Files:**
- None

- [ ] **Step 1: Verify everything is committed**

Run: `git status`

Expected: `nothing to commit, working tree clean`

- [ ] **Step 2: Tag**

```bash
git tag -a v0.1.0-phase1 -m "Phase 1 complete: skeleton + design system + homepage matching mockup"
```

- [ ] **Step 3: Inspect git log**

Run: `git log --oneline`

Expected: ~25-28 commits, each describing one task or sub-task. The most recent should be the tag.

---

## Self-Review

**Spec coverage check (Phase 1 milestone: "能在 localhost 看到首页，UI 完全符合 mockup")**

| Spec Phase 1 item | Covered by |
|---|---|
| 初始化 Next.js 15 + Tailwind v4 + TS | Task 2 |
| pnpm monorepo 结构 | Task 1 |
| Nordic 设计系统：颜色变量 | Task 5 |
| Nordic 设计系统：字体（Inter + Noto + JetBrains Mono） | Task 6 |
| Nav 组件 | Task 9 |
| Footer 组件 | Task 10 |
| 静态首页 hero + 占位 sections | Tasks 13–18 |
| 所有 11 个路由可访问 | Tasks 20–24 |
| **里程碑：localhost 首页符合 mockup** | Task 18 step 2 (smoke test against mockup) |

**Placeholder scan**: No "TODO" / "TBD" / "implement later". All `ComingSoon` components are explicit Phase 2/3/4 deferral markers, not lazy planning.

**Type consistency**:
- `ProjectCardData` defined in Task 14 (`./project-card.tsx`), reused in Task 15 (`featured-projects.tsx`). Names match.
- `NavItem` defined in Task 7 (`lib/nav-items.ts`), consumed in Tasks 9 + 10. Match.
- `site` object defined in Task 7, consumed in Tasks 9, 10, 11, 13. Match.

**Out-of-scope (deliberately deferred to later Phases)**:
- Dark mode toggle UI (color tokens are defined via `prefers-color-scheme`, but no manual toggle yet)
- 3D viewer, Notion data, Token API, PDF, Image proxy
- Lighthouse > 95 validation (mentioned in Phase 5)

---

## Phase 1 完成判定

Phase 1 完成 = 满足以下全部：

1. ✅ `pnpm --filter web dev` 跑起来不报错
2. ✅ http://localhost:3000 首页与 mockup（`.superpowers/brainstorm/.../homepage-v1.html`）视觉一致
3. ✅ 顶部导航 7 个链接 + Footer 4 个链接全部可点击，落地页都不 404
4. ✅ `pnpm --filter web test` 全绿
5. ✅ `pnpm --filter web build` 成功
6. ✅ Git tag `v0.1.0-phase1` 已打
