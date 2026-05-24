// Local state persistence — track last successful sync timestamp per device
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const STATE_DIR = join(homedir(), '.token-sync');
const STATE_FILE = join(STATE_DIR, 'state.json');

interface State {
  lastSyncedAt: string | null; // ISO 8601
}

export async function readState(): Promise<State> {
  try {
    const data = await readFile(STATE_FILE, 'utf8');
    return JSON.parse(data) as State;
  } catch {
    return { lastSyncedAt: null };
  }
}

export async function writeState(state: State): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}
