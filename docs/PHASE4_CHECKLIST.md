# Phase 4 上线 Checklist · Token 用量看板真实数据

> 跟着走，每完成一项打勾 `[x]`。卡住任何一步直接告诉我，附错误信息。
>
> **2026-05-25 修订**：基于用户实际架构调整——订阅模式（Claude Max / ChatGPT Pro）+ 多 LLM CLI 工具栈（Claude Code / Codex / OpenCode）+ 服务器跑 OpenClaw + Hermes。
> 删除原 Anthropic / OpenAI Admin Usage API poller（订阅消耗看不到），改为 ccusage 多 agent 模式 + 服务器侧 plugin 自报告。

## 你的实际架构

```
笔记本（开机时用）                          服务器（24/7）
├── Claude Code                            ├── ccusage-sync（服务器自身 CLI 用量）
├── Codex CLI                              ├── OpenClaw plugin → POST ingest
├── OpenCode (sst/opencode)                └── Hermes plugin   → POST ingest
└── Claude Code 切到 GLM/DeepSeek/Qwen
        ↓                                                ↓
        ccusage-sync (每小时 launchd)
        所有 CLI 日志 → 一个 daemon 全搞定
        ↓                                                ↓
        └──────────────┬─────────────────────────────────┘
                       ▼
              POST /api/usage/ingest (Bearer + secret)
                       ▼
                 Supabase usage_events
                       ▼
                 网站 TokenPreview 卡片
```

---

## A. 后端基础设施 · ✅ 已完成

- [x] **A.1** Supabase 账号 + project（Tokyo / Singapore region）
- [x] **A.2** 3 个 SQL migration（含 RLS + view 权限）跑通
- [x] **A.3** Project URL / service_role key / anon key 填入 `apps/web/.env.local`
- [x] **A.4** INGEST_SECRET（64 字符 hex，指纹 `2e...6f`，已写入 `.env.local`）。后面需要时：

  ```bash
  grep INGEST_SECRET apps/web/.env.local
  ```

---

## ~~B. LLM 平台 Admin 凭证~~ · **已删除**

订阅模式（Claude Max / ChatGPT Pro / Codex 订阅）的消耗**不通过** Anthropic / OpenAI 的 Admin Usage API——那个 API 只看按 token 计费的调用。所以这一节整个跳过。

如果你**未来切到 API key 计费**，再开 Admin Key + 部署 `anthropic-poller` / `openai-poller` daemon（代码已在 `packages/usage-daemons/` 留着，等你激活）。

---

## C. 决定设备配置（5 分钟）

### C.1 列出要接的设备

- [ ] **笔记本** · 设备名建议 `mac-laptop` · 跑 ccusage-sync
- [ ] **24/7 服务器** · 设备名建议 `home-server` · 跑 ccusage-sync + OpenClaw plugin + Hermes plugin

### C.2 服务器角色确认

服务器现在做的事：
- 跑 OpenClaw（TS / Node 24+）
- 跑 Hermes（Python 3.11）
- 跑 ccusage-sync（如果服务器上也用 CLI 工具，比如远程 SSH 上去用 Claude Code）

---

## ✅ Phase 4 主线已完成（2026-05-25）

数据流端到端跑通：
- `mac-laptop` + `cortana-box` 两台设备，**launchd / systemd timer 每小时自动跑**
- 当前库内 ~620 events，~$2000 等价值
- ingest API 每次 insert 后自动 `REFRESH MATERIALIZED VIEW`，首页 5min ISR 自动更新
- 首页 TokenPreview 显示真实 30 天聚合数据

自动调度模板见 `docs/deployment/scheduling.md`（macOS launchd / Linux systemd / Windows Task Scheduler 三套）。

下面的 D / F 章节保留作为部署文档参考。已勾完。

---

## D. 部署 ccusage-sync daemon（每台设备）

### D.1 推 repo 到 GitHub（如果还没推）

- [ ] 在 GitHub 创建 private repo
- [ ] 本地 main 分支：
  ```bash
  git remote add origin git@github.com:<你的用户名>/personal-website.git
  git push -u origin main
  ```

### D.2 在每台设备 clone + install

笔记本和服务器**都要**做：

- [ ] `git clone <repo> ~/personal_website_new`
- [ ] `cd ~/personal_website_new && corepack pnpm install`

> 跨设备的 daemon 通过 `INGEST_URL` 调 API。Phase 5 上线 Vercel 之前，你需要二选一：
> - **选 a**：用 Tailscale 把笔记本的 :3000 暴露给服务器内网，daemon 走 `http://laptop.tailnet:3000`
> - **选 b**：先只在笔记本上跑 daemon，服务器侧 ccusage-sync 等上线 Vercel 后再起
>
> 我推荐 **选 b**——先把数据流跑通验证再加复杂度。

### D.3 建 daemon `.env`（每台设备各一份）

`packages/usage-daemons/.env`（已 gitignored）：

```bash
INGEST_URL=http://localhost:3000/api/usage/ingest  # 上线后改 Vercel URL
INGEST_SECRET=<grep INGEST_SECRET apps/web/.env.local 取得的 64 字符>

DEVICE_NAME=mac-laptop   # 笔记本填这个；服务器改成 home-server
CCUSAGE_PATH=ccusage     # 实际路径用 `which ccusage` 确认；不一定就是 ccusage
```

- [ ] 笔记本 `.env` 建好
- [ ] 服务器 `.env` 建好（如果你选了上面 D.2 的 a 方案）

### D.4 手动跑一次验证

**前置**：本机 dev server 在 :3000 跑着（如果没跑：`corepack pnpm --filter web dev &`）。

笔记本（你已经有 70 个 ccusage session 的真实数据）：

- [ ] 跑：
  ```bash
  corepack pnpm --filter @personal-website/usage-daemons ccusage
  ```
  期望：`[ccusage-sync] mapped N events from M sessions` + `inserted=X skipped_duplicates=Y done`

服务器（如果跑了）：
- [ ] 同样命令。如果服务器没用过任何 CLI 工具，会输出 `mapped 0 events`，正常

### D.5 验证 Supabase 里有数据

- [ ] **Table Editor** → `usage_events` → 看到行
- [ ] SQL Editor 跑一条诊断查询：
  ```sql
  SELECT platform, COUNT(*) AS sessions,
         SUM(input_tokens + output_tokens) AS tokens,
         SUM(cost_usd) AS cost
  FROM usage_events
  GROUP BY platform
  ORDER BY tokens DESC;
  ```
  你应该看到 anthropic / openai / minimax 等多平台分布

### D.6 自动调度（每台设备）

#### 笔记本（macOS · launchd）

参考 `packages/usage-daemons/README.md`：
- [ ] 建 `~/Library/LaunchAgents/local.usage.ccusage.plist`
- [ ] `<StartInterval>3600</StartInterval>`
- [ ] `launchctl load ~/Library/LaunchAgents/local.usage.ccusage.plist`

#### 服务器（按系统）

- [ ] Linux：systemd timer
- [ ] 群晖：Container Manager
- [ ] macOS Server：launchd

---

## E. 服务器端 Agent 集成（后续）

⏸️ **暂时跳过**——先把 A-D 跑通 + F 闭环之后再做这段。

### E.1 OpenClaw plugin（TypeScript，等待我写）

OpenClaw 是 Node 24 / TS 项目，有 plugin + hook 系统。需要写一个 plugin 在每次 LLM 调用完成后把 token 数据 POST 到 `/api/usage/ingest`。

**待我做**：
- [ ] 读 OpenClaw 官方 docs 确认正确的 hook 名（需要拉源码验证，不能凭印象）
- [ ] 写 `packages/usage-openclaw-plugin/`（~50 行 TS）
- [ ] 提供安装到 OpenClaw 的步骤

### E.2 Hermes plugin（Python，等待我写）

Hermes 是 Python 3.11 / NousResearch 项目，同样有 plugin + hook 系统。

**待我做**：
- [ ] 读 Hermes 官方 docs 找到能拿到 usage 数据的 hook
- [ ] 写 `packages/usage-hermes-plugin/`（Python 模块）
- [ ] 提供安装步骤

---

## F. 闭环 · 网站接真实数据

完成 A-D 后，告诉我「**Phase 4 数据进了**」。我会做一个 5-10 分钟的 micro PR：

- 把 `apps/web/src/components/home/token-preview.tsx` 从占位假数据换成调 `/api/usage/stats` 真实数据
- 加 client-side fetch + loading 状态
- 提交 + push

之后首页 5 分钟自动刷新真实数据，**Phase 4 主线闭环**。E 段（OpenClaw / Hermes）作为增量集成后续加。

---

## 选择性优化（核心闭环后可选）

- [ ] Vercel Cron 每天 0:00 调 `SELECT refresh_usage_daily();`（刷新物化视图）
- [ ] 看板换成 Tremor `<AreaChart>` 替代当前简陋柱状图
- [ ] 验证 ccusage 是否原生支持 GitHub Copilot CLI；不支持的话写个小 adapter
