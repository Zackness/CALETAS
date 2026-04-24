#!/usr/bin/env python3
"""
Reemplaza la paleta hardcodeada más usada por tokens CSS (vars) para que
los temas (.theme-*) afecten toda la UI (Tailwind arbitrary values incl.).

Uso (desde la raíz del repo):
  python3 scripts/replace-hardcoded-palette.py
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

SKIP_FILES = {
    # Contiene definiciones literales de la paleta; no debe “tokenizarse” a sí misma.
    ROOT / "app" / "globals.css",
}

TEXT_EXTENSIONS = {".tsx", ".ts", ".jsx", ".js", ".css", ".mdx"}


def should_skip(path: Path) -> bool:
    if path.resolve() in SKIP_FILES:
        return True
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


ACCENT = "#40C9A9"
GREEN_LIGHT = "#354B3A"
GREEN = "#203324"
GREEN_DARK = "#1C2D20"


def mix_token(css_var: str, pct: str) -> str:
    # Tailwind arbitrary value (funciona con hex u otros colores CSS).
    return f"[color-mix(in_oklab,{css_var}_{pct}%,transparent)]"


def replace_accent_hexes(s: str) -> str:
    # Orden importa: primero los que llevan "/xx".
    s = re.sub(
        rf"{re.escape(ACCENT)}/(\d{{1,3}})",
        lambda m: mix_token("var(--accent-hex)", m.group(1)),
        s,
    )
    s = s.replace(ACCENT, "var(--accent-hex)")
    return s


def replace_green_light_hexes(s: str) -> str:
    s = re.sub(
        rf"{re.escape(GREEN_LIGHT)}/(\d{{1,3}})",
        lambda m: mix_token("var(--mygreen-light)", m.group(1)),
        s,
    )
    s = s.replace(GREEN_LIGHT, "var(--mygreen-light)")
    return s


def replace_green_hexes(s: str) -> str:
    s = re.sub(
        rf"{re.escape(GREEN)}/(\d{{1,3}})",
        lambda m: mix_token("var(--mygreen)", m.group(1)),
        s,
    )
    s = s.replace(GREEN, "var(--mygreen)")
    return s


def replace_green_dark_hexes(s: str) -> str:
    s = re.sub(
        rf"{re.escape(GREEN_DARK)}/(\d{{1,3}})",
        lambda m: mix_token("var(--mygreen-dark)", m.group(1)),
        s,
    )
    s = s.replace(GREEN_DARK, "var(--mygreen-dark)")
    return s


def transform(content: str) -> tuple[str, int]:
    before = content
    content = replace_accent_hexes(content)
    content = replace_green_light_hexes(content)
    content = replace_green_hexes(content)
    content = replace_green_dark_hexes(content)
    changed = 0 if content == before else 1
    return content, changed


def main() -> None:
    changed_files = 0
    scanned = 0
    for path in iter_files():
        scanned += 1
        try:
            original = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        updated, did_change = transform(original)
        if not did_change:
            continue

        path.write_text(updated, encoding="utf-8", newline="\n")
        changed_files += 1

    print(f"OK: scanned={scanned}, updated_files={changed_files}")


if __name__ == "__main__":
    main()
