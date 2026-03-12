import { z } from 'zod';

export const createVipInvitationSchema = z.object({
  email: z.string().email('Email invalide'),
  platformPlanName: z.enum(['starter', 'growth', 'pro'], {
    errorMap: () => ({ message: 'Plan invalide (starter, growth, pro)' }),
  }),
  trialDays: z.coerce
    .number()
    .int()
    .min(7, 'Minimum 7 jours')
    .max(90, 'Maximum 90 jours'),
  notes: z.string().optional(),
});

export type CreateVipInvitationDto = z.infer<typeof createVipInvitationSchema>;

export const extendVipTrialSchema = z.object({
  additionalDays: z.coerce
    .number()
    .int()
    .min(7, 'Minimum 7 jours')
    .max(30, 'Maximum 30 jours'),
});

export type ExtendVipTrialDto = z.infer<typeof extendVipTrialSchema>;
