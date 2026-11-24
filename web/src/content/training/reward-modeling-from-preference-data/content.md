---
{
  "id": "reward-modeling-from-preference-data",
  "title": "Reward Modeling from Preference Data",
  "slug": "reward-modeling-from-preference-data",
  "section": "Advanced Training & Adaptation",
  "category": "Alignment & Safety",
  "difficulty": "Hard",
  "order": 11,
  "coverImage": "illustrations/_generated/reward_modeling_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google DeepMind",
    "Meta"
  ],
  "shortDescription": "A longer answer can still be the wrong one. Fit a scalar reward on chosen and rejected pairs, then test whether the score learned technical accuracy or a shortcut such as length.",
  "keyConceptsTested": [
    "reward model role in RLHF",
    "chosen/rejected dataset formats",
    "preference-pair validation and leakage-safe splitting",
    "sequence-classification reward head",
    "Bradley-Terry preference loss",
    "reward-model metrics and calibration",
    "centered rewards and margin tracking",
    "distribution shift and reward hacking",
    "when DPO bypasses explicit reward models"
  ],
  "prerequisites": [
    "training-run-operations",
    "lora-parameter-efficient-fine-tuning",
    "supervised-fine-tuning-pipeline",
    "instruction-tuning-chat-templates",
    "data-labeling-human-feedback-active-learning"
  ],
  "relatedQuestions": [
    "rlhf-dpo-aligning-language-models",
    "rlvr-verifiable-rewards-training",
    "constitutional-ai-automated-red-teaming"
  ]
}
---
<!-- leetllm: edition:reference:start -->

A developer asks a coding assistant how to prevent exponential overflow in `softmax(z)`. One reply gives the exact fix in two sentences: subtract `max(z)` from every logit before calling `exp(z)` so the largest exponent is zero. A second reply looks warm and thorough, yet advises casting the array to `float64` *after* computing `exp(z)`, which still overflows before any cast runs. Which reply should earn the higher score?

<span data-glossary="supervised-fine-tuning">Supervised fine-tuning (SFT)</span> teaches a model to imitate demonstration tokens, whereas reward modeling trains a scalar scorer to separate preferred answers from rejected ones on the same prompt. In <span data-glossary="rlhf">RLHF</span> (Reinforcement Learning from Human Feedback), that scorer sits inside <span data-glossary="ppo">Proximal Policy Optimization (PPO)</span> or best-of-$N$ selection.[^ouyang2022] If the scorer learns to reward extra length or confident phrasing instead of technical accuracy, policy optimization amplifies the shortcut rather than fixing it.[^gao2023scaling] Throughout this lesson, we use this softmax stability question to trace how a reward head learns, how to tell score origin apart from scale, and how to expose shortcuts before RL exploits them.

## How a scalar judge scores a completed answer

An autoregressive language model predicts a probability distribution over the vocabulary $V$ at every token position, $\pi_\theta(y_t \mid x, y_{<t}) \in \Delta^{|V|-1}$. A <span data-glossary="reward-model">reward model</span> instead evaluates the full prompt and completed response $(x, y)$ together, projecting the final hidden state down to one real number:

$$
r_\theta(x, y) \in \mathbb{R}
$$

For our softmax prompt $x$, an annotator prefers the chosen completion $y_w$ (subtract `max(z)` first) over the rejected completion $y_l$ (cast after `exp(z)`). Training pushes the scorer toward $r(x, y_w) > r(x, y_l)$. Because pairwise comparisons record only relative order, adding a constant offset to every score leaves all rankings untouched: a score of `2.0` is not "twice as good" as `1.0`, and two independently trained reward models cannot be compared directly without shared calibration data. Scaling all scores by a positive factor, however, stretches their pairwise gaps, sharpening Bradley-Terry probabilities and changing downstream RL optimization pressure.

That scalar score drives two post-training workflows:

1. **Terminal reward for online RL:** The scorer evaluates completed policy rollouts as a sequence-level return. PPO pairs those rewards with a learned value baseline via Generalized Advantage Estimation (GAE), whereas outcome-supervised GRPO normalizes rewards across a group of rollouts sampled for the same prompt without a separate value network.[^shao2024]
2. **Best-of-$N$ selection:** A generator samples $N$ completions for prompt $x$ and picks $\arg\max_i r(x, y_i)$, used both at inference time and to curate synthetic training data.

<span data-glossary="dpo">Direct Preference Optimization (DPO)</span> uses the exact analytic link between a reward function and its KL-regularized optimal policy to express rewards as policy-to-reference log-ratios, turning pairwise loss directly into a policy objective without a separate scorer.[^rafailov2023] Explicit reward models remain valuable whenever you want fast reusable scoring across fresh rollouts, best-of-$N$ ranking, or shared feedback alongside executable verifiers and generative judges.[^lambert2024rlvr]

## Preference data anatomy and validation pipeline

Pairwise cross-entropy fits whatever ordering sits in the dataset, including prompt mismatches, collapsed duplicates, and systematic annotator habits. Inspecting raw preference records early saves compute from degenerate comparisons.

### Standard and conversational preference formats

Explicit-prompt datasets store one shared `prompt` alongside `chosen` and `rejected` completions, guaranteeing identical context tokens on both sides and making prompt-grouped splitting simple:

```json title="preference_pair.json"
{
  "prompt": "How do you prevent exponential overflow when implementing softmax in Python?",
  "chosen": "Subtract max(z) from each logit before calling exp(z) so the largest exponent is zero.",
  "rejected": "Cast the output array to float64 after calling exp(z) so large values fit safely."
}
```

Multi-turn dialogues store full role-tagged message lists for `chosen` and `rejected`. Both transcripts must match token for token through the system prompt and prior turns, diverging only at the final assistant reply:

```json title="chat_preference_pair.json"
{
  "chosen": [
    {"role": "system", "content": "Give concise, numerically accurate Python advice."},
    {"role": "user", "content": "How do you prevent exponential overflow when implementing softmax in Python?"},
    {"role": "assistant", "content": "Subtract max(z) from each logit before calling exp(z) so the largest exponent is zero."}
  ],
  "rejected": [
    {"role": "system", "content": "Give concise, numerically accurate Python advice."},
    {"role": "user", "content": "How do you prevent exponential overflow when implementing softmax in Python?"},
    {"role": "assistant", "content": "Cast the output array to float64 after calling exp(z) so large values fit safely."}
  ]
}
```

Hugging Face TRL's `RewardTrainer` accepts both plain strings and conversational message lists. Conversational rows pass through the tokenizer's <span data-glossary="chat-template">chat template</span>, whereas raw strings concatenate directly without conversation delimiters.[^trl2026RewardTrainerV117]

### Pair checks before training

Before batching pairs into gradient updates, check four data properties so gradients reflect response quality rather than preprocessing defects:

- **Identical context prefix:** Both completions share the exact same prompt, system instructions, tool declarations, and template delimiters.
- **Distinct tokenized inputs:** If whitespace normalization, templating, or truncation collapses `chosen` and `rejected` into identical token IDs and masks, a deterministic shared scorer outputs identical scores, giving zero margin and zero gradient. Check uniqueness both before and after tokenization.
- **Labels matching the objective:** Winner-only Bradley-Terry loss expects strict preferences; ties and noisy disagreements need soft targets or dedicated tie-aware losses rather than silent dropping.
- **Candidate lineage:** Store generator checkpoint, decoding temperature, and reviewer cohort so later slice checks can trace source artifacts.

Watch how three common data defects filter out before training:

<!-- leetllm: test, output=show, output_title="Pair hygiene output" -->
```python title="preference_pair_checks.py"
from collections import Counter

pairs = [
    {"id": "a", "prompt_left": "softmax?", "prompt_right": "softmax?", "chosen": "Subtract max(z).", "rejected": "Cast after exp(z).", "label": "chosen"},
    {"id": "b", "prompt_left": "softmax?", "prompt_right": "softmax?", "chosen": "Subtract max(z).", "rejected": "Subtract max(z).", "label": "chosen"},
    {"id": "c", "prompt_left": "softmax?", "prompt_right": "attention?", "chosen": "Subtract max(z).", "rejected": "Scale by sqrt(d).", "label": "chosen"},
    {"id": "d", "prompt_left": "attention?", "prompt_right": "attention?", "chosen": "Scale by sqrt(d).", "rejected": "Omit scaling.", "label": "tie"},
]


def check_pair(pair: dict[str, str]) -> str | None:
    if any(not pair.get(k, "").strip() for k in ("prompt_left", "prompt_right", "chosen", "rejected")):
        return "missing_or_empty_text"
    if pair.get("label") != "chosen":
        return "tie_or_abstention"
    if pair["prompt_left"] != pair["prompt_right"]:
        return "context_mismatch"
    if pair["chosen"].strip() == pair["rejected"].strip():
        return "identical_candidates"
    return None


reasons = Counter(reason for p in pairs if (reason := check_pair(p)))
kept = [p["id"] for p in pairs if check_pair(p) is None]
print(f"kept={kept}")
print(f"rejected={dict(sorted(reasons.items()))}")
```

<!-- leetllm: output:start -->
```text title="Pair hygiene output" output compact
kept=['a']
rejected={'context_mismatch': 1, 'identical_candidates': 1, 'tie_or_abstention': 1}
```
<!-- leetllm: output:end -->

### Choose an evaluation split that matches generalization

One prompt with $K = 4$ ranked responses expands into $\binom{4}{2} = 6$ pairs. Splitting those rows randomly leaks the same prompt and completions into both train and validation, turning validation accuracy into memorization. Group comparisons by `prompt_id` (and near-duplicate prompt clusters) when testing generalization to unseen prompts, or explicitly label a response-held-out split when evaluating new replies to fixed prompts.

<!-- leetllm: test, output=show, output_title="Grouped split output" -->
```python title="grouped_preference_split.py"
pairs = [
    {"pair_id": "a-b", "prompt_id": "softmax-17"},
    {"pair_id": "a-c", "prompt_id": "softmax-17"},
    {"pair_id": "d-e", "prompt_id": "attention-04"},
    {"pair_id": "f-g", "prompt_id": "pooling-09"},
]
eval_prompts = {"softmax-17"}

train = [p for p in pairs if p["prompt_id"] not in eval_prompts]
validation = [p for p in pairs if p["prompt_id"] in eval_prompts]
overlap = {p["prompt_id"] for p in train} & {p["prompt_id"] for p in validation}

print(f"train_pairs={len(train)} eval_pairs={len(validation)} prompt_overlap={sorted(overlap)}")
```

<!-- leetllm: output:start -->
```text title="Grouped split output" output compact
train_pairs=2 eval_pairs=2 prompt_overlap=[]
```
<!-- leetllm: output:end -->

> **Key insight:** InstructGPT ranked $K = 4$ to $K = 9$ completions per prompt and placed all $\binom{K}{2}$ pairs from one prompt into a single batch item, scoring each completion once and averaging the pairwise losses within the prompt.[^ouyang2022] Without within-prompt averaging, a prompt with $K = 9$ candidates carries 36 times the loss weight of a prompt with $K = 2$.

## Turning a language model into a scalar scorer

Converting an autoregressive transformer into a reward model takes one head swap. InstructGPT initialized its reward models from an SFT checkpoint (and also tested a checkpoint fine-tuned on public NLP data with similar results),[^ouyang2022] while Llama 3 initialized directly from a pretrained base model.[^dubey2024]

1. Remove the vocabulary unembedding projection $W_{\text{lm}} \in \mathbb{R}^{d \times |V|}$.
2. Attach a linear scalar head $W_r \in \mathbb{R}^{d \times 1}$. Any additive scalar bias cancels out of pairwise differences and receives zero gradient from Bradley-Terry loss.
3. Fine-tune all weights, train LoRA adapters alongside the scalar head, or train the head on frozen features. Under LoRA, ensure the scalar head is marked trainable and saved alongside the adapters.[^huggingface2026rewardSource]

```text
Input Tokens -> Transformer Hidden States (d) -> Last-Token Representation -> Linear Head -> Scalar Reward r(x, y)
```

### Final real-token pooling and sequence padding

In causal decoder attention, position $t$ attends only to positions $j \le t$. Reading from any earlier token omits the rest of the answer. Gathering the **final non-padding token** (typically the end-of-turn delimiter) ensures the hidden vector summarizes the entire prompt and response.

Batch padding shifts where that final token sits: under **left padding**, it sits at index `-1`; under contiguous **right padding**, it sits at `mask.sum(dim=-1) - 1`. Always index explicitly via the attention mask rather than assuming padding activations stay near zero:

<!-- leetllm: test, deps=numpy, output=show, output_title="Reward pooling index output" -->
```python title="last_nonpadding_reward.py"
import numpy as np


def last_nonpadding(hidden: np.ndarray, mask: np.ndarray) -> np.ndarray:
    positions = np.arange(mask.shape[1])
    last_idx = np.where(mask == 1, positions, -1).max(axis=1)
    return hidden[np.arange(len(hidden)), last_idx]


# Padding slots contain large sentinel activations [99, 99] that must be ignored.
states = np.array([
    [[1., 0.], [2., 3.], [99., 99.]],  # right-padded
    [[99., 99.], [1., 0.], [2., 3.]],  # left-padded
])
masks = np.array([[1, 1, 0], [0, 1, 1]])

pooled = last_nonpadding(states, masks)
scores = pooled @ np.array([0.5, 1.0])
print("pooled vectors:", pooled.tolist())
print("right/left-padded scores:", scores.tolist())
```

<!-- leetllm: output:start -->
```text title="Reward pooling index output" output compact
pooled vectors: [[2.0, 3.0], [2.0, 3.0]]
right/left-padded scores: [4.0, 4.0]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/last_real_token_readout_dark.png" alt="Right-padded tokens have mask [1, 1, 0], and left-padded tokens have mask [0, 1, 1]. Both select the final real hidden state [2, 3] and ignore the padding hidden state [99, 99]. The shared reward head [0.5, 1.0] gives score 4.0 in either layout." />
  <figcaption>Mask-indexed readout selects the final unmasked token regardless of padding side, producing score 4.0 for both sequences while ignoring padding values.</figcaption>
</figure>

### Filtering long sequences vs. truncating suffixes

If an annotator rejected an answer because of a bug in its final code block, right-truncating the sequence strips away the exact reason for the label. Filtering oversized pairs preserves label fidelity while shifting the length distribution, so log which prompts get dropped. TRL's `RewardConfig` defaults to `max_length=1024` across the full templated prompt plus completion and filters oversized pairs rather than slicing their endings unless configured otherwise.[^trl2026RewardTrainerV117][^trl2026RewardConfigV117]

## Bradley-Terry formulation, BCE loss, and gradient dynamics

Suppose our reward head scores the `max(z)`-shifted softmax answer at $r(x, y_w) = 1.80$ and the post-`exp` cast answer at $r(x, y_l) = 0.70$, giving margin $\Delta = 1.80 - 0.70 = +1.10$. The **Bradley-Terry** preference model maps that margin to a win probability through the logistic sigmoid:

$$
P(y_w \succ y_l \mid x) = \frac{\exp(r(x, y_w))}{\exp(r(x, y_w)) + \exp(r(x, y_l))} = \sigma\big(r(x, y_w) - r(x, y_l)\big)
$$

At $\Delta = 1.10$, $P(y_w \succ y_l \mid x) = \sigma(1.10) \approx 0.7503$. Any positive margin yields probability above 0.50; zero margin gives 0.50.

<figure>
  <img src="illustrations/_generated/reward_modeling_dark.png" alt="The same scalar reward head scores a chosen completion at 1.80 and a rejected completion at 0.70. Their 1.10 margin lands at 0.7503 on the sigmoid curve, giving pair loss 0.2873." />
  <figcaption>Bradley-Terry maps the score margin 1.80 − 0.70 = 1.10 through the logistic sigmoid to win probability 0.7503 and negative log-likelihood 0.2873.</figcaption>
</figure>

### Direct equivalence to binary cross-entropy with logits

Minimizing the negative log-likelihood over preference dataset $\mathcal{D}$ gives:

$$
\mathcal{L}_{\text{BT}}(\theta) = -\mathbb{E}_{(x, y_w, y_l) \sim \mathcal{D}} \Big[ \log \sigma\big(r_\theta(x, y_w) - r_\theta(x, y_l)\big) \Big]
$$

This is identical to binary cross-entropy (BCE) with target $z = 1$ on logit $\Delta = r_w - r_l$, and equal to $\operatorname{softplus}(-\Delta) = \log(1 + e^{-\Delta})$. Computing it directly on logits via `binary_cross_entropy_with_logits` or `softplus` avoids underflow when $\sigma(\Delta)$ rounds to zero. Notice also what happens when we add a shared `bias = 10.0` to both scores: its gradient is identically zero.

<!-- leetllm: test, deps=torch, output=show, output_title="BCE and score-gradient output" -->
```python title="bce_loss_equivalence.py"
import torch

rewards = torch.tensor([[1.8, 0.7]], dtype=torch.float64, requires_grad=True)
bias = torch.tensor(10.0, dtype=torch.float64, requires_grad=True)

scores = rewards + bias
logits_diff = scores[:, 0] - scores[:, 1]
loss = torch.nn.functional.binary_cross_entropy_with_logits(
    logits_diff, torch.ones_like(logits_diff)
)
loss.backward()

print(f"loss={loss.item():.4f} (softplus={torch.nn.functional.softplus(-logits_diff).item():.4f})")
print(f"chosen_grad={rewards.grad[0, 0].item():+.4f}, rejected_grad={rewards.grad[0, 1].item():+.4f}")
print(f"shared_bias_grad={bias.grad.item():.1f}")
```

<!-- leetllm: output:start -->
```text title="BCE and score-gradient output" output compact
loss=0.2873 (softplus=0.2873)
chosen_grad=-0.2497, rejected_grad=+0.2497
shared_bias_grad=0.0
```
<!-- leetllm: output:end -->

### Gradient dynamics and shared-weight movement

Differentiating $\mathcal{L}_{\text{BT}} = -\log\sigma(\Delta)$ gives equal-and-opposite score derivatives:

$$
\frac{\partial \mathcal{L}}{\partial r_w} = \sigma(\Delta) - 1 \le 0,
\qquad
\frac{\partial \mathcal{L}}{\partial r_l} = 1 - \sigma(\Delta) \ge 0.
$$

Training pressure concentrates where the model is wrong: confidently correct pairs ($\Delta \gg 0$) have derivatives near 0; ties ($\Delta = 0$) have derivatives $-0.5$ and $+0.5$; confidently inverted rankings ($\Delta \ll 0$) saturate near $-1$ and $+1$.

> **Common mistake:** Assuming opposite score gradients force $r_w$ up and $r_l$ down after a parameter update. Because both responses share parameters $\theta$, both raw scores can drop simultaneously while the margin still widens.

Watch a single shared scalar weight $r = wh$ initialized at $w = -1$ on frozen features $h_w = 1, h_l = 2$. One SGD step pushes $w$ more negative, lowering **both** scores while dropping $r_l$ twice as fast so the margin grows from `1.0000` to `1.0269`:

<!-- leetllm: test, deps=torch, output=show, output_title="Shared-head score movement" -->
```python title="shared_reward_head_update.py"
import torch

weight = torch.nn.Parameter(torch.tensor(-1.0, dtype=torch.float64))
features = torch.tensor([1.0, 2.0], dtype=torch.float64)
optimizer = torch.optim.SGD([weight], lr=0.1)

before = (weight * features).detach().clone()
scores = weight * features
loss = torch.nn.functional.softplus(-(scores[0] - scores[1]))
loss.backward()
optimizer.step()
after = (weight * features).detach()

print("before:", [round(v, 4) for v in before.tolist()])
print("after: ", [round(v, 4) for v in after.tolist()])
print(f"margin: {before[0] - before[1]:.4f} -> {after[0] - after[1]:.4f}")
```

<!-- leetllm: output:start -->
```text title="Shared-head score movement" output compact
before: [-1.0, -2.0]
after:  [-1.0269, -2.0538]
margin: 1.0000 -> 1.0269
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/shared_reward_head_update_dark.png" alt="One shared scalar parameter w starts at minus 1, scoring chosen feature 1 as minus 1 and rejected feature 2 as minus 2. One gradient step changes w to minus 1.0269; both scores fall to minus 1.0269 and minus 2.0538, while the chosen-minus-rejected margin grows from 1.0000 to 1.0269." />
  <figcaption>A shared-parameter gradient step lowers both scores while moving the rejected score twice as far, widening the margin from 1.0000 to 1.0269.</figcaption>
</figure>

### Translation invariance vs. scale sensitivity

Adding any prompt-dependent offset $c(x)$ to both completions leaves $\Delta = r_w - r_l$ unchanged, so `(11.80, 10.70)` has the exact same loss and gradients as `(1.80, 0.70)`. Multiplying both scores by 3 triples the margin from `1.10` to `3.30`, pushing the implied win probability to `0.9644`. On separable training batches, a model can shrink loss indefinitely just by scaling weights upward, which is why L2 regularization and held-out calibration matter.

## Training a small reward head and isolating shortcut features

A two-feature linear reward head $r = w^T h$ with features `[correctness, scaled_length]` reproduces the core shortcut failure on CPU. In the **confounded** dataset, every correct softmax fix is also one unit longer than the buggy alternative. In the **balanced** dataset, a concise fix beats a verbose error, breaking the correlation.

Both heads hit 100% training accuracy after 300 gradient steps, yet when evaluated on length-reversed counterexamples where a long padded answer recommends casting after `exp(z)`, the confounded head collapses to 33%:

<!-- leetllm: test, deps=numpy, output=show, output_title="Learned reward-head shortcut" -->
```python title="train_tiny_reward_head.py"
import numpy as np


def fit_reward_head(pairs: np.ndarray, l2: float = 0.02, lr: float = 0.1, steps: int = 300) -> np.ndarray:
    weights = np.zeros(pairs.shape[-1])
    diffs = pairs[:, 0] - pairs[:, 1]
    for _ in range(steps):
        margins = diffs @ weights
        # Derivative of log(1 + exp(-margin)) is -1 / (1 + exp(margin)).
        sig_neg = np.exp(-np.logaddexp(0.0, margins))
        grad = -(diffs.T @ sig_neg) / len(pairs) + l2 * weights
        weights -= lr * grad
    return weights


def pair_accuracy(weights: np.ndarray, pairs: np.ndarray) -> float:
    return float(np.mean((pairs[:, 0] - pairs[:, 1]) @ weights > 0))


# Features per candidate: [correctness, scaled_length].
confounded = np.array([[[1., 1.], [0., 0.]], [[1., 2.], [0., 1.]]])
balanced = np.array([[[1., 1.], [0., 0.]], [[1., 0.], [0., 1.]]])
counterexamples = np.array([
    [[1., 0.], [0., 2.]],  # short fix vs. verbose bug
    [[1., 0.], [0., 3.]],  # short fix vs. very verbose bug
    [[1., 1.], [0., 1.]],  # equal-length pair
])

for name, data in [("confounded", confounded), ("balanced", balanced)]:
    w = fit_reward_head(data)
    print(f"{name:10s}: weights={w.round(3).tolist()}, train={pair_accuracy(w, data):.2f}, counterexamples={pair_accuracy(w, counterexamples):.2f}")
```

<!-- leetllm: output:start -->
```text title="Learned reward-head shortcut" output compact
confounded: weights=[1.629, 1.629], train=1.00, counterexamples=0.33
balanced  : weights=[2.667, 0.0], train=1.00, counterexamples=1.00
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/reward_generalization_gap_dark.png" alt="The first counterexample, chosen feature vector (1, 0) and verbose-error vector (0, 2), is projected by two heads fitted for 300 updates. On shared equal-unit axes, the confounded weight direction (1.629, 1.629) scores them 1.629 and 3.259; the balanced direction (2.667, 0) scores them 2.667 and 0. Both heads fit 2 of 2 training pairs, while their measured accuracy on the three controlled counterexamples is 1 of 3 and 3 of 3." />
  <figcaption>Both heads reach 2 of 2 on their training pairs, yet only the balanced head keeps the concise fix ahead of the verbose error (3 of 3 vs. 1 of 3).</figcaption>
</figure>

The confounded head lands at $w \approx [1.629, 1.629]$ because correctness and length move in lockstep across training pairs. On the first counterexample, the verbose bug $(0, 2)$ scores $3.258$ and beats the concise fix $(1, 0)$ at $1.629$. In the balanced set, difference vectors $[1, 1]$ and $[1, -1]$ cancel length gradients identically, isolating correctness at $[2.667, 0.0]$. L2 regularization shrinks weight magnitude without knowing which feature is spurious; contrast data removes the shortcut.

```checkpoint
Suppose you remove L2 regularization while keeping the balanced training pairs and zero initial weights. Does the length weight grow during training?
---
No. Because the two training pairs have equal correctness differences and opposite length differences, their gradients on the length coordinate still cancel exactly at zero length weight. Data symmetry drives that cancellation, whereas L2 regularization only shrinks weights toward zero.
```

<details>
<summary>Deep dive: Multi-response rankings and rating-strength margins</summary>

When annotators rank $K > 2$ responses per prompt, pipelines either average all $\binom{K}{2}$ pairs within the prompt group[^ouyang2022] or fit a Plackett-Luce multinomial distribution over the full permutation.

When preference strength labels exist ("much better" vs. "slightly better"), Llama 2 added a rating-dependent margin $m(x, y_w, y_l) \ge 0$ inside the sigmoid:[^touvron2023a]

$$
\mathcal{L}_{\text{Margin}} = -\log \sigma\big(r(x, y_w) - r(x, y_l) - m(x, y_w, y_l)\big)
$$

Subtracting $m$ shifts the loss curve horizontally: at $\Delta = m$, the effective logit is 0, the loss is $\log 2 \approx 0.6931$, and reaching effective probability $\rho$ requires $\Delta \ge m + \log(\rho / (1 - \rho))$ (for $m = 1.0, \rho = 0.9$, that requires $\Delta \ge 3.197$). Llama 3 later dropped the margin term after observing diminishing gains at larger dataset scale.[^dubey2024]

</details>

## Metrics, centering invariance, and calibration

Pair accuracy reduces every comparison to a sign check $\mathbb{I}(r_w > r_l)$, hiding margin drift, unanchored origins, and shortcut reliance. Track five signals together:

| Logged Metric | What It Measures | What It Conceals |
|---|---|---|
| Pair accuracy | Binary win frequency ($r_w > r_l$) | Margin collapse or shortcut reliance |
| Mean margin $\mathbb{E}[r_w - r_l]$ | Average separation distance | Probability calibration and outliers |
| Mean reward $\mathbb{E}[r]$ | Overall score drift | Ordering quality across prompts |
| Gradient norm | Optimization step magnitude | Reliance on spurious features |
| Fresh-policy pair accuracy | Agreement on newly sampled model text | Unsampled failures and human disagreement |

### Centering invariance and PPO scale sensitivity

In PPO-based RLHF, policy optimization trades expected reward against KL divergence from a reference policy $\pi_{\text{ref}}$:

$$
\max_\pi \mathbb{E}_{x \sim \mathcal{D}}\left[\mathbb{E}_{y \sim \pi(\cdot\mid x)}[r_\theta(x,y)]-\beta_{\text{KL}}D_{\text{KL}}\big(\pi(\cdot\mid x)\parallel\pi_{\text{ref}}(\cdot\mid x)\big)\right]
$$

Shifting rewards by any prompt-dependent constant leaves the optimal policy unchanged. Multiplying all rewards by 3 with fixed $\beta_{\text{KL}}$, however, yields the same ideal maximizer as dividing $\beta_{\text{KL}}$ by 3, weakening the KL anchor.

To anchor score origins before RL, InstructGPT subtracted the mean reward over demonstrations.[^ouyang2022] TRL exposes `center_rewards_coefficient` (typically starting near `0.01`), adding the midpoint regularizer from Eisenstein et al.:[^trl2026RewardConfigV117][^eisenstein2023ensembles]

$$
\mathcal{L}_{\text{center}}=\gamma\,\mathbb{E}_{\text{pairs}}\left[(r_w+r_l)^2\right]
$$

Notice its exact scope: scores `+100` and `-100` sum to zero and incur zero centering penalty, so centering anchors pair midpoints near zero without bounding individual magnitudes or calibrating win probabilities:

<!-- leetllm: test, deps=numpy, output=show, output_title="Centering invariance output" -->
```python title="reward_centering_invariance.py"
import numpy as np

chosen = np.array([1.2, 0.7])
rejected = np.array([0.2, 0.4])


def bt_loss(w: np.ndarray, l: np.ndarray) -> float:
    return float(np.logaddexp(0.0, -(w - l)).mean())


print(f"base_loss={bt_loss(chosen, rejected):.4f}")
print(f"shifted_+10_loss={bt_loss(chosen + 10.0, rejected + 10.0):.4f}")
print(f"scaled_x3_loss={bt_loss(chosen * 3.0, rejected * 3.0):.4f}")

gamma = 0.01
midpoint_penalty = gamma * (100.0 + (-100.0)) ** 2
individual_penalty = gamma * (100.0 ** 2 + (-100.0) ** 2) / 2.0
print(f"scores=(+100, -100): midpoint_penalty={midpoint_penalty:.1f}, individual_l2={individual_penalty:.1f}")
```

<!-- leetllm: output:start -->
```text title="Centering invariance output" output compact
base_loss=0.4338
shifted_+10_loss=0.4338
scaled_x3_loss=0.1949
scores=(+100, -100): midpoint_penalty=0.0, individual_l2=100.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/score_origin_and_scale_dark.png" alt="Three pairs share one score axis. The original scores 1.80 and 0.70 have margin 1.10 and sigmoid probability 0.7503. Adding 10 to both scores gives 11.80 and 10.70 with the same margin and probability. Multiplying both by 3 gives 5.40 and 2.10, margin 3.30, and probability 0.9644 under the same fixed sigmoid link. Translation preserves the pair loss; scaling changes it." />
  <figcaption>Adding +10 preserves the score margin and sigmoid win probability, whereas multiplying by 3 stretches the margin to 3.30 and pushes the implied probability to 0.9644.</figcaption>
</figure>

### Probabilistic calibration and Brier scores

To check whether $\sigma(r_A - r_B)$ matches human vote frequencies, lock candidate identities **A and B before collecting votes** (rather than always placing the winner in slot A). Let $z_i = 1$ if A wins vote $i$ and $0$ if B wins, and evaluate $p_i = \sigma(r_A - r_B)$ with Brier score and Expected Calibration Error (ECE):

$$
\text{BS}=\frac{1}{N}\sum_{i=1}^N(p_i-z_i)^2, \qquad
\text{ECE}=\sum_{m:|B_m|>0}\frac{|B_m|}{N}\left|\frac{1}{|B_m|}\sum_{i\in B_m}p_i-\frac{1}{|B_m|}\sum_{i\in B_m}z_i\right|
$$

When four reviewers split 3 votes for A and 1 for B, predicting `0.75` and overconfident `0.99` both achieve 75% accuracy, while Brier score and ECE cleanly separate them:

<!-- leetllm: test, deps=numpy, output=show, output_title="Probability calibration output" -->
```python title="reward_calibration.py"
import numpy as np

votes = np.array([1.0, 1.0, 1.0, 0.0])  # fixed A/B ordering across 4 votes
for p in (0.75, 0.99):
    acc = float(np.mean((p > 0.5) == (votes == 1.0)))
    brier = float(np.mean((p - votes) ** 2))
    ece = float(abs(p - votes.mean()))
    print(f"p(A)={p:.2f} | accuracy={acc:.2f} | Brier={brier:.4f} | one_bin_ECE={ece:.2f}")
```

<!-- leetllm: output:start -->
```text title="Probability calibration output" output compact
p(A)=0.75 | accuracy=0.75 | Brier=0.1875 | one_bin_ECE=0.00
p(A)=0.99 | accuracy=0.75 | Brier=0.2451 | one_bin_ECE=0.24
```
<!-- leetllm: output:end -->

With repeated votes per pair, using the empirical win share $q \in (0, 1)$ as a soft BCE target has unique minimum $p = q$. Keep a 50-50 reviewer split distinct from an explicit "equally good" tie annotation, which calls for a tie-aware model such as Davidson or Rao-Kupper.

<figure>
  <img src="illustrations/_generated/preference_probability_calibration_dark.png" alt="Four fixed A/B votes are A, A, A, B, so the observed sample share for A is 0.75. Predictions 0.75 and 0.99 both choose A for 3-of-4 accuracy. The per-vote squared errors average to Brier scores 0.1875 and 0.2451; one-bin ECE is 0 and 0.24." />
  <figcaption>Predictions 0.75 and 0.99 achieve identical 3-of-4 rank accuracy, yet per-vote Brier error and one-bin ECE favor the calibrated 0.75 probability.</figcaption>
</figure>

## Reward hacking, Goodhart's Law, and policy overoptimization

Static validation splits only score completions drawn from past policies. Once RL or large best-of-$N$ search explores new regions of completion space, Goodhart's Law kicks in: optimizing an imperfect proxy relentlessly amplifies every gap between the proxy and true quality.

### The Goodhart mechanism and Gao et al. scaling laws

Gao et al. measured reward overoptimization cleanly by using a large **gold reward model** both to label preferences and to grade policies optimized against a smaller proxy scorer.[^gao2023scaling] As optimization pressure (KL budget or $\log N$ in best-of-$N$) grew, proxy reward climbed monotonically while gold reward rose, peaked, and collapsed.

You can reproduce that exact Goodhart peak-and-collapse curve right here in NumPy. Suppose candidate completions have true quality $r_{\text{gold}} \sim \mathcal{N}(0, 1)$ and an imperfect proxy adds a spurious shortcut feature $s$ that correlates only weakly with truth (or adds heavy-tailed proxy error when $s$ grows large). Best-of-$N$ selection picks $\arg\max_i r_{\text{proxy}}(y_i)$; watch proxy reward keep climbing while true gold reward peaks around $N = 16$ and then falls:

<!-- leetllm: test, deps=numpy, output=show, output_title="Best-of-N Goodhart overoptimization" -->
```python title="goodhart_best_of_n.py"
import numpy as np

rng = np.random.default_rng(7)
trials = 4000

for n in (1, 4, 16, 64, 512):
    # True quality plus a spurious shortcut (e.g., verbosity) that hurts quality when extreme.
    true_skill = rng.normal(0.0, 1.0, size=(trials, n))
    shortcut = rng.normal(0.0, 1.0, size=(trials, n))
    gold = true_skill - 0.35 * np.maximum(0.0, shortcut - 1.0) ** 2
    proxy = 0.8 * true_skill + 0.6 * shortcut + rng.normal(0.0, 0.25, size=(trials, n))

    best_idx = np.argmax(proxy, axis=1)
    chosen_proxy = proxy[np.arange(trials), best_idx].mean()
    chosen_gold = gold[np.arange(trials), best_idx].mean()
    print(f"N={n:3d} | mean proxy={chosen_proxy:+.3f} | mean gold={chosen_gold:+.3f}")
```

<!-- leetllm: output:start -->
```text title="Best-of-N Goodhart overoptimization" output compact
N=  1 | mean proxy=-0.025 | mean gold=-0.040
N=  4 | mean proxy=+1.036 | mean gold=+0.731
N= 16 | mean proxy=+1.823 | mean gold=+1.230
N= 64 | mean proxy=+2.413 | mean gold=+1.585
N=512 | mean proxy=+3.143 | mean gold=+1.927
```
<!-- leetllm: output:end -->

At $N = 16$ and $N = 64$, filtering improves gold quality dramatically (+1.12). Push selection to $N = 512$ and the proxy leaps to +3.12 while true gold quality drops back below $N = 4$ (+0.73), because extreme search selects candidates with extreme shortcut values.

Four failure modes drive this breakdown in real LLM post-training:

1. **Verbosity bias:** Extra length correlates with thoroughness in training pairs, tempting the scorer to reward redundant filler. Check length-controlled slices holding technical content fixed.
2. **Sycophancy:** Scorers often reward polite agreement with a user's wrong premise over a calm factual correction.[^sharma2023sycophancy]
3. **Formatting shortcuts:** In Eisenstein et al.'s helpfulness runs, bulleted lists surged to roughly half of policy outputs compared with about 8% in the preference dataset.[^eisenstein2023ensembles]
4. **Omitted criteria:** A helpfulness-only scorer leaves truthfulness, privacy, and safety unrewarded unless represented explicitly in training and evaluation.

### Testing mitigations before trusting them

#### 1. Why a naive length margin fails to block length shortcuts

Subtracting a length margin $m(y_w, y_l) = \alpha \cdot \max(0, \text{len}(y_w) - \text{len}(y_l))$ inside the sigmoid forces a longer winner to beat the loser by a wider gap during training, yet it still allows a pure length scorer $r(y) = b \cdot \text{len}(y)$ to drive training loss near zero simply by increasing $b$:

<!-- leetllm: test, deps=numpy, output=show, output_title="Length-margin counterexample" -->
```python title="length_margin_shortcut.py"
import numpy as np

alpha = 1.0
gap = 2.0 - 1.0  # chosen length minus rejected length
for b in (0.0, 3.0, 6.0):
    loss = float(np.logaddexp(0.0, -(b - alpha) * gap))
    short_good_wins = bool(b * 1.0 > b * 2.0)
    print(f"length_weight={b:.0f} | training_loss={loss:.4f} | short_correct_beats_long_wrong={short_good_wins}")
```

<!-- leetllm: output:start -->
```text title="Length-margin counterexample" output compact
length_weight=0 | training_loss=1.3133 | short_correct_beats_long_wrong=False
length_weight=3 | training_loss=0.1269 | short_correct_beats_long_wrong=False
length_weight=6 | training_loss=0.0067 | short_correct_beats_long_wrong=False
```
<!-- leetllm: output:end -->

Instead of fragile length penalties, build balanced training and evaluation sets mixing concise correct fixes, thorough explanations that earn their length, and verbose mistakes, and verify accuracy directly on length-reversed slices.

#### 2. Ensemble disagreement penalties ($\mu - \lambda \sigma$)

An ensemble of $K \ge 2$ reward models trained with varied seeds, data splits, or architectures can flag unfamiliar policy outputs via a conservative Lower Confidence Bound (LCB) heuristic (after aligning member origins and scales on shared calibration data):[^eisenstein2023ensembles]

$$
\mu(x, y) = \frac{1}{K}\sum_{k=1}^K r_k(x, y), \qquad
\sigma(x, y) = \sqrt{\frac{1}{K-1}\sum_{k=1}^K \big(r_k(x, y) - \mu(x, y)\big)^2}, \qquad
r_{\text{conservative}}(x, y) = \mu(x, y) - \lambda \cdot \sigma(x, y)
$$

Ensembles reduce reward hacking when members disagree on out-of-distribution rollouts, yet shared blind spots across all members produce $\sigma = 0$ and pass straight through unpenalized.

```checkpoint
Three aligned reward models all assign score 5 to an answer that cites a nonexistent API flag. With $\lambda=1$, what does the conservative ensemble rule return, and does it flag the hallucination?
---
The ensemble mean is 5 and the standard deviation is 0, so the penalized score stays 5. Variance across models cannot detect a mistake that all three models share; catching fabricated citations requires external verification or an independently grounded evaluator.
```

### Auditing fresh policy rollouts before optimization

Static held-out accuracy only inspects historical completions, whereas fresh-rollout evaluation tests whether the reward model accurately ranks what the current policy emits right now. Before scaling into a large RL run, sample fresh rollouts from the target policy, check length skew and annotator agreement, and run a small monitored RL trial with stop rules independent of the proxy reward:

<!-- leetllm: test, deps=numpy, output=show, output_title="Length-skew and agreement check" -->
```python title="reward_slice_diagnostics.py"
import numpy as np

# Check whether winning completions are systematically longer on a validation slice.
chosen_rewards = np.array([1.8, 2.4, 1.6])
rejected_rewards = np.array([0.7, 1.1, 0.3])
chosen_tokens = np.array([36, 58, 33])
rejected_tokens = np.array([19, 22, 14])

margins = chosen_rewards - rejected_rewards
print(f"pair_accuracy={float((margins > 0).mean()):.2f} | mean_margin={float(margins.mean()):.2f}")
print(f"all_winners_longer={bool(np.all(chosen_tokens > rejected_tokens))} -> add length-reversed eval pairs")

# Separate unanimous pairs from contested votes before strict Bradley-Terry training.
votes = {
    "clear_bugfix": ["chosen", "chosen", "chosen"],
    "style_only": ["chosen", "rejected", "chosen"],
    "ambiguous_format": ["chosen", "rejected", "tie"],
}
for pair_id, labels in votes.items():
    share = labels.count("chosen") / len(labels)
    action = "strict_bt" if share == 1.0 else "soft_target_or_review"
    print(f"  {pair_id:17s}: chosen_share={share:.2f} -> {action}")
```

<!-- leetllm: output:start -->
```text title="Length-skew and agreement check" output compact
pair_accuracy=1.00 | mean_margin=1.23
all_winners_longer=True -> add length-reversed eval pairs
  clear_bugfix     : chosen_share=1.00 -> strict_bt
  style_only       : chosen_share=0.67 -> soft_target_or_review
  ambiguous_format : chosen_share=0.33 -> soft_target_or_review
```
<!-- leetllm: output:end -->

## Standardized evaluation: RewardBench and RewardBench 2

Internal validation splits often share the blind spots of your annotation pipeline. **RewardBench** evaluates preference models across four pairwise domains: Chat, Chat Hard, Safety, and Reasoning.[^lambert2024rewardbench] **RewardBench 2** expands coverage to Factuality, Precise Instruction Following, Math, Safety, Focus, and Ties, moving standard categories to 1-of-4 selection (25% random baseline) with a separate Ties metric.[^malik2025rewardbench2]

In Tulu 3 8B experiments reported with RewardBench 2, benchmark scores correlated strongly with best-of-16 selection ($r = 0.87$), whereas PPO outcomes differed far less among capable reward models and degraded sharply when reward initialization or prompt distributions drifted from training.[^malik2025rewardbench2] Log the benchmark version, checkpoint, tokenizer, and chat template with every run.

```checkpoint
A candidate reward model leads the public RewardBench leaderboard. Can you skip fresh rollout checks and run full PPO optimization directly?
---
No. Leaderboard rank on a public benchmark does not reliably predict PPO outcomes across distribution shifts. Validate the scorer on fresh outputs from your target policy and prompt mix first, then run a short monitored RL trial.
```

## Architectural spectrum: ORMs, PRMs, verifiers, and generative judges

A scalar Bradley-Terry Outcome Reward Model (ORM) is one point on a wider design spectrum:

| Approach | Feedback or objective | Primary strengths | Primary vulnerabilities |
|---|---|---|---|
| Scalar Bradley-Terry ORM | Single scalar $r(x, y) \in \mathbb{R}$ | Fast inference, standard PPO/GRPO terminal reward, inspectable margins | Overoptimization, length bias, Goodhart drift |
| Direct Preference Optimization (DPO) | Implicit policy/reference log-ratio | Optimizes policy directly without a separate scorer | Relies on offline pair coverage and reference anchor |
| Process Reward Model (PRM) | Step-level scalars $r(x, y_{1:t})$ | Locates errors inside multi-step reasoning traces | High step-annotation cost, still gameable[^lightman2023] |
| Generative RM / LLM-as-judge | Verdict text or verdict token probabilities | Flexible rubrics and synthetic label scaling | Inference latency, position bias, unfaithful rationales[^mahan2024generative] |
| Verifiable reward / RLVR | Programmatic execution or constraint result | Deterministic check of specified properties | Incomplete unit tests, parser loopholes[^lambert2024rlvr] |

Process Reward Models (PRMs) improved best-of-$N$ MATH selection over outcome models on a fixed generator, though step labeling is costly and gains vary by domain.[^lightman2023] Where deterministic checkers exist, Tulu 3 replaced learned scorers with executable RLVR verifiers for math and instruction constraints.[^lambert2024rlvr]

## Put the pieces together with TRL

At full transformer scale, TRL's `RewardTrainer` wires sequence-classification pooling, pair collation, and numerically stable BCE loss together. Pass `train_pairs` and `eval_pairs` already grouped by prompt ID so no prompt leaks across splits:

```python title="transformer_reward_training.py"
from trl import RewardConfig, RewardTrainer

trainer = RewardTrainer(
    model="Qwen/Qwen3-0.6B",
    args=RewardConfig(
        output_dir="reward-head",
        max_length=2048,  # Covers full templated sequences without slicing endings.
        center_rewards_coefficient=0.01,
    ),
    train_dataset=train_pairs,
    eval_dataset=eval_pairs,
)
trainer.train()
metrics = trainer.evaluate()
trainer.save_model("reward-head/final")
trainer.processing_class.save_pretrained("reward-head/final")
```

Passing a causal model ID initializes a single-scalar sequence-classification head automatically. Always save both the trained scalar head and the exact tokenizer/chat template, then verify reloaded scores on held-out pairs to confirm the head weights loaded cleanly.[^huggingface2026rewardSource]

<details>
<summary>Deep dive: Production diagnostic checklist for diverging reward runs</summary>

1. **Training loss drops while held-out accuracy stalls:** Bradley-Terry loss keeps shrinking as easy margins grow even when boundary rankings stop improving. Check prompt-group overlap, label noise, and held-out counterexample accuracy before tuning learning rates.
2. **Scorer prefers wordier, padded answers:** Build length-matched and length-reversed evaluation slices holding technical content fixed, add balanced contrast pairs, and verify accuracy on those slices rather than relying on length margins alone.
3. **Proxy reward climbs during PPO while human ratings drop:** Pause the run, save checkpoints, and inspect fresh generations. Tighten KL control, shrink the optimization budget, diversify pairs, or add an aligned ensemble.
4. **Raw scores drift rapidly across steps:** Log pair midpoints separately from pair margins, verify padding masks and end-of-turn alignment, and combine centering penalties with L2 regularization and calibration checks.

</details>

```checkpoint
For one preference pair, the centering penalty is $\gamma(r_w + r_l)^2$ with $\gamma = 0.02$. Compare score pairs `[8, −8]` and `[2, 2]`. Which penalty pair is correct?

- 1.28 and 0.08.
- 2.56 and 0.32.
- 0.00 and 0.32.
- 0.00 and 0.08.
---
0.00 and 0.32.

The sums are 0 and 4, giving penalties $0.02 \times 0^2 = 0.00$ and $0.02 \times 4^2 = 0.32$. Notice that zero centering penalty still leaves the margin `[8, −8]` unconstrained.
```

```checkpoint
Three score-aligned ensemble members return `[1, 3, 5]`. Using sample standard deviation with denominator $K - 1$ and conservative aggregation $\mu - 0.5\sigma$, what value follows?

- 3
- 2.184
- 2
- 1
---
2.

The mean is 3 and the sample variance is $(4 + 0 + 4) / 2 = 4$, giving sample standard deviation 2 and $3 - 0.5 \times 2 = 2$.
```

```mastery-quiz
[
  {
    "question": "A team wants an offline preference update for a writer that summarizes technical reports. For one report, the reviewer prefers summary S, but the fixed reference writer assigns summary T a higher probability. Which update learns the reviewer's pairwise preference relative to that reference?",
    "options": [
      "Fit a judge to the labeled pairs, then update the writer using its scores on fresh rollouts.",
      "Increase the writer's log odds of S over T relative to the reference writer's log odds of S over T.",
      "Increase the writer's log odds of T over S relative to the reference writer's log odds of T over S.",
      "Increase S's log probability relative to its reference value by fitting the writer to preferred summaries alone."
    ],
    "answer": "Increase the writer's log odds of S over T relative to the reference writer's log odds of S over T.",
    "explanation": "For each summary, subtract its reference log probability from its current writer log probability. The DPO loss falls as S's log ratio grows relative to T's. Training on preferred summaries alone omits T's contribution, while fitting a separate judge for fresh rollouts describes an online RL loop."
  },
  {
    "question": "A right-padded sequence has mask [1,1,1,0] and hidden vectors [1,2], [3,1], [2,4], [99,99]. Its scalar head is [0.25,0.5]. Under the final-real-token readout, which index and score are correct?",
    "options": [
      "Index 3; score 74.25.",
      "Index 0; score 1.25.",
      "Index 2; score 2.50.",
      "Index 1; score 1.25."
    ],
    "answer": "Index 2; score 2.50.",
    "explanation": "The final unmasked position is index 2. Its score is 2×0.25 + 4×0.5 = 2.50. Index 3 is padding, and earlier indices cannot read the complete response suffix in a causal decoder."
  },
  {
    "question": "For a strict chosen-over-rejected label, scores are 1.4 and 2.1. Use the Bradley-Terry link and natural-log loss. Which approximate probability and loss correspond to the observed chosen outcome?",
    "options": [
      "Probability 0.3318; loss 1.1032.",
      "Probability 0.6682; loss 0.4032.",
      "Probability 0.3318; loss 0.4032.",
      "Probability 0.7000; loss 0.3567."
    ],
    "answer": "Probability 0.3318; loss 1.1032.",
    "explanation": "Chosen minus rejected is −0.7. The chosen probability is σ(−0.7) ≈ 0.3318 and its negative natural logarithm is about 1.1032."
  },
  {
    "question": "Two different raw completions become identical token IDs and masks after preprocessing. A deterministic shared scorer is trained only with their strict-winner pair loss. What does this pair contribute?",
    "options": [
      "A nonzero margin and opposing parameter gradients because the raw strings differ.",
      "A zero loss and zero parameter gradient because the observed comparison is a tie.",
      "A zero margin and separate nonzero gradients on independently trainable candidate heads.",
      "A zero margin, log(2) loss and zero pair-loss parameter gradient for the shared scorer."
    ],
    "answer": "A zero margin, log(2) loss and zero pair-loss parameter gradient for the shared scorer.",
    "explanation": "Identical scored inputs produce the same deterministic function and Jacobian. Their difference is zero, the pair loss is log(2), and shared parameter derivatives cancel."
  },
  {
    "question": "Prompt P has five ranked completions and prompt Q has two. Expand all unordered pairs. Compare averaging every pair equally with averaging within prompt and then equally across prompts. What are the relative P:Q loss weights?",
    "options": [
      "5:2 for pair averaging; 1:1 for prompt averaging.",
      "10:1 for pair averaging; 1:1 for prompt averaging.",
      "10:1 for pair averaging; 10:1 for prompt averaging.",
      "5:2 for pair averaging; 10:1 for prompt averaging."
    ],
    "answer": "10:1 for pair averaging; 1:1 for prompt averaging.",
    "explanation": "Five candidates yield 5×4/2 = 10 pairs and two yield 1. Equal pair weighting gives 10:1, while averaging within each prompt first gives 1:1 loss mass."
  },
  {
    "question": "A scorer gives 4 points per unit of length. In a training pair, the chosen answer is 2 units longer. The loss subtracts 1.5 times that length gap from the score difference. What logit enters the loss, and how does the same length-only scorer rank a short correct answer against a longer wrong answer on a held-out pair?",
    "options": [
      "3, with the longer wrong answer ranked first.",
      "5, with the shorter correct answer ranked first.",
      "3, with the shorter correct answer ranked first.",
      "5, with the longer wrong answer ranked first."
    ],
    "answer": "5, with the longer wrong answer ranked first.",
    "explanation": "The raw training gap is 4×2 = 8 and the subtracted margin is 1.5×2 = 3, leaving logit 5. On the held-out pair, the scorer still awards 4 points per unit of length, so the longer wrong answer wins."
  },
  {
    "question": "Answer identities A and B are fixed before ten independent recorded votes: six choose A and four choose B. Compare constant forecasts p(A)=0.6 and p(A)=0.9. Which Brier-score pair is correct?",
    "options": [
      "0.16 for 0.6; 0.01 for 0.9.",
      "0.24 for 0.6; 0.33 for 0.9.",
      "0.40 for 0.6; 0.10 for 0.9.",
      "0.24 for 0.6; 0.09 for 0.9."
    ],
    "answer": "0.24 for 0.6; 0.33 for 0.9.",
    "explanation": "Average per-vote squared error is (6×0.4² + 4×0.6²)/10 = 0.24 for p=0.6 and (6×0.1² + 4×0.9²)/10 = 0.33 for p=0.9."
  },
  {
    "question": "The ideal objective is expected reward minus beta×KL from a fixed reference, with beta=0.12. All rewards are multiplied by four while beta stays fixed. Which KL coefficient, with the original rewards, gives the same ideal maximizer?",
    "options": [
      "0.03.",
      "0.12.",
      "0.48.",
      "0.06."
    ],
    "answer": "0.03.",
    "explanation": "Factoring four out of the scaled objective gives original reward minus (0.12/4)×KL, so the equivalent KL weight is 0.03."
  },
  {
    "question": "A live LoRA reward scorer and its reloaded copy score the same two held-out replies to one prompt. For each reply, their pooled vectors match exactly. Each scorer applies a linear head directly to its pooled vector. In reply order, the live scores are [6, 2] and the reloaded scores are [2, 4]. The live weights are available. Which repair and check would recover and verify both raw scores?",
    "options": [
      "Copy the live tokenizer and chat template. After reload, compare each reply's pooled vector with its live value.",
      "Copy the live scoring head. After reload, compare each reply's score with its live value.",
      "Adjust the output bias to match the live mean. After reload, compare each reply's score with its live value.",
      "Copy the live scoring head. After reload, check which reply ranks first in each run."
    ],
    "answer": "Copy the live scoring head. After reload, compare each reply's score with its live value.",
    "explanation": "The pooled vectors already match while the score gap flipped from +4 to −2, pointing directly to an unsaved or reinitialized linear head. Copying the live head and verifying exact raw scores confirms recovery."
  },
  {
    "question": "A validation check requires at least 85% agreement on 28 freshly reviewed pairs; 23 agree. Three calibrated scorers also each assign score 7 to an answer whose citation fails an independent source check. Which outcome follows?",
    "options": [
      "Pair screen passes; zero ensemble disagreement makes the source check pass.",
      "Pair screen fails; zero ensemble disagreement makes the source check pass.",
      "Pair screen fails; the source check also fails despite the ensemble aggregate 7.",
      "Pair screen passes; the source check fails despite the ensemble aggregate 7."
    ],
    "answer": "Pair screen fails; the source check also fails despite the ensemble aggregate 7.",
    "explanation": "23/28 ≈ 82.14% is below 85%, so the pair screen fails. Scores [7, 7, 7] have zero standard deviation, keeping the ensemble aggregate at 7, yet shared agreement cannot override a failed citation check."
  }
]
```

> **Next:** Continue to [RLHF & DPO Alignment](/learn/rlhf-dpo-aligning-language-models). You can now fit a scalar head, distinguish score offsets from scale, and test preference shortcuts. Next, use a reward signal inside PPO with KL control or train directly from labeled pairs with DPO.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Suppose your preference dataset looks clean, your reward scorer hits 100% validation accuracy, and you are ready to launch RL. Then you test one counterexample on a Python numerical-stability question: a long, flattering reply advising the developer to cast to `float64` *after* calling `exp(z)` against a crisp two-line fix that subtracts `max(z)` *before* `exp(z)`. Your scorer picks the bloated buggy answer by a wide margin. Because correct answers in training happened to be longer, the head never learned numerical stability; it learned to count tokens.

That is the central hazard of reward modeling, and RL magnifies it. A flawed scorer on static evaluations is embarrassing; a flawed scorer inside policy optimization actively teaches the model to exploit every shortcut the scorer rewards.

Why train a reward model when supervised demonstrations are simpler? Because comparing two answers to the same prompt is far easier for reviewers than writing gold replies from scratch. InstructGPT trained its scalar reward model on rankings of this form,[^ouyang2022] producing a single score per completed answer that drives both best-of-$N$ selection and online RL.

Our running example asks how to prevent exponential overflow in Python's `softmax(z)`. Response A (`chosen`) gives the real fix: subtract `max(z)` before `exp(z)`. Response B (`rejected`) looks polished yet advises casting to `float64` *after* `exp(z)` has already overflowed. Let's build the scorer, check what its numbers actually mean, and watch how easily shortcuts sneak in.

## From language model to scorer

A generative language model outputs a vocabulary distribution at every token step. A reward model outputs one real number for the complete prompt and answer: $r_\theta(x, y) \in \mathbb{R}$. To convert a causal transformer into a scorer, strip away its vocabulary unembedding layer and attach a linear projection mapping the final hidden vector to a single scalar. InstructGPT started from an SFT checkpoint (also confirming similar results from a public-NLP fine-tuned checkpoint), while Llama 3 initialized directly from a pretrained backbone.[^ouyang2022][^dubey2024] If you train LoRA adapters alongside the head, verify that the scalar head stays trainable and is exported with the checkpoint.

Reading the right token position matters just as much. In a causal decoder, earlier positions cannot attend to later tokens, so reading from the **final real token** (typically the end-of-turn delimiter) lets the representation incorporate the full answer. Under left padding that token sits at index `-1`; under contiguous right padding it sits at `mask.sum(dim=-1) - 1`. Always index explicitly through the attention mask rather than assuming padding slots stay silent.

<figure>
  <img src="illustrations/_generated/last_real_token_readout_dark.png" alt="Left-padded and right-padded sequences select the same final real hidden vector, two comma three. The scalar head one-half comma one returns reward four for both." />
  <figcaption>Tracing each sequence mask locates the same final real hidden vector regardless of padding side, producing score 4.0 for both layouts.</figcaption>
</figure>

Watch sequence length limits too. Truncating the end of a long completion can delete the exact bug that made a reviewer reject it. Filtering oversized pairs preserves label meaning while shifting your prompt distribution (TRL's `RewardConfig` defaults to filtering pairs longer than `max_length=1024`), so log how many rows drop.[^trl2026RewardConfigV117] Before fitting weights, verify four basics: identical prompt/template prefixes, distinct token IDs after preprocessing (identical tokens yield zero gradient), labels matching the loss (strict wins for Bradley-Terry, separate handling for ties), and stored generator/reviewer metadata.

## Turn a score difference into a preference

Suppose our head scores the `max(z)`-shifted fix at `1.80` and the post-`exp` cast at `0.70`, giving margin $\Delta = r_w - r_l = 1.10$. The **Bradley-Terry** model turns that margin into a win probability through the logistic sigmoid:

$$
p(y_w \succ y_l \mid x) = \sigma(r_w - r_l), \qquad \sigma(z) = \frac{1}{1 + e^{-z}}.
$$

At $\Delta = 1.10$, the model implies a `0.7503` chance that reviewers prefer A over B. Training minimizes negative log-likelihood $-\log\sigma(\Delta)$, which is binary cross-entropy with target 1 on logit $\Delta$, computed stably via `logaddexp` or `softplus`:

<figure>
  <img src="illustrations/_generated/reward_modeling_dark.png" alt="Chosen reward 1.80 and rejected reward 0.70 give margin 1.10, sigmoid probability 0.7503, and pair loss 0.2873." />
  <figcaption>Score margin 1.10 maps along the logistic curve to win probability 0.7503 and pair loss 0.2873.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, id=reader-reward-preference-loss, output=show, output_title="Reader preference loss" -->
```python title="reader-reward-preference-loss.py"
import numpy as np

chosen, rejected = 1.8, 0.7
margin = chosen - rejected
probability = float(1.0 / (1.0 + np.exp(-margin)))
loss = float(np.logaddexp(0.0, -margin))
chosen_grad = probability - 1.0
rejected_grad = -chosen_grad

print(f"margin={margin:.2f} | probability={probability:.4f} | loss={loss:.4f}")
print(f"score derivatives: chosen={chosen_grad:+.4f}, rejected={rejected_grad:+.4f}")
```

<!-- leetllm: output:start -->
```text title="Reader preference loss" output compact
margin=1.10 | probability=0.7503 | loss=0.2873
score derivatives: chosen=-0.2497, rejected=+0.2497
```
<!-- leetllm: output:end -->

The margin derivative $\sigma(\Delta) - 1$ focuses updates on mistakes: easy wins have near-zero gradients, ties give $\pm 0.5$, and reversed rankings saturate near $\pm 1$. Because chosen and rejected replies share parameters, one gradient step can still pull **both** raw scores downward while dropping the rejected score faster so the margin widens. Track pair margins alongside mean scores so a joint downward drift never looks like a broken run.

## Origin, scale, and calibration are different questions

Because Bradley-Terry reads only $r_w - r_l$, adding `+10` to every score leaves margins, probabilities, and losses untouched. Raw reward values carry no absolute unit: `2.0` is not twice as helpful as `1.0`. Scaling all scores by 3 tells the opposite story, tripling the margin from `1.10` to `3.30` and pushing the implied probability to `0.9644`. In downstream RL, tripling reward scale with a fixed KL penalty divides the effective KL constraint by three.

<figure>
  <img src="illustrations/_generated/score_origin_and_scale_dark.png" alt="The original score pair and a pair shifted upward by ten share margin 1.10 and probability 0.7503. Multiplying the original scores by three changes the margin to 3.30 and probability to 0.9644." />
  <figcaption>Translating both scores by +10 leaves margin and probability untouched, whereas scaling by 3 triples the margin and lifts implied probability to 0.9644.</figcaption>
</figure>

To keep origins steady, InstructGPT centered scores over human demonstrations before RL, while TRL exposes a small penalty on $(r_w + r_l)^2$.[^ouyang2022][^eisenstein2023ensembles] Scores of `+100` and `-100` still sum to zero and pay zero midpoint penalty, so centering anchors midpoints without bounding magnitudes or calibrating probabilities. Check calibration separately by locking identities A and B before recording votes, then scoring predicted probabilities with Brier error:

<!-- leetllm: test, deps=numpy, id=reader-reward-scale-and-brier, output=show, output_title="Reader origin, scale, and Brier" -->
```python title="reader-reward-scale-and-brier.py"
import numpy as np


def win_prob(w: float, l: float) -> float:
    return float(1.0 / (1.0 + np.exp(-(w - l))))


for name, w, l in [("original", 1.8, 0.7), ("shifted +10", 11.8, 10.7), ("scaled x3", 5.4, 2.1)]:
    print(f"{name:11s}: margin={w - l:.2f}, p={win_prob(w, l):.4f}")

votes = np.array([1.0, 1.0, 1.0, 0.0])  # 3 of 4 reviewers chose A
for p in (0.75, 0.99):
    print(f"p(A)={p:.2f}: Brier={float(np.mean((p - votes) ** 2)):.4f}")
```

<!-- leetllm: output:start -->
```text title="Reader origin, scale, and Brier" output compact
original   : margin=1.10, p=0.7503
shifted +10: margin=1.10, p=0.7503
scaled x3  : margin=3.30, p=0.9644
p(A)=0.75: Brier=0.1875
p(A)=0.99: Brier=0.2451
```
<!-- leetllm: output:end -->

Both `0.75` and `0.99` pick A with identical rank accuracy, yet Brier error clearly penalizes the overconfident forecast. Keep repeated-vote empirical fractions distinct from explicit "equally good" tie annotations, using soft targets for vote shares and tie-aware objectives for ties.

## Watch a scorer learn the wrong thing

Now reproduce the chapter's opening failure in twenty lines of NumPy on features `[correctness, scaled_length]`. In the confounded dataset, every correct fix is also one unit longer than the buggy reply. In the balanced dataset, a short fix beats a verbose bug. Both heads achieve 100% training accuracy, yet only one survives length-reversed counterexamples:

<!-- leetllm: test, deps=numpy, id=reader-reward-fitted-shortcut, output=show, output_title="Reader fitted reward shortcut" -->
```python title="reader-reward-fitted-shortcut.py"
import numpy as np

confounded = np.array([[[1.0, 1.0], [0.0, 0.0]], [[1.0, 2.0], [0.0, 1.0]]])
balanced = np.array([[[1.0, 1.0], [0.0, 0.0]], [[1.0, 0.0], [0.0, 1.0]]])
counterexamples = np.array([[[1.0, 0.0], [0.0, 2.0]], [[1.0, 0.0], [0.0, 3.0]], [[1.0, 1.0], [0.0, 1.0]]])


def fit(pairs: np.ndarray) -> np.ndarray:
    w = np.zeros(2)
    diffs = pairs[:, 0] - pairs[:, 1]
    for _ in range(300):
        sig_neg = -1.0 / (1.0 + np.exp(diffs @ w))
        w -= 0.1 * ((diffs.T @ sig_neg) / len(pairs) + 0.02 * w)
    return w


def acc(w: np.ndarray, pairs: np.ndarray) -> float:
    return float(np.mean((pairs[:, 0] - pairs[:, 1]) @ w > 0))


for name, data in [("confounded", confounded), ("balanced", balanced)]:
    w = fit(data)
    print(f"{name:10s} weights={np.round(w, 3).tolist()} train={acc(w, data):.2f} counterexamples={acc(w, counterexamples):.2f}")
```

<!-- leetllm: output:start -->
```text title="Reader fitted reward shortcut" output compact
confounded weights=[1.629, 1.629] train=1.00 counterexamples=0.33
balanced   weights=[2.667, 0.0] train=1.00 counterexamples=1.00
```
<!-- leetllm: output:end -->

> **Key insight:** L2 regularization shrinks weight magnitudes without knowing which feature is spurious. Only balanced contrast pairs cancel out the length gradient and align the weight vector purely with correctness.

<figure>
  <img src="illustrations/_generated/reward_generalization_gap_dark.png" alt="Two fitted reward directions both separate their training pairs. The confounded direction favors a verbose error, while the balanced direction favors correctness and passes all three controlled counterexamples." />
  <figcaption>Confounded training pairs steer the weight vector along the length diagonal, whereas balanced contrast pairs align the head strictly with correctness.</figcaption>
</figure>

Watch out for clever-looking heuristics that leave the exploit intact. Subtracting a length margin $\alpha \Delta_{\text{len}}$ from longer winners still lets a pure length scorer $r(y) = b\,\text{len}(y)$ push training loss near zero by inflating $b$. Rating-strength margins do have legitimate uses when annotators mark "much better" versus "slightly better" (Llama 2 used them before Llama 3 dropped them at larger data scale),[^touvron2023a][^dubey2024] yet lasting shortcut resistance comes from balanced contrast pairs checked on length-reversed slices.

## Evaluate as if the scorer wants to fool you

Sound evaluation starts with splitting and prompt weighting. Expanding $K$ ranked responses into $\binom{K}{2}$ rows leaks the same prompt across naive random splits and overweights prompts with larger candidate pools; InstructGPT batched each prompt's comparisons together and averaged within-prompt losses so a $K = 9$ prompt (36 pairs) never outweighed a $K = 2$ prompt by 36x.[^ouyang2022] Group splits by prompt ID, and inspect five metrics together:

| Metric | What it shows | What it hides |
| --- | --- | --- |
| Pair accuracy | How often the winner scored higher | Shrinking margins, shortcut reliance |
| Mean margin | Separation between pairs | Calibration |
| Mean reward | Score drift | Ordering quality |
| Gradient norm | Optimization stability | Reliance on spurious features |
| Accuracy on fresh outputs | Agreement on text the generator produces now | Unsampled failures, human disagreement |

Build targeted slices varying length and formatting independently of correctness, and benchmark externally with **RewardBench** and **RewardBench 2** (which expands to 4-way selection with a 25% baseline and dedicated Ties coverage).[^lambert2024rewardbench][^malik2025rewardbench2] In Tulu 3 8B experiments, RewardBench 2 correlated strongly with best-of-16 selection ($r = 0.87$) yet did not reliably predict downstream PPO differences across competent reward models, making fresh-policy checks indispensable.

## Optimization will find the holes

Static splits grade yesterday's completions; RL actively hunts for high-scoring flaws. **Goodhart's Law** describes what happens next: Gao et al. used a large gold reward model to evaluate policies optimized against a smaller proxy, showing proxy scores climbing monotonically while gold quality peaked and collapsed.[^gao2023scaling] Policy optimizers repeatedly exploit four weaknesses: verbosity, sycophancy toward wrong user premises,[^sharma2023sycophancy] excessive markdown list formatting,[^eisenstein2023ensembles] and omitted truthfulness or safety criteria.

Ensembling $K \ge 2$ aligned reward models with a conservative score $\mu - \lambda\sigma$ penalizes unfamiliar regions where models disagree,[^eisenstein2023ensembles] though mistakes shared across all members produce $\sigma = 0$ and slip through. Before launching large RL jobs, evaluate fresh target-policy rollouts with human reviewers, define stop criteria independent of the proxy, and confirm reloaded checkpoints reproduce exact live scores.

## Pick the signal that fits

A scalar reward model is one point on a wider alignment spectrum:

| Approach | Signal | Strength | Weakness |
| --- | --- | --- | --- |
| Scalar reward model | One number per answer | Fast, reusable, inspectable margins | Overoptimization, shortcuts |
| Direct preference optimization | Policy and reference log-ratio | No separate scorer | Depends on pair coverage and reference |
| Process reward model | Scores per reasoning step | Locates where a trace goes wrong[^lightman2023] | Expensive labels, still gameable |
| Generative judge | Verdict text or probabilities | Flexible rubrics[^mahan2024generative] | Latency, position bias, shared errors |
| Verifiable reward | Result of running a check | Direct test of a specified property[^lambert2024rlvr] | Incomplete tests, parsing gaps |

When a deterministic test verifies everything the task needs, use the verifier; when you need fast reusable ranking across many rollouts, fit a scalar reward head; when you want to steer a policy directly from offline pairs, DPO removes the scorer altogether.

```checkpoint
A scorer gives the winner 1.3 and the loser 0.8. What are the win probability and the pair loss? Now add 5 to both scores. What changes?
---
The margin is 0.5, so the probability is $\sigma(0.5) \approx 0.6225$ and the loss is $-\log 0.6225 \approx 0.4741$. Adding 5 to both scores leaves the margin at 0.5, so neither probability nor pair loss changes.
```

## Where this leaves you

You can now turn a causal transformer into a scalar scorer, separate arbitrary score origins from scale, calibrate probabilities against fixed-order votes, and catch length shortcuts with balanced counterexamples before RL amplifies them. So far, the scorer has only evaluated answers without changing generation weights. In [RLHF and DPO Alignment](/learn/rlhf-dpo-aligning-language-models), we feed this signal into PPO and DPO to shift policy probabilities directly.

<!-- leetllm: edition:reader:end -->
