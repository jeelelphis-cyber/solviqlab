'use client'

// ─────────────────────────────────────────────────────────────────────────────
// RegistrationClient
//
// Shows the user's profile value before they commit to registration.
// Key insight: "Save your Personal Health Profile" (not "Save progress")
// because the profile engine already built something worth saving.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getEngine } from '@/lib/user'
import { getProfileEngineFromUser } from '@/lib/user'
import type { PersonalHealthProfile } from '@/lib/profile'
import { HEALTH_DOMAINS, DOMAIN_META_MAP } from '@/lib/profile'

interface Props {
  readonly lang: string
  readonly redirectTo?: string
}

type Step = 'loading' | 'form' | 'success'

export function RegistrationClient({ lang, redirectTo }: Props) {
  const [step, setStep]         = useState<Step>('loading')
  const [profile, setProfile]   = useState<PersonalHealthProfile | null>(null)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const engine = getEngine()
    const profileEngine = getProfileEngineFromUser()
    if (!engine || !profileEngine) {
      setStep('form')
      return
    }

    const user = engine.getOrCreateUser()
    if (user.type === 'authenticated') {
      router.replace(`/${lang}/dashboard`)
      return
    }

    const p = profileEngine.getProfile(user.id)
    setProfile(p)
    setStep('form')
  }, [lang, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email'); return }

    setError(null)
    setSubmitting(true)

    const engine = getEngine()
    if (engine) {
      engine.upgradeToAuthenticated({
        email: email.trim(),
        display_name: name.trim() || null,
        auth_provider: 'email',
      })
    }

    setStep('success')
    setTimeout(() => {
      router.replace(redirectTo ?? `/${lang}/dashboard`)
    }, 1500)
  }

  // ── Active health domains ────────────────────────────────────────────────────
  const activeDomains = profile
    ? HEALTH_DOMAINS.filter(d => (profile.domains[d]?.confidence ?? 0) > 0)
    : []

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="text-center py-10 space-y-3">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Your profile is saved!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Redirecting to your dashboard…
        </p>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Profile value proposition */}
      {profile && profile.total_signals > 0 && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
              Your Health Profile — {profile.overall_confidence}% complete
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-blue-100 dark:bg-blue-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${profile.overall_confidence}%` }}
              />
            </div>
          </div>

          {activeDomains.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeDomains.map(d => {
                const conf = profile.domains[d]?.confidence ?? 0
                const meta = DOMAIN_META_MAP[d]
                return (
                  <span
                    key={d}
                    className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-slate-600 dark:text-slate-300"
                  >
                    {meta.label} {conf}%
                  </span>
                )
              })}
            </div>
          )}

          <p className="text-xs text-blue-600/80 dark:text-blue-400/70">
            {profile.total_signals} signal{profile.total_signals !== 1 ? 's' : ''} collected across {activeDomains.length} domain{activeDomains.length !== 1 ? 's' : ''} — don&apos;t lose this.
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Name <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="reg-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(null) }}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          />
          {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
        >
          {submitting ? 'Saving…' : 'Save My Health Profile →'}
        </button>
      </form>

      {/* Fine print */}
      <p className="text-xs text-center text-slate-400 dark:text-slate-500 leading-relaxed">
        Free forever. No credit card. All your data stays local until you choose to sync.
      </p>
    </div>
  )
}
