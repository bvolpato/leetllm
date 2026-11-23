---
{
  "id": "mixture-of-experts-architecture",
  "title": "Mixture of Experts Architecture",
  "slug": "mixture-of-experts-architecture",
  "section": "Inference & Production Scale",
  "category": "Transformer Architecture",
  "difficulty": "Hard",
  "order": 23,
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
    "long-context-window-management",
    "transformer-architecture-end-to-end",
    "scaled-dot-product-attention",
    "multi-query-grouped-query-attention",
    "scaling-llm-inference-batching-kv-cache",
    "model-parallelism-for-llm-inference"
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

Consider an eight-expert layer that routes each token to two feed-forward networks. That sounds like a smaller model until you try to load its weights. Why can the arithmetic be sparse while the memory footprint stays large?

In the [Transformer lesson](/learn/transformer-architecture-end-to-end), one feed-forward network (FFN) transformed each <span data-glossary="token">token</span> after attention mixed information across positions. <span data-glossary="mixture-of-experts">Mixture of Experts (MoE)</span> replaces that FFN with a pool of expert networks and a router that selects a few for each token. The expert choice can change at every layer and position; it isn't a once-per-request choice between a math model and a code model.

The tradeoff moves rather than disappears: weights still need a home, routed token states may cross GPUs, and skewed choices can overload one expert. For one token, the router chooses a few experts and blends their outputs. Skipped experts do no expert computation for that token, but their weights still have to be stored or fetched for other tokens.

## From one FFN to many experts

In a standard Transformer layer, the <span data-glossary="feed-forward-network">FFN</span> sublayer is one dense network. In an MoE layer, that FFN is replaced by $N$ parallel expert FFNs plus a **router** (also called a gating network) that picks which $k$ experts handle each token. Those winners are a <span data-glossary="top-k">top-k</span> subset.[^shazeer2017]

In many MoE LLMs, experts replace only the FFN. The attention parameters are shared rather than duplicated inside every expert.[^jiang2024][^deepseekv2_2024] That doesn't require full dense attention: FFN routing and attention sparsity are separate choices. A common router is a linear projection: multiply the token's hidden state by a learned matrix $W_g$ to get $N$ scores. It chooses an FFN path, not which tokens attend to one another.

With scores 0.52, 0.17, 0.26, and 0.05 and top-2 routing, E1 and E3 run. E2 and E4 remain stored but contribute no expert computation for this token. Bar length below encodes the router probability.

<figure>
  <img src="illustrations/_generated/moe_architecture_dark.png" alt="Token x = [1, 0, 0, 0] enters a four-expert top-2 router with probabilities 0.522, 0.170, 0.259, and 0.050. E1 and E3 are selected with renormalized weights 0.668 and 0.332; E2 and E4 remain inactive. E1 outputs [2, 0, 0, 0] and E3 outputs [0, 3, 0, 0], summing to [1.336, 0.995, 0, 0]." />
  <figcaption>The exact gate probabilities (0.522 and 0.259 for E1 and E3) renormalize to weights 0.668 and 0.332, giving the weighted blend [1.336, 0.995, 0, 0]. Both selected experts receive the same hidden vector; E2 and E4 remain stored without executing.</figcaption>
</figure>

## A concrete routing walkthrough

For a Mixtral-style router, top-$k = 2$ keeps two experts and rescales their probabilities to sum to one. Follow the same token through scoring, selection, and blending. Other routers use different weighting rules, so this convention belongs to the example rather than to every MoE.

### Setup
- One token arrives with a hidden state $x$ of dimension 4.
- There are 4 experts, each a small FFN.
- The router uses top-$k = 2$.

#### Step 1: Router scores

The router multiplies the token by a learned weight <span data-glossary="matrix">matrix</span> $W_g$ to get a raw score for each expert. Suppose the scores come out as:

| Expert | Raw score (logit) |
|---|---|
| 1 | -0.65 |
| 2 | -1.77 |
| 3 | -1.35 |
| 4 | -3.00 |

#### Step 2: Softmax probabilities

Apply <span data-glossary="softmax">softmax</span> so the scores become probabilities that sum to 1. Approximate probabilities:

| Expert | Probability |
|---|---|
| 1 | 0.52 |
| 2 | 0.17 |
| 3 | 0.26 |
| 4 | 0.05 |

#### Step 3: Top-k selection

Pick the top 2 experts: Expert 1 (0.52) and Expert 3 (0.26).

#### Step 4: Renormalize

The selected weights are renormalized so they sum to 1 inside the chosen subset:
- Expert 1: $0.52 / (0.52 + 0.26) \approx 0.67$
- Expert 3: $0.26 / (0.52 + 0.26) \approx 0.33$

#### Step 5: Expert computation

Only Experts 1 and 3 run. Each processes the same input token $x$ through its own FFN weights.
- $E_1(x)$ produces output <span data-glossary="vector">vector</span> $o_1$
- $E_3(x)$ produces output vector $o_3$

#### Step 6: Weighted sum

The MoE sublayer blends the two expert outputs with the renormalized gate weights. The surrounding Transformer residual connection isn't included here:

$$
\text{Output} = 0.67 \cdot E_1(x) + 0.33 \cdot E_3(x)
$$

Experts 2 and 4 never process this token, so they contribute no expert-FFN FLOPs for this decision. Their weights still need to be stored or fetched for other tokens that may select them.

The next snippet uses the exact logits, not the rounded table, and should recover the same selected pair and 0.67 / 0.33 split.

<!-- leetllm: test, deps=torch, output=show -->
```python title="routing-walkthrough.py"
import torch

logits = torch.tensor([-0.65, -1.77, -1.35, -3.00])
probabilities = torch.softmax(logits, dim=0)
top_values, top_indices = torch.topk(probabilities, k=2)
weights = top_values / top_values.sum()

print("selected experts:", (top_indices + 1).tolist())
print("renormalized weights:", [round(w, 2) for w in weights.tolist()])
print("selected weight sum:", round(weights.sum().item(), 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
selected experts: [1, 3]
renormalized weights: [0.67, 0.33]
selected weight sum: 1.0
```
<!-- leetllm: output:end -->

## Write the selected-expert sum

The same walkthrough is one compact equation. For an input token $x$:

$$
\text{MoE}(x) = \sum_{i \in \text{TopK}(g(x))} \tilde{g}_i(x) \cdot E_i(x)
$$

For this Mixtral-style rule, the router computes a distribution $g(x)$ over all $N$ experts, keeps the top-$k$ entries, and renormalizes them into $\tilde{g}(x)$. Equivalently, mask the unselected logits to negative infinity before softmax. Mixtral uses top-2 out of eight.[^jiang2024] Each selected $E_i$ maps the same hidden state back to the same dimension, so their weighted outputs can be added.

Renormalization isn't mandatory across architectures. Switch Transformer uses top-1 and retains the selected expert's original softmax gate. If you renormalized a single surviving gate, it would always equal 1: away from selection thresholds, the task loss would lose that differentiable path into the router.[^fedus2022] Shared experts, when present, add another always-on output path outside this routed sum.

```checkpoint
Why does the Mixtral-style example renormalize selected weights, and why shouldn't you apply that rule blindly to top-1?
---
Renormalization makes this example's selected weights sum to 1. With top-1 it makes the sole weight constant, removing its task-loss gradient to the router. Switch instead preserves the original selected gate; routing weights are architecture-specific.
```

The weighted sum explains one token's result. The next question is resource accounting: what grows with the full expert pool, and what stays tied to $k$?

## Why sparse activation can pay off

Two quantities now diverge. An MoE layer can keep per-token expert FLOPs tied mostly to $k$ while total weight residency follows all experts. Distributed serving adds token-dispatch traffic, so active parameters alone can't predict latency.

| Property | Dense baseline (~active compute) | MoE model (Mixtral-shaped) |
|----------|----------------------------------|----------------------------|
| **Total parameters** | ~13B dense peer | ~46.7B (8 experts) |
| **Active parameters/token** | ~13B | ~12.9B (top-2 of 8) |
| **FFN arithmetic per token** | All dense FFN weights | Selected expert FFNs plus router |
| **Other work** | Attention and shared layers | Attention, shared layers, grouping and dispatch |
| **Quality at similar arithmetic** | Must be evaluated | Extra capacity may help; compare on the target tasks |

Adding experts while keeping top-$k$ fixed grows the FFN parameter pool, but each token still runs only a small subset. Routing, batching, and communication still add overhead, so "same active parameters" isn't identical latency.

Expert computation per token is sparse. Weight storage follows the full pool; communication follows token routes and expert placement, not total parameter count alone. Training state must account for the parameter pool, with sharding and optimizer-specific storage. A token's task gradient reaches its selected expert paths; this doesn't mean every other weight stays unchanged after a batch update, momentum, or weight decay.

Only the FFN blocks are replicated across experts. Attention layers, <span data-glossary="embedding">embeddings</span>, normalization layers, and the router stay shared. That's why Mixtral 8x7B is about 46.7B total parameters and about 12.9B active parameters per token, not the naive 56B and 14B you would get from multiplying everything by 8. The Mixtral paper rounds those counts to 47B and 13B.[^jiang2024]

Active parameters mostly drive per-token expert FLOPs. Total parameters drive weight memory and <span data-glossary="model-checkpoint">checkpoint</span> size. Network traffic depends on where selected experts live.

To isolate parameter counts from checkpoint packaging details, consider an MoE model with 3B shared parameters and eight 2B expert partitions. Each partition represents one expert position aggregated across all MoE layers, with top-2 routing at every MoE layer and two bytes per stored weight.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="capacity-versus-compute.py"
import numpy as np

shared_parameters_b = 3.0
expert_parameters_b = np.full(8, 2.0)
top_k = 2

total_parameters_b = shared_parameters_b + expert_parameters_b.sum()
active_parameters_b = shared_parameters_b + expert_parameters_b[:top_k].sum()

print("total parameters:", f"{total_parameters_b:.1f}B")
print("active parameters/token:", f"{active_parameters_b:.1f}B")
print("weights needed for residency:", f"{total_parameters_b:.1f}B")
print("raw BF16 weight storage:", f"{total_parameters_b * 2:.1f} GB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
total parameters: 19.0B
active parameters/token: 7.0B
weights needed for residency: 19.0B
raw BF16 weight storage: 38.0 GB
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/stored_pool_active_path_dark.png" alt="BF16 weight pool comparison: 3B shared weights plus eight 2B expert partitions occupy 19B parameters (38 GB). One token computes with 3B shared weights plus two 2B selected partitions, or 7B parameters (14 GB). All 38 GB stay in memory, leaving a 24 GB shortfall on a 14 GB budget." />
  <figcaption>This BF16 breakdown aggregates expert partitions across MoE layers. Highlights mark active compute participation (7B parameters, 14 GB), while all 38 GB stay stored in memory, leaving a 24 GB shortfall on a 14 GB budget before KV cache or workspace.</figcaption>
</figure>

```checkpoint
If an MoE has 46.7B total parameters and 12.9B active parameters per token, which number drives FLOPs and which number drives memory residency?
---
Active parameters mostly drive per-token expert FLOPs. Total parameters drive checkpoint size and the amount of expert weight memory the serving system must keep available.
```

## A top-k router you can run

The walkthrough showed the probabilities directly; here the gate is an explicit $4 \times 4$ weight matrix. For $x = [1, 0, 0, 0]$, computing $W_g x$ returns its first column, producing the four logits from above before each selected linear expert transforms $x$.

<!-- leetllm: test, deps=torch, output=show -->
```python title="topk-router.py"
import torch


def topk_route(
    hidden: torch.Tensor,
    gate: torch.Tensor,
    top_k: int,
) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    if hidden.ndim != 1 or gate.ndim != 2 or gate.shape[1] != hidden.shape[0]:
        raise ValueError("gate columns must match the 1D hidden dimension")
    if not 1 <= top_k <= gate.shape[0]:
        raise ValueError("top_k must be between 1 and the expert count")
    logits = gate @ hidden
    probabilities = torch.softmax(logits, dim=0)
    top_probs, selected = torch.topk(probabilities, k=top_k)
    weights = top_probs / top_probs.sum()
    return logits, selected, weights


gate = torch.tensor([
    [-0.65, 0.0, 0.0, 0.0],
    [-1.77, 0.0, 0.0, 0.0],
    [-1.35, 0.0, 0.0, 0.0],
    [-3.00, 0.0, 0.0, 0.0],
])
hidden = torch.tensor([1.0, 0.0, 0.0, 0.0])
logits, selected, weights = topk_route(hidden, gate, top_k=2)

# Each 4x4 projection maps the 4D hidden vector into the 4D expert output space.
expert_weights = torch.tensor([
    [[2.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0]],
    [[0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0], [4.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0]],
    [[0.0, 0.0, 0.0, 0.0], [3.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0]],
    [[0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0], [5.0, 0.0, 0.0, 0.0]],
])
selected_outputs = expert_weights[selected] @ hidden
blended = weights @ selected_outputs

print("logits:", [round(score, 2) for score in logits.tolist()])
print("selected experts:", (selected + 1).tolist())
print("renormalized weights:", [round(w, 2) for w in weights.tolist()])
print("weight sum:", round(weights.sum().item(), 2))
print("blended output:", [round(value, 3) for value in blended.tolist()])
try:
    topk_route(hidden, gate, top_k=0)
except ValueError as error:
    print("invalid route rejected:", error)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
logits: [-0.65, -1.77, -1.35, -3.0]
selected experts: [1, 3]
renormalized weights: [0.67, 0.33]
weight sum: 1.0
blended output: [1.336, 0.995, 0.0, 0.0]
invalid route rejected: top_k must be between 1 and the expert count
```
<!-- leetllm: output:end -->

Because softmax uses exact logits rather than rounded table probabilities, the blended output differs slightly from a hand calculation with 0.52 and 0.26. Try changing `top_k=4` to activate all experts, or pass a three-column gate matrix to verify that the shape check rejects mismatched hidden dimensions rather than truncating a dot product. PyTorch's `softmax` maintains numerical stability internally by shifting by the maximum logit, while ties depend on how the underlying kernel orders equal probabilities.

Mixtral and DeepSeek-V2 select multiple routed experts per token.[^jiang2024][^deepseekv2_2024] Changing a trained checkpoint's top-$k$ changes its computation and isn't a free serving knob: evaluate quality as well as compute, capacity, and communication.

```checkpoint
What additional trade-off does top-2 routing introduce compared with top-1?
---
Top-2 lets a token blend two routed outputs, but it also executes and dispatches more expert work per token. Whether that trade improves quality or serving efficiency has to be measured for the architecture and hardware.
```

### Alternative: expert choice routing

The standard top-k router forces each token to choose its top $k$ experts. **Expert Choice Routing**[^zhou2022] flips the mechanism: each *expert* selects a fixed bucket of top-scoring *tokens* from the current batch.

Each expert processes a fixed <span data-glossary="token-budget">token budget</span>, so expert-side load is predictable and easier to schedule. Coverage moves to the token side: one token may land in many expert buckets, one bucket, or none unless the design adds coverage rules. Token-choice routing with balancing losses remains the simpler picture for open-weight MoE LLMs. Expert-choice routing still shows up in training-efficiency papers.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="expert-choice-coverage.py"
import numpy as np

# Affinity scores for 3 experts (rows) across 5 tokens t0..t4 (columns); each picks top-2.
scores = np.array([
    [0.90, 0.80, 0.10, 0.05, 0.01],
    [0.85, 0.20, 0.75, 0.10, 0.02],
    [0.15, 0.25, 0.80, 0.70, 0.03],
])
buckets = np.argsort(-scores, axis=1, kind="stable")[:, :2]
token_counts = np.bincount(buckets.ravel(), minlength=scores.shape[1])

print("tokens per expert:", [buckets.shape[1]] * scores.shape[0])
print("t0 expert count:", int(token_counts[0]))
print("uncovered tokens:", [f"t{i}" for i in np.flatnonzero(token_counts == 0)])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tokens per expert: [2, 2, 2]
t0 expert count: 2
uncovered tokens: ['t4']
```
<!-- leetllm: output:end -->

```checkpoint
What trade-off does expert choice routing make compared with token choice top-k routing?
---
Expert choice gives each expert a fixed token budget, so load balancing is easy. The risk moves to the token side: some tokens may get many experts while others may be skipped unless the design enforces coverage.
```

There is another dependency to check before using batch-wide expert choice in an autoregressive decoder. Hold an earlier token's score fixed, then add a higher-scoring future token to a one-slot expert bucket:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="bucket-depends-on-later-tokens.py"
import numpy as np

tokens = ["earlier", "future"]
prefix_scores = np.array([0.6])
extended_scores = np.array([0.6, 0.9])

print("prefix:", f"selected={[tokens[int(np.argmax(prefix_scores))]]}")
print("extended:", f"selected={[tokens[int(np.argmax(extended_scores))]]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prefix: selected=['earlier']
extended: selected=['future']
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/expert_choice_coverage_and_causality_dark.png" alt="Expert-choice buckets E1: [t0, t1], E2: [t0, t2], and E3: [t2, t3] each hold two assignments. The five tokens receive 2, 1, 2, 1, and 0 assignments, leaving t4 uncovered. In a separate one-slot bucket, the earlier score 0.6 wins alone, but a future score 0.9 displaces it without changing that earlier score. Attention masking does not remove this routing dependence on the future." />
  <figcaption>Each expert gets two assignments, but token t4 gets none. In the separate one-slot example, a later score of 0.9 displaces the earlier 0.6 without changing that earlier score. Attention masking does not remove this routing dependence.</figcaption>
</figure>

The earlier token loses its expert contribution even though its own score didn't change. This follows from selection across the bucket: a causal attention mask alone doesn't make that FFN routing causal. A decoder needs a routing/grouping policy that cannot depend on unavailable future tokens, plus checks for prefix and incremental-execution consistency. Prefix-consistent verification catches this future dependence directly in deployed expert-choice implementations.[^zhou2022]

## Why routers collapse without a balancing policy

During training, routers can drift toward **expert collapse**: many tokens route to a few popular experts while others starve. Load statistics tell you whether this is occurring. They don't prove that a perfectly uniform router is best for model quality.

Suppose four interchangeable experts start with nearly tied scores, and E1 wins slightly more often on common tokens. More examples then contribute to E1's task <span data-glossary="gradient">gradient</span>, while cold experts see less training data. E1 improves faster on the tokens it already sees, making that route even more attractive and amplifying routing skew across optimizer updates. Diagnosing collapse therefore requires tracking load across multiple training steps, where many assignments accumulate into each parameter update.

That feedback starves E2 through E4. After enough steps, E1 may take most assignments while the others stay under-trained. The model still reserves memory for all four experts, but that isn't a math expert plus three specialists. It's one overworked expert and three idle parameter blocks.

The histograms use the same 60 / 20 / 15 / 5 split as the numeric loss check later. Compare them with quality, overflow, and communication before you pick a balancing policy.

<figure>
  <img src="illustrations/_generated/expert_routing_dark.png" alt="Twenty expert assignments split as 12 (60%), 4 (20%), 3 (15%), and 1 (5%) against a 25% uniform target (5 tokens each). E0 exceeds the 50% batch investigation threshold, though one skewed batch calls for tracking rather than concluding training collapse." />
  <figcaption>Twenty assignments produce shares of 60%, 20%, 15%, and 5% using zero-based expert indices, compared with a 25% uniform target (5 tokens per expert). One skewed batch triggers investigation rather than diagnosing training collapse.</figcaption>
</figure>

The router is trained jointly with the rest of the network.[^shazeer2017] Inspect assignment shares, overflow, task loss, and communication load together.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="routing-load-monitor.py"
import numpy as np

assignments = np.repeat(np.arange(4), [12, 4, 3, 1])
counts = np.bincount(assignments, minlength=4)
shares = counts / assignments.size

print("assignment shares:", [round(float(s), 2) for s in shares])
print("flag for investigation:", bool(shares.max() > 0.50))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
assignment shares: [0.6, 0.2, 0.15, 0.05]
flag for investigation: True
```
<!-- leetllm: output:end -->

```checkpoint
Why does expert collapse reinforce itself during training?
---
More assignments give the favored expert more training examples; it can improve faster and attract still more assignments. Cold experts receive less task-gradient signal. Compare this trend across steps with quality, rather than counting every token as a separate optimizer update.
```

## An auxiliary load-balancing loss

How can a training run push back against that feedback loop? Switch Transformer combines the observed assignment fraction with the router's average probability for each expert.[^fedus2022] If E1 receives 60% of tokens and 55% of probability mass, its contribution is $0.60 \times 0.55 = 0.33$. Sum those products, multiply by the expert count, then scale the penalty with a coefficient $\alpha$:

$$
\mathcal{L}_{\text{balance}} = \alpha \cdot N \sum_{i=1}^N f_i \cdot p_i
$$

Multiply each expert's routed-assignment fraction $f_i$ by its average routing probability $p_i$ and sum them. If the router sends too many assignments to one expert (high $f_i$) and gives it high probability (high $p_i$), the product is large, so the loss penalizes that concentration.

Here:
- $f_i = \frac{\text{tokens routed to expert } i}{T}$ for Switch's top-1 rule, where $T$ is the number of tokens in the routing batch
- $p_i = \frac{1}{T}\sum_{t=1}^T \text{softmax}(W_g \cdot x_t)_i$ (average router probability)
- $\alpha$ is a configurable coefficient (Switch reports experiments including $10^{-2}$)
- $N$ is the number of experts

A balanced reference point is $f_i = p_i = 1/N$, giving a loss of $\alpha$. It's a reference, not a task-quality metric. The hard assignment counts $f_i$ aren't differentiated; the gradient flows through the mean probabilities $p_i$. Within a fixed assignment pattern, probability on a heavily used expert incurs a larger coefficient.[^fedus2022]

For a top-$k$ illustration you can normalize $f_i$ over $T k$ assignments, but libraries use different scaling and balancing scopes. Match the exact implementation before copying a loss coefficient. Neither this scalar nor a uniform histogram proves that every expert is useful.

Here's a concrete top-1 numeric check. Suppose we have 4 experts and a mini-batch of 100 tokens:

| Expert | $f_i$ (actual fraction) | $p_i$ (average prob) | Product $f_i \cdot p_i$ |
|---|---|---|---|
| 1 | 0.60 | 0.55 | 0.330 |
| 2 | 0.20 | 0.22 | 0.044 |
| 3 | 0.15 | 0.15 | 0.0225 |
| 4 | 0.05 | 0.08 | 0.004 |
| **Sum** | | | **0.4005** |

If the load were perfectly uniform, each expert would get $f_i = p_i = 0.25$, and the sum would be $4 \times (0.25 \times 0.25) = 0.25$. The current batch gives $4 \times 0.4005 = 1.602$ before multiplying by $\alpha$. Tune that coefficient with task quality, because balancing pressure can fight the language-modeling objective.

The auxiliary loss says "use the expert pool evenly enough." The language-modeling loss still decides whether the model predicts the next token well.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="load-balancing-score.py"
import numpy as np

assignment_counts = np.array([60, 20, 15, 5], dtype=float)
mean_router_probability = np.array([0.55, 0.22, 0.15, 0.08])
expert_count = assignment_counts.size
fractions = assignment_counts / assignment_counts.sum()

concentration = expert_count * float(np.dot(fractions, mean_router_probability))
uniform_reference = expert_count * float(np.sum(np.full(expert_count, 1.0 / expert_count) ** 2))

print("scaled concentration:", round(concentration, 2))
print("uniform reference:", round(uniform_reference, 2))
print("difference from uniform reference:", round(concentration - uniform_reference, 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
scaled concentration: 1.6
uniform reference: 1.0
difference from uniform reference: 0.6
```
<!-- leetllm: output:end -->

Before using 1.0 as a pass/fail cutoff, try this feasible top-1 counterexample. Each row sums to one, and the winning expert is unambiguous:

<!-- leetllm: test, deps=torch, output=show -->
```python title="balance-reference-is-not-a-coverage-proof.py"
import torch

probs = torch.tensor([[0.51, 0.09, 0.40], [0.09, 0.51, 0.40]])
winners = probs.argmax(dim=1)
fractions = torch.bincount(winners, minlength=3).float() / probs.shape[0]
mean_probability = probs.mean(dim=0)
score = 3 * torch.dot(fractions, mean_probability)

print("assignment fractions:", [round(v, 2) for v in fractions.tolist()])
print(f"balance term / alpha: {score.item():.2f}")
print("every expert used:", bool((fractions > 0).all()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
assignment fractions: [0.5, 0.5, 0.0]
balance term / alpha: 0.90
every expert used: False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/balancing_objective_and_counterexample_dark.png" alt="Observed fractions 0.60, 0.20, 0.15, and 0.05 multiply mean probabilities 0.55, 0.22, 0.15, and 0.08. The products sum to 0.4005, yielding 4 times 0.4005 = 1.602 before alpha. A separate two-token, three-expert example selects experts 0 and 1. Expert 2 is unused although the score is 0.90, below the uniform reference 1. Hard counts stop gradients while mean probabilities carry the auxiliary gradient." />
  <figcaption>The four products sum to 0.4005, giving 1.602 before the coefficient α. The separate three-expert example scores 0.90 while leaving E2 unused. Gradients flow through mean probabilities, not hard counts; the scalar alone does not certify coverage.</figcaption>
</figure>

The third expert wins no token, yet the term is below the uniform reference. Thus 1.0 is neither a universal lower bound nor a coverage certificate for this dot-product loss. Its local gradients can encourage balancing without making the scalar a complete health metric. Inspect actual assignments, per-expert learning, overflow, and held-out quality.

```checkpoint
In the load-balancing loss, what do $f_i$ and $p_i$ measure?
---
$f_i$ is the fraction of tokens assigned to expert $i$ under top-1; $p_i$ is its mean router probability. The loss differentiates through $p_i$, not the hard assignment count. High values indicate concentration, not necessarily a capacity overflow.
```

Balancing asks how assignments are distributed on average. Capacity asks what happens when one batch is bursty and a hot expert fills its buffer.

## Capacity factor and overflow policy

Start with a routing batch of 4096 tokens at one layer. Each chooses top-2 from 32 experts: 8192 assignments, averaging 256 per expert. At capacity factor 1.0, an expert assigned 400 tokens has 144 overflowed assignments. Those aren't necessarily 144 fully skipped tokens, because each token has another selected expert.

In a batched environment, many MoE implementations use fixed-size expert buffers so the layer can run predictable <span data-glossary="tensor">tensor</span> operations. The **capacity factor** multiplies that uniform slot estimate:

$$
\text{Expert Capacity} = \left\lceil\frac{T k}{N}\times c\right\rceil
$$

Here $T$ counts tokens in this routing group, $k$ counts assignments per token, $N$ counts experts, and $c$ is the capacity factor. We round up to whole slots. A factor of 1.0 gives 256 slots here; 1.2 gives $\lceil 307.2 \rceil = 308$. An implementation may add minimum capacities or padding multiples. Its routing group may be a microbatch or distributed group, not the entire training batch.[^megatron2026moe]

What happens after an expert is assigned more tokens than its buffer allows depends on implementation:

1. **Dropping or pass-through:** Switch-style designs can skip overflowed expert computations and rely on the residual path for those token-layer assignments.[^fedus2022]
2. **Rerouting:** A system can send overflow to another eligible expert if capacity exists there. This changes the selected function and may require recomputing blend weights.
3. **Dropless execution:** A system can execute all assignments with variable work. Megatron Core supports dropless MoE as well as capacity-limited configurations; dropping isn't inherent to inference or MoE.[^megatron2026moe]

A higher capacity factor reduces overflow for the same routes but reserves more buffer space. Padded execution may also compute empty slots. Dropping an assignment skips one expert contribution, not a token from the sequence; under top-1 the residual can carry that token onward without its expert update. Rerouting, dropping, and post-drop renormalization must match the model and runtime policy.

<figure>
  <img src="illustrations/_generated/capacity_overflow_policy_dark.png" alt="4096 tokens with top-2 routing create 8192 assignments, or 256 nominal slots per expert across 32 experts. A hot expert receives 400 assignments: 256 fit and 144 overflow. Dropping skips only those expert contributions while tokens remain. Rerouting needs spare expert capacity and changes functions or weights; dropless execution runs all 400. Capacity factor 1.2 raises the ceiling to 308 and leaves 92 overflow assignments." />
  <figcaption>The hot expert receives 400 assignments for 256 slots. Dropping skips 144 expert contributions while tokens remain; rerouting requires spare capacity and can change the selected functions or weights; dropless execution runs all 400. A factor of 1.2 reserves 308 slots and leaves 92 overflow assignments.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="capacity-overflow-policy.py"
import numpy as np

tokens, top_k, experts = 4096, 2, 32
capacity = int(np.ceil(tokens * top_k / experts * 1.0))
hot_slots = np.arange(400)
kept_mask = hot_slots < capacity
overflow = int((~kept_mask).sum())

print("per-expert capacity:", capacity)
print("overflow assignments:", overflow)
print("drop keeps:", int(kept_mask.sum()), "skips:", overflow)
print("reroute keeps:", int(kept_mask.sum()), "sends elsewhere:", overflow)
print("dropless runs:", int(hot_slots.size))
print("capacity at factor 1.2:", int(np.ceil(tokens * top_k / experts * 1.2)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
per-expert capacity: 256
overflow assignments: 144
drop keeps: 256 skips: 144
reroute keeps: 256 sends elsewhere: 144
dropless runs: 400
capacity at factor 1.2: 308
```
<!-- leetllm: output:end -->

```checkpoint
Why does a capacity factor of 1.2 reduce overflow risk versus 1.0, and what must you know when an expert is full?
---
1.2 gives each expert a 20% buffer above uniformly distributed assignments, reducing overflow. The result of overflow is an implementation policy: it may drop, reroute, or execute extra assignments, with different quality and throughput costs.
```

## How modern architectures scale the idea

Routing, balance, and capacity interact. A larger pool may add useful capacity, but its experts must still train, fit somewhere, and receive their tokens. Mixtral keeps a small pool of wide experts; DeepSeek-V2 divides the work more finely. Relevant model-card/configuration selections below were checked on October 10, 2026. Counts illustrate architecture choices; they aren't quality rankings or complete artifact manifests.

### Mixtral 8x7B[^jiang2024]

| Property | Value |
|----------|-------|
| Total params | ~46.7B (paper rounds to 47B) |
| Active params | ~12.9B (paper rounds to 13B) |
| Experts | 8 |
| Top-K | 2 |
| Expert type | Standard FFN (SwiGLU activation[^shazeer2020]) |

MoE is applied only to the FFN layers. Attention stays shared. Mixtral uses a <span data-glossary="swiglu">SwiGLU</span> (Swish Gated Linear Unit) expert, a Gated Linear Unit (GLU) variant that improved Transformer quality in the GLU-variants paper.

### DeepSeek-V2[^deepseekv2_2024]

| Property | Value |
|----------|-------|
| Total params | 236B |
| Active params | 21B |
| Routed experts | 160 (fine-grained) |
| Shared experts | 2 (always-on) |
| Routed Top-K | 6 |
| Total active experts | 8 (6 routed + 2 shared) |

DeepSeek-V2 extends coarse-grained MoE in several ways:
- Fine-grained experts: 160 smaller routed experts instead of a handful of coarse experts, which gives the router many more combinations per token.[^deepseekv2_2024]
- Shared experts: 2 experts are always active for all tokens. The design aims to capture common computation and reduce redundancy among routed experts.[^deepseekv2_2024]
- Device-limited routing: selected routed experts for each token are constrained to at most three devices in the reported training configuration, limiting destination fan-out.[^deepseekv2_2024]
- Multi-level balancing losses: expert-level, device-level, and communication-balance losses for cluster-scale routing.[^deepseekv2_2024]
- Multi-head Latent Attention (MLA): retains compressed latent KV plus decoupled positional state; this is separate from FFN sparsity.[^deepseekv2_2024]

The expert counts describe each MoE layer, not eight independent complete models. DeepSeek-V2's first layer uses a dense FFN. Its smaller expert widths also mean that "eight active experts" can't be compared with Mixtral's "two active experts" without counting parameters and operations.[^deepseekv2_2024]

Cell counts in the comparison are exact. Tile sizes are schematic.

<figure>
  <img src="illustrations/_generated/moe_variants_dark.png" alt="Per-MoE-layer pools: Mixtral stores 8 routed experts and selects 2. DeepSeek-V2 stores 160 routed experts, selects 6, and always executes 2 shared experts. The same input feeds the routed pool and both shared experts. Exact cells encode expert counts. Cell areas are schematic because expert widths differ, so these counts do not compare FLOPs. The first DeepSeek-V2 FFN is dense." />
  <figcaption>The exact cell counts show per-MoE-layer pools: Mixtral selects 2 of 8 routed experts; DeepSeek-V2 selects 6 of 160 and always runs 2 shared experts. Blue marks a selected routed path and purple marks shared computation. Cell areas are schematic, so active counts do not compare FLOPs or parameter area.</figcaption>
</figure>

### DeepSeek-V3[^deepseekv3_2024]

DeepSeek-V3 keeps the DeepSeekMoE pattern at a larger reported scale. The first three layers stay dense FFNs; later layers are MoE. Compare it with the softmax walkthrough on two choices: how V3 selects routed experts and how it balances them.

| Property | Value |
|----------|-------|
| Total params | 671B |
| Active params | 37B |
| Routed experts | 256 |
| Shared experts | 1 |
| Routed Top-K | 8 |
| Total active experts | 9 (8 routed + 1 shared) |
| Main load balancing | Bias-adjusted auxiliary-loss-free strategy |
| Auxiliary guard | Sequence-wise balance loss |
| Other key component | Multi-head Latent Attention (MLA) |

Each MoE layer has 1 shared expert and 256 routed experts, with 8 routed experts activated per token.[^deepseekv3_2024]

DeepSeek-V3 also changes scoring. It computes token-to-expert affinity with sigmoid scores, normalizes the selected scores, and adds a per-expert bias only when choosing the top-$k$ routed experts. Training adjusts that bias from observed expert load. The weighted expert output still uses the original affinity score, not the routing bias.[^deepseekv3_2024]

The paper calls the main batch-wise mechanism **auxiliary-loss-free** because it doesn't rely on an auxiliary loss to keep expert load balanced across a training batch. It still keeps a small complementary sequence-wise balance loss to prevent extreme imbalance inside one sequence.[^deepseekv3_2024] The softmax router we built earlier is one common design rather than a universal template.

<figure>
  <img src="illustrations/_generated/selection_bias_and_weighting_contract_dark.png" alt="DeepSeek-V3 forks original sigmoid affinities sᵢ into a selection branch (+ bias bᵢ -> top-8 IDs of 256) and a weighting branch (gather original selected sᵢ -> normalize -> routed weighted sum plus 1 shared expert). Contrast table shows Switch top-1 keeps original gate, Mixtral top-2 normalizes selected softmax gates, and DeepSeek-V3 separates biased selection from unbiased normalization." />
  <figcaption>DeepSeek-V3 uses balancing bias only to choose routed expert IDs. Output weighting gathers and normalizes the original selected sigmoid affinities, then combines the routed output with one shared expert. Switch and Mixtral follow different weighting rules; normalizing the routed branch is an architecture-specific choice.</figcaption>
</figure>

### GLM-5.3 and DeepSeek V4 Flash 0731

The same split shows up again in the headline counts: a large stored model, and a much smaller active count.

| Property | GLM-5.3 | DeepSeek V4 Flash 0731 |
|---|---:|---:|
| Vendor core-size label | 744B total / about 40B active[^zai2026glm52repo] | 284B total / 13B active[^deepseek2026v4paper] |
| Routed experts per MoE layer | 256[^zai2026glm53config] | 256[^deepseek2026v4paper] |
| Routed experts per token | 8[^zai2026glm53config] | 6[^deepseek2026v4paper] |
| Shared experts | 1[^zai2026glm53config] | 1[^deepseek2026v4paper] |

These labels describe the core model's parameter count. A released checkpoint can also include auxiliary modules: Flash 0731 attaches a DSpark speculative-decoding module.[^deepseek2026v4flash0731] Inspect the actual tensor files, dtypes, quantization metadata, and runtime buffers to estimate the complete memory budget.

Two V4 details change how you read the earlier softmax router. Every Transformer block is an MoE layer, and the first three use hash routing from token identity instead of a learned gate. Learned affinity scores use $\sqrt{\mathrm{softplus}(\cdot)}$ rather than V3's sigmoid, still with balancing bias and a small sequence-wise loss. V4 also removes the earlier limit on routing target nodes: device-limited routing is a design choice, not a universal DeepSeek rule.[^deepseek2026v4paper]

GLM-5.3's vendor reports the same base as GLM-5.2, with changes from post-training. Its pinned BF16 config has three initial dense FFNs, then 75 MoE layers, sigmoid scoring, selected-score normalization, and a routed scaling factor of 2.5.[^zai2026glm53][^zai2026glm53config] A normalized selected sum can therefore receive an additional multiplier; don't assume every routed branch is a convex average or every block is MoE.

The similarly named GLM-5.3-Flash has a newly trained hybrid sparse/linear-attention backbone and a vendor label of 320B total/18B active.[^zai2026glm53flash] Those labels alone don't determine its cache state or expert widths. Both routing and sequence mixing must match the exact checkpoint; inter-device communication, resident weights, and backend support still need separate checks.

### Qwen3.6 sparse MoE checkpoint[^qwen3635b2026]

Qwen3.6 puts the active-versus-total split in the model name:

| Checkpoint | Total params | Activated params | MoE path | What the suffix means |
|---|---:|---:|---|---|
| Qwen3.6-35B-A3B | 35B | 3B | 256 experts, 8 routed + 1 shared | 35B total, about 3B active per token |

"A3B" hints at active compute, not full deployment footprint. You still need memory, sharding, <span data-glossary="quantization">quantization</span>, or <span data-glossary="model-offload">offload</span> capacity for the full checkpoint, plus serving support for routing and grouped expert execution.

<!-- leetllm: audience:website:start -->The backbone also interleaves Gated DeltaNet layers with gated attention. That is a sequence-mixer choice, not an FFN-routing choice. The feed-forward path can be sparse while token mixing still stores a growing cache.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->Qwen3.6 also interleaves Gated DeltaNet layers with gated attention. That is a sequence-mixer choice, not an FFN-routing choice. Mixture-of-experts routing and sequence mixing are separate design decisions.<!-- leetllm: audience:book:end -->

The model comparisons answer how capacity is allocated. Serving adds a second question: can the runtime move, group, and execute those routed token states fast enough on its actual devices?

## Serving an MoE on real hardware

Sparse compute per token doesn't remove the systems work. Experts often live on different devices, token states have to move, and decode microbatches re-expose that tax every step.

### Communication overhead

In distributed training and inference, experts often reside on different devices to meet memory requirements. Routing a token to an expert on another <span data-glossary="gpu">GPU</span> requires transferring the token's hidden state over a high-bandwidth interconnect such as NVLink within a node or InfiniBand across nodes.

That transfer can stall the layer. The usual pattern is an **all-to-all dispatch** that scatters tokens to the GPUs hosting their selected experts, then an **all-to-all combine** that returns expert outputs to the original token order. System designers try to overlap those transfers with useful compute so the network isn't the only thing running.

The next count uses four experts on two GPUs. Three of five assignments cross the link. Give each hidden state 4096 BF16 elements (2 bytes each) and return an output of the same size: each remote assignment moves 16 KiB across dispatch and combine, isolating tensor payload bytes ahead of packet headers or runtime collective waits.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="expert-placement-traffic.py"
import numpy as np

# Experts E0 and E1 reside on GPU 0; E2 and E3 reside on GPU 1.
expert_device = np.array([0, 0, 1, 1])
source_gpu = np.array([0, 0, 1, 1, 0])
routed_expert = np.array([0, 2, 2, 1, 3])
remote = int((source_gpu != expert_device[routed_expert]).sum())

print("routed assignments:", routed_expert.size)
print("remote assignments:", remote)
print("remote rate:", f"{remote / routed_expert.size:.0%}")
hidden_size, bytes_per_element = 4096, 2
payload_bytes = 2 * remote * hidden_size * bytes_per_element
print("dispatch + combine payload:", payload_bytes // 1024, "KiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
routed assignments: 5
remote assignments: 3
remote rate: 60%
dispatch + combine payload: 48 KiB
```
<!-- leetllm: output:end -->

### Memory requirements

Unlike dense models with one FFN per layer, MoE models carry many expert FFNs. Fast GPU deployments generally keep those expert weights resident somewhere in the serving pool so routing doesn't stall on weight fetches.

Mixtral activates about 12.9B parameters per token, yet the serving system needs access to the full ~46.7B-parameter checkpoint.[^jiang2024] The pool can be resident on one sufficiently large device, sharded across devices, or partly offloaded. None of those choices reduces its logical parameter count.

<span data-glossary="tensor-parallelism">Tensor parallelism</span> (TP) can shard the matrices of every expert across the same GPU group. <span data-glossary="expert-parallelism">Expert parallelism</span> (EP) instead assigns different expert IDs to different device groups, then dispatches tokens to their owners. Within an EP group, an expert can itself be tensor-sharded. TP-only MoE is valid; EP is an additional layout choice, not a requirement for sparsity.[^megatron2026moe]

### Training instability

MoE training can be more sensitive than training a comparable dense Transformer. Top-$k$ selection introduces discontinuities, and early preferences can reinforce expert starvation. Selected experts and applicable gate weights still receive task gradients, but optimization must account for numerical precision, load balance, and task loss together.

**Router z-loss**[^zoph2022] regularizes a quantity computed from routing <span data-glossary="logits">logits</span>; the ST-MoE paper reports improved training stability from this term. Input jitter is another candidate to test, but ST-MoE's XL-scale ablation improved stability while reducing quality.[^zoph2022] Track training loss, routing distribution, overflow, and downstream quality rather than assuming one stabilizer is free.

Its exact per-token penalty is $(\log\sum_i e^{z_i})^2$, averaged across tokens and multiplied by a coefficient. It isn't $\sum_i z_i^2$ and isn't a load-balancing loss. Adding a common offset leaves softmax probabilities unchanged while changing log-sum-exp:

<!-- leetllm: test, deps=torch, output=show -->
```python title="same-routing-different-z-loss.py"
import torch

base = torch.tensor([0.75, 0.25]).log()
for name, offset in [("original", 0.0), ("shifted", 3.0)]:
    logits = base + offset
    probabilities = torch.softmax(logits, dim=0)
    log_partition = torch.logsumexp(logits, dim=0)
    print(f"{name}: probabilities={[round(p, 2) for p in probabilities.tolist()]}, "
          f"z-loss={(log_partition ** 2).item():.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
original: probabilities=[0.75, 0.25], z-loss=0.00
shifted: probabilities=[0.75, 0.25], z-loss=9.00
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/z_loss_shift_invariance_dark.png" alt="Logits log(0.75) and log(0.25) shift upward by 3. Both cases retain softmax probabilities 0.75 and 0.25 and the same selected expert. The log partition changes from 0 to 3, so its square changes from 0 to 9. Z-loss regularizes the log partition, rather than each logit separately or the expert-load histogram." />
  <figcaption>Adding 3 to both logits preserves probabilities 0.75 and 0.25 and the chosen expert. The log partition moves from 0 to 3, so its square moves from 0 to 9. This is a log-partition penalty, distinct from per-logit L2 or an expert-load histogram.</figcaption>
</figure>

The load and expert choice are unchanged. Z-loss regularizes this log-partition quantity, not each logit's absolute size independently: a very negative losing logit can contribute almost nothing to it. Numerical stability, load balance, and task quality are three checks, even when their training objectives interact.

### Expert parallelism layout

Large distributed MoE deployments commonly use Expert Parallelism. TP splits individual matrix multiplications. EP maps entire experts to specific GPUs. Real deployments can combine EP with TP, sequence parallelism, <span data-glossary="data-parallelism">data parallelism</span>, and redundant expert placement. DeepSeek-V3 describes a decoding layout with TP4 for attention and EP320 for the MoE path.[^deepseekv3_2024]

**Serving snapshot, October 10, 2026:** vLLM's EP guide documents expert ownership over its TP×DP ranks, phase-oriented communication backends, and an Expert Parallel Load Balancer (EPLB) that adjusts physical mappings using observed load. Redundant expert copies consume additional memory.[^vllmExpertParallel2026] Moving or replicating the same learned expert preserves its learned function; changing routing scores or top-$k$ changes the selected function. Check model/backend support and compare outputs when changing layout, then benchmark the target workload.

The two-GPU sketch below matches the traffic snippet: GPU0 owns E0 and E1, GPU1 owns E2 and E3, and three of five token states cross the link. Expert weights don't migrate during this layer's dispatch.

<figure>
  <img src="illustrations/_generated/expert_parallelism_dark.png" alt="GPU G0 stores experts E0 and E1; G1 stores E2 and E3. Token t0 on G0 visits E0 locally, and t2 on G1 visits E2 locally. Three remote assignments send t1 from G0 to E2, t3 from G1 to E1, and t4 from G0 to E3. Each sends 8 KiB and returns 8 KiB, totaling 48 KiB roundtrip. Expert weights remain resident on their owning GPU." />
  <figcaption>G0 owns E0 and E1; G1 owns E2 and E3. Two assignments are local and three cross devices. With an 8 KiB dispatch and 8 KiB return for each remote assignment, token-state payload totals 48 KiB. Expert weights stay resident.</figcaption>
</figure>

At a larger 96-expert split the same ownership rule still holds:

```text
GPU 0: Attention layers (shared) + Experts 0-31
GPU 1: Attention layers (shared) + Experts 32-63
GPU 2: Attention layers (shared) + Experts 64-95
```

#### Sizing EP traffic

For the simple scheme above, let $r$ be the fraction of $T k$ assignments whose expert owner is remote. Dispatch sends one $H$-element hidden state and combine returns one $H$-element output per remote assignment, each with $b$ bytes per element:

$$
Q_{\text{remote}} = 2 r T k H b
$$

In the five-assignment trace above, $r=3/5$, so the payload is 48 KiB; treating all five as remote would predict 80 KiB. With all-local routes, this network payload is zero even though local packing and memory traffic remain. Runtime protocols may send one token state per destination device rather than per expert, combine outputs before returning them, compress payloads, or add padding and metadata. Count the actual dispatch/combine protocol.

Now put two selected experts on the same remote device. Assume that device can apply both blend weights and return one combined output for the token:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="same-routes-different-wire-protocol.py"
import numpy as np

# Rows store (token_id, expert_id, device_id) for two routes targeting GPU 1.
remote_routes = np.array([[0, 2, 1], [0, 3, 1]])
vector_bytes = 4096 * 2
per_assignment = 2 * remote_routes.shape[0] * vector_bytes
unique_dests = np.unique(remote_routes[:, [0, 2]], axis=0)
per_destination = 2 * unique_dests.shape[0] * vector_bytes

print("separate expert messages:", per_assignment // 1024, "KiB")
print("one message + combined return:", per_destination // 1024, "KiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
separate expert messages: 32 KiB
one message + combined return: 16 KiB
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/wire_protocol_and_expert_layout_dark.png" alt="The same token selects E2 and E3 on remote GPU G1. Separate dispatch and return messages for two assignments make four 8 KiB messages, totaling 32 KiB. Per-destination coalescing sends one 8 KiB input, runs both experts, and returns one 8 KiB weighted sum, totaling 16 KiB. Expert functions and FLOPs stay fixed. Separately, TP splits one expert matrix into four rank shards, while EP assigns whole expert IDs to owning groups. Payload differences alone imply no latency result." />
  <figcaption>Selecting E2 and E3 on the same remote GPU needs 32 KiB with separate assignment messages or 16 KiB with a shared dispatch and a remotely weighted combined return. Functions and expert FLOPs stay fixed. The lower objects distinguish matrix shards in TP from expert-ID ownership in EP; payload totals alone imply no latency result.</figcaption>
</figure>

The selected experts and expert FLOPs didn't change. The application protocol did. That accounting isolates payload geometry; routing metadata, scales, packing, padding, and synchronization add costs to the wire traffic. A top-$k$ count alone cannot predict all-to-all bytes or latency.

Compare that payload with matrix multiplication (GEMM) work. For $T_{\text{exp}}$ rows at one expert, hidden size $H$, and intermediate size $I$, two projections cost about $4 T_{\text{exp}} H I$ FLOPs; a three-projection gated FFN costs about $6 T_{\text{exp}} H I$. Both count a multiply and add as two FLOPs and omit element-wise work. Small decode groups can expose launch and network latency even when payload bytes are modest.

Check expert and device loads at the same time scale. A long-run expert histogram can hide a burst of popular experts on one rank. Unequal expert placement or expert sizes can also make equal assignment counts unequal work. With equal-size experts, equal expert counts per rank, and exactly uniform simultaneous assignments, rank work is balanced too; don't diagnose a hotspot from that histogram alone.

Large <span data-glossary="prefill">prefill</span> batches can amortize dispatch/combine across many tokens per expert. Decode microbatches re-expose router, grouping, and collective latency every step. State whether "batch size 1" means one prompt with thousands of prefill tokens or one decode token: they create very different expert matrix shapes.

### Expert prefetching

For CPU-offloaded serving (for example, running a quantized MoE checkpoint on consumer hardware), one possible design is:

1. Keep attention weights and router weights in GPU memory (always needed).
2. Keep expert weights on CPU or SSD.
3. After a layer's router decides which experts are needed, transfer those expert weights before its expert computation.
4. Optionally use prediction or caching to stage likely later-layer experts, accepting misses or unused transfers.

This can make large MoE checkpoints fit where full GPU residency can't, especially when combined with [weight quantization](/learn/model-quantization-gptq-awq-gguf), but it trades memory for transfer-dependent latency. You can't know an exact next-layer route until that layer receives its hidden state, so unconditional "prefetch the next experts" isn't free.

### Batch routing efficiency

In batch serving, different tokens in a batch may route to different experts. Batched expert execution is the serving trick:

1. Router assigns all tokens in the batch to their top-k experts.
2. Group tokens by expert assignment.
3. Execute each expert as a batched matrix multiply over its assigned tokens.
4. Scatter results back to original token positions.

That groups many per-token expert calls into larger matrix multiplies when enough assignments reach each expert. The PyTorch routine below stably packs token rows by expert assignment before running each bucket's expert transformation:

<!-- leetllm: test, deps=torch, output=show -->
```python title="grouped-expert-execution.py"
import torch

expert_ids = torch.tensor([2, 0, 2, 1, 2])
hidden_states = torch.arange(1, 11, dtype=torch.float32).reshape(5, 2)
expert_scales = torch.tensor([2.0, -1.0, 0.5])

order = torch.argsort(expert_ids, stable=True)
unique_experts, counts = torch.unique_consecutive(expert_ids[order], return_counts=True)
token_buckets = torch.split(order, counts.tolist())

for expert_id, token_bucket, count in zip(unique_experts.tolist(), token_buckets, counts.tolist()):
    bucket_outputs = hidden_states[token_bucket] * expert_scales[expert_id]
    print(
        f"E{expert_id}",
        "batch tokens:", [f"t{i}" for i in token_bucket.tolist()],
        "gemm rows:", count,
        "output shape:", tuple(bucket_outputs.shape),
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
E0 batch tokens: ['t1'] gemm rows: 1 output shape: (1, 2)
E1 batch tokens: ['t3'] gemm rows: 1 output shape: (1, 2)
E2 batch tokens: ['t0', 't2', 't4'] gemm rows: 3 output shape: (3, 2)
```
<!-- leetllm: output:end -->

Grouping changes row order, so each assignment must retain its token index and blend weight. Below, each diagonal scaling expert transforms its packed token rows before `index_add` restores the blended states. Summing token 0 directly gives $0.25 \times (0.5\mathbf{x}) + 0.75 \times (-\mathbf{x}) = -0.625\mathbf{x}$.

<!-- leetllm: test, deps=torch, output=show -->
```python title="dispatch-and-weighted-combine.py"
import torch

inputs = torch.tensor([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]])
token_ids = torch.tensor([0, 1, 2, 0, 2])
expert_ids = torch.tensor([2, 0, 2, 1, 0])
gate_weights = torch.tensor([0.25, 1.0, 0.6, 0.75, 0.4])
scales = torch.tensor([2.0, -1.0, 0.5])

order = torch.argsort(expert_ids, stable=True)
packed_tokens = token_ids[order]
packed_experts = expert_ids[order]
packed_weights = gate_weights[order]
packed_outputs = inputs[packed_tokens] * scales[packed_experts].unsqueeze(1)

combined = torch.zeros_like(inputs).index_add(
    0, packed_tokens, packed_outputs * packed_weights.unsqueeze(1)
)
unweighted = torch.zeros_like(inputs).index_add(0, packed_tokens, packed_outputs)

# Direct reference sum over the original assignments verifies permutation invariance.
raw_outputs = inputs[token_ids] * scales[expert_ids].unsqueeze(1)
reference = torch.zeros_like(inputs).index_add(
    0, token_ids, raw_outputs * gate_weights.unsqueeze(1)
)
torch.testing.assert_close(combined, reference)
assert not torch.allclose(unweighted, combined)

print("packed token order:", packed_tokens.tolist())
print("restored weighted rows:", [[round(v, 3) for v in row] for row in combined.tolist()])
print("token 0 without gate weights:", [round(v, 3) for v in unweighted[0].tolist()])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
packed token order: [1, 2, 0, 0, 2]
restored weighted rows: [[-0.625, -1.25], [6.0, 8.0], [5.5, 6.6]]
token 0 without gate weights: [-0.5, -1.0]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/dispatch_weighted_combine_dark.png" alt="Three token vectors produce five assignments: (t0, E2, 0.25), (t1, E0, 1), (t2, E2, 0.6), (t0, E1, 0.75), and (t2, E0, 0.4). Grouping by expert gives stable token order [1, 2, 0, 0, 2]. E0 scales by 2, E1 by -1, and E2 by 0.5. Each route weight is applied exactly once. Scatter-add by token ID gives [-0.625, -1.25], [6, 8], and [5.5, 6.6]. The unweighted token-0 sum [-0.5, -1] differs." />
  <figcaption>Grouping preserves token IDs in packed order [1, 2, 0, 0, 2]. Each row executes its expert map and receives its route weight exactly once. Scatter-add restores the three token rows; unweighted addition produces a different token-0 result.</figcaption>
</figure>

Appending packed outputs would return five assignment rows in order `[1, 2, 0, 0, 2]`, rather than three token rows. Overwriting a token's destination would lose its other selected expert; summing without gate weights computes a different function. The assertion checks that grouping and weighted accumulation preserve the original per-token sum. Shared-expert and residual paths would be added separately. A real runtime may fuse weighting into expert execution, so verify that it happens exactly once, wherever implemented.[^shazeer2017][^megatron2026moe]

Benchmark slices instead of memorizing a crossover:

| Measurement slice | What it exposes |
|---|---|
| One decode token per step | Small expert matrices and fixed routing/dispatch overhead |
| Moderate and large batches | How much grouped expert execution amortizes that overhead |
| Local versus remote expert routes | Cost of expert placement and all-to-all traffic |
| Strong versus weak interconnect | Whether network bandwidth changes the winner |

Exact outcomes depend on kernels, expert placement, interconnect, and request mix. MoE adds router computation, expert selection, token grouping, and sometimes all-to-all communication. Batching can amortize that overhead, but only measurements on the target system determine whether MoE wins latency or throughput.

Any real latency or throughput claim must record accelerator and software versions, request shape and batch concurrency, precision and kernel paths, a matched dense baseline, and output correctness checks beside the metrics. Once those runs are collected, a serving gate evaluates quality, tail latency, and throughput requirements jointly:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="measured-serving-gate.py"
import numpy as np

# Metrics order: [quality, p95_latency_ms, tokens_per_second].
dense = np.array([0.82, 48.0, 820.0])
moe = np.array([0.83, 55.0, 1100.0])
checks = np.array([
    moe[0] >= 0.82,
    moe[1] <= 60.0,
    moe[2] >= 1000.0,
])

print("moe throughput improvement:", f"{moe[2] / dense[2] - 1:.1%}")
print("moe p95 delta ms:", int(moe[1] - dense[1]))
print("candidate approved:", bool(checks.all()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
moe throughput improvement: 34.1%
moe p95 delta ms: 7
candidate approved: True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/serving_tradeoff_gate_dark.png" alt="Dense baseline achieves quality 0.82, p95 latency 48 ms, and throughput 820 tokens/s; MoE candidate reaches quality 0.83, p95 latency 55 ms (+7 ms), and throughput 1100 tokens/s (+34.1%). Against requirements of quality at least 0.82 and throughput at least 1000 tokens/s, MoE passes under a 60 ms p95 cap and fails if latency is tightened to 50 ms." />
  <figcaption>MoE beats dense throughput by 34.1% and passes quality >= 0.82, p95 latency <= 60 ms, and throughput >= 1000 tokens/s. Tightening only the latency budget to 50 ms rejects the same candidate despite its throughput gain.</figcaption>
</figure>

```checkpoint
Why can dense models beat MoE on single-request latency even when MoE has fewer active parameters?
---
MoE adds router work, token grouping, expert dispatch, and often all-to-all communication. With batch size 1, that overhead may dominate. Larger batches amortize it across many routed tokens.
```

The serving measurements expose the real tradeoff. Now turn them into a deployment choice instead of inferring a winner from active-parameter counts.

## When MoE is worth the complexity

Test MoE when more stored capacity may improve quality at a similar active arithmetic budget. Keep a dense baseline, especially with small decode batches, weak interconnect, or a tight weight-memory budget. Those conditions motivate a comparison; they don't determine the winner before measurement.

| Decision signal | Dense is likely better | MoE is worth testing |
|---|---|---|
| Traffic shape | Low batch size, strict <span data-glossary="p95-latency">p95 latency</span> | Large batches or offline throughput |
| Memory budget | One model must fit on a small fixed GPU set | Full checkpoint can be sharded, quantized, or offloaded |
| Network | All-to-all traffic already saturates links | Fast interconnect and device-aware routing are available |
| Quality target | Dense baseline already meets requirements | Extra capacity may improve harder tasks |
| Serving stack | Kernels lack grouped expert execution | Runtime supports routing, dispatch, combine, and expert placement |
| Observability | No routing, overflow, or per-expert metrics | You can inspect load balance, capacity, drops, and communication |

Don't stop at "this model activates fewer parameters." Ask whether the target workload still gains quality or throughput after full weight residency, routing overhead, interconnect cost, and operational visibility.

```checkpoint
What is the fastest practical dense-vs-MoE check?
---
Compare dense and MoE on the real serving regime. Require quality to meet the bar, p95 latency to fit the product budget, throughput to justify the extra routing machinery, and memory residency to fit the deployment plan.
```

## Diagnose the failure before changing the router

### The 7B-active model doesn't fit a 14 GB budget

Return to the 19B-total, 7B-active memory budget. Two bytes per stored weight give 38 GB of raw payload, even though one token selects only 7B parameters. If you budgeted 14 GB from the active count, the missing expert pool is already enough to invalidate the plan. Actual <span data-glossary="vram">VRAM</span> also includes cache, scales, replicas, workspace, and allocator effects.

An out-of-memory error can occur during loading, a long prefill, or concurrent decode. Inspect the artifact and phase-specific memory to find the cause. Quantizing weights, sharding experts, and shortening retained context change different terms; a cache change cannot shrink the checkpoint.

### Uniform counts, worse answers

A uniform long-run histogram can coexist with bursty per-step overflow, uneven device work, unhelpful expert functions, or a precision regression. Diagnose the cause from layer/rank assignment counts, executed contributions, overflow policy, and quality on the same cases. Separate training balance from serving placement and z-loss from either one.

If token coverage changed under expert choice, check which tokens lost every contribution. If capacity is fixed, check whether a partial top-2 route was dropped or renormalized. If ownership changed, inspect destination fan-out and per-rank work before modifying learned scores. A replicated expert can move work between ranks while preserving its learned function; rerouting to a different expert cannot assume that equivalence.

### Faster throughput, slower interactive answers

The serving gate above approves 1,100 tokens/s and a 55 ms p95 against its 60 ms budget, then rejects the same candidate when the cap tightens to 50 ms despite the 34.1% throughput gain. On a real stack, distinguish one decode token from a long prefill, hold the request mix and quality requirement fixed, and measure delivery gaps, network waits, expert matrix shapes, and SLO-qualified capacity.

Finally, don't name a hot expert "the math expert" from one prompt. Mixtral's specified routing analysis found similar assignments across several domains and stronger syntax/locality patterns, including indentation and `self`.[^jiang2024] A claimed specialty needs targeted routing and intervention evidence. Sparse arithmetic, useful capacity, and a story about specialization are different claims to investigate.

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
    "explanation": "The prefix has two available tokens, so both are selected. The extended scores rank c=0.9, a=0.8, d=0.7, b=0.6; the two-slot bucket selects c and a. Token b loses its contribution through a future-dependent routing decision. A causal attention mask does not constrain this separate bucket comparison. An autoregressive policy needs prefix-consistent routing, verified against incremental execution."
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
    "explanation": "Quality 0.86 meets 0.85, and 1300 tokens/s meets 1200. Latency 64 ms exceeds 60 ms, so this candidate fails the full serving gate."
  }
]
```

<!-- leetllm: audience:website:start -->> **Next:** Continue to [Mamba & State Space Models](/learn/state-space-models-mamba-alternatives). MoE sparsifies the feed-forward path, but most of these models still mix tokens with attention, so KV-cache growth remains a long-context cost. The next chapter compares selective state-space processing with attention, including why some production MoE backbones already interleave a linear-time mixer.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->> MoE sparsifies the feed-forward path, but models that use attention still incur KV-cache growth as context grows. Some production MoE backbones interleave attention with a linear-time state-space mixer. The online companion's [Mamba & State Space Models](/learn/state-space-models-mamba-alternatives) chapter compares selective state-space processing with attention.<!-- leetllm: audience:book:end -->
