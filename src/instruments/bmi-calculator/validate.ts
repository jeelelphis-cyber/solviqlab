import { z } from 'zod'
import type { BMIInput } from './types.js'

export const BMIInputSchema = z.object({
  height_cm: z
    .number({ required_error: 'HEIGHT_REQUIRED', invalid_type_error: 'INVALID_NUMBER' })
    .min(50, 'HEIGHT_TOO_LOW')
    .max(250, 'HEIGHT_TOO_HIGH'),

  weight_kg: z
    .number({ required_error: 'WEIGHT_REQUIRED', invalid_type_error: 'INVALID_NUMBER' })
    .min(20, 'WEIGHT_TOO_LOW')
    .max(300, 'WEIGHT_TOO_HIGH'),

  age: z
    .number({ invalid_type_error: 'INVALID_NUMBER' })
    .int('INVALID_NUMBER')
    .min(18, 'AGE_TOO_LOW')
    .max(120, 'AGE_TOO_HIGH')
    .nullable()
    .optional(),

  sex: z.enum(['male', 'female', 'other']).nullable().optional(),

  unitSystem: z.enum(['metric', 'imperial']).default('metric'),
})

const ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  HEIGHT_REQUIRED: 'validation.height.required',
  HEIGHT_TOO_LOW: 'validation.height.too_low',
  HEIGHT_TOO_HIGH: 'validation.height.too_high',
  WEIGHT_REQUIRED: 'validation.weight.required',
  WEIGHT_TOO_LOW: 'validation.weight.too_low',
  WEIGHT_TOO_HIGH: 'validation.weight.too_high',
  AGE_TOO_LOW: 'validation.age.too_low',
  AGE_TOO_HIGH: 'validation.age.too_high',
  INVALID_NUMBER: 'validation.invalid_number',
}

export function getI18nKey(errorCode: string): string {
  return ERROR_CODE_TO_I18N_KEY[errorCode] ?? 'validation.unknown'
}

// Normalize locale-specific decimal separators before parsing
export function sanitizeNumericInput(value: string): number {
  return parseFloat(value.replace(',', '.'))
}
