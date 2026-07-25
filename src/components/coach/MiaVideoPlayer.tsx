'use client'

import { useEffect, useRef, useState } from 'react'
import type { HeyGenVideoStatus } from '@/lib/heygen/types'

interface Props {
  videoId:     string
  name:        string
  score?:      number | null
  cluster?:    string
  onStarted?:  () => void
  onFinished?: () => void
  onUpgrade?:  () => void
}

interface PollState {
  status:   HeyGenVideoStatus
  videoUrl: string | null
  error:    string | null
}

const POLL_INTERVAL_MS = 4000
const MAX_POLLS        = 60  // 4 min max wait

// Messages that cycle during the "Mia is working" screen.
// Each uses the name and score to feel personal — not generic.
function getAnalyzingMessages(name: string, score: number | null, cluster: string): string[] {
  const scoreText = score !== null ? `your ${score}-point score` : 'your results'
  const clusterLabel = cluster === 'sleep' ? 'sleep' : 'health'

  return [
    `Reviewing ${scoreText}, ${name}…`,
    `Looking at your ${clusterLabel} data. I want to show you one specific thing.`,
    `Finding what matters most in your profile right now.`,
    `Almost done, ${name}. I want to get this right.`,
  ]
}

export function MiaVideoPlayer({ videoId, name, score = null, cluster = 'weight', onStarted, onFinished, onUpgrade }: Props) {
  const [poll, setPoll]           = useState<PollState>({ status: 'pending', videoUrl: null, error: null })
  const [played, setPlayed]       = useState(false)
  const [msgIndex, setMsgIndex]   = useState(0)
  const videoRef                  = useRef<HTMLVideoElement>(null)
  const pollCount                 = useRef(0)
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgIntervalRef            = useRef<ReturnType<typeof setInterval> | null>(null)

  const messages = getAnalyzingMessages(name, score, cluster)

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
      <div className="flex flex-col items-center justify-center gap-8 py-14 px-4">
        {/* Avatar pulse */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 opacity-30 animate-ping" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-2xl font-bold text-violet-600">
            M
          </div>
        </div>

        {/* Cycling message — personal, not generic */}
        <div className="text-center max-w-xs">
          <p
            key={msgIndex}
            className="text-gray-800 dark:text-white font-medium leading-snug animate-fade-in"
          >
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

  // ── Error state ────────────────────────────────────────────────────────────
  if (poll.status === 'failed' || !poll.videoUrl) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 px-4 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {poll.error ?? 'Something went wrong generating your video.'}
        </p>
        <button
          onClick={onUpgrade}
          className="text-violet-600 underline text-sm"
        >
          Continue to your plan →
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
