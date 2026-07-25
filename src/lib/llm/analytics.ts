import type { LLMResponse } from './types'

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

export class LLMAnalytics {
  trackRequest(conversationId: string, provider: string): void {
    try {
      window.gtag?.('event', 'llm_request', { conversation_id: conversationId, provider })
    } catch {}
  }

  trackResponse(response: LLMResponse, conversationId: string): void {
    try {
      window.gtag?.('event', 'llm_response', {
        conversation_id: conversationId,
        model:           response.model,
        tokens_used:     response.tokens_used,
        finish_reason:   response.finish_reason,
      })
    } catch {}
  }

  trackSafetyBlock(layer: 'input' | 'output', conversationId: string): void {
    try {
      window.gtag?.('event', 'llm_safety_block', { layer, conversation_id: conversationId })
    } catch {}
  }

  trackError(error: string, conversationId: string): void {
    try {
      window.gtag?.('event', 'llm_error', { error, conversation_id: conversationId })
    } catch {}
  }
}

export const llmAnalytics = new LLMAnalytics()
