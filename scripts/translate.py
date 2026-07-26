#!/usr/bin/env python3
"""
SolviqLab — DeepSeek Full Translation Script
Usage: python3 scripts/translate.py <lang>
Example: python3 scripts/translate.py uk

Translates ALL fields in calculator JSON files:
meta, form, validation, result, faq, aria, content
Cost: ~$0.05-0.10 per language for all 36 calculators.
"""

import json
import glob
import sys
import os
import time
import urllib.request
import urllib.error

# ── Config ────────────────────────────────────────────────────────────────────

INSTRUMENTS_DIR = os.path.join(os.path.dirname(__file__), '../src/instruments')
DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

LANG_NAMES = {
    'uk': 'Ukrainian',
    'de': 'German',
    'pt': 'Portuguese (Brazilian)',
    'pl': 'Polish',
    'nl': 'Dutch',
    'es': 'Spanish',
    'fr': 'French',
    'it': 'Italian',
    'tr': 'Turkish',
}

# Fields that should NOT be translated (keep as-is)
DO_NOT_TRANSLATE = {
    'bmi', 'BMI', 'kg', 'lb', 'cm', 'ft', 'in', 'kcal',
    'SolviqLab', 'WHO', 'CDC', 'NIH', 'BMR', 'TDEE',
}

# Content fields (long SEO text)
CONTENT_FIELDS = [
    'whatIs', 'formula', 'example',
    'howItWorks_1', 'howItWorks_2', 'howItWorks_3',
    'whyItMatters', 'limitations',
    'tips_0', 'tips_1', 'tips_2', 'tips_3', 'tips_4',
]

# ── DeepSeek API ──────────────────────────────────────────────────────────────

def deepseek_translate(text: str, lang: str, field_context: str = '') -> str:
    """Translate a single string to target language."""
    if not text or len(text.strip()) < 2:
        return text

    lang_name = LANG_NAMES.get(lang, lang)

    system = (
        f"You are a professional translator for a health and finance calculator platform. "
        f"Translate to {lang_name}. "
        f"Rules: "
        f"1. Keep technical terms accurate (BMI, TDEE, BMR, WHO, CDC, NIH stay as-is). "
        f"2. Keep brand name 'SolviqLab' unchanged. "
        f"3. Keep URLs, code, units (kg, lb, cm, ft, kcal) unchanged. "
        f"4. Keep placeholder variables like {{min}}, {{max}}, {{bmi}}, {{category}} unchanged. "
        f"5. Preserve all line breaks and formatting. "
        f"6. Return ONLY the translated text, no explanations."
    )
    if field_context:
        system += f" This is a {field_context}."

    payload = json.dumps({
        'model': 'deepseek-chat',
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': text},
        ],
        'temperature': 0.2,
        'max_tokens': 4096,
    }).encode('utf-8')

    req = urllib.request.Request(
        DEEPSEEK_URL,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {DEEPSEEK_API_KEY}',
        },
        method='POST',
    )

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                return result['choices'][0]['message']['content'].strip()
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if e.code == 429:
                print(f"      ⏳ Rate limit, waiting 15s...")
                time.sleep(15)
            else:
                print(f"      ❌ HTTP {e.code}: {body[:100]}")
                return text
        except Exception as ex:
            print(f"      ⚠️  Error attempt {attempt+1}: {ex}")
            time.sleep(5)

    return text


def needs_translation(en_val: str, existing_val: str) -> bool:
    """True if field needs (re)translation."""
    if not existing_val or len(existing_val.strip()) < 2:
        return True
    if existing_val == en_val:
        return True  # EN copy — not translated
    en_len = len(en_val)
    ex_len = len(existing_val)
    ratio = ex_len / en_len if en_len > 0 else 1
    if ratio < 0.6:
        return True  # Too short — probably truncated
    return False


# ── Translate flat dict (e.g. form, validation, aria) ────────────────────────

def translate_flat(en_dict: dict, existing_dict: dict, lang: str, section: str) -> dict:
    """Translate all string values in a flat dict."""
    result = dict(existing_dict)
    for key, en_val in en_dict.items():
        if not isinstance(en_val, str):
            continue
        existing_val = existing_dict.get(key, '')
        if not needs_translation(en_val, existing_val):
            continue
        print(f"      → {section}.{key}")
        result[key] = deepseek_translate(en_val, lang, f"UI label for calculator ({section})")
        time.sleep(0.4)
    return result


def translate_nested(en_dict: dict, existing_dict, lang: str, section: str) -> dict:
    """Translate nested dict (e.g. result.categories)."""
    if not isinstance(existing_dict, dict):
        existing_dict = {}
    result = dict(existing_dict)
    for key, en_val in en_dict.items():
        if isinstance(en_val, dict):
            result[key] = translate_nested(
                en_val,
                existing_dict.get(key, {}),
                lang,
                f"{section}.{key}"
            )
        elif isinstance(en_val, str):
            existing_val = existing_dict.get(key, '')
            if not needs_translation(en_val, existing_val):
                continue
            print(f"      → {section}.{key}")
            result[key] = deepseek_translate(en_val, lang, f"calculator result label")
            time.sleep(0.4)
    return result


# ── Translate FAQ ─────────────────────────────────────────────────────────────

def translate_faq(en_faq: dict, existing_faq: dict, lang: str) -> dict:
    """Translate FAQ section."""
    result = dict(existing_faq)
    for key, en_val in en_faq.items():
        if not isinstance(en_val, str):
            continue
        existing_val = existing_faq.get(key, '')
        if not needs_translation(en_val, existing_val):
            continue
        ctx = "FAQ question" if key.startswith('q') else "FAQ answer" if key.startswith('a') else "FAQ title"
        print(f"      → faq.{key}")
        result[key] = deepseek_translate(en_val, lang, ctx)
        time.sleep(0.5)
    return result


# ── Translate content (long SEO text) ────────────────────────────────────────

def translate_content(en_content: dict, existing_content: dict, lang: str) -> dict:
    """Translate content section (SEO text)."""
    result = dict(existing_content)
    for field in CONTENT_FIELDS:
        if field not in en_content:
            continue
        en_val = en_content[field]
        existing_val = existing_content.get(field, '')
        if not needs_translation(en_val, existing_val):
            continue
        print(f"      → content.{field} ({len(en_val)} chars)")
        result[field] = deepseek_translate(en_val, lang, f"SEO article section '{field}'")
        time.sleep(0.8)  # Longer delay for big content
    return result


# ── QA Check ─────────────────────────────────────────────────────────────────

def qa_check(en_data: dict, lang_data: dict, slug: str) -> list:
    issues = []
    en_content = en_data.get('content', {})
    lang_content = lang_data.get('content', {})

    for field in CONTENT_FIELDS:
        if field not in en_content:
            continue
        en_len = len(en_content[field])
        d_len = len(lang_content.get(field, ''))
        ratio = d_len / en_len if en_len > 0 else 0
        if d_len < 20:
            issues.append(f"❌ MISSING: content.{field}")
        elif ratio < 0.55:
            issues.append(f"⚠️  SHORT {ratio:.0%}: content.{field} ({d_len}/{en_len})")
        elif lang_content.get(field) == en_content.get(field):
            issues.append(f"⚠️  NOT TRANSLATED: content.{field}")

    return issues


# ── Translate one calculator ──────────────────────────────────────────────────

def translate_calculator(slug: str, lang: str, en_data: dict, existing: dict) -> dict:
    result = json.loads(json.dumps(existing))  # deep copy

    # meta
    if 'meta' in en_data:
        print(f"    [meta]")
        result['meta'] = translate_flat(en_data['meta'], existing.get('meta', {}), lang, 'meta')

    # form (UI labels)
    if 'form' in en_data:
        print(f"    [form]")
        result['form'] = translate_flat(en_data['form'], existing.get('form', {}), lang, 'form')

    # validation (error messages)
    if 'validation' in en_data:
        print(f"    [validation]")
        result['validation'] = translate_flat(en_data['validation'], existing.get('validation', {}), lang, 'validation')

    # result (labels + nested categories, or plain string)
    if 'result' in en_data:
        print(f"    [result]")
        en_result = en_data['result']
        if isinstance(en_result, str):
            existing_val = existing.get('result', '')
            if needs_translation(en_result, existing_val if isinstance(existing_val, str) else ''):
                print(f"      → result")
                result['result'] = deepseek_translate(en_result, lang, 'result label')
                time.sleep(0.3)
        elif isinstance(en_result, dict):
            result['result'] = translate_nested(en_result, existing.get('result', {}), lang, 'result')

    # aria
    if 'aria' in en_data:
        print(f"    [aria]")
        result['aria'] = translate_flat(en_data['aria'], existing.get('aria', {}), lang, 'aria')

    # faq
    if 'faq' in en_data:
        print(f"    [faq]")
        result['faq'] = translate_faq(en_data['faq'], existing.get('faq', {}), lang)

    # content (long SEO text — most important)
    if 'content' in en_data:
        print(f"    [content]")
        result['content'] = translate_content(en_data['content'], existing.get('content', {}), lang)

    return result


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/translate.py <lang>")
        print("Languages: uk, de, pt, pl, nl, es, fr, it, tr")
        sys.exit(1)

    lang = sys.argv[1].lower()
    if lang not in LANG_NAMES:
        print(f"Unknown language: {lang}")
        print(f"Available: {', '.join(LANG_NAMES.keys())}")
        sys.exit(1)

    lang_name = LANG_NAMES[lang]

    # Optional: translate only one calculator for testing
    test_slug = sys.argv[2] if len(sys.argv) > 2 else None

    print(f"\n🌐 Translating to {lang_name} ({lang})")
    if test_slug:
        print(f"   TEST MODE: only {test_slug}")
    print(f"   Model: deepseek-chat\n")

    en_paths = sorted(glob.glob(f'{INSTRUMENTS_DIR}/*/translations/en.json'))
    if test_slug:
        en_paths = [p for p in en_paths if test_slug in p]

    total = len(en_paths)
    all_issues = []

    for i, en_path in enumerate(en_paths, 1):
        slug = en_path.split('/')[-3]
        lang_path = en_path.replace('/en.json', f'/{lang}.json')

        print(f"\n[{i}/{total}] {slug}")

        with open(en_path, encoding='utf-8') as f:
            en_data = json.load(f)

        existing = {}
        if os.path.exists(lang_path):
            with open(lang_path, encoding='utf-8') as f:
                existing = json.load(f)

        translated = translate_calculator(slug, lang, en_data, existing)

        with open(lang_path, 'w', encoding='utf-8') as f:
            json.dump(translated, f, ensure_ascii=False, indent=2)

        issues = qa_check(en_data, translated, slug)
        if issues:
            all_issues.extend([(slug, iss) for iss in issues])
            for iss in issues:
                print(f"    {iss}")
        else:
            print(f"    ✅ QA passed")

    print(f"\n{'='*55}")
    print(f"✅ Done: {total} calculators → {lang_name}")

    if all_issues:
        print(f"\n⚠️  {len(all_issues)} QA issues:")
        for slug, iss in all_issues:
            print(f"   {slug}: {iss}")
        print("\nRun script again to fix remaining issues.")
    else:
        print("✓ All QA checks passed!")

    print(f"""
Next steps:
  git add src/instruments/*/translations/{lang}.json
  git commit -m "feat(i18n): complete {lang} translations for all 36 calculators"
  GIT_SSH_COMMAND="ssh -i ~/.ssh/github_solviqlab" git push origin main
""")

if __name__ == '__main__':
    main()
