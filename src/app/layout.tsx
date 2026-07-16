import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL('https://solviqlab.com'),
  title: {
    default: 'CALCO — Free Online Calculators',
    template: '%s | CALCO',
  },
  description:
    'Professional free calculators for health, finance, math and unit conversions.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        {children}
      </body>
    </html>
  )
}
