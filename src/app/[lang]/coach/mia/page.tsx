import type { Metadata } from 'next'
import { CoachEntryClient } from '../../../../components/coach-entry/CoachEntryClient'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl']

export function generateStaticParams() {
  return SUPPORTED_LANGS.map(lang => ({ lang }))
}

export function generateMetadata(): Metadata {
  return {
    title: 'Meet Mia — Your Personal Health Coach | SolviqLab',
    description: 'Mia has reviewed your results. Get your personal health plan.',
    robots: { index: false, follow: false },
  }
}

export default function MiaCoachPage({ params }: { params: { lang: string } }) {
  return <CoachEntryClient lang={params.lang} personaId="mia" />
}
