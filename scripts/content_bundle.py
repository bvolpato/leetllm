from __future__ import annotations

import json
import re
from html import escape
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from content_audience import filter_content_for_audience


FRONTMATTER_RE = re.compile(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n?")
EMBEDDED_ILLUSTRATION_RE = re.compile(
    r"```(?:tsx|typescript)([^\n]*(?:render\s*=\s*[\"']?illustration[\"']?|leetllm:illustration)[^\n]*)\r?\n([\s\S]*?)\r?\n```",
    re.MULTILINE,
)
ATTRIBUTE_RE = re.compile(r"([A-Za-z_][\w:-]*)=(?:\"((?:\\.|[^\"\\])*)\"|'((?:\\.|[^'\\])*)'|([^\s]+))")
ALT_EXPORT_RE = re.compile(r"\bexport\s+const\s+alt\s*=\s*([\"'`])([\s\S]*?)\1\s*;?", re.MULTILINE)


@dataclass(frozen=True)
class ContentBundle:
    article_dir: Path
    content_path: Path
    metadata: dict[str, Any]
    body: str
    metadata_path: Path | None = None
    source_body: str | None = None

    @property
    def metadata_source(self) -> Path:
        return self.metadata_path or self.content_path


def parse_json_frontmatter(content_path: Path, source: str) -> tuple[dict[str, Any] | None, str]:
    match = FRONTMATTER_RE.match(source)
    if not match:
        return None, source.strip()

    try:
        metadata = json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        raise ValueError(f"{content_path}: invalid JSON frontmatter: {exc}") from exc

    if not isinstance(metadata, dict):
        raise ValueError(f"{content_path}: JSON frontmatter must be an object")

    return metadata, source[match.end():].strip()


def parse_attributes(info: str) -> dict[str, str]:
    attrs: dict[str, str] = {}
    for match in ATTRIBUTE_RE.finditer(info):
        value = next(group for group in match.groups()[1:] if group is not None)
        try:
            value = json.loads(f'"{value}"')
        except json.JSONDecodeError:
            pass
        attrs[match.group(1)] = value
    return attrs


def extract_alt_export(source: str) -> str | None:
    match = ALT_EXPORT_RE.search(source)
    if not match:
        return None
    return " ".join(match.group(2).split())


def materialize_embedded_illustration_sources(markdown: str) -> str:
    def replace(match: re.Match[str]) -> str:
        attrs = parse_attributes(match.group(1))
        name = attrs.get("name")
        if not name:
            raise ValueError(f"Embedded illustration fence needs name=...: {match.group(0)[:80]}")
        name = name.removesuffix(".tsx")
        alt = escape(attrs.get("alt") or extract_alt_export(match.group(2)) or "", quote=True)
        caption = f"\n<figcaption>{attrs['caption']}</figcaption>" if attrs.get("caption") else ""
        return f'<figure>\n<img src="illustrations/_generated/{name}_dark.png" alt="{alt}" />{caption}\n</figure>'

    return EMBEDDED_ILLUSTRATION_RE.sub(replace, markdown).strip()


def load_content_bundle(article_dir: Path, audience: str | None = None, edition: str = "reference") -> ContentBundle | None:
    content_path = article_dir / "content.md"
    metadata_path = article_dir / "metadata.json"
    if not content_path.exists():
        return None

    source = content_path.read_text(encoding="utf-8")
    metadata, body = parse_json_frontmatter(content_path, source)
    source_body = body
    if audience is not None:
        body = filter_content_for_audience(body, audience, str(content_path), edition)
    if metadata is not None:
        return ContentBundle(
            article_dir=article_dir,
            content_path=content_path,
            metadata=metadata,
            body=materialize_embedded_illustration_sources(body),
            source_body=source_body,
        )

    if not metadata_path.exists():
        return None

    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    if not isinstance(metadata, dict):
        raise ValueError(f"{metadata_path}: metadata JSON must be an object")

    return ContentBundle(
        article_dir=article_dir,
        content_path=content_path,
        metadata=metadata,
        body=materialize_embedded_illustration_sources(body),
        metadata_path=metadata_path,
        source_body=source_body,
    )


def iter_content_bundles(content_root: Path, audience: str | None = None) -> list[ContentBundle]:
    bundles: list[ContentBundle] = []
    for content_path in sorted(content_root.glob("*/*/content.md")):
        bundle = load_content_bundle(content_path.parent, audience)
        if bundle is not None:
            bundles.append(bundle)
    return bundles


def find_content_bundles_by_slug(content_root: Path, slug: str) -> list[ContentBundle]:
    return [
        bundle
        for bundle in iter_content_bundles(content_root)
        if bundle.article_dir.name == slug or bundle.metadata.get("slug") == slug
    ]


def write_frontmatter_bundle(content_path: Path, metadata: dict[str, Any], body: str) -> None:
    content_path.write_text(
        "---\n" + json.dumps(metadata, indent=2, ensure_ascii=False) + "\n---\n\n" + body.strip() + "\n",
        encoding="utf-8",
    )


def write_bundle_metadata(bundle: ContentBundle, metadata: dict[str, Any]) -> None:
    if bundle.metadata_path is not None:
        bundle.metadata_path.write_text(
            json.dumps(metadata, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        return

    source = bundle.content_path.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(source)
    if not match:
        raise RuntimeError(f"{bundle.content_path}: missing frontmatter")

    bundle.content_path.write_text(
        "---\n"
        + json.dumps(metadata, indent=2, ensure_ascii=False)
        + "\n---\n\n"
        + source[match.end():].lstrip(),
        encoding="utf-8",
    )


def update_bundle_number_field(bundle: ContentBundle, field: str, value: int) -> None:
    if bundle.metadata_path is not None:
        text = bundle.metadata_path.read_text(encoding="utf-8")
        updated, replacements = re.subn(
            rf'("{re.escape(field)}"\s*:\s*)\d+',
            rf"\g<1>{value}",
            text,
            count=1,
        )
        if replacements != 1:
            raise RuntimeError(f"Could not update {field} in {bundle.metadata_path}")
        bundle.metadata_path.write_text(updated, encoding="utf-8")
        return

    source = bundle.content_path.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(source)
    if not match:
        raise RuntimeError(f"{bundle.content_path}: missing frontmatter")

    metadata = dict(bundle.metadata)
    metadata[field] = value
    bundle.content_path.write_text(
        "---\n"
        + json.dumps(metadata, indent=2, ensure_ascii=False)
        + "\n---\n\n"
        + source[match.end():].lstrip(),
        encoding="utf-8",
    )
