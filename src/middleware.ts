import { NextRequest, NextResponse } from 'next/server'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl'] as const
const DEFAULT_LANG    = 'en'

// Country → language (Vercel geo)
const COUNTRY_LANG: Record<string, string> = {
  UA: 'uk',  // Ukraine
  ES: 'es',  // Spain
  MX: 'es',  // Mexico
  AR: 'es',  // Argentina
  CO: 'es',  // Colombia
  BR: 'pt',  // Brazil
  PT: 'pt',  // Portugal
  FR: 'fr',  // France
  DE: 'de',  // Germany
  AT: 'de',  // Austria
  CH: 'de',  // Switzerland
  PL: 'pl',  // Poland
  TR: 'tr',  // Turkey
  IT: 'it',  // Italy
  NL: 'nl',  // Netherlands
  BE: 'nl',  // Belgium
}

function detectLang(req: NextRequest): string {
  // 1. Vercel geo header (x-vercel-ip-country) — most reliable, works for VDS/proxy
  const country = req.headers.get('x-vercel-ip-country') ?? req.geo?.country ?? ''
  if (country && COUNTRY_LANG[country]) return COUNTRY_LANG[country]!

  // 2. Accept-Language header — browser preference
  const acceptLang = req.headers.get('accept-language') ?? ''
  for (const part of acceptLang.split(',')) {
    const code = part.trim().split(';')[0]!.toLowerCase().split('-')[0]!
    if ((SUPPORTED_LANGS as readonly string[]).includes(code)) return code
  }

  return DEFAULT_LANG
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip non-page routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/embed') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/og') ||   // OG image generation — must not be lang-prefixed
    pathname.startsWith('/auth') ||  // Auth routes — no lang prefix needed
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // Already has a valid lang prefix — let it through
  const firstSegment = pathname.split('/')[1] ?? ''
  if ((SUPPORTED_LANGS as readonly string[]).includes(firstSegment)) {
    return NextResponse.next()
  }

  // Root or unknown path → redirect to detected language
  const lang    = detectLang(req)
  const url     = req.nextUrl.clone()
  url.pathname  = `/${lang}${pathname === '/' ? '' : pathname}`

  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
