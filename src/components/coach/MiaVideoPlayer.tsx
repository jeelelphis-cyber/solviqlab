'use client'

import { useEffect, useRef, useState } from 'react'
import type { HeyGenVideoStatus } from '@/lib/heygen/types'

interface Props {
  videoId:     string
  name:        string
  score?:      number | null
  cluster?:    string
  lang?:       string
  onStarted?:  () => void
  onFinished?: () => void
  onUpgrade?:  () => void
}

interface PollState {
  status:   HeyGenVideoStatus
  videoUrl: string | null
  error:    string | null
}

const POLL_INTERVAL_MS = 5000
const MAX_POLLS        = 72  // 6 min max wait

function getAnalyzingMessages(name: string, score: number | null, cluster: string, lang: string): string[] {
  if (lang === 'uk') {
    const scoreText    = score !== null ? `твій результат ${score} балів` : 'твої результати'
    const clusterLabel = cluster === 'sleep' ? 'сну' : 'здоров\'я'
    return [
      `Переглядаю ${scoreText}, ${name}…`,
      `Аналізую твої дані ${clusterLabel}. Хочу показати тобі одну конкретну річ.`,
      `Знаходжу найважливіше у твоєму профілі прямо зараз.`,
      `Майже готово, ${name}. Хочу зробити це правильно.`,
    ]
  }
  const scoreText    = score !== null ? `your ${score}-point score` : 'your results'
  const clusterLabel = cluster === 'sleep' ? 'sleep' : 'health'
  return [
    `Reviewing ${scoreText}, ${name}…`,
    `Looking at your ${clusterLabel} data. I want to show you one specific thing.`,
    `Finding what matters most in your profile right now.`,
    `Almost done, ${name}. I want to get this right.`,
  ]
}

const UNAVAILABLE_COPY: Record<string, { title: string; sub: string; btn: string }> = {
  en: { title: 'Your video is almost ready.',       sub: 'Our AI coach is in high demand right now. We\'re expanding capacity — come back in a few minutes.',  btn: 'Continue to your plan →' },
  uk: { title: 'Ваше відео майже готове.',          sub: 'Наш ШІ-коуч зараз дуже затребуваний. Ми розширюємо потужності — поверніться за кілька хвилин.',     btn: 'Продовжити до плану →' },
  es: { title: 'Tu video está casi listo.',         sub: 'Nuestro coach IA tiene mucha demanda ahora. Estamos ampliando capacidad — vuelve en unos minutos.',    btn: 'Continuar al plan →' },
}

export function MiaVideoPlayer({ videoId, name, score = null, cluster = 'weight', lang = 'en', onStarted, onFinished, onUpgrade }: Props) {
  const [poll, setPoll]           = useState<PollState>({ status: 'pending', videoUrl: null, error: null })
  const [played, setPlayed]       = useState(false)
  const [msgIndex, setMsgIndex]   = useState(0)
  const videoRef                  = useRef<HTMLVideoElement>(null)
  const pollCount                 = useRef(0)
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgIntervalRef            = useRef<ReturnType<typeof setInterval> | null>(null)

  const messages = getAnalyzingMessages(name, score, cluster, lang)

  // Poll for video status
  useEffect(() => {
    async function checkStatus() {
      if (pollCount.current >= MAX_POLLS) {
        clearInterval(intervalRef.current!)
        setPoll(p => ({ ...p, status: 'failed', error: 'Timed out waiting for video' }))
        return
      }
      pollCount.current++

      try {
        const res  = await fetch(`/api/heygen/generate?videoId=${videoId}`)
        const data = await res.json() as PollState
        setPoll(data)
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(intervalRef.current!)
        }
      } catch {
        // transient — keep polling
      }
    }

    intervalRef.current = setInterval(checkStatus, POLL_INTERVAL_MS)
    checkStatus()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [videoId])

  // Cycle analyzing messages while loading
  useEffect(() => {
    if (poll.status !== 'pending' && poll.status !== 'processing') return
    msgIntervalRef.current = setInterval(() => {
      setMsgIndex(i => (i + 1) % messages.length)
    }, 6000)
    return () => { if (msgIntervalRef.current) clearInterval(msgIntervalRef.current) }
  }, [poll.status, messages.length])

  function handleVideoEnded() {
    setPlayed(true)
    onFinished?.()
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (poll.status === 'pending' || poll.status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-10 px-4">
        {/* Mia photo with pulse ring */}
        <div className="relative w-24 h-24 shrink-0">
          <div className="absolute inset-0 rounded-full bg-violet-400 opacity-20 animate-ping" />
          <img
            src="https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp"
            alt="Mia"
            className="relative w-24 h-24 rounded-full object-cover object-top border-2 border-violet-300 shadow-lg"
            onError={e => {
              const el = e.currentTarget as HTMLImageElement
              el.style.display = 'none'
              const fb = el.nextElementSibling as HTMLElement | null
              if (fb) fb.style.display = 'flex'
            }}
          />
          <div
            style={{ display: 'none' }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 items-center justify-center text-2xl font-bold text-white"
          >
            M
          </div>
        </div>

        {/* Cycling message */}
        <div className="text-center max-w-xs">
          <p key={msgIndex} className="text-gray-800 dark:text-white font-medium leading-snug">
            {messages[msgIndex]}
          </p>
        </div>

        {/* Dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Error / timeout state — show as "coming soon" not hard error ───────────
  if (poll.status === 'failed' || !poll.videoUrl) {
    const copy = UNAVAILABLE_COPY[lang] ?? UNAVAILABLE_COPY.en!
    return (
      <div className="flex flex-col items-center gap-5 py-10 px-4 text-center">
        <img
          src="https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp"
          alt="Mia"
          className="w-20 h-20 rounded-full object-cover object-top border-2 border-violet-200 opacity-80"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
        <div className="space-y-1.5">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{copy.title}</p>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xs">{copy.sub}</p>
        </div>
        <button
          onClick={onUpgrade}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium px-6 py-3 hover:opacity-90 transition-opacity"
        >
          {copy.btn}
        </button>
      </div>
    )
  }

  // ── Video ready ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-xl">
        <video
          ref={videoRef}
          src={poll.videoUrl}
          controls
          autoPlay
          playsInline
          onPlay={() => onStarted?.()}
          onEnded={handleVideoEnded}
          className="w-full h-full object-cover"
        />
      </div>

      {played && (
        <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-6 space-y-4">
          <p className="font-medium text-gray-900 dark:text-white">
            Mia is already preparing your first weekly plan, {name}.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            7 days free. No card needed. Start when you're ready.
          </p>
          <button
            onClick={onUpgrade}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-3.5 hover:opacity-90 transition-opacity"
          >
            Continue with Mia
          </button>
        </div>
      )}
    </div>
  )
}
