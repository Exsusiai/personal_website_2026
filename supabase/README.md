# Supabase setup

Run migrations **in order** from the Supabase SQL editor (Project → SQL Editor → New query):

1. `migrations/0001_usage_events.sql` — main events table + RLS enabled
2. `migrations/0002_usage_daily_view.sql` — materialized view + access control
3. `migrations/0003_notion_image_cache.sql` — Phase 5 image proxy table + RLS enabled
4. `migrations/0004_usage_daily_include_cache.sql` — fold `cache_read_tokens` + `cache_write_tokens` into the view's total
5. `migrations/0005_dedup_by_session_model.sql` — replace dedup constraint with `(session_id, model)` so cumulative ccusage snapshots UPSERT instead of duplicating
6. `migrations/0006_dedup_org_pollers.sql` — clean up NULL-session org-poller duplicates, retrofit deterministic IDs, widen UNIQUE to `(source, session_id, model)`

Or via the Supabase CLI:

```bash
supabase db push  # if using local dev
```

After 0001 + 0002 run, the API ingest route at `/api/usage/ingest` will accept POSTs from the daemons.

Materialized view refresh:
- Manually: `SELECT refresh_usage_daily();`
- Scheduled: use Supabase pg_cron or a daily Edge Function

## Security model

| Role | usage_events | usage_daily | notion_image_cache |
|---|---|---|---|
| `service_role` | ✅ full (bypasses RLS) | ✅ explicit GRANT | ✅ full (bypasses RLS) |
| `anon` | ❌ default deny (RLS, no policy) | ❌ revoked | ❌ default deny |
| `authenticated` | ❌ default deny | ❌ revoked | ❌ default deny |

**All access must go through the Next.js API routes** (`/api/usage/ingest` write, `/api/usage/stats` read), which authenticate via `INGEST_SECRET` and internally use the `service_role` key. The `anon` / `authenticated` keys exist for future use but currently expose zero data.

If you later want client-side direct reads (e.g., a React component that queries Supabase via the JS SDK), add a SELECT policy:

```sql
CREATE POLICY "public read usage_daily" ON usage_events
  FOR SELECT TO anon, authenticated USING (true);
-- (and grant on the view if needed)
```

But for V1, the API-route-only pattern is preferred — less attack surface, easier to add caching/aggregation logic.
