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
"""Record a stream of speech takes with one Kokoro model."""
import contextlib
import fcntl
import importlib.util
import json
import os
from pathlib import Path
from queue import Queue
import sys
from threading import Thread
import time


def read_requests(queue):
    for line in sys.stdin:
        queue.put(line)
    # Release the model and slot even if the renderer died during a take.
    os._exit(0)


@contextlib.contextmanager
def slot(adapter):
    count = int(os.environ.get("LEETLLM_KOKORO_SLOTS", "2"))
    if not 1 <= count <= 16:
        raise ValueError("LEETLLM_KOKORO_SLOTS must be between 1 and 16")
    if count == 2:
        with adapter.synthesis_slot():
            yield
        return
    root = Path.home() / ".cache" / "leetllm" / "speech-slots"
    root.mkdir(parents=True, exist_ok=True)
    while True:
        adapter.require_synthesis_enabled()
        for number in range(count):
            with (root / f"kokoro-{number}.lock").open("a+") as handle:
                try:
                    fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
                except BlockingIOError:
                    continue
                yield
                return
        time.sleep(3)


def acquire_mps():
    root = Path.home() / ".cache" / "leetllm" / "speech-slots"
    root.mkdir(parents=True, exist_ok=True)
    handle = (root / "kokoro-mps.lock").open("a+")
    try:
        fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        handle.close()
        return None
    return handle


def serve(adapter, requests, protocol, make_pipeline, try_mps, try_cuda=False):
    pipeline = None
    lease = None
    device = "cuda" if try_cuda else "cpu"
    while True:
        request = json.loads(requests.get())
        adapter.require_synthesis_enabled()
        try:
            text = Path(request["input"]).read_text().strip()
            args = (text, Path(request["output"]), Path(request["boundaries"]),
                    request["voice"], request["rate"])
            while True:
                try:
                    if try_mps and lease is None and device != "cuda":
                        lease = acquire_mps()
                        if lease is not None:
                            device = "mps"
                            if pipeline is not None:
                                pipeline.model.to(device)
                    if pipeline is None:
                        pipeline = make_pipeline(lang_code=adapter.LANGUAGE, repo_id=adapter.MODEL, device=device)
                    adapter.write_take(pipeline, *args)
                    break
                except RuntimeError:
                    if device == "cpu":
                        raise
                    if device == "cuda":
                        try_cuda = False
                    else:
                        try_mps = False
                    device = "cpu"
                    try:
                        if pipeline is not None:
                            pipeline.model.to(device)
                    except RuntimeError:
                        pipeline = None
                    finally:
                        if lease is not None:
                            lease.close()
                            lease = None
            response = {"ok": True, "device": device}
        except Exception as error:
            response = {"ok": False, "error": f"{type(error).__name__}: {error}"}
        print(json.dumps(response), file=protocol, flush=True)


def main():
    protocol = sys.stdout
    # Keep library output away from the JSON response stream.
    sys.stdout = sys.stderr
    path = Path(sys.argv[1])
    spec = importlib.util.spec_from_file_location("course_kokoro", path)
    adapter = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(adapter)
    if os.environ.get("LEETLLM_KOKORO_PRIORITY") != "normal":
        os.nice(10)
    requests = Queue()
    Thread(target=read_requests, args=(requests,), daemon=True).start()
    with slot(adapter):
        import torch
        from kokoro import KPipeline

        torch.set_num_threads(1)
        torch.set_num_interop_threads(1)
        requested_device = os.environ.get("LEETLLM_KOKORO_DEVICE", "auto").lower()
        cuda_mod = getattr(torch, "cuda", None)
        cuda_available = bool(cuda_mod and cuda_mod.is_available())
        mps_mod = getattr(getattr(torch, "backends", None), "mps", None)
        mps_available = bool(mps_mod and mps_mod.is_available())
        try_cuda = requested_device in ("cuda", "auto") and cuda_available
        try_mps = requested_device == "mps" and mps_available
        serve(adapter, requests, protocol, KPipeline, try_mps, try_cuda=try_cuda)


if __name__ == "__main__":
    main()
