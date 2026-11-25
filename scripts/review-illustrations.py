#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Export and review every LeetLLM illustration in content order.

Usage:
    uv run scripts/review-illustrations.py
    uv run scripts/review-illustrations.py --open
    uv run scripts/review-illustrations.py --output-dir /tmp/leetllm_illustrations

The output folder contains a portable HTML gallery, light and dark image
folders, and CSV/JSON manifests. Learn articles follow the canonical roadmap
order from questions.ts. Blogs follow the public archive order: newest first,
then title.
"""

from __future__ import annotations

import argparse
import ast
import csv
import html
import json
import re
import shutil
import subprocess
from dataclasses import asdict, dataclass
from pathlib import Path

from content_bundle import EMBEDDED_ILLUSTRATION_RE, load_content_bundle, parse_attributes


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONTENT_DIR = PROJECT_ROOT / "web" / "src" / "content"
DEFAULT_OUTPUT_DIR = Path("/tmp/leetllm_illustrations")
COMPATIBILITY_PAGE = Path("/tmp/illustration_review.html")
EXPORT_MARKER = ".leetllm-illustration-review-export"
SCENE_STEM_RE = re.compile(r"^(?P<name>.+)_scene\d+$")
NON_FILENAME_RE = re.compile(r"[^a-z0-9]+")
FIGURE_RE = re.compile(
    r'<figure>\s*<img\s+[^>]*src="illustrations/_generated/'
    r'(?P<name>[^"]+?)(?:_dark|_light)?\.png"[^>]*alt="(?P<alt>[^"]*)"[^>]*?/?>'
    r'\s*(?:<figcaption>(?P<caption>[\s\S]*?)</figcaption>)?\s*</figure>',
    re.IGNORECASE,
)
INLINE_IMG_RE = re.compile(
    r"!\[(?P<alt>[^\]]*)]\(illustrations/_generated/"
    r"(?P<name>[^)]+?)(?:_dark|_light)?\.png\)"
)


@dataclass(frozen=True)
class FigureContext:
    position: int
    alt: str
    caption: str


@dataclass(frozen=True)
class ExportRecord:
    article_order: int
    illustration_order: int
    content_kind: str
    curriculum_section: str
    section_folder: str
    slug: str
    article_title: str
    illustration_name: str
    filename: str
    caption: str
    alt: str
    content_path: str
    source_path: str
    light_path: str
    dark_path: str


def load_canonical_curriculum_order() -> tuple[list[str], dict[str, list[str]]]:
    source = (PROJECT_ROOT / "web" / "src" / "lib" / "questions.ts").read_text(encoding="utf-8")
    sections_match = re.search(
        r"const ROADMAP_SECTION_SEQUENCE: Section\[\] = (\[[\s\S]*?\n\])",
        source,
    )
    slugs_match = re.search(
        r"const SECTION_ROADMAP_SLUG_ORDER: Record<Section, string\[]> = "
        r"(\{[\s\S]*?\n\})\n\nfunction getRoadmapIndex",
        source,
    )
    if not sections_match or not slugs_match:
        raise RuntimeError("Could not parse canonical curriculum order from questions.ts")
    return ast.literal_eval(sections_match.group(1)), ast.literal_eval(slugs_match.group(1))


ROADMAP_SECTION_SEQUENCE, SECTION_ROADMAP_SLUG_ORDER = load_canonical_curriculum_order()
SECTION_ORDER = {section: index for index, section in enumerate(ROADMAP_SECTION_SEQUENCE)}

SECTION_CONFIG = {
    "Math & Tensor Foundations": {"icon": "📊", "color": "#38bdf8"},
    "Classical ML & Evaluation": {"icon": "🧮", "color": "#fbbf24"},
    "Deep Learning Foundations": {"icon": "📚", "color": "#a3e635"},
    "Core LLM Foundations": {"icon": "🧪", "color": "#34d399"},
    "Applied LLM Engineering & RAG": {"icon": "🧰", "color": "#60a5fa"},
    "Transformer & Multimodal Architectures": {"icon": "🧠", "color": "#a78bfa"},
    "Training, Fine-Tuning & Alignment": {"icon": "🧬", "color": "#fb7185"},
    "Advanced Agents & Retrieval": {"icon": "🤖", "color": "#c084fc"},
    "GPU Systems & LLM Inference": {"icon": "⚡", "color": "#facc15"},
    "AI System Design & Interviewing": {"icon": "🏗️", "color": "#fb923c"},
    "Project Deep Dives": {"icon": "🔬", "color": "#22d3ee"},
    "Blog": {"icon": "✍️", "color": "#94a3b8"},
}


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(html.unescape(re.sub(r"<[^>]+>", "", value)).split())


def figure_contexts(markdown: str) -> dict[str, FigureContext]:
    contexts: dict[str, FigureContext] = {}
    for match in FIGURE_RE.finditer(markdown):
        contexts.setdefault(
            match.group("name"),
            FigureContext(
                position=match.start(),
                alt=clean_text(match.group("alt")),
                caption=clean_text(match.group("caption")),
            ),
        )
    for match in INLINE_IMG_RE.finditer(markdown):
        contexts.setdefault(
            match.group("name"),
            FigureContext(
                position=match.start(),
                alt=clean_text(match.group("alt")),
                caption="",
            ),
        )
    return contexts


def embedded_illustration_names(markdown: str) -> set[str]:
    names: set[str] = set()
    for match in EMBEDDED_ILLUSTRATION_RE.finditer(markdown):
        name = parse_attributes(match.group(1)).get("name", "").removesuffix(".tsx")
        if name:
            names.add(name)
    return names


def valid_illustration_names(article_dir: Path) -> set[str]:
    illustration_dir = article_dir / "illustrations"
    names = {path.stem for path in illustration_dir.glob("*.tsx")} if illustration_dir.exists() else set()
    content_path = article_dir / "content.md"
    if content_path.exists():
        names.update(embedded_illustration_names(content_path.read_text(encoding="utf-8")))
    return names


def source_name_for_generated_light(path: Path) -> str:
    stem = path.stem.removesuffix("_light")
    scene_match = SCENE_STEM_RE.match(stem)
    return scene_match.group("name") if scene_match else stem


def roadmap_position(section: str, slug: str) -> int:
    slugs = SECTION_ROADMAP_SLUG_ORDER.get(section, [])
    try:
        return slugs.index(slug)
    except ValueError:
        return 9999


def blog_date_sort_value(published_at: object) -> int:
    digits = re.sub(r"\D", "", str(published_at or ""))
    return -int(digits[:8]) if len(digits) >= 8 else 0


def article_sort_key(article: dict[str, object]) -> tuple[object, ...]:
    if article["content_kind"] == "blog":
        return (
            len(SECTION_ORDER),
            blog_date_sort_value(article.get("published_at")),
            str(article["title"]),
        )
    section = str(article["curriculum_section"])
    return (
        SECTION_ORDER.get(section, 9998),
        roadmap_position(section, str(article["slug"])),
        str(article["slug"]),
    )


def filename_slug(slug: str) -> str:
    normalized = NON_FILENAME_RE.sub("_", slug.lower()).strip("_")
    return normalized or "article"


def build_catalog() -> list[dict[str, object]]:
    articles: dict[str, dict[str, object]] = {}
    light_images = sorted(CONTENT_DIR.glob("*/*/illustrations/_generated/*_light.png"))

    for light_path in light_images:
        article_dir = light_path.parent.parent.parent
        source_name = source_name_for_generated_light(light_path)
        if source_name not in valid_illustration_names(article_dir):
            continue

        bundle = load_content_bundle(article_dir)
        if bundle is None or bundle.metadata.get("hidden"):
            continue

        section_folder = article_dir.parent.name
        slug = article_dir.name
        key = f"{section_folder}/{slug}"
        content_kind = "blog" if section_folder == "blog" else "learn"
        curriculum_section = "Blog" if content_kind == "blog" else str(
            bundle.metadata.get("section", "Uncategorized")
        )
        contexts = figure_contexts(bundle.body)
        context = contexts.get(source_name, FigureContext(position=10**12, alt="", caption=""))
        dark_path = light_path.with_name(light_path.name.replace("_light.png", "_dark.png"))
        if not dark_path.exists():
            raise FileNotFoundError(f"Missing dark variant for {light_path}")

        article = articles.setdefault(
            key,
            {
                "section_folder": section_folder,
                "slug": slug,
                "title": str(bundle.metadata.get("title", slug)),
                "curriculum_section": curriculum_section,
                "content_kind": content_kind,
                "published_at": bundle.metadata.get("publishedAt", ""),
                "content_path": bundle.content_path,
                "article_dir": article_dir,
                "illustrations": [],
            },
        )
        article["illustrations"].append(
            {
                "name": light_path.stem.removesuffix("_light"),
                "source_name": source_name,
                "light": light_path,
                "dark": dark_path,
                "position": context.position,
                "alt": context.alt,
                "caption": context.caption,
            }
        )

    sorted_articles = sorted(articles.values(), key=article_sort_key)
    for article in sorted_articles:
        article["illustrations"].sort(key=lambda item: (item["position"], item["name"]))
    return sorted_articles


def prepare_output_dir(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    marker = output_dir / EXPORT_MARKER
    existing_entries = list(output_dir.iterdir())
    legacy_default_export = (
        output_dir == DEFAULT_OUTPUT_DIR
        and (output_dir / "README.md").is_file()
        and (output_dir / "manifest.json").is_file()
        and (output_dir / "index.html").is_file()
        and (output_dir / "README.md").read_text(encoding="utf-8").startswith(
            "# LeetLLM illustration review export\n"
        )
    )
    if existing_entries and not marker.is_file() and not legacy_default_export:
        raise RuntimeError(
            f"Refusing to clean unmarked non-empty output directory: {output_dir}"
        )
    marker.write_text("LeetLLM illustration review export\n", encoding="utf-8")
    for directory in (output_dir / "light", output_dir / "dark"):
        if directory.exists():
            shutil.rmtree(directory)
        directory.mkdir()
    for filename in ("index.html", "manifest.csv", "manifest.json", "README.md"):
        (output_dir / filename).unlink(missing_ok=True)


def source_path_for(article: dict[str, object], source_name: str) -> Path:
    source_path = Path(article["article_dir"]) / "illustrations" / f"{source_name}.tsx"
    return source_path if source_path.exists() else Path(article["content_path"])


def export_images(articles: list[dict[str, object]], output_dir: Path) -> list[ExportRecord]:
    records: list[ExportRecord] = []
    for article_order, article in enumerate(articles):
        slug = str(article["slug"])
        for illustration_order, illustration in enumerate(article["illustrations"], start=1):
            filename = f"{article_order:03d}_{filename_slug(slug)}_{illustration_order:02d}.png"
            light_destination = output_dir / "light" / filename
            dark_destination = output_dir / "dark" / filename
            shutil.copy2(Path(illustration["light"]), light_destination)
            shutil.copy2(Path(illustration["dark"]), dark_destination)
            source_path = source_path_for(article, str(illustration["source_name"]))
            records.append(
                ExportRecord(
                    article_order=article_order,
                    illustration_order=illustration_order,
                    content_kind=str(article["content_kind"]),
                    curriculum_section=str(article["curriculum_section"]),
                    section_folder=str(article["section_folder"]),
                    slug=slug,
                    article_title=str(article["title"]),
                    illustration_name=str(illustration["name"]),
                    filename=filename,
                    caption=str(illustration["caption"]),
                    alt=str(illustration["alt"]),
                    content_path=Path(article["content_path"]).relative_to(PROJECT_ROOT).as_posix(),
                    source_path=source_path.relative_to(PROJECT_ROOT).as_posix(),
                    light_path=f"light/{filename}",
                    dark_path=f"dark/{filename}",
                )
            )
    return records


def write_manifests(records: list[ExportRecord], output_dir: Path) -> None:
    rows = [asdict(record) for record in records]
    (output_dir / "manifest.json").write_text(
        json.dumps(rows, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    with (output_dir / "manifest.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]) if rows else [])
        if rows:
            writer.writeheader()
            writer.writerows(rows)


def section_divider_html(section: str, article_count: int, illustration_count: int) -> str:
    config = SECTION_CONFIG.get(section, {"icon": "📄", "color": "#888"})
    return f"""<div class="section-divider">
<h2><span style="color: {config['color']};">{config['icon']}</span> {html.escape(section)}</h2>
<div class="section-count">{article_count} articles · {illustration_count} illustrations</div>
</div>
"""


def write_gallery(
    articles: list[dict[str, object]],
    records: list[ExportRecord],
    output_dir: Path,
) -> Path:
    records_by_article: dict[int, list[ExportRecord]] = {}
    for record in records:
        records_by_article.setdefault(record.article_order, []).append(record)

    section_stats: dict[str, tuple[int, int]] = {}
    for article in articles:
        section = str(article["curriculum_section"])
        article_count, illustration_count = section_stats.get(section, (0, 0))
        section_stats[section] = (
            article_count + 1,
            illustration_count + len(article["illustrations"]),
        )

    page = f"""<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LeetLLM Illustration Review</title>
<style>
* {{ box-sizing: border-box; }}
html {{ scroll-behavior: smooth; }}
body {{ margin: 0; font-family: Inter, system-ui, sans-serif; background: #09090b; color: #e5e7eb; }}
.toolbar {{ position: sticky; top: 0; z-index: 20; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; padding: 14px 20px; background: rgba(9,9,11,.96); border-bottom: 1px solid #27272a; }}
.toolbar input {{ flex: 1; min-width: 260px; padding: 9px 12px; color: #e5e7eb; background: #18181b; border: 1px solid #3f3f46; border-radius: 8px; }}
.toolbar select {{ padding: 9px 12px; color: #e5e7eb; background: #18181b; border: 1px solid #3f3f46; border-radius: 8px; cursor: pointer; }}
button {{ padding: 9px 12px; color: #e5e7eb; background: #27272a; border: 1px solid #52525b; border-radius: 8px; cursor: pointer; }}
main {{ max-width: 1600px; margin: 0 auto; padding: 20px; }}
h1 {{ margin: 18px 0 8px; text-align: center; color: #a78bfa; }}
.stats {{ text-align: center; color: #a1a1aa; margin-bottom: 24px; }}
.rubric {{ margin: 0 auto 28px; max-width: 1180px; border: 1px solid #3f3f46; border-radius: 10px; background: #111113; }}
.rubric summary {{ padding: 12px 16px; color: #c4b5fd; font-weight: 700; cursor: pointer; }}
.rubric-body {{ padding: 0 18px 16px; color: #d4d4d8; font-size: 13px; line-height: 1.55; }}
.rubric-body ol {{ margin: 8px 0 12px; padding-left: 22px; }}
.rubric-body p {{ margin: 8px 0 0; color: #a1a1aa; }}
.section-divider {{ margin: 44px 0 20px; padding: 14px 20px; border-left: 4px solid #a78bfa; border-radius: 8px; background: linear-gradient(90deg, rgba(167,139,250,.14), transparent); }}
.section-divider h2 {{ margin: 0; font-size: 20px; }}
.section-count {{ margin-top: 4px; color: #a1a1aa; font-size: 13px; }}
.article {{ margin-bottom: 32px; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; background: #111113; }}
.article-header {{ display: flex; gap: 14px; align-items: baseline; padding: 14px 18px; background: #18181b; }}
.article-order {{ flex: 0 0 auto; color: #a78bfa; font: 700 14px ui-monospace, monospace; }}
.article-title {{ font-weight: 650; }}
.article-meta {{ margin-left: auto; color: #71717a; font-size: 12px; }}
.illustration-grid {{ display: grid; gap: 18px; padding: 18px; }}
.illustration {{ border: 1px solid #303036; border-radius: 10px; overflow: hidden; background: #0d0d10; }}
.ill-header {{ display: flex; gap: 12px; align-items: center; padding: 10px 12px; background: #18181b; }}
.ill-name {{ color: #d4d4d8; font: 600 13px ui-monospace, monospace; }}
.ill-id {{ color: #8b5cf6; font: 700 12px ui-monospace, monospace; }}
.context {{ padding: 10px 12px; color: #d4d4d8; font-size: 13px; line-height: 1.45; border-bottom: 1px solid #27272a; }}
.context .alt {{ margin-top: 5px; color: #71717a; }}
.pair {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px; background: #27272a; }}
.pair.single-theme {{ grid-template-columns: minmax(0, 1180px); justify-content: center; padding: 18px; }}
.theme-hidden {{ display: none; }}
.variant {{ position: relative; min-width: 0; }}
.variant img {{ width: 100%; display: block; cursor: zoom-in; }}
.variant .label {{ position: absolute; top: 8px; left: 8px; padding: 3px 8px; border-radius: 5px; color: #d4d4d8; background: rgba(0,0,0,.72); font-size: 11px; }}
.light-bg {{ background: #fff; }}
.dark-bg {{ background: #151525; }}
textarea {{ width: 100%; min-height: 54px; padding: 9px 11px; resize: vertical; color: #e5e7eb; background: #111113; border: 0; border-top: 1px solid #27272a; }}
.zoom-overlay {{ display: none; position: fixed; inset: 0; z-index: 50; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,.92); cursor: zoom-out; }}
.zoom-overlay.active {{ display: flex; }}
.zoom-overlay img {{ max-width: 98%; max-height: 96vh; object-fit: contain; }}
.hidden {{ display: none !important; }}
@media (max-width: 900px) {{ .pair {{ grid-template-columns: 1fr; }} .article-meta {{ display: none; }} }}
</style>
</head><body>
<div class="toolbar">
  <input id="search" type="search" placeholder="Filter article, slug, image name, caption…">
  <select id="theme-view" aria-label="Theme display">
    <option value="both">Light + dark</option>
    <option value="light">Light only</option>
    <option value="dark">Dark only</option>
  </select>
  <button id="export-notes">Export notes</button>
  <button id="clear-notes">Clear notes</button>
</div>
<main>
<h1>LeetLLM Illustration Review</h1>
<div class="stats">{len(records)} illustrations across {len(articles)} articles · roadmap order, then blog archive order · light and dark</div>
<details class="rubric" open>
  <summary>Value-first review rubric</summary>
  <div class="rubric-body">
    <ol>
      <li><strong>Incremental value:</strong> reveals a relationship, mechanism, shape, quantity, path, or trade-off better than prose.</li>
      <li><strong>Visual encoding:</strong> position, direction, size, color, grouping, or an axis carries meaning. Not prose in cards.</li>
      <li><strong>Single job:</strong> teaching purpose fits in one sentence; every panel supports it.</li>
      <li><strong>Technical fidelity:</strong> labels, formulas, data, directions, scales, and states match article and caption.</li>
      <li><strong>Visual polish:</strong> both themes are readable, balanced, tightly fitted, and free from clipping, collisions, ambiguous arrows, or dead space.</li>
    </ol>
    <p>Keep only when all five pass. Redesign when concept needs a visual but execution fails. Delete or move to prose when image is a title card, prompt, outline, or decorative restatement. Leave notes only for issues.</p>
  </div>
</details>
<div id="zoom" class="zoom-overlay"><img id="zoom-img" alt="Expanded illustration"></div>
"""

    current_section = None
    for article_order, article in enumerate(articles):
        section = str(article["curriculum_section"])
        if section != current_section:
            article_count, illustration_count = section_stats[section]
            page += section_divider_html(section, article_count, illustration_count)
            current_section = section

        title = html.escape(str(article["title"]))
        slug = html.escape(str(article["slug"]))
        article_records = records_by_article.get(article_order, [])
        searchable_article = html.escape(f"{article['title']} {article['slug']} {section}".lower(), quote=True)
        page += f"""<section class="article" data-search="{searchable_article}">
<div class="article-header">
  <span class="article-order">{article_order:03d}</span>
  <span class="article-title">{title}</span>
  <span class="article-meta">{slug} · {len(article_records)} images</span>
</div>
<div class="illustration-grid">
"""
        for record in article_records:
            display_key = f"{record.article_order:03d}-{record.illustration_order:02d}"
            storage_key = (
                f"{record.content_kind}/{record.section_folder}/{record.slug}/"
                f"{record.illustration_name}"
            )
            searchable = html.escape(
                f"{record.article_title} {record.slug} {record.illustration_name} "
                f"{record.caption} {record.alt}".lower(),
                quote=True,
            )
            caption = html.escape(record.caption or "No caption in article.")
            alt = html.escape(record.alt or "No alt text in article.")
            name = html.escape(record.illustration_name)
            light_path = html.escape(record.light_path, quote=True)
            dark_path = html.escape(record.dark_path, quote=True)
            filename = html.escape(record.filename)
            page += f"""<article class="illustration" id="ill-{display_key}" data-key="{html.escape(storage_key, quote=True)}" data-legacy-key="{display_key}" data-search="{searchable}">
<div class="ill-header">
  <span class="ill-id">{display_key}</span>
  <span class="ill-name">{name}</span>
</div>
<div class="context"><strong>Caption:</strong> {caption}<div class="alt"><strong>Alt:</strong> {alt}</div></div>
<div class="pair">
  <div class="variant light-bg"><span class="label">Light · {filename}</span><img src="{light_path}" loading="lazy" alt="{alt}"></div>
  <div class="variant dark-bg"><span class="label">Dark · {filename}</span><img src="{dark_path}" loading="lazy" alt="{alt}"></div>
</div>
<textarea class="notes" placeholder="Notes for {display_key}…"></textarea>
</article>
"""
        page += "</div></section>\n"

    page += """</main>
<script>
const storageKey = 'leetllm-illustration-review-notes-v1';
const themeStorageKey = 'leetllm-illustration-theme-view-v1';
const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
const legacyStableSaved = JSON.parse(localStorage.getItem('leetllm-illustration-review-v2') || '{}');
const legacyIndexedSaved = JSON.parse(localStorage.getItem('leetllm-illustration-review-v1') || '{}');
let importedLegacyNotes = false;
const illustrations = [...document.querySelectorAll('.illustration')];

function persist() {
  const state = {};
  illustrations.forEach(card => {
    const key = card.dataset.key;
    const notes = card.querySelector('.notes').value;
    if (notes) state[key] = notes;
  });
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function applyFilter() {
  const query = document.getElementById('search').value.trim().toLowerCase();
  document.querySelectorAll('.article').forEach(article => {
    let visible = 0;
    article.querySelectorAll('.illustration').forEach(card => {
      const matchesText = !query || card.dataset.search.includes(query) || article.dataset.search.includes(query);
      card.classList.toggle('hidden', !matchesText);
      if (matchesText) visible += 1;
    });
    article.classList.toggle('hidden', visible === 0);
  });
}

function applyThemeView() {
  const theme = document.getElementById('theme-view').value;
  document.querySelectorAll('.pair').forEach(pair => {
    pair.classList.toggle('single-theme', theme !== 'both');
    pair.querySelector('.light-bg').classList.toggle('theme-hidden', theme === 'dark');
    pair.querySelector('.dark-bg').classList.toggle('theme-hidden', theme === 'light');
  });
  localStorage.setItem(themeStorageKey, theme);
}

illustrations.forEach(card => {
  const savedNotes = saved[card.dataset.key];
  const legacyNotes = legacyStableSaved[card.dataset.key]?.notes
    || legacyIndexedSaved[card.dataset.legacyKey]?.notes
    || '';
  if (savedNotes === undefined && legacyNotes) importedLegacyNotes = true;
  card.querySelector('.notes').value = savedNotes ?? legacyNotes;
  card.querySelector('.notes').addEventListener('input', persist);
  card.querySelectorAll('img').forEach(img => img.addEventListener('click', () => {
    document.getElementById('zoom-img').src = img.src;
    document.getElementById('zoom').classList.add('active');
  }));
});

document.getElementById('zoom').addEventListener('click', event => event.currentTarget.classList.remove('active'));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const zoom = document.getElementById('zoom');
  if (!zoom.classList.contains('active')) return;
  zoom.classList.remove('active');
  event.preventDefault();
});
document.getElementById('search').addEventListener('input', applyFilter);
const savedTheme = localStorage.getItem(themeStorageKey);
if (['both', 'light', 'dark'].includes(savedTheme)) {
  document.getElementById('theme-view').value = savedTheme;
}
document.getElementById('theme-view').addEventListener('change', applyThemeView);
document.getElementById('export-notes').addEventListener('click', () => {
  const payload = illustrations.map(card => ({
    key: card.dataset.key,
    notes: card.querySelector('.notes').value,
  })).filter(item => item.notes);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'}));
  link.download = 'leetllm-illustration-review-notes.json';
  link.click();
  URL.revokeObjectURL(link.href);
});
document.getElementById('clear-notes').addEventListener('click', event => {
  const hasNotes = illustrations.some(card => card.querySelector('.notes').value.trim());
  if (!hasNotes || !window.confirm('Clear all saved illustration notes?')) return;

  illustrations.forEach(card => {
    card.querySelector('.notes').value = '';
  });
  localStorage.setItem(storageKey, '{}');
  localStorage.removeItem('leetllm-illustration-review-v2');
  localStorage.removeItem('leetllm-illustration-review-v1');

  const button = event.currentTarget;
  const originalLabel = button.textContent;
  button.textContent = 'Notes cleared';
  window.setTimeout(() => {
    button.textContent = originalLabel;
  }, 1400);
});

if (importedLegacyNotes) persist();
applyThemeView();
</script>
</body></html>
"""

    output_path = output_dir / "index.html"
    output_path.write_text(page, encoding="utf-8")
    return output_path


def write_readme(records: list[ExportRecord], articles: list[dict[str, object]], output_dir: Path) -> None:
    (output_dir / "README.md").write_text(
        f"""# LeetLLM illustration review export

Generated by `uv run scripts/review-illustrations.py`.

- `{len(records)}` illustrations across `{len(articles)}` visible article bundles
- Learn articles use canonical course order from `web/src/lib/questions.ts`
- Blogs follow archive order: newest `publishedAt` first, then title
- Filenames use `<article-order>_<article-slug>_<illustration-order>.png`
- Matching filenames live under `light/` and `dark/`
- `index.html` shows both themes with article/image names, captions, persistent notes, a Clear notes action, and the value-first review rubric from `ILLUSTRATION_GUIDELINES.md`
- `manifest.csv` and `manifest.json` map exported files back to source and content
""",
        encoding="utf-8",
    )


def write_compatibility_page(index_path: Path) -> None:
    COMPATIBILITY_PAGE.write_text(
        "<!doctype html><meta charset=\"utf-8\">"
        f"<meta http-equiv=\"refresh\" content=\"0;url={html.escape(index_path.as_uri(), quote=True)}\">"
        f"<a href=\"{html.escape(index_path.as_uri(), quote=True)}\">Open illustration review</a>\n",
        encoding="utf-8",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"export destination (default: {DEFAULT_OUTPUT_DIR})",
    )
    parser.add_argument("--open", action="store_true", help="open generated gallery with xdg-open")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output_dir = args.output_dir.expanduser().resolve()
    prepare_output_dir(output_dir)
    articles = build_catalog()
    records = export_images(articles, output_dir)
    write_manifests(records, output_dir)
    write_readme(records, articles, output_dir)
    index_path = write_gallery(articles, records, output_dir)
    write_compatibility_page(index_path)

    print(f"Review gallery: {index_path}")
    print(f"Illustrations: {len(records)} across {len(articles)} articles")
    print(f"Files copied: {len(records) * 2} light/dark PNGs")
    print("Order: canonical roadmap, then blog archive")

    if args.open and shutil.which("xdg-open"):
        subprocess.Popen(
            ["xdg-open", str(index_path)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
