---
{
  "id": "gpu-parallel-primitives-lab",
  "title": "GPU Parallel Primitives Lab",
  "slug": "gpu-parallel-primitives-lab",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 12,
  "companies": ["NVIDIA", "OpenAI", "Anthropic", "Meta", "Google"],
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
    "gpu-profiling-correctness-benchmarking",
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

Eight numbers sit in GPU memory: `3, -1, 4, 1, 5, -9, 2, 6`. An elementwise ReLU can compute each output independently: load a value, compare it with zero, and store the result. A sum cannot. How does one output learn about all eight inputs?

Attention softmax, LayerNorm, RMSNorm, cross-entropy loss, and top-k sampling need information from multiple elements. The exchange may stay within a warp, use shared memory within a block, or cross blocks through global memory. A row that fits in one block need not use every scope.

These exchanges are **parallel primitives**, and they don't all produce the same kind of result. A reduction folds a tensor or tile into one summary. A prefix scan keeps a cumulative total at every index. An arg reduction tracks the winning value and its source position. Online <span data-glossary="softmax">softmax</span> computes its maximum and normalizer together. Producing every probability still requires the original logits after that normalizer is known.

The [GPU Kernel Performance Engineering Lab](/learn/gpu-kernel-performance-engineering-lab) examined memory coalescing and shared-memory bank conflicts through matrix transpose. Here the layout is simple. The hard part is coordinating thread dependencies: which values must be written, synchronized, and published before another lane can proceed.

## One total or every index?

Pair adjacent values in the running array `[3, -1, 4, 1, 5, -9, 2, 6]`. Adding neighboring pairs yields `[2, 5, -4, 8]`, then `[7, 4]`, then `11`. A balanced binary tree with $n\geq1$ leaves has $n-1$ additions and $\lceil\log_2 n\rceil$ combining levels. The eight-leaf tree has exactly three levels; padding a hardware tile with identities can add work beyond those seven useful additions.

A prefix scan produces a richer output: it keeps every intermediate running total. An **exclusive** sum at index $i$ accumulates elements strictly before index $i$, placing the additive identity 0 at index 0. An **inclusive** sum also includes $x_i$. For the first four elements `[3, -1, 4, 1]`, the exclusive prefix sum is `[0, 3, 2, 6]` and the inclusive prefix sum is `[3, 2, 6, 7]`.

<figure>
  <img src="illustrations/_generated/primitive_dependency_shapes_dark.png" alt="Top panel shows a reduction tree combining [3, -1, 4, 1, 5, -9, 2, 6] into [2, 5, -4, 8], then [7, 4], then 11. Bottom panel shows aligned 8-column rows for index, input, exclusive prefix [0, 3, 2, 6, 7, 12, 3, 5], and inclusive prefix [3, 2, 6, 7, 12, 3, 5, 11], highlighting index 3 where 6 + 1 = 7." />
  <figcaption>Pairs fold down until one sum remains, while the aligned scan rows retain every index prefix; at index 3, exclusive prefix 6 plus input 1 gives inclusive prefix 7.</figcaption>
</figure>

For exact real addition, the two scan conventions connect through a direct identity:

$$
\operatorname{inclusive}[i]=\operatorname{exclusive}[i]+x_i.
$$

Arg reduction carries a structured payload: `(value=6, index=7)`. Equal maxima need a tie rule. Nonfinite values need a policy too: this reference rejects them and chooses the lowest index among equal finite values.

<!-- leetllm: test, deps=numpy, id=primitive-reference, output=show -->
```python title="primitive-reference.py"
import numpy as np

x = np.array([3, -1, 4, 1, 5, -9, 2, 6], dtype=np.int64)
total = int(x.sum())
inclusive = np.cumsum(x)
exclusive = np.concatenate(([0], inclusive[:-1]))

def argmax(values):
    arr = np.asarray(values, dtype=np.float64)
    if arr.size == 0 or not np.all(np.isfinite(arr)):
        raise ValueError("Argmax requires a nonempty finite sequence")
    index = int(np.argmax(arr))  # np.argmax breaks ties toward the lowest index
    return values[index], index

assert total == 11
assert exclusive.tolist() == [0, 3, 2, 6, 7, 12, 3, 5]
assert inclusive.tolist() == [3, 2, 6, 7, 12, 3, 5, 11]
assert argmax(x.tolist()) == (6, 7)
assert argmax([6, -1, 6]) == (6, 0)
print("sum:", total)
print("exclusive:", exclusive.tolist())
print("inclusive:", inclusive.tolist())
print("argmax (value, index):", argmax(x.tolist()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sum: 11
exclusive: [0, 3, 2, 6, 7, 12, 3, 5]
inclusive: [3, 2, 6, 7, 12, 3, 5, 11]
argmax (value, index): (6, 7)
```
<!-- leetllm: output:end -->

Scan also turns decisions into addresses. Keep only the positive values: scan their 0/1 flags to obtain a unique destination for each retained item. A rejected item must skip its write, even if its prefix shares a destination with the next item.

<!-- leetllm: test, continue=primitive-reference, output=show -->
```python title="flags-to-addresses.py"
flags = (x > 0).astype(np.int64)
offsets = np.concatenate(([0], np.cumsum(flags)[:-1]))
retained = int(flags.sum())
compacted = np.empty(retained, dtype=np.int64)
compacted[offsets[flags == 1]] = x[flags == 1]
assert offsets.tolist() == [0, 1, 1, 2, 3, 4, 4, 5]
assert compacted.tolist() == [3, 4, 1, 5, 2, 6]
boundaries = [0, 4, 4, 8]
segments = [int(x[a:b].sum()) for a, b in zip(boundaries, boundaries[1:])]
assert segments == [7, 0, 4]  # The empty segment has sum identity zero.
print("Keep flags:", flags.tolist())
print("Destinations:", offsets.tolist())
print("Compacted:", compacted.tolist())
print("Segment sums (including an empty segment):", segments)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Keep flags: [1, 0, 1, 1, 1, 0, 1, 1]
Destinations: [0, 1, 1, 2, 3, 4, 4, 5]
Compacted: [3, 4, 1, 5, 2, 6]
Segment sums (including an empty segment): [7, 0, 4]
```
<!-- leetllm: output:end -->

The segment offsets specify half-open input ranges. A GPU implementation must preserve that grouping. One whole-array reduction would erase it. This CPU scatter uses a separate output buffer and does not prove that an in-place GPU compaction is safe. The CPU model also never has to say which thread holds which partial. A warp does.

<figure>
  <img src="illustrations/_generated/compaction_segments_argmax_dark.png" alt="Left panel shows stream compaction keeping positive elements of [3, -1, 4, 1, 5, -9, 2, 6] at exclusive scan offsets [0, 1, 1, 2, 3, 4, 4, 5] into [3, 4, 1, 5, 2, 6]. Right top shows segmented reduction over half-open ranges [0, 4) = 7, [4, 4) = 0, and [4, 8) = 4. Right bottom shows argmax returning (6, 7) and tie-breaking [6, -1, 6] to (6, 0)." />
  <figcaption>Scan offsets place kept elements into compact slots; half-open segment ranges assign [4, 4) the identity 0, and argmax carries both the maximum value and its earliest winning index.</figcaption>
</figure>

## Reduce within a warp using shuffle intrinsics

Early GPU reduction kernels kept the partials in shared memory. Threads wrote inputs into a `__shared__` array, synchronized with `__syncthreads()`, and added across stride intervals. That used shared-memory capacity. Strided accesses hit the same banks. Every tree level waited on a block barrier.

Within a <span data-glossary="cuda-warp">CUDA warp</span> (32 threads), `__shfl_down_sync` exchanges register values without shared memory. It removes the shared-memory accesses for that exchange, but doesn't promise single-cycle latency. Type width and generated instructions matter; the lab exchanges 64-bit values.[^cudaCppIntrinsics2026]

Offsets `16, 8, 4, 2, 1` construct a five-stage reduction tree across all 32 lanes. Lane 0 accumulates the warp total, while higher lanes hold intermediate partials:

```cpp title="warp-sum.cu"
__device__ long long warp_sum(long long value) {
    constexpr unsigned kFullMask = 0xffffffffu;
    const unsigned lane = threadIdx.x % warpSize;
    for (int offset = warpSize / 2; offset > 0; offset /= 2) {
        const long long other = __shfl_down_sync(kFullMask, value, offset);
        if (lane + offset < warpSize) {
            value += other;
        }
    }
    return value;  // Full aggregate is valid in lane 0.
}
```

This helper assumes a full, participating 32-thread warp, with representable signed 64-bit intermediate sums. The downloaded kernel launches 256 threads and keeps tail lanes alive. Volta introduced Independent Thread Scheduling; old assumptions that neighboring lanes implicitly synchronize are unsafe. The shuffle mask names participants: every named, non-exited lane must reach the corresponding collective with the same mask. Shuffles exchange registers; they aren't shared-memory fences.[^cudaCppIntrinsics2026][^cudaProgrammingGuide2026]

Participation differs from owning an input. With 20 inputs, lanes 20 through 31 carry zero and still execute every shuffle. If lane 20 exits and lane 4 requests its value, the result is undefined; it isn't guaranteed to double lane 4. A full mask cannot recreate an exited lane. The separate down-shuffle rule for a source beyond the warp's upper edge leaves the caller's value unchanged; the conditional addition discards that result. Keep the collective outside the conditional so all 32 lanes participate.

<figure>
  <img src="illustrations/_generated/warp_participation_tree_dark.png" alt="Left panel shows all 32 warp lanes with lanes 0 to 19 holding 1 and tail lanes 20 to 31 padded with 0, plus Lane 0 combining offsets 16, 8, 4, 2, and 1 along 1 -> 2 -> 3 -> 5 -> 10 -> 20. Right top shows early tail exit leaving Lane 20 undefined when Lane 4 reads it at offset 16. Right bottom shows Lane 16 at offset 16 rejecting source 32 >= 32 and keeping total 20." />
  <figcaption>All 32 participants execute every shuffle while padded zero lanes keep partner reads defined, and the upper-edge guard discards out-of-range self-copies.</figcaption>
</figure>

The CPU model verifies this behavior by checking lane participation, missing source rejections, and signed 64-bit integer overflow protection:

<!-- leetllm: test, id=warp-model, output=show -->
```python title="warp-model.py"
from assets.primitives_model import warp_sum, I64_MAX, expect_error

lanes = [1] * 20 + [0] * 12
assert warp_sum(lanes) == 20
expect_error(ValueError, lambda: warp_sum(lanes, active=range(20)))
assert warp_sum([0] * 31 + [I64_MAX]) == I64_MAX
expect_error(OverflowError, lambda: warp_sum([I64_MAX, 1] + [0] * 30))
print("20 values + 12 participating zero lanes: sum 20")
print("Absent source rejected; representable and overflowing int64 sums distinguished")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
20 values + 12 participating zero lanes: sum 20
Absent source rejected; representable and overflowing int64 sums distinguished
```
<!-- leetllm: output:end -->

To aggregate across a 256-thread block (8 warps), lane 0 of each warp deposits its warp total into `__shared__ long long warp_sums[8]`. A block-wide barrier `__syncthreads()` guarantees all 8 warps finish their writes before warp 0 reads the shared array. Warp 0's first 8 lanes load the 8 partial sums, while lanes 8 through 31 load zero. A second `warp_sum` folds those 8 partials, leaving the entire block total in lane 0:

```cpp title="block-reduction-core.cu"
sum = warp_sum(sum);
if (lane == 0) {
    warp_sums[warp] = sum;
}
__syncthreads();
if (warp == 0) {
    long long block_sum = lane < 8 ? warp_sums[lane] : 0;
    block_sum = warp_sum(block_sum);
    if (lane == 0) {
        block_sums[blockIdx.x] = block_sum;
    }
}
```

<figure>
  <img src="illustrations/_generated/block_warp_handoff_dark.png" alt="Left panel traces warp 0 holding [1..8] in lanes 0 to 7 and zeros in lanes 8 to 31: offsets 16, 8, 4, 2, and 1 bring lane 0 from 1 through 1, 1, 6, and 16 to 36. Right panel shows eight warp leaders publishing [1..8] into shared warp_sums before __syncthreads(), then warp 0 padding lanes 8 to 31 with zero and summing to 36." />
  <figcaption>Warp leaders write eight partials to shared memory, the block barrier makes all eight writes visible to warp 0, and a second warp reduction produces one block total.</figcaption>
</figure>

Notice the barrier placement: `__syncthreads()` sits outside all warp-divergent branches. Placing a block barrier inside `if (lane == 0)` or `if (warp == 0)` triggers undefined behavior because only a fraction of the block's threads reach the barrier.

## Aggregate partials across blocks: multi-pass kernels versus global atomics

Each thread loads up to two elements: one at `block_start + threadIdx.x` and one 256 elements later. Full warps access adjacent, aligned elements; the final partial tile still requires bounds guards. A 256-thread block consumes up to 512 inputs and emits one 64-bit partial. Later passes read 64-bit partials rather than the original int32 inputs.[^harris2007reduction]

Why not insert a grid barrier into an ordinary launch? Resident blocks can wait forever for predecessors that cannot be scheduled until those blocks retire. `__syncthreads()` synchronizes one block. Cooperative Groups does support grid synchronization with a cooperative launch, supported hardware, and a grid sized for co-residency; that is a different launch mode from this lab.[^cuda2026deviceCallableApis]

<figure>
  <img src="illustrations/_generated/grid_barrier_schedule_dark.png" alt="Left panel shows an ordinary launch with eight blocks competing for four resident GPU slots: blocks 0 through 3 hold every slot while waiting at a barrier, stalling blocks 4 through 7 in the queue in a deadlock. Right panel shows a cooperative launch sized for eight co-resident slots so blocks 0 through 7 all reach grid.sync and continue." />
  <figcaption>An ordinary launch deadlocks when resident blocks wait for queued blocks; cooperative grid synchronization requires co-residency across all active slots.</figcaption>
</figure>

Two architectural strategies solve this grid-scale aggregation:

1. **Multi-pass hierarchical kernel launches**: Each kernel pass reduces elements by a factor of 512. For 4,194,304 inputs:
```text title="reduction-passes.txt"
4,194,304 inputs -> 8,192 partials -> 16 partials -> 1 scalar
                  pass 1          pass 2         pass 3
```
Same-stream ordering lets a later pass consume completed earlier-pass outputs. It doesn't repair races inside either kernel. Blocks write separate partials; subsequent passes still have reduction dependencies, smaller grids, and launch costs.

2. **Global atomics**: Another implementation can atomically accumulate each block partial into an initialized output. Many updates to one address can become a throughput limit; separate bins distribute updates, but a skewed histogram can still concentrate them. Compare the complete algorithm rather than assuming atomics are always slower.

The accumulator type and API must match. The lab uses signed `long long`, whereas legacy `atomicAdd`'s 64-bit integer overload is unsigned. Choose an atomic variant with a compatible signed operation and overflow behavior.[^cudaCppIntrinsics2026] Hierarchical passes avoid one shared atomic hotspot, at the cost of partial buffers and more launches. Measure synchronization and memory traffic to see how the approach scales.

## Floating-point trees can disagree without a race

Integer addition preserves grouping and ordering when every intermediate fits. Checking only the final sum is insufficient: the next example triggers signed overflow on its first pair even though a later `-1` brings the mathematical total back into range.

<!-- leetllm: test, id=primitive-partial-overflow, output=show -->
```python title="safe-total-unsafe-partial.py"
from assets.primitives_model import block_scan, I64_MAX

values = [I64_MAX, 1, -1, 0]
assert sum(values) == I64_MAX
print("Final mathematical sum fits:", sum(values) == I64_MAX)
try:
    block_scan(values, width=4)
except OverflowError as error:
    print("First tree pair rejected:", str(error))
else:
    raise AssertionError("Overflowing partial accepted")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Final mathematical sum fits: True
First tree pair rejected: Signed 64-bit intermediate overflow
```
<!-- leetllm: output:end -->

The up-sweep first combines `I64_MAX + 1`; a valid final total can't repair that invalid intermediate. The CUDA test harness enforces the absolute sum bound `9N`, which keeps every partial sum in range for its inputs in `[-9, 9]`. An arbitrary-input kernel needs explicit accumulator-width sizing or overflow handling.

Exact real addition is associative; floating-point addition rounds. Changing the grouping can therefore change the result:

$$
(a + b) + c \neq a + (b + c).
$$

The standard library example below forces 32-bit float truncation to reveal how operand ordering changes low bits on identical inputs:

<!-- leetllm: test, id=float-trees, output=show -->
```python title="float-trees.py"
from struct import pack, unpack
from math import fsum

def f32(value):
    return unpack("f", pack("f", value))[0]

a, b, c = f32(100_000_000), f32(1), f32(-100_000_000)
left_grouped = f32(f32(a + b) + c)
cancel_first = f32(f32(a + c) + b)
assert left_grouped == 0.0
assert cancel_first == 1.0
assert fsum([a, b, c]) == 1.0
print("(a + b) + c:", left_grouped)
print("(a + c) + b:", cancel_first)
print("Higher-precision reference:", fsum([a, b, c]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
(a + b) + c: 0.0
(a + c) + b: 1.0
Higher-precision reference: 1.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/float_tree_overflow_dark.png" alt="Left panel compares float32 grouping on a = 1e8, b = 1.0, and c = -1e8 where ULP spacing is 8: (a + b) + c drops 1.0 to give 0.0, whereas (a + c) + b cancels first to give 1.0. Right panel contrasts signed int64 overflow where (I64_MAX + 1) + (-1) triggers undefined behavior first, while I64_MAX + (1 + -1) stays valid." />
  <figcaption>Grouping changes finite Float32 results between 0.0 and 1.0, and subtracting 1 later cannot undo an overflowing signed int64 intermediate sum.</figcaption>
</figure>

Blocks need not finish in index order. That alone doesn't change a fixed tree: a later pass can combine indexed partials in the same order every run. An atomic or schedule-dependent combining order can change rounding, sometimes substantially for ill-conditioned sums such as this example.

Different valid combining trees can disagree without a race. Unexpected disagreement still needs investigation; non-associativity isn't permission to dismiss a correctness failure.

Repeatability and numerical accuracy are two distinct properties:
- **Repeatability** concerns identical output bits under specified conditions. Current CUB documents `run_to_run` as `DeviceReduce`'s default, with a fixed tree for the same GPU/build/configuration. Supported environment APIs can request other guarantees. This doesn't promise identical results across toolkit/library releases or tuning changes.[^nvidia2026cubReduce][^nvidia2026ccclDeterminism]
- **Accuracy** concerns distance from the mathematical result. Pairwise summation can reduce rounding error, but cancellation and input conditioning still matter. Test against a suitable reference with declared tolerances. If bitwise repeatability is also required, test that separately. A fixed tree can repeat an inaccurate answer.

A reduction may publish one number and hide the tree that produced it. A scan has to publish a prefix at every index. How many extra additions does that prefix cost?

## Parallel scan: Hillis-Steele step efficiency versus Blelloch work efficiency

Scan must preserve input order, even when its operator isn't commutative. For power-of-two $n$, the two trees below pay very different addition counts:

- **Hillis-Steele (Step-efficient)**:
At stride $2^k$, position $i\geq2^k$ combines its value with position $i-2^k$ from the **previous** stage. There are $\log_2 n$ stages and $n-2^k$ additions per stage: $n\log_2 n-(n-1)$ total additions. A 32-lane shuffle scan has five stages and 129 additions. Its short dependency depth can be useful, but the extra arithmetic isn't free. Every stage must read a consistent previous state; an unsynchronized in-place shared-memory update isn't equivalent.

- **Blelloch (Work-efficient)**:
Blelloch scan takes $2 \log_2 n$ steps, but performs only $O(n)$ additions ($2n - 2$ operations total). It splits the scan into two distinct phases in shared memory:
1. **Up-Sweep (Reduce)**: A binary reduction tree where stride doubles each round (`1, 2, 4, ...`). Threads add values upward until the root (last array position) holds the grand total.
2. **Down-Sweep (Distribute)**: Save the root total, overwrite the root with 0 (the additive identity), and reverse the tree with stride halving (`... 4, 2, 1`). At each step, a node sends its current value to its left child, while its right child receives the sum of its old left child and its current value.

For 512 items, the counts are **4,097** versus **1,022** additions, about 4.01x. The ratio compares arithmetic work; measure shared-memory traffic and kernel speed on the target implementation. Blelloch also performs swaps, identity placement, and synchronization; storage layout and the generated instructions affect cost.[^merrill2016scan]

The trace below captures the exact array mutations during Blelloch exclusive scan on `[3, -1, 4, 1]`:

<!-- leetllm: test, id=scan-phases, output=show -->
```python title="scan-phases.py"
from assets.primitives_model import block_scan, device_scan

trace = []
local, total = block_scan([3, -1, 4, 1], width=4, trace=trace)
for phase, values in trace:
    print(f"{phase:8}: {values}")
assert local == [0, 3, 2, 6] and total == 7
x = [3, -1, 4, 1, 5, -9, 2, 6]
assert block_scan(x[4:], width=4)[0] == [0, 5, -4, -2]
assert device_scan(x, width=4) == [0, 3, 2, 6, 7, 12, 3, 5]
print("Device-wide:", device_scan(x, width=4))
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
  <figcaption>Blelloch computes the exclusive scan in two tree sweeps over one array, whereas Hillis-Steele pays a 2.08x addition gap at N = 32 and a 4.01x gap at N = 512.</figcaption>
</figure>

<!-- leetllm: test, continue=scan-phases, output=show -->
```python title="count-scan-work.py"
for n in (32, 512):
    levels = n.bit_length() - 1
    hillis = sum(n - (1 << k) for k in range(levels))
    blelloch = 2 * n - 2
    print(f"N={n}: Hillis-Steele {hillis}, Blelloch {blelloch}, ratio {hillis / blelloch:.2f}x")
assert hillis == 4097 and blelloch == 1022
```

<!-- leetllm: output:start -->
```text title="Output" output compact
N=32: Hillis-Steele 129, Blelloch 62, ratio 2.08x
N=512: Hillis-Steele 4097, Blelloch 1022, ratio 4.01x
```
<!-- leetllm: output:end -->

## Propagate block offsets: multi-pass hierarchies versus decoupled look-back

A local Blelloch scan computes correct prefixes within each block, but every block starts at local offset 0. To stitch them into a device-wide prefix scan, each block must receive the cumulative sum of all preceding blocks.

In a hierarchical multi-pass scan:
1. Each block scans its 512 elements, emits local prefixes, and writes its block total to a global `block_sums` buffer. For blocks with inputs `[3,-1,4,1]` and `[5,-9,2,6]`, the block totals are `[7, 4]`.
2. A second kernel scans `block_sums` to compute block offsets: `exclusive_scan([7, 4]) = [0, 7]`.
3. A third kernel broadcasts each block's offset across its threads: Block 0 adds `+0`, while Block 1 adds `+7` to all its local prefixes, converting `[0, 5, -4, -2]` into `[7, 12, 3, 5]`.

<figure>
  <img src="illustrations/_generated/scan_block_offsets_dark.png" alt="Top panel shows Pass 1 running local exclusive scans on Block 0 [3, -1, 4, 1] -> [0, 3, 2, 6] (total 7) and Block 1 [5, -9, 2, 6] -> [0, 5, -4, -2] (total 4). Middle scans block_totals [7, 4] into offsets [0, +7]. Bottom panel shows Pass 3 adding +0 to Block 0 and +7 to Block 1 to yield [0, 3, 2, 6, 7, 12, 3, 5]." />
  <figcaption>Pass 2 scans block totals [7, 4] into base offsets [0, +7], and Pass 3 adds +7 to every local output in Block 1.</figcaption>
</figure>

Testing scan hierarchies requires exercising block-size thresholds. If your block size is 512, an input of $512^2 = 262,144$ elements produces exactly 512 block totals, which fit in a single metadata block. But $512^2 + 1 = 262,145$ elements produce 513 block totals, spilling into two metadata blocks and triggering another recursion level. Testing only small powers of two misses that structural threshold.

<figure>
  <img src="illustrations/_generated/recursive_scan_boundaries_dark.png" alt="Top panel shows integer reduction shrinking 4,194,304 int32 inputs at 512 elements per block into 8,192 int64 partials, 16 partials, and 1 final sum. Bottom panel shows the scan hierarchy threshold at 512^2 = 262,144 elements: 262,144 yields 512 block totals fitting one metadata block, while 262,145 (+1) yields 513 totals spanning 2 blocks and adding a recursion level." />
  <figcaption>Reduction passes shrink 4,194,304 int32 inputs to one int64 total, while adding one scan element beyond 262,144 spills block totals from 512 to 513 and deepens recursion.</figcaption>
</figure>

**Decoupled Look-Back (Single-Pass Scan)**:
The three-stage example writes local outputs, scans block totals, then updates those outputs. Larger inputs need recursive metadata scans, so the downloadable lab can launch more than three kernels. Decoupled look-back avoids a separate full-array offset-add pass. CUB's `DeviceScan` uses this approach, with additional implementation/setup work beyond the input/output stream.[^nvidia2026cubScan]
- Tile assignment and forward progress are implementation concerns. The original report describes an atomic-counter adaptation; the current look-back agent instead uses `start_tile + blockIdx.x`. Neither is a universal definition of the algorithm.[^merrill2016scan][^nvidia2026scanAgent]
- Each block computes its local reduction aggregate and publishes a status flag in global memory:
  - `X`: Uninitialized.
  - `A`: Local aggregate computed and published.
  - `P`: Inclusive prefix through this tile computed and published.
- When block $k$ finishes its local aggregate, it looks back at tile $k-1$:
  - If that tile is still `X`, wait for valid published data; reading its uninitialized payload is incorrect.
  - If tile $k-1$ is marked `P`, block $k$ reads the prefix directly, adds its local aggregate, and publishes its own status `P`.
  - If tile $k-1$ is marked `A`, block $k$ adds tile $k-1$'s aggregate and looks further back to tile $k-2$, accumulating aggregates until it reaches a tile marked `P`.

The payload must be visible before a reader accepts its status, using a correct publication protocol. Plain flag polling gives no memory ordering or forward-progress guarantee. The design targets roughly one input read and one output write per element, plus metadata and redundant look-back work. For this lab's int32-to-int64 accumulation, those useful bytes are $4N+8N$, not $2N$ equal-width bytes. Current CUB scan defaults to `not_guaranteed` determinism; supported environment APIs can request run-to-run float addition. Consult the installed release rather than assuming the reduction default also applies to scan.[^nvidia2026cubScan]

<figure>
  <img src="illustrations/_generated/lookback_publication_dark.png" alt="Top panel shows Tile 3 starting with local aggregate 2, reading Tile 2 aggregate A=3 (running 5), Tile 1 aggregate A=4 (running 9), and Tile 0 prefix P=7 (inclusive prefix 16, exclusive offset 14). Bottom panel shows write-before-release on the writer side matching acquire-before-read on the consumer side; polling flags alone gives no progress guarantee." />
  <figcaption>Tile 3 walks left until status P to obtain exclusive offset 14 and inclusive prefix 16; payload publication relies on release/acquire ordering, while plain polling gives no forward-progress guarantee.</figcaption>
</figure>

## Online softmax carries a scale with its sum

Softmax converts an array of unnormalized logits $x_i$ into a probability distribution:

$$
p_i = \frac{e^{x_i - m}}{\sum_j e^{x_j - m}}, \qquad m = \max_j x_j.
$$

For finite unmasked logits, $x_i-m\leq0$, so their exponentials cannot overflow. Small terms can underflow to zero. Masks, NaNs, infinities, and all-masked rows need explicit policies; this model uses `None` for masks, rejects other nonfinite values, and rejects a row with no unmasked logits.

A simple implementation makes three logical passes over the input:
1. Reduction pass: find the global maximum $m = \max_j x_j$.
2. Reduction pass: compute the normalizer denominator $d = \sum_j e^{x_j - m}$.
3. Elementwise pass: compute each probability $p_i = e^{x_i - m} / d$.

That's three input reads and one output write per element before extra reduction traffic. These are requested global passes; cache service and register/shared-memory reuse determine how many HBM reads occur.

The **online normalizer** (Milakov & Gimelshein 2018) merges maximum search and summation into one input pass, maintaining $(m,d)$: the running maximum and exponential sum relative to it. Its standalone softmax algorithm then rereads logits to emit probabilities, reducing logical input reads from three to two.[^milakov2018] The companion `softmax` rejects one-shot iterators; supply a reusable sequence whose values stay unchanged between passes, or store values for the output stage.

When merging two partial states $(m_a, d_a)$ and $(m_b, d_b)$, the combined maximum is $m = \max(m_a, m_b)$. Before adding the sums, each denominator must be rescaled to match the new reference point:

$$
m = \max(m_a, m_b), \qquad d = d_a e^{m_a - m} + d_b e^{m_b - m}.
$$

For the left half `[3, -1, 4, 1]`, $m_a=4$ and $d_a\approx1.424404$. For the right half `[5, -9, 2, 6]`, $m_b=6$ and $d_b\approx1.386195$. At the common maximum 6, the left contribution becomes about $0.192772$ after multiplying by $e^{-2}$; the right stays unchanged. The combined denominator is approximately $1.578968$. These displayed decimals are rounded; the merge identity is exact over real arithmetic, with rounding in a floating-point implementation.

<figure>
  <img src="illustrations/_generated/online_normalizer_dark.png" alt="Top panel merges Chunk A [3, -1, 4, 1] (m=4, d=1.424404) rescaled by exp(4-6)=0.135335 with Chunk B [5, -9, 2, 6] (m=6, d=1.386195) into global m=6 and d=1.578968. Bottom left charts unscaled Chunk A (1.424), rescaled Chunk A (0.193), Chunk B (1.386), and merged d (1.579). Bottom right shows share split: 12.2% scaled A and 87.8% Chunk B." />
  <figcaption>At common maximum 6, Chunk A contributes 0.192772 (12.2%) and Chunk B contributes 1.386195 (87.8%), summing to 1.578968 across rounded finite inputs.</figcaption>
</figure>

<!-- leetllm: test, id=softmax-partitions, output=show -->
```python title="softmax-partitions.py"
from math import exp, inf, isclose, fsum
from assets.primitives_model import softmax_state, merge_states, softmax, expect_error

x = [3, -1, 4, 1, 5, -9, 2, 6]
left, right = softmax_state(x[:4]), softmax_state(x[4:])
merged = merge_states(left, right)
assert merged[0] == 6
assert isclose(merged[1], fsum(exp(v - 6) for v in x), rel_tol=1e-15)
assert isclose(fsum(softmax(x)), 1.0, abs_tol=1e-15)
assert softmax([None, 5, None]) == [0, 1, 0]
assert softmax([-10000, 0, 10000]) == [0, 0, 1]
assert merge_states((-inf, 0), (-inf, 0)) == (-inf, 0)
expect_error(ValueError, lambda: softmax([None, None]))
expect_error(ValueError, lambda: softmax([inf, 1]))
for a, b in zip(softmax(x), softmax([v + 1000 for v in x])):
    assert isclose(a, b, rel_tol=1e-14, abs_tol=1e-15)
print(f"left: m={left[0]}, d={left[1]:.6f}")
print(f"right: m={right[0]}, d={right[1]:.6f}")
print(f"merged: m={merged[0]}, d={merged[1]:.6f}")
print("Shift invariance, extreme logits, empty identity and masking checked")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
left: m=4, d=1.424404
right: m=6, d=1.386195
merged: m=6, d=1.578968
Shift invariance, extreme logits, empty identity and masking checked
```
<!-- leetllm: output:end -->

<!-- leetllm: test, continue=softmax-partitions, output=show -->
```python title="normalizer-is-not-the-output.py"
class CountReads:
    def __init__(self, values):
        self.values = values
        self.reads = 0

    def __iter__(self):
        for value in self.values:
            self.reads += 1
            yield value

row = CountReads(x)
assert softmax_state(row)[0] == 6
assert row.reads == 8
print("Normalizer input reads:", row.reads)
row.reads = 0
probabilities = softmax(row)
assert len(probabilities) == 8 and row.reads == 16
assert isclose(fsum(probabilities), 1.0, abs_tol=1e-15)
expect_error(ValueError, lambda: softmax(iter(x)))
print("Complete softmax input reads:", row.reads)
print("Eight probabilities need another input pass; one-shot iterator rejected")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Normalizer input reads: 8
Complete softmax input reads: 16
Eight probabilities need another input pass; one-shot iterator rejected
```
<!-- leetllm: output:end -->

This counts Python model reads, not CUDA transactions. If a later logit changes the maximum or denominator, a probability emitted earlier would be wrong unless it were updated. Keeping logits on chip or fusing a different output pattern changes the storage problem.

<figure>
  <img src="illustrations/_generated/normalizer_output_passes_dark.png" alt="Left panel shows two-pass standalone softmax: pass 1 reads eight logits to compute (m=6, d=1.578968), and pass 2 rereads logits to output probabilities [0.032, 0.001, 0.086, 0.004, 0.233, 0.000, 0.012, 0.633]. Right panel shows fused attention tracking (m, d, O) in SRAM, rescaling both d and O by alpha, and emitting O/d without storing N x N probabilities." />
  <figcaption>Standalone softmax rereads the logits to emit every probability; tiled attention instead carries an unnormalized weighted-value accumulator O, rescales d and O together, and avoids storing the quadratic probability matrix while keeping quadratic arithmetic.</figcaption>
</figure>

**How FlashAttention builds on the online normalizer**:
This online state update is the foundation behind FlashAttention (Dao et al., 2022).[^dao2022] Standard attention computes $S = QK^T$, takes the full softmax $P = \operatorname{softmax}(S)$, and multiplies by $V$, materializing an $N \times N$ attention matrix in HBM ($O(N^2)$ memory traffic).

FlashAttention loads blocks of $Q$, $K$, and $V$ into fast SRAM (shared memory/registers). For each block of keys and values, it computes local dot products $S_{\text{tile}}$, updates the running online softmax state $(m, d)$, and rescales the accumulated output accumulator $O$ in registers:

$$
O_{\text{new}} = \operatorname{diag}\left(e^{m_{\text{old}} - m_{\text{new}}}\right) O_{\text{old}} + e^{S_{\text{tile}} - m_{\text{new}}} V_{\text{tile}}.
$$

Here $O$ denotes the **unnormalized** weighted-value accumulator. At the end, divide each row by its final $d$. FlashAttention emits weighted values, so it can avoid storing every probability. For fixed head dimension, it avoids quadratic score/probability storage and retains linear-size outputs/statistics. It still does quadratic attention arithmetic; shape-dependent HBM traffic determines whether the kernel is compute- or bandwidth-bound.[^dao2022]

## Race conditions and verification: sanitizing shared-memory hazards

The scan exchanges partials through shared arrays. Diagnose three access-order hazards:
- **RAW (Read-After-Write)**: Thread A writes to a shared index, but Thread B reads before the write finishes.
- **WAR (Write-After-Read)**: Thread A reads from a shared location, but Thread B overwrites that location before Thread A finishes loading.
- **WAW (Write-After-Write)**: Multiple threads attempt to write to the same shared address without a deterministic sequence.

NVIDIA's Compute Sanitizer provides specialized tools to detect these defects at the machine-instruction level:[^computeSanitizer2026]

```bash title="terminal"
compute-sanitizer --tool memcheck --error-exitcode=99 ./primitives_lab 4099 1
compute-sanitizer --tool racecheck --error-exitcode=99 ./primitives_lab 4099 1
compute-sanitizer --tool synccheck --error-exitcode=99 ./primitives_lab 4099 1
```

Each tool addresses a specific failure mode:
1. `synccheck` diagnoses supported synchronization violations, including divergent block/warp barriers. A block barrier in a nonuniform branch can hang or behave incorrectly; keep the lab's barriers outside its per-index guards.
2. `racecheck` detects supported shared-memory hazards on executed paths and reports conflicting accesses. Two unordered reads aren't a race; a conflicting write is necessary. A warp barrier only orders its participants, so it doesn't replace a block barrier when another warp consumes the data. Use a separate method to check general global-memory races.
3. `memcheck` detects out-of-bounds reads and writes in global and shared memory, plus unaligned memory accesses.

Keep two verification rules firmly separated:
- **Check arithmetic and memory safety separately.** Forgetting block offsets can leave the kernel free of shared-memory hazards but numerically wrong. In the pictured example, all four second-block outputs miss 7; if an earlier block's total were zero, the omission could be hidden.
- **Check race behavior across schedules.** A missing barrier can happen to produce the right answer for one schedule and fail on another. Run reference checks and the relevant sanitizer tools, then retain the shape/source/settings for each result. Reports cover only the paths they exercise.

Those checks tell you whether an implementation is safe. They don't choose the primitive. Which output did you actually promise?

## Select the primitive by its output semantics

Different workloads demand different output semantics:

| Needed output | Primitive | Parameters to specify |
|---|---|---|
| One aggregate for an array | reduction | identity element, accumulator type, associativity |
| Cumulative offset at every index | exclusive scan | identity, input ordering, operator |
| Cumulative aggregate including index | inclusive scan | operator, endpoint rule |
| One aggregate per variable-length segment | segmented reduction | range offsets or keys, empty segment identity |
| Winning value and source position | arg reduction | tie-breaking rule, NaN policy, index type |
| Maximum and normalizer from streamed logits | online normalizer | running scale, exponential sum, masks/empty state |

Use CUB's `DeviceReduce` and `DeviceScan` as strong baselines for standalone whole-array operations. `BlockReduce` and `BlockScan` are different: threads invoke them cooperatively **inside your kernel**, so they can participate in fusion. CUB is part of CUDA Core Compute Libraries (CCCL) and dispatches architecture/type-specific policies; measure the installed CCCL version on the target workload to verify runtime and end-to-end performance.[^nvidia2026cubOverview]

The explicit-temporary-storage overloads query bytes, allocate storage, then execute. Current documentation also exposes environment-based overloads that manage temporary allocation, so the query pattern isn't mandatory for every API. Check your installed CCCL version. For an int32-to-int64 sum comparison, explicitly widen inputs; recording only the output type omits the internal accumulator width.

```cpp title="cub-sum.cu"
#include <cub/cub.cuh>
#include <thrust/iterator/transform_iterator.h>
// Declare this conversion at namespace scope.
struct Widen {
    __host__ __device__ long long operator()(int value) const {
        return static_cast<long long>(value);
    }
};
// Remaining fragment: inside a function with device pointers, count, and stream.
// CHECK_CUDA is the lab's error-checking macro.
auto input64 = thrust::make_transform_iterator(input, Widen{});
void* temporary = nullptr;
std::size_t temporary_bytes = 0;
CHECK_CUDA(cub::DeviceReduce::Sum(
    temporary, temporary_bytes, input64, output, count, stream));
CHECK_CUDA(cudaMalloc(&temporary, temporary_bytes));
CHECK_CUDA(cub::DeviceReduce::Sum(
    temporary, temporary_bytes, input64, output, count, stream));
CHECK_CUDA(cudaStreamSynchronize(stream));  // Complete before releasing storage.
CHECK_CUDA(cudaFree(temporary));
```

CCCL 3.0 removed CUB's legacy `TransformInputIterator`; use the Thrust transform iterator above to widen each loaded element before reduction.[^nvidia2026ccclMigration]

Here `input` is an initialized device `int*`, `output` a device `long long*`, and all intermediate sums must fit. The fragment illustrates API use; the provided benchmark omits a CUB variant. Reuse scratch storage outside measured repetitions rather than timing this allocation/free sequence.[^nvidia2026cubReduce]

When might a custom kernel help?
1. **Fusion**: A device-wide reduction followed by normalization may write intermediates and require separate launches. A fused LayerNorm or attention kernel can reuse data on chip, possibly with CUB block/warp primitives. RoPE's pairwise rotation isn't itself a reduction.
2. **Layout or specialization**: Strides aren't automatically beyond CUB: its iterators can adapt layouts. Register-tiled fragments or a specialized surrounding computation may still favor an integrated implementation. Compare compatible types, operators, outputs, determinism, and full-pipeline timing before replacing the baseline.

## Run the CUDA lab and verify edge cases

Download these files while preserving the relative `assets/` paths used by the commands and Python imports:
- [The CUDA lab source](assets/primitives_lab.cu)
- [Host validation header](assets/primitives_host.hpp)
- [CPU algorithm model](assets/primitives_model.py)
- [Historical benchmark log](assets/benchmark-log.md)

The CUDA download implements integer reduction and exclusive scan, each with a deliberately serial baseline. Arg reduction and online softmax are CPU examples and extension tasks, not existing CUDA kernels. That log belongs to an older source hash, not the revised download. Compile with optimization and line information:

```bash title="terminal"
: "${GPU_ARCH:?Set GPU_ARCH to your installed GPU target, for example sm_80}"
nvcc -O3 -std=c++17 -lineinfo -arch="$GPU_ARCH" \
  assets/primitives_lab.cu -o primitives_lab
./primitives_lab 4194304 30
```

Before benchmarking, run correctness sweeps across warp thresholds (31, 32, 33), block thresholds (255, 256, 257, 511, 512, 513), and recursive scan thresholds ($512^2 + 1 = 262,145$):

```bash title="terminal"
for n in 1 31 32 33 255 256 257 511 512 513 4099 262145; do
  ./primitives_lab "$n" 1 || exit 1
done
```

### CPU checks you can run immediately

The companion Python model verifies these same index thresholds, checking 17 hierarchy sizes, 260 recursive scan cases, signed overflow handling, and online softmax partition merges:

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

## Interpret timing without confusing traffic and bandwidth

With the displayed `4194304 30` arguments, the benchmark uses CUDA events around 30 complete variant invocations after five warmups each. Running with no arguments instead selects $2^{24}$ inputs and 50 iterations. Allocation and initial host-to-device transfers are outside the event interval. Hierarchical reduction includes its final device-to-device scalar copy; scan includes every recursive scan/offset launch. The event interval can include submission gaps between these operations.

The benchmark reports **logical byte rate**:
- For reduction: $4N$ input bytes divided by elapsed time.
- For scan: $4N$ input bytes plus $8N$ output bytes ($12N$ bytes total) divided by elapsed time.

This numerator counts logical useful algorithmic data. Timing includes the intermediate work, while the numerator omits its bytes and the reduction scalar output. Cache hits change where bytes are served while leaving this logical count unchanged. Buffers are reused after warmup, so this run records no residency measurement. Correctness is checked before timing; timed invocations skip per-call validation.

Record the source hash, compiler/toolkit, GPU, shape, iteration count, cache policy, and the exact timed composition. The one-thread kernels explain dependency and serve as correctness baselines; their speedups do not demonstrate competitiveness with CUB. For a library comparison, add a matched CUB variant and rerun actual GPU checks/timing.

## Review questions

### 1. Why does warp shuffle avoid shared memory bank conflicts during intra-warp reduction?

The exchange uses registers rather than shared-memory addresses, so it doesn't incur shared-memory bank conflicts. It still requires valid participants and source lanes, with target-dependent instruction cost. The block reduction retains a block-wide barrier when other warps publish shared partials.

### 2. What is the fundamental algorithmic tradeoff between Hillis-Steele and Blelloch parallel scan?

Hillis-Steele executes $\log_2 N$ steps with $O(N \log_2 N)$ total additions, prioritizing step efficiency at the expense of work efficiency. Blelloch splits execution into Up-Sweep reduction and Down-Sweep distribution phases taking $2 \log_2 N$ steps but only $O(N)$ operations, matching serial work complexity.

### 3. Why do floating-point parallel reductions yield non-identical results across different tile configurations?

IEEE 754 floating-point addition is non-associative: $(a + b) + c \neq a + (b + c)$. Altering thread block dimensions, tile sizes, or reduction tree hierarchies shifts intermediate rounding groupings, producing slight bitwise discrepancies even in strictly race-free code.

### 4. How does decoupled look-back eliminate multi-pass kernel launches in global prefix scans?

Tiles publish aggregates and completed prefixes with a correct visibility protocol. A tile can accumulate predecessor aggregates until it finds a completed prefix, incorporating that offset before writing its own outputs. This avoids a separate full-array offset pass; metadata, initialization, and forward-progress requirements remain.

### 5. Why does online softmax rescale running accumulators when updating the maximum?

Changing the reference maximum changes every previous exponential's scale: $e^{x-m_{\text{new}}}=e^{x-m_{\text{old}}}e^{m_{\text{old}}-m_{\text{new}}}$. Rescale the existing sum before adding a new contribution. This yields the normalizer in one input pass, but a standalone full probability vector still needs stored logits or another input pass. An empty state must be handled separately to avoid evaluating $-\infty-(-\infty)$.

Work through these diagnostic, hierarchy, bandwidth, and argmax checks to test your grasp of the mechanisms above.

```checkpoint
A hierarchical scan uses width 8 at every metadata level. With 65 inputs, which sequence counts first-level block totals and every further metadata reduction down to one?

- [9, 2, 1]
- [8, 1]
- [9, 1]
- [65, 9, 2]
---
[9, 2, 1]

Ceil(65/8) = 9 first-level totals, then ceil(9/8) = 2, then 1. Eight assumes no partial input tile; 9→1 skips the spill; 65 is the original input length, not a first-level total count.
```

```checkpoint
A reference confirms both local scans are correct and block 0 totals 13. Global second-block prefixes are all 13 too small, despite clean executed sanitizer runs. Which repair and evidence conclusion follow?

- Add 13 to each second-block prefix; clean memory reports did not verify arithmetic.
- Add 13 to its final second-block prefix; clean memory reports did not verify arithmetic.
- Add 13 to each second-block prefix; clean memory reports prove ordering on unseen paths.
- Add 13 to its final second-block prefix; clean memory reports prove ordering on unseen paths.
---
Add 13 to each second-block prefix; clean memory reports did not verify arithmetic.

Each second-block output needs the preceding 13, not just its final value. Clean executed sanitizer reports verify only the observed execution and do not confirm the numerical global-prefix sum or every possible memory-ordering path.
```

```checkpoint
A scan reads 1024 int32 inputs and writes 1024 int64 outputs in 3 microseconds. Using only those useful bytes, which decimal logical rate follows?

- 1.365 GB/s, from input bytes only.
- 2.731 GB/s, from output bytes only.
- 4.096 GB/s, from input plus output bytes.
- 5.461 GB/s, from two int64-sized arrays.
---
4.096 GB/s, from input plus output bytes.

Useful bytes are 1024 × (4 + 8) = 12288. Divide by 3 × 10⁻⁶ seconds to obtain 4.096 × 10⁹ bytes/s. This numerator omits metadata/intermediates and does not measure actual DRAM transactions.
```

```checkpoint
A finite-only argmax chooses the smallest source index on ties. For [−1, 7, 2, 7], which (value,index) must it retain?

- (7, 3)
- (7, 1)
- (3, 7)
- (1, 7)
---
(7, 1)

The maximum 7 occurs at zero-based indices 1 and 3; the stated tie rule retains 1. The other pairs choose the later tie or swap value and index.
```

```mastery-quiz
[
  {
    "question": "A fresh reduction has pair sums [4, 5, 4, 4] from eight leaves. Which next level preserves adjacent ownership?",
    "options": [
      "[9, 8]",
      "[8, 9]",
      "[4, 13]",
      "[17, 0]"
    ],
    "answer": "[9, 8]",
    "explanation": "Combine adjacent pairs: 4 + 5 = 9 and 4 + 4 = 8. Crossing the pairs, moving one child into another group or prematurely distributing the total changes the stated tree."
  },
  {
    "question": "With additive identity zero, which exclusive scan belongs to the fresh row [2, −5, 8, 3]?",
    "options": [
      "[2, −3, 5, 8]",
      "[0, 2, −3, 5]",
      "[0, 2, −5, 8]",
      "[0, 2, −3, 8]"
    ],
    "answer": "[0, 2, −3, 5]",
    "explanation": "Strictly earlier elements sum to 0, 2, −3, 5. Including each current input gives the inclusive row; copying previous inputs is not scanning, and the last exclusive result excludes the final 3."
  },
  {
    "question": "A 32-lane CUDA warp sums a partial tile. Lanes 0 through 22 each hold one, and the remaining lanes hold zero. All lanes execute the first down-shuffle with a full mask and offset 16. In a second run, lane 24 exits just before that shuffle. What does lane 8 receive in each run?",
    "options": [
      "One from the caller, then an undefined value.",
      "One from the caller in both runs.",
      "Zero from the participating tail lane, then an undefined value.",
      "Zero from the participating tail lane, then zero provided by the full mask."
    ],
    "answer": "Zero from the participating tail lane, then an undefined value.",
    "explanation": "Lane 8 requests lane 24 because 8 + 16 = 24. In the first run, lane 24 executes the shuffle with zero in its register. A down-shuffle returns the caller's own value for a source past lane 31. Lane 24 is inside the warp in both runs. Once lane 24 exits, the read is undefined. The full mask names participants and cannot supply a missing zero."
  },
  {
    "question": "Three blocks have totals [3, −2, 5]. The third block’s local exclusive outputs are [0, 4, 1]. Which repaired third-block row follows?",
    "options": [
      "[5, 9, 6]",
      "[6, 10, 7]",
      "[−2, 2, −1]",
      "[1, 5, 2]"
    ],
    "answer": "[1, 5, 2]",
    "explanation": "The third block needs the sum of all preceding totals: 3 + (−2) = 1. Add 1 to each local output. Using its own total 5, the inclusive total 6 or only the immediate predecessor −2 gives the other rows."
  },
  {
    "question": "Two valid online-normalizer states are (m = 1, d = 2) and (m = 3, d = 1.5). Which merged state uses one common scale? Values are rounded.",
    "options": [
      "(m = 1, d = 3.50000)",
      "(m = 3, d = 1.77067)",
      "(m = 3, d = 3.50000)",
      "(m = 3, d = 16.27811)"
    ],
    "answer": "(m = 3, d = 1.77067)",
    "explanation": "Use common maximum 3: 2×exp(1−3) + 1.5 = 1.770670566. Adding unscaled masses yields 3.5; using exp(+2) yields 16.2781; retaining maximum 1 fails the requested common-maximum state."
  },
  {
    "question": "A standalone softmax reads a reusable five-logit row and retains only its final (m,d), with no logits or probabilities stored. What is needed to emit all five probabilities?",
    "options": [
      "Five writes only; the final two scalars determine every numerator.",
      "One more logit read; the last value determines all preceding numerators.",
      "Five more logit reads; combine each numerator with the final normalizer.",
      "Ten more logit reads; repeat both maximum and denominator passes."
    ],
    "answer": "Five more logit reads; combine each numerator with the final normalizer.",
    "explanation": "The online pass computed the final maximum and denominator but discarded individual numerators. One output pass rereads all five logits; neither another maximum pass nor reconstruction from two scalars is needed."
  },
  {
    "question": "A custom kernel may fuse a scan with an elementwise consumer and avoid a 128 MiB intermediate write and read. Which timing comparison tests that benefit?",
    "options": [
      "Compare both full pipelines with matched types, outputs, determinism and setup assumptions.",
      "Compare the fused full pipeline with DeviceScan alone using matched input lengths.",
      "Compare one warm fused call with a cold library call including scratch allocation.",
      "Compare custom shared-memory traffic with the library header’s operation count."
    ],
    "answer": "Compare both full pipelines with matched types, outputs, determinism and setup assumptions.",
    "explanation": "The relevant baseline is the equivalent library scan-plus-consumer composition. Isolating only DeviceScan omits required work, cold allocation distorts the measured window, and source/traffic counts do not measure full-pipeline runtime."
  },
  {
    "question": "The exact reference is 1.00 with absolute tolerance 0.02. Kernel X always returns 0.00. Kernel Y returns 0.99 or 1.01. Which accuracy and repeatability diagnosis follows?",
    "options": [
      "X repeats and meets tolerance; Y varies and misses tolerance.",
      "X repeats and misses tolerance; Y varies and meets tolerance.",
      "X varies and meets tolerance; Y repeats and misses tolerance.",
      "X varies and misses tolerance; Y repeats and meets tolerance."
    ],
    "answer": "X repeats and misses tolerance; Y varies and meets tolerance.",
    "explanation": "X has error 1.00 and repeats the same wrong result. Y has error 0.01 on either run but changes bits. Numerical tolerance and bitwise repeatability are distinct requirements."
  },
  {
    "question": "Keep positive values from [5, 0, −2, 8, 3] using an exclusive scan of 0/1 flags. Where does the value 8 go, and which items write?",
    "options": [
      "Destination 2; only the positive items write.",
      "Destination 1; every input writes at its scanned destination.",
      "Destination 3; only the positive items write.",
      "Destination 1; only the positive items write."
    ],
    "answer": "Destination 1; only the positive items write.",
    "explanation": "Flags [1, 0, 0, 1, 1] scan to [0, 1, 1, 1, 2]. Value 8 uses destination 1. Rejected zero/negative inputs must skip writes, or their shared destinations can corrupt retained values."
  },
  {
    "question": "For values [2, 4, 1, −3, 8], segment offsets [0, 2, 2, 5] name half-open ranges. Which sum row preserves the output groups and zero identity?",
    "options": [
      "[6, 0, 6]",
      "[6, 1, 5]",
      "[6, 6]",
      "[12, 0, 12]"
    ],
    "answer": "[6, 0, 6]",
    "explanation": "Ranges [0, 2), [2, 2), [2, 5) contain [2, 4], [], [1, −3, 8], giving [6, 0, 6]. A repeated offset marks an empty segment, not an omitted group or a one-element group."
  }
]
```

> **Next:** Continue to [GPU Compilers and Kernel Languages](/learn/gpu-compilers-kernel-languages). The shuffle and the barrier are source-level promises. The next lesson shows where those promises become PTX, SASS, and a register budget you can inspect.
