import type { Metadata } from 'next'
import { CoachEntryClient } from '../../../../components/coach-entry/CoachEntryClient'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl']
export function generateStaticParams() { return SUPPORTED_LANGS.map(lang => ({ lang })) }
export function generateMetadata(): Metadata {
  return { title: 'Meet Emilia — Your Personal Coach | SolviqLab', robots: { index: false, follow: false } }
}
export default function EmiliaCoachPage({ params }: { params: { lang: string } }) {
  return <CoachEntryClient lang={params.lang} personaId="emilia" />
}
