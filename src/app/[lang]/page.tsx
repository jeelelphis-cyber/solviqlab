import type { Metadata } from 'next'
import { getAllInstrumentsLocalized, SUPPORTED_LANGS } from '../../lib/instruments'
import { HomeClient } from '../../components/home/HomeClient'
import { t } from '../../lib/ui-strings'

const BASE = 'https://solviqlab.com'

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const s = t(params.lang)
  const instruments = getAllInstrumentsLocalized(params.lang)
  const count = instruments.length
  const titleText = `SolviqLab — ${count} Free Professional Calculators`
  const description = `Free online calculators for health, finance, math and unit conversions. ${count}+ tools trusted by millions. Based on WHO, CFPB, NIST standards. No sign-up required.`
  const langs = Object.fromEntries(SUPPORTED_LANGS.map(l => [l, `${BASE}/${l}`]))
  return {
    title: { absolute: titleText },
    description,
    alternates: {
      canonical: `${BASE}/${params.lang}`,
      languages: { ...langs, 'x-default': `${BASE}/en` },
    },
    openGraph: {
      title: titleText,
      description,
      url: `${BASE}/${params.lang}`,
      type: 'website',
      images: [{ url: `${BASE}/og/home`, width: 1200, height: 630, alt: 'SolviqLab — Free Calculators' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleText,
      description,
    },
  }
}

const FEATURED_SLUGS = ['bmi-calculator', 'mortgage-calculator', 'tdee-calculator', 'compound-interest-calculator']

export default function HomePage({ params }: { params: { lang: string } }) {
  const instruments = getAllInstrumentsLocalized(params.lang)
  return <HomeClient instruments={instruments} lang={params.lang} />
}
