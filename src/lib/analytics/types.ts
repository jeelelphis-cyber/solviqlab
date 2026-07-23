export interface AnalyticsProvider {
  readonly name: string
  /** Called once after all scripts have loaded. Use for any runtime setup. */
  init(): void
  /** Fire a named event with optional parameters. */
  track(event: string, params?: Record<string, unknown>): void
  /** Notify the provider that a client-side navigation occurred. */
  pageView(url: string): void
}
