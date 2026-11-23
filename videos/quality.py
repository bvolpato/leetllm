#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Bind editorial scores to verified movies and add a review table to a gallery."""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import io
import json
import re
import runpy
import shutil
import subprocess
from pathlib import Path


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def load_reviews(path: Path, rubric_path: Path, receipts: list[dict], directory: Path) -> tuple[dict, list[dict]]:
    rubric = json.loads(rubric_path.read_text())
    dimensions = rubric["dimensions"]
    maxima = {item["id"]: item["maximum"] for item in dimensions}
    if sum(maxima.values()) != 100 or len(maxima) != len(dimensions):
        raise ValueError("Quality rubric must have unique dimensions totaling 100")
    report = json.loads(path.read_text())
    if (report.get("version") != 1 or report.get("rubricId") != rubric["id"]
            or report.get("rubricSha256") != digest(rubric_path) or not report.get("scope")):
        raise ValueError("Quality review version, rubric, or scope is invalid")
    minimum_score = report.get("minimumScore", 0)
    if type(minimum_score) is not int or not 0 <= minimum_score <= 100:
        raise ValueError("Quality review minimum score must be an integer from 0 to 100")
    reviews = report.get("lessons", [])
    indexed = {item["id"]: item for item in reviews}
    if len(indexed) != len(reviews) or set(indexed) != {receipt["id"] for receipt in receipts}:
        raise ValueError("Quality review must cover the selected lessons exactly, without duplicates")
    ordered = []
    for receipt in receipts:
        item = indexed[receipt["id"]]
        movie = directory / receipt["id"] / f'{receipt["id"]}.mp4'
        if (item.get("movieSha256") != receipt["sha256"]
                or item.get("sourceFingerprint") != receipt["fingerprint"]
                or digest(movie) != receipt["sha256"]):
            raise ValueError(f'Stale quality review: {receipt["id"]}')
        scores, reasons = item.get("scores", {}), item.get("rationale", {})
        if set(scores) != set(maxima) or set(reasons) != set(maxima):
            raise ValueError(f'Incomplete quality dimensions: {receipt["id"]}')
        for dimension, maximum in maxima.items():
            score = scores[dimension]
            if type(score) is not int or not 0 <= score <= maximum or not isinstance(reasons[dimension], str) or not reasons[dimension].strip():
                raise ValueError(f'Invalid quality score or rationale: {receipt["id"]}/{dimension}')
        for name in ("strengths", "improvements", "blockers", "fixes"):
            if not isinstance(item.get(name), list) or any(not isinstance(value, str) or not value.strip() for value in item[name]):
                raise ValueError(f'Invalid quality notes: {receipt["id"]}/{name}')
        if not item.get("reviewer") or not item.get("viewedImages") or not item.get("reviewedScenes"):
            raise ValueError(f'Missing editorial review provenance: {receipt["id"]}')
        timeline = json.loads((directory / receipt["id"] / "timeline.json").read_text())
        if item["reviewedScenes"] != [scene["id"] for scene in timeline["scenes"]]:
            raise ValueError(f'Incomplete scene review: {receipt["id"]}')
        total = sum(scores.values())
        if "total" in item and item["total"] != total:
            raise ValueError(f'Quality total does not match dimensions: {receipt["id"]}')
        if total < minimum_score:
            raise ValueError(f'Video quality below required minimum: {receipt["id"]} ({total} < {minimum_score})')
        if minimum_score and item["blockers"]:
            raise ValueError(f'Unresolved quality blocker: {receipt["id"]}')
        ordered.append({**item, "title": receipt["title"], "total": total})
    return {**rubric, "reviewScope": report["scope"], "minimumScore": minimum_score}, ordered


def band(rubric: dict, total: int) -> str:
    return next(item["label"] for item in rubric["bands"] if total >= item["minimum"])


def score_details(item: dict, rubric: dict) -> str:
    esc = html.escape
    rows = "".join(
        f'<tr><th scope="row">{esc(d["title"])}</th><td>{item["scores"][d["id"]]}/{d["maximum"]}</td>'
        f'<td>{esc(item["rationale"][d["id"]])}</td></tr>' for d in rubric["dimensions"]
    )
    notes = "".join(f'<li>{esc(note)}</li>' for note in item["improvements"])
    blockers = "".join(f'<li>{esc(note)}</li>' for note in item["blockers"])
    fixes = "".join(f'<li>{esc(note)}</li>' for note in item["fixes"])
    frames = "".join(f'<a href="{esc(entry["path"], quote=True)}">{esc(entry.get("label", "Frame " + str(index)))}</a>'
                     for index, entry in enumerate(item["viewedImages"], 1))
    status = "Needs repair" if item["blockers"] else band(rubric, item["total"])
    return (f'<details class="quality-details"><summary>Review: {item["total"]}/100 · {esc(status)}</summary>'
            f'<div class="table-scroll"><table><caption>Quality breakdown</caption><tbody>{rows}</tbody></table></div>'
            + (f'<p>Repairs verified in this movie</p><ul>{fixes}</ul>' if fixes else "")
            + (f'<p>Remaining refinements</p><ul>{notes}</ul>' if notes else "")
            + (f'<p class="quality-blocker">Unresolved issues</p><ul>{blockers}</ul>' if blockers else "")
            + f'<p>Reviewer: {esc(item["reviewer"])}. Movie: <code>{item["movieSha256"][:12]}</code>.</p>'
            + f'<nav aria-label="Reviewed images">{frames}</nav></details>')


def prepare_quality(directory: Path, reviews_path: Path, rubric_path: Path, receipts: list[dict]) -> tuple[dict, list[dict], list[tuple[Path, Path]]]:
    rubric, reviews = load_reviews(reviews_path, rubric_path, receipts, directory)
    evidence = []
    repository = Path(__file__).resolve().parent.parent
    for item in reviews:
        published = []
        for entry in item["viewedImages"]:
            expected = entry.get("sha256", "")
            if not re.fullmatch(r"[a-f0-9]{64}", expected):
                raise ValueError(f'Invalid review image checksum: {item["id"]}')
            target = directory / "quality-evidence" / item["id"] / f"{expected}.png"
            candidates = [repository / entry["path"], directory / entry["path"], target]
            source = next((candidate for candidate in candidates
                           if (candidate.resolve().is_relative_to(repository) or candidate.resolve().is_relative_to(directory.resolve()))
                           and candidate.suffix == ".png" and candidate.is_file() and digest(candidate) == expected), None)
            if source is None:
                raise ValueError(f'Review image is missing or changed: {item["id"]}/{entry["path"]}')
            evidence.append((source, target))
            published.append({**entry, "label": entry.get("label", Path(entry["path"]).stem), "path": target.relative_to(directory).as_posix()})
        item["viewedImages"] = published
    return rubric, reviews, evidence


def publish_quality(directory: Path, reviews_path: Path, rubric_path: Path, receipts: list[dict], *, gallery_html: str | None = None) -> list[Path]:
    rubric, reviews, evidence = prepare_quality(directory, reviews_path, rubric_path, receipts)
    index = directory / "index.html"
    original = index.read_text() if gallery_html is None else gallery_html
    # Reapplying a review replaces its old UI rather than duplicating it.
    original = re.sub(r'<!-- quality-card:start -->.*?<!-- quality-card:end -->', '', original, flags=re.S)
    original = re.sub(r'<!-- quality:start -->.*?<!-- quality:end -->', '', original, flags=re.S)
    for item in reviews:
        marker = f'<source src="{item["id"]}/{item["id"]}.mp4?'
        position = original.find(marker)
        if position < 0:
            raise ValueError(f'Gallery is missing reviewed movie: {item["id"]}')
        opening = original.rfind("<article", 0, position)
        tag_end = original.find(">", opening)
        original = original[:opening] + f'<article id="lesson-{item["id"]}">' + original[tag_end + 1:]
        position = original.find(marker)
        end = original.find("</article>", position)
        original = original[:end] + '<!-- quality-card:start -->' + score_details(item, rubric) + '<!-- quality-card:end -->' + original[end:]
    esc = html.escape
    headings = "".join(f'<th scope="col">{esc(d["title"])} /{d["maximum"]}</th>' for d in rubric["dimensions"])
    rows = []
    for number, item in enumerate(reviews, 1):
        cells = "".join(f'<td>{item["scores"][d["id"]]}</td>' for d in rubric["dimensions"])
        note = "; ".join(item["blockers"] or item["improvements"])
        rows.append(f'<tr data-score="{item["total"]}" data-order="{number}"><td>{number}</td>'
                    f'<th scope="row"><a href="#lesson-{item["id"]}">{esc(item["title"])}</a></th>'
                    f'<td><strong>{item["total"]}</strong></td>{cells}<td>{esc(note)}</td></tr>')
    criteria = "".join(f'<dt>{esc(d["title"])} ({d["maximum"]})</dt><dd>{esc(d["criteria"])}</dd>' for d in rubric["dimensions"])
    bands = "; ".join(f'{b["minimum"]}+ {b["label"]}' for b in rubric["bands"])
    average = sum(item["total"] for item in reviews) / len(reviews)
    section = ('<!-- quality:start --><style>.quality-panel{margin:28px 0;padding:20px;background:#111d34;border-radius:14px}'
               '.quality-panel h2{margin-bottom:12px}.quality-panel dt{font-weight:650;margin-top:12px}'
               '.quality-panel dd{margin:4px 0 12px;color:#b9c7dd}.table-scroll{overflow-x:auto;max-width:100%}'
               '.quality-panel table,.quality-details table{border-collapse:collapse;width:100%;font-size:14px;text-align:left}'
               '.quality-panel th,.quality-panel td,.quality-details th,.quality-details td{padding:10px;border-bottom:1px solid #34415b;vertical-align:top}'
               '.quality-panel table{min-width:1100px}.quality-panel select{font:inherit;background:#0a1020;color:#e9efff;padding:8px;margin:8px}'
               '.quality-details{margin-top:18px}.quality-details summary{cursor:pointer;font-weight:650;color:#82e4d5}'
               '.quality-details code{overflow-wrap:anywhere}.quality-blocker{color:#ffb49f}article{min-width:0}'
               '</style><div class="quality-panel" id="quality-review"><h2>Video quality review</h2>'
               f'<p>{len(reviews)} reviewed videos · Average {average:.1f}/100 · '
               f'{min(i["total"] for i in reviews)}–{max(i["total"] for i in reviews)} range.</p>'
               + (f'<p>Every video meets the {rubric["minimumScore"]}/100 target.</p>' if rubric["minimumScore"] else "")
               + f'<p>{esc(rubric["reviewScope"])}</p><details><summary>Rubric and score bands</summary>'
               f'<dl>{criteria}</dl><p>{esc(bands)}.</p><p>{esc(rubric["scoring"])}</p></details>'
               '<p><a href="quality-scores.csv" download>Download scores (CSV)</a> · '
               '<a href="quality-scores.md">Complete table (Markdown)</a> · <a href="quality-reviews.json">Review data</a></p>'
               '<details id="quality-table"><summary>Show all scores and review notes</summary>'
               '<label for="quality-sort">Sort scores</label><select id="quality-sort"><option value="order">Curriculum order</option>'
               '<option value="lowest">Lowest score first</option><option value="highest">Highest score first</option></select>'
               '<div class="table-scroll"><table><caption>Editorial review of every video</caption><thead><tr><th scope="col">#</th>'
               f'<th scope="col">Lesson</th><th scope="col">Total /100</th>{headings}<th scope="col">Remaining refinements</th>'
               '</tr></thead><tbody id="quality-rows">' + "".join(rows) + '</tbody></table></div></details></div>'
               '<script>document.getElementById("quality-sort").addEventListener("change",event=>{'
               'const body=document.getElementById("quality-rows");const rows=Array.from(body.rows);'
               'rows.sort((a,b)=>event.target.value==="order"?Number(a.dataset.order)-Number(b.dataset.order):'
               '(event.target.value==="lowest"?1:-1)*(Number(a.dataset.score)-Number(b.dataset.score))||Number(a.dataset.order)-Number(b.dataset.order));'
               'body.append(...rows);});'
               'document.getElementById("quality-rows").addEventListener("click",event=>{'
               'const link=event.target.closest("a");if(!link)return;'
               'const card=document.getElementById(link.hash.slice(1));'
               'const search=document.getElementById("lesson-search");'
               'if(card?.hidden&&search){search.value="";search.dispatchEvent(new Event("input"));}'
               '});</script><!-- quality:end -->')
    if '<section id="lessons">' not in original:
        raise ValueError("Gallery lesson container is missing")
    result = original.replace('<section id="lessons">', section + '<section id="lessons">', 1)
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    headers = ["#", "Lesson", "Total /100", *[f'{d["title"]} /{d["maximum"]}' for d in rubric["dimensions"]], "Remaining refinements", "Movie SHA-256"]
    writer.writerow(headers)
    markdown = ["# LeetLLM video quality review", "", rubric["reviewScope"], "", "| # | Lesson | Score | Remaining refinements |", "|---:|---|---:|---|"]
    for number, item in enumerate(reviews, 1):
        note = "; ".join(item["blockers"] or item["improvements"])
        writer.writerow([number, item["title"], item["total"], *[item["scores"][d["id"]] for d in rubric["dimensions"]], note, item["movieSha256"]])
        text = lambda value: value.replace("|", "\\|").replace("\n", " ")
        markdown.append(f'| {number} | {text(item["title"])} | {item["total"]} | {text(note)} |')
    files = {
        "quality-scores.csv": output.getvalue(),
        "quality-scores.md": "\n".join(markdown) + "\n",
        "quality-reviews.json": json.dumps({"version": 1, "rubricId": rubric["id"], "rubricSha256": digest(rubric_path), "scope": rubric["reviewScope"], "minimumScore": rubric["minimumScore"], "lessons": reviews}, indent=2) + "\n",
        "quality-rubric.json": rubric_path.read_text(),
    }
    for source, target in evidence:
        target.parent.mkdir(parents=True, exist_ok=True)
        if source.resolve() != target.resolve():
            shutil.copyfile(source, target)
    for name, content in files.items():
        (directory / name).write_text(content)
    temporary = directory / ".index-quality.partial.html"
    temporary.write_text(result)
    temporary.replace(index)
    return [*[directory / name for name in files], *dict.fromkeys(target for _, target in evidence)]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--reviews", type=Path, required=True)
    parser.add_argument("--rubric", type=Path, default=Path(__file__).with_name("quality-rubric.json"))
    args = parser.parse_args()
    source = Path(__file__).resolve().parent
    api = runpy.run_path(str(source / "package.py"))
    receipts = json.loads((args.input / "manifest.json").read_text())
    catalog_output = subprocess.run(["node", str(source / "catalog.mjs")], capture_output=True, text=True, check=True).stdout
    catalog = {item["id"]: item for item in json.loads(catalog_output)}
    for receipt in receipts:
        api["verify_render_sources"](source, receipt["id"], receipt)
        api["verify_article"](source.parent, catalog[receipt["id"]], receipt)
    files = publish_quality(args.input, args.reviews, args.rubric, receipts)
    print(json.dumps({"lessons": len(receipts), "reviewedImages": sum(path.suffix == ".png" for path in files),
                      "table": str(args.input / "quality-scores.csv"), "gallery": str(args.input / "index.html")}))


if __name__ == "__main__":
    main()
