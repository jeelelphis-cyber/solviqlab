#!/usr/bin/env node
// Validates that all locale files have the same keys as en.json
// Also checks per-instrument translation files

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LOCALES_DIR = path.join(ROOT, 'src/locales')
const INSTRUMENTS_DIR = path.join(ROOT, 'src/instruments')
const LANGS = ['uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl']

let errors = 0

// ── 1. Global UI locale files ─────────────────────────────────────────────────

const enGlobal = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'))
const enKeys = Object.keys(enGlobal)

console.log(`\n=== Global locale files (${enKeys.length} keys in en.json) ===\n`)

for (const lang of LANGS) {
  const file = path.join(LOCALES_DIR, `${lang}.json`)
  if (!fs.existsSync(file)) {
    console.log(`❌ MISSING FILE: ${lang}.json`)
    errors++
    continue
  }
  const dict = JSON.parse(fs.readFileSync(file, 'utf8'))
  const missing = enKeys.filter(k => !(k in dict))
  if (missing.length === 0) {
    console.log(`✅ ${lang}.json — all ${enKeys.length} keys present`)
  } else {
    console.log(`❌ ${lang}.json — missing ${missing.length} keys:`)
    missing.forEach(k => console.log(`     - ${k}`))
    errors += missing.length
  }
}

// ── 2. Per-instrument translation files ──────────────────────────────────────

console.log(`\n=== Per-instrument translation files ===\n`)

if (!fs.existsSync(INSTRUMENTS_DIR)) {
  console.log('⚠️  src/instruments/ not found — skipping instrument check')
} else {
  const instruments = fs.readdirSync(INSTRUMENTS_DIR).filter(d =>
    fs.statSync(path.join(INSTRUMENTS_DIR, d)).isDirectory()
  )

  for (const slug of instruments) {
    const translDir = path.join(INSTRUMENTS_DIR, slug, 'translations')
    if (!fs.existsSync(translDir)) continue

    const enFile = path.join(translDir, 'en.json')
    if (!fs.existsSync(enFile)) {
      console.log(`⚠️  ${slug}: no en.json`)
      continue
    }

    const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'))
    const topKeys = Object.keys(enData)
    let slugOk = true

    for (const lang of LANGS) {
      const langFile = path.join(translDir, `${lang}.json`)
      if (!fs.existsSync(langFile)) {
        console.log(`❌ ${slug}/${lang}.json — FILE MISSING`)
        errors++
        slugOk = false
        continue
      }
      const langData = JSON.parse(fs.readFileSync(langFile, 'utf8'))
      const missingTopKeys = topKeys.filter(k => !(k in langData))
      if (missingTopKeys.length > 0) {
        console.log(`❌ ${slug}/${lang}.json — missing sections: ${missingTopKeys.join(', ')}`)
        errors++
        slugOk = false
      }
    }
    if (slugOk) console.log(`✅ ${slug}`)
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`)
if (errors === 0) {
  console.log('✅ All locale files are complete.\n')
  process.exit(0)
} else {
  console.log(`❌ ${errors} issue(s) found. Fix before deploying.\n`)
  process.exit(1)
}
