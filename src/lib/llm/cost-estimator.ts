// ─────────────────────────────────────────────────────────────────────────────
// CostEstimator — maps (model, tokens) → USD cost.
//
// Prices are per 1M tokens (USD). Source: public pricing pages as of 2025-07.
// Phase 3+: fetch live pricing from a config service or env vars.
// ─────────────────────────────────────────────────────────────────────────────

export interface ModelPricing {
  readonly inputPer1M:  number   // USD per 1M input tokens
  readonly outputPer1M: number   // USD per 1M output tokens
}

const DEFAULT_PRICING: Record<string, ModelPricing> = {
  // DeepSeek (cache-miss prices; ~10× cheaper than Claude Sonnet)
  'deepseek-chat':     { inputPer1M: 0.27,  outputPer1M: 1.10  },
  'deepseek-reasoner': { inputPer1M: 0.55,  outputPer1M: 2.19  },
  // Anthropic
  'claude-haiku-4-5-20251001': { inputPer1M: 0.25,  outputPer1M: 1.25  },
  'claude-sonnet-4-6':         { inputPer1M: 3.00,  outputPer1M: 15.00 },
  'claude-opus-4-7':           { inputPer1M: 15.00, outputPer1M: 75.00 },
  // OpenAI
  'gpt-4o-mini':               { inputPer1M: 0.15,  outputPer1M: 0.60  },
  'gpt-4o':                    { inputPer1M: 5.00,  outputPer1M: 15.00 },
  // Dev
  'mock-v1':                   { inputPer1M: 0,     outputPer1M: 0     },
}

export class CostEstimator {
  private readonly pricing: Record<string, ModelPricing>

  constructor(overrides?: Record<string, ModelPricing>) {
    this.pricing = { ...DEFAULT_PRICING, ...overrides }
  }

  estimateInput(modelId: string, tokens: number): number {
    const p = this.pricingFor(modelId)
    return (tokens / 1_000_000) * p.inputPer1M
  }

  estimateOutput(modelId: string, tokens: number): number {
    const p = this.pricingFor(modelId)
    return (tokens / 1_000_000) * p.outputPer1M
  }

  estimateTotal(modelId: string, inputTokens: number, outputTokens: number): number {
    return this.estimateInput(modelId, inputTokens) + this.estimateOutput(modelId, outputTokens)
  }

  isKnownModel(modelId: string): boolean {
    return modelId in this.pricing
  }

  listModels(): readonly string[] {
    return Object.keys(this.pricing)
  }

  private pricingFor(modelId: string): ModelPricing {
    return this.pricing[modelId] ?? { inputPer1M: 0, outputPer1M: 0 }
  }
}
