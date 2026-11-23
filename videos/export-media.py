#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Extract movies, captions, chapters and scripts from a verified review bundle."""

import argparse
import hashlib
import io
import json
import math
import re
import subprocess
import tempfile
import zipfile
from fractions import Fraction
from pathlib import Path


def copy_hashed(incoming, outgoing):
    digest = hashlib.sha256()
    size = 0
    while block := incoming.read(1024 * 1024):
        digest.update(block)
        size += len(block)
        outgoing.write(block)
    return {"sha256": digest.hexdigest(), "bytes": size}


def copy_verified(original, receipt, filename, outgoing):
    relative = f"{receipt['id']}/{filename}"
    expected = receipt["artifactSha256"][filename]
    movie = filename == f"{receipt['id']}.mp4"
    if movie and expected != receipt["sha256"]:
        raise ValueError(f"Movie checksums disagree: {receipt['id']}")
    with original.open(relative) as incoming:
        actual = copy_hashed(incoming, outgoing)
    if actual["sha256"] != expected or (movie and actual["bytes"] != receipt["bytes"]):
        raise ValueError(f"Delivery checksum mismatch: {relative}")
    return actual


def verified_bytes(original, receipt, name):
    buffer = io.BytesIO()
    copy_verified(original, receipt, name, buffer)
    return buffer.getvalue()


def milliseconds(timestamp):
    hours, minutes, seconds, millis = map(int, re.split("[:,]", timestamp))
    return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis


def caption_cues(srt, vtt):
    stamp = r"[0-9]{2,}:[0-5][0-9]:[0-5][0-9],[0-9]{3}"
    cues = []
    vtt_blocks = ["WEBVTT"]
    for index, block in enumerate(srt.split("\n\n"), start=1):
        lines = block.split("\n", 2)
        if len(lines) != 3:
            raise ValueError(f"Incomplete SRT cue {index}")
        number, times, text = lines
        match = re.fullmatch(f"({stamp}) --> ({stamp})", times)
        if number != str(index) or not match or not text.strip():
            raise ValueError(f"Invalid SRT cue {index}")
        start, end = map(milliseconds, match.groups())
        if start >= end or (cues and start < cues[-1][1]):
            raise ValueError(f"Overlapping or empty SRT cue {index}")
        cues.append((start, end, text))
        vtt_blocks.append(times.replace(",", ".") + "\n" + text)
    if vtt != "\n\n".join(vtt_blocks):
        raise ValueError("WebVTT cues differ from SRT cues")
    return cues


def media_command(command, *, stdout=subprocess.PIPE):
    result = subprocess.run(command, stdout=stdout, stderr=subprocess.PIPE)
    if result.returncode or result.stderr.strip():
        raise ValueError(f"{command[0]}: {result.stderr.decode(errors='replace').strip() or result.returncode}")
    return result.stdout


def probe(movie, *options):
    return json.loads(media_command(["ffprobe", "-v", "error", *options, "-of", "json", movie]))


def movie_layout(movie, *, subtitled):
    info = probe(movie, "-show_streams", "-show_format", "-show_chapters", "-show_data_hash", "sha256")
    tracks = {s["codec_type"]: s for s in info["streams"]}
    codecs = {"video": "h264", "audio": "aac", "data": "bin_data"}
    if subtitled:
        codecs["subtitle"] = "mov_text"
    observed = {kind: stream["codec_name"] for kind, stream in tracks.items()}
    if (len(info["streams"]) != len(codecs) or observed != codecs
            or tracks["data"]["codec_tag_string"] != "text" or not info["chapters"]):
        raise ValueError(f"Expected a chaptered lesson with tracks {codecs}, found {observed}")
    if subtitled:
        sub = tracks["subtitle"]
        if sub["codec_tag_string"] != "tx3g" or sub.get("tags", {}).get("language") != "eng" or sub["disposition"]["forced"]:
            raise ValueError("Missing selectable English subtitle track")
    return info, tracks


def av_packet_hash(movie, selector):
    # Spool the table so verification uses bounded memory for long lessons.
    with tempfile.TemporaryFile(dir=movie.parent) as table:
        media_command(["ffprobe", "-v", "error", "-select_streams", selector, "-show_packets", "-show_entries",
                       "packet=pts,dts,duration,size,flags,data_hash:packet_side_data", "-show_data_hash", "sha256",
                       "-of", "compact", movie], stdout=table)
        if not table.tell():
            raise ValueError(f"Missing packets for {selector}")
        table.seek(0)
        return hashlib.file_digest(table, "sha256").digest()


def timed_samples(movie, track, *options):
    rows = probe(movie, *options, "-select_streams", str(track["index"]),
                 "-show_entries", "packet=pts,duration,pos,size")["packets"]
    base = Fraction(track["time_base"])
    with movie.open("rb") as media:
        for row in rows:
            media.seek(int(row["pos"]))
            payload = media.read(int(row["size"]))
            if len(payload) != int(row["size"]):
                raise ValueError("Truncated MP4 text sample")
            yield row["pts"] * base, (row["pts"] + row["duration"]) * base, payload


def chapter_samples(movie, chapters, track):
    # Expose the QuickTime chapter track even when the MP4 also has a chapter list.
    samples = timed_samples(movie, track, "-ignore_chapters", "1")
    result = []
    for chapter, (start, end, payload) in zip(chapters, samples, strict=True):
        base = Fraction(chapter["time_base"])
        title = chapter["tags"]["title"].encode("utf-8")
        if (not title or start != chapter["start"] * base or end != chapter["end"] * base or end <= start
                or not payload.startswith(len(title).to_bytes(2, "big") + title)):
            raise ValueError("QuickTime chapter sample disagrees with chapter title or timing")
        result.append((chapter["id"], chapter["tags"], start, end, payload))
    return result


def mux_english_subtitles(movie, srt, output, cues, receipt):
    before, source = movie_layout(movie, subtitled=False)
    video = source["video"]
    properties = {"width": video["width"], "height": video["height"], "fps": Fraction(video["avg_frame_rate"]),
                  "duration": float(before["format"]["duration"]), "videoCodec": video["codec_name"],
                  "audioCodec": source["audio"]["codec_name"]}
    for key, value in properties.items():
        expected = Fraction(str(receipt[key])) if key == "fps" else receipt[key]
        if value != expected:
            raise ValueError(f"Movie {key} differs from the delivery receipt")
    # MP4 stores chapter sample durations in 32 bits. A finer clock can overflow on long chapters.
    chapter_timescale = Fraction(source["data"]["time_base"]).denominator
    media_command(["ffmpeg", "-nostdin", "-v", "error", "-xerror", "-n", "-i", movie, "-f", "srt", "-i", srt,
                   "-map", "0:v:0", "-map", "0:a:0", "-map", "1:s:0", "-map_metadata", "0", "-map_chapters", "0",
                   "-c", "copy", "-c:s", "mov_text", "-movie_timescale", str(chapter_timescale), "-metadata:s:s:0", "language=eng",
                   "-metadata:s:s:0", "handler_name=English", "-disposition:s:0", "0", "-movflags", "+faststart", output])
    after, copied = movie_layout(output, subtitled=True)
    for key in ("start_time", "duration"):
        if after["format"][key] != before["format"][key]:
            raise ValueError(f"Movie {key} changed")
    for key in ("title", "artist", "comment", "album", "description"):
        if after["format"]["tags"].get(key) != before["format"]["tags"].get(key):
            raise ValueError(f"Movie {key} changed")
    for kind, selector in (("video", "v:0"), ("audio", "a:0")):
        keys = ("codec_tag_string", "profile", "extradata_hash", "width", "height", "pix_fmt", "color_range",
                "color_space", "color_transfer", "color_primaries", "sample_aspect_ratio", "sample_rate", "channels",
                "channel_layout", "time_base", "start_pts", "duration_ts", "avg_frame_rate", "r_frame_rate",
                "nb_frames", "disposition", "tags", "side_data_list")
        if (any(copied[kind].get(k) != source[kind].get(k) for k in keys)
                or av_packet_hash(movie, selector) != av_packet_hash(output, selector)):
            raise ValueError(f"{kind} stream configuration, packet timing or payload changed")
    if chapter_samples(movie, before["chapters"], source["data"]) != chapter_samples(output, after["chapters"], copied["data"]):
        raise ValueError("QuickTime chapters changed")
    visible = ((start, end, data) for start, end, data in timed_samples(output, copied["subtitle"]) if data != b"\0\0")
    for (start, end, text), (pts, stop, payload) in zip(cues, visible, strict=True):
        plain = text.encode("utf-8")
        if payload != len(plain).to_bytes(2, "big") + plain:
            raise ValueError("Encoded caption text differs from the plain SRT text")
        if (1000 * pts, 1000 * stop) != (start, end):
            raise ValueError("Encoded caption timing differs from SRT timing")
    media_command(["ffmpeg", "-nostdin", "-v", "error", "-xerror", "-err_detect", "explode", "-threads", "2",
                   "-i", output, "-map", "0:v:0", "-map", "0:a:0", "-f", "null", "-"])


def write_subtitled_movie(original, receipt, outgoing, directory):
    lid = receipt["id"]
    with tempfile.TemporaryDirectory(dir=directory) as scratch:
        root = Path(scratch)
        movie, srt, output = root / "original.mp4", root / "captions.srt", root / "subtitled.mp4"
        with movie.open("wb") as target:
            copy_verified(original, receipt, f"{lid}.mp4", target)
        srt.write_bytes(verified_bytes(original, receipt, f"{lid}.srt"))
        vtt = verified_bytes(original, receipt, f"{lid}.vtt").decode("utf-8-sig")
        cues = caption_cues(srt.read_text(encoding="utf-8-sig").rstrip("\n"), vtt.replace("\r\n", "\n").rstrip("\n"))
        if "timeline.json" in receipt["artifactSha256"]:
            timeline = json.loads(verified_bytes(original, receipt, "timeline.json"))
            measured = [(math.floor(c["start"] * 1000 + 0.5), math.floor(c["end"] * 1000 + 0.5), c["text"])
                        for c in timeline["captions"]]
            if timeline.get("id", lid) != lid or measured != cues:
                raise ValueError("Caption sidecars differ from the measured timeline")
        mux_english_subtitles(movie, srt, output, cues, receipt)
        with output.open("rb") as incoming:
            return copy_hashed(incoming, outgoing)


def export_media(source: Path, output: Path, *, embed_english_subtitles: bool = False) -> Path:
    if source.resolve() == output.resolve():
        raise ValueError("Input and output archives must be different")
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(source) as original:
        names = original.namelist()
        if len(names) != len(set(names)):
            raise ValueError("Review archive contains duplicate entries")
        receipts = json.loads(original.read("manifest.json"))
        if not isinstance(receipts, list) or not receipts:
            raise ValueError("Review manifest must contain lessons")
        ids = [receipt["id"] for receipt in receipts]
        if len(ids) != len(set(ids)) or any(not re.fullmatch(r"[a-z][a-z0-9-]*", lid) for lid in ids):
            raise ValueError("Review manifest contains invalid or duplicate lesson IDs")
        portable = []
        with tempfile.TemporaryDirectory(prefix=f".{output.stem}-", dir=output.parent) as temporary_dir:
            temporary = Path(temporary_dir) / "media.zip"
            with zipfile.ZipFile(temporary, "w", allowZip64=True) as bundle:
                for receipt in receipts:
                    lid = receipt["id"]
                    if receipt.get("fullDecode") != "passed" or receipt.get("frameAudit", {}).get("passed") is not True:
                        raise ValueError(f"Movie verification is incomplete: {lid}")
                    entry = {key: receipt[key] for key in (
                        "id", "title", "source", "sourceSha256", "fingerprint", "sha256", "bytes", "duration",
                        "width", "height", "fps", "videoCodec", "audioCodec", "provider", "voice", "rate", "scenes", "spokenWords",
                    )}
                    entry.update(file=f"{lid}/{lid}.mp4", files={})
                    for suffix in ("mp4", "srt", "vtt", "chapters.txt", "script.md"):
                        filename = f"{lid}.{suffix}"
                        relative = f"{lid}/{filename}"
                        info = zipfile.ZipInfo(relative)
                        info.compress_type = zipfile.ZIP_STORED if suffix == "mp4" else zipfile.ZIP_DEFLATED
                        with bundle.open(info, "w", force_zip64=True) as outgoing:
                            if suffix == "mp4" and embed_english_subtitles:
                                actual = write_subtitled_movie(original, receipt, outgoing, temporary_dir)
                                entry.update(actual)
                                entry["subtitleTrack"] = {"codec": "mov_text", "language": "eng", "sourceMovieSha256": receipt["sha256"]}
                            else:
                                actual = copy_verified(original, receipt, filename, outgoing)
                        entry["files"][suffix] = {"path": relative, **actual}
                    portable.append(entry)
                bundle.writestr("manifest.json", json.dumps(portable, ensure_ascii=False, indent=2) + "\n", compress_type=zipfile.ZIP_DEFLATED)
            with zipfile.ZipFile(temporary) as bundle:
                failure = bundle.testzip()
                if failure:
                    raise ValueError(f"Archive integrity check failed: {failure}")
            # Keep an existing delivery intact until its replacement is complete.
            temporary.replace(output)
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="Complete ZIP from videos/package.py")
    parser.add_argument("--output", type=Path, required=True, help="Smaller movie ZIP to create")
    parser.add_argument("--embed-english-subtitles", action="store_true", help="Embed the verified English captions as selectable MP4 text")
    arguments = parser.parse_args()
    result = export_media(arguments.input, arguments.output, embed_english_subtitles=arguments.embed_english_subtitles)
    print(f"Ready: {result} ({result.stat().st_size:,} bytes)")
