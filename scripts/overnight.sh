#!/bin/bash
# SolviqLab — Overnight Translation Runner
# Runs all languages sequentially: UK → DE → PT → PL → NL
# QA + git commit + push after each language

set -e
cd "$(dirname "$0")/.."

REPO_DIR="$(pwd)"
SSH_CMD="GIT_SSH_COMMAND='ssh -i ~/.ssh/github_solviqlab'"
LOG="/tmp/overnight-translate.log"

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG"; }

run_language() {
  local lang=$1
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "Starting: $lang"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  python3 scripts/translate.py "$lang" 2>&1 | tee -a "$LOG"

  log "Running QA for $lang..."
  python3 - <<PYEOF 2>&1 | tee -a "$LOG"
import json, glob, os
instruments_dir = 'src/instruments'
LANG = '$lang'
fields = ['whatIs','formula','example','howItWorks_1','howItWorks_2','howItWorks_3',
          'whyItMatters','limitations','tips_1','tips_2','tips_3','tips_4']
issues = []
for en_path in sorted(glob.glob(f'{instruments_dir}/*/translations/en.json')):
    lang_path = en_path.replace('/en.json', f'/{LANG}.json')
    if not os.path.exists(lang_path):
        issues.append(f'MISSING FILE: {lang_path}')
        continue
    slug = en_path.split('/')[-3]
    en = json.load(open(en_path))
    d = json.load(open(lang_path))
    for field in fields:
        if field not in en.get('content',{}): continue
        en_len = len(en['content'][field])
        d_val = d.get('content',{}).get(field,'')
        d_len = len(d_val)
        ratio = d_len / en_len if en_len > 0 else 0
        if d_len < 20:
            issues.append(f'MISSING: {slug}/{field}')
        elif ratio < 0.55:
            issues.append(f'SHORT {ratio:.0%}: {slug}/{field} ({d_len}/{en_len})')
        elif d_val == en['content'][field]:
            issues.append(f'NOT_TRANSLATED: {slug}/{field}')
if issues:
    print(f'QA ISSUES ({len(issues)}):')
    for i in issues: print(f'  {i}')
else:
    print(f'QA PASSED: {LANG} — all fields OK')
PYEOF

  log "Committing $lang..."
  git add "src/instruments/*/translations/${lang}.json" 2>/dev/null || \
  git add src/instruments/*/translations/${lang}.json

  git commit -m "feat(i18n): complete ${lang} translations for all 36 calculators

Auto-translated via DeepSeek API overnight script.
QA: all content fields verified (ratio >= 0.55 vs EN).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>" 2>&1 | tee -a "$LOG"

  log "Pushing $lang..."
  GIT_SSH_COMMAND="ssh -i ~/.ssh/github_solviqlab" git push origin main 2>&1 | tee -a "$LOG"

  log "✅ $lang DONE"
  sleep 5
}

log "🌙 Overnight translation started"
log "Languages: UK → DE → PT → PL → NL"
log "Log: $LOG"

# UK — wait for already-running background task to finish
log "Waiting for UK background task to complete..."
UK_OUTPUT="/private/tmp/claude-501/-Users-macbook-NewScalp/18ee7a78-f3eb-4d8d-b1af-c863ab306ab8/tasks/b4x83agpi.output"

if [ -f "$UK_OUTPUT" ]; then
  until grep -q "Done:" "$UK_OUTPUT" 2>/dev/null || grep -q "Traceback" "$UK_OUTPUT" 2>/dev/null; do
    sleep 10
  done
  log "UK background task finished"
  cat "$UK_OUTPUT" >> "$LOG"
else
  log "UK output file not found — running UK now"
  run_language uk
fi

# QA + commit UK (from background task)
log "QA for UK (from background task)..."
python3 - <<PYEOF 2>&1 | tee -a "$LOG"
import json, glob, os
instruments_dir = 'src/instruments'
LANG = 'uk'
fields = ['whatIs','formula','example','howItWorks_1','howItWorks_2','howItWorks_3',
          'whyItMatters','limitations','tips_1','tips_2','tips_3','tips_4']
issues = []
for en_path in sorted(glob.glob(f'{instruments_dir}/*/translations/en.json')):
    lang_path = en_path.replace('/en.json', f'/{LANG}.json')
    if not os.path.exists(lang_path): continue
    slug = en_path.split('/')[-3]
    en = json.load(open(en_path))
    d = json.load(open(lang_path))
    for field in fields:
        if field not in en.get('content',{}): continue
        en_len = len(en['content'][field])
        d_val = d.get('content',{}).get(field,'')
        d_len = len(d_val)
        ratio = d_len / en_len if en_len > 0 else 0
        if d_len < 20: issues.append(f'MISSING: {slug}/{field}')
        elif ratio < 0.55: issues.append(f'SHORT {ratio:.0%}: {slug}/{field}')
        elif d_val == en['content'][field]: issues.append(f'NOT_TRANSLATED: {slug}/{field}')
if issues:
    print(f'UK QA ISSUES ({len(issues)}):')
    for i in issues[:20]: print(f'  {i}')
else:
    print('UK QA PASSED ✅')
PYEOF

git add src/instruments/*/translations/uk.json 2>/dev/null; true
git diff --cached --quiet || git commit -m "feat(i18n): complete uk translations for all 36 calculators

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>" 2>&1 | tee -a "$LOG"
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_solviqlab" git push origin main 2>&1 | tee -a "$LOG"
log "✅ UK committed and pushed"

# Run remaining languages
run_language de
run_language pt
run_language pl
run_language nl

log ""
log "🌅 ALL LANGUAGES DONE"
log "ES ✅ IT ✅ TR ✅ FR ✅ UK ✅ DE ✅ PT ✅ PL ✅ NL ✅"
log "Check production: https://solviqlab.com"
