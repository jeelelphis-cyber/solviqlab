// Instrument-specific analytics extensions.
// Platform events (instrument:viewed, instrument:calculated, etc.) are automatic.
// ONLY define events unique to this instrument here.

// TODO: Add instrument-specific event types if needed.
// If this instrument has no unique events, leave this file as-is.
// All standard platform events are inherited automatically.

export const PERCENTAGE_CALCULATOR_ANALYTICS_EXTENSIONS = {
  // example_event: { field1: string, field2: number },
} as const

export type PercentageCalculatorAnalyticsExtensions = typeof PERCENTAGE_CALCULATOR_ANALYTICS_EXTENSIONS
