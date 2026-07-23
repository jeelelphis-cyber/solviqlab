import { AnalyticsManager } from './manager'
import { GA4Provider } from './providers/ga4'
import { ClarityProvider } from './providers/clarity'

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''
const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? ''

const manager = new AnalyticsManager()

if (gaId) manager.register(new GA4Provider(gaId))
if (clarityId) manager.register(new ClarityProvider())

/**
 * Central analytics instance. Import this wherever you need to fire events.
 *
 * Example:
 *   import { analytics } from '@/lib/analytics'
 *   analytics.track('calculate_click', { slug: 'bmi-calculator' })
 */
export const analytics = manager

export type { AnalyticsProvider } from './types'
