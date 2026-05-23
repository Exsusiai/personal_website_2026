import { describe, it, expect } from 'vitest';
import fixture from '../../../tests/fixtures/notion/timeline-list.json';
import { mapTimelineFromNotion, sortTimelineNodes } from './timeline';

describe('mapTimelineFromNotion', () => {
  it('maps a Career node with month', () => {
    const node = mapTimelineFromNotion(fixture.results[0] as never);
    expect(node).toMatchObject({
      id: '00000000-0000-0000-0000-000000000040',
      year: 2024,
      month: 1,
      title: 'Joined Anthropic',
      type: 'Career',
      coverUrl: null,
      order: 1,
    });
  });

  it('maps a Project node with null month and cover', () => {
    const node = mapTimelineFromNotion(fixture.results[1] as never);
    expect(node.year).toBe(2026);
    expect(node.month).toBeNull();
    expect(node.coverUrl).toBe('https://cdn/timeline-cover.jpg');
    expect(node.type).toBe('Project');
  });
});

describe('sortTimelineNodes', () => {
  it('sorts by Year desc, then Month desc (nulls last), then Order asc', () => {
    const nodes = fixture.results.map((r) => mapTimelineFromNotion(r as never));
    const sorted = sortTimelineNodes(nodes);
    // Expect: 2026 (no month), 2024 (month=1), 2022 (month=6)
    expect(sorted[0].year).toBe(2026);
    expect(sorted[1].year).toBe(2024);
    expect(sorted[2].year).toBe(2022);
  });
});
