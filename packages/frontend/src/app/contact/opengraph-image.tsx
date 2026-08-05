import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Contactez Sublynk';
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
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#7c3aed',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(168, 85, 247, 0.4) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.4) 0%, transparent 50%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '24px',
            }}
          >
            ✉️
          </div>
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: '24px',
              lineHeight: 1.2,
            }}
          >
            Contactez-nous
          </h1>
          <p
            style={{
              fontSize: '36px',
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              maxWidth: '900px',
              marginBottom: '40px',
            }}
          >
            Notre équipe vous répond en moins de 24h
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '16px 32px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'white',
              }}
            >
              sublynk.fr/contact
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
