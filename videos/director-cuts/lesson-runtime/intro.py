#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Share one official course opener among concurrent director renders on this host."""
import fcntl
import hashlib
import os
from pathlib import Path
import subprocess
import sys
import tempfile


def official_intro(node, videos, cache):
    sources = (
        "render.mjs", "lib/brand.mjs", "lib/fonts.mjs", "lib/frame-audit.mjs",
        "assets/leetllm-mark.svg", "package-lock.json", "vizmatic-review.commit",
    )
    key = hashlib.sha256(Path(__file__).read_bytes())
    for name in sources:
        key.update(hashlib.sha256((videos / name).read_bytes()).digest())
    cache.mkdir(parents=True, exist_ok=True)
    movie = cache / (key.hexdigest() + ".mp4")
    digest = movie.with_suffix(".sha256")
    # The kernel releases the lock if a producer exits during the build.
    with (cache / "intro.lock").open("a+b") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if movie.is_file() and digest.is_file():
            if hashlib.sha256(movie.read_bytes()).hexdigest() == digest.read_text().strip():
                return movie
        with tempfile.TemporaryDirectory(prefix=".intro-", dir=cache) as temp:
            subprocess.run(
                [node, str(videos / "render.mjs"), "--intro-only", "--threads", "2", "--output", temp],
                cwd=videos, stdout=sys.stderr, check=True,
            )
            built = Path(temp) / "brand" / "leetllm-intro.mp4"
            checksum = Path(temp) / "checksum"
            checksum.write_text(hashlib.sha256(built.read_bytes()).hexdigest() + "\n")
            os.replace(built, movie)
            os.replace(checksum, digest)
    return movie


if __name__ == "__main__":
    videos = Path(__file__).resolve().parents[2]
    if os.environ.get("LEETLLM_SPEECH_CACHE"):
        default = Path(os.environ["LEETLLM_SPEECH_CACHE"]) / ".director-intros"
    else:
        default = Path(os.environ.get("XDG_CACHE_HOME") or Path.home() / ".cache") / "leetllm" / "director-intro"
    cache = Path(os.environ.get("LEETLLM_INTRO_CACHE") or default).resolve()
    print(official_intro(sys.argv[1], videos, cache))
