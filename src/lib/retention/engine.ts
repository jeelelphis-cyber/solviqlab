import type { StorageProvider } from '../user/storage'
import type { SolviqUser } from '../user/types'
import type { RetentionMemory, RetentionRule, RetentionSuggestion } from './types'
import type { DormancyDetector } from './detector'
import type { ReminderPolicy } from './policy'
import { getRetentionTemplate } from './i18n'

const STORAGE_KEY = 'retention:memory'
const MS_PER_DAY  = 1000 * 60 * 60 * 24

export class RetentionEngine {
  constructor(
    private readonly detector: DormancyDetector,
    private readonly policy: ReminderPolicy,
    private readonly storage: StorageProvider,
  ) {}

  // Pure read — no side effects. Call markFired() after displaying.
  evaluate(user: SolviqUser, lang: string): RetentionSuggestion | null {
    const days = this.detector.getDaysSinceLastActive(user)
    const rule = this.policy.getActiveRule(days, user.type)
    if (!rule) return null
    if (!this.canFire(rule)) return null

    const template = getRetentionTemplate(rule.id, lang)
    if (!template) return null

    return {
      ruleId:      rule.id,
      action:      rule.action,
      title:       template.title,
      body:        template.body,
      cta:         template.cta,
      urgency:     rule.priority,
      generatedAt: new Date().toISOString(),
    }
  }

  // Call in useEffect after the suggestion has been displayed.
  markFired(ruleId: string): void {
    const memory  = this.getMemory()
    const updated: RetentionMemory = {
      rule_history:  [...memory.rule_history, { ruleId, firedAt: new Date().toISOString() }],
      last_check_at: new Date().toISOString(),
    }
    this.storage.set(STORAGE_KEY, updated)
  }

  getMemory(): RetentionMemory {
    return this.storage.get<RetentionMemory>(STORAGE_KEY) ?? {
      rule_history:  [],
      last_check_at: null,
    }
  }

  private canFire(rule: RetentionRule): boolean {
    const memory    = this.getMemory()
    const lastFired = memory.rule_history
      .filter(r => r.ruleId === rule.id)
      .sort((a, b) => b.firedAt.localeCompare(a.firedAt))[0]

    if (!lastFired) return true

    const daysSinceFired = Math.floor((Date.now() - new Date(lastFired.firedAt).getTime()) / MS_PER_DAY)
    return daysSinceFired >= rule.cooldownDays
  }
}
