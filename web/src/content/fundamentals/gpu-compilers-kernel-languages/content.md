---
{
  "id": "gpu-compilers-kernel-languages",
  "title": "GPU Compilers and Kernel Languages",
  "slug": "gpu-compilers-kernel-languages",
  "section": "GPU Systems & LLM Inference",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 12,
  "shortDescription": "A correct kernel can still stall on its first call or fail because no image matches the GPU. The evidence is in the compiler artifacts.",
  "keyConceptsTested": [
    "CUDA compilation trajectory",
    "LLVM and NVVM intermediate representation",
    "PTX, cubin, fatbin, and SASS layers",
    "nvcc, cuobjdump, and nvdisasm inspection",
    "Register pressure, occupancy cliffs, and local memory spilling",
    "Ahead-of-time and just-in-time compilation rules",
    "Concurrent JIT cache publication and compilation identity",
    "CUDA C++ and Triton programming models",
    "Triton MLIR lowering and conditional layout optimizations",
    "CUTLASS, CuTe, CUDA Tile, Pallas, and NKI trade-offs",
    "Compiler and runtime failure diagnosis"
  ],
  "companies": [
    "NVIDIA",
    "OpenAI",
    "Google",
    "Amazon Web Services",
    "Meta"
  ],
  "prerequisites": [
    "gpu-parallel-primitives-lab",
    "gpu-kernel-performance-engineering-lab",
    "cuda-gpu-computing-for-ml"
  ],
  "relatedQuestions": [
    "gemm-naive-cuda-tensor-cores",
    "low-precision-gpu-programming",
    "flashattention-memory-efficient-attention",
    "deep-dive-deepgemm"
  ]
}
---

Your vector-add kernel passed every test yesterday, yet today its first call stalls for 300 ms or crashes on a newer GPU with `"no kernel image is available"`. Reading the source again won't explain either failure. A <span data-glossary="gpu">GPU</span> never executes <span data-glossary="cuda">CUDA</span> C++ or Python directly; both symptoms live in the compiler artifacts between source and silicon.

## One addition, several representations

To compute `out[i] = x[i] + y[i]` for $n = 1{,}000$ floats with 256 threads per block, CUDA launches four blocks (1,024 threads) and guards the 24 tail threads. Notice the `size_t` index widening and overflow-safe block calculation (`n / threads + (n % threads != 0)` instead of `(n + threads - 1) / threads`, which overflows signed `int` near `INT_MAX`):

```cpp title="vector_add.cu"
__global__ void add_kernel(const float* x, const float* y, float* out, int n) {
    std::size_t i = static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
    if (i < static_cast<std::size_t>(n)) out[i] = x[i] + y[i];
}

void launch_add(const float* x, const float* y, float* out, int n) {
    if (n <= 0) return;  // Zero-block launches are invalid.
    constexpr int threads = 256;
    int blocks = n / threads + (n % threads != 0);
    add_kernel<<<blocks, threads>>>(x, y, out, n);
}
```

At source level you see the bounds check, not the emitted instructions or physical registers. For SIMT kernels, `nvcc` lowers device code through four distinct artifacts:[^nvccGuide2026][^nvidiaPtxIsa2026][^cudaBinaryUtilities2026][^nvvmIr2026][^libnvvm2026]

$$
\text{source} \rightarrow \text{LLVM/NVVM IR} \rightarrow \text{PTX} \rightarrow \text{ptxas} \rightarrow \text{cubin (SASS)}
$$

- **PTX (Parallel Thread Execution):** Versioned virtual ISA using virtual registers (`%f1`, `%f2`, `%rd3`). Portable forward to compatible newer GPUs only when the driver supports that PTX ISA version.
- **`ptxas` -> cubin:** Optimizing assembler allocates physical registers, schedules instructions, inserts spills if needed, and writes target-specific machine code into an ELF **cubin** (e.g. `sm_90`).
- **SASS:** Human-readable disassembly of native machine code inside a cubin (`nvdisasm`), not an executable source format.

<figure>
<img src="illustrations/_generated/compiler_artifact_path_dark.png"
     alt="CUDA block 0 thread 1 and Triton pid 0 offset 1 both map to index i=1, where x[1]=0.25 and y[1]=-2. CUDA lowers through NVVM IR and LLVM IR while Triton lowers through TTIR, TTGIR, and LLVM IR to PTX (%f1=0.25, %f2=-2, %f3=-1.75 stored to out[1]). Toolkit ptxas allocates physical registers into an ELF cubin executed by the driver and decoded by nvdisasm as SASS." />
<figcaption>CUDA and Triton both lower to PTX virtual registers (`%f1`, `%f2`, `%f3`), which `ptxas` assembles into a target cubin with physical registers; `nvdisasm` renders that machine code as SASS.</figcaption>
</figure>

## `nvcc` packages host code with architecture-specific device images

`nvcc` separates host C++ from device code and embeds one or more device images inside a **fatbinary (fatbin)**.[^nvccGuide2026] The flags distinguish virtual vs. native intent:

| Target spelling | Artifact embedded | Runtime effect |
|---|---|---|
| `compute_90` | PTX for virtual compute capability 9.0 | Driver can JIT-compile forward for compatible newer GPUs |
| `sm_90` | Native cubin for 9.0 silicon | Loads natively without PTX JIT |
| Suffixes (`compute_90a`, `compute_100f`) | Architecture- or family-restricted PTX | Disables general forward compatibility across major architectures |

At load time, the CUDA driver prefers a compatible native cubin; only a cubin miss triggers PTX driver JIT (which still requires a driver supporting the emitted PTX ISA version).

<figure>
<img src="illustrations/_generated/fatbin_loader_selection_dark.png"
     alt="A host executable contains an sm_90 cubin and compute_90 PTX. A compatible cubin ends at native load. Only a cubin miss reaches the PTX and driver-ISA check, then driver JIT and cache; without a usable image, loading fails. Fresh-process checks can force PTX and disable disk caching, or disable PTX JIT so a missing cubin fails. Module loading can remain lazy." />
<figcaption>The loader takes native cubin first and falls back to PTX JIT only on a cubin miss. Test both paths explicitly via `CUDA_FORCE_PTX_JIT=1` and `CUDA_DISABLE_PTX_JIT=1`.</figcaption>
</figure>

## Produce artifacts you can inspect

Compile both a native cubin and forward-compatible PTX, then inspect the fatbin with `cuobjdump` (works on host executables and fatbins) and standalone cubins with `nvdisasm` (adds source-line and register-liveness views):[^cudaBinaryUtilities2026]

```bash title="build-and-inspect.sh"
nvcc -O3 -lineinfo -Xptxas -v \
  --generate-code arch=compute_90,code=sm_90 \
  --generate-code arch=compute_90,code=compute_90 \
  vector_add.cu -o build/vector_add

cuobjdump --list-elf --list-ptx --dump-resource-usage build/vector_add
nvcc -O3 -lineinfo --cubin --generate-code arch=compute_90,code=sm_90 \
  vector_add.cu -o build/vector_add.sm_90.cubin
nvdisasm --print-code --print-line-info --print-life-ranges \
  build/vector_add.sm_90.cubin > build/vector_add.liveness.sass
```

> **Common mistake:** Treating a shorter SASS listing as automatically faster. Latency hiding, memory transactions, occupancy, and dependency chains determine runtime; static instruction counts cannot replace profiling.

## Register pressure, occupancy cliffs, and spilling

Every SM holds 65,536 32-bit registers (64 max warps on Hopper `sm_90` and Blackwell `sm_100`; 48 max warps on Ada `sm_89` and Blackwell `sm_120`).[^nvidia2026hopperTuning][^nvidia2026adaTuning][^nvidia2026blackwellTuning] Because hardware allocates registers per warp in **256-register granules**, a single extra register per thread (32 to 33) rounds each 32-lane warp from 1,024 to 1,280 registers, dropping an 8-warp block from 8 resident blocks (64 warps, 100%) to 6 blocks (48 warps, 75%)!

<!-- leetllm: test, output=show, id=gpu-occupancy-resource-model -->
```python title="resource_puzzle.py"
import math

def resident_warps(regs, *, warp_limit=64, shared_per_block=0):
    warps_per_block = 8
    regs_per_warp = math.ceil(32 * regs / 256) * 256
    blocks = min(65536 // (warps_per_block * regs_per_warp), warp_limit // warps_per_block)
    if shared_per_block:
        blocks = min(blocks, (96 * 1024) // shared_per_block)
    return blocks * warps_per_block

for r in (32, 33, 41, 65, 129):
    w = resident_warps(r)
    print(f"R={r:3d}: {w:2d} warps ({100 * w / 64:5.1f}% of 64)")
print(f"R=33 on 48-warp SM: {resident_warps(33, warp_limit=48)} warps (100%)")
print(f"R=32 + 32 KiB shared (96 KiB SM): {resident_warps(32, shared_per_block=32768)} warps (37.5%)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
R= 32: 64 warps (100.0% of 64)
R= 33: 48 warps ( 75.0% of 64)
R= 41: 40 warps ( 62.5% of 64)
R= 65: 24 warps ( 37.5% of 64)
R=129:  8 warps ( 12.5% of 64)
R=33 on 48-warp SM: 48 warps (100%)
R=32 + 32 KiB shared (96 KiB SM): 24 warps (37.5%)
```
<!-- leetllm: output:end -->

<figure>
<img src="illustrations/_generated/rounded_register_residency_dark.png"
     alt="Bar chart and register-budget comparison for 256-thread (8-warp) blocks on a 65,536-register SM with 256-register warp allocation granules. At R32, 8 blocks occupy all 64 warps (65,536 registers, 100% occupancy). At R33, rounding 1,056 registers per warp to 1,280 drops capacity to 6 blocks and 48 warps (61,440 used, 4,096 unused). R41, R65, and R129 drop to 40, 24, and 8 warps. Separate panels show 48/48 full occupancy under a 48-warp cap at R33 and a 24-warp ceiling when shared memory limits residency to 3 blocks." />
<figcaption>Warp-granule rounding turns 32 -> 33 registers/thread into a 25% occupancy cliff on a 64-warp SM, while shared-memory budgets can cap residency independently.</figcaption>
</figure>

### Spills, `ptxas -v`, and artifact identity

When registers run out, `ptxas` spills values to `.local` memory (device-backed and cached, not automatically an HBM stall; CUDA 13.0 also adds opt-in shared-memory spilling in whole-program mode[^shanmughan2025sharedSpilling]). Control limits with `--maxrregcount=N` or `__launch_bounds__(maxThreadsPerBlock, minBlocksPerMultiprocessor)` (launching more than `maxThreadsPerBlock` fails at runtime) and always compare `-Xptxas -v` logs alongside warm timings.[^nvccGuide2026][^cudaCppIntrinsics2026]

For reproducible JIT caches, hash the complete compilation recipe: source **plus transitive headers**, compiler version, ordered flags, target architecture (note `sm_90a` for WGMMA vs. `sm_90`), shape, **strides**, dtype, block size, `num_warps`, and `num_stages`. Hashing only the top-level source file silently reuses stale binaries when an included header or tensor stride changes:[^nvrtc2026]

<!-- leetllm: test, output=show, id=gpu-compilation-identity -->
```python title="compilation_identity.py"
from dataclasses import asdict, dataclass, replace
import hashlib, json

@dataclass(frozen=True)
class Recipe:
    source_sha256: str
    toolchain: str
    target: str
    flags: tuple[str, ...]
    shape: tuple[int, ...]
    strides: tuple[int, ...]
    dtype: str
    block: int

    def key(self, headers=None):
        deps = sorted((k, hashlib.sha256(v).hexdigest()) for k, v in (headers or {}).items())
        return hashlib.sha256(json.dumps([asdict(self), deps], sort_keys=True).encode()).hexdigest()

base = Recipe(hashlib.sha256(b"v1").hexdigest(), "nvcc-12.8", "sm_90", ("-O3",), (1000,), (1,), "fp32", 256)
k_v1 = base.key({"scale.cuh": b"#define SCALE 1\n"})
k_v2 = base.key({"scale.cuh": b"#define SCALE 2\n"})
k_stride2 = replace(base, strides=(2,)).key({"scale.cuh": b"#define SCALE 1\n"})
assert len({k_v1, k_v2, k_stride2}) == 3
print("header edit and stride-2 view both produce distinct cache keys")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
header edit and stride-2 view both produce distinct cache keys
```
<!-- leetllm: output:end -->

<figure>
<img src="illustrations/_generated/specialization_identity_dark.png"
     alt="The CUDA source stays unchanged while scale.cuh changes SCALE from 1 to 2. For inputs 4 and 5 the required result changes from 9 to 18. A source-only key reuses stale result 9, while a key that includes transitive header bytes changes and misses. The full recipe identity also binds compiler, ordered flags, target, shape, stride, dtype, block, warps, and stages; changing stride 1 to 2 creates a miss." />
<figcaption>Include transitive headers, flags, target, and tensor strides in every JIT cache key so edits to `scale.cuh` or stride-2 views never hit a stale binary.</figcaption>
</figure>

## JIT is part of request latency

Runtime compilers (`NVRTC`, `nvJitLink`, driver PTX JIT, and Triton) shift compilation latency onto the first request.[^nvrtc2026][^nvidia2026nvJitLink][^cudaProgrammingGuide2026] Moreover, CUDA module loading is **lazy by default**, so even a native cubin can pay first-call load latency unless warmed up outside the request path.[^cudaEnvironment2026] Test both branches in fresh processes:

```bash title="test-fatbin-branches.sh"
CUDA_FORCE_PTX_JIT=1 CUDA_CACHE_DISABLE=1 ./build/vector_add
CUDA_DISABLE_PTX_JIT=1 ./build/vector_add
```

<figure>
<img src="illustrations/_generated/cold_warm_request_boundary_dark.png"
     alt="A log10-scale horizontal latency bar chart spanning 1 microsecond to 1 second compares four GPU kernel execution paths: cold PTX or Triton JIT compilation takes roughly 300 ms, cold compatible cubin lazy loading takes roughly 15 ms, warm cache-hit kernel launch takes roughly 40 us, and CUDA Graph replay takes roughly 12 us, highlighting a 7,500x to 25,000x latency gap." />
<figcaption>On a logarithmic scale, cold PTX/Triton JIT (~300 ms) and lazy cubin loading (~15 ms) sit three to four orders of magnitude above warm kernel launches (~40 µs) and CUDA Graph replay (~12 µs).</figcaption>
</figure>

### Eight ranks, two different cache questions

When eight workers miss the same cache entry concurrently, separate **atomic visibility** from **duplicate work**: Triton stages into a unique temp path and publishes via `os.replace` so readers never observe partial files (without guaranteeing cross-file group atomicity or power-loss durability), while an optional cooperating-writer lock with exact-key recheck prevents eight redundant compiles.[^triton2026fileCache] A rank-0 warmup helps other ranks only when both **shared cache storage** and **exact target/recipe identity** match.

<figure>
<img src="illustrations/_generated/concurrent_cache_publication_dark.png"
     alt="Two compilers for key K write and close separate complete temporary files; either can atomically replace the single destination. A reader opening K before the shared replace sees the old complete file; opening after sees the new complete file. An optional lock, exact-key recheck, compile-on-miss, then publish sequence reduces duplicate work for cooperating writers. Distinct keys use separate entries. Crash durability and multi-file transactions require separate guarantees." />
<figcaption>Atomic rename (`os.replace`) protects readers from partial files; a lock plus exact-key recheck avoids duplicate compilation across ranks.</figcaption>
</figure>

<figure>
<img src="illustrations/_generated/rank_warmup_identity_dark.png"
     alt="Rank 0 compiles an sm_90 recipe and warms a shared cache entry with key K(sm_90). After synchronization, rank 1 requests sm_100, producing K(sm_100) and missing the shared sm_90 entry. A worker with the identical sm_90 recipe also misses when its physical cache is private and empty. Target identity and storage visibility both determine warmup reuse." />
<figcaption>Rank-0 warmup hits only when another rank shares the physical cache directory and requests the exact same recipe and target.</figcaption>
</figure>

## Same kernel, different unit of thought

CUDA C++ describes one scalar thread; <span data-glossary="triton-language">Triton</span> describes one blocked **program instance** over a vector of offsets:[^tritonProgrammingGuide2026][^tritonVectorAdd2026]

```python title="vector_add_triton.py"
import triton, triton.language as tl

@triton.jit
def add_kernel(x_ptr, y_ptr, out_ptr, n, BLOCK: tl.constexpr):
    offsets = tl.program_id(0).to(tl.int64) * BLOCK + tl.arange(0, BLOCK)
    mask = offsets < n
    x = tl.load(x_ptr + offsets, mask=mask, other=0.0)
    y = tl.load(y_ptr + offsets, mask=mask, other=0.0)
    tl.store(out_ptr + offsets, x + y, mask=mask)
```

### How Triton compiles: the MLIR lowering pipeline

On NVIDIA GPUs, Triton lowers through five MLIR/backend stages: **TTIR** (target-agnostic block ops) -> **TTGIR** (distributed lane/warp layouts, coalescing, swizzles, software pipelining) -> **LLVM IR** (shared-memory allocation, zero for plain vector add) -> **PTX** -> **`ptxas` cubin** (invoked directly by Triton's backend).[^triton2026nvidiaCompiler]

<figure>
<img src="illustrations/_generated/ir_layout_and_liveness_dark.png"
     alt="Triton lowers from TTIR to TTGIR layout, LLVM IR, PTX, and cubin. A 4x4 lane-ownership grid maps rows 0..3, 4..7, 8..11, and 12..15 to lanes L0 through L3 at TTGIR layout, while shared memory stays zero for plain vector add. Separate liveness bars show nonoverlapping values A and B sharing physical register r0, whereas overlapping A and B stay live simultaneously in r0 and r1." />
<figcaption>Triton assigns warp/lane ownership at TTGIR and allocates shared memory during LLVM lowering, while register liveness decides whether values share or split physical registers.</figcaption>
</figure>

### Check ownership without a GPU

Always test edge lengths (`0, 1, 255, 256, 257`) and `INT_MAX` arithmetic so off-by-one `<=` masks and 32-bit offset wraps get caught before touching hardware:

<!-- leetllm: test, output=show, id=gpu-index-coverage -->
```python title="check_index_coverage.py"
def covered(n, block=256, include_equal=False):
    blocks = n // block + (n % block != 0)
    idx = [p * block + l for p in range(blocks) for l in range(block)
           if p * block + l < n or (include_equal and p * block + l == n)]
    return blocks, idx

for n in (0, 1, 255, 256, 257, 1000):
    b, idx = covered(n)
    assert idx == list(range(n))
    print(f"n={n:4d}: blocks={b}, masked={b * 256 - n}")
assert covered(256, include_equal=True)[1] == list(range(256))  # Full block hides <= bug!
assert covered(257, include_equal=True)[1][-1] == 257           # n=257 exposes it.

n_max = (1 << 31) - 1
blocks = n_max // 256 + (n_max % 256 != 0)
print(f"INT_MAX: {blocks} blocks, {blocks * 256 - n_max} masked lane (no int32 overflow)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
n=   0: blocks=0, masked=0
n=   1: blocks=1, masked=255
n= 255: blocks=1, masked=1
n= 256: blocks=1, masked=0
n= 257: blocks=2, masked=255
n=1000: blocks=4, masked=24
INT_MAX: 8388608 blocks, 1 masked lane (no int32 overflow)
```
<!-- leetllm: output:end -->

<figure>
<img src="illustrations/_generated/scalar_thread_blocked_ownership_dark.png"
     alt="CUDA scalar threads (B0..B3) and Triton blocked programs (pid 0..3) partition n=1000 into four 256-element blocks. The fourth block spans offsets 768 to 1023 with 232 valid lanes and 24 masked lanes; sample sums include 0+(-3)=-3 and 0.25+(-2)=-1.75. For n=257, block 0 holds 256 valid lanes and block 1 holds 1 valid lane (i=256) plus 255 masked lanes, exposing an i<=n bug that n=256 hides. For INT_MAX (2,147,483,647), quotient plus remainder produces 8,388,608 blocks, 2,147,483,648 padded lanes, and 1 masked lane." />
<figcaption>Full blocks (`n=256`) conceal an `i <= n` off-by-one bug that `n=257` immediately exposes, while quotient-plus-remainder avoids `int32` launch overflow at `INT_MAX`.</figcaption>
</figure>

## Six authoring surfaces, six control contracts

Kernel languages are not a ranking from "easy" to "fast"; each picks which decisions belong to the author vs. the compiler:

| Surface | Main authoring unit | What you control explicitly | Target scope |
|---|---|---|---|
| **CUDA C++**[^cudaProgrammingGuide2026] | Scalar thread, warp, block | Thread geometry, sync, intrinsics, memory spaces | NVIDIA GPUs |
| **Triton**[^tritonProgrammingGuide2026][^tritonRepository2026] | Blocked program | Tile shapes, masked loads/stores, launch meta-params | NVIDIA & AMD GPUs |
| **<span data-glossary="cutlass">CUTLASS</span> / CuTe**[^cutlassDocs2026] | Hierarchical layouts & hardware atoms | Exact layout algebra, copy/MMA atoms, C++ or Python CuTe-DSL | NVIDIA GPUs |
| **CUDA Tile**[^cudaTile2026] | Block-level immutable tiles | Power-of-two tile ops; compiler owns intra-block threads | CUDA Tile-capable NVIDIA stack |
| **Pallas**[^jaxPallas2026][^jaxPallasChangelog2026] | Grid program over `Ref`s & `BlockSpec` | HBM/VMEM or SMEM transfers and JAX composition | JAX GPU & TPU |
| **NKI**[^awsNki2026] | Tile over Neuron engines & SBUF | Explicit HBM $\leftrightarrow$ SBUF DMA and `nki.isa` ops | AWS Inferentia2 & Trainium |

## Diagnose the first failing boundary

Isolate compiler bugs by finding the last stage that produced valid output:

| Symptom | Failing stage | First evidence to inspect |
|---|---|---|
| Type/intrinsic compile error | Source -> Frontend IR | Compiler log + minimal reproducer + pinned API version |
| `ptxas` rejects instruction | PTX -> cubin | PTX `.target` / `.version`, toolkit version, `sm` suffix (`sm_90a`) |
| `"No kernel image"` at launch | Fatbin loader | GPU compute capability vs. `cuobjdump --list-elf --list-ptx` |
| Forced PTX JIT fails, cubin works | Driver PTX JIT | Embedded PTX ISA version vs. installed driver floor |
| Slow first call, fast warm calls | JIT or lazy module load | Fresh-process trace, cache state, warm exact shapes ahead of traffic |
| Registers jump & speed drops | IR / `ptxas` allocation | Diff `-Xptxas -v` logs, SASS liveness, occupancy & stall counters |
| Edge shape or strided view wrong | Mask or JIT cache key | Test `n=255, 257` and stride-2; check specialization key fields |

## Choose by the decision you must own

Start with framework ops and vendor libraries (cuBLAS, cuDNN, FlashAttention). Drop to **Triton** for custom block fusion, **Pallas** for JAX GPU/TPU integration, **NKI** for AWS Neuron SBUF control, **CUDA Tile** when compiler-owned threads suffice, **CUTLASS/CuTe** for custom MMA/layout pipelines, and **CUDA C++** when irregular per-thread control or custom intrinsics are required.

## Mastery check

```mastery-quiz
[
  {
    "question": "A kernel's PTX shows separate multiply and add instructions, while its disassembled cubin encodes one `FFMA`. How many native arithmetic instructions run, and how should you compare it against a non-fused build?",
    "options": [
      "Two native instructions; compare timings and rounding-sensitive inputs.",
      "One native instruction; compare timings and rounding-sensitive inputs.",
      "One native instruction; rank purely by instruction count.",
      "Two native instructions; matching `2*5+3=13` confirms identical rounding."
    ],
    "answer": "One native instruction; compare timings and rounding-sensitive inputs.",
    "explanation": "The cubin encodes one fused `FFMA` regardless of earlier PTX. Instruction counts alone never determine speed, and exact integer inputs hide single- vs. double-rounding differences."
  },
  {
    "question": "On a compute capability 8.6 GPU whose driver supports PTX ISA <= 8.0, `CUDA_DISABLE_PTX_JIT=1` fails while `CUDA_FORCE_PTX_JIT=1` succeeds. Which fatbin inventory matches?",
    "options": [
      "`sm_86` cubin + `compute_80` PTX (ISA 7.6).",
      "`sm_70` cubin + `compute_90` PTX (ISA 7.8).",
      "`sm_75` cubin + `compute_80` PTX (ISA 8.1).",
      "`sm_70` cubin + `compute_75` PTX (ISA 7.8)."
    ],
    "answer": "`sm_70` cubin + `compute_75` PTX (ISA 7.8).",
    "explanation": "`sm_70` cannot load natively on CC 8.6 (failing cubin-only mode), while `compute_75` PTX at ISA 7.8 is forward-compatible with CC 8.6 and supported by the driver."
  },
  {
    "question": "With 8 warps/block, 65,536 registers/SM, 64-warp cap, and 256-register warp granules, registers/thread rise from 37 to 40. What happens to theoretical occupancy?",
    "options": [
      "Drops from 7 blocks to 6 blocks.",
      "Stays at 5 blocks (40 warps).",
      "Stays at 6 blocks (48 warps).",
      "Stays at 8 blocks (64 warps)."
    ],
    "answer": "Stays at 6 blocks (48 warps).",
    "explanation": "Both 37*32 = 1,184 and 40*32 = 1,280 round to the exact same 1,280-register warp granule (10,240 per block), fitting floor(65536/10240) = 6 blocks (48 warps)."
  },
  {
    "question": "A writer atomically replaces `kernel.cubin` with artifact B, then crashes before replacing its metadata file (still describing artifact A). What does this prove about multi-file caches?",
    "options": [
      "Complete individual files still form an inconsistent group unless manifest and artifact hashes match.",
      "Atomic replacement of one file binds the sibling metadata files in the same directory atomically.",
      "Readers opening the replaced cubin observe corrupted half-written machine-code bytes on disk.",
      "Checking that both files exist on disk confirms the cubin and metadata belong to the same build."
    ],
    "answer": "Complete individual files still form an inconsistent group unless manifest and artifact hashes match.",
    "explanation": "Two separate `os.replace` calls are not one multi-file transaction. Always validate group manifests and matching digests."
  },
  {
    "question": "For `n = 515` and `block = 128` guarded by `i < n`, how many total lanes launch and how many lanes in the final block are valid vs. masked?",
    "options": [
      "640 lanes; final block 4 valid, 124 masked.",
      "515 lanes; final block 3 valid, 125 masked.",
      "512 lanes; final block 128 valid, 0 masked.",
      "640 lanes; final block 3 valid, 125 masked."
    ],
    "answer": "640 lanes; final block 3 valid, 125 masked.",
    "explanation": "ceil(515/128) = 5 blocks = 640 lanes. The fifth block starts at index 512, so 3 lanes (512, 513, 514) are valid and 125 are masked."
  }
]
```

> **Next:** Continue to [GEMM From Naive CUDA to Tensor Cores](/learn/gemm-naive-cuda-tensor-cores).
