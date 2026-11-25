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
  "section": "GPU Systems & LLM Inference",
  "order": 18
}
---

Feed the number `500` through a scaled FP8 conversion and it can come back as `10`, with zero exceptions, zero infinities, and zero `NaN` flags. An older batch's scale factor (`10 / 448`) left `500` far above the E4M3 ceiling of `448`, so saturating conversion quietly clamped it to `448` and reconstructed `448 × (10 / 448) = 10` (a **98% error**). Even an FP32 accumulator downstream happily multiplies and sums that corrupted `10` without ever knowing `490` vanished.

<figure>
  <img src="illustrations/_generated/stale_scale_cliff_dark.png" alt="A prior amax of 10 sets S_old to 10 divided by 448. Current x=500 becomes scaled input 22,400, clips to finite E4M3 code 448, then reconstructs to 10. The original-value number line maps 0 to 500 and shows x-hat=10 beside x=500, a 490-unit or 98% relative loss; the FP32 accumulator receives 10 times the weight." />
  <figcaption>Stale delayed scaling turns 500 into 10: scaled to 22,400, saturated to E4M3 max 448, and reconstructed to 10 with no NaN flag.</figcaption>
</figure>

Low-precision <span data-glossary="gpu">GPU</span> programming is therefore about four explicit choices, never just flipping a `dtype`: **encoding** (bitfields and special values), **scaling architecture** (what shares a scale and when it is measured), **arithmetic and accumulation** (input vs. product vs. accumulator precision), and **kernel ABI** (layouts, alignment, and vendor conventions).

```checkpoint
A tensor-core kernel accepts FP8 inputs and accumulates into FP32 registers. Does FP32 accumulation guarantee a correct answer?
---
No. Wider accumulation reduces rounding error during the dot product, but it cannot recover information already flushed to zero or clipped during FP8 input conversion.
```

## Format taxonomy: range, spacing, and bitfields

Exponent bits control **dynamic range**; fraction (mantissa) bits control **spacing** inside each binary octave (binade):

| Format | Bits (S / E / M) | Bias | Max finite | Smallest normal | Typical GPU role |
|---|---:|---:|---:|---:|---|
| **FP32** | 1 / 8 / 23 | 127 | $3.40 \times 10^{38}$ | $1.18 \times 10^{-38}$ | Reference math, accumulation |
| **TF32** | FP32 storage (8E / 10M read) | 127 | $3.40 \times 10^{38}$ | $1.18 \times 10^{-38}$ | Fast FP32 Tensor Core matmuls (no storage savings) |
| **BF16** | 1 / 8 / 7 | 127 | $3.39 \times 10^{38}$ | $1.18 \times 10^{-38}$ | Wide-range activations, weights, gradients |
| **FP16** | 1 / 5 / 10 | 15 | 65,504 | $6.10 \times 10^{-5}$ | Higher precision, narrow range |
| **FP8 E4M3** | 1 / 4 / 3 | 7 | **448** | $2^{-6} = 0.015625$ | Forward activations and weights |
| **FP8 E5M2** | 1 / 5 / 2 | 15 | **57,344** | $2^{-14} \approx 6.1 \times 10^{-5}$ | Backward gradients and wide-range tensors |

The OCP OFP8 specification[^ocp2023ofp8] pairs **E4M3** forward (spacing `0.125` in $[1, 2)$, no infinities, `0x7F`/`0xFF` reserved for NaN) with **E5M2** backward (wider range up to `57,344`, spacing `0.25` in $[1, 2)$).[^nvidiaTransformerEngine2026][^micikevicius2022] Below 8 bits, block-scaled formats attach a tiny shared scale to small element groups:

- **OCP Microscaling (MX):** 32-element blocks sharing one 8-bit **E8M0** power-of-two scale ($2^{c-127}$ for $c \in [0, 254]$, `255` = NaN): MXFP8 (`8.25 bits/elem`), MXFP6, and MXFP4 (E2M1, max `6`).[^ocp2023mx]
- **NVIDIA NVFP4:** E2M1 elements with an E4M3 scale per 16-element block plus an FP32 tensor scale (`40 bytes` for 64 values vs. `34 bytes` for MXFP4).[^nvidia2026nvfp4Recipe]

<figure>
  <img src="illustrations/_generated/fp8_representable_grids_dark.png" alt="E4M3 and E5M2 bit strips allocate their eight bits to one sign, four or five exponent bits, and three or two fraction bits. On the same one-to-two number line, E4M3 marks are spaced by 0.125 and E5M2 marks by 0.25. A close view around 2 shows the E4M3 step widening from 0.125 below the boundary to 0.25 above it." />
  <figcaption>E4M3 trades one exponent bit for finer spacing (0.125 vs. E5M2's 0.25 in [1, 2)), and spacing doubles at every power-of-two binade boundary.</figcaption>
</figure>

## Scale ownership and the GEMM dataflow

In $Y = XW$ ($X \in \mathbb{R}^{M \times K}$, $W \in \mathbb{R}^{K \times N}$), where can scales be applied? If each row of $X$ shares scale $S_{X,i}$ and each column of $W$ shares scale $S_{W,j}$, neither depends on the contraction index $k$, so both factor straight out into the GEMM **epilogue**:

$$
\hat{Y}_{ij} = \left(S_{X, i} \cdot S_{W, j}\right) \sum_{k=1}^K \tilde{X}_{ik} \tilde{W}_{kj}
$$

By contrast, when scales vary along $K$ (as in 32-element MX blocks), the scale product **cannot** leave the outer sum:

$$
\hat{Y}_{ij} = \sum_{b=1}^{\lceil K/32\rceil} \left(S_{X, i, b} \cdot S_{W, j, b}\right) \sum_{k \in \text{block } b} \tilde{X}_{ik} \tilde{W}_{kj}
$$

For two blocks with partial sums `[2, 3]` and scale products `[5, 8]`, the true block-scaled dot product is $5(2) + 8(3) = 34$, whereas mistakenly pulling scale `5` outside gives $5(2 + 3) = 25$.[^ocp2023mx][^nvidiaPtxTcgen2026]

<figure>
  <img src="illustrations/_generated/scale_factoring_dataflow_dark.png" alt="A five-stage device flow moves high-precision X and W through producer quantization, packed codes and scales, a selected MMA path with its declared accumulator mode, and an output that applies the X-row and W-column scale product before a BF16 cast. When K-block scale products are 5 and 8, partial sums 2 and 3 produce 10 plus 24, or 34; factoring 5 outside gives 25." />
  <figcaption>Row/column scales factor into the GEMM epilogue; K-varying block scales must apply per block inside the contraction (5×2 + 8×3 = 34, not 25).</figcaption>
</figure>

## Numerical hazards: subnormals, saturation, and rounding

Three encoding behaviors silently alter numbers before the accumulator ever runs:

1. **Subnormals and RNE ties:** OCP E4M3's smallest normal is $2^{-6}$ and its smallest subnormal is $d = 2^{-9} \approx 0.001953$. Under round-to-nearest-even (RNE), `0.75 d` rounds up to `d`, while exact tie `0.5 d` rounds to signed zero (`±0.0`). Some GPU modes also flush denormals to zero (FTZ).[^pytorchNumericalAccuracy2026]
2. **Saturation cliffs:** Saturating conversion (`__NV_SATFINITE`) clamps `500` and `50,000` identically to `448`; non-saturating conversion turns overflow into E4M3 `NaN` or E5M2 `±inf`.[^nvidiaCudaMathFp82026]
3. **Stochastic rounding (SR) vs. RNE:** Repeated small weight updates can stall under RNE when $\text{RNE}(W + \Delta W) = W$. **Stochastic rounding** rounds to neighboring representable values $l < x < u$ with probabilities $\frac{x - l}{u - l}$ (up) and $\frac{u - x}{u - l}$ (down), making $\mathbb{E}[\text{SR}(x)] = x$ unbiased for any finite $x$ inside range (for $x = 1.01$ between `1.0` and `1.125`, `p(1.125) = 0.08`, expected value `1.01`).[^nvidia2026nvfp4Recipe] Also verify internal MMA precision: even an FP32 accumulator does not guarantee full FP32 internal product precision across every instruction.[^nvidiaPtxIsa2026]

<figure>
  <img src="illustrations/_generated/fp8_conversion_boundaries_dark.png" alt="The left number line magnifies zero to the smallest E4M3 subnormal d = 2⁻⁹. The RNE midpoint 0.5d maps to signed zero, while 0.75d maps to d. The separate right range maps an unscaled input 500 with S = 1 to the finite E4M3 code 448 and reconstructs 448." />
  <figcaption>E4M3 subnormal tie rounding around $d = 2^{-9}$ (left) and saturating ceiling clamp at 448 (right).</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/stochastic_rounding_neighbors_dark.png" alt="A shared linear number line places 1.01 eight percent of the way between neighboring representable values 1 and 1.125. Round-to-nearest-even chooses 1. A deterministic probability bar assigns 0.92 mass to 1 and 0.08 to 1.125, whose weighted expectation is 1.01. A separate saturation lane shows 500 clipped to 448 beyond the finite neighbor interval." />
  <figcaption>Stochastic rounding between representable neighbors `1.0` and `1.125` gives `1.01` an 8% chance of rounding up, preserving exact expectation `1.01`.</figcaption>
</figure>

## Hands-on: inspecting FP8 conversion thresholds and ABI bytes

Run this PyTorch check on CPU to see E4M3 subnormal rounding, saturation, and a notorious cross-vendor trap: the exact same raw byte `0x38` decodes to **`1.0`** in OCP E4M3 (bias 7) and **`0.5`** in AMD CDNA3 FNUZ E4M3 (bias 8), while `0x80` decodes to **`-0.0`** in OCP and **`NaN`** in FNUZ![^pytorchTensorAttributes2026][^amdRocmPrecision2026]

<!-- leetllm: test, deps=torch, output=show -->
```python title="fp8-conversion-and-abi.py"
import torch

d = 2.0 ** -9
vals = torch.tensor([0.5 * d, 0.75 * d, -0.5 * d, 1.0625, 1.1875, 500.0])
cast = vals.clamp(-448.0, 448.0).to(torch.float8_e4m3fn).float()
print("E4M3 round-trip:", cast.tolist())
print("negative tie preserves -0.0:", bool(torch.signbit(cast[2])))

raw_bytes = torch.tensor([0x38, 0x80], dtype=torch.uint8)
print("OCP  E4M3 (0x38, 0x80):", raw_bytes.view(torch.float8_e4m3fn).float().tolist())
print("FNUZ E4M3 (0x38, 0x80):", raw_bytes.view(torch.float8_e4m3fnuz).float().tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
E4M3 round-trip: [0.0, 0.001953125, -0.0, 1.0, 1.25, 448.0]
negative tie preserves -0.0: True
OCP  E4M3 (0x38, 0x80): [1.0, -0.0]
FNUZ E4M3 (0x38, 0x80): [0.5, nan]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/fp8_decoder_abi_dark.png" alt="The same raw bytes enter two E4M3 decoder conventions. The byte 0x38 has sign 0, exponent bits 0111, and fraction bits 000; bias 7 decodes it as 1.0 while bias 8 decodes it as 0.5. The byte 0x80 has sign 1, exponent 0000, and fraction 000; OCP decodes negative zero while FNUZ reserves that byte for NaN." />
  <figcaption>Identical bytes decode differently across OCP (bias 7) and FNUZ (bias 8): `0x38` shifts from 1.0 to 0.5 and `0x80` flips from `-0.0` to `NaN`.</figcaption>
</figure>

## Scaling architectures: granularity and delayed scaling

Watch the reciprocal convention in every library: here $S = \text{amax} / 448$ is the **reconstruction scale** ($\hat{x} = S q$), while many APIs store $\alpha = 1/S = 448/\text{amax}$ ($q = Q(\alpha x)$). For an all-zero block, set an explicit positive scale like `1.0` instead of dividing by zero.

- **Current scaling:** Reads the tensor twice during quantization (once for `amax`, once to cast) so scales never lag.[^nvidia2026fp8CurrentScaling]
- **Delayed scaling:** Picks $S_t = \max_{i \in [1, H]} \text{amax}_{t-i} / 448$ from prior steps, cutting quantization to one read while recording the new `amax` for next step, at the risk of saturation cliffs whenever an activation suddenly spikes.[^nvidia2026fp8DelayedScaling]
- **Online block scaling:** DeepSeek-V3 measures `amax` online for `1×128` activation tiles and `128×128` weight blocks, promoting partial FP8 GEMM sums to CUDA-core FP32 accumulation every 128 elements to overcome H800 internal precision limits.[^deepseekv3_2024][^deepgemmPinned2026]

<figure>
  <img src="illustrations/_generated/scaling_device_timeline_dark.png" alt="Two schematic device sequences compare current and delayed scaling. Current scaling reads tensor values for amax, computes the scale, reads values again to cast and write codes, then GEMM reads those codes. Delayed scaling selects the current scale as max of the previous three amax values divided by 448, then casts and writes codes in one tensor pass while recording the current amax for the next history window. The selected history scale feeds the current cast. Spacing is schematic, with no duration claim." />
  <figcaption>Current scaling makes two passes during quantization (amax + cast); delayed scaling casts in one pass using historical amax while recording today's amax for future steps.</figcaption>
</figure>

## Microscaling: the two-row experiment

What happens when a small activation (`0.001`) shares one tensor-wide scale with a spike (`500.0`) versus getting its own 32-element MX block scale? Let's run it in PyTorch, and then expose a subtle **cancellation trap**:

<!-- leetllm: test, deps=torch, output=show -->
```python title="fp8-two-row-microscaling.py"
import math
import torch

x = torch.tensor([
    [0.001, 0.03, 0.117, 0.5, 1.0, -0.25, 0.0625, -0.015625] * 4,
    [4.0, 16.0, 64.0, 500.0, -2.0, -8.0, -32.0, -250.0] * 4,
], dtype=torch.float32)
w = torch.tensor([0.5, -0.25, 0.125, -0.0625, 0.03125, -0.5, 0.25, -0.125] * 4).reshape(32, 1)
fp8_max = torch.finfo(torch.float8_e4m3fn).max

def quant_rt(t, s):
    return (t / s).clamp(-fp8_max, fp8_max).to(torch.float8_e4m3fn).float() * s

def mx_scale(block):
    r = block.abs().max().item() / fp8_max
    return 1.0 if r == 0 else 2.0 ** max(-127, math.ceil(math.log2(r)))

# Tensor-wide vs 32-element power-of-two block scaling
x_ten = quant_rt(x, x.abs().max() / fp8_max)
w_ten = quant_rt(w, w.abs().max() / fp8_max)
s_mx = torch.tensor([mx_scale(row) for row in x]).reshape(2, 1)
x_mx = quant_rt(x, s_mx)
w_mx = quant_rt(w, torch.tensor(mx_scale(w)))

ref_y, ten_y, mx_y = (x @ w).squeeze(), (x_ten @ w_ten).squeeze(), (x_mx @ w_mx).squeeze()
print(f"x[0,0]=0.001 -> tensor={x_ten[0,0]:.6f} (WIPED!), MX={x_mx[0,0]:.6f}")
print(f"x[1,3]=500.0 -> tensor={x_ten[1,3]:.1f}, MX={x_mx[1,3]:.1f}")
print(f"dot y: ref={ref_y.tolist()}, tensor={[round(v, 4) for v in ten_y.tolist()]}, MX={mx_y.tolist()}")

# Cancellation hides the 500 -> 512 error in mx_y[1]=7.75; a one-hot selector exposes +12.0 error!
sel = torch.zeros_like(w); sel[3, 0] = 1.0
print(f"spike-only dot: ref={(x @ sel)[1].item():.1f}, MX={(x_mx @ sel)[1].item():.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
x[0,0]=0.001 -> tensor=0.000000 (WIPED!), MX=0.000977
x[1,3]=500.0 -> tensor=500.0, MX=512.0
dot y: ref=[0.6008124947547913, 7.75], tensor=[0.5831, 7.5684], MX=[0.6015625, 7.75]
spike-only dot: ref=500.0, MX=512.0
```
<!-- leetllm: output:end -->

Look at two sharp lessons from those four lines of output:
1. Under tensor-wide scaling ($S = 1.116$), `0.001` falls below half the smallest E4M3 step (`0.00218`) and **vanishes to zero**! Under MX block scaling ($S_0 = 2^{-8}$), `0.001` survives cleanly at `0.000977` (2.3% error), with just 1 E8M0 byte per 32 elements (`66 B` vs. `68 B` for a 64-element activation).[^nvidia2026mxfp8]
2. On row 1, `500.0` rounds to `512.0` under $S_1 = 2.0$, yet `mx_y[1]` still matches `7.75` identically because positive and negative rounding errors cancel (`184 - 176.25 = 7.75`). Swap $W$ to a one-hot selector and the hidden `12.0` error jumps right out!

<figure>
  <img src="illustrations/_generated/scale_payload_bytes_dark.png" alt="For the same 64-element FP8 activation X, 64 code bytes plus one four-byte tensor scale total 68 bytes. Two 32-element MX groups use 64 code bytes plus two one-byte E8M0 scales, totaling 66 bytes. The scale-byte inset draws each metadata byte three times wider than each code-byte cell. E8M0 examples map 0x77 to 2 to the minus 8, 0x80 to 2, 0x00 to a positive scale, and 0xff to NaN. The MX payload is 8.25 bits per value, with scale bytes equal to 3.125 percent of the 64 code bytes." />
  <figcaption>64 FP8 elements take 68 bytes with one FP32 tensor scale vs. 66 bytes with two 1-byte E8M0 MX scales (8.25 bits/value).</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/scale_ownership_dark.png" alt="Two side-by-side layouts show one scale shared by both 32-value rows and one scale owned by each row. Separate original-value zooms plot the exact reconstructions: 0.001 becomes 0 with the shared tensor scale and 0.00097656 with the row scale; 500 stays 500 with the tensor scale and becomes 512 with the second row scale." />
  <figcaption>Per-row MX scaling rescues `0.001` from flushing to zero, while power-of-two rounding shifts `500` to `512` in row 1.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/cancellation_exposes_operand_error_dark.png" alt="The 32-value activation row repeats an eight-value pattern four times; highlighted spikes at indices 3, 11, 19, and 27 reconstruct from 500 to 512. Grouped positive and negative real-arithmetic sums meet at 7.75: 181 plus negative 173.25 for FP32 values, and 184 plus negative 176.25 for reconstructed operands. A full 32-entry one-hot W selector has only w3 set to 1; at index 3 it exposes 500 versus 512, an absolute error of 12." />
  <figcaption>Cancellation masks the 500→512 error inside the 7.75 dot product; a one-hot selector exposes the 12-unit operand error immediately.</figcaption>
</figure>

> **Common mistake:** Never create a column-wise quantized matrix (needed for backward passes) by transposing already-quantized row-wise FP8 bytes! Transposing carries the old horizontal scale groups into vertical columns. Always quantize both orientations directly from the wider source tensor.[^nvidia2026mxfp8]

<figure>
  <img src="illustrations/_generated/scale_orientation_groups_dark.png" alt="One logical 32 by 32 high-precision matrix can be quantized with horizontal 1 by 32 groups or vertical 32 by 1 groups. The highlighted horizontal group contains all 32 values of row i; the highlighted vertical group contains all 32 values of column j. Transposing encoded bytes carries their existing group ownership, so derive the columnwise representation from the original wider matrix." />
  <figcaption>Row-wise (1×32) and column-wise (32×1) blocks group completely different elements; quantize each orientation from the original wider matrix.</figcaption>
</figure>

## Hardware support and troubleshooting numerical failures

Always check target microarchitecture and toolkit tables before shipping: NVIDIA Hopper/Ada support FP8, Blackwell (SM 10.x) adds hardware MXFP8/NVFP4 block-scaled MMA, AMD CDNA3 uses FNUZ FP8 while CDNA4/RDNA4 adopt OCP FP8, and PyTorch exposes modern `torch.backends.cuda.matmul.fp32_precision = "tf32" | "ieee"` controls.[^pytorchNumericalAccuracy2026][^nvidia2026mxfp8][^nvidia2026nvfp4Recipe][^amdRocmPrecision2026]

| Symptom | Likely root cause | Fix |
|---|---|---|
| Many FP8 codes equal `±448` | Saturation clipping from stale or tight scale | Inspect pre-cast scaled magnitudes; widen margin or switch to current/block scaling. |
| Entire row flushes to `0.0` | Shared scale dominated by an outlier in another row | Move from tensor-wide to row-wise or 32-element MX block scaling. |
| Output collapses when porting NVIDIA → AMD | OCP (bias 7) vs. FNUZ (bias 8) byte mismatch | Check hex byte `0x38`; explicitly transcode between OCP and FNUZ. |
| Backward pass turns to noise after transpose | Scale orientation mismatch | Quantize row-major and column-major views from the wider source tensor. |

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
    "explanation": "Five rows × two blocks ×32 code bytes=320. Ten blocks add ten scale bytes, totaling 330. Counting only logical values gives 175 and omits padding; counting 320 omits scales."
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
    "explanation": "Both element arrays use 32 bytes. NVFP4 adds four block-scale bytes and four tensor-scale bytes, totaling 40. MXFP4 adds two block-scale bytes, totaling 34."
  }
]
```

> **Next:** Continue to [GPU Runtime Execution Lab](/learn/gpu-runtime-execution-lab).
