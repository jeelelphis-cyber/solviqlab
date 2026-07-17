import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL('https://solviqlab.com'),
  title: {
    default: 'SolviqLab — Free Professional Calculators',
    template: '%s | SolviqLab',
  },
  description:
    'Free professional calculators for health, finance, math and unit conversions. Trusted results based on WHO, CFPB, NIST standards.',
  icons: {
    icon: '/favicon.svg',
  },
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SolviqLab',
  url: 'https://solviqlab.com',
  logo: 'https://solviqlab.com/favicon.svg',
  description: 'Free professional calculators for health, finance, math and unit conversions.',
  contactPoint: { '@type': 'ContactPoint', contactType: 'Support', email: 'support@solviqlab.com' },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'SolviqLab',
  url: 'https://solviqlab.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://solviqlab.com/en/{search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
}

const GA_ID = 'G-1Z0SK0JS6Z'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        `}} />
      </head>
      <body className="font-sans antialiased bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        {children}
      </body>
    </html>
  )
}
