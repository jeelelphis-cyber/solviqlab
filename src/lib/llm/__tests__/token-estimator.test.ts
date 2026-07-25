import { describe, it, expect } from 'vitest'
import { CharBasedEstimator, TiktokenEstimator } from '../token-estimator'
import { ContextWindowManager } from '../window-manager'
import type { LLMMessage } from '../types'

const msgs = (contents: string[]): LLMMessage[] =>
  contents.map(content => ({ role: 'user' as const, content }))

describe('CharBasedEstimator', () => {
  const est = new CharBasedEstimator()

  it('estimates 0 tokens for empty messages', () => {
    expect(est.estimate([])).toBe(0)
  })

  it('estimates tokens as ceil(chars / 4)', () => {
    expect(est.estimate(msgs(['hello']))).toBe(Math.ceil(5 / 4))
    expect(est.estimate(msgs(['abcd']))).toBe(1)
    expect(est.estimate(msgs(['a'.repeat(400)]))).toBe(100)
  })

  it('sums across multiple messages', () => {
    expect(est.estimate(msgs(['aaaa', 'aaaa']))).toBe(2)
  })

  it('estimateText works independently', () => {
    expect(est.estimateText('aaaaaaaa')).toBe(2)
  })

  it('default modelId is "default"', () => {
    expect(est.modelId).toBe('default')
  })

  it('accepts custom modelId', () => {
    expect(new CharBasedEstimator('gpt-4').modelId).toBe('gpt-4')
  })
})

describe('TiktokenEstimator (stub)', () => {
  it('delegates to CharBased until real tiktoken is bundled', () => {
    const est  = new TiktokenEstimator('claude-haiku-4-5-20251001')
    const base = new CharBasedEstimator()
    const msgs2 = msgs(['hello world'])
    expect(est.estimate(msgs2)).toBe(base.estimate(msgs2))
  })
})

describe('ContextWindowManager with TokenEstimator', () => {
  it('uses injected estimator', () => {
    const mgr = new ContextWindowManager({ maxTokens: 10, reservedForOutput: 0 }, new CharBasedEstimator())
    const messages: LLMMessage[] = [
      { role: 'system', content: 'x'.repeat(20) },
      { role: 'user',   content: 'y'.repeat(20) },
    ]
    // system = 5 tokens, user = 5 tokens, total = 10, budget = 10 → fits
    expect(mgr.fit(messages)).toHaveLength(2)
  })
})
