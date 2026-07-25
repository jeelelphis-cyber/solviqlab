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

interface Props {
  userId:        string
  score?:        number | null
  cluster?:      string
  prefillGraph?: UserGraph
  onUpgrade?:    () => void
}

export function MiaCoachExperience({ userId, score = null, cluster = 'weight', prefillGraph, onUpgrade }: Props) {
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
        }),
      })

      const payload = await res.json() as { videoId?: string; error?: string }

      if (!res.ok || !payload.videoId) {
        // Stay on generating with error — MiaVideoPlayer handles error display
        actions.setData({ videoId: null })
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
    actions.track('video_completed')
    actions.advance()  // video → first_action
  }

  function handleUpgrade() {
    actions.track('premium_clicked')
    actions.advance()  // first_action → premium
    onUpgrade?.()
  }

  // ── Intro — emotional bridge from assessment ───────────────────────────────
  if (state === 'mia_intro') {
    return (
      <div className="flex flex-col items-center gap-5 py-8 px-4 text-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            M
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-900" />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Mia has reviewed your results.
          </p>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
            {score !== null
              ? `She's already looking at what your ${score}-point score means for you specifically.`
              : "She's already looking at what your results mean for you specifically."
            }
          </p>
        </div>

        <button
          onClick={() => actions.advance()}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium px-6 py-3 hover:opacity-90 transition-opacity"
        >
          Meet Mia →
        </button>

        <p className="text-xs text-gray-300 dark:text-gray-600">
          Free · No account needed
        </p>
      </div>
    )
  }

  // ── Onboarding — name + goal ───────────────────────────────────────────────
  if (state === 'onboarding') {
    return <MiaOnboarding userId={userId} onDone={handleOnboardingDone} />
  }

  // ── Generating — Mia is working ────────────────────────────────────────────
  if (state === 'generating') {
    const name = data.name ?? ''
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-14 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 animate-pulse flex items-center justify-center text-white text-xl font-bold">
          M
        </div>
        <div>
          <p className="text-gray-900 dark:text-white font-medium">
            Mia is reviewing your results{name ? `, ${name}` : ''}…
          </p>
          <p className="text-sm text-gray-400 mt-1">
            She wants to get this right.
          </p>
        </div>
      </div>
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
        onStarted={handleVideoStarted}
        onFinished={handleVideoCompleted}
        onUpgrade={handleUpgrade}
      />
    )
  }

  // ── Premium ────────────────────────────────────────────────────────────────
  if (state === 'premium') {
    return (
      <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-6 space-y-4 text-center">
        <p className="font-medium text-gray-900 dark:text-white">
          Mia is already preparing your first weekly plan{data.name ? `, ${data.name}` : ''}.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          7 days free. No card needed. Start when you're ready.
        </p>
        <button
          onClick={() => actions.advance()}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-3.5 hover:opacity-90 transition-opacity"
        >
          Continue with Mia
        </button>
      </div>
    )
  }

  // ── Return Tomorrow ────────────────────────────────────────────────────────
  if (state === 'return_tomorrow') {
    return (
      <div className="flex flex-col items-center gap-5 py-12 px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
          M
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            You're in{data.name ? `, ${data.name}` : ''}.
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Mia will be ready for you tomorrow. Don't keep her waiting.
          </p>
        </div>
      </div>
    )
  }

  return null
}
