import { z } from 'zod'

export const SavingsInputSchema = z.object({
  initialDeposit: z.number().min(0, 'DEPOSIT_NEGATIVE').max(10_000_000, 'DEPOSIT_TOO_HIGH'),
  monthlyDeposit: z.number().min(0, 'MONTHLY_NEGATIVE').max(100_000, 'MONTHLY_TOO_HIGH').optional().default(0),
  annualRate: z.number().min(0, 'RATE_NEGATIVE').max(50, 'RATE_TOO_HIGH'),
  years: z.number().int().min(1, 'YEARS_TOO_LOW').max(50, 'YEARS_TOO_HIGH'),
  compoundFrequency: z.enum(['monthly', 'quarterly', 'annually']).optional().default('monthly'),
  goalAmount: z.number().min(0).optional(),
})
