import type { LLMAnalytics } from '../analytics'
import type { LLMResponse } from '../types'
import type { CostEstimator } from '../cost-estimator'
import { LLMObservability } from '../observability'

export class MetricsCollector {
  readonly observability: LLMObservability

  constructor(
    private readonly analytics:      LLMAnalytics,
    observability?:                  LLMObservability,
    private readonly costEstimator?: CostEstimator,
  ) {
    this.observability = observability ?? new LLMObservability()
  }

  trackRequest(conversationId: string, provider: string): void {
    this.analytics.trackRequest(conversationId, provider)
  }

  trackResponse(response: LLMResponse, conversationId: string): void {
    this.analytics.trackResponse(response, conversationId)
  }

  trackSafetyBlock(layer: 'input' | 'output', conversationId: string): void {
    this.analytics.trackSafetyBlock(layer, conversationId)
  }

  trackError(error: string, conversationId: string): void {
    this.analytics.trackError(error, conversationId)
  }

  // Generic wrapper — traceId optional for backward compat with tests.
  async measure<T>(
    conversationId: string,
    provider: string,
    fn: () => Promise<T>,
    traceId = '',
  ): Promise<T> {
    return this.observability.measure(conversationId, provider, fn, traceId)
  }

  // Specialized wrapper for LLMResponse — records token count and cost.
  async executeComplete(
    traceId: string,
    conversationId: string,
    provider: string,
    fn: () => Promise<LLMResponse>,
  ): Promise<LLMResponse> {
    const start = Date.now()
    try {
      const response = await fn()
      const costUSD = response.tokens_used != null && this.costEstimator
        ? this.costEstimator.estimateOutput(response.model, response.tokens_used)
        : null

      this.observability.record({
        traceId,
        conversationId,
        provider,
        latencyMs:  Date.now() - start,
        tokensUsed: response.tokens_used,
        costUSD,
        success:    true,
        errorCode:  null,
        timestamp:  new Date().toISOString(),
      })
      return response
    } catch (err) {
      this.observability.record({
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

  recordStream(
    conversationId: string,
    provider: string,
    latencyMs: number,
    success: boolean,
    errorCode: string | null,
    traceId = '',
  ): void {
    this.observability.record({
      traceId,
      conversationId,
      provider,
      latencyMs,
      tokensUsed: null,
      costUSD:    null,
      success,
      errorCode,
      timestamp:  new Date().toISOString(),
    })
  }
}
