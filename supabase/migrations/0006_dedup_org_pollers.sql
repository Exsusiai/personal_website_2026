-- ============================================================
-- Fix: dedup org-poller rows that accumulated under NULL session_id,
--      retrofit a deterministic session_id, and widen the UNIQUE
--      constraint to include `source`.
-- ============================================================
-- Background
--   The Anthropic + OpenAI org pollers used to emit `session_id = NULL`.
--   Postgres UNIQUE treats NULLs as distinct, so every rolling 24h poll
--   inserted another copy of the same (ts, model) bucket — inflating both
--   token totals and cost.
--
--   The poller code (A1) now emits a deterministic id of the form
--   `<provider>-org:<unix_epoch_seconds>:<model>`. This migration:
--     1. Dedups existing NULL rows within each org bucket.
--     2. Retrofits the surviving rows to the deterministic id so the next
--        poll UPSERT-replaces instead of inserting again.
--     3. Widens UNIQUE to (source, session_id, model) so different sources
--        can never accidentally collide on the same session id.
--     4. Refreshes usage_daily to reflect the deduplicated data.
--
-- Note: Postgres still treats NULL session_id values as distinct under
-- this constraint. Going forward every production source MUST emit a
-- non-null session_id (the new pollers do; ccusage always did).

-- 1. Within NULL-session org rows, keep only the row with max id per bucket.
--    Identity = (source, ts, model, device). Drop earlier duplicates.
DELETE FROM usage_events a
USING usage_events b
WHERE a.id < b.id
  AND a.session_id IS NULL
  AND b.session_id IS NULL
  AND a.source = b.source
  AND a.source IN ('openai-usage-api', 'anthropic-usage-api')
  AND a.ts = b.ts
  AND a.model = b.model
  AND a.device = b.device;

-- 2. Retrofit deterministic session_id on surviving rows so next poll matches.
UPDATE usage_events
SET session_id = 'openai-org:' || EXTRACT(EPOCH FROM ts)::bigint || ':' || model
WHERE source = 'openai-usage-api' AND session_id IS NULL;

UPDATE usage_events
SET session_id = 'anthropic-org:' || EXTRACT(EPOCH FROM ts)::bigint || ':' || model
WHERE source = 'anthropic-usage-api' AND session_id IS NULL;

-- 3. Replace dedup constraint with one that also separates by source.
ALTER TABLE usage_events DROP CONSTRAINT IF EXISTS usage_events_dedup;
ALTER TABLE usage_events
  ADD CONSTRAINT usage_events_dedup UNIQUE (source, session_id, model);

-- 4. Refresh the materialized view to reflect deduplicated data.
REFRESH MATERIALIZED VIEW usage_daily;
