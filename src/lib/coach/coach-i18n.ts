import type { CoachMessageType } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Coach i18n — all user-visible labels outside of copy templates
// Rule: NO English strings outside this file or coach-copy.ts
// ─────────────────────────────────────────────────────────────────────────────

// ── Cluster Labels ────────────────────────────────────────────────────────────

type ClusterLabelMap = Record<string, string>

const CLUSTER_LABELS_EN: ClusterLabelMap = {
  weight:         'Weight',
  sleep:          'Sleep',
  finance:        'Financial',
  pregnancy:      'Pregnancy',
  nutrition:      'Nutrition',
  fitness:        'Fitness',
  mental_health:  'Mental Health',
  cardiovascular: 'Cardiovascular',
}

// Placeholder locales — fill in as translations arrive
const CLUSTER_LABELS_ES: ClusterLabelMap = {
  weight:         'Peso',
  sleep:          'Sueño',
  finance:        'Finanzas',
  pregnancy:      'Embarazo',
  nutrition:      'Nutrición',
  fitness:        'Fitness',
  mental_health:  'Salud Mental',
  cardiovascular: 'Cardiovascular',
}

const CLUSTER_LABELS_DE: ClusterLabelMap = {}
const CLUSTER_LABELS_FR: ClusterLabelMap = {}
const CLUSTER_LABELS_IT: ClusterLabelMap = {}
const CLUSTER_LABELS_PT: ClusterLabelMap = {}
const CLUSTER_LABELS_UK: ClusterLabelMap = {}
const CLUSTER_LABELS_PL: ClusterLabelMap = {}
const CLUSTER_LABELS_NL: ClusterLabelMap = {}
const CLUSTER_LABELS_TR: ClusterLabelMap = {}

const CLUSTER_LABELS_BY_LANG: Record<string, ClusterLabelMap> = {
  en: CLUSTER_LABELS_EN,
  es: CLUSTER_LABELS_ES,
  de: CLUSTER_LABELS_DE,
  fr: CLUSTER_LABELS_FR,
  it: CLUSTER_LABELS_IT,
  pt: CLUSTER_LABELS_PT,
  uk: CLUSTER_LABELS_UK,
  pl: CLUSTER_LABELS_PL,
  nl: CLUSTER_LABELS_NL,
  tr: CLUSTER_LABELS_TR,
}

export function getClusterLabel(cluster: string, lang: string): string {
  return (
    CLUSTER_LABELS_BY_LANG[lang]?.[cluster] ??
    CLUSTER_LABELS_EN[cluster] ??
    cluster
  )
}

// ── Message Type Labels ───────────────────────────────────────────────────────

type TypeLabelMap = Record<CoachMessageType, string>

const TYPE_LABELS_EN: TypeLabelMap = {
  insight:     'Coach insight',
  explanation: 'What this means',
  celebration: 'Well done',
  warning:     'Heads up',
  reflection:  'Reflection',
  preparation: 'Next up',
}

const TYPE_LABELS_ES: TypeLabelMap = {
  insight:     'Perspectiva del coach',
  explanation: 'Qué significa esto',
  celebration: 'Bien hecho',
  warning:     'Atención',
  reflection:  'Reflexión',
  preparation: 'A continuación',
}

const TYPE_LABELS_BY_LANG: Record<string, TypeLabelMap> = {
  en: TYPE_LABELS_EN,
  es: TYPE_LABELS_ES,
}

export function getTypeLabel(type: CoachMessageType, lang: string): string {
  return (
    TYPE_LABELS_BY_LANG[lang]?.[type] ??
    TYPE_LABELS_EN[type]
  )
}
