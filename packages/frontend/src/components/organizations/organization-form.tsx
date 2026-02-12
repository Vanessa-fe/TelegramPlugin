'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateOrganizationDto, Organization } from '@/types/organization';
import { ORG_CURRENCY_OPTIONS } from '@/lib/currencies';

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: CreateOrganizationDto) => Promise<void>;
}

export function OrganizationForm({
  organization,
  onSubmit,
}: OrganizationFormProps) {
  const t = useTranslations('admin.organizationForm');
  const organizationSchema = z.object({
    name: z.string().min(1, t('validation.nameRequired')),
    slug: z
      .string()
      .min(1, t('validation.slugRequired'))
      .max(50)
      .regex(/^[a-z0-9-]+$/, t('validation.slugInvalid')),
    billingEmail: z.string().email(t('validation.billingEmailInvalid')),
    currency: z
      .string()
      .length(3, t('validation.currencyInvalid'))
      .regex(/^[A-Za-z]{3}$/, t('validation.currencyInvalid'))
      .transform((value) => value.toUpperCase()),
    saasActive: z.boolean().optional(),
    timezone: z.string().optional(),
  });

  type FormData = z.infer<typeof organizationSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: organization
      ? {
          name: organization.name,
          slug: organization.slug,
          billingEmail: organization.billingEmail,
          currency: organization.currency,
          saasActive: organization.saasActive ?? false,
          timezone: organization.timezone ?? 'UTC',
        }
      : {
          name: '',
          slug: '',
          billingEmail: '',
          currency: 'EUR',
          saasActive: false,
          timezone: 'UTC',
        },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {organization ? t('title.edit') : t('title.create')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('fields.name')}</Label>
            <Input id="name" {...register('name')} disabled={isSubmitting} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">{t('fields.slug')}</Label>
            <Input
              id="slug"
              {...register('slug')}
              disabled={isSubmitting}
              placeholder={t('placeholders.slug')}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingEmail">{t('fields.billingEmail')}</Label>
            <Input
              id="billingEmail"
              type="email"
              {...register('billingEmail')}
              disabled={isSubmitting}
            />
            {errors.billingEmail && (
              <p className="text-sm text-destructive">
                {errors.billingEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t('fields.currency')}</Label>
            <select
              id="currency"
              {...register('currency')}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ORG_CURRENCY_OPTIONS.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            {errors.currency && (
              <p className="text-sm text-destructive">
                {errors.currency.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="saasActive"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              {...register('saasActive')}
              disabled={isSubmitting}
            />
            <Label htmlFor="saasActive">{t('fields.saasActive')}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">{t('fields.timezone')}</Label>
            <Input
              id="timezone"
              {...register('timezone')}
              disabled={isSubmitting}
              placeholder={t('placeholders.timezone')}
            />
            {errors.timezone && (
              <p className="text-sm text-destructive">
                {errors.timezone.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t('submit.saving')
              : organization
                ? t('submit.update')
                : t('submit.create')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
