#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["edge-tts==7.3.1"]
# [tool.uv]
# exclude-newer = "P7D"
# ///
"""Protect healthy long narration from the shorter stream-silence deadline."""

import asyncio
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("tts", Path(__file__).resolve().parents[1] / "tts.py")
tts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tts)


class NarrationDeadlineTest(unittest.TestCase):
    def test_healthy_sixty_one_second_synthesis_commits_audio_and_word_times(self):
        async def synthesize(text, voice, rate, audio):
            audio.write_bytes(b"complete measured audio")
            return [{"text": "narration", "start": 0, "end": 41.75}]

        async def wait_for(coroutine, *, timeout):
            # The observed102word stream completed in61seconds with no45second silence.
            if timeout < 61:
                coroutine.close()
                raise asyncio.TimeoutError("healthy stream exceeds total deadline")
            return await coroutine

        with tempfile.TemporaryDirectory() as folder:
            audio = Path(folder) / "narration.mp3"
            boundaries = Path(folder) / "narration.json"
            with patch.object(tts, "_synthesize", synthesize), patch.object(tts.asyncio, "wait_for", wait_for), patch.object(tts, "MAX_ATTEMPTS", 1):
                tts.generate("A complete worked explanation.", audio, boundaries_path=boundaries)
            self.assertEqual(audio.read_bytes(), b"complete measured audio")
            self.assertEqual(json.loads(boundaries.read_text())["words"][-1]["end"], 41.75)


if __name__ == "__main__":
    unittest.main()
