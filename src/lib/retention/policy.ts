import type { RetentionRule } from './types'

// Default escalation sequence.
// Rules are evaluated highest-threshold-first — the most specific match wins.
const DEFAULT_RULES: readonly RetentionRule[] = [
  {
    id:           'registration_nudge_30d',
    name:         'Registration Nudge (30 days)',
    daysInactive: 30,
    action:       'registration_nudge',
    priority:     'high',
    cooldownDays: 30,
    requiresAnonymous: true,
  },
  {
    id:           'premium_nudge_30d',
    name:         'Premium Nudge (30 days)',
    daysInactive: 30,
    action:       'premium_nudge',
    priority:     'high',
    cooldownDays: 30,
    requiresAuthenticated: true,
  },
  {
    id:           'recommendation_21d',
    name:         'Recommendation (21 days)',
    daysInactive: 21,
    action:       'recommendation',
    priority:     'medium',
    cooldownDays: 21,
  },
  {
    id:           'journey_reminder_14d',
    name:         'Journey Reminder (14 days)',
    daysInactive: 14,
    action:       'journey_reminder',
    priority:     'medium',
    cooldownDays: 14,
  },
  {
    id:           'coach_reminder_7d',
    name:         'Coach Reminder (7 days)',
    daysInactive: 7,
    action:       'coach_reminder',
    priority:     'low',
    cooldownDays: 14,
  },
]

export class ReminderPolicy {
  constructor(private readonly rules: readonly RetentionRule[] = DEFAULT_RULES) {}

  getRules(): readonly RetentionRule[] {
    return this.rules
  }

  // Returns highest-threshold rule that matches days + user type.
  // Higher threshold = more specific and more urgent.
  getActiveRule(days: number, userType: 'anonymous' | 'authenticated'): RetentionRule | null {
    const candidates = this.rules
      .filter(r => r.daysInactive <= days)
      .filter(r => !r.requiresAnonymous      || userType === 'anonymous')
      .filter(r => !r.requiresAuthenticated  || userType === 'authenticated')
      .sort((a, b) => b.daysInactive - a.daysInactive)

    return candidates[0] ?? null
  }
}

export const reminderPolicy = new ReminderPolicy()
