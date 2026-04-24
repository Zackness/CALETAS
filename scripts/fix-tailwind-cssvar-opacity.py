#!/usr/bin/env python3
"""
Tailwind arbitrary colors like `bg-[var(--x)]/20` NO siempre funcionan como se espera
cuando `--x` es un color “opaco” (p.ej. hex). Este script las reescribe a:

  `[color-mix(in_oklab,var(--x)_20%,transparent)]`

que sí respeta el color real de la variable (y por tanto el tema).
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SKIP_DIR_NAMES = {
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "coverage",
}

TEXT_EXTENSIONS = {".tsx", ".ts", ".jsx", ".js"}


def should_skip(path: Path) -> bool:
    parts = set(path.parts)
    return bool(parts & SKIP_DIR_NAMES)


def iter_files() -> list[Path]:
    files: list[Path] = []
    for p in ROOT.rglob("*"):
        if p.is_dir():
            continue
        if should_skip(p):
            continue
        if p.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        files.append(p)
    return files


def rewrite_var_slash_opacity(s: str, css_var: str) -> str:
    pattern = re.compile(rf"\[var\({re.escape(css_var)}\)\]/(\d{{1,3}})")
    return pattern.sub(
        lambda m: f"[color-mix(in_oklab,var({css_var})_{m.group(1)}%,transparent)]",
        s,
    )


def transform(content: str) -> str:
    for v in ("--accent-hex", "--mygreen-light", "--mygreen", "--mygreen-dark"):
        content = rewrite_var_slash_opacity(content, v)
    return content


def main() -> None:
    updated = 0
    scanned = 0
    for path in iter_files():
        scanned += 1
        try:
            original = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        transformed = transform(original)
        if transformed == original:
            continue

        path.write_text(transformed, encoding="utf-8", newline="\n")
        updated += 1

    print(f"OK: scanned={scanned}, updated_files={updated}")


if __name__ == "__main__":
    main()
