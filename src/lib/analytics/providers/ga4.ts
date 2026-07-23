import type { AnalyticsProvider } from '../types'

type GtagFn = (...args: unknown[]) => void
type WindowWithGtag = Window & { gtag?: GtagFn; dataLayer?: unknown[] }

function gtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return
  const w = window as WindowWithGtag
  if (typeof w.gtag === 'function') w.gtag(...args)
}

export class GA4Provider implements AnalyticsProvider {
  readonly name = 'GA4'
  private readonly measurementId: string

  constructor(measurementId: string) {
    this.measurementId = measurementId
  }

  init(): void {
    // Initialization is handled by the GA4 <Script> tag in AnalyticsScripts.
    // window.gtag is available once that script executes.
  }

  track(event: string, params?: Record<string, unknown>): void {
    gtag('event', event, params ?? {})
  }

  pageView(url: string): void {
    gtag('config', this.measurementId, { page_path: url })
  }
}
