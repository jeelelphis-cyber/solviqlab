export type HeyGenVideoStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface HeyGenGenerateRequest {
  readonly script:   string
  readonly avatarId: string
  readonly voiceId:  string
}

export interface HeyGenGenerateResponse {
  readonly videoId: string
}

export interface HeyGenStatusResponse {
  readonly status:    HeyGenVideoStatus
  readonly videoUrl:  string | null
  readonly errorMsg:  string | null
}

// Default avatar and voice for Mia
export const MIA_AVATAR_ID = 'Abigail_expressive_2024112501'
export const MIA_VOICE_ID  = 'M2WosQ2Ju3f2b7jdddsj'
