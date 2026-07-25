import type { RetentionSuggestion } from './types'

export class RetentionScheduler {
  private cancelFn: (() => void) | null = null

  start(
    check: () => RetentionSuggestion | null,
    onSuggestion: (s: RetentionSuggestion) => void,
    intervalMs = 60_000,
  ): void {
    this.stop()
    const handle = setInterval(() => {
      try {
        const suggestion = check()
        if (suggestion) onSuggestion(suggestion)
      } catch { /* non-critical */ }
    }, intervalMs)
    this.cancelFn = () => clearInterval(handle)
  }

  stop(): void {
    this.cancelFn?.()
    this.cancelFn = null
  }

  isRunning(): boolean {
    return this.cancelFn !== null
  }
}

export const retentionScheduler = new RetentionScheduler()
