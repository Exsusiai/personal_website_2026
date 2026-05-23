import { describe, it, expect } from 'vitest';
import {
  parseTitle, parseRichText, parseSelect, parseMultiSelect,
  parseNumber, parseCheckbox, parseUrl, parseDate, parseFiles,
} from './parsers';

describe('parseTitle', () => {
  it('extracts plain text from title array', () => {
    const prop = {
      type: 'title',
      title: [{ plain_text: 'Finance Tracker' }],
    };
    expect(parseTitle(prop as any)).toBe('Finance Tracker');
  });
  it('returns empty string for empty title', () => {
    expect(parseTitle({ type: 'title', title: [] } as any)).toBe('');
  });
});

describe('parseSelect', () => {
  it('extracts name from select', () => {
    expect(parseSelect({ type: 'select', select: { name: 'Software' } } as any)).toBe('Software');
  });
  it('returns null when select is unset', () => {
    expect(parseSelect({ type: 'select', select: null } as any)).toBeNull();
  });
});

describe('parseMultiSelect', () => {
  it('extracts names array', () => {
    const prop = { type: 'multi_select', multi_select: [{ name: 'a' }, { name: 'b' }] };
    expect(parseMultiSelect(prop as any)).toEqual(['a', 'b']);
  });
});

describe('parseNumber', () => {
  it('returns number', () => {
    expect(parseNumber({ type: 'number', number: 42 } as any)).toBe(42);
  });
  it('returns null when unset', () => {
    expect(parseNumber({ type: 'number', number: null } as any)).toBeNull();
  });
});

describe('parseCheckbox', () => {
  it('returns boolean', () => {
    expect(parseCheckbox({ type: 'checkbox', checkbox: true } as any)).toBe(true);
    expect(parseCheckbox({ type: 'checkbox', checkbox: false } as any)).toBe(false);
  });
});

describe('parseUrl', () => {
  it('returns url string', () => {
    expect(parseUrl({ type: 'url', url: 'https://example.com' } as any)).toBe('https://example.com');
  });
  it('returns null on empty', () => {
    expect(parseUrl({ type: 'url', url: null } as any)).toBeNull();
    expect(parseUrl({ type: 'url', url: '' } as any)).toBeNull();
  });
});

describe('parseDate', () => {
  it('extracts start date string', () => {
    expect(parseDate({ type: 'date', date: { start: '2026-05-23' } } as any)).toEqual({ start: '2026-05-23', end: null });
  });
  it('returns null when unset', () => {
    expect(parseDate({ type: 'date', date: null } as any)).toBeNull();
  });
});

describe('parseFiles', () => {
  it('extracts first file URL (external)', () => {
    const prop = {
      type: 'files',
      files: [{ name: 'cover.jpg', type: 'external', external: { url: 'https://cdn/x.jpg' } }],
    };
    expect(parseFiles(prop as any)).toBe('https://cdn/x.jpg');
  });
  it('extracts first file URL (file)', () => {
    const prop = {
      type: 'files',
      files: [{ name: 'cover.jpg', type: 'file', file: { url: 'https://notion/x.jpg' } }],
    };
    expect(parseFiles(prop as any)).toBe('https://notion/x.jpg');
  });
  it('returns null when no files', () => {
    expect(parseFiles({ type: 'files', files: [] } as any)).toBeNull();
  });
});

describe('parseRichText', () => {
  it('joins plain_text spans', () => {
    const prop = {
      type: 'rich_text',
      rich_text: [{ plain_text: 'Hello ' }, { plain_text: 'world' }],
    };
    expect(parseRichText(prop as any)).toBe('Hello world');
  });
});
