import type { SolviqUser } from '../user/types'
import type { DormancyLevel } from './types'

export class DormancyDetector {
  getDaysSinceLastActive(user: SolviqUser): number {
    const lastActive = new Date(user.last_active_at).getTime()
    const elapsed    = Date.now() - lastActive
    return Math.floor(elapsed / (1000 * 60 * 60 * 24))
  }

  getDormancyLevel(days: number): DormancyLevel {
    if (days < 7)  return 'none'
    if (days < 14) return 'mild'
    if (days < 21) return 'moderate'
    if (days < 30) return 'severe'
    return 'critical'
  }

  isDormant(user: SolviqUser, thresholdDays: number): boolean {
    return this.getDaysSinceLastActive(user) >= thresholdDays
  }
}

export const dormancyDetector = new DormancyDetector()
