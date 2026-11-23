---
{
  "id": "knowledge-distillation-llms",
  "title": "Knowledge Distillation for LLMs",
  "slug": "knowledge-distillation-llms",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/soft_labels_dark_knowledge_dark.png",
  "companies": [
    "Google",
    "DeepSeek",
    "OpenAI",
    "Meta",
    "Hugging Face"
  ],
  "shortDescription": "A smaller model can copy a teacher's probabilities and still miss the expired-admin case, so the release gate must check policy behavior and speed.",
  "keyConceptsTested": [
    "Teacher-student framework",
    "Soft label distillation",
    "Feature-based vs response-based distillation",
    "Forward vs reverse KL",
    "On-policy vs off-policy distillation",
    "Student capacity limits",
    "KL Divergence",
    "Temperature Hyperparameter",
    "Tokenizer and vocabulary alignment",
    "Next-token label shifting",
    "Synthetic Data Generation",
    "Teacher-output validation",
    "Deployment evaluation gates"
  ],
  "section": "Advanced Training & Adaptation",
  "order": 15,
  "prerequisites": [
    "rlvr-verifiable-rewards-training",
    "supervised-fine-tuning-pipeline",
    "build-gpt-from-scratch-lab",
    "softmax-cross-entropy-optimization"
  ],
  "relatedQuestions": [
    "rlvr-verifiable-rewards-training",
    "model-merging-weight-interpolation",
    "programmatic-prompt-optimization-dspy",
    "model-quantization-gptq-awq-gguf"
  ]
}
---

Consider an access-policy assistant where a 7B student passes familiar key-restoration cases but answers an expired-admin case with `7 days` when policy dictates `not allowed`. Lower latency cannot compensate for safety regressions on critical authorization rules.

The previous lesson used Reinforcement Learning with Verifiable Rewards (RLVR) to train against checked outcomes. For a large language model (LLM), distillation asks a different question: can a smaller model learn useful behavior from an existing model? The teacher might come from RLVR, ordinary pre-training, or another training recipe.

<span data-glossary="teacher-student-distillation">Knowledge distillation</span> trains a **student** using signals from a **teacher**, transferring capability into a more efficient model. The teacher does not have to possess more parameters; self-distillation can leverage a model's own verified reasoning traces. For example, a 70B teacher evaluates security policies with high accuracy, but per-query compute budgets require serving a 7B student that preserves behavior under strict latency and throughput targets.

That transfer signal depends on what the teacher exposes. In white-box settings, the student can match softened <span data-glossary="token">token</span> probabilities or internal features. In black-box settings, it fine-tunes on selected teacher-written answers, solution traces, or synthetic corpora. The student doesn't inherit the teacher's judgment. It copies the behavior you can measure, then earns release through the same restore-window checks, latency target, and cost budget.

Before computing a token-level loss, compare teacher and student on the same token vocabulary, prompt formatting, and response positions. Two arrays can share a shape while assigning column `17` to different tokens. The loss still runs, but it trains the student toward the wrong words.

## Why soft labels teach more than hard labels

The staging regression points at a weakness in hard labels. Hinton et al. popularized a practical formulation in 2015: train a student to mimic a teacher's behavior rather than relying only on ground-truth labels. A teacher's full probability distribution can carry more information than a one-hot label.[^hinton2015]

Start with four answer classes, each treated as a single token in a miniature vocabulary. For the disabled-key case, the target answer is `7d`, so a hard label puts mass 1.00 on `7d` and zero on every alternative. A one-hot target discards the teacher's relative ranking among non-target alternatives. This relative probability information is called **dark knowledge**. Here `3d` receives more mass than `30d` or `never`.

<figure>
  <img src="illustrations/_generated/soft_labels_dark_knowledge_dark.png" alt="Three aligned probability tracks compare a trusted one-hot target with the teacher at T=1 and T=4 for 7d, 3d, 30d, and never. The top two answers stay in the same order while the 7d-minus-3d gap narrows from 1.000 to approximately 0.708 to approximately 0.156. Probability labels show four decimal places. The logits are a constructed restore-window example; T²=16 at T=4 is an approximate high-temperature gradient compensation." />
  <figcaption>The same probabilities are plotted on a 0 to 1 axis to four decimal places. Temperature preserves the ranking order while softening the top gap. T² compensates for gradient scaling as distributions flatten.</figcaption>
</figure>

Those four bars illustrate the distribution. For a causal LLM, logit distillation applies the same formulation at each predicted token position. <span data-glossary="temperature">Temperature</span> $T$ divides the logits before softmax. $T = 1$ is the ordinary distribution. For finite $T > 1$, the distribution flattens while rank order is preserved. As $T \to \infty$, probabilities approach uniform.

The code below evaluates logits $[4.0, 2.0, 1.0, 0.7]$ across $T = 1$, $T = 4$, and $T = 40$:

<!-- leetllm: test, output=show -->
```python title="temperature-softening.py"
import math

logits = {"7d": 4.0, "3d": 2.0, "30d": 1.0, "never": 0.7}

def softened_probabilities(temperature: float) -> dict[str, float]:
    if temperature <= 0:
        raise ValueError("Temperature must be positive.")
    offset = max(logits.values())
    scaled = {token: math.exp((logit - offset) / temperature) for token, logit in logits.items()}
    total = sum(scaled.values())
    return {token: value / total for token, value in scaled.items()}

for temperature in (1.0, 4.0, 40.0):
    probs = softened_probabilities(temperature)
    rounded = {token: round(probability, 3) for token, probability in probs.items()}
    top_gap = probs["7d"] - probs["3d"]
    print(f"T={temperature:g} probabilities:", rounded, "top_gap:", round(top_gap, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
T=1 probabilities: {'7d': 0.818, '3d': 0.111, '30d': 0.041, 'never': 0.03} top_gap: 0.708
T=4 probabilities: {'7d': 0.397, '3d': 0.241, '30d': 0.188, 'never': 0.174} top_gap: 0.156
T=40 probabilities: {'7d': 0.263, '3d': 0.25, '30d': 0.244, 'never': 0.242} top_gap: 0.013
```
<!-- leetllm: output:end -->

Once alternatives carry signal, decide how much to trust that signal. A common training objective blends the teacher-matching loss with a ground-truth task loss:

$$
\mathcal{L} = \alpha \cdot \mathcal{L}_{\text{distill}} + (1 - \alpha) \cdot \mathcal{L}_{\text{task}}
$$

$\mathcal{L}_{\text{distill}}$ matches teacher behavior, $\mathcal{L}_{\text{task}}$ matches trusted labels, and $\alpha \in [0, 1]$ sets the mix. Raising $\alpha$ copies more of the teacher, including its mistakes. That makes $\alpha$ a behavior-and-risk choice, not a knob to tune from training loss alone.

```checkpoint
What happens when $\alpha$ moves closer to 1?
---
The student listens more to the teacher distribution and less to the hard task labels. That can transfer richer teacher behavior, but it also makes teacher mistakes more influential.
```

Distillation fits cases where you have a strong teacher, legal access to its signal, and a clear smaller deployment target. The Gemma 2 report gives a controlled example: the authors train the 2B and 9B models with token-probability distillation, and a 2B ablation trained for 500B tokens scores `67.7` when distilled from a 7B teacher versus `60.3` from scratch on their three-benchmark average.[^gemma2team2024] In this ablation, the 7B teacher mimics the reported 27B-to-9B size gap; keep this result distinct from the production-teacher setup.

Gemma 2 writes the distillation objective as a token-level negative log-likelihood under the teacher distribution, which matches forward KL up to the teacher's entropy, a constant with respect to the student. Different recipes still expose different channels: Orca trains on explanation traces, phi-1.5 uses curated synthetic textbook-like data, and Gemma 2 uses teacher token probabilities for small models.[^mukherjee2023][^li2023c][^gemma2team2024] These examples motivate careful data and signal selection. They don't establish one universally best recipe.

Soft labels explain why a teacher distribution can beat a one-hot target. On a causal language model, those probabilities still have to land on the right token positions. What trains the student toward the wrong words when two arrays already share a shape?

## Matching the teacher's probabilities: logit distillation

Token-distribution KD needs aligned teacher probabilities or **<span data-glossary="logits">logits</span>**, the raw scores before <span data-glossary="softmax">softmax</span>. Full normalized log-probabilities are also enough to reconstruct a temperature-scaled distribution; a truncated top-k list generally isn't. Here training minimizes <span data-glossary="kl-divergence">KL divergence</span> (Kullback-Leibler divergence) so the student's token distribution tracks the teacher's.

Send the same restore-window prompt through both models. The teacher's output distribution acts as a soft supervision target, while only the student parameters receive gradient updates.

<figure>
  <img src="illustrations/_generated/causal_logit_alignment_dark.png" alt="Four positions show teacher and student vectors of four logits aligned at the same t. The target token IDs are [0, 0, 1, -100]; shifting labels left pairs logits t0 with label[1]=0 (7d), t1 with label[2]=1 (3d), and t2 with label[3]=-100 (ignored by both KL and hard loss). The final t3 logits have no next label." />
  <figcaption>Teacher and student logits are evaluated at the same prefix position. The hard target shifts one step: t0 pairs with label[1], t1 with label[2], and t2 with the -100 ignore index. That mask excludes t2 from both losses, while t3 has no next-token target.</figcaption>
</figure>

Start by applying temperature scaling, dividing both models' logits by $T > 1$ before softmax:

$$
q_i = \frac{\exp(z_{t,i} / T)}{\sum_j \exp(z_{t,j} / T)},
\quad
p_i = \frac{\exp(z_{s,i} / T)}{\sum_j \exp(z_{s,j} / T)}
$$

$z_t$ are the teacher's logits, $z_s$ are the student's logits, and $T$ is temperature. The KL term is then

$$
\mathcal{L}_{\text{KL}} = T^2 \sum_i q_i \log \frac{q_i}{p_i}
$$

*   $q_i$ is the teacher's softened probability for token $i$ (the target)
*   $p_i$ is the student's softened probability for token $i$ (the current prediction)
*   $T$ is temperature (higher $T$ softens the distribution and flattens probability peaks)
*   The $T^2$ factor compensates for approximate high-temperature gradient attenuation when mixing soft and hard losses; it doesn't make every finite-temperature gradient identical.[^hinton2015]
*   The hard task loss, when included, uses ordinary cross-entropy at $T = 1$
*   KL divergence measures the extra surprisal of coding samples from $q$ using a code optimized for $p$

### Mathematical derivation of the T² gradient scaling factor

Why multiply soft KL by $T^2$? Hinton et al. motivate this convention through a high-temperature approximation.[^hinton2015] The exact derivative explains both its usefulness and its limits. Other loss weights or learning-rate choices can compensate differently; $T^2$ isn't required for a valid objective.

Consider a single token position across vocabulary $V$. Let $z_s$ and $z_t$ represent the raw student and teacher logits. With temperature $T$, the softened probability distributions are:

$$
p_i = \frac{\exp(z_{s,i} / T)}{\sum_{j \in V} \exp(z_{s,j} / T)},
\quad
q_i = \frac{\exp(z_{t,i} / T)}{\sum_{j \in V} \exp(z_{t,j} / T)}
$$

At a given prefix, the frozen evaluation-mode teacher supplies detached probabilities $q_i$, held fixed for this gradient calculation. New prefixes can supply different targets. Minimizing the KL divergence $D_{\mathrm{KL}}(q \parallel p) = \sum_i q_i \log q_i - \sum_i q_i \log p_i$ with respect to student parameters is identical to minimizing the cross-entropy loss under softened targets:

$$
\mathcal{L}_{\text{soft}} = - \sum_{i \in V} q_i \log p_i
$$

Let $v_i = z_{s,i} / T$ denote the scaled student logit. Differentiating $\mathcal{L}_{\text{soft}}$ with respect to $v_i$ yields the standard softmax cross-entropy gradient:

$$
\frac{\partial \mathcal{L}_{\text{soft}}}{\partial v_i} = p_i - q_i
$$

To find the gradient with respect to the actual trainable student logit $z_{s,i}$, apply the chain rule:

$$
\frac{\partial \mathcal{L}_{\text{soft}}}{\partial z_{s,i}} = \frac{\partial \mathcal{L}_{\text{soft}}}{\partial v_i} \cdot \frac{\partial v_i}{\partial z_{s,i}} = (p_i - q_i) \cdot \frac{1}{T}
$$

The chain rule supplies one factor of $1/T$. For the next approximation, temperature must be high relative to the logit spread. Softmax is invariant to a shared offset, so center each model's logits first. Using $\exp(x) \approx 1+x$ when the centered logits divided by $T$ are small:

$$
p_i = \frac{\exp(z_{s,i} / T)}{\sum_{j \in V} \exp(z_{s,j} / T)}
\approx \frac{1 + z_{s,i} / T}{\sum_{j \in V} (1 + z_{s,j} / T)}
= \frac{1 + z_{s,i} / T}{|V| + \frac{1}{T}\sum_j z_{s,j}}
= \frac{1 + z_{s,i} / T}{|V|(1 + \bar{z}_s / T)}
$$

where $\bar{z}_s = \frac{1}{|V|} \sum_j z_{s,j}$ is the mean student logit across vocabulary $V$. Applying the geometric expansion $(1 + \epsilon)^{-1} \approx 1 - \epsilon$:

$$
p_i \approx \frac{1}{|V|} \left(1 + \frac{z_{s,i}}{T}\right) \left(1 - \frac{\bar{z}_s}{T}\right)
\approx \frac{1}{|V|} \left(1 + \frac{z_{s,i} - \bar{z}_s}{T}\right)
$$

The exact same expansion applies to the teacher's softened probabilities:

$$
q_i \approx \frac{1}{|V|} \left(1 + \frac{z_{t,i} - \bar{z}_t}{T}\right)
$$

Subtracting $q_i$ from $p_i$ reveals that the probability difference itself shrinks inversely with temperature:

$$
p_i - q_i \approx \frac{1}{|V| T} \left( (z_{s,i} - \bar{z}_s) - (z_{t,i} - \bar{z}_t) \right)
$$

Now substitute this probability difference back into the chain-rule gradient with respect to student logit $z_{s,i}$:

$$
\frac{\partial \mathcal{L}_{\text{soft}}}{\partial z_{s,i}} = \frac{1}{T} (p_i - q_i) \approx \frac{1}{|V| T^2} \left( (z_{s,i} - \bar{z}_s) - (z_{t,i} - \bar{z}_t) \right)
$$

For fixed finite logits in this limit, the unscaled gradient is approximately proportional to $1/T^2$. The hard-loss gradient, evaluated at $T=1$, doesn't change with the soft branch's temperature. Moving from $T=1$ to $T=4$ isn't necessarily a sixteenfold decrease: the low-temperature distribution may be far from the approximation. The mixing weight and optimizer also determine how much the teacher influences training.

Multiplying the soft distillation loss by $T^2$ cancels this attenuation:

$$
\mathcal{L}_{\text{KD}} = T^2 \cdot D_{\mathrm{KL}}(q \parallel p)
$$

Differentiating the scaled distillation loss yields:

$$
\frac{\partial \mathcal{L}_{\text{KD}}}{\partial z_{s,i}} = T^2 \cdot \frac{1}{T} (p_i - q_i) = T(p_i - q_i) \approx \frac{1}{|V|} \left( (z_{s,i} - \bar{z}_s) - (z_{t,i} - \bar{z}_t) \right)
$$

For fixed finite logits, the scaled loss approaches $\frac{1}{2|V|}\|\tilde z_s-\tilde z_t\|^2$, where each $\tilde z$ is centered by its own mean. This matches centered logits in the high-temperature limit. At finite temperatures the gradient still changes, and a teacher-matching loss can be exactly zero when the student already matches its target.

Consider the gradient mechanics of both losses: hard-label cross-entropy has derivative $p_i - y_i$, so an incorrect class with positive student mass receives a gradient proportional to its error. What it lacks is the teacher's relative ranking across alternatives.

<!-- leetllm: test, deps=torch, output=show, output_title="Temperature gradient check" -->
```python title="temperature-gradient-check.py"
import torch
import torch.nn.functional as F

teacher = torch.tensor([4.0, 2.0, 1.0, 0.7], dtype=torch.float64)
base_student = torch.tensor([1.0, 0.4, 0.1, -0.2], dtype=torch.float64)
limit = ((base_student - base_student.mean()) - (teacher - teacher.mean())) / 4

for temperature in (1.0, 4.0, 40.0, 400.0):
    student = base_student.clone().requires_grad_()
    q_log = F.log_softmax(teacher / temperature, dim=0)
    p_log = F.log_softmax(student / temperature, dim=0)
    loss = F.kl_div(p_log, q_log, log_target=True, reduction="sum")
    raw_gradient, = torch.autograd.grad(loss, student)
    scaled_gradient = temperature**2 * raw_gradient
    exact_gradient = temperature * (p_log.exp() - q_log.exp())
    assert torch.allclose(scaled_gradient, exact_gradient, atol=1e-12)
    print(f"T={temperature:g}: raw_norm={raw_gradient.norm():.6f}; scaled_norm={scaled_gradient.norm():.6f}")
assert torch.allclose(scaled_gradient, limit, atol=0.001)

student = base_student.clone().requires_grad_()
F.cross_entropy(student.unsqueeze(0), torch.tensor([0])).backward()
assert bool((student.grad[1:] > 0).all())
print("hard-label alternatives have nonzero gradients=True")
print("scaled gradient approaches centered-logit limit=True")
```

<!-- leetllm: output:start -->
```text title="Temperature gradient check" output compact
T=1: raw_norm=0.434065; scaled_norm=0.434065
T=4: raw_norm=0.030553; scaled_norm=0.488844
T=40: raw_norm=0.000272; scaled_norm=0.435812
T=400: raw_norm=0.000003; scaled_norm=0.429383
hard-label alternatives have nonzero gradients=True
scaled gradient approaches centered-logit limit=True
```
<!-- leetllm: output:end -->

```checkpoint
Why use temperature $T > 1$ during logit distillation?
---
Higher temperature softens the teacher distribution, exposing near-miss classes instead of only the top answer. The student learns the teacher's ranking over alternatives rather than a hard label alone.
```

Two implementation details can turn a plausible loss into bad supervision. First, hard next-token labels are shifted: logits at position $t$ predict the label at $t+1$. Teacher and student logits compare at the **same** position and prefix, not one position apart. Second, direct logit KD assumes the same token-to-id output mapping. Equal vocabulary sizes aren't enough. Verify normalization, special tokens, chat formatting, and the actual input token sequence too. Different tokenizers can segment identical text differently, leaving no one-to-one token-position alignment. Response KD avoids that particular constraint by retokenizing text for the student.

> **⚠️ Common mistake:** Running logit distillation without verifying tokenizer alignment. Two models can share a vocabulary size and still disagree on token-id mappings. Compare the complete output mapping, not `vocab_size` alone, before training.

Use this standard-library loss to check both mechanics without a neural net. It shifts hard labels, uses their mask for both losses, and rejects reordered vocabularies or mismatched sequence lengths. An all-ignored example raises an error rather than silently reporting zero training loss.

<!-- leetllm: test, output=show -->
```python title="causal-kd-loss.py"
import math

VOCAB = ("7d", "3d", "30d", "never")


def softmax(logits: list[float], temperature: float) -> list[float]:
    return [math.exp(value) for value in log_softmax(logits, temperature)]


def log_softmax(logits: list[float], temperature: float) -> list[float]:
    if temperature <= 0:
        raise ValueError("Temperature must be positive.")
    if not logits:
        raise ValueError("Logits must be nonempty.")
    offset = max(logits)
    scaled = [(value - offset) / temperature for value in logits]
    normalizer = math.log(sum(math.exp(value) for value in scaled))
    return [value - normalizer for value in scaled]


def kl_divergence(teacher_probs: list[float], student_log_probs: list[float]) -> float:
    if len(teacher_probs) != len(student_log_probs):
        raise ValueError("Distribution lengths must match.")
    return sum(
        teacher_prob * (math.log(teacher_prob) - student_log_prob)
        for teacher_prob, student_log_prob in zip(teacher_probs, student_log_probs)
        if teacher_prob > 0  # The limiting contribution of zero mass is zero.
    )


def cross_entropy(logits: list[float], label: int) -> float:
    return -log_softmax(logits, 1.0)[label]


def distillation_loss(
    student_logits: list[list[float]],
    teacher_logits: list[list[float]],
    labels: list[int],
    student_vocabulary: tuple[str, ...],
    teacher_vocabulary: tuple[str, ...],
    temperature: float = 3.0,
    alpha: float = 0.5,
    ignore_index: int = -100,
) -> float:
    if not 0.0 <= alpha <= 1.0:
        raise ValueError("alpha must be in [0, 1].")
    if temperature <= 0:
        raise ValueError("Temperature must be positive.")
    if student_vocabulary != teacher_vocabulary:
        raise ValueError(
            "Logit KD requires identical token-to-id mappings. "
            "Use response KD or design an explicit mapping when output spaces differ."
        )
    width = len(student_vocabulary)
    if width == 0 or len(set(student_vocabulary)) != width:
        raise ValueError("Vocabulary must contain distinct tokens.")
    if not len(student_logits) == len(teacher_logits) == len(labels) or len(labels) < 2:
        raise ValueError("Matching sequences with at least two positions are required.")
    if any(type(label) is not int or (label != ignore_index and not 0 <= label < width) for label in labels):
        raise ValueError("Labels must be token IDs or ignore_index.")
    if any(len(row) != width for row in student_logits + teacher_logits):
        raise ValueError("Logit rows and vocabulary dimensions must agree.")

    # Causal LMs predict token t+1 from positions up to t.
    shift_student = student_logits[:-1]
    shift_teacher = teacher_logits[:-1]
    shift_labels = labels[1:]

    soft_terms: list[float] = []
    hard_terms: list[float] = []
    for student_row, teacher_row, label in zip(shift_student, shift_teacher, shift_labels):
        if label == ignore_index:
            continue
        teacher_probs = softmax(teacher_row, temperature)
        student_log_probs = log_softmax(student_row, temperature)
        soft_terms.append(kl_divergence(teacher_probs, student_log_probs) * temperature**2)
        hard_terms.append(cross_entropy(student_row, label))

    if not soft_terms:
        raise ValueError("No supervised next-token positions remain.")
    soft_loss = sum(soft_terms) / len(soft_terms)
    hard_loss = sum(hard_terms) / len(hard_terms)
    return alpha * soft_loss + (1 - alpha) * hard_loss


student_logits = [
    [0.20, 0.10, 0.00, -0.10],
    [1.50, 0.40, 0.10, -0.20],
    [0.30, 2.00, 0.20, 0.00],
    [0.10, 0.20, 0.30, 0.40],
]
teacher_logits = [
    [2.00, 0.50, 0.10, 0.00],
    [3.00, 1.00, 0.20, 0.10],
    [0.20, 2.50, 0.40, 0.10],
    [0.00, 0.10, 0.20, 1.50],
]
labels = [0, 0, 1, -100]

loss = distillation_loss(
    student_logits,
    teacher_logits,
    labels,
    VOCAB,
    VOCAB,
    temperature=3.0,
    alpha=0.6,
)
mismatch_failed = False
try:
    distillation_loss(
        student_logits,
        teacher_logits,
        labels,
        VOCAB,
        tuple(reversed(VOCAB)),
    )
except ValueError as exc:
    mismatch_failed = "token-to-id mappings" in str(exc)

print("loss:", round(loss, 4))
print("loss_valid:", loss > 0)
print("mismatch failed:", mismatch_failed)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
loss: 0.72
loss_valid: True
mismatch failed: True
```
<!-- leetllm: output:end -->

The worked loss uses token distributions on aligned prefixes. Many teachers expose text only. What supervision is left, and which teacher mistakes become training targets?

## When you only have text: response distillation

Without weights or logits, **response distillation** (also called sequence-level distillation or black-box KD) becomes the primary transfer channel: the teacher generates full answers or reasoning traces, and the student fine-tunes on curated `(prompt, response)` pairs.

This is Supervised Fine-Tuning (SFT) on teacher-generated targets. Direct token matching needs aligned output meanings and positions, or an explicitly designed cross-tokenizer method. It doesn't inherently require a terabyte cache or materializing every logit at once: online scoring and chunked losses can reduce storage and activation memory. Text targets offer different practical options:

1.  **Tokenizer independence:** Teacher and student can use completely different tokenizers, subword merges, and vocabulary sizes. The student tokenizes the teacher's raw text using its own tokenizer.
2.  **Decoupled compute:** Generate responses offline, then train without keeping the teacher resident. Student hardware requirements still depend on its size, precision, optimizer, and sequence length. Response generation can also be refreshed during training.
3.  **Intermediate explanation supervision:** Written rationales supply additional target tokens to learn. Logit distillation can also operate on rationale prefixes; neither channel establishes that a written rationale reveals the teacher's internal reasoning.

Ordinary response SFT presents selected tokens rather than the full teacher distribution. Multiple samples, weights, or preference filtering can supply other information, but teacher probabilities aren't automatically calibrated truth estimates. If a wrong policy exception becomes an unfiltered target, cross-entropy encourages the student to reproduce it. Use checks where available and reviewed quality criteria where exact verification isn't possible.

| Student / recipe | Teacher | Signal transferred | Why it matters |
|---------|---------|--------|--------|
| **Alpaca 7B**[^taori2023] | `text-davinci-003` | 52K generated instruction-response examples | Adapted the earlier Self-Instruct pipeline; dataset and weight differences have non-commercial research restrictions. |
| **Orca 13B**[^mukherjee2023] | GPT-4 + ChatGPT | Explanation traces and task instructions | Studied progressive explanation-trace training. Its comparisons don't isolate rationale quality from every data-volume or teacher change. |
| **phi-1.5**[^li2023c] | Synthetic textbook-like generation plus filtered code | A mixed pretraining corpus | Trained from random initialization, not response SFT. Illustrates synthetic-data overlap with teacher-derived training signals. |
| **Distilling Step-by-Step**[^hsieh2023] | Generated rationales plus labels | Rationales as an extra supervised target | Trains smaller students with multi-task supervision on both final predictions and generated explanatory rationales. |
| **DeepSeek-R1-Distill**[^deepseekR1Original2025] | DeepSeek-R1-curated data | About 800K selected <span data-glossary="supervised-fine-tuning">SFT</span> examples | Fine-tunes Qwen/Llama checkpoints (1.5B to 70B) with response SFT, including reasoning and general data. |

The original January 2025 R1 report gives DeepSeek-R1-Distill-Qwen-32B an AIME 2024 pass@1 of 72.6% and MATH-500 accuracy of 94.3%.[^deepseekR1Original2025] Its response-SFT mixture includes about 600k reasoning samples and 200k general samples; some selection used model judgments rather than programmatic proof. Evaluation used temperature 0.6, top-p 0.95, and a 32,768-token generation limit. These are reported historical results at a stated budget, not present-day model rankings or proof that every explanation is valid. Sampled-correctness averages estimate pass@1; the separately reported majority-vote `cons@64` aggregates answers.

Response distillation and synthetic-data generation overlap when a stronger model generates the training targets. Calling the recipe "distillation" doesn't remove the need for strict evaluation. Teacher generations can be factually wrong, stylistically repetitive, contaminated by benchmark answers, or out of scope for the student's parameter budget.

The code below demonstrates validation filtering on generated teacher demonstrations, verifying outputs against policy checks before training the student:

<!-- leetllm: test, output=show -->
```python title="teacher-output-gate.py"
generated = [
    {"prompt": "disabled prod key restore", "teacher": "7 days", "verified": "7 days"},
    {"prompt": "expired admin restore", "teacher": "7 days", "verified": "not allowed"},
    {"prompt": "rotate staging key window", "teacher": "not restorable", "verified": "not restorable"},
]

accepted = [
    example for example in generated
    if example["teacher"] == example["verified"]
]
rejected = [
    example["prompt"] for example in generated
    if example["teacher"] != example["verified"]
]

print("generated:", len(generated))
print("accepted:", len(accepted))
print("rejected prompts:", rejected)
print("teacher text is trusted label:", len(rejected) == 0)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
generated: 3
accepted: 2
rejected prompts: ['expired admin restore']
teacher text is trusted label: False
```
<!-- leetllm: output:end -->

Text and logits supervise the output. With white-box access you can also ask hidden states to match, which introduces a projection problem that output losses don't have.

## Aligning internal layers: feature distillation

Logit distillation matches output distributions. White-box access also lets a training objective match selected student hidden states to selected teacher hidden states through a learned projection.

$$
\mathcal{L}_{\text{feature}} = \sum_l \|f_{m(l)}^{\text{teacher}} - g_l(f_l^{\text{student}})\|^2
$$

$m(l)$ selects the teacher layer paired with student layer $l$; their depths do not have to match. The learned projection $g_l$ maps the student's hidden width to the teacher's. Compare aligned token positions, mask padding, and choose whether to average over tokens, features, and layers. That reduction sets the loss scale. Train the projection with the student while keeping teacher features detached.

```checkpoint
Why does feature distillation need the projection $g(\cdot)$?
---
The student and teacher may have different hidden sizes. The projection maps student features into the teacher's feature space so the layer representations can be compared.
```

Feature matching adds three decisions before it adds value: which layers correspond, how to train the projection, and whether its extra compute improves held-out outcomes. Hidden-state access provides additional supervision signals. Measure whether projection cost improves held-out outcomes.

| Method | Teacher signal | Main advantage | Main constraint |
|--------|----------------|----------------|-----------------|
| **Response KD** | Selected text outputs | Works without white-box access | Teacher errors become SFT targets unless filtered |
| **Logit KD** | Token probabilities | Preserves distribution information | Requires aligned output space or an explicit mapping |
| **Feature KD** | Selected hidden states | Exposes intermediate representations | Needs layer/projection design and more storage or compute |
| **On-policy collection** | Teacher scores on student-generated prefixes | Visits prefixes the student produces | A sampling choice that can be combined with different losses |

So far KL was written as $D_{\mathrm{KL}}(q \| p)$, with the teacher on the left. For generation, that direction is a choice, not a law.

## Forward versus reverse KL

When minimizing KL divergence for autoregressive language models, direction matters. The two directions create starkly different supervision incentives:

$$
D_{\mathrm{KL}}(P_{\text{teacher}} \parallel P_{\text{student}}) = \sum_{x \in \mathcal{X}} P_{\text{teacher}}(x) \log \frac{P_{\text{teacher}}(x)}{P_{\text{student}}(x)}
$$

$$
D_{\mathrm{KL}}(P_{\text{student}} \parallel P_{\text{teacher}}) = \sum_{x \in \mathcal{X}} P_{\text{student}}(x) \log \frac{P_{\text{student}}(x)}{P_{\text{teacher}}(x)}
$$

Both directions have zero divergence when the student matches the teacher. A constrained model family may be unable to represent that distribution, so the objectives can choose different compromises. Distribution fit depends on the model family and optimization, not parameter count alone. The following tendencies depend on those choices:

1. **Forward KL emphasizes teacher-supported outcomes:** A fixed positive teacher mass incurs an unbounded penalty as its student mass approaches zero. Under a restricted family, fitting several separated teacher modes can put student mass between them. This motivates the name *mode-covering*. Evaluate factuality and answer validity separately on language-model outputs.
2. **Reverse KL emphasizes student-generated outcomes:** A fixed positive student mass incurs an unbounded penalty as the corresponding teacher mass approaches zero. A zero student mass contributes zero at that outcome, but reallocating the mass changes other terms. If the teacher gives $A$ and $B$ each 0.5 and the student selects only $A$, total reverse KL is $\log 2$, not zero. A constrained optimum may concentrate on fewer teacher modes, motivating *mode-seeking*. High teacher probability doesn't certify truth, calibration, or safety.

| Direction | Formula | Boundary with fixed positive numerator mass | Tendency under constrained fitting | Evaluation still needed |
|---|---|---|---|---|
| **Forward KL** | $D_{\mathrm{KL}}(P_{\text{teacher}} \parallel P_{\text{student}})$ | Unbounded as $P_s \to 0$ with fixed $P_t>0$ | Can favor coverage of teacher modes | Quality and unintended mass between modes |
| **Reverse KL** | $D_{\mathrm{KL}}(P_{\text{student}} \parallel P_{\text{teacher}})$ | Unbounded as $P_t \to 0$ with fixed $P_s>0$ | Can favor fewer teacher modes | Quality, lost diversity, and teacher errors |

MiniLLM studies sequence-level reverse KL using policy gradients.[^gu2024] Its token reward is a teacher/student **log-probability ratio**, with future-token credit, not teacher likelihood alone. It also uses single-step decomposition, teacher-mixed sampling, and length normalization. In the paper's ablations, removing stabilizing components lowered reverse KL while producing repeated or meaningless outputs. Evaluate generated text alongside divergence.

Generalized Knowledge Distillation (GKD) separates the data-sampling rule from the divergence.[^agarwal2024] Its results are task-dependent: generalized Jensen-Shannon choices outperform both KL directions in its smaller-student translation experiments, while its headline on-policy GSM8K comparison uses forward KL. This directly contradicts a universal reverse-KL ranking. Measure the loss, sampling rule, model family, and decoding setup together.

The equations above can describe a distribution over complete sequences or a next-token distribution at one fixed prefix. A full autoregressive sequence KL decomposes into token KLs averaged over prefixes sampled from the distribution on the **left**. Teacher-prefix forward KL and student-prefix reverse KL therefore visit different states. Token KL on a fixed corpus isn't automatically the exact complete-sequence divergence.

Make that weighting visible with two-token sequences over `A` and `B`. The teacher starts with probabilities `[0.8, 0.2]`; the student starts with `[0.5, 0.5]`. Their next-token distributions also depend on that first token. In forward KL, prefix `A` receives 80% weighting rather than 50%. Enumerating all four sequences yields the same result as this teacher-weighted decomposition.

<!-- leetllm: test, output=show, output_title="Sequence KL decomposition" -->
```python title="sequence-kl-decomposition.py"
import math

teacher_first, student_first = [0.8, 0.2], [0.5, 0.5]
teacher_next = [[0.9, 0.1], [0.2, 0.8]]
student_next = [[0.5, 0.5], [0.4, 0.6]]

def kl(left, right):
    return sum(a * math.log(a / b) for a, b in zip(left, right))

teacher_joint = [teacher_first[i] * teacher_next[i][j] for i in range(2) for j in range(2)]
student_joint = [student_first[i] * student_next[i][j] for i in range(2) for j in range(2)]
forward = kl(teacher_joint, student_joint)
forward_parts = kl(teacher_first, student_first) + sum(
    teacher_first[i] * kl(teacher_next[i], student_next[i]) for i in range(2)
)
reverse = kl(student_joint, teacher_joint)
reverse_parts = kl(student_first, teacher_first) + sum(
    student_first[i] * kl(student_next[i], teacher_next[i]) for i in range(2)
)
uniform_prefix_forward = kl(teacher_first, student_first) + sum(
    kl(teacher_next[i], student_next[i]) for i in range(2)
) / 2
assert math.isclose(forward, forward_parts) and math.isclose(reverse, reverse_parts)
assert not math.isclose(forward, uniform_prefix_forward)
print(f"forward joint={forward:.6f}; teacher-weighted tokens={forward_parts:.6f}")
print(f"reverse joint={reverse:.6f}; student-weighted tokens={reverse_parts:.6f}")
print(f"uniform-prefix forward={uniform_prefix_forward:.6f}; differs=True")
```

<!-- leetllm: output:start -->
```text title="Sequence KL decomposition" output compact
forward joint=0.505499; teacher-weighted tokens=0.505499
reverse joint=0.530881; student-weighted tokens=0.530881
uniform-prefix forward=0.422535; differs=True
```
<!-- leetllm: output:end -->

These are sums over exactly two generated tokens, with no variable-length or stop-token issue. Averaging over positions would divide them by two. A corpus that weights `A` and `B` equally optimizes another useful possible objective, but its token loss isn't this sequence forward KL. Changing the collection distribution changes which conditional mismatches matter, even with the same teacher, student, and token-level divergence.

In a three-token distribution where the teacher assigns `7d` (0.58) over `3d` (0.40) and gives `never` 0.02. Compare students assigning 0.10 and 0.25 to `never`. The latter puts more mass in a teacher-low-probability region, and reverse KL rises more in this example. This isn't an out-of-support event: all three teacher probabilities are positive.

<figure>
  <img src="illustrations/_generated/kl_direction_dark.png" alt="Two scenarios compare teacher probabilities 0.58, 0.40, 0.02 against student distributions 0.54, 0.36, 0.10 and 0.40, 0.35, 0.25 for 7d, 3d, and never. All six tracks share a probability axis from zero to 0.60. The extra student mass on never is 0.08 and 0.23. Their forward and reverse KL results are 0.051 and 0.084, then 0.218 and 0.436. These full-support divergence values quantify distribution mismatch; factual correctness requires separate checks." />
  <figcaption>The aligned tracks show the distributions before the divergence scores. The teacher and both students have full support. KL measures distribution mismatch, while factual correctness requires separate evaluation.</figcaption>
</figure>

No divergence wins every task. Measure task quality, diversity, <span data-glossary="calibration">calibration</span>, and failure rates under the decoding setup you will ship.

<!-- leetllm: test, output=show -->
```python title="kl-direction-diagnostic.py"
import math

teacher = {"7d": 0.58, "3d": 0.40, "never": 0.02}
students = {
    "covers_teacher": {"7d": 0.54, "3d": 0.36, "never": 0.10},
    "dumps_on_never": {"7d": 0.40, "3d": 0.35, "never": 0.25},
}

def kl(left: dict[str, float], right: dict[str, float]) -> float:
    if left.keys() != right.keys():
        raise ValueError("Both distributions must use the same outcomes.")
    for distribution in (left, right):
        if any(p < 0 for p in distribution.values()) or not math.isclose(sum(distribution.values()), 1.0):
            raise ValueError("Probabilities must be nonnegative and sum to one.")
    terms = []
    for token, probability in left.items():
        if probability == 0:
            continue
        if right[token] == 0:
            return math.inf
        terms.append(probability * (math.log(probability) - math.log(right[token])))
    return sum(terms)

for name, student in students.items():
    forward = kl(teacher, student)
    reverse = kl(student, teacher)
    print(name, "forward:", round(forward, 3), "reverse:", round(reverse, 3))

print("choose objective from evaluation, not slogan")

two_modes = {"A": 0.5, "B": 0.5}
one_mode = {"A": 1.0, "B": 0.0}
forward = kl(two_modes, one_mode)
reverse = kl(one_mode, two_modes)
assert math.isinf(forward) and math.isclose(reverse, math.log(2))
print(f"drop one mode: forward={forward}; reverse={reverse:.3f}")
# Matching a confidently wrong teacher still gives zero KL.
wrong_teacher = {"correct": 0.01, "wrong": 0.99}
assert kl(wrong_teacher, wrong_teacher) == 0.0
print("matched wrong teacher: KL=0.000; identical to target")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
covers_teacher forward: 0.051 reverse: 0.084
dumps_on_never forward: 0.218 reverse: 0.436
choose objective from evaluation, not slogan
drop one mode: forward=inf; reverse=0.693
matched wrong teacher: KL=0.000; identical to target
```
<!-- leetllm: output:end -->

KL direction decides *how* the student fits a distribution on a given prefix. It can't help with prefixes the distillation set never contains.

## Off-policy versus on-policy distillation

Off-policy distillation trains the student on a fixed set of prefixes from teacher generations. At inference time the student samples its own tokens, introducing covariate shift: once an early token differs from the training distribution, later prefixes drift outside the support of the training data, and errors compound through exposure bias.

<span data-glossary="on-policy-distillation">On-policy distillation (OPD)</span> methods such as Generalized Knowledge Distillation (GKD) sample sequences from the student, then compare student and teacher token distributions on the prefixes the student produced. GKD can mix fixed outputs and student-generated outputs through a student-data fraction $\lambda$; it doesn't require a natural-language critique.[^agarwal2024] The cost is computational: both student sampling and teacher scoring run during training. This is useful when fixed teacher data misses prefixes that the deployed student commonly enters, but the benefit has to be measured per task.

Gemma 2's post-training recipe includes predominantly synthetic teacher responses and distillation on the student's distribution.[^gemma2team2024] Keep the sampling rule separate from the divergence: reversing KL on a fixed dataset doesn't make training on-policy. GKD treats sampled sequences as fixed data for its update; it doesn't backpropagate through discrete sampling. MiniLLM uses a different sequence-level optimization procedure, so swapping the arguments to a token-level KL function isn't a complete MiniLLM implementation.[^agarwal2024][^gu2024]

The set comparison below isolates prefix coverage between policies answering the same prompt:

<!-- leetllm: test, output=show -->
```python title="on-policy-prefix-coverage.py"
prompt = "How long is this disabled key restorable? Answer: "
fixed_teacher_prefixes = {prompt + "7", prompt + "7 days"}
student_generated_prefixes = {
    prompt + "7",
    prompt + "30",
    prompt + "30 days",
}

unseen_in_fixed_data = student_generated_prefixes - fixed_teacher_prefixes
teacher_scored_prefixes = fixed_teacher_prefixes | student_generated_prefixes

print("fixed prefixes:", len(fixed_teacher_prefixes))
print("student prefixes needing new teacher scores:", sorted(unseen_in_fixed_data))
print("scored after on-policy collection:", len(teacher_scored_prefixes))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fixed prefixes: 2
student prefixes needing new teacher scores: ['How long is this disabled key restorable? Answer: 30', 'How long is this disabled key restorable? Answer: 30 days']
scored after on-policy collection: 4
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/prefix_coverage_trace_dark.png" alt="Token prefix matching between teacher demonstrations and student generations. Two reference teacher prefixes and three student rollouts share common initial tokens while branching at later positions. Distinct token paths expand teacher evaluation coverage across four unique candidate prefixes." />
  <figcaption>Answer suffixes branching from a shared prompt prefix. Comparing two teacher prefixes with three student rollouts yields four unique candidate prefixes required for comprehensive teacher supervision.</figcaption>
</figure>

The losses and sampling rules matter only if a training step updates the student and not the teacher. Which tensors are allowed to move, and which positions are even allowed to contribute to the loss?

### Current trainer choices

Checked October 10, 2026: TRL documents `DistillationTrainer` for student-generated completions and a chunked full-vocabulary generalized Jensen-Shannon loss.[^huggingface2026distillationTrainer] Chunking reduces the peak logit tensor; it doesn't remove teacher scoring or all memory costs. Its agent recipe masks tool-result tokens. The older GKD guide now uses `trl.experimental.gkd`, with `lmbda` controlling student-data collection and `beta` controlling the divergence.[^huggingface2026gkdGuide] Those are separate choices, and that `beta` isn't the earlier teacher/task mixing weight $\alpha$. Pin the library version and consult its matching guide before adopting either API. These guides were read; neither trainer was run here.

The current `DistillationTrainer` also constrains adapter placement. Its loss reads `lm_head.weight` directly and invokes the student backbone, so it rejects LoRA adapters on `lm_head` and prompt-learning methods that this path would bypass. To train the output head, its guide specifies `modules_to_save=["lm_head"]` instead.[^huggingface2026distillationTrainer] A configuration accepted by ordinary SFT isn't automatically a valid configuration for this distillation implementation.

## A practical distillation training loop

A typical loop freezes the teacher, sends the same input through both models, and updates only the student. This CPU example uses small positionwise <span data-glossary="pytorch">PyTorch</span> networks, not full Transformers. Both start randomly initialized, including the teacher: lowering this loss verifies optimization mechanics, not transferred language ability. The networks see only the current token, not the preceding context.

For this **response-only** recipe, prompt tokens provide context and aren't supervised targets. A pretraining or full-sequence distillation recipe may intentionally supervise them. Padding isn't a target. PyTorch cross-entropy accepts class-ID `ignore_index=-100`; `F.kl_div` has no corresponding mask argument. Select valid next-token positions explicitly for both branches using `valid = (shifted_labels != -100)`.[^pytorchCrossEntropy2026][^pytorchKlDiv2026] For agent trajectories, tool-result text can be context while only student-generated tokens are supervised.

Flattening valid tensors to `[valid_tokens, vocabulary]` makes `batchmean` a mean per target token. It divides by the leading dimension, not every non-vocabulary dimension.[^pytorchKlDiv2026] On `[batch, sequence, vocabulary]`, it instead returns the summed token KL per sequence, even if ignored terms are zeroed. Relative to a token mean, that multiplies the loss by `valid_tokens / batch_size`; padding and response lengths can change the factor. Choose the intended reduction explicitly. Real causal models also need attention masks for padding; a loss mask doesn't change attention context.

<!-- leetllm: test, deps=torch, output=show -->
```python title="tiny-kd-training-step.py"
import math
import torch
from torch import nn
import torch.nn.functional as F

class TinyLM(nn.Module):
    def __init__(self, vocab_size: int, hidden_size: int):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, hidden_size)
        self.output = nn.Linear(hidden_size, vocab_size)

    def forward(self, input_ids: torch.Tensor) -> torch.Tensor:
        return self.output(self.embedding(input_ids))

def kd_loss(student_logits: torch.Tensor, teacher_logits: torch.Tensor, labels: torch.Tensor,
            temperature: float = 3.0, alpha: float = 0.7) -> torch.Tensor:
    if temperature <= 0 or not 0.0 <= alpha <= 1.0:
        raise ValueError("Need positive temperature and alpha in [0, 1].")
    if student_logits.ndim != 3 or student_logits.shape != teacher_logits.shape:
        raise ValueError("Student and teacher need matching [batch, sequence, vocabulary] shapes.")
    if labels.shape != student_logits.shape[:2] or labels.dtype != torch.long:
        raise ValueError("Labels must be int64 [batch, sequence].")
    if student_logits.size(-1) == 0:
        raise ValueError("Vocabulary cannot be empty.")
    shifted_labels = labels[:, 1:]
    valid = shifted_labels != -100
    if not bool(valid.any()):
        raise ValueError("No supervised next-token positions remain; skip this batch.")
    labels_flat = shifted_labels[valid]
    if bool(((labels_flat < 0) | (labels_flat >= student_logits.size(-1))).any()):
        raise ValueError("Supervised labels must be valid token IDs.")
    student_flat = student_logits[:, :-1, :][valid]
    teacher_flat = teacher_logits[:, :-1, :].detach()[valid]
    if student_flat.dtype in (torch.float16, torch.bfloat16):
        student_flat = student_flat.float()
    teacher_flat = teacher_flat.to(student_flat.dtype)
    if not bool(torch.isfinite(student_flat).all() and torch.isfinite(teacher_flat).all()):
        raise ValueError("Supervised logits must be finite.")
    teacher_log_probs = F.log_softmax(teacher_flat / temperature, dim=-1)
    student_log_probs = F.log_softmax(student_flat / temperature, dim=-1)
    soft_loss = F.kl_div(student_log_probs, teacher_log_probs,
                         log_target=True, reduction="batchmean") * temperature**2
    hard_loss = F.cross_entropy(student_flat, labels_flat)
    return alpha * soft_loss + (1 - alpha) * hard_loss

torch.manual_seed(0)
torch.set_num_threads(1)
vocab_size = 12
teacher = TinyLM(vocab_size=vocab_size, hidden_size=16)
student = TinyLM(vocab_size=vocab_size, hidden_size=6)
teacher.requires_grad_(False)
teacher.eval()

input_ids = torch.tensor([
    [1, 2, 3, 4, 5],
    [1, 3, 5, 7, 9],
])
labels = input_ids.clone()
labels[:, :2] = -100  # Prompt tokens aren't supervised targets.
labels[1, -1] = -100  # Mask final padded position.
optimizer = torch.optim.AdamW(student.parameters(), lr=0.05)

with torch.no_grad():
    teacher_logits = teacher(input_ids)
teacher_before = {name: value.clone() for name, value in teacher.state_dict().items()}
student_before = {name: value.clone() for name, value in student.state_dict().items()}
student.train()

student_before_logits = student(input_ids)
before = kd_loss(student_before_logits, teacher_logits, labels)
optimizer.zero_grad()
before.backward()
has_grad = any(parameter.grad is not None for parameter in student.parameters())
optimizer.step()

after = kd_loss(student(input_ids), teacher_logits, labels)

assert all(torch.equal(value, teacher_before[name]) for name, value in teacher.state_dict().items())
assert all(parameter.grad is None for parameter in teacher.parameters())
assert any(not torch.equal(value, student_before[name]) for name, value in student.state_dict().items())
print("before:", round(float(before.detach()), 4))
print("after:", round(float(after.detach()), 4))
print("has_grad:", has_grad)
print("after_is_finite:", bool(torch.isfinite(after)))
print("improved:", bool(after < before))
print("teacher unchanged:", True)

# Ignored target positions cannot change this response-only loss.
valid = labels[:, 1:] != -100
ignored = ~valid
changed_teacher = teacher_logits.clone()
changed_teacher[:, :-1, :][ignored] = 1000.0
assert torch.allclose(before.detach(), kd_loss(student_before_logits, changed_teacher, labels))
soft_mean = kd_loss(student_before_logits, teacher_logits, labels, alpha=1.0)
terms = F.kl_div(
    F.log_softmax(student_before_logits[:, :-1, :] / 3, dim=-1),
    F.log_softmax(teacher_logits[:, :-1, :] / 3, dim=-1),
    log_target=True, reduction="none",
).sum(-1) * 9
sequence_mean = terms.masked_fill(ignored, 0).sum() / labels.size(0)
factor = valid.sum().item() / labels.size(0)
assert torch.allclose(sequence_mean, soft_mean * factor)
try:
    kd_loss(student_before_logits, teacher_logits, torch.full_like(labels, -100))
except ValueError as error:
    assert "No supervised" in str(error)
else:
    raise AssertionError("An all-ignored batch must not become a silent optimizer step")
print("ignored-target perturbation leaves loss unchanged=True")
print(f"sequence batchmean / valid-token mean={factor:.1f}")
print("all-ignored batch rejected=True")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
before: 1.1329
after: 0.952
has_grad: True
after_is_finite: True
improved: True
teacher unchanged: True
ignored-target perturbation leaves loss unchanged=True
sequence batchmean / valid-token mean=2.5
all-ignored batch rejected=True
```
<!-- leetllm: output:end -->

A deployed pipeline usually puts this pattern inside a framework trainer, with aligned-vocabulary models such as a larger Gemma teacher and smaller Gemma student when you need direct token-probability distillation. Teams may pre-compute some teacher signal offline to avoid running the teacher inside every student update. Dense next-token logits across a long corpus are costly to store, so a design may consider <span data-glossary="top-k">top-k</span> logits, teacher responses, or online scoring, then measure the quality effect of compression. The payload-only estimate below ignores metadata and storage-format overhead, so treat it as a lower-bound sizing exercise.

The masked example weights each valid token equally, so longer responses contribute more terms. Per-sequence averaging is a different objective. For distributed training or gradient accumulation, a global token-mean objective needs the global valid-token count, accounting for any gradient averaging. An unweighted mean of unequal microbatch means changes the objective. If a batch has no targets, skip the optimizer step too: AdamW weight decay can change weights with a zero-valued gradient tensor. Parameters with `grad=None` are skipped by PyTorch AdamW.[^pytorchAdamW2026]

<!-- leetllm: test, output=show -->
```python title="logit-cache-budget.py"
import math

tokens = 50_000_000
vocab_size = 32_000
bytes_per_logit = 2  # bf16
top_k = 64
bytes_per_topk_item = 2 + 4  # bf16 value plus int32 token id

dense_bytes = tokens * vocab_size * bytes_per_logit
topk_bytes = tokens * top_k * bytes_per_topk_item
gib = 1024 ** 3

print("dense cache GiB:", round(dense_bytes / gib, 1))
print("top-k cache GiB:", round(topk_bytes / gib, 1))
print("storage reduction:", round(dense_bytes / topk_bytes, 1), "x")
print("quality must still be evaluated:", True)

# Renormalizing a stored subset hides its total probability mass.
teacher, student = [0.60, 0.30, 0.10], [0.30, 0.15, 0.55]
def forward_kl(q, p):
    return sum(qi * math.log(qi / pi) for qi, pi in zip(q, p))
q_top = [value / sum(teacher[:2]) for value in teacher[:2]]
p_top = [value / sum(student[:2]) for value in student[:2]]
full, truncated = forward_kl(teacher, student), forward_kl(q_top, p_top)
assert full > 0.45 and math.isclose(truncated, 0.0, abs_tol=1e-12)
print(f"full forward KL={full:.3f}; renormalized top-2 KL={truncated:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dense cache GiB: 2980.2
top-k cache GiB: 17.9
storage reduction: 166.7 x
quality must still be evaluated: True
full forward KL=0.453; renormalized top-2 KL=0.000
```
<!-- leetllm: output:end -->

If an online-distillation pilot is feasible, compare it with an offline baseline before committing to large-scale data generation. That comparison can show whether fresh teacher scoring earns enough held-out quality to justify its compute cost for this task.

The printed zero truncated KL is deceptive: both renormalized top-two distributions match, even though the full teacher and student differ sharply in the omitted tail. Document the loss and normalization convention, including what happens to omitted tail mass. Temperature changes how much probability sits there too.

The training step assumes a legal, filtered corpus. For response KD, corpus design is the main lever you control, alongside student capacity and the evaluation split.

## Building a distillation dataset

For response distillation, data coverage, student capacity, and training budget constrain results. None supplies a universal accuracy ceiling. Build a generation and selection pipeline that can reject incorrect, duplicate, contaminated, or irrelevant examples before they become targets.

### Seed-Expand-Filter pipeline

A **Seed-Expand-Filter** pipeline gives teacher-data generation a sequence of decisions. Give each filter a measurable behavior specification and assess output quality on a separate evaluation split.

1.  **Seed:** Start with a small set of high-quality, human-written prompts (for example, 100 restore-window and key-rotation questions).
2.  **Expand:** Ask the teacher to generate new, diverse variations of those prompts.
3.  **Generate:** Have the teacher answer the new prompts, often with rationales or decomposed steps when richer supervision helps.
4.  **Filter:** Use checks, deduplication, safety screening, or reviewed scoring rules to reject unsuitable generations.

Evaluate candidate prompt-response pairs through the validation filters:

| Prompt | Teacher text | Gate | Decision |
|--------|--------------|------|----------|
| `disabled prod key restore` | `7 days` | matches the trusted answer | keep |
| `  Disabled prod key  restore  ` | (not generated) | same normalized prompt | skip as duplicate |
| `expired admin restore` | `7 days` | trusted answer is `not allowed` | reject |

This follows the broad shape of Alpaca's Self-Instruct-style pipeline and Orca's richer explanation-trace generation, while real systems add deduplication, safety filters, and task balancing.[^taori2023][^mukherjee2023]

Two checks are easy to skip and expensive to recover from: deduplicate prompts before paying for generation, and verify teacher answers before they become student targets. This wrapper uses a constant fake teacher and a lookup verifier, not an API or a model judge. Lowercasing is used here for deterministic text normalization; preserve casing when tokenizing case-sensitive code or identifiers in production.

<!-- leetllm: test, output=show -->
```python title="select-teacher-responses.py"
from collections.abc import Callable

class DistillationDataGenerator:
    def __init__(
        self,
        teacher_generate: Callable[[str], str],
        verify_response: Callable[[str, str], bool],
    ):
        self.teacher_generate = teacher_generate
        self.verify_response = verify_response

    def generate_dataset(self, prompts: list[str]) -> list[dict[str, str]]:
        selected: list[dict[str, str]] = []
        seen: set[str] = set()
        for prompt in prompts:
            normalized = " ".join(prompt.lower().split())
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            response = self.teacher_generate(normalized).strip()
            if self.verify_response(normalized, response):
                selected.append({"prompt": normalized, "response": response})
        return selected

def fake_teacher(prompt: str) -> str:
    return "7 days"

trusted_answers = {
    "disabled prod key restore": "7 days",
    "expired admin restore": "not allowed",
}

def verify_response(prompt: str, response: str) -> bool:
    return trusted_answers.get(prompt) == response  # Unknown prompts aren't approved.

generator = DistillationDataGenerator(fake_teacher, verify_response)
examples = generator.generate_dataset([
    "disabled prod key restore",
    "  Disabled prod key  restore  ",
    "expired admin restore",
    "unknown policy",
    "   ",
])

print("selected prompts:", [example["prompt"] for example in examples])
print("selected count:", len(examples))
print("bad response retained:", any("expired admin" in example["prompt"] for example in examples))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
selected prompts: ['disabled prod key restore']
selected count: 1
bad response retained: False
```
<!-- leetllm: output:end -->

### Keep training data out of evaluation

Teacher generation can quietly contaminate a benchmark when prompts, reference solutions, or close rewrites enter the student training set. Block exact normalized overlap before training. For real releases, extend the gate with near-duplicate and reference-solution checks.

Split source documents, tasks, or seed families before generating variants, and keep all descendants in the same split. Otherwise a rewritten sibling can enter evaluation even if exact strings don't overlap. Keep final test labels out of generation, filtering, and hyperparameter selection. The next check catches only exact normalized overlap; passing it doesn't certify independence.

<!-- leetllm: test, output=show -->
```python title="held-out-contamination-gate.py"
def normalize(prompt: str) -> str:
    return " ".join(prompt.lower().replace("?", "").split())

candidate_training_prompts = [
    "Compute retry budget for a failed restore",
    "Summarize failed restore logs",
    "How many days can a disabled production API key stay restorable?",
]
held_out_prompts = [
    "how many days can a disabled production API key stay restorable",
    "Estimate GPU queue delay for a remote region",
]

held_out_keys = {normalize(prompt) for prompt in held_out_prompts}
accepted = [
    prompt for prompt in candidate_training_prompts
    if normalize(prompt) not in held_out_keys
]
blocked = [
    prompt for prompt in candidate_training_prompts
    if normalize(prompt) in held_out_keys
]

print("accepted training prompts:", len(accepted))
print("blocked overlap:", blocked)
print("held-out exact overlap after gate:", any(normalize(p) in held_out_keys for p in accepted))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
accepted training prompts: 2
blocked overlap: ['How many days can a disabled production API key stay restorable?']
held-out exact overlap after gate: False
```
<!-- leetllm: output:end -->

A clean corpus still can't make a small model remember behavior beyond its capacity or context window, and it can't settle license constraints.

## When distillation fits the task

Distillation doesn't erase <span data-glossary="context-window">context-window</span> or data-coverage limits. A student may beat its teacher on a narrow checked metric after filtering or task-specific training, while regressing on other behavior. Treat teacher and student as separate artifacts to evaluate.

Before investing in a distillation pipeline, write the behavior specification and its verification tests. If the student passes common restore cases but fails expired-admin or long-context cases, capacity, context length, prompt coverage, and teacher-target quality are competing explanations. Split those hypotheses with targeted slices instead of reading one aggregate score.

| Behavior | Regression risk to test | Useful held-out gate |
|:---------|-------------------------|----------------------|
| **Domain answers** | Generated targets can repeat teacher errors | Checked answer accuracy and abstention rate |
| **Instruction following** | Narrow traces can miss new constraints | Fresh constraint-following prompts |
| **Multi-step solutions** | Final answers can hide invalid steps | Step checks where available plus final-answer accuracy |
| **Long-context use** | Student architecture or context limit may differ | Retrieval and long-context slices at deployment length |
| **Safety and policy behavior** | Filtered corpus may omit refusals or edge cases | Safety-policy evaluation separate from task benchmark |

### Legal and ethical considerations

Because the student can mirror teacher outputs closely, the origins of that training data matter.

*   Provider terms matter: the Stanford Alpaca release was research-only and non-commercial, and the repo points to both the underlying LLaMA restrictions and the dataset's CC BY-NC 4.0 terms.[^taori2023]
*   Restrictions must be reviewed: before generating a corpus or shipping a student, review the teacher access terms, base-student license, generated-data license, and permitted use of outputs. Don't infer permission from technical access.
*   Imitation isn't capability proof: a student may reproduce style or familiar output patterns while failing new checked tasks. Held-out evaluation, not resemblance, establishes value.

### Cost-quality tradeoff

Choose a distillation method from measured quality and economics. Richer teacher access enables different losses; it doesn't rank final models without evaluation.

| Approach | Required access | Main training cost | Release gate |
|:---------|:----------------|:------------------|:-------------|
| **Use teacher directly** | Teacher inference | No student training | Baseline quality, latency, and cost |
| **Response KD** | Generated outputs and permitted use | Generation plus SFT | Output filtering and held-out task quality |
| **Logit KD** | Aligned teacher token probabilities | Teacher scoring or cache storage | Task quality plus cache/online cost |
| **Feature KD** | Hidden states and layer mapping | Extra projections and state transfer | Ablation against simpler KD baseline |

Distillation loss is an optimization signal, not a release decision. A student can match teacher probabilities on training batches and still regress on held-out generation quality, long-context behavior, or latency targets. Measure task metrics, pairwise win rate, and real serving cost together.

Compare an unmodified student, a trusted-label SFT baseline, the distilled student, and the teacher on the same held-out examples. Match decoding budgets and report output length, sample counts, and uncertainty. Benchmark latency and cost on the target hardware with specified precision, concurrency, input/output lengths, and percentile. The next gate uses assigned numbers only; measure actual latency and invoice cost separately.

<!-- leetllm: test, output=show -->
```python title="deployment-gate.py"
teacher = {"checked_accuracy": 0.94, "policy_error_rate": 0.01, "latency_ms": 180, "monthly_cost": 42000}
student = {"checked_accuracy": 0.92, "policy_error_rate": 0.04, "latency_ms": 42, "monthly_cost": 18000}
requirements = {
    "checked_accuracy": 0.90,
    "max_policy_error_rate": 0.02,
    "max_latency_ms": 60,
    "max_monthly_cost": 20000,
}

checks = {
    "quality": student["checked_accuracy"] >= requirements["checked_accuracy"],
    "policy": student["policy_error_rate"] <= requirements["max_policy_error_rate"],
    "latency": student["latency_ms"] <= requirements["max_latency_ms"],
    "cost": student["monthly_cost"] <= requirements["max_monthly_cost"],
}

print("student faster:", student["latency_ms"] < teacher["latency_ms"])
print("student cheaper:", student["monthly_cost"] < teacher["monthly_cost"])
print("release checks:", checks)
print("deploy student:", all(checks.values()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
student faster: True
student cheaper: True
release checks: {'quality': True, 'policy': False, 'latency': True, 'cost': True}
deploy student: False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/student_release_gate_dark.png" alt="An assigned deployment example tests four student values against release thresholds: checked accuracy 0.92 meets at least 0.90, policy error 0.04 fails at most 0.02, latency 42 milliseconds meets at most 60, and monthly cost 18,000 dollars meets at most 20,000. Three checks pass and the conjunctive release decision is blocked by policy error. These are exercise numbers, not measured deployment results." />
  <figcaption>The exercise uses assigned values and per-metric scales. Checked accuracy, latency, and monthly cost pass; policy error exceeds its limit. Because the four gates are conjunctive, the student remains blocked until every check passes.</figcaption>
</figure>

The gate makes that trade-off concrete: this student is faster and cheaper, and its checked accuracy clears the threshold, but its policy error rate doesn't. Keep the teacher or revise the student until every release check passes.

## When distillation breaks

| Symptom | Possible explanations | Investigation or intervention |
| --- | --- | --- |
| Higher temperature stops improving held-out task quality. | Extra softening may not help this student; scaled KL can approach centered-logit matching instead of vanishing. | Tune temperature and loss weight on held-out tasks, not from a nearly constant loss alone. |
| Student looks strong on training prompts but weak on held-out tasks. | Narrow coverage, memorization, teacher-target errors, or a split mismatch. | Inspect task slices, broaden coverage where needed, and keep a separate held-out <span data-glossary="evaluation-slice">evaluation slice</span>. |
| Student predicts current token instead of next token. | Hard-label loss forgot the one-token shift. | Pair logits at $t$ with hard labels at $t+1$; compare teacher/student logits at the same $t$ and prefix. |
| Student repeats teacher errors. | Wrong targets may be retained; pre-existing student errors can also persist. | Audit targets and baseline errors, test trusted-label mixtures, and evaluate corrected data separately. |
| KL loss runs but student quality stays random. | Teacher and student token-to-id mappings don't align, even if sizes match. | Compare mappings exactly, use response distillation, or design an explicit output-space mapping. |
| Tiny student misses required checked behaviors. | Student capacity, context, or data coverage is insufficient for this release target. | Narrow task scope, increase student size, or revise training and evaluation design. |
| Offline metrics look great but production quality collapses. | Leakage, deployment distribution shift, different decoding, or a serving defect. | Check split independence and replay failures under the actual prompt, tokenizer, decoding, and runtime settings. |

Hard labels omit the teacher's softened probability distribution. That loss sits on the next token, and a faster student that misses a policy gate stays blocked. A bounded decision needs its own labels, readout, and calibration.

```mastery-quiz
[
  {
    "question": "At temperature 3, one token has student probability 0.25 and detached teacher probability 0.65. What are the student-logit gradients for unscaled soft cross-entropy and T²-scaled soft loss, respectively?",
    "options": [
      "−0.4 and −3.6",
      "−2/15 and −1.2",
      "−1.2 and −2/15",
      "−0.4 and −0.4"
    ],
    "answer": "−2/15 and −1.2",
    "explanation": "The gradients are (p−q)/T=−0.4/3=−2/15 and T(p−q)=3×−0.4=−1.2. The second is 9 times the first at this temperature."
  },
  {
    "question": "At the same prefix, both models have three possible next tokens. In teacher ID order they are north, east, west, with probabilities [0.27, 0.58, 0.15]. In student ID order they are east, north, west. Which target should the loss use in student ID order, and which model should the optimizer update?",
    "options": [
      "Use [0.15, 0.58, 0.27] and update the student.",
      "Use [0.58, 0.27, 0.15] and update the teacher.",
      "Use [0.15, 0.58, 0.27] and update the teacher.",
      "Use [0.58, 0.27, 0.15] and update the student."
    ],
    "answer": "Use [0.58, 0.27, 0.15] and update the student.",
    "explanation": "In student ID order, east gets 0.58, north gets 0.27, and west keeps 0.15. Reversing the whole vector would give east the 0.15 that belongs to west. The student learns from the teacher’s detached probabilities. Updating the teacher with either vector would leave the student untrained."
  },
  {
    "question": "A response-only causal example is [BOS,Q1,Q2,A1,A2,PAD], indexed 0 through 5. Only A1 and A2 are answer targets. Which student/teacher logit positions contribute, and where do their hard labels come from?",
    "options": [
      "Compare logits 2,3; use hard labels 3,4.",
      "Compare logits 3,4; use hard labels 3,4.",
      "Compare logits 2,3; use hard labels 2,3.",
      "Compare logits 1,2; use hard labels 3,4."
    ],
    "answer": "Compare logits 2,3; use hard labels 3,4.",
    "explanation": "Positions 2 and 3 predict next tokens A1 and A2 at labels 3 and 4. Teacher and student logits stay at the same prefix positions; the hard labels shift. Prompt and padding targets remain ignored."
  },
  {
    "question": "In an evaluation dataset, the teacher answers case A with 41 and case B with 17. The trusted reference confirms 41 for A and requires abstention for B. Both examples are unique. Which filtering decision supplies the intended supervised targets?",
    "options": [
      "Keep A’s answer and keep B’s answer.",
      "Reject A’s answer and reject B’s answer.",
      "Keep A’s answer and reject B’s answer.",
      "Reject A’s answer and keep B’s answer."
    ],
    "answer": "Keep A’s answer and reject B’s answer.",
    "explanation": "A’s answer of 41 matches its reference. B’s answer of 17 is unsupported because its reference requires abstention. Keeping both would train the student to give 17 for B. Rejecting both would discard the verified answer for A. Keeping only B would discard the verified answer and train on the error."
  },
  {
    "question": "A held student state is [2,1]. A projection has rows [1,0], 0,1],[1,1], and its detached teacher target is [4,1,2]. What is the summed squared feature error?",
    "options": [
      "0",
      "3",
      "5/3",
      "5"
    ],
    "answer": "5",
    "explanation": "The projection gives [2,1,3]. Errors are [−2,0,1], so the summed squares are 4 + 0 + 1 = 5. Dividing by width would instead give 5/3 and change the declared reduction."
  },
  {
    "question": "A teacher assigns A and B probabilities 0.7 and 0.3; the student assigns 1 and 0. What are forward KL(teacher||student) and reverse KL(student||teacher)?",
    "options": [
      "Infinity and −ln(0.7).",
      "−ln(0.7) and infinity.",
      "0 and −ln(0.7).",
      "Infinity and 0."
    ],
    "answer": "Infinity and −ln(0.7).",
    "explanation": "Positive teacher mass 0.3 meets zero student mass at B, so forward KL diverges. Reverse KL has only the positive A term: 1 ×ln(1/0.7)=−ln(0.7)≈0.3567; dropping B does not make the total zero."
  },
  {
    "question": "A student generates the prefix “unless the audit is paused”, absent from fixed teacher-written answers. A run can score one new prefix. Which supervision addresses this visited-state gap?",
    "options": [
      "Score a familiar teacher prefix, then attach its distribution to the student prefix.",
      "Score the student prefix with the teacher, then match distributions at that same prefix.",
      "Reverse KL on a familiar fixed prefix, then treat the student prefix as already covered.",
      "Add the student text as a verified hard answer, then skip teacher scoring for that prefix."
    ],
    "answer": "Score the student prefix with the teacher, then match distributions at that same prefix.",
    "explanation": "Teacher feedback must condition on the state the student actually reached. Reversing divergence on another prefix does not create on-policy coverage, and a sampled prefix is not a verified final answer."
  },
  {
    "question": "Teacher probabilities are [0.4,0.4,0.2], student probabilities [0.1,0.1,0.8]. Both renormalize the first two outcomes before computing KL. Which pair of conclusions follows?",
    "options": [
      "Retained conditional KL is positive; full-vocabulary KL is zero.",
      "Retained conditional KL is zero; full-vocabulary KL is zero.",
      "Retained conditional KL is zero; full-vocabulary KL is positive.",
      "Retained conditional KL is positive; full-vocabulary KL is positive."
    ],
    "answer": "Retained conditional KL is zero; full-vocabulary KL is positive.",
    "explanation": "Both retained pairs become [0.5,0.5], so conditional KL is zero. The full distributions differ, with forward KL 0.6×ln4≈0.8318. Renormalization concealed the tail error."
  },
  {
    "question": "Release requires accuracy ≥ 0.90, policy error ≤ 0.01, latency ≤ 60 ms and cost ≤ 20000 units. Candidate A has 0.93, 0.01, 70 ms, 18000; candidate B has 0.89, 0.00, 50 ms, 19000. What follows under conjunctive gates?",
    "options": [
      "Accept A; reject B.",
      "Reject A; accept B.",
      "Accept A; accept B.",
      "Reject A; reject B."
    ],
    "answer": "Reject A; reject B.",
    "explanation": "A fails latency despite passing the other values; B fails accuracy despite meeting the other gates. One favorable metric cannot compensate for a failed required check. These are assigned values."
  },
  {
    "question": "Two microbatches have mean valid-token losses 0.1 on 2 tokens and 0.7 on 4 tokens. What is the global token mean, with each valid token weighted equally?",
    "options": [
      "0.4",
      "0.5",
      "0.3",
      "3.0"
    ],
    "answer": "0.5",
    "explanation": "The token loss sum is 2×0.1+4×0.7=3.0 over 6 tokens, so the mean is 0.5. Averaging the two means gives 0.4 and weights the unequal microbatches incorrectly."
  }
]
```

> **Next:** Continue to [Decision Models: Jev and Kev](/learn/decision-models-jev-kev). Distillation trains a student from teacher signal. The next lesson changes the target to a bounded decision and asks how labels, a readout head, and held-out calibration turn that target into useful software behavior.
