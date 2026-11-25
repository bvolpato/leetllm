---
{
  "id": "gpu-kernel-performance-engineering-lab",
  "title": "GPU Profiling & Kernel Optimization Lab",
  "slug": "gpu-kernel-performance-engineering-lab",
  "section": "GPU Systems & LLM Inference",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 10,
  "companies": [
    "NVIDIA",
    "OpenAI",
    "Anthropic",
    "Meta",
    "Google"
  ],
  "shortDescription": "A 40% faster transpose can still be wrong when the output is stale NaNs. Change one mechanism, then let correctness decide whether the timer counts.",
  "keyConceptsTested": [
    "repeatable CUDA kernel benchmarking",
    "coalesced global memory access",
    "shared-memory tiling and bank conflicts",
    "padding a 32 by 32 tile to 32 by 33",
    "register, shared-memory, and occupancy limits",
    "CUDA event timing",
    "Nsight Compute evidence interpretation",
    "Compute Sanitizer memcheck and racecheck",
    "correctness-first performance iteration",
    "transpose, reduction, and scan selection",
    "performance and recovery evidence artifacts"
  ],
  "prerequisites": [
    "cuda-gpu-computing-for-ml"
  ],
  "relatedQuestions": [
    "gpu-compilers-kernel-languages",
    "gemm-naive-cuda-tensor-cores",
    "flashattention-memory-efficient-attention",
    "continuous-batching-request-scheduling"
  ],
  "aliases": [
    "gpu-profiling-correctness-benchmarking",
    "ai-generated-kernel-engineering",
    "gpu-runtime-execution-lab"
  ]
}
---

You edit four lines of CUDA, recompile, and kernel latency drops 40%. Then verification runs and flags thousands of NaNs because your kernel skipped part of the grid and returned early. Performance engineering starts with a causal hypothesis, changes one mechanism at a time, proves correctness on edge and full shapes, and trusts the timer only after hardware counters and sanitizers agree.

In this lab you optimize an out-of-place single-precision ($N \times N$) matrix transpose. With zero floating-point math, every launch reads and writes each element once, isolating memory coalescing, shared-memory bank conflicts, barriers, and benchmark discipline cleanly. It combines concepts from [CUDA for ML Training](/learn/cuda-gpu-computing-for-ml) and [Accelerator Architecture Field Guide](/learn/cuda-gpu-computing-for-ml) inside one reproducible workflow.

## Keep one experiment stable

The kernel computes $B[c, r] = A[r, c]$ into a separate output buffer so fast blocks never overwrite unread input rows. Because no arithmetic modifies any value, the host checks exact 32-bit bitwise equality (`+0.0f` and `-0.0f` differ bitwise at `0x00000000` vs. `0x80000000`). Input values are consecutive integers `0..N^2 - 1` (exact in float32 up to $N=4096$, exposing any permutation bug), and the destination buffer is pre-filled with `0xff` (`0xffffffff` NaN) before every check so skipped stores fail immediately instead of inheriting stale data.

<figure>
  <img src="illustrations/_generated/bit_exact_poisoned_check_dark.png" alt="Three 3x3 matrices show input A, expected transpose B, and actual B when the store for A[1,2]=5 is skipped, leaving poisoned NaN (0xffffffff) at B[2,1] while signed zeros +0 (0x00000000) and -0 (0x80000000) differ bitwise. A four-stage row shows fresh-poison preflight, five warmups, event-timed iterations, and separate validation." />
  <figcaption>One skipped store leaves poisoned NaN (`0xffffffff`) at `B[2,1]`, while signed zeros show why bitwise equality catches bugs missed by absolute error. Fresh-poisoned checks bracket warmup and timed launches.</figcaption>
</figure>

### Reference verification for arithmetic and PyTorch custom ops

When a kernel *does* perform floating-point arithmetic (such as fused multiply-add, norms, or reductions), rounding order differs between CPU double-precision references and GPU `fmaf`. Never rely on a scalar checksum where errors can cancel; verify every element against an explicit tolerance rule (PyTorch's `allclose`):[^pytorchAllclose2026]

$$
|y_i - r_i| \le \text{atol} + \text{rtol}\,|r_i|
$$

Relative tolerance (`rtol`) scales with nonzero magnitudes while absolute tolerance (`atol`) bounds values near zero. Always allocate each test's exact logical length (never an oversized scratch buffer that hides an off-by-one tail write) and exercise edge sizes ($n = 0, 1, 255, 256, 257$, zeros, and extreme magnitudes). When exposing a custom CUDA or Triton kernel to PyTorch, register its schema, aliasing, and fake-tensor metadata with `torch.library.custom_op` and run `torch.library.opcheck` to mechanically verify `torch.compile` and autograd integration alongside numerical equivalence.[^pytorchLibrary2026]

Inside this transpose lab, one executable packages five variants on the same allocation layout and timer:

| Variant | Mechanism isolated | Timed? |
|---|---|---|
| `copy` | Same-volume coalesced read/write reference (not a transpose) | yes |
| `naive` | Coalesced row reads, stride-$N$ column stores | yes |
| `tiled` | $32 \times 32$ shared-memory tile for coalesced global reads and writes | yes |
| `padded` | $32 \times 33$ shared tile to remove column bank conflicts | yes |
| `broken` | Padded tile missing `__syncthreads()` to trigger a shared-memory race | no |

## Build the lab on an NVIDIA GPU

Place [the CUDA source](assets/transpose_lab.cu), [its host-checking header](assets/transpose_checks.hpp), and [the recovery template](assets/recovery-template.md) together on a machine with `nvcc`, Compute Sanitizer, and Nsight Compute (`ncu`). Snapshot GPU model, clocks, toolkit versions, and file hashes before compiling with `-lineinfo -Xptxas=-v` so `ptxas` reports static shared memory, registers per thread, and local-memory spills upfront:[^nvccGuide2026]

```bash title="build-and-verify.sh"
mkdir -p artifacts/run-01
set -euo pipefail
nvidia-smi -L | tee artifacts/run-01/gpu.txt
nvcc --version | tee artifacts/run-01/nvcc.txt
nvcc -std=c++17 -O3 -arch=native -lineinfo -Xptxas=-v \
  -o transpose_lab transpose_lab.cu 2>&1 | tee artifacts/run-01/build.txt

# 1. Partial-tile edge shapes before benchmarking.
for n in 1 7 31 32 33 65 257; do
  ./transpose_lab all "$n" 1 > "artifacts/run-01/check-${n}.csv"
done

# 2. Repeated alternating rounds at N=4096 to cancel clock/thermal drift.
for round in 1 2 3 4 5; do
  order=(naive tiled padded)
  (( round % 2 == 0 )) && order=(padded tiled naive)
  for v in "${order[@]}"; do
    ./transpose_lab "$v" 4096 100 | tail -n 1
  done
done | tee artifacts/run-01/repeated-benchmark.csv
```

Verify in `build.txt` that `transpose_tiled<0>` reserves $32 \times 32 \times 4 = 4096$ B of static shared memory and `transpose_tiled<1>` reserves $32 \times 33 \times 4 = 4224$ B.

### CUDA event timing and L2 cache residency

Never time GPU kernels with an unsynchronized CPU wall clock, which measures host launch submission rather than device execution. Place `cudaEventRecord(start, stream)` and `cudaEventRecord(stop, stream)` around the launch, wait with `cudaEventSynchronize(stop)`, and read `cudaEventElapsedTime` (~0.5 µs resolution; average a batch for sub-microsecond kernels).[^cudaRuntimeEvents2026]

Watch cache residency closely. An H100 has a 50 MB L2 cache: repeatedly timing the same 11 MiB tensor can stay L2-resident and report effective bandwidth *above* HBM spec. Label your regime explicitly. To measure cold HBM streaming, either **rotate buffer sets** whose total footprint exceeds $2\times$ device L2 capacity or sweep a large dummy buffer between timed launches (and verify HBM traffic in Nsight counters rather than assuming eviction). Compare repeated sample distributions across alternating rounds before declaring a speedup.

## Read the naive memory path

On NVIDIA GPUs (compute capability 6.0+), global memory transactions service 32-byte **sectors**. A full 32-lane warp reading consecutive aligned `float32` words spans 128 bytes across **four sectors** (100% payload efficiency).[^cudaBestPractices2026]

```cpp title="transpose-naive.cu"
__global__ void transpose_naive(float* output, const float* input, int n) {
  const int x = blockIdx.x * kTile + threadIdx.x;
  const int y = blockIdx.y * kTile + threadIdx.y;
  for (int offset = 0; offset < kTile; offset += kBlockRows) {
    if (x < n && y + offset < n) {
      output[static_cast<size_t>(x) * n + y + offset] =
          input[static_cast<size_t>(y + offset) * n + x];
    }
  }
}
```

Trace one 32-lane warp (`threadIdx.x = 0..31`, fixed `threadIdx.y`) at $N = 4096$:

1. **Input load (`(y + offset) * n + x`):** 32 adjacent floats hit **4 sectors** (100% payload utilization).
2. **Output store (`x * n + y + offset`):** Adjacent lanes stride by 4,096 floats (16 KiB), landing in **32 distinct sectors**. Only 128 of 1,024 sector bytes carry useful payload (**12.5%** efficiency).

Each launch moves $2N^2 \times 4$ logical bytes ($134{,}217{,}728$ B = 128 MiB at $N=4096$). Dividing by mean CUDA-event time yields `effective GB/s` (in $10^9$ B/s):

$$
\text{effective GB/s} = \frac{2N^2 \cdot 4}{\text{time (s)} \cdot 10^9}
$$

> **Key insight:** `effective GB/s` is a workload-normalized speed metric, not measured DRAM traffic. Pair it with Nsight store-sector and DRAM counters to separate real coalescing gains from L2 cache hits.

## Profile before editing

Start wide enough to know *where* time goes, then zoom into one kernel. NVIDIA splits those jobs across four distinct instruments:[^nsightSystems2026][^nsightCompute2026][^computeSanitizer2026]

| Question | Tool | What it reveals | What it misses alone |
|---|---|---|---|
| Why is the app waiting? | **Nsight Systems** (`nsys`) | CPU stalls, launch gaps, H2D/D2H transfers, stream overlaps | Per-instruction bottleneck inside one kernel |
| Why is this kernel slow? | **Nsight Compute** (`ncu`) | SpeedOfLight roofs, sector/cache/DRAM traffic, bank conflicts, warp stalls, occupancy | End-to-end host latency or correctness |
| Is execution memory/race-safe? | **Compute Sanitizer** | Illegal accesses, shared-memory races, uninitialized reads, bad barriers | Normal uninstrumented speed |
| How fast is completed GPU work? | **CUDA events** | Stream-ordered device elapsed time | Root cause of that duration |

Profile the single first timed `naive` launch (`--launch-skip 6` skips preflight + 5 warmups). Never take benchmark times from an `ncu --set full` run because multi-pass replay distorts latency:[^nsightComputeCli2026]

```bash title="profile-naive.sh"
ncu --set full --kernel-name-base function --kernel-name transpose_naive \
  --launch-skip 6 --launch-count 1 --force-overwrite \
  -o artifacts/run-01/naive ./transpose_lab naive 4096 1
ncu --import artifacts/run-01/naive.ncu-rep --page details > artifacts/run-01/naive.txt
```

Inspect `naive.txt` in order: confirm kernel identity and `32x8` block in `LaunchStats`, compare memory vs. compute ceilings in `SpeedOfLight` (`dram__throughput.avg.pct_of_peak_sustained_elapsed`), and check L1/TEX `Sectors/Req` separately for loads (predict 4) and stores (predict 32). Combine Roofline bounds[^williams2009] with these counters to record a falsifiable baseline hypothesis before writing code.

## Coalesce both global directions

Staging a $32 \times 32$ block in shared memory turns scattered column stores back into contiguous row writes: each warp reads adjacent input elements into `tile[ty + offset][tx]`, waits at `__syncthreads()`, then reads `tile[tx][ty + offset]` and writes adjacent output elements.[^harris2013transpose]

```cpp title="transpose-tiled.cu"
template <int Padding>
__global__ void transpose_tiled(float* output, const float* input, int n) {
  __shared__ float tile[kTile][kTile + Padding];
  const int input_x = blockIdx.x * kTile + threadIdx.x;
  const int input_y = blockIdx.y * kTile + threadIdx.y;

  for (int offset = 0; offset < kTile; offset += kBlockRows) {
    if (input_x < n && input_y + offset < n) {
      tile[threadIdx.y + offset][threadIdx.x] =
          input[static_cast<size_t>(input_y + offset) * n + input_x];
    }
  }
  __syncthreads();  // Unconditional: every thread in the block must reach this.

  const int output_x = blockIdx.y * kTile + threadIdx.x;
  const int output_y = blockIdx.x * kTile + threadIdx.y;
  for (int offset = 0; offset < kTile; offset += kBlockRows) {
    if (output_x < n && output_y + offset < n) {
      output[static_cast<size_t>(output_y + offset) * n + output_x] =
          tile[threadIdx.x][threadIdx.y + offset];
    }
  }
}
```

Keep `__syncthreads()` outside both `if` bounds checks so partial-tile threads never skip the barrier and hang or corrupt the block.

<figure>
  <img src="illustrations/_generated/transpose_memory_path_dark.png" alt="Comparison of global memory access at N=4096 for one aligned 32-lane warp. Reading row 0 of A loads 32 adjacent floats across four 32-byte sectors (100% coverage). A naive write to column 0 scatters lanes across 4,096-word (16 KiB) strides touching 32 sectors (12.5% coverage), while a shared-tile transpose swaps tile[ty][tx] to tile[tx][ty] so output writes touch four sectors again." />
  <figcaption>Swapping coordinates inside shared memory turns 32-sector strided column stores back into 4-sector coalesced row writes.</figcaption>
</figure>

### Check the edge-tile mapping without a GPU

At $N=33$, edge block `(1, 0)` activates only one input column (`A[r, 32]`) and one output row (`B[32, r]`). Because the input bounds guard checks `(input_y + offset, input_x)` and the output guard checks the exact swapped coordinates `(output_y + offset, output_x)`, every active output lane reads a shared slot populated by a matching in-bounds producer before the barrier.

<figure>
  <img src="illustrations/_generated/edge_tile_producer_consumer_dark.png" alt="Diagram of edge block (1,0) for N=33. Three matrices connected by arrows trace input column A[r,32] (tx=0 active) into shared column tile[r,0] and out to output row B[32,r] (32 lanes at ty=0). Below, a 4x8 grid shows shared rows r=0 through 31 with r=1 highlighted, paired with producer (tx=0, ty=1, Warp 1), the 256-thread barrier, and consumer (tx=1, ty=0, Warp 0)." />
  <figcaption>For N=33 edge block (1,0), Warp 1 writes A[1,32] into tile[1,0] before the 256-thread barrier and Warp 0 reads tile[1,0] into B[32,1].</figcaption>
</figure>

Verify index coverage across partial tiles, shared bank strides, and global sector coverage directly in Python:

<!-- leetllm: test, deps=numpy, id=transpose-coordinates, output=show -->
```python title="transpose-index-model.py"
import numpy as np

def check_mapping(n: int) -> None:
    src = np.arange(n * n, dtype=np.int64).reshape(n, n)
    dst = np.full((n, n), -1, dtype=np.int64)
    for by in range((n + 31) // 32):
        for bx in range((n + 31) // 32):
            smem = np.full((32, 33), -1, dtype=np.int64)
            for ty in range(8):
                for tx in range(32):
                    for off in range(0, 32, 8):
                        r, c = by * 32 + ty + off, bx * 32 + tx
                        if r < n and c < n:
                            smem[ty + off, tx] = src[r, c]
            for ty in range(8):
                for tx in range(32):
                    for off in range(0, 32, 8):
                        r, c = bx * 32 + ty + off, by * 32 + tx
                        if r < n and c < n:
                            dst[r, c] = smem[tx, ty + off]
    assert np.array_equal(dst, src.T)

for n in (1, 7, 31, 32, 33, 65, 257):
    check_mapping(n)
print("7 shapes (1..257): exact transpose mapping verified")

lanes = np.arange(32, dtype=np.int64)
for stride in (32, 33, 34):
    banks, counts = np.unique((lanes * stride) % 32, return_counts=True)
    print(f"shared stride {stride}: {banks.size} banks, {int(counts.max())} words/bank")

def sector_coverage(words):
    addr = np.asarray(words, dtype=np.int64)
    sectors = np.unique((4 * addr) // 32).size
    return sectors, (4 * np.unique(addr).size) / (32 * sectors)

for label, addr in (
    ("aligned row N=4096", np.arange(32)),
    ("row 1 N=33 (unaligned)", np.arange(33, 65)),
    ("naive col N=4096", np.arange(32) * 4096),
):
    s, frac = sector_coverage(addr)
    print(f"{label:24s}: {s:2d} sectors ({frac:.1%} payload)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
7 shapes (1..257): exact transpose mapping verified
shared stride 32: 1 banks, 32 words/bank
shared stride 33: 32 banks, 1 words/bank
shared stride 34: 16 banks, 2 words/bank
aligned row N=4096      :  4 sectors (100.0% payload)
row 1 N=33 (unaligned)  :  5 sectors (80.0% payload)
naive col N=4096        : 32 sectors (12.5% payload)
```
<!-- leetllm: output:end -->

Profiling `tiled` (`Padding = 0`) confirms global store sectors drop from 32 to 4 per aligned warp, while exposing a new bottleneck: shared-memory bank conflicts. Shared memory interleaves 32-bit words across 32 banks via $\operatorname{bank}(k) = k \bmod 32$. In `tile[32][32]`, lane $i$ reading column $c$ hits offset $32i + c$, so every lane maps to bank $c$ for a **32-way bank conflict** (check `l1tex__data_bank_conflicts_pipe_lsu_mem_shared_op_ld.sum` in `ncu`).

## Change the shared-memory stride

Padding one extra float per row (`__shared__ float tile[32][33]`) shifts the column stride from 32 to 33 words (+128 bytes per block, 4,224 B total) without touching a single global address:[^harris2013transpose]

$$
\operatorname{bank}(i) = (33i + c) \bmod 32 = (i + c) \bmod 32
$$

Because $\gcd(33, 32) = 1$, all 32 warp lanes hit 32 distinct banks in one wavefront. By contrast, `tile[32][34]` has $\gcd(34, 32) = 2$ and still suffers a 2-way conflict across 16 even banks.

<figure>
  <img src="illustrations/_generated/shared_bank_stride_dark.png" alt="Comparison of shared-memory strides 32, 33, and 34 for scalar 32-bit reads on column 0. A bank map and padded tile diagram show stride 32 collapsing onto Bank 0, stride 33 visiting all 32 banks once, and stride 34 hitting 16 even banks twice. A bar chart plots 32, 1, and 2 predicted conflict-free service groups alongside 4,096, 4,224, and 4,352 bytes per tile." />
  <figcaption>Stride 32 collapses all 32 lanes onto Bank 0; stride 33 visits all 32 banks conflict-free (+128 B/tile); stride 34 leaves a 2-way conflict across 16 banks.</figcaption>
</figure>

> **Key insight:** Change one mechanism per trial. If an edit both pads the tile to `32x33` and enlarges the block from `32x8` to `32x16`, you cannot tell which lever moved latency; revert one change and isolate each branch against the same baseline.

## Loop unrolling and instruction-level parallelism

Each of the 256 threads in a `32x8` block copies four rows (`offset = 0, 8, 16, 24`). Adding `#pragma unroll` before the loop can remove loop-control instructions and let the compiler schedule independent global loads ahead of dependent shared stores.[^cudaCppIntrinsics2026] Because `nvcc` already unrolls small constant-trip loops automatically, inspect SASS assembly and `-Xptxas=-v` register counts before attributing any timing delta to the pragma. Unrolling increases live register pressure, which can lower occupancy or trigger local-memory spills; keep global loads inside their bounds guards and barriers outside them.

## Occupancy is a constraint, not a score

Occupancy is the ratio of active warps per SM to the hardware maximum. More warps help hide memory latency, yet 100% occupancy loses if threads execute extra instructions or stall on bank conflicts.[^cudaBestPractices2026] Registers per thread, static shared memory (`4096 B` vs. `4224 B`), thread count (`256`), and barriers all cap resident blocks.

<figure>
  <img src="illustrations/_generated/resource_and_iteration_contract_dark.png" alt="Comparison of the fixed baseline against three single-variable optimization branches. The baseline pairs a 32x8 block (256 threads, 8 warps), a 32x32 shared tile (4,096 B), and loop offsets 0, 8, 16, and 24. Branch A pads the tile to 32x33 (4,224 B, +128 B). Branch B applies #pragma unroll across the four offsets. Branch C doubles the block to 32x16 (512 threads, 16 warps)." />
  <figcaption>Hold the 32x8 baseline constant and test padding (+128 B), unrolling, and block height (32x16) on separate branches, checking SASS, registers, correctness, and repeated timings for each.</figcaption>
</figure>

Pair the Nsight Occupancy limiter with stall and memory counters to choose your next experiment: shared-memory-limited occupancy suggests shrinking tiles; register-limited occupancy with local traffic suggests trimming live state; high memory throughput at modest occupancy means cutting transferred bytes rather than chasing 100% occupancy.

## Deliberately remove the barrier

Variant `broken` removes `__syncthreads()` from the padded kernel so consumer warps can read `tile` before producer warps finish writing it. Because warp scheduling can accidentally serialize producer before consumer on one run, matching outputs alone never clear a race.

<figure>
  <img src="illustrations/_generated/barrier_happens_before_dark.png" alt="Side-by-side timelines compare block synchronization on shared tile[1,0]. With __syncthreads(), Warp 1 writes 65 from A[1,32], all 256 threads wait at the barrier, and Warp 0 reads 65 and stores it at B[32,1]. Without the barrier, one schedule lets Warp 0 read an unwritten stale value before Warp 1 writes 65, storing corrupted data at B[32,1]." />
  <figcaption>Without `__syncthreads()`, Warp 0 can read stale uninitialized data from `tile[1,0]` before Warp 1 writes 65, corrupting `B[32,1]`.</figcaption>
</figure>

NVIDIA **Compute Sanitizer** provides four specialized checkers; run `memcheck` first (with `--padding 32` to catch global tail overruns) before `racecheck` or `synccheck`:[^computeSanitizer2026]

| Checker | Defect class caught | Behavior on `broken` transpose |
|---|---|---|
| `memcheck` | Out-of-bounds global/shared/local accesses, misaligned loads, bad pointers | Clean (all addresses are in bounds) |
| `racecheck` | Shared-memory RAW, WAR, and WAW data hazards | **Flags RAW/WAR hazards** from missing barrier |
| `initcheck` | Reads of uninitialized global device memory | Clean (inputs are initialized) |
| `synccheck` | Divergent or invalid `__syncthreads()` / warp barriers | Clean (barrier was omitted, not misused) |

```bash title="sanitize-broken-and-repaired.sh"
for tool in memcheck racecheck initcheck synccheck; do
  compute-sanitizer --tool "$tool" --error-exitcode 99 \
    ./transpose_lab padded 33 1 > "artifacts/run-01/padded-33-${tool}.txt" 2>&1
done
```

> **Common mistake:** Treating a clean `memcheck` run or matching sample outputs as proof of race-free shared memory. Always run `racecheck` whenever threads communicate through shared memory, and discard timing from any variant with hazards.

## Decide between transpose, reduction, and scan

Before reusing shared-memory tiling on another kernel, match the parallel primitive to the output dependency graph:

| Primitive | Output rule | Typical use |
|---|---|---|
| **Transpose** | Same element count, permuted 2D coordinates | Row-major / column-major layout swap |
| **Reduction** | Combine many inputs into fewer summaries via associative op | Loss sum, max error, mismatch count[^harris2007reduction] |
| **Scan** | Prefix aggregate for every position | Exclusive offsets for stream compaction, cumulative lengths |

<figure>
  <img src="illustrations/_generated/dependency_selects_primitive_dark.png" alt="For mismatch flags [0, 1, 0, 1, 1, 0] at indices [0, 1, 2, 3, 4, 5], a reduction sums flags to scalar count 3. An exclusive scan computes prefix offsets [0, 0, 1, 1, 2, 3] and writes failing indices 1, 3, and 4 into compacted slots [1, 3, 4]. A transpose preserves all six values (a through f) while swapping a 2x3 layout to 3x2." />
  <figcaption>A reduction counts total mismatches (3); an exclusive scan computes destination offsets `[0, 0, 1, 1, 2, 3]` to compact failing indices `[1, 3, 4]`; a transpose remaps 2D coordinates without combining values.</figcaption>
</figure>

## Overlap work with streams, events, and CUDA Graphs

Optimizing a kernel's memory path removes stalls *inside* the kernel, yet Nsight Systems traces of small-batch LLM decode often reveal a different culprit: tiny idle gaps *between* kernels because the GPU finishes one operation before the CPU finishes submitting the next. Closing runtime launch overhead requires understanding stream ordering, event dependencies, and CUDA Graph capture/replay.[^cudaProgrammingGuide2026][^nvidia2026CudaGraphsGuide]

### Two clocks, stream ordering, and event handoffs

Every GPU launch runs on two overlapping clocks: **host submission time** (CPU enqueue loop, returning asynchronously before the GPU executes) and **device elapsed time** (CUDA-event span on the stream, including any inter-kernel idle gaps inside the markers). Never add host submission time and device event time together; measure end-to-end synchronized wall time separately.

Operations inside one CUDA stream execute strictly in FIFO issue order. Operations on distinct streams can overlap copies and independent kernels when three rules hold:

1. **Avoid the legacy default stream trap:** Under default legacy semantics, stream 0 (the NULL stream) implicitly synchronizes with every blocking stream in the same CUDA context. Create explicit non-blocking streams with `cudaStreamCreateWithFlags(&s, cudaStreamNonBlocking)` and use **pinned host memory** (`cudaMallocHost`) for asynchronous H2D/D2H transfers so host copies do not serialize compute.[^nvidia2026StreamSync]
2. **Coordinate cross-stream dependencies with events:** Record a marker after producer work (`cudaEventRecord(ready, copy_stream)`), then enqueue a device-side wait on the consumer (`cudaStreamWaitEvent(compute_stream, ready, 0)`) without stalling the CPU. Always record *before* waiting: an unrecorded event represents empty work and adds no dependency.[^cudaRuntimeEvents2026]
3. **Protect allocation lifetimes across streams:** Keep shared buffers alive until consumer streams finish (using `tensor.record_stream(consumer_stream)` in PyTorch so the caching allocator never recycles a buffer while a consumer kernel is still queued).[^pytorchCudaSemantics2026]

### CUDA Graphs capture, replay, and bucketed pools

When short decode kernels are launch-bound, **CUDA Graphs** record a stream's kernel DAG once (`cudaStreamBeginCapture` / `torch.cuda.graph()`), validate and compile it (`cudaGraphInstantiate`), and replay the entire sequence in one host submission (`cudaGraphLaunch`).[^nvidia2026CudaGraphsGuide][^pytorchCudaSemantics2026] Graph capture pays off once per-iteration savings amortize upfront capture and instantiation:

$$
\text{Break-even Iterations} = \frac{\text{Setup Cost}}{\text{Eager Time} - \text{Replay Time}}
$$

If eager execution takes `18 µs/iter`, graph replay takes `12 µs/iter` (`6 µs` saved), and setup takes `12 ms`, both break even at `2,000` iterations (`36 ms`), and iteration `2,001` wins.

> **Common mistake:** Rebinding `x = new_tensor` before calling `graph.replay()`. Captured graphs bake exact tensor **virtual addresses** into node arguments, so rebinding a Python variable leaves the graph reading stale memory. Retain static buffers and copy fresh inputs in place (`static_x.copy_(new_tensor)`) on the stream before replay.

Because continuous batching varies batch sizes dynamically, serving engines (vLLM, SGLang) pre-capture **bucketed graph pools** (e.g., batch sizes `[1, 2, 4, 8, 16]`), pad live batches up to the next bucket, and fall back to eager mode for outliers.[^vllm2026cudagraphs] Zero-padding alone is never enough for correctness: an affine op like $2x + 1$ turns dummy zeros into `1`, and unmasked dummy slots can corrupt reductions or live KV-cache entries unless every reduction and cache write masks padded positions explicitly:

| Check | Calculation | Result |
|---|---|---|
| CUDA Graph break-even ($12\text{ ms}$ setup, $18 \to 12\;\mu\text{s}$/iter) | $\lfloor 12{,}000 / (18 - 12) \rfloor + 1$ | Breaks even at iter **2,000** (36 ms); first net win at iter **2,001** |
| Bucket-8 affine op $(2x+1)^2$ on 6 valid inputs `[1..6]` | True sum vs. 2 zero-padded slots ($(2 \cdot 0 + 1)^2 = 1$ each) | True/masked sum **454** vs. unmasked **456** (corrupted by `+2`) |

## Report the result you measured

An optimization claim stands only when every row shares the exact shape, timing loop, cache regime, and verification gates, backed by raw logs (`.ncu-rep`, sanitizer transcripts, `ptxas` output, timing CSV, and source hash):

| Variant | One change | Correctness & Sanitizer | Expected profiler shift | Decision |
|---|---|---|---|---|
| `naive` | Baseline | Exact + clean | 4 load sectors, 32 store sectors | Baseline |
| `tiled` | $32 \times 32$ shared tile + barrier | Exact + clean | Store sectors drop to 4; 32-way bank conflicts appear | Intermediate step |
| `padded` | `tile[32][33]` (+128 B) | Exact + clean | Shared bank conflicts drop to 0 | Keep if repeated timings improve |
| `broken` | Remove `__syncthreads()` | Fails `racecheck` | Timing invalidated | Reject and document recovery |

```mastery-quiz
[
  {
    "question": "One full warp reads consecutive float32 words numbered 7 through 38 from a 32-byte-sector-aligned array base. How many sectors are touched, and what is useful payload divided by touched sector volume?",
    "options": [
      "4 sectors; 100%.",
      "5 sectors; 100%.",
      "5 sectors; 80%.",
      "32 sectors; 12.5%."
    ],
    "answer": "5 sectors; 80%.",
    "explanation": "A 32-byte sector holds 8 float32 words. Words 7..38 span sectors 0 through 4 (5 sectors = 160 bytes) for 128 useful bytes, giving 128/160 = 80% payload efficiency."
  },
  {
    "question": "A kernel transposes a 73x73 row-major matrix using 32x8 blocks covering 32x32 tiles. For edge block (bx, by) = (2, 0), how many valid input values does it load, how many threads hit `__syncthreads()`, and where does A[1, 64] land?",
    "options": [
      "288 values, 256 threads, B[64, 1] at linear index 4673.",
      "72 values, 72 threads, B[64, 1] at linear index 4673.",
      "72 values, 256 threads, B[1, 64] at linear index 137.",
      "288 values, 72 threads, B[1, 64] at linear index 137."
    ],
    "answer": "288 values, 256 threads, B[64, 1] at linear index 4673.",
    "explanation": "Columns 64..72 (9 columns) x 32 rows = 288 valid elements. All 32x8 = 256 threads must reach the unconditional barrier. A[1, 64] transposes to B[64, 1] at 64 * 73 + 1 = 4673."
  },
  {
    "question": "A 32x32 shared tile is padded to row stride 36 float32 words. All 32 warp lanes read column 0 of consecutive rows. With bank = word_index mod 32, what bank mapping and tile byte size result?",
    "options": [
      "16 banks with 2 distinct words each, 4,608 bytes.",
      "16 banks with 2 distinct words each, 4,096 bytes.",
      "8 banks with 4 distinct words each, 4,096 bytes.",
      "8 banks with 4 distinct words each, 4,608 bytes."
    ],
    "answer": "8 banks with 4 distinct words each, 4,608 bytes.",
    "explanation": "36 mod 32 = 4, so lanes hit banks 0, 4, 8, ..., 28 four times each (4-way conflict across 8 banks). Storage is 32 * 36 * 4 = 4,608 bytes."
  },
  {
    "question": "Two CUDA events bracket 40 launches of a 2048x2048 float32 transpose, measuring 4.00 ms total. What combined logical read+write rate does this support?",
    "options": [
      "167.8 GB/s of logical matrix traffic.",
      "335.5 GB/s of physical DRAM traffic.",
      "335.5 GB/s of logical matrix traffic.",
      "167.8 GB/s of physical DRAM traffic."
    ],
    "answer": "335.5 GB/s of logical matrix traffic.",
    "explanation": "One launch transfers 2 * 2048^2 * 4 = 33,554,432 logical bytes in 4.00 ms / 40 = 0.100 ms, giving 335.5 decimal GB/s of logical traffic (physical DRAM traffic requires Nsight counters)."
  },
  {
    "question": "A shared-memory kernel passes 64 output tests, `memcheck`, and `synccheck`, but `racecheck` flags a write-after-read hazard. What is the right verdict?",
    "options": [
      "Accept it because 64 matching outputs outweigh an instrumented schedule.",
      "Accept it because clean memcheck and synccheck prove memory ordering.",
      "Reject it; repair the missing synchronization and rerun output and sanitizer checks.",
      "Re-time it in Nsight Compute first to see if the race hurts throughput."
    ],
    "answer": "Reject it; repair the missing synchronization and rerun output and sanitizer checks.",
    "explanation": "Valid addresses and non-divergent barriers do not prevent inter-warp shared-memory races, and warp scheduling can mask a race on sample runs. Fix the synchronization before timing."
  },
  {
    "question": "Mismatch flags at indices 0..5 are [1, 0, 1, 0, 0, 1]. What are the exclusive scan offsets, compacted failing indices, and reduction sum?",
    "options": [
      "Offsets [1, 1, 2, 2, 2, 3], indices [0, 2, 5], total 3.",
      "Offsets [0, 1, 1, 2, 2, 2], indices [0, 2, 5], total 3.",
      "Offsets [0, 1, 1, 2, 2, 2], indices [0, 2], total 2.",
      "Offsets [1, 1, 2, 2, 2, 3], indices [0, 2], total 2."
    ],
    "answer": "Offsets [0, 1, 1, 2, 2, 2], indices [0, 2, 5], total 3.",
    "explanation": "Exclusive scan sums flags strictly before each index ([0, 1, 1, 2, 2, 2]), placing failing indices [0, 2, 5] into slots 0, 1, and 2, with total count 3."
  }
]
```

> **Next:** Continue to [GPU Parallel Primitives Lab](/learn/gpu-parallel-primitives-lab).
