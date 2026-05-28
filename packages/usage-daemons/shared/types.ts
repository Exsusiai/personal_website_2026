/**
 * Platform is a free-form string. Common values observed:
 *   anthropic / openai / google / github / deepseek / zhipu / minimax
 *   moonshot / local (Ollama / vLLM) / other
 *
 * Source is the ingestion path; future sources may include openclaw-plugin,
 * hermes-plugin, custom-app etc.
 */
export interface UsageEvent {
  ts: string;                    // ISO 8601 UTC
  device: string;
  platform: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
  /**
   * Extra/reasoning tokens reported by sources like ccusage's `extra_total_tokens`
   * (Hermes / o1 / o3 reasoning models). Optional because most sources don't
   * report this separately. Folded into "active tokens" downstream.
   */
  reasoning_tokens?: number;
  cost_usd: number;
  session_id?: string | null;
  project_path?: string | null;
  source: string;                // 'ccusage' | 'openclaw-plugin' | 'hermes-plugin' | ...
}

export interface IngestResponse {
  /**
   * Rows affected by the UPSERT (covers both new inserts AND in-place updates
   * of cumulative ccusage snapshots). Renamed from `inserted` to make the
   * UPSERT-replace semantics explicit. Prior name implied "rows newly added",
   * which has been wrong since the dedup migration.
   */
  affected: number;
}
