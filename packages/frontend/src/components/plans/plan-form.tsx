'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlanInterval, type CreatePlanDto, type Plan } from '@/types/plan';

const planFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  interval: z.nativeEnum(PlanInterval),
  priceCents: z.coerce.number().int().positive('Le prix doit être positif'),
  currency: z.string().length(3, 'Code devise à 3 lettres (ex: EUR)'),
  trialPeriodDays: z.coerce.number().int().nonnegative().optional(),
  accessDurationDays: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

type PlanFormData = z.infer<typeof planFormSchema>;

interface PlanFormProps {
  productId: string;
  plan?: Plan;
  onSubmit: (data: CreatePlanDto) => void | Promise<void>;
}

const intervalOptions = [
  { value: PlanInterval.ONE_TIME, label: 'Paiement unique' },
  { value: PlanInterval.DAY, label: 'Journalier' },
  { value: PlanInterval.WEEK, label: 'Hebdomadaire' },
  { value: PlanInterval.MONTH, label: 'Mensuel' },
  { value: PlanInterval.QUARTER, label: 'Trimestriel' },
  { value: PlanInterval.YEAR, label: 'Annuel' },
];

export function PlanForm({ productId, plan, onSubmit }: PlanFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: plan
      ? {
          name: plan.name,
          description: plan.description || '',
          interval: plan.interval,
          priceCents: plan.priceCents,
          currency: plan.currency,
          trialPeriodDays: plan.trialPeriodDays || undefined,
          accessDurationDays: plan.accessDurationDays || undefined,
          isActive: plan.isActive,
        }
      : {
          currency: 'EUR',
          interval: PlanInterval.MONTH,
          isActive: true,
        },
  });

  const selectedInterval = watch('interval');

  async function onSubmitForm(data: PlanFormData) {
    const payload: CreatePlanDto = {
      productId,
      name: data.name,
      description: data.description || undefined,
      interval: data.interval,
      priceCents: data.priceCents,
      currency: data.currency.toUpperCase(),
      trialPeriodDays: data.trialPeriodDays || undefined,
      accessDurationDays: data.accessDurationDays || undefined,
      isActive: data.isActive ?? true,
    };

    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Informations générales</h2>

        <div>
          <Label htmlFor="name">Nom du plan *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="ex: Mensuel, Annuel, Accès à vie"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            {...register('description')}
            placeholder="Description du plan"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="interval">Type de facturation *</Label>
          <Select
            value={selectedInterval}
            onValueChange={(value) =>
              setValue('interval', value as PlanInterval)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un intervalle" />
            </SelectTrigger>
            <SelectContent>
              {intervalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.interval && (
            <p className="mt-1 text-sm text-red-600">
              {errors.interval.message}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Tarification</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priceCents">Prix (en centimes) *</Label>
            <Input
              id="priceCents"
              type="number"
              {...register('priceCents')}
              placeholder="2900"
            />
            {errors.priceCents && (
              <p className="mt-1 text-sm text-red-600">
                {errors.priceCents.message}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Exemple: 2900 = 29,00€
            </p>
          </div>

          <div>
            <Label htmlFor="currency">Devise *</Label>
            <Input
              id="currency"
              {...register('currency')}
              placeholder="EUR"
              maxLength={3}
            />
            {errors.currency && (
              <p className="mt-1 text-sm text-red-600">
                {errors.currency.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Options avancées</h2>

        <div>
          <Label htmlFor="trialPeriodDays">Période d&apos;essai (jours)</Label>
          <Input
            id="trialPeriodDays"
            type="number"
            {...register('trialPeriodDays')}
            placeholder="7"
          />
          {errors.trialPeriodDays && (
            <p className="mt-1 text-sm text-red-600">
              {errors.trialPeriodDays.message}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Laisser vide si pas d&apos;essai gratuit
          </p>
        </div>

        <div>
          <Label htmlFor="accessDurationDays">
            Durée d&apos;accès (jours)
          </Label>
          <Input
            id="accessDurationDays"
            type="number"
            {...register('accessDurationDays')}
            placeholder="30"
          />
          {errors.accessDurationDays && (
            <p className="mt-1 text-sm text-red-600">
              {errors.accessDurationDays.message}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Laisser vide pour un accès illimité
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            {...register('isActive')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Plan actif et visible pour les clients
          </Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : plan ? 'Mettre à jour' : 'Créer le plan'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
