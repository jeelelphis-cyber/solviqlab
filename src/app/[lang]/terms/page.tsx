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
    title: 'Terms of Service | SolviqLab',
    description: 'Terms of Service for SolviqLab — free professional calculators for health, finance, math and unit conversions.',
    alternates: {
      canonical: `${BASE}/${lang}/terms`,
      languages: Object.fromEntries(SUPPORTED_LANGS.map(l => [l, `${BASE}/${l}/terms`])),
    },
  }
}

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using SolviqLab (solviqlab.com), you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.`,
  },
  {
    title: '2. Description of Service',
    body: `SolviqLab provides free online calculators for health, finance, mathematics, and unit conversions. We also offer AI-powered coaching through Mia (health) and Alex (finance), powered by the DeepSeek API.\n\nAll core features are free and require no account or registration.`,
  },
  {
    title: '3. Not Professional Advice',
    body: `SolviqLab calculators and AI coaching features are for informational and educational purposes only.\n\n• Health calculators are NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.\n• Finance calculators are NOT financial advice. Consult a licensed financial advisor before making financial decisions.\n• Results are estimates based on widely-accepted formulas. Accuracy depends on inputs provided.`,
  },
  {
    title: '4. Permitted Use',
    body: `You may use SolviqLab for personal, non-commercial purposes. You agree not to:\n• Attempt to reverse-engineer, scrape, or overload our services\n• Use automated tools to mass-query our calculators or AI features\n• Misrepresent SolviqLab results as certified medical or financial assessments\n• Use the platform for any unlawful purpose`,
  },
  {
    title: '5. Intellectual Property',
    body: `All content, design, formulas, and AI coaching experiences on SolviqLab are the property of SolviqLab or its licensors. You may share calculator results for personal use, but may not reproduce or redistribute our platform content commercially without written permission.`,
  },
  {
    title: '6. Disclaimer of Warranties',
    body: `SolviqLab is provided "as is" without warranties of any kind, express or implied. We do not guarantee that:\n• Results will be accurate for every individual scenario\n• The service will be available without interruption\n• The AI coaching responses will be error-free\n\nWe strive for accuracy using WHO, CFPB, NIST, and ISO standards, but cannot guarantee results for every edge case.`,
  },
  {
    title: '7. Limitation of Liability',
    body: `To the fullest extent permitted by law, SolviqLab shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including reliance on calculator results or AI coaching output.`,
  },
  {
    title: '8. Third-Party Services',
    body: `SolviqLab uses third-party services including DeepSeek (AI), Microsoft Clarity (analytics, with consent), and Vercel (hosting). Your use of these services is also governed by their respective terms.`,
  },
  {
    title: '9. Changes to Terms',
    body: `We reserve the right to update these Terms at any time. Continued use of SolviqLab after changes are posted constitutes your acceptance of the revised Terms. The effective date will be updated at the top of this page.`,
  },
  {
    title: '10. Governing Law',
    body: `These Terms are governed by applicable law. Any disputes shall be resolved through good-faith negotiation. For any legal inquiries, contact legal@solviqlab.com.`,
  },
  {
    title: '11. Contact',
    body: `Questions about these Terms? Contact us at:\nEmail: legal@solviqlab.com\nWebsite: https://solviqlab.com/en/contact`,
  },
]

export default function TermsPage({ params }: PageProps) {
  const { lang } = params
  const lastUpdated = 'July 27, 2026'

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href={`/${lang}`} className="hover:text-blue-600 transition-colors">SolviqLab</Link>
          <span>›</span>
          <span className="text-slate-900 dark:text-white">Terms of Service</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Terms of Service</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Last updated: {lastUpdated}</p>
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              Important: SolviqLab calculators and AI coaching are for informational purposes only — not medical or financial advice.
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
          <Link href={`/${lang}/privacy`} className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>
          <Link href={`/${lang}/contact`} className="text-blue-600 dark:text-blue-400 hover:underline">Contact Us</Link>
          <Link href={`/${lang}`} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">← Back to SolviqLab</Link>
        </div>
      </div>
    </div>
  )
}
