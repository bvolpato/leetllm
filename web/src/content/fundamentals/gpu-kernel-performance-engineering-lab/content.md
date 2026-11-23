---
{
  "id": "gpu-kernel-performance-engineering-lab",
  "title": "GPU Kernel Performance Engineering Lab",
  "slug": "gpu-kernel-performance-engineering-lab",
  "section": "Inference & Production Scale",
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
    "gpu-profiling-correctness-benchmarking",
    "accelerator-architecture-field-guide",
    "cuda-gpu-computing-for-ml"
  ],
  "relatedQuestions": [
    "gpu-compilers-kernel-languages",
    "gemm-naive-cuda-tensor-cores",
    "flashattention-memory-efficient-attention",
    "scaling-llm-inference-batching-kv-cache"
  ]
}
---

You change four lines of CUDA, recompile, and the kernel runtime drops by 40%. When the verification pass runs, it flags thousands of stale NaN values across the output matrix because the kernel simply skipped part of its work and finished early. The investigation starts with a causal hypothesis about the current bottleneck: change one mechanism at a time, verify bit-exact output on partial-tile and full-tile shapes, and check whether hardware counters and repeated timings back up the prediction. Counter shifts explain why a change behaves differently on hardware, while isolated timing runs confirm whether other mechanisms also moved elapsed time.

You will optimize an out-of-place single-precision ($N \times N$) matrix transpose. Copying elements without floating-point arithmetic keeps every launch at one logical read and one logical write per element, which makes memory address order easy to isolate and analyze. Even with identical arithmetic work, indexing expressions, thread predicates, block barriers, instruction issue, low parallelism, and host launch gaps can all shape elapsed time.

Three earlier lessons introduced the building blocks that this lab combines inside one working kernel. [CUDA for ML Training](/learn/cuda-gpu-computing-for-ml) covered grids, blocks, warps, asynchronous launches, and the GPU memory hierarchy. [Accelerator Architecture Field Guide](/learn/accelerator-architecture-field-guide) connected <span data-glossary="arithmetic-intensity">arithmetic intensity</span> and resource ceilings to workload bounds, while [GPU Profiling, Correctness, and Benchmarking](/learn/gpu-profiling-correctness-benchmarking) separated host timelines, kernel counters, and correctness verification.

## Keep one experiment stable

The workload transposes an $N \times N$ row-major float32 <span data-glossary="matrix">matrix</span> into a separate output allocation. Because it is strictly out of place, passing overlapping input and output pointers would let fast thread blocks overwrite elements before slower blocks read them. If $A[r,c]$ lives at `input[r * N + c]`, the output satisfies $B[c,r] = A[r,c]$:

$$
B[c,r] = A[r,c]
$$

No floating-point operation alters any element. The host checker verifies each float's exact 32-bit representation via bitwise equality rather than a numerical tolerance or <span data-glossary="checksum">checksum</span>, while reporting maximum absolute error strictly as a diagnostic. Signed zeros (`+0.0f` and `-0.0f`) demonstrate why bits matter: their numerical difference is zero, yet their 32-bit patterns (`0x00000000` and `0x80000000`) do not match.

The harness caps `N` at 4096 and populates the input with consecutive integers from `0` through $N^2 - 1$. At the maximum size, $16{,}777{,}215$ remains inside float32's consecutive exact-integer range, so every input position holds a distinct value that exposes misplaced permutations. Before each standalone correctness launch, the host fills every output byte with `0xff`, initializing the destination buffer to NaN bit patterns (`0xffffffff`) so any skipped store fails immediately rather than inheriting stale values from an earlier launch. These integer inputs catch permutation bugs and missed stores cleanly, though they do not exercise arbitrary IEEE-754 bit payloads such as signaling NaNs or subnormals.

<figure>
  <img src="illustrations/_generated/bit_exact_poisoned_check_dark.png" alt="Three 3x3 matrices show input A, expected transpose B, and actual B when the store for A[1,2]=5 is skipped, leaving poisoned NaN (0xffffffff) at B[2,1] while signed zeros +0 (0x00000000) and -0 (0x80000000) differ bitwise. A four-stage row shows fresh-poison preflight, five warmups, event-timed iterations, and separate validation." />
  <figcaption>One skipped store leaves a poisoned NaN (0xffffffff) at B[2,1], while signed zeros show why bitwise comparison catches bit-level differences missed by absolute error. Fresh-poison preflight and post-timing validation bracket five warmups and the event-timed batch, whose individual outputs remain unchecked.</figcaption>
</figure>

The included harness packages five kernel variants inside one executable so every run shares the same allocation layout, timer, and host verification pass. Using a single harness ensures that differences between runs come from the kernel implementation rather than mismatched matrix setup. The variants isolate each stage of the optimization path:

| Variant | Purpose | Included in normal benchmark? |
|---|---|---|
| `copy` | reads and writes every element without transposing, giving a same-harness memory-movement reference | yes |
| `naive` | reads adjacent input words but writes the transpose with <span data-glossary="stride">stride</span> $N$ | yes |
| `tiled` | stages a $32 \times 32$ tile in shared memory so global reads and writes are adjacent | yes |
| `padded` | changes shared tile to $32 \times 33$ so column reads spread across banks | yes |
| `broken` | removes required block barrier to create a shared-memory race | no, run deliberately |

Notice that `copy` solves a different problem even though it moves the exact same logical read and write volume. Use it purely as a hardware sanity reference for coalesced movement, and evaluate transpose optimizations only against other correct transpose variants. Write down your bottleneck hypothesis before editing code, discard any variant that fails verification, and compare repeated measurements under identical runtime conditions so profiler counters guide the next experiment rather than after-the-fact stories.

## Build the lab on an NVIDIA GPU

You need an NVIDIA <span data-glossary="gpu">GPU</span>, a CUDA Toolkit with `nvcc` and Compute Sanitizer, and Nsight Compute's `ncu` command. Tool versions and GPU identity belong beside every result because compiler decisions, architecture, clocks, and profiler metric availability can change evidence. The coordinate exercises and shared host checker run on CPU. Collect GPU execution, memory-safety, and performance evidence on your target device.

Save [the CUDA source](assets/transpose_lab.cu) and [its host-checking header](assets/transpose_checks.hpp) in the same directory. Save [the recovery template](assets/recovery-template.md) for the deliberate failure later. The shell commands below target Bash on a CUDA-equipped machine. A CPU or Apple GPU can't execute these CUDA kernels; the later Python exercise checks indexing only.

Create an artifact directory and snapshot the active hardware and compiler environment before building any binary. Recording the GPU model, driver state, toolkit versions, and source SHA-256 digests keeps later comparisons grounded when a machine updates or multiple builds sit side by side. Keep `pipefail` enabled so a CUDA or compiler failure stops the script instead of hiding behind a zero exit code from `tee`:

```bash title="terminal"
mkdir -p artifacts/run-01
set -euo pipefail
nvidia-smi -L | tee artifacts/run-01/gpu.txt
nvidia-smi | tee artifacts/run-01/nvidia-smi.txt
nvcc --version | tee artifacts/run-01/nvcc.txt
ncu --version | tee artifacts/run-01/ncu.txt
compute-sanitizer --version | tee artifacts/run-01/compute-sanitizer.txt
sha256sum transpose_lab.cu transpose_checks.hpp | tee artifacts/run-01/source.sha256
```

Compile optimized C++17 code with line information for source attribution. Passing `-Xptxas=-v` instructs the backend assembler to report kernel register counts, static shared memory, and any local-memory spills directly in the build log. Meanwhile, `-arch=native` detects visible supported GPUs and compiles native machine code without PTX JIT overhead, though targeting multiple external GPUs requires specifying architectures supported by that CUDA Toolkit and hardware.[^nvccGuide2026]

```bash title="terminal"
nvcc -std=c++17 -O3 -arch=native -lineinfo -Xptxas=-v \
  -o transpose_lab transpose_lab.cu \
  2>&1 | tee artifacts/run-01/build.txt
```

Read the build log directly rather than guessing resource usage from the C++ template declarations. The compiler prints per-instantiation figures for shared memory, registers, and spill instructions, letting you verify allocation math ahead of any profiler pass. Confirm these specific items in `artifacts/run-01/build.txt`:

- the compiler names each instantiated kernel;
- `transpose_tiled<0>` reserves $32 \times 32 \times 4 = 4096$ bytes of static shared memory;
- `transpose_tiled<1>` reserves $32 \times 33 \times 4 = 4224$ bytes;
- register count is recorded directly from `ptxas`;
- record `spill stores` and `spill loads`; zero is desirable here, but a spill isn't automatically a correctness failure or a slower kernel;
- no compilation error is present.

Begin by testing small, odd, and unaligned matrix shapes where edge thread blocks only partially cover the matrix. Partial tiles catch off-by-one bounds guards, missing barrier paths, and linear indexing bugs that divisible benchmark sizes mask completely. Each invocation below writes one output check and must exit zero:

```bash title="edge-cases.sh"
for n in 1 7 31 32 33 65 257; do
  ./transpose_lab all "$n" 1 > "artifacts/run-01/check-${n}.csv"
done
```

Once every edge shape clears verification, run the fixed $4096 \times 4096$ workload across all four normal variants for 100 measured launches each. At $4096 \times 4096$, the matrix holds $16{,}777{,}216$ float32 elements, large enough that steady-state memory behavior dominates kernel launch overhead. Keep the generated CSV so its numbers pair directly with your later profiler logs:

```bash title="terminal"
./transpose_lab all 4096 100 \
  | tee artifacts/run-01/benchmark.csv
```

The harness prints CSV columns `variant`, `correct`, `mismatches`, `max_abs_error`, `average_ms`, and `effective_gb_s`, while device identity and grid geometry go to standard error. A fresh-buffer poisoned check runs before warmup and another runs after timing; any mismatch suppresses performance fields and returns exit code 2. The known-racy `broken` variant always returns 2 and is never timed even if its sampled output happens to match, while argument or runtime errors return 1. Together, these fields determine whether a run qualifies as usable baseline evidence:

| Field | Required evidence |
|---|---|
| `correct` | `true` for `copy`, `naive`, `tiled`, and `padded` |
| `mismatches` | `0` |
| `max_abs_error` | `0` |
| `average_ms` | positive average CUDA-event interval after five warmup launches |
| `effective_gb_s` | positive logical read-plus-write rate, interpreted only with profiler evidence |

Don't rank variants yet, because a single process run can reflect transient clock boosts, thermal throttling, competing work, or allocation warmup state. Instead, repeat separate processes under identical settings, alternate variant order across rounds to cancel systematic drift, and retain every raw row in the log:

```bash title="terminal"
{
  echo 'round,position,variant,correct,mismatches,max_abs_error,average_ms,effective_gb_s'
  for round in 1 2 3 4 5; do
    if (( round % 2 == 1 )); then
      order=(naive tiled padded)
    else
      order=(padded tiled naive)
    fi
    position=0
    for variant in "${order[@]}"; do
      row=$(./transpose_lab "$variant" 4096 100 2>> artifacts/run-01/repeated-launches.txt | tail -n 1)
      printf '%s,%s,%s\n' "$round" "$position" "$row"
      position=$((position + 1))
    done
  done
} | tee artifacts/run-01/repeated-benchmark.csv
```

These repeated calls reuse allocations after warmup, so pair them with profiler runs or a rotating working-set harness if you want a cold-streaming L2 measurement. The CUDA event interval excludes allocation, host transfers, and validation, yet still captures gaps between host-submitted launches and only reports per-batch averages rather than per-call tail percentiles. Also remember that the post-timing check verifies a fresh poisoned buffer while the 100 timed launches themselves remain unchecked, and tiny matrix sizes remain vulnerable to launch overhead. Always compare the spread across repeated samples rather than single best times: overlapping sample distributions leave any speedup unresolved until more controlled trials separate them.

## Read the naive memory path

CUDA combines a warp's accesses according to address coverage. For compute capability 6.0 and newer, the coalescing model counts the 32-byte sectors needed to service the lanes, where a full warp reading adjacent aligned `float32` words touches **four sectors**.[^cudaBestPractices2026] Requests, cache lines, sectors, and device-memory transfers are distinct quantities across the hierarchy, and Nsight Compute's memory tables separate them cleanly.[^nsightCompute2026]

The naive kernel preserves spatial locality when reading input rows, then loses that locality when writing transposed columns. Because `threadIdx.x` runs horizontally along input rows, converting `(y + offset, x)` directly into output `(x, y + offset)` turns adjacent lanes into column-strided stores. Inspect the indexing math inside `transpose_naive` before tracing warp addresses:

```cpp title="transpose-naive.cu"
__global__ void transpose_naive(float* output, const float* input, int n) {
  const int x = blockIdx.x * kTile + threadIdx.x;
  const int y = blockIdx.y * kTile + threadIdx.y;

  for (int offset = 0; offset < kTile; offset += kBlockRows) {
    if (x < n && y + offset < n) {
      const size_t input_index = static_cast<size_t>(y + offset) * n + x;
      const size_t output_index = static_cast<size_t>(x) * n + y + offset;
      output[output_index] = input[input_index];
    }
  }
}
```

Consider a single 32-lane warp where `threadIdx.y` stays fixed and `threadIdx.x` ranges from 0 through 31. Tracing both global index formulas across those 32 consecutive lanes exposes the asymmetry between the load and store instructions. Each step of the warp execution follows directly from those two address expressions:

1. **Input read:** `input_index = (y + offset) * n + x`. For the aligned $N=4096$ interior case, the 32 lanes cover 128 contiguous bytes in four sectors. Odd row widths can misalign a later row, and edge warps have fewer active lanes.
2. **Output store:** `output_index = x * n + (y + offset)`. Consecutive lanes differ by $N$ floats. At $N=4096$, that is 16,384 bytes, or **16 KiB**, so each lane reaches a different sector.
3. **Sector coverage:** This store instruction has 128 bytes of useful payload spread across 32 sectors. Its payload-to-sector-volume ratio is $128/(32 \times 32)=12.5\%$, compared with 100% for the aligned four-sector model.

That stride calculation predicts low payload utilization at the L1/TEX access stage, yet address arithmetic alone cannot tell you the full hardware cost. Cache hit rates, store merging in L1/L2, write-allocation policies, and ECC overhead all shape downstream device-memory traffic. Always inspect profiler counters to isolate which memory stage actually throttles the kernel before declaring a DRAM bandwidth bottleneck. Because a matrix transpose performs zero floating-point math, its logical data volume per launch reduces purely to one float32 read and one float32 write per matrix element, giving $2N^2 \cdot \operatorname{sizeof}(\text{float})$ bytes:

$$
\text{logical bytes} = 2N^2 \cdot \operatorname{sizeof}(\text{float})
$$

At $N=4096$, each launch transfers $134{,}217{,}728$ logical bytes, or 128 MiB of matrix data across the read and write passes combined. Dividing that logical byte count by the average kernel interval yields the `effective GB/s` figure reported by the harness. Note that this metric uses decimal gigabytes ($10^9$ bytes/s) so rates stay comparable across standard memory-bandwidth tables:

$$
\text{effective GB/s} =
\frac{2N^2 \cdot 4}{\text{average time in seconds} \cdot 10^9}
$$

Effective bandwidth isn't physical DRAM traffic. Cache hits, excess transactions, error-correction traffic, and architecture-specific paths make hardware traffic differ. Use it as a workload-normalized rate for comparing the same operation on the same setup, then verify physical traffic with store-sector and DRAM counters to confirm whether scattered writes account for elapsed time.

```checkpoint
A $4096 \times 4096$ transpose averages $0.250$ ms. What effective rate should the ledger record, and what hardware claim remains unsupported?
---
The logical volume is $2 \times 4096^2 \times 4 = 134{,}217{,}728$ bytes. Dividing by $0.000250$ seconds and then by $10^9$ gives about $536.9$ GB/s. That is a workload-normalized effective rate. Use profiler counters and matching hardware conditions to report physical DRAM traffic or percentage of peak bandwidth.
```

## Profile before editing

Nsight Compute groups kernel evidence into named sections, and the memory workload table is where scattered store waste shows up. `LaunchStats` reports grid geometry, block dimensions, registers per thread, and shared memory. `SpeedOfLight` compares compute and memory throughput against device ceilings, `MemoryWorkloadAnalysis` traces requests and bytes across cache and DRAM levels, and `Occupancy` reports warp residency limits.[^nsightCompute2026]

Collect the first measured `naive` launch by skipping the preflight check and five warmup launches (`--launch-skip 6`). Because `--set full` replays the kernel across many passes and distorts elapsed time, measure kernel speed exclusively in the unprofiled harness and consult Nsight CLI docs for launch-selection flags.[^nsightComputeCli2026]

```bash title="terminal"
ncu --set full \
  --kernel-name-base function \
  --kernel-name transpose_naive \
  --launch-skip 6 \
  --launch-count 1 \
  --force-overwrite \
  -o artifacts/run-01/naive \
  ./transpose_lab naive 4096 1

ncu --import artifacts/run-01/naive.ncu-rep --page details \
  > artifacts/run-01/naive.txt
```

Work through the exported text report systematically rather than cherry-picking one percentage. Confirm the exact workload and kernel identity first, then match throughput ceilings with sector efficiency and resource limits. Inspect `artifacts/run-01/naive.txt` in this order:

1. Confirm kernel name, matrix size, block `32 x 8`, and one profiled launch.
2. Check whether memory throughput is closer to its ceiling than compute throughput (`dram__throughput.avg.pct_of_peak_sustained_elapsed`).
3. Inspect the L1/TEX memory table's `Sectors/Req` separately for loads and stores. For this full-warp mapping, predict four load sectors and 32 store sectors per request. The 12.5% payload fraction follows from the address model; query installed metric names and profile the target kernel to measure cache and device-memory behavior.
4. Check static shared memory is zero for the naive variant.
5. Read the occupancy limiter, but don't optimize it unless evidence connects the limiter to latency or throughput.

Low arithmetic intensity points to the memory path as an initial hypothesis. However, small launches can be dominated by launch gaps or tail stalls, and large kernels can stall on memory-instruction issue before saturating DRAM bandwidth, so use Roofline ceilings alongside measured section counters to pinpoint the active resource limit.[^williams2009] Before changing any line of CUDA, write down your concrete baseline record with the exact observed counters; if the report does not point to a memory-path limit, revise your hypothesis before expecting a shared-memory rewrite to help:

```text title="artifacts/run-01/naive-bound.txt"
Workload: float32 transpose, N=4096, block=32x8
Correctness: <actual mismatch count and artifact>
Observed limiter: <resource supported by report, or still unresolved>
Source evidence: <report file, section, observed values>
Address-model prediction: 32 store sectors versus 4 aligned load sectors per full warp
Hypothesis: make output stores adjacent by staging a tile in shared memory
```

## Coalesce both global directions

The tiled transpose uses block-local shared memory to exchange row and column positions before writing back to global memory. Each block loads adjacent input words into a shared tile, hits a block barrier so all writes become visible, then reads transposed shared slots and writes adjacent output words. Mark Harris's classic CUDA transpose walkthrough demonstrates this exact staging pattern, though its historical GPU timings do not predict your current hardware.[^harris2013transpose]

The core kernel template below accepts `Padding` as a compile-time column-width adjustment. Variant `tiled` instantiates `Padding = 0` for an exact $32 \times 32$ array, isolating global coalescing before later introducing any padding shift:

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

  __syncthreads();

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

Inspect the symmetry in both coordinate loops:

- Input reads advance with `threadIdx.x`, giving adjacent lane addresses. Four-sector coverage applies to a full aligned warp, not every edge or odd-width row.
- `__syncthreads()` orders shared writes before the block's subsequent shared reads. All 256 threads reach it, including lanes without an active in-bounds input element.
- Output addresses also advance with `threadIdx.x`. The transpose now preserves adjacent lane order in both global directions; the selected shape and alignment determine sector coverage.

Keep `__syncthreads()` outside both bounds checks so every thread in the block executes the barrier unconditionally, even when edge tiles leave some threads idle. Placing a barrier inside an `if` branch where partial-tile threads skip it causes undefined warp-divergence behavior across the block. The diagram below compares the naive global scatter against this shared-tile exchange on one aligned warp:

<figure>
  <img src="illustrations/_generated/transpose_memory_path_dark.png" alt="Comparison of global memory access at N=4096 for one aligned 32-lane warp. Reading row 0 of A loads 32 adjacent floats across four 32-byte sectors (100% coverage). A naive write to column 0 scatters lanes across 4,096-word (16 KiB) strides touching 32 sectors (12.5% coverage), while a shared-tile transpose swaps tile[ty][tx] to tile[tx][ty] so output writes touch four sectors again." />
  <figcaption>Reading row 0 loads 32 adjacent floats across four 32-byte sectors. Swapping coordinates inside shared memory turns scattered column stores back into four coalesced sectors, while hardware counters measure cache behavior, device-memory traffic, and latency.</figcaption>
</figure>

### Check the edge-tile mapping without a GPU

For `N=33`, most threads in the last tile fall out of bounds, raising an immediate correctness question: does every active output thread read a shared slot written by an active input thread? Its shared read coordinate `(threadIdx.x, threadIdx.y + offset)` reads the slot written at input coordinates `(blockIdx.y * 32 + threadIdx.x, blockIdx.x * 32 + threadIdx.y + offset)`, which is the exact transpose of the active output position `(output_x, output_y + offset)`. Because both bounds checks compare those transposed row and column indices against `n`, every valid output element has a matching in-bounds producer before the barrier. This CPU model enumerates every block and thread coordinate across seven matrix sizes, verifies that every shared read has a written producer and every output slot is written once, and checks bank distribution counts without executing CUDA or modeling warp scheduling or memory timing.

<figure>
  <img src="illustrations/_generated/edge_tile_producer_consumer_dark.png" alt="Diagram of edge block (1,0) for N=33. Three matrices connected by arrows trace input column A[r,32] (tx=0 active) into shared column tile[r,0] and out to output row B[32,r] (32 lanes at ty=0). Below, a 4x8 grid shows shared rows r=0 through 31 with r=1 highlighted, paired with producer (tx=0, ty=1, Warp 1), the 256-thread barrier, and consumer (tx=1, ty=0, Warp 0)." />
  <figcaption>At N=33, the edge block activates one input column and one output row. The shared row index carries each value from A[r,32] to B[32,r], while all 256 threads still reach the block barrier.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, id=transpose-coordinates, output=show -->
```python title="transpose-index-model.py"
import numpy as np

def check_mapping(n: int) -> None:
    src = np.arange(n * n, dtype=np.int64).reshape(n, n)
    dst = np.full((n, n), -1, dtype=np.int64)
    for by in range((n + 31) // 32):
        for bx in range((n + 31) // 32):
            smem = np.full((32, 33), -1, dtype=np.int64)  # +1 padding avoids bank conflicts
            for ty in range(8):
                for tx in range(32):
                    for offset in range(0, 32, 8):
                        row, col = by * 32 + ty + offset, bx * 32 + tx
                        if row < n and col < n:
                            smem[ty + offset, tx] = src[row, col]
            for ty in range(8):
                for tx in range(32):
                    for offset in range(0, 32, 8):
                        row, col = bx * 32 + ty + offset, by * 32 + tx
                        if row < n and col < n:
                            assert dst[row, col] == -1
                            dst[row, col] = smem[tx, ty + offset]
    assert np.array_equal(dst, src.T)

for n in (1, 7, 31, 32, 33, 65, 257):
    check_mapping(n)
print("seven square shapes: index coverage and transpose mapping pass")
lanes = np.arange(32, dtype=np.int64)
for stride in (32, 33, 34):
    unique_banks, counts = np.unique((lanes * stride) % 32, return_counts=True)
    print(f"stride {stride}: {unique_banks.size} banks, {int(counts.max())} words per bank")
assert 2 * 4096**2 * 4 == 134_217_728
print(f"example effective GB/s: {134_217_728 / 0.000250 / 1e9:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
seven square shapes: index coverage and transpose mapping pass
stride 32: 1 banks, 32 words per bank
stride 33: 32 banks, 1 words per bank
stride 34: 16 banks, 2 words per bank
example effective GB/s: 536.9
```
<!-- leetllm: output:end -->

Adjacent lane order alone is not enough to guarantee four-sector coverage, because starting alignment and the count of active lanes in a warp also shift sector boundaries. An unaligned base word pushes consecutive lanes across a fifth 32-byte sector (`80%` payload efficiency), whereas a single active edge lane touches one 32-byte sector for four useful bytes (`12.5%`). Count touched 32-byte sectors directly from lane word addresses:

<!-- leetllm: test, continue=transpose-coordinates, output=show -->
```python title="count-sector-coverage.py"
def sector_coverage(word_indexes) -> tuple[int, float]:
    addresses = np.asarray(list(word_indexes), dtype=np.int64)
    sectors = np.unique((4 * addresses) // 32)
    useful = 4 * np.unique(addresses).size
    return int(sectors.size), useful / (32 * sectors.size) if sectors.size else 0.0

cases = (
    ("aligned row, N=4096", np.arange(32)),
    ("second row, N=33", np.arange(33, 65)),
    ("naive column, N=4096", np.arange(32) * 4096),
    ("one active edge lane", np.array([32])),
)
for name, addresses in cases:
    sectors, fraction = sector_coverage(addresses)
    print(f"{name}: {sectors} sectors, {fraction:.1%} payload fraction")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
aligned row, N=4096: 4 sectors, 100.0% payload fraction
second row, N=33: 5 sectors, 80.0% payload fraction
naive column, N=4096: 32 sectors, 12.5% payload fraction
one active edge lane: 1 sectors, 12.5% payload fraction
```
<!-- leetllm: output:end -->

Run correctness verification and repeated event timing on `tiled` first, then capture its single profiled launch under Nsight Compute. Keeping profiling separate preserves clean uninstrumented timing while verifying whether the shared tile moved global store sectors as expected:

```bash title="terminal"
./transpose_lab tiled 4096 100 \
  | tee artifacts/run-01/tiled-benchmark.csv

ncu --set full \
  --kernel-name-base function \
  --kernel-name 'regex:transpose_tiled' \
  --launch-skip 6 \
  --launch-count 1 \
  --force-overwrite \
  -o artifacts/run-01/tiled \
  ./transpose_lab tiled 4096 1
```

In the `tiled` report, the memory and pipeline tables should reveal two distinct shifts compared with `naive`. First, global reads and writes both advance with adjacent lane addresses, dropping the predicted store-sector count per aligned request from 32 down to four. Second, reading transposed columns out of `tile[32][32]` creates severe shared-memory bank contention because all 32 warp lanes step vertically through the same row stride:

- global reads and writes now use adjacent lane addresses, reducing the predicted store-sector count from 32 to four for the full aligned warp;
- the shared-memory column read triggers a severe bank conflict.

For the scalar 32-bit access model here, successive words map cyclically across 32 shared-memory banks according to $\operatorname{bank}(k) = k \bmod 32$. Requesting different words inside the same bank forces serial service across wavefronts, whereas reading the identical word across lanes can broadcast in one cycle. Removing bank serialization improves shared-memory throughput capacity, though total load-to-use latency still depends on instruction issue and surrounding dependencies.

In the unpadded tile `tile[32][32]`, row $r$, column $c$ sits at 1D float offset $32r + c$. When reading down column $c$, thread lane $i$ reads row $r = i$, landing at word offset $32i + c$. Because $32i \bmod 32 = 0$, every lane hits bank $c$, producing a **32-way bank conflict** that serializes one column read into 32 conflict-free wavefronts.[^harris2013transpose]

$$
\operatorname{bank}(i) = (32i + c) \bmod 32 = c
$$

To confirm that bank contention shows up on hardware rather than remaining an address hypothesis, query your installed Nsight Compute metrics for shared-memory bank conflict counters first, then collect the profile:

```bash title="terminal"
ncu --query-metrics | rg 'bank_conflicts|shared.*conflict' \
  | tee artifacts/run-01/bank-metrics.txt
```

When the installed tool and GPU expose `l1tex__data_bank_conflicts_pipe_lsu_mem_shared_op_ld.sum`, inspect it alongside the Shared Memory table. Expect evidence consistent with the column mapping, and use available source correlation to locate it. Counter availability and instruction-level attribution vary by target.

## Change the shared-memory stride

The next candidate tests one isolated hypothesis: changing only the shared tile's second dimension eliminates the column bank conflict without altering thread geometry or global traffic. Modifying `tile[32][32]` to `tile[32][33]` adds four padding bytes to the end of each row while leaving every logical coordinate index identical:

```cpp title="padded-shared-tile.cu"
__shared__ float tile[32][33];
```

By adding a single padding float to each row, the row stride shifts from 32 words to 33 words, placing lane $i$ at column $c$ on linear offset $33i + c$. Reducing modulo 32 gives $\operatorname{bank}(i) = (32i + i + c) \bmod 32 = (i + c) \bmod 32$. As $i$ runs from 0 through 31, $(i + c) \bmod 32$ cycles smoothly across all 32 banks without repeating: lane 0 reads Bank $c$, lane 1 reads Bank $(c+1) \bmod 32$, and lane 31 reads Bank $(c+31) \bmod 32$.

$$
\operatorname{bank}(i) = (33i + c) \bmod 32 = (32i + i + c) \bmod 32 = (i + c) \bmod 32
$$

Each lane hits a unique bank, removing the column conflict at the cost of 128 extra bytes of static shared memory per block (`4224` bytes instead of `4096`). Both the $32 \times 32$ logical tile shape and all global read/write addresses remain untouched, though actual service latency and runtime speedup still depend on target hardware measurements.[^harris2013transpose]

```checkpoint
Would `float tile[32][34]` remove the column conflict as completely as `float tile[32][33]`? Derive the bank pattern before answering.
---
No. A 34-word row gives $\operatorname{bank}(i) = (34i + c) \bmod 32 = (2i + c) \bmod 32$. Because $\gcd(34, 32) = 2$, lanes 0 through 15 reach 16 distinct banks, then lanes 16 through 31 repeat those exact same banks. Each bank receives two different words, leaving a two-way conflict. A 33-word row works because $\gcd(33, 32) = 1$, so its stride is one modulo 32.
```

<figure>
  <img src="illustrations/_generated/shared_bank_stride_dark.png" alt="Comparison of shared-memory strides 32, 33, and 34 for scalar 32-bit reads on column 0. A bank map and padded tile diagram show stride 32 collapsing onto Bank 0, stride 33 visiting all 32 banks once, and stride 34 hitting 16 even banks twice. A bar chart plots 32, 1, and 2 predicted conflict-free service groups alongside 4,096, 4,224, and 4,352 bytes per tile." />
  <figcaption>For scalar 32-bit column reads, stride 32 sends all 32 distinct words to Bank 0, stride 33 cycles once through banks 0 through 31, and stride 34 visits 16 even banks twice. Padding increases shared storage per tile while keeping the logical 32×32 matrix and global traffic unchanged. Because the plotted group counts describe the hardware bank mapping rather than runtime, measure latency directly on the target GPU.</figcaption>
</figure>

Validate correctness on the padded variant prior to collecting timed benchmarks or interpreting performance counters. Capturing both the timing CSV and the Nsight Compute report from the exact same executable and kernel filter keeps the launch configuration consistent with the tiled baseline. Inspect the mismatch count first, then compare bank-conflict counters at launch index 6:

```bash title="terminal"
./transpose_lab padded 4096 100 \
  | tee artifacts/run-01/padded-benchmark.csv

ncu --set full \
  --kernel-name-base function \
  --kernel-name 'regex:transpose_tiled' \
  --launch-skip 6 \
  --launch-count 1 \
  --force-overwrite \
  -o artifacts/run-01/padded \
  ./transpose_lab padded 4096 1
```

Holding the matrix size, launch count, and correctness gate fixed lets you isolate the effect of the padded tile layout. Each row below pairs an expected observation in `tiled` against what should change in `padded` when bank conflicts were the active bottleneck:

| Evidence | `tiled` expectation | `padded` expectation | Decision use |
|---|---|---|---|
| exact transpose | 0 mismatches | 0 mismatches | reject either candidate that fails |
| logical global bytes | same $2N^2 \cdot 4$ | same $2N^2 \cdot 4$ | keeps rate comparable |
| global access order | adjacent reads and writes | adjacent reads and writes | confirms padding didn't regress coalescing |
| shared bank conflicts | column conflict present | conflict removed for shown mapping | tests causal hypothesis |
| static shared memory | 4096 bytes | 4224 bytes | feeds resource-limit check |
| event time | measured distribution | measured distribution | keep change only if repeat evidence improves |

Don't write that padding is faster without citing your hardware, software, shape, precision, timing method, baseline, and correctness record. Architecture and toolchain determine how much bank-conflict elimination helps relative to the extra shared storage per block. Without those qualifying measurements, a universal speedup claim would be unfounded.

```checkpoint
A candidate is 6% faster, but its edit both pads the tile and changes the block from `32 x 8` to `32 x 16`. What can the evidence ledger conclude, and how should the experiment recover?
---
The run shows that the combined candidate differs, but it can't attribute the change to padding or launch geometry. Restore `32 x 8` and measure padding alone against the fixed baseline. Then hold tile width fixed and test `32 x 16` separately. Each branch still needs the same exact-output, profiler, sanitizer, and repeated-timing gates.
```

## Loop unrolling and instruction-level parallelism

Hardware needs independent work in flight to hide memory latency. Resident warps and independent instructions within a thread can provide it. Measure latency on the target: it depends on the device, cache outcome, contention, and clocks.

In `transpose_tiled`, 256 threads cover 1,024 floats, so each handles four rows separated by `kBlockRows = 8`. The download has no explicit unroll pragmas. As a separate experiment, add one immediately before a selected loop, as shown here:[^cudaCppIntrinsics2026]

```cpp
#pragma unroll
for (int offset = 0; offset < kTile; offset += kBlockRows) {
  if (input_x < n && input_y + offset < n) {
    tile[threadIdx.y + offset][threadIdx.x] =
        input[static_cast<size_t>(input_y + offset) * n + input_x];
  }
}
```

The compiler already unrolls small constant-trip loops by default, so the pragma may leave generated code unchanged. Unrolling can reduce loop-control instructions and expose independent operations. Inspect generated assembly to see whether loads issue before their dependent shared stores, then compare compiler resources and timing to measure overlap.[^cudaCppIntrinsics2026]

More live state can increase register pressure, reduce resident warps, or cause spills. The SM allocation thresholds depend on the GPU architecture and block configuration rather than a universal 32- or 48-register rule. Local-memory spills use device-memory-backed storage and can hit cache, so they don't automatically destroy throughput; record their measured cost before rejecting an otherwise faster candidate.[^cudaBestPractices2026]

Interior warps keep all 32 lanes active, whereas edge warps mask out-of-range coordinates. Keep global memory accesses inside their bounds checks and keep the block barrier outside them. Moving a load or store beyond its guard to increase lane utilization would read or write out-of-bounds memory and break correctness.

## Occupancy is a constraint, not a score

Occupancy is the ratio of active warps on a Streaming Multiprocessor (SM) to the hardware maximum. More resident warps can hide latency, while the highest occupancy can still lose throughput if the kernel executes redundant work or stalls on shared banks. Registers, shared memory, threads per block, and barriers can limit resident blocks, while forcing resource use down can introduce spills or extra instructions.[^cudaBestPractices2026][^nsightCompute2026]

The lab block uses `32 x 8 = 256` threads, or eight 32-thread warps. Adding a single padding column increases static shared storage per block without altering thread geometry, whereas loop unrolling or changing block dimensions shifts registers and warp slots. Track both the properties fixed by launch configuration and the resource figures reported by the compiler and profiler:

| Resource | `naive` | `tiled` | `padded` | What to inspect |
|---|---:|---:|---:|---|
| threads per block | 256 | 256 | 256 | LaunchStats |
| static shared memory per block | 0 B | 4096 B | 4224 B | compiler output and LaunchStats |
| added shared memory from padding | 0 B | 0 B | 128 B | arithmetic plus report |
| registers per thread | compiler-specific | compiler-specific | compiler-specific | `-Xptxas=-v` and LaunchStats |
| resident blocks or warps | device-specific | device-specific | device-specific | Occupancy limiter |

The 128-byte increase from padding may leave occupancy unchanged or cross an SM allocation threshold for a particular resource configuration. Static shared memory per block interacts with register pressure and the hardware warp limit, so occupancy behavior varies across architectures. Always read the compiler resource output and Nsight Occupancy section instead of inferring resident blocks from source alone.

<figure>
  <img src="illustrations/_generated/resource_and_iteration_contract_dark.png" alt="Comparison of the fixed baseline against three single-variable optimization branches. The baseline pairs a 32x8 block (256 threads, 8 warps), a 32x32 shared tile (4,096 B), and loop offsets 0, 8, 16, and 24. Branch A pads the tile to 32x33 (4,224 B, +128 B). Branch B applies #pragma unroll across the four offsets. Branch C doubles the block to 32x16 (512 threads, 16 warps)." />
  <figcaption>Each optimization trial holds the 32×8 baseline fixed and changes one mechanism at a time. Padding adds a 33rd column (+128 bytes per block), unrolling expands the four row offsets at compile time, and changing block height alters thread count from 256 to 512. Inspect generated SASS, register usage, spills, exact correctness, and target-GPU timing before keeping any branch.</figcaption>
</figure>

Before choosing a next edit, pair the observed occupancy limiter with stall and memory-throughput counters from Nsight Compute. A shared-memory ceiling suggests shrinking the tile or lowering block count, whereas high memory throughput at modest occupancy points toward reducing transferred bytes. Use these diagnostic pairings when evaluating profiler evidence:

| Profiler evidence | Likely constraint | Next experiment |
|---|---|---|
| low occupancy limited by static shared memory | too much per-block tile storage | reduce tile footprint or test smaller blocks, one change at a time |
| low occupancy limited by registers plus local-memory traffic | register pressure and spilling | reduce live state or revisit unrolling, then check instruction count |
| adequate occupancy but high memory throughput | memory path may limit the workload | identify the pressured memory stage and test fewer transactions or bytes |
| many waves but long barrier stalls | synchronization or imbalance | inspect work per warp and barrier placement |
| too few blocks to fill SMs | grid lacks parallel work | test larger workload or different decomposition |

Evaluate the padded variant using repeated timing and the operational budget, including its added shared storage. If the conflict improves but the timing benefit remains unresolved, record that uncertainty and investigate. The counter diagnoses address mapping; timing determines whether the kernel became faster.

## Deliberately remove the barrier

Performance edits often break synchronization before they break memory bounds. Variant `broken` uses the padded tile but omits `__syncthreads()` between shared writes and shared reads. Some warps read shared memory locations before producer warps finish writing them.

<figure>
  <img src="illustrations/_generated/barrier_happens_before_dark.png" alt="Side-by-side timelines compare block synchronization on shared tile[1,0]. With __syncthreads(), Warp 1 writes 65 from A[1,32], all 256 threads wait at the barrier, and Warp 0 reads 65 and stores it at B[32,1]. Without the barrier, one schedule lets Warp 0 read an unwritten stale value before Warp 1 writes 65, storing corrupted data at B[32,1]." />
  <figcaption>With __syncthreads(), all 256 threads synchronize after Warp 1 writes 65 to tile[1,0], ensuring Warp 0 stores 65 at B[32,1]. Without the barrier, Warp 0 can read stale uninitialized data before Warp 1 writes 65. Compute Sanitizer memcheck verifies bounds, racecheck exposes shared-memory hazards, and synccheck flags invalid barriers; here the harness exits 2 and skips timing.</figcaption>
</figure>

Run a smaller matrix under the tools. Compute Sanitizer documentation recommends running memcheck before racecheck because racecheck doesn't check invalid memory addresses.[^computeSanitizer2026] The harness intentionally exits 2 for `broken`; capture that expected application failure without aborting the diagnostic sequence. Keep the full logs: `--error-exitcode 99` applies to detected sanitizer errors when the application itself would otherwise succeed. Classify a nonzero exit from the full log: tool startup failures, application errors, and detected races all fail the command. Identify the reported shared-memory hazard in the racecheck log.

```bash title="terminal"
for tool in memcheck racecheck synccheck; do
  if compute-sanitizer --tool "$tool" --error-exitcode 99 \
      ./transpose_lab broken 33 1 \
      > "artifacts/run-01/broken-${tool}.txt" 2>&1; then
    echo "unexpected success for known-broken variant" >&2
    exit 1
  else
    status=$?
    echo "${tool} exit=${status}" | tee -a artifacts/run-01/broken-exits.txt
  fi
done
```

Each Compute Sanitizer tool answers a distinct correctness question on the barrier-free kernel. Comparing all three outputs confirms why an unsafe shared-memory schedule can pass an address bounds check yet still violate inter-warp ordering. Expect the diagnostic split below:

- `memcheck` reports no illegal addresses because every index stays within allocation bounds;
- `racecheck` reports shared-memory ordering hazards around the missing barrier, such as RAW or WAR hazards under the instrumented schedule;
- `synccheck` reports no misuse because the kernel omitted a barrier instead of executing an invalid barrier;
- output checker may fail, but an accidental correct output on one run doesn't clear the race.

Scheduler timing can hide a shared-memory data race across ordinary runs because warps happen to complete in producer-before-consumer order under a given load. Dynamic hazard evidence from `racecheck` therefore invalidates a kernel even when sampled outputs match bit-for-bit. Treat every reported RAW or WAR hazard as an ordering bug rather than a harmless profiler quirk.

Recover by restoring the block barrier. Validate every candidate you intend to keep, including a partial tile and a full-tile case. These checks run outside the performance measurement:

```bash title="terminal"
for variant in copy naive tiled padded; do
  for n in 33 1024; do
    for tool in memcheck racecheck synccheck; do
      compute-sanitizer --tool "$tool" --error-exitcode 99 \
        ./transpose_lab "$variant" "$n" 1 \
        > "artifacts/run-01/${variant}-${n}-${tool}.txt" 2>&1
    done
  done
done

./transpose_lab padded 4096 100 \
  | tee artifacts/run-01/recovered-benchmark.csv
```

When a synchronization bug surfaces during optimization, document the fault and its post-repair verification before resuming timing comparisons. Separating detection, repair, and re-benchmarking prevents an unverified speedup from entering the ledger. Record every link between the symptom and the restored ordering rule:

| Field | Minimum content |
|---|---|
| failure | missing block barrier between shared writes and cross-warp reads |
| detection | racecheck hazard plus output result, whether pass or fail |
| repair | restored `__syncthreads()` reached by every thread in block |
| validation | exact transpose, memcheck and racecheck results for the recorded cases |
| performance | same event-timed shape and iteration count after repair |
| build context | GPU, toolkit, source hash, compiler resource output, report paths |

Fill `recovery-template.md` and keep it with the raw reports. A reviewer should be able to trace the failure, repair, tested shapes, and post-recovery cost. Clean dynamic checks cover those executions, not every possible input or schedule.

## Decide between transpose, reduction, and scan

Shared-memory tiling works well for spatial reordering because every thread exchanges coordinates without combining values. When a kernel begins aggregating elements instead, the communication graph shifts from a coordinate swap to tree combines or prefix dependencies. Choose your GPU primitive from the output dependency before measuring optimization changes on a memory-bound workload:

| Primitive | Output rule | Neighbor interaction | Typical use |
|---|---|---|---|
| transpose | preserve every value, change two-dimensional index order | threads exchange tile positions | switch row-major and column-major access orientation |
| reduction | combine many values into fewer values with associative operator | partial aggregates merge | sum loss, maximum error, count mismatches, row sum [^harris2007reduction] |
| scan | emit prefix aggregate for every input position | each output depends on preceding range | prefix offsets, stream compaction positions, cumulative token counts |

Consider moving the correctness check from CPU back to GPU. If you need only total mismatch count and maximum absolute error, use reductions. Both outputs collapse $N^2$ comparisons into scalars. Specify how nonfinite values enter the maximum. Floating-point sums also need a defined accumulation order because addition isn't exactly associative under rounding. A scan would produce per-comparison prefixes the summary doesn't need.

Now consider compacting indexes of mismatched elements. Each failing element needs a destination position based on the number of failures before it. That is a prefix dependency, so a scan computes offsets. A reduction can count total failures but can't assign each failure a unique compacted slot.

<figure>
  <img src="illustrations/_generated/dependency_selects_primitive_dark.png" alt="For mismatch flags [0, 1, 0, 1, 1, 0] at indices [0, 1, 2, 3, 4, 5], a reduction sums flags to scalar count 3. An exclusive scan computes prefix offsets [0, 0, 1, 1, 2, 3] and writes failing indices 1, 3, and 4 into compacted slots [1, 3, 4]. A transpose preserves all six values (a through f) while swapping a 2x3 layout to 3x2." />
  <figcaption>A reduction returns the total mismatch count, whereas an exclusive scan assigns each flagged element its compacted destination slot. A transpose preserves every input element and remaps its two-dimensional coordinates.</figcaption>
</figure>

Examining how each output depends on inputs gives you a fast filter before writing shared-memory boilerplate. Count how many outputs the kernel emits and whether each element depends on preceding positions or only on a fixed coordinate mapping. Apply that decision rule directly:

1. Same number of values, different layout: transpose.
2. Fewer summary values: reduction.
3. Same number of prefix states or compaction offsets: scan.

Tiling can appear inside all three implementations, but the data-dependency graph dictates the core algorithm. Copying a shared-memory transpose tile directly into a reduction or stream-compaction kernel ignores tree fan-in and prefix carries. Let the dependency pattern choose the parallel primitive first, then optimize bank conflicts and memory transactions inside it.

## Report the result you measured

Compare kernel variants only after every candidate runs the exact same matrix shape, launch count, timing loop, and correctness gate. Adding speculative hypotheses without shared validity requirements turns benchmarks into unrelated measurements. Use the ledger below to organize the four core runs and populate the benchmark cells from your target GPU:

| Run | Hypothesis | One code change | Correctness | Profiler evidence | Event timing | Verdict |
|---|---|---|---|---|---|---|
| naive | direct transpose wastes global-store transactions | none | exact | memory-bound, strided store source line | five-run distribution | baseline |
| tiled | shared tile coalesces output stores | add tile and block barrier | exact | global access improves; bank conflict appears | five-run distribution | keep for next iteration or reject |
| padded | extra column changes bank mapping | tile width 32 to 33 | exact plus sanitizer | bank conflict falls; resource use recorded | five-run distribution | keep only with repeat benefit |
| broken | barrier is required for cross-warp tile reuse | remove barrier | unreliable | racecheck hazard | timing invalid | reject and recover |

Summary tables only carry weight when backed by raw logs that can be audited independently. Save the raw timing CSV, `.ncu-rep` profiles, Compute Sanitizer transcripts, compiler `-Xptxas=-v` output, source hash, environment snapshot, and filled recovery template alongside each row. Never mark correctness complete just because a quick printout looked reasonable.

Your performance engineering lab report is complete once every finding rests on controlled artifacts rather than intuition. Before keeping any optimization, verify that you can defend all six claims:

- workload and timing method stayed fixed;
- baseline bound came from profiler evidence;
- each candidate changed one causal mechanism;
- output check matched transpose exactly;
- sanitizer results are clean for the accepted kernels and tested shapes;
- report performance with its conditions and distribution so readers can assess each speedup.

```mastery-quiz
[
  {
    "question": "A new exact-copy test deliberately accepts arbitrary float32 bit patterns, beyond the recorded finite-integer harness. One expected word is 0x7fc00001 and the returned word is 0x7fc00002; both classify as NaNs. Which local verdict and recorded-execution scope follow?",
    "options": [
      "Pass this new case; the original finite-input record also tests its NaN-payload behavior.",
      "Fail this new case; the original finite-input record leaves this NaN-payload behavior untested.",
      "Pass this new case; the original finite-input record leaves this NaN-payload behavior untested.",
      "Fail this new case; the original finite-input record also tests its NaN-payload behavior."
    ],
    "answer": "Fail this new case; the original finite-input record leaves this NaN-payload behavior untested.",
    "explanation": "The returned raw words differ, so they violate the newly specified exact-bit copy rule despite sharing the NaN classification. The original harness generates finite integers and does not exercise these NaN payloads. Bitwise copy verification catches NaN payload rewrites that `isnan` equivalence misses."
  },
  {
    "question": "One full warp reads consecutive float32 words numbered 7 through 38 from a 32-byte-sector-aligned array base. How many sectors are touched, and what is useful payload divided by touched sector volume?",
    "options": [
      "4 sectors; 100%.",
      "5 sectors; 100%.",
      "5 sectors; 80%.",
      "32 sectors; 12.5%."
    ],
    "answer": "5 sectors; 80%.",
    "explanation": "A sector holds 8 float32 words. The first word is in sector 0 and the last in sector 4, so 5 sectors carry 128 useful bytes across 160 sector bytes. This is address-model coverage, not physical device-memory traffic."
  },
  {
    "question": "A kernel transposes a 73×73 row-major matrix into a row-major output. Each 32×8 block covers a 32×32 input tile. For block (bx, by) = (2, 0), how many valid input values does it load, how many threads reach its unconditional barrier, and where does it store A[1, 64]?",
    "options": [
      "288 values, 256 threads, B[64, 1] at linear index 4673.",
      "72 values, 72 threads, B[64, 1] at linear index 4673.",
      "72 values, 256 threads, B[1, 64] at linear index 137.",
      "288 values, 72 threads, B[1, 64] at linear index 137."
    ],
    "answer": "288 values, 256 threads, B[64, 1] at linear index 4673.",
    "explanation": "The tile starts at column 64. Columns 64 through 72 fit in all 32 rows, so the block loads 9 × 32 = 288 values. Counting 9 × 8 = 72 gives the threads that load data. Each loads four values, and all 32 × 8 = 256 threads reach the barrier. Index 137 keeps the input coordinates. The transpose swaps them, putting the value at B[64, 1], index 64 × 73 + 1 = 4673."
  },
  {
    "question": "A 32×32 shared tile has a padded row stride of 36 four-byte words. Each of the 32 lanes in a warp reads column 0 of its own row. With bank = word index mod 32, which bank mapping and tile size follow?",
    "options": [
      "16 banks with 2 distinct words each, 4608 bytes per tile.",
      "16 banks with 2 distinct words each, 4096 bytes per tile.",
      "8 banks with 4 distinct words each, 4096 bytes per tile.",
      "8 banks with 4 distinct words each, 4608 bytes per tile."
    ],
    "answer": "8 banks with 4 distinct words each, 4608 bytes per tile.",
    "explanation": "Since 36 mod 32 is 4, the lanes visit banks 0, 4, 8, …, 28 before returning to bank 0. Across 32 rows, each of those eight banks serves four different words. A 34-word stride would advance by two banks and visit 16 banks twice. The full tile occupies 32 × 36 × 4 = 4608 bytes. Counting only the 32 data words in each row gives 4096 bytes and leaves out the padding."
  },
  {
    "question": "A simplified SM has 65,536 registers, 64 KiB shared storage and a 64-warp ceiling. A 256-thread block uses 48 registers/thread and 4224 shared bytes. Ignore rounding and every other limit. What capacity follows?",
    "options": [
      "5 blocks; 40 warps; 62.5% of the configured warp ceiling.",
      "6 blocks; 48 warps; 75% of the configured warp ceiling.",
      "8 blocks; 64 warps; 100% of the configured warp ceiling.",
      "5 blocks; 5 warps; 7.8125% of the configured warp ceiling."
    ],
    "answer": "5 blocks; 40 warps; 62.5% of the configured warp ceiling.",
    "explanation": "Register demand is 256×48=12,288 per block, so 65,536 fits 5 blocks. Shared storage fits 15 and the warp ceiling fits 8. The minimum is 5 blocks×8 warps=40, or 62.5%. These simplified resource limits do not measure achieved occupancy or speed."
  },
  {
    "question": "Two CUDA events bracket 40 launches of a 2048×2048 float32 transpose. The interval lasts 4.00 ms and excludes allocation and transfers. Which statement about the combined read and write rate do these data support?",
    "options": [
      "The batch averaged 167.8 GB/s of logical matrix traffic.",
      "The batch averaged 335.5 GB/s of physical DRAM traffic.",
      "The batch averaged 335.5 GB/s of logical matrix traffic.",
      "The batch averaged 167.8 GB/s of physical DRAM traffic."
    ],
    "answer": "The batch averaged 335.5 GB/s of logical matrix traffic.",
    "explanation": "Each launch reads and writes one four-byte word per element, for 2 × 2048² × 4 = 33,554,432 logical bytes. The mean interval is 4.00 ms / 40 = 0.000100 seconds per launch. Dividing bytes by seconds gives 335,544,320,000 bytes/s, or 335.5 decimal GB/s. Counting only the reads gives 167.8 GB/s. A physical DRAM rate needs traffic counters, and a per-call 95th percentile needs individual launch times."
  },
  {
    "question": "A different shared-scratch GPU kernel reuses a slot across two warps. Its outputs match in 64 ordinary tests, memcheck finds no invalid addresses, racecheck reports a write-after-read hazard, and synccheck reports no invalid barrier use. What follows?",
    "options": [
      "Accept its ordering; 64 matching outputs outweigh an instrumented schedule.",
      "Accept its ordering; valid addresses and valid barriers guarantee the ordering.",
      "Reject its ordering; every racecheck hazard must also be an illegal address.",
      "Reject its ordering; repair the missing dependency and repeat the relevant checks."
    ],
    "answer": "Reject its ordering; repair the missing dependency and repeat the relevant checks.",
    "explanation": "A valid address can still be reused before the previous reader finishes. Sampled output equality and no invalid barrier use do not guarantee the required ordering. Repair the shared dependency, then verify outputs and memory/race/synchronization behavior on the exercised cases."
  },
  {
    "question": "A new unroll candidate has clean recorded validity checks. Three unprofiled batch averages are [0.19, 0.25, 0.20] ms; the fixed baseline has [0.20, 0.21, 0.22] ms. Generated assembly is unchanged. Which report is justified?",
    "options": [
      "Record an unroll overlap benefit; the lower median supports the new instruction schedule.",
      "Record an unresolved timing benefit; overlapping samples do not confirm the claimed mechanism.",
      "Record a general timing regression; the candidate’s worst row outweighs its lower median.",
      "Record a capacity improvement; the lower median provides the missing register evidence."
    ],
    "answer": "Record an unresolved timing benefit; overlapping samples do not confirm the claimed mechanism.",
    "explanation": "Candidate and baseline medians are 0.20 and 0.21 ms, but these few samples overlap. Identical target instructions provide no evidence of a newly exposed unroll schedule. Preserve raw variation and investigate controlled causes instead of assigning a mechanism to the fastest row."
  },
  {
    "question": "Source indices 0 through 5 have mismatch flags [1, 0, 1, 0, 0, 1]. A 1 marks a failure. What are the exclusive scan offsets, the failing source indices in stable order, and the total number of failures?",
    "options": [
      "Offsets [1, 1, 2, 2, 2, 3], indices [0, 2, 5], total 3.",
      "Offsets [0, 1, 1, 2, 2, 2], indices [0, 2, 5], total 3.",
      "Offsets [0, 1, 1, 2, 2, 2], indices [0, 2], total 2.",
      "Offsets [1, 1, 2, 2, 2, 3], indices [0, 2], total 2."
    ],
    "answer": "Offsets [0, 1, 1, 2, 2, 2], indices [0, 2, 5], total 3.",
    "explanation": "Record the running count before adding each flag to get [0, 1, 1, 2, 2, 2]. Adding first gives the inclusive offsets [1, 1, 2, 2, 2, 3]. The set flags at source indices 0, 2, and 5 place those indices in output slots 0, 1, and 2. The last exclusive offset counts two earlier failures. Stopping the list at [0, 2] misses the final set flag, which brings the total to three."
  },
  {
    "question": "A team times the transpose at N=1024, then imports a successful Nsight report whose recorded kernel is copy at N=4096. The report shows high memory throughput. What isolates a measured limiter for the timed transpose?",
    "options": [
      "Profile the matching copy source and larger shape; compare its counters with the transpose.",
      "Use the existing transpose event samples; compare their logical rate with its hardware peak.",
      "Profile the matching transpose source and selected launch; inspect the relevant stage counters.",
      "Use the existing larger-shape report; compare its memory throughput with the smaller transpose."
    ],
    "answer": "Profile the matching transpose source and selected launch; inspect the relevant stage counters.",
    "explanation": "Kernel identity, source, shape and launch selection must match the workload being explained. Copy performs another operation, and a timer alone does not identify a memory stage. A matching, unrestricted profile on the transpose kernel remains necessary before naming the measured limiter."
  }
]
```

> **Next:** Continue to [GPU Parallel Primitives Lab](/learn/gpu-parallel-primitives-lab). A transpose only reorders values. A reduction or a scan has to combine them, and the same indexing and barrier rules decide whether that combination races.
