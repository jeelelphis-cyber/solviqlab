import type { ConversationMemory } from './conversation-memory'
import type { LLMResponse } from './types'
import type { LLMChunk, StreamOptions } from './streaming'
import type { PromptPipeline } from './pipeline/prompt-pipeline'
import type { RetryExecutor } from './pipeline/retry-executor'
import type { ResponseValidator } from './pipeline/response-validator'
import type { MetricsCollector } from './pipeline/metrics-collector'
import { createTrace, elapsedMs } from './trace'

export class LLMCoachService {
  constructor(
    private readonly promptPipeline: PromptPipeline,
    private readonly executor:       RetryExecutor,
    private readonly validator:      ResponseValidator,
    private readonly memory:         ConversationMemory,
    private readonly metrics:        MetricsCollector,
  ) {}

  get observability() {
    return this.metrics.observability
  }

  startConversation(clusterId?: string): string {
    return this.memory.startConversation(clusterId).id
  }

  async ask(
    userMessage: string,
    conversationId: string,
    lang: string,
    clusterId?: string,
  ): Promise<LLMResponse | null> {
    const inputCheck = this.validator.checkInput(userMessage)
    if (!inputCheck.passed) {
      this.metrics.trackSafetyBlock('input', conversationId)
      return null
    }

    const trace = createTrace()
    this.metrics.trackRequest(conversationId, this.executor.getModelId())

    try {
      const messages = this.promptPipeline.build(
        userMessage, lang, this.memory.getHistory(conversationId), clusterId,
      )

      const response = await this.metrics.executeComplete(
        trace.traceId, conversationId, this.executor.getModelId(),
        () => this.executor.complete(messages),
      )

      const outputCheck = this.validator.checkOutput(response.content)
      if (!outputCheck.passed) {
        this.metrics.trackSafetyBlock('output', conversationId)
        return null
      }

      this.memory.addTurn(conversationId, 'user', userMessage)
      this.memory.addTurn(conversationId, 'assistant', response.content)
      this.metrics.trackResponse(response, conversationId)

      return response
    } catch (err) {
      this.metrics.trackError(err instanceof Error ? err.message : 'Unknown error', conversationId)
      return null
    }
  }

  async * askStream(
    userMessage: string,
    conversationId: string,
    lang: string,
    clusterId?: string,
    options?: StreamOptions,
  ): AsyncGenerator<LLMChunk> {
    const inputCheck = this.validator.checkInput(userMessage)
    if (!inputCheck.passed) {
      this.metrics.trackSafetyBlock('input', conversationId)
      return
    }

    const trace = createTrace()
    this.metrics.trackRequest(conversationId, this.executor.getModelId())

    try {
      const messages    = this.promptPipeline.build(
        userMessage, lang, this.memory.getHistory(conversationId), clusterId,
      )
      let   fullContent = ''

      for await (const chunk of this.executor.stream(messages, options)) {
        if (!chunk.done) {
          fullContent += chunk.delta
          yield chunk
        }
      }

      this.metrics.recordStream(
        conversationId, this.executor.getModelId(), elapsedMs(trace), true, null, trace.traceId,
      )

      const outputCheck = this.validator.checkOutput(fullContent)
      if (!outputCheck.passed) {
        this.metrics.trackSafetyBlock('output', conversationId)
        return
      }

      this.memory.addTurn(conversationId, 'user', userMessage)
      this.memory.addTurn(conversationId, 'assistant', fullContent)
      this.metrics.trackResponse(
        { content: fullContent, model: this.executor.getModelId(), tokens_used: null, finish_reason: 'stop' },
        conversationId,
      )

      yield { delta: '', done: true }
    } catch (err) {
      const code = (err as any)?.code ?? 'unknown'
      this.metrics.trackError(err instanceof Error ? err.message : 'Unknown error', conversationId)
      this.metrics.recordStream(
        conversationId, this.executor.getModelId(), elapsedMs(trace), false, code, trace.traceId,
      )
    }
  }

  getHistory(conversationId: string, maxTurns?: number) {
    return this.memory.getHistory(conversationId, maxTurns)
  }

  listConversations() {
    return this.memory.listConversations()
  }

  clearConversation(conversationId: string): void {
    this.memory.clear(conversationId)
  }
}
