-- Phase 4: LLM token usage events
-- Source of truth for multi-device, multi-platform LLM consumption
CREATE TABLE IF NOT EXISTS usage_events (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  device TEXT NOT NULL,                    -- e.g. mac-desktop, mac-laptop, cloud-srv
  platform TEXT NOT NULL,                  -- anthropic / openai / google
  model TEXT NOT NULL,                     -- claude-opus-4-7, gpt-5, gemini-2-flash
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  session_id TEXT,                         -- cross-device dedup key
  project_path TEXT,
  source TEXT NOT NULL,                    -- ccusage / anthropic-usage-api / openai-usage-api
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT usage_events_dedup UNIQUE (session_id, ts, model, input_tokens, output_tokens)
);

CREATE INDEX IF NOT EXISTS idx_usage_ts ON usage_events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_usage_platform_ts ON usage_events(platform, ts DESC);
CREATE INDEX IF NOT EXISTS idx_usage_device_ts ON usage_events(device, ts DESC);
