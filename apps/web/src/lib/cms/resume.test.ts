import { describe, it, expect } from 'vitest';
import fixture from '../../../tests/fixtures/notion/resume-list.json';
import { mapResumeFromNotion, groupResumeItems } from './resume';

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
});
