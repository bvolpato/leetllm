---
{
  "id": "optimization-algorithms-adam-schedulers",
  "title": "Adam, Momentum, Schedulers",
  "slug": "optimization-algorithms-adam-schedulers",
  "section": "Deep Learning Foundations",
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

Two model parameters sit one unit from their target, yet the loss gradient asks you to move one 100 times farther than the other. How big should a single training step be?

The [linear algebra lesson](/learn/linear-algebra-machine-learning-deeper) showed how a matrix stretches directions unevenly. Optimization hits the same wall: a step size that barely nudges one parameter can launch another past the minimum. A **<span data-glossary="gradient">gradient</span>** measures the loss's local slope in each coordinate, and an **<span data-glossary="optimizer">optimizer</span>** turns those slopes into updates. Moving opposite the gradient lowers a smooth loss for a small enough step, whereas an oversized step or carried momentum can overshoot and raise it.[^goodfellow2016]

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Buffer rack after gradients 100 then minus 80: SGD stores none; momentum m2 = 1; RMSProp s2 = 1540; Adam and AdamW store m2 = 1 and v2 = 16.39 (8 bytes/param in float32). Zero-state AdamW shrinks weight 10 to 9.99." />
  <figcaption>Replaying gradients 100 then −80 from zero state under normalized EMA momentum. Each float32 moment costs 4 bytes per parameter. The separate zero-state AdamW check applies decay directly, shrinking 10 to 9.99.</figcaption>
</figure>

We will test every optimizer on the same two-coordinate valley so you can watch how moment buffers, adaptive denominators, weight decay, schedules, and clipping change each step.

## A 100-to-1 valley

Let `a` and `b` be two parameter errors targeting `[0, 0]` under a quadratic loss:

$$
L(a, b) = \frac{1}{2}(100a^2 + b^2) = \frac{1}{2}
\begin{bmatrix} a & b \end{bmatrix}
\begin{bmatrix} 100 & 0 \\ 0 & 1 \end{bmatrix}
\begin{bmatrix} a \\ b \end{bmatrix}
$$

The diagonal <span data-glossary="matrix">matrix</span> $\mathrm{diag}(100, 1)$ has condition number 100: slope changes 100 times faster along `a` than along `b`. That ratio is **curvature**, not feature importance. Differentiating gives $\nabla L(a, b) = [100a, b]$. At `w = [1, 1]`, the loss is `50.5` and the gradient is `[100, 1]`. One step of size `0.018` moves to `[-0.8, 0.982]` (loss `32.482`): `a` already overshot zero onto the opposite wall while `b` barely budged.

## SGD gives every coordinate one learning rate

In real training, **stochastic gradient descent (SGD)** estimates gradients on random minibatches, trading exactness for speed and batch-size noise. Keeping our deterministic gradient exposes the geometry cleanly. Given $g_t$, SGD applies one scalar **<span data-glossary="learning-rate">learning rate</span>** $\eta$ everywhere:

$$
w_t = w_{t-1} - \eta g_t
$$

Run three rates for eight steps on the valley to locate the stability cliff:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="sgd-valley-stability.py"
import numpy as np

for lr in (0.005, 0.018, 0.021):
    w = np.array([1.0, 1.0])
    for _ in range(8):
        w -= lr * np.array([100.0 * w[0], w[1]])
    loss = 0.5 * (100.0 * w[0] ** 2 + w[1] ** 2)
    print(f"lr={lr:.3f} w={w.round(3).tolist()} loss={loss:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
lr=0.005 w=[0.004, 0.961] loss=0.462
lr=0.018 w=[0.168, 0.865] loss=1.781
lr=0.021 w=[2.144, 0.844] loss=230.105
```
<!-- leetllm: output:end -->

Substituting the steep derivative gives $a_t = (1 - 100\eta)a_{t-1}$, which shrinks only for $|1 - 100\eta| < 1$, or $0 < \eta < 0.02$. At `0.021`, the multiplier is `-1.1` and `a` diverges to `2.144` (loss `230.105`). Any rate safe for `a` leaves `b` crawling near `1.0`.

## Momentum remembers directions that agree

SGD forgets that `a` keeps flipping sign while `b` keeps pointing the same way. **Momentum** tracks a signed exponential moving average of recent gradients, written here in normalized form so it matches Adam's first buffer (a normalized version of Polyak's [1964 heavy-ball method](https://www.mathnet.ru/eng/zvmmf7713)):

$$
m_t = \beta m_{t-1} + (1 - \beta)g_t,
\qquad
w_t = w_{t-1} - \eta m_t
$$

With $\beta = 0.9$, prior direction carries 90% weight and the new gradient carries 10%. (PyTorch's `torch.optim.SGD` uses an unnormalized buffer `b = beta * b + g`, which is $1/(1-\beta)$ times larger and needs a proportionally smaller learning rate.)

## RMSProp rescales by recent gradient magnitude

Momentum smooths signed direction yet still applies one global rate. **RMSProp** tracks an unsigned moving average of squared gradients and divides each coordinate by its root-mean-square scale ([Tieleman and Hinton, 2012](https://www.cs.toronto.edu/~tijmen/csc321/slides/lecture_slides_lec6.pdf)):

$$
s_t = \rho s_{t-1} + (1 - \rho)g_t^2,
\qquad
w_t = w_{t-1} - \eta \frac{g_t}{\sqrt{s_t} + \epsilon}
$$

Squaring prevents alternating signs from canceling, so each coordinate keeps the current gradient's sign while equalizing step scale. Basic RMSProp has no startup bias correction; PyTorch names $\rho$ `alpha` (default `0.99`) and adds $\epsilon$ outside the square root.

| Method | State per coordinate | Effective scale | Direction source |
|---|---|---|---|
| SGD | none | global $\eta$ | current gradient |
| Momentum | signed $m$ | global $\eta$ | smoothed history |
| RMSProp | squared $s$ | $\eta / (\sqrt{s} + \epsilon)$ | current gradient |
| Adam | signed $m$, squared $v$ | $\eta / (\sqrt{\hat{v}} + \epsilon)$ | bias-corrected smoothed history |

## Adam stores direction and squared-gradient scale

The **<span data-glossary="adam-optimizer">Adam optimizer</span>** combines momentum's signed buffer $m_t$ with RMSProp's squared-gradient buffer $v_t$ and corrects both for zero initialization:[^kingma2015]

$$
\begin{aligned}
m_t &= \beta_1 m_{t-1} + (1 - \beta_1)g_t, &
v_t &= \beta_2 v_{t-1} + (1 - \beta_2)g_t^2 \\
\hat{m}_t &= \frac{m_t}{1 - \beta_1^t}, &
\hat{v}_t &= \frac{v_t}{1 - \beta_2^t} \\
w_t &= w_{t-1} - \eta \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}
\end{aligned}
$$

Kingma and Ba's defaults are $\beta_1 = 0.9$, $\beta_2 = 0.999$, and $\epsilon = 10^{-8}$ outside the square root.[^kingma2015] Although $v_t$ is loosely called <span data-glossary="variance">variance</span>, it averages $g_t^2$ without subtracting a mean, making it an **uncentered second-moment estimate**.

<figure>
  <img src="illustrations/_generated/adam_coordinate_scaling_dark.png" alt="Adam replays four gradients from zero moments with lr 0.01, beta1 0.9, beta2 0.999. Coordinate a updates shrink to 0.00041 by step 4 while steady b stays near 0.00997, about 24.4 times larger." />
  <figcaption>Replaying four gradients through Adam. Alternating signs cancel in <code>a</code>'s numerator while squared magnitudes stay large, whereas steady <code>b</code> keeps its step near the learning rate.</figcaption>
</figure>

## Bias correction repairs zero-initialized state

Starting from $m_0 = 0$ and $v_0 = 0$ biases early averages toward zero. On step 1 with $\beta_1 = 0.9$ and $\beta_2 = 0.999$, $m_1 = 0.1 g_1$ and $v_1 = 0.001 g_1^2$; dividing raw buffers inflates step 1 by $0.1 / \sqrt{0.001} \approx 3.162$. After $t$ steps, exponential weights on observed gradients sum to $1 - \beta^t$, so dividing by $1 - \beta^t$ restores unit weight. At step 1, $\hat{m}_1 = g_1$ and $\hat{v}_1 = g_1^2$, so any nonzero coordinate with $|g_1| \gg \epsilon$ takes a step of size $\eta$.

Replay a four-gradient sequence (large alternating `a`, steady `b`) through Momentum, RMSProp, and Adam together:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="momentum-rmsprop-adam-trace.py"
import numpy as np

gradients = [
    np.array([100.0, 1.00]),
    np.array([-80.0, 0.98]),
    np.array([70.0, 0.96]),
    np.array([-60.0, 0.94]),
]
beta1, beta2, rho, lr, eps = 0.9, 0.999, 0.9, 0.01, 1e-8
m = np.zeros(2)
s = np.zeros(2)
v = np.zeros(2)

for t, g in enumerate(gradients, start=1):
    m = beta1 * m + (1.0 - beta1) * g
    s = rho * s + (1.0 - rho) * g**2
    v = beta2 * v + (1.0 - beta2) * g**2
    rms_step = lr * g / (np.sqrt(s) + eps)
    if t == 1:
        print("adam step 1 uncorrected:", (lr * m / (np.sqrt(v) + eps)).round(5).tolist())
    m_hat = m / (1.0 - beta1**t)
    v_hat = v / (1.0 - beta2**t)
    adam_step = lr * m_hat / (np.sqrt(v_hat) + eps)
    print(f"t={t} | m={m.round(3).tolist()} s={s.round(1).tolist()} | rms={rms_step.round(5).tolist()} adam={adam_step.round(5).tolist()}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
adam step 1 uncorrected: [0.03162, 0.03162]
t=1 | m=[10.0, 0.1] s=[1000.0, 0.1] | rms=[0.03162, 0.03162] adam=[0.01, 0.01]
t=2 | m=[1.0, 0.188] s=[1540.0, 0.2] | rms=[-0.02039, 0.02272] adam=[0.00058, 0.00999]
t=3 | m=[7.9, 0.265] s=[1876.0, 0.3] | rms=[0.01616, 0.01884] adam=[0.00346, 0.00998]
t=4 | m=[1.11, 0.333] s=[2048.4, 0.3] | rms=[-0.01326, 0.01657] adam=[0.00041, 0.00997]
```
<!-- leetllm: output:end -->

By step 4, alternating slopes cancel `a`'s Adam numerator while squared magnitudes keep its denominator near `78.882`, cutting `a`'s step to `0.00041` while `b` strides along at `0.00997`. Notice two behaviors:

- **Momentum can oppose the latest slope:** On steps 2 and 4, `a`'s gradient is negative yet Adam still subtracts a positive step because $\hat{m}_t$ stays positive.
- **Scale invariance breaks near $\epsilon$:** Scaling the entire gradient history by $c > 0$ cancels between $\hat{m}_t$ and $\sqrt{\hat{v}_t}$ when $|g| \gg \epsilon$,[^kingma2015] whereas at $|g| = \epsilon$ on step 1 the update drops to $\eta / 2$.

## AdamW separates data gradients from weight shrinkage

Adding an L2 penalty $\frac{\lambda}{2}\|w\|_2^2$ adds $\lambda w$ to the gradient. In SGD, that matches <span data-glossary="weight-decay">weight decay</span>. In Adam, pushing $\lambda w$ through $m_t$ and $v_t$ shrinks parameters with large historical gradients less than quiet ones.[^loshchilov2019] **<span data-glossary="adamw">AdamW</span>** decouples weight decay by shrinking the prior weight directly outside the adaptive denominator:

$$
w_t =
w_{t-1}
- \eta \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}
- \eta \lambda w_{t-1}
$$

Even with zero data gradient and zero moments, a weight at `10.0` moves differently under the two rules:

<!-- leetllm: test, output=show -->
```python title="adamw-vs-coupled-l2.py"
theta, lr, decay, eps = 10.0, 0.1, 0.01, 1e-8
adamw = theta - lr * decay * theta
g_l2 = decay * theta
coupled = theta - lr * g_l2 / (abs(g_l2) + eps)
print(f"AdamW={adamw:.4f} | coupled L2 Adam={coupled:.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
AdamW=9.9900 | coupled L2 Adam=9.9000
```
<!-- leetllm: output:end -->

AdamW shrinks `10.0` by `1 - lr * decay` to `9.99` without touching `m` or `v`, while coupled L2 takes a full learning-rate step of `0.1` down to `9.9`. Note that `lr` still multiplies decay, and PyTorch skips parameters with `grad=None` completely (no decay), whereas an explicit zero gradient tensor still applies decay and updates moments.

## Schedules change pace across the run

A **<span data-glossary="learning-rate-schedule">learning-rate schedule</span>** adjusts the global multiplier $\eta_t$ across training: **warmup** ramps $\eta$ from zero so noisy early gradients and cold second moments do not destabilize weights, and **decay** (inverse square root, linear, or cosine) shrinks steps as parameters settle into a basin. The original <span data-glossary="transformer">Transformer</span> paired Adam ($\beta_1=0.9, \beta_2=0.98, \epsilon=10^{-9}$) with 4,000 warmup steps and inverse-square-root decay;[^vaswani2017] modern LLM runs widely use linear warmup followed by cosine decay ([Loshchilov and Hutter, 2016](https://arxiv.org/abs/1608.03983)).

### Accumulate the objective you intended

**Gradient accumulation** sums gradients across microbatches before one `optimizer.step()`. Advance a per-update schedule once per optimizer step, not per microbatch. When microbatches have unequal sizes (such as variable valid-token counts or a shorter final chunk), weight each microbatch mean loss by its share $n_k / \sum_j n_j$ of total items; dividing equally computes a mean of means that overweights smaller microbatches. Across distributed workers with equal microbatches, effective batch size is `microbatch_size * accumulation_steps * world_size`.

## Gradient clipping limits the input to the optimizer

A corrupted sample or rare token can spike gradients across the model. **Global-norm <span data-glossary="gradient-clipping">gradient clipping</span>** concatenates all parameter gradients into one vector $g$, computes $\|g\|_2$, and rescales uniformly whenever $\|g\|_2 > c$:

$$
g_{\text{used}} = \min\!\left(1, \frac{c}{\|g\|_2}\right) g
$$

Uniform scaling preserves direction while shielding weights and Adam's moment buffers from outliers. For `[300, 400]` (norm `500`) with threshold `c = 5.0`, the scale factor is `5 / 500 = 0.01`, returning `[3.0, 4.0]`. Always clip after all accumulated `backward()` passes and before `optimizer.step()`. Under mixed-precision `GradScaler`, call `scaler.unscale_(optimizer)` once after accumulation so clipping measures true gradient magnitudes rather than <span data-glossary="loss-scaling">loss-scaled</span> values. Clipping caps the gradient entering the optimizer, not the final AdamW displacement; if nearly every step clips, inspect learning rate, data, or loss scaling.

## Build it: optimize the valley with AdamW

Implement AdamW from scratch with warmup-cosine scheduling and race it against SGD over 80 steps on the 100:1 valley. (Even on convex problems, plain Adam can diverge on pathological gradient sequences, motivating variants like AMSGrad;[^reddi2018adam] compare complete recipes on held-out loss at a fixed compute budget.)

<!-- leetllm: test, deps=numpy, output=show -->
```python title="build-adamw-on-the-valley.py"
import math
import numpy as np


def loss(w: np.ndarray) -> float:
    return float(0.5 * (100.0 * w[0] ** 2 + w[1] ** 2))


def grad(w: np.ndarray) -> np.ndarray:
    return np.array([100.0 * w[0], w[1]])


def cosine_lr(step: int, total: int, peak: float) -> float:
    return peak * 0.5 * (1.0 + math.cos(math.pi * step / (total - 1)))


w_sgd = np.array([1.0, 1.0])
for s in range(80):
    w_sgd -= cosine_lr(s, 80, 0.018) * grad(w_sgd)

w_adam = np.array([1.0, 1.0])
m, v = np.zeros(2), np.zeros(2)
beta1, beta2, eps, decay = 0.9, 0.999, 1e-8, 0.01
for t in range(1, 81):
    g = grad(w_adam)
    m = beta1 * m + (1.0 - beta1) * g
    v = beta2 * v + (1.0 - beta2) * g**2
    m_hat, v_hat = m / (1.0 - beta1**t), v / (1.0 - beta2**t)
    lr = cosine_lr(t - 1, 80, 0.08)
    prior = w_adam.copy()
    w_adam -= lr * m_hat / (np.sqrt(v_hat) + eps)
    w_adam -= lr * decay * prior

print(f"SGD   loss={loss(w_sgd):.6f} w={w_sgd.round(5).tolist()}")
print(f"AdamW loss={loss(w_adam):.6f} w={w_adam.round(5).tolist()}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
SGD   loss=0.117302 w=[-0.0, 0.48436]
AdamW loss=0.023509 w=[0.02158, 0.02158]
```
<!-- leetllm: output:end -->

SGD drives `a` to zero yet strands `b` at `0.48436`. AdamW finishes with balanced errors `[0.02158, 0.02158]` because the 100:1 factor cancels between $\hat{m}_t$ and $\sqrt{\hat{v}_t}$.

## Use PyTorch after understanding the state

In <span data-glossary="pytorch">PyTorch</span>, <span data-glossary="backpropagation">backpropagation</span> fills `.grad` and `torch.optim.AdamW` maintains buffers. Follow one order per update: `zero_grad(set_to_none=True)`, `loss.backward()`, `clip_grad_norm_(..., error_if_nonfinite=True)`, `optimizer.step()`, then `scheduler.step()`.

### Resume the history, not just the weights

Because AdamW's next move depends on `m`, `v`, its step count, and the scheduler state, restarting from weights alone alters the trajectory. Restore `scheduler.state_dict()` and `optimizer.state_dict()` (creating the scheduler before loading optimizer state so it does not overwrite restored rates), plus RNG, dataloader, and AMP scaler state in real runs:

<!-- leetllm: test, deps=torch, output=show -->
```python title="pytorch-adamw-loop-and-resume.py"
import copy
import math
import torch

w = torch.nn.Parameter(torch.tensor([1.0, 1.0]))
opt = torch.optim.AdamW([w], lr=0.08, weight_decay=0.01)
clipped, max_norm = 0, 0.0
for step in range(60):
    opt.zero_grad(set_to_none=True)
    (0.5 * (100.0 * w[0] ** 2 + w[1] ** 2)).backward()
    gn = torch.nn.utils.clip_grad_norm_([w], max_norm=20.0, error_if_nonfinite=True).item()
    max_norm = max(max_norm, gn)
    clipped += int(gn > 20.0)
    opt.param_groups[0]["lr"] = 0.08 * 0.5 * (1.0 + math.cos(math.pi * step / 59))
    opt.step()

final_loss = 0.5 * (100.0 * w[0] ** 2 + w[1] ** 2)
print(f"clipped loop: loss={final_loss.item():.6f} w={[round(x, 5) for x in w.detach().tolist()]} clipped={clipped} max_norm={max_norm:.3f}")


def make_run(init):
    p = torch.nn.Parameter(init.clone())
    o = torch.optim.AdamW([p], lr=0.01, weight_decay=0.01)
    s = torch.optim.lr_scheduler.StepLR(o, step_size=2, gamma=0.5)
    return p, o, s


def run_steps(bundle, n):
    p, o, s = bundle
    for _ in range(n):
        o.zero_grad(set_to_none=True)
        (0.5 * (100.0 * p[0] ** 2 + p[1] ** 2)).backward()
        o.step()
        s.step()


orig = make_run(torch.ones(2))
run_steps(orig, 3)
ckpt = copy.deepcopy({"w": orig[0].detach(), "opt": orig[1].state_dict(), "sched": orig[2].state_dict()})
run_steps(orig, 3)

resumed = make_run(ckpt["w"])
resumed[2].load_state_dict(ckpt["sched"])
resumed[1].load_state_dict(ckpt["opt"])
run_steps(resumed, 3)

weights_only = make_run(ckpt["w"])
run_steps(weights_only, 3)
print("full resume matches:", torch.equal(orig[0], resumed[0]), "| weights-only matches:", torch.equal(orig[0], weights_only[0]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
clipped loop: loss=0.047348 w=[0.03062, 0.03062] clipped=11 max_norm=100.005
full resume matches: True | weights-only matches: False
```
<!-- leetllm: output:end -->

Matrix-aware optimizers such as [Muon](https://docs.pytorch.org/docs/stable/generated/torch.optim.Muon.html) extend this idea by updating 2D hidden matrices directly while keeping AdamW on embeddings and biases.

## Optimizer state is also a memory budget

Plain SGD keeps zero buffers, momentum keeps one, and AdamW keeps two (`m` and `v`). At 4 bytes per `float32` value, AdamW's moments cost $2 \times 4 = 8$ bytes per parameter:

$$
7 \times 10^9 \text{ params} \times 8 \text{ bytes/param} = 56 \text{ GB}
$$

That 56 GB covers moments alone, before weights, gradients, activations, or `float32` master weights. Sharding <span data-glossary="optimizer-state">optimizer state</span> across GPUs is the core motivation behind <span data-glossary="zero">ZeRO</span>.[^rajbhandari2020]

## Read optimizer failures from traces

Loss curves show symptoms, not causes. Measure the diagnostic signals below and vary one setting at a time:

| Symptom | Measure next | Candidate fix |
|---|---|---|
| `NaN`/`Inf` after one batch | Pre-clip grad norm, batch inputs, AMP scale | Fix bad data/numerics; check clipping |
| Loss oscillates while one layer stalls | Per-group update norm, learning rate | Normalize features or use adaptive scaling |
| Loss spikes when warmup ends | Logged learning rate, grad norm | Lower peak rate or extend warmup |
| Train improves while val worsens | Val loss, decay sweep, <span data-glossary="feature-leakage">leakage</span> check | Increase weight decay or stop earlier |
| OOM before step 1 | Optimizer-state vs. activation bytes | Shard state (ZeRO) or shrink microbatch |

```mastery-quiz
[
  {
    "question": "For L(a, b) = 0.5(64 a^2 + b^2), SGD uses lr = 0.04 from nonzero errors. What are the two one-step multipliers, and how does coordinate a behave?",
    "options": [
      "(0.96, -1.56); crossings shrink.",
      "(-0.04, 0.96); crossings shrink.",
      "(-1.56, 0.96); crossings grow.",
      "(-1.56, 0.04); crossings shrink."
    ],
    "answer": "(-1.56, 0.96); crossings grow.",
    "explanation": "The one-step factors are 1 - 64*0.04 = -1.56 along a and 1 - 0.04 = 0.96 along b. Because |-1.56| > 1, coordinate a flips sign and diverges."
  },
  {
    "question": "Scalar Adam starts at zero moments and sees gradients 2 then -1 with beta1 = beta2 = 0.5, lr = 0.1, epsilon = 0. On step 2, what are (m_hat, v_hat, subtracted update)?",
    "options": [
      "(0, 2, 0)",
      "(-1, 1, -0.1)",
      "(0.5, 2, 0.03536)",
      "(0, 1.5, 0)"
    ],
    "answer": "(0, 2, 0)",
    "explanation": "Step 1 gives m=1, v=2. Step 2 gives m=0.5*1 + 0.5*(-1)=0 and v=0.5*2 + 0.5*1=1.5. Dividing by 1 - 0.5^2 = 0.75 yields m_hat=0, v_hat=2, and update 0."
  },
  {
    "question": "A cold-start weight of 8 receives an explicit zero data-gradient tensor with lr = 0.05, decay = 0.02, epsilon = 1e-8. Compare AdamW and coupled-L2 Adam after one step.",
    "options": [
      "AdamW 7.95; coupled 7.992.",
      "AdamW 8.000; coupled 7.95.",
      "AdamW 7.992; coupled 7.992.",
      "AdamW 7.992; coupled 7.95."
    ],
    "answer": "AdamW 7.992; coupled 7.95.",
    "explanation": "AdamW subtracts 0.05*0.02*8 = 0.008 to reach 7.992. Coupled L2 puts gradient 0.16 into Adam's moments, so cold-start normalization takes a full 0.05 step to 7.95."
  },
  {
    "question": "Two microbatches have 3 and 1 items with mean-loss gradients -2 and 6. To match the 4-item full-batch mean, what do item-weighted accumulation and equal mean-of-means give?",
    "options": [
      "Weighted 2; equal 0.",
      "Weighted -2; equal 6.",
      "Weighted 2; equal 2.",
      "Weighted 0; equal 2."
    ],
    "answer": "Weighted 0; equal 2.",
    "explanation": "Item weighting gives (3/4)*(-2) + (1/4)*6 = 0, matching the full batch. Averaging microbatch means equally gives (-2 + 6)/2 = 2."
  },
  {
    "question": "An AMP accumulation window finishes all backward passes. Which sequence clips gradients in their real units before stepping?",
    "options": [
      "Clip scaled gradients; unscale; step; update scaler.",
      "Step; unscale once; measure/clip; update scaler.",
      "Unscale once; measure/clip; step; update scaler.",
      "Unscale each microbatch; accumulate; clip; step."
    ],
    "answer": "Unscale once; measure/clip; step; update scaler.",
    "explanation": "Keep one loss scale across the window, unscale once after accumulation, measure and clip real gradients, then call optimizer.step() and update the scaler."
  }
]
```

> **Next:** Continue to [CNNs from Scratch](/learn/convolutional-neural-networks-from-scratch).
