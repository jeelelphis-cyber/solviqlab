export interface LLMChunk {
  readonly delta: string
  readonly done: boolean
}

export interface StreamOptions {
  readonly signal?: AbortSignal
  readonly maxTokens?: number
  readonly temperature?: number
}
