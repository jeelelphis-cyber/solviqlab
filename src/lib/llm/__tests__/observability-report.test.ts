import { describe, it, expect } from 'vitest'
import { LLMObservability } from '../observability'
import { ObservabilityReporter } from '../observability-report'
import { CostEstimator } from '../cost-estimator'

function makeObs(metrics: Array<{
  provider?: string; latencyMs?: number; success?: boolean;
  errorCode?: string | null; tokensUsed?: number | null; costUSD?: number | null
}>) {
  const obs = new LLMObservability()
  metrics.forEach((m, i) => obs.record({
    traceId:        `trace-${i}`,
    conversationId: 'c1',
    provider:       m.provider ?? 'mock',
    latencyMs:      m.latencyMs ?? 100,
    tokensUsed:     m.tokensUsed ?? null,
    costUSD:        m.costUSD ?? null,
    success:        m.success ?? true,
    errorCode:      m.errorCode ?? null,
    timestamp:      new Date().toISOString(),
  }))
  return obs
}

describe('ObservabilityReporter', () => {
  it('returns zeroed report when no metrics', () => {
    const reporter = new ObservabilityReporter(new LLMObservability())
    const report   = reporter.generate()
    expect(report.totalRequests).toBe(0)
    expect(report.byProvider).toHaveLength(0)
    expect(report.windowStart).toBeNull()
  })

  it('reports totalRequests correctly', () => {
    const obs      = makeObs([{}, {}, {}])
    const reporter = new ObservabilityReporter(obs)
    expect(reporter.generate().totalRequests).toBe(3)
  })

  it('calculates successRate', () => {
    const obs      = makeObs([{ success: true }, { success: true }, { success: false, errorCode: 'timeout' }])
    const reporter = new ObservabilityReporter(obs)
    expect(reporter.generate().successRate).toBeCloseTo(2 / 3)
  })

  it('groups byProvider', () => {
    const obs = makeObs([
      { provider: 'anthropic' },
      { provider: 'anthropic' },
      { provider: 'openai' },
    ])
    const report = new ObservabilityReporter(obs).generate()
    expect(report.byProvider).toHaveLength(2)
    const anthropic = report.byProvider.find(p => p.name === 'anthropic')!
    expect(anthropic.requests).toBe(2)
  })

  it('byProvider sorted by request count desc', () => {
    const obs = makeObs([
      { provider: 'openai' },
      { provider: 'anthropic' }, { provider: 'anthropic' }, { provider: 'anthropic' },
    ])
    const report = new ObservabilityReporter(obs).generate()
    expect(report.byProvider[0]!.name).toBe('anthropic')
    expect(report.byProvider[1]!.name).toBe('openai')
  })

  it('builds errorBreakdown', () => {
    const obs = makeObs([
      { success: false, errorCode: 'rate_limited' },
      { success: false, errorCode: 'rate_limited' },
      { success: false, errorCode: 'timeout' },
    ])
    const report = new ObservabilityReporter(obs).generate()
    expect(report.errorBreakdown['rate_limited']).toBe(2)
    expect(report.errorBreakdown['timeout']).toBe(1)
  })

  it('calculates totalCostUSD from costUSD fields', () => {
    const obs = makeObs([
      { costUSD: 0.001 },
      { costUSD: 0.002 },
      { costUSD: null },
    ])
    const report = new ObservabilityReporter(obs).generate()
    expect(report.totalCostUSD).toBeCloseTo(0.003)
  })

  it('calculates costPerRequest when cost data exists', () => {
    const obs = makeObs([
      { costUSD: 0.006 },
      { costUSD: 0.006 },
    ])
    const report = new ObservabilityReporter(obs).generate()
    expect(report.costPerRequest).toBeCloseTo(0.006 / 2) // avg across all 2 requests
  })

  it('costPerRequest is null when no cost data', () => {
    const obs    = makeObs([{ costUSD: null }, { costUSD: null }])
    const report = new ObservabilityReporter(obs).generate()
    expect(report.costPerRequest).toBeNull()
  })

  it('sets windowStart and windowEnd', () => {
    const obs    = makeObs([{}, {}])
    const report = new ObservabilityReporter(obs).generate()
    expect(report.windowStart).toBeTruthy()
    expect(report.windowEnd).toBeTruthy()
  })

  it('generatedAt is a recent ISO timestamp', () => {
    const obs    = makeObs([{}])
    const report = new ObservabilityReporter(obs).generate()
    const age    = Date.now() - new Date(report.generatedAt).getTime()
    expect(age).toBeLessThan(5000)
  })
})

describe('MetricsCollector.executeComplete() — cost tracking', () => {
  it('records costUSD when CostEstimator is injected', async () => {
    const { MetricsCollector } = await import('../pipeline/metrics-collector')
    const { LLMAnalytics }     = await import('../analytics')
    const obs       = new LLMObservability()
    const collector = new MetricsCollector(new LLMAnalytics(), obs, new CostEstimator())

    await collector.executeComplete('trace-1', 'c1', 'mock-v1', async () => ({
      content: 'ok', model: 'mock-v1', tokens_used: 100, finish_reason: 'stop' as const,
    }))

    const metric = obs.getRecent(1)[0]!
    expect(metric.traceId).toBe('trace-1')
    expect(metric.tokensUsed).toBe(100)
    expect(metric.costUSD).toBe(0)  // mock-v1 = free
  })

  it('records real cost for non-free models', async () => {
    const { MetricsCollector } = await import('../pipeline/metrics-collector')
    const { LLMAnalytics }     = await import('../analytics')
    const obs       = new LLMObservability()
    const collector = new MetricsCollector(new LLMAnalytics(), obs, new CostEstimator())

    await collector.executeComplete('t1', 'c1', 'claude-haiku-4-5-20251001', async () => ({
      content: 'ok', model: 'claude-haiku-4-5-20251001', tokens_used: 1_000_000, finish_reason: 'stop' as const,
    }))

    const metric = obs.getRecent(1)[0]!
    expect(metric.costUSD).toBeCloseTo(1.25)
  })
})

describe('LLMObservability — traceId querying', () => {
  it('getByTraceId() returns only matching metrics', () => {
    const obs = new LLMObservability()
    obs.record({ traceId: 'abc', conversationId: 'c1', provider: 'mock', latencyMs: 10, tokensUsed: null, costUSD: null, success: true, errorCode: null, timestamp: new Date().toISOString() })
    obs.record({ traceId: 'xyz', conversationId: 'c1', provider: 'mock', latencyMs: 10, tokensUsed: null, costUSD: null, success: true, errorCode: null, timestamp: new Date().toISOString() })
    expect(obs.getByTraceId('abc')).toHaveLength(1)
    expect(obs.getByTraceId('xyz')).toHaveLength(1)
    expect(obs.getByTraceId('unknown')).toHaveLength(0)
  })

  it('summary() includes totalCostUSD field', () => {
    const obs = new LLMObservability()
    obs.record({ traceId: 't1', conversationId: 'c1', provider: 'mock', latencyMs: 10, tokensUsed: null, costUSD: 0.005, success: true, errorCode: null, timestamp: new Date().toISOString() })
    expect(obs.summary().totalCostUSD).toBeCloseTo(0.005)
  })
})
