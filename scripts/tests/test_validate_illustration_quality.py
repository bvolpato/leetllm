#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow"]
# ///

from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image, ImageDraw


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "validate_illustration_quality",
    SCRIPTS_DIR / "validate-illustration-quality.py",
)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load validate-illustration-quality.py")
validate_illustration_quality = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validate_illustration_quality)


class StaleGeneratedIllustrationCleanupTest(unittest.TestCase):
    def test_removes_only_orphaned_generated_pngs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            content_root = Path(directory)
            generated = content_root / "foundations" / "lesson" / "illustrations" / "_generated"
            generated.mkdir(parents=True)
            expected = generated / "current_dark.png"
            stale = generated / "old_dark.png"
            expected.write_bytes(b"current")
            stale.write_bytes(b"stale")

            with (
                patch.object(validate_illustration_quality, "CONTENT_DIR", content_root),
                patch.object(
                    validate_illustration_quality,
                    "generated_png_paths",
                    return_value={expected, stale},
                ),
            ):
                issues: list[str] = []
                removed = validate_illustration_quality.validate_no_stale_generated_pngs(
                    {expected},
                    issues,
                    clean_stale=True,
                )

            self.assertEqual(removed, 1)
            self.assertEqual(issues, [])
            self.assertTrue(expected.exists())
            self.assertFalse(stale.exists())

    def test_rejects_paths_outside_generated_illustrations(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            content_root = Path(directory)
            unsafe = content_root / "foundations" / "lesson" / "social_banner.png"
            unsafe.parent.mkdir(parents=True)
            unsafe.write_bytes(b"source asset")

            with (
                patch.object(validate_illustration_quality, "CONTENT_DIR", content_root),
                patch.object(
                    validate_illustration_quality,
                    "generated_png_paths",
                    return_value={unsafe},
                ),
                self.assertRaisesRegex(ValueError, "Refusing to remove non-generated"),
            ):
                validate_illustration_quality.validate_no_stale_generated_pngs(
                    set(),
                    [],
                    clean_stale=True,
                )

            self.assertTrue(unsafe.exists())


class PngValidationOptimizationTest(unittest.TestCase):
    def test_accepts_two_axis_crops_but_rejects_invalid_extents_and_clipped_edges(self) -> None:
        cases = [
            ((200, 160), False, None),
            ((360, 160), False, 'width 360 is outside expected cropped 2x range'),
            ((80, 160), False, 'width 80 is outside expected cropped 2x range'),
            ((200, 260), False, 'height 260 is outside expected cropped 2x range'),
            ((200, 160), True, 'rendered content touches canvas edge(s) left'),
        ]
        for dimensions, clipped, expected_error in cases:
            with self.subTest(dimensions=dimensions, clipped=clipped), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                source = root / 'illustrations' / 'example.tsx'
                generated = source.parent / '_generated'
                generated.mkdir(parents=True)
                for theme in ('dark', 'light'):
                    image = Image.new('RGBA', dimensions, (0, 0, 0, 0))
                    ImageDraw.Draw(image).rectangle((0 if clipped else 24, 24, dimensions[0]-25, dimensions[1]-25), fill='white')
                    image.save(generated / f'example_{theme}.png')
                with patch.object(validate_illustration_quality, 'REPO_ROOT', root):
                    issues: list[str] = []
                    validate_illustration_quality.validate_png_outputs(source, '', 160, 120, issues)
                if expected_error:
                    self.assertTrue(any(expected_error in issue for issue in issues), issues)
                else:
                    self.assertEqual(issues, [])

    def test_edge_density_preserves_color_and_alpha_thresholds(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            image_path = Path(directory) / "thresholds.png"
            image = Image.new("RGBA", (80, 60), (20, 40, 60, 255))

            for x in range(20, 24):
                image.putpixel((x, 2), (27, 40, 60, 128))
            for y in range(20, 23):
                image.putpixel((0, y), (20, 47, 60, 255))
            for x in range(30, 34):
                image.putpixel((x, 59), (26, 40, 60, 255))
            for y in range(30, 33):
                image.putpixel((79, y), (20, 40, 67, 127))

            image.save(image_path)

            self.assertEqual(
                validate_illustration_quality.detect_png_overflow(image_path),
                ["top", "left"],
            )
            self.assertEqual(
                validate_illustration_quality.detect_png_overflow(image_path, rgba=image),
                ["top", "left"],
            )

    def test_transparent_corner_uses_black_background(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            image_path = Path(directory) / "transparent-corner.png"
            image = Image.new("RGBA", (40, 40), (0, 0, 0, 255))
            image.putpixel((0, 0), (220, 180, 140, 0))
            image.putpixel((10, 0), (0, 0, 7, 128))
            image.putpixel((11, 0), (0, 0, 7, 128))
            image.save(image_path)

            self.assertEqual(
                validate_illustration_quality.detect_png_overflow(image_path),
                ["top"],
            )

    def test_validates_each_png_with_one_image_decode(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            source_path = Path(directory) / "illustrations" / "example.tsx"
            generated = source_path.parent / "_generated"
            generated.mkdir(parents=True)

            for theme in ("dark", "light"):
                image = Image.new("RGBA", (200, 200), (24, 24, 24, 255))
                ImageDraw.Draw(image).rectangle((40, 30, 159, 169), fill=(240, 240, 240, 255))
                image.save(generated / f"example_{theme}.png")

            with patch.object(
                validate_illustration_quality.Image,
                "open",
                wraps=Image.open,
            ) as image_open:
                issues: list[str] = []
                validate_illustration_quality.validate_png_outputs(
                    source_path,
                    "export const width = 100; export const height = 100;",
                    100,
                    100,
                    issues,
                )

            self.assertEqual(issues, [])
            self.assertEqual(image_open.call_count, 2)


class ScopedLayoutRiskTest(unittest.TestCase):
    def test_typed_parameters_do_not_hide_real_style_offsets(self) -> None:
        source = """
        const label = '📐';
        const chart = (
            top: number,
        ) => ({ top: 12, left: offset, right: number, bottom: -4 });
        """
        self.assertEqual(
            validate_illustration_quality.layout_risk_counts(source)["manual_edge_offset"],
            4,
        )

    def test_missing_baseline_fails_even_without_layout_risks(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            missing = Path(directory) / "layout-baseline.json"
            with patch.object(validate_illustration_quality, "LAYOUT_BASELINE_PATH", missing):
                issues: list[str] = []
                validate_illustration_quality.compare_layout_baseline({}, issues)

            self.assertEqual(len(issues), 1)
            self.assertIn("required layout baseline is missing", issues[0])

    def test_empty_baseline_still_rejects_new_layout_risks(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            baseline = Path(directory) / "layout-baseline.json"
            baseline.write_text('{"sources": {}}', encoding="utf-8")
            figure = "web/src/content/foundations/new/illustrations/figure.tsx"
            with patch.object(validate_illustration_quality, "LAYOUT_BASELINE_PATH", baseline):
                issues: list[str] = []
                validate_illustration_quality.compare_layout_baseline(
                    {figure: {"manual_edge_offset": 1}}, issues,
                )

            self.assertEqual(len(issues), 1)
            self.assertIn("new raw layout risk", issues[0])
            self.assertIn(figure, issues[0])

    def test_repo_relative_article_scope_compares_its_new_risks(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            article_root = root / "web" / "src" / "content" / "foundations" / "new-article"
            article_root.mkdir(parents=True)
            baseline_path = root / "layout-baseline.json"
            baseline_path.write_text(
                json.dumps({"sources": {"web/src/content/foundations/existing/illustrations/figure.tsx": {
                    "absolute_position": 1,
                    "manual_edge_offset": 0,
                    "raw_svg_coordinate": 0,
                    "rotated_border_arrow": 0,
                }}}),
                encoding="utf-8",
            )
            article_figure = "web/src/content/foundations/new-article/illustrations/figure.tsx"
            adjacent_article_figure = "web/src/content/foundations/new-article-copy/illustrations/figure.tsx"
            risks = {
                article_figure: {
                    "absolute_position": 1,
                    "manual_edge_offset": 0,
                    "raw_svg_coordinate": 0,
                    "rotated_border_arrow": 0,
                },
                adjacent_article_figure: {
                    "absolute_position": 2,
                    "manual_edge_offset": 0,
                    "raw_svg_coordinate": 0,
                    "rotated_border_arrow": 0,
                },
            }

            with (
                patch.object(validate_illustration_quality, "REPO_ROOT", root),
                patch.object(validate_illustration_quality, "LAYOUT_BASELINE_PATH", baseline_path),
            ):
                scoped = validate_illustration_quality.scoped_layout_risks(risks, article_root)
                issues: list[str] = []
                validate_illustration_quality.compare_layout_baseline(scoped, issues)

            self.assertEqual(set(scoped), {article_figure})
            self.assertEqual(len(issues), 1)
            self.assertIn("new raw layout risk", issues[0])
            self.assertIn(article_figure, issues[0])


if __name__ == "__main__":
    unittest.main()
