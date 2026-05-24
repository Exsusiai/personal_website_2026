-- Materialized view: daily aggregates by platform + device (Asia/Shanghai day boundary)
CREATE MATERIALIZED VIEW IF NOT EXISTS usage_daily AS
SELECT
  DATE_TRUNC('day', ts AT TIME ZONE 'Asia/Shanghai') AS day,
  platform,
  device,
  SUM(input_tokens + output_tokens) AS total_tokens,
  SUM(input_tokens) AS input_tokens,
  SUM(output_tokens) AS output_tokens,
  SUM(cost_usd) AS cost_usd,
  COUNT(*) AS event_count
FROM usage_events
GROUP BY 1, 2, 3;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_daily_pk ON usage_daily(day, platform, device);

-- Refresh helper: schedule via Supabase cron or call from API on demand
CREATE OR REPLACE FUNCTION refresh_usage_daily() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY usage_daily;
END;
$$ LANGUAGE plpgsql;
