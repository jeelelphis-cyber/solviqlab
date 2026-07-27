'use client'

// ─────────────────────────────────────────────────────────────────────────────
// MiaCoachExperience — Demo Flow driven by SessionFlowEngine.
//
// No scattered useState. One engine. One state machine.
// Based on First Session Experience v1 (src/lib/coach/FIRST_SESSION_EXPERIENCE.md)
// CEO Decision №004.
// ─────────────────────────────────────────────────────────────────────────────

import { useSessionFlow }  from '@/lib/session/use-session-flow'
import type { UserGraph }  from '@/lib/graph/types'
import { MiaOnboarding }   from './MiaOnboarding'
import { MiaVideoPlayer }  from './MiaVideoPlayer'
import { TodaysPlan }      from './TodaysPlan'

interface Props {
  userId:        string
  score?:        number | null
  cluster?:      string
  lang?:         string
  prefillGraph?: UserGraph
  onUpgrade?:    () => void
}

export function MiaCoachExperience({ userId, score = null, cluster = 'weight', lang = 'en', prefillGraph, onUpgrade }: Props) {
  const { state, data, actions } = useSessionFlow(userId)

  // Jump to mia_intro if we're arriving from assessment
  if (state === 'landing' || state === 'calculator' || state === 'assessment' || state === 'result') {
    actions.goto('mia_intro', { cluster: cluster ?? null, assessmentScore: score })
  }

  async function handleOnboardingDone(resolvedName: string, graph: UserGraph) {
    actions.setData({ name: resolvedName })
    actions.advance()  // onboarding → generating

    try {
      const res = await fetch('/api/heygen/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:  resolvedName,
          graph: prefillGraph ?? graph,
          lang,
        }),
      })

      const payload = await res.json() as { videoId?: string; error?: string }

      if (!res.ok || !payload.videoId) {
        // Advance to video state so MiaVideoPlayer can show the error UI
        actions.setData({ videoId: null })
        actions.advance()
        return
      }

      actions.setData({ videoId: payload.videoId })
      actions.advance()  // generating → video
    } catch {
      // Network error — fall back to intro so user can retry
      actions.goto('mia_intro')
    }
  }

  function handleVideoStarted() {
    actions.track('video_started')
  }

  function handleVideoCompleted() {
    // Transition to today_plan after video finishes
    handleVideoWatched()
  }

  function handleVideoWatched() {
    actions.track('video_completed')
    actions.goto('today_plan')
  }

  function handleUpgrade() {
    actions.track('premium_clicked')
    actions.goto('return_tomorrow')
    onUpgrade?.()
  }

  // ── Intro — emotional bridge from assessment OR cold-start greeting ──────────
  if (state === 'mia_intro') {
    const isCold = score === null

    // Cold start: no calculator context — Mia asks what the user needs
    if (isCold) {
      const coldTitle = lang === 'uk'
        ? 'Привіт! Я Міа — твій тренер зі здоров\'я.'
        : 'Hi! I\'m Mia — your personal health coach.'
      const coldSub = lang === 'uk'
        ? 'Чим я можу тобі допомогти сьогодні? Розкажи про свою проблему або мету.'
        : 'What would you like help with today? Tell me your problem or goal.'
      const coldBtn = lang === 'uk' ? 'Розпочати →' : 'Get Started →'
      const coldFree = lang === 'uk' ? 'Безкоштовно · Без реєстрації' : 'Free · No account needed'

      const topics = lang === 'uk'
        ? [
            { icon: '😴', label: 'Якість сну', cluster: 'sleep' },
            { icon: '⚖️', label: 'Схуднення', cluster: 'weight' },
            { icon: '😰', label: 'Стрес', cluster: 'stress' },
            { icon: '⚡', label: 'Енергія', cluster: 'energy' },
          ]
        : [
            { icon: '😴', label: 'Sleep quality', cluster: 'sleep' },
            { icon: '⚖️', label: 'Weight loss', cluster: 'weight' },
            { icon: '😰', label: 'Stress', cluster: 'stress' },
            { icon: '⚡', label: 'Energy', cluster: 'energy' },
          ]

      return (
        <div className="flex flex-col items-center gap-5 py-8 px-4 text-center">
          <div className="relative">
            <img
              src="https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp"
              alt="Mia"
              className="w-16 h-16 rounded-full object-cover object-top border-2 border-violet-300 shadow-lg"
              onError={e => {
                const el = e.currentTarget as HTMLImageElement
                el.style.display = 'none'
                const fb = el.nextElementSibling as HTMLElement | null
                if (fb) fb.style.display = 'flex'
              }}
            />
            <div
              style={{ display: 'none' }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 items-center justify-center text-white text-xl font-bold shadow-lg"
            >
              M
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-900" />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{coldTitle}</p>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{coldSub}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
            {topics.map(topic => (
              <button
                key={topic.cluster}
                onClick={() => {
                  actions.goto('mia_intro', { cluster: topic.cluster, assessmentScore: null })
                  actions.advance()
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-all"
              >
                <span>{topic.icon}</span>
                <span>{topic.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => actions.advance()}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium px-6 py-3 hover:opacity-90 transition-opacity"
          >
            {coldBtn}
          </button>

          <p className="text-xs text-gray-300 dark:text-gray-600">{coldFree}</p>
        </div>
      )
    }

    // With context: arriving from assessment — show results bridge
    const introTitle = lang === 'uk'
      ? 'Міа переглянула твої результати.'
      : 'Mia has reviewed your results.'
    const introSub = lang === 'uk'
      ? `Вона вже аналізує що означає твій результат ${score} балів саме для тебе.`
      : `She's already looking at what your ${score}-point score means for you specifically.`
    const introBtn  = lang === 'uk' ? 'Познайомитись з Міа →' : 'Meet Mia →'
    const introFree = lang === 'uk' ? 'Безкоштовно · Без реєстрації' : 'Free · No account needed'

    return (
      <div className="flex flex-col items-center gap-5 py-8 px-4 text-center">
        <div className="relative">
          <img
            src="https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp"
            alt="Mia"
            className="w-16 h-16 rounded-full object-cover object-top border-2 border-violet-300 shadow-lg"
            onError={e => {
              const el = e.currentTarget as HTMLImageElement
              el.style.display = 'none'
              const fb = el.nextElementSibling as HTMLElement | null
              if (fb) fb.style.display = 'flex'
            }}
          />
          <div
            style={{ display: 'none' }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 items-center justify-center text-white text-xl font-bold shadow-lg"
          >
            M
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-900" />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{introTitle}</p>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">{introSub}</p>
        </div>

        <button
          onClick={() => actions.advance()}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium px-6 py-3 hover:opacity-90 transition-opacity"
        >
          {introBtn}
        </button>

        <p className="text-xs text-gray-300 dark:text-gray-600">{introFree}</p>
      </div>
    )
  }

  // ── Onboarding — name + goal ───────────────────────────────────────────────
  if (state === 'onboarding') {
    return <MiaOnboarding userId={userId} lang={lang} onDone={handleOnboardingDone} />
  }

  // ── Generating — Mia is working ────────────────────────────────────────────
  if (state === 'generating') {
    const name = data.name ?? ''
    const genText = lang === 'uk'
      ? `Міа готує твоє особисте відео${name ? `, ${name}` : ''}…`
      : `Mia is preparing your personal video${name ? `, ${name}` : ''}…`
    const genSub = lang === 'uk'
      ? 'Зазвичай це займає 1–2 хвилини. Залишайтесь на сторінці.'
      : 'This usually takes 1–2 minutes. Stay on this page.'
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-10 px-4 text-center">
        <div className="relative w-20 h-20 shrink-0">
          <div className="absolute inset-0 rounded-full bg-violet-400 opacity-20 animate-ping" />
          <img
            src="https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp"
            alt="Mia"
            className="relative w-20 h-20 rounded-full object-cover object-top border-2 border-violet-300 shadow-lg"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
        <div>
          <p className="text-gray-900 dark:text-white font-medium">{genText}</p>
          <p className="text-sm text-gray-400 mt-1">{genSub}</p>
        </div>
      </div>
    )
  }

  // ── Today's Plan — shown after video ─────────────────────────────────────
  if (state === 'today_plan') {
    const emptyGraph: UserGraph = {
      userId:    'anon',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version:   1,
      identity:     { name: data.name ?? null, userType: 'anonymous', language: lang, timezone: null, age: null, updatedAt: new Date().toISOString(), confidence: 'inferred' },
      goals:        { items: [], updatedAt: new Date().toISOString(), confidence: 'stated' },
      habits:       { items: [], updatedAt: new Date().toISOString(), confidence: 'stated' },
      assessments:  { items: [], updatedAt: new Date().toISOString(), confidence: 'inferred' },
      journey:      { activeCluster: data.cluster ?? null, currentPhase: null, progress: null, completedSteps: [], updatedAt: new Date().toISOString(), confidence: 'inferred' },
      coachMemory:  { facts: [], communicationStyle: null, preferredTopics: [], updatedAt: new Date().toISOString(), confidence: 'inferred' },
      preferences:  { language: lang, responseLength: null, notificationsEnabled: true, updatedAt: new Date().toISOString(), confidence: 'inferred' },
      retention:    { daysSinceActive: 0, dormancyLevel: 'none', lastReminderFiredAt: null, updatedAt: new Date().toISOString(), confidence: 'inferred' },
      premium:      { tier: 'free', quotaUsedToday: 0, quotaLimit: 5, updatedAt: new Date().toISOString(), confidence: 'inferred' },
      dailyHistory: { entries: [], updatedAt: new Date().toISOString(), confidence: 'inferred' },
      quizResults:  { items: [], updatedAt: new Date().toISOString(), confidence: 'inferred' },
    }

    const planGraph = prefillGraph ?? emptyGraph

    return (
      <TodaysPlan
        graph={planGraph}
        lang={lang === 'uk' ? 'uk' : 'en'}
        onRegister={handleUpgrade}
      />
    )
  }

  // ── Video — poll + player ──────────────────────────────────────────────────
  if (state === 'video' || state === 'first_action') {
    if (!data.videoId) {
      return (
        <div className="text-center py-12 px-4 space-y-3">
          <p className="text-gray-500 text-sm">
            Something went wrong generating your video.
          </p>
          <button
            onClick={() => actions.goto('mia_intro')}
            className="text-violet-600 underline text-sm"
          >
            Try again
          </button>
        </div>
      )
    }

    return (
      <MiaVideoPlayer
        videoId={data.videoId}
        name={data.name ?? ''}
        score={data.assessmentScore}
        cluster={data.cluster ?? 'weight'}
        lang={lang}
        onStarted={handleVideoStarted}
        onFinished={handleVideoCompleted}
        onUpgrade={handleUpgrade}
      />
    )
  }

  // ── Return Tomorrow — emotional landing ───────────────────────────────────
  if (state === 'premium' || state === 'return_tomorrow') {
    const name    = data.name ?? ''
    const cluster = data.cluster ?? 'weight'

    const clusterLabel = lang === 'uk'
      ? (cluster === 'sleep' ? 'якість сну' : 'схуднення')
      : (cluster === 'sleep' ? 'sleep quality' : 'weight loss')

    const title = lang === 'uk'
      ? `Твій план вже в роботі${name ? `, ${name}` : ''}.`
      : `Your plan is in motion${name ? `, ${name}` : ''}.`

    const items = lang === 'uk'
      ? [
          `7-денний протокол для ${clusterLabel} — готовий завтра`,
          'Персональні цілі на основі твоїх даних',
          'Щоденний чекін з Міа',
        ]
      : [
          `Your 7-day ${clusterLabel} protocol — ready tomorrow`,
          'Personalized targets based on your data',
          'Daily check-in with Mia',
        ]

    const footer = lang === 'uk'
      ? 'Міа вже має твої дані. Вона не забуває.'
      : "Mia already has your data. She doesn't forget."

    const rewatch = lang === 'uk' ? 'Переглянути відео ще раз' : "Rewatch Mia's message"

    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4 text-center">
        <div className="relative">
          <img
            src="https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp"
            alt="Mia"
            className="w-20 h-20 rounded-full object-cover object-top border-2 border-violet-300 shadow-xl"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-900" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{footer}</p>
        </div>

        <div className="w-full rounded-2xl border border-violet-100 dark:border-violet-900 bg-violet-50 dark:bg-violet-900/20 p-5 space-y-3 text-left">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-800 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-violet-600 dark:text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => actions.goto('video')}
          className="text-xs text-violet-400 hover:text-violet-600 transition-colors underline underline-offset-2"
        >
          {rewatch}
        </button>
      </div>
    )
  }

  return null
}
