# Daemon 调度模板

每台跑 `ccusage-sync` 的设备需要按周期自动运行 daemon。下面是已在 mac-laptop + cortana-box 上验证的模板。

---

## macOS · launchd（每小时）

文件位置：`~/Library/LaunchAgents/local.usage.ccusage.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>local.usage.ccusage</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd /Users/jason/Project/personal_website_new &amp;&amp; /usr/local/bin/corepack pnpm --filter @personal-website/usage-daemons ccusage</string>
  </array>

  <key>StartInterval</key>
  <integer>3600</integer>

  <key>RunAtLoad</key>
  <true/>

  <key>StandardOutPath</key>
  <string>/tmp/usage-ccusage.out.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/usage-ccusage.err.log</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
```

加载：
```bash
launchctl load ~/Library/LaunchAgents/local.usage.ccusage.plist
```

卸载：
```bash
launchctl unload ~/Library/LaunchAgents/local.usage.ccusage.plist
```

查看运行状态：
```bash
launchctl list | grep usage.ccusage
# 字段：PID  上次退出码  Label
```

日志：
```bash
tail -f /tmp/usage-ccusage.out.log     # daemon 正常输出
tail -f /tmp/usage-ccusage.err.log     # 错误（包含 ccusage 跳过 session 提示）
```

注意：把 plist 里的 corepack 路径换成实际值。Apple Silicon 用 brew 装 node 通常在 `/opt/homebrew/bin/`；Intel Mac + 旧版 npm/nvm 装的会在 `/usr/local/bin/` 或 nvm 的版本目录里。用 `which corepack` 拿真实路径。

---

## Linux · systemd user units（每小时）

两个文件 + 一次性 enable + start。

`~/.config/systemd/user/usage-ccusage.service`：

```ini
[Unit]
Description=Personal Website · ccusage-sync daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=/home/jason/projects/personal_website_2026
Environment="PATH=/home/jason/.npm-global/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/corepack pnpm --filter @personal-website/usage-daemons ccusage
StandardOutput=journal
StandardError=journal
TimeoutStartSec=120
```

`~/.config/systemd/user/usage-ccusage.timer`：

```ini
[Unit]
Description=Run ccusage-sync every hour
Requires=usage-ccusage.service

[Timer]
OnBootSec=2min
OnUnitActiveSec=1h
Unit=usage-ccusage.service
Persistent=true

[Install]
WantedBy=timers.target
```

启用：
```bash
loginctl enable-linger $USER     # 让 timer 在用户没登录时也能跑
systemctl --user daemon-reload
systemctl --user enable --now usage-ccusage.timer
```

状态：
```bash
systemctl --user list-timers usage-ccusage.timer
systemctl --user status usage-ccusage.service
journalctl --user -u usage-ccusage.service -n 50 --no-pager
```

手动触发（不等下一小时）：
```bash
systemctl --user start usage-ccusage.service
```

---

## Windows · Task Scheduler（每小时）

PowerShell 一次性建任务：

```powershell
$action = New-ScheduledTaskAction `
  -Execute "pwsh.exe" `
  -Argument "-NoProfile -Command `"cd C:\path\to\personal_website_new; corepack pnpm --filter @personal-website/usage-daemons ccusage`""

$trigger = New-ScheduledTaskTrigger `
  -Once -At (Get-Date).AddMinutes(2) `
  -RepetitionInterval (New-TimeSpan -Hours 1)

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask `
  -TaskName "PersonalWebsiteCcusageSync" `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Sync ccusage events to personal website ingest API hourly"
```

查看：`Get-ScheduledTask -TaskName "PersonalWebsiteCcusageSync"`
卸载：`Unregister-ScheduledTask -TaskName "PersonalWebsiteCcusageSync" -Confirm:$false`

---

## 通用故障排查

| 现象 | 原因 | 解法 |
|---|---|---|
| 看到 `spawn ccusage ENOENT` | CCUSAGE_PATH 不是绝对路径 + daemon 启动时 PATH 没有 ccusage | 设 CCUSAGE_PATH 为 `which ccusage` 拿到的绝对路径 |
| 看到 `fetch failed` | INGEST_URL 指向的服务（笔记本 dev 或 Vercel）没活着 | 起 dev server / 检查 Vercel 部署 |
| 看到 `unauthorized` | INGEST_SECRET 不匹配 | 用 `grep INGEST_SECRET apps/web/.env.local` 重对一份 |
| 经常 `skipped N sessions without timestamp` | ccusage 给出的某些 session 没有 lastActivity 也没识别的 period 格式 | 多半是 Hermes "api-mode"，1-2% 数据损失，可接受 |
| timer / launchd 设置好但 daemon 一直不跑 | PATH 没有 corepack/node | 在 service 文件里显式 set PATH，或 ProgramArguments 用绝对路径 |
