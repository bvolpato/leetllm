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
    "kv-cache-paged-attention-llm-serving",
    "scaled-dot-product-attention",
    "inference-mechanics-ttft-tps-kv-cache"
  ],
  "relatedQuestions": [
    "continuous-batching-request-scheduling",
    "kv-cache-paged-attention-llm-serving",
    "multi-query-grouped-query-attention",
    "model-parallelism-for-llm-inference",
    "positional-encoding-rope-alibi"
  ],
  "section": "GPU Systems & LLM Inference",
  "order": 4,
  "aliases": [
    "deep-dive-flashattention"
  ]
}
---

Every prompt <span data-glossary="token">token</span> in causal <span data-glossary="prefill">prefill</span> attends to itself and every earlier token. Materializing the full square score <span data-glossary="matrix">matrix</span> $S = QK^{\top}/\sqrt{d}$ quadruples memory every time sequence length doubles: at batch 8, 32 heads, and 8,192 tokens, one <span data-glossary="fp16">FP16</span> score matrix claims **32 GiB** before counting probabilities, weights, or activations.

<span data-glossary="flashattention">FlashAttention</span> computes the exact same dense [attention](/learn/scaled-dot-product-attention) without storing $S$ or the probability matrix $P$ in <span data-glossary="hbm">HBM</span>.[^dao2022] Keeping active tiles in fast on-chip <span data-glossary="sram">SRAM</span> and streaming keys and values past them with <span data-glossary="online-softmax">online softmax</span> cuts auxiliary storage from quadratic to linear and eliminates the HBM round-trips that stall standard attention.

## The memory wall

At batch 8, 32 heads, and 8,192 tokens in FP16, $8 \times 32 \times 8192^2 \times 2 = 32\text{ GiB}$ ($34.36\text{ GB}$). PyTorch's <span data-glossary="scaled-dot-product-attention">SDPA</span> math fallback keeps FP32 intermediates, doubling that to 64 GiB.[^pytorchSdpaDocs2026] An unfused four-pass baseline writes $S$, reads $S$ for <span data-glossary="softmax">softmax</span>, writes $P$, and reads $P$ for $PV$, moving **128 GiB of intermediate traffic** across HBM per layer.

<!-- leetllm: test, output=show -->
```python title="score-matrix-size.py"
score_bytes = 8 * 32 * 8192 * 8192 * 2
print(f"one FP16 score matrix: {score_bytes / 1024**3:.2f} GiB | 4-pass traffic: {4 * score_bytes / 1024**3:.2f} GiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
one FP16 score matrix: 32.00 GiB | 4-pass traffic: 128.00 GiB
```
<!-- leetllm: output:end -->

GPUs separate tiny on-chip SRAM from off-die HBM: on **H100 SXM**, each SM has 228 KiB shared memory (max 227 KiB/block) plus a 256 KiB register file, while HBM holds 80 GB at 3.35 TB/s.[^nvidia2026hopperTuning][^nvidia2026h100] Low-intensity elementwise ops like softmax sit pinned to the HBM bandwidth ceiling whenever they bounce $n \times n$ matrices off chip.

<figure>
  <img src="illustrations/_generated/tile_working_set_dark.png" alt="Memory hierarchy map showing CPU DRAM, H100 HBM (80 GB, 3.35 TB/s), and SM-local SRAM (228 KiB shared memory + 256 KiB registers), with a 144 KiB working set for a 128x64 tile." />
  <figcaption>A 128x64 attention tile needs 144 KiB across shared memory and registers (48 KiB FP16 Q/K/V, 32 KiB FP32 output accumulator, 64 KiB FP32 score tile), fitting on chip instead of bouncing 128 GiB through HBM.</figcaption>
</figure>

## Tiling and online softmax

FlashAttention fuses attention into one SRAM-tiled pass: load a $Q$ tile on chip, stream $K, V$ tiles past it, update running row softmax statistics, and discard every $S_{ij}$ and $P_{ij}$ tile immediately.

<figure>
  <img src="illustrations/_generated/flash_attention_dark.png" alt="Comparison of materialized 128 GiB HBM transfers against tiled FlashAttention streaming K and V through SRAM and writing O plus an 8 MiB FP32 LSE vector." />
  <figcaption>Materialized attention shuttles 128 GiB of intermediates through HBM; FlashAttention discards tiles on chip and writes only $O$ plus an 8 MiB FP32 LSE vector.</figcaption>
</figure>

### How online softmax stays exact

Because later key tiles can raise a row's maximum $m$, safe softmax rescales previous sums using $e^{s_j - m_{\text{new}}} = e^{m_{\text{old}} - m_{\text{new}}} e^{s_j - m_{\text{old}}}$:

$$
m_{\text{new}} = \max(m_{\text{old}}, m_{\text{tile}}), \qquad
\ell_{\text{new}} = e^{m_{\text{old}} - m_{\text{new}}} \ell_{\text{old}} + \ell_{\text{tile}}, \qquad
N_{\text{new}} = e^{m_{\text{old}} - m_{\text{new}}} N_{\text{old}} + N_{\text{tile}}
$$

Split scores `[1.0, 2.0, 3.0]` and values `[10, 20, 40]` into Block A `[1.0, 2.0]` ($m_A = 2$, $\ell_A \approx 1.368$, $N_A \approx 23.679$) and Block B `[3.0]`. When Block B moves the max to $3$, multiply *both* $\ell_A$ and $N_A$ by $\alpha = e^{2-3} \approx 0.368$, add Block B ($1$ and $40$), and divide once at the end: $O = 48.711 / 1.503 \approx 32.4045$, matching dense softmax. FlashAttention-2 keeps $N$ unnormalized across the inner loop and divides by $\ell_{\text{final}}$ once before storing $O$, removing FA1's per-step division.[^dao2022][^dao2023]

<figure>
  <img src="illustrations/_generated/tiling_strategy_dark.png" alt="Online softmax merging Block A (scores 1, 2; values 10, 20) with Block B (score 3; value 40) by rescaling both denominator and numerator by exp(2-3), giving 32.404513." />
  <figcaption>Rescaling both $\ell_A$ and $N_A$ by $\alpha = e^{2-3}$ aligns Block A to Block B's maximum before merging, yielding exact output `32.404513`.</figcaption>
</figure>

Verify the Q-outer tiled recurrence (handling unequal lengths, remainder tiles, and an all-masked row that returns zero[^flashattention2026repo]) and its autograd gradients against PyTorch SDPA:

<!-- leetllm: test, id=flash-sketch, deps=torch, output=show -->
```python title="flash-attention-sketch.py"
import math, torch
import torch.nn.functional as F

torch.set_num_threads(1)

def tiled_attention(q, k, v, allowed, block_size):
    nq, d = q.shape
    nk = k.shape[0]
    out = []
    for i in range(0, nq, block_size):
        qi = q[i:i + block_size]
        m = torch.full((len(qi), 1), -torch.inf, dtype=q.dtype)
        l = torch.zeros_like(m)
        num = torch.zeros((len(qi), v.shape[1]), dtype=q.dtype)
        for j in range(0, nk, block_size):
            s = (qi @ k[j:j + block_size].T / math.sqrt(d)).masked_fill(
                ~allowed[i:i + len(qi), j:j + block_size], -torch.inf
            )
            new_m = torch.maximum(m, s.amax(dim=1, keepdim=True))
            ref = torch.where(torch.isfinite(new_m), new_m, 0.0)  # Avoid -inf - (-inf).
            scale = torch.exp(m - ref)
            w = torch.exp(s - ref)
            num = scale * num + w @ v[j:j + block_size]
            l = scale * l + w.sum(dim=1, keepdim=True)
            m = new_m
        out.append(num / torch.where(l > 0, l, 1.0))
    return torch.cat(out)

torch.manual_seed(7)
q = torch.randn(5, 4, dtype=torch.float64, requires_grad=True)
k = torch.randn(7, 4, dtype=torch.float64, requires_grad=True)
v = torch.randn(7, 3, dtype=torch.float64, requires_grad=True)
allowed = torch.arange(7)[None, :] <= (torch.arange(5) + 2)[:, None]
allowed[0] = False  # Fully masked row -> zero output.

expected = F.scaled_dot_product_attention(q, k, v, attn_mask=allowed, dropout_p=0.0)
ref_grads = torch.autograd.grad(expected.square().sum(), (q, k, v))
for bs in (1, 3, 20):
    got = tiled_attention(q, k, v, allowed, bs)
    torch.testing.assert_close(got, expected, atol=1e-12, rtol=1e-12)
    for g, rg in zip(torch.autograd.grad(got.square().sum(), (q, k, v)), ref_grads):
        torch.testing.assert_close(g, rg, atol=1e-11, rtol=1e-11)
print("block sizes 1, 3, 20: outputs, gradients, and empty row match SDPA")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
block sizes 1, 3, 20: outputs, gradients, and empty row match SDPA
```
<!-- leetllm: output:end -->

### Backward pass: recompute from LSE

Standard backward saves the 32 GiB probability matrix $P$ (64 GiB write+read) to evaluate $dV = P^{\top} dO$, $dP = dO\,V^{\top}$, $dS = P \odot (dP - D)$ with scalar row correction $D_i = dO_i \cdot O_i$, $dQ = dS\,K/\sqrt{d}$, and $dK = dS^{\top} Q/\sqrt{d}$.[^dao2022] FlashAttention saves only one FP32 **log-sum-exp** scalar per query row, $L_i = m_i + \log \ell_i$ (**8 MiB** vs. 32 GiB, a 4,096x auxiliary reduction), and recomputes local $P_{ij} = \exp(S_{ij} - L_i)$ in SRAM during backward.

<figure>
  <img src="illustrations/_generated/backward_lse_reconstruction_dark.png" alt="Backward pass reconstructing local probabilities P_ij = exp(S_ij - L_i) from an 8 MiB FP32 LSE vector instead of saving a 32 GiB probability matrix." />
  <figcaption>Recomputing $S_{ij}$ and $P_{ij} = \exp(S_{ij} - L_i)$ on chip trades extra Tensor Core FLOPs to avoid 64 GiB of HBM traffic.</figcaption>
</figure>

## Complexity and causal tile skipping

In the two-level SRAM model (capacity $M$ scalar elements, $d \le M \le nd$):[^dao2022]

| Property | Materialized baseline | FlashAttention |
|---|---|---|
| **Auxiliary memory** | $O(n^2)$ for $S$ and $P$ | $O(n)$ for row LSE |
| **FLOPs** | $O(n^2 d)$ | $O(n^2 d)$ (exact dense attention; extra backward recompute) |
| **HBM reads/writes** | $\Theta(nd + n^2)$ | $\Theta(n^2 d^2 / M)$ |

Scaling sequence length from 4K to 16K grows materialized FP16 score storage 16x (from 8 GiB to 128 GiB), while FP32 LSE grows just 4x (from 4 MiB to 16 MiB).

For causal attention, FlashAttention skips materialized masks by classifying tile pairs from **absolute token ranges**: skip strictly future tiles (`key_start > query_end`, cutting ~50% of work as grid size grows), run past tiles unmasked (`key_end <= query_start`), and mask boundary tiles locally in SRAM. Always compare position ranges rather than tile indices $j > i$ when query and key tile widths differ (for example, 64-wide K tile 2 covering `128..191` still overlaps 128-wide Q tile 1 covering `128..255`).

<figure>
  <img src="illustrations/_generated/causal_tile_scheduler_dark.png" alt="4x4 causal tile grid computing 6 past and 4 diagonal tiles while skipping 6 future tiles." />
  <figcaption>In an aligned 4x4 grid, 10 tile pairs run and 6 future pairs (37.5%) skip completely.</figcaption>
</figure>

## Evolution across GPU generations: FA1 to FA4

| Generation | Hardware focus | Key scheduling shift | Reported peak |
|---|---|---|---|
| **FA1** (2022)[^dao2022] | Ampere (A100) | SRAM tiling + online softmax; K/V outer loop | 15% faster BERT-large (512 seq) |
| **FA2** (2023)[^dao2023] | Ampere (A100) | Q-resident outer loop, split-Q warps, unnormalized numerator | ~2x FA1; 230 TFLOPs/s FP16 |
| **FA3** (2024)[^shah2024] | Hopper (H100) | TMA async copy, WGMMA, warp specialization, FP8 forward | 740 TFLOPs/s FP16; ~1.2 PFLOPs/s FP8 |
| **FA4** (2026)[^zadouri2026] | Blackwell (B200) & Hopper | Software-emulated `exp`, conditional rescaling, TMEM, 2-CTA backward, CuTe-DSL | 1,613 TFLOPs/s BF16 on B200 (71% peak) |

FA2 flipped FA1's outer loop to pin $Q$ tiles and unnormalized $N$ on chip (eliminating FA1's intermediate HBM writes) and switched from split-K to split-Q warps so each warp owns disjoint query rows with no cross-warp output reduction.[^dao2023] FA3 split Hopper warps into TMA producers and WGMMA/softmax consumers over circular shared buffers.[^shah2024] FA4 tackles Blackwell's faster Tensor Cores vs. slower special-function units with emulated exponentials, conditional rescaling (reusing the old reference max when a tile's max barely grows), TMEM accumulators, and Python-embedded CuTe-DSL.[^zadouri2026]

<figure>
  <img src="illustrations/_generated/async_tile_pipeline_dark.png" alt="Two-slot circular buffer overlapping TMA producer loads on slot B with WGMMA and softmax consumers on slot A." />
  <figcaption>FA3 warp specialization overlaps producer TMA copies with consumer WGMMA/softmax across circular buffer slots.</figcaption>
</figure>

## Prefill vs. decode and paged KV kernels

Training and long-prompt **prefill** expose quadratic scores ($33.56\text{M}$ valid causal pairs per head at 8K context), whereas single-token **decode** scores just 8,192 cached keys (a 4,096.5x ratio) and is KV-bandwidth-bound. Production engines layer [PagedAttention](/learn/kv-cache-paged-attention-llm-serving)'s block table under paged tiled kernels like `flash_attn_with_kvcache` (forward-only, requiring page sizes divisible by 256 in FA2[^flashattention2026repo]) or FlashInfer, and use `flash_attn_varlen_func` with `int32` `cu_seqlens` for packed variable-length batches.

<figure>
  <img src="illustrations/_generated/prefill_decode_shape_dark.png" alt="8,192-token causal prefill (33.56M valid pairs) vs. single-token decode (8,192 keys) and paged KV block-table indirection." />
  <figcaption>Prefill scores 4,096.5x more causal pairs per head than one decode step; paged decode kernels follow block tables across scattered physical pages.</figcaption>
</figure>

## Practical surfaces, layouts, and the Causal 2.1 gotcha

FA2, FA3, and FA4 ship as **separate wheels and import paths**, not one auto-upgrading package:[^flashattention2026repo]

| Surface | Install & import | Hardware target |
|---|---|---|
| **PyTorch SDPA** | `F.scaled_dot_product_attention`[^pytorchSdpaDocs2026] | Auto-dispatches Flash, Mem-Efficient, or Math backend |
| **FlashAttention-2** | `pip install flash-attn --no-build-isolation` -> `from flash_attn import flash_attn_func` | Ampere, Ada, Hopper (CUDA 12.0+); AMD ROCm (CK / AIter Triton) |
| **FlashAttention-3** | Build `hopper/` -> `from flash_attn_3 import flash_attn_interface` | Hopper H100 / H800 (CUDA 12.3+) |
| **FlashAttention-4** | `pip install flash-attn-4` -> `from flash_attn.cute import flash_attn_func` | Hopper & Blackwell via CuTe-DSL |

Prefer PyTorch SDPA (or HF `attn_implementation="flash_attention_2"` / `"flash_attention_3"`[^transformers2026attentionBackends]) unless you need FA3/FA4, paged KV, or varlen APIs. Watch three interface traps: (1) `flash_attn_func` uses `(B, S, H, D)` while SDPA uses `(B, H, S, D)`, (2) FA2 returns `out` (`return_attn_probs=True` allocates a quadratic debug buffer!) while FA4 returns `(out, lse)`, and (3) FA2 groups GQA query heads contiguously (`[0,0,0,1,1,1]`, never interleaved).

### Bottom-right (FA 2.1+) vs. upper-left (SDPA) causal alignment

During cached decode or chunked prefill (`seqlen_q < seqlen_k`), new queries sit at the **end** of the sequence. Starting in **FlashAttention 2.1**, `causal=True` aligns the diagonal to the **bottom-right** (`k <= q + seqlen_k - seqlen_q`).[^flashattention2026repo] By contrast, **PyTorch SDPA (`is_causal=True`)** aligns to the **upper-left** (`k <= q`), blinding a single decode query to every cached key after index 0!

<!-- leetllm: test, deps=torch, output=show -->
```python title="cached-query-alignment.py"
import numpy as np, torch
import torch.nn.functional as F

torch.set_num_threads(1)
qi, ki = np.arange(2)[:, None], np.arange(5)[None, :]
print("SDPA/FA2.0 top-left:   ", (ki <= qi).astype(int).tolist())
print("FA2.1+ bottom-right:   ", (ki <= qi + 5 - 2).astype(int).tolist())

q = torch.zeros(1, 1, 1, 2, dtype=torch.float64)
k = torch.zeros(1, 1, 4, 2, dtype=torch.float64)
v = torch.tensor([10.0, 20.0, 40.0, 80.0], dtype=torch.float64).reshape(1, 1, 4, 1)
wrong = F.scaled_dot_product_attention(q, k, v, is_causal=True, dropout_p=0.0).item()
right = F.scaled_dot_product_attention(q, k, v, is_causal=False, dropout_p=0.0).item()
assert wrong == 10.0 and right == 37.5
print(f"SDPA decode is_causal=True (wrong): {wrong:.1f} | all-valid cache: {right:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
SDPA/FA2.0 top-left:    [[1, 0, 0, 0, 0], [1, 1, 0, 0, 0]]
FA2.1+ bottom-right:    [[1, 1, 1, 1, 0], [1, 1, 1, 1, 1]]
SDPA decode is_causal=True (wrong): 10.0 | all-valid cache: 37.5
```
<!-- leetllm: output:end -->

> **Common mistake:** Passing `is_causal=True` to SDPA during cached decode, passing `nn.MultiheadAttention`'s inverted `key_padding_mask` (`True` = ignore) to SDPA's `attn_mask` (`True` = keep), or omitting `dropout_p=0.0` at eval time (functional SDPA ignores `model.eval()`).[^pytorchSdpaDocs2026]

Always probe dispatch on CUDA with `can_use_flash_attention` and `sdpa_kernel(SDPBackend.FLASH_ATTENTION)` before timing with CUDA events, and never catch an OOM as "backend ineligible" (falling back to math allocates *more* memory).[^pytorchSdpaBackends2026][^pytorchSdpaTutorial2026]

```mastery-quiz
[
  {
    "question": "A materializing baseline has batch 2, 12 heads, and 4,096 tokens in FP16 with one write and read each of S and P. What are one score matrix, four-pass traffic, and FP32 LSE?",
    "options": [
      "768 MiB; 1.5 GiB; 384 KiB.",
      "384 MiB; 1.5 GiB; 192 KiB.",
      "768 MiB; 3 GiB; 384 KiB.",
      "768 MiB; 3 GiB; 768 MiB."
    ],
    "answer": "768 MiB; 3 GiB; 384 KiB.",
    "explanation": "One score matrix is 2*12*4096^2*2 = 768 MiB; 4 passes = 3 GiB; FP32 LSE is 2*12*4096*4 = 384 KiB."
  },
  {
    "question": "Merge online softmax states Block A (m=4, ell=2, N=10) and Block B (m=5, ell=1, N=-3) at reference m=5 (exp(-1) approx 0.367879).",
    "options": [
      "ell=3; N=7; output=2.333333.",
      "ell=1.735759; N=7; output=4.032819.",
      "ell=6.436564; N=24.182818; output=3.757101.",
      "ell=1.735759; N=0.678794; output=0.391065."
    ],
    "answer": "ell=1.735759; N=0.678794; output=0.391065.",
    "explanation": "Rescale both Block A sums by exp(4-5): ell = 2*exp(-1)+1 = 1.735759, N = 10*exp(-1)-3 = 0.678794, output = 0.391065."
  },
  {
    "question": "An attention row has scores [0, ln(3)], values [4, 12], no dropout, and upstream gradient dO = 2. What are D, dS, and dV?",
    "options": [
      "10, [-0.5, 10.5], [0.5, 1.5]",
      "20, [-3, 3], [0.25, 0.75]",
      "10, [-0.5, 10.5], [0.25, 0.75]",
      "20, [-3, 3], [0.5, 1.5]"
    ],
    "answer": "20, [-3, 3], [0.5, 1.5]",
    "explanation": "P = [0.25, 0.75], O = 10, D = 2*10 = 20, dP = [8, 24], dS = P*(dP-D) = [-3, 3], dV = P^T*dO = [0.5, 1.5]."
  },
  {
    "question": "One causal tile covers Q 32..47 and K 25..32. Separately, a 5x5 square aligned grid runs causal attention. How is the single tile handled, and how many 5x5 pairs run vs. skip?",
    "options": [
      "Mask some entries; compute 15, skip 10.",
      "Admit whole tile; compute 10, skip 15.",
      "Admit whole tile; compute 15, skip 10.",
      "Mask some entries; compute 10, skip 15."
    ],
    "answer": "Admit whole tile; compute 15, skip 10.",
    "explanation": "Every key <= every query (32 >= 32), so admit the whole tile unmasked. A 5x5 causal grid runs 1+2+3+4+5 = 15 pairs and skips 10."
  },
  {
    "question": "During eval decode, one query at position 2 attends over 5 cache slots (0..2 valid, zero scores, values [64, 24, 32, 100, 100]). Which PyTorch SDPA output and arguments are right?",
    "options": [
      "64 with is_causal=True, dropout_p=0.0.",
      "40 with an explicit keep mask for slots 0..2 and dropout_p=0.0.",
      "40 with is_causal=True and model.eval() (dropout_p=0.2).",
      "64 with is_causal=False, dropout_p=0.0."
    ],
    "answer": "40 with an explicit keep mask for slots 0..2 and dropout_p=0.0.",
    "explanation": "Mean of valid slots is (64+24+32)/3 = 40. SDPA is_causal=True uses upper-left alignment (returning 64), is_causal=False includes stale 100s (64), and dropout_p=0.0 must be passed explicitly."
  }
]
```

> **Next:** Continue to [Continuous Batching & Scheduling](/learn/continuous-batching-request-scheduling).
