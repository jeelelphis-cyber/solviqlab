// Journey Engine — i18n strings for the journey UI
// Covers all 10 supported languages.
// Per-instrument reasons (in config.ts) are English-only in V3 Sprint 01.

export interface JourneyStrings {
  // NextStepCard
  readonly recommendedNextStep: string
  readonly minutesLabel: (n: number) => string
  readonly continueJourney: string
  readonly profileContribution: (label: string, pct: number) => string

  // JourneyProgressCard
  readonly journeyProgress: string
  readonly stepN: (n: number, total: number) => string
  readonly completedLabel: string
  readonly currentLabel: string
  readonly upcomingLabel: string

  // UnlockCard
  readonly stepsToUnlock: (n: number, reward: string) => string
  readonly stepsRemaining: (n: number) => string
  readonly keepGoing: string

  // AIConsultCard
  readonly aiConsultTitle: string
  readonly aiConsultDescription: string
  readonly aiConsultLocked: string
  readonly aiUnlockHint: (nextSlug: string) => string
}

type Lang = 'en' | 'uk' | 'es' | 'pt' | 'fr' | 'de' | 'pl' | 'tr' | 'it' | 'nl'

const STRINGS: Record<Lang, JourneyStrings> = {
  en: {
    recommendedNextStep: 'Recommended Next Step',
    minutesLabel: (n) => `${n} min`,
    continueJourney: 'Continue Your Journey',
    profileContribution: (label, pct) => `+${pct}% ${label}`,
    journeyProgress: 'Journey Progress',
    stepN: (n, total) => `Step ${n} of ${total}`,
    completedLabel: 'Completed',
    currentLabel: 'Current',
    upcomingLabel: 'Up next',
    stepsToUnlock: (n, reward) => `Complete ${n} more ${n === 1 ? 'step' : 'steps'} to unlock your ${reward}`,
    stepsRemaining: (n) => `${n} ${n === 1 ? 'step' : 'steps'} remaining`,
    keepGoing: 'Keep Going',
    aiConsultTitle: 'Personal AI Consultation',
    aiConsultDescription: 'Get a personalized analysis based on your complete profile, with actionable insights tailored to your results.',
    aiConsultLocked: 'Locked',
    aiUnlockHint: () => 'Complete your next step to unlock',
  },

  uk: {
    recommendedNextStep: 'Рекомендований наступний крок',
    minutesLabel: (n) => `${n} хв`,
    continueJourney: 'Продовжити шлях',
    profileContribution: (label, pct) => `+${pct}% ${label}`,
    journeyProgress: 'Прогрес шляху',
    stepN: (n, total) => `Крок ${n} з ${total}`,
    completedLabel: 'Завершено',
    currentLabel: 'Поточний',
    upcomingLabel: 'Далі',
    stepsToUnlock: (n, reward) => `Зробіть ще ${n} ${n === 1 ? 'крок' : 'кроки'}, щоб розблокувати ${reward}`,
    stepsRemaining: (n) => `Залишилось ${n} ${n === 1 ? 'крок' : 'кроки'}`,
    keepGoing: 'Продовжуй',
    aiConsultTitle: 'Персональна консультація AI',
    aiConsultDescription: 'Отримайте персоналізований аналіз на основі вашого повного профілю з практичними рекомендаціями.',
    aiConsultLocked: 'Заблоковано',
    aiUnlockHint: () => 'Завершіть наступний крок для розблокування',
  },

  es: {
    recommendedNextStep: 'Siguiente paso recomendado',
    minutesLabel: (n) => `${n} min`,
    continueJourney: 'Continúa tu camino',
    profileContribution: (label, pct) => `+${pct}% ${label}`,
    journeyProgress: 'Progreso del camino',
    stepN: (n, total) => `Paso ${n} de ${total}`,
    completedLabel: 'Completado',
    currentLabel: 'Actual',
    upcomingLabel: 'Siguiente',
    stepsToUnlock: (n, reward) => `Completa ${n} ${n === 1 ? 'paso' : 'pasos'} más para desbloquear tu ${reward}`,
    stepsRemaining: (n) => `${n} ${n === 1 ? 'paso' : 'pasos'} restantes`,
    keepGoing: 'Sigue adelante',
    aiConsultTitle: 'Consulta Personal con IA',
    aiConsultDescription: 'Obtén un análisis personalizado basado en tu perfil completo con perspectivas prácticas.',
    aiConsultLocked: 'Bloqueado',
    aiUnlockHint: () => 'Completa tu próximo paso para desbloquear',
  },

  pt: {
    recommendedNextStep: 'Próximo passo recomendado',
    minutesLabel: (n) => `${n} min`,
    continueJourney: 'Continue sua jornada',
    profileContribution: (label, pct) => `+${pct}% ${label}`,
    journeyProgress: 'Progresso da jornada',
    stepN: (n, total) => `Passo ${n} de ${total}`,
    completedLabel: 'Concluído',
    currentLabel: 'Atual',
    upcomingLabel: 'A seguir',
    stepsToUnlock: (n, reward) => `Complete mais ${n} ${n === 1 ? 'passo' : 'passos'} para desbloquear seu ${reward}`,
    stepsRemaining: (n) => `${n} ${n === 1 ? 'passo' : 'passos'} restantes`,
    keepGoing: 'Continue',
    aiConsultTitle: 'Consulta Pessoal com IA',
    aiConsultDescription: 'Obtenha uma análise personalizada baseada no seu perfil completo com insights práticos.',
    aiConsultLocked: 'Bloqueado',
    aiUnlockHint: () => 'Complete o próximo passo para desbloquear',
  },

  fr: {
    recommendedNextStep: 'Prochaine étape recommandée',
    minutesLabel: (n) => `${n} min`,
    continueJourney: 'Continuer votre parcours',
    profileContribution: (label, pct) => `+${pct}% ${label}`,
    journeyProgress: 'Progression du parcours',
    stepN: (n, total) => `Étape ${n} sur ${total}`,
    completedLabel: 'Complété',
    currentLabel: 'Actuel',
    upcomingLabel: 'Suivant',
    stepsToUnlock: (n, reward) => `Complétez ${n} ${n === 1 ? 'étape' : 'étapes'} de plus pour débloquer votre ${reward}`,
    stepsRemaining: (n) => `${n} ${n === 1 ? 'étape' : 'étapes'} restante${n === 1 ? '' : 's'}`,
    keepGoing: 'Continuez',
    aiConsultTitle: 'Consultation IA Personnelle',
    aiConsultDescription: 'Obtenez une analyse personnalisée basée sur votre profil complet avec des insights concrets.',
    aiConsultLocked: 'Verrouillé',
    aiUnlockHint: () => 'Complétez votre prochaine étape pour débloquer',
  },

  de: {
    recommendedNextStep: 'Empfohlener nächster Schritt',
    minutesLabel: (n) => `${n} Min`,
    continueJourney: 'Reise fortsetzen',
    profileContribution: (label, pct) => `+${pct}% ${label}`,
    journeyProgress: 'Reisefortschritt',
    stepN: (n, total) => `Schritt ${n} von ${total}`,
    completedLabel: 'Abgeschlossen',
    currentLabel: 'Aktuell',
    upcomingLabel: 'Als nächstes',
    stepsToUnlock: (n, reward) => `Schließe ${n} weitere${n === 1 ? 'n Schritt' : ' Schritte'} ab, um dein ${reward} freizuschalten`,
    stepsRemaining: (n) => `${n} ${n === 1 ? 'Schritt' : 'Schritte'} verbleibend`,
    keepGoing: 'Weitermachen',
    aiConsultTitle: 'Persönliche KI-Beratung',
    aiConsultDescription: 'Erhalte eine personalisierte Analyse basierend auf deinem vollständigen Profil mit umsetzbaren Erkenntnissen.',
    aiConsultLocked: 'Gesperrt',
    aiUnlockHint: () => 'Schließe den nächsten Schritt ab, um freizuschalten',
  },

  pl: {
    recommendedNextStep: 'Zalecany następny krok',
    minutesLabel: (n) => `${n} min`,
    continueJourney: 'Kontynuuj podróż',
    profileContribution: (label, pct) => `+${pct}% ${label}`,
    journeyProgress: 'Postęp podróży',
    stepN: (n, total) => `Krok ${n} z ${total}`,
    completedLabel: 'Ukończono',
    currentLabel: 'Aktualny',
    upcomingLabel: 'Następny',
    stepsToUnlock: (n, reward) => `Ukończ jeszcze ${n} ${n === 1 ? 'krok' : 'kroki'}, aby odblokować ${reward}`,
    stepsRemaining: (n) => `Pozostało ${n} ${n === 1 ? 'krok' : 'kroki'}`,
    keepGoing: 'Idź dalej',
    aiConsultTitle: 'Osobista Konsultacja AI',
    aiConsultDescription: 'Uzyskaj spersonalizowaną analizę opartą na pełnym profilu z praktycznymi wskazówkami.',
    aiConsultLocked: 'Zablokowano',
    aiUnlockHint: () => 'Ukończ następny krok, aby odblokować',
  },

  tr: {
    recommendedNextStep: 'Önerilen Sonraki Adım',
    minutesLabel: (n) => `${n} dk`,
    continueJourney: 'Yolculuğuna Devam Et',
    profileContribution: (label, pct) => `+%${pct} ${label}`,
    journeyProgress: 'Yolculuk İlerlemesi',
    stepN: (n, total) => `${total} adımın ${n}. adımı`,
    completedLabel: 'Tamamlandı',
    currentLabel: 'Mevcut',
    upcomingLabel: 'Sıradaki',
    stepsToUnlock: (n, reward) => `${reward} kilidini açmak için ${n} adım daha tamamla`,
    stepsRemaining: (n) => `${n} adım kaldı`,
    keepGoing: 'Devam Et',
    aiConsultTitle: 'Kişisel AI Danışmanlığı',
    aiConsultDescription: 'Tüm profiline dayalı kişiselleştirilmiş analiz ve uygulanabilir öneriler al.',
    aiConsultLocked: 'Kilitli',
    aiUnlockHint: () => 'Kilidini açmak için sonraki adımı tamamla',
  },

  it: {
    recommendedNextStep: 'Prossimo passo consigliato',
    minutesLabel: (n) => `${n} min`,
    continueJourney: 'Continua il tuo percorso',
    profileContribution: (label, pct) => `+${pct}% ${label}`,
    journeyProgress: 'Progresso del percorso',
    stepN: (n, total) => `Passo ${n} di ${total}`,
    completedLabel: 'Completato',
    currentLabel: 'Attuale',
    upcomingLabel: 'Prossimo',
    stepsToUnlock: (n, reward) => `Completa altri ${n} ${n === 1 ? 'passo' : 'passi'} per sbloccare il tuo ${reward}`,
    stepsRemaining: (n) => `${n} ${n === 1 ? 'passo' : 'passi'} rimanenti`,
    keepGoing: 'Continua',
    aiConsultTitle: 'Consulenza AI Personale',
    aiConsultDescription: 'Ottieni un\'analisi personalizzata basata sul tuo profilo completo con approfondimenti pratici.',
    aiConsultLocked: 'Bloccato',
    aiUnlockHint: () => 'Completa il prossimo passo per sbloccare',
  },

  nl: {
    recommendedNextStep: 'Aanbevolen volgende stap',
    minutesLabel: (n) => `${n} min`,
    continueJourney: 'Ga verder met je reis',
    profileContribution: (label, pct) => `+${pct}% ${label}`,
    journeyProgress: 'Reisvoortgang',
    stepN: (n, total) => `Stap ${n} van ${total}`,
    completedLabel: 'Voltooid',
    currentLabel: 'Huidig',
    upcomingLabel: 'Volgende',
    stepsToUnlock: (n, reward) => `Voltooi nog ${n} ${n === 1 ? 'stap' : 'stappen'} om je ${reward} te ontgrendelen`,
    stepsRemaining: (n) => `${n} ${n === 1 ? 'stap' : 'stappen'} resterend`,
    keepGoing: 'Ga door',
    aiConsultTitle: 'Persoonlijke AI-Consultatie',
    aiConsultDescription: 'Ontvang een gepersonaliseerde analyse op basis van je volledige profiel met bruikbare inzichten.',
    aiConsultLocked: 'Vergrendeld',
    aiUnlockHint: () => 'Voltooi je volgende stap om te ontgrendelen',
  },
}

export function getJourneyStrings(lang: string): JourneyStrings {
  return STRINGS[(lang as Lang)] ?? STRINGS.en
}
