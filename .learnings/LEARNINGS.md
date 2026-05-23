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

## 添加新 learning 的格式

```markdown
## LRN-NNN · 简短标题

**问题**：现象 / 错误
**根因**：底层原因
**做法**：怎么解决
**含义**（可选）：对后续工作的影响
```
