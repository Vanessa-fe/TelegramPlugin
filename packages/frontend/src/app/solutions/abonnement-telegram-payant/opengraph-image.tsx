import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Abonnement Telegram Payant avec Sublynk';
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
            padding: '60px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '20px',
            }}
          >
            💳
          </div>
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: '20px',
              lineHeight: 1.1,
            }}
          >
            Abonnement Telegram Payant
          </h1>
          <p
            style={{
              fontSize: '32px',
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              maxWidth: '1000px',
              marginBottom: '30px',
            }}
          >
            Automatisez vos paiements et gestion d&apos;accès
          </p>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '20px',
                color: 'white',
              }}
            >
              ✓ Paiements auto
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '20px',
                color: 'white',
              }}
            >
              ✓ Gestion accès
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '20px',
                color: 'white',
              }}
            >
              ✓ Analytics
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '14px 28px',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span
              style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'white',
              }}
            >
              sublynk.fr
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
