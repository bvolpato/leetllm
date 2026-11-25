---
{
  "id": "gpt-to-modern-llms",
  "title": "From GPT to Modern LLMs",
  "slug": "gpt-to-modern-llms",
  "section": "Core LLM Foundations",
  "category": "NLP Fundamentals",
  "difficulty": "Medium",
  "order": 9,
  "coverImage": "illustrations/_generated/llm_evolution_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic"
  ],
  "shortDescription": "One autoregressive model handles classification, span extraction, and grounded synthesis through a shared token interface while scaling laws, KV caches, and context position determine real behavior.",
  "keyConceptsTested": [
    "The split between Encoder-only (BERT) and Decoder-only (GPT) models",
    "Scaling laws: why model size, data, and compute must be balanced",
    "Chinchilla compute-optimal training versus token-starved large models",
    "Few-shot in-context evaluation without parameter updates",
    "Open-weight models: LLaMA, deployment choices, and license checks",
    "Modern architectural shifts: mixture-of-experts routing and reasoning budgets",
    "The life of a token: tokenization, embedding, attention, and KV cache",
    "Context window behavior: lost in the middle and prompt placement",
    "How to evaluate model announcements against a real workload"
  ],
  "prerequisites": [
    "transformer-architecture-end-to-end",
    "language-modeling-next-token-prediction"
  ],
  "aliases": [
    "llm-lifecycle-training-to-deployment"
  ]
}
---

An assistant reading a 2,000-line ML codebase handles three jobs in one afternoon: classify a note by topic, extract `rope_theta`, and explain why grouped-query attention shrinks the KV cache. Classic NLP trains three separate models. A modern decoder LLM runs all three through one next-token loop.

**GPT** (*Generative Pre-trained Transformer*) names OpenAI's causal decoder family, while **LLM** covers large pretrained language models broadly. From the 2017 <span data-glossary="transformer">Transformer</span>,[^vaswani2017] LLMs evolved along four axes: causal task framing, balanced scaling, leaner inner blocks (RMSNorm, SwiGLU, RoPE, GQA, MoE), and preference post-training.

## One generation loop, many tasks

Dedicated models wire a separate head per task (3-way linear classifier or `[start, end]` span pointers). A decoder maps classification, verbatim extraction, and grounded synthesis onto one next-<span data-glossary="token">token</span> interface driven by a formatted prompt. Few-shot demonstrations steer the final hidden state with zero weight updates; because unconstrained replies can emit wrappers like `"The category is Attention"`, pair prompts with constrained decoding or strict parsing and score held-out accuracy.

<figure>
  <img src="illustrations/_generated/decoder_task_interface_dark.png" alt="One next-token loop expressing classification, rope_theta extraction, and grounded GQA explanation with independent verification." />
  <figcaption>One prompt-to-next-token loop expresses classification, exact lookup, and grounded synthesis; each needs its own verification step.</figcaption>
</figure>

## Why encoders read both ways and decoders write left to right

The 2017 Transformer paired a bidirectional encoder with a causal decoder via cross-attention.[^vaswani2017] In 2018, BERT and GPT split those halves:

- **Encoder-only (BERT):** Bidirectional self-attention pretrained with masked language modeling (15% corrupted tokens: 80% `[MASK]`, 10% random, 10% unchanged).[^devlin2019] Contrastive encoders like Sentence-BERT stay dominant for cheap embeddings, reranking, and fixed-label tagging.[^reimers2019]
- **Decoder-only (GPT):** Causal self-attention plus MLPs without cross-attention.[^radford2018] Generalist assistants converged here because one left-to-right loop scales cleanly across multi-turn prefixes, while T5 retains encoder-decoder structure.[^raffel2020]

### A decoder writes left to right

A lower-triangular <span data-glossary="causal-mask">causal mask</span> sets future scores ($j > i$) to $-\infty$ before softmax, zeroing future weights while scoring all $T$ positions in parallel during training. Every row normalizes solely over its visible prefix $j \le i$.

## The life of a token: prefill, KV cache, and decode

Follow `"Why is RoPE relative ?"` through a pre-norm decoder. Each token looks up an embedding, passes through stacked attention and MLP blocks, and projects through $W_{\text{vocab}}$ into <span data-glossary="logits">logits</span> and <span data-glossary="softmax">softmax</span> probabilities.[^radford2019code] Serving splits execution into two phases:

1. **Prefill:** Run all $T$ prompt tokens in parallel, filling each layer's **<span data-glossary="kv-cache">KV cache</span>** and emitting token $T + 1$. Heavy weight reuse across rows makes long prefills compute-bound.
2. **Cached decode:** Feed only the newly chosen token, append its $(K, V)$ pair, and attend $Q_{T+1}$ over $K_1 \dots K_{T+1}$. Streaming full layer weights and past caches for one token makes small-batch decode HBM bandwidth-bound.[^pope2023]

<figure>
  <img src="illustrations/_generated/token_lifecycle_decoder_dark.png" alt="Prefill caches 5 prompt positions and selects Because (logit 0.38); next decode feeds Because at position 6 and extends cache to 6." />
  <figcaption>Right after sampling `Because`, text holds six tokens while the KV cache holds five; feeding `Because` back caches position 6 and predicts token 7.</figcaption>
</figure>

Run the output projection behind the figure and track per-layer KV shape growth:

<!-- leetllm: test, deps=numpy, output=show, output_title="Decoder shape trace output" -->
```python title="decoder-output-and-cache-shapes.py"
import numpy as np

last_hidden = np.array([0.6, -0.2, 0.4, 0.1])
output_rows = np.array([
    [0.8, 0.1, -0.2, 0.0],
    [0.2, 0.5, 0.1, -0.1],
    [-0.1, 0.2, 0.4, 0.3],
    [0.0, -0.3, 0.2, 0.4],
])
labels = ["Because", "The", "It", "Since"]

logits = output_rows @ last_hidden
probs = np.exp(logits - logits.max())
probs /= probs.sum()

print("logits:", np.round(logits, 2), "| selected:", labels[int(np.argmax(probs))])
print("prefill KV:", (2, 1, 2, 5, 2), "-> decode KV:", (2, 1, 2, 6, 2))
```

<!-- leetllm: output:start -->
```text title="Decoder shape trace output" output compact
logits: [0.38 0.05 0.09 0.18] | selected: Because
prefill KV: (2, 1, 2, 5, 2) -> decode KV: (2, 1, 2, 6, 2)
```
<!-- leetllm: output:end -->

## How GPT grew from text completion into assistants

Three parallel shifts turned raw text predictors into fast assistants: alignment, compute-balanced scaling, and sparse MoE routing.

<figure>
  <img src="illustrations/_generated/llm_evolution_dark.png" alt="Three LLM axes (2018-2024): GPT-1 to InstructGPT alignment, Gopher vs Chinchilla balanced scaling, and Mixtral 2-of-8 sparse routing." />
  <figcaption>Three axes shaped modern LLMs: alignment (GPT-1 to InstructGPT), balanced scaling (Chinchilla), and sparse MoE routing (Mixtral 8x7B).</figcaption>
</figure>

### 1. GPT-1: Generative pretraining + task fine-tuning (2018)

GPT-1 (117M parameters) pretrained on BooksCorpus, then attached a linear head and fine-tuned weights per task with an auxiliary language-modeling loss.[^radford2018]

### 2. GPT-2: Zero-shot transfer without task-specific weights (2019)

GPT-2 (1.5B parameters) trained on ~40 GB of WebText and handled tasks zero-shot via prompt cues (`TL;DR:`) with no per-task weight updates.[^radford2019]

### 3. GPT-3: In-context few-shot emergence (2020)

GPT-3 (175B parameters, 300B tokens) unlocked **in-context few-shot learning**, lifting accuracy sharply from prompt demonstrations without gradient steps.[^brown2020]

### 4. InstructGPT: Preference training (2022)

Base models extend documents rather than following instructions. **InstructGPT** introduced three-stage **RLHF** (SFT on demonstrations, reward modeling on pairwise rankings, PPO with a KL anchor), letting an aligned 1.3B model beat raw 175B GPT-3 in human ratings.[^ouyang2022] Later methods like DPO optimize preference margins directly. Match base checkpoints to fine-tuning and instruct/chat checkpoints (with their exact chat templates) to interactive turns.[^huggingface2026chattemplates]

## What scaling laws say about a fixed training budget

Dense training takes roughly $C \approx 6ND$ FLOPs ($2ND$ forward, $4ND$ backward) for $N$ parameters and $D$ tokens.[^hoffmann2022] Kaplan et al. (2020) favored growing $N$ faster than $D$,[^kaplan2020] leaving GPT-3 (175B) and Gopher (280B) on only 300B tokens (~1.1-1.7 tokens/param).

Matching cosine decay horizons across 400+ runs, Hoffmann et al. (2022) found **Chinchilla** compute-optimal scaling grows $N$ and $D$ equally ($N, D \propto C^{0.5}$, ~20 tokens/param): 70B Chinchilla on 1.4T tokens beat 280B Gopher at identical compute.[^hoffmann2022] Doubling both $N$ and $D$ multiplies compute $4\times$; tripling both multiplies compute $9\times$.

### Training compute versus lifetime serving costs

Chinchilla optimizes a fixed training budget, not lifetime serving cost. High-traffic checkpoints overtrain smaller models like Llama 3 8B past 15T tokens (>1,875 tokens/param) to cut inference VRAM and latency.[^touvron2023][^dubey2024]

| Run | $N$ | $D$ | Tokens / param | Regime |
|---|---:|---:|---:|---|
| Gopher | 280B | 300B | ~1.1 | Undertrained vs. Chinchilla |
| Chinchilla | 70B | 1.4T | 20.0 | Compute-optimal training |
| Llama 3 | 8B | >15T | >1,875 | Overtrained for serving |

## Three newer building blocks: RMSNorm, SwiGLU, and RoPE

Modern decoders refined three inner blocks popularized by LLaMA (with variants like Gemma's GeGLU).[^touvron2023][^gemmaTeam2024Architecture]

### 1. Root Mean Square Normalization (RMSNorm)

Unlike LayerNorm's mean centering and bias $\beta$,[^pytorch_layernorm] **RMSNorm** scales directly by $\operatorname{RMS}(x) = \sqrt{\frac{1}{d}\sum_i x_i^2 + \epsilon}$ to output $\frac{x}{\operatorname{RMS}(x)} \odot \gamma$.[^zhang2019][^pytorch_rmsnorm]

### 2. SwiGLU activations

**SwiGLU** uses three matrices: $(\operatorname{SiLU}(x W_{\text{gate}}) \odot (x W_{\text{up}})) W_{\text{down}}$ with $\operatorname{SiLU}(z) = z\,\sigma(z)$.[^shazeer2020] Matching a bias-free two-matrix $4d$ FFN ($8d^2$ weights) shrinks SwiGLU hidden width to $\frac{8}{3}d$.

### 3. Rotary Position Embeddings (RoPE)

**RoPE** rotates 2D coordinate pairs of $Q$ and $K$ by position angles $m\theta_i$: $\mathbf{q}_m = R_{\Theta, m}^d \mathbf{q}$, $\mathbf{k}_n = R_{\Theta, n}^d \mathbf{k}$.[^su2021] Because $R_{\Theta, m}^T R_{\Theta, n} = R_{\Theta, n - m}$, dot products depend strictly on relative offset $n - m$ for fixed unrotated vectors.

Verify RMSNorm, SwiGLU, and RoPE shift invariance in NumPy:

<!-- leetllm: test, deps=numpy, output=show, output_title="Frontier blocks output" -->
```python title="frontier-blocks-check.py"
import numpy as np

x = np.array([2.0, 4.0])
rms_out = x / np.sqrt(np.mean(x ** 2) + 1e-12)
gate_out = float((1.0 / (1.0 + np.exp(-1.0))) * 2.0)

def rot_2d(pos: int, theta: float = 0.4) -> np.ndarray:
    c, s = np.cos(pos * theta), np.sin(pos * theta)
    return np.array([[c, -s], [s, c]])

q, k = np.array([1.0, 0.2]), np.array([0.3, 0.9])
same_a = float((rot_2d(4) @ q) @ (rot_2d(2) @ k))
same_b = float((rot_2d(14) @ q) @ (rot_2d(12) @ k))
diff_c = float((rot_2d(14) @ q) @ (rot_2d(2) @ k))

print("RMSNorm([2, 4]):  ", np.round(rms_out, 3).tolist())
print("SiLU(1.0) * 2.0:  ", round(gate_out, 4))
print("RoPE (4,2)=(14,12):", round(same_a, 6), round(same_b, 6), "| (14,2):", round(diff_c, 6))
```

<!-- leetllm: output:start -->
```text title="Frontier blocks output" output compact
RMSNorm([2, 4]):   [0.632, 1.265]
SiLU(1.0) * 2.0:   1.4621
RoPE (4,2)=(14,12): 0.936998 0.936998 | (14,2): -0.794779
```
<!-- leetllm: output:end -->

## How attention design changes KV cache costs

For $B$ requests of length $L$ at $P$ bytes/value (2 for FP16/BF16), raw KV cache payload is:

$$
\text{Memory}_{\text{KV}} = 2 \times B \times L \times n_{\text{layers}} \times n_{\text{kv\_heads}} \times d_{\text{head}} \times P
$$

Sharing K/V heads across queries cuts storage linearly while distinct $W_Q$ heads preserve unique outputs: **MHA** ($n_{\text{kv}} = n_q$), **MQA** ($n_{\text{kv}} = 1$),[^shazeer2019] and **GQA** ($g$ shared KV heads, shrinking cache by $n_q / g$ near MHA quality).[^ainslie2023] At $B=8, L=8192$, 32 layers, $d_{\text{head}}=128$, BF16: 32-head MHA uses **32 GiB**, 8-head GQA drops to **8 GiB**, and MQA drops to **1 GiB**. Runtimes combine GQA with **FlashAttention**[^dao2022] and **PagedAttention**[^kwon2023] (see [KV Cache & PagedAttention](/learn/kv-cache-paged-attention-llm-serving)).

## Sparse architectures: Mixture of Experts (MoE)

A **sparsely gated MoE** layer replaces one dense MLP with $E$ experts and a router running only the top-$k$ per token: $\sum_{i \in \text{Top-}k} \operatorname{Softmax}(\operatorname{Top-}k(x W_g))_i \operatorname{Expert}_i(x)$.[^shazeer2017][^jiang2024] Auxiliary balance losses or dynamic routing biases (DeepSeek-V3) prevent router collapse.[^deepseekv3_2024]

### The fundamental MoE tradeoff: VRAM vs FLOPs

Mixtral 8x7B holds **47B total parameters** while running **13B active parameters** per token.[^jiang2024] Active parameters govern per-token FLOPs; **total parameters** govern resident GPU VRAM (94 GB / 87.54 GiB at 2 bytes/param before KV cache).[^huggingface2026acceleratebigmodel]

<!-- leetllm: test, deps=numpy, output=show, output_title="MoE routing output" -->
```python title="top-two-expert-router.py"
import numpy as np

experts = ["E0", "E1", "E2", "E3"]
router_logits = np.array([[2.4, 0.3, 0.5, -0.2], [0.1, 2.2, 0.7, 0.0]])
expert_out = np.array([[1.0, 0.0, 0.5], [0.2, 1.0, -0.1], [0.0, 0.4, 1.2], [-0.5, 0.2, 0.3]])

for tok, logits in zip(["import", "assertion"], router_logits):
    idx = np.argsort(-logits)[:2]
    w = np.exp(logits[idx] - logits[idx].max())
    w /= w.sum()
    print(f"{tok:9s} -> {[(experts[int(i)], round(float(p), 3)) for i, p in zip(idx, w)]} | out={np.round(w @ expert_out[idx], 3)}")
```

<!-- leetllm: output:start -->
```text title="MoE routing output" output compact
import    -> [('E0', 0.87), ('E2', 0.13)] | out=[0.87  0.052 0.591]
assertion -> [('E1', 0.818), ('E2', 0.182)] | out=[0.164 0.891 0.137]
```
<!-- leetllm: output:end -->

> **Common mistake:** Sizing GPU VRAM from a MoE model's *active* parameters. All inactive experts stay resident in VRAM unless offloaded at high latency cost.

## Reasoning models and the cost of extra inference compute

**Test-time compute** spends extra generated tokens on internal verification or backtracking before answering (OpenAI o1, DeepSeek-R1).[^openai_learning_reasoning_2024][^deepseekr1_2025] Effort knobs (`reasoning.effort`) dial that budget per request.[^openai2026reasoning] Because reasoning tokens consume context space and bill as output tokens even when hidden, leave `max_output_tokens` headroom and verify gains against latency and spend caps.

## Open weights, licensing, and local serving

**"Open weights"** means downloadable tensors under stated terms, not unrestricted open source (Meta's original LLaMA barred commercial use).[^touvron2023][^meta2023OriginalLlamaRelease] Check license clauses against OSI Open Source AI criteria,[^osi2024] verify serving-engine kernel support, and pin checkpoint hashes rather than floating API aliases.

## Evaluating a released model on your workload

Leaderboards shortlist candidates, while deployment hinges on your prompts, memory limit, p95 latency ceiling, license, and unit cost. Enforce hard filters (license, VRAM fit, p95 deadline) *independently* first, then compare verified task accuracy among eligible runs.

## Longer context and the evidence that gets missed

Accepting 128k or 1M tokens reflects input capacity, not uniform recall. Liu et al. (2023) shifted the answer-bearing document across positions 1 to 20 and measured a **U-shaped curve**: high recall at start and end, sharp drop in the middle.[^liu2023lost] Hold the identical passage fixed while sweeping start, middle, and end slots to isolate position effects from question difficulty.

<figure>
  <img src="illustrations/_generated/lost_in_the_middle_dark.png" alt="20-document slot sweep: 15/20 at slot 1, 10/20 at 5, 7/20 at 10, 10/20 at 15, 14/20 at 20." />
  <figcaption>Shifting one evidence passage across 20 retrieved slots illustrates the U-shaped middle drop from Liu et al.</figcaption>
</figure>

### Practical prompt engineering mitigations

Separate directives in the system role from delimited retrieved text, place decisive evidence at the start or right before the question, and prune redundant chunks to save prefill FLOPs and keep key facts near high-attention edges.

## Match the architecture to the job

| Workload | Best-fit architecture | Primary check |
|---|---|---|
| Embeddings, search, fast tagging | Contrastive bidirectional encoder | Recall, vector width, throughput |
| Low-latency code completion | Compact dense decoder (1B-8B) | TTFT, acceptance rate, VRAM fit |
| Multi-turn grounded assistant | Chat decoder or sparse MoE | Verified grounding, VRAM vs. speed |
| Multi-step math & verification | Reasoning model + checks | Pass rate within latency and budget |

## Common misconceptions

- **"GPT means any LLM":** GPT is one causal decoder family; name the architecture, objective, and checkpoint type.
- **"Encoders are obsolete":** Small encoders beat huge decoders on cost and speed for search, reranking, and fixed-label tagging.
- **"More parameters always win":** Training tokens, alignment, and inference latency matter equally.
- **"Open weights mean open source":** Downloadable weights can still carry commercial limits.
- **"Long context guarantees recall":** Run controlled slot sweeps instead of assuming flat accuracy.

## Practice: diagnose the failing assistant

Diagnose three offline evaluation failures before checking the answer:

1. **Continuation failure:** `"Explain why causal_mask sets future scores to -inf"` produces two more quiz questions instead of an explanation.
2. **Long-context miss:** A 20-line excerpt works standalone yet fails when buried inside a 50,000-token dump.
3. **GPU OOM crash:** Loading a 47B MoE model (13B active) onto one 24 GB GPU fails during weight allocation.

```checkpoint
What is the root cause and fix for each failure?
---
1. Base checkpoint or missing chat template; load an instruct/chat checkpoint with its exact role tokens.
2. Check truncation, then move the excerpt to the start or right before the question; prune filler if accuracy rebounds.
3. Active parameters cut FLOPs, not VRAM: 47B FP16 weights need ~94 GB. Shard across GPUs, quantize with checks, or pick a checkpoint fitting 24 GB.
```

```mastery-quiz
[
  {
    "question": "A model replies 'The category is Attention' when the parser expects only Attention, Training, or Serving. What should the app do?",
    "options": [
      "Constrain or parse to the allowed schema, then score held-out accuracy.",
      "Trim spaces and accept the full sentence as a valid label.",
      "Add the extra words to the schema as new categories.",
      "Match any label substring without checking negation."
    ],
    "answer": "Constrain or parse to the allowed schema, then score held-out accuracy.",
    "explanation": "Unconstrained decoding does not enforce schemas; strict parsing or constrained decoding plus held-out scoring avoids false matches like 'not Attention'."
  },
  {
    "question": "Prefill multiplies layer weights across 2,048 rows at once, while batch-one cached decode runs one token row. Which hardware bottleneck fits?",
    "options": [
      "Prefill has poor weight reuse; single-token decode reuses weights heavily.",
      "Prefill achieves high weight reuse; small-batch decode stalls on HBM bandwidth.",
      "Cached decode skips MLP projections because KV caches store them.",
      "Batched decode still projects one row regardless of concurrency."
    ],
    "answer": "Prefill achieves high weight reuse; small-batch decode stalls on HBM bandwidth.",
    "explanation": "Processing 2,048 rows amortizes weight loads across matrix math; batch-one decode streams full weights and KV cache for one token."
  },
  {
    "question": "A dense 5B-parameter model trains on 48B tokens. A next run uses 9x compute, scaling parameters and tokens equally under Chinchilla. How many billion tokens does it use?",
    "options": [
      "48",
      "144",
      "432",
      "16"
    ],
    "answer": "144",
    "explanation": "Compute scales as 6ND, so scaling both N and D by 3 gives 9x compute: 3 * 48B = 144B tokens."
  },
  {
    "question": "Standard RMSNorm applies to [2, 4] with unit gain and negligible epsilon. What output values result (3 decimals)?",
    "options": [
      "[0.632, 1.265]",
      "[-1.000, 1.000]",
      "[0.447, 0.894]",
      "[0.849, 1.131]"
    ],
    "answer": "[0.632, 1.265]",
    "explanation": "Mean square is (4 + 16)/2 = 10, so [2, 4] / sqrt(10) = [0.632, 1.265]. LayerNorm centers first to [-1, 1]."
  },
  {
    "question": "A bias-free two-matrix FFN has width 18 and hidden size 72. What hidden size in a bias-free three-matrix SwiGLU matches total parameters?",
    "options": [
      "72",
      "24",
      "48",
      "108"
    ],
    "answer": "48",
    "explanation": "Total weights are 2 * 18 * 72 = 2,592; dividing by 3 * 18 gives SwiGLU hidden width 48."
  },
  {
    "question": "With unrotated Q and K held fixed, how does their RoPE dot product change when both positions shift by +7?",
    "options": [
      "It shifts with the sum of positions.",
      "It stays unchanged because relative offset n - m is unchanged.",
      "It flips sign because both angles advance.",
      "It depends only on distance, ignoring Q and K."
    ],
    "answer": "It stays unchanged because relative offset n - m is unchanged.",
    "explanation": "Orthogonal rotations satisfy R_m^T R_n = R_{n-m}, so shifting both indices by +7 cancels out."
  },
  {
    "question": "Both models have 24 query heads, equal head_dim, and BF16. Model A uses MHA (24 KV heads); Model B uses GQA (3 KV heads). What fraction of A's raw KV cache does B store?",
    "options": [
      "1/24",
      "1",
      "1/8",
      "7/8"
    ],
    "answer": "1/8",
    "explanation": "Caching 3 KV heads instead of 24 stores 3/24 = 1/8 of the raw KV payload (7/8 is the fraction saved)."
  },
  {
    "question": "A 60B sparse MoE sits fully resident on GPUs at 2 bytes/param, activating 16B params/token. Which memory and active-weight figures match?",
    "options": [
      "32 GB resident, 32 GB active.",
      "120 GB resident, 32 GB active.",
      "120 GB resident, 120 GB active.",
      "32 GB resident, 120 GB active."
    ],
    "answer": "120 GB resident, 32 GB active.",
    "explanation": "All 60B weights stay resident (120 GB at 2 bytes/param), while sparse routing executes 16B active weights (32 GB) per token."
  },
  {
    "question": "A model accepts 100k tokens yet misses facts in long prompts. Which test best isolates position-dependent retrieval?",
    "options": [
      "Move the identical passage across start, middle, and end slots and score grounded answers.",
      "Put different passages in each slot and blame score gaps on position.",
      "Keep the passage at slot 1 and read early attention weights as accuracy.",
      "Place the passage beside the question once and assume flat recall."
    ],
    "answer": "Move the identical passage across start, middle, and end slots and score grounded answers.",
    "explanation": "Fixing wording and question difficulty while varying only slot index isolates positional forgetting."
  },
  {
    "question": "At low reasoning effort, an API gets 30/50 verified answers. Requiring >30/50 verified, p95 <= 3.0 s, and cost <= 6 dollars, which split should switch to high effort?",
    "options": [
      "Syntax (44 confident, 29 verified, 2.4 s, 5 dollars)",
      "Extraction (40 confident, 38 verified, 3.5 s, 5 dollars)",
      "Reasoning (39 confident, 35 verified, 2.8 s, 5 dollars)",
      "Summarization (41 confident, 37 verified, 2.6 s, 7 dollars)"
    ],
    "answer": "Reasoning (39 confident, 35 verified, 2.8 s, 5 dollars)",
    "explanation": "Reasoning lifts verified answers to 35/50 while meeting both latency (2.8 s <= 3.0 s) and budget (5 <= 6 dollars)."
  }
]
```

> **Next:** Continue to [Instruction Tuning & Chat Templates](/learn/instruction-tuning-chat-templates).
