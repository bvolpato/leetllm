---
{
  "id": "gpu-profiling-correctness-benchmarking",
  "title": "Correct GPU Profiling and Benchmarking",
  "slug": "gpu-profiling-correctness-benchmarking",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 10,
  "companies": [
    "NVIDIA",
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "A 1.8x kernel speedup is credible only when outputs match a double-precision reference, CUDA events cover completed GPU work, and profiler runs record clocks and counter baselines.",
  "keyConceptsTested": [
    "Nsight Systems versus Nsight Compute scope",
    "Compute Sanitizer correctness workflow",
    "Reference implementations and numerical tolerances",
    "CUDA event timing and synchronization",
    "Warmup and first-use overhead",
    "Clock, power, and thermal controls",
    "Cache-hot versus buffer-rotated benchmarks",
    "Roofline and SpeedOfLight interpretation",
    "Robust latency summaries and paired comparisons",
    "Reproducible GPU run logs and counter records"
  ],
  "prerequisites": [
    "accelerator-architecture-field-guide",
    "cuda-gpu-computing-for-ml"
  ],
  "relatedQuestions": [
    "gpu-kernel-performance-engineering-lab",
    "inference-mechanics-ttft-tps-kv-cache",
    "flashattention-memory-efficient-attention",
    "scaling-llm-inference-batching-kv-cache"
  ]
}
---

A patch arrives with one exciting line: `triad_f32 is 1.8x faster`. It passed on one input, and a host timer printed a smaller number. On another run, the advantage shrinks. On a length that isn't divisible by 256, one output near the end changes.

A trustworthy performance result shows that both kernels computed the same operation, measured completed <span data-glossary="gpu">GPU</span> work under identical conditions, and improved the scope users care about. Profilers explain *where* time went; they cannot repair a broken comparison.

Streaming multiprocessors, <span data-glossary="hbm">high-bandwidth memory</span>, grids, and event timing, from the [Accelerator Architecture Field Guide](/learn/accelerator-architecture-field-guide) and [CUDA for ML Training](/learn/cuda-gpu-computing-for-ml), are enough machinery. Before that `1.8x` claim means anything, the triad kernel has to clear five verification steps:

1. **Reference Verification:** Compare every output against an independent reference within declared tolerances ($|y_i - r_i| \leq \text{atol} + \text{rtol}|r_i|$), including unaligned lengths (here a double-precision CPU reference).
2. **Compute Sanitizer:** Check exercised paths for invalid memory accesses and synchronization hazards across representative inputs.
3. **Clean Synchronized Timing:** Time completed GPU work with CUDA events, an explicit warmup schedule, and a cache regime matching the question, outside profilers and sanitizers.
4. **Hardware Roofline Bound:** Compare achieved throughput against the ceiling for the same hardware, dtype, and memory level, separating algorithmic useful bytes from measured HBM bytes.
5. **Reproducible Run Record:** Save source revision, GPU clocks, launch flags, Nsight section outputs, and raw event timings so another engineer can rerun the comparison directly.

One small kernel will carry the investigation. For every index $i$, it computes a floating-point triad:

$$
y_i = \alpha x_i + z_i
$$

It looks too small to fail. That makes it useful: if the evidence is weak here, a fused attention or <span data-glossary="quantization">quantization</span> kernel will hide the same mistakes behind far more code.

## Turn “faster” into a testable claim

Suppose a candidate replaces an existing `triad_f32` implementation. Before opening a profiler, write the claim so another engineer could disprove it. The starter gives a baseline and a deliberately incorrect variant; measure a speedup only after both implementations satisfy the same correctness rule.

| Claim field | Specification for the running kernel |
|---|---|
| Semantics | For each valid index, return `fmaf(alpha, x[i], z[i])` within declared tolerance |
| Workload | `float32`, $n=1{,}000{,}003$, deterministic input range |
| Scope | One completed kernel launch, excluding allocation and host-to-device copies |
| Cache regime | Report cache-hot and buffer-rotated measurements separately |
| Baseline | Same compiler flags, device, inputs, output check, and timing method; record each version's launch shape |
| Environment | GPU UUID, driver, CUDA runtime, source revision, clocks, power limit, and <span data-glossary="temperature">temperature</span> |
| Decision | Keep candidate only if correctness checks pass and measured scope improves |

The odd length is intentional. With 256 threads per block, the last block contains threads whose indexes exceed $n-1$. An index guard must reject them. Testing only lengths divisible by block size leaves an off-by-one bug invisible.

The arithmetic also supplies an early hypothesis. One triad element performs one multiply and one add, counted as two floating-point operations (FLOPs). Its algorithmic minimum traffic is two `float32` loads and one `float32` store, or 12 bytes:

$$
I_{algorithmic} = \frac{2\ \text{FLOPs}}{12\ \text{bytes}} \approx 0.167\ \text{FLOPs/byte}
$$

That low <span data-glossary="arithmetic-intensity">arithmetic intensity</span> suggests a bandwidth-sensitive kernel. Compare measured device-memory traffic with the 12-byte algorithmic floor, then inspect counters to identify whether high-bandwidth memory (HBM) limits this run. Caches, transaction efficiency, launch overhead, and extra instructions can all move the measured point.

> **💡 Key insight:** A performance hypothesis comes from operation and byte counts. A performance claim comes from a correctness-checked measurement on named hardware.

```checkpoint
A cache-hot run processes 1,000,003 elements in 8.0 microseconds. Using the 12-byte algorithmic floor, what useful bandwidth does that imply, and why doesn't it prove HBM delivered that rate?
---
The calculation is $\frac{12 \times 1{,}000{,}003}{8.0 \times 10^{-6}}$, or about $1{,}500$ GB/s. That number counts algorithmic input and output bytes. It isn't a device-memory traffic counter, so cache hits can make useful bandwidth exceed the GPU's HBM specification without violating a hardware limit.
```

## Gate 1: Reference verification and numerical tolerance

A trusted reference should be simpler than the candidate and independent enough to catch its mistakes. For triad, compute on the CPU in `double`, cast to `float`, and compare every element. A fused multiply-add (FMA) rounds the multiplication and addition together rather than rounding their intermediate product. The CPU reference rounds in `double` and then converts to `float`; the GPU's `fmaf` rounds directly to `float`. Higher precision helps here, but two-stage rounding isn't a universal bitwise oracle.[^nvidiaFloatingPoint2026]

A <span data-glossary="checksum">checksum</span> is too weak: two wrong values can cancel, and a single out-of-bounds write may miss sampled positions. Initialize output to a recognizable poison value before checking, so a skipped store can't inherit a previous correct result. Allocate each test's logical length, not a larger buffer that hides its tail overrun.

Floating-point comparison needs an explicit numerical specification. <span data-glossary="pytorch">PyTorch</span>'s `allclose` rule expresses that check cleanly:[^pytorchAllclose2026]

$$
|y_i - r_i| \leq \text{atol} + \text{rtol}|r_i|
$$

Here $y_i$ is the candidate output and $r_i$ is the reference. Relative tolerance scales with nonzero reference magnitude. Absolute tolerance protects values near zero, where relative error alone can explode. Neither constant is universal. Choose them from dtype, operation count, expected rounding, input range, and downstream quality requirements, then freeze them before comparing candidates.

For `float32` inputs in a controlled range and one fused multiply-add, this lab uses `atol = 2e-6` and `rtol = 2e-5`. Those are acceptance settings for this workload, not recommended defaults for arbitrary kernels. A reduction over thousands of values needs different analysis because accumulation order changes rounding.

<figure>
  <img src="illustrations/_generated/tolerance_reference_band_dark.png" alt="The exact tolerance rule is |yᵢ − rᵢ| ≤ 2×10⁻⁶ + 2×10⁻⁵|rᵢ|. On a logarithmic absolute-error axis, allowed error grows from 0.000002 at reference zero, to 0.000022 at reference one, to 200000.000002 at reference 10¹⁰. Sample residuals sit at half the tolerance band. The CPU path evaluates an FMA in double then casts to float; the GPU path uses a float FMA, so acceptance follows the declared precision rule." />
  <figcaption>The absolute term anchors comparisons near zero; the relative term expands the allowed band with reference magnitude. The plotted residuals are half-limit teaching examples. The CPU and GPU paths round at different precisions, so every output is judged against the declared precision rule.</figcaption>
</figure>

Exercise the tolerance check across shapes and values that expose distinct failure modes:

| Test | Why it exists | Failure signature |
|---|---|---|
| $n=0$ and $n=1$ | empty and smallest legal work | launch or guard assumption |
| $n=255,256,257$ | both sides of one block size | last-block indexing bug |
| $n=1{,}000{,}003$ | realistic rounded-up grid | rare tail corruption |
| zeros and cancellation | reference values near zero | missing absolute tolerance |
| largest lab magnitude, $10^{10}$ | large-value rounding and cancellation | absolute- or relative-error spike |
| repeated seeds | varied values with reproducible inputs | input-sensitive mismatch |

This CPU-only indexing example isolates the allocation trap. Python bounds checks stand in for the illegal access that a CUDA sanitizer reports, illustrating how stray trailing storage hides an off-by-one guard:

<!-- leetllm: test, output=show -->

```python title="expose-the-tail-allocation-trap.py"
import math

def write_indexes(n, allocated, inclusive=False):
    output = [math.nan] * allocated
    launched = ((n + 255) // 256) * 256
    for i in range(launched):
        if i < n or (inclusive and i == n):
            output[i] = float(i)  # Python raises on an allocation overrun.
    return output

n = 257
correct = write_indexes(n, n)
oversized = write_indexes(n, 512, inclusive=True)
print("logical output matches:", oversized[:n] == correct)
print("illegal extra store:", oversized[n])
try:
    write_indexes(n, n, inclusive=True)
except IndexError:
    print("exact allocation: tail overrun caught")
print("empty input:", write_indexes(0, 0))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
logical output matches: True
illegal extra store: 257.0
exact allocation: tail overrun caught
empty input: []
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/tail_allocation_trap_dark.png" alt="For n = 257, blocks of 256 launch 512 threads. The logical output ends at index 256. With an exact 257-slot allocation, the inclusive guard i <= n attempts the out-of-bounds index 257. With 512 allocated slots, index 257 is inside storage but outside the result: the extra write changes NaN to 257.0 while the first 257 outputs match; index 258 remains NaN." />
  <figcaption>The CPU model runs n = 257 with two 256-thread blocks. An exact allocation raises at index 257, while a 512-slot allocation accepts the stray write and leaves all 257 result values intact.</figcaption>
</figure>

## Gate 2: Compute Sanitizer and runtime memory safety

Reference comparison catches wrong values that reach output. Runtime tools catch illegal execution that happens to leave checked values unchanged. NVIDIA Compute Sanitizer provides four specialized checkers:[^computeSanitizer2026]

- `memcheck`: Detects out-of-bounds global, shared, and local memory accesses, misaligned memory instructions, and illegal device pointers.
- `racecheck`: Detects shared-memory data hazards (RAW, WAR, WAW hazards where threads in a block access the same shared memory location without synchronization).
- `initcheck`: Flags reads of uninitialized global memory, catching kernels that assume memory allocations come pre-zeroed.
- `synccheck`: Catches illegal barrier synchronization, such as calling `__syncthreads()` inside divergent branches where not all warps arrive.

Run `memcheck` first. NVIDIA recommends it before tools such as `racecheck` and `synccheck`, which don't replace memory-access checking.[^computeSanitizer2026] This lab uses `--padding 32` to place additional padding after supported global-memory allocations, exposing overruns that might otherwise reach another valid allocation. Padding doesn't detect a write beyond a logical tensor's shape when that write remains inside its own oversized allocation. `--error-exitcode 99` gives a successful application a nonzero exit status when the checker reports errors; inspect the report and application status together.

The tools have different scopes. In particular, `racecheck` targets shared-memory hazards; it isn't a general detector of all global-memory races. A clean run covers the tested inputs, executed paths, and enabled checks, rather than all possible executions.

<figure>
  <img src="illustrations/_generated/evidence_gate_path_dark.png" alt="A candidate kernel passes through five connected evidence gates: compare to a numerical reference, check memory and synchronization safety, measure completed work outside profilers, compare achieved throughput and memory traffic against hardware roofs, then log source revision, GPU clocks, commands, and Nsight counter outputs. A failure path from any gate rejects, repairs, and reruns before the speedup claim can continue." />
  <figcaption>Reference comparison, sanitizer checks, clean timing, matched hardware roofs, and a reproducible run log answer separate questions. Any failed gate returns the candidate for repair and a fresh run.</figcaption>
</figure>

This sequence prevents an embarrassing trap. A profiler can report record-breaking memory throughput for a kernel that reads past buffer bounds. High hardware utilization never upgrades undefined behavior into a valid optimization. Once the values and the sanitizer agree, which part of the timeline is the 1.8x actually describing?

## Profiler scope: Nsight Systems versus Nsight Compute

The 1.8x might belong to the kernel, a copy, or a host gap. Start wide enough to see which of those owns the delay, then zoom into one proven hotspot. NVIDIA separates those scopes across Nsight Systems and Nsight Compute.[^nsightSystems2026][^nsightCompute2026]

| Question | Instrument | Signal it gives | What it cannot prove alone |
|---|---|---|---|
| Why is the application waiting? | Nsight Systems | CPU scheduling, <span data-glossary="cuda">CUDA</span> API calls, transfers, kernels, streams, synchronization, idle gaps | Exact instruction or memory limit inside one kernel |
| Why is this kernel slow? | Nsight Compute | Launch resources, SpeedOfLight sections, cache and device-memory traffic, warp stalls, Roofline point | User-visible end-to-end latency or output correctness |
| Is CUDA execution legal? | Compute Sanitizer | Invalid access, shared-memory hazard, uninitialized read, invalid barrier use | Representative performance under normal execution |
| How long did completed device work take? | CUDA events or a synchronizing benchmark harness | Device elapsed time for declared event boundaries | Cause of the elapsed time |

### Nsight Systems finds system-level bottlenecks

Open a <span data-glossary="tracing">system trace</span> before assuming the hottest-looking kernel owns application delay. Nsight Systems combines selected CUDA/CUPTI activity and CPU tracing. Overhead depends on enabled features and the workload; tracing more APIs, collecting backtraces, or tracking memory can substantially perturb a run.[^nsightSystems2026] Compare traced and clean executions. Look for large transfers, CPU preparation gaps, stream serialization, blocking scalar reads, and GPU idle bubbles. A long kernel is actionable only if it lies on the claim's critical path.

For this lab, event synchronization after every sample intentionally serializes launches. Nsight Systems reveals that pattern immediately. It's correct for the isolated kernel-latency question, but it would distort a throughput experiment that expects multiple kernels or requests in flight. Scope determines whether synchronization defines the timing window or creates an application bottleneck.

### Nsight Compute diagnoses kernel microarchitecture

Once `triad_f32` is a known hotspot on the critical path, collect kernel metrics. Nsight Compute hooks directly into hardware performance monitoring units (PMUs) on the streaming multiprocessors. Its report sections cover launch configuration, memory workload analysis, GPU Speed of Light, and Roofline analysis.[^nsightCompute2026]

Its baseline feature compares two kernel runs side-by-side. However, microarchitectural profiling changes the physical execution conditions.

### Profiler distortions: multi-pass replay and counter perturbation

Not every requested counter can be collected together. Nsight Compute may need multiple passes; the count depends on the metric set and GPU. Under **kernel replay**, it saves memory accessed by the kernel and restores the written subset before subsequent passes. A report requiring only one pass may avoid that save/restore work.[^nsightCompute2026]

The collection mode changes the experiment:
- Default cache control flushes GPU caches before each replay pass, removing reuse that a normal application may retain.
- Nsight Compute normally serializes kernel launches for isolated counter collection. That doesn't mean it serializes every warp or memory-controller queue.
- Save/restore, metric collection, and repeated execution increase collection cost. Application replay and range replay have different tradeoffs; range modes can preserve concurrent work where isolated kernel replay would change its behavior.

Never quote elapsed time from an instrumented profiler report as a clean benchmark. Profilers explain *why* code behaves as it does; clean, un-instrumented benchmark runs measure *how fast* it actually finishes.

### Sanitizers run outside timing

Compute Sanitizer instruments execution and can add substantial overhead. Its standalone mode launches kernels nonblocking by default; `--force-blocking-launches` changes that behavior.[^computeSanitizer2026] Instrumentation can alter scheduling without universally serializing concurrent warps. Finish the sanitizer run, inspect its outcome, and collect latency in a separate execution.

> **⚠️ Common mistake:** Running every tool simultaneously produces an expensive, distorted execution whose timing answers no valid question. Keep correctness verification, microarchitectural diagnosis, and clean benchmark timing as separate, linked runs.

<figure>
  <img src="illustrations/_generated/profile_scope_and_replay_dark.png" alt="A request-level Nsight Systems view orders CPU preparation, transfer, a kernel hotspot, and synchronization, with measured stream spans rather than synthetic numbers. In Nsight Compute kernel replay, all GPU memory accessible to the kernel is saved before pass one. That pass runs after a cache flush, then the profiler identifies the memory the kernel wrote. Before each later pass, Nsight Compute restores the original contents of that written subset, flushes GPU caches, and reruns the kernel for more counters. Kernel launches are serialized for isolated collection, while warps and memory-controller queues remain concurrent. A separate normal application workload holds its same-buffer or rotated-buffer cache policy constant. Clean CUDA-event latency and Compute Sanitizer run separately." />
  <figcaption>Systems locates the request bottleneck; Compute examines a proven hotspot. Kernel replay snapshots accessible memory before pass one, then restores written bytes and flushes caches before later passes, keeping the application's cache regime separate from clean event timing.</figcaption>
</figure>

## Gate 3: Synchronized timing and benchmark state control

“Kernel time” still leaves choices. State whether the product reuses the same resident data, streams new buffers, overlaps launches, or includes transfers. Different scopes can all be legitimate, but they can't share one unlabeled number.

| Measurement question | Include | Exclude | Timing method |
|---|---|---|---|
| Isolated device interval | One kernel on resident buffers, plus any gaps inside event boundaries | Allocation and copies | CUDA events around launch |
| Steady pipeline throughput | Representative sequence with normal overlap | One-time setup | Events around batch or end-to-end synchronized wall clock |
| First request latency | Compile, lazy initialization, allocation, and transfers that user experiences | Unrelated process startup | Synchronized end-to-end clock |
| Cache-sensitive stream | Rotated working set sized beyond relevant cache | Accidental same-buffer reuse | Events plus cache counters |

### Host and device asynchrony: time GPU streams separately from host launches

CUDA kernel launches are asynchronous with respect to the host: a successful return does not mean the kernel finished. The host call can still block because of internal resources or contention. Submission cost has no universal microsecond value, and the GPU may already have started when the call returns.[^cuda2026apiSync]

An unsynchronized host timer around a launch measures the host-call interval. It can include API blocking, but doesn't capture completed device work. A shorter host interval therefore never implies a faster kernel. Use a monotonic host clock with explicit completion when the question is end-to-end wall time.

CUDA events solve this by placing timestamp markers into the execution stream:

```cpp
cudaEvent_t start, stop;
CUDA_CHECK(cudaEventCreate(&start));
CUDA_CHECK(cudaEventCreate(&stop));

CUDA_CHECK(cudaEventRecord(start, stream));
launch_triad<<<blocks, threads, 0, stream>>>(...);
CUDA_CHECK(cudaEventRecord(stop, stream));

CUDA_CHECK(cudaEventSynchronize(stop));
float elapsed_ms = 0.0f;
CUDA_CHECK(cudaEventElapsedTime(&elapsed_ms, start, stop));
```

Both events must be timing-enabled and ordered around the work in its stream. Waiting for `stop` guarantees completion of work captured by that event; only then read the elapsed interval.[^cudaRuntimeEvents2026]

An event interval can include submission gaps, kernel stalls, and interference from other work. It excludes a queue delay that occurs entirely before the start event executes. It therefore isn't automatically pure instruction time or the entire host-to-completion latency.

`cudaDeviceSynchronize()` waits for preceding work on the current device in the caller's CUDA execution context; it doesn't suspend all streams across every process on the physical GPU.[^cuda2026deviceManagement] A host wait after each launch prevents that host thread from submitting its next launch concurrently. Event synchronization narrows the completion dependency, but independent streams can still compete for resources and affect the interval.

<figure>
  <img src="illustrations/_generated/timing_boundaries_dark.png" alt="A constructed CPU/GPU trace shares a 0–85 μs axis. The host launch call runs from 0 to 3 μs. CUDA events run from 5 to 75 μs, measuring 70 μs that include a 5 μs GPU gap and a kernel from 10 to 75 μs. Host synchronization returns at 78 μs." />
  <figcaption>The host returns from launch at 3 µs while CUDA events measure 70 µs (a 5 µs gap plus 65 µs of kernel execution) and host synchronization completes at 78 µs.</figcaption>
</figure>

CUDA events have roughly 0.5-microsecond resolution.[^cudaRuntimeEvents2026] For tiny kernels, time a batch and divide by launch count to obtain a clean mean interval (keeping batch size and cache regime identical across versions).

### Cache policy: test residency rather than assume it

The three triad buffers occupy $12{,}000{,}036$ bytes, about 11.44 MiB. H100 has a nominal 50 MB L2 cache, so this footprint can fit.[^nvidia2026hopperTuning] Actual residency depends on cache replacement, address mapping, competing work, and initialization, so check your selected device's reported L2 size rather than a cross-model table.

Suppose a warm same-buffer launch completes in **3 microseconds**. Dividing useful bytes by that interval gives about 4,000 GB/s of effective bandwidth. Hardware counters distinguish cache service, device-memory traffic, and other effects; useful-byte accounting can yield a rate above the HBM specification.

Real applications can reuse weights or intermediates in cache; other paths stream fresh data. A same-buffer benchmark can be representative, or misleading, depending on the path being optimized. Label the regime before choosing a winner.

Two experiments encourage cache turnover:
1. **Buffer rotation:** Cycle through distinct buffer triplets. The starter targets an aggregate footprint above twice the reported L2 capacity, subject to its memory budget. Inspect traffic counters to determine whether each launch's loads and stores reached HBM.
2. **Separate sweep:** Access a large dummy buffer between timed launches when rotation is impractical. Verify L2 eviction and dirty-writeback traffic directly with hardware counters.

For either experiment, examine traffic and hit-rate counters under matching profiling settings. Nsight Compute's explicit cache-flush control is a profiler facility; a normal rotation loop isn't an architectural cache flush, so confirm HBM traffic with counters.

<figure>
  <img src="illustrations/_generated/benchmark_sample_bias_dark.png" alt="Two physical working-set patterns feed the same triad kernel. Repeated X₀, Z₀, and Y₀ addresses total 11.44 MiB and can fit in a nominal 50 MB H100 L2, while rotating triplets target an aggregate footprint above twice the selected L2 capacity. Warmup touches every slot twice, up to a minimum of 20 launches. Normalized latency curves contrast L2-resident and HBM-streaming working sets; hardware counters confirm residency and byte traffic." />
  <figcaption>Address reuse and working-set size shape the cache regime. Warmup scales with the rotating slot count, and hardware counters separate L2 cache service from HBM traffic.</figcaption>
</figure>

### Warm until mechanism is steady

First use can include initialization, allocation, module loading, compilation, and clock changes. Which costs appear in samples depends on where the event pair sits. This starter initializes the runtime and allocates buffers before timing; warming its kernel loop doesn't measure those earlier costs.

Use preliminary runs to pick a warmup count from latency and clock stability, then freeze it before comparing versions. Preserve later slow samples and investigate their cause, since thermal or power throttling during sustained execution belongs in the evidence.

### Record clocks, power, and thermal state

GPU clocks dynamically adjust based on thermal headroom, power limits, and concurrent workloads. A candidate kernel measured after the card has heated up can appear slower even when its instruction stream is superior. NVIDIA System Management Interface (`nvidia-smi`) provides scriptable state queries:[^nvsmi]

```bash title="terminal"
nvidia-smi --query-gpu=timestamp,uuid,name,driver_version,pstate,clocks.sm,clocks.mem,temperature.gpu,power.draw,power.limit --format=csv
```

On dedicated hardware where you control GPU clocks, a supported SM clock lock reduces frequency variation. Select one GPU and a requested frequency appropriate to it (replacing the UUID and 1,500 MHz with values for your target GPU):[^nvsmi]

```bash title="terminal"
BENCH_GPU_UUID="GPU-replace-with-UUID"
BENCH_SM_MHZ=1500
sudo nvidia-smi -i "$BENCH_GPU_UUID" --lock-gpu-clocks="$BENCH_SM_MHZ,$BENCH_SM_MHZ"
```

Record the prior clock state and restore it afterward (`nvidia-smi -i "$BENCH_GPU_UUID" --reset-gpu-clocks` restores defaults). A requested SM lock doesn't lock memory clocks or prevent thermal and power limits from reducing frequency, so record observed SM and memory clocks alongside the requested settings.

When locking is unavailable, record observed state around each round and use time-series monitoring where possible. Before/after snapshots can miss changes inside a run. If versions experienced different thermal, power, or competing-work conditions, investigate and repeat rather than treating the pair as controlled.

### Preserve the distribution with alternating paired rounds (ABBA)

Reporting only the minimum execution time rewards random noise. Reporting a single mean obscures bimodal behavior and tail latency. Preserve raw samples, reporting sample count, median, p10, p90, and the p10-to-p90 spread.

An `A, B, B, A` order balances which implementation runs earlier and later, reducing systematic order bias. It doesn't prevent thermal drift or background work. Preserve block identity and state observations. Within each round $r$, summarize the matched A blocks and B blocks with the same rule, then compute:

$$
\text{speedup}_r = \frac{\text{baseline median latency in round }r}{\text{candidate median latency in round }r}
$$

Then examine round-level speedups. A $1.2\times$ win followed by a $0.9\times$ loss shows a reversal; it doesn't identify thermal equilibrium as the cause. Inspect state and raw samples, and collect more balanced rounds. Define any uncertainty interval's method and unit of resampling; thousands of correlated launches aren't thousands of independent rounds.

```checkpoint
Two controlled rounds produce baseline and candidate medians of `(12, 10)` and `(9, 10)` microseconds. What are the round speedups, and why is one pooled speedup inadequate?
---
The round speedups are $12/10 = 1.2\times$ and $9/10 = 0.9\times$. The candidate wins one round and loses the other, so pooling samples into one number would hide a reversal that may come from drift or an unstable effect. Report both round-level results, inspect clocks and temperature, and collect more alternating rounds before making a speed claim.
```

<figure>
  <img src="illustrations/_generated/paired_round_reversal_dark.png" alt="Two matched ABBA rounds retain implementation order and per-round medians. Round 1 has baseline 12 microseconds and candidate 10 microseconds, so its speedup is 1.2×. Round 2 has baseline 9 microseconds and candidate 10 microseconds, so its speedup is 0.9×. The connected round-level dot plot crosses the 1.0 reference. Clocks, temperature, power, and competing work are observations to compare, not assumed causes; raw samples and acquisition order remain preserved." />
  <figcaption>Round 1 sits above the no-change line; round 2 falls below it. The reversal stays visible when samples remain paired by round and state observations are recorded alongside the ABBA order.</figcaption>
</figure>

## Gate 4: Hardware Roofline and Speed-of-Light bounds

The <span data-glossary="roofline-model">Roofline model</span> bounds attainable performance by the smaller of the compute ceiling and the bandwidth ceiling scaled by arithmetic intensity:[^williams2009]

$$
P \leq \min(P_{peak},\ I \times BW)
$$

Nsight Compute plots the achieved point against precision- and device-specific ceilings. The sloped region represents the memory-bandwidth bound; the flat region represents the peak-compute bound. The ridge is their intersection.[^nsightCompute2026]

For triad, algorithmic intensity begins near `0.167 FLOPs/byte`. Compare byte counts and bandwidth at the same memory level: an L2 hit is still an input load, but not an HBM read. More than 12 HBM bytes per element can indicate transaction inefficiency or redundant traffic; fewer can indicate cache reuse or another traffic-reducing mechanism. Under a genuinely streaming regime, approaching both the useful-byte floor and the bandwidth roof leaves little for shared-memory staging to remove.

<figure>
  <img src="illustrations/_generated/triad_traffic_roofs_dark.png" alt="One triad element reads xᵢ and zᵢ as two 4-byte FP32 values, computes αxᵢ + zᵢ with two FLOPs, and writes yᵢ as one 4-byte value: 12 algorithmic bytes and 2 FLOPs, or 1/6 FLOP per byte. Logical useful bytes are accounted separately from observed L2 and HBM traffic. For 1,000,003 elements, 12,000,036 useful bytes divided by an assumed 8 microseconds is about 1,500 GB/s; an assumed 3 microseconds is about 4,000 GB/s. Both figures report algorithmic useful-byte throughput rather than physical HBM counter traffic." />
  <figcaption>Two FP32 loads and one FP32 store set the 12-byte useful-traffic floor. A Roofline point needs bytes and time from the same memory regime; HBM counters remain a separate observation.</figcaption>
</figure>

Read several sections together:

| Nsight Compute evidence | Question answered | Sound next move |
|---|---|---|
| `LaunchStats` | Did grid, block, registers, or shared memory constrain launch? | change launch resources only when metric identifies pressure |
| `SpeedOfLight` | Which compute or memory paths approach throughput ceiling? | inspect saturated path and corroborating stalls |
| `MemoryWorkloadAnalysis` | How much traffic reaches cache levels and device memory? | compare measured bytes with algorithmic minimum |
| Roofline chart | Does achieved point sit in bandwidth or compute region? | target bytes/reuse on slope; target math pipeline near flat roof |

One percentage isn't diagnosis. Low compute utilization can mean memory limit, too little parallel work, launch overhead, dependencies, or host starvation. High device-memory utilization can coexist with wasteful transactions. Roofline locates achieved point; system trace and detailed counters explain why it landed there.

For streaming triad, test this hypothesis:

1. Reference and sanitizer pass.
2. Nsight Systems confirms kernel dominates selected scope rather than copies or host gaps.
3. Nsight Compute shows low arithmetic intensity and strong device-memory pressure.
4. Measured bytes per element are compared with 12-byte algorithmic floor.
5. Optimization targets excess traffic or access order. Shared memory is rejected when it can't remove compulsory traffic.

If the measurements don't support that sequence, revise the hypothesis before changing the kernel.

```checkpoint
Nsight Compute places `triad_f32` near the sloped bandwidth roof, but Nsight Systems shows that the GPU is idle for most of the request while the CPU prepares inputs. What can you conclude, and which scope should you optimize first?
---
You can conclude that the isolated kernel is probably bandwidth-limited under the profiled workload. You can't conclude that kernel tuning will materially improve request latency. The system trace identifies CPU preparation on the request's critical path, so measure and repair that wider bottleneck before spending effort on a kernel already near its roof.
```

## Run the triad investigation: five gates in code

The CUDA lab compares two tiny kernels: `triad_buggy` (with an off-by-one `i <= n` guard) and `triad_f32` (with the exact `i < n` guard):

```cpp title="triad_kernels.cu"
__global__ void triad_buggy(
    const float* x, const float* z, float* y, std::size_t n, float alpha
) {
    const std::size_t i = static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
    if (i <= n) {
        y[i] = fmaf(alpha, x[i], z[i]);
    }
}

__global__ void triad_f32(
    const float* x, const float* z, float* y, std::size_t n, float alpha
) {
    const std::size_t i = static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
    if (i < n) {
        y[i] = fmaf(alpha, x[i], z[i]);
    }
}
```

The complete standalone harness wraps both kernels with a double-precision CPU reference checker, NaN-poisoned outputs, `--check` / `--buggy` / `--profile` / `--bench-hot` / `--bench-rotate` modes, CUDA event timing, and raw-sample CSV logging. Expand the block below to save `triad_bench.cu` locally:

<details>
<summary>Full C++ benchmark harness: triad_bench.cu</summary>

```cpp title="triad_bench.cu"
#include <cuda_runtime.h>

#include <algorithm>
#include <cstddef>
#include <cmath>
#include <cstdlib>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

static void cuda_check(cudaError_t status, const char* call) {
    if (status != cudaSuccess) {
        std::cerr << call << ": " << cudaGetErrorString(status) << "\n";
        std::exit(1);
    }
}

#define CUDA_CHECK(call) cuda_check((call), #call)

__global__ void triad_buggy(
    const float* x,
    const float* z,
    float* y,
    std::size_t n,
    float alpha
) {
    const std::size_t i = static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
    if (i <= n) {
        y[i] = fmaf(alpha, x[i], z[i]);
    }
}

__global__ void triad_f32(
    const float* x,
    const float* z,
    float* y,
    std::size_t n,
    float alpha
) {
    const std::size_t i = static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
    if (i < n) {
        y[i] = fmaf(alpha, x[i], z[i]);
    }
}

static void launch_triad(
    bool buggy,
    const float* x,
    const float* z,
    float* y,
    std::size_t n,
    float alpha,
    cudaStream_t stream = nullptr
) {
    if (n == 0) {
        return;
    }
    constexpr int threads = 256;
    const int blocks = static_cast<int>((n + threads - 1) / threads);
    if (buggy) {
        triad_buggy<<<blocks, threads, 0, stream>>>(x, z, y, n, alpha);
    } else {
        triad_f32<<<blocks, threads, 0, stream>>>(x, z, y, n, alpha);
    }
    CUDA_CHECK(cudaGetLastError());
}

struct Verification {
    std::size_t failures;
    double max_abs;
    double max_rel;
};

static Verification compare_outputs(
    const std::vector<float>& x,
    const std::vector<float>& z,
    const std::vector<float>& actual,
    std::size_t n,
    float alpha
) {
    if (x.size() < n || z.size() < n || actual.size() != n || !std::isfinite(alpha)) {
        throw std::invalid_argument("invalid reference inputs or output length");
    }

    constexpr double atol = 2e-6;
    constexpr double rtol = 2e-5;
    Verification result{0, 0.0, 0.0};

    for (std::size_t i = 0; i < n; ++i) {
        const double reference64 = std::fma(
            static_cast<double>(alpha),
            static_cast<double>(x[i]),
            static_cast<double>(z[i])
        );
        const float reference = static_cast<float>(reference64);
        if (!std::isfinite(reference) || !std::isfinite(actual[i])) {
            ++result.failures;
            result.max_abs = result.max_rel = std::numeric_limits<double>::infinity();
            continue;
        }
        const double abs_error = std::abs(
            static_cast<double>(actual[i]) - static_cast<double>(reference)
        );
        const double rel_error = abs_error / std::max(std::abs(static_cast<double>(reference)), 1e-30);
        const double allowed = atol + rtol * std::abs(static_cast<double>(reference));

        result.max_abs = std::max(result.max_abs, abs_error);
        result.max_rel = std::max(result.max_rel, rel_error);
        if (abs_error > allowed) {
            ++result.failures;
        }
    }
    return result;
}

static Verification verify(
    const std::vector<float>& x, const std::vector<float>& z,
    float* device_y, std::size_t n, float alpha
) {
    std::vector<float> actual(n);
    if (n != 0) {
        CUDA_CHECK(cudaMemcpy(actual.data(), device_y, n * sizeof(float), cudaMemcpyDeviceToHost));
    }
    return compare_outputs(x, z, actual, n, alpha);
}

static void fill_inputs(
    std::vector<float>& x,
    std::vector<float>& z,
    unsigned int seed,
    float alpha
) {
    for (std::size_t i = 0; i < x.size(); ++i) {
        const int x_code = static_cast<int>((i * 29 + seed * 17) % 251) - 125;
        const int z_code = static_cast<int>((i * 31 + seed * 13) % 239) - 119;
        x[i] = static_cast<float>(x_code) / 63.0f;
        z[i] = static_cast<float>(z_code) / 71.0f;
        if (i % 4096 == 0) {
            x[i] = 0.0f;
            z[i] = 0.0f;
        } else if (i % 4096 == 1) {
            x[i] = 1.0f;
            z[i] = -alpha;
        } else if (i % 4096 == 2) {
            x[i] = 1e10f;
            z[i] = -1e10f;
        }
    }
}

static double percentile(const std::vector<float>& sorted, double q) {
    if (sorted.empty() || !std::isfinite(q) || q < 0.0 || q > 1.0 ||
        !std::is_sorted(sorted.begin(), sorted.end()) ||
        std::any_of(sorted.begin(), sorted.end(), [](float v) { return !std::isfinite(v) || v <= 0; })) {
        throw std::invalid_argument("expected sorted, finite positive samples and q in [0, 1]");
    }
    const double position = q * (sorted.size() - 1);
    const auto lower = static_cast<std::size_t>(std::floor(position));
    const auto upper = static_cast<std::size_t>(std::ceil(position));
    return sorted[lower] + (position - lower) * (static_cast<double>(sorted[upper]) - sorted[lower]);
}

static std::string cuda_version(int encoded) {
    return std::to_string(encoded / 1000) + "." + std::to_string((encoded % 1000) / 10);
}

int main(int argc, char** argv) {
    const std::string mode = argc > 1 ? argv[1] : "--check";
    const bool bench_hot = mode == "--bench-hot";
    const bool bench_rotate = mode == "--bench-rotate";
    const bool benchmark = bench_hot || bench_rotate;

    if (
        argc > 3 ||
        (
            mode != "--check" &&
            mode != "--buggy" &&
            mode != "--profile" &&
            !benchmark
        )
    ) {
        std::cerr << "usage: ./triad_bench [--check|--buggy|--profile|--bench-hot|--bench-rotate] [samples.csv]\n";
        return 2;
    }
    if (argc == 3 && !benchmark) {
        std::cerr << "a sample CSV path is valid only for benchmark modes\n";
        return 2;
    }

    constexpr std::size_t n = 1'000'003;
    constexpr float alpha = 1.25f;
    const std::size_t bytes = n * sizeof(float);

    cudaDeviceProp properties{};
    CUDA_CHECK(cudaGetDeviceProperties(&properties, 0));
    int runtime_version = 0;
    int driver_api_version = 0;
    CUDA_CHECK(cudaRuntimeGetVersion(&runtime_version));
    CUDA_CHECK(cudaDriverGetVersion(&driver_api_version));
    std::cout << "device=" << properties.name
              << " compute_capability=" << properties.major << "." << properties.minor
              << " l2_bytes=" << properties.l2CacheSize
              << " cuda_runtime=" << cuda_version(runtime_version)
              << " cuda_driver_api=" << cuda_version(driver_api_version) << "\n";

    std::vector<float> host_x(n);
    std::vector<float> host_z(n);
    fill_inputs(host_x, host_z, 7, alpha);

    int slots = 1;
    if (bench_rotate) {
        const std::size_t slot_bytes = 3 * bytes;
        const std::size_t target_bytes = std::max(
            8 * slot_bytes,
            2 * static_cast<std::size_t>(properties.l2CacheSize) + slot_bytes
        );
        const std::size_t desired_slots = (target_bytes + slot_bytes - 1) / slot_bytes;

        std::size_t free_bytes = 0;
        std::size_t total_bytes = 0;
        CUDA_CHECK(cudaMemGetInfo(&free_bytes, &total_bytes));
        const std::size_t affordable_slots = std::max<std::size_t>(1, free_bytes / (4 * slot_bytes));
        if (desired_slots > affordable_slots) {
            std::cerr << "buffer rotation needs " << desired_slots * slot_bytes
                      << " bytes but conservative allocation budget is "
                      << affordable_slots * slot_bytes << " bytes\n";
            return 1;
        }
        slots = static_cast<int>(desired_slots);
        std::cout << "rotation_target_bytes=" << target_bytes
                  << " rotation_working_set_bytes=" << slots * slot_bytes
                  << " free_bytes=" << free_bytes
                  << " total_bytes=" << total_bytes << "\n";
    }

    std::vector<float*> xs(slots, nullptr);
    std::vector<float*> zs(slots, nullptr);
    std::vector<float*> ys(slots, nullptr);

    for (int slot = 0; slot < slots; ++slot) {
        fill_inputs(host_x, host_z, 7 + static_cast<unsigned int>(slot), alpha);
        CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&xs[slot]), bytes));
        CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&zs[slot]), bytes));
        CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&ys[slot]), bytes));
        CUDA_CHECK(cudaMemcpy(xs[slot], host_x.data(), bytes, cudaMemcpyHostToDevice));
        CUDA_CHECK(cudaMemcpy(zs[slot], host_z.data(), bytes, cudaMemcpyHostToDevice));
        CUDA_CHECK(cudaMemset(ys[slot], 0xff, bytes));  // NaN poison catches omitted stores.
    }
    fill_inputs(host_x, host_z, 7, alpha);  // Reference for slot zero.

    if (mode == "--buggy") {
        launch_triad(true, xs[0], zs[0], ys[0], n, alpha);
        CUDA_CHECK(cudaDeviceSynchronize());
        std::cout << "buggy launch completed; inspect it under Compute Sanitizer\n";
    } else if (mode == "--profile") {
        launch_triad(false, xs[0], zs[0], ys[0], n, alpha);
        CUDA_CHECK(cudaDeviceSynchronize());
        std::cout << "profile launch complete n=" << n << "\n";
    } else if (mode == "--check") {
        const std::vector<std::pair<std::size_t, unsigned int>> cases = {
            {0, 7}, {1, 7}, {255, 7}, {256, 7}, {257, 7},
            {n, 7}, {n, 19}, {n, 101},
        };
        for (const auto& [test_n, seed] : cases) {
            fill_inputs(host_x, host_z, seed, alpha);
            float *test_x = nullptr, *test_z = nullptr, *test_y = nullptr;
            if (test_n != 0) {
                const auto test_bytes = test_n * sizeof(float);
                CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&test_x), test_bytes));
                CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&test_z), test_bytes));
                CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&test_y), test_bytes));
                CUDA_CHECK(cudaMemcpy(test_x, host_x.data(), test_bytes, cudaMemcpyHostToDevice));
                CUDA_CHECK(cudaMemcpy(test_z, host_z.data(), test_bytes, cudaMemcpyHostToDevice));
                CUDA_CHECK(cudaMemset(test_y, 0xff, test_bytes));
            }
            launch_triad(false, test_x, test_z, test_y, test_n, alpha);
            CUDA_CHECK(cudaDeviceSynchronize());
            const Verification correctness = verify(host_x, host_z, test_y, test_n, alpha);
            std::cout << std::scientific
                      << "seed=" << seed
                      << " n=" << test_n
                      << " correctness=" << (correctness.failures == 0 ? "PASS" : "FAIL")
                      << " failures=" << correctness.failures
                      << " max_abs=" << correctness.max_abs
                      << " max_rel=" << correctness.max_rel << "\n";
            if (test_n != 0) {
                CUDA_CHECK(cudaFree(test_x));
                CUDA_CHECK(cudaFree(test_z));
                CUDA_CHECK(cudaFree(test_y));
            }
            if (correctness.failures != 0) {
                return 1;
            }
        }
    } else {
        launch_triad(false, xs[0], zs[0], ys[0], n, alpha);
        CUDA_CHECK(cudaDeviceSynchronize());
        const Verification correctness = verify(host_x, host_z, ys[0], n, alpha);
        std::cout << std::scientific
                  << "correctness=" << (correctness.failures == 0 ? "PASS" : "FAIL")
                  << " failures=" << correctness.failures
                  << " max_abs=" << correctness.max_abs
                  << " max_rel=" << correctness.max_rel << "\n";

        if (correctness.failures != 0) {
            return 1;
        }

        const int warmup = std::max(20, 2 * slots);
        constexpr int samples = 200;
        for (int i = 0; i < warmup; ++i) {
            const int slot = i % slots;
            launch_triad(false, xs[slot], zs[slot], ys[slot], n, alpha);
        }
        CUDA_CHECK(cudaDeviceSynchronize());

        cudaEvent_t start{};
        cudaEvent_t stop{};
        CUDA_CHECK(cudaEventCreate(&start));
        CUDA_CHECK(cudaEventCreate(&stop));
        std::vector<float> sample_ms;
        sample_ms.reserve(samples);

        for (int i = 0; i < samples; ++i) {
            const int slot = i % slots;
            CUDA_CHECK(cudaEventRecord(start));
            launch_triad(false, xs[slot], zs[slot], ys[slot], n, alpha);
            CUDA_CHECK(cudaEventRecord(stop));
            CUDA_CHECK(cudaEventSynchronize(stop));
            float elapsed_ms = 0.0f;
            CUDA_CHECK(cudaEventElapsedTime(&elapsed_ms, start, stop));
            if (!std::isfinite(elapsed_ms) || elapsed_ms <= 0.0f) {
                std::cerr << "invalid timing sample; increase the measurement window\n";
                return 1;
            }
            sample_ms.push_back(elapsed_ms);
        }

        // Check every rotated slot after timing, outside all event intervals.
        for (int slot = 0; slot < slots; ++slot) {
            fill_inputs(host_x, host_z, 7 + static_cast<unsigned int>(slot), alpha);
            const auto checked = verify(host_x, host_z, ys[slot], n, alpha);
            if (checked.failures != 0) {
                std::cerr << "post-timing verification failed for slot " << slot << "\n";
                return 1;
            }
        }
        std::cout << "post_timing_slots_checked=" << slots << "\n";

        const std::string sample_path = argc == 3
            ? argv[2]
            : (bench_hot ? "samples-hot.csv" : "samples-rotate.csv");
        std::ofstream sample_file(sample_path);
        if (!sample_file) {
            std::cerr << "could not open sample CSV: " << sample_path << "\n";
            return 1;
        }
        sample_file << "sample,slot,elapsed_us\n" << std::fixed << std::setprecision(6);
        for (int i = 0; i < samples; ++i) {
            sample_file << i << "," << i % slots << "," << sample_ms[i] * 1000.0 << "\n";
        }
        sample_file.close();
        if (!sample_file) {
            std::cerr << "failed to persist complete sample CSV\n";
            return 1;
        }

        std::vector<float> sorted_ms = sample_ms;
        std::sort(sorted_ms.begin(), sorted_ms.end());
        const double p10_ms = percentile(sorted_ms, 0.10);
        const double median_ms = percentile(sorted_ms, 0.50);
        const double p90_ms = percentile(sorted_ms, 0.90);
        const double useful_gb_s = (3.0 * bytes) / (median_ms / 1000.0) / 1e9;

        std::cout << std::fixed << std::setprecision(3)
                  << "regime=" << (bench_hot ? "same-buffer" : "buffer-rotated")
                  << " slots=" << slots
                  << " warmup=" << warmup
                  << " samples=" << samples
                  << " raw_samples=" << sample_path << "\n"
                  << "p10_us=" << p10_ms * 1000.0
                  << " median_us=" << median_ms * 1000.0
                  << " p90_us=" << p90_ms * 1000.0 << "\n"
                  << "useful_gb_s=" << useful_gb_s
                  << " (12 algorithmic bytes per element)\n";

        CUDA_CHECK(cudaEventDestroy(start));
        CUDA_CHECK(cudaEventDestroy(stop));
    }

    for (int slot = 0; slot < slots; ++slot) {
        CUDA_CHECK(cudaFree(xs[slot]));
        CUDA_CHECK(cudaFree(zs[slot]));
        CUDA_CHECK(cudaFree(ys[slot]));
    }
    return 0;
}
```

</details>

Compile with optimization and line information so sanitizer and profiler reports map directly back to source lines without using a debug build:

```bash title="terminal"
mkdir -p profile_runs
set -o pipefail
nvcc -O3 -lineinfo -std=c++17 triad_bench.cu -o triad_bench && \
  ./triad_bench --check | tee profile_runs/correctness.txt
```

A correct run prints the target device and a complete elementwise check. The output below describes the expected shape, not a recorded CUDA run. Inspect the actual error values rather than requiring the zeros shown here. This fixed-size starter isn't a general allocator or launch planner; larger shapes need device-limit and integer-overflow checks too.

```text title="Expected output shape"
device=<your GPU> compute_capability=<major.minor> l2_bytes=<bytes> cuda_runtime=<major.minor> cuda_driver_api=<major.minor>
seed=7 n=0 correctness=PASS failures=0 max_abs=0.000000e+00 max_rel=0.000000e+00
seed=7 n=1 correctness=PASS failures=0 max_abs=0.000000e+00 max_rel=0.000000e+00
seed=7 n=255 correctness=PASS failures=0 max_abs=0.000000e+00 max_rel=0.000000e+00
seed=7 n=256 correctness=PASS failures=0 max_abs=0.000000e+00 max_rel=0.000000e+00
seed=7 n=257 correctness=PASS failures=0 max_abs=0.000000e+00 max_rel=0.000000e+00
seed=7 n=1000003 correctness=PASS failures=0 max_abs=0.000000e+00 max_rel=0.000000e+00
seed=19 n=1000003 correctness=PASS failures=0 max_abs=0.000000e+00 max_rel=0.000000e+00
seed=101 n=1000003 correctness=PASS failures=0 max_abs=0.000000e+00 max_rel=0.000000e+00
```

Now run the deliberately wrong `i <= n` guard under `memcheck`. `--error-exitcode 99` makes a detected sanitizer error fail automation even when the target process exits cleanly, and `pipefail` keeps `tee` from hiding that status:

```bash title="terminal"
set -o pipefail
compute-sanitizer --error-exitcode 99 --tool memcheck --padding 32 ./triad_bench --buggy 2>&1 \
  | tee profile_runs/memcheck-buggy.txt
```

Because the grid rounds up and $n=1{,}000{,}003$, a thread with `i == n` executes. The report should identify an invalid global access in `triad_buggy`. Padding improves detection when adjacent allocations might otherwise hide an overrun. Without the sanitizer, the launch may appear to complete. Use the fixed mode with `i < n`, then require a clean report.[^computeSanitizer2026]

```bash title="terminal"
set -o pipefail
compute-sanitizer --error-exitcode 99 --tool memcheck --padding 32 ./triad_bench --check 2>&1 \
  | tee profile_runs/memcheck-fixed.txt
```

```text title="Required sanitizer ending"
ERROR SUMMARY: 0 errors
```

Run `initcheck` when a candidate changes which global data is initialized or read; it doesn't require shared memory. Add `racecheck` for shared-memory communication and `synccheck` for synchronization changes. None replaces `memcheck` or numerical comparison.

Capture the system timeline next. Timings printed while the profiler is attached are diagnostic only:

```bash title="terminal"
nsys profile \
  --trace=cuda,osrt \
  --sample=none \
  --output=profile_runs/triad_systems \
  ./triad_bench --bench-rotate profile_runs/nsys-diagnostic-samples.csv
```

The full trace includes allocations, setup copies, the initial correctness readback, warmup, 200 timed launches, and final per-slot verification copies. Only the event-bounded sample region claims to exclude copies. Inside it, expect one launch and one event wait per sample; investigate long host gaps rather than mistaking setup or verification for timed work.

List the installed sections before collecting a kernel profile, since section sets vary by installation. The command below requests four standard sections with explicit cache flushing and `--clock-control none` (leaving GPU clock settings unchanged):[^nsightComputeCli2026]

```bash title="terminal"
ncu --list-sets
ncu --list-sections
ncu \
  --section LaunchStats \
  --section SpeedOfLight \
  --section MemoryWorkloadAnalysis \
  --section SpeedOfLight_RooflineChart \
  --cache-control all \
  --clock-control none \
  --launch-count 1 \
  --export profile_runs/triad_compute \
  ./triad_bench --profile
```

On a locked-down host, `ncu` may return `ERR_NVGPUCTRPERM`. That means counter-access permissions blocked metric collection, not that the kernel failed; run on a profiling-enabled host or ask an administrator to enable performance counters.[^nsightCompute2026]

Read the achieved point, device-memory bytes, cache behavior, and SpeedOfLight sections together. Compare measured traffic per element with the 12-byte algorithmic count. Useful bandwidth above the device's HBM specification can reflect data served by cache, rather than impossible hardware performance.

This isolated, cache-flushed profile reveals nothing about cache residency during the clean same-buffer benchmark. Nsight Compute normally flushes caches between replay passes and may control clocks; replay mode also changes execution. For a cache-primed application, a separately designed experiment can use application replay with `--cache-control none` so its setup is repeated for each pass. Record these choices and never mix a cold profile's byte count with a hot run's elapsed time in one Roofline point.[^nsightCompute2026]

Finally collect clean timing outside tools:

```bash title="terminal"
set -o pipefail
nvidia-smi --query-gpu=timestamp,uuid,name,driver_version,pstate,clocks.sm,clocks.mem,temperature.gpu,power.draw,power.limit --format=csv \
  | tee profile_runs/gpu-state-before.csv

./triad_bench --bench-hot profile_runs/bench-hot-samples.csv | tee profile_runs/bench-hot.txt
./triad_bench --bench-rotate profile_runs/bench-rotate-samples.csv | tee profile_runs/bench-rotate.txt

nvidia-smi --query-gpu=timestamp,uuid,name,driver_version,pstate,clocks.sm,clocks.mem,temperature.gpu,power.draw,power.limit --format=csv \
  | tee profile_runs/gpu-state-after.csv
```

The starter warms for at least 20 launches (and enough to touch every rotation slot twice); extend warmup until latency, clocks, temperature, and cache counters stabilize on your machine. Record `nvcc`, `nsys`, `ncu`, and `compute-sanitizer` versions alongside the exact commands.

`--bench-hot` selects the `same-buffer` regime. Percentiles use linear interpolation at index $q(N-1)$, keeping samples in acquisition order inside the CSV. Match the selected CUDA device to its UUID on multi-GPU hosts, and always compare baseline and candidate under the same cache regime in alternating order.

## Diagnose contradictory evidence

GPU investigations often return signals that look inconsistent. Resolve by asking which scope each signal describes.

| Observation | Tempting conclusion | Better diagnosis | Next check |
|---|---|---|---|
| host timer is tiny | kernel is fast | timer stopped after enqueue | CUDA events with explicit completion wait |
| sanitizer fails but sampled outputs match | error is harmless | illegal access missed sampled state | reject candidate and repair bounds |
| `nvidia-smi` utilization is high | kernel is efficient | GPU stayed busy doing some work | Nsight Systems critical path, then kernel counters |
| SpeedOfLight memory percentage is high | no optimization remains | one memory path is busy, perhaps wastefully | bytes per element and transaction efficiency |
| cache-hot timing wins | candidate is universally faster | benchmark changed residency regime | same-buffer versus rotated A/B under same cache regime |
| profiler duration is slower | optimization regressed | instrumentation or replay perturbed execution | clean rerun outside profiler |
| median improves while p90 worsens | clear win | distribution changed or throttling emerged | raw samples, clocks, power, temperature, paired order |
| kernel improves but request latency doesn't | profiler is wrong | optimized scope isn't end-to-end bottleneck | return to Nsight Systems and critical path |

Failure diagnosis should end with one controlled experiment. Changing block size, <span data-glossary="vector">vector</span> width, memory layout, and dtype together destroys attribution even if final number improves.

## Gate 5: Reproducible run metadata and counter verification

To reproduce a speedup claim cleanly, record the exact build, hardware clocks, profiler reports, and paired event timings in one JSON manifest next to the raw CSV and `.ncu-rep` files. Another engineer should be able to inspect what kernel ran, verify clock stability across A-B-B-A rounds, and confirm that the Nsight counter bottleneck agrees with the clean timer speedup.

```json title="run_manifest.json"
{
  "claim": "candidate lowers buffer-rotated triad_f32 kernel latency versus baseline",
  "source": {
    "repository": "<repository URL>",
    "commit": "<full commit SHA>",
    "compiler": "nvcc <version>",
    "flags": ["-O3", "-lineinfo", "-std=c++17"]
  },
  "hardware": {
    "gpu_uuid": "<GPU UUID>",
    "gpu_name": "<exact model>",
    "compute_capability": "<major.minor>",
    "driver": "<driver version>",
    "cuda_runtime": "<runtime version>",
    "power_limit_w": "<watts>",
    "clock_mode": "locked_sm_clock_or_monitored"
  },
  "workload": {
    "operation": "y[i] = fmaf(1.25f, x[i], z[i])",
    "dtype": "float32",
    "n": 1000003,
    "threads_per_block": 256,
    "cache_regime": "buffer-rotated",
    "rotation_slots": "<slot count exceeding 2x L2>"
  },
  "correctness": {
    "reference": "CPU double FMA, one cast to float",
    "atol": 0.000002,
    "rtol": 0.00002,
    "memcheck_errors": 0
  },
  "measurement": {
    "timer": "CUDA events on execution stream",
    "order": "ABBA within each round",
    "quantiles": "linear interpolation at q*(N-1)",
    "profiler_attached": false
  },
  "artifacts": {
    "systems": "profile_runs/triad_systems.nsys-rep",
    "compute": "profile_runs/triad_compute.ncu-rep",
    "sanitizer": "profile_runs/memcheck-fixed.txt",
    "gpu_state_before": "profile_runs/gpu-state-before.csv",
    "gpu_state_after": "profile_runs/gpu-state-after.csv"
  }
}
```

Store `.nsys-rep`, `.ncu-rep`, clock logs, and event CSVs in versioned storage alongside the source commit, rather than leaving temporary profiler sessions in a home directory.

The diagnostic script below pairs matched A-B-B-A CUDA-event timing rounds with GPU clock readings and Nsight HBM traffic counters. Before accepting a median speedup, it checks three physical conditions: baseline and candidate ran under the same cache rotation depth, SM clocks stayed within tolerance across the round, and clean event latency matches the achieved HBM bandwidth utilization reported by Nsight Compute:

<!-- leetllm: test, id=triad-diagnostics, deps=numpy, output=show -->

```python title="analyze-profile-diagnostics.py"
import numpy as np

def check_paired_round(
    a_events_us,
    b_events_us,
    sm_clock_mhz_before,
    sm_clock_mhz_after,
    n_elements,
    dram_bytes_per_elem_b,
    peak_hbm_gbs,
):
    a_arr = np.asarray(a_events_us, dtype=np.float64)
    b_arr = np.asarray(b_events_us, dtype=np.float64)
    a_med = float(np.median(a_arr))
    b_med = float(np.median(b_arr))
    a_iqr = float(np.percentile(a_arr, 75) - np.percentile(a_arr, 25))
    b_iqr = float(np.percentile(b_arr, 75) - np.percentile(b_arr, 25))
    speedup = a_med / b_med

    clock_drop_mhz = sm_clock_mhz_before - sm_clock_mhz_after
    clock_stable = abs(clock_drop_mhz) <= 30

    # Algorithmic useful traffic for y = alpha*x + z is 12 B/element; HBM measured can exceed it.
    useful_bw_gbs = (12.0 * n_elements) / (b_med * 1e-6) / 1e9
    measured_hbm_bw_gbs = (dram_bytes_per_elem_b * n_elements) / (b_med * 1e-6) / 1e9
    hbm_sol_pct = 100.0 * measured_hbm_bw_gbs / peak_hbm_gbs
    intensity_measured = (2.0 * n_elements) / (dram_bytes_per_elem_b * n_elements)

    return {
        "a_med_us": a_med,
        "b_med_us": b_med,
        "a_iqr_us": a_iqr,
        "b_iqr_us": b_iqr,
        "speedup": speedup,
        "clock_stable": clock_stable,
        "clock_drop_mhz": clock_drop_mhz,
        "useful_bw_gbs": useful_bw_gbs,
        "measured_hbm_bw_gbs": measured_hbm_bw_gbs,
        "hbm_sol_pct": hbm_sol_pct,
        "intensity_flop_per_byte": intensity_measured,
    }

steady = check_paired_round(
    a_events_us=[102.0, 101.0, 104.0, 100.0, 103.0],
    b_events_us=[82.0, 81.0, 83.0, 80.0, 82.0],
    sm_clock_mhz_before=1980,
    sm_clock_mhz_after=1980,
    n_elements=1_000_003,
    dram_bytes_per_elem_b=13.2,
    peak_hbm_gbs=3350.0,
)
print(
    f"steady medians: A={steady['a_med_us']:.1f} us (IQR {steady['a_iqr_us']:.1f}), "
    f"B={steady['b_med_us']:.1f} us -> {steady['speedup']:.2f}x | "
    f"clock stable={steady['clock_stable']}"
)
print(
    f"roofline: useful={steady['useful_bw_gbs']:.1f} GB/s, "
    f"HBM={steady['measured_hbm_bw_gbs']:.1f} GB/s ({steady['hbm_sol_pct']:.1f}% SOL, "
    f"I={steady['intensity_flop_per_byte']:.3f} FLOP/B)"
)

throttled = check_paired_round(
    a_events_us=[84.0, 85.0, 83.0, 86.0, 84.0],
    b_events_us=[102.0, 104.0, 103.0, 101.0, 102.0],
    sm_clock_mhz_before=1980,
    sm_clock_mhz_after=1515,
    n_elements=1_000_003,
    dram_bytes_per_elem_b=13.2,
    peak_hbm_gbs=3350.0,
)
print(
    f"drifted round: {throttled['speedup']:.2f}x | "
    f"clock_drop={throttled['clock_drop_mhz']} MHz -> reject pooled comparison"
)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
steady medians: A=102.0 us (IQR 2.0), B=82.0 us -> 1.24x | clock stable=True
roofline: useful=146.3 GB/s, HBM=161.0 GB/s (4.8% SOL, I=0.152 FLOP/B)
drifted round: 0.82x | clock_drop=465 MHz -> reject pooled comparison
```
<!-- leetllm: output:end -->

Notice two distinct checks in that output. When SM frequency holds steady at 1,980 MHz and A-B-B-A pairing gives narrow IQRs, the 1.24x gain reflects kernel behavior under one consistent cache regime, and dividing algorithmic versus hardware-measured bytes keeps useful bandwidth separate from actual HBM traffic. When the clock drops by 465 MHz mid-run, the script flags the drift instead of averaging noisy rounds together.

<figure>
  <img src="illustrations/_generated/receipt_integrity_dark.png" alt="CUDA stream event timing paired with Nsight Compute roofline and warp stall diagnostics. On top, Host API enqueues the kernel asynchronously in 4 us and blocks on cudaEventSynchronize at 92 us, while GPU Stream 0 executes the kernel from 12 to 92 us inside an 85 us event span and A-B-B-A matched rounds give a 1.24x median speedup at locked 1980 MHz SM clock. On the bottom left, the Nsight roofline places triad_f32 at 0.167 FLOP per byte on the 3.35 TB/s HBM bandwidth slope at 87% SOL. On the bottom right, achieved occupancy is 78% with 64% long-scoreboard HBM wait stalls and 4% barrier stalls." />
  <figcaption>Asynchronous CUDA events frame the kernel execution window cleanly on the stream timeline, while Nsight Compute counters connect that clean event duration to HBM bandwidth utilization, arithmetic intensity, occupancy, and warp stall causes.</figcaption>
</figure>

## Defend the claim in another engineer's rerun

Before promoting a candidate kernel, ask a colleague to reproduce one matched round from the run manifest and saved counter exports. Can they verify the exact inputs, replay the correctness cases, lock or monitor the same GPU clocks, explain the cache rotation depth, and regenerate the summaries from raw samples? If an undocumented setting flips the ranking, fix the measurement setup before trusting the ratio.

A fast kernel helps an application only when it preserves the numerical precision rule and improves the target bottleneck. The isolated triad result is one piece of that picture. Confirm request-level impact on an end-to-end Nsight Systems trace: a verified kernel, an asynchronous event timer, and a roofline/stall profile answer separate engineering questions. The next lab modifies the kernel itself, keeping these same five verification steps in place.

<!-- leetllm: mastery:start -->

## Mastery check

### Evaluation rubric

- Foundational: Separate reference checking, sanitizer runs, profiler diagnostics, and clean CUDA-event timing into distinct steps.
- Intermediate: Compute useful algorithmic bandwidth separately from measured HBM traffic and Nsight SpeedOfLight percentage.
- Advanced: Design alternating A-B-B-A benchmark rounds, inspect SM clock drift and warp stall causes, and archive reproducible manifests and counter exports.

### Common pitfalls

- Treating a clean sampled output as proof that an illegal memory access is harmless.
- Comparing a cache-hot candidate with a buffer-rotated baseline.
- Reporting Nsight replay duration as clean kernel latency or pooling samples across clock-throttled rounds.

### Follow-up questions

```checkpoint
Why can an `i <= n` kernel pass an elementwise check for n=257 when its allocation has 512 elements?
---
It writes all 257 logical outputs correctly and also writes element 257. A comparison restricted to the logical output misses that extra store, while a memory checker sees an allocation-valid access. Use exact-sized allocations, output poisoning, and sanitizer padding to expose different parts of the failure.
```

```checkpoint
A warm same-buffer run is fast, but a cache-flushed Nsight Compute report shows high HBM traffic. Can you divide that report's bytes by the warm event duration?
---
No. The numerator and denominator describe different cache regimes. Use traffic and duration from a consistent profiling experiment for its Roofline point, and report the clean benchmark separately. Record replay, cache, and clock controls so the difference is interpretable.
```

<!-- leetllm: mastery:end -->

**Additional worked practice**

```checkpoint
A kernel profile reports 18 memory bytes per element against a 12-byte useful minimum, with high memory utilization. Which experiment best tests the suspected excess traffic?
---
Change only access order, then remeasure matching bytes and clean latency. A controlled access-order change can test transaction waste while holding workload and dtype fixed. Combining independent changes loses attribution; mixing profiler and clean timing changes the measurement scope.
```

```checkpoint
During an A-B-B-A comparison, round 1 runs at 1,980 MHz and shows candidate B 1.24x faster, while round 2 drops to 1,515 MHz and shows candidate B slower. How should you report those rounds?
---
Report both rounds separately alongside the recorded `nvidia-smi` clock and temperature samples rather than pooling them or discarding round 2 unverified. Lock clocks where permitted or rerun after thermal stabilization so both implementations are judged under matching GPU state.
```

```mastery-quiz
[
  {
    "question": "A serial 120 ms request contains 90 ms of CPU preparation and 30 ms in one kernel. That kernel becomes 3 × faster with all other work fixed. What are request time and end-to-end speedup?",
    "options": [
      "100 ms; 1.20 × ",
      "40 ms; 3.00 × ",
      "90 ms; 1.33 × ",
      "110 ms; 1.09 × "
    ],
    "answer": "100 ms; 1.20 × ",
    "explanation": "The kernel takes 30/3 = 10 ms. Adding the 90 ms of CPU work gives a 100 ms request and a speedup of 120/100 = 1.20×. The 40 ms answer speeds up both stages. The 90 ms answer drops the kernel. The 110 ms answer subtracts 10 ms from 120 ms, treating the new kernel time as the time saved. The kernel saves 30 − 10 = 20 ms."
  },
  {
    "question": "A fresh length 769 uses 256-thread blocks and a faulty guard i ≤ n. Its 1024-slot allocation preserves all 769 logical outputs. Which thread is the extra writer, and does output matching prove logical safety?",
    "options": [
      "Thread 769; no.",
      "Thread 768; no.",
      "Thread 769; yes.",
      "Thread 1024; yes."
    ],
    "answer": "Thread 769; no.",
    "explanation": "Ceiling division launches 1024 positions. The inclusive guard lets thread 769 execute although valid positions end at 768. An oversized allocation can hide the out-of-bounds store; sampled or even complete logical-output agreement never guarantees memory safety."
  },
  {
    "question": "A reference is 0.01, the absolute error is 0.0000033, atol is 0.000003 and rtol is 0.00002. Does the declared reference-relative check pass, and what allowance applies?",
    "options": [
      "Pass; 0.0000032",
      "Fail; 0.0000032",
      "Pass; 0.0000050",
      "Fail; 0.0000002"
    ],
    "answer": "Fail; 0.0000032",
    "explanation": "Allowance is 0.000003 + 0.00002 × 0.01 = 0.0000032, below the error. The relative term alone omits the absolute floor; using the wrong magnitude gives the other scale."
  },
  {
    "question": "In a recorded timeline, the host enqueue call lasts 4 µs. Timing events execute at 7 and 92 µs, with the kernel running 12 to 92 µs. Which event interval and kernel duration are correct?",
    "options": [
      "85 µs; 80 µs",
      "89 µs; 80 µs",
      "80 µs; 85 µs",
      "4 µs; 92 µs"
    ],
    "answer": "85 µs; 80 µs",
    "explanation": "The completed event interval is 92 − 7 = 85 and the kernel duration 92 − 12 = 80. The event interval includes 5 µs before the kernel. Adding enqueue time or using call return mixes host and device timelines."
  },
  {
    "question": "A triad slot occupies 9 MB. The declared rotation target is max(8 slots, 2 × L2 + 1 slot), and L2 is 40 MB; memory budget is sufficient. What minimum whole-slot pool crosses the target?",
    "options": [
      "8 slots; 72 MB",
      "9 slots; 81 MB",
      "10 slots; 90 MB",
      "11 slots; 99 MB"
    ],
    "answer": "10 slots; 90 MB",
    "explanation": "The target is max(72, 89) = 89 MB. Ceiling division of 89 by 9 gives 10 slots and 90 MB. Eight slots uses just the first term, while nine rounds down; eleven adds an unnecessary slot."
  },
  {
    "question": "A GPU provides a 40 TFLOP/s compute roof and 2 TB/s bandwidth at a given memory level. A workload performs 4 FLOPs per 8 measured bytes at that level. What intensity and bandwidth performance roof follow?",
    "options": [
      "0.5 FLOP/B; 1 TFLOP/s",
      "2 FLOP/B; 4 TFLOP/s",
      "0.5 FLOP/B; 40 TFLOP/s",
      "8 FLOP/B; 16 TFLOP/s"
    ],
    "answer": "0.5 FLOP/B; 1 TFLOP/s",
    "explanation": "Intensity is 4/8 = 0.5 FLOP/B. Multiplying by 2 TB/s gives 1 TFLOP/s, lower than the compute ceiling. Reversing the ratio or substituting the compute peak misidentifies the bound."
  },
  {
    "question": "A counter run shows ERR_NVGPUCTRPERM after the kernel launches; reference and memcheck have passed. Which result and next step are justified?",
    "options": [
      "Counter collection failed; obtain permitted counters before claiming a measured roofline.",
      "Kernel correctness failed; obtain permitted counters before claiming a measured roofline.",
      "Counter collection failed; infer the missing roofline from the passing reference.",
      "Kernel correctness failed; infer the missing roofline from the passing reference."
    ],
    "answer": "Counter collection failed; obtain permitted counters before claiming a measured roofline.",
    "explanation": "The reported error concerns access to performance counters. It neither overturns the observed reference/memcheck results nor fills in missing traffic measurements. Correctness and counters answer different questions."
  },
  {
    "question": "Six event samples sorted for analysis are [6, 8, 10, 12, 14, 30] µs. Using linear interpolation at q × (N − 1), what are median and p90?",
    "options": [
      "11 µs; 22 µs",
      "10 µs; 30 µs",
      "11 µs; 30 µs",
      "12 µs; 22 µs"
    ],
    "answer": "11 µs; 22 µs",
    "explanation": "The median is halfway between 10 and 12. At q = .9 the index is 4.5, halfway between 14 and 30, giving 22. Selecting an order statistic without interpolation or shifting the median position yields the distractors."
  },
  {
    "question": "In kernel replay, a first pass writes only output Y, while inputs X/Z are accessible but unchanged. Which saved/restored state and timing conclusion fit the documented mechanism?",
    "options": [
      "Save accessible X/Z/Y initially; restore written Y later; time a clean separate run.",
      "Save output Y without X/Z initially; restore written Y later; time a clean separate run.",
      "Save accessible X/Z/Y initially; restore X/Z/Y later; time the profiled replay.",
      "Save output Y without X/Z initially; restore X/Z/Y later; time the profiled replay."
    ],
    "answer": "Save accessible X/Z/Y initially; restore written Y later; time a clean separate run.",
    "explanation": "Kernel replay can save all accessible memory before pass 1, identify writes and restore that subset for later passes. One-pass collection may avoid this work. Replay and instrumentation mean diagnostic duration is not a substitute for a clean matched timing run."
  },
  {
    "question": "A balanced round records A = 14, B = 10, B = 12, A = 18 µs. In the next matched round the medians are 13 µs for baseline A and 14 µs for candidate B. What are the within-round A/B speedups based on median latency, and how should you interpret them?",
    "options": [
      "1.455× then 0.929×. Report both rounds and check the GPU clock readings.",
      "1.455× then 0.929×. Exclude the second round as a case of thermal throttling.",
      "1.400× then 0.929×. Report both rounds and check the GPU clock readings.",
      "1.400× then 0.929×. Exclude the second round as a case of thermal throttling."
    ],
    "answer": "1.455× then 0.929×. Report both rounds and check the GPU clock readings.",
    "explanation": "In the first round, A has a median of (14 + 18)/2 = 16 µs and B has a median of (10 + 12)/2 = 11 µs. Their ratio is about 1.455×. Using just the first A and B gives 14/10 = 1.400× and ignores the last two readings. In the next round, 13/14 is about 0.929×. B wins the first round and loses the second. Keep both results. Excluding the loss as thermal throttling assumes a cause that timings alone cannot confirm. Check clocks and temperatures across the rounds."
  }
]
```

> **Next:** Continue to [GPU Kernel Performance Engineering Lab](/learn/gpu-kernel-performance-engineering-lab). Shared-memory tiling, register pressure, and warp divergence change kernel execution, so apply these same correctness checks, CUDA event timing rules, and Nsight diagnostics when testing every new optimization.
