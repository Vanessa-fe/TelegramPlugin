import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.forgotPassword');
  const locale = await getLocale();
  return buildMetadata({
    canonical: '/forgot-password',
    title: t('title'),
    description: t('subtitle'),
    locale,
  });
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
