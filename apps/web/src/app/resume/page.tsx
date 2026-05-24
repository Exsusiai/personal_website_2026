import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { ResumeSection } from '@/components/resume/resume-section';
import { getResume } from '@/lib/cms/resume';

export const revalidate = 300;

export const metadata: Metadata = { title: 'Resume' };

const SECTIONS = [
  { key: 'experience', en: 'Experience', zh: '工作经历', variant: 'experience' },
  { key: 'education', en: 'Education', zh: '教育背景', variant: 'education' },
  { key: 'skill', en: 'Skills', zh: '技能', variant: 'skill' },
  { key: 'award', en: 'Awards', zh: '荣誉奖项', variant: 'award' },
] as const;

export default async function ResumePage() {
  const resume = await getResume();

  return (
    <Container as="section" className="py-18 sm:py-20">
      <SectionHead titleEn="Resume" titleZh="简历" />
      <div className="space-y-16">
        {SECTIONS.map(({ key, en, zh, variant }) => {
          const items = resume[key as keyof typeof resume];
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <SectionHead titleEn={en} titleZh={zh} className="mb-4" />
              <ResumeSection items={items} variant={variant} />
            </div>
          );
        })}
      </div>
    </Container>
  );
}
