import { describe, it, expect } from 'vitest'
import { LLMObservability } from '../observability'
import { ProviderResolver } from '../provider-resolver'
import { MockLLMProvider } from '../provider'

function makeMetric(overrides?: Partial<Parameters<LLMObservability['record']>[0]>) {
  return {
    conversationId: 'c1',
    provider:       'mock',
    latencyMs:      200,
    tokensUsed:     null,
    success:        true,
    errorCode:      null,
    timestamp:      new Date().toISOString(),
    ...overrides,
  }
}

describe('LLMObservability', () => {
  it('summary returns zeros for empty buffer', () => {
    const obs = new LLMObservability()
    expect(obs.summary().total).toBe(0)
    expect(obs.summary().successRate).toBe(0)
  })

  it('records metrics and reports correct count', () => {
    const obs = new LLMObservability()
    obs.record(makeMetric())
    obs.record(makeMetric())
    expect(obs.summary().total).toBe(2)
  })

  it('calculates successRate correctly', () => {
    const obs = new LLMObservability()
    obs.record(makeMetric({ success: true }))
    obs.record(makeMetric({ success: true }))
    obs.record(makeMetric({ success: false, errorCode: 'timeout' }))
    expect(obs.summary().successRate).toBeCloseTo(2 / 3)
  })

  it('calculates p50 latency', () => {
    const obs = new LLMObservability()
    obs.record(makeMetric({ latencyMs: 100 }))
    obs.record(makeMetric({ latencyMs: 200 }))
    obs.record(makeMetric({ latencyMs: 300 }))
    expect(obs.summary().p50LatencyMs).toBe(200)
  })

  it('calculates avgTokens when present', () => {
    const obs = new LLMObservability()
    obs.record(makeMetric({ tokensUsed: 100 }))
    obs.record(makeMetric({ tokensUsed: 200 }))
    expect(obs.summary().avgTokens).toBe(150)
  })

  it('avgTokens is null when no token data', () => {
    const obs = new LLMObservability()
    obs.record(makeMetric({ tokensUsed: null }))
    expect(obs.summary().avgTokens).toBeNull()
  })

  it('getRecent returns last N entries', () => {
    const obs = new LLMObservability()
    for (let i = 0; i < 10; i++) obs.record(makeMetric({ latencyMs: i * 10 }))
    const recent = obs.getRecent(3)
    expect(recent).toHaveLength(3)
    expect(recent[2]!.latencyMs).toBe(90)
  })

  it('measure() records success on resolution', async () => {
    const obs    = new LLMObservability()
    const result = await obs.measure('c1', 'mock', async () => 'done')
    expect(result).toBe('done')
    expect(obs.summary().total).toBe(1)
    expect(obs.summary().successRate).toBe(1)
  })

  it('measure() records failure and rethrows', async () => {
    const obs = new LLMObservability()
    await expect(
      obs.measure('c1', 'mock', async () => { throw new Error('oops') })
    ).rejects.toThrow('oops')
    expect(obs.summary().successRate).toBe(0)
  })

  it('provider-resolver selects available entry', async () => {
    const resolver = new ProviderResolver([
      { name: 'primary', provider: new MockLLMProvider() },
    ])
    const p = await resolver.resolve()
    expect(p.getModelId()).toBe('mock-v1')
  })

  it('provider-resolver prefers named entry', async () => {
    const m1 = new MockLLMProvider()
    const m2 = new MockLLMProvider()
    const resolver = new ProviderResolver([
      { name: 'first',  provider: m1 },
      { name: 'second', provider: m2 },
    ])
    const p = await resolver.resolve('second')
    expect(p).toBe(m2)
  })
})
