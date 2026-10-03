import { ImageResponse } from 'next/og';
import { APP_NAME, BASE_URL } from '@/lib/seo';

export const alt = `${APP_NAME} — Fashion & Cakes & Bakes Online Shopping in India`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #14532d 100%)',
          color: '#fafafa',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 110,
            fontWeight: 700,
            letterSpacing: -3,
            display: 'flex',
          }}
        >
          Fast<span style={{ color: '#16a34a' }}>Velix</span>
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 400,
            color: '#d4d4d4',
            marginTop: 20,
            display: 'flex',
          }}
        >
          Fashion &amp; Cakes &amp; Bakes — Delivered Fast
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#a3a3a3',
            marginTop: 48,
            display: 'flex',
          }}
        >
          {BASE_URL.replace(/^https?:\/\//, '')}
        </div>
      </div>
    ),
    size
  );
}
