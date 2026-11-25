---
{
  "id": "softmax-cross-entropy-optimization",
  "title": "Softmax, Cross-Entropy & Optimization",
  "slug": "softmax-cross-entropy-optimization",
  "section": "Deep Learning Foundations",
  "category": "NLP Fundamentals",
  "difficulty": "Easy",
  "order": 3,
  "coverImage": "illustrations/_generated/softmax_logits_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic"
  ],
  "shortDescription": "Turn raw class scores into stable probabilities and a useful learning signal, then apply the same loss to next-token predictions.",
  "keyConceptsTested": [
    "Logits as raw scores for competing classes or tokens",
    "Numerically stable softmax and log-sum-exp",
    "Cross-entropy as negative log probability of the target",
    "Entropy, cross-entropy, and KL divergence as separate quantities",
    "Softmax cross-entropy gradient p minus y",
    "Why PyTorch cross-entropy receives logits",
    "Label smoothing and finite optimal logit gaps",
    "Averaging loss across supervised token positions"
  ]
}
---

A review classifier reads `"This docs page is stale"` and outputs raw scores `bug = 3.0`, `docs = 1.0`, `security = 0.0`. It picked the wrong label by a wide margin. Grading only right versus wrong treats a confident blunder (`11%` on `docs`) the same as a narrow miss (`49%`). How do we turn raw scores into probabilities, penalize confident mistakes steeply, and send back a clean gradient?

In the [previous lesson](/learn/calculus-gradients-backpropagation-optimization), half squared error nudged a scalar prediction up or down. Here we build the multiclass core behind every classifier and language model: **softmax** turns raw scores into competing probabilities, **cross-entropy** prices missed confidence in nats, and their combined gradient collapses to $p - y$.

## A decision begins as three raw scores

The final linear layer emits one unconstrained real score per class, called **<span data-glossary="logits">logits</span>**:

| Label | Logit $z_i$ | Weight $e^{z_i}$ | Probability $p_i$ |
|---|---:|---:|---:|
| `bug` | `3.0` | `20.086` | `0.844` |
| `docs` (target) | `1.0` | `2.718` | `0.114` |
| `security` | `0.0` | `1.000` | `0.042` |
| **Total** | | **`23.804`** | **`1.000`** |

Raw logits rank classes, yet they can be negative or sum to anything. **<span data-glossary="softmax">Softmax</span>** converts any vector $z \in \mathbb{R}^K$ into probabilities in $[0, 1]$ summing to `1.0` by exponentiating each score (turning a `+2.0` lead into $e^{2.0} \approx 7.389\times$) and dividing by the sum:

$$
p_i = \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}}
$$

The model puts `84.4%` mass on `bug` and only `11.4%` on `docs`.

<figure>
  <img src="illustrations/_generated/softmax_logits_dark.png" alt="Softmax stabilization: logits [3.0, 1.0, 0.0] shift by max 3.0 to [0.0, -2.0, -3.0], exponentiate to [1.000, 0.135, 0.050], and normalize to 84.4% bug, 11.4% docs, 4.2% security." />
  <figcaption>Subtracting peak logit 3.0 caps every exponential at 1.0 to avoid overflow while preserving the exact probabilities.</figcaption>
</figure>

## Stable arithmetic prevents floating-point overflow

If a deep layer emits `[1000.0, 998.0, 997.0]`, naive `exp(z)` overflows past $z \approx 88.72$ in `float32` and $z \approx 11.09$ in `float16` (**bfloat16** keeps `float32`'s wide exponent range).[^googleBfloat162026] Once weights hit `+inf`, `inf / inf` produces `NaN` and poisons gradients.

Softmax is **shift-invariant**:[^goodfellow2016] subtracting any constant $c$ from every logit cancels identically:

$$
\frac{e^{z_i - c}}{\sum_{j=1}^K e^{z_j - c}} = \frac{e^{z_i} e^{-c}}{e^{-c} \sum_{j=1}^K e^{z_j}} = \frac{e^{z_i}}{\sum_{j=1}^K e^{z_j}}
$$

Choosing $c = m = \max_j z_j$ makes every shifted logit nonpositive ($z_j - m \le 0$), capping the largest exponential at $e^0 = 1.0$ (masked entries may hold `-inf` if at least one candidate stays finite). For inference-time temperature scaling ($z_i / T$, subtracting $m$ before dividing by $T$) and sampling strategies, see [Decoding Strategies: Greedy to Nucleus](/learn/decoding-strategies-greedy-beam-nucleus).

```checkpoint
Why does subtracting `1200` from logits `[1200, 1199, 1197]` preserve the exact softmax probabilities?
---
It multiplies every exponential by $e^{-1200}$, which cancels between numerator and denominator, leaving shifted logits `[0, -1, -3]` capped at `exp(0) = 1.0`.
```

## Cross-entropy prices missed predictions through surprise

**<span data-glossary="cross-entropy">Cross-entropy</span>** scores how surprised the model is by the true label. An event of probability $p$ carries **surprise** $-\ln(p)$ in **nats**: $p = 1.0$ yields zero surprise, while $p = 0.001$ yields `6.91` nats. Given a one-hot target <span data-glossary="vector">vector</span> $y$ ($y_c = 1$ for true class $c$, $0$ elsewhere), expected surprise collapses to **Negative Log-Likelihood (NLL)**:

$$
L_{\text{CE}} = -\sum_{k=1}^K y_k \log(p_k) = -\log(p_c)
$$

For `docs` ($p_{\text{docs}} \approx 0.114$), $L = -\ln(0.1142) \approx 2.170$ nats; raising $p_{\text{docs}}$ to `0.844` drops loss to `0.170` nats.

### The log-sum-exp formulation prevents underflow crashes

Never compute `log(softmax(z))` in two steps. On `[1000.0, 0.0, -1.0]` with target `docs` ($c = 1$), `exp(-1000)` underflows to `0.0` and `log(0.0)` explodes to `-inf` even though the true loss is `1000.0`. Evaluate $-\log(p_c)$ directly in log space via shifted **<span data-glossary="log-sum-exp">log-sum-exp</span>**:[^goodfellow2016]

$$
L = \log\left(\sum_{j=1}^K e^{z_j}\right) - z_c = (m - z_c) + \log\left(\sum_{j=1}^K e^{z_j - m}\right)
$$

Grouping $(m - z_c)$ first prevents cancellation and avoids `log(0)`. Test stable softmax and log-sum-exp loss across ordinary and extreme logits:

<!-- leetllm: test, output=show -->
```python title="stable-softmax-and-loss.py"
import math

def stable_softmax(logits: list[float]) -> list[float]:
    peak = max(logits)
    weights = [math.exp(z - peak) for z in logits]
    total = sum(weights)
    return [w / total for w in weights]

def cross_entropy_from_logits(logits: list[float], target_idx: int) -> float:
    peak = max(logits)
    return (peak - logits[target_idx]) + math.log(sum(math.exp(z - peak) for z in logits))

ordinary = [3.0, 1.0, 0.0]
shifted = [z + 1000.0 for z in ordinary]

print("probs (ordinary):", [round(p, 3) for p in stable_softmax(ordinary)])
print("probs (+1000):   ", [round(p, 3) for p in stable_softmax(shifted)])
print("loss (ordinary): ", round(cross_entropy_from_logits(ordinary, 1), 3))
print("loss (+1000):    ", round(cross_entropy_from_logits(shifted, 1), 3))
print("extreme target:  ", cross_entropy_from_logits([1000.0, 0.0, -1.0], 1))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
probs (ordinary): [0.844, 0.114, 0.042]
probs (+1000):    [0.844, 0.114, 0.042]
loss (ordinary):  2.17
loss (+1000):     2.17
extreme target:   1000.0
```
<!-- leetllm: output:end -->

### Entropy is reference uncertainty and KL divergence is prediction error

Keep three logarithmic quantities distinct (using $0\log 0 = 0$):
- **<span data-glossary="entropy">Entropy</span>** $H(P) = -\sum_k P(k)\log P(k)$ measures uncertainty inside target distribution $P$.
- **Cross-entropy** $H(P, Q) = -\sum_k P(k)\log Q(k)$ measures total coding cost under model distribution $Q$.
- **<span data-glossary="kl-divergence">KL divergence</span>** $D_{\text{KL}}(P \parallel Q)$ measures the extra cost from mismatch between $Q$ and $P$:

$$
H(P, Q) = H(P) + D_{\text{KL}}(P \parallel Q)
$$

For one-hot $P = [0, 1, 0]$, $H(P) = 0$, so all `2.170` nats are model mismatch. For soft target $P = [0.5, 0.5, 0]$ (from annotator disagreement, distillation, or label smoothing), $H(P) = \ln(2) \approx 0.693$: even an exact match ($Q = P$) reports `0.693` cross-entropy with $D_{\text{KL}} = 0$.

> **Key insight:** $H(P, Q) = H(P) + D_{\text{KL}}(P \parallel Q)$. A nonzero loss floor on soft targets reflects target entropy $H(P)$, not remaining model error.

## The combined gradient reveals a clean error signal

Differentiating softmax alone involves a coupled Jacobian, yet combining softmax with cross-entropy cancels the log and exponential cleanly.[^goodfellow2016] Differentiating $L = \log(\sum_j e^{z_j}) - z_c$ with respect to $z_k$:

$$
\frac{\partial}{\partial z_k} \log\left(\sum_{j=1}^K e^{z_j}\right) = \frac{e^{z_k}}{\sum_{j=1}^K e^{z_j}} = p_k
$$

Since $\frac{\partial z_c}{\partial z_k} = y_k$, subtracting the two pieces yields $\nabla_z L = p - y$ (valid for any normalized soft target $y$):

| Label | Predicted $p_k$ | Target $y_k$ | Gradient $p_k - y_k$ | Update $-\eta(p_k - y_k)$ |
|---|---:|---:|---:|---|
| `bug` | `0.844` | `0` | `+0.844` | Lowers wrong favorite |
| `docs` | `0.114` | `1` | `-0.886` | Raises true target |
| `security` | `0.042` | `0` | `+0.042` | Lowers competitor |

Every logit gradient vector is **zero-sum**: $\sum_k (p_k - y_k) = 1 - 1 = 0$, so the upward pull on `docs` (`-0.886`) exactly balances the downward push on `bug` and `security` (`+0.886`).

<figure>
  <img src="illustrations/_generated/cross_entropy_gradient_signal_dark.png" alt="Number lines join target y to prediction p, labeling gradient p minus y: bug +0.844, docs -0.886, security +0.042." />
  <figcaption>Each segment joins target y to prediction p; subtracting η times (p - y) raises docs and lowers competitors in a zero-sum balance.</figcaption>
</figure>

### Why squared probability error stalls on confident mistakes

Applying squared error to probabilities, $L_{\text{sq}} = \frac{1}{2}\sum_k (p_k - y_k)^2$ (scaled Brier loss),[^gneiting2007ScoringRules] lacks cross-entropy's $-\frac{y_i}{p_i}$ factor that cancels $p_i$ in the softmax Jacobian $\frac{\partial p_i}{\partial z_j} = p_i(\delta_{ij} - p_j)$. On a confident blunder (`logits = [8.0, 0.0, 0.0]`, $p_{\text{docs}} \approx 0.0003$), that Jacobian collapses squared-error gradients while cross-entropy stays near `-1.0`:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="cross-entropy-gradient-and-mse.py"
import numpy as np

def softmax(z: np.ndarray) -> np.ndarray:
    e = np.exp(z - np.max(z))
    return e / np.sum(e)

def ce_loss(z: np.ndarray, target_idx: int) -> float:
    m = np.max(z)
    return float((m - z[target_idx]) + np.log(np.sum(np.exp(z - m))))

logits = np.array([3.0, 1.0, 0.0])
target = np.array([0.0, 1.0, 0.0])
probs = softmax(logits)
grad = probs - target
after = logits - 0.5 * grad
print("gradient:     ", np.round(grad, 3).tolist())
print("docs prob:    ", f"{probs[1]:.3f} -> {softmax(after)[1]:.3f} | loss: {ce_loss(logits, 1):.3f} -> {ce_loss(after, 1):.3f}")

wrong = np.array([8.0, 0.0, 0.0])
pw = softmax(wrong)
jac = np.diag(pw) - np.outer(pw, pw)
print("confident CE: ", np.round(pw - target, 4).tolist())
print("confident MSE:", np.round(jac @ (pw - target), 4).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
gradient:      [0.844, -0.886, 0.042]
docs prob:     0.114 -> 0.230 | loss: 2.170 -> 1.469
confident CE:  [0.9993, -0.9997, 0.0003]
confident MSE: [0.001, -0.0007, -0.0003]
```
<!-- leetllm: output:end -->

The target gradient differs by more than three orders of magnitude (`-0.9997` versus `-0.0007`), letting cross-entropy escape confident mistakes immediately.

## PyTorch expects raw logits, and label smoothing caps margins

PyTorch's `nn.CrossEntropyLoss` expects **raw unnormalized logits**, fusing `log_softmax` with `NLLLoss`.[^pytorchCrossEntropy2026][^pytorchCrossEntropyImplementation2026] Putting `nn.Softmax()` before `nn.CrossEntropyLoss` normalizes twice, crushing gradients with zero shape warning.

With one-hot targets, minimizing cross-entropy pushes $z_c - z_k \to +\infty$. **Label smoothing** blends the one-hot vector with a uniform prior $\alpha \in (0, 1)$: $\tilde{y}_k = (1 - \alpha)y_k + \frac{\alpha}{K}$.[^szegedy2016LabelSmoothing] For $K = 3$ and $\alpha = 0.1$, $\tilde{y} = [0.033, 0.933, 0.033]$, giving a finite optimum at $z_{\text{docs}} - z_{\text{competitor}} = \ln(28) \approx 3.332$ (smoothing a teacher can still hurt distillation).[^muller2019LabelSmoothing]

<!-- leetllm: test, deps=torch, output=show -->
```python title="pytorch-cross-entropy-pitfall.py"
import torch
from torch import nn

target = torch.tensor([1])
raw = torch.tensor([[3.0, 1.0, 0.0]], requires_grad=True)
bad = torch.tensor([[3.0, 1.0, 0.0]], requires_grad=True)
smooth = torch.tensor([[3.0, 1.0, 0.0]], requires_grad=True)

raw_loss = nn.CrossEntropyLoss()(raw, target); raw_loss.backward()
bad_loss = nn.CrossEntropyLoss()(torch.softmax(bad, dim=1), target); bad_loss.backward()
smooth_loss = nn.CrossEntropyLoss(label_smoothing=0.1)(smooth, target); smooth_loss.backward()

print("raw logits:    loss =", round(raw_loss.item(), 3), "docs grad =", round(raw.grad[0, 1].item(), 3))
print("double softmax:loss =", round(bad_loss.item(), 3), "docs grad =", round(bad.grad[0, 1].item(), 3))
print("smoothed 0.1:  loss =", round(smooth_loss.item(), 3), "grad =", [round(x, 3) for x in smooth.grad[0].tolist()])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw logits:    loss = 2.17 docs grad = -0.886
double softmax:loss = 1.387 docs grad = -0.127
smoothed 0.1:  loss = 2.137 grad = [0.81, -0.819, 0.009]
```
<!-- leetllm: output:end -->

> **Common mistake:** Ending a classifier with `nn.Softmax()` before `nn.CrossEntropyLoss`. Here the `docs` gradient collapses from `-0.886` to `-0.127` silently.

## Next-token prediction extends the loss across sequences

Autoregressive language models run this exact loss at every sequence position, scoring observed next token $x_{t+1}$ from vocabulary logits $z_t \in \mathbb{R}^{|V|}$:

$$
L_{\text{seq}} = -\frac{1}{S} \sum_{t=1}^S \log P(x_{t+1} \mid x_1, \dots, x_t)
$$

On sequence `bug docs today` over vocabulary `["bug", "docs", "today"]`, inputs `[bug, docs]` align with targets `[docs, today]`: position 1 gives `docs` probability `0.114` ($L_1 = 2.170$), position 2 gives `today` probability `0.736` ($L_2 = 0.306$), and mean loss is `1.238` nats (`docs` drives `87.6%` of total loss).

<figure>
  <img src="illustrations/_generated/cross_entropy_batch_loss_dark.png" alt="Negative log loss curve showing L=2.170 for missed docs (p=0.114) versus L=0.306 for today (p=0.736), averaging 1.238 nats." />
  <figcaption>Negative log penalty rises steeply near zero: missed docs contributes 2.170 of 2.476 total loss (87.6%), averaging 1.238 nats across both positions.</figcaption>
</figure>

### Tensor shapes, vocabulary memory, and masked targets

A language model emits logits `[B, S, V]` and targets `[B, S]`. PyTorch expects classes on dimension 1, so either pass `logits.transpose(1, 2)` (`[B, V, S]`) or flatten to `[B * S, V]` and `[B * S]`. At LLM scale ($B=16$, $S=4096$, $V=128{,}256$), `float32` logits alone take **33.62 GB (31.31 GiB)**; fused kernels like **Cut Cross-Entropy** tile projection and log-sum-exp so full logits never materialize in GPU memory.[^wijmans2025CutCrossEntropy]

Mark padding or prompt targets with `ignore_index=-100` to exclude them from both sum and mean denominator.[^pytorchCrossEntropy2026] Remember that `ignore_index` skips *target positions*, never removing a vocabulary class from other positions' softmax denominators; and with class weights, integer targets divide `reduction="mean"` by the *sum of target class weights* whereas float probability targets divide by *position count*.[^pytorchCrossEntropy2026]

<!-- leetllm: test, deps=torch, output=show -->
```python title="sequence-masked-loss.py"
import torch
from torch.nn import functional as F

logits = torch.tensor([[[3.0, 1.0, 0.0], [0.5, 0.0, 2.0], [100.0, -100.0, 0.0]]], requires_grad=True)
targets = torch.tensor([[1, 2, -100]], dtype=torch.long)

valid = int((targets != -100).sum().item())
assert valid > 0
per_pos = F.cross_entropy(logits.transpose(1, 2), targets, ignore_index=-100, reduction="none")
flat_mean = F.cross_entropy(logits.reshape(-1, 3), targets.reshape(-1), ignore_index=-100)
flat_mean.backward()

print("supervised:", valid, "| per-pos:", [round(x, 3) for x in per_pos[0].tolist()])
print("masked mean:", round(flat_mean.item(), 3), "| ignored grad:", logits.grad[0, 2].tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
supervised: 2 | per-pos: [2.17, 0.306, 0.0]
masked mean: 1.238 | ignored grad: [0.0, 0.0, 0.0]
```
<!-- leetllm: output:end -->

Check whether your model wrapper shifts next-token labels internally before shifting them yourself.

```checkpoint
For logits `[3, 7, 11]` (batch, sequence, vocab) and targets `[3, 7]`, which two layouts satisfy PyTorch `CrossEntropyLoss`?
---
Transpose to `[3, 11, 7]` with targets `[3, 7]`, or flatten to `[21, 11]` and `[21]`.
```

## Diagnostic failure modes

| Symptom | Probable cause | Fix |
|---|---|---|
| `NaN` loss or `OverflowError` | Exponentiating raw logits without max shift | Subtract $m = \max(z)$ before `exp` |
| `+inf` loss on early steps | `log(softmax(z))` underflowing to `log(0)` | Use fused log-sum-exp (`nn.CrossEntropyLoss`) |
| Plausible loss, stalled training | `nn.Softmax()` placed before `nn.CrossEntropyLoss` | Pass raw logits directly |
| Confident errors barely move | Squared probability error instead of cross-entropy | Switch to cross-entropy for $\pm 1$ error signal |
| `NaN` mean on finite logits | Every target in the batch is ignored | Skip batches with zero supervised targets |

Mental check: switching the target on `[3.0, 1.0, 0.0]` to `security` ($p = 0.042$) leaves probabilities unchanged, raises loss to `3.170` nats, and sets gradient to `[+0.844, +0.114, -0.958]`.

```mastery-quiz
[
  {
    "question": "A classifier predicts p = [0.60, 0.25, 0.15] with middle class as target. Subtracting 0.2(p - y) directly from logits produces which changes?",
    "options": [
      "[+0.12, -0.15, +0.03]; target falls, zero-sum.",
      "[0.00, +0.15, 0.00]; target rises, competitors fixed.",
      "[-0.12, -0.05, -0.03]; all logits fall by predicted share.",
      "[-0.12, +0.15, -0.03]; target rises, zero-sum."
    ],
    "answer": "[-0.12, +0.15, -0.03]; target rises, zero-sum.",
    "explanation": "With y = [0, 1, 0], p - y = [0.60, -0.75, 0.15]. Multiplying by -0.2 gives [-0.12, +0.15, -0.03], raising the target and lowering rivals in zero-sum balance."
  },
  {
    "question": "A developer inserts nn.Softmax(dim=-1) right before nn.CrossEntropyLoss on raw logits [2, -1, 0] with class target 1. What happens?",
    "options": [
      "CrossEntropyLoss detects probabilities and skips internal softmax.",
      "CrossEntropyLoss normalizes a second time, silently distorting loss and gradients.",
      "PyTorch raises ValueError because inputs already sum to 1.",
      "Loss stays identical while backward divides gradients by batch size."
    ],
    "answer": "CrossEntropyLoss normalizes a second time, silently distorting loss and gradients.",
    "explanation": "nn.CrossEntropyLoss expects raw logits and fuses log_softmax with NLLLoss, so pre-applying softmax compresses scores and shrinks gradients without any shape error."
  },
  {
    "question": "Row A has logits [900, 0, -2] with target 1; Row B masks every candidate to -infinity. Which log-sum-exp diagnosis is accurate?",
    "options": [
      "Row A loss is ~900; Row B is invalid with no finite candidate.",
      "Row A loss is 0; Row B yields a uniform 1/3 distribution.",
      "Row A loss is +infinity; Row B loss is 0.",
      "Row A loss is ~900; Row B yields a uniform 1/3 distribution."
    ],
    "answer": "Row A loss is ~900; Row B is invalid with no finite candidate.",
    "explanation": "Shifted log-sum-exp computes (900 - 0) + log(1 + exp(-900) + exp(-902)) ≈ 900 cleanly. All -infinity logits yield NaN because no valid distribution exists."
  },
  {
    "question": "Model Q matches soft target P = [0.25, 0.75, 0] exactly. Using natural logs and 0 log 0 = 0, what are H(P, Q) and D_KL(P || Q)?",
    "options": [
      "H(P, Q) = 0.000 nats; D_KL = 0.000 nats.",
      "H(P, Q) = 0.562 nats; D_KL = 0.562 nats.",
      "H(P, Q) = 0.562 nats; D_KL = 0.000 nats.",
      "H(P, Q) = +infinity; D_KL = +infinity."
    ],
    "answer": "H(P, Q) = 0.562 nats; D_KL = 0.000 nats.",
    "explanation": "Target entropy is -0.25 ln(0.25) - 0.75 ln(0.75) ≈ 0.562 nats. Matching Q = P makes D_KL = 0 while cross-entropy stays at H(P) = 0.562."
  },
  {
    "question": "Two supervised positions have target probabilities 0.20 and 0.80, and a third has target -100 under ignore_index=-100. What is the mean loss, and does ignore_index remove a class from other positions' softmax?",
    "options": [
      "0.611 nats; yes, it removes that class from every softmax.",
      "0.916 nats; no, ignore_index skips target positions only.",
      "0.916 nats; yes, it sets that class logit to -infinity.",
      "1.833 nats; no, ignore_index skips target positions only."
    ],
    "answer": "0.916 nats; no, ignore_index skips target positions only.",
    "explanation": "(-ln 0.20 - ln 0.80) / 2 ≈ 0.916 nats while the ignored position contributes neither loss nor count. ignore_index filters target positions, not candidate classes."
  }
]
```

> **Next:** Continue to [Adam, Momentum, Schedulers](/learn/optimization-algorithms-adam-schedulers).
