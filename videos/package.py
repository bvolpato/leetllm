#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Package selected verified video lessons and their editable rendering sources."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import math
import runpy
import shutil
import subprocess
import zipfile
from pathlib import Path

MOTION_SCOPE = "Pixel change inside an explicitly declared teaching region. This does not verify semantic correctness, causal explanation, meaningful object motion, or aesthetics."

STAGE_ENGINE = "vizmatic.stage.renderFilmVideo"
CANVAS_ENGINE = "vizmatic.renderRgbaVideo"


def select_lessons(catalog: list[dict], requested: list[str] | None) -> list[str]:
    available = {lesson["id"] for lesson in catalog}
    selected = requested if requested is not None else [lesson["id"] for lesson in catalog]
    if not selected or len(selected) != len(set(selected)):
        raise ValueError("Select at least one lesson, without duplicate IDs")
    unknown = set(selected) - available
    if unknown:
        raise ValueError(f"Unknown lessons: {', '.join(sorted(unknown))}")
    return selected


def discover_catalog(source: Path, requested: list[str] | None) -> list[dict]:
    if requested is not None and (not requested or len(requested) != len(set(requested))):
        raise ValueError("Select at least one lesson, without duplicate IDs")
    catalog = []
    for lesson_id in requested if requested is not None else [None]:
        command = ["node", str(source / "catalog.mjs"), "--with-stage"]
        if lesson_id is not None:
            command.extend(("--lesson", lesson_id))
        catalog.extend(json.loads(subprocess.run(command, check=True, capture_output=True, text=True).stdout))
    return catalog


def archive_filename(value: str) -> str:
    if Path(value).name != value or not value.endswith(".zip") or value == ".zip":
        raise ValueError("Archive must be a .zip filename inside the output directory")
    return value


def editable_source_files(source: Path, adapters: list[Path]) -> list[Path]:
    extensions = {".mjs", ".js", ".py", ".json", ".md", ".yaml", ".yml", ".svg", ".html", ".css"}
    names = {".npmrc", ".gitignore", "LICENSE", "NOTICE"}
    excluded_directories = {"node_modules", "build", "dist", ".cache", "__pycache__", ".pytest_cache", ".git"}

    def is_source(path: Path) -> bool:
        return path.is_file() and (path.suffix in extensions or path.name in names)

    editable = [path for path in sorted(source.iterdir()) if is_source(path)]
    for folder in ("lib", "tools", "films", "lessons", "stage-lessons", "animations", "test", "assets", "collections", "reviews", "gallery", "private-gallery"):
        for directory, directories, files in (source / folder).walk():
            directories[:] = sorted(name for name in directories if name not in excluded_directories)
            editable.extend(path for name in sorted(files) if is_source(path := directory / name))
    editable.extend(sorted(adapters))
    return list(dict.fromkeys(editable))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def verify_article(repository: Path, lesson: dict, receipt: dict) -> Path:
    if receipt.get("id") != lesson["id"] or receipt.get("source") != lesson["source"]:
        raise ValueError(f"Delivery does not match lesson source: {lesson['id']}")
    article = repository / "web/src/content" / lesson["source"]
    if sha256(article) != receipt["sourceSha256"]:
        raise ValueError(f"Source article changed after rendering: {article}")
    return article


def verify_aggregate_occlusion(folder: Path, receipt: dict, frames: int, source: Path) -> Path:
    report_path = folder / "aggregate-occlusion.json"
    report = json.loads(report_path.read_text())
    tool_hash = hashlib.sha256(
        (source / "audit-occlusion.mjs").read_bytes()
        + (source / "lib/aggregate-occlusion.mjs").read_bytes()
    ).hexdigest()
    if (
        report.get("version") != 1
        or report.get("mode") != "all-frames"
        or report.get("rule") != "aggregate-later-fill-glyph-occlusion"
        or report.get("id") != receipt["id"]
        or report.get("videoSha256") != receipt["sha256"]
        or report.get("sourceFingerprint") != receipt["fingerprint"]
        or report.get("toolSha256") != tool_hash
        or report.get("frames") != frames
        or report.get("expectedFrames") != frames
        or report.get("issueFrames") != 0
        or report.get("issues") != []
        or report.get("passed") is not True
    ):
        raise ValueError(f"Complete aggregate text-occlusion audit has not passed: {receipt['id']}")
    return report_path


def verify_film_check(folder: Path, receipt: dict) -> Path:
    report_path = folder / "film-check.json"
    report = json.loads(report_path.read_text())
    if (
        report.get("version") != 1
        or report.get("id") != receipt["id"]
        or report.get("videoSha256") != receipt["sha256"]
        or report.get("sourceFingerprint") != receipt["fingerprint"]
        or report.get("errors") != 0
        or report.get("passed") is not True
    ):
        raise ValueError(f"Film check has not passed: {receipt['id']}")
    return report_path


def stage_source_files(source: Path, lesson_id: str) -> list[str]:
    program = (
        "import {stageSourceFiles} from './lib/stage-lesson.mjs';"
        f"process.stdout.write(JSON.stringify(stageSourceFiles({json.dumps(lesson_id)})));"
    )
    return json.loads(subprocess.run(
        ["node", "--input-type=module", "-e", program], cwd=source, check=True, capture_output=True,
    ).stdout)


def verify_render_sources(source: Path, lesson_id: str, receipt: dict) -> Path:
    adapter = receipt.get("ttsAdapter", {})
    if not isinstance(adapter, dict) or not isinstance(adapter.get("path"), str) or not isinstance(adapter.get("sha256"), str):
        raise TypeError(f"TTS adapter provenance is missing or invalid: {lesson_id}")
    relative = Path(adapter["path"])
    script = source.parent / relative
    if relative.is_absolute() or ".." in relative.parts or not script.resolve().is_relative_to(source.resolve()):
        raise ValueError("Editable packaging requires the TTS adapter inside videos/")
    adapter_bytes = script.read_bytes()
    if hashlib.sha256(adapter_bytes).hexdigest() != adapter["sha256"]:
        raise ValueError(f"TTS adapter changed after rendering: {adapter['path']}")
    if "sourceManifest" in receipt:
        result = subprocess.run(
            ["node", str(source / "tools/lesson-source.mjs"), "--root", str(source.parent), "--verify-stdin"],
            input=json.dumps(receipt), capture_output=True, text=True,
        )
        if result.returncode:
            raise ValueError(f"Source manifest verification failed: {result.stderr.strip()}")
        return script
    fingerprint = hashlib.sha256()
    for relative in stage_source_files(source, lesson_id) if receipt.get("videoEngine") == STAGE_ENGINE else (
        f"lessons/{lesson_id}.lesson.yaml",
        f"animations/{lesson_id}.mjs",
        "render.mjs",
        "lib/scene.mjs",
        "lib/lesson.mjs",
        "lib/narration-cues.mjs",
        "lib/captions.mjs",
        "lib/delivery.mjs",
        "lib/brand.mjs",
        "lib/frame-audit.mjs",
        "lib/layout-review.mjs",
        "assets/leetllm-mark.svg",
        "package-lock.json",
        "lib/concepts.mjs",
        "assets/concepts/manifest.json",
        *(path.relative_to(source).as_posix() for path in sorted((source / "assets/concepts").glob("*.svg"))),
    ):
        fingerprint.update((source / relative).read_bytes())
    if receipt.get("renderEngine") is not None:
        engine_bytes = subprocess.run(
            ["node", "--input-type=module", "-e",
             "import {renderEngineProvenance} from './lib/render-engine.mjs'; process.stdout.write(JSON.stringify(renderEngineProvenance()));"],
            cwd=source, check=True, capture_output=True,
        ).stdout
        if json.loads(engine_bytes) != receipt["renderEngine"]:
            raise ValueError(f"Vizmatic engine changed after rendering: {lesson_id}")
        fingerprint.update(engine_bytes)
    fingerprint.update(adapter_bytes)
    if fingerprint.hexdigest() != receipt["fingerprint"]:
        raise ValueError(f"Video was rendered with different source code: {lesson_id}")
    return script


def manifest_source_files(repository: Path, receipt: dict) -> list[Path]:
    """Include exact imported helpers, images, paper derivatives and provenance inputs."""
    manifest = receipt.get("sourceManifest")
    if manifest is None:
        return []
    if manifest.get("version") != 1 or manifest.get("kind") != "leetllm.production-source":
        raise ValueError("Unsupported production source manifest")
    root = repository.resolve()
    files = []
    for record in manifest["closure"]["files"]:
        relative = Path(record["path"])
        candidate = root / relative
        if relative.is_absolute() or ".." in relative.parts or not candidate.resolve().is_relative_to(root):
            raise ValueError(f"Source manifest path escapes repository: {relative}")
        if not candidate.is_file() or sha256(candidate) != record["sha256"]:
            raise ValueError(f"Source manifest input changed: {relative}")
        files.append(candidate)
    return files


def write_manifest_sources(bundle: zipfile.ZipFile, repository: Path, inputs: dict[Path, str]) -> None:
    """Write the verified bytes once, including non-code assets and source papers."""
    for file, expected in sorted(inputs.items()):
        data = file.read_bytes()
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError(f"Source manifest input changed before packaging: {file}")
        bundle.writestr(file.relative_to(repository).as_posix(), data, compress_type=zipfile.ZIP_DEFLATED)


def verify_text_ink(folder: Path, receipt: dict, timeline: dict, frames: int, source: Path, required: bool = False) -> Path | None:
    path = folder / "text-ink-audit.json"
    if not path.is_file():
        if required:
            raise ValueError(f"Text-ink audit is missing: {receipt['id']}")
        return None
    report = json.loads(path.read_text())
    if not isinstance(report, dict):
        raise ValueError(f"Current text-ink audit has not passed: {receipt['id']}")
    tool_hash = hashlib.sha256(
        (source / "audit-text-ink.mjs").read_bytes()
        + (source / "lib/text-ink-audit.mjs").read_bytes()
    ).hexdigest()
    timings = ([timeline["intro"]] if timeline.get("intro") else []) + timeline["scenes"]
    summaries = report.get("scenes", [])
    if not isinstance(summaries, list) or any(not isinstance(summary, dict) for summary in summaries):
        raise ValueError(f"Current text-ink audit has not passed: {receipt['id']}")
    coverage = len(summaries) == len(timings)
    expected_total = 0
    checked_labels = skipped_labels = 0
    for timing, summary in zip(timings, summaries):
        count = timing["frames"]
        if report.get("mode") == "all-frames":
            expected, samples = count, None
        else:
            selected = {0, count - 1}
            def add(time):
                selected.add(max(0, min(count - 1, math.floor(time * timeline["fps"] + 0.5))))
            for beat in timing.get("beats", []):
                add(beat["start"])
                for progress in (0.02, 0.25, 0.5, 0.75, 0.98):
                    add(beat["start"] + (beat["until"] - beat["start"]) * progress)
            if not timing.get("beats"):
                for progress in (0.02, 0.25, 0.5, 0.75, 0.98):
                    add(timing["duration"] * progress)
            samples = sorted(selected)
            expected = len(samples)
        expected_total += expected
        for key in ("checkedLabels", "skippedLabels"):
            if type(summary.get(key)) is not int or summary[key] < 0:
                raise ValueError(f"Current text-ink audit has not passed: {receipt['id']}")
        checked_labels += summary["checkedLabels"]
        skipped_labels += summary["skippedLabels"]
        coverage = coverage and summary.get("scene") == timing["id"] and summary.get("totalFrames") == count \
            and summary.get("checkedFrames") == expected and summary.get("sampleFrames") == samples \
            and summary.get("issueFrames") == 0
    if (
        report.get("version") != 1 or report.get("id") != receipt["id"]
        or report.get("rule") != "native-fillText-zero-discernible-ink"
        or report.get("mode") not in ("sampled-final", "all-frames")
        or report.get("timingSource") != "measured-final"
        or report.get("videoSha256") != receipt["sha256"]
        or report.get("sourceFingerprint") != receipt["fingerprint"]
        or report.get("toolSha256") != tool_hash
        or report.get("timelineSha256") != sha256(folder / "timeline.json")
        or report.get("receiptSha256") != sha256(folder / "verification.json")
        or report.get("width") != receipt["width"] or report.get("height") != receipt["height"]
        or report.get("fps") != timeline["fps"] or report.get("totalFrames") != frames
        or report.get("checkedFrames") != expected_total or not coverage
        or type(report.get("checkedLabels")) is not int or report["checkedLabels"] <= 0
        or report["checkedLabels"] != checked_labels
        or type(report.get("skippedLabels")) is not int or report["skippedLabels"] != skipped_labels
        or report.get("issueFrames") != 0 or report.get("issues") != [] or report.get("passed") is not True
    ):
        raise ValueError(f"Current text-ink audit has not passed: {receipt['id']}")
    return path


def run_motion_audit(source: Path, directory: Path, lesson_id: str) -> None:
    subprocess.run(
        ["node", str(source / "audit-motion.mjs"), "--lesson", lesson_id, "--input", str(directory.resolve())],
        check=True,
    )


def verify_motion_audit(
    folder: Path, receipt: dict, timeline: dict, frames: int, source: Path, required: bool = False,
) -> Path | None:
    path = folder / "motion-audit.json"
    if not path.is_file():
        if required:
            raise ValueError(f"Motion audit is missing: {receipt['id']}")
        return None
    report = json.loads(path.read_text())
    if not isinstance(report, dict):
        raise ValueError(f"Motion audit has not passed: {receipt['id']}")
    tool_hash = hashlib.sha256(
        (source / "audit-motion.mjs").read_bytes()
        + (source / "lib/motion-audit.mjs").read_bytes()
    ).hexdigest()
    lesson_path = source / "lessons" / f"{receipt['id']}.lesson.yaml"
    lesson_hash = sha256(lesson_path)
    timeline_path, receipt_path = folder / "timeline.json", folder / "verification.json"
    movie = folder / f"{receipt['id']}.mp4"
    timeline_hash, receipt_hash, movie_hash = sha256(timeline_path), sha256(receipt_path), sha256(movie)
    fps = timeline.get("fps")
    scenes = timeline.get("scenes", [])
    narrated_beats = sum(len(scene.get("beats", [])) for scene in scenes)
    expected_checks = []
    for scene_index, scene in enumerate(scenes):
        for beat_index, beat in enumerate(scene.get("beats", [])):
            if "motion_check" not in beat:
                continue
            declaration = beat["motion_check"]
            region = declaration.get("region")
            minimum = declaration.get("minimumChangedFraction", .002)
            if (
                not isinstance(region, list) or len(region) != 4
                or any(type(value) is not int for value in region)
                or type(minimum) not in (int, float) or not math.isfinite(minimum)
                or minimum <= 0 or minimum > 1
            ):
                raise ValueError(f"Motion audit has not passed: {receipt['id']}")
            samples = []
            for progress in (.12, .5, .88):
                requested_time = scene["start"] + beat["start"] + progress * (beat["until"] - beat["start"])
                frame = math.floor(requested_time * fps + .5)
                samples.append({"progress": progress, "requestedTime": requested_time,
                                "frame": frame, "time": frame / fps})
            expected_checks.append({"scene": scene["id"], "sceneIndex": scene_index, "beat": beat_index,
                                    "region": region, "minimumChangedFraction": minimum, "samples": samples})
    declared_checks = len(expected_checks)
    if required and not declared_checks:
        raise ValueError(f"Motion audit needs a declared teaching region: {receipt['id']}")
    coverage = report.get("coverage")
    checks = report.get("checks")
    coverage_fraction = declared_checks / narrated_beats if narrated_beats else 0
    coverage_matches = (
        isinstance(coverage, dict)
        and coverage.get("narratedBeats") == narrated_beats
        and coverage.get("declaredChecks") == declared_checks
        and coverage.get("checkedBeats") == declared_checks
        and isinstance(coverage.get("fraction"), (int, float))
        and math.isclose(coverage["fraction"], coverage_fraction, rel_tol=0, abs_tol=1e-12)
        and coverage.get("status") == ("declared-subset" if declared_checks else "none")
    )
    checks_match = isinstance(checks, list) and len(checks) == declared_checks
    if checks_match:
        for expected, check in zip(expected_checks, checks):
            if not isinstance(check, dict) or any(check.get(key) != value for key, value in expected.items()):
                checks_match = False
                break
            pairs = check.get("pairs")
            if not isinstance(pairs, list) or len(pairs) != 3:
                checks_match = False
                break
            pair_passes = []
            for pair, (from_index, to_index) in zip(pairs, ((0, 1), (1, 2), (0, 2))):
                area = expected["region"][2] * expected["region"][3]
                changed = pair.get("changedPixels") if isinstance(pair, dict) else None
                fraction = pair.get("changedFraction") if isinstance(pair, dict) else None
                valid_metrics = (
                    isinstance(pair, dict) and pair.get("from") == from_index and pair.get("to") == to_index
                    and type(changed) is int and 0 <= changed <= area and isinstance(fraction, (int, float))
                    and math.isclose(fraction, changed / area, rel_tol=0, abs_tol=1e-12)
                    and pair.get("regionPixels") == area
                )
                if not valid_metrics:
                    checks_match = False
                    break
                passes = changed >= 32 and fraction >= expected["minimumChangedFraction"]
                if pair.get("passed") is not passes:
                    checks_match = False
                    break
                pair_passes.append(passes)
            if not checks_match or check.get("passed") is not any(pair_passes) or check.get("passed") is not True:
                checks_match = False
                break
    if (
        report.get("version") != 1 or report.get("id") != receipt["id"]
        or report.get("mode") != "declared-regions-encoded"
        or report.get("rule") != "declared-region-pixel-change"
        or report.get("scope") != MOTION_SCOPE
        or report.get("timingSource") != "measured-final"
        or report.get("videoSha256") != movie_hash or report.get("movieSha256") != movie_hash
        or report.get("sourceFingerprint") != receipt.get("fingerprint")
        or report.get("toolSha256") != tool_hash or report.get("lessonSha256") != lesson_hash
        or report.get("timelineSha256") != timeline_hash or report.get("receiptSha256") != receipt_hash
        or report.get("width") != timeline.get("width") or report.get("height") != timeline.get("height")
        or report.get("fps") != fps or report.get("thresholds") != {"minimumChannelDelta": 12, "minimumChangedPixels": 32}
        or report.get("sampleProgress") != [.12, .5, .88]
        or type(frames) is not int or frames != receipt.get("frameAudit", {}).get("frames")
        or report.get("passed") is not True or report.get("issues") != []
        or not coverage_matches or not checks_match
    ):
        raise ValueError(f"Current encoded motion audit has not passed: {receipt['id']}")
    return path


def verify_frame_coverage(folder: Path, timeline: dict, receipt: dict, logo_hash: str) -> int:
    intro = timeline.get("intro")
    brand = receipt.get("brandIntro")
    if (not intro or not brand or intro.get("id") != "leetllm-intro"
            or intro.get("duration") != 4 or brand.get("duration") != 4
            or receipt.get("opening") == "lesson" or timeline.get("opening") == "lesson"):
        raise ValueError("The reusable four-second logo intro is missing")
    if brand.get("logoSha256") != logo_hash or brand.get("frames") != intro.get("frames"):
        raise ValueError("Logo intro provenance does not match the delivery")
    if not timeline["scenes"] or timeline["scenes"][0]["start"] != 4:
        raise ValueError("The first lesson scene must start at the end of the logo intro")
    scenes = [intro, *timeline["scenes"]]
    frames = sum(scene["frames"] for scene in scenes)
    cursor = 0
    for scene in scenes:
        if abs(scene["start"] - cursor / timeline["fps"]) > 1e-6 or abs(scene["duration"] - scene["frames"] / timeline["fps"]) > 1e-6:
            raise ValueError("Video timeline does not cover contiguous whole frames")
        cursor += scene["frames"]
    report = json.loads((folder / "frame-audit.json").read_text())
    if report.get("passed") is not True or report.get("frames") != frames or report.get("expectedFrames") != frames or report.get("issueFrames") != 0:
        raise ValueError("Complete frame layout audit has not passed")
    if receipt.get("frameAudit") != {"frames": frames, "passed": True}:
        raise ValueError("Frame audit receipt does not cover the entire movie")
    audits = report.get("scenes", [])
    if len(audits) != len(scenes) or len({audit["scene"] for audit in audits}) != len(scenes):
        raise ValueError("Frame layout audit has missing or duplicate scenes")
    by_scene = {audit["scene"]: audit for audit in audits}
    for scene in scenes:
        audit = by_scene.get(scene["id"], {})
        if audit.get("frames") != scene["frames"] or audit.get("fps") != timeline["fps"] or audit.get("passed") is not True or audit.get("issues") != []:
            raise ValueError(f"Frame layout audit is incomplete: {scene['id']}")
    return frames


def verify_encoded_review(folder: Path, timeline: dict, encoded: dict, video_hash: str, frames: int, inspector_hash: str) -> set[str]:
    if encoded.get("inspectorSha256") != inspector_hash:
        raise ValueError("Encoded review was produced by different inspection code")
    decoded = encoded.get("decodedFrameAudit", {})
    if encoded.get("videoSha256") != video_hash or decoded.get("passed") is not True or decoded.get("frames") != frames or decoded.get("expectedFrames") != frames:
        raise ValueError("Encoded review does not cover every decoded movie frame")
    metrics_name = decoded.get("metrics")
    if metrics_name != "decoded-frame-metrics.json":
        raise ValueError("Decoded frame metrics are missing")
    metrics = json.loads((folder / metrics_name).read_text())
    if len(metrics) != frames or any(len(row) != 4 or row[0] != index for index, row in enumerate(metrics)):
        raise ValueError("Decoded frame metrics skip or duplicate movie frames")
    if json.loads((folder / "decoded-frame-audit.json").read_text()) != decoded:
        raise ValueError("Decoded frame diagnostic report does not match its receipt")
    roles = {}
    required = {"contact-sheet.png", "index.html", "decoded-frame-audit.json", metrics_name}
    for sample in encoded.get("samples", []):
        frame = sample["frame"]
        if not isinstance(frame, int) or not 0 <= frame < frames or abs(sample["time"] - frame / timeline["fps"]) > 1e-6:
            raise ValueError("Encoded sample is outside the movie frame schedule")
        required.add(sample["image"])
        for target in sample["targets"]:
            if target["phase"] in {"change-peak", "long-hold"}:
                continue
            role = (target["scene"], target.get("beat"), target["phase"])
            if role in roles and roles[role] != frame:
                raise ValueError("Encoded review has contradictory sample roles")
            roles[role] = frame

    def expect(time: float, scene: str, phase: str, beat: int | None = None):
        frame = max(0, min(frames - 1, math.floor(time * timeline["fps"] + 0.5)))
        if roles.get((scene, beat, phase)) != frame:
            raise ValueError(f"Encoded review is missing {scene} beat {beat} {phase}")

    scenes = ([timeline["intro"]] if timeline["intro"] is not None else []) + timeline["scenes"]
    for scene in scenes:
        expect(scene["start"], scene["id"], "start")
        expect(scene["start"] + (scene["frames"] - 1) / timeline["fps"], scene["id"], "end")
        if scene is timeline["intro"]:
            for phase, progress in (("early", 0.12), ("middle", 0.5), ("late", 0.88)):
                expect(scene["start"] + scene["duration"] * progress, scene["id"], phase)
        else:
            for beat, timing in enumerate(scene["beats"]):
                for phase, progress in (("early", 0.12), ("middle", 0.5), ("late", 0.88)):
                    expect(scene["start"] + timing["start"] + (timing["until"] - timing["start"]) * progress, scene["id"], phase, beat)
    sheets = encoded.get("sceneSheets", [])
    if {sheet["scene"] for sheet in sheets} != {scene["id"] for scene in scenes}:
        raise ValueError("Encoded contact sheets do not cover every scene and intro")
    required.update(sheet["image"] for sheet in sheets)
    return required


def package(directory: Path, requested: list[str] | None = None, archive_name: str = "leetllm-video-lessons.zip", require_text_ink: bool = False, require_motion: bool = False, reviews: Path | None = None) -> Path:
    archive_filename(archive_name)
    source = Path(__file__).resolve().parent
    catalog = discover_catalog(source, requested)
    lessons = select_lessons(catalog, requested)
    metadata = {lesson["id"]: lesson for lesson in catalog}
    receipts = []
    assets = []
    cards = []
    adapters = set()
    intro_sources = {}
    closure_sources = {}
    for lesson_id in lessons:
        folder = directory / lesson_id
        receipt = json.loads((folder / "verification.json").read_text())
        verify_article(source.parent, metadata[lesson_id], receipt)
        video = folder / f"{lesson_id}.mp4"
        if receipt.get("videoEngine") not in {CANVAS_ENGINE, STAGE_ENGINE}:
            raise ValueError(f"Updated Vizmatic export is not ready: {lesson_id}")
        # A stage film has no painter labels. Its film check replaces the painter audits.
        is_stage = receipt["videoEngine"] == STAGE_ENGINE
        if receipt["fullDecode"] != "passed" or sha256(video) != receipt["sha256"]:
            raise ValueError(f"Verification receipt does not match {video}")
        artifact_hashes = receipt.get("artifactSha256", {})
        required = {
            "timeline.json", "frame-gallery.json", "frame-gallery.html", "contact-sheet.png",
            "frame-audit.json", "layout-review.html", "layout-review.json", "leetllm-intro.mp4",
            *(f"{lesson_id}.{suffix}" for suffix in ("mp4", "srt", "vtt", "script.md", "chapters.txt")),
        }
        if "sourceManifest" in receipt:
            required.add("source-manifest.json")
            if json.loads((folder / "source-manifest.json").read_text()) != receipt["sourceManifest"]:
                raise ValueError(f"Source manifest artifact differs from receipt: {lesson_id}")
        if not required.issubset(artifact_hashes):
            raise ValueError(f"Delivery checksums are incomplete: {lesson_id}")
        for relative, expected in artifact_hashes.items():
            asset = (folder / relative).resolve()
            if not asset.is_relative_to(folder.resolve()) or not asset.is_file() or sha256(asset) != expected:
                raise ValueError(f"Delivery checksum mismatch: {lesson_id}/{relative}")
        adapters.add(verify_render_sources(source, lesson_id, receipt))
        manifest_inputs = manifest_source_files(source.parent, receipt)
        if manifest_inputs:
            records = receipt["sourceManifest"]["closure"]["files"]
            for file, record in zip(manifest_inputs, records):
                if file in closure_sources and closure_sources[file] != record["sha256"]:
                    raise ValueError(f"Selected source manifests disagree: {file}")
                closure_sources[file] = record["sha256"]
        timeline = json.loads((folder / "timeline.json").read_text())
        frames = verify_frame_coverage(folder, timeline, receipt, sha256(source / "assets/leetllm-mark.svg"))
        assets.append(verify_film_check(folder, receipt) if is_stage else verify_aggregate_occlusion(folder, receipt, frames, source))
        ink_report = verify_text_ink(folder, receipt, timeline, frames, source, require_text_ink and not is_stage)
        if ink_report:
            assets.append(ink_report)
        if require_motion and not is_stage:
            run_motion_audit(source, directory, lesson_id)
        motion_report = verify_motion_audit(folder, receipt, timeline, frames, source, require_motion and not is_stage)
        if motion_report:
            assets.append(motion_report)
        intro_sources[artifact_hashes["leetllm-intro.mp4"]] = folder / "leetllm-intro.mp4"
        profile = receipt.get("videoProfile", {})
        if (
            profile.get("burnedCaptions") is not False
            or profile.get("progressIndicator") is not False
        ):
            raise ValueError(f"Clean video profile is not verified: {lesson_id}")
        gallery = json.loads((folder / "frame-gallery.json").read_text())
        if not gallery.get("samples") or any(
            sample.get("issues") for sample in gallery["samples"]
        ):
            raise ValueError(f"Frame review has unresolved issues: {lesson_id}")
        encoded = json.loads((folder / "encoded-review/verification.json").read_text())
        encoded_hashes = encoded.get("artifactSha256", {})
        encoded_required = verify_encoded_review(folder / "encoded-review", timeline, encoded, receipt["sha256"], frames, sha256(source / "inspect.mjs"))
        if not encoded_required.issubset(encoded_hashes):
            raise ValueError(f"Encoded frame checksums are incomplete: {lesson_id}")
        for relative, expected in encoded_hashes.items():
            asset = (folder / "encoded-review" / relative).resolve()
            if not asset.is_relative_to((folder / "encoded-review").resolve()) or not asset.is_file() or sha256(asset) != expected:
                raise ValueError(f"Encoded frame checksum mismatch: {lesson_id}/{relative}")
        poster = folder / f"01-{timeline['scenes'][0]['id']}.png"
        if not poster.is_file():
            raise FileNotFoundError(poster)
        required.update(sample["image"] for sample in gallery["samples"])
        required.update(f"previews/scenes/{scene['id']}.png" for scene in timeline["scenes"])
        required.add(poster.name)
        if not required.issubset(artifact_hashes):
            raise ValueError(f"Frame review checksums are incomplete: {lesson_id}")
        assets.extend(folder / relative for relative in artifact_hashes)
        for suffix in ("mp4", "srt", "vtt", "chapters.txt", "script.md"):
            asset = folder / f"{lesson_id}.{suffix}"
            if not asset.is_file():
                raise FileNotFoundError(asset)
            assets.append(asset)
        assets.extend(
            (
                poster,
                folder / "verification.json",
                folder / "timeline.json",
                folder / "contact-sheet.png",
            )
        )
        assets.extend(folder / "encoded-review" / relative for relative in encoded_hashes)
        assets.extend((folder / "frame-gallery.html", folder / "frame-gallery.json"))
        assets.extend(folder / sample["image"] for sample in gallery["samples"])
        assets.extend(
            folder / "previews/scenes" / f"{scene['id']}.png"
            for scene in timeline["scenes"]
        )
        assets.extend(
            folder / "encoded-review" / sample["image"] for sample in encoded["samples"]
        )
        assets.extend(
            (
                folder / "encoded-review/contact-sheet.png",
                folder / "encoded-review/verification.json",
            )
        )
        receipts.append(receipt)
        title = html.escape(receipt["title"])
        stem = html.escape(lesson_id, quote=True)
        duration = int(receipt["duration"])
        storyboard = "overview.png" if "overview.png" in artifact_hashes else "contact-sheet.png"
        fps_numerator, _, fps_denominator = str(receipt["fps"]).partition("/")
        fps = float(fps_numerator) / float(fps_denominator or 1)
        cards.append(
            f"<article><h2>{title}</h2><p>{duration // 60}:{duration % 60:02d} · "
            f"{receipt['width']} × {receipt['height']} · {fps:g} fps</p>"
            f'<video controls preload="none" poster="{stem}/{poster.name}">'
            f'<source src="{stem}/{stem}.mp4?v={receipt["sha256"][:12]}" type="video/mp4">'
            f'<track kind="captions" src="{stem}/{stem}.vtt?v={artifact_hashes[f"{lesson_id}.vtt"][:12]}" srclang="en" label="English">'
            "</video><nav>"
            f'<a href="{stem}/{stem}.mp4" download>MP4</a>'
            f'<a href="{stem}/{stem}.srt" download>Captions</a>'
            f'<a href="{stem}/{stem}.script.md">Script</a>'
            f'<a href="{stem}/{stem}.chapters.txt">Chapters</a>'
            f'<a href="{stem}/{storyboard}">Storyboard</a>'
            f'<a href="{stem}/frame-gallery.html">Frame review</a>'
            f'<a href="{stem}/encoded-review/index.html">Encoded frames</a>'
            f'<a href="{stem}/layout-review.html">Layout audit</a>'
            + (f'<a href="{stem}/film-check.json">Film check</a>' if is_stage else f'<a href="{stem}/aggregate-occlusion.json">Text occlusion audit</a>')
            + (f'<a href="{stem}/text-ink-audit.json">Text visibility audit</a>' if ink_report else "")
            + (f'<a href="{stem}/motion-audit.json">Encoded motion audit</a>' if motion_report else "")
            + "</nav></article>"
        )

    if any("captionRevision" in receipt for receipt in receipts):
        subprocess.run(
            ["node", str(source / "regenerate-captions.mjs"), "--input", str(directory),
             "--lessons", *lessons, "--check"], check=True,
        )
    quality = None
    if reviews is not None:
        quality = runpy.run_path(str(source / "quality.py"))
        quality["prepare_quality"](directory, reviews, source / "quality-rubric.json", receipts)
    if len(intro_sources) != 1:
        raise ValueError("The deliveries do not share the same reusable logo intro")
    concepts = source / "assets/concepts"
    for asset in sorted(concepts.rglob("*")):
        if asset.is_file():
            target = directory / "concepts" / asset.relative_to(concepts)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(asset, target)
            assets.append(target)
    digest, branded_intro = next(iter(intro_sources.items()))
    shared_intro = directory / "leetllm-intro.mp4"
    temporary_intro = directory / ".leetllm-intro.partial.mp4"
    shutil.copyfile(branded_intro, temporary_intro)
    if sha256(temporary_intro) != digest:
        temporary_intro.unlink()
        raise ValueError("Reusable logo intro changed during packaging")
    temporary_intro.replace(shared_intro)
    assets.append(shared_intro)
    manifest = directory / "manifest.json"
    index = directory / "index.html"
    gallery_html = (
        '<!doctype html><html lang="en"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>LeetLLM video lessons</title><link rel="icon" href="data:,"/><style>'
        "body{margin:0;background:#0a1020;color:#e9efff;font:17px system-ui;line-height:1.5}"
        "main{max-width:1400px;margin:auto;padding:40px 24px}h1{font-size:40px;margin-bottom:8px}"
        "h2{font-size:23px;margin:0}p{color:#a3b2cc}section{display:grid;"
        "grid-template-columns:repeat(auto-fit,minmax(min(100%,500px),1fr));gap:28px}"
        "article{background:#111d34;padding:22px;border-radius:14px}video{width:100%;"
        "background:#080e1b;border-radius:8px}nav{display:flex;flex-wrap:wrap;gap:18px;"
        "margin-top:14px}a{color:#63deec}a:hover{color:#e9efff}"
        "input{display:block;box-sizing:border-box;width:100%;max-width:600px;"
        "margin:8px 0;padding:12px;border:1px solid #637797;border-radius:8px;"
        "background:#111d34;color:#e9efff;font:inherit}</style><main>"
        f"<h1>LeetLLM video lessons</h1><p>{len(lessons)} animated explanations from first principles. "
        "Clean picture, narration, optional captions, and chapter markers.</p>"
        '<p><a href="concepts/gallery.html">Explore the concept icon gallery</a></p>'
        '<label for="lesson-search">Find a lesson</label>'
        '<input id="lesson-search" type="search" placeholder="Search lesson titles" '
        'aria-controls="lessons" autocomplete="off">'
        f'<p id="lesson-count" role="status">{len(lessons)} lessons</p>'
        '<section id="lessons">'
        + "".join(cards)
        + '</section></main><script>'
        'const search=document.getElementById("lesson-search");'
        'const cards=Array.from(document.querySelectorAll("#lessons article"));'
        'search.addEventListener("input",()=>{'
        'const query=search.value.trim().toLocaleLowerCase();let visible=0;'
        'for(const card of cards){'
        'card.hidden=!card.querySelector("h2").textContent.toLocaleLowerCase().includes(query);'
        'if(card.hidden)card.querySelector("video").pause();else visible++;}'
        'document.getElementById("lesson-count").textContent='
        '`${visible} of ${cards.length} lessons`;});'
        '</script></html>\n'
    )
    if quality is not None:
        assets.extend(quality["publish_quality"](directory, reviews, source / "quality-rubric.json", receipts, gallery_html=gallery_html))
    else:
        index.write_text(gallery_html)
    manifest.write_text(json.dumps(receipts, indent=2) + "\n")
    assets.extend((manifest, index))
    archive = directory / archive_name
    temporary = archive.with_suffix(".partial.zip")
    with zipfile.ZipFile(temporary, "w", allowZip64=True) as bundle:
        for asset in dict.fromkeys(assets):
            compression = (
                zipfile.ZIP_STORED if asset.suffix in {".mp4", ".png"} else zipfile.ZIP_DEFLATED
            )
            bundle.write(asset, asset.relative_to(directory), compress_type=compression)
        repository = source.parent
        write_manifest_sources(bundle, repository, closure_sources)
        included = set(bundle.namelist())
        for path in editable_source_files(source, adapters):
            if path.relative_to(repository).as_posix() in included:
                continue
            bundle.write(
                path,
                Path("videos") / path.relative_to(source),
                compress_type=zipfile.ZIP_DEFLATED,
            )
        included = set(bundle.namelist())
        for relative in ("CONTENT_GUIDELINES.md", "web/src/content/references.json"):
            if relative not in included:
                bundle.write(repository / relative, relative, compress_type=zipfile.ZIP_DEFLATED)
                included.add(relative)
        selected_sources = {receipt["source"]: receipt["sourceSha256"] for receipt in receipts}
        for article_source in dict.fromkeys(lesson["source"] for lesson in catalog):
            relative = Path("web/src/content") / article_source
            article = repository / relative
            if article_source in selected_sources and sha256(article) != selected_sources[article_source]:
                raise ValueError(f"Source article changed after rendering: {article}")
            if relative.as_posix() not in included:
                bundle.write(article, relative, compress_type=zipfile.ZIP_DEFLATED)
                included.add(relative.as_posix())
    with zipfile.ZipFile(temporary) as bundle:
        failure = bundle.testzip()
        if failure:
            raise ValueError(f"Archive integrity check failed: {failure}")
    temporary.replace(archive)
    for receipt in receipts:
        print(
            f"{receipt['id']}: {receipt['duration']:.2f}s, {receipt['bytes']:,} bytes, verified"
        )
    print(f"Ready: {archive}")
    return archive


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "build/videos",
    )
    parser.add_argument("--lessons", nargs="+", help="Lesson IDs to include; defaults to the complete source catalog")
    parser.add_argument("--require-text-ink", action="store_true", help="Require final-bound text visibility audits for every selected lesson")
    parser.add_argument("--require-motion", action="store_true", help="Re-audit declared motion regions in each encoded lesson and require current evidence")
    parser.add_argument("--reviews", type=Path, help="Add a complete editorial review, bound to the selected movie and source hashes")
    parser.add_argument("--archive", default="leetllm-video-lessons.zip", help="Archive filename inside the output directory")
    args = parser.parse_args()
    archive_filename(args.archive)
    source = Path(__file__).resolve().parent
    catalog = discover_catalog(source, args.lessons)
    lessons = select_lessons(catalog, args.lessons)
    subprocess.run(
        ["node", str(source / "regenerate-captions.mjs"), "--input", str(args.input.resolve()),
         "--lessons", *lessons, "--refresh-audits"], check=True,
    )
    package(args.input.resolve(), lessons, args.archive, require_text_ink=args.require_text_ink, require_motion=args.require_motion, reviews=args.reviews)


if __name__ == "__main__":
    main()
