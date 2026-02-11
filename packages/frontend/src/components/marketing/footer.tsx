'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('marketing.footer');
  const tCommon = useTranslations('common');
  const footerLinks = {
    product: [
      { label: t('links.pricing'), href: '/pricing' },
      { label: t('links.features'), href: '/#features' },
      { label: t('links.faq'), href: '/faq' },
    ],
    company: [
      { label: t('links.about'), href: '/about' },
      { label: t('links.contact'), href: '/contact' },
    ],
    legal: [
      { label: t('links.privacy'), href: '/privacy' },
      { label: t('links.terms'), href: '/terms' },
      { label: t('links.gdpr'), href: '/gdpr' },
      { label: t('links.legalNotice'), href: '/mentions-legales' },
    ],
  };
  const socialLinks = [
    { label: t('social.x'), href: 'https://x.com/Sublynk' },
  ];
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-text-primary text-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold">
              {tCommon('appName')}
            </Link>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              {t('description')}
            </p>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                {t('social.title')}
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors duration-150 text-sm"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
              {t('sections.product')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
              {t('sections.company')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
              {t('sections.legal')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            {t('copyright', { year: currentYear, appName: tCommon('appName') })}
          </p>
          <p className="text-sm text-gray-400">{t('madeIn')}</p>
        </div>
      </div>
    </footer>
  );
}
