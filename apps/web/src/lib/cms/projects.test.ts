import { describe, it, expect } from 'vitest';
import fixture from '../../../tests/fixtures/notion/projects-list.json';
import { mapProjectFromNotion } from './projects';

describe('mapProjectFromNotion', () => {
  it('maps the first fixture page', () => {
    const project = mapProjectFromNotion(fixture.results[0] as never);
    expect(project).toMatchObject({
      slug: 'finance-tracker',
      title: 'Finance Tracker',
      type: 'Software',
      status: 'Active',
      year: 2026,
      summary: '多账户资产追踪。',
      coverUrl: 'https://cdn/cover.jpg',
      tags: ['Web'],
      stack: ['FastAPI', 'Postgres'],
      repoUrl: 'https://github.com/jason/ft',
      demoUrl: null,
      modelGlbUrl: null,
      featured: true,
      order: 1,
    });
  });

  it('handles empty cover & null URLs', () => {
    const project = mapProjectFromNotion(fixture.results[1] as never);
    expect(project.coverUrl).toBeNull();
    expect(project.repoUrl).toBeNull();
    expect(project.modelGlbUrl).toBe('https://r2/arm.glb');
  });
});
