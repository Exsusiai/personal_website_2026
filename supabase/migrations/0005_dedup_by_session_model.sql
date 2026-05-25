-- ============================================================
-- Fix: replace UNIQUE constraint to dedup by (session_id, model)
-- ============================================================
-- The original constraint (session_id, ts, model, input_tokens, output_tokens)
-- treats every cumulative-counter snapshot from ccusage as a NEW row because
-- input_tokens / output_tokens grow between syncs while the session is active.
-- Net effect: same session counted N times (~50%+ inflation when long sessions
-- get synced multiple times by the hourly daemon).
--
-- Fix: a session × model pair gets exactly ONE row holding the LATEST
-- cumulative totals from ccusage. The ingest API switches to UPSERT-replace
-- (no ignoreDuplicates) so re-syncs overwrite older snapshots.

-- 1. Drop old constraint
ALTER TABLE usage_events DROP CONSTRAINT IF EXISTS usage_events_dedup;

-- 2. Delete duplicate rows, keeping the row with the MAX id per (session_id, model).
-- The max id correlates with the most recent INSERT, which holds the largest
-- (and therefore most current) cumulative counters from ccusage.
DELETE FROM usage_events a
USING usage_events b
WHERE a.id < b.id
  AND a.session_id IS NOT NULL
  AND a.session_id = b.session_id
  AND a.model = b.model;

-- 3. Add new UNIQUE constraint on (session_id, model)
ALTER TABLE usage_events
  ADD CONSTRAINT usage_events_dedup UNIQUE (session_id, model);

-- 4. Refresh the materialized view to reflect the dedup'd data
REFRESH MATERIALIZED VIEW usage_daily;
