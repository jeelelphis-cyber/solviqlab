'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { getNavCategories } from '../../lib/navigation'
import type { NavCategory } from '../../lib/navigation'

// ── All supported languages (single source of truth) ─────────────────────────
export const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇺🇸', native: 'EN' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦', native: 'UA' },
  { code: 'es', label: 'Español',    flag: '🇪🇸', native: 'ES' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷', native: 'PT' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷', native: 'FR' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪', native: 'DE' },
  { code: 'pl', label: 'Polski',     flag: '🇵🇱', native: 'PL' },
]

// ── Theme Toggle ──────────────────────────────────────────────────────────────
function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
      setDark(true)
    }
  }, [])
  function toggle() {
    if (dark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setDark(true)
    }
  }
  return (
    <button onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

// ── Language Switcher Dropdown ────────────────────────────────────────────────
function LanguageSwitcher({ lang, slug }: { lang: string; slug?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0]!
  const filtered = LANGUAGES.filter(l =>
    l.label.toLowerCase().includes(query.toLowerCase()) ||
    l.native.toLowerCase().includes(query.toLowerCase()) ||
    l.code.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  function select(code: string) {
    setOpen(false)
    setQuery('')
    router.push(slug !== undefined ? `/${code}/${slug}` : `/${code}`)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${
          open
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span>{current.native}</span>
        <span className={`text-xs transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search language…"
              className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-400"
            />
          </div>

          {/* Language list */}
          <div className="max-h-64 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400 text-center">No languages found</p>
            )}
            {filtered.map(l => (
              <button
                key={l.code}
                role="option"
                aria-selected={l.code === lang}
                onClick={() => select(l.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                  l.code === lang
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-lg leading-none">{l.flag}</span>
                <span className="flex-1">{l.label}</span>
                <span className="text-xs text-slate-400 font-mono">{l.native}</span>
                {l.code === lang && <span className="text-blue-500 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Mega Menu Dropdown ────────────────────────────────────────────────────────
function MegaMenu({ category, lang, onClose, slugToName }: { category: NavCategory; lang: string; onClose: () => void; slugToName: Record<string, string> }) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 min-w-[320px] z-50 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xl">{category.icon}</span>
        <span className="font-bold text-slate-900 dark:text-white">{category.label}</span>
      </div>
      <div className="space-y-5">
        {category.subcategories.map(sub => (
          <div key={sub.id}>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              {sub.label}
            </p>
            <div className="space-y-1">
              {sub.instruments.map(slug => (
                <Link
                  key={slug}
                  href={`/${lang}/${slug}`}
                  onClick={onClose}
                  className="block px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {slugToName[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Link
          href={`/${lang}/category/${category.id}`}
          onClick={onClose}
          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all {category.label} →
        </Link>
      </div>
    </div>
  )
}

// ── Nav Category Button ───────────────────────────────────────────────────────
function NavCategoryBtn({ category, lang, slugToName }: { category: NavCategory; lang: string; slugToName: Record<string, string> }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          open
            ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
            : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>{category.icon}</span>
        {category.label}
        <span className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <MegaMenu category={category} lang={lang} onClose={() => setOpen(false)} slugToName={slugToName} />}
    </div>
  )
}

// ── Mobile Accordion ──────────────────────────────────────────────────────────
function MobileMenu({ lang, onClose, slugToName }: { lang: string; onClose: () => void; slugToName: Record<string, string> }) {
  const [openCat, setOpenCat] = useState<string | null>(null)
  const categories = getNavCategories(lang)
  return (
    <div className="md:hidden border-t border-slate-100 dark:border-slate-800 pb-4">
      {categories.map(cat => (
        <div key={cat.id}>
          <button
            onClick={() => setOpenCat(o => o === cat.id ? null : cat.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-2"><span>{cat.icon}</span>{cat.label}</span>
            <span className={`text-xs transition-transform ${openCat === cat.id ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {openCat === cat.id && (
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 pb-3">
              {cat.subcategories.map(sub => (
                <div key={sub.id} className="mb-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-3 mb-1">{sub.label}</p>
                  {sub.instruments.map(slug => (
                    <Link
                      key={slug}
                      href={`/${lang}/${slug}`}
                      onClick={onClose}
                      className="block py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {slugToName[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </Link>
                  ))}
                </div>
              ))}
              <Link
                href={`/${lang}/category/${cat.id}`}
                onClick={onClose}
                className="inline-block mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400"
              >
                View all →
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── NavBar ────────────────────────────────────────────────────────────────────
export function NavBar({ lang, slugToName = {} }: { lang: string; slugToName?: Record<string, string> }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  const slug: string | undefined = parts.length >= 2 ? parts[1] : undefined

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href={`/${lang}`} className="flex-shrink-0">
            <span className="text-xl font-bold">
              <span className="text-blue-600">C</span>
              <span className="text-slate-900 dark:text-white">ALCO</span>
            </span>
          </Link>

          {/* Desktop Mega Menu */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {getNavCategories(lang).map(cat => (
              <NavCategoryBtn key={cat.id} category={cat} lang={lang} slugToName={slugToName} />
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher lang={lang} {...(slug ? { slug } : {})} />
            <ThemeToggle />
            <button
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && <MobileMenu lang={lang} onClose={() => setMenuOpen(false)} slugToName={slugToName} />}
    </nav>
  )
}
