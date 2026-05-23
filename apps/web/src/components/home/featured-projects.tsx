import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';
import { ProjectCard, type ProjectCardData } from './project-card';

const PLACEHOLDER_PROJECTS: ProjectCardData[] = [
  {
    slug: 'finance-tracker',
    ptype: 'Software · Finance',
    title: 'Finance Tracker',
    summary: '多账户资产追踪系统，覆盖银行卡、加密钱包、交易所、股票等 8 种资产类型。FastAPI + Next.js + Postgres。',
    tags: ['FastAPI', 'Postgres', 'Crypto'],
  },
  {
    slug: 'desktop-arm',
    ptype: 'Mechanical · 3D',
    title: '桌面级机械臂',
    summary: '6 自由度桌面机械臂，SolidWorks 建模 + STM32 控制 + Python 上位机。装配体可直接在网页 3D 查看。',
    tags: ['SolidWorks', 'STM32', 'Three.js'],
  },
  {
    slug: 'ecc-agent-workflow',
    ptype: 'AI · Tools',
    title: 'ECC Agent Workflow',
    summary: '基于 Claude Code 的 Agent Teams 强化工作流：模型路由、并行调研、确定性验证、Taste→Rule 管道。',
    tags: ['Claude Code', 'Workflow'],
  },
];

export function FeaturedProjects() {
  return (
    <section className="hairline-t py-18 sm:py-20">
      <Container>
        <SectionHead
          titleEn="Selected Work"
          titleZh="精选项目"
          more={{ href: '/projects' }}
        />
        <div className="grid grid-cols-1 gap-px border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-3">
          {PLACEHOLDER_PROJECTS.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}
