'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Bounds } from '@react-three/drei';

interface Props {
  /** Public URL to the GLB/GLTF file */
  src: string;
  /** Optional height in CSS units (default 500px) */
  height?: string | number;
}

function Model({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  return <primitive object={scene} />;
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-2)]">
        加载模型中…
      </div>
    </Html>
  );
}

export function Model3DViewer({ src, height = 500 }: Props) {
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className="hairline overflow-hidden bg-[var(--color-surface)]"
      style={{ height: heightStyle }}
    >
      <Canvas camera={{ position: [3, 3, 3], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <directionalLight position={[-10, -10, -5]} intensity={0.4} />
        <Suspense fallback={<LoadingFallback />}>
          <Bounds fit clip observe margin={1.2}>
            <Model src={src} />
          </Bounds>
        </Suspense>
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={0.5}
          maxDistance={100}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
