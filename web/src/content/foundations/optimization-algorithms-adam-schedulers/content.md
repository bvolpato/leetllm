---
{
  "id": "optimization-algorithms-adam-schedulers",
  "title": "Adam, Momentum, Schedulers",
  "slug": "optimization-algorithms-adam-schedulers",
  "section": "Math & Statistics",
  "category": "Fine-Tuning & Training",
  "difficulty": "Easy",
  "order": 4,
  "prerequisites": [
    "calculus-gradients-backpropagation-optimization",
    "linear-algebra-machine-learning-deeper"
  ],
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Two parameters sit one unit from their target, but one gradient is 100 times steeper. Each optimizer buffer stores a different response to that mismatch.",
  "keyConceptsTested": [
    "SGD on an uneven quadratic loss",
    "momentum as smoothed gradient direction",
    "RMSProp as a squared-gradient scale",
    "Adam first and second moment estimates with bias correction",
    "objective scaling and unequal microbatch accumulation",
    "AdamW decoupled weight decay",
    "warmup and decay schedules",
    "global-norm gradient clipping",
    "optimizer and scheduler checkpoint state",
    "optimizer-state memory cost and training diagnostics"
  ]
}
---

Two model parameters are each one unit from their best value. The loss gradient asks you to change one 100 times more than the other. How big should a training step be?

The [linear algebra lesson](/learn/linear-algebra-machine-learning-deeper) showed how a matrix can stretch different directions by different amounts. The same imbalance appears in optimization: a learning rate that barely moves one parameter can send another past its target. A **<span data-glossary="gradient">gradient</span>** gives the loss's local slope in each parameter direction, and an **<span data-glossary="optimizer">optimizer</span>** uses those slopes to choose an update. Moving against the gradient lowers a smooth loss for a sufficiently small step, yet a large step or an update built from past gradients can still overshoot and raise it.[^goodfellow2016]

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="A buffer rack after coordinate a receives gradients 100 and minus 80. SGD retains no moment; EMA momentum retains m2 = 1; RMSProp with rho 0.9 retains s2 = 1540; Adam and AdamW retain m2 = 1 and v2 = 16.39 with beta2 0.999. Float32 moment costs are zero, four, four, eight, and eight bytes per parameter. A separate zero-state AdamW example sends weight 10 directly to 9.99 by subtracting decay 0.01, while both moments stay zero." />
  <figcaption>The rack replays gradients 100 then −80 from zero state, using the article's normalized EMA momentum convention. Each filled cell stores one float32 moment and costs 4 bytes per parameter. The separate zero-state AdamW check applies decay directly to the weight, shrinking 10 to 9.99.</figcaption>
</figure>

The same two coordinates will show what changes when an update remembers past gradients, rescales them, shrinks the weights, or changes pace. The examples use NumPy on a CPU, and the final training loop uses PyTorch with no model download or GPU required.

## A 100-to-1 valley

Let `a` and `b` be the two parameter errors targeting `[0, 0]`. We use a quadratic loss so every gradient and update stays easy to verify by hand:

$$
L(a, b) = \frac{1}{2}(100a^2 + b^2)
$$

The coefficient 100 means the slope changes 100 times faster along `a` than along `b`. This is **curvature**. Feature importance requires a separate analysis of the task and model. In <span data-glossary="matrix">matrix</span> form:

$$
L(a, b) = \frac{1}{2}
\begin{bmatrix} a & b \end{bmatrix}
\begin{bmatrix} 100 & 0 \\ 0 & 1 \end{bmatrix}
\begin{bmatrix} a \\ b \end{bmatrix}
$$

$\mathrm{diag}(100, 1)$ has condition number 100, so a single step size fights the same uneven stretch that made inverse-like solves fragile in the last chapter. Differentiating gives the gradient vector:

$$
\nabla L(a, b) = [100a, b]
$$

At `[1, 1]`, the loss is `50.5` and the gradient is `[100, 1]`. Equal coordinate error produces wildly unequal correction requests, with `a` asking for a step 100 times larger than `b`. Run this calculation and inspect both coordinates alongside the loss:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="measure-the-loss-valley.py"
import numpy as np


def loss(w: np.ndarray) -> float:
    return float(0.5 * (100.0 * w[0] ** 2 + w[1] ** 2))


def gradient(w: np.ndarray) -> np.ndarray:
    return np.array([100.0 * w[0], w[1]])


w = np.array([1.0, 1.0])
g = gradient(w)
next_w = w - 0.018 * g

print("start loss", loss(w))
print("gradient", g.tolist())
print("one step", next_w.round(3).tolist())
print("next loss", round(loss(next_w), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
start loss 50.5
gradient [100.0, 1.0]
one step [-0.8, 0.982]
next loss 32.482
```
<!-- leetllm: output:end -->

The loss falls after one step, yet the individual coordinates reveal the problem immediately. Coordinate `a` crosses from `1.0` to `-0.8`, bouncing across zero in the classic zigzag while the shallow coordinate `b` barely walks to `0.982`. A smaller learning rate would calm the steep wall, but it would slow progress along the valley floor even further.

## SGD gives every coordinate one learning rate

Separating two design choices clarifies what **stochastic gradient descent (SGD)** actually specifies: where the gradient estimate comes from and how the optimizer applies it.

| Method | Gradient source | What the optimizer sees |
|---|---|---|
| full-batch gradient descent | every training example | an exact gradient for the current dataset |
| stochastic gradient descent | one example, or a small randomly selected batch | a noisy estimate of the full gradient |
| minibatch training | a batch containing several examples | the usual practical form of SGD, with noise that depends on batch size |

This walkthrough uses a deterministic two-coordinate gradient so the loss geometry stays visible. It stands in for a minibatch gradient without adding sampling noise. Real training adds that noise, so log batch size and gradient statistics when comparing optimizers.

Once the gradient source is fixed, SGD applies a single rule:

$$
w_t = w_{t-1} - \eta g_t
$$

Here, $w_t$ is the parameter vector after step $t$ and $g_t$ is the minibatch gradient. $\eta$ (eta) is the **<span data-glossary="learning-rate">learning rate</span>**, the scalar step-size multiplier shared by every parameter. Running three different rates for eight steps shows which rate keeps `a` stable and how far each rate moves `b`:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="sgd-needs-one-rate-for-two-speeds.py"
import numpy as np


def loss(w: np.ndarray) -> float:
    return float(0.5 * (100.0 * w[0] ** 2 + w[1] ** 2))


def gradient(w: np.ndarray) -> np.ndarray:
    return np.array([100.0 * w[0], w[1]])


def run_sgd(lr: float, steps: int = 8) -> tuple[np.ndarray, float]:
    w = np.array([1.0, 1.0])
    for _ in range(steps):
        w -= lr * gradient(w)
    return w, loss(w)


for lr in (0.005, 0.018, 0.021):
    w, final_loss = run_sgd(lr)
    print(f"lr={lr:.3f} w={w.round(3).tolist()} loss={final_loss:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
lr=0.005 w=[0.004, 0.961] loss=0.462
lr=0.018 w=[0.168, 0.865] loss=1.781
lr=0.021 w=[2.144, 0.844] loss=230.105
```
<!-- leetllm: output:end -->

The small rate keeps `a` calm and reports the lowest loss of the three runs, leaving `b` at `0.961` after eight steps and proving that a larger rate does not automatically learn faster. The middle rate drives down `a` while `b` still crawls. To find the exact stability threshold, substitute the gradient into the update: `a_next = (1 - 100 * lr) * a`. Its magnitude shrinks only when `abs(1 - 100 * lr) < 1`, which gives `0 < lr < 0.02`. At `0.02`, `a` flips sign without shrinking; at `0.021`, the multiplier is `-1.1`, so oscillation grows every step.

```checkpoint
Why can't increasing SGD's learning rate solve the slow progress on `b` here?
---
The same rate also multiplies the much steeper gradient on `a`. Once the rate exceeds `0.02`, the `a` update flips sign and grows instead of shrinking. A rate safe for `a` leaves `b` comparatively slow.
```

## Momentum remembers directions that agree

SGD reacts only to the current gradient, forgetting that the previous step was already crossing the narrow wall. **Momentum** keeps a signed moving average of recent gradients, written here in the exponential-moving-average convention so it matches Adam's first buffer. This is a normalized teaching form of Polyak's heavy-ball idea from [his 1964 paper on accelerating iterative methods](https://www.mathnet.ru/eng/zvmmf7713):

$$
m_t = \beta m_{t-1} + (1 - \beta)g_t
$$

$$
w_t = w_{t-1} - \eta m_t
$$

The coefficient $\beta$ controls memory: with $\beta = 0.9$, the new gradient contributes `0.1` and the previous direction contributes `0.9`. PyTorch's `torch.optim.SGD` uses an unnormalized buffer that starts at the first gradient and updates via `buffer = beta * buffer + gradient`, so our `m` equals `(1 - beta)` times that buffer. Multiply our learning rate by `(1 - beta)` to reproduce these updates in PyTorch, and verify initialization and dampening in the [official SGD docs](https://docs.pytorch.org/docs/stable/generated/torch.optim.SGD.html) before porting hyperparameters.

Feed momentum a prescribed four-gradient history: large alternating values for `a`, small positive values for `b`. These are inputs chosen to expose the buffers, not gradients produced by a momentum run. We'll reuse them for RMSProp and Adam. Which signs cancel, and which reinforce one another?

<!-- leetllm: test, deps=numpy, output=show -->
```python title="momentum-cancels-zigzag.py"
import numpy as np

beta = 0.9
gradients = [
    np.array([100.0, 1.00]),
    np.array([-80.0, 0.98]),
    np.array([70.0, 0.96]),
    np.array([-60.0, 0.94]),
]
m = np.zeros(2)

for step, g in enumerate(gradients, start=1):
    m = beta * m + (1.0 - beta) * g
    print(step, "gradient", g.round(2).tolist(), "memory", m.round(3).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1 gradient [100.0, 1.0] memory [10.0, 0.1]
2 gradient [-80.0, 0.98] memory [1.0, 0.188]
3 gradient [70.0, 0.96] memory [7.9, 0.265]
4 gradient [-60.0, 0.94] memory [1.11, 0.333]
```
<!-- leetllm: output:end -->

The first buffer stays positive throughout this trace, even when the current gradient is negative. Opposing gradients partially cancel: on step two, `0.9 * 10 + 0.1 * (-80) = 1`. The second buffer grows from `0.1` to about `0.333` because every gradient reinforces the same sign. These signed averages are what momentum subtracts from the parameters after multiplying by the learning rate.

Momentum still needs a suitable learning rate for each surface. It changes the path: useful repeated direction builds up, while alternating motion is damped. Now compare measured paths on the same loss instead of assuming that adding a buffer guarantees a win.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="compare-sgd-and-momentum-paths.py"
import numpy as np


def loss(w: np.ndarray) -> float:
    return float(0.5 * (100.0 * w[0] ** 2 + w[1] ** 2))


def gradient(w: np.ndarray) -> np.ndarray:
    return np.array([100.0 * w[0], w[1]])


def sgd(steps: int, lr: float) -> np.ndarray:
    w = np.array([1.0, 1.0])
    for _ in range(steps):
        w -= lr * gradient(w)
    return w


def momentum(steps: int, lr: float, beta: float = 0.9) -> np.ndarray:
    w = np.array([1.0, 1.0])
    m = np.zeros_like(w)
    for _ in range(steps):
        m = beta * m + (1.0 - beta) * gradient(w)
        w -= lr * m
    return w


for name, w in [
    ("sgd", sgd(40, lr=0.018)),
    ("momentum", momentum(40, lr=0.018)),
]:
    print(name, "w", w.round(4).tolist(), "loss", round(loss(w), 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sgd w [0.0001, 0.4836] loss 0.1169
momentum w [0.0307, 0.5324] loss 0.1889
```
<!-- leetllm: output:end -->

At this unchanged numeric learning rate, SGD ends lower than our EMA-style momentum run because momentum changes the effective update scale. Adding momentum usually calls for its own learning-rate and decay sweep, guided by measured runs rather than fixed heuristics.

## RMSProp rescales by recent gradient magnitude

Momentum smooths signed direction, yet it still sends every coordinate through one global learning rate. RMSProp keeps an unsigned exponential moving average of squared gradients instead, documented by Tieleman and Hinton in their [2012 RMSProp lecture note](https://www.cs.toronto.edu/~tijmen/csc321/slides/lecture_slides_lec6.pdf):

$$
s_t = \rho s_{t-1} + (1 - \rho)g_t^2
$$

$$
w_t = w_{t-1} - \eta \frac{g_t}{\sqrt{s_t} + \epsilon}
$$

The `s` buffer forgets old squared magnitudes while keeping a coordinate's denominator proportional to recent gradient scale. Unlike momentum's signed buffer, squaring keeps `s` from canceling when signs alternate, so each RMSProp update retains the current gradient's sign while rescaling coordinates toward comparable step sizes. Notice that this basic form has no Adam-style bias correction.

PyTorch calls `rho` `alpha`, with documented `RMSprop` defaults `lr=0.01`, `alpha=0.99`, and `eps=1e-8` ([official docs](https://docs.pytorch.org/docs/stable/generated/torch.optim.RMSprop.html)). Because PyTorch adds $\epsilon$ after the square root while some other libraries add it inside, copying $\epsilon$ directly across implementations can silently alter small updates. We run the four-step gradient trace with `rho=0.9` below so the denominator catches up quickly and reveals how the first 100:1 gap shrinks right away:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="rmsprop-tracks-squared-gradient-scale.py"
import numpy as np

rho, lr, eps = 0.9, 0.01, 1e-8
gradients = [
    np.array([100.0, 1.00]),
    np.array([-80.0, 0.98]),
    np.array([70.0, 0.96]),
    np.array([-60.0, 0.94]),
]
s = np.zeros(2)

for step, g in enumerate(gradients, start=1):
    s = rho * s + (1.0 - rho) * g**2
    update = lr * g / (np.sqrt(s) + eps)
    print(step, "rms", np.sqrt(s).round(3).tolist(), "step", update.round(5).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1 rms [31.623, 0.316] step [0.03162, 0.03162]
2 rms [39.243, 0.431] step [-0.02039, 0.02272]
3 rms [43.313, 0.51] step [0.01616, 0.01884]
4 rms [45.259, 0.567] step [-0.01326, 0.01657]
```
<!-- leetllm: output:end -->

The first row gives both coordinates nearly the same update magnitude, despite the 100:1 raw gradients. With `rho=0.9`, the first denominator is about `sqrt(0.1) * abs(g)`, so the update magnitude is `lr / sqrt(0.1)`, about `0.03162`. Later, the first coordinate's denominator stays large, but its update follows the latest gradient sign. Here and below, `update` means the vector we **subtract** from the parameters.

That is the handoff to Adam: add momentum's signed `m` buffer to this RMSProp-like `v` buffer, then correct both buffers for their zero start.

| Method | State per coordinate | Update scale | Keeps signed direction? |
|---|---|---|---|
| SGD | none | one global learning rate | current gradient only |
| momentum | signed `m` | one global learning rate | smoothed history |
| RMSProp | squared `s` | `1 / (sqrt(s) + eps)` | current gradient only |
| Adam | signed `m` and squared `v` | `1 / (sqrt(v_hat) + eps)` after bias correction | smoothed, bias-corrected history |

## Adam stores direction and squared-gradient scale

The <span data-glossary="adam-optimizer">Adam optimizer</span> (Adaptive Moment Estimation) keeps the signed average for direction and adds a second moving average for scale: the elementwise square of gradients. Its original formulation is:[^kingma2015]

$$
m_t = \beta_1 m_{t-1} + (1 - \beta_1)g_t
$$

$$
v_t = \beta_2 v_{t-1} + (1 - \beta_2)g_t^2
$$

$$
\hat{m}_t = \frac{m_t}{1 - \beta_1^t},
\qquad
\hat{v}_t = \frac{v_t}{1 - \beta_2^t}
$$

$$
w_t = w_{t-1} - \eta \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}
$$

Read the four lines as two decisions. `m` chooses a direction from recent signs; `v` measures how large recent gradients have been. Bias correction turns those startup-shrunken buffers into the hatted estimates used by the update.

The symbols have precise jobs:

| Symbol | Meaning | What it remembers |
|---|---|---|
| $m_t$ | first-moment estimate | recent signed direction |
| $v_t$ | uncentered second-moment estimate | recent squared gradient magnitude |
| $\hat{m}_t, \hat{v}_t$ | bias-corrected estimates | startup-adjusted state |
| $\epsilon$ | small denominator guard | avoids division by a near-zero scale |

Kingma and Ba's usual defaults are $\beta_1 = 0.9$, $\beta_2 = 0.999$, and $\epsilon = 10^{-8}$, with $\epsilon$ added outside the square root in the denominator.[^kingma2015] PyTorch's `AdamW` starts with `lr=1e-3`, those same `betas` and `eps`, and `weight_decay=1e-2` ([PyTorch AdamW docs](https://docs.pytorch.org/docs/stable/generated/torch.optim.AdamW.html)); tune these values for the model and dataset before comparing training runs.

Notice that `v` is often casually called <span data-glossary="variance">variance</span>, even though Adam averages `g ** 2` without subtracting a mean gradient. On step 1 from zero state, bias correction divides out the `(1 - beta)` startup factors completely, so gradients of `100` and `1` yield wildly different moment scales yet nearly identical update steps equal to the learning rate:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="adam-first-step-normalizes-magnitude.py"
import numpy as np

g = np.array([100.0, 1.0])
beta1, beta2, lr, eps = 0.9, 0.999, 0.01, 1e-8
m = (1.0 - beta1) * g
v = (1.0 - beta2) * g**2
m_hat = m / (1.0 - beta1)
v_hat = v / (1.0 - beta2)
update = lr * m_hat / (np.sqrt(v_hat) + eps)

print("m_hat", m_hat.tolist())
print("v_hat", v_hat.tolist())
print("update", update.round(6).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
m_hat [100.0, 1.0]
v_hat [10000.0, 1.0]
update [0.01, 0.01]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/adam_coordinate_scaling_dark.png" alt="Adam replays four gradients from zero moments with learning rate 0.01, beta1 0.9, and beta2 0.999. Left: magnitude plot shows coordinate a updates 0.01, 0.00058, 0.00346, 0.00041 while b stays near 0.01. Right: at step 4, corrected direction 3.228 divided by scale 78.902 times 0.01 gives a step near 0.00041, while direction 0.967 divided by scale 0.970 gives b a step near 0.00997, about 24.4 times a." />
  <figcaption>Replay four chosen gradients through Adam's buffers. Alternating signs partly cancel in <code>a</code>'s numerator while squared magnitudes stay large, whereas the steady <code>b</code> history keeps its step near the learning rate. Stepping through a fixed four-gradient sequence isolates first- and second-moment buffer mechanics.</figcaption>
</figure>

Now replay the same prescribed history used for momentum and RMSProp. Look especially at steps two and four, when `a`'s raw gradient is negative:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="adam-uses-history-not-one-large-gradient.py"
import numpy as np

gradients = [
    np.array([100.0, 1.00]),
    np.array([-80.0, 0.98]),
    np.array([70.0, 0.96]),
    np.array([-60.0, 0.94]),
]
beta1, beta2, lr, eps = 0.9, 0.999, 0.01, 1e-8
m = np.zeros(2)
v = np.zeros(2)

for t, g in enumerate(gradients, start=1):
    m = beta1 * m + (1.0 - beta1) * g
    v = beta2 * v + (1.0 - beta2) * g**2
    m_hat = m / (1.0 - beta1**t)
    v_hat = v / (1.0 - beta2**t)
    update = lr * m_hat / (np.sqrt(v_hat) + eps)
    print(t, "m_hat", m_hat.round(3).tolist(), "step", update.round(5).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1 m_hat [100.0, 1.0] step [0.01, 0.01]
2 m_hat [5.263, 0.989] step [0.00058, 0.00999]
3 m_hat [29.151, 0.979] step [0.00346, 0.00998]
4 m_hat [3.228, 0.967] step [0.00041, 0.00997]
```
<!-- leetllm: output:end -->

Unlike RMSProp, Adam still subtracts a positive value from `a` on steps two and four. Its signed average hasn't turned negative yet. Momentum can keep a parameter moving against the current gradient, so smoothing doesn't guarantee descent on every step. The consistently positive `b` history keeps its update near `0.01`.

Adam isn't finding curvature or proving which feature matters. It transforms recent gradient history into coordinate-wise steps. That distinction matters when you diagnose a run: adaptive scaling isn't a geometry oracle.

Changing a loss from a mean to a sum multiplies its gradient by the number of items being averaged. SGD's update grows by that factor at the same learning rate. Adam nearly cancels a fixed positive factor applied to the **entire gradient history**: `m_hat` scales by that factor and `sqrt(v_hat)` does too. This cancellation is exact only when epsilon is zero and the denominator is nonzero.[^kingma2015]

With nonzero epsilon, tiny gradients behave differently. At the first step from zero state, the update is `lr * g / (abs(g) + eps)`. Keep `lr=0.01` and `eps=1e-8`, then shrink the gradient:

<!-- leetllm: test, output=show -->
```python title="epsilon-limits-adam-scale-cancellation.py"
lr, eps = 0.01, 1e-8
for g in [1.0, 1e-8, 1e-10]:
    update = lr * g / (abs(g) + eps)
    print(f"gradient {g:.0e} update {update:.8f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
gradient 1e+00 update 0.01000000
gradient 1e-08 update 0.00500000
gradient 1e-10 update 0.00009901
```
<!-- leetllm: output:end -->

The gradient equal to epsilon gets half the learning-rate-sized update. A changing scale, clipping, coupled L2, or a switch in loss reduction midway through a run also breaks the simple cancellation argument. Record the objective's reduction and denominator along with the optimizer settings.

```checkpoint
Adam begins with zero moments. Its first gradient is [−9, 0.09], rate 0.002 and epsilon 0, with ordinary bias correction and valid betas. Which subtracted update and second-buffer meaning are correct?
---
[−0.002, 0.002]; uncentered squared magnitude.

First-step corrected moments are g and g², so dividing by |g| gives [−1, 1]. The update is [−0.002, 0.002]. The squared-gradient average is uncentered: Adam does not subtract a mean to form statistical variance.
```

## Bias correction repairs zero-initialized state

Because both moving averages begin at zero, early buffer values are pulled toward zero rather than matching the true scale of incoming gradients. With Adam's usual coefficients, the first raw first-moment buffer is `0.1 * g` and the first raw second-moment buffer is `0.001 * g**2`, so dividing those raw values without adjustment would make the startup update far too large. Bias correction divides out that startup damping, as the next scalar comparison demonstrates:

<!-- leetllm: test, output=show -->
```python title="bias-correction-repairs-startup-scale.py"
import math

gradient = 4.0
beta1, beta2, lr, eps = 0.9, 0.999, 0.01, 1e-8
m = (1.0 - beta1) * gradient
v = (1.0 - beta2) * gradient**2

uncorrected_step = lr * m / (math.sqrt(v) + eps)
m_hat = m / (1.0 - beta1)
v_hat = v / (1.0 - beta2)
corrected_step = lr * m_hat / (math.sqrt(v_hat) + eps)

print("uncorrected step", round(uncorrected_step, 5))
print("corrected step", round(corrected_step, 5))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
uncorrected step 0.03162
corrected step 0.01
```
<!-- leetllm: output:end -->

Why divide by `1 - beta**t`? If every gradient were the same value `g`, the first two averages would be `(1 - beta) * g` and `(1 - beta**2) * g`. After `t` steps, the weights on observed gradients sum to `1 - beta**t`; division restores that sum to one. It removes the zero-start effect, not the uncertainty or lag in a changing gradient history.

```checkpoint
Why isn't `v_t` the statistical variance of a coordinate's gradient?
---
Adam updates `v_t` from squared gradients, `g_t ** 2`, without subtracting a mean. It's an uncentered second-moment estimate: a running measure of squared magnitude.
```

```checkpoint
A cold-start scalar Adam step uses positive gradient 10^−7, epsilon 10^−7 and rate 0.02. With bias correction, what update is subtracted?
---
0.01

At the first step, corrected normalization is rate×g/(|g|+epsilon). Here the two denominator terms are equal, so the result is half the rate, 0.01. Ignoring epsilon would incorrectly give 0.02.
```

```checkpoint
From zero moments, scalar gradient 5 enters Adam with beta 1=0.8, beta 2=0.99, rate 0.03 and epsilon 0. What are the raw-buffer and bias-corrected first updates?
---
Raw 0.06; corrected 0.03.

The raw buffers are m=1 and v=0.25. Their ratio is 2, giving 0.06. Correction divides by 0.2 and 0.01, yielding m_hat=5, v_hat=25 and update 0.03. Unequal startup weights cannot be ignored.
```

## AdamW separates data gradients from weight shrinkage

Regularization often nudges parameter magnitudes downward by adding an L2 penalty $\frac{\lambda}{2}\lVert w \rVert_2^2$ whose gradient is $\lambda w$. With ordinary SGD, that penalty produces the same shrinkage behavior as <span data-glossary="weight-decay">weight decay</span> after adjusting coefficients, whereas in adaptive optimizers putting the penalty inside Adam's gradient also sends it through coordinate-wise moment scaling.[^loshchilov2019] To keep the two effects cleanly separated, AdamW applies decoupled weight decay directly to the prior parameter value:

$$
w_t =
w_{t-1}
- \eta \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}
- \eta \lambda w_{t-1}
$$

Here $\lambda$ is the weight-decay coefficient, making the data-gradient update and weight-shrinkage term visibly distinct. Even on the very first step with zero data gradient and zero moment buffers, a parameter starting at `10.0` updates differently under the two rules:

<!-- leetllm: test, output=show -->
```python title="adamw-keeps-decay-outside-adaptive-scaling.py"
theta = 10.0
lr = 0.1
weight_decay = 0.01
eps = 1e-8

adamw_theta = theta - lr * weight_decay * theta

# Gradient of (weight_decay / 2) * theta**2.
coupled_gradient = weight_decay * theta
coupled_adam_step = lr * coupled_gradient / (abs(coupled_gradient) + eps)
coupled_theta = theta - coupled_adam_step

print("AdamW with zero data gradient", round(adamw_theta, 4))
print("Adam plus coupled L2 first step", round(coupled_theta, 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
AdamW with zero data gradient 9.99
Adam plus coupled L2 first step 9.9
```
<!-- leetllm: output:end -->

The penalty has entered both Adam buffers in the coupled version. In <span data-glossary="adamw">AdamW</span>, it enters neither: the parameter shrinks by the separate factor `1 - lr * weight_decay`. Decoupled doesn't mean independent of the schedule, because `lr` still multiplies the decay. In PyTorch, a zero gradient tensor also differs from `grad=None`: the optimizer skips parameters with no gradient, including their decay. [AdamW API](https://docs.pytorch.org/docs/stable/generated/torch.optim.AdamW.html)

PyTorch's `torch.optim.Adam(..., decoupled_weight_decay=True)` also enables AdamW behavior, whereas its default `False` keeps coupled L2. Check the constructor arguments rather than assuming behavior from the class name alone. [Adam API](https://docs.pytorch.org/docs/stable/generated/torch.optim.Adam.html)

```checkpoint
Two independent PyTorch AdamW runs start weight 8 with zero moments, rate 0.05 and decay 0.02. One has an explicit zero gradient tensor; the other has grad=None. What weights follow one step?
---
Zero tensor 7.992; None 8.

The zero tensor triggers AdamW’s step and separate decay, giving 7.992 in this cold-start example. A parameter with no gradient is skipped, including its decay, so it remains 8. A zero gradient is not the same state as an absent gradient.
```

## Schedules change pace across the run

While an optimizer decides how to apply gradients on a single step, a **learning-rate schedule** adapts the global multiplier $\eta$ across different phases of training.

| Phase | What you're controlling | A measurable reason to adjust pace |
|---|---|---|
| startup | avoid a large initial global step | loss or gradient norm spikes immediately |
| middle | make progress while the model learns | validation loss is still improving |
| late | reduce movement around a good region | progress becomes noisy or stalls |

The original <span data-glossary="transformer">Transformer</span> training recipe paired Adam ($\beta_1 = 0.9$, $\beta_2 = 0.98$, $\epsilon = 10^{-9}$) with a schedule that linearly increased the learning rate for `4000` warmup steps before decaying inversely with the square root of the step number.[^vaswani2017] Those constants differ from Kingma and Ba's defaults and simply record one successful setup rather than a universal law. Later work such as [Loshchilov and Hutter](https://arxiv.org/abs/1608.03983) studied cosine annealing and warm restarts separately, so always validate schedules empirically on your own workload.

Warmup followed by cosine decay is easy to trace by hand. In the zero-based convention below, `step` counts optimizer updates rather than batches or epochs: update zero starts at learning rate `0`, update `warmup_steps` reaches the peak, and update `total_steps - 1` lands at `final_lr`. Because other implementations begin at a small positive rate on step zero, always check index conventions when adapting schedule code:

<!-- leetllm: test, output=show -->
```python title="warmup-then-cosine-schedule.py"
import math


def warmup_cosine(step: int, total_steps: int, warmup_steps: int, peak_lr: float, final_lr: float) -> float:
    if not 0 <= warmup_steps < total_steps - 1:
        raise ValueError("leave at least two schedule points at or after the peak")
    if not 0 <= step < total_steps:
        raise ValueError("step must be within the run")
    if not 0 <= final_lr <= peak_lr < float("inf"):
        raise ValueError("rates must be finite and satisfy 0 <= final_lr <= peak_lr")
    if step < warmup_steps:
        return peak_lr * step / warmup_steps
    progress = (step - warmup_steps) / (total_steps - warmup_steps - 1)
    cosine = 0.5 * (1.0 + math.cos(math.pi * progress))
    return final_lr + (peak_lr - final_lr) * cosine


values = [
    warmup_cosine(step, total_steps=10, warmup_steps=2, peak_lr=3e-4, final_lr=3e-5)
    for step in range(10)
]
print([f"{lr:.6f}" for lr in values])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
['0.000000', '0.000150', '0.000300', '0.000287', '0.000249', '0.000195', '0.000135', '0.000081', '0.000043', '0.000030']
```
<!-- leetllm: output:end -->

Here the peak is at index `2` and the final rate at index `9`. With gradient accumulation, several batches can contribute to one optimizer update; don't advance this schedule on each of those batches. Log the actual rate used alongside the loss so an off-by-one error is visible.

A zero learning rate leaves the parameters unchanged, but an Adam step still updates its moment buffers and step count when gradients are present. Here, update zero contributes history for later updates. A zero rate is different from skipping `optimizer.step()`.

### Accumulate the objective you intended

**Gradient accumulation** adds gradients from several microbatches before one optimizer update. For equally sized microbatches with a mean loss, divide each loss by the number of microbatches. With unequal sizes, weight each mean by its share of the total items. Otherwise you're averaging microbatch means, giving a smaller microbatch's items more weight.

Use a scalar prediction `w=1` and squared-error targets `[0, 2, 4]`, split unequally into one item and two items. The full-batch mean gradient is `(2 - 2 - 6) / 3 = -2`, whereas weighting each microbatch equally averages microbatch means and changes the gradient:

<!-- leetllm: test, deps=torch, output=show -->
```python title="unequal-microbatches-need-item-weights.py"
import torch

targets = torch.tensor([0.0, 2.0, 4.0])
for mode in ["full batch", "weighted accumulation", "mean of means"]:
    w = torch.tensor(1.0, requires_grad=True)
    if mode == "full batch":
        ((w - targets) ** 2).mean().backward()
    else:
        for microbatch in [targets[:1], targets[1:]]:
            weight = len(microbatch) / len(targets) if mode == "weighted accumulation" else 0.5
            (((w - microbatch) ** 2).mean() * weight).backward()
    print(mode, "gradient", w.grad.item(), "SGD result", round((w - 0.1 * w.grad).item(), 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
full batch gradient -2.0 SGD result 1.2
weighted accumulation gradient -2.0 SGD result 1.2
mean of means gradient -1.0 SGD result 1.1
```
<!-- leetllm: output:end -->

Weighted accumulation matches the full-batch update; the mean of means changes it. For a per-token mean, count valid loss-bearing tokens rather than sequences. Normalize a final partial accumulation window by its actual item count. Accumulation matches a large batch's gradient only when the forward computation for each item is also equivalent; batch-dependent operations can change that computation.

For equal sizes across distributed training processes, effective batch size is `microbatch_size * accumulation_steps * world_size`, where `world_size` counts those processes. Each process contributes its local gradients to the distributed update. This count gives the data per optimizer update. Choose learning-rate scaling based on the optimizer and training regime. After all backward passes in a window, clip once, step once, advance a per-update schedule once, and clear gradients. With AMP, keep the scaler's scale fixed within that window and unscale only after accumulation finishes. [PyTorch accumulation guidance](https://docs.pytorch.org/docs/2.14/notes/amp_examples.html#gradient-accumulation)

## Gradient clipping limits the input to the optimizer

A corrupted sample or unusually difficult batch can spike the gradient norm across the entire model. **Global-norm <span data-glossary="gradient-clipping">gradient clipping</span>** concatenates every parameter gradient conceptually into one vector, computes its L2 norm, and rescales all coordinates uniformly whenever that norm exceeds a threshold $c > 0$:

$$
g_{\text{used}} =
\begin{cases}
g, & \lVert g \rVert_2 \leq c \\
g \frac{c}{\lVert g \rVert_2}, & \lVert g \rVert_2 > c
\end{cases}
$$

Because every entry multiplies by the same positive factor, clipping preserves the gradient direction while shrinking an outlier step before the optimizer updates its moment buffers or parameters. Compare an ordinary gradient vector `[3, 4]` against an outlier `[300, 400]` under a threshold of `5.0`:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="clip-one-outlier-gradient.py"
import numpy as np


def clip_global_norm(gradient: np.ndarray, max_norm: float) -> tuple[np.ndarray, float]:
    if not np.isfinite(max_norm) or max_norm <= 0:
        raise ValueError("max_norm must be finite and positive")
    norm = float(np.linalg.norm(gradient))
    if not np.isfinite(norm):
        raise ValueError("gradient norm must be finite")
    if norm == 0.0:
        return gradient.copy(), norm
    scale = min(1.0, max_norm / norm)
    return gradient * scale, norm


ordinary = np.array([3.0, 4.0])
outlier = np.array([300.0, 400.0])

for name, g in [("ordinary", ordinary), ("outlier", outlier)]:
    clipped, original_norm = clip_global_norm(g, max_norm=5.0)
    print(name, "before", original_norm, "after", round(float(np.linalg.norm(clipped)), 3), "value", clipped.round(2).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ordinary before 5.0 after 5.0 value [3.0, 4.0]
outlier before 500.0 after 5.0 value [3.0, 4.0]
```
<!-- leetllm: output:end -->

Clipping limits the optimizer's gradient input rather than capping the full AdamW parameter update at that same threshold, since Adam state, learning rate, and weight decay still shape the final step. For example, at Adam's first step, both `[300, 400]` and its clipped counterpart `[3, 4]` yield updates close to `[lr, lr]` when epsilon is negligible, though clipping still alters the squared history stored for later steps. Apply clipping after backward passes and before `optimizer.step()`, because `step()` updates both `m` and `v` alongside the weights; if clipping fires on nearly every batch, inspect data quality, <span data-glossary="loss-scaling">loss scaling</span>, or the threshold instead of ignoring the signal.

## Build it: optimize the valley with AdamW

Implement AdamW from the equations above and compare it with SGD on the same 100-to-1 valley, logging both the final loss and individual coordinate errors. Because adaptive scaling changes effective step size, each optimizer uses its own peak learning rate. Even on convex problems, plain Adam can diverge on pathological gradient sequences, which motivated variants like AMSGrad that keep a non-decreasing maximum second moment.[^reddi2018adam] In practice, compare full training recipes on held-out loss at a fixed compute budget.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="build-adamw-on-the-valley.py"
import math
import numpy as np


def loss(w: np.ndarray) -> float:
    return float(0.5 * (100.0 * w[0] ** 2 + w[1] ** 2))


def gradient(w: np.ndarray) -> np.ndarray:
    return np.array([100.0 * w[0], w[1]])


def cosine_lr(step: int, total_steps: int, peak_lr: float) -> float:
    return peak_lr * 0.5 * (1.0 + math.cos(math.pi * step / (total_steps - 1)))


def run_sgd(steps: int = 80) -> np.ndarray:
    w = np.array([1.0, 1.0])
    for step in range(steps):
        w -= cosine_lr(step, steps, peak_lr=0.018) * gradient(w)
        assert np.isfinite(loss(w)), "SGD became non-finite"
    return w


def run_adamw(steps: int = 80) -> np.ndarray:
    w = np.array([1.0, 1.0])
    m = np.zeros_like(w)
    v = np.zeros_like(w)
    beta1, beta2, eps, decay = 0.9, 0.999, 1e-8, 0.01
    for step in range(1, steps + 1):
        g = gradient(w)
        m = beta1 * m + (1.0 - beta1) * g
        v = beta2 * v + (1.0 - beta2) * g**2
        m_hat = m / (1.0 - beta1**step)
        v_hat = v / (1.0 - beta2**step)
        lr = cosine_lr(step - 1, steps, peak_lr=0.08)
        old_w = w.copy()
        w -= lr * m_hat / (np.sqrt(v_hat) + eps)
        w -= lr * decay * old_w
        assert np.isfinite(loss(w)), "AdamW became non-finite"
    return w


for name, result in [("SGD", run_sgd()), ("AdamW", run_adamw())]:
    assert np.all(np.abs(result) < 1.0), f"{name}: a coordinate didn't shrink"
    print(name, "loss", round(loss(result), 6), "w", result.round(5).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
SGD loss 0.117302 w [-0.0, 0.48436]
AdamW loss 0.023509 w [0.02158, 0.02158]
```
<!-- leetllm: output:end -->

Why do AdamW's two coordinates end almost equal despite the 100:1 curvature? Starting from equal values, their gradient histories are nearly constant multiples of one another. Adam's numerator and denominator scale together, almost canceling that factor. SGD has no such normalization, so its `b` error remains much larger. This symmetry belongs to the constructed quadratic; real model selection still needs validation metrics.

## Use PyTorch after understanding the state

In a neural-network training loop, <span data-glossary="pytorch">PyTorch</span> computes gradients by <span data-glossary="backpropagation">backpropagation</span> and handles buffer updates inside tested optimizer classes. Clear old gradients with `zero_grad()`, run `backward()`, clip gradients, update the step's learning rate, and then call `optimizer.step()`. Capturing the pre-clipping norm returned by PyTorch's [`clip_grad_norm_()`](https://docs.pytorch.org/docs/stable/generated/torch.nn.utils.clip_grad_norm_.html) lets you track how often the <span data-glossary="guardrail">guardrail</span> fires, while passing `error_if_nonfinite=True` stops `NaN` or `Inf` gradients before they corrupt optimizer state. Note that the PyTorch loop below adds clipping and runs for 60 updates rather than 80, so its endpoints won't match the unclipped NumPy run numerically.

<!-- leetllm: test, deps=torch, output=show -->
```python title="pytorch-adamw-training-step.py"
import math
import torch

torch.manual_seed(0)
w = torch.nn.Parameter(torch.tensor([1.0, 1.0]))
optimizer = torch.optim.AdamW([w], lr=0.08, weight_decay=0.01)
clipped_updates = 0
max_gradient_norm = 0.0

for step in range(60):
    optimizer.zero_grad()
    loss = 0.5 * (100.0 * w[0] ** 2 + w[1] ** 2)
    loss.backward()
    gradient_norm = torch.nn.utils.clip_grad_norm_([w], max_norm=20.0, error_if_nonfinite=True).item()
    max_gradient_norm = max(max_gradient_norm, gradient_norm)
    clipped_updates += int(gradient_norm > 20.0)
    lr = 0.08 * 0.5 * (1.0 + math.cos(math.pi * step / 59))
    optimizer.param_groups[0]["lr"] = lr
    optimizer.step()

final_loss = 0.5 * (100.0 * w[0] ** 2 + w[1] ** 2)
print("loss", round(final_loss.item(), 6))
print("w", [round(value, 5) for value in w.detach().tolist()])
print("max pre-clip gradient norm", round(max_gradient_norm, 3))
print("clipped updates", clipped_updates)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
loss 0.047348
w [0.03062, 0.03062]
max pre-clip gradient norm 100.005
clipped updates 11
```
<!-- leetllm: output:end -->

This example assigns the current update's learning rate directly before `optimizer.step()`. If you use a built-in PyTorch <span data-glossary="learning-rate-schedule">scheduler</span> instead, call `scheduler.step()` after `optimizer.step()` so you don't skip the schedule's initial rate, and match the scheduler cadence to updates, epochs, or validation metrics as documented in [PyTorch's scheduler guide](https://docs.pytorch.org/docs/stable/optim.html#how-to-adjust-learning-rate).

When training in mixed precision with `GradScaler`, unscale gradients with `scaler.unscale_(optimizer)` before clipping so the norm limit applies to real gradient magnitudes ([PyTorch AMP clipping guide](https://docs.pytorch.org/docs/stable/notes/amp_examples.html#gradient-clipping)). If AMP skips an optimizer step due to nonfinite gradients, avoid stepping a per-update scheduler for that skipped batch and advance schedules only on completed updates.

### Resume the history, not just the weights

AdamW's next update depends on its moments and step count as well as the current parameters. A scheduler also needs its position and learning-rate state. Test that dependency on the same valley: save after three updates, then compare six uninterrupted updates with a resumed run and a weights-only restart.

<!-- leetllm: test, deps=torch, output=show -->
```python title="resume-optimizer-and-scheduler-state.py"
import copy
import torch


def make_run(value):
    w = torch.nn.Parameter(value.clone())
    optimizer = torch.optim.AdamW([w], lr=0.01, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=2, gamma=0.5)
    return w, optimizer, scheduler


def advance(run, steps):
    w, optimizer, scheduler = run
    for _ in range(steps):
        optimizer.zero_grad(set_to_none=True)
        (0.5 * (100 * w[0] ** 2 + w[1] ** 2)).backward()
        optimizer.step()
        scheduler.step()


original = make_run(torch.ones(2))
advance(original, 3)
checkpoint = copy.deepcopy({
    "weights": original[0].detach(),
    "optimizer": original[1].state_dict(),
    "scheduler": original[2].state_dict(),
})
advance(original, 3)

resumed = make_run(checkpoint["weights"])
resumed[2].load_state_dict(checkpoint["scheduler"])
resumed[1].load_state_dict(checkpoint["optimizer"])
advance(resumed, 3)
weights_only = make_run(checkpoint["weights"])
advance(weights_only, 3)
print("complete state matches:", torch.equal(original[0], resumed[0]))
print("weights-only restart matches:", torch.equal(original[0], weights_only[0]))
print("completed Adam steps:", int(resumed[1].state[resumed[0]]["step"].item()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
complete state matches: True
weights-only restart matches: False
completed Adam steps: 6
```
<!-- leetllm: output:end -->

The deep copy freezes the in-memory checkpoint before the original run continues. Construct the scheduler before loading the optimizer state; the scheduler constructor can change learning rates. Here we restore the scheduler first, then the optimizer, following the [PyTorch loading example](https://docs.pytorch.org/docs/2.14/generated/torch.optim.Optimizer.load_state_dict.html). Match the original parameter groups and ordering when restoring their state.

Because this CPU test sequence is deterministic, it needs no random-generator or data-loader state. A production resume also stores the update counter, dataset cursor, RNG states, and AMP scaler state when used, and later training chapters add those pieces alongside validation data and distributed state.

AdamW isn't the endpoint of optimizer research. For example, PyTorch provides [Muon](https://docs.pytorch.org/docs/stable/generated/torch.optim.Muon.html), which treats two-dimensional hidden-layer weight matrices as matrices rather than independent coordinates while pairing with AdamW for biases and embeddings. A single model can assign different optimizers to different parameter groups; compare the complete recipe under the same compute budget and validation metric.

```checkpoint
In the PyTorch loop, why must gradient clipping happen after `loss.backward()` but before `optimizer.step()`?
---
Backpropagation must create gradients before they can be measured or clipped, and clipping must modify them before the optimizer consumes them. Clipping after the step can't protect that update.
```

```checkpoint
A deterministic CPU run checkpoints after 5 updates. Two branches restore identical weights; one also restores optimizer and scheduler state, while the other starts fresh histories. Both take 2 more updates. Which conclusion follows?
---
Full state: matching continuation; weights only: unspecified continuation.

The next update depends on moments, Adam count and schedule position as well as weights. Restore matching groups and state to continue the same deterministic recipe. Identical coordinates alone do not determine the next displacement. Real resumes additionally require data, RNG and AMP state when used.
```

## Optimizer state is also a memory budget

For each trained parameter, plain SGD has no moving-average buffer, momentum stores one buffer, and AdamW stores two (`m` and `v`). At 4 bytes per `float32` element, those two AdamW buffers require $2 \times 4 = 8$ bytes per parameter, adding up to `56 GB` for a 7-billion-parameter model before weights, gradients, or activations are even counted:

<!-- leetllm: test, output=show -->
```python title="count-adamw-moment-memory.py"
parameters = 7_000_000_000
bytes_per_float32 = 4
moment_buffers = 2
bytes_used = parameters * bytes_per_float32 * moment_buffers

print("AdamW moment buffers in GB:", bytes_used / 1_000_000_000)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
AdamW moment buffers in GB: 56.0
```
<!-- leetllm: output:end -->

The `56 GB` figure excludes parameters, gradients, activations, and any `float32` master-weight copies kept during mixed-precision training. At large scale, partitioning <span data-glossary="optimizer-state">optimizer state</span> across devices is a central motivation for systems such as <span data-glossary="zero">ZeRO</span>.[^rajbhandari2020]

```checkpoint
A model trains 3 billion parameters with two float32 AdamW moment buffers, 4 bytes per value. What is their decimal memory cost and scope?
---
24 GB; both moment buffers.

Multiply 3,000,000,000 × 2 × 4 = 24,000,000,000 bytes, or 24 decimal GB. That counts moments only. Parameters, gradients, activations and possible master copies add to the run’s memory. One buffer would cost 12 GB.
```

## Read optimizer failures from traces

A training curve shows a symptom rather than a root cause, so inspect a small set of diagnostic measurements before swapping optimizers. Start with a concrete failure hypothesis, log the quantities that distinguish competing explanations, and vary one mechanism at a time on the same data slice:

| Symptom | Measure next | Candidate fix to test |
|---|---|---|
| loss becomes non-finite after one batch | gradient norm, batch contents, mixed-precision scale | correct bad data or numerics; compare clipping |
| loss oscillates while one parameter group barely changes | per-group update norm, learning rate, gradient scale | scale inputs or compare adaptive update |
| loss spikes at end of warmup | logged learning-rate transition, gradient norm | lower peak rate or smooth the warmup |
| training loss improves but validation worsens | validation metric, decay sweep, data <span data-glossary="feature-leakage">leakage</span> check | test regularization or stop earlier |
| run won't fit device memory | optimizer-state bytes and activation bytes | shard or reduce stored state |

```checkpoint
Two forty-update trials share the same objective, initialization, data, and held-out split. SGD at rate 0.012 ends with training loss 0.12 and held-out loss 0.28. AdamW at rate 0.06 ends with training loss 0.04 and held-out loss 0.35. You minimize held-out loss. Which selection and comparison conclusion follow?
---
Select SGD by held-out loss; the comparison evaluates these complete configurations at this step budget.

The held-out losses favor the tested SGD recipe, 0.28 versus 0.35, despite AdamW’s lower training loss. Different learning rates mean this comparison evaluates complete recipes at this step budget rather than isolating optimizer family. Choosing by training loss would answer a different question.
```

```checkpoint
A fresh scalar AdamW step begins at weight 3 with zero moments. Its accumulated gradient −5 is clipped to magnitude 2. Use rate 0.04, decay 0.1 and epsilon 0. What final weight results when decay uses the prior weight?
---
3.028

The clipped gradient is −2. Cold-start correction normalizes it to −1, so subtracting the adaptive update adds 0.04. Decay subtracts 0.04×0.1×3=0.012 from the prior weight. The final weight is 3.028. Applying decay to 3.04 instead would give 3.02784, which is a different rule.
```

## Worked checks

Work through these four hand checks on the valley model by naming which buffer is active and tracking why one learning rate cannot serve both the steep wall and shallow floor, then compare your answers with the solutions below.

1. Starting from `[a, b] = [1, 1]`, compute one SGD update with `lr = 0.01`. Does either coordinate cross zero?
2. At Adam step one, take gradient `[20, 0.2]`, `lr = 0.001`, and ignore epsilon. What is the bias-corrected update?
3. A global gradient has norm `50` and threshold `5`. What scaling factor does clipping apply?
4. Your run clips 95 percent of minibatches. Is "clipping works" an adequate conclusion?

Solution checks:

1. The gradient is `[100, 1]`; the new <span data-glossary="vector">vector</span> is `[0, 0.99]`. Neither coordinate overshoots, but the second is still slow.
2. The update is `[0.001, 0.001]`: first-step normalization removes magnitude differences for nonzero coordinates.
3. The factor is `5 / 50 = 0.1`; the direction stays the same.
4. No. Persistent clipping is evidence that your threshold, learning rate, data, or numerical path needs inspection.

```mastery-quiz
[
  {
    "question": "For L(a, b)=0.5(64 a²+b²), SGD uses rate 0.04 from nonzero errors. What are the two one-step multipliers, and how does the steep error behave?",
    "options": [
      "(0.96, −1.56); steep crossings shrink.",
      "(−0.04, 0.96); steep crossings shrink.",
      "(−1.56, 0.96); steep crossings grow.",
      "(−1.56, 0.04); steep crossings shrink."
    ],
    "answer": "(−1.56, 0.96); steep crossings grow.",
    "explanation": "Substitute each derivative into the update: 1−64×0.04=−1.56 and 1−0.04=0.96. The steep factor has magnitude above one, so alternating errors grow. Using 1−rate for both coordinates ignores their different curvatures."
  },
  {
    "question": "An EMA momentum buffer is 8. Its next gradient is −12, beta is 0.75, and the parameter subtracts a positive rate times the new buffer. What happens?",
    "options": [
      "Buffer 3; parameter decreases.",
      "Buffer −3; parameter increases.",
      "Buffer −1; parameter increases.",
      "Buffer −12; parameter increases."
    ],
    "answer": "Buffer 3; parameter decreases.",
    "explanation": "The retained contribution is 0.75×8=6 and the incoming contribution is 0.25×(−12)=−3, giving 3. Subtracting that positive buffer lowers the parameter despite the current negative gradient. Keeping only the incoming term loses the stored history."
  },
  {
    "question": "Basic RMSProp starts its squared buffer at zero. Take gradient [−6, 2], rho 0.75, rate 0.02 and epsilon 0. What vector is subtracted on this first step?",
    "options": [
      "[−0.12, 0.04]",
      "[−0.02, 0.02]",
      "[0.04, 0.04]",
      "[−0.04, 0.04]"
    ],
    "answer": "[−0.04, 0.04]",
    "explanation": "The squared buffer is [9, 1] and its root [3, 1]. Multiplying [−6/3, 2/1] by 0.02 gives [−0.04, 0.04]. Basic RMSProp has no Adam-style startup correction; squaring the buffer does not remove the current numerator’s sign."
  },
  {
    "question": "Scalar Adam starts at zero moments and receives gradients 2 then −1. Both betas are 0.5, rate 0.1 and epsilon 0. On update 2, what are m_hat, v_hat and the subtracted update?",
    "options": [
      "(0, 2, 0)",
      "(−1, 1, −0.1)",
      "(0.5, 2, 0.03536)",
      "(0, 1.5, 0)"
    ],
    "answer": "(0, 2, 0)",
    "explanation": "After the first input, m=1 and v=2. The second gives m=0.5×1+0.5×(−1)=0 and v=0.5×2+0.5×1=1.5. Dividing both by 1−0.5²=0.75 gives 0 and 2. The zero signed numerator makes this update zero despite the latest negative gradient."
  },
  {
    "question": "A cold-start weight 8 has a zero data-gradient tensor. Use rate 0.05, decay 0.02 and epsilon 10^−8. Compare AdamW with Adam that instead puts the L2 penalty gradient inside its moments. What new weights result, rounded to three decimals?",
    "options": [
      "AdamW 7.95; coupled 7.992.",
      "AdamW 8; coupled 7.95.",
      "AdamW 7.992; coupled 7.992.",
      "AdamW 7.992; coupled 7.95."
    ],
    "answer": "AdamW 7.992; coupled 7.95.",
    "explanation": "AdamW subtracts 0.05×0.02×8=0.008, reaching 7.992. Coupled L2 contributes positive gradient 0.16; its cold-start normalized update is 0.05, reaching 7.95. This isolated comparison begins with zero moments and an explicit data-gradient tensor."
  },
  {
    "question": "A schedule advances once per completed optimizer update. Three accumulation windows each contain four microbatches. AMP skips the middle window’s optimizer update for nonfinite gradients. How many optimizer updates and schedule advances occur?",
    "options": [
      "(2, 2)",
      "(12, 12)",
      "(3, 3)",
      "(2, 3)"
    ],
    "answer": "(2, 2)",
    "explanation": "Only the first and third optimizer updates execute, so both completed-update counters advance twice. Backward microbatches do not individually advance this schedule, and the skipped optimizer update does not consume a scheduled completed update. A present-gradient zero-rate step would still be a real optimizer-state update."
  },
  {
    "question": "Two microbatches have 3 and 1 items. Their mean-loss gradients are −2 and 6. The intended objective is the mean over all 4 items, with equivalent per-item forwards. What gradients do item-weighted accumulation and equal mean-of-means produce?",
    "options": [
      "Weighted 2; equal 0.",
      "Weighted −2; equal 6.",
      "Weighted 2; equal 2.",
      "Weighted 0; equal 2."
    ],
    "answer": "Weighted 0; equal 2.",
    "explanation": "The three-item batch gets 3/4 of the weight in the item mean, so the gradient is (3/4) × (−2) + (1/4) × 6 = 0. Giving each batch half the weight gives (−2 + 6) / 2 = 2. Getting 2 for both uses equal batch weights twice. A weighted result of 2 paired with an equal-batch result of 0 swaps the two calculations. The values −2 and 6 are the separate batch means before accumulation."
  },
  {
    "question": "A global gradient [8, 15] has norm 17. The clipping threshold is 8.5. Which gradient enters AdamW, and what does the threshold cap?",
    "options": [
      "[4, 7.5]; the complete parameter move.",
      "[4, 7.5]; the input gradient norm.",
      "[8, 8.5]; the input gradient norm.",
      "[0.5, 0.5]; the complete parameter move."
    ],
    "answer": "[4, 7.5]; the input gradient norm.",
    "explanation": "The shared factor is 8.5/17=0.5, so the clipped input is [4, 7.5]. Global clipping preserves its direction and caps the gradient passed to the optimizer. Moments, learning rate and separate decay still determine the full parameter displacement. Coordinatewise caps would be a different operation."
  },
  {
    "question": "An AMP accumulation window has finished all backward passes. You need a pre-clipping norm and one correctly clipped update. Which sequence uses gradients in their actual units?",
    "options": [
      "Clip scaled gradients; unscale; step; update scaler.",
      "Step; unscale once; measure/clip; update scaler.",
      "Unscale once; measure/clip; step; update scaler.",
      "Unscale each microbatch; accumulate; clip; step."
    ],
    "answer": "Unscale once; measure/clip; step; update scaler.",
    "explanation": "Keep one scale across the complete window, then unscale once after accumulation. Measure and clip before the optimizer consumes the gradients; step and update the scaler at window granularity. Clipping scaled values applies the threshold to artificial units, and clipping after step is too late."
  },
  {
    "question": "On a fixed data slice, training loss falls 0.50→0.20 while held-out loss rises 0.32→0.45. Which next comparison most directly investigates generalization while keeping the optimizer recipe reviewable?",
    "options": [
      "Compare held-out loss after changing optimizer, batch size and data split together.",
      "Compare held-out loss across a decay sweep while fixing the split and other settings.",
      "Compare training loss across a decay sweep and select its lowest training endpoint.",
      "Compare clipping frequency across thresholds and use that as the held-out loss."
    ],
    "answer": "Compare held-out loss across a decay sweep while fixing the split and other settings.",
    "explanation": "The divergence asks for held-out behavior, regularization and leakage checks. A controlled decay or stopping comparison isolates that effect while preserving the rest of the recipe. Training loss or finiteness alone never guarantees generalization, and simultaneous changes obscure the mechanism."
  }
]
```

> **Next:** Continue to [Probability for Machine Learning](/learn/probability-for-machine-learning). We kept the gradients deterministic here to expose the optimizer's mechanics. Real minibatches add sampling noise; probability gives you language for that uncertainty, as well as the scores a trained model assigns.
