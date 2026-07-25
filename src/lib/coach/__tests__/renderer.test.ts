import { describe, it, expect } from 'vitest'
import { TextRenderer } from '../renderer'
import type { CoachRecommendation } from '../types'

function makeRec(overrides: Partial<CoachRecommendation> = {}): CoachRecommendation {
  return {
    recommendation_id: 'assessment:completed:weight:test-1',
    cluster:           'weight',
    phase:             'planning',
    decision:          { trigger: 'assessment:completed', reason: 'good_score' },
    type:              'insight',
    priority:          'normal',
    template_id:       'good_score',
    data: {
      score:         72,
      dimension:     'Activity',
      cluster_label: 'Weight',
    },
    coach_version:     '1.2',
    generated_at:      new Date().toISOString(),
    ...overrides,
  }
}

describe('TextRenderer.render', () => {
  const renderer = new TextRenderer()

  it('interpolates score into body', () => {
    const msg = renderer.render(makeRec())
    expect(msg).not.toBeNull()
    expect(msg!.body).toContain('72')
  })

  it('interpolates dimension into body', () => {
    const msg = renderer.render(makeRec())
    expect(msg!.body).toContain('Activity')
  })

  it('returns null for unknown template_id', () => {
    const rec = makeRec({ template_id: 'no_context' as never })
    const msg = renderer.render(rec)
    expect(msg).toBeNull()
  })

  it('copies decision from recommendation', () => {
    const msg = renderer.render(makeRec())
    expect(msg!.decision.trigger).toBe('assessment:completed')
    expect(msg!.decision.reason).toBe('good_score')
  })

  it('returns actionId (not href) in actions', () => {
    const msg = renderer.render(makeRec())
    expect(msg!.actions[0]?.actionId).toBe('see_strategy')
    expect((msg!.actions[0] as Record<string, unknown>).href).toBeUndefined()
  })

  it('renders excellent_score template', () => {
    const rec = makeRec({
      template_id: 'excellent_score',
      decision: { trigger: 'assessment:completed', reason: 'excellent_score' },
      data: { score: 85, cluster_label: 'Weight' },
    })
    const msg = renderer.render(rec)
    expect(msg!.title).toContain('Strong foundation')
    expect(msg!.body).toContain('85')
    expect(msg!.actions[0]?.actionId).toBe('see_plan')
  })

  it('renders low_score template', () => {
    const rec = makeRec({
      template_id: 'low_score',
      decision: { trigger: 'assessment:completed', reason: 'low_score' },
      data: { score: 38, cluster_label: 'Weight' },
    })
    const msg = renderer.render(rec)
    expect(msg!.title).toContain('Clear starting point')
    expect(msg!.body).toContain('38')
  })
})
