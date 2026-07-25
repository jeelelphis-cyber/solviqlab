import { describe, it, expect } from 'vitest'
import { MockLLMProvider } from '../provider'

describe('MockLLMProvider streaming', () => {
  it('yields non-done chunks then a done chunk', async () => {
    const provider  = new MockLLMProvider()
    const messages  = [{ role: 'user' as const, content: 'Hello coach' }]
    const chunks    = []

    for await (const chunk of provider.stream(messages)) {
      chunks.push(chunk)
    }

    expect(chunks.length).toBeGreaterThan(1)
    const lastChunk = chunks[chunks.length - 1]!
    expect(lastChunk.done).toBe(true)
    expect(lastChunk.delta).toBe('')

    const nonDone = chunks.slice(0, -1)
    expect(nonDone.every(c => !c.done)).toBe(true)
  })

  it('assembles chunks into full response content', async () => {
    const provider  = new MockLLMProvider()
    const messages  = [{ role: 'user' as const, content: 'How is my progress?' }]
    const expected  = await provider.complete(messages)

    let assembled = ''
    for await (const chunk of provider.stream(messages)) {
      if (!chunk.done) assembled += chunk.delta
    }

    expect(assembled).toBe(expected.content)
  })

  it('stops early when AbortSignal is aborted', async () => {
    const provider = new MockLLMProvider()
    const messages = [{ role: 'user' as const, content: 'Tell me about my plan' }]
    const ctrl     = new AbortController()
    const chunks   = []

    for await (const chunk of provider.stream(messages, { signal: ctrl.signal })) {
      chunks.push(chunk)
      if (chunks.length === 2) ctrl.abort()
    }

    // After abort, no more non-done chunks should arrive
    const nonDone = chunks.filter(c => !c.done)
    expect(nonDone.length).toBeLessThanOrEqual(2)
  })
})
