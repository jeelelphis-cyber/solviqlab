export interface RetentionTemplate {
  readonly title: string
  readonly body: string
  readonly cta: string
}

type RetentionTemplateMap = Record<string, RetentionTemplate>

const EN: RetentionTemplateMap = {
  coach_reminder_7d: {
    title: "How's your journey going?",
    body:  "It's been a week. Your Coach has new insights waiting for you.",
    cta:   'See Coach Insights',
  },
  journey_reminder_14d: {
    title: 'Your journey is waiting',
    body:  "You've built real momentum. Your next step is ready when you are.",
    cta:   'Continue Journey',
  },
  recommendation_21d: {
    title: 'A new recommendation is ready',
    body:  "Based on where you left off, we've updated your personalized plan.",
    cta:   'See Recommendation',
  },
  registration_nudge_30d: {
    title: "Don't lose your progress",
    body:  "A month of insights is saved on this device. Create a free account to keep it forever.",
    cta:   'Create Free Account',
  },
  premium_nudge_30d: {
    title: 'Ready for the next level?',
    body:  'Unlock AI-powered coaching and multi-device sync with Premium.',
    cta:   'Explore Premium',
  },
}

const ES: Partial<RetentionTemplateMap> = {
  coach_reminder_7d: {
    title: '¿Cómo va tu progreso?',
    body:  'Ha pasado una semana. Tu Coach tiene nuevas perspectivas esperándote.',
    cta:   'Ver perspectivas del Coach',
  },
  journey_reminder_14d: {
    title: 'Tu camino te espera',
    body:  'Has construido impulso real. Tu próximo paso está listo cuando lo estés tú.',
    cta:   'Continuar camino',
  },
  recommendation_21d: {
    title: 'Una nueva recomendación está lista',
    body:  'Basándonos en dónde lo dejaste, hemos actualizado tu plan personalizado.',
    cta:   'Ver recomendación',
  },
  registration_nudge_30d: {
    title: 'No pierdas tu progreso',
    body:  'Un mes de información guardada en este dispositivo. Crea una cuenta gratuita para conservarla.',
    cta:   'Crear cuenta gratuita',
  },
  premium_nudge_30d: {
    title: '¿Listo para el siguiente nivel?',
    body:  'Desbloquea el coaching con IA y la sincronización en varios dispositivos con Premium.',
    cta:   'Explorar Premium',
  },
}

const LOCALES: Record<string, Partial<RetentionTemplateMap>> = {
  es: ES,
}

export function getRetentionTemplate(ruleId: string, lang: string): RetentionTemplate | null {
  const locale = LOCALES[lang] ?? {}
  return locale[ruleId] ?? EN[ruleId] ?? null
}
