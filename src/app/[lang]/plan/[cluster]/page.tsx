import { notFound } from 'next/navigation'
import { PlannerClient } from '../../../../components/plan/PlannerClient'

const SUPPORTED_LANGS   = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl']
const SUPPORTED_CLUSTERS = ['weight', 'sleep', 'finance']

export function generateStaticParams() {
  return SUPPORTED_LANGS.flatMap(lang =>
    SUPPORTED_CLUSTERS.map(cluster => ({ lang, cluster }))
  )
}

export const metadata = {
  robots: { index: false, follow: false },
}

export default function PlanPage({
  params,
}: {
  params: { lang: string; cluster: string }
}) {
  if (!SUPPORTED_CLUSTERS.includes(params.cluster)) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <PlannerClient cluster={params.cluster} lang={params.lang} />
    </div>
  )
}
