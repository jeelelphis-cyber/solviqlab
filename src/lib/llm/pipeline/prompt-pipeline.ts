// ─────────────────────────────────────────────────────────────────────────────
// PromptPipeline — assembles LLMMessage[] from raw inputs.
//
// Single responsibility: given a user message and conversation state,
// produce the final message array ready to send to any LLMProvider.
// Owns: ContextBuilder → StrategyResolver → PromptComposer → WindowManager.
// ─────────────────────────────────────────────────────────────────────────────

import type { ContextBuilder } from '../context-builder'
import type { PromptComposer } from '../prompt-composer'
import type { ConversationTurn, LLMMessage } from '../types'
import { ContextWindowManager } from '../window-manager'
import { StrategyResolver } from '../strategy-resolver'
import type { TokenEstimator } from '../token-estimator'
import type { WindowConfig } from '../window-manager'

export interface PromptPipelineConfig {
  readonly windowConfig?:    Partial<WindowConfig>
  readonly tokenEstimator?:  TokenEstimator
}

export class PromptPipeline {
  private readonly strategyResolver: StrategyResolver
  private readonly windowManager:    ContextWindowManager

  constructor(
    private readonly contextBuilder: ContextBuilder,
    private readonly promptComposer: PromptComposer,
    config?: PromptPipelineConfig,
  ) {
    this.strategyResolver = new StrategyResolver()
    this.windowManager    = new ContextWindowManager(
      config?.windowConfig,
      config?.tokenEstimator,
    )
  }

  build(
    userMessage: string,
    lang: string,
    history: readonly ConversationTurn[],
    clusterId?: string,
  ): LLMMessage[] {
    const context  = this.contextBuilder.build(clusterId)
    const strategy = this.strategyResolver.resolve(context)
    const raw      = this.promptComposer.composeWith(strategy, context, userMessage, lang, history)
    return this.windowManager.fit(raw)
  }
}
