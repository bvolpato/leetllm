#!/usr/bin/env python3
"""Classify GPU failure telemetry snapshots by memory layer, fault scope, and relaunch need."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

SNAPSHOTS_PATH = Path(__file__).with_name("gpu_failure_snapshots.json")
REQUIRED_FIELDS = (
    "incident_id",
    "allocator_backend",
    "oom_request_gib",
    "capacity_gib",
    "pytorch_allocated_gib",
    "pytorch_reserved_gib",
    "inactive_split_block_total_gib",
    "largest_inactive_split_block_gib",
    "nvml_device_used_gib",
    "stale_processes",
    "new_uncorrectable_ecc",
    "new_xids",
    "dcgm_findings",
    "clock_event_reasons",
    "cuda_error",
)
CORRUPT_CUDA_ERRORS = frozenset(
    {"illegal_address", "misaligned_address", "launch_failure", "launch_timeout", "assert"}
)


def _check_nonneg(row: dict[str, Any], key: str) -> float:
    val = float(row[key])
    if val != val or val < 0.0 or val > 1e6:
        raise ValueError(f"out-of-range metric {key}: {row[key]!r}")
    return val


def validate(row: dict[str, Any]) -> None:
    missing = [key for key in REQUIRED_FIELDS if key not in row]
    if missing:
        raise ValueError(f"missing fields: {', '.join(missing)}")
    if not str(row["incident_id"]).strip():
        raise ValueError("empty incident_id")
    if not str(row["allocator_backend"]).strip():
        raise ValueError("empty allocator_backend")

    if row["oom_request_gib"] is not None:
        _check_nonneg(row, "oom_request_gib")
    cap = _check_nonneg(row, "capacity_gib")
    if cap <= 0.0:
        raise ValueError(f"capacity_gib must be positive: {cap}")
    alloc = _check_nonneg(row, "pytorch_allocated_gib")
    res = _check_nonneg(row, "pytorch_reserved_gib")
    split_total = _check_nonneg(row, "inactive_split_block_total_gib")
    split_max = _check_nonneg(row, "largest_inactive_split_block_gib")
    if res < alloc - 1e-6 or res > cap + 1e-6:
        raise ValueError(f"inconsistent reserved={res} vs allocated={alloc} and capacity={cap}")
    if split_max > split_total + 1e-6:
        raise ValueError(f"largest split block {split_max} exceeds total {split_total}")
    if split_total > res - alloc + 1e-6:
        raise ValueError(f"inactive split total {split_total} exceeds unallocated reserved {res - alloc}")
    if row["nvml_device_used_gib"] is not None:
        used = _check_nonneg(row, "nvml_device_used_gib")
        if used > cap + 1e-6:
            raise ValueError(f"nvml_device_used_gib={used} exceeds capacity={cap}")
    if int(row["stale_processes"]) < 0 or int(row["new_uncorrectable_ecc"]) < 0:
        raise ValueError("negative process or ECC counter")


def outside_pytorch(row: dict[str, Any]) -> float | None:
    used = row["nvml_device_used_gib"]
    if used is None:
        return None
    return round(float(used) - float(row["pytorch_reserved_gib"]), 2)


def classify(row: dict[str, Any]) -> dict[str, Any]:
    validate(row)
    outside = outside_pytorch(row)
    cap = float(row["capacity_gib"])
    used = row["nvml_device_used_gib"]
    free = round(cap - float(used), 2) if used is not None else None
    findings = set(row["dcgm_findings"])
    clocks = set(row["clock_event_reasons"])
    xids = list(row["new_xids"])
    cuda_error = str(row["cuda_error"])
    status = str(row.get("status", "oom" if cuda_error == "out_of_memory" else "fault"))
    req = float(row["oom_request_gib"]) if row["oom_request_gib"] is not None else 0.0
    must_relaunch = cuda_error in CORRUPT_CUDA_ERRORS or 94 in xids or 95 in xids

    if "software" in findings or cuda_error in ("insufficient_driver", "not_ready"):
        hypothesis = "driver-runtime"
        scope = "node"
        action = "cordon_node_fix_driver_runtime"
    elif int(row["new_uncorrectable_ecc"]) > 0 or xids:
        hypothesis = "device-memory-fault" if int(row["new_uncorrectable_ecc"]) > 0 else "xid-event"
        scope = "gpu"
        action = "drain_gpu_reset_and_dcgm_l3"
    elif "pcie" in findings or "nvbandwidth" in findings:
        hypothesis = "fabric-fault"
        scope = "node_fabric"
        action = "hold_collectives_inspect_links"
    elif "memory" in findings:
        hypothesis = "device-memory-fault"
        scope = "gpu"
        action = "drain_gpu_decode_dcgm_memory"
    elif used is None:
        hypothesis = "incomplete-memory"
        scope = "allocator"
        action = "collect_nvml_device_metrics"
    elif cuda_error in CORRUPT_CUDA_ERRORS:
        hypothesis = "process-corrupted"
        scope = "worker_process"
        action = "capture_dump_relaunch_worker"
    elif clocks:
        hypothesis = "clock-limited"
        scope = "gpu_environment"
        action = "reduce_concurrency_check_cooling"
    elif status == "oom":
        if row["allocator_backend"] != "native" or req <= 0.0:
            hypothesis = "oom-unresolved"
            scope = "allocator"
            action = "capture_backend_allocation_trace"
        elif (
            float(row["inactive_split_block_total_gib"]) > req
            and req > float(row["largest_inactive_split_block_gib"])
        ):
            hypothesis = "allocator-fragmentation"
            scope = "allocator"
            action = "tune_expandable_segments_and_max_split_size"
        elif outside is not None and outside > 1.0 and int(row["stale_processes"]) > 0:
            hypothesis = "outside-pytorch"
            scope = "gpu_processes"
            action = "terminate_orphan_pids_before_scheduling"
        else:
            hypothesis = "application-capacity"
            scope = "workload"
            action = "shed_batch_or_prefix_cache"
    else:
        hypothesis = "unclassified"
        scope = "none"
        action = "no_failure_recorded"

    return {
        "id": row["incident_id"],
        "hypothesis": hypothesis,
        "must_relaunch": must_relaunch,
        "scope": scope,
        "action": action,
        "outside_gib": outside,
        "free_gib": free,
    }


def analyze(path: Path = SNAPSHOTS_PATH) -> list[dict[str, Any]]:
    rows = json.loads(path.read_text(encoding="utf-8"))
    return [classify(row) for row in rows]


def main() -> None:
    for item in analyze():
        outside_str = f"{item['outside_gib']:.2f} GiB" if item["outside_gib"] is not None else "unknown"
        print(f"{item['id']}: {item['hypothesis']} | outside={outside_str} | must_relaunch={item['must_relaunch']}")


if __name__ == "__main__":
    main()
