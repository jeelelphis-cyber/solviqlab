import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RetentionAnalytics } from '../analytics'
import type { RetentionSuggestion } from '../types'

function makeSuggestion(): RetentionSuggestion {
  return {
    ruleId: 'coach_reminder_7d',
    action: 'coach_reminder',
    title: "How's your journey going?",
    body: 'Your Coach has insights.',
    cta: 'See Coach Insights',
    urgency: 'low',
    generatedAt: new Date().toISOString(),
  }
}

describe('RetentionAnalytics', () => {
  const analytics = new RetentionAnalytics()
  const gtagMock  = vi.fn()

  beforeEach(() => {
    gtagMock.mockClear()
    // @ts-expect-error — node env, fake window
    globalThis.window = { gtag: gtagMock }
  })

  it('trackRuleFired fires retention_rule_fired event', () => {
    analytics.trackRuleFired('coach_reminder_7d', 'coach_reminder')
    expect(gtagMock).toHaveBeenCalledWith('event', 'retention_rule_fired', expect.objectContaining({
      rule_id: 'coach_reminder_7d',
      action:  'coach_reminder',
    }))
  })

  it('trackReminderShown fires retention_reminder_shown event', () => {
    analytics.trackReminderShown(makeSuggestion())
    expect(gtagMock).toHaveBeenCalledWith('event', 'retention_reminder_shown', expect.objectContaining({
      rule_id: 'coach_reminder_7d',
      action:  'coach_reminder',
      urgency: 'low',
    }))
  })

  it('trackReminderClicked fires retention_reminder_clicked event', () => {
    analytics.trackReminderClicked(makeSuggestion())
    expect(gtagMock).toHaveBeenCalledWith('event', 'retention_reminder_clicked', expect.objectContaining({
      rule_id: 'coach_reminder_7d',
    }))
  })

  it('trackReminderDismissed fires retention_reminder_dismissed event', () => {
    analytics.trackReminderDismissed(makeSuggestion())
    expect(gtagMock).toHaveBeenCalledWith('event', 'retention_reminder_dismissed', expect.objectContaining({
      rule_id: 'coach_reminder_7d',
    }))
  })

  it('does not throw when gtag is undefined', () => {
    // @ts-expect-error
    globalThis.window = {}
    expect(() => analytics.trackRuleFired('x', 'coach_reminder')).not.toThrow()
    expect(() => analytics.trackReminderShown(makeSuggestion())).not.toThrow()
    expect(() => analytics.trackReminderClicked(makeSuggestion())).not.toThrow()
    expect(() => analytics.trackReminderDismissed(makeSuggestion())).not.toThrow()
  })
})
