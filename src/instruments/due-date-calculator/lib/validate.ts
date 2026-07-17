import { z } from 'zod'

export const DueDateInputSchema = z.object({
  method: z.enum(['lmp', 'conception', 'ivf3', 'ivf5']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'INVALID_DATE_FORMAT'),
})

export type DueDateInputSchemaType = z.infer<typeof DueDateInputSchema>
