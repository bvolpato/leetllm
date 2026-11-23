#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["ray==2.58.0"]
# ///
"""Bounded, single-node Ray Core exercise. No model, GPU, or remote cluster."""
import json
import os
import signal
import tempfile
import time
from pathlib import Path

os.environ["RAY_USAGE_STATS_ENABLED"] = "0"
import ray
from ray.util.placement_group import placement_group, remove_placement_group
from ray.util.scheduling_strategies import PlacementGroupSchedulingStrategy


@ray.remote(num_cpus=1, max_retries=0)
def features(text: str) -> tuple[int, int]:
    # Deterministic string features, not a learned embedding.
    return len(text), sum(map(ord, text)) % 101


@ray.remote(num_cpus=1, max_restarts=1, max_task_retries=0)
class BatchLedger:
    def __init__(self):
        self.completed = 0

    def record(self, *vectors):
        assert all(isinstance(v, tuple) for v in vectors)
        self.completed += len(vectors)
        return self.completed

    def inspect_nested(self, refs):
        return all(isinstance(ref, ray.ObjectRef) for ref in refs)

    def state(self):
        return self.completed, os.getpid()


@ray.remote(num_cpus=1, max_retries=1)
def fail_worker_once(marker: str) -> str:
    try:
        descriptor = os.open(marker, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        return "worker crash retried"
    os.close(descriptor)
    os._exit(17)  # Deliberate worker-process failure, not a Python exception.


def stop_on_signal(signum, frame):
    raise SystemExit(f"stopped by signal {signum}")


def main():
    signal.signal(signal.SIGTERM, stop_on_signal)
    with tempfile.TemporaryDirectory(prefix="raylab-", dir="/tmp") as tmp:
        try:
            ray.init(
                address="local", num_cpus=2, num_gpus=0,
                include_dashboard=False, object_store_memory=80 * 1024 * 1024,
                _temp_dir=tmp, logging_level="ERROR",
            )
            assert ray.__version__ == "2.58.0"
            assert len([node for node in ray.nodes() if node["Alive"]]) == 1
            pg = placement_group([{"CPU": 1}, {"CPU": 1}], strategy="STRICT_PACK")
            try:
                ray.get(pg.ready(), timeout=20)
                reserved_refs = [features.options(scheduling_strategy=PlacementGroupSchedulingStrategy(
                    placement_group=pg, placement_group_bundle_index=i,
                )).remote(text) for i, text in enumerate(["cache", "router"])]
                assert ray.get(reserved_refs, timeout=20) == [(5, 96), (6, 67)]
            finally:
                remove_placement_group(pg)

            refs = [features.remote(text) for text in ["cache", "router", "trace"]]
            ledger = BatchLedger.remote()
            count = ray.get(ledger.record.remote(*refs), timeout=20)
            assert count == 3
            assert ray.get(ledger.inspect_nested.remote(refs), timeout=20)
            before_count, before_pid = ray.get(ledger.state.remote(), timeout=20)
            assert before_count == 3
            ray.kill(ledger, no_restart=False)
            deadline = time.monotonic() + 20
            while True:
                try:
                    after_count, after_pid = ray.get(ledger.state.remote(), timeout=2)
                    if after_pid != before_pid:
                        break
                except (ray.exceptions.RayActorError, ray.exceptions.GetTimeoutError):
                    pass
                if time.monotonic() >= deadline:
                    raise TimeoutError("actor did not restart within 20 seconds")
                time.sleep(0.05)
            assert after_pid != before_pid and after_count == 0
            ray.kill(ledger, no_restart=True)
            retried = ray.get(fail_worker_once.remote(str(Path(tmp) / "failed-once")), timeout=20)
            assert retried == "worker crash retried"
            print(json.dumps({
                "ray": ray.__version__, "nodes": 1, "logical_cpus": 2,
                "placement_group_tasks": 2, "recorded": count,
                "nested_refs_preserved": True, "actor_restarted": True,
                "count_after_restart": after_count, "worker_retry": retried,
            }, sort_keys=True))
        finally:
            ray.shutdown()


if __name__ == "__main__":
    main()
