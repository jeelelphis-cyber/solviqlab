import type { InstrumentMeta } from '@aifabrica/instrument-sdk'

export const BMI_META: InstrumentMeta = {
  slug: 'bmi-calculator',
  id: 'bmi-v1',
  type: 'calculator',
  category: 'health',
  vertical: 'health',
  isYMYL: true,
  supportedLanguages: ['en', 'es', 'pt'],
  version: '1.0.0',
} as const
