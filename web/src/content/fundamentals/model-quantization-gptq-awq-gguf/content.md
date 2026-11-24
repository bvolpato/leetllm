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
A 27-billion-parameter model needs **54 GB** just to store its BF16 weights, far too large for a single 24 GB GPU. Pack those weights into 4-bit integer codes and the raw payload drops to **13.5 GB** (13.922 GB with one FP16 scale per 128 weights, or 12.966 GiB), suddenly bringing a 24 GB card into play once you budget the remaining VRAM for preserved FP16 tensors, KV cache, and workspace. (On real checkpoints such as Qwen3.6-27B, which also carries a vision encoder and hybrid recurrent/attention layers, always inspect the actual tensor inventory rather than multiplying the headline parameter count by 0.5 bytes.[^qwen3627b2026])

Three names dominate every quantization discussion, and engineers routinely mix their categories:

- **<span data-glossary="gptq">GPTQ</span>** and **<span data-glossary="awq">AWQ</span>** are **algorithms** for choosing good low-bit codes (GPTQ via Hessian error compensation; AWQ via activation-aware channel scaling).
- **<span data-glossary="gguf">GGUF</span>** is a **binary container format** (from `llama.cpp`) that bundles metadata, tokenizer tables, and typed tensor blocks for local execution.

Quantizing static weights cuts storage and decode memory traffic, while leaving activations and the <span data-glossary="kv-cache">KV cache</span> untouched unless you quantize them separately.

## From floating-point values to four-bit codes

Suppose a weight is $0.73$ and each integer step represents $0.1$. Dividing gives $7.3$, rounding stores integer code $7$, and multiplying back reconstructs $0.7$ with rounding error $0.03$. A general affine quantizer formalizes this with a positive scale $S$ and integer zero-point $Z$:

$$
q = \operatorname{clip}\left(\left\lfloor \frac{w}{S} \right\rceil + Z, q_{\min}, q_{\max}\right), \qquad \hat{w} = S \cdot (q - Z)
$$

Scale $S$ sets the spacing between representable marks, while $Z$ maps real zero to an integer code. Stretching $S$ to cover an outlier coarsens every ordinary weight; shrinking $S$ clips extreme values. To actually save RAM, you also have to pack those 4-bit codes two nibbles per byte (here using a symmetric signed $[-7, 7]$ range):

<!-- leetllm: test, output=show -->
```python title="pack-int4.py"
import struct

def encode(weights):
    scale = (max(abs(w) for w in weights) / 7) or 1.0
    codes = [max(-7, min(7, round(w / scale))) for w in weights]
    nibbles = [q & 15 for q in codes]
    if len(nibbles) % 2:
        nibbles.append(0)
    payload = bytes(nibbles[i] | (nibbles[i + 1] << 4) for i in range(0, len(nibbles), 2))
    return struct.pack("<Id", len(weights), scale) + payload

def decode(blob):
    count, scale = struct.unpack("<Id", blob[:12])
    codes = []
    for byte in blob[12:]:
        for n in (byte & 15, byte >> 4):
            codes.append(n - 16 if n >= 8 else n)
    codes = codes[:count]
    return codes, [q * scale for q in codes]

weights = [0.15, -1.22, 2.40, -0.45, 0.73]
blob = encode(weights)
codes, restored = decode(blob)
mae = sum(abs(w - r) for w, r in zip(weights, restored)) / len(weights)
print("codes:", codes, "payload:", blob[12:].hex(), f"({len(blob) - 12}B codes, {len(blob)}B total)")
print("restored:", [round(w, 3) for w in restored], "MAE:", round(mae, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
codes: [0, -4, 7, -1, 2] payload: c0f702 (3B codes, 15B total)
restored: [0.0, -1.371, 2.4, -0.343, 0.686] MAE: 0.091
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/quantization_pipeline_dark.png" alt="A shared signed INT4 grid maps five weights to codes [0, −4, 7, −1, 2]. The codes pack low nibble first into bytes C0, F7, and 02, with a zero high-nibble pad in the last byte. Decoding uses scale 2.4/7 and gives mean absolute error 0.091; the count and FP64 scale add a 12-byte header." />
  <figcaption>Five weights snap to signed INT4 codes and pack low-nibble-first into three bytes (`c0f702`) alongside the scale metadata.</figcaption>
</figure>

### Symmetric, asymmetric, and per-group grids

- **Symmetric ($Z = 0$):** $\hat{w} = S \cdot q$ with $S = \max(|w|) / q_{\max}$. No zero-point subtraction during dequantization.
- **Asymmetric ($Z \ne 0$):** Covers an uneven interval $[a, b]$ containing zero with $S = (b - a)/(q_{\max} - q_{\min})$ and $Z = \operatorname{clip}(q_{\min} - \lfloor a / S \rceil, q_{\min}, q_{\max})$. Useful for skewed weights and nonnegative ReLU outputs (note that SiLU takes negative values). Both GPTQ and AWQ commonly support asymmetric grids with zero-points.[^frantar2023][^huggingface2026awq]
- **Granularity (per-tensor vs. per-channel vs. per-group):** Sharing one scale across a whole tensor lets one outlier crush precision everywhere. **Per-group** quantization assigns a fresh scale every $g$ weights (typically $g = 128$), isolating outliers for just $16 / 128 = 0.125$ extra bits per weight ($4.125\text{ bpw}$ total). Remember that group scales belong *inside* the dot-product sum: each group scales its own partial sum!

<!-- leetllm: test, output=show -->
```python title="affine-range.py"
low, high = -1.0, 2.0
scale = (high - low) / 15
z_unsigned = round(-low / scale)
z_signed = -8 - round(low / scale)
values = [-2.0, -1.0, 0.0, 0.73, 2.0, 3.0]
u_codes = [max(0, min(15, round(w / scale) + z_unsigned)) for w in values]
restored = [round(scale * (q - z_unsigned), 2) for q in u_codes]
print(f"unsigned Z={z_unsigned}, signed Z={z_signed}")
print("codes:", u_codes, "-> restored:", restored)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unsigned Z=5, signed Z=-3
codes: [0, 0, 5, 9, 15, 15] -> restored: [-1.0, -1.0, 0.0, 0.8, 2.0, 2.0]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/affine_grid_and_group_ownership_dark.png" alt="An affine grid over real values from minus 1 to 2 uses scale 0.2 and zero code 5; the signed representation uses zero code minus 3. Values minus 2, minus 1, 0, 0.73, 2, and 3 map to restored values minus 1, minus 1, 0, 0.8, 2, and 2. Sixteen unsigned codes remain available. At the bottom, two weight groups retain separate scales through their partial sums." />
  <figcaption>An affine grid maps real zero to code 5 (unsigned) or −3 (signed), while per-group scales multiply each group's partial sum separately.</figcaption>
</figure>

```checkpoint
Two checkpoints both claim INT4 precision, yet one is 10% larger on disk. What should you inspect first?
---
Check group size, zero-point storage, which layers were kept in FP16/BF16 (embeddings, LM head, norms), alignment padding, and container metadata.
```

## Why 4-bit weights speed up decode (W4A16)

Why compress weights to 4 bits if activations stay in 16-bit floating point? During low-batch decode, linear layers run at $I \approx 2 / \text{bytes per weight}$: just **1 FLOP/byte** in BF16, barely $0.65\%$ of an A100 80GB SXM's 312 dense FP16 TFLOPS compute peak (2,039 GB/s HBM, ridge point 153 FLOPs/byte).[^nvidia2026a100Specs]

**W4A16** cuts HBM weight traffic roughly $4\times$ by reading packed 4-bit codes and unpacking them *inside a fused kernel* right before the FP16 multiply-accumulate, avoiding writing an expanded FP16 matrix back to HBM. When prompts are long (prefill) or batches grow large, weight traffic stops dominating; at that point, accelerating compute requires quantizing activations too, via integer **W8A8** with SmoothQuant outlier migration[^xiao2023] or native **FP8**.[^micikevicius2022] Keep **KV cache precision** (such as FP8 KV cache in vLLM[^vllm2026kvquant]) distinct from weight precision: quantizing weights does not shrink any user's KV cache, though freeing weight VRAM expands the pool left for KV.

<figure>
  <img src="illustrations/_generated/w4a16_memory_path_dark.png" alt="Two decode data paths show packed INT4 weights read from HBM into a fused unpack, rescale, and FP16 multiply, alongside a standalone dequantization path that writes a full FP16 matrix to HBM and reads it again. The simplified weight-read comparison is 2 bytes per BF16 weight versus 0.5 code bytes plus scale metadata. The A100 roofline values give a ridge of about 153 FLOPs per byte; intensity one reaches 0.65 percent of nominal FP16 peak. KV-cache storage remains a separate budget." />
  <figcaption>Fused W4A16 kernels unpack 4-bit codes in registers near the multiplier; standalone dequantization wastes HBM bandwidth writing and rereading FP16 weights.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/quantization_levels_dark.png" alt="On one 0 to 60 GB scale, a 27-billion-weight payload falls from 54 GB at BF16 to 27 GB at INT8, 13.5 GB of INT4 codes plus 0.421875 GB of group scales, and 10.125 GB of INT3 codes plus the same scales. The 24 GB line leaves other allocations to budget. One 128-weight INT4 group stores 64 code bytes and a 2-byte FP16 scale, totaling 4.125 bits per weight." />
  <figcaption>A 27B weight payload drops from 54 GB (BF16) to 13.92 GB (INT4 + g=128 FP16 scales), fitting comfortably inside a 24 GB card's total envelope once KV and workspace are budgeted.</figcaption>
</figure>

## GPTQ: Hessian-aware error compensation

Naive round-to-nearest treats every weight equally. In reality, weights multiply activations $X \in \mathbb{R}^{d \times n}$, so an error of $0.05$ on a high-energy channel damages layer outputs far more than on a quiet channel. **GPTQ**[^frantar2023] directly minimizes layer output reconstruction error:

$$
\min_{\hat{W}} \| W X - \hat{W} X \|_F^2 = \sum_{i=1}^m \frac{1}{2} e_i H e_i^T, \qquad H = 2 X X^T
$$

After rounding column $q$ to $\hat{w}_q$, GPTQ compensates the still-unquantized columns $F$ using the active Hessian inverse $K = (H_{A, A})^{-1}$:

$$
\Delta w_F = -\frac{w_q - \hat{w}_q}{K_{qq}} K_{F, q}
$$

To avoid $O(d^4)$ repeated inversions, GPTQ adds diagonal damping ($H + \lambda I$, typically 1% of mean diagonal), computes a single upper Cholesky factor $U$ where $(H + \lambda I)^{-1} = U^T U$, and batches deferred updates in 128-column blocks.[^gptqImplementation2026] Sorting columns by descending diagonal energy $H_{jj}$ (**act-order** / `desc_act`) quantizes high-energy channels first while the most free weights remain to absorb their error. (In Hugging Face Transformers, modern GPTQ tooling uses `gptqmodel` rather than legacy AutoGPTQ.[^huggingface2026gptq])

Watch both the power and the risk of Hessian compensation on two weights: compensation cuts calibration error, yet can *worsen* error on an out-of-distribution input!

<!-- leetllm: test, deps=numpy, output=show -->
```python title="hessian-compensation.py"
import numpy as np

w = np.array([1.2, 0.61])
X = np.array([[5.0, 4.0], [1.0, 1.0]])
H_inv = np.linalg.inv(2 * X @ X.T)

q0 = np.rint(w[0])
updated = w - (w[0] - q0) / H_inv[0, 0] * H_inv[:, 0]
naive = np.rint(w)
compensated = np.array([q0, np.rint(updated[1])])

err = lambda cand, inp: float(np.sum(((w - cand) @ inp) ** 2))
print("Compensated continuous w:", np.round(updated, 3).tolist(), "-> rounded:", compensated.tolist())
print(f"Calibration SSE: naive={err(naive, X):.3f}, compensated={err(compensated, X):.3f}")
print(f"Held-out I SSE:  naive={err(naive, np.eye(2)):.3f}, compensated={err(compensated, np.eye(2)):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Compensated continuous w: [1.0, 1.51] -> rounded: [1.0, 2.0]
Calibration SSE: naive=0.540, compensated=0.500
Held-out I SSE:  naive=0.192, compensated=1.972
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/gptq_awq_mechanics_dark.png" alt="In the weight plane, fixed calibration inputs make the SSE contours elongated along correlated weight changes. Rounding w₀ from 1.2 to 1 and compensating the still-free w₁ moves it from 0.61 to 1.51, then GPTQ rounds it to 2. Calibration outputs are [6.61, 5.41] before rounding, [6, 5] after independent rounding, and [7, 6] after compensation. Calibration SSE falls from 0.5402 to 0.5002; held-out identity SSE rises from 0.1921 to 1.9721." />
  <figcaption>GPTQ shifts unquantized $w_1$ from 0.61 to 1.51 (rounding to 2) to cancel $w_0$'s rounding error along calibration contours; mismatched inputs expose the risk of calibration drift.</figcaption>
</figure>

## AWQ: activation-aware channel scaling

Instead of compensating *after* rounding, **AWQ**[^lin2023] protects salient channels *before* rounding by rescaling coordinates. It ranks input channels by average absolute activation magnitude $s_{X, j} = \frac{1}{N} \sum_k |X_{j, k}|$ and inserts an identity pair $D = \operatorname{diag}(s)$:

$$
W X = (W D)(D^{-1} X) \quad \Longrightarrow \quad Q(W D) D^{-1} X
$$

Multiplying a salient weight column by $s_j > 1$ gives it finer effective step size $S / s_j$, while $D^{-1}$ fuses into the preceding LayerNorm or linear layer so serving stays uniform 4-bit.[^awqImplementation2026] Scaling too aggressively widens the group's dynamic range and hurts neighboring channels, so AWQ grid-searches $s = s_X^\alpha$ over $\alpha \in [0, 1]$ (typically 20 steps) to minimize layer output MSE, followed by clipping. (For modern AWQ export and serving, check maintained stacks such as vLLM's LLM Compressor rather than unmaintained legacy packages.[^autoawqStatus2026][^huggingface2026awq])

<!-- leetllm: test, deps=numpy, output=show -->
```python title="activation-aware-scaling.py"
import numpy as np

W = np.array([[0.3, 2.0]])
cal = np.array([[10.0, 8.0, -10.0, -8.0], [1.0, -1.0, 1.0, -1.0]])
held = np.array([[9.0, -9.0], [0.5, -0.5]])

def quantize_scaled(factor):
    a = np.array([factor, 1.0])
    scaled = W * a
    step = float(np.max(np.abs(scaled))) / 7
    return np.clip(np.rint(scaled / step), -7, 7) * step / a

mse = lambda cand, X: float(np.mean(((W - cand) @ X) ** 2))
for f in (1, 2, 4, 8):
    cand = quantize_scaled(f)
    print(f"scale={f}: cal MSE={mse(cand, cal):.6f}, held-out MSE={mse(cand, held):.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
scale=1: cal MSE=0.016735, held-out MSE=0.016531
scale=2: cal MSE=0.016735, held-out MSE=0.016531
scale=4: cal MSE=0.016735, held-out MSE=0.016531
scale=8: cal MSE=0.003265, held-out MSE=0.000816
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/awq_channel_coordinate_transform_dark.png" alt="For W = [0.3, 2], the selected AWQ channel transform uses D = diag(8, 1), so W times D is [2.4, 2] and the first activation row divides by 8. Each calibration column keeps the same product sum [5, 0.4, minus 1, minus 4.4] before rounding. Factors 1, 2, and 4 reconstruct the first weight as 2/7; factor 8 reconstructs it as 0.3 and moves the neighbor to 2.0571429. Calibration MSE falls to 0.003265 and held-out MSE is 0.000816 across the four-factor sweep." />
  <figcaption>Scaling channel 0 by $8\times$ snaps high-activation weight 0.3 onto an exact grid mark, trading a small shift on low-activation neighbor 2.0 for a $5\times$ drop in output MSE.</figcaption>
</figure>

## GGUF containers, k-quants, and CPU-GPU offloading

**GGUF**[^gerganov2023][^gguf_spec2026] is the self-describing binary format used by `llama.cpp`, packing architecture metadata, tokenizer tables, chat templates, and 32-byte-aligned tensor blocks into one memory-mappable file (plus a separate `mmproj` file for multimodal vision encoders[^llamaCppQuantize2026]).

Its hierarchical **k-quant** blocks show why "4-bit" rarely means 4.0 bits per weight: a **`Q4_K`** super-block holds 256 weights in 8 sub-blocks of 32, taking 128 code bytes + 12 packed bytes of 6-bit local scales/mins + 4 bytes for two FP16 super-scales = **144 bytes (4.5 bits/weight)**, reconstructing weights as $d s_i q - d_{\min} m_i$.[^ggmlKQuantLayout2026] A preset like **`Q4_K_M`** uses `Q4_K` for most tensors while keeping sensitive value/down projections at `Q6_K`.[^llamaCppQuantImplementation2026]

<figure>
  <img src="illustrations/_generated/gguf_block_bytes_dark.png" alt="A GGUF file lays out a header, typed key-value metadata, tensor descriptors containing names, shapes, types, and offsets, then aligned tensor payloads. The enlarged Q4_K superblock contains 256 weights in eight groups of 32, 128 code bytes, 12 packed bytes for eight six-bit scale and minimum pairs, and two FP16 super-scales totaling four bytes. The complete 144-byte block stores 4.5 bits per weight and reconstructs values with d times s_i times q minus d_min times m_i." />
  <figcaption>A GGUF file pairs typed metadata with aligned tensor blocks; each `Q4_K` super-block uses 144 bytes for 256 weights (4.5 bpw).</figcaption>
</figure>

When a GGUF exceeds GPU VRAM, `llama.cpp`'s `-ngl` (`--n-gpu-layers`) offloads trailing blocks (including the output layer in standard builds) to GPU while keeping remaining early blocks on CPU.[^llamaCppLayerPlacement2026] For a 40-block model with `-ngl 24`, blocks 17 through 39 plus the output layer land on GPU.

<!-- leetllm: test, output=show -->
```python title="gguf-offload-placement.py"
blocks, requested = 40, 24
start = max(blocks + 1 - requested, 0)  # output layer takes slot `blocks`
gpu_blocks = list(range(start, blocks))
print(f"40-block -ngl 24 -> GPU blocks {gpu_blocks[0]}..{gpu_blocks[-1]} + output layer")

# Capacity-bounded trailing placement with a 2,000 MB KV/workspace reserve:
layer_mb, device_mb, reserve_mb = [1000, 2000, 1500, 500], 6000, 2000
used, gpu_idx = 0, []
for idx in reversed(range(len(layer_mb))):
    if used + layer_mb[idx] > device_mb - reserve_mb:
        break
    gpu_idx.append(idx)
    used += layer_mb[idx]
cpu_idx = [i for i in range(len(layer_mb)) if i not in gpu_idx]
print(f"Budget fit: CPU={cpu_idx}, GPU={sorted(gpu_idx)} ({used} MB + {reserve_mb} MB reserve)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
40-block -ngl 24 -> GPU blocks 17..39 + output layer
Budget fit: CPU=[0], GPU=[1, 2, 3] (4000 MB + 2000 MB reserve)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/gguf_offload_dark.png" alt="For the version-pinned 40-block llama.cpp example, requesting 24 GPU layers selects transformer blocks 17 through 39, the output layer, and leaves input assignment on CPU. In the four-block capacity trace, a 6,000 MB GPU budget reserves 2,000 MB, then fits trailing blocks 1, 2, and 3 at 2,000, 1,500, and 500 MB; block 0 at 1,000 MB stays on CPU. The diagram traces host mapping through page read and device copy." />
  <figcaption>Trailing layer offload fills GPU VRAM up to the KV/workspace reserve and leaves remaining prefix blocks on CPU.</figcaption>
</figure>

```bash title="terminal"
python convert_hf_to_gguf.py /path/to/checkpoint --outfile model-bf16.gguf --outtype bf16
./build/bin/llama-quantize model-bf16.gguf model-Q4_K_M.gguf Q4_K_M
```

## Evaluating quantized models beyond perplexity

As bit width drops from 8 bits to 4 bits to 2 bits, output MSE rises smoothly at first and then falls off a cliff (narrow symmetric 2-bit leaves only codes $\{-1, 0, 1\}$!):

<!-- leetllm: test, deps=numpy, output=show -->
```python title="held-out-quantization.py"
import numpy as np

W = np.array([[0.3, -1.2, 2.0, 0.7]])
X = np.array([[2.0, -1.0, 3.0], [1.0, 2.0, -1.0], [-1.0, 0.5, 2.0], [0.2, -2.0, 1.0]])
for bits in (8, 4, 2):
    qmax = 2 ** (bits - 1) - 1
    scale = float(np.max(np.abs(W))) / qmax
    restored = np.clip(np.rint(W / scale), -qmax, qmax) * scale
    mse = float(np.mean(((W - restored) @ X) ** 2))
    print(f"{bits}-bit: {(W.size * bits + 7) // 8} code bytes, held-out MSE={mse:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
8-bit: 4 code bytes, held-out MSE=0.000204
4-bit: 2 code bytes, held-out MSE=0.067010
2-bit: 1 code bytes, held-out MSE=1.007200
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/precision_comparison_dark.png" alt="For four weights [0.3, minus 1.2, 2, 0.7], three quantization grids reconstruct 8-bit [0.2992, minus 1.1969, 2, 0.6929], 4-bit [0.2857, minus 1.1429, 2, 0.5714], and 2-bit [0, minus 2, 2, 0]. The first held-out output contraction uses activation column [2, 1, minus 1, 0.2]. Across all three columns, baseline-minus-reconstruction errors yield MSE values 0.000204, 0.067010, and 1.007200. Ideal code payloads are 4, 2, and 1 bytes; scale bytes are excluded." />
  <figcaption>Output MSE rises gently from 8-bit (0.000204) to 4-bit (0.067010) before spiking $15\times$ at 2-bit (1.007200).</figcaption>
</figure>

> **Common mistake:** Never sign off on a 4-bit checkpoint using prose perplexity alone! A tiny 0.05-point bump in WikiText perplexity can hide broken JSON schemas, hallucinated tool arguments, or failing unit tests. Always **reload the exported artifact from disk**, pin tokenizer/template/decoding settings, and run paired evaluations across executable code, structured outputs, TTFT, p95 ITL, and peak VRAM.

<figure>
  <img src="illustrations/_generated/quantization_decision_dark.png" alt="The same held-out inputs pass through a source baseline and an exported, reloaded candidate with matching tokenizer, chat template, and decoding controls. Paired bars on a shared axis compare baseline and 4-bit outputs for three held-out columns: minus 2.460 versus minus 2.457 (difference minus 0.003), minus 3.100 versus minus 2.714 (difference minus 0.386), and 6.800 versus 6.571 (difference plus 0.229). Artifact identity, task quality, and serving profile are checked as three separate evidence streams." />
  <figcaption>Paired comparison on shared held-out inputs exposes uneven drift (column $x_1$ shifts by 0.386 while $x_0$ shifts by just 0.003).</figcaption>
</figure>

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
    "explanation": "The still-free Hessian block is [2], whose inverse is [.5]. The old full inverse is [[.125, −.125],[−.125, .625]], so retaining its .625 entry would use a different active problem."
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
    "explanation": "The transformed input is 6/4=1.5. Before rounding, 1.6×1.5=2.4; after rounding, 1.5×1.5=2.25. Keeping input 6 or assuming exact invariance after rounding changes the stated computation."
  },
  {
    "question": "Two complete Q4_K blocks hold 512 weights. Including the declared local coefficients and super-scales, what do they occupy?",
    "options": [
      "256 bytes, totaling 4.0 bits per weight.",
      "280 bytes, totaling 4.375 bits per weight.",
      "288 bytes, totaling 4.5 bits per weight.",
      "320 bytes, totaling 5.0 bits per weight."
    ],
    "answer": "288 bytes, totaling 4.5 bits per weight.",
    "explanation": "Each 256-weight block contains 128 code bytes, 12 local-coefficient bytes and 4 super-scale bytes. Two blocks occupy 288 bytes; 288×8/512=4.5 bits per weight."
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
    "question": "A standalone path first reads 2 MB of codes/scales, then writes and rereads 8 MB of reconstructed weights. Excluding all other traffic, how many weight-related MB does it move?",
    "options": [
      "2 MB; reconstructed weights require no memory traffic.",
      "8 MB; only the multiplication’s final read counts.",
      "10 MB; the reconstructed matrix is transferred once.",
      "18 MB; compact read plus full-matrix write and read."
    ],
    "answer": "18 MB; compact read plus full-matrix write and read.",
    "explanation": "The declared traffic is 2+8+8=18 MB. A fused implementation avoids the full reconstructed matrix’s global-memory round trip."
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
    "explanation": "The reserve and weights occupy 4 + 8 + 16 = 28 GB before quantization and 4 + 8 + 4 = 16 GB after. The cache pool grows from 20 to 32 GB. At 0.5 GB per user, the limit rises from 40 to 64 users."
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
    "question": "A 4B-weight worksheet has a 4 GB device, .5 GB other allocations and 1.25 GB cache. A uses 4-bit codes plus a 2-byte scale per 64 weights; B uses 4.5-bit Q4_K blocks. Which complete totals follow?",
    "options": [
      "A 3.75 GB; B 3.75 GB, because both labels say four-bit.",
      "A 4.125 GB; B 4 GB, because A’s scales need .375 GB.",
      "A 3.875 GB; B 4 GB, with no headroom for B in this worksheet.",
      "A 3.875 GB; B 4.5 GB, because block metadata is .75 GB."
    ],
    "answer": "A 3.875 GB; B 4 GB, with no headroom for B in this worksheet.",
    "explanation": "A’s codes use 2 GB and its scales .125 GB, totaling 3.875 GB with the listed allocations. B’s blocks use 2.25 GB, totaling 4 GB exactly."
  }
]
```

> **Next:** Continue to [Local LLM Deployment](/learn/local-llm-deployment-hardware-quantization). You can now distinguish the quantization method, tensor encoding, and container. The next lesson turns an artifact into a local deployment with measured memory, latency, and task quality.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
You have a 54 GB model and a device with 24 GB of memory. Four-bit codes plus scales would bring the weight payload down to about 14 GB, leaving capacity to budget the remaining allocations. You quantize it, run your evaluation, and perplexity barely moves. You ship. Two weeks later someone notices that a tool integration has been failing: the model now produces fluent prose and quietly malformed JSON arguments. Nothing crashed, and your metric didn't notice, because prose perplexity was never measuring that.

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

The important shift is what you're trying to protect. A weight error of 0.05 on a channel whose activations are tiny barely matters. The same error on a channel with huge activations can matter a lot. Errors can also reinforce each other or cancel out once they're multiplied by real inputs. So stop thinking about weights in isolation. For a weight matrix $W$ and calibration inputs stored as columns of $X$, the natural objective is:

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

The full algorithm uses stable factorizations, damping, and blocked updates to avoid repeatedly inverting shrinking matrices.[^gptqImplementation2026] The practical takeaway is about provenance: calibration is part of the artifact. Keep its domain, sampling setup, tokenizer, template, quantizer settings, and held-out results alongside the weights.

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
  <figcaption>Two paths through the same four-bit file. The fused kernel moves small codes across the memory bus, while the standalone path re-creates a full matrix in memory and loses most of the benefit.</figcaption>
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

In `llama.cpp`, the `-ngl` flag sets how many layers go to the GPU, selecting from the end of the model. Standard builds include the output layer in that count, so a 40-block model at `-ngl 24` puts blocks 17 through 39 and the output layer on the GPU and leaves the input layer on the CPU.[^llamaCppLayerPlacement2026]

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

Two bits leave this grid only three usable codes with a step of two, which is why that row falls off a cliff. For a full model, compare a retained baseline with the reloaded candidate on held-out inputs that look like your real tasks, with tokenizer, template, and decoding settings pinned.

Perplexity is a fine first signal for degradation, and it's a poor last word. A small change in prose perplexity says little about whether code still compiles, JSON still parses, tool arguments still validate, or long contexts still get used. Test those directly: executable code tests, schema validation, scored instructions, refusal behavior, and the slices of traffic you care about most. That's the check that would have caught the tool failure in our opening.

Control the output length, because a truncated answer can look wonderfully fast. Measure size with the scales and preserved tensors counted, and memory with the cache and the kernel's temporary buffers counted, since those are what actually have to fit. Time cold loading apart from warm serving, and keep failures and rejected requests in your latency numbers, or the slowest requests simply vanish from the report. Then write the decision down: the exact artifact, its compatibility checks, the quality change, and the measured latency and memory.

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
