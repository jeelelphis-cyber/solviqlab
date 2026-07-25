// ─────────────────────────────────────────────────────────────────────────────
// LLMProvider — abstraction over AI model backends.
//
// Phase 1: MockLLMProvider (context-aware canned responses, no network).
// Phase 3+: AnthropicProvider, OpenAIProvider — implement this interface.
//   Swap in platform.ts. Zero other changes.
// ─────────────────────────────────────────────────────────────────────────────

import type { LLMMessage, LLMOptions, LLMResponse } from './types'
import type { LLMChunk, StreamOptions } from './streaming'

export interface LLMProvider {
  complete(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>
  stream(messages: LLMMessage[], options?: StreamOptions): AsyncGenerator<LLMChunk>
  isAvailable(): Promise<boolean>
  getModelId(): string
}

// Returns contextually appropriate canned responses for development and testing.
export class MockLLMProvider implements LLMProvider {
  async complete(messages: LLMMessage[], _options?: LLMOptions): Promise<LLMResponse> {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
    const content         = this.generateResponse(lastUserMessage, messages)
    return { content, model: this.getModelId(), tokens_used: null, finish_reason: 'stop' }
  }

  async * stream(messages: LLMMessage[], options?: StreamOptions): AsyncGenerator<LLMChunk> {
    const response = await this.complete(messages)
    const words    = response.content.split(' ')
    for (let i = 0; i < words.length; i++) {
      if (options?.signal?.aborted) break
      yield { delta: (i === 0 ? '' : ' ') + words[i]!, done: false }
    }
    yield { delta: '', done: true }
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  getModelId(): string {
    return 'mock-v1'
  }

  private generateResponse(userMessage: string, messages: LLMMessage[]): string {
    const systemMsg = messages.find(m => m.role === 'system')?.content ?? ''
    const lower     = userMessage.toLowerCase()

    if (lower.includes('plan') || lower.includes('goal')) {
      return "Based on your assessment data, I recommend starting with small, consistent steps. Your current phase suggests a structured approach will work best. What specific aspect of your plan would you like to explore?"
    }
    if (lower.includes('progress') || lower.includes('how am i doing')) {
      return "Your journey data shows consistent engagement. Keep focusing on your weekly check-ins — they're the most reliable predictor of long-term success. What's been your biggest challenge this week?"
    }
    if (lower.includes('score') || lower.includes('assessment')) {
      return "Your assessment results give us a solid baseline to work from. The areas with the most opportunity for improvement are often where the biggest gains come. Would you like to dig into any specific dimension?"
    }
    if (systemMsg.includes('sleep')) {
      return "Sleep quality improvements tend to compound over time. Based on what I know about your journey, focus on consistency first — same time every night. What's currently disrupting your sleep most?"
    }
    return "Thank you for sharing that. Based on your journey data, I can see you're making meaningful progress. What would be most helpful to focus on right now?"
  }
}
