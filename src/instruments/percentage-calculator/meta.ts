import type { InstrumentMeta } from '@aifabrica/instrument-sdk'

export const PERCENTAGE_CALCULATOR_META: InstrumentMeta = {
  slug: 'percentage-calculator',
  id: 'percentage-calculator-v1',
  type: 'calculator',
  category: 'math',
  isYMYL: false,
  supportedLanguages: ['en', 'es', 'pt'],
  version: '1.0.0',
} as const
