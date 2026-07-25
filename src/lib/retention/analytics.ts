import type { RetentionActionType, RetentionSuggestion } from './types'

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

export class RetentionAnalytics {
  trackRuleFired(ruleId: string, action: RetentionActionType): void {
    try {
      window.gtag?.('event', 'retention_rule_fired', { rule_id: ruleId, action })
    } catch {}
  }

  trackReminderShown(suggestion: RetentionSuggestion): void {
    try {
      window.gtag?.('event', 'retention_reminder_shown', {
        rule_id: suggestion.ruleId,
        action:  suggestion.action,
        urgency: suggestion.urgency,
      })
    } catch {}
  }

  trackReminderClicked(suggestion: RetentionSuggestion): void {
    try {
      window.gtag?.('event', 'retention_reminder_clicked', {
        rule_id: suggestion.ruleId,
        action:  suggestion.action,
      })
    } catch {}
  }

  trackReminderDismissed(suggestion: RetentionSuggestion): void {
    try {
      window.gtag?.('event', 'retention_reminder_dismissed', {
        rule_id: suggestion.ruleId,
        action:  suggestion.action,
      })
    } catch {}
  }
}

export const retentionAnalytics = new RetentionAnalytics()
