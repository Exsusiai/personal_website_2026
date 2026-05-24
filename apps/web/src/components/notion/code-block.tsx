import { codeToHtml } from 'shiki';

interface Props {
  code: string;
  language: string;
}

export async function CodeBlock({ code, language }: Props) {
  let html: string;
  try {
    html = await codeToHtml(code, {
      lang: language || 'text',
      themes: { light: 'github-light', dark: 'github-dark' },
    });
  } catch {
    // Unknown language — fall back to plain text
    html = await codeToHtml(code, {
      lang: 'text',
      themes: { light: 'github-light', dark: 'github-dark' },
    });
  }

  return (
    <div
      className="font-[family-name:var(--font-mono)] my-4 overflow-x-auto rounded border border-[var(--color-border)] text-sm [&>pre]:p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
