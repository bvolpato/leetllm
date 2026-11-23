#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["av==17.1.0"]
# ///
import runpy
import tempfile
import unittest
from pathlib import Path

tool = runpy.run_path(str(Path(__file__).with_name("restore-branded-opening.py")))
ffmpeg = tool["ffmpeg"]


class RestoreOpeningTest(unittest.TestCase):
    def test_packet_and_audio_continuity_across_four_second_join(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            body, intro, chime = [
                root / name for name in ("body.mp4", "intro.mp4", "chime.flac")
            ]
            vtt = root / "body.vtt"
            vtt.write_text("WEBVTT\n\n00:00:00.125 --> 00:00:01.250\nKeep this cue.\n")
            video = ["-c:v", "libx264", "-bf", "0", "-pix_fmt", "yuv420p"]
            ffmpeg(
                "-f",
                "lavfi",
                "-i",
                "testsrc2=size=160x90:rate=30:duration=4",
                *video,
                intro,
            )
            ffmpeg(
                "-f",
                "lavfi",
                "-i",
                "sine=frequency=440:sample_rate=48000:duration=2",
                "-af",
                "apad=whole_dur=4",
                "-ac",
                "2",
                chime,
            )
            ffmpeg(
                "-f",
                "lavfi",
                "-i",
                "testsrc2=size=160x90:rate=30:duration=2",
                "-f",
                "lavfi",
                "-i",
                "sine=frequency=880:sample_rate=48000:duration=2",
                "-i",
                vtt,
                "-map",
                "0:v",
                "-map",
                "1:a",
                "-map",
                "2:s",
                *video,
                "-ac",
                "2",
                "-c:a",
                "aac",
                "-aac_pns",
                "0",
                "-b:a",
                "192k",
                "-c:s",
                "mov_text",
                body,
            )
            target = root / "restored.mp4"
            tool["write_movie"](body, intro, chime, target, root)
            proof = tool["inspect_packets"](body, intro, target)
            self.assertEqual(
                (proof["introVideoPackets"], proof["bodyVideoPackets"]), (120, 60)
            )
            self.assertEqual(proof["bodySubtitlePackets"], 1)
            self.assertGreater(
                tool["verify_audio"](body, chime, target)["chimeReferenceSnrDb"], 35
            )
            output_vtt = root / "restored.vtt"
            tool["shifted_vtt"](vtt, output_vtt)
            self.assertIn(
                "00:00:04.125 --> 00:00:05.250\nKeep this cue.", output_vtt.read_text()
            )


if __name__ == "__main__":
    unittest.main()
