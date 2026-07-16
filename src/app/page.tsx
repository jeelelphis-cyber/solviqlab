import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

const SUPPORTED = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl']

export default function RootPage() {
  const acceptLanguage = headers().get('accept-language') ?? 'en'
  const preferred = acceptLanguage
    .split(',')
    .map(s => s.split(';')[0]!.trim().slice(0, 2).toLowerCase())
    .find(code => SUPPORTED.includes(code))
  redirect(`/${preferred ?? 'en'}`)
}
