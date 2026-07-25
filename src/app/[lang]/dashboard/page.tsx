import type { Metadata } from 'next'
import { SUPPORTED_LANGS }  from '../../../lib/instruments'
import { JourneyDashboard } from '../../../components/dashboard'

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
    title: 'My Journey | SolviqLab',
    description: 'Your personal journey dashboard — today\'s action, progress, active plan, and coach insights.',
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <JourneyDashboard lang={lang} />
    </div>
  )
}
