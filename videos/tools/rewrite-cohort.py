#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///
"""Freeze reviewed films and deliver source-built MP4s in course order."""
import argparse
import concurrent.futures
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
ROSTER = ROOT / "videos/editorial-cuts/rewrite-cohort.json"
PACKAGER = ROOT / "videos/tools/captioned-master.py"
NARRATOR_FIELDS = ("provider", "model", "voice", "rate", "engineVersion", "langCode", "sampleRate", "speed")
SETTINGS = ["--width", "1920", "--fps", "30", "--quality", "standard", "--threads", "2", "--no-manifest"]


def read(path):
    return json.loads(path.read_text())


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def roster():
    spec = read(ROSTER)
    rows = spec["lessons"]
    ids = [lesson for lesson, _ in rows]
    published = read(ROOT / "videos/collections/complete-curriculum.json")["lessons"]
    if (spec["version"] != 1 or len(set(ids)) != len(ids)
            or set(ids) != {item["id"] for item in published}):
        raise ValueError("Rewrite roster differs from the course curriculum")
    for lesson, mode in rows:
        if not re.fullmatch(r"[a-z][a-z0-9-]*", lesson) or mode not in {"canvas", "stage"}:
            raise ValueError(f"Invalid rewrite route: {lesson}, {mode}")
    return rows


def renderer_independent_inputs(manifest):
    closure = manifest["closure"]
    files = [{k: v for k, v in item.items() if k not in {"bytes", "sha256"}}
             if item["path"] == "videos/render.mjs" else item for item in closure["files"]]
    return {**manifest, "fingerprint": None,
            "closure": {**closure, "files": files, "fingerprint": None}}


def inspect_source(row, roots, reviews, *, editor_submission=False, submitted_root=None):
    lesson, mode = row
    root = roots[mode]
    command = ["node", "videos/tools/lesson-source.mjs", "--lesson", lesson]
    if mode == "stage":
        command.append("--stage")
    manifest = json.loads(subprocess.check_output(command, cwd=root))
    files = {item["path"]: item["sha256"] for item in manifest["closure"]["files"]}
    if reviews is not None:
        review = reviews[lesson]
        reviewed = review["files"]
        editor = review.get("editorThread")
        if not isinstance(editor, str) or not editor.strip():
            raise ValueError(f"{lesson}: missing source editor")
        if not editor_submission and (not review.get("reviewerThread") or editor == review["reviewerThread"]):
            raise ValueError(f"{lesson}: missing independent review")
        pict = (f"videos/films/{lesson}/" if mode == "canvas" else f"videos/stage-lessons/{lesson}/")
        owned = {name: value for name, value in files.items()
                 if name in {manifest["lessonFile"], manifest["moduleFile"]} or name.startswith(pict)}
        if editor_submission:
            prefixes = (f"videos/films/{lesson}/", f"videos/stage-lessons/{lesson}/")
            complete = {**owned, **{name: value for name, value in files.items() if name.startswith(prefixes)}}
            # An older receipt can omit cross-route files when the full submitted closure is verifiable.
            if reviewed != owned or not (submitted_root or review.get("sourceFingerprint") == manifest["fingerprint"]):
                owned = complete
        if (manifest["lessonFile"] not in owned or manifest["moduleFile"] not in owned
                or reviewed != owned):
            raise ValueError(f"{lesson}: stale review or incomplete production picture and narration")
        original = manifest
        if editor_submission:
            if files.get("videos/render.mjs") != digest(ROOT / "videos/render.mjs"):
                raise ValueError(f"{lesson}: rendering checkout must use this editor-submission renderer")
            if submitted_root:
                original = json.loads(subprocess.check_output(command, cwd=submitted_root))
                if renderer_independent_inputs(original) != renderer_independent_inputs(manifest):
                    raise ValueError(f"{lesson}: production inputs differ beyond the delivery renderer")
        if review.get("sourceFingerprint") != original["fingerprint"]:
            if not editor_submission or submitted_root:
                raise ValueError(f"{lesson}: reviewed dependencies or runtime changed")
            if not review.get("submissionFile"):
                raise ValueError(f"{lesson}: original editor receipt required for a runtime change")
            receipt_bytes = Path(review["submissionFile"]).read_bytes()
            if hashlib.sha256(receipt_bytes).hexdigest() != review.get("submissionSha256"):
                raise ValueError(f"{lesson}: editor receipt has changed")
            receipt = json.loads(receipt_bytes)
            if (not re.fullmatch(r"[0-9a-f]{64}", str(review.get("sourceFingerprint")))
                    or receipt.get("sourceFingerprint") != review["sourceFingerprint"]
                    or receipt.get("editorThread") != editor or receipt.get("files") != owned
                    or receipt.get("lesson") != manifest["lessonFile"]
                    or receipt.get("module") != manifest["moduleFile"]):
                raise ValueError(f"{lesson}: receipt does not identify this editor and authored source")
    profile = read(root / "videos/narration.json")
    narrator = {key: profile[key] for key in NARRATOR_FIELDS}
    adapter = profile["ttsScript"]
    return {"id": lesson, "mode": mode, "fingerprint": manifest["fingerprint"],
            "narrator": narrator, "ttsAdapter": {"path": adapter, "sha256": files[adapter]}}


def render_settings(h264_encoder):
    return [*SETTINGS, "--h264-encoder", h264_encoder] if h264_encoder else SETTINGS


def freeze(rows, roots, ledger, *, h264_encoder=None):
    entries = read(ledger)["lessons"]
    reviews = {entry["id"]: entry for entry in entries}
    if len(entries) != len(rows) or set(reviews) != {row[0] for row in rows}:
        raise ValueError("Every film in the rewrite roster needs an independent source review")
    with concurrent.futures.ThreadPoolExecutor(4) as pool:
        films = list(pool.map(lambda row: inspect_source(row, roots, reviews), rows))
    if h264_encoder:
        films = [{**film, "requestedH264Encoder": h264_encoder} for film in films]
    return {"version": 1, "settings": render_settings(h264_encoder), "packagerSha256": digest(PACKAGER), "reviewsSha256": digest(ledger), "lessons": films}


def json_digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def lesson_review(ledger, lesson):
    matches = [entry for entry in read(ledger)["lessons"] if entry["id"] == lesson]
    if len(matches) != 1:
        raise ValueError(f"{lesson}: one current entry is required in the supplied ledger")
    return matches[0]


def freeze_lesson(row, number, roots, ledger, *, editor_submission=False, submitted_root=None, h264_encoder=None):
    lesson = row[0]
    review = lesson_review(ledger, lesson)
    film = inspect_source(row, roots, {lesson: review}, editor_submission=editor_submission, submitted_root=submitted_root)
    key = "submissionSha256" if editor_submission else "reviewSha256"
    if editor_submission:
        film = {**film, "editorSubmission": True, "editorFingerprint": review["sourceFingerprint"]}
    if h264_encoder:
        film = {**film, "requestedH264Encoder": h264_encoder}
    frozen = {"version": 1, "number": number, "settings": render_settings(h264_encoder), "lessons": [film],
              "packagerSha256": digest(PACKAGER), key: json_digest(review)}
    return {**frozen, "generation": json_digest(frozen)}


def write_freeze(path, frozen):
    with tempfile.TemporaryDirectory(dir=path.parent) as temporary:
        source = Path(temporary) / "freeze.json"
        source.write_text(json.dumps(frozen, indent=2) + "\n")
        try:
            os.link(source, path)
        except FileExistsError:
            if read(path) != frozen:
                raise ValueError(f"A different freeze already exists at {path}")


def checked_master(film, directory, *, packaged=False):
    lesson = film["id"]
    movie = directory / f"{lesson}.mp4"
    receipt = read(directory / "verification.json")
    preference = film.get("requestedH264Encoder")
    if preference and (receipt.get("requestedH264Encoder") != preference
                       or receipt.get("h264Encoder") not in {"libx264", preference}):
        raise ValueError(f"{lesson}: movie has a different H.264 encoder selection")
    if (receipt["id"] != lesson or receipt["sourceManifest"]["fingerprint"] != film["fingerprint"]
            or receipt["fullDecode"] != "passed" or not receipt["frameAudit"]["passed"]
            or receipt["audioCodec"] != "aac"
            or (receipt["width"], receipt["height"]) != (1920, 1080)
            or receipt.get("ttsAdapter") != film["ttsAdapter"]
            or any(receipt.get(key) != value for key, value in film["narrator"].items())):
        raise ValueError(f"{lesson}: the rendered movie does not match its reviewed source and format")
    vtt = directory / f"{lesson}.vtt"
    if digest(vtt) != receipt["artifactSha256"][vtt.name]:
        raise ValueError(f"{lesson}: captions differ from the rendered timeline")
    expected = receipt["sha256"]
    if packaged:
        proof = read(directory / "review-copy.json")
        if (proof["sourceSha256"] != expected or proof["vttSha256"] != digest(vtt)
                or proof["fingerprint"] != film["fingerprint"]):
            raise ValueError(f"{lesson}: captioned master belongs to a different source")
        expected = proof["sha256"]
    if digest(movie) != expected:
        raise ValueError(f"{lesson}: unexpected movie SHA-256")
    clock = subprocess.run(["node", ROOT / "videos/lib/frame-clock.mjs", movie, "30"],
                           capture_output=True, text=True)
    if clock.returncode:
        raise ValueError(f"{lesson}: picture clock failed verification: {clock.stderr.strip()}")
    return movie


def render_one(film, roots, workspace, *, speech_cache=None):
    lesson, mode = film["id"], film["mode"]
    directory = workspace / "masters" / lesson
    if directory.exists():
        try:
            return checked_master(film, directory, packaged=True)
        except (FileNotFoundError, KeyError, TypeError, ValueError):
            movie = directory / f"{lesson}.mp4"
            if movie.exists() and movie.stat().st_nlink > 1:
                raise ValueError(f"{lesson}: a linked master failed verification and requires recovery")
            quarantine = Path(tempfile.mkdtemp(prefix="rejected-master-", dir=workspace))
            directory.rename(quarantine / lesson)
    jobs = workspace / "jobs"
    jobs.mkdir(exist_ok=True)
    # An encoder can outlive its driver. Each attempt must own its output path.
    with tempfile.TemporaryDirectory(prefix=f"{lesson}-", dir=jobs) as attempt:
        out = Path(attempt)
        command = ["node", "videos/render.mjs", "--lesson", lesson, "--output", str(out),
                   *render_settings(film.get("requestedH264Encoder"))]
        if mode == "stage":
            command.extend(["--stage", "--workers", "2"])
        if film.get("editorSubmission"):
            command.append("--editor-submission")
        env = {
            **os.environ,
            "LEETLLM_KOKORO_WARM": "1",
            "LEETLLM_KOKORO_SLOTS": "4",
            "LEETLLM_KOKORO_PRIORITY": "normal",
        }
        checkpoints = workspace / "scene-checkpoints" / lesson
        env["LEETLLM_SCENE_CHECKPOINTS"] = str(checkpoints)
        env.setdefault("LEETLLM_SPEECH_CACHE", str(speech_cache or workspace / "speech-cache"))
        with (workspace / f"{lesson}.log").open("ab") as log:
            subprocess.run(command, cwd=roots[mode], env=env, stdout=log, stderr=subprocess.STDOUT, check=True)
        built = out / lesson
        master = checked_master(film, built)
        directory.parent.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=workspace) as stage:
            package = Path(stage) / lesson
            package.mkdir()
            vtt = built / f"{lesson}.vtt"
            captioned = package / master.name
            subprocess.run([sys.executable, PACKAGER, master, vtt, captioned], check=True,
                           stdout=subprocess.DEVNULL)
            proof = {"sourceSha256": digest(master), "vttSha256": digest(vtt),
                     "fingerprint": film["fingerprint"], "sha256": digest(captioned)}
            (package / "review-copy.json").write_text(json.dumps(proof, indent=2) + "\n")
            for name in (vtt.name, "verification.json", "source-manifest.json", "timeline.json"):
                os.link(built / name, package / name)
            checked_master(film, package, packaged=True)
            package.rename(directory)
        shutil.rmtree(checkpoints, ignore_errors=True)
    return directory / f"{lesson}.mp4"


def deliver(frozen, roots, flat):
    flat.mkdir(parents=True, exist_ok=True)
    workspace = flat.parent / f".{flat.name}-rewrite"
    workspace.mkdir(exist_ok=True)
    with (workspace / "lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        marker = workspace / "cohort.json"
        if marker.exists():
            if read(marker) != frozen:
                raise ValueError("This output belongs to a different review. Choose a new flat directory.")
        else:
            if any(flat.iterdir()):
                raise ValueError("Choose an empty flat directory for this reviewed edition")
            with tempfile.NamedTemporaryFile("w", dir=workspace, delete=False) as fp:
                json.dump(frozen, fp)
            os.replace(fp.name, marker)
        with concurrent.futures.ThreadPoolExecutor(4) as pool:
            jobs = [pool.submit(render_one, film, roots, workspace) for film in frozen["lessons"]]
            try:
                for number, (film, job) in enumerate(zip(frozen["lessons"], jobs, strict=True), 1):
                    master = job.result()
                    target = flat / f"{number:03d}-{film['id']}.mp4"
                    try:
                        os.link(master, target)
                    except FileExistsError:
                        if not target.samefile(master):
                            raise ValueError(f"Existing file does not belong to this cohort: {target}")
                    print(target, flush=True)
            finally:
                for job in jobs:
                    job.cancel()


def deliver_lesson(frozen, roots, flat, ledger):
    film, = frozen["lessons"]
    lesson = film["id"]
    stem = f"{frozen['number']:03d}-{lesson}"
    flat.mkdir(parents=True, exist_ok=True)
    target = flat / f"{stem}.mp4"
    workspace = flat.parent / f".{flat.name}-rewrite"
    editions = workspace / "editions" / stem
    editions.mkdir(parents=True, exist_ok=True)
    with (workspace / "lock").open("a") as cohort_lock, (editions / "lock").open("a") as lesson_lock:
        fcntl.flock(cohort_lock, fcntl.LOCK_SH)
        fcntl.flock(lesson_lock, fcntl.LOCK_EX)
        edition = editions / frozen["generation"]
        edition.mkdir(exist_ok=True)
        master = render_one(film, roots, edition, speech_cache=workspace / "speech-cache")
        proof = read(master.parent / "review-copy.json")
        existing = None
        already_published = False
        if target.is_symlink():
            raise ValueError(f"Refusing to replace an unrelated file: {target}")
        if target.exists():
            already_published = target.samefile(master)
        if not already_published and target.exists():
            for previous in editions.glob(f"*/masters/{lesson}/{lesson}.mp4"):
                if target.samefile(previous):
                    existing = previous
                    break
            if existing is None or digest(target) != read(existing.parent / "review-copy.json")["sha256"]:
                raise ValueError(f"Refusing to replace an unrelated or modified file: {target}")
        binding = "submissionSha256" if film.get("editorSubmission") else "reviewSha256"
        if json_digest(lesson_review(ledger, lesson)) != frozen[binding]:
            raise ValueError(f"{lesson}: review changed before publication")
        with tempfile.TemporaryDirectory(dir=editions) as temp:
            if existing is not None:
                replacement = Path(temp) / target.name
                os.link(master, replacement)
                os.replace(replacement, target)
            elif not already_published:
                os.link(master, target)
            record = {"id": lesson, "number": frozen["number"], "generation": frozen["generation"],
                      "fingerprint": film["fingerprint"], "sha256": proof["sha256"]}
            pointer = Path(temp) / "published.json"
            pointer.write_text(json.dumps(record, indent=2) + "\n")
            os.replace(pointer, editions / "published.json")
        print(target, flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["check", "freeze", "render"])
    parser.add_argument("--lesson", help="Select one reviewed lesson by its course ID")
    parser.add_argument("--h264-encoder", choices=["libx264", "videotoolbox"],
                        help="Choose the preferred encoder for each complete film")
    parser.add_argument("--stage-root", type=Path, default=ROOT)
    parser.add_argument("--canvas-root", type=Path, default=ROOT)
    admission = parser.add_mutually_exclusive_group()
    admission.add_argument("--reviews", type=Path)
    admission.add_argument("--submissions", type=Path, help="Use the named editor's source submission for one film")
    parser.add_argument("--submitted-root", type=Path, help="Verify an editor submission made with the prior renderer")
    parser.add_argument("--freeze", type=Path)
    parser.add_argument("--flat", type=Path)
    args = parser.parse_args()
    roots = {"stage": args.stage_root.resolve(), "canvas": args.canvas_root.resolve()}
    rows = roster()
    if args.submitted_root and not args.submissions:
        parser.error("--submitted-root requires --submissions")
    if args.submissions and not args.lesson:
        parser.error("--submissions requires --lesson ID")
    if args.lesson is not None:
        selection = [(number, row) for number, row in enumerate(rows, 1) if row[0] == args.lesson]
        if not selection:
            parser.error(f"Unknown lesson {args.lesson}")
        number, row = selection[0]
        rows = [row]
    if args.action == "check":
        with concurrent.futures.ThreadPoolExecutor(4) as pool:
            for result in pool.map(lambda row: inspect_source(row, roots, None), rows):
                print(result["id"], result["mode"], result["fingerprint"], flush=True)
        return
    ledger = args.submissions or args.reviews
    if not ledger or not args.freeze or (args.action == "render" and not args.flat):
        parser.error("supply --reviews or --submissions, and --freeze; render also requires --flat")
    if args.lesson:
        frozen = freeze_lesson(row, number, roots, ledger, editor_submission=bool(args.submissions),
                               submitted_root=args.submitted_root, h264_encoder=args.h264_encoder)
        if args.action == "freeze":
            write_freeze(args.freeze, frozen)
        elif frozen == read(args.freeze):
            deliver_lesson(frozen, roots, args.flat.resolve(), ledger)
        else:
            raise ValueError("Reviewed film or runtime changed after the freeze")
        return
    frozen = freeze(rows, roots, args.reviews, h264_encoder=args.h264_encoder)
    if args.action == "freeze":
        with args.freeze.open("x") as fp:
            json.dump(frozen, fp, indent=2)
            fp.write("\n")
    elif frozen == read(args.freeze):
        deliver(frozen, roots, args.flat.resolve())
    else:
        raise ValueError("Reviewed source or runtime changed after the freeze")


if __name__ == "__main__":
    main()
