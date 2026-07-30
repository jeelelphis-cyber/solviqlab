import type { Metadata } from 'next'
import { CoachEntryClient } from '../../../../components/coach-entry/CoachEntryClient'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl']

export function generateStaticParams() {
  return SUPPORTED_LANGS.map(lang => ({ lang }))
}

export function generateMetadata(): Metadata {
  return {
    title: { absolute: 'Meet Alex — Your Personal Finance Coach | SolviqLab' },
    description: 'Alex has reviewed your results. Get your personal financial plan.',
    robots: { index: false, follow: false },
  }
}

export default function AlexCoachPage({ params }: { params: { lang: string } }) {
  return <CoachEntryClient lang={params.lang} personaId="alex" />
}
