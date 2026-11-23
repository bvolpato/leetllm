---
{
  "id": "model-quantization-gptq-awq-gguf",
  "title": "Model Quantization: GPTQ, AWQ & GGUF",
  "slug": "model-quantization-gptq-awq-gguf",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/quantization_levels_dark.png",
  "companies": [
    "NVIDIA",
    "Google",
    "Meta",
    "Microsoft",
    "Hugging Face",
    "Databricks"
  ],
  "shortDescription": "Four-bit codes can shrink a 54 GB weight payload toward 14 GB. Learn how quantization methods, tensor encodings, and runtime support determine the result.",
  "keyConceptsTested": [
    "Post-training quantization (PTQ) basics",
    "Symmetric vs Asymmetric quantization",
    "GPTQ Hessian-aware post-training quantization",
    "AWQ activation-aware weight quantization",
    "GGUF format and local inference workflows",
    "Evaluating quantized models beyond perplexity",
    "Per-group vs Per-tensor quantization",
    "Zero-point and Scale factors",
    "Weight-only vs Activation quantization",
    "FP8 and KV cache quantization"
  ],
  "prerequisites": [
    "low-precision-gpu-programming",
    "model-parallelism-for-llm-inference",
    "scaling-llm-inference-batching-kv-cache",
    "kv-cache-paged-attention-llm-serving",
    "multi-query-grouped-query-attention"
  ],
  "relatedQuestions": [
    "local-llm-deployment-hardware-quantization",
    "slm-specialization-edge-deployment",
    "llm-deployment-gpu-serving-autoscaling",
    "speculative-decoding",
    "long-context-window-management",
    "knowledge-distillation-llms"
  ],
  "section": "Inference & Production Scale",
  "order": 18
}
---
<!-- leetllm: edition:reference:start -->
A rounded 27-billion-weight model needs 54 GB for the BF16 payload alone. Four-bit codes take 13.5 GB. One FP16 scale per 128 weights brings that to 13.922 GB, or 12.966 GiB. That estimate makes a 24 GB GPU worth investigating. Budget the remaining capacity for preserved floating-point tensors, zero-points, padding, cache, and workspace before choosing a context length.

Quantization is the map from those floating-point values onto a smaller set of codes. Packing the codes can cut storage and memory traffic. Speed still depends on the runtime: its kernels, batch size, context state, and hardware.

For a real checkpoint, Qwen3.6-27B's model card lists a 27B language component **with a vision encoder** and a hybrid recurrent/attention layout.[^qwen3627b2026] Inspect the actual tensor inventory and runtime state rather than treating the name as an exact count of uniformly quantizable weights.

<span data-glossary="gptq">GPTQ</span> and <span data-glossary="awq">AWQ</span> both choose integer codes for floating-point weights, and they do it for different reasons. GPTQ is Hessian-aware post-training quantization. AWQ is activation-aware weight quantization. <span data-glossary="gguf">GGUF</span> is the portable local inference container, designed by the llama.cpp project, that packages extensible key-value metadata and typed tensors. Choose a quantization method, a tensor encoding, and an engine that supports the resulting artifact.

You need matrix multiplication and the distinction between weights, activations, and the <span data-glossary="kv-cache">KV cache</span>. For a linear layer, weights are the fixed coefficients. Activations are the input values that multiply them. The cache holds attention state from earlier tokens. Quantizing weights doesn't automatically compress activations or the cache.

## From floating-point values to four-bit codes

Suppose a weight is $0.73$ and each integer step represents $0.1$. Dividing by that scale yields $7.3$; rounding stores integer code $7$; multiplying back recovers $0.7$. The discarded difference, $0.03$, is the rounding error.

A general affine quantizer formalizes this conversion with a positive scale factor $S$ and an integer zero-point $Z$:

$$
q = \operatorname{clip}\left(\left\lfloor \frac{w}{S} \right\rceil + Z, q_{\min}, q_{\max}\right), \qquad \hat{w} = S \cdot (q - Z)
$$

Scale $S$ sets grid spacing, while zero-point $Z$ maps real zero to a representable integer code. Clipping bounds the code within $[q_{\min}, q_{\max}]$ to prevent integer overflow, though clipping extreme values can introduce far more distortion than rounding. The reconstructed value $\hat{w}$ approximates the original weight, but rarely matches it perfectly.

### Round the values, then pack the codes

Rounding maps floating-point values to discrete integer codes. Packing stores those codes in compact memory blocks.

The following script implements a symmetric signed INT4 format over the narrow range $[-7, 7]$. Four bits can encode 16 states ($[-8, 7]$ in two's complement), but this format sets aside $-8$ so positive and negative limits have equal magnitude. Notice how Python's `round` uses round-half-to-even. Two signed 4-bit nibbles pack into each byte (low nibble first), with an extra zero nibble appended if the tensor length is odd.

<!-- leetllm: test, output=show -->
```python title="pack-int4.py"
import math
import struct


def encode(weights):
    weights = list(weights)
    if not weights:
        raise ValueError("weights must be nonempty")
    maximum = max(abs(w) for w in weights)
    scale = maximum / 7 if maximum else 1.0
    if scale <= 0 or math.isinf(scale):
        raise ValueError("scale is not representable as positive FP64")
    codes = [max(-7, min(7, round(w / scale))) for w in weights]
    if any(math.isinf(q * scale) for q in codes):
        raise ValueError("reconstruction exceeds finite FP64")
    # Low nibble first; two's-complement encoding preserves negative codes.
    nibbles = [q & 15 for q in codes]
    if len(nibbles) % 2:
        nibbles.append(0)
    payload = bytes(nibbles[i] | (nibbles[i + 1] << 4)
                    for i in range(0, len(nibbles), 2))
    # A four-byte count and an eight-byte scale make this example self-contained.
    return struct.pack("<Id", len(weights), scale) + payload


def decode(blob):
    if len(blob) < 12:
        raise ValueError("truncated header")
    count, scale = struct.unpack("<Id", blob[:12])
    if count == 0 or scale <= 0 or math.isinf(scale):
        raise ValueError("invalid header")
    if len(blob) != 12 + (count + 1) // 2:
        raise ValueError("payload length mismatch")
    codes = []
    for byte in blob[12:]:
        for q in (byte & 15, byte >> 4):
            codes.append(q - 16 if q >= 8 else q)
    codes = codes[:count]
    if -8 in codes:
        raise ValueError("unused code in narrow-range format")
    restored = [q * scale for q in codes]
    if any(math.isinf(w) for w in restored):
        raise ValueError("reconstruction exceeds finite FP64")
    return codes, restored


weights = [0.15, -1.22, 2.40, -0.45, 0.73]
blob = encode(weights)
codes, restored = decode(blob)
assert codes == [0, -4, 7, -1, 2]
assert decode(encode([0.0, 0.0]))[1] == [0.0, 0.0]
assert decode(encode([-7.0, 7.0]))[0] == [-7, 7]
assert decode(encode([7.0, 0.5, 1.5]))[0] == [7, 0, 2]
assert decode(encode(iter([-7.0, 7.0])))[0] == [-7, 7]
try:
    encode([float.fromhex("0x0.0000000000001p-1022")])
except ValueError:
    pass  # Dividing the smallest positive FP64 value by seven underflows.
else:
    raise AssertionError("unrepresentable scale accepted")
for invalid in (b"", blob[:-1], blob + b"\x00", struct.pack("<Id", 1, 1e308) + b"\x07"):
    try:
        decode(invalid)
    except ValueError:
        pass
    else:
        raise AssertionError("invalid payload accepted")

print("codes:", codes)
print("payload:", blob[12:].hex(), f"({len(blob) - 12} bytes)")
print("restored:", [round(w, 3) for w in restored])
print("mean absolute error:", round(sum(abs(w - r) for w, r in zip(weights, restored)) / len(weights), 3))
print("total with header:", len(blob), "bytes")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
codes: [0, -4, 7, -1, 2]
payload: c0f702 (3 bytes)
restored: [0.0, -1.371, 2.4, -0.343, 0.686]
mean absolute error: 0.091
total with header: 15 bytes
```
<!-- leetllm: output:end -->

The three payload bytes (`0xC0`, `0xF7`, `0x02`) hold the packed four-bit codes. A Python list holds object references, with overhead that depends on the implementation and integer sharing. Our 12-byte count/FP64-scale header also matters: the 15-byte artifact is barely smaller than five raw FP32 floats (20 bytes). This teaching codec checks scale underflow and reconstruction overflow. Production checkpoints use their own tensor layouts and metadata formats.

<figure>
  <img src="illustrations/_generated/quantization_pipeline_dark.png" alt="A shared signed INT4 grid maps five weights to codes [0, −4, 7, −1, 2]. The codes pack low nibble first into bytes C0, F7, and 02, with a zero high-nibble pad in the last byte. Decoding uses scale 2.4/7 and gives mean absolute error 0.091; the count and FP64 scale add a 12-byte header." />
  <figcaption>The number line connects each weight to its shared-grid reconstruction. The code row then follows those signed values into three low-nibble-first bytes, including the final zero pad.</figcaption>
</figure>

### Symmetric and asymmetric grids

Symmetric quantization forces zero-point $Z = 0$, centering the integer grid around real zero:

$$
\hat{w} = S \cdot q, \qquad S = \frac{\max(|w|)}{q_{\max}}
$$

For a single scale shared across the reduction, computing $\hat{W} X$ factors as:

$$
\hat{W} X = (S_w Q_w) X = S_w (Q_w X)
$$

There is no zero-point subtraction. However, $Q_w X$ isn't necessarily an integer dot product: W4A16 kernels commonly reconstruct floating-point weights and multiply by floating-point activations. Per-group scales along the reduction belong **inside the sum**, unless the kernel accumulates and scales each group separately.

Asymmetric quantization allows $Z \ne 0$, shifting the grid to cover an uneven interval $[w_{\min}, w_{\max}]$:

Include zero in the calibrated interval, set $a=\min(w_{\min},0)$ and $b=\max(w_{\max},0)$, and for $b>a$ use:

$$
S = \frac{b-a}{q_{\max}-q_{\min}}, \qquad Z = \operatorname{clip}\left(q_{\min}-\left\lfloor\frac{a}{S}\right\rceil,q_{\min},q_{\max}\right)
$$

The $q_{\min}$ term matters for signed codes. An all-zero interval needs a separate positive-scale convention. Rounding the zero-point means arbitrary endpoints do not have to reconstruct exactly. Asymmetric grids can help skewed distributions, including nonnegative ReLU outputs. **SiLU can be negative**; its range isn't ReLU's range.

For weights sharing one scale and zero-point, the offset appears as:

$$
\sum_j \hat{w}_{ij} x_j = S_w \sum_j (q_{ij} - Z_w) x_j = S_w \left( \sum_j q_{ij} x_j - Z_w \sum_j x_j \right)
$$

The correction can be fused with dequantization; this equation doesn't require a separate activation-sum pass or extra global-memory reads. Both symmetric and asymmetric weight formats are used. The original GPTQ experiments use asymmetric grids, and Hugging Face's AWQ configuration example enables zero-points.[^frantar2023][^huggingface2026awq]

Try changing the unsigned range to signed $[-8,7]$. The real interval stays $[-1,2]$, so the zero-point changes from $5$ to $-3$, while reconstructed values stay the same. Values outside that interval clip.

<!-- leetllm: test, output=show -->
```python title="affine-range.py"
import math

low, high = -1.0, 2.0  # Includes zero; unsigned codes are 0..15.
scale = (high - low) / 15
zero_point = round(-low / scale)
values = [-2.0, -1.0, 0.0, 0.73, 2.0, 3.0]
codes = [max(0, min(15, round(w / scale) + zero_point)) for w in values]
restored = [round(scale * (q - zero_point), 2) for q in codes]
assert zero_point == 5 and codes[2] == zero_point
assert restored[0] == -1.0 and restored[-1] == 2.0
signed_zero = -8 - round(low / scale)
signed_codes = [max(-8, min(7, round(w / scale) + signed_zero)) for w in values]
assert signed_zero == -3
assert [round(scale * (q - signed_zero), 2) for q in signed_codes] == restored
assert -1.0 / (1.0 + math.exp(1.0)) < 0  # SiLU(-1).
print("zero point:", zero_point)
print("codes:", codes)
print("restored:", restored)
print("signed zero point:", signed_zero)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
zero point: 5
codes: [0, 0, 5, 9, 15, 15]
restored: [-1.0, -1.0, 0.0, 0.8, 2.0, 2.0]
signed zero point: -3
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/affine_grid_and_group_ownership_dark.png" alt="An affine grid over real values from minus 1 to 2 uses scale 0.2 and zero code 5; the signed representation uses zero code minus 3. Values minus 2, minus 1, 0, 0.73, 2, and 3 map to restored values minus 1, minus 1, 0, 0.8, 2, and 2. Sixteen unsigned codes remain available. At the bottom, two weight groups retain separate scales through their partial sums." />
  <figcaption>The highlighted code maps real zero to unsigned 5 or signed −3. Each reduction group keeps its own scale with the partial sum.</figcaption>
</figure>

### Granularity: per-tensor, per-channel, and per-group

Quantization grid parameters can be shared across different tensor slices:

- **Per-tensor quantization** assigns a single scale and zero-point to an entire weight matrix. A single outlier weight forces an oversized scale $S$, flattening small weights into zero.
- **Per-channel quantization** assigns distinct scales to each output channel (row) or input channel (column). In linear projections, giving each row its own scale $S_i$ accommodates neurons with different dynamic ranges. The extra storage is $d_{\text{out}}$ scalars.
- **Per-group quantization** divides each row into contiguous blocks of $g$ weights (commonly $g=128$, $g=64$, or $g=32$). Each group gets its own scale $S_g$ and optional zero-point. Outliers remain contained within their 128-element slice, preventing them from distorting the rest of the layer.

Smaller groups protect dynamic range, but require storing more scale factors. At $g=128$, storing one FP16 scale (16 bits) per 128 weights adds $16 / 128 = 0.125$ bits per weight, a $3.1\%$ increase over 4 bits. Dropping the group size to $g=32$ quadruples that metadata cost to $0.5$ bits per weight, trading memory footprint directly for finer range containment.

```checkpoint
Two artifacts both claim INT4 precision, but one checkpoint file is 10% larger on disk. What would you inspect before calling it a packaging bug?
---
Compare tensor counts and encodings, group sizes, zero-point storage, preserved floating-point layers, padding, and container metadata. Those can explain a size difference. The label alone cannot pinpoint the cause or rule out a packaging mistake.
```

## Serving realities: memory-bound decode versus compute-bound prefill

A common question is why teams compress weights to 4 bits if matrix multiplication still executes in 16-bit floating point. The answer lies in the physics of GPU memory bandwidth and arithmetic intensity.

### What W4A16 can save during decoding

For a small-batch dense linear layer, suppose each active weight is read once from HBM and contributes one multiply-add. Embedding lookups, inactive experts, on-chip reuse, and attention/cache traffic don't satisfy that simplified whole-model picture. Let $P$ count weights in the linear work we're estimating.

Calculate the arithmetic intensity of this decode step:

$$
\text{Arithmetic Intensity} = \frac{\text{FLOPs}}{\text{Bytes Transferred}} \approx \frac{2 \cdot P}{P \cdot \text{Bytes per Weight}} = \frac{2}{\text{Bytes per Weight}}
$$

For BF16 weights, this estimate is $1$ FLOP/byte. An A100 80GB SXM lists 312 dense FP16 Tensor Core TFLOPS and 2,039 GB/s of HBM bandwidth.[^nvidia2026a100Specs] Its nominal ridge point is $153$ FLOPs/byte. The bandwidth ceiling at intensity one is about $0.65\%$ of that compute peak. That ratio compares theoretical rates. Measure execution separately: the selected kernel may use different execution units and additional traffic.

**W4A16** (4-bit weights with 16-bit activations) directly attacks this memory bottleneck:

1. Four-bit codes need one quarter of BF16's raw weight bytes, before metadata.
2. A fused kernel can unpack and rescale those codes near computation instead of writing a full floating-point weight matrix to global memory.
3. W4A16 then computes with 16-bit activations; its implementation may use Tensor Cores or other instructions, depending on shape and backend.

Unpacking, scale loads, register pressure, and kernel efficiency still cost work. Some workloads get faster because less weight traffic matters. Others slow down when unpacking costs more than the bytes saved. Measure token rate on the target workload after reducing code size.

### When weight traffic stops being the bottleneck

Prefill reuses weights across prompt tokens, often increasing arithmetic intensity. Whether it is compute-bound depends on GEMM dimensions, attention, batching, and kernels. A large prompt does not prove full compute utilization.

A W4A16 path that dequantizes into FP16 doesn't acquire a native INT4 arithmetic peak. It can still improve latency through reduced traffic or a better fused implementation. It can also lose to BF16 when conversion costs dominate.

Quantizing activations opens additional arithmetic paths, with a new accuracy and conversion budget:

- **Integer W8A8 / W4A4** uses compatible integer kernels. The A100 specification lists 624 dense INT8 TOPS versus 312 FP16 TFLOPS; this hardware comparison doesn't predict an application's speedup.[^nvidia2026a100Specs]
- **Activation outliers** can make a shared grid coarse. SmoothQuant transfers part of that range into weights with an equivalent rescaling before W8A8 quantization.[^xiao2023]
- **FP8** is a separate floating-point route on supported hardware, with its own scaling recipe and kernels. Wider arithmetic throughput doesn't guarantee twice the prefill speed.[^micikevicius2022]
- **KV cache precision** is independent of weight precision. Current vLLM documentation describes FP8 cache formats and calibration; per-head scaling has backend restrictions. Check the selected release/backend rather than assuming generic INT8 cache support.[^vllm2026kvquant]

This budget assumes every weight is quantizable, groups are fully packed, and scales are FP16. Actual grouping occurs within tensor rows, so partial groups can add overhead. It excludes zero-points and every other allocation.

<!-- leetllm: test, output=show -->
```python title="weight-memory.py"
parameters = 27_000_000_000
for bits in (16, 8, 4, 3):
    payload = (parameters * bits + 7) // 8
    print(f"{bits:2}-bit payload: {payload / 1e9:.3f} GB = {payload / 2**30:.3f} GiB")
scale_bytes = ((parameters + 127) // 128) * 2
print(f"INT4 scale overhead: {scale_bytes / 1e9:.3f} GB")
assert parameters * 4 // 8 + scale_bytes > 13_500_000_000
```

<!-- leetllm: output:start -->
```text title="Output" output compact
16-bit payload: 54.000 GB = 50.291 GiB
 8-bit payload: 27.000 GB = 25.146 GiB
 4-bit payload: 13.500 GB = 12.573 GiB
 3-bit payload: 10.125 GB = 9.430 GiB
INT4 scale overhead: 0.422 GB
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/w4a16_memory_path_dark.png" alt="Two decode data paths show packed INT4 weights read from HBM into a fused unpack, rescale, and FP16 multiply, alongside a standalone dequantization path that writes a full FP16 matrix to HBM and reads it again. The simplified weight-read comparison is 2 bytes per BF16 weight versus 0.5 code bytes plus scale metadata. The A100 roofline values give a ridge of about 153 FLOPs per byte; intensity one reaches 0.65 percent of nominal FP16 peak. KV-cache storage remains a separate budget." />
  <figcaption>Fused kernels unpack codes near the FP16 multiply. The roofline values compare theoretical rate ceilings; workload timings require measurement.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/quantization_levels_dark.png" alt="On one 0 to 60 GB scale, a 27-billion-weight payload falls from 54 GB at BF16 to 27 GB at INT8, 13.5 GB of INT4 codes plus 0.421875 GB of group scales, and 10.125 GB of INT3 codes plus the same scales. The 24 GB line leaves other allocations to budget. One 128-weight INT4 group stores 64 code bytes and a 2-byte FP16 scale, totaling 4.125 bits per weight." />
  <figcaption>The common scale makes storage comparable. Reserve remaining memory for preserved tensors, padding, KV cache, and workspace before choosing a context.</figcaption>
</figure>

A smaller payload still multiplies activations. Nearest-code rounding treats every weight error as equal. Which errors actually move the layer output?

## GPTQ: second-order error compensation via Hessian curvature

Rounding each weight to its nearest discrete code minimizes individual parameter error, but models don't use weights in isolation. They multiply weights against activation vectors and sum them across thousands of channels. An error of $0.05$ on a channel with tiny activations has almost zero effect on layer output, while that same error on a high-magnitude channel can severely distort subsequent token probabilities.

### The layer reconstruction objective

Let $W \in \mathbb{R}^{m \times d}$ be a weight matrix and columns of $X \in \mathbb{R}^{d \times n}$ be calibration inputs. GPTQ approximates the following discrete optimization problem through sequential rounding and compensation:[^frantar2023]

$$
\min_{\hat{W}} \| W X - \hat{W} X \|_F^2 = \sum_{i=1}^m \| w_i X - \hat{w}_i X \|_2^2
$$

For a single weight row $w$, define the error vector $e = w - \hat{w}$. Expanding the squared error yields:

$$
\| e X \|_2^2 = e X X^T e^T = \frac{1}{2} e H e^T, \qquad H = 2 X X^T
$$

Here $H$ is the Hessian of this fixed-input linear objective. Its diagonal measures uncentered activation energy; off-diagonal entries measure cross-channel products. Correlated channels can offer another weight a way to compensate for a rounding decision.

### Cholesky updates and lazy block batching

For the OBS compensation step, let $A$ contain the still-free columns, including the column $q$ we're about to round. Let $F=A\setminus\{q\}$ and $K=(H_{A,A})^{-1}$. For this single constraint, the optimal continuous correction is:

$$
\Delta w_F = - \frac{w_q - \hat{w}_q}{K_{qq}} K_{F,q}
$$

Under the local quadratic objective, its cost is $(w_q-\hat{w}_q)^2/(2K_{qq})$. The active inverse changes as columns are fixed. Reusing the original full inverse at every step would give the wrong correction.

Inverting a shrinking matrix from scratch after every column would cost $O(d^4)$. GPTQ avoids that route:

1. **Factor once.** The reference code adjusts dead columns, adds damping to **$H$**, then computes an upper Cholesky factor $U$ with $(H+\lambda I)^{-1}=U^T U$. Its sequential update uses $(w_q-\hat{w}_q)/U_{qq}$ times the remaining entries of row $q$ of $U$. Damping is often 1% of the mean diagonal. A strictly positive damping term makes an exact positive-semidefinite matrix positive definite; a relative term can be zero, and finite-precision failures still require checks.[^gptqImplementation2026]
2. **Batch deferred corrections.** Within a block, process rounding decisions in order. Apply the accumulated correction to later columns with GEMM after the block. This improves hardware use without changing the sequential dependency or promising a fixed compression time.[^frantar2023]

### The act-order heuristic and calibration drift

**Act-order** sorts columns by descending $H_{jj}=2\|X_{j,:}\|_2^2$ before quantization. This measures uncentered second-moment energy. Relating that energy to variance requires centered inputs. Earlier columns have more free coordinates available for compensation.[^gptqImplementation2026]

Permutation can complicate group layouts. Static grouping and runtime support affect the cost, so inspect the artifact's group indices and backend rather than assuming act-order always breaks packing or always improves quality. While static grouping preserves contiguous 128-element chunks, `desc_act` reorders columns against global activation magnitude, making memory-stride inspection essential before choosing a kernel.

The following script walks through a $2 \times 2$ Hessian compensation step, showing how adjusting unquantized parameters reduces calibration error while demonstrating the danger of calibration drift on held-out inputs.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="hessian-compensation.py"
import numpy as np

w = np.array([1.2, 0.61])
X = np.array([[5.0, 4.0], [1.0, 1.0]])
H = 2 * X @ X.T
H_inv = np.linalg.inv(H)  # Small nonsingular example; use stable factorizations at scale.
q_first = np.rint(w[0])
updated = w - (w[0] - q_first) / H_inv[0, 0] * H_inv[:, 0]
# At the first column, the upper-factor update gives the same correction.
U = np.linalg.cholesky(H_inv).T
assert np.allclose(U.T @ U, H_inv)
assert np.allclose(w - (w[0] - q_first) / U[0, 0] * U[0, :], updated)
naive = np.rint(w)
compensated = np.array([q_first, np.rint(updated[1])])


def error(candidate, inputs):
    return float(np.sum(((w - candidate) @ inputs) ** 2))


assert np.allclose(updated, [1.0, 1.51])
assert error(compensated, X) < error(naive, X)
e = w - naive
assert np.isclose(error(naive, X), e @ (X @ X.T) @ e)
# Identical input channels make the undamped Hessian singular.
rank_deficient = np.ones((2, 3))
np.linalg.cholesky(2 * rank_deficient @ rank_deficient.T + 0.01 * np.eye(2))
# A different input distribution need not favor the same correction.
held_out = np.eye(2)
print("updated weights:", np.round(updated, 3).tolist())
print("naive calibration SSE:", round(error(naive, X), 3))
print("compensated calibration SSE:", round(error(compensated, X), 3))
print("held-out SSE:", round(error(naive, held_out), 3), "vs", round(error(compensated, held_out), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
updated weights: [1.0, 1.51]
naive calibration SSE: 0.54
compensated calibration SSE: 0.5
held-out SSE: 0.192 vs 1.972
```
<!-- leetllm: output:end -->

Notice that compensation reduced error on the calibration inputs from $0.54$ to $0.50$, but worsened error on the held-out identity distribution ($0.192$ to $1.972$). Calibration doesn't train model weights with loss gradients, yet its input distribution determines which errors the quantizer works hardest to neutralize. Calibrate on text that reflects target deployment domains, and always reserve separate test sets for evaluation.

<figure>
  <img src="illustrations/_generated/gptq_awq_mechanics_dark.png" alt="In the weight plane, fixed calibration inputs make the SSE contours elongated along correlated weight changes. Rounding w₀ from 1.2 to 1 and compensating the still-free w₁ moves it from 0.61 to 1.51, then GPTQ rounds it to 2. Calibration outputs are [6.61, 5.41] before rounding, [6, 5] after independent rounding, and [7, 6] after compensation. Calibration SSE falls from 0.5402 to 0.5002; held-out identity SSE rises from 0.1921 to 1.9721." />
  <figcaption>With $w_0$ fixed at 1, the calibration contours place the best continuous $w_1$ at 1.51. Rounding gives [1, 2]; the calibration and held-out errors are measured on separate inputs.</figcaption>
</figure>

Current Transformers documentation uses the `gptqmodel` package and says AutoGPTQ is no longer supported. It also warns that GPTQModel's asymmetric format isn't backward-compatible with legacy GPTQ models.[^huggingface2026gptq] An algorithm name does not verify packing or kernel compatibility.

## AWQ: activation-aware protection via channel scaling

GPTQ spends its effort after a rounding decision, compensating weights that are still free. AWQ asks an earlier question: which channels should the grid protect before any weight is rounded?[^lin2023] Instead of solving a sequential inverse-Hessian update across columns, it preserves high-activation features through a pre-rounding channel rescale.

### Salient channels and the equivalent transformation

The AWQ paper's INT3 experiments show that keeping a small activation-selected fraction of weights in FP16 can markedly improve perplexity. That observation motivates scaling.[^lin2023] Choose channel scales and evaluate accuracy for the target model and workload.

How should a quantizer identify which weights are salient? Looking at weight magnitudes alone fails because large weights often reside on channels with tiny activations. Instead, AWQ identifies salient channels by measuring average absolute activation magnitude across calibration inputs:

With our $d\times N$ input convention, channel $j$ has:

$$
s_{X,j}=\frac{1}{N}\sum_{k=1}^N |X_{j,k}|
$$

Channels with the largest $s_X$ values are salient.

Separate floating-point exceptions complicate a uniform low-bit kernel. They don't inherently force warp divergence or destroy coalescing; that depends on representation and execution.

AWQ avoids mixed precision through an exact mathematical identity. For any diagonal scaling matrix $D = \operatorname{diag}(s)$ with positive entries:

$$
W X = (W D) (D^{-1} X) = W' X'
$$

This identity holds over real arithmetic. Finite-precision rescaling does not always preserve every bit. After rounding, the two paths can differ:

$$
Q(W D) D^{-1} X \ne Q(W) X
$$

If the scaled group uses step $S(s)$, channel $j$ sees effective step $S(s)/s_j$ after undoing the scale. Increasing $s_j$ can help, but can also increase $S(s)$ and damage other channels.

Eligible graphs absorb inverse scaling into preceding normalization parameters or linear **weights and biases**. Bias alone can't rescale a linear output. The reference implementation also wraps some activation functions with an explicit scaling operation. Fusion depends on graph structure, and packed weights still require dequantization.[^awqImplementation2026]

### Search a small family, then check unseen inputs

Scaling weight column $j$ up protects that channel, but can also widen the group's overall dynamic range, penalizing neighboring non-salient weights in the same group.

AWQ balances this trade-off by parameterizing the scale vector with an exponent $\alpha$:

$$
s = s_X^\alpha, \qquad \alpha \in [0, 1]
$$

At $\alpha=0$, relative channel scaling is uniform; at $\alpha=1$, it follows mean absolute magnitude. The paper searches this family and applies clipping.[^lin2023] The reference code tests 20 exponents $0,0.05,\ldots,0.95$ for each searched module, clamps/normalizes scales, and selects by output MSE. Clipping is a separate stage.[^awqImplementation2026]

$$
\arg\min_s \left\| W X - Q(W \operatorname{diag}(s)) \operatorname{diag}(s)^{-1} X \right\|_F^2
$$

A restricted search reduces fitting freedom. Evaluate on held-out inputs to detect calibration overfitting. Group-wise weight quantization and module-level exponent search are different granularities.

This miniature experiment tests four predeclared scale vectors to expose the trade-off. The full AWQ procedure adds an exponent search and clipping.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="activation-aware-scaling.py"
import numpy as np

W = np.array([[0.3, 2.0]])
calibration = np.array([[10.0, 8.0, -10.0, -8.0], [1.0, -1.0, 1.0, -1.0]])
held_out = np.array([[9.0, -9.0], [0.5, -0.5]])


def reconstruct(factor):
    a = np.array([factor, 1.0])
    assert np.allclose((W * a) @ (calibration / a[:, None]), W @ calibration)
    scaled = W * a
    maximum = np.max(np.abs(scaled))
    step = maximum / 7 if maximum else 1.0
    return np.clip(np.rint(scaled / step), -7, 7) * step / a


def mse(candidate, X):
    return float(np.mean(((W - candidate) @ X) ** 2))


candidates = [(factor, reconstruct(factor)) for factor in (1, 2, 4, 8)]
best_factor, best_W = min(candidates, key=lambda item: mse(item[1], calibration))
for factor, candidate in candidates:
    print(f"factor {factor}: calibration MSE {mse(candidate, calibration):.6f}")
print("selected factor:", best_factor)
print(f"held-out MSE: {mse(best_W, held_out):.6f}")
assert mse(best_W, calibration) <= mse(reconstruct(1), calibration)
assert mse(best_W, held_out) < mse(reconstruct(1), held_out)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
factor 1: calibration MSE 0.016735
factor 2: calibration MSE 0.016735
factor 4: calibration MSE 0.016735
factor 8: calibration MSE 0.003265
selected factor: 8
held-out MSE: 0.000816
```
<!-- leetllm: output:end -->

Factors two and four leave the first weight reconstructed as $2/7\approx0.2857$, just like factor one: rescaling didn't change its effective rounding result. At factor eight, $0.3$ reconstructs exactly, but the other weight moves from $2$ to about $2.0571$. Try extending the search to 32. Protecting one channel can become expensive for its neighbor.



<figure>
  <img src="illustrations/_generated/awq_channel_coordinate_transform_dark.png" alt="For W = [0.3, 2], the selected AWQ channel transform uses D = diag(8, 1), so W times D is [2.4, 2] and the first activation row divides by 8. Each calibration column keeps the same product sum [5, 0.4, minus 1, minus 4.4] before rounding. Factors 1, 2, and 4 reconstruct the first weight as 2/7; factor 8 reconstructs it as 0.3 and moves the neighbor to 2.0571429. Calibration MSE falls to 0.003265 and held-out MSE is 0.000816 across the four-factor sweep." />
  <figcaption>The paired transform preserves each calibration dot product before rounding. Factor eight protects 0.3 and moves its neighbor; the preceding GPTQ figure shows a different mechanism.</figcaption>
</figure>

AutoAWQ was archived on May 11, 2025. Its notice points to vLLM's LLM Compressor and lists Torch 2.6.0/Transformers 4.51.3 as its last tested configuration.[^autoawqStatus2026] Transformers' AWQ loading guide still includes AutoAWQ dependencies and version warnings. A built-in configuration class does not guarantee an independent maintained kernel stack.[^huggingface2026awq] Check the selected runtime's support for your model, packing, group size, and zero-points before choosing an exporter.

A chosen scale still doesn't say how the codes are stored, or which runtime can execute them.

## GGUF container architecture and layer offloading

Engineers frequently ask whether they should choose AWQ or GGUF. That question mixes categories. AWQ is a quantization algorithm that generates quantized weights; GGUF is an extensible binary container format created by Georgi Gerganov and the llama.cpp project.[^gerganov2023]

A GGUF file can store unquantized BF16 weights, standard INT4 tensors, or custom k-quant formats.

| Name | Role in Stack | Concrete Purpose |
|---|---|---|
| GGUF | Binary Container | Stores key-value metadata, tensor descriptors, and aligned payloads; models can also be sharded.[^gguf_spec2026] |
| Q4_K | Block Tensor Type | Stores 256 weights with four-bit codes and hierarchical scale/minimum metadata.[^ggmlKQuantLayout2026] |
| Q4_K_M | Model-Level Preset | Primarily Q4_K, with selected higher-precision tensors under architecture-dependent heuristics.[^llamaCppQuantImplementation2026] |
| llama.cpp | Inference Engine | C++ execution runtime that memory-maps GGUF files and offloads layers across CPU, CUDA, Metal, and ROCm. |

### The extensible metadata store and memory mapping

GGUF replaces older untyped hyperparameter lists with extensible typed metadata. Readers still need support for the architecture, required keys, tensor encodings, and format version; self-description doesn't guarantee every runtime can execute every GGUF.[^gguf_spec2026] Inspecting loader version requirements alongside container metadata prevents silent tensor-type mismatches at startup.

A model GGUF can package:

- Architecture specifications (tensor names, normalization epsilon, context lengths, RoPE frequency constants)
- Tokenizer information (vocabulary, applicable merge rules, special token IDs, and chat templates)
- Tensor descriptors (names, dimensions, types, and aligned payload offsets)

Alignment defaults to 32 bytes and can be specified in metadata. A compatible CPU path can view memory-mapped file data without an initial copy into a separate host buffer. Pages still need to be read and made resident as used. Discrete-GPU placement generally needs transfers. Account for this loading work between mapping the address range and completing the first request. Page faults and eviction can dominate a cold run.

### Hierarchical k-quant blocks and layer presets

Traditional block quantization applies a single scale per block of 32 weights. The k-quant family (such as `Q4_K` and `Q5_K`) uses hierarchical **super-blocks**:

- `Q4_K` groups 256 weights into a super-block.
- The super-block divides into 8 sub-blocks of 32 weights each.
- Each sub-block has a six-bit scale and six-bit minimum coefficient, packed into twelve metadata bytes across the super-block.
- Two FP16 values scale the scale coefficients and minimum coefficients, respectively.

The block is exactly $128+12+4=144$ bytes for 256 weights: **4.5 bits per weight**, including **0.5** metadata bits. Its reconstructed value has form $d\,s_i q-d_{\min}m_i$; the offset isn't necessarily an integer zero-point on the code grid.[^ggmlKQuantLayout2026]

**Q4_K_M names a model-level preset.** The inspected quantizer upgrades selected value/down projections to Q6_K, with additional model-specific exceptions. These heuristics produce a mixture of tensor types.[^llamaCppQuantImplementation2026] Inspect the emitted tensors when estimating size or comparing presets, and evaluate projection sensitivity for the model being quantized.

<figure>
  <img src="illustrations/_generated/gguf_block_bytes_dark.png" alt="A GGUF file lays out a header, typed key-value metadata, tensor descriptors containing names, shapes, types, and offsets, then aligned tensor payloads. The enlarged Q4_K superblock contains 256 weights in eight groups of 32, 128 code bytes, 12 packed bytes for eight six-bit scale and minimum pairs, and two FP16 super-scales totaling four bytes. The complete 144-byte block stores 4.5 bits per weight and reconstructs values with d times s_i times q minus d_min times m_i." />
  <figcaption>Q4_K’s 144-byte layout combines packed codes, local coefficients, and two super-scales. Alignment and tensor presets shape the surrounding file.</figcaption>
</figure>

### Granular CPU-GPU layer offloading

When an LLM exceeds available GPU memory, llama.cpp enables split CPU-GPU execution through the `-ngl` (`--n-gpu-layers`) flag. Offloading selects a **trailing** portion of the blocks, and version-sensitive counting in the source inspected on September 22, 2026 includes the output layer in the count. For a simple 40-block model with a GPU backend, `-ngl 24` selects blocks 17 through 39 plus the output layer while leaving the input-layer assignment on CPU.[^llamaCppLayerPlacement2026]

<!-- leetllm: test, output=show -->
```python title="offload-count.py"
blocks, requested = 40, 24
start = max(blocks + 1 - requested, 0)  # Includes output slot `blocks`.
gpu_blocks = [i for i in range(blocks) if i >= start]
output_on_gpu = blocks >= start
assert gpu_blocks == list(range(17, 40)) and output_on_gpu
assert len(gpu_blocks) + int(output_on_gpu) == requested
print("GPU blocks:", gpu_blocks[0], "through", gpu_blocks[-1])
print("repeating blocks:", len(gpu_blocks), "output layer:", output_on_gpu)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
GPU blocks: 17 through 39
repeating blocks: 23 output layer: True
```
<!-- leetllm: output:end -->

The graph and backend determine activation transfers, cache placement, and which operations run on which device. GPU placement doesn't guarantee Tensor Core execution or peak speed. Check your installed version's help and allocation logs, especially with tensor overrides or multiple devices.

Partial offload can make a larger artifact usable, with CPU work and transfers in the latency budget. Different backends can also differ numerically. Measure task quality as well as memory and speed.

This capacity check packs trailing **block payloads** until an explicit reserve is reached rather than reimplementing llama.cpp's runtime allocator and output-layer accounting. The 2,000 MB reserve stands in for KV cache, activations, and context scratch buffers on the target GPU. In production serving, KV-cache growth across active sequence lengths determines how much headroom that reserve truly needs.

<!-- leetllm: test, output=show -->
```python title="layer-placement.py"
layer_mb = [1000, 2000, 1500, 500]  # Per-block sizes in decimal MB.
device_mb, reserve_mb = 6000, 2000
available = device_mb - reserve_mb
assert available >= 0
used = 0
gpu_layers = []
for index in reversed(range(len(layer_mb))):
    size = layer_mb[index]
    if used + size > available:
        break
    gpu_layers.append(index)
    used += size
cpu_layers = [i for i in range(len(layer_mb)) if i not in gpu_layers]
assert sorted(gpu_layers) == [1, 2, 3]
assert sum(layer_mb[i] for i in cpu_layers) + used == sum(layer_mb)
assert used + reserve_mb <= device_mb
print("CPU layers:", cpu_layers, "MB:", sum(layer_mb[i] for i in cpu_layers))
print("GPU layers:", sorted(gpu_layers), "MB:", used)
print("GPU total including reserve:", used + reserve_mb, "MB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
CPU layers: [0] MB: 1000
GPU layers: [1, 2, 3] MB: 4000
GPU total including reserve: 6000 MB
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/gguf_offload_dark.png" alt="For the version-pinned 40-block llama.cpp example, requesting 24 GPU layers selects transformer blocks 17 through 39, the output layer, and leaves input assignment on CPU. In the four-block capacity trace, a 6,000 MB GPU budget reserves 2,000 MB, then fits trailing blocks 1, 2, and 3 at 2,000, 1,500, and 500 MB; block 0 at 1,000 MB stays on CPU. The diagram traces host mapping through page read and device copy." />
  <figcaption>Trailing blocks 1–3 consume 4,000 MB and leave 2,000 MB reserved while block 0 stays on CPU. Actual offload placement reflects the backend’s full tensor layout and KV allocation.</figcaption>
</figure>

From a llama.cpp source checkout with its conversion dependencies installed, a supported checkpoint's conversion and quantization are separate commands:

```bash title="terminal"
python convert_hf_to_gguf.py /path/to/checkpoint --outfile model-bf16.gguf --outtype bf16
./build/bin/llama-quantize model-bf16.gguf model-Q4_K_M.gguf Q4_K_M
```

Keep the unquantized BF16 GGUF intact so you can re-quantize to alternative presets without re-downloading or cascading quantization noise.[^llamaCppQuantize2026]

For multimodal use, the encoder/projector may need a separate `mmproj` artifact. Converting only the language component doesn't preserve image/audio input support, and those additional tensors need their own memory budget.[^llamaCppQuantize2026] Budgeting VRAM across both the language decoder and vision projector prevents unexpected out-of-memory failures once multimodal prompts arrive.

## Evaluating quantized artifacts beyond perplexity

Perplexity is the exponentiated average negative log-likelihood on a specified tokenized dataset; lower is better. A small relative change in prose perplexity does not show preserved code correctness, schema adherence, or reasoning. The dataset, tokenizer, context policy, and task matter.

This four-weight example compares reconstruction grids on three held-out activation columns. It computes output MSE and **ideal code-byte counts**. The NumPy arrays remain floating-point; this snippet doesn't pack bytes or execute low-bit kernels.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="held-out-quantization.py"
import numpy as np

W = np.array([[0.3, -1.2, 2.0, 0.7]])
X = np.array([[2.0, -1.0, 3.0], [1.0, 2.0, -1.0],
              [-1.0, 0.5, 2.0], [0.2, -2.0, 1.0]])
for bits in (2, 4, 8):
    qmax = 2 ** (bits - 1) - 1
    scale = float(np.max(np.abs(W))) / qmax
    restored = np.clip(np.rint(W / scale), -qmax, qmax) * scale
    mse = float(np.mean(((W - restored) @ X) ** 2))
    payload_bytes = (W.size * bits + 7) // 8
    print(f"{bits}-bit: payload {payload_bytes} bytes, held-out output MSE {mse:.6f}")
    assert np.all(np.abs(restored) <= np.max(np.abs(W)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
2-bit: payload 1 bytes, held-out output MSE 1.007200
4-bit: payload 2 bytes, held-out output MSE 0.067010
8-bit: payload 4 bytes, held-out output MSE 0.000204
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/precision_comparison_dark.png" alt="For four weights [0.3, minus 1.2, 2, 0.7], three quantization grids reconstruct 8-bit [0.2992, minus 1.1969, 2, 0.6929], 4-bit [0.2857, minus 1.1429, 2, 0.5714], and 2-bit [0, minus 2, 2, 0]. The first held-out output contraction uses activation column [2, 1, minus 1, 0.2]. Across all three columns, baseline-minus-reconstruction errors yield MSE values 0.000204, 0.067010, and 1.007200. Ideal code payloads are 4, 2, and 1 bytes; scale bytes are excluded." />
  <figcaption>For this four-weight example, residuals across three outputs produce the listed MSE values. The arrays remain floating-point and byte counts cover codes alone.</figcaption>
</figure>

### The perplexity trap in downstream tasks

Why does the two-bit result change so much? This **narrow symmetric** quantizer has only three used codes, $-1,0,1$, with step two. Try another group size or asymmetric grid. The example measures output error for this linear layer. Full-model perplexity and task behavior require their own evaluation.

Task evaluation should include executable code tests, parsed/schema-validated outputs, and scored instruction constraints. Probability changes can alter generated tokens; a failure doesn't uniquely identify a particular projection or calibration domain. With unconstrained generation, fluent prose and malformed JSON can coexist.

### Controlled paired benchmarking

Reload the exported artifact and compare it with its source model. Keep task inputs and decoding policy controlled while recording each path's actual kernels and precision:

1. **Control variables**: Pin tokenizer vocabulary, chat templates, system prompts, sampling temperature, and repetition penalties.
2. **Held-out task evaluation**: Test on realistic validation suites (such as HumanEval code generation, JSON parsing benchmarks, and multi-turn dialog) completely disjoint from calibration datasets.
3. **Runtime latency profiling**: Measure end-to-end TTFT, delivered inter-token gaps, aggregate output tokens/s, and peak device memory under chosen batch/context distributions. TTFT includes queueing and other work beyond prefill. ITL isn't aggregate throughput. Separate cold loading/JIT from warmed service, and record cache settings.

Use seeds and repeated trials for stochastic decoding. Outputs can still differ across backends that share a seed. Report measured quality differences alongside speed and memory after reloading the exported file.

<figure>
  <img src="illustrations/_generated/quantization_decision_dark.png" alt="The same held-out inputs pass through a source baseline and an exported, reloaded candidate with matching tokenizer, chat template, and decoding controls. Paired bars on a shared axis compare baseline and 4-bit outputs for three held-out columns: minus 2.460 versus minus 2.457 (difference minus 0.003), minus 3.100 versus minus 2.714 (difference minus 0.386), and 6.800 versus 6.571 (difference plus 0.229). Artifact identity, task quality, and serving profile are checked as three separate evidence streams." />
  <figcaption>The x₁ column carries most of the rounding error, a shift of 0.386 that the other two columns barely show. Paired comparisons on shared held-out inputs expose exactly this kind of uneven drift.</figcaption>
</figure>

### Diagnostic troubleshooting playbook

Use each symptom to choose the next check. Confirm a cause with evidence before applying a repair:

- **Symptom: JSON parsing fails or code syntax breaks while English answers look fluent.**
  Check reload, tokenizer/template, decoding constraints, and paired held-out task results first. If calibration drift is supported by evidence, change its domain mix and measure recovery on held-out code and JSON tasks. Choose repairs for the artifact's actual quantizer, encoding, and runtime.
- **Symptom: High decode latency despite 4-bit weight compression.**
  Inspect device placement, actual kernel dispatch, unpacking/conversion, cache traffic, batching, and queueing. Compare with BF16 under the same workload. Supported fused kernels help only when their savings exceed their costs.
- **Symptom: High prefill latency during prompt ingestion.**
  Profile GEMM, attention, conversion, and scheduling. If arithmetic is limiting, compare a supported W8A8/FP8 path with an explicit quality budget. If queueing or cache work dominates, a different weight encoding may barely change TTFT.

## Mastery check

```mastery-quiz
[
  {
    "question": "An affine grid covers real −2 to 3 with unsigned codes 0…15. Which scale and zero-point pair also represents real zero?",
    "options": [
      "S=1/3, Z=0.",
      "S=5/16, Z=6.",
      "S=1/3, Z=6.",
      "S=1/3, Z=−2."
    ],
    "answer": "S=1/3, Z=6.",
    "explanation": "The scale is (3−(−2))/15=1/3. Real zero maps to code 6. The −2 zero-point belongs to the signed −8…7 relabeling, which reconstructs the same real values."
  },
  {
    "question": "Two groups have integer dot-product partials 8 and −3, with scales .5 and 2. What is their combined reconstructed output?",
    "options": [
      "−2.0, by adding .5×8 and 2×(−3).",
      "2.5, by scaling the sum 5 by .5.",
      "10.0, by scaling the sum 5 by 2.",
      "5.0, by adding 8 and −3 without scales."
    ],
    "answer": "−2.0, by adding .5×8 and 2×(−3).",
    "explanation": "Each group owns its scale. The contributions are 4 and −6, giving −2. A single outer scale or an unscaled sum changes this reduction."
  },
  {
    "question": "H=[[10, 2],[2, 2]]. After fixing the first weight, what inverse belongs to the remaining one-coordinate quadratic?",
    "options": [
      "The old full inverse diagonal .625.",
      "The old full inverse off-diagonal −.125.",
      "The remaining Hessian entry 2.",
      "The inverse of the remaining block, .5."
    ],
    "answer": "The inverse of the remaining block, .5.",
    "explanation": "The still-free Hessian block is[2], whose inverse is[.5]. The old full inverse is[[.125, −.125],[−.125,.625]], so retaining its .625 entry would use a different active problem."
  },
  {
    "question": "A weight .4 multiplies input 6. Scale the weight by 4 and inversely scale its input. A declared shared grid then rebuilds the transformed weight as 1.5. What are this channel’s contributions before and after rounding?",
    "options": [
      "Before 2.4; after 9.0.",
      "Before 2.4; after 2.25.",
      "Before 38.4; after 36.0.",
      "Before 2.4; after 2.4."
    ],
    "answer": "Before 2.4; after 2.25.",
    "explanation": "The transformed input is 6/4=1.5. Before rounding,1.6×1.5=2.4; after rounding,1.5×1.5=2.25. Keeping input 6 or assuming exact invariance after rounding changes the stated computation."
  },
  {
    "question": "Two complete Q4_K blocks hold512 weights. Including the declared local coefficients and super-scales, what do they occupy?",
    "options": [
      "256 bytes, totaling 4.0 bits per weight.",
      "280 bytes, totaling 4.375 bits per weight.",
      "288 bytes, totaling 4.5 bits per weight.",
      "320 bytes, totaling 5.0 bits per weight."
    ],
    "answer": "288 bytes, totaling 4.5 bits per weight.",
    "explanation": "Each256-weight block contains128 code bytes, 12 local-coefficient bytes and 4 super-scale bytes. Two blocks occupy 288 bytes; 288×8/512=4.5 bits per weight."
  },
  {
    "question": "A model has repeating blocks numbered 0 through 11, followed by an output layer. The input layer stays on the CPU. The runtime fills six GPU slots, one layer per slot, starting at the output and working backward. What is the lowest-numbered repeating block on the GPU?",
    "options": [
      "Block 0",
      "Block 6",
      "Block 7",
      "Block 8"
    ],
    "answer": "Block 7",
    "explanation": "The output uses one slot. The other five hold blocks 11, 10, 9, 8, and 7. Starting at block 0 would take five blocks from the front of the model. Starting at block 6 would use all six slots for repeating blocks and leave no slot for the output. Starting at block 8 would leave a slot unused, as if the input also needed a GPU slot."
  },
  {
    "question": "A standalone path first reads2 MB of codes/scales, then writes and rereads8 MB of reconstructed weights. Excluding all other traffic, how many weight-related MB does it move?",
    "options": [
      "2 MB; reconstructed weights require no memory traffic.",
      "8 MB; only the multiplication’s final read counts.",
      "10 MB; the reconstructed matrix is transferred once.",
      "18 MB; compact read plus full-matrix write and read."
    ],
    "answer": "18 MB; compact read plus full-matrix write and read.",
    "explanation": "The declared traffic is 2+8+8=18 MB. A fused implementation can avoid the full reconstructed matrix’s global-memory round trip. This byte comparison alone does not predict measured latency."
  },
  {
    "question": "A 48 GB GPU reserves 4 GB for the runtime. It holds 8 GB of weights that stay at full precision. The remaining weights shrink from 16 GB to 4 GB. Each user needs 0.5 GB of KV cache. Which calculation gives the maximum number of users who fit in memory before and after quantization?",
    "options": [
      "(48 − 28) / 0.5 before and 4 × (48 − 28) / 0.5 after.",
      "(48 − 28) / 0.5 before and (48 − 16) / 0.5 after.",
      "(48 − 12) / 0.5 before and (48 − 12) / 0.5 after.",
      "(48 − 28) / 0.5 before and (48 − 13) / 0.5 after."
    ],
    "answer": "(48 − 28) / 0.5 before and (48 − 16) / 0.5 after.",
    "explanation": "The reserve and weights occupy 4 + 8 + 16 = 28 GB before quantization and 4 + 8 + 4 = 16 GB after. The cache pool grows from 20 to 32 GB. At 0.5 GB per user, the limit rises from 40 to 64 users. Multiplying 40 by four applies the weight compression factor to user capacity. Subtracting just 12 GB counts only the reserve and the full-precision weights. Subtracting 13 GB after quantization cuts the reserve from 4 GB to 1 GB and gives 70 users. The runtime still needs all 4 GB."
  },
  {
    "question": "Each artifact receives 200 held-out requests. The source has 170 parse-valid and 154 fully correct results; the candidate has 186 parse-valid and 142 fully correct. Which task-success comparison uses all requests?",
    "options": [
      "77%→71%; parsing improved while full success fell.",
      "90.6%→76.3%; use only parse-valid requests in each denominator.",
      "85%→93%; parsing counts define full task success.",
      "77%→93%; combine source correctness with candidate parsing."
    ],
    "answer": "77%→71%; parsing improved while full success fell.",
    "explanation": "Full correctness is 154/200=77% versus 142/200=71%. Parsing rose from 85% to 93%, a different outcome. Dividing by only parse-valid requests changes the population and hides some failures."
  },
  {
    "question": "A 4B-weight worksheet has a 4 GB device, .5 GB other allocations and 1.25 GB cache. A uses 4-bit codes plus a 2-byte scale per64 weights; B uses 4.5-bit Q4_K blocks. Which complete totals follow?",
    "options": [
      "A 3.75 GB; B3.75 GB, because both labels say four-bit.",
      "A 4.125 GB; B4 GB, because A’s scales need .375 GB.",
      "A 3.875 GB; B4 GB, with no headroom for B in this worksheet.",
      "A 3.875 GB; B4.5 GB, because block metadata is .75 GB."
    ],
    "answer": "A 3.875 GB; B4 GB, with no headroom for B in this worksheet.",
    "explanation": "A’s codes use2 GB and its scales .125 GB, totaling 3.875 GB with the listed allocations. B’s blocks use2.25 GB, totaling 4 GB exactly. Omitted allocations, operating headroom, runtime compatibility and task quality still require evidence."
  }
]
```

> **Next:** Continue to [Local LLM Deployment](/learn/local-llm-deployment-hardware-quantization). You can now distinguish the quantization method, tensor encoding, and container. The next lesson turns an artifact into a local deployment with measured memory, latency, and task quality.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
You have a 54 GB model and a device with 24 GB of memory. Four-bit codes plus scales would bring the weight payload down to about 14 GB, leaving capacity to investigate the remaining allocations. You quantize it, run your evaluation, and perplexity barely moves. You ship. Two weeks later someone notices that a tool integration has been failing: the model now produces fluent prose and quietly malformed JSON arguments. Nothing crashed, and your metric didn't notice, because prose perplexity was never measuring that.

Quantization is the most tempting optimization in this part of the book, because the savings are so large and so easy to compute. It replaces numerical values with a much smaller set of codes. That part is simple arithmetic. Everything hard about it comes down to two questions: which rounding errors actually hurt, and whether your runtime can turn smaller files into real speed.

You'll hear three names constantly, and they aren't three alternatives. **GPTQ** and **AWQ** are methods for choosing good codes. **GGUF** is a file format for storing them. This chapter explains what each one does, why a four-bit model isn't really four bits, and how to tell whether a quantized artifact deserves to serve traffic.

## Start with the payoff

The arithmetic starts as bits times weights. For 27 billion weights, each bit you drop saves about 3.4 GB, so BF16's 54 GB becomes 27 GB at eight bits and 13.5 GB at four. Here's the whole table, with one more line than you'd expect.

<!-- leetllm: test, output=show, id=reader-quant-weight-memory -->
```python title="weight-memory.py"
parameters = 27_000_000_000
for bits in (16, 8, 4, 3):
    payload = (parameters * bits + 7) // 8
    print(f"{bits:2}-bit payload: {payload / 1e9:.3f} GB")
scale_bytes = ((parameters + 127) // 128) * 2
print(f"INT4 scale overhead: {scale_bytes / 1e9:.3f} GB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
16-bit payload: 54.000 GB
 8-bit payload: 27.000 GB
 4-bit payload: 13.500 GB
 3-bit payload: 10.125 GB
INT4 scale overhead: 0.422 GB
```
<!-- leetllm: output:end -->

That last line is the first hint that things are more complicated than bits times weights. Let's see where it comes from.

## Rounding onto a grid

To quantize a weight $w$, you pick a positive scale $S$ and an integer zero-point $Z$:

$$
q=\operatorname{clip}\left(\operatorname{round}(w/S)+Z,q_{\min},q_{\max}\right),
\qquad
\hat w=S(q-Z).
$$

Picture a ruler. The scale sets the spacing between its marks, and the zero-point chooses which mark means real zero. Each weight snaps to the nearest mark. With spacing $0.1$, the value $0.73$ rounds to code seven and comes back as $0.7$. The lost $0.03$ is rounding error.

Clipping is a different kind of error. Values beyond the ends of the ruler get pinned to the last mark. Stretch the ruler to fit an extreme value, and you waste resolution on all the ordinary ones. Shrink it, and you clip the extremes. There's no setting that avoids both, which is why the useful question becomes how each error affects the layer's output.

Conventions matter too. A symmetric signed four-bit format might use codes from $-7$ to $7$ and leave $-8$ unused. An asymmetric range can move zero to spend its levels on a skewed interval. "Four bits" alone doesn't tell you the format, so record the convention.

## Bytes on disk

A Python list of small integers isn't a four-bit layout. Real savings need packing, so two four-bit nibbles share each byte. Signed codes need a defined representation, and an odd count needs padding plus a stored length.

Take the weights $[0.15,-1.22,2.40,-0.45,0.73]$. A symmetric scale of $2.4/7$ gives codes $[0,-4,7,-1,2]$. Packed with the low nibble first, they become the hexadecimal bytes C0, F7, and 02.

<!-- leetllm: test, output=show, id=reader-quant-pack -->
```python title="pack-four-bit-codes.py"
import struct

weights = [0.15, -1.22, 2.40, -0.45, 0.73]
scale = max(map(abs, weights)) / 7
codes = [max(-7, min(7, round(w / scale))) for w in weights]
nibbles = [q & 15 for q in codes]
if len(nibbles) % 2:
    nibbles.append(0)
payload = bytes(a | (b << 4)
                for a, b in zip(nibbles[::2], nibbles[1::2]))
blob = struct.pack("<Id", len(weights), scale) + payload

count, saved_scale = struct.unpack("<Id", blob[:12])
decoded = []
for byte in blob[12:]:
    for nibble in (byte & 15, byte >> 4):
        decoded.append(nibble - 16 if nibble >= 8 else nibble)
decoded = decoded[:count]
restored = [q * saved_scale for q in decoded]
assert codes == decoded == [0, -4, 7, -1, 2]
assert payload.hex() == "c0f702"
print("code bytes:", payload.hex())
print("total bytes:", len(blob))
errors = [abs(a - b) for a, b in zip(weights, restored)]
print("mean absolute error:", round(sum(errors) / count, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
code bytes: c0f702
total bytes: 15
mean absolute error: 0.091
```
<!-- leetllm: output:end -->

Three bytes of codes, and a 15-byte file. The rest is the count and the scale. On five weights that overhead looks absurd. At scale it's small but real.

<figure>
  <img src="illustrations/_generated/quantization_pipeline_dark.png" alt="Five weights map to signed four-bit codes and pack into three bytes, with a count and scale header." />
  <figcaption>From top to bottom: each weight snaps to the nearest grid value, the rounded code is written as four bits, and pairs of codes share a byte. The scale and count travel with the data, because the codes mean nothing without them.</figcaption>
</figure>

Now you can explain that overhead line. One group of 128 four-bit weights takes 64 code bytes. Add one two-byte scale and it's 66 bytes, or 4.125 bits per weight. Across 27 billion weights, those scales add 0.42 GB, for a total of 13.92 GB before anything else. Real grouping follows tensor boundaries, so partial groups, zero-points, tensors kept at higher precision, and alignment can all add more. A model's loaded memory also includes the KV cache and the kernel's temporary buffers. Add up the actual tensor inventory, because the parameter count on a model card won't tell you what fits.

## Which values share a ruler?

A single scale for a whole tensor is compact, but one huge value stretches the ruler for everybody else. Per-channel scales contain the damage to one channel. Per-group scales go further, dividing channels into smaller units, at the price of more metadata and more complex kernels. The 128-weight group above is an example of this last category.

The important shift is what you're trying to protect. A weight error of 0.05 on a channel whose activations are tiny barely matters. The same error on a channel with huge activations can matter a lot. Errors can also reinforce each other or cancel out once they're multiplied by real inputs. So stop thinking about weights in isolation. For a weight matrix $W$ and calibration inputs stored as columns of $X$, the natural objective is

$$
\min_{\hat W}\|WX-\hat WX\|_F^2.
$$

In words: keep the layer's outputs close on data that looks like real traffic. Both of the methods below start from this idea, and both depend on your calibration data representing what the model will actually see.

## GPTQ: fix the error as you go

GPTQ rounds weights one at a time and, after each rounding, adjusts the weights it hasn't rounded yet to compensate for the error it just introduced.[^frantar2023] For one row with error $e=w-\hat w$,

$$
\|eX\|_2^2=eXX^\mathsf{T}e^\mathsf{T},
\qquad H=2XX^\mathsf{T}.
$$

The matrix $H$ tells you how channels interact. Its diagonal captures how much energy each channel carries, and its off-diagonal terms capture how channels move together. When two channels are correlated, an error in one can be partly cancelled by a deliberate shift in the other.

Here's the whole trick at the smallest possible size. Take $w=[1.2,0.61]$ with calibration columns $[5,1]$ and $[4,1]$. Round the first weight to one. That leaves an error of 0.2 on the first channel. Now choose the second weight that makes the total output error smallest on these inputs. Setting the derivative to zero gives the update below, where the numerator is the dot product of the two channels' activations, $5\times1+4\times1$, and the denominator is the second channel's energy, $1^2+1^2$:

$$
0.61+(1.2-1)\frac{5+4}{1^2+1^2}=1.51.
$$

Round that and you get $[1,2]$, where independent rounding would give $[1,1]$. The second weight moved a long way from where it started, on purpose. Calibration error improves slightly, from 0.5402 to 0.5002. Now look at what happens on different inputs:

<!-- leetllm: test, output=show, id=reader-quant-compensation -->
```python title="two-weight-compensation.py"
original = (1.2, 0.61)
calibration = [(5.0, 1.0), (4.0, 1.0)]
held_out = [(1.0, 0.0), (0.0, 1.0)]

def squared_error(candidate, inputs):
    return sum(
        sum((w-q)*x for w, q, x in zip(original, candidate, row))**2
        for row in inputs
    )

first = round(original[0])
cross = sum(a*b for a, b in calibration)  # channels' dot product
energy = sum(b*b for _, b in calibration)  # second channel's energy
updated_second = original[1] + (original[0]-first)*cross/energy
naive = tuple(map(round, original))
compensated = (first, round(updated_second))
assert abs(updated_second - 1.51) < 1e-12

def both(rows):
    return [round(squared_error(c, rows), 4)
            for c in (naive, compensated)]

assert both(calibration)[1] < both(calibration)[0]
assert both(held_out)[1] > both(held_out)[0]
print("updated second:", round(updated_second, 2))
print("calibration", *both(calibration))
print("held-out", *both(held_out))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
updated second: 1.51
calibration 0.5402 0.5002
held-out 0.1921 1.9721
```
<!-- leetllm: output:end -->

On the held-out inputs, error jumped from 0.1921 to 1.9721, nearly ten times worse. The two-weight model amplifies that jump because one integer grid step exceeds the underlying weight update, whereas across real transformer evaluations GPTQ mean task accuracy typically shifts by roughly 0.9 to 1.6 percentage points across calibration sets.[^williams2024calibration] Even with smaller real-world shifts, the mechanism stays the same: GPTQ fits the activations it sees during calibration, so a mismatched calibration corpus steers compensation updates in the wrong direction.

<figure>
  <img src="illustrations/_generated/gptq_awq_mechanics_dark.png" alt="Calibration error contours favor compensating a first rounded weight, while held-out identity inputs expose higher error for the compensated result." />
  <figcaption>Hessian compensation lowers reconstruction error on seen calibration activations while raising error nearly tenfold on mismatched held-out inputs.</figcaption>
</figure>

The full algorithm uses stable factorizations, damping, and blocked updates to avoid repeatedly inverting shrinking matrices, so don't mistake this two-weight sketch for an implementation.[^gptqImplementation2026] The practical takeaway is about records: calibration is part of the artifact. Keep its domain, its sampling policy, the tokenizer and template, the quantizer settings, and the held-out results with the model. A better calibration score can coexist with worse behavior downstream.

## AWQ: move the mark before you round

AWQ takes a different route. Rather than repairing errors after rounding, it changes the coordinates beforehand, using activation statistics to protect the channels that matter.[^lin2023] For a positive diagonal matrix $D$,

$$
WX=(WD)(D^{-1}X).
$$

Before quantization that's the same computation, just multiplied and divided by the same thing. After quantization it isn't. Scale a channel up before rounding and scale it back afterward, and that channel gets a finer effective grid. The trade-off is that a larger channel stretches the shared ruler, and its neighbors get coarser marks. AWQ searches restricted scaling choices and measures the result. The full method also handles clipping, and eligible model graphs can absorb the inverse scaling into earlier operations.[^awqImplementation2026]

Try it on $W=[0.3,2]$, with calibration columns $[10,1]^{\mathsf{T}}$, $[8,-1]^{\mathsf{T}}$, $[-10,1]^{\mathsf{T}}$, and $[-8,-1]^{\mathsf{T}}$. Notice that the first channel's activations are about ten times larger than the second's. We hold back $[9,0.5]^{\mathsf{T}}$ and $[-9,-0.5]^{\mathsf{T}}$ as a test. For each candidate factor $a$, set $D=\operatorname{diag}(a,1)$ and quantize both transformed weights on one symmetric grid with step $S=\max_j |(WD)_j|/7$, rounding and clipping the codes to $[-7,7]$, then undo $D$.

Factors of one, two, and four all reconstruct the first weight near 0.2857. Factor eight reconstructs it exactly as 0.3, and it moves the neighbor to about 2.0571. So we gave up accuracy on the second weight, whose activations are small, to perfect the first, whose activations are large. The remaining calibration error comes only from that second weight: its activations have magnitude one, so MSE is about $0.0571429^2=0.003265$. On the held-out columns, its activations have magnitude 0.5, giving about $(0.5\times0.0571429)^2=0.000816$.

<figure>
  <img src="illustrations/_generated/awq_channel_coordinate_transform_dark.png" alt="Scaling the first channel of a two-weight layer changes which values the quantization grid protects." />
  <figcaption>Scaling up the channel with large activations gives it a finer grid. At factor eight, the first weight comes back exact and the second moves slightly, because the second channel's small activations make that error cheap.</figcaption>
</figure>

Both methods use calibration activations, but they do different things with them. GPTQ responds to rounding errors. AWQ changes what the rounding sees. Neither name tells you the packed layout, group size, zero-point convention, or which kernels will run, so a model labeled "GPTQ" still leaves you with several questions to answer.

## Does smaller mean faster?

Sometimes. This is where teams get surprised, so let's reason it through with the [roofline from the inference chapter](/learn/inference-mechanics-ttft-tps-kv-cache).

Remember that low-batch decode is often limited by how fast weights move through memory. For that simple picture, arithmetic intensity is $2/\text{bytes per weight}$, so BF16 sits at one FLOP per byte, which on an H100 is the 0.34% of compute peak you saw in that chapter. Shrinking weights to half a byte each attacks exactly that limit. In that chapter's idealized estimate, 54 GB of weights on an H100 capped one stream at about 62 tokens per second. At 13.92 GB, the same arithmetic gives about 240.

Whether you see any of that depends on the execution path.

**W4A16** means four-bit weights with 16-bit activations. A *fused* kernel unpacks and rescales weights right next to the multiplication, so the small codes are what cross the memory bus.[^hoque2024splitK] A standalone path writes out a full floating-point matrix to device memory and reads it back, which gives away most of the traffic saving you just paid for. Huawei's Ascend 910 shows the cost: its unpacking and multiplying units talk only through global memory, and W4A16 there reached at most 1.48 times the speed of FP16, where the smaller weights alone promised about four times.[^he2026ascendW4A16]

<figure>
  <img src="illustrations/_generated/w4a16_memory_path_h100_dark.png" alt="A fused path unpacks weights near multiplication; a standalone path writes and rereads a full-precision matrix. On an H100, the memory ceiling at one FLOP per byte is 0.34 percent of the compute peak." />
  <figcaption>Two paths through the same four-bit file. The fused kernel moves small codes across the memory bus, while the standalone path re-creates a full matrix in memory and loses most of the benefit. These ceilings are theoretical, so measure the kernel you actually run.</figcaption>
</figure>

Unpacking also costs work, so some workloads speed up and others slow down when conversion outweighs the bytes saved. As batch size grows, weights get reused across more rows and traffic matters less. Long contexts shift the load to KV reads. Prefill can have a different bottleneck entirely. And a W4A16 path that converts to FP16 doesn't gain any new arithmetic peak.

Keep three precisions separate in your head and your configuration: weights, activations, and the KV cache. A four-bit checkpoint doesn't imply a four-bit cache. Each user's [cache](/learn/kv-cache-paged-attention-llm-serving) stays exactly as large as it was unless you change its format separately, and that's its own decision with its own kernels and calibration.[^vllm2026kvquant]

Smaller weights still change how many users fit, though, because the cache pool is what's left after the weights. Go back to the 80 GB card from the [inference chapter](/learn/inference-mechanics-ttft-tps-kv-cache), with its 8 GB reserve and 5,120 cached positions per user:

<!-- leetllm: test, output=show, id=reader-quant-pool -->
```python title="pool-after-weights.py"
user_cache = 2 * 16 * 4 * 256 * 5120 * 2  # the same for both
recurrent = 48 * 48 * 128 * 128 * 4  # fixed state per user
for name, weights_gb in (("BF16", 54), ("four-bit", 13.92)):
    pool = round((80 - weights_gb - 8) * 10**9)
    users = pool // user_cache
    with_state = pool // (user_cache + recurrent)
    print(f"{name}: {pool / 1e9:.2f} GB pool, "
          f"{users} users, {with_state} with state")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
BF16: 18.00 GB pool, 53 users, 36 with state
four-bit: 58.08 GB pool, 173 users, 119 with state
```
<!-- leetllm: output:end -->

No user's cache got any smaller, and the pool grew 3.2 times anyway. Users go from 53 to 173, or from 36 to 119 once each one also pays for that chapter's recurrent state. That multiple comes from subtraction, so it depends on the card: the same 40 GB of savings on a 160 GB card would grow the pool only 1.4 times. So when someone says a "4-bit model" will serve more users, ask which of the three precisions they mean. Four-bit weights help through the pool, and a lower-precision cache helps through each user's share.

Fitting isn't serving, though. A decode step reads every active cache as well as the weights. With 173 full caches, that's about 58 GB of cache plus 14 GB of weights, or at least 21 ms a step at 3.35 TB/s, before any arithmetic. BF16 at 53 users moves the same 72 GB, so on memory traffic alone the gain holds. Arithmetic, prefill chunks, and queueing all grow with the batch too, so measure latency at the higher count before you promise it.

## GGUF is a container

GGUF packages typed key-value metadata, tensor descriptors, and aligned payloads for local inference.[^gguf_spec2026] It can carry architecture and tokenizer information right alongside each tensor's encoding. It's a file format, and you still need an engine and backend that understand your model and types.

Its Q4_K format shows why a label undersells the cost. A 256-weight superblock holds 128 code bytes, 12 packed bytes of group scale and minimum information, and two FP16 super-scales for another four bytes. That's 144 bytes, or 4.5 bits per weight, for something called four-bit.[^ggmlKQuantLayout2026]

<figure>
  <img src="illustrations/_generated/gguf_block_bytes_dark.png" alt="A GGUF container stores metadata, tensor descriptors, and aligned payloads; one Q4_K block uses 144 bytes for 256 weights." />
  <figcaption>Top: the layout of the whole file. Bottom: one Q4_K block, where 16 bytes of scale data bring a nominal 4 bits up to 4.5 bits per weight.</figcaption>
</figure>

Layer placement is a separate choice. Keeping some layers on the CPU can let a model run with limited device memory, at the cost of transfers and slower execution.

In llama.cpp, the `-ngl` flag sets how many layers go to the GPU, and it selects from the end of the model. The count is version-sensitive. The source inspected on September 22, 2026 includes the output layer, so a 40-block model at `-ngl 24` puts blocks 17 through 39 and the output layer on the GPU and leaves the input layer on the CPU.[^llamaCppLayerPlacement2026]

<!-- leetllm: test, output=show, id=reader-quant-offload -->
```python title="offload-count.py"
blocks, requested = 40, 24
# The output layer counts as slot number `blocks`.
start = max(blocks + 1 - requested, 0)
gpu_blocks = [i for i in range(blocks) if i >= start]
assert len(gpu_blocks) + 1 == requested
print("GPU blocks:", gpu_blocks[0], "through", gpu_blocks[-1],
      "plus the output layer")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
GPU blocks: 17 through 39 plus the output layer
```
<!-- leetllm: output:end -->

You may hear that memory-mapping the file makes all this cheap. It changes how the bytes get accessed, but the pages you need still have to become resident, and device copies don't vanish.

One rule will save you real pain: reload the saved artifact before you evaluate it. Testing the in-memory object that existed before export tells you nothing about whether the packed file reconstructs the same model. Pin the conversion tool, tensor types, tokenizer, template, runtime, and backend.

## Make the artifact earn its job

So how do you decide? Start by seeing how fast error grows as bits shrink. Here are four weights and three held-out input columns, with one shared symmetric grid at each width:

<!-- leetllm: test, output=show, id=reader-quant-bit-sweep -->
```python title="held-out-bit-sweep.py"
W = [0.3, -1.2, 2.0, 0.7]
X = [[2.0, -1.0, 3.0], [1.0, 2.0, -1.0],
     [-1.0, 0.5, 2.0], [0.2, -2.0, 1.0]]
for bits in (2, 4, 8):
    qmax = 2 ** (bits - 1) - 1
    scale = max(abs(w) for w in W) / qmax
    rebuilt = [max(-qmax, min(qmax, round(w / scale))) * scale
               for w in W]
    errors = [sum((w - r) * row[c]
                  for w, r, row in zip(W, rebuilt, X))
              for c in range(3)]
    mse = sum(e * e for e in errors) / 3
    payload = (len(W) * bits + 7) // 8
    print(f"{bits}-bit: {payload} payload bytes, "
          f"output MSE {mse:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
2-bit: 1 payload bytes, output MSE 1.007200
4-bit: 2 payload bytes, output MSE 0.067010
8-bit: 4 payload bytes, output MSE 0.000204
```
<!-- leetllm: output:end -->

Two bits leave this grid only three usable codes with a step of two, which is why that row falls off a cliff. This measures one linear layer. A whole model and a real task need their own evaluation, so compare a retained baseline with the reloaded candidate, on held-out inputs that look like your real tasks, with tokenizer, template, and decoding settings pinned.

Perplexity is a fine first signal for degradation, and it's a poor last word. A small change in prose perplexity says little about whether code still compiles, JSON still parses, tool arguments still validate, or long contexts still get used. Test those directly: executable code tests, schema validation, scored instructions, refusal behavior, and the slices of traffic you care about most. That's the check that would have caught the tool failure in our opening.

Control the output length, because a truncated answer can look wonderfully fast. Measure size with the scales and preserved tensors counted, and memory with the cache and the kernel's temporary buffers counted, since those are what actually have to fit. Time cold loading apart from warm serving, and keep failures and rejected requests in your latency numbers, or the slowest requests simply vanish from the report. Then write the decision down: the exact artifact, its compatibility checks, the quality change, and the measured latency and memory. Record what got worse too. A format that fits one backend can be wrong for another.

When something does go wrong, let the symptom choose your next check, and confirm a cause before you repair anything.

| What you see | Check first |
|---|---|
| JSON or code breaks while English looks fluent | Reload, tokenizer, template, decoding constraints, then paired held-out results. Change the calibration mix only if the results point there. |
| Decode stays slow despite four-bit weights | Device placement, the kernel actually dispatched, unpacking, cache traffic, batching, and queueing, compared with BF16 on the same workload |
| Prefill stays slow | Whether arithmetic is the limit at all. If queueing or cache work dominates, a different weight encoding may barely move TTFT. |

```checkpoint
Your four-bit candidate shows the same perplexity and cuts the weights from 54 GB to about 14 GB. A colleague wants to ship and also expects almost four times more concurrent users. What would you check before agreeing?
---
Check task behavior on held-out inputs from the reloaded file, such as schema validity and tool arguments, because perplexity can miss those failures. On users, quantizing the weights doesn't shrink the cache, but it does free room for it. On the 80 GB card from the [inference chapter](/learn/inference-mechanics-ttft-tps-kv-cache), 13.92 GB of weights leaves about 58 GB for the cache where 54 GB left 18, so on memory alone your colleague is close, at about 3.2 times. Whether those users get acceptable latency depends on decode work and scheduling, so measure that before you promise anything.
```

Passing these checks gets the model to production, but it doesn't keep it healthy there. The next task is to find out whether this exact artifact goes on meeting your standards once real requests flow, and to be able to investigate quickly when it doesn't. [Observability](/learn/observability-monitoring-llm-systems) connects each answer a user received to the versions that produced it.

<!-- leetllm: edition:reader:end -->
