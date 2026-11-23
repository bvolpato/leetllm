#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Execute isolated, checksum-pinned SkyRL CPU contracts, not the training stack.

Upstream code is downloaded only with --fetch and remains in --source-dir.
Only the reviewed classes/methods are compiled, without GPU-dependent imports.
"""
import argparse
import ast
import asyncio
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
from types import SimpleNamespace
from urllib.request import urlopen

REVISION = "955c3e23bf8939b28a9d6c424308a762dcb8a2e7"
SOURCES = {
    "fully_async_trainer.py": ("skyrl/train/fully_async_trainer.py", "3a47a21b69e6bd9631aecb045a3d8a0c7157814e95d51a3ff70638ae9f982d20"),
    "gym.py": ("skyrl/train/generators/skyrl_gym_generator.py", "387560eee4a318174dd96d6af1efd1b44787de922422e272011dc7a02e6fb2ec"),
}


def read_source(directory, name, fetch):
    relative, expected = SOURCES[name]
    path = directory / name
    if fetch:
        directory.mkdir(parents=True, exist_ok=True)
        with urlopen(f"https://raw.githubusercontent.com/NovaSky-AI/SkyRL/{REVISION}/{relative}", timeout=30) as response:
            data = response.read()
        assert hashlib.sha256(data).hexdigest() == expected, "upstream checksum mismatch"
        path.write_bytes(data)
    data = path.read_bytes()
    assert hashlib.sha256(data).hexdigest() == expected, f"checksum mismatch: {path}"
    return ast.parse(data, filename=str(path))


def load_isolated(nodes):
    # Postponed annotations let reviewed methods run without importing torch/Ray.
    tree = ast.Module(body=[ast.ImportFrom(module="__future__", names=[ast.alias(name="annotations")], level=0), *nodes], type_ignores=[])
    namespace = {"asyncio": asyncio, "dataclass": dataclass}
    exec(compile(ast.fix_missing_locations(tree), "<pinned SkyRL contracts>", "exec"), namespace)
    return namespace


def member(tree, class_name, method):
    cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == class_name)
    return next(n for n in cls.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and n.name == method)


async def check(manager, drain):
    checks = []
    m = manager(4, 2, 1)
    for _ in range(4):
        await m.acquire_submission_slot()
    for _ in range(4):
        await m.on_rollout_accepted()
    assert m._compute_capacity_unlocked() == 0
    blocked = asyncio.create_task(m.acquire_submission_slot())
    await asyncio.sleep(0)
    assert not blocked.done()
    await m.on_rollout_filtered()
    await asyncio.wait_for(blocked, timeout=1)
    assert (m._stat.accepted, m._stat.filtered, m._stat.running, m._stat.submitted) == (3, 1, 1, 5)
    checks.append("filter restores capacity and unblocks waiting producer")

    # Epoch validation counts trained groups, not filtered prompts.
    await m.on_rollout_accepted()
    await m.on_rollout_filtered()
    await m.on_rollout_filtered()
    await m.notify_capacity_change(2)
    await m.validate_state_at_epoch_end(2)
    checks.append("epoch-end trained/filtered conservation")

    resumed = manager(4, 2, 1)
    resumed.load_state_from_checkpoint(7)
    assert (resumed._stat.accepted, resumed._stat.submitted, resumed._stat.running) == (12, 12, 0)
    assert resumed._compute_capacity_unlocked() == 4
    checks.append("resume discards in-flight capacity and restores trained count")

    limited = manager(1, 1, 2)
    await limited.acquire_submission_slot()
    assert limited._compute_capacity_unlocked() == 0
    checks.append("worker concurrency caps otherwise available staleness capacity")

    sync = manager(1, 1, 0)
    await sync.acquire_submission_slot()
    await sync.on_rollout_accepted()
    assert sync._compute_capacity_unlocked() == 0
    await sync.notify_capacity_change(2)
    assert sync._compute_capacity_unlocked() == 1
    checks.append("zero staleness prevents the next group before step advance")

    m = manager(3, 1, 2)
    for _ in range(3):  # L, A, B scheduled at step 1.
        await m.acquire_submission_slot()
    await m.on_rollout_accepted()  # A
    await m.on_rollout_accepted()  # B
    trace = []
    for step, group, scheduled in [(1, "A", 1), (2, "B", 1), (3, "C", 2), (4, "L", 1)]:
        if step == 2:
            await m.acquire_submission_slot()  # C
            await m.on_rollout_accepted()
        if step == 4:
            await m.on_rollout_accepted()  # L
        a, r = m._stat.accepted, m._stat.running
        outstanding = a + r - (step - 1)
        assert a + r <= 2 + step
        assert m._stat.submitted == a + r + m._stat.filtered
        trace.append({"step": step, "group": group, "accepted": a, "running": r, "outstanding": outstanding, "lag": step - scheduled})
        await m.notify_capacity_change(step + 1)
    await m.validate_state_at_epoch_end(5)
    assert [row["outstanding"] for row in trace] == [3, 3, 2, 1]
    assert trace[-1]["lag"] == 3
    checks.append("figure trace obeys capacity while a group exceeds lag budget")

    queue, done = asyncio.Queue(), asyncio.Event()
    queue.put_nowait("last useful group")
    done.set()
    assert await drain(object(), queue, done) == "last useful group"
    assert await drain(object(), queue, done) is None
    checks.append("exhausted producer drains buffered groups then terminates")
    return checks, trace


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, default=Path("/tmp/leetllm-skyrl-955c3e2"))
    parser.add_argument("--fetch", action="store_true")
    parser.add_argument("--receipt", type=Path)
    args = parser.parse_args()
    async_tree = read_source(args.source_dir, "fully_async_trainer.py", args.fetch)
    gym_tree = read_source(args.source_dir, "gym.py", args.fetch)
    nodes = [n for n in async_tree.body if isinstance(n, ast.ClassDef) and n.name in {"_RolloutStat", "_AsyncStalenessManager"}]
    nodes.append(member(async_tree, "FullyAsyncRayPPOTrainer", "_drain_next_group"))
    namespace = load_isolated(nodes)
    checks, trace = asyncio.run(check(namespace["_AsyncStalenessManager"], namespace["_drain_next_group"]))
    reward = load_isolated([member(gym_tree, "SkyRLGymGenerator", "_build_per_token_rewards")])["_build_per_token_rewards"]
    ordinary = SimpleNamespace(custom_chat_template=None)
    assert reward(ordinary, [(-0.2, 1), (1.0, 4)], [11, 12, 90, 21, 22], False) == [0, -0.2, 0, 0, 1.0]
    assert reward(ordinary, [(-0.2, 1), (1.0, 4)], [11, 12, 90], False) == [0, -0.2, 0]
    assert reward(ordinary, [(1.0, 1)], [11, 12, 3], True) == [0, 0, 1.0]
    assert reward(SimpleNamespace(custom_chat_template="custom"), [(-0.2, 1), (1.0, 4)], [], False) == 1.0
    checks.append("reward stamping, truncation, appended EOS, and custom-template branches")
    result = {"upstream_revision": REVISION, "scope": "isolated checksum-pinned CPU methods; no full imports, trainer initialization, model, GPU, Ray, HTTP, or distributed weight sync", "source_sha256": {name: item[1] for name, item in SOURCES.items()}, "passed": checks, "figure_trace": trace}
    serialized = json.dumps(result, indent=2) + "\n"
    if args.receipt:
        args.receipt.write_text(serialized)
    print(serialized, end="")


if __name__ == "__main__":
    main()
