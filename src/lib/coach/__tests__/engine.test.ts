import { describe, it, expect } from 'vitest'
import { CoachEngine } from '../engine'
import { emptyCoachMemory } from '../types'
import type { CoachRecommendation, CoachMemory } from '../types'

function makeRec(overrides: Partial<CoachRecommendation> = {}): CoachRecommendation {
  return {
    recommendation_id: 'assessment:completed:weight:test-1',
    cluster:           'weight',
    phase:             'planning',
    decision:          { trigger: 'assessment:completed', reason: 'good_score' },
    type:              'insight',
    priority:          'normal',
    template_id:       'good_score',
    data:              { score: 72 },
    coach_version:     '1.2',
    generated_at:      new Date().toISOString(),
    ...overrides,
  }
}

describe('CoachEngine.canShow', () => {
  const engine = new CoachEngine()

  it('allows message with empty memory', () => {
    const rec    = makeRec()
    const memory = emptyCoachMemory('weight')
    expect(engine.canShow(rec, memory)).toBe(true)
  })

  it('blocks already-shown message', () => {
    const rec    = makeRec()
    const memory: CoachMemory = {
      ...emptyCoachMemory('weight'),
      shown_message_ids: [rec.recommendation_id],
    }
    expect(engine.canShow(rec, memory)).toBe(false)
  })

  it('blocks message within 24h cooldown', () => {
    const rec    = makeRec()
    const memory: CoachMemory = {
      ...emptyCoachMemory('weight'),
      last_shown_at: {
        ...emptyCoachMemory('weight').last_shown_at,
        insight: new Date().toISOString(),   // just now
      },
    }
    expect(engine.canShow(rec, memory)).toBe(false)
  })

  it('allows message after 24h cooldown', () => {
    const rec    = makeRec()
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const memory: CoachMemory = {
      ...emptyCoachMemory('weight'),
      last_shown_at: {
        ...emptyCoachMemory('weight').last_shown_at,
        insight: yesterday,
      },
    }
    expect(engine.canShow(rec, memory)).toBe(true)
  })

  it('always allows celebration type (no cooldown)', () => {
    const rec    = makeRec({ type: 'celebration', priority: 'high', template_id: 'excellent_score', decision: { trigger: 'assessment:completed', reason: 'excellent_score' } })
    const memory: CoachMemory = {
      ...emptyCoachMemory('weight'),
      last_shown_at: {
        ...emptyCoachMemory('weight').last_shown_at,
        celebration: new Date().toISOString(),
      },
    }
    expect(engine.canShow(rec, memory)).toBe(true)
  })
})
