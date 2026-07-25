// ─────────────────────────────────────────────────────────────────────────────
// TokenEstimator — abstraction over token counting strategies.
//
// Phase 1: CharBasedEstimator (1 token ≈ 4 chars, fast, no deps).
// Phase 3+: Replace with TiktokenEstimator per-model for accurate billing.
// Injected into ContextWindowManager so the window manager never hard-codes
// any tokenisation assumption.
// ─────────────────────────────────────────────────────────────────────────────

import type { LLMMessage } from './types'

export interface TokenEstimator {
  readonly modelId: string
  estimate(messages: LLMMessage[]): number
  estimateText(text: string): number
}

// 1 token ≈ 4 English characters — sufficient for budget gating pre-launch.
export class CharBasedEstimator implements TokenEstimator {
  readonly modelId: string

  constructor(modelId = 'default') {
    this.modelId = modelId
  }

  estimate(messages: LLMMessage[]): number {
    return Math.ceil(messages.reduce((n, m) => n + m.content.length, 0) / 4)
  }

  estimateText(text: string): number {
    return Math.ceil(text.length / 4)
  }
}

// Stub for future tiktoken / cl100k_base integration.
// Swap in platform.ts when the tiktoken WASM bundle is available.
export class TiktokenEstimator implements TokenEstimator {
  readonly modelId: string

  constructor(modelId: string) {
    this.modelId = modelId
  }

  estimate(messages: LLMMessage[]): number {
    // TODO: replace with real tiktoken when bundled
    return new CharBasedEstimator(this.modelId).estimate(messages)
  }

  estimateText(text: string): number {
    return new CharBasedEstimator(this.modelId).estimateText(text)
  }
}
