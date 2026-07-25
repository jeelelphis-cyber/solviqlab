// ─────────────────────────────────────────────────────────────────────────────
// POST /api/heygen/generate — generate Mia's video from UserGraph
// GET  /api/heygen/generate?videoId=xxx — poll video status
//
// API key stays on server. Client sends the graph (no server-side DB yet).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { HeyGenService }    from '@/lib/heygen/service'
import { MiaScriptBuilder } from '@/lib/heygen/script-builder'
import type { UserGraph }   from '@/lib/graph/types'

interface GenerateRequest {
  name:    string
  graph:   UserGraph
  lang?:   string
  userId?: string
}

function getService(): HeyGenService {
  const key = process.env.HEYGEN_API_KEY
  if (!key) throw new Error('HEYGEN_API_KEY not configured')
  return new HeyGenService(key)
}

export async function POST(req: NextRequest) {
  let body: GenerateRequest
  try {
    body = await req.json() as GenerateRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, graph, lang = 'en', userId } = body
  if (!name || !graph) {
    return NextResponse.json({ error: 'name and graph required' }, { status: 400 })
  }

  const script = new MiaScriptBuilder().build(graph, name, lang, userId)

  let service: HeyGenService
  try {
    service = getService()
  } catch {
    return NextResponse.json({ error: 'HeyGen not configured' }, { status: 503 })
  }

  try {
    const { videoId } = await service.generateVideo({
      script:   script.text,
      avatarId: '',  // uses MIA_AVATAR_ID default in HeyGenService
      voiceId:  '',  // uses MIA_VOICE_ID default in HeyGenService
    })

    return NextResponse.json({
      videoId,
      script: {
        text:       script.text,
        wordCount:  script.wordCount,
        estSeconds: script.estSeconds,
        variantIds: script.variantIds,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'HeyGen error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId')
  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 })
  }

  let service: HeyGenService
  try {
    service = getService()
  } catch {
    return NextResponse.json({ error: 'HeyGen not configured' }, { status: 503 })
  }

  try {
    const status = await service.getStatus(videoId)
    return NextResponse.json(status)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'HeyGen error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
