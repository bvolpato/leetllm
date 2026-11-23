"""Authenticate a cached brand picture and lossless chime against a released standalone intro."""

import hashlib
import json
import re
import subprocess
from fractions import Fraction
from pathlib import Path


def _sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def _track(file, selector):
    result = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            selector,
            "-show_streams",
            "-show_data_hash",
            "sha256",
            "-of",
            "json",
            file,
        ]
    )
    tracks = json.loads(result)["streams"]
    if len(tracks) != 1:
        raise ValueError(f"Expected one {selector} track in {file}")
    return tracks[0]


def _stream_hash(file, selector, *encoding):
    digest = subprocess.check_output(
        [
            "ffmpeg",
            "-nostdin",
            "-v",
            "error",
            "-i",
            file,
            "-map",
            selector,
            *encoding,
            "-f",
            "hash",
            "-hash",
            "sha256",
            "-",
        ],
        text=True,
    ).strip()
    if not re.fullmatch(r"SHA256=[0-9a-f]{64}", digest):
        raise ValueError(f"Cannot hash {selector} in {file}")
    return digest.split("=")[1]


def verify_brand(directory, stock_receipt, body_movie):
    directory = Path(directory)
    stock_receipt = Path(stock_receipt)
    receipt = json.loads(stock_receipt.read_text())
    branding = receipt.get("brandIntro")
    if (
        receipt.get("fullDecode") != "passed"
        or not receipt.get("frameAudit", {}).get("passed")
        or not branding
        or branding.get("duration") != 4
        or branding.get("frames") != 120
    ):
        raise ValueError("Stock film receipt does not verify a four-second brand intro")
    closure = receipt["sourceManifest"]["closure"]
    if not any(
        isinstance(asset, dict)
        and asset.get("path") == "videos/assets/leetllm-mark.svg"
        and asset["sha256"] == branding["logoSha256"]
        for asset in [*closure["assets"], *closure["files"]]
    ):
        raise ValueError("Brand mark differs from the stock film source manifest")
    expected = receipt["artifactSha256"]["leetllm-intro.mp4"]
    candidates = [
        file for file in directory.glob("leetllm-intro*.mp4") if _sha(file) == expected
    ]
    if len(candidates) != 1:
        raise ValueError(
            "Expected one cached standalone intro that matches the stock film receipt"
        )
    standalone = candidates[0]
    picture = directory / ("00-" + standalone.name)
    audio = picture.with_suffix(".flac")
    marker = picture.with_suffix(".render.json")
    audit = json.loads(marker.read_text())["audit"]
    if (
        audit["scene"] != "leetllm-intro"
        or audit["frames"] != 120
        or audit["fps"] != 30
        or audit.get("passed") is not True
        or audit["issueFrames"] != 0
    ):
        raise ValueError("Incomplete cached frame audit for the stock intro")
    video = _track(picture, "v:0")
    target = _track(body_movie, "v:0")
    config = (
        "codec_name",
        "codec_tag_string",
        "extradata_hash",
        "width",
        "height",
        "pix_fmt",
        "sample_aspect_ratio",
        "color_range",
        "color_space",
        "color_transfer",
        "color_primaries",
    )
    if (
        video["codec_name"] != "h264"
        or not video.get("extradata_hash")
        or any(video.get(k) != target.get(k) for k in config)
        or Fraction(video["avg_frame_rate"]) != 30
        or Fraction(target["r_frame_rate"]) != 30
        or int(video["nb_frames"]) != 120
        or int(video["duration_ts"]) * Fraction(video["time_base"]) != 4
    ):
        raise ValueError(
            "Stock picture configuration is incompatible with the course movie"
        )
    compressed_picture = _stream_hash(picture, "0:v:0", "-c:v", "copy")
    if compressed_picture != _stream_hash(standalone, "0:v:0", "-c:v", "copy"):
        raise ValueError("Cached brand picture differs from the released standalone")
    lossless = _track(audio, "a:0")
    if (
        lossless["codec_name"] != "flac"
        or lossless["sample_rate"] != "48000"
        or lossless["channels"] != 2
        or int(lossless["duration_ts"]) * Fraction(lossless["time_base"]) != 4
    ):
        raise ValueError("Expected a four-second stereo chime at 48 kHz")
    compressed_audio = _stream_hash(standalone, "0:a:0", "-c:a", "copy")
    if _stream_hash(audio, "0:a:0", "-c:a", "aac", "-b:a", "192k") != compressed_audio:
        raise ValueError(
            "Cached FLAC chime does not reproduce the approved standalone AAC packets"
        )
    files = {
        "picture": picture,
        "audio": audio,
        "standalone": standalone,
        "marker": marker,
        "stockReceipt": stock_receipt,
    }
    return {
        **{key: str(path.resolve()) for key, path in files.items()},
        "hashes": {key: _sha(path) for key, path in files.items()},
        "brandIntro": branding,
        "audit": audit,
        "pictureStreamSha256": compressed_picture,
        "standaloneAacSha256": compressed_audio,
    }
