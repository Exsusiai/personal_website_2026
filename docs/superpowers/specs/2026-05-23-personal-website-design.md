# Personal Website · 设计稿

**日期**：2026-05-23
**作者**：陈敬升 Jason Chen（@chjingsheng）
**状态**：Design approved, ready for implementation planning

---

## 1. 概述

建设个人主页（个人门户），用途：

- 自我介绍 + 简历（可作为个人名片 / 求职 URL）
- 记录做过的项目（含机械设计 3D 装配体）
- 业务思考 Blog（沉淀对产品与业务的不成熟想法）
- 实时展示多平台 LLM Token 用量看板
- 长期沉淀个人 IP

定位关键词：**Nordic Editorial、内容优先、低运维、长期可演进**。

---

## 2. Goals & Non-Goals

### Goals
- UI 简洁大气、北欧风、高级感、动画克制
- 内容维护门槛低（Notion 编辑 → 网站自动同步）
- 支持 SolidWorks 机械装配体在网页直接 3D 查看
- 多平台（Anthropic / OpenAI / Google）+ 多设备 LLM Token 用量聚合展示
- 中文优先，预留 i18n 接口
- 全免费基础设施（Vercel / Supabase / Cloudflare R2 / Notion）

### Non-Goals（不做）
- 评论系统 / 用户登录 / 互动功能
- 全文搜索（V1 不做，未来用 Algolia 或 Pagefind）
- 完整的 LLM Observability（不做 trace、prompt 管理、A/B 测试）
- 3D Viewer 的高级功能：零件树、爆炸图、剖切、测量（一律不做，只保留旋转/缩放/平移）
- 邮件订阅 / Newsletter
- 多语言版本（V1 仅中文，预留 i18n）

---

## 3. 信息架构

### 站点地图

```
/                      首页（聚合页：身份 + 精选项目 + Now + Token 缩略）
/about                 我是谁
/resume                简历（含 PDF 下载）
/projects              项目列表
/projects/[slug]       项目详情（含 3D 查看器）
/thinking              业务思考 Blog 列表
/thinking/[slug]       文章详情
/timeline              成长时间轴
/now                   Now 页（当下在忙什么）
/uses                  装备清单
/tokens                Token 用量看板
/hire-me               联系方式 + 合作意向
```

### 模块定位

| 模块 | 数据源 | 更新频率 | 交互重点 |
|---|---|---|---|
| 首页 | Notion + 静态 | 不常变 | 一屏抓住身份感 |
| About | Notion Page | 季度级 | 长文叙述，typography 为王 |
| Resume | Notion Database | 月度级 | 时间线 + PDF 一键导出 |
| Projects 列表 | Notion Database | 周度级 | 卡片网格，标签筛选 |
| Projects 详情 | Notion Page + 自定义字段 | 周度级 | **3D 查看器 / 富媒体 / 文章式 README** |
| Thinking | Notion Database | 不定 | Tag、阅读时长、长文版式 |
| Timeline | Notion Database | 季度级 | 纵向时间轴 + 节点详情 |
| Now | Notion Page | 月度级 | 一屏可读，footer 显示更新时间 |
| Uses | Notion Database | 季度级 | 分组列表 |
| Tokens | Supabase Postgres | 5 min ISR | KPI + 时间序列 + 平台分布 |
| Hire me | Notion Page | 季度级 | 邮件 + 社交链接 + 简短文案 |

### 关键设计决策

1. **结构化 + 富文本双轨**：列表型走 Notion Database + 强字段约束；长文型走 Notion Page
2. **完全不渲染 Notion 原生样式**：自写 Block Renderer，Notion 仅作数据源
3. **首页是聚合页**：拼出"我是谁 + 在干嘛 + 做过什么 + 烧了多少 token"的一屏故事

---

## 4. UI 设计系统

### 设计哲学
**Nordic Editorial**——Linear.app 的克制 + Rauno.me 的精准 + Onur.dev 的留白。内容是主角，装饰是仆人。

### 配色

```
─── Light mode（默认） ───
背景      #FAFAF7  暖白
表面      #F2F1EC  次级背景
文本主    #1A1A1A  墨黑
文本次    #6B6B66  暖灰
边线      #E5E4DE  极浅暖灰
强调色    #C84B31  砖红（仅链接 hover / 关键 CTA）

─── Dark mode ───
背景      #1A1817
表面      #242120
文本主    #EDEAE3
文本次    #8C8780
边线      #2E2A28
强调色    #E5704F
```

**禁用**：纯白、纯黑、蓝色、绿色（防科技感廉价化）、阴影、渐变、玻璃质感。

### 字体

```
英文标题    Inter Tight (variable, 偏紧凑现代)
英文正文    Inter (variable)
中文长文    Noto Serif SC (思源宋体)
中文 UI    Noto Sans SC (思源黑体)
数字/Mono  JetBrains Mono
```

中文长文用宋体——这是北欧 editorial 风的中文转译。

### 排版规则
- 正文最大宽度：680px
- 行高：正文 1.75，标题 1.2
- 字号阶梯：12 / 14 / 16 / 18 / 24 / 32 / 48 / 64
- 段间距：1em
- 代码块：等宽 + 1px hairline border + 行号

### 布局原则
- 单栏优先（项目列表网格除外）
- 顶部导航极简：左 logo（monogram）、右 7 个一级链接，无 dropdown
- 页脚有内容：联系方式 + 最后构建时间 + 版权
- **零阴影**：1px hairline border 代替 box-shadow
- **零渐变**：纯色块
- 动画克制：仅 fade-in（200ms ease-out）+ underline-on-hover

### 组件库
- **shadcn/ui**：取结构，CSS 全部重写为 Nordic 主题
- **Tremor**：Token 看板图表
- 自写：导航、列表、文章排版、3D viewer、Timeline

视觉参考：mockup 已确认，存放在 `.superpowers/brainstorm/<session>/content/homepage-v1.html`。

---

## 5. 数据层

### 5.1 Notion 工作区结构

**6 个 Database**：

#### `projects`
| 字段 | 类型 | 说明 |
|---|---|---|
| Title | title | 项目名 |
| Slug | rich_text | URL slug，唯一 |
| Type | select | Software / Mechanical / AI / Other |
| Status | select | Active / Archived / Draft |
| Year | number | |
| Summary | rich_text | 卡片描述，< 200 字 |
| Cover | files | 卡片封面 |
| Tags | multi_select | |
| Stack | multi_select | 技术栈 |
| RepoURL | url | |
| DemoURL | url | |
| ModelGLB_URL | url | 3D 模型 R2 公开 URL（可选） |
| Featured | checkbox | 是否首页精选 |
| Published | checkbox | 是否发布 |
| Order | number | 显式排序 |

#### `thinking`
| 字段 | 类型 |
|---|---|
| Title, Slug, Tags, Summary, Cover, Published, PublishedDate, ReadTime, Content (page body) | |

#### `resume`
| 字段 | 类型 |
|---|---|
| Type (Experience/Education/Skill/Award), Title, Org, Location, StartDate, EndDate(nullable), Tags, Order, Description (page body) | |

#### `uses`
| 字段 | 类型 |
|---|---|
| Title, Category (Hardware/Software/Service), Subcategory, Brand, Note, URL, YearStarted | |

#### `timeline`
| 字段 | 类型 |
|---|---|
| Year, Month(optional), Title, Type (Career/Education/Project/Personal/Milestone), Description (page body), Cover, Order | |

**3 个 Page**：`about`、`now`、`hire-me`（单页型，富文本）。

**环境变量**：

```bash
NOTION_TOKEN=secret_xxx
NOTION_DB_PROJECTS=xxx
NOTION_DB_THINKING=xxx
NOTION_DB_RESUME=xxx
NOTION_DB_USES=xxx
NOTION_DB_TIMELINE=xxx
NOTION_PAGE_ABOUT=xxx
NOTION_PAGE_NOW=xxx
NOTION_PAGE_HIRE=xxx
```

### 5.2 Supabase Schema

```sql
CREATE TABLE usage_events (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  device TEXT NOT NULL,
  platform TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cache_read_tokens INTEGER DEFAULT 0,
  cache_write_tokens INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,6) NOT NULL,
  session_id TEXT,
  project_path TEXT,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, ts, model, input_tokens, output_tokens)
);

CREATE INDEX idx_usage_ts ON usage_events(ts DESC);
CREATE INDEX idx_usage_platform_ts ON usage_events(platform, ts DESC);

CREATE MATERIALIZED VIEW usage_daily AS
SELECT
  DATE_TRUNC('day', ts AT TIME ZONE 'Asia/Shanghai') AS day,
  platform, device,
  SUM(input_tokens + output_tokens) AS total_tokens,
  SUM(cost_usd) AS cost_usd,
  COUNT(*) AS event_count
FROM usage_events GROUP BY 1, 2, 3;

CREATE TABLE notion_image_cache (
  block_id TEXT PRIMARY KEY,
  r2_url TEXT NOT NULL,
  source_url_hash TEXT NOT NULL,
  width INTEGER, height INTEGER,
  last_synced TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Notion 图片代理

**问题**：Notion 返回的图片 URL 带过期签名（~1 小时失效）。

**最终方案**（V2）：构建期 fetch → 上传到 R2 → 持久化 URL → notion_image_cache 表记录映射。

**MVP 方案**（V1）：直接用 Next.js `next/image` + `remotePatterns` 配置 Notion 域名 + 短 ISR 频率（5 分钟）。代价：每次 ISR 重建拿新签名，浪费请求。**等图片量超 200 张再切换到 R2 方案**。

### 5.4 API 契约

```ts
// lib/cms/projects.ts
export async function listProjects(opts?: { featured?: boolean }): Promise<Project[]>
export async function getProjectBySlug(slug: string): Promise<Project | null>

// lib/cms/thinking.ts
export async function listThinking(opts?: { tag?: string, limit?: number }): Promise<Article[]>
export async function getArticleBySlug(slug: string): Promise<Article | null>

// lib/cms/resume.ts
export async function getResume(): Promise<ResumeBundle>

// lib/cms/timeline.ts
export async function getTimeline(): Promise<TimelineNode[]>

// lib/cms/uses.ts
export async function getUses(): Promise<UsesGrouped>

// lib/cms/usage.ts (Supabase)
export async function getUsageSummary(range: 'd7' | 'd30' | 'd90'): Promise<UsageSummary>
export async function getUsageTimeseries(range: string): Promise<UsageDailyPoint[]>

// lib/cms/render.tsx
export function renderNotionBlocks(blocks: NotionBlock[]): JSX.Element
```

**ISR 策略**：列表 `revalidate: 300`，详情 `revalidate: 600`，Token 看板 `revalidate: 300`。

---

## 6. 模块详设计

### 6.1 3D Pipeline（机械模型）

**工作流**：

```
SolidWorks → STEP (AP214, 含装配体颜色)
  → CAD Assistant 手动转 .glb
  → gltfpack -c -i in.glb -o out.glb (meshopt 压缩，可选)
  → 上传到 Cloudflare R2 (models/{project-slug}/main.glb)
  → R2 公开 URL 填入 Notion projects 的 ModelGLB_URL
  → 项目详情页用 <Model3DViewer src={glbUrl} /> 渲染
```

**Viewer 功能（极简 MVP）**：
- OrbitControls（旋转 + 缩放 + 平移）
- 自适应相机（auto-fit 到 bounding box）
- 基础光照（ambient + directional）
- Loading fallback（Suspense）

**明确不做**：全屏、reset view、wireframe、studio environment、零件树、爆炸图、剖切、测量。

**工程细节**：
- `dynamic import` + `ssr: false`
- Intersection Observer 懒加载
- 警告 >5MB / >50万三角面
- 移动端：超过阈值显示"建议桌面查看"

### 6.2 Token Daemons

**3 个独立 daemon**：

#### `ccusage-sync`（部署到每台使用 Claude Code 的设备）
- 频率：每小时一次
- 命令：`ccusage --json --since yesterday` → POST `/api/usage/ingest`
- 状态：`~/.token-sync/state.json` 记录上次同步时间
- 失败重试：本地 backup queue
- 部署：launchd (mac) / Task Scheduler (win) / systemd timer (linux)

#### `anthropic-usage-poller`（部署到 1 台 always-on 设备）
- 频率：每 6 小时
- 调 Anthropic Usage Report API
- `source: anthropic-api`，作为 ccusage 校验数据源

#### `openai-usage-poller`
- 同上结构，调 OpenAI Usage API
- `source: openai-api`

**幂等性**：`UNIQUE(session_id, ts, model, input_tokens, output_tokens)` + UPSERT，冲突时官方 API 优先。

### 6.3 Notion Block Renderer

**自写组件，不用 react-notion-x**。MVP 支持：

| Block 类型 | 渲染策略 |
|---|---|
| paragraph | 标准段落 |
| heading_1/2/3 | h2/h3/h4 |
| bulleted_list / numbered_list | 嵌套列表 |
| quote | 左侧 brick-red 竖线 + italic |
| code | shiki 构建期语法高亮 |
| image | next/image + remotePatterns（V1）/ R2 代理（V2） |
| divider | hairline |
| callout | emoji + 浅色 border |
| to_do | 只读勾选 |
| bookmark | favicon + 标题 + 描述卡片 |
| table | 1px hairline 表格 |

**V2 再加**：toggle、equation、embed、video。

**富文本 spans**：bold / italic / code / strike / underline / link / color。

### 6.4 Resume → PDF 导出

**方案**：`@react-pdf/renderer` 客户端生成。

- 零服务端依赖
- 1-2 秒生成 + 直接下载
- 显式 `Font.register` 加载 Noto Serif SC 处理中文

**PDF 版面**：
- 顶部姓名 + 联系方式
- 简介（2-3 行）
- 经历（倒序）
- 教育
- 项目代表作
- 技能 & 工具

### 6.5 Timeline 模块

- 纵向时间线，左侧年份，右侧节点
- 节点 type 颜色编码（Career = 墨黑、Project = 砖红、Education = 灰、Milestone = 砖红填充）
- 点击节点展开 Notion 富文本详情（含图片）
- 默认展开最近 3 年，更早年份折叠

---

## 7. 技术栈

| 层 | 选择 | 版本 |
|---|---|---|
| 框架 | Next.js (App Router) | 15.x |
| 语言 | TypeScript | 5.x |
| 样式 | Tailwind CSS | v4 |
| 组件 | shadcn/ui | latest |
| CMS | Notion + `@notionhq/client` | latest |
| DB | Supabase Postgres | hosted |
| 文件存储 | Cloudflare R2 | - |
| 3D | React Three Fiber + drei | latest |
| 图表 | Tremor | v3 |
| PDF | `@react-pdf/renderer` | latest |
| 代码高亮 | Shiki | latest |
| 部署 | Vercel | - |

**模板基**：fork `leerob/next-mdx-blog`，剥离 MDX，替换为 Notion 数据层。

**月成本**：$0（所有服务在免费额度内）。

---

## 8. 仓库结构

```
personal_website_new/
├── apps/
│   └── web/                              # Next.js 主站
│       ├── app/
│       │   ├── (marketing)/page.tsx      # 首页
│       │   ├── about/page.tsx
│       │   ├── now/page.tsx
│       │   ├── hire-me/page.tsx
│       │   ├── uses/page.tsx
│       │   ├── projects/page.tsx
│       │   ├── projects/[slug]/page.tsx
│       │   ├── thinking/page.tsx
│       │   ├── thinking/[slug]/page.tsx
│       │   ├── resume/page.tsx
│       │   ├── timeline/page.tsx
│       │   ├── tokens/page.tsx
│       │   └── api/
│       │       ├── usage/ingest/route.ts
│       │       ├── usage/stats/route.ts
│       │       └── notion-image/route.ts
│       ├── components/
│       │   ├── ui/                       # shadcn 改造后
│       │   ├── notion/                   # NotionBlockRenderer, RichText
│       │   ├── projects/                 # ProjectCard, Model3DViewer
│       │   ├── tokens/                   # UsageChart, KpiCard
│       │   ├── timeline/
│       │   └── nav/
│       ├── lib/
│       │   ├── cms/                      # Notion 数据访问
│       │   ├── db/                       # Supabase client
│       │   ├── r2/
│       │   ├── notion-image/
│       │   └── utils.ts
│       ├── public/
│       └── package.json
├── packages/
│   └── usage-daemons/
│       ├── ccusage-sync/index.ts
│       ├── anthropic-poller/index.ts
│       ├── openai-poller/index.ts
│       └── shared/usage-client.ts
├── docs/
│   └── superpowers/specs/
├── .env.example
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

**理由**：pnpm monorepo——web 与 daemon 部署位置不同，但需要共享 `usage-client.ts` 类型与逻辑。

---

## 9. 开发阶段

### Phase 1：骨架 + 设计系统（Week 1）
- Next.js 15 + Tailwind v4 + TS 初始化
- 移植 leerob 基础结构
- 实现 Nordic 设计系统（颜色变量、字体、Nav、Footer）
- 静态版首页
- **里程碑**：localhost 上首页完全符合 mockup

### Phase 2：Notion 数据层（Week 2）
- Notion 工作区建好 6 databases + 3 pages
- `lib/cms/*` 全套封装
- 自写 Notion Block Renderer（MVP block 类型）
- 跑通所有内容页（projects、thinking、about、now、hire-me、uses、timeline、resume）
- 图片代理 MVP（next/image + remotePatterns）
- **里程碑**：所有内容页能从 Notion 拉数据渲染

### Phase 3：3D 模型查看器（Week 3 前半）
- 集成 R3F + drei
- 写 `<Model3DViewer>`（极简：OrbitControls + auto-fit + 基础光照）
- 走通完整 pipeline（SolidWorks → STEP → CAD Assistant → GLB → R2 → 网页）
- 真实模型测试至少 2 个装配体
- **里程碑**：项目详情页能流畅展示 GLB

### Phase 4：Token Daemon + 看板（Week 3 后半 + Week 4 前半）
- Supabase 表 + 物化视图
- 三个 daemon 全部实现
- 主力 Mac 部署 ccusage-sync（launchd）
- always-on 设备部署两个 poller
- `/tokens` 看板页（Tremor 图表）
- **里程碑**：看板展示真实多平台多设备数据

### Phase 5：图片代理升级 + PDF + 打磨（Week 4 后半）
- 图片代理升级到 R2 缓存版
- 简历 PDF 导出
- 移动端测试 & 优化
- SEO（sitemap.xml、robots.txt、OG image）
- Lighthouse > 95
- **里程碑**：可发给朋友、可填到简历 URL

**总工期**：half-time 投入约 4 周，全时投入约 2 周。

---

## 10. 风险清单

| 风险 | 影响 | 缓解 |
|---|---|---|
| Notion API 速率限制（3 req/s） | ISR 重建可能失败 | 加 retry + ISR 间隔 ≥5min |
| 大 GLB 文件首屏阻塞 | 项目详情页慢 | Intersection Observer 懒加载 + R2 CDN |
| Anthropic Usage API 个人账号可访问性 | Token 看板数据不全 | MVP 仅用 ccusage 本地数据 |
| 多设备时钟漂移 → ts 不准 | 时间序列异常 | daemon 统一 UTC，前端按 Asia/Shanghai 显示 |
| Notion 图片签名过期 | 渲染失败 | V2 切换 R2 持久化代理 |
| @react-pdf/renderer 中文字体 | 默认不支持中文 | 显式 `Font.register` Noto Serif SC |
| Claude Code 默认 30 天日志清理 | 历史数据丢失 | 调整 `cleanupPeriodDays` 配置 |
| LiteLLM 2026-03 供应链事件 | 不影响——本项目不用 LiteLLM | N/A |

---

## 11. References

调研依据：

- [leerob/next-mdx-blog](https://github.com/leerob/next-mdx-blog) — 模板基础
- [onur.dev](https://github.com/suyalcinkaya/onur.dev) — 视觉风格参考
- [ccusage](https://github.com/ryoppippi/ccusage) — Claude Code 本地用量
- [Langfuse](https://github.com/langfuse/langfuse) — LLM observability 调研中淘汰（V1 不上）
- [occt-import-js](https://github.com/kovacsv/occt-import-js) — 仅作 STEP 直读备选
- [Online3DViewer](https://github.com/kovacsv/Online3DViewer) — 仅作 STEP 直读备选
- [CAD Assistant](https://www.opencascade.com/products/cad-assistant/) — Open CASCADE 官方桌面转换工具
- [Anthropic Usage & Cost API](https://platform.claude.com/docs/en/build-with-claude/usage-cost-api)
- [OpenAI Usage API](https://cookbook.openai.com/examples/completions_usage_api)
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)

---

## 12. Open Questions

实施阶段需要进一步确认的点：

1. 域名选择（.dev / .me / .so / 其他）
2. 个人 Logo / Monogram 设计（在 Phase 1 之前需要敲定，或先用文字 logo "CJS"）
3. Dark mode 是否在 V1 就做（推荐 V1 只做 light，V2 加 dark）
4. RSS Feed 是否在 V1 就做
5. 是否引入 Vercel Analytics（推荐 V1 不引，纯静态先跑通）
