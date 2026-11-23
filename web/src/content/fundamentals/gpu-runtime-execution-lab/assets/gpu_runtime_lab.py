#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "torch",
# ]
# ///

import argparse
import hashlib
import json
import math
import platform
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from collections.abc import Callable
from dataclasses import asdict, dataclass

import torch


@dataclass(frozen=True)
class ModeResult:
    mode: str
    buffer_layout: dict[str, object]
    host_submit_total_ms: float
    host_submit_us_per_iteration: float
    device_total_ms: float
    device_us_per_iteration: float
    end_to_end_total_ms: float
    end_to_end_us_per_iteration: float
    observed: float
    reference: float
    max_abs_error: float
    tolerance: float
    passed: bool
    fresh_input_checks: list[dict[str, object]]


@dataclass(frozen=True)
class Buffers:
    source: torch.Tensor
    copied: torch.Tensor
    affine: torch.Tensor
    squared: torch.Tensor
    total: torch.Tensor
    scale: torch.Tensor
    bias: torch.Tensor


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compare eager, explicit-stream, and CUDA Graph submission."
    )
    parser.add_argument(
        "--mode",
        choices=("all", "eager", "stream", "graph"),
        default="all",
    )
    parser.add_argument("--elements", type=int, default=4096)
    parser.add_argument("--warmup", type=int, default=20)
    parser.add_argument("--iterations", type=int, default=1000)
    return parser.parse_args()


def allocate(elements: int, device: str = "cuda") -> Buffers:
    if elements < 1:
        raise ValueError("elements must be a positive integer")
    source = torch.linspace(0.0, 1.0, elements, device=device, dtype=torch.float32)
    return Buffers(
        source=source,
        copied=torch.empty_like(source),
        affine=torch.empty_like(source),
        squared=torch.empty_like(source),
        total=torch.empty((), device=device, dtype=torch.float32),
        scale=torch.tensor(2.0, device=device),
        bias=torch.tensor(1.0, device=device),
    )


def get_nvidia_driver_version() -> str | None:
    try:
        completed = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=driver_version",
                "--format=csv,noheader,nounits",
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=5,
        )
    except (FileNotFoundError, subprocess.SubprocessError):
        return None

    versions = {line.strip() for line in completed.stdout.splitlines() if line.strip()}
    return ",".join(sorted(versions)) or None


def buffer_layout(buffers: Buffers) -> dict[str, object]:
    tensors = {name: getattr(buffers, name) for name in Buffers.__annotations__}
    return {
        "shape": list(buffers.source.shape),
        "stride": list(buffers.source.stride()),
        "dtype": str(buffers.source.dtype).removeprefix("torch."),
        "addresses": {name: hex(tensor.data_ptr()) for name, tensor in tensors.items()},
    }


def run_chain(buffers: Buffers) -> None:
    buffers.copied.copy_(buffers.source)
    torch.addcmul(buffers.bias, buffers.copied, buffers.scale, out=buffers.affine)
    torch.mul(buffers.affine, buffers.affine, out=buffers.squared)
    torch.sum(buffers.squared, dim=0, out=buffers.total)


def checked_result(buffers: Buffers) -> dict[str, float | bool]:
    """Call only after execution completes; also usable for CPU math checks."""
    observed = buffers.total.item()
    source_cpu = buffers.source.detach().cpu().double()
    expected = torch.sum((source_cpu * 2.0 + 1.0) ** 2).item()
    error = abs(observed - expected)
    tolerance = 1e-4 + 1e-5 * abs(expected)
    if not all(math.isfinite(x) for x in (observed, expected, error)):
        raise ValueError("non-finite correctness result; reject timing")
    return dict(observed=observed, reference=expected, max_abs_error=error,
                tolerance=tolerance, passed=error <= tolerance)


def check_fresh_inputs(submit: Callable[[], None], buffers: Buffers,
                       stream: torch.cuda.Stream) -> list[dict[str, object]]:
    """Change values, retain addresses, and gate timing on two completed checks."""
    original = buffers.source.clone()
    stream.wait_stream(torch.cuda.current_stream())
    addresses = buffer_layout(buffers)["addresses"]
    checks = []
    for value in (0.0, 1.0):
        with torch.cuda.stream(stream):
            buffers.source.fill_(value)
            submit()
        stream.synchronize()
        check = checked_result(buffers)
        if not check["passed"]:
            raise ValueError(f"fresh-input correctness failed: {check}")
        checks.append({"input_fill": value, **check})
    with torch.cuda.stream(stream):
        buffers.source.copy_(original)
    stream.synchronize()  # original storage remains alive until copy completes
    if buffer_layout(buffers)["addresses"] != addresses:
        raise ValueError("captured buffer addresses changed")
    return checks


def make_graph(buffers: Buffers) -> tuple[torch.cuda.CUDAGraph, float]:
    side_stream = torch.cuda.Stream()
    side_stream.wait_stream(torch.cuda.current_stream())
    with torch.cuda.stream(side_stream):
        for _ in range(3):
            run_chain(buffers)
    torch.cuda.current_stream().wait_stream(side_stream)
    torch.cuda.synchronize()

    graph = torch.cuda.CUDAGraph()
    started = time.perf_counter()
    with torch.cuda.graph(graph):
        run_chain(buffers)
    torch.cuda.synchronize()
    setup_ms = (time.perf_counter() - started) * 1000.0
    return graph, setup_ms


def measure(
    mode: str,
    submit: Callable[[], None],
    buffers: Buffers,
    warmup: int,
    iterations: int,
    stream: torch.cuda.Stream,
) -> ModeResult:
    fresh_checks = check_fresh_inputs(submit, buffers, stream)
    with torch.cuda.stream(stream):
        for _ in range(warmup):
            submit()
    stream.synchronize()

    start_event = torch.cuda.Event(enable_timing=True)
    stop_event = torch.cuda.Event(enable_timing=True)
    # Events are lazily initialized on first record. Exclude that work from timing.
    start_event.record(stream)
    stop_event.record(stream)
    stop_event.synchronize()
    wall_started = time.perf_counter()
    with torch.cuda.stream(stream):
        start_event.record()
        host_started = time.perf_counter()
        for _ in range(iterations):
            submit()
        host_submit_ms = (time.perf_counter() - host_started) * 1000.0
        stop_event.record()
    stop_event.synchronize()
    end_to_end_ms = (time.perf_counter() - wall_started) * 1000.0
    device_elapsed_ms = start_event.elapsed_time(stop_event)

    check = checked_result(buffers)

    return ModeResult(
        mode=mode,
        buffer_layout=buffer_layout(buffers),
        host_submit_total_ms=host_submit_ms,
        host_submit_us_per_iteration=host_submit_ms * 1000.0 / iterations,
        device_total_ms=device_elapsed_ms,
        device_us_per_iteration=device_elapsed_ms * 1000.0 / iterations,
        end_to_end_total_ms=end_to_end_ms,
        end_to_end_us_per_iteration=end_to_end_ms * 1000.0 / iterations,
        **check,
        fresh_input_checks=fresh_checks,
    )


def main() -> None:
    args = parse_args()
    if args.elements < 1 or args.warmup < 0 or args.iterations < 1:
        raise SystemExit(
            "elements and iterations must be positive; warmup must be nonnegative"
        )
    if not torch.cuda.is_available():
        raise SystemExit("CUDA device required; no CUDA device is visible")

    selected = ("eager", "stream", "graph") if args.mode == "all" else (args.mode,)
    results: list[ModeResult] = []
    graph_setup_ms: float | None = None
    graph_layout: dict[str, object] | None = None

    for mode in selected:
        buffers = allocate(args.elements)
        submission_stream = (
            torch.cuda.Stream() if mode != "eager" else torch.cuda.current_stream()
        )
        submission_stream.wait_stream(torch.cuda.current_stream())

        if mode == "graph":
            graph, graph_setup_ms = make_graph(buffers)
            graph_layout = buffer_layout(buffers)
            submit = graph.replay
        else:
            submit = lambda current=buffers: run_chain(current)

        results.append(
            measure(
                mode,
                submit,
                buffers,
                args.warmup,
                args.iterations,
                submission_stream,
            )
        )

    output = {
        "output_schema": 3,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "environment": {
            "device": torch.cuda.get_device_name(),
            "compute_capability": ".".join(
                str(part) for part in torch.cuda.get_device_capability()
            ),
            "driver": get_nvidia_driver_version(),
            "torch": torch.__version__,
            "torch_cuda_build": torch.version.cuda,
            "dtype": "float32",
            "python": platform.python_version(),
        },
        "workload": {
            "elements": args.elements,
            "warmup": args.warmup,
            "iterations": args.iterations,
            "chain": ["copy", "affine", "square", "reduce"],
            "input": "float32 linspace(0, 1, elements)",
            "copy_kind": "device-to-device",
            "preflight_per_mode": "two fresh inputs at fixed addresses",
            "capture_eager_warmup_iterations": 3 if "graph" in selected else 0,
            "event_scope": "stream elapsed span including idle gaps; not kernel sum",
            "measurement_scope": "reused buffers; totals divided by iterations, not latency percentiles",
        },
        "graph_setup_ms": graph_setup_ms,
        "graph_setup_scope": "capture context plus final synchronization; excludes eager warmups and first replay/upload",
        "graph_layout": graph_layout,
        "modes": [asdict(result) for result in results],
    }
    print(json.dumps(output, indent=2, allow_nan=False))
    if not all(result.passed for result in results):
        raise SystemExit("correctness check failed")


if __name__ == "__main__":
    main()
