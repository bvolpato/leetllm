#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Run Python examples that are explicitly marked as copy-runnable."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
from collections.abc import Iterable
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
from content_audience import filter_content_for_audience

REPO_ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = REPO_ROOT / "web" / "src" / "content"
HTML_MARKER = "<!-- leetllm: test -->"
HTML_MARKER_RE = re.compile(r"<!--\s*leetllm:\s*test(?P<options>.*?)-->", re.IGNORECASE | re.DOTALL)
CODE_MARKER = "# leetllm: test"
CODE_MARKER_RE = re.compile(r"#\s*leetllm:\s*test(?P<options>[^\n]*)", re.IGNORECASE)
PYTHON_FENCE_RE = re.compile(r"```(?P<info>(?:python|py)(?:[^\n`]*))\n(?P<code>[\s\S]*?)\n```")
OPTION_START_RE = re.compile(
    r'''"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|'''
    r"(?<![\w-])(?P<key>deps|output(?:_(?:title|head|tail|edges))?|head|tail|edges|id|continue|title)"
    r"\s*(?P<separator>=(?!=)|:)",
    re.IGNORECASE,
)
OUTPUT_START = "<!-- leetllm: output:start -->"
OUTPUT_END = "<!-- leetllm: output:end -->"
GENERATED_OUTPUT_RE = re.compile(
    r"\n*<!--\s*leetllm:\s*output:start\s*-->[\s\S]*?<!--\s*leetllm:\s*output:end\s*-->",
    re.IGNORECASE,
)
OUTPUT_MODES = {"show", "folded"}
DEFAULT_WITH = ("numpy", "pandas", "scikit-learn", "pytest", "pyyaml", "pydantic", "fastapi", "mcp", "langgraph")
DEPENDENCY_ALIASES = {
    "pytorch": "torch",
    "sklearn": "scikit-learn",
    "yaml": "pyyaml",
}
EXAMPLE_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]*$", re.IGNORECASE)
HARNESS = """\
import contextlib
import io
import json
import pathlib
import sys
import traceback

cells_path = pathlib.Path(sys.argv[1])
results_path = pathlib.Path(sys.argv[2])
cells = json.loads(cells_path.read_text(encoding="utf-8"))
namespace = {"__name__": "__main__", "__file__": str(cells_path.with_suffix(".py"))}
results = []

for cell in cells:
    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()
    try:
        namespace["__file__"] = cell["script_path"]
        with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
            exec(compile(cell["code"], cell["label"], "exec"), namespace)
    except Exception:
        error = traceback.format_exc()
        results.append(
            {
                "ok": False,
                "label": cell["label"],
                "stdout": stdout_buffer.getvalue(),
                "stderr": stderr_buffer.getvalue(),
                "error": error,
            }
        )
        results_path.write_text(json.dumps(results), encoding="utf-8")
        print(f"Cell failed: {cell['label']}", file=sys.stderr)
        if stderr_buffer.getvalue():
            print(stderr_buffer.getvalue(), file=sys.stderr, end="")
        print(error, file=sys.stderr, end="")
        sys.exit(1)

    results.append(
        {
            "ok": True,
            "label": cell["label"],
            "stdout": stdout_buffer.getvalue(),
            "stderr": stderr_buffer.getvalue(),
        }
    )

results_path.write_text(json.dumps(results), encoding="utf-8")
"""


@dataclass(frozen=True)
class Example:
    path: Path
    source_digest: str
    index: int
    line: int
    fence_end: int
    code: str
    dependencies: tuple[str, ...]
    output_mode: str | None
    output_title: str | None
    output_head: int | None
    output_tail: int | None
    example_id: str | None
    continue_from: str | None


@dataclass(frozen=True)
class ExampleRun:
    examples: tuple[Example, ...]


def line_number(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def normalize_dependency(dependency: str) -> str:
    stripped = dependency.strip()
    return DEPENDENCY_ALIASES.get(stripped.lower(), stripped)


def strip_wrapped_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1]
    return value


def parse_options(options: str) -> dict[str, str]:
    # Consume quoted values without treating their contents or package pins as options.
    matches = [match for match in OPTION_START_RE.finditer(options) if match.group("key")]
    parsed: dict[str, str] = {}

    for index, match in enumerate(matches):
        value_start = match.end()
        value_end = matches[index + 1].start() if index + 1 < len(matches) else len(options)
        value = strip_wrapped_quotes(options[value_start:value_end].strip(" ,"))
        if value:
            parsed[match.group("key").lower()] = value

    return parsed


def parse_marker_dependencies(options: str) -> tuple[str, ...]:
    dependencies: list[str] = []

    for token in parse_options(options).get("deps", "").split(","):
        dependency = normalize_dependency(token)
        if dependency:
            dependencies.append(dependency)

    return tuple(dict.fromkeys(dependencies))


def parse_output_mode(options: str) -> str | None:
    output_mode = parse_options(options).get("output")
    if output_mode is None:
        return None

    normalized = output_mode.lower()
    if normalized not in OUTPUT_MODES:
        choices = ", ".join(sorted(OUTPUT_MODES))
        raise ValueError(f"unsupported output={output_mode!r}; expected one of: {choices}")

    return normalized


def parse_nonnegative_int(value: str, key: str) -> int:
    try:
        parsed = int(value)
    except ValueError as exc:
        raise ValueError(f"{key} must be a nonnegative integer, got {value!r}") from exc

    if parsed < 0:
        raise ValueError(f"{key} must be a nonnegative integer, got {value!r}")

    return parsed


def parse_output_limits(options: str) -> tuple[int | None, int | None]:
    parsed = parse_options(options)
    head = parsed.get("output_head") or parsed.get("head")
    tail = parsed.get("output_tail") or parsed.get("tail")
    edges = parsed.get("output_edges") or parsed.get("edges")
    output_head = parse_nonnegative_int(head, "output_head") if head is not None else None
    output_tail = parse_nonnegative_int(tail, "output_tail") if tail is not None else None

    if edges is not None:
        parts = edges.split(":")
        if len(parts) != 2:
            raise ValueError(f"edges must use HEAD:TAIL, got {edges!r}")
        edge_head = parse_nonnegative_int(parts[0], "edges head")
        edge_tail = parse_nonnegative_int(parts[1], "edges tail")
        if output_head is not None and output_head != edge_head:
            raise ValueError(f"conflicting output_head={output_head} and edges head={edge_head}")
        if output_tail is not None and output_tail != edge_tail:
            raise ValueError(f"conflicting output_tail={output_tail} and edges tail={edge_tail}")
        output_head = edge_head
        output_tail = edge_tail

    return output_head, output_tail


def parse_example_id(value: str | None, key: str) -> str | None:
    if value is None:
        return None
    if not EXAMPLE_ID_RE.fullmatch(value):
        raise ValueError(f"{key} must match {EXAMPLE_ID_RE.pattern!r}, got {value!r}")
    return value


def merge_output_mode(current: str | None, candidate: str | None) -> str | None:
    if candidate is None:
        return current
    if current is not None and current != candidate:
        raise ValueError(f"conflicting output modes: {current!r} and {candidate!r}")
    return candidate


def merge_value(current: str | None, candidate: str | None, key: str) -> str | None:
    if candidate is None:
        return current
    if current is not None and current != candidate:
        raise ValueError(f"conflicting {key}: {current!r} and {candidate!r}")
    return candidate


def merge_limit(current: int | None, candidate: int | None, key: str) -> int | None:
    if candidate is None:
        return current
    if current is not None and current != candidate:
        raise ValueError(f"conflicting {key}: {current!r} and {candidate!r}")
    return candidate


def normalize_output_title(value: str | None) -> str | None:
    if value is None:
        return None
    title = value.strip()
    if not title:
        raise ValueError("output_title must not be empty")
    return title


def extract_marker_options(
    prelude: str,
    fence_info: str,
    code: str,
) -> tuple[bool, tuple[str, ...], str | None, str | None, int | None, int | None, str | None, str | None]:
    dependencies: list[str] = []
    html_matches = list(HTML_MARKER_RE.finditer(prelude))
    code_matches = list(CODE_MARKER_RE.finditer(code))
    fence_options = parse_options(fence_info)
    output_mode: str | None = parse_output_mode(fence_info)
    output_title = normalize_output_title(fence_options.get("output_title"))
    output_head, output_tail = parse_output_limits(fence_info)
    example_id = parse_example_id(fence_options.get("id"), "id")
    continue_from = parse_example_id(fence_options.get("continue"), "continue")

    for match in [*html_matches, *code_matches]:
        options = match.group("options")
        parsed = parse_options(options)
        dependencies.extend(parse_marker_dependencies(options))
        output_mode = merge_output_mode(output_mode, parse_output_mode(options))
        output_title = merge_value(
            output_title,
            normalize_output_title(parsed.get("output_title")),
            "output_title",
        )
        candidate_head, candidate_tail = parse_output_limits(options)
        output_head = merge_limit(output_head, candidate_head, "output_head")
        output_tail = merge_limit(output_tail, candidate_tail, "output_tail")
        example_id = merge_value(example_id, parse_example_id(parsed.get("id"), "id"), "id")
        continue_from = merge_value(
            continue_from,
            parse_example_id(parsed.get("continue"), "continue"),
            "continue",
        )

    return (
        bool(html_matches or code_matches),
        tuple(dict.fromkeys(dependencies)),
        output_mode,
        output_title,
        output_head,
        output_tail,
        example_id,
        continue_from,
    )


def clean_code_marker(code: str) -> str:
    cleaned_lines = [CODE_MARKER_RE.sub("", line).rstrip() for line in code.splitlines()]
    return "\n".join(cleaned_lines).strip() + "\n"


def iter_marked_examples(article_slug: str | None = None, audience: str | None = None, edition: str = "reference") -> list[Example]:
    examples: list[Example] = []

    for path in sorted(CONTENT_DIR.glob("*/*/content.md")):
        if article_slug is not None and path.parent.name != article_slug:
            continue
        text = path.read_text(encoding="utf-8")
        source_digest = sha256(text.encode("utf-8")).hexdigest()
        if audience is not None:
            text = filter_content_for_audience(text, audience, str(path), edition, preserve_offsets=True)
        for index, match in enumerate(PYTHON_FENCE_RE.finditer(text), start=1):
            code = match.group("code")
            fence_info = match.group("info")
            prelude = text[max(0, match.start() - 240):match.start()]
            (
                is_marked,
                dependencies,
                output_mode,
                output_title,
                output_head,
                output_tail,
                example_id,
                continue_from,
            ) = extract_marker_options(prelude, fence_info, code)
            if not is_marked:
                continue
            examples.append(
                Example(
                    path=path,
                    source_digest=source_digest,
                    index=index,
                    line=line_number(text, match.start()),
                    fence_end=match.end(),
                    code=clean_code_marker(code),
                    dependencies=dependencies,
                    output_mode=output_mode,
                    output_title=output_title,
                    output_head=output_head,
                    output_tail=output_tail,
                    example_id=example_id,
                    continue_from=continue_from,
                )
            )

    return examples


def filter_examples_by_article(examples: list[Example], article_slug: str) -> list[Example]:
    return [example for example in examples if example.path.parent.name == article_slug]


def example_label(example: Example) -> str:
    rel_path = example.path.relative_to(REPO_ROOT)
    return f"{rel_path}:{example.line} python fence {example.index}"


def example_notes(example: Example) -> str:
    parts: list[str] = []
    if example.dependencies:
        parts.append(f"deps={','.join(example.dependencies)}")
    if example.output_mode:
        parts.append(f"output={example.output_mode}")
    if example.example_id:
        parts.append(f"id={example.example_id}")
    if example.continue_from:
        parts.append(f"continue={example.continue_from}")
    return f" {' '.join(parts)}" if parts else ""


def build_example_runs(examples: list[Example]) -> list[ExampleRun]:
    runs: list[ExampleRun] = []

    for path in sorted({example.path for example in examples}):
        path_examples = [example for example in examples if example.path == path]
        id_map: dict[str, Example] = {}
        child_map: dict[str, Example] = {}

        for example in path_examples:
            if example.example_id is None:
                continue
            existing = id_map.get(example.example_id)
            if existing is not None:
                raise ValueError(
                    f"{path.relative_to(REPO_ROOT)} has duplicate id={example.example_id!r} "
                    f"at lines {existing.line} and {example.line}"
                )
            id_map[example.example_id] = example

        for example in path_examples:
            if example.continue_from is None:
                continue
            parent = id_map.get(example.continue_from)
            if parent is None:
                raise ValueError(
                    f"{path.relative_to(REPO_ROOT)}:{example.line} continue={example.continue_from!r} "
                    "does not match any earlier example id in this article"
                )
            if parent.line >= example.line:
                raise ValueError(
                    f"{path.relative_to(REPO_ROOT)}:{example.line} continue={example.continue_from!r} "
                    "must point to an earlier example"
                )
            existing_child = child_map.get(parent.example_id or "")
            if existing_child is not None:
                raise ValueError(
                    f"{path.relative_to(REPO_ROOT)} has multiple continuations from id={parent.example_id!r} "
                    f"at lines {existing_child.line} and {example.line}; keep chains linear"
                )
            child_map[parent.example_id or ""] = example

        seen: set[Example] = set()
        for example in path_examples:
            if example.continue_from is not None or example in seen:
                continue
            chain = [example]
            current = example
            while current.example_id is not None and current.example_id in child_map:
                current = child_map[current.example_id]
                chain.append(current)
            seen.update(chain)
            runs.append(ExampleRun(examples=tuple(chain)))

        leftovers = [example for example in path_examples if example not in seen]
        if leftovers:
            labels = ", ".join(f"line {example.line}" for example in leftovers)
            raise ValueError(
                f"{path.relative_to(REPO_ROOT)} has continuation examples not attached to a root: {labels}"
            )

    return runs


def run_examples(
    run: ExampleRun,
    timeout: int,
    base_dependencies: tuple[str, ...],
) -> tuple[bool, dict[Example, str], int | None, str]:
    unit_examples = run.examples
    with tempfile.TemporaryDirectory(prefix="leetllm-example-") as temp_dir:
        temp_path = Path(temp_dir)
        assets_dir = unit_examples[0].path.parent / "assets"
        if assets_dir.exists():
            shutil.copytree(assets_dir, temp_path / "assets")
        cells_path = temp_path / "cells.json"
        results_path = temp_path / "results.json"
        harness_path = temp_path / "run_cells.py"
        harness_path.write_text(HARNESS, encoding="utf-8")
        cells = [
            {
                "label": example_label(example),
                "code": example.code,
                "script_path": str(temp_path / f"example-{index}.py"),
            }
            for index, example in enumerate(unit_examples, start=1)
        ]
        cells_path.write_text(json.dumps(cells), encoding="utf-8")

        dependencies = tuple(
            dict.fromkeys(
                (
                    *base_dependencies,
                    *(dependency for example in unit_examples for dependency in example.dependencies),
                )
            )
        )
        cmd = ["uv", "run"]
        for dependency in dependencies:
            cmd.extend(["--with", dependency])
        cmd.extend([str(harness_path), str(cells_path), str(results_path)])

        env = os.environ.copy()
        env["PYTHONDONTWRITEBYTECODE"] = "1"
        env["PYTHONHASHSEED"] = "0"
        env["CUDA_VISIBLE_DEVICES"] = ""
        for name in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
            env.setdefault(name, "1")

        with subprocess.Popen(
            cmd,
            cwd=temp_dir,
            env=env,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            start_new_session=True,
        ) as process:
            try:
                stdout, stderr = process.communicate(timeout=timeout * len(unit_examples))
            except subprocess.TimeoutExpired:
                # uv launches Python as a child; stop both before removing their workspace.
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                process.communicate()
                labels = ", ".join(example_label(example) for example in unit_examples)
                return False, {}, None, f"timed out after {timeout * len(unit_examples)}s while running {labels}"

        stored_results: list[dict[str, object]] = []
        if results_path.exists():
            stored_results = json.loads(results_path.read_text(encoding="utf-8"))

    if process.returncode == 0:
        if len(stored_results) != len(unit_examples):
            return False, {}, None, "cell runner finished without complete result metadata"
        outputs = {
            example: str(cell_result.get("stdout", "")).strip("\n")
            for example, cell_result in zip(unit_examples, stored_results, strict=True)
        }
        return True, outputs, None, ""

    failure_result = stored_results[-1] if stored_results else {}
    failure_index = len(stored_results) - 1 if stored_results else None
    failure_stdout = str(failure_result.get("stdout", "")).strip()
    failure_stderr = str(failure_result.get("stderr", "")).strip()
    failure_error = str(failure_result.get("error", "")).strip()
    output = "\n".join(
        part
        for part in [failure_stdout, failure_stderr, failure_error, stdout.strip(), stderr.strip()]
        if part
    )
    return False, {}, failure_index, output[-4000:]


def output_fence(stdout: str) -> str:
    longest_backtick_run = max((len(match.group(0)) for match in re.finditer(r"`{3,}", stdout)), default=2)
    return "`" * max(3, longest_backtick_run + 1)


def truncate_output(stdout: str, output_head: int | None, output_tail: int | None) -> str:
    # Keep leading spaces, because they align the columns of printed tables.
    body = stdout.strip("\n").rstrip()
    if not body:
        return "(no stdout)"

    if output_head is None and output_tail is None:
        return body

    lines = body.splitlines()
    head = 0 if output_head is None else output_head
    tail = 0 if output_tail is None else output_tail
    visible_count = head + tail

    if len(lines) <= visible_count or len(lines) <= max(head, tail):
        return body

    head_lines = lines[:head]
    tail_lines = lines[-tail:] if tail else []
    return "\n".join([*head_lines, "...", *tail_lines])


def info_string_title(value: str) -> str:
    return value.replace('"', "'")


def format_output_block(
    stdout: str,
    output_mode: str,
    output_title: str | None,
    output_head: int | None,
    output_tail: int | None,
) -> str:
    body = truncate_output(stdout, output_head, output_tail)
    fence = output_fence(body)
    title = info_string_title(output_title or "Output")

    if output_mode == "show":
        code_block = f'{fence}text title="{title}" output compact\n{body}\n{fence}'
        rendered = code_block
    elif output_mode == "folded":
        code_block = f"{fence}text output compact bare\n{body}\n{fence}"
        rendered = f"<details>\n<summary>{title}</summary>\n\n{code_block}\n\n</details>"
    else:
        raise ValueError(f"unsupported output mode: {output_mode}")

    return f"\n\n{OUTPUT_START}\n{rendered}\n{OUTPUT_END}"


def apply_output_blocks(examples: list[Example], outputs: dict[Example, str], write: bool) -> list[Path]:
    changed_paths: list[Path] = []
    examples_by_path: dict[Path, list[Example]] = {}

    for example in examples:
        if example.output_mode:
            examples_by_path.setdefault(example.path, []).append(example)

    for path, path_examples in examples_by_path.items():
        text = path.read_text(encoding="utf-8")
        current_digest = sha256(text.encode("utf-8")).hexdigest()
        if any(example.source_digest != current_digest for example in path_examples):
            raise ValueError(f"{path}: content changed after example collection; rerun validation before refreshing outputs")
        updated = text

        for example in sorted(path_examples, key=lambda item: item.fence_end, reverse=True):
            output = outputs[example]
            replacement = format_output_block(
                output,
                example.output_mode or "show",
                example.output_title,
                example.output_head,
                example.output_tail,
            )
            suffix = updated[example.fence_end:]
            existing = GENERATED_OUTPUT_RE.match(suffix)
            if existing:
                start = example.fence_end
                end = example.fence_end + existing.end()
                updated = updated[:start] + replacement + updated[end:]
            else:
                updated = updated[:example.fence_end] + replacement + updated[example.fence_end:]

        if updated != text:
            changed_paths.append(path)
            if write:
                if path.read_text(encoding="utf-8") != text:
                    raise ValueError(f"{path}: content changed while outputs were formatted; rerun validation before refreshing outputs")
                path.write_text(updated, encoding="utf-8")

    return changed_paths


def confirm_stale_output_paths(paths: list[Path], audience: str = "website", edition: str = "reference", no_default_deps: bool = False) -> list[Path]:
    if not paths or os.environ.get("LEETLLM_SKIP_OUTPUT_RECHECK") == "1":
        return paths

    confirmed: list[Path] = []
    script_path = Path(__file__).resolve()

    for path in paths:
        env = os.environ.copy()
        env["LEETLLM_SKIP_OUTPUT_RECHECK"] = "1"
        command = ["uv", "run", str(script_path), "--article", path.parent.name, "--min-examples", "1"]
        if audience != "website" or edition != "reference":
            command.extend(["--audience", audience, "--edition", edition])
        if no_default_deps:
            command.append("--no-default-deps")
        result = subprocess.run(
            command,
            cwd=REPO_ROOT,
            env=env,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )

        if result.returncode == 0:
            print(f"INFO output recheck passed for {path.relative_to(REPO_ROOT)}")
            continue

        confirmed.append(path)

    return confirmed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--min-examples",
        type=int,
        default=None,
        help="Minimum marked examples (default: 10 corpus-wide, 1 with --article).",
    )
    parser.add_argument("--timeout", type=int, default=45)
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        help="Number of independent example runs to execute concurrently (default: 1).",
    )
    parser.add_argument(
        "--with",
        dest="dependencies",
        action="append",
        default=[],
        help="Additional uv dependency for marked examples.",
    )
    parser.add_argument("--article", help="Only run examples from one article slug.")
    parser.add_argument("--audience", choices=("website", "book"), default="website", help="Content view whose marked examples are validated.")
    parser.add_argument("--edition", choices=("reader", "reference"), default="reference", help="Reader or complete reference passage selection.")
    parser.add_argument("--no-default-deps", action="store_true", help="Install only dependencies explicitly declared by examples or --with.")
    parser.add_argument(
        "--write-outputs",
        action="store_true",
        help="Refresh generated output blocks in the single bundle selected by --article.",
    )
    args = parser.parse_args()
    if args.workers < 1:
        parser.error("--workers must be at least 1")
    if args.write_outputs and not args.article:
        parser.error("--write-outputs requires --article; review and refresh one bundle at a time")

    try:
        examples = iter_marked_examples(args.article, args.audience, args.edition)
    except ValueError as exc:
        print(f"Python example validation failed: {exc}")
        return 1

    min_examples = (
        args.min_examples if args.min_examples is not None else (1 if args.article else 10)
    )
    if len(examples) < min_examples:
        print(
            f"Python example validation failed: found {len(examples)} marked examples, need at least {min_examples}."
        )
        print(f"Add `{HTML_MARKER}` before complete copy-runnable python fences.")
        print("Use `<!-- leetllm: test, deps=torch,numpy -->` when an example needs extra packages.")
        return 1

    dependencies = tuple(dict.fromkeys((*(() if args.no_default_deps else DEFAULT_WITH), *args.dependencies)))
    failures: list[str] = []
    outputs: dict[Example, str] = {}
    try:
        example_runs = build_example_runs(examples)
    except ValueError as exc:
        print(f"Python example validation failed: {exc}")
        return 1

    def execute_run(run: ExampleRun) -> tuple[bool, dict[Example, str], int | None, str]:
        return run_examples(run, args.timeout, dependencies)

    def record_results(
        run_results: Iterable[tuple[bool, dict[Example, str], int | None, str]],
    ) -> None:
        for run, result in zip(example_runs, run_results, strict=True):
            ok, run_outputs, failure_index, failure_output = result
            if ok:
                outputs.update(run_outputs)
                for example in run.examples:
                    print(f"OK {example_label(example)}{example_notes(example)}")
                continue

            failed_example = run.examples[failure_index or 0]
            failures.append(f"{example_label(failed_example)}{example_notes(failed_example)}\n{failure_output}")

    if args.workers == 1:
        record_results(map(execute_run, example_runs))
    else:
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            record_results(executor.map(execute_run, example_runs))

    if failures:
        print("\nPython example validation failed:")
        for failure in failures:
            print(f"\n---\n{failure}")
        return 1

    try:
        stale_output_paths = apply_output_blocks(examples, outputs, write=args.write_outputs)
    except ValueError as exc:
        print(f"Python example validation failed: {exc}")
        return 1
    stale_output_paths = confirm_stale_output_paths(stale_output_paths, args.audience, args.edition, args.no_default_deps)
    if stale_output_paths and not args.write_outputs:
        print("\nPython example output blocks are stale or missing:")
        for path in stale_output_paths:
            print(f"- {path.relative_to(REPO_ROOT)}")
        print("Review each bundle, then run `uv run scripts/validate-python-examples.py --article <slug> --write-outputs`.")
        return 1

    if stale_output_paths:
        print("\nRefreshed python example output blocks:")
        for path in stale_output_paths:
            print(f"- {path.relative_to(REPO_ROOT)}")

    print(f"\nOK python examples: {len(examples)} marked examples executed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
