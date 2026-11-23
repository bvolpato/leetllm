#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.15"
# dependencies = ["pocketsphinx==5.1.1", "g2p-en==2.1.0", "pyyaml==6.0.3", "num2words==0.5.14"]
# ///
"""Align the entire exact published read to its waveform and prepare the renderer's beat cache."""
import argparse
from functools import cache
import hashlib
import html
import json
import os
from pathlib import Path
import sys

if __name__ == "__main__":
    campaign = Path(__file__).resolve().parents[3]
    if "--campaign" in sys.argv:
        campaign = Path(sys.argv[sys.argv.index("--campaign") + 1]).resolve()
    if (campaign / "REVIEW_ONLY").exists():
        raise SystemExit("The course campaign is in review-only mode. Audio alignment is paused.")
import re
import subprocess
import tempfile
import unicodedata

os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"

from g2p_en import G2p
from num2words import num2words
from pocketsphinx import Decoder
import yaml

PROVIDER = "baseline-acoustic-alignment"
VOICE = "published-recording"
RATE = "+0%"
TOKEN = re.compile(r"[^\W_]+(?:['’][^\W_]+)*", re.UNICODE)
SAMPLE_RATE = 16000


def sha(path):
    with path.open("rb") as file:
        return hashlib.file_digest(file, "sha256").hexdigest()


def tokens(text):
    return TOKEN.findall(unicodedata.normalize("NFKC", html.unescape(text)))


def canonical(text):
    return text.lower().replace("’", "'")


def seconds(stamp):
    hours, minutes, rest = stamp.split(":")
    return int(hours) * 3600 + int(minutes) * 60 + float(rest)


def captions(vtt):
    result = []
    for block in re.split(r"\n\s*\n", vtt.read_text().strip()):
        lines = block.splitlines()
        for i, line in enumerate(lines):
            if " --> " in line:
                start, end = map(seconds, line.split(" --> "))
                result.append((start, end, tokens(" ".join(lines[i + 1:]))))
                break
    return result


@cache
def g2p():
    return G2p()


def spoken_forms(token):
    word = canonical(token)
    if word.isdecimal():
        return re.findall("[a-z]+", num2words(int(word)))
    word = unicodedata.normalize("NFKD", word).encode("ascii", "ignore").decode()
    parts = re.findall(r"[a-z]+(?:'[a-z]+)*|\d+", word)
    if not parts:
        raise ValueError(f"Unknown pronunciation for {token!r}")
    return [item for part in parts for item in (spoken_forms(part) if part.isdigit() else [part])]


def pronunciation(decoder, word, literal):
    if decoder.lookup_word(word):
        return
    if literal.isupper() and 1 < len(literal) <= 5 and word not in {"cuda", "json", "umap", "numpy"}:
        phones = " ".join(decoder.lookup_word(c) for c in word if c.isalpha())
    else:
        phones = " ".join(re.sub(r"\d", "", phone) for phone in g2p().predict(word))
    if not phones or "<" in phones:
        raise ValueError(f"Could not form an acoustic dictionary entry for {word!r}: {phones}")
    decoder.add_word(word, phones, False)


def align(decoder, pcm, cue, clip_start, clip_end):
    start, end, words = cue
    speech = []
    owners = []
    for i, word in enumerate(words):
        for form in spoken_forms(word):
            pronunciation(decoder, form, word)
            speech.append(form)
            owners.append(i)
    decoder.set_align_text(" ".join(speech))
    decoder.start_utt()
    decoder.process_raw(pcm[round(clip_start*SAMPLE_RATE)*2:round(clip_end*SAMPLE_RATE)*2], False, True)
    decoder.end_utt()
    aligned = [(segment.word, segment.start_frame, segment.end_frame) for segment in (decoder.seg() or []) if not segment.word.startswith("<")]
    names = [re.sub(r"\(\d+\)$", "", word) for word, _, _ in aligned]
    if names != speech:
        raise ValueError(f"Acoustic alignment failed at {start:.2f}s: found {names[:8]}, expected {speech[:8]} ({len(names)}/{len(speech)})")
    result = []
    for i, (_, first, last) in zip(owners, aligned):
        a = round(clip_start + first / 100, 3)
        b = round(min(clip_end, clip_start + (last + 1) / 100), 3)
        if len(result) == i:
            result.append({"text": words[i], "start": a, "end": b})
        else:
            result[i]["end"] = b
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("lesson")
    parser.add_argument("--campaign", type=Path, help="Use a previous editorial campaign layout.")
    parser.add_argument("--input-dir", type=Path, help="Directory containing the lesson MP4, VTT, and input.json receipt.")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.input_dir is None and args.campaign is None:
        parser.error("Pass --input-dir with the reviewed baseline directory.")
    if args.output is None and args.campaign is None:
        parser.error("Pass --output with the lesson output directory.")
    folder = args.input_dir or args.campaign.resolve().parent / "course-editorial-20261110" / "inputs" / args.lesson
    source = folder / f"{args.lesson}.mp4"
    vtt = folder / f"{args.lesson}.vtt"
    data = json.loads((folder / "input.json").read_text())
    movie_hash = sha(source)
    if movie_hash != data["sourceSha256"]:
        raise ValueError("Movie differs from the inventoried recording")
    script = Path(__file__).resolve().parents[1] / "stage-lessons" / args.lesson / "lesson.yaml"
    if not script.is_file():
        script = script.parent.with_suffix(".lesson.yaml")
    lesson = yaml.safe_load(script.read_text())
    beats = [(s["id"], i, b["say"]) for s in lesson["scenes"] for i, b in enumerate(s["beats"])]
    cues = captions(vtt)
    original = [canonical(w) for _, _, words in cues for w in words]
    expected = [canonical(w) for _, _, say in beats for w in tokens(say)]
    if expected != original:
        raise ValueError(f"{args.lesson}: recording transcript differs from authored speech. Use one new read for this film.")
    out = args.output or args.campaign.resolve() / "renders" / args.lesson
    cache_dir = out / ".audio-cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    tag = sha(Path(__file__))
    ids = {"adapterSha256": tag, "movieSha256": movie_hash, "captionSha256": sha(vtt), "lessonSha256": sha(script)}
    provenance = out / "baseline-alignment.json"
    if provenance.is_file():
        previous = json.loads(provenance.read_text())
        if previous["inputs"] == ids and all(all((cache_dir / (row["key"] + ext)).is_file() for ext in (".json", ".mp3")) for row in previous["beats"]):
            print(f"{args.lesson}: {len(beats)} retained beat pairs", flush=True)
            return
    pcm = subprocess.check_output(["ffmpeg", "-nostdin", "-v", "error", "-threads", "1", "-i", str(source), "-map", "0:a:0", "-ac", "1", "-ar", str(SAMPLE_RATE), "-f", "s16le", "-"])
    length = len(pcm) / (2*SAMPLE_RATE)
    decoder = Decoder(loglevel="ERROR")
    timed = []
    for i, cue in enumerate(cues):
        start, end, _ = cue
        a = max(0, start-.16, (cues[i-1][1]+start)/2 if i else 0)
        b = min(length, end+.16, (end+cues[i+1][0])/2 if i+1<len(cues) else length)
        timed.extend(align(decoder, pcm, cue, a, b))
        if i % 15 == 0:
            print(f"{args.lesson}: aligned caption {i+1}/{len(cues)}", flush=True)
    rows = []
    pos = 0
    for scene, beat_index, say in beats:
        count = len(tokens(say))
        words = timed[pos:pos+count]
        first, last = words[0]["start"], words[-1]["end"]
        a = max(0, first-.18, (timed[pos-1]["end"]+first)/2 if pos else 0)
        pos += count
        b = min(length, last+.18, (timed[pos]["start"]+last)/2 if pos<len(timed) else length)
        if a > first or b < last:
            raise ValueError(f"{scene}/{beat_index}: overlapping word boundaries across beat cut")
        content = dict(text=say, voice=VOICE, rate=RATE, provider=PROVIDER, adapterHash=tag)
        key = hashlib.sha256(json.dumps(content, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()
        dest = cache_dir / key
        local = [{"text": text, "start": round(w["start"]-a, 3), "end": round(w["end"]-a, 3)} for text, w in zip(tokens(say), words)]
        with tempfile.TemporaryDirectory(dir=cache_dir) as tmp:
            mp3 = Path(tmp)/"audio.mp3"
            subprocess.run(["ffmpeg","-nostdin","-v","error","-ss",str(a),"-i",str(source),"-map","0:a:0","-t",str(b-a),"-c:a","libmp3lame","-b:a","128k","-threads","1",str(mp3)],check=True)
            timing = Path(tmp)/"timing.json"
            timing.write_text(json.dumps({"words": local,"sourceStart": a,"sourceEnd": b,**ids,"provider":PROVIDER,"voice":VOICE}))
            timing.replace(dest.with_suffix(".json"))
            mp3.replace(dest.with_suffix(".mp3"))
        dest.with_suffix(".txt").write_text(say)
        rows.append({"scene":scene,"beat":beat_index,"key":key,"start":a,"end":b})
    provenance.write_text(json.dumps({"lesson":args.lesson,"source":str(source),"inputs":ids,"timing":"PocketSphinx 5.1.1 English acoustic forced alignment of the recorded waveform. The original cue times bound the acoustic searches.","beats":rows},indent=2))
    print(f"{args.lesson}: prepared {len(rows)} measured beats in {cache_dir}")


if __name__ == "__main__":
    main()
