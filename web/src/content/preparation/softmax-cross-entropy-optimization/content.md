---
{
  "id": "softmax-cross-entropy-optimization",
  "title": "Softmax, Cross-Entropy & Optimization",
  "slug": "softmax-cross-entropy-optimization",
  "section": "Preparation & Prerequisites",
  "category": "NLP Fundamentals",
  "difficulty": "Easy",
  "order": 5,
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
    "Temperature versus decoding strategy",
    "Label smoothing and finite optimal logit gaps",
    "Averaging loss across supervised token positions"
  ]
}
---

A review classifier reads `"This docs page is stale"` and outputs raw scores `bug = 3.0`, `docs = 1.0`, `security = 0.0`. It picked the wrong label, and it was not even close. If we only score right versus wrong, a confident blunder (11% on `docs`) looks identical to a narrow miss (49% on `docs`). How do we turn raw scores into probabilities, punish confident mistakes steeply, and send back a clean gradient?

In the [previous lesson](/learn/training-backpropagation-gradient-descent), half squared error nudged a single continuous prediction up or down. Here we build the multiclass equivalent that powers every modern classifier and language model: **softmax** turns unconstrained scores into competing probabilities, **cross-entropy** prices missed confidence in nats, and their combined gradient collapses to the remarkably simple vector $p - y$.

## A decision begins as three raw scores

The final linear layer emits one unconstrained real score per class, called **<span data-glossary="logits">logits</span>**:

| Label | Current logit | Ground truth |
|---|---:|---|
| `bug` | `3.0` | Model's favorite, wrong |
| `docs` | `1.0` | True target class |
| `security` | `0.0` | Competing class |

Raw logits identify the leader (`bug`), yet they can be negative or sum to anything (`4.0` here) instead of forming a valid probability distribution in $[0, 1]$ summing to `1.0`. **<span data-glossary="softmax">Softmax</span>** converts any logit vector $z \in \mathbb{R}^K$ into normalized probabilities in two steps: exponentiate every score so weights are strictly positive (a `+2.0` logit lead becomes an $e^{2.0} \approx 7.389\times$ weight lead), then divide by their sum $\sum_{j=1}^K e^{z_j}$:

$$
p_i = \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}}
$$

On our three scores, $e^{3.0} \approx 20.086$, $e^{1.0} \approx 2.718$, and $e^{0.0} = 1.000$ sum to $23.804$:

| Label | Logit $z_i$ | Unnormalized weight $e^{z_i}$ | Probability share $p_i$ |
|---|---:|---:|---:|
| `bug` | `3.0` | `20.09` | `0.844` |
| `docs` | `1.0` | `2.72` | `0.114` |
| `security` | `0.0` | `1.00` | `0.042` |
| **Total (before rounding)** | | **`≈23.804`** | **`1.000`** |

The model puts `84.4%` probability on the wrong label and only `11.4%` on `docs`.

<figure>
  <img src="illustrations/_generated/softmax_logits_dark.png" alt="Visual progression of softmax and log-sum-exp stabilization: raw logits [3.0, 1.0, 0.0] are shifted by max logit 3.0 to [0.0, -2.0, -3.0], exponentiated to weights [1.000, 0.135, 0.050] summing to 1.185, and normalized into probability mass 84.4 percent bug, 11.4 percent docs, and 4.2 percent security." />
  <figcaption>Exponentiation stretches score gaps into positive weights. Subtracting the peak logit 3.0 caps every exponential at 1.0 to prevent floating-point overflow, while normalizing by the shared sum 1.185 preserves the exact probability shares.</figcaption>
</figure>

Compute stable softmax directly in Python:

<!-- leetllm: test, output=show -->
```python title="stable-softmax.py"
import math

def stable_softmax(logits: list[float]) -> list[float]:
    peak = max(logits)
    weights = [math.exp(z - peak) for z in logits]
    total = sum(weights)
    return [weight / total for weight in weights]

labels = ["bug", "docs", "security"]
logits = [3.0, 1.0, 0.0]
probabilities = stable_softmax(logits)

for label, probability in zip(labels, probabilities):
    print(f"{label:8s} {probability:.3f}")
print("sum     ", round(sum(probabilities), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
bug      0.844
docs     0.114
security 0.042
sum      1.0
```
<!-- leetllm: output:end -->

```checkpoint
The correct label is `docs`, but its probability is only `0.114`. Why can't the model fix this by simply tweaking the post-softmax numbers directly?
---
Probabilities are consequences of logits and compete for a fixed budget of 1.0. Learning updates parameters, which changes the logits. Pushing the `docs` logit upward relative to `bug` is what increases its probability on the next forward pass.
```

## Stable arithmetic prevents floating-point overflow

Small logits like `[3.0, 1.0, 0.0]` exponentiate effortlessly, but what if a deep layer emits `[1000.0, 998.0, 997.0]`? In `float32`, `exp(z)` overflows past $z \approx 88.72$; in `float16`, it overflows past $z \approx 11.09$ (**bfloat16** keeps `float32`'s wide exponent range with fewer mantissa bits).[^googleBfloat162026] Once exponentials hit `+inf`, dividing `inf / inf` produces `NaN` and poisons gradients across the network.

Softmax has a clean algebraic escape hatch: **shift invariance**.[^goodfellow2016] Subtracting any constant $c$ from every logit cancels out identically:

$$
\frac{e^{z_i - c}}{\sum_{j=1}^K e^{z_j - c}} = \frac{e^{z_i} e^{-c}}{e^{-c} \sum_{j=1}^K e^{z_j}} = \frac{e^{z_i}}{\sum_{j=1}^K e^{z_j}}
$$

Setting $c = m = \max_j z_j$ makes every shifted logit nonpositive ($z_j - m \le 0$), so the largest exponential is $e^0 = 1.0$, overflow is impossible, and the denominator is at least `1.0` (masked entries may hold `-inf` as long as at least one candidate stays finite):

<!-- leetllm: test, output=show -->
```python title="overflow-then-stable.py"
import math

def stable_softmax(logits: list[float]) -> list[float]:
    peak = max(logits)
    weights = [math.exp(z - peak) for z in logits]
    total = sum(weights)
    return [weight / total for weight in weights]

large_logits = [1000.0, 998.0, 997.0]
try:
    _ = [math.exp(z) for z in large_logits]
    naive_ok = True
except OverflowError:
    naive_ok = False

stable = stable_softmax(large_logits)
print("naive overflowed:", not naive_ok)
print("stable:", [round(probability, 3) for probability in stable])
print("stable sum:", round(sum(stable), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
naive overflowed: True
stable: [0.844, 0.114, 0.042]
stable sum: 1.0
```
<!-- leetllm: output:end -->

For a NumPy array in float32 or float64, naive exponentiation of these scores produces `inf`, and dividing the infinite entries by their infinite sum produces `NaN` (normally with warnings). Max-subtraction avoids that overflow and preserves the mathematical distribution, subject to floating-point rounding.

```checkpoint
A softmax receives finite logits [1200, 1199, 1197]. Which shifted calculation preserves its distribution and avoids exponential overflow?

1. Shift to [0, −1, −3]; use a different exponential multiplier for each rank; normalize the rank-adjusted weights.
2. Shift to [0, −1, −3]; exponentiate with one common cancelled scale factor; normalize the resulting bounded weights.
3. Shift to [0, −1, −3]; discard the two negative entries; normalize the surviving maximum as an exact softmax result.
4. Shift to [1, 0, −2]; divide the input scores by their sum; interpret those three quotients as the softmax distribution.
---
**Answer:** Shift to [0, −1, −3]; exponentiate with one common cancelled scale factor; normalize the resulting bounded weights.

Subtracting 1200 changes every exponential by the common factor exp(−1200), which cancels. The largest shifted exponent is zero and the others are negative. Removing candidates or rescaling each differently changes the distribution.
```

## Cross-entropy prices missed predictions through surprise

Softmax gave us a probability distribution where `docs` received $p_{\text{docs}} \approx 0.114$. Grounded in Maximum Likelihood Estimation (MLE) and information theory, **<span data-glossary="cross-entropy">cross-entropy</span>** scores how well that predicted distribution matches ground truth. Observing an event of probability $p$ yields an information content, or **surprise**, of $I(p) = -\log(p)$. Measuring with natural logarithms expresses surprise in **nats** rather than bits: a certain event ($p = 1.0$) produces zero surprise ($-\ln(1.0) = 0$), whereas a rare event ($p = 0.001$) produces high surprise ($-\ln(0.001) \approx 6.91$ nats).

When training a supervised classifier, the ground truth is a target distribution $y$, which for single-label classification is a one-hot <span data-glossary="vector">vector</span> placing weight $1.0$ on the correct class $c$ and $0.0$ everywhere else ($y = [0, 1, 0]$ for our triage note). Cross-entropy computes the expected surprise across all classes under that target distribution:

$$
L_{\text{CE}} = -\sum_{k=1}^K y_k \log(p_k)
$$

Because $y_k = 0$ for every non-target class and $y_c = 1$ for the true class, cross-entropy simplifies to **Negative Log-Likelihood (NLL)**, $L = -\log(p_c)$. For our review note where $c = \text{docs}$, $L = -\log(0.1142) \approx 2.170$ nats; pushing `docs` to `0.844` drops the loss to `0.170` nats, and `0.999` drops it to `0.001` nats.

### The log-sum-exp formulation prevents underflow crashes

Never compute `log(softmax(z))` in two separate steps. For `logits = [1000.0, 0.0, -1.0]` with target `docs`, `exp(-1000)` underflows to `0.0` and `log(0.0)` explodes to `-inf` even though the exact loss is cleanly `1000.0`. Expand $p_c$ directly in log space with the same max shift $m = \max_j z_j$:[^goodfellow2016]

$$
L = -\log\left(\frac{e^{z_c}}{\sum_j e^{z_j}}\right) = \log\left(\sum_{j=1}^K e^{z_j}\right) - z_c
$$

The first term is **<span data-glossary="log-sum-exp">log-sum-exp</span>**, which we stabilize with the same maximum shift $m = \max_j(z_j)$:

$$
\log\left(\sum_{j=1}^K e^{z_j}\right) = \log\left(e^m \sum_{j=1}^K e^{z_j - m}\right) = m + \log\left(\sum_{j=1}^K e^{z_j - m}\right)
\implies
L = (m - z_c) + \log\left(\sum_{j=1}^K e^{z_j - m}\right)
$$

Grouping $(m - z_c)$ first prevents catastrophic cancellation, so when $z_c = 0.0$ and $m = 1000.0$, the first term evaluates cleanly to $1000.0$ while the logarithm adds $\log(1.0 + \dots) \approx 0.0$, returning $1000.0$ without ever evaluating $\log(0)$:

<!-- leetllm: test, output=show -->
```python title="cross-entropy-from-logits.py"
import math

def cross_entropy_from_logits(logits: list[float], target_index: int) -> float:
    peak = max(logits)
    log_total = math.log(sum(math.exp(z - peak) for z in logits))
    return (peak - logits[target_index]) + log_total

ordinary = [3.0, 1.0, 0.0]
shifted_high = [z + 1000.0 for z in ordinary]

print("ordinary docs loss:", round(cross_entropy_from_logits(ordinary, 1), 3))
print("large-offset loss: ", round(cross_entropy_from_logits(shifted_high, 1), 3))
print("underflowed target weight:", math.exp(-1000.0))
print("finite target loss:", cross_entropy_from_logits([1000.0, 0.0, -1.0], 1))
print("equal huge scores:", round(cross_entropy_from_logits([1e20, 1e20, 1e20], 1), 3))
assert math.isclose(cross_entropy_from_logits([1e20] * 3, 1), math.log(3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ordinary docs loss: 2.17
large-offset loss:  2.17
underflowed target weight: 0.0
finite target loss: 1000.0
equal huge scores: 1.099
```
<!-- leetllm: output:end -->

```checkpoint
Another sample gets `0.80` probability on its correct class. Which sample contributes more loss: that sample or our `docs` sample at `0.114`?
---
Our `docs` sample contributes far more loss: approximately $2.170$ nats using its unrounded probability, versus $0.223$ nats for the 80% prediction. The penalty grows logarithmically as probability shrinks. Halving the target probability adds $\ln(2)$ nats, regardless of its starting value.
```

### Entropy is reference uncertainty and KL divergence is prediction error

Before moving on to gradients, keep three related quantities separate. They use the same logarithms, but answer different questions about uncertainty and prediction error.

<span data-glossary="entropy">Entropy</span> $H(P)$ measures the inherent uncertainty already present inside a reference probability distribution $P$:

$$
H(P) = -\sum_k P(k) \log P(k)
$$

Cross-entropy $H(P, Q)$ measures the total cost of representing distribution $P$ using model distribution $Q$. <span data-glossary="kl-divergence">Kullback-Leibler divergence</span> $D_{\text{KL}}(P \parallel Q)$ measures the extra penalty caused specifically by the mismatch between $Q$ and $P$:

$$
H(P, Q) = H(P) + D_{\text{KL}}(P \parallel Q)
$$

For a one-hot target $P = [0, 1, 0]$, target entropy is zero ($H(P) = 0$), so all `2.170` nats of cross-entropy are prediction mismatch ($D_{\text{KL}} = 2.170$). For a soft target such as $P = [0.5, 0.5, 0]$, target entropy is $H(P) = \ln(2) \approx 0.693$ nats: even a perfect model ($Q = P$) reports `0.693` cross-entropy with $D_{\text{KL}} = 0$.

> **Key insight:** Cross-entropy equals target entropy plus KL divergence: $H(P, Q) = H(P) + D_{\text{KL}}(P \parallel Q)$. A nonzero loss floor on soft targets reflects $H(P)$, not model error.

<!-- leetllm: test, output=show -->
```python title="entropy-cross-entropy-kl.py"
from math import exp, inf, log

def entropy(probabilities: list[float]) -> float:
    return sum(-p * log(p) for p in probabilities if p > 0)

def cross_entropy(target: list[float], predicted: list[float]) -> float:
    # Inputs must be normalized, nonnegative distributions over the same classes.
    pairs = list(zip(target, predicted, strict=True))
    if any(p > 0 and q == 0 for p, q in pairs):
        return inf
    return -sum(p * log(q) for p, q in pairs if p > 0)

weights = [exp(value) for value in [3.0, 1.0, 0.0]]
predicted = [weight / sum(weights) for weight in weights]
one_hot_target = [0.0, 1.0, 0.0]
uncertain_target = [0.5, 0.5, 0.0]

one_hot_loss = cross_entropy(one_hot_target, predicted)
matched_loss = cross_entropy(uncertain_target, uncertain_target)

print(f"one-hot target entropy: {entropy(one_hot_target):.3f}")
print(f"one-hot cross-entropy:  {one_hot_loss:.3f}")
print(f"one-hot KL mismatch:    {one_hot_loss - entropy(one_hot_target):.3f}")
print(f"soft target entropy:    {entropy(uncertain_target):.3f}")
print(f"matching cross-entropy: {matched_loss:.3f}")
print(f"matching KL mismatch:   {matched_loss - entropy(uncertain_target):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
one-hot target entropy: 0.000
one-hot cross-entropy:  2.170
one-hot KL mismatch:    2.170
soft target entropy:    0.693
matching cross-entropy: 0.693
matching KL mismatch:   0.000
```
<!-- leetllm: output:end -->

These functions assume valid probability distributions; `zip(..., strict=True)` prevents a mismatched class list from silently losing terms. We use the convention $0\log 0 = 0$. If $P(k)>0$ but $Q(k)=0$, cross-entropy and KL divergence are infinite. For valid distributions, KL is nonnegative and the minimum cross-entropy is the target entropy. Soft targets may express disagreement, distillation, or deliberate smoothing, so that entropy isn't always irreducible noise in the real task.

## The combined gradient reveals a clean error signal

Loss measures how poorly the model performed, whereas training needs the **<span data-glossary="gradient">gradient</span>** of that loss with respect to every logit, $\frac{\partial L}{\partial z_k}$. Differentiating softmax alone involves a coupled Jacobian matrix, yet combining softmax with cross-entropy makes the logarithm and the exponential derivative cancel out cleanly, leaving simply predicted probability minus target.[^goodfellow2016] Writing the unshifted logit form $L = \log\left(\sum_{j=1}^K e^{z_j}\right) - z_c$ and differentiating with respect to $z_k$ applies the chain rule to $u = \sum_j e^{z_j}$:

$$
\frac{\partial}{\partial z_k} \log\left(\sum_{j=1}^K e^{z_j}\right) = \frac{1}{\sum_{j=1}^K e^{z_j}} \cdot \frac{\partial}{\partial z_k} e^{z_k} = \frac{e^{z_k}}{\sum_{j=1}^K e^{z_j}} = p_k
$$

Notice that the derivative of log-sum-exp is the softmax probability $p_k$ itself. Meanwhile, the derivative of the second term $\frac{\partial z_c}{\partial z_k}$ equals $1$ when $k = c$ and $0$ otherwise, which is exactly the one-hot target entry $y_k$. Subtracting the two pieces yields the compact vector form $\nabla_z L = p - y$, or elementwise $\frac{\partial L}{\partial z_k} = p_k - y_k$. Plugging in the triage probabilities gives an immediate view of how each logit moves during an update:

| Label | Predicted probability $p$ | Target weight $y$ | Logit gradient $p - y$ | Gradient descent update $-\eta(p - y)$ |
|---|---:|---:|---:|---|
| `bug` | `0.844` | `0` | `+0.844` | Lowers wrong favorite |
| `docs` | `0.114` | `1` | `-0.886` | Raises correct target |
| `security` | `0.042` | `0` | `+0.042` | Lowers minor competitor |

### The zero-sum conservation property

Summing every component of $\nabla_z L$ gives $\sum_{k=1}^K (p_k - y_k) = \sum_{k=1}^K p_k - \sum_{k=1}^K y_k = 1.0 - 1.0 = 0$. The upward pull on the correct class ($-0.886$) balances the downward push on competing classes ($+0.844 + 0.042 = +0.886$) because softmax distributes a fixed unit of probability mass across competing outcomes.

<figure>
  <img src="illustrations/_generated/cross_entropy_gradient_signal_dark.png" alt="Three probability number lines join the one-hot target to the prediction, labeling p minus y: bug plus 0.844, docs minus 0.886, and security plus 0.042. Direct gradient descent lowers bug and security logits while raising docs." />
  <figcaption>Each segment joins target y to prediction p; the labeled difference is the gradient p minus y. A direct gradient-descent step subtracts η times the gradient, raising docs and lowering its competitors in an exact zero-sum balance.</figcaption>
</figure>

In a full neural network, backpropagation channels this $p - y$ residual through shared upstream weights via the chain rule; testing one step directly on the logits shows the mechanics without matrix clutter:

<!-- leetllm: test, output=show -->
```python title="one-logit-signal-step.py"
import math

def probabilities_and_loss(logits: list[float], target_index: int) -> tuple[list[float], float]:
    peak = max(logits)
    shifted = [z - peak for z in logits]
    log_total = math.log(sum(math.exp(value) for value in shifted))
    log_probs = [value - log_total for value in shifted]
    probabilities = [math.exp(value) for value in log_probs]
    return probabilities, -log_probs[target_index]

labels = ["bug", "docs", "security"]
logits = [3.0, 1.0, 0.0]
target_index = labels.index("docs")
target = [1.0 if index == target_index else 0.0 for index in range(3)]

before, before_loss = probabilities_and_loss(logits, target_index)
gradient = [probability - label for probability, label in zip(before, target)]
after_logits = [z - 0.5 * slope for z, slope in zip(logits, gradient)]
after, after_loss = probabilities_and_loss(after_logits, target_index)

print("gradient:", [round(value, 3) for value in gradient])
print("docs probability:", round(before[1], 3), "->", round(after[1], 3))
print("loss:", round(before_loss, 3), "->", round(after_loss, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
gradient: [0.844, -0.886, 0.042]
docs probability: 0.114 -> 0.23
loss: 2.17 -> 1.469
```
<!-- leetllm: output:end -->

Confirm the mathematical slope against numerical finite differences: nudge each logit by $\epsilon = 10^{-5}$ and check the symmetric difference quotient.

<!-- leetllm: test, output=show -->
```python title="verify-cross-entropy-gradient.py"
import math

def loss(logits: list[float], target_index: int) -> float:
    peak = max(logits)
    shifted = [z - peak for z in logits]
    return math.log(sum(math.exp(value) for value in shifted)) - shifted[target_index]

logits = [3.0, 1.0, 0.0]
target_index = 1
peak = max(logits)
shifted = [z - peak for z in logits]
total = sum(math.exp(value) for value in shifted)
probabilities = [math.exp(value) / total for value in shifted]
analytic = [
    probability - (1.0 if index == target_index else 0.0)
    for index, probability in enumerate(probabilities)
]

epsilon = 1e-5
numeric = []
for index in range(3):
    plus = logits.copy()
    minus = logits.copy()
    plus[index] += epsilon
    minus[index] -= epsilon
    slope = (loss(plus, target_index) - loss(minus, target_index)) / (2 * epsilon)
    numeric.append(slope)

print("analytic:", [round(value, 6) for value in analytic])
print("numeric: ", [round(value, 6) for value in numeric])
print("match:", all(math.isclose(left, right, abs_tol=1e-6) for left, right in zip(analytic, numeric)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
analytic: [0.843795, -0.885805, 0.04201]
numeric:  [0.843795, -0.885805, 0.04201]
match: True
```
<!-- leetllm: output:end -->

### Why squared probability error can learn slowly from confident mistakes

Why not apply squared error directly to predicted probabilities, $L_{\text{sq}} = \frac{1}{2} \sum_k (p_k - y_k)^2$? That loss is a scaled **Brier loss**, a valid proper scoring rule for categorical forecasts that can also train classifiers, though the sum here is unaveraged across classes.[^gneiting2007ScoringRules] To see how its optimization behavior differs from cross-entropy, trace gradients through the **softmax Jacobian** $\frac{\partial p_i}{\partial z_j} = p_i (\delta_{ij} - p_j)$. Differentiating cross-entropy $L_{\text{CE}} = -\sum_i y_i \log(p_i)$ produces a factor $-\frac{y_i}{p_i}$ whose denominator cancels $p_i$ in the Jacobian:

$$
\frac{\partial L_{\text{CE}}}{\partial z_j} = \sum_i \frac{\partial L}{\partial p_i} \frac{\partial p_i}{\partial z_j} = \sum_i \left(-\frac{y_i}{p_i}\right) \cdot p_i (\delta_{ij} - p_j) = -\sum_i y_i (\delta_{ij} - p_j) = p_j - y_j
$$

Under squared probability error, $\frac{\partial L_{\text{sq}}}{\partial p_i} = (p_i - y_i)$ lacks that $1/p_i$ cancellation, leaving the softmax Jacobian factor inside $\frac{\partial L_{\text{sq}}}{\partial z_j} = \sum_i (p_i - y_i) p_i (\delta_{ij} - p_j)$. When the model is confidently wrong ($p_{\text{bug}} \approx 0.9993$, $p_{\text{docs}} \approx 0.0003$), that Jacobian factor collapses the squared-error gradient to `-0.0007`, while cross-entropy stays at full strength `-0.9997`:

<!-- leetllm: test, output=show -->
```python title="confidently-wrong-gradients.py"
import math

def softmax(logits: list[float]) -> list[float]:
    peak = max(logits)
    weights = [math.exp(z - peak) for z in logits]
    total = sum(weights)
    return [weight / total for weight in weights]

def squared_probability_loss(logits: list[float], target: list[float]) -> float:
    error = [probability - label for probability, label in zip(softmax(logits), target)]
    return 0.5 * sum(value * value for value in error)

logits = [8.0, 0.0, 0.0]
target = [0.0, 1.0, 0.0]
probabilities = softmax(logits)
ce_gradient = [probability - label for probability, label in zip(probabilities, target)]

epsilon = 1e-5
mse_gradient = []
for index in range(3):
    plus = logits.copy()
    minus = logits.copy()
    plus[index] += epsilon
    minus[index] -= epsilon
    slope = (
        squared_probability_loss(plus, target)
        - squared_probability_loss(minus, target)
    ) / (2 * epsilon)
    mse_gradient.append(slope)

print("probabilities:", [round(value, 4) for value in probabilities])
print("cross-entropy gradient:", [round(value, 4) for value in ce_gradient])
print("squared-probability gradient:", [round(value, 4) for value in mse_gradient])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
probabilities: [0.9993, 0.0003, 0.0003]
cross-entropy gradient: [0.9993, -0.9997, 0.0003]
squared-probability gradient: [0.001, -0.0007, -0.0003]
```
<!-- leetllm: output:end -->

In this example, the target logit gradients differ by roughly three orders of magnitude (`-1.0` versus `-0.0007`), which explains why cross-entropy escapes confident mistakes faster even though squared probability error remains a valid classification loss with different gradient dynamics.

## PyTorch expects unnormalized logits directly

PyTorch's `nn.CrossEntropyLoss` expects raw unnormalized logits, not probabilities.[^pytorchCrossEntropy2026] Internally it fuses stabilized `log_softmax` with `NLLLoss`.[^pytorchCrossEntropyImplementation2026] Passing `nn.Softmax()` output into `nn.CrossEntropyLoss` applies softmax a *second* time to numbers already squashed into $[0, 1]$, silently shrinking the loss and choking gradients while every tensor shape still passes:

<!-- leetllm: test, deps=torch, output=show -->
```python title="pytorch-cross-entropy.py"
import torch
from torch import nn

logits = torch.tensor([[3.0, 1.0, 0.0]], requires_grad=True)
target = torch.tensor([1])  # docs
loss_fn = nn.CrossEntropyLoss()

loss = loss_fn(logits, target)
loss.backward()
probabilities = torch.softmax(logits.detach(), dim=1)

print("probabilities:", [round(value, 3) for value in probabilities[0].tolist()])
print("loss:", round(loss.item(), 3))
print("gradient:", [round(value, 3) for value in logits.grad[0].tolist()])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
probabilities: [0.844, 0.114, 0.042]
loss: 2.17
gradient: [0.844, -0.886, 0.042]
```
<!-- leetllm: output:end -->

Now reproduce the common bug: `softmax` first, then `CrossEntropyLoss`. The shapes match, so Python raises no warning. Compare the target gradients.

<!-- leetllm: test, deps=torch, output=show -->
```python title="do-not-softmax-before-cross-entropy.py"
import torch
from torch import nn

target = torch.tensor([1])  # docs
loss_fn = nn.CrossEntropyLoss()

correct_input = torch.tensor([[3.0, 1.0, 0.0]], requires_grad=True)
correct_loss = loss_fn(correct_input, target)
correct_loss.backward()

wrong_input = torch.tensor([[3.0, 1.0, 0.0]], requires_grad=True)
wrong_loss = loss_fn(torch.softmax(wrong_input, dim=1), target)
wrong_loss.backward()

print("raw logits loss:", round(correct_loss.item(), 3))
print("probabilities passed as logits:", round(wrong_loss.item(), 3))
print("correct docs gradient:", round(correct_input.grad[0, 1].item(), 3))
print("distorted docs gradient:", round(wrong_input.grad[0, 1].item(), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw logits loss: 2.17
probabilities passed as logits: 1.387
correct docs gradient: -0.886
distorted docs gradient: -0.127
```
<!-- leetllm: output:end -->

> **Common mistake:** Putting `nn.Softmax()` at the end of a classification network trained with `nn.CrossEntropyLoss`. Here the corrective gradient on `docs` collapses from `-0.886` to `-0.127` with zero runtime warning. Always feed raw logits to `nn.CrossEntropyLoss` (and pass `torch.long` integer indices or properly normalized float probability targets).[^pytorchCrossEntropy2026]

## Temperature scaling shapes inference entropy

Dividing logits by a positive **<span data-glossary="temperature">temperature</span>** $T > 0$ reshapes probability sharpness without modifying model weights:

$$
p_i(T) = \frac{e^{z_i / T}}{\sum_{j=1}^K e^{z_j / T}}
$$

- **$0 < T < 1$:** Stretches logit gaps, concentrating mass onto the top class (or splitting it equally across tied maxima as $T \to 0^+$; APIs offering `T = 0` switch to greedy argmax).
- **$T > 1$:** Compresses logit gaps, spreading mass toward uniform ($1/K$) as $T \to \infty$.

Temperature preserves class ranking, so lowering $T$ never fixes a misranked prediction. In knowledge distillation, Hinton et al. raise $T$ to expose relative probabilities among non-target classes ("dark knowledge") and multiply the soft-target loss by $T^2$ to cancel the $1/T$ gradient scaling of $\operatorname{softmax}(z/T)$.[^hinton2015] During serving, temperature adjusts sampling diversity alongside the chosen decoding strategy:

| Temperature | `bug` ($z=3$) | `docs` ($z=1$) | `security` ($z=0$) | Interpretation |
|---:|---:|---:|---:|---|
| `0.5` | `0.980` | `0.018` | `0.002` | Sharpened distribution; wrong winner reinforced |
| `1.0` | `0.844` | `0.114` | `0.042` | Original learned model distribution |
| `2.0` | `0.629` | `0.231` | `0.140` | Flattened distribution; alternatives gain mass |

<!-- leetllm: test, output=show -->
```python title="temperature-scales-logits.py"
import math

def softmax_at_temperature(logits: list[float], temperature: float) -> list[float]:
    if not math.isfinite(temperature) or temperature <= 0:
        raise ValueError("temperature must be finite and positive")
    if not logits or not all(math.isfinite(z) for z in logits):
        raise ValueError("logits must be nonempty and finite")
    peak = max(logits)
    weights = [math.exp((z - peak) / temperature) for z in logits]
    total = sum(weights)
    return [weight / total for weight in weights]

logits = [3.0, 1.0, 0.0]
for temperature in (0.5, 1.0, 2.0):
    probabilities = softmax_at_temperature(logits, temperature)
    print(f"T={temperature:.1f}", [round(probability, 3) for probability in probabilities])

equal_scores = softmax_at_temperature([1e308, 1e308, 1e308], 1e-308)
print("equal huge scores:", [round(p, 3) for p in equal_scores])
assert all(math.isclose(p, 1 / 3) for p in equal_scores)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
T=0.5 [0.98, 0.018, 0.002]
T=1.0 [0.844, 0.114, 0.042]
T=2.0 [0.629, 0.231, 0.14]
equal huge scores: [0.333, 0.333, 0.333]
```
<!-- leetllm: output:end -->

Subtract the peak **before** dividing by temperature, because dividing `1e308` by `1e-308` first overflows to infinity and turns a valid three-way tie into `inf - inf` (`NaN`), whereas subtracting the peak first caps every shifted logit at zero. Temperature only reshapes logits that are already computed, leaving open what training objective prevents optimization itself from driving winning score gaps toward infinity.

```checkpoint
If `docs` is correct but `bug` is currently the highest logit, does lowering temperature repair the model?
---
No. Lowering temperature sharpens the current ranking, strengthening the mistaken `bug` preference to 98%. Training changes logits by following loss gradients; temperature only rescales probabilities generated from current logits.
```

## Label smoothing curbs overconfident logits

With a one-hot target ($y_{\text{docs}} = 1$), minimizing cross-entropy pushes $z_{\text{docs}} - z_k \to +\infty$ because $p_{\text{docs}}$ only reaches `1.0` at infinite logit margin. **Label smoothing** mixes the one-hot target with a uniform distribution over $K$ classes using weight $\alpha \in (0, 1)$: $\tilde{y}_k = (1 - \alpha) y_k + \frac{\alpha}{K}$.[^szegedy2016LabelSmoothing] For 3 classes and $\alpha = 0.1$, the target becomes `[0.033, 0.933, 0.033]`, so cross-entropy reaches its minimum at a finite logit gap $z_{\text{docs}} - z_{\text{competitor}} = \ln(0.9333 / 0.0333) = \ln(28) \approx 3.332$ (note that smoothing a teacher's labels can still hurt downstream distillation).[^muller2019LabelSmoothing]

Verify PyTorch's `nn.CrossEntropyLoss(label_smoothing=0.1)` against the manual soft-target loss and $p - \tilde{y}$ gradient:

<!-- leetllm: test, deps=torch, output=show -->
```python title="label-smoothing-cross-entropy.py"
import torch
from torch import nn

logits = torch.tensor([[3.0, 1.0, 0.0]], requires_grad=True)
target = torch.tensor([1])  # docs
alpha = 0.1
num_classes = 3

loss_fn = nn.CrossEntropyLoss(label_smoothing=alpha)
loss = loss_fn(logits, target)
loss.backward()

probs = torch.softmax(logits.detach(), dim=1)[0]
smoothed_target = torch.tensor([
    alpha / num_classes,
    (1.0 - alpha) + (alpha / num_classes),
    alpha / num_classes,
])
manual_loss = -torch.sum(smoothed_target * torch.log_softmax(logits.detach(), dim=1)[0])
grad_manual = probs - smoothed_target

print("probabilities:   ", [round(x, 3) for x in probs.tolist()])
print("smoothed target: ", [round(x, 3) for x in smoothed_target.tolist()])
print("pytorch loss:    ", round(loss.item(), 3))
print("manual loss:     ", round(manual_loss.item(), 3))
print("logit gradient:  ", [round(x, 3) for x in logits.grad[0].tolist()])
print("manual gradient: ", [round(x, 3) for x in grad_manual.tolist()])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
probabilities:    [0.844, 0.114, 0.042]
smoothed target:  [0.033, 0.933, 0.033]
pytorch loss:     2.137
manual loss:      2.137
logit gradient:   [0.81, -0.819, 0.009]
manual gradient:  [0.81, -0.819, 0.009]
```
<!-- leetllm: output:end -->

The loss and gradient agree to the displayed precision. The manual calculation uses `log_softmax` to stay in log space. The same $p-y$ gradient identity works for normalized soft targets; for a malformed target with sum $a$, the gradient would be $a p-y$, which is another reason to validate probability targets.

## Next-token prediction extends the loss across sequences

While our triage classifier evaluated a single decision, autoregressive language models evaluate the exact same categorical decision at every sequence position. Given context $x_1, x_2, \dots, x_t$, the model produces a hidden state $h_t \in \mathbb{R}^d$ and projects it to vocabulary logits $z_t \in \mathbb{R}^{|V|}$ (optionally sharing weights with the input embeddings), using the observed next token $x_{t+1}$ as the supervised target. For $S+1$ observed tokens, there are $S$ next-token prediction positions whose mean negative log-likelihood is $L_{\text{seq}} = -\frac{1}{S} \sum_{t=1}^S \log P(x_{t+1} \mid x_1, \dots, x_t)$. Reusing our numbers over vocabulary `["bug", "docs", "today"]` and observed sequence `bug docs today`, teacher forcing feeds inputs `[bug, docs]` against aligned targets `[docs, today]`:
- Position 1 sees `bug` and predicts `docs` ($c=1$) from logits `[3.0, 1.0, 0.0]`. Target probability is $0.114$, producing $L_1 = 2.170$ nats.
- Position 2 sees `bug docs` and predicts `today` ($c=2$) from logits `[0.5, 0.0, 2.0]`. Target probability is $0.736$, producing $L_2 = 0.306$ nats.
- Sequence mean loss: $L_{\text{seq}} = \frac{2.170 + 0.306}{2} = 1.238$ nats.

<figure>
  <img src="illustrations/_generated/cross_entropy_batch_loss_dark.png" alt="Cross-entropy loss curve and sequence loss reduction: the negative log curve shows steep penalty L=2.170 for missed target docs (p=0.114) versus mild penalty L=0.306 for correct today (p=0.736), resulting in docs dominating 87.6 percent of the sequence loss and a mean loss of 1.238 nats." />
  <figcaption>The negative log penalty escalates rapidly when probability on the target drops toward zero. The missed docs token contributes 2.170 of the 2.476 total loss (about 87.6 percent), while correct today contributes only 0.306. Averaging over sequence positions reports a mean loss of 1.238 nats.</figcaption>
</figure>

Position 1 accounts for $2.170 / 2.476 \approx 87.6\%$ of the sequence loss because the negative logarithm heavily penalizes low target probability. Notice how tensor axes organize those calculations at scale in the next section.

### Tensor shapes and vocabulary memory scaling

In PyTorch, a language model batch emits logits shaped `[B, S, V]` (batch size, sequence length, vocabulary size) alongside targets shaped `[B, S]`. Because PyTorch's multi-dimensional cross-entropy expects classes along dimension 1 (`[B, V, S]`), callers either transpose axes 1 and 2 or flatten both tensors to `[B * S, V]` and `[B * S]`. At LLM vocabulary sizes, materializing `[B, S, V]` grows expensive: with $B=16$, $S=4096$, and $V=128256$, logits alone occupy $16\times4096\times128256\times4 = 33{,}621{,}540{,}864$ bytes in `float32`, roughly **33.62 GB (31.31 GiB)** before accounting for activations, gradients, or optimizer state. Chunked implementations such as **Cut Cross-Entropy** fuse the output projection with tiled log-sum-exp to avoid materializing the full logit tensor in GPU memory, whereas standard `CrossEntropyLoss` always operates on logits you have already allocated.[^wijmans2025CutCrossEntropy]

<!-- leetllm: test, deps=torch, output=show -->
```python title="sequence-loss-shapes.py"
import torch
from torch import nn

logits = torch.tensor([[[3.0, 1.0, 0.0], [0.5, 0.0, 2.0]]])
targets = torch.tensor([[1, 2]])  # docs, today
loss_fn = nn.CrossEntropyLoss()

class_axis_loss = loss_fn(logits.transpose(1, 2), targets)
flattened_loss = loss_fn(
    logits.reshape(-1, logits.size(-1)),
    targets.reshape(-1),
)

print("logits shape:", tuple(logits.shape))
print("targets shape:", tuple(targets.shape))
print("class-axis loss:", round(class_axis_loss.item(), 3))
print("flattened loss:", round(flattened_loss.item(), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
logits shape: (1, 2, 3)
targets shape: (1, 2)
class-axis loss: 1.238
flattened loss: 1.238
```
<!-- leetllm: output:end -->

The logits in this example are **already aligned** to next-token targets, whereas some model APIs accept unshifted labels and apply the shift internally. Always verify that API behavior to avoid training on the current token or shifting twice, and remember that a loss mask only selects supervised positions while causal attention masks future input tokens.

Padding and prompt positions are typically unsupervised, and `ignore_index=-100` excludes them from both the loss sum and its mean denominator for integer targets.[^pytorchCrossEntropy2026] Adding an ignored third position with extreme scores `[100.0, -100.0, 0.0]` confirms that it contributes neither to the mean loss nor to the gradient:

<!-- leetllm: test, deps=torch, output=show -->
```python title="masked-position-loss.py"
import torch
from torch.nn import functional as F

logits = torch.tensor([
    [[3.0, 1.0, 0.0], [0.5, 0.0, 2.0], [100.0, -100.0, 0.0]]
], requires_grad=True)
targets = torch.tensor([[1, 2, -100]], dtype=torch.long)
valid_count = (targets != -100).sum()
if valid_count.item() == 0:
    raise ValueError("skip an optimizer step with no supervised targets")

position_losses = F.cross_entropy(
    logits.transpose(1, 2), targets, ignore_index=-100, reduction="none"
)
loss = position_losses.sum() / valid_count
loss.backward()

print("supervised positions:", valid_count.item())
print("position losses:", [round(x, 3) for x in position_losses[0].tolist()])
print("masked mean:", round(loss.item(), 3))
print("ignored gradient:", logits.grad[0, 2].tolist())
assert torch.count_nonzero(logits.grad[0, 2]).item() == 0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
supervised positions: 2
position losses: [2.17, 0.306, 0.0]
masked mean: 1.238
ignored gradient: [0.0, 0.0, 0.0]
```
<!-- leetllm: output:end -->

With no class weights, the default mean pools all non-ignored targets across the batch. Each supervised target contributes equally: a sequence with one loss of 2 and another with three losses of 0 produce a pooled mean of $2/4=0.5$. Giving each sequence equal weight would yield 1. Choose the weighting your objective needs. An all-ignored batch has an empty denominator; PyTorch's mean loss is `NaN`, so guard it before updating.

`ignore_index` masks **target positions**, not a vocabulary class. Suppose a padding token is class 2. At a position whose target is `docs` (class 1), the padding logit still competes in the softmax denominator, even with `ignore_index=2`. Compare that loss with explicitly excluding the padding class:

<!-- leetllm: test, deps=torch, output=show -->
```python title="ignored-position-versus-excluded-class.py"
import torch
from torch.nn import functional as F

logits = torch.tensor([[0.0, 1.0, 10.0]], dtype=torch.float64, requires_grad=True)
target = torch.tensor([1])
loss = F.cross_entropy(logits, target, ignore_index=2)
loss.backward()

allowed_logits = logits.detach().clone()
allowed_logits[:, 2] = -torch.inf
restricted_loss = F.cross_entropy(allowed_logits, target)

print(f"ignore_index=2 loss: {loss.item():.3f}")
print(f"padding-class gradient: {logits.grad[0, 2].item():.6f}")
print(f"padding excluded from candidates: {restricted_loss.item():.3f}")
assert logits.grad[0, 2] > 0.99 and restricted_loss < 0.32
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ignore_index=2 loss: 9.000
padding-class gradient: 0.999831
padding excluded from candidates: 0.313
```
<!-- leetllm: output:end -->

The padding class receives a positive gradient because this supervised prediction placed almost all its probability mass there, whereas excluding it alters the candidate distribution and changes the training objective. Only apply a vocabulary mask when the task strictly forbids a candidate class, keep the ground-truth class available, and retain at least one finite option, since assigning positive target probability to an excluded class drives cross-entropy to infinity.[^pytorchCrossEntropy2026]

Class weighting also changes reduction denominators: with integer targets and no smoothing, `reduction="mean"` divides by the **sum of target class weights** across supervised positions, whereas float probability targets divide by the **raw count of positions**.[^pytorchCrossEntropy2026]

```checkpoint
A decoder emits a logit tensor of shape [3, 7, 11] for batch, sequence and vocabulary, with integer targets [3, 7]. Which two equivalent layouts satisfy PyTorch cross-entropy?

1. Class-axis input [3, 7, 11] with targets [3, 7]; or flat input [3, 77] with targets [21].
2. Class-axis input [7, 3, 11] with targets [7, 3]; or flat input [11, 21] with targets [21].
3. Class-axis input [3, 11, 7] with targets [7, 3]; or flat input [21, 11] with targets [3, 7].
4. Class-axis input [3, 11, 7] with targets [3, 7]; or flat input [21, 11] with targets [21].
---
**Answer:** Class-axis input [3, 11, 7] with targets [3, 7]; or flat input [21, 11] with targets [21].

PyTorch classes occupy dimension one in a multidimensional input. Transposition gives [B, V, S]; flattening puts each of the 3×7 positions beside its 11 logits. Labels must retain the corresponding position order.
```

## Diagnostic failure modes in production pipelines

A bad loss usually fails in a recognizable place, so matching each symptom to the underlying arithmetic narrows down bugs quickly before changing model architecture:

| Symptom | Probable cause | Diagnostic check and remediation |
|---|---|---|
| Loss evaluates to `NaN` or `OverflowError` occurs | Direct logit exponentiation without max-subtraction | Subtract $m = \max(z)$ before exponentiating; verify inputs don't already contain `NaN` |
| Loss outputs `+inf` on initial steps | Calling `log(softmax(z))` when a target probability underflows to zero | Use log-sum-exp directly on logits: `(m - z_c) + log(sum(exp(z - m)))` |
| Plausible loss but slow or stalled convergence | Manual `softmax` layer placed before `nn.CrossEntropyLoss` | Pass unnormalized logits directly into `nn.CrossEntropyLoss` |
| Confidently wrong predictions don't correct | Loss function switched to MSE on probabilities | Use cross-entropy; verify confident errors still produce logit gradients near ±1 |
| Extreme confidence despite poor held-out accuracy | Overfitting, label problems, or miscalibration | Check the data and held-out predictions; evaluate regularization, label smoothing, and fitted temperature on the same cases |
| Sampling generates garbled or nearly uniform text | Excessive temperature, incorrect tokenization, or bad logits | Inspect tokens and score distributions; evaluate temperature and top-p on representative prompts |
| Sequence loss hides severe per-token failures | Mean reduction washes out individual token spikes | Log unreduced per-token losses alongside sequence means |
| Sequence mean is `NaN` despite finite logits | Every target in a batch is ignored | Count supervised targets and skip an empty batch |

Start with the failing batch's input values, dtypes, shapes, target alignment, and supervised count, and verify stable log-sum-exp loss and logit gradients on a small known input. Adjusting decoding temperature or sampling parameters cannot repair a mislabeled or misaligned training objective.

## Try a second target

Switching the ground-truth label in the running example to `security` ($c = 2$) while keeping logits `[3.0, 1.0, 0.0]` illustrates the gradient shift directly. Since `security` holds only $p_{\text{security}} \approx 0.042$, its loss rises to $-\log(0.0420) \approx 3.170$ nats, and its gradient $p - y$ pulls `security` strongly upward ($0.042 - 1.0 = -0.958$) while pushing `bug` ($+0.844$) and `docs` ($+0.114$) down in an exact zero-sum balance ($+0.844 + 0.114 - 0.958 = 0.000$):

```checkpoint
What values should the security-target experiment produce before the update?
---
The probabilities remain `[0.844, 0.114, 0.042]`, because changing labels doesn't alter the forward pass. The loss jumps to approximately `3.170` nats. The gradient becomes `[0.844, 0.114, -0.958]`. Subtracting that gradient raises the security logit while lowering the bug and docs logits.
```

```mastery-quiz
[
  {
    "question": "A three-class prediction is p = [0.60, 0.25, 0.15], the middle class is the target, and a direct logit step subtracts 0.2(p−y). What logit changes follow?",
    "options": [
      "Changes [+0.12, −0.15, +0.03]; the target falls and the changes sum to zero.",
      "Changes [0.00, +0.15, 0.00]; the target rises and both competitors stay fixed.",
      "Changes [−0.12, −0.05, −0.03]; the three logits are lowered by their predicted shares.",
      "Changes [−0.12, +0.15, −0.03]; the target rises and the changes sum to zero."
    ],
    "explanation": "The one-hot target is [0, 1, 0], so p−y = [0.60, −0.75, 0.15]. Multiplication by −0.2 gives [−0.12, +0.15, −0.03]. Shared network weights can also affect other inputs; this is a direct local logit step.",
    "answer": "Changes [−0.12, +0.15, −0.03]; the target rises and the changes sum to zero."
  },
  {
    "question": "A PyTorch classifier has raw logits [2, −1, 0] and class-index target 1. A developer inserts softmax before CrossEntropyLoss while retaining the same valid shapes. Which diagnosis follows?",
    "options": [
      "Input requirement: raw logits are required; the inserted softmax creates a second normalization and changes upstream gradients.",
      "Input requirement: independent sigmoid values are required; the inserted softmax creates the separate binary objectives.",
      "Input requirement: normalized probabilities are required; the inserted softmax repairs the invalid negative raw score.",
      "Input requirement: both paths are equivalent; the inserted softmax changes temporary allocations but preserves the objective."
    ],
    "explanation": "CrossEntropyLoss treats its input as unnormalized scores and applies the stable log-softmax/NLL objective for integer targets. Passing softmax outputs changes both the loss and gradients despite matching shapes.",
    "answer": "Input requirement: raw logits are required; the inserted softmax creates a second normalization and changes upstream gradients."
  },
  {
    "question": "Two supervised positions have target probabilities 0.20 and 0.80. A third stored position is ignored. With no class weights, what mean cross-entropy follows, and which supervised position contributes more?",
    "options": [
      "Mean 1.833 nats; the 0.20 position contributes more to the negative-log sum.",
      "Mean 0.611 nats; the 0.20 position contributes more to the negative-log sum.",
      "Mean 0.916 nats; the 0.20 position contributes more to the negative-log sum.",
      "Mean 0.500 nats; the 0.80 position contributes more to the negative-log sum."
    ],
    "explanation": "The losses are −ln(0.20) ≈ 1.609 and −ln(0.80) ≈ 0.223. Their sum is about 1.833 and the supervised-count denominator is two, giving 0.916. The ignored stored position contributes neither loss nor count.",
    "answer": "Mean 0.916 nats; the 0.20 position contributes more to the negative-log sum."
  },
  {
    "question": "A fixed-logit model has [2, 1, −1] and the middle class is correct. Temperature drops from 1 to 0.5 without changing weights. What ranking and first-class probability follow?",
    "options": [
      "Ranking middle, first, third; first-class probability 0.119 because the target reverses the leading pair.",
      "Ranking first, middle, third; first-class probability 0.879 because dividing gaps by 0.5 sharpens them.",
      "Ranking first, middle, third; first-class probability 0.547 because dividing gaps by 0.5 flattens them.",
      "Ranking third, middle, first; first-class probability 0.002 because max-subtraction reverses the scores."
    ],
    "explanation": "Subtracting the maximum gives [0, −1, −3], then dividing by 0.5 gives [0, −2, −6]. The first probability is 1/(1+exp(−2)+exp(−6))≈0.878878. Ranking is preserved and the incorrect first class becomes more concentrated; the target does not enter the temperature transform.",
    "answer": "Ranking first, middle, third; first-class probability 0.879 because dividing gaps by 0.5 sharpens them."
  },
  {
    "question": "A prediction exactly matches target P = [0.25, 0.75, 0]. Using natural logs and the zero-target convention, which cross-entropy/KL pair follows?",
    "options": [
      "Cross-entropy 0.000; KL 0.000. Matching removes both target uncertainty and prediction mismatch.",
      "Cross-entropy 0.562; KL 0.562. Matching leaves the full uncertainty as a mismatch penalty.",
      "Cross-entropy 0.562; KL 0.000. Matching retains target uncertainty and removes prediction mismatch.",
      "Cross-entropy infinite; KL infinite. The zero target coordinate contributes an infinite penalty."
    ],
    "explanation": "Target entropy is −0.25 ln(0.25) − 0.75 ln(0.75) ≈ 0.562335 nats. When Q=P, KL is zero and cross-entropy equals this entropy. A class with zero target weight contributes zero.",
    "answer": "Cross-entropy 0.562; KL 0.000. Matching retains target uncertainty and removes prediction mismatch."
  },
  {
    "question": "A finite row has logits [900, 0, −2] and target index 1. Another row has all candidates masked to −infinity. Which stable-loss diagnosis follows?",
    "options": [
      "Finite row loss about 900; all-masked row invalid. Shifted log-sum-exp preserves the finite gap but needs a finite candidate.",
      "Finite row loss 0; all-masked row uniform. Subtracting the maximum removes the target gap and recovers a valid tie.",
      "Finite row loss infinite; all-masked row zero. Underflow determines the first loss and masking erases the second objective.",
      "Finite row loss about 900; all-masked row uniform. The stable sum provides a three-way distribution for missing candidates."
    ],
    "explanation": "For the finite row, (m−z_target)+log(sum exp(z−m)) is about 900 even if the target exponential underflows. An all−infinity row has no valid categorical distribution; −infinity−(−infinity) is not a stable finite shift.",
    "answer": "Finite row loss about 900; all-masked row invalid. Shifted log-sum-exp preserves the finite gap but needs a finite candidate."
  },
  {
    "question": "A finite-logit classifier predicts p=[0.995, 0.004, 0.001] with the middle class correct. What target-logit gradients follow for cross-entropy versus half the sum of squared probability errors?",
    "options": [
      "Cross-entropy 0; squared probability error 0. The finite-logit confident state prevents both target corrections.",
      "Cross-entropy −0.996; squared probability error about−0.00793. The latter retains the softmax Jacobian factors.",
      "Cross-entropy about−0.00793; squared probability error −0.996. The former retains the softmax Jacobian factors.",
      "Cross-entropy −0.996; squared probability error −0.996. Both probability losses cancel the same Jacobian factors."
    ],
    "explanation": "For CE, the target derivative is p 1−1=−0.996. For squared probability error, sum_i(p_i−y_i)p_i(delta_i 1−p 1), which gives−0.007928168. The squared loss remains a proper scoring objective; its local optimization signal differs from CE.",
    "answer": "Cross-entropy −0.996; squared probability error about−0.00793. The latter retains the softmax Jacobian factors."
  },
  {
    "question": "A wildlife classifier has four labels. For one photo labeled fox, it mixes the one-hot target with a uniform distribution of weight 0.20. The four logits can vary freely. At minimum cross-entropy, what probabilities does softmax give fox and each rival, and what is the fox logit minus one rival’s logit?",
    "options": [
      "Fox 0.80, each rival 1/15, gap ln(12).",
      "Fox 0.85, each rival 0.05, gap 17.",
      "Fox 0.85, each rival 0.05, gap ln(17).",
      "Fox 0.80, each rival 1/15, gap 12."
    ],
    "explanation": "Each label gets 0.20/4 = 0.05 from smoothing. Fox also keeps 0.80 from the one-hot target, bringing its share to 0.85. Cross-entropy reaches its minimum when the predictions match these shares. Dividing the two softmax probabilities cancels their shared denominator, so 0.85/0.05 = 17 is the exponential of the logit gap. The gap is ln(17), about 2.83. Splitting 0.20 among only the three rivals would give each 1/15 and leave fox at 0.80. That would give a ratio of 12 and a gap of ln(12).",
    "answer": "Fox 0.85, each rival 0.05, gap ln(17)."
  },
  {
    "question": "A supervised finite-logit row has target 1 and padding class 2, with no class weights or smoothing. CrossEntropyLoss uses ignore_index=2 but retains target 1. Which denominator and mathematical gradient behavior follows?",
    "options": [
      "Denominator keeps class 2; its non-target logit gradient is p 2 while the retained target 1 position is supervised.",
      "Denominator removes target 1; padding class 2 receives p 2−1 while the retained position uses its original target.",
      "Denominator removes class 2; its logit gradient is zero while the retained target 1 position is supervised.",
      "Denominator is unused for this row; its three gradients are zero because padding class 2 exists in the vocabulary."
    ],
    "explanation": "ignore_index tests the target value at a position. This target is 1, so it is supervised and every permitted vocabulary class participates in its softmax. Excluding class 2 requires a separate candidate mask that changes the objective.",
    "answer": "Denominator keeps class 2; its non-target logit gradient is p 2 while the retained target 1 position is supervised."
  },
  {
    "question": "Three uniform three-class positions each target a different class. Their class weights are 2, 3, 7. Without smoothing, how do PyTorch means differ for integer targets versus equivalent float one-hot targets?",
    "options": [
      "Integer mean 4 ln 3; float mean 4 ln 3. Both divide the weighted numerator 12 ln 3 by the three positions.",
      "Integer mean ln 3; float mean ln 3. Both divide the weighted numerator 12 ln 3 by the twelve target weights.",
      "Integer mean 4 ln 3; float mean ln 3. Integer targets divide by 3 positions; float targets divide by weight sum 12.",
      "Integer mean ln 3; float mean 4 ln 3. Integer targets divide by weight sum 12; float targets divide by 3 positions."
    ],
    "answer": "Integer mean ln 3; float mean 4 ln 3. Integer targets divide by weight sum 12; float targets divide by 3 positions.",
    "explanation": "Each ordinary position loss is ln 3. The weighted numerator is(2+3+7)ln 3=12 ln 3. Integer-label mean divides by the 12 target weights, returning ln 3. Float one-hot mean divides by 3 positions, returning 4 ln 3. The same general reduction rule applies with fresh class counts and weights."
  }
]
```

> **Next:** Continue to [RNNs, LSTMs, GRUs, and Sequence Modeling](/learn/rnns-lstms-grus-sequence-modeling). You can now turn competing logits into a stable loss and a correction signal at each supervised position. Next you'll build the first model in this path that carries ordered history forward, so those next-token logits can depend on what came before.
