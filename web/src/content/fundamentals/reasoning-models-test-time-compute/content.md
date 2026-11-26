---
{
  "id": "reasoning-models-test-time-compute",
  "title": "Reasoning & Test-Time Compute",
  "slug": "reasoning-models-test-time-compute",
  "section": "Training, Fine-Tuning & Alignment",
  "category": "Reasoning & Scaling",
  "difficulty": "Hard",
  "order": 14,
  "coverImage": "illustrations/_generated/test_time_compute_dark.png",
  "companies": [
    "OpenAI",
    "Google DeepMind",
    "Anthropic",
    "Meta",
    "DeepSeek"
  ],
  "shortDescription": "How reasoning models trade inference tokens for accuracy via chain-of-thought, Best-of-N, sequential revision, and PRM tree search alongside KV cache and latency limits.",
  "keyConceptsTested": [
    "Test-time compute scaling vs. train-time scaling (Snell et al.)",
    "Extended chain-of-thought, overthinking, and hidden reasoning budgets",
    "Best-of-N sampling: pass@1 vs. pass@k, Maj@k, and Goodhart over-optimization",
    "Sequential revision with verifier feedback and early stopping",
    "Tree search (beam search, MCTS, lookahead) and PRM step aggregation",
    "Process reward models (PRMs) vs. outcome reward models (ORMs)",
    "Difficulty-aware compute-optimal routing, prefix-shared KV caching, and visible TTFT"
  ],
  "prerequisites": [
    "state-space-models-mamba-alternatives",
    "mixture-of-experts-architecture"
  ],
  "relatedQuestions": [
    "llm-deployment-gpu-serving-autoscaling",
    "design-reasoning-agent-test-time-compute",
    "llm-cost-engineering-token-economics",
    "llm-as-judge-automated-evaluation",
    "reward-modeling-from-preference-data"
  ]
}
---

Ask a language model for all integer solutions to $(x^2 - 7x + 11)^{x^2 - 13x + 42} = 1$. Under single-pass greedy decoding, the model gets one forward pass per <span data-glossary="token">token</span> to jump straight to the answer. Because $a^b = 1$ splits into three regimes ($a = 1$, $a = -1$ with even $b$, and $b = 0$ with $a \ne 0$), a single pass often returns $\{2, 5, 6, 7\}$ and misses the negative-base roots $\{3, 4\}$. Allowing intermediate derivations, parallel rollouts, verification, or tree search turns fixed-depth recall into an explicit search computation.

This is <span data-glossary="test-time-compute">test-time compute</span> scaling: trading inference tokens and verifier calls under frozen weights for higher accuracy. Strategies span single-pass decoding to flat Best-of-$N$ (scoring $N$ full candidates over a shared prompt prefix) to step-level <span data-glossary="beam-search">beam search</span> guided by a <span data-glossary="process-reward-model">process reward model (PRM)</span>, while expanding KV caches, delaying visible text behind hidden thought, and multiplying output bills.

## Two axes of compute scaling

Pretraining scaling laws [^kaplan2020] tie loss to parameters $N$, tokens $D$, and train compute $C_{\text{train}} \approx 6ND$, yet standard decoding spends constant FLOPs per token regardless of task hardness. Test-time compute adds an orthogonal axis that adapts search effort per prompt:

$$
\text{Accuracy}(x) = f\!\left(C_{\text{train}},\; C_{\text{inference}}(x),\; \text{difficulty}(x)\right)
$$

Snell et al. [^snell2024] showed on `MATH` [^hendrycks2021] that a 14x smaller model with adaptive test-time search matches or beats a much larger single-pass model at equal FLOPs. OpenAI o1 [^openai_learning_reasoning_2024] confirmed smooth `AIME` gains from both RL training compute and inference search compute.

<figure>
  <img src="./illustrations/_generated/test_time_compute_dark.png" alt="Test-time compute scaling from 1x to 64x FLOPs showing PRM tree search on a 14x smaller model overtaking a large single-pass baseline." />
  <figcaption>Small models with test-time search overtake larger single-pass baselines as search compute grows, with PRM search beating flat Best-of-N on hard problems.</figcaption>
</figure>

## Chain-of-thought scaling and hidden reasoning budgets

<span data-glossary="chain-of-thought">Chain-of-thought (CoT)</span> [^wei2022a] converts extra token positions into working memory. RL-trained reasoning models such as o1 [^openai_learning_reasoning_2024] and DeepSeek-R1 [^deepseekai2025] self-check and backtrack, yet longer traces are not universally better: overthinking [^chen2025limitingconfidence] [^ghosal2025overthinking] and inverse-scaling studies [^anthropic2025inversescaling] show excess thinking on easy prompts can overturn correct initial answers.

| Technique | Core Mechanism | Best Fit | Principal Failure Mode |
| :--- | :--- | :--- | :--- |
| **Extended CoT** | One self-correcting trace | Multi-step synthesis and logic | Overthinking easy tasks; output cutoff |
| **Best-of-N** | Sample $N$ full paths, vote/rerank | Verifiable code and math | Proxy reward hacking; wasted easy-prompt work |
| **Sequential Revision** | Critique and edit drafts in rounds | Test-guided code repair | Unverified self-edits drifting off truth |
| **PRM Tree Search** | Score partial prefixes and prune | Deep symbolic proofs | False pruning from noisy step scorers |

Across OpenAI (`reasoning.effort` + `max_output_tokens`) [^openai2026reasoning], Gemini (`thinking_budget`) [^gemini2025thinking], and Claude extended thinking (`budget_tokens`) [^anthropic2025extendedthinking], hidden reasoning tokens bill as output and share `max_output_tokens` (so a tight 2,000-token cap can finish inside hidden reasoning with zero visible text), yet are dropped from Turn 2 prompt history so multi-turn context grows only with prompts and visible replies.

## Best-of-N sampling: coverage vs. selection

Best-of-$N$ draws $N$ independent trajectories at nonzero temperature and selects one winner. Having a right answer in the pool (`coverage`) and picking it (`selection`) are distinct problems. At single-sample success rate $p$, coverage is $1 - (1 - p)^N$. From $M \ge k$ samples with $c$ correct solutions, the unbiased `pass@k` estimator is:

$$
\text{pass@}k = 1 - \frac{\binom{M - c}{k}}{\binom{M}{k}}
$$

Easy prompts saturate fast ($p = 0.60$ hits $97.4\%$ at $N = 4$), whereas hard prompts ($p = 0.05$) need $N = 64$ to reach $96.2\%$, showing why uniform $N$ wastes compute.

<figure>
  <img src="./illustrations/_generated/best_of_n_returns_dark.png" alt="Coverage pass@N from N=1 to 64 for p=0.60, 0.25, and 0.05 showing rapid saturation on easy prompts and steady climb on hard ones." />
  <figcaption>Marginal coverage gains shrink near saturation, shifting optimal N sharply with prompt difficulty.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy,scipy, id=pass-at-k-numpy -->
```python title="pass-at-k-numpy.py"
import numpy as np
from scipy.special import comb

n_values = np.array([1, 2, 4, 8, 16, 32, 64])
for p in [0.60, 0.25, 0.05]:
    print(f"p={p:.2f} -> coverage@N:", np.round(1.0 - (1.0 - p) ** n_values, 3).tolist())

M, c_counts = 32, np.array([28, 14, 5, 2, 0])
for k in [1, 4, 8]:
    print(f"Batch mean unbiased pass@{k}: {(1.0 - comb(M - c_counts, k) / comb(M, k)).mean():.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
p=0.60 -> coverage@N: [0.6, 0.84, 0.974, 0.999, 1.0, 1.0, 1.0]
p=0.25 -> coverage@N: [0.25, 0.438, 0.684, 0.9, 0.99, 1.0, 1.0]
p=0.05 -> coverage@N: [0.05, 0.098, 0.185, 0.337, 0.56, 0.806, 0.962]
Batch mean unbiased pass@1: 0.3063
Batch mean unbiased pass@4: 0.5329
Batch mean unbiased pass@8: 0.6457
```
<!-- leetllm: output:end -->

### Maj@k, weighted voting, and Goodhart over-optimization

Without an exact unit test or symbolic checker, pipelines pick winners via majority voting (`Maj@k`), verifier-weighted voting (summing verifier scores per equivalent final answer), or `argmax` over a reward model:

- **`Maj@k` (self-consistency)** works only when the right answer is the plurality mode; a systematic misconception occurring >50% of the time drives `Maj@k` to 0% as $N$ grows.
- **Weighted voting** dampens outlier hallucinations by combining verifier confidence with answer consensus.
- **Noisy proxy `argmax` (Goodhart decay):** under $\hat{R}(x, y) = R_{\text{true}}(x, y) + \epsilon$, extreme noise $\max_i \epsilon_i \propto \sqrt{\log N}$ eventually lets confident wrong traces win. Below, oracle coverage reaches `1.000` and max proxy score climbs to `1.090`, yet true accuracy peaks at `N = 8` (`0.570`) before collapsing to `0.335` at `N = 64`.

<figure>
  <img src="./illustrations/_generated/selector_overoptimization_dark.png" alt="Goodhart over-optimization from N=1 to 64: noisy proxy score rises monotonically while true solve rate peaks near N=8 and drops." />
  <figcaption>Under a noisy proxy verifier, selected score climbs with N while true accuracy peaks and turns downward once outlier errors win.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, id=goodhart-best-of-n -->
```python title="goodhart-best-of-n.py"
import numpy as np

rng = np.random.default_rng(7)
n_prompts, max_n = 2000, 64
is_correct = rng.random((n_prompts, max_n)) < 0.35
proxy = np.where(is_correct, rng.normal(0.72, 0.14, (n_prompts, max_n)), rng.normal(0.45, 0.28, (n_prompts, max_n)))

for N in [1, 2, 4, 8, 16, 32, 64]:
    sub_corr, sub_score = is_correct[:, :N], proxy[:, :N]
    picked = sub_corr[np.arange(n_prompts), np.argmax(sub_score, axis=1)]
    print(f"N={N:2d} | oracle_cov={sub_corr.any(axis=1).mean():.3f} | max_proxy={sub_score.max(axis=1).mean():.3f} | true_acc={picked.mean():.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
N= 1 | oracle_cov=0.364 | max_proxy=0.556 | true_acc=0.364
N= 2 | oracle_cov=0.591 | max_proxy=0.700 | true_acc=0.495
N= 4 | oracle_cov=0.810 | max_proxy=0.805 | true_acc=0.569
N= 8 | oracle_cov=0.965 | max_proxy=0.892 | true_acc=0.570
N=16 | oracle_cov=0.999 | max_proxy=0.963 | true_acc=0.521
N=32 | oracle_cov=1.000 | max_proxy=1.027 | true_acc=0.429
N=64 | oracle_cov=1.000 | max_proxy=1.090 | true_acc=0.335
```
<!-- leetllm: output:end -->

Do not equate `pass@1` gains with `pass@k` exploration [^setlur2025verification]. Because $1 - (1 - p_i)^k$ is concave in $p_i$, sharpening easy prompts ($0.70 \to 0.90$) while collapsing hard tails ($0.20 \to 0.05$) lifts mean `pass@1` (`0.450 -> 0.475`) while slashing true `pass@4` (`0.791 -> 0.593`). Always compute `1 - (1 - p_i)^k` per prompt before averaging.

## Sequential revision and tree search

### Sequential revision

Sequential revision conditions round $t$ on draft $t - 1$ plus verifier feedback or compiler tracebacks. With external tests, accuracy jumps across rounds `t1` to `t3` before plateauing; unverified self-edits drift downward past `t2`. Stop once marginal gain drops below $\tau$ and retain the highest-verified draft.

### Tree search: beam search, MCTS, and lookahead

Step-level tree search branches after intermediate steps ($s_1, \dots, s_t$) instead of waiting until completion to discard broken traces:

- **PRM beam search** expands each active prefix into $M$ next steps, scores them with a PRM, and retains the top-$B$ beams. Solving $(x^2 - 7x + 11)^{x^2 - 13x + 42} = 1$ at $B = 2$ keeps both $a = 1$ (`0.91`) and $a = -1$ (`0.89`) alive to recover all six roots $\{2, 3, 4, 5, 6, 7\}$, pruning incomplete paths (`0.24`) at step 2.
- **Lookahead search** rolls candidate steps $k$ steps forward before scoring, reducing greedy myopia at higher compute cost.
- **<span data-glossary="monte-carlo-tree-search">Monte Carlo tree search (MCTS)</span>** balances exploration and exploitation via UCB/PUCT selection and value backpropagation, thriving on deep trees with exact terminal checks at the cost of sequential latency.

<figure>
  <img src="./illustrations/_generated/deliberation_search_dark.png" alt="PRM beam search tree (B=2) keeping a=1 and a=-1 branches alive (0.91, 0.89) while pruning the omitted-branch path (0.24) at step 2." />
  <figcaption>Step-level beam search prunes the omitted-branch trace at step 2 before wasting decode compute on an incomplete root set.</figcaption>
</figure>

Aggregating step scores via $\min_{i \le t} r_i$ or $\prod_{i=1}^t r_i$ creates a monotone upper bound for exact branch-and-bound pruning, but permanently penalizes temporary early uncertainty. Snell et al. [^snell2024] showed that **last-step PRM scoring** ($r_t$ alone) beats `min` and `prod` because $r_t$ summarizes completion probability from the whole prefix $s_{1:t}$. Below, a compact PyTorch PRM preserves a recovered trajectory (`last=0.999`) that `min` caps at `0.321`:

<!-- leetllm: test, output=show, deps=torch, id=torch-prm-beam-search -->
```python title="torch-prm-beam-search.py"
import torch
import torch.nn as nn

torch.manual_seed(42)


class StepPRM(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(nn.Linear(4, 8), nn.Tanh(), nn.Linear(8, 1), nn.Sigmoid())
        with torch.no_grad():
            self.net[0].weight.copy_(torch.tensor([
                [1.4, 1.2, -1.6, -1.8], [0.9, 1.1, -1.2, -1.4],
                [-1.1, -0.9, 1.5, 1.6], [0.8, 0.7, -0.8, -1.0],
                [1.0, 0.5, -1.1, -1.2], [0.4, 1.3, -0.9, -1.5],
                [-0.6, -0.8, 1.2, 1.1], [0.7, 0.9, -0.7, -0.9],
            ]))
            self.net[0].bias.zero_()
            self.net[2].weight.copy_(torch.tensor([[1.1, 0.9, -1.2, 0.7, 0.8, 1.0, -0.9, 0.7]]))
            self.net[2].bias.fill_(-0.2)

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.net(features).squeeze(-1)


prm = StepPRM().eval()
paths = {
    "a=1 & a=-1 (even b)": torch.tensor([[0.8, 0.9, 0.1, 0.0], [1.0, 1.0, 0.0, 0.0]]),
    "a=1 & b=0 (skip a=-1)": torch.tensor([[0.8, 0.2, 0.1, 0.8], [0.7, 0.1, 0.0, 0.9]]),
    "uncertain split -> recovered": torch.tensor([[0.3, 0.4, 0.5, 0.1], [1.0, 1.0, 0.0, 0.0]]),
}

with torch.no_grad():
    for label, feats in paths.items():
        scores = prm(feats)
        print(f"{label:28s} | last={scores[-1]:.3f} | min={scores.min():.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
a=1 & a=-1 (even b)          | last=0.999 | min=0.998
a=1 & b=0 (skip a=-1)        | last=0.029 | min=0.029
uncertain split -> recovered | last=0.999 | min=0.321
```
<!-- leetllm: output:end -->

## PRM vs. ORM verification tradeoffs

An **Outcome Reward Model (ORM)** scores only the finished answer $R_{\text{ORM}}(x, y) \in [0, 1]$. ORMs are cheap to supervise from final answers or tests, but give sparse terminal credit: a sign error at step 4 of an 8-step proof triggers one low score at step 8 with zero localization.

A **Process Reward Model (PRM)** scores every prefix $R_{\text{PRM}}(x, s_{1:t}) \in [0, 1]$. Instead of costly human step annotations like `PRM800K` [^lightman2023], automated systems like Math-Shepherd [^wang2023d] define PRM targets via **Monte Carlo rollout recoverability**, estimating the fraction of $K$ completions from $(x, s_{1:t})$ that reach a verified final answer:

$$
V(s_{1:t}) = P(\text{final answer correct} \mid x, s_{1:t}) \approx \frac{1}{K} \sum_{j=1}^{K} \mathbb{I}\!\left[\text{verify}\!\left(x, s_{1:t}, y^{(j)}_{>t}\right)\right]
$$

Notice that a Monte Carlo PRM measures *completion recoverability* rather than strictly local step truth: if a generator self-corrects an earlier slip on 2 of 5 continuations, $V = 0.40$, whereas an unrecoverable error yields $V = 0.00$.

<figure>
  <img src="./illustrations/_generated/reward_model_comparison_dark.png" alt="ORM vs PRM heatmap across steps S1 to S8: ORM scores only S8 (0.12) while PRM drops immediately from 0.90 to 0.15 at error step S4." />
  <figcaption>Sparse terminal ORM scoring assigns credit only at step S8, whereas a PRM flags the exact step S4 where recoverability collapses.</figcaption>
</figure>

Early PRM pruning cuts wasted decode work (~30% or more on failed branches), at two costs: generating $K$ rollouts per prefix makes training data expensive, and noisy small-$K$ labels can falsely prune valid unconventional derivations.

## Training models to reason with RLVR

Rather than relying purely on external search, models can internalize reflection, checking, and backtracking directly via **Reinforcement Learning with Verifiable Rewards (RLVR)**, as in DeepSeek-R1-Zero and the four-stage DeepSeek-R1 pipeline (cold-start SFT, verifiable GRPO, rejection-sampled SFT on fresh `V3-Base` weights, and broad RL).[^deepseekai2025] As developed in [RLVR & Verifiable Rewards Training](/learn/rlvr-verifiable-rewards-training), GRPO computes group-relative advantages directly from verifiable outcomes without a separate critic network.

## Compute-optimal test-time scaling and routing

Snell et al. [^snell2024] frame **compute-optimal scaling** as allocating both strategy and FLOPs by estimated prompt difficulty $\hat{d}(x)$, balancing pretraining parameters against inference search:

- **Easy prompts:** single-pass decoding or light revision; extra search wastes latency and invites overthinking.
- **Medium prompts:** sequential revision or moderate Best-of-$N$ ($N = 4$ to $8$) yields steep accuracy gains per FLOP.
- **Hard prompts ($p \ll 0.1$):** PRM beam search or deep CoT outperforms flat Best-of-$N$ and lets smaller models overtake larger single-pass models; on the hardest prompts where base coverage nears zero, pretraining a stronger base model still wins.

In serving, a difficulty router applies accuracy and p95 latency cutoffs first, then picks the lowest-cost feasible tier on the Pareto frontier (for example, routing easy prompts to single-pass at `0.2 s`, medium to revision at `3.8 s`, and only hard prompts to deep PRM search at `11.5 s`):

<figure>
  <img src="./illustrations/_generated/routing_feasible_set_dark.png" alt="Quadrant chart of p95 latency vs solve accuracy showing single-pass and low Bo4 below quality, deep PRM above latency, and medium revision inside the feasible Pareto region." />
  <figcaption>A difficulty router applies latency and accuracy cutoffs first, isolating the Pareto-optimal tier inside the feasible upper-left region.</figcaption>
</figure>

## Serving geometry: KV sharing, visible TTFT, and distillation

### Prefix-shared KV caching and visible TTFT

Each cached token position in a transformer with $L$ layers, $H_{\text{kv}}$ KV heads, head dimension $d_{\text{head}}$, and $b$ bytes per scalar occupies $2 L H_{\text{kv}} d_{\text{head}} b$ bytes (`128 KiB/token` for 32 layers, 8 KV heads, $d_{\text{head}} = 128$, FP16). Across $N = 8$ parallel branches on a $4,096$-token prompt with $1,024$-token tails, unshared caches use `5.00 GiB`, whereas copy-on-write prefix sharing via <span data-glossary="pagedattention">PagedAttention</span> [^kwon2023pagedattention] or `RadixAttention` [^sglang2024v04] keeps one prompt block plus eight tails (`1.50 GiB`, saving `70%`).

<figure>
  <img src="./illustrations/_generated/branch_cache_geometry_dark.png" alt="Unshared N=8 branches duplicate 4,096-token prompts (5.0 GiB), while prefix sharing stores one read-only prompt plus 8 private tails (1.5 GiB, 70% savings)." />
  <figcaption>Sharing read-only prompt KV pages across parallel branches cuts cache footprint by 70% while isolating private tails.</figcaption>
</figure>

Hidden thinking tokens decode autoregressively before the first visible token arrives:

$$
\text{TTFT}_{\text{visible}} \approx t_{\text{prefill}}(P) + H \cdot t_{\text{decode}}
$$

At `80 tokens/s`, $H = 1,024$ hidden tokens delay visible output to `13.0 s` (`200 ms` prefill plus `12.8 s` hidden decode), capping hidden thought at `224` tokens under a `3,000 ms` TTFT budget. Because hidden tokens bill at output rates, 2,700 hidden plus 300 visible tokens cost 10x a direct answer.

<!-- leetllm: test, output=show, deps=numpy, id=kv-prefix-and-ttft -->
```python title="kv-prefix-and-ttft.py"
import numpy as np

bytes_per_tok = 2 * 32 * 8 * 128 * 2
prompt_tok, branch_tok, n_branches = 4096, 1024, 8

unshared_gib = n_branches * (prompt_tok + branch_tok) * bytes_per_tok / (1024 ** 3)
shared_gib = (prompt_tok + n_branches * branch_tok) * bytes_per_tok / (1024 ** 3)
max_hidden_tok = int((3000.0 - 200.0) * 80.0 / 1000.0)

print(f"KV footprint: unshared={unshared_gib:.2f} GiB vs shared={shared_gib:.2f} GiB (concurrency={int(24.0 // shared_gib)} in 24 GiB)")
print(f"Max hidden CoT under 3000 ms visible TTFT at 80 tok/s: {max_hidden_tok} tokens")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
KV footprint: unshared=5.00 GiB vs shared=1.50 GiB (concurrency=16 in 24 GiB)
Max hidden CoT under 3000 ms visible TTFT at 80 tok/s: 224 tokens
```
<!-- leetllm: output:end -->

### Distillation into compact models

Supervised <span data-glossary="teacher-student-distillation">distillation</span> on verified traces from a large reasoning teacher transfers structured backtracking into compact dense students without online RL.[^deepseekai2025] On `AIME 2024`, distilled Qwen models reach `28.9%` (`1.5B`), `55.5%` (`7B`), and `72.6%` (`32B`) versus `79.8%` for `671B` `DeepSeek-R1`. Because trace-only distillation imitates accepted paths without conferring an external verifier, distilled students still benefit from domain verifiers at runtime.

## Mastery Quiz

```mastery-quiz
[
  {
    "question": "Two equally weighted prompts have single-sample solve rates [0.98, 0.08] before post-training and [0.95, 0.10] afterward. Across 3 independent attempts, how do mean pass@1 and mean pass@3 change?",
    "options": [
      "pass@1 drops by 0.005000, pass@3 drops by 0.003349",
      "pass@1 drops by 0.010000, pass@3 drops by 0.003349",
      "pass@1 drops by 0.010000, pass@3 rises by 0.024786",
      "pass@1 drops by 0.005000, pass@3 rises by 0.024786"
    ],
    "answer": "pass@1 drops by 0.005000, pass@3 rises by 0.024786",
    "explanation": "Mean pass@1 shifts from 0.530 to 0.525 (-0.005000). Per-prompt pass@3 rises from 1 - (0.02^3 + 0.92^3)/2 = 0.610652 to 1 - (0.05^3 + 0.90^3)/2 = 0.635438 (+0.024786)."
  },
  {
    "question": "An intermediate step writes 8 * 9 = 70. Five rollouts from Policy A finish at [70, 71, 70, 71, 71], while five from Policy B self-correct to [72, 71, 72, 71, 71]. Against exact answer 72, what are local validity and each policy's rollout PRM score?",
    "options": [
      "Invalid step, Policy A = 0.00, Policy B = 0.40",
      "Valid step, Policy A = 0.40, Policy B = 0.00",
      "Valid step, Policy A = 0.00, Policy B = 0.40",
      "Invalid step, Policy A = 0.40, Policy B = 0.00"
    ],
    "answer": "Invalid step, Policy A = 0.00, Policy B = 0.40",
    "explanation": "Locally 8 * 9 = 70 is false. Rollout PRM scores measure completion recoverability: Policy A recovers 0/5 (0.00) and Policy B recovers 2/5 (0.40)."
  },
  {
    "question": "A beam frontier holds a finished answer scoring 0.81 and an active prefix at 0.79 (later steps can score up to 1.00). Compare prefix minimum P against last-step scoring L: which guarantees the active prefix cannot beat 0.81?",
    "options": [
      "P: cannot beat 0.81; L: cannot beat 0.81",
      "P: can still beat 0.81; L: cannot beat 0.81",
      "P: cannot beat 0.81; L: can still beat 0.81",
      "P: can still beat 0.81; L: can still beat 0.81"
    ],
    "answer": "P: cannot beat 0.81; L: can still beat 0.81",
    "explanation": "Prefix minimum P is non-increasing, so it can never exceed 0.79. Under last-step scoring L, a later recovery step can exceed 0.81."
  },
  {
    "question": "With 150 ms prefill, 100 tokens/s decode speed, and a 2,000 ms visible TTFT budget, how do 200 vs. 180 hidden reasoning tokens behave?",
    "options": [
      "200 tokens: 2,150 ms (over); 180 tokens: 2,150 ms (over)",
      "200 tokens: 2,000 ms (fits); 180 tokens: 1,800 ms (fits)",
      "200 tokens: 2,150 ms (over); 180 tokens: 1,950 ms (fits)",
      "200 tokens: 2,000 ms (fits); 180 tokens: 1,950 ms (fits)"
    ],
    "answer": "200 tokens: 2,150 ms (over); 180 tokens: 1,950 ms (fits)",
    "explanation": "Visible TTFT = 150 + 1000 * H / 100: 200 tokens take 2,150 ms (over budget), while 180 tokens take 1,950 ms and fit."
  },
  {
    "question": "Why does Best-of-N with a learned reward model eventually degrade true accuracy as N grows large?",
    "options": [
      "Sampling more candidates forces the model to switch to greedy decoding.",
      "Maximizing an imperfect proxy verifier over many samples selects outputs that exploit reward-model blind spots (Goodhart over-optimization).",
      "KV-cache prefix sharing fails once N exceeds 8 parallel samples.",
      "Majority voting always converges to lower accuracy than a single sample."
    ],
    "answer": "Maximizing an imperfect proxy verifier over many samples selects outputs that exploit reward-model blind spots (Goodhart over-optimization).",
    "explanation": "As N increases, argmax over a learned verifier increasingly picks outliers where the proxy overestimates quality relative to true correctness."
  }
]
```

> **Next:** Continue to [Knowledge Distillation for LLMs](/learn/knowledge-distillation-llms).
