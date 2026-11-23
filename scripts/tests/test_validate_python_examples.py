#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

import importlib.util
import io
import json
import os
import signal
import subprocess
import sys
import tempfile
import time
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "validate-python-examples.py"
sys.path.insert(0, str(SCRIPT_PATH.parent))
SPEC = importlib.util.spec_from_file_location("validate_python_examples", SCRIPT_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Could not load validate-python-examples.py")
validator = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = validator
SPEC.loader.exec_module(validator)


class MarkerOptionsTests(unittest.TestCase):
    def test_pinned_dependencies_survive_option_parsing(self):
        for dependency in ("dspy==3.3.1", "dspy[optuna]==3.3.1", "mlflow-skinny==3.3.0"):
            with self.subTest(dependency=dependency):
                options = f"deps={dependency}, numpy==2.2.0, output=folded, id=fit"
                self.assertEqual(
                    validator.parse_marker_dependencies(options),
                    (dependency, "numpy==2.2.0"),
                )
                self.assertEqual(validator.parse_output_mode(options), "folded")
                self.assertEqual(validator.parse_options(options)["id"], "fit")

    def test_quoted_titles_do_not_create_options(self):
        options = 'output=folded, output_title="loss=0.2, output=show", edges:2:5'
        self.assertEqual(validator.parse_output_mode(options), "folded")
        self.assertEqual(validator.parse_options(options)["output_title"], "loss=0.2, output=show")
        self.assertEqual(validator.parse_output_limits(options), (2, 5))


@unittest.skipUnless(os.name == "posix", "Example process groups require POSIX")
class ExampleExecutionTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.path = self.root / "foundations" / "example" / "content.md"
        self.path.parent.mkdir(parents=True)
        for name in ("CONTENT_DIR", "REPO_ROOT"):
            replacement = patch.object(validator, name, self.root)
            replacement.start()
            self.addCleanup(replacement.stop)

    def run_code(self, code, timeout=10):
        self.path.write_text(f"<!-- leetllm: test -->\n```python\n{code}\n```\n")
        run = validator.build_example_runs(validator.iter_marked_examples())[0]
        return validator.run_examples(run, timeout, ())

    def test_thread_defaults_reach_child_without_overriding_explicit_values(self):
        names = ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS")
        clean_env = {key: value for key, value in os.environ.items() if key not in names}
        code = f"import json, os\nprint(json.dumps({{key: os.environ.get(key) for key in {names!r}}}))"
        for overrides in ({}, {key: str(index + 2) for index, key in enumerate(names)}):
            with self.subTest(overrides=overrides), patch.dict(os.environ, clean_env | overrides, clear=True):
                ok, outputs, _, error = self.run_code(code)
                self.assertTrue(ok, error)
                self.assertEqual(json.loads(next(iter(outputs.values()))), {key: overrides.get(key, "1") for key in names})

    def test_failed_example_keeps_stdout_and_exception_details(self):
        ok, outputs, index, error = self.run_code('print("before failure")\nraise ValueError("example failed")')
        self.assertFalse(ok)
        self.assertEqual(outputs, {})
        self.assertEqual(index, 0)
        self.assertIn("before failure", error)
        self.assertIn("ValueError: example failed", error)

    def test_timeout_stops_python_child_and_reaps_launcher_without_touching_other_processes(self):
        pid_path = self.root / "child.pid"
        launched = []
        original_popen = subprocess.Popen

        def launch(*args, **kwargs):
            process = original_popen(*args, **kwargs)
            launched.append(process)
            return process

        unrelated = original_popen([sys.executable, "-c", "import time; time.sleep(30)"], start_new_session=True)
        try:
            with patch.object(validator.subprocess, "Popen", side_effect=launch):
                ok, outputs, index, error = self.run_code(
                    "import os, pathlib, time\n"
                    f"pathlib.Path({str(pid_path)!r}).write_text(str(os.getpid()))\n"
                    "time.sleep(30)",
                    timeout=2,
                )
            self.assertFalse(ok)
            self.assertEqual(outputs, {})
            self.assertIsNone(index)
            self.assertIn("timed out after 2s", error)
            self.assertTrue(pid_path.exists(), "Python child did not start before the timeout")
            child_pid = int(pid_path.read_text())
            deadline = time.monotonic() + 2
            while time.monotonic() < deadline:
                state = subprocess.run(["ps", "-o", "stat=", "-p", str(child_pid)], capture_output=True, text=True).stdout.strip()
                if not state or state.startswith("Z"):
                    break
                time.sleep(0.02)
            self.assertTrue(not state or state.startswith("Z"), f"Timed-out Python child {child_pid} is still running: {state}")
            self.assertIsNotNone(launched[0].returncode)
            with self.assertRaises(ChildProcessError):
                os.waitpid(launched[0].pid, os.WNOHANG)
            self.assertIsNone(unrelated.poll())
        finally:
            if pid_path.exists():
                try:
                    os.kill(int(pid_path.read_text()), signal.SIGKILL)
                except ProcessLookupError:
                    pass
            unrelated.kill()
            unrelated.wait()


class OutputRefreshTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        root = Path(self.directory.name)
        self.path = root / "foundations" / "example" / "content.md"
        self.path.parent.mkdir(parents=True)
        self.source = (
            "An example.\n\n<!-- leetllm: test, output=show -->\n"
            '```python\nprint("first")\n```\n\n'
            "Another example.\n\n<!-- leetllm: test, output=show -->\n"
            '```python\nprint("second")\n```\n'
        )
        self.path.write_text(self.source, encoding="utf-8")
        content_dir = patch.object(validator, "CONTENT_DIR", root)
        content_dir.start()
        self.addCleanup(content_dir.stop)
        self.examples = validator.iter_marked_examples()
        self.outputs = dict(zip(self.examples, ["first\n", "second\n"], strict=True))

    def test_article_scope_ignores_malformed_markers_in_other_bundles(self):
        other = self.path.parent.parent / "other" / "content.md"
        other.parent.mkdir()
        other.write_text('<!-- leetllm: test, id=invalid id -->\n```python\nprint("other")\n```\n')
        with (
            patch.object(sys, "argv", [str(SCRIPT_PATH), "--article", "example"]),
            patch.object(validator, "REPO_ROOT", validator.CONTENT_DIR),
            patch.object(validator, "run_examples", return_value=(True, self.outputs, None, "")),
            patch.object(validator, "apply_output_blocks", return_value=[]),
            redirect_stdout(io.StringIO()),
        ):
            self.assertEqual(validator.main(), 0)

    def test_reader_selection_refreshes_original_source_offsets_without_touching_reference(self):
        reference = '<!-- leetllm: edition:reference:start -->\n' + self.source + '<!-- leetllm: edition:reference:end -->\n'
        reader = '<!-- leetllm: edition:reader:start -->\n<!-- leetllm: test, output=show -->\n```python\nprint("reader")\n```\n<!-- leetllm: edition:reader:end -->\n'
        self.path.write_text(reference + reader, encoding="utf-8")
        selected = validator.iter_marked_examples("example", "book", "reader")
        self.assertEqual(len(selected), 1)
        self.assertEqual(selected[0].code, 'print("reader")\n')
        validator.apply_output_blocks(selected, {selected[0]: "reader\n"}, write=True)
        updated = self.path.read_text(encoding="utf-8")
        self.assertTrue(updated.startswith(reference))
        self.assertEqual(updated, reference + reader.replace('print("reader")\n```', 'print("reader")\n```' + validator.format_output_block("reader\n", "show", None, None, None)))
        self.assertEqual(len(validator.iter_marked_examples("example", "website", "reference")), 2)

    def test_refresh_preserves_positions_and_is_idempotent_after_recollection(self):
        validator.apply_output_blocks(self.examples, self.outputs, write=True)
        updated = self.path.read_text(encoding="utf-8")
        first_output = validator.format_output_block("first\n", "show", None, None, None)
        second_output = validator.format_output_block("second\n", "show", None, None, None)
        expected = self.source.replace(
            'print("first")\n```', 'print("first")\n```' + first_output
        ).replace('print("second")\n```', 'print("second")\n```' + second_output)
        self.assertEqual(updated, expected)
        recollected = validator.iter_marked_examples()
        outputs = dict(zip(recollected, ["first\n", "second\n"], strict=True))
        self.assertEqual(validator.apply_output_blocks(recollected, outputs, write=True), [])

    def test_edit_after_collection_is_preserved(self):
        edited = "An editor added an explanation.\n\n" + self.source
        self.path.write_text(edited, encoding="utf-8")
        for write in (False, True):
            with self.subTest(write=write), self.assertRaisesRegex(ValueError, "changed"):
                validator.apply_output_blocks(self.examples, self.outputs, write=write)
            self.assertEqual(self.path.read_text(encoding="utf-8"), edited)

    def test_edit_during_formatting_is_preserved(self):
        edited = self.source.replace("An example.", "An updated explanation.")
        original_format = validator.format_output_block

        def edit_and_format(*args):
            self.path.write_text(edited, encoding="utf-8")
            return original_format(*args)

        with patch.object(validator, "format_output_block", side_effect=edit_and_format):
            with self.assertRaisesRegex(ValueError, "changed"):
                validator.apply_output_blocks(self.examples, self.outputs, write=True)
        self.assertEqual(self.path.read_text(encoding="utf-8"), edited)


if __name__ == "__main__":
    unittest.main()
