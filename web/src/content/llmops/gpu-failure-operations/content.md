---
{
  "id": "gpu-failure-operations",
  "title": "GPU Failure Operations",
  "slug": "gpu-failure-operations",
  "category": "MLOps & Deployment",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/layered_triage_memory_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Amazon",
    "Microsoft",
    "Anthropic",
    "NVIDIA"
  ],
  "shortDescription": "A CUDA out-of-memory alert names one failed allocation, not whether to restart the replica, quarantine the GPU, or drain the node.",
  "keyConceptsTested": [
    "GPU memory evidence across PyTorch and NVML",
    "Allocator reservation and fragmentation",
    "Xid, ECC, PCIe, and NVLink fault classification",
    "CUDA process-state errors",
    "DCGM diagnostics and plugin result semantics",
    "Replica, process, device, and node containment",
    "Multi-tenant incident ownership",
    "GPU readiness gates and burn-in"
  ],
  "section": "GPU Systems & LLM Inference",
  "order": 21,
  "prerequisites": [
    "llm-deployment-gpu-serving-autoscaling",
    "cuda-gpu-computing-for-ml",
    "gpu-kernel-performance-engineering-lab",
    "kv-cache-paged-attention-llm-serving",
    "training-run-operations"
  ],
  "relatedQuestions": [
    "distributed-inference-data-plane",
    "observability-monitoring-llm-systems",
    "serving-benchmark-engineering",
    "model-parallelism-for-llm-inference",
    "continuous-batching-request-scheduling",
    "design-multi-tenant-llm-serving-platform"
  ]
}
---

A serving alert fires `CUDA out of memory` for request `r-7812` on replica `summarizer-7f9d6` (node `gpu-a17`, `GPU-7f3`), while peer replicas stay healthy:

```text title="failure snapshot"
capacity=40.00 GiB  device_free=0.62 GiB  nvml_device_used=39.38 GiB
pytorch_allocated=30.10 GiB  pytorch_reserved=36.70 GiB
inactive_split_blocks=6.10 GiB  largest_inactive_split_block=0.88 GiB
allocation_request=1.50 GiB  new_xids=[]  new_uncorrectable_ecc=0
```

`CUDA out of memory` names one failed allocation, not whether to retry elsewhere, restart the process, quarantine the GPU, or drain the node. Take the replica out of rotation first, preserve telemetry, and match the repair strictly to the narrowest broken scope.

## Build an incident snapshot before changing state

A process exit erases unsaved allocator history, and a reset wipes volatile device logs. Before restarting `summarizer-7f9d6`: (1) drop replica readiness so new requests stop arriving, (2) record pod UID, PID, GPU UUID, allocator backend, CUDA/driver versions, and timestamps, (3) dump the <span data-glossary="pytorch">PyTorch</span> memory snapshot within a bounded timeout (never hang recovery indefinitely on a wedged dump), and (4) capture NVML memory/process lists, ECC counters, clocks, power, temperature, and Xid logs.[^pytorchCudaMemory2026]

<figure>
  <img src="illustrations/_generated/layered_triage_memory_dark.png" alt="Incident r-7812 memory breakdown across a 40.00 GiB HBM device: 30.10 GiB PyTorch allocated sits inside 36.70 GiB reserved, leaving 6.10 GiB of inactive split blocks and 0.50 GiB other reserve, with 2.68 GiB allocated outside PyTorch and 0.62 GiB free on the device." />
  <figcaption>The 40.00 GiB stack separates 30.10 GiB live PyTorch tensors, 6.10 GiB inactive splits (largest hole 0.88 GiB), 0.50 GiB other reserve, 2.68 GiB outside PyTorch, and 0.62 GiB device free.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/fragmented_allocation_shape_dark.png" alt="Physical fragmentation layout for r-7812 across seven inactive holes separated by pinned live segments: six 0.88 GiB holes and one 0.82 GiB hole total 6.10 GiB, yet every individual gap falls short of the 1.50 GiB request." />
  <figcaption>Seven inactive holes sum to 6.10 GiB, yet pinned live segments keep every contiguous hole at or below 0.88 GiB, blocking the 1.50 GiB request.</figcaption>
</figure>

Read `r-7812` carefully: `reserved - allocated = 6.60 GiB` is an accounting gap, not one reusable block. Here `6.10 GiB` sits in `inactive_split_blocks` whose largest hole is `0.88 GiB` (< `1.50 GiB`), making **allocator fragmentation** plausible, while `nvml_device_used - pytorch_reserved = 2.68 GiB` sits **outside PyTorch** (exceeding the `1.50 - 0.62 = 0.88 GiB` deficit). Check both the snapshot blocks and device process ownership before blaming a leak. Always match GPU/MIG UUID and NVML query version (NVML v2 `reserved` is system reservation, not PyTorch's caching pool).[^nvidiaNvmlApi2026]

## Keep memory layers separate

Separate four software layers before tuning anything:

| Layer | Diagnostic signal | Primary repair lever |
|---|---|---|
| **Application demand** | Live `allocated` + request exceeds capacity | Shed load, cap batch/context or <span data-glossary="kv-cache">KV cache</span> |
| **Allocator fragmentation** | Native allocator OOM with large `inactive_split_blocks` but small largest hole | Dump snapshot, restart replica, revisit allocation patterns / `max_split_size_mb` |
| **Non-PyTorch CUDA memory** | `nvml_device_used` >> `pytorch_reserved` (PyTorch profiler cannot see <span data-glossary="nccl">NCCL</span> or direct CUDA)[^pytorchCudaMemory2026] | Attribute NCCL, cuBLAS workspaces, or peer libraries via `torch.cuda.device_memory_used()` and NVML |
| **Orphan / stale process** | Device PID list shows leftover processes after teardown | Stop scheduling to GPU; owner kills orphan PIDs and fixes lifecycle |

Native split-block inference applies only to PyTorch's default caching allocator; with `backend:cudaMallocAsync`, record the backend explicitly and skip native split rules.[^pytorchCudaSemantics2026]

### Record a finite allocator history

Enable allocator history *before* the incident window and dump from the same process near OOM (`memory_viz` inspects the pickle locally):[^pytorchCudaMemory2026]

```python title="allocator-history.py"
import torch

torch.cuda.memory._record_memory_history(
    enabled="all", context="all", stacks="python", max_entries=100_000,
)
torch.cuda.memory._dump_snapshot("r-7812-memory.pickle")
```

History is a fixed-size ring buffer: once `max_entries` fills, oldest events wrap and vanish. Starting capture *after* an OOM misses the event completely.

<figure>
  <img src="illustrations/_generated/finite_allocator_history_dark.png" alt="A 100,000-entry PyTorch allocator ring buffer flows from start to OOM capture, wraps over oldest records, and dumps before process exit." />
  <figcaption>Allocator history wraps after `max_entries`; enable it before the fault window and bound dump timeouts so worker isolation never stalls.</figcaption>
</figure>

## Classify beyond memory

An OOM is often a downstream symptom of a stalled collective, ECC fault, or clock throttle. Correlate memory counters with device hardware signals:

| Fault class | Key evidence | Operational scope |
|---|---|---|
| **Xid 94 (contained memory error)** | Exact Xid code + GPU UUID[^nvidiaXidCatalog2026] | Restart affected application only; other apps survive; reset when convenient |
| **Xid 95 (uncontained) / uncorrectable ECC** | Xid 95 or new uncorrectable ECC count[^nvidiaXidIntroduction2026][^nvidiaXidCatalog2026] | **Quarantine GPU, reset device, pass DCGM L2/L3** before relaunching workloads |
| **PCIe / NVLink fabric fault** | <span data-glossary="nvidia-dcgm">DCGM</span> `pcie`, `nvbandwidth`, `nccl_tests` | Quarantine affected GPU topology (or node if unisolatable) |
| **Clock throttling** | NVML clock-event reasons + power/temp vs. configured caps[^nvidiaNvmlApi2026] | Distinguish expected software power cap from thermal fault |
| **Poisoned CUDA context** | `cudaErrorIllegalAddress`, `cudaErrorLaunchTimeout` | Mandatory **kill and relaunch process** |

Remember <span data-glossary="kubernetes">Kubernetes</span> device-plugin behavior: when the GPU Operator marks a device unhealthy, Kubernetes lowers **allocatable** GPUs (preventing *new* placements), while **already-assigned pods remain scheduled** on that GPU until drained or killed by an eviction controller or operator.[^nvidiaGpuOperatorTroubleshooting2026][^kubernetesDevicePlugins2026]

### Respect asynchronous error reporting

Because <span data-glossary="cuda">CUDA</span> launches run asynchronously, an illegal memory access surfaces only at a later sync (`CUDA_LAUNCH_BLOCKING=1` isolates ordering during debug, never fleet-wide in production).[^cudaProgrammingGuide2026]

> **Common mistake:** Calling `cudaGetLastError()` twice and trusting a green HTTP `/health` probe. `cudaGetLastError()` clears the latched error register on first read, so a second call returns `cudaSuccess` even though an illegal address has permanently poisoned the CUDA context until the process is killed and relaunched.

<figure>
  <img src="illustrations/_generated/asynchronous_process_state_dark.png" alt="Failure propagation for an asynchronous CUDA illegal-address error: an async kernel enqueue lets the host continue until synchronization reveals the illegal address, cudaGetLastError clears the latched error on first read so a second call reports cudaSuccess, and an HTTP probe still returns 200 OK." />
  <figcaption>Asynchronous illegal-address faults surface at sync; `cudaGetLastError()` clears the code while leaving the context poisoned behind a green HTTP 200 probe.</figcaption>
</figure>

## Contain at smallest broken scope

Escalate containment only as far as telemetry proves necessary: **retry elsewhere** (idempotent requests only) -> **remove replica from readiness** -> **restart process** (fragmentation, process leak, or poisoned CUDA context) -> **quarantine GPU** (Xid 95, uncorrectable ECC, fabric fault) -> **cordon / drain node** (shared driver, power, cooling, or PCIe fault; note **cordon** stops new placements without evicting pods, whereas **drain** evicts unrelated tenants and wipes `emptyDir`).[^nvidiaGpuOperatorDriverUpgrades2026]

<figure>
  <img src="illustrations/_generated/owned_containment_path_dark.png" alt="Fault containment flow branching from stopping traffic and saving telemetry into worker scope, GPU quarantine scope, or node cordon and drain scope before converging on canary soak and traffic restoration." />
  <figcaption>Stop traffic and capture evidence first, contain at the smallest broken scope, and require canary soak before restoring full traffic.</figcaption>
</figure>

## Run diagnostics with an explicit question

DCGM diagnostics are active checks, not repairs: **Level 1** verifies basic deployment readiness, **Level 2** checks PCIe/NVLink/memory outside live traffic, and **Level 3/4** run stress, `nvbandwidth`, and `nccl_tests` strictly on quarantined idle GPUs.[^nvidiaDcgmDiagnostics2026][^nvidiaDcgmPlugins2026] **Pass** applies only to checks that executed; **Skip** or **Not Run** never clears a gate, and any extra **Fail** holds the device out of service.

<!-- leetllm: test, output=show -->
```python title="diagnostic-coverage.py"
def coverage_complete(required, results):
    return bool(required) and all(results.get(k) == "Pass" for k in required) and "Fail" not in results.values()

req = {"pcie", "nvbandwidth"}
for status in ("Skip", "Not Run", "Fail", "Pass"):
    print(f"nvbandwidth={status:7s} -> clear={coverage_complete(req, {'pcie': 'Pass', 'nvbandwidth': status})}")
assert not coverage_complete(req, {"pcie": "Pass", "nvbandwidth": "Pass", "memory": "Fail"})
```

<!-- leetllm: output:start -->
```text title="Output" output compact
nvbandwidth=Skip    -> clear=False
nvbandwidth=Not Run -> clear=False
nvbandwidth=Fail    -> clear=False
nvbandwidth=Pass    -> clear=True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/diagnostic_coverage_dark.png" alt="Diagnostic gate matrix requiring pcie and nvbandwidth coverage on a quarantined GPU: passing both tests clears the gate (CLEAR), while Skip, Not Run, Fail, or an extra memory Fail holds the device out of service (HOLD)." />
  <figcaption>Every required diagnostic must run and pass with zero extra failures; `Skip` and `Not Run` always hold quarantine.</figcaption>
</figure>

## Make ownership part of automation

Bind automation actions to explicit scope owners: serving teams own retries/readiness, workload owners own snapshot capture and pod restarts, platform GPU controllers own device quarantine, and cluster owners authorize node cordons/drains. Deduplicate alerts by GPU UUID and incident key into one durable quarantine latch so a quiet telemetry poll never clears an unverified GPU prematurely, and strip tenant prompt bodies from saved memory snapshots.

## Repair path for `gpu-a17`

For `r-7812` (no Xid/ECC, native split fragmentation + 2.68 GiB outside delta): mark `summarizer-7f9d6` unready, save the snapshot and NVML process list, relaunch the worker process (without draining `gpu-a17`), verify idle baseline memory, run a multi-cycle canary reproducing the 1.50 GiB allocation shape, and ramp traffic only after every gate clears.

<figure>
  <img src="illustrations/_generated/gpu_health_drain_recovery_dark.png" alt="GPU health state machine and recovery pipeline: Healthy serving transitions on contained Xid 94 to draining inflight requests and restarting the pod, whereas Xid 95, uncorrectable ECC, or NVLink faults escalate to GPU cordon, checkpoint save, GPU reset with DCGM Level 2 and 3 verification, and burn-in canary checks before restoring traffic." />
  <figcaption>Xid 94 drains and restarts the worker; Xid 95, uncorrectable ECC, and NVLink faults escalate to GPU quarantine, reset, DCGM L2/L3 verification, and canary burn-in.</figcaption>
</figure>

## Recovery telemetry analyzer

Run [analyze_gpu_snapshots.py](assets/analyze_gpu_snapshots.py) across eight recorded incidents in [gpu_failure_snapshots.json](assets/gpu_failure_snapshots.json), then model split-hole OOM risk and Xid 94 vs. Xid 95 availability in SciPy:[^nvidiaCudaRuntimeErrors2026]

<!-- leetllm: test, output=show, deps=numpy,scipy -->
```python title="analyze-and-model-gpu-snapshots.py"
import runpy
import numpy as np
from scipy import stats

runpy.run_path("assets/analyze_gpu_snapshots.py", run_name="__main__")

rng = np.random.default_rng(42)
even_holes = rng.dirichlet(np.full(7, 8.0), size=5000) * 6.10
skew_holes = rng.dirichlet(np.full(7, 1.2), size=5000) * 6.10
print(f"split OOM prob: even={np.mean(even_holes.max(axis=1) < 1.50):.3f}, "
      f"skewed={np.mean(skew_holes.max(axis=1) < 1.50):.3f}")

mtbf_min = 720.0 * 60
down_94 = stats.expon(scale=0.5).mean()          # ~30s drain + pod restart
down_95 = stats.lognorm(s=0.35, scale=8.0).mean() # reset + DCGM L3 soak
print(f"availability: Xid94={mtbf_min / (mtbf_min + down_94):.5f}, "
      f"Xid95={mtbf_min / (mtbf_min + down_95):.5f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
r-7812: allocator-fragmentation | outside=2.68 GiB | must_relaunch=False
r-7813: application-capacity | outside=0.20 GiB | must_relaunch=False
r-7814: outside-pytorch | outside=16.40 GiB | must_relaunch=False
r-7815: device-memory-fault | outside=1.10 GiB | must_relaunch=False
r-7816: fabric-fault | outside=1.00 GiB | must_relaunch=False
r-7817: clock-limited | outside=1.00 GiB | must_relaunch=False
r-7818: process-corrupted | outside=0.70 GiB | must_relaunch=True
r-7819: driver-runtime | outside=unknown | must_relaunch=False
split OOM prob: even=0.835, skewed=0.090
availability: Xid94=0.99999, Xid95=0.99980
```
<!-- leetllm: output:end -->

### Hold the memory layout constant

Identical memory counters map to different verdicts depending on the event status and allocator backend: a recorded `success` with a stale request size is not an OOM, a missing request size leaves OOM `oom-unresolved`, and `cudaMallocAsync` withholds native split-block inference.

<figure>
  <img src="illustrations/_generated/same_layout_different_event_dark.png" alt="Four telemetry interpretations of the same 40.00 GiB memory breakdown: OOM with 1.50 GiB request classifies as Split OOM, success with stale size records No failure, OOM with missing or zero size stays Unresolved, and cudaMallocAsync skips native split-block inference." />
  <figcaption>The same 40.00 GiB breakdown yields Split OOM, No failure, Unresolved, or non-native allocator depending on event status, request size, and allocator backend.</figcaption>
</figure>

## When two signals arrive together

When `r-7818` raises both `illegal_address` and `Xid 31`, the analyzer routes device triage to `xid-event` while independently setting `must_relaunch=True` so killing the poisoned worker never waits on hardware review; missing NVML readings remain `None` (`unknown`), never `0.00 GiB`:

<!-- leetllm: test, output=show -->
```python title="mixed-signal-snapshot.py"
import json, runpy
from pathlib import Path

classify = runpy.run_path("assets/analyze_gpu_snapshots.py")["classify"]
rows = json.loads(Path("assets/gpu_failure_snapshots.json").read_text())

mixed = classify(dict(rows[6], new_xids=[31]))
missing = classify(dict(rows[0], nvml_device_used_gib=None))
async_alloc = classify(dict(rows[0], allocator_backend="cudaMallocAsync"))
print(f"Xid31+illegal_addr -> {mixed['hypothesis']}, relaunch={mixed['must_relaunch']}")
print(f"missing NVML       -> {missing['hypothesis']}, outside={missing['outside_gib']}")
print(f"cudaMallocAsync    -> {async_alloc['hypothesis']}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Xid31+illegal_addr -> xid-event, relaunch=True
missing NVML       -> incomplete-memory, outside=None
cudaMallocAsync    -> oom-unresolved
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/independent_process_relaunch_dark.png" alt="Fan-out classification on snapshot r-7818 with Xid 31 and illegal_address: Xid 31 sets primary hypothesis xid-event for device checking while illegal_address independently sets must_relaunch True." />
  <figcaption>Co-occurring faults keep device triage and mandatory process relaunch decoupled, and missing NVML telemetry stays `None` instead of fabricating zero.</figcaption>
</figure>

## Pitfalls that widen blast radius

- Treating cached `reserved - allocated` as a leak without inspecting split blocks, or blaming PyTorch without attributing outside NVML usage.
- Retrying inside a poisoned CUDA context after `cudaGetLastError()` clears the code.
- Treating `Skip` as `Pass` in DCGM, restarting before saving snapshots, or draining a shared multi-tenant node for a single-process OOM.
- Returning a GPU to full traffic after a single-request HTTP probe instead of a multi-cycle canary soak.

## Check your understanding

```mastery-quiz
[
  {
    "question": "A 32 GiB snapshot records PyTorch allocated 21 GiB, reserved 27 GiB, inactive splits 4.5 GiB, NVML device-used 30.25 GiB, and a failed 2.5 GiB request. What are the reserve gap, outside-PyTorch memory, and request deficit above device-free memory?",
    "options": [
      "6.0 GiB; 3.25 GiB; 0.75 GiB.",
      "4.5 GiB; 9.25 GiB; 0.75 GiB.",
      "6.0 GiB; 3.25 GiB; -0.75 GiB.",
      "6.0 GiB; 1.50 GiB; 0.75 GiB."
    ],
    "answer": "6.0 GiB; 3.25 GiB; 0.75 GiB.",
    "explanation": "Reserve gap = 27 - 21 = 6.0 GiB; outside PyTorch = 30.25 - 27 = 3.25 GiB; device free = 32 - 30.25 = 1.75 GiB, so the 2.5 GiB request exceeds device free by 0.75 GiB."
  },
  {
    "question": "Worker P hits `cudaErrorLaunchFailure` while Worker Q hits an ordinary CUDA OOM. Both call `cudaGetLastError()` twice (seeing `cudaSuccess` on the second call) and pass HTTP `/health`. Which process requires mandatory kill and relaunch?",
    "options": [
      "Neither; `cudaSuccess` and HTTP 200 clear both.",
      "Worker P only; both still need normal health checks before traffic.",
      "Worker Q only; OOM always corrupts the CUDA context.",
      "Both P and Q require mandatory GPU reset."
    ],
    "answer": "Worker P only; both still need normal health checks before traffic.",
    "explanation": "`cudaErrorLaunchFailure` permanently poisons P's CUDA context despite `cudaGetLastError()` clearing the error register; ordinary OOM leaves Q's context intact."
  },
  {
    "question": "A 4-GPU Kubernetes node has 4 assigned pods when the GPU Operator device plugin marks 1 GPU unhealthy. Without a separate eviction controller, what changes?",
    "options": [
      "Capacity 3, allocatable 3; the assigned pod is evicted immediately.",
      "Capacity 4, allocatable 3; the assigned pod stays scheduled on that GPU.",
      "Capacity 4, allocatable 4; the assigned pod is evicted immediately.",
      "Capacity 3, allocatable 4; the assigned pod stays scheduled."
    ],
    "answer": "Capacity 4, allocatable 3; the assigned pod stays scheduled on that GPU.",
    "explanation": "The device plugin reduces allocatable GPUs to block new placements, but does not retrospectively evict already-running pods."
  },
  {
    "question": "A GPU raises Xid 94 on Worker A and a second GPU raises Xid 95 on Worker B. Which recovery scope matches NVIDIA's Xid catalog?",
    "options": [
      "Reset GPU A immediately; restart only Worker B.",
      "Restart affected Worker A; isolate and reset GPU B (plus DCGM verification) before restarting apps.",
      "Drain both nodes immediately.",
      "Restart both workers without resetting either GPU."
    ],
    "answer": "Restart affected Worker A; isolate and reset GPU B (plus DCGM verification) before restarting apps.",
    "explanation": "Xid 94 is a contained memory error (restart affected app; other apps survive), whereas Xid 95 is uncontained and requires GPU reset and verification before restarting workloads."
  },
  {
    "question": "A quarantined GPU runs DCGM with required checks `pcie` and `nvbandwidth`. Both report `Pass`, while an extra `memory` check reports `Fail`. What should operations do?",
    "options": [
      "Return the GPU to canary traffic since both required checks passed.",
      "Hold quarantine and inspect the full memory diagnostic code and error message.",
      "Ignore the memory check unless an Xid also fires.",
      "Replace the GPU hardware immediately without inspecting setup errors."
    ],
    "answer": "Hold quarantine and inspect the full memory diagnostic code and error message.",
    "explanation": "Any failing diagnostic holds quarantine until investigated, because raw Fail can indicate either hardware trouble or configuration mismatch."
  },
  {
    "question": "A 5-entry `_record_memory_history` ring buffer records events 1 through 8 in order without an earlier dump. Which events remain in the snapshot?",
    "options": [
      "Events 1, 2, 3, 4, 5.",
      "Events 3, 4, 5, 6, 7.",
      "Events 4, 5, 6, 7, 8.",
      "Events 1, 2, 6, 7, 8."
    ],
    "answer": "Events 4, 5, 6, 7, 8.",
    "explanation": "A finite ring buffer overwrites the oldest entries (1, 2, 3), leaving the 5 newest events (4..8)."
  }
]
```

> **Next:** Continue to [LLM Observability & Monitoring](/learn/observability-monitoring-llm-systems).
