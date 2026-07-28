# ADR-008: Identity & Registration Architecture

**Status:** Accepted  
**Date:** 2026-07-24  
**Sprint:** 5 — Identity & Registration Foundation

---

## Context

SolviqLab needs a persistent user identity layer that:

- Works offline from first page load (no auth required to use the product)
- Never loses anonymous user data when they register
- Supports multiple OAuth providers in the future (Google, Apple, GitHub, Magic Link)
- Is replaceable at the sync layer without touching business logic
- Keeps localization out of trigger logic (Language Independent rule)

The existing `UserEngine` already handled anonymous user creation and `upgradeToAuthenticated()`. Sprint 5 introduces a proper abstraction layer so these concerns don't leak into every component.

---

## Decision

### Layer Stack

```
UI / Hooks
    ↓
IdentityService          — orchestration, no storage concerns
    ↓
IdentityProvider         — interface abstraction over auth mechanism
    ↓
LocalIdentityProvider    — Phase 1: device-only, wraps UserEngine
    ↓
UserEngine               — data persistence via StorageProvider
    ↓
LocalStorageProvider     — Phase 1 storage
```

### IdentityProvider Interface

`IdentityProvider` is the extension point for future OAuth providers. Every provider implements:

```ts
interface IdentityProvider {
  getOrCreateUser(): SolviqUser
  getUser(): SolviqUser | null
  upgrade(credentials: UpgradeCredentials): AuthenticatedUser
  isAuthenticated(): boolean
}
```

When Google OAuth is added (Phase 2), a `GoogleIdentityProvider` replaces `LocalIdentityProvider` in `platform.ts`. `IdentityService` and all consumers stay unchanged.

### Anonymous User Lifecycle

```
First visit
    ↓
getBrowserRuntime() → createPlatformRuntime()
    ↓
identity.init()
    ↓
UserEngine.getOrCreateUser()
    ↓  (if new)
createAnonymousUser() → localStorage → emits UserCreated
```

- Anonymous user is created automatically on first load.
- UUID is client-generated (no server required).
- User persists across sessions via `LocalStorageProvider`.
- SSR returns a fresh in-memory user (no-op, not persisted).

### Registration Trigger Logic

Five conditions (checked in priority order):

| Priority | Reason | Urgency | Condition |
|---|---|---|---|
| P0 | `result_history_limit` | high | result_history.length ≥ 8 |
| P1 | `ai_nearly_unlocked` | high | max ai_readiness ≥ 60% |
| P2 | `reward_unlock_pending` | medium | 1 step from reward |
| P3 | `journey_progress_35` | medium | max journey progress ≥ 35% |
| P4 | `three_instruments` | low | completed_slugs.length ≥ 3 |

**Rule:** Suggest registration only after the user has accumulated meaningful value. Never interrupt early in their journey.

### Localization Rule

`checkRegistrationTrigger()` (in `user/registration-trigger.ts`) returns only a `reason` and `urgency`. **It never produces UI strings.**

The message is resolved at display time:

```ts
// IdentityService.getSuggestion(lang)
const message = getRegistrationMessage(result.reason, lang)
```

`getRegistrationMessage()` (in `identity/i18n.ts`) merges locale overrides onto the EN base — same pattern as `getCoachCopy(lang)` in the Coach module.

### Upgrade Lifecycle (Anonymous → Authenticated)

```
User clicks "Create Account"
    ↓
IdentityService.upgrade(credentials)
    ↓
UserEngine.upgradeToAuthenticated()
    ↓
new AuthenticatedUser = { ...anonymousUser, email, auth_provider, ... }
    ↓  (storage.set replaces anonymous user with authenticated)
emits RegistrationCompleted
emits AnonymousMerged
```

**Invariants:**
- `result_history` is preserved (zero data loss).
- `journey_states` are preserved.
- `anonymous_id` is stored on the authenticated user for deduplication and audit.
- `subscription_tier` defaults to `'free'`.

### Merge Strategy

| Field | Resolution |
|---|---|
| `result_history` | All anonymous records transferred |
| `journey_states` | All anonymous states transferred |
| `completed_slugs` | All anonymous slugs transferred |
| `achievements` | All anonymous achievements transferred |
| `id` | New authenticated UUID (anonymous_id preserved as reference) |

Conflict resolution: `anonymous_wins` — the device is always the source of truth at registration time. The authenticated account may have existing records only in multi-device scenarios (Phase 3+).

### Analytics Side Effects

`IdentityService.getSuggestion(lang)` is **pure** (no side effects).  
`IdentityService.markSuggestionShown(suggestion)` fires `RegistrationSuggested` to GA4.

This mirrors the `CoachService.getMessage() / markShown()` pattern established in Sprint 4:

```
getMessage()  →  pure read
markShown()   →  side effects (memory + history + analytics)
```

---

## Future: OAuth Providers (Phase 2)

When Google OAuth is added:

1. Create `src/lib/identity/providers/google.ts`:
   ```ts
   export class GoogleIdentityProvider implements IdentityProvider {
     // handles Google OAuth token → UserEngine.upgradeToAuthenticated()
   }
   ```
2. In `platform.ts`, detect auth state and swap provider:
   ```ts
   const identityProvider = session
     ? new GoogleIdentityProvider(userEngine, session)
     : new LocalIdentityProvider(userEngine)
   ```
3. Zero changes to `IdentityService`, hooks, or UI components.

Planned providers: Google, Apple, GitHub, Email/Password, Magic Link.

---

## Future: Supabase Sync (Phase 3)

`LocalIdentityProvider` wraps `UserEngine` which uses `LocalStorageProvider`.

When Supabase is added:
1. Introduce `SupabaseStorageProvider implements StorageProvider`
2. Pass it to `UserEngine` in `createPlatformRuntime()`
3. `LocalIdentityProvider` continues to work unchanged

The `SyncRepository<T>` / `LocalSyncAdapter<T>` (Sprint 5, `src/lib/sync/`) is the bridge:
- Phase 1: `getPendingSyncKeys()` accumulates dirty keys in memory.
- Phase 3: A `SyncWorker` reads pending keys and pushes to Supabase.

---

## Future: Multi-Device Sync (Phase 3+)

```
Device A (anonymous)
    ↓ registers
Supabase account created
    ↓
Device B (new session)
    ↓
SupabaseStorageProvider pulls user state
    ↓
All history, journeys, coach memory available on new device
```

The `MergeContract` type (already defined in `user/types.ts`) handles conflict resolution when the same user has results on multiple devices.

---

## Consequences

**Good:**
- UI components never talk to `UserEngine` for identity concerns.
- Adding Google OAuth touches one file (`platform.ts`), not the entire codebase.
- Registration messages are language-aware at every entry point.
- Anonymous data is never lost — upgrade is a data migration, not a reset.

**Trade-offs:**
- One extra layer (`IdentityProvider`) between `IdentityService` and `UserEngine`. Justified because the provider interface is the only thing that changes when new auth methods are added.
- `LocalIdentityProvider` is a thin wrapper today. Its value becomes clear in Phase 2 when it can be swapped for OAuth providers without touching tests or components.

---

## Alternatives Considered

**Alternative A: `IdentityService` wraps `UserEngine` directly**  
Rejected: would require changes to `IdentityService` for every new OAuth provider.

**Alternative B: Put auth logic in `UserEngine`**  
Rejected: `UserEngine` is a data layer. Auth flows (OAuth tokens, session management) are not data concerns.

**Alternative C: External auth library (NextAuth, Clerk)**  
Deferred to Phase 2+. For Phase 1, the device-local flow is simpler, has no external dependencies, and works offline.
