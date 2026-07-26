export type { CoachPersonaConfig } from './types'
export { MIA_PERSONA } from './mia'
export { ALEX_PERSONA } from './alex'

import { MIA_PERSONA } from './mia'
import { ALEX_PERSONA } from './alex'

export const PERSONAS = { mia: MIA_PERSONA, alex: ALEX_PERSONA }
export type PersonaId = keyof typeof PERSONAS
