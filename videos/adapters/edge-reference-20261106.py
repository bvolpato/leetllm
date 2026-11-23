#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "edge-tts==7.3.1",
# ]
# [tool.uv]
# exclude-newer = "P7D"
# ///
"""Generate an MP3 narration and optional Edge word-boundary metadata."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

import edge_tts

DEFAULT_VOICE = "en-US-AndrewNeural"
DEFAULT_RATE = "+0%"
TICKS_PER_SECOND = 10_000_000
REQUEST_TIMEOUT_SECONDS = 45
MAX_ATTEMPTS = 3
RETRY_BACKOFF_SECONDS = (0.5, 1.0)


def _temporary_path(destination: Path) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    descriptor, path = tempfile.mkstemp(
        prefix=f".{destination.name}.", suffix=".tmp", dir=destination.parent
    )
    os.close(descriptor)
    return Path(path)


def _word_boundary(message: dict[str, Any]) -> dict[str, Any]:
    offset_ticks = int(message["offset"])
    duration_ticks = int(message["duration"])
    return {
        "text": str(message["text"]),
        "start": offset_ticks / TICKS_PER_SECOND,
        "end": (offset_ticks + duration_ticks) / TICKS_PER_SECOND,
    }


async def _synthesize(
    text: str,
    voice: str,
    rate: str,
    audio_path: Path,
) -> list[dict[str, Any]]:
    boundaries: list[dict[str, Any]] = []
    communicate = edge_tts.Communicate(
        text,
        voice,
        rate=rate,
        boundary="WordBoundary",
        connect_timeout=10,
        receive_timeout=REQUEST_TIMEOUT_SECONDS,
    )

    with audio_path.open("wb") as audio_file:
        async for message in communicate.stream():
            if message["type"] == "audio":
                audio_file.write(message["data"])
            elif message["type"] == "WordBoundary":
                boundaries.append(_word_boundary(message))
        audio_file.flush()
        os.fsync(audio_file.fileno())

    return boundaries


def _write_json_temp(path: Path, value: dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8") as output:
        json.dump(value, output, ensure_ascii=False, indent=2)
        output.write("\n")
        output.flush()
        os.fsync(output.fileno())


def generate(
    text: str,
    output: Path,
    voice: str = DEFAULT_VOICE,
    rate: str = DEFAULT_RATE,
    boundaries_path: Path | None = None,
) -> None:
    if not text.strip():
        raise ValueError("Narration text is empty")

    output = output.expanduser().resolve()
    if boundaries_path is not None:
        boundaries_path = boundaries_path.expanduser().resolve()
        if boundaries_path == output:
            raise ValueError("MP3 output and boundaries JSON must be different files")

    last_error: Exception | None = None
    for attempt in range(MAX_ATTEMPTS):
        audio_temp = _temporary_path(output)
        boundaries_temp: Path | None = None
        try:
            boundaries = asyncio.run(
                asyncio.wait_for(
                    _synthesize(text, voice, rate, audio_temp),
                    timeout=REQUEST_TIMEOUT_SECONDS,
                )
            )
            if audio_temp.stat().st_size == 0:
                raise RuntimeError("Edge TTS returned an empty MP3")
            if boundaries_path is not None and not boundaries:
                raise RuntimeError("Edge TTS returned no word-boundary metadata")

            if boundaries_path is not None:
                boundaries_temp = _temporary_path(boundaries_path)
                payload = {
                    "provider": "edge-tts",
                    "voice": voice,
                    "rate": rate,
                    "words": boundaries,
                }
                _write_json_temp(boundaries_temp, payload)
                os.replace(boundaries_temp, boundaries_path)
                boundaries_temp = None

            # Replacing within the destination directory keeps the prior good file
            # intact until a complete, non-empty synthesis is ready.
            os.replace(audio_temp, output)
            print(
                f"Generated {output} ({output.stat().st_size} bytes, "
                f"{len(boundaries)} word boundaries)",
                file=sys.stderr,
            )
            return
        except Exception as exc:  # noqa: BLE001 - retry provider and stream failures uniformly.
            last_error = exc
            if attempt + 1 < MAX_ATTEMPTS:
                delay = RETRY_BACKOFF_SECONDS[attempt]
                print(
                    f"Edge TTS attempt {attempt + 1}/{MAX_ATTEMPTS} failed: {exc}; "
                    f"retrying in {delay:g}s",
                    file=sys.stderr,
                )
                time.sleep(delay)
        finally:
            audio_temp.unlink(missing_ok=True)
            if boundaries_temp is not None:
                boundaries_temp.unlink(missing_ok=True)

    raise RuntimeError(
        f"Edge TTS failed after {MAX_ATTEMPTS} attempts: {last_error}"
    ) from last_error


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--text-file", required=True, type=Path)
    parser.add_argument(
        "--output", required=True, type=Path, help="Destination MP3 file"
    )
    parser.add_argument("--voice", default=DEFAULT_VOICE)
    parser.add_argument("--rate", default=DEFAULT_RATE)
    parser.add_argument(
        "--boundaries", type=Path, help="Optional word-boundary JSON file"
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    try:
        text = args.text_file.read_text(encoding="utf-8")
        generate(text, args.output, args.voice, args.rate, args.boundaries)
    except (OSError, UnicodeError, ValueError, RuntimeError) as exc:
        print(f"tts.py: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
