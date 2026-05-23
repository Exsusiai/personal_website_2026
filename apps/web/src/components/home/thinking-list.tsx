import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { SectionHead } from '@/components/ui/section-head';

interface ArticlePreview {
  slug: string;
  title: string;
  summary: string;
  date: string;
}

const PLACEHOLDER_ARTICLES: ArticlePreview[] = [
  {
    slug: 'why-track-token-usage',
    title: '为什么独立开发者应该把"用量本身"当成产品的一部分',
    summary: '谈谈把 Token 计量、API 调用、用户行为做成可观察界面的产品价值。',
    date: '2026-05-20',
  },
  {
    slug: 'cad-to-web',
    title: '从 SolidWorks 装配体到网页：一个完整的 CAD-to-Web 工作流',
    summary: 'STEP → glTF → Three.js 的实测笔记，含装配体颜色保留、移动端性能优化。',
    date: '2026-05-12',
  },
  {
    slug: 'personal-ip-needs-facade',
    title: '个人 IP 不需要"运营"，但需要一个像样的门面',
    summary: '为什么我决定花两周时间重做个人主页：把所有作品、思考、工具都放到一个可访问的地方。',
    date: '2026-05-08',
  },
];

export function ThinkingList() {
  return (
    <section className="hairline-t py-18 sm:py-20">
      <Container>
        <SectionHead
          titleEn="Thinking"
          titleZh="业务思考"
          more={{ href: '/thinking', label: 'ALL POSTS' }}
        />
        <ul className="max-w-[720px]">
          {PLACEHOLDER_ARTICLES.map((a, i) => (
            <li
              key={a.slug}
              className={
                i < PLACEHOLDER_ARTICLES.length - 1
                  ? 'hairline-b py-5'
                  : 'py-5'
              }
            >
              <Link
                href={`/thinking/${a.slug}`}
                className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
              >
                <div className="flex-1">
                  <h3 className="font-[family-name:var(--font-zh-serif)] mb-2 text-lg font-semibold">
                    {a.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-2)]">
                    {a.summary}
                  </p>
                </div>
                <span className="font-[family-name:var(--font-mono)] whitespace-nowrap pt-1 text-xs text-[var(--color-text-2)]">
                  {a.date}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
