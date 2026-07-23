import type { Metadata } from 'next'
import { SUPPORTED_LANGS } from '../../../lib/instruments'
import { DashboardClient } from '../../../components/user/DashboardClient'

const BASE = 'https://solviqlab.com'

interface PageProps {
  params: { lang: string }
}

export function generateStaticParams() {
  return SUPPORTED_LANGS.map(lang => ({ lang }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const { lang } = params
  return {
    title: 'My Dashboard | SolviqLab',
    description: 'Your Personal Health Profile — journey progress, health domain confidence, recommendations, and result history.',
    alternates: {
      canonical: `${BASE}/${lang}/dashboard`,
      languages: Object.fromEntries(SUPPORTED_LANGS.map(l => [l, `${BASE}/${l}/dashboard`])),
    },
    robots: { index: false, follow: false },
  }
}

export default function DashboardPage({ params }: PageProps) {
  const { lang } = params

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <DashboardClient lang={lang} />
    </div>
  )
}
