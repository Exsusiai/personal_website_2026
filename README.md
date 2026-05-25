# Personal Website

A modern personal portal built around a **Nordic Editorial** design system — content-first, animation-restrained, typography-driven. Designed to serve as a long-lived personal IP hub: resume, projects (including interactive 3D mechanical assemblies), long-form thinking, real-time LLM token usage dashboard, contact, and more.

Built as a reusable template. All identity-specific content lives in Notion + a single `site.ts` config file — fork it, rewire those, and you have your own.

## Highlights

- **Notion as CMS** — every content page (projects, thinking, resume, uses, timeline, about, now, contact) is backed by Notion databases or pages. Content edits go live within 5 minutes via ISR. Custom-built Notion block renderer (no `react-notion-x` style lock-in).
- **3D mechanical models** — SolidWorks → STEP → glTF pipeline. Project pages render assemblies inline with `React Three Fiber` (orbit / zoom / pan). Heavy 3D code is dynamically loaded only on pages that need it.
- **Multi-platform LLM token dashboard** — aggregates Claude Code, Codex CLI, OpenCode, and custom agent usage across multiple devices via `ccusage` → Supabase. Subscription-friendly (works without per-token billing). Server-side agents can self-report via a shared ingest API.
- **Nordic Editorial design system** — warm off-white background, ink-black text, brick-red accent. 1px hairline borders replace shadows. Bilingual typography (English: `Inter`/`Inter Tight`, Chinese long-form: `Noto Serif SC`).
- **i18n-ready** — Chinese-first with `lang="zh-CN"` and font stacks reserved for English content; routing convention preserved for future i18n expansion.
- **PDF resume export** — client-side via `@react-pdf/renderer` with embedded Noto Serif SC for proper Chinese rendering.
- **SEO out of the box** — dynamic sitemap pulling from Notion, robots.txt, default OG image generated via `next/og`.
- **Zero hosting cost** — Vercel Hobby + Supabase Free + Cloudflare R2 Free all sit inside free tiers for personal-scale usage. Annual cost: domain only (~$10/year).
- **TDD discipline** — 70+ tests covering CMS parsers, fixtures-based entity mappers, Notion block renderer, navigation. Strict TypeScript, no `any`.

## Routes

```
/                  Hero + featured projects + Now teaser + Token usage card
/about             Long-form intro + embedded growth timeline
/resume            Structured resume with PDF download
/projects          All projects (Notion-backed)
/projects/[slug]   Project detail (optional 3D viewer)
/thinking          Business / engineering essays
/thinking/[slug]   Article body with custom rich-text renderer
/now               nownownow.com-style "currently doing"
/uses              Hardware / software / service stack
/contact           Email / social / collaboration intent
/sitemap.xml       SEO
/robots.txt        SEO
/opengraph-image   Social-share card
```

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (`@theme` design tokens) |
| CMS | Notion (`@notionhq/client` v5, API 2025-09-03) |
| Database | Supabase Postgres (RLS-enforced) |
| File storage | Cloudflare R2 (zero egress fees) |
| 3D | React Three Fiber 9 + drei + three.js |
| Charts | Tremor (planned) |
| PDF | `@react-pdf/renderer` |
| Code highlight | Shiki (build-time, no runtime cost) |
| Testing | Vitest + Testing Library (jsdom) |
| Linting | ESLint (Next config) |
| Deployment | Vercel |
| Workspace | pnpm monorepo |

## Repo Structure

```
.
├── apps/
│   └── web/                  # Next.js application
│       ├── src/
│       │   ├── app/          # App Router routes (page.tsx, layout.tsx, ...)
│       │   ├── components/   # ui / nav / home / notion / projects / resume / timeline
│       │   └── lib/          # cms / db / utils / fonts / site / nav-items / env
│       ├── tests/            # Vitest setup + fixtures
│       ├── next.config.ts
│       └── package.json
├── packages/
│   └── usage-daemons/        # LLM usage collection daemons
│       ├── ccusage-sync/     # multi-agent local-log collector (laptop / server)
│       ├── anthropic-poller/ # per-token API users (dormant, kept for reuse)
│       ├── openai-poller/    # same
│       └── shared/           # env, types, client
├── supabase/
│   ├── migrations/           # SQL: usage_events, usage_daily view, notion_image_cache
│   └── README.md             # security matrix
├── docs/
│   ├── PHASE4_CHECKLIST.md   # rollout guide for the token dashboard
│   └── superpowers/
│       ├── specs/            # design document
│       └── plans/            # phase-by-phase implementation plans
├── .learnings/               # captured non-obvious findings (Next 16, ccusage v20, ...)
└── .env.example
```

## Quick Start

```bash
# 1. Install
corepack pnpm install

# 2. Configure
cp .env.example apps/web/.env.local
# Then fill in: NOTION_TOKEN, NOTION_DS_*, NOTION_PAGE_*

# 3. Run
corepack pnpm --filter web dev
```

Open <http://localhost:3000>

### Tests / lint / build

```bash
corepack pnpm --filter web test        # 70+ tests
corepack pnpm --filter web lint
corepack pnpm --filter web build
```

## Notion Workspace Setup

The site expects **5 databases** (`projects`, `thinking`, `resume`, `uses`, `timeline`) and **3 pages** (`about`, `now`, `contact`) in a Notion workspace shared with an integration. The exact schemas (field names, select options) are documented in:

- `docs/superpowers/specs/2026-05-23-personal-website-design.md` § 5.1

`@notionhq/client` v5 uses `data_source_id` (not `database_id`) — see `.env.example` for the full variable list with retrieval instructions.

## Token Dashboard

The homepage shows a real-time aggregate of LLM token usage across all your devices and providers. See `docs/PHASE4_CHECKLIST.md` for the rollout sequence. Components:

- **Daemons** (`packages/usage-daemons/ccusage-sync/`) — read local `ccusage` output on each device every hour, ship events to `/api/usage/ingest`.
- **Supabase** — primary store; materialized view aggregates daily.
- **API routes** — `/api/usage/ingest` (write, Bearer-secret auth), `/api/usage/stats` (read, ISR).

Subscription-model friendly (Claude Max / ChatGPT Pro / Codex sub) — no need for per-token API billing.

## Design System

Built around 6 colors + 5 fonts + 1 accent. See:

- Color tokens: `apps/web/src/app/globals.css` (`@theme` block)
- Font config: `apps/web/src/lib/fonts.ts`
- Component primitives: `apps/web/src/components/ui/`

Mockup (preserved in brainstorm artifacts, gitignored).

## Roadmap

- ✅ **Phase 1** — Skeleton + design system + 11 routes (`v0.1.0-phase1`)
- ✅ **Phase 2** — Notion CMS data layer + block renderer + all content pages (`v0.2.0-phase2`)
- 🟡 **Phase 3** — 3D viewer: code ready (R3F v9 + dynamic load); awaiting R2 + real GLB upload
- ✅ **Phase 4** — Token dashboard: live data from 2 devices via hourly ccusage-sync (launchd + systemd timer), 4 platforms, ISR-backed homepage card
- 🟡 **Phase 5** — Partial: PDF + sitemap + robots + OG done; remaining: R2 image proxy / Vercel deployment / custom domain / Lighthouse polish

Each phase has a dedicated implementation plan under `docs/superpowers/plans/`. Deployment templates (launchd / systemd / Task Scheduler) live under `docs/deployment/`.

## Forking This

If you want to use this as a template:

1. Fork the repo
2. Replace contents of `apps/web/src/lib/site.ts` (name, email, GitHub, etc.)
3. Set up your own Notion workspace following `docs/superpowers/specs/...` § 5.1
4. Fill `.env.local` with your credentials
5. Customize the design tokens in `apps/web/src/app/globals.css` if you want a different palette

## License

MIT — see `LICENSE` (to be added).

## Acknowledgements

- Design philosophy inspired by [Linear](https://linear.app), [Rauno Freiberg](https://rauno.me), and [onur.dev](https://onur.dev).
- `ccusage` for the heavy lifting on local LLM usage parsing.
- The Nordic editorial typography tradition.
