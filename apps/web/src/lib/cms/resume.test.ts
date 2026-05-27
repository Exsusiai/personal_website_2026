import { describe, it, expect } from 'vitest';
import fixture from '../../../tests/fixtures/notion/resume-list.json';
import { mapResumeFromNotion, groupResumeItems, matchesFocus, filterBundle } from './resume';
import type { ResumeItem, ResumeBundle, FocusArea } from './types';

function makeItem(overrides: Partial<ResumeItem> = {}): ResumeItem {
  return {
    id: 'x',
    type: 'Experience',
    title: 'X',
    org: '',
    location: null,
    startDate: '2024-01-01',
    endDate: null,
    summary: '',
    tags: [],
    focusAreas: [],
    order: 1,
    category: null,
    level: null,
    projectType: null,
    repoUrl: null,
    demoUrl: null,
    imageUrl: null,
    details: [],
    ...overrides,
  };
}

describe('mapResumeFromNotion', () => {
  it('maps an Experience entry', () => {
    const item = mapResumeFromNotion(fixture.results[0] as never);
    expect(item).toMatchObject({
      id: '00000000-0000-0000-0000-000000000020',
      type: 'Experience',
      title: 'Software Engineer',
      org: 'Anthropic',
      location: 'Remote',
      startDate: '2024-01-01',
      endDate: null,
      tags: ['AI'],
      order: 1,
    });
  });

  it('maps an Education entry with endDate', () => {
    const item = mapResumeFromNotion(fixture.results[1] as never);
    expect(item.type).toBe('Education');
    expect(item.endDate).toBe('2022-06-30');
    expect(item.location).toBeNull();
  });

  it('maps Skill entry', () => {
    const item = mapResumeFromNotion(fixture.results[2] as never);
    expect(item.type).toBe('Skill');
    expect(item.org).toBe('');
  });

  it('maps Award entry', () => {
    const item = mapResumeFromNotion(fixture.results[3] as never);
    expect(item.type).toBe('Award');
    expect(item.org).toBe('TechCrunch Disrupt');
  });
});

describe('groupResumeItems', () => {
  it('groups items by type into bundle', () => {
    const items = fixture.results.map((r) => mapResumeFromNotion(r as never));
    const bundle = groupResumeItems(items);
    expect(bundle.experience).toHaveLength(1);
    expect(bundle.education).toHaveLength(1);
    expect(bundle.skill).toHaveLength(1);
    expect(bundle.award).toHaveLength(1);
    expect(bundle.experience[0].title).toBe('Software Engineer');
  });

  it('routes Project rows into bundle.project', () => {
    const items = [
      makeItem({ id: 'p1', type: 'Project', title: 'OneKo' }),
      makeItem({ id: 'e1', type: 'Experience', title: 'SWE' }),
    ];
    const bundle = groupResumeItems(items);
    expect(bundle.project).toHaveLength(1);
    expect(bundle.project[0].title).toBe('OneKo');
    expect(bundle.experience).toHaveLength(1);
  });
});

describe('matchesFocus', () => {
  it('returns true for every item when focus is null', () => {
    const item = makeItem({ focusAreas: ['Mechanical'] });
    expect(matchesFocus(item, null)).toBe(true);
  });

  it('returns true when item has matching focus', () => {
    const item = makeItem({ focusAreas: ['Software', 'AI'] });
    expect(matchesFocus(item, 'AI')).toBe(true);
  });

  it('returns true when item is tagged Universal regardless of focus', () => {
    const item = makeItem({ focusAreas: ['Universal'] });
    expect(matchesFocus(item, 'Mechanical')).toBe(true);
    expect(matchesFocus(item, 'AI')).toBe(true);
  });

  it('returns false when item has no overlap and no Universal', () => {
    const item = makeItem({ focusAreas: ['Mechanical'] });
    expect(matchesFocus(item, 'AI')).toBe(false);
  });

  it('returns false when item has no focusAreas at all', () => {
    const item = makeItem({ focusAreas: [] });
    expect(matchesFocus(item, 'Software')).toBe(false);
  });
});

describe('filterBundle', () => {
  function makeBundle(): ResumeBundle {
    return {
      experience: [
        makeItem({ id: 'e1', type: 'Experience', focusAreas: ['Software', 'AI'] }),
        makeItem({ id: 'e2', type: 'Experience', focusAreas: ['Mechanical'] }),
      ],
      education: [makeItem({ id: 'edu1', type: 'Education', focusAreas: ['Universal'] })],
      project: [makeItem({ id: 'p1', type: 'Project', focusAreas: ['Software'] })],
      skill: [
        makeItem({ id: 's1', type: 'Skill', focusAreas: ['Software'] }),
        makeItem({ id: 's2', type: 'Skill', focusAreas: ['Mechanical'] }),
      ],
      award: [],
    };
  }

  it('returns bundle as-is when focus is null', () => {
    const b = makeBundle();
    const r = filterBundle(b, null);
    expect(r).toBe(b);
  });

  it('filters by focus, keeping Universal-tagged items in any view', () => {
    const r = filterBundle(makeBundle(), 'Software' as FocusArea);
    expect(r.experience.map((i) => i.id)).toEqual(['e1']);
    expect(r.project.map((i) => i.id)).toEqual(['p1']);
    expect(r.skill.map((i) => i.id)).toEqual(['s1']);
    expect(r.education.map((i) => i.id)).toEqual(['edu1']); // Universal stays
    expect(r.award).toEqual([]);
  });

  it('Mechanical focus shows only mechanical + Universal', () => {
    const r = filterBundle(makeBundle(), 'Mechanical' as FocusArea);
    expect(r.experience.map((i) => i.id)).toEqual(['e2']);
    expect(r.skill.map((i) => i.id)).toEqual(['s2']);
    expect(r.project).toEqual([]); // no mechanical project
    expect(r.education.map((i) => i.id)).toEqual(['edu1']);
  });
});
