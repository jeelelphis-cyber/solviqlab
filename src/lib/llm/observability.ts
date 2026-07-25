// ─────────────────────────────────────────────────────────────────────────────
// LLMObservability — structured metrics for latency, cost, and success rate.
//
// Separate from LLMAnalytics (which fires gtag user-behaviour events).
// Observability is for operational monitoring: p50/p95 latency, cost per call,
// error rates. Phase 1: in-memory ring buffer. Phase 3+: ship to Datadog/OTel.
// ─────────────────────────────────────────────────────────────────────────────

export interface CallMetric {
  readonly traceId:        string
  readonly conversationId: string
  readonly provider:       string
  readonly latencyMs:      number
  readonly tokensUsed:     number | null
  readonly costUSD:        number | null
  readonly success:        boolean
  readonly errorCode:      string | null
  readonly timestamp:      string
}

const MAX_BUFFER = 500

export class LLMObservability {
  private readonly buffer: CallMetric[] = []

  record(metric: CallMetric): void {
    this.buffer.push(metric)
    if (this.buffer.length > MAX_BUFFER) this.buffer.shift()
  }

  // Generic convenience wrapper — traceId optional for backward compat.
  async measure<T>(
    conversationId: string,
    provider: string,
    fn: () => Promise<T>,
    traceId = '',
  ): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      this.record({
        traceId,
        conversationId,
        provider,
        latencyMs:  Date.now() - start,
        tokensUsed: null,
        costUSD:    null,
        success:    true,
        errorCode:  null,
        timestamp:  new Date().toISOString(),
      })
      return result
    } catch (err) {
      this.record({
        traceId,
        conversationId,
        provider,
        latencyMs:  Date.now() - start,
        tokensUsed: null,
        costUSD:    null,
        success:    false,
        errorCode:  (err as any)?.code ?? 'unknown',
        timestamp:  new Date().toISOString(),
      })
      throw err
    }
  }

  summary(): {
    total:        number
    successRate:  number
    p50LatencyMs: number
    p95LatencyMs: number
    avgTokens:    number | null
    totalCostUSD: number
  } {
    const total = this.buffer.length
    if (total === 0) {
      return { total: 0, successRate: 0, p50LatencyMs: 0, p95LatencyMs: 0, avgTokens: null, totalCostUSD: 0 }
    }

    const successes   = this.buffer.filter(m => m.success).length
    const latencies   = [...this.buffer.map(m => m.latencyMs)].sort((a, b) => a - b)
    const tokenCounts = this.buffer.map(m => m.tokensUsed).filter((t): t is number => t != null)
    const costs       = this.buffer.map(m => m.costUSD).filter((c): c is number => c != null)

    return {
      total,
      successRate:  successes / total,
      p50LatencyMs: latencies[Math.floor(latencies.length * 0.5)] ?? 0,
      p95LatencyMs: latencies[Math.floor(latencies.length * 0.95)] ?? 0,
      avgTokens:    tokenCounts.length > 0
        ? Math.round(tokenCounts.reduce((s, t) => s + t, 0) / tokenCounts.length)
        : null,
      totalCostUSD: costs.reduce((s, c) => s + c, 0),
    }
  }

  getRecent(n = 20): readonly CallMetric[] {
    return this.buffer.slice(-n)
  }

  getByTraceId(traceId: string): readonly CallMetric[] {
    return this.buffer.filter(m => m.traceId === traceId)
  }
}
