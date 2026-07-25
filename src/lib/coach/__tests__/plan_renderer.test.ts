import { describe, it, expect } from 'vitest'
import { TextRenderer } from '../renderer'
import type { CoachRecommendation } from '../types'

function makePlanRec(reason: CoachRecommendation['decision']['reason'], dataOverrides = {}): CoachRecommendation {
  return {
    recommendation_id: `plan:created:weight:plan-test-1`,
    cluster:           'weight',
    phase:             'execution',
    decision:          { trigger: 'plan:created', reason },
    type:              'preparation',
    priority:          'normal',
    template_id:       reason,
    data: {
      strategy:       'Balanced Approach',
      goal:           'Lose 8kg by March 2027',
      goal_value:     72,
      current_value:  80,
      duration_weeks: 18,
      cluster_label:  'Weight',
      ...dataOverrides,
    },
    coach_version:     '1.2',
    generated_at:      new Date().toISOString(),
  }
}

describe('TextRenderer — plan:created templates', () => {
  const renderer = new TextRenderer()

  it('renders strategy_match with strategy name and duration', () => {
    const msg = renderer.render(makePlanRec('strategy_match'))
    expect(msg).not.toBeNull()
    expect(msg!.body).toContain('Balanced Approach')
    expect(msg!.body).toContain('18')
    expect(msg!.actions[0]?.actionId).toBe('see_plan')
  })

  it('renders first_plan with cluster_label and goal', () => {
    const msg = renderer.render(makePlanRec('first_plan'))
    expect(msg!.title).toContain('Weight')
    expect(msg!.body).toContain('Lose 8kg by March 2027')
    expect(msg!.actions[0]?.actionId).toBe('see_plan')
  })

  it('renders high_confidence_plan with duration', () => {
    const msg = renderer.render(makePlanRec('high_confidence_plan'))
    expect(msg!.body).toContain('18')
    expect(msg!.type).toBe('preparation')
  })

  it('renders conservative_start with duration', () => {
    const msg = renderer.render(makePlanRec('conservative_start'))
    expect(msg!.title).toContain('pace you can sustain')
    expect(msg!.body).toContain('18')
  })

  it('renders aggressive_start with duration', () => {
    const msg = renderer.render(makePlanRec('aggressive_start'))
    expect(msg!.title).toContain('ambitious goal')
    expect(msg!.body).toContain('18')
  })

  it('all plan templates have see_plan action', () => {
    const reasons = ['strategy_match', 'first_plan', 'high_confidence_plan', 'conservative_start', 'aggressive_start'] as const
    for (const reason of reasons) {
      const msg = renderer.render(makePlanRec(reason))
      expect(msg!.actions[0]?.actionId).toBe('see_plan')
    }
  })
})
