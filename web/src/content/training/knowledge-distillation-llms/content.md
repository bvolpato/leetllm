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
  "shortDescription": "Distill a 70B teacher into a fast 7B student using softened token probabilities, filtered reasoning traces, and on-policy rollouts, while avoiding tokenizer mismatches and silent tail errors.",
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
    "Multi-metric deployment evaluation"
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

A 70B reasoning model solves 94% of your technical QA benchmarks, but takes 180 milliseconds per response and blows through your serving budget. A 7B model answers in 42 milliseconds at less than half the cost, yet fine-tuning it on ground-truth answer strings alone leaves a sharp accuracy gap on tricky edge cases.

The previous lesson used Reinforcement Learning with Verifiable Rewards (RLVR) to train against checked outcomes. <span data-glossary="teacher-student-distillation">Knowledge distillation</span> takes a different route: train a compact **student** directly from the behavior of an existing **teacher**. The teacher might come from RLVR, ordinary pretraining, or even the same architecture in self-distillation, where a model learns from its own verified reasoning traces.

What the student can learn depends on what the teacher exposes. With white-box access, the student matches softened next-<span data-glossary="token">token</span> probabilities or intermediate hidden states. With black-box text-only access, it fine-tunes on filtered teacher answers and reasoning traces. Either way, distillation transfers the behaviors present in the training signal, including any errors you forget to filter out.

## Why soft labels teach more than hard labels

Hinton et al. showed that a teacher's full probability distribution carries far more supervision than a one-hot ground-truth label.[^hinton2015] Consider a compact four-token answer vocabulary for a cache-retention QA prompt: `7d`, `3d`, `30d`, and `never`. A hard target places probability `1.00` on `7d` and `0.00` everywhere else, telling the student *what* the right token is while erasing *how close* the alternatives were.

The teacher's non-target probabilities preserve that structure. Here the teacher gives `3d` far more mass than `30d` or `never`, signaling that shorter retention windows are much closer to `7d` than disabling caching entirely. Hinton et al. called this relative probability structure **dark knowledge**.

<figure>
  <img src="illustrations/_generated/soft_labels_dark_knowledge_dark.png" alt="Three aligned probability tracks compare a trusted one-hot target with the teacher at T=1 and T=4 for 7d, 3d, 30d, and never. The top two answers stay in the same order while the 7d-minus-3d gap narrows from 1.000 to approximately 0.708 to approximately 0.156. Probability labels show four decimal places. The logits are a constructed example; T²=16 at T=4 is an approximate high-temperature gradient compensation." />
  <figcaption>Raising temperature flattens the teacher's peak while preserving the rank order across alternatives (7d > 3d > 30d > never), making near-miss probabilities visible to the student.</figcaption>
</figure>

To expose those smaller probabilities without distorting rank order, divide the raw logits by a <span data-glossary="temperature">temperature</span> $T > 1$ before applying softmax. At $T = 1$ you get the ordinary distribution; as $T$ rises, the distribution flattens smoothly toward uniform:

<!-- leetllm: test, output=show -->
```python title="temperature-softening.py"
import math

logits = {"7d": 4.0, "3d": 2.0, "30d": 1.0, "never": 0.7}

def softened_probabilities(temperature: float) -> dict[str, float]:
    offset = max(logits.values())
    weights = {tok: math.exp((val - offset) / temperature) for tok, val in logits.items()}
    total = sum(weights.values())
    return {tok: w / total for tok, w in weights.items()}

for T in (1.0, 4.0, 40.0):
    probs = softened_probabilities(T)
    formatted = {tok: round(p, 3) for tok, p in probs.items()}
    print(f"T={T:4g} | probs={formatted} | top_gap={probs['7d'] - probs['3d']:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
T=   1 | probs={'7d': 0.818, '3d': 0.111, '30d': 0.041, 'never': 0.03} | top_gap=0.708
T=   4 | probs={'7d': 0.397, '3d': 0.241, '30d': 0.188, 'never': 0.174} | top_gap=0.156
T=  40 | probs={'7d': 0.263, '3d': 0.25, '30d': 0.244, 'never': 0.242} | top_gap=0.013
```
<!-- leetllm: output:end -->

When ground-truth labels are also available, training blends the teacher-matching loss with standard task cross-entropy:

$$
\mathcal{L} = \alpha \cdot \mathcal{L}_{\text{distill}} + (1 - \alpha) \cdot \mathcal{L}_{\text{task}}
$$

The mixing weight $\alpha \in [0, 1]$ controls how strongly the student trusts the teacher versus hard labels. Raising $\alpha$ transfers more of the teacher's nuance, but also amplifies any systematic mistakes in the teacher's predictions.

```checkpoint
What happens when $\alpha$ moves closer to 1?
---
The student follows the teacher's softened distribution more closely and relies less on hard ground-truth labels. That transfers richer relative rankings when the teacher is strong, but also makes teacher errors more influential.
```

At scale, token-probability distillation delivers substantial gains. In the Gemma 2 technical report, a 2B student trained for 500B tokens with next-token distillation from a 7B teacher reached `67.7` on their three-benchmark average, compared with `60.3` trained from scratch on the same token budget.[^gemma2team2024] Other influential recipes use different channels: Orca trains on step-by-step explanation traces, and phi-1.5 pretrains on curated synthetic textbook-style data.[^mukherjee2023][^li2023c]

## Matching the teacher's probabilities: logit distillation

In white-box causal language models, **logit distillation** compares the teacher's and student's next-token distributions at every supervised position using <span data-glossary="kl-divergence">KL divergence</span>. Feed the exact same token sequence into both models, detach the teacher so only student weights update, and soften both <span data-glossary="logits">logits</span> by $T$:

$$
q_i = \frac{\exp(z_{t,i} / T)}{\sum_j \exp(z_{t,j} / T)},
\qquad
p_i = \frac{\exp(z_{s,i} / T)}{\sum_j \exp(z_{s,j} / T)}
$$

$$
\mathcal{L}_{\text{KL}} = T^2 \sum_i q_i \log \frac{q_i}{p_i}
$$

Here $q$ is the frozen teacher distribution, $p$ is the student distribution, and the hard task loss (when blended in) stays at $T = 1$.

Why multiply by $T^2$? Differentiating the unscaled soft cross-entropy $-\sum_i q_i \log p_i$ with respect to student logit $z_{s,i}$ yields $\frac{1}{T}(p_i - q_i)$. Because raising $T$ also shrinks the probability gap $(p_i - q_i)$ roughly as $1/T$ at high temperatures, the unscaled gradient decays like $1/T^2$, drowning out the distillation branch next to a $T = 1$ hard loss.[^hinton2015] Multiplying by $T^2$ restores the gradient scale to $T(p_i - q_i)$, which converges to centered-logit MSE matching as $T$ grows large.

<details>
<summary>Deep dive: Deriving the T² high-temperature scaling factor</summary>

Let $v_i = z_{s,i}/T$. Standard softmax cross-entropy has derivative $\partial \mathcal{L}_{\text{soft}} / \partial v_i = p_i - q_i$, so by the chain rule:

$$
\frac{\partial \mathcal{L}_{\text{soft}}}{\partial z_{s,i}} = \frac{1}{T}(p_i - q_i)
$$

When $T$ is large relative to the centered logit spread, $\exp(z/T) \approx 1 + z/T$, giving:

$$
p_i \approx \frac{1}{|V|}\left(1 + \frac{z_{s,i} - \bar{z}_s}{T}\right),
\qquad
q_i \approx \frac{1}{|V|}\left(1 + \frac{z_{t,i} - \bar{z}_t}{T}\right)
$$

where $\bar{z}_s$ and $\bar{z}_t$ are mean logits across vocabulary $V$. Subtracting yields:

$$
\frac{\partial \mathcal{L}_{\text{soft}}}{\partial z_{s,i}} \approx \frac{1}{|V| T^2}\bigl((z_{s,i} - \bar{z}_s) - (z_{t,i} - \bar{z}_t)\bigr)
$$

Multiplying $\mathcal{L}_{\text{soft}}$ by $T^2$ cancels the $1/T^2$ attenuation, leaving an exact gradient $T(p_i - q_i)$ that approaches $\frac{1}{|V|}\bigl((z_{s,i} - \bar{z}_s) - (z_{t,i} - \bar{z}_t)\bigr)$ in the high-temperature limit.

</details>

Watch the raw gradient norm collapse across temperatures while the $T^2$-scaled norm stays steady and converges toward the centered-logit limit in PyTorch:

<!-- leetllm: test, deps=torch, output=show, output_title="Temperature gradient check" -->
```python title="temperature-gradient-check.py"
import torch
import torch.nn.functional as F

teacher = torch.tensor([4.0, 2.0, 1.0, 0.7], dtype=torch.float64)
base_student = torch.tensor([1.0, 0.4, 0.1, -0.2], dtype=torch.float64)
high_temp_limit = ((base_student - base_student.mean()) - (teacher - teacher.mean())) / len(teacher)

for T in (1.0, 4.0, 40.0, 400.0):
    student = base_student.clone().requires_grad_()
    q_log = F.log_softmax(teacher / T, dim=0)
    p_log = F.log_softmax(student / T, dim=0)
    loss = F.kl_div(p_log, q_log, log_target=True, reduction="sum")
    (raw_grad,) = torch.autograd.grad(loss, student)
    scaled_grad = (T ** 2) * raw_grad
    gap_to_limit = (scaled_grad - high_temp_limit).norm()
    print(f"T={T:5g} | raw_norm={raw_grad.norm():.6f} | scaled_norm={scaled_grad.norm():.6f} | dist_to_limit={gap_to_limit:.6f}")
```

<!-- leetllm: output:start -->
```text title="Temperature gradient check" output compact
T=    1 | raw_norm=0.434065 | scaled_norm=0.434065 | dist_to_limit=0.156800
T=    4 | raw_norm=0.030553 | scaled_norm=0.488844 | dist_to_limit=0.080567
T=   40 | raw_norm=0.000272 | scaled_norm=0.435812 | dist_to_limit=0.008958
T=  400 | raw_norm=0.000003 | scaled_norm=0.429383 | dist_to_limit=0.000901
```
<!-- leetllm: output:end -->

```checkpoint
Why use temperature $T > 1$ during logit distillation?
---
Higher temperature flattens sharp peaks and lifts the probabilities of plausible runner-up tokens, exposing the teacher's relative ranking across alternatives instead of collapsing onto the top token.
```

### Shifting labels without misaligning teacher and student

Two subtle alignment bugs can ruin causal logit distillation silently:

1. **Position shift:** In an autoregressive LLM, logits at position $t$ predict the hard label at position $t + 1$. Shift the hard labels left by one step (`labels[1:]`), while keeping teacher and student logits aligned at the **exact same** prefix position $t$ (`logits[:-1]`).
2. **Vocabulary mapping:** Matching `vocab_size` is not enough. If token ID `17` means `return` in the teacher and `<pad>` in the student, the loss runs cleanly while training the student toward nonsense. Verify identical token-to-ID dictionaries, normalization, and chat formatting before computing token-level KL.

<figure>
  <img src="illustrations/_generated/causal_logit_alignment_dark.png" alt="Four positions show teacher and student vectors of four logits aligned at the same t. The target token IDs are [0, 0, 1, -100]; shifting labels left pairs logits t0 with label[1]=0 (7d), t1 with label[2]=1 (3d), and t2 with label[3]=-100 (ignored by both KL and hard loss). The final t3 logits have no next label." />
  <figcaption>Teacher and student logits align at the same prefix position t, while hard labels shift left by one step. Positions whose next label is -100 are masked out of both the KL and cross-entropy losses.</figcaption>
</figure>

> **Common mistake:** Comparing `student.vocab_size == teacher.vocab_size` and assuming logit distillation is safe. Always verify exact token-to-ID equality across both tokenizers; if the tokenizers differ, switch to response distillation or an explicit cross-tokenizer alignment method.

This concise PyTorch function computes the shifted, masked causal KD loss and guards against vocabulary-order mismatches:

<!-- leetllm: test, deps=torch, output=show -->
```python title="causal-kd-loss.py"
import torch
import torch.nn.functional as F

VOCAB = ("7d", "3d", "30d", "never")

def causal_kd_loss(
    student_logits: torch.Tensor,
    teacher_logits: torch.Tensor,
    labels: torch.Tensor,
    student_vocab: tuple[str, ...],
    teacher_vocab: tuple[str, ...],
    temperature: float = 3.0,
    alpha: float = 0.6,
    ignore_index: int = -100,
) -> tuple[float, float, float]:
    if student_vocab != teacher_vocab:
        raise ValueError("Logit KD requires identical token-to-ID mappings.")

    # Align logits at prefix t with hard labels at t + 1
    shift_student = student_logits[:-1]
    shift_teacher = teacher_logits[:-1].detach()
    shift_labels = labels[1:]

    valid = shift_labels != ignore_index
    s_valid = shift_student[valid]
    t_valid = shift_teacher[valid]
    y_valid = shift_labels[valid]

    soft = F.kl_div(
        F.log_softmax(s_valid / temperature, dim=-1),
        F.log_softmax(t_valid / temperature, dim=-1),
        log_target=True,
        reduction="batchmean",
    ) * (temperature ** 2)
    hard = F.cross_entropy(s_valid, y_valid)
    total = alpha * soft + (1.0 - alpha) * hard
    return float(soft), float(hard), float(total)

student_logits = torch.tensor([
    [0.20, 0.10, 0.00, -0.10],
    [1.50, 0.40, 0.10, -0.20],
    [0.30, 2.00, 0.20, 0.00],
    [0.10, 0.20, 0.30, 0.40],
])
teacher_logits = torch.tensor([
    [2.00, 0.50, 0.10, 0.00],
    [3.00, 1.00, 0.20, 0.10],
    [0.20, 2.50, 0.40, 0.10],
    [0.00, 0.10, 0.20, 1.50],
])
labels = torch.tensor([0, 0, 1, -100])

soft, hard, total = causal_kd_loss(student_logits, teacher_logits, labels, VOCAB, VOCAB)
print(f"aligned vocab   | soft={soft:.4f} | hard={hard:.4f} | blended={total:.4f}")

try:
    causal_kd_loss(student_logits, teacher_logits, labels, VOCAB, tuple(reversed(VOCAB)))
except ValueError as err:
    print("mismatched vocab:", err)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
aligned vocab   | soft=0.2303 | hard=1.4545 | blended=0.7200
mismatched vocab: Logit KD requires identical token-to-ID mappings.
```
<!-- leetllm: output:end -->

## When you only have text: response distillation

When a teacher is behind an API or uses a different tokenizer, **response distillation** (sequence-level KD) trains the student via supervised fine-tuning (SFT) on curated `(prompt, response)` pairs generated by the teacher.

Response distillation brings three practical advantages:

1. **Tokenizer independence:** The student tokenizes raw text with its own tokenizer, so you can distill across completely different model families (for instance, DeepSeek-R1 into Qwen or Llama checkpoints).
2. **Decoupled compute:** Generate and filter teacher completions offline, then train the student without keeping a huge teacher loaded in GPU memory.
3. **Reasoning-trace supervision:** Teacher-written intermediate derivations supply dense token-level targets that teach multi-step solution patterns far better than final-answer strings alone.

| Recipe | Teacher | Signal transferred | Key takeaway |
|---|---|---|---|
| **Alpaca 7B**[^taori2023] | `text-davinci-003` | 52K generated instruction-response pairs | Popularized Self-Instruct SFT distillation (non-commercial research license) |
| **Orca 13B**[^mukherjee2023] | GPT-4 + ChatGPT | Detailed explanation traces | Showed richer step-by-step rationales beat terse answer imitation |
| **phi-1.5**[^li2023c] | Synthetic textbook-style corpus + filtered code | Pretraining corpus from scratch | Demonstrated high-quality synthetic data can rival much larger web corpora |
| **Distilling Step-by-Step**[^hsieh2023] | Generated rationales + ground-truth labels | Multi-task loss on labels and rationales | Trains much smaller models with far less human-labeled data |
| **DeepSeek-R1-Distill**[^deepseekR1Original2025] | DeepSeek-R1 curated traces | ~800K SFT examples (600K reasoning, 200K general) | Fine-tuned Qwen/Llama checkpoints (1.5B to 70B); the 32B Qwen student hit 72.6% AIME 2024 pass@1 and 94.3% MATH-500 |

Because standard cross-entropy treats every teacher token as ground truth, unfiltered teacher mistakes become training targets. Always filter generated completions with programmatic verifiers (unit tests, exact math checkers, schema checks) whenever possible, and curated quality rubrics elsewhere:

<!-- leetllm: test, output=show -->
```python title="filter-teacher-traces.py"
import ast

teacher_traces = [
    {"prompt": "Compute 17 * 24", "expr": "17 * 24", "teacher_answer": 408, "expected": 408},
    {"prompt": "Compute 2**10 - 24", "expr": "2**10 - 24", "teacher_answer": 1024, "expected": 1000},
    {"prompt": "Compute (15 + 9) // 3", "expr": "(15 + 9) // 3", "teacher_answer": 8, "expected": 8},
]

accepted, rejected = [], []
for row in teacher_traces:
    if row["teacher_answer"] == row["expected"]:
        accepted.append(row["prompt"])
    else:
        rejected.append((row["prompt"], row["teacher_answer"], row["expected"]))

print(f"kept {len(accepted)}/{len(teacher_traces)} verified traces: {accepted}")
print(f"rejected teacher errors: {rejected}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
kept 2/3 verified traces: ['Compute 17 * 24', 'Compute (15 + 9) // 3']
rejected teacher errors: [('Compute 2**10 - 24', 1024, 1000)]
```
<!-- leetllm: output:end -->

## Aligning internal layers: feature distillation

With white-box access, you can also align selected student hidden states to corresponding teacher hidden states using a learned linear projection $g_l$ that maps student width to teacher width:

$$
\mathcal{L}_{\text{feature}} = \sum_l \left\| f_{m(l)}^{\text{teacher}} - g_l\!\left(f_l^{\text{student}}\right) \right\|^2
$$

Here $m(l)$ maps student layer $l$ to a teacher layer (their depths need not match), teacher features stay detached, and padding positions are masked out before averaging.

```checkpoint
Why does feature distillation need the projection $g_l(\cdot)$?
---
The student typically has a smaller hidden dimension than the teacher. The learned projection $g_l$ maps student hidden vectors into the teacher's dimension so layer representations can be compared directly.
```

Feature distillation adds engineering choices (layer pairing, projection placement, extra activation memory), so benchmark it against plain logit KD on held-out tasks before paying the extra complexity.

| Method | Teacher signal | Main advantage | Main constraint |
|---|---|---|---|
| **Response KD** | Filtered text outputs | Works across tokenizers and API-only teachers | Unfiltered teacher mistakes become SFT targets |
| **Logit KD** | Softened token probabilities | Transfers full ranking over runner-up tokens | Needs identical token-to-ID mapping (or cross-tokenizer alignment) |
| **Feature KD** | Intermediate hidden states | Supervises internal representations directly | Extra layer-mapping design, projections, and memory |
| **On-policy KD** | Teacher logits on student-generated prefixes | Closes exposure bias on student trajectories | Requires student sampling + teacher scoring during training |

## Forward versus reverse KL

In autoregressive generation, KL divergence is asymmetric, so choosing which distribution sits on the left changes the optimization incentive when a smaller student cannot match the teacher everywhere:

$$
D_{\mathrm{KL}}(P_{\text{teacher}} \parallel P_{\text{student}}) = \sum_{x} P_{\text{teacher}}(x) \log \frac{P_{\text{teacher}}(x)}{P_{\text{student}}(x)}
$$

$$
D_{\mathrm{KL}}(P_{\text{student}} \parallel P_{\text{teacher}}) = \sum_{x} P_{\text{student}}(x) \log \frac{P_{\text{student}}(x)}{P_{\text{teacher}}(x)}
$$

1. **Forward KL (mode-covering):** Whenever $P_{\text{teacher}}(x) > 0$, pushing $P_{\text{student}}(x) \to 0$ drives the penalty to $+\infty$. A capacity-limited student therefore stretches its probability mass across *all* teacher modes, sometimes spilling mass into low-probability valleys between them.
2. **Reverse KL (mode-seeking):** Whenever $P_{\text{student}}(x) > 0$, putting mass where $P_{\text{teacher}}(x) \to 0$ blows up the loss, while dropping a teacher mode ($P_{\text{student}}(x) = 0$) pays only a finite penalty (for example, covering one of two equal `0.5` modes gives reverse KL $\log 2 \approx 0.693$). A constrained student therefore focuses sharply on high-probability teacher modes, which can boost precision at the cost of diversity.

| Direction | Formula | Penalty explosion | Tendency under limited capacity | Trade-off to watch |
|---|---|---|---|---|
| **Forward KL** | $D_{\mathrm{KL}}(P_t \parallel P_s)$ | $P_s \to 0$ where $P_t > 0$ | Mode-covering | Spilling mass onto low-quality tokens between modes |
| **Reverse KL** | $D_{\mathrm{KL}}(P_s \parallel P_t)$ | $P_t \to 0$ where $P_s > 0$ | Mode-seeking | Reduced output diversity; still copies confident teacher errors |

Neither direction wins universally. **MiniLLM** optimizes sequence-level reverse KL via policy gradients (combining teacher/student log-probability ratios with teacher-mixed sampling and length normalization to prevent repetition collapse).[^gu2024] **Generalized Knowledge Distillation (GKD)** decouples divergence from sampling and finds that generalized Jensen-Shannon divergence beats both KL directions on smaller translation students, while forward KL wins its headline on-policy GSM8K run.[^agarwal2024]

### Sequence KL weights prefixes by the left distribution

For full autoregressive sequences, the chain rule of KL divergence decomposes a sequence divergence into a sum of next-token KL divergences weighted by prefixes sampled from the distribution on the **left**. Watch that exact identity on a two-token vocabulary (`A`, `B`), and compare it with an unweighted (uniform-prefix) token average:

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

forward_joint = kl(teacher_joint, student_joint)
forward_decomp = kl(teacher_first, student_first) + sum(
    teacher_first[i] * kl(teacher_next[i], student_next[i]) for i in range(2)
)
reverse_joint = kl(student_joint, teacher_joint)
reverse_decomp = kl(student_first, teacher_first) + sum(
    student_first[i] * kl(student_next[i], teacher_next[i]) for i in range(2)
)
uniform_prefix = kl(teacher_first, student_first) + sum(
    kl(teacher_next[i], student_next[i]) for i in range(2)
) / 2

print(f"forward sequence KL : joint={forward_joint:.6f} | teacher-weighted={forward_decomp:.6f}")
print(f"reverse sequence KL : joint={reverse_joint:.6f} | student-weighted={reverse_decomp:.6f}")
print(f"uniform-prefix KL   : {uniform_prefix:.6f} (differs from sequence forward KL)")
```

<!-- leetllm: output:start -->
```text title="Sequence KL decomposition" output compact
forward sequence KL : joint=0.505499 | teacher-weighted=0.505499
reverse sequence KL : joint=0.530881 | student-weighted=0.530881
uniform-prefix KL   : 0.422535 (differs from sequence forward KL)
```
<!-- leetllm: output:end -->

Now compare forward and reverse KL directly on our three-token distribution (`7d: 0.58`, `3d: 0.40`, `never: 0.02`) as a student leaks extra mass onto `never`, and verify the boundary behavior when a student drops a mode completely:

<figure>
  <img src="illustrations/_generated/kl_direction_dark.png" alt="Two scenarios compare teacher probabilities 0.58, 0.40, 0.02 against student distributions 0.54, 0.36, 0.10 and 0.40, 0.35, 0.25 for 7d, 3d, and never. All six tracks share a probability axis from zero to 0.60. The extra student mass on never is 0.08 and 0.23. Their forward and reverse KL results are 0.051 and 0.084, then 0.218 and 0.436." />
  <figcaption>As the student shifts mass onto the teacher's low-probability token (never), reverse KL climbs roughly twice as fast as forward KL (0.436 vs 0.218).</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="kl-direction-diagnostic.py"
import math

def kl(left: dict[str, float], right: dict[str, float]) -> float:
    total = 0.0
    for token, p in left.items():
        if p == 0.0:
            continue
        q = right[token]
        if q == 0.0:
            return math.inf
        total += p * math.log(p / q)
    return total

teacher = {"7d": 0.58, "3d": 0.40, "never": 0.02}
students = {
    "mild_tail_leak": {"7d": 0.54, "3d": 0.36, "never": 0.10},
    "heavy_tail_leak": {"7d": 0.40, "3d": 0.35, "never": 0.25},
}

for name, student in students.items():
    print(f"{name:16s} | forward KL={kl(teacher, student):.3f} | reverse KL={kl(student, teacher):.3f}")

two_modes = {"A": 0.5, "B": 0.5}
one_mode = {"A": 1.0, "B": 0.0}
print(f"drop one mode    | forward KL={kl(two_modes, one_mode)}   | reverse KL={kl(one_mode, two_modes):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mild_tail_leak   | forward KL=0.051 | reverse KL=0.084
heavy_tail_leak  | forward KL=0.218 | reverse KL=0.436
drop one mode    | forward KL=inf   | reverse KL=0.693
```
<!-- leetllm: output:end -->

> **Key insight:** Zero KL divergence only means the student matched the teacher. If a teacher assigns `0.99` to a wrong answer and the student copies it, both forward and reverse KL equal `0.000`. Always measure task accuracy and failure slices alongside divergence.

## Off-policy versus on-policy distillation

Off-policy distillation trains on fixed prefixes written by the teacher. At inference time, however, the student conditions on its *own* previously generated tokens. Once an early token diverges from the teacher's path, later prefixes drift into states the training set never covered, and errors compound (**exposure bias**).

<span data-glossary="on-policy-distillation">On-policy distillation (OPD)</span> closes that gap by sampling sequences from the student itself and scoring those student-generated prefixes with the teacher. In **GKD**, a student-data fraction $\lambda$ mixes fixed teacher prefixes with live student rollouts, and either forward KL, reverse KL, or generalized Jensen-Shannon divergence can be applied on top.[^agarwal2024] Gemma 2's post-training pipeline likewise combines synthetic teacher responses with distillation on the student's own distribution.[^gemma2team2024]

Notice that the **sampling rule** (off-policy vs on-policy) is orthogonal to the **divergence** (forward vs reverse KL). Swapping the two arguments of `F.kl_div` on a static dataset does not make training on-policy.

<!-- leetllm: test, output=show -->
```python title="on-policy-prefix-coverage.py"
prompt = "Recommended cache TTL for static docs? Answer: "
teacher_prefixes = {prompt + "7", prompt + "7 days"}
student_prefixes = {prompt + "7", prompt + "30", prompt + "30 days"}

unseen_by_offline_kd = student_prefixes - teacher_prefixes
covered_on_policy = teacher_prefixes | student_prefixes

print("offline teacher prefixes:", len(teacher_prefixes))
print("student prefixes missed offline:", sorted(unseen_by_offline_kd))
print("total prefixes scored on-policy:", len(covered_on_policy))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
offline teacher prefixes: 2
student prefixes missed offline: ['Recommended cache TTL for static docs? Answer: 30', 'Recommended cache TTL for static docs? Answer: 30 days']
total prefixes scored on-policy: 4
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/prefix_coverage_trace_dark.png" alt="Token prefix matching between teacher demonstrations and student generations. Two reference teacher prefixes and three student rollouts share common initial tokens while branching at later positions. Distinct token paths expand teacher evaluation coverage across four unique candidate prefixes." />
  <figcaption>When the student branches onto tokens absent from fixed teacher data, on-policy collection scores those visited prefixes directly with the teacher.</figcaption>
</figure>

<details>
<summary>Deep dive: Framework trainer choices and adapter placement</summary>

Production trainers such as Hugging Face TRL's `DistillationTrainer` and experimental `GKDTrainer` implement student-generated rollouts, chunked full-vocabulary generalized Jensen-Shannon losses (to avoid materializing giant `[batch, seq, vocab]` logit tensors all at once), and masking for tool-result tokens in agent trajectories.[^huggingface2026distillationTrainer][^huggingface2026gkdGuide] Note two subtle parameter conventions: TRL's GKD `beta` selects the divergence interpolation (distinct from our teacher/task mixing weight $\alpha$), and chunked trainers that read `lm_head.weight` directly cannot apply LoRA adapters to `lm_head` (use `modules_to_save=["lm_head"]` instead).

</details>

## A practical distillation training loop

Putting everything together in PyTorch requires three careful details:

1. **Freeze the teacher:** Call `teacher.requires_grad_(False)` and `teacher.eval()`, and wrap teacher forward passes in `torch.no_grad()`.
2. **Mask prompt and padding tokens explicitly:** While `F.cross_entropy` supports `ignore_index=-100`, `F.kl_div` does not.[^pytorchCrossEntropy2026][^pytorchKlDiv2026] Compute `valid = shifted_labels != -100` and index both branches with `valid`.
3. **Flatten valid tokens before `batchmean`:** `F.kl_div(..., reduction="batchmean")` divides by the *leading* dimension only.[^pytorchKlDiv2026] Flattening valid positions to `[num_valid_tokens, vocab]` yields a true mean per supervised token; leaving tensors at `[batch, seq, vocab]` computes summed KL per sequence instead, multiplying the loss by `num_valid_tokens / batch_size`.

Watch a real PyTorch student update against a frozen teacher, verify that ignored prompt/padding positions cannot affect the loss, and compare per-token vs per-sequence reductions:

<!-- leetllm: test, deps=torch, output=show -->
```python title="tiny-kd-training-step.py"
import torch
from torch import nn
import torch.nn.functional as F

class TinyLM(nn.Module):
    def __init__(self, vocab_size: int, hidden_size: int):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, hidden_size)
        self.lm_head = nn.Linear(hidden_size, vocab_size)

    def forward(self, input_ids: torch.Tensor) -> torch.Tensor:
        return self.lm_head(self.embed(input_ids))

def kd_loss(student_logits, teacher_logits, labels, temperature=3.0, alpha=0.7):
    shifted_labels = labels[:, 1:]
    valid = shifted_labels != -100
    if not valid.any():
        raise ValueError("No supervised next-token positions; skip this batch.")

    s_flat = student_logits[:, :-1, :][valid].float()
    t_flat = teacher_logits[:, :-1, :].detach()[valid].float()
    y_flat = shifted_labels[valid]

    soft = F.kl_div(
        F.log_softmax(s_flat / temperature, dim=-1),
        F.log_softmax(t_flat / temperature, dim=-1),
        log_target=True,
        reduction="batchmean",
    ) * (temperature ** 2)
    hard = F.cross_entropy(s_flat, y_flat)
    return alpha * soft + (1.0 - alpha) * hard

torch.manual_seed(0)
torch.set_num_threads(1)

teacher = TinyLM(vocab_size=12, hidden_size=16).eval()
teacher.requires_grad_(False)
student = TinyLM(vocab_size=12, hidden_size=6).train()
optimizer = torch.optim.AdamW(student.parameters(), lr=0.05)

input_ids = torch.tensor([[1, 2, 3, 4, 5], [1, 3, 5, 7, 9]])
labels = input_ids.clone()
labels[:, :2] = -100   # mask prompt tokens
labels[1, -1] = -100   # mask trailing padding token

with torch.no_grad():
    teacher_logits = teacher(input_ids)
teacher_snapshot = teacher.lm_head.weight.clone()

student_logits_before = student(input_ids)
loss_before = kd_loss(student_logits_before, teacher_logits, labels)
optimizer.zero_grad()
loss_before.backward()
optimizer.step()
loss_after = kd_loss(student(input_ids), teacher_logits, labels)

# Perturbing ignored teacher positions leaves the masked loss unchanged
perturbed_teacher = teacher_logits.clone()
perturbed_teacher[:, :-1, :][labels[:, 1:] == -100] = 1000.0
loss_perturbed = kd_loss(student_logits_before, perturbed_teacher, labels)

valid_per_seq = float((labels[:, 1:] != -100).sum()) / labels.size(0)
print(f"loss before -> after : {float(loss_before):.4f} -> {float(loss_after):.4f}")
print(f"teacher unchanged    : {bool(torch.equal(teacher.lm_head.weight, teacher_snapshot))}")
print(f"ignored-mask delta   : {abs(float(loss_before - loss_perturbed)):.6f}")
print(f"seq/token mean ratio : {valid_per_seq:.1f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
loss before -> after : 1.1329 -> 0.9520
teacher unchanged    : True
ignored-mask delta   : 0.000000
seq/token mean ratio : 2.5x
```
<!-- leetllm: output:end -->

> **Common mistake:** Passing an all-masked batch into `optimizer.step()` with a zero gradient tensor. PyTorch's `AdamW` still applies decoupled weight decay whenever a parameter has a zero-valued `.grad` tensor (only parameters with `grad=None` are skipped).[^pytorchAdamW2026] Skip empty batches completely before calling `optimizer.step()`. And in distributed or gradient-accumulated training, weight microbatch sums by the global valid-token count rather than averaging microbatch means of unequal lengths.

### Caching dense vs top-k teacher logits

Running a 70B teacher inline during every student step is expensive, so teams often consider caching teacher logits offline. Dense bf16 logits across 50M tokens and a 32K vocabulary consume nearly 3 TiB, whereas storing <span data-glossary="top-k">top-k</span> (`k=64`) entries drops storage by `166.7x`.

Watch out for the **renormalized tail illusion**, though: if you drop the tail probabilities and renormalize only the top-$k$ tokens to sum to 1, truncated KL can read `0.000` even when the student puts 55% of its probability mass on junk tokens outside the top-$k$!

<!-- leetllm: test, output=show -->
```python title="logit-cache-budget.py"
import math

tokens, vocab_size, top_k = 50_000_000, 32_000, 64
gib = 1024 ** 3
dense_gib = (tokens * vocab_size * 2) / gib          # bf16 logits
topk_gib = (tokens * top_k * (2 + 4)) / gib          # bf16 value + int32 token id

print(f"dense cache: {dense_gib:.1f} GiB | top-64 cache: {topk_gib:.1f} GiB ({dense_gib / topk_gib:.1f}x smaller)")

# Renormalizing top-2 tokens hides a massive tail error
teacher, student = [0.60, 0.30, 0.10], [0.30, 0.15, 0.55]
def forward_kl(q, p):
    return sum(qi * math.log(qi / pi) for qi, pi in zip(q, p))

q_top = [v / sum(teacher[:2]) for v in teacher[:2]]
p_top = [v / sum(student[:2]) for v in student[:2]]
print(f"full forward KL={forward_kl(teacher, student):.3f} | renormalized top-2 KL={forward_kl(q_top, p_top):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dense cache: 2980.2 GiB | top-64 cache: 17.9 GiB (166.7x smaller)
full forward KL=0.453 | renormalized top-2 KL=0.000
```
<!-- leetllm: output:end -->

To avoid blinding the loss to tail mass, track the residual tail probability (`1 - sum(top_k)`) as an explicit bucket or run online teacher scoring when compute allows.

## Building a distillation dataset

In response distillation, data quality sets the student's ceiling. A clean **Seed-Expand-Filter** pipeline turns a small human-written seed set into a verified training corpus, following the lineage of Self-Instruct and Orca while adding strict verification and decontamination:[^taori2023][^mukherjee2023]

1. **Seed:** Author 100 to 500 high-signal prompts covering core tasks and hard edge cases.
2. **Expand:** Have the teacher generate diverse prompt variations while keeping source-document families isolated from your held-out evaluation split.
3. **Generate:** Collect teacher answers (and step-by-step rationales where helpful).
4. **Filter & Decontaminate:** Deduplicate prompts before paying for generation, check outputs with verifiers or rubrics, and block overlap with held-out evaluation prompts.

| Candidate prompt | Teacher output | Filter rule | Outcome |
|---|---|---|---|
| `What is 17 * 24?` | `408` | Matches exact verifier | Keep |
| `  what is 17 * 24?  ` | (skipped) | Duplicate normalized prompt | Skip before generation |
| `What is 2**10 - 24?` | `1024` | Expected `1000` | Reject |
| `Explain how FlashAttention tiles SRAM` | (skipped) | Matches held-out eval prompt | Block contamination |

This short helper combines prompt deduplication, exact-overlap decontamination against a held-out eval set, and response verification in one pass:

<!-- leetllm: test, output=show -->
```python title="build-clean-distillation-set.py"
def normalize(text: str) -> str:
    return " ".join(text.lower().replace("?", "").split())

held_out_eval = {
    normalize("Explain how FlashAttention tiles SRAM"),
    normalize("Derive the softmax Jacobian"),
}

candidates = [
    ("What is 17 * 24?", "408", "408"),
    ("  what is 17 * 24?  ", "408", "408"),
    ("What is 2**10 - 24?", "1024", "1000"),
    ("Explain how FlashAttention tiles SRAM?", "Tiles Q, K, V...", "Tiles Q, K, V..."),
]

seen, kept, dropped = set(), [], []
for prompt, teacher_out, expected in candidates:
    key = normalize(prompt)
    if key in seen:
        dropped.append((prompt.strip(), "duplicate"))
    elif key in held_out_eval:
        dropped.append((prompt.strip(), "eval_contamination"))
    elif teacher_out != expected:
        dropped.append((prompt.strip(), "wrong_teacher_output"))
    else:
        seen.add(key)
        kept.append({"prompt": prompt.strip(), "response": teacher_out})

print("kept training rows:", kept)
print("filtered out:      ", dropped)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
kept training rows: [{'prompt': 'What is 17 * 24?', 'response': '408'}]
filtered out:       [('what is 17 * 24?', 'duplicate'), ('What is 2**10 - 24?', 'wrong_teacher_output'), ('Explain how FlashAttention tiles SRAM?', 'eval_contamination')]
```
<!-- leetllm: output:end -->

In production, split parent seed documents *before* expansion so rewritten siblings never leak across train and test, and add embedding or n-gram near-duplicate detection alongside exact matching.

## When distillation fits the task

Distillation compresses capability into a smaller footprint, but it cannot bypass student capacity limits, shorter context windows, or missing prompt coverage. Evaluate four models side by side under identical decoding budgets: the raw base student, a hard-label SFT baseline, the distilled student, and the teacher.

| Capability slice | Typical regression risk | What to measure |
|---|---|---|
| **Core QA & domain tasks** | Copying subtle teacher hallucinations | Checked accuracy and abstention rate |
| **Instruction following** | Overfitting to narrow synthetic templates | Fresh constraint-following prompts |
| **Multi-step reasoning** | Correct final answers via invalid derivations | Intermediate step checks + final accuracy |
| **Long-context retrieval** | Smaller student context or RoPE scaling limits | Needle/retrieval slices at full target length |
| **Safety & refusals** | Filtered task data strips refusal behavior | Dedicated safety slice separate from task accuracy |

Also verify licensing before generating a synthetic corpus: teacher API terms and open weights often restrict commercial distillation (for example, Alpaca's dataset carries CC BY-NC 4.0 and inherited LLaMA's non-commercial terms).[^taori2023]

### Multi-metric deployment check

Lowering KL loss during training is only an optimization signal. Ship a distilled student only when it clears *every* required quality, error-rate, latency, and cost threshold simultaneously:

<!-- leetllm: test, output=show -->
```python title="evaluate-student-deployment.py"
teacher = {"accuracy": 0.94, "critical_error_rate": 0.01, "latency_ms": 180, "monthly_cost": 42000}
student = {"accuracy": 0.92, "critical_error_rate": 0.04, "latency_ms": 42, "monthly_cost": 18000}
targets = {"min_accuracy": 0.90, "max_error_rate": 0.02, "max_latency_ms": 60, "max_monthly_cost": 20000}

results = {
    "accuracy": student["accuracy"] >= targets["min_accuracy"],
    "critical_error_rate": student["critical_error_rate"] <= targets["max_error_rate"],
    "latency": student["latency_ms"] <= targets["max_latency_ms"],
    "cost": student["monthly_cost"] <= targets["max_monthly_cost"],
}

print(f"speedup={teacher['latency_ms'] / student['latency_ms']:.1f}x | cost savings={(1 - student['monthly_cost'] / teacher['monthly_cost']):.0%}")
print("checks:", results)
print("ready to ship:", all(results.values()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
speedup=4.3x | cost savings=57%
checks: {'accuracy': True, 'critical_error_rate': False, 'latency': True, 'cost': True}
ready to ship: False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/student_release_gate_dark.png" alt="Deployment check compares four student metrics against thresholds: accuracy 0.92 clears 0.90, error rate 0.04 exceeds the 0.02 cap, latency 42 ms clears 60 ms, and monthly cost $18,000 clears $20,000. Three checks pass while critical error rate blocks deployment." />
  <figcaption>The 7B student is 4.3x faster, 57% cheaper, and clears 90% accuracy, yet its 4% critical error rate exceeds the 2% ceiling, holding back deployment until the failure slice is fixed.</figcaption>
</figure>

## When distillation breaks

| Symptom | Likely cause | Fix |
|---|---|---|
| Higher temperature stops helping held-out scores | Scaled KL approaches centered-logit matching; over-softening blurs useful peaks | Tune $T$ and $\alpha$ on held-out tasks rather than watching training loss |
| Strong training scores, weak held-out performance | Narrow prompt coverage, memorization, or teacher errors in targets | Inspect failure slices, broaden prompts, and filter teacher outputs |
| Student predicts current token instead of next token | Missing one-token shift on hard labels | Pair logits at $t$ with hard labels at $t + 1$; keep teacher/student logits at the same $t$ |
| Student repeats teacher mistakes | Unfiltered wrong answers in SFT or high $\alpha$ in logit KD | Inspect training targets, add programmatic verification, or lower $\alpha$ |
| KL loss runs cleanly but output is gibberish | Teacher and student token-to-ID mappings disagree | Compare full token dictionaries, or switch to response distillation |
| Small student fails long-context or hard reasoning slices | Insufficient student capacity or context length | Narrow scope, increase student size, or use on-policy distillation |
| Offline eval looks great, production fails | Eval leakage, decoding mismatch, or prompt-template drift | Decontaminate splits by seed family and replay with exact serving settings |

Hard labels discard the teacher's softened probability ranking, while next-token distillation preserves it only when vocabularies, shifts, and masks align cleanly. When your application needs a single typed choice with calibrated confidence rather than free-form generation, a dedicated decision readout changes the target directly.

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
    "explanation": "The gradients are (p - q)/T = -0.4/3 = -2/15 and T(p - q) = 3 x -0.4 = -1.2. Multiplying by T² = 9 scales the unscaled gradient by 9."
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
    "explanation": "In student ID order, east gets 0.58, north gets 0.27, and west keeps 0.15. The optimizer updates only the student against detached teacher probabilities."
  },
  {
    "question": "A response-only causal example is [BOS, Q1, Q2, A1, A2, PAD], indexed 0 through 5. Only A1 and A2 are answer targets. Which student/teacher logit positions contribute, and where do their hard labels come from?",
    "options": [
      "Compare logits 2,3; use hard labels 3,4.",
      "Compare logits 3,4; use hard labels 3,4.",
      "Compare logits 2,3; use hard labels 2,3.",
      "Compare logits 1,2; use hard labels 3,4."
    ],
    "answer": "Compare logits 2,3; use hard labels 3,4.",
    "explanation": "Positions 2 and 3 predict next tokens A1 and A2 at label indices 3 and 4. Teacher and student logits align at the same prefix positions while hard labels shift left by one."
  },
  {
    "question": "In a distillation dataset, the teacher answers case A with 41 and case B with 17. The reference verifier confirms 41 for A and requires abstention for B. Both examples are unique. Which filtering decision supplies the intended supervised targets?",
    "options": [
      "Keep A's answer and keep B's answer.",
      "Reject A's answer and reject B's answer.",
      "Keep A's answer and reject B's answer.",
      "Reject A's answer and keep B's answer."
    ],
    "answer": "Keep A's answer and reject B's answer.",
    "explanation": "A's answer (41) matches the verified reference, whereas B's answer (17) contradicts the required abstention and would train the student to repeat a teacher error."
  },
  {
    "question": "A student hidden state is [2, 1]. A projection matrix has rows [1, 0], [0, 1], [1, 1], and its detached teacher target is [4, 1, 2]. What is the summed squared feature error?",
    "options": [
      "0",
      "3",
      "5/3",
      "5"
    ],
    "answer": "5",
    "explanation": "The projection produces [2, 1, 3]. Subtracting the teacher target [4, 1, 2] gives errors [-2, 0, 1], whose squared sum is 4 + 0 + 1 = 5."
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
    "explanation": "Positive teacher mass 0.3 meets zero student mass at B, so forward KL diverges to infinity. Reverse KL evaluates only the nonzero student term: 1 x ln(1 / 0.7) = -ln(0.7) ≈ 0.3567."
  },
  {
    "question": "A student generates the prefix 'unless the cache is flushed', absent from fixed teacher-written answers. A run can score one new prefix. Which supervision addresses this visited-state gap?",
    "options": [
      "Score a familiar teacher prefix, then attach its distribution to the student prefix.",
      "Score the student prefix with the teacher, then match distributions at that same prefix.",
      "Reverse KL on a familiar fixed prefix, then treat the student prefix as already covered.",
      "Add the student text as a verified hard answer, then skip teacher scoring for that prefix."
    ],
    "answer": "Score the student prefix with the teacher, then match distributions at that same prefix.",
    "explanation": "On-policy distillation queries the teacher on the exact prefix the student actually generated. Changing divergence on a fixed teacher prefix does not cover unseen student states."
  },
  {
    "question": "Teacher probabilities are [0.4, 0.4, 0.2], student probabilities [0.1, 0.1, 0.8]. Both renormalize the first two outcomes before computing KL. Which pair of conclusions follows?",
    "options": [
      "Retained conditional KL is positive; full-vocabulary KL is zero.",
      "Retained conditional KL is zero; full-vocabulary KL is zero.",
      "Retained conditional KL is zero; full-vocabulary KL is positive.",
      "Retained conditional KL is positive; full-vocabulary KL is positive."
    ],
    "answer": "Retained conditional KL is zero; full-vocabulary KL is positive.",
    "explanation": "Both renormalized top-two distributions become [0.5, 0.5], giving 0.0 conditional KL while hiding the massive tail divergence (full forward KL ≈ 0.8318)."
  },
  {
    "question": "Deployment requires accuracy ≥ 0.90, critical error rate ≤ 0.01, latency ≤ 60 ms, and cost ≤ 20,000 units. Candidate A has 0.93, 0.01, 70 ms, 18,000; candidate B has 0.89, 0.00, 50 ms, 19,000. Which candidates pass all required thresholds?",
    "options": [
      "Accept A; reject B.",
      "Reject A; accept B.",
      "Accept A; accept B.",
      "Reject A; reject B."
    ],
    "answer": "Reject A; reject B.",
    "explanation": "Candidate A exceeds the 60 ms latency limit (70 ms) and candidate B misses the 0.90 accuracy floor (0.89). Every required threshold must pass simultaneously."
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
    "explanation": "Total token loss is 2 x 0.1 + 4 x 0.7 = 3.0 across 6 valid tokens, giving a global token mean of 0.5. Averaging the two microbatch means (0.4) overweights the shorter batch."
  }
]
```

> **Next:** Continue to [Decision Models: Jev and Kev](/learn/decision-models-jev-kev). Distillation trains a student from teacher signal. The next lesson changes the target to a bounded decision and asks how labels, a readout head, and held-out calibration turn that target into useful software behavior.
