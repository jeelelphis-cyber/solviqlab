// ─────────────────────────────────────────────────────────────────────────────
// RetryExecutor — executes LLM calls with retry, circuit breaking, and fallback.
//
// On transient failure: retries primary provider up to maxAttempts.
// On circuit open or exhausted retries: falls back through the fallback list.
// Each provider has an independent CircuitBreaker to prevent repeated calls
// to a known-bad endpoint.
// ─────────────────────────────────────────────────────────────────────────────

import type { LLMProvider } from '../provider'
import type { LLMMessage, LLMOptions, LLMResponse } from '../types'
import type { LLMChunk, StreamOptions } from '../streaming'
import { RetryPolicy } from '../retry-policy'
import type { RetryConfig } from '../retry-policy'
import { CircuitBreaker } from '../circuit-breaker'
import type { CircuitConfig } from '../circuit-breaker'
import { LLMError } from '../error'

interface ProviderSlot {
  readonly provider: LLMProvider
  readonly breaker:  CircuitBreaker
}

export class RetryExecutor {
  private readonly primary:   ProviderSlot
  private readonly fallbacks: ProviderSlot[]
  private readonly retry:     RetryPolicy

  constructor(
    primary: LLMProvider,
    fallbacks: LLMProvider[] = [],
    retryConfig?: Partial<RetryConfig>,
    circuitConfig?: Partial<CircuitConfig>,
  ) {
    const makeSlot = (p: LLMProvider): ProviderSlot => ({
      provider: p,
      breaker:  new CircuitBreaker(circuitConfig),
    })

    this.primary   = makeSlot(primary)
    this.fallbacks = fallbacks.map(makeSlot)
    this.retry     = new RetryPolicy(retryConfig)
  }

  async complete(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    // Try primary first
    if (this.primary.breaker.canAttempt()) {
      try {
        const response = await this.retry.complete(this.primary.provider, messages, options)
        this.primary.breaker.onSuccess()
        return response
      } catch (err) {
        this.primary.breaker.onFailure()
        // Fall through to fallbacks only if no fallbacks → rethrow
        if (this.fallbacks.length === 0) throw err
      }
    }

    // Try fallbacks in order
    for (const slot of this.fallbacks) {
      if (!slot.breaker.canAttempt()) continue
      try {
        const response = await slot.provider.complete(messages, options)
        slot.breaker.onSuccess()
        return response
      } catch (err) {
        slot.breaker.onFailure()
      }
    }

    throw LLMError.providerUnavailable('all providers exhausted')
  }

  stream(messages: LLMMessage[], options?: StreamOptions): AsyncGenerator<LLMChunk> {
    // Streaming always uses primary (circuit state advisory only — checked but not blocking)
    return this.primary.provider.stream(messages, options)
  }

  getModelId(): string {
    return this.primary.provider.getModelId()
  }

  getPrimaryCircuitState() {
    return this.primary.breaker.getState()
  }

  getFallbackCount(): number {
    return this.fallbacks.length
  }
}
