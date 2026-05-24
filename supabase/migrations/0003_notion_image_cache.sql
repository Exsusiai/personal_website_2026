-- Phase 5: Notion image proxy persistence (deferred from MVP)
CREATE TABLE IF NOT EXISTS notion_image_cache (
  block_id TEXT PRIMARY KEY,            -- Notion image block id
  r2_url TEXT NOT NULL,                 -- public R2 URL (post-upload)
  source_url_hash TEXT NOT NULL,        -- hash of de-signed source URL for change detection
  width INTEGER,
  height INTEGER,
  last_synced TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notion_image_synced ON notion_image_cache(last_synced DESC);
