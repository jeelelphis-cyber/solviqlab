import type { MetadataRoute } from 'next'
import { getAllInstruments, SUPPORTED_LANGS, getInstrumentCanonical } from '../lib/instruments'

export default function sitemap(): MetadataRoute.Sitemap {
  const instruments = getAllInstruments()
  const base = 'https://solviqlab.com'

  const homeUrls = SUPPORTED_LANGS.map(lang => ({
    url: `${base}/${lang}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 1.0,
  }))

  const instrumentUrls = instruments.flatMap(inst =>
    SUPPORTED_LANGS.map(lang => ({
      url: getInstrumentCanonical(lang, inst.slug, inst.category),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: ['health', 'finance'].includes(inst.category) ? 0.9 : 0.8,
    }))
  )

  return [
    { url: base, lastModified: new Date(), priority: 1.0 },
    ...homeUrls,
    ...instrumentUrls,
  ]
}
