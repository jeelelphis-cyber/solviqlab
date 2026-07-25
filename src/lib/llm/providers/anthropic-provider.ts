// ─────────────────────────────────────────────────────────────────────────────
// AnthropicProvider — server-side LLMProvider for Anthropic Claude models.
//
// Used inside Next.js API routes only. Never instantiated in the browser.
// ─────────────────────────────────────────────────────────────────────────────

import type { LLMMessage, LLMOptions, LLMResponse } from '../types'
import type { LLMChunk, StreamOptions } from '../streaming'
import type { LLMProvider } from '../provider'
import { LLMError } from '../error'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const API_VERSION   = '2023-06-01'

export class AnthropicProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly modelId: string = 'claude-haiku-4-5-20251001',
    private readonly defaultMaxTokens: number = 1024,
  ) {}

  async complete(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const res = await fetch(ANTHROPIC_API, {
      method:  'POST',
      headers: this.headers(),
      body:    JSON.stringify(this.buildPayload(messages, options, false)),
    })

    if (res.status === 429) throw LLMError.rateLimit()
    if (!res.ok) throw LLMError.providerUnavailable(this.modelId)

    const data = await res.json() as {
      content:     Array<{ text: string }>
      model:       string
      usage:       { output_tokens: number }
      stop_reason: string
    }

    return {
      content:       data.content.map(c => c.text).join(''),
      model:         data.model,
      tokens_used:   data.usage?.output_tokens ?? null,
      finish_reason: data.stop_reason === 'end_turn' ? 'stop' : 'length',
    }
  }

  async * stream(messages: LLMMessage[], options?: StreamOptions): AsyncGenerator<LLMChunk> {
    const res = await fetch(ANTHROPIC_API, {
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
            if (event['type'] === 'content_block_delta') {
              yield { delta: (event['delta'] as any)?.text ?? '', done: false }
            }
            if (event['type'] === 'message_stop') {
              yield { delta: '', done: true }; return
            }
          } catch { /* malformed SSE line */ }
        }
      }
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
      'Content-Type':      'application/json',
      'x-api-key':         this.apiKey,
      'anthropic-version': API_VERSION,
    }
  }

  private buildPayload(messages: LLMMessage[], options: LLMOptions | StreamOptions | undefined, stream: boolean) {
    const system = messages.find(m => m.role === 'system')?.content ?? ''
    const turns  = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    return {
      model:       this.modelId,
      max_tokens:  options?.maxTokens ?? this.defaultMaxTokens,
      temperature: options?.temperature ?? 0.7,
      system,
      messages:    turns,
      stream,
    }
  }
}
