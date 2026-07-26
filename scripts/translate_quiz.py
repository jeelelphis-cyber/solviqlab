#!/usr/bin/env python3
"""
SolviqLab — Quiz Translation Script
Translates src/lib/quiz/translations/{slug}/en.json → all 9 languages via DeepSeek.
Usage: python3 scripts/translate_quiz.py [lang] [slug]
       python3 scripts/translate_quiz.py              (all langs, all quizzes)
       python3 scripts/translate_quiz.py de           (all quizzes, one lang)
       python3 scripts/translate_quiz.py de depression-quiz  (one quiz, one lang)
"""

import json
import sys
import os
import time
import urllib.request
import urllib.error
import glob

QUIZ_TRANS_DIR = os.path.join(os.path.dirname(__file__), '../src/lib/quiz/translations')
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

# Strings that must never be translated
KEEP_AS_IS = {'SolviqLab', 'PHQ-9', 'GAD-7', 'PSS-10', 'BMI', 'TDEE', 'BMR',
              'WHO', 'CDC', 'NIH', 'APA', 'NHS', 'DSM-5', 'ICD-11', 'CBT', 'MSLT',
              'Epworth Sleepiness Scale', 'PMID'}


def extract_strings(obj):
    """Recursively extract all string values from a nested structure.
    Returns list of strings in traversal order."""
    result = []
    if isinstance(obj, str):
        result.append(obj)
    elif isinstance(obj, list):
        for item in obj:
            result.extend(extract_strings(item))
    elif isinstance(obj, dict):
        for v in obj.values():
            result.extend(extract_strings(v))
    return result


def replace_strings(obj, strings_iter):
    """Reconstruct the object replacing all strings with values from iterator."""
    if isinstance(obj, str):
        return next(strings_iter)
    elif isinstance(obj, list):
        return [replace_strings(item, strings_iter) for item in obj]
    elif isinstance(obj, dict):
        return {k: replace_strings(v, strings_iter) for k, v in obj.items()}
    return obj


def needs_translation(en_val: str, existing_val: str) -> bool:
    """True if string needs (re)translation."""
    if not existing_val or len(existing_val.strip()) < 2:
        return True
    if existing_val == en_val:
        return True  # Still EN — not translated
    en_len = len(en_val)
    ex_len = len(existing_val)
    if en_len > 50 and ex_len / en_len < 0.4:
        return True  # Too short for long content
    return False


def deepseek_translate_batch(texts: list[str], lang: str, context: str = '') -> list[str]:
    """Translate a batch of strings as a JSON array."""
    lang_name = LANG_NAMES[lang]

    system = (
        f"You are a professional translator for a health and wellness platform. "
        f"Translate the following JSON array of strings to {lang_name}. "
        f"Rules:\n"
        f"1. Keep medical terms and brand names unchanged: PHQ-9, GAD-7, PSS-10, BMI, TDEE, BMR, "
        f"WHO, CDC, NIH, APA, NHS, DSM-5, ICD-11, CBT, MSLT, SolviqLab, Mia, ESS.\n"
        f"2. Keep citations unchanged (author names, journal names, years, PMIDs, URLs).\n"
        f"3. Keep symbols unchanged: →, ✓, ✗, ⎘, •.\n"
        f"4. Keep numbers, percentages, ranges (e.g. '0–7', '88%') unchanged.\n"
        f"5. Preserve all line breaks (\\n).\n"
        f"6. Return ONLY a valid JSON array with the exact same number of elements.\n"
        f"7. Tone: professional, empathetic, health context."
    )
    if context:
        system += f"\nContext: {context}"

    payload = json.dumps({
        'model': 'deepseek-chat',
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': json.dumps(texts, ensure_ascii=False)},
        ],
        'temperature': 0.2,
        'max_tokens': 8000,
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
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                content = result['choices'][0]['message']['content'].strip()
                if content.startswith('```'):
                    content = content.split('```')[1]
                    if content.startswith('json'):
                        content = content[4:]
                translated = json.loads(content)
                if isinstance(translated, list) and len(translated) == len(texts):
                    return translated
                print(f"    ⚠️  Length mismatch ({len(translated)} vs {len(texts)}), retrying...")
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if e.code == 429:
                print(f"    ⏳ Rate limit, waiting 20s...")
                time.sleep(20)
            else:
                print(f"    ❌ HTTP {e.code}: {body[:120]}")
                return texts
        except Exception as ex:
            print(f"    ⚠️  Attempt {attempt + 1}: {ex}")
            time.sleep(5)

    return texts


def translate_quiz(slug: str, lang: str) -> None:
    lang_name = LANG_NAMES[lang]
    en_path  = os.path.join(QUIZ_TRANS_DIR, slug, 'en.json')
    out_path = os.path.join(QUIZ_TRANS_DIR, slug, f'{lang}.json')

    with open(en_path, encoding='utf-8') as f:
        en_data = json.load(f)

    existing = {}
    if os.path.exists(out_path):
        with open(out_path, encoding='utf-8') as f:
            existing = json.load(f)

    # Extract all EN strings in order
    en_strings = extract_strings(en_data)

    # Build parallel existing strings (same traversal order)
    existing_strings = extract_strings(existing) if existing else [''] * len(en_strings)

    # Pad existing if structure changed (new keys added to en.json)
    if len(existing_strings) < len(en_strings):
        existing_strings.extend([''] * (len(en_strings) - len(existing_strings)))

    # Determine which strings need translation
    indices_to_translate = []
    for i, (en_s, ex_s) in enumerate(zip(en_strings, existing_strings)):
        if needs_translation(en_s, ex_s):
            indices_to_translate.append(i)

    if not indices_to_translate:
        print(f"    ✅ {lang_name}: already up to date ({len(en_strings)} strings)")
        return

    print(f"    Translating {len(indices_to_translate)}/{len(en_strings)} strings to {lang_name}...")

    # Build result strings list (start from existing, fill in translations)
    result_strings = list(existing_strings[:len(en_strings)])

    # Translate in batches of 20 (quiz content strings are longer than UI strings)
    BATCH_SIZE = 20
    batch_indices = indices_to_translate
    texts_to_translate = [en_strings[i] for i in batch_indices]

    translated_all = []
    for i in range(0, len(texts_to_translate), BATCH_SIZE):
        batch = texts_to_translate[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(texts_to_translate) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"      Batch {batch_num}/{total_batches} ({len(batch)} strings)...")
        translated_batch = deepseek_translate_batch(batch, lang, f"quiz '{slug}'")
        translated_all.extend(translated_batch)
        time.sleep(1)

    # Insert translated strings back into result
    for idx, translated_val in zip(batch_indices, translated_all):
        result_strings[idx] = translated_val

    # Reconstruct the full object using the translated strings
    result_iter = iter(result_strings)
    try:
        translated_data = replace_strings(en_data, result_iter)
    except StopIteration:
        print(f"    ❌ Structure mismatch during reconstruction — skipping {slug}/{lang}")
        return

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(translated_data, f, ensure_ascii=False, indent=2)

    print(f"    ✅ {lang_name}: {len(indices_to_translate)} strings translated → {out_path}")


def main():
    # Parse args: [lang] [slug]
    lang_arg = None
    slug_arg = None

    if len(sys.argv) >= 2:
        arg1 = sys.argv[1].lower()
        if arg1 in LANG_NAMES:
            lang_arg = arg1
        else:
            slug_arg = arg1

    if len(sys.argv) >= 3:
        arg2 = sys.argv[2].lower()
        if arg2 in LANG_NAMES:
            lang_arg = arg2
        else:
            slug_arg = arg2

    langs = [lang_arg] if lang_arg else list(LANG_NAMES.keys())

    if slug_arg:
        slug_dirs = [os.path.join(QUIZ_TRANS_DIR, slug_arg)]
    else:
        slug_dirs = sorted(glob.glob(os.path.join(QUIZ_TRANS_DIR, '*')))
        slug_dirs = [d for d in slug_dirs if os.path.isdir(d) and os.path.exists(os.path.join(d, 'en.json'))]

    slugs = [os.path.basename(d) for d in slug_dirs]

    print(f"\n🧠 Quiz Translation — SolviqLab")
    print(f"Quizzes: {', '.join(slugs)}")
    print(f"Languages: {', '.join(langs)}\n")

    for lang in langs:
        print(f"\n[{lang.upper()}] {LANG_NAMES[lang]}")
        for slug in slugs:
            en_path = os.path.join(QUIZ_TRANS_DIR, slug, 'en.json')
            if not os.path.exists(en_path):
                print(f"  ⚠️  {slug}: no en.json found — skipping")
                continue
            print(f"  [{slug}]")
            translate_quiz(slug, lang)
            time.sleep(1.5)

    print(f"\n✅ Done!")
    print(f"\nNext: git add src/lib/quiz/translations/ && git commit -m 'feat(i18n): quiz translations all 9 languages'")


if __name__ == '__main__':
    main()
