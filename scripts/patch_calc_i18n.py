#!/usr/bin/env python3
"""
patch_calc_i18n.py
------------------
Patches calculator client components that are missing ui-strings integration.

For each TSX file in src/components/instruments/ that:
  1. Does NOT already import ui-strings
  2. Is NOT InstrumentUI.tsx
  3. HAS hardcoded '⎘ Copy', '✓ Copied', or 'Methodology & Sources'

The script will:
  a. Add `import { t as uiT } from '../../lib/ui-strings'` after the last import
  b. Add `const s = uiT(lang)` as the first line of the main exported function body
  c. Replace hardcoded strings with s.calcCopy, s.calcCopied, s.methodologySources
"""

import re
import sys
from pathlib import Path

INSTRUMENTS_DIR = Path('/Users/macbook/AIFabrica/CALCO/apps/web/src/components/instruments')
SKIP_FILES = {'InstrumentUI.tsx'}
UI_IMPORT = "import { t as uiT } from '../../lib/ui-strings'"

HARDCODED_STRINGS = [
    "'⎘ Copy'",
    "'✓ Copied'",
    "Methodology & Sources",
]

def needs_patch(content: str) -> bool:
    """Return True if file has hardcoded strings but no ui-strings import."""
    has_hardcoded = any(s in content for s in HARDCODED_STRINGS)
    has_import = 'ui-strings' in content
    return has_hardcoded and not has_import

def find_last_import_line(lines: list[str]) -> int:
    """Return the index (0-based) of the last import line."""
    last_import = -1
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('import ') or stripped.startswith("import'") or stripped.startswith('import"'):
            last_import = i
    return last_import

def add_ui_import(lines: list[str]) -> list[str]:
    """Insert the ui-strings import after the last import line."""
    last_import_idx = find_last_import_line(lines)
    if last_import_idx == -1:
        # No imports found — insert at top after 'use client'
        insert_at = 0
        for i, line in enumerate(lines):
            if "'use client'" in line or '"use client"' in line:
                insert_at = i + 1
                break
        lines.insert(insert_at, UI_IMPORT + '\n')
    else:
        lines.insert(last_import_idx + 1, UI_IMPORT + '\n')
    return lines

def add_s_const_to_main_function(lines: list[str]) -> tuple[list[str], bool]:
    """
    Find the main exported function with { translations, lang } props
    and add `const s = uiT(lang)` as the first statement in its body.
    Returns (modified_lines, success).
    """
    # Pattern: export function XxxClient({ translations, lang }: Props) {
    # We need to find the opening brace of the function body
    pattern = re.compile(r'export\s+function\s+\w+\(\s*\{[^}]*\blang\b[^}]*\}[^)]*\)')

    in_function_sig = False
    sig_start = -1

    for i, line in enumerate(lines):
        if not in_function_sig:
            if pattern.search(line):
                # Check if this line also has the opening brace
                if '{' in line.split(')')[-1]:
                    # Function signature and opening brace on same line
                    # Find the position to insert after the opening brace line
                    insert_at = i + 1
                    # Make sure we don't already have `const s = uiT(lang)`
                    if insert_at < len(lines) and 'const s = uiT' in lines[insert_at]:
                        return lines, True  # already patched
                    lines.insert(insert_at, '  const s = uiT(lang)\n')
                    return lines, True
                else:
                    # Multi-line signature
                    in_function_sig = True
                    sig_start = i
        else:
            # Looking for the closing paren + opening brace
            if ') {' in line or '){' in line:
                insert_at = i + 1
                if insert_at < len(lines) and 'const s = uiT' in lines[insert_at]:
                    return lines, True
                lines.insert(insert_at, '  const s = uiT(lang)\n')
                return lines, True
            elif '{' in line and ')' in line:
                insert_at = i + 1
                if insert_at < len(lines) and 'const s = uiT' in lines[insert_at]:
                    return lines, True
                lines.insert(insert_at, '  const s = uiT(lang)\n')
                return lines, True

    return lines, False

def replace_hardcoded_strings(content: str) -> str:
    """Replace hardcoded strings with s.* references."""
    # Replace in JSX context: {copied ? '✓ Copied' : '⎘ Copy'}
    # We want to replace the ternary pattern first (most specific)
    content = re.sub(
        r"\{copied \? '✓ Copied' : '⎘ Copy'\}",
        "{copied ? s.calcCopied : s.calcCopy}",
        content
    )

    # Standalone occurrences (if any remain)
    content = content.replace("'✓ Copied'", "s.calcCopied")
    content = content.replace("'⎘ Copy'", "s.calcCopy")

    # Methodology & Sources in JSX span tags
    content = re.sub(
        r'<span>Methodology &amp; Sources</span>',
        '<span>{s.methodologySources}</span>',
        content
    )
    content = re.sub(
        r'<span>Methodology & Sources</span>',
        '<span>{s.methodologySources}</span>',
        content
    )

    return content

def patch_file(filepath: Path) -> tuple[bool, str]:
    """
    Patch a single file. Returns (success, message).
    """
    content = filepath.read_text(encoding='utf-8')

    if not needs_patch(content):
        return False, "skipped (no hardcoded strings or already has ui-strings import)"

    lines = content.splitlines(keepends=True)

    # Step 1: Add import
    lines = add_ui_import(lines)

    # Step 2: Add const s = uiT(lang) to main function
    lines, fn_found = add_s_const_to_main_function(lines)

    # Step 3: Reconstruct content and replace hardcoded strings
    new_content = ''.join(lines)
    new_content = replace_hardcoded_strings(new_content)

    if new_content == content:
        return False, "no changes made (content unchanged)"

    filepath.write_text(new_content, encoding='utf-8')

    if not fn_found:
        return True, "WARNING: import added and strings replaced, but main function with `lang` param NOT found — `const s = uiT(lang)` NOT inserted"

    return True, "OK"

def main():
    tsx_files = sorted(INSTRUMENTS_DIR.glob('*.tsx'))

    patched = []
    skipped = []
    warnings = []

    print(f"Scanning {len(tsx_files)} TSX files in {INSTRUMENTS_DIR}\n")

    for filepath in tsx_files:
        name = filepath.name

        if name in SKIP_FILES:
            print(f"  SKIP  {name}  (excluded)")
            skipped.append(name)
            continue

        success, msg = patch_file(filepath)

        if success:
            if 'WARNING' in msg:
                print(f"  WARN  {name}  — {msg}")
                warnings.append(name)
            else:
                print(f"  PATCH {name}  — {msg}")
            patched.append(name)
        else:
            print(f"  SKIP  {name}  — {msg}")
            skipped.append(name)

    print(f"\n--- Summary ---")
    print(f"Patched:  {len(patched)} files")
    print(f"Skipped:  {len(skipped)} files")
    if warnings:
        print(f"Warnings: {len(warnings)} files — {warnings}")
    print(f"\nPatched files:")
    for f in patched:
        print(f"  {f}")

if __name__ == '__main__':
    main()
