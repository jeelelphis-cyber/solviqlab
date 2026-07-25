import type { LLMProvider } from './provider'
import type { LLMMessage, LLMOptions, LLMResponse } from './types'
import { LLMError } from './error'

export interface RetryConfig {
  readonly maxAttempts:   number
  readonly baseDelayMs:   number
  readonly maxDelayMs:    number
  readonly jitterMs:      number
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs:  8000,
  jitterMs:    200,
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function backoff(attempt: number, config: RetryConfig): number {
  const exp     = config.baseDelayMs * Math.pow(2, attempt)
  const capped  = Math.min(exp, config.maxDelayMs)
  const jitter  = Math.random() * config.jitterMs
  return capped + jitter
}

export class RetryPolicy {
  private readonly config: RetryConfig

  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async complete(provider: LLMProvider, messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    let lastError: unknown

    for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
      try {
        return await provider.complete(messages, options)
      } catch (err) {
        lastError = err
        const isRetryable = err instanceof LLMError ? err.retryable : false
        if (!isRetryable || attempt === this.config.maxAttempts - 1) break
        await delay(backoff(attempt, this.config))
      }
    }

    throw lastError
  }
}
