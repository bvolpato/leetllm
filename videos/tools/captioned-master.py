#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Add selectable English captions and retain the QuickTime chapter track and original streams."""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile


def run(*args):
    return subprocess.check_output(list(map(str, args)), text=True)


def probe(movie):
    return json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_chapters", "-of", "json", movie))


def audio_video_hashes(movie):
    return run("ffmpeg", "-nostdin", "-v", "error", "-i", movie, "-map", "0:v:0", "-map", "0:a:0", "-c", "copy", "-f", "streamhash", "-hash", "sha256", "-")


def tracks(media, kind):
    return [stream for stream in media["streams"] if stream["codec_type"] == kind]


def chapter_track(media):
    return [s for s in tracks(media, "data") if s.get("codec_tag_string") == "text"]


def verify(source, result, original, final):
    for kind in ("video", "audio"):
        old, new = tracks(source, kind), tracks(result, kind)
        if len(old) != 1 or len(new) != 1:
            raise ValueError(f"Expected one {kind} stream in both movies")
        if old[0]["nb_frames"] != new[0]["nb_frames"] or abs(float(old[0]["duration"]) - float(new[0]["duration"])) > 0.001:
            raise ValueError(f"{kind} sample count or duration changed")
    chapters, remuxed = source["chapters"], result["chapters"]
    if not chapters or len(chapters) != len(remuxed):
        raise ValueError("Chapter count changed or source master has no chapters")
    for a, b in zip(chapters, remuxed):
        if a["tags"]["title"] != b["tags"]["title"] or any(abs(float(a[p])-float(b[p])) > 0.001 for p in ("start_time", "end_time")):
            raise ValueError("Chapter title or position changed")
    before, after = chapter_track(source), chapter_track(result)
    if len(before) != 1 or len(after) != 1 or int(after[0]["nb_frames"]) != len(chapters):
        raise ValueError("QuickTime chapter text track does not contain every chapter")
    if before[0]["nb_frames"] != after[0]["nb_frames"] or abs(float(before[0]["duration"]) - float(after[0]["duration"])) > 0.001:
        raise ValueError("QuickTime chapter sample count or duration changed")
    subs = tracks(result, "subtitle")
    if len(subs) != 1 or subs[0].get("codec_name") != "mov_text" or subs[0].get("tags", {}).get("language") != "eng" or not subs[0]["disposition"]["default"] or int(subs[0]["nb_frames"]) < 2:
        raise ValueError("Default English captions missing or empty")
    if audio_video_hashes(original) != audio_video_hashes(final):
        raise ValueError("Encoded picture or sound changed during remux")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("movie", type=Path)
    p.add_argument("captions", type=Path)
    p.add_argument("delivery", type=Path)
    args = p.parse_args()
    if args.delivery.resolve() == args.movie.resolve():
        p.error("Choose a separate delivery path to preserve the renderer receipt")
    if (Path(__file__).resolve().parents[3] / 'REVIEW_ONLY').exists():
        raise SystemExit('Review-only phase is active. Delivery encoding is paused.')
    source = probe(args.movie)
    args.delivery.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=args.delivery.parent) as folder:
        final = Path(folder) / "captioned.mp4"
        run("ffmpeg", "-nostdin", "-v", "error", "-i", args.movie, "-i", args.captions, "-map", "0:v:0", "-map", "0:a:0", "-map", "1:s:0", "-map_metadata", "0", "-map_chapters", "0", "-c", "copy", "-c:s", "mov_text", "-disposition:s:0", "default", "-metadata:s:s:0", "language=eng", "-movie_timescale", "1000000", "-movflags", "+faststart", final)
        verify(source, probe(final), args.movie, final)
        final.replace(args.delivery)
    print(args.delivery)


if __name__ == "__main__":
    main()
