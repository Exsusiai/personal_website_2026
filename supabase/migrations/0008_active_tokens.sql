-- ============================================================
-- Change: introduce "active tokens" metric + reasoning_tokens column
-- ============================================================
-- Why: Dashboard previously displayed raw token traffic (input + output +
-- cache_read + cache_write), where cache_read often dominated 90%+ of the
-- number and made the headline figure look inflated relative to "real new
-- work done". The new "active_tokens" metric excludes cache_read so the
-- public KPI tracks new processing, while cache_read is still surfaced
-- separately to show cache efficiency.
--
-- Also adds reasoning_tokens, which ccusage records for some agents
-- (Hermes / Codex o1/o3) as `extra_total_tokens`. The previous schema
-- silently dropped these. We compute the diff on the sync side and persist
-- it here, then fold it into active_tokens (it's "real" model work, just
-- a different SKU than output).
--
-- The view also gains `model` in its GROUP BY so the read path can apply
-- per-model API pricing for the "API-rate value" estimate; the previous
-- aggregation collapsed all models per platform and lost that signal.
--
-- Schema change is non-destructive for usage_events: ADD COLUMN with
-- DEFAULT 0 backfills existing rows. The materialized view is DROP+CREATE
-- because Postgres doesn't allow ALTER on a MV's underlying query.

-- 1. Persist reasoning / extra tokens on raw events
ALTER TABLE usage_events
  ADD COLUMN IF NOT EXISTS reasoning_tokens INTEGER NOT NULL DEFAULT 0;

-- 2. Recreate usage_daily with model granularity + new columns
DROP MATERIALIZED VIEW IF EXISTS usage_daily CASCADE;

CREATE MATERIALIZED VIEW usage_daily AS
SELECT
  DATE_TRUNC('day', ts AT TIME ZONE 'Europe/Berlin') AS day,
  platform,
  device,
  model,
  -- Raw token traffic (kept for backwards compat and for total-volume callers)
  SUM(input_tokens + output_tokens + cache_read_tokens + cache_write_tokens + reasoning_tokens) AS total_tokens,
  -- Active tokens = "new model work done", excludes cache reads (which are
  -- the cheap re-uses of already-cached context). This is the headline
  -- public number.
  SUM(input_tokens + output_tokens + cache_write_tokens + reasoning_tokens) AS active_tokens,
  SUM(input_tokens) AS input_tokens,
  SUM(output_tokens) AS output_tokens,
  SUM(cache_read_tokens) AS cache_read_tokens,
  SUM(cache_write_tokens) AS cache_write_tokens,
  SUM(reasoning_tokens) AS reasoning_tokens,
  SUM(cost_usd) AS cost_usd,
  COUNT(*) AS event_count
FROM usage_events
GROUP BY 1, 2, 3, 4;

-- PK is now (day, platform, device, model). Adding model means more rows
-- in the view (~3-5x in practice — a single device hits a handful of
-- models per day), still tiny in absolute terms.
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_daily_pk
  ON usage_daily(day, platform, device, model);

REVOKE ALL ON usage_daily FROM anon, authenticated, public;
GRANT SELECT ON usage_daily TO service_role;

-- DROP CASCADE removed the refresh function; recreate it.
CREATE OR REPLACE FUNCTION refresh_usage_daily() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY usage_daily;
END;
$$ LANGUAGE plpgsql;

-- Initial populate
REFRESH MATERIALIZED VIEW usage_daily;
