import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FAFAF7',
          padding: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'system-ui',
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: '#6B6B66',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          CJS · 陈敬升 · Jason Chen
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 80,
              color: '#1A1A1A',
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.05,
              marginBottom: 16,
            }}
          >
            在机械与软件之间
          </div>
          <div style={{ fontSize: 32, color: '#1A1A1A', lineHeight: 1.3 }}>
            Building products at the intersection of hardware, algorithms &amp; humans.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 20,
            color: '#6B6B66',
          }}
        >
          <span style={{ borderTop: '4px solid #C84B31', paddingTop: 16, width: 80 }} />
          <span>chjingsheng.com (TBD)</span>
        </div>
      </div>
    ),
    size,
  );
}
