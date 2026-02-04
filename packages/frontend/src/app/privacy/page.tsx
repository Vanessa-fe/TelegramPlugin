import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  alternates: { canonical: '/privacy' },
};

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');

  return (
    <LegalLayout title={t('title')} lastUpdated={t('lastUpdated')}>
      <h2>{t('sections.introduction.title')}</h2>
      <p>{t('sections.introduction.body1')}</p>
      <p>{t('sections.introduction.body2')}</p>

      <h2>{t('sections.collect.title')}</h2>
      <h3>{t('sections.collect.provided.title')}</h3>
      <ul>
        <li>
          <strong>{t('sections.collect.provided.items.account.label')}</strong>{' '}
          {t('sections.collect.provided.items.account.text')}
        </li>
        <li>
          <strong>{t('sections.collect.provided.items.payment.label')}</strong>{' '}
          {t('sections.collect.provided.items.payment.text')}
        </li>
        <li>
          <strong>{t('sections.collect.provided.items.channel.label')}</strong>{' '}
          {t('sections.collect.provided.items.channel.text')}
        </li>
        <li>
          <strong>{t('sections.collect.provided.items.customer.label')}</strong>{' '}
          {t('sections.collect.provided.items.customer.text')}
        </li>
      </ul>

      <h3>{t('sections.collect.automatic.title')}</h3>
      <ul>
        <li>
          <strong>{t('sections.collect.automatic.items.usage.label')}</strong>{' '}
          {t('sections.collect.automatic.items.usage.text')}
        </li>
        <li>
          <strong>{t('sections.collect.automatic.items.device.label')}</strong>{' '}
          {t('sections.collect.automatic.items.device.text')}
        </li>
        <li>
          <strong>{t('sections.collect.automatic.items.cookies.label')}</strong>{' '}
          {t('sections.collect.automatic.items.cookies.text')}
        </li>
      </ul>

      <h2>{t('sections.use.title')}</h2>
      <p>{t('sections.use.body')}</p>
      <ul>
        <li>{t('sections.use.list.item1')}</li>
        <li>{t('sections.use.list.item2')}</li>
        <li>{t('sections.use.list.item3')}</li>
        <li>{t('sections.use.list.item4')}</li>
        <li>{t('sections.use.list.item5')}</li>
        <li>{t('sections.use.list.item6')}</li>
      </ul>

      <h2>{t('sections.sharing.title')}</h2>
      <p>{t('sections.sharing.body')}</p>
      <ul>
        <li>
          <strong>{t('sections.sharing.items.stripe.label')}</strong>{' '}
          {t('sections.sharing.items.stripe.text')}
        </li>
        <li>
          <strong>{t('sections.sharing.items.brevo.label')}</strong>{' '}
          {t('sections.sharing.items.brevo.text')}
        </li>
        <li>
          <strong>{t('sections.sharing.items.platforms.label')}</strong>{' '}
          {t('sections.sharing.items.platforms.text')}
        </li>
        <li>
          <strong>{t('sections.sharing.items.legal.label')}</strong>{' '}
          {t('sections.sharing.items.legal.text')}
        </li>
      </ul>
      <p>{t('sections.sharing.footer')}</p>

      <h2>{t('sections.retention.title')}</h2>
      <p>{t('sections.retention.body')}</p>

      <h2>{t('sections.rights.title')}</h2>
      <p>{t('sections.rights.body')}</p>
      <ul>
        <li>
          <strong>{t('sections.rights.items.access.label')}</strong>{' '}
          {t('sections.rights.items.access.text')}
        </li>
        <li>
          <strong>{t('sections.rights.items.rectification.label')}</strong>{' '}
          {t('sections.rights.items.rectification.text')}
        </li>
        <li>
          <strong>{t('sections.rights.items.erasure.label')}</strong>{' '}
          {t('sections.rights.items.erasure.text')}
        </li>
        <li>
          <strong>{t('sections.rights.items.portability.label')}</strong>{' '}
          {t('sections.rights.items.portability.text')}
        </li>
        <li>
          <strong>{t('sections.rights.items.objection.label')}</strong>{' '}
          {t('sections.rights.items.objection.text')}
        </li>
        <li>
          <strong>{t('sections.rights.items.restriction.label')}</strong>{' '}
          {t('sections.rights.items.restriction.text')}
        </li>
      </ul>
      <p>
        {t('sections.rights.contact')}{' '}
        <a href="mailto:privacy@telegramplugin.com">
          {t('sections.rights.email')}
        </a>
        .
      </p>

      <h2>{t('sections.security.title')}</h2>
      <p>{t('sections.security.body')}</p>

      <h2>{t('sections.changes.title')}</h2>
      <p>{t('sections.changes.body')}</p>

      <h2>{t('sections.contact.title')}</h2>
      <p>
        {t('sections.contact.body')}{' '}
        <a href="mailto:dpo@telegramplugin.com">
          {t('sections.contact.email')}
        </a>
        .
      </p>
    </LegalLayout>
  );
}
