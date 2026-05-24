export interface UsageEvent {
  ts: string;                    // ISO 8601 UTC
  device: string;
  platform: 'anthropic' | 'openai' | 'google';
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
  cost_usd: number;
  session_id?: string | null;
  project_path?: string | null;
  source: 'ccusage' | 'anthropic-usage-api' | 'openai-usage-api';
}

export interface IngestResponse {
  inserted: number;
  skipped_duplicates: number;
}
