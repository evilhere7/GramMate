#!/usr/bin/env python3
"""
Small formatter: removes trailing whitespace, collapses excessive blank lines,
and ensures two blank lines before top-level def/class declarations.
Run from repo root: python tools/fix_style.py
"""
import re
from pathlib import Path

def fix_file(path: Path):
    text = path.read_text(encoding='utf-8')
    # remove trailing whitespace
    text = re.sub(r"[ \t]+$", "", text, flags=re.M)
    # normalize line endings
    text = text.replace('\r\n', '\n')
    # collapse more than 3 blank lines into 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    # ensure two blank lines before top-level def/class
    lines = text.split('\n')
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if re.match(r'^(def |class )', line):
            # count previous blank lines
            j = len(out) - 1
            blank_count = 0
            while j >= 0 and out[j].strip() == '':
                blank_count += 1
                j -= 1
            need = 2 - blank_count
            if need > 0:
                out.extend([''] * need)
        out.append(line)
        i += 1
    new_text = '\n'.join(out)
    # final strip: ensure file ends with newline
    if not new_text.endswith('\n'):
        new_text += '\n'
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        print(f'Fixed {path}')


def main():
    root = Path('backend')
    for p in root.rglob('*.py'):
        fix_file(p)

if __name__ == '__main__':
    main()
