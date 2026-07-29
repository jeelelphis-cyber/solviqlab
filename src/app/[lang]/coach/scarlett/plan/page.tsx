import type { Metadata } from 'next'
import { CoachPlanClient } from '../../../../../components/coach-plan/CoachPlanClient'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl']
export function generateStaticParams() { return SUPPORTED_LANGS.map(lang => ({ lang })) }
export function generateMetadata(): Metadata {
  return { title: 'Your Personal Plan | Scarlett — SolviqLab', robots: { index: false, follow: false } }
}
export default function ScarlettPlanPage({ params }: { params: { lang: string } }) {
  return <CoachPlanClient lang={params.lang} personaId="scarlett" />
}
