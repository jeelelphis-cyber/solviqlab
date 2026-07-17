import { z } from 'zod'

export const TipInputSchema = z.object({
  billAmount: z.number().positive('BILL_REQUIRED').max(100_000, 'BILL_TOO_HIGH'),
  tipPercent: z.number().min(0, 'TIP_NEGATIVE').max(100, 'TIP_TOO_HIGH'),
  numPeople: z.number().int('PEOPLE_NOT_INT').min(1, 'PEOPLE_TOO_LOW').max(100, 'PEOPLE_TOO_HIGH').optional().default(1),
  taxPercent: z.number().min(0, 'TAX_NEGATIVE').max(30, 'TAX_TOO_HIGH').optional().default(0),
})

export type TipInputSchemaType = z.infer<typeof TipInputSchema>
