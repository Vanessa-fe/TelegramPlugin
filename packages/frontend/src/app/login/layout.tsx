import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.login');
  const locale = await getLocale();
  return buildMetadata({
    canonical: '/login',
    title: t('title'),
    description: t('subtitle'),
    locale,
  });
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
