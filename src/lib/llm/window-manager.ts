import type { LLMMessage } from './types'
import type { TokenEstimator } from './token-estimator'
import { CharBasedEstimator } from './token-estimator'

export interface WindowConfig {
  readonly maxTokens: number
  readonly reservedForOutput: number
}

const DEFAULT_CONFIG: WindowConfig = {
  maxTokens:         8192,
  reservedForOutput: 1024,
}

export class ContextWindowManager {
  private readonly config:    WindowConfig
  private readonly estimator: TokenEstimator

  constructor(config?: Partial<WindowConfig>, estimator?: TokenEstimator) {
    this.config    = { ...DEFAULT_CONFIG, ...config }
    this.estimator = estimator ?? new CharBasedEstimator()
  }

  fit(messages: LLMMessage[]): LLMMessage[] {
    const budget = this.config.maxTokens - this.config.reservedForOutput

    if (this.estimator.estimate(messages) <= budget) return messages

    const system      = messages.filter(m => m.role === 'system')
    const nonSystem   = messages.filter(m => m.role !== 'system')
    const systemCost  = this.estimator.estimate(system)
    const available   = budget - systemCost

    let trimmed = [...nonSystem]
    while (trimmed.length > 0 && this.estimator.estimate(trimmed) > available) {
      trimmed = trimmed.slice(1)
    }

    return [...system, ...trimmed]
  }

  estimateTokens(messages: LLMMessage[]): number {
    return this.estimator.estimate(messages)
  }
}
