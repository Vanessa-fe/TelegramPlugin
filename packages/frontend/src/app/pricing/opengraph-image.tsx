import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Tarifs Sublynk – À partir de 0€/mois';
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
              fontSize: '32px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '16px',
            }}
          >
            Tarifs Sublynk
          </div>
          <h1
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: '24px',
              lineHeight: 1.1,
            }}
          >
            À partir de 0€/mois
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
            3 formules adaptées à vos besoins
          </p>
          <div
            style={{
              display: 'flex',
              gap: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '24px 32px',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '28px', color: 'white', fontWeight: 600 }}>
                Starter
              </div>
              <div style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.8)' }}>
                0€/mois
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                padding: '24px 32px',
                borderRadius: '12px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <div style={{ fontSize: '28px', color: 'white', fontWeight: 600 }}>
                Growth
              </div>
              <div style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.8)' }}>
                29€/mois
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '24px 32px',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '28px', color: 'white', fontWeight: 600 }}>
                Pro
              </div>
              <div style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.8)' }}>
                99€/mois
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
