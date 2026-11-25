---
{
  "id": "reward-modeling-from-preference-data",
  "title": "Reward Modeling from Preference Data",
  "slug": "reward-modeling-from-preference-data",
  "section": "Training, Fine-Tuning & Alignment",
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
    "distributed-training-fsdp-deepspeed-zero",
    "lora-parameter-efficient-fine-tuning",
    "supervised-fine-tuning-pipeline"
  ],
  "relatedQuestions": [
    "rlhf-dpo-aligning-language-models",
    "rlvr-verifiable-rewards-training"
  ],
  "aliases": [
    "data-labeling-human-feedback-active-learning"
  ]
}
---

Your reward scorer hits 100% validation accuracy, yet on one Python question (how to avoid exponential overflow in `softmax(z)`), it prefers a wordy buggy answer ("cast to `float64` *after* `exp(z)`") over the concise fix ("subtract `max(z)` before `exp(z)`"). Because training winners happened to be longer, the head learned to count tokens instead of checking math.

That shortcut hazard sits at the core of reward modeling. <span data-glossary="supervised-fine-tuning">Supervised fine-tuning (SFT)</span> imitates demonstrations, whereas a <span data-glossary="reward-model">reward model</span> maps a prompt and completion $(x, y)$ to a scalar score $r_\theta(x, y) \in \mathbb{R}$ for <span data-glossary="rlhf">RLHF</span> (<span data-glossary="ppo">PPO</span>) or best-of-$N$ ranking.[^ouyang2022] Any shortcut inside $r_\theta$ gets amplified by RL.[^gao2023scaling]

## How a scalar judge scores a completed answer

An autoregressive LLM outputs vocabulary probabilities $\pi_\theta(y_t \mid x, y_{<t})$; a reward model evaluates the complete pair $(x, y)$ and projects its final hidden state to one scalar:

$$
r_\theta(x, y) \in \mathbb{R}
$$

Training pushes $r(x, y_w) > r(x, y_l)$ for preferred $y_w$ over rejected $y_l$. Because pairwise loss depends only on score differences, adding a constant offset changes nothing (a score of `2.0` is not "twice as good" as `1.0`), whereas multiplying scores by a positive constant stretches margins, sharpens Bradley-Terry probabilities, and alters RL optimization pressure.

Scalar rewards power **online RL** (PPO pairs them with a learned value critic via GAE; outcome-supervised GRPO normalizes rewards across a group of rollouts without a critic[^shao2024]) and **best-of-$N$ selection** ($\arg\max_i r(x, y_i)$). By contrast, <span data-glossary="dpo">Direct Preference Optimization (DPO)</span> bypasses a separate scorer by increasing the policy's log-odds of $y_w$ over $y_l$ directly relative to the frozen reference model.[^rafailov2023] Explicit reward models remain essential for reusable rollout scoring, best-of-$N$ ranking, and hybrid systems alongside verifiers.[^lambert2024rlvr]

## Preference data, annotation rubrics, and inter-annotator agreement

Pairwise cross-entropy fits whatever pattern sits in the labels. Start with crisp rubrics (e.g., factual accuracy > safety > completeness > concision, with explicit tie rules and PII redaction[^presidio2023]) and measure inter-annotator agreement beyond raw match using **<span data-glossary="cohens-kappa">Cohen's kappa</span>** ($\kappa = (p_o - p_e)/(1 - p_e)$ for two raters,[^cohen1960][^sklearn2026kappa] **Fleiss' kappa** for $m \ge 3$ raters,[^statsmodels2026Fleiss] or **Krippendorff's alpha** for missing/ordinal ratings[^krippendorff2011alpha]). Always inspect confusion counts because rare classes trigger the prevalence paradox, and calibrate raters on gold items. Spend labeling budget with **active learning** (near-zero margins, Query-by-Committee disagreement, and embedding diversity),[^settles2010survey][^sener2018coreset] swap A/B slots when using LLM judges,[^zheng2023] and ship versioned manifests.[^gebru2021]

### Preference formats, pair checks, and prompt-grouped splits

Datasets store `(prompt, chosen, rejected)` strings or multi-turn message lists sharing identical prefixes formatted through the <span data-glossary="chat-template">chat template</span>.[^trl2026RewardTrainerV117] Before training, verify four invariants: identical context prefixes, distinct tokenized inputs (if preprocessing collapses both completions to identical token IDs, a shared deterministic scorer produces zero margin, $\log 2$ loss, and zero parameter gradient), objective-matched labels (strict wins for Bradley-Terry; soft or tie-aware targets for ties), and candidate lineage.

Group train/val splits by `prompt_id`: $K$ ranked responses on one prompt expand into $\binom{K}{2}$ pairs (5 responses yield 10 pairs vs 1 pair for $K=2$). InstructGPT averaged all $\binom{K}{2}$ pairs *within* each prompt so a prompt with 5 responses gets equal 1:1 loss weight alongside a 2-response prompt instead of 10:1.[^ouyang2022]

<!-- leetllm: test, output=show, output_title="Pair hygiene output" -->
```python title="preference_pair_checks.py"
# fold:start imports & sample pairs
from collections import Counter

pairs = [
    {"id": "a", "p1": "softmax?", "p2": "softmax?", "w": "Subtract max(z).", "l": "Cast after exp(z).", "label": "chosen"},
    {"id": "b", "p1": "softmax?", "p2": "softmax?", "w": "Subtract max(z).", "l": "Subtract max(z).", "label": "chosen"},
    {"id": "c", "p1": "softmax?", "p2": "attention?", "w": "Subtract max(z).", "l": "Scale by sqrt(d).", "label": "chosen"},
    {"id": "d", "p1": "attention?", "p2": "attention?", "w": "Scale by sqrt(d).", "l": "Omit scaling.", "label": "tie"},
]
# fold:end

def check_pair(p: dict[str, str]) -> str | None:
    if any(not p.get(k, "").strip() for k in ("p1", "p2", "w", "l")):
        return "missing_or_empty_text"
    if p.get("label") != "chosen":
        return "tie_or_abstention"
    if p["p1"] != p["p2"]:
        return "context_mismatch"
    if p["w"].strip() == p["l"].strip():
        return "identical_candidates"
    return None

reasons = Counter(r for p in pairs if (r := check_pair(p)))
print(f"kept={[p['id'] for p in pairs if check_pair(p) is None]} | rejected={dict(sorted(reasons.items()))}")
```

<!-- leetllm: output:start -->
```text title="Pair hygiene output" output compact
kept=['a'] | rejected={'context_mismatch': 1, 'identical_candidates': 1, 'tie_or_abstention': 1}
```
<!-- leetllm: output:end -->

## Turning a language model into a scalar scorer

Initialize from an SFT checkpoint (InstructGPT[^ouyang2022]) or pretrained base (Llama 3[^dubey2024]), drop the vocabulary head $W_{\text{lm}} \in \mathbb{R}^{d \times |V|}$, and attach a linear scalar head $W_r \in \mathbb{R}^{d \times 1}$ (any additive bias cancels out of pairwise differences). Under LoRA, ensure the scalar head is trained, saved alongside adapters, and verified on raw scores after reload; an unsaved head flips reloaded scores even when pooled hidden vectors match.[^huggingface2026rewardSource]

### Final real-token pooling and sequence padding

In a causal decoder, only the **final non-padding token** has attended to the full completion. Index explicitly via the attention mask (`-1` for left padding, `mask.sum(-1) - 1` for contiguous right padding) rather than assuming padding states stay near zero:

<!-- leetllm: test, deps=numpy, output=show, output_title="Reward pooling index output" -->
```python title="last_nonpadding_reward.py"
import numpy as np

def last_nonpadding(hidden: np.ndarray, mask: np.ndarray) -> np.ndarray:
    last_idx = np.where(mask == 1, np.arange(mask.shape[1]), -1).max(axis=1)
    return hidden[np.arange(len(hidden)), last_idx]

states = np.array([
    [[1., 0.], [2., 3.], [99., 99.]],  # right-padded
    [[99., 99.], [1., 0.], [2., 3.]],  # left-padded
])
pooled = last_nonpadding(states, np.array([[1, 1, 0], [0, 1, 1]]))
print("pooled:", pooled.tolist(), "| scores:", (pooled @ np.array([0.5, 1.0])).tolist())
```

<!-- leetllm: output:start -->
```text title="Reward pooling index output" output compact
pooled: [[2.0, 3.0], [2.0, 3.0]] | scores: [4.0, 4.0]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/last_real_token_readout_dark.png" alt="Mask-indexed final real token pooling selects [2, 3] and scores 4.0 for both right-padded and left-padded sequences while ignoring padding [99, 99]." />
  <figcaption>Mask-indexed readout selects the final unmasked token under both left and right padding, ignoring sentinel padding activations.</figcaption>
</figure>

Prefer filtering oversized sequences over right-truncating them (which can slice off a late error that caused the rejection); TRL's `RewardConfig` defaults to `max_length=1024` and filters oversized pairs by default.[^trl2026RewardTrainerV117][^trl2026RewardConfigV117]

## Bradley-Terry formulation, BCE loss, and gradient dynamics

Given scores $r(x, y_w) = 1.80$ and $r(x, y_l) = 0.70$ (margin $\Delta = 1.10$), the **Bradley-Terry** model maps $\Delta$ through the logistic sigmoid:

$$
P(y_w \succ y_l \mid x) = \sigma\big(r_\theta(x, y_w) - r_\theta(x, y_l)\big), \qquad
\mathcal{L}_{\text{BT}}(\theta) = -\mathbb{E}\Big[\log \sigma(\Delta)\Big] = \mathbb{E}\Big[\operatorname{softplus}(-\Delta)\Big]
$$

At $\Delta = 1.10$, $P = \sigma(1.10) \approx 0.7503$ and loss $= 0.2873$. This equals `binary_cross_entropy_with_logits(Delta, 1)`. Differentiating gives equal-and-opposite score gradients $\partial\mathcal{L}/\partial r_w = \sigma(\Delta)-1 \le 0$ and $\partial\mathcal{L}/\partial r_l = 1-\sigma(\Delta) \ge 0$, concentrating updates on misranked pairs ($\Delta < 0$).

<figure>
  <img src="illustrations/_generated/reward_modeling_dark.png" alt="Bradley-Terry mapping of scores 1.80 and 0.70 (margin 1.10) to sigmoid win probability 0.7503 and loss 0.2873." />
  <figcaption>Bradley-Terry maps score margin $1.80 - 0.70 = 1.10$ through the sigmoid to win probability 0.7503 and loss 0.2873.</figcaption>
</figure>

> **Common mistake:** Assuming opposite score gradients push $r_w$ up and $r_l$ down. Because both candidates share weights $\theta$, one step can lower *both* raw scores while widening their margin (e.g., $w=-1$ on $h_w=1, h_l=2$ moves scores from `(-1.0, -2.0)` to `(-1.0269, -2.0538)`, raising margin from `1.0000` to `1.0269`).

<!-- leetllm: test, deps=torch, output=show, output_title="BCE and shared-head update" -->
```python title="bce_and_shared_update.py"
import torch

rewards = torch.tensor([[1.8, 0.7]], dtype=torch.float64, requires_grad=True)
bias = torch.tensor(10.0, dtype=torch.float64, requires_grad=True)
diff = (rewards + bias)[:, 0] - (rewards + bias)[:, 1]
loss = torch.nn.functional.binary_cross_entropy_with_logits(diff, torch.ones_like(diff))
loss.backward()
print(f"loss={loss.item():.4f} | grads=({rewards.grad[0,0].item():+.4f}, {rewards.grad[0,1].item():+.4f}) | bias_grad={bias.grad.item():.1f}")

w = torch.nn.Parameter(torch.tensor(-1.0, dtype=torch.float64))
feats = torch.tensor([1.0, 2.0], dtype=torch.float64)
opt = torch.optim.SGD([w], lr=0.1)
before = (w * feats).detach().clone()
torch.nn.functional.softplus(-(w * feats)[0] + (w * feats)[1]).backward()
opt.step()
after = (w * feats).detach()
print(f"shared update: {[round(v, 4) for v in before.tolist()]} -> {[round(v, 4) for v in after.tolist()]}")
```

<!-- leetllm: output:start -->
```text title="BCE and shared-head update" output compact
loss=0.2873 | grads=(-0.2497, +0.2497) | bias_grad=0.0
shared update: [-1.0, -2.0] -> [-1.0269, -2.0538]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/shared_reward_head_update_dark.png" alt="Shared scalar weight w updates from -1 to -1.0269, lowering both scores (-1.0269 and -2.0538) while widening the margin to 1.0269." />
  <figcaption>A shared-parameter step can lower both scores while moving the rejected score farther, widening the margin from 1.0000 to 1.0269.</figcaption>
</figure>

## Training a small reward head and isolating shortcut features

A linear head $r = w^T h$ on `[correctness, scaled_length]` reproduces our opening bug. When training winners are always longer (`confounded`), L2 regularization shrinks weight norm without knowing which feature is spurious, collapsing to 33% on length-reversed counterexamples. Only `balanced` contrast pairs cancel the length gradient:

<!-- leetllm: test, deps=numpy, output=show, output_title="Learned reward-head shortcut" -->
```python title="train_tiny_reward_head.py"
import numpy as np

def fit_reward_head(pairs: np.ndarray, l2: float = 0.02, lr: float = 0.1, steps: int = 300) -> np.ndarray:
    w, diffs = np.zeros(pairs.shape[-1]), pairs[:, 0] - pairs[:, 1]
    for _ in range(steps):
        sig_neg = np.exp(-np.logaddexp(0.0, diffs @ w))
        w -= lr * (-(diffs.T @ sig_neg) / len(pairs) + l2 * w)
    return w

# fold:start confounded vs balanced training & counterexample eval
acc = lambda w, p: float(np.mean((p[:, 0] - p[:, 1]) @ w > 0))
confounded = np.array([[[1., 1.], [0., 0.]], [[1., 2.], [0., 1.]]])
balanced = np.array([[[1., 1.], [0., 0.]], [[1., 0.], [0., 1.]]])
counterexamples = np.array([[[1., 0.], [0., 2.]], [[1., 0.], [0., 3.]], [[1., 1.], [0., 1.]]])

for name, data in [("confounded", confounded), ("balanced", balanced)]:
    w = fit_reward_head(data)
    print(f"{name:10s}: w={w.round(3).tolist()}, train={acc(w, data):.2f}, counterexamples={acc(w, counterexamples):.2f}")
# fold:end
```

<!-- leetllm: output:start -->
```text title="Learned reward-head shortcut" output compact
confounded: w=[1.629, 1.629], train=1.00, counterexamples=0.33
balanced  : w=[2.667, 0.0], train=1.00, counterexamples=1.00
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/reward_generalization_gap_dark.png" alt="Confounded head (1.629, 1.629) scores verbose bug above short fix (1/3 counterexamples); balanced head (2.667, 0) scores 3/3." />
  <figcaption>Both heads hit 100% on training pairs, yet only the balanced head keeps concise fixes ahead of verbose errors (3/3 vs 1/3).</figcaption>
</figure>

<details>
<summary>Deep dive: Multi-response rankings and rating-strength margins</summary>

With $K > 2$ ranked responses per prompt, average $\binom{K}{2}$ pairs within the prompt[^ouyang2022] or fit a Plackett-Luce distribution. Llama 2 also subtracted a rating-strength margin $m \ge 0$ inside the sigmoid, $\mathcal{L}_{\text{Margin}} = -\log\sigma(\Delta - m)$,[^touvron2023a] which Llama 3 later dropped at larger scale.[^dubey2024]

</details>

## Metrics, centering invariance, and calibration

Pair accuracy $\mathbb{I}(r_w > r_l)$ hides margin drift, unanchored origins, and shortcuts; log pair accuracy, mean margin, mean reward, gradient norm, and fresh-policy pair accuracy together.

### Centering invariance and PPO scale sensitivity

In PPO-based RLHF,

$$
\max_\pi \mathbb{E}_{x}\left[\mathbb{E}_{y \sim \pi}[r_\theta(x,y)] - \beta_{\text{KL}} D_{\text{KL}}(\pi \parallel \pi_{\text{ref}})\right]
$$

shifting $r_\theta$ by any prompt-level constant $c(x)$ leaves the optimal policy unchanged. Multiplying all rewards by $k$ while holding $\beta_{\text{KL}}$ fixed, however, gives the exact same maximizer as keeping the original rewards and dividing $\beta_{\text{KL}}$ by $k$, weakening the KL anchor.

To anchor score origins, InstructGPT subtracted the demonstration mean,[^ouyang2022] and TRL adds `center_rewards_coefficient` ($\mathcal{L}_{\text{center}} = \gamma \mathbb{E}[(r_w + r_l)^2]$, typically $\gamma \approx 0.01$).[^trl2026RewardConfigV117][^eisenstein2023ensembles] Centering anchors pair midpoints (`(+100, -100)` incurs zero midpoint penalty) without bounding scale or calibrating probabilities.

<figure>
  <img src="illustrations/_generated/score_origin_and_scale_dark.png" alt="Adding +10 preserves margin 1.10 and probability 0.7503; multiplying by 3 stretches margin to 3.30 and probability to 0.9644." />
  <figcaption>Translation (+10) leaves margin and sigmoid probability unchanged; scaling (x3) stretches the margin to 3.30 and pushes win probability to 0.9644.</figcaption>
</figure>

### Probabilistic calibration and Brier scores

To test whether $\sigma(r_A - r_B)$ matches human vote rates, fix identities **A and B before collecting votes** (letting $z_i = 1$ if A wins). Evaluate $p_i = \sigma(r_A - r_B)$ via Brier score and Expected Calibration Error:

$$
\text{BS}=\frac{1}{N}\sum_{i=1}^N(p_i-z_i)^2, \qquad
\text{ECE}=\sum_{m:|B_m|>0}\frac{|B_m|}{N}\left|\bar{p}_m-\bar{z}_m\right|
$$

When 4 votes split 3 for A and 1 for B, predicting `0.75` and overconfident `0.99` both hit 75% accuracy, while Brier score (`0.1875` vs `0.2451`) and ECE (`0.00` vs `0.24`) expose overconfidence:

<!-- leetllm: test, deps=numpy, output=show, output_title="Probability calibration output" -->
```python title="reward_calibration.py"
import numpy as np

votes = np.array([1.0, 1.0, 1.0, 0.0])  # fixed A/B ordering across 4 votes
for p in (0.75, 0.99):
    print(f"p(A)={p:.2f} | acc={np.mean((p > 0.5) == (votes == 1)):.2f} | "
          f"Brier={np.mean((p - votes)**2):.4f} | one_bin_ECE={abs(p - votes.mean()):.2f}")
```

<!-- leetllm: output:start -->
```text title="Probability calibration output" output compact
p(A)=0.75 | acc=0.75 | Brier=0.1875 | one_bin_ECE=0.00
p(A)=0.99 | acc=0.75 | Brier=0.2451 | one_bin_ECE=0.24
```
<!-- leetllm: output:end -->

With repeated votes per pair, soft BCE targets $q \in (0, 1)$ minimize uniquely at $p = q$; keep explicit ties separate with Davidson or Rao-Kupper models.

<figure>
  <img src="illustrations/_generated/preference_probability_calibration_dark.png" alt="Four votes (A, A, A, B): p=0.75 and p=0.99 tie at 75% accuracy while Brier score (0.1875 vs 0.2451) and ECE (0 vs 0.24) separate them." />
  <figcaption>Predictions `0.75` and `0.99` tie on 3-of-4 rank accuracy, yet Brier score and ECE cleanly reward the calibrated `0.75` forecast.</figcaption>
</figure>

## Reward hacking, Goodhart's Law, and policy overoptimization

Static validation splits only test past policies. Under online RL or large best-of-$N$ search, Goodhart's Law exploits every proxy-truth gap: Gao et al. showed proxy reward climbing monotonically while gold reward peaked and collapsed as KL budget or $\log N$ grew.[^gao2023scaling] Four recurring exploit paths drive this collapse: **verbosity bias**, **sycophancy** (agreeing with false user premises[^sharma2023sycophancy]), **formatting shortcuts** (bullet lists jumping from ~8% to ~50% in Eisenstein et al.[^eisenstein2023ensembles]), and **omitted criteria** (truthfulness or safety absent from training).

### Testing mitigations before trusting them

Subtracting a length margin $m = \alpha \max(0, \text{len}(y_w) - \text{len}(y_l))$ inside the sigmoid fails to eliminate length gaming: a pure length scorer $r(y) = b \cdot \text{len}(y)$ still drives training loss toward zero by pushing $b > \alpha$ while still ranking longer wrong answers first on held-out pairs:

<!-- leetllm: test, deps=numpy, output=show, output_title="Length-margin counterexample" -->
```python title="length_margin_shortcut.py"
import numpy as np

alpha, gap = 1.0, 1.0
for b in (0.0, 3.0, 6.0):
    loss = float(np.logaddexp(0.0, -(b - alpha) * gap))
    print(f"length_weight={b:.0f} | loss={loss:.4f} | short_correct_beats_long_wrong={b * 1.0 > b * 2.0}")
```

<!-- leetllm: output:start -->
```text title="Length-margin counterexample" output compact
length_weight=0 | loss=1.3133 | short_correct_beats_long_wrong=False
length_weight=3 | loss=0.1269 | short_correct_beats_long_wrong=False
length_weight=6 | loss=0.0067 | short_correct_beats_long_wrong=False
```
<!-- leetllm: output:end -->

An **ensemble** of $K \ge 2$ scale-aligned reward models penalizes out-of-distribution disagreement via a conservative Lower Confidence Bound:[^eisenstein2023ensembles]

$$
r_{\text{conservative}}(x, y) = \mu(x, y) - \lambda \cdot \sigma(x, y)
$$

Ensembles curb hacking where members disagree, yet **shared blind spots** yield $\sigma = 0$ and pass straight through unpenalized: if all three scorers give `7` to a fabricated citation, ensemble agreement never overrides an independent source check.

## Standardized benchmarks and the reward design spectrum

**RewardBench** grades pairwise accuracy across Chat, Chat Hard, Safety, and Reasoning,[^lambert2024rewardbench] while **RewardBench 2** expands to Factuality, Precise Instruction Following, Math, Safety, Focus, and Ties (1-of-4 selection, 25% random baseline).[^malik2025rewardbench2] In Tulu 3 8B experiments, RewardBench 2 tracked best-of-16 strongly ($r = 0.87$) while PPO outcomes depended heavily on prompt distribution and initialization, making fresh-policy rollout audits mandatory.[^malik2025rewardbench2]

| Approach | Objective / signal | Strengths | Vulnerabilities |
|---|---|---|---|
| **Scalar Bradley-Terry ORM** | Scalar $r(x, y)$ | Fast PPO/GRPO reward, inspectable margins | Length bias, Goodhart drift |
| **DPO** | Implicit $\pi/\pi_{\text{ref}}$ log-ratio | No separate scorer | Offline coverage, reference anchor |
| **Process RM (PRM)** | Step scalars $r(x, y_{1:t})$ | Locates reasoning errors[^lightman2023] | Expensive step labels, still gameable |
| **Generative RM / LLM judge** | Verdict text / token probs | Flexible rubrics[^mahan2024generative] | Latency, position bias |
| **Verifiable reward (RLVR)** | Programmatic check | Deterministic exact signal[^lambert2024rlvr] | Incomplete tests, parser loopholes |

## Put the pieces together with TRL

TRL's `RewardTrainer` wires sequence-classification pooling, pair collation, and numerically stable BCE loss together on prompt-grouped `train_pairs` and `eval_pairs`:

```python title="transformer_reward_training.py"
from trl import RewardConfig, RewardTrainer

trainer = RewardTrainer(
    model="Qwen/Qwen3-0.6B",
    args=RewardConfig(output_dir="reward-head", max_length=2048, center_rewards_coefficient=0.01),
    train_dataset=train_pairs, eval_dataset=eval_pairs,
)
trainer.train()
trainer.save_model("reward-head/final")
trainer.processing_class.save_pretrained("reward-head/final")
```

Passing a causal model ID attaches a single-scalar head automatically. Always save both the scalar head and tokenizer/chat template, verify reloaded raw scores on held-out pairs,[^huggingface2026rewardSource] and diagnose diverging runs by checking prompt leakage, length-reversed slices, fresh rollouts, and padding masks.

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

> **Next:** Continue to [RLHF & DPO Alignment](/learn/rlhf-dpo-aligning-language-models).
