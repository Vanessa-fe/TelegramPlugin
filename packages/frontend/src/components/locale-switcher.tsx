'use client';

import { useState } from 'react';
import { defaultLocale, locales, localeNames, type Locale } from '@/i18n/config';

interface LocaleSwitcherProps {
  currentLocale: Locale;
}

/**
 * Language switcher component
 *
 * Uses a full navigation to keep middleware locale detection and URL in sync
 */
export function LocaleSwitcher({ currentLocale }: LocaleSwitcherProps) {
  const [isPending, setIsPending] = useState(false);

  function stripLocalePrefix(path: string): string {
    let normalized = path || '/';

    while (true) {
      const parts = normalized.split('/');
      const maybeLocale = parts[1] as Locale | undefined;

      if (!maybeLocale || !locales.includes(maybeLocale)) {
        break;
      }

      normalized = `/${parts.slice(2).join('/')}`;
      if (normalized === '/') {
        break;
      }
    }

    return normalized === '/' ? '/' : normalized.replace(/\/+$/, '') || '/';
  }

  function handleChange(newLocale: Locale) {
    if (newLocale === currentLocale || typeof window === 'undefined') {
      return;
    }

    setIsPending(true);
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;

    const basePath = stripLocalePrefix(window.location.pathname);
    const localizedPath =
      newLocale === defaultLocale
        ? basePath
        : basePath === '/'
          ? `/${newLocale}`
          : `/${newLocale}${basePath}`;
    const targetPath = `${localizedPath}${window.location.search}`;

    window.location.assign(targetPath);
  }

  return (
    <select
      value={currentLocale}
      onChange={(e) => handleChange(e.target.value as Locale)}
      disabled={isPending}
      className="rounded-md border px-3 py-1.5 text-sm"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {localeNames[locale]}
        </option>
      ))}
    </select>
  );
}
