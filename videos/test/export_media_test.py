#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Check media export fidelity and preserve an existing archive after failure."""

import hashlib
import json
import runpy
import subprocess
import sys
import tempfile
import unittest
import zipfile
from fractions import Fraction
from pathlib import Path

EXPORTER = Path(__file__).resolve().parents[1] / "export-media.py"
export_media = runpy.run_path(str(EXPORTER))["export_media"]


def probe(movie, *options):
    return json.loads(subprocess.check_output(["ffprobe", "-v", "error", *options, "-of", "json", movie]))


class MediaExportTests(unittest.TestCase):
    def make_review(self, path, *, damaged=False, payloads=None, **properties):
        if payloads is None:
            payloads = {f"example.{suffix}": suffix.encode() for suffix in ("mp4", "srt", "vtt", "chapters.txt", "script.md")}
        receipt = {
            "id": "example", "title": "An example", "source": "example/content.md", "sourceSha256": "article",
            "fingerprint": "renderer", "sha256": hashlib.sha256(payloads["example.mp4"]).hexdigest(),
            "bytes": len(payloads["example.mp4"]), "duration": 1, "width": 1920, "height": 1080,
            "fps": "30/1", "videoCodec": "h264", "audioCodec": "aac", "provider": "edge", "voice": "Andrew",
            "rate": "+0%", "scenes": 1, "spokenWords": 1, "fullDecode": "passed", "frameAudit": {"passed": True},
            "artifactSha256": {name: hashlib.sha256(data).hexdigest() for name, data in payloads.items()},
            **properties,
        }
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("manifest.json", json.dumps([receipt]))
            for name, data in payloads.items():
                archive.writestr(f"example/{name}", b"changed captions" if damaged and name.endswith(".srt") else data)
            archive.writestr("example/review.png", b"large review image")
        return payloads

    def test_exports_exact_media_and_portable_manifest(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, output = root / "review.zip", root / "media.zip"
            payloads = self.make_review(source)
            self.assertEqual(export_media(source, output), output)
            with zipfile.ZipFile(output) as archive:
                self.assertEqual(set(archive.namelist()), {"manifest.json", *(f"example/{name}" for name in payloads)})
                for name, data in payloads.items():
                    self.assertEqual(archive.read(f"example/{name}"), data)
                self.assertEqual(archive.getinfo("example/example.mp4").compress_type, zipfile.ZIP_STORED)
                manifest = json.loads(archive.read("manifest.json"))[0]
                self.assertEqual(manifest["file"], "example/example.mp4")
                self.assertEqual(manifest["files"]["srt"]["sha256"], hashlib.sha256(b"srt").hexdigest())

    def test_rejects_changed_caption_and_keeps_previous_archive(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, output = root / "review.zip", root / "media.zip"
            self.make_review(source, damaged=True)
            output.write_bytes(b"previous delivery")
            with self.assertRaisesRegex(ValueError, "Delivery checksum mismatch: example/example.srt"):
                export_media(source, output)
            self.assertEqual(output.read_bytes(), b"previous delivery")
            self.assertEqual(sorted(path.name for path in root.iterdir()), ["media.zip", "review.zip"])

    def make_movie(self, root, seconds=3):
        metadata = root / "chapters.ffmeta"
        metadata.write_text(";FFMETADATA1\ntitle=An example\nartist=LeetLLM\n"
                            "[CHAPTER]\nTIMEBASE=1/1000\nSTART=0\nEND=1000\ntitle=Intro\n"
                            f"[CHAPTER]\nTIMEBASE=1/1000\nSTART=1000\nEND={seconds * 1000}\ntitle=Déjà vu\n", encoding="utf-8")
        movie = root / "original.mp4"
        subprocess.run([
            "ffmpeg", "-v", "error", "-nostdin", "-f", "lavfi", "-i", f"testsrc2=size=96x64:rate=30:duration={seconds}",
            "-f", "lavfi", "-i", f"sine=frequency=440:sample_rate=48000:duration={seconds + 0.04}", "-i", metadata,
            "-map", "0:v:0", "-map", "1:a:0", "-map_metadata", "2", "-map_chapters", "2",
            "-c:v", "libx264", "-threads:v", "1", "-bf", "2", "-c:a", "aac", "-movflags", "+faststart", movie,
        ], check=True)
        return movie

    def movie_bundle(self, root, movie, *, text="Déjà vu.", damaged=False, timeline=True):
        cues = [{"start": 0.1245, "end": 1.155, "text": text}, {"start": 1.75, "end": 2.453, "text": "Count two."}]
        srt = f"1\n00:00:00,125 --> 00:00:01,155\n{text}\n\n2\n00:00:01,750 --> 00:00:02,453\nCount two.\n"
        vtt = f"WEBVTT\n\n00:00:00.125 --> 00:00:01.155\n{text}\n\n00:00:01.750 --> 00:00:02.453\nCount two.\n"
        payloads = {
            "example.mp4": movie.read_bytes(), "example.srt": srt.encode(), "example.vtt": vtt.encode(),
            "example.chapters.txt": "00:00:00 Intro\n00:00:01 Déjà vu\n".encode(), "example.script.md": b"# An example\n",
        }
        if timeline:
            payloads["timeline.json"] = json.dumps({"id": "example", "captions": cues}).encode()
        duration = float(probe(movie, "-show_format")["format"]["duration"])
        return self.make_review(root / "review.zip", damaged=damaged, duration=duration, width=96, height=64, payloads=payloads)

    def cli(self, root, *options):
        return subprocess.run([sys.executable, EXPORTER, "--input", root / "review.zip",
                               "--output", root / "media.zip", *options], cwd=root, capture_output=True, text=True)

    def test_cli_embeds_measured_text_and_copies_media_and_chapters(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            movie = self.make_movie(root, seconds=101)
            files = self.movie_bundle(root, movie)
            source = (root / "review.zip").read_bytes()
            default = self.cli(root)
            self.assertEqual(default.returncode, 0, default.stderr)
            with zipfile.ZipFile(root / "media.zip") as archive:
                self.assertEqual(archive.read("example/example.mp4"), files["example.mp4"])

            result = self.cli(root, "--embed-english-subtitles")
            self.assertEqual(result.returncode, 0, result.stderr)
            output = root / "captioned.mp4"
            with zipfile.ZipFile(root / "media.zip") as archive:
                self.assertEqual(set(archive.namelist()), {"manifest.json", *("example/" + k for k in files if k != "timeline.json")})
                entry, = json.loads(archive.read("manifest.json"))
                output.write_bytes(archive.read(entry["file"]))
                self.assertEqual(entry["sha256"], hashlib.sha256(output.read_bytes()).hexdigest())
                self.assertNotEqual(entry["sha256"], hashlib.sha256(movie.read_bytes()).hexdigest())
                self.assertEqual(entry["bytes"], output.stat().st_size)
                self.assertEqual(entry["subtitleTrack"], {"codec": "mov_text", "language": "eng",
                                                          "sourceMovieSha256": hashlib.sha256(movie.read_bytes()).hexdigest()})
                for suffix, record in entry["files"].items():
                    data = archive.read(record["path"])
                    self.assertEqual(record["sha256"], hashlib.sha256(data).hexdigest())
                    self.assertEqual(record["bytes"], len(data))
                    if suffix != "mp4":
                        self.assertEqual(data, files[f"example.{suffix}"])
            self.assertEqual((root / "review.zip").read_bytes(), source)
            streams = probe(output, "-show_streams")["streams"]
            subtitle, = [s for s in streams if s["codec_type"] == "subtitle"]
            self.assertEqual((subtitle["codec_name"], subtitle["codec_tag_string"], subtitle["tags"]["language"],
                              subtitle["disposition"]["forced"]), ("mov_text", "tx3g", "eng", 0))
            extracted = subprocess.check_output(["ffmpeg", "-v", "error", "-i", output, "-map", "0:s:0", "-f", "srt", "-"])
            self.assertEqual(extracted.rstrip(), files["example.srt"].rstrip())
            for selector in ("v:0", "a:0"):
                options = ("-select_streams", selector, "-show_entries",
                           "packet=pts,dts,duration,flags,size,data_hash:packet_side_data:stream=time_base,extradata_hash",
                           "-show_data_hash", "sha256")
                before = probe(movie, *options)
                self.assertGreater(len(before["packets"]), 1)
                self.assertEqual(probe(output, *options), before)
            for file in (movie, output):
                chapters = probe(file, "-show_chapters")["chapters"]
                track, = probe(file, "-select_streams", "d", "-show_streams")["streams"]
                packets = probe(file, "-ignore_chapters", "1", "-select_streams", str(track["index"]), "-show_packets")["packets"]
                samples = []
                with file.open("rb") as media:
                    for chapter, packet in zip(chapters, packets, strict=True):
                        media.seek(int(packet["pos"]))
                        size = int.from_bytes(media.read(2), "big")
                        self.assertEqual(media.read(size).decode(), chapter["tags"]["title"])
                        base = Fraction(track["time_base"])
                        samples.append((packet["pts"] * base, (packet["pts"] + packet["duration"]) * base, chapter["tags"]["title"]))
                self.assertEqual(samples, [(0, 1, "Intro"), (1, 101, "Déjà vu")])

    def test_legacy_sidecars_work_without_a_timeline(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.movie_bundle(root, self.make_movie(root), timeline=False)
            result = self.cli(root, "--embed-english-subtitles")
            self.assertEqual(result.returncode, 0, result.stderr)

    def test_rejects_disagreement_between_verified_caption_files(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            files = self.movie_bundle(root, self.make_movie(root))
            for name, message in (("example.vtt", "WebVTT cues differ"), ("timeline.json", "measured timeline")):
                with self.subTest(name=name):
                    changed = files[name].replace(b"Count two.", b"Count three.")
                    self.make_review(root / "review.zip", payloads={**files, name: changed})
                    result = self.cli(root, "--embed-english-subtitles")
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(message, result.stderr)
                    self.assertFalse((root / "media.zip").exists())

    def test_rejects_broken_chapter_sample_with_readable_chapter_metadata(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            movie = self.make_movie(root)
            track, = probe(movie, "-select_streams", "d", "-show_streams")["streams"]
            packets = probe(movie, "-ignore_chapters", "1", "-select_streams", str(track["index"]), "-show_packets")["packets"]
            with movie.open("r+b") as file:
                file.seek(int(packets[0]["pos"]))
                file.write(b"\xff\xff")
            self.assertEqual(probe(movie, "-show_chapters")["chapters"][0]["tags"]["title"], "Intro")
            self.movie_bundle(root, movie)
            result = self.cli(root, "--embed-english-subtitles")
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("chapter", result.stderr.lower())
            self.assertFalse((root / "media.zip").exists())

    def test_cli_failure_preserves_both_archives_and_cleans_scratch_files(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            movie = self.make_movie(root)
            output = root / "media.zip"
            output.write_bytes(b"prior export")
            for text, damaged, message in [("Stale.", True, "checksum mismatch"), ("Use <i>light</i>.", False, "caption text")]:
                with self.subTest(message=message):
                    self.movie_bundle(root, movie, text=text, damaged=damaged)
                    source = (root / "review.zip").read_bytes()
                    names = set(root.iterdir())
                    result = self.cli(root, "--embed-english-subtitles")
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(message, result.stderr.lower())
                    self.assertEqual(output.read_bytes(), b"prior export")
                    self.assertEqual((root / "review.zip").read_bytes(), source)
                    self.assertEqual(set(root.iterdir()), names)


if __name__ == "__main__":
    unittest.main()
