// ─────────────────────────────────────────────────────────────────────────────
// Coach Platform — Persona barrel export
// Sprint C-1.2: MIA_PERSONA_CONFIG implemented; ALEX_PERSONA_CONFIG placeholder.
// ─────────────────────────────────────────────────────────────────────────────

export { MIA_PERSONA_CONFIG }  from './mia'
export { ALEX_PERSONA_CONFIG } from './alex'

import { MIA_PERSONA_CONFIG }  from './mia'
import { ALEX_PERSONA_CONFIG } from './alex'

/**
 * Registry of all coach persona configs, keyed by coach ID.
 * Used by the orchestrator to look up the active persona config at runtime.
 *
 * Adding a new coach:
 *   1. Create `src/lib/coach/persona/<name>.ts` implementing CoachPersonaConfigWithEvaluableRules
 *   2. Add the export above and the entry below
 *   3. Add the new coach's ID to CoachPersonaConfig['coachId'] in contracts/index.ts
 */
export const PERSONA_REGISTRY = {
  mia:  MIA_PERSONA_CONFIG,
  alex: ALEX_PERSONA_CONFIG,
} as const

export type PersonaId = keyof typeof PERSONA_REGISTRY
