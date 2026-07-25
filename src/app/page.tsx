import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SolviqLab — Free Professional Calculators',
}

// Fallback only — middleware.ts handles geo + Accept-Language detection first.
// This page only runs if middleware somehow passes through (e.g. local dev).
export default function RootPage() {
  redirect('/en')
}
