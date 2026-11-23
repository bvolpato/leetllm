import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "restoration", Path(__file__).with_name("brand-restoration-evidence.py")
)
restoration = importlib.util.module_from_spec(spec)
spec.loader.exec_module(restoration)


class BrandTimelineTest(unittest.TestCase):
    def test_only_movie_absolute_times_move(self):
        cue = {"start": 0.5, "end": 1.0}
        scene = {
            "start": 0,
            "duration": 3,
            "beats": [{"start": 0.4}],
            "visualCues": [cue],
        }
        source = {
            "opening": "lesson",
            "intro": None,
            "fps": 30,
            "scenes": [scene],
            "captions": [dict(cue, text="One record")],
            "duration": 3,
        }
        corrected = restoration.shifted_timeline(source, {"duration": 4, "frames": 120})
        self.assertEqual(corrected["scenes"], [dict(scene, start=4)])
        self.assertEqual(
            corrected["captions"], [{"start": 4.5, "end": 5.0, "text": "One record"}]
        )
        self.assertEqual(corrected["duration"], 7)
        self.assertIsNone(source["intro"])
        self.assertEqual(source["captions"][0]["end"], 1)
        with self.assertRaisesRegex(ValueError, "begin with the lesson"):
            restoration.shifted_timeline(corrected, {"duration": 4, "frames": 120})


if __name__ == "__main__":
    unittest.main()
