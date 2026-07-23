// ─────────────────────────────────────────────────────────────────────────────
// User Engine — Public API
//
// Import from here. Never import from individual files directly.
//
// Client usage:
//   import { getEngine, RESULT_CAPTURE_EVENT } from '@/lib/user'
//   const engine = getEngine()
//   const user = engine?.getOrCreateUser()
//
// Server usage (SSR/SSG):
//   getEngine() returns null — all reads return null safely.
// ─────────────────────────────────────────────────────────────────────────────

export type {
  AnonymousUser,
  AuthenticatedUser,
  SolviqUser,
  ResultRecord,
  JourneyState,
  UserId,
  Timestamp,
  RegistrationTriggerReason,
  RegistrationTriggerResult,
  MergeContract,
} from './types'

export type { StorageProvider } from './storage'
export { LocalStorageProvider, MemoryProvider } from './storage'

export type {
  UserEvent,
  ResultCaptureDetail,
} from './events'
export { RESULT_CAPTURE_EVENT, emitUserEvent, makeEvent } from './events'

export { UserEngine } from './engine'
export { checkRegistrationTrigger, ANONYMOUS_RESULT_LIMIT } from './registration-trigger'

// ── Singleton ─────────────────────────────────────────────────────────────────

import { UserEngine } from './engine'
import { createStorageProvider } from './storage'
import { ProfileEngine } from '../profile/engine'

let _engine: UserEngine | null = null
let _profileEngine: ProfileEngine | null = null

/**
 * Returns the UserEngine singleton (with ProfileEngine wired in).
 * Returns null on the server (SSR/SSG) — guard all callers.
 */
export function getEngine(): UserEngine | null {
  if (typeof window === 'undefined') return null
  if (!_engine) {
    const storage = createStorageProvider()
    if (!_profileEngine) _profileEngine = new ProfileEngine(storage)
    _engine = new UserEngine(storage, _profileEngine)
  }
  return _engine
}

/**
 * Returns the ProfileEngine singleton directly.
 * Use when you only need profile data, not user identity.
 */
export function getProfileEngineFromUser(): ProfileEngine | null {
  if (typeof window === 'undefined') return null
  getEngine()  // ensures _profileEngine is initialized
  return _profileEngine
}

/**
 * Reset the singleton (testing only).
 */
export function _resetEngineForTest(): void {
  _engine = null
}
