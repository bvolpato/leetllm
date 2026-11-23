"""Regression checks for pinned film audio selection and caption timing."""
import runpy
import unittest
from pathlib import Path


edition = runpy.run_path(str(Path(__file__).with_name("selected-edition.py")))
Cue = edition["Cue"]


class SelectedNarration(unittest.TestCase):
    def test_old_narration_requires_exact_movie_and_profile(self):
        profile = dict(provider="edge", model="Microsoft Edge Read Aloud",
                       voice="en-US-AndrewNeural", rate="+0%")
        receipt = {**profile, "sha256": "movie-a"}
        compatible = edition["certified"]
        self.assertTrue(compatible(receipt, "movie-a", profile))
        self.assertFalse(compatible(receipt, "movie-b", profile))
        self.assertFalse(compatible({**receipt, "voice": "af_heart"}, "movie-a", profile))
        self.assertFalse(compatible(None, "movie-a", profile))

    def test_kokoro_receipts_and_word_timings_bind_the_exact_model_voice_and_rate(self):
        profile = dict(provider="kokoro", model="hexgrad/Kokoro-82M", voice="af_heart", rate="+12%",
                       engineVersion="0.9.4", langCode="a", sampleRate=24000, speed=1.12)
        receipt = {**profile, "masterSha256": "pinned"}
        self.assertTrue(edition["certified"](receipt, "pinned", profile))
        for record in ({**receipt, "voice": "en-US-AndrewNeural"}, {**receipt, "rate": "+0%"},
                       {**receipt, "speed": 1.0}, {**receipt, "engineVersion": "old"},
                       {**receipt, "provider": "kokoro-tts"}, {**receipt, "model": "another-model"},
                       {k: v for k, v in receipt.items() if k != "model"}):
            with self.subTest(record=record):
                self.assertFalse(edition["certified"](record, "pinned", profile))
                self.assertFalse(edition["same_narrator"](record, profile, word_timings=True))

    def test_score_only_for_verified_unscored_audio(self):
        profile = dict(provider="edge", model="Microsoft Edge Read Aloud", voice="old", rate="+0%")
        receipt = {**profile, "sha256": "pinned"}
        policy = {"palette": "open", "seed": 2}
        action = edition["bed_action"]
        self.assertEqual(action(receipt, "pinned", profile, policy), "score")
        self.assertEqual(action({**receipt, "audioBed": {**policy, "measurement": 7}},
                                "pinned", profile, policy), "keep")
        for bed in ({"palette": "other", "seed": 2}, {}, None):
            self.assertEqual(action({**receipt, "audioBed": bed}, "pinned", profile, policy), "redub")
        self.assertEqual(action({**receipt, "audioBed": policy}, "different", profile, policy), "redub")

    def test_generous_picture_hold_preserves_the_narrators_natural_pace(self):
        pcm = bytes(2 * edition["SAMPLE_RATE"])
        self.assertEqual(edition["fit_speech"](pcm, 2 * edition["SAMPLE_RATE"]), pcm)

    def test_caption_fragments_share_one_reading_up_to_the_next_pause(self):
        a = Cue(1, 2, "The available")
        b = Cue(2.02, 3, "space doubles.")
        c = Cue(5, 6, "Try again.")
        self.assertEqual(edition["phrasing"]([a, b, c]), [[a, b], [c]])
        ranges = edition["speech_ranges"]([a, b], [
            dict(text="The", start=.1, end=.2), dict(text="available", start=.21, end=.7),
            dict(text="space", start=.8, end=1), dict(text="doubles", start=1.1, end=1.5),
        ], 48000)
        self.assertEqual(ranges[0][1], round(.75 * edition["SAMPLE_RATE"]))
        self.assertEqual(ranges[0][1], ranges[1][0])
        with self.assertRaisesRegex(ValueError, "disagree"):
            edition["speech_ranges"]([c], [dict(text="Dropped", start=0, end=.5)], 24000)


if __name__ == "__main__":
    unittest.main()
