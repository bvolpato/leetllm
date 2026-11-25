---
{
  "id": "gpu-parallel-primitives-lab",
  "title": "GPU Parallel Primitives Lab",
  "slug": "gpu-parallel-primitives-lab",
  "section": "GPU Systems & LLM Inference",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 11,
  "companies": [
    "NVIDIA",
    "OpenAI",
    "Anthropic",
    "Meta",
    "Google"
  ],
  "shortDescription": "Eight independent values are easy. Their sum is not. Follow the dependencies that make reduction, scan, and online softmax safe on a GPU.",
  "keyConceptsTested": [
    "hierarchical GPU reduction",
    "warp shuffles and active masks",
    "shared-memory block collectives",
    "inclusive and exclusive prefix scan",
    "decoupled look-back intuition",
    "stable and online softmax",
    "segmented and arg reductions",
    "floating-point reduction order",
    "CUB versus custom CUDA decisions",
    "primitive property tests",
    "CUDA benchmark evidence"
  ],
  "prerequisites": [
    "gpu-kernel-performance-engineering-lab",
    "cuda-gpu-computing-for-ml"
  ],
  "relatedQuestions": [
    "gpu-compilers-kernel-languages",
    "gemm-naive-cuda-tensor-cores",
    "flashattention-memory-efficient-attention",
    "low-precision-gpu-programming"
  ]
}
---

Eight numbers sit in GPU memory: `[3, -1, 4, 1, 5, -9, 2, 6]`. An elementwise ReLU processes each lane independently; a sum cannot. Attention <span data-glossary="softmax">softmax</span>, RMSNorm, cross-entropy loss, and stream compaction all depend on **parallel primitives** that coordinate values across warp lanes, thread blocks, or the entire grid. While the [kernel optimization lab](/learn/gpu-kernel-performance-engineering-lab) focused on memory layout, this lab focuses on **data dependencies and safe publication**.

## One total or every index?

Match the primitive to what downstream consumers need:

- **Reduction** folds $n$ values into one scalar in $\lceil \log_2 n \rceil$ levels ($n-1$ additions): `[3,-1,4,1,5,-9,2,6] -> [2,5,-4,8] -> [7,4] -> 11`.
- **Prefix scan** preserves every running total: **exclusive** scan sums strictly earlier elements (`[0, 3, 2, 6, 7, 12, 3, 5]`), while **inclusive** scan satisfies $\operatorname{inclusive}[i] = \operatorname{exclusive}[i] + x_i$ (`[3, 2, 6, 7, 12, 3, 5, 11]`).
- **Stream compaction** runs an exclusive scan on `0/1` keep flags to compute unique write offsets for retained elements (rejected items must skip writing).
- **Segmented reduction** respects half-open segment ranges (assigning identity `0` to empty ranges like `[4, 4)`), and **arg reduction** carries `(value, index)` with an explicit tie-breaking rule (lowest index) and NaN policy.

<figure>
  <img src="illustrations/_generated/primitive_dependency_shapes_dark.png" alt="Top panel shows a reduction tree combining [3, -1, 4, 1, 5, -9, 2, 6] into [2, 5, -4, 8], then [7, 4], then 11. Bottom panel shows aligned 8-column rows for index, input, exclusive prefix [0, 3, 2, 6, 7, 12, 3, 5], and inclusive prefix [3, 2, 6, 7, 12, 3, 5, 11], highlighting index 3 where 6 + 1 = 7." />
  <figcaption>A reduction folds pairs into one total (11), whereas exclusive and inclusive scans publish a cumulative state at every index.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, id=primitive-reference, output=show -->
```python title="primitive-reference.py"
import numpy as np

x = np.array([3, -1, 4, 1, 5, -9, 2, 6], dtype=np.int64)
inclusive = np.cumsum(x)
exclusive = np.concatenate(([0], inclusive[:-1]))

flags = (x > 0).astype(np.int64)
offsets = np.concatenate(([0], np.cumsum(flags)[:-1]))
compacted = np.empty(int(flags.sum()), dtype=np.int64)
compacted[offsets[flags == 1]] = x[flags == 1]

bounds = [0, 4, 4, 8]
segments = [int(x[a:b].sum()) for a, b in zip(bounds, bounds[1:])]
print("sum:", int(x.sum()), "| argmax:", (int(x.max()), int(np.argmax(x))))
print("exclusive:", exclusive.tolist(), "| compacted >0:", compacted.tolist())
print("segment sums [0,4), [4,4), [4,8):", segments)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sum: 11 | argmax: (6, 7)
exclusive: [0, 3, 2, 6, 7, 12, 3, 5] | compacted >0: [3, 4, 1, 5, 2, 6]
segment sums [0,4), [4,4), [4,8): [7, 0, 4]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/compaction_segments_argmax_dark.png" alt="Left panel shows stream compaction keeping positive elements of [3, -1, 4, 1, 5, -9, 2, 6] at exclusive scan offsets [0, 1, 1, 2, 3, 4, 4, 5] into [3, 4, 1, 5, 2, 6]. Right top shows segmented reduction over half-open ranges [0, 4) = 7, [4, 4) = 0, and [4, 8) = 4. Right bottom shows argmax returning (6, 7) and tie-breaking [6, -1, 6] to (6, 0)." />
  <figcaption>Exclusive scan turns `0/1` flags into compaction destinations; empty half-open segments return identity `0`; argmax returns both value and earliest index.</figcaption>
</figure>

## Warp shuffles and block-level handoff

Within a 32-lane <span data-glossary="cuda-warp">CUDA warp</span>, `__shfl_down_sync` exchanges registers directly without touching shared memory or incurring bank conflicts.[^cudaCppIntrinsics2026][^cudaProgrammingGuide2026] Offsets `16, 8, 4, 2, 1` reduce 32 lanes into lane 0:

```cpp title="warp-and-block-sum.cu"
__device__ long long warp_sum(long long value) {
    constexpr unsigned kFullMask = 0xffffffffu;
    const unsigned lane = threadIdx.x % warpSize;
    for (int offset = warpSize / 2; offset > 0; offset /= 2) {
        const long long other = __shfl_down_sync(kFullMask, value, offset);
        if (lane + offset < warpSize) value += other;
    }
    return value;  // Valid total in lane 0.
}

// Block reduction (256 threads = 8 warps):
sum = warp_sum(sum);
if (lane == 0) warp_sums[warp] = sum;
__syncthreads();  // Outside all warp/lane conditionals.
if (warp == 0) {
    long long block_sum = warp_sum(lane < 8 ? warp_sums[lane] : 0);
    if (lane == 0) block_sums[blockIdx.x] = block_sum;
}
```

> **Common mistake:** Guarding a warp shuffle or `__syncthreads()` behind `if (idx < n)`. Under Volta+ Independent Thread Scheduling, every lane named in `kFullMask` must reach the shuffle (tail lanes hold identity `0`). If lane 20 exits early, lane 4's read at offset 16 becomes undefined.

<figure>
  <img src="illustrations/_generated/warp_participation_tree_dark.png" alt="Left panel shows all 32 warp lanes with lanes 0 to 19 holding 1 and tail lanes 20 to 31 padded with 0, plus Lane 0 combining offsets 16, 8, 4, 2, and 1 along 1 -> 2 -> 3 -> 5 -> 10 -> 20. Right top shows early tail exit leaving Lane 20 undefined when Lane 4 reads it at offset 16. Right bottom shows Lane 16 at offset 16 rejecting source 32 >= 32 and keeping total 20." />
  <figcaption>All 32 warp lanes execute every shuffle with padded zero tails; early tail exit leaves partner reads undefined.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/block_warp_handoff_dark.png" alt="Left panel traces warp 0 holding [1..8] in lanes 0 to 7 and zeros in lanes 8 to 31: offsets 16, 8, 4, 2, and 1 bring lane 0 from 1 through 1, 1, 6, and 16 to 36. Right panel shows eight warp leaders publishing [1..8] into shared warp_sums before __syncthreads(), then warp 0 padding lanes 8 to 31 with zero and summing to 36." />
  <figcaption>Eight warp leaders deposit partials in shared memory, `__syncthreads()` publishes them, and warp 0 reduces lanes `0..7` (padding `8..31` with zero) into the block total.</figcaption>
</figure>

## Grid aggregation and non-associative floats

Ordinary launches cannot wait on a grid-wide barrier because resident blocks can stall forever waiting for unscheduled blocks in the queue (Cooperative Groups requires an explicit co-resident cooperative launch).[^cuda2026deviceCallableApis] Instead, reduce across blocks either with **multi-pass hierarchical kernels** (512 inputs/block shrinks 4,194,304 elements -> 8,192 -> 16 -> 1 in three same-stream passes[^harris2007reduction]) or **global atomics** (matching signed/unsigned accumulator types and profiling contention).

<figure>
  <img src="illustrations/_generated/grid_barrier_schedule_dark.png" alt="Left panel shows an ordinary launch with eight blocks competing for four resident GPU slots: blocks 0 through 3 hold every slot while waiting at a barrier, stalling blocks 4 through 7 in the queue in a deadlock. Right panel shows a cooperative launch sized for eight co-resident slots so blocks 0 through 7 all reach grid.sync and continue." />
  <figcaption>Resident blocks deadlock if they wait for queued blocks in an ordinary launch; grid barriers require co-resident cooperative launches.</figcaption>
</figure>

Watch two numerical traps in parallel reductions:

1. **Signed integer partial overflow:** `[I64_MAX, 1, -1, 0]` has a valid final sum (`I64_MAX`), yet the first tree pair `I64_MAX + 1` overflows immediately.
2. **Floating-point non-associativity:** $(a + b) + c \ne a + (b + c)$. In FP32, `(1e8 + 1.0) + (-1e8) = 0.0`, while `(1e8 + -1e8) + 1.0 = 1.0`. Two race-free reduction trees can therefore disagree without a synchronization bug. Keep **repeatability** (same bits across runs, CUB `DeviceReduce`'s `run_to_run` default[^nvidia2026cubReduce][^nvidia2026ccclDeterminism]) separate from **accuracy** (distance to the exact sum).

<figure>
  <img src="illustrations/_generated/float_tree_overflow_dark.png" alt="Left panel compares float32 grouping on a = 1e8, b = 1.0, and c = -1e8 where ULP spacing is 8: (a + b) + c drops 1.0 to give 0.0, whereas (a + c) + b cancels first to give 1.0. Right panel contrasts signed int64 overflow where (I64_MAX + 1) + (-1) triggers undefined behavior first, while I64_MAX + (1 + -1) stays valid." />
  <figcaption>Grouping flips FP32 sums between 0.0 and 1.0, and a later `-1` cannot rescue an earlier signed `int64` overflow.</figcaption>
</figure>

## Parallel scan: Hillis-Steele, Blelloch, and decoupled look-back

Scan must preserve input order. Inside a block of $n$ items:

- **Hillis-Steele (step-efficient):** $\log_2 n$ steps, $n \log_2 n - (n - 1)$ additions (good for short 32-lane warp shuffles: 5 steps, 129 adds).
- **Blelloch (work-efficient):** $2 \log_2 n$ steps, $2n - 2$ additions via an **Up-Sweep** reduction tree, setting the root to `0`, and a **Down-Sweep** distribution pass. At $N=512$, Hillis-Steele executes 4,097 additions vs. Blelloch's 1,022 (**4.01x** fewer).[^merrill2016scan]

<!-- leetllm: test, id=scan-phases, output=show -->
```python title="scan-phases.py"
from assets.primitives_model import block_scan, device_scan

trace = []
local, total = block_scan([3, -1, 4, 1], width=4, trace=trace)
for phase, vals in trace:
    print(f"{phase:8}: {vals}")
print("Device-wide:", device_scan([3, -1, 4, 1, 5, -9, 2, 6], width=4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
up 1    : [3, 2, 4, 5]
up 2    : [3, 2, 4, 7]
root = 0: [3, 2, 4, 0]
down 2  : [3, 0, 4, 2]
down 1  : [0, 3, 2, 6]
Device-wide: [0, 3, 2, 6, 7, 12, 3, 5]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/blelloch_phase_trace_dark.png" alt="Left panel traces Blelloch exclusive scan on [3, -1, 4, 1]: up-sweep reduces to 7, clearing the root to 0 seeds down-sweep outputs [0, 3, 2, 6], while Hillis-Steele computes [3, 2, 3, 5] then [3, 2, 6, 7]. Right panel charts addition counts: at N = 32 Hillis-Steele uses 129 vs 62 for Blelloch (2.08x), and at N = 512 it uses 4097 vs 1022 (4.01x)." />
  <figcaption>Blelloch computes exclusive scan in two sweeps over one array, cutting additions 4.01x vs. Hillis-Steele at $N=512$.</figcaption>
</figure>

To stitch blocks device-wide, **multi-pass scan** writes `block_sums`, recursively scans `block_sums`, and adds each block's base offset back to its local prefixes. Always test recursion boundaries such as $512^2 = 262{,}144$ (512 block totals, 1 metadata block) vs. $262{,}145$ (513 totals, 2 metadata blocks).

<figure>
  <img src="illustrations/_generated/scan_block_offsets_dark.png" alt="Top panel shows Pass 1 running local exclusive scans on Block 0 [3, -1, 4, 1] -> [0, 3, 2, 6] (total 7) and Block 1 [5, -9, 2, 6] -> [0, 5, -4, -2] (total 4). Middle scans block_totals [7, 4] into offsets [0, +7]. Bottom panel shows Pass 3 adding +0 to Block 0 and +7 to Block 1 to yield [0, 3, 2, 6, 7, 12, 3, 5]." />
  <figcaption>Multi-pass scan scans block totals `[7, 4]` into offsets `[0, +7]` and adds `+7` to Block 1's local outputs.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/recursive_scan_boundaries_dark.png" alt="Top panel shows integer reduction shrinking 4,194,304 int32 inputs at 512 elements per block into 8,192 int64 partials, 16 partials, and 1 final sum. Bottom panel shows the scan hierarchy threshold at 512^2 = 262,144 elements: 262,144 yields 512 block totals fitting one metadata block, while 262,145 (+1) yields 513 totals spanning 2 blocks and adding a recursion level." />
  <figcaption>Testing $512^2 + 1 = 262{,}145$ elements exercises the extra metadata recursion level that power-of-two tests miss.</figcaption>
</figure>

**Decoupled look-back** (used by CUB `DeviceScan`) avoids the extra full-array write/read pass.[^merrill2016scan][^nvidia2026cubScan][^nvidia2026scanAgent] Each tile publishes status `X` (uninitialized), `A` (local aggregate ready), or `P` (inclusive prefix ready) using release/acquire memory ordering. Tile $k$ walks left through tiles `k-1, k-2, ...`, accumulating `A` aggregates until hitting the first `P` prefix, then publishes its own `P` and writes final outputs in one pass.

<figure>
  <img src="illustrations/_generated/lookback_publication_dark.png" alt="Top panel shows Tile 3 starting with local aggregate 2, reading Tile 2 aggregate A=3 (running 5), Tile 1 aggregate A=4 (running 9), and Tile 0 prefix P=7 (inclusive prefix 16, exclusive offset 14). Bottom panel shows write-before-release on the writer side matching acquire-before-read on the consumer side; polling flags alone gives no progress guarantee." />
  <figcaption>Tile 3 walks left until status `P` to get exclusive offset 14 and inclusive prefix 16, relying on release/acquire visibility rather than plain flag polling.</figcaption>
</figure>

## Online softmax carries a scale with its sum

Naive safe softmax makes three passes over logits $x$: find $m = \max_j x_j$, sum $d = \sum_j e^{x_j - m}$, and emit $p_i = e^{x_i - m} / d$. The **online normalizer** (Milakov & Gimelshein) combines the first two passes by carrying $(m, d)$ and merging partial chunks with a common scale:[^milakov2018]

$$
m = \max(m_a, m_b), \qquad d = d_a e^{m_a - m} + d_b e^{m_b - m}
$$

<!-- leetllm: test, id=softmax-partitions, output=show -->
```python title="softmax-partitions.py"
from math import exp, isclose, fsum
from assets.primitives_model import softmax_state, merge_states, softmax

x = [3, -1, 4, 1, 5, -9, 2, 6]
left, right = softmax_state(x[:4]), softmax_state(x[4:])
m, d = merge_states(left, right)
assert m == 6 and isclose(d, fsum(exp(v - 6) for v in x), rel_tol=1e-15)
assert isclose(fsum(softmax(x)), 1.0, abs_tol=1e-15)
print(f"left=({left[0]}, {left[1]:.6f}), right=({right[0]}, {right[1]:.6f}) -> merged=({m}, {d:.6f})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
left=(4, 1.424404), right=(6, 1.386195) -> merged=(6, 1.578968)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/online_normalizer_dark.png" alt="Top panel merges Chunk A [3, -1, 4, 1] (m=4, d=1.424404) rescaled by exp(4-6)=0.135335 with Chunk B [5, -9, 2, 6] (m=6, d=1.386195) into global m=6 and d=1.578968. Bottom left charts unscaled Chunk A (1.424), rescaled Chunk A (0.193), Chunk B (1.386), and merged d (1.579). Bottom right shows share split: 12.2% scaled A and 87.8% Chunk B." />
  <figcaption>Rescaling Chunk A by $e^{4-6}$ aligns both chunks to maximum 6 before summing to $d = 1.578968$.</figcaption>
</figure>

Standalone online softmax still reads logits **twice** (once to compute $(m, d)$, once to emit probabilities). [FlashAttention](/learn/flashattention-memory-efficient-attention) eliminates that second HBM pass by carrying the unnormalized weighted-value accumulator $O$ alongside $(m, d)$ in SRAM, rescaling both together and dividing by $d$ once at the end.[^dao2022]

<figure>
  <img src="illustrations/_generated/normalizer_output_passes_dark.png" alt="Left panel shows two-pass standalone softmax: pass 1 reads eight logits to compute (m=6, d=1.578968), and pass 2 rereads logits to output probabilities [0.032, 0.001, 0.086, 0.004, 0.233, 0.000, 0.012, 0.633]. Right panel shows fused attention tracking (m, d, O) in SRAM, rescaling both d and O by alpha, and emitting O/d without storing N x N probabilities." />
  <figcaption>Standalone online softmax rereads logits to emit probabilities; fused attention rescales $(d, O)$ on chip so the $N\times N$ probability matrix never hits HBM.</figcaption>
</figure>

## Sanitize, benchmark against CUB, and run the lab

Always run `compute-sanitizer` (`memcheck`, `racecheck`, `synccheck`) on odd edge sizes like `4099` alongside numerical reference checks: a warp barrier orders only its own warp, so cross-warp shared-memory handoffs require a block barrier (`__syncthreads()`), while clean memory checks never catch a missing block-offset addition.[^computeSanitizer2026]

For standalone whole-array reductions or scans, start with **CUB** (`cub::DeviceReduce`, `cub::DeviceScan`, widening `int32` via `thrust::make_transform_iterator` in CCCL 3.0+[^nvidia2026cubOverview][^nvidia2026ccclMigration]). Write custom CUDA only when fusing a primitive with surrounding producers/consumers (often using `cub::BlockReduce`/`BlockScan` inside the fused kernel), and compare full-pipeline wall times with reused scratch buffers.

Download [primitives_lab.cu](assets/primitives_lab.cu), [primitives_host.hpp](assets/primitives_host.hpp), [primitives_model.py](assets/primitives_model.py), and [benchmark-log.md](assets/benchmark-log.md). Run edge shapes (`1, 31, 32, 33, 255..257, 511..513, 4099, 262145`) and verify the Python hierarchy model on CPU right now:

<!-- leetllm: test, id=primitive-model-checks, output=show -->
```python title="primitive-model-checks.py"
from assets.primitives_model import run_checks
run_checks()
```

<!-- leetllm: output:start -->
```text title="Output" output compact
CPU models: 17 hierarchy sizes and 260 recursive scan cases pass
Overflow, absent shuffle sources, invalid widths and masked/nonfinite rows checked
No CUDA compilation, GPU synchronization, sanitizer or performance claim
```
<!-- leetllm: output:end -->

When interpreting benchmark rates, report **logical byte rate** ($4N / t$ for `int32` reduction; $(4N + 8N) / t = 12N / t$ for `int32 -> int64` scan) separately from Nsight Compute physical DRAM bandwidth.

```mastery-quiz
[
  {
    "question": "A 32-lane CUDA warp runs `__shfl_down_sync(0xffffffff, val, 16)`. Lanes 0..22 hold 1 and lanes 23..31 hold 0. In Run 1 all lanes execute; in Run 2 lane 24 exits before the shuffle. What does lane 8 receive in each run?",
    "options": [
      "1 from itself, then undefined.",
      "1 in both runs.",
      "0 from lane 24, then undefined.",
      "0 from lane 24, then 0 supplied by the full mask."
    ],
    "answer": "0 from lane 24, then undefined.",
    "explanation": "Lane 8 reads lane 8+16 = 24. When lane 24 participates it supplies 0; when it exits early, reading an exited lane is undefined regardless of the full mask."
  },
  {
    "question": "Three scan blocks have totals `[3, -2, 5]`. Block 2's local exclusive scan is `[0, 4, 1]`. What are Block 2's global exclusive outputs?",
    "options": [
      "[5, 9, 6]",
      "[6, 10, 7]",
      "[-2, 2, -1]",
      "[1, 5, 2]"
    ],
    "answer": "[1, 5, 2]",
    "explanation": "Block 2 adds the sum of strictly earlier block totals (3 + -2 = 1) to every local output: [1, 5, 2]."
  },
  {
    "question": "Merge online-softmax states (m=1, d=2) and (m=3, d=1.5) onto one common scale.",
    "options": [
      "(m=1, d=3.50000)",
      "(m=3, d=1.77067)",
      "(m=3, d=3.50000)",
      "(m=3, d=16.27811)"
    ],
    "answer": "(m=3, d=1.77067)",
    "explanation": "At m=3, d = 2*exp(1-3) + 1.5 = 2*0.135335 + 1.5 = 1.77067."
  },
  {
    "question": "Exact reference is 1.00 (atol 0.02). Kernel X always returns 0.00. Kernel Y returns 0.99 or 1.01 across runs. How do repeatability and accuracy classify each kernel?",
    "options": [
      "X repeats and passes tolerance; Y varies and fails.",
      "X repeats and fails tolerance; Y varies and passes.",
      "X varies and passes; Y repeats and fails.",
      "X varies and fails; Y repeats and passes."
    ],
    "answer": "X repeats and fails tolerance; Y varies and passes.",
    "explanation": "X is bitwise repeatable but wrong (error 1.00 > 0.02); Y is non-deterministic across runs yet within tolerance (error 0.01 <= 0.02)."
  },
  {
    "question": "Stream compaction keeps positive values from `[5, 0, -2, 8, 3]` via exclusive scan of `0/1` flags. Where does `8` land, and which items write?",
    "options": [
      "Slot 2; only positive items write.",
      "Slot 1; all items write.",
      "Slot 3; only positive items write.",
      "Slot 1; only positive items write."
    ],
    "answer": "Slot 1; only positive items write.",
    "explanation": "Flags `[1, 0, 0, 1, 1]` have exclusive scan `[0, 1, 1, 1, 2]`. Value `8` writes to slot 1, while rejected items (`0`, `-2`) must skip writing so they never overwrite slot 1."
  },
  {
    "question": "Values `[2, 4, 1, -3, 8]` have half-open segment boundaries `[0, 2, 2, 5]`. What segmented sums preserve all groups including the empty segment?",
    "options": [
      "[6, 0, 6]",
      "[6, 1, 5]",
      "[6, 6]",
      "[12, 0, 12]"
    ],
    "answer": "[6, 0, 6]",
    "explanation": "Ranges `[0, 2)`, `[2, 2)`, and `[2, 5)` sum to `2+4=6`, empty identity `0`, and `1-3+8=6`."
  }
]
```

> **Next:** Continue to [GPU Compilers and Kernel Languages](/learn/gpu-compilers-kernel-languages).
