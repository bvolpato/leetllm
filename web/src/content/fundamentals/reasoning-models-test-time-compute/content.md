---
{
  "id": "reasoning-models-test-time-compute",
  "title": "Reasoning & Test-Time Compute",
  "slug": "reasoning-models-test-time-compute",
  "section": "Inference & Production Scale",
  "category": "Reasoning & Scaling",
  "difficulty": "Hard",
  "order": 25,
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
    "Test-time compute scaling vs. train-time scaling",
    "Extended chain-of-thought, Best-of-N sampling, and sequential revision",
    "Process reward models (PRMs) vs. outcome reward models (ORMs)",
    "Majority voting, Goodhart over-optimization, and pass@k vs. pass@1",
    "Group Relative Policy Optimization (GRPO) and DeepSeek-R1 training stages",
    "Difficulty-aware inference routing under latency and accuracy constraints",
    "Prefix-shared KV caching and hidden reasoning time-to-first-token"
  ],
  "prerequisites": [
    "state-space-models-mamba-alternatives",
    "mixture-of-experts-architecture",
    "kv-cache-paged-attention-llm-serving",
    "prefix-caching-prompt-caching",
    "continuous-batching-request-scheduling",
    "scaling-llm-inference-batching-kv-cache"
  ],
  "relatedQuestions": [
    "advanced-mlops-devops-ai",
    "llm-deployment-gpu-serving-autoscaling",
    "design-reasoning-agent-test-time-compute",
    "llm-cost-engineering-token-economics",
    "llm-as-judge-automated-evaluation",
    "reward-modeling-from-preference-data"
  ]
}
---

Consider asking a language model to find all integer solutions to $(x^2 - 7x + 11)^{x^2 - 13x + 42} = 1$. In single-pass greedy decoding, the model gets only one forward pass per emitted <span data-glossary="token">token</span> to map the prompt straight to an answer. Because $a^b = 1$ splits into three distinct algebraic regimes ($a = 1$, $a = -1$ with even $b$, and $b = 0$ with $a \ne 0$), an unguided single pass frequently captures $x \in \{2, 5, 6, 7\}$ while overlooking the negative-base roots $x \in \{3, 4\}$. Allowing the model to generate intermediate reasoning steps, sample multiple candidate derivations, verify candidate roots algebraically, or branch across a partial solution tree changes inference from fixed-depth pattern recall into an explicit search computation.

This shift defines <span data-glossary="test-time-compute">test-time compute</span> scaling: trading additional tokens and verifier evaluations during inference to solve problems that defeat greedy decoding under fixed model weights. Each strategy spends inference FLOPs differently, from flat parallel sampling (Best-of-N) to step-level <span data-glossary="beam-search">beam search</span> guided by a <span data-glossary="process-reward-model">process reward model (PRM)</span>. At the same time, extra reasoning tokens expand KV cache footprints across branches, delay visible tokens behind hidden thought generation, and amplify output billing, so practical systems must weigh accuracy gains directly against serving memory and latency budgets.

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/candidate_selection_audit_dark.png" alt="Diagram of three test-time inference regimes branching from one prompt: greedy single-pass decoding emits one fast sequence, Best-of-N shares the prompt prefix across N parallel candidates scored at the end, and PRM beam search scores and prunes intermediate reasoning steps." />
  <figcaption>The three inference regimes: single-pass decoding commits immediately, Best-of-N evaluates N complete candidates in parallel, and PRM tree search prunes weak intermediate paths mid-derivation.</figcaption>
</figure>

## The two axes of compute scaling

For years, scaling language model capability relied almost exclusively on pretraining compute. Kaplan et al. [^kaplan2020] showed that dense transformer validation loss follows smooth power laws across model parameters $N$, training tokens $D$, and compute budget $C_{\text{train}} \approx 6 N D$. Once training completes, however, standard decoding allocates virtually constant work per generated token regardless of problem hardness, running the same single forward pass per token across frozen weights $W$ for both trivia lookups and competition proofs. Test-time compute introduces a second orthogonal scaling axis by letting inference vary token counts, sample counts, and verification rounds dynamically per prompt:

$$
\text{Accuracy}(x) = f\!\left(C_{\text{train}},\; C_{\text{inference}}(x),\; \text{difficulty}(x)\right)
$$

Snell et al. [^snell2024] studied how these two axes trade off on the `MATH` benchmark [^hendrycks2021]. When prompts receive adaptive test-time search rather than a single sample, a 14x smaller model matches or exceeds a much larger pretrained model on challenging math problems, even when total inference FLOPs are matched fairly. OpenAI o1 [^openai_learning_reasoning_2024] demonstrated the complementary role of reinforcement learning over extended reasoning traces: accuracy on the `AIME` competition rises smoothly both with additional RL training compute and with more inference search compute from `consensus@64` to `rerank@1000`. In deployment, however, maximizing accuracy unconditionally violates interactive latency limits, so serving systems first filter candidate search configurations against p95 latency and quality thresholds before picking the top performer on the Pareto frontier.

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/test_time_compute_dark.png" alt="Line chart comparing test-time compute scaling across inference multipliers (1x to 64x FLOPs). PRM-guided tree search on a 14x smaller base model overtakes a large single-pass model baseline as search compute increases." />
  <figcaption>Small models equipped with test-time search overtake larger single-pass models once search compute grows, with PRM-guided search outperforming flat Best-of-N sampling on hard benchmarks.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, id=pareto-compute-frontier -->
```python title="pareto-compute-frontier.py"
import numpy as np

strategies = np.array(["greedy_1x", "cot_low", "best_of_4", "prm_beam_8", "prm_deep_32"])
mean_tokens = np.array([180, 650, 1450, 2900, 7400])
p95_latency_ms = np.array([220.0, 1150.0, 1950.0, 3800.0, 9600.0])
math_accuracy = np.array([0.44, 0.67, 0.75, 0.86, 0.91])

max_latency_ms = 4000.0
min_accuracy = 0.72

feasible = (p95_latency_ms <= max_latency_ms) & (math_accuracy >= min_accuracy)
idx = np.where(feasible)[0]
best_idx = idx[np.argmax(math_accuracy[idx])]

print("Feasible strategies:", strategies[idx].tolist())
print(f"Selected: {strategies[best_idx]} | acc={math_accuracy[best_idx]:.2f} | p95={p95_latency_ms[best_idx]:.0f} ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Feasible strategies: ['best_of_4', 'prm_beam_8']
Selected: prm_beam_8 | acc=0.86 | p95=3800 ms
```
<!-- leetllm: output:end -->

In the vectorized sweep above, `prm_deep_32` reaches `0.91` accuracy but violates the `4,000 ms` latency limit (`9,600 ms`). Meanwhile, `greedy_1x` and `cot_low` miss the `0.72` accuracy floor (`0.44` and `0.67`). Filtering on both constraints leaves `['best_of_4', 'prm_beam_8']`, and picking the top feasible solve rate selects `prm_beam_8` at `0.86` accuracy and `3,800 ms` p95 latency.

## How reasoning models work

A reasoning model turns extra sequence length into extra working memory. Instead of predicting an answer immediately after the prompt ends, it emits intermediate derivations, checks candidate hypotheses, and backtracks when a check fails before committing to the final answer. Modern reasoning systems combine three mechanisms: long <span data-glossary="chain-of-thought">chain-of-thought</span> traces, multi-branch deliberation with verification, and provider-managed hidden reasoning budgets.

### Extended chain-of-thought

Standard <span data-glossary="chain-of-thought">chain-of-thought (CoT)</span> prompting [^wei2022a] unlocks multi-step computation by giving fixed-depth transformer layers a scratchpad across token positions. Early prompted CoT trajectories rarely backtracked when an intermediate step went wrong, whereas reinforcement learning against verifiable outcomes teaches reasoning models such as OpenAI o1 [^openai_learning_reasoning_2024] and DeepSeek-R1 [^deepseekai2025] to question assumptions, test edge cases, and rewrite partial proofs before answering. Extending thought length is not strictly beneficial everywhere, however. Studies on reasoning overthinking [^chen2025limitingconfidence] [^ghosal2025overthinking] and Anthropic's inverse-scaling evaluations [^anthropic2025inversescaling] show that on straightforward questions or misleading distractors, longer thinking traces can talk a model out of an already correct initial answer or amplify spurious correlations.

### Deliberation and search at inference time

Single-trace CoT explores one sequential path at a time, leaving little recourse if an early token choice sends the derivation down an unproductive branch. When a problem contains multiple discrete paths, unit tests, or step-wise checks, inference pipelines convert additional compute into three structured deliberation strategies summarized below. Notice how each strategy trades parallelism, latency, and vulnerability to imperfect scoring signals differently depending on whether an exact checker exists.

| Technique | Core Mechanism | Best Fit | Principal Failure Mode |
| :--- | :--- | :--- | :--- |
| **Extended CoT** | One long self-correcting reasoning trace | Open-ended synthesis, multi-step logic | Overthinking easy tasks; token cutoff |
| **Best-of-N** | Sample $N$ full paths, vote or rerank | Verifiable code, competition math | Proxy reward hacking; wasted work on easy prompts |
| **Sequential Revision** | Critique and edit an existing draft step-by-step | Code repair with test tracebacks, writing | Unverified edits drifting away from truth |
| **PRM Tree Search** | Score partial prefixes and prune low branches | Deep symbolic proofs, constrained search | False pruning from noisy step scorers |

### Provider-reported hidden reasoning

Production APIs expose reasoning effort through explicit token or effort controls, and accounting for those internal tokens prevents silent truncation and unexpected billing spikes. Across OpenAI's reasoning endpoints (`reasoning.effort` plus `max_output_tokens`) [^openai2026reasoning], Google Gemini's `thinkingConfig` (`thinking_budget`) [^gemini2025thinking], and Anthropic Claude's extended thinking (`thinking: { type: "enabled", budget_tokens }`) [^anthropic2025extendedthinking], internal reasoning tokens share two operational properties. First, hidden reasoning tokens are generated inside the model's output stream and count toward both output pricing and the single-turn output token limit (`max_output_tokens`). Second, providers exclude raw hidden reasoning tokens from persistent multi-turn prompt history (using opaque encrypted state or signatures when continuity is supported), so turn-2 input context only retains user prompts and visible assistant text.

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/reasoning_usage_cutoff_dark.png" alt="Side-by-side bar charts of output token usage under a 2,000-token max_output_tokens limit. Left: a completed turn uses 920 hidden reasoning tokens and 360 visible tokens, leaving 720 unused. Right: an incomplete turn spends all 2,000 tokens on reasoning and emits 0 visible tokens." />
  <figcaption>A tight output limit can exhaust entirely inside hidden reasoning before the model emits a single visible token, returning status: incomplete with empty answer text.</figcaption>
</figure>

Because hidden reasoning competes directly with visible output under `max_output_tokens`, capping an interactive call too aggressively leaves zero headroom for the answer itself. Equally important, separating current-turn output billing from multi-turn context growth keeps cost models accurate across long agent loops, since Turn 2 only reloads the prompt plus Turn 1's visible reply. Tracking both metrics together across API responses prevents silent blank-output failures and surprise cost multiplication.

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/hidden_reasoning_budget_dark.png" alt="Comparison between current-turn billed output tokens and next-turn prompt history retention. Turn 1 bills 2,480 output tokens (1,920 hidden reasoning plus 560 visible answer), whereas Turn 2 carries 940 input tokens (380 Turn 1 prompt plus 560 visible answer) because hidden CoT is discarded." />
  <figcaption>Hidden reasoning tokens are billed as generated output on Turn 1, then omitted from Turn 2 prompt input tokens.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, id=hidden-token-accounting -->
```python title="hidden-token-accounting.py"
import numpy as np

records = [
    {"id": "turn_completed", "status": "completed", "in_tok": 380, "out_tok": 2480, "cot_tok": 1920, "out_cap": 4096},
    {"id": "turn_truncated", "status": "incomplete", "in_tok": 620, "out_tok": 2000, "cot_tok": 2000, "out_cap": 2000},
]

in_tok = np.array([r["in_tok"] for r in records])
out_tok = np.array([r["out_tok"] for r in records])
cot_tok = np.array([r["cot_tok"] for r in records])
vis_tok = out_tok - cot_tok

# Standard pricing ratio example: $2.50 / 1M input, $10.00 / 1M output
turn_cost = (in_tok * 2.50 + out_tok * 10.00) / 1e6
next_turn_prompt = in_tok + vis_tok

for i, r in enumerate(records):
    answer_ready = (r["status"] == "completed") and (vis_tok[i] > 0)
    print(f"{r['id']}: ready={answer_ready}, visible={vis_tok[i]}, next_in={next_turn_prompt[i]}, cost=${turn_cost[i]:.5f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
turn_completed: ready=True, visible=560, next_in=940, cost=$0.02575
turn_truncated: ready=False, visible=0, next_in=620, cost=$0.02155
```
<!-- leetllm: output:end -->

Every API consumer handling reasoning models should verify `status == "completed"` and `vis_tok > 0` before reading answer text. Notice how `turn_truncated` still incurs `$0.02155` for its 2,000 generated thinking tokens while emitting `0` visible tokens, whereas `turn_completed` carries only `940` tokens into Turn 2 despite generating `2,480` total output tokens. Treating incomplete cutoffs as retryable budget adjustments stops silent blank responses from corrupting agent state.

## Core test-time search techniques

Moving beyond a single reasoning trace requires deciding how candidates are generated, verified, or iteratively repaired. Three core algorithms form the foundation of modern test-time search: parallel Best-of-$N$ sampling, sequential revision, and step-level tree search. Each technique exploits a distinct property of problem structure, so understanding their quantitative scaling laws and failure modes clarifies when each earns its compute budget.

### 1. Best-of-N sampling

Best-of-$N$ sampling generates $N$ independent candidate responses from the same prompt at nonzero temperature and relies on a selector to pick or aggregate one winner. Crucially, generating a correct candidate in the pool (`coverage`) and identifying which candidate is right (`selection`) are separate statistical problems. When independent attempts solve a prompt with single-sample probability $p$, the chance that at least one of $N$ draws succeeds is $1 - (1 - p)^N$. In benchmark evaluation from $M \ge k$ sampled traces containing $c$ verified correct solutions, the unbiased `pass@k` estimator avoids naive plug-in bias by counting failure subsets without replacement:

$$
\text{pass@}k = 1 - \frac{\binom{M - c}{k}}{\binom{M}{k}}
$$

Coverage rises steeply at small $N$ on easy prompts and exhibits sharp diminishing returns once $1 - (1-p)^N$ nears saturation. On an easy prompt where $p = 0.60$, four samples already reach $97.4\%$ coverage (`1 - 0.40^4`), leaving almost no headroom for $N = 8$ through $N = 64$. By contrast, on a hard prompt where $p = 0.05$, reaching $96.2\%$ coverage requires $N = 64$ independent rollouts, which explains why uniform sampling budgets over-spend on easy queries and under-spend on hard ones.

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/best_of_n_returns_dark.png" alt="Line chart of pass@N coverage from N=1 to N=64 for single-sample success rates p=0.60, p=0.25, and p=0.05. Easy prompts saturate above 97% by N=4, medium prompts exceed 99% by N=16, and hard prompts climb steadily from 5% to 96.3%." />
  <figcaption>Marginal coverage gains shrink once a prompt nears saturation, shifting optimal N sharply with prompt difficulty.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy,scipy, id=pass-at-k-numpy -->
```python title="pass-at-k-numpy.py"
import numpy as np
from scipy.special import comb

n_values = np.array([1, 2, 4, 8, 16, 32, 64])
for p in [0.60, 0.25, 0.05]:
    cov = 1.0 - (1.0 - p) ** n_values
    print(f"p={p:.2f} -> coverage@N:", np.round(cov, 3).tolist())

# Unbiased finite-sample pass@k from M=32 samples per problem with c correct traces
M = 32
c_counts = np.array([28, 14, 5, 2, 0])
for k in [1, 4, 8]:
    pass_k = 1.0 - comb(M - c_counts, k) / comb(M, k)
    print(f"Batch mean unbiased pass@{k}: {pass_k.mean():.4f}")
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

When an exact unit test or symbolic math checker is unavailable, systems replace exact verification with either majority voting (self-consistency) or a learned reward model. Both fallible selectors break down differently as $N$ scales. Majority voting succeeds only when the true answer is the plurality mode across sampled traces; if a tricky prompt induces a shared systematic misconception $55\%$ of the time, scaling $N$ drives majority accuracy toward $0\%$. Meanwhile, selecting the maximum score from a noisy proxy verifier $\hat{R}(x, y) = R_{\text{true}}(x, y) + \epsilon$ causes Goodhart over-optimization: as $N$ grows, extreme positive verifier noise $\max_i \epsilon_i \propto \sqrt{\log N}$ increasingly picks confident hallucinations over valid answers. In the Monte Carlo simulation below, oracle coverage reaches `1.000` and the selected proxy score rises steadily from `0.556` to `1.090`, yet true accuracy peaks at `N = 8` (`0.570`) before collapsing below the `N = 1` baseline by `N = 64` (`0.335`).

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/selector_overoptimization_dark.png" alt="Line chart of Goodhart over-optimization in Best-of-N selection from N=1 to N=64. The noisy proxy verifier score rises monotonically from 61% to 95%, while true problem solve rate peaks at 76% around N=8 and drops to 60% by N=64." />
  <figcaption>Under a noisy proxy verifier, selected score keeps climbing with N while true accuracy peaks and turns downward once outlier errors win selection.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, id=goodhart-best-of-n -->
```python title="goodhart-best-of-n.py"
import numpy as np

rng = np.random.default_rng(7)
n_prompts = 2000
max_n = 64
budgets = [1, 2, 4, 8, 16, 32, 64]

# True correctness (prob p=0.35), coupled with proxy noise whose variance grows slightly on plausible errors
is_correct = rng.random((n_prompts, max_n)) < 0.35
base_signal = np.where(is_correct, rng.normal(0.72, 0.14, (n_prompts, max_n)), rng.normal(0.45, 0.28, (n_prompts, max_n)))

for N in budgets:
    sub_corr = is_correct[:, :N]
    sub_score = base_signal[:, :N]
    picked = sub_corr[np.arange(n_prompts), np.argmax(sub_score, axis=1)]
    oracle_cov = sub_corr.any(axis=1).mean()
    print(f"N={N:2d} | oracle_cov={oracle_cov:.3f} | max_proxy={sub_score.max(axis=1).mean():.3f} | true_acc={picked.mean():.3f}")
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

A third pitfall lies in confusing `pass@1` gains with multi-sample `pass@k` exploration [^setlur2025verification]. Because `pass@k = 1 - E[(1 - p_i)^k]` averages a strictly concave function of per-prompt probability $p_i$, sharpening a model's distribution so easy prompts move from $0.70 \to 0.90$ while hard prompts collapse from $0.20 \to 0.05$ raises mean `pass@1` from $0.450$ to $0.475$ while cutting mean `pass@4` from $0.791$ to $0.593$. Monitoring aggregate `pass@1` alone can hide severe diversity loss on hard problems, and plugging the dataset mean into `1 - (1 - mean_pass1)^4` wildly overestimates true coverage (`0.924` vs. `0.593`). Computing `1 - (1 - p_i)^k` per prompt before averaging preserves the diversity penalty whenever post-training collapses hard-prompt tail coverage.

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/per_prompt_coverage_dark.png" alt="Side-by-side bar charts comparing pass@1 and pass@4 before and after mode-sharpening RL. Raising easy prompts (70% to 90%) while narrowing hard prompts (20% to 5%) increases mean pass@1 from 45% to 48% yet drops mean pass@4 from 79% to 59%." />
  <figcaption>Mode sharpening can lift average single-sample accuracy while shrinking multi-sample pass@4 coverage when hard-prompt tail probabilities collapse.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, id=prompt-coverage-sharpening -->
```python title="prompt-coverage-sharpening.py"
import numpy as np

p_base = np.array([0.70, 0.20])
p_rl = np.array([0.90, 0.05])

for name, p in [("Base", p_base), ("Sharpened RL", p_rl)]:
    pass1 = p.mean()
    pass4_per_prompt = (1.0 - (1.0 - p) ** 4).mean()
    naive_plug_in = 1.0 - (1.0 - pass1) ** 4
    print(f"{name:12s} | mean pass@1={pass1:.3f} | true pass@4={pass4_per_prompt:.3f} | naive={naive_plug_in:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Base         | mean pass@1=0.450 | true pass@4=0.791 | naive=0.908
Sharpened RL | mean pass@1=0.475 | true pass@4=0.593 | naive=0.924
```
<!-- leetllm: output:end -->

### 2. Sequential revision

Rather than sampling $N$ independent trajectories from scratch, sequential revision lets the model critique and modify its own previous draft round by round, conditioning step $t$ on draft $t-1$ plus any verifier traceback or compiler signal. Because revision builds directly on prior mistakes, it excels on code repair and theorem refinement where diagnostic feedback pinpoints the defect, yet gains diminish rapidly once structural errors are resolved. Without external test feedback, repeated self-edits often lose confidence and drift away from correct answers after round `t2`, whereas verifier-guided revision gains sharply in rounds `t1` through `t3` before leveling off.

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/revision_paid_rounds_dark.png" alt="Line chart of sequential revision accuracy across rounds t0 to t5. Verifier-guided edits improve accuracy from 42% to 83% by round t3 before plateauing, while unverified self-edits peak at 60% at t2 and drift downward to 49% by t5." />
  <figcaption>Verifier-guided edits improve sharply in rounds t1 to t3 before plateauing, while unverified self-revision drifts past round t2.</figcaption>
</figure>

Practical refinement loops therefore stop once marginal gain falls below a cost threshold $\tau$ and keep the highest-verified draft rather than blindly returning the last iteration. In the trajectory below, incremental improvements shrink from `+0.26` down to `+0.01`, triggering early stopping after round `t4` (`0.84`) before round `t5` can regress.

<!-- leetllm: test, output=show, deps=numpy, id=revision-early-stop -->
```python title="revision-early-stop.py"
import numpy as np

rounds = np.arange(6)
guided_score = np.array([0.42, 0.68, 0.79, 0.83, 0.84, 0.83])
tau = 0.03

deltas = np.diff(guided_score)
# First round where improvement drops strictly below threshold tau
stop_round = int(np.where(deltas < tau)[0][0] + 1)
best_round = int(np.argmax(guided_score[: stop_round + 1]))

print("Step deltas:", np.round(deltas, 3).tolist())
print(f"Stop after round t{stop_round}; retain draft t{best_round} (score={guided_score[best_round]:.2f})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Step deltas: [0.26, 0.11, 0.04, 0.01, -0.01]
Stop after round t4; retain draft t4 (score=0.84)
```
<!-- leetllm: output:end -->

### 3. Tree search with process reward models

Parallel Best-of-$N$ waits until generation finishes to discard a broken trace, wasting tokens after an early algebraic sign error. Process-guided lookahead search, including <span data-glossary="beam-search">beam search</span> and <span data-glossary="monte-carlo-tree-search">Monte Carlo tree search (MCTS)</span>, branches at intermediate reasoning steps ($s_1, s_2, \dots, s_t$), scores partial derivations with a PRM, prunes weak paths early, and reallocates decode compute to the top-$B$ surviving beams. When solving $(x^2 - 7x + 11)^{x^2 - 13x + 42} = 1$, a beam width $B = 2$ keeps both the $a = 1$ branch and the $a = -1$ even-exponent branch alive (`PRM 0.91` and `0.89`) to recover all six integer roots $\{2, 3, 4, 5, 6, 7\}$, while immediately pruning any incomplete trace that omits $a = -1$ at step 2 (`PRM 0.24`).

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/deliberation_search_dark.png" alt="Beam search tree (width B=2) solving (x^2 - 7x + 11)^(x^2 - 13x + 42) = 1. Branches for a=1 and a=-1 with even exponent receive high PRM scores (0.91 and 0.89) and verify all six integer roots {2, 3, 4, 5, 6, 7}, while omitting a=-1 scores 0.24 and is pruned at step 2." />
  <figcaption>Step-level beam search prunes the omitted-branch trace at step 2 before wasting decode compute on an incomplete root set.</figcaption>
</figure>

A subtle algorithmic choice in PRM beam search is how per-step scores $r_1, \dots, r_t$ combine into a partial path score $S(s_{1:t})$. Multiplying probabilities ($\prod_{i=1}^t r_i$) or taking the path minimum ($\min_{i \le t} r_i$) enforces a monotone upper limit that can permanently penalize a path for momentary low confidence on an exploratory lemma, even if the subsequent step recovers cleanly. Empirically, Snell et al. [^snell2024] found that scoring each partial trajectory solely by its **last-step PRM prediction** $r_t$ outperforms `min` and `prod` aggregation because each PRM prediction already summarizes completion likelihood from the entire prefix $s_{1:t}$. Below, we build a compact PyTorch MLP process reward model (`torch.nn.Module`) scoring partial algebraic state vectors along candidate branches, illustrating how `last_step` preserves a recovered trajectory (`0.321 -> 0.999`) that `min` aggregation would penalize forever.

<!-- leetllm: test, output=show, deps=torch, id=torch-prm-beam-search -->
```python title="torch-prm-beam-search.py"
import torch
import torch.nn as nn

torch.manual_seed(42)


class StepPRM(nn.Module):
    """Compact MLP predicting final-answer recoverability from 4 step-state features."""

    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(nn.Linear(4, 8), nn.Tanh(), nn.Linear(8, 1), nn.Sigmoid())
        with torch.no_grad():
            # Weights map [case_coverage, parity_checked, residual_err, skipped_branch] to PRM score
            self.net[0].weight.copy_(torch.tensor([
                [1.4, 1.2, -1.6, -1.8],
                [0.9, 1.1, -1.2, -1.4],
                [-1.1, -0.9, 1.5, 1.6],
                [0.8, 0.7, -0.8, -1.0],
                [1.0, 0.5, -1.1, -1.2],
                [0.4, 1.3, -0.9, -1.5],
                [-0.6, -0.8, 1.2, 1.1],
                [0.7, 0.9, -0.7, -0.9],
            ]))
            self.net[0].bias.zero_()
            self.net[2].weight.copy_(torch.tensor([[1.1, 0.9, -1.2, 0.7, 0.8, 1.0, -0.9, 0.7]]))
            self.net[2].bias.fill_(-0.2)

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.net(features).squeeze(-1)


prm = StepPRM().eval()

# Candidate prefixes: (name, [step1_feat, step2_feat])
paths = {
    "a=1 & a=-1 (even b)": torch.tensor([[0.8, 0.9, 0.1, 0.0], [1.0, 1.0, 0.0, 0.0]]),
    "a=1 & b=0 (skip a=-1)": torch.tensor([[0.8, 0.2, 0.1, 0.8], [0.7, 0.1, 0.0, 0.9]]),
    "uncertain split -> recovered": torch.tensor([[0.3, 0.4, 0.5, 0.1], [1.0, 1.0, 0.0, 0.0]]),
}

with torch.no_grad():
    for label, feats in paths.items():
        step_scores = prm(feats)
        print(
            f"{label:28s} | steps={step_scores.tolist()} | last={step_scores[-1]:.3f} | min={step_scores.min():.3f}"
        )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
a=1 & a=-1 (even b)          | steps=[0.9980176687240601, 0.9987044334411621] | last=0.999 | min=0.998
a=1 & b=0 (skip a=-1)        | steps=[0.09055892378091812, 0.02863174118101597] | last=0.029 | min=0.029
uncertain split -> recovered | steps=[0.32057440280914307, 0.9987044334411621] | last=0.999 | min=0.321
```
<!-- leetllm: output:end -->

Because `last_step` tracks the cumulative state at step 2 rather than pinning the early uncertainty of step 1 (`uncertain split -> recovered` jumps to `last=0.999` vs. `min=0.321`), it preserves recovered derivations during beam selection while keeping incomplete paths (`last=0.029`) out of the active frontier. In production beam search, only `min`-style monotone bounds permit early stopping against a completed score without future lookahead, whereas `last_step` requires completing the beam expansion or adding a calibrated patience rule.

## Process reward models vs. outcome reward models

An **Outcome Reward Model (ORM)** evaluates only the completed trajectory: $R_{\text{ORM}}(x, y) \in [0, 1]$. For tasks with verifiable answers, an exact symbolic checker, regex extractor, or test suite acts as a ground-truth binary outcome verifier; on subjective prompts, a trained ORM provides a scalar proxy. Either way, an ORM delivers sparse terminal credit: if step 4 drops a minus sign inside an eight-step derivation, all eight steps receive one low terminal score with zero localization.

A **Process Reward Model (PRM)** predicts intermediate quality after every step $s_t$: $R_{\text{PRM}}(x, s_{1:t}) \in [0, 1]$. Crucially, modern PRM supervision such as Math-Shepherd [^wang2023d] does not merely grade local syntactic validity, nor does it require expensive human step-by-step annotations as in Lightman et al.'s `PRM800K` [^lightman2023]. Instead, automatic PRMs define the target at prefix $s_{1:t}$ via **Monte Carlo rollout recoverability**, running $K$ independent completions from $(x, s_{1:t})$ to an exact outcome verifier:

$$
V(s_{1:t}) = P(\text{final answer correct} \mid x, s_{1:t}) \approx \frac{1}{K} \sum_{j=1}^{K} \mathbb{I}\!\left[\text{verify}\!\left(x, s_{1:t}, y^{(j)}_{>t}\right)\right]
$$

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/prm_target_meaning_dark.png" alt="Process reward model supervision tree for x^2 - 7x + 12 = 0. Factoring (x-3)(x-4)=0 yields 3 of 4 Monte Carlo completions reaching the right answer (target V=0.75), while factoring (x+3)(x-4)=0 yields 0 of 4 completions recovering (target V=0.00)." />
  <figcaption>PRM targets measure future recoverability across completion rollouts, separating benign uncertainty from unrecoverable algebraic errors.</figcaption>
</figure>

Distinguishing rollout recoverability from binary step validity explains why PRMs excel at credit assignment across long traces. Even if a prefix contains an unconventional substitution, non-zero recoverability keeps the branch viable during beam selection; conversely, once an unrecoverable sign error appears at step 4 (`S4*`), dense PRM scoring flags the drop immediately (`0.89 -> 0.15`) rather than waiting until terminal step `S8` as an ORM must. Simulating Monte Carlo completions over candidate prefixes illustrates how early PRM pruning trims wasted decode work (`-31.2%` step evaluations in our 4-branch run) while remaining sensitive to sampling variance if $K$ is too small.

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/reward_model_comparison_dark.png" alt="Heatmap comparing Outcome Reward Model (ORM) and Process Reward Model (PRM) scores across steps S1 through S8. The ORM gives no intermediate signal and scores 0.12 at S8, whereas the PRM scores S1 to S3 near 0.90 and drops immediately to 0.15 at error step S4." />
  <figcaption>Sparse terminal ORM scoring assigns credit only at step S8, whereas a PRM identifies the exact step S4 where trajectory recoverability collapses.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, id=prm-rollout-torch-numpy -->
```python title="prm-rollout-torch-numpy.py"
import numpy as np

rng = np.random.default_rng(11)

# 4 candidate prefixes at step 2 with ground-truth completion recovery rates
true_recovery = np.array([0.82, 0.65, 0.12, 0.04])
mc_rollouts = 8
empirical_prm = rng.binomial(1, true_recovery[:, None], size=(4, mc_rollouts)).mean(axis=1)

# Total decode tokens: 8 steps for unpruned ORM vs early stop at step 3 when PRM < 0.35
steps_full = 8
steps_per_branch = np.where(empirical_prm >= 0.35, steps_full, 3)

print("Estimated PRM targets:", np.round(empirical_prm, 3).tolist())
print("ORM total step-evals:", 4 * steps_full)
print("PRM pruned step-evals:", int(steps_per_branch.sum()), f"(-{100 * (1 - steps_per_branch.sum() / (4 * steps_full)):.1f}% work)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Estimated PRM targets: [0.875, 0.625, 0.125, 0.0]
ORM total step-evals: 32
PRM pruned step-evals: 22 (-31.2% work)
```
<!-- leetllm: output:end -->

Notice that PRM training also introduces substantial label-generation cost at scale: rolling out $K$ completions from every intermediate step multiplies labeling compute across datasets unless rollouts are cached or amortized. Furthermore, because small-$K$ Monte Carlo targets fluctuate noisily around pruning thresholds, a PRM can falsely discard an uncommon valid proof if its estimated recoverability drops transiently below the cutoff.

## DeepSeek-R1-Zero and DeepSeek-R1

Pure outcome reinforcement learning demonstrated that extended reasoning behaviors can emerge directly from RL without hand-engineered tree search or human step labels [^deepseekai2025]. Starting from `DeepSeek-V3-Base` (a 671B-parameter MoE with 37B active parameters), **DeepSeek-R1-Zero** applied **Group Relative Policy Optimization (GRPO)** [^shao2024] using only rule-based accuracy and format verification rewards. Over thousands of RL updates, the model spontaneously elongated its responses, verified intermediate equations, and exhibited reflection and backtracking without supervised CoT demonstrations. However, R1-Zero also suffered from language mixing and poorly formatted thoughts, motivating the multi-stage **DeepSeek-R1** pipeline:

1. **Cold-start SFT**: Fine-tune `DeepSeek-V3-Base` on a few thousand curated long-CoT examples to start with clean formatting and readable reasoning style.
2. **Reasoning-oriented GRPO RL**: Train with accuracy, format, and language-consistency rewards to strengthen math, code, and logic verification.
3. **Rejection sampling and general SFT**: Sample reasoning traces from the Stage 2 checkpoint, keep ~600k verified reasoning solutions alongside ~200k general instruction examples, and fine-tune **a fresh `DeepSeek-V3-Base` checkpoint** from scratch. Notice the architectural distinction: Stage 2 produces curated training data, while Stage 3 restarts weights cleanly from `V3-Base` rather than continuing directly on the Stage 2 RL checkpoint.
4. **Broad RL**: Align the Stage 3 model across helpfulness, safety, and reasoning capabilities to produce the final `DeepSeek-R1` release.

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/r1_weights_and_training_data_dark.png" alt="DeepSeek-R1 four-stage pipeline: V3-Base initializes Stage 1 cold-start SFT and Stage 2 GRPO RL, which filters 600k reasoning traces plus 200k general examples onto a fresh V3-Base checkpoint in Stage 3 before Stage 4 broad RL and dense distillation." />
  <figcaption>Data lineage vs. weight initialization in DeepSeek-R1: Stage 2 RL curates ~600k verified traces, while Stage 3 initializes fresh V3-Base weights before Stage 4 RL and student distillation.</figcaption>
</figure>

GRPO replaces PPO's learned value-function critic with an in-batch empirical baseline over $G$ sampled completions $\{o_1, \dots, o_G\}$ per prompt $q$, eliminating an entire critic model from GPU memory:

$$
\hat{A}_i = \frac{r_i - \operatorname{mean}(r_1, \dots, r_G)}{\operatorname{std}(r_1, \dots, r_G)}
$$

Computing group-relative advantages in NumPy makes an essential training property concrete: mixed-outcome prompts produce clean positive and negative advantages (`[1.0, -1.0, 1.0, -1.0]`), whereas tied groups where every rollout passes or fails have zero standard deviation and contribute exact zero gradient signal. Curriculum filtering and prompt-difficulty balancing therefore determine how efficiently GRPO uses rollout compute.

<!-- leetllm: test, output=show, deps=numpy, id=grpo-advantage-numpy -->
```python title="grpo-advantage-numpy.py"
import numpy as np

# 3 prompts x G=4 verified binary/shaped rollout rewards
rewards = np.array([
    [1.0, 0.0, 1.0, 0.0],   # mixed group: strong contrast
    [1.0, 1.0, 1.0, 1.0],   # saturated easy prompt: std = 0
    [0.0, 0.1, 0.0, 0.0],   # sparse partial credit
])

mean = rewards.mean(axis=1, keepdims=True)
std = rewards.std(axis=1, keepdims=True)
advantages = np.where(std > 1e-8, (rewards - mean) / np.maximum(std, 1e-8), 0.0)

for i in range(len(rewards)):
    print(f"Prompt {i}: rewards={rewards[i].tolist()} -> advantages={np.round(advantages[i], 3).tolist()}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Prompt 0: rewards=[1.0, 0.0, 1.0, 0.0] -> advantages=[1.0, -1.0, 1.0, -1.0]
Prompt 1: rewards=[1.0, 1.0, 1.0, 1.0] -> advantages=[0.0, 0.0, 0.0, 0.0]
Prompt 2: rewards=[0.0, 0.1, 0.0, 0.0] -> advantages=[-0.577, 1.732, -0.577, -0.577]
```
<!-- leetllm: output:end -->

## Compute-optimal inference: when to think harder

Spending identical test-time compute on every prompt wastes latency on easy queries and starves hard ones. Snell et al. [^snell2024] formalize **compute-optimal inference** as allocating search strategy and token budget conditioned on prompt difficulty $\hat{d}(x)$ under explicit latency or FLOP caps. On trivial factual lookups, single-pass decoding already achieves near-ceiling accuracy in ~200 ms, while extra reflection risks overthinking [^chen2025limitingconfidence] [^anthropic2025inversescaling]; on multi-step mathematical proofs or multi-file bug localization, allocating parallel sampling or PRM tree search converts additional compute directly into higher pass rates.

| Task Archetype | Recommended Regime | Typical Budget | Typical Trade-off |
| :--- | :--- | :--- | :--- |
| **Syntax lookup / entity extraction** | Single forward pass | `0` extra branches | Lowest TTFT; extra CoT adds latency without gain |
| **Algebraic equation / unit-test verification** | Low CoT or Best-of-4 | `500` to `1,500` CoT tokens | Catches missing roots and edge assertions quickly |
| **Multi-file bug localization** | Sequential revision | `2` to `3` test-guided edits | Turns traceback failures into targeted fixes |
| **Olympiad proof / formal synthesis** | PRM beam search or deep RL CoT | `4,000`+ reasoning tokens | Needed when single-pass probability $p \ll 0.1$ |

When serving live traffic, a difficulty router checks both a minimum quality floor and a maximum p95 latency target per request tier before selecting the lowest-cost eligible strategy. Visualizing candidates on latency versus accuracy separates infeasible over-latency tiers (`Deep PRM` at `11.5s` when the limit is `4.5s`) and under-quality tiers (`1-Pass` and `Bo4` below `80%`) from the feasible Pareto region (`Med Rev` at `3.8s`, `87%`). Implementing that vectorized selection check across easy, medium, and hard difficulty buckets keeps latency within budget while reserving expensive tree search exclusively for truly hard queries.

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/routing_feasible_set_dark.png" alt="Quadrant chart plotting four inference tiers by p95 latency (seconds) versus solve accuracy, with a 4.5s latency SLO and 80% accuracy floor. Single-pass (0.2s, 56%) and Low Bo4 (1.4s, 74%) fall below quality; Deep PRM (11.5s, 93%) exceeds latency; Med Rev (3.8s, 87%) sits in the feasible Pareto region." />
  <figcaption>A router applies latency and accuracy cutoffs first, isolating the Pareto-optimal configuration inside the feasible upper-left region.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, id=adaptive-routing-numpy -->
```python title="adaptive-routing-numpy.py"
import numpy as np

tiers = np.array(["single_pass", "low_bo4", "med_revision", "deep_prm"])
costs_usd = np.array([0.0004, 0.0022, 0.0068, 0.0240])
p95_s = np.array([0.2, 1.4, 3.8, 11.5])
# Measured solve rate matrix: rows = [easy, medium, hard], cols = tiers
solve_rates = np.array([
    [0.95, 0.96, 0.97, 0.97],
    [0.56, 0.74, 0.87, 0.92],
    [0.14, 0.31, 0.58, 0.81],
])

bucket_names = ["easy", "medium", "hard"]
lat_slos = [1.0, 4.5, 12.0]
acc_floors = [0.92, 0.80, 0.75]

for b_idx, name in enumerate(bucket_names):
    ok = (p95_s <= lat_slos[b_idx]) & (solve_rates[b_idx] >= acc_floors[b_idx])
    candidates = np.where(ok)[0]
    pick = candidates[np.argmin(costs_usd[candidates])]
    print(f"{name:6s} -> {tiers[pick]:12s} | acc={solve_rates[b_idx, pick]:.2f} | p95={p95_s[pick]:.1f}s | cost=${costs_usd[pick]:.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
easy   -> single_pass  | acc=0.95 | p95=0.2s | cost=$0.0004
medium -> med_revision | acc=0.87 | p95=3.8s | cost=$0.0068
hard   -> deep_prm     | acc=0.81 | p95=11.5s | cost=$0.0240
```
<!-- leetllm: output:end -->

## Production considerations

Even when test-time search lifts benchmark solve rates, production economics depend tightly on GPU memory pools, tail latency before visible text arrives, token billing multipliers, and model distillation. Sizing test-time compute accurately requires modeling all four hardware and cost constraints together rather than treating search algorithms in isolation.

### KV cache pressure and prefix sharing

Every autoregressive candidate branch retains keys and values across all attention layers and sequence positions, so parallel sampling multiplies memory pressure unless prompt prefixes are shared. For a uniform full-attention transformer with $L$ layers, $H_{\text{kv}}$ key-value heads, head dimension $d_{\text{head}}$, and $b$ bytes per scalar, each cached token position consumes $2 \cdot L \cdot H_{\text{kv}} \cdot d_{\text{head}} \cdot b$ bytes. With $L = 32$, $H_{\text{kv}} = 8$, $d_{\text{head}} = 128$, and FP16 precision ($b = 2$), each cached token position uses $2 \times 32 \times 8 \times 128 \times 2 = 131,072\text{ bytes} = 128\text{ KiB}$. Sampling $N = 8$ parallel candidate derivations for a $P = 4,096$-token shared prompt with $C = 1,024$ continuation tokens per branch duplicates $40,960$ KV slots (`5.00 GiB`) when unshared, whereas copy-on-write prefix page sharing via <span data-glossary="pagedattention">PagedAttention</span> [^kwon2023pagedattention] and `RadixAttention` [^sglang2024v04] keeps only $4,096 + 8 \times 1,024 = 12,288$ slots (`1.50 GiB`, saving `70%` of KV capacity).

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/branch_cache_geometry_dark.png" alt="Comparison between unshared N=8 parallel sampling and paged prefix sharing. Unshared branches store 8 duplicate 4,096-token prompt blocks plus 8 x 1,024 continuations (40,960 KV slots, 5.0 GiB), while prefix sharing stores 1 read-only prompt block plus 8 private tails (12,288 KV slots, 1.5 GiB, 70% savings)." />
  <figcaption>Sharing read-only prompt KV pages across parallel search branches shrinks per-request cache footprint by 70% while isolating private tails.</figcaption>
</figure>

### TTFT vs. inter-token latency

For standard models, time-to-first-token (TTFT) measures prompt prefill plus one decode step, while inter-token latency (ITL) governs visible streaming smoothness afterward. In reasoning models, hidden thinking tokens decode autoregressively at the engine's per-token decode speed *before* the first visible answer token reaches the client:

$$
\text{TTFT}_{\text{visible}} \approx t_{\text{prefill}}(P) + H \cdot t_{\text{decode}}
$$

At `80 tokens/s` (`12.5 ms/token`), prefilling a prompt in `200 ms` looks snappy on paper, yet emitting $H = 1,024$ hidden reasoning tokens delays the first visible word to `0.2 + 12.6 = 12.8 seconds`. Even a generous `3,000 ms` visible TTFT cap permits at most `224` hidden thinking tokens at that decode rate unless thinking progress is streamed or decode throughput scales higher. Evaluating both KV concurrency and hidden-token latency budgets together reveals immediately how many concurrent search requests fit inside GPU memory without violating user responsiveness.

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/hidden_decode_ttft_dark.png" alt="Side-by-side latency breakdown comparing standard decoding against hidden reasoning decoding. Standard decoding reaches the first visible token at 0.25s, whereas decoding 1,024 hidden reasoning tokens delays visible TTFT to 12.8s before the 1.8s visible stream." />
  <figcaption>Even fast decode throughput produces multi-second user stalls when hidden reasoning consumes 1,000+ autoregressive steps before visible output begins.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, id=kv-prefix-and-ttft -->
```python title="kv-prefix-and-ttft.py"
import numpy as np

# 32-layer GQA model (8 KV heads, head_dim=128, FP16)
bytes_per_tok = 2 * 32 * 8 * 128 * 2
prompt_tok, branch_tok, n_branches = 4096, 1024, 8

unshared_gib = n_branches * (prompt_tok + branch_tok) * bytes_per_tok / (1024 ** 3)
shared_gib = (prompt_tok + n_branches * branch_tok) * bytes_per_tok / (1024 ** 3)
kv_pool_gib = 24.0
max_concurrent_shared = int(kv_pool_gib // shared_gib)

# TTFT ceiling across hidden CoT lengths at 80 tok/s + 200 ms prefill
prefill_ms, decode_tok_s, ttft_limit_ms = 200.0, 80.0, 3000.0
max_hidden_tok = int((ttft_limit_ms - prefill_ms) * decode_tok_s / 1000.0)

print(f"KV footprint: unshared={unshared_gib:.2f} GiB vs shared={shared_gib:.2f} GiB (concurrency={max_concurrent_shared} reqs in 24 GiB)")
print(f"Max hidden CoT under {ttft_limit_ms:.0f} ms visible TTFT at {decode_tok_s:.0f} tok/s: {max_hidden_tok} tokens")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
KV footprint: unshared=5.00 GiB vs shared=1.50 GiB (concurrency=16 reqs in 24 GiB)
Max hidden CoT under 3000 ms visible TTFT at 80 tok/s: 224 tokens
```
<!-- leetllm: output:end -->

### Cost implications

Because providers bill hidden thinking tokens at output token rates [^openai2026reasoning] [^gemini2025thinking] [^anthropic2025extendedthinking], test-time compute multiplies request cost whenever reasoning traces run $5\times$ to $20\times$ longer than visible answers, or whenever Best-of-$N$ runs parallel streams without early stopping. A single query producing $300$ visible tokens alongside $2,700$ hidden reasoning tokens incurs $10\times$ the output cost of an equally concise direct completion. Reserve high reasoning budgets for hard prompts where verification or search materially lifts task completion rather than enabling deep reasoning globally across simple traffic.

### Distillation: making reasoning affordable

Full-scale RL over reasoning chains requires substantial training compute and long context rollouts, yet **supervised fine-tuning (SFT) <span data-glossary="teacher-student-distillation">distillation</span>** transfers much of that capability directly into compact dense models [^deepseekai2025]. By training smaller Qwen and Llama student models on verified reasoning traces generated by `DeepSeek-R1`, the student models acquire structured backtracking and step verification directly from the teacher's output distribution without running expensive online RL exploration on small base weights. On `AIME 2024`, distilled dense models reach `28.9%` (`1.5B`), `55.5%` (`7B`), and `72.6%` (`32B`), closing much of the gap toward the full `671B` `DeepSeek-R1` teacher at `79.8%` while dramatically lowering deployment cost. Notice, however, what trace-only distillation transfers: student weights imitate accepted teacher reasoning trajectories, not an external test suite, compiler, or rejected-branch search policy, so small distilled students still benefit from domain verifiers at runtime.

<figure>
  <img src="/content/fundamentals/reasoning-models-test-time-compute/illustrations/_generated/distillation_information_boundary_dark.png" alt="Bar chart of published AIME 2024 accuracy for distilled Qwen models from DeepSeek-R1: Qwen-1.5B reaches 28.9%, Qwen-7B reaches 55.5%, Qwen-32B reaches 72.6%, and full 671B DeepSeek-R1 reaches 79.8%." />
  <figcaption>Verified AIME 2024 accuracy scales strongly across distilled dense student sizes toward the 671B DeepSeek-R1 teacher.</figcaption>
</figure>

## Balancing search, verification, and serving cost

Bringing test-time compute into production means pairing the right search algorithm with honest evaluation metrics and hardware accounting before scaling branch counts or token limits. Confirm every gain against difficulty-matched baselines using per-prompt `pass@k` and end-to-end selected accuracy, pair Best-of-$N$ or beam search with calibrated PRMs or executable tests to prevent Goodhart inflation, and enable prefix-shared KV caching alongside visible-TTFT budgets so long hidden reasoning traces never silently starve concurrent traffic:

1. **Confirm real gain over difficulty-matched baselines**: Verify on per-prompt `pass@k` and end-to-end selected accuracy that extra search or revision actually beats single-pass or lower-effort decoding without Goodhart decay or `max_output_tokens` truncation.
2. **Match selector precision to exploration budget**: Pair Best-of-$N$ and beam search with executable unit tests, symbolic checkers, or calibrated PRMs (using `last_step` value estimates over rigid `min` cutoffs) rather than trusting noisy outcome proxies at large $N$.
3. **Size KV pools and TTFT budgets together**: Enable copy-on-write prefix sharing for parallel branches, and account for hidden autoregressive thinking tokens when computing user-facing visible TTFT and multi-turn output bills.

## Mastery Quiz

Check your understanding across test-time compute scaling, verifier design, DeepSeek-R1 lineage, KV cache sharing, and latency budgets with the ten scenario questions below.

```mastery-quiz
[
  {
    "question": "An API call generates 500 output tokens on Turn 1 (of which 380 are hidden reasoning tokens) and 400 output tokens on Turn 2 (of which 380 are hidden reasoning tokens). At \\$30 per million output tokens, how many total visible answer tokens were emitted and what is the combined output token charge?",
    "options": [
      "140 visible tokens, \\$0.04980",
      "900 visible tokens, \\$0.02700",
      "140 visible tokens, \\$0.02700",
      "900 visible tokens, \\$0.04980"
    ],
    "answer": "140 visible tokens, \\$0.02700",
    "explanation": "Total generated output tokens across both turns equal 500 + 400 = 900. Subtracting 380 + 380 = 760 hidden reasoning tokens leaves 140 visible answer tokens. Providers bill hidden reasoning once inside output tokens, so 900 * \\$30 / 1,000,000 = \\$0.02700."
  },
  {
    "question": "A difficulty router requires solve accuracy at least 0.88 and p95 latency at most 900 ms, picking the lowest-cost feasible policy. Policy A has (acc=0.87, p95=300 ms, cost=\\$0.003); B has (0.90, 850 ms, \\$0.015); C has (0.92, 1100 ms, \\$0.011); D has (0.89, 880 ms, \\$0.020). Which policy is selected?",
    "options": [
      "Choose B at \\$0.015; it meets both constraints and costs less than D.",
      "Choose A at \\$0.003; it meets the latency limit and minimizes token cost.",
      "Choose C at \\$0.011; it maximizes accuracy while staying cheaper than B.",
      "Choose D at \\$0.020; it satisfies both thresholds with lower variance."
    ],
    "answer": "Choose B at \\$0.015; it meets both constraints and costs less than D.",
    "explanation": "Applying both filters eliminates A (below 0.88 accuracy) and C (above 900 ms p95). Between feasible options B and D, B is cheaper at \\$0.015."
  },
  {
    "question": "Two equally weighted prompts have single-sample success probabilities [0.98, 0.08] before RL and [0.95, 0.10] afterward. Each prompt runs 3 independent attempts. Rounded to six decimal places, how do mean pass@1 and mean pass@3 change?",
    "options": [
      "pass@1 drops by 0.005000, pass@3 drops by 0.003349",
      "pass@1 drops by 0.010000, pass@3 drops by 0.003349",
      "pass@1 drops by 0.010000, pass@3 rises by 0.024786",
      "pass@1 drops by 0.005000, pass@3 rises by 0.024786"
    ],
    "answer": "pass@1 drops by 0.005000, pass@3 rises by 0.024786",
    "explanation": "Mean pass@1 shifts from (0.98 + 0.08)/2 = 0.530 to (0.95 + 0.10)/2 = 0.525, a change of -0.005000. For pass@3, average failure rates per prompt: before RL, (0.02^3 + 0.92^3)/2 = 0.389348 (coverage 0.610652); after RL, (0.05^3 + 0.90^3)/2 = 0.3645625 (coverage 0.6354375), raising pass@3 by +0.024786."
  },
  {
    "question": "In the four-stage DeepSeek-R1 pipeline, Stage 2 produces curated rejection-sampled CoT traces T alongside general instruction data G, and a separate dense student model trains only on accepted traces T. Which initialization does Stage 3 use, and what does the trace-only student lack?",
    "options": [
      "Stage 3 continues from Stage 2 RL weights; the student lacks the teacher's verifier and rejected paths.",
      "Stage 3 restarts from V3-Base; the student lacks the teacher's external verifier and rejected search paths.",
      "Stage 3 restarts from V3-Base; the student inherits the teacher's runtime verifier and rejected paths.",
      "Stage 3 continues from Stage 2 RL weights; the student inherits the teacher's runtime verifier and rejected paths."
    ],
    "answer": "Stage 3 restarts from V3-Base; the student lacks the teacher's external verifier and rejected search paths.",
    "explanation": "In DeepSeek-R1, Stage 3 restarts fine-tuning from a fresh V3-Base checkpoint on the combined 800k Stage 2 + general dataset rather than continuing Stage 2 RL weights. Trace-only SFT teaches the student to imitate accepted traces without conferring runtime verifiers or rejected trajectories."
  },
  {
    "question": "An intermediate step incorrectly writes 8 * 9 = 70. From that prefix, five Monte Carlo completions from Policy A yield answers [70, 71, 70, 71, 71], while five completions from Policy B yield [72, 71, 72, 71, 71]. An exact verifier checks only the final answer 72. What is the local step validity and each policy's rollout PRM score?",
    "options": [
      "Invalid step, Policy A = 0.00, Policy B = 0.40",
      "Valid step, Policy A = 0.40, Policy B = 0.00",
      "Valid step, Policy A = 0.00, Policy B = 0.40",
      "Invalid step, Policy A = 0.40, Policy B = 0.00"
    ],
    "answer": "Invalid step, Policy A = 0.00, Policy B = 0.40",
    "explanation": "The equation 8 * 9 = 70 is locally false. Policy A never recovers to 72 (0/5 = 0.00), whereas Policy B self-corrects to 72 twice in five rollouts (2/5 = 0.40)."
  },
  {
    "question": "A beam search frontier already holds a completed solution scoring 0.81 and an active partial path currently at 0.79 (later steps can score up to 1.00). Compare path aggregation P (minimum step score along the prefix) against L (latest step score only). Which guarantees the active path can never beat 0.81?",
    "options": [
      "P: cannot beat 0.81; L: cannot beat 0.81",
      "P: can still beat 0.81; L: cannot beat 0.81",
      "P: cannot beat 0.81; L: can still beat 0.81",
      "P: can still beat 0.81; L: can still beat 0.81"
    ],
    "answer": "P: cannot beat 0.81; L: can still beat 0.81",
    "explanation": "Under minimum aggregation P, extending a path with current min 0.79 can never raise its prefix minimum above 0.79, so it cannot pass completed score 0.81. Under last-step scoring L, a later reasoning step can score above 0.81 and overtake the completed candidate."
  },
  {
    "question": "A sequential revision loop starts at draft D1 (1 call) and uses 1 critique call plus 1 rewrite call per subsequent round. Scores across [D1, D2, D3] are [0.400, 0.580, 0.585], stopping as soon as step improvement drops below 0.010. An external test passes D2 but fails D3. How many drafts are evaluated, how many calls run, and which draft ships?",
    "options": [
      "2 drafts evaluated, 3 calls, ship D2",
      "3 drafts evaluated, 5 calls, ship D2",
      "3 drafts evaluated, 5 calls, ship D3",
      "3 drafts evaluated, 3 calls, ship D2"
    ],
    "answer": "3 drafts evaluated, 5 calls, ship D2",
    "explanation": "D2 improves by 0.180 (>= 0.010), so D3 runs and reveals an improvement of 0.005 (< 0.010), stopping the loop after 3 evaluated drafts and 1 + 2 * 2 = 5 generation calls. Because the external check accepts D2 and rejects D3, D2 is retained."
  },
  {
    "question": "A prompt has per-sample solve rate 0.20 across 3 independent 600-token attempts. When at least one attempt in the pool is right, the selector picks it with 0.75 conditional accuracy. What are oracle pass@3 coverage, end-to-end selected accuracy, and generated tokens?",
    "options": [
      "0.200 coverage, 0.150 selected, 1,800 tokens",
      "0.488 coverage, 0.366 selected, 600 tokens",
      "0.200 coverage, 0.150 selected, 600 tokens",
      "0.488 coverage, 0.366 selected, 1,800 tokens"
    ],
    "answer": "0.488 coverage, 0.366 selected, 1,800 tokens",
    "explanation": "Pool coverage is 1 - 0.80^3 = 0.488. End-to-end selected accuracy is 0.488 * 0.75 = 0.366, and generating 3 full candidates costs 3 * 600 = 1,800 output tokens."
  },
  {
    "question": "With 150 ms prefill/overhead, 100 tokens/s decode throughput, and a 2,000 ms visible TTFT budget, how do 200 vs. 180 hidden reasoning tokens behave?",
    "options": [
      "200 tokens: 2,150 ms (exceeds limit); 180 tokens: 2,150 ms (exceeds limit)",
      "200 tokens: 2,000 ms (within limit); 180 tokens: 1,800 ms (within limit)",
      "200 tokens: 2,150 ms (exceeds limit); 180 tokens: 1,950 ms (within limit)",
      "200 tokens: 2,000 ms (within limit); 180 tokens: 1,950 ms (within limit)"
    ],
    "answer": "200 tokens: 2,150 ms (exceeds limit); 180 tokens: 1,950 ms (within limit)",
    "explanation": "Visible TTFT is 150 + 1000 * H / 100: 200 hidden tokens take 2,150 ms (over the 2,000 ms target), whereas 180 hidden tokens take 1,950 ms and meet the budget."
  },
  {
    "question": "Five branches share a 2,048-token prompt and generate 256 private tokens each on a 16-layer model with 4 KV heads, head dimension 64, and FP16 (2 bytes). With a 0.05 GiB KV budget, what are the prefix-shared KV footprints before and after releasing one branch tail, and how many continuation tokens were generated?",
    "options": [
      "0.05078125 GiB -> 0.046875 GiB, 1,280 continuation tokens generated",
      "0.05078125 GiB -> 0.046875 GiB, 1,024 continuation tokens generated",
      "0.17578125 GiB -> 0.140625 GiB, 1,024 continuation tokens generated",
      "0.17578125 GiB -> 0.140625 GiB, 1,280 continuation tokens generated"
    ],
    "answer": "0.05078125 GiB -> 0.046875 GiB, 1,280 continuation tokens generated",
    "explanation": "Each KV slot uses 2 * 16 * 4 * 64 * 2 = 16,384 bytes (16 KiB). Sharing the prompt holds 2,048 + 5 * 256 = 3,328 positions (0.05078125 GiB) before releasing a branch and 3,072 positions (0.046875 GiB) afterward, while all 5 * 256 = 1,280 continuation tokens were already decoded."
  }
]
```

> **Next:** Continue to [Advanced MLOps & DevOps for AI](/learn/advanced-mlops-devops-ai). Thinking budgets, routers, and verifiers are production controls. The next chapter versions those controls: GitOps for prompts and model aliases, feature stores, shadow traffic, canaries, lineage, and automated rollback when an effort knob or judge change regresses quality.
