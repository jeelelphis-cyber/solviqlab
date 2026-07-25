import type { AuthenticatedUser, AnonymousUser } from '../user/types'
import { checkRegistrationTrigger } from '../user/registration-trigger'
import { emitUserEvent, makeEvent } from '../user/events'
import { getRegistrationMessage } from './i18n'
import type { IdentityProvider } from './provider'
import type { IdentitySnapshot, RegistrationSuggestion, UpgradeCredentials } from './types'

export class IdentityService {
  constructor(private readonly provider: IdentityProvider) {}

  // Call once on runtime startup — ensures anonymous user exists.
  init(): void {
    this.provider.getOrCreateUser()
  }

  getSnapshot(): IdentitySnapshot {
    const user = this.provider.getUser()
    if (!user) {
      return { userId: '', type: 'anonymous', resultCount: 0, journeyCount: 0 }
    }
    return {
      userId:       user.id,
      type:         user.type,
      resultCount:  user.result_history.length,
      journeyCount: user.journey_states.length,
    }
  }

  isAuthenticated(): boolean {
    return this.provider.isAuthenticated()
  }

  // Pure read — no side effects. Use markSuggestionShown() after displaying.
  getSuggestion(lang: string): RegistrationSuggestion {
    const user = this.provider.getUser()
    if (!user || user.type === 'authenticated') {
      return { shouldSuggest: false, reason: null, message: null, urgency: 'low' }
    }
    const result = checkRegistrationTrigger(user as AnonymousUser)
    if (!result.shouldSuggest || !result.reason) {
      return { shouldSuggest: false, reason: null, message: null, urgency: 'low' }
    }
    return {
      shouldSuggest: true,
      reason:        result.reason,
      message:       getRegistrationMessage(result.reason, lang),
      urgency:       result.urgency,
    }
  }

  // Call in useEffect after the suggestion UI has mounted.
  markSuggestionShown(suggestion: RegistrationSuggestion): void {
    if (!suggestion.shouldSuggest || !suggestion.reason) return
    const user = this.provider.getUser()
    if (!user) return
    const maxProgress = Math.max(0, ...user.journey_states.map(j => j.progress_percent))
    emitUserEvent(makeEvent('RegistrationSuggested', {
      user_id:          user.id,
      trigger:          suggestion.reason,
      journey_progress: maxProgress,
      completed_count:  user.completed_slugs.length,
    }))
  }

  upgrade(credentials: UpgradeCredentials): AuthenticatedUser {
    return this.provider.upgrade(credentials)
  }
}
