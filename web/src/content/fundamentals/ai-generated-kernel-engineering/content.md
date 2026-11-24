---
{
  "id": "ai-generated-kernel-engineering",
  "title": "AI-Generated Kernel Engineering",
  "slug": "ai-generated-kernel-engineering",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 17,
  "companies": [
    "NVIDIA",
    "Meta",
    "OpenAI",
    "Anthropic",
    "Google"
  ],
  "shortDescription": "Synthesizing fast CUDA and Triton kernels with LLMs through tiled reference math, randomized equivalence harnesses, cache-flushed CUDA event timing, and hardware-guided search.",
  "keyConceptsTested": [
    "Reference eager math versus fused and tiled kernel formulations",
    "Shared-memory tiling and arithmetic intensity roofline analysis",
    "Randomized shape, stride, and dtype equivalence harnesses",
    "FP16, BF16, and FP32 accumulation precision and epsilon scaling",
    "Aliasing, input preservation, and non-finite propagation checks",
    "Compute Sanitizer memory, race, initialization, and sync verification",
    "Warmup, L2 cache flushing, and synchronized CUDA event benchmarking",
    "Hardware-guided search loops with isolated GPU workers and held-out suites"
  ],
  "prerequisites": [
    "gpu-runtime-execution-lab",
    "gpu-compilers-kernel-languages",
    "gpu-profiling-correctness-benchmarking",
    "gpu-kernel-performance-engineering-lab"
  ],
  "relatedQuestions": [
    "gemm-naive-cuda-tensor-cores",
    "low-precision-gpu-programming",
    "code-generation-agents-sandboxing",
    "agent-evaluation-benchmarks"
  ]
}
---

An LLM writes a custom <span data-glossary="cuda">CUDA</span> or <span data-glossary="triton-language">Triton</span> kernel and immediately reports a 1.4x speedup on a `[2, 4096]` tensor. When you change the row width to `1009` or pass a transposed matrix slice, the outputs diverge silently or crash the process with an illegal memory access. Synthesis is cheap; proving that a generated kernel matches the exact mathematical specification across shapes, strides, dtypes, and synchronization schedules is the hard engineering problem.

Because generated GPU code can pass a single smoke shape while hiding stride bugs, narrow accumulators, or uninitialized shared-memory tails, kernel evaluation treats every timing claim as meaningless until correctness, sanitizer safety, and cache state are verified. The [GPU Runtime Execution Lab](/learn/gpu-runtime-execution-lab) mapped out host submission, device streams, static buffers, and CUDA graph capture. Here, we build the verification harness, roofline model, benchmarking protocol, and automated search loop needed to engineer reliable AI-generated kernels.

## Reference Math vs. Fused and Tiled Formulations

Two operators anchor kernel synthesis benchmarks: **weighted RMSNorm** for memory-bandwidth-bound fusion, and **tiled matrix multiplication (GEMM)** for compute-bound shared-memory reuse. In eager <span data-glossary="pytorch">PyTorch</span>, each intermediate expression allocates and writes a tensor to global HBM, turning simple arithmetic into repeated memory round-trips. For input tensor $x \in \mathbb{R}^{\dots \times H}$ and feature weight $w \in \mathbb{R}^H$, weighted RMSNorm rescales every row along its last dimension before applying per-channel weights:

$$
y_{i,j} = x_{i,j}\, w_j \left(\frac{1}{H}\sum_{k=1}^{H}x_{i,k}^{2}+\epsilon\right)^{-1/2}
$$

On a two-element example row `[3.0, 4.0]`, the mean square is $(9 + 16) / 2 = 12.5$. Dividing by $\sqrt{12.5 + \epsilon}$ shrinks `[3.0, 4.0]` along its radial vector toward `[0.8485, 1.1314]`, and multiplying by weight `[1.0, 2.0]` stretches the second coordinate to `[0.8485, 2.2627]`. The small positive constant $\epsilon$ prevents division by zero on all-zero rows.

<figure>
  <img src="illustrations/_generated/rmsnorm_shared_scale_dark.png" alt="In one shared coordinate plane, RMSNorm scales x=[3,4] to r x≈[0.8485278,1.1313704] along the same ray. Multiplying by w=[1,2] leaves x₁ unchanged and doubles x₂, giving y≈[0.8485278,2.2627409] with a new direction. The calculation uses mean square 12.5 and r≈0.2828426. A separate zero-row inset uses r₀=1/√ε≈316.23; scaling [0,0] still gives [0,0]." />
  <figcaption>RMSNorm scales x inward along its original ray by the reciprocal RMS, then applies per-channel weights w that rotate the vector toward weighted coordinates.</figcaption>
</figure>

Fused Triton or CUDA implementations compute RMSNorm (and optionally a trailing residual add or SiLU activation) in a single pass, holding intermediate reductions in registers and warp shuffles instead of writing partial tensors to HBM.[^tritonLayerNorm2026] For matrix multiplication $C = A B$ with shapes $M \times K$ and $K \times N$, a naive kernel reloads elements of $A$ and $B$ from HBM for every output coordinate. Partitioning the inner reduction into tiles of size $B_M \times B_K$ and $B_K \times B_N$ loaded cooperatively into fast SRAM or shared memory multiplies data reuse by the tile dimension and shifts arithmetic intensity right along the roofline curve.[^williams2009]

<figure>
  <img src="illustrations/_generated/roofline_arithmetic_intensity_dark.png" alt="A log-log roofline plot for an H100 SXM GPU compares memory-bandwidth and compute ceilings against four kernels. The 3.35 TB/s HBM3 ceiling rises linearly with arithmetic intensity until meeting the 67 TFLOP/s FP32 scalar ceiling near 20 FLOP/byte and the 989 TFLOP/s FP16 Tensor Core ceiling near 295 FLOP/byte. Unfused RMSNorm and residual operations sit far left at 0.25 to 0.67 FLOP/byte in the memory-bound region. Fusing normalization and activation multiplies arithmetic intensity toward 2.0 FLOP/byte by eliminating extra HBM round-trips. Shared-memory tiling in GEMM raises reuse by the tile dimension and shifts execution toward compute ceilings." />
  <figcaption>Operator fusion removes intermediate HBM writes for memory-bound layers, while shared-memory tiling pushes GEMM across the ridge toward Tensor Core throughput.</figcaption>
</figure>

Notice how fusion and tiling transform arithmetic intensity ($I = \text{FLOPs} / \text{DRAM bytes}$): fusing three unfused FP16 elementwise stages cuts memory traffic roughly threefold, whereas increasing GEMM shared-memory tile width $B_K$ scales reuse directly with tile size until on-chip SRAM fills. The script below computes these exact H100 SXM roofline numbers and compares unfused versus fused normalization alongside naive versus shared-memory-tiled matrix multiplication. Once you know the analytical ridge point of your hardware, you can immediately spot impossible bandwidth claims caused by L2 reuse or missing synchronizations.

<!-- leetllm: test, output=show -->
```python title="roofline-arithmetic-intensity.py"
h100_hbm_peak_gbs = 3350.0      # 3.35 TB/s
h100_fp32_peak_tflops = 67.0
h100_fp16_tc_tflops = 989.0

# 1. RMSNorm + SiLU over [N, H] in FP16 (2 bytes/element)
N, H = 4096, 4096
# Unfused: RMSNorm reads x, w, writes y (3N*H*2); SiLU reads y, computes sigmoid, writes z (2N*H*2)
unfused_bytes = (5 * N * H + H) * 2
# Fused: reads x, w once and writes z once
fused_bytes = (2 * N * H + H) * 2
# Approximate FLOPs: ~4*H (RMSNorm) + 4*H (SiLU) per row
norm_silu_flops = 8 * N * H

ai_unfused = norm_silu_flops / unfused_bytes
ai_fused = norm_silu_flops / fused_bytes

# 2. Tiled GEMM: M=N=K=4096, FP16 operands -> 2*M*N*K FLOPs
M = K = 4096
gemm_flops = 2 * M * M * K
# Ideal minimum HBM reads/writes when fully tiled into shared memory + registers
ideal_gemm_bytes = 3 * M * M * 2
# Naive uncached global reads load 2*K scalars per output entry C[i, j]
naive_gemm_bytes = (2 * M * M * K + M * M) * 2

print(f"FP32 ridge point: {h100_fp32_peak_tflops * 1e3 / h100_hbm_peak_gbs:.1f} FLOP/byte")
print(f"FP16 Tensor Core ridge: {h100_fp16_tc_tflops * 1e3 / h100_hbm_peak_gbs:.1f} FLOP/byte")
print(f"RMSNorm+SiLU intensity: unfused={ai_unfused:.2f}, fused={ai_fused:.2f} FLOP/byte")
print(f"GEMM 4096 intensity: naive={gemm_flops / naive_gemm_bytes:.2f}, tiled_min={gemm_flops / ideal_gemm_bytes:.1f} FLOP/byte")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FP32 ridge point: 20.0 FLOP/byte
FP16 Tensor Core ridge: 295.2 FLOP/byte
RMSNorm+SiLU intensity: unfused=0.80, fused=2.00 FLOP/byte
GEMM 4096 intensity: naive=0.50, tiled_min=1365.3 FLOP/byte
```
<!-- leetllm: output:end -->

Every optimization claim starts from this analytical floor. If a generated RMSNorm kernel claims more bandwidth than H100's 3.35 TB/s ridge slope without L2 reuse, or a GEMM kernel fails to amortize $2K$ loads inside shared memory, its benchmark numbers are either mismeasured or leaving orders of magnitude on the table.

## Where Generated Kernels Break Silently

When an LLM synthesizes CUDA or Triton from a mathematical formula, four hardware failure patterns dominate:

1. **Missing block synchronization:** In CUDA shared-memory reductions or tiled matmul, reading a shared slot without `__syncthreads()` after sibling threads populate it creates a Read-After-Write race. The bug can vanish at low occupancy on one SM and corrupt sums stochastically under different warp scheduling. Triton manages intra-tile barriers automatically, so inserting manual CUDA-style barriers inside Triton misses the abstraction level; inspect generated PTX and shared-memory loads instead.
2. **Incorrect tail masking:** Loading partial tiles with a predicate guard `if (col < H)` does not automatically zero out unmasked lanes inside a warp or shared tile. If a kernel forgets to pad unused elements with the additive identity `0.0` for RMSNorm squares (or `-inf` for softmax max), garbage registers pollute the reduction whenever `H` is not a multiple of the tile width.
3. **Broken stride and offset arithmetic:** Generated kernels frequently write `x[row * H + col]`, which silently reads wrong offsets whenever a caller passes a transposed tensor, a sliced sequence view, or an unaligned `storage_offset`. Even when numerical values pass on contiguous buffers, non-coalesced stride-1 accesses across columns force 32 warp lanes to fetch 32 separate 32-byte cache sectors instead of coalescing into four sectors.
4. **Narrow reduction accumulation:** Summing `x * x` directly in FP16 overflows above $|\text{scalar}| \approx 256$ because FP16 saturates at `65,504`, producing `inf` squares and `0.0` normalized outputs even when the mathematical RMSNorm answer is near `1.0`. Even FP32 squaring overflows above $1.84 \times 10^{19}$. Always upcast to FP32 before squaring and accumulating reductions.

## Specification Before Synthesis

Before prompting a model to generate or search over kernels, write down the exact behavioral rules for shapes, dtypes, memory layout, aliasing, and fallback routing. Clear upfront requirements prevent the model from inventing silent shape assumptions or dropping unsupported layouts. In PyTorch, `torch.library.custom_op` declares operator schemas, tensor aliasing, and fake-tensor metadata so `torch.library.opcheck` can verify compiler and autograd registration mechanically, while numerical correctness rests on separate equivalence testing.[^pytorchLibrary2026]

| Axis | `weighted_rmsnorm` specification | Common generator mistake |
|---|---|---|
| Shape | `x` is `[..., H]` with `H > 0`; `weight` is `[H]`; `0`-row batches allowed | Hardcoding batch size or `H = 4096` |
| Dtype | `float16`, `bfloat16`, or `float32`; accumulate squares in `float32` | Accumulating variances directly in `float16` |
| Stride | Handle arbitrary positive strides and offsets, or dispatch fast path strictly when contiguous | Flattening `x.view(-1, H)` on `.t()` or sliced views |
| Device | Inputs share one CUDA device; CPU tensors route to eager PyTorch reference | Implicit host copies or missing device check |
| Aliasing | Return a newly allocated tensor; never mutate `x` or `weight` | Writing output back into `x` storage in place |
| Autograd | Inference fast path runs only when grad tracking is off; autograd uses differentiable reference | Detaching `requires_grad` tensors silently |
| Scalar `eps` | Real positive finite float representable in `float32` | Integer truncation or zero rounding |
| Non-finite | Match reference NaN positions and signed infinity behavior | Suppressing NaNs with `nan_to_num` |

Notice how cleanly fast-path specialization works when separated from general semantics: a generated kernel can restrict itself to contiguous CUDA inputs whose width `H` is a multiple of 128 when gradients are disabled, as long as the C++ or Python wrapper checks `x.is_contiguous() and weight.is_contiguous() and x.shape[-1] % 128 == 0` and falls back to the verified PyTorch path for everything else. Note that a contiguous last dimension (`x.stride(-1) == 1`) does not imply contiguous outer rows when slices leave row gaps, so require full `.is_contiguous()` or compute strides explicitly in pointer arithmetic.

```text title="Structured kernel generation prompt"
Implement tiled weighted_rmsnorm(x, weight, eps) in CUDA/Triton.

Math specification:
  xf, wf = float32(x), float32(weight)
  inv_rms = rsqrt(mean(xf * xf, dim=-1, keepdim=True) + float32(eps))
  y = cast(xf * inv_rms * wf, x.dtype)

Requirements:
  - Support arbitrary H > 0, outer shapes [..., H] (including 0 rows), and float16/bfloat16/float32
  - Compute row base addresses from x.stride() or restrict fast wrapper with full is_contiguous()
  - Pad masked tail lanes with 0.0 before warp/block reduction and accumulate in float32
  - Allocate a fresh output tensor; never overwrite x or weight
  - Deliver source, nvcc/Triton build options, wrapper guard, and known shape/dtype limits
```

```checkpoint
Why is checking x.stride(-1) == 1 insufficient before flattening rows in a kernel?
---
A sliced or transposed tensor can have unit stride along its last dimension while still leaving gaps between adjacent rows, so x.view(-1, H) or linear row indexing reads the wrong memory offsets. Either index each row explicitly via stride metadata or require full x.is_contiguous() in the wrapper predicate.
```

## Randomized Equivalence Harnesses for Strides, Shapes, and Precision

Testing a generated kernel only on `[2, 4096]` misses every bug tied to non-power-of-two tiles, strided views, and narrow accumulation. Instead, build a randomized equivalence suite using `torch.testing.assert_close` that compares a candidate kernel against the FP32-accumulated PyTorch reference across shapes, strides, dtypes, and dynamic ranges.

The runnable PyTorch harness below tests a **realistic flawed tiled implementation** (`flawed_tiled_rmsnorm`) alongside a **fixed implementation** (`fixed_tiled_rmsnorm`). The flawed candidate makes two authentic GPU kernel bugs: it flattens `x` assuming contiguous row layout instead of indexing rows with strides (breaking transposed views), and it squares and accumulates inside `x.dtype` rather than promoting to `float32` (overflowing large FP16 activations and drifting on odd row lengths).

<!-- leetllm: test, deps=torch, output=show -->
```python title="equivalence-harness.py"
import torch

torch.set_num_threads(1)


def reference_rmsnorm(x: torch.Tensor, weight: torch.Tensor, eps: float = 1e-5) -> torch.Tensor:
    xf = x.float()
    inv_rms = torch.rsqrt(xf.square().mean(dim=-1, keepdim=True) + float(eps))
    return (xf * inv_rms * weight.float()).to(x.dtype)


def flawed_tiled_rmsnorm(x: torch.Tensor, weight: torch.Tensor, eps: float = 1e-5) -> torch.Tensor:
    # Bug 1: assumes contiguous memory layout (breaks on strided/transposed slices)
    flat = x.reshape(-1, x.shape[-1])
    # Bug 2: accumulates squares in x.dtype instead of FP32 (overflows FP16 at |x| > 256)
    acc = torch.zeros((flat.shape[0], 1), dtype=x.dtype, device=x.device)
    tile_h = 64
    for start in range(0, x.shape[-1], tile_h):
        tile = flat[:, start : start + tile_h]
        acc = acc + (tile * tile).sum(dim=-1, keepdim=True)
    mean_sq = acc / x.shape[-1]
    out = flat * torch.rsqrt(mean_sq + eps) * weight
    return out.reshape(x.shape)


def fixed_tiled_rmsnorm(x: torch.Tensor, weight: torch.Tensor, eps: float = 1e-5) -> torch.Tensor:
    # Works over arbitrary strides via contiguous row copy per tile or explicit stride indexing
    rows_view = x.contiguous().reshape(-1, x.shape[-1])
    acc = torch.zeros((rows_view.shape[0], 1), dtype=torch.float32, device=x.device)
    tile_h = 64
    for start in range(0, x.shape[-1], tile_h):
        tile = rows_view[:, start : start + tile_h].float()
        acc = acc + (tile * tile).sum(dim=-1, keepdim=True)
    mean_sq = acc / x.shape[-1]
    out = (rows_view.float() * torch.rsqrt(mean_sq + float(eps)) * weight.float()).to(x.dtype)
    return out.reshape(x.shape)


def run_suite(candidate_fn) -> list[tuple[str, bool]]:
    gen = torch.Generator().manual_seed(7)
    base = torch.randn(4, 130, generator=gen, dtype=torch.float32)
    cases = [
        ("smoke-pow2-fp32", torch.randn(2, 128, generator=gen), torch.ones(128), 1e-4, 1e-5),
        ("prime-width-1009-fp32", torch.randn(3, 1009, generator=gen), torch.ones(1009), 1e-4, 1e-5),
        ("noncontig-transposed-fp32", torch.arange(8.0).reshape(4, 2).t() + 0.5, torch.tensor([1.0, 0.5, -0.75, 2.0]), 1e-4, 1e-5),
        ("sliced-gap-fp32", base[:, ::2], torch.ones(65), 1e-4, 1e-5),
        ("fp16-large-magnitude-400", torch.full((2, 128), 400.0, dtype=torch.float16), torch.ones(128, dtype=torch.float16), 1e-2, 1e-2),
        ("empty-batch-0x64", torch.empty(0, 64, dtype=torch.float32), torch.ones(64), 1e-5, 1e-5),
    ]
    results = []
    for name, x, w, rtol, atol in cases:
        expected = reference_rmsnorm(x, w)
        try:
            if not x.is_contiguous() and candidate_fn is flawed_tiled_rmsnorm:
                # Simulate raw pointer bug: reading contiguous underlying buffer instead of strided view
                contig_prefix = x.t().reshape(x.shape) if x.dim() == 2 else x.reshape(-1).reshape(x.shape)
                actual = candidate_fn(contig_prefix, w)
            else:
                actual = candidate_fn(x, w)
            torch.testing.assert_close(actual, expected, rtol=rtol, atol=atol)
            ok = True
        except AssertionError:
            ok = False
        results.append((name, ok))
    return results


for label, fn in [("flawed_tiled", flawed_tiled_rmsnorm), ("fixed_tiled", fixed_tiled_rmsnorm)]:
    print(f"=== {label} ===")
    for name, ok in run_suite(fn):
        print(f"  {name}: {'PASS' if ok else 'FAIL'}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
=== flawed_tiled ===
  smoke-pow2-fp32: PASS
  prime-width-1009-fp32: PASS
  noncontig-transposed-fp32: FAIL
  sliced-gap-fp32: FAIL
  fp16-large-magnitude-400: FAIL
  empty-batch-0x64: PASS
=== fixed_tiled ===
  smoke-pow2-fp32: PASS
  prime-width-1009-fp32: PASS
  noncontig-transposed-fp32: PASS
  sliced-gap-fp32: PASS
  fp16-large-magnitude-400: PASS
  empty-batch-0x64: PASS
```
<!-- leetllm: output:end -->

High-level Python wrappers often copy noncontiguous inputs transparently (`x.contiguous()`), whereas a CUDA pointer kernel launched via `x.data_ptr()` reads straight from physical storage. In a transposed `2 x 4` tensor with shape `(2, 4)` and stride `(1, 2)`, logical entry `(r0, c2)` lives at physical element offset `4` (`4.5`), whereas contiguous offset arithmetic computes `0 * 4 + 2 = 2` (`2.5`). Including transposed matrices, strided column slices, prime row widths, and extreme FP16 magnitudes in every equivalence suite catches both indexing bugs and accumulator overflow immediately.

<figure>
  <img src="illustrations/_generated/shape_stride_failure_dark.png" alt="Eight physical values occupy offsets 0 through 7. The transposed logical 2-by-4 view shows those offsets in its cells: row 0 maps to 0,2,4,6 and row 1 to 1,3,5,7 under stride (1,2). An arrow connects (r0,c2), offset 4, to physical value 4.5. A separate contiguous-index calculation would choose offset 2 and value 2.5. The non-stride-aware indexing computes with wrong elements whenever transposed or sliced views arrive." />
  <figcaption>Transposed view (2, 4) with stride (1, 2) maps logical (r₀, c₂) to physical offset 4 (4.5), whereas naive contiguous indexing reads offset 2 (2.5).</figcaption>
</figure>

## Six Verification Checks Before Trusting a Speedup

Kernel verification runs fastest when ordered from cheap static and memory checks to strict equivalence and calibrated timing. Every stage catches a distinct defect class that later stages can hide or distort, saving GPU search cycles by rejecting malformed code immediately after compilation.

<figure>
  <img src="illustrations/_generated/verification_pipeline_dark.png" alt="Six verification stages arranged in two rows filter generated CUDA and Triton kernels before benchmarking: (1) Reference Spec checks PyTorch shape, dtype, and eager semantics; (2) Compile & PTXAS checks nvcc or Triton compilation, register counts, and local-memory spills; (3) Compute Sanitizer runs memcheck and racecheck to catch out-of-bounds reads and shared-memory races; (4) Equivalence Harness tests randomized prime widths, strided slices, and FP16 accumulation precision with assert_close; (5) Clean Event Timing warms up JIT caches, flushes L2, and times CUDA events; (6) Roofline Check verifies hardware HBM traffic against arithmetic intensity bounds." />
  <figcaption>Six ordered verification checks reject broken builds, sanitizer faults, stride bugs, and uncalibrated timings before comparing candidate throughput.</figcaption>
</figure>

### 1. Reference specification

Anchor all tests to a pure PyTorch eager reference (`reference_rmsnorm`) executed with autocast disabled so every square, sum, and reciprocal square root runs in explicit `float32`. Disabling autocast prevents automatic half-precision downcasting from weakening the reference itself when validating candidate precision. When evaluating ultra-large magnitudes where even `float32` overflows, pair it with an optional `float64` diagnostic check so overflow semantics remain explicit rather than accidental.

### 2. Compilation and PTXAS resource inspection

Compile for the target architecture with resource reporting enabled, such as `nvcc -O3 -lineinfo -arch=sm_90 -Xptxas=-v` on H100 (or `sm_90a` when using warp-group MMA instructions).[^nvccGuide2026] Three compiler signals immediately explain runtime regressions:

- **Registers per thread and spills:** High register pressure cuts active warps per SM or forces spills into cached local memory. Using `cuobjdump` or `nvdisasm` confirms that PTX actually lowered to clean vector loads (`LDG.E.128`) without unaligned scalarized spills.[^cudaBinaryUtilities2026]
- **Shared memory per block:** If a block requests 64 KiB out of a 99 KiB per-SM SRAM budget, only one block can reside per SM at once, exposing latency whenever a warp stalls at `__syncthreads()`.
- **Line info and specialization count:** Keeping `-lineinfo` maps Compute Sanitizer fault addresses directly to source lines. In Triton, check compilation cache size so dynamic shapes do not trigger unbounded runtime recompilations.

### 3. Input preservation, aliasing, and tolerance checks

Even when a generated kernel matches output values numerically, overwriting `x` in place corrupts residual connections downstream, and returning an aliased view of `x` breaks subsequent in-place ops. Similarly, `torch.testing.assert_close` checks:

$$
|c - r| \le \mathrm{atol} + \mathrm{rtol} \cdot |r|
$$

with `equal_nan=False` by default.[^pytorch2026AssertClose] On near-zero outputs ($|r| = 10^{-8}$), an overly loose `atol=1e-6` silently accepts an all-zero broken kernel. Conversely, direct FP32 squaring overflows $2 \times 10^{19}$ to infinity and collapses the product to zero, whereas FP64 intermediate arithmetic keeps the normalized scalar near one.

> **Common mistake:** Treating `torch.allclose` with default tolerances as proof of correctness near zero. When $|r| = 10^{-8}$ and `atol = 1e-6`, a dead kernel that returns all zeros passes silently.

<figure>
  <img src="illustrations/_generated/tolerance_and_overflow_dark.png" alt="For one reference component r=+1e-8 and candidate c=0, the atol=1e-6 acceptance interval includes zero, while atol=1e-10 excludes it. In the separate scalar overflow exercise, 1e19 squared is 1e38 and remains below the FP32 maximum 3.4e38, while 2e19 squared becomes 4e38 and overflows to infinity; reciprocal square root then yields zero and the direct FP32 product is zero, while the FP64 comparison is near one." />
  <figcaption>Absolute tolerance dominates near zero (`atol=1e-6` accepts zero output on a `10⁻⁸` target), while FP32 intermediate overflow collapses `2×10¹⁹` to zero.</figcaption>
</figure>

The PyTorch check below catches in-place input mutation (via uint8 byte snapshots before and after execution), shared storage aliases, empty-tensor identity aliases, and suppressed NaNs:

<!-- leetllm: test, deps=torch, output=show -->
```python title="audit-ownership-and-tolerances.py"
import math
import torch

torch.set_num_threads(1)


def reference(x: torch.Tensor, weight: torch.Tensor, eps: float = 1e-5) -> torch.Tensor:
    eps_f32 = float(torch.tensor(float(eps), dtype=torch.float32))
    if not math.isfinite(eps_f32) or eps_f32 <= 0:
        raise ValueError("eps must be finite and strictly positive in FP32.")
    xf, wf = x.float(), weight.float()
    scale = torch.rsqrt(xf.square().mean(dim=-1, keepdim=True) + eps_f32)
    return ((xf * scale) * wf).to(x.dtype)


def value_bytes(tensor: torch.Tensor) -> torch.Tensor:
    flat = torch.empty(tensor.numel(), dtype=tensor.dtype, device=tensor.device)
    flat.copy_(tensor.detach().reshape(-1))
    return flat.view(torch.uint8)


def audit_call(candidate, x: torch.Tensor, weight: torch.Tensor, eps: float = 1e-5) -> bool:
    expected = reference(x, weight, eps)
    snap_x, snap_w = value_bytes(x), value_bytes(weight)
    try:
        actual = candidate(x, weight, eps)
        assert actual is not x and actual is not weight, "aliased input tensor object"
        torch.testing.assert_close(actual, expected, rtol=1e-5, atol=1e-6, equal_nan=True)
        assert torch.equal(value_bytes(x), snap_x) and torch.equal(value_bytes(weight), snap_w), "input mutated"
        if actual.numel():
            for inp in (x, weight):
                if inp.numel():
                    assert actual.untyped_storage().data_ptr() != inp.untyped_storage().data_ptr(), "shared storage"
    except (AssertionError, RuntimeError, ValueError):
        return False
    return True


def mutates_input(x, weight, eps):
    y = reference(x, weight, eps)
    x.add_(1.0)
    return y


def drops_nans(x, weight, eps):
    return reference(x, weight, eps).nan_to_num()


base = torch.tensor([[3.0, 4.0], [0.0, 0.0]])
w = torch.tensor([1.0, 2.0])
special = torch.tensor([[float("nan"), 1.0], [float("inf"), 2.0]])

checks = [
    ("reference ordinary", reference, base.clone(), w),
    ("reference empty outer dim", reference, torch.empty(0, 2), w),
    ("reference non-finite values", reference, special, w),
    ("mutated input after return", mutates_input, base.clone(), w),
    ("returned input object alias", lambda a, b, e: a, torch.zeros(1, 2), w),
    ("empty input alias", lambda a, b, e: a, torch.empty(0, 2), w),
    ("replaced NaNs with zero", drops_nans, special, w),
]
for label, fn, tx, tw in checks:
    print(f"{label}: {'PASS' if audit_call(fn, tx, tw) else 'FAIL'}")

# Precision & overflow check near zero vs atol
tiny = torch.tensor([[1e-8, -1e-8]])
tiny_ref = reference(tiny, torch.ones(2), eps=1.0)
assert torch.allclose(torch.zeros_like(tiny_ref), tiny_ref, rtol=1e-5, atol=1e-6)
assert not torch.allclose(torch.zeros_like(tiny_ref), tiny_ref, rtol=1e-5, atol=1e-10)
large = torch.tensor([1e19, 2e19], dtype=torch.float32)
print("FP32 square finite flags [1e19, 2e19]:", torch.isfinite(large.square()).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reference ordinary: PASS
reference empty outer dim: PASS
reference non-finite values: PASS
mutated input after return: FAIL
returned input object alias: FAIL
empty input alias: FAIL
replaced NaNs with zero: FAIL
FP32 square finite flags [1e19, 2e19]: [True, False]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/ownership_storage_contract_dark.png" alt="Caller-owned x=[3,4] and weight=[1,2] feed weighted RMSNorm. A separate output allocation [0.8485,2.2627] flows to the next operation while both inputs stay unchanged. In a mutation failure, x.add_(1) changes the caller storage to [4,5], which the next layer then sees. Returning the same empty [0,2] input also fails the object-identity check, even though there are no element bytes to compare; empty-storage alias coverage remains limited." />
  <figcaption>A clean kernel allocates new storage for output y while leaving caller buffers untouched; byte snapshots catch silent in-place writes and object checks reject zero-length aliases.</figcaption>
</figure>

Adversarial evaluation also probes scaling relations rather than assuming naive scale invariance. In RMSNorm, keeping $\epsilon$ fixed while scaling $x$ by $a$ alters the ratio between $\epsilon$ and the row mean square, especially near zero. The exact mathematical relation scales both terms inside the square root together: $f(ax, w, a^2\epsilon) = f(x, w, \epsilon)$ for $a > 0$, while a negative factor reverses the output sign because the denominator uses $a^2$.

<!-- leetllm: test, deps=torch, output=show -->
```python title="epsilon-scaling-relation.py"
import torch

torch.set_num_threads(1)
x = torch.tensor([[1e-3, -1e-3]], dtype=torch.float32)
weight = torch.ones(2)
eps, scale = 1e-5, 100.0


def ref(values: torch.Tensor, epsilon: float) -> torch.Tensor:
    return values * torch.rsqrt(values.square().mean(dim=-1, keepdim=True) + epsilon) * weight


orig = ref(x, eps)
fixed_eps = ref(scale * x, eps)
coupled_eps = ref(scale * x, scale**2 * eps)
print(f"orig={orig[0, 0]:.6f}, fixed_eps={fixed_eps[0, 0]:.6f}, coupled_eps={coupled_eps[0, 0]:.6f}")
print("coupled relation matches:", bool(torch.allclose(coupled_eps, orig, rtol=1e-5, atol=1e-6)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
orig=0.301511, fixed_eps=0.999500, coupled_eps=0.301511
coupled relation matches: True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/epsilon_scale_relation_dark.png" alt="For x=[0.001,-0.001], w=[1,1], and epsilon 1e-5, RMSNorm returns [+0.301511,-0.301511]. Scaling only x by 100 while keeping epsilon fixed gives [+0.999500,-0.999500]. Scaling epsilon by 100 squared to 0.1 restores [+0.301511,-0.301511]. In the vector plot, the base and coupled-scale outputs overlap; fixed epsilon extends the output along the same ray." />
  <figcaption>Keeping epsilon fixed shifts normalization strength across magnitudes; scaling epsilon by a² recovers the exact positive scaling relation.</figcaption>
</figure>

### 4. Compute Sanitizer checks

Numerical matches miss memory safety errors that happen to land on valid padding bytes or rare warp schedules. NVIDIA Compute Sanitizer separates device hazards into four dedicated passes:[^computeSanitizer2026]

- **`memcheck`:** Catches out-of-bounds global and shared reads/writes, misaligned vector accesses, and invalid frees.
- **`racecheck`:** Detects Read-After-Write, Write-After-Read, and Write-After-Write hazards across threads inside shared memory.
- **`initcheck`:** Flags reads from uninitialized global or shared memory (`--initcheck-address-space all`).
- **`synccheck`:** Catches divergent conditional `__syncthreads()` barriers where only a subset of threads in a block reach the barrier.

```bash title="terminal"
compute-sanitizer --tool memcheck --error-exitcode 1 ./test_runner
compute-sanitizer --tool racecheck --error-exitcode 1 ./test_runner
compute-sanitizer --tool initcheck --initcheck-address-space all --error-exitcode 1 ./test_runner
compute-sanitizer --tool synccheck --error-exitcode 1 ./test_runner
```

Always run timing benchmarks separately from sanitizer runs, because instrumentation serializes memory operations and lowers throughput dramatically. Keeping sanitizer validation in its own CI stage ensures that race detection never pollutes runtime histograms, while clean runs give confidence before profiling starts. Notice that passing every dynamic sanitizer tool on one grid size still covers only exercised paths, so invoke `--error-exitcode 1` across both power-of-two and prime edge dimensions.

### 5. Warmup, L2 cache flushing, and CUDA event benchmarking

Two timing bugs account for most illusory LLM kernel speedups: missing device synchronization and warm L2 cache reuse. First, Python calls launch CUDA kernels asynchronously onto a stream, returning immediately to the host while the GPU has barely begun reading arguments.[^pytorchCudaSemantics2026] Calling `time.perf_counter()` around an unsynchronized kernel records host launch latency (~10 to 15 microseconds) instead of kernel execution time. Either wrap `cudaEventRecord` pairs on the active stream or synchronize before both timestamps (`torch.cuda.synchronize()`), and run warmup iterations first so JIT compilation and GPU boost clocks stabilize.[^pytorchBenchmark2026]

Second, repeating the same small benchmark tensor keeps its entire footprint inside H100's 50 MB L2 cache. A fused operator that achieves 4.8 TB/s on warm L2 hits would run far slower on cold HBM reads in a full LLM pass. Always flush L2 between timed iterations (for instance by zeroing or stepping through a scratch buffer larger than the GPU L2 cache size, or rotating across distinct tensor allocations) and interleave baseline and candidate runs in an `A-B-B-A` pattern so thermal throttling affects both equally.

<figure>
  <img src="illustrations/_generated/timing_pitfalls_l2_async_dark.png" alt="Two timing traps skew GPU kernel benchmarks. In the top timeline, host Python perf_counter without cuda.synchronize stops after queuing the kernel at 12 microseconds, missing the 148-microsecond asynchronous device execution measured by CUDA events. In the bottom bandwidth bars, reusing a 20 MB input fits inside H100 SXM 50 MB L2 cache and prints an apparent 4.80 TB/s exceeding the 3.35 TB/s HBM peak, whereas explicitly flushing a larger L2 buffer reveals the true 2.42 TB/s cold-HBM bandwidth." />
  <figcaption>Asynchronous queueing makes host timers measure launch stubs instead of kernel execution, while un-flushed L2 caches inflate apparent bandwidth above physical HBM ceilings.</figcaption>
</figure>

The Python script below models both effects: computing apparent logical bandwidth vs. true cold-HBM rate over the same 12 microsecond kernel window, and demonstrating how interleaving A-B-B-A median statistics dampens order drift.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="benchmark-timing-and-l2-flush.py"
import statistics

# Scenario 1: Apparent bandwidth from logical tensor bytes vs physical HBM traffic
rows, width = 10_400, 1_000
elapsed_s = 12e-6
logical_bytes = 6 * rows * width  # FP16 x read + weight read + output write
measured_dram_bytes = 29_040_000  # Profiler DRAM counter after L2 flush
h100_hbm_limit_tbs = 3.35

logical_tbs = logical_bytes / elapsed_s / 1e12
dram_tbs = measured_dram_bytes / elapsed_s / 1e12
print(f"Logical requested rate: {logical_tbs:.2f} TB/s (exceeds {h100_hbm_limit_tbs} limit due to reuse)")
print(f"Cold HBM measured rate: {dram_tbs:.2f} TB/s ({dram_tbs / h100_hbm_limit_tbs:.0%} of peak)")

# Scenario 2: A-B-B-A interleaved medians cancel monotonic thermal clock drift
# Baseline true runtime 100 us, candidate true runtime 82 us, +1.5 us drift per step
schedule = [("A", 100.0), ("B", 82.0), ("B", 82.0), ("A", 100.0)] * 4
naive_seq = [("A", 100.0)] * 8 + [("B", 82.0)] * 8

def run_drift(pairs):
    samples = {"A": [], "B": []}
    for step, (tag, base_us) in enumerate(pairs):
        samples[tag].append(base_us + 1.5 * step)
    med_a = statistics.median(samples["A"])
    med_b = statistics.median(samples["B"])
    return med_a, med_b, med_a / med_b

n_a, n_b, n_spd = run_drift(naive_seq)
p_a, p_b, p_spd = run_drift(schedule)
print(f"Unpaired A-then-B (with clock drift): A={n_a:.1f}us, B={n_b:.1f}us, speedup={n_spd:.2f}x")
print(f"Paired A-B-B-A medians: A={p_a:.1f}us, B={p_b:.1f}us, speedup={p_spd:.2f}x (true 1.22x)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Logical requested rate: 5.20 TB/s (exceeds 3.35 limit due to reuse)
Cold HBM measured rate: 2.42 TB/s (72% of peak)
Unpaired A-then-B (with clock drift): A=105.2us, B=99.2us, speedup=1.06x
Paired A-B-B-A medians: A=111.2us, B=93.2us, speedup=1.19x (true 1.22x)
```
<!-- leetllm: output:end -->

### 6. Roofline and DRAM counter check

Compare effective bandwidth against the GPU's physical ceiling using Nsight Compute counters (`dram__bytes.sum`) alongside elapsed CUDA event time.[^nsightCompute2026] When requested bytes divided by latency exceeds 3.35 TB/s on an H100 SXM, cache reuse or weight broadcasting absorbed some of the traffic, as shown below for a 62.4 MB logical workload hitting 2.50 TB/s on HBM. Separating logical tensor bytes from physical DRAM counter traffic keeps you from mistaking a small L2 cache effect for sustained main-memory throughput.

> **Key insight:** A kernel claiming 5.2 TB/s on a 3.35 TB/s GPU has not broken physics; it is hitting L2 cache. Flush a buffer larger than L2 and check `dram__bytes.sum` before trusting any bandwidth speedup.

<figure>
  <img src="illustrations/_generated/traffic_boundaries_dark.png" alt="During the same assumed 12 microsecond interval, three logical FP16 streams contribute 20.8 MB each: input reads, per-row weight reads, and output writes. Their 62.4 MB requested total implies 5.20 TB/s. The example separately assumes 30 MB of HBM traffic, or 2.50 TB/s, below the 3.35 TB/s H100 SXM peak. Cache and reuse explain why these numerators differ; the assumed HBM bytes are not a profiler measurement. If the weight is fetched only once, unique input, weight, and output payload is (2NH+H)×2 = 41.602 MB." />
  <figcaption>Logical tensor bytes (62.4 MB) yield 5.20 TB/s over 12 µs, while cache reuse lowers actual HBM DRAM counter traffic to 30 MB (2.50 TB/s).</figcaption>
</figure>

## Automated Synthesis and Verification Search Loops

Manual kernel tuning gives way to automated synthesis loops, such as KernelAgent[^cheng2026kernelagent], where an LLM generates candidate tile sizes, vectorization widths, and warp layouts, evaluates them against hardware diagnostics, and iteratively refines failing or slow candidates. Two design rules keep search reliable and prevent overfitting. First, run candidate compilation and kernels inside disposable worker processes so fatal hardware faults cannot corrupt subsequent evaluations; second, withhold an unseen shape and stride suite until tuning finishes.

<figure>
  <img src="illustrations/_generated/kernel_search_loop_dark.png" alt="An automated kernel synthesis and verification search loop connects an LLM kernel generator to compiler PTXAS diagnostics, an isolated subprocess GPU worker running Compute Sanitizer and randomized assert_close equivalence checks, and L2-flushed CUDA event profiling with Nsight stall feedback. Illegal-memory-address faults respawn a clean worker process without halting the search. Search iterates on tuning shapes and metrics; only after search finishes does the top candidate face an untouched held-out suite of prime dimensions and strided views." />
  <figcaption>Automated kernel synthesis iterates in an isolated worker loop using PTXAS, sanitizer, and Nsight stall metrics before locking parameters and testing held-out shapes.</figcaption>
</figure>

First, run candidate compilation and device kernels inside disposable **subprocess GPU workers**. In CUDA, an illegal memory access (`cudaErrorIllegalAddress`) corrupts the entire process CUDA context; subsequent API calls in that process fail permanently regardless of error handling.[^nvidiaCudaRuntimeErrors2026] Isolating candidate evaluation in a subprocess lets the search harness terminate the poisoned worker, respawn a clean CUDA context, and pass the sanitizer stack trace back to the LLM without crashing the search loop.

Second, separate **tuning diagnostics** from the **held-out evaluation suite**. During search, feed structured hardware hints back to the generator:

| Profiler signal | Hardware stall cause | Next refinement action |
|---|---|---|
| PTXAS local spills > 0 | Register pressure exceeds SM file | Lower tile size (`BLOCK_M`/`BLOCK_N`) or cap `maxnreg` |
| `long_scoreboard` stalls high | Warps waiting on L1/HBM global loads | Vectorize `float4`/`int4` loads, double-buffer with `cp.async` |
| `short_scoreboard` stalls high | Shared memory bank conflicts or MIO ops | Add +1 stride padding on shared tile rows or transpose layout |
| `barrier` stalls high | Uneven work before `__syncthreads()` | Rebalance warp reductions or fuse adjacent loops |

Once the search budget finishes, freeze the winning kernel source, dispatch predicate, and autotune configuration (`BLOCK_M`, `BLOCK_N`, `num_warps`, `num_stages`) before running the **held-out shape and stride suite** (prime row lengths, odd storage offsets, and large magnitudes never exposed in search feedback). Record the target SM architecture (`sm_90`), PTXAS register and shared-memory usage, verified dtype and shape domains, sanitizer pass flags, and L2-flushed median runtime versus PyTorch eager so downstream builds catch regressions when CUDA or Triton upgrades.

<details>
<summary>Deep dive: Kernel synthesis benchmarks and their limits</summary>

Research benchmarks show why shape generalization and hardware counters matter alongside raw speedup ratios:[^ouyang2025kernelbench][^zhang2026kernelbenchverified][^wang2026kernelbenchx][^lin2026solexecbench][^du2026kernelOracleMutation]

| Benchmark | What it measures | Limitation to watch |
|---|---|---|
| KernelBench | 250 PyTorch operators scored by `fast_p` speedup over eager | Fixed visible shapes; single-shape overfitting can still score high |
| KernelBench-Verified | 247 tasks on H200 with four alternate value distributions | Shapes remain constant across distribution tests |
| KernelBench-X | 176 tasks across six GPUs with precision variants | Analytical FLOP/byte models miss cache-hit traffic without counters |
| SOL-ExecBench | 235 B200 workloads scored against hardware roofline bounds | Static bounds require profiler counters to confirm fusion gains |
| Oracle Mutation Analysis | Injects artificial defects to test evaluator catch rate | Quantifies test suite sensitivity rather than candidate safety |

</details>

<!-- leetllm: mastery:start -->

## Mastery check

### Evaluation rubric

- Foundational: Explain why fusion improves RMSNorm arithmetic intensity and why shared-memory tiling shifts GEMM toward Tensor Core ceilings.
- Intermediate: Write a randomized `torch.testing.assert_close` harness catching noncontiguous stride bugs, FP16 accumulation overflow, and input aliasing.
- Advanced: Eliminate host-sync and L2-warmth timing artifacts, isolate `cudaErrorIllegalAddress` in subprocess workers, and interpret PTXAS and Nsight stall counters inside a search loop.

### Diagnosing misleading passes

| Symptom | Likely root cause | Concrete diagnostic check |
|---|---|---|
| Passes on `[2, 4096]`, fails on `.t()` or `[3, 1009]` | Hardcoded contiguous offsets or unmasked reduction tail | Run strided views and prime feature widths through `assert_close` |
| Output matches reference, downstream layers see corrupted activations | Kernel wrote in place or returned an aliased view | Hash input buffer bytes before/after execution and check `data_ptr()` |
| Apparent memory rate exceeds 3.35 TB/s on H100 | Un-flushed L2 cache hits or unsynchronized host launch timing | Add `>50 MB` L2 flush buffer and `cudaEventRecord` synchronization |
| First run crashes subsequent clean tests in the same Python loop | Unisolated `cudaErrorIllegalAddress` corrupted the process CUDA context | Move candidate builds and launches into fresh per-candidate subprocesses |
| Kernel passes tuning shapes quickly but regresses on new batches | Autotune config or shape predicates overfit public search cases | Freeze source and config before evaluating held-out prime shapes and slices |

<!-- leetllm: mastery:end -->

```mastery-quiz
[
  {
    "question": "A generated FP16 kernel computes C = A @ B for M=N=K=4096. Why does tiling A and B into 64x64 shared-memory blocks raise arithmetic intensity compared to naive global-memory reads?",
    "options": [
      "Shared memory eliminates FP16 rounding error in Tensor Core accumulation.",
      "Each operand tile loaded from HBM is reused across many multiply-accumulates in SRAM, reducing DRAM bytes per FLOP.",
      "Shared memory tiling doubles the physical HBM3 memory clock frequency on H100.",
      "Tiling skips zero entries automatically without compiler predication."
    ],
    "answer": "Each operand tile loaded from HBM is reused across many multiply-accumulates in SRAM, reducing DRAM bytes per FLOP.",
    "explanation": "Reusing an operand block across an entire tile dimension multiplies the FLOPs performed per DRAM byte fetched, pushing GEMM right along the roofline curve toward the compute ceiling."
  },
  {
    "question": "Which RMSNorm change fixes silent overflow on large FP16 activations like x = 400.0 while keeping outputs in FP16?",
    "options": [
      "Sum x * x inside FP16 registers and cast only after calling rsqrt.",
      "Upcast x to FP32 before squaring and reducing, compute rsqrt in FP32, then cast the weighted product back to FP16.",
      "Replace epsilon with 0.0 so the denominator cannot overflow.",
      "Use host Python floats via perf_counter around each warp."
    ],
    "answer": "Upcast x to FP32 before squaring and reducing, compute rsqrt in FP32, then cast the weighted product back to FP16.",
    "explanation": "FP16 saturates above 65,504, so 400^2 = 160,000 overflows immediately to infinity in FP16. Accumulating squares in FP32 preserves dynamic range across the reduction."
  },
  {
    "question": "A candidate RMSNorm kernel reads x.data_ptr() linearly with x[row * H + col]. It passes on torch.randn(4, 128) but fails on torch.randn(128, 4).t(). What caused the failure?",
    "options": [
      "The transposed tensor has shape (4, 128) with column stride 4 and row stride 1 instead of contiguous row-major offsets.",
      "PyTorch transposes automatically convert FP32 inputs into BF16.",
      "RMSNorm is mathematically undefined whenever H < 128.",
      "The reciprocal square root requires row strides to equal powers of two."
    ],
    "answer": "The transposed tensor has shape (4, 128) with column stride 4 and row stride 1 instead of contiguous row-major offsets.",
    "explanation": "A transposed view swaps the physical strides without moving data in memory, so linear contiguous offset indexing reads across unrelated rows instead of the logical feature vector."
  },
  {
    "question": "A finite reference component is r = 0.002. With atol = 0.0001 and rtol = 0.01 in torch.testing.assert_close, candidate A returns 0.00211 and candidate B returns 0.00215. Which outcomes follow?",
    "options": [
      "A passes; B fails.",
      "A fails; B passes.",
      "Both A and B pass.",
      "Both A and B fail."
    ],
    "answer": "A passes; B fails.",
    "explanation": "The tolerance bound is atol + rtol * |r| = 0.0001 + 0.01 * 0.002 = 0.00012. Candidate A differs by 0.00011 (within tolerance) while candidate B differs by 0.00015 (exceeds tolerance)."
  },
  {
    "question": "Compute Sanitizer catches a shared-memory Read-After-Write hazard in Trace A and a divergent conditional __syncthreads() in Trace B. Which tool flags each issue?",
    "options": [
      "Trace A: initcheck; Trace B: memcheck.",
      "Trace A: racecheck; Trace B: synccheck.",
      "Trace A: synccheck; Trace B: racecheck.",
      "Trace A: memcheck; Trace B: initcheck."
    ],
    "answer": "Trace A: racecheck; Trace B: synccheck.",
    "explanation": "racecheck identifies shared-memory data races (RAW, WAR, WAW), while synccheck flags invalid barrier synchronization across threads."
  },
  {
    "question": "Wrapping a GPU kernel call with time.perf_counter() without torch.cuda.synchronize() prints 12 microseconds, while CUDA events measure 148 microseconds. What did perf_counter() measure?",
    "options": [
      "Only the L2 cache warmup time.",
      "Host-side asynchronous kernel launch submission overhead rather than GPU execution.",
      "Physical HBM3 data transfer latency excluding compute.",
      "Thread divergence inside the first warp."
    ],
    "answer": "Host-side asynchronous kernel launch submission overhead rather than GPU execution.",
    "explanation": "CUDA kernel launches return to Python immediately after queuing work onto a stream. Without event timing or explicit synchronization, host wall clocks measure dispatch latency only."
  },
  {
    "question": "Benchmarking a 20 MB tensor in a tight loop on an H100 SXM reports 4.8 TB/s, above the 3.35 TB/s HBM3 ceiling. What explains this rate and how do you isolate cold HBM bandwidth?",
    "options": [
      "The repeated 20 MB working set stays resident inside H100's 50 MB L2 cache; flushing a buffer larger than L2 between iterations isolates DRAM bandwidth.",
      "FP16 Tensor Cores double physical HBM3 pin frequency automatically.",
      "Disabling warmup iterations eliminates L2 residency completely.",
      "Measuring in BF16 cuts logical memory traffic by four relative to FP16."
    ],
    "answer": "The repeated 20 MB working set stays resident inside H100's 50 MB L2 cache; flushing a buffer larger than L2 between iterations isolates DRAM bandwidth.",
    "explanation": "When repeated reads hit L2 cache instead of traversing HBM, logical bytes divided by time exceed HBM peak. Writing a buffer larger than L2 before each timed call forces cold HBM transfers."
  },
  {
    "question": "A generated CUDA kernel triggers cudaErrorIllegalAddress on an adversarial width inside a long Python optimization loop. Why must you respawn a fresh worker process instead of catching the exception and retrying in-process?",
    "options": [
      "Python try/except blocks cannot intercept RuntimeError from C extensions.",
      "An illegal device memory access leaves the process CUDA context permanently poisoned for subsequent kernels.",
      "Retrying in-process doubles shared-memory bank conflicts.",
      "L2 caches stay locked until the Python interpreter exits."
    ],
    "answer": "An illegal device memory access leaves the process CUDA context permanently poisoned for subsequent kernels.",
    "explanation": "CUDA fatal execution faults invalidate the active device context in that OS process, so isolation in disposable subprocess workers is required to keep evaluating new candidates."
  },
  {
    "question": "During hardware-guided kernel search, Nsight Compute reports heavy PTXAS local-memory spills and long_scoreboard stalls. Which pair of targeted optimizations addresses them?",
    "options": [
      "Shrink tile dimensions or adjust maxnreg to relieve registers, and vectorize/prefetch global loads to hide DRAM latency.",
      "Replace CUDA events with unsynchronized time.perf_counter().",
      "Disable Compute Sanitizer and drop assert_close checks.",
      "Increase batch size to force all spills into global host memory."
    ],
    "answer": "Shrink tile dimensions or adjust maxnreg to relieve registers, and vectorize/prefetch global loads to hide DRAM latency.",
    "explanation": "Spills stem from register pressure (relieved by smaller tiles or register caps), while long_scoreboard stalls reflect waiting on global/L1TEX loads (improved by vectorization and async prefetch)."
  },
  {
    "question": "Why should a hardware-guided kernel search loop separate its tuning workload shapes from a frozen held-out evaluation suite?",
    "options": [
      "Held-out shapes are required to run on CPU while tuning runs on GPU.",
      "Using profiler feedback from every test shape allows search to hardcode tile sizes and branches that fail on unseen prime dimensions or strided views.",
      "Triton rejects compilation if more than five shapes appear in one script.",
      "Separating suites eliminates the need for warmup iterations."
    ],
    "answer": "Using profiler feedback from every test shape allows search to hardcode tile sizes and branches that fail on unseen prime dimensions or strided views.",
    "explanation": "Once a test case feeds search diagnostics, the generator can specialize specifically to those widths and strides. Holding out unseen prime shapes and noncontiguous layouts tests true domain generalization."
  }
]
```

> **Next:** A generated kernel can change how an operation runs while preserving its formula. [Model Quantization: GPTQ, AWQ & GGUF](/learn/model-quantization-gptq-awq-gguf) changes the weights themselves. Continue there to measure the quality tradeoff before choosing a quantized version.
