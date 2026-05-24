# Supabase setup

Run migrations in order from the Supabase SQL editor (Project → SQL Editor → New query):

1. `migrations/0001_usage_events.sql` — main events table
2. `migrations/0002_usage_daily_view.sql` — materialized view for the dashboard
3. `migrations/0003_notion_image_cache.sql` — Phase 5 image proxy table

Or via the Supabase CLI:
```bash
supabase db push  # if using local dev
```

After 0001 + 0002 run, the API ingest route at `/api/usage/ingest` will accept POSTs from the daemons.

Materialized view refresh:
- Manually: `SELECT refresh_usage_daily();`
- Scheduled: use Supabase pg_cron or a daily Edge Function

## Permissions

- Service role key is required to write to `usage_events`. Daemons authenticate with this key.
- Anon role can SELECT from `usage_daily` (read-only) for the public dashboard. Add an RLS policy if you want to expose this directly — for V1 the dashboard goes through the API route, so RLS is not strictly required.
