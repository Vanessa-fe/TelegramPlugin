import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { LegalLayout } from '@/components/marketing';
import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legalNotice');
  const locale = await getLocale();
  return buildMetadata({
    canonical: '/mentions-legales',
    title: t('title'),
    description: t('meta.description'),
    locale,
  });
}

export default async function LegalNoticePage() {
  const t = await getTranslations('legalNotice');

  return (
    <LegalLayout title={t('title')} lastUpdated={t('lastUpdated')}>
      <h2>{t('sections.publisher.title')}</h2>
      <p>
        <strong>{t('sections.publisher.name.label')}</strong>{' '}
        {t('sections.publisher.name.value')}
        <br />
        <strong>{t('sections.publisher.company.label')}</strong>{' '}
        {t('sections.publisher.company.value')}
        <br />
        <strong>{t('sections.publisher.address.label')}</strong>{' '}
        {t('sections.publisher.address.value')}
        <br />
        <strong>{t('sections.publisher.siret.label')}</strong>{' '}
        {t('sections.publisher.siret.value')}
        <br />
        <strong>{t('sections.publisher.email.label')}</strong>{' '}
        <a href={`mailto:${t('sections.publisher.email.value')}`}>
          {t('sections.publisher.email.value')}
        </a>
        <br />
        <strong>{t('sections.publisher.director.label')}</strong>{' '}
        {t('sections.publisher.director.value')}
      </p>

      <h2>{t('sections.hosting.title')}</h2>
      <p>
        <strong>{t('sections.hosting.name.label')}</strong>{' '}
        {t('sections.hosting.name.value')}
        <br />
        <strong>{t('sections.hosting.address.label')}</strong>{' '}
        {t('sections.hosting.address.value')}
        <br />
        <strong>{t('sections.hosting.website.label')}</strong>{' '}
        <a
          href={`https://${t('sections.hosting.website.value')}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('sections.hosting.website.value')}
        </a>
      </p>
    </LegalLayout>
  );
}
