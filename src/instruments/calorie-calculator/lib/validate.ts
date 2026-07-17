import { z } from 'zod'

export const CalorieInputSchema = z.object({
  weight_kg: z
    .number({ required_error: 'WEIGHT_REQUIRED', invalid_type_error: 'INVALID_NUMBER' })
    .min(20, 'WEIGHT_TOO_LOW')
    .max(300, 'WEIGHT_TOO_HIGH'),

  height_cm: z
    .number({ required_error: 'HEIGHT_REQUIRED', invalid_type_error: 'INVALID_NUMBER' })
    .min(100, 'HEIGHT_TOO_LOW')
    .max(250, 'HEIGHT_TOO_HIGH'),

  age: z
    .number({ required_error: 'AGE_REQUIRED', invalid_type_error: 'INVALID_NUMBER' })
    .int('INVALID_NUMBER')
    .min(15, 'AGE_TOO_LOW')
    .max(100, 'AGE_TOO_HIGH'),

  sex: z.enum(['male', 'female'], { required_error: 'SEX_REQUIRED' }),

  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active'], {
    required_error: 'ACTIVITY_REQUIRED',
  }),

  goal: z.enum(['lose', 'maintain', 'gain']).optional().default('maintain'),

  unitSystem: z.enum(['metric', 'imperial']).optional().default('metric'),
})

export function sanitizeNumericInput(value: string): number {
  return parseFloat(value.replace(',', '.'))
}
