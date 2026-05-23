import { describe, it, expect } from 'vitest';
import fixture from '../../../tests/fixtures/notion/thinking-list.json';
import { mapArticleFromNotion } from './thinking';

describe('mapArticleFromNotion', () => {
  it('maps first fixture page', () => {
    const article = mapArticleFromNotion(fixture.results[0] as never);
    expect(article).toMatchObject({
      id: '00000000-0000-0000-0000-000000000010',
      slug: 'agent-workflow-from-scratch',
      title: '从 0 到 1 构建 Agent 工作流',
      summary: '记录从零构建 Agent 工作流的完整思路。',
      tags: ['AI', 'Engineering'],
      coverUrl: 'https://cdn/thinking-cover.jpg',
      publishedDate: '2026-05-01',
      readTime: 8,
    });
  });

  it('handles no cover and reads readTime', () => {
    const article = mapArticleFromNotion(fixture.results[1] as never);
    expect(article.coverUrl).toBeNull();
    expect(article.slug).toBe('why-pnpm');
    expect(article.readTime).toBe(5);
  });
});
