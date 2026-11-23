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

Four experts receive `[64, 192, 32, 128]` token rows. There are 416 useful rows, but rounding each group up to a multiple of 128 reserves 640 rows. Should we pay for that padding or launch four smaller matrix multiplications? Separate launches avoid this particular packing requirement, but still have edge tiles and launch overhead. Counting useful arithmetic alone won't tell us which wins.

This is the feed-forward counterpart to the previous chapter's irregular attention workload. A <span data-glossary="mixture-of-experts">mixture-of-experts (MoE)</span> layer in a large language model (LLM) routes tokens to selected expert networks. A rank, the process controlling one GPU in our example, must compute each expert's projection with however many rows arrive.

DeepGEMM is a <span data-glossary="cuda">CUDA</span> library for exploring that trade-off. It is not a model server: it does not handle request queuing, own a <span data-glossary="token-budget">token budget</span>, or expose HTTP. It provides dense and grouped <span data-glossary="gemm">GEMM</span> <span data-glossary="cuda-kernel">kernels</span>, low-bit layouts, <span data-glossary="multi-query-attention">multi-query attention (MQA)</span> scoring for DeepSeek's lightning indexer, and Mega MoE, which overlaps expert-parallel communication with expert compute.[^deepgemm2026repo]

Other serving systems call it. A kernel can win its microbenchmark and still leave end-to-end latency unchanged if the surrounding runtime spends the saved time elsewhere.

We'll keep the public Flash benchmark shape in view: 256 routed experts, top-k 6, hidden size 4096, and intermediate size 2048. Under eight-way expert parallelism (EP8), a balanced placement gives 32 experts per rank. Our four groups are a small subset used to understand packing, not the complete rank workload.[^deepgemm2026benchmarks]

The implementation walkthrough is pinned to commit `559d79fb6994a58b8a15b4b93bf13ccc16edf247` (July 15, 2026); relevant source paths were rechecked September 23.[^deepgemmPinned2026] The September 10 release subsequently introduced DeepJIT, sparse indexing, more fused operators, and a different determinism default. The September contracts were checked at `78b69000794d0937b47ae3387eff7663410264d1`; current main was rechecked October 10 at `057ca5964aae0879ff2e0eb71ee05a3cb0ba3df7`. Its September 30 release breaks older indexer calls, as the migration below explains.[^deepgemm2026SeptemberRelease][^deepgemmCurrent2026][^deepgemm2026OctoberSnapshot] Runnable examples use the CPU and standard library. They check arithmetic and dependencies, not CUDA execution, FP8 rounding, synchronization, or GPU speed.

```checkpoint
What problem does DeepGEMM solve, and what problem does it leave to a serving runtime?
---
DeepGEMM solves selected GPU tensor operations and their data movement. A serving runtime still owns request scheduling, batching, admission, model loading, and end-to-end latency policy.
```

## Project identity and scope

The repository is maintained in the DeepSeek AI open-source ecosystem. Its README describes a unified <span data-glossary="tensor">tensor</span>-core kernel library and lists DeepSeek contributors. The Mega MoE release notes name a larger group because communication kernels, layouts, scheduling, and benchmarking span multiple subsystems.[^deepgemm2026repo][^deepgemm2026mega]

| Field | Current project fact |
| --- | --- |
| Origin and steward | DeepSeek AI publishes and maintains DeepGEMM under the `deepseek-ai` organization.[^deepgemm2026repo] |
| Named contributors | The repository citation names Chenggang Zhao, Zhean Xu, Liang Zhao, Jiashi Li, Chenhao Xu, Anyi Xu, Shengyu Liu, Kexing Zhou, and Kuai Yu.[^deepgemm2026repo] |
| Contributor model | Development happens through the public repository and focused kernel pull requests. The current snapshot doesn't declare a foundation, TSC, or formal committer ladder.[^deepgemm2026repo][^deepgemm2026mega] |
| Source license | MIT, with DeepSeek copyright, for the pinned source snapshot.[^deepgemm2026license] |
| Commercial scope | DeepGEMM is a kernel library, not the DeepSeek API or a model release. Its own Mega MoE announcement separates kernel development from internal model releases.[^deepgemm2026mega] |
| Model and weights scope | DeepSeek model versions, weights, tokenizers, and training data can use terms different from the kernel library. Check the exact <span data-glossary="model-card">model card</span> and version. |

That focused scope also explains DeepGEMM's relationship to CUTLASS and CuTe. It borrows ideas from both while keeping a smaller set of public kernel functions. The narrow surface makes one generated path easier to inspect, but callers still have to prepare layouts and scales. No fallback can make a malformed tensor fast.

| Layer | DeepGEMM owns | Caller still owns |
|---|---|---|
| Tensor math | GEMM, grouped GEMM, <span data-glossary="multi-query-attention">MQA</span> logits, fused Mega MoE | Model graph and layer ordering |
| Device schedule | Tile sizes, persistent task order, barriers, ring buffers | Request batching and <span data-glossary="token">token</span> admission |
| Data representation | Kernel-required <span data-glossary="fp8">FP8</span>, FP4, <span data-glossary="bf16">BF16</span>, and scale layouts | Casting, transposition, padding, and source <span data-glossary="quantization">quantization</span> |
| Compilation | Shape and architecture-specific JIT modules | <span data-glossary="cuda">CUDA</span> toolchain, process launch, cache lifecycle |
| Measurement | Correctness tests and shape-specific benchmarks | Product <span data-glossary="slo">SLOs</span>, traffic mix, and end-to-end comparison |

### What callers actually use it for

Follow one routed token through the graph and four kernel families answer different bottlenecks:

1. **Dense projection layers.** Attention and feed-forward layers reduce to matrix products. DeepGEMM exposes <span data-glossary="bf16">BF16</span> and low-bit GEMMs for these hot loops.
2. **Mixture-of-Experts.** <span data-glossary="grouped-gemm">Grouped GEMMs</span> process the variable number of tokens sent to each expert. Contiguous and masked layouts target <span data-glossary="prefill">prefill</span> and decode differences.
3. **DeepSeek indexer scoring.** MQA scoring turns query vectors, compressed key/value vectors, and per-head weights into token-to-token <span data-glossary="logits">logits</span>. The kernel has non-paged and paged forms for prefill and decode, with an FP4 indexer path in later releases.[^deepseek2025v32][^deepgemm2026mega]
4. **Expert-parallel inference.** Mega MoE combines dispatch, two expert projections, <span data-glossary="swiglu">SwiGLU</span>, and combine so <span data-glossary="nvlink">NVLink</span> traffic can overlap tensor-core work.[^deepgemm2026mega]

The README also lists HyperConnection (HC) GEMMs. We won't trace every primitive: dense GEMM establishes the memory path, grouped GEMM adds uneven routing, and Mega MoE adds communication. The indexer is a useful contrast because its output isn't an expert activation or a full attention result.

## Research foundations and source trail

No single paper explains every DeepGEMM kernel. Read the sources by the question they answer: DeepSeek-V3 motivates sparse expert routing, DeepSeek-V3.2 describes the lightning indexer, DeepSeek-V4 supplies the Flash and Pro shapes, and the repository plus release pull requests record the implementation.[^deepseekv3_2024][^deepseek2025v32][^deepseek2026v4paper]

Use the sources in four layers:

| Layer | Source | Question it answers |
|---|---|---|
| Model architecture | DeepSeek-V3 and V4 technical reports | Why total expert storage and active-token compute diverge, and which M/N/K the kernels see |
| Indexer behavior | DeepSeek-V3.2 paper | Why MQA scoring needs range-aware, low-bit logits |
| Kernel implementation | DeepGEMM repository | Which layouts, dtypes, architectures, and APIs are supported |
| Fused distributed path | Mega MoE release and benchmark PRs | How overlap is implemented and how one harness measured it |

A paper can motivate a workload without proving a kernel speedup. A benchmark can show a speedup without proving model quality. Keep those evidence types separate as we trace the code. Before either kind of evidence matters, we must define the mathematical interface. What does a single GEMM actually compute?

## GEMM first: mathematical interface and mechanics

General matrix-matrix multiplication, or GEMM, computes a matrix product and optionally adds an existing output. DeepGEMM's public naming convention is $D = C + A B$, and the common NT interface (non-transposed A, transposed B) implements $D = C + A B^{\top}$.[^deepgemm2026repo]

For that NT layout, $A$ has shape $[M,K]$, $B$ has shape $[N,K]$, and $D$ has shape $[M,N]$. Each output element is a <span data-glossary="dot-product">dot product</span> of one row from A and one row from B. The operation count is about $2MNK$ floating-point operations because each multiply is paired with an add.

For one output, take A's row `[1, 2]` and B's row `[3, 4]`: their dot product is $1\times3+2\times4=11$. Pair A's next row `[0, -1]` with the same B row and the result is $-4$. A matrix multiplication repeats this operation over every row pair. B is stored as `[N,K]`; the transpose in the formula makes the inner K dimensions meet.

Now take a whole GEMM with $M=512$, $N=4096$, and $K=4096$. It carries $8{,}589{,}934{,}592$ multiply-accumulate pairs, or $17{,}179{,}869{,}184$ FLOPs when multiply and add each count as one. Completing that GEMM in 10 microseconds corresponds to 1,718 TFLOP/s. These are whole-matrix dimensions; a thread block handles one tile.

The hardware sees more than arithmetic. It sees global-memory loads, shared-memory staging, scale-factor loads, register or tensor-memory pressure, barriers, and output stores. A kernel can have high <span data-glossary="arithmetic-intensity">arithmetic intensity</span> and still lose if a layout forces extra transposes or if a small M dimension leaves <span data-glossary="tensor-core">tensor cores</span> idle.

```checkpoint
Why can two GEMMs with the same FLOP count have different latency?
---
Their tile shapes, memory layouts, scaling-factor loads, occupancy, and synchronization can differ. FLOP count describes arithmetic work, not data movement or parallelism.
```

## Read the performance ladder before the kernel

Take the $512 \times 4096$ output from the previous example and implement it without a library. A naïve kernel gives one thread one output element. Each thread walks all $K$ values and repeatedly requests overlapping A and B data from global memory. The result can be correct, but redundant loads and launch overhead are now exposed.

A tiled kernel gives a thread block a rectangle of D. It loads matching A and B rectangles into shared memory, then reuses those values while the K loop advances. Threads keep one or more partial sums in registers, close to the arithmetic. Shared memory cuts repeated global loads; registers keep the accumulator nearby. Both are finite resources, so a larger tile or more accumulators can reduce the number of active blocks through shared-memory or register pressure. If the register budget is exceeded, values can spill to off-chip local memory and erase the reuse the tile was meant to create.[^cudaBestPractices2026]

Tensor cores change the inner loop again. The kernel feeds matrix fragments to specialized matrix-multiply-accumulate units, carries partial sums across K tiles, and converts the accumulator when it stores D. Tile shape, operand layout, input precision, and accumulator type must match the architecture. DeepGEMM's TMA, TMEM, and `tcgen05` path later in this chapter is this third stage made explicit for SM100, not a way around shape and layout checks.[^cudaProgrammingGuide2026][^deepgemm2026repo]

Analyze the workload shape before profiling. With $M=1$, much of a large output tile has no useful row work, so launch and staging overhead dominate. With $M=512$, a block can reuse more loaded data and keep more tensor-core pipelines in flight. If a tile change raises register use, occupancy may fall without the kernel getting slower or faster in a predictable direction. Measure execution time directly rather than treating occupancy as the sole optimization target.[^cudaBestPractices2026]

Complete benchmark configuration belongs beside the reported number. Record hardware and software, workload shape and token distribution, precision and algorithm, exact baseline, and the correctness method. Without those five labels, “faster” describes a run but not a result another engineer can reproduce.

Correctness comes before benchmark measurements are useful. Compare the same inputs against a PyTorch or legacy reference with an explicit tolerance, and include one-token, ragged, edge-tile, and scale edge cases. Check output order and routed-token indices as well as the numerical error. A high TFLOPS value with a wrong expert row is a faster bug. NVIDIA's Compute Sanitizer can then check out-of-bounds or misaligned access, shared-memory hazards, uninitialized reads, and invalid synchronization while the numerical reference checks the answer.[^computeSanitizer2026]

### Precision and scaling

DeepGEMM's low-bit paths trade input precision for bandwidth and tensor-core throughput. <span data-glossary="fp8">FP8</span> here is E4M3: four exponent bits and three mantissa bits, commonly used for activations. **FP4** here is E2M1 packed two values per byte, used for expert weights on the SM100 path. **BF16** is a 16-bit operand and output format whose exponent range matches FP32. DeepGEMM's BF16 tensor-core paths keep matrix accumulators in FP32 before converting them to the configured BF16 or FP32 output.[^deepgemm2026repo]

The kernel consumes scale factors in a specific layout. For the low-bit GEMM paths discussed here, SM90 uses FP32 scales and SM100's native representation packs four UE8M0 scales into one 32-bit `torch.int`. UE8M0 encodes unsigned powers of two with eight exponent bits and no mantissa. The API can prepare some scale layouts, so distinguish the native kernel representation from accepted wrapper inputs. Other operations, including the older FP8 indexer, have different scale format requirements.[^deepgemm2026repo]

Group size depends on the kernel path. SM90 FP8 paths commonly use K-group 128 with FP32 scales. The SM100 FP8×FP4 Mega MoE path uses K-group 32 with packed UE8M0. For a per-32 K-group, a row of K values splits into groups of 32 and each group gets one scale. A correct numerical tensor with the wrong <span data-glossary="stride">stride</span> can still fail an assertion or trigger a slow preparation path. The <span data-glossary="tma">Tensor Memory Accelerator (TMA)</span> stages compatible multidimensional tiles into shared memory, so its alignment requirements become part of the kernel layout requirements too.

| Input path | Typical value format | Scale representation | What to watch |
|---|---|---|---|
| SM90 FP8 GEMM | FP8 A and B | FP32 scales, often K-group 128 | NT layout and TMA alignment |
| SM100 FP8 × FP4 GEMM | FP8 E4M3 A, packed FP4 E2M1 B | Packed UE8M0 integer scales, K-group 32 or 128 | Major layout and packed width |
| BF16 GEMM | BF16 A and B | No low-bit scale tensor | Accumulator type and tile shape |
| Mega MoE, FP8 × FP4 | FP8 activations, FP4 weights | Per-32 UE8M0 scales | Symmetric buffer and expert alignment |

Treat casts and layout transforms as a pipeline stage before the kernel. DeepGEMM provides helpers such as `transform_sf_into_required_layout`, but the README warns that input transposition and FP8 casting may be slower utility operations. In a production path, fuse those operations into an earlier model kernel when profiling shows they dominate.

### Why a scale belongs inside the K reduction

Suppose the stored rows are `[1, 2, 3, 4]` and `[2, 1, -1, 2]`. Use two K groups, each of width two, with A scales `[0.5, 2]` and B scales `[2, 0.25]`. The first group's raw dot is 4 and its scale product is 1. The second group's raw dot is 5 and its scale product is 0.5. Adding the scaled partial dots gives $4+2.5=6.5$, not the unscaled dot 9. A single scale applied after the whole reduction loses that distinction.

Compare groupwise block-scaled accumulation against explicit elementwise dequantization:

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

The grouping rule defines numerical scaling, but hardware requirements differ across GPU generations. Hopper and Blackwell disagree about the scale type, the layout, and which instructions may run.

## Two architectures, two execution profiles

The disagreement is the architecture. The repository supports NVIDIA SM90 (Hopper) and SM100 (Blackwell). Treat those as distinct hardware targets with different instruction sets, not interchangeable names for a single GPU. A path selected for one family may use different scale types, layouts, instructions, and compiler flags on the other.[^cudaProgrammingGuide2026]

The dispatch layer checks the device architecture, input major layout, scale dtype, and output shape before selecting an implementation. On SM90, the current FP8 path uses FP32 scales and supports the NT layout for the primary GEMM interface. On SM100, the FP8 × FP4 path can select NT, TN, NN, or TT variants and uses packed UE8M0 scales.[^deepgemm2026repo]

A single portable kernel could hide those differences behind extra branches or generalized iterators. DeepGEMM keeps architecture-specific implementations visible, then uses a thin API layer to check prerequisites and route to the matching implementation.

An architecture mismatch cannot be fixed by parameter tuning. If an SM100-only FP4 path is sent to SM90, no tile-size tweak can fix it. Check `torch.cuda.get_device_capability()`, CUDA version, scale dtype, and major layout before comparing benchmarks. At the pinned revision, the Mega MoE implementation dispatches to SM100 and its test contains a TODO about skipping SM90. That comment isn't an implemented automatic skip.

<figure>
  <img src="illustrations/_generated/sm100_tile_path_dark.png" alt="SM100 block-scaled GEMM stages operands and scales in shared memory. Scale factors copy to TMEM while operands stream from SMEM into Tensor Cores." />
  <figcaption>Follow the scales as well as A and B. In this selected SM100 implementation, TMEM holds scale factors and accumulators. Scales need a shared-to-TMEM copy before the block-scaled matrix instruction can consume them.</figcaption>
</figure>

## Inside an SM100 tile

The dispatch decision leaves one tile to follow. Global memory holds the source tensors, TMA stages a compatible rectangle, and the tensor-core path accumulates partial products before the epilogue stores D. Each handoff has a different lifetime and synchronization rule, so a correct matrix formula isn't enough.

### TMA moves the right rectangle

TMA, the Tensor Memory Accelerator, copies multidimensional tensor regions between global memory and shared memory using a descriptor. A descriptor carries shape and stride information so the copy engine can move a tile without every thread computing addresses.

TMA reduces address instructions and stages a copy asynchronously while a previous tile is being consumed. That lets a kernel overlap global-memory movement with tensor-core math, provided barriers and shared-memory stages are sized correctly.[^cudaBestPractices2026][^cudaProgrammingGuide2026]

The catch is alignment. DeepGEMM's API checks TMA-aligned strides for input and scale tensors. A caller who transposes a tensor with a view may produce mathematically correct values but a stride pattern that can't satisfy the descriptor. The safe path is to create the required major layout explicitly, then validate both shape and stride.

### TMEM holds accumulators and block scales

TMEM, or tensor memory, is specialized SM100 storage used by the `tcgen05` instruction family. This block-scaled implementation reserves TMEM columns for both FP32 accumulators and scale factors. After TMA stages scales in shared memory, a shared-to-TMEM copy supplies them to the matrix instruction. Treating TMEM as accumulator-only storage misses a real data dependency.[^deepgemmPinned2026][^nvidiaPtxTcgen2026]

Keep those lifetimes separate when reading the code. Global memory holds model tensors. Shared memory stages TMA input. TMEM holds the matrix accumulator and the scales needed by this instruction. Each handoff has an ordering requirement.

### tcgen05 issues MMA work

The SM100 implementation calls tcgen05 matrix multiply-accumulate instructions through CUTLASS and local PTX helpers. One instruction consumes a selected tile from shared memory and accumulates into TMEM. The epilogue then applies output conversion, activation-specific work, or a store.

The issuing <span data-glossary="cuda-warp">CUDA warps</span> follow instruction-specific participation and synchronization rules. Ordinary registers are thread-local, not a shared storage tier. DeepGEMM coordinates TMEM allocation, TMA completion, scale copies, asynchronous matrix completion, and epilogue reads. Some ordering is explicit and some is governed by commit instructions, so adding or removing a fence by analogy to ordinary loads is unsafe.

| Resource | Role in one tile | Typical failure symptom |
|---|---|---|
| Global memory | Source A, B, C, and scale tensors | Low bandwidth or wrong stride |
| Shared memory | TMA staging and epilogue buffers | TMA barrier timeout or overwritten stage |
| TMEM | tcgen05 accumulators and block scales | Race, invalid read, or incorrect output |
| Tensor core | Multiply-accumulate execution | Low utilization on bad tile shape |
| Host JIT cache | Compiled cubin and metadata | Recompile latency or stale artifact |

Those five resources explain the JIT. Tile sizes, scale granularity, and architecture flags change generated code, so the library compiles a kernel for the signature it actually received instead of shipping every combination.

## The runtime JIT and shape signature

DeepGEMM compiles kernels at runtime instead of requiring a complete CUDA build for every possible shape. The C++ JIT compiler creates source for a selected implementation, builds a compiled GPU binary (CUBIN), and loads it through a runtime handle. Installation can therefore skip a giant matrix of prebuilt kernels.[^deepgemm2026repo]

At the July pin, the default compiler is NVCC. NVRTC is available behind `DG_JIT_USE_NVRTC=1` and can compile faster, with a possible performance cost on some shapes. The cache key is a digest of kernel name, compiler signature, compiler flags, and generated source. A digest maps that signature to a directory under `$HOME/.deep_gemm` by default, or under `DG_JIT_CACHE_DIR` when configured. Compilation writes into a temporary directory, flushes files, and atomically renames the completed directory. That publish step matters when multiple distributed ranks try to compile the same shape on a shared filesystem. It prevents a reader from loading a half-built published directory; it doesn't prevent duplicate concurrent compilation or repair a filesystem that lacks the required rename semantics.[^deepgemmPinned2026]

```text
kernel signature = name + compiler + flags + generated source
cache key       = digest(kernel signature)
cache hit       = load existing cubin
cache miss      = compile temporary cubin, publish atomically
```

The JIT can specialize block sizes, scale granularity, architecture, and optional features. New generated signatures can therefore produce a compile tail. A new request shape doesn't necessarily mean a new binary: the library also exposes `set_ignore_compile_dims` to keep selected dimensions dynamic. Warm the signatures actually produced by your workload, not every imaginable `(M,N,K)` tuple.

### What belongs in a signature

The signature should include every value that changes generated code or memory layout: architecture, M/N/K tile choices, scale granularity, grouped versus dense mode, activation, and <span data-glossary="feature-flag">feature flags</span> such as Programmatic Dependent Launch (PDL). If a value affects code but is missing from the key, a cached cubin can be reused for an incompatible layout.

`DG_JIT_DEBUG`, `DG_JIT_PRINT_COMPILER_COMMAND`, `DG_JIT_DUMP_PTX`, and `DG_JIT_DUMP_SASS` expose the compilation path. At the July pin, `DG_JIT_PTXAS_CHECK=1` asks the build to reject local-memory usage. These switches are useful during kernel bring-up, but production launchers should control them deliberately because logs and compilation artifacts can be large.

### The September DeepJIT migration

Current DeepGEMM delegates compilation to DeepJIT through `csrc/runtime/jit.hpp`, using its CUDA backend and a CUTLASS-version dependency signature. This replaces the July compiler path above.[^deepgemm2026OctoberSnapshot] Its documented CUDA compiler is NVCC; carry compiler settings across versions only after checking the installed API.

| Migration detail | Current requirement |
| --- | --- |
| Default cache root | `$HOME/.dj`; an existing `$HOME/.deep_gemm` cache isn't the new default |
| Multiple cache roots | `DG_JIT_CACHE_DIR` accepts colon-separated paths; search in order and compile misses into the first |
| Configuration precedence | An unset `DG_JIT_*` setting falls back to the corresponding `DJ_JIT_*` setting |
| Local-memory check | `DG_JIT_CHECK_NO_LOCAL_MEMORY=1`; `DG_JIT_CHECK_NO_SPILLS=1` separately rejects register spills |

These details come from the current README.[^deepgemm2026OctoberSnapshot] For example, migrate launchers that set only `DG_JIT_PTXAS_CHECK=1` to the documented checks, then inspect the JIT compilation logs to confirm which checks ran.

The September DeepJIT submodule's CUDA cache digest includes compiler output, effective flags, tracked includes/source, dependency signature, and post-hook identity. It doesn't discover every implicit compiler input, such as `CPATH` or `NVCC_APPEND_FLAGS`. Keep those inputs explicit and versioned. Enabling a PTX/SASS dump on an existing cache hit doesn't rebuild that entry: dump options don't change the digest and act only during compilation.[^deepjit2026Cache] If no dump appears, first ask whether any compilation actually occurred. The October snapshot embeds DeepJIT `2efdab421e1cfb17fe8bc20e11ca72aa6d0e6c43`; these cache and dump rules still hold, but pin the submodule with the host library rather than updating it independently.[^deepgemm2026OctoberSnapshot]

```checkpoint
Why is the JIT cache key more than a shape tuple like (M, N, K)?
---
Compiler version, flags, architecture, generated code options, scale format, activation, and layout can change the binary even when M, N, and K stay constant. The key must distinguish all code or ABI changes.
```

Dense GEMM still assumes one M for the whole launch. MoE breaks that assumption because each expert sees a different number of tokens. The grouped family has to carry those uneven M values without paying for one launch per expert.

## Grouped GEMM: the MoE shape problem

An MoE layer routes each token to a small set of experts. Each expert sees a different number of tokens, so the straightforward choices are one GEMM per expert or padding every expert to the same M. Uneven routing makes each choice pay a different tax.

DeepGEMM's contiguous grouped API concatenates expert token segments into one M axis. N and K stay fixed because experts share weight dimensions. A compact layout tensor describes each segment, allowing one kernel to schedule multiple expert blocks while reusing one compiled implementation.

The segment boundaries still need alignment. The README requires each expert segment to meet the M block alignment returned by `get_mk_alignment_for_contiguous_layout()`. Padding belongs in the caller's token packing, and the resulting output must be unpacked to the original token order.

Read the configured alignment alongside `get_theoretical_mk_alignment_for_contiguous_layout()`. At the current snapshot, the configured default is 128, while the theoretical SM100 helper returns 256 and ignores `expected_m`.[^deepgemm2026OctoberSnapshot] For our four groups, alignment 256 would reserve 1,024 rows instead of 640. A theoretically favorable tile can therefore increase padding for small groups; the configured default remains 128.

| Grouped mode | Known at launch? | Layout | Intended workload |
|---|---|---|---|
| Contiguous | Expert token counts known | Concatenated M segments | Training and prefill |
| Masked | Counts hidden from CPU | Fixed M plus validity mask | Decode with CUDA graphs |
| K-grouped backward | K segments known | Fixed M/N, grouped K | MoE weight <span data-glossary="gradient">gradients</span> |

Masked grouped GEMM solves a different problem. During decode, the CPU may not know how many tokens each expert receives, especially when a CUDA graph fixes <span data-glossary="tensor-shape">tensor shapes</span>. A mask marks valid rows, so the GPU launches one shape while skipping invalid portions. That avoids a host synchronization, but it may execute less efficiently than a perfectly packed contiguous layout.

### Worked routing example

Return to four of a Flash-shaped rank's 32 local experts. They receive `[64, 192, 32, 128]` routed rows. With M alignment 128, the contiguous pack reserves `[128, 256, 128, 128]` rows. Valid rows stay 416; padded capacity becomes 640. The first gated projection has $K=4096$, $N=2\times2048=4096$. The second has $K=2048$, $N=4096$.

Padding isn't free. It increases memory traffic and can lower arithmetic utilization. It can still beat four separate launches if one persistent kernel amortizes launch overhead and keeps tiles in flight. Measure total kernel time and useful-token throughput together. A low microsecond number with high padding can mislead.

Here M counts token-expert assignments, not unique source tokens. A token routed to six experts contributes six rows across the distributed expert workload. With hidden width H and intermediate width I, linear 1 costs $2M H(2I)$ FLOPs and linear 2 costs $2M I H$. Together that's $6MHI$. The next snippet uses that arithmetic to compare useful rows with a full-padded computation model. Actual kernel instruction counts require profiling; some paths skip invalid tiles.

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

Those 20.94 useful GFLOPs cover only the two expert GEMMs for 416 routed rows in our subset. They exclude dispatch, combine, SwiGLU, and the other local experts. Padding is 35% of reserved rows and 53.8% relative to useful rows; the percentages use different denominators.

Grouped GEMM handles the expert projections, but it can't fuse the DeepSeek indexer's dequantization, ReLU, head weighting, and range mask. That different dataflow needs its own kernel.

## MQA logits for the DeepSeek indexer

Multi-query attention uses many query heads with one shared key/value representation. DeepGEMM's indexer kernel computes a weighted ReLU score for each query token against a selected range of key/value tokens. For query `i` and key/value token `j`, the README gives this computation:

$$
s_{ij} = \sum_h \operatorname{ReLU}(q_{i,h} \cdot (k_j \cdot \operatorname{scale}_j)) \; w_{i,h}
$$

The shared key <span data-glossary="vector">vector</span> is dequantized with its scale, each head computes a dot product, ReLU clips negative head scores, and per-head weights combine them into one score. This is the README's FP8 path, which has no separate query-scale input. Newer scaled-query variants may use different formulas. It matches the weighted-ReLU indexer in DeepSeek-V3.2.[^deepseek2025v32]

Walk one score by hand before looking at the paged path. Query heads are $(1, 0)$ and $(0, 1)$, weights are $0.4$ and $0.6$, the stored key is $(2, -1)$, and its scale is $0.5$. Dequantized $k$ is $(1, -0.5)$. The dots are $1.0$ and $-0.5$. ReLU keeps $1.0$ and zeros the negative head, so the logit is $0.4$.

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

The hand calculation explains what the specialized path adds. DeepGEMM offers non-paged scoring for prefill and paged scoring for decode. Paged mode reads key/value blocks through a block table, which matches a serving runtime's fragmented cache. The indexer can therefore sit beside, not inside, the main attention kernel: it selects useful context positions before the model performs a larger attention operation. FlashInfer already taught the paged-KV layout. This kernel consumes a similar table and writes a logit matrix instead of an attention output.

At the July pin, the bounds are part of correctness. A dense result can contain unwritten positions outside each query's valid key range. `clean_logits=True` fills those positions with negative infinity; without cleanup, the caller must exclude them explicitly. At this revision, the compressed non-paged mode requires `clean_logits=False`, so its bounds and output-index mapping remain the caller's responsibility. A zero-filled invalid position isn't safe either: head weights can make valid scores negative, and top-k could then select the invalid zero.[^deepgemmPinned2026]

Check that failure without a GPU. Here only positions 1 and 2 are valid; position 0 must never win retrieval.

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

For an empty valid range, return no selected keys instead of applying top-k to a row of negative infinities. Neither this bounds check nor the earlier two-dimensional dot example tests an actual supported CUDA shape.

### September 30 migration: compressed columns need source offsets

At the October snapshot, `fp8_fp4_mqa_logits` requires a positive `max_seqlen_k` and returns `[query_rows, max_seqlen_k]`. A row's valid span starts at column zero; column `c` maps to cache position `cu_seq_len_k_start[i] + c`. Entries after that row's span are unwritten. Both non-paged and paged APIs remove `clean_logits` and `logits_dtype`, and the old `fp8_mqa_logits`/`fp8_paged_mqa_logits` exports are gone. Mask bounds in the caller before ranking.[^deepgemm2026September30Release][^deepgemm2026OctoberSnapshot]

These are two distinct bugs. For a valid span `[40, 42)`, compressed column 1 names cache token 41, not token 1. An unwritten column can also win top-k unless it's excluded. This CPU example gives that invalid slot an intentionally large sentinel to demonstrate the caller's mapping requirement. Inspect initialized CUDA output to determine invalid-slot values on the supported kernel path.

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

Input requirements changed too. SM100 requires MXFP8/MXFP4 with packed UE8M0 query/key scales, BF16 head weights, and BF16 logits. SM90 retains non-MX FP8 with FP32 head weights/logits. Weight rows must be 16-byte aligned. SM100 paged scoring now requires variable-length `indices` and `next_n=1`; port metadata construction and cache layout together. The older hand calculation remains a reference for weighted ReLU, not bitwise evidence for this new BF16 reduction.[^deepgemm2026September30Release]

### Sparse scoring isn't a drop-in dense result

September's sparse-indexer APIs add a block-selection stage. The sparse non-paged metadata requires the valid prefix of each block-index row to contain unique, strictly increasing absolute blocks within that query's KV range. The resulting logit width is `num_max_sparse_blocks * sparse_block_kv`, rather than the dense cache length.[^deepgemm2026OctoberSnapshot] A column in that compressed result therefore needs the sparse mapping before it can identify an original token. Dense top-k code can't safely assume that column 7 means cache token 7.

The MQA path makes specialized kernel tradeoffs concrete. Generic GEMM can express a dot product, but it doesn't automatically fuse dequantization, ReLU, head weighting, range masking, and cache paging. The specialized path saves intermediate writes and keeps the score reduction close to the input tiles. The same question returns in Mega MoE: which data can move while the tensor cores are busy?

## Mega MoE: overlap communication and compute

The data that can move is the next expert chunk's dispatch, while this chunk's tensor cores are busy. Mega MoE fuses expert-parallel dispatch, linear 1, SwiGLU, linear 2, and expert-parallel combine into one SM100 kernel. It uses <span data-glossary="pytorch">PyTorch</span> symmetric memory so ranks can address each other's buffers and overlap NVLink traffic with tensor-core work.[^deepgemm2026mega]

The computation still follows ordinary MoE semantics:

1. Router selects <span data-glossary="top-k">top-k</span> experts and weights for each token.
2. <span data-glossary="expert-parallelism">Expert parallelism</span> dispatches token rows to owning ranks.
3. Linear 1 produces gate and up activations.
4. SwiGLU applies the gated activation.
5. Linear 2 projects back to the hidden size.
6. Combine returns weighted expert outputs to the source rank.

Schedule and storage provide the core mechanism. A symmetric ring buffer holds token data, scale data, routing indices, weights, and intermediate expert activations. Persistent schedulers claim blocks, move remote data into reusable slots, run L1 and L2 work, and release slots only after all consumers finish.

<figure>
  <img src="illustrations/_generated/mega_moe_overlap_dark.png" alt="Two-chunk dependency-preserving pipeline finishes in six abstract slots, versus eight serial slots. Dispatch B overlaps compute A; combine A overlaps compute B." />
  <figcaption>Overlap happens across independent chunks while each chunk preserves its dependencies. D means dispatch, F combines linear 1, SwiGLU, and linear 2, and C means combine. Stage widths show relative schedule slots; profile on target SM90/SM100 hardware for exact kernel microseconds.</figcaption>
</figure>

In this simplified schedule, each chunk needs one dispatch slot, two compute slots, and one combine slot. Two serial chunks take eight slots. With independent communication and compute resources, dispatch B can run during compute A, and combine A during compute B. Completion takes six slots. If both resources contend for the same bottleneck, or no second chunk is ready, that saving does not occur.

This overlap is specialized expert-parallel traffic over NVLink and symmetric memory, not a general collective. The next chapter's NCCL library supplies the broader all-reduce, all-gather, and all-to-all interface that training and serving stacks compose on top of.

### Persistent scheduling and ring reuse

Persistent scheduling means a resident set of cooperative thread arrays repeatedly claims work instead of launching a new grid for every expert block. Communication and compute phases can interleave, but more state lives in registers and shared memory. The source comments call out warmup waves, ring-block reuse, and ordering rules that prevent an L2 task from consuming an unfinished L1 block.

The ring buffer is bounded. A new dispatch can't overwrite a slot until the previous consumer signals that all N blocks are complete. That rule is a correctness invariant, not a performance hint. A missing release or early reuse can produce data races that look like occasional model-quality regressions rather than a clean CUDA error.

### Symmetric memory interface

The Python API allocates a `SymmBuffer` for a distributed process group. For one rank it can use a regular CUDA allocation; for multiple ranks it uses PyTorch's symmetric-memory rendezvous. The buffer exposes typed views for input tokens, scale factors, top-k indices, top-k weights, and intermediate activations.

The documented low-bit Mega MoE path uses PyTorch 2.9 or newer, FP8 activations with FP4 weights, SwiGLU, SM100 hardware, and aligned dimensions.[^deepgemm2026mega] The pinned source also exposes a BF16 variant. Expert parallelism across ranks needs a multi-process launch; a single-process <span data-glossary="smoke-test">smoke test</span> doesn't exercise remote buffer synchronization or NVLink overlap.

The current README also supports FP8 routed-expert weights via `mma_type='fp8xfp8'` when allocating the buffer.[^deepgemm2026OctoberSnapshot] That is a newer layout specification: the July low-bit API explicitly checks for packed FP4 weights. Choose matching buffers, weight transforms, and kernel versions together.

The pinned Python call accepts `recipe=(1, 1, 32)`, and the C++ API asserts that exact recipe for the low-bit Mega MoE path. Callers pack activations and weights with K-group 32 UE8M0 scales, transform the weights, copy routing inputs into the symmetric buffer, then invoke `fp8_fp4_mega_moe`. Passing another group width isn't a tuning option.[^deepgemmPinned2026]

```python title="mega_moe_call.py"
# Partial API sketch. Allocate and fill SymmBuffer before this call.
buffer = deep_gemm.get_symm_buffer_for_mega_moe(
    group, num_experts, max_tokens_per_rank, topk, hidden, intermediate_hidden
)
transformed_l1, transformed_l2 = deep_gemm.transform_weights_for_mega_moe(
    l1_weights, l2_weights
)
deep_gemm.fp8_fp4_mega_moe(y, transformed_l1, transformed_l2, buffer)
```

This API sketch has not been executed. A runnable lab must initialize the process group, cast activations, pack scales, copy routing inputs into the symmetric buffer before each call, and size output tensors. The source's weight transform also interleaves gate/up rows. A buffer with the right byte count but the wrong row ordering isn't a valid input.

### Current locality and epilogue choices

September 30 adds optional weight localization and SM-domain scheduling. `deep_gemm.localize` divides the selected weight dimension across GPU locality domains and copies into localized allocations; expert ownership remains with the EP rank. The dimension must divide by the domain count. Routed L1/L2 weights, and shared-expert weights when provided, must agree about localization. A stable SM mapping is probed when localization is available; an unstable probe warns and falls back to an even mapping. Record that fallback in benchmark logs and benchmark locality benefit on the target topology.[^deepgemm2026OctoberSnapshot]

The new `deep_gemm.epilogue` choices also change the output format. One SM100 GEMM resolves exactly one class: `Identity`, `Alpha`, `FP8Quantization`, or `BF16StochasticRounding`. An explicit class, standalone `alpha`, and FP8 output pair are mutually exclusive. Stochastic rounding is opt-in and requires direct BF16 output with no accumulation input `C`; combining it with `C` raises the assertion message `Stochastic rounding requires a direct BF16 output`. Don't treat it as an interchangeable accuracy or determinism setting. Compare its numerical behavior separately from the deterministic-algorithm mode and from the historical Mega MoE timing table.[^deepgemm2026OctoberSnapshot][^deepgemm2026September30Release]

## Read the Mega MoE benchmark as a bounded experiment

DeepGEMM's benchmark pull request compares Mega MoE with a legacy dispatch, GEMM, activation, and combine path under eight-way expert parallelism. Values are averaged across eight ranks and two named DeepSeek-V4 configurations. Re-run the comparison with your shapes, rank placement, and kernel versions before estimating the target speedup.[^deepgemm2026benchmarks]

### DeepSeek-V4-Flash shape

The reported Flash shape has 256 experts, top-k 6, hidden size 4096, and intermediate size 2048. Batch size means source tokens per rank, before each token's six expert assignments. PR #316, merged April 24, 2026, reports these historical measurements. Reproduce the comparison with your shapes, rank placement, and kernel versions before estimating target speedup.[^deepgemm2026benchmarks]

| Tokens per rank | Mega MoE time | Compute | Global memory | Interconnect | Speedup vs legacy |
|---:|---:|---:|---:|---:|---:|
| 1 | 56.5 µs | 5 TFLOPS | 1311 GB/s | 1 GB/s | 1.96x |
| 512 | 146.5 µs | 1056 TFLOPS | 3192 GB/s | 266 GB/s | 1.73x |
| 8192 | 1283.1 µs | 1928 TFLOPS | 998 GB/s | 499 GB/s | 1.56x |
| 32768 | 4855.5 µs | 2038 TFLOPS | 794 GB/s | 529 GB/s | 1.62x |

### DeepSeek-V4-Pro shape

The Pro benchmark shape uses 384 experts, top-k 6, hidden size 7168, and intermediate size 3072. Larger dimensions change both arithmetic work and communication volume.[^deepgemm2026benchmarks]

| Tokens per rank | Mega MoE time | Compute | Global memory | Interconnect | Speedup vs legacy |
|---:|---:|---:|---:|---:|---:|
| 1 | 108.1 µs | 7 TFLOPS | 1758 GB/s | 1 GB/s | 1.61x |
| 512 | 369.6 µs | 1098 TFLOPS | 4619 GB/s | 182 GB/s | 1.54x |
| 8192 | 2818.5 µs | 2304 TFLOPS | 1094 GB/s | 393 GB/s | 1.50x |
| 32768 | 10655.2 µs | 2438 TFLOPS | 692 GB/s | 417 GB/s | 1.54x |

At 512 tokens per rank under EP8, the node holds $512\times8=4{,}096$ source tokens, or 24,576 token-expert assignments for top-k six. Balanced routing would average 3,072 received rows per rank; individual ranks can differ. Divide local expert work by received expert rows, and use source tokens only for source-side throughput.[^deepgemm2026benchmarks]

The compute and bandwidth columns are work estimates divided by elapsed time, not hardware-counter measurements of traffic. For example, $6\times3072\times4096\times2048$ FLOPs divided by 146.5 microseconds gives about 1,055 TFLOP/s, close to the rounded 1,056 reported. The pinned harness estimates global-memory bytes and NVLink payload bytes; cache behavior, protocol traffic, and scale movement can make physical traffic differ.[^deepgemmPinned2026]

The PR gives shapes and EP8 rank averaging but doesn't provide a complete GPU SKU, driver/toolkit, clock, topology, warmup, and correctness logs for those historical rows. Don't fill that gap by guessing a Blackwell model. The pinned test's legacy comparison can also be skipped when baseline dependencies fail to import. Record test execution and correctness output beside each printed timing.

```checkpoint
What does the 1.96x Mega MoE result prove, and what does it not prove?
---
For one Flash-shaped token per rank, the reported baseline-to-Mega time ratio was 1.96. Mega time was about 51% of baseline, a 49% reduction. The historical test environment specification is incomplete; reproduce the measurement on your topology and full serving workload before estimating speedup.
```

### Turn timing into a diagnosis

Start with Nsight Systems when the question is where time goes across the process. Its CUDA API and GPU workload traces show JIT compilation, host launches, memory transfers, kernels, and streams, so they can reveal preparation or serialization that a kernel stopwatch hides. Move to Nsight Compute for one selected kernel: Launch Statistics describes the grid, SpeedOfLight compares achieved compute and memory throughput with hardware ceilings, Memory Workload Analysis identifies the busy memory unit, and Occupancy or scheduler sections show whether resource pressure leaves warps waiting.[^nsightSystems2026][^nsightCompute2026]

Read those counters as clues. High occupancy can coexist with poor performance, and a tiny M may naturally produce a low tensor-core percentage. A roofline point below the compute ceiling can mean low arithmetic intensity, poor reuse, or a launch that never feeds the units. Enable `DG_JIT_WITH_LINEINFO=1` when source correlation matters, and use a narrow, repeatable profile range. Nsight Compute may replay a kernel to collect metrics, so keep its report for diagnosis and keep synchronized, unprofiled timings for the benchmark table.[^cudaBestPractices2026][^nsightCompute2026]

For Mega MoE, the profile needs one more join: route histogram, padded rows, rank topology, dispatch and combine readiness, and complete-layer time. If compute looks busy while the layer gets slower, inspect whether communication actually overlaps or whether casts, packing, or a barrier sit on the critical path. That evidence tells you which optimization to address next.

## Strengths and weaknesses

The same choices that make DeepGEMM fast also define where it fits. Shape-specialized kernels reward a team that controls its GPU fleet and tensor layouts; they ask more from callers that need portability or arbitrary shapes.

### Strengths

- **Shape-aware performance.** The JIT can specialize tile sizes, layouts, scale granularity, and architecture instead of forcing one generic iterator.
- **Small public surface.** A few kernel APIs make it practical to trace from Python call to C++ checks to generated CUDA.
- **Model-specific fusion.** MQA scoring and Mega MoE remove intermediate tensors that a generic graph would materialize.
- **Distributed awareness.** Symmetric memory, ring buffers, and persistent schedulers address expert-parallel traffic directly.
- **Useful correctness references.** Tests compare outputs against PyTorch or legacy paths across dense, grouped, paged, and fused operations.

### Weaknesses

- **Narrow hardware support.** Current public paths target SM90 or SM100, and Mega MoE is SM100-first. A machine with another architecture needs a different kernel or fallback.
- **Strict layout contracts.** Scale dtype, stride, major order, and alignment are part of correctness. The caller must prepare them.
- **Compilation latency.** New signatures compile on first use. A wide shape distribution can create cold-start tail latency.
- **Operational complexity.** Mega MoE needs multi-process setup, symmetric memory, correct barriers, and a compatible PyTorch release.
- **Limited portability.** CUDA, CUTLASS, the host C++ standard library, compiler, and PyTorch versions all affect the supported path. The July pin used `{fmt}`; current requirements call for C++20 `<format>` support.
- **Benchmark locality.** PR tables compare one harness. They don't replace a workload-level test with real request lengths and rank placement.

DeepGEMM chooses explicit memory specifications and measured specialization over broad portability. That fits a model team that controls hardware, CUDA images, and tensor layouts, but fits less well as a drop-in library for arbitrary user tensors. System setup should establish clear prerequisites before timing begins.

## Validate prerequisites before timing

As checked October 10, the current README requires Python 3.8+, compilers and standard libraries with C++20 `<format>` support, PyTorch 2.3+, CUTLASS 4.0+, and CUDA Toolkit 12.9+ for the listed SM90/SM100 devices.[^deepgemm2026OctoberSnapshot] Its embedded DeepJIT documents a Linux host environment.[^deepjit2026Cache] Mega MoE adds a PyTorch 2.9 requirement. The July pin's PyTorch 2.1 and SM90 CUDA 12.3 minimums are historical compatibility statements, not today's install requirements.[^deepgemmPinned2026] Record the chosen version's specifications with every benchmark report.

### Check determinism after an upgrade

The September release adds `deep_gemm.use_deterministic_algorithms(True)`. Its default is `False`, allowing faster choices in some kernels instead of the previous deterministic, batch-invariant behavior.[^deepgemm2026SeptemberRelease] For example, the current Mega mHC selector fixes its split count in deterministic mode, while its faster path chooses a split count using available SMs and M blocks.[^deepgemm2026OctoberSnapshot] Changing the split changes the reduction schedule even without a sampling RNG.

For a reproducibility or RL test, compare the same token's output when it runs alone and when it is packed with unrelated rows. Set the intended determinism mode, keep weights/inputs fixed, and report both numerical agreement and throughput. Select the deterministic kernel mode explicitly and test reproducibility across the target GPU and software versions.

The release also adds **Mega Gate**, fusing the routing GEMM with MoE gate operations, and **Mega mHC**, fusing connection/mixing operations with RMSNorm.[^deepgemm2026SeptemberRelease] At the October snapshot, Mega Gate supports only `scoring_func="sqrtsoftplus"`; `get_bf16_mega_gate_config` has been removed.[^deepgemm2026September30Release] These extend optimization before and around expert compute. Follow their outputs and dependencies when timing the layer; the April Mega MoE table doesn't measure these new fusions.

Before running a benchmark, record the environment and the shape it will exercise:

1. GPU model and compute capability.
2. CUDA toolkit and driver versions.
3. PyTorch and CUTLASS versions.
4. Kernel mode, scale format, and layout.
5. M, N, K or expert dimensions and token distribution.
6. Number of ranks, rank-to-GPU topology, and interconnect.
7. Warmup count, JIT cache state, synchronization method, and measurement window.
8. Correctness tolerance and reference implementation.

For a first local check, start with a dense BF16 or FP8 GEMM shape from the repository tests. Enable `DG_JIT_DEBUG=1` only while tracing compilation. Use `DG_JIT_CACHE_DIR` on fast local storage, not a path with unreliable distributed-file semantics. For multi-rank Mega MoE, run the repository's distributed test harness and compare output to the non-fused baseline before reading timing output.

### Shape constraints to expose

Make constraints part of the model runtime's validation layer. Check that hidden and intermediate dimensions meet the required multiples, expert count is divisible by rank count, token counts fit the symmetric buffer, and scale tensors have the required packed width. Reject a request with a clear error before it reaches a CUDA graph or a collective barrier.

| Constraint | Why it exists | <span data-glossary="guardrail">Guardrail</span> |
|---|---|---|
| `hidden % 128 == 0` on low-bit Mega paths | Scale and tile packing | Validate model config at startup |
| `intermediate_hidden % 128 == 0` | Expert weight and scale layout | Check every expert block |
| Expert count divisible by rank count | Even local ownership | Assert before process-group launch |
| Contiguous grouped M alignment | Stable tile boundaries | Pad and preserve segment map |
| K-group 32 UE8M0 scales for FP8 × FP4 Mega MoE | Supported scale granularity | Keep gran_k in config and logs |
| SM90 or SM100 device | Architecture-specific implementation | Route unsupported devices to fallback |

## Diagnose failures from their first symptom

### Wrong output, no crash

Numerically wrong output with no crash usually points to scale packing, tensor major order, or output accumulation dtype. Compare a small shape against the PyTorch reference after dequantization. If the error appears only on SM100, inspect UE8M0 packing and TMA strides. If it appears only in grouped mode, print segment offsets and padded M counts.

### First request is slow

If the first request is slow, check whether the JIT cache missed. Log kernel name, signature, compile duration, and cache directory. Warm expected signatures during startup or provide an explicit fallback. Report cold and warm latency separately, while keeping real cold requests in the product latency distribution.

### Mega MoE hangs

If Mega MoE hangs, treat it as a synchronization or collective protocol failure until proven otherwise. Confirm every rank entered the same process-group call, buffer sizes match, top-k indices are valid, and symmetric memory rendezvous completed. Enable communication-kernel debug only in a controlled reproduction because it zeros the buffer and requires callers to recopy inputs before each invocation.

### Speedup disappears

If the speedup disappears, check whether casts, transposes, token packing, or network transport sit outside the timed kernel. Then compare useful-token throughput against padded-token throughput. A fused kernel can be faster while the full graph regresses if preparation dominates.

### Thermal or topology drift

If results drift thermally or by topology, repeat after warmup and pin rank placement. A benchmark that runs eight ranks on a different NVLink topology from production can report a misleading interconnect rate. Record clocks and power policy when comparing machines.

## A code-reading route through the repository

Use this order when studying the July-pinned clone. In the current tree, DeepJIT integration lives in `csrc/runtime/jit.hpp`, and Mega MoE's API is `csrc/apis/mega_moe.hpp`.[^deepgemm2026OctoberSnapshot]

1. `README.md` defines public APIs, supported architectures, scale formats, and examples.
2. `deep_gemm/__init__.py` exposes Python functions and utility transforms.
3. `csrc/apis/gemm.hpp` checks shapes and dispatches dense and grouped GEMMs.
4. `csrc/jit/compiler.hpp` shows signatures, compiler flags, cache publication, and NVCC or NVRTC paths.
5. `csrc/jit_kernels/impls/sm100_fp8_fp4_gemm_1d1d.hpp` is the host wrapper that JIT-compiles one SM100 tile path.
6. `deep_gemm/include/deep_gemm/impls/sm100_fp8_fp4_gemm_1d1d.cuh` traces TMA, TMEM, and tcgen05 stages for dense GEMM.
7. `deep_gemm/include/deep_gemm/scheduler/mega_moe.cuh` explains expert task order, warmup, and ring capacity.
8. `deep_gemm/include/deep_gemm/impls/sm100_fp8_fp4_mega_moe.cuh` connects remote loads, grouped GEMMs, barriers, and stores.
9. `tests/test_attention.py` and `tests/test_mega_moe.py` show reference calculations and shape sweeps.

Read one data structure at a time. First find the shape and stride checks. Then find where a scale tensor is transformed. Finally trace who writes each buffer and who releases its barrier. This route is more productive than starting with a 1,000-line CUDA kernel and guessing the invariants.

### What strong answers show

- Derive NT output dimensions and count multiply-adds without confusing a whole GEMM with a block tile.
- Place each K-group's scale product inside the reduction and identify the required native scale layout.
- Trace A, B, scales, and accumulators through shared memory and TMEM, including completion dependencies.
- Distinguish source tokens, routed rows, padded capacity, and local versus node-wide denominators.
- Explain overlap across ready chunks while preserving each chunk's dispatch, compute, and combine order.
- Separate CPU reference agreement, GPU correctness, historical throughput estimates, and serving latency evidence.

### Follow-up questions

#### Why might a faster grouped GEMM make the layer slower?

Packing, scale conversion, dispatch, and output restoration may cost more than the saved kernel time. Compare complete-layer latency on the same route histogram and include preparation inside the measured boundary. Useful-row throughput and padded capacity help explain the result; neither substitutes for elapsed time.

#### What if the benchmark prints a time but no correctness result?

Check whether the legacy dependencies imported and the correctness loop ran. At the pinned revision, the harness can continue when its baseline isn't available. Mark that run as timing-only, restore the reference path, and test routed row counts and numerical outputs before using the result to choose a production kernel.

Padding can change the measured time without making the kernel faster, and a faster kernel can still lose that time in the full serving path. Next, follow who moves the bytes when the kernel is no longer the only process on the GPU.

## Architectural summary

- DeepGEMM is a kernel library, not a serving runtime.
- Data layout, tensor-core instruction, schedule, and model shape are selected together. Change one without the others and the kernel can miss its path.
- SM90 and SM100 use different scale formats and implementation paths. Architecture checks are part of correctness.
- Runtime JIT makes shape specialization practical, but cold-start compilation and cache hygiene become operational concerns.
- Grouped GEMM handles uneven MoE token counts with contiguous or masked layouts, each with a different host-knowledge trade-off.
- MQA indexer scoring fuses dequantization, head weighting, ReLU, and range or page selection for DeepSeek-V3.2.
- Mega MoE fuses expert dispatch, FP8 × FP4 projections, SwiGLU, and combine, then overlaps NVLink traffic with tensor-core work on SM100.
- Benchmark numbers need shape, hardware, rank topology, warmup, and baseline details before they can guide a production choice.

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
    "explanation": "D has one row for each of the 48 rows of A and one column for each of the 96 rows of B. Each output cell takes 64 multiply-accumulates. Counting two operations per pair gives about 48 × 96 × 64 × 2 = 589,824 operations. The shape [96,48] reverses the output axes. A count of 294,912 treats each pair as one operation. Choosing both [96,48] and 294,912 makes both errors."
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
    "explanation": "The first group contributes (4 × 2 − 2 × 1) × (0.5 × 4) = 12. The second contributes (3 × 2 − 1) × (2 × 0.25) = 2.5. Their sum is 14.5. Adding the raw dots without scaling gives 6 + 5 = 11. Applying the first group's factor of 2 to the full dot gives 22. Applying the second group's factor of 0.5 to the full dot gives 5.5."
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
    "explanation": "Capacities are [128,192,64,0], totaling 384; useful rows total 195 and padding 189. The requested share is 189/384≈49.2%. The 96.9% alternative divides padding by useful rows instead. The smaller totals miss one or more independent segment round-ups."
  },
  {
    "question": "A compressed row [.2,.8,.7,99] represents cache span [70,73). Select the two highest valid keys. A second row has an empty span [70,70). Which pair of returned lists respects both contracts?",
    "options": [
      "First [1,2]; empty [].",
      "First [71,72]; empty [].",
      "First [73,71]; empty [].",
      "First [71,72]; empty [70]."
    ],
    "answer": "First [71,72]; empty [].",
    "explanation": "Only columns 0,1,2 are valid. Their two largest scores occur at 1 and 2, which map through start 70 to tokens 71 and 72. Column 3 is unwritten/invalid even though its filler sentinel is 99. An empty span returns no keys; a row of excluded scores cannot justify inventing token 70."
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
    "explanation": "The view offset is 2×9+1×2=20; the packed-reader offset is 2×3+1×1=7. Equal logical shape therefore does not guarantee compatible addressing. The mismatched layout must be materialized or rejected under the actual descriptor specification before the kernel reads it."
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
    "explanation": "A compiles and B hits because its generated inputs remain the same. The changed effective flag makes C compile; D hits that entry. A dump setting does not change this cache digest and only acts when compilation occurs, so D does not rebuild a missing dump. This example assumes stable tracked and implicit compiler inputs."
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
    "explanation": "With two slots: dispatch A 0–2, compute A 2–5 alongside dispatch B 2–4, combine A 5–6 alongside compute B 5–8, combine B 8–9. With one slot, B cannot dispatch before A combines at 6, so both chunks serialize to 12. Eight drops a dependency; ten is feasible but is not the earliest two-slot completion."
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
    "explanation": "The kernel ratio is 120/80=1.5. Include preparation: baseline 140 and candidate 170, so the candidate layer is 30/140≈21.4% slower. Reporting only 80 versus 120 measures the inner kernel and omits the stage that reverses the full-layer choice."
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
    "explanation": "At 2²⁵, FP32 spacing is 4, so adding 1 rounds back to a; subtracting a then gives 0. In the other association a−a is exactly 0, then adding 1 gives 1. The inputs and random seed can stay fixed while changing the reduction order changes the result. A kernel determinism setting and output rounding policy must be checked separately."
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
    "explanation": "T0 gets 0.25 × 3 + 0.75 × 7 = 6. T1 gets 0.6 × 2 + 0.4 × 8 = 4.4. Run B gives each token its value. Reversing the source token order would select run A. Checking only the total of 10.4 would accept both runs. Giving the two experts equal weight for each token would produce [5,5] and reject both runs."
  }
]
```

> **Next:** Continue to [Deep Dive - NCCL](/learn/deep-dive-nccl). DeepGEMM showed how one GPU kernel turns hardware contracts into measured tensor throughput, including Mega MoE's NVLink overlap for expert-parallel tokens. <span data-glossary="nccl">NCCL</span> adds the general collective layer that moves gradients and activations across GPUs before <span data-glossary="nvidia-megatron">Megatron</span> assembles both into a distributed training stack.
