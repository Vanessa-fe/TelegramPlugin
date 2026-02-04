import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/marketing';
import { getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('gdpr');
  return buildMetadata({ canonical: '/gdpr', title: t('title') });
}

export default async function GDPRPage() {
  const t = await getTranslations('gdpr');

  const processingRows = [
    {
      activity: t('sections.processing.rows.account.activity'),
      data: t('sections.processing.rows.account.data'),
      retention: t('sections.processing.rows.account.retention'),
    },
    {
      activity: t('sections.processing.rows.payment.activity'),
      data: t('sections.processing.rows.payment.data'),
      retention: t('sections.processing.rows.payment.retention'),
    },
    {
      activity: t('sections.processing.rows.access.activity'),
      data: t('sections.processing.rows.access.data'),
      retention: t('sections.processing.rows.access.retention'),
    },
    {
      activity: t('sections.processing.rows.analytics.activity'),
      data: t('sections.processing.rows.analytics.data'),
      retention: t('sections.processing.rows.analytics.retention'),
    },
    {
      activity: t('sections.processing.rows.audit.activity'),
      data: t('sections.processing.rows.audit.data'),
      retention: t('sections.processing.rows.audit.retention'),
    },
  ];

  return (
    <LegalLayout title={t('title')} lastUpdated={t('lastUpdated')}>
      <h2>{t('sections.commitment.title')}</h2>
      <p>{t('sections.commitment.body')}</p>

      <h2>{t('sections.controller.title')}</h2>
      <p>
        <strong>{t('sections.controller.company.label')}</strong>{' '}
        {t('sections.controller.company.value')}
        <br />
        <strong>{t('sections.controller.address.label')}</strong>{' '}
        {t('sections.controller.address.value')}
        <br />
        <strong>{t('sections.controller.email.label')}</strong>{' '}
        <a href="mailto:dpo@telegramplugin.com">
          {t('sections.controller.email.value')}
        </a>
        <br />
        <strong>{t('sections.controller.dpo.label')}</strong>{' '}
        {t('sections.controller.dpo.value')}
      </p>

      <h2>{t('sections.legalBasis.title')}</h2>
      <p>{t('sections.legalBasis.body')}</p>
      <ul>
        <li>
          <strong>{t('sections.legalBasis.items.contract.label')}</strong>{' '}
          {t('sections.legalBasis.items.contract.text')}
        </li>
        <li>
          <strong>{t('sections.legalBasis.items.legitimate.label')}</strong>{' '}
          {t('sections.legalBasis.items.legitimate.text')}
        </li>
        <li>
          <strong>{t('sections.legalBasis.items.legal.label')}</strong>{' '}
          {t('sections.legalBasis.items.legal.text')}
        </li>
        <li>
          <strong>{t('sections.legalBasis.items.consent.label')}</strong>{' '}
          {t('sections.legalBasis.items.consent.text')}
        </li>
      </ul>

      <h2>{t('sections.rights.title')}</h2>
      <p>{t('sections.rights.body')}</p>

      <h3>{t('sections.rights.access.title')}</h3>
      <p>
        {t('sections.rights.access.before')}{' '}
        <strong>{t('sections.rights.access.highlight')}</strong>{' '}
        {t('sections.rights.access.after')}
      </p>

      <h3>{t('sections.rights.rectification.title')}</h3>
      <p>{t('sections.rights.rectification.body')}</p>

      <h3>{t('sections.rights.erasure.title')}</h3>
      <p>
        {t('sections.rights.erasure.before')}{' '}
        <strong>{t('sections.rights.erasure.highlight')}</strong>{' '}
        {t('sections.rights.erasure.after')}
      </p>

      <h3>{t('sections.rights.portability.title')}</h3>
      <p>
        {t('sections.rights.portability.before')}{' '}
        <strong>{t('sections.rights.portability.highlight')}</strong>{' '}
        {t('sections.rights.portability.after')}
      </p>

      <h3>{t('sections.rights.object.title')}</h3>
      <p>{t('sections.rights.object.body')}</p>

      <h3>{t('sections.rights.restriction.title')}</h3>
      <p>{t('sections.rights.restriction.body')}</p>

      <h2>{t('sections.processing.title')}</h2>
      <table className="w-full border-collapse border border-[#E9E3EF] my-6">
        <thead>
          <tr className="bg-[#FDFAFF]">
            <th className="border border-[#E9E3EF] p-3 text-left">
              {t('sections.processing.table.activity')}
            </th>
            <th className="border border-[#E9E3EF] p-3 text-left">
              {t('sections.processing.table.data')}
            </th>
            <th className="border border-[#E9E3EF] p-3 text-left">
              {t('sections.processing.table.retention')}
            </th>
          </tr>
        </thead>
        <tbody>
          {processingRows.map((row) => (
            <tr key={row.activity}>
              <td className="border border-[#E9E3EF] p-3">{row.activity}</td>
              <td className="border border-[#E9E3EF] p-3">{row.data}</td>
              <td className="border border-[#E9E3EF] p-3">{row.retention}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>{t('sections.subProcessors.title')}</h2>
      <p>{t('sections.subProcessors.body')}</p>
      <ul>
        <li>
          <strong>{t('sections.subProcessors.items.stripe.label')}</strong>{' '}
          {t('sections.subProcessors.items.stripe.text')}
        </li>
        <li>
          <strong>{t('sections.subProcessors.items.brevo.label')}</strong>{' '}
          {t('sections.subProcessors.items.brevo.text')}
        </li>
        <li>
          <strong>{t('sections.subProcessors.items.vercel.label')}</strong>{' '}
          {t('sections.subProcessors.items.vercel.text')}
        </li>
        <li>
          <strong>{t('sections.subProcessors.items.postgres.label')}</strong>{' '}
          {t('sections.subProcessors.items.postgres.text')}
        </li>
      </ul>

      <h2>{t('sections.transfers.title')}</h2>
      <p>{t('sections.transfers.body')}</p>

      <h2>{t('sections.security.title')}</h2>
      <p>{t('sections.security.body')}</p>
      <ul>
        <li>{t('sections.security.list.item1')}</li>
        <li>{t('sections.security.list.item2')}</li>
        <li>{t('sections.security.list.item3')}</li>
        <li>{t('sections.security.list.item4')}</li>
        <li>{t('sections.security.list.item5')}</li>
      </ul>

      <h2>{t('sections.breach.title')}</h2>
      <p>{t('sections.breach.body')}</p>

      <h2>{t('sections.contact.title')}</h2>
      <p>{t('sections.contact.body')}</p>
      <p>
        <strong>{t('sections.contact.email.label')}</strong>{' '}
        <a href="mailto:dpo@telegramplugin.com">
          {t('sections.contact.email.value')}
        </a>
        <br />
        <strong>{t('sections.contact.response.label')}</strong>{' '}
        {t('sections.contact.response.value')}
      </p>

      <h2>{t('sections.authority.title')}</h2>
      <p>{t('sections.authority.body')}</p>

      <div className="mt-8 p-6 bg-purple-50 rounded-xl">
        <h3 className="text-purple-600 mt-0">{t('sections.quickActions.title')}</h3>
        <p className="mb-4">{t('sections.quickActions.body')}</p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors no-underline"
          >
            {t('sections.quickActions.actions.export')}
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors no-underline"
          >
            {t('sections.quickActions.actions.delete')}
          </Link>
        </div>
      </div>
    </LegalLayout>
  );
}
