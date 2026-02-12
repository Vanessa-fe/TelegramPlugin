'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { usePathname, getPathname } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { Globe } from 'lucide-react';

export function Navbar() {
  const t = useTranslations('marketing.navbar');
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleLocaleChange(newLocale: Locale) {
    // Persist locale preference so unprefixed routes keep the selected language
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    const nextPath = getPathname({ href: pathname, locale: newLocale });
    // Force hard reload to ensure all server-rendered translations update immediately
    window.location.href = nextPath;
  }

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-md shadow-sm'
          : 'bg-white/80 backdrop-blur-sm'
      } border-b border-border-custom`}
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/android-chrome-192x192.png"
              alt="Sublynk"
              width={32}
              height={32}
              className="rounded-md"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/pricing"
              className="text-text-secondary hover:text-text-primary font-medium transition-colors duration-150"
            >
              {t('links.pricing')}
            </Link>
            <Link
              href="/login"
              className="text-text-secondary hover:text-text-primary font-medium transition-colors duration-150"
            >
              {t('links.login')}
            </Link>

            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Globe className="w-4 h-4" />
              <select
                value={currentLocale}
                onChange={(e) => handleLocaleChange(e.target.value as Locale)}
                className="bg-transparent text-sm font-medium cursor-pointer hover:text-text-primary transition-colors focus:outline-none"
              >
                {locales.map((locale) => (
                  <option key={locale} value={locale}>
                    {localeNames[locale]}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/register"
              className="lift-on-hover bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors duration-150 shadow-sm hover:shadow-md"
            >
              {t('cta.desktop')}
            </Link>
          </div>

          {/* Mobile: CTA + Burger */}
          <div className="flex md:hidden items-center gap-3">
            <Link
              href="/register"
              className="lift-on-hover bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 text-sm rounded-lg transition-colors duration-150"
            >
              {t('cta.mobile')}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              aria-label={t('aria.toggleMenu')}
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="reveal-on-load md:hidden py-4 border-t border-border-custom">
            <div className="flex flex-col gap-4">
              <Link
                href="/pricing"
                className="text-text-secondary hover:text-text-primary font-medium py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('links.pricing')}
              </Link>
              <Link
                href="/login"
                className="text-text-secondary hover:text-text-primary font-medium py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('links.login')}
              </Link>

              {/* Language Switcher Mobile */}
              <div className="flex items-center gap-2 py-2 text-text-secondary">
                <Globe className="w-4 h-4" />
                <select
                  value={currentLocale}
                  onChange={(e) => handleLocaleChange(e.target.value as Locale)}
                  className="bg-transparent text-sm font-medium cursor-pointer hover:text-text-primary transition-colors focus:outline-none"
                >
                  {locales.map((locale) => (
                    <option key={locale} value={locale}>
                      {localeNames[locale]}
                    </option>
                  ))}
                </select>
              </div>

              <Link
                href="/register"
                className="lift-on-hover bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-3 rounded-lg text-center transition-colors duration-150"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('cta.mobileMenu')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
