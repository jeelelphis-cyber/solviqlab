import { z } from 'zod'
import type { PercentageCalculatorInput } from './types.js'

export const PercentageCalculatorInputSchema = z.object({
  mode: z.enum(['percent-of', 'is-what-percent', 'percent-change', 'percent-adjust'], {
    required_error: 'MODE_REQUIRED',
    invalid_type_error: 'INVALID_MODE',
  }),
  a: z
    .number({ required_error: 'A_REQUIRED', invalid_type_error: 'INVALID_NUMBER' })
    .finite('INVALID_NUMBER')
    .max(1_000_000_000, 'A_TOO_HIGH'),
  b: z
    .number({ required_error: 'B_REQUIRED', invalid_type_error: 'INVALID_NUMBER' })
    .finite('INVALID_NUMBER')
    .max(1_000_000_000, 'B_TOO_HIGH'),
  direction: z.enum(['increase', 'decrease']).optional(),
})

export const ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  MODE_REQUIRED: 'validation.mode_required',
  INVALID_MODE: 'validation.invalid_mode',
  A_REQUIRED: 'validation.a_required',
  B_REQUIRED: 'validation.b_required',
  A_TOO_HIGH: 'validation.too_high',
  B_TOO_HIGH: 'validation.too_high',
  INVALID_NUMBER: 'validation.invalid_number',
}

export function getI18nKey(errorCode: string): string {
  return ERROR_CODE_TO_I18N_KEY[errorCode] ?? 'validation.unknown'
}

export function sanitizeNumericInput(value: string): number {
  return parseFloat(value.replace(',', '.').replace(/\s/g, ''))
}
