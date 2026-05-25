-- ============================================================
-- Change: re-bucket usage_daily on Europe/Berlin instead of Asia/Shanghai
-- ============================================================
-- Why: site owner lives in Berlin; Shanghai TZ was a leftover from initial
-- author location. Berlin (CET/CEST) day boundaries align with the operator's
-- real working rhythm.
--
-- Drop + recreate is required because Postgres does not support ALTER on the
-- query of a materialized view. Schema is otherwise identical to 0004.

DROP MATERIALIZED VIEW IF EXISTS usage_daily CASCADE;

CREATE MATERIALIZED VIEW usage_daily AS
SELECT
  DATE_TRUNC('day', ts AT TIME ZONE 'Europe/Berlin') AS day,
  platform,
  device,
  SUM(input_tokens + output_tokens + cache_read_tokens + cache_write_tokens) AS total_tokens,
  SUM(input_tokens) AS input_tokens,
  SUM(output_tokens) AS output_tokens,
  SUM(cache_read_tokens) AS cache_read_tokens,
  SUM(cache_write_tokens) AS cache_write_tokens,
  SUM(cost_usd) AS cost_usd,
  COUNT(*) AS event_count
FROM usage_events
GROUP BY 1, 2, 3;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_daily_pk ON usage_daily(day, platform, device);

REVOKE ALL ON usage_daily FROM anon, authenticated, public;
GRANT SELECT ON usage_daily TO service_role;

-- Recreate the refresh function (DROP CASCADE dropped it)
CREATE OR REPLACE FUNCTION refresh_usage_daily() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY usage_daily;
END;
$$ LANGUAGE plpgsql;

-- Initial populate with Berlin-bucketed data
REFRESH MATERIALIZED VIEW usage_daily;
