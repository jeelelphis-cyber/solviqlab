import type { Metadata } from 'next'
import { SUPPORTED_LANGS } from '../../../lib/instruments'
import { AccountClient } from '../../../components/account/AccountClient'

interface PageProps {
  params: { lang: string }
}

export function generateStaticParams() {
  return SUPPORTED_LANGS.map(lang => ({ lang }))
}

export function generateMetadata(): Metadata {
  return {
    title: 'My Account | SolviqLab',
    description: 'Your personal account — calculation history, saved tools, and profile.',
    robots: { index: false, follow: false },
  }
}

export default function AccountPage({ params }: PageProps) {
  return <AccountClient lang={params.lang} />
}
