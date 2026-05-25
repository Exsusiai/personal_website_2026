import { describe, it, expect } from 'vitest';
import { safeHref, isAllowedImageHost } from './safe-url';

describe('safeHref', () => {
  it('accepts http and https URLs', () => {
    expect(safeHref('http://example.com')).toBe('http://example.com');
    expect(safeHref('https://example.com/path?q=1')).toBe('https://example.com/path?q=1');
  });

  it('accepts mailto and tel schemes', () => {
    expect(safeHref('mailto:hi@example.com')).toBe('mailto:hi@example.com');
    expect(safeHref('tel:+86-138-0000-0000')).toBe('tel:+86-138-0000-0000');
  });

  it('rejects dangerous schemes', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,<script>')).toBeNull();
    expect(safeHref('vbscript:msgbox')).toBeNull();
    expect(safeHref('file:///etc/passwd')).toBeNull();
  });

  it('rejects strings without a scheme', () => {
    // Bare paths can't be made safe — they would inherit the page scheme.
    expect(safeHref('//evil.example')).toBeNull();
    expect(safeHref('example.com')).toBeNull();
  });

  it('rejects empty / null / undefined', () => {
    expect(safeHref('')).toBeNull();
    expect(safeHref(null)).toBeNull();
    expect(safeHref(undefined)).toBeNull();
  });
});

describe('isAllowedImageHost', () => {
  it('accepts hosts on the Next image allowlist', () => {
    expect(isAllowedImageHost('https://www.notion.so/icons/foo.svg')).toBe(true);
    expect(isAllowedImageHost('https://prod-files-secure.s3.us-west-2.amazonaws.com/img.png')).toBe(true);
  });

  it('rejects unlisted hosts', () => {
    expect(isAllowedImageHost('https://unknown.example.com/a.png')).toBe(false);
    expect(isAllowedImageHost('https://imgur.com/x.png')).toBe(false);
  });

  it('rejects malformed inputs', () => {
    expect(isAllowedImageHost('not-a-url')).toBe(false);
    expect(isAllowedImageHost('')).toBe(false);
  });
});
