'use client';

import dynamic from 'next/dynamic';

// ssr: false must live in a Client Component per Next.js 16 App Router rules.
// This thin wrapper keeps the project detail page (Server Component) clean.
const Model3DViewer = dynamic(
  () => import('@/components/projects/model-3d-viewer').then(m => m.Model3DViewer),
  { ssr: false, loading: () => null }
);

interface Props {
  src: string;
  height?: string | number;
}

export function Model3DViewerLoader({ src, height }: Props) {
  return <Model3DViewer src={src} height={height} />;
}
