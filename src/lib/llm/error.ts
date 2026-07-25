export type LLMErrorCode =
  | 'rate_limited'
  | 'context_exceeded'
  | 'safety_blocked'
  | 'provider_unavailable'
  | 'timeout'
  | 'unknown'

export class LLMError extends Error {
  constructor(
    public readonly code: LLMErrorCode,
    message: string,
    public readonly retryable: boolean = false,
  ) {
    super(message)
    this.name = 'LLMError'
  }

  static rateLimit(): LLMError {
    return new LLMError('rate_limited', 'Rate limit exceeded. Please try again shortly.', true)
  }

  static contextExceeded(): LLMError {
    return new LLMError('context_exceeded', 'Conversation is too long. Starting fresh.', false)
  }

  static providerUnavailable(provider: string): LLMError {
    return new LLMError('provider_unavailable', `Provider ${provider} is currently unavailable.`, true)
  }

  static timeout(): LLMError {
    return new LLMError('timeout', 'Request timed out. Please try again.', true)
  }
}
