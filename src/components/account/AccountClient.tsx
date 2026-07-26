'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AccountService } from '@/lib/account/service'
import type { HistoryItem, FavoriteItem } from '@/lib/account/service'
import { getT } from '@/lib/i18n/ui'

// ── Graph reader ──────────────────────────────────────────────────────────────

interface GraphProfile {
  name: string | null
  age: number | null
  phase: string | null
  goals: string[]
  assessments: Array<{ clusterId: string; score: number }>
}

function readProfile(): GraphProfile {
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('graph:'))
    if (!key) return { name: null, age: null, phase: null, goals: [], assessments: [] }
    const graph = JSON.parse(localStorage.getItem(key) ?? '{}')
    return {
      name: graph?.identity?.name ?? null,
      age: graph?.identity?.age ?? null,
      phase: graph?.journey?.currentPhase ?? null,
      goals: (graph?.goals?.items ?? []).map((g: { text: string }) => g.text),
      assessments: graph?.assessments?.items ?? [],
    }
  } catch {
    return { name: null, age: null, phase: null, goals: [], assessments: [] }
  }
}

// ── Cluster colors ────────────────────────────────────────────────────────────

const CLUSTER_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  weight:   { bg: 'bg-rose-50 dark:bg-rose-950',   text: 'text-rose-600 dark:text-rose-400',   icon: '⚖️' },
  sleep:    { bg: 'bg-indigo-50 dark:bg-indigo-950', text: 'text-indigo-600 dark:text-indigo-400', icon: '😴' },
  pregnancy:{ bg: 'bg-pink-50 dark:bg-pink-950',   text: 'text-pink-600 dark:text-pink-400',   icon: '🤰' },
  finance:  { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-600 dark:text-emerald-400', icon: '💰' },
  other:    { bg: 'bg-slate-100 dark:bg-slate-800',  text: 'text-slate-600 dark:text-slate-400',  icon: '🧮' },
}

function clusterStyle(cluster: string) {
  return CLUSTER_STYLE[cluster] ?? CLUSTER_STYLE.other!
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Phase label ───────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  awareness:   'Awareness',
  planning:    'Planning',
  action:      'Action',
  maintenance: 'Maintenance',
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'history' | 'favorites'

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ profile, t }: { profile: GraphProfile; t: (k: string, p?: Record<string, string | number>) => string }) {
  const initials = profile.name
    ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {profile.name ?? t('account.anonymous')}
            </h2>
            {profile.age && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('account.age_label', { age: profile.age })}</p>
            )}
            {profile.phase && (
              <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {PHASE_LABELS[profile.phase] ?? profile.phase}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Goals */}
      {profile.goals.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{t('account.your_goals')}</h3>
          <ul className="space-y-2">
            {profile.goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="text-emerald-500 mt-0.5">✓</span>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assessments */}
      {profile.assessments.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{t('account.activity')}</h3>
          <div className="space-y-3">
            {profile.assessments.map((a, i) => {
              const s = clusterStyle(a.clusterId)
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center text-sm`}>
                      {clusterStyle(a.clusterId).icon}
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{a.clusterId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(a.score, 100)}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 w-8 text-right">{a.score}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!profile.name && profile.goals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{t('account.start_cta_title')}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('account.start_cta_desc')}</p>
          <Link
            href="../calculators/bmi-calculator"
            className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            {t('account.start_cta_btn')} →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab({ lang, t }: { lang: string; t: (k: string, p?: Record<string, string | number>) => string }) {
  const [items, setItems] = useState<HistoryItem[]>([])

  useEffect(() => {
    setItems(AccountService.getHistory())
  }, [])

  function clearAll() {
    AccountService.clearHistory()
    setItems([])
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
        <p className="text-3xl mb-2">📋</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{t('account.no_history')}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('account.no_history_sub')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{t('account.history_count', { count: items.length })}</p>
        <button
          onClick={clearAll}
          className="text-xs text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
        >
          {t('account.clear_history')}
        </button>
      </div>
      {items.map((item, i) => {
        const s = clusterStyle(item.cluster)
        const href = `/${lang}/calculators/${item.slug}`
        return (
          <Link
            key={i}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <span className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center text-lg shrink-0`}>
              {s.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {item.value !== null && item.value !== undefined
                  ? `${typeof item.value === 'number' ? item.value.toFixed(1) : item.value}${item.unit ? ` ${item.unit}` : ''}${item.label ? ` · ${item.label}` : ''}`
                  : '—'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-400">{formatDate(item.timestamp)}</p>
              <p className="text-xs text-blue-500 mt-0.5">{t('account.open')} →</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ── Favorites Tab ─────────────────────────────────────────────────────────────

function FavoritesTab({ lang, t }: { lang: string; t: (k: string, p?: Record<string, string | number>) => string }) {
  const [items, setItems] = useState<FavoriteItem[]>([])

  useEffect(() => {
    setItems(AccountService.getFavorites())
  }, [])

  function remove(slug: string) {
    const current = AccountService.getFavorites().find(f => f.slug === slug)
    if (current) { AccountService.toggleFavorite(current); setItems(AccountService.getFavorites()) }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
        <p className="text-3xl mb-2">⭐</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{t('account.no_favorites')}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('account.no_favorites_sub')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => {
        const s = clusterStyle(item.cluster)
        return (
          <div
            key={item.slug}
            className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
          >
            <span className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center text-lg shrink-0`}>
              {s.icon}
            </span>
            <div className="flex-1 min-w-0">
              <Link
                href={`/${lang}/calculators/${item.slug}`}
                className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block"
              >
                {item.name}
              </Link>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{item.cluster}</p>
            </div>
            <button
              onClick={() => remove(item.slug)}
              aria-label="Remove from favorites"
              className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors text-lg"
            >
              ★
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  lang: string
}

export function AccountClient({ lang }: Props) {
  const t = getT(lang)
  const [tab, setTab] = useState<Tab>('overview')
  const [profile, setProfile] = useState<GraphProfile>({ name: null, age: null, phase: null, goals: [], assessments: [] })

  useEffect(() => {
    setProfile(readProfile())
  }, [])

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'overview',  label: t('account.tab_overview'),  icon: '👤' },
    { id: 'history',   label: t('account.tab_history'),   icon: '📋' },
    { id: 'favorites', label: t('account.tab_favorites'), icon: '⭐' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('account.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('account.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'overview'  && <OverviewTab  profile={profile} t={t} />}
      {tab === 'history'   && <HistoryTab   lang={lang} t={t} />}
      {tab === 'favorites' && <FavoritesTab lang={lang} t={t} />}
    </div>
  )
}
