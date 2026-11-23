"""Build compact delivery evidence for a verified stock intro and an unchanged lesson body."""

import copy
import hashlib
import json
import re
import shutil
import subprocess
from datetime import UTC, datetime
from fractions import Fraction
from pathlib import Path


def sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def read(path):
    return json.loads(path.read_bytes())


def write(path, data):
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    )


def require(condition, message):
    if not condition:
        raise ValueError(message)


def shifted_timeline(old, intro):
    if (
        old.get("opening") != "lesson"
        or old["intro"] is not None
        or old["scenes"][0]["start"] != 0
    ):
        raise ValueError("The source timeline must begin with the lesson at zero")
    timeline = copy.deepcopy(old)
    timeline.pop("opening")
    timeline["intro"] = {
        "id": "leetllm-intro",
        "start": 0,
        "fps": old["fps"],
        "duration": intro["duration"],
        "frames": intro["frames"],
    }
    timeline["duration"] += intro["duration"]
    for scene in timeline["scenes"]:
        scene["start"] += intro["duration"]
    for caption in timeline["captions"]:
        caption["start"] += intro["duration"]
        caption["end"] += intro["duration"]
    return timeline


def write_evidence(source, donor, output, packet_proof, *, final_directory=None):
    """Finalize a private staging directory after its mux and stream-identity checks passed."""
    source, output = Path(source).resolve(), Path(output).resolve()
    if source == output:
        raise ValueError("Use a new output directory for the correction")
    old = read(source / "verification.json")
    lesson = old["id"]
    require(re.fullmatch(r"[a-z0-9][a-z0-9-]*", lesson), "Invalid lesson id")
    movie = output / (lesson + ".mp4")
    vtt = output / (lesson + ".vtt")
    fingerprint = old["fingerprint"]
    review = read(source / "review-copy.json")
    artifacts = old["artifactSha256"]
    body = source / movie.name
    body_sha = sha(body)
    movie_sha = sha(movie)
    require(
        old.get("opening") == "lesson"
        and old["brandIntro"] is None
        and old["fullDecode"] == "passed"
        and old["frameAudit"]["passed"] is True,
        "The source is not a verified lesson-first master",
    )
    require(
        body_sha == review["sha256"] == packet_proof["sourceMovieSha256"]
        and review["sourceSha256"] == old["sha256"] == artifacts[movie.name]
        and fingerprint == review["fingerprint"] == old["sourceManifest"]["fingerprint"]
        and sha(source / vtt.name) == review["vttSha256"] == artifacts[vtt.name],
        "The source review copy does not match its renderer receipt",
    )
    manifest = source / "source-manifest.json"
    require(
        sha(manifest) == artifacts[manifest.name]
        and read(manifest) == old["sourceManifest"]
        and sha(source / "timeline.json") == artifacts["timeline.json"],
        "The frozen body source or timeline differs from the renderer evidence",
    )
    require(
        movie_sha == packet_proof["outputMovieSha256"]
        and donor["hashes"]["picture"] == packet_proof["donorMovieSha256"]
        and re.fullmatch(r"[0-9a-f]{64}", packet_proof["decodedBodyAudioSha256"]),
        "The packet or PCM evidence does not identify these media files",
    )
    intro = donor["brandIntro"]
    original_timeline = read(source / "timeline.json")
    fps = original_timeline["fps"]
    require(
        intro["duration"] == 4
        and intro["frames"] == 4 * fps
        and donor["audit"]["frames"]
        == packet_proof["introVideoPackets"]
        == intro["frames"]
        and donor["audit"]["passed"] is True
        and old["frameAudit"]["frames"] == packet_proof["bodyVideoPackets"],
        "The retained frame audits do not cover the assembled packet sequence",
    )
    timeline = shifted_timeline(original_timeline, intro)
    media = json.loads(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_format",
                "-show_streams",
                "-of",
                "json",
                movie,
            ]
        )
    )
    videos = [s for s in media["streams"] if s["codec_type"] == "video"]
    audios = [s for s in media["streams"] if s["codec_type"] == "audio"]
    require(
        len(videos) == len(audios) == 1, "Expected one picture and one audio stream"
    )
    video, audio = videos[0], audios[0]
    require(
        (video["width"], video["height"], video["codec_name"], audio["codec_name"])
        == (old["width"], old["height"], "h264", "aac")
        and Fraction(video["r_frame_rate"]) == fps
        and abs(float(audio["duration"]) - timeline["duration"]) < 0.05
        and abs(float(video["duration"]) - timeline["duration"]) < 0.05,
        "Output format or duration differs from the authored timeline",
    )
    subprocess.run(
        [
            "ffmpeg",
            "-nostdin",
            "-v",
            "error",
            "-xerror",
            "-i",
            movie,
            "-map",
            "0:v:0",
            "-map",
            "0:a:0",
            "-f",
            "null",
            "-",
        ],
        check=True,
    )
    audio_hash = subprocess.check_output(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            movie,
            "-map",
            "0:a:0",
            "-c",
            "copy",
            "-f",
            "hash",
            "-hash",
            "sha256",
            "-",
        ],
        text=True,
    ).strip()
    require(
        re.fullmatch(r"SHA256=[0-9a-f]{64}", audio_hash), "Could not hash encoded score"
    )
    shutil.copyfile(manifest, output / manifest.name)
    write(output / "timeline.json", timeline)
    lineage_file = output / "branded-remux.json"
    generation = hashlib.sha256(
        f"branded-packet-remux-v1/{body_sha}/{packet_proof['donorMovieSha256']}/{movie_sha}".encode()
    ).hexdigest()
    lineage = {
        "version": 1,
        "kind": "branded-packet-remux",
        "id": lesson,
        "assemblyFingerprint": generation,
        "body": {
            "directory": str(source),
            "movieSha256": body_sha,
            "productionFingerprint": fingerprint,
            "reviewCopySha256": sha(source / "review-copy.json"),
            "verificationSha256": sha(source / "verification.json"),
            "sourceManifestSha256": sha(manifest),
            "originalTimelineSha256": artifacts["timeline.json"],
            "originalGallerySha256": artifacts.get("frame-gallery.json"),
        },
        "donor": donor,
        "streams": packet_proof,
        "bodyStartsAtSeconds": intro["duration"],
    }
    write(lineage_file, lineage)
    receipt = copy.deepcopy(old)
    receipt.pop("opening")
    # Stem hashes and calibration belong to the frozen body. Only the elementary AAC digest
    # describes the entire new mix. The original renderer receipt retains all stem evidence.
    bed = receipt["audioBed"]
    for name in ("voiceSha256", "bedSha256", "mixSha256", "timingSha256"):
        bed.pop(name, None)
    require(
        bed["introSeconds"] == bed["levels"]["skipSeconds"] == 0,
        "The body score was not calibrated from the beginning of the lesson",
    )
    bed.update(
        introSeconds=intro["duration"],
        encodedAudioSha256=audio_hash.split("=")[1],
        measurementSource="retained-body-after-brand",
        bodyVerificationSha256=lineage["body"]["verificationSha256"],
    )
    bed["levels"]["skipSeconds"] += intro["duration"]
    bed["levels"]["durationSeconds"] += intro["duration"]
    receipt.update(
        sha256=movie_sha,
        assemblyFingerprint=generation,
        bytes=movie.stat().st_size,
        duration=float(media["format"]["duration"]),
        file=str((Path(final_directory or output).resolve()) / movie.name),
        fps=video["r_frame_rate"],
        averageFps=video["avg_frame_rate"],
        brandIntro=intro,
        frameAudit={
            "passed": True,
            "frames": old["frameAudit"]["frames"] + intro["frames"],
            "method": "retained-body-and-brand-frame-audits",
        },
        generatedAt=datetime.now(UTC).isoformat(),
        artifactSha256={
            p.name: sha(p)
            for p in (
                movie,
                vtt,
                output / "timeline.json",
                output / manifest.name,
                lineage_file,
            )
        },
    )
    write(output / "verification.json", receipt)
    validator = Path(__file__).resolve().parents[1] / "lib/frame-clock.mjs"
    subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            (
                "import {readFile} from 'node:fs/promises';const [m,v,r,f]=process.argv.slice(1);"
                "const api=await import(m);await api.verifiedClockReceipt(v,JSON.parse(await readFile(r)),"
                "Number(f),{always:true,requireBrand:true});"
            ),
            validator.as_uri(),
            movie,
            output / "verification.json",
            str(fps),
        ],
        check=True,
    )
    # The corrected master already contains the verified captions.
    write(
        output / "review-copy.json",
        {
            "sourceSha256": movie_sha,
            "vttSha256": sha(vtt),
            "assemblyFingerprint": generation,
            "fingerprint": fingerprint,
            "sha256": movie_sha,
        },
    )
    return receipt
