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
  cost_usd: number;
  session_id?: string | null;
  project_path?: string | null;
  source: string;                // 'ccusage' | 'openclaw-plugin' | 'hermes-plugin' | ...
}

export interface IngestResponse {
  inserted: number;
  skipped_duplicates: number;
}
