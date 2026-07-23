import { notFound } from 'next/navigation'
import { AssessmentClient } from '../../../../components/assessment/AssessmentClient'
import { ASSESSMENT_REGISTRY } from '../../../../lib/assessment'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl']

export function generateStaticParams() {
  const clusters = Object.keys(ASSESSMENT_REGISTRY)
  return SUPPORTED_LANGS.flatMap(lang =>
    clusters.map(cluster => ({ lang, cluster }))
  )
}

export const metadata = {
  robots: { index: false, follow: false },
}

export default function AssessmentPage({
  params,
}: {
  params: { lang: string; cluster: string }
}) {
  const { lang, cluster } = params

  if (!ASSESSMENT_REGISTRY[cluster]) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <AssessmentClient cluster={cluster} lang={lang} />
    </div>
  )
}
