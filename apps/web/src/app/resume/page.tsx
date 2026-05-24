import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { EmptyState } from '@/components/ui/empty-state';
import { ResumeSection } from '@/components/resume/resume-section';
import { ResumeDownloadButton } from '@/components/resume/resume-download-button';
import { getResume } from '@/lib/cms/resume';
import { site } from '@/lib/site';

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

  const allEmpty = SECTIONS.every(
    ({ key }) => resume[key as keyof typeof resume].length === 0,
  );

  return (
    <Container as="section" className="py-18 sm:py-20">
      <SectionHead titleEn="Resume" titleZh="简历" />
      {!allEmpty && (
        <div className="mb-8 flex justify-end">
          <ResumeDownloadButton
            bundle={resume}
            name={`${site.nameZh} ${site.name}`}
            email={site.email}
            github={site.github}
          />
        </div>
      )}
      {allEmpty ? (
        <EmptyState
          titleEn="No content"
          titleZh="暂无简历"
          hint="在 Notion 的 resume 数据库中创建条目并勾选 Published。"
        />
      ) : (
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
      )}
    </Container>
  );
}
