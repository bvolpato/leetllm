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
  "section": "Inference & Production Scale",
  "order": 28,
  "prerequisites": [
    "llm-deployment-gpu-serving-autoscaling",
    "cuda-gpu-computing-for-ml",
    "gpu-profiling-correctness-benchmarking",
    "kv-cache-paged-attention-llm-serving",
    "training-run-operations"
  ],
  "relatedQuestions": [
    "distributed-inference-data-plane",
    "advanced-mlops-devops-ai",
    "serving-benchmark-engineering",
    "model-parallelism-for-llm-inference",
    "continuous-batching-request-scheduling",
    "design-multi-tenant-llm-serving-platform"
  ]
}
---

A serving dashboard reports only `CUDA out of memory`, naming a failed allocation without revealing its operational scope. Request `r-7812` asks replica `summarizer-7f9d6` for another 1.50 GiB and fails, while node `gpu-a17` still answers health checks and peer replicas keep serving traffic.

The initial telemetry snapshot gives more detail:

```text title="failure snapshot"
node=gpu-a17  pod=summarizer-7f9d6  gpu=GPU-7f3
capacity=40.00 GiB  device_free=0.62 GiB
pytorch_allocated=30.10 GiB  pytorch_reserved=36.70 GiB
inactive_split_blocks=6.10 GiB  largest_inactive_split_block=0.88 GiB
allocation_request=1.50 GiB
nvml_device_used=39.38 GiB  new_xids=[]  new_uncorrectable_ecc=0
```

No single repair command follows from this snapshot. A request retry, process restart, device quarantine, and node drain act at very different scopes. Stop new work from reaching the failing replica first, then use memory and hardware telemetry to justify the smallest sufficient repair. What additional state must that snapshot capture?

```checkpoint
Why is `CUDA out of memory` insufficient evidence for draining `gpu-a17`?
---
The error names a failed allocation in one process. It doesn't yet distinguish live application demand, allocator fragmentation, memory held outside PyTorch, a stale process, or a device fault. Draining the node would evict unrelated workloads before that scope is known.
```

## Build an incident snapshot before changing state

An incident snapshot connects the failed request to what the process, device, node, and cluster were doing at the same instant. That gives readiness and traffic-routing checks a concrete job: take this worker out of rotation while you inspect state. <span data-glossary="pytorch">PyTorch</span> can record allocator history and dump a snapshot for `memory_viz`, its memory visualizer. That snapshot includes allocator allocations and OOM events, but only for memory managed by that allocator.[^pytorchCudaMemory2026]

For `r-7812`, preservation comes before restart:

1. Remove the replica from application readiness so new work stops arriving.
2. Record request ID, pod UID, container restart count, PID, node, GPU UUID, model revision, allocator backend and configuration, <span data-glossary="cuda">CUDA</span> runtime, driver, and timestamps.
3. Dump the PyTorch memory snapshot if the process still responds.
4. Record device-wide memory, process accounting, ECC counters, clocks, power, <span data-glossary="temperature">temperature</span>, Xid events, and device-plugin health.
5. Copy logs and artifacts to incident storage with access controls.
6. Only then choose containment and repair scope.

A process exit destroys unsaved allocator history. A reset or reboot can erase volatile device evidence and logs. Capture what you can within a bounded incident deadline; don't delay required isolation or termination while a broken process hangs on a snapshot call. Preservation isn't permission to collect another tenant's prompts, model inputs, or <span data-glossary="secrets-management">secrets</span>.

<figure>
  <img src="illustrations/_generated/layered_triage_memory_dark.png" alt="Incident r-7812 memory breakdown across a 40.00 GiB HBM device: 30.10 GiB PyTorch allocated sits inside 36.70 GiB reserved, leaving 6.10 GiB of inactive split blocks and 0.50 GiB other reserve, with 2.68 GiB allocated outside PyTorch and 0.62 GiB free on the device. A companion bar comparison places the failed 1.50 GiB request between the 2.68 GiB outside allocation and the 0.88 GiB largest inactive split block." />
  <figcaption>The 40.00 GiB HBM stack separates 30.10 GiB live PyTorch allocations, 6.10 GiB inactive splits, 0.50 GiB other reserve, 2.68 GiB outside PyTorch, and 0.62 GiB device free. Comparing against the 1.50 GiB request shows why fragmented holes below 0.88 GiB force OOM.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/fragmented_allocation_shape_dark.png" alt="Physical fragmentation layout for r-7812 across seven inactive holes separated by pinned live segments: six 0.88 GiB holes and one 0.82 GiB hole total 6.10 GiB, yet every individual gap falls short of the 1.50 GiB request." />
  <figcaption>Six 0.88 GiB holes and one 0.82 GiB hole sum to 6.10 GiB, yet live segments pin them apart so none satisfies the 1.50 GiB allocation request.</figcaption>
</figure>

The snapshot separates several distinct memory quantities:

| View | Exact value | What it can support | What it can't prove |
|---|---:|---|---|
| PyTorch allocated | 30.10 GiB | Live <span data-glossary="tensor">tensor</span> blocks known to allocator | Which tensor is semantically necessary |
| PyTorch reserved | 36.70 GiB | Segments allocator still holds | Contiguous availability for a 1.50 GiB request |
| Reserved minus allocated | 6.60 GiB | Allocator accounting gap to reconcile in snapshot | Bytes currently inactive and reusable |
| Inactive split blocks | 6.10 GiB | Free fragments trapped in partly active segments at OOM | One reusable block of sufficient size |
| Largest inactive split block | 0.88 GiB | Largest observed fragment in snapshot | Future allocation layout after workload changes |
| NVML device used | 39.38 GiB | Whole-device usage across CUDA users | Ownership without process or subsystem attribution |
| NVML used minus reserved | 2.68 GiB | Approximate use outside PyTorch reserve | Whether <span data-glossary="nccl">NCCL</span>, another process, or driver state owns it |

`reserved - allocated` is an accounting gap, not a reusable-byte counter. The snapshot's 6.10 GiB of inactive split blocks suggests fragmentation, because its largest observed fragment is only 0.88 GiB. Inspect segments, pending frees, stream ordering, and allocator pools before claiming those are all possible sources of space. A free fragment in one segment can't be added to a nonadjacent fragment to satisfy one allocation.

The outside-PyTorch delta also matters. The request exceeds device-free memory by `1.50 - 0.62 = 0.88 GiB`; the 2.68 GiB delta is larger than that deficit. Releasing part of that delta might relieve the pressure, though the counters alone do not identify which process or buffer holds it. Treat **fragmentation under memory pressure** as a working hypothesis and verify allocator state alongside device-process ownership.

The subtraction assumes the same physical GPU, compatible accounting scope, and nearly simultaneous samples. Match GPU UUID and, when applicable, MIG instance identity. Missing NVML readings, counter resets, or mismatched device scopes are missing evidence, never zero usage.

Record the NVML query version too. NVML v2's `reserved` field describes system reservation, which it includes in device-used memory; it isn't PyTorch's allocator reserve. On systems where GPUs are NUMA nodes, operating-system framebuffer accounting can retain pages after a process terminates. Device-used bytes remaining after exit therefore don't, by themselves, prove a stale CUDA process.[^nvidiaNvmlApi2026]

```checkpoint
One replica captures an OOM without any new device-fault finding. Snapshot export now hangs, and the capture timeout expires. Which action preserves operational evidence without stalling recovery?

1. Keep new traffic paused and extend the hanging dump indefinitely before isolating the worker.
2. Restore new traffic and use successful requests to reconstruct the lost allocator history.
3. Force a shared-device reset immediately so the node clears all processes and old snapshots.
4. Keep new traffic paused, retain whatever history finished writing, and proceed with worker isolation.
---
**Answer:** Keep new traffic paused, retain whatever history finished writing, and proceed with worker isolation.

Timed snapshot capture must not stall worker isolation or process restart. Because process exit destroys unsaved in-memory history, save what already flushed along with why the dump timed out. Absent hardware fault findings, an allocator hang does not justify resetting a shared GPU.
```

## Keep memory layers separate

When a GPU looks full, it's tempting to call it a leak. That label doesn't tell you what to repair. Separate four common software layers first.

| Layer | Strong evidence | Typical containment | Repair question |
|---|---|---|---|
| Application allocations | Allocated memory tracks batch, sequence, <span data-glossary="kv-cache">KV cache</span>, workspace, or retained tensors | Reject, shed, or reroute excess work | Which live state exceeded the worker capacity envelope? |
| Allocator reservation | Reserved stays above allocated; snapshot shows inactive blocks and split segments | Remove replica, preserve snapshot, restart process if policy allows | Is layout fragmented, or is cached reserve expected? |
| Non-PyTorch allocation | NVML/device use materially exceeds PyTorch reserve | Attribute libraries and processes before tuning allocator | Does NCCL, direct CUDA allocation, or another framework own it? |
| Process leak | Device process list shows stale or duplicate owners after expected teardown | Stop scheduling to affected device; owner terminates orphan PIDs | Which lifecycle failed to release the process or context? |

PyTorch explicitly warns that its memory profiler can't see allocations made directly through CUDA APIs. NCCL is a documented example. `torch.cuda.device_memory_used()` provides a device-wide cross-check, and NVML exposes device and process telemetry for independent attribution.[^pytorchCudaMemory2026][^nvidiaNvmlApi2026]

Don't treat `reserved - allocated` as wasted memory by definition. The caching allocator holds segments so later allocations avoid expensive device synchronization. Fragmentation becomes plausible when an OOM snapshot shows enough inactive split bytes but no fragment large enough for the failed request. PyTorch allocator configuration can change split behavior, yet tuning it before identifying the workload shape can mask a queue-gating or batch-sizing bug.[^pytorchCudaSemantics2026]

This analysis assumes PyTorch's native caching allocator. With `backend:cudaMallocAsync`, allocator statistics carry backend-specific semantics, and native split-block tuning options don't apply. Record the backend name in every snapshot rather than applying native split rules across backends.[^pytorchCudaSemantics2026]

### Record a finite allocator history

Enable history before the incident window when overhead and privacy policy permit:

```python title="allocator-history.py"
import torch

torch.cuda.memory._record_memory_history(
    enabled="all",
    context="all",
    stacks="python",
    max_entries=100_000,
)

torch.cuda.memory._dump_snapshot("r-7812-memory.pickle")
```

Enable history before the workload runs and dump the snapshot from that same GPU process near the failure. Because the leading `_` marks private PyTorch APIs, pin and test against your fleet's PyTorch version; `memory_viz` inspects the dumped file locally without uploading it.[^pytorchCudaMemory2026] Treat snapshots as sensitive artifacts since Python stack traces and paths can expose internal details.

History is a ring buffer, not an infinite flight recorder. Once `max_entries` fills, the oldest entries are overwritten. Large histories can also produce multi-gigabyte dumps, so pick a practical entry window, record the recording start time and limit alongside the snapshot, and dump promptly around the failure. A snapshot with no OOM event often means recording started too late or the ring wrapped, not that the alert was false.

<figure>
  <img src="illustrations/_generated/finite_allocator_history_dark.png" alt="A 100,000-entry PyTorch allocator ring buffer flows from start to OOM capture, wraps over oldest records, and dumps before process exit. A breakdown bar distinguishes overwritten, retained, and post-OOM slices, alongside failure modes for post-OOM recording start and hung dumps." />
  <figcaption>The 100,000-entry ring buffer overwrites older records once full. Starting capture after an OOM misses the event completely, and hung dumps should time out cleanly so worker recovery can proceed.</figcaption>
</figure>

```checkpoint
A snapshot shows 6.10 GiB across inactive split blocks, but NVML reports 2.68 GiB more device use than PyTorch reserved. What should you conclude?
---
Two hypotheses remain. Allocator layout may block the 1.50 GiB request, while another CUDA user owns about 2.68 GiB. Inspect snapshot blocks and attribute device processes or libraries. Neither number alone proves a leak.
```

## Classify beyond memory

An OOM may be the last visible symptom rather than the first failure. A collective can stall or a peer can disappear. Requests then accumulate, leaving healthy ranks holding buffers until an allocation fails. Check device and node evidence alongside allocator history. NVML is NVIDIA's Management Library; DCGM is its Data Center GPU Manager. ECC means error-correcting code memory protection. An Xid is a driver-reported error code, not a verdict that the physical GPU is broken.

| Fault class | Evidence to correlate | Why symptom can mislead | Initial scope |
|---|---|---|---|
| ECC or device fault | New uncorrectable ECC, <span data-glossary="gpu">GPU</span> UUID, kernel timestamp, device health | OOM or timeout can follow lost device access | Device or node quarantine pending memory-error guidance |
| Xid event | Exact code, GPU UUID, kernel timestamp, catalog action, nearby events | Same code family can reflect application, NVIDIA software, or hardware | Scope named by event-specific catalog and surrounding evidence |
| PCIe or NVLink fault | <span data-glossary="nvidia-dcgm">DCGM</span> PCIe, NVLink, nvbandwidth, or NCCL test; link counters; peer topology | One slow or failed rank appears as a distributed timeout | Affected GPU topology, then node if isolation is unavailable |
| Clock limiting | Exact clock-event reasons, configured limits, temperature, power, clocks, workload phase | An expected power cap and a thermal fault can both reduce clocks | Replica first; platform path if unexpected under controlled load |
| Driver or runtime fault | Driver/runtime versions, module logs, NVML initialization, DCGM software test | Application sees initialization or unknown CUDA error | Stop traffic; platform owner validates driver/runtime compatibility |
| CUDA process-state fault | Exact CUDA error, first failing operation, synchronization point | Asynchronous execution reports an earlier failure later | Process, unless device evidence expands scope |

NVML clock-event reasons name the active limiter, not its root cause. GPU idle and configured application clocks can be expected. Software power cap means clocks are respecting a configured power limit, while thermal slowdown points to temperature protection. Correlate reason, workload phase, configured limits, measured power, and temperature before calling it a fault.[^nvidiaNvmlApi2026]

An Xid entry is not a root cause label. NVIDIA states that Xid events can arise from hardware, NVIDIA software, or an application. Recovery actions differ by event, and newer catalog guidance can attach a specific recovery action to the reported event.[^nvidiaXidIntroduction2026][^nvidiaXidCatalog2026]

For example, the current catalog distinguishes **Xid 94**, a contained memory error requiring restart of the affected application, from **Xid 95**, an uncontained memory error requiring GPU reset before applications restart. With Xid 94, other running applications are unaffected and reset is recommended when convenient. Contained describes the error's scope, not whether the GPU was idle or whether the affected application survived. A reset still belongs to the platform owner.[^nvidiaXidCatalog2026]

The GPU Operator device plugin listens for health events and can report a GPU unhealthy. <span data-glossary="kubernetes">Kubernetes</span> then lowers allocatable device count, but pods already assigned to that device remain assigned and may fail or crash-loop.[^nvidiaGpuOperatorTroubleshooting2026][^kubernetesDevicePlugins2026] Application readiness and workload containment still need an explicit controller or operator action. Device-plugin health alone is not retrospective eviction.

### Respect asynchronous error reporting

This is why the first observed error deserves careful handling: CUDA work is asynchronous. An API call can enqueue work and return before the device executes it, so an error may surface only at a later synchronization point. Record the first observed failure, stream, request, kernel, and correlation timestamp. In a controlled debug run, `CUDA_LAUNCH_BLOCKING=1` can help reproduce ordering. It alters execution, so don't enable it fleet-wide in production.[^cudaProgrammingGuide2026]

> **Common mistake:** Calling `cudaGetLastError()` twice and trusting a green HTTP probe. `cudaGetLastError()` reads and *clears* the error register, so a second call returns `cudaSuccess` even when an illegal address or launch timeout has permanently poisoned the CUDA context. Preserve the first error enum, take the worker out of rotation, and kill and relaunch the process.

<figure>
  <img src="illustrations/_generated/asynchronous_process_state_dark.png" alt="Failure propagation for an asynchronous CUDA illegal-address error: an async kernel enqueue lets the host continue until synchronization reveals the illegal address, cudaGetLastError clears the latched error on first read so a second call reports cudaSuccess, and an HTTP probe still returns 200 OK even though the CUDA context stays poisoned until capture, kill, and relaunch." />
  <figcaption>A later synchronization reveals an earlier illegal-address failure. Calling cudaGetLastError clears the error record while leaving the CUDA context poisoned, so HTTP health probes still pass until the worker is killed and relaunched.</figcaption>
</figure>

```checkpoint
Under a controlled workload, the clock reason is software power cap and measured power matches the configured limit. There is no new ECC/Xid evidence. Which follow-up tests a cause rather than promoting this label directly to hardware failure?

1. Compare repeated event names, then classify repeated software power cap as a hardware fault.
2. Compare the configured cap with enforcement, then choose node drain when those values agree.
3. Compare approved limits, matched-workload power and regression timing before choosing scope.
4. Compare performance after disabling the cap, then use that new operating point to certify the old one.
---
**Answer:** Compare approved limits, matched-workload power and regression timing before choosing scope.

The reason says the clocks are enforcing a limit. Whether that limit is appropriate requires workload, configuration and regression evidence. Thermal and other reason families have their own mechanisms.
```

## Contain at smallest broken scope

Once you have a working classification, pick the repair scope with this ladder. Start at the smallest scope that protects users or hardware, and widen the isolation only when telemetry calls for it.

| Action | Appropriate evidence | What must be true first | Why a broader action is risky |
|---|---|---|---|
| Retry request elsewhere | Idempotent or deduplicated request; healthy alternate replica; failed process still trustworthy or excluded | Retry budget and side-effect rules allow replay | Blind retries amplify memory pressure and duplicate side effects |
| Remove replica from readiness | One worker is unhealthy or near its memory envelope | Gateway and scheduler honor readiness quickly | Traffic can keep reaching a process that should be preserved |
| Restart process | Allocator fragmentation, process leak owned by replica, or fatal CUDA process-state error | Bounded evidence capture attempted; restart budget permits it | Restart erases volatile evidence and can loop on a bad device |
| Quarantine GPU | New uncorrectable ECC, isolation-requiring Xid action, fabric finding, or repeated device-scoped evidence | Device identity and cluster owner are known | Shared node may lose capacity; peer topology can be affected |
| Cordon or drain node | Node-wide driver, fabric, power, cooling, or repair requirement | Platform owner authorizes scope; workload disruption reviewed | Drain can evict unrelated tenants and destroy local ephemeral data |

Cordon and drain aren't synonyms. Cordoning makes the node unschedulable for new pod placements without evicting existing pods. Draining requests pod eviction and may block on disruption budgets. Marking a replica unready also leaves active requests and open connections running, so disable local request scheduling cleanly before killing or restarting anything.[^nvidiaGpuOperatorDriverUpgrades2026]

<figure>
  <img src="illustrations/_generated/owned_containment_path_dark.png" alt="Fault containment flow branching from stopping traffic and saving telemetry into worker scope, GPU quarantine scope, or node cordon and drain scope before converging on canary soak and traffic restoration." />
  <figcaption>Start containment by stopping traffic and saving telemetry, then isolate only the smallest broken scope before running a canary soak.</figcaption>
</figure>

For `r-7812`, rerouting a retry still requires an idempotent operation. Take the failing replica out of readiness while handling in-flight requests cleanly, and preserve the allocator snapshot if possible. OOM alone doesn't require process relaunch, though policy may restart the worker if allocator pressure keeps recurring. The incident snapshot records no new ECC or Xid events; gather link, thermal, and power readings before clearing hardware causes, and do not drain the node without node-level fault telemetry.

```checkpoint
An illegal-address error appears after a request, but the next health check passes. May the worker serve another request?
---
No. CUDA documents illegal address as leaving the process in an inconsistent state. Remove the worker from readiness, preserve logs, kill and relaunch the process, and verify clean canary passes before restoring traffic. A passing HTTP probe cannot clear a corrupted CUDA context.
```

```checkpoint
A GPU driver event catalog marks Xid A as contained to a single process (restart that process) and Xid B as uncontained across multiple applications (reset the GPU before relaunching processes). Worker A raises Xid A while worker B raises Xid B. Which recovery order follows?

1. A GPU reset before app restart; B affected-app restart without device reset.
2. A affected-app restart; B app restart followed by a convenient later GPU reset.
3. A affected-app restart; B owner-controlled GPU reset before application restart.
4. A GPU reset before app restart; B app restart followed by an HTTP probe.
---
**Answer:** A affected-app restart; B owner-controlled GPU reset before application restart.

Follow the catalog's event-specific recovery order: Xid 94 errors permit draining and restarting only the affected process, whereas Xid 95 requires isolating the device, saving state, resetting the GPU, and verifying DCGM checks before restarting workloads. Platform cluster policy controls who may trigger the shared-GPU reset.
```

## Run diagnostics with an explicit question

DCGM diagnostics are active tests, not repair commands. NVIDIA describes four levels:

| DCGM level | Intended operational use | Representative additions | Scheduling rule |
|---|---|---|---|
| Level 1 | Fast readiness signal before work | Deployment and software checks | May serve as a pre-traffic health check after local validation |
| Level 2 | Failure epilogue or brief health check | PCIe, memory, memory bandwidth, NVLink | Run outside user traffic when tests can contend |
| Level 3 | Admin post-mortem | Diagnostic stress, targeted power/stress, nvbandwidth, NCCL tests | Quarantined or idle hardware only |
| Level 4 | Extended post-mortem | Longer memory and pulse-style coverage | Maintenance window with platform ownership |

Exact tests depend on DCGM version, hardware, driver, and installed plugins. In the current run-level table, `pcie` covers PCIe and NVLink checks; `nvbandwidth` and `nccl_tests` start at Level 3, not Level 2. A named test may be unavailable. **Pass** applies only to checks that ran, **Fail** may be a device finding or setup error, and **Skip** or **Not Run** supplies no health verdict.[^nvidiaDcgmDiagnostics2026][^nvidiaDcgmPlugins2026]

Ask one question per run:

* “Can this GPU enumerate and pass deployment checks?” points toward Level 1.
* “Did memory or PCIe fail around this incident?” points toward selected Level 2 tests.
* “Can the quarantined <span data-glossary="tensor-parallelism">tensor-parallel</span> topology sustain fabric traffic?” points toward nvbandwidth or NCCL plugins at an admin level.
* “Does the device reproduce a memory or power failure under burn-in?” points toward selected stress tests on idle hardware.

Record command, DCGM version, selected entities, test names, parameters, wall time, plugin availability, raw result, and exit status. DCGM runs selected diagnostics; operators must interpret the results and perform repairs. A passing suite narrows evidence while Xid events and future health remain separate checks.[^nvidiaDcgmDiagnostics2026]

## Make ownership part of automation

Before automation touches a shared GPU node, ask who owns the request, process, device, and node. One team may cover several, but the decisions and escalation triggers are still distinct:

| Scope | Owner decision | Automation may do safely | Escalation trigger |
|---|---|---|---|
| Request | Serving team | Bound retries, deduplicate effects, route away from unhealthy replica | Side-effect ambiguity or exhausted retry budget |
| Process or pod | Workload owner | Toggle readiness, preserve app snapshot, restart within disruption budget | Repeated crash or cross-process memory owner |
| GPU device | Platform GPU controller | Mark device unavailable, attach evidence, stop new allocation | New uncorrectable ECC, isolation-requiring Xid action, fabric finding, or repeated burn-in failure |
| Node and rack | Cluster or hardware owner | Cordon, drain, repair, reboot, or replace under policy | Shared driver, cooling, power, PCIe, or topology fault |

Error-aware automation consumes structured facts, not log substrings alone. A useful event includes GPU UUID, node UID, workload UID, process identity, exact CUDA or Xid code, source, first and last timestamps, recurrence count, and evidence links. Its transition should be idempotent: one device fault creates one quarantine record, not a storm of repeated drains.

Never let a workload controller reset a shared GPU or drain a node by inference. NVIDIA's own GPU Operator upgrade workflow separates cordon, workload termination, validation, and uncordon. Its documentation warns that full drain can evict unrelated pods and can permanently remove `emptyDir` data.[^nvidiaGpuOperatorDriverUpgrades2026] Production remediation requires equivalent scope checks and explicit platform permissions.

Preserved evidence also needs tenancy controls:

* Snapshot allocator metadata, not prompt bodies, unless incident policy explicitly requires content.
* Restrict process lists and command lines when they expose another tenant's paths or arguments.
* Attach retention, encryption, and access policy to saved snapshots.
* Store stable IDs and hashes so responders can correlate without copying sensitive payloads.

## Repair path for `gpu-a17`

Now apply the scope ladder to `gpu-a17`. Given the current incident snapshot, keep the repair narrow:

1. **Contain:** Set `summarizer-7f9d6` not ready. Stop scheduler traffic to its process.
2. **Preserve:** Save snapshot, application logs, exact versions, NVML memory and process view, ECC counters, clocks, power, temperature, and kernel Xid window.
3. **Classify:** Confirm `30.10 GiB` allocated, `36.70 GiB` reserved, `6.10 GiB` inactive across split blocks, `0.88 GiB` largest fragment, and `39.38 GiB` device-wide use. Attribute the `2.68 GiB` delta.
4. **Repair process:** Finish or reject in-flight work according to the request timeout policy. Relaunch the serving process under its normal supervisor.
5. **Prove baseline:** Load the same model revision and configuration. Confirm expected idle memory and the expected process owners for this isolation mode.
6. **Burn in:** Replay a bounded canary workload that includes the 1.50 GiB allocation shape. Watch allocator headroom, device-wide delta, Xid/ECC, link status, clocks, temperature, power, and latency.
7. **Restore traffic:** Route only a small canary traffic fraction at first. Expand after a fixed observation window with no gate failure.

If fragmentation returns under normal serving traffic, process restart was only containment, not repair. Revisit queue caps, KV-cache sizing, batch and sequence limits, workspace lifetime, CUDA graph pools, and allocator configuration. If outside-PyTorch use grows, attribute NCCL, custom CUDA, peer processes, or context lifecycle before changing allocator settings.

### Recovery verification gates

Restarting `r-7812` may restore the worker. Verify device and topology health with explicit pass/fail checks before returning it to traffic:

| Gate | Example evidence | Failure action |
|---|---|---|
| Identity | Expected GPU UUID, driver/runtime pair, model revision, and process owners for the isolation mode | Hold traffic and resolve inventory mismatch |
| Idle baseline | Device-wide and allocator memory inside known band | Investigate stale process, context, or changed model footprint |
| Functional probe | Deterministic canary returns expected shape and status | Keep replica out of readiness |
| Memory envelope | Peak allocated, reserved, largest reusable block, and outside delta remain within policy | Adjust workload or allocator plan before retry |
| Device health | No new disqualifying Xid/ECC; required DCGM checks ran and passed | Keep quarantined; follow event-specific owner runbook |
| Fabric health | Required peer path and selected fabric tests pass on affected topology | Keep topology unavailable |
| Thermal and power | Clocks, temperature, and power within workload-approved bands during bounded load | Investigate unexplained limits before escalating cooling, power, or hardware |
| Soak | Fixed request count or duration completes without recurrence | Extend quarantine and compare snapshots |

Burn-in must resemble the failed allocation and communication shape without carrying production traffic. "One inference succeeded" misses fragmentation that emerges after many allocation cycles and fabric faults that need multi-GPU load. Define duration, load, pass thresholds, and abort conditions before starting.

<figure>
  <img src="illustrations/_generated/gpu_health_drain_recovery_dark.png" alt="GPU health state machine and recovery pipeline: Healthy serving transitions on contained Xid 94 to draining inflight requests and restarting the pod, whereas Xid 95, uncorrectable ECC, or NVLink faults escalate to GPU cordon, checkpoint save, GPU reset with DCGM Level 2 and 3 verification, and burn-in canary checks before restoring traffic." />
  <figcaption>Separate fault recovery by hardware state: contained Xid 94 restarts only the worker after draining inflight work, while uncontained Xid 95, ECC, and NVLink errors cordon the GPU, save checkpoints, reset hardware, and pass DCGM Level 3 burn-in before returning to service.</figcaption>
</figure>

```checkpoint
A diagnostic run reports PCIe Pass and nvbandwidth Skip. Can automation return a GPU to service when its fault incident requires bandwidth verification?
---
No. PCIe Pass covers only the check that ran. Skip is no health verdict, and the missing fabric coverage is relevant to the incident. Keep the topology quarantined until the required test can run or an authorized owner chooses another evidence path.
```

A small coverage check makes the rule executable. Assume these results come from one fresh run on the matching GPU topology. The function evaluates only diagnostic coverage, leaving checkpoint drain and canary soak as separate checks:

<!-- leetllm: test, output=show -->
```python title="diagnostic-coverage.py"
def coverage_complete(required, results):
    if not required:
        raise ValueError("declare required tests before running diagnostics")
    return (
        all(results.get(name) == "Pass" for name in required)
        and "Fail" not in results.values()
    )

required = {"pcie", "nvbandwidth"}
for status in ("Skip", "Not Run", "Fail", "Pass"):
    results = {"pcie": "Pass", "nvbandwidth": status}
    complete = coverage_complete(required, results)
    assert complete == (status == "Pass")
    print(f"nvbandwidth={status:7} coverage_complete={complete}")
assert not coverage_complete(required, {"pcie": "Pass"})
assert not coverage_complete(required, {
    "pcie": "Pass", "nvbandwidth": "Pass", "memory": "Fail",
})
try:
    coverage_complete(set(), {})
except ValueError:
    pass
else:
    raise AssertionError("an empty plan must not pass vacuously")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
nvbandwidth=Skip    coverage_complete=False
nvbandwidth=Not Run coverage_complete=False
nvbandwidth=Fail    coverage_complete=False
nvbandwidth=Pass    coverage_complete=True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/diagnostic_coverage_dark.png" alt="Diagnostic gate matrix requiring pcie and nvbandwidth coverage on a quarantined GPU: passing both tests clears the gate (CLEAR), while Skip, Not Run, Fail, or an extra memory Fail holds the device out of service (HOLD)." />
  <figcaption>Both required PCIe and nvbandwidth tests must pass in the same diagnostic run. Any skipped required test or additional failing test holds the GPU in quarantine.</figcaption>
</figure>

Even the final `True` isn't permission to unquarantine. Identity, telemetry freshness, process state, workload canaries, ownership, and the other required gates must still pass.

## Recovery telemetry analyzer

You can inspect the analyzer's classification across eight incident telemetry snapshots without connecting to a GPU. The dataset covers allocator fragmentation, application capacity, orphan process memory leaks, Xid/ECC device faults, fabric faults, clock throttling, poisoned CUDA contexts, and driver/runtime mismatches.

* [Download incident snapshots](assets/gpu_failure_snapshots.json)
* [Download snapshot analyzer](assets/analyze_gpu_snapshots.py)

The analyzer operates strictly on captured telemetry snapshots without touching live hardware. It outputs both a primary hypothesis and a separate `must_relaunch` flag so a hardware finding never hides a poisoned process state.

Its inputs are already normalized. `new_xids` and ECC increments cover one incident window; an empty list or zero counter requires a successful collection, not a failed telemetry query. `clock_event_reasons` includes only limiters correlated with an unexpected regression. An operator or version-pinned parser has decoded DCGM defect classes from the full code and message; raw `Fail`, `Skip`, and `Not Run` aren't defect classes. CUDA labels come from exact enums and API context, not substring matches. The retryable set covers transient transport and timeout errors; consult the CUDA runtime error catalog for version-specific additions.[^nvidiaCudaRuntimeErrors2026]

For memory arithmetic, counters must share device scope and capture time. Unavailable memory readings or missing failed-request sizes use JSON `null`. The analyzer rejects negative or contradictory readings (for instance `reserved < allocated` or `largest_inactive_split_block > inactive_split_block_total`) rather than clamping them into plausible values, using a `1e-6 GiB` rounding tolerance. Native split-block inference requires both `allocator_backend="native"` and a recorded OOM with a positive request size. Confirm allocation failure from the event status and request size; allocator geometry alone only describes layout. Any outside-PyTorch alert threshold needs calibration to the model's normal CUDA workspace and NCCL buffers.

Run the downloadable analyzer from the article directory. The code below executes that same source, avoiding a second implementation that could drift:

<!-- leetllm: test, output=show -->
```python title="analyze-gpu-snapshots.py"
import runpy

runpy.run_path("assets/analyze_gpu_snapshots.py", run_name="__main__")
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
```
<!-- leetllm: output:end -->

For `r-7813`, live allocation plus the request is `39.10 + 1.00 = 40.10 GiB`, above the 40 GiB device capacity. That confirms application memory pressure even before attributing other processes. For `r-7819`, NVML initialization failed: its outside-PyTorch value stays `unknown`, not `0.00 GiB`. Neither a classification label nor a `False` relaunch flag restores traffic without verification.

When a worker keeps only 6.10 GiB across scattered inactive holes, small variations in hole geometry determine whether a contiguous request fails. We can model free segment fragmentation directly with a Dirichlet partition over inactive pool capacity and evaluate contiguous fit plus recovery availability tradeoffs using NumPy and SciPy:

<!-- leetllm: test, output=show, deps=numpy,scipy -->
```python title="fragmentation-and-availability-model.py"
import numpy as np
from scipy import stats

rng = np.random.default_rng(42)
inactive_total_gib = 6.10
request_gib = 1.50
# Model 7 inactive free holes under low vs high pinning dispersion
holes_even = rng.dirichlet(np.full(7, 8.0), size=5000) * inactive_total_gib
holes_skewed = rng.dirichlet(np.full(7, 1.2), size=5000) * inactive_total_gib

oom_prob_even = np.mean(holes_even.max(axis=1) < request_gib)
oom_prob_skewed = np.mean(holes_skewed.max(axis=1) < request_gib)
assert oom_prob_even > oom_prob_skewed
print(
    f"split OOM prob (even pinning)={oom_prob_even:.3f}, "
    f"(skewed holes)={oom_prob_skewed:.3f}, "
    f"r-7812 frag_index={1.0 - 0.88 / inactive_total_gib:.3f}"
)

# Model cluster recovery downtime under Xid 94 (drain + restart) vs Xid 95 (GPU reset + DCGM L3)
mtbf_hours = 720.0
xid94_down_min = stats.expon(scale=0.5).mean()   # ~30s drain + pod restart
xid95_down_min = stats.lognorm(s=0.35, scale=8.0).mean()  # checkpoint flush + reset + L3 soak
avail_94 = mtbf_hours * 60 / (mtbf_hours * 60 + xid94_down_min)
avail_95 = mtbf_hours * 60 / (mtbf_hours * 60 + xid95_down_min)
print(f"availability: Xid 94 process restart={avail_94:.5f}, Xid 95 full GPU reset={avail_95:.5f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
split OOM prob (even pinning)=0.835, (skewed holes)=0.090, r-7812 frag_index=0.856
availability: Xid 94 process restart=0.99999, Xid 95 full GPU reset=0.99980
```
<!-- leetllm: output:end -->

### Hold the memory layout constant

Keep the memory layout from `r-7812` fixed and vary only the event evidence. Check which cases point to allocator fragmentation. When the captured status is `success`, a leftover `oom_request_gib` field does not invent an OOM. Here `success` is the recorded outcome of the operation itself, not a later `cudaGetLastError()` query after an earlier asynchronous failure.

<!-- leetllm: test, output=show -->
```python title="layout-versus-failed-event.py"
import json
import runpy
from pathlib import Path

classify = runpy.run_path("assets/analyze_gpu_snapshots.py")["classify"]
original = json.loads(Path("assets/gpu_failure_snapshots.json").read_text())[0]
cases = [
    ("captured OOM", original, "allocator-fragmentation"),
    ("no recorded failure", dict(original, status="success", cuda_error="success"), "unclassified"),
    ("OOM, size unavailable", dict(original, oom_request_gib=None), "oom-unresolved"),
]
for name, row, expected in cases:
    result = classify(row)
    assert result["hypothesis"] == expected
    print(f"{name}: {result['hypothesis']}")

assert classify(dict(original, oom_request_gib=0))["hypothesis"] == "oom-unresolved"
for change in (
    {"incident_id": ""},
    {"allocator_backend": ""},
    {"pytorch_reserved_gib": 20.0},
    {"stale_processes": -1},
):
    try:
        classify(dict(original, **change))
    except ValueError:
        pass
    else:
        raise AssertionError(f"invalid snapshot accepted: {change}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
captured OOM: allocator-fragmentation
no recorded failure: unclassified
OOM, size unavailable: oom-unresolved
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/same_layout_different_event_dark.png" alt="Four telemetry interpretations of the same 40.00 GiB memory breakdown (30.10 allocated, 36.70 reserved, 6.10 splits with max 0.88 GiB, 3.18 outside, 0.62 free): OOM with 1.50 GiB request classifies as Split OOM, success with stale size records No failure, OOM with missing or zero size stays Unresolved, and cudaMallocAsync skips native split-block inference." />
  <figcaption>Identical memory numbers map to different diagnoses depending on event telemetry and allocator backend. Native split-block fragmentation inference applies only when a native allocator captures an OOM with a positive request size.</figcaption>
</figure>

A missing request size weakens the fragmentation diagnosis while preserving the reported OOM. A `success` record still leaves memory pressure worth inspecting, yet creates no failed allocation to attribute. None of these classifications replaces hardware diagnostics or clears an active GPU quarantine.

```checkpoint
All other signals are clear. A native snapshot reports capacity 24, reserved 22, live 18, device used 23, inactive splits 3, largest hole 1, and request 2 GiB. Compare a captured OOM, a captured success carrying that leftover request size, and an OOM with request size null. Which primary output sequence follows?

1. allocator-fragmentation; allocator-fragmentation; incomplete-memory.
2. allocator-fragmentation; unclassified; oom-unresolved.
3. application-capacity; unclassified; incomplete-memory.
4. outside-pytorch; allocator-fragmentation; oom-unresolved.
---
**Answer:** allocator-fragmentation; unclassified; oom-unresolved.

For the captured OOM, device used plus request (25 GiB) exceeds capacity (24 GiB), inactive splits (3 GiB) cover the request (2 GiB), and the largest hole (1 GiB) falls short. Success records no failed allocation. A null request size preserves the OOM status while leaving fragmentation unresolved.
```

```checkpoint
The snapshot validator receives four single-field modifications to an otherwise valid telemetry record: negative request size (-1.5 GiB); NVML device used set to null; allocated greater than reserved; negative stale-process count. Which changes violate memory accounting invariants rather than merely leaving a field unavailable?

1. Invalid 1, 3, and 4; change 2 retains unknown outside-PyTorch memory.
2. Invalid 1, 2, and 4; change 3 retains unknown outside-PyTorch memory.
3. Invalid 2, 3, and 4; change 1 indicates reclaimed memory.
4. Invalid 1, 2, and 3; change 4 indicates zero stale processes.
---
**Answer:** Invalid 1, 3, and 4; change 2 retains unknown outside-PyTorch memory.

Negative sizes, reserved memory smaller than live allocations, and negative process counts violate physical accounting invariants and must fail validation. JSON `null` represents an unavailable NVML reading and preserves unknown status downstream rather than fabricating zero.
```

## When two signals arrive together

Suppose `r-7818` reports both `illegal_address` and an Xid code. The Xid needs hardware catalog triage, yet killing and relaunching the poisoned process cannot wait on that lookup. Notice how the analyzer preserves both obligations independently:

<!-- leetllm: test, output=show -->
```python title="mixed-signal-snapshot.py"
import json
import runpy
from pathlib import Path

classify = runpy.run_path("assets/analyze_gpu_snapshots.py")["classify"]
rows = json.loads(Path("assets/gpu_failure_snapshots.json").read_text())
mixed = dict(rows[6], new_xids=[31])
result = classify(mixed)
assert result["hypothesis"] == "xid-event"
assert result["must_relaunch"] is True
print(result["hypothesis"], "| process relaunch required:", result["must_relaunch"])

contained = dict(rows[6], cuda_error="contained", new_xids=[94])
assert classify(contained)["must_relaunch"] is True

missing = dict(rows[0], nvml_device_used_gib=None)
result = classify(missing)
assert result["hypothesis"] == "incomplete-memory"
assert result["outside_gib"] is None
print(result["hypothesis"], "| outside memory:", result["outside_gib"])

async_allocator = dict(rows[0], allocator_backend="cudaMallocAsync")
assert classify(async_allocator)["hypothesis"] == "oom-unresolved"
print("native fragmentation inference withheld for cudaMallocAsync")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
xid-event | process relaunch required: True
incomplete-memory | outside memory: None
native fragmentation inference withheld for cudaMallocAsync
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/independent_process_relaunch_dark.png" alt="Fan-out classification on snapshot r-7818 with Xid 31 and illegal_address: Xid 31 sets primary hypothesis xid-event for device checking while illegal_address independently sets must_relaunch True to kill and relaunch the worker; missing NVML telemetry reports outside memory as unavailable rather than zero." />
  <figcaption>Hardware triage and worker relaunch stay independent when faults co-occur: Xid 31 routes device checks without suppressing the process relaunch required by illegal_address, and missing NVML readings remain unavailable rather than zero.</figcaption>
</figure>

Production controllers pair this classification logic with authenticated node ownership, sample freshness checks, incident deduplication, and durable quarantine latches so a quiet telemetry poll never clears an unverified GPU prematurely.

```checkpoint
A telemetry snapshot records both a DCGM memory fault and a `launch_timeout` CUDA error, with no fabric or Xid errors. The analyzer prioritizes DCGM hardware findings and evaluates `must_relaunch` separately. Which classification follows?

1. device-memory-fault and must_relaunch true.
2. process-corrupted and must_relaunch false.
3. device-memory-fault and must_relaunch false.
4. driver-runtime and must_relaunch true.
---
**Answer:** device-memory-fault and must_relaunch true.

The DCGM memory fault selects the primary hardware hypothesis, while `launch_timeout` invalidates the CUDA process context independently and keeps `must_relaunch` true.
```

## Pitfalls that widen blast radius

* **Calling cached reserve a leak.** Reserved memory reflects caching-allocator policy; snapshot block history confirms whether split fragmentation is occurring.
* **Attributing NVML deltas without source evidence.** Direct CUDA contexts, NCCL buffers, cuBLAS workspaces, and orphan processes all sit outside PyTorch's reserve while CUDA graph pools can sit inside it.
* **Retrying in a corrupted CUDA process.** Exact runtime errors determine when relaunch is mandatory.
* **Treating every Xid alike.** An Xid code narrows the search alongside catalog rules and telemetry rather than prescribing one blanket action.
* **Treating Skip as Pass.** Skipped diagnostic subtests never confirm hardware health.
* **Restarting before saving snapshots.** Early worker teardown discards in-memory allocator and kernel context traces.
* **Draining for convenience.** Shared-node eviction and ephemeral-data loss require cluster-level coordination and explicit operational permission.
* **Returning to service after one probe.** Single-inference checks miss multi-cycle fragmentation, fabric contention, and thermal soak throttling.

Inspect an out-of-memory snapshot deeply enough to distinguish allocator splits from device-wide demand, contain only the narrowest failing scope, and verify health gates explicitly before restoring traffic.

## Check your understanding

```mastery-quiz
[
  {
    "question": "A time-aligned native-allocator snapshot captures OOM for 2 GiB. Inactive split bytes total 6 GiB, the largest inactive block is 1.25 GiB, and device-free memory is 1 GiB. Which inference follows from this layout?",
    "options": [
      "Application capacity is confirmed; inspect live demand because fragmented blocks total more than the request.",
      "Outside-process leakage is confirmed; inspect process teardown because the largest hole is below the request.",
      "Fragmentation is plausible; inspect pending frees, pools, and outside owners before declaring the cause.",
      "Hardware memory failure is plausible; inspect ECC because separated free blocks cannot serve one request."
    ],
    "answer": "Fragmentation is plausible; inspect pending frees, pools, and outside owners before declaring the cause.",
    "explanation": "The captured failure and native layout support fragmentation as a hypothesis. Six GiB across separated blocks cannot serve one contiguous 2 GiB request. Other usable pools, pending stream frees, and outside-PyTorch memory owners still require verification."
  },
  {
    "question": "Same-scope near-simultaneous samples show PyTorch reserve 24 GiB and NVML device use 31.5 GiB. No process list has been collected yet. Which delta and next step are justified?",
    "options": [
      "7.5 GiB outside reserve; attribute direct CUDA, library, and peer-process ownership.",
      "7.5 GiB of reusable cache; increase the worker's per-batch memory limit.",
      "55.5 GiB total allocation; reduce allocator splitting before listing processes.",
      "24 GiB outside reserve; attribute the difference to the allocator segment pool."
    ],
    "answer": "7.5 GiB outside reserve; attribute direct CUDA, library, and peer-process ownership.",
    "explanation": "The 7.5 GiB delta (31.5 minus 24) lies outside PyTorch's reserve. It may reflect direct CUDA buffers, NCCL workspaces, or orphan processes; subtraction alone does not name the owner."
  },
  {
    "question": "A five-entry allocator-history ring starts empty and receives events 1 through 8 in order, with no prior dump. Which events remain and which were overwritten?",
    "options": [
      "Remain 1, 2, 3, 4, 5; overwritten 6, 7, 8.",
      "Remain 3, 4, 5, 6, 7; overwritten 1, 2, 8.",
      "Remain 1, 2, 6, 7, 8; overwritten 3, 4, 5.",
      "Remain 4, 5, 6, 7, 8; overwritten 1, 2, 3."
    ],
    "answer": "Remain 4, 5, 6, 7, 8; overwritten 1, 2, 3.",
    "explanation": "Only the newest five events survive in the finite ring. Missing an earlier failure can reflect ring wrap rather than proving the failure never happened."
  },
  {
    "question": "Worker P captures cudaErrorLaunchFailure while worker Q captures an ordinary allocation out-of-memory error. Each worker calls cudaGetLastError(), sees cudaSuccess on a second read, and passes an HTTP health check. Which process-relaunch rule follows from these error codes alone?",
    "options": [
      "P not required; Q required; both still need normal health verification.",
      "P required; Q not required; both still need normal health verification.",
      "P not required; Q not required; both may resume traffic immediately after passing HTTP checks.",
      "P required; Q required; both still need normal health verification."
    ],
    "answer": "P required; Q not required; both still need normal health verification.",
    "explanation": "CUDA specifies that launch failure leaves process P in an inconsistent state that requires process termination and relaunch, whereas ordinary OOM does not force process invalidation on Q. Clearing the last-error queue or passing HTTP cannot guarantee readiness on its own."
  },
  {
    "question": "A node reports capacity 4 GPUs and allocatable 4 GPUs. One assigned device becomes unhealthy through the Kubernetes device plugin. What changes without a separate eviction controller?",
    "options": [
      "Capacity 3, allocatable 3; the assigned pod is evicted immediately.",
      "Capacity 4, allocatable 3; the assigned pod remains scheduled on that GPU.",
      "Capacity 4, allocatable 4; the assigned pod is evicted immediately.",
      "Capacity 3, allocatable 4; the assigned pod remains scheduled on that GPU."
    ],
    "answer": "Capacity 4, allocatable 3; the assigned pod remains scheduled on that GPU.",
    "explanation": "The device plugin reduces allocatable GPUs from 4 to 3 to stop new placements while leaving already scheduled pods running until drained or terminated."
  },
  {
    "question": "A diagnostic suite requires pcie and nvbandwidth checks. Both report Pass in a fresh run, while an extra memory check in the same run reports Fail. What does coverage_complete return, and what should operations do before restoring traffic?",
    "options": [
      "False; hold traffic and inspect the full memory diagnostic code and message.",
      "True; send a small canary share because both required checks passed.",
      "True; hold traffic until a single HTTP inference succeeds.",
      "False; replace the GPU immediately because any Fail means hardware failure."
    ],
    "answer": "False; hold traffic and inspect the full memory diagnostic code and message.",
    "explanation": "The coverage check requires all required subtests to pass and zero Fail results anywhere in the run. A raw Fail can arise from configuration or software mismatch, so hold the GPU out of service and inspect the details."
  },
  {
    "question": "A failure occurred after repeated 3 GiB workspace allocations and two-rank collectives. After process restart, which canary directly tests the failure mechanism?",
    "options": [
      "One 3 GiB allocation followed by an idle check while keeping the peer rank offline.",
      "Repeated small single-rank prompts and an HTTP probe matching the old failure duration.",
      "Two-rank hardware inventory and idle thermal monitoring with zero allocations or collectives.",
      "Repeated 3 GiB allocation cycles plus two-rank collectives under explicit memory, link, and latency abort limits."
    ],
    "answer": "Repeated 3 GiB allocation cycles plus two-rank collectives under explicit memory, link, and latency abort limits.",
    "explanation": "A canary only tests the mechanism if it reproduces the failed allocation size, multi-cycle reuse, and multi-rank collective communication within clear safety thresholds."
  },
  {
    "question": "A 32 GiB snapshot records live 21, reserved 27, device-used 30.25, inactive splits 4.5, and failed request 2.5 GiB. What are the reserve gap, other reserve, outside-PyTorch memory, and request deficit above device-free memory?",
    "options": [
      "6; 4.5; 3.25; 0.75 GiB.",
      "4.5; 1.5; 9.25; 0.75 GiB.",
      "6; 1.5; 3.25; 0.75 GiB.",
      "6; 1.5; 3.25; -0.75 GiB."
    ],
    "answer": "6; 1.5; 3.25; 0.75 GiB.",
    "explanation": "Reserve gap is 27 - 21 = 6 GiB, other reserve is 6 - 4.5 = 1.5 GiB, outside memory is 30.25 - 27 = 3.25 GiB, device free is 32 - 30.25 = 1.75 GiB, and the request exceeds device free by 2.5 - 1.75 = 0.75 GiB."
  },
  {
    "question": "Fault monitoring deduplicates events by GPU and incident key into one quarantine record while counting occurrences. Incident A emits three reports, incident B emits two, and a later healthy poll for A sees no new faults before recovery gates complete. What quarantine records and counts remain?",
    "options": [
      "Five records with counts [1, 1, 1, 1, 1]; all quarantined.",
      "Two records with A at 3 and B at 2; both still quarantined.",
      "Two records with A at 3 and B at 2; A cleared and B still quarantined.",
      "Two records with A at 0 and B at 2; A cleared and B still quarantined."
    ],
    "answer": "Two records with A at 3 and B at 2; both still quarantined.",
    "explanation": "Deduplication maintains two distinct records tracking recurrences (3 and 2). A single quiet poll adds no new fault without clearing an active quarantine latch until DCGM verification and soak gates succeed."
  },
  {
    "question": "A quarantined replica passes identity, idle, functional, memory, device, thermal/power, and soak checks, while required fabric diagnostics remain pending and an HTTP probe is green. What state holds?",
    "options": [
      "All eight groups pass; restore canary traffic because HTTP covers the fabric path.",
      "Seven pass and one is pending; shift canary traffic and test fabric on live requests.",
      "All eight groups pass; clear quarantine because no new fault arrived.",
      "Seven pass and one is pending; hold traffic out of the replica until required fabric verification and recovery approvals finish."
    ],
    "answer": "Seven pass and one is pending; hold traffic out of the replica until required fabric verification and recovery approvals finish.",
    "explanation": "A passing HTTP check verifies only the functional endpoint, not inter-GPU fabric health. Hold the worker out of service until all eight verification checks clear."
  }
]
```

> **Next:** Continue to [Distributed Inference Data Plane](/learn/distributed-inference-data-plane). The same failure-scope isolation, telemetry snapshots, and retry deadlines apply when requests span routing, <span data-glossary="prefill">prefill</span>, KV cache transfer, and decode pools.
