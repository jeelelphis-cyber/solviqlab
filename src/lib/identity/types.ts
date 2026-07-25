import type { RegistrationTriggerReason } from '../user/types'

export type { RegistrationTriggerReason }

export interface IdentitySnapshot {
  readonly userId: string
  readonly type: 'anonymous' | 'authenticated'
  readonly resultCount: number
  readonly journeyCount: number
}

export interface RegistrationSuggestion {
  readonly shouldSuggest: boolean
  readonly reason: RegistrationTriggerReason | null
  readonly message: string | null
  readonly urgency: 'low' | 'medium' | 'high'
}

export interface UpgradeCredentials {
  readonly id?: string
  readonly email: string
  readonly display_name: string | null
  readonly auth_provider: 'google' | 'email' | 'apple' | 'github'
}
