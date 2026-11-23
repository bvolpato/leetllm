#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = [
#   "kokoro==0.9.4",
#   "soundfile",
#   "numpy",
#   "en-core-web-sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl",
# ]
# ///
"""Prepare one beat or a whole stage lesson with Kokoro's measured token boundaries."""
import argparse
from contextlib import contextmanager
import fcntl
from hashlib import sha256
from importlib.metadata import version
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
import unicodedata

os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

for name in ("OMP_NUM_THREADS", "MKL_NUM_THREADS", "OPENBLAS_NUM_THREADS", "VECLIB_MAXIMUM_THREADS", "NUMEXPR_NUM_THREADS"):
    os.environ[name] = "1"


def require_synthesis_enabled():
    marker = Path(__file__).resolve().parents[3] / "REVIEW_ONLY"
    if marker.exists():
        raise SystemExit(f"Synthesis stopped by {marker}")


@contextmanager
def synthesis_slot():
    """Reserve one model on this host before loading the numerical libraries."""
    lock_root = Path.home() / ".cache" / "leetllm" / "speech-slots"
    lock_root.mkdir(parents=True, exist_ok=True)
    while True:
        require_synthesis_enabled()
        for number in range(2):
            handle = (lock_root / f"kokoro-{number}.lock").open("a+")
            try:
                fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                handle.close()
                continue
            try:
                require_synthesis_enabled()
                yield
            finally:
                handle.close()
            return
        time.sleep(3)


MODEL = "hexgrad/Kokoro-82M"
LANGUAGE = "a"
RATE = 24000


def letters(value):
    return "".join(c for c in unicodedata.normalize("NFKC", value).casefold() if c.isalnum())


def align(text, tokens):
    """Join the original printed words to Kokoro tokens by matching character spans."""
    timed = [(letters(w), start, end) for w, start, end in tokens if letters(w)]
    authored = re.findall(r"\S+", text)
    if "".join(letters(w) for w in authored) != "".join(w for w, _, _ in timed):
        raise ValueError(f"Kokoro token coverage differs from authored speech: {text!r}; tokens={tokens!r}")
    words = []
    i = offset = used = 0
    for word in authored:
        size = len(letters(word))
        if not size:
            if words:
                words[-1]["text"] += " " + word
            continue
        start = timed[i][1]
        target = used + size
        while offset + len(timed[i][0]) < target:
            offset += len(timed[i][0])
            i += 1
        end = timed[i][2]
        words.append({"text": word, "start": round(start, 3), "end": round(end, 3)})
        used = target
        if used == offset + len(timed[i][0]):
            offset = used
            i += 1
    return words


def write_take(pipeline, text, output, boundary, voice, rate):
    import numpy as np
    import soundfile

    speed = 1 + float(rate.rstrip("%")) / 100
    chunks, tokens, offset = [], [], 0
    for result in pipeline(text, voice=voice, speed=speed, split_pattern=r"(?<=[.?!])\s+"):
        audio = np.asarray(result.audio, dtype=np.float32)
        for token in result.tokens or []:
            if token.start_ts is not None and token.end_ts is not None:
                tokens.append((token.text, offset / RATE + token.start_ts, offset / RATE + token.end_ts))
        breath = np.zeros(round(0.17 * RATE), dtype=np.float32)
        chunks.extend((audio, breath))
        offset += len(audio) + len(breath)
    words = align(text, tokens)
    if not words:
        raise ValueError("No timed words")
    with tempfile.TemporaryDirectory(dir=output.parent) as folder:
        folder = Path(folder)
        wav, mp3, timing = folder / "take.wav", folder / "take.mp3", folder / "take.json"
        soundfile.write(wav, np.concatenate(chunks[:-1]), RATE, subtype="PCM_16")
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(wav), "-c:a", "libmp3lame", "-b:a", "96k", str(mp3)], check=True)
        timing.write_text(json.dumps({"provider": "kokoro", "model": MODEL, "voice": voice, "rate": rate,
                                      "engineVersion": version("kokoro"), "langCode": LANGUAGE,
                                      "sampleRate": RATE, "speed": speed, "words": words}, ensure_ascii=False))
        os.replace(timing, boundary)
        os.replace(mp3, output)


def jobs(args):
    if args.text_file:
        yield args.text_file.read_text().strip(), args.output, args.boundaries
        return
    videos = Path(__file__).resolve().parents[1]
    program = """
import {parse} from 'yaml';
import {readFileSync} from 'node:fs';
let lesson = parse(readFileSync(process.argv[1],'utf8'));
console.log(JSON.stringify(lesson.scenes.flatMap(s=>s.beats.map(b=>b.say))));
"""
    script = videos / "stage-lessons" / args.lesson / "lesson.yaml"
    if not script.is_file():
        script = script.parent.with_suffix(".lesson.yaml")
    beats = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", program, str(script)], cwd=videos))
    cache = args.output_root / ".audio-cache"
    cache.mkdir(parents=True, exist_ok=True)
    adapter_hash = sha256(Path(__file__).read_bytes()).hexdigest()
    for text in beats[:args.limit]:
        spec = dict(text=text, voice=args.voice, rate=args.rate, provider="kokoro", adapterHash=adapter_hash)
        key = sha256(json.dumps(spec, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()
        (cache / f"{key}.txt").write_text(text)
        yield text, cache / f"{key}.mp3", cache / f"{key}.json"


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--lesson")
    mode.add_argument("--text-file", type=Path)
    parser.add_argument("--output-root", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--boundaries", type=Path)
    parser.add_argument("--voice", required=True, help="Kokoro voice for the recording")
    parser.add_argument("--rate", default="+0%")
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()
    require_synthesis_enabled()
    os.nice(10)
    with synthesis_slot():
        record(args)


def record(args):
    import torch
    from kokoro import KPipeline

    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)
    pipeline = None
    for index, (text, output, boundary) in enumerate(jobs(args), 1):
        if args.lesson and output.is_file() and boundary.is_file() and output.stat().st_size and json.loads(boundary.read_text()).get("words"):
            continue
        require_synthesis_enabled()
        if pipeline is None:
            pipeline = KPipeline(lang_code=LANGUAGE, repo_id=MODEL, device="cpu")
        require_synthesis_enabled()
        write_take(pipeline, text, output, boundary, args.voice, args.rate)
        print(f"{args.lesson or 'speech'}: recorded beat {index}", flush=True)


if __name__ == "__main__":
    main()
