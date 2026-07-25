import { describe, it, expect } from 'vitest'
import { MockLLMProvider } from '../provider'
import type { LLMMessage } from '../types'

function makeMessages(userContent: string): LLMMessage[] {
  return [
    { role: 'system', content: 'You are a coach.' },
    { role: 'user', content: userContent },
  ]
}

describe('MockLLMProvider', () => {
  const provider = new MockLLMProvider()

  it('isAvailable() returns true', async () => {
    expect(await provider.isAvailable()).toBe(true)
  })

  it('getModelId() returns mock-v1', () => {
    expect(provider.getModelId()).toBe('mock-v1')
  })

  it('complete() returns a non-empty response', async () => {
    const response = await provider.complete(makeMessages('How am I doing?'))
    expect(response.content).toBeTruthy()
    expect(response.model).toBe('mock-v1')
    expect(response.finish_reason).toBe('stop')
  })

  it('complete() mentions plan when user asks about plan', async () => {
    const response = await provider.complete(makeMessages('What should my plan look like?'))
    expect(response.content.toLowerCase()).toMatch(/plan|step|approach/)
  })

  it('complete() mentions progress when user asks about progress', async () => {
    const response = await provider.complete(makeMessages('How is my progress?'))
    expect(response.content.toLowerCase()).toMatch(/progress|journey|check/)
  })

  it('complete() returns a response for any input', async () => {
    const response = await provider.complete(makeMessages('random text here'))
    expect(response.content.length).toBeGreaterThan(10)
  })

  it('complete() tokens_used is null (mock)', async () => {
    const response = await provider.complete(makeMessages('test'))
    expect(response.tokens_used).toBeNull()
  })
})
