// ─────────────────────────────────────────────────────────────────────────────
// ObservabilityReport — snapshot of LLM operational health.
//
// Aggregates metrics from LLMObservability into a structured report ready
// for dashboard rendering, Datadog export, or alerting pipelines.
// ─────────────────────────────────────────────────────────────────────────────

import type { LLMObservability, CallMetric } from './observability'
import type { CostEstimator } from './cost-estimator'

export interface ProviderStats {
  readonly name:        string
  readonly requests:    number
  readonly successRate: number
  readonly avgLatencyMs: number
  readonly totalCostUSD: number
}

export interface ObservabilityReport {
  readonly generatedAt:   string
  readonly windowStart:   string | null
  readonly windowEnd:     string | null
  readonly totalRequests: number
  readonly successRate:   number
  readonly p50LatencyMs:  number
  readonly p95LatencyMs:  number
  readonly avgTokens:     number | null
  readonly totalCostUSD:  number
  readonly costPerRequest: number | null
  readonly byProvider:    readonly ProviderStats[]
  readonly errorBreakdown: Readonly<Record<string, number>>
}

export class ObservabilityReporter {
  constructor(
    private readonly observability:  LLMObservability,
    private readonly costEstimator?: CostEstimator,
  ) {}

  generate(): ObservabilityReport {
    const metrics  = this.observability.getRecent(500) as CallMetric[]
    const total    = metrics.length
    const summary  = this.observability.summary()

    if (total === 0) {
      return {
        generatedAt: new Date().toISOString(),
        windowStart: null, windowEnd: null,
        totalRequests: 0, successRate: 0,
        p50LatencyMs: 0, p95LatencyMs: 0,
        avgTokens: null, totalCostUSD: 0,
        costPerRequest: null,
        byProvider: [], errorBreakdown: {},
      }
    }

    // Per-provider aggregation
    const providerMap = new Map<string, CallMetric[]>()
    for (const m of metrics) {
      const list = providerMap.get(m.provider) ?? []
      list.push(m)
      providerMap.set(m.provider, list)
    }

    const byProvider: ProviderStats[] = []
    for (const [name, calls] of providerMap) {
      const successes = calls.filter(c => c.success).length
      const latencies = calls.map(c => c.latencyMs).sort((a, b) => a - b)
      const costs     = calls.map(c => c.costUSD).filter((c): c is number => c != null)
      byProvider.push({
        name,
        requests:     calls.length,
        successRate:  successes / calls.length,
        avgLatencyMs: latencies.length > 0
          ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length)
          : 0,
        totalCostUSD: costs.reduce((s, c) => s + c, 0),
      })
    }

    // Error breakdown
    const errorBreakdown: Record<string, number> = {}
    for (const m of metrics) {
      if (!m.success && m.errorCode) {
        errorBreakdown[m.errorCode] = (errorBreakdown[m.errorCode] ?? 0) + 1
      }
    }

    const timestamps = metrics.map(m => m.timestamp).sort()

    return {
      generatedAt:    new Date().toISOString(),
      windowStart:    timestamps[0] ?? null,
      windowEnd:      timestamps[timestamps.length - 1] ?? null,
      totalRequests:  total,
      successRate:    summary.successRate,
      p50LatencyMs:   summary.p50LatencyMs,
      p95LatencyMs:   summary.p95LatencyMs,
      avgTokens:      summary.avgTokens,
      totalCostUSD:   summary.totalCostUSD,
      costPerRequest: summary.totalCostUSD > 0 ? summary.totalCostUSD / total : null,
      byProvider:     byProvider.sort((a, b) => b.requests - a.requests),
      errorBreakdown,
    }
  }
}
