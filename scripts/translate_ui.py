#!/usr/bin/env python3
"""
SolviqLab — UI Strings Translation Script
Translates src/locales/en.json → all 9 languages via DeepSeek.
Usage: python3 scripts/translate_ui.py [lang]
       python3 scripts/translate_ui.py        (all languages)
       python3 scripts/translate_ui.py de     (single language)
"""

import json
import sys
import os
import time
import urllib.request
import urllib.error

LOCALES_DIR = os.path.join(os.path.dirname(__file__), '../src/locales')
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

# Keys that must NOT be translated (keep as-is)
SKIP_KEYS = {
    'registration.email_placeholder',  # "Email" is same in all languages
}

# Keys that contain format placeholders {{n}}, {{label}} etc — translate carefully
INTERPOLATED_KEYS = {k for k in [] }  # detected automatically by {{


def deepseek_translate_batch(texts: list[str], lang: str) -> list[str]:
    """Translate a batch of UI strings as a JSON array for efficiency."""
    lang_name = LANG_NAMES[lang]

    system = (
        f"You are a professional UI translator for a health and finance calculator web app. "
        f"Translate the following JSON array of UI strings to {lang_name}. "
        f"Rules:\n"
        f"1. Keep {{{{variable}}}} placeholders exactly as-is (e.g. {{{{n}}}}, {{{{label}}}}, {{{{pct}}}}).\n"
        f"2. Keep 'SolviqLab', 'AI', 'Mia', 'Email' unchanged.\n"
        f"3. Keep symbols like →, ✓, ✗, ⎘, ↗ unchanged.\n"
        f"4. Keep URLs unchanged.\n"
        f"5. Return ONLY a valid JSON array with the same number of elements.\n"
        f"6. Match the tone: professional, motivating, health/finance context."
    )

    payload = json.dumps({
        'model': 'deepseek-chat',
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': json.dumps(texts, ensure_ascii=False)},
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
                content = result['choices'][0]['message']['content'].strip()
                # Strip markdown code blocks if present
                if content.startswith('```'):
                    content = content.split('```')[1]
                    if content.startswith('json'):
                        content = content[4:]
                translated = json.loads(content)
                if isinstance(translated, list) and len(translated) == len(texts):
                    return translated
                print(f"  ⚠️  Response length mismatch, retrying...")
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if e.code == 429:
                print(f"  ⏳ Rate limit, waiting 15s...")
                time.sleep(15)
            else:
                print(f"  ❌ HTTP {e.code}: {body[:100]}")
                return texts
        except Exception as ex:
            print(f"  ⚠️  Error attempt {attempt+1}: {ex}")
            time.sleep(5)

    return texts  # fallback to source


def translate_locale(lang: str) -> None:
    lang_name = LANG_NAMES[lang]
    en_path = os.path.join(LOCALES_DIR, 'en.json')
    out_path = os.path.join(LOCALES_DIR, f'{lang}.json')

    with open(en_path, encoding='utf-8') as f:
        en = json.load(f)

    existing = {}
    if os.path.exists(out_path):
        with open(out_path, encoding='utf-8') as f:
            existing = json.load(f)

    result = dict(existing)

    # Collect keys that need translation
    to_translate = []
    keys_to_translate = []

    for key, en_val in en.items():
        if key in SKIP_KEYS:
            result[key] = en_val
            continue

        existing_val = existing.get(key, '')
        # Skip if already translated (not identical to EN)
        if existing_val and existing_val != en_val:
            continue

        keys_to_translate.append(key)
        to_translate.append(en_val)

    if not to_translate:
        print(f"  ✅ {lang_name}: all {len(en)} keys already translated")
        return

    print(f"  Translating {len(to_translate)} keys to {lang_name}...")

    # Translate in batches of 30 to avoid token limits
    BATCH_SIZE = 30
    translated_all = []
    for i in range(0, len(to_translate), BATCH_SIZE):
        batch = to_translate[i:i+BATCH_SIZE]
        print(f"    Batch {i//BATCH_SIZE + 1}/{(len(to_translate)+BATCH_SIZE-1)//BATCH_SIZE} ({len(batch)} strings)...")
        translated_batch = deepseek_translate_batch(batch, lang)
        translated_all.extend(translated_batch)
        time.sleep(1)

    for key, translated_val in zip(keys_to_translate, translated_all):
        result[key] = translated_val

    # Preserve original key order from en.json
    ordered = {k: result.get(k, en[k]) for k in en}

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(ordered, f, ensure_ascii=False, indent=2)

    print(f"  ✅ {lang_name}: {len(to_translate)} strings translated → {out_path}")


def main():
    if len(sys.argv) > 1:
        lang = sys.argv[1].lower()
        if lang not in LANG_NAMES:
            print(f"Unknown language: {lang}. Available: {', '.join(LANG_NAMES)}")
            sys.exit(1)
        langs = [lang]
    else:
        langs = list(LANG_NAMES.keys())

    print(f"\n🌐 SolviqLab UI String Translation")
    print(f"Languages: {' → '.join(langs)}\n")

    for lang in langs:
        print(f"\n[{lang.upper()}] {LANG_NAMES[lang]}")
        translate_locale(lang)
        time.sleep(2)

    print(f"\n✅ Done! Update locale files committed to src/locales/")
    print(f"\nNext: git add src/locales/*.json && git commit -m 'feat(i18n): translate UI strings'")


if __name__ == '__main__':
    main()
