// Local state persistence — track last successful sync timestamp per device,
// plus a map of synthetic timestamps for sessions whose timestamps could not be
// recovered from ccusage output (e.g. Hermes "api-mode" sessions whose period
// field is `api-<hex>` with no embedded date and no `metadata.lastActivity`).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const STATE_DIR = join(homedir(), '.token-sync');
const STATE_FILE = join(STATE_DIR, 'state.json');

export interface State {
  lastSyncedAt: string | null; // ISO 8601
  /**
   * session_id → ISO timestamp first synthesized for that session.
   * Used as a stable fallback for sessions ccusage exposes without a usable
   * timestamp. Without persistence the ts would jump to "now" on every daemon
   * run, smearing those tokens across whatever day the daemon last ran.
   */
  firstSeenTs?: Record<string, string>;
}

export async function readState(): Promise<State> {
  try {
    const data = await readFile(STATE_FILE, 'utf8');
    const parsed = JSON.parse(data) as State;
    return {
      lastSyncedAt: parsed.lastSyncedAt ?? null,
      firstSeenTs: parsed.firstSeenTs ?? {},
    };
  } catch {
    return { lastSyncedAt: null, firstSeenTs: {} };
  }
}

export async function writeState(state: State): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}
