#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

from __future__ import annotations

import argparse
import re
from pathlib import Path


def sync_block(content_path: Path, name: str, source_path: Path) -> bool:
    text = content_path.read_text()
    source = source_path.read_text().rstrip() + "\n"

    pattern = re.compile(
        rf"(^```(?:tsx|typescript)[^\n]*\bname=\"{re.escape(name)}\"[^\n]*\n)([\s\S]*?)(\n```)",
        re.MULTILINE,
    )

    match = pattern.search(text)
    if not match:
        raise SystemExit(f'block name="{name}" not found in {content_path}')

    new_text = text[: match.start(2)] + source + text[match.end(2) :]
    if new_text == text:
        return False

    content_path.write_text(new_text)
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("content_path", type=Path)
    parser.add_argument("name")
    parser.add_argument("source_path", type=Path)
    args = parser.parse_args()

    changed = sync_block(args.content_path, args.name, args.source_path)
    print("updated" if changed else "unchanged")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
