// ─────────────────────────────────────────────────────────────────────────────
// CircuitBreaker — prevents cascading failures to unavailable providers.
//
// States:
//   closed    → normal; counts failures
//   open      → rejects all calls; waits cooldownMs
//   half-open → allows one probe call; reopens on failure, closes on success
// ─────────────────────────────────────────────────────────────────────────────

export type CircuitState = 'closed' | 'open' | 'half-open'

export interface CircuitConfig {
  readonly failureThreshold: number   // consecutive failures before opening
  readonly cooldownMs:       number   // ms to wait before half-open probe
}

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 3,
  cooldownMs:       30_000,
}

export class CircuitBreaker {
  private state:          CircuitState = 'closed'
  private failureCount:   number       = 0
  private lastFailureAt:  number | null = null
  private readonly config: CircuitConfig

  constructor(config?: Partial<CircuitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  canAttempt(): boolean {
    if (this.state === 'closed') return true

    if (this.state === 'open') {
      const elapsed = Date.now() - (this.lastFailureAt ?? 0)
      if (elapsed >= this.config.cooldownMs) {
        this.state = 'half-open'
        return true
      }
      return false
    }

    // half-open: allow exactly one probe
    return true
  }

  onSuccess(): void {
    this.failureCount  = 0
    this.lastFailureAt = null
    this.state         = 'closed'
  }

  onFailure(): void {
    this.failureCount++
    this.lastFailureAt = Date.now()

    if (this.state === 'half-open' || this.failureCount >= this.config.failureThreshold) {
      this.state = 'open'
    }
  }

  getState(): CircuitState {
    return this.state
  }

  reset(): void {
    this.state        = 'closed'
    this.failureCount = 0
    this.lastFailureAt = null
  }
}
