#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Prepare hash-bound paper crops with Poppler before a lesson is compiled.

Crop coordinates are PDF points measured from the top-left of the displayed
CropBox, after page rotation. A recipe supplies the exact source digest. Original
PDFs stay in build/paper-source-cache; only PNGs and JSON provenance are emitted.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request


TOOL_VERSION = "1"
MAX_PDF_BYTES = 64 * 1024 * 1024
MAX_IMAGE_BYTES = 16 * 1024 * 1024
MAX_PIXELS = 16 * 1024 * 1024
DOWNLOAD_SECONDS = 60
SHA256 = re.compile(r"[a-f0-9]{64}\Z")
SLUG = re.compile(r"[a-z][a-z0-9-]*\Z")


class PreparationError(ValueError):
    """An input cannot produce the declared derivative safely and reproducibly."""


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_json(value: object) -> bytes:
    return (
        json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    ).encode()


def inside_root(file: Path, root: Path) -> str:
    try:
        return file.resolve().relative_to(root.resolve()).as_posix()
    except ValueError as error:
        raise PreparationError(
            f"Output or recipe escapes the source root: {file}"
        ) from error


def positive_number(value: object, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise PreparationError(f"{label} must be a finite positive number")
    if not math.isfinite(value) or value <= 0:
        raise PreparationError(f"{label} must be a finite positive number")
    return float(value)


def require_string(value: object, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise PreparationError(f"{label} must be a nonempty string")
    return value


def https_url(value: object) -> str:
    url = require_string(value, "source.url")
    parsed = urllib.parse.urlsplit(url)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.fragment
    ):
        raise PreparationError(
            "source.url must be an HTTPS URL without credentials or a fragment"
        )
    return url


def load_recipe(recipe_path: Path) -> dict:
    try:
        recipe = json.loads(recipe_path.read_text())
    except (OSError, json.JSONDecodeError) as error:
        raise PreparationError(f"Cannot read recipe {recipe_path}: {error}") from error
    if not isinstance(recipe, dict) or recipe.get("schemaVersion") != 1:
        raise PreparationError("Recipe schemaVersion must be 1")
    source = recipe.get("source")
    if not isinstance(source, dict):
        raise PreparationError("Recipe needs source metadata")
    https_url(source.get("url"))
    for field in ("version", "title"):
        require_string(source.get(field), f"source.{field}")
    if not isinstance(source.get("sha256"), str) or not SHA256.fullmatch(
        source["sha256"]
    ):
        raise PreparationError(
            "source.sha256 must contain 64 lowercase hexadecimal digits"
        )
    authors = source.get("authors")
    if (
        not isinstance(authors, list)
        or not authors
        or any(not isinstance(author, str) or not author.strip() for author in authors)
    ):
        raise PreparationError("source.authors must be a nonempty list of names")
    year = source.get("year")
    if isinstance(year, bool) or not isinstance(year, int) or not 1400 <= year <= 9999:
        raise PreparationError("source.year must be a four-digit integer")
    if "license" in source and not isinstance(source["license"], dict):
        raise PreparationError("source.license must be a metadata object")
    figures = recipe.get("figures")
    if not isinstance(figures, list) or not 1 <= len(figures) <= 32:
        raise PreparationError("Recipe needs between 1 and 32 figures")
    ids: set[str] = set()
    outputs: set[str] = set()
    for figure in figures:
        if (
            not isinstance(figure, dict)
            or not isinstance(figure.get("id"), str)
            or not SLUG.fullmatch(figure["id"])
        ):
            raise PreparationError("Every figure needs a lowercase slug id")
        if figure["id"] in ids:
            raise PreparationError(f"Duplicate figure id: {figure['id']}")
        ids.add(figure["id"])
        require_string(figure.get("locator"), "figure.locator")
        page = figure.get("page")
        if isinstance(page, bool) or not isinstance(page, int) or page < 1:
            raise PreparationError("figure.page must be a positive one-based integer")
        dpi = positive_number(figure.get("dpi"), "figure.dpi")
        if not 72 <= dpi <= 600:
            raise PreparationError("figure.dpi must be between 72 and 600")
        crop = figure.get("crop")
        if not isinstance(crop, dict) or set(crop) != {"x", "y", "width", "height"}:
            raise PreparationError(
                "figure.crop needs x, y, width and height in PDF points"
            )
        for axis in ("x", "y"):
            value = crop[axis]
            if (
                isinstance(value, bool)
                or not isinstance(value, (int, float))
                or not math.isfinite(value)
                or value < 0
            ):
                raise PreparationError(
                    f"figure.crop.{axis} must be finite and nonnegative"
                )
        positive_number(crop["width"], "figure.crop.width")
        positive_number(crop["height"], "figure.crop.height")
        output = require_string(figure.get("output"), "figure.output")
        if (
            Path(output).name != output
            or not output.endswith(".png")
            or output in outputs
        ):
            raise PreparationError(
                "figure.output must be a unique PNG filename without directories"
            )
        outputs.add(output)
    return recipe


def run_poppler(command: list[str], timeout: int = 30) -> subprocess.CompletedProcess:
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            check=False,
            timeout=timeout,
            env={**os.environ, "LC_ALL": "C"},
        )
    except (OSError, subprocess.TimeoutExpired) as error:
        raise PreparationError(f"Cannot run {command[0]}: {error}") from error
    if result.returncode:
        raise PreparationError(
            f"{command[0]} failed: {result.stderr.decode(errors='replace').strip()}"
        )
    return result


def poppler_version(command: str) -> str:
    result = run_poppler([command, "-v"])
    return (result.stdout + result.stderr).decode().splitlines()[0]


class HttpsRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        https_url(new_url)
        return super().redirect_request(
            request, response, code, message, headers, new_url
        )


def copy_bounded_stream(stream, output, *, limit: int, deadline: float) -> None:
    total = 0
    while True:
        if time.monotonic() > deadline:
            raise PreparationError("PDF download exceeded its total time limit")
        chunk = stream.read(min(65536, limit - total + 1))
        if not chunk:
            break
        total += len(chunk)
        if total > limit:
            raise PreparationError(f"PDF download exceeds {limit} bytes")
        output.write(chunk)


def pdf_source(
    source: dict, local_pdf: Path | None, cache_dir: Path, offline: bool
) -> Path:
    expected = source["sha256"]
    cached = cache_dir / f"{expected}.pdf"
    candidate = local_pdf or cached
    if not candidate.exists():
        if local_pdf or offline:
            raise PreparationError(f"Local PDF is unavailable: {candidate}")
        cache_dir.mkdir(parents=True, exist_ok=True)
        request = urllib.request.Request(
            source["url"], headers={"User-Agent": "LeetLLM-paper-figure/1"}
        )
        opener = urllib.request.build_opener(HttpsRedirects())
        try:
            with tempfile.NamedTemporaryFile(
                dir=cache_dir, suffix=".download", delete=False
            ) as temporary:
                temporary_path = Path(temporary.name)
                try:
                    with opener.open(request, timeout=20) as response:
                        https_url(response.url)
                        length = response.headers.get("Content-Length")
                        if length and int(length) > MAX_PDF_BYTES:
                            raise PreparationError(
                                f"PDF download exceeds {MAX_PDF_BYTES} bytes"
                            )
                        copy_bounded_stream(
                            response,
                            temporary,
                            limit=MAX_PDF_BYTES,
                            deadline=time.monotonic() + DOWNLOAD_SECONDS,
                        )
                    temporary.flush()
                    content = temporary_path.read_bytes()
                    verify_pdf_bytes(content, expected)
                    temporary_path.replace(cached)
                finally:
                    temporary_path.unlink(missing_ok=True)
        except (OSError, ValueError) as error:
            if isinstance(error, PreparationError):
                raise
            raise PreparationError(f"Cannot download PDF: {error}") from error
    if candidate.stat().st_size > MAX_PDF_BYTES:
        raise PreparationError(f"PDF exceeds {MAX_PDF_BYTES} bytes")
    verify_pdf_bytes(candidate.read_bytes(), expected)
    return candidate.resolve()


def verify_pdf_bytes(content: bytes, expected: str) -> None:
    if not content.startswith(b"%PDF-"):
        raise PreparationError("Source bytes are not a PDF")
    actual = digest(content)
    if actual != expected:
        raise PreparationError(
            f"PDF SHA-256 mismatch: expected {expected}, found {actual}"
        )


def page_geometry(pdf: Path, page: int) -> dict:
    info = run_poppler(
        ["pdfinfo", "-f", str(page), "-l", str(page), "-box", str(pdf)]
    ).stdout.decode()
    count = re.search(r"^Pages:\s+(\d+)\s*$", info, re.MULTILINE)
    if not count or page > int(count[1]):
        raise PreparationError(f"PDF page {page} is outside the document")
    # pdfinfo uses either 'Page N' or 'Page' for a single-page document.
    prefix = rf"^Page(?:\s+{page})?\s+"
    box = re.search(
        prefix + r"CropBox:\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)",
        info,
        re.MULTILINE,
    )
    rotation = re.search(prefix + r"rot:\s+(\d+)", info, re.MULTILINE)
    if not box or not rotation:
        raise PreparationError(
            "pdfinfo did not report the selected page CropBox and rotation"
        )
    left, bottom, right, top = map(float, box.groups())
    angle = int(rotation[1]) % 360
    if angle not in (0, 90, 180, 270) or right <= left or top <= bottom:
        raise PreparationError("Unsupported PDF page geometry")
    width, height = right - left, top - bottom
    if angle in (90, 270):
        width, height = height, width
    return {
        "box": "CropBox",
        "bounds": [left, bottom, right, top],
        "rotation": angle,
        "displayWidthPt": width,
        "displayHeightPt": height,
    }


def pixel_crop(crop: dict, dpi: float, geometry: dict) -> dict:
    if (
        crop["x"] + crop["width"] > geometry["displayWidthPt"] + 1e-7
        or crop["y"] + crop["height"] > geometry["displayHeightPt"] + 1e-7
    ):
        raise PreparationError("Figure crop extends beyond the displayed PDF CropBox")
    scale = dpi / 72
    left, top = math.floor(crop["x"] * scale), math.floor(crop["y"] * scale)
    right = math.ceil((crop["x"] + crop["width"]) * scale)
    bottom = math.ceil((crop["y"] + crop["height"]) * scale)
    width, height = right - left, bottom - top
    if width * height > MAX_PIXELS:
        raise PreparationError(f"Figure raster exceeds {MAX_PIXELS} pixels")
    return {"x": left, "y": top, "width": width, "height": height}


def png_dimensions(content: bytes) -> tuple[int, int]:
    if (
        len(content) < 33
        or content[:8] != b"\x89PNG\r\n\x1a\n"
        or content[12:16] != b"IHDR"
    ):
        raise PreparationError("Poppler did not produce a PNG")
    return struct.unpack(">II", content[16:24])


def prepare(
    recipe_path: Path,
    *,
    root: Path,
    local_pdf: Path | None = None,
    cache_dir: Path | None = None,
    output_dir: Path | None = None,
    offline: bool = False,
) -> dict:
    root, recipe_path = root.resolve(), recipe_path.resolve()
    recipe_relative = inside_root(recipe_path, root)
    recipe_bytes = recipe_path.read_bytes()
    recipe = load_recipe(recipe_path)
    if recipe_path.read_bytes() != recipe_bytes:
        raise PreparationError("Recipe changed while reading")
    output_dir = (output_dir or recipe_path.parent).resolve()
    inside_root(output_dir, root)
    cache_dir = cache_dir or root / "build/paper-source-cache"
    pdf = pdf_source(recipe["source"], local_pdf, cache_dir, offline)
    versions = {name: poppler_version(name) for name in ("pdfinfo", "pdftoppm")}
    recipe_sha = digest(recipe_bytes)
    pdf_bytes = pdf.read_bytes()
    verify_pdf_bytes(pdf_bytes, recipe["source"]["sha256"])
    assets = []
    # Finish every conversion before replacing any checked derivative.
    with tempfile.TemporaryDirectory(prefix="paper-figure-") as temporary:
        temporary_dir = Path(temporary)
        # Poppler opens this private copy, so a changed cache/local file cannot
        # separate the validated digest from the bytes that are actually rendered.
        checked_pdf = temporary_dir / "source.pdf"
        checked_pdf.write_bytes(pdf_bytes)
        plans = []
        for figure in recipe["figures"]:
            geometry = page_geometry(checked_pdf, figure["page"])
            pixels = pixel_crop(figure["crop"], figure["dpi"], geometry)
            plans.append((figure, geometry, pixels))
        for figure, geometry, pixels in plans:
            prefix = temporary_dir / figure["id"]
            command = [
                "pdftoppm",
                "-f",
                str(figure["page"]),
                "-l",
                str(figure["page"]),
                "-cropbox",
                "-r",
                str(figure["dpi"]),
                "-x",
                str(pixels["x"]),
                "-y",
                str(pixels["y"]),
                "-W",
                str(pixels["width"]),
                "-H",
                str(pixels["height"]),
                "-singlefile",
                "-png",
                str(checked_pdf),
                str(prefix),
            ]
            run_poppler(command)
            content = prefix.with_suffix(".png").read_bytes()
            width, height = png_dimensions(content)
            if (width, height) != (pixels["width"], pixels["height"]):
                raise PreparationError(
                    f"Unexpected Poppler crop dimensions: {width}x{height}"
                )
            if len(content) > MAX_IMAGE_BYTES:
                raise PreparationError(
                    f"Figure PNG exceeds {MAX_IMAGE_BYTES} encoded bytes"
                )
            assets.append(
                {
                    "id": figure["id"],
                    "path": inside_root(output_dir / figure["output"], root),
                    "sha256": digest(content),
                    "mediaType": "image/png",
                    "width": width,
                    "height": height,
                    "source": {
                        **recipe["source"],
                        "page": figure["page"],
                        "locator": figure["locator"],
                    },
                    "derivation": {
                        "tool": "prepare-paper-figure",
                        "version": TOOL_VERSION,
                        "toolSha256": digest(Path(__file__).read_bytes()),
                        "recipe": {"path": recipe_relative, "sha256": recipe_sha},
                        "page": figure["page"],
                        "dpi": figure["dpi"],
                        "crop": figure["crop"],
                        "cropCoordinateSystem": "top-left displayed CropBox; PDF points after rotation",
                        "pixelCrop": pixels,
                        "pixelRounding": "outward floor/ceil at dpi/72",
                        "pageGeometry": geometry,
                        "poppler": versions,
                    },
                }
            )
        if recipe_path.read_bytes() != recipe_bytes:
            raise PreparationError("Recipe changed during preparation")
        manifest = {"schemaVersion": 1, "assets": assets}
        output_dir.mkdir(parents=True, exist_ok=True)
        for (figure, _, _), asset in zip(plans, assets):
            data = (temporary_dir / f"{figure['id']}.png").read_bytes()
            with tempfile.NamedTemporaryFile(
                dir=output_dir, delete=False
            ) as temporary_output:
                temporary_output.write(data)
                pending = Path(temporary_output.name)
            pending.replace(root / asset["path"])
        manifest_path = output_dir / "manifest.json"
        with tempfile.NamedTemporaryFile(
            dir=output_dir, delete=False
        ) as temporary_output:
            temporary_output.write(canonical_json(manifest))
            pending = Path(temporary_output.name)
        pending.replace(manifest_path)
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("recipe", type=Path)
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[2],
        help="Source manifest root (default: repository)",
    )
    parser.add_argument(
        "--local-pdf",
        type=Path,
        help="Use these checked local PDF bytes instead of downloading",
    )
    parser.add_argument(
        "--cache-dir",
        type=Path,
        help="Original PDF cache (default: ignored build/paper-source-cache)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Derivative directory (default: beside the recipe)",
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Never download; require the local PDF or cached digest",
    )
    args = parser.parse_args()
    try:
        manifest = prepare(
            args.recipe,
            root=args.root,
            local_pdf=args.local_pdf,
            cache_dir=args.cache_dir,
            output_dir=args.output_dir,
            offline=args.offline,
        )
    except (PreparationError, OSError) as error:
        print(f"prepare-paper-figure: {error}", file=sys.stderr)
        return 2
    print(
        json.dumps(
            {
                "assets": len(manifest["assets"]),
                "figures": [asset["id"] for asset in manifest["assets"]],
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
