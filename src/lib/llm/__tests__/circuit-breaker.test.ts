import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CircuitBreaker } from '../circuit-breaker'

describe('CircuitBreaker', () => {
  it('starts in closed state', () => {
    expect(new CircuitBreaker().getState()).toBe('closed')
  })

  it('allows attempts in closed state', () => {
    expect(new CircuitBreaker().canAttempt()).toBe(true)
  })

  it('stays closed after failures below threshold', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 })
    cb.onFailure()
    cb.onFailure()
    expect(cb.getState()).toBe('closed')
    expect(cb.canAttempt()).toBe(true)
  })

  it('opens after reaching failure threshold', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 })
    cb.onFailure()
    cb.onFailure()
    cb.onFailure()
    expect(cb.getState()).toBe('open')
    expect(cb.canAttempt()).toBe(false)
  })

  it('rejects calls in open state', () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 60_000 })
    cb.onFailure()
    expect(cb.canAttempt()).toBe(false)
  })

  describe('half-open transition', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('transitions to half-open after cooldown', () => {
      const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000 })
      cb.onFailure()
      expect(cb.getState()).toBe('open')
      vi.advanceTimersByTime(1001)
      expect(cb.canAttempt()).toBe(true)
      expect(cb.getState()).toBe('half-open')
    })

    it('closes after successful probe in half-open', () => {
      const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000 })
      cb.onFailure()
      vi.advanceTimersByTime(1001)
      cb.canAttempt()  // transitions to half-open
      cb.onSuccess()
      expect(cb.getState()).toBe('closed')
      expect(cb.canAttempt()).toBe(true)
    })

    it('reopens after failed probe in half-open', () => {
      const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000 })
      cb.onFailure()
      vi.advanceTimersByTime(1001)
      cb.canAttempt()  // transitions to half-open
      cb.onFailure()
      expect(cb.getState()).toBe('open')
      expect(cb.canAttempt()).toBe(false)
    })
  })

  it('reset() restores closed state', () => {
    const cb = new CircuitBreaker({ failureThreshold: 1 })
    cb.onFailure()
    expect(cb.getState()).toBe('open')
    cb.reset()
    expect(cb.getState()).toBe('closed')
    expect(cb.canAttempt()).toBe(true)
  })

  it('success resets failure counter in closed state', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 })
    cb.onFailure()
    cb.onFailure()
    cb.onSuccess()
    cb.onFailure()  // counter should have reset to 1
    expect(cb.getState()).toBe('closed')
  })
})

describe('RetryExecutor with circuit breaker and fallback', () => {
  it('falls back to secondary provider when primary circuit opens', async () => {
    const { RetryExecutor } = await import('../pipeline/retry-executor')
    const { MockLLMProvider } = await import('../provider')

    let   primaryCalls = 0
    const failingPrimary = {
      async complete() { primaryCalls++; throw new Error('Primary down') },
      async * stream() { yield { delta: '', done: true } },
      async isAvailable() { return false },
      getModelId() { return 'primary' },
    }
    const fallback = new MockLLMProvider()

    const executor = new RetryExecutor(
      failingPrimary,
      [fallback],
      { maxAttempts: 1, baseDelayMs: 0 },
      { failureThreshold: 1 },
    )

    const msgs = [{ role: 'user' as const, content: 'hello' }]
    const result = await executor.complete(msgs)

    expect(result.content).toBeTruthy()
    expect(executor.getPrimaryCircuitState()).toBe('open')
  })

  it('getFallbackCount() returns correct count', async () => {
    const { RetryExecutor } = await import('../pipeline/retry-executor')
    const { MockLLMProvider } = await import('../provider')
    const executor = new RetryExecutor(new MockLLMProvider(), [new MockLLMProvider(), new MockLLMProvider()])
    expect(executor.getFallbackCount()).toBe(2)
  })
})
