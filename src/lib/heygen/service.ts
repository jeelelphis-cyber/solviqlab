// ─────────────────────────────────────────────────────────────────────────────
// HeyGenService — server-side video generation.
// Uses v2 API (supported until 2026-10-31). Migration to v3 planned.
// Never instantiated in the browser — API key stays on server.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  HeyGenGenerateRequest,
  HeyGenGenerateResponse,
  HeyGenStatusResponse,
} from './types'
import { MIA_AVATAR_ID, MIA_VOICE_ID } from './types'

const BASE = 'https://api.heygen.com'

export class HeyGenService {
  constructor(private readonly apiKey: string) {}

  async generateVideo(req: HeyGenGenerateRequest): Promise<HeyGenGenerateResponse> {
    const res = await fetch(`${BASE}/v2/video/generate`, {
      method:  'POST',
      headers: this.headers(),
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type:         'avatar',
            avatar_id:    req.avatarId ?? MIA_AVATAR_ID,
            avatar_style: 'normal',
          },
          voice: {
            type:       'text',
            input_text: req.script,
            voice_id:   req.voiceId ?? MIA_VOICE_ID,
          },
        }],
        dimension: { width: 1280, height: 720 },
      }),
    })

    const data = await res.json() as {
      data:  { video_id: string } | null
      error: { code: string; message: string } | null
    }

    if (!res.ok || data.error || !data.data?.video_id) {
      throw new Error(data.error?.message ?? 'HeyGen generation failed')
    }

    return { videoId: data.data.video_id }
  }

  async getStatus(videoId: string): Promise<HeyGenStatusResponse> {
    const res  = await fetch(`${BASE}/v1/video_status.get?video_id=${videoId}`, {
      headers: this.headers(),
    })
    const data = await res.json() as {
      data: {
        status:    string
        video_url: string | null
        error?:    string | null
      } | null
    }

    const d = data.data
    if (!d) return { status: 'failed', videoUrl: null, errorMsg: 'No data' }

    const status = (d.status === 'completed' ? 'completed'
      : d.status === 'failed'    ? 'failed'
      : d.status === 'processing' ? 'processing'
      : 'pending') as import('./types').HeyGenVideoStatus

    return {
      status,
      videoUrl:  d.video_url ?? null,
      errorMsg:  d.error    ?? null,
    }
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey)
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'X-Api-Key':    this.apiKey,
    }
  }
}
