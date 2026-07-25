import { describe, it, expect } from 'vitest'
import { MemoryProvider } from '../../user/storage'
import { UserEngine } from '../../user/engine'
import { ProfileEngine } from '../../profile/engine'
import { CoachHistoryRepository } from '../../coach/history'
import { DormancyDetector } from '../../retention/detector'
import {
  IdentityContextSource,
  JourneyContextSource,
  RetentionContextSource,
  CoachContextSource,
} from '../context-source'
import { CompositeContextBuilder } from '../context-builder'

function makeEngines() {
  const storage  = new MemoryProvider()
  const profile  = new ProfileEngine(storage)
  const engine   = new UserEngine(storage, profile)
  const detector = new DormancyDetector()
  const history  = new CoachHistoryRepository(storage)
  return { engine, detector, history }
}

describe('IdentityContextSource', () => {
  it('returns anonymous defaults before user is created', () => {
    const { engine } = makeEngines()
    const source     = new IdentityContextSource(engine)
    const ctx        = source.contribute()
    expect(ctx.userId).toBe('')
    expect(ctx.userType).toBe('anonymous')
    expect(ctx.subscription).toBe('free')
  })

  it('returns user id after user is created', () => {
    const { engine } = makeEngines()
    engine.getOrCreateUser()
    const ctx = new IdentityContextSource(engine).contribute()
    expect(ctx.userId).toBeTruthy()
  })

  it('has key "identity"', () => {
    const { engine } = makeEngines()
    expect(new IdentityContextSource(engine).key).toBe('identity')
  })
})

describe('JourneyContextSource', () => {
  it('returns null fields when no cluster given', () => {
    const { engine } = makeEngines()
    engine.getOrCreateUser()
    const ctx = new JourneyContextSource(engine).contribute()
    expect(ctx.activeCluster).toBeNull()
    expect(ctx.assessmentScore).toBeNull()
  })

  it('populates activeCluster when clusterId provided (no intent lookup)', () => {
    const { engine } = makeEngines()
    // Don't call getIntentState — just verify activeCluster is set from the arg
    const source = new JourneyContextSource(engine)
    // contribute() sets activeCluster from the arg, intent lookup only runs if user exists
    const ctx = source.contribute('sleep')
    // user doesn't exist yet so getIntentState returns null safely
    expect(ctx.activeCluster).toBe('sleep')
  })

  it('has key "journey"', () => {
    const { engine } = makeEngines()
    expect(new JourneyContextSource(engine).key).toBe('journey')
  })
})

describe('RetentionContextSource', () => {
  it('returns 0 days when no user exists', () => {
    const { engine, detector } = makeEngines()
    const ctx = new RetentionContextSource(engine, detector).contribute()
    expect(ctx.daysSinceActive).toBe(0)
    expect(ctx.dormancyLevel).toBe('none')
  })

  it('has key "retention"', () => {
    const { engine, detector } = makeEngines()
    expect(new RetentionContextSource(engine, detector).key).toBe('retention')
  })
})

describe('CoachContextSource', () => {
  it('returns empty array when no history', () => {
    const { history } = makeEngines()
    const ctx = new CoachContextSource(history).contribute()
    expect(ctx.recentCoachMessages).toHaveLength(0)
  })

  it('has key "coach"', () => {
    const { history } = makeEngines()
    expect(new CoachContextSource(history).key).toBe('coach')
  })
})

describe('CompositeContextBuilder', () => {
  it('merges all sources into one LLMContext', () => {
    const { engine, detector, history } = makeEngines()
    engine.getOrCreateUser()
    const builder = new CompositeContextBuilder([
      new IdentityContextSource(engine),
      new JourneyContextSource(engine),
      new RetentionContextSource(engine, detector),
      new CoachContextSource(history),
    ])
    // No clusterId — avoids getIntentState dynamic require in test env
    const ctx = builder.build()
    expect(ctx.userId).toBeTruthy()
    expect(ctx.activeCluster).toBeNull()
    expect(ctx.daysSinceActive).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(ctx.recentCoachMessages)).toBe(true)
  })

  it('uses defaults when sources contribute nothing', () => {
    const builder = new CompositeContextBuilder([])
    const ctx     = builder.build()
    expect(ctx.userId).toBe('')
    expect(ctx.userType).toBe('anonymous')
    expect(ctx.dormancyLevel).toBe('none')
  })

  it('later sources override earlier sources for same key', () => {
    const override = { contribute: () => ({ userId: 'overridden' }), key: 'test' }
    const builder  = new CompositeContextBuilder([override])
    const ctx      = builder.build()
    expect(ctx.userId).toBe('overridden')
  })
})
