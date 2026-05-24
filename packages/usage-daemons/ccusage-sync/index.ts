/**
 * CAVEAT: The ccusage CLI JSON output shape below is based on documentation and
 * community examples as of 2026-05. Before scheduling this daemon, run:
 *
 *   ccusage --json --breakdown session
 *
 * and verify that the shape matches what this file expects (CcusageOutput.sessions[]).
 * If the real output differs, update the CcusageSession interface and toEvents() adapter
 * accordingly. Common divergences: field renamed (e.g. `input` → `inputTokens`),
 * nested model breakdown instead of flat modelsUsed array, missing sessionId, etc.
 */

import { spawn } from 'node:child_process';
import { getEnv } from '../shared/env.js';
import { postEvents } from '../shared/usage-client.js';
import type { UsageEvent } from '../shared/types.js';
import { readState, writeState } from './state.js';

/**
 * ccusage --json shape (subset we care about):
 *   { totals: {...}, daily: [{ date: "YYYY-MM-DD", models: [{ model, input, output, cost, ... }], ... }], sessions: [...] }
 *
 * We map ccusage's per-session breakdown to UsageEvent rows. See ccusage docs:
 * https://ccusage.com/
 */

interface CcusageSession {
  sessionId: string;
  modelsUsed: string[];
  date: string;        // YYYY-MM-DD
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
  cost: number;
  projectPath?: string;
}

interface CcusageOutput {
  sessions?: CcusageSession[];
}

function runCcusage(sinceIso: string | null): Promise<CcusageOutput> {
  return new Promise((resolve, reject) => {
    const { CCUSAGE_PATH } = getEnv();
    const args = ['--json', '--breakdown', 'session'];
    if (sinceIso) args.push('--since', sinceIso.slice(0, 10));
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

function toEvents(out: CcusageOutput, device: string): UsageEvent[] {
  const sessions = out.sessions ?? [];
  return sessions.flatMap((s) => {
    // ccusage groups by session, may aggregate multiple models. Emit one event per (session, model).
    return s.modelsUsed.map<UsageEvent>((model) => ({
      ts: new Date(s.date + 'T12:00:00Z').toISOString(),  // date-level granularity; midpoint
      device,
      platform: 'anthropic',                              // ccusage = Claude Code = Anthropic
      model,
      input_tokens: s.input,
      output_tokens: s.output,
      cache_read_tokens: s.cacheRead ?? 0,
      cache_write_tokens: s.cacheWrite ?? 0,
      cost_usd: s.cost,
      session_id: s.sessionId,
      project_path: s.projectPath ?? null,
      source: 'ccusage',
    }));
  });
}

async function main() {
  const env = getEnv();
  console.log(`[ccusage-sync] device=${env.DEVICE_NAME} starting`);

  const state = await readState();
  const since = state.lastSyncedAt;
  console.log(`[ccusage-sync] since=${since ?? 'beginning'}`);

  const ccOut = await runCcusage(since);
  const events = toEvents(ccOut, env.DEVICE_NAME);
  console.log(`[ccusage-sync] mapped ${events.length} events from ${ccOut.sessions?.length ?? 0} sessions`);

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
