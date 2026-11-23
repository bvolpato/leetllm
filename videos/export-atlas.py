#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Export the concept gallery as a portable, checksum-verified SVG collection."""

import argparse
import hashlib
import json
import zipfile
from pathlib import Path


def export_atlas(output: Path) -> None:
    source = Path(__file__).resolve().parent / "assets/concepts"
    manifest = json.loads((source / "manifest.json").read_text())
    catalog = json.loads((source / "catalog.json").read_text())
    listed = {icon["file"] for icon in manifest["icons"]}
    actual = {path.name for path in source.glob("*.svg")}
    if listed != actual or len(listed) != len(manifest["icons"]):
        raise ValueError("SVG files and manifest do not match")
    if {entry["id"] for entry in catalog["concepts"] if entry["symbol"]} != {
        icon["id"] for icon in manifest["icons"]
    }:
        raise ValueError("Catalog symbols and manifest do not match")
    files = {
        path.relative_to(source).as_posix(): path.read_bytes()
        for path in sorted(source.rglob("*"))
        if path.is_file()
    }
    files["checksums.sha256"] = "".join(
        f"{hashlib.sha256(data).hexdigest()}  {name}\n"
        for name, data in files.items()
    ).encode()
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(".partial.zip")
    with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in files.items():
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    with zipfile.ZipFile(temporary) as archive:
        failure = archive.testzip()
        if failure or any(archive.read(name) != data for name, data in files.items()):
            raise ValueError(f"Export verification failed: {failure}")
    temporary.replace(output)
    print(f"Ready: {output} ({len(listed)} SVG symbols, {output.stat().st_size:,} bytes)")
    print(f"SHA-256: {hashlib.sha256(output.read_bytes()).hexdigest()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("build/concept-atlas/leetllm-concept-atlas.zip"))
    export_atlas(parser.parse_args().output.resolve())
