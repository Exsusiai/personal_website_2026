/**
 * ccusage-sync — ship every device's local LLM CLI usage to /api/usage/ingest.
 *
 * ccusage v20+ schema (verified against real output 2026-05):
 *   {
 *     session: [
 *       {
 *         agent: "claude" | "codex" | "opencode" | ...,
 *         modelsUsed: ["model-a", ...],
 *         modelBreakdowns: [{ modelName, inputTokens, outputTokens, cacheReadTokens,
 *                             cacheCreationTokens, cost }, ...],
 *         metadata: { lastActivity?: "YYYY-MM-DD" | "ISO 8601" },
 *         period: "<uuid>" | "YYYY/MM/DD/rollout-..." | "ses_xxx",
 *         totalCost, totalTokens, inputTokens, outputTokens, ...
 *       }
 *     ],
 *     totals: {...}
 *   }
 *
 * We emit one UsageEvent per (session, model) pair, since a single session may
 * span multiple models (e.g. codex switching gpt-5.4 <-> gpt-5.5 mid-session).
 *
 * Platform is derived from agent first, falling back to model-name prefix for
 * the multi-provider agents (opencode supports many providers).
 */

import { spawn } from 'node:child_process';
import { getEnv } from '../shared/env.js';
import { postEvents } from '../shared/usage-client.js';
import type { UsageEvent } from '../shared/types.js';
import { readState, writeState } from './state.js';

// ---------------------------------------------------------------------------
// ccusage schema
// ---------------------------------------------------------------------------

interface ModelBreakdown {
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  cost: number;
}

interface CcusageSession {
  agent: string;
  modelsUsed: string[];
  modelBreakdowns: ModelBreakdown[];
  metadata?: { lastActivity?: string };
  period: string;
  totalCost: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
}

interface CcusageOutput {
  session: CcusageSession[];
  totals: unknown;
}

// ---------------------------------------------------------------------------
// Platform inference
// ---------------------------------------------------------------------------

const PLATFORM_BY_AGENT: Record<string, string> = {
  claude: 'anthropic',
  codex: 'openai',
  gemini: 'google',
  copilot: 'github',
  // opencode / hermes / openclaw / others → resolved by model name (multi-provider)
};

function platformFromModel(model: string): string {
  // OpenClaw + similar router agents prefix model names like "[openclaw] gpt-5.4".
  // Strip the bracket prefix before pattern-matching so platform inference works.
  const m = model.replace(/^\[[^\]]+\]\s*/, '').toLowerCase();
  if (m.startsWith('claude-')) return 'anthropic';
  if (m.startsWith('gpt-') || m.startsWith('codex-') || m.startsWith('o1') || m.startsWith('o3')) return 'openai';
  if (m.startsWith('gemini-')) return 'google';
  if (m.startsWith('deepseek-')) return 'deepseek';
  if (m.startsWith('glm-') || m.startsWith('chatglm')) return 'zhipu';
  if (m.startsWith('qwen')) return 'local';
  if (m.startsWith('minimax-') || m.startsWith('abab')) return 'minimax';
  if (m.startsWith('kimi') || m.startsWith('k2') || m.includes('moonshot')) return 'moonshot';
  return 'other';
}

function platformFor(agent: string, model: string): string {
  return PLATFORM_BY_AGENT[agent] ?? platformFromModel(model);
}

// ---------------------------------------------------------------------------
// Timestamp normalization
// ---------------------------------------------------------------------------

function tsForSession(s: CcusageSession): string | null {
  const la = s.metadata?.lastActivity;
  if (la) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(la)) {
      // date-only — use noon UTC as midpoint
      return new Date(la + 'T12:00:00Z').toISOString();
    }
    // assume ISO 8601 with time
    const parsed = new Date(la);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  // Period fallback formats observed in ccusage v20+ data:
  //   Codex   : "2025/09/29/rollout-..."
  //   Hermes  : "20260425_164620_f1672c" (YYYYMMDD_HHMMSS_<rand>)
  const codexMatch = s.period?.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (codexMatch) {
    return new Date(`${codexMatch[1]}-${codexMatch[2]}-${codexMatch[3]}T12:00:00Z`).toISOString();
  }
  const hermesMatch = s.period?.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (hermesMatch) {
    const [, y, mo, d, h, mi, se] = hermesMatch;
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}Z`).toISOString();
  }
  return null;
}

// ---------------------------------------------------------------------------
// ccusage CLI runner
// ---------------------------------------------------------------------------

function runCcusage(sinceIsoDate: string | null): Promise<CcusageOutput> {
  return new Promise((resolve, reject) => {
    const { CCUSAGE_PATH } = getEnv();
    const args = ['--json', '--breakdown', 'session'];
    if (sinceIsoDate) args.push('--since', sinceIsoDate.slice(0, 10));
    const proc = spawn(CCUSAGE_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ccusage exited with code ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      try { resolve(JSON.parse(stdout) as CcusageOutput); }
      catch (e) { reject(new Error(`Failed to parse ccusage JSON: ${(e as Error).message}`)); }
    });
    proc.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Map ccusage sessions → UsageEvent rows (one per session × model)
// ---------------------------------------------------------------------------

function toEvents(out: CcusageOutput, device: string): UsageEvent[] {
  const events: UsageEvent[] = [];
  const sessions = out.session ?? [];
  let skipped = 0;

  for (const s of sessions) {
    const ts = tsForSession(s);
    if (!ts) { skipped++; continue; }
    const breakdowns = s.modelBreakdowns ?? [];
    for (const m of breakdowns) {
      events.push({
        ts,
        device,
        platform: platformFor(s.agent, m.modelName),
        model: m.modelName,
        input_tokens: m.inputTokens,
        output_tokens: m.outputTokens,
        cache_read_tokens: m.cacheReadTokens ?? 0,
        cache_write_tokens: m.cacheCreationTokens ?? 0,
        cost_usd: m.cost,
        session_id: `${s.agent}:${s.period}`,
        project_path: null,
        source: 'ccusage',
      });
    }
  }

  if (skipped > 0) {
    console.warn(`[ccusage-sync] skipped ${skipped} sessions without a usable timestamp`);
  }
  return events;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const env = getEnv();
  console.log(`[ccusage-sync] device=${env.DEVICE_NAME} starting`);

  const state = await readState();
  const since = state.lastSyncedAt;
  console.log(`[ccusage-sync] since=${since ?? 'beginning'}`);

  const ccOut = await runCcusage(since);
  const events = toEvents(ccOut, env.DEVICE_NAME);
  console.log(`[ccusage-sync] mapped ${events.length} events from ${ccOut.session?.length ?? 0} sessions`);

  if (events.length > 0) {
    const result = await postEvents(events);
    console.log(`[ccusage-sync] inserted=${result.inserted} skipped_duplicates=${result.skipped_duplicates}`);
  }

  await writeState({ lastSyncedAt: new Date().toISOString() });
  console.log(`[ccusage-sync] done`);
}

main().catch((err: Error) => {
  console.error(`[ccusage-sync] ERROR: ${err.message}`);
  process.exit(1);
});
