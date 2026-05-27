import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { EmptyState } from '@/components/ui/empty-state';
import { ResumeSection } from '@/components/resume/resume-section';
import { ResumeDownloadButton } from '@/components/resume/resume-download-button';
import { FocusPills } from '@/components/resume/focus-pills';
import { getResume, filterBundle, FOCUS_AREAS } from '@/lib/cms/resume';
import type { FocusArea } from '@/lib/cms/types';
import { site } from '@/lib/site';

export const revalidate = 300;

export const metadata: Metadata = { title: 'Resume' };

const SECTIONS = [
  { key: 'experience', en: 'Experience', zh: '工作经历', variant: 'experience' },
  { key: 'project', en: 'Projects', zh: '项目经历', variant: 'project' },
  { key: 'education', en: 'Education', zh: '教育背景', variant: 'education' },
  { key: 'skill', en: 'Skills', zh: '技能', variant: 'skill' },
  { key: 'award', en: 'Awards', zh: '荣誉奖项', variant: 'award' },
] as const;

interface ResumePageProps {
  searchParams: Promise<{ focus?: string }>;
}

function parseFocus(raw: string | undefined): FocusArea | null {
  if (!raw) return null;
  return (FOCUS_AREAS as readonly string[]).includes(raw) ? (raw as FocusArea) : null;
}

export default async function ResumePage({ searchParams }: ResumePageProps) {
  const sp = await searchParams;
  const focus = parseFocus(sp.focus);

  const fullResume = await getResume();
  const resume = filterBundle(fullResume, focus);

  const allEmpty = SECTIONS.every(
    ({ key }) => resume[key as keyof typeof resume].length === 0,
  );

  return (
    <Container as="section" className="py-18 sm:py-20">
      <SectionHead titleEn="Resume" titleZh="简历" />

      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <FocusPills active={focus} />
        {!allEmpty && (
          <ResumeDownloadButton
            bundle={resume}
            name={`${site.nameZh} ${site.name}`}
            email={site.email}
            github={site.github}
          />
        )}
      </div>

      {allEmpty ? (
        <EmptyState
          titleEn="No content"
          titleZh="此视角下暂无内容"
          hint={
            focus
              ? `当前筛选「${focus}」下没有匹配条目。切回 All 看完整简历。`
              : '在 Notion 的 resume 数据库中创建条目并勾选 Published。'
          }
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
