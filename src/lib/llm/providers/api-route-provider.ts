// ─────────────────────────────────────────────────────────────────────────────
// APIRouteProvider — browser-side LLMProvider that calls /api/llm/chat.
//
// This provider runs in the browser. It delegates to the Next.js API route
// which holds the actual model API keys. Never used server-side.
// ─────────────────────────────────────────────────────────────────────────────

import type { LLMMessage, LLMOptions, LLMResponse } from '../types'
import type { LLMChunk, StreamOptions } from '../streaming'
import type { LLMProvider } from '../provider'
import { LLMError } from '../error'

const CHAT_ENDPOINT = '/api/llm/chat'

export class APIRouteProvider implements LLMProvider {
  constructor(private readonly modelId: string = 'claude-haiku-4-5-20251001') {}

  async complete(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const res = await fetch(CHAT_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages, options, stream: false }),
    })

    if (res.status === 429) throw LLMError.rateLimit()
    if (!res.ok) throw LLMError.providerUnavailable(this.modelId)

    return res.json() as Promise<LLMResponse>
  }

  async * stream(messages: LLMMessage[], options?: StreamOptions): AsyncGenerator<LLMChunk> {
    const res = await fetch(CHAT_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages, options, stream: true }),
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
            const chunk = JSON.parse(raw) as LLMChunk
            yield chunk
          } catch { /* malformed SSE line — skip */ }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(CHAT_ENDPOINT, { method: 'HEAD' })
      return res.ok || res.status === 405  // 405 = route exists, HEAD not handled
    } catch {
      return false
    }
  }

  getModelId(): string {
    return this.modelId
  }
}
