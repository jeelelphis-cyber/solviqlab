// ─────────────────────────────────────────────────────────────────────────────
// PromptStrategy — pluggable prompt construction strategies.
//
// Sprint 9 PD recommendation: PromptComposer is static. Introduce PromptStrategy
// so future styles (Motivator, Consultant, Explainer) can be swapped in
// platform.ts without touching the composer logic.
// ─────────────────────────────────────────────────────────────────────────────

import type { LLMContext, LLMMessage } from './types'
import type { ConversationTurn } from './types'
import { buildSystemPrompt } from './i18n'

export interface PromptStrategy {
  readonly id: string
  buildSystemMessage(context: LLMContext, lang: string): string
  buildHistory(history: readonly ConversationTurn[], maxTurns: number): LLMMessage[]
  buildUserMessage(userMessage: string, context: LLMContext): string
}

// Default strategy — mirrors previous PromptComposer behaviour exactly.
export class DefaultCoachStrategy implements PromptStrategy {
  readonly id: string = 'default_coach'

  buildSystemMessage(context: LLMContext, lang: string): string {
    return buildSystemPrompt(context, lang)
  }

  buildHistory(history: readonly ConversationTurn[], maxTurns: number): LLMMessage[] {
    return history.slice(-maxTurns).map(t => ({ role: t.role, content: t.content }))
  }

  buildUserMessage(userMessage: string, _context: LLMContext): string {
    return userMessage
  }
}

// Motivator — prepends an encouraging framing to user messages.
export class MotivatorStrategy extends DefaultCoachStrategy {
  override readonly id = 'motivator'

  override buildUserMessage(userMessage: string, context: LLMContext): string {
    const progress = context.journeyProgress != null ? ` (${context.journeyProgress}% journey progress)` : ''
    return `[User${progress}]: ${userMessage}`
  }
}

// Consultant — wraps system prompt with a professional advisory framing.
export class ConsultantStrategy extends DefaultCoachStrategy {
  override readonly id = 'consultant'

  override buildSystemMessage(context: LLMContext, lang: string): string {
    const base = buildSystemPrompt(context, lang)
    return `${base}\n\nRespond as a professional wellness consultant. Be concise, evidence-based, and actionable.`
  }
}

// Explainer — adds a "explain your reasoning" instruction to each user turn.
export class ExplainerStrategy extends DefaultCoachStrategy {
  override readonly id = 'explainer'

  override buildUserMessage(userMessage: string, _context: LLMContext): string {
    return `${userMessage}\n\n(Please briefly explain your reasoning.)`
  }
}
