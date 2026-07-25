import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CoachAnalytics } from '../analytics'
import type { CoachMessage } from '../types'

function makeMessage(): CoachMessage {
  return {
    message_id:    'plan:created:weight:plan-1',
    cluster:       'weight',
    phase:         'execution',
    decision:      { trigger: 'plan:created', reason: 'strategy_match' },
    type:          'preparation',
    priority:      'normal',
    title:         'Your plan matches your assessment.',
    body:          'Balanced Approach was selected because your data pointed directly to it.',
    actions:       [{ label: 'See My Plan', actionId: 'see_plan', type: 'primary' }],
    generated_at:  new Date().toISOString(),
    data_snapshot: { strategy: 'Balanced Approach', duration_weeks: 18 },
  }
}

describe('CoachAnalytics', () => {
  const analytics = new CoachAnalytics()
  const gtagMock  = vi.fn()

  beforeEach(() => {
    gtagMock.mockClear()
    // @ts-expect-error — jsdom window
    globalThis.window = { gtag: gtagMock }
  })

  it('trackShown fires coach_message_shown event', () => {
    analytics.trackShown(makeMessage())
    expect(gtagMock).toHaveBeenCalledWith('event', 'coach_message_shown', expect.objectContaining({
      message_id: 'plan:created:weight:plan-1',
      trigger:    'plan:created',
      reason:     'strategy_match',
    }))
  })

  it('trackCTA fires coach_cta_click event with action_id', () => {
    analytics.trackCTA(makeMessage(), 'see_plan')
    expect(gtagMock).toHaveBeenCalledWith('event', 'coach_cta_click', expect.objectContaining({
      message_id: 'plan:created:weight:plan-1',
      action_id:  'see_plan',
    }))
  })

  it('does not throw when gtag is not defined', () => {
    // @ts-expect-error
    globalThis.window = {}
    expect(() => analytics.trackShown(makeMessage())).not.toThrow()
    expect(() => analytics.trackCTA(makeMessage(), 'see_plan')).not.toThrow()
  })
})
