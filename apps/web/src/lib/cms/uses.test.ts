import { describe, it, expect } from 'vitest';
import fixture from '../../../tests/fixtures/notion/uses-list.json';
import { mapUsesFromNotion, groupUsesItems } from './uses';

describe('mapUsesFromNotion', () => {
  it('maps Hardware item', () => {
    const item = mapUsesFromNotion(fixture.results[0] as never);
    expect(item).toMatchObject({
      id: '00000000-0000-0000-0000-000000000030',
      title: 'MacBook Pro 16"',
      category: 'Hardware',
      subcategory: 'Computer',
      brand: 'Apple',
      note: 'M3 Max, daily driver.',
      url: 'https://apple.com/macbook-pro',
      yearStarted: 2024,
    });
  });

  it('maps Software item with null brand', () => {
    const item = mapUsesFromNotion(fixture.results[1] as never);
    expect(item.category).toBe('Software');
    expect(item.brand).toBeNull();
  });

  it('maps Service item with null subcategory and url', () => {
    const item = mapUsesFromNotion(fixture.results[2] as never);
    expect(item.category).toBe('Service');
    expect(item.subcategory).toBeNull();
    expect(item.url).toBeNull();
    expect(item.note).toBeNull();
  });
});

describe('groupUsesItems', () => {
  it('groups items by category into UsesGrouped', () => {
    const items = fixture.results.map((r) => mapUsesFromNotion(r as never));
    const grouped = groupUsesItems(items);
    expect(grouped.hardware).toHaveLength(1);
    expect(grouped.software).toHaveLength(1);
    expect(grouped.service).toHaveLength(1);
    expect(grouped.hardware[0].title).toBe('MacBook Pro 16"');
  });
});
