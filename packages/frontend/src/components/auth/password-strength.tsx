'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordRequirement {
  key: string;
  regex: RegExp;
  met: boolean;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const t = useTranslations('auth.passwordStrength');

  const requirements: PasswordRequirement[] = useMemo(() => [
    { key: 'minLength', regex: /.{10,}/, met: password.length >= 10 },
    { key: 'uppercase', regex: /[A-Z]/, met: /[A-Z]/.test(password) },
    { key: 'lowercase', regex: /[a-z]/, met: /[a-z]/.test(password) },
    { key: 'number', regex: /[0-9]/, met: /[0-9]/.test(password) },
    { key: 'special', regex: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~;']/, met: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~;']/.test(password) },
  ], [password]);

  const metCount = requirements.filter((r) => r.met).length;
  const strength = metCount === 0 ? 'none' : metCount <= 2 ? 'weak' : metCount <= 4 ? 'medium' : 'strong';

  const strengthColors = {
    none: 'bg-gray-200',
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthLabels = {
    none: '',
    weak: t('weak'),
    medium: t('medium'),
    strong: t('strong'),
  };

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i <= metCount ? strengthColors[strength] : 'bg-gray-200',
              )}
            />
          ))}
        </div>
        {strength !== 'none' && (
          <span
            className={cn(
              'text-xs font-medium',
              strength === 'weak' && 'text-red-600',
              strength === 'medium' && 'text-yellow-600',
              strength === 'strong' && 'text-green-600',
            )}
          >
            {strengthLabels[strength]}
          </span>
        )}
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1 text-xs">
        {requirements.map((req) => (
          <li
            key={req.key}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1',
              req.met
                ? 'bg-green-50 text-green-800 font-medium'
                : 'bg-gray-100 text-gray-700',
            )}
          >
            {req.met ? (
              <svg
                className="h-3.5 w-3.5 text-green-700"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="h-3.5 w-3.5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
              </svg>
            )}
            {t(`requirements.${req.key}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
