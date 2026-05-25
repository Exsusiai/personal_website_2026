# Usage Daemons

Three independent processes that ship LLM token usage data to the website's `/api/usage/ingest` endpoint.

## Architecture

```
Each Mac/Linux device with Claude Code
       │
       ▼  ccusage-sync (hourly, launchd / cron / systemd)
       │
       ▼   POST /api/usage/ingest (shared secret)
       │
       ▼ Supabase usage_events table
       ▲
       │   POST /api/usage/ingest
       │
Always-on device (NAS/Mac mini/VM)
       │
       ├── anthropic-poller (6-hourly): Anthropic Org Usage API
       └── openai-poller   (6-hourly): OpenAI Admin Usage API
```

All three idempotently UPSERT into `usage_events` using the unique constraint
`(source, session_id, model)`.

- `source` separates daemons so e.g. `ccusage` and `openai-usage-api` rows cannot
  collide on coincidentally-equal session ids.
- For cumulative-snapshot sources (`ccusage`), repeated runs overwrite the
  same row with the latest cumulative counters.
- For org pollers (`openai-usage-api`, `anthropic-usage-api`), each daemon
  mints a deterministic `session_id` of the form
  `<provider>-org:<unix_epoch_seconds>:<model>`. Earlier versions used
  `session_id: null` which bypassed the UNIQUE constraint (Postgres treats
  NULLs as distinct) — see `supabase/migrations/0006_dedup_org_pollers.sql`.

Every production source MUST emit a non-null `session_id`. New event-style
sources should pick a stable identifier so they UPSERT instead of accumulating.

## Setup

```bash
corepack pnpm install
```

Set env vars in your shell or a `.env` file (loaded by tsx automatically):

```
INGEST_URL=https://yoursite.com/api/usage/ingest
INGEST_SECRET=<32+ char random secret, same as Vercel env>
DEVICE_NAME=mac-desktop
ANTHROPIC_ADMIN_API_KEY=sk-ant-admin-xxx
OPENAI_ADMIN_API_KEY=sk-admin-xxx
```

## Run

```bash
corepack pnpm --filter @personal-website/usage-daemons ccusage     # ship local Claude Code logs
corepack pnpm --filter @personal-website/usage-daemons anthropic   # poll Anthropic Org API
corepack pnpm --filter @personal-website/usage-daemons openai      # poll OpenAI Admin API
```

## Schedule (per device)

### macOS (launchd)
Save to `~/Library/LaunchAgents/local.usage.ccusage.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>local.usage.ccusage</string>
  <key>ProgramArguments</key>
    <array>
      <string>/bin/zsh</string><string>-lc</string>
      <string>cd /path/to/personal_website_new && corepack pnpm --filter @personal-website/usage-daemons ccusage</string>
    </array>
  <key>StartInterval</key><integer>3600</integer>
  <key>RunAtLoad</key><true/>
</dict></plist>
```
Load: `launchctl load ~/Library/LaunchAgents/local.usage.ccusage.plist`

### Linux (systemd timer)
See `~/.config/systemd/user/usage-ccusage.{service,timer}` example in this README's git history.

### Windows (Task Scheduler)
Create a task running `pnpm.cmd --filter @personal-website/usage-daemons ccusage` hourly.
