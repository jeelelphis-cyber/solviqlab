import type { AnalyticsProvider } from './types'

export class AnalyticsManager {
  private readonly providers: AnalyticsProvider[] = []
  private initialized = false

  register(provider: AnalyticsProvider): this {
    this.providers.push(provider)
    return this
  }

  /** Calls init() on every provider exactly once. Safe to call multiple times. */
  init(): void {
    if (this.initialized) return
    this.initialized = true
    for (const provider of this.providers) {
      provider.init()
    }
  }

  track(event: string, params?: Record<string, unknown>): void {
    for (const provider of this.providers) {
      provider.track(event, params)
    }
  }

  pageView(url: string): void {
    for (const provider of this.providers) {
      provider.pageView(url)
    }
  }
}
