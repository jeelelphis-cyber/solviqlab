// ─────────────────────────────────────────────────────────────────────────────
// OpenAIProvider — server-side LLMProvider for OpenAI GPT models.
//
// Used as fallback / A/B alternative to AnthropicProvider.
// Never instantiated in the browser.
// ─────────────────────────────────────────────────────────────────────────────

import type { LLMMessage, LLMOptions, LLMResponse } from '../types'
import type { LLMChunk, StreamOptions } from '../streaming'
import type { LLMProvider } from '../provider'
import { LLMError } from '../error'

const OPENAI_API = 'https://api.openai.com/v1/chat/completions'

export class OpenAIProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly modelId: string = 'gpt-4o-mini',
    private readonly defaultMaxTokens: number = 1024,
  ) {}

  async complete(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const res = await fetch(OPENAI_API, {
      method:  'POST',
      headers: this.headers(),
      body:    JSON.stringify(this.buildPayload(messages, options, false)),
    })

    if (res.status === 429) throw LLMError.rateLimit()
    if (!res.ok) throw LLMError.providerUnavailable(this.modelId)

    const data = await res.json() as {
      choices: Array<{ message: { content: string }; finish_reason: string }>
      model:   string
      usage:   { completion_tokens: number }
    }

    const choice = data.choices[0]!
    return {
      content:       choice.message.content,
      model:         data.model,
      tokens_used:   data.usage?.completion_tokens ?? null,
      finish_reason: choice.finish_reason === 'stop' ? 'stop' : 'length',
    }
  }

  async * stream(messages: LLMMessage[], options?: StreamOptions): AsyncGenerator<LLMChunk> {
    const res = await fetch(OPENAI_API, {
      method:  'POST',
      headers: this.headers(),
      body:    JSON.stringify(this.buildPayload(messages, options, true)),
      signal:  options?.signal,
    })

    if (res.status === 429) throw LLMError.rateLimit()
    if (!res.ok) throw LLMError.providerUnavailable(this.modelId)
    if (!res.body) throw new Error('No response body')

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let   buffer  = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') { yield { delta: '', done: true }; return }

          try {
            const event = JSON.parse(raw) as Record<string, unknown>
            const delta = (event['choices'] as any)?.[0]?.delta?.content ?? ''
            if (delta) yield { delta, done: false }
          } catch { /* malformed SSE line */ }
        }
      }
      yield { delta: '', done: true }
    } finally {
      reader.releaseLock()
    }
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey)
  }

  getModelId(): string {
    return this.modelId
  }

  private headers() {
    return {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    }
  }

  private buildPayload(messages: LLMMessage[], options: LLMOptions | StreamOptions | undefined, stream: boolean) {
    return {
      model:       this.modelId,
      max_tokens:  options?.maxTokens ?? this.defaultMaxTokens,
      temperature: options?.temperature ?? 0.7,
      messages:    messages.map(m => ({ role: m.role, content: m.content })),
      stream,
    }
  }
}
