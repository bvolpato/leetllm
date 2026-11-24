---
{
  "id": "gemm-naive-cuda-tensor-cores",
  "title": "GEMM From Naive CUDA to Tensor Cores",
  "slug": "gemm-naive-cuda-tensor-cores",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 14,
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
    "gpu-kernel-performance-engineering-lab",
    "gpu-profiling-correctness-benchmarking"
  ],
  "relatedQuestions": [
    "low-precision-gpu-programming",
    "deep-dive-deepgemm",
    "flashattention-memory-efficient-attention",
    "model-quantization-gptq-awq-gguf"
  ]
}
---

Which thread should own $C_{1,0}$? One thread can compute it, four neighboring answers can share one thread's accumulators, or a warp can cooperate on a whole tile. Although the mathematical result stays the same, the memory requests, data reuse, and precision rules change with every mapping, so trace the exact addresses and values before accepting any speed claim measured on the device.

Three principles from earlier lessons still govern our work. The [GPU compiler lesson](/learn/gpu-compilers-kernel-languages) separated source language, generated code, and target architecture. The [kernel engineering lab](/learn/gpu-kernel-performance-engineering-lab) turned memory access, occupancy, and synchronization into measurements, while the [profiling lesson](/learn/gpu-profiling-correctness-benchmarking) required verifying numerical correctness before optimizing latency.

We build one operation, $C = AB$, through five successive kernel stages. This is the $\alpha=1$, $\beta=0$ case of general matrix-matrix multiplication (GEMM), $C \leftarrow \alpha AB + \beta C$, so the kernel skips reading the old output buffer. <span data-glossary="matrix">Matrix</span> $A$ has shape $[M,K]$, $B$ has shape $[K,N]$, and $C$ has shape $[M,N]$, with all lab buffers stored in row-major order so neighboring columns occupy neighboring memory addresses.

The complete CUDA source is [available as `gemm_lab.cu`](assets/gemm_lab.cu), written for clarity rather than peak cuBLAS throughput so every memory mapping and barrier stays visible. The Python index and rounding checks run anywhere on CPU; compiling and profiling the CUDA kernels requires a CUDA-capable GPU. You do not need any GPU for the first question: what is $C_{1,0}$?

## Compute one output before launching a warp

Start with matrices small enough to multiply on paper:

$$
A = \begin{bmatrix}1 & 2 & 0 \\ -1 & 3 & 2\end{bmatrix}, \qquad
B = \begin{bmatrix}2 & -1 \\ 1 & 4 \\ 3 & 0\end{bmatrix}
$$

$A$ is $2 \times 3$ and $B$ is $3 \times 2$, so $C$ must be $2 \times 2$. Entry $C_{1,0}$ takes row 1 of $A$ and column 0 of $B$:

$$
C_{1,0} = (-1)(2) + (3)(1) + (2)(3) = -2 + 3 + 6 = 7
$$

Applying the same <span data-glossary="dot-product">dot product</span> to each output gives:

$$
C = \begin{bmatrix}4 & 7 \\ 7 & 13\end{bmatrix}
$$

<figure>
  <img src="illustrations/_generated/hand_product_ownership_dark.png" alt="A 2 by 3 matrix A highlights row 1, negative 1, 3, 2. A 3 by 2 matrix B highlights column 0, 2, 1, 3. The three aligned products sum to 7, shown in a solid green C row 1 column 0 cell." />
  <figcaption>Match the selected row and column by k: (−1 × 2) + (3 × 1) + (2 × 3) = 7, so the highlighted C₁,₀ equals 7.</figcaption>
</figure>

GEMM performs $MNK$ multiplications and about the same number of additions. Performance tools conventionally count $2MNK$ floating-point operations (FLOPs), including one multiply and one add for each inner-loop step. Our tiny product therefore counts $2 \cdot 2 \cdot 2 \cdot 3 = 24$ FLOPs.

In naive scalar code, each thread computes a single output $C_{i,j} = \sum_{k=0}^{K-1} A_{i,k} B_{k,j}$. For each step along $k$, the thread fetches one float from $A$ (4 bytes) and one float from $B$ (4 bytes), performing one fused multiply-add (2 FLOPs). That yields an arithmetic intensity of:

$$
I_{\text{naive}} = \frac{2\ \text{FLOPs}}{4\ \text{bytes} + 4\ \text{bytes}} = 0.25\ \text{FLOP/B}
$$

This ratio captures **per-thread operand demand**, excluding the final output store. Address merging in hardware and L1/L2 cache reuse determine how many bytes actually reach HBM, so multiplying 0.25 by peak HBM bandwidth cannot determine the kernel's real ceiling or an idle-hardware percentage. Always pair an arithmetic intensity number with the exact memory tier where you counted its bytes.

The script below reproduces the hand calculation and compares two traffic models. Its first model assumes every output reloads two input values for every $k$. An optimistic second model counts each input and output element once, giving a lower bound for a cold, standalone operation. A real cache can change the observed traffic.

<!-- leetllm: test, deps=numpy, output=show, id=gpu-gemm-traffic-model -->

```python title="gemm-hand-check.py"
import numpy as np

A = np.array([[1.0, 2.0, 0.0], [-1.0, 3.0, 2.0]], dtype=np.float32)
B = np.array([[2.0, -1.0], [1.0, 4.0], [3.0, 0.0]], dtype=np.float32)
C = A @ B

M, K = A.shape
_, N = B.shape
flops = 2 * M * N * K
scalar_bytes = A.itemsize * M * N * (2 * K + 1)
unique_bytes = A.nbytes + B.nbytes + C.nbytes

print(f"C={C.tolist()}")
print(f"flops={flops}")
print(f"scalar_load_model={flops / scalar_bytes:.3f} FLOP/B")
print(f"perfect_reuse_bound={flops / unique_bytes:.3f} FLOP/B")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
C=[[4.0, 7.0], [7.0, 13.0]]
flops=24
scalar_load_model=0.214 FLOP/B
perfect_reuse_bound=0.375 FLOP/B
```
<!-- leetllm: output:end -->

Those intensities are small because the matrices are small. For a square FP32 GEMM with $M=N=K=n$, the unique-byte model becomes:

$$
I_{\text{ideal}} = \frac{2n^3}{4(n^2+n^2+n^2)} = \frac{n}{6}\ \text{FLOP/B}
$$

When $n=4096$, $I_{\text{ideal}} \approx 682.7$ FLOP/B. Large square GEMMs contain abundant reuse to become compute-bound, but only if the kernel captures that reuse on chip. The <span data-glossary="roofline-model">roofline model</span> bounds attainable compute rate by the lower of peak arithmetic throughput and memory bandwidth multiplied by <span data-glossary="arithmetic-intensity">arithmetic intensity</span>.[^williams2009] It tells us whether reducing bytes can still move the ceiling.

```checkpoint
Why is 0.375 FLOP/B an optimistic bound for the tiny product rather than a measured intensity?
---
It counts every A, B, and C element exactly once. A real kernel may fetch cache lines it only partly uses, reload evicted data, or move padding and metadata. A warm cache can also reduce DRAM traffic for one launch, so measure device traffic and record cache conditions.
```

The intensity model assumes each thread already loads the right addresses. What does a warp actually request when every thread owns one output?

## A correct thread can still request the wrong addresses

The first CUDA kernel assigns one thread to one output. Each thread runs the same $K$-step dot product:

```cpp title="gemm_lab.cu"
__global__ void gemm_scalar_strided(const float* A, const float* B, float* C,
                                    int M, int N, int K) {
    int row = blockIdx.x * blockDim.x + threadIdx.x;
    int col = blockIdx.y * blockDim.y + threadIdx.y;
    if (row >= M || col >= N) return;

    float acc = 0.0f;
    for (int k = 0; k < K; ++k) {
        acc += A[row * K + k] * B[k * N + col];
    }
    C[row * N + col] = acc;
}
```

CUDA linearizes `threadIdx.x` first across warp lanes 0 through 31. In this strided kernel with a $16 \times 16$ block, lanes 0 through 15 own rows 0 through 15 of column 0, while lanes 16 through 31 own rows 0 through 15 of column 1. Because $A$ is stored row-major, row $r+1$ begins $K$ elements ($4K$ bytes) after row $r$.

With aligned buffers and $N=K=64$, lane 0's A request is at byte 0, lane 1's at byte 256, and lane 2's at byte 512. The first 16 lanes cover 16 distinct 32-byte address sectors. The next 16 repeat those A addresses: there are 16 sectors across the full warp, not 32. Its C store also covers 16 sectors because each pair of neighboring columns fits in the same sector. These counts describe requested addresses; use hardware counters to measure cache misses and HBM transactions.

Swap index assignments so `threadIdx.x` selects `col`:

```cpp title="gemm_lab.cu"
__global__ void gemm_scalar_coalesced(const float* A, const float* B, float* C,
                                      int M, int N, int K) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    if (row >= M || col >= N) return;

    float acc = 0.0f;
    for (int k = 0; k < K; ++k) {
        acc += A[row * K + k] * B[k * N + col];
    }
    C[row * N + col] = acc;
}
```

With the coalesced kernel's $32 \times 8$ block, a full warp owns one row and 32 consecutive columns. All 32 requests to $A$ address the same float and touch one sector, while $B$ loads and $C$ stores each span four 32-byte sectors in this aligned layout. Other leading dimensions, base alignments, and edge masks can change those sector counts.[^cudaBestPractices2026]

| Mapping | Adjacent lanes vary | A load at k=0 | B load at k=0 | C store after the loop | Sum across these three instructions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| scalar strided | row within each 16-lane half | stride $K$ (16 sectors) | two columns per warp (1 sector) | stride $N$ (16 sectors) | 33 sectors |
| scalar coalesced | output column | shared row (1 broadcast sector) | contiguous 32 floats (4 sectors) | contiguous 32 floats (4 sectors) | 9 sectors |

The three shown instructions cover 33 versus 9 sectors in total, 72.7% fewer in this address model. The C store happens once after the K loop, not once per iteration. Both kernels still execute two scalar operand loads per output per k, but that doesn't imply identical HBM bytes. Shared tiling makes reuse explicit instead of relying only on hardware merging and caches.

<figure>
  <img src="illustrations/_generated/warp_address_sectors_dark.png" alt="Comparison of aligned FP32 warp sector requests for 16 by 16 strided and 32 by 8 coalesced blocks. Two spatial grids highlight warp 0 coverage across the output matrix, a byte-offset table traces lanes L0, L1, L8, L16, and L31 across A, B, and C, and stacked bars total 33 sectors for strided (16 A, 1 B, 16 C) versus 9 sectors for coalesced (1 A, 4 B, 4 C), 3.67x fewer sectors." />
  <figcaption>M = 32, N = K = 64. Letting `threadIdx.x` vary across columns cuts warp-0 address requests from 33 sectors (strided) to 9 sectors (coalesced) across the k = 0 loads and final C store.</figcaption>
</figure>

> **Key insight:** Swapping `threadIdx.x` from `row` to `col` does not change a single floating-point operation, yet it drops warp-0's requested 32-byte sectors by 3.67x because adjacent lanes now hit contiguous columns of $B$ and $C$ while broadcasting a single element of $A$.

## Turn global loads into shared tiles

Pick a $16 \times 16$ output tile. One threadblock loads a $16 \times 16$ tile of $A$ and a $16 \times 16$ tile of $B$ into fast, on-chip shared memory, computes 256 partial dot products, then advances 16 positions along $K$. Every loaded $A$ value feeds 16 output columns, and every loaded $B$ value feeds 16 output rows.

<figure>
  <img src="illustrations/_generated/shared_tile_reuse_dark.png" alt="Three 16 by 16 tile diagrams show shared-memory panels in A and B feeding an output tile in C, where one loaded value from A serves a full row of 16 outputs and one value from B serves a full column, delivering 8,192 FLOPs from 2,048 operand bytes (4 FLOP per byte). Below, a four-stage loop flow connects guarded global-to-shared loads, a read-after-write barrier, tile multiply-accumulate, and a write-after-read barrier, alongside an edge-thread rule showing zero-fill and skipped stores." />
  <figcaption>Each $16\times16$ panel stages 256 FP32 values in $A_s$ and 256 in $B_s$ (2,048 operand bytes for 8,192 FLOPs across 256 outputs), giving 4 FLOP/B across global-to-shared transfers. Every thread reaches both barriers: an out-of-range row zeros its A load while still loading B before skipping the final C store.</figcaption>
</figure>

Two block-wide barriers enforce execution order:

1. **Read-After-Write (RAW) barrier:** Prevents any thread from reading a shared tile before all threads finish loading it from global memory.
2. **Write-After-Read (WAR) barrier:** Prevents fast threads from looping around and overwriting shared memory before slower threads finish consuming the current tile.

Cooperative staging lets all threads in a block reuse each loaded element across an entire row or column of the tile. That explicit on-chip sharing reduces duplicate operand fetches at the shared-memory interface rather than relying purely on hardware caches. How much HBM traffic this actually saves still depends on L2 cache residency and the full kernel workload.[^cudaBestPractices2026]

```cpp title="gemm_lab.cu"
constexpr int TILE = 16;

__global__ void gemm_shared(const float* A, const float* B, float* C,
                            int M, int N, int K) {
    __shared__ float As[TILE][TILE];
    __shared__ float Bs[TILE][TILE];

    int row = blockIdx.y * TILE + threadIdx.y;
    int col = blockIdx.x * TILE + threadIdx.x;
    float acc = 0.0f;

    for (int k0 = 0; k0 < K; k0 += TILE) {
        int ak = k0 + threadIdx.x;
        int bk = k0 + threadIdx.y;
        As[threadIdx.y][threadIdx.x] =
            (row < M && ak < K) ? A[row * K + ak] : 0.0f;
        Bs[threadIdx.y][threadIdx.x] =
            (bk < K && col < N) ? B[bk * N + col] : 0.0f;
        __syncthreads();

#pragma unroll
        for (int k = 0; k < TILE; ++k) {
            acc += As[threadIdx.y][k] * Bs[k][threadIdx.x];
        }
        __syncthreads();
    }

    if (row < M && col < N) C[row * N + col] = acc;
}
```

Edge handling preserves cooperative loads and barrier participation. A thread outside $M$ can still own a B load needed by valid rows; an out-of-range output column can still own an A load. Returning based only on output validity skips that work. Keep this algorithm's threads active through both barriers and predicate the final C store. CUDA's barrier waits for non-exited threads; an early exit isn't inherently a guaranteed hang. Conditional barriers with nonuniform participation are a separate invalid synchronization pattern.[^cudaCppIntrinsics2026]

For each $16 \times 16 \times 16$ tile step, every output element performs 16 multiply-adds, giving $2 \cdot 16^3 = 8{,}192$ FLOPs across the block. Because threads cooperatively stage two 256-element FP32 tiles ($2 \cdot 256 \cdot 4 = 2{,}048$ bytes) from global memory instead of re-fetching operands individually, global loads drop sharply relative to arithmetic work. Arithmetic intensity across those global-to-shared transfers therefore jumps to:

$$
I_{\text{shared}} = \frac{8{,}192\ \text{FLOPs}}{2{,}048\ \text{bytes}} = 4.0\ \text{FLOP/B}
$$

This ratio represents a $16\times$ reduction in nominal operand-load bytes per output compared with independent scalar loading. That estimate models only full-tile operand loads at the global-to-shared stage. Final output stores, edge padding on partial tiles, and L1/L2 cache behavior all affect the measured HBM traffic.

```checkpoint
An edge thread has row >= M. Why must it still reach both barriers inside the K loop?
---
Other threads in the block may need its B load and its barrier participation. The edge thread still performs both predicated loads, zero-fills only invalid source coordinates, reaches each block-wide barrier, and skips its final out-of-range store.
```

## Find a bank conflict before fixing it

Shared memory is fast on-chip SRAM, yet it is not an unconstrained cache with arbitrary parallel throughput. To serve 32 warp lanes in a single cycle without contention, NVIDIA hardware partitions shared memory into 32 independent memory banks. Adjacent 4-byte (32-bit) words map to consecutive banks cyclically according to their byte address:

$$
\text{bank} = \left(\frac{\text{byte address}}{4}\right) \bmod 32
$$

For the scalar FP32 model, different words in the same bank require separate conflict-free service groups. Multiple lanes reading the **same word** can broadcast without a conflict. A conflict degree isn't a complete instruction latency in clock cycles or a kernel slowdown factor.[^cudaBestPractices2026]

Two threads reading distinct words inside the same bank serialize into separate conflict-free service groups. Checking whether an access pattern causes serialization requires tracing all 32 warp lane addresses simultaneously. Examine the inner accumulation line of `gemm_shared` with that lane-level mapping in mind:

```cpp
acc += As[threadIdx.y][k] * Bs[k][threadIdx.x];
```

With the shown $16 \times 16$ block, one warp spans two rows, not 32 rows. Sixteen lanes read `As[0][k]`, and sixteen read `As[1][k]`: two broadcasts to different banks. B's sixteen distinct words are each requested twice, also without conflicts. A $32 \times 32$ block would put the warp in one row, making its A read a single broadcast. Changing the array size alone doesn't create a 32-way column access.

Now construct a different pattern: lane $\ell$ reads word $32\ell+k$ of a $32 \times 32$ array. These are 32 different row addresses, all mapping to bank $k$. **This** is a 32-way conflict. Padding to `[32][33]` gives bank $(\ell+k)\bmod32$, eliminating the conflict for this scalar access. It adds 128 bytes (3.125%); a `[16][17]` array instead adds 64 bytes (6.25%). Row starts with a 33-float stride aren't all 16-byte aligned.

An XOR permutation can also spread this column: store logical `(row,col)` at physical column `col ^ row`, and apply that mapping to both producers and consumers. It uses the same number of words. But it permutes logical vector components: row 1's columns 0,1,2,3 become 1,0,3,2. You can't assume a `float4` starting at the first mapped word preserves alignment and logical order. Production layouts must match the specific vector, ldmatrix, or MMA access pattern.

<!-- leetllm: test, output=show, id=gpu-gemm-bank-addresses -->
```python title="broadcast_or_conflict.py"
def service_groups(words):
    banks = {}
    for word in words:
        banks.setdefault(word % 32, set()).add(word)
    return max(map(len, banks.values()))


k = 3
shown_a = [(lane // 16) * 16 + k for lane in range(32)]
shown_b = [k * 16 + lane % 16 for lane in range(32)]
column = [32 * lane + k for lane in range(32)]
padded = [33 * lane + k for lane in range(32)]
old_xor = [32 * row + (k ^ ((row // 4) % 8)) for row in range(32)]
scalar_xor = [32 * row + (k ^ row) for row in range(32)]
counts = [service_groups(words) for words in
          (shown_a, shown_b, column, padded, old_xor, scalar_xor)]
assert counts == [1, 1, 32, 1, 4, 1]
assert [col ^ 1 for col in range(4)] == [1, 0, 3, 2]
print("model groups: shown A/B=1/1; column=32; padded=1; old XOR=4; scalar XOR=1")
print("row 1 XOR vector: [1, 0, 3, 2]; logical vector order isn't preserved")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
model groups: shown A/B=1/1; column=32; padded=1; old XOR=4; scalar XOR=1
row 1 XOR vector: [1, 0, 3, 2]; logical vector order isn't preserved
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/bank_broadcast_layout_dark.png" alt="Shared-memory bank layout analysis at k equals 3. A 16 by 16 block panel shows lanes 0 to 15 broadcasting A word 3 and lanes 16 to 31 broadcasting word 19 while B requests 16 distinct words conflict-free. Next to it, a stride-32 grid illustrates all 32 lanes hitting bank 3, a bank-mapping table contrasts stride 32, padded stride 33, and XOR layouts (noting physical column order 1, 0, 3, 2 on row 1), and a four-bar chart shows service groups dropping from 32 (stride 32) and 4 (grouped XOR) to 1 (stride 33 padding and full-row XOR)." />
  <figcaption>At $k=3$, the lab's $16\times16$ block broadcasts two distinct A words and repeats B's 16 distinct words without bank conflicts. The 32-way conflict belongs to a separate $32\ell+3$ column pattern, which padding to stride 33 or full-row XOR resolves to 1 service group, though full-row XOR permutes row 1's vector order to $[1,0,3,2]$.</figcaption>
</figure>

The old XOR expression's eight bank choices leave four different words per bank in the column example, so always check the transformed addresses before assuming a swizzle removes conflicts.

## Let each thread keep more than one answer

In `gemm_shared`, each thread reads two shared floats for one multiply-accumulate: 8 bytes of per-thread operand demand for 2 FLOPs, or 0.25 FLOP/B. Register blocking gives each thread a 2D tile of $R_M \times R_N$ outputs held in local registers. In our lab kernel, each thread computes 4 horizontal outputs ($1 \times 4$ tile):

```cpp title="gemm_lab.cu"
float acc[4] = {0.0f, 0.0f, 0.0f, 0.0f};

#pragma unroll
for (int k = 0; k < TILE; ++k) {
    float a = As[threadIdx.y][k];
#pragma unroll
    for (int j = 0; j < 4; ++j) {
        acc[j] += a * Bs[k][threadIdx.x + j * TILE];
    }
}
```

<figure>
  <img src="illustrations/_generated/register_output_tile_dark.png" alt="Four 16 by 16 sub-tiles forming a 16 by 64 output block highlight columns +0, +16, +32, and +48 owned by thread tx equals 1, ty equals 2 along row 2. A per-k reuse diagram shows one shared A value pairing with those four B values into four FMA accumulators (8 FLOPs per 20 bytes), while a three-bar chart compares per-thread operand intensity across 1 by 1 (0.25 FLOP/B), 1 by 4 (0.40 FLOP/B), and 8 by 8 (2.0 FLOP/B) register tiles." />
  <figcaption>Thread $(1,2)$ owns four columns ($+0, +16, +32, +48$) along row 2, raising per-thread operand intensity from 0.25 FLOP/B (1×1) to 0.40 FLOP/B (1×4), and up to 2.0 FLOP/B for an 8×8 register tile.</figcaption>
</figure>

A single float loaded from `As` into register `a` now feeds 4 independent multiply-adds. In an $8 \times 8$ register tile ($R_M = 8, R_N = 8$), a thread loads 8 values from $A$ and 8 values from $B$ (16 floats = 64 bytes), then executes $8 \times 8 = 64$ FMAs (128 FLOPs):

$$
I_{\text{smem}} = \frac{2 \cdot R_M \cdot R_N}{4(R_M + R_N)} = \frac{128\ \text{FLOPs}}{64\ \text{bytes}} = 2.0\ \text{FLOP/B}
$$

An $8\times8$ register tile reduces nominal per-thread shared-memory operand loads by $8\times$. By contrast, the lab's $1\times4$ tile executes 8 FLOPs from five floats (20 bytes, or 0.4 FLOP/B), a $1.6\times$ gain over 0.25. Neither ratio alone guarantees a bandwidth reduction or speedup without accounting for register pressure and cache behavior.

More registers aren't free. Accumulators and input temporaries can reduce block residency or require spills. A100's 65,536-register budget gives an upper bound of 1,024 threads at 64 registers each, before other allocation/resource limits; other Ampere targets have different warp limits. Spills don't inevitably erase every reuse benefit. Compare the compiled resource report, target occupancy, and measurements, as in the [compiler lesson](/learn/gpu-compilers-kernel-languages). CUTLASS's pipelined GEMMs can have relatively low occupancy and still perform well.[^nvidia2026cutlassEfficientGemm]

| Kernel layer | Primary reuse location | Accumulator owner | Added constraint |
| :--- | :--- | :--- | :--- |
| scalar coalesced | Hardware L1/L2 caches | One thread, one output | Repeated global loads |
| shared $16 \times 16$ | Threadblock shared memory | One thread, one output | Barriers, shared capacity, bank conflicts |
| register $16 \times 64$ | Shared memory plus registers | One thread, four outputs | Register pressure and occupancy limits |
| Tensor Core WMMA | Fragment registers / MMA pipes | One warp, $16 \times 16$ tile | Precision, alignment, and fragment layout |

## Hand a tile to Tensor Cores

Tensor Cores are specialized execution units designed for matrix multiply-accumulate operations. NVIDIA introduced Volta Tensor Cores through the Warp Matrix Multiply Accumulate (WMMA) API in CUDA 9. Rather than having individual threads execute scalar FMAs, all 32 lanes in a warp cooperate to multiply fragments of matrices:

$$
D = A \cdot B + C
$$

For FP16 inputs, a standard fragment computes a $16 \times 16 \times 16$ matrix tile while accumulating into FP32.[^nvidia2017wmma] Unlike scalar loops where each thread tracks explicit indices into its own array slot, the 32 lanes of a warp cooperatively hold opaque elements of each fragment across their hardware registers. Only warp-collective WMMA intrinsics should load, multiply, or store those distributed fragments.

Because Tensor Core instructions operate across an entire warp at once, minor mismatches in thread participation or memory alignment trigger undefined behavior or misaligned loads instead of quiet single-element bugs. Keeping every threadblock layout valid requires satisfying hardware constraints on both control flow and buffer geometry. Three rules prevent bugs when programming WMMA:

1. **Full warp cooperation:** All 32 lanes must participate with matching matrix shapes and types. A diverged or partially active warp produces undefined results.
2. **Strict pointer and stride alignment:** For FP16 inputs, `load_matrix_sync` requires a 32-byte-aligned base pointer and a leading dimension divisible by 8 elements (16 bytes). The FP32 output store requires 32-byte pointer alignment and a leading dimension divisible by 4 elements (16 bytes).
3. **Valid full-fragment storage:** These WMMA load/store calls don't supply element masks. The lab pads all three dimensions to multiples of 16, zero-fills inputs, and crops the output. Another design can stage aligned full shared-memory fragments with guarded global edge loads and stores; padding the entire global tensor isn't mandatory.[^cudaCppIntrinsics2026]

Following those constraints lets a single warp replace an entire block's scalar multiply-add loop with hardware matrix operations. Notice that we compile with an architecture guard so unsupported pre-Volta targets trap cleanly instead of executing an empty kernel body. The lab kernel uses row-major FP16 inputs, FP32 accumulation, and one warp per $16 \times 16$ tile:

```cpp title="gemm_lab.cu"
__global__ void gemm_wmma_aligned(const half* A, const half* B, float* C,
                                  int M, int N, int K) {
#if defined(__CUDA_ARCH__) && __CUDA_ARCH__ < 700
    asm("trap;");  // Never silently execute an empty unsupported kernel.
#else
    using namespace nvcuda;
    int row = blockIdx.y * 16;
    int col = blockIdx.x * 16;

    wmma::fragment<wmma::accumulator, 16, 16, 16, float> c_frag;
    wmma::fill_fragment(c_frag, 0.0f);

    for (int k0 = 0; k0 < K; k0 += 16) {
        wmma::fragment<wmma::matrix_a, 16, 16, 16, half,
                       wmma::row_major> a_frag;
        wmma::fragment<wmma::matrix_b, 16, 16, 16, half,
                       wmma::row_major> b_frag;
        wmma::load_matrix_sync(a_frag, A + row * K + k0, K);
        wmma::load_matrix_sync(b_frag, B + k0 * N + col, N);
        wmma::mma_sync(c_frag, a_frag, b_frag, c_frag);
    }
    wmma::store_matrix_sync(C + row * N + col, c_frag, N,
                            wmma::mem_row_major);
#endif
}
```

Because host setup pads all dimensions to multiples of 16 ($M_p, N_p, K_p$), the grid launches only complete tiles. That eliminates edge-guard branches inside the inner `k0` loop and guarantees every `load_matrix_sync` and `store_matrix_sync` call meets alignment requirements. Zero-padding also inflates the total arithmetic work performed on ragged shapes, as shown in the edge-tile breakdown below.

<figure>
  <img src="illustrations/_generated/gemm_tile_pipeline_dark.png" alt="Three tiled matrices show padded 16 by 16 grid extents for M=73, N=61, and K=67: A padded to 80 by 80, B padded to 80 by 64, and C cropped back to 73 by 61. Corner-tile badges isolate the final partial block where 9 by 3 real entries in A and 3 by 13 real entries in B update the retained 9 by 13 corner in C, while a bar chart compares 596.7k logical FLOPs against 819.2k executed FLOPs (+37.3% padding overhead)." />
  <figcaption>Padding $M=73$, $N=61$, and $K=67$ up to $80\times64\times80$ runs five 16-wide K panels, with the corner block executing $A[9\times3]B[3\times13]$ inside zero-padded full fragments and expanding total work from 596.7k logical FLOPs to 819.2k executed FLOPs (+37.3%). All 32 warp lanes still participate because WMMA requires aligned full fragments.</figcaption>
</figure>

Padding adds explicit arithmetic overhead. For default shapes $M=257, N=263, K=251$, WMMA executes on $272 \times 272 \times 256$:

$$
\text{Overhead} = \frac{2 \cdot 272 \cdot 272 \cdot 256}{2 \cdot 257 \cdot 263 \cdot 251} - 1 = \frac{37{,}879{,}808}{33{,}930{,}682} - 1 \approx 11.6\%
$$

Use logical operations ($2MNK$) for useful-work TFLOP/s. Also report nominal padded operations when explaining instruction overhead, and label the two rates separately.

### Layout is part of the type

`A[row * K + k]` and `B[k * N + col]` assume row-major storage. Changing a fragment tag changes how memory is interpreted; it doesn't transpose the bytes. Data and leading dimensions must match the intended operand layout. Special symmetric inputs can hide a mismatch, so use nonsymmetric test inputs.

Always specify and verify:
- Logical shapes $[M,K]$, $[K,N]$, $[M,N]$;
- Storage order (row-major or column-major);
- Leading dimensions and memory strides;
- Memory alignment and padding multiples;
- Input, accumulator, and output data types.

## What FP32 accumulation preserves, and what it can't recover

The lab requests FP16 inputs and FP32 accumulation. Some supported Tensor Core operations also allow FP16 accumulation; FP32 isn't a universal hardware requirement. Input format doesn't imply the product is rounded to that format: PTX specifies at least single-precision multiplication for its FP16 MMA operations, with accumulation precision depending on the instruction's type. Order, rounding, and subnormal behavior also depend on the documented operation.[^nvidiaPtxIsa2026]

Consider the IEEE 754 half-precision (FP16) format:
- 1 sign bit, 5 exponent bits, 10 mantissa bits;
- Machine epsilon $\epsilon_{\text{FP16}} = 2^{-10} \approx 9.77 \times 10^{-4}$;
- Dynamic range: minimum subnormal $\approx 6 \times 10^{-8}$, maximum finite value $\approx 65{,}504$.

Immediately above $1{,}024$, adjacent FP16 values are spaced by 1. A positive 0.25 update rounds away under round-to-nearest, while FP32 can preserve it. This is absorption by rounding, not subnormal underflow. Below 1,024 the spacing is 0.5, so a negative 0.375 update gives 1,023.5; “every product smaller than 0.5 disappears” would be wrong. Reduction length alone cannot determine the magnitude of partial sums or model divergence.

In contrast, single precision (FP32) provides:
- 8 exponent bits, 23 mantissa bits;
- Machine epsilon $\epsilon_{\text{FP32}} = 2^{-23} \approx 1.19 \times 10^{-7}$;
- Dynamic range up to $3.4 \times 10^{38}$.

Immediately above $1{,}024$, FP32's spacing is approximately $1.22\times10^{-4}$. Updates smaller than its own rounding threshold can still disappear, and wider accumulation can't recover information already rounded out of FP16 inputs.

<!-- leetllm: test, deps=numpy, output=show, id=gpu-gemm-rounding -->
```python title="rounding_not_underflow.py"
import numpy as np

half_update = float(np.float16(1024.0 + 0.25))
float_update = float(np.float32(1024.0 + 0.25))
negative_update = float(np.float16(1024.0 - 0.375))
assert (half_update, float_update, negative_update) == (1024.0, 1024.25, 1023.5)
assert float(np.float16(1.0001)) == 1.0
print(f"positive update: FP16={half_update}, FP32={float_update}")
print(f"negative update: FP16={negative_update}; rounded input 1.0001 -> 1.0")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
positive update: FP16=1024.0, FP32=1024.25
negative update: FP16=1023.5; rounded input 1.0001 -> 1.0
```
<!-- leetllm: output:end -->

NumPy's `float16` and `float32` dtypes expose exact IEEE binary16 and binary32 storage spacing.[^python2026struct] Casting `1024.0 + 0.25` to `np.float16` drops the `0.25` increment completely because representable values above `1,024` are spaced by 1.0, whereas `np.float32` keeps `1024.25` intact. Hardware Tensor Cores also include internal sub-word multiply and multi-term accumulation stages on top of storage rounding.

### The two-reference testing protocol

Comparing a mixed-precision kernel only against original FP32 inputs conflates two separate phenomena: input quantization to FP16 and arithmetic inside the MMA unit. Using two distinct references separates those effects so you can verify kernel math independently from representation loss. Both references can be computed on the CPU or with a higher-precision implementation:

1. **Arithmetic correctness reference:** Convert FP32 inputs to FP16, convert them back to FP32, and accumulate in FP64. This reference isolates kernel arithmetic and accumulation fidelity from input quantization loss.
2. **Original-input reference:** Accumulate original FP32 inputs in FP64. Comparing against it measures input-quantization plus kernel-arithmetic change, not downstream application quality by itself.

To see why both references matter, consider a two-element dot product with $A=[1.0001,1]$ and $B=[1,-1]^T$. Casting $A$ to FP16 rounds both entries to $1$, destroying the tiny difference before any multiply-add instruction even runs. As a result, a kernel that computes the rounded-input product with zero arithmetic error still reports 100% relative error against the original-input reference.

<!-- leetllm: test, output=show, continue=gpu-gemm-rounding -->
```python title="two_references_after_cancellation.py"
a = np.array([1.0001, 1.0], dtype=np.float32)
b = np.array([1.0, -1.0], dtype=np.float32)
aq = a.astype(np.float16)
original_ref = float(a.astype(np.float64) @ b.astype(np.float64))
rounded_ref = float(aq.astype(np.float32).astype(np.float64) @ b.astype(np.float64))
candidate = float(aq.astype(np.float32) @ b.astype(np.float32))
arithmetic_error = abs(candidate - rounded_ref)
original_error = abs(candidate - original_ref)
assert arithmetic_error == 0.0 and original_ref > 0.0
assert original_error / abs(original_ref) == 1.0
print(f"original-input reference={original_ref:.8f}; rounded-input reference={rounded_ref:.8f}")
print(f"arithmetic error={arithmetic_error:.8f}; original-input relative error=100%")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
original-input reference=0.00010002; rounded-input reference=0.00000000
arithmetic error=0.00000000; original-input relative error=100%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/rounding_two_references_dark.png" alt="FP16 spacing around 1,024 and two-reference error separation. A number line from 1023.0 to 1025.0 marks a -0.375 subtraction rounding to 1023.5 and a +0.25 addition rounding back to 1024 across an FP16 gap of 1.0 (compared with FP32 spacing near 1.2e-4). Below left, cancellation for A=[1.0001,1], B=[1,-1] flows from Orig FP64 (0.00010002) versus FP16 [1,1] (cand = 0.0), noting FP32 acc cannot undo FP16 loss. Below right, a Lab Validation Rules table contrasts Ref 1 (5e-3, 2e-3 FP32), Ref 2 (Orig FP64 loss), and Cancel (0 R1, 100% R2)." />
  <figcaption>FP16 spacing doubles from 0.5 below 1,024 to 1.0 above it, while FP32 accumulation cannot recover precision discarded when inputs cast to FP16. For the cancelling case $A=[1.0001,1], B=[1,-1]^T$, the kernel matches Reference 1 at zero arithmetic error while differing from Reference 2 (0.00010002) by 100%.</figcaption>
</figure>

> **Common mistake:** Blaming a Tensor Core kernel for 100% relative error on cancelling inputs when the error actually happened before the kernel ran, during the FP32-to-FP16 input cast. Always separate rounded-input arithmetic checks (Reference 1) from original-input quantization loss (Reference 2).

We check kernel correctness against Reference 1 using absolute and relative error bounds:

$$
|C_{\text{gpu}} - C_{\text{ref}}| \le \text{atol} + \text{rtol} \cdot |C_{\text{ref}}|
$$

The lab checks WMMA against Reference 1 with $\text{atol} = 5 \times 10^{-3}$ and $\text{rtol} = 2 \times 10^{-3}$, and separately reports error against the original-input reference so input quantization and accumulation precision stay cleanly separated.

## The hardware roofline across kernel stages

First bring the memory-tier accounting back into the calculation. For a full output tile of $B_M\times B_N$, an operand-load model counts $B_M B_K+B_K B_N$ input elements per K panel. Ignoring stores and tails, its intensity is $2B_M B_N/[s(B_M+B_N)]$, where $s$ is bytes per input element.

| Lab stage | Input bytes/element | Nominal operand-load intensity | What this model omits |
|---|---|---|---|
| Scalar strided | 4 | 0.25 FLOP/B per thread | Merged requests, caches, output store |
| Scalar coalesced | 4 | 0.25 FLOP/B per thread | Different sectors and merging, caches, output store |
| Shared $16\times16$ | 4 | 4 FLOP/B per block panel | Stores, tails, cross-block/cache reuse |
| Register $16\times64$ | 4 | 6.4 FLOP/B per block panel | Stores, tails, broadcasts and generated loads |
| WMMA $16\times16$ | 2 | 8 FLOP/B per warp panel | FP32 output stores, padding, caches |

The FP16 WMMA panel has 8,192 FLOPs and 1,024 input bytes, not the FP32 panel's 2,048 bytes. Including its final FP32 tile store gives $8K/(K+16)$ FLOP/B for an unpadded full output tile under this load model. It is 4 at K=16 and approaches 8 for large K.

For a concrete hardware ceiling, NVIDIA lists these specifications for **A100 80GB SXM**, distinct from the PCIe and 40GB variants:[^nvidia2026a100Specs]
- HBM2e bandwidth: $B_{\text{mem}} = 2{,}039$ GB/s.
- Peak FP32 CUDA core throughput: $P_{\text{FP32}} = 19.5$ TFLOP/s.
- Peak **dense** FP16 Tensor Core throughput: $P_{\text{TC}} = 312$ TFLOP/s (624 with supported structured sparsity).

At the **HBM tier**, the ideal roofline ceiling is $\min(P, B_{\text{mem}}I_{\text{HBM}})$. Its knee marks the operational intensity where memory-bandwidth throughput meets peak arithmetic compute, separating bandwidth-limited regimes on the left from compute-limited regimes on the right. Real kernels rarely touch that ideal envelope because occupancy limits, warp stalls, and instruction overhead impose additional bottlenecks:

$$
\text{Knee}_{\text{FP32}} = \frac{19{,}500\ \text{GFLOP/s}}{2{,}039\ \text{GB/s}} \approx 9.56\ \text{FLOP/B}
$$

$$
\text{Knee}_{\text{TC}} = \frac{312{,}000\ \text{GFLOP/s}}{2{,}039\ \text{GB/s}} \approx 153.0\ \text{FLOP/B}
$$

Use measured HBM bytes for $I_{\text{HBM}}$, with the same operation count and time scope. Source-load ratios can't simply be substituted: L2 reuse across threadblocks can change HBM demand substantially. A $128\times256$ FP16 block tile has a panel-load intensity of only 85.3 FLOP/B, below the 153 HBM knee, yet that value alone does not settle its measured HBM intensity or pinpoint its bottleneck. Additional pipeline stages can hide latency; they don't by themselves increase tile reuse. Shared-memory bandwidth, dependencies, occupancy, and launch overhead can impose lower ceilings.[^nvidia2026cutlassEfficientGemm]

<figure>
  <img src="illustrations/_generated/boundary_roofline_dark.png" alt="A log-log A100 80GB SXM HBM roofline plot and a four-bar panel-load chart. The log-log roofline draws an HBM bandwidth slope of 2,039 GB/s meeting an FP32 compute ceiling of 19.5 TFLOP/s at the 9.56 FLOP/B knee and a dense FP16 ceiling of 312 TFLOP/s at the 153.0 FLOP/B knee, with no observed kernel points plotted. Beside it, the Panel-Load Ratios chart lists Scl 0.25, Sm 4.0, Reg 6.4, and TC 8.0 FLOP/B, noting these are not measured HBM bytes." />
  <figcaption>A100 80GB SXM HBM roofline (2,039 GB/s slope meeting FP32 at 9.56 FLOP/B and dense FP16 at 153.0 FLOP/B) alongside panel-load intensity ratios (0.25 to 8.0 FLOP/B); use profiler DRAM counters for real HBM intensity.</figcaption>
</figure>

<!-- leetllm: test, output=show, continue=gpu-gemm-traffic-model -->
```python title="keep_the_ceiling.py"
def panel_intensity(bm, bn, item_bytes):
    return 2 * bm * bn / (item_bytes * (bm + bn))


assert panel_intensity(16, 16, 4) == 4
assert panel_intensity(16, 64, 4) == 6.4
assert panel_intensity(16, 16, 2) == 8
fp32_knee, fp16_knee = 19500 / 2039, 312000 / 2039
wide_tile = panel_intensity(128, 256, 2)
assert wide_tile < fp16_knee
assert 8 * 16 / (16 + 16) == 4  # WMMA inputs plus the FP32 output store.
logical_work = 2 * 73 * 61 * 67
padded_work = 2 * 80 * 64 * 80
assert logical_work == 596702 and padded_work == 819200
padding_extra = 100 * (padded_work / logical_work - 1)
print("panel-load model: shared=4.0, register=6.4, WMMA=8.0 FLOP/B")
print(f"HBM knees: FP32={fp32_knee:.2f}, dense FP16={fp16_knee:.1f} FLOP/B")
print(f"128x256 FP16 panel={wide_tile:.1f} FLOP/B; stages alone don't change reuse")
print(f"odd shape: logical={logical_work}, padded={padded_work}, extra={padding_extra:.1f}%")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
panel-load model: shared=4.0, register=6.4, WMMA=8.0 FLOP/B
HBM knees: FP32=9.56, dense FP16=153.0 FLOP/B
128x256 FP16 panel=85.3 FLOP/B; stages alone don't change reuse
odd shape: logical=596702, padded=819200, extra=37.3%
```
<!-- leetllm: output:end -->

## Run the lab and keep the record

Save the download as `assets/gemm_lab.cu` relative to your working directory. Check the installed toolkit and device first. Set `GPU_ARCH` to an architecture supported by both the device and compiler, such as `sm_80` on an Ampere GPU:

```bash title="terminal"
nvidia-smi --query-gpu=name,compute_cap --format=csv
nvcc --version
nvcc --list-gpu-code

: "${GPU_ARCH:?Set GPU_ARCH to your device's supported target, such as sm_80}"
nvcc -O3 -std=c++17 -lineinfo -arch="$GPU_ARCH" \
  assets/gemm_lab.cu -o gemm_lab
./gemm_lab 257 263 251 20
```

WMMA hardware support began at compute capability 7.0, but toolkit support is a separate constraint. CUDA 13.0 removed offline compilation for architectures below 7.5; a Volta `sm_70` exercise needs a compatible CUDA 12.x toolchain. A binary targeting `sm_80` doesn't become a Hopper-specialized TMA kernel merely by running on newer hardware.[^cuda130ReleaseNotes]

The CLI rejects nonpositive or malformed dimensions, padded buffers exceeding signed 32-bit index ranges, and unsupported grid sizes. Those checks don't guarantee enough device memory. The host FP64 reference also costs $O(MNK)$: start with small correctness shapes before attempting large matrices.

Exact latency and throughput numbers require direct device measurements rather than static back-of-the-envelope calculations. Confirm that all five kernel variants pass numerical verification before comparing their timing or throughput columns, and check how zero-padding expanded the executed FLOPs. When every check passes, the binary prints one summary line per kernel using this schema:

```text title="Expected output shape"
device=<GPU name> cc=<major.minor> shape=257x263x251 iterations=20
scalar_strided       PASS max_abs=<measured> max_rel=<measured> mean_ms=<measured> tflop_s=<measured>
scalar_coalesced     PASS max_abs=<measured> max_rel=<measured> mean_ms=<measured> tflop_s=<measured>
shared_16x16         PASS max_abs=<measured> max_rel=<measured> mean_ms=<measured> tflop_s=<measured>
register_16x64       PASS max_abs=<measured> max_rel=<measured> mean_ms=<measured> tflop_s=<measured>
wmma_f16_f32         PASS max_abs=<measured> max_rel=<measured> mean_ms=<measured> tflop_s=<measured>
wmma_vs_original_fp32 max_abs=<measured> max_rel=<measured>
wmma_padding=272x272x256 logical_flops=33930682 executed_flops=37879808
```

After one poisoned-output correctness launch, the program runs five warmups and times 20 repeated launches on one stream with CUDA events (excluding allocation, host transfers, FP16 conversion, padding, and cropping). Repeat whole runs to inspect variance across runs.

Use a structured JSON record so another engineer can reproduce the comparison:

```json title="gemm-record.json"
{
  "hardware": {"gpu": "record nvidia-smi name", "compute_capability": "record it"},
  "software": {"driver": "record it", "cuda": "record nvcc version", "git_commit": "record it"},
  "workload": {"M": 257, "N": 263, "K": 251, "warmups": 5, "iterations": 20},
  "path": {"kernel": "register_16x64", "input": "fp32", "accumulator": "fp32", "layout": "row-row-row"},
  "timing": {"method": "CUDA events in one stream", "buffer_reuse": "reused; cache residency unverified"},
  "correctness": {"reference": "CPU fp64 on fp32 inputs", "atol": 0.0002, "rtol": 0.0002},
  "result": {"status": "fill after run", "mean_ms": "fill after run", "tflop_s": "fill after run"}
}
```

Never claim a speedup without recording both kernels, exact shapes, clocks, timing scope, precision mode, and matched correctness checks, and always benchmark against cuBLAS or CUTLASS before calling a handwritten kernel competitive. Remember that the lab's FP16 WMMA row and FP32 scalar rows differ in input precision, so compare matched precision before attributing a timing ratio purely to tiling.

Check exercised paths with Compute Sanitizer (`--error-exitcode 99` makes CI fail immediately on sanitizer errors):

```bash title="terminal"
compute-sanitizer --error-exitcode 99 --tool memcheck ./gemm_lab 31 29 37 1
compute-sanitizer --error-exitcode 99 --tool racecheck ./gemm_lab 31 29 37 1
compute-sanitizer --error-exitcode 99 --tool synccheck ./gemm_lab 31 29 37 1
```

Nsight Compute can then explain timing changes. Start with a small metric set:

```bash title="terminal"
ncu --set basic --kernel-name regex:gemm_register_blocked --launch-count 1 \
  ./gemm_lab 512 512 512 2
```

This command captures the first matching launch. The basic set is a starting capture. Add sections for memory sectors, occupancy, registers, shared memory, and tensor-pipe activity as needed.[^nsightCompute2026]

### Check the index model without a GPU

Download [gemm_index_check.py](assets/gemm_index_check.py) alongside the CUDA file to verify the scalar ownership maps, cooperative shared loads, four-output register layout, and padding/crop indexing across six shapes (including $17 \times 65 \times 19$ and $73 \times 61 \times 67$):

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

The CUDA download also exposes a host-only build that checks its actual argument parser, index-overflow guards, reference multiplication, NaN rejection, and tolerance comparison. It excludes every CUDA declaration:

```bash title="terminal"
clang++ -x c++ -std=c++17 -Wall -Wextra -Werror -DGEMM_HOST_CHECK \
  assets/gemm_lab.cu -o gemm_host_check
./gemm_host_check
```

## Where asynchronous copies and TMA take over

The shared and WMMA kernels issue a load, wait, compute, and repeat. A pipelined main loop instead prepares tile $t+1$ while computing tile $t$:

```text title="Two-stage ownership sketch (not CUDA code)"
acquire_empty(stage[0])
issue_copy(input_tile=0, destination=stage[0])

for t in 0 .. k_tiles-1:
    current = stage[t % 2]
    wait_copy_complete_for_all_consumers(current)
    if t + 1 < k_tiles:
        next = stage[(t + 1) % 2]
        acquire_empty(next)
        issue_copy(input_tile=t+1, destination=next)
    accumulate(accumulator, current)
    wait_all_consumers_finished(current)
    release_empty(current)
```

<figure>
  <img src="illustrations/_generated/async_stage_ownership_dark.png" alt="Six-stage async tile ownership lifecycle, double-buffer slot timeline, and hardware async tiers table. Two horizontal flow rows trace steps 1 to 6: claim slot, G -> S copy, phase ready, MMA / WMMA, reads done, and slot free. Below left, a Double-Buffer Slots grid contrasts Interval A (Slot 0 MMA tile t, Slot 1 copy t+1) with Interval B (Slot 0 copy t+2, Slot 1 MMA tile t+1) separated by guard barriers. Below right, a Hardware Async Tiers table compares Pre-Amp, Ampere (cp.async), Hopper (TMA and WGMMA), and Blackwl (tcgen05 and Tensor Memory)." />
  <figcaption>Async tile ownership runs through six phases: acquire a slot, issue the copy, wait for copy completion, run MMA/WMMA, wait for reads to finish, and release the slot. Double-buffered slots alternate copy and compute from Pre-Ampere register staging through Ampere $cp.async$, Hopper TMA + WGMMA, and Blackwell $tcgen05$.</figcaption>
</figure>

The two slots must not alias. Copy completion makes a tile readable; consumer completion makes its storage reusable. An asynchronous MMA can still read shared memory after issue, so releasing a stage at instruction issue is unsafe.

Achieving overlap in hardware depends on instructions that decouple global memory movement from register consumption and synchronize tiles without halting an entire threadblock unnecessarily. Each newer GPU generation shifts where operand movement sits and which synchronization primitives control stage readiness. NVIDIA documents three distinct hardware execution tiers:

| Hardware Mechanism | First Architecture | Data Movement Path | Kernel Programming Model |
| :--- | :--- | :--- | :--- |
| Synchronous cooperative load | Pre-Ampere | GMEM $\to$ Regs $\to$ SMEM | Explicit thread loads and `__syncthreads()` |
| `cp.async` (LDGSTS) | Ampere (CC 8.0) | GMEM $\to$ SMEM directly | Bypasses register file; async pipeline tokens |
| Tensor Memory Accelerator (TMA) | Hopper (CC 9.0) | Multi-D GMEM $\to$ SMEM | Hardware descriptor; transaction barriers |

Ordinary explicit global loads followed by shared stores route data through registers. Generated code determines the instruction count and width; inspect the target binary to see how many instructions move each 16-byte group.

Ampere introduced `cp.async` (hardware instruction `LDGSTS`), copying data directly from global memory into shared memory without touching registers. This frees registers for accumulators and lets data movement proceed in the background while math units execute compute instructions.

Hopper introduces two further leaps:
1. **Warpgroup MMA (`wgmma`):** Four warps (128 threads) cooperate. B is described in shared memory; supported forms take A from shared memory or registers. Accumulators remain distributed in registers. This can reduce operand staging; inspect compiler resource reports to see the register allocation. Volta predates `ldmatrix`; WMMA's opaque fragments can produce different instruction sequences across targets.[^nvidiaPtxIsa2026]
2. **Tensor Memory Accelerator (TMA):** Descriptor-based asynchronous tensor copies can move data between global and shared memory. A single thread can issue a transfer, with documented bounds-fill behavior for loads. Descriptor alignment, strides, completion barriers, and storage lifetime still need correct setup; validate arbitrary kernel pointers separately because TMA bounds fill applies only to documented loads.[^nvidia2026hopperTuning]

Blackwell introduces another execution model through `tcgen05` instructions and dedicated Tensor Memory, including matrix accumulators. Avoid carrying Hopper's register and layout assumptions onto that path, because accumulator storage and operand staging follow different hardware rules. This lab deliberately retains WMMA, leaving newer production instructions for architecture-specific study.[^nvidiaPtxTcgen2026]

CUTLASS and CuTe expose composable C++ layouts (`Tensor`, `Layout`, `TiledCopy`, `TiledMMA`) and architecture-specific kernel schedules. Because layout declarations and execution schedules interact directly, select a supported schedule for multistage pipelining or warp specialization rather than mixing incompatible stages.[^cutlassDocs2026] Rather than guessing which schedule saturates your GPU, use the CUTLASS profiler to collect library benchmarks:

```bash title="terminal"
./tools/profiler/cutlass_profiler \
  --operation=Gemm --m=2048 --n=2048 --k=2048 \
  --A=f16:row --B=f16:row --C=f32:row \
  --accum=f32 --alpha=1 --beta=0 --verification-enabled=true
```

```checkpoint
An async-copy kernel returns correct values but matches the synchronous kernel's timing. Why does the API name alone tell you little about overlap with arithmetic?
---
A high-level copy can fall back to a synchronous path when its alignment or size requirements aren't met. Even with an asynchronous instruction, too little independent computation, too few pipeline stages, or waits in the wrong place can remove overlap. Inspect the emitted instruction path and stall metrics before changing the stage count.
```

## Diagnose the first bad signal

| Symptom | Likely cause | First check | Repair |
| :--- | :--- | :--- | :--- |
| Wrong values only on bottom or right edge | Missing predicate or crop | Run $31 \times 29 \times 37$ | Zero-fill input tails and guard output stores |
| Hang or synchronization error in shared kernel | Nonuniform conditional barrier | Run `synccheck` on an edge shape | Keep this kernel's cooperative loads and barriers outside output-validity conditions |
| Transposed-looking output | Physical layout disagrees with fragment layout | Check indices and leading dimensions | Align layout declarations or transpose data |
| WMMA illegal memory access | Invalid full-fragment storage or bad alignment | Print fragment coordinates, strides, and pointers | Provide valid aligned fragments, using padding or guarded shared staging |
| Shared kernel throughput falls | Conflicts, barriers, or another resource limit | Trace actual lane addresses and source-attributed counters | Change the layout only if its access pattern conflicts |
| WMMA passes small K but drifts at large K | Tolerance ignores reduction length | Compare rounded-input reference across K sweep | Set evidence-based tolerance or stronger accumulation |
| Coalesced kernel isn't faster | Cache already hid loads or shape is too small | Inspect sectors and repeat distribution | Keep evidence; don't assume mapping change must win |
| Register kernel slows down | Spills or lower useful occupancy | Inspect registers and local-memory traffic | Reduce per-thread tile or retune block shape |
| No tensor-pipe activity | Binary, dtype, layout, or path missed Tensor Cores | Record architecture and instruction metrics | Compile correct target and verify selected kernel |
| Async version matches synchronous timing | Copy didn't overlap or fell back | Inspect instruction path and stall reasons | Satisfy alignment rules and pipeline enough work |

Every row starts from a symptom, not a favorite optimization. If correctness fails, stop timing. If timing moves without the expected counter change, revisit the hypothesis.

## Your challenge: identify the limiting bottleneck

Try three experiments rather than assuming the last kernel wins:

1. Compare $31\times29\times37$ with $17\times65\times19$. Calculate the expected padding work first, then inspect correctness and useful-work timings, measuring conversion, padding, and cropping separately if they sit on your application's path.
2. For a fixed shape and FP32 precision mode, compare scalar mappings, shared tiling, and register blocking. Check whether request-sector counts and measured HBM bytes move together, using a source-attributed capture to isolate caches or another limiting bottleneck when they diverge.
3. Hold M=N=64 and sweep K through 32, 256, and 4096. Compare WMMA error against both references, then use a library with matched rounded inputs and compute mode. Does longer accumulation change error, useful rate, or both?

Give another reader the source revision, exact flags, device/software versions, shapes, precision/tolerances, timer scope, buffer-reuse setup, and named profiler evidence. State which observations support the claimed improvement and which remain unresolved. A measured result for one shape is the beginning of an explanation, not a ranking of kernel techniques.

```mastery-quiz
[
  {
    "question": "A CUDA block has 16 threads in x and two in y. At a fixed k, each thread loads the FP32 word B[k, 1 + threadIdx.x]. Column 0 of this row starts on a 32-byte aligned address. Which column does lane 1 read, and how many distinct 32-byte sectors does the whole warp request for this load?",
    "options": [
      "Column 1 and two sectors.",
      "Column 2 and two sectors.",
      "Column 1 and three sectors.",
      "Column 2 and three sectors."
    ],
    "answer": "Column 2 and three sectors.",
    "explanation": "CUDA advances x first, so lane 1 has x = 1 and reads column 2. Column 1 would follow if y advanced first. Each half of the warp reads columns 1 through 16. Those 16 floats occupy bytes 4 through 67 relative to column 0. A count of two sectors overlooks the last float, which starts at byte 64 in the third sector."
  },
  {
    "question": "One thread holds a 2×6 output tile in registers. At each reduction step it loads two FP32 values from A and six from B, each once. How many FLOPs does the thread perform per byte of A and B it loads?",
    "options": [
      "0.25 FLOP/B",
      "0.75 FLOP/B",
      "1.5 FLOP/B",
      "0.375 FLOP/B"
    ],
    "answer": "0.75 FLOP/B",
    "explanation": "Each of the 12 outputs needs one multiply and one add. The thread performs 24 FLOPs and loads eight four-byte words, giving 24/32 = 0.75 FLOP/B. Counting each fused multiply-add as one FLOP gives 0.375. Charging two fresh FP32 loads to every output gives 0.25. Counting each input as two bytes gives 1.5."
  },
  {
    "question": "A warp of 32 lanes issues one scalar FP32 load from shared memory. Lane r reads word s × r + 5, where s is the row stride in words. With 32 banks, how many conflict-free service groups does the warp need before and after the stride increases from 32 to 34 words?",
    "options": [
      "32 before and 2 after",
      "1 before and 2 after",
      "32 before and 1 after",
      "1 before and 1 after"
    ],
    "answer": "32 before and 2 after",
    "explanation": "At stride 32, bank 5 serves 32 distinct words, one per group. A broadcast would require the lanes to read the same word. At stride 34, the bank number advances by two per lane and repeats after 16 lanes. Lanes 0 and 16, for example, read words 5 and 549 in bank 5. Each active bank serves two words, so the warp needs two groups. A single group after padding would require 32 different banks for these 32 words. Counting one group for both layouts confuses issuing one instruction with serving all its requests at once."
  },
  {
    "question": "In row 6 of a shared tile, logical column c is stored at physical column c XOR 6. An aligned load from physical columns 0 through 3 returns [9, 4, 7, 1] in that order. Which vector should the consumer use for logical columns 4 through 7, in order?",
    "options": [
      "[9, 4, 7, 1]",
      "[7, 1, 9, 4]",
      "[1, 7, 4, 9]",
      "[4, 9, 1, 7]"
    ],
    "answer": "[7, 1, 9, 4]",
    "explanation": "XOR with 6 maps columns 4, 5, 6, 7 to positions 2, 3, 0, 1. Reading those positions gives [7, 1, 9, 4]. Keeping the loaded order ignores the permutation. Reversing all four words starts at position 3. Swapping the two words within each pair starts at position 1. Both rearrangements fetch the wrong first component."
  },
  {
    "question": "A GEMM kernel rounds its inputs to the nearest FP16 value and accumulates in FP32. Near 640, adjacent FP16 values are 0.5 apart. Starting at zero, the kernel adds two products. The first is the converted value of 640.375 times 1. The second is exactly 0.0625. What is the final FP32 sum?",
    "options": [
      "640.4375",
      "640.5",
      "640.5625",
      "640.0625"
    ],
    "answer": "640.5625",
    "explanation": "The input 640.375 is closer to 640.5 than to 640. FP32 can represent 640.5 + 0.0625 exactly, giving 640.5625. The sum 640.4375 uses the original input after conversion discarded it. Stopping at 640.5 rounds away the update as an FP16 accumulator would. The sum 640.0625 truncates the input to 640 during conversion."
  },
  {
    "question": "A tiled GEMM computes C = AB with M = 18 rows, N = 8 columns and reduction width K = 32. In the first 16-wide panel, the thread for C[19, 2] stages A[19, 2] and B[3, 2]. The thread for C[17, 2] reads that B slot. All threads stay in the loop, and the next panel reuses the same shared tiles. How should the thread for C[19, 2] stage its inputs and synchronize?",
    "options": [
      "Zero-fill both shared slots. Reach the block barriers after loading and after computing.",
      "Zero-fill A and load B. Reach only the block barrier after loading.",
      "Zero-fill both shared slots. Reach only the block barrier after loading.",
      "Zero-fill A and load B. Reach the block barriers after loading and after computing."
    ],
    "answer": "Zero-fill A and load B. Reach the block barriers after loading and after computing.",
    "explanation": "Row 19 lies outside A and C. This thread zero-fills its shared A slot and skips its final C store. B[3, 2] is in bounds. Zero-filling its slot would discard an operand for C[17, 2]. Stopping after the load barrier leaves an active thread out of the barrier after computing. That second barrier keeps the next panel's writes from overtaking reads of the current panel."
  },
  {
    "question": "An accelerator peaks at 180 TFLOP/s and 0.9 TB/s. What is its ideal HBM roofline knee?",
    "options": [
      "20 FLOP/B from 180 divided by nine.",
      "0.005 FLOP/B from bandwidth divided by compute.",
      "200 FLOP/B from 180 divided by 0.9.",
      "162 FLOP/B from multiplying compute and bandwidth."
    ],
    "answer": "200 FLOP/B from 180 divided by 0.9.",
    "explanation": "The knee is peak compute divided by bandwidth: 180 × 10^12 / (0.9 × 10^12) = 200 FLOP/B. It is a ceiling relation, not a measured kernel bottleneck."
  },
  {
    "question": "Two independent warp groups read a panel from shared slot P. The copy into P completes at step 2. One group issues an asynchronous matrix multiply at step 3 and finishes reading P at step 9. The other issues at step 5 and finishes reading P at step 7. A copy into a separate slot Q completes at step 11. At which step can a new copy first overwrite P?",
    "options": [
      "Step 5",
      "Step 11",
      "Step 2",
      "Step 9"
    ],
    "answer": "Step 9",
    "explanation": "The reads of P finish at steps 9 and 7. Both are complete at step 9, so the writer can reuse P then. Step 2 makes the panel available to its readers. At step 5 the second multiply has just issued and both still need P. Waiting for step 11 would leave P idle for two steps while the copy into Q finishes."
  }
]
```

> **Next:** Continue to [Low-Precision GPU Programming](/learn/low-precision-gpu-programming). A wrong address, a bank conflict, and an accumulator that rounds away a small update are three different bugs. Low-precision programming is where those dtypes, scales, and error checks become the whole problem.
