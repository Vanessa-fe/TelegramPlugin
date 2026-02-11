import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing';
import { getLocale, getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('gdpr');
  const locale = await getLocale();
  return buildMetadata({
    canonical: '/gdpr',
    title: t('title'),
    description: t('meta.description'),
    locale,
  });
}

export default async function GDPRPage() {
  const t = await getTranslations('gdpr');

  const processingRows = [
    {
      activity: t('sections.processing.rows.account.activity'),
      data: t('sections.processing.rows.account.data'),
      retention: t('sections.processing.rows.account.retention'),
      basis: t('sections.processing.rows.account.basis'),
    },
    {
      activity: t('sections.processing.rows.payment.activity'),
      data: t('sections.processing.rows.payment.data'),
      retention: t('sections.processing.rows.payment.retention'),
      basis: t('sections.processing.rows.payment.basis'),
    },
    {
      activity: t('sections.processing.rows.access.activity'),
      data: t('sections.processing.rows.access.data'),
      retention: t('sections.processing.rows.access.retention'),
      basis: t('sections.processing.rows.access.basis'),
    },
    {
      activity: t('sections.processing.rows.logs.activity'),
      data: t('sections.processing.rows.logs.data'),
      retention: t('sections.processing.rows.logs.retention'),
      basis: t('sections.processing.rows.logs.basis'),
    },
    {
      activity: t('sections.processing.rows.support.activity'),
      data: t('sections.processing.rows.support.data'),
      retention: t('sections.processing.rows.support.retention'),
      basis: t('sections.processing.rows.support.basis'),
    },
  ];

  const subProcessors = [
    {
      name: t('sections.subProcessors.items.stripe.name'),
      purpose: t('sections.subProcessors.items.stripe.purpose'),
      location: t('sections.subProcessors.items.stripe.location'),
      safeguards: t('sections.subProcessors.items.stripe.safeguards'),
      dpa: t('sections.subProcessors.items.stripe.dpa'),
    },
    {
      name: t('sections.subProcessors.items.brevo.name'),
      purpose: t('sections.subProcessors.items.brevo.purpose'),
      location: t('sections.subProcessors.items.brevo.location'),
      safeguards: t('sections.subProcessors.items.brevo.safeguards'),
      dpa: t('sections.subProcessors.items.brevo.dpa'),
    },
    {
      name: t('sections.subProcessors.items.vercel.name'),
      purpose: t('sections.subProcessors.items.vercel.purpose'),
      location: t('sections.subProcessors.items.vercel.location'),
      safeguards: t('sections.subProcessors.items.vercel.safeguards'),
      dpa: t('sections.subProcessors.items.vercel.dpa'),
    },
    {
      name: t('sections.subProcessors.items.flyio.name'),
      purpose: t('sections.subProcessors.items.flyio.purpose'),
      location: t('sections.subProcessors.items.flyio.location'),
      safeguards: t('sections.subProcessors.items.flyio.safeguards'),
      dpa: t('sections.subProcessors.items.flyio.dpa'),
    },
    {
      name: t('sections.subProcessors.items.neon.name'),
      purpose: t('sections.subProcessors.items.neon.purpose'),
      location: t('sections.subProcessors.items.neon.location'),
      safeguards: t('sections.subProcessors.items.neon.safeguards'),
      dpa: t('sections.subProcessors.items.neon.dpa'),
    },
    {
      name: t('sections.subProcessors.items.telegram.name'),
      purpose: t('sections.subProcessors.items.telegram.purpose'),
      location: t('sections.subProcessors.items.telegram.location'),
      safeguards: t('sections.subProcessors.items.telegram.safeguards'),
      dpa: t('sections.subProcessors.items.telegram.dpa'),
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
        <a href={`mailto:${t('sections.controller.email.value')}`}>
          {t('sections.controller.email.value')}
        </a>
        <br />
        <strong>{t('sections.controller.dpo.label')}</strong>{' '}
        {t('sections.controller.dpo.value')}
      </p>

      <h2>{t('sections.dataCollected.title')}</h2>
      <p>{t('sections.dataCollected.body')}</p>
      <ul>
        <li>
          <strong>{t('sections.dataCollected.categories.account.title')} :</strong>{' '}
          {t('sections.dataCollected.categories.account.items')}
        </li>
        <li>
          <strong>{t('sections.dataCollected.categories.organization.title')} :</strong>{' '}
          {t('sections.dataCollected.categories.organization.items')}
        </li>
        <li>
          <strong>{t('sections.dataCollected.categories.customer.title')} :</strong>{' '}
          {t('sections.dataCollected.categories.customer.items')}
        </li>
        <li>
          <strong>{t('sections.dataCollected.categories.payment.title')} :</strong>{' '}
          {t('sections.dataCollected.categories.payment.items')}
        </li>
        <li>
          <strong>{t('sections.dataCollected.categories.technical.title')} :</strong>{' '}
          {t('sections.dataCollected.categories.technical.items')}
        </li>
      </ul>

      <h2>{t('sections.cookies.title')}</h2>
      <p>{t('sections.cookies.body')}</p>
      <ul>
        <li>
          <strong>{t('sections.cookies.items.session.label')} :</strong>{' '}
          {t('sections.cookies.items.session.text')}
        </li>
        <li>
          <strong>{t('sections.cookies.items.locale.label')} :</strong>{' '}
          {t('sections.cookies.items.locale.text')}
        </li>
      </ul>
      <p className="bg-green-50 p-4 rounded-lg border border-green-200 text-green-800">
        ✓ {t('sections.cookies.noTracking')}
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

      <h2>{t('sections.recipients.title')}</h2>
      <p>{t('sections.recipients.body')}</p>
      <ul>
        <li>
          <strong>{t('sections.recipients.items.internal.label')}</strong>{' '}
          {t('sections.recipients.items.internal.text')}
        </li>
        <li>
          <strong>{t('sections.recipients.items.processors.label')}</strong>{' '}
          {t('sections.recipients.items.processors.text')}
        </li>
        <li>
          <strong>{t('sections.recipients.items.legal.label')}</strong>{' '}
          {t('sections.recipients.items.legal.text')}
        </li>
      </ul>
      <p><strong>{t('sections.recipients.noSale')}</strong></p>

      <h2>{t('sections.rights.title')}</h2>
      <p>{t('sections.rights.body')}</p>

      <h3>{t('sections.rights.access.title')}</h3>
      <p>{t('sections.rights.access.body')}</p>

      <h3>{t('sections.rights.rectification.title')}</h3>
      <p>{t('sections.rights.rectification.body')}</p>

      <h3>{t('sections.rights.erasure.title')}</h3>
      <p>{t('sections.rights.erasure.body')}</p>

      <h3>{t('sections.rights.portability.title')}</h3>
      <p>{t('sections.rights.portability.body')}</p>

      <h3>{t('sections.rights.object.title')}</h3>
      <p>{t('sections.rights.object.body')}</p>

      <h3>{t('sections.rights.restriction.title')}</h3>
      <p>{t('sections.rights.restriction.body')}</p>

      <h2>{t('sections.processing.title')}</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border-custom my-6 text-sm">
          <thead>
            <tr className="bg-surface">
              <th className="border border-border-custom p-3 text-left">
                {t('sections.processing.table.activity')}
              </th>
              <th className="border border-border-custom p-3 text-left">
                {t('sections.processing.table.data')}
              </th>
              <th className="border border-border-custom p-3 text-left">
                {t('sections.processing.table.retention')}
              </th>
              <th className="border border-border-custom p-3 text-left">
                {t('sections.processing.table.basis')}
              </th>
            </tr>
          </thead>
          <tbody>
            {processingRows.map((row) => (
              <tr key={row.activity}>
                <td className="border border-border-custom p-3">{row.activity}</td>
                <td className="border border-border-custom p-3">{row.data}</td>
                <td className="border border-border-custom p-3">{row.retention}</td>
                <td className="border border-border-custom p-3">{row.basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>{t('sections.subProcessors.title')}</h2>
      <p>{t('sections.subProcessors.body')}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border-custom my-6 text-sm">
          <thead>
            <tr className="bg-surface">
              <th className="border border-border-custom p-3 text-left">
                {t('sections.subProcessors.table.name')}
              </th>
              <th className="border border-border-custom p-3 text-left">
                {t('sections.subProcessors.table.purpose')}
              </th>
              <th className="border border-border-custom p-3 text-left">
                {t('sections.subProcessors.table.location')}
              </th>
              <th className="border border-border-custom p-3 text-left">
                {t('sections.subProcessors.table.safeguards')}
              </th>
            </tr>
          </thead>
          <tbody>
            {subProcessors.map((sp) => (
              <tr key={sp.name}>
                <td className="border border-border-custom p-3 font-medium">{sp.name}</td>
                <td className="border border-border-custom p-3">{sp.purpose}</td>
                <td className="border border-border-custom p-3">{sp.location}</td>
                <td className="border border-border-custom p-3">{sp.safeguards}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>{t('sections.transfers.title')}</h2>
      <p>{t('sections.transfers.body')}</p>
      <ul>
        <li>
          <strong>{t('sections.transfers.items.dpf.label')}</strong>{' '}
          {t('sections.transfers.items.dpf.text')}
        </li>
        <li>
          <strong>{t('sections.transfers.items.scc.label')}</strong>{' '}
          {t('sections.transfers.items.scc.text')}
        </li>
        <li>
          <strong>{t('sections.transfers.items.measures.label')}</strong>{' '}
          {t('sections.transfers.items.measures.text')}
        </li>
      </ul>

      <h2>{t('sections.security.title')}</h2>
      <p>{t('sections.security.body')}</p>
      <ul>
        <li>{t('sections.security.list.item1')}</li>
        <li>{t('sections.security.list.item2')}</li>
        <li>{t('sections.security.list.item3')}</li>
        <li>{t('sections.security.list.item4')}</li>
        <li>{t('sections.security.list.item5')}</li>
        <li>{t('sections.security.list.item6')}</li>
      </ul>

      <h2>{t('sections.breach.title')}</h2>
      <p>{t('sections.breach.body')}</p>

      <h2>{t('sections.contact.title')}</h2>
      <p>{t('sections.contact.body')}</p>
      <p>
        <strong>{t('sections.contact.email.label')}</strong>{' '}
        <a href={`mailto:${t('sections.contact.email.value')}`}>
          {t('sections.contact.email.value')}
        </a>
        <br />
        <strong>{t('sections.contact.response.label')}</strong>{' '}
        {t('sections.contact.response.value')}
        <br />
        <strong>{t('sections.contact.free.label')}</strong>{' '}
        {t('sections.contact.free.value')}
      </p>

      <h2>{t('sections.authority.title')}</h2>
      <p>{t('sections.authority.body')}</p>
      <p className="bg-surface p-4 rounded-lg border border-border-custom">
        <strong>{t('sections.authority.cnil.name')}</strong>
        <br />
        {t('sections.authority.cnil.address')}
        <br />
        <a
          href={`https://${t('sections.authority.cnil.website')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:underline"
        >
          {t('sections.authority.cnil.website')}
        </a>
      </p>

      <div className="mt-8 p-6 bg-purple-50 rounded-xl">
        <h3 className="text-purple-600 mt-0">{t('sections.quickActions.title')}</h3>
        <p className="mb-4">{t('sections.quickActions.body')}</p>
        <div className="flex flex-wrap gap-4">
          <a
            href="mailto:contact@sublynk.fr?subject=Demande%20export%20données%20RGPD"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors no-underline"
          >
            {t('sections.quickActions.actions.export')}
          </a>
          <a
            href="mailto:contact@sublynk.fr?subject=Demande%20suppression%20compte%20RGPD"
            className="inline-flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors no-underline"
          >
            {t('sections.quickActions.actions.delete')}
          </a>
        </div>
      </div>
    </LegalLayout>
  );
}
