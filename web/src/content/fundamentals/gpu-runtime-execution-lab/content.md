---
{
  "id": "gpu-runtime-execution-lab",
  "title": "GPU Runtime Execution Lab",
  "slug": "gpu-runtime-execution-lab",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 16,
  "shortDescription": "When short CUDA kernels finish before the host submits the next one, streams, events, and graphs close that gap only if completion and addresses stay correct.",
  "keyConceptsTested": [
    "Host enqueue and device completion",
    "CUDA stream and default-stream ordering",
    "Event-based cross-stream dependencies",
    "Transfer and kernel overlap requirements",
    "CUDA Graph capture, instantiation, and replay",
    "Graph update and dynamic-shape constraints",
    "Static address and allocation lifetime rules",
    "Launch-overhead benchmark diagnosis",
    "Persistent kernel and work-queue trade-offs",
    "Inference-engine graph integration"
  ],
  "companies": [
    "NVIDIA",
    "PyTorch",
    "vLLM",
    "SGLang"
  ],
  "prerequisites": [
    "gpu-profiling-correctness-benchmarking",
    "gpu-compilers-kernel-languages",
    "low-precision-gpu-programming"
  ],
  "relatedQuestions": [
    "low-precision-gpu-programming",
    "deep-dive-vllm",
    "deep-dive-sglang",
    "scaling-llm-inference-batching-kv-cache"
  ]
}
---

Imagine an inference trace with short <span data-glossary="cuda">CUDA</span> operations separated by gaps. The GPU finishes an operation before the host submits the next one. Optimizing the math inside that operation won't remove the gap. First find out whether submission is the limiting resource.

LLM decoding can issue normalization, projections, rotary embeddings, attention, and activation operations. Fusion, model architecture, batch size, and the backend change their count and duration. A large projection can take substantial device time. Measure the costs for the actual execution path.

If the host repeatedly supplies work more slowly than the device consumes it, its queue can drain and expose submission gaps. This is one possible <span data-glossary="gpu">GPU</span> bottleneck, alongside long kernels, dependencies, communication, and other queued work. A profiler trace should identify which resource is waiting.

```checkpoint
Why can a GPU appear underutilized even when running an inference service at 100% CPU load?
---
One possibility is slow host submission: the device runs out of ready work between operations. CPU load alone does not prove this cause. Check the CPU API timeline and device gaps, including other streams and communication.
```

A four-operation pipeline makes that idle gap concrete, first as a CPU simulation and then as a <span data-glossary="pytorch">PyTorch</span> CUDA benchmark:

1. **Copy** input values into a working buffer.
2. **Affine transform:** compute $2x + 1$.
3. **Square:** compute each value's square $(2x + 1)^2$.
4. **Reduce:** sum the elements down to a single scalar.

On integer inputs `[1, 2, 3, 4]`, the affine step yields `[3, 5, 7, 9]`, the square step yields `[9, 25, 49, 81]`, and the final reduction sums to `164`.

The host can submit all four operations and return while the device is still processing earlier work. Bugs appear when submission is mistaken for completion, streams access the same buffer without the required dependency, or graph inputs no longer match captured pointers. Here “shared buffer” means an allocation accessed by several operations, not CUDA's block-local shared-memory address space.

## Two clocks describe one execution

Host submission and device completion are separate observations. CUDA kernel launches are asynchronous with respect to the host. Memory-copy behavior also depends on the API, direction, and memory involved, and even an asynchronous API can block because of resource contention. A stream expresses issue-order dependencies; the CUDA runtime and driver choose how that work maps to physical hardware queues.[^cuda2026apiSync][^cudaProgrammingGuide2026]

We can model the public submission behavior as two paths: the host continues after submission, and the device executes work when dependencies and resources permit.

<figure>
  <img src="illustrations/_generated/data-chain-completion-scope_dark.png" alt="The device-owned source buffer [1, 2, 3, 4] passes through a copy, affine transform, square, and reduction into total 164. The host returns after submitting the operations at tick 4; total.item() observes the result after stream completion at tick 10." />
  <figcaption>The four-operation pipeline keeps submission, device completion, and a host read in view. The host returns at tick 4; a later read observes 164 after the stream completes at tick 10.</figcaption>
</figure>

Interpret each observation within its scope:

| Observation | Direct conclusion | Additional check |
|---|---|---|
| Successful host launch call returns | Submission returned without a reported error | Wait for completion and inspect the output because some errors surface later |
| Recorded event completes | Preceding work in that stream reached the marker | Check dependencies in other streams |
| Successful stream synchronization returns | All prior commands in that specific stream completed | Inspect other device streams and engines separately |
| Successful device synchronization returns | Previously submitted work in the relevant CUDA context completed | Check other processes' contexts and whether setup, allocation, and JIT were included in timing |
| Output buffer equals `164` | The pipeline produced the expected value for this run | Vary timings and inputs, then check for data races |

To visualize this asynchronous separation, consider a logical issue-order simulation. Each host submission costs one tick: the CPU submits operations at ticks 0, 1, 2, and 3, and returns to user code at tick 4. Device operations run on their own schedule, waiting for host submission, preceding stream tasks, and cross-stream dependencies. You can download the complete [runtime submission simulation script](./assets/runtime_submission_sim.py).

<!-- leetllm: test, output=show, id=runtime-order -->
```python title="runtime_submission_sim.py"
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
unsafe = schedule([operations[0], Operation("affine", "compute", 4),
                   *operations[2:]])
print(f"without_event_read_before_copy_done={unsafe['affine'][0] < unsafe['copy'][1]}")
assert times["affine"][0] >= times["copy"][1]
assert times["reduce"][1] == 10
```

<!-- leetllm: output:start -->
```text title="Output" output compact
host_return_tick=4
copy stream=copy start=0 end=3
affine stream=compute start=3 end=7
square stream=compute start=7 end=9
reduce stream=compute start=9 end=10
device_complete_tick=10
result=164
without_event_read_before_copy_done=True
```
<!-- leetllm: output:end -->

The simulated host returns at tick 4, and device work finishes at tick 10. Removing the dependency permits affine to start at tick 1 before copy completes. The simulation shows the ordering hazard; real GPU scheduling and corrupted values require their own measurements. Square and reduce already follow affine in the same stream. Event/API overhead and resource contention aren't modeled.

<figure>
  <img src="illustrations/_generated/submission-timeline_dark.png" alt="Three aligned traces share logical ticks 0–10. Four host submissions finish at tick 4; the copy runs 0–3, affine 3–7, square 7–9, and reduction 9–10. A ready-event arrow joins copy completion to affine start at tick 3. In the unsafe comparison, affine begins at tick 1 while the copy continues to tick 3; the red band marks this possible read hazard." />
  <figcaption>Host calls 1–4 submit copy, affine, square, and reduce, in order. Host submission returns at tick 4 while device work completes at tick 10; the ready event connects copy completion to affine start at tick 3. Removing that wait lets affine start at tick 1 while the copy continues to tick 3, exposing a possible read hazard. Ticks model logical order; they omit API overhead, resource contention, and hardware time.</figcaption>
</figure>

## Stream semantics and synchronization

Commands submitted to a single CUDA stream execute strictly in issue order. Commands in different streams can execute concurrently or in any interleaved order unless an explicit dependency binds them. Distinct streams permit overlap when hardware resources are available; verify concurrency in the actual timeline.[^cudaProgrammingGuide2026]

### The legacy default stream trap

Default-stream behavior is configured per compilation unit. Distinguish these cases, and don't infer a framework's stream flags from raw CUDA defaults:[^nvidia2026StreamSync]

1. **The Legacy Default Stream (NULL stream):**
   Under legacy semantics, stream 0 synchronizes with blocking streams in the **same CUDA context**. Previously issued blocking-stream work precedes the legacy operation, and subsequent blocking-stream work waits for it. This doesn't synchronize independent processes' contexts or streams created with `cudaStreamNonBlocking`.

2. **Non-Blocking Streams (`cudaStreamNonBlocking`):**
   Created via `cudaStreamCreateWithFlags(&stream, cudaStreamNonBlocking)`. These opt out of the legacy stream's implicit synchronization. Explicit events, data dependencies, and unavailable hardware resources can still delay concurrent execution.

3. **Per-Thread Default Streams:**
   `--default-stream per-thread` selects a default stream local to the thread and context; `cudaStreamPerThread` names it explicitly. It behaves like a normal explicitly created stream. It is **not** a non-blocking stream and synchronizes with the legacy stream if both are used.

<figure>
  <img src="illustrations/_generated/default-stream-ordering_dark.png" alt="Three same-context timelines compare CUDA stream rules. Blocking stream A work finishes before a legacy default-stream operation, and later blocking stream B work waits for it. A non-blocking stream has no implicit edge to legacy work, so overlap is permitted when resources allow. Per-thread default work synchronizes with legacy work when both are used." />
  <figcaption>Each row shows one same-context ordering case. Legacy work waits for earlier blocking-stream work and holds later blocking work; non-blocking work has no implicit legacy edge. Per-thread default work follows the blocking-stream rule shown here.</figcaption>
</figure>

```checkpoint
Why can an unadorned cudaMemcpy call in one thread stall independent worker streams running in another thread?
---
If that compilation unit uses legacy default-stream semantics, the copy introduces ordering with blocking streams in the same context. Non-blocking streams are exempt. Copy direction and host-memory type separately determine whether the host call waits; stream synchronization and host blocking aren't the same property.
```

### Cross-stream coordination via events

To coordinate producer and consumer streams without blocking the host CPU, use CUDA events:

<figure>
  <img src="illustrations/_generated/event-generation-state_dark.png" alt="Two stream sequences show event state at each wait call. Recording ready after copy gives the compute wait a dependency on event state E1. A wait before the first record sees empty state E0; the later E1 record does not attach to that earlier call, so affine work may overlap the copy." />
  <figcaption>Record the event after the producer work and enqueue the consumer wait afterward. A wait issued before the first record observes empty state E0; a later record does not change that already issued wait.</figcaption>
</figure>

The synchronization sequence relies on two runtime calls:

1. `cudaEventRecord(ready, copy_stream)` appends an event marker into the copy stream's FIFO queue immediately after the copy command.
2. `cudaStreamWaitEvent(compute_stream, ready, 0)` enqueues a dependency barrier into the compute stream.

`cudaStreamWaitEvent` makes future work in the consumer stream wait for the work represented by the event. It provides a stream dependency rather than a host wait for producer completion. Don't assign it a universal sub-0.5-microsecond API duration or assume a hardware token format.[^cudaRuntimeEvents2026]

Record before waiting. A newly created, unrecorded event represents **empty work**, not undefined behavior. A wait observes the event's most recently recorded state at the time of that call; recording it later doesn't retroactively add a dependency. Keep allocations alive until their consumers finish. Pinning applies to host buffers used for suitable asynchronous transfers, not every device allocation. In PyTorch, stream ordering and allocator lifetime can require separate `wait_stream` and `record_stream` handling.[^cudaRuntimeEvents2026][^pytorchCudaSemantics2026]

### Overlap requirements

This pipeline's operations depend on one another, so adding streams won't make this one chain parallel. Independent requests can overlap, provided their buffers, ordering, and hardware permit it:

| Overlap Type | Hardware and Software Prerequisites | Common Serialization Bottleneck | Diagnostic Clue |
|---|---|---|---|
| Host-to-device copy with independent kernel | Pinned host memory, asynchronous copy, streams without an ordering barrier, supported copy/compute overlap | Pageable-memory staging may block the host; an implicit or explicit dependency can serialize work | Inspect API duration and copy/kernel overlap |
| Device-to-host copy with independent kernel | Pinned destination, supported transfer path, no dependency between those tasks | Premature synchronization prevents useful overlap | Reading before completion is a data hazard; a raw CPU read doesn't automatically wait |
| Independent kernels | Distinct streams, supported concurrent execution, sufficient resources | One kernel's resource use can prevent another block from becoming resident | Use occupancy to estimate resident slots, then confirm overlap in launch/resource metrics and the actual trace |
| Next request's transfer with current request's compute | Separate live storage regions and per-slot dependencies, often double buffering | Reusing a region while a reader still uses it creates a hazard | Disjoint ranges within one allocation can suffice |

Check `asyncEngineCount` for the device's copy/compute-overlap capability. Host delays, resource use, and stream barriers can still prevent overlap. Verify the actual timeline.[^cudaProgrammingGuide2026]

<figure>
  <img src="illustrations/_generated/buffer-reuse-lifetimes_dark.png" alt="Pinned host staging buffers H1, H2, and H3 feed two disjoint device slots A and B. Transfer H2 into B can overlap compute reading A for H1. Slot A stays busy until its reader finishes, then H3 may reuse it. Reusing A early would race the active reader." />
  <figcaption>H2 can transfer into slot B while H1 computation reads slot A. The final H1 reader releases A for H3; overlap depends on the device and actual workload.</figcaption>
</figure>

## Measure enqueue, device work, and completion

Track three overlapping intervals:

1. **Host submission time:** CPU wall-clock duration around the submission loop, measured without any synchronizations inside the timed region.
2. **Device elapsed time:** The duration between two CUDA events recorded before and after the workload in the execution stream, evaluated only after the stop event completes.
3. **End-to-end time:** Host wall-clock duration from the start of submission through the final scoped device synchronization.

**Host submission time and device elapsed time overlap.** Event elapsed time is the span between two device timestamps, including gaps within those markers. In an assumed trace where a kernel finishes at 3 µs and the next operation starts at 8 µs, that five-microsecond idle interval contributes to an event span surrounding both operations.[^cudaRuntimeEvents2026]

Use the earlier logical schedule to check the arithmetic. Assume the start marker completes at tick 0 and the stop marker is submitted after the host loop into the compute stream:

<!-- leetllm: test, output=show, continue=runtime-order -->
```python title="overlapping-intervals.py"
host_span = len(operations)
device_complete = max(end for _, end in times.values())
event_stop = max(host_span, device_complete)
event_span = event_stop  # start marker at tick 0
end_to_end = max(host_span, event_stop)
print(f"host={host_span}, event={event_span}, end_to_end={end_to_end} ticks")
print(f"incorrect addition={host_span + event_span} ticks")
assert end_to_end == 10 and host_span + event_span == 14
```

<!-- leetllm: output:start -->
```text title="Output" output compact
host=4, event=10, end_to_end=10 ticks
incorrect addition=14 ticks
```
<!-- leetllm: output:end -->

A long submission loop and short kernels suggest host costs worth investigating. Long kernels can reflect compute, memory, synchronization, or contention. Nsight Systems shows CPU APIs alongside device streams and transfers; Nsight Compute examines individual kernels. Measure the root cause rather than infer saturation from duration alone.[^nsightSystems2026][^nsightCompute2026]

### Isolating steady-state performance

A disciplined benchmark isolates initialization from steady-state execution:

- Initialize the CUDA context and runtime libraries before starting timers.
- Pre-allocate all input, workspace, and output tensors.
- Warm up the execution pipeline to trigger just-in-time (JIT) compilation, autotuning, and driver memory bindings.
- Prime timing events: PyTorch initializes underlying handles lazily on their first record or export. Exclude that setup from timing.[^pytorchCudaEvent2026]
- Enforce strict numerical tolerance checks against an FP64 CPU reference before trusting any timing speedup.

| Benchmark Record Field | Why It's Mandatory | Rejection Threshold |
|---|---|---|
| GPU model, driver, PyTorch CUDA build, framework version | Features/performance depend on the environment; a build toolkit version isn't a runtime probe | Uncontrolled environment variations |
| Tensor shape, strides, and allocation lifetime | Workload identity; graph addresses must remain valid | Unnoticed address/lifetime or layout changes |
| Warmup and measurement iterations | Separates cold initialization from steady-state reuse | Zero warmup or single-shot timing |
| Host, device event, and end-to-end intervals | Separates CPU launch bottlenecks from GPU execution | Omitting host enqueue duration |
| Reference value, tolerance, observed maximum error | Guards against fast but mathematically broken optimizations | Error exceeds numerical tolerance |
| Graph setup time and captured memory addresses | Accounts for instantiation overhead and verifies stable pointers | Hidden instantiation costs inside replay loops |

<figure>
  <img src="illustrations/_generated/measurement-boundaries_dark.png" alt="Context creation, buffer allocation, warmup, and timing-event initialization happen before the measured run. On a shared logical axis, host submission spans ticks zero to four while device-event and end-to-end intervals span zero to ten; these intervals overlap and should not be added. A device-event span can include five idle ticks between a kernel ending at three and the next operation beginning at eight. Before timing, fresh zero and one inputs check sums N and 9N at unchanged addresses, then the completed result is compared with an FP64 CPU reference." />
  <figcaption>The intervals share an axis, so the 4-tick host span sits inside the 10-tick event and wall spans. Warmup, event setup, input checks, stable addresses, and a completed FP64 comparison make the timing record interpretable.</figcaption>
</figure>

## CUDA Graphs reduce repeated submission work

A CUDA Graph describes operations and their dependencies. Instantiation prepares an executable graph, and repeated launches can skip much of eager argument setup and dispatch. A launch still costs time; measure whether the savings improve the workload.[^nvidia2026CudaGraphsGuide]

The CUDA Graph lifecycle follows three distinct phases:

<figure>
  <img src="illustrations/_generated/graph-capture-lifecycle_dark.png" alt="A captured stream runs copy, affine, square, and reduction between cudaStreamBeginCapture and cudaStreamEndCapture, producing a logical cudaGraph_t. Instantiation prepares a cudaGraphExec_t. The first cudaGraphLaunch may upload the graph; repeated launches run the prepared graph while retaining node dependencies. Ordinary CPU calls during capture run immediately and stay outside the replay graph." />
  <figcaption>Capture records stream operations as graph nodes; ordinary CPU calls still run at once. Instantiation prepares the executable, and the first launch may upload graph work before repeated replay follows the recorded dependencies.</figcaption>
</figure>

1. **Capture (`cudaGraph_t`):**
   Captured stream operations become graph nodes instead of running. Ordinary CPU work still executes during capture and isn't automatically recorded for replay.

2. **Instantiation (`cudaGraphExec_t`):**
   `cudaGraphInstantiate` validates a graph snapshot and prepares its executable. Cost depends on graph contents and environment. Record it separately; a new graph or an unsuccessful update can require another instantiation.

3. **Launch (`cudaGraphLaunch`):**
   `cudaGraphLaunch` submits the prepared graph to a stream. First launch can also upload work descriptions, so separate it from repeat launches. NVIDIA's September 2024 CUDA 12.6 microbenchmark on an RTX 3060 and Xeon Silver 4208 reported about 2.5 µs plus roughly 1 ns/node for repeated straight-line kernel graphs with at least ten nodes. Multiple roots and non-kernel nodes behaved differently. These historical measurements illustrate why hardware, topology, and version belong in a performance claim.[^nvidia2024GraphLaunchCosts]

<figure>
  <img src="illustrations/_generated/graph-replay-submission_dark.png" alt="A cumulative-cost chart compares eager execution at 18 microseconds per iteration with graph replay at 12 milliseconds setup plus 12 microseconds per replay. The curves meet at 2,000 iterations and 36 milliseconds. A magnified view at iteration 2,001 compares the additional cost above that shared 36-millisecond base: 18 microseconds for eager and 12 microseconds for replay, a 6-microsecond modeled saving." />
  <figcaption>Both modeled paths cost 36 ms at iteration 2,000. At iteration 2,001 they cost 36.018 ms and 36.012 ms, so replay saves 6 µs in this assumed example. Hardware, graph contents, and runtime determine actual costs.</figcaption>
</figure>

Suppose eager execution takes 18 microseconds per iteration (including host launch overhead and kernel execution), while graph replay drops the time to 12 microseconds, but incurs 12 milliseconds of upfront capture and instantiation cost. Each replay saves 6 microseconds:

$$
\text{Break-even Iterations} = \frac{\text{Setup Cost}}{\text{Per-iteration Savings}} = \frac{12{,}000\,\mu\text{s}}{6\,\mu\text{s}} = 2{,}000
$$

At 2,000 iterations, both approaches take exactly 36 milliseconds. Replay iteration 2,001 is the first iteration that delivers a net performance improvement:

<!-- leetllm: test, output=show -->
```python title="graph-amortization.py"
from math import floor, isfinite

def first_cheaper_reuse(setup_ms: float, eager_us: float, replay_us: float):
    if not all(isfinite(x) and x >= 0 for x in (setup_ms, eager_us, replay_us)):
        raise ValueError("costs must be finite and nonnegative")
    saving_us = eager_us - replay_us
    return floor(setup_ms * 1000 / saving_us) + 1 if saving_us > 0 else None

print("first cheaper reuse:", first_cheaper_reuse(12, 18, 12))
print("no replay saving:", first_cheaper_reuse(12, 12, 12))
assert 12_000 + 2000 * 12 == 2000 * 18
assert 12_000 + 2001 * 12 < 2001 * 18
```

<!-- leetllm: output:start -->
```text title="Output" output compact
first cheaper reuse: 2001
no replay saving: None
```
<!-- leetllm: output:end -->

### Capture rules and constraints

Stream capture intercepts stream activity and converts it into graph nodes. It enforces strict runtime constraints:

- CUDA capture accepts streams other than `cudaStreamLegacy`, including explicitly created blocking streams and `cudaStreamPerThread`. PyTorch's capture wrapper uses a side stream.
- If a capture region forks into multiple streams using events, all joined streams must merge back into the origin stream before `cudaStreamEndCapture` is called.
- Don't synchronize/query the capturing stream, captured events, or a broader context/device that includes the capture. These refer to work not yet scheduled for execution.
- Ordinary CPU `malloc` isn't generally prohibited and isn't captured. Ordinary `cudaMalloc` is also not captured and is restricted by capture interaction mode; relaxing checks doesn't make it replayable. Graph-aware device allocation can use supported stream-ordered or memory-node APIs. PyTorch may allocate through its capture-aware caching allocator.[^nvidia2026StreamManagement][^pytorchCudaSemantics2026]

PyTorch simplifies this workflow through `torch.cuda.graph()`, which manages side streams and coordinates with PyTorch's internal caching allocator to keep memory pools stable.[^pytorchCudaSemantics2026]

### Virtual addresses are baked into the graph

Captured pointer arguments refer to particular virtual addresses.

Reassigning a Python variable doesn't update captured arguments. If the original allocation remains alive, the graph still processes it. If storage is freed/reused without the required lifetime protection, replay can access invalid or unrelated data. New allocations aren't guaranteed to receive distinct addresses.

For this PyTorch lab, retain references to static buffers, copy new inputs in place, then replay. Order that copy before replay in the same stream or with an event. Order output use before a replay overwrites it, and synchronize the stream, then read on the CPU. A clone is also an asynchronous device operation and needs ordering.[^pytorchCudaSemantics2026]

<figure>
  <img src="illustrations/_generated/graph-pointer-identity_dark.png" alt="During capture, the Python name x and the graph input argument both refer to allocation A. Rebinding x to allocation B changes the Python name, while the captured graph argument still points to A. Copying new values into A in place changes what a later replay reads." />
  <figcaption>Rebinding <code>x</code> changes Python's name while the captured graph keeps allocation A. Copying into A in place updates the values used by a later replay.</figcaption>
</figure>

```checkpoint
Why does reassigning an input variable with a freshly allocated tensor break CUDA Graph replay?
---
Reassignment changes a Python binding, not captured pointer arguments. The graph still uses the original allocation unless its executable parameters are explicitly updated through a supported mechanism. Retain that allocation and update its contents in place for this lab.
```

### Graph parameter updates

CUDA supports two mechanisms for updating an executable graph without paying for a full reinstantiation:

1. **Node Parameter Updates (`cudaGraphExecKernelNodeSetParams`):**
   Updates the launch configuration (grid dimensions, block dimensions, or scalar parameters) of a specific node in an existing executable graph.
2. **Whole-Graph Updates (`cudaGraphExecUpdate`):**
   Compares a newly captured logical `cudaGraph_t` against an existing `cudaGraphExec_t` and updates execution parameters in place.

Identical topology is necessary, not sufficient, for whole-graph update. Node matching/order and node-specific restrictions also apply: kernel context can't change, and memcpy updates constrain devices, allocation contexts, dimensionality, and transfer kind. Check the returned update result and instantiate a valid replacement if it fails. Updates affect later launches; they don't modify already running work.[^nvidia2026CudaGraphsGuide]

<figure>
  <img src="illustrations/_generated/graph-update-contract_dark.png" alt="Two aligned operation DAGs keep node IDs and edges while changing the affine parameter from 2x+1 to 2x+3. An update succeeds for future launches, while an in-flight launch keeps its original parameters. A candidate DAG with an added copy node changes IDs and topology, so update fails; inspect the error node and instantiate a compatible replacement." />
  <figcaption>A successful update changes later launches while an in-flight launch keeps its original parameters. When an update fails, inspect the error node and build a valid executable before replay.</figcaption>
</figure>

Some execution variation can be represented without editing topology: CUDA provides node enable/disable APIs and conditional IF/WHILE/SWITCH nodes. PyTorch 2.14 documents selected `torch.cond` graph paths. Check their supported contents/backends before using them for data-dependent execution.[^nvidia2026CudaGraphsGuide][^pytorchCudaSemantics2026]

## Bucketed graph pools in inference runtimes

Continuous batching changes the number of requests and tokens. Capturing compatible shapes ahead of time can move setup off the token-generation path, at the cost of capture time, memory, and padding. The runtime must select a graph whose complete input signature matches the work.[^vllm2026cudagraphs]

Inference engines resolve this tension using **bucketed graph pools**:


1. **Pre-Capture Discrete Buckets:**
   A typical bucket schedule is `[1, 2, 4, 8, 16]`. Actual capture sizes depend on configuration, model, memory, and backend; powers of two aren't required.
2. **Padding with Attention Masking:**
   Six compatible requests can use a bucket of eight. Every relevant output, reduction, and cache-write path must correctly handle the two dummy slots. Zero-valued padding alone isn't sufficient, and changing shape/kernel selection does not necessarily preserve bitwise floating-point results.
3. **Eager Fallback for Outliers:**
   With no compatible graph, use an available piecewise/eager path. That path still has its own supported shapes and numerical behavior.

As inspected October 10, 2026, vLLM dispatches by runtime mode and a batch descriptor that includes padded token count, request count, uniformity, and LoRA status. Attention backends can restrict full-graph compatibility. SGLang documents separate decode/prefill graph backends and capture sizes, plus `--disable-cuda-graph-padding`. Prefill can therefore use supported graph paths; it isn't inherently eager.[^vllm2026cudagraphs][^sglang2026parallelism]

Trace the reduction after padding six inputs with two zeros. Our affine operation maps each dummy zero to one, which then survives squaring:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="padding-is-part-of-correctness.py"
import numpy as np

buckets = np.array([1, 2, 4, 8, 16], dtype=np.int64)
for count in (6, 16, 17):
    matches = buckets[buckets >= count]
    bucket = int(matches[0]) if matches.size else None
    print(f"valid={count}, bucket={bucket}")

inputs = np.array([1, 2, 3, 4, 5, 6], dtype=np.int64)
bucket_size = 8
padded = np.pad(inputs, (0, bucket_size - inputs.size))
valid_mask = np.arange(bucket_size) < inputs.size
outputs = (2 * padded + 1) ** 2
reference = int(((2 * inputs + 1) ** 2).sum())
unmasked = int(outputs.sum())
masked = int(np.where(valid_mask, outputs, 0).sum())
print(f"reference={reference}, unmasked={unmasked}, masked={masked}")
assert masked == reference and unmasked != reference
```

<!-- leetllm: output:start -->
```text title="Output" output compact
valid=6, bucket=8
valid=16, bucket=16
valid=17, bucket=None
reference=454, unmasked=456, masked=454
```
<!-- leetllm: output:end -->

If a dummy slot also writes into a live request's KV cache position, masking only the final reduction cannot undo that earlier memory side effect.

<figure>
  <img src="illustrations/_generated/bucket-padding-side-effects_dark.png" alt="A complete runtime descriptor routes six requests to bucket eight, while a six-request descriptor with an uncaptured LoRA key takes standard eager dispatch. Sixteen requests match bucket sixteen, and seventeen requests take the eager path. In bucket eight, two dummy zeros become ones after 2x+1 and remain ones after squaring. Summing all eight gives 456; masking padded slots seven and eight first gives the correct 454. A dummy cache write can still affect a live request even when the final reduction is masked." />
  <figcaption>Six inputs padded to eight produce 456 if both dummy results are summed and 454 when those slots are masked. A dummy cache write can still reach a live request, so masking the final reduction does not undo earlier side effects.</figcaption>
</figure>

## Persistent kernels and device-side queues

A captured graph still needs a launch. If the trace shows that launch as the remaining gap, the device can keep workers alive and pull the next task from a queue. Measure that dispatch cost before adopting the more specialized design.

A **persistent kernel** keeps workers running across multiple work items. Its lifetime can be bounded, and the host may still produce work, communicate inputs, consume results, or cancel execution.

<figure>
  <img src="illustrations/_generated/persistent-queue-protocol_dark.png" alt="A producer publishes a descriptor to a bounded queue with system-scope release semantics. The queue fans out to resident workers 0, 1, and N−1; each acquires a distinct slot and computes its task. Completion is published, the last reader finishes, and then the slot is recycled. A resource cycle appears when all resident workers wait for a child kernel that needs one of their slots. Bounded shutdown stops new work, drains or cancels queued tasks, finishes readers, and releases slots." />
  <figcaption>Descriptor publication, worker claim, completion, reader release, and slot reuse require a supported shared-access mapping and ordering protocol. The lower sequences show a resource-progress cycle and a bounded shutdown order.</figcaption>
</figure>

Persistent execution doesn't inherently require Cooperative Groups. If the algorithm uses `this_grid().sync()`, use a supported cooperative launch and size its grid according to the kernel's residency limit, checked with occupancy APIs and device capabilities. Independent workers can use ordinary launches.[^nvidia2026CooperativeGroups]

Each SM worker block executes a persistent `while (running)` loop:

1. Poll and claim work through a correctly synchronized queue. For direct CPU/GPU communication, verify the allocation's concurrent-access/atomic support and use compatible system-scope acquire/release operations. Device-scope `atomicAdd` plus a fence alone doesn't define a correct host/device queue.
2. Process the published descriptor and its inputs once ownership is confirmed.
3. Publish completion with the required ordering; recycle slots only after readers finish. Include termination, bounded capacity, and forward-progress rules.[^cudaProgrammingGuide2026]

### Architectural trade-offs of persistent kernels

Dispatch and polling costs depend on the implementation and communication path. Compare these designs:

| Engineering Dimension | Standard CUDA Graph | Persistent Worker Kernel |
|---|---|---|
| Submission work | Host graph launch plus device scheduling | Initial launch plus queue/communication work |
| Resource footprint | Each running node holds its required resources | Workers retain resources until they exit |
| Co-located workloads | Scheduling/resource contention still matters | Large resident grids can starve work needing those resources |
| Watchdogs | Long-running constituent kernels can time out | Long-running workers can time out; platform rules matter |
| Failure recovery | Device errors may require context/process recovery | Add worker shutdown/cancellation; faults can also require context/process recovery |

Resource starvation is especially dangerous when a worker waits for work that can't become resident until that worker exits. Spare resources may permit concurrency, but progress must follow from the algorithm and supported scheduling guarantees. Test shutdown and dependencies as carefully as the fast path; dedicated devices are one operational choice.

## Run the GPU runtime lab

Download the complete [gpu_runtime_lab.py](./assets/gpu_runtime_lab.py) script. It benchmarks our four-operation pipeline (`copy -> affine -> square -> reduce`) across three submission modes:

- `eager`: Submits each operation sequentially from the current stream.
- `stream`: Submits the same chain to an explicit non-blocking stream.
- `graph`: Warms up the pipeline, captures static buffers, and executes via graph replay.

Run the lab on a system with a supported NVIDIA GPU:

```bash title="terminal"
uv run web/src/content/fundamentals/gpu-runtime-execution-lab/assets/gpu_runtime_lab.py \
  --mode all --elements 4096 --warmup 20 --iterations 1000
```

The script uses a 4,096-element FP32 vector initialized with `linspace(0, 1, elements)` and a device-to-device copy. Its `stream` mode submits one dependent chain, not two independent pipelines. It doesn't benchmark pinned host transfers or copy/compute overlap.

Before timing each mode, it fills the retained input buffer with zeros and ones, checking the expected sums (`elements` and `9 * elements`) within its declared tolerance. It restores the original input, warms up, primes events, and checks the last completed result against an FP64 CPU reference. This catches stale graph inputs but doesn't validate every timed iteration.

```bash title="save-run-output"
uv run web/src/content/fundamentals/gpu-runtime-execution-lab/assets/gpu_runtime_lab.py \
  --mode all --elements 4096 --warmup 20 --iterations 1000 > runtime_run.json
```

Read these fields from your own successful run:

| Output field | Interpretation |
|---|---|
| `host_submit_us_per_iteration` | Submission-loop total divided by iterations; includes Python/framework/API work |
| `device_us_per_iteration` | Stream event span divided by iterations; includes idle gaps inside the markers |
| `end_to_end_us_per_iteration` | Wall interval through stop-event completion, divided by iterations |
| `graph_setup_ms` | Capture/instantiation context plus final synchronization; excludes three preceding eager warmups and first replay/upload |
| `fresh_input_checks`, `passed`, `tolerance` | Completed correctness checks for the two fresh inputs and final result |
| `source_sha256`, `buffer_layout`, `environment` | Source identity, per-mode shapes/addresses, and recorded environment; `torch_cuda_build` names the toolkit used to build PyTorch |

These are averages over a repeated, already allocated workload, not individual-request latency percentiles. The setup figure excludes context creation, allocation, and preflight. PyTorch 2.14's default `CUDAGraph(keep_graph=False)` instantiates at capture end; `keep_graph=True` has different first-replay behavior. The lab's preflight replays occur before timing.[^pytorch2026CudaGraphApi]

If graph mode reduces host time, check whether end-to-end time also improves. A shorter event span is consistent with fewer submission gaps, but the trace must verify the cause. Eager and explicit-stream modes retain the same data dependencies, so merely selecting another stream shouldn't imply parallel arithmetic. Repeat runs in different mode orders to inspect warm-state and drift effects; reused buffers aren't a residency guarantee.

## Diagnostic guide for runtime bottlenecks

| Symptom | Evidence to inspect | Possible cause | Next step |
|---|---|---|---|
| CPU timer reports tiny numbers, but end-to-end request latency is high | Host submission is fast, but `cudaStreamSynchronize` blocks for milliseconds | Host timer stopped immediately after enqueue without waiting for device completion | Use CUDA timing events or synchronize before stopping CPU timers |
| Consumer reads stale or partial data | Stream ordering, input lifetimes, and outputs across runs | Missing dependency or a separate memory fault | Record producer completion before the consumer wait; check buffer lifetime |
| Transfers don't overlap compute | API and device trace, buffer regions, stream flags | Staging, ordering, unsupported overlap, or resource contention | Use suitable pinned host buffers and remove unnecessary barriers after verifying dependencies |
| Stream capture fails | First failing API and capture error state | Capturing legacy stream, an unsupported call, or forbidden synchronization | Apply that API's capture rules; end invalid capture before reuse |
| Graph replay uses old inputs | Captured pointer and actual updated storage | Python binding changed while captured arguments stayed fixed | Retain static storage and order an in-place copy before replay |
| Dynamic batch size crashes or corrupts memory | Crash occurs when request count changes | Reused graph executable has incompatible tensor shapes or grid bindings | Implement bucketed graph pools with padded masking and eager fallback |
| Graph gives little improvement | Completed latency, dispatch gaps, graph mode, and setup amortization | Submission may be a small cost, or replay may add other work | Locate the remaining cost before choosing kernel or runtime changes |
| Persistent worker degrades other workloads | Resource usage and runnable work in their traces | Worker residency can prevent other blocks from starting | Check a smaller grid and whether dependencies still guarantee progress |

Host-enqueue gaps, missing dependencies, and long kernels leave different traces. Graph setup pays off when repeated execution saves more time than capture and instantiation cost. Generated kernels face those same timing constraints. Validate correctness and end-to-end impact alongside launch duration.

## Quiz

```mastery-quiz
[
  {
    "question": "A logical scheduler issues one operation per tick, starting at 0: copy A (copy stream, duration 4); map (compute, duration 3, waits for A); audit (other, duration 2); reduce (compute, duration 1). There are no other resource constraints. At which ticks do host submission and all device work complete?",
    "options": [
      "Host 4 / device 10",
      "Host 8 / device 8",
      "Host 4 / device 8",
      "Host 4 / device 11"
    ],
    "answer": "Host 4 / device 8",
    "explanation": "Copy runs 0–4; map waits and runs 4–7. Audit runs 2–4 independently. Reduce is issued at 3 but follows map on compute, so runs 7–8. Four submissions return at 4. The intervals overlap rather than adding to 12."
  },
  {
    "question": "An initially unrecorded event E receives wait W0. E is then recorded after producer work ending at 6, followed by W1. The handle is recorded again after later work ending at 11, followed by W2. Which captured-work completion tuple belongs to W0/W1/W2?",
    "options": [
      "0 / 6 / 11",
      "11 / 11 / 11",
      "0 / 11 / 11",
      "0 / 6 / 6"
    ],
    "answer": "0 / 6 / 11",
    "explanation": "W0 observes empty work because it precedes the first record. W1 keeps the first recorded state, ending at 6. W2 observes the second recorded state, ending at 11. Neither later recording retroactively changes an earlier submitted wait."
  },
  {
    "question": "In one context, blocking A starts at 0 and lasts 5 ticks. A legacy operation is requested at 1 for 2 ticks; blocking B is requested afterward at 2 for 3 ticks. Independent nonblocking N is requested at 1 for 2 ticks. With no resource contention, which earliest intervals follow?",
    "options": [
      "Legacy 1–3; B 3–6; N 1–3",
      "Legacy 5–7; B 7–10; N 7–9",
      "Legacy 5–7; B 5–8; N 1–3",
      "Legacy 5–7; B 7–10; N 1–3"
    ],
    "answer": "Legacy 5–7; B 7–10; N 1–3",
    "explanation": "The legacy operation waits for earlier blocking A, ending at 5, then runs 5–7. Later blocking B waits for legacy and runs 7–10. N has no implicit legacy edge and may run 1–3 under the given no-contention assumption."
  },
  {
    "question": "Before a successful capture, an ordinary Python counter is 7 and a GPU scalar is 2. Capture adds 4 to the Python counter and records an in-place GPU multiplication by 3. After capture, the graph is replayed twice and synchronized. What are the final counter and scalar?",
    "options": [
      "Counter 19; scalar 18",
      "Counter 11; scalar 18",
      "Counter 11; scalar 54",
      "Counter 19; scalar 54"
    ],
    "answer": "Counter 11; scalar 18",
    "explanation": "The Python increment executes once during capture, giving 11. The captured multiplication is recorded then runs twice on replay: 2 × 3 × 3 = 18. Counting capture as GPU execution would give 54; repeating ordinary Python on both replays would give 19."
  },
  {
    "question": "A captured graph computes sum((2x+1)²) from retained A = [2, −1]. The Python input name is rebound to B = [0, 3], and replay completes. Then B is copied into A with correct ordering and replay completes again. Which pair of sums follows?",
    "options": [
      "First 26; second 50",
      "First 50; second 50",
      "First 26; second 26",
      "First 50; second 26"
    ],
    "answer": "First 26; second 50",
    "explanation": "The first replay still reads captured A: 5² + (−1)² = 26. The ordered in-place copy changes A’s contents to 0, 3 while preserving its allocation: 1² + 7² = 50. Rebinding the Python name alone does not replace the captured pointer."
  },
  {
    "question": "A server has three captured graphs, all FP32 for adapter A, with capacities of 4, 6 and 10 rows. It uses the smallest compatible graph that fits the request, with eager execution as the fallback. Two five-row FP32 requests arrive, first for A and then for B. Each spare row holds x = 0. A diagnostic sum includes (2x + 1)² for every row before validity masking. Which capacity serves A, how much does padding add to its diagnostic sum, and how should B run?",
    "options": [
      "6 rows, adds 0, run B eagerly",
      "10 rows, adds 5, replay the A graph for B",
      "6 rows, adds 1, run B eagerly",
      "6 rows, adds 1, replay the A graph for B"
    ],
    "answer": "6 rows, adds 1, run B eagerly",
    "explanation": "Five rows exceed capacity 4 and leave one spare row at capacity 6. That row adds (2 × 0 + 1)² = 1 to the diagnostic sum. It would contribute 0 to a sum over valid rows. Capacity 10 would leave five spare rows and add 5, but capacity 6 already fits. Replaying an A graph for B would use the wrong adapter, so the server runs B eagerly."
  },
  {
    "question": "Graph setup costs 9 ms, eager execution 14 µs per iteration and replay 8 µs per iteration. For the constant-cost worksheet, what is the first integer iteration count whose total graph cost is strictly below eager?",
    "options": [
      "1500",
      "1501",
      "1126",
      "2"
    ],
    "answer": "1501",
    "explanation": "Setup is 9000 µs and each replay saves 6 µs. The equality ratio 9000 / 6 is 1500; totals tie there. The first strictly cheaper integer is 1501. Dividing by replay cost instead of the saving yields the wrong threshold."
  },
  {
    "question": "A timing record spans 400 iterations: total host enqueue 8 ms, elapsed device events 12 ms and completed wall time 13 ms. Which mean-per-iteration tuple in microseconds respects those intervals?",
    "options": [
      "20/30/62.5",
      "20/10/32.5",
      "8/12/13",
      "20/30/32.5"
    ],
    "answer": "20/30/32.5",
    "explanation": "Convert each millisecond interval to microseconds and divide by 400: 8000 / 400 = 20, 12000 / 400 = 30, 13000 / 400 = 32.5. These overlapping observations are reported separately. Adding host and device time would not recover completed wall time."
  },
  {
    "question": "A two-slot persistent queue has S0 marked completed while its CPU result reader is active, and S1 claimed by a worker. Request R3 is pending. Which request action and S0 transition preserve storage ownership?",
    "options": [
      "R3 enters S0; S0 releases at kernel completion",
      "R3 enters S1; S0 releases after its reader finishes",
      "R3 waits; S0 releases after its reader finishes",
      "R3 waits; S0 releases when R3 is enqueued"
    ],
    "answer": "R3 waits; S0 releases after its reader finishes",
    "explanation": "Both slots remain owned. Completed computation does not finish the CPU reader’s use, so S0 cannot be recycled yet. After that reader finishes, the protocol can release S0 and accept new work with its new request identity."
  },
  {
    "question": "An affine graph launch for x = 3 is already in flight with 2x + 1. A permitted bias update to −2 succeeds before the next launch. Separately, a whole-graph update candidate attempts to change the kernel’s owning context and the update reports failure. Which old / new-result and candidate action tuple follows?",
    "options": [
      "Old 7 / new 4; prepare a valid replacement or supported fallback",
      "Old 4 / new 4; launch the existing executable as the failed candidate",
      "Old 7 / new 7; launch the existing executable as the failed candidate",
      "Old 4 / new 7; prepare a valid replacement or supported fallback"
    ],
    "answer": "Old 7 / new 4; prepare a valid replacement or supported fallback",
    "explanation": "The in-flight launch keeps old parameters and gives 7. A subsequent accepted launch uses 2 × 3 − 2 = 4. The programming guide’s whole-graph update rules cannot change owning context. A rejected update does not bind the old executable to the candidate; build a valid replacement or fallback first."
  }
]
```

> **Next:** [AI-Generated Kernel Engineering](/learn/ai-generated-kernel-engineering) asks how to evaluate a generated kernel when correctness, submission costs, and measurement scope all affect the result.
