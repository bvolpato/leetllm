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
    "continuous-batching-request-scheduling",
    "kv-cache-paged-attention-llm-serving",
    "multi-query-grouped-query-attention"
  ],
  "relatedQuestions": [
    "local-llm-deployment-hardware-quantization",
    "llm-deployment-gpu-serving-autoscaling",
    "speculative-decoding",
    "positional-encoding-rope-alibi",
    "knowledge-distillation-llms"
  ],
  "section": "GPU Systems & LLM Inference",
  "order": 7
}
---
A 27-billion-parameter model needs **54 GB** just to store its BF16 weights, far too large for a single 24 GB GPU. Pack those weights into 4-bit integer codes and the raw payload drops to **13.5 GB** (13.922 GB with one FP16 scale per 128 weights, or 12.966 GiB), bringing a 24 GB card into play once you budget remaining VRAM for preserved FP16 tensors, KV cache, and workspace. You quantize the model, see perplexity barely move, and ship; two weeks later a tool integration starts breaking because fluent prose now hides malformed JSON arguments. (On real checkpoints such as Qwen3.6-27B, which also carries a vision encoder and hybrid recurrent/attention layers, always inspect the actual tensor inventory rather than multiplying the headline parameter count by 0.5 bytes.[^qwen3627b2026])

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

**W4A16** cuts HBM weight traffic roughly $4\times$ by reading packed 4-bit codes and unpacking them *inside a fused kernel* right before the FP16 multiply-accumulate, avoiding writing an expanded FP16 matrix back to HBM.[^hoque2024splitK] Without fusion, a standalone dequantization pass gives away most of that bandwidth gain (on Ascend 910, where unpacking and multiplication communicate through global memory, W4A16 reached at most $1.48\times$ over FP16).[^he2026ascendW4A16] When prompts are long (prefill) or batches grow large, weight traffic stops dominating; accelerating compute then requires quantizing activations too, via integer **W8A8** with SmoothQuant outlier migration[^xiao2023] or native **FP8**.[^micikevicius2022] Keep **KV cache precision** (such as FP8 KV cache in vLLM[^vllm2026kvquant]) distinct from weight precision: quantizing weights does not shrink any user's KV cache, though shrinking 54 GB of BF16 weights to 13.92 GB on an 80 GB card (with an 8 GB reserve) expands the remaining KV pool $3.2\times$ from 18 GB to 58.08 GB (raising 5,120-token capacity from 53 to 173 users, or 36 to 119 including recurrent state).

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
  <img src="illustrations/_generated/quantization_decision_dark.png" alt="The same held-out inputs pass through a source baseline and an exported, reloaded candidate with matching tokenizer, chat template, and decoding controls. Paired bars on a shared axis compare baseline and 4-bit outputs for three held-out columns: minus 2.460 versus minus 2.457 (drift plus 0.003), minus 3.100 versus minus 2.714 (drift plus 0.386), and 6.800 versus 6.571 (drift minus 0.229). Artifact identity, task quality, and serving profile are checked as three separate evidence streams." />
  <figcaption>Paired comparison on shared held-out inputs exposes uneven drift (column $x_1$ shifts by +0.386 while $x_0$ shifts by just +0.003).</figcaption>
</figure>

| Symptom after quantization | Check first |
|---|---|
| JSON or code breaks while prose looks fluent | Reloaded artifact, tokenizer/template, decoding settings, and paired task evals before tuning calibration data |
| Decode stays slow despite 4-bit weights | Device placement, fused vs. standalone kernel dispatch, KV traffic, batch size, and queueing against BF16 |
| Prefill stays slow | Whether compute or queueing dominates (weight compression rarely fixes compute-bound prefill) |

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

> **Next:** Continue to [Local & Edge LLM Deployment](/learn/local-llm-deployment-hardware-quantization).
