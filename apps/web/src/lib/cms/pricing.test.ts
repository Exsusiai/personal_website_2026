import { describe, it, expect } from 'vitest';
import { estimateApiRateValue } from './pricing';

describe('estimateApiRateValue', () => {
  it('returns 0 for zero tokens', () => {
    expect(estimateApiRateValue({ input_tokens: 0, output_tokens: 0 }, 'claude-sonnet-4-6')).toBe(0);
  });

  it('prices Claude Sonnet 4 input + output correctly', () => {
    // 1M input @ $3/M + 1M output @ $15/M = $18
    const v = estimateApiRateValue(
      { input_tokens: 1_000_000, output_tokens: 1_000_000 },
      'claude-sonnet-4-6',
    );
    expect(v).toBeCloseTo(18, 5);
  });

  it('prices Claude Opus higher than Sonnet for same token counts', () => {
    const sonnet = estimateApiRateValue(
      { input_tokens: 1_000_000, output_tokens: 1_000_000 },
      'claude-sonnet-4-6',
    );
    const opus = estimateApiRateValue(
      { input_tokens: 1_000_000, output_tokens: 1_000_000 },
      'claude-opus-4-7',
    );
    expect(opus).toBeGreaterThan(sonnet * 4);
  });

  it('discounts cache_read relative to input', () => {
    // 1M cache_read @ $0.30/M = $0.30
    const v = estimateApiRateValue(
      { input_tokens: 0, output_tokens: 0, cache_read_tokens: 1_000_000 },
      'claude-sonnet-4-6',
    );
    expect(v).toBeCloseTo(0.3, 5);
  });

  it('prices cache_write at a premium over input', () => {
    // 1M cache_write @ $3.75/M = $3.75
    const v = estimateApiRateValue(
      { input_tokens: 0, output_tokens: 0, cache_write_tokens: 1_000_000 },
      'claude-sonnet-4-6',
    );
    expect(v).toBeCloseTo(3.75, 5);
  });

  it('treats reasoning tokens as output rate', () => {
    // 1M reasoning ≈ 1M output @ $15/M = $15
    const reasoning = estimateApiRateValue(
      { input_tokens: 0, output_tokens: 0, reasoning_tokens: 1_000_000 },
      'claude-sonnet-4-6',
    );
    const output = estimateApiRateValue(
      { input_tokens: 0, output_tokens: 1_000_000 },
      'claude-sonnet-4-6',
    );
    expect(reasoning).toBeCloseTo(output, 5);
  });

  it('matches OpenAI gpt-5 family pricing', () => {
    // 1M input @ $1.25 + 1M output @ $10 = $11.25
    const v = estimateApiRateValue(
      { input_tokens: 1_000_000, output_tokens: 1_000_000 },
      'gpt-5',
    );
    expect(v).toBeCloseTo(11.25, 5);
  });

  it('strips OpenClaw bracket prefix before matching', () => {
    const wrapped = estimateApiRateValue(
      { input_tokens: 1_000_000, output_tokens: 0 },
      '[openclaw] claude-sonnet-4-6',
    );
    const plain = estimateApiRateValue(
      { input_tokens: 1_000_000, output_tokens: 0 },
      'claude-sonnet-4-6',
    );
    expect(wrapped).toBe(plain);
  });

  it('falls back to default price for unknown model (and is non-zero)', () => {
    const v = estimateApiRateValue(
      { input_tokens: 1_000_000, output_tokens: 1_000_000 },
      'some-random-unknown-model-xyz',
    );
    // Default = sonnet-tier → 1M*3 + 1M*15 = 18
    expect(v).toBeCloseTo(18, 5);
  });
});
