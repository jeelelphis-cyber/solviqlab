export interface LLMMessage {
  readonly role: 'system' | 'user' | 'assistant'
  readonly content: string
}

export interface LLMOptions {
  readonly maxTokens?: number
  readonly temperature?: number
}

export interface LLMResponse {
  readonly content: string
  readonly model: string
  readonly tokens_used: number | null
  readonly finish_reason: 'stop' | 'length' | 'safety' | 'error'
}

export interface LLMContext {
  readonly userId: string
  readonly userType: 'anonymous' | 'authenticated'
  readonly subscription: string
  readonly activeCluster: string | null
  readonly assessmentScore: number | null
  readonly assessmentConfidence: string | null
  readonly currentPhase: string | null
  readonly primaryGoal: string | null
  readonly daysSinceActive: number
  readonly dormancyLevel: string
  readonly recentCoachMessages: readonly string[]
  readonly journeyProgress: number | null
  readonly graphSummary: string | null
}

export interface ConversationTurn {
  readonly role: 'user' | 'assistant'
  readonly content: string
  readonly timestamp: string
}

export interface Conversation {
  readonly id: string
  readonly clusterId: string | null
  turns: ConversationTurn[]
  readonly created_at: string
  updated_at: string
}
