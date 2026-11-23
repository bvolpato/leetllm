---
{
  "id": "low-precision-gpu-programming",
  "title": "Low-Precision GPU Programming",
  "slug": "low-precision-gpu-programming",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/scale_ownership_dark.png",
  "companies": [
    "NVIDIA",
    "AMD",
    "Google",
    "Meta",
    "Microsoft"
  ],
  "shortDescription": "A scaled FP8 round trip can turn 500 into 10 with no NaN. The scale, the accumulator, and the kernel interface decide whether that loss stays visible.",
  "keyConceptsTested": [
    "FP16, BF16, and TF32 range and precision",
    "FP8 E4M3 and E5M2 encodings",
    "Microscaling and sub-8-bit formats (MXFP8, MXFP4, NVFP4)",
    "Per-tensor versus block scaling architectures",
    "Current, delayed, and fused online amax scaling",
    "Mathematical scale factor tracking and scale ownership",
    "Subnormals, flush-to-zero, and saturation cliffs",
    "Round-to-nearest-even versus stochastic rounding",
    "Accumulator type versus internal arithmetic precision"
  ],
  "prerequisites": [
    "gemm-naive-cuda-tensor-cores",
    "mixed-precision-training-loss-scaling",
    "model-parallelism-for-llm-inference"
  ],
  "relatedQuestions": [
    "model-quantization-gptq-awq-gguf",
    "gpu-compilers-kernel-languages",
    "gpu-kernel-performance-engineering-lab",
    "llm-deployment-gpu-serving-autoscaling"
  ],
  "section": "Inference & Production Scale",
  "order": 15
}
---

A value of 500 goes through a scaled FP8 round trip and comes back as 10, with no exception, infinity, or NaN flag. An earlier batch's scale made the new spike too large to encode, so saturating conversion clamped it to the format ceiling. The consumer <span data-glossary="gpu">GPU</span> kernel can accumulate the changed input in FP32 without recovering the discarded information.

<figure>
  <img src="illustrations/_generated/stale_scale_cliff_dark.png" alt="A prior amax of 10 sets S_old to 10 divided by 448. Current x=500 becomes scaled input 22,400, clips to finite E4M3 code 448, then reconstructs to 10. The original-value number line maps 0 to 500 and shows x-hat=10 beside x=500, a 490-unit or 98% relative loss; the FP32 accumulator receives 10 times the weight." />
  <figcaption>An earlier maximum sets S<sub>old</sub> to 10/448. The current 500 scales to 22,400, saturates at the finite E4M3 ceiling, and reconstructs to 10. The FP32 accumulator receives that reconstructed value.</figcaption>
</figure>

Smaller types can save storage and expose faster matrix instructions, but each format transition has its own hardware rate. Halving element width halves the element payload, not necessarily total traffic: scales, padding, conversions, and the output still occupy bytes. TF32 is an immediate counterexample to a storage-saving claim because its operands remain stored in FP32.

Shrinking bits is more involved than flipping a `dtype` argument in PyTorch. Doing low-precision math safely depends on four explicit specifications:

1. **Encoding:** which exact bit patterns represent normal numbers, subnormals, zeros, infinities, and NaNs?
2. **Scaling architecture:** which values share a scale factor, when is that scale measured, and where does it live in memory?
3. **Arithmetic and accumulation:** which precision enters the multiplier ALUs, which type accumulates dot products, and where does dequantization happen?
4. **Kernel application binary interface (ABI):** which layouts, byte alignments, architecture targets, and swizzle patterns does the hardware instruction require?

To see how shared scales affect outliers and small magnitudes, consider a projection $Y = XW$ with two rows of 32 activations and one 32-element weight column. One row contains values as small as $0.001$, while the other holds a spike of $500$. We will trace this two-row matrix in Python below to test whether protecting the small row also improves reconstruction of the spike.

```checkpoint
A tensor-core kernel accepts FP8 inputs and accumulates into FP32 registers. Does FP32 accumulation guarantee a correct answer?
---
No. Wider accumulation can reduce additional rounding loss, but it can't recover information already rounded to zero or clipped during input conversion. The declared accumulator type also doesn't specify every internal rounding step.
```

---

## Format taxonomy: range, spacing, and bitfields

A floating-point format name reveals how many exponent and fraction bits it provides. Exponent bits determine dynamic range: the distance between the smallest subnormal and the largest finite number. Fraction bits (the mantissa) determine precision: the spacing between representable numbers within any given binary octave.

| Format | Stored layout | Exponent bias | Largest finite value | Smallest positive normal | Typical GPU role |
|---|---:|---:|---:|---:|---|
| FP32 | 1 sign, 8 exponent, 23 fraction | 127 | about $3.40\times10^{38}$ | about $1.18\times10^{-38}$ | reference math, accumulation, sensitive reductions |
| TF32 | FP32 storage (reads 8 exponent, 10 fraction) | 127 | about $3.40\times10^{38}$ | about $1.18\times10^{-38}$ | faster single-precision matrix math on NVIDIA Tensor Cores |
| BF16 | 1 sign, 8 exponent, 7 fraction | 127 | about $3.39\times10^{38}$ | about $1.18\times10^{-38}$ | broad-range activations, weights, gradients |
| FP16 | 1 sign, 5 exponent, 10 fraction | 15 | 65,504 | about $6.10\times10^{-5}$ | high local precision, narrow dynamic range |
| FP8 E4M3 | 1 sign, 4 exponent, 3 fraction | 7 | 448 | $2^{-6} = 0.015625$ | forward activations and weights |
| FP8 E5M2 | 1 sign, 5 exponent, 2 fraction | 15 | 57,344 | $2^{-14} \approx 6.10\times10^{-5}$ | backward gradients and wide-range tensors |

The Open Compute Project (OCP) OFP8 specification standardizes these FP8 encodings.[^ocp2023ofp8] A common hybrid training recipe uses E4M3 for forward operands and E5M2 for gradients, trading precision for range:[^nvidiaTransformerEngine2026]

- **E4M3's extra fraction bit:** Spacing in $[1,2)$ is 0.125, versus E5M2's 0.25. Relative spacing varies within a binade; 12.5% isn't a constant relative rounding error. E4M3 reaches 448, has no infinities, and reserves `0x7F` and `0xFF` for NaNs.
- **E5M2's wider range:** Its smallest subnormal is $2^{-16}$ and largest finite magnitude is 57,344. This gives more room for a scaled gradient distribution, not immunity to underflow. An unscaled $10^{-7}$ still falls below its representable floor. Format choice and scaling need evidence from the actual tensors.[^micikevicius2022]

Normalization constrains a statistic; learned affine parameters and later operations can still change activation range. For example, before affine parameters or epsilon, LayerNorm applied to one nonzero value among 1,024 entries gives that entry a magnitude of $\sqrt{1023}\approx31.98$.

Narrower than 8 bits, these formats add a shared scale for each small block:

- **OCP Microscaling (MX):** The specified formats use 32-element blocks with an 8-bit E8M0 scale. Elements retain their own narrower encoding: MXFP8 uses E4M3 or E5M2, MXFP6 uses E3M2 (maximum 28) or E2M3 (7.5), and MXFP4 uses E2M1 (6).[^ocp2023mx]
- **NVIDIA NVFP4:** E2M1 elements use an E4M3 scale per 16-element block and an additional FP32 tensor scale. This differs from MXFP4's 32-element E8M0 format. Transformer Engine's training recipe can share one weight scale across a $16\times16$ block; its activation and gradient scales remain one-dimensional. Smaller weight storage doesn't imply the attention KV cache uses the same format.[^nvidia2026nvfp4Recipe]

Grid spacing increases at binade boundaries: E4M3's spacing is 0.125 in $[1,2)$ and 32 from 256 up to its finite ceiling. Actual error also depends on position within the grid and can be zero. Scaling manages range; a power-of-two scale doesn't add fraction bits or improve relative precision for values that stay normal.

<figure>
  <img src="illustrations/_generated/fp8_representable_grids_dark.png" alt="E4M3 and E5M2 bit strips allocate their eight bits to one sign, four or five exponent bits, and three or two fraction bits. On the same one-to-two number line, E4M3 marks are spaced by 0.125 and E5M2 marks by 0.25. A close view around 2 shows the E4M3 step widening from 0.125 below the boundary to 0.25 above it." />
  <figcaption>E4M3 spends one bit on extra fraction precision, so its spacing is 0.125 in [1, 2), compared with E5M2's 0.25. At 2, E4M3 spacing widens to 0.25. The following subnormal view and separate unscaled 500 → 448 conversion show low-end rounding and finite-range clipping; OFP8 rounds before overflow handling and supports mode-specific saturation behavior.</figcaption>
</figure>

---

## Scale ownership and the GEMM dataflow

Where does a scale go during $Y = XW$? If it's constant along the contraction, it can leave the inner sum. If it changes inside a block, it can't. Take activation matrix $X \in \mathbb{R}^{M \times K}$ and weight matrix $W \in \mathbb{R}^{K \times N}$.

Every element is represented by a positive scale factor and a quantized low-precision code:

$$
X_{ik} \approx S_{X, i} \cdot \tilde{X}_{ik}, \qquad W_{kj} \approx S_{W, j} \cdot \tilde{W}_{kj}
$$

Here $\tilde{X}_{ik}$ and $\tilde{W}_{kj}$ are low-precision FP8 or FP4 values, while $S_{X, i}$ and $S_{W, j}$ are higher-precision (FP32 or E8M0) scale factors. Substitute these into the dot product definition for output element $Y_{ij}$:

$$
\hat{Y}_{ij} = \sum_{k=1}^K \left(S_{X, i} \tilde{X}_{ik}\right) \left(S_{W, j} \tilde{W}_{kj}\right)
$$

Because row scale $S_{X, i}$ and column scale $S_{W, j}$ don't depend on the contraction index $k$, both scales factor completely out of the inner sum:

$$
\hat{Y}_{ij} = \left(S_{X, i} \cdot S_{W, j}\right) \sum_{k=1}^K \tilde{X}_{ik} \tilde{W}_{kj}
$$

These are real-arithmetic identities for the **reconstructed operands**, denoted by the hat. Input quantization has already changed the operation, and finite-precision execution does not need to preserve bitwise equality when operations are reordered. For a per-row/per-column FP8 kernel, work can divide into two phases:

1. **Matrix multiply-accumulate:** The inner sum consumes the low-precision operands with the chosen instruction and accumulator mode. An FP32 accumulator describes the stored running sum; instruction-level product and accumulation rounding can use different precision.
2. **Epilogue Dequantization:** Dequantization scale $(S_{X, i} \cdot S_{W, j})$ is applied in the kernel's epilogue stage right before writing the final result back to global memory or piping it into a fused bias and activation function.

<figure>
  <img src="illustrations/_generated/scale_factoring_dataflow_dark.png" alt="A five-stage device flow moves high-precision X and W through producer quantization, packed codes and scales, a selected MMA path with its declared accumulator mode, and an output that applies the X-row and W-column scale product before a BF16 cast. When K-block scale products are 5 and 8, partial sums 2 and 3 produce 10 plus 24, or 34; factoring 5 outside gives 25." />
  <figcaption>The flow connects source values, quantization, packed representations, the selected MMA path, and output reconstruction. The output applies the row and column scale product before casting to BF16. For K-varying groups, 5 × 2 + 8 × 3 = 34; using the first scale for both partials gives 25. This is real arithmetic over reconstructed operands, with finite-precision execution allowed to round differently.</figcaption>
</figure>

That algebra leaves an architecture question: who owns quantization and dequantization?

- **A possible producer fusion:** RMSNorm, an activation, or a preceding epilogue can also generate codes and scales, when its range reduction and output ABI permit that fusion. A separate conversion kernel is another valid choice.
- **A possible consumer fusion:** Applying scales inside GEMM avoids materializing a wider intermediate. Standalone dequantization remains useful for debugging, fallback operators, or an unsupported consumer. An FP32 intermediate contains four bytes per FP8 element, but total traffic and end-to-end performance depend on all reads, writes, scales, and kernels.

If scaling happens block-wise along the contraction axis $K$ (as in 32-element microscaling with block index $b$):

$$
\hat{Y}_{ij} = \sum_{b=1}^{\lceil K/32\rceil} \left(S_{X, i, b} \cdot S_{W, j, b}\right) \sum_{k \in \text{block } b} \tilde{X}_{ik} \tilde{W}_{kj}
$$

The block scale product stays inside the outer sum, with a partial final block zero-padded when required. This equation defines the mathematical result; instruction sequences can differ. OCP leaves internal dot-product precision and operation order implementation-defined; supported block-scaled matrix instructions can consume scale operands directly.[^ocp2023mx][^nvidiaPtxTcgen2026]

---

## Numerical hazards: subnormals, saturation, and rounding

The factored sum is an identity for reconstructed operands. It can't restore a value the encoder already flushed to zero, saturated, or rounded away. Three encoding failures do that before the accumulator ever runs.

### Subnormals and flush-to-zero (FTZ)

Normal floating-point numbers have an implicit leading 1 ($1.f \times 2^{e - \text{bias}}$). Subnormal numbers occur when the exponent bits are all zero; the leading bit drops to 0 ($0.f \times 2^{1 - \text{bias}}$). This lets values shrink toward zero, with fewer significant bits as they get smaller.

In OCP E4M3, the smallest positive normal is $2^{-6} = 0.015625$. Subnormals extend down to $2^{-9} \approx 0.001953125$. Under standard round-to-nearest-even (RNE):

- An input of $0.75 \times 2^{-9}$ rounds up to the smallest subnormal $2^{-9}$.
- An input of $0.5 \times 2^{-9}$ lands on an exact tie and rounds down to signed zero (`+0.0` or `-0.0`).

Flush-to-zero behavior belongs to the specific instruction and mode. As a concrete example, PyTorch documents input/output denormal flushing for MI200 FP16/BF16 matrix operations and alternate FP16 paths used during backward computation. Don't infer a universal one-cycle penalty or model failure from a dtype name. Test the actual kernel's subnormal behavior.[^pytorchNumericalAccuracy2026]

### Saturation cliffs

OFP8 conversion first rounds to the destination precision. If that rounded magnitude exceeds the finite range, non-saturating conversion produces an E4M3 NaN or E5M2 infinity. A raw value just above the largest finite value can instead round back to it; distinguish the pre-cast magnitude from the rounded overflow condition.

Saturating conversion limits overflow to $\pm448$ or $\pm57,344$. CUDA exposes explicit saturation modes, and its FP8 constructors use `__NV_SATFINITE`; framework casts need their own check. OFP8 requires RNE and both saturation modes to be supported, rather than one universal default.[^ocp2023ofp8][^nvidiaCudaMathFp82026]

Saturating E4M3 conversion maps both $500$ and $50,000$ to $448$, losing their relative magnitude. The values remain finite, so NaN-only checks miss the change. Model quality needs a separate evaluation. Backpropagation depends on the implemented estimator: the exact clipping function's flat region has zero derivative, but training often uses a surrogate or straight-through rule.

<figure>
  <img src="illustrations/_generated/fp8_conversion_boundaries_dark.png" alt="The left number line magnifies zero to the smallest E4M3 subnormal d = 2⁻⁹. The RNE midpoint 0.5d maps to signed zero, while 0.75d maps to d. The separate right range maps an unscaled input 500 with S = 1 to the finite E4M3 code 448 and reconstructs 448." />
  <figcaption>OCP E4M3 has smallest subnormal d = 2⁻⁹: 0.75d rounds to d, while the exact 0.5d tie rounds to signed zero under RNE. The separate unscaled, saturating example maps 500 to code 448 and reconstructs 448. OFP8 rounds to destination precision before checking overflow; the selected saturation mode determines overflow behavior.</figcaption>
</figure>

### Rounding: RNE versus stochastic rounding

OFP8 requires support for RNE and permits additional rounding modes. Consider repeated updates to a **stored low-precision weight**, with no wider master value or residual to retain the lost increment.

If $W+\Delta W$ stays within W's nearest-value interval, rounding the **updated weight** returns W. The update isn't necessarily zero as a separately represented number. Neighboring intervals can have different spacing at binade boundaries:

$$
\operatorname{RNE}(W + \Delta W) = W
$$

Repeating the same absorbed increment can leave that stored weight unchanged. The effect depends on update magnitudes and the dtype's spacing around the stored value.

Stochastic rounding breaks this trap by rounding up or down probabilistically based on the distance to the adjacent representable points:

$$
\operatorname{SR}(x) = \begin{cases}
u & \text{with probability } \frac{x-l}{u-l} \\
l & \text{with probability } \frac{u-x}{u-l}
\end{cases}
$$

Here l and u are neighboring **representable floating-point values**; they need not equal the integer floor and ceiling. For finite $l<x<u$ with these probabilities, $\mathbb{E}[\operatorname{SR}(x)]=x$; an exactly representable value stays unchanged. Clipping outside the finite range breaks this unbiasedness. Stochastic rounding can help preserve expected increments; convergence still depends on the optimization recipe, and wider optimizer state may remain useful. Transformer Engine's NVFP4 recipe applies it to gradients, not every tensor.[^nvidia2026nvfp4Recipe]

<figure>
  <img src="illustrations/_generated/stochastic_rounding_neighbors_dark.png" alt="A shared linear number line places 1.01 eight percent of the way between neighboring representable values 1 and 1.125. Round-to-nearest-even chooses 1. A deterministic probability bar assigns 0.92 mass to 1 and 0.08 to 1.125, whose weighted expectation is 1.01. A separate saturation lane shows 500 clipped to 448 beyond the finite neighbor interval." />
  <figcaption>For x = 1.01 between representable values 1 and 1.125, RNE chooses 1. Stochastic rounding gives the upper value probability 0.08 and the lower value probability 0.92, so its exact expectation remains 1.01. The separate clipping lane shows that finite-range saturation has no unbiased neighboring-value pair.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="neighbors_not_integers.py"
from fractions import Fraction

l, u, x = Fraction(1), Fraction(9, 8), Fraction(101, 100)
p_upper = (x - l) / (u - l)
nearest = l if x - l < u - x else u
assert nearest == 1 and p_upper == Fraction(2, 25)
assert p_upper * u + (1 - p_upper) * l == x
clipped = min(Fraction(500), Fraction(448))
assert clipped != 500
print(f"neighbors={float(l):.3f},{float(u):.3f}; RNE={float(nearest):.3f}")
print(f"upper probability={float(p_upper):.3f}; expected rounded value={float(x):.3f}")
print("clipped 500 -> 448: expectation can't equal the original")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
neighbors=1.000,1.125; RNE=1.000
upper probability=0.080; expected rounded value=1.010
clipped 500 -> 448: expectation can't equal the original
```
<!-- leetllm: output:end -->

### Accumulator type isn't the whole arithmetic specification

Prefer an accumulator appropriate for reduction length and input range, and verify the supported instruction. FP16 accumulation is legal for some Tensor Core operations; full FP32 isn't a universal hardware-enforced rule.[^nvidiaPtxIsa2026]

The preceding [GEMM lesson](/learn/gemm-naive-cuda-tensor-cores) shows absorption of a positive 0.25 update at 1024 in FP16 and its preservation in FP32. It also shows why negative updates near that binade threshold need different spacing. Knowing $K=4096$ alone does not determine a partial sum's magnitude or reveal when absorption happens.

Even a declared FP32 accumulator can involve reduced internal precision or intermediate reductions. Inspect the operation's guarantees and framework settings, including FP16/BF16 reduced-precision reduction controls. The ABI must distinguish input, product/internal accumulation, accumulator storage, and output types.[^pytorchNumericalAccuracy2026]

---

## Hands-on: auditing FP8 conversion thresholds

The CPU checks cover subnormal rounding, an explicit finite-input clamp, and byte-level decoding. GPU matrix arithmetic and CUDA's non-saturating conversion mode need separate tests.

The plain cast and explicit clamp agree on these test inputs in the recorded PyTorch build. That observation contradicts a blanket claim that a plain CPU cast must yield NaN at 500. Rerun it on your installed build rather than inferring the overflow mode from the dtype tag.

<!-- leetllm: test, deps=torch==2.15.0, output=show -->
```python title="fp8-conversion-boundaries.py"
import torch

torch.set_num_threads(1)

print("PyTorch release:", torch.__version__.split("+", 1)[0], "device: cpu")
d = 2.0 ** -9
values = torch.tensor([0.5 * d, 0.75 * d, -0.5 * d, 1.0625, 1.1875, 500.0])

# Observe this build's plain CPU cast; don't assume CUDA __NV_NOSAT semantics.
raw = values.to(torch.float8_e4m3fn).float()

# Saturating conversion: clamps finite values to the E4M3 ceiling of 448
saturated = values.clamp(-448.0, 448.0).to(torch.float8_e4m3fn).float()

print("plain cast:", raw.tolist())
print("saturating finite inputs:", saturated.tolist())
print("negative half-step keeps sign:", bool(torch.signbit(raw[2])))

assert raw[:5].tolist() == [0.0, d, -0.0, 1.0, 1.25]
assert saturated[-1] == 448.0
assert torch.isfinite(saturated).all()

# The exact same byte pattern means different values across specs
codes = torch.tensor([0x38, 0x80], dtype=torch.uint8)
print("OCP E4M3 bytes:", codes.view(torch.float8_e4m3fn).float().tolist())
print("FNUZ E4M3 bytes:", codes.view(torch.float8_e4m3fnuz).float().tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
PyTorch release: 2.15.0 device: cpu
plain cast: [0.0, 0.001953125, -0.0, 1.0, 1.25, 448.0]
saturating finite inputs: [0.0, 0.001953125, -0.0, 1.0, 1.25, 448.0]
negative half-step keeps sign: True
OCP E4M3 bytes: [1.0, -0.0]
FNUZ E4M3 bytes: [0.5, nan]
```
<!-- leetllm: output:end -->

Look at the byte decoding at the end: byte `0x38` decodes to `1.0` in OCP E4M3, but becomes `0.5` in AMD's FNUZ E4M3 because their exponent biases differ (7 versus 8). Byte `0x80` represents negative zero in OCP E4M3, but represents NaN in FNUZ because FNUZ drops signed zeros. Feeding an OCP-encoded buffer into a kernel expecting FNUZ silently alters standard numeric values throughout your model.[^pytorchTensorAttributes2026][^amdRocmPrecision2026]

<figure>
  <img src="illustrations/_generated/fp8_decoder_abi_dark.png" alt="The same raw bytes enter two E4M3 decoder conventions. The byte 0x38 has sign 0, exponent bits 0111, and fraction bits 000; bias 7 decodes it as 1.0 while bias 8 decodes it as 0.5. The byte 0x80 has sign 1, exponent 0000, and fraction 000; OCP decodes negative zero while FNUZ reserves that byte for NaN." />
  <figcaption>The serialized bytes stay unchanged across the two examples. Their sign, exponent, and fraction fields receive different interpretations under the OCP and FNUZ ABI conventions: 0x38 is 1.0 or 0.5, and 0x80 is negative zero or NaN.</figcaption>
</figure>

### Worked failure: stale delayed scale

Suppose delayed scaling calculates an E4M3 scale factor from a previous iteration's maximum absolute value ($\text{amax} = 10.0$):

$$
S_{\text{old}} = \frac{10.0}{448} \approx 0.02232
$$

In the current iteration, an activation outlier spikes to $500.0$. The scaled magnitude is:

$$
\frac{500.0}{S_{\text{old}}} = \frac{500.0}{10.0 / 448} = 22,400.0
$$

Under saturating conversion, $22,400.0$ clamps directly to the format maximum of $448$. During consumer dequantization, reconstruction returns:

$$
\hat{x} = 448 \cdot S_{\text{old}} = 448 \cdot \frac{10.0}{448} = 10.0
$$

The reconstructed value is finite, positive, and shows no NaN errors, but its relative error is $98\%$. The FP32 accumulator faithfully adds the corrupted product into the running sum, masking the numerical collapse from monitoring systems.

---

## Scaling architectures: granularity and delayed scaling

The granularity of your scale factor sets which values compete for the same dynamic range exponent.

| Granularity | Scale count for $X \in \mathbb{R}^{M \times K}$ | Advantages | Vulnerabilities |
|---|---:|---|---|
| Tensor-wide FP32 scale | 1 | four scale bytes before recipe/history overhead | one outlier can reduce resolution elsewhere |
| Row-wise FP32 scale | $M$ | one scale for each activation row | kernel must support that scale axis and layout |
| Column-wise FP32 scale | $K$ | one scale for each column of this X | scale axis must follow the operand interpretation |
| MX-style 32-element blocks | $M\lceil K/32\rceil$ | localizes range with one E8M0 byte per block | tails, scale layout, and alignment depend on the consumer |

### One letter, two reciprocal conventions

This chapter uses **S for reconstruction**: $\hat{x}=S q$ and $q=Q(x/S)$. Many APIs call the reciprocal $\alpha=1/S$ the “scale”: $q=Q(\alpha x)$, followed by $\hat{x}=q/\alpha$. Read the formula before interpreting a field named `scale` or `scale_inv`.

For finite amax > 0 and an ideal unrounded E4M3 reconstruction scale, $S=\text{amax}/448$, whereas $\alpha=448/\text{amax}$. A zero-only group needs an explicit positive-scale policy, such as S=1; division by amax isn't valid there.

### Current scaling: where the reduction happens

Current scaling derives a scale from the tensor being encoded:

$$
S = \frac{\text{amax}}{\text{fp8\_max}}, \qquad \alpha=\frac{\text{fp8\_max}}{\text{amax}}
$$

Copying a device amax to the host for a dependent decision adds transfer and synchronization costs. Their duration depends on the system and path; measure it on the target device instead of assuming a fixed 10–50 microsecond penalty per layer. A device reduction and dependent cast can stay ordered on the device.

Transformer Engine 2.20.2's current-scaling documentation describes two tensor reads **during quantization**: one for amax and one for scaling/casting. GEMM subsequently consumes the encoded tensor. Producer fusion can change that cost, but only if the reduction and layout dependencies permit it.[^nvidia2026fp8CurrentScaling]

### Delayed scaling in Transformer Engine

Delayed scaling uses prior amax observations to choose the current scale. With a maximum-over-history rule, no margin, and positive history amax:[^nvidia2026fp8DelayedScaling]

$$
S_t = \frac{\max_{i \in [1,H]}\text{amax}_{t-i}}{\text{fp8\_max}}, \qquad \alpha_t=1/S_t
$$

The quantization pass also records the current amax for future scale updates. Compared with its current-scaling recipe, Transformer Engine describes one tensor read rather than two. This doesn't eliminate all kernels or reductions: distributed recipes may still reduce amax across ranks, and history/scale updates have their own ordering.

The risk is scale lag. If an activation spike hits after a distribution shift, the historical scale is too small, causing massive saturation clipping. If the historical maximum was an unusual outlier, the scale remains too large, pushing typical activations down toward the subnormal floor.

<figure>
  <img src="illustrations/_generated/scaling_device_timeline_dark.png" alt="Two schematic device sequences compare current and delayed scaling. Current scaling reads tensor values for amax, computes the scale, reads values again to cast and write codes, then GEMM reads those codes. Delayed scaling selects the current scale as max of the previous three amax values divided by 448, then casts and writes codes in one tensor pass while recording the current amax for the next history window. The selected history scale feeds the current cast. Spacing is schematic, with no duration claim." />
  <figcaption>Transformer Engine's current-scaling description uses two tensor reads during quantization: one for amax and one for scaling and casting. Its delayed-scaling description selects S_t as the maximum of the previous three amax values divided by 448, then uses that scale for today’s cast while recording the current amax for the next history window. It uses one tensor read; the lanes show dependencies rather than elapsed time.</figcaption>
</figure>

### Online scaling isn't automatically fused into TMA

DeepSeek-V3's report measures amax online for $1\times128$ activation groups and $128\times128$ weight blocks. It reports promoting partial FP8 GEMM results to CUDA-core FP32 accumulation every 128 contraction elements to address its observed H800 internal-precision limitation.[^deepseekv3_2024]

The report explicitly describes separate BF16 reads, quantization, FP8 writes, and subsequent MMA reads. Fusing FP8 casting with TMA is its proposed future optimization, not the implemented mechanism. The pinned DeepGEMM README likewise tells callers to handle FP8 casting and transposition separately or fuse them into preceding kernels. Online scales reduce history lag, but don't prove no clipping, no conversion pass, or no synchronization.[^deepseekv3_2024][^deepgemmPinned2026]

<!-- leetllm: test, output=show, id=fp8-scale-rules -->
```python title="which_scale.py"
fp8_limit, old_amax, spike = 448.0, 10.0, 500.0
S, alpha = old_amax / fp8_limit, fp8_limit / old_amax
assert old_amax / S == old_amax * alpha == fp8_limit
reconstructed = min(spike / S, fp8_limit) * S
error_percent = 100 * abs(reconstructed - spike) / spike
partials, scale_products = [2.0, 3.0], [5.0, 8.0]
scaled_sum = sum(p * s for p, s in zip(partials, scale_products))
wrong_sum = scale_products[0] * sum(partials)
assert (reconstructed, error_percent, scaled_sum, wrong_sum) == (10.0, 98.0, 34.0, 25.0)
print(f"S={S:.8f}, alpha={alpha:.1f}; peak code={old_amax / S:.1f}")
print(f"stale reconstruction: {spike:.1f} -> {reconstructed:.1f} ({error_percent:.1f}% error)")
print(f"block-scale sum={scaled_sum:.1f}, incorrectly pulled-out scale={wrong_sum:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
S=0.02232143, alpha=44.8; peak code=448.0
stale reconstruction: 500.0 -> 10.0 (98.0% error)
block-scale sum=34.0, incorrectly pulled-out scale=25.0
```
<!-- leetllm: output:end -->

## Microscaling: the two-row experiment

An E8M0 scale byte c from 0 through 254 represents $2^{c-127}$; 255 is NaN. It has no zero, sign, or infinity encoding. A power-of-two scale can be applied through exponent adjustment in real arithmetic, but that does not determine a chip's exact datapath or instruction cost.[^ocp2023mx]

A 32-value block holds 256 bits of element data plus 8 bits of shared scale, giving an effective payload of:

$$
\frac{256 + 8}{32} = 8.25 \text{ bits per element}
$$

<!-- leetllm: test, output=show, continue=fp8-scale-rules -->
```python title="count_the_scale_bytes.py"
import math


def decode_e8m0(code):
    if not 0 <= code <= 255:
        raise ValueError("an unsigned scale byte is required")
    return math.nan if code == 255 else 2.0 ** (code - 127)


scale_codes = [-8 + 127, 1 + 127]
assert [decode_e8m0(c) for c in scale_codes] == [2.0 ** -8, 2.0]
assert decode_e8m0(0) > 0 and math.isnan(decode_e8m0(255))
assert (64 + 4, 64 + 2) == (68, 66)
print(f"E8M0 scale bytes: {[hex(c) for c in scale_codes]}; 0x00 is positive; 0xff is NaN")
print("packed X payload: tensor=68 B, MX=66 B; scale overhead=6.25%/3.125%")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
E8M0 scale bytes: ['0x77', '0x80']; 0x00 is positive; 0xff is NaN
packed X payload: tensor=68 B, MX=66 B; scale overhead=6.25%/3.125%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/scale_payload_bytes_dark.png" alt="For the same 64-element FP8 activation X, 64 code bytes plus one four-byte tensor scale total 68 bytes. Two 32-element MX groups use 64 code bytes plus two one-byte E8M0 scales, totaling 66 bytes. The scale-byte inset draws each metadata byte three times wider than each code-byte cell. E8M0 examples map 0x77 to 2 to the minus 8, 0x80 to 2, 0x00 to a positive scale, and 0xff to NaN. The MX payload is 8.25 bits per value, with scale bytes equal to 3.125 percent of the 64 code bytes." />
  <figcaption>For X alone, the tensor-scaled count is 64 FP8 code bytes plus four scale bytes; the two-group MX count is 64 plus two. Scale-byte cells appear in a separate 3× magnified inset; byte counts are 68 and 66, and the MX representation uses 8.25 bits per value. The scale bytes are 3.125% of the code-byte count. Excludes W, padding, history, allocations, and duplicate orientations; the CPU script does not pack E8M0.</figcaption>
</figure>

These packed-payload counts exclude W, container padding, duplicated orientations, history, and runtime allocations. A tensor's four scale bytes aren't zero overhead. NVFP4 similarly has block and tensor scales; four-bit elements don't promise a 50% reduction in total storage.

Test the two-row matrix on CPU. We model conservative power-of-two reconstruction scales by rounding amax/448 upward, as described in Transformer Engine's current MXFP8 guide. OCP also describes another scale-selection algorithm; identical format names don't guarantee identical quantization recipes.[^nvidia2026mxfp8][^ocp2023mx]

The script stores scales as FP32 tensors, reconstructs values to FP32, and uses CPU FP32 matrix multiplication. It doesn't pack E8M0 scale bytes, implement a GPU scale swizzle, or execute MXFP8 hardware. In particular, two rows don't satisfy Transformer Engine's documented multiple-of-32 constraint for the nonfinal dimensions.

Run this comparison to trace what happens to $0.001$ when it shares one global scale with $500.0$, versus when each row gets its own 32-element block scale:

<!-- leetllm: test, deps=torch==2.15.0, output=show, id=fp8-granularity -->
```python title="fp8-scale-granularity.py"
import math
import torch

torch.set_num_threads(1)
torch.set_printoptions(precision=6, sci_mode=False)

pattern_small = [0.001, 0.03, 0.117, 0.5, 1.0, -0.25, 0.0625, -0.015625]
pattern_large = [4.0, 16.0, 64.0, 500.0, -2.0, -8.0, -32.0, -250.0]
weight_pattern = [0.5, -0.25, 0.125, -0.0625, 0.03125, -0.5, 0.25, -0.125]

x = torch.tensor([pattern_small * 4, pattern_large * 4], dtype=torch.float32)
w = torch.tensor(weight_pattern * 4, dtype=torch.float32).reshape(32, 1)
fp8_max = torch.finfo(torch.float8_e4m3fn).max

def roundtrip(values: torch.Tensor, scale: torch.Tensor) -> torch.Tensor:
    if not torch.isfinite(values).all() or not torch.isfinite(scale).all() or (scale <= 0).any():
        raise ValueError("finite values and positive finite scales required")
    scaled = values / scale
    return scaled.clamp(-fp8_max, fp8_max).to(torch.float8_e4m3fn).float() * scale

# 1. Tensor-wide scaling: single scale derived from global maximum
tensor_scale_x = x.abs().max() / fp8_max
tensor_scale_w = w.abs().max() / fp8_max
x_tensor = roundtrip(x, tensor_scale_x)
w_tensor = roundtrip(w, tensor_scale_w)

# 2. Block-level scaling: conservative power-of-two scale per 32-value row
def conservative_power_of_two_scale(block: torch.Tensor) -> float:
    ratio = block.abs().max().item() / fp8_max
    if ratio == 0:
        return 1.0
    exponent = max(-127, math.ceil(math.log2(ratio)))
    return 2.0 ** exponent

mx_scales_x = torch.tensor(
    [conservative_power_of_two_scale(row) for row in x], dtype=torch.float32
).reshape(2, 1)
mx_scale_w = torch.tensor(conservative_power_of_two_scale(w), dtype=torch.float32)

x_mx = roundtrip(x, mx_scales_x)
w_mx = roundtrip(w, mx_scale_w)

reference_y = (x @ w).squeeze()
tensor_y = (x_tensor @ w_tensor).squeeze()
mx_y = (x_mx @ w_mx).squeeze()

print(f"tensor_scale_x={tensor_scale_x.item():.6f}")
print(f"mxfp8_scales_x={mx_scales_x.squeeze().tolist()}")
print(f"x[0,0]: ref={x[0, 0].item():.8f} tensor_fp8={x_tensor[0, 0].item():.8f} mxfp8={x_mx[0, 0].item():.8f}")
print(f"x[1,3]: ref={x[1, 3].item():.8f} tensor_fp8={x_tensor[1, 3].item():.8f} mxfp8={x_mx[1, 3].item():.8f}")
print(f"reference_y=[{reference_y[0]:.6f}, {reference_y[1]:.6f}]")
print(f"tensor_fp8_y=[{tensor_y[0]:.6f}, {tensor_y[1]:.6f}]")
print(f"mxfp8_y=[{mx_y[0]:.6f}, {mx_y[1]:.6f}]")
print(f"tensor_abs_error={(tensor_y - reference_y).abs().tolist()}")
print(f"mxfp8_abs_error={(mx_y - reference_y).abs().tolist()}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tensor_scale_x=1.116071
mxfp8_scales_x=[0.00390625, 2.0]
x[0,0]: ref=0.00100000 tensor_fp8=0.00000000 mxfp8=0.00097656
x[1,3]: ref=500.00000000 tensor_fp8=500.00000000 mxfp8=512.00000000
reference_y=[0.600812, 7.750000]
tensor_fp8_y=[0.583104, 7.568359]
mxfp8_y=[0.601562, 7.750000]
tensor_abs_error=[0.017708778381347656, 0.181640625]
mxfp8_abs_error=[0.0007500052452087402, 0.0]
```
<!-- leetllm: output:end -->

Follow the numbers closely:

1. **Tensor-wide scale ($S = 1.116071$):** The smallest nonzero reconstructed E4M3 step is about 0.00218. Our 0.001 falls below half that step and rounds to zero. The row's dot-product error is about 3% in this example, reflecting quantization of both X and W rather than this single small activation alone.
2. **Under block-level scaling ($S_0 = 2^{-8} = 0.00390625$):** The first block's scale shifts the dynamic range downward. Its smallest subnormal step becomes $2^{-8} \times 2^{-9} = 2^{-17} \approx 7.63\times10^{-6}$. The small value $0.001$ survives accurately as $0.00097656$ (just $2.3\%$ relative error).
3. **Large row scale ($S_1=2$):** The spike reconstructs as 512, a 2.4% error, although the row's dot product happens to equal its reference. Local scaling protects the other row; it doesn't make every value or result more accurate. Try changing W to observe how cancellation affects that dot product.

<figure>
  <img src="illustrations/_generated/scale_ownership_dark.png" alt="Two side-by-side layouts show one scale shared by both 32-value rows and one scale owned by each row. Separate original-value zooms plot the exact reconstructions: 0.001 becomes 0 with the shared tensor scale and 0.00097656 with the row scale; 500 stays 500 with the tensor scale and becomes 512 with the second row scale." />
  <figcaption>The upper arrays show one scale covering both rows or separate scales for each 32-value row. In distinct original-value zooms, 0.001 reconstructs as 0 or 0.00097656; 500 reconstructs as 500 or 512.</figcaption>
</figure>

The large row's dot product happens to match despite a 2.4% spike error, so this projection masks an operand error. Keep the encoded activations unchanged and replace W with a column that selects only the spike:

<!-- leetllm: test, output=show, continue=fp8-granularity -->
```python title="cancellation_hides_operand_error.py"
selector = torch.zeros_like(w)
selector[3, 0] = 1.0
selected_reference = (x @ selector).squeeze()
selected_mx = (x_mx @ selector).squeeze()

assert mx_y[1] == reference_y[1] == 7.75
assert selected_reference.tolist() == [0.5, 500.0]
assert selected_mx.tolist() == [0.5, 512.0]
print(f"original projection: reference={reference_y[1]:.2f}, MX={mx_y[1]:.2f}")
print(f"spike-only projection: reference={selected_reference[1]:.1f}, MX={selected_mx[1]:.1f}")
print(f"spike-only absolute error={abs(selected_mx[1] - selected_reference[1]):.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
original projection: reference=7.75, MX=7.75
spike-only projection: reference=500.0, MX=512.0
spike-only absolute error=12.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/cancellation_exposes_operand_error_dark.png" alt="The 32-value activation row repeats an eight-value pattern four times; highlighted spikes at indices 3, 11, 19, and 27 reconstruct from 500 to 512. Grouped positive and negative real-arithmetic sums meet at 7.75: 181 plus negative 173.25 for FP32 values, and 184 plus negative 176.25 for reconstructed operands. A full 32-entry one-hot W selector has only w3 set to 1; at index 3 it exposes 500 versus 512, an absolute error of 12." />
  <figcaption>The grouped positive and negative terms meet at 7.75 in real arithmetic: 181 + (−173.25) for the reference and 184 + (−176.25) for reconstructed operands. A finite-precision reduction can round differently when its operation order or instruction changes. Keeping the reconstructed activation row and replacing only W with the full 32-entry, index-3 one-hot selector exposes 500 versus 512, a 12-unit difference.</figcaption>
</figure>

Cancellation in the original dot product hid the reconstruction error. A different consumer exposes it without any new quantization. Validate reconstructed operands and representative downstream computations, because one matching output does not guarantee accuracy across other inputs.

For a fixed logical matrix, changing from rowwise 1-by-32 groups to columnwise 32-by-1 groups changes scale membership. Transposing element bytes doesn't generally create the second quantization. Transformer Engine derives both orientations from the original wider data to avoid another quantization loss. Special equal-scale cases can agree, and transposing a representation while carrying its original group meaning isn't the same as regrouping it for a different contraction.[^nvidia2026mxfp8]

---

<figure>
  <img src="illustrations/_generated/scale_orientation_groups_dark.png" alt="One logical 32 by 32 high-precision matrix can be quantized with horizontal 1 by 32 groups or vertical 32 by 1 groups. The highlighted horizontal group contains all 32 values of row i; the highlighted vertical group contains all 32 values of column j. Transposing encoded bytes carries their existing group ownership, so derive the columnwise representation from the original wider matrix." />
  <figcaption>For the same logical matrix, rowwise groups collect 32 values across each row, while columnwise groups collect 32 values down each column. Quantize each orientation from the original wider values. Transposing stored codes carries their existing scale ownership into the new layout.</figcaption>
</figure>

## Hardware support and kernel ABI requirements

A format name isn't a kernel. The same E4M3 codes can be legal on one GPU and unsupported, or differently biased, on another. Tie each claim to the microarchitecture, compute capability, and toolkit you will actually launch.

| Platform | Documented support status | Requirement to verify |
|---|---|---|
| NVIDIA TF32 | Supported Ampere and later matrix paths | PyTorch matmul's legacy flag defaults false since 1.12; cuDNN convolution has a separate default. Use current `fp32_precision` controls |
| Transformer Engine FP8 | Ada/Hopper and supported later devices | Choose a documented recipe/operator and check exact GPU, toolkit, layout, and shape eligibility |
| Transformer Engine MXFP8/NVFP4 training | Guides list SM 10.0 and 10.3 | Check training versus inference: the NVFP4 guide separately lists inference on SM 10.0+ |
| AMD FP8 | CDNA3 FNUZ; CDNA4 and supported RDNA4 OCP matrix paths | Check architecture/type support and library tables for a matching fast GPU operation |

This table reflects documentation inspected on October 10, 2026, including ROCm's versioned 10.0.0 architecture table. In PyTorch 2.14, use `torch.backends.cuda.matmul.fp32_precision = "tf32"` or `"ieee"` to permit TF32 or request IEEE precision. Don't mix these controls with legacy `allow_tf32` settings.[^pytorchNumericalAccuracy2026][^nvidia2026mxfp8][^nvidia2026nvfp4Recipe][^amdRocmPrecision2026]

Before launching a low-precision kernel in production, write out its complete numeric specification:

```text title="fp8-production-spec.txt"
kernel_spec = {
  operation: GEMM_Y_equals_XW,
  operand_x: { dtype: OCP_E4M3, layout: row_major, scale_granularity: per_token_1x32, scale_dtype: E8M0 },
  operand_w: { dtype: OCP_E4M3, layout: col_major_packed, scale_granularity: per_channel_32x1, scale_dtype: E8M0 },
  accumulator: FP32,
  scale_application: { location: inside_block_scaled_contraction, varies_along_K: true },
  epilogue: { bias: FP32, activation: SiLU, output_dtype: BF16 },
  rounding_mode: round_nearest_even,
  overflow_policy: saturate,
  alignment_and_scale_layout: record_requirements_of_the_selected_kernel,
  internal_accumulation: record_instruction_guarantees_and_framework_reduction_modes
}
```

Treat framework, compiler, and kernel handoffs as strict serialization interfaces. Passing dtype tags, scales, orientation, padding, and accumulator modes together prevents silent numerical drift.

---

## Troubleshooting numerical failures

When low-precision outputs diverge from an FP32 reference run, use this diagnostic roadmap:

| Observed symptom | Likely root cause | Diagnostic inspection | Targeted fix |
|---|---|---|---|
| Many FP8 codes equal $\pm448$ | Possible clipping or legitimate near-limit rounding | Compare pre-cast scaled magnitudes and clip counts to confirm clipping | Retune scales if lost magnitude is confirmed |
| Entire row contains exact zeros | Conversion loss, legitimate zeros, or another fault | Compare before/after zero rates and group scales | Change granularity if shared range caused the loss |
| NaNs appear only in non-saturating mode | Unhandled overflow | Run side-by-side with explicit `.clamp(-448, 448)` | Verify whether caller expects OCP non-saturating NaN or saturating clamp |
| Error grows with contraction length | Possible quantization or accumulation loss | Compare original-input and rounded-input references; inspect internal reduction mode | Match the actual failure to a supported precision setting |
| Numerical collapse when porting to AMD | OCP vs FNUZ ABI mismatch | Print bitwise hex representation of byte `0x38` | Explicitly transcode bytes between OCP and FNUZ biases |
| Output turns to noise after tensor transpose | Scale orientation mismatch | Compare dot products against fresh column-wise quantization | Quantize row-major and column-major representations independently |

A reliable incident trace must capture input histograms, amax per scale group, selected scale factors, clip counts, zero counts, accumulator modes, and the profiler-confirmed kernel symbol. Checking only the final output relative error hides which stage introduced the mismatch.

Try three changes to the two-row matrix: make the small row all zeros, move 500 into its first 32-value group, and replace W with a column selecting only the spike. Trace which values lose precision in each case and whether the projection output reveals that loss. Keep the code/scale bytes and reconstruction formula together, because an accurate dot product can hide inaccurate operands through cancellation.

Trace a silent 500-to-10 change to a stale scale, a saturated code, or a dot product that cancelled the error. A matching output still has to agree with the scale, the overflow rule, and the instruction that consumed the codes.

```mastery-quiz
[
  {
    "question": "A saturating OCP E4M3 conversion uses reconstruction scale S=7/448 from a previous maximum. The current finite activation is 700. What reconstructed operand and relative magnitude error reach the next consumer?",
    "options": [
      "448; 36% error.",
      "7; 99% error.",
      "700; 0% error.",
      "7; 1% error."
    ],
    "answer": "7; 99% error.",
    "explanation": "The scaled value is 700/(7/448)=44,800. Saturation returns code-value 448, then reconstruction 448×7/448=7. Relative loss is(700-7)/700=99%. FP32 accumulation cannot recover the missing magnitude, and the reconstructed operand remains finite."
  },
  {
    "question": "Let d=2^-9 be OCP E4M3’s smallest positive subnormal. Under round-to-nearest-even with preserved signed zero, what do positive 0.25d and positive 1.5d become?",
    "options": [
      "0 and d.",
      "d and 2d.",
      "0 and 1.5d.",
      "0 and 2d."
    ],
    "answer": "0 and 2d.",
    "explanation": "A quarter of the first step is nearest zero. At 1.5d the neighboring codes are 1 and 2; the even low code bit selects 2d. The second input is a tie between representable subnormals, not itself an exactly representable value."
  },
  {
    "question": "A finite input 1.09375 lies between representable neighbors 1 and 1.125. Proper stochastic rounding uses only those two outcomes, without clipping. Which upper-neighbor probability and expected rounded value follow?",
    "options": [
      "0.75; 1.09375.",
      "0.25; 1.03125.",
      "0.09375; 1.01171875.",
      "0.75; 1.12500."
    ],
    "answer": "0.75; 1.09375.",
    "explanation": "The input is 0.09375 into a gap of 0.125, so upper probability is 0.75. Expectation 0.25×1+0.75×1.125=1.09375. Using the raw fractional part ignores the floating neighbor gap; equating expectation with the upper outcome discards the lower branch."
  },
  {
    "question": "For normal OCP E4M3 numbers, compare the adjacent spacing just below 4, in[2,4), with the spacing just above 4, in[4,8). Which ordered pair is correct?",
    "options": [
      "0.125 below; 0.25 above.",
      "0.5 below; 0.25 above.",
      "0.25 below; 0.5 above.",
      "0.25 below; 0.25 above."
    ],
    "answer": "0.25 below; 0.5 above.",
    "explanation": "Three fraction bits give eight subdivisions in each normal binade. In[2,4), spacing is 2/8=0.25. In[4,8), it is 4/8=0.5. Crossing the exponent boundary doubles absolute spacing; relative rounding error still depends on position within the grid."
  },
  {
    "question": "Two contraction blocks have coded partial dots -3 and 4, with positive reconstruction-scale products 2 and 5 respectively. In real arithmetic over reconstructed operands, what is the correctly scaled total and the result of wrongly pulling scale product 2 outside both blocks?",
    "options": [
      "14 correct; 14 with the outer scale.",
      "14 correct; 2 with the outer scale.",
      "2 correct; 14 with the outer scale.",
      "-26 correct; 2 with the outer scale."
    ],
    "answer": "14 correct; 2 with the outer scale.",
    "explanation": "Each partial retains its own scale:2×(-3)+5×4=14. Applying 2 to the combined coded sum gives 2×(-3+4)=2. The scale varies along the contraction blocks and cannot be factored outside their outer sum. These real-arithmetic results do not assert bitwise equivalence for a hardware reduction order."
  },
  {
    "question": "A declared payload layout stores five logical rows of 33 FP8 values. Each row is physically padded to two full 32-value blocks, and each block stores one E8M0 byte. Exclude other tensors and allocator alignment. What is the total stored operand payload?",
    "options": [
      "175 bytes.",
      "320 bytes.",
      "660 bytes.",
      "330 bytes."
    ],
    "answer": "330 bytes.",
    "explanation": "Five rows × two blocks ×32 code bytes=320. Ten blocks add ten scale bytes, totaling 330. Counting only logical values gives 175 and omits padding; counting 320 omits scales. This payload layout is a storage calculation, not proof of a supported GPU training shape."
  },
  {
    "question": "A wide reference gives 10 for a dot product with the original operands and 8 with the reconstructed FP8 operands. The kernel returns 8 for the same FP8 inputs. What are the signed changes in the output when you first replace the operands and then run the kernel?",
    "options": [
      "0 from the operands, −2 from the kernel.",
      "−2 from the operands, −2 from the kernel.",
      "−2 from the operands, 0 from the kernel.",
      "0 from the operands, 0 from the kernel."
    ],
    "answer": "−2 from the operands, 0 from the kernel.",
    "explanation": "Changing the operands moves the reference output by 8 − 10 = −2. Running the kernel changes it by a further 8 − 8 = 0. Assigning the drop to the kernel uses the original 10 as its baseline. Counting the drop at both steps charges the same loss twice. Reporting zero at both steps overlooks the change between the two reference outputs."
  },
  {
    "question": "A matrix cell holds 1/256 before quantization. Its row scale is 8 and its column scale is 1/512. Both encoders divide by their scale and round to the nearest OCP E4M3 value. The smallest positive E4M3 value is 1/512. For a fresh columnwise encoding of the matrix, which input should the column encoder read and what FP8 code value should it store for this cell?",
    "options": [
      "Read the wider matrix and store 0.",
      "Read the decoded rowwise copy and store 2.",
      "Read the decoded rowwise copy and store 0.",
      "Read the wider matrix and store 2."
    ],
    "answer": "Read the wider matrix and store 2.",
    "explanation": "The wider value divided by the column scale gives (1/256) ÷ (1/512) = 2, which E4M3 stores exactly. Using the row scale on the wider value gives 1/2048, closer to zero than to 1/512. That explains the zero in the rowwise copy. Encoding that copy with the column scale still gives zero. Getting 2 from the copy would require the value that rowwise rounding discarded."
  },
  {
    "question": "An OCP E4M3 producer stores byte 0x40 for value 2. A FNUZ E4M3 consumer interprets that unchanged byte, then multiplies by 3. What result follows, and which FNUZ byte explicitly preserves the producer’s value before multiplication?",
    "options": [
      "Result 6; transcode to 0x40.",
      "Result 3; transcode to 0x40.",
      "Result 6; transcode to 0x48.",
      "Result 3; transcode to 0x48."
    ],
    "answer": "Result 3; transcode to 0x48.",
    "explanation": "The same 0x40 decodes as 2 under OCP bias 7 and 1 under FNUZ bias 8. The unchanged-byte product is 3. FNUZ 0x48 represents 2, restoring the intended product 6. The encoding name and byte width alone do not preserve values across these biases."
  },
  {
    "question": "Compare 64 values in two explicitly one-dimensional FP4 activation payloads without padding. NVFP4 uses one E4M3 scale per 16 values plus one FP32 tensor scale. MXFP4 uses one E8M0 scale per 32 values. What are their total payloads, NVFP4 first?",
    "options": [
      "36 bytes; 34 bytes.",
      "40 bytes; 34 bytes.",
      "40 bytes; 32 bytes.",
      "72 bytes; 66 bytes."
    ],
    "answer": "40 bytes; 34 bytes.",
    "explanation": "Both element arrays use 32 bytes. NVFP4 adds four block-scale bytes and four tensor-scale bytes, totaling 40. MXFP4 adds two block-scale bytes, totaling 34. The result excludes alignment, history and alternate orientations and is not a runtime or quality prediction."
  }
]
```

> **Next:** Continue to [GPU Runtime Execution Lab](/learn/gpu-runtime-execution-lab). Low-precision kernels still depend on launch order, stream ownership, and synchronization. Next measure those runtime costs, remove avoidable host gaps, and prove replay remains correct.
