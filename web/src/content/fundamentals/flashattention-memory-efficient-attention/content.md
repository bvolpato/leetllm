---
{
  "id": "flashattention-memory-efficient-attention",
  "title": "FlashAttention & Memory Efficiency",
  "slug": "flashattention-memory-efficient-attention",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/flash_attention_dark.png",
  "companies": [
    "Google",
    "Meta",
    "NVIDIA",
    "OpenAI",
    "Anthropic"
  ],
  "shortDescription": "At batch 8, 32 heads, and 8,192 tokens, FP16 scores need 32 GiB. FlashAttention computes the same attention without storing that matrix.",
  "keyConceptsTested": [
    "Materialized attention memory bottleneck",
    "Tiling strategy for SRAM utilization",
    "Online softmax algorithm",
    "IO complexity analysis (HBM reads/writes)",
    "FlashAttention version evolution",
    "Causal masking in tiled attention",
    "Backward pass recomputation",
    "Warp-level parallelism",
    "Backend eligibility and causal alignment"
  ],
  "prerequisites": [
    "prefix-caching-prompt-caching",
    "scaled-dot-product-attention",
    "inference-mechanics-ttft-tps-kv-cache"
  ],
  "relatedQuestions": [
    "continuous-batching-request-scheduling",
    "kv-cache-paged-attention-llm-serving",
    "multi-query-grouped-query-attention",
    "scaling-llm-inference-batching-kv-cache",
    "model-parallelism-for-llm-inference",
    "long-context-window-management"
  ],
  "section": "Inference & Production Scale",
  "order": 5
}
---

A coding assistant compares each prompt <span data-glossary="token">token</span> with itself and earlier tokens during causal <span data-glossary="prefill">prefill</span>. A simple implementation allocates a full square score <span data-glossary="matrix">matrix</span>, even though the upper triangle is masked. Doubling sequence length quadruples that allocation. At 8,192 tokens, batch 8, and 32 heads, a full matrix of 16-bit scores needs 32 GiB *before counting anything else*.

Prefix caching reuses KV state across requests that share a prompt prefix. It removes repeated work between requests, not this all-pairs work inside one uncached call. <span data-glossary="flashattention">FlashAttention</span> computes the same dense [attention](/learn/scaled-dot-product-attention) operator, but it doesn't park the full score or probability matrix in <span data-glossary="hbm">HBM</span> (High Bandwidth Memory, the large GPU RAM pool).[^dao2022] When attention IO is the bottleneck, that can raise throughput or let a longer context fit.

```checkpoint
What is the main promise of FlashAttention?
---
It computes exact dense attention while avoiding the full $n \times n$ score and probability matrices in HBM. The win is lower memory traffic and lower auxiliary memory, not a different attention formula.
```

## The memory wall

### Materialized attention first

Make the baseline explicit before looking at the optimization. In the [scaled dot-product attention article](/learn/scaled-dot-product-attention), each query token scores every key token, normalizes those scores with <span data-glossary="softmax">softmax</span>, and blends the corresponding value vectors.

Suppose you have only three prompt tokens from a failing-test message, and a head dimension of two:

- **Query** $Q$ is a $3 \times 2$ matrix (one row per token).
- **Key** $K$ and **Value** $V$ are also $3 \times 2$.

The scaled score matrix $S = QK^T / \sqrt{2}$ is $3 \times 3$: nine numbers, of which six are valid in causal attention. In general, the scale is $1/\sqrt{d}$ for head dimension $d$. Masking changes which scores contribute, but doesn't shrink a full square allocation.

For $batch=8$, $heads=32$, $seq\_len=8192$ in 16-bit floating point (<span data-glossary="fp16">FP16</span>):

$$
\begin{aligned}
\text{score bytes} &= 8 \times 32 \times 8192^2 \times 2 \\
&= 32\text{ GiB} \approx 34.36\text{ GB}
\end{aligned}
$$

That product is exactly $34{,}359{,}738{,}368$ bytes. PyTorch's <span data-glossary="scaled-dot-product-attention">scaled dot-product attention (SDPA)</span> math implementation keeps intermediates in FP32 for FP16/BF16 inputs, doubling the bytes per score.[^pytorchSdpaDocs2026] Probability storage, model weights, other activations, and <span data-glossary="gradient">gradients</span> need separate accounting; whether score and probability buffers coexist depends on the implementation.

A short memory calculation isolates quadratic score buffers from model weight storage before debugging an out-of-memory error:

<!-- leetllm: test, output=show -->
```python title="score-matrix-size.py"
batch, heads, sequence, bytes_per_value = 8, 32, 8192, 2
score_bytes = batch * heads * sequence * sequence * bytes_per_value

print(f"score values: {batch * heads * sequence * sequence:,}")
print(f"binary size: {score_bytes / 1024**3:.2f} GiB")
print(f"decimal size: {score_bytes / 1000**3:.2f} GB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
score values: 17,179,869,184
binary size: 32.00 GiB
decimal size: 34.36 GB
```
<!-- leetllm: output:end -->

```checkpoint
Why does an 8,192-token attention matrix become huge even before model weights are counted?
---
Each head compares every query token with every key token, so storage grows with $seq\_len^2$. With batch 8, 32 heads, 8,192 by 8,192 scores, and 2 bytes per FP16 score, the score matrix alone is about 34 GB (32 GiB).
```

### GPU memory hierarchy

The score count explains capacity. Now follow those values across the memory hierarchy. A GPU isn't a flat memory space. It has layers:

- **On-chip <span data-glossary="sram">SRAM</span>** (static random-access memory) is the tiny, ultra-fast scratchpad right next to the compute cores (registers and shared memory).
- **HBM** is the large pool of GPU memory (<span data-glossary="vram">VRAM</span>) that holds model weights and <span data-glossary="tensor">tensors</span>.
- **CPU DRAM** is host memory outside the GPU, used only when data must leave the card entirely.

> **Memory hierarchy intuition:** On-chip SRAM is a tiny, fast scratchpad beside the compute cores. HBM is much larger, but every revisit costs bandwidth. A materializing attention baseline keeps returning to HBM because the full $n \times n$ score matrix doesn't fit in the scratchpad. FlashAttention keeps only active tiles there at a time.

On an NVIDIA H100, each streaming multiprocessor (SM) has **228 KiB of shared memory** and a separate **64K 32-bit register file (256 KiB)**. A thread block can use at most 227 KiB of shared memory; its actual budget also depends on launch settings and other resident blocks. Shared memory shares physical capacity with the L1 cache.[^nvidia2026hopperTuning] Treat each SM's shared-memory budget and register file as separate local resources.

Hopper can share memory across SMs within a thread-block cluster, but that doesn't make all SM memory one giant tile buffer. Here, "SRAM" is the paper's simplified fast-memory model. A real kernel separately manages shared memory, registers, and synchronization.

| Memory tier | Typical role in attention | Concrete limit or dependency |
|-------------|---------------------------|------------------------------|
| **On-chip storage** | Current tiles, accumulators, softmax stats | H100: 228 KiB shared memory per SM; registers have a separate budget |
| **HBM (VRAM)** | Q, K, V, O, weights, activations | H100 SXM: 80 GB, rated bandwidth 3.35 TB/s[^nvidia2026h100] |
| **CPU DRAM** | Host-side storage and offloaded state | Capacity and GPU transfer rate depend on the server and interconnect |

Host RAM bandwidth and bandwidth *from host to GPU* are different quantities. Neither follows from the GPU's HBM specification. Likewise, local-memory latency depends on the access pattern; don't turn an aggregate SRAM estimate into a fixed latency for every tile.

<figure>
  <img src="illustrations/_generated/tile_working_set_dark.png" alt="A three-level memory map separates host CPU DRAM, H100 SXM GPU HBM, and SM-local shared memory and registers. Host transfers use a separate system link. HBM holds Q, K, V, output, weights, and activations; H100 SXM lists 80 GB HBM and 3.35 TB per second rated bandwidth. Arrows show input tiles entering SMs and output plus row statistics returning to HBM. Each SM has 228 KiB shared memory, at most 227 KiB per block, and a separate 256 KiB register file; shared memory shares physical capacity with L1, and launch settings and resident blocks affect budgets. A proportional band shows one tile working set: Q, K, and V occupy 16 KiB each, output is 32 KiB, and one FP32 score tile is 64 KiB, for 144 KiB total. These sizes do not imply one shared-memory allocation." />
  <figcaption>CPU DRAM, GPU HBM, and SM-local resources sit at distinct levels. HBM moves tiles into shared memory and registers, then receives outputs and row statistics; host transfers use a separate system link. In the 128-row, dimension-64 example, Q, K, and V occupy 16 KiB each, O occupies 32 KiB, and one FP32 score tile occupies 64 KiB. Their 144 KiB subtotal shows logical array sizes; kernels reuse and distribute state across separate resource pools.</figcaption>
</figure>

Use this as a capacity pyramid, not a one-way data pipe. Compute wants tiles in SRAM, so ask what happens when the same tile is reused. A materializing baseline keeps bouncing the full $n \times n$ score and probability matrices through HBM, while FlashAttention pays for local bookkeeping to avoid those round-trips.[^dao2022]

#### Materialized attention hits the memory bandwidth wall

Follow the physical bytes moved in a materializing baseline. For our running prompt with batch 8, 32 heads, and sequence length 8,192 in FP16:
1. The kernel computes $S = QK^T / \sqrt{d}$ and writes the $32\text{ GiB}$ score matrix $S$ out to HBM.
2. A separate softmax kernel reads all $32\text{ GiB}$ of $S$ back from HBM.
3. The softmax kernel computes probabilities and writes a $32\text{ GiB}$ probability matrix $P$ back to HBM.
4. The value multiply kernel reads all $32\text{ GiB}$ of $P$ and the values $V$ back from HBM to compute $O = PV$.

That adds up to **128 GiB of logical intermediate transfers** for this four-pass FP16 baseline, before counting $Q, K, V,$ or the final output $O$. Fusion, datatype, and cache behavior change the physical HBM traffic a profiler observes. FlashAttention avoids those full-matrix intermediates, while still moving inputs, output, and row state.

The roofline model gives a throughput bound from arithmetic intensity $I$: $\min(\text{compute peak},\ I\times\text{bandwidth})$.[^williams2009] NVIDIA lists 1,979 TFLOPs/s for H100 SXM FP16/BF16 tensor cores **with sparsity**; halving that 2:4 sparsity rating gives a dense FP16/BF16 peak of 989.5 TFLOPs/s.[^nvidia2026h100] Using its 3.35 TB/s bandwidth rating:

$$
\text{Ridge point} = \frac{989.5 \times 10^{12}\text{ FLOP/s}}{3.35 \times 10^{12}\text{ bytes/s}} \approx 295.4\text{ FLOPs/byte}
$$

Consider a workload with arithmetic intensity 1 FLOP/byte on H100 SXM. Its bandwidth roof is only 3.35 TFLOPs/s, about 0.34% of the dense compute peak. **That ratio compares the bandwidth roof with dense compute peak; it says nothing about idle cycles.** Softmax's reductions and exponentials also use different execution units from tensor-core matrix multiplication, so the tensor-core peak isn't its appropriate compute ceiling.

<!-- leetllm: test, output=show -->
```python title="roofline-is-not-an-idle-timer.py"
dense_peak = 1979 / 2  # TFLOPs/s, derived from the sparsity-rated figure
bandwidth = 3.35      # decimal TB/s
intensity = 1.0       # FLOPs/byte
bandwidth_roof = min(dense_peak, intensity * bandwidth)
print(f"dense compute peak: {dense_peak:.1f} TFLOPs/s")
print(f"ridge point: {dense_peak / bandwidth:.1f} FLOPs/byte")
print(f"bandwidth roof at 1 FLOP/B: {bandwidth_roof:.2f} TFLOPs/s")
print(f"ratio to compute peak: {100 * bandwidth_roof / dense_peak:.2f}%")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dense compute peak: 989.5 TFLOPs/s
ridge point: 295.4 FLOPs/byte
bandwidth roof at 1 FLOP/B: 3.35 TFLOPs/s
ratio to compute peak: 0.34%
```
<!-- leetllm: output:end -->

Profile memory traffic, execution units, and timing to identify the actual bottleneck. The roofline explains why avoiding transfers *can* help, yet it determines neither an exact stall percentage nor whether every attention shape is memory-bound. Measuring the target batch size, sequence length, and precision settles whether bandwidth or arithmetic limits execution.

```checkpoint
Why can HBM traffic be the bottleneck even when the GPU has spare compute capacity?
---
Repeatedly writing and reading $n^2$ intermediates consumes bandwidth. For a workload with low arithmetic intensity, the bandwidth roof can be far below its compute peak. FlashAttention avoids full score/probability transfers and reuses local tiles. Actual stalls and speedups require profiling.
```

## The FlashAttention algorithm

If storing the full $n \times n$ score matrix exhausts memory and bandwidth, the kernel must avoid materializing it altogether. Tiling keeps small slices of inputs and outputs in fast on-chip memory while streaming through keys and values incrementally. The sections below show how exact softmax normalization survives that tiled schedule without losing mathematical equivalence.

### Core idea: tiling + online softmax

The baseline keeps the attention formula, but its temporary intermediates live too long. FlashAttention combines three ideas instead of materializing the full $n \times n$ attention matrix:

1. **Tiles** the computation into blocks that fit in SRAM.
2. Uses **<span data-glossary="online-softmax">online softmax</span>** to compute exact softmax without seeing all values at once.
3. **Never materializes** the full attention matrix in HBM.

This block-wise processing strategy avoids quadratic auxiliary score and probability storage while keeping inputs, outputs, and saved row statistics linear in sequence length. Temporary score and probability tiles vanish once each key-value block finishes updating its row summary, leaving only the final output $O$ and compact per-row state in HBM. Tracing the two data lifetimes side by side in the figure shows that while a materializing baseline repeatedly writes and reads scores and probabilities in HBM, FlashAttention keeps only $Q_i$ and row-wise **log-sum-exp (LSE)** statistics on chip so backward can later reconstruct probabilities without saving the full matrix.

<figure>
  <img src="illustrations/_generated/flash_attention_dark.png" alt="A 3 by 3 causal stencil shows 9 allocated score slots and 6 valid pairs. In a separate batch 8, 32-head, 8,192-token example, each full FP16 n by n score or probability array is 32 GiB. Four directional HBM transfers total 128 GiB of logical intermediates. The tiled path streams K and V tiles through an on-chip workspace, discards temporary score and probability tiles, keeps Q and row state on chip, and writes O plus an 8 MiB FP32 LSE array." />
  <figcaption>The small lower-triangle stencil shows causal validity. The separate memory example uses batch 8, 32 heads, and 8,192 tokens: one FP16 $n \times n$ score or probability array is 32 GiB. A materializing path writes and reads both arrays, for 128 GiB of logical intermediate transfers. The tiled path streams $K_j$ and $V_j$ through the on-chip workspace, discards each $S_{ij}$ and $P_{ij}$ tile after the update, keeps $Q_i$ and $(m_i, \ell_i, N_i)$ live, and writes $O$ plus the row-wise 8 MiB FP32 LSE. These counts exclude $Q$, $K$, $V$, and $O$ and describe logical transfers rather than observed hardware traffic.</figcaption>
</figure>

The upper path changes memory traffic by revisiting $n \times n$ intermediates in HBM. The lower path reuses small blocks in SRAM, then writes the output and compact row statistics. Same operator, different data lifetime.

```checkpoint
Why doesn't tiling make FlashAttention approximate?
---
Tiling changes the order of computation, not the attention definition. Online softmax rescales previous partial sums whenever a new block changes the row maximum, so the final normalized output matches dense attention up to normal floating-point ordering differences.
```

### How tiling fits in SRAM

Tiling changes data lifetime. Pull a block of $Q$, $K$, and $V$ from HBM into SRAM, compute local scores there, and throw the score tile away. During forward execution the kernel writes final output $O$ and, for training, compact row statistics for backward. It doesn't write the full score or probability matrices.

Now the math problem appears. Softmax over a row needs a global max and a global sum. If SRAM holds one K/V tile at a time, you can't see the rest of the row yet. Online softmax is the fix that keeps the result exact.

Ask what must be live at the same time. For 128 query rows, 128 key rows, and head dimension 64, the Q/K/V tiles alone occupy 48 KiB in FP16. Accumulating the output in FP32 adds 32 KiB, and a full FP32 score tile would add 64 KiB. These are logical array sizes, not a shared-memory allocation recipe: kernels distribute state across memory pools, reuse storage, and pipeline loads.

<!-- leetllm: test, output=show -->
```python title="tile-working-set.py"
rows, dimension = 128, 64
qkv_bytes = 3 * rows * dimension * 2
output_bytes = rows * dimension * 4
score_bytes = rows * rows * 4
print(f"FP16 Q/K/V: {qkv_bytes // 1024} KiB")
print(f"FP32 output accumulator: {output_bytes // 1024} KiB")
print(f"FP32 score tile: {score_bytes // 1024} KiB")
print(f"logical subtotal: {(qkv_bytes + output_bytes + score_bytes) // 1024} KiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FP16 Q/K/V: 48 KiB
FP32 output accumulator: 32 KiB
FP32 score tile: 64 KiB
logical subtotal: 144 KiB
```
<!-- leetllm: output:end -->

### Online softmax with a concrete example

Suppose SRAM fits only two scores at a time. A longer row can still be normalized if you keep a running max $m$ and denominator $\ell$, then rescale whenever a later tile raises the max.

#### Standard softmax on three scores
Suppose one query token sees scaled key scores $[1.0,\; 2.0,\; 3.0]$, with scalar values $[10,20,40]$.

1. Find the max: $m = 3.0$.
2. Exponentiate relative to the max: $[e^{-2},\; e^{-1},\; 1] \approx [0.135,\; 0.368,\; 1]$.
3. Sum: $\ell \approx 1.503$.
4. Normalize: $[0.090,\; 0.245,\; 0.665]$. The weighted value is about $32.405$.

A materializing baseline would store the full score matrix in HBM just to run that four-step process for every row.

#### Online softmax with two blocks
Now split the same scores into Block A $[1.0,\; 2.0]$ and Block B $[3.0]$. Block B changes the row maximum. Its arrival must change the scale of the saved state, without requiring Block A's raw scores again.

*Processing Block A:*
- Local max: $m_A = 2.0$.
- Local denominator: $\ell_A = e^{-1.0} + e^{0} \approx 1.368$.
- Local unnormalized numerator: $N_A = e^{-1.0} \cdot V_1 + e^{0} \cdot V_2$.

*Processing Block B:*
- Local max: $m_B = 3.0$.
- New global max: $m_{new} = 3.0$.
- Rescale the old denominator: $e^{-1} \cdot 1.368 \approx 0.503$.
- Add Block B's weight: $\ell_{new} \approx 0.503 + 1 = 1.503$.
- Rescale the numerator by the same factor: $N_{new} = e^{-1} N_A + V_3$.

The final row output is $O = N_{new} / \ell_{new}$, again about $32.405$. We never held all three scores in the fast workspace at once. Both the numerator and denominator moved from a max of 2 to a max of 3; rescaling only one would change the answer.

<figure>
  <img src="illustrations/_generated/tiling_strategy_dark.png" alt="Block A pairs scores 1 and 2 with values 10 and 20. When Block B adds score 3 and value 40, the running maximum moves from 2 to 3. Alpha equals exp of 2 minus 3, or 0.367879, and scales both old sums: the denominator goes from 1.368 to 0.503 and the numerator from 23.679 to 8.711. Block B contributes 1 and 40. The merged denominator is 1.503, numerator 48.711, and online and dense outputs both equal 32.404513." />
  <figcaption>The three scores and scalar values make the online update visible. When the reference maximum moves from 2 to 3, both old sums multiply by $\alpha = e^{2-3}$. Block B contributes $e^{3-3}=1$ to $\ell$ and 40 to $N$. Add those terms, then divide $N_{new}$ by $\ell_{new}$ to get 32.404513, matching dense softmax. Bar lengths are proportional within each state row.</figcaption>
</figure>

Test the same invariant with scalar values, independent of any GPU kernel:

<!-- leetllm: test, output=show -->
```python title="online-softmax-two-blocks.py"
import math

scores_a, values_a = [1.0, 2.0], [10.0, 20.0]
scores_b, values_b = [3.0], [40.0]

def local_state(scores, values):
    max_score = max(scores)
    weights = [math.exp(score - max_score) for score in scores]
    return max_score, sum(weights), sum(weight * value for weight, value in zip(weights, values))

m_a, l_a, n_a = local_state(scores_a, values_a)
m_b, l_b, n_b = local_state(scores_b, values_b)
m = max(m_a, m_b)
l = math.exp(m_a - m) * l_a + math.exp(m_b - m) * l_b
n = math.exp(m_a - m) * n_a + math.exp(m_b - m) * n_b
online = n / l

all_scores = scores_a + scores_b
all_values = values_a + values_b
dense_weights = [math.exp(score - max(all_scores)) for score in all_scores]
dense = sum(w * v for w, v in zip(dense_weights, all_values)) / sum(dense_weights)

print(f"online output: {online:.6f}")
print(f"dense output:  {dense:.6f}")
print(f"match: {abs(online - dense) < 1e-12}")
assert math.isclose(online, dense, abs_tol=1e-12)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
online output: 32.404513
dense output:  32.404513
match: True
```
<!-- leetllm: output:end -->

```checkpoint
What breaks if Block A's denominator is rescaled by $e^{-1}$ but its numerator is left unchanged?
---
Block A's values receive too much weight. The numerator and denominator must use the same reference maximum, so both previous contributions need the factor $e^{2-3}$.
```

### The general update rule

The two-block picture extends to any two blocks, and the same rescaling rule works each time a new K/V tile arrives. Writing it out makes the recurrence precise.

Recall the standard safe softmax for a row of scores $s \in \mathbb{R}^N$ and values $V \in \mathbb{R}^{N \times d}$:

$$
m = \max_{1 \le j \le N} s_j, \quad \ell = \sum_{j=1}^N e^{s_j - m}, \quad P_j = \frac{e^{s_j - m}}{\ell}, \quad O = \sum_{j=1}^N P_j V_j = \frac{\sum_{j=1}^N e^{s_j - m} V_j}{\ell}
$$

Now split the row into two blocks $s^{(1)}$ and $s^{(2)}$ with corresponding value slices $V^{(1)}$ and $V^{(2)}$:
- Block 1 has local max $m_1 = \max(s^{(1)})$, local denominator $\ell_1 = \sum_j e^{s^{(1)}_j - m_1}$, and unnormalized numerator $N_1 = \sum_j e^{s^{(1)}_j - m_1} V^{(1)}_j$.
- Block 2 has local max $m_2 = \max(s^{(2)})$, local denominator $\ell_2 = \sum_j e^{s^{(2)}_j - m_2}$, and unnormalized numerator $N_2 = \sum_j e^{s^{(2)}_j - m_2} V^{(2)}_j$.

To merge them without revisiting raw scores, identify the unified maximum:

$$
m_{\text{new}} = \max(m_1, m_2)
$$

We convert exponentials from base $m_1$ and $m_2$ to base $m_{\text{new}}$ using the identity:

$$
e^{s_j - m_{\text{new}}} = e^{(s_j - m) + (m - m_{\text{new}})} = e^{s_j - m} \cdot e^{m - m_{\text{new}}}
$$

Because $e^{m - m_{\text{new}}}$ is a scalar constant across all tokens in a block, pull it outside the sum:

$$
\sum_{j \in B_1} e^{s_j - m_{\text{new}}} = e^{m_1 - m_{\text{new}}} \sum_{j \in B_1} e^{s_j - m_1} = e^{m_1 - m_{\text{new}}} \cdot \ell_1
$$

The exact same algebra applies to the numerator sum:

$$
\sum_{j \in B_1} e^{s_j - m_{\text{new}}} V_j = e^{m_1 - m_{\text{new}}} \sum_{j \in B_1} e^{s_j - m_1} V_j = e^{m_1 - m_{\text{new}}} \cdot N_1
$$

Defining the rescale factors $a_1 = e^{m_1 - m_{\text{new}}}$ and $a_2 = e^{m_2 - m_{\text{new}}}$, the combined quantities are:

$$
\ell_{\text{new}} = a_1 \ell_1 + a_2 \ell_2
$$

$$
N_{\text{new}} = a_1 N_1 + a_2 N_2
$$

$$
O_{\text{new}} = \frac{N_{\text{new}}}{\ell_{\text{new}}}
$$

When processing tiles sequentially in a loop, block 1 represents the accumulated running state ($m_{\text{old}}, \ell_{\text{old}}, N_{\text{old}}$) and block 2 is the incoming score tile $s_{\text{tile}}$ and value tile $V_{\text{tile}}$. Then $m_{\text{new}} = \max(m_{\text{old}}, \max(s_{\text{tile}}))$, the old-state rescale factor is $a = e^{m_{\text{old}} - m_{\text{new}}}$, and the new weights are $p_j = e^{s_j - m_{\text{new}}}$. Here $d$ remains the head dimension; $\ell$ is the softmax denominator.

This reveals an important difference between FlashAttention versions:
- **FlashAttention-1** kept the running output $O$ in normalized form at every step:
  $$
  O_{\text{new}} = \frac{a \cdot \ell_{\text{old}}}{\ell_{\text{new}}} O_{\text{old}} + \frac{1}{\ell_{\text{new}}} \sum_j p_j V_j
  $$
  This normalizes the running output on every inner step.
- **FlashAttention-2** keeps the accumulator in unnormalized form $O^* = N = \ell \cdot O$ throughout the inner loop:
  $$
  O^*_{\text{new}} = a \cdot O^*_{\text{old}} + \sum_j p_j V_j
  $$
  The numerator update avoids repeated normalization. Softmax still needs maxima, exponentials, and sums. Once all K/V tiles have contributed, the kernel normalizes just once before writing $O$ to HBM:
  $$
  O = \frac{O^*_{\text{final}}}{\ell_{\text{final}}}
  $$
  This reduces non-matmul overhead. Achieved Tensor Core throughput still depends on the workload, hardware, and kernel schedule.[^dao2023]

The saved LSE statistic is $L = m + \log \ell$, so backward can reconstruct a probability as $P_{ij} = e^{s_{ij} - L_i}$. Initialize the running state with $m = -\infty$, $\ell = 0$, and $N = 0$. Fully masked tiles need care: evaluating $-\infty - (-\infty)$ produces NaN. The sketch below handles those contributions explicitly. An entirely masked row has no mathematical softmax; returning zero matches the CPU PyTorch 2.14 behavior tested here and the FlashAttention package's documented convention.[^flashattention2026repo]

The recurrence guarantees algebraic equivalence in exact arithmetic. The hardware schedule dictates where $Q, K, V,$ and running state reside. Later Q-resident schedules can write each final output tile and row statistic once. The original FA1 schedule also writes intermediate running state to HBM; both avoid the full $n\times n$ matrices.

### Pseudocode

The same state update can run under different tile schedules. The original FlashAttention paper loops over K/V tiles in the outer loop and writes each Q tile's running state back to HBM between inner steps.[^dao2022] FlashAttention-2 keeps a Q tile on-chip and streams K/V tiles past it, which cuts extra HBM traffic for $O$ and the row stats.[^dao2023] The sketch below follows that later loop nest.

This single-head CPU correctness sketch uses FP64 to compare the recurrence against PyTorch SDPA. A fused GPU kernel and a memory-efficient training backward require separate implementations. Autograd retains intermediate operations here; FlashAttention's custom backward recomputes them. Boolean mask entries mean **allowed**, and Q/K lengths may differ.

<!-- leetllm: test, id=flash-sketch, deps=torch, output=show -->
```python title="flash-attention-sketch.py"
import math
import torch
import torch.nn.functional as F

torch.set_num_threads(1)


def tiled_attention(q, k, v, allowed, block_size):
    if block_size <= 0:
        raise ValueError("block_size must be a positive integer")
    if any(x.ndim != 2 or x.dtype != torch.float64
           or x.device.type != "cpu" or not torch.isfinite(x).all()
           for x in (q, k, v)):
        raise ValueError("use finite 2D CPU float64 inputs")
    nq, d = q.shape
    nk, dk = k.shape
    if min(nq, nk, d, v.shape[1]) == 0 or d != dk or v.shape[0] != nk:
        raise ValueError("incompatible or empty Q/K/V shapes")
    if (allowed.shape != (nq, nk) or allowed.dtype != torch.bool
            or allowed.device.type != "cpu"):
        raise ValueError("allowed must be a boolean Q-length by K-length mask")
    outputs = []
    for i in range(0, nq, block_size):
        qi = q[i:i + block_size]
        m = torch.full((len(qi), 1), -torch.inf, dtype=q.dtype)
        l = torch.zeros_like(m)
        numerator = torch.zeros((len(qi), v.shape[1]), dtype=q.dtype)
        for j in range(0, nk, block_size):
            scores = qi @ k[j:j + block_size].T / math.sqrt(d)
            if not torch.isfinite(scores).all():
                raise ValueError("score arithmetic overflowed")
            scores = scores.masked_fill(~allowed[i:i + len(qi), j:j + block_size], -torch.inf)
            new_m = torch.maximum(m, scores.amax(dim=1, keepdim=True))
            # No valid key yet: use 0 as a temporary reference, avoiding -inf - -inf.
            reference = torch.where(torch.isfinite(new_m), new_m, 0.0)
            old_scale = torch.exp(m - reference)
            weights = torch.exp(scores - reference)
            numerator = old_scale * numerator + weights @ v[j:j + block_size]
            l = old_scale * l + weights.sum(dim=1, keepdim=True)
            if not torch.isfinite(numerator).all() or not torch.isfinite(l).all():
                raise ValueError("accumulator arithmetic overflowed")
            m = new_m
        # An empty row has zero numerator; divide it by 1, not 0.
        outputs.append(numerator / torch.where(l > 0, l, 1.0))
    return torch.cat(outputs)


torch.manual_seed(7)
q = torch.randn(5, 4, dtype=torch.float64, requires_grad=True)
k = torch.randn(7, 4, dtype=torch.float64, requires_grad=True)
v = torch.randn(7, 3, dtype=torch.float64, requires_grad=True)
# Five new queries after two cached positions: global query positions 2..6.
allowed = torch.arange(7)[None, :] <= (torch.arange(5) + 2)[:, None]
allowed[0] = False  # Exercise an entirely masked row as well as masked tiles.
expected = F.scaled_dot_product_attention(q, k, v, attn_mask=allowed, dropout_p=0.0)
reference_grads = torch.autograd.grad(expected.square().sum(), (q, k, v))
for block_size in (1, 3, 20):
    got = tiled_attention(q, k, v, allowed, block_size)
    torch.testing.assert_close(got, expected, atol=1e-12, rtol=1e-12)
    grads = torch.autograd.grad(got.square().sum(), (q, k, v))
    for actual, reference in zip(grads, reference_grads):
        torch.testing.assert_close(actual, reference, atol=1e-11, rtol=1e-11)
    assert torch.equal(got[0], torch.zeros(3, dtype=q.dtype))
    print(f"block={block_size}: output, gradients, and empty row match CPU SDPA")
large_q = torch.ones(1, 1, dtype=torch.float64)
large_k = torch.tensor([[1000.], [1001.], [-1000.]], dtype=torch.float64)
large_v = torch.tensor([[10.], [20.], [40.]], dtype=torch.float64)
mask = torch.ones(1, 3, dtype=torch.bool)
torch.testing.assert_close(
    tiled_attention(large_q, large_k, large_v, mask, 1),
    F.scaled_dot_product_attention(large_q, large_k, large_v),
    atol=1e-12, rtol=1e-12,
)
print("large-magnitude scores remain stable")
for invalid in (0, -1):
    try:
        tiled_attention(q, k, v, allowed, invalid)
    except ValueError:
        pass
    else:
        raise AssertionError("invalid block size accepted")
print("invalid block sizes rejected")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
block=1: output, gradients, and empty row match CPU SDPA
block=3: output, gradients, and empty row match CPU SDPA
block=20: output, gradients, and empty row match CPU SDPA
large-magnitude scores remain stable
invalid block sizes rejected
```
<!-- leetllm: output:end -->

`numerator` stays unnormalized until every K/V tile for that Q block has contributed. The check covers unequal sequence lengths, a value dimension different from the query dimension, remainder tiles, masked tiles, an empty row, and gradients with respect to Q/K/V. None of those CPU checks measures GPU memory use or kernel speed.

Finite inputs can still overflow intermediate arithmetic. Two very large values can overflow the unnormalized numerator even when their normalized mean fits in FP64. This sketch should reject that case rather than return infinity:

<!-- leetllm: test, id=flash-overflow, continue=flash-sketch, output=show -->
```python title="reject-unnormalized-accumulator-overflow.py"
q_extreme = torch.zeros(1, 1, dtype=torch.float64)
k_extreme = torch.zeros(2, 1, dtype=torch.float64)
v_extreme = torch.full((2, 1), 1e308, dtype=torch.float64)
allow_all = torch.ones(1, 2, dtype=torch.bool)
dense_extreme = F.scaled_dot_product_attention(
    q_extreme, k_extreme, v_extreme, attn_mask=allow_all, dropout_p=0.0
)
assert torch.isfinite(dense_extreme).all()
print("normalized dense result is finite: True")
try:
    tiled_attention(q_extreme, k_extreme, v_extreme, allow_all, 2)
except ValueError as error:
    assert str(error) == "accumulator arithmetic overflowed"
    print("unnormalized accumulator overflow rejected")
else:
    raise AssertionError("silent overflow accepted")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
normalized dense result is finite: True
unnormalized accumulator overflow rejected
```
<!-- leetllm: output:end -->

> **Common mistake:** Dividing `numerator` inside this loop without changing the recurrence mixes normalized and unnormalized state. A normalized running-output formulation is valid too, but its merge rule must restore the old denominator's weight. FlashAttention-1 uses such a formulation; normalization itself isn't the error.[^dao2022]

Production kernels implement the same algebra much more aggressively, while also handling batching, multiple heads, masks, and <span data-glossary="dropout">dropout</span>. They fuse scaling, masking, random-state generation, and accumulator rescaling directly into shared memory and registers so no intermediate tile returns to HBM. Keeping batch and head loops parallel across thread blocks lets those same recurrences scale cleanly across modern GPUs.

```checkpoint
Why can't you average the independently normalized outputs of two K/V blocks?
---
The blocks generally contribute different total softmax weight. Their outputs must be merged using denominators expressed relative to the same maximum, not with equal weight. Keeping an unnormalized numerator makes that weighting explicit.
```

### The backward pass: recomputation can win

Training adds another memory challenge because the backward pass needs attention scores and probabilities to compute gradients with respect to $Q$, $K$, and $V$. To see why, trace a materializing attention backward pass with dropout disabled and value dimension $d$, where forward computes $S = QK^T / \sqrt{d}$, $P = \operatorname{softmax}(S)$, and $O = PV$. Given the upstream output gradient $dO \in \mathbb{R}^{N \times d}$, calculus gives the gradients:

$$
dV = P^T dO
$$

$$
dP = dO V^T
$$

$$
dS = P \odot (dP - D), \quad \text{where } D_i = \sum_{k=1}^d dO_{ik} O_{ik} = dO_i \cdot O_i
$$

$$
dQ = \frac{dS K}{\sqrt{d}}, \quad dK = \frac{dS^T Q}{\sqrt{d}}
$$

Why can the softmax correction use $O$ instead of saving $dP$? For each row, $\sum_j P_{ij}dP_{ij}=\sum_j P_{ij}(dO_i\cdot V_j)=dO_i\cdot\sum_j P_{ij}V_j=dO_i\cdot O_i$. That identity reduces the correction to one scalar per query row.[^dao2022] If values have width $d_v$ different from Q/K width $d$, this dot product runs over $d_v$; the score scale still uses $\sqrt d$.

Check the equations directly on the sketch's unequal-length masked inputs. This dense diagnostic deliberately materializes probabilities. It also gives an empty row zero probabilities and gradients, matching the explicit convention used above.

<!-- leetllm: test, continue=flash-overflow, output=show -->
```python title="verify-attention-backward-equations.py"
with torch.no_grad():
    scores = (q @ k.T / math.sqrt(q.shape[1])).masked_fill(~allowed, -torch.inf)
    row_max = scores.amax(dim=1, keepdim=True)
    reference = torch.where(torch.isfinite(row_max), row_max, 0.0)
    weights = torch.exp(scores - reference)
    denominator = weights.sum(dim=1, keepdim=True)
    p = weights / torch.where(denominator > 0, denominator, 1.0)
    output = p @ v
    upstream = torch.arange(output.numel(), dtype=q.dtype).reshape_as(output) / 10
    dp = upstream @ v.T
    correction = (upstream * output).sum(dim=1, keepdim=True)
    torch.testing.assert_close(correction, (p * dp).sum(dim=1, keepdim=True))
    ds = p * (dp - correction)
    manual = (ds @ k / math.sqrt(q.shape[1]),
              ds.T @ q / math.sqrt(q.shape[1]), p.T @ upstream)

reference_output = F.scaled_dot_product_attention(q, k, v, attn_mask=allowed, dropout_p=0.0)
automatic = torch.autograd.grad((reference_output * upstream).sum(), (q, k, v))
for name, actual, expected in zip(("Q", "K", "V"), manual, automatic):
    torch.testing.assert_close(actual, expected, atol=1e-12, rtol=1e-12)
    print(f"manual d{name} matches SDPA autograd")
assert torch.equal(manual[0][0], torch.zeros_like(q[0]))
print("empty query row contributes zero gradient")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
manual dQ matches SDPA autograd
manual dK matches SDPA autograd
manual dV matches SDPA autograd
empty query row contributes zero gradient
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/backward_lse_reconstruction_dark.png" alt="The materializing backward path saves and rereads one 32 GiB FP16 probability matrix, 64 GiB total logical transfers; FlashAttention saves an 8 MiB FP32 LSE row vector and reconstructs local tiles. For the article’s seeded CPU check, query row 1 and key 0 have score S_10 = -0.385025137 and LSE L_1 = 2.434266205, giving P_10 = exp(S_10 - L_1) = 0.059648198. A 5 by 7 mask shows row 0 fully masked and rows 1 through 4 admitting 4, 5, 6, and 7 keys. The reconstructed probabilities combine with dP and row correction D to form dS, which gives dQ and dK; P and dO independently give dV = P^T dO." />
  <figcaption>The saved row statistic $L_i$ is enough to reconstruct a needed tile probability as $P_{ij}=\exp(S_{ij}-L_i)$. In the seeded CPU check, $S_{10}=-0.385025137$, $L_1=2.434266205$, and $P_{10}=0.059648198$. That probability joins $dP$ and $D_i=dO_i\cdot O_i$ to form $dS$, which feeds $dQ$ and $dK$ with the score scale $1/\sqrt{d}$. The value gradient follows a separate branch: $dV=P^{\top}dO$. Row 0 is fully masked and contributes zero. The 4,096× size ratio compares one $P$ array with LSE only.</figcaption>
</figure>

One baseline saves the entire probability matrix $P$ during forward and reads it during backward; the gradient equations don't require saving $S$ as well. Our FP16 example uses **32 GiB to store $P$, and 64 GiB for one write plus one read**. Keeping one such matrix for each of 32 layers would occupy 1 TiB. Sharding, offloading, or recomputation can lower that storage requirement and keep a run within available memory.

FlashAttention avoids saving full $P$ and $S$.[^dao2022] Modern implementations retain references to existing $Q, K, V$, save $O$, and write a compact row statistic $L_i = m_i + \log \ell_i$ for backward. The attention kernel doesn't need to rewrite its input tensors merely to retain them. Dropout-enabled paths also retain state needed to reproduce the random mask, and while the original FA1 algorithm stores the pair $(m,\ell)$, the current package saves their combined LSE representation.[^dao2022][^flashattention2026repo] For our batch/head/sequence configuration, FP32 $L$ takes **8 MiB**, compared to 32 GiB for one FP16 probability matrix. That 4,096× ratio compares **those two arrays**, not all saved activations or total GPU memory, since Q, K, V, and O still remain in memory.

During the backward pass, FlashAttention **recomputes** the score and probability tiles directly on-chip in SRAM:
1. It loads a tile of $Q_i, K_j, V_j, dO_i,$ and the scalars $L_i$ into SRAM.
2. It recomputes the local score tile on-chip: $S_{ij} = Q_i K_j^T / \sqrt{d}$.
3. Using the saved statistic $L_i$, it recovers the exact probabilities on-the-fly in SRAM registers:
   $P_{ij} = \exp(S_{ij} - L_i)$
4. It immediately evaluates the gradient equations on-chip, accumulating into $dQ, dK,$ and $dV$, and throws the intermediate $S_{ij}$ and $P_{ij}$ tiles away.

Recomputing tiles adds arithmetic but avoids transferring the saved quadratic array. That trade can reduce runtime when the avoided traffic costs more than the extra computation. Tile dimensions alone determine neither execution time: head dimension, dtype, scheduling, and GPU matter. The auxiliary-memory saving follows from which arrays are retained; a backward speedup still needs measurement.

This calculator compares one FP16 probability matrix with the FP32 `softmax_lse` tensor saved by the current [`flash-attention` interface](https://github.com/Dao-AILab/flash-attention/blob/main/flash_attn/flash_attn_interface.py), not every tensor in training:

<!-- leetllm: test, output=show -->
```python title="saved-state-comparison.py"
batch, heads, sequence = 8, 32, 8192
materialized_probabilities = batch * heads * sequence * sequence * 2
softmax_lse = batch * heads * sequence * 4

print(f"one saved probability matrix: {materialized_probabilities / 1024**3:.2f} GiB")
print(f"FP32 softmax LSE:        {softmax_lse / 1024**2:.2f} MiB")
print(f"size ratio:             {materialized_probabilities / softmax_lse:,.0f}x")
print(f"one write plus one read: {2 * materialized_probabilities / 1024**3:.2f} GiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
one saved probability matrix: 32.00 GiB
FP32 softmax LSE:        8.00 MiB
size ratio:             4,096x
one write plus one read: 64.00 GiB
```
<!-- leetllm: output:end -->

| Property | Materializing baseline | FlashAttention |
|----------|-------------------|----------------|
| **Saved attention state for backward** | Save full $P$ (and possibly $S$), plus inputs: $O(n^2+nd)$ | Save Q/K/V/O and row statistics: $O(nd+n)$ |
| **Backward strategy** | Read large intermediates from HBM | Recompute local tiles from $Q, K, V$ plus saved stats in SRAM |
| **Trade-off** | Avoid re-scoring Q/K, retain and transfer a quadratic array | Add tile recomputation, avoid that array; runtime depends on the workload |

```checkpoint
Why can recomputing attention tiles during backward be faster than storing them during forward?
---
If transferring the saved matrix costs more than recalculating its tiles, extra arithmetic can reduce runtime. FlashAttention saves compact row statistics and reconstructs probabilities locally. This explains the possible speedup without assigning an unmeasured time to either operation.
```

## Complexity analysis

With the mechanism in hand, separate mathematical work, extra attention state, and memory traffic. In the paper's two-level memory model, $M$ is fast-memory capacity measured in **scalar elements, not bytes**, and the stated bound assumes $d \leq M \leq nd$. Batch and head count are held fixed. The linear-memory shorthand also holds head dimension $d$ fixed.

| Property | Materializing baseline | FlashAttention |
|----------|-------------------|----------------|
| **Auxiliary attention memory** | Materialize $S$ and $P$: $O(n^2)$ | Keep row stats and the current output tile: $O(n)$ |
| **FLOPs** | $O(n^2 d)$ | $O(n^2 d)$ (same) |
| **HBM reads/writes** | $\Theta(nd + n^2)$ | $\Theta(n^2 d^2 / M)$ |
| **Exact** | Yes | Yes |

<figure>
  <img src="illustrations/_generated/memory_scaling_dark.png" alt="Two aligned plots compare one FP16 score matrix and the FP32 row-wise LSE for batch 8 and 32 heads. At 4,096, 8,192, 12,288, and 16,384 tokens, score storage is 8, 32, 72, and 128 GiB; LSE storage is 4, 8, 12, and 16 MiB. The 8,192-token points are highlighted. Score storage grows quadratically; LSE grows linearly. The ratio compares only these arrays." />
  <figcaption>Read the two curves at the same token positions. From 4K to 16K, the score matrix grows sixteenfold while LSE grows fourfold. At 8K, the two arrays differ by 4,096×; the ratios compare only score storage with row-wise LSE. Q/K/V/O and total model memory are outside this calculation.</figcaption>
</figure>

FLOPs stands for floating-point operations, and the memory row in the table refers only to extra state created by the attention kernel rather than the shared $Q$, $K$, $V$, and $O$ tensors both paths allocate. FlashAttention doesn't reduce the asymptotic mathematical work because both paths still execute $O(n^2 d)$ operations. Instead, the gain comes from avoiding $n^2$ score and probability transfers through HBM, though tile size, scheduling, datatype, and hardware still govern observed speed.

Under the paper's SRAM model, tiling changes HBM reads and writes from $\Theta(nd + n^2)$ for the materializing baseline to $\Theta(n^2 d^2 / M)$.[^dao2022] A larger usable SRAM budget $M$ lets each tile reuse more data before returning to HBM. This IO-model result predicts memory traffic; both paths still perform $O(n^2 d)$ arithmetic, and kernel schedules determine the wall-clock effect seen in benchmarks.

With fixed hardware capacity $M$ and fixed head dimension $d$, **the IO expression still grows quadratically in sequence length**, even while auxiliary storage remains linear. Because FlashAttention computes the exact dense operator via online softmax, it preserves the model's attention rule aside from minor differences caused by floating-point reassociation. The small check below illustrates how score-matrix storage scales quadratically while per-token row statistics scale linearly:

<!-- leetllm: test, output=show -->
```python title="auxiliary-state-scaling.py"
base_sequence = 1024
for sequence in [1024, 2048, 4096, 8192, 16384]:
    materialized_relative = (sequence / base_sequence) ** 2
    row_stats_relative = sequence / base_sequence
    print(
        f"{sequence:>5} tokens: materialized={materialized_relative:>5.0f}x, "
        f"row-stats={row_stats_relative:>2.0f}x"
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
 1024 tokens: materialized=    1x, row-stats= 1x
 2048 tokens: materialized=    4x, row-stats= 2x
 4096 tokens: materialized=   16x, row-stats= 4x
 8192 tokens: materialized=   64x, row-stats= 8x
16384 tokens: materialized=  256x, row-stats=16x
```
<!-- leetllm: output:end -->

```checkpoint
Which complexity changes with FlashAttention: FLOPs, auxiliary attention memory, or model quality?
---
Auxiliary attention memory becomes linear in sequence length for fixed head dimension, while FLOPs remain $O(n^2d)$. Tiling preserves the dense operator's mathematical result. Floating-point ordering and low-precision variants can still change outputs and downstream model quality, so validate numerical behavior with the target precision and evaluation set.
```

## Causal masking in FlashAttention

For autoregressive <span data-glossary="transformer">transformers</span>, attention is **causal**: token $i$ can only attend to tokens $j \leq i$. A materializing baseline allocates a full $N \times N$ matrix and masks the upper triangle, leaving over 33.5 million invalid future pairs per head at 8,192 tokens inside that full allocation. FlashAttention instead omits any materialized causal mask tensor in HBM by moving the mask logic directly into the tiled kernel schedule.

### Block-level skipping

First assume square self-attention, **equal aligned tile sizes $B_r=B_c=B$**, and $N$ divisible by $B$. This creates a $T\times T$ grid with $T=N/B$. For query tile $i$ and key tile $j$:

1. **Upper-triangular tiles ($j > i$):** Every key is future context for every query. The scheduler can omit this pair's matrix multiplication and value contribution. Prefetching and memory allocation depend on the implementation; a K/V block may still be loaded for another query tile.
2. **Lower-triangular tiles ($j < i$):** Every key is valid past context. No per-element causal mask is needed, though padding or other constraints may still apply.
3. **Diagonal tiles ($j = i$):** The query and key tiles overlap in sequence position. The kernel computes the tile dot products $S_{ij} = Q_i K_j^T / \sqrt{d}$ in SRAM, then applies an in-SRAM causal mask: entries where intra-tile key index exceeds intra-tile query index are set to $-\infty$ before the online softmax update.

<figure>
  <img src="illustrations/_generated/causal_tile_scheduler_dark.png" alt="A labeled 4 by 4 tile schedule shows six fully allowed past pairs, four diagonal pairs, and six future pairs skipped. A diagonal tile applies a lower-triangular element mask, setting its upper triangle to negative infinity before softmax." />
  <figcaption>In this equal-size 4 × 4 schedule, 10 of 16 tile pairs are computed and 6 future pairs are skipped. A diagonal tile masks its upper triangle with −∞ before softmax. The 37.5% skipped figure counts tile pairs, not launches, traffic, or time.</figcaption>
</figure>

### Counting skipped tile work

In a $T \times T$ tile grid, total tile pairs equal $T^2$. Count the workload:
- Strictly past tiles ($j < i$): $\frac{T(T-1)}{2}$
- Diagonal tiles ($j = i$): $T$
- Total tiles computed: $\frac{T(T+1)}{2}$
- Future tiles skipped ($j > i$): $\frac{T(T-1)}{2}$

As sequence length grows relative to tile size (large $T$), the fraction of tiles computed is:

$$
\frac{\text{Computed tiles}}{\text{Total tiles}} = \frac{T(T+1)}{2 T^2} = \frac{1}{2} + \frac{1}{2T} \xrightarrow{T \to \infty} 50\%
$$

In the four-tile figure, 10 of 16 pairs run: **62.5% computed, 37.5% skipped**. The skipped fraction approaches 50% for a large equal-tile grid, measuring omitted tile work rather than physical K/V traffic or runtime (which also depend on cache reuse, diagonal work, buffering, and scheduling). You can audit these causal tile decisions directly without any GPU code:

<!-- leetllm: test, output=show -->
```python title="causal-tile-schedule.py"
tiles = 4
counts = {"past": 0, "boundary": 0, "future": 0}

for query_tile in range(tiles):
    for key_tile in range(tiles):
        if key_tile < query_tile:
            decision = "past"
        elif key_tile == query_tile:
            decision = "boundary"
        else:
            decision = "future"
        counts[decision] += 1

print(counts)
print(f"computed tiles: {counts['past'] + counts['boundary']} of {tiles * tiles}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
{'past': 6, 'boundary': 4, 'future': 6}
computed tiles: 10 of 16
```
<!-- leetllm: output:end -->

Unequal tile widths and cached query offsets break the shortcut $j>i$. Comparing **absolute position ranges** handles all shapes consistently: a tile is entirely future if its first key comes after its last query, entirely allowed if its last key is no later than its first query, and otherwise crosses the causal boundary. The script below verifies all three range classifications on asymmetric query and key tiles:

<!-- leetllm: test, output=show -->
```python title="classify-causal-tiles-by-position.py"
def classify(query_start, query_end, key_start, key_end):
    if key_start > query_end:
        return "future"
    if key_end <= query_start:
        return "past"
    return "boundary"

# Query tile 1 of width 128 meets key tile 2 of width 64.
# The key tile index is larger, but some of its keys are still valid.
for key_start, key_end, expected in (
    (128, 191, "boundary"), (0, 127, "past"), (256, 319, "future")
):
    decision = classify(128, 255, key_start, key_end)
    assert decision == expected
    print(f"Q128..255 x K{key_start}..{key_end}: {decision}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Q128..255 x K128..191: boundary
Q128..255 x K0..127: past
Q128..255 x K256..319: future
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/causal_absolute_tile_ranges_dark.png" alt="A shared absolute-position axis compares query positions 128 through 255 with three key ranges. K tile 0 covers positions 0 through 127, entirely before every query. K tile 2 covers 128 through 191, so it includes keys earlier than some query rows and later than others and needs an elementwise causal mask. K tile 4 covers 256 through 319, entirely after every query. The example shows why unequal tile widths must be classified by position ranges instead of tile index." />
  <figcaption>The aligned bars use the same absolute-position scale. K tile 0 is fully allowed, K tile 2 crosses the causal edge and needs elementwise masking, and K tile 4 is entirely future and can be skipped. K tile 2 has a higher tile index than the query tile, yet its keys still overlap valid context. The ranges are half-open for geometry; labels show inclusive token positions.</figcaption>
</figure>

```checkpoint
How does FlashAttention avoid materializing a full causal mask?
---
The scheduler uses query/key positions to omit entirely future pairs, run fully allowed pairs, and mask boundary tiles locally. The $j>i$ shorthand applies to equal aligned tiles in square attention. Skipped tile pairs do not imply an identical percentage saving in HBM traffic or elapsed time.
```

## FlashAttention-2, FlashAttention-3, and FlashAttention-4

Once tiling removes the full score and probability matrices from HBM, performance depends on how well each kernel schedules work for its hardware. The tiled online-softmax idea remains constant across generations, while successive designs alter loop order, warp ownership, and hardware pipelines. Tracking those changes separates algorithmic invariants from GPU-specific tuning.

### Generational comparison

| Generation | Paper benchmark hardware | Key architectural innovation | Scoped reported result |
|------------|-----------------|------------------------------|--------------------|
| **FlashAttention-1** (2022) | Ampere (A100) | IO-aware tiling and online softmax; outer loop over K/V | Linear auxiliary memory; benchmark gains depend on the baseline[^dao2022] |
| **FlashAttention-2** (2023) | Ampere (A100) | Inverted Q outer loop, warp partitioning along Q, unnormalized accumulator | Around 2× FA1 in kernel benchmarks; forward up to 230 TFLOPs/s[^dao2023] |
| **FlashAttention-3** (2024) | Hopper (H100) | TMA async copy, WGMMA, warp specialization, softmax interleaving, FP8 forward | 1.5-2.0× faster than FA2; up to 740 TFLOPs/s FP16 and ~1.2 PFLOPs/s FP8[^shah2024] |
| **FlashAttention-4** (2026) | Blackwell (B200) | Asymmetric scaling pipeline co-design, Python-embedded CuTe-DSL | Up to 1,613 TFLOPs/s in BF16 on B200 (71% peak utilization)[^zadouri2026] |

### FlashAttention-1: the IO-aware foundation

The original paper identified full-matrix materialization as an IO bottleneck in its baselines.[^dao2022] It split $Q, K, V$ into SRAM-sized blocks and used online softmax to update row statistics incrementally. That observation does not imply that every attention kernel on every GPU is memory-bound.

FlashAttention-1 put the outer loop over K/V blocks and the inner loop over Q blocks. Q blocks therefore cycled through the inner loop, so the running output and softmax statistics were saved to HBM and reloaded on later outer steps. FA1 also kept a normalized running output, which meant every inner step paid for an elementwise division.

### FlashAttention-2: loop inversion and warp partitioning

FlashAttention-2 attacked GPU occupancy and non-matmul overhead:[^dao2023]

1. **Loop inversion:** It flipped the loop nest so the outer loop iterates over Q blocks and the inner loop streams K/V blocks through SRAM. A Q block is loaded into fast SRAM registers once and remains pinned there until all K/V blocks have contributed. This cuts out intermediate HBM writes for the output accumulator.
2. **Unnormalized accumulation:** It maintains $O^* = \ell \cdot O$ and normalizes the output once at the end. The tile's exponentials are unnormalized weights, not independently normalized probabilities. Maxima, exponentials, sums, and rescaling still occur inside the loop.
3. **Warp-level partitioning along Q:** FA1's split-K scheme combines partial outputs through shared-memory writes, synchronization, and reduction. FA2 gives warps independent query rows, removing that output-combination step. The full kernel still needs synchronization for dependencies, including additional ones in the backward pass.
4. **Sequence-length parallelization:** FA2 also assigns query blocks to separate thread blocks, increasing available parallelism when batch size and head count alone provide too little work. Resource limits still determine achieved occupancy.

<figure>
  <img src="illustrations/_generated/q_resident_schedule_dark.png" alt="Two query blocks and two key/value blocks reveal the loop-order change. FlashAttention-1 loops over K/V first, updates each Q block, and writes its normalized O, maximum m, and denominator ell to HBM between outer steps. FlashAttention-2 loops over Q first, keeps a query block and unnormalized numerator N on chip while streaming both K/V blocks, then normalizes and writes O once." />
  <figcaption>With two query tiles and two K/V tiles, FA1 revisits each query tile’s running $O$, $m$, and $\ell$ state across the outer K/V loop. FA2 keeps a query tile and unnormalized numerator $N$ resident while both K/V tiles stream past, then normalizes once.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/warp_output_partitioning_dark.png" alt="Split-K assigns different key blocks to warps, which produce partial outputs that must be combined with synchronization. Split-Q assigns different query rows to warps, so each warp owns separate output rows and avoids that output reduction. The rest of the kernel still has dependencies that may require synchronization." />
  <figcaption>Split-K must combine its partial outputs and synchronize. Split-Q gives each warp its own query rows and output rows, removing that output reduction while leaving other kernel dependencies intact.</figcaption>
</figure>

On an A100, FlashAttention-2 reached 50-73% of theoretical peak, roughly 2× faster than FlashAttention-1 and delivering up to 230 TFLOPs/s in FP16.[^dao2023] Eliminating output reductions between warps and removing intermediate HBM state round trips turned occupancy and arithmetic intensity into usable throughput. Realized utilization still depends on head dimension, sequence length, causal masking, and GPU architecture.

### FlashAttention-3: Hopper TMA and warp specialization

On NVIDIA Hopper (H100), raw compute capacity grew faster than memory bandwidth. FlashAttention-3 redesigned the pipeline to exploit Hopper's architectural features:[^shah2024]

1. **Asynchronous memory transfers with TMA:** A thread can issue a multidimensional copy between global and shared memory without staging each element through its registers. Issuing the copy and synchronizing its completion still require instructions.[^nvidia2026hopperTuning]
2. **Asynchronous tensor core math with WGMMA:** A warpgroup (128 threads across 4 warps) coordinates matrix multiplication. FA3 uses both shared-memory and register-sourced first operands; the results and subsequent softmax still have dependencies.
3. **Warp specialization:** Producer warps issue copies while consumer warps perform compute. Circular buffers and barriers overlap transfers and computation when dependencies and resources allow; some transfer work can remain exposed.
4. **Interleaving softmax with GEMM:** Pipelining can overlap softmax with independent matrix work, reducing exposed exponential latency. Extra buffers and synchronization are part of the trade-off.
5. **Low-precision FP8:** It adds a block-quantized FP8 forward path with incoherent processing techniques to handle outlier activations, reaching up to 740 TFLOPs/s in FP16 (75% utilization) and nearly 1.2 PFLOPs/s in FP8 on H100.[^shah2024]

<figure>
  <img src="illustrations/_generated/async_tile_pipeline_dark.png" alt="A conceptual two-slot producer/consumer pipeline. A copy-complete barrier makes slot A safe for WGMMA. While consumers multiply tile A and update softmax, producer warps can fill slot B. Consumers release A after use; producers reuse it for a later tile. Matrix results must arrive before their dependent softmax update. Buffers are finite, barrier waits can block progress, and overlap depends on independent work and resource limits. The schedule has no timing scale or performance claim." />
  <figcaption>The two circular-buffer slots show how producer warps may load the next K/V tile while consumer warps work on the current one. A copy-complete barrier protects each read, WGMMA results feed the dependent softmax update, and a slot becomes reusable after consumers release it. Independent work and available resources determine how much overlap occurs.</figcaption>
</figure>

### FlashAttention-4: Blackwell co-design and CuTe-DSL

On Blackwell GPUs, tensor-core matrix throughput outpaces special-function exponential units and shared-memory bandwidth even more sharply than on Hopper. The March 2026 FlashAttention-4 paper addresses that hardware imbalance directly in its kernel pipeline through three core changes:[^zadouri2026]

- **Larger-tile asynchronous MMA pipelines** overlap softmax with matrix work.
- **Software-emulated exponentials and conditional rescaling** reduce non-matmul overhead. When a maximum increase is small, the algorithm can keep the old reference maximum and evaluate *all* new weights against it. Numerator and denominator remain consistently scaled; simply forgetting to rescale while switching references would be wrong.
- **Tensor memory and two-CTA backward execution** reduce shared-memory traffic and global atomic additions.

Kernel compilation remains part of the Python-embedded **CuTe-DSL** workflow, yielding much shorter compile times than the C++ template pipeline used for FA3.[^zadouri2026] Their B200 BF16 kernel benchmarks report up to 1,613 TFLOPs/s (71% peak), 1.3× cuDNN **9.13**, and 2.7× Triton across causal and noncausal shapes from 1K to 32K tokens with total tokens fixed at 32K. Because end-to-end application throughput includes surrounding layers and runtime overhead, measure it separately, and note that newer cuDNN releases adopted similar methods to reach comparable kernel throughput.[^zadouri2026]

```checkpoint
What changed across FlashAttention generations?
---
Tiled online softmax remains the foundation. FA2 changes parallelism and removes output-combination overhead; FA3 exploits Hopper's asynchronous execution; FA4 tackles exponential throughput and staging on Blackwell. The achieved speedup depends on workload and hardware, and implementations still synchronize where required.
```

## Measured performance

### Training throughput

Each benchmark row applies only to its reported workload and hardware configuration. During model training, saving quadratic attention intermediates can sharply restrict the maximum sequence length a model can process, causing a materializing baseline to run out of memory even while a fused path still fits.

> **Common mistake:** Limiting FlashAttention to long-sequence workloads. The original paper reports a 15% end-to-end speedup for BERT-large at sequence length 512 on eight A100 GPUs against the MLPerf 1.1 implementation. Training to the target masked-language-model accuracy took 17.4 minutes versus 20.0 minutes, averaged over ten runs. Measure the gain for the workload and hardware you plan to use.[^dao2022]

For every result below, keep the exact workload, sequence length, hardware, and baseline attached to the number. Compared with a baseline that stores full attention intermediates, FlashAttention's auxiliary attention memory grows linearly rather than quadratically, enabling longer sequences and higher throughput even when a materializing baseline still fits in memory.[^dao2022][^dao2023]

| Source | Workload | Reported result |
|:-------|:---------|:----------------|
| FlashAttention-2 (2023) | GPT-style training on A100 | Up to 225 TFLOPs/s per GPU, 72% model FLOPs utilization[^dao2023] |

Model FLOPs utilization is an end-to-end training metric, unlike the attention-kernel throughput reported in the preceding section. Don't compare the two as if they timed the same operation. A faster attention kernel may leave optimizer steps, communication, or feed-forward layers as the dominant cost.

### Inference impact

During inference, FlashAttention helps most when the workload still looks like dense attention over many prompt tokens:

- **[Prefill](/learn/inference-mechanics-ttft-tps-kv-cache)** has many query rows. In our coding-assistant example, each query scores itself and earlier keys. Avoiding quadratic intermediates can reduce memory pressure and the attention portion of <span data-glossary="ttft">time to first token (TTFT)</span>.
- **Decode** usually has one query per request and reuses the [KV cache](/learn/kv-cache-paged-attention-llm-serving). Reading that cache can dominate attention time; at small batches, streaming model weights may dominate the whole step instead.
- **Long prompts** amplify the potential memory saving. Application speedup still depends on the baseline backend, batch, head dimensions, and active bottleneck.

Training and prefill expose the full quadratic-intermediate bottleneck because both evaluate attention across all prompt or training query rows simultaneously. Decode has a fundamentally different shape with one new query per sequence step and therefore benefits from kernels built around paged KV streaming rather than dense square tiling. Measuring prefill and decode kernels separately prevents tuning one phase at the expense of the other.

### Production decode uses a related kernel layout interface

Serving engines rarely keep one contiguous KV tensor per request. [PagedAttention](/learn/kv-cache-paged-attention-llm-serving) stores K/V in blocks and maps logical positions through a block table, so production decode needs kernels that apply **FlashAttention-style tiling and online softmax over non-contiguous KV blocks** rather than relying solely on the contiguous prefill path. Representative paged decode interfaces (whose names and APIs evolve) include:

- The package's `flash_attn_with_kvcache`, whose documented paged layout requires a page size divisible by **256** and whose interface doesn't support backward[^flashattention2026repo]
- **FlashInfer** and engine-specific paged attention kernels used by stacks such as <span data-glossary="vllm">vLLM</span>

Those kernels are **complementary to the <span data-glossary="pagedattention">PagedAttention</span> allocator**: paging decides *where* blocks live and how they are shared; the kernel decides *how* Q attends to them. An interface requiring 256-token pages cannot use this 16-token allocator example as-is, so match the selected backend's layout and page-size requirements before deploying. [GQA/MQA](/learn/multi-query-grouped-query-attention) further shrinks the cache, and teams should measure prefill TTFT and decode ITL separately.

Count **valid causal pairs** separately from the full square workspace. Here a decode query sees 8,192 valid keys total, including its current position if present. These are per-head pair counts; kernel instruction counts require a separate measurement:

<!-- leetllm: test, output=show -->
```python title="prefill-versus-decode.py"
prompt_tokens = 8192
prefill_scores = prompt_tokens * (prompt_tokens + 1) // 2
decode_scores = 1 * prompt_tokens

print(f"valid causal prefill pairs: {prefill_scores:,}")
print(f"one decode step scores: {decode_scores:,}")
print(f"pair-count ratio: {prefill_scores / decode_scores:,.1f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
valid causal prefill pairs: 33,558,528
one decode step scores: 8,192
pair-count ratio: 4,096.5x
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/prefill_decode_shape_dark.png" alt="With 8,192 key positions, prefill has 8,192 causal query rows and 33,558,528 valid query-key pairs per head. A decode step has one query row and 8,192 valid keys. The exact pair-count ratio is 4,096.5; the 67,108,864 square slots are not all valid pairs, and the ratio does not measure speed. A separate schematic allocator map sends eight logical 16-token pages to scattered physical blocks; a 128-token kernel read tile follows that map across eight pages. The flash-attn paged interface separately requires a page size divisible by 256." />
  <figcaption>Both workloads read the same 8,192-key span. Prefill contributes 33,558,528 valid causal pairs per head; one decode query contributes 8,192. Their 4,096.5 ratio counts pairs, while the square workspace contains 67,108,864 possible slots. The lower schematic separates allocation from computation: an allocator maps logical 16-token pages to physical blocks, and a kernel read tile follows that mapping. The documented flash-attn paged interface has its own page-size requirement, divisible by 256.</figcaption>
</figure>

### Hardware compatibility

Generation names are not dispatch guarantees. FA3 targets Hopper's TMA, WGMMA, and FP8 features, whereas FA4's paper benchmarks Blackwell while the current repository's CuTe implementation targets **both Hopper and Blackwell**.[^shah2024][^flashattention2026repo] Because paper hardware targets and current package compatibility differ, availability in an application depends on its framework build, device, datatype, <span data-glossary="tensor-shape">tensor shapes</span>, and attention features, making backend verification essential rather than inferring dispatch from a model name.

```checkpoint
When should you expect FlashAttention to help most during inference?
---
Long-prompt prefill exposes quadratic score work and potential intermediate storage. Decode has only one new query per request, but reading a long KV cache can still be expensive. Profile TTFT and decode latency separately; neither phase has a guaranteed speedup.
```

## Using FlashAttention in practice

You rarely write this tiled kernel yourself. <span data-glossary="pytorch">PyTorch</span> exposes `torch.nn.functional.scaled_dot_product_attention` (SDPA), which may choose an optimized CUDA implementation when the inputs and the installed build support it. Its `sdpa_kernel` context manager lets you select permitted implementations while testing or profiling. Eligibility and fallback behavior depend on the installed PyTorch build, device, datatype, layout, and attention features, so consult the documentation for that build and measure the actual path.[^pytorchSdpaDocs2026]

Keep three claims separate: the operator is correct, the requested backend was selected, and the workload got faster, and test them in that exact order. First check the causal operator in plain Python on a tiny row where query token 1 sees keys 0 and 1 only, reserving backend profiling for checking FlashAttention dispatch separately:

<!-- leetllm: test, output=show -->
```python title="causal-softmax-row.py"
import math

scores = [1.0, 2.0, 0.5, 3.0]
values = [10.0, 20.0, 40.0, 80.0]


def weighted_sum(scores, values, allowed):
    masked = [score if ok else float("-inf") for score, ok in zip(scores, allowed)]
    max_score = max(masked)
    weights = [
        0.0 if score == float("-inf") else math.exp(score - max_score)
        for score in masked
    ]
    total = sum(weights)
    return sum(weight * value for weight, value in zip(weights, values)) / total


causal = weighted_sum(scores, values, [True, True, False, False])
full = weighted_sum(scores, values, [True, True, True, True])
print(f"causal output: {causal:.6f}")
print(f"full output:   {full:.6f}")
print(f"masking changed the blend: {causal != full}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
causal output: 17.310586
full output:   58.029621
masking changed the blend: True
```
<!-- leetllm: output:end -->

Causal masking changes the blend because score 3.0 is future context for query 1. For equal query/key lengths, `is_causal=True` applies that lower-triangular rule. Unequal lengths need more care: PyTorch SDPA aligns this mask to the **upper left**, while the FlashAttention package changed to **bottom-right** alignment in version 2.1.[^pytorchSdpaDocs2026][^flashattention2026repo] Swapping APIs without checking that convention can change model outputs.

For one query against four already-valid cache entries, upper-left causal masking admits only the first key. Equal scores make the mistake easy to see: the correct output averages all four values. For a chunk of new queries, build a mask from absolute query/key positions, as the tiled sketch did.

<!-- leetllm: test, deps=torch, output=show -->
```python title="cached-query-alignment.py"
import torch
import torch.nn.functional as F

torch.set_num_threads(1)

q = torch.zeros(1, 1, 1, 2, dtype=torch.float64)
k = torch.zeros(1, 1, 4, 2, dtype=torch.float64)
v = torch.tensor([10., 20., 40., 80.], dtype=torch.float64).reshape(1, 1, 4, 1)
upper_left = F.scaled_dot_product_attention(q, k, v, is_causal=True, dropout_p=0.0)
# All four cache entries are valid for this query, so no causal mask is needed.
valid_cache = F.scaled_dot_product_attention(q, k, v, is_causal=False, dropout_p=0.0)
assert upper_left.item() == 10.0
assert valid_cache.item() == 37.5
print(f"upper-left causal output: {upper_left.item():.1f}")
print(f"all-valid cache output:   {valid_cache.item():.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
upper-left causal output: 10.0
all-valid cache output:   37.5
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/cached_query_mask_alignment_dark.png" alt="One query at absolute position 3 sees four valid cached keys at positions 0, 1, 2, and 3. Their scores are all zero and values are 10, 20, 40, and 80. Correct weights are one quarter each, contributing 2.5, 5, 10, and 20 for output 37.5. An upper-left 1 by 4 causal mask admits only key 0 and returns 10. Padding, unused cache slots, and future keys still need masking." />
  <figcaption>At absolute position 3, all four supplied keys precede or match the query, so equal scores give each value weight $1/4$. The weighted contributions sum to 37.5. A one-row upper-left mask admits only the first key and returns 10. Keep padding, unused capacity, and future positions outside the mask’s allowed set.</figcaption>
</figure>

Padding, unused cache capacity, or future keys still require explicit masking, because setting `is_causal=False` is valid here only when every key in the buffer is live. Once the math is verified, test dispatch on CUDA using `sdpa_kernel(SDPBackend.FLASH_ATTENTION)` to restrict the permitted backend, remembering that unsupported inputs may raise an error instead of silently falling back to math.[^pytorchSdpaDocs2026] Check eligibility first with `can_use_flash_attention` under the same mask, dropout, causal, and GQA settings as the real call so genuine execution errors propagate rather than being masked as an unsupported backend.[^pytorchSdpaBackends2026]

```python title="request-cuda-flash-backend.py"
import torch
import torch.nn.functional as F
from torch.nn.attention import SDPBackend, sdpa_kernel
from torch.backends.cuda import SDPAParams, can_use_flash_attention

Q = torch.randn(2, 16, 1024, 64, device="cuda", dtype=torch.float16)
K = torch.randn(2, 16, 1024, 64, device="cuda", dtype=torch.float16)
V = torch.randn(2, 16, 1024, 64, device="cuda", dtype=torch.float16)

def attention_with_flash_probe(Q, K, V):
    params = SDPAParams(Q, K, V, None, 0.0, True, False)
    if can_use_flash_attention(params, debug=True):
        with sdpa_kernel(SDPBackend.FLASH_ATTENTION):
            output = F.scaled_dot_product_attention(
                Q, K, V, is_causal=True, dropout_p=0.0
            )
        return output, "restricted_flash_completed"
    print("FlashAttention ineligible; using the default permitted backends.")
    output = F.scaled_dot_product_attention(
        Q, K, V, is_causal=True, dropout_p=0.0
    )
    return output, "default_backend_selection"


output, dispatch_path = attention_with_flash_probe(Q, K, V)
print("dispatch policy:", dispatch_path)
```

Backend constraints determine eligibility; an out-of-memory error or device failure describes execution conditions, and a math fallback may need *more* memory. A successful restricted run confirms that a permitted implementation executed. Profile both paths to learn whether it beats the default or selected FA4. Record the PyTorch/CUDA versions, GPU, shapes, mask, dtype, and profiler trace. Warm up both paths, synchronize CUDA timing, and compare repeated latency samples plus peak allocated memory on identical inputs.[^pytorchSdpaTutorial2026] Set `dropout_p=0.0` explicitly at inference; SDPA doesn't inspect a module's `.eval()` state.[^pytorchSdpaDocs2026]

Current Transformers backends accept `attn_implementation="flash_attention_2"` or `"flash_attention_3"` as a load-time request and can also load supported Hub kernels.[^transformers2026attentionBackends] Check model support and dependency compatibility. The string is a request, not a profiler trace:

```python title="request-hf-flash-backend.py"
import torch
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained(
    "your-org/your-supported-causal-lm",
    dtype=torch.bfloat16,
    attn_implementation="flash_attention_2",
    device_map="auto",
)
```

For direct FA4 use, the current repository documents installing `flash-attn-4` and importing `flash_attn_func` from `flash_attn.cute`.[^flashattention2026repo] That is a separate package path, not a version automatically selected by PyTorch's `FLASH_ATTENTION` enum. Check the repository's current CUDA/GPU requirements and the function's layout specification before integrating it.

```checkpoint
If you set `attn_implementation="flash_attention_2"`, what should you verify before assuming the speedup is active?
---
Check that your GPU, datatype, head dimension, mask pattern, framework version, and installed kernel package support the requested backend. Then profile or inspect backend diagnostics on that exact build before reporting a speedup.
```

## Common mistakes

### "FlashAttention is an approximation"

If you group FlashAttention with sparse or low-rank methods, you'll explain the memory saving incorrectly. Tiling preserves the dense formula rather than dropping allowed connections. Compare outputs and gradients with a reference at the intended dtype; the FP64 CPU check verifies the recurrence, not the accuracy of an FP8 GPU implementation.

### "FlashAttention reduces the number of compute operations"

An $O(n)$ memory label doesn't imply linear compute. Dense attention still performs $O(n^2d)$ arithmetic; causal skipping changes its constant factor, not that order. Backward recomputation adds work. When explaining a speedup, identify the avoided transfers and the baseline instead of treating “faster” as evidence of fewer FLOPs.

### "GPU memory is one big pool"

An 80 GB device doesn't provide an 80 GB tile workspace. Check per-SM shared memory, register pressure, accumulator precision, and overlapping load buffers. Our 144 KiB logical subtotal isn't a legal launch configuration by itself. Likewise, the 8 MiB LSE statistic isn't total training memory: Q/K/V/O and the rest of the model remain.

### "A backend swap preserves my mask automatically"

If cached decoding suddenly changes outputs, inspect absolute query positions and causal alignment before blaming floating-point error. The one-query example returns 10 instead of 37.5 under an upper-left mask. Check padding and unused cache slots too. Then verify dropout and compare the operator before profiling the replacement backend.


```mastery-quiz
[
  {
    "question": "A materializing baseline has batch 2, 12 heads and 4096 tokens. Scores and probabilities are FP16, with one write and one read of each full matrix. How large are one score allocation, those four logical transfers, and one FP32 LSE per query row?",
    "options": [
      "768 MiB; 1.5 GiB; 384 KiB.",
      "384 MiB; 1.5 GiB; 192 KiB.",
      "768 MiB; 3 GiB; 384 KiB.",
      "768 MiB; 3 GiB; 768 MiB."
    ],
    "answer": "768 MiB; 3 GiB; 384 KiB.",
    "explanation": "One score matrix is 2×12×4096²×2 bytes = 768 MiB. Four logical passes total 3 GiB; LSE is 2×12×4096×4 bytes = 384 KiB. Two passes omit either the score or probability round trip. Counting triangular valid pairs does not halve a full allocation. LSE has one value per query row, not per pair. These are array and logical-transfer counts, not measured physical traffic."
  },
  {
    "question": "A tile has 48 query rows and 80 key rows. Each query, key and value has 64 FP16 coordinates. The output accumulators and scores use FP32. How many KiB do Q, K, V, the output accumulators and one full score tile occupy in total?",
    "options": [
      "45 KiB",
      "47 KiB",
      "53 KiB",
      "63 KiB"
    ],
    "answer": "53 KiB",
    "explanation": "Q takes 6 KiB. K and V have 80 rows each, so they take 10 KiB apiece. The output uses 48 × 64 × 4 bytes, or 12 KiB. The scores use 48 × 80 × 4 bytes, or 15 KiB. These arrays total 53 KiB. Using 48 rows for K and V gives 45 KiB. Using FP16 for the output gives 47 KiB. Making the score tile 80 × 80 gives 63 KiB."
  },
  {
    "question": "Block A has softmax summary (m=4, ell=2, N=10); block B has (m=5, ell=1, N=−3). Merge at reference 5, using exp(−1)≈0.367879. Which final denominator, numerator and output follow?",
    "options": [
      "ell≈3; N≈7; output≈2.333333.",
      "ell≈1.735759; N≈7; output≈4.032819.",
      "ell≈6.436564; N≈24.182818; output≈3.757101.",
      "ell≈1.735759; N≈0.678794; output≈0.391065."
    ],
    "answer": "ell≈1.735759; N≈0.678794; output≈0.391065.",
    "explanation": "Convert both A sums by exp(4−5). The denominator is 2exp(−1)+1; the numerator is 10exp(−1)−3. Dividing gives about .391065. Adding unconverted summaries mixes references. Rescaling only the denominator corrupts the ratio. Reversing the exponent increases old weights even though the reference increased."
  },
  {
    "question": "A tiled CPU sketch accumulates one key at a time in FP64. It divides by 1 if a row has zero total weight and reports overflow if the unnormalized numerator becomes nonfinite. Run A masks both keys, whose values are 4 and 12. Run B admits four keys with zero scores and value 7 × 10^307 each. The largest finite FP64 value is about 1.8 × 10^308. What output does A return, and how many keys can B accumulate before overflow?",
    "options": [
      "A returns 8. B can accumulate two keys.",
      "A returns 0. B can accumulate all four keys.",
      "A returns 0. B can accumulate two keys.",
      "A returns 8. B can accumulate all four keys."
    ],
    "answer": "A returns 0. B can accumulate two keys.",
    "explanation": "In A, masking both keys leaves the numerator at zero. Dividing by 1 gives zero. An output of 8 would give both masked values equal shares. In B, each unnormalized weight is 1. The first two values sum to 1.4 × 10^308. The third would bring the sum to 2.1 × 10^308, so the sketch reports overflow. Averaging all four values would give a finite 7 × 10^307, but the sketch checks the numerator before it divides."
  },
  {
    "question": "An attention row has scores [0, ln(3)], scalar values [4, 12] and dropout disabled. The upstream output derivative is 2. What are the row correction D, the two score derivatives dS and the two value derivatives dV, in that order?",
    "options": [
      "10, [−0.5, 10.5], [0.5, 1.5]",
      "20, [−3, 3], [0.25, 0.75]",
      "10, [−0.5, 10.5], [0.25, 0.75]",
      "20, [−3, 3], [0.5, 1.5]"
    ],
    "answer": "20, [−3, 3], [0.5, 1.5]",
    "explanation": "Exponentiating the scores gives weights of 1 and 3, so the probabilities are 0.25 and 0.75. The output is 0.25 × 4 + 0.75 × 12 = 10. Multiplying by the upstream derivative gives D = 20. The probability derivatives are 2 × [4, 12] = [8, 24]. Subtract 20 from each and multiply by its probability to get dS = [−3, 3]. Using the output itself as D gives [−0.5, 10.5]. Each value receives its share of the upstream derivative, giving dV = [0.5, 1.5]. Reporting [0.25, 0.75] drops that upstream factor."
  },
  {
    "question": "In the two-level memory model, sequence length grows from 1,536 to 4,608 tokens and fast-memory capacity M grows from 12,288 to 24,576 scalar elements. Head width d stays at 64, and batch size and head count stay fixed. Both settings satisfy d ≤ M ≤ nd, where n is sequence length. By what factors do the tiled IO expression, dense arithmetic work and storage for one statistic per query row grow, in that order?",
    "options": [
      "9×, 9×, 9×",
      "4.5×, 9×, 3×",
      "9×, 3×, 3×",
      "4.5×, 3×, 9×"
    ],
    "answer": "4.5×, 9×, 3×",
    "explanation": "Tripling both token axes gives nine times as many query-key pairs. In the tiled IO expression n²d²/M, the numerator grows by 9 and the denominator doubles. Modeled IO therefore grows by 9/2 = 4.5. An IO factor of 9 ignores the extra fast memory. Dense work grows by 9 because each pair still needs its dot product. A work factor of 3 counts the extra queries and misses the extra keys each query scores. Row storage grows by 3. A storage factor of 9 counts one statistic per pair."
  },
  {
    "question": "In causal self-attention, one tile covers query positions 32 through 47 and key positions 25 through 32, inclusive. Can the kernel admit the whole tile, or must it mask some entries? Separately, a square causal grid has five equal aligned tiles per axis. How many tile pairs does it compute and how many does it skip?",
    "options": [
      "Mask some entries. Compute 15 and skip 10.",
      "Admit the whole tile. Compute 10 and skip 15.",
      "Admit the whole tile. Compute 15 and skip 10.",
      "Mask some entries. Compute 10 and skip 15."
    ],
    "answer": "Admit the whole tile. Compute 15 and skip 10.",
    "explanation": "The latest key and the earliest query both have position 32. A query can attend to its own position, so even that pair is allowed. Masking entries would exclude valid keys. In the separate grid, successive query tiles use 1, 2, 3, 4 and 5 key tiles. That makes 15 computed pairs and leaves 10 of the 25 to skip. Computing only 10 would skip all five diagonal tiles even though they contain allowed pairs."
  },
  {
    "question": "A PyTorch module calls functional scaled dot-product attention (SDPA) with dropout_p=0.2 during training. In eval mode, its single query is at absolute position 2. Only slots 0 through 2 hold valid keys. All five scores are zero and the cache values are [64, 24, 32, 100, 100] in slot order. Which attention output should inference reproduce, and what dropout_p should the module pass?",
    "options": [
      "Output 64 with dropout_p=0.2.",
      "Output 40 with dropout_p=0.0.",
      "Output 64 with dropout_p=0.0.",
      "Output 40 with dropout_p=0.2."
    ],
    "answer": "Output 40 with dropout_p=0.0.",
    "explanation": "Equal scores give the three valid keys equal weights, so the output is (64 + 24 + 32)/3 = 40. Averaging in the two stale slots gives 320/5 = 64. An upper-left causal mask on this single query also gives 64 because it admits only the first key. Functional SDPA uses the dropout probability passed by its caller. Passing 0.2 keeps dropout active even in eval mode. Passing 0.0 preserves the inference weights."
  },
  {
    "question": "A supplied serial request takes 12 ms in attention and 18 ms elsewhere. A replacement halves attention time. In a separate probe, actual inputs are eligible for a restricted FlashAttention call, but execution raises an out-of-memory error. Which total-speedup and error-policy pair is justified?",
    "options": [
      "Speedup 2×; propagate the execution error.",
      "Speedup 1.25×; relabel the error as backend ineligibility.",
      "Speedup 1.25×; propagate the execution error.",
      "Speedup 2×; relabel the error as backend ineligibility."
    ],
    "answer": "Speedup 1.25×; propagate the execution error.",
    "explanation": "The new total is 6+18=24 ms, so overall speedup is 30/24=1.25. The 2× claim applies to the attention segment only. Eligibility does not guarantee successful execution; an OOM must not be hidden as an unsupported-backend fallback. A permitted math path can need more memory."
  },
  {
    "question": "In a two-slot asynchronous schedule, consumers still read tile A while producer slot B is free. Separately, online state uses reference m=1 and a new score is 1.3. Which pair of actions preserves buffer ownership and a common softmax reference?",
    "options": [
      "Fill B; reuse A after consumer release. Keep m=1 and evaluate the new weight as exp(0.3).",
      "Overwrite A; fill B after that read. Keep m=1 and evaluate the new weight as exp(0.3).",
      "Fill B; reuse A after consumer release. Set m=1.3 and leave both old sums unchanged.",
      "Overwrite A; fill B after that read. Set m=1.3 and leave both old sums unchanged."
    ],
    "answer": "Fill B; reuse A after consumer release. Keep m=1 and evaluate the new weight as exp(0.3).",
    "explanation": "A live read protects A until consumers release it; an independent B copy can proceed subject to copy-complete synchronization. Conditional rescaling may keep the old reference and evaluate all new weights against it, here exp(1.3−1). If the reference instead changes, both old sums must rescale. Issued copy is not completed copy, and asynchronous execution does not authorize overwriting a live tile."
  }
]
```

> **Next:** Continue to [Continuous Batching & Scheduling](/learn/continuous-batching-request-scheduling). Tiling keeps one dense attention call from parking an $n^2$ matrix in HBM. The scheduler still has to decide which requests share the next forward pass, and that choice sets TTFT and <span data-glossary="itl">inter-token latency</span>.
