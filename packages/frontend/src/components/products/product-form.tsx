'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ProductStatus, type CreateProductDto } from '@/types/product';
import type { Organization } from '@/types/organization';

const productSchema = z.object({
  organizationId: z.string().uuid('Organisation requise'),
  name: z.string().min(1, 'Le nom est requis').max(120),
  description: z.string().max(2048).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});

type FormData = z.infer<typeof productSchema>;

const statusLabels: Record<ProductStatus, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  ARCHIVED: 'Archivé',
};

interface ProductFormProps {
  onSubmit: (data: CreateProductDto) => Promise<void>;
  organizations?: Organization[];
  organizationId?: string;
  lockOrganization?: boolean;
}

export function ProductForm({
  onSubmit,
  organizations,
  organizationId,
  lockOrganization = false,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      organizationId: organizationId ?? organizations?.[0]?.id ?? '',
      name: '',
      description: '',
      status: ProductStatus.DRAFT,
    },
  });

  useEffect(() => {
    const nextOrganizationId = organizationId ?? organizations?.[0]?.id;
    if (nextOrganizationId) {
      setValue('organizationId', nextOrganizationId);
    }
  }, [organizationId, organizations, setValue]);

  const showOrganizationSelect = !lockOrganization && organizations?.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un produit</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationId">Organisation</Label>
            {showOrganizationSelect ? (
              <select
                id="organizationId"
                {...register('organizationId')}
                disabled={isSubmitting}
                className={cn(
                  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {organizations?.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.slug})
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="organizationId"
                {...register('organizationId')}
                disabled={isSubmitting}
                readOnly={lockOrganization}
                placeholder="UUID de l'organisation"
              />
            )}
            {errors.organizationId && (
              <p className="text-sm text-destructive">
                {errors.organizationId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" {...register('name')} disabled={isSubmitting} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              disabled={isSubmitting}
              className={cn(
                'flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              placeholder="Décrivez votre produit"
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <select
              id="status"
              {...register('status')}
              disabled={isSubmitting}
              className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {(Object.keys(statusLabels) as ProductStatus[]).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Créer'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
