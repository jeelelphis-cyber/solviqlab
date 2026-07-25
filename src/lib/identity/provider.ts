// ─────────────────────────────────────────────────────────────────────────────
// IdentityProvider — abstraction over auth mechanisms.
//
// Phase 1: LocalIdentityProvider (device-only, no network).
// Phase 2+: GoogleIdentityProvider, AppleIdentityProvider, etc.
//   Each implements this interface — IdentityService never changes.
// ─────────────────────────────────────────────────────────────────────────────

import type { SolviqUser, AuthenticatedUser } from '../user/types'
import type { UserEngine } from '../user/engine'
import type { UpgradeCredentials } from './types'

export interface IdentityProvider {
  getOrCreateUser(): SolviqUser
  getUser(): SolviqUser | null
  upgrade(credentials: UpgradeCredentials): AuthenticatedUser
  isAuthenticated(): boolean
}

export class LocalIdentityProvider implements IdentityProvider {
  constructor(private readonly userEngine: UserEngine) {}

  getOrCreateUser(): SolviqUser {
    return this.userEngine.getOrCreateUser()
  }

  getUser(): SolviqUser | null {
    return this.userEngine.getUser()
  }

  upgrade(credentials: UpgradeCredentials): AuthenticatedUser {
    return this.userEngine.upgradeToAuthenticated(credentials)
  }

  isAuthenticated(): boolean {
    return this.userEngine.isAuthenticated()
  }
}
