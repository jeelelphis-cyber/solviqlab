import type { ReactNode } from 'react'
import { NavBar } from '../../components/layout/NavBar'
import { Footer } from '../../components/layout/Footer'
import { getAllInstrumentsLocalized } from '../../lib/instruments'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl']

export function generateStaticParams() {
  return SUPPORTED_LANGS.map(lang => ({ lang }))
}

export default function LangLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { lang: string }
}) {
  const instruments = getAllInstrumentsLocalized(params.lang)
  const slugToName: Record<string, string> = {}
  for (const inst of instruments) {
    slugToName[inst.slug] = inst.name
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar lang={params.lang} slugToName={slugToName} />
      <main className="flex-1">{children}</main>
      <Footer lang={params.lang} />
    </div>
  )
}
