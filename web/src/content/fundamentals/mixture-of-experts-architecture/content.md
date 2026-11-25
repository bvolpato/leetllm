---
{
  "id": "mixture-of-experts-architecture",
  "title": "Mixture of Experts Architecture",
  "slug": "mixture-of-experts-architecture",
  "section": "Transformer & Multimodal Architectures",
  "category": "Transformer Architecture",
  "difficulty": "Hard",
  "order": 4,
  "coverImage": "social_banner.png",
  "companies": [
    "Google",
    "Mistral",
    "DeepSeek",
    "Alibaba",
    "Z.AI"
  ],
  "shortDescription": "Eight experts can mean two feed-forward calls per token and a full expert pool still sitting in memory.",
  "keyConceptsTested": [
    "Sparse vs dense model tradeoffs",
    "Router/gating mechanism design",
    "Load balancing and expert collapse",
    "Top-k routing strategies",
    "Expert choice vs token choice routing",
    "Capacity factor and dropped tokens",
    "Expert parallelism and communication overhead",
    "Batched expert execution",
    "Dense-vs-MoE deployment decisions",
    "Architecture-specific expert and parameter counts"
  ],
  "prerequisites": [
    "transformer-architecture-end-to-end",
    "scaled-dot-product-attention"
  ],
  "relatedQuestions": [
    "state-space-models-mamba-alternatives",
    "reasoning-models-test-time-compute",
    "llm-deployment-gpu-serving-autoscaling",
    "distributed-training-fsdp-deepspeed-zero",
    "scaling-laws-compute-optimal-training",
    "model-quantization-gptq-awq-gguf"
  ]
}
---

An eight-expert layer routes every token to just two feed-forward networks. On paper that looks like a 4x smaller model, until you try to load the checkpoint onto a GPU and discover all eight experts still need memory. How can per-token arithmetic stay sparse while weight residency stays huge?

In a standard [Transformer](/learn/transformer-architecture-end-to-end), a single <span data-glossary="feed-forward-network">feed-forward network (FFN)</span> transforms every <span data-glossary="token">token</span> after attention. <span data-glossary="mixture-of-experts">Mixture of Experts (MoE)</span> replaces that single FFN with $N$ parallel expert FFNs and a lightweight **router** (gating network) that chooses a <span data-glossary="top-k">top-$k$</span> subset for each token at every layer.[^shazeer2017] Attention, <span data-glossary="embedding">embeddings</span>, and norms usually remain shared.[^jiang2024][^deepseekv2_2024]

That design decouples **total parameter capacity** (all $N$ experts stored in memory) from **active compute per token** (only the $k$ selected experts). The trade-off shifts from raw FLOPs to weight memory, load balance, token overflow, and cross-GPU dispatch.

## From one FFN to many experts

Given a token hidden state $x$, a linear router $W_g$ produces $N$ logits, converts them to probabilities $g(x) = \text{softmax}(W_g x)$, picks the top $k$ experts, and blends their outputs:

$$
\text{MoE}(x) = \sum_{i \in \text{TopK}(g(x))} \tilde{g}_i(x) \cdot E_i(x)
$$

Follow one 4-dimensional token through a 4-expert top-2 Mixtral-style router with logits `[-0.65, -1.77, -1.35, -3.00]`:

1. **Softmax probabilities:** `[0.522, 0.170, 0.259, 0.050]`.
2. **Top-2 selection:** Expert 1 (`0.522`) and Expert 3 (`0.259`).
3. **Renormalize:** $0.522 / (0.522 + 0.259) \approx 0.668$ and $0.259 / 0.781 \approx 0.332$.
4. **Compute & blend:** Run only $E_1(x)$ and $E_3(x)$ and compute $0.668 \cdot E_1(x) + 0.332 \cdot E_3(x)$.

<figure>
  <img src="illustrations/_generated/moe_architecture_dark.png" alt="Token x = [1, 0, 0, 0] enters a four-expert top-2 router with probabilities 0.522, 0.170, 0.259, and 0.050. E1 and E3 are selected with renormalized weights 0.668 and 0.332; E2 and E4 remain inactive. E1 outputs [2, 0, 0, 0] and E3 outputs [0, 3, 0, 0], summing to [1.336, 0.995, 0, 0]." />
  <figcaption>Exact router probabilities (0.522 and 0.259 for E1 and E3) renormalize to 0.668 and 0.332, blending E1 and E3 into [1.336, 0.995, 0, 0] while E2 and E4 stay idle in memory.</figcaption>
</figure>

> **Common mistake:** Do not renormalize weights under **top-1** routing! If only one expert is selected, normalizing its weight forces $\tilde{g}_1(x) \equiv 1$, killing the task-loss gradient into the router away from selection boundaries. Switch Transformer (top-1) multiplies the expert output by the raw, unnormalized softmax probability so gradients still flow to $W_g$.[^fedus2022]

Let's run the exact top-2 router in PyTorch:

<!-- leetllm: test, deps=torch, output=show -->
```python title="topk-router.py"
import torch

gate = torch.tensor([[-0.65, 0., 0., 0.], [-1.77, 0., 0., 0.],
                     [-1.35, 0., 0., 0.], [-3.00, 0., 0., 0.]])
x = torch.tensor([1.0, 0.0, 0.0, 0.0])

probs = torch.softmax(gate @ x, dim=0)
top_probs, selected = torch.topk(probs, k=2)
weights = top_probs / top_probs.sum()

# Four simple diagonal-like expert projections mapping R^4 -> R^4
experts = torch.zeros(4, 4, 4)
experts[0, 0, 0], experts[1, 2, 0], experts[2, 1, 0], experts[3, 3, 0] = 2.0, 4.0, 3.0, 5.0

blended = weights @ (experts[selected] @ x)
print("selected experts:", (selected + 1).tolist())
print("renormalized weights:", [round(w, 3) for w in weights.tolist()])
print("blended output:", [round(v, 3) for v in blended.tolist()])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
selected experts: [1, 3]
renormalized weights: [0.668, 0.332]
blended output: [1.336, 0.995, 0.0, 0.0]
```
<!-- leetllm: output:end -->

### Why sparse activation separates compute from memory

Because only FFN blocks are replicated while attention and embeddings stay shared, Mixtral 8x7B totals **46.7B parameters** (not $8 \times 7 = 56$B) and activates **12.9B parameters per token** under top-2 routing.[^jiang2024]

| Property | Dense peer (~13B) | Mixtral 8x7B (top-2 of 8) |
|---|---|---|
| **Total parameters (memory)** | ~13B | ~46.7B |
| **Active parameters (FLOPs)** | ~13B | ~12.9B |
| **Extra runtime work** | None | Routing, token grouping, all-to-all dispatch |

Active parameters govern per-token FLOPs; **total parameters** govern <span data-glossary="vram">VRAM</span> weight residency. A model with 3B shared weights and eight 2B expert partitions activates only 7B weights (`14 GB` BF16) per token, yet still requires `38 GB` BF16 to hold all 19B weights in memory.

<figure>
  <img src="illustrations/_generated/stored_pool_active_path_dark.png" alt="BF16 weight pool comparison: 3B shared weights plus eight 2B expert partitions occupy 19B parameters (38 GB). One token computes with 3B shared weights plus two 2B selected partitions, or 7B parameters (14 GB). All 38 GB stay in memory, leaving a 24 GB shortfall on a 14 GB budget." />
  <figcaption>One token computes with 7B active parameters (14 GB BF16), while all 19B parameters (38 GB) must remain resident in memory.</figcaption>
</figure>

```checkpoint
If an MoE has 46.7B total parameters and 12.9B active parameters per token, which number drives FLOPs and which number drives memory residency?
---
Active parameters mostly drive per-token expert FLOPs. Total parameters drive checkpoint size and the weight memory the serving system must keep available.
```

### Expert choice vs. token choice routing

Standard **token-choice** routing lets each token pick its top $k$ experts, which guarantees every token gets $k$ experts but can overload popular experts. **Expert-choice routing** flips the direction: each *expert* selects its top-scoring fixed bucket of *tokens* from the batch.[^zhou2022]

That guarantees perfectly balanced expert buckets, but introduces two subtle catches:
1. **Uncovered tokens:** Some tokens can land in zero expert buckets (only passing through the residual stream) while others land in multiple buckets.
2. **Causality leak in decoders:** Because an expert chooses its top tokens across the batch, a future token with a higher score (`0.9`) can knock an earlier token (`0.6`) out of the bucket even when attention is causally masked! Autoregressive decoders therefore need prefix-consistent routing.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="expert-choice-tradeoffs.py"
import numpy as np

# 3 experts (rows) each pick top-2 tokens from 5 tokens t0..t4 (columns)
scores = np.array([
    [0.90, 0.80, 0.10, 0.05, 0.01],
    [0.85, 0.20, 0.75, 0.10, 0.02],
    [0.15, 0.25, 0.80, 0.70, 0.03],
])
buckets = np.argsort(-scores, axis=1, kind="stable")[:, :2]
counts = np.bincount(buckets.ravel(), minlength=5)
print("assignments per token:", counts.tolist(), "-> uncovered:", [f"t{i}" for i in np.flatnonzero(counts == 0)])

# Future token (0.9) displaces earlier token (0.6) in a 1-slot bucket
print("prefix winner:", ["earlier"][int(np.argmax([0.6]))])
print("with future token:", ["earlier", "future"][int(np.argmax([0.6, 0.9]))])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
assignments per token: [2, 1, 2, 1, 0] -> uncovered: ['t4']
prefix winner: earlier
with future token: future
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/expert_choice_coverage_and_causality_dark.png" alt="Expert-choice buckets E1: [t0, t1], E2: [t0, t2], and E3: [t2, t3] each hold two assignments. The five tokens receive 2, 1, 2, 1, and 0 assignments, leaving t4 uncovered. In a separate one-slot bucket, the earlier score 0.6 wins alone, but a future score 0.9 displaces it without changing that earlier score. Attention masking does not remove this routing dependence on the future." />
  <figcaption>Expert choice balances every expert bucket at 2 tokens, leaving t4 uncovered. In a one-slot decoder bucket, a later token (0.9) displaces an earlier token (0.6) despite causal attention masking.</figcaption>
</figure>

## Why routers collapse without load balancing

Left to pure task loss, routers suffer from **rich-get-richer collapse**. If Expert 0 happens to win slightly more tokens early in training, it receives more gradient updates, improves faster, attracts still more tokens, and starves Experts 1 through 3. You end up paying VRAM for four experts while only training one.

<figure>
  <img src="illustrations/_generated/expert_routing_dark.png" alt="Twenty expert assignments split as 12 (60%), 4 (20%), 3 (15%), and 1 (5%) against a 25% uniform target (5 tokens each). E0 exceeds the 50% batch investigation threshold, though one skewed batch calls for tracking rather than concluding training collapse." />
  <figcaption>A skewed routing batch (60% / 20% / 15% / 5% vs. a 25% uniform target). Sustained skew across training steps signals expert starvation.</figcaption>
</figure>

### The auxiliary load-balancing loss

Switch Transformer counters collapse with a differentiable penalty combining each expert's actual assignment fraction $f_i$ and its mean router probability $p_i$ across the batch:[^fedus2022]

$$
\mathcal{L}_{\text{balance}} = \alpha \cdot N \sum_{i=1}^N f_i \cdot p_i
$$

Hard counts $f_i$ are non-differentiable, so gradients flow through $p_i$, pushing down probabilities on heavily loaded experts (high $f_i$). Under uniform routing ($f_i = p_i = 1/N$), the sum equals $1/N$, so the unscaled factor $N \sum f_i p_i$ equals `1.0`. On a skewed batch `[0.60, 0.20, 0.15, 0.05]` with mean probabilities `[0.55, 0.22, 0.15, 0.08]`, the term jumps to $4 \times 0.4005 = 1.602$.

> **Key insight:** A score below `1.0` is **not** proof that every expert is active! In a 3-expert batch where Expert 2 wins zero tokens (`fractions = [0.5, 0.5, 0.0]`) while holding moderate probability `0.40`, $3 \sum f_i p_i = 0.90 < 1.0$ even though Expert 2 is completely dead. Always monitor per-expert assignment histograms alongside the scalar loss.

<!-- leetllm: test, deps=torch, output=show -->
```python title="load-balancing-and-counterexample.py"
import torch

# 1. Skewed 4-expert batch: 4 * sum(f * p) = 1.602 vs uniform 1.0
f = torch.tensor([0.60, 0.20, 0.15, 0.05])
p = torch.tensor([0.55, 0.22, 0.15, 0.08])
print("skewed 4-expert score:", round((4 * torch.dot(f, p)).item(), 3))

# 2. Counterexample: Expert 2 gets 0 tokens yet score = 0.90 < 1.0!
probs = torch.tensor([[0.51, 0.09, 0.40], [0.09, 0.51, 0.40]])
winners = probs.argmax(dim=1)
fracs = torch.bincount(winners, minlength=3).float() / probs.shape[0]
score = 3 * torch.dot(fracs, probs.mean(dim=0))
print("dead-expert fractions:", fracs.tolist(), "score:", round(score.item(), 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
skewed 4-expert score: 1.602
dead-expert fractions: [0.5, 0.5, 0.0] score: 0.9
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/balancing_objective_and_counterexample_dark.png" alt="Observed fractions 0.60, 0.20, 0.15, and 0.05 multiply mean probabilities 0.55, 0.22, 0.15, and 0.08. The products sum to 0.4005, yielding 4 times 0.4005 = 1.602 before alpha. A separate two-token, three-expert example selects experts 0 and 1. Expert 2 is unused although the score is 0.90, below the uniform reference 1. Hard counts stop gradients while mean probabilities carry the auxiliary gradient." />
  <figcaption>Left: Skewed 4-expert batch scores 1.602. Right: A 3-expert batch scores 0.90 (below 1.0) while leaving Expert 2 unused, showing why histograms must accompany the scalar loss.</figcaption>
</figure>

### Router z-loss for numerical stability

Even when load is balanced, large router logits can destabilize mixed-precision training. **Router z-loss** penalizes the squared log-partition function $(\log \sum_i e^{z_i})^2$ averaged over tokens.[^zoph2022] Notice how shifting all logits by `+3.0` leaves softmax probabilities completely unchanged (`[0.75, 0.25]`) while raising z-loss from `0.0` to `9.0`, keeping logit magnitudes well-behaved without distorting expert choices.

<figure>
  <img src="illustrations/_generated/z_loss_shift_invariance_dark.png" alt="Logits log(0.75) and log(0.25) shift upward by 3. Both cases retain softmax probabilities 0.75 and 0.25 and the same selected expert. The log partition changes from 0 to 3, so its square changes from 0 to 9. Z-loss regularizes the log partition, rather than each logit separately or the expert-load histogram." />
  <figcaption>Shifting logits by +3 preserves probabilities [0.75, 0.25] while pushing z-loss from 0 to 9, keeping router logits from drifting into FP16/BF16 overflow.</figcaption>
</figure>

## Capacity factor and token overflow

Fixed-shape GPU kernels often pre-allocate a static token buffer per expert scaled by a **capacity factor** $c$:

$$
\text{Expert Capacity} = \left\lceil \frac{T k}{N} \times c \right\rceil
$$

For $T = 4{,}096$ tokens, top-$k = 2$, and $N = 32$ experts, the uniform share is `256` slots per expert (`308` slots at $c = 1.2$). If a bursty batch sends `400` assignments to one hot expert at $c = 1.0$, `144` assignments overflow. Runtimes handle overflow in one of three ways:

1. **Drop (residual pass-through):** Skip the overflowing expert computation so the token keeps its residual state (and its other expert under top-2).[^fedus2022]
2. **Reroute:** Send overflowing assignments to another eligible expert with spare slots.
3. **Dropless execution:** Run variable-length grouped GEMMs over all 400 assignments with zero drops (supported in modern kernels like Megatron Core).[^megatron2026moe]

<figure>
  <img src="illustrations/_generated/capacity_overflow_policy_dark.png" alt="4096 tokens with top-2 routing create 8192 assignments, or 256 nominal slots per expert across 32 experts. A hot expert receives 400 assignments: 256 fit and 144 overflow. Dropping skips only those expert contributions while tokens remain. Rerouting needs spare expert capacity and changes functions or weights; dropless execution runs all 400. Capacity factor 1.2 raises the ceiling to 308 and leaves 92 overflow assignments." />
  <figcaption>A hot expert receiving 400 assignments for 256 slots overflows 144 assignments at $c=1.0$ (92 at $c=1.2$). Dropping skips those expert updates, rerouting redirects them, and dropless kernels run all 400.</figcaption>
</figure>

## How modern architectures scale the idea

Modern frontier MoEs evolved rapidly from coarse 8-expert pools to fine-grained pools of 160–256 experts paired with always-on **shared experts** and **auxiliary-loss-free** balancing:

| Model | Total / Active | Experts per MoE layer | Key routing innovation |
|---|---|---|---|
| **Mixtral 8x7B**[^jiang2024] | 46.7B / 12.9B | 8 routed (top-2), SwiGLU[^shazeer2020] | Clean coarse-grained softmax top-2 |
| **DeepSeek-V2**[^deepseekv2_2024] | 236B / 21B | 160 routed (top-6) + 2 shared | Fine-grained experts, shared experts, device-limited routing, MLA |
| **DeepSeek-V3**[^deepseekv3_2024] | 671B / 37B | 256 routed (top-8) + 1 shared | Sigmoid affinity + bias-adjusted **auxiliary-loss-free** balancing |
| **DeepSeek V4 Flash 0731**[^deepseek2026v4paper][^deepseek2026v4flash0731] | 284B / 13B | 256 routed (top-6) + 1 shared | $\sqrt{\text{softplus}(\cdot)}$ affinity, hash routing in first 3 blocks |
| **GLM-5.3**[^zai2026glm52repo][^zai2026glm53][^zai2026glm53config][^zai2026glm53flash] | 744B / ~40B | 256 routed (top-8) + 1 shared | 3 dense + 75 MoE layers, routed scaling factor 2.5 |
| **Qwen3.6-35B-A3B**[^qwen3635b2026] | 35B / 3B | 256 routed (top-8) + 1 shared | Interleaved Gated DeltaNet + gated attention |

<figure>
  <img src="illustrations/_generated/moe_variants_dark.png" alt="Per-MoE-layer pools: Mixtral stores 8 routed experts and selects 2. DeepSeek-V2 stores 160 routed experts, selects 6, and always executes 2 shared experts. The same input feeds the routed pool and both shared experts. Exact cells encode expert counts. Cell areas are schematic because expert widths differ, so these counts do not compare FLOPs. The first DeepSeek-V2 FFN is dense." />
  <figcaption>Per-MoE-layer pools: Mixtral selects 2 of 8 coarse experts; DeepSeek-V2 selects 6 of 160 fine-grained experts alongside 2 always-on shared experts.</figcaption>
</figure>

Notice DeepSeek-V3's clean **auxiliary-loss-free** trick: it computes sigmoid affinities $s_i$, adds a dynamically updated load-balancing bias $b_i$ *only* when picking top-8 expert IDs, and then weights the expert outputs using the **original unbiased** affinities $s_i$ (backed by a tiny sequence-wise balance guard).[^deepseekv3_2024] That keeps load balanced without fighting the language-modeling gradient!

<figure>
  <img src="illustrations/_generated/selection_bias_and_weighting_contract_dark.png" alt="DeepSeek-V3 forks original sigmoid affinities sᵢ into a selection branch (+ bias bᵢ -> top-8 IDs of 256) and a weighting branch (gather original selected sᵢ -> normalize -> routed weighted sum plus 1 shared expert). Contrast table shows Switch top-1 keeps original gate, Mixtral top-2 normalizes selected softmax gates, and DeepSeek-V3 separates biased selection from unbiased normalization." />
  <figcaption>DeepSeek-V3 applies load-balancing bias only during top-$k$ selection while blending outputs with the original unbiased sigmoid affinities.</figcaption>
</figure>

<!-- leetllm: audience:website:start -->Note also that FFN sparsity and sequence mixing are independent choices: Qwen3.6-35B-A3B interleaves Gated DeltaNet layers with gated attention so both the feed-forward and memory paths stay lean.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->Qwen3.6 also interleaves Gated DeltaNet layers with gated attention. Mixture-of-experts routing and sequence mixing are independent architectural choices.<!-- leetllm: audience:book:end -->

## Serving an MoE on real hardware

Sparse FLOPs do not automatically mean lower latency. Experts live across GPUs, hidden states must travel over NVLink or InfiniBand, and small decode batches shrink expert matrix multiplications.

### Expert parallelism, wire traffic, and grouped GEMMs

While <span data-glossary="tensor-parallelism">tensor parallelism (TP)</span> slices every expert's weight matrices across GPUs, <span data-glossary="expert-parallelism">expert parallelism (EP)</span> places *whole experts* on different GPUs and runs an **all-to-all dispatch** followed by an **all-to-all combine**.[^megatron2026moe][^vllmExpertParallel2026] Large deployments combine them (for example, DeepSeek-V3 uses TP4 for attention with EP320 for MoE decode, plus redundant copies of hot experts via load balancers like EPLB).[^deepseekv3_2024][^vllmExpertParallel2026]

If a fraction $r$ of $T k$ assignments target remote GPUs, each transferring an $H$-element vector at $b$ bytes round-trip:

$$
Q_{\text{remote}} = 2 r T k H b
$$

Wire protocol design matters too: if one token selects *two* experts living on the same remote GPU, coalescing dispatch and returning a single remotely weighted sum cuts wire traffic in half (`16 KiB` vs. `32 KiB` for a 4,096-wide BF16 hidden state) without changing a single FLOP.

<figure>
  <img src="illustrations/_generated/expert_parallelism_dark.png" alt="GPU G0 stores experts E0 and E1; G1 stores E2 and E3. Token t0 on G0 visits E0 locally, and t2 on G1 visits E2 locally. Three remote assignments send t1 from G0 to E2, t3 from G1 to E1, and t4 from G0 to E3. Each sends 8 KiB and returns 8 KiB, totaling 48 KiB roundtrip. Expert weights remain resident on their owning GPU." />
  <figcaption>G0 owns E0–E1 and G1 owns E2–E3. Three remote routes move 8 KiB out and 8 KiB back (48 KiB total) while expert weights stay resident.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/wire_protocol_and_expert_layout_dark.png" alt="The same token selects E2 and E3 on remote GPU G1. Separate dispatch and return messages for two assignments make four 8 KiB messages, totaling 32 KiB. Per-destination coalescing sends one 8 KiB input, runs both experts, and returns one 8 KiB weighted sum, totaling 16 KiB. Expert functions and FLOPs stay fixed. Separately, TP splits one expert matrix into four rank shards, while EP assigns whole expert IDs to owning groups. Payload differences alone imply no latency result." />
  <figcaption>Per-destination coalescing halves remote wire payload from 32 KiB to 16 KiB for two experts on the same remote GPU, while TP shards matrices and EP owns whole experts.</figcaption>
</figure>

Inside each GPU, **batched expert execution** sorts assignments by expert ID, runs one dense grouped GEMM per expert, and scatter-adds weighted outputs back to each token's original row so no route overwrites another:

<!-- leetllm: test, deps=torch, output=show -->
```python title="dispatch-and-weighted-combine.py"
import torch

inputs = torch.tensor([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]])
token_ids = torch.tensor([0, 1, 2, 0, 2])
expert_ids = torch.tensor([2, 0, 2, 1, 0])
gate_weights = torch.tensor([0.25, 1.0, 0.6, 0.75, 0.4])
scales = torch.tensor([2.0, -1.0, 0.5])  # Simple per-expert transforms

# Sort by expert for contiguous grouped GEMM, then weighted scatter-add by token ID
order = torch.argsort(expert_ids, stable=True)
p_tok, p_exp, p_w = token_ids[order], expert_ids[order], gate_weights[order]
p_out = inputs[p_tok] * scales[p_exp].unsqueeze(1)

combined = torch.zeros_like(inputs).index_add(0, p_tok, p_out * p_w.unsqueeze(1))
print("packed token order:", p_tok.tolist())
print("restored weighted rows:", [[round(v, 3) for v in row] for row in combined.tolist()])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
packed token order: [1, 2, 0, 0, 2]
restored weighted rows: [[-0.625, -1.25], [6.0, 8.0], [5.5, 6.6]]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/dispatch_weighted_combine_dark.png" alt="Three token vectors produce five assignments: (t0, E2, 0.25), (t1, E0, 1), (t2, E2, 0.6), (t0, E1, 0.75), and (t2, E0, 0.4). Grouping by expert gives stable token order [1, 2, 0, 0, 2]. E0 scales by 2, E1 by -1, and E2 by 0.5. Each route weight is applied exactly once. Scatter-add by token ID gives [-0.625, -1.25], [6, 8], and [5.5, 6.6]. The unweighted token-0 sum [-0.5, -1] differs." />
  <figcaption>Tokens pack into expert-contiguous order [1, 2, 0, 0, 2] for batched execution, apply each gate weight once, and scatter-add back to restore the three token rows.</figcaption>
</figure>

On consumer hardware where the full pool does not fit in VRAM, combining [weight quantization](/learn/model-quantization-gptq-awq-gguf) with **CPU/SSD expert offloading** keeps attention and routers on GPU while streaming selected experts on demand (trading memory for PCIe transfer latency).

## When MoE is worth the complexity

Large <span data-glossary="prefill">prefill</span> and high-concurrency decode batches amortize routing and all-to-all dispatch across many tokens per expert; single-request decode (`batch = 1`) exposes fixed launch and interconnect overhead every step. Evaluate MoE against a matched dense baseline across **quality, <span data-glossary="p95-latency">p95 latency</span>, and throughput** together:

| Decision signal | Dense is usually simpler | MoE shines |
|---|---|---|
| **Traffic shape** | Low batch size, strict interactive p95 latency | High batch concurrency or offline throughput |
| **Memory budget** | Tight fixed VRAM ceiling | Enough memory/sharding for the full expert pool |
| **Interconnect** | Slow cross-node links | High-bandwidth NVLink / InfiniBand |
| **Serving stack** | Standard dense kernels | Grouped GEMMs, EP dispatch, load telemetry |

<figure>
  <img src="illustrations/_generated/serving_tradeoff_gate_dark.png" alt="Dense baseline achieves quality 0.82, p95 latency 48 ms, and throughput 820 tokens/s; MoE candidate reaches quality 0.83, p95 latency 55 ms (+7 ms), and throughput 1100 tokens/s (+34.1%). Against requirements of quality at least 0.82 and throughput at least 1000 tokens/s, MoE passes under a 60 ms p95 cap and fails if latency is tightened to 50 ms." />
  <figcaption>MoE lifts throughput 34.1% (1,100 vs. 820 tok/s) at +7 ms p95 latency: it wins under a 60 ms latency budget but misses if the cap tightens to 50 ms.</figcaption>
</figure>

## Diagnosing common MoE surprises

- **7B-active model OOMs on a 16 GB GPU:** Always size VRAM from **total** parameters (plus KV cache and workspace), never active parameters.
- **Uniform long-run histogram, degraded accuracy:** Check per-step bursty overflow, dropped top-2 branches, and z-loss logit blowup separately.
- **"Math expert" myths:** Mixtral's routing analysis found experts specializing strongly in syntax and formatting (like indentation and Python `self`) rather than neat high-level domains like "math" vs. "history."[^jiang2024]

```mastery-quiz
[
  {
    "question": "A toy top-2 router selects probabilities 0.39 and 0.21. The selected experts return [3, 0] and [0, 5], respectively. After selected-weight normalization, what are the two weights and the blended output?",
    "options": [
      "Weights [0.39, 0.21], output [1.17, 1.05]",
      "Weights [0.65, 0.35], output [1.95, 1.75]",
      "Weights [0.50, 0.50], output [1.50, 2.50]",
      "Weights [1.00, 1.00], output [3.00, 5.00]"
    ],
    "answer": "Weights [0.65, 0.35], output [1.95, 1.75]",
    "explanation": "The selected probabilities sum to 0.60. Dividing each by that sum gives weights of 0.65 and 0.35. The first expert contributes 0.65 × 3 = 1.95 to the first coordinate, and the second contributes 0.35 × 5 = 1.75 to the second. Using 0.39 and 0.21 skips normalization. Equal weights discard the router’s preference. A weight of 1 for each expert adds both outputs at full strength."
  },
  {
    "question": "A top-1 gate keeps probability 0.8 for an expert returning scalar 5. An engineer normalizes the selected gate to 1 while holding the selected expert and its output fixed. What changes?",
    "options": [
      "The output stays 4, and its local derivative through the selected gate stays unchanged.",
      "The output becomes 5, and the expert output has no gradient with respect to its own weights.",
      "The output stays 4, but a gradient can flow through the discrete expert index.",
      "The output becomes 5, and its local task-gradient path through the normalized gate becomes zero away from selection thresholds."
    ],
    "answer": "The output becomes 5, and its local task-gradient path through the normalized gate becomes zero away from selection thresholds.",
    "explanation": "The original output is 0.8×5 = 4. A sole normalized selected weight equals 1, giving output 5. That constant weight has zero local derivative through gate normalization while the selected ID stays fixed. The expert can still receive gradients with respect to its own parameters."
  },
  {
    "question": "Four tokens a, b, c and d enter two expert-choice buckets. Expert 0 selects [a, b] and expert 1 selects [a, c]. Which diagnosis follows from the assignments?",
    "options": [
      "Expert loads are equal, but d has no expert contribution; equal bucket size does not ensure token coverage.",
      "Every token has one expert contribution because four assignments match four input tokens.",
      "The second assignment to a replaces its first assignment, so the experts have unequal executed loads.",
      "Token d is removed from the model sequence because no expert selected it."
    ],
    "answer": "Expert loads are equal, but d has no expert contribution; equal bucket size does not ensure token coverage.",
    "explanation": "Both experts execute two assignments. Token a receives two expert contributions, b and c receive one each, and d receives none. A matching total assignment count does not prove coverage. An uncovered expert path also does not by itself remove the residual token from the sequence."
  },
  {
    "question": "An expert chooses its two highest-scoring tokens. A prefix contains a=0.8 and b=0.6. The extended sequence adds future tokens c=0.9 and d=0.7, with both earlier scores and attention inputs fixed. Which selected sets and diagnosis follow?",
    "options": [
      "Prefix [a,b], extended [c,d]; future arrival replaces both earlier expert contributions regardless of score.",
      "Prefix [a,b], extended [a,b]; causal attention keeps the earlier expert selections fixed as the sequence grows.",
      "Prefix [a,b], extended [c,a]; b loses its expert contribution through routing despite unchanged earlier inputs.",
      "Prefix [a,b], extended [c,b]; expert choice preserves the lower-scoring earlier token to balance prefix coverage."
    ],
    "answer": "Prefix [a,b], extended [c,a]; b loses its expert contribution through routing despite unchanged earlier inputs.",
    "explanation": "The prefix has two available tokens, so both are selected. The extended scores rank c=0.9, a=0.8, d=0.7, b=0.6; the two-slot bucket selects c and a. Token b loses its contribution through a future-dependent routing decision. A causal attention mask does not constrain this separate bucket comparison. An autoregressive decoder needs prefix-consistent routing, verified against incremental execution."
  },
  {
    "question": "A batch has 120 tokens, top-3 routing and 12 experts. Each expert has a fixed buffer with a capacity factor of 1.25 and no extra padding. One expert receives 41 assignments. How many slots does its buffer have, and how many assignments overflow?",
    "options": [
      "13 slots, 28 overflow assignments",
      "30 slots, 11 overflow assignments",
      "38 slots, 3 overflow assignments",
      "41 slots, 0 overflow assignments"
    ],
    "answer": "38 slots, 3 overflow assignments",
    "explanation": "Each token makes three assignments, so the average per expert is 120 × 3 / 12 = 30. The capacity factor raises that to 37.5. Rounding up gives 38 slots, so 41 − 38 = 3 assignments overflow. Counting each token once gives 13 slots. Using the unscaled average gives 30 slots. Choosing 41 sizes the buffer to the observed queue and ignores the fixed capacity."
  },
  {
    "question": "An MoE model has 2B shared parameters and ten 1B expert partitions. Each token uses two partitions. All raw weights use two bytes, with decimal GB. What is the complete raw weight residency before cache and workspace?",
    "options": [
      "24 GB, because the 2B shared plus 10B expert pool all remain stored or reachable.",
      "8 GB, because only the 4B active parameters need storage.",
      "20 GB, because the shared parameters do not belong in model residency.",
      "12 GB, because each billion parameters occupies one GB at two-byte precision."
    ],
    "answer": "24 GB, because the 2B shared plus 10B expert pool all remain stored or reachable.",
    "explanation": "The total pool is 2 + 10×1 = 12B parameters, giving 24 GB at two bytes each. The active path is 2 + 2×1 = 4B, or 8 GB of participating weight quantity. Active computation does not erase the other stored experts."
  },
  {
    "question": "A token selects two experts on one remote device. Its input and each returned hidden vector use 4 KiB. Under the stated per-destination protocol, the remote device receives one input and returns one already weighted combined output. What follows?",
    "options": [
      "Payload is 4 KiB instead of 16 KiB; combining expert outputs removes the return transfer.",
      "Payload stays 16 KiB; the selected expert count fixes the number of wire messages for any protocol.",
      "Payload is 8 KiB versus 16 KiB; the byte ratio implies half the end-to-end latency with expert computation unchanged.",
      "Payload is 8 KiB versus 16 KiB for assignment roundtrips; the same expert functions execute, with latency still unmeasured."
    ],
    "answer": "Payload is 8 KiB versus 16 KiB for assignment roundtrips; the same expert functions execute, with latency still unmeasured.",
    "explanation": "Separate roundtrips use 2 experts×2 directions×4 KiB = 16 KiB. The specified coalesced protocol uses one 4 KiB dispatch plus one 4 KiB weighted return, or 8 KiB. The same expert maps and gates can be computed at the destination. Metadata, fixed costs and overlap prevent inferring a latency ratio from these bytes."
  },
  {
    "question": "A token vector [2, 4] visits expert A, which doubles it, with gate 0.25, and expert B, which negates it, with gate 0.75. Which weighted scatter-add result is correct?",
    "options": [
      "[2, 4]",
      "[-0.5, -1]",
      "[-1.5, -3]",
      "[-0.875, -1.75]"
    ],
    "answer": "[-0.5, -1]",
    "explanation": "Expert A returns [4, 8]. Its gate makes that [1, 2]. Expert B returns [-2, -4]. Its gate makes that [-1.5, -3]. Add both contributions at the token’s index to get [-0.5, -1]. Adding the raw outputs gives [2, 4]. Overwriting A’s contribution with B’s leaves [-1.5, -3]. Applying each gate twice gives [-0.875, -1.75]."
  },
  {
    "question": "Two logits equal log(0.6) and log(0.4). Add 2 to both. For z-loss defined as the square of log-sum-exp, which pair of observations is correct?",
    "options": [
      "Probabilities stay [0.6, 0.4], while z-loss changes from 0 to 4.",
      "Probabilities change to [0.8, 0.2], while z-loss stays zero.",
      "Probabilities stay [0.6, 0.4], while z-loss stays zero because softmax is shift-invariant.",
      "Probabilities change to [0.8, 0.2], while z-loss changes from 0 to 2."
    ],
    "answer": "Probabilities stay [0.6, 0.4], while z-loss changes from 0 to 4.",
    "explanation": "A common logit offset preserves softmax ratios. The original exponential sum is 1, so its logarithm is 0. The shift multiplies that sum by exp(2), making log-sum-exp 2 and its square 4. Z-loss therefore measures a property that normalized probabilities alone do not retain."
  },
  {
    "question": "A serving candidate measures quality 0.86, p95 latency 64 ms and throughput 1300 tokens/s. Requirements are quality at least 0.85, latency at most 60 ms and throughput at least 1200 tokens/s. Which decision follows?",
    "options": [
      "Accept, because two of the three requirements pass and throughput can compensate for latency.",
      "Reject on latency; quality and throughput pass, but the separate p95 requirement fails.",
      "Accept, because sparse active computation guarantees lower latency than a dense baseline.",
      "Reject on quality, because a requirement of at least 0.85 excludes 0.86."
    ],
    "answer": "Reject on latency; quality and throughput pass, but the separate p95 requirement fails.",
    "explanation": "Quality 0.86 meets 0.85, and 1300 tokens/s meets 1200. Latency 64 ms exceeds 60 ms, so this candidate misses the p95 latency requirement."
  }
]
```

<!-- leetllm: audience:website:start -->> **Next:** Continue to [Mamba & State Space Models](/learn/state-space-models-mamba-alternatives). MoE sparsifies the feed-forward path, but most of these models still mix tokens with attention, so KV-cache growth remains a long-context cost. The next chapter compares selective state-space processing with attention, including why some production MoE backbones already interleave a linear-time mixer.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->> MoE sparsifies the feed-forward path, but models that use attention still incur KV-cache growth as context grows. Some production MoE backbones interleave attention with a linear-time state-space mixer. The online companion's [Mamba & State Space Models](/learn/state-space-models-mamba-alternatives) chapter compares selective state-space processing with attention.<!-- leetllm: audience:book:end -->

> **Next:** Continue to [Mamba & State Space Models](/learn/state-space-models-mamba-alternatives).
