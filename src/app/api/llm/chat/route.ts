// ─────────────────────────────────────────────────────────────────────────────
// POST /api/llm/chat
//
// Proxy between browser and model providers. API keys never leave the server.
// Provider selection is handled by ProviderResolver — add new providers here
// without touching any other file.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { LLMMessage, LLMOptions } from '@/lib/llm/types'
import { ProviderResolver } from '@/lib/llm/provider-resolver'
import { DeepSeekProvider } from '@/lib/llm/providers/deepseek-provider'
import { AnthropicProvider } from '@/lib/llm/providers/anthropic-provider'
import { OpenAIProvider } from '@/lib/llm/providers/openai-provider'
import { MockLLMProvider } from '@/lib/llm/provider'
import { getUserSubscriptionStatus } from '@/lib/member/subscription'
import { createServiceClient } from '@/lib/supabase/server'
import { emit } from '@/lib/events/emitter'

const MAX_MESSAGES_PER_HOUR = 100
const FREE_TURNS = 3  // anonymous users get 3 turns (enforced client-side; server validates session)

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

async function checkRateLimit(userId: string): Promise<boolean> {
  const supabase = createServiceClient()
  const windowKey = `chat:${new Date().toISOString().slice(0, 13)}`  // hourly bucket

  const { data } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('user_id', userId)
    .eq('window_key', windowKey)
    .single()

  const current = (data?.count ?? 0) as number
  if (current >= MAX_MESSAGES_PER_HOUR) return false

  await supabase
    .from('rate_limits')
    .upsert({ user_id: userId, window_key: windowKey, count: current + 1 }, { onConflict: 'user_id,window_key' })

  return true
}

// Resolver is constructed per-request so env vars are read at runtime (not build time).
export async function POST(req: NextRequest) {
  // Auth check — authenticated users must be PRO
  const session = await getServerSession()
  const userId = (session?.user as { id?: string } | undefined)?.id

  if (userId) {
    // Authenticated user: check PRO status
    const status = await getUserSubscriptionStatus(userId)
    if (!status?.isPro) {
      return NextResponse.json(
        { error: 'Trial expired', code: 'TRIAL_EXPIRED', upgradeUrl: '/pro' },
        { status: 402 }
      )
    }

    // Rate limit
    const allowed = await checkRateLimit(userId)
    if (!allowed) {
      emit('RATE_LIMIT_HIT', userId, 'server', 'en', { endpoint: '/api/llm/chat' })
      return NextResponse.json(
        { error: 'Too many requests', code: 'RATE_LIMIT' },
        { status: 429 }
      )
    }
  }
  // Anonymous users: client enforces FREE_TURNS (3). No server enforcement needed
  // since anonymous users have no persistent identity to track server-side.

  let body: ChatRequest
  try {
    body = await req.json() as ChatRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { messages, options, stream = false, provider: preferredName } = body
  const sessionId = req.headers.get('x-session-id') ?? 'unknown'
  const lang      = req.headers.get('x-lang') ?? 'en'
  const coachId   = (options as { coachId?: string } | undefined)?.coachId ?? 'unknown'
  const turnNum   = messages.filter((m: LLMMessage) => m.role === 'user').length
  const lastMsg   = messages.findLast?.((m: LLMMessage) => m.role === 'user')

  // Track user message
  emit('COACH_MESSAGE_SENT', userId ?? null, sessionId, lang, {
    coachId,
    turnNumber:    turnNum,
    messageLength: typeof lastMsg?.content === 'string' ? lastMsg.content.length : 0,
  })

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
    emit('COACH_MESSAGE_RECEIVED', userId ?? null, sessionId, lang, {
      coachId,
      turnNumber: turnNum,
      provider:   preferredName ?? 'auto',
    })
    return NextResponse.json(response)
  } catch (err) {
    const status = (err as any)?.code === 'rate_limited' ? 429 : 502
    emit('API_ERROR', userId ?? null, sessionId, lang, { endpoint: '/api/llm/chat', status })
    return NextResponse.json({ error: 'Provider error' }, { status })
  }
}
