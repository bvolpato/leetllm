---
{
  "id": "gpu-compilers-kernel-languages",
  "title": "GPU Compilers and Kernel Languages",
  "slug": "gpu-compilers-kernel-languages",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 13,
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
    "accelerator-architecture-field-guide"
  ],
  "relatedQuestions": [
    "gemm-naive-cuda-tensor-cores",
    "low-precision-gpu-programming",
    "flashattention-memory-efficient-attention",
    "deep-dive-deepgemm"
  ]
}
---

Your vector-add kernel passed every correctness check yesterday. Suppose the same source now takes 300 milliseconds on its first call, or fails on a newer GPU with "no kernel image is available." Reading the source again won't explain either symptom. The <span data-glossary="gpu">GPU</span> never executes <span data-glossary="cuda">CUDA</span> C++ or Python directly.

The [accelerator field guide](/learn/accelerator-architecture-field-guide) named the hardware owners of execution and memory. The [parallel primitives lab](/learn/gpu-parallel-primitives-lab) made synchronization scope, reduction trees, and prefix dependencies measurable. A slow first call, or a GPU that reports no kernel image, is a different failure. It sits in the artifacts between the source you can read and the instructions the device runs.

## One addition, several representations

For 1,000 pairs of numbers, add each pair into a separate output slot. At index zero, $0 + (-3) = -3$; at index one, $0.25 + (-2) = -1.75$. In general, write $out_i = x_i + y_i$ for each valid index $i$.

CUDA C++ expresses the work from one thread's point of view. With 256 threads per block, 1,000 elements require four blocks: 1,024 threads, of which 24 must skip memory access. The test harness below also checks lengths right around a block edge.

Save this as `vector_add.cu`. Exact equality works here because these powers-of-two inputs are exact in FP32; reductions and matrix multiplications need explicit numerical tolerances.

```cpp title="vector_add.cu"
#include <cuda_runtime.h>

#include <cmath>
#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <vector>


void check(cudaError_t status) {
    if (status != cudaSuccess) {
        std::cerr << cudaGetErrorString(status) << "\n";
        std::exit(1);
    }
}


__global__ void add_kernel(
    const float* x,
    const float* y,
    float* out,
    int n
) {
    std::size_t i = static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
    if (i < static_cast<std::size_t>(n)) {
        out[i] = x[i] + y[i];
    }
}

void launch_add(const float* x, const float* y, float* out, int n) {
    if (n < 0) throw std::invalid_argument("negative length");
    if (n == 0) return;  // A zero-block GPU launch is invalid.
    constexpr int threads = 256;
    int blocks = n / threads + (n % threads != 0);
    add_kernel<<<blocks, threads>>>(x, y, out, n);
}


bool matches(const std::vector<float>& actual,
             const std::vector<float>& expected) {
    if (actual.size() != expected.size()) return false;
    for (std::size_t i = 0; i < actual.size(); ++i) {
        if (!std::isfinite(actual[i]) || actual[i] != expected[i]) return false;
    }
    return true;
}

bool run_case(int n) {
    std::vector<float> x(n), y(n), expected(n), out(n);
    for (int i = 0; i < n; ++i) {
        x[i] = 0.25F * i;
        y[i] = float(i % 7 - 3);
        expected[i] = x[i] + y[i];
    }

    float *d_x, *d_y, *d_out;
    check(cudaMalloc(&d_x, n * sizeof(float)));
    check(cudaMalloc(&d_y, n * sizeof(float)));
    check(cudaMalloc(&d_out, n * sizeof(float)));
    check(cudaMemcpy(d_x, x.data(), n * sizeof(float), cudaMemcpyHostToDevice));
    check(cudaMemcpy(d_y, y.data(), n * sizeof(float), cudaMemcpyHostToDevice));

    // All-one FP32 bit patterns are NaNs: skipped writes must fail the check.
    check(cudaMemset(d_out, 0xff, n * sizeof(float)));
    launch_add(d_x, d_y, d_out, n);
    check(cudaGetLastError());
    check(cudaDeviceSynchronize());
    check(cudaMemcpy(out.data(), d_out, n * sizeof(float), cudaMemcpyDeviceToHost));

    check(cudaFree(d_x));
    check(cudaFree(d_y));
    check(cudaFree(d_out));

    bool correct = matches(out, expected);
    std::cout << (correct ? "PASS" : "FAIL") << " n=" << n << "\n";
    return correct;
}

int main() {
    // Test the checker itself: NaNs and wrong values must fail.
    if (matches({std::numeric_limits<float>::quiet_NaN()}, {4.0F}) ||
        matches({3.0F}, {4.0F}) || matches({}, {4.0F})) return 1;
    launch_add(nullptr, nullptr, nullptr, 0);  // No GPU access.
    for (int n : {1, 255, 256, 257, 1000}) {
        if (!run_case(n)) return 1;
    }
    return 0;
}
```

Successful execution prints `PASS n=1`, `PASS n=255`, `PASS n=256`, `PASS n=257`, and `PASS n=1000`. Distinct input values help catch misplaced writes; checking finiteness prevents a NaN from disappearing inside a maximum-error reduction. Large-index overflow, arbitrary strides, and aliasing are tested separately below.

At source level, you can inspect the bounds check and the index formula. You can't yet prove which machine instructions were emitted, how many physical registers they require, or whether a deployed binary contains code for the target GPU.

NVIDIA's offline compiler driver, `nvcc`, coordinates separate host and device compilation. For this SIMT device kernel, the compilation path reaches <span data-glossary="ptx">Parallel Thread Execution (PTX)</span>, a versioned virtual instruction set architecture (ISA). PTX names virtual registers such as `%r0` and `%f0`; these names don't assign physical registers. It still specifies a target feature set, and its producer can optimize for that target. A PTX file isn't independent of architecture, ISA version, or driver support.[^nvccGuide2026][^nvidiaPtxIsa2026]

The optimizing assembler, `ptxas`, transforms PTX into a CUDA binary, called a **cubin**, for a specific streaming multiprocessor target such as `sm_90`. A cubin is an ELF container holding encoded GPU machine instructions and metadata.[^cudaBinaryUtilities2026] Target compilation allocates physical registers, schedules instructions, and may spill values to memory; register assignment can shift across compiler releases, and instruction scheduling hides only the latency for which independent work exists.

Engineers commonly call the human-readable native instruction listing **SASS**. SASS isn't an executable artifact or a portable source format. It's a disassembly of target-specific machine instructions stored in a cubin.

This condensed PTX fragment shows the core arithmetic, omitting declarations, indexing setup, and bounds predication:

```ptx
// Virtual-register operations across the tiled reduction.
ld.global.f32   %f1, [%rd3];
ld.global.f32   %f2, [%rd4];
add.f32         %f3, %f1, %f2;
st.global.f32   [%rd5], %f3;
```

What should the native version look like? Build and disassemble your own cubin below. Locate the two input loads, addition, output store, and edge predicate. Check whether a physical register is reused after its old value's last use. The register numbers, load widths, instruction order, and total allocation depend on the build; an invented SASS listing cannot determine them.

There can also be an earlier compiler layer. NVVM intermediate representation (IR) is NVIDIA's GPU-oriented subset and extension of LLVM IR. Language frontends can generate NVVM IR, and `libNVVM` compiles compatible NVVM IR into PTX.[^nvvmIr2026][^libnvvm2026] That makes this conceptual path useful:

$$
\text{source} \rightarrow \text{LLVM/NVVM IR} \rightarrow \text{PTX} \rightarrow \text{ptxas} \rightarrow \text{cubin (SASS)}
$$

Don't turn a conceptual compiler layer into a deployment promise. `nvcc` publicly documents source-to-PTX and PTX-to-cubin stages; it doesn't promise a stable, human-readable NVVM file for every build. Another frontend may use different IRs before it reaches PTX, and a non-NVIDIA backend won't target PTX at all. CUDA Tile, introduced later, has a separate Tile IR path; the SIMT path here isn't a universal pipeline for every CUDA language.

<figure>
<img src="illustrations/_generated/compiler_artifact_path_dark.png"
     alt="CUDA block 0 thread 1 and Triton pid 0 offset 1 both map to index i=1, where x[1]=0.25 and y[1]=-2. CUDA lowers through NVVM IR and LLVM IR while Triton lowers through TTIR, TTGIR, and LLVM IR to PTX (%f1=0.25, %f2=-2, %f3=-1.75 stored to out[1]). Toolkit ptxas allocates physical registers into an ELF cubin executed by the driver and decoded by nvdisasm as SASS." />
<figcaption>CUDA thread 1 and Triton offset 1 both map to index i=1, loading x[1]=0.25 and y[1]=-2 into virtual PTX registers %f1 and %f2, adding into %f3=-1.75, and storing to out[1]. Toolkit ptxas allocates physical registers while assembling the target cubin; the GPU driver either runs that cubin directly or compiles PTX ahead of launch, while nvdisasm renders machine code as SASS.</figcaption>
</figure>

```checkpoint
You find an `FFMA` instruction in `nvdisasm` output. Which layer provides direct evidence that this native operation exists?
---
The target cubin. `nvdisasm` reads encoded machine instructions from a cubin and renders them as SASS. A source expression or PTX instruction can suggest an `FFMA`, but a later compiler stage may still fuse, split, remove, or replace it.
```

## `nvcc` packages host code with architecture-specific device images

A CUDA translation unit may contain CPU host code and GPU device code. `nvcc` separates those paths, sends the host path to a supported C++ compiler, compiles device code for requested virtual and real architectures, and embeds device images into the host object. The container of one or more device images is a **fatbinary**, usually shortened to **fatbin**.[^nvccGuide2026]

The distinction between `compute_90` and `sm_90` records intent:

| Target spelling | Artifact meaning | Runtime consequence |
|---|---|---|
| `compute_90` | PTX using the virtual feature set associated with compute capability 9.0 | Driver may just-in-time compile it for a compatible current or later GPU |
| `sm_90` | Cubin containing native code assembled for the 9.0 hardware target | Compatible GPU can load it without PTX code generation |
| Both in a fatbin | Native code for known deployment plus PTX fallback | Loader prefers compatible binary and retains a forward-compatibility path |

Ordinary PTX targets such as `compute_90` provide a forward path to compatible later NVIDIA targets, not to older GPUs missing required features. The driver must also understand the emitted PTX ISA version. A toolkit upgrade can therefore raise the required driver version even when `compute_90` stays unchanged.

Target suffixes matter: architecture-specific PTX such as `compute_90a` has different forward-compatibility rules from family-specific targets such as `compute_100f`, which restrict compatibility to their documented family. Cubins are narrower still, with compatibility rules within supported major compute-capability families, not across major versions. Check the exact target suffix and version.[^nvccGuide2026]

At load time, the driver checks for a compatible cubin before it tries usable PTX:

<figure>
<img src="illustrations/_generated/fatbin_loader_selection_dark.png"
     alt="A host executable contains an sm_90 cubin and compute_90 PTX. A compatible cubin ends at native load. Only a cubin miss reaches the PTX and driver-ISA check, then driver JIT and cache; without a usable image, loading fails. Fresh-process checks can force PTX and disable disk caching, or disable PTX JIT so a missing cubin fails. Module loading can remain lazy." />
<figcaption>For this `sm_90` and `compute_90` package, a compatible cubin ends at native load; only a miss reaches the PTX and driver-ISA check. Forcing PTX takes that check, and `CUDA_CACHE_DISABLE=1` skips disk caching. With `CUDA_DISABLE_PTX_JIT=1`, a missing compatible cubin leaves no JIT path. Module loading can remain lazy.</figcaption>
</figure>

This branch explains two otherwise confusing observations. A cold process may pay compilation or lazy-loading cost before the first kernel. A package may run on the build machine yet fail on another GPU because neither a compatible cubin nor usable PTX was embedded.

## Produce artifacts you can inspect

On a supported CUDA development system, compile the CUDA source for one native Hopper target and keep PTX for future targets. `--keep` asks `nvcc` to retain supported intermediate files, while the two `--generate-code` entries package both `sm_90` cubin and `compute_90` PTX. Offline compilation and disassembly don't require a GPU, but they do require these NVIDIA tools and a supported host toolchain. Apple Clang alone can't run this lab. Use your deployment targets instead of copying `sm_90` onto unrelated hardware.

```bash title="terminal"
mkdir -p build/keep

nvcc -O3 -lineinfo \
  --generate-code arch=compute_90,code=sm_90 \
  --generate-code arch=compute_90,code=compute_90 \
  --keep --keep-dir build/keep \
  vector_add.cu -o build/vector_add
```

Create standalone PTX and cubin files as well. Keeping both separates the portable virtual ISA from native machine code and gives `nvdisasm` a cubin it can read directly.

```bash title="terminal"
nvcc -O3 --ptx \
  --gpu-architecture=compute_90 \
  vector_add.cu -o build/vector_add.compute_90.ptx

nvcc -O3 -lineinfo --cubin \
  --generate-code arch=compute_90,code=sm_90 \
  vector_add.cu -o build/vector_add.sm_90.cubin
```

Now inspect the package before judging performance. `cuobjdump` accepts a standalone cubin or a host executable, object, library, or external fatbin. `nvdisasm` accepts standalone cubins and adds richer control-flow and register-liveness views.[^cudaBinaryUtilities2026]

```bash title="terminal"
# What did the host executable package?
cuobjdump --list-elf build/vector_add
cuobjdump --list-ptx build/vector_add

# Read virtual and native instruction forms.
cuobjdump --dump-ptx build/vector_add > build/embedded.ptx
cuobjdump --dump-sass build/vector_add > build/embedded.sass

# Check per-kernel registers, local memory, shared memory, and stack use.
cuobjdump --dump-resource-usage build/vector_add

# Read one standalone cubin with source lines.
nvdisasm --print-code \
  --print-line-info \
  build/vector_add.sm_90.cubin > build/vector_add.lines.sass

# Generate a separate register-liveness view.
nvdisasm --print-code \
  --print-life-ranges \
  build/vector_add.sm_90.cubin > build/vector_add.liveness.sass
```

Read these outputs as a chain of evidence:

1. **PTX header:** Check `.version`, `.target`, address size, and kernel entry name. A mismatched `.target` can explain a deployment failure before launch.
2. **PTX body:** Look for global loads, bounds predication, arithmetic, and the store. This confirms virtual operations, not final scheduling.
3. **Resource report:** Record registers, static shared memory, local memory, and stack per kernel. Local memory can indicate spills, although not every local-memory use is a spill.
4. **SASS listing:** Confirm native loads, arithmetic, stores, predicates, and architecture-specific instructions. Compare against compiler flags and source line info.
5. **Profiler trace:** Measure executed instructions, memory behavior, and time on the target GPU. Static disassembly can't tell you which path dominates wall time.

> **⚠️ Common mistake:** A shorter SASS listing isn't automatically faster. Instruction latency, issue rate, dependency chains, memory transactions, occupancy, and input-dependent control flow still decide runtime behavior.

```checkpoint
A host executable inventories two native images. You need liveness for the kernel in its second image, but nvdisasm rejects the host file. Which next step preserves the identity of the object being inspected?
---
Extract the intended image with cuobjdump, then verify its liveness in the standalone target cubin.

cuobjdump can inventory and extract images from a host executable. nvdisasm consumes standalone cubins. Select the intended target image and symbol rather than substituting another representation or kernel.
```

## Register pressure, occupancy cliffs, and spilling

Register count constrains how many blocks can reside on an SM. It doesn't tell you how busy the execution units are. Shared memory, block size, block limits, allocation granularity, and architecture also constrain residency; dependencies and available work determine what resident warps actually execute.

Hopper compute capability 9.0 and Blackwell 10.0 support up to 64 resident warps per SM. Ada 8.9 and Blackwell 12.0 support 48. These targets have 65,536 32-bit registers per SM, but their other limits differ. “32 registers means 100% occupancy” therefore isn't a universal rule.[^nvidia2026hopperTuning][^nvidia2026adaTuning][^nvidia2026blackwellTuning]

Use a compact resource model with **explicit assumptions**: 256 threads per block (eight warps), 65,536 registers per SM, a 64-warp limit, and allocations rounded to 256 registers per warp, setting aside shared memory, block-count caps, and hardware partition rules.

| Registers per thread | Rounded registers per block | Resident blocks in this model | Resident warps | Occupancy against 64 warps |
|---|---|---|---|---|
| 32 | 8,192 | 8 | 64 | 100% |
| 33 | 10,240 | 6 | 48 | 75% |
| 41 | 12,288 | 5 | 40 | 62.5% |
| 65 | 18,432 | 3 | 24 | 37.5% |
| 129 | 34,816 | 1 | 8 | 12.5% |

<!-- leetllm: test, output=show, id=gpu-occupancy-resource-model -->
```python title="resource_puzzle.py"
import math


def resident_warps(registers, *, warp_limit=64, shared_per_block=0):
    warps_per_block = 8
    registers_per_warp = math.ceil(32 * registers / 256) * 256
    blocks = min(65536 // (warps_per_block * registers_per_warp),
                 warp_limit // warps_per_block)
    if shared_per_block:
        blocks = min(blocks, (96 * 1024) // shared_per_block)
    return blocks * warps_per_block


assert [resident_warps(r) for r in (32, 33, 41, 65, 129)] == [64, 48, 40, 24, 8]
for r in (32, 33, 41, 65, 129):
    w = resident_warps(r)
    print(f"R={r}: {w} warps, {100 * w / 64:g}%")
assert resident_warps(33, warp_limit=48) == 48
assert resident_warps(32, shared_per_block=32 * 1024) == 24
print("R=33, 48-warp limit: 100%; R=32, shared-memory constraint: 37.5%")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
R=32: 64 warps, 100%
R=33: 48 warps, 75%
R=41: 40 warps, 62.5%
R=65: 24 warps, 37.5%
R=129: 8 warps, 12.5%
R=33, 48-warp limit: 100%; R=32, shared-memory constraint: 37.5%
```
<!-- leetllm: output:end -->

<figure>
<img src="illustrations/_generated/rounded_register_residency_dark.png"
     alt="Bar chart and register-budget comparison for 256-thread (8-warp) blocks on a 65,536-register SM with 256-register warp allocation granules. At R32, 8 blocks occupy all 64 warps (65,536 registers, 100% occupancy). At R33, rounding 1,056 registers per warp to 1,280 drops capacity to 6 blocks and 48 warps (61,440 used, 4,096 unused). R41, R65, and R129 drop to 40, 24, and 8 warps. Separate panels show 48/48 full occupancy under a 48-warp cap at R33 and a 24-warp ceiling when shared memory limits residency to 3 blocks." />
<figcaption>With eight warps per block, rounding 33 registers per thread to 1,280 registers per warp raises block use to 10,240. The same 65,536-register pool then fits only six blocks and 48 warps, while a 48-warp target reaches 100% and a 96 KiB shared-memory budget with 32 KiB per block caps R32 at three blocks (24 warps).</figcaption>
</figure>

> **Key insight:** One extra register per thread (32 to 33) can trigger a 25% occupancy cliff because hardware allocates registers per warp in 256-register granules. Always read `ptxas -v` and occupancy reports together rather than eyeballing source variables.

The last case assumes a 96 KiB shared-memory budget, showing why low register use alone doesn't ensure full residency. For actual hardware, use the CUDA occupancy APIs with the compiled kernel, launch size, and dynamic shared-memory size, then compare theoretical residency with achieved occupancy and stall data. Higher occupancy can help hide latency; it can also lose to a lower-occupancy kernel with better reuse or fewer instructions.[^cudaProgrammingGuide2026]

### Spills change the memory workload

Thread-private `.local` memory is backed by device memory and can be served through caches. A local access isn't automatically an HBM round trip, and local allocations can have causes other than spilling. Spill cost depends on access frequency, cache behavior, and dependencies; there is no universal 10–50× penalty.

CUDA 13.0 introduced **opt-in shared-memory register spilling** in whole-program compilation mode. It prioritizes shared memory and falls back to local memory when necessary. The documented feature doesn't support dynamic shared memory or warp register reallocation. More shared memory can reduce block residency, so evaluate the resulting resource report and timing together. Explicit launch bounds are recommended for predictable allocation, not a universal prerequisite.[^shanmughan2025sharedSpilling]

### Parsing `ptxas -v` reports

Pass `-Xptxas -v` (or `--ptxas-options=-v`) to `nvcc` to inspect register counts and spills directly at compile time:

```bash title="terminal"
nvcc -O3 -Xptxas -v --gpu-architecture=sm_90 vector_add.cu -o build/vector_add
```

Save the actual compiler log. Depending on the build, it reports allocated registers, stack frame size, spill-load/store byte counts, shared memory, and constant-memory usage. Use those reported values for the target build. A compiler spill-byte count describes generated spill operations; runtime traffic and bytes depend on loop and branch execution.

Use this blank comparison to design a controlled experiment:

| Build | Registers/thread | Stack and spill report | Shared bytes/block | Predicted residency | Warm time and profiler evidence |
|---|---|---|---|---|---|
| Baseline | Collect | Collect | Collect | Calculate for target | Measure |
| Register-cap variant | Collect | Collect | Collect | Recalculate | Measure |

`--maxrregcount=N` requests a register ceiling; values below the ABI minimum are raised to that minimum. The compiler may spill or change instructions to meet the limit. `__launch_bounds__(maxThreadsPerBlock, minBlocksPerMultiprocessor)` provides constraints used to derive a register limit and guide optimization. Launching more than the specified maximum threads per block fails; actual block residency still depends on other resource limits. Function-specific register qualifiers and toolkit rules can alter how options interact. Read the compiler report and effective launch settings.[^nvccGuide2026][^cudaCppIntrinsics2026]

### Keep an artifact manifest

A benchmark result becomes easier to reproduce when its compiler state travels beside it. This template records the fields for a reproducible build. Replace every placeholder with the captured build values:

```json title="kernel-artifact-manifest.json"
{
  "source_revision": "git-sha",
  "compiler": "nvcc",
  "toolkit_version": "capture nvcc --version",
  "driver_version": "capture nvidia-smi",
  "virtual_target": "compute_90",
  "native_targets": ["sm_90"],
  "compile_flags": ["-O3", "-lineinfo"],
  "embedded_images": ["compute_90 PTX", "sm_90 cubin"],
  "kernel": "add_kernel",
  "correctness": "record actual PASS/FAIL for n=1,255,256,257,1000"
}
```

Hash the source, compile options, target, compiler version, and any compile-time constants into a JIT cache key. Shape-specialized kernel systems also need shape, <span data-glossary="stride">stride</span>, data type, alignment, and algorithmic mode when those values change generated code. Caching only by function name can silently load a valid cubin generated for incompatible layout or type assumptions.


For example, two variants can have 1,000 elements but strides 1 and 2. A specialization that assumes stride 1 must not be reused for stride 2. Architecture suffixes encode hardware feature rules too: Hopper's WGMMA requires `sm_90a`, whereas baseline bulk asynchronous copies are available with `sm_90`. Inspect generated code to verify that a kernel uses an enabled feature. Unsupported cubins fail compatibility checks; describe the loader error precisely.[^nvidiaPtxIsa2026]

The exercise below builds a canonical cache key from an explicit compilation recipe, including launch geometry and pipeline stages:

<!-- leetllm: test, output=show, id=gpu-compilation-identity -->
```python title="compilation_identity.py"
from dataclasses import asdict, dataclass, replace
import hashlib
import json


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
    num_warps: int = 4
    num_stages: int = 2

    def key(self):
        encoded = json.dumps(asdict(self), sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(encoded.encode()).hexdigest()


base = Recipe(
    source_sha256=hashlib.sha256(b"vector-add-example-v1").hexdigest(),
    toolchain="nvcc-12.8-build-A", target="sm_90",
    flags=("-O3",), shape=(1000,), strides=(1,), dtype="float32", block=256,
)
assert base.key() == replace(base).key()
variants = [
    replace(base, source_sha256=hashlib.sha256(b"v2").hexdigest()),
    replace(base, toolchain="nvcc-12.8-build-B"),
    replace(base, target="sm_100"), replace(base, flags=("-O3", "--use_fast_math")),
    replace(base, shape=(257,)), replace(base, strides=(2,)),
    replace(base, dtype="float16"), replace(base, block=128),
    replace(base, num_warps=8), replace(base, num_stages=3),
]
assert len({base.key(), *(variant.key() for variant in variants)}) == 11
cache = {base.key(): "cached-cubin-handle"}
assert cache.get(replace(base).key()) == "cached-cubin-handle"
assert all(cache.get(variant.key()) is None for variant in variants)
print("same recipe: hit; 10 code-generation changes: miss")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
same recipe: hit; 10 code-generation changes: miss
```
<!-- leetllm: output:end -->

A real cryptographic cache key must cover transitive includes, linked device libraries, compiler components, backend options, and assumed pointer alignment. Alignment can enable wider loads; generated code shows whether the compiler emits them. Preserve flag order because repeated flags can override earlier ones. Runtime tensor values enter the key only when compilation specializes on them. Because `frozen=True` prevents field reassignment without freezing nested containers, keep key fields immutable strings, tuples, and integers, store the artifact hash and compatibility metadata separately, and validate any untrusted binary before loading it.

Suppose `vector_add.cu` includes `scale.cuh`, which defines a multiplier. The CUDA file hasn't changed, but the multiplier changes from 1 to 2. Trace what a source-file-only key retrieves for inputs 4 and 5:

<!-- leetllm: test, output=show, continue=gpu-compilation-identity, id=gpu-compilation-dependencies -->
```python title="included_source_is_still_source.py"
headers_v1 = {"scale.cuh": b"#define SCALE 1\n"}
headers_v2 = {"scale.cuh": b"#define SCALE 2\n"}
source_only_cache = {base.key(): lambda x, y: (x + y) * 1}
stale_result = source_only_cache[base.key()](4, 5)
assert stale_result == 9 and stale_result != (4 + 5) * 2


def dependency_key(recipe, headers):
    dependencies = [(path, hashlib.sha256(data).hexdigest())
                    for path, data in sorted(headers.items())]
    encoded = json.dumps([recipe.key(), dependencies], separators=(",", ":"))
    return hashlib.sha256(encoded.encode()).hexdigest()


old_key = dependency_key(base, headers_v1)
new_key = dependency_key(base, headers_v2)
assert old_key != new_key
dependency_cache = {old_key: "old-artifact"}
assert dependency_cache.get(new_key) is None
print(f"source-only hit: result={stale_result}, required=18")
print("changed included header: dependency-aware key misses")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
source-only hit: result=9, required=18
changed included header: dependency-aware key misses
```
<!-- leetllm: output:end -->

A real build must discover nested includes and resolve their paths consistently; NVRTC explicitly leaves header-change detection for precompiled headers to the caller.[^nvrtc2026]

<figure>
<img src="illustrations/_generated/specialization_identity_dark.png"
     alt="The CUDA source stays unchanged while scale.cuh changes SCALE from 1 to 2. For inputs 4 and 5 the required result changes from 9 to 18. A source-only key reuses stale result 9, while a key that includes transitive header bytes changes and misses. The full recipe identity also binds compiler, ordered flags, target, shape, stride, dtype, block, warps, and stages; changing stride 1 to 2 creates a miss." />
<figcaption>Changed header bytes alter the dependency-aware key, so inputs 4 and 5 rebuild from the stale result 9 to the required 18. The lower comparison isolates a stride change within an otherwise identical recipe.</figcaption>
</figure>

```checkpoint
Use the same 32-thread/warp, 8-warp/block, 256-register allocation unit and 65,536-register model. A kernel needs 49 registers/thread and 32 KiB shared memory/block; the SM has 96 KiB shared memory and a 64-warp limit. Ignore other limits. Which resource binds?
---
Shared memory: 3 blocks and 24 warps, or 37.5% of the declared warp capacity.

49*32=1,568 rounds to 1,792 registers/warp, or 14,336/block, permitting 4 blocks. Shared memory permits only 96/32=3 blocks; their 24 warps are 37.5% of 64. This is theoretical capacity, not achieved occupancy or speed.
```

```checkpoint
A kernel has maxThreadsPerBlock=128 in its launch bounds. The input length is 257, but a caller launches 256 threads/block and sees a launch failure. Which proposed repair respects the stated bound and covers the input?
---
Launch 128 threads/block with 3 blocks, retaining the valid-index mask.

A register cap or cache change cannot relax maxThreadsPerBlock. ceil(257/128)=3; two 128-thread blocks omit the final value. The tail still needs its mask.
```

```checkpoint
A cached specialization assumes source element i for logical output i. A new view instead requires source element 2i and has the same 513-element logical shape; no strided fallback exists. At logical i=3, which address comparison and decision follow?
---
Cached element 3 versus required element 6; reject or compile the stride-2 specialization.

The cached mapping reads source index 3, but the new view requires index 2*3=6. Equal logical shape does not preserve stride mapping. Reject this unsupported layout or compile a valid specialization whose identity includes the changed code-generation assumption.
```

## JIT is part of request latency

Just-in-time (JIT) compilation moves work from build time to runtime. NVIDIA's runtime compiler, NVRTC, accepts CUDA C++ strings and can emit PTX, cubin, or link-time optimization IR depending on target and options. In CUDA 13.4, its Tile path emits CUDA Tile IR, rather than directly generating a Tile cubin. The CUDA Driver API loads compatible outputs, and `nvJitLink` can combine device-code inputs into a linked cubin.[^nvrtc2026][^nvidia2026nvJitLink]

PTX loaded at runtime is compiled by the device driver's JIT compiler. Generated cubins enter a compute cache, and a driver upgrade invalidates that cache so the new JIT compiler can regenerate code.[^cudaProgrammingGuide2026]

This makes JIT a service concern as well as a compiler step. Track five core JIT requirements:

| Requirement | Evidence to capture | Failure when omitted |
|---|---|---|
| Compilation identity | Source or IR hash, compiler version, flags, target, specialization values | Wrong artifact reused or release can't be reproduced |
| Load compatibility | GPU compute capability, driver version, PTX target, cubin targets | Missing image or unsupported PTX at module load |
| Cold-start budget | Compile time, module-load time, cache state, first launch time | First request violates latency objective while steady state looks healthy |
| Correctness | Reference outputs, tolerances, edge shapes, alignment and mask cases | Fast specialization returns wrong values on an edge case |
| Performance | Warmups, synchronization, target GPU, input shapes, precision, profiler evidence | JIT or lazy-load time is mistaken for kernel execution time |

### Eight ranks, two different cache questions

Suppose eight workers encounter the same missing specialization. They may all compile it, wasting startup time without necessarily corrupting the cache. Ask separately: **Can readers see incomplete files? Can workers avoid duplicate compilation?**

In Triton's file-cache implementation, each writer stages into a unique PID/UUID temporary directory inside the cache, closes the completed file, and publishes it with `os.replace` (without `fsync` or an advisory lock). Group metadata checks child-file existence, so validate each artifact before treating the group as complete.[^triton2026fileCache]

On a filesystem providing the required same-filesystem atomic replacement semantics, publishing a completed file prevents readers from opening a partially written destination. This provides **atomic visibility**. Durability after power loss requires additional file/directory synchronization and explicit filesystem durability guarantees. Concurrent compilers can still consume redundant CPU and memory. Host launcher shared objects, device cubins, and metadata are distinct artifacts; avoid treating every Triton cache entry as a kernel `.so`.

For a cache you implement, a cooperating-writer lock can reduce duplicate work: acquire it, **recheck the exact key**, compile only if still missing, publish, then release. Check the lock and rename semantics on the actual local or shared filesystem. Locks don't compensate for an incomplete specialization key or a writer that ignores the protocol.

<figure>
<img src="illustrations/_generated/concurrent_cache_publication_dark.png"
     alt="Two compilers for key K write and close separate complete temporary files; either can atomically replace the single destination. A reader opening K before the shared replace sees the old complete file; opening after sees the new complete file. An optional lock, exact-key recheck, compile-on-miss, then publish sequence reduces duplicate work for cooperating writers. Distinct keys use separate entries. Crash durability and multi-file transactions require separate guarantees." />
<figcaption>Each writer closes a complete temporary file and targets the same key K; the timeline shows reader opens around one atomic replace event. An open before that event sees the old complete file, while an open after sees the new one. A lock with an exact-key recheck can reduce duplicate compilation for cooperating writers. Crash durability and multi-file transactions need separate guarantees.</figcaption>
</figure>

A rank-0 warmup followed by a barrier is another possible initialization design. It requires accessible shared storage, identical code-generation recipes, and failure/timeout handling. Different targets or worker-local directories still miss after the barrier. Trace shared and private cache lookups after rank-0 warmup:

<!-- leetllm: test, output=show, continue=gpu-compilation-dependencies -->
```python title="rank_zero_warmup.py"
rank_recipes = [base, replace(base, target="sm_100")]
shared_cache = {rank_recipes[0].key(): "rank-0-artifact"}
hits = [recipe.key() in shared_cache for recipe in rank_recipes]
assert hits == [True, False]
assert base.key() not in {}  # A separate worker-local cache is still empty.
print("after rank-0 warmup: shared-cache hits [True, False]; local cache misses")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
after rank-0 warmup: shared-cache hits [True, False]; local cache misses
```
<!-- leetllm: output:end -->

<figure>
<img src="illustrations/_generated/rank_warmup_identity_dark.png"
     alt="Rank 0 compiles an sm_90 recipe and warms a shared cache entry with key K(sm_90). After synchronization, rank 1 requests sm_100, producing K(sm_100) and missing the shared sm_90 entry. A worker with the identical sm_90 recipe also misses when its physical cache is private and empty. Target identity and storage visibility both determine warmup reuse." />
<figcaption>Rank 0 warms the shared `sm_90` key. After the barrier, rank 1 requests `sm_100`, missing the `sm_90` entry; an identical `sm_90` recipe also misses in an empty private cache.</figcaption>
</figure>

An invalid ELF header calls for an investigation, not an automatic diagnosis. Preserve the bad artifact's hash, actual path and type, compiler/writer versions, recipe, logs, and filesystem details. Test whether the responsible writer exposes incomplete bytes, selects the wrong artifact, or leaves invalid metadata after a failure.

Use the driver's switches to test both deployment branches. The first command forces embedded PTX through JIT and disables its disk cache for the run. The second disables PTX JIT, so success requires a compatible embedded cubin.[^cudaEnvironment2026]

```bash title="terminal"
CUDA_FORCE_PTX_JIT=1 CUDA_CACHE_DISABLE=1 ./build/vector_add
CUDA_DISABLE_PTX_JIT=1 ./build/vector_add
```

Run each mode in a fresh process. These shell assignments affect only that invocation; unset any conflicting JIT variables you previously exported. These packaging tests verify cubin/PTX branches; measure kernel performance separately.

CUDA module loading is lazy by default in current documentation. First use can therefore include module or kernel loading even when a compatible cubin exists. Warm the exact kernel or use eager loading when a latency-sensitive service needs that work outside the request path.[^cudaEnvironment2026]

<figure>
<img src="illustrations/_generated/cold_warm_request_boundary_dark.png"
     alt="Two fresh-process request paths separate initialization, module loading, optional PTX driver JIT, cache write, first launch, and warm execution. A compatible cubin skips PTX code generation but may still load lazily. The timeline spacing shows event order rather than wall-clock duration, and synchronized warm launches occupy a separate measurement window." />
<figcaption>The PTX path adds driver JIT and cache write before its first launch. A compatible cubin skips PTX JIT, while module loading can remain lazy. The lower panel marks the synchronized warm measurement window, with spacing showing event order rather than duration.</figcaption>
</figure>

```checkpoint
A service packages `sm_90` cubin plus `compute_90` PTX. Its first request on a future compatible GPU is slow, but later requests are fast. What should you separate in the trace?
---
Separate process initialization, module loading, PTX-to-cubin JIT, cache write, first kernel launch, and steady-state execution. A fast warm kernel doesn't disprove expensive compilation or loading on the first request.
```

Packaging explains a slow first call. It doesn't explain a kernel whose source describes the wrong unit of work. CUDA C++ and a tile language don't even start from the same unit.

```checkpoint
Rank 0 warms recipe A in a shared cache. Rank 1 requests A in an empty private cache; rank 2 requests changed-target recipe B in the shared cache; rank 3 requests A in the shared cache. Assume no other entries. What are their lookups?
---
Rank 1 miss; rank 2 miss; rank 3 hit.

Warmup helps only when both the recipe identity and the accessible storage match. Private storage misses A, the shared cache lacks B, and the matching shared A entry hits. This does not itself test a distributed barrier or a filesystem race.
```

## Same kernel, different unit of thought

CUDA C++ asks you to describe one thread, then organize threads into blocks. <span data-glossary="triton-language">Triton</span> asks you to describe one blocked **program instance** operating on vectors of offsets. Both versions below compute the same masked vector add.

The Triton kernel forms a block of 256 indices, loads two blocks under a mask, adds them, and stores the result. The compiler maps that blocked program to GPU threads and memory operations. The kernel follows Triton's vector-add tutorial; the wrapper below adds explicit input checks.[^tritonProgrammingGuide2026][^tritonVectorAdd2026]

```python title="vector_add_triton.py"
import torch
import triton
import triton.language as tl


@triton.jit
def add_kernel(x_ptr, y_ptr, out_ptr, n, BLOCK: tl.constexpr):
    offsets = tl.program_id(axis=0).to(tl.int64) * BLOCK + tl.arange(0, BLOCK)
    mask = offsets < n
    x = tl.load(x_ptr + offsets, mask=mask, other=0.0)
    y = tl.load(y_ptr + offsets, mask=mask, other=0.0)
    tl.store(out_ptr + offsets, x + y, mask=mask)


def add(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    if not (x.is_cuda and y.is_cuda and x.device == y.device):
        raise ValueError("inputs must share a CUDA device")
    if x.ndim != 1 or y.ndim != 1 or x.shape != y.shape:
        raise ValueError("inputs must be matching one-dimensional vectors")
    if x.dtype != torch.float32 or y.dtype != torch.float32:
        raise ValueError("only float32 tensors are supported")
    if x.requires_grad or y.requires_grad:
        raise ValueError("this wrapper has no autograd rule")
    if not (x.is_contiguous() and y.is_contiguous()):
        raise ValueError("strided views require a different address calculation")
    out = torch.empty_like(x)
    n = x.numel()
    if n:
        with torch.cuda.device(x.device):
            add_kernel[(triton.cdiv(n, 256),)](x, y, out, n, BLOCK=256)
    return out


if __name__ == "__main__":
    for n in (0, 1, 255, 256, 257, 1000):
        i = torch.arange(n, device="cuda", dtype=torch.float32)
        x, y = 0.25 * i, i.remainder(7) - 3
        actual = add(x, y)
        torch.cuda.synchronize(x.device)
        torch.testing.assert_close(actual, x + y, rtol=0, atol=0, equal_nan=False)
        print(f"PASS n={n}")
    try:
        add(x[::2], y[::2])
    except ValueError:
        print("PASS rejected strided views")
    else:
        raise AssertionError("strided views were accepted")
```

Run this on a supported Linux/PyTorch/Triton CUDA environment. It should print six shape passes and one strided-view rejection. The CPU checks below separately verify index arithmetic; they do not exercise Triton compilation or GPU memory safety. Inputs requiring autograd aren't supported by this wrapper: a custom backward rule would be separate work.

The arithmetic stayed fixed. Ownership changed:

| Question | CUDA C++ answer | Triton answer |
|---|---|---|
| What does one source instance own? | One scalar thread | One block of values |
| How is the global index formed? | `blockIdx`, `blockDim`, `threadIdx` | `program_id` plus `arange` |
| How are edge elements protected? | Scalar branch or predicate | <span data-glossary="vector">Vector</span> mask on load and store |
| Who chooses thread mapping? | Programmer chooses block size and per-thread work | Compiler maps blocked program; author sets block and launch meta-parameters |
| What evidence closes the loop? | Cubin resource report, SASS, profiler, correctness test | Compiler artifacts, generated target code, profiler, correctness test |

Triton removes some thread-level bookkeeping. It doesn't remove the need to reason about coalescing, block size, occupancy, specialization, or numerical behavior. A blocked expression is an optimization hypothesis until generated artifacts and measurements support it.

### How Triton compiles: the MLIR lowering pipeline

Triton isn't an interpreter or a simple string-template emitter. It's an optimizing compiler built on the Multi-Level Intermediate Representation (MLIR) framework. It lowers abstract block mathematics into native GPU machine code through a sequence of explicit intermediate dialects:

For the NVIDIA backend at the cited source revision, the stages are `ttir`, `ttgir`, `llir`, `ptx`, and `cubin`.[^triton2026nvidiaCompiler]

1. **Triton IR:** The frontend translates the Python kernel into MLIR block operations such as loads, stores, and dot products, alongside other dialects' operations. Scalar addition isn't a `tt.add` operation simply because it appears in a Triton kernel. This stage precedes explicit distributed-layout assignment; it doesn't imply the whole compilation is unaware of target options.
2. **TritonGPU IR:** Layout encodings describe element ownership across lanes and warps. Optimization passes can improve coalescing, dot-product layouts, and eligible loops' pipelining. Their choices depend on architecture, operations, and meta-parameters.
3. **LLVM IR:** Target lowering introduces GPU-specific operations and allocates shared-memory resources where needed. The inspected backend records shared-memory use during this stage. A plain vector add doesn't require a shared-memory matrix pipeline.
4. **PTX:** The LLVM NVPTX backend emits virtual assembly for NVIDIA targets.
5. **Cubin:** Triton's backend **invokes the `ptxas` executable itself**, then reads its generated binary. This isn't the CUDA driver's PTX JIT invoking the toolkit command.

<figure>
<img src="illustrations/_generated/ir_layout_and_liveness_dark.png"
     alt="Triton lowers from TTIR to TTGIR layout, LLVM IR, PTX, and cubin. A 4x4 lane-ownership grid maps rows 0..3, 4..7, 8..11, and 12..15 to lanes L0 through L3 at TTGIR layout, while shared memory stays zero for plain vector add. Separate liveness bars show nonoverlapping values A and B sharing physical register r0, whereas overlapping A and B stay live simultaneously in r0 and r1." />
<figcaption>Triton assigns distributed lane ownership at the TritonGPU IR layout stage, while LLVM lowering allocates shared memory only when required (zero for plain vector add). Lifetime bars compare nonoverlapping values sharing physical register r0 against overlapping values occupying r0 and r1 simultaneously.</figcaption>
</figure>

Where do the enticing optimization claims need qualification? A shared-memory swizzle can avoid conflicts for particular access patterns, not every access. A supported loop can overlap asynchronous copies with computation, not necessarily with three or four stages. Contiguous offsets don't prove the base pointer is suitably aligned: a contiguous tensor view can start at an offset. Wider per-thread load instructions also aren't the same thing as one warp transaction or HBM bus saturation. Inspect generated code and profile the actual specialization before claiming any of these outcomes.

### Check ownership without a GPU

For length 257, two 256-lane blocks cover indices `0..256` and leave 255 lanes masked out. Enumerating block and lane indices directly exposes off-by-one boundary bugs:

<!-- leetllm: test, output=show, id=gpu-index-coverage -->
```python title="check_index_coverage.py"
def covered_indices(n, block=256, *, include_equal=False):
    if n < 0 or block <= 0:
        raise ValueError("length must be nonnegative and block positive")
    blocks = (n + block - 1) // block
    active = []
    for program in range(blocks):
        for lane in range(block):
            i = program * block + lane
            if i < n or (include_equal and i == n):
                active.append(i)
    return blocks, active


for n in (0, 1, 255, 256, 257, 1000):
    blocks, indices = covered_indices(n)
    assert indices == list(range(n))  # No duplicates, omissions, or excess.
    print(f"n={n}: blocks={blocks}, active={len(indices)}, masked={blocks * 256 - n}")

# Deliberately change < to <=. It only looks correct on full blocks.
assert covered_indices(256, include_equal=True)[1] == list(range(256))
bad = covered_indices(257, include_equal=True)[1]
assert bad[-1] == 257 and bad != list(range(257))
print("off-by-one mask: full block passes; n=257 exposes index 257")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
n=0: blocks=0, active=0, masked=0
n=1: blocks=1, active=1, masked=255
n=255: blocks=1, active=255, masked=1
n=256: blocks=1, active=256, masked=0
n=257: blocks=2, active=257, masked=255
n=1000: blocks=4, active=1000, masked=24
off-by-one mask: full block passes; n=257 exposes index 257
```
<!-- leetllm: output:end -->

Now change the block size to 128 and repeat. Length 257 needs three blocks, with 127 masked lanes. A passing multiple-of-block test alone misses the off-by-one error; that's why both GPU test suites include 255 and 257.

Python's integers hid another risk in the first version of the CUDA helper: `(n + 255) / 256` overflows signed `int` near its maximum. The corrected helper uses quotient plus remainder and forms device indices in `std::size_t`. Verify the overflow threshold using integer arithmetic alone:

<!-- leetllm: test, output=show, continue=gpu-index-coverage -->
```python title="large_launch_boundary.py"
n, block = (1 << 31) - 1, 256
assert n + block - 1 > (1 << 31) - 1
blocks = n // block + (n % block != 0)
padded = blocks * block
assert (blocks, padded, padded - n) == (8388608, 2147483648, 1)
last_index = padded - 1
assert last_index == n  # This last lane must skip memory access.
print("int32 maximum: 8388608 blocks, 2147483648 lanes, 1 masked lane")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
int32 maximum: 8388608 blocks, 2147483648 lanes, 1 masked lane
```
<!-- leetllm: output:end -->

<figure>
<img src="illustrations/_generated/scalar_thread_blocked_ownership_dark.png"
     alt="CUDA scalar threads (B0..B3) and Triton blocked programs (pid 0..3) partition n=1000 into four 256-element blocks. The fourth block spans offsets 768 to 1023 with 232 valid lanes and 24 masked lanes; sample sums include 0+(-3)=-3 and 0.25+(-2)=-1.75. For n=257, block 0 holds 256 valid lanes and block 1 holds 1 valid lane (i=256) plus 255 masked lanes, exposing an i<=n bug that n=256 hides. For INT_MAX (2,147,483,647), quotient plus remainder produces 8,388,608 blocks, 2,147,483,648 padded lanes, and 1 masked lane." />
<figcaption>Both programming models cover the same 1,000 offsets, with the final 24 lanes masked. At length 257, one lane is valid and 255 are masked, exposing the `i <= n` error that a full 256-element block hides. Quotient-plus-remainder arithmetic for `INT_MAX` gives 8,388,608 blocks and one masked lane without integer overflow.</figcaption>
</figure>

The Triton example also widens the program ID before multiplication, so large offsets don't first wrap in a 32-bit intermediate. The same overflow arithmetic decides where a real launch breaks: with 32-bit offsets, the address of the first element past $2^{31}-1$ wraps negative, and the kernel reads or writes memory outside the tensor. Inspecting the PTX for `mul.wide.s32` or 64-bit `mad` instructions confirms that the compiler emitted the widened form.

```checkpoint
Let n=2,147,483,646 and block=512. Compute blocks as integer quotient plus a nonzero-remainder test in a sufficiently wide integer type. What arithmetic result follows, without allocating a device buffer?
---
4,194,304 blocks; 2,147,483,648 padded positions; 2 masked.

The quotient is 4,194,303 with remainder 510, so add one block. The padded count exceeds n by 2. Wide arithmetic is necessary; this proves no buffer allocation, supported grid limit or actual generated-address correctness.
```

## Six authoring surfaces and who owns what

A kernel language isn't a ranking from easy to powerful. Each surface chooses which decisions belong to author, compiler, library, and runtime.

### CUDA C++

CUDA C++ uses single instruction, multiple threads (SIMT) semantics. You control thread and block geometry, address calculations, synchronization, memory spaces, and low-level intrinsics. That directness fits irregular algorithms, architecture experiments, and cases where a higher layer hides a critical decision. Its portability surface is NVIDIA GPUs, with source, PTX, and fatbins handling generations inside that ecosystem.[^cudaProgrammingGuide2026]

Evidence should reach the cubin. Keep `ptxas` resource output, disassemble native code, profile target hardware, and compare results against a trusted implementation.

### Triton block programs

Triton is a Python-embedded domain-specific language (DSL) whose program instances operate on blocks. Its compiler performs block-level data-flow analysis and can automate coalescing, vectorization, shared-memory management, synchronization, and instruction selection.[^tritonProgrammingGuide2026] Current project documentation lists NVIDIA and AMD GPU support, but backend support and generated code still vary by hardware and Triton release.[^tritonRepository2026]

Triton fits custom fusion and dense or structured kernels where block ownership is natural. Inspect specialized IR and target assembly when available, because one Python function can compile into many shape, type, and meta-parameter variants.

### CUTLASS and CuTe

<span data-glossary="cutlass">CUTLASS</span> supplies CUDA C++ templates for high-performance linear algebra. CuTe, used inside modern CUTLASS, models hierarchical tensor layouts, tensors, copy atoms, and <span data-glossary="matrix">matrix</span> multiply-accumulate atoms. Its C++ surface keeps detailed control over thread-data mapping and architecture features. CuTe DSL brings the same low-level concepts into a Python JIT stack while preserving explicit memory, thread, and data hierarchy.[^cutlassDocs2026]

Consider this family when matrix multiplication, convolution, attention building blocks, or unusual layouts need explicit layout and hardware-atom control. Expect a steeper layout-algebra learning curve and a larger specialization space; use the CUTLASS profiler, inspect PTX and SASS, and record compile-time schedules in your benchmark manifest.

### CUDA Tile

CUDA Tile changes CUDA's unit of thought from one SIMT thread to one block operating collectively on immutable multidimensional tiles (with compile-time power-of-two tile dimensions across its `cuda.tile` Python and C++ interfaces). The compiler chooses threads per block and maps tile operations onto registers, shared memory, and <span data-glossary="tensor">tensor</span> cores; SIMT and tile kernels can coexist in one application.[^cudaTile2026]

CUDA Tile offers source portability across supported NVIDIA generations by hiding thread mapping, not cross-vendor portability. Pin your CUDA toolkit and language package, inspect Tile IR or emitted device images, and profile on each target architecture.

### Pallas

Pallas extends JAX with custom kernels for GPU and tensor processing unit (TPU) backends, built around memory references (`Ref`s), launch grids, block specifications (`BlockSpec`s), and backend-specific pipelining APIs.[^jaxPallas2026]

Pallas is useful when JAX composition or GPU/TPU integration matters. Because its Mosaic GPU surface is still evolving rapidly (moving toward `jax.experimental.pallas.mosaic_gpu.kernel` and `jax.lax.axis_index` / `axis_size`), pin JAX and backend versions rather than copying older tutorials verbatim, and profile each target.[^jaxPallasChangelog2026]

### NKI

Neuron Kernel Interface (NKI) targets AWS Trainium, Inferentia2, Trainium2, and Trainium3 NeuronCores. Its high-level `nki.language` API handles tensor indexing and placement, while lower-level `nki.isa` exposes hardware operations for computation, data movement, dynamic control flow, and cross-core communication. The documented execution pattern moves inputs from high-bandwidth memory (HBM) into the on-chip state buffer (SBUF), computes on NeuronCore engines, then stores outputs to <span data-glossary="hbm">HBM</span>.[^awsNki2026]

NKI fits workloads committed to AWS Neuron hardware that need custom operations or tighter control than framework compilation supplies. It isn't a CUDA portability layer. Keep Neuron compiler and instance type in the artifact record, use framework-level correctness comparisons, and collect Neuron profiler evidence.

For each surface, note what you control and what evidence would support a choice:

| Surface | Author's main unit | Explicit control | Target scope | Minimum convincing evidence |
|---|---|---|---|---|
| CUDA C++ | Thread, warp, block | Explicit thread-level control | NVIDIA CUDA GPUs | PTX, cubin resources, SASS, target profile |
| Triton | Blocked program | Tile shape, loads, masks, launch meta-parameters | Supported Triton GPU backends | Specialization key, compiler IR or assembly, target profile |
| CUTLASS/CuTe | Hierarchical layout and hardware atom | Explicit layout, copy, pipeline, and MMA control | NVIDIA CUDA GPUs | Schedule manifest, profiler, PTX/SASS, numeric check |
| CUDA Tile | Block-level immutable tiles | Tile partition and operations; compiler owns threads | CUDA Tile-capable NVIDIA stack | Tile/compiler artifact, version pin, per-target profile |
| Pallas | Grid program over `Ref`s and blocks | Memory movement, block specs, backend pipeline APIs | JAX GPU and TPU backends, with backend-specific constraints | JAX/backend pin, lowering evidence, per-target profile |
| NKI | Tile over Neuron memory and engines | SBUF placement plus optional low-level ISA control | AWS Inferentia2 and Trainium families | Neuron compiler record, profiler, framework comparison |

```checkpoint
A Triton kernel and a CuTe rewrite pass the same correctness test suite. Triton is faster on H100, while CuTe is faster on B200. What must the review record contain before either implementation becomes the default?
---
Keep both source revisions, compiler and backend versions, specialization keys, compile flags, native targets, correctness tolerances, cold and warm timings, emitted-code evidence, and per-target profiler results. Choose against the deployment GPU mix and latency objective. One architecture's timing or a PTX instruction count cannot prove a portable winner.
```

## Diagnose the first failing stage

Compiler failures become manageable when you ask which stage last produced valid output.

| Symptom | Likely stage | Evidence to collect | Next action |
|---|---|---|---|
| Source compile rejects type, address space, or intrinsic | Source to frontend IR | Full compiler log, minimal source, language and compiler versions | Reduce to smallest rejected construct; check supported language subset |
| `ptxas` rejects target or instruction | PTX to cubin | PTX header, `ptxas` log, toolkit version, requested `sm` | Align PTX feature set, toolkit, and target architecture |
| "No kernel image" at load or launch | Fatbin selection | GPU compute capability, `cuobjdump --list-elf`, `--list-ptx` | Package compatible cubin or usable PTX fallback |
| Forced PTX JIT fails, normal mode works | Driver JIT path | Embedded PTX, driver version, JIT error log | Fix PTX compatibility or driver floor; don't treat cubin success as forward-compatibility proof |
| First call is slow, warm calls are fast | Compile or lazy-load path | Fresh-process timeline, cache state, module-loading mode | Precompile, warm exact variants, or move eager loading outside request path |
| Register count rises and throughput falls | IR or target-code optimization | Old and new resource reports, SASS, occupancy and stall profile | Find specialization or code change that extended live ranges or caused spills |
| Edge shape returns wrong values | Source mask or specialization key | Failing shape, strides, alignment, generated variant, reference output | Fix edge mask and include shape or stride in specialization key |
| `nvdisasm` rejects host executable | Inspection tool input | File type and packaged image list | Use `cuobjdump` on host file or extract cubin before `nvdisasm` |

Don't skip directly from source to profiler. A profiler identifies an executed bottleneck, but it can't explain a missing image that never loaded. Disassembly proves emitted code, but it can't prove correct answers. Correctness tests check outputs on their test cases, but they cannot prove execution speed. Once you can isolate the failing stage, match the authoring model to the decision that stage depends on:

```checkpoint
An older JAX tutorial raises an attribute error for a removed Pallas API before producing any compiler IR. Which investigation targets the first failed stage?
---
Check the pinned JAX/backend API, then migrate the rejected call before inspecting its new lowering.

The API rejection occurs before IR, assembly or launch exists. Pin the language/backend versions and use the supported replacement. Target, cache and profiler changes cannot repair that Python-interface failure.
```

```checkpoint
A finite-input kernel test should write every element. One candidate skips its final write. Which checker reliably exposes that failure without mistaking NaN comparisons for a small numerical error?
---
Initialize output with NaN, require finite complete output, then compare every element with the reference.

The poison marks unwritten output, and an explicit finiteness check prevents a NaN error from slipping through a greater-than comparison. Complete elementwise comparison checks those test values, though unobserved shapes or alignments still need their own tests.
```

## Choose by the decision you must own

Start with a framework or vendor library if it meets the need. For a custom kernel, choose by the decision you need to express:

1. Use a framework or vendor library when an existing operation already meets correctness and performance needs.
2. Use Triton when custom block structure, fusion, or masking is central and compiler-managed thread mapping is acceptable.
3. Use Pallas when the kernel must compose naturally with JAX or span its GPU and TPU ecosystem.
4. Use NKI when NeuronCore memory placement or engines are the target, not an afterthought.
5. Use CUDA Tile when block-level tile semantics fit and NVIDIA's compiler should own intra-block threads.
6. Use CUTLASS/CuTe when tensor layouts, asynchronous copies, and matrix hardware atoms need explicit control.
7. Use CUDA C++ when per-thread behavior, synchronization, special instructions, or unsupported irregularity requires it.

These tools target different layers of the GPU programming stack. A prototype may begin in Triton, expose a compiler limitation, and move one hot kernel to CuTe or CUDA C++. Another kernel may move to a higher-level tool after its compiler learns the missing transformation.

If you have a compatible NVIDIA environment, practice the full artifact path before moving on. Build the vector-add executable with an `sm_90` cubin and `compute_90` PTX, save its manifest and `cuobjdump` image inventory, then run forced-PTX and cubin-only checks in fresh processes. Capture the resource report, SASS, correctness output, and separate cold and warm timings in one review artifact. Run the Triton version on the same five nonempty shapes. Both implementations should match the same reference exactly, and the strided-view test must reject before launch. For a memory-safety check, run the CUDA executable under `compute-sanitizer --tool memcheck ./build/vector_add`. Capture failures as well as passes. On CPU-only machines, complete the indexing and cache-identity exercises without claiming a GPU build or benchmark.

## Mastery check

```mastery-quiz
[
  {
    "question": "Build A's PTX for `a * b + c` contains a multiply and an add that the assembler may fuse. Its target cubin disassembles to `FFMA` for this expression. Build B uses separate instructions. Both return 13 for `2 * 5 + 3`. How many arithmetic instructions does A encode for the expression, and how should you compare the builds?",
    "options": [
      "Record two native arithmetic instructions. Time both kernels on the target and check rounding-sensitive inputs against a reference.",
      "Record one native arithmetic instruction. Time both kernels on the target and check rounding-sensitive inputs against a reference.",
      "Record one native arithmetic instruction. Rank the kernels by arithmetic instruction count and check rounding-sensitive inputs against a reference.",
      "Record two native arithmetic instructions. Time both kernels on the target and use the match at 13 to conclude that they round the same way."
    ],
    "answer": "Record one native arithmetic instruction. Time both kernels on the target and check rounding-sensitive inputs against a reference.",
    "explanation": "The cubin encodes one fused multiply-add. Counting two uses the earlier PTX listing. Instruction counts alone cannot predict elapsed time. Both the product 10 and the sum 13 are exact, so this input hides the difference between rounding once and rounding the product before the add."
  },
  {
    "question": "Two fresh processes try to load the same kernel on a GPU with compute capability 8.6. Native-only mode reports no compatible cubin. Forced PTX JIT succeeds. The driver accepts PTX ISA versions through 8.0. Which package inventory explains both results?",
    "options": [
      "An sm_86 cubin and ordinary compute_80 PTX at ISA 7.6.",
      "An sm_70 cubin and ordinary compute_90 PTX at ISA 7.8.",
      "An sm_75 cubin and ordinary compute_80 PTX at ISA 8.1.",
      "An sm_70 cubin and ordinary compute_75 PTX at ISA 7.8."
    ],
    "answer": "An sm_70 cubin and ordinary compute_75 PTX at ISA 7.8.",
    "explanation": "An sm_70 cubin cannot load across the change from major version 7 to 8. An sm_86 cubin would pass the native-only check. For forced JIT, ordinary compute_75 PTX fits the GPU, and ISA 7.8 fits the driver. The compute_90 image needs a newer GPU. The ISA 8.1 image needs a newer driver."
  },
  {
    "question": "Use the declared model: 32 threads/warp, 8 warps/block, 65,536 registers, 64-warp limit, and per-warp register demand rounded up to a multiple of 256. Ignore other limits. Registers/thread rise from 37 to 40. What theoretical capacity follows?",
    "options": [
      "The allocations are 1,184 and 1,280 registers/warp; capacity falls from 7 to 6 blocks.",
      "Both allocate 1,536 registers/warp and fit 5 blocks, or 40 resident warps.",
      "Both allocate 1,280 registers/warp and fit 6 blocks, or 48 resident warps.",
      "Both allocate 1,280 registers/warp and fit 8 blocks, or 64 resident warps."
    ],
    "answer": "Both allocate 1,280 registers/warp and fit 6 blocks, or 48 resident warps.",
    "explanation": "37*32=1,184 rounds to 1,280; 40*32=1,280 already fits that allocation. Each block takes 10,240 registers, so floor(65,536/10,240)=6 blocks and 48 warps. The increase stays on the same allocation step."
  },
  {
    "question": "An executed loop performs one 8-byte local load and one 4-byte local store per iteration, for 50 iterations/thread. What can be concluded before cache and execution profiling?",
    "options": [
      "600 HBM bytes/thread at those instructions; execution time remains undetermined.",
      "600 requested bytes/thread at those instructions; HBM traffic and time are undetermined.",
      "12 requested bytes/thread at those instructions; the loop does not multiply the traffic.",
      "400 requested bytes/thread at those instructions; stores cannot contribute to traffic."
    ],
    "answer": "600 requested bytes/thread at those instructions; HBM traffic and time are undetermined.",
    "explanation": "Each iteration requests 8+4=12 bytes; 50*12=600. Local memory may be cached, so requested instruction bytes do not determine HBM transactions or elapsed time."
  },
  {
    "question": "A compiler recipe includes SCALE from a header and computes SCALE*(x+y). With x=3 and y=8, the header changes from SCALE=1 to SCALE=3 while the main file stays unchanged. What do a source-only stale hit and a dependency-aware rebuild return?",
    "options": [
      "Stale hit 11; dependency-aware rebuild 33.",
      "Stale hit 33; dependency-aware rebuild 11.",
      "Stale hit 11; dependency-aware rebuild 11.",
      "Stale hit 33; dependency-aware rebuild 33."
    ],
    "answer": "Stale hit 11; dependency-aware rebuild 33.",
    "explanation": "The stale artifact still contains scale 1. A dependency-aware identity changes with the included header and rebuilds the scale-3 computation. Main-source identity alone missed a code-generation dependency."
  },
  {
    "question": "A writer atomically replaces kernel.cubin with artifact B, then crashes before replacing its metadata. The reader sees complete cubin B and complete old metadata for artifact A. What does this trace show?",
    "options": [
      "Complete files may form an inconsistent group; validate the recipe and matching cubin/metadata digests before use.",
      "Complete files may form a consistent group; validate the recipe alone because atomic replacement binds both digests.",
      "Old metadata may prove partial cubin bytes; validate the metadata alone after recompiling the unchanged cubin path.",
      "A returned replace may guarantee group durability; validate file existence before reusing the stored compilation recipe."
    ],
    "answer": "Complete files may form an inconsistent group; validate the recipe and matching cubin/metadata digests before use.",
    "explanation": "Two atomic file publications are not one group transaction. A crash between them can pair complete new bytes with complete old metadata. Verify the intended recipe and all corresponding artifact hashes under an explicit group-publication protocol; file existence or individual atomic visibility does not guarantee group consistency or crash durability."
  },
  {
    "question": "A fresh-process trace has initialization 20 ms, module load 8 ms, PTX JIT 70 ms, cache publication 2 ms and first launch 1 ms, with sequential nonoverlapping intervals. A separately synchronized warmed interval is 0.03 ms. What should be reported?",
    "options": [
      "Cold interval 70 ms; warm interval 0.03 ms, with JIT representing the complete first request.",
      "Cold interval 101.03 ms; warm interval 0.03 ms, with the later launch included in the first request.",
      "Cold interval 101 ms; warm interval 0.03 ms, with separate measurement windows and cache states.",
      "Cold interval 31 ms; warm interval 0.03 ms, with JIT excluded because a driver cache exists."
    ],
    "answer": "Cold interval 101 ms; warm interval 0.03 ms, with separate measurement windows and cache states.",
    "explanation": "The cold phases sum to 20+8+70+2+1=101 ms. The later warmed measurement covers a separate window. Neither should be relabeled as an unmeasured service percentile or as pure execution without inspecting timer scope."
  },
  {
    "question": "A layout assigns four adjacent float32 values to each thread. Each group starts on a 16-byte address. The target cubin reads each group with two 64-bit loads. What width should you report for each load, and how would you measure the warp transaction count and achieved bandwidth?",
    "options": [
      "Report 8 bytes per load. Measure transactions and bandwidth on the target.",
      "Report 16 bytes per load. Measure transactions and bandwidth on the target.",
      "Report 8 bytes per load. Count one transaction per warp load and measure bandwidth on the target.",
      "Report 16 bytes per load. Count one transaction per warp load and measure bandwidth on the target."
    ],
    "answer": "Report 8 bytes per load. Measure transactions and bandwidth on the target.",
    "explanation": "Each encoded load reads 64 bits, or 8 bytes. The four floats span 16 bytes in total. Alignment permits a 16-byte access, but this build uses two narrower loads. A warp load can generate several transactions depending on the addresses its lanes request. Profile those transactions and measure bytes transferred per unit of time on the target."
  },
  {
    "question": "For n=515 and block size 128, enumerate ceil(n/block) complete blocks and guard every access with i<n. How many lane positions exist, and how many in the final block are valid or masked?",
    "options": [
      "640 positions; final block 4 valid and 124 masked.",
      "515 positions; final block 3 valid and 125 masked.",
      "512 positions; final block 128 valid and 0 masked.",
      "640 positions; final block 3 valid and 125 masked."
    ],
    "answer": "640 positions; final block 3 valid and 125 masked.",
    "explanation": "Five blocks create 5*128=640 positions. The last starts at 512, so indices 512, 513 and 514 are valid; 125 are masked. Using <= would incorrectly include index 515."
  },
  {
    "question": "A matrix kernel on an NVIDIA GPU needs the author to assign values to threads and select a multiply-accumulate atom. A NeuronCore kernel needs the author to schedule a tile copy from HBM into SBUF. Which interfaces give the author those controls, in that order?",
    "options": [
      "CuTe and standard framework operators compiled for Neuron.",
      "CUDA Tile and a custom Neuron NKI kernel.",
      "CuTe and a custom Neuron NKI kernel.",
      "CUDA Tile and standard framework operators compiled for Neuron."
    ],
    "answer": "CuTe and a custom Neuron NKI kernel.",
    "explanation": "CuTe lets the author specify the thread layout and the matrix atom. With CUDA Tile, the author describes a tile operation and the compiler maps it to threads. NKI lets the author place the tile in SBUF and request the transfer. Standard framework operators leave that placement and transfer to the Neuron compiler."
  }
]
```

> **Next:** Continue to [GEMM From Naive CUDA to Tensor Cores](/learn/gemm-naive-cuda-tensor-cores). You can now trace source choices into PTX, cubin resources, and native instructions. Next, use that evidence while transforming one matrix multiplication from a correct scalar-thread baseline into tiled, pipelined Tensor Core code.
