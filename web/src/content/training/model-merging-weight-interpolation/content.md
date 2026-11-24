---
{
  "title": "Model Merging and Weight Interpolation",
  "id": "model-merging-weight-interpolation",
  "slug": "model-merging-weight-interpolation",
  "section": "Advanced Training & Adaptation",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/model_merging_dark.png",
  "companies": [
    "Meta",
    "Google DeepMind",
    "Hugging Face",
    "Arcee",
    "Stability AI"
  ],
  "shortDescription": "Combine same-base Code, Math, and Chat specialists into one checkpoint without gradient training. Compare Model Soups, Task Arithmetic, TIES, DARE, and SLERP, and catch silent slice regressions and tokenizer mismatches.",
  "keyConceptsTested": [
    "Model Soup (uniform weight averaging)",
    "Task Arithmetic (task vectors and linear combination)",
    "TIES-Merging (trim, elect sign, merge)",
    "DARE (drop and rescale for sparse merging)",
    "SLERP and geometric interpolation",
    "mergekit, tokenizer handling, and practical merging workflows"
  ],
  "order": 17,
  "prerequisites": [
    "knowledge-distillation-llms",
    "lora-parameter-efficient-fine-tuning",
    "supervised-fine-tuning-pipeline",
    "linear-algebra-machine-learning-deeper"
  ],
  "relatedQuestions": [
    "knowledge-distillation-llms",
    "programmatic-prompt-optimization-dspy",
    "model-quantization-gptq-awq-gguf",
    "mixture-of-experts-architecture"
  ]
}
---

Distillation trains a smaller student from teacher signals. <span data-glossary="model-merging">Model merging</span> starts even later: you already have specialized fine-tuned <span data-glossary="model-checkpoint">checkpoints</span> and want to combine their capabilities into one model with zero <span data-glossary="gradient">gradient</span> updates.

Suppose you serve three same-base 8B assistants: Code, Math, and Chat. Keeping all three full models resident triples weight memory. Merging them into a single checkpoint produces a tempting macro-average score of `87.2%` across the three benchmarks, until you look at individual slices: Code clears at `92.4%` and Chat clears at `87.0%`, while Math drops to `82.1%`, well below its `85.0%` floor.

Why does averaging weights sometimes blend skills seamlessly and other times break a specialist? First, parameter coordinates must share semantic meaning. If <span data-glossary="token">token</span> ID `417` means `return` in one tokenizer and `<fim_prefix>` in another, averaging row `417` of the <span data-glossary="embedding">embedding</span> matrix ($W_{\text{emb}}$) and output head ($W_{\text{head}}$) scrambles output probabilities into gibberish.[^mergekit2023] Starting from checkpoints fine-tuned off a shared base keeps internal coordinates aligned, though even same-base specialists can still pull individual weights in opposite directions.

Using Code, Math, and Chat as our running trio, we will build from linear mode connectivity and uniform soups up to Task Arithmetic, TIES, DARE, SLERP, and `mergekit` workflows.

## When averaging weights is worth testing

Skepticism about averaging neural-network weights is well earned: nonlinear networks have wildly non-convex loss landscapes. Merging works only when the candidate checkpoints sit in a shared low-loss basin.

For two checkpoints $\theta_A$ and $\theta_B$, trace the 1D linear interpolation path:

$$
\theta(\alpha) = (1 - \alpha)\theta_A + \alpha\theta_B, \qquad \alpha \in [0, 1]
$$

**Linear mode connectivity** measures whether this straight line climbs over a high-loss barrier between endpoints. Following Entezari et al.'s chord-barrier convention (while Frankle et al. compare against the endpoint average):[^frankle2020][^entezari2022]

$$
\Delta \mathcal{L}(\theta_A, \theta_B) = \sup_{\alpha \in [0, 1]} \Bigl[\mathcal{L}\bigl(\theta(\alpha)\bigr) - \bigl((1 - \alpha)\mathcal{L}(\theta_A) + \alpha\mathcal{L}(\theta_B)\bigr)\Bigr]
$$

At both endpoints the bracket equals zero, so the supremum is always nonnegative. When $\Delta \mathcal{L} \approx 0$, checkpoints fine-tuned from a shared pretrained initialization often stay usable along the connecting line.[^wortsman2022] Even then, passing endpoints can still hide a ridge at the midpoint, so evaluate interior $\alpha$ points directly:

<!-- leetllm: test, output=show -->
```python title="screen-interpolation-path.py"
alphas = [0.00, 0.25, 0.50, 0.75, 1.00]
losses = [0.18, 0.20, 0.61, 0.23, 0.19]
task_scores = [0.88, 0.86, 0.70, 0.85, 0.89]

max_loss, min_score = 0.30, 0.84
accepted = [
    a for a, loss, score in zip(alphas, losses, task_scores)
    if loss <= max_loss and score >= min_score
]
barriers = [
    loss - ((1 - a) * losses[0] + a * losses[-1])
    for a, loss in zip(alphas, losses)
]

print("passing alphas:", accepted)
print("midpoint passes:", 0.50 in accepted)
print("sampled chord barrier:", round(max(barriers), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
passing alphas: [0.0, 0.25, 0.75, 1.0]
midpoint passes: False
sampled chord barrier: 0.425
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/loss_basin_interpolation_dark.png" alt="Five sampled coefficients compare two loss paths. Both have endpoint losses 0.18 and 0.19. The ridge path reaches 0.61 at alpha 0.50, above the 0.30 threshold, with a sampled endpoint-chord barrier of 0.425. The low path reaches 0.09 at the midpoint." />
  <figcaption>The ridge path fails at alpha = 0.50 (loss 0.61, barrier 0.425) even though both endpoints sit below 0.20.</figcaption>
</figure>

> **Key insight:** A shared pretrained base makes checkpoints worth testing for linear mode connectivity, while models pretrained independently from scratch almost always sit in disconnected basins.

### The permutation invariance problem

Why can two independently trained networks compute the exact same function yet collapse to garbage when averaged? Because hidden layers have **permutation symmetry**: for any hidden layer $W_2 \sigma(W_1 x + b_1)$ with elementwise activation $\sigma$ and any permutation matrix $\Pi$, reordering neurons leaves the network output identical:[^entezari2022]

$$
W_2 \Pi^T \sigma(\Pi W_1 x + \Pi b_1) = W_2 \sigma(W_1 x + b_1)
$$

A layer of width $d$ admits up to $d!$ equivalent neuron orderings. Independently trained models place matching features in different slots, so coordinate-wise averaging blends unrelated neurons.

Watch a two-unit ReLU network computing $2\max(x, 0) - \max(-x, 0)$ break completely under naive averaging when its second copy simply swaps its two hidden units, and recover once aligned:

<!-- leetllm: test, output=show -->
```python title="permutation-preserves-function-not-average.py"
import numpy as np

x = np.array([-2.0, -1.0, 1.0, 2.0])
w_in = np.array([1.0, -1.0])
w_out = np.array([2.0, -1.0])
perm = np.array([1, 0])

def forward(incoming, outgoing):
    return np.maximum(x[:, None] * incoming, 0.0) @ outgoing

b_in, b_out = w_in[perm], w_out[perm]
naive = forward((w_in + b_in) / 2, (w_out + b_out) / 2)
inv = np.argsort(perm)
aligned = forward((w_in + b_in[inv]) / 2, (w_out + b_out[inv]) / 2)

print("model A outputs:", forward(w_in, w_out).tolist())
print("model B outputs:", forward(b_in, b_out).tolist())
print("naive average:  ", naive.tolist())
print("aligned average:", aligned.tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
model A outputs: [-2.0, -1.0, 2.0, 4.0]
model B outputs: [-2.0, -1.0, 2.0, 4.0]
naive average:   [0.0, 0.0, 0.0, 0.0]
aligned average: [-2.0, -1.0, 2.0, 4.0]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/git_rebasin_alignment_dark.png" alt="A two-unit ReLU network has incoming weights [1, −1] and outgoing weights [2, −1]. The second network stores the same two units in reverse order. Applying permutation π=(1,0) restores outputs [−2, −1, 2, 4]; naive averaging gives zero for every input." />
  <figcaption>Swapping hidden-unit order preserves the network's output identically, yet naive weight averaging cancels both units to zero. Aligning via the inverse permutation restores the exact function.</figcaption>
</figure>

**Git Re-Basin**[^ainsworth2022] searches for layer permutations $\pi$ minimizing parameter distance $\min_\pi \|\operatorname{vec}(\theta_A) - \operatorname{vec}(\pi(\theta_B))\|_2^2$ (solving a Linear Sum Assignment Problem per layer via coordinate descent, or matching cross-model activations) before averaging $\frac{1}{2}(\theta_A + \pi(\theta_B))$. While Git Re-Basin achieved zero-barrier merging for wide MLPs and ResNets on CIFAR-10, aligning modern transformers with multi-head attention, RMSNorm, and RoPE remains fragile, so LLM merging in practice relies on same-base lineage.

```checkpoint
Why does Git Re-Basin apply $\pi$ before averaging?
---
Two independently trained models can represent the same features in different neuron indices. Permuting one model's hidden units to match the other aligns corresponding features so averaging combines compatible parameters.
```

## From simple averages to conflict-aware methods

Once checkpoints share a base lineage, choose a merge rule based on how strongly their fine-tuning updates conflict:

| Method | Mechanism | Strength | Limitation | Best fit |
|---|---|---|---|---|
| **Model Soups / Linear** | Uniform or weighted weight average | Zero extra hyperparameters | Opposing updates cancel out | Nearby runs of the same task |
| **Task Arithmetic** | Base + weighted sum of task vectors $\tau_i = \theta_i - \theta_0$ | Flexible scaling and negation | Interference across conflicting deltas | Multi-task same-base merging |
| **TIES-Merging** | Trim small deltas, elect aggregate sign, disjoint merge | Reduces sign cancellation | Requires tuning density and $\lambda$ | Specialists with conflicting updates |
| **DARE** | Randomly drop delta entries and rescale survivors by $1/(1-p)$ | Cuts coordinate collisions before merging | High variance at aggressive drop rates | Preprocessing before Task Arithmetic or TIES |
| **SLERP** | Spherical interpolation along great-circle arc | Preserves vector norm for equal-norm inputs | Pairwise only (two checkpoints) | Smoothly blending two models |

### Model soups (uniform and greedy averaging)

Start with the simplest baseline: **Model Soups** averages fine-tuned checkpoints directly:[^wortsman2022]

$$
\theta_{\text{merged}} = \frac{1}{N} \sum_{i=1}^{N} \theta_i
$$

A **uniform soup** averages every candidate equally. A **greedy soup** sorts checkpoints by validation score, starts with the strongest model, and folds in each next candidate only if the updated average improves (or ties, in the original paper) the validation metric, avoiding bad outliers while keeping inference cost equal to a single model.[^wortsman2022]

Watch uniform vs greedy soup selection on three tiny linear models estimating $y = 2x + 2$:

<figure>
  <img src="illustrations/_generated/model_soup_selection_dark.png" alt="For the target y = 2x + 2 at x values −1, 0, and 1, the low-bias and high-bias predictors average to the target outputs 0, 2, and 4 with MSE 0. Adding the bad predictor moves the three-model soup to −2, 2, and 6, with MSE 8/3." />
  <figcaption>Averaging the two complementary predictors hits zero MSE, while including the outlier predictor degrades the uniform soup to MSE 8/3 (2.67).</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="uniform-vs-greedy-soups.py"
import numpy as np

x = np.array([-1.0, 0.0, 1.0])
y = 2.0 * x + 2.0

candidates = {
    "low_bias":  np.array([2.0, 1.0]),  # [slope, bias]
    "high_bias": np.array([2.0, 3.0]),
    "outlier":   np.array([8.0, 2.0]),
}

def mse(params):
    return float(np.mean((params[0] * x + params[1] - y) ** 2))

uniform_params = np.mean(list(candidates.values()), axis=0)

ordered = sorted(candidates, key=lambda name: mse(candidates[name]))
kept = [ordered[0]]
best_params = candidates[ordered[0]]
for name in ordered[1:]:
    trial = np.mean([candidates[n] for n in kept + [name]], axis=0)
    if mse(trial) < mse(best_params):
        kept.append(name)
        best_params = trial

print(f"uniform soup params={uniform_params.round(2).tolist()} | MSE={mse(uniform_params):.4f}")
print(f"greedy soup kept={kept} | params={best_params.round(2).tolist()} | MSE={mse(best_params):.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
uniform soup params=[4.0, 2.0] | MSE=2.6667
greedy soup kept=['low_bias', 'high_bias'] | params=[2.0, 2.0] | MSE=0.0000
```
<!-- leetllm: output:end -->

### Task arithmetic

Uniform averaging hides *how far* each specialist moved from the shared base $\theta_0$. **<span data-glossary="task-arithmetic">Task arithmetic</span>**[^ilharco2022] isolates each fine-tune as a **task vector** $\tau_i = \theta_i - \theta_0$, then scales and combines those deltas:

$$
\theta_{\text{merged}} = \theta_0 + \sum_{i=1}^{N} \lambda_i \tau_i
$$

This supports both **capability addition** ($\theta_0 + \lambda_{\text{code}}\tau_{\text{code}} + \lambda_{\text{math}}\tau_{\text{math}}$) and **capability negation** ($\theta_0 - \lambda \tau_{\text{toxic}}$). In Ilharco et al.'s GPT-2 Large negation experiment, subtracting a toxic-language delta cut measured toxic generations from `4.8%` to `0.8%` while moving WikiText-103 perplexity only from `16.4` to `16.9`.[^ilharco2022]

Notice an algebraic identity worth keeping in mind:

$$
\theta_0 + \sum_i \lambda_i(\theta_i - \theta_0) = \left(1 - \sum_i \lambda_i\right)\theta_0 + \sum_i \lambda_i \theta_i
$$

When $\sum_i \lambda_i = 1$, task arithmetic is algebraically identical to a weighted average of endpoints. Its extra freedom appears when $\sum_i \lambda_i \neq 1$, allowing you to retain base weight or extrapolate along specialist directions.

For example, suppose a base weight starts at `2.0`, Code pushes it to `2.5` ($\tau_{\text{code}} = +0.5$), and Math pushes it to `1.5` ($\tau_{\text{math}} = -0.5$). Equal weighting (`0.5 / 0.5`) cancels both deltas back to `2.0`, while `0.6 / 0.4` lands at `2.1`:

<figure>
  <img src="illustrations/_generated/model_merging_dark.png" alt="On one scalar weight coordinate, the base is 2.0, Code is 2.5, and Math is 1.5. The equal endpoint average and the corresponding 50/50 task-vector merge both land at 2.0. With 60/40 coefficients, both methods land at 2.1." />
  <figcaption>With coefficients summing to 1, task arithmetic matches the weighted endpoint average identically; unequal coefficients shift the merged weight toward the higher-weighted specialist.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="task-arithmetic-walkthrough.py"
import numpy as np

base = np.array([2.0, 2.0])
code_ft = np.array([2.5, 2.4])
math_ft = np.array([1.5, 1.8])

tau_code = code_ft - base
tau_math = math_ft - base

merged_60_40 = base + 0.6 * tau_code + 0.4 * tau_math
merged_70_50 = base + 0.7 * tau_code + 0.5 * tau_math  # sum of lambdas > 1

print("task vectors -> code:", tau_code.round(2).tolist(), "math:", tau_math.round(2).tolist())
print("lambdas (0.6, 0.4): ", merged_60_40.round(3).tolist())
print("lambdas (0.7, 0.5): ", merged_70_50.round(3).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
task vectors -> code: [0.5, 0.4] math: [-0.5, -0.2]
lambdas (0.6, 0.4):  [2.1, 2.16]
lambdas (0.7, 0.5):  [2.1, 2.18]
```
<!-- leetllm: output:end -->

```checkpoint
Why did equal averaging cancel the two specialist deltas on the first coordinate?
---
Code moved the weight by +0.5 and Math moved it by -0.5. An equal average puts the coordinate right back at the base value 2.0, cancelling both specialist updates on that parameter.
```

### Merging LoRA adapters: average deltas, not factors

A standard LoRA adapter stores low-rank factors $A_i, B_i$ representing the effective update $\Delta W_i = s_i B_i A_i$.[^hu2021] If you average $A_1, A_2$ and $B_1, B_2$ separately and then multiply, you introduce spurious cross terms ($B_1 A_2$ and $B_2 A_1$) that neither adapter ever learned!

<figure>
  <img src="illustrations/_generated/lora_factor_merge_dark.png" alt="At unit scales s₁ = s₂ = 1, two rank-one adapters have A1 = [1,0], B1 = [1,0]ᵀ and A2 = [0,1], B2 = [0,1]ᵀ. Averaging their effective deltas with equal weights gives the diagonal matrix with 0.5 on each diagonal. Averaging A and B separately then multiplying gives four 0.25 entries because of cross terms. Concatenating the original factors represents the exact sum at rank two." />
  <figcaption>Averaging factor matrices separately leaks 0.25 onto the off-diagonal cross terms. Concatenating the scaled factors preserves the exact rank-2 sum.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="lora-factor-average-is-not-delta-average.py"
import numpy as np

a1, a2 = np.array([[1.0, 0.0]]), np.array([[0.0, 1.0]])
b1, b2 = a1.T, a2.T

desired = 0.5 * (b1 @ a1) + 0.5 * (b2 @ a2)
factor_average = ((b1 + b2) / 2) @ ((a1 + a2) / 2)

# Exact sum via concatenation (rank r1 + r2)
b_concat = np.concatenate([0.5 * b1, 0.5 * b2], axis=1)
a_concat = np.concatenate([a1, a2], axis=0)

print("desired delta:      ", desired.tolist())
print("factor-average bug: ", factor_average.tolist())
print("concatenated delta: ", (b_concat @ a_concat).tolist(), "| rank:", int(np.linalg.matrix_rank(desired)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
desired delta:       [[0.5, 0.0], [0.0, 0.5]]
factor-average bug:  [[0.25, 0.25], [0.25, 0.25]]
concatenated delta:  [[0.5, 0.0], [0.0, 0.5]] | rank: 2
```
<!-- leetllm: output:end -->

To combine LoRA adapters faithfully, either merge their full deltas $\sum_i \lambda_i s_i B_i A_i$ into the base weight, concatenate the scaled factors (at rank $r_1 + r_2$), or use an explicit SVD compression method such as PEFT's `cat` / `svd` combination modes.[^peft2026merging]

### TIES-Merging (trim, elect sign, merge)

When specialists disagree in sign at the same coordinate, linear addition cancels them out. **TIES-Merging**[^yadav2023] tackles both redundant noise and sign conflict in three coordinate-wise steps:

1. **Trim:** Zero out the smallest-magnitude entries in each task vector, keeping only the top fraction `density` (Yadav et al. found keeping the top 20% preserved performance well on their PEFT benchmarks).
2. **Elect sign:** For each parameter $p$, compute the winning direction from the **signed mass sum** $\gamma_m^p = \operatorname{sgn}(\sum_t \hat{\tau}_t^p)$, rather than a head-count vote. One strong `+1.10` update outweighs two smaller opposing updates `-0.50` and `-0.40`.
3. **Disjoint merge:** Average *only* the nonzero updates that agree with the elected sign, so trimmed zeros and opposing updates cannot dilute the surviving direction.

<figure>
  <img src="illustrations/_generated/ties_conflict_resolution_dark.png" alt="For three task vectors, density 0.5 keeps the two largest entries in each row. At p2 the surviving values −0.50, +1.10, and −0.40 sum to +0.20, so sign election keeps only +1.10. At p4 the values +0.80, −0.60, and +0.70 sum to +0.90, so the aligned mean is +0.75. The other two parameter coordinates trim to zero." />
  <figcaption>At p2, signed sum (+0.20) elects the positive direction despite two negative votes, keeping +1.10. At p4, the aligned updates (+0.80, +0.70) average to +0.75.</figcaption>
</figure>

Run all three TIES stages together on our three specialist task vectors in NumPy:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="ties-trim-elect-merge.py"
import numpy as np

deltas = np.array([
    [0.10, -0.50, 0.02,  0.80],  # Code
    [0.05,  1.10, 0.04, -0.60],  # Math
    [0.08, -0.40, 0.01,  0.70],  # Chat
])

def ties_merge(task_vectors: np.ndarray, density: float = 0.5) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    # 1. Trim: keep top-k entries by absolute magnitude in each row
    k = int(np.floor(task_vectors.shape[1] * density))
    trimmed = np.zeros_like(task_vectors)
    for r, row in enumerate(task_vectors):
        top_idx = np.argsort(-np.abs(row), kind="stable")[:k]
        trimmed[r, top_idx] = row[top_idx]

    # 2. Elect sign from aggregate signed mass (0 on exact tie)
    elected = np.sign(trimmed.sum(axis=0))

    # 3. Disjoint merge: average only nonzero entries matching elected sign
    aligned = (trimmed != 0.0) & (np.sign(trimmed) == elected)
    counts = aligned.sum(axis=0)
    merged = np.divide(
        np.where(aligned, trimmed, 0.0).sum(axis=0),
        counts,
        out=np.zeros(task_vectors.shape[1]),
        where=counts > 0,
    )
    return trimmed, elected, merged

trimmed, elected, merged = ties_merge(deltas, density=0.5)
print("1. trimmed rows:\n", trimmed)
print("2. elected signs:", elected.tolist())
print("3. merged delta: ", merged.tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1. trimmed rows:
 [[ 0.  -0.5  0.   0.8]
 [ 0.   1.1  0.  -0.6]
 [ 0.  -0.4  0.   0.7]]
2. elected signs: [0.0, 1.0, 0.0, 1.0]
3. merged delta:  [0.0, 1.1, 0.0, 0.75]
```
<!-- leetllm: output:end -->

### DARE (drop and rescale)

Rather than ranking entries by magnitude, **DARE** randomly drops entries of each task vector with probability $p$ and rescales surviving entries by $1 / (1 - p)$ before feeding them to Task Arithmetic or TIES:[^yu2023]

$$
\tau_i^{\text{DARE}} = \frac{\tau_i \odot m}{1 - p}, \qquad m_j \sim \operatorname{Bernoulli}(1 - p)
$$

Why does random dropping reduce parameter collisions so sharply? At $p = 0.90$, the chance that two nonzero deltas *both* survive at coordinate $j$ is $(1 - p)^2 = 0.01$ (1%). Neither survives with probability $p^2 = 81\%$, and exactly one survives with probability $2p(1 - p) = 18\%$. Among active coordinates where at least one update survives ($19\%$), $18/19 \approx 94.7\%$ carry only one specialist's update and only $1/19 \approx 5.3\%$ collide.

Dividing by $1 - p$ keeps every coordinate unbiased in expectation, at the cost of variance that grows as $\frac{p}{1 - p}\tau_j^2$:

$$
\mathbb{E}[\tau_j^{\text{DARE}}] = \tau_j,
\qquad
\operatorname{Var}(\tau_j^{\text{DARE}}) = \frac{p}{1 - p}\tau_j^2
$$

At $p = 0.90$, coordinate variance is $9\tau_j^2$; at $p = 0.99$, it jumps to $99\tau_j^2$. That explains why DARE worked even at 99% drop rate on WizardMath-70B SFT deltas yet degraded WizardLM-70B at 90%, and why continued-pretraining deltas (which have larger parameter changes) tolerate far less dropping than SFT deltas.[^yu2023]

<figure>
  <img src="illustrations/_generated/dare_mask_expectation_dark.png" alt="A fixed DARE example starts with task delta [0.2, −0.4, 0.1, 0.6], uses drop probability 0.5 and mask [0,0,1,1], then rescales kept entries by two to get [0,0,0.2,1.2]. Across all sixteen equally likely masks, each coordinate expectation returns to its original delta." />
  <figcaption>Each kept entry is divided by (1 - p) = 0.5, doubling its magnitude. Averaging across all 16 equiprobable masks recovers the exact original delta vector while doubling expected squared norm.</figcaption>
</figure>

Verify the exact mask expectation, variance jump, active-collision ratio, and why unbiased weights do not stay unbiased through a nonlinear ReLU:

<!-- leetllm: test, output=show -->
```python title="dare-drop-and-rescale.py"
from itertools import product

delta = [0.2, -0.4, 0.1, 0.6]
drop_rate = 0.5
keep_prob = 1.0 - drop_rate

def dare_apply(vec, mask, p):
    return [v / (1.0 - p) if kept else 0.0 for v, kept in zip(vec, mask)]

one_mask = dare_apply(delta, [0, 0, 1, 1], drop_rate)
all_outcomes = [dare_apply(delta, mask, drop_rate) for mask in product((0, 1), repeat=4)]
mean_delta = [round(sum(row[i] for row in all_outcomes) / len(all_outcomes), 4) for i in range(4)]
orig_sq_norm = sum(v * v for v in delta)
mean_sq_norm = sum(sum(v * v for v in row) for row in all_outcomes) / len(all_outcomes)

p90 = 0.90
active_only_one = 100 * (2 * p90 * (1 - p90)) / (1 - p90 ** 2)
active_both = 100 * ((1 - p90) ** 2) / (1 - p90 ** 2)

# Unbiased weight deltas still shift expectation after a nonlinear ReLU
relu_expected = sum(max(0.0, -0.75 + d) for d in (0.0, 2.0)) / 2

print("mask [0,0,1,1] rescaled:", one_mask)
print("exact mean over 16 masks:", mean_delta)
print(f"squared norm: original={orig_sq_norm:.2f} | expected masked={mean_sq_norm:.2f}")
print(f"at p=0.90 among active coords: 1 survivor={active_only_one:.1f}% | collision={active_both:.1f}%")
print(f"ReLU(-0.75 + 1.0)=0.25 vs expected masked ReLU={relu_expected:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mask [0,0,1,1] rescaled: [0.0, 0.0, 0.2, 1.2]
exact mean over 16 masks: [0.2, -0.4, 0.1, 0.6]
squared norm: original=0.57 | expected masked=1.14
at p=0.90 among active coords: 1 survivor=94.7% | collision=5.3%
ReLU(-0.75 + 1.0)=0.25 vs expected masked ReLU=0.625
```
<!-- leetllm: output:end -->

```checkpoint
Why does DARE divide by $1 - p$ after randomly zeroing entries?
---
Only a fraction $1 - p$ of task-vector entries survive masking. Dividing survivors by $1 - p$ preserves each coordinate's expected delta value instead of shrinking the task vector toward zero.
```

### SLERP (spherical linear interpolation)

When blending two equal-norm orthogonal vectors $\theta_A$ and $\theta_B$ linearly at $t = 0.5$, the midpoint cuts across the interior of the sphere and shrinks in length by $1 - 1/\sqrt{2} \approx 29.3\%$:

$$
\left\|\frac{\theta_A + \theta_B}{2}\right\| = \frac{R}{\sqrt{2}} \approx 0.707 R
$$

**SLERP**[^shoemake1985] instead travels along the great-circle arc on the hypersphere at constant angular velocity:

$$
\Omega = \arccos\!\left(\frac{\theta_A \cdot \theta_B}{\|\theta_A\| \|\theta_B\|}\right),
\qquad
\operatorname{SLERP}(\theta_A, \theta_B, t) = \frac{\sin((1 - t)\Omega)}{\sin \Omega}\theta_A + \frac{\sin(t\Omega)}{\sin \Omega}\theta_B
$$

For equal-norm vectors, SLERP keeps vector magnitude constant along the entire path. When directions are nearly parallel or antipodal (`|dot| > 0.9995`), implementations fall back to linear interpolation to avoid dividing by $\sin\Omega \approx 0$.[^mergekit2026slerp]

<figure>
  <img src="illustrations/_generated/slerp_geometry_dark.png" alt="On equal-scale axes, the vectors (1,0) and (0,1) lie on the unit circle. Their chord midpoint is (0.5,0.5), with norm 0.7071; the SLERP midpoint is approximately (0.7071,0.7071), with norm 1." />
  <figcaption>Linear interpolation cuts along the chord (norm 0.7071), whereas SLERP tracks the unit circle arc (norm 1.0).</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="slerp-spherical-linear-interpolation.py"
import numpy as np

def slerp(v0: np.ndarray, v1: np.ndarray, t: float, dot_threshold: float = 0.9995) -> np.ndarray:
    n0, n1 = np.linalg.norm(v0), np.linalg.norm(v1)
    if n0 == 0.0 or n1 == 0.0:
        return (1.0 - t) * v0 + t * v1
    dot = float(np.clip(np.dot(v0 / n0, v1 / n1), -1.0, 1.0))
    if abs(dot) > dot_threshold:
        return (1.0 - t) * v0 + t * v1
    omega = np.arccos(dot)
    sin_omega = np.sin(omega)
    return (np.sin((1.0 - t) * omega) / sin_omega) * v0 + (np.sin(t * omega) / sin_omega) * v1

v0, v1 = np.array([1.0, 0.0]), np.array([0.0, 1.0])
mid = slerp(v0, v1, 0.5)
antipodal = slerp(v0, -v0, 0.5)
unequal = slerp(v0, np.array([0.0, 2.0]), 0.5)

print("linear midpoint:      ", ((v0 + v1) / 2).tolist(), f"| norm={np.linalg.norm((v0 + v1) / 2):.4f}")
print("SLERP midpoint:       ", np.round(mid, 4).tolist(), f"| norm={np.linalg.norm(mid):.4f}")
print("antipodal fallback:   ", antipodal.tolist())
print("unequal-norm midpoint:", np.round(unequal, 4).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
linear midpoint:       [0.5, 0.5] | norm=0.7071
SLERP midpoint:        [0.7071, 0.7071] | norm=1.0000
antipodal fallback:    [0.0, 0.0]
unequal-norm midpoint: [0.7071, 1.4142]
```
<!-- leetllm: output:end -->

Note that `mergekit` applies SLERP tensor by tensor (requiring exactly two input models; multi-model spherical blends use Multi-SLERP), and you should still compare SLERP directly against linear and TIES candidates on held-out tasks.[^mergekit2026guide]

## Running a merge with mergekit

`mergekit` turns a YAML specification into a merged checkpoint on CPU or GPU, and `mergekit-multi` chains multi-stage recipes.[^mergekit2023] Here is a complete `dare_ties` configuration combining our three 8B specialists:

```yaml title="merge_config.yml"
models:
  - model: your-org/base-8b-code
    parameters:
      weight: 0.35
      density: 0.5       # fraction of task-vector entries kept (1 - p)
  - model: your-org/base-8b-math
    parameters:
      weight: 0.35
      density: 0.5
  - model: your-org/base-8b-chat
    parameters:
      weight: 0.30
      density: 0.5

merge_method: dare_ties
base_model: your-org/base-8b
tokenizer:
  source: base           # switch to union if a specialist added required tokens
chat_template: auto      # picks the most common input template; inspect before serving
parameters:
  normalize: true        # divide by weights of sign-aligned survivors
  rescale: true          # restore magnitude after random sparsification
  lambda: 1.0            # global scale on combined task vector
dtype: float32           # compute merge in float32 to preserve small deltas
out_dtype: bfloat16      # save final weights in bfloat16 (evaluate this saved artifact)
```

Run it from the command line (drop `--cuda` for CPU execution):

```bash title="terminal"
mergekit-yaml merge_config.yml ./output_model --cuda --random-seed 42
```

<details>
<summary>Deep dive: Library conventions in mergekit's dare_ties</summary>

Library implementations often make subtle choices that differ from textbook formulas:[^mergekit2026sparsify][^mergekit2026registry][^mergekit2026taskarithmetic]

- In `mergekit`, `dare_ties` replaces TIES's magnitude trimming with random sparsification (`density = 1 - p`), applies source `weight`s *before* sign election, breaks zero-sum ties positive, and with `normalize: true` divides by the sum of weights of aligned contributors.
- With `rescale: true`, `mergekit` rescales surviving entries to match the original tensor's realized L1 norm rather than dividing by the fixed constant $1 - p$.

Pin your `mergekit` version, random seed, `dtype`, `out_dtype`, and model revisions in every run manifest so merges remain reproducible.

</details>

### Why float32 intermediates and output precision matter

Bfloat16 has only 7 mantissa bits: the smallest representable step above `1.0` is `1.0078125`.[^googleBfloat162026] A subtle specialist delta of `+0.002` disappears completely if inputs are rounded to bfloat16 before merging, and a halfway merge (`1.001`) computed cleanly in float32 rounds right back to `1.0` once saved as bfloat16!

<!-- leetllm: test, deps=torch, output=show, output_title="Merge precision check" -->
```python title="merge-before-or-after-rounding.py"
import torch

base = torch.tensor([1.0], dtype=torch.float32)
specialist = torch.tensor([1.002], dtype=torch.float32)

wide_merge = base + 0.5 * (specialist - base)
rounded_inputs_merge = base + 0.5 * (
    specialist.to(torch.bfloat16).float() - base.to(torch.bfloat16).float()
)
saved_bf16 = wide_merge.to(torch.bfloat16).float()

print(f"bf16 step above 1.0        : {torch.finfo(torch.bfloat16).eps:.7f}")
print(f"float32 halfway merge      : {float(wide_merge):.6f}")
print(f"merged from bf16 inputs    : {float(rounded_inputs_merge):.6f}")
print(f"float32 merge saved as bf16: {float(saved_bf16):.6f}")
```

<!-- leetllm: output:start -->
```text title="Merge precision check" output compact
bf16 step above 1.0        : 0.0078125
float32 halfway merge      : 1.001000
merged from bf16 inputs    : 1.000000
float32 merge saved as bf16: 1.000000
```
<!-- leetllm: output:end -->

Always evaluate the *reloaded* artifact in its final `out_dtype`, because saving back to bfloat16 can erase small weight updates.

### Tokenizer and embedding alignment

Row $k$ of $W_{\text{emb}}$ and $W_{\text{head}}$ means whatever string the tokenizer assigns to ID $k$. `mergekit`'s vocabulary pipeline aligns rows by token string across sources and supports two primary policies:[^mergekit2026vocabulary][^mergekit2026embeddings]

- `tokenizer.source: base` keeps only the base vocabulary, dropping specialist-added tokens (like code fill-in-the-middle markers `<fim_prefix>`).
- `tokenizer.source: union` keeps the base tokenizer pipeline and appends extra token strings from specialists, filling missing embedding rows from the base, the sole donor, or the mean of available donors (falling back to zeros if none exists).

<figure>
  <img src="illustrations/_generated/tokenizer_row_alignment_dark.png" alt="Two tokenizer vocabularies can assign different strings to integer ID 417: one maps it to return and another to a newly added code token named fim_prefix. A union output vocabulary aligns embedding and language-model-head rows by token string." />
  <figcaption>Match embedding and output-head rows by token string rather than raw integer ID, and evaluate fallback rows for any newly added tokens.</figcaption>
</figure>

> **Common mistake:** Assuming same-base fine-tunes still share identical tokenizers. Code specialists frequently add fill-in-the-middle or tool-call special tokens. Choosing `base` silently drops them; choosing `union` keeps them but needs prompt testing to confirm the merged model uses the fallback rows cleanly.

<!-- leetllm: test, output=show -->
```python title="choose-output-vocabulary-policy.py"
def output_vocab(base_vocab: set[str], source_vocabs: list[set[str]], policy: str) -> set[str]:
    if policy == "base":
        return set(base_vocab)
    if policy == "union":
        return set(base_vocab).union(*source_vocabs)
    raise ValueError("policy must be 'base' or 'union'")

base_vocab = {"<bos>", "def", "return"}
code_vocab = base_vocab | {"<fim_prefix>"}
required_tokens = {"def", "<fim_prefix>"}

for policy in ("base", "union"):
    out = output_vocab(base_vocab, [base_vocab, code_vocab], policy)
    missing = sorted(required_tokens - out)
    added = sorted(out - base_vocab)
    print(f"policy={policy:5s} | missing_required={missing} | added_tokens_to_eval={added}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
policy=base  | missing_required=['<fim_prefix>'] | added_tokens_to_eval=[]
policy=union | missing_required=[] | added_tokens_to_eval=['<fim_prefix>']
```
<!-- leetllm: output:end -->

### Per-task evaluation thresholds

A clean disk write only confirms tensor shapes matched. Relying on a **macro average** hides specialist collapse:

$$
\text{Macro Average} = \frac{92.4 + 82.1 + 87.0}{3} = 87.2\%
$$

Check *both* an absolute minimum floor and a maximum regression relative to each source specialist (here at most `1.0` percentage point):

<figure>
  <img src="illustrations/_generated/merge_validation_loop_dark.png" alt="Evaluation gives Code 92.4, Math 82.1, and Chat 87.0, with absolute floors 90, 85, and 84 and source-regression floors 92, 87, and 86.5. Math misses both checks, so the 87.2 macro average fails per-task evaluation." />
  <figcaption>Each specialist slice must clear both its absolute floor and its maximum regression margin relative to the source model.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="evaluate-per-task-thresholds.py"
import math

def check_merge_slices(scores, floors, source_scores, max_drop_pp=1.0):
    failures = {}
    for task, floor in floors.items():
        val = scores.get(task)
        src = source_scores.get(task)
        if val is None or src is None or math.isnan(val):
            failures[task] = "missing_or_nan"
        elif val < floor:
            failures[task] = f"below floor ({val:.1f} < {floor:.1f})"
        elif src - val > max_drop_pp:
            failures[task] = f"regressed {src - val:.1f} pp > {max_drop_pp:.1f} pp"
    return failures

scores = {"code": 92.4, "math": 82.1, "chat": 87.0}
floors = {"code": 90.0, "math": 85.0, "chat": 84.0}
sources = {"code": 93.0, "math": 88.0, "chat": 87.5}

failures = check_merge_slices(scores, floors, sources, max_drop_pp=1.0)
print(f"macro average: {sum(scores.values()) / len(scores):.1f}%")
print("slice failures:", failures)
print("ship candidate:", not failures)

# Even clearing an absolute floor fails if regression exceeds 1.0 pp
regressed_only = check_merge_slices({"code": 91.5}, {"code": 90.0}, {"code": 93.0}, max_drop_pp=1.0)
print("absolute pass with 1.5pp drop:", regressed_only)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
macro average: 87.2%
slice failures: {'math': 'below floor (82.1 < 85.0)'}
ship candidate: False
absolute pass with 1.5pp drop: {'code': 'regressed 1.5 pp > 1.0 pp'}
```
<!-- leetllm: output:end -->

## Finding good coefficients automatically

Hand-tuning merge weights scales poorly: even 4 choices across 3 task vectors require $4^3 = 64$ evaluations. **Evolutionary model merging**[^sakana2024] uses black-box optimization (CMA-ES) to search per-layer interpolation weights (parameter space), layer routing/scaling paths (data-flow space), or both against a validation fitness function. For example, Sakana AI's EvoLLM-JP optimized merge recipes on translated GSM8K examples and verified transfer on disjoint MGSM benchmarks.[^sakana2024][^akiba2024merging]

Before reaching for evolutionary search, run a small coarse grid over your validation splits as a transparent baseline, and always keep a final held-out evaluation split completely untouched until the winning recipe is frozen.

## Passthrough and frankenmerging

Beyond blending weights, `mergekit`'s `passthrough` method splices entire layer ranges from different models (for instance, copying layers `0-19` from Code and `20-31` from Math) to build deeper or hybrid checkpoints ("frankenmerges").[^mergekit2023] Matching hidden dimensions let the spliced network run, though Math's upper layers still have to interpret hidden states from Code's lower layers, so frankenmerges typically need either careful layer-boundary search or brief healing fine-tuning plus full per-task evaluation.

## Merging pitfalls and hard limits

Avoid direct weight interpolation when:

1. **Incompatible architectures or tensor layouts:** Matching parameter counts or family names is not enough; layer depth, attention head layout, and projection dimensions must align.
2. **Different tokenizers without explicit mapping:** Align embeddings and output heads by token string and evaluate any newly added fallback rows.[^mergekit2023]
3. **Mismatched <span data-glossary="chat-template">chat templates</span>:** Even when weights merge cleanly, mismatched stop tokens or role delimiters break generation at inference time.
4. **<span data-glossary="quantization">Quantized</span> checkpoints:** Always merge full-precision floating-point weights, then re-run quantization <span data-glossary="calibration">calibration</span> and evaluation on the merged model.
5. **Distant fine-tuning trajectories:** Independently pretrained models or heavy full-parameter shifts often cross high-loss barriers.[^ainsworth2022]
6. **Unchecked macro averages:** Never ship a merge that breaks a required specialist slice just because the overall average rose.

### Diagnosing a broken merge

Debug in strict order: first verify tensor keys, shapes, tokenizer mapping, and chat template; next compare against each source specialist on identical decoding settings; only then adjust merge coefficients or switch methods.

| Symptom | Likely cause | First check |
|---|---|---|
| Incoherent or random tokens | Tokenizer/head row mismatch, bad chat template, or incompatible architecture | Verify vocabulary policy, special tokens, and layer shapes |
| Repetitive looping | Prompt serialization drift, decoding settings, or destructive weight interference | Replay with identical verified templates and test a smaller $\lambda$ |
| Worse than every source specialist | Heavy delta conflict or incompatible base lineage | Confirm shared base checkpoint; try TIES or DARE-TIES |

A high average can mask a broken specialist, and merged weights still store only parametric memory. Next, we turn to retrieval indexes that supply fresh external evidence under tight latency and memory budgets.

```mastery-quiz
[
  {
    "question": "Two checkpoints have equal tensor shapes and output vocabulary. One was initialized independently and its hidden units were reordered. Which next step is justified?",
    "options": [
      "Directly average because equal shapes establish matching learned roles.",
      "Inspect lineage and functional alignment before treating matching tensor indices as comparable.",
      "Copy one tokenizer because vocabulary choice recovers hidden-unit order.",
      "Raise the interpolation coefficient because larger weights undo permutations."
    ],
    "answer": "Inspect lineage and functional alignment before treating matching tensor indices as comparable.",
    "explanation": "Matching tensor shapes and vocabularies do not imply matching hidden-unit permutations. Check shared base lineage or functional alignment before averaging."
  },
  {
    "question": "Both endpoint checkpoints pass evaluation, but the midpoint of their linear interpolation fails badly. What does that result establish?",
    "options": [
      "The endpoints are incompatible despite matching lineage and shapes, so tokenizer repair should precede any path evaluation.",
      "Evaluate intermediate points because quality can vary along the path even when both endpoints pass.",
      "The lower-scoring endpoint should be removed from the merge set, because endpoint quality determines every interior point.",
      "The interpolation should be renormalized toward the midpoint, because coefficients summing to one guarantee path quality."
    ],
    "answer": "Evaluate intermediate points because quality can vary along the path even when both endpoints pass.",
    "explanation": "A linear path can cross a high-loss barrier between two passing endpoints, so interior interpolation points must be evaluated directly."
  },
  {
    "question": "A base coordinate is 4.0. Two specialists have values 4.8 and 3.4. Their delta coefficients are 0.5 and 0.25. What merged coordinate follows?",
    "options": [
      "4.25",
      "3.25",
      "4.55",
      "4.10"
    ],
    "answer": "4.25",
    "explanation": "The deltas are +0.8 and -0.6. Computing 4.0 + 0.5(0.8) + 0.25(-0.6) = 4.0 + 0.4 - 0.15 = 4.25."
  },
  {
    "question": "At one coordinate after TIES trimming, three surviving updates are +1.6, -0.5, and -0.6. Which direction and disjoint mean follow under the TIES rule?",
    "options": [
      "Negative direction and -0.55 mean, because two signs are negative.",
      "Positive direction and +0.1667 mean, because all entries stay in the divisor.",
      "Positive direction and +1.6 mean, because the signed sum is +0.5.",
      "Negative direction and -1.1 mean, because opposite signs must be removed first."
    ],
    "answer": "Positive direction and +1.6 mean, because the signed sum is +0.5.",
    "explanation": "TIES elects the sign of the aggregate signed sum: 1.6 - 0.5 - 0.6 = +0.5 (positive). Only +1.6 aligns with positive, so the disjoint mean is +1.6."
  },
  {
    "question": "A DARE entry originally equals -0.3 and is dropped with probability 0.75. Which surviving value preserves its signed expectation?",
    "options": [
      "-0.3, because random masks preserve scale without rescaling.",
      "-0.075, because the original should be multiplied by survival probability.",
      "+1.2, because magnitude is preserved while signs are discarded.",
      "-1.2, because it survives with probability 0.25."
    ],
    "answer": "-1.2, because it survives with probability 0.25.",
    "explanation": "Dividing by survival probability 1 - p = 0.25 gives -0.3 / 0.25 = -1.2, so 0.25(-1.2) + 0.75(0) = -0.3."
  },
  {
    "question": "A SLERP merge has a smooth constant-radius path but lower coding accuracy than linear interpolation. What should be concluded?",
    "options": [
      "Prefer SLERP because constant norm is the binding merge criterion, then defer coding regression to task-specific fine-tuning.",
      "SLERP sets a geometric path on the sphere. Keep the method that passes task evaluation.",
      "Treat the lower score as evidence of tokenizer incompatibility, without checking whether linear and spherical paths differ in task interference.",
      "Extrapolate beyond the endpoint angle and select by geometric smoothness before rerunning coding evaluation."
    ],
    "answer": "SLERP sets a geometric path on the sphere. Keep the method that passes task evaluation.",
    "explanation": "SLERP controls vector-norm geometry along the path, but downstream task evaluation decides which merged checkpoint ships."
  },
  {
    "question": "The Base tokenizer assigns 'yield' ID 621. The Code tokenizer assigns 'yield' ID 84 and uses ID 621 for a fill-in-the-middle marker that Base lacks. The tokenizers are otherwise compatible. The serving template needs the marker as one special token. Which Code rows should you pair with Base row 621, and how should you handle the marker?",
    "options": [
      "Use Code input row 621 and head row 621. Split the marker into ordinary tokens and test the serving template.",
      "Use Code input row 84 and head row 84. Keep the marker as a special token and test the serving template.",
      "Use Code input row 84 and head row 621. Keep the marker as a special token and test the serving template.",
      "Use Code input row 84 and head row 84. Split the marker into ordinary tokens and test the serving template."
    ],
    "answer": "Use Code input row 84 and head row 84. Keep the marker as a special token and test the serving template.",
    "explanation": "Align both input embeddings and the output head by token string ('yield' is Base 621 and Code 84), preserve the special marker token in the union vocabulary, and test the serving template."
  },
  {
    "question": "A merge raises the average task score from 88.0% to 91.0%. On the same math cases, the merge scores 88.6% and the specialist scores 89.8%. Release requires at least 89.0% on math and allows a loss of up to 1.5 percentage points against the specialist. All other checks pass. Which decision follows?",
    "options": [
      "Promote. The 3.0-point gain in the task average offsets the 0.4-point shortfall on math.",
      "Hold. Math is 2.4 points below the new task average, beyond the 1.5-point allowance.",
      "Promote. Applying the 1.5-point allowance to the math floor lowers the minimum to 87.5%.",
      "Hold. Math clears the specialist minimum of 88.3% but misses the 89.0% floor."
    ],
    "answer": "Hold. Math clears the specialist minimum of 88.3% but misses the 89.0% floor.",
    "explanation": "Math clears the specialist regression floor (89.8% - 1.5% = 88.3%) at 88.6%, yet misses the absolute 89.0% floor, so the merge cannot ship."
  },
  {
    "question": "Two initially nonzero deltas are independently dropped with probability 0.8 each. Among draws in which at least one delta survives, what percentage keep both? Round to one decimal place.",
    "options": [
      "4.0%",
      "20.0%",
      "11.1%",
      "64.0%"
    ],
    "answer": "11.1%",
    "explanation": "Both survive with probability 0.2 x 0.2 = 4%; both drop with probability 0.8 x 0.8 = 64%, leaving 36% active draws. Conditional on at least one survivor, 4 / 36 ≈ 11.1%."
  },
  {
    "question": "Each of three rank-one adapters changes just one entry of the same weight matrix. The entries occupy three different positions on the main diagonal, and each adapter has a nonzero scale. Which construction can represent their sum exactly?",
    "options": [
      "Concatenate their weighted factors, allowing rank up to three.",
      "Average the three A factors and three B factors separately at rank one.",
      "Keep the adapter with the largest scale and discard the other directions.",
      "Truncate the sum to rank one, retaining exactness because each source was rank one."
    ],
    "answer": "Concatenate their weighted factors, allowing rank up to three.",
    "explanation": "Three distinct diagonal updates sum to a rank-3 matrix. Concatenating the scaled B columns and stacking the A rows represents that sum exactly."
  }
]
```

> **Next:** Continue to [Vector DB Internals: HNSW & IVF](/learn/vector-database-internals-hnsw-ivf). Training, adaptation, distillation, and merging all sit under per-task evaluation checks. Next we move to the systems around those models, starting with retrieval indexes: <span data-glossary="hnsw">HNSW</span>, IVF, and <span data-glossary="product-quantization">Product Quantization</span> decide which evidence reaches a merged assistant under latency and memory limits.
