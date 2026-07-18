import { permanentRedirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SolviqLab — Free Professional Calculators',
}

const SUPPORTED = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr']

export default function RootPage() {
  const acceptLanguage = headers().get('accept-language') ?? 'en'
  const preferred = acceptLanguage
    .split(',')
    .map(s => s.split(';')[0]!.trim().slice(0, 2).toLowerCase())
    .find(code => SUPPORTED.includes(code))
  permanentRedirect(`/${preferred ?? 'en'}`)
}
