import Script from 'next/script';

const CMP_ID = process.env.NEXT_PUBLIC_CMP_ID?.trim();

export function ConsentManager() {
  if (!CMP_ID) {
    return null;
  }

  return (
    <Script
      id="cmp-script"
      src={`https://cdn.consentmanager.net/delivery/autoblocking/${CMP_ID}.js`}
      data-cmp-ab="1"
      data-cmp-host="b.delivery.consentmanager.net"
      data-cmp-cdn="cdn.consentmanager.net"
      data-cmp-codesrc="16"
      strategy="beforeInteractive"
    />
  );
}
