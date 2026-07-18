import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export interface InstrumentMeta {
  slug: string
  name: string
  seoTitle: string
  seoDescription: string
  primaryKeyword: string
  category: string
  type: string
  isYMYL: boolean
  status: string
  related: string[]
}

interface ManifestRaw {
  slug?: string
  name?: string
  seoTitle?: string
  seoDescription?: string
  primaryKeyword?: string
  category?: string
  type?: string
  isYMYL?: boolean
  status?: string
  related?: string[]
}

const INSTRUMENTS_DIR = join(process.cwd(), 'src', 'instruments')

export const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it'] as const

export const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🔢' },
  { id: 'health', label: 'Health', icon: '❤️' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'math', label: 'Math', icon: '🧮' },
  { id: 'conversion', label: 'Converters', icon: '🔄' },
] as const

function parseManifest(slug: string): InstrumentMeta | null {
  const manifestPath = join(INSTRUMENTS_DIR, slug, 'manifest.json')
  if (!existsSync(manifestPath)) return null
  try {
    const raw = JSON.parse(readFileSync(manifestPath, 'utf-8')) as ManifestRaw
    return {
      slug: raw.slug ?? slug,
      name: raw.name ?? slug,
      seoTitle: raw.seoTitle ?? raw.name ?? slug,
      seoDescription: raw.seoDescription ?? '',
      primaryKeyword: raw.primaryKeyword ?? '',
      category: raw.category ?? 'utility',
      type: raw.type ?? 'calculator',
      isYMYL: raw.isYMYL ?? false,
      status: raw.status ?? 'certified',
      related: raw.related ?? [],
    }
  } catch {
    return null
  }
}

export function getAllInstruments(): InstrumentMeta[] {
  if (!existsSync(INSTRUMENTS_DIR)) return []

  const slugs = readdirSync(INSTRUMENTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  const instruments: InstrumentMeta[] = []
  for (const slug of slugs) {
    const meta = parseManifest(slug)
    if (meta) instruments.push(meta)
  }
  return instruments
}

export function getInstrument(slug: string): InstrumentMeta | null {
  return parseManifest(slug)
}

export function getTranslations(slug: string, lang: string): Record<string, unknown> {
  const tryPath = (l: string) => join(INSTRUMENTS_DIR, slug, 'translations', `${l}.json`)

  for (const l of [lang, 'en']) {
    const path = tryPath(l)
    if (existsSync(path)) {
      try {
        return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>
      } catch {
        // continue
      }
    }
  }
  return {}
}

export function getAllSlugs(): string[] {
  if (!existsSync(INSTRUMENTS_DIR)) return []
  return readdirSync(INSTRUMENTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
}

export const BASE_URL = 'https://solviqlab.com'

export function getProductSegment(category: string): 'calculators' | 'converters' {
  return category === 'conversion' ? 'converters' : 'calculators'
}

export function getInstrumentPath(lang: string, slug: string, category: string): string {
  return `/${lang}/${getProductSegment(category)}/${slug}`
}

export function getInstrumentCanonical(lang: string, slug: string, category: string): string {
  return `${BASE_URL}${getInstrumentPath(lang, slug, category)}`
}

// Returns instruments with name/seoTitle/seoDescription overridden from translations
export function getAllInstrumentsLocalized(lang: string): InstrumentMeta[] {
  const instruments = getAllInstruments()
  if (lang === 'en') return instruments
  return instruments.map(inst => {
    const tr = getTranslations(inst.slug, lang)
    const meta = tr['meta'] as Record<string, string> | undefined
    // Support both {meta: {title}} and flat {title} structures
    const translatedName = meta?.['title'] ?? tr['title'] as string | undefined
    const translatedDesc = meta?.['description'] ?? tr['description'] as string | undefined
    return {
      ...inst,
      name:           translatedName ?? inst.name,
      seoTitle:       translatedName ?? inst.seoTitle,
      seoDescription: translatedDesc ?? inst.seoDescription,
    }
  })
}
