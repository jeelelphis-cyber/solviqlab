import { describe, it, expect } from 'vitest'
import { CostEstimator } from '../cost-estimator'

describe('CostEstimator', () => {
  const est = new CostEstimator()

  it('returns zero cost for mock-v1', () => {
    expect(est.estimateOutput('mock-v1', 1000)).toBe(0)
    expect(est.estimateInput('mock-v1', 1000)).toBe(0)
  })

  it('estimates claude-haiku output tokens', () => {
    // 1M tokens = $1.25 → 1000 tokens = $0.00125
    expect(est.estimateOutput('claude-haiku-4-5-20251001', 1_000_000)).toBeCloseTo(1.25)
    expect(est.estimateOutput('claude-haiku-4-5-20251001', 1000)).toBeCloseTo(0.00125)
  })

  it('estimates claude-haiku input tokens', () => {
    // 1M tokens = $0.25 → 1000 tokens = $0.00025
    expect(est.estimateInput('claude-haiku-4-5-20251001', 1000)).toBeCloseTo(0.00025)
  })

  it('estimateTotal sums input + output', () => {
    const total    = est.estimateTotal('claude-haiku-4-5-20251001', 1000, 1000)
    const expected = est.estimateInput('claude-haiku-4-5-20251001', 1000) +
                     est.estimateOutput('claude-haiku-4-5-20251001', 1000)
    expect(total).toBeCloseTo(expected)
  })

  it('returns 0 for unknown model (safe default)', () => {
    expect(est.estimateOutput('unknown-model-xyz', 10000)).toBe(0)
  })

  it('isKnownModel() returns true for known models', () => {
    expect(est.isKnownModel('claude-haiku-4-5-20251001')).toBe(true)
    expect(est.isKnownModel('gpt-4o-mini')).toBe(true)
    expect(est.isKnownModel('mock-v1')).toBe(true)
  })

  it('isKnownModel() returns false for unknown models', () => {
    expect(est.isKnownModel('llama-99')).toBe(false)
  })

  it('listModels() includes all defaults', () => {
    const models = est.listModels()
    expect(models).toContain('claude-haiku-4-5-20251001')
    expect(models).toContain('gpt-4o-mini')
    expect(models).toContain('mock-v1')
  })

  it('accepts price overrides at construction', () => {
    const custom = new CostEstimator({ 'my-model': { inputPer1M: 1.0, outputPer1M: 2.0 } })
    expect(custom.estimateOutput('my-model', 1_000_000)).toBeCloseTo(2.0)
    expect(custom.isKnownModel('my-model')).toBe(true)
  })

  it('overrides do not remove default models', () => {
    const custom = new CostEstimator({ 'new-model': { inputPer1M: 0, outputPer1M: 0 } })
    expect(custom.isKnownModel('claude-haiku-4-5-20251001')).toBe(true)
  })
})
