---
{
  "id": "gemm-naive-cuda-tensor-cores",
  "title": "GEMM From Naive CUDA to Tensor Cores",
  "slug": "gemm-naive-cuda-tensor-cores",
  "section": "GPU Systems & LLM Inference",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 17,
  "companies": [
    "NVIDIA",
    "OpenAI",
    "Meta",
    "Google",
    "Amazon"
  ],
  "shortDescription": "The same output can be numerically right and still come from the wrong addresses. Follow one product from a scalar thread to a Tensor Core tile.",
  "keyConceptsTested": [
    "GEMM shapes and row-major layouts",
    "Warp-coalesced global-memory access",
    "Arithmetic intensity and tile reuse",
    "Shared-memory tiling and barrier synchronization",
    "Shared-memory bank conflicts and XOR swizzling",
    "Register-blocked 2D tile accumulation",
    "WMMA Tensor Core fragments",
    "Edge-tile padding and predicates",
    "Mixed-precision rounding and FP32 accumulation",
    "Hardware roofline ceilings and compute knees",
    "CUDA event timing and benchmark records",
    "Ampere asynchronous copy and Hopper TMA paths"
  ],
  "prerequisites": [
    "gpu-compilers-kernel-languages",
    "gpu-kernel-performance-engineering-lab"
  ],
  "relatedQuestions": [
    "low-precision-gpu-programming",
    "deep-dive-deepgemm",
    "flashattention-memory-efficient-attention",
    "model-quantization-gptq-awq-gguf"
  ]
}
---

Which thread should own output $C_{1,0}$? One scalar thread can compute it, four neighboring outputs can share one thread's registers, or a 32-lane warp can feed a whole $16 \times 16$ tile to Tensor Cores. The math $C = AB$ never changes, yet global memory sectors, on-chip reuse, and rounding behavior shift dramatically at every rung of the ladder.

We build row-major <span data-glossary="matrix">matrix</span> multiplication ($A_{[M,K]} B_{[K,N]} \to C_{[M,N]}$, the $\alpha=1, \beta=0$ GEMM case with $2MNK$ FLOPs) across five stages in [gemm_lab.cu](assets/gemm_lab.cu): **strided scalar -> coalesced scalar -> shared-memory tiled -> 2D register-blocked -> WMMA Tensor Cores**, then examine how Ampere `cp.async`, Hopper TMA/WGMMA, and Blackwell `tcgen05` pipeline data movement ahead of math.

<figure>
  <img src="illustrations/_generated/hand_product_ownership_dark.png" alt="A 2 by 3 matrix A highlights row 1, negative 1, 3, 2. A 3 by 2 matrix B highlights column 0, 2, 1, 3. The three aligned products sum to 7, shown in a solid green C row 1 column 0 cell." />
  <figcaption>Row-major GEMM pairs row $i$ of $A$ with column $j$ of $B$ across $K$ steps ($2MNK$ FLOPs total). For a square FP32 matrix of size $n$, ideal unique-byte intensity is $n/6$ FLOP/B (682.7 FLOP/B at $n=4096$), whereas naive scalar code demands only $2 / 8 = 0.25$ FLOP/B per thread.</figcaption>
</figure>

## Stage 1: Scalar strided vs. coalesced warps

Assign one thread to each output $C_{r,c} = \sum_{k=0}^{K-1} A_{r,k} B_{k,c}$. CUDA linearizes `threadIdx.x` first across warp lanes `0..31`. Mapping `row = blockIdx.x * blockDim.x + threadIdx.x` makes adjacent lanes step down rows of $A$ and $C$ with stride $K$ and $N$. Simply swapping `threadIdx.x` to own `col` transforms memory coalescing without altering a single FLOP:[^cudaBestPractices2026]

```cpp title="gemm_scalar_coalesced.cu"
__global__ void gemm_scalar_coalesced(const float* A, const float* B, float* C,
                                      int M, int N, int K) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    if (row >= M || col >= N) return;

    float acc = 0.0f;
    for (int k = 0; k < K; ++k) acc += A[row * K + k] * B[k * N + col];
    C[row * N + col] = acc;
}
```

At $M=32, N=K=64$, swapping from a `16x16` strided block to a `32x8` coalesced block cuts warp-0's requested 32-byte sectors across `k=0` loads and the final `C` store from **33 sectors** (16 A, 1 B, 16 C) down to **9 sectors** (1 broadcast A, 4 contiguous B, 4 contiguous C), a **3.67x** reduction.

<figure>
  <img src="illustrations/_generated/warp_address_sectors_dark.png" alt="Comparison of aligned FP32 warp sector requests for 16 by 16 strided and 32 by 8 coalesced blocks. Two spatial grids highlight warp 0 coverage across the output matrix, a byte-offset table traces lanes L0, L1, L8, L16, and L31 across A, B, and C, and stacked bars total 33 sectors for strided (16 A, 1 B, 16 C) versus 9 sectors for coalesced (1 A, 4 B, 4 C), 3.67x fewer sectors." />
  <figcaption>Assigning `threadIdx.x` to `col` lets all 32 warp lanes broadcast one element of $A$ (1 sector) and coalesce 32 adjacent columns of $B$ and $C$ (4 sectors each), cutting 33 sectors to 9.</figcaption>
</figure>

## Stage 2: Shared-memory tiling and bank analysis

Coalescing merges warp requests, yet every thread still reloads $A$ and $B$ from global/L2 memory on every step. Staging a $16 \times 16$ panel of $A$ and $B$ in `__shared__` memory reuses each loaded float 16 times across the block, raising panel operand intensity 16x from `0.25` to **`4.0 FLOP/B`** ($8{,}192\text{ FLOPs} / 2{,}048\text{ B}$):

```cpp title="gemm_shared.cu"
constexpr int TILE = 16;

__global__ void gemm_shared(const float* A, const float* B, float* C, int M, int N, int K) {
    __shared__ float As[TILE][TILE], Bs[TILE][TILE];
    int row = blockIdx.y * TILE + threadIdx.y, col = blockIdx.x * TILE + threadIdx.x;
    float acc = 0.0f;

    for (int k0 = 0; k0 < K; k0 += TILE) {
        int ak = k0 + threadIdx.x, bk = k0 + threadIdx.y;
        As[threadIdx.y][threadIdx.x] = (row < M && ak < K) ? A[row * K + ak] : 0.0f;
        Bs[threadIdx.y][threadIdx.x] = (bk < K && col < N) ? B[bk * N + col] : 0.0f;
        __syncthreads();  // RAW barrier: all loads visible before reads.
#pragma unroll
        for (int k = 0; k < TILE; ++k) acc += As[threadIdx.y][k] * Bs[k][threadIdx.x];
        __syncthreads();  // WAR barrier: all reads done before next panel overwrites.
    }
    if (row < M && col < N) C[row * N + col] = acc;
}
```

<figure>
  <img src="illustrations/_generated/shared_tile_reuse_dark.png" alt="Three 16 by 16 tile diagrams show shared-memory panels in A and B feeding an output tile in C, where one loaded value from A serves a full row of 16 outputs and one value from B serves a full column, delivering 8,192 FLOPs from 2,048 operand bytes (4 FLOP per byte). Below, a four-stage loop flow connects guarded global-to-shared loads, a read-after-write barrier, tile multiply-accumulate, and a write-after-read barrier, alongside an edge-thread rule showing zero-fill and skipped stores." />
  <figcaption>Cooperative $16\times 16$ staging delivers 8,192 FLOPs from 2,048 operand bytes (4.0 FLOP/B). Out-of-range edge threads must still load valid partner entries, zero-fill invalid entries, and hit both barriers before skipping their final `C` store.</figcaption>
</figure>

### Check shared-memory bank conflicts before swizzling

NVIDIA shared memory maps 4-byte words across 32 banks via $\text{bank} = (\text{byte\_addr}/4) \bmod 32$.[^cudaBestPractices2026] In `gemm_shared`'s $16 \times 16$ block, a 32-lane warp spans two rows: lanes `0..15` broadcast `As[0][k]`, lanes `16..31` broadcast `As[1][k]`, and `Bs[k][tx]` hits 16 distinct banks conflict-free! A 32-way conflict arises only when 32 lanes read distinct rows down a stride-32 column (`32*lane + k`), which padding to `[32][33]` or XOR swizzling (`col ^ row`) resolves to 1 service group (note that `col ^ row` permutes vector order on row 1 to `[1, 0, 3, 2]`, so producers and vectorized consumers must agree on the swizzle):

<!-- leetllm: test, output=show, id=gpu-gemm-bank-addresses -->
```python title="broadcast_or_conflict.py"
def service_groups(words):
    banks = {}
    for w in words:
        banks.setdefault(w % 32, set()).add(w)
    return max(len(v) for v in banks.values())

k = 3
shown_a = [(lane // 16) * 16 + k for lane in range(32)]
shown_b = [k * 16 + lane % 16 for lane in range(32)]
col_32 = [32 * lane + k for lane in range(32)]
pad_33 = [33 * lane + k for lane in range(32)]
xor_full = [32 * row + (k ^ row) for row in range(32)]
print("service groups (shown A, B, stride-32, pad-33, XOR):",
      [service_groups(x) for x in (shown_a, shown_b, col_32, pad_33, xor_full)])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
service groups (shown A, B, stride-32, pad-33, XOR): [1, 1, 32, 1, 1]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/bank_broadcast_layout_dark.png" alt="Shared-memory bank layout analysis at k equals 3. A 16 by 16 block panel shows lanes 0 to 15 broadcasting A word 3 and lanes 16 to 31 broadcasting word 19 while B requests 16 distinct words conflict-free. Next to it, a stride-32 grid illustrates all 32 lanes hitting bank 3, a bank-mapping table contrasts stride 32, padded stride 33, and XOR layouts (noting physical column order 1, 0, 3, 2 on row 1), and a four-bar chart shows service groups dropping from 32 (stride 32) and 4 (grouped XOR) to 1 (stride 33 padding and full-row XOR)." />
  <figcaption>The $16\times 16$ block broadcasts `A` and reads `B` conflict-free. Stride-32 column reads serialize 32-way; stride-33 padding or full-row XOR eliminates the conflict.</figcaption>
</figure>

## Stage 3: Register blocking (2D thread tiles)

In `gemm_shared`, each thread still issues two shared loads (8 B) per FMA (2 FLOPs = `0.25 FLOP/B` at the shared-memory interface). **Register blocking** gives each thread an $R_M \times R_N$ output sub-tile in registers. Computing $1 \times 4$ outputs per thread lets one loaded `As[ty][k]` feed four FMAs (`0.40 FLOP/B` per thread, `6.4 FLOP/B` per $16 \times 64$ block panel); an $8 \times 8$ register tile loads 16 floats (64 B) for 64 FMAs (128 FLOPs = **`2.0 FLOP/B`**, an 8x shared-load reduction):

```cpp title="gemm_register_blocked.cu"
float acc[4] = {0.0f, 0.0f, 0.0f, 0.0f};
#pragma unroll
for (int k = 0; k < TILE; ++k) {
    float a = As[threadIdx.y][k];
#pragma unroll
    for (int j = 0; j < 4; ++j) acc[j] += a * Bs[k][threadIdx.x + j * TILE];
}
```

<figure>
  <img src="illustrations/_generated/register_output_tile_dark.png" alt="Four 16 by 16 sub-tiles forming a 16 by 64 output block highlight columns +0, +16, +32, and +48 owned by thread tx equals 1, ty equals 2 along row 2. A per-k reuse diagram shows one shared A value pairing with those four B values into four FMA accumulators (8 FLOPs per 20 bytes), while a three-bar chart compares per-thread operand intensity across 1 by 1 (0.25 FLOP/B), 1 by 4 (0.40 FLOP/B), and 8 by 8 (2.0 FLOP/B) register tiles." />
  <figcaption>Giving each thread four horizontal outputs reuses each `As` load across four FMAs (0.40 FLOP/B); an $8\times 8$ register tile lifts per-thread SMEM intensity to 2.0 FLOP/B at the cost of higher register pressure.</figcaption>
</figure>

Higher register counts can lower occupancy, yet pipelined CUTLASS GEMMs routinely trade occupancy for larger register tiles and deeper latency hiding.[^nvidia2026cutlassEfficientGemm]

## Stage 4: Tensor Cores (WMMA) and mixed-precision rounding

Instead of scalar FMAs, Tensor Cores execute warp-collective matrix multiply-accumulates $D = AB + C$. Using CUDA's WMMA API for FP16 inputs and FP32 accumulation, all 32 warp lanes cooperate on one $16 \times 16 \times 16$ tile per `mma_sync`:[^nvidia2017wmma][^cudaCppIntrinsics2026]

```cpp title="gemm_wmma_aligned.cu"
__global__ void gemm_wmma_aligned(const half* A, const half* B, float* C, int M, int N, int K) {
#if defined(__CUDA_ARCH__) && __CUDA_ARCH__ < 700
    asm("trap;");
#else
    using namespace nvcuda;
    int row = blockIdx.y * 16, col = blockIdx.x * 16;
    wmma::fragment<wmma::accumulator, 16, 16, 16, float> c_frag;
    wmma::fill_fragment(c_frag, 0.0f);
    for (int k0 = 0; k0 < K; k0 += 16) {
        wmma::fragment<wmma::matrix_a, 16, 16, 16, half, wmma::row_major> a_frag;
        wmma::fragment<wmma::matrix_b, 16, 16, 16, half, wmma::row_major> b_frag;
        wmma::load_matrix_sync(a_frag, A + row * K + k0, K);
        wmma::load_matrix_sync(b_frag, B + k0 * N + col, N);
        wmma::mma_sync(c_frag, a_frag, b_frag, c_frag);
    }
    wmma::store_matrix_sync(C + row * N + col, c_frag, N, wmma::mem_row_major);
#endif
}
```

Respect three strict WMMA rules: (1) all 32 warp lanes must participate unconditionally, (2) base pointers need 32-byte alignment and leading dimensions must be multiples of 8 (FP16) or 4 (FP32), and (3) `load_matrix_sync`/`store_matrix_sync` have no element masks, so pad ragged shapes to multiples of 16 (or stage guarded shared tiles) and remember that fragment tags (`row_major` vs. `col_major`) declare layout rather than transposing bytes.

<figure>
  <img src="illustrations/_generated/gemm_tile_pipeline_dark.png" alt="Three tiled matrices show padded 16 by 16 grid extents for M=73, N=61, and K=67: A padded to 80 by 80, B padded to 80 by 64, and C cropped back to 73 by 61. Corner-tile badges isolate the final partial block where 9 by 3 real entries in A and 3 by 13 real entries in B update the retained 9 by 13 corner in C, while a bar chart compares 596.7k logical FLOPs against 819.2k executed FLOPs (+37.3% padding overhead)." />
  <figcaption>Padding $73\times 61\times 67$ to $80\times 64\times 80$ inflates executed work by 37.3%; always report useful TFLOP/s using logical $2MNK$ separately from padded work.</figcaption>
</figure>

### Two-reference precision testing

Above `1,024`, adjacent IEEE FP16 numbers sit `1.0` apart ($\epsilon_{\text{FP16}} = 2^{-10}$), so FP16 accumulation drops `1024.0 + 0.25 -> 1024.0` while FP32 accumulation preserves `1024.25`.[^nvidiaPtxIsa2026][^python2026struct] Yet FP32 accumulation can never recover precision already lost when FP32 inputs cast to FP16. Always test mixed-precision kernels against **two references**: Reference 1 (cast inputs to FP16, then FP64 dot product) isolates kernel math bugs, while Reference 2 (original FP32 inputs in FP64) measures input quantization loss.

<!-- leetllm: test, deps=numpy, output=show, id=gpu-gemm-rounding -->
```python title="two_references_after_cancellation.py"
import numpy as np

assert float(np.float16(1024.0 + 0.25)) == 1024.0
assert float(np.float32(1024.0 + 0.25)) == 1024.25

a = np.array([1.0001, 1.0], dtype=np.float32)
b = np.array([1.0, -1.0], dtype=np.float32)
aq = a.astype(np.float16)  # Rounds [1.0001, 1.0] -> [1.0, 1.0]
orig_ref = float(a.astype(np.float64) @ b.astype(np.float64))
rounded_ref = float(aq.astype(np.float64) @ b.astype(np.float64))
cand = float(aq.astype(np.float32) @ b.astype(np.float32))
print(f"Ref1 (rounded inputs)={rounded_ref:.8f}, arithmetic err={abs(cand - rounded_ref):.8f}")
print(f"Ref2 (original FP32) ={orig_ref:.8f}, relative err={abs(cand - orig_ref) / abs(orig_ref):.0%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Ref1 (rounded inputs)=0.00000000, arithmetic err=0.00000000
Ref2 (original FP32) =0.00010002, relative err=100%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/rounding_two_references_dark.png" alt="FP16 spacing around 1,024 and two-reference error separation. A number line from 1023.0 to 1025.0 marks a -0.375 subtraction rounding to 1023.5 and a +0.25 addition rounding back to 1024 across an FP16 gap of 1.0 (compared with FP32 spacing near 1.2e-4). Below left, cancellation for A=[1.0001,1], B=[1,-1] flows from Orig FP64 (0.00010002) versus FP16 [1,1] (cand = 0.0), noting FP32 acc cannot undo FP16 loss. Below right, a Lab Validation Rules table contrasts Ref 1 (5e-3, 2e-3 FP32), Ref 2 (Orig FP64 loss), and Cancel (0 R1, 100% R2)." />
  <figcaption>Separating Reference 1 (rounded FP16 inputs) from Reference 2 (original FP32 inputs) prevents blaming a bug-free Tensor Core kernel for input-quantization cancellation.</figcaption>
</figure>

## Roofline knees and CPU index verification

For an output tile $B_M \times B_N$ with $s$-byte inputs, panel-load intensity is $2 B_M B_N / [s(B_M + B_N)]$, climbing from `0.25` (scalar) to `4.0` (shared $16\times 16$), `6.4` (register $16\times 64$), `8.0` (WMMA FP16 $16\times 16$), and `85.3 FLOP/B` ($128\times 256$ FP16 block tile). Compare those against **A100 80GB SXM** HBM roofline knees (2,039 GB/s HBM2e, 19.5 TFLOP/s FP32, 312 TFLOP/s dense FP16): $\text{Knee}_{\text{FP32}} \approx 9.56\text{ FLOP/B}$ and $\text{Knee}_{\text{TC}} \approx 153.0\text{ FLOP/B}$.[^williams2009][^nvidia2026a100Specs]

<figure>
  <img src="illustrations/_generated/boundary_roofline_dark.png" alt="A log-log A100 80GB SXM HBM roofline plot and a four-bar panel-load chart. The log-log roofline draws an HBM bandwidth slope of 2,039 GB/s meeting an FP32 compute ceiling of 19.5 TFLOP/s at the 9.56 FLOP/B knee and a dense FP16 ceiling of 312 TFLOP/s at the 153.0 FLOP/B knee, with no observed kernel points plotted. Beside it, the Panel-Load Ratios chart lists Scl 0.25, Sm 4.0, Reg 6.4, and TC 8.0 FLOP/B, noting these are not measured HBM bytes." />
  <figcaption>A100 80GB SXM HBM roofline knees (9.56 FLOP/B for FP32, 153.0 FLOP/B for dense FP16) beside nominal panel-load ratios; measure actual DRAM traffic in Nsight Compute to locate L2 reuse.</figcaption>
</figure>

Run [gemm_index_check.py](assets/gemm_index_check.py) on CPU to verify all five stages' index maps and padding/crop geometry before compiling `assets/gemm_lab.cu` on GPU (with `compute-sanitizer` and `ncu` as covered in the [profiling lab](/learn/gpu-kernel-performance-engineering-lab)):[^cuda130ReleaseNotes][^nsightCompute2026]

<!-- leetllm: test, output=show -->
```python title="gemm-index-check.py"
import runpy

runpy.run_path("assets/gemm_index_check.py", run_name="__main__")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
PASS 6 shapes: scalar ownership, shared/register indices, padding/crop
first-warp sectors (A, B, C): strided=(16, 1, 16), coalesced=(1, 4, 4)
CPU integer shapes only; no CUDA, floating-point, barrier, or speed validation.
```
<!-- leetllm: output:end -->

## Stage 5: Asynchronous pipelines (`cp.async`, TMA, WGMMA, and Blackwell `tcgen05`)

Synchronous kernels stall compute while fetching the next $K$-panel. Double-buffered async main loops overlap loading tile $t+1$ into slot $(t+1)\bmod 2$ while Tensor Cores compute tile $t$ from slot $t\bmod 2$: copy completion makes a slot readable, and **consumer completion** (not MMA issue) makes it safe to overwrite.

<figure>
  <img src="illustrations/_generated/async_stage_ownership_dark.png" alt="Six-stage async tile ownership lifecycle, double-buffer slot timeline, and hardware async tiers table. Two horizontal flow rows trace steps 1 to 6: claim slot, G -> S copy, phase ready, MMA / WMMA, reads done, and slot free. Below left, a Double-Buffer Slots grid contrasts Interval A (Slot 0 MMA tile t, Slot 1 copy t+1) with Interval B (Slot 0 copy t+2, Slot 1 MMA tile t+1) separated by guard barriers. Below right, a Hardware Async Tiers table compares Pre-Amp, Ampere (cp.async), Hopper (TMA and WGMMA), and Blackwl (tcgen05 and Tensor Memory)." />
  <figcaption>Async tile ownership enforces six phases across double-buffered slots, scaling from Pre-Ampere register staging through Ampere `cp.async`, Hopper TMA + WGMMA, and Blackwell `tcgen05` + TMEM.</figcaption>
</figure>

| Generation | Data movement | Matrix engine | Key architectural shift |
|---|---|---|---|
| **Pre-Ampere** | GMEM $\to$ Regs $\to$ SMEM | Volta/Turing WMMA | Synchronous loads burn registers and stall on `__syncthreads()` |
| **Ampere (CC 8.0)** | `cp.async` (`LDGSTS`) GMEM $\to$ SMEM | `mma.sync` + `ldmatrix` | Bypasses registers; multistage async pipelines |
| **Hopper (CC 9.0)**[^nvidia2026hopperTuning] | **TMA** descriptor-based 2D/5D async copy | **WGMMA** (128-thread warpgroup) | Single-thread TMA issue with bounds fill + warp specialization |
| **Blackwell (CC 10.0)**[^nvidiaPtxTcgen2026] | TMA + 2-CTA multicast | **`tcgen05`** + dedicated **TMEM** | Accumulators move out of registers into Tensor Memory |

In production, benchmark against **cuBLAS** or **CUTLASS/CuTe** (`cutlass_profiler`) before maintaining a custom GEMM, matching precision, layout, and shapes.[^cutlassDocs2026]

| Failure signature | Likely cause | First fix |
|---|---|---|
| Wrong bottom/right edge values | Missing bounds guard or output crop | Test $31\times 29\times 37$; zero-fill input tails |
| Shared kernel hangs on odd shapes | Conditional `__syncthreads()` | Keep cooperative loads & barriers outside output guards |
| Transposed output | Layout tag disagrees with memory strides | Match `row_major`/`col_major` tags to physical layout |
| WMMA illegal access | Unaligned pointer/stride or unpadded tail | Enforce 32B alignment and multiples of 16 |
| Async copy matches sync speed | Alignment fallback or missing overlap | Check SASS for `LDGSTS`/TMA and inspect stall counters |

```mastery-quiz
[
  {
    "question": "A block has 16 threads in x and 2 in y. At fixed k, each thread loads FP32 B[k, 1 + threadIdx.x] where column 0 is 32-byte aligned. Which column does lane 1 read, and how many 32-byte sectors does the warp request?",
    "options": [
      "Column 1 and 2 sectors.",
      "Column 2 and 2 sectors.",
      "Column 1 and 3 sectors.",
      "Column 2 and 3 sectors."
    ],
    "answer": "Column 2 and 3 sectors.",
    "explanation": "x varies first so lane 1 (x=1) reads column 2. Columns 1..16 occupy bytes 4..67, spanning 3 distinct 32-byte sectors (bytes 0..31, 32..63, and 64..95)."
  },
  {
    "question": "One thread computes a 2x6 register tile, loading 2 FP32 values from A and 6 from B per k step. What is its per-thread operand intensity?",
    "options": [
      "0.25 FLOP/B",
      "0.75 FLOP/B",
      "1.50 FLOP/B",
      "0.375 FLOP/B"
    ],
    "answer": "0.75 FLOP/B",
    "explanation": "12 outputs perform 24 FLOPs from 8 four-byte floats (32 bytes), giving 24/32 = 0.75 FLOP/B."
  },
  {
    "question": "In row 6 of a shared tile, logical column c sits at physical column `c XOR 6`. Reading physical columns 0..3 returns `[9, 4, 7, 1]`. Which vector gives logical columns 4..7 in order?",
    "options": [
      "[9, 4, 7, 1]",
      "[7, 1, 9, 4]",
      "[1, 7, 4, 9]",
      "[4, 9, 1, 7]"
    ],
    "answer": "[7, 1, 9, 4]",
    "explanation": "4^6=2 (7), 5^6=3 (1), 6^6=0 (9), 7^6=1 (4), yielding [7, 1, 9, 4]."
  },
  {
    "question": "A mixed-precision GEMM casts inputs to FP16 (spacing 0.5 near 640) and accumulates in FP32. Adding `float16(640.375) * 1` and `0.0625` yields which FP32 sum?",
    "options": [
      "640.4375",
      "640.5",
      "640.5625",
      "640.0625"
    ],
    "answer": "640.5625",
    "explanation": "Input 640.375 rounds to 640.5 in FP16 before MMA; FP32 accumulation then adds 0.0625 exactly to give 640.5625."
  },
  {
    "question": "In a 16x16 tiled GEMM with M=18, N=8, K=32, the thread for out-of-bounds C[19, 2] also maps to in-bounds B[3, 2]. How must it handle panel loads and barriers?",
    "options": [
      "Zero-fill both A and B; hit both barriers.",
      "Zero-fill A, load B; hit only the post-load barrier.",
      "Zero-fill both A and B; hit only the post-load barrier.",
      "Zero-fill A, load B; hit both load and compute barriers."
    ],
    "answer": "Zero-fill A, load B; hit both load and compute barriers.",
    "explanation": "In-bounds rows need B[3, 2], and both RAW and WAR `__syncthreads()` barriers require full-block participation before skipping the final out-of-range C store."
  },
  {
    "question": "Two warp groups consume shared slot P: copy finishes at step 2, Group 1 runs async MMA steps 3..9, Group 2 runs steps 5..7, and slot Q finishes copying at step 11. When can a new copy overwrite P?",
    "options": [
      "Step 5",
      "Step 11",
      "Step 2",
      "Step 9"
    ],
    "answer": "Step 9",
    "explanation": "Slot P becomes free only after all consumers finish reading it (max(9, 7) = step 9), independent of slot Q."
  }
]
```

> **Next:** Continue to [Low-Precision GPU Programming](/learn/low-precision-gpu-programming).
