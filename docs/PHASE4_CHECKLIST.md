# Phase 4 上线 Checklist · Token 用量看板真实数据

> 跟着走，每完成一项打勾 `[x]`。卡住任何一步直接告诉我，附错误信息。

## 预估时间
- 不含设备部署：约 **1 小时**
- 含 N 台设备 daemon：每台 **+30-60 分钟**
- 总计：取决于你想接多少台设备

---

## A. 后端基础设施

### A.1 Supabase 账号 + project（10 分钟）

- [ ] 打开 <https://supabase.com>，用 GitHub 登录
- [ ] **New project**
  - Name: `personal-website`
  - Region: **Tokyo** 或 **Singapore**（亚洲访问快）
  - DB Password: 自动生成或自己设；存好备用
  - Pricing Plan: **Free**
- [ ] 等约 2 分钟，project 状态变为 Active

### A.2 跑 SQL Migrations（5 分钟）

打开 Supabase Dashboard → 左侧 **SQL Editor** → **New query**

按顺序执行 3 个文件的全部内容，每次粘贴后点右下 **Run**：

- [ ] `supabase/migrations/0001_usage_events.sql` → Run → "Success"
- [ ] `supabase/migrations/0002_usage_daily_view.sql` → Run → "Success"
- [ ] `supabase/migrations/0003_notion_image_cache.sql` → Run → "Success"

验证：左侧 **Table Editor** 应该看到 `usage_events`、`notion_image_cache`、`usage_daily`（物化视图）。

### A.3 拿凭证 + 填本地 .env.local（5 分钟）

打开 Supabase Dashboard → 左下 ⚙️ **Project Settings** → **API**

- [ ] 复制 **Project URL** → 填到 `apps/web/.env.local`：

  ```
  SUPABASE_URL=https://xxxx.supabase.co
  ```

- [ ] 在 **Project API keys** 卡里：
  - 复制 `service_role` 那行（点 Reveal）→ 填：

    ```
    SUPABASE_SERVICE_ROLE_KEY=eyJ...
    ```
  - 复制 `anon public` 那行 → 填：

    ```
    SUPABASE_ANON_KEY=eyJ...
    ```

  ⚠️ **service_role 是超级密钥**，永远不要进 git，永远不要写进 client 代码。

### A.4 生成 INGEST_SECRET（30 秒）

终端跑：

```bash
openssl rand -hex 32
```

- [ ] 复制输出的 64 字符串 → 填到 `apps/web/.env.local`：

  ```
  INGEST_SECRET=xxxxxxxxxxxx...（64 字符）
  ```

这个值还会用 N 次（每台 daemon 设备 + 后面 Vercel 上线时）。**先存到 1Password 之类**。

---

## B. LLM 平台凭证

### B.1 Anthropic Admin API Key（15 分钟）

- [ ] 打开 <https://console.anthropic.com>，登录
- [ ] 确认账号是 **Organization**——左上角应该显示组织名而不是个人邮箱。不是的话先升级（免费）
- [ ] 进入 **Settings** → **Admin Keys**：<https://console.anthropic.com/settings/admin-keys>
- [ ] **Create Admin Key** → 命名 `personal-website-daemon` → 复制保存（只显示一次！）

存到 1Password。**还不要**填进 .env.local——它是给 daemon 设备用的，不是网站。

### B.2 OpenAI Admin API Key（5 分钟）

- [ ] 打开 <https://platform.openai.com/settings/organization/admin-keys>
- [ ] **+ Create new admin key** → 命名 → 选权限 `Read All` 即可 → 创建
- [ ] 复制保存（只显示一次）

---

## C. 决定设备配置

### C.1 列出要接的设备

写下你的所有可能"用过 LLM"的设备：

- [ ] 设备 1（举例：mac-desktop · 主力 Mac）
- [ ] 设备 2（举例：mac-laptop · 笔记本）
- [ ] 设备 3（举例：…）

### C.2 选 always-on 设备

挑一台**保持 7×24 开机的**设备，给它跑两个 poller。候选：

- [ ] Mac mini / NAS / 旧 MacBook（最佳）
- [ ] 云服务器（次佳）
- [ ] 没有合适的？告诉我，我给你一个 Vercel Cron Jobs 改造方案

记下设备名（如 `nas-home`）：`_____________________`

---

## D. 部署 daemons

### D.1 在每台设备 clone repo 并安装

> 提示：如果你的代码还没 push 到 GitHub，先做：在 main 分支跑 `git remote add origin <github-url>` + `git push -u origin main`。

每台设备：

- [ ] `git clone <你的 github URL> ~/personal_website_new`
- [ ] `cd ~/personal_website_new && corepack pnpm install`

### D.2 给每台设备建 daemon 自己的 `.env`

每台设备**单独**建 `packages/usage-daemons/.env`（该路径已 gitignored），内容：

```bash
# 通用（所有设备一样）
INGEST_URL=http://localhost:3000/api/usage/ingest
INGEST_SECRET=<同 .env.local 那个 64 字符>

# 各设备不同
DEVICE_NAME=mac-desktop        # 改成该设备的名字

# Mac/Linux 用 Claude Code 的设备填这条：
CCUSAGE_PATH=ccusage           # 或 absolute path（先在该设备跑 `which ccusage` 确认）

# 仅 always-on 设备填这两条：
ANTHROPIC_ADMIN_API_KEY=sk-ant-admin-xxx
OPENAI_ADMIN_API_KEY=sk-admin-xxx
```

⚠️ **INGEST_URL 现在用 http://localhost:3000**——只能从同一台设备访问。Phase 5 上线 Vercel 后换成生产 URL，再让其他设备能 ingest。

- [ ] 主力 Mac 的 `.env` 建好
- [ ] always-on 设备的 `.env` 建好
- [ ] 其他设备的 `.env` 建好（若有）

### D.3 手动跑一次每个 daemon 验证

前提：本机 dev server 在 :3000 跑着。如果没跑：

```bash
cd ~/personal_website_new
corepack pnpm --filter web dev &
```

然后在**每台设备**跑对应 daemon：

- [ ] 主力 Mac 跑：
  ```bash
  corepack pnpm --filter @personal-website/usage-daemons ccusage
  ```
  期望：看到 `[ccusage-sync] inserted=N skipped_duplicates=M done`

- [ ] always-on 设备跑：
  ```bash
  corepack pnpm --filter @personal-website/usage-daemons anthropic
  corepack pnpm --filter @personal-website/usage-daemons openai
  ```

如果任何命令报错——把错误信息粘给我（特别是 `ccusage` 输出格式可能跟我代码假设的不一样，这是 LRN 标注的已知风险点）。

### D.4 验证数据进了 Supabase

Supabase Dashboard → **Table Editor** → `usage_events` 表 → 应该看到行。如果空白：

- daemon 是否真的成功？看终端 inserted 数字
- ingest API 是否 200？检查 dev server 输出
- 共享密钥是否一致？

- [ ] `usage_events` 表里看到 ≥1 行

### D.5 设置自动调度

#### macOS（launchd）

参考 `packages/usage-daemons/README.md` 里的 plist 模板。简化版本：

每台 Mac 各建一个 plist：

```bash
~/Library/LaunchAgents/local.usage.ccusage.plist          # 主力 Mac
~/Library/LaunchAgents/local.usage.anthropic.plist        # always-on 设备
~/Library/LaunchAgents/local.usage.openai.plist           # always-on 设备
```

每个 plist 把 `<ProgramArguments>` 里的命令改成对应的 pnpm filter 命令，`<StartInterval>` 设：
- ccusage：`3600`（1 小时）
- anthropic/openai：`21600`（6 小时）

加载：`launchctl load ~/Library/LaunchAgents/local.usage.xxx.plist`

- [ ] 主力 Mac 的 ccusage launchd 配好
- [ ] always-on 设备的 anthropic / openai launchd 配好

#### Linux（systemd）/ NAS / Windows

对应的方式不同——配好后告诉我，我帮你检查。

---

## E. 闭环：网站接真实数据

完成 A-D 后，**告诉我「Phase 4 数据进了」**。我会做一个 5-10 分钟的微 PR：

- 把 `apps/web/src/components/home/token-preview.tsx` 从占位假数据改为从 `/api/usage/stats` 调真实数据
- 加 client-side fetch + loading 状态
- 提交 commit + push

之后**首页 5 分钟自动刷新真实数据**，Phase 4 闭环。

---

## 卡住时

任何一步报错或不确定，把：
1. 在哪一步（如 D.3）
2. 错误完整文本
3. 你跑的具体命令

复制粘贴给我，我现场修。

---

## 选择性优化（做完核心后可选）

- [ ] 在 Vercel Cron 加一个每天 0:00 调 `SELECT refresh_usage_daily();` 的任务（刷新物化视图）
- [ ] Anthropic / OpenAI Cost API 接入（目前 daemon 只拿 token 数，cost_usd 是 0）
- [ ] 看板换更精细的图表（Tremor `<AreaChart>` 取代当前的简陋柱状图）
