import type { ReactNode } from 'react'
import { NavBar } from '../../components/layout/NavBar'
import { Footer } from '../../components/layout/Footer'
import { ConsentBanner } from '../../components/consent/ConsentBanner'
import { LangUpdater } from '../../components/layout/LangUpdater'
import { getAllInstrumentsLocalized } from '../../lib/instruments'
import { PlatformProvider } from '../../components/platform/PlatformProvider'
import { AssessmentUnlockedBanner } from '../../components/platform/AssessmentUnlockedBanner'
import { PipelineEventLog } from '../../components/platform/PipelineEventLog'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl']

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
    <PlatformProvider>
      <div className="min-h-screen flex flex-col">
        <LangUpdater lang={params.lang} />
        <NavBar lang={params.lang} slugToName={slugToName} />
        <main className="flex-1">{children}</main>
        <Footer lang={params.lang} />
        <ConsentBanner lang={params.lang} />
        {/* Platform-level overlays — respond to EventBus platform events */}
        <AssessmentUnlockedBanner lang={params.lang} />
        <PipelineEventLog />
      </div>
    </PlatformProvider>
  )
}
