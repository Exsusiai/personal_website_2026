import type { UsageEvent, IngestResponse } from './types.js';
import { getEnv } from './env.js';

export async function postEvents(events: UsageEvent[]): Promise<IngestResponse> {
  if (events.length === 0) return { inserted: 0, skipped_duplicates: 0 };
  const { INGEST_URL, INGEST_SECRET } = getEnv();
  const res = await fetch(INGEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INGEST_SECRET}`,
    },
    body: JSON.stringify({ events }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ingest failed: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<IngestResponse>;
}
