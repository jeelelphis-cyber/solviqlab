import type { ConversationTurn, LLMContext, LLMMessage } from './types'
import type { PromptStrategy } from './prompt-strategy'
import { DefaultCoachStrategy } from './prompt-strategy'

const MAX_HISTORY_TURNS = 10

export class PromptComposer {
  private readonly strategy: PromptStrategy

  constructor(strategy?: PromptStrategy) {
    this.strategy = strategy ?? new DefaultCoachStrategy()
  }

  compose(
    context: LLMContext,
    userMessage: string,
    lang: string,
    history: readonly ConversationTurn[] = [],
  ): LLMMessage[] {
    return this.composeWith(this.strategy, context, userMessage, lang, history)
  }

  // Compose using an externally-resolved strategy (e.g. from StrategyResolver).
  composeWith(
    strategy: PromptStrategy,
    context: LLMContext,
    userMessage: string,
    lang: string,
    history: readonly ConversationTurn[] = [],
  ): LLMMessage[] {
    const systemContent = strategy.buildSystemMessage(context, lang)
    const messages: LLMMessage[] = [{ role: 'system', content: systemContent }]

    for (const msg of strategy.buildHistory(history, MAX_HISTORY_TURNS)) {
      messages.push(msg)
    }

    messages.push({ role: 'user', content: strategy.buildUserMessage(userMessage, context) })
    return messages
  }
}

export const promptComposer = new PromptComposer()
