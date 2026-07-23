// ─────────────────────────────────────────────────────────────────────────────
// Journey CTA Engine
//
// Selects the best CTA text based on journey context.
// Uses deterministic A/B variants (slug-hash-based) so SSR is consistent.
//
// Variant logic:
//   A — Action-oriented:   "Continue Your Health Analysis"
//   B — Outcome-oriented:  "Unlock Your Personal Health Report"
//   C — Progress-oriented: "Complete Step 2 of 6 — 2 min"
//
// Urgency tiers:
//   critical → one step from unlock reward
//   high     → two steps from unlock
//   medium   → mid-journey
//   low      → just started
// ─────────────────────────────────────────────────────────────────────────────

import type { JourneyPosition } from './config'

export type CTAVariant = 'A' | 'B' | 'C'
export type CTAUrgency = 'low' | 'medium' | 'high' | 'critical'

export interface CTAConfig {
  readonly text: string
  readonly subtext: string | null
  readonly urgency: CTAUrgency
  readonly variant: CTAVariant
  readonly urgencyMessage: string | null   // "Why now" conversion hook
  readonly trackingLabel: string           // e.g. "health_step2_unlock_B"
}

// ── Variant Assignment ────────────────────────────────────────────────────────

export function getVariant(slug: string): CTAVariant {
  const hash = slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (['A', 'B', 'C'] as const)[hash % 3]!
}

// ── CTA String Tables (10 languages) ─────────────────────────────────────────

type Lang = 'en' | 'uk' | 'es' | 'pt' | 'fr' | 'de' | 'pl' | 'tr' | 'it' | 'nl'

interface CTAStrings {
  // Variant A — action
  continueAnalysis: (journeyName: string) => string
  continueJourney: (journeyName: string) => string
  startJourney: (journeyName: string) => string
  finalStep: () => string

  // Variant B — outcome
  unlockReport: (reward: string) => string
  oneStepToUnlock: (reward: string) => string
  unlockRecommendations: () => string
  seePersonalResults: () => string

  // Variant C — progress
  completeStep: (current: number, total: number, minutes: number) => string
  almostThere: (stepsLeft: number) => string
  finishProfile: (label: string) => string
  firstStep: (minutes: number) => string

  // Urgency messages
  urgencyOneStep: (reward: string) => string
  urgencyTwoSteps: (reward: string) => string
  urgencyMidJourney: (pct: number, label: string) => string
  urgencyStart: (totalSteps: number) => string

  // Subtext
  subtextMinutes: (n: number) => string
  subtextFree: () => string
}

const STRINGS: Record<Lang, CTAStrings> = {
  en: {
    continueAnalysis: (j) => `Continue Your ${j}`,
    continueJourney: (j) => `Continue ${j}`,
    startJourney: (j) => `Start Your ${j}`,
    finalStep: () => 'Complete Your Profile',
    unlockReport: (r) => `Unlock Your ${r}`,
    oneStepToUnlock: (r) => `One Step to Unlock: ${r}`,
    unlockRecommendations: () => 'Unlock Personalized Recommendations',
    seePersonalResults: () => 'See Your Personal Results',
    completeStep: (c, t, m) => `Complete Step ${c} of ${t} — ${m} min`,
    almostThere: (n) => `${n} Step${n !== 1 ? 's' : ''} Left to Complete`,
    finishProfile: (l) => `Finish Your ${l}`,
    firstStep: (m) => `Begin — Takes Only ${m} min`,
    urgencyOneStep: (r) => `You're one step away from unlocking your ${r}.`,
    urgencyTwoSteps: (r) => `Completing this step significantly improves the accuracy of your ${r}.`,
    urgencyMidJourney: (pct, l) => `Your ${l} is ${pct}% complete. Each step makes your analysis more accurate.`,
    urgencyStart: (n) => `This ${n}-step journey creates a complete picture of your results.`,
    subtextMinutes: (n) => `${n} min`,
    subtextFree: () => 'free · no signup',
  },
  uk: {
    continueAnalysis: (j) => `Продовжити ${j}`,
    continueJourney: (j) => `Продовжити ${j}`,
    startJourney: (j) => `Розпочати ${j}`,
    finalStep: () => 'Завершити профіль',
    unlockReport: (r) => `Розблокувати ${r}`,
    oneStepToUnlock: (r) => `Один крок до: ${r}`,
    unlockRecommendations: () => 'Розблокувати персональні рекомендації',
    seePersonalResults: () => 'Побачити особисті результати',
    completeStep: (c, t, m) => `Крок ${c} з ${t} — ${m} хв`,
    almostThere: (n) => `Залишилось ${n} ${n === 1 ? 'крок' : 'кроки'}`,
    finishProfile: (l) => `Завершити ${l}`,
    firstStep: (m) => `Почати — лише ${m} хв`,
    urgencyOneStep: (r) => `Ви за один крок від розблокування ${r}.`,
    urgencyTwoSteps: (r) => `Цей крок значно підвищить точність вашого ${r}.`,
    urgencyMidJourney: (pct, l) => `Ваш ${l} завершено на ${pct}%. Кожен крок покращує аналіз.`,
    urgencyStart: (n) => `Цей ${n}-кроковий шлях створює повну картину ваших результатів.`,
    subtextMinutes: (n) => `${n} хв`,
    subtextFree: () => 'безкоштовно · без реєстрації',
  },
  es: {
    continueAnalysis: (j) => `Continuar ${j}`,
    continueJourney: (j) => `Continuar ${j}`,
    startJourney: (j) => `Iniciar ${j}`,
    finalStep: () => 'Completar tu perfil',
    unlockReport: (r) => `Desbloquear tu ${r}`,
    oneStepToUnlock: (r) => `Un paso para desbloquear: ${r}`,
    unlockRecommendations: () => 'Desbloquear recomendaciones personalizadas',
    seePersonalResults: () => 'Ver mis resultados personales',
    completeStep: (c, t, m) => `Completar paso ${c} de ${t} — ${m} min`,
    almostThere: (n) => `${n} paso${n !== 1 ? 's' : ''} restante${n !== 1 ? 's' : ''}`,
    finishProfile: (l) => `Completar tu ${l}`,
    firstStep: (m) => `Comenzar — solo ${m} min`,
    urgencyOneStep: (r) => `Estás a un paso de desbloquear tu ${r}.`,
    urgencyTwoSteps: (r) => `Completar este paso mejora significativamente tu ${r}.`,
    urgencyMidJourney: (pct, l) => `Tu ${l} está ${pct}% completo. Cada paso hace el análisis más preciso.`,
    urgencyStart: (n) => `Este recorrido de ${n} pasos crea un panorama completo de tus resultados.`,
    subtextMinutes: (n) => `${n} min`,
    subtextFree: () => 'gratis · sin registro',
  },
  pt: {
    continueAnalysis: (j) => `Continuar ${j}`,
    continueJourney: (j) => `Continuar ${j}`,
    startJourney: (j) => `Iniciar ${j}`,
    finalStep: () => 'Completar seu perfil',
    unlockReport: (r) => `Desbloquear seu ${r}`,
    oneStepToUnlock: (r) => `Um passo para desbloquear: ${r}`,
    unlockRecommendations: () => 'Desbloquear recomendações personalizadas',
    seePersonalResults: () => 'Ver meus resultados pessoais',
    completeStep: (c, t, m) => `Completar passo ${c} de ${t} — ${m} min`,
    almostThere: (n) => `${n} passo${n !== 1 ? 's' : ''} restante${n !== 1 ? 's' : ''}`,
    finishProfile: (l) => `Completar seu ${l}`,
    firstStep: (m) => `Começar — apenas ${m} min`,
    urgencyOneStep: (r) => `Você está a um passo de desbloquear seu ${r}.`,
    urgencyTwoSteps: (r) => `Completar este passo melhora significativamente seu ${r}.`,
    urgencyMidJourney: (pct, l) => `Seu ${l} está ${pct}% completo. Cada passo torna a análise mais precisa.`,
    urgencyStart: (n) => `Esta jornada de ${n} passos cria um panorama completo dos seus resultados.`,
    subtextMinutes: (n) => `${n} min`,
    subtextFree: () => 'grátis · sem cadastro',
  },
  fr: {
    continueAnalysis: (j) => `Continuer ${j}`,
    continueJourney: (j) => `Continuer ${j}`,
    startJourney: (j) => `Commencer ${j}`,
    finalStep: () => 'Compléter votre profil',
    unlockReport: (r) => `Débloquer votre ${r}`,
    oneStepToUnlock: (r) => `Une étape pour débloquer : ${r}`,
    unlockRecommendations: () => 'Débloquer les recommandations personnalisées',
    seePersonalResults: () => 'Voir mes résultats personnels',
    completeStep: (c, t, m) => `Étape ${c} sur ${t} — ${m} min`,
    almostThere: (n) => `${n} étape${n !== 1 ? 's' : ''} restante${n !== 1 ? 's' : ''}`,
    finishProfile: (l) => `Compléter votre ${l}`,
    firstStep: (m) => `Commencer — seulement ${m} min`,
    urgencyOneStep: (r) => `Vous êtes à une étape de débloquer votre ${r}.`,
    urgencyTwoSteps: (r) => `Cette étape améliore considérablement la précision de votre ${r}.`,
    urgencyMidJourney: (pct, l) => `Votre ${l} est complété à ${pct}%. Chaque étape améliore l'analyse.`,
    urgencyStart: (n) => `Ce parcours de ${n} étapes crée une image complète de vos résultats.`,
    subtextMinutes: (n) => `${n} min`,
    subtextFree: () => 'gratuit · sans inscription',
  },
  de: {
    continueAnalysis: (j) => `${j} fortsetzen`,
    continueJourney: (j) => `${j} fortsetzen`,
    startJourney: (j) => `${j} starten`,
    finalStep: () => 'Profil vervollständigen',
    unlockReport: (r) => `${r} freischalten`,
    oneStepToUnlock: (r) => `Noch ein Schritt: ${r}`,
    unlockRecommendations: () => 'Personalisierte Empfehlungen freischalten',
    seePersonalResults: () => 'Meine persönlichen Ergebnisse sehen',
    completeStep: (c, t, m) => `Schritt ${c} von ${t} — ${m} Min`,
    almostThere: (n) => `Noch ${n} ${n === 1 ? 'Schritt' : 'Schritte'}`,
    finishProfile: (l) => `${l} abschließen`,
    firstStep: (m) => `Starten — nur ${m} Min`,
    urgencyOneStep: (r) => `Du bist einen Schritt davon entfernt, dein ${r} freizuschalten.`,
    urgencyTwoSteps: (r) => `Dieser Schritt verbessert die Genauigkeit deines ${r} erheblich.`,
    urgencyMidJourney: (pct, l) => `Dein ${l} ist zu ${pct}% abgeschlossen. Jeder Schritt verbessert die Analyse.`,
    urgencyStart: (n) => `Diese ${n}-Schritte-Reise erstellt ein vollständiges Bild deiner Ergebnisse.`,
    subtextMinutes: (n) => `${n} Min`,
    subtextFree: () => 'kostenlos · ohne Anmeldung',
  },
  pl: {
    continueAnalysis: (j) => `Kontynuuj ${j}`,
    continueJourney: (j) => `Kontynuuj ${j}`,
    startJourney: (j) => `Rozpocznij ${j}`,
    finalStep: () => 'Uzupełnij profil',
    unlockReport: (r) => `Odblokuj ${r}`,
    oneStepToUnlock: (r) => `Jeden krok do: ${r}`,
    unlockRecommendations: () => 'Odblokuj spersonalizowane rekomendacje',
    seePersonalResults: () => 'Zobacz moje wyniki',
    completeStep: (c, t, m) => `Krok ${c} z ${t} — ${m} min`,
    almostThere: (n) => `Pozostało ${n} ${n === 1 ? 'krok' : 'kroki'}`,
    finishProfile: (l) => `Zakończ ${l}`,
    firstStep: (m) => `Zacznij — tylko ${m} min`,
    urgencyOneStep: (r) => `Jesteś o jeden krok od odblokowania ${r}.`,
    urgencyTwoSteps: (r) => `Ten krok znacznie poprawi dokładność twojego ${r}.`,
    urgencyMidJourney: (pct, l) => `Twój ${l} jest ukończony w ${pct}%. Każdy krok poprawia analizę.`,
    urgencyStart: (n) => `Ta ${n}-krokowa podróż tworzy pełny obraz twoich wyników.`,
    subtextMinutes: (n) => `${n} min`,
    subtextFree: () => 'bezpłatnie · bez rejestracji',
  },
  tr: {
    continueAnalysis: (j) => `${j} devam et`,
    continueJourney: (j) => `${j} devam et`,
    startJourney: (j) => `${j} başlat`,
    finalStep: () => 'Profilini tamamla',
    unlockReport: (r) => `${r} kilidini aç`,
    oneStepToUnlock: (r) => `${r} için son bir adım`,
    unlockRecommendations: () => 'Kişisel önerilerin kilidini aç',
    seePersonalResults: () => 'Kişisel sonuçlarımı gör',
    completeStep: (c, t, m) => `Adım ${c}/${t} — ${m} dk`,
    almostThere: (n) => `${n} adım kaldı`,
    finishProfile: (l) => `${l} tamamla`,
    firstStep: (m) => `Başla — sadece ${m} dk`,
    urgencyOneStep: (r) => `${r} kilidini açmaya bir adım kaldı.`,
    urgencyTwoSteps: (r) => `Bu adım ${r} doğruluğunu önemli ölçüde artırıyor.`,
    urgencyMidJourney: (pct, l) => `${l} %${pct} tamamlandı. Her adım analizi daha doğru yapıyor.`,
    urgencyStart: (n) => `Bu ${n} adımlı yolculuk sonuçlarınızın tam bir resmini oluşturuyor.`,
    subtextMinutes: (n) => `${n} dk`,
    subtextFree: () => 'ücretsiz · kayıt yok',
  },
  it: {
    continueAnalysis: (j) => `Continua ${j}`,
    continueJourney: (j) => `Continua ${j}`,
    startJourney: (j) => `Inizia ${j}`,
    finalStep: () => 'Completa il tuo profilo',
    unlockReport: (r) => `Sblocca il tuo ${r}`,
    oneStepToUnlock: (r) => `Un passo per sbloccare: ${r}`,
    unlockRecommendations: () => 'Sblocca raccomandazioni personalizzate',
    seePersonalResults: () => 'Vedi i miei risultati',
    completeStep: (c, t, m) => `Completa passo ${c} di ${t} — ${m} min`,
    almostThere: (n) => `${n} passo${n !== 1 ? 'i' : ''} rimanente${n !== 1 ? 'i' : ''}`,
    finishProfile: (l) => `Completa il tuo ${l}`,
    firstStep: (m) => `Inizia — solo ${m} min`,
    urgencyOneStep: (r) => `Sei a un passo dallo sbloccare il tuo ${r}.`,
    urgencyTwoSteps: (r) => `Questo passo migliora significativamente la precisione del tuo ${r}.`,
    urgencyMidJourney: (pct, l) => `Il tuo ${l} è completo al ${pct}%. Ogni passo rende l'analisi più precisa.`,
    urgencyStart: (n) => `Questo percorso di ${n} passi crea un quadro completo dei tuoi risultati.`,
    subtextMinutes: (n) => `${n} min`,
    subtextFree: () => 'gratuito · senza registrazione',
  },
  nl: {
    continueAnalysis: (j) => `Ga verder met ${j}`,
    continueJourney: (j) => `Ga verder met ${j}`,
    startJourney: (j) => `Begin ${j}`,
    finalStep: () => 'Voltooi je profiel',
    unlockReport: (r) => `Ontgrendel je ${r}`,
    oneStepToUnlock: (r) => `Één stap om te ontgrendelen: ${r}`,
    unlockRecommendations: () => 'Ontgrendel persoonlijke aanbevelingen',
    seePersonalResults: () => 'Zie mijn persoonlijke resultaten',
    completeStep: (c, t, m) => `Stap ${c} van ${t} — ${m} min`,
    almostThere: (n) => `Nog ${n} stap${n !== 1 ? 'pen' : ''}`,
    finishProfile: (l) => `Voltooi je ${l}`,
    firstStep: (m) => `Begin — slechts ${m} min`,
    urgencyOneStep: (r) => `Je bent één stap verwijderd van het ontgrendelen van je ${r}.`,
    urgencyTwoSteps: (r) => `Deze stap verbetert de nauwkeurigheid van je ${r} aanzienlijk.`,
    urgencyMidJourney: (pct, l) => `Je ${l} is ${pct}% compleet. Elke stap maakt de analyse nauwkeuriger.`,
    urgencyStart: (n) => `Deze reis van ${n} stappen geeft een volledig beeld van je resultaten.`,
    subtextMinutes: (n) => `${n} min`,
    subtextFree: () => 'gratis · geen registratie',
  },
}

function getStrings(lang: string): CTAStrings {
  return STRINGS[(lang as Lang)] ?? STRINGS.en
}

// ── CTA Selection Logic ───────────────────────────────────────────────────────

export function buildCTA(
  pos: JourneyPosition,
  nextName: string,
  estimatedMinutes: number,
  lang: string
): CTAConfig {
  const s = getStrings(lang)
  const v = getVariant(pos.journey.id + pos.currentIndex)

  const { journey, currentIndex, totalSteps, stepsUntilUnlock, progressPercent } = pos
  const isFirst    = currentIndex === 0
  const isLast     = currentIndex === totalSteps - 2   // one before last step
  const isPreUnlock = stepsUntilUnlock === 1
  const isClose    = stepsUntilUnlock === 2

  // ── Urgency tier ──────────────────────────────────────────────────────────
  let urgency: CTAUrgency = 'low'
  if (isPreUnlock) urgency = 'critical'
  else if (isClose) urgency = 'high'
  else if (currentIndex >= 2) urgency = 'medium'

  // ── Urgency message ───────────────────────────────────────────────────────
  let urgencyMessage: string | null = null
  if (urgency === 'critical') {
    urgencyMessage = s.urgencyOneStep(journey.unlockReward)
  } else if (urgency === 'high') {
    urgencyMessage = s.urgencyTwoSteps(journey.unlockReward)
  } else if (urgency === 'medium') {
    urgencyMessage = s.urgencyMidJourney(progressPercent, journey.profileLabel)
  } else {
    urgencyMessage = s.urgencyStart(totalSteps)
  }

  // ── CTA text by variant ───────────────────────────────────────────────────
  let text: string
  let subtext: string | null = s.subtextMinutes(estimatedMinutes)

  if (v === 'A') {
    if (isFirst) text = s.startJourney(journey.name)
    else if (isLast) text = s.finalStep()
    else if (isPreUnlock) text = s.continueAnalysis(journey.name)
    else text = s.continueAnalysis(journey.name)
  } else if (v === 'B') {
    if (isPreUnlock) text = s.oneStepToUnlock(journey.unlockReward)
    else if (isFirst) text = s.seePersonalResults()
    else if (currentIndex >= 2) text = s.unlockRecommendations()
    else text = s.unlockReport(journey.unlockReward)
  } else {
    // C — progress-oriented
    if (isFirst) text = s.firstStep(estimatedMinutes)
    else if (isLast) text = s.finishProfile(journey.profileLabel)
    else if (isPreUnlock) text = s.almostThere(stepsUntilUnlock)
    else text = s.completeStep(currentIndex + 2, totalSteps, estimatedMinutes)
    subtext = urgency === 'critical' ? s.subtextFree() : null
  }

  const trackingLabel = `${journey.id}_step${currentIndex + 1}_${urgency}_${v}`

  return { text, subtext, urgency, variant: v, urgencyMessage, trackingLabel }
}
