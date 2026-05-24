import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('env validation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('parses valid env', async () => {
    process.env.NOTION_TOKEN = 'secret_test';
    process.env.NOTION_DS_PROJECTS = 'a'.repeat(32);
    process.env.NOTION_DS_THINKING = 'a'.repeat(32);
    process.env.NOTION_DS_RESUME = 'a'.repeat(32);
    process.env.NOTION_DS_USES = 'a'.repeat(32);
    process.env.NOTION_DS_TIMELINE = 'a'.repeat(32);
    process.env.NOTION_PAGE_ABOUT = 'a'.repeat(32);
    process.env.NOTION_PAGE_NOW = 'a'.repeat(32);
    process.env.NOTION_PAGE_CONTACT = 'a'.repeat(32);
    const { getEnv } = await import('./env');
    const env = getEnv();
    expect(env.NOTION_TOKEN).toBe('secret_test');
    expect(env.NOTION_DS_PROJECTS).toHaveLength(32);
  });

  it('throws on missing token', async () => {
    delete process.env.NOTION_TOKEN;
    const { getEnv } = await import('./env');
    expect(() => getEnv()).toThrow(/NOTION_TOKEN/);
  });
});
