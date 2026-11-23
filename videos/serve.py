#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Serve local video lessons with byte ranges for native player seeking."""

import argparse
import functools
import os
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class VideoHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def send_head(self):
        self.remaining = None
        requested = self.headers.get("Range")
        path = Path(self.translate_path(self.path))
        if not requested or not path.is_file():
            return super().send_head()
        source = path.open("rb")
        info = os.fstat(source.fileno())
        size = info.st_size
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", requested.strip())
        try:
            if not match or not size or not any(match.groups()):
                raise ValueError("Invalid byte range")
            first, last = match.groups()
            if first:
                start = int(first)
                end = min(int(last), size - 1) if last else size - 1
            else:
                suffix = int(last)
                if suffix == 0:
                    raise ValueError("Empty suffix range")
                start, end = max(0, size - suffix), size - 1
            if start >= size or end < start:
                raise ValueError("Unsatisfiable byte range")
        except ValueError:
            source.close()
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(str(path)))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Last-Modified", self.date_time_string(info.st_mtime))
        self.end_headers()
        source.seek(start)
        self.remaining = end - start + 1
        return source

    def copyfile(self, source, outputfile):
        try:
            while self.remaining is None or self.remaining > 0:
                block = source.read(
                    65536 if self.remaining is None else min(65536, self.remaining)
                )
                if not block:
                    break
                outputfile.write(block)
                if self.remaining is not None:
                    self.remaining -= len(block)
        except (BrokenPipeError, ConnectionResetError):
            pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "build/videos",
    )
    parser.add_argument("--port", type=int, default=18461)
    args = parser.parse_args()
    directory = args.input.resolve()
    if not directory.is_dir():
        parser.error(f"Missing video directory: {directory}")
    handler = functools.partial(VideoHandler, directory=str(directory))
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"Watch: http://127.0.0.1:{server.server_port}/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
