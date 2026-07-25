// ─────────────────────────────────────────────────────────────────────────────
// POST /api/llm/chat
//
// Proxy between browser and model providers. API keys never leave the server.
// Provider selection is handled by ProviderResolver — add new providers here
// without touching any other file.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import type { LLMMessage, LLMOptions } from '@/lib/llm/types'
import { ProviderResolver } from '@/lib/llm/provider-resolver'
import { DeepSeekProvider } from '@/lib/llm/providers/deepseek-provider'
import { AnthropicProvider } from '@/lib/llm/providers/anthropic-provider'
import { OpenAIProvider } from '@/lib/llm/providers/openai-provider'
import { MockLLMProvider } from '@/lib/llm/provider'

interface ChatRequest {
  messages:   LLMMessage[]
  options?:   LLMOptions
  stream?:    boolean
  provider?:  string
}

function buildResolver(): ProviderResolver {
  const entries = []

  // DeepSeek first — primary production model (~10× cheaper than Claude Sonnet)
  if (process.env.DEEPSEEK_API_KEY) {
    entries.push({
      name:     'deepseek',
      provider: new DeepSeekProvider(process.env.DEEPSEEK_API_KEY),
    })
  }

  if (process.env.ANTHROPIC_API_KEY) {
    entries.push({
      name:     'anthropic',
      provider: new AnthropicProvider(process.env.ANTHROPIC_API_KEY),
    })
  }

  if (process.env.OPENAI_API_KEY) {
    entries.push({
      name:     'openai',
      provider: new OpenAIProvider(process.env.OPENAI_API_KEY),
    })
  }

  // Development fallback — no real calls
  entries.push({ name: 'mock', provider: new MockLLMProvider() })

  return new ProviderResolver(entries)
}

// Resolver is constructed per-request so env vars are read at runtime (not build time).
export async function POST(req: NextRequest) {
  let body: ChatRequest
  try {
    body = await req.json() as ChatRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { messages, options, stream = false, provider: preferredName } = body

  let provider
  try {
    provider = await buildResolver().resolve(preferredName)
  } catch {
    return NextResponse.json({ error: 'No LLM provider available' }, { status: 503 })
  }

  if (stream) {
    const { readable, writable } = new TransformStream()
    const writer  = writable.getWriter()
    const encoder = new TextEncoder()

    ;(async () => {
      try {
        for await (const chunk of provider.stream(messages, options)) {
          await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          if (chunk.done) break
        }
        await writer.write(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream error'
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
      } finally {
        writer.close()
      }
    })()

    return new Response(readable, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  }

  try {
    const response = await provider.complete(messages, options)
    return NextResponse.json(response)
  } catch (err) {
    const status = (err as any)?.code === 'rate_limited' ? 429 : 502
    return NextResponse.json({ error: 'Provider error' }, { status })
  }
}
