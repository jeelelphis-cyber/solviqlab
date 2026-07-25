import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeepSeekProvider } from '../providers/deepseek-provider'
import type { LLMMessage } from '../types'

const MESSAGES: LLMMessage[] = [
  { role: 'system',    content: 'You are a coach.' },
  { role: 'user',      content: 'How do I lose weight?' },
]

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok:     status < 400,
    status,
    json:   async () => body,
    body:   null,
  })
}

describe('DeepSeekProvider', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('isAvailable returns true when apiKey is set', async () => {
    expect(await new DeepSeekProvider('sk-test').isAvailable()).toBe(true)
  })

  it('isAvailable returns false when apiKey is empty', async () => {
    expect(await new DeepSeekProvider('').isAvailable()).toBe(false)
  })

  it('getModelId returns deepseek-chat by default', () => {
    expect(new DeepSeekProvider('sk-test').getModelId()).toBe('deepseek-chat')
  })

  it('getModelId returns deepseek-reasoner when specified', () => {
    expect(new DeepSeekProvider('sk-test', 'deepseek-reasoner').getModelId()).toBe('deepseek-reasoner')
  })

  it('complete returns parsed LLMResponse', async () => {
    const payload = {
      choices: [{ message: { content: 'Eat less, move more.' }, finish_reason: 'stop' }],
      model:   'deepseek-chat',
      usage:   { completion_tokens: 12 },
    }
    global.fetch = mockFetch(payload)

    const res = await new DeepSeekProvider('sk-test').complete(MESSAGES)
    expect(res.content).toBe('Eat less, move more.')
    expect(res.model).toBe('deepseek-chat')
    expect(res.tokens_used).toBe(12)
    expect(res.finish_reason).toBe('stop')
  })

  it('complete maps non-stop finish_reason to length', async () => {
    const payload = {
      choices: [{ message: { content: 'Too long...' }, finish_reason: 'length' }],
      model:   'deepseek-chat',
      usage:   { completion_tokens: 1024 },
    }
    global.fetch = mockFetch(payload)

    const res = await new DeepSeekProvider('sk-test').complete(MESSAGES)
    expect(res.finish_reason).toBe('length')
  })

  it('complete throws on 429', async () => {
    global.fetch = mockFetch({}, 429)
    await expect(new DeepSeekProvider('sk-test').complete(MESSAGES)).rejects.toMatchObject({ code: 'rate_limited' })
  })

  it('complete throws on 500', async () => {
    global.fetch = mockFetch({}, 500)
    await expect(new DeepSeekProvider('sk-test').complete(MESSAGES)).rejects.toMatchObject({ code: 'provider_unavailable' })
  })

  it('sends Authorization: Bearer header', async () => {
    const payload = {
      choices: [{ message: { content: 'Hi' }, finish_reason: 'stop' }],
      model:   'deepseek-chat',
      usage:   { completion_tokens: 1 },
    }
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => payload, body: null })
    global.fetch = spy

    await new DeepSeekProvider('sk-abc').complete(MESSAGES)
    const init = spy.mock.calls[0]![1] as RequestInit
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer sk-abc')
  })

  it('sends stream: true in payload when streaming', async () => {
    // Build a fake SSE stream
    const sseLines = [
      'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}',
      'data: {"choices":[{"delta":{"content":" world"},"finish_reason":null}]}',
      'data: [DONE]',
    ].join('\n') + '\n'

    const encoder = new TextEncoder()
    const bytes   = encoder.encode(sseLines)
    let   pos     = 0
    const stream  = new ReadableStream({
      pull(controller) {
        if (pos < bytes.length) {
          controller.enqueue(bytes.slice(pos, pos + 64))
          pos += 64
        } else {
          controller.close()
        }
      },
    })

    const spy = vi.fn().mockResolvedValue({ ok: true, status: 200, body: stream })
    global.fetch = spy

    const provider = new DeepSeekProvider('sk-test')
    const chunks   = []
    for await (const chunk of provider.stream(MESSAGES)) chunks.push(chunk)

    const body = JSON.parse((spy.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.stream).toBe(true)

    const text = chunks.filter(c => !c.done).map(c => c.delta).join('')
    expect(text).toBe('Hello world')
    expect(chunks[chunks.length - 1]!.done).toBe(true)
  })
})
