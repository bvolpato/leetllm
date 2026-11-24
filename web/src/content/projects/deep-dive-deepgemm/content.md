---
{
  "id": "deep-dive-deepgemm",
  "title": "Deep Dive - DeepGEMM",
  "slug": "deep-dive-deepgemm",
  "section": "Project Deep Dives",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 5,
  "coverImage": "illustrations/_generated/sm100_tile_path_dark.png",
  "shortDescription": "Four expert groups hold 416 useful rows, yet alignment can reserve 640. DeepGEMM is the kernel library that makes the padding, scale, and Mega MoE overlap choice explicit.",
  "keyConceptsTested": [
    "FP8 and FP4 GEMM layouts",
    "SM90 versus SM100 execution paths",
    "TMA, TMEM, and tcgen05",
    "UE8M0 versus FP32 scales",
    "Shape-specialized runtime JIT",
    "Grouped MoE GEMM alignment",
    "MQA indexer scoring",
    "Mega MoE communication-compute overlap",
    "Benchmark interpretation and hardware constraints"
  ],
  "prerequisites": [
    "inference-mechanics-ttft-tps-kv-cache",
    "mixture-of-experts-architecture",
    "scaled-dot-product-attention",
    "model-parallelism-for-llm-inference"
  ],
  "relatedQuestions": [
    "flashattention-memory-efficient-attention",
    "deep-dive-flashinfer",
    "deep-dive-megatron"
  ],
  "companies": [
    "DeepSeek AI",
    "NVIDIA"
  ]
}
---

Four experts receive `[64, 192, 32, 128]` token rows: 416 useful rows in total. Rounding each expert's segment up to a multiple of 128 reserves 640 rows instead. Should a kernel pay for 224 rows of alignment padding inside one grouped launch, or issue four separate small matrix multiplications? Separate launches skip cross-expert padding, yet they still suffer edge tiles and repeated launch overhead. Counting FLOPs alone cannot decide which path is faster.

This is the feed-forward counterpart to the previous chapter's irregular attention workload. In a <span data-glossary="mixture-of-experts">mixture-of-experts (MoE)</span> layer, every GPU rank runs its local experts on whichever routed tokens arrive on that step. **DeepGEMM** is DeepSeek's focused <span data-glossary="cuda">CUDA</span> library for those hot loops. It provides dense and grouped <span data-glossary="gemm">GEMM</span> <span data-glossary="cuda-kernel">kernels</span>, low-bit FP8 and FP4 layouts, <span data-glossary="multi-query-attention">multi-query attention (MQA)</span> scoring for DeepSeek's lightning indexer, and **Mega MoE**, which fuses expert-parallel communication with expert compute over NVLink.[^deepgemm2026repo] Serving frameworks sit above it, owning request queues, <span data-glossary="token-budget">token budgets</span>, and HTTP routing.

Throughout this deep dive, we will keep the DeepSeek-V4-Flash shape in view: 256 routed experts, top-k 6, hidden size 4096, and intermediate size 2048. Under eight-way expert parallelism (EP8), each rank owns 32 experts; our four-expert `[64, 192, 32, 128]` example isolates the packing mechanics on a clean subset.[^deepgemm2026benchmarks]

<!-- leetllm: edition:reference:start -->

## Project identity and scope

DeepGEMM is published and maintained by DeepSeek AI under the MIT license (`deepseek-ai/DeepGEMM`).[^deepgemm2026repo][^deepgemm2026license]

| Field | Project detail |
| --- | --- |
| Origin and steward | DeepSeek AI (`deepseek-ai/DeepGEMM`) |
| Credited contributors | Chenggang Zhao, Zhean Xu, Liang Zhao, Jiashi Li, Chenhao Xu, Anyi Xu, Shengyu Liu, Kexing Zhou, and Kuai Yu[^deepgemm2026repo] |
| Source license | MIT (`LICENSE`)[^deepgemm2026license] |
| Scope | Focused tensor-core kernel library, separate from DeepSeek model weights and hosted APIs[^deepgemm2026mega] |

DeepGEMM borrows idioms from CUTLASS and CuTe while keeping a deliberately small public API. That narrow surface keeps every generated kernel inspectable, while leaving layout preparation, casting, and batch scheduling to the caller:

| Layer | DeepGEMM owns | Caller owns |
| --- | --- | --- |
| Tensor math | Dense/grouped GEMM, <span data-glossary="multi-query-attention">MQA</span> logits, fused Mega MoE | Model graph and layer ordering |
| Device schedule | Tile sizes, persistent task order, barriers, ring buffers | Request batching and <span data-glossary="token">token</span> scheduling |
| Data layout | Required <span data-glossary="fp8">FP8</span>, FP4, <span data-glossary="bf16">BF16</span>, and scale layouts | Casting, transposition, padding, <span data-glossary="quantization">quantization</span> |
| Compilation | Shape- and architecture-specialized JIT modules | <span data-glossary="cuda">CUDA</span> toolchain, process launch, cache lifecycle |
| Measurement | Unit correctness tests and shape microbenchmarks | End-to-end <span data-glossary="slo">SLOs</span> and production traffic mix |

### What callers actually use it for

Four kernel families target distinct bottlenecks along a transformer layer:

1. **Dense projections:** BF16 and low-bit GEMMs for attention and dense feed-forward blocks.
2. **Grouped MoE GEMMs:** Contiguous layouts for prefill/training and masked layouts for CUDA-graph decode.
3. **Indexer MQA scoring:** Non-paged and paged low-bit weighted-ReLU scoring for DeepSeek's lightning indexer.[^deepseek2025v32][^deepgemm2026mega]
4. **Mega MoE:** Fused dispatch, linear 1, <span data-glossary="swiglu">SwiGLU</span>, linear 2, and combine overlapping <span data-glossary="nvlink">NVLink</span> transfers with tensor-core compute.[^deepgemm2026mega]

## Research foundations and source trail

| Layer | Source | Question it answers |
| --- | --- | --- |
| Model architecture | DeepSeek-V3 and V4 technical reports[^deepseekv3_2024][^deepseek2026v4paper] | Why active-token compute diverges from total expert weights, and which `(M, N, K)` shapes arise |
| Indexer scoring | DeepSeek-V3.2 report[^deepseek2025v32] | Why MQA scoring uses range-aware low-bit weighted ReLU logits |
| Kernel implementation | DeepGEMM repository[^deepgemm2026repo] | Supported layouts, dtypes, SM90/SM100 paths, and API signatures |
| Fused distributed path | Mega MoE release and benchmark PRs[^deepgemm2026mega][^deepgemm2026benchmarks] | How NVLink overlap is scheduled and benchmarked on EP8 |

<!-- leetllm: edition:reference:end -->

## GEMM first: mathematical interface and mechanics

General matrix-matrix multiplication computes $D = C + A B$. DeepGEMM's primary **NT** interface (non-transposed $A$, transposed $B$) computes:

$$
D = C + A B^{\top}
$$

Here $A$ has shape $[M, K]$, $B$ has shape $[N, K]$, and $D$ has shape $[M, N]$. Storing $B$ as $[N, K]$ makes both $A$ and $B$ contiguous along the reduction dimension $K$, so each output cell is a <span data-glossary="dot-product">dot product</span> of one row of $A$ with one row of $B$. For example, pairing $A$ rows `[1, 2]` and `[0, -1]` with $B$ row `[3, 4]` produces $1\cdot 3 + 2\cdot 4 = 11$ and $0\cdot 3 + (-1)\cdot 4 = -4$.

Each output element takes $K$ multiply-add pairs, or $2MNK$ FLOPs across the matrix. A single $M=512, N=4096, K=4096$ GEMM performs $17.18$ billion FLOPs; finishing it in $10\ \mu\text{s}$ requires $1{,}718\ \text{TFLOP/s}$. Yet raw FLOPs only measure arithmetic. Actual latency depends on global-memory loads, shared-memory staging, scale-factor bandwidth, register or tensor-memory capacity, barriers, and whether $M$ is large enough to fill <span data-glossary="tensor-core">tensor cores</span>.

## Read the performance ladder before the kernel

Three implementation tiers explain why modern GEMM kernels look so different from textbook triple loops:

1. **Naïve thread-per-element:** Every thread computes one element of $D$ by walking all $K$ entries in global memory. Each element of $A$ and $B$ is reloaded redundantly across threads, saturating HBM bandwidth immediately.
2. **Shared-memory tiling:** Each thread block owns an output rectangle of $D$, stages matching $A$ and $B$ tiles into shared memory, and accumulates partial sums in registers across the $K$ loop. Because shared memory and registers are finite, oversized tiles can reduce active blocks or spill registers into slow off-chip local memory.[^cudaBestPractices2026]
3. **Tensor-core pipelines:** Specialized matrix-multiply-accumulate (MMA) hardware consumes architecture-specific operand layouts and carries FP32 accumulators across $K$ tiles before writing $D$. DeepGEMM's TMA, TMEM, and `tcgen05` pipeline implements this third tier explicitly for Blackwell (SM100).[^cudaProgrammingGuide2026][^deepgemm2026repo]

Workload shape decides how high up that ladder you can climb. At $M=1$, most of an output tile sits empty, so launch overhead and weight bandwidth dominate; at $M=512$, data reuse keeps tensor-core pipelines fed. Before profiling speed, verify numerical outputs against a reference (including single-token, ragged, edge-tile, and scale corner cases) and run NVIDIA Compute Sanitizer to catch misaligned accesses or shared-memory hazards.[^computeSanitizer2026]

### Precision and scaling

DeepGEMM trades operand bit width for bandwidth and tensor-core throughput:
- **<span data-glossary="fp8">FP8</span> (E4M3):** 4 exponent bits, 3 mantissa bits, standard for activations and FP8 weights.
- **FP4 (E2M1):** packed two values per byte for expert weights on SM100.
- **<span data-glossary="bf16">BF16</span>:** 16-bit format matching FP32 exponent range, accumulated in FP32 inside tensor-core paths.[^deepgemm2026repo]

Low-bit formats require block scale factors stored in architecture-specific layouts. On SM90 (Hopper), FP8 paths typically pair K-group 128 with FP32 scales. On SM100 (Blackwell), native FP8×FP4 paths pack four **UE8M0** scales (unsigned power-of-two 8-bit exponents with no mantissa) into one 32-bit `torch.int`, using K-group 32 or 128. Because the <span data-glossary="tma">Tensor Memory Accelerator (TMA)</span> stages multidimensional tiles directly into shared memory, both value and scale tensors must satisfy strict <span data-glossary="stride">stride</span> and alignment rules.

| Input path | Value format | Scale representation | Key layout detail |
| --- | --- | --- | --- |
| SM90 FP8 GEMM | FP8 A and B | FP32 scales (K-group 128) | NT layout and TMA alignment |
| SM100 FP8 × FP4 GEMM | FP8 E4M3 A, packed FP4 E2M1 B | Packed UE8M0 int32 scales (K-group 32 or 128) | Major layout and packed width |
| BF16 GEMM | BF16 A and B | None | FP32 accumulator and tile shape |
| Mega MoE (FP8 × FP4) | FP8 activations, FP4 weights | Per-32 packed UE8M0 scales | Symmetric buffer and expert alignment |

Helpers like `transform_sf_into_required_layout` convert scales in Python, yet standalone casts and transposes can easily eat into kernel savings. Fuse casting and scale layout conversion into the preceding layer whenever profiling shows preparation overhead.

### Why a scale belongs inside the K reduction

Because each K-group carries its own dynamic range, scale factors cannot wait until the end of the dot product. Take stored rows $a = [1, 2, 3, 4]$ and $b = [2, 1, -1, 2]$ split into two K-groups of width 2, with scales $s_a = [0.5, 2]$ and $s_b = [2, 0.25]$. Group 0 has raw dot $4$ and scale product $1$; group 1 has raw dot $5$ and scale product $0.5$. Summing the scaled partial dots yields $4 \cdot 1 + 5 \cdot 0.5 = 6.5$, matching explicit dequantization and differing sharply from the unscaled dot $9$:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="block_scaled_dot.py"
import numpy as np


def scaled_dot(a: np.ndarray, b: np.ndarray, sa: np.ndarray, sb: np.ndarray, group: int) -> float:
    if group <= 0 or a.size != b.size or a.size % group:
        raise ValueError("equal row lengths must be divisible by group")
    if sa.size != a.size // group or sb.size != sa.size:
        raise ValueError("one scale per K group is required")
    block_dots = (a.reshape(-1, group) * b.reshape(-1, group)).sum(axis=1)
    return float(block_dots @ (sa * sb))


a = np.array([1.0, 2.0, 3.0, 4.0], dtype=np.float64)
b = np.array([2.0, 1.0, -1.0, 2.0], dtype=np.float64)
sa = np.array([0.5, 2.0], dtype=np.float64)
sb = np.array([2.0, 0.25], dtype=np.float64)
grouped = scaled_dot(a, b, sa, sb, 2)
dequantized = float((a * np.repeat(sa, 2)) @ (b * np.repeat(sb, 2)))
assert np.isclose(grouped, dequantized) and grouped == 6.5
assert grouped != float(a @ b)
print("groupwise", grouped, "dequantized", dequantized)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
groupwise 6.5 dequantized 6.5
```
<!-- leetllm: output:end -->

## Two architectures, two execution profiles

DeepGEMM treats **SM90 (Hopper)** and **SM100 (Blackwell)** as separate hardware targets rather than hiding them behind generic iterators. Its C++ dispatch layer inspects device capability, operand major layout, scale dtype, and output shape, then routes directly to an architecture-specific kernel.[^cudaProgrammingGuide2026][^deepgemm2026repo]

On SM90, the primary FP8 GEMM targets NT layout with FP32 scales. On SM100, FP8×FP4 kernels support NT, TN, NN, and TT variants with packed UE8M0 scales, and Mega MoE targets SM100 exclusively. No tile-size tuning can make an SM100 FP4 kernel execute on SM90; always gate dispatch on `torch.cuda.get_device_capability()`, scale dtype, and major layout.

<figure>
  <img src="illustrations/_generated/sm100_tile_path_dark.png" alt="SM100 block-scaled GEMM stages operands and scales in shared memory. Scale factors copy to TMEM while operands stream from SMEM into Tensor Cores." />
  <figcaption>Follow the scales as well as A and B. In this SM100 block-scaled path, TMEM holds both scale factors and accumulators, so scales require a shared-to-TMEM copy before tcgen05 consumes them.</figcaption>
</figure>

## Inside an SM100 tile

Tracing one tile through Blackwell hardware makes every alignment check and barrier make sense. Operands and scales move through three distinct memory tiers, each with its own lifetime and ordering rule.

### TMA moves the right rectangle

The Tensor Memory Accelerator copies multidimensional tiles from global memory into shared memory using hardware descriptors that encode shape and stride. Offloading address arithmetic lets the copy engine prefetch the next $K$ tile asynchronously while tensor cores compute on the current tile.[^cudaBestPractices2026][^cudaProgrammingGuide2026]

The price of descriptor-based copies is strict stride alignment. A PyTorch `.transpose()` view can represent the right mathematical matrix while violating TMA's alignment requirements; materialize the required major layout explicitly before calling the kernel.

### TMEM holds accumulators and block scales

**TMEM (tensor memory)** is dedicated SM100 on-chip memory directly attached to `tcgen05` MMA instructions. In DeepGEMM's block-scaled path, TMEM holds *both* FP32 accumulators and block scale factors. After TMA loads scales into shared memory, an explicit shared-to-TMEM copy places them where the MMA instruction expects them.[^deepgemmPinned2026][^nvidiaPtxTcgen2026] Global memory stores model tensors, shared memory buffers TMA tiles, and TMEM feeds active MMA accumulators and scales.

### tcgen05 issues MMA work

SM100 kernels invoke `tcgen05` MMA instructions via CUTLASS and PTX helpers, consuming operands from shared memory and scales from TMEM while accumulating into TMEM. Once the $K$ loop completes, the epilogue converts accumulators and writes $D$. <span data-glossary="cuda-warp">CUDA warps</span> coordinate TMEM allocation, TMA barriers, scale copies, and asynchronous MMA completion using instruction-specific commit semantics rather than generic thread-local fences.

| Resource | Role in one tile | Typical failure symptom |
| --- | --- | --- |
| Global memory | Source `A`, `B`, `C`, and scale tensors | Bandwidth drop or stride assertion |
| Shared memory | TMA staging and epilogue buffers | Barrier hang or overwritten stage |
| TMEM | `tcgen05` accumulators and block scales | Race or silent numerical corruption |
| Tensor core | Block-scaled MMA execution | Low utilization on tiny `M` or poor tile |
| Host JIT cache | Compiled CUBIN and metadata | Cold-start compile spike or stale entry |

## The runtime JIT and shape signature

Because tile dimensions, scale granularity, architecture flags, and epilogue options all change emitted machine code, DeepGEMM compiles specialized CUBINs on demand at runtime instead of shipping an exhaustive static binary matrix.[^deepgemm2026repo]

```text
kernel signature = name + compiler + flags + generated source
cache key        = digest(kernel signature)
cache hit        = load existing cubin
cache miss       = compile temporary cubin, publish atomically
```

Compilation writes into a temporary directory and atomically renames it into the cache so concurrent ranks sharing a filesystem never load a half-written CUBIN (though they may still duplicate compilation on simultaneous cold misses).[^deepgemmPinned2026] Callers can keep dynamic dimensions out of the key with `set_ignore_compile_dims` and pre-warm only the signatures their workload actually exercises.

### What belongs in a signature

Every choice that alters generated code or ABI belongs in the digest: SM architecture, tile sizes, scale granularity, dense vs. grouped mode, activation, and <span data-glossary="feature-flag">feature flags</span> like Programmatic Dependent Launch (PDL). Leaving out any code-affecting flag risks reusing an incompatible binary. Diagnostic switches (`DG_JIT_DEBUG`, `DG_JIT_PRINT_COMPILER_COMMAND`, `DG_JIT_DUMP_PTX`, `DG_JIT_DUMP_SASS`) help during bring-up but should stay off in production launchers to avoid log and disk bloat.

### The September DeepJIT migration

Newer DeepGEMM releases delegate runtime compilation to the embedded **DeepJIT** submodule (`csrc/runtime/jit.hpp`) using its NVCC CUDA backend and a CUTLASS-version dependency signature, replacing the older in-tree compiler.[^deepgemm2026OctoberSnapshot]

| Migration detail | DeepJIT behavior |
| --- | --- |
| Default cache root | `$HOME/.dj` (replaces `$HOME/.deep_gemm`) |
| Multiple cache roots | `DG_JIT_CACHE_DIR` accepts colon-separated paths; searches in order and writes misses to the first |
| Config precedence | Unset `DG_JIT_*` variables fall back to `DJ_JIT_*` |
| Local-memory and spill checks | `DG_JIT_CHECK_NO_LOCAL_MEMORY=1` and `DG_JIT_CHECK_NO_SPILLS=1` replace `DG_JIT_PTXAS_CHECK=1` |

DeepJIT's cache digest tracks compiler output, effective flags, tracked headers/source, dependency signature, and post-hook identity, while external environment overrides like `CPATH` or `NVCC_APPEND_FLAGS` must be versioned explicitly by the deployment. Because PTX/SASS dump flags do not alter the cache digest and run only during a miss, enabling dumps against a warm cache produces no new dump until compilation actually occurs.[^deepjit2026Cache]

```checkpoint
Why is a JIT cache key more than a shape tuple like (M, N, K)?
---
Architecture, compiler flags, tile options, scale format, activation, and layout all alter the generated CUBIN even when M, N, and K stay identical.
```

## Grouped GEMM: the MoE shape problem

In an MoE layer, each expert receives a different number of tokens while sharing the same weight widths $N$ and $K$. DeepGEMM supports three grouped modes tailored to training, prefill, and decode:

| Grouped mode | Counts known on CPU? | Layout | Primary workload |
| --- | --- | --- | --- |
| Contiguous | Yes | Concatenated $M$ segments with alignment | Training and prefill |
| Masked | No | Fixed padded $M$ per expert plus validity mask | Decode inside CUDA graphs |
| K-grouped backward | Yes | Fixed $M, N$ with grouped $K$ segments | MoE weight <span data-glossary="gradient">gradients</span> |

In contiguous mode, the caller packs every expert's tokens into one concatenated $M$ axis, padding each segment to the multiple returned by `get_mk_alignment_for_contiguous_layout()` (default `128`). Note that `get_theoretical_mk_alignment_for_contiguous_layout()` can return `256` on SM100, which would reserve 1,024 rows instead of 640 on our four-expert example; prefer the configured alignment for small expert groups.[^deepgemm2026OctoberSnapshot] In masked mode, CUDA graphs fix tensor shapes up front while the GPU skips rows beyond each expert's runtime count without a host sync.

### Worked routing example

Take four experts from our Flash-shaped rank receiving `[64, 192, 32, 128]` routed rows ($H=4096$, $I=2048$). With alignment `128`, padded segment capacities become `[128, 256, 128, 128]`: `416` useful rows inside `640` reserved rows. Linear 1 computes gate and up projections ($2 M H (2I)$ FLOPs) and linear 2 projects back ($2 M I H$ FLOPs), totaling $6 M H I$ FLOPs:

<!-- leetllm: test, output=show -->
```python title="grouped_pack.py"
def align_up(value: int, alignment: int) -> int:
    if value < 0 or alignment <= 0:
        raise ValueError("nonnegative row count and positive alignment required")
    return ((value + alignment - 1) // alignment) * alignment


alignment = 128
valid_counts = [64, 192, 32, 128]
padded_counts = [align_up(count, alignment) for count in valid_counts]
assert padded_counts == [128, 256, 128, 128]

valid_rows = sum(valid_counts)
padded_rows = sum(padded_counts)
assert valid_rows == 416
assert padded_rows == 640

hidden = 4096
intermediate = 2048


def routed_flops(token_rows: int) -> int:
    return 2 * token_rows * hidden * intermediate * 3


useful = routed_flops(valid_rows)
padded = routed_flops(padded_rows)
assert useful == 20_937_965_568
assert padded == 32_212_254_720
print("valid rows", valid_rows)
print("padded rows", padded_rows)
print("useful GFLOPs", round(useful / 1e9, 2))
print("padded GFLOPs", round(padded / 1e9, 2))
print("padding share", round((padded - useful) / padded, 3))
print("overhead vs useful", round((padded - useful) / useful, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
valid rows 416
padded rows 640
useful GFLOPs 20.94
padded GFLOPs 32.21
padding share 0.35
overhead vs useful 0.538
```
<!-- leetllm: output:end -->

> **Key insight:** Notice the two denominators: 224 padding rows equal `35.0%` of the 640 reserved rows, or `+53.8%` overhead relative to the 416 useful rows. Even with that padding tax, one persistent grouped kernel can beat four separate launches by amortizing launch latency and keeping tensor-core tiles busy. Always measure total wall time alongside useful-token throughput.

## MQA logits for the DeepSeek indexer

DeepSeek-V3.2's lightning indexer scores each query token against a span of compressed KV tokens to decide which context positions deserve full attention. DeepGEMM fuses key dequantization, multi-head dot products, ReLU clipping, and per-head weighting into one kernel:[^deepseek2025v32]

$$
s_{ij} = \sum_h \operatorname{ReLU}\!\left(q_{i,h} \cdot (k_j \cdot \operatorname{scale}_j)\right)\, w_{i,h}
$$

Work one score by hand: take two query heads $(1, 0)$ and $(0, 1)$, head weights $0.4$ and $0.6$, stored key $(2, -1)$, and scale $0.5$. The dequantized key is $(1, -0.5)$, giving head dots $1.0$ and $-0.5$. ReLU zeroes the negative head, leaving $1.0 \cdot 0.4 + 0 \cdot 0.6 = 0.4$:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="mqa_logit.py"
import numpy as np

q_heads = np.array([[1.0, 0.0], [0.0, 1.0]], dtype=np.float64)
weights = np.array([0.4, 0.6], dtype=np.float64)
kv = np.array([2.0, -1.0], dtype=np.float64)
scale = 0.5
dequant = kv * scale
assert tuple(dequant.tolist()) == (1.0, -0.5)

dots = q_heads @ dequant
assert dots.tolist() == [1.0, -0.5]
score = float(np.maximum(dots, 0.0) @ weights)
assert abs(score - 0.4) < 1e-12
print("dequant k", tuple(dequant.tolist()))
print("head dots", dots.tolist())
print("logit", score)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dequant k (1.0, -0.5)
head dots [1.0, -0.5]
logit 0.4
```
<!-- leetllm: output:end -->

DeepGEMM exposes non-paged scoring for prefill and block-table paged scoring for decode, letting the indexer read the same fragmented KV cache used by serving engines like FlashInfer. Because negative head weights can yield valid negative logits, zero-filled slots outside a query's valid key span must be masked to $-\infty$ (never left at `0.0`) before top-k selection, and empty valid spans must return no keys:

<!-- leetllm: test, output=show -->
```python title="indexer_bounds.py"
scores = [0.0, -0.4, -0.2]  # position 0 is an invalid, zero-filled slot
start, end = 1, 3
wrong = max(range(len(scores)), key=scores.__getitem__)
clean = [score if start <= j < end else float("-inf")
         for j, score in enumerate(scores)]
chosen = max(range(start, end), key=clean.__getitem__)
assert wrong == 0 and chosen == 2
assert max(range(len(clean)), key=clean.__getitem__) == chosen
print("unmasked choice", wrong, "valid choice", chosen)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unmasked choice 0 valid choice 2
```
<!-- leetllm: output:end -->

### September 30 migration: compressed columns need source offsets

The updated `fp8_fp4_mqa_logits` API takes a positive `max_seqlen_k` and outputs `[query_rows, max_seqlen_k]`, removing `clean_logits` and `logits_dtype` as well as the legacy `fp8_mqa_logits` exports.[^deepgemm2026September30Release][^deepgemm2026OctoberSnapshot] Each row's valid span starts at compressed column `0`, so column `c` corresponds to cache token `cu_seq_len_k_start[i] + c`, and trailing columns past `end - start` are unwritten.

Two subtle bugs occur if the caller skips span mapping: picking an unwritten trailing slot, or returning raw column `1` instead of cache position `40 + 1 = 41` for span `[40, 42)`. Always slice to `end - start` and add `start`:

<!-- leetllm: test, output=show -->
```python title="compressed_indexer_selection.py"
def select_cache_positions(row, start, end, k):
    if not 0 <= start <= end or k < 0 or end - start > len(row):
        raise ValueError("invalid span, selection count, or output width")
    columns = sorted(range(end - start), key=row.__getitem__, reverse=True)
    return [start + c for c in columns[:k]]


compressed = [0.2, 0.9, 99.0]  # last slot is outside the valid span
wrong_column = max(range(len(compressed)), key=compressed.__getitem__)
selected = select_cache_positions(compressed, 40, 42, 1)
assert wrong_column == 2 and selected == [41]
assert select_cache_positions(compressed, 40, 40, 1) == []
assert select_cache_positions(compressed, 40, 42, 8) == [41, 40]
try:
    select_cache_positions(compressed, 40, 44, 1)
except ValueError:
    pass
else:
    raise AssertionError("span exceeds the compressed output")
print("unmasked compressed column", wrong_column)
print("valid cache positions", selected)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unmasked compressed column 2
valid cache positions [41]
```
<!-- leetllm: output:end -->

Hardware input formats diverge here too: SM100 expects MXFP8/MXFP4 with packed UE8M0 query/key scales, 16-byte-aligned BF16 head weights, and BF16 logits (with variable-length `indices` and `next_n=1` in paged mode), whereas SM90 retains non-MX FP8 with FP32 weights and logits.[^deepgemm2026September30Release]

### Sparse scoring isn't a drop-in dense result

Sparse indexer variants add a block-selection table where each query's valid prefix lists unique, strictly increasing absolute KV blocks. Output width becomes `num_max_sparse_blocks * sparse_block_kv` rather than full sequence length, so downstream top-k selection must translate compressed column indices back through the sparse block map before indexing the KV cache.[^deepgemm2026OctoberSnapshot]

## Mega MoE: overlap communication and compute

Standard MoE inference serializes dispatch, linear 1, SwiGLU, linear 2, and combine across separate kernel launches. **Mega MoE** fuses all five stages into a single persistent SM100 kernel backed by <span data-glossary="pytorch">PyTorch</span> symmetric memory, letting ranks overlap NVLink dispatch and combine for one chunk with tensor-core compute on another.[^deepgemm2026mega]

<figure>
  <img src="illustrations/_generated/mega_moe_overlap_dark.png" alt="Two-chunk dependency-preserving pipeline finishes in six abstract slots, versus eight serial slots. Dispatch B overlaps compute A; combine A overlaps compute B." />
  <figcaption>Overlap runs across independent chunks while preserving each chunk's internal dependencies: D is dispatch, F is linear 1 + SwiGLU + linear 2, and C is combine.</figcaption>
</figure>

When one chunk takes 1 dispatch slot, 2 compute slots, and 1 combine slot, two serial chunks take 8 slots. Pipelining dispatch B beneath compute A and combine A beneath compute B finishes both chunks in 6 slots, provided communication and compute resources stay independent and at least two chunks are ready. This specialized NVLink fusion complements general collectives like NCCL (the subject of the next chapter).

### Persistent scheduling and ring reuse

A persistent grid keeps thread blocks resident on SMs, claiming communication and GEMM tasks from a fixed-capacity symmetric ring buffer holding tokens, scales, routing metadata, and intermediate activations. Ring slots cannot be overwritten by a new dispatch until all consuming linear-2 blocks signal completion. Violating that slot-release rule causes silent data races that look like intermittent accuracy glitches rather than clean CUDA errors.

### Symmetric memory interface

Callers allocate a `SymmBuffer` across the EP process group via PyTorch symmetric memory, transform expert weights (interleaving gate and up rows), copy activations and routing inputs into typed views of the buffer, and invoke `fp8_fp4_mega_moe` (or `mma_type='fp8xfp8'` for FP8 weights, plus a BF16 variant).[^deepgemm2026mega][^deepgemm2026OctoberSnapshot] The low-bit FP8×FP4 path asserts `recipe=(1, 1, 32)` (K-group 32 UE8M0 scales) on SM100.[^deepgemmPinned2026]

```python title="mega_moe_call.py"
# Allocate SymmBuffer, transform weights, and populate routing views before launch.
buffer = deep_gemm.get_symm_buffer_for_mega_moe(
    group, num_experts, max_tokens_per_rank, topk, hidden, intermediate_hidden
)
transformed_l1, transformed_l2 = deep_gemm.transform_weights_for_mega_moe(
    l1_weights, l2_weights
)
deep_gemm.fp8_fp4_mega_moe(y, transformed_l1, transformed_l2, buffer)
```

### Current locality and epilogue choices

Two SM100 extensions refine placement and output rounding:

- **Weight localization:** `deep_gemm.localize` partitions a weight dimension across GPU locality domains and probes for a stable SM mapping (falling back to even mapping with a warning if unstable). All routed L1/L2 weights and optional shared-expert weights must match localization settings.[^deepgemm2026OctoberSnapshot]
- **Epilogue classes:** `deep_gemm.epilogue` selects one mutually exclusive mode per GEMM: `Identity`, `Alpha`, `FP8Quantization`, or opt-in `BF16StochasticRounding` (which requires direct BF16 output with no `C` accumulation input).[^deepgemm2026OctoberSnapshot][^deepgemm2026September30Release]

<!-- leetllm: edition:reference:start -->

## Read the Mega MoE benchmark as a bounded experiment

DeepGEMM's EP8 benchmark compares Mega MoE against an unfused dispatch + GEMM + SwiGLU + combine baseline across two DeepSeek-V4 shapes, averaging across eight ranks.[^deepgemm2026benchmarks]

### DeepSeek-V4-Flash shape

256 experts, top-k 6, hidden 4096, intermediate 2048 (`Tokens per rank` counts source tokens before top-6 routing):

| Tokens per rank | Mega MoE time | Compute | Global memory | Interconnect | Speedup vs legacy |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 56.5 µs | 5 TFLOPS | 1311 GB/s | 1 GB/s | 1.96x |
| 512 | 146.5 µs | 1056 TFLOPS | 3192 GB/s | 266 GB/s | 1.73x |
| 8192 | 1283.1 µs | 1928 TFLOPS | 998 GB/s | 499 GB/s | 1.56x |
| 32768 | 4855.5 µs | 2038 TFLOPS | 794 GB/s | 529 GB/s | 1.62x |

### DeepSeek-V4-Pro shape

384 experts, top-k 6, hidden 7168, intermediate 3072:

| Tokens per rank | Mega MoE time | Compute | Global memory | Interconnect | Speedup vs legacy |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 108.1 µs | 7 TFLOPS | 1758 GB/s | 1 GB/s | 1.61x |
| 512 | 369.6 µs | 1098 TFLOPS | 4619 GB/s | 182 GB/s | 1.54x |
| 8192 | 2818.5 µs | 2304 TFLOPS | 1094 GB/s | 393 GB/s | 1.50x |
| 32768 | 10655.2 µs | 2438 TFLOPS | 692 GB/s | 417 GB/s | 1.54x |

At 512 source tokens per rank under EP8, the node processes $512 \times 8 = 4{,}096$ tokens and $24{,}576$ token-expert assignments, averaging $3{,}072$ received rows per rank. Note that the Compute, Global memory, and Interconnect columns report algorithmic work divided by elapsed time rather than hardware counters: $6 \times 3072 \times 4096 \times 2048 / 146.5\ \mu\text{s} \approx 1{,}055\ \text{TFLOP/s}$, matching the rounded 1,056 TFLOPS entry.[^deepgemmPinned2026]

```checkpoint
What does the 1.96x Mega MoE result show at 1 token per rank, and what still needs measurement on your cluster?
---
At 1 Flash-shaped token per rank, Mega MoE took about 51% of the unfused baseline's time (a 49% latency reduction). Because hardware SKU, clocks, topology, and surrounding preparation stages vary, benchmark full-layer latency on your target cluster and routing histogram.
```

### Turn timing into a diagnosis

Start with **Nsight Systems** to see process-wide timelines: JIT compilation, host launches, memory copies, casts, and stream stalls. Then zoom into one kernel with **Nsight Compute** (Launch Statistics, SpeedOfLight, Memory Workload Analysis, and warp scheduler stalls), enabling `DG_JIT_WITH_LINEINFO=1` for source mapping.[^nsightSystems2026][^nsightCompute2026] Keep unprofiled synchronized timings separate from Nsight Compute replays, and pair Mega MoE traces with your actual routing histogram and padded-row counts.

## Strengths and weaknesses

### Strengths

- **Shape-specialized JIT:** Compiles tight SM90/SM100 tile, scale, and epilogue paths instead of generic fallback loops.
- **Inspectable surface:** A small Python-to-C++-to-CUDA stack makes every check and barrier readable.
- **Model-specific fusion:** Indexer scoring and Mega MoE eliminate intermediate HBM round-trips.
- **Built-in references:** Repository tests validate outputs directly against PyTorch references.

### Weaknesses

- **Narrow hardware target:** Public fast paths target SM90 and SM100, with Mega MoE SM100-only.
- **Strict layout requirements:** Strides, scale packing, and alignment belong to the caller.
- **JIT cold starts:** Unseen shapes incur compilation latency unless pre-warmed.
- **Operational coupling:** Mega MoE requires multi-process symmetric memory, matching PyTorch/CUDA/CUTLASS versions, and C++20 `<format>` host toolchains.

## Validate prerequisites before timing

Current DeepGEMM builds require Python 3.8+, C++20 `<format>`, PyTorch 2.3+ (2.9+ for Mega MoE), CUTLASS 4.0+, CUDA 12.9+ for SM90/SM100, and Linux for DeepJIT.[^deepgemm2026OctoberSnapshot][^deepjit2026Cache]

### Check determinism after an upgrade

`deep_gemm.use_deterministic_algorithms(True)` opts into batch-independent, fixed-split reduction schedules; the default `False` lets kernels pick faster split counts based on SMs and $M$ blocks, which can change floating-point rounding order.[^deepgemm2026SeptemberRelease][^deepgemm2026OctoberSnapshot] Newer releases also add **Mega Gate** (fusing routing GEMM and `sqrtsoftplus` gating) and **Mega mHC** (fusing mixing with RMSNorm); evaluate their outputs and determinism separately.[^deepgemm2026September30Release]

Record eight items with every benchmark: GPU SKU/capability, CUDA/driver versions, PyTorch/CUTLASS versions, kernel mode and scale layout, `(M, N, K)` and token distribution, rank topology, warmup/cache state, and correctness tolerance.

### Shape constraints to expose

Validate model dimensions at startup before entering CUDA graphs or collective barriers:

| Constraint | Why it exists | <span data-glossary="guardrail">Guardrail</span> |
| --- | --- | --- |
| `hidden % 128 == 0` on low-bit Mega paths | Scale and tile packing | Validate model config at startup |
| `intermediate_hidden % 128 == 0` | Expert weight and scale layout | Check every expert block |
| `num_experts % ep_size == 0` | Even local ownership | Assert before process-group launch |
| Contiguous grouped M alignment | Clean tile segments | Pad and preserve segment map |
| K-group 32 UE8M0 scales for FP8 × FP4 Mega MoE | Supported scale granularity | Log `gran_k` in runtime config |
| SM90 or SM100 device | Architecture-specific kernels | Route unsupported GPUs to fallback |

## Diagnose failures from their first symptom

### Wrong output, no crash

Usually caused by scale packing, major layout, or accumulation dtype. Compare a small shape against dequantized PyTorch outputs; on SM100 inspect UE8M0 packing and TMA strides, and in grouped mode verify segment offsets.

### First request is slow

Check for a JIT cache miss by logging kernel signatures and compile durations. Pre-warm expected shapes at startup and keep `DG_JIT_CACHE_DIR` on fast local storage with atomic rename support.

### Mega MoE hangs

Treat hangs as a collective or synchronization mismatch first: verify every rank enters the same group call, buffer sizes match, top-k indices are in range, and symmetric-memory rendezvous succeeded.

### Speedup disappears

Inspect Nsight Systems for casts, transposes, or token packing outside the timed kernel, and compare useful-token throughput against padded capacity.

### Thermal or topology drift

Re-run after warmup with pinned rank placement, fixed clocks, and matched NVLink topology across runs.

## A code-reading route through the repository

Trace one vertical slice from Python API to CUDA kernel (with DeepJIT in `csrc/runtime/jit.hpp` and Mega MoE in `csrc/apis/mega_moe.hpp`):[^deepgemm2026OctoberSnapshot]

1. `README.md`: public APIs, supported architectures, and scale formats.
2. `deep_gemm/__init__.py`: Python entry points and layout transforms.
3. `csrc/apis/gemm.hpp`: shape checks and dense/grouped dispatch.
4. `csrc/runtime/jit.hpp` (or `csrc/jit/compiler.hpp`): signatures, flags, and atomic cache publication.
5. `csrc/jit_kernels/impls/sm100_fp8_fp4_gemm_1d1d.hpp`: host JIT wrapper for one SM100 tile path.
6. `deep_gemm/include/deep_gemm/impls/sm100_fp8_fp4_gemm_1d1d.cuh`: TMA, TMEM, and `tcgen05` stages.
7. `deep_gemm/include/deep_gemm/scheduler/mega_moe.cuh`: persistent task order and ring capacity.
8. `deep_gemm/include/deep_gemm/impls/sm100_fp8_fp4_mega_moe.cuh`: remote loads, grouped GEMMs, barriers, and stores.
9. `tests/test_attention.py` and `tests/test_mega_moe.py`: reference math and shape sweeps.

### What strong answers show

- Derive NT output shapes and $2MNK$ FLOP counts cleanly without confusing whole matrices and tiles.
- Apply K-group scale products inside the reduction and name SM90 vs. SM100 native scale formats.
- Trace `A`, `B`, scales, and accumulators through global memory, shared memory, and TMEM.
- Separate source tokens, routed rows, and padded capacity when reporting throughput.
- Explain two-chunk Mega MoE pipelining and why slot release prevents silent data races.

### Follow-up questions

#### Why might a faster grouped GEMM make the layer slower?

Casting, scale layout conversion, token packing, and output unpacking can cost more than the saved kernel microseconds. Always time the complete MoE layer on the same routing histogram.

#### What if the benchmark prints a time but no correctness result?

Verify that the reference baseline actually imported and ran; otherwise mark the run timing-only and re-run numerical checks on routed counts and outputs before adopting the kernel.

<!-- leetllm: edition:reference:end -->

## Architectural summary

- DeepGEMM is a focused tensor-core kernel library; serving runtimes still own scheduling, batching, and layout preparation.
- SM90 (FP32 scales, NT FP8) and SM100 (packed UE8M0 scales, TMA + TMEM + `tcgen05`, FP8×FP4, Mega MoE) are distinct execution targets.
- Runtime JIT via DeepJIT specializes kernels per architecture, tile, and scale format, making startup warmup and cache hygiene essential.
- Grouped GEMMs handle uneven MoE routing through aligned contiguous segments (prefill/training) or masked layouts (CUDA-graph decode).
- MQA indexer kernels fuse dequantization, ReLU, head weighting, and span/paged lookup, requiring callers to mask unwritten columns and map compressed offsets back to cache positions.
- Mega MoE fuses dispatch, L1/SwiGLU/L2, and combine over symmetric memory so NVLink traffic overlaps tensor-core compute across chunks.

```mastery-quiz
[
  {
    "question": "An NT multiplication uses A with shape [48,64] and stored B with shape [96,64], with no C input. What shape does D have, and about how many floating-point operations does the product take? Count each multiply and add separately.",
    "options": [
      "[96,48] with 294,912 operations",
      "[96,48] with 589,824 operations",
      "[48,96] with 589,824 operations",
      "[48,96] with 294,912 operations"
    ],
    "answer": "[48,96] with 589,824 operations",
    "explanation": "D has one row per row of A (48) and one column per row of B (96), giving shape [48, 96]. Each cell performs 64 multiply-add pairs, or 48 × 96 × 64 × 2 = 589,824 floating-point operations."
  },
  {
    "question": "Stored rows A = [4,−2 | 3,1] and B = [2,1 | 2,−1] use two K groups, separated by the bar. The scale factors in group order are [0.5,2] for A and [4,0.25] for B. What is the scaled dot product?",
    "options": [
      "14.5",
      "11",
      "5.5",
      "22"
    ],
    "answer": "14.5",
    "explanation": "Group 0 contributes (4×2 − 2×1) × (0.5×4) = 6 × 2 = 12. Group 1 contributes (3×2 + 1×−1) × (2×0.25) = 5 × 0.5 = 2.5. Summing both scaled partial dots gives 14.5."
  },
  {
    "question": "Four expert row counts are [65,129,1,0]. Independently round each segment to alignment 64, with zero rows reserving zero. Which reserved total and padding share of reserved capacity result?",
    "options": [
      "320 rows; 39.1% padding.",
      "256 rows; 23.8% padding.",
      "384 rows; 96.9% padding.",
      "384 rows; 49.2% padding."
    ],
    "answer": "384 rows; 49.2% padding.",
    "explanation": "Aligned capacities are [128, 192, 64, 0], totaling 384 rows. With 195 useful rows and 189 padding rows, padding accounts for 189 / 384 ≈ 49.2% of reserved capacity (96.9% divides by useful rows instead)."
  },
  {
    "question": "A compressed row [.2,.8,.7,99] represents cache span [70,73). Select the two highest valid keys. A second row has an empty span [70,70). Which pair of returned lists respects both rules?",
    "options": [
      "First [1,2]; empty [].",
      "First [71,72]; empty [].",
      "First [73,71]; empty [].",
      "First [71,72]; empty [70]."
    ],
    "answer": "First [71,72]; empty [].",
    "explanation": "Only columns 0, 1, and 2 lie inside [70, 73); column 3 is unwritten despite holding 99. The top two valid columns (1 and 2) map to cache positions 70+1 = 71 and 70+2 = 72, and an empty span returns []."
  },
  {
    "question": "A strided [4,3] tensor view has element strides [9,2]. A kernel instead assumes packed row-major strides [3,1]. For logical coordinate [2,1], what offsets from the same base would the view and that kernel use?",
    "options": [
      "View 7; kernel 20.",
      "View 18; kernel 6.",
      "View 11; kernel 7.",
      "View 20; kernel 7."
    ],
    "answer": "View 20; kernel 7.",
    "explanation": "The view reads offset 2×9 + 1×2 = 20 while the packed reader reads 2×3 + 1×1 = 7. Matching logical shapes still require matching strides before a TMA descriptor or kernel can read the tensor."
  },
  {
    "question": "Start with an empty JIT cache. A uses generated source S, flags F and compiler C. B changes a runtime M value but retains S/F/C. C uses S/F2/C. D repeats C and additionally requests a PTX dump. Under the taught tracked-signature and compile-only dump behavior, what happens?",
    "options": [
      "Three compilations and one hit; D creates a new dump.",
      "Two compilations and two hits; D creates a new dump.",
      "Two compilations and two hits; D does not create a missing dump.",
      "Four compilations and zero hits; D does not create a missing dump."
    ],
    "answer": "Two compilations and two hits; D does not create a missing dump.",
    "explanation": "A compiles and B hits because S, F, and C are unchanged. Changing flags to F2 triggers compilation for C, and D hits C's cached entry. Because dump switches do not change the cache digest and only act on compilation, D produces no dump."
  },
  {
    "question": "Two chunks each need dispatch 2, compute 3 and combine 1 abstract time units. Communication and compute are independent single resources, and each chunk preserves that order. What are the earliest completion times with two reusable storage slots, then with one slot leased through combine?",
    "options": [
      "9 units, then 12.",
      "8 units, then 10.",
      "10 units, then 12.",
      "12 units, then 12."
    ],
    "answer": "9 units, then 12.",
    "explanation": "With two slots: dispatch A (0-2), compute A (2-5) overlapped with dispatch B (2-4), combine A (5-6) overlapped with compute B (5-8), and combine B (8-9). With one slot, B waits until A finishes combine at 6, serializing total time to 12."
  },
  {
    "question": "A measured baseline has preparation 20µs and kernel 120µs. Its candidate has preparation 90µs and kernel 80µs; no other stage is present. Which kernel speedup and complete-layer conclusion are correct?",
    "options": [
      "Kernel 0.67×; candidate 170µs versus baseline 140µs, slower.",
      "Kernel 1.5×; candidate 170µs versus baseline 140µs, slower.",
      "Kernel 1.5×; candidate 140µs versus baseline 170µs, faster.",
      "Kernel 1.5×; candidate 80µs versus baseline 120µs, faster."
    ],
    "answer": "Kernel 1.5×; candidate 170µs versus baseline 140µs, slower.",
    "explanation": "The inner kernel is 120 / 80 = 1.5× faster, yet total layer time rises from 140 µs to 170 µs (+21.4%) because preparation jumped from 20 µs to 90 µs."
  },
  {
    "question": "Use FP32 round-to-nearest, ties-to-even at every addition. Let a=33,554,432. What are (a+1)+(−a) and (a+(−a))+1?",
    "options": [
      "1 and 1.",
      "0 and 0.",
      "0 and 1.",
      "1 and 0."
    ],
    "answer": "0 and 1.",
    "explanation": "At 2^25, FP32 spacing is 4, so a + 1 rounds back to a and subtracting a gives 0. Reordering to (a − a) + 1 cancels a first and preserves 1, showing why changing reduction splits alters outputs even with fixed inputs."
  },
  {
    "question": "Token T0 receives expert outputs 3 and 7 with weights 0.25 and 0.75. T1 receives 2 and 8 with weights 0.6 and 0.4. In token order [T0,T1], run A returns [4.4,6] and run B returns [6,4.4]. Which runs give each source token its weighted sum?",
    "options": [
      "Run A only",
      "Both runs",
      "Neither run",
      "Run B only"
    ],
    "answer": "Run B only",
    "explanation": "T0 evaluates to 0.25×3 + 0.75×7 = 6 and T1 evaluates to 0.6×2 + 0.4×8 = 4.4, so only Run B restores each weighted sum to its matching source row."
  }
]
```

> **Next:** Continue to [Deep Dive - NCCL](/learn/deep-dive-nccl). DeepGEMM showed how specialized GPU kernels turn hardware layouts into measured tensor throughput, including Mega MoE's NVLink overlap for expert-parallel tokens. <span data-glossary="nccl">NCCL</span> provides the general collective layer that moves gradients and activations across GPUs before <span data-glossary="nvidia-megatron">Megatron</span> assembles both into a distributed training stack.
