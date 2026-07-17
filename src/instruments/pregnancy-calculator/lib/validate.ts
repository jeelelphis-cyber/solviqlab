import { z } from 'zod'

export const PregnancyInputSchema = z.object({
  method: z.enum(['lmp', 'conception', 'dueDate']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'INVALID_DATE_FORMAT'),
})

export type PregnancyInputSchemaType = z.infer<typeof PregnancyInputSchema>
