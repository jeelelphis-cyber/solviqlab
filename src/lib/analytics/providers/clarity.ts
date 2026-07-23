import type { AnalyticsProvider } from '../types'

type ClarityFn = (cmd: string, ...args: unknown[]) => void
type WindowWithClarity = Window & { clarity?: ClarityFn }

function clarity(cmd: string, ...args: unknown[]): void {
  if (typeof window === 'undefined') return
  const w = window as WindowWithClarity
  if (typeof w.clarity === 'function') w.clarity(cmd, ...args)
}

export class ClarityProvider implements AnalyticsProvider {
  readonly name = 'Clarity'

  init(): void {
    // Initialization is handled by the Clarity <Script> tag in AnalyticsScripts.
    // window.clarity is available once that script executes.
  }

  track(event: string, _params?: Record<string, unknown>): void {
    // Clarity supports custom events via the clarity() API.
    // Parameters are not forwarded — Clarity captures session context automatically.
    clarity('event', event)
  }

  pageView(_url: string): void {
    // Clarity detects page views automatically by observing URL changes.
    // No manual call is needed.
  }
}
