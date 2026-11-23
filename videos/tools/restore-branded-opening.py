#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["av==17.1.0"]
# ///
"""Prepend a verified stock opening while preserving the lesson's encoded tracks."""

import argparse
import hashlib
import json
import re
import runpy
import struct
import subprocess
import sys
import tempfile
from array import array
from fractions import Fraction
from math import log10
from pathlib import Path

import av

SECONDS = 4
RATE = 48000
AAC_FRAME = 1024
# Align the start edit with the 4-second join, which falls halfway through an AAC frame.
ALIGN = (-SECONDS * RATE) % AAC_FRAME
PREFIX_PACKETS = (SECONDS * RATE + ALIGN) // AAC_FRAME


def sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def ffmpeg(*args):
    return subprocess.check_output(
        ["ffmpeg", "-nostdin", "-hide_banner", "-v", "error", *args]
    )


def packets(reader, stream):
    return (p for p in reader.demux(stream) if p.dts is not None)


def ticks(time_base):
    count = Fraction(SECONDS, 1) / time_base
    if count.denominator != 1:
        raise ValueError("Four seconds does not fall on an exact stream tick")
    return int(count)


def chapters(source):
    result = [
        {
            "id": 0,
            "start": 0,
            "end": 4_000_000,
            "time_base": Fraction(1, 1_000_000),
            "metadata": {"title": "LeetLLM"},
        }
    ]
    for index, ch in enumerate(source.chapters(), 1):
        delta = ticks(ch["time_base"])
        result.append(
            dict(ch, id=index, start=ch["start"] + delta, end=ch["end"] + delta)
        )
    return result


def write_movie(body, brand_picture, brand_audio, target, temp):
    encoded = temp / "aligned-chime.m4a"
    ffmpeg(
        "-i",
        brand_audio,
        "-af",
        f"adelay={ALIGN}S:all=1",
        "-ar",
        str(RATE),
        "-ac",
        "2",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        encoded,
    )
    with (
        av.open(str(body)) as src,
        av.open(str(brand_picture)) as intro,
        av.open(str(encoded)) as chime,
        av.open(
            str(target),
            "w",
            options={"movie_timescale": "1000000", "movflags": "+faststart"},
        ) as out,
    ):
        vs, au, sub = (
            src.streams.video[0],
            src.streams.audio[0],
            src.streams.subtitles[0],
        )
        if (
            au.time_base != Fraction(1, RATE)
            or au.codec_context.name != "aac"
            or au.codec_context.frame_size != AAC_FRAME
        ):
            raise ValueError("Expected 48 kHz AAC with 1024-sample packets")
        if chime.streams.audio[0].codec_context.extradata != au.codec_context.extradata:
            raise ValueError("Chime and lesson AAC configurations differ")
        vi = intro.streams.video[0]
        if vi.codec_context.extradata != vs.codec_context.extradata:
            raise ValueError("Brand and lesson H.264 decoder configurations differ")
        out.metadata.update(src.metadata)
        out.set_chapters(chapters(src))
        streams = {}
        for source in (vs, au, sub):
            stream = out.add_stream_from_template(source)
            stream.time_base = source.time_base
            stream.metadata.update(source.metadata)
            stream.disposition = source.disposition
            streams[source.index] = stream
        for p in packets(intro, vi):
            p.stream = streams[vs.index]
            out.mux(p)
        for i, p in enumerate(packets(chime, chime.streams.audio[0])):
            if i == PREFIX_PACKETS:
                break
            if p.pts != (i - 1) * AAC_FRAME:
                raise ValueError("Unexpected chime encoder delay")
            p.pts -= ALIGN
            p.dts -= ALIGN
            p.stream = streams[au.index]
            out.mux(p)
        first_audio = True
        for p in src.demux(vs, au, sub):
            if p.dts is None:
                continue
            if p.stream.index == au.index and first_audio:
                if p.pts != -AAC_FRAME:
                    raise ValueError("Unexpected lesson AAC encoder delay")
                first_audio = False
            shift = ticks(p.time_base)
            p.pts += shift
            p.dts += shift
            p.stream = streams[p.stream.index]
            out.mux(p)


def timed_chapters(reader):
    return [
        (c["metadata"]["title"], c["start"] * c["time_base"], c["end"] * c["time_base"])
        for c in reader.chapters()
    ]


def compare_packet(kind, p, q, offset):
    if (
        bytes(p) != bytes(q)
        or p.pts * p.time_base + offset != q.pts * q.time_base
        or p.dts * p.time_base + offset != q.dts * q.time_base
        or p.duration * p.time_base != q.duration * q.time_base
    ):
        raise ValueError(
            f"{kind} packet or timing differs at {float(p.pts * p.time_base):.6f}s"
        )


def inspect_packets(body, brand, movie):
    proof = {}
    with av.open(str(body)) as src, av.open(str(movie)) as dst:
        c = timed_chapters(src)
        if timed_chapters(dst) != [("LeetLLM", 0, SECONDS)] + [
            (name, a + SECONDS, b + SECONDS) for name, a, b in c
        ]:
            raise ValueError("Changed chapter labels or boundaries")
    for kind in ("video", "audio", "subtitle"):
        with (
            av.open(str(body)) as src,
            av.open(str(movie)) as dst,
            av.open(str(brand)) as intro,
        ):
            old = next(s for s in src.streams if s.type == kind)
            new = next(s for s in dst.streams if s.type == kind)
            incoming = packets(dst, new)

            if kind == "video":
                count = 0
                for p in packets(intro, intro.streams.video[0]):
                    compare_packet(kind, p, next(incoming), 0)
                    count += 1
                proof["introVideoPackets"] = count
            elif kind == "audio":
                for i in range(PREFIX_PACKETS):
                    p = next(incoming)
                    if p.pts != (i - 1) * AAC_FRAME - ALIGN:
                        raise ValueError("Incorrect chime packet timing")
            else:
                # MP4 inserts an empty initial text sample during the new intro.
                incoming = (p for p in incoming if bytes(p) != b"\0\0")
            original = packets(src, old)
            if kind == "subtitle":
                original = (p for p in original if bytes(p) != b"\0\0")
            count, digest = 0, hashlib.sha256()
            for p in original:
                q = next(incoming, None)
                if q is None:
                    raise ValueError(f"Missing {kind} packet")
                compare_packet(kind, p, q, SECONDS)
                digest.update(struct.pack(">I", p.size))
                digest.update(p)
                count += 1
            if next(incoming, None) is not None:
                raise ValueError(f"Unexpected extra {kind} packet")
            proof[f"body{kind.title()}Packets"] = count
            proof[f"body{kind.title()}PacketSha256"] = digest.hexdigest()
    return proof


def sound_digest(movie, start_sample):
    return (
        ffmpeg(
            "-i",
            movie,
            "-map",
            "0:a:0",
            "-af",
            f"atrim=start_sample={start_sample}",
            "-c:a",
            "pcm_f32le",
            "-f",
            "hash",
            "-hash",
            "sha256",
            "-",
        )
        .decode()
        .strip()
        .split("=")[1]
    )


def verify_audio(body, chime, movie):
    source_audio = sound_digest(body, 0)
    if source_audio != sound_digest(movie, RATE * SECONDS):
        raise ValueError("Decoded lesson audio changed after the chime")

    def pcm(file):
        data = ffmpeg(
            "-i",
            file,
            "-map",
            "0:a:0",
            "-af",
            f"atrim=end_sample={RATE * SECONDS}",
            "-ar",
            str(RATE),
            "-ac",
            "2",
            "-f",
            "s16le",
            "-",
        )
        result = array("h", data)
        if sys.byteorder != "little":
            result.byteswap()
        return result

    expected, actual = pcm(chime), pcm(movie)
    if len(actual) != RATE * SECONDS * 2 or len(expected) != len(actual):
        raise ValueError("Chime duration differs")
    signal = sum(x * x for x in expected)
    error = sum((x - y) ** 2 for x, y in zip(expected, actual))
    snr = 10 * log10(signal / max(error, 1))
    if snr < 35:
        raise ValueError(
            f"Chime deviates from the approved recording ({snr:.1f} dB SNR)"
        )
    return {
        "decodedBodyAudioSha256": source_audio,
        "decodedBodyAudioFormat": "pcm_f32le",
        "chimeReferenceSnrDb": snr,
    }


def shifted_vtt(src, target):
    def later(stamp):
        parts = stamp.split(":")
        second = int(parts[-2]) * 60 + SECONDS
        if len(parts) == 3:
            second += int(parts[0]) * 3600
        whole, milli = parts[-1].split(".")
        second += int(whole)
        return f"{second // 3600:02}:{second // 60 % 60:02}:{second % 60:02}.{milli}"

    ts = r"(?:\d+:)?\d{2}:\d{2}\.\d{3}"
    value = re.sub(
        rf"^({ts})([ \t]+-->[ \t]+)({ts})",
        lambda m: later(m[1]) + m[2] + later(m[3]),
        src.read_text(),
        flags=re.MULTILINE,
    )
    target.write_text(value)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    for name in ("source", "brand", "stock-receipt", "output"):
        p.add_argument("--" + name, required=True, type=Path)
    args = p.parse_args()
    source, output = args.source.resolve(), args.output.resolve()
    if output.is_relative_to(source):
        p.error("Choose a destination outside the source master")
    if output.exists():
        p.error("The destination already exists")
    old = json.loads((source / "verification.json").read_text())
    if old.get("opening") != "lesson" or old.get("brandIntro", True) is not None:
        p.error("Only a verified logo-free opening is eligible")
    lesson = old["id"]
    if not isinstance(lesson, str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]*", lesson):
        p.error("Invalid lesson identifier")
    movie = source / (lesson + ".mp4")
    helper = Path(__file__).resolve().parent
    donor = runpy.run_path(str(helper / "brand-restoration-donor.py"))["verify_brand"](
        args.brand, args.stock_receipt, movie
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(
        dir=output.parent, prefix=".restore-opening-"
    ) as stage:
        temp = Path(stage)
        prepared = temp / "master"
        prepared.mkdir()
        dest = prepared / movie.name
        picture, sound = Path(donor["picture"]), Path(donor["audio"])
        write_movie(movie, picture, sound, dest, temp)
        proof = inspect_packets(movie, picture, dest)
        proof.update(verify_audio(movie, sound, dest))
        proof.update(
            sourceMovieSha256=sha(movie),
            donorMovieSha256=sha(picture),
            outputMovieSha256=sha(dest),
        )
        shifted_vtt(source / (lesson + ".vtt"), prepared / (lesson + ".vtt"))
        runpy.run_path(str(helper / "brand-restoration-evidence.py"))["write_evidence"](
            source, donor, prepared, proof, final_directory=output
        )
        prepared.rename(output)
    print(output)


if __name__ == "__main__":
    main()
