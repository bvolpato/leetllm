#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Logical issue-order simulation, not a CUDA runtime or performance model."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Operation:
    name: str
    stream: str
    duration: int
    waits_for: tuple[str, ...] = ()


def schedule(operations: list[Operation]) -> dict[str, tuple[int, int]]:
    stream_ready: dict[str, int] = {}
    times: dict[str, tuple[int, int]] = {}
    for issue_tick, op in enumerate(operations):
        if not op.name or not op.stream or op.name in times:
            raise ValueError("operation names must be unique and streams nonempty")
        if op.duration <= 0:
            raise ValueError("durations must be positive integer ticks")
        if any(name not in times for name in op.waits_for):
            raise ValueError("dependencies must name earlier submitted operations")
        ready = max((times[name][1] for name in op.waits_for), default=0)
        start = max(issue_tick, stream_ready.get(op.stream, 0), ready)
        times[op.name] = (start, start + op.duration)
        stream_ready[op.stream] = start + op.duration
    return times


def main() -> None:
    operations = [
        Operation("copy", "copy", 3),
        Operation("affine", "compute", 4, ("copy",)),
        Operation("square", "compute", 2),
        Operation("reduce", "compute", 1),
    ]
    times = schedule(operations)
    print(f"host_return_tick={len(operations)}")
    for op in operations:
        start, end = times[op.name]
        print(f"{op.name} stream={op.stream} start={start} end={end}")
    print(f"device_complete_tick={max(end for _, end in times.values())}")
    print(f"result={sum((2*x+1)**2 for x in [1, 2, 3, 4])}")
    # Removing the event edge permits an unsafe schedule, not a predicted value.
    unsafe = schedule([operations[0], Operation("affine", "compute", 4),
                       *operations[2:]])
    print(f"without_event_read_before_copy_done={unsafe['affine'][0] < unsafe['copy'][1]}")
    assert times["affine"][0] >= times["copy"][1]
    assert times["reduce"][1] == 10


if __name__ == "__main__":
    main()
