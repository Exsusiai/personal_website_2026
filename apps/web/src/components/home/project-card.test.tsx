import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCard, type ProjectCardData } from './project-card';

const sample: ProjectCardData = {
  slug: 'finance-tracker',
  ptype: 'Software · Finance',
  title: 'Finance Tracker',
  summary: '多账户资产追踪系统。',
  tags: ['FastAPI', 'Postgres'],
};

describe('ProjectCard', () => {
  it('renders title, ptype, and summary', () => {
    render(<ProjectCard project={sample} />);
    expect(screen.getByText('Finance Tracker')).toBeInTheDocument();
    expect(screen.getByText('Software · Finance')).toBeInTheDocument();
    expect(screen.getByText('多账户资产追踪系统。')).toBeInTheDocument();
  });

  it('renders all tags', () => {
    render(<ProjectCard project={sample} />);
    expect(screen.getByText('FastAPI')).toBeInTheDocument();
    expect(screen.getByText('Postgres')).toBeInTheDocument();
  });

  it('links to /projects/[slug]', () => {
    render(<ProjectCard project={sample} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/projects/finance-tracker');
  });
});
