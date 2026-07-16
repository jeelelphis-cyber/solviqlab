import type { UnitSystem } from './types.js'

// BMI-specific analytics extensions.
// Platform events (instrument:viewed, instrument:calculated, etc.) are automatic.

export const BMI_ANALYTICS_EXTENSIONS = {
  unit_changed: { from: '' as UnitSystem, to: '' as UnitSystem },
  tab_switched: { from: '' as 'adult' | 'child', to: '' as 'adult' | 'child' },
} as const

export type BMIAnalyticsExtensions = typeof BMI_ANALYTICS_EXTENSIONS
