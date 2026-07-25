import type { RegistrationTriggerReason } from '../user/types'

type RegistrationCopyMap = Record<RegistrationTriggerReason, string>

const EN: RegistrationCopyMap = {
  journey_progress_35:   "Save your journey progress — you're more than a third of the way through.",
  three_instruments:     "You've completed 3 instruments. Create a free account to keep your results.",
  ai_nearly_unlocked:    "Your AI Consultation is almost ready. Save your progress to unlock it.",
  reward_unlock_pending: "You're one step from unlocking a reward. Save it to your profile.",
  result_history_limit:  "You're approaching the save limit. Create a free account for unlimited history.",
}

const ES: Partial<RegistrationCopyMap> = {
  journey_progress_35:   'Guarda tu progreso — ya llevas más de un tercio del camino.',
  three_instruments:     'Has completado 3 instrumentos. Crea una cuenta gratuita para guardar tus resultados.',
  ai_nearly_unlocked:    'Tu consulta de IA está casi lista. Guarda tu progreso para desbloquearla.',
  reward_unlock_pending: 'Estás a un paso de desbloquear una recompensa. Guárdala en tu perfil.',
  result_history_limit:  'Te estás acercando al límite de guardado. Crea una cuenta gratuita para historial ilimitado.',
}

const LOCALES: Record<string, Partial<RegistrationCopyMap>> = {
  es: ES,
}

export function getRegistrationMessage(reason: RegistrationTriggerReason, lang: string): string {
  const locale = LOCALES[lang] ?? {}
  return locale[reason] ?? EN[reason]
}
