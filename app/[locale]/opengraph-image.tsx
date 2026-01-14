import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Ben&Co - Real Estate & Construction Company';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '20px',
            }}
          >
            BEN<span style={{ color: '#f59e0b' }}>&</span>CO
          </h1>
          <p
            style={{
              fontSize: '32px',
              color: '#cbd5e1',
              marginBottom: '40px',
            }}
          >
            Real Estate & Construction Company
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '20px 40px',
              background: 'rgba(251, 191, 36, 0.1)',
              borderRadius: '16px',
              border: '2px solid #f59e0b',
            }}
          >
            <p
              style={{
                fontSize: '24px',
                color: '#fbbf24',
                margin: 0,
              }}
            >
              📍 Sarajevo, Bosnia and Herzegovina
            </p>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
