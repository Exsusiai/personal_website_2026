import { describe, it, expect } from 'vitest';
import { estimateReadingTime } from './reading-time';
import type { NotionBlock } from './blocks';

const mkParagraph = (text: string): NotionBlock => ({
  id: 'x',
  type: 'paragraph',
  paragraph: { rich_text: [{ plain_text: text }] },
});

describe('estimateReadingTime', () => {
  it('returns minimum 1 minute for short text', () => {
    expect(estimateReadingTime([mkParagraph('short')])).toBe(1);
  });

  it('scales with text length', () => {
    const long = 'a'.repeat(3000);
    const result = estimateReadingTime([mkParagraph(long)]);
    expect(result).toBeGreaterThanOrEqual(3);
  });

  it('walks children recursively', () => {
    const block: NotionBlock = {
      id: 'p',
      type: 'paragraph',
      paragraph: { rich_text: [{ plain_text: 'hello' }] },
      children: [mkParagraph('world ' + 'a'.repeat(2000))],
    };
    expect(estimateReadingTime([block])).toBeGreaterThanOrEqual(2);
  });
});
