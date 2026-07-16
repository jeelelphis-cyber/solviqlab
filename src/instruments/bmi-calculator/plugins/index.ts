import { pluginRegistry } from '@aifabrica/instrument-sdk'
import { BMI_META } from '../meta.js'
import { BMIInputSchema, getI18nKey } from '../validate.js'
import { calculateBMI } from '../calculate.js'
import { getInterpretation } from '../interpret.js'
import { getSEOMetadata, getStructuredData } from '../seo.js'

const SLUG = BMI_META.slug

// Formula Plugin
pluginRegistry.register({
  type: 'formula',
  version: '1.0.0',
  instrumentSlug: SLUG,
  compute: calculateBMI,
  verify: (input, expected) => {
    const result = calculateBMI(input)
    return Object.entries(expected).every(
      ([key, val]) => Math.abs((result as Record<string, number>)[key]! - (val as number)) < 0.01
    )
  },
})

// Validation Plugin
pluginRegistry.register({
  type: 'validation',
  version: '1.0.0',
  instrumentSlug: SLUG,
  schema: BMIInputSchema,
  validate: (raw) => {
    const result = BMIInputSchema.safeParse(raw)
    if (result.success) return { success: true, data: result.data }
    return {
      success: false,
      errors: result.error.issues.map((issue) => ({
        code: issue.message,
        field: issue.path.join('.'),
        i18nKey: getI18nKey(issue.message),
      })),
    }
  },
})

// Interpretation Plugin
pluginRegistry.register({
  type: 'interpretation',
  version: '1.0.0',
  instrumentSlug: SLUG,
  getTexts: getInterpretation,
})

// SEO Plugin
pluginRegistry.register({
  type: 'seo',
  version: '1.0.0',
  instrumentSlug: SLUG,
  getMetadata: getSEOMetadata,
  getStructuredData,
})

// Analytics Plugin
pluginRegistry.register({
  type: 'analytics',
  version: '1.0.0',
  instrumentSlug: SLUG,
  getEventSchema: () => ({
    baseEventFields: ['event', 'session_id', 'timestamp', 'instrument_slug'],
    instrumentSpecificFields: ['unit_changed', 'tab_switched'],
  }),
})

// Localization Plugin
pluginRegistry.register({
  type: 'localization',
  version: '1.0.0',
  instrumentSlug: SLUG,
  getTranslations: async (language: string) => {
    const { default: translations } = await import(`../translations/${language}.json`, {
      assert: { type: 'json' },
    }) as { default: Record<string, unknown> }
    return translations
  },
} as Parameters<typeof pluginRegistry.register>[0])
