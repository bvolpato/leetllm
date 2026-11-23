#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Extract a reviewed Embeddings narration edit from the published recording."""

import argparse
import hashlib
import json
import os
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
for flag in ["text-file", "output", "boundaries", "voice", "rate"]:
    parser.add_argument("--" + flag, required=True)
args = parser.parse_args()
recording = Path(os.environ["EMBEDDINGS_BASELINE_MP4"])
edits = json.loads(Path(__file__).with_name("recording-edits.json").read_text())
with recording.open("rb") as source:
    if hashlib.file_digest(source, "sha256").hexdigest() != edits["recordingSha256"]:
        raise ValueError("The supplied recording differs from the reviewed Embeddings edition.")
text = Path(args.text_file).read_text()
beat = edits["beats"][hashlib.sha256(text.encode()).hexdigest()]
inputs = []
filters = []
for index, (start, end) in enumerate(beat["ranges"]):
    inputs.extend(["-ss", str(start), "-t", str(round(end - start, 3)), "-i", str(recording)])
    filters.append(f"[{index}:a]asetpts=PTS-STARTPTS[a{index}]")
tracks = "".join(f"[a{i}]" for i in range(len(filters)))
filters.append(f"{tracks}concat=n={len(filters)}:v=0:a=1[out]")
subprocess.run(
    ["ffmpeg", "-nostdin", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filters),
     "-map", "[out]", "-c:a", "libmp3lame", "-q:a", "2", args.output],
    check=True,
)
Path(args.boundaries).write_text(json.dumps({"words": beat["words"]}))
