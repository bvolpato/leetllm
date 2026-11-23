#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///
"""Deliver a pinned film with the course narrator on its existing picture and caption clock."""
import argparse
from dataclasses import dataclass
import hashlib
import html
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import wave

VIDEOS = Path(__file__).resolve().parents[1]
SAMPLE_RATE = 24000


def sha(path):
    with path.open("rb") as src:
        return hashlib.file_digest(src, "sha256").hexdigest()


def ffmpeg(*args, data=None):
    return subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *args],
                          input=data, stdout=subprocess.PIPE, check=True).stdout


def probe(movie):
    return json.loads(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_streams", "-show_chapters", "-of", "json", movie]
    ))


def payload(movie, kind):
    return ffmpeg("-i", movie, "-map", f"0:{kind}:0", "-c", "copy", "-f", "streamhash", "-hash", "sha256", "-")


def seconds(timestamp):
    value = 0.0
    for field in timestamp.replace(",", ".").split(":"):
        value = 60 * value + float(field)
    return value


@dataclass(frozen=True)
class Cue:
    start: float
    end: float
    text: str


def read_cues(path):
    cues = []
    text = path.read_text(encoding="utf-8-sig")
    if not text.startswith("WEBVTT"):
        raise ValueError(f"Expected WebVTT at {path}")
    for block in re.split(r"\n\s*\n", text.strip()):
        lines = block.splitlines()
        pos = next((i for i, line in enumerate(lines) if " --> " in line), None)
        if pos is None:
            continue
        start, end = lines[pos].split(" --> ")
        words = html.unescape(re.sub(r"<[^>]+>", "", " ".join(lines[pos + 1:]))).strip()
        cue = Cue(seconds(start.strip()), seconds(end.split()[0]), words)
        if not words or cue.end <= cue.start or (cues and cue.start < cues[-1].end):
            raise ValueError(f"Empty, reversed or overlapping caption: {block}")
        cues.append(cue)
    if not cues:
        raise ValueError("No speech captions")
    return cues


def phrasing(cues):
    """Rejoin adjacent subtitle fragments so one sentence receives a continuous reading."""
    groups = []
    for cue in cues:
        if groups:
            previous = groups[-1][-1]
            if (cue.start - previous.end <= 0.9 and cue.end - groups[-1][0].start <= 50
                    and not re.search(r'[.!?…]["”\')\]]*$', previous.text)):
                groups[-1].append(cue)
                continue
        groups.append([cue])
    return groups


def letters(text):
    return "".join(c for c in text.casefold() if c.isalnum())


def speech_ranges(group, words, sample_count):
    """Find the original caption splits in the provider's measured word boundaries."""
    ends = []
    count = 0
    for cue in group:
        count += len(letters(cue.text))
        ends.append(count)
    if "".join(letters(w["text"]) for w in words) != "".join(letters(c.text) for c in group):
        raise ValueError(f"Spoken words disagree with the captions: {group[0].text!r}")
    spoken = [w for w in words if letters(w["text"])]
    if not spoken:
        raise ValueError("Missing timed spoken words")
    offsets = {0: max(0.0, spoken[0]["start"] - .035)}
    count = 0
    for i, word in enumerate(spoken):
        count += len(letters(word["text"]))
        # Split between tokens. Keep their articulation and breathing on the proper side.
        offsets[count] = ((word["end"] + spoken[i + 1]["start"]) / 2 if i + 1 < len(spoken)
                          else word["end"] + .035)
    cuts = [0, *ends]
    if any(c not in offsets for c in cuts):
        raise ValueError("A caption splits a spoken word")
    return [(max(0, round(offsets[a] * SAMPLE_RATE)), min(sample_count, round(offsets[b] * SAMPLE_RATE)))
            for a, b in zip(cuts, cuts[1:])]


PCM = ["-f", "s16le", "-ar", str(SAMPLE_RATE), "-ac", "1"]


class TightCue(ValueError):
    pass


def fit_speech(pcm, frames):
    """Fit a full phrase without cutting phonemes or speeding the narrator past 1.35x."""
    samples = len(pcm) // 2
    if frames < 1 or not samples:
        raise ValueError("Caption has no room for speech")
    # Keep the natural pace if the old caption included a long hold.
    if samples <= frames:
        return pcm
    tempo = samples / frames
    for _ in range(3):
        if tempo > 1.35:
            raise TightCue("Narration does not fit the cue at an intelligible pace")
        chunk = ffmpeg(*PCM, "-i", "-", "-af", f"atempo={tempo:.8f}", *PCM, "-", data=pcm)
        if not chunk:
            raise ValueError("Time fit produced an empty take")
        if len(chunk) <= 2 * frames:
            return chunk
        # Compensate for the encoder's overlap window and retain the complete tail.
        tempo *= (len(chunk) / 2 + 16) / frames
    raise TightCue("A complete take does not fit the requested caption window")


def clock(stamp):
    ms = round(stamp * 1000)
    return f"{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}"


def write_captions(cues, target):
    target.write_text("WEBVTT\n\n" + "\n\n".join(
        f"{clock(c.start)} --> {clock(c.end)}\n{html.escape(c.text)}" for c in cues
    ) + "\n")


def schedule_phrase(group, pcm, bounds, next_start):
    begin = round(group[0].start * SAMPLE_RATE)
    end = round(group[-1].end * SAMPLE_RATE)
    lo, hi = bounds[0][0], bounds[-1][1]
    if hi <= lo:
        raise ValueError("Empty synthesized phrase")
    phrase = pcm[2*lo:2*hi]
    # A very brief response can finish naturally in the following quiet hold.
    room = round(min(next_start, group[-1].end + .35) * SAMPLE_RATE) - begin
    preferred = min(room, max(end - begin, hi - lo))
    try:
        joined = fit_speech(phrase, preferred)
    except TightCue:
        # A short cue may borrow a little of the following original quiet hold.
        limit = round(min(next_start, group[-1].end + .6) * SAMPLE_RATE)
        joined = fit_speech(phrase, limit - begin)
    frames = len(joined) // 2
    # Translate the measured word boundaries to the original picture clock.
    placements = []
    for cue, (a, b) in zip(group, bounds, strict=True):
        start = begin + round(frames * (a - lo) / (hi - lo))
        finish = begin + round(frames * (b - lo) / (hi - lo))
        placements.append(Cue(start / SAMPLE_RATE, finish / SAMPLE_RATE, cue.text))
    if any(abs(old.start - spoken.start) > .35 for old, spoken in zip(group, placements)):
        # Widely spaced teaching cues may need their original reveal times.
        try:
            segments = [(round(c.start * SAMPLE_RATE),
                         fit_speech(pcm[2*a:2*b], round(c.end * SAMPLE_RATE) - round(c.start * SAMPLE_RATE)))
                        for c, (a, b) in zip(group, bounds, strict=True)]
            return segments, group
        except TightCue:
            # Keep this sentence continuous and show each caption with its spoken words.
            pass
    return [(begin, joined)], placements


def write_narration(groups, takes, profile, duration, target):
    captions = []
    with wave.open(str(target), "wb") as wav:
        wav.setparams((1, 2, SAMPLE_RATE, 0, "NONE", "not compressed"))
        cursor = 0
        for n, (group, take) in enumerate(zip(groups, takes, strict=True)):
            if take["text"] != " ".join(c.text for c in group):
                raise ValueError("Take text does not match the requested cues")
            boundaries = json.loads(Path(take["boundaries"]).read_text())
            if not same_narrator(boundaries, profile, word_timings=True):
                raise ValueError("Take has a different narrator")
            audio_hash = sha(Path(take["audio"]))
            if (audio_hash != take["audioHash"] or sha(Path(take["boundaries"])) != take["boundariesHash"]
                    or boundaries.get("audioSha256") != audio_hash):
                raise ValueError("Take audio and word timings do not match their hashes")
            pcm = ffmpeg("-i", take["audio"], *PCM, "-")
            bounds = speech_ranges(group, boundaries["words"], len(pcm) // 2)
            next_start = groups[n+1][0].start if n+1 < len(groups) else duration
            segments, revised = schedule_phrase(group, pcm, bounds, next_start)
            for start, chunk in segments:
                if start < cursor or start + len(chunk)//2 > math.ceil(duration * SAMPLE_RATE) + 1:
                    raise ValueError("Speech lies outside its picture clock")
                wav.writeframesraw(bytes(2 * (start - cursor)))
                wav.writeframesraw(chunk)
                cursor = start + len(chunk) // 2
            captions.extend(revised)
        wav.writeframesraw(bytes(2 * max(0, round(duration * SAMPLE_RATE) - cursor)))
    return captions


KOKORO_SETTINGS = ("engineVersion", "langCode", "sampleRate", "speed")


def same_narrator(record, profile, *, word_timings=False):
    provider = record.get("provider")
    if word_timings and provider == "edge-tts":
        provider = "edge"
    if provider != profile["provider"] or any(record.get(k) != profile[k] for k in ("voice", "rate")):
        return False
    if provider == "kokoro" and any(k not in profile or record.get(k) != profile[k] for k in KOKORO_SETTINGS):
        return False
    if "model" in record:
        return record["model"] == profile["model"]
    # Historical Edge receipts identify the service and neural voice without a model field.
    return provider == "edge" and profile["model"] == "Microsoft Edge Read Aloud"


def certified(receipt, movie_hash, profile):
    return bool(receipt and receipt.get("masterSha256", receipt.get("sha256")) == movie_hash
                and same_narrator(receipt, profile))


def redub(movie, captions, cache, tmp, profile):
    media = probe(movie)
    video = next(s for s in media["streams"] if s["codec_type"] == "video")
    duration = float(video["duration"])
    cues = read_cues(captions)
    chapters = media["chapters"]
    # These hash-pinned course films have a scored four-second logo, followed by a
    # speech-only mix. Keep the logo sample. Silence between speech cues starts clean.
    if not chapters or chapters[0].get("tags", {}).get("title") != "LeetLLM":
        raise ValueError("Cannot locate the original scored intro")
    intro = float(chapters[0]["end_time"])
    if abs(float(chapters[0]["start_time"])) > .001 or abs(intro - 4) > .075 or cues[0].start < intro:
        raise ValueError("The score and speech windows overlap or the intro differs")
    groups = phrasing(cues)
    texts = tmp / "speech.json"
    texts.write_text(json.dumps([" ".join(c.text for c in group) for group in groups], ensure_ascii=False))
    manifest = tmp / "takes.json"
    subprocess.run(["node", VIDEOS/"tools/course-speech.mjs", "--texts-json", texts,
                    "--output-root", cache, "--takes-manifest", manifest], check=True, cwd=VIDEOS.parent)
    wav = tmp / "narration.wav"
    revised = write_narration(groups, json.loads(manifest.read_text()), profile, duration, wav)
    subtitles = tmp/"master.vtt"
    write_captions(revised, subtitles)
    mix = (f"[0:a:0]atrim=start=0:end={intro},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo[intro];"
           f"[1:a:0]atrim=start={intro},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo[speech];"
           "[intro][speech]concat=n=2:v=0:a=1[out]")
    voice = tmp / "voice.wav"
    ffmpeg("-i", movie, "-i", wav, "-filter_complex", mix, "-map", "[out]", "-c:a", "pcm_s16le", voice)
    return voice


def bed_action(receipt, movie_hash, profile, expected_bed):
    if not certified(receipt, movie_hash, profile):
        return "redub"
    if "audioBed" not in receipt:
        return "score"
    bed = receipt["audioBed"]
    if isinstance(bed, dict) and expected_bed and all(bed.get(k) == v for k, v in expected_bed.items()):
        return "keep"
    return "redub"


def score(lesson, movie, subtitles, voice, output, tmp):
    source = probe(movie)
    chapters = source["chapters"]
    timing = tmp / "score-timing.json"
    timing.write_text(json.dumps({
        "beats": [group[0].start for group in phrasing(read_cues(subtitles))],
        "scenes": [float(chapter["start_time"]) for chapter in chapters],
    }))
    mix, receipt = tmp / "mix.wav", tmp / "bed.json"
    subprocess.run(["node", VIDEOS/"tools/course-bed.mjs", "--lesson", lesson, "--voice", voice,
                    "--out", mix, "--receipt", receipt, "--timing", timing], check=True)
    ffmpeg("-i", movie, "-i", mix, "-i", subtitles, "-map", "0:v:0", "-map", "1:a:0",
           "-map", "2:s:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
           "-c:s", "mov_text", "-metadata:s:s:0", "language=eng",
           "-disposition:s:0", "default", "-map_metadata", "0", "-map_chapters", "0",
           "-movie_timescale", "1000000", "-movflags", "+faststart", output)
    result = probe(output)
    video_duration = float(next(s["duration"] for s in source["streams"] if s["codec_type"] == "video"))
    audio_duration = float(next(s["duration"] for s in result["streams"] if s["codec_type"] == "audio"))
    if abs(audio_duration - video_duration) > .075:
        raise ValueError("Scored audio differs from the retained picture clock")
    for src, dst in zip(chapters, result["chapters"], strict=True):
        if src.get("tags", {}).get("title") != dst.get("tags", {}).get("title") or any(
            abs(float(src[key]) - float(dst[key])) > .075 for key in ("start_time", "end_time")
        ):
            raise ValueError("Audio mix changed a chapter")
    if payload(movie, "v") != payload(output, "v"):
        raise ValueError("Encoded picture changed during audio mix")
    return json.loads(receipt.read_text())


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("lesson")
    p.add_argument("movie", type=Path)
    p.add_argument("captions", type=Path)
    p.add_argument("output", type=Path)
    p.add_argument("--source-receipt", type=Path, help="Trusted generation receipt for the pinned source movie")
    p.add_argument("--speech-cache", type=Path)
    args = p.parse_args()
    spec = json.loads((VIDEOS/"editorial-cuts/batch-2026-11-10.json").read_text())["lessons"][args.lesson]
    if spec["action"] not in {"apply-recipe-to-pinned-input", "keep-selected-edition"}:
        p.error("This lesson uses authored film source")
    movie, captions, out = args.movie.resolve(), args.captions.resolve(), args.output.resolve()
    original_hash = sha(movie)
    if original_hash != spec["movie"]["sha256"] or sha(captions) != spec["captions"]["sha256"]:
        p.error("Source movie or caption checksum disagrees with the reviewed edition")
    profile = json.loads((VIDEOS/"narration.json").read_text())
    receipt = json.loads(args.source_receipt.read_text()) if args.source_receipt else None
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=out) as temp:
        tmp = Path(temp)
        picture = movie
        if spec["action"] == "apply-recipe-to-pinned-input":
            baseline = tmp / "baseline.mp4"
            try:
                os.link(movie, baseline)
            except OSError:
                shutil.copyfile(movie, baseline)
            os.symlink(captions, baseline.with_suffix(".vtt"))
            edits = tmp / "edits"
            recipe = VIDEOS.parent/spec["recipe"]
            subprocess.run(["uv", "run", VIDEOS/"editorial-cuts/build.py", recipe.parent, baseline, edits], check=True)
            picture = edits/f"{args.lesson}.mp4"
            if payload(picture, "a") != payload(movie, "a"):
                raise ValueError("The passage edit changed the pinned source audio")
        master = tmp / "master.mp4"
        expected_bed = json.loads(subprocess.check_output([
            "node", VIDEOS/"tools/course-bed.mjs", "--lesson", args.lesson, "--describe",
        ]))
        action = bed_action(receipt, original_hash, profile, expected_bed)
        subtitles = tmp/"master.vtt"
        if action == "keep":
            subprocess.run(["uv", "run", VIDEOS/"tools/captioned-master.py",
                            picture, captions, master], check=True)
            shutil.copyfile(captions, subtitles)
            bed = receipt["audioBed"]
            method = "verified-original-narration"
        else:
            if action == "score":
                duration = next(s["duration"] for s in probe(picture)["streams"] if s["codec_type"] == "video")
                voice = tmp / "voice.wav"
                ffmpeg("-i", picture, "-map", "0:a:0", "-af", f"apad,atrim=duration={duration}",
                       "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", voice)
                shutil.copyfile(captions, subtitles)
                method = "verified-original-narration"
            else:
                voice = redub(picture, captions, args.speech_cache or out/"speech", tmp, profile)
                method = "caption-timed-course-narration"
            bed = score(args.lesson, picture, subtitles, voice, master, tmp)
        bed = {**bed, "encodedAudioSha256": payload(master, "a").decode().strip().rsplit("=", 1)[1]}
        proof = {key:profile[key] for key in ("provider","voice","model","rate")}
        if profile["provider"] == "kokoro":
            proof.update({key: profile[key] for key in KOKORO_SETTINGS})
        proof.update(method=method, audioBed=bed, masterSha256=sha(master), sourceMovieSha256=original_hash,
                     sourceCaptionsSha256=spec["captions"]["sha256"], captionsSha256=sha(tmp/"master.vtt"))
        (tmp/"narration.json").write_text(json.dumps(proof, indent=2)+"\n")
        for name in ("master.vtt", "master.mp4", "narration.json"):
            os.replace(tmp/name, out/name)


if __name__ == "__main__":
    main()
