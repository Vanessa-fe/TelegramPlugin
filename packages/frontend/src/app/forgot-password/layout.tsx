import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/forgot-password' },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
