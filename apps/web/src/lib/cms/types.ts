// All application-layer entity types — shaped after parsing Notion responses

export interface Project {
  id: string;                   // Notion page id
  slug: string;
  title: string;
  type: 'Software' | 'Mechanical' | 'AI' | 'Other';
  status: 'Active' | 'Archived' | 'Draft';
  year: number;
  summary: string;
  coverUrl: string | null;
  tags: string[];
  stack: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  modelGlbUrl: string | null;
  featured: boolean;
  order: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  coverUrl: string | null;
  publishedDate: string;        // ISO yyyy-mm-dd
  readTime: number;             // minutes
}

export type ResumeType = 'Experience' | 'Education' | 'Skill' | 'Award';

export interface ResumeItem {
  id: string;
  type: ResumeType;
  title: string;
  org: string;
  location: string | null;
  startDate: string;            // ISO
  endDate: string | null;       // null = ongoing
  tags: string[];
  order: number;
}

export interface ResumeBundle {
  experience: ResumeItem[];
  education: ResumeItem[];
  skill: ResumeItem[];
  award: ResumeItem[];
}

export type UsesCategory = 'Hardware' | 'Software' | 'Service';

export interface UsesItem {
  id: string;
  title: string;
  category: UsesCategory;
  subcategory: string | null;
  brand: string | null;
  note: string | null;
  url: string | null;
  yearStarted: number;
}

export interface UsesGrouped {
  hardware: UsesItem[];
  software: UsesItem[];
  service: UsesItem[];
}

export type TimelineType = 'Career' | 'Education' | 'Project' | 'Personal' | 'Milestone';

export interface TimelineNode {
  id: string;
  year: number;
  month: number | null;
  title: string;
  type: TimelineType;
  coverUrl: string | null;
  order: number;
}
