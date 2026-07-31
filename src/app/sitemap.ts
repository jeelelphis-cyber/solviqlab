import type { MetadataRoute } from 'next'
import { getAllInstruments, SUPPORTED_LANGS, getInstrumentCanonical } from '../lib/instruments'

const CATEGORIES = ['health', 'finance', 'math', 'conversion']
const STATIC_PAGES = ['about', 'contact', 'privacy', 'terms']

export default function sitemap(): MetadataRoute.Sitemap {
  const instruments = getAllInstruments()
  const base = 'https://solviqlab.com'
  const now = new Date()

  const homeUrls = SUPPORTED_LANGS.map(lang => ({
    url: `${base}/${lang}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 1.0,
  }))

  const categoryUrls = CATEGORIES.flatMap(cat =>
    SUPPORTED_LANGS.map(lang => ({
      url: `${base}/${lang}/category/${cat}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  )

  const staticUrls = STATIC_PAGES.flatMap(page =>
    SUPPORTED_LANGS.map(lang => ({
      url: `${base}/${lang}/${page}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }))
  )

  const instrumentUrls = instruments.flatMap(inst =>
    SUPPORTED_LANGS.map(lang => ({
      url: getInstrumentCanonical(lang, inst.slug, inst.category),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: ['health', 'finance'].includes(inst.category) ? 0.9 : 0.8,
    }))
  )

  return [
    { url: base, lastModified: now, priority: 1.0 },
    ...homeUrls,
    ...categoryUrls,
    ...staticUrls,
    ...instrumentUrls,
  ]
}
