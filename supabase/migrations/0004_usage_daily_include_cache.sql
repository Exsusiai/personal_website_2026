-- ============================================================
-- Fix: include cache_read + cache_write tokens in total_tokens
-- ============================================================
-- 0002 created usage_daily with total_tokens = input + output only.
-- Claude Code (and similar agents) push almost ALL their context through
-- prompt caching → cache_read_tokens dominate (often 99% of true usage).
-- The original definition under-reported total tokens by 100-500x.
--
-- Drop the view (PG does not support ALTER on materialized view query) and
-- recreate with the corrected total formula + extra columns so future
-- dashboards can break down cache vs non-cache.

DROP MATERIALIZED VIEW IF EXISTS usage_daily CASCADE;

CREATE MATERIALIZED VIEW usage_daily AS
SELECT
  DATE_TRUNC('day', ts AT TIME ZONE 'Asia/Shanghai') AS day,
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

-- Initial populate
REFRESH MATERIALIZED VIEW usage_daily;
