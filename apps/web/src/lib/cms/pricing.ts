/**
 * API-rate pricing for "API-rate value" estimation. Prices are per million
 * tokens, expressed in USD, taken from public provider price pages as of
 * 2026-05. We use these ONLY as a fallback: when a source ingest already
 * carries a non-zero cost_usd (ccusage computes cost from its own price
 * table), we trust that number. When cost_usd is 0 (currently true for the
 * OpenAI / Anthropic org pollers), we estimate via this table.
 *
 * "API-rate value" is intentionally not labeled as actual spend — most local
 * Claude Code / Codex / OpenClaw usage is subscription-backed and not billed
 * at API rates. The number represents "what these tokens would cost on the
 * public API price list."
 *
 * Patterns are evaluated in order; the FIRST match wins. Put more specific
 * patterns before generic ones (e.g. claude-opus before claude-).
 *
 * If no pattern matches, DEFAULT_PRICE is used. Update this table when
 * provider pricing changes — keep references next to each block.
 */

export interface TokenCounts {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
  reasoning_tokens?: number;
}

interface PriceEntry {
  /** Per-million-token prices in USD. */
  input: number;
  output: number;
  /** Defaults to 1.25× input (typical cache-write premium) if not set. */
  cacheWrite?: number;
  /** Defaults to 0.1× input (typical cache-read discount) if not set. */
  cacheRead?: number;
  /** Reasoning tokens billed as output by all known providers. */
  reasoning?: number;
}

interface PriceRule {
  match: RegExp;
  price: PriceEntry;
}

// Conservative default: roughly Sonnet-tier pricing. Used when nothing matches
// (e.g. local Ollama, OpenRouter rare models). Slight overestimate is safer
// than understating "API-rate value".
const DEFAULT_PRICE: PriceEntry = { input: 3, output: 15 };

// References:
// - Anthropic:    https://docs.anthropic.com/en/docs/about-claude/pricing
// - OpenAI:       https://platform.openai.com/docs/pricing
// - Google Vertex/Gemini: https://cloud.google.com/vertex-ai/generative-ai/pricing
// - DeepSeek:     https://api-docs.deepseek.com/quick_start/pricing
const RULES: PriceRule[] = [
  // ---------- Anthropic Claude ----------
  // Order matters: opus > sonnet > haiku, and specific versions before family.
  { match: /^claude-opus-4/i,   price: { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 } },
  { match: /^claude-sonnet-4/i, price: { input: 3,  output: 15, cacheWrite: 3.75,  cacheRead: 0.3 } },
  { match: /^claude-haiku-4/i,  price: { input: 1,  output: 5,  cacheWrite: 1.25,  cacheRead: 0.1 } },
  { match: /^claude-opus-3/i,   price: { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 } },
  { match: /^claude-sonnet-3/i, price: { input: 3,  output: 15, cacheWrite: 3.75,  cacheRead: 0.3 } },
  { match: /^claude-haiku-3/i,  price: { input: 0.8, output: 4, cacheWrite: 1.0,   cacheRead: 0.08 } },
  // Generic Claude fallback
  { match: /^claude-/i,         price: { input: 3,  output: 15, cacheWrite: 3.75,  cacheRead: 0.3 } },

  // ---------- OpenAI ----------
  { match: /^gpt-5/i,           price: { input: 1.25, output: 10, cacheRead: 0.125 } },
  { match: /^gpt-4o/i,          price: { input: 2.5,  output: 10, cacheRead: 1.25 } },
  { match: /^gpt-4(?!o)/i,      price: { input: 30,   output: 60 } },
  { match: /^o3/i,              price: { input: 2,    output: 8,  cacheRead: 0.5 } },
  { match: /^o1/i,              price: { input: 15,   output: 60, cacheRead: 7.5 } },
  { match: /^codex-/i,          price: { input: 1.25, output: 10, cacheRead: 0.125 } },

  // ---------- Google Gemini ----------
  { match: /^gemini-(2\.5|2-5)/i, price: { input: 1.25, output: 10, cacheRead: 0.31 } },
  { match: /^gemini-(2\.0|2-0|1\.5)/i, price: { input: 0.075, output: 0.3, cacheRead: 0.01875 } },
  { match: /^gemini-/i,           price: { input: 0.075, output: 0.3, cacheRead: 0.01875 } },

  // ---------- DeepSeek ----------
  { match: /^deepseek-(reasoner|r1)/i, price: { input: 0.55, output: 2.19, cacheRead: 0.14 } },
  { match: /^deepseek-/i,              price: { input: 0.27, output: 1.1,  cacheRead: 0.07 } },

  // ---------- Moonshot / Kimi ----------
  { match: /^(kimi|k2|moonshot)/i, price: { input: 0.6, output: 2.5 } },

  // ---------- Zhipu (GLM) ----------
  { match: /^(glm|chatglm)/i, price: { input: 0.5, output: 1.5 } },
];

function lookupPrice(model: string): PriceEntry {
  // Strip OpenClaw / router-style brackets: "[openclaw] gpt-5.4" → "gpt-5.4"
  const m = model.replace(/^\[[^\]]+\]\s*/, '').trim();
  for (const rule of RULES) {
    if (rule.match.test(m)) return rule.price;
  }
  return DEFAULT_PRICE;
}

/**
 * Estimate API-rate value in USD. Returns 0 if there are no tokens at all.
 * Cache-write defaults to 1.25× input, cache-read to 0.1× input, reasoning
 * to output rate — matching how all current major providers price these SKUs.
 */
export function estimateApiRateValue(tokens: TokenCounts, model: string): number {
  const total =
    tokens.input_tokens +
    tokens.output_tokens +
    (tokens.cache_read_tokens ?? 0) +
    (tokens.cache_write_tokens ?? 0) +
    (tokens.reasoning_tokens ?? 0);
  if (total === 0) return 0;

  const p = lookupPrice(model);
  const cacheWrite = p.cacheWrite ?? p.input * 1.25;
  const cacheRead = p.cacheRead ?? p.input * 0.1;
  const reasoning = p.reasoning ?? p.output;

  const usd =
    (tokens.input_tokens * p.input +
      tokens.output_tokens * p.output +
      (tokens.cache_write_tokens ?? 0) * cacheWrite +
      (tokens.cache_read_tokens ?? 0) * cacheRead +
      (tokens.reasoning_tokens ?? 0) * reasoning) /
    1_000_000;

  return usd;
}
