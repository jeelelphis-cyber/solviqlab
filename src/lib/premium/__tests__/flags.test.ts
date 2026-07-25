import { describe, it, expect } from 'vitest'
import { FeatureFlagEngine } from '../flags'

describe('FeatureFlagEngine', () => {
  const engine = new FeatureFlagEngine()

  it('free tier has no premium features by default', () => {
    expect(engine.getEnabledFeatures('free')).toHaveLength(0)
  })

  it('pro tier includes multi_cluster', () => {
    expect(engine.isEnabled('multi_cluster', 'pro')).toBe(true)
  })

  it('pro tier includes coach_advanced', () => {
    expect(engine.isEnabled('coach_advanced', 'pro')).toBe(true)
  })

  it('pro tier does not include ai_consultation', () => {
    expect(engine.isEnabled('ai_consultation', 'pro')).toBe(false)
  })

  it('enterprise tier includes all pro features', () => {
    const pro        = engine.getEnabledFeatures('pro')
    const enterprise = engine.getEnabledFeatures('enterprise')
    pro.forEach(f => expect(enterprise).toContain(f))
  })

  it('enterprise tier includes ai_consultation', () => {
    expect(engine.isEnabled('ai_consultation', 'enterprise')).toBe(true)
  })

  it('enterprise tier includes priority_support', () => {
    expect(engine.isEnabled('priority_support', 'enterprise')).toBe(true)
  })

  it('getRequiredTier() returns pro for multi_cluster', () => {
    expect(engine.getRequiredTier('multi_cluster')).toBe('pro')
  })

  it('getRequiredTier() returns enterprise for ai_consultation', () => {
    expect(engine.getRequiredTier('ai_consultation')).toBe('enterprise')
  })

  it('free tier does not have any feature enabled', () => {
    const features: Parameters<typeof engine.isEnabled>[0][] = [
      'multi_cluster', 'coach_advanced', 'coach_history_unlimited',
      'export_data', 'sync_multi_device', 'journey_insights',
      'ai_consultation', 'priority_support',
    ]
    features.forEach(f => expect(engine.isEnabled(f, 'free')).toBe(false))
  })

  it('supports custom config via constructor', () => {
    const custom = new FeatureFlagEngine({
      free:       ['multi_cluster'],
      pro:        ['multi_cluster', 'export_data'],
      enterprise: ['multi_cluster', 'export_data', 'ai_consultation'],
    })
    expect(custom.isEnabled('multi_cluster', 'free')).toBe(true)
    expect(custom.isEnabled('export_data', 'free')).toBe(false)
  })
})
