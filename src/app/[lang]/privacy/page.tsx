import type { Metadata } from 'next'
import Link from 'next/link'
import { SUPPORTED_LANGS } from '../../../lib/instruments'

const BASE = 'https://solviqlab.com'

interface PageProps { params: { lang: string } }

export function generateStaticParams() {
  return SUPPORTED_LANGS.map(lang => ({ lang }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const { lang } = params
  return {
    title: 'Privacy Policy | SolviqLab',
    description: 'Learn how SolviqLab handles your data. We keep calculations in your browser — no registration, no tracking, no ads.',
    alternates: {
      canonical: `${BASE}/${lang}/privacy`,
      languages: Object.fromEntries(SUPPORTED_LANGS.map(l => [l, `${BASE}/${l}/privacy`])),
    },
  }
}

const SECTIONS = [
  {
    title: '1. Who We Are',
    body: `SolviqLab (solviqlab.com) is a free online calculator platform providing tools for health, finance, mathematics, and unit conversions. For privacy inquiries, contact us at privacy@solviqlab.com.`,
  },
  {
    title: '2. What Data We Collect',
    body: `We are designed to be private by default.\n\n• Calculations — all formulas run entirely in your browser. No calculation inputs or results are sent to our servers.\n• Quiz & assessment results — stored only in your browser's localStorage. We do not transmit them.\n• AI Coach sessions — when you interact with Mia or Alex (our AI coaches), your messages are sent to the DeepSeek API to generate responses. No personally identifiable information is required. We do not store chat logs on our servers.\n• Analytics (optional) — if you accept analytics cookies, we use Microsoft Clarity to understand how visitors interact with the platform. This data is anonymised and governed by Microsoft's Privacy Policy.`,
  },
  {
    title: '3. Cookies & Local Storage',
    body: `We use browser localStorage to remember your preferences (theme, language, quiz scores, favourite calculators). These stay on your device and are never sent to our servers.\n\nIf you accept optional analytics cookies, we set cookies for Microsoft Clarity. You can change your preferences at any time using the Cookie Settings link in the footer.`,
  },
  {
    title: '4. Third-Party Services',
    body: `• DeepSeek API — powers our AI coaching features. When you use Mia or Alex, conversation messages are processed by DeepSeek. See: https://www.deepseek.com/privacy\n• Microsoft Clarity — session analytics, only with your consent. See: https://privacy.microsoft.com\n• Vercel — our hosting provider processes request metadata (IP address, user agent) under their Privacy Policy.`,
  },
  {
    title: '5. Your Rights (GDPR / CCPA)',
    body: `You have the right to:\n• Access the data we hold about you\n• Request deletion of your data\n• Object to processing\n• Withdraw consent at any time\n\nSince we store almost nothing server-side, most of your data is already under your control (it's in your browser). To exercise any right, email us at privacy@solviqlab.com.`,
  },
  {
    title: '6. Data Retention',
    body: `We do not retain calculation inputs or results. AI coach conversation data processed via DeepSeek API is governed by their retention policies. Analytics data collected via Microsoft Clarity is retained per their terms.`,
  },
  {
    title: '7. Children',
    body: `SolviqLab is not directed at children under 13. We do not knowingly collect personal data from children. If you believe a child has provided personal data, contact us and we will delete it promptly.`,
  },
  {
    title: '8. Changes to This Policy',
    body: `We may update this policy from time to time. The date at the top of this page will reflect the latest revision. Continued use of SolviqLab after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: '9. Contact',
    body: `For any privacy-related questions or requests:\nEmail: privacy@solviqlab.com\nWebsite: https://solviqlab.com/en/contact`,
  },
]

export default function PrivacyPage({ params }: PageProps) {
  const { lang } = params
  const lastUpdated = 'July 27, 2026'

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href={`/${lang}`} className="hover:text-blue-600 transition-colors">SolviqLab</Link>
          <span>›</span>
          <span className="text-slate-900 dark:text-white">Privacy Policy</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Privacy Policy</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Last updated: {lastUpdated}</p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
              TL;DR — Calculations happen in your browser. We don't require registration. We don't sell your data. The AI coach uses DeepSeek API. Analytics only with your consent.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map(section => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{section.title}</h2>
              <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-sm">
          <Link href={`/${lang}/terms`} className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</Link>
          <Link href={`/${lang}/contact`} className="text-blue-600 dark:text-blue-400 hover:underline">Contact Us</Link>
          <Link href={`/${lang}`} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">← Back to SolviqLab</Link>
        </div>
      </div>
    </div>
  )
}
