#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Build an editorial edition from the exact reviewed MP4 and a Vizmatic shot."""

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from fractions import Fraction
from pathlib import Path


def run(*args):
    subprocess.run(list(map(str, args)), check=True, stdin=subprocess.DEVNULL)


def probe(path):
    return json.loads(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_streams",
                "-show_chapters",
                "-of",
                "json",
                path,
            ]
        )
    )


def video(info):
    return next(s for s in info["streams"] if s["codec_type"] == "video")


def ff(*args):
    run("ffmpeg", "-nostdin", "-hide_banner", "-v", "error", "-y", *args)


def review_captions(original, info, start, length, work):
    sidecar = original.with_suffix(".vtt")
    if sidecar.is_file():
        body = sidecar.read_text(encoding="utf-8-sig")
    elif any(s["codec_type"] == "subtitle" for s in info["streams"]):
        body = subprocess.check_output(
            [
                "ffmpeg",
                "-v",
                "error",
                "-i",
                original,
                "-map",
                "0:s:0",
                "-f",
                "webvtt",
                "-",
            ],
            text=True,
        )
    else:
        body = ""

    def millis(value):
        parts = value.split(":")
        return round(
            sum(float(v) * 60**i for i, v in enumerate(reversed(parts))) * 1000
        )

    def clock(ms):
        return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02}.{ms % 1000:03}"

    cues = []
    start = round(start * 1000)
    length = round(length * 1000)
    for block in re.split(r"\n\s*\n", body.strip()):
        m = re.search(r"([\d:.]+) --> ([\d:.]+)[^\n]*\n(.+)", block, re.DOTALL)
        if m:
            a, b = max(0, millis(m[1]) - start), min(length, millis(m[2]) - start)
            if a < b:
                cues.append((a, b, m[3].strip()))
    out = ["WEBVTT", ""]
    for offset, title in [(0, "Before"), (length, "After")]:
        for a, b, words in cues or [(0, length, "")]:
            out.extend(
                [
                    f"{clock(a + offset)} --> {clock(b + offset)}",
                    f"{title}  |  {words}" if words else title,
                    "",
                ]
            )
    path = work / "comparison.vtt"
    path.write_text("\n".join(out) + "\n")
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("lesson", type=Path)
    parser.add_argument("original", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--runtime",
        type=Path,
        default=Path(__file__).resolve().parents[1]
        / "node_modules/vizmatic/dist/cli.js",
    )
    args = parser.parse_args()
    lesson = args.lesson.resolve()
    original = args.original.resolve()
    recipe = json.loads((lesson / "cut.json").read_text())
    with original.open("rb") as handle:
        if hashlib.file_digest(handle, "sha256").hexdigest() != recipe["sourceSha256"]:
            raise ValueError("The baseline MP4 differs from the reviewed source")
    info = probe(original)
    src = video(info)
    rate = Fraction(src["avg_frame_rate"])
    total = int(src["nb_frames"])
    if (
        src["codec_name"] != "h264"
        or src["pix_fmt"] != "yuv420p"
        or Fraction(src["r_frame_rate"]) != rate
    ):
        raise ValueError("Expected constant-frame-rate H.264 with 4:2:0 pixels")
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    final = output / (lesson.name + ".mp4")
    if original == final:
        raise ValueError("Keep the immutable baseline in a separate directory")
    entries = recipe.get("passages", [recipe])
    if not entries:
        raise ValueError("Specify at least one passage")
    with tempfile.TemporaryDirectory(dir=output) as tmp:
        work = Path(tmp)
        pieces, reels = [], []
        cursor = 0

        def time(frame):
            return f"{float(frame / rate):.9f}"

        def fragment(movie, first, last, encode=False):
            if first == last:
                return
            target = work / f"part-{len(pieces)}.mp4"
            flags = (
                ["-c:v", "libx264", "-threads", "2", "-preset", "fast", "-crf", "12"]
                if encode
                else ["-c:v", "copy"]
            )
            ff(
                "-ss",
                time(first),
                "-i",
                movie,
                "-map",
                "0:v:0",
                "-map_chapters",
                "-1",
                "-frames:v",
                last - first,
                *flags,
                target,
            )
            if int(video(probe(target))["nb_frames"]) != last - first:
                raise ValueError(f"Unexpected frame count in {target}")
            pieces.append((target, last - first))

        raw = subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_packets",
                "-show_entries",
                "packet=pts_time,flags",
                "-of",
                "csv=p=0",
                original,
            ],
            text=True,
        )
        keys = sorted(
            {
                0,
                total,
                *(
                    round(Fraction(line.split(",")[0]) * rate)
                    for line in raw.splitlines()
                    if ",K" in line
                ),
            }
        )
        for number, item in enumerate(entries):
            a, b = (round(Fraction(str(item[key])) * rate) for key in ("start", "end"))
            if not cursor <= a < b <= total:
                raise ValueError(
                    "Passages must be ordered, disjoint, and inside the baseline timeline"
                )
            # Preserve closed GOPs by stream copy. Reencode only the two partial boundary GOPs.
            lo = max(cursor, max(k for k in keys if k <= a))
            hi = min(k for k in keys if k >= b)
            if number + 1 < len(entries):
                hi = min(hi, round(Fraction(str(entries[number + 1]["start"])) * rate))
            if cursor in keys:
                fragment(original, cursor, lo)
            else:
                fragment(original, cursor, lo, True)
            fragment(original, lo, a, True)
            film = lesson / item.get("file", "cut.ts")
            rendered = work / f"render-{number}"
            run(
                "node",
                args.runtime,
                "film",
                film,
                "--width",
                src["width"],
                "--fps",
                float(rate),
                "--quality",
                "standard",
                "--workers",
                1,
                "--out",
                rendered,
                "--format",
                "mp4",
            )
            (clip,) = rendered.glob("*.mp4")
            shot = video(probe(clip))
            if abs(int(shot["nb_frames"]) - (b - a)) > 1 or (
                shot["width"],
                shot["height"],
            ) != (src["width"], src["height"]):
                raise ValueError(
                    f"{film.name} must fill exactly {b - a} frames at {rate} fps"
                )
            if int(shot["nb_frames"]) < b - a:
                padded = work / f"padded-{number}.mp4"
                ff(
                    "-i",
                    clip,
                    "-map",
                    "0:v",
                    "-vf",
                    "tpad=stop_mode=clone:stop=1",
                    "-threads",
                    2,
                    "-c:v",
                    "libx264",
                    "-crf",
                    12,
                    padded,
                )
                clip = padded
            fragment(clip, 0, b - a)
            fragment(original, b, hi, True)
            cursor = hi
            reels.append((a, b))
        fragment(original, cursor, total, cursor not in keys)
        playlist = work / "list.txt"
        playlist.write_text(
            "".join(f"file '{p.name}'\nduration {time(n)}\n" for p, n in pieces)
        )
        movie = work / "movie.mp4"
        ff(
            "-f",
            "concat",
            "-safe",
            0,
            "-i",
            playlist,
            "-i",
            original,
            "-map",
            "0:v:0",
            "-map",
            "1:a?",
            "-map",
            "1:s?",
            "-map_metadata",
            1,
            "-map_chapters",
            1,
            "-c",
            "copy",
            "-movie_timescale",
            1000000,
            "-movflags",
            "+faststart",
            movie,
        )
        result = probe(movie)
        if int(video(result)["nb_frames"]) != total or len(result["chapters"]) != len(
            info["chapters"]
        ):
            raise ValueError("Output frame count or chapters changed")
        outputs = []
        for i, (a, b) in enumerate(reels):
            length = min(round(30 * rate), max(round(15 * rate), b - a), total)
            start = min(a, total - length)
            name = "before-and-after" + (f"-{i + 1}" if len(reels) > 1 else "") + ".mp4"
            reel = work / name
            captions = review_captions(
                original, info, start / rate, length / rate, work
            )
            ff(
                "-ss",
                time(start),
                "-t",
                time(length),
                "-i",
                original,
                "-ss",
                time(start),
                "-t",
                time(length),
                "-i",
                movie,
                "-i",
                captions,
                "-filter_complex",
                "[0:v]scale=1280:-2[v0];[1:v]scale=1280:-2[v1];[v0][0:a][v1][1:a]concat=n=2:v=1:a=1[v][a]",
                "-map",
                "[v]",
                "-map",
                "[a]",
                "-map",
                "2:s",
                "-c:s",
                "mov_text",
                "-disposition:s:0",
                "default",
                "-map_chapters",
                "-1",
                "-threads",
                2,
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                18,
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                reel,
            )
            outputs.append(reel)
        for reel in outputs:
            os.replace(reel, output / reel.name)
        os.replace(movie, final)
        for suffix in [".vtt", ".srt"]:
            sidecar = original.with_suffix(suffix)
            if sidecar.exists() and sidecar != final.with_suffix(suffix):
                shutil.copyfile(sidecar, final.with_suffix(suffix))
    print(final)


if __name__ == "__main__":
    main()
