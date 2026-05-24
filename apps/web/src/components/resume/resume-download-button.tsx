'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { ResumePdfDocument } from './resume-pdf-document';
import type { ResumeBundle } from '@/lib/cms/types';

interface Props {
  bundle: ResumeBundle;
  name: string;
  email: string;
  github: string;
}

export function ResumeDownloadButton(props: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    try {
      setBusy(true);
      const doc = <ResumePdfDocument {...props} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${props.name.replace(/\s+/g, '-').toLowerCase()}-resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="font-[family-name:var(--font-mono)] hairline px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-50"
    >
      {busy ? 'GENERATING…' : 'DOWNLOAD PDF →'}
    </button>
  );
}
