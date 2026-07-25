import { describe, it, expect, vi } from 'vitest'
import { RetryPolicy } from '../retry-policy'
import { LLMError } from '../error'
import type { LLMProvider } from '../provider'
import type { LLMMessage } from '../types'

const MESSAGES: LLMMessage[] = [{ role: 'user', content: 'hello' }]
const SUCCESS_RESPONSE = { content: 'ok', model: 'test', tokens_used: null, finish_reason: 'stop' as const }

function makeProvider(responses: Array<() => unknown>): LLMProvider {
  let call = 0
  return {
    async complete() {
      const fn = responses[call++]!
      const val = fn()
      if (val instanceof Error) throw val
      return val as any
    },
    async * stream() { yield { delta: '', done: true } },
    async isAvailable() { return true },
    getModelId() { return 'test' },
  }
}

describe('RetryPolicy', () => {
  it('returns response on first success', async () => {
    const policy   = new RetryPolicy({ baseDelayMs: 0 })
    const provider = makeProvider([() => SUCCESS_RESPONSE])
    const result   = await policy.complete(provider, MESSAGES)
    expect(result.content).toBe('ok')
  })

  it('retries on retryable error and succeeds', async () => {
    const policy   = new RetryPolicy({ maxAttempts: 3, baseDelayMs: 0 })
    const provider = makeProvider([
      () => LLMError.rateLimit(),
      () => LLMError.rateLimit(),
      () => SUCCESS_RESPONSE,
    ])
    const result = await policy.complete(provider, MESSAGES)
    expect(result.content).toBe('ok')
  })

  it('does NOT retry non-retryable errors', async () => {
    const calls  = vi.fn()
    const policy = new RetryPolicy({ maxAttempts: 3, baseDelayMs: 0 })
    const provider = makeProvider([
      () => { calls(); return new LLMError('context_exceeded', 'too long', false) },
    ])
    await expect(policy.complete(provider, MESSAGES)).rejects.toThrow('too long')
    expect(calls).toHaveBeenCalledTimes(1)
  })

  it('throws after exhausting all attempts', async () => {
    const policy   = new RetryPolicy({ maxAttempts: 2, baseDelayMs: 0 })
    const provider = makeProvider([
      () => LLMError.rateLimit(),
      () => LLMError.rateLimit(),
    ])
    await expect(policy.complete(provider, MESSAGES)).rejects.toThrow()
  })

  it('retries up to maxAttempts times', async () => {
    const calls  = vi.fn()
    const policy = new RetryPolicy({ maxAttempts: 3, baseDelayMs: 0 })
    const provider = makeProvider([
      () => { calls(); return LLMError.rateLimit() },
      () => { calls(); return LLMError.rateLimit() },
      () => { calls(); return LLMError.rateLimit() },
    ])
    await expect(policy.complete(provider, MESSAGES)).rejects.toThrow()
    expect(calls).toHaveBeenCalledTimes(3)
  })
})
