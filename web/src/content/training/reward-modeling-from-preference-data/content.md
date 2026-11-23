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

A developer asks a coding assistant how to prevent exponential overflow when implementing `softmax(z)` in Python. One reply gives the exact fix in two sentences: subtract `max(z)` from every logit before calling `exp(z)` so the largest exponent is zero. A second reply looks polished and friendly, yet advises casting the array to `float64` *after* computing `exp(z)`, which still overflows inside `exp(z)` before any cast runs. Which answer should earn the higher score?

<span data-glossary="supervised-fine-tuning">Supervised fine-tuning (SFT)</span> trains a network to imitate demonstration tokens, whereas reward modeling trains an evaluative judge to separate preferred completions from rejected ones on the same prompt. A pairwise reward model assigns every completed prompt-response pair a single real number that downstream policy optimizers can rank or optimize. System diagrams for <span data-glossary="rlhf">RLHF</span> (Reinforcement Learning from Human Feedback) often compress that judge into a single box before jumping to <span data-glossary="ppo">Proximal Policy Optimization (PPO)</span>, yet that box is simply a neural network trained on noisy human comparisons.[^ouyang2022] If the scorer learns to reward extra length or confident phrasing instead of technical correctness, later policy optimization will amplify the mistake rather than fixing it.[^gao2023scaling] Throughout this lesson, we will return to this softmax stability question to test whether a trained scorer learned the underlying bug fix or a superficial shortcut.

## How a scalar judge scores a completed answer

An autoregressive language model outputs a conditional probability distribution over the vocabulary $V$ at every token position, $\pi_\theta(y_t \mid x, y_{<t}) \in \Delta^{|V|-1}$. A <span data-glossary="reward-model">reward model</span> instead evaluates the entire prompt and completed response $(x, y)$ together. It passes the combined sequence through a transformer backbone and projects the final hidden state down to a single real-valued scalar:

$$
r_\theta(x, y) \in \mathbb{R}
$$

For our softmax prompt $x$, an annotator compares two candidate completions: a chosen completion $y_w$ that subtracts `max(z)` before `exp(z)`, and a rejected completion $y_l$ that casts `exp(z)` after the overflow has already happened. The training objective pushes the model to satisfy the strict ranking inequality $r(x, y_w) > r(x, y_l)$. Because pairwise comparisons record only relative order, adding a constant offset to every score preserves every ranking, leaving the raw origin arbitrary. A score of `2.0` does not mean twice as helpful as `1.0`, and you should calibrate two independently trained reward models on shared data before comparing their raw outputs. At the same time, scaling all scores stretches their pairwise gaps, which directly changes Bradley-Terry win probabilities and downstream policy optimization pressure.

That scalar score supports two distinct downstream workflows in post-training pipelines, depending on whether you are generating rollouts online or filtering candidates at inference time:

1. **Terminal reward for online RL**: The scorer evaluates completed policy rollouts as a sequence-level return. PPO pairs those rewards with a learned value baseline using Generalized Advantage Estimation (GAE), whereas outcome-supervised GRPO normalizes rewards relative to a group of completions sampled from the same prompt without a separate value network.[^shao2024]
2. **Best-of-N selection**: During evaluation or synthetic dataset curation, a generator samples $N$ candidate completions for prompt $x$ and selects $\arg\max_i r(x, y_i)$. People often call this rejection sampling in post-training recipes, even though taking the argmax over $N$ draws does not sample directly from a target distribution.

<span data-glossary="dpo">Direct Preference Optimization (DPO)</span> uses the exact analytic link between a reward function and its optimal KL-regularized policy to reparameterize rewards as policy-to-reference log-ratios, turning pairwise preference loss directly into a policy objective.[^rafailov2023] The basic offline DPO loop updates the language model from labeled pairs without maintaining a separate scorer network. An explicit reward model remains valuable whenever you want fast reusable ranking across fresh rollouts, best-of-$N$ filtering, or shared feedback signals alongside generative judges and executable verifiers.[^lambert2024rlvr]

## Preference data anatomy and validation pipeline

Before training a scorer, inspect the exact structure and labels in your comparison dataset. Pairwise cross-entropy minimizes loss on whatever ordering the labels record, including formatting mismatches, duplicate candidates, and systematic annotator habits. Checking the raw pairs early prevents your training run from spending compute on degenerate comparisons.

### Standard and conversational preference formats

In standard explicit-prompt datasets, each row holds the shared query in `prompt` alongside competing completions in `chosen` and `rejected`. The prompt appears once so both responses share the identical context prefix when tokenized, preventing minor formatting discrepancies in the prompt from leaking into score margins. Keeping the prompt separated also makes group-by-prompt dataset splitting straightforward during validation:

```json title="preference_pair.json"
{
  "prompt": "How do you prevent exponential overflow when implementing softmax in Python?",
  "chosen": "Subtract max(z) from each logit before calling exp(z) so the largest exponent is zero.",
  "rejected": "Cast the output array to float64 after calling exp(z) so large values fit safely."
}
```

Multi-turn dialogues store full role-tagged message lists for both `chosen` and `rejected`. Both transcripts must match token for token across the system message and prior user turns, diverging only at the final assistant message under comparison. If an earlier system directive or intermediate tool call differs between the two transcripts, the reward head can pick up context noise instead of scoring assistant quality:

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

Hugging Face TRL's `RewardTrainer` accepts both plain strings and conversational message lists, whether the prompt is implicit or explicit. Conversational examples are formatted through the tokenizer's <span data-glossary="chat-template">chat template</span>, whereas raw strings are concatenated and tokenized directly without applying conversation delimiters. These behaviors match TRL **1.17.1** as verified on November 4, 2026.[^trl2026RewardTrainerV117]

### Pair validation before training

Having `chosen` and `rejected` columns in a table does not make a dataset ready for gradient descent. Malformed rows such as mismatched prompts, duplicate completions, or non-binary tie labels distort loss magnitudes or silently zero out gradients during minibatch updates. Before tokenizing pairs into minibatches, verify four structural invariants across every record so training gradients reflect actual response quality rather than preprocessing bugs:

- **Identical context prefix**: Both completions must receive the exact same user prompt, system instructions, tool declarations, and chat template formatting.
- **Distinct scored inputs**: If normalization, truncation, or templating collapses `chosen` and `rejected` into identical token IDs and attention masks, a shared deterministic scorer outputs identical values, giving zero margin and zero parameter gradient. Verify uniqueness both before and after tokenization.
- **Labels aligned with the loss**: Winner-only Bradley-Terry loss expects strict preference outcomes, while ties and ambiguous ratings need separate handling or soft targets. Low annotator agreement can signal an unclear rubric, an error, or genuine stylistic disagreement, so inspect low-agreement clusters instead of dropping them blindly.
- **Candidate lineage metadata**: Record the generator checkpoint, decoding temperature, and reviewer cohort for each completion so downstream audits can isolate source artifacts.

The validation check below keeps only strict chosen-over-rejected rows whose prompts match and whose completions differ cleanly. Text checks catch surface defects first, while a full pipeline repeats the uniqueness check after running the tokenizer:

<!-- leetllm: test, output=show, output_title="Pair validation output" -->
```python title="preference_pair_checks.py"
from collections import Counter

pairs = [
    {"id": "a", "prompt_left": "softmax?", "prompt_right": "softmax?", "chosen": "Subtract max(z).", "rejected": "Cast after exp(z).", "label": "chosen"},
    {"id": "b", "prompt_left": "softmax?", "prompt_right": "softmax?", "chosen": "Subtract max(z).", "rejected": "Subtract max(z).", "label": "chosen"},
    {"id": "c", "prompt_left": "softmax?", "prompt_right": "attention?", "chosen": "Subtract max(z).", "rejected": "Scale by sqrt(d).", "label": "chosen"},
    {"id": "d", "prompt_left": "attention?", "prompt_right": "attention?", "chosen": "Scale by sqrt(d).", "rejected": "Omit scaling.", "label": "tie"},
]

def rejection_reason(pair):
    fields = ("prompt_left", "prompt_right", "chosen", "rejected")
    if any(not isinstance(pair.get(field), str) or not pair[field].strip() for field in fields):
        return "missing_or_empty_text"
    if pair.get("label") != "chosen":
        return "tie_or_abstention"
    if pair["prompt_left"] != pair["prompt_right"]:
        return "context_mismatch"
    if pair["chosen"].strip() == pair["rejected"].strip():
        return "identical_candidates"
    return None

reasons = Counter(reason for pair in pairs if (reason := rejection_reason(pair)))
kept = [pair["id"] for pair in pairs if rejection_reason(pair) is None]

print(f"kept={kept}")
print(f"rejected={dict(sorted(reasons.items()))}")
assert kept == ["a"]
assert rejection_reason({**pairs[0], "chosen": "  "}) == "missing_or_empty_text"
assert rejection_reason({}) == "missing_or_empty_text"
```

<!-- leetllm: output:start -->
```text title="Pair validation output" output compact
kept=['a']
rejected={'context_mismatch': 1, 'identical_candidates': 1, 'tie_or_abstention': 1}
```
<!-- leetllm: output:end -->

### Choose an evaluation split that matches generalization

A single prompt with four candidate answers yields six unordered pairs. If you shuffle and split those pairs row by row, the exact same prompt and even the same candidate completion appear in both training and validation splits, turning validation accuracy into a test of memorization rather than unseen-prompt generalization. To measure generalization to new prompts, group comparisons by `prompt_id`, cluster near-duplicate prompts, and assign every pair from a prompt to the same split. If your actual goal is ranking fresh answers to a fixed prompt set, use a response-held-out split instead and state that choice explicitly so evaluation metrics are never misread.

<!-- leetllm: test, output=show, output_title="Grouped split output" -->
```python title="grouped_preference_split.py"
pairs = [
    {"pair_id": "a-b", "prompt_id": "softmax-17"},
    {"pair_id": "a-c", "prompt_id": "softmax-17"},
    {"pair_id": "d-e", "prompt_id": "attention-04"},
    {"pair_id": "f-g", "prompt_id": "pooling-09"},
]
eval_prompt_ids = {"softmax-17"}

train = [pair for pair in pairs if pair["prompt_id"] not in eval_prompt_ids]
evaluation = [pair for pair in pairs if pair["prompt_id"] in eval_prompt_ids]
overlap = {pair["prompt_id"] for pair in train} & {pair["prompt_id"] for pair in evaluation}

assert not overlap
print(f"train_pairs={len(train)} eval_pairs={len(evaluation)}")
print(f"prompt_overlap={sorted(overlap)}")
```

<!-- leetllm: output:start -->
```text title="Grouped split output" output compact
train_pairs=2 eval_pairs=2
prompt_overlap=[]
```
<!-- leetllm: output:end -->

InstructGPT collected rankings over $K=4$ to $K=9$ completions per prompt, yielding $\binom{K}{2}$ correlated comparisons per prompt.[^ouyang2022] Shuffling those comparisons into independent training rows led to rapid overfitting, so the authors placed all $\binom{K}{2}$ pairs from one prompt into a single batch item. Doing so lets the forward pass score each of the $K$ responses once and average the pairwise losses within the prompt group. Without within-prompt averaging, a prompt with $K=9$ responses receives 36 times as much loss weight as a prompt with $K=2$ responses, biasing updates toward prompts that happened to have larger candidate pools.

## Turning a language model into a scalar scorer

A generative transformer already reads prompts and candidate answers, so turning it into a reward model requires minimal architectural changes. InstructGPT initialized its reward models from an SFT checkpoint in the main text, while noting in its appendix that the final model used a checkpoint fine-tuned on public NLP datasets with similar outcomes.[^ouyang2022] Llama 3 instead initialized its reward models directly from a pretrained checkpoint.[^dubey2024] Pick a backbone with suitable reasoning capacity, context window, and template compatibility, then replace its vocabulary projection head with a linear score projection:

1. Remove the unembedding projection layer ($W_{\text{lm}} \in \mathbb{R}^{d \times |V|}$).
2. Attach a scalar linear projection ($W_r \in \mathbb{R}^{d \times 1}$); any additive scalar bias cancels out of score differences and receives zero gradient from pairwise loss alone.
3. Train all weights, train LoRA adapters alongside the scalar head, or train the scalar head over a frozen backbone. When saving LoRA runs, ensure the scalar head parameters are marked trainable and exported together with the adapters.[^huggingface2026rewardSource]

```text
Input Tokens -> Transformer Hidden States (d) -> Last-Token Representation -> Linear Head -> Scalar Reward r(x, y)
```

### Final real-token pooling and sequence padding

In standard causal decoder attention, token position $t$ attends only to positions $j \le t$, including itself on the diagonal. Consequently, any token before the end of the answer lacks hidden-state information from the remaining suffix. Reading from the **final non-padding token**, typically the end-of-turn delimiter at the close of the response, ensures the representation summarizes the entire prompt and response. Other architectures sometimes append a dedicated scoring token or pool multiple positions, but in every design the readout must observe the complete text it judges.

Contiguous batch padding moves that final real token index across examples in a batch. Under **left padding**, the final non-padding token sits at index `-1` for every nonempty sequence. Under contiguous **right padding**, it sits at `mask.sum(dim=-1) - 1`, assuming real tokens begin at index zero without internal gaps. Never assume a transformer leaves harmless zeros at masked padding slots, because attention quirks or positional encodings can produce large activations there; always gather the last unmasked index explicitly.

### Filtering long sequences vs. truncating suffixes

Sequence-length limits pose a trade-off between memory efficiency and label fidelity. If a human annotator rejected a response because of a subtle overflow bug in the final code block, right-truncating the response removes the exact reason for the preference label. Filtering oversized pairs preserves label meaning at the cost of altering the prompt-length distribution, so log which pairs and task types are excluded. In TRL 1.17, `RewardConfig.max_length` defaults to 1024 tokens covering the full templated prompt plus completion, dropping pairs that exceed the limit rather than slicing their endings unless set to `None`.[^trl2026RewardTrainerV117][^trl2026RewardConfigV117] The short length check below demonstrates that boundary rule by keeping every pair up to `max_length` inclusive while excluding oversized candidates whole:

<!-- leetllm: test, output=show, output_title="Sequence-length filter output" -->
```python title="sequence_length_filter.py"
max_length = 1024
pairs = [
    {"id": "fits", "chosen_tokens": 412, "rejected_tokens": 390},
    {"id": "at_limit", "chosen_tokens": 1024, "rejected_tokens": 1024},
    {"id": "chosen_too_long", "chosen_tokens": 1088, "rejected_tokens": 401},
    {"id": "rejected_too_long", "chosen_tokens": 288, "rejected_tokens": 1030},
]

kept = [p["id"] for p in pairs if max(p["chosen_tokens"], p["rejected_tokens"]) <= max_length]
dropped = [p["id"] for p in pairs if p["id"] not in kept]

print(f"kept={kept}")
print(f"dropped_instead_of_truncated={dropped}")
assert kept == ["fits", "at_limit"]
```

<!-- leetllm: output:start -->
```text title="Sequence-length filter output" output compact
kept=['fits', 'at_limit']
dropped_instead_of_truncated=['chosen_too_long', 'rejected_too_long']
```
<!-- leetllm: output:end -->

The pooling check next verifies with NumPy that masking selects the exact final real hidden vector `[2.0, 3.0]` regardless of whether padding tokens (`[99.0, 99.0]`) sit on the right or on the left:

<!-- leetllm: test, deps=numpy, output=show, output_title="Reward pooling index output" -->
```python title="last_nonpadding_reward.py"
import numpy as np

def last_nonpadding(hidden, mask):
    hidden, mask = np.asarray(hidden), np.asarray(mask)
    if hidden.ndim != 3 or mask.shape != hidden.shape[:2]:
        raise ValueError("expected hidden [batch, time, width] and matching mask")
    if not np.isin(mask, [0, 1]).all() or not mask.any(axis=1).all():
        raise ValueError("each sequence needs at least one unmasked position")
    positions = np.arange(mask.shape[1])
    last = np.where(mask == 1, positions, -1).max(axis=1)
    return hidden[np.arange(len(hidden)), last]

states = np.array([[[1., 0.], [2., 3.], [99., 99.]],
                   [[99., 99.], [1., 0.], [2., 3.]]])
pooled = last_nonpadding(states, [[1, 1, 0], [0, 1, 1]])
scores = pooled @ np.array([0.5, 1.0])
assert np.allclose(scores, [4.0, 4.0])
try:
    last_nonpadding(states[:1], [[0, 0, 0]])
except ValueError:
    pass
else:
    raise AssertionError("empty sequence accepted")
print("right/left-padded scores:", scores.tolist())
```

<!-- leetllm: output:start -->
```text title="Reward pooling index output" output compact
right/left-padded scores: [4.0, 4.0]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/last_real_token_readout_dark.png" alt="Right-padded tokens have mask [1, 1, 0], and left-padded tokens have mask [0, 1, 1]. Both select the final real hidden state [2, 3] and ignore the padding hidden state [99, 99]. The shared reward head [0.5, 1.0] gives score 4.0 in either layout." />
  <figcaption>Mask-indexed readout selects the final unmasked token regardless of padding side, producing score 4.0 for both sequences while ignoring padding values.</figcaption>
</figure>

## Bradley-Terry formulation, BCE loss, and gradient dynamics

Suppose our trained head scores the two softmax completions as $r(x, y_w) = 1.80$ for subtracting `max(z)` first and $r(x, y_l) = 0.70$ for casting after `exp(z)`. Their score difference is $\Delta = 1.80 - 0.70 = +1.10$. The **Bradley-Terry (1952)** model converts that difference into an implied preference probability via normalized exponentials:

$$
P(y_w \succ y_l \mid x) = \frac{\exp(r(x, y_w))}{\exp(r(x, y_w)) + \exp(r(x, y_l))} = \frac{1}{1 + \exp\big(-(r(x, y_w) - r(x, y_l))\big)} = \sigma\big(r(x, y_w) - r(x, y_l)\big)
$$

Substituting $\Delta = 1.10$ gives $P(y_w \succ y_l \mid x) = \sigma(1.10) \approx 0.7503$. Any positive margin yields an implied win probability above 50%, while a margin of zero yields 0.50. Keep in mind that $\sigma(\Delta)$ is the model's parameterized probability rather than a calibrated frequency across human raters, nor can a 0.50 score distinguish genuine annotator uncertainty from an untried pair.

<figure>
  <img src="illustrations/_generated/reward_modeling_dark.png" alt="The same scalar reward head scores a chosen completion at 1.80 and a rejected completion at 0.70. Their 1.10 margin lands at 0.7503 on the sigmoid curve, giving pair loss 0.2873." />
  <figcaption>Bradley-Terry maps the score margin 1.80 − 0.70 = 1.10 through the logistic sigmoid to model-implied win probability 0.7503 and negative log-likelihood 0.2873.</figcaption>
</figure>

### Direct equivalence to binary cross-entropy with logits

Fitting the reward parameters maximizes the log-likelihood of observed preferences over dataset $\mathcal{D}$, which minimizes the expected negative log-likelihood:

$$
\mathcal{L}_{\text{BT}}(\theta) = -\mathbb{E}_{(x, y_w, y_l) \sim \mathcal{D}} \Big[ \log \sigma\big(r_\theta(x, y_w) - r_\theta(x, y_l)\big) \Big]
$$

This objective is identical to binary cross-entropy (BCE) with target $z = 1$ evaluated on the scalar difference $\Delta$: $\mathcal{L}_{\text{BCE}}(\Delta, z=1) = -1\cdot\log\sigma(\Delta) - (1-1)\cdot\log(1-\sigma(\Delta)) = -\log\sigma(\Delta)$. Passing the logit margin directly into PyTorch's `binary_cross_entropy_with_logits` (or `softplus(-logits_diff)`) avoids underflow when $\sigma(\Delta)$ rounds to zero. In the PyTorch check below, we also add a shared `bias = 10.0` to both candidates to verify that a constant score shift receives exact zero gradient from the pairwise objective:

<!-- leetllm: test, deps=torch, output=show, output_title="BCE and score-gradient output" -->
```python title="bce_loss_equivalence.py"
import torch

# One row per pair, columns chosen/rejected.
rewards = torch.tensor([[1.8, 0.7]], dtype=torch.float64, requires_grad=True)
bias = torch.tensor(10.0, dtype=torch.float64, requires_grad=True)
scores = rewards + bias
logits_diff = scores[:, 0] - scores[:, 1]
loss = torch.nn.functional.binary_cross_entropy_with_logits(
    logits_diff, torch.ones_like(logits_diff)
)
assert torch.allclose(loss, torch.nn.functional.softplus(-logits_diff).mean())
loss.backward()
expected = torch.sigmoid(logits_diff.detach()) - 1
assert torch.allclose(rewards.grad[:, 0], expected)
assert torch.allclose(rewards.grad[:, 1], -expected)
assert bias.grad.item() == 0.0
print(f"loss={loss.item():.4f}")
print(f"chosen_gradient={rewards.grad[0, 0].item():+.4f} rejected_gradient={rewards.grad[0, 1].item():+.4f}")
print(f"shared_bias_gradient={bias.grad.item():.1f}")
```

<!-- leetllm: output:start -->
```text title="BCE and score-gradient output" output compact
loss=0.2873
chosen_gradient=-0.2497 rejected_gradient=+0.2497
shared_bias_gradient=0.0
```
<!-- leetllm: output:end -->

### Gradient dynamics and shared-weight movement

Differentiating $\mathcal{L}_{\text{BT}} = -\log\sigma(\Delta)$ with respect to $\Delta = r_w - r_l$ yields:

$$
\frac{\partial \mathcal{L}}{\partial \Delta} = -\frac{1}{\sigma(\Delta)} \cdot \sigma(\Delta)(1 - \sigma(\Delta)) = \sigma(\Delta) - 1
$$

Applying the chain rule gives equal-magnitude, opposite-sign derivatives with respect to the individual candidate rewards:

$$
\frac{\partial \mathcal{L}}{\partial r_w} = \sigma(\Delta) - 1 \le 0, \qquad \frac{\partial \mathcal{L}}{\partial r_l} = 1 - \sigma(\Delta) \ge 0
$$

These score derivatives show where training signal concentrates. When the margin is already strongly positive ($\Delta \gg 0$), $\sigma(\Delta) \approx 1$ and the pair derivatives shrink toward zero; when $\Delta = 0$, the derivatives are $-0.5$ and $+0.5$; and when the model ranks the wrong answer ahead ($\Delta \ll 0$), the derivatives saturate near $-1.0$ and $+1.0$. Crucially, opposite signs on $\partial\mathcal{L}/\partial r_w$ and $\partial\mathcal{L}/\partial r_l$ do *not* force the actual scores $r_w$ and $r_l$ to move in opposite directions during optimization, because both scores share parameters $\theta$. Suppose a single scalar head $r = wh$ starts at $w = -1$ on frozen features $h_w = 1$ and $h_l = 2$, giving initial scores $-1$ and $-2$. One SGD step makes $w$ more negative, so **both** scores drop while the rejected score drops twice as fast, widening the margin. Monitoring individual rewards without logging their margin can therefore create false alarms when valid margins are actually growing:

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
assert torch.allclose(weight.grad, torch.sigmoid(torch.tensor(-1.0, dtype=torch.float64)))
optimizer.step()
after = (weight * features).detach()
assert torch.all(after < before)
assert (after[0] - after[1]) > (before[0] - before[1])
print("before:", [round(value, 4) for value in before.tolist()])
print("after: ", [round(value, 4) for value in after.tolist()])
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
  <figcaption>A shared-parameter PyTorch gradient step lowers both scores simultaneously while moving the rejected score twice as far, widening the margin from 1.0000 to 1.0269.</figcaption>
</figure>

### Translation invariance vs. scale sensitivity

Adding any prompt-dependent scalar offset $c(x)$ to both completions leaves the pairwise difference $\Delta' = (r_w + c(x)) - (r_l + c(x)) = r_w - r_l$ strictly unchanged, so scores `(11.80, 10.70)` yield the exact same loss, probability, and gradients as `(1.80, 0.70)`. Multiplying both scores by 3, however, triples the margin from $1.10$ to $3.30$, driving the sigmoid probability to $0.9644$ and shrinking the loss. Because separable preference batches allow the network to decrease loss indefinitely simply by scaling weights upward, regularization and held-out probability evaluation remain important. Below, we verify this contrast directly with NumPy across shifted and scaled margin vectors:

<!-- leetllm: test, deps=numpy, output=show, output_title="Reward loss and margin invariance" -->
```python title="reward_model_loss.py"
import numpy as np

chosen_rewards = np.array([2.1, 0.8, 1.9])
rejected_rewards = np.array([0.4, 1.0, 1.2])
margins = chosen_rewards - rejected_rewards

def pairwise_bt_loss(delta):
    return np.logaddexp(0.0, -delta)

losses = pairwise_bt_loss(margins)
print("margins:", np.round(margins, 3).tolist())
print("reward_loss:", round(float(losses.mean()), 4))
print("pair_accuracy:", round(float((margins > 0).mean()), 4))
for margin in [-2.0, 0.0, 2.0]:
    print(f"margin={margin:+.1f} loss={float(pairwise_bt_loss(margin)):.4f}")
assert np.isclose(pairwise_bt_loss(0.0), np.log(2.0))
assert np.isclose(pairwise_bt_loss(-1000.0), 1000.0)
assert pairwise_bt_loss(1000.0) == 0.0
```

<!-- leetllm: output:start -->
```text title="Reward loss and margin invariance" output compact
margins: [1.7, -0.2, 0.7]
reward_loss: 0.4564
pair_accuracy: 0.6667
margin=-2.0 loss=2.1269
margin=+0.0 loss=0.6931
margin=+2.0 loss=0.1269
```
<!-- leetllm: output:end -->

Decreasing loss tells you the margin grew larger on the training pairs, not which feature drove that separation. Next, we fit a minimal two-feature reward head to expose how correlated training pairs let a length shortcut masquerade as correctness.

## Training a small reward head and isolating shortcut features

A linear reward head $r = w^T h$ fitted on just two input features (technical correctness and scaled response length) is enough to expose how training correlations create hidden shortcuts. In a **confounded training set**, every correct answer is also one length unit longer than the buggy alternative, so correctness and length always increase together. In a **balanced training set**, a concise fix beats a verbose buggy answer, breaking that spurious correlation.

Both heads easily achieve 100% accuracy on their training pairs, yet when evaluated on counterexamples where a long padded response recommends casting after `exp(z)`, the confounded head drops to 33% accuracy. The NumPy experiment below computes analytical logistic-loss gradients, verifies them via central finite differences, checks input shape validity, saves the fitted weights alongside feature names, and reloads them for inference:

<!-- leetllm: test, deps=numpy, output=show, output_title="Learned reward-head shortcut" -->
```python title="train_tiny_reward_head.py"
import json
import tempfile
from pathlib import Path
import numpy as np

def objective_and_gradient(weights, pairs, l2=0.02):
    pairs = np.asarray(pairs, dtype=float)
    if pairs.ndim != 3 or pairs.shape[1:] != (2, 2) or len(pairs) == 0:
        raise ValueError("expected nonempty [pairs, chosen/rejected, two features]")
    if not np.isfinite(pairs).all():
        raise ValueError("features must be finite")
    differences = pairs[:, 0] - pairs[:, 1]
    margins = differences @ weights
    loss = np.logaddexp(0.0, -margins).mean() + 0.5 * l2 * (weights @ weights)
    sigmoid_negative = np.exp(-np.logaddexp(0.0, margins))
    gradient = -(differences.T @ sigmoid_negative) / len(pairs) + l2 * weights
    return float(loss), gradient

def fit(pairs):
    weights = np.zeros(2)
    initial, _ = objective_and_gradient(weights, pairs)
    for _ in range(300):
        _, gradient = objective_and_gradient(weights, pairs)
        weights -= 0.1 * gradient
    final, _ = objective_and_gradient(weights, pairs)
    assert final < initial
    return weights

def accuracy(weights, pairs):
    return float(np.mean((pairs[:, 0] - pairs[:, 1]) @ weights > 0))

# Each row is [chosen representation, rejected representation] with features [correctness, scaled_length].
confounded = np.array([[[1., 1.], [0., 0.]], [[1., 2.], [0., 1.]]])
balanced = np.array([[[1., 1.], [0., 0.]], [[1., 0.], [0., 1.]]])
counterexamples = np.array([[[1., 0.], [0., 2.]],
                            [[1., 0.], [0., 3.]],
                            [[1., 1.], [0., 1.]]])

# Check analytic gradients against central finite differences.
probe = np.array([0.2, -0.3])
_, analytic = objective_and_gradient(probe, confounded)
for invalid in [np.empty((0, 2, 2)), np.zeros((2, 2)), np.full((1, 2, 2), np.nan)]:
    try:
        objective_and_gradient(probe, invalid)
        raise AssertionError("invalid pair tensor accepted")
    except ValueError:
        pass
for coordinate in range(2):
    delta = np.zeros(2)
    delta[coordinate] = 1e-6
    numerical = (objective_and_gradient(probe + delta, confounded)[0]
                 - objective_and_gradient(probe - delta, confounded)[0]) / 2e-6
    assert abs(numerical - analytic[coordinate]) < 1e-7

for name, training in [("confounded", confounded), ("balanced", balanced)]:
    weights = fit(training)
    print(f"{name}: weights={weights.round(3).tolist()}, train={accuracy(weights, training):.2f}, counterexamples={accuracy(weights, counterexamples):.2f}")
    if name == "confounded":
        assert accuracy(weights, counterexamples) == 1 / 3
    else:
        assert accuracy(weights, counterexamples) == 1.0

with tempfile.TemporaryDirectory() as directory:
    path = Path(directory) / "reward_head.json"
    path.write_text(json.dumps({"features": ["correctness", "scaled_length"], "weights": weights.tolist()}))
    artifact = json.loads(path.read_text())
    assert artifact["features"] == ["correctness", "scaled_length"]
    assert np.allclose(counterexamples @ np.array(artifact["weights"]), counterexamples @ weights)
print("gradient check and head reload: passed")
```

<!-- leetllm: output:start -->
```text title="Learned reward-head shortcut" output compact
confounded: weights=[1.629, 1.629], train=1.00, counterexamples=0.33
balanced: weights=[2.667, 0.0], train=1.00, counterexamples=1.00
gradient check and head reload: passed
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/reward_generalization_gap_dark.png" alt="The first counterexample, chosen feature vector (1, 0) and verbose-error vector (0, 2), is projected by two heads fitted for 300 updates. On shared equal-unit axes, the confounded weight direction (1.629, 1.629) scores them 1.629 and 3.259; the balanced direction (2.667, 0) scores them 2.667 and 0. Both heads fit 2 of 2 training pairs, while their measured accuracy on the three controlled counterexamples is 1 of 3 and 3 of 3." />
  <figcaption>Both heads reach 2 of 2 on their respective training pairs, yet only the head trained on length-balanced pairs keeps the concise fix ahead of the verbose error (3 of 3 vs. 1 of 3).</figcaption>
</figure>

After 300 gradient steps, the confounded head settles at $w \approx [1.629, 1.629]$ because both features change identically across its training pairs, splitting optimization pressure evenly between correctness and length. On the first counterexample, a verbose wrong answer at $(0, 2)$ scores $2 \times 1.629 = 3.258$, comfortably defeating the concise fix $(1, 0)$ at $1.629$. By contrast, the balanced set has difference vectors $[1, 1]$ and $[1, -1]$, so starting at zero length weight causes length gradients from the two pairs to cancel identically. Notice that L2 regularization shrinks weight magnitude rather than identifying which feature is spurious; clean contrast pairs are what eliminate the length weight in this controlled CPU experiment.

```checkpoint
Suppose you remove L2 regularization while keeping the balanced training pairs and zero initial weights. Does the length weight grow during training?
---
No. Because the two training pairs have equal correctness differences and opposite length differences, their gradients on the length coordinate still cancel exactly at zero length weight. Data symmetry drives that cancellation, whereas L2 regularization only pulls weights toward zero.
```

### Multi-response rankings and margin-augmented losses

When labelers rank groups of $K > 2$ candidate completions for a prompt, teams commonly convert rankings into training losses in one of two ways: expanding all $\binom{K}{2}$ pairs and averaging within the prompt group,[^ouyang2022] or modeling the full permutation under a Plackett-Luce multinomial distribution. Averaging over $\binom{K}{2}$ within each prompt is critical so prompts sampled with larger candidate pools do not dominate batch gradients. Some pipelines also capture preference strength labels such as "much better" versus "slightly better" and incorporate a rating-dependent margin $m(x, y_w, y_l) \ge 0$ inside the sigmoid, setting $m = 0$ for the weakest preference category:[^touvron2023a]

$$
\mathcal{L}_{\text{Margin}} = -\log \sigma\big(r(x, y_w) - r(x, y_l) - m(x, y_w, y_l)\big)
$$

Subtracting a positive margin shifts the loss curve horizontally rather than saturating it. At $r_w - r_l = m$, the shifted logit is zero, the loss remains $\log 2$, and the gradient with respect to the margin is still $-0.5$. Reaching an effective win probability $\rho$ demands $r_w - r_l \ge m + \log(\rho / (1 - \rho))$; for $m = 1.0$ and $\rho = 0.9$, the score difference must reach $3.197$. Llama 3 later removed the margin term after observing diminishing gains as dataset size scaled.[^dubey2024]

<!-- leetllm: test, deps=numpy, output=show, output_title="Preference-margin threshold output" -->
```python title="preference_margin_threshold.py"
import numpy as np

m = 1.0
required_difference = m + np.log(0.9 / 0.1)
differences = np.array([m, required_difference])
logits = differences - m
probabilities = 1.0 / (1.0 + np.exp(-logits))
losses = np.logaddexp(0.0, -logits)
for diff, prob, loss in zip(differences, probabilities, losses):
    print(f"score_difference={diff:.3f} effective_p={prob:.2f} loss={loss:.4f} derivative={prob - 1:+.2f}")
assert np.isclose(probabilities[1], 0.9)
```

<!-- leetllm: output:start -->
```text title="Preference-margin threshold output" output compact
score_difference=1.000 effective_p=0.50 loss=0.6931 derivative=-0.50
score_difference=3.197 effective_p=0.90 loss=0.1054 derivative=-0.10
```
<!-- leetllm: output:end -->

Notice that a larger margin alters loss slopes and probability separation without necessarily changing binary pair accuracy, which tracks only whether the sign of $\Delta$ is positive.

## Metrics, centering invariance, and calibration

Pair accuracy reduces each comparison to a binary indicator, $\mathbb{I}(r_w > r_l)$, concealing shrinking score margins, drifting score origins, and heavy reliance on spurious features. A model can sustain 95% accuracy on training splits even while raw margins explode or depend almost entirely on response length. Monitoring the distributions below alongside pair accuracy reveals trouble early:

| Logged Metric | What It Measures | What It Conceals |
|---|---|---|
| Pair accuracy | Binary win frequency ($r_w > r_l$) | Margin collapse or shortcut reliance |
| Mean margin $\mathbb{E}[r_w - r_l]$ | Average separation distance | Probability calibration and extreme outliers |
| Mean reward $\mathbb{E}[r]$ | Overall score drift | Ordering quality across prompts |
| Gradient norm | Optimization step magnitude | Reliance on spurious features such as length |
| Fresh-policy pair accuracy | Agreement on newly sampled model text | Unsampled failures, calibration error, and human disagreement |

### Centering invariance and PPO scale sensitivity

In PPO-based RLHF, policy optimization balances expected scalar reward against a KL-divergence penalty relative to a reference policy $\pi_{\text{ref}}$:

$$
\max_\pi \mathbb{E}_{x \sim \mathcal{D}}\left[\mathbb{E}_{y \sim \pi(\cdot\mid x)}[r_\theta(x,y)]-\beta_{\text{KL}}D_{\text{KL}}\big(\pi(\cdot\mid x)\parallel\pi_{\text{ref}}(\cdot\mid x)\big)\right]
$$

Because shifting every score by a prompt-dependent constant adds a constant to the expected reward, the maximizing policy stays invariant to score translation. Scaling all rewards by 3 while leaving $\beta_{\text{KL}}$ unchanged, however, yields the same ideal objective maximizer as dividing $\beta_{\text{KL}}$ by 3, effectively weakening the KL constraint. Real policy drift also reflects advantage normalization, ratio clipping, and optimization steps.

To keep score origins anchored before RL, InstructGPT subtracted the mean reward over labeler demonstrations prior to optimization.[^ouyang2022] TRL 1.17 exposes `center_rewards_coefficient`, recommending `0.01` as a starting point (default `None`), which adds the auxiliary term popularized by Eisenstein et al.:[^trl2026RewardTrainerV117][^trl2026RewardConfigV117][^eisenstein2023ensembles]

$$
\mathcal{L}_{\text{center}}=\gamma\,\mathbb{E}_{\text{pairs}}\left[(r_w+r_l)^2\right]
$$

In terms of the pair midpoint $u = (r_w + r_l) / 2$, this penalty equals $4\gamma u^2$. Note what it omits: pairs with scores $+100$ and $-100$ have zero midpoint and pay zero penalty, so centering pulls pair averages near zero without bounding individual reward magnitudes or calibrating win probabilities. In the NumPy check below, adding 10 leaves pairwise loss unchanged while multiplying scores by 3 shifts the loss downward, and the $+100/-100$ pair confirms zero midpoint penalty:

<!-- leetllm: test, deps=numpy, output=show, output_title="Centering invariance output" -->
```python title="reward_centering_invariance.py"
import numpy as np

chosen = np.array([1.2, 0.7])
rejected = np.array([0.2, 0.4])

def pair_loss(left, right):
    return float(np.logaddexp(0.0, -(left - right)).mean())

shifted = (chosen + 10.0, rejected + 10.0)
scaled = (chosen * 3.0, rejected * 3.0)

print(f"base_loss={pair_loss(chosen, rejected):.4f}")
print(f"shifted_loss={pair_loss(*shifted):.4f}")
print(f"scaled_loss={pair_loss(*scaled):.4f}")
gamma = 0.01
sum_penalty = gamma * (100 + (-100)) ** 2
individual_penalty = gamma * (100 ** 2 + (-100) ** 2) / 2
assert sum_penalty == 0.0 and individual_penalty == 100.0
print(f"scores=+100,-100 pair_sum_penalty={sum_penalty:.1f} individual_square_penalty={individual_penalty:.1f}")
```

<!-- leetllm: output:start -->
```text title="Centering invariance output" output compact
base_loss=0.4338
shifted_loss=0.4338
scaled_loss=0.1949
scores=+100,-100 pair_sum_penalty=0.0 individual_square_penalty=100.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/score_origin_and_scale_dark.png" alt="Three pairs share one score axis. The original scores 1.80 and 0.70 have margin 1.10 and sigmoid probability 0.7503. Adding 10 to both scores gives 11.80 and 10.70 with the same margin and probability. Multiplying both by 3 gives 5.40 and 2.10, margin 3.30, and probability 0.9644 under the same fixed sigmoid link. Translation preserves the pair loss; scaling changes it." />
  <figcaption>Adding +10 preserves the score margin and sigmoid win probability, whereas multiplying by 3 stretches the margin to 3.30 and pushes the implied probability to 0.9644.</figcaption>
</figure>

### Probabilistic calibration and Brier scores

To measure whether Bradley-Terry probabilities match actual annotator frequencies, fix candidate identifiers **A and B before collecting votes** rather than sorting every row so the winner sits in slot A. Let $z_i = 1$ if A wins vote $i$ and $z_i = 0$ if B wins, and evaluate $p_i = \sigma(r_A - r_B)$ using two proper metrics:

$$
\text{BS}=\frac{1}{N}\sum_{i=1}^N(p_i-z_i)^2, \qquad
\text{ECE}=\sum_{m:|B_m|>0}\frac{|B_m|}{N}\left|\frac{1}{|B_m|}\sum_{i\in B_m}p_i-\frac{1}{|B_m|}\sum_{i\in B_m}z_i\right|
$$

The **Brier score (BS)** averages squared probability errors across individual votes, while **Expected Calibration Error (ECE)** groups predictions into bins $B_m$ and compares average predicted win probability with observed win fraction in each bin. When comparing calibration across experiments, state whether bins track fixed A-versus-B win probabilities or top-class confidence, along with bin edges and sample counts. Suppose four independent reviewers compare two softmax answers and split 3 votes for A to 1 vote for B. Both $p(A) = 0.75$ and overconfident $p(A) = 0.99$ pick A and achieve the same 75% binary accuracy, yet Brier score and one-bin ECE sharply separate them:

<!-- leetllm: test, deps=numpy, output=show, output_title="Probability calibration output" -->
```python title="reward_calibration.py"
import numpy as np

# Fixed A/B ordering evaluated across four independent votes.
votes = np.array([1.0, 1.0, 1.0, 0.0])
for probability in [0.75, 0.99]:
    accuracy = float(np.mean((probability > 0.5) == (votes == 1.0)))
    brier = float(np.mean((probability - votes) ** 2))
    one_bin_ece = float(abs(probability - votes.mean()))
    assert accuracy == 0.75
    print(f"p_A={probability:.2f} accuracy={accuracy:.2f} Brier={brier:.4f} one_bin_ECE={one_bin_ece:.2f}")
```

<!-- leetllm: output:start -->
```text title="Probability calibration output" output compact
p_A=0.75 accuracy=0.75 Brier=0.1875 one_bin_ECE=0.00
p_A=0.99 accuracy=0.75 Brier=0.2451 one_bin_ECE=0.24
```
<!-- leetllm: output:end -->

Forecasting $0.75$ matches this four-vote empirical rate, though four votes are far too small to prove population calibration across prompt categories. When training on repeated votes per pair, using the empirical vote share $q \in (0, 1)$ as a soft BCE target $-q\log p - (1 - q)\log(1 - p)$ has unique minimum $p = q$. Keep in mind that a 50-50 reviewer split and an explicit "equally good" tie annotation record different phenomena; use a tie-aware objective such as Davidson or Rao-Kupper when modeling explicit ties directly.

<figure>
  <img src="illustrations/_generated/preference_probability_calibration_dark.png" alt="Four fixed A/B votes are A, A, A, B, so the observed sample share for A is 0.75. Predictions 0.75 and 0.99 both choose A for 3-of-4 accuracy. The per-vote squared errors average to Brier scores 0.1875 and 0.2451; one-bin ECE is 0 and 0.24." />
  <figcaption>Predictions 0.75 and 0.99 achieve identical 3-of-4 rank accuracy, yet per-vote Brier squared error and one-bin ECE favor the calibrated 0.75 probability.</figcaption>
</figure>

## Reward hacking, Goodhart's Law, and policy overoptimization

High accuracy on a held-out preference split never guarantees safe downstream policy optimization. Held-out accuracy only inspects past outputs drawn from static reference policies, whereas RL actively explores new prompt-completion trajectories where learned correlations break down. Goodhart's Law warns that optimizing an imperfect proxy score relentlessly will eventually expose and amplify discrepancies between the proxy and true quality, even when the proxy correlates well initially.

### The Goodhart mechanism and Gao et al. scaling laws

Gao et al. (2023) studied reward overoptimization in controlled synthetic setups by using a much larger **gold reward model** both to generate preference labels and to evaluate PPO and best-of-$N$ policies trained against a smaller proxy scorer.[^gao2023scaling] Under sustained optimization, proxy reward continued rising while gold reward reached a peak and then declined. Their fitted scaling relationships show how evaluator errors rare on static splits become dominant modes once RL searches into uncharted regions of completion space, though exact peak heights depend on model family, data budget, and the proxy-vs-gold gap rather than forming universal constants.

When an RL optimizer explores candidate completions, four common failure modes repeatedly break naive scorers:

1. **Verbosity bias**: Longer replies often correlate with thoroughness in preference data, tempting the scorer to equate extra tokens with higher quality even when the extra text is redundant filler. Always test length-controlled slices where factual content is fixed while token count varies.
2. **Sycophancy**: Preference models and human raters can reward completions that agree with a user's incorrect assumption rather than gently correcting it.[^sharma2023sycophancy] Distinguishing helpful tone from factual deference requires counterexamples where polite disagreement wins.
3. **Formatting shortcuts**: Markdown structure aids readability, yet optimization can exaggerate surface layout. In Eisenstein et al.'s helpfulness experiments, list-formatted generations rose to roughly half of policy outputs compared with about 8% in the underlying preference dataset.[^eisenstein2023ensembles]
4. **Omitted criteria**: A reward head trained solely on helpfulness comparisons omits truthfulness, safety, or privacy signals unless those dimensions are explicitly represented in both training pairs and held-out audits.

The audit snippet below checks whether winning candidates are systematically longer across held-out pairs; seeing 100% accuracy alongside 100% longer winners signals the need for length-matched counterexamples before declaring success:

<!-- leetllm: test, deps=numpy, output=show, output_title="Reward audit output" -->
```python title="reward_audit.py"
import numpy as np

chosen_rewards = np.array([1.8, 2.4, 1.6])
rejected_rewards = np.array([0.7, 1.1, 0.3])
chosen_tokens = np.array([36, 58, 33])
rejected_tokens = np.array([19, 22, 14])

margins = chosen_rewards - rejected_rewards
accuracy = float(np.mean(margins > 0))
length_gaps = chosen_tokens - rejected_tokens

print(f"pair_accuracy={accuracy:.2f}")
print(f"mean_margin={float(margins.mean()):.2f}")
print(f"chosen_answers_longer={bool(np.all(length_gaps > 0))}")
print("next_check=build length-matched eval pairs")
```

<!-- leetllm: output:start -->
```text title="Reward audit output" output compact
pair_accuracy=1.00
mean_margin=1.23
chosen_answers_longer=True
next_check=build length-matched eval pairs
```
<!-- leetllm: output:end -->

Annotator disagreement audits complement length audits by exposing ambiguous slices where strict binary labels are noisy. In practice, unanimous pairs train cleanly under strict Bradley-Terry loss, while split votes warrant inspection, additional annotation, or soft-target modeling rather than automatic deletion. Separating confident agreement from contested comparisons prevents label noise from masking real learning failures on unambiguous bugs:

<!-- leetllm: test, output=show, output_title="Agreement audit output" -->
```python title="agreement_audit.py"
votes = {
    "clear_bugfix": ["chosen", "chosen", "chosen"],
    "style_only": ["chosen", "rejected", "chosen"],
    "ambiguous_format": ["chosen", "rejected", "tie"],
}

for pair_id, labels in votes.items():
    chosen_share = labels.count("chosen") / len(labels)
    status = "train" if chosen_share == 1.0 else "review_or_hold_out"
    print(f"{pair_id}: chosen_share={chosen_share:.2f} status={status}")
```

<!-- leetllm: output:start -->
```text title="Agreement audit output" output compact
clear_bugfix: chosen_share=1.00 status=train
style_only: chosen_share=0.67 status=review_or_hold_out
ambiguous_format: chosen_share=0.33 status=review_or_hold_out
```
<!-- leetllm: output:end -->

### Testing mitigations before trusting them

#### 1. Why a naive length margin fails to block length shortcuts

One tempting heuristic subtracts a length margin $m(y_w, y_l) = \alpha \cdot \max(0, \text{len}(y_w) - \text{len}(y_l))$ inside the sigmoid:

$$
\mathcal{L} = -\log \sigma\Big(r(x, y_w) - r(x, y_l) - \alpha \cdot \max\big(0, \text{len}(y_w) - \text{len}(y_l)\big)\Big)
$$

Subtracting that offset requires a longer winner to beat the loser by a larger margin during training, yet it does **not** prevent a reward head from relying solely on token length. For a pure length scorer $r(y) = b \cdot \text{len}(y)$ evaluated on a pair with positive length gap $\Delta_{\text{len}} > 0$, the shifted logit equals $(b - \alpha)\Delta_{\text{len}}$. As the NumPy check below shows, raising the length weight $b$ from 0 to 6 drives training loss down to `0.0067` while failing every length-reversed counterexample where the correct fix is short and the wrong answer is long:

<!-- leetllm: test, deps=numpy, output=show, output_title="Length-margin counterexample" -->
```python title="length_margin_shortcut.py"
import numpy as np

alpha = 1.0
chosen_length, rejected_length = 2.0, 1.0
gap = chosen_length - rejected_length
for length_weight in np.array([0.0, 3.0, 6.0]):
    effective_logit = (length_weight - alpha) * gap
    loss = float(np.logaddexp(0.0, -effective_logit))
    short_good_score = length_weight * 1.0
    long_wrong_score = length_weight * 2.0
    passes_reversal = bool(short_good_score > long_wrong_score)
    print(f"length_weight={length_weight:.0f} training_loss={loss:.4f} passes_length_reversal={passes_reversal}")
```

<!-- leetllm: output:start -->
```text title="Length-margin counterexample" output compact
length_weight=0 training_loss=1.3133 passes_length_reversal=False
length_weight=3 training_loss=0.1269 passes_length_reversal=False
length_weight=6 training_loss=0.0067 passes_length_reversal=False
```
<!-- leetllm: output:end -->

Rather than adding fragile length penalties that can punish genuinely thorough answers, construct balanced training and evaluation data containing concise correct answers, detailed explanations that earn their length, and verbose errors. Adding targeted counterexamples forces gradient updates to align with semantic quality across every length band instead of shifting scores uniformly by character count. Always verify shortcut resistance directly on length-matched and length-reversed slices.

#### 2. Ensemble disagreement penalties ($\mu - \lambda \sigma$)

An ensemble of $K \ge 2$ reward models trained with varied seeds, data splits, or architectures can expose unstable regions during optimization. Before aggregating scores across members, align their origins and scales on shared calibration data so arbitrary model offsets do not masquerade as disagreement.[^eisenstein2023ensembles] Computing the sample mean and sample standard deviation yields a conservative Lower Confidence Bound (LCB) score:

$$
\mu(x, y) = \frac{1}{K}\sum_{k=1}^K r_k(x, y), \qquad \sigma(x, y) = \sqrt{\frac{1}{K-1}\sum_{k=1}^K \big(r_k(x, y) - \mu(x, y)\big)^2}, \qquad
r_{\text{conservative}}(x, y) = \mu(x, y) - \lambda \cdot \sigma(x, y)
$$

Despite its name, this LCB penalty is an optimization heuristic rather than a calibrated statistical confidence bound. While Eisenstein et al. showed that reward ensembles reduce reward hacking, ensembles cannot stop it completely because correlated errors across members produce high mean reward with zero disagreement.[^eisenstein2023ensembles]

```checkpoint
Three aligned reward models all assign score 5 to an answer that cites a nonexistent API flag. With $\lambda=1$, what does the conservative ensemble rule return, and does it flag the hallucination?
---
The ensemble mean is 5 and the standard deviation is 0, so the penalized score stays 5. Variance across models cannot detect a mistake that all three models share; catching fabricated citations requires external verification or an independently grounded evaluator.
```

### Auditing fresh policy rollouts before optimization

Before committing compute to a full RL run, generate fresh completions from your policy model, form new preference pairs, and obtain human reviews covering factuality, refusal quality, and shortcut slices. Static held-out accuracy only inspects past outputs, whereas fresh-rollout accuracy measures whether the reward model ranks what the policy currently emits. The screening check below applies an 80% fresh-pair accuracy threshold; passing a screen supports proceeding to a small monitored RL trial rather than certifying production release:

<!-- leetllm: test, output=show, output_title="Fresh-policy gate output" -->
```python title="fresh_policy_gate.py"
evaluation = {
    "static_held_out_pairs": {"accuracy": 0.92, "human_reviewed": False},
    "fresh_policy_pairs": {"accuracy": 0.64, "human_reviewed": True},
}
minimum_fresh_accuracy = 0.80
def passes_fresh_gate(result, minimum):
    return result["human_reviewed"] and result["accuracy"] >= minimum

assert not passes_fresh_gate({"accuracy": 0.99, "human_reviewed": False}, 0.80)
assert passes_fresh_gate({"accuracy": 0.80, "human_reviewed": True}, 0.80)
passes_pair_screen = passes_fresh_gate(evaluation["fresh_policy_pairs"], minimum_fresh_accuracy)

print(f"static_accuracy={evaluation['static_held_out_pairs']['accuracy']:.2f}")
print(f"fresh_accuracy={evaluation['fresh_policy_pairs']['accuracy']:.2f}")
print(f"passes_pair_screen={passes_pair_screen}")
```

<!-- leetllm: output:start -->
```text title="Fresh-policy gate output" output compact
static_accuracy=0.92
fresh_accuracy=0.64
passes_pair_screen=False
```
<!-- leetllm: output:end -->

## Standardized evaluation: RewardBench and RewardBench 2

Internal validation pairs often share the blind spots of your own annotation pipeline, so standardized benchmarks provide a broader external check. **RewardBench** (Lambert et al., 2024) scores preference models across four pairwise categories: Chat (general dialogue and helpfulness), Chat Hard (challenging instruction edge cases), Safety (harm refusal and jailbreak resistance), and Reasoning (mathematics and code correctness).[^lambert2024rewardbench] **RewardBench 2** (Malik et al., 2025; revised April 2026) expands evaluation to Factuality, Precise Instruction Following, Math, Safety, Focus, and Ties, moving ordinary categories to one-among-four selection (25% random baseline) with a separate Ties metric so scores are not directly comparable to RewardBench V1.[^malik2025rewardbench2]

In Tulu 3 8B experiments reported by the RewardBench 2 authors, benchmark scores correlated strongly with best-of-16 sampling performance (Pearson 0.87), whereas PPO outcomes proved far less sensitive among capable reward models and degraded sharply when reward-model initialization or prompt distributions differed from training.[^malik2025rewardbench2] Log the exact benchmark version, model checkpoint, tokenizer, and chat template with every run so results stay comparable.

```checkpoint
A candidate reward model leads the public RewardBench leaderboard. Can you skip fresh rollout checks and run full PPO optimization directly?
---
No. Leaderboard rank in one benchmark setup did not reliably separate PPO outcomes in controlled experiments, especially across distribution shifts. Validate the scorer on fresh outputs from your target policy and prompt mix first, then run a short monitored RL trial.
```

## Architectural spectrum: ORMs, PRMs, verifiers, and generative judges

A scalar Bradley-Terry Outcome Reward Model (ORM) is only one way to score completions. Each supervision paradigm trades off labeling cost, inference speed, interpretability, and vulnerability to reward hacking in a different way. Choosing among supervision designs depends on whether correctness can be checked deterministically, whether step-level attribution is required, and how quickly the scorer must run:

| Approach | Feedback or objective | Primary strengths | Primary vulnerabilities |
|---|---|---|---|
| Scalar Bradley-Terry ORM | Single scalar $r(x, y) \in \mathbb{R}$ | Fast inference, standard PPO/GRPO terminal reward, inspectable margins | Overoptimization, length bias, Goodhart drift |
| Direct Preference Optimization (DPO) | Implicit policy/reference log-ratio | Optimizes policy directly from pairs without a separate scorer | Relies on offline pair coverage, reference anchor, and regularization |
| Process Reward Model (PRM) | Step-level scalars $r(x, y_{1:t})$ | Locates errors across multi-step reasoning traces | High step-annotation cost, still susceptible to gaming[^lightman2023] |
| Generative RM / LLM-as-judge | Verdict text or verdict token probabilities | Flexible rubrics and synthetic label scaling | Inference latency, position bias, rationales that may not reflect true reasons[^mahan2024generative] |
| Verifiable reward / RLVR | Programmatic execution or constraint result | Deterministic validation of specified checks | Incomplete unit tests, parser loopholes, gap between check and intent[^lambert2024rlvr] |

Process Reward Models (PRMs) assign step-by-step scores across mathematical or coding derivations. Lightman et al. showed that step-level supervision improved best-of-N MATH selection on a fixed generator compared with outcome supervision, though they did not train the generator itself via RL and process benefits vary across domains.[^lightman2023] In domains with deterministic checkers, Tulu 3 replaced learned reward models with executable RLVR verifiers for math and instruction constraints.[^lambert2024rlvr] Executable checks remove learned-head vulnerabilities, though reward hacking still persists whenever tests are incomplete or a parser credits a right final token paired with broken reasoning.

## Put the pieces together with TRL

Our two-feature NumPy head isolated shortcut dynamics on CPU. At full transformer scale, TRL 1.13.0 wires together sequence classification, pair collation, and stable BCE optimization via `RewardTrainer`. The configuration fragment below assumes `train_pairs` and `eval_pairs` are Hugging Face `Dataset` objects already grouped by prompt ID, because `RewardTrainer` expects your split to prevent leakage beforehand.

```python title="transformer_reward_training.py"
from trl import RewardConfig, RewardTrainer

# Configured for trl==1.13.0 with pre-split train_pairs and eval_pairs Datasets.
trainer = RewardTrainer(
    model="Qwen/Qwen3-0.6B",
    args=RewardConfig(
        output_dir="reward-head",
        max_length=2048,  # Set to cover full templated sequences without truncating endings.
        center_rewards_coefficient=0.01,  # Starting offset penalty; verify against held-out margins.
    ),
    train_dataset=train_pairs,
    eval_dataset=eval_pairs,
)
trainer.train()
metrics = trainer.evaluate()
trainer.save_model("reward-head/final")
trainer.processing_class.save_pretrained("reward-head/final")
```

Passing a causal model ID instructs TRL to initialize a one-label sequence-classification head automatically. Always save and reload both the trained scalar head and the exact tokenizer and chat template, verifying held-out pair scores after reloading so an uninitialized or dropped linear head is caught immediately.[^huggingface2026rewardSource] Before scaling into policy optimization, review calibration error, fresh-rollout agreement, and shortcut counterexamples alongside clear stop criteria.

### Production diagnostic reference

When a reward-modeling run or downstream RL trial diverges, match the symptom against these diagnostic checks:

#### 1. Training loss drops while held-out accuracy stalls
Stalled validation accuracy paired with shrinking training loss can indicate overfitting, noisy preference labels, widening margins on already easy pairs, or prompt mismatch between splits. Because Bradley-Terry loss keeps pushing already-correct margins further positive, aggregate loss can drop long after ranking decisions stop improving on boundary cases. Check prompt-group overlap, audit label consistency, and inspect held-out loss and counterexample accuracy before changing learning rates.

#### 2. Scorer prefers wordier, padded answers
When verbose errors beat concise correct solutions, training correlations likely linked length with reward or evaluators systematically favored detail over accuracy. Standard held-out evaluation can hide this failure if the validation split obeys the same length skew as training. Build length-matched and length-reversed evaluation slices with technical content held constant, add balanced counterexamples to training, and verify accuracy on those slices rather than relying on length penalties alone.

#### 3. Proxy reward climbs during PPO while human ratings drop
A rising internal score alongside falling user satisfaction signals proxy exploitation or distributional drift into regions where the reward model errs. Pause the optimization run, save policy and scorer checkpoints, and evaluate fresh generations with human judges or verifiable checks. Tightening KL regularization, lowering the optimization budget, diversifying training pairs, or switching to a calibrated ensemble can reduce hacking without removing every evaluator blind spot.

#### 4. Raw scores drift rapidly across steps
Wide shifts in score magnitude typically stem from unanchored score origins, runaway margins on separable pairs, or mismatched pooling and template masks between training and evaluation. Unbounded drift distorts effective KL balance during PPO even when validation pair accuracy looks stable. Log pair midpoints separately from pair margins, verify padding masks and end-of-turn token alignment, and combine centering penalties with L2 regularization and held-out calibration audits.

```checkpoint
For one preference pair, the centering penalty is $\gamma(r_w + r_l)^2$ with $\gamma = 0.02$. Compare score pairs `[8, −8]` and `[2, 2]`. Which penalty pair is correct?

- 1.28 and 0.08.
- 2.56 and 0.32.
- 0.00 and 0.32.
- 0.00 and 0.08.
---
0.00 and 0.32.

The sums are 0 and 4, giving penalties $0.02 \times 0^2 = 0.00$ and $0.02 \times 4^2 = 0.32$. Squaring each score individually or forgetting the factor of four alters the formula, and note that zero centering penalty still leaves the margin `[8, −8]` unconstrained.
```

```checkpoint
A rating-margin loss uses effective logit $r_w - r_l - m$. With $m = 0.6$, what score difference is required to reach an effective chosen probability of 0.8?

- About 1.9863.
- About 1.3863.
- About 0.7863.
- Exactly 0.6000.
---
About 1.9863.

Solving $\sigma(\Delta - 0.6) = 0.8$ gives $\Delta = 0.6 + \log(0.8 / 0.2) = 0.6 + \log 4 \approx 1.9863$. Dropping or subtracting $m$ shifts the required score gap incorrectly, while $\Delta = m$ yields probability 0.50.
```

```checkpoint
Three score-aligned ensemble members return `[1, 3, 5]`. Using sample standard deviation with denominator $K - 1$ and conservative aggregation $\mu - 0.5\sigma$, which value and interpretation hold?

- Aggregate 3; it applies no disagreement penalty and yields an uncalibrated score.
- Aggregate about 2.184; it applies sample deviation and yields an uncalibrated score.
- Aggregate 2; it applies sample deviation and yields an uncalibrated score.
- Aggregate 1; it applies half the variance and yields an uncalibrated score.
---
Aggregate 2; it applies sample deviation and yields an uncalibrated score.

The mean is 3 and the sample variance is $(4 + 0 + 4) / 2 = 4$, so sample standard deviation is 2 and $3 - 0.5 \times 2 = 2$. Remember that this penalty is a conservative heuristic rather than a calibrated confidence interval and cannot fix errors shared across all ensemble members.
```

```checkpoint
A benchmark leaderboard score rises, yet human reviewers find more unsupported technical claims in fresh outputs sampled during a trial run. The trial's predeclared stop rule triggers on unsupported-claim regressions. What action should you take?

- Continue the trial and reuse the static benchmark rank as evidence of quality.
- Continue the trial and drop the new failures from the previous benchmark split.
- Pause fresh output reviews while increasing the proxy-reward optimization budget.
- Stop the trial, save the generated outputs, and investigate the separate support failure.
---
Stop the trial, save the generated outputs, and investigate the separate support failure.

Once the independent regression rule triggers, preserve the checkpoint and failing outputs to diagnose why fresh generations regressed rather than overriding the finding with static leaderboard scores or changing the evaluation set.
```

```mastery-quiz
[
  {
    "question": "A team wants an offline preference update for a writer that summarizes technical reports. For one report, the reviewer prefers summary S, but the fixed reference writer assigns summary T a higher probability. Which update learns the reviewer’s pairwise preference relative to that reference?",
    "options": [
      "Fit a judge to the labeled pairs, then update the writer using its scores on fresh rollouts.",
      "Increase the writer’s log odds of S over T relative to the reference writer’s log odds of S over T.",
      "Increase the writer’s log odds of T over S relative to the reference writer’s log odds of T over S.",
      "Increase S’s log probability relative to its reference value by fitting the writer to preferred summaries alone."
    ],
    "answer": "Increase the writer’s log odds of S over T relative to the reference writer’s log odds of S over T.",
    "explanation": "For each summary, subtract its reference log probability from its current writer log probability. The DPO loss falls as S’s log ratio grows relative to T’s. Because the reviewer preferred S, favoring T reverses the label. Training on preferred summaries alone omits T’s contribution, while fitting a separate judge for fresh rollouts describes an online RL loop."
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
    "explanation": "The final unmasked position is index 2. Its score is 2×0.25+4×0.5=2.50. Index 3 is padding, and earlier indices cannot read the complete response suffix in a causal decoder."
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
    "explanation": "Chosen minus rejected is −0.7. The chosen probability is σ(−0.7)≈0.3318 and its negative natural logarithm is about 1.1032. Reversing the sign or logging the rejected outcome yields the other logistic values."
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
    "explanation": "Identical scored inputs produce the same deterministic function and Jacobian. Their difference is zero and the pair loss is log(2); its shared parameter derivatives cancel. The recorded strict label is not a tie, and no independent candidate heads are present."
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
    "explanation": "Five candidates yield 5×4/2=10 pairs and two yield one. Equal pair weighting gives 10:1. Averaging each prompt’s losses before averaging prompts gives equal loss mass, while gradient norms may still differ."
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
    "explanation": "The raw training gap is 4 × 2 = 8. The margin is 1.5 × 2 = 3, so the loss uses a logit of 8 − 3 = 5. Reporting 3 gives the amount subtracted. Ranking the shorter correct answer first would require a different scoring rule, because this scorer still awards 4 points for every extra unit of length on the held-out pair."
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
    "explanation": "Average per-vote squared error: (6×0.4²+4×0.6²)/10=0.24 and (6×0.1²+4×0.9²)/10=0.33. Both forecasts choose A, but their probability errors differ, and ten recorded votes are too small to guarantee population calibration."
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
    "explanation": "Factor four out of the scaled objective to obtain original reward minus (0.12/4)×KL. The equivalent coefficient is 0.03. This identity concerns the ideal maximizer; actual PPO dynamics also depend on implementation and optimization."
  },
  {
    "question": "A live LoRA reward scorer and its reloaded copy score the same two held-out replies to one prompt. For each reply, their pooled vectors match exactly. Each scorer applies a linear head directly to its pooled vector. In reply order, the live scores are [6, 2] and the reloaded scores are [2, 4]. The live weights are available. Which repair and check would recover and verify both raw scores?",
    "options": [
      "Copy the live tokenizer and chat template. After reload, compare each reply’s pooled vector with its live value.",
      "Copy the live scoring head. After reload, compare each reply’s score with its live value.",
      "Adjust the output bias to match the live mean. After reload, compare each reply’s score with its live value.",
      "Copy the live scoring head. After reload, check which reply ranks first in each run."
    ],
    "answer": "Copy the live scoring head. After reload, compare each reply’s score with its live value.",
    "explanation": "The same two vectors produce different score gaps. The live gap is 6 − 2 = 4, and the reloaded gap is 2 − 4 = −2. A shared bias shifts both scores equally and preserves the gap. The tokenizer and template feed the vectors, which already match. Copying the live head restores the mapping from each vector to its score, whereas a ranking check would accept [5, 3] even though the live scores were [6, 2]."
  },
  {
    "question": "A validation screen requires at least 85% agreement on 28 freshly reviewed pairs; 23 agree. Three calibrated scorers also each assign score 7 to an answer whose citation fails an independent source check. Which outcome follows?",
    "options": [
      "Pair screen passes; zero ensemble disagreement makes the source check pass.",
      "Pair screen fails; zero ensemble disagreement makes the source check pass.",
      "Pair screen fails; the source check also fails despite the ensemble aggregate 7.",
      "Pair screen passes; the source check fails despite the ensemble aggregate 7."
    ],
    "answer": "Pair screen fails; the source check also fails despite the ensemble aggregate 7.",
    "explanation": "23/28≈82.14%, below 85%, so the pair screen fails. Scores [7,7,7] have zero deviation, keeping the conservative aggregate at 7, yet agreement across models cannot fix an independently observed missing citation. Both stated checks fail."
  }
]
```

> **Next:** Continue to [RLHF & DPO Alignment](/learn/rlhf-dpo-aligning-language-models). You can now fit a scalar head, distinguish score offsets from scale, and test preference shortcuts. Next, use a reward signal inside PPO with KL control or train directly from labeled pairs with DPO.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Suppose your preference dataset looks clean, your reward scorer reaches 100% pair accuracy on validation, and you are ready to optimize an assistant against it. Then you test one counterexample on a Python numerical-stability question: a long, flattering answer that wrongly advises casting to `float64` *after* calling `exp(z)`, pitted against a concise two-line fix that subtracts `max(z)` *before* `exp(z)`. Your scorer picks the bloated buggy answer by a wide margin. Because correct answers in your training set happened to be longer, the head never learned numerical stability; it learned to count tokens.

That is the central danger of reward modeling, and downstream optimization magnifies it. A scorer that merely ranks static responses can embarrass you during evaluation. A scorer placed inside a reinforcement learning loop actively teaches the policy to exploit every flaw in what the scorer rewards.

Why train a reward model at all when supervised demonstrations are simpler? Because pairwise comparisons are far easier to collect than writing ideal answers from scratch, and reviewers can reliably compare two candidate completions on the same prompt. InstructGPT trained its scalar reward model on rankings of this form.[^ouyang2022] A reward model maps a prompt and full response to a single real score that can either select the best among $N$ sampled answers at inference time or provide the terminal reward for policy optimization in the next chapter. Let's build the scorer first, then test whether its numbers can actually be trusted.

Our running example asks how to prevent exponential overflow when implementing softmax in Python. Response A (`chosen`) is concise and accurate: subtract `max(z)` from every logit before calling `exp(z)`. Response B (`rejected`) looks confident and helpful yet fails silently on large logits: cast outputs to `float64` *after* `exp(z)` returns infinity. A third variant gives the buggy cast-after-`exp` advice buried inside three paragraphs of apology and boilerplate. A useful scorer must reward the real stability fix rather than the length wrapped around a mistake.

## From language model to scorer

A generative language model predicts a probability distribution over the vocabulary at each token step. A reward model instead returns one real-valued scalar for an entire completed sequence $(x, y)$, written $r_\theta(x, y) \in \mathbb{R}$. Converting an autoregressive transformer into a scorer requires only a small projection change: take the transformer backbone, strip away its vocabulary unembedding layer, and attach a linear head mapping the hidden state to a single scalar. InstructGPT initialized its reward models from an SFT checkpoint in the main text while noting in its appendix that its final scorer began from a checkpoint fine-tuned on public datasets with similar results, whereas Llama 3 began directly from a pretrained base model.[^ouyang2022][^dubey2024] You can fine-tune the whole backbone, train LoRA adapters together with the head, or freeze the backbone and train only the head, though with LoRA you must verify that the scalar head stays trainable and is saved inside the exported checkpoint.

Choosing which token position feeds that scalar head is equally critical. In a causal decoder, each position attends only to itself and preceding tokens, so an earlier token misses the rest of the answer. Reading from the **final real token** lets the hidden state incorporate the full prompt and entire completion, though dedicated scoring tokens or alternate pooling schemes can work when configured consistently. Padding shifts that final token across a batch: under left padding it always sits at index `-1`, whereas under contiguous right padding it sits at `mask.sum(dim=-1) - 1`. Gather the target vector explicitly using the attention mask rather than assuming masked padding positions stay inactive.

<figure>
  <img src="illustrations/_generated/last_real_token_readout_dark.png" alt="Left-padded and right-padded sequences select the same final real hidden vector, two comma three. The scalar head one-half comma one returns reward four for both." />
  <figcaption>Tracing each sequence mask locates the same final real hidden vector regardless of padding side, producing score 4.0 for both layouts.</figcaption>
</figure>

Sequence truncation can distort supervision just as badly as faulty pooling. If reviewers preferred one completion because of a crucial numerical warning at the end, chopping off the suffix removes the very evidence behind the label. Filtering out long sequences keeps labels honest while shifting your prompt distribution, so record how many rows are dropped and from which topics; TRL 1.17's `RewardConfig` defaults to `max_length = 1024` across the full templated prompt and response and drops overlong pairs unless disabled.[^trl2026RewardTrainerV117][^trl2026RewardConfigV117] Before fitting anything, verify four pair checks: both completions share the exact prompt, system text, and template; both remain distinct after tokenization (since identical token IDs produce zero difference and zero gradient); label types match your loss (strict wins for Bradley-Terry, separate handling for ties); and candidate metadata records source checkpoints, temperatures, and reviewer cohorts.

## Turn a score difference into a preference

Suppose our trained head gives the `max(z)`-shifted answer score `1.80` and the post-`exp` cast answer score `0.70`, yielding a margin $\Delta = r_w - r_l = 1.10$. The **Bradley-Terry** model turns that margin into a model-implied win probability using the logistic sigmoid:

$$
p(y_w \succ y_l \mid x) = \sigma(r_w - r_l), \qquad \sigma(z) = \frac{1}{1 + e^{-z}}.
$$

At $\Delta = 1.10$, the model implies about a `0.7503` chance that reviewers prefer A over B. Remember that this is the model's parameterized link rather than a verified human agreement rate until checked with calibration tests, and a zero margin means only equal odds rather than distinguishing genuine uncertainty from untried prompts. For strict binary labels, training minimizes the negative log-likelihood $-\log\sigma(\Delta)$, which is binary cross-entropy with target $1$ evaluated on logit $\Delta$. Always compute $\log\sigma(\Delta)$ via a numerically stable logit formula such as `logaddexp`, because taking the logarithm of a rounded sigmoid can overflow to infinity.

<figure>
  <img src="illustrations/_generated/reward_modeling_dark.png" alt="Chosen reward 1.80 and rejected reward 0.70 give margin 1.10, sigmoid probability 0.7503, and pair loss 0.2873." />
  <figcaption>Following the two scores to their difference 1.10 maps directly onto the logistic curve, yielding win probability 0.7503 and pair loss 0.2873.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, id=reader-reward-preference-loss, output=show, output_title="Reader preference loss" -->
```python title="reader-reward-preference-loss.py"
import numpy as np

chosen, rejected = 1.8, 0.7
margin = chosen - rejected
probability = float(1.0 / (1.0 + np.exp(-margin)))
loss = float(np.logaddexp(0.0, -margin))
chosen_gradient = probability - 1.0
rejected_gradient = -chosen_gradient
print(f"margin={margin:.2f}; probability={probability:.4f}; "
      f"loss={loss:.4f}")
print(f"score derivatives: {chosen_gradient:+.4f}, "
      f"{rejected_gradient:+.4f}")
assert abs(chosen_gradient + rejected_gradient) < 1e-12
```

<!-- leetllm: output:start -->
```text title="Reader preference loss" output compact
margin=1.10; probability=0.7503; loss=0.2873
score derivatives: -0.2497, +0.2497
```
<!-- leetllm: output:end -->

The loss derivative with respect to $\Delta$ is $\sigma(\Delta) - 1$, concentrating learning where the model is most mistaken: confidently correct pairs yield tiny derivatives near zero, zero margins give $-0.5$ and $+0.5$, and confidently inverted rankings saturate toward $-1$ and $+1$. Notice an important twist when updating shared neural network weights rather than isolated numbers. Because both scores pass through shared parameters, gradient updates can move both scores downward together; in a one-feature head $r = wh$ with $h_w = 1, h_l = 2$ and $w = -1$, a descent step makes $w$ more negative, dropping both scores while making the rejected score fall twice as fast so the margin widens. Always monitor pair margins alongside mean scores so a joint downward drift never looks like a broken update.

## Origin, scale, and calibration are different questions

Because pairwise cross-entropy reads only $r_w - r_l$, adding `+10` to every score leaves margins, probabilities, losses, and bias gradients completely invariant. A raw reward value therefore carries no absolute unit: `2.0` is not twice as good as `1.0`, and two independently trained scorers do not share a zero point unless aligned on shared calibration data. Scaling both scores by 3 tells the opposite story, tripling the margin from `1.10` to `3.30` and pushing the implied win probability up to `0.9644`. Scale also governs downstream RL optimization, which trades expected reward against a KL penalty anchoring the policy near its reference; tripling reward magnitudes without changing the KL weight divides the effective KL constraint by three.

<figure>
  <img src="illustrations/_generated/score_origin_and_scale_dark.png" alt="The original score pair and a pair shifted upward by ten share margin 1.10 and probability 0.7503. Multiplying the original scores by three changes the margin to 3.30 and probability to 0.9644." />
  <figcaption>Translating both scores by +10 leaves the margin and sigmoid probability untouched, whereas scaling by 3 triples the margin and boosts implied probability to 0.9644.</figcaption>
</figure>

To keep score origins steady, InstructGPT shifted scores so human demonstrations averaged zero before RL, while TRL exposes a small quadratic penalty on $(r_w + r_l)^2$ proposed by Eisenstein et al.[^ouyang2022][^eisenstein2023ensembles] Know what that regularizer enforces: scores of `+100` and `-100` sum to zero and incur zero penalty, so centering pulls pair midpoints near zero without bounding individual scores or calibrating probabilities. Calibration must be checked separately by locking candidate identities A and B before recording votes, then scoring predicted probabilities $p(A)$ against observed vote outcomes via the Brier score (mean squared error). Even on four votes `[1, 1, 1, 0]`, two models that both pick A with equal accuracy diverge clearly under Brier error:

<!-- leetllm: test, deps=numpy, id=reader-reward-scale-and-brier, output=show, output_title="Reader origin, scale, and Brier" -->
```python title="reader-reward-scale-and-brier.py"
import numpy as np

def win_probability(chosen, rejected):
    return float(1.0 / (1.0 + np.exp(-(chosen - rejected))))

for name, chosen, rejected in [("original", 1.8, 0.7),
                               ("shifted +10", 11.8, 10.7),
                               ("scaled x3", 5.4, 2.1)]:
    print(f"{name}: margin={chosen - rejected:.2f}, "
          f"p={win_probability(chosen, rejected):.4f}")

votes = np.array([1.0, 1.0, 1.0, 0.0])  # three of four reviewers chose A
for prediction in (0.75, 0.99):
    brier = float(np.mean((prediction - votes) ** 2))
    print(f"p(A)={prediction}: Brier={brier:.4f}")
```

<!-- leetllm: output:start -->
```text title="Reader origin, scale, and Brier" output compact
original: margin=1.10, p=0.7503
shifted +10: margin=1.10, p=0.7503
scaled x3: margin=3.30, p=0.9644
p(A)=0.75: Brier=0.1875
p(A)=0.99: Brier=0.2451
```
<!-- leetllm: output:end -->

Predicting `0.75` matches this small sample better, though four observations cannot prove population calibration across larger benchmarks, so always report sample sizes and task slices. Keep repeated-vote empirical fractions distinct from explicit "equally good" tie annotations as well, using soft targets for vote fractions and tie-aware objectives for explicit ties.

## Watch a scorer learn the wrong thing

We can now reproduce the chapter's opening failure in a compact two-feature NumPy head with features `[correctness, scaled_length]` and light L2 shrinkage. In the confounded dataset, every numerically correct answer is also one unit longer than the buggy candidate, giving identical gradients along both features. In the balanced dataset, a concise fix beats a verbose mistake, breaking that correlation. Both heads reach 100% accuracy on their training pairs, yet only one survives held-out counterexamples pitting a short fix `(1, 0)` against padded wrong advice `(0, 2)`:

<!-- leetllm: test, deps=numpy, id=reader-reward-fitted-shortcut, output=show, output_title="Reader fitted reward shortcut" -->
```python title="reader-reward-fitted-shortcut.py"
import numpy as np

confounded = np.array([[[1.0, 1.0], [0.0, 0.0]], [[1.0, 2.0], [0.0, 1.0]]])
balanced = np.array([[[1.0, 1.0], [0.0, 0.0]], [[1.0, 0.0], [0.0, 1.0]]])
counterexamples = np.array([[[1.0, 0.0], [0.0, 2.0]],
                            [[1.0, 0.0], [0.0, 3.0]],
                            [[1.0, 1.0], [0.0, 1.0]]])

def fit(pairs):
    weights = np.zeros(2)
    differences = pairs[:, 0] - pairs[:, 1]
    for _ in range(300):
        margins = differences @ weights
        sigmoid_neg = -1.0 / (1.0 + np.exp(margins))
        gradient = (differences.T @ sigmoid_neg) / len(pairs) + 0.02 * weights
        weights -= 0.1 * gradient
    return weights

def accuracy(weights, pairs):
    return float(np.mean((pairs[:, 0] - pairs[:, 1]) @ weights > 0))

for name, pairs in [("confounded", confounded),
                    ("balanced", balanced)]:
    weights = fit(pairs)
    print(name, np.round(weights, 3).tolist(),
          f"train={accuracy(weights, pairs):.2f}",
          f"counterexamples={accuracy(weights, counterexamples):.2f}")
```

<!-- leetllm: output:start -->
```text title="Reader fitted reward shortcut" output compact
confounded [1.629, 1.629] train=1.00 counterexamples=0.33
balanced [2.667, 0.0] train=1.00 counterexamples=1.00
```
<!-- leetllm: output:end -->

Both heads fit their training sets flawlessly, while the confounded head assigns equal weight `1.629` to correctness and length so the verbose error `(0, 2)` scores `3.258` and beats the concise fix `(1, 0)` at `1.629`. Starting at zero weight, the balanced head receives opposing length gradients that cancel out, isolating correctness cleanly at `[2.667, 0.0]`. Notice that L2 regularization shrinks weight magnitudes without distinguishing legitimate signals from length shortcuts; dataset balance is what removes the confound.

<figure>
  <img src="illustrations/_generated/reward_generalization_gap_dark.png" alt="Two fitted reward directions both separate their training pairs. The confounded direction favors a verbose error, while the balanced direction favors correctness and passes all three controlled counterexamples." />
  <figcaption>Confounded training pairs steer the weight vector along the length diagonal, whereas balanced contrast pairs align the head strictly with correctness.</figcaption>
</figure>

Beware easy fixes that look rigorous on paper yet preserve the underlying exploit. Subtracting a length penalty margin $\alpha\Delta_{\text{len}}$ from longer winners forces a higher score gap during training, yet a pure length scorer $r(y) = b\,\text{len}(y)$ simply increases $b$ to push $(b - \alpha)\Delta_{\text{len}}$ upward while still scoring verbose mistakes ahead of short fixes. Conversely, rating-strength margins have valid uses: Llama 2 added rating-dependent margins inside the sigmoid for "much better" labels before Llama 3 dropped them as training data scaled.[^touvron2023a][^dubey2024] Even with a margin, reaching $\Delta = m$ leaves the loss at $\log 2$ rather than zero, and lasting robustness comes from balanced pairs covering concise fixes, thorough explanations, and verbose errors evaluated on length-reversed slices.

## Evaluate as if the scorer wants to fool you

Sound evaluation begins with the train/test split and batch weighting. Expanding $K$ ranked responses into $\binom{K}{2}$ separate rows leaks the same prompt and candidates across naive random splits and causes overfitting when shuffled independently; InstructGPT kept each prompt's comparisons together in one batch item to prevent overfitting and keep a $K=9$ prompt (36 pairs) from carrying 36 times the loss weight of a $K=2$ prompt.[^ouyang2022] Group by prompt and near-duplicate clusters when testing unseen-prompt generalization, or state explicitly if you are holding out completions for fixed known prompts. Beyond pair accuracy, inspect margins, score drift, gradient norms, and fresh-rollout agreement together:

| Metric | What it shows | What it hides |
| --- | --- | --- |
| Pair accuracy | How often the winner scored higher | Shrinking margins, shortcut reliance |
| Mean margin | Separation between pairs | Calibration |
| Mean reward | Score drift | Ordering quality |
| Gradient norm | Optimization stability | Reliance on spurious features |
| Accuracy on fresh outputs | Agreement on text the generator is producing now | Unsampled failures, human disagreement |

Construct adversarial slices where content and formatting vary independently (short accurate fixes, necessary detailed derivations, padded errors, and fluent responses citing nonexistent APIs) and read both high-confidence failures and apparent wins. Standardized suites like **RewardBench** (chat, chat hard, safety, reasoning) and **RewardBench 2** (factuality, instruction following, math, safety, focus, ties, with 4-way ranking baseline 25%) catch blind spots your own pipeline misses.[^lambert2024rewardbench][^malik2025rewardbench2] Keep in mind that in Tulu 3 8B experiments, RewardBench 2 correlated well with best-of-16 selection ($r = 0.87$) yet did not reliably predict downstream PPO differences across competent reward models, and PPO dropped sharply under mismatched backbones or prompt shifts, making fresh policy validation indispensable.

## Optimization will find the holes

Static evaluation measures responses you already generated, whereas RL optimization actively searches for completions that score high due to evaluator flaws. Goodhart's Law names this breakdown: optimizing a proxy relentlessly exposes discrepancies between proxy reward and intended behavior. Gao et al. demonstrated the effect cleanly using a large gold reward model as a stand-in evaluator, showing proxy reward rising monotonically while gold score peaked and collapsed under heavy PPO or best-of-N optimization.[^gao2023scaling] Real policy optimizers repeatedly exploit four weaknesses: verbosity correlated with quality in training pairs, sycophantic agreement with user mistakes over honest corrections,[^sharma2023sycophancy] excessive markdown lists and boilerplate formatting,[^eisenstein2023ensembles] and omitted safety or truthfulness criteria.

Aligning and ensembling $K \ge 2$ reward models with a conservative score $\mu - \lambda\sigma$ mitigates hacking when models disagree on unfamiliar outputs,[^eisenstein2023ensembles] yet shared mistakes across all ensemble members yield $\sigma = 0$ and pass straight through unpenalized, requiring factual checks or distinct judges to catch. Before running large RL jobs, sample fresh generations from your target policy, inspect human reviews, fix stop rules independent of the proxy, and verify reloaded scorer checkpoints produce exact identical scores alongside saved tokenizers and templates.

## Pick the signal that fits

A scalar reward model is one option on a wider spectrum of alignment feedback signals, and picking the simplest reliable signal avoids unnecessary training complexity:

| Approach | Signal | Strength | Weakness |
| --- | --- | --- | --- |
| Scalar reward model | One number per answer | Fast, reusable, inspectable margins | Overoptimization, shortcuts |
| Direct preference optimization | Policy and reference log-ratio | No separate scorer | Depends on pair coverage and reference |
| Process reward model | Scores per reasoning step | Locates where a trace goes wrong[^lightman2023] | Expensive labels, still gameable |
| Generative judge | Verdict text or probabilities | Flexible rubrics[^mahan2024generative] | Latency, position bias, shared errors |
| Verifiable reward | Result of running a check | Direct test of a specified property[^lambert2024rlvr] | Incomplete tests, parsing gaps |

When a deterministic test verifies everything the task requires, use the checker while guarding against hardcoded test-passing exploits; when you need fast reusable ranking across many rollouts, train a scalar reward head; and when you simply want to steer a policy directly from existing pairs, DPO removes the separate scorer altogether. Whenever a reward training run looks off, trace symptoms to their root mechanism:

- **Training loss drops while held-out accuracy stalls.** Audit prompt-group overlap, noisy labels, and margin inflation on easy comparisons, then check counterexamples.
- **Scorer favors wordier answers.** Evaluate length-matched and length-reversed pairs holding correctness fixed, then add balanced counterexamples.
- **Proxy reward rises while human satisfaction falls.** Pause optimization, preserve artifacts, and test fresh policy generations with stronger KL control, smaller budgets, or independent evaluators.
- **Raw scores drift wildly.** Log pair midpoints separately from margins; centering pulls midpoints toward zero, while regularization and calibration target scale and probability fit.

```checkpoint
A scorer gives the winner 1.3 and the loser 0.8. What are the win probability and the pair loss? Now add 5 to both scores. What changes?
---
The margin is 0.5, so the probability is $\sigma(0.5) \approx 0.6225$ and the loss is $-\log 0.6225 \approx 0.4741$. Adding 5 to both scores leaves the margin at 0.5, so neither probability nor pair loss changes because pairwise differences ignore score offsets.
```

## Where this leaves you

You can now convert a language model into a scalar scorer, interpret Bradley-Terry margins separately from arbitrary score origins, calibrate probabilities against fixed-order outcomes, and catch superficial shortcuts like length bias using balanced counterexamples before policy optimization exploits them. So far, however, our scorer has only evaluated answers without changing the assistant's generation weights. In [RLHF and DPO Alignment](/learn/rlhf-dpo-aligning-language-models), we feed this feedback into PPO and DPO to shift policy probabilities directly, including mass on unseen responses never compared during labeling.

<!-- leetllm: edition:reader:end -->
