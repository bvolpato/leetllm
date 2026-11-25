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
  "shortDescription": "Distill a 70B teacher into a fast 7B student using softened token probabilities, filtered reasoning traces, and student-sampled supervision, while avoiding tokenizer mismatches and silent tail errors.",
  "keyConceptsTested": [
    "Teacher-student framework",
    "Soft label distillation",
    "Feature-based vs response-based distillation",
    "Forward vs reverse KL",
    "Student-sampled vs offline distillation",
    "Student capacity limits",
    "KL Divergence",
    "Temperature Hyperparameter",
    "Tokenizer and vocabulary alignment",
    "Next-token label shifting",
    "Synthetic Data Generation",
    "Teacher-output validation",
    "Multi-metric deployment evaluation"
  ],
  "section": "Training, Fine-Tuning & Alignment",
  "order": 21,
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

<span data-glossary="teacher-student-distillation">Knowledge distillation</span> closes that gap by training a compact **student** directly from the behavior of a stronger **teacher**. With white-box access, the student matches softened next-<span data-glossary="token">token</span> probabilities or intermediate hidden states. With black-box text-only access, it fine-tunes on verified teacher answers and reasoning traces.

## Soft labels and dark knowledge

Hinton et al. showed that a teacher's full probability distribution carries far more supervision than a one-hot target.[^hinton2015] Consider a four-token vocabulary for a cache-retention prompt: `7d`, `3d`, `30d`, and `never`. A hard label puts `1.00` on `7d` and `0.00` everywhere else, telling the student *which* token wins while erasing *how close* the runners-up were.

The teacher's non-target probabilities preserve that similarity structure. Giving `3d` far more mass than `30d` or `never` teaches the student that shorter TTL windows lie much closer to `7d` than disabling caching altogether. Hinton et al. called this relative structure **dark knowledge**.

<figure>
  <img src="illustrations/_generated/soft_labels_dark_knowledge_dark.png" alt="Three aligned probability tracks compare a trusted one-hot target with the teacher at T=1 and T=4 for 7d, 3d, 30d, and never. The top two answers stay in the same order while the 7d-minus-3d gap narrows from 1.000 to approximately 0.708 to approximately 0.156. Probability labels show four decimal places. The logits are a constructed example; T²=16 at T=4 is an approximate high-temperature gradient compensation." />
  <figcaption>Raising temperature flattens the teacher's peak while preserving the rank order across alternatives (7d > 3d > 30d > never), making near-miss probabilities visible to the student.</figcaption>
</figure>

Dividing raw <span data-glossary="logits">logits</span> by a <span data-glossary="temperature">temperature</span> $T > 1$ before softmax lifts those runner-up probabilities without altering rank order. When ground-truth labels are also present, training blends soft distillation loss with standard $T = 1$ task cross-entropy:

$$
\mathcal{L} = \alpha \cdot \mathcal{L}_{\text{distill}} + (1 - \alpha) \cdot \mathcal{L}_{\text{task}}
$$

At scale, next-token distillation pays off sharply. In the Gemma 2 technical report, a 2B student trained for 500B tokens via logit distillation from a 7B teacher reached `67.7` on their three-benchmark average, compared with `60.3` trained from scratch on the same token budget.[^gemma2team2024]

## Logit distillation and temperature scaling

In white-box causal language models, **logit distillation** minimizes <span data-glossary="kl-divergence">KL divergence</span> between the frozen teacher's and student's softened next-token distributions at every supervised prefix position:

$$
q_i = \frac{\exp(z_{t,i} / T)}{\sum_j \exp(z_{t,j} / T)},
\qquad
p_i = \frac{\exp(z_{s,i} / T)}{\sum_j \exp(z_{s,j} / T)},
\qquad
\mathcal{L}_{\text{KL}} = T^2 \sum_i q_i \log \frac{q_i}{p_i}
$$

Why multiply by $T^2$? Differentiating the unscaled soft cross-entropy $-\sum_i q_i \log p_i$ with respect to student logit $z_{s,i}$ yields $\frac{1}{T}(p_i - q_i)$. Because large $T$ also shrinks $(p_i - q_i)$ roughly as $1/T$, the unscaled gradient decays like $1/T^2$, drowning out the distillation term relative to the $T = 1$ hard loss.[^hinton2015] Multiplying by $T^2$ restores the gradient to $T(p_i - q_i)$, which converges to centered-logit MSE matching as $T \to \infty$.

Verify both temperature softening and $T^2$ gradient preservation directly in PyTorch:

<!-- leetllm: test, deps=torch, output=show, output_title="Temperature softening and gradient check" -->
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
    gap = (scaled_grad - high_temp_limit).norm()
    top_gap = float(q_log.exp()[0] - q_log.exp()[1])
    print(f"T={T:5g} | top_gap={top_gap:.3f} | raw_norm={raw_grad.norm():.6f} | scaled_norm={scaled_grad.norm():.6f} | dist_to_limit={gap:.6f}")
```

<!-- leetllm: output:start -->
```text title="Temperature softening and gradient check" output compact
T=    1 | top_gap=0.708 | raw_norm=0.434065 | scaled_norm=0.434065 | dist_to_limit=0.156800
T=    4 | top_gap=0.156 | raw_norm=0.030553 | scaled_norm=0.488844 | dist_to_limit=0.080567
T=   40 | top_gap=0.013 | raw_norm=0.000272 | scaled_norm=0.435812 | dist_to_limit=0.008958
T=  400 | top_gap=0.001 | raw_norm=0.000003 | scaled_norm=0.429383 | dist_to_limit=0.000901
```
<!-- leetllm: output:end -->

### Causal alignment and vocabulary identity

Two silent alignment bugs ruin autoregressive logit distillation:

1. **One-step label shift:** Logits at prefix position $t$ predict the hard token at $t + 1$. Shift hard labels left (`labels[1:]`), while keeping teacher and student logits aligned at the **same** position $t$ (`logits[:-1]`).
2. **Exact token-to-ID mapping:** Equal `vocab_size` is insufficient. If token ID `17` means `return` in the teacher and `<pad>` in the student, KL training runs without errors while driving the student toward gibberish.

<figure>
  <img src="illustrations/_generated/causal_logit_alignment_dark.png" alt="Four positions show teacher and student vectors of four logits aligned at the same t. The target token IDs are [0, 0, 1, -100]; shifting labels left pairs logits t0 with label[1]=0 (7d), t1 with label[2]=1 (3d), and t2 with label[3]=-100 (ignored by both KL and hard loss). The final t3 logits have no next label." />
  <figcaption>Teacher and student logits align at the same prefix position t, while hard labels shift left by one step. Positions whose next label is -100 are masked out of both the KL and cross-entropy losses.</figcaption>
</figure>

> **Common mistake:** Checking only `student.vocab_size == teacher.vocab_size`. Always compare full token-to-ID dictionaries and chat templates; if tokenizers differ, switch to sequence-level response distillation or explicit cross-tokenizer alignment.

## Forward versus reverse KL

Because KL divergence is asymmetric, choosing which distribution sits on the left dictates how a capacity-limited student allocates probability mass:

$$
D_{\mathrm{KL}}(P_{\text{teacher}} \parallel P_{\text{student}}) = \sum_{x} P_{\text{teacher}}(x) \log \frac{P_{\text{teacher}}(x)}{P_{\text{student}}(x)}
$$

$$
D_{\mathrm{KL}}(P_{\text{student}} \parallel P_{\text{teacher}}) = \sum_{x} P_{\text{student}}(x) \log \frac{P_{\text{student}}(x)}{P_{\text{teacher}}(x)}
$$

- **Forward KL (mode-covering):** Putting $P_s(x) \to 0$ anywhere $P_t(x) > 0$ drives the penalty to $+\infty$. A smaller student stretches mass across *all* teacher modes, sometimes spilling probability into low-quality valleys between them.
- **Reverse KL (mode-seeking):** Putting $P_s(x) > 0$ where $P_t(x) \to 0$ blows up the loss, whereas dropping an entire teacher mode pays only a finite cost (covering one of two equal `0.5` modes gives $\log 2 \approx 0.693$). The student concentrates sharply on high-probability teacher modes, boosting precision at the cost of diversity.

Neither direction wins everywhere. **MiniLLM** optimizes sequence-level reverse KL via policy gradients with teacher-mixed sampling and length normalization to prevent repetition collapse.[^gu2024] **Generalized Knowledge Distillation (GKD)** decouples divergence from sampling and finds generalized Jensen-Shannon divergence beats both KL directions on smaller translation students, while forward KL wins its headline GSM8K run.[^agarwal2024]

By the chain rule of KL divergence, a full-sequence KL decomposes into next-token KL terms weighted by prefixes drawn from the **left** distribution. Watch both the chain-rule identity and the asymmetry on tail leaks:

<figure>
  <img src="illustrations/_generated/kl_direction_dark.png" alt="Two scenarios compare teacher probabilities 0.58, 0.40, 0.02 against student distributions 0.54, 0.36, 0.10 and 0.40, 0.35, 0.25 for 7d, 3d, and never. All six tracks share a probability axis from zero to 0.60. The extra student mass on never is 0.08 and 0.23. Their forward and reverse KL results are 0.051 and 0.084, then 0.218 and 0.436." />
  <figcaption>As the student shifts mass onto the teacher's low-probability token (never), reverse KL climbs roughly twice as fast as forward KL (0.436 vs 0.218).</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="kl-direction-and-sequence-chain.py"
import math

def kl(left: list[float], right: list[float]) -> float:
    total = 0.0
    for p, q in zip(left, right):
        if p == 0.0:
            continue
        if q == 0.0:
            return math.inf
        total += p * math.log(p / q)
    return total

# 1. Tail leak asymmetry on (7d, 3d, never)
teacher = [0.58, 0.40, 0.02]
for name, student in [("mild_leak", [0.54, 0.36, 0.10]), ("heavy_leak", [0.40, 0.35, 0.25])]:
    print(f"{name:10s} | forward KL={kl(teacher, student):.3f} | reverse KL={kl(student, teacher):.3f}")
print(f"drop mode  | forward KL={kl([0.5, 0.5], [1.0, 0.0])}   | reverse KL={kl([1.0, 0.0], [0.5, 0.5]):.3f}")

# 2. Sequence KL chain rule weights prefixes by the left distribution
t1, s1 = [0.8, 0.2], [0.5, 0.5]
t2, s2 = [[0.9, 0.1], [0.2, 0.8]], [[0.5, 0.5], [0.4, 0.6]]
t_joint = [t1[i] * t2[i][j] for i in range(2) for j in range(2)]
s_joint = [s1[i] * s2[i][j] for i in range(2) for j in range(2)]
fwd_chain = kl(t1, s1) + sum(t1[i] * kl(t2[i], s2[i]) for i in range(2))
rev_chain = kl(s1, t1) + sum(s1[i] * kl(s2[i], t2[i]) for i in range(2))
print(f"seq forward: joint={kl(t_joint, s_joint):.6f} == teacher-weighted={fwd_chain:.6f}")
print(f"seq reverse: joint={kl(s_joint, t_joint):.6f} == student-weighted={rev_chain:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mild_leak  | forward KL=0.051 | reverse KL=0.084
heavy_leak | forward KL=0.218 | reverse KL=0.436
drop mode  | forward KL=inf   | reverse KL=0.693
seq forward: joint=0.505499 == teacher-weighted=0.505499
seq reverse: joint=0.530881 == student-weighted=0.530881
```
<!-- leetllm: output:end -->

> **Key insight:** Zero KL only confirms the student matched the teacher. If a teacher puts `0.99` on a wrong answer and the student mirrors it, both forward and reverse KL read `0.000`.

## Response distillation and synthetic reasoning traces

When the teacher is behind an API or uses a different tokenizer, **response distillation** (sequence-level KD) fine-tunes the student on verified `(prompt, response)` completions generated by the teacher. It decouples teacher inference from student GPU memory, works across model families, and transfers multi-step reasoning traces that far outpace short final-answer labels.

| Recipe | Teacher signal | Key takeaway |
|---|---|---|
| **Alpaca 7B**[^taori2023] | 52K Self-Instruct pairs | Popularized synthetic SFT distillation (non-commercial license) |
| **Orca 13B**[^mukherjee2023] | Step-by-step explanation traces | Rich rationales outperform terse answer imitation |
| **phi-1.5**[^li2023c] | Synthetic textbook prose + filtered code | High-signal synthetic corpora rival much larger web datasets |
| **Distilling Step-by-Step**[^hsieh2023] | Rationales + task labels | Multi-task supervision cuts labeled data requirements |
| **DeepSeek-R1-Distill**[^deepseekR1Original2025] | ~800K curated reasoning + general traces | Fine-tuned Qwen/Llama students (32B Qwen hit 72.6% AIME 2024 pass@1 and 94.3% MATH-500) |

Standard SFT treats every teacher token as ground truth, so unfiltered errors become training targets. Use a **Seed-Expand-Filter** pipeline: author 100 to 500 seed prompts, split seed families *before* expansion so paraphrases never cross train/eval boundaries, deduplicate prompts before paying for teacher generation, and filter outputs with programmatic verifiers (unit tests, math checkers, schema checks):

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

## Feature alignment and student-sampled supervision

### Feature distillation

With white-box access, **feature distillation** aligns selected student hidden states to corresponding detached teacher layers using a learned linear projection $g_l$ that bridges hidden-dimension differences:

$$
\mathcal{L}_{\text{feature}} = \sum_l \left\| f_{m(l)}^{\text{teacher}} - g_l\!\left(f_l^{\text{student}}\right) \right\|^2
$$

Here $m(l)$ pairs student layer $l$ with a teacher layer (depths need not match), and padding tokens are masked before averaging. Because layer pairing and activation storage add real complexity, benchmark feature matching against plain logit KD on held-out tasks before adopting it.

### Closing exposure bias with student-generated prefixes

Training strictly on fixed teacher completions suffers from **exposure bias**: at inference time the student conditions on its *own* earlier tokens, so a single off-track token shifts it into prefixes absent from the offline dataset.

<span data-glossary="on-policy-distillation">On-policy distillation (OPD)</span> fixes this by sampling live completions from the student and scoring those exact student-generated prefixes with the teacher. In **GKD**, a mixing fraction $\lambda$ blends fixed teacher prefixes with live student generations, and either forward KL, reverse KL, or generalized Jensen-Shannon divergence applies on top.[^agarwal2024] Gemma 2's post-training similarly combines synthetic teacher responses with distillation on the student's own distribution.[^gemma2team2024] Remember that the **sampling source** (fixed dataset vs live student samples) is orthogonal to the **divergence** (forward vs reverse KL).

<figure>
  <img src="illustrations/_generated/prefix_coverage_trace_dark.png" alt="Token prefix matching between teacher demonstrations and student generations. Two reference teacher prefixes and three student rollouts share common initial tokens while branching at later positions. Distinct token paths expand teacher evaluation coverage across four unique candidate prefixes." />
  <figcaption>When the student branches onto tokens absent from fixed teacher data, student-sampled collection scores those visited prefixes directly with the teacher.</figcaption>
</figure>

| Method | Teacher signal | Main advantage | Main constraint |
|---|---|---|---|
| **Response KD** | Verified text traces | Tokenizer-independent; works with API teachers | Unfiltered teacher errors become SFT targets |
| **Logit KD** | Softened token probabilities | Transfers full runner-up ranking | Requires identical token-to-ID vocabulary |
| **Feature KD** | Intermediate hidden states | Supervises internal representations | Extra layer mapping, projections, and memory |
| **Student-sampled KD (OPD)** | Teacher logits on student prefixes | Closes exposure bias directly | Requires online student sampling + teacher scoring |

Production trainers such as Hugging Face TRL's `DistillationTrainer` and experimental `GKDTrainer` implement live student sampling and chunked full-vocabulary generalized Jensen-Shannon losses to avoid materializing giant `[batch, seq, vocab]` tensors (note that chunked trainers reading `lm_head.weight` directly need `modules_to_save=["lm_head"]` rather than LoRA on `lm_head`).[^huggingface2026distillationTrainer][^huggingface2026gkdGuide]

## Practical PyTorch training loop and logit caching

A bug-free PyTorch logit KD loop requires three invariants:

1. **Freeze the teacher:** Set `teacher.requires_grad_(False)` and `teacher.eval()`, and run teacher forward passes under `torch.no_grad()`.
2. **Mask prompt and padding tokens explicitly:** `F.cross_entropy` supports `ignore_index=-100`, whereas `F.kl_div` does not.[^pytorchCrossEntropy2026][^pytorchKlDiv2026] Index both branches with `valid = shifted_labels != -100`.
3. **Flatten valid tokens before `batchmean`:** `F.kl_div(..., reduction="batchmean")` divides by the leading dimension only.[^pytorchKlDiv2026] Flattening to `[num_valid_tokens, vocab]` yields a true per-token mean; leaving `[batch, seq, vocab]` sums across sequence length instead.

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

def kd_loss(student_logits, teacher_logits, labels, vocab_s, vocab_t, temperature=3.0, alpha=0.7):
    if vocab_s != vocab_t:
        raise ValueError("Logit KD requires identical token-to-ID mappings.")
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

vocab = tuple(f"t{i}" for i in range(12))
teacher = TinyLM(12, 16).eval()
teacher.requires_grad_(False)
student = TinyLM(12, 6).train()
optimizer = torch.optim.AdamW(student.parameters(), lr=0.05)

input_ids = torch.tensor([[1, 2, 3, 4, 5], [1, 3, 5, 7, 9]])
labels = input_ids.clone()
labels[:, :2] = -100   # mask prompt tokens
labels[1, -1] = -100   # mask trailing padding token

with torch.no_grad():
    teacher_logits = teacher(input_ids)
teacher_before = teacher.lm_head.weight.clone()

loss_before = kd_loss(student(input_ids), teacher_logits, labels, vocab, vocab)
optimizer.zero_grad()
loss_before.backward()
optimizer.step()
loss_after = kd_loss(student(input_ids), teacher_logits, labels, vocab, vocab)

perturbed = teacher_logits.clone()
perturbed[:, :-1, :][labels[:, 1:] == -100] = 1000.0
loss_perturbed = kd_loss(student(input_ids), perturbed, labels, vocab, vocab)

print(f"loss before -> after : {float(loss_before):.4f} -> {float(loss_after):.4f}")
print(f"teacher frozen       : {bool(torch.equal(teacher.lm_head.weight, teacher_before))}")
print(f"ignored-mask delta   : {abs(float(loss_after - loss_perturbed)):.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
loss before -> after : 1.1329 -> 0.9520
teacher frozen       : True
ignored-mask delta   : 0.000000
```
<!-- leetllm: output:end -->

> **Common mistake:** Calling `optimizer.step()` on an all-masked batch with zero-valued `.grad` tensors. PyTorch's `AdamW` still applies decoupled weight decay whenever `.grad` is non-`None`; skip empty batches completely, and under gradient accumulation weight microbatches by total valid tokens rather than averaging unequal microbatch means.[^pytorchAdamW2026]

### Offline top-k logit caching and the tail illusion

Caching dense bf16 teacher logits over 50M tokens and a 32K vocabulary consumes `2,980.2 GiB`, whereas caching <span data-glossary="top-k">top-k</span> (`k=64`) values plus `int32` token IDs takes `17.9 GiB` (`166.7x` smaller). Never renormalize only the top-$k$ tokens to sum to 1, however: if the teacher puts `[0.60, 0.30, 0.10]` and the student puts `[0.30, 0.15, 0.55]`, both renormalized top-2 distributions become `[2/3, 1/3]`, reporting `0.000` KL while hiding a `0.453` full-vocabulary error where the student dumps 55% mass onto tail junk! Keep an explicit residual tail bucket (`1 - sum(top_k)`) whenever caching top-$k$ logits.

<!-- leetllm: test, output=show -->
```python title="logit-cache-tail-illusion.py"
import math

tokens, vocab_size, top_k, gib = 50_000_000, 32_000, 64, 1024 ** 3
dense_gib = (tokens * vocab_size * 2) / gib
topk_gib = (tokens * top_k * (2 + 4)) / gib
print(f"dense: {dense_gib:.1f} GiB | top-64: {topk_gib:.1f} GiB ({dense_gib / topk_gib:.1f}x smaller)")

teacher, student = [0.60, 0.30, 0.10], [0.30, 0.15, 0.55]
fkl = lambda q, p: sum(qi * math.log(qi / pi) for qi, pi in zip(q, p))
q_top = [v / sum(teacher[:2]) for v in teacher[:2]]
p_top = [v / sum(student[:2]) for v in student[:2]]
print(f"full KL={fkl(teacher, student):.3f} | renormalized top-2 KL={fkl(q_top, p_top):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dense: 2980.2 GiB | top-64: 17.9 GiB (166.7x smaller)
full KL=0.453 | renormalized top-2 KL=0.000
```
<!-- leetllm: output:end -->

## Capacity limits, evaluation, and failure modes

Distillation cannot bypass student parameter capacity, shorter context windows, or missing prompt coverage. Benchmark four checkpoints under identical decoding budgets: the base student, hard-label SFT, the distilled student, and the teacher. Check licensing as well, since teacher API terms and open weights often restrict commercial distillation.[^taori2023]

Ship a distilled student only when it clears *every* target threshold simultaneously: accuracy, critical error rate, latency, and serving cost.

<figure>
  <img src="illustrations/_generated/student_release_gate_dark.png" alt="Deployment check compares four student metrics against thresholds: accuracy 0.92 clears 0.90, error rate 0.04 exceeds the 0.02 cap, latency 42 ms clears 60 ms, and monthly cost $18,000 clears $20,000. Three checks pass while critical error rate blocks deployment." />
  <figcaption>The 7B student is 4.3x faster, 57% cheaper, and clears 90% accuracy, yet its 4% critical error rate exceeds the 2% ceiling, holding back deployment until the failure slice is fixed.</figcaption>
</figure>

| Symptom | Likely cause | Fix |
|---|---|---|
| Higher $T$ stops helping held-out scores | Over-softening blurs informative peaks | Tune $T$ and $\alpha$ on held-out tasks, not training KL |
| Student predicts current token | Missing one-token shift on hard labels | Pair logits at $t$ with hard labels at $t + 1$ |
| KL drops cleanly, outputs are gibberish | Teacher/student token-to-ID mismatch | Verify exact vocabulary equality or use response KD |
| Student repeats teacher hallucinations | Unfiltered SFT errors or excessive $\alpha$ | Filter traces with verifiers and lower $\alpha$ |
| Small student fails hard reasoning slices | Capacity gap or exposure bias | Increase student size, narrow scope, or add OPD |

```mastery-quiz
[
  {
    "question": "At temperature 3, one token has student probability 0.25 and detached teacher probability 0.65. What are the unscaled and T^2-scaled student-logit gradients?",
    "options": [
      "-0.4 and -3.6",
      "-2/15 and -1.2",
      "-1.2 and -2/15",
      "-0.4 and -0.4"
    ],
    "answer": "-2/15 and -1.2",
    "explanation": "Unscaled gradient is (p - q)/T = -0.4/3 = -2/15; T^2-scaled gradient is T(p - q) = 3 x -0.4 = -1.2."
  },
  {
    "question": "A causal sequence is [BOS, Q1, Q2, A1, A2, PAD] (indices 0-5), with only A1 and A2 supervised. Which logit positions compare, and which label indices supply hard targets?",
    "options": [
      "Logits 2, 3; hard labels 3, 4.",
      "Logits 3, 4; hard labels 3, 4.",
      "Logits 2, 3; hard labels 2, 3.",
      "Logits 1, 2; hard labels 3, 4."
    ],
    "answer": "Logits 2, 3; hard labels 3, 4.",
    "explanation": "Prefix logits at positions 2 and 3 predict next tokens A1 and A2 at indices 3 and 4."
  },
  {
    "question": "A teacher puts [0.7, 0.3] on tokens A and B; the student puts [1.0, 0.0]. What are forward KL(teacher||student) and reverse KL(student||teacher)?",
    "options": [
      "Infinity and -ln(0.7).",
      "-ln(0.7) and infinity.",
      "0 and -ln(0.7).",
      "Infinity and 0."
    ],
    "answer": "Infinity and -ln(0.7).",
    "explanation": "Zero student mass on B sends forward KL to infinity, while reverse KL evaluates only A: 1.0 x ln(1 / 0.7) = -ln(0.7)."
  },
  {
    "question": "Teacher probabilities [0.4, 0.4, 0.2] and student probabilities [0.1, 0.1, 0.8] are renormalized over the top two tokens. What do truncated KL and full KL show?",
    "options": [
      "Truncated KL > 0; full KL = 0.",
      "Truncated KL = 0; full KL = 0.",
      "Truncated KL = 0; full KL > 0.",
      "Truncated KL > 0; full KL > 0."
    ],
    "answer": "Truncated KL = 0; full KL > 0.",
    "explanation": "Both renormalized top-two vectors become [0.5, 0.5], reporting 0.0 truncated KL while hiding a large tail error (full KL ≈ 0.832)."
  },
  {
    "question": "A student emits a prefix absent from fixed teacher data. Which update directly fixes this exposure-bias gap?",
    "options": [
      "Reuse a familiar teacher prefix distribution on the student prefix.",
      "Query the teacher on the student-generated prefix and match distributions there.",
      "Switch from forward KL to reverse KL on the fixed teacher dataset.",
      "Fine-tune directly on unverified student text."
    ],
    "answer": "Query the teacher on the student-generated prefix and match distributions there.",
    "explanation": "Student-sampled distillation scores the exact prefix the student visited; changing divergence on offline teacher prefixes never covers unseen student states."
  }
]
```

> **Next:** Continue to [Model Merging and Weight Interpolation](/learn/model-merging-weight-interpolation).
