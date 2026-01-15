'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  CreateOrganizationDto,
  Organization,
} from '@/types/organization';

const organizationSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  slug: z
    .string()
    .min(1, 'Le slug est requis')
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      'Seuls les lettres minuscules, chiffres et tirets sont autorisés'
    ),
  billingEmail: z.string().email('Email valide requis'),
  saasActive: z.boolean().optional(),
  timezone: z.string().optional(),
});

type FormData = z.infer<typeof organizationSchema>;

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: CreateOrganizationDto) => Promise<void>;
}

export function OrganizationForm({
  organization,
  onSubmit,
}: OrganizationFormProps) {
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
        saasActive: organization.saasActive ?? false,
        timezone: organization.timezone ?? 'UTC',
      }
    : {
        name: '',
        slug: '',
        billingEmail: '',
        saasActive: false,
        timezone: 'UTC',
      },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {organization ? 'Modifier l\'organisation' : 'Créer une organisation'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" {...register('name')} disabled={isSubmitting} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...register('slug')}
              disabled={isSubmitting}
              placeholder="mon-organisation"
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingEmail">Email de facturation</Label>
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

          <div className="flex items-center gap-2">
            <input
              id="saasActive"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              {...register('saasActive')}
              disabled={isSubmitting}
            />
            <Label htmlFor="saasActive">Abonnement SaaS actif</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuseau horaire</Label>
            <Input
              id="timezone"
              {...register('timezone')}
              disabled={isSubmitting}
              placeholder="UTC"
            />
            {errors.timezone && (
              <p className="text-sm text-destructive">
                {errors.timezone.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Enregistrement...'
              : organization
                ? 'Mettre à jour'
                : 'Créer'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
