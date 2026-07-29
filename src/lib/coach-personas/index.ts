export type { CoachPersonaConfig } from './types'
export { MIA_PERSONA }      from './mia'
export { ALEX_PERSONA }     from './alex'
export { SCARLETT_PERSONA } from './scarlett'
export { LINA_PERSONA }     from './lina'
export { EMILIA_PERSONA }   from './emilia'
export { MARCUS_PERSONA }   from './marcus'

import { MIA_PERSONA }      from './mia'
import { ALEX_PERSONA }     from './alex'
import { SCARLETT_PERSONA } from './scarlett'
import { LINA_PERSONA }     from './lina'
import { EMILIA_PERSONA }   from './emilia'
import { MARCUS_PERSONA }   from './marcus'

export const PERSONAS = {
  mia:      MIA_PERSONA,
  alex:     ALEX_PERSONA,
  scarlett: SCARLETT_PERSONA,
  lina:     LINA_PERSONA,
  emilia:   EMILIA_PERSONA,
  marcus:   MARCUS_PERSONA,
}
export type PersonaId = keyof typeof PERSONAS
