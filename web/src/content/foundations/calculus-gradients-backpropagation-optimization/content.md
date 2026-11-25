---
{
  "id": "calculus-gradients-backpropagation-optimization",
  "title": "Gradients and Backprop",
  "slug": "calculus-gradients-backpropagation-optimization",
  "section": "Math & Tensor Foundations",
  "category": "Fine-Tuning & Training",
  "difficulty": "Easy",
  "order": 3,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Train a one-weight latency predictor by reading a slope, taking a downhill step, tracing chain-rule paths, and checking the same gradient in PyTorch.",
  "keyConceptsTested": [
    "loss as a training signal",
    "finite-difference slope checks",
    "derivatives and partial derivatives",
    "gradient descent updates",
    "chain rule and backpropagation",
    "gradient accumulation across shared paths",
    "gradient checking",
    "vanishing and exploding gradients",
    "vector-Jacobian products and backward seeds",
    "feature scale and optimization conditioning",
    "PyTorch automatic differentiation and gradient reset"
  ],
  "prerequisites": [
    "numpy-and-tensor-shapes"
  ],
  "aliases": [
    "training-backpropagation-gradient-descent"
  ]
}
---
<!-- leetllm: edition:reference:start -->

A request takes 5 seconds, yet a model predicts 6. Its rule multiplies the number of 100-token blocks by one adjustable weight, currently 3, for this 200-token request. Should we nudge that weight up or down, and by how much?

The [NumPy lesson](/learn/numpy-and-tensor-shapes) organized inputs into tensors. Training closes the loop: convert prediction error into slopes, trace those slopes backward through every operation, and step parameters downhill.

## One parameter, one loss, one slope

A **parameter** is a stored number updated during training. Start with one parameter `w`: predicted seconds per 100 input <span data-glossary="token">tokens</span>. For a 200-token request (`x = 2.0`) that took `y = 5.0` seconds, setting `w = 3.0` predicts `6.0` seconds and yields squared-error **loss** $L(w) = (wx - y)^2 = (6 - 5)^2 = 1.0$. Squaring penalizes overestimates and underestimates symmetrically and reaches `0` at a perfect fit.

To learn whether `w` should rise or fall, nudge `w` upward by `eps = 0.001`: prediction moves from `6.000` to `6.002` and loss rises from `1.000000` to `1.004004`. Dividing change in loss by change in weight gives a **finite-difference** slope estimate of `(1.004004 - 1.000000) / 0.001 = 4.004`. A positive slope means increasing `w` makes loss worse, so `w` must move down.

Shrinking the nudge $h$ toward zero gives the exact **derivative** $dL/dw$:[^openstaxDerivative2016]

$$
\frac{(1 + 2h)^2 - 1}{h} = \frac{4h + 4h^2}{h} = 4 + 4h \xrightarrow{h \to 0} 4
$$

More generally, for $L(w) = (2w - 5)^2$, the error $e = 2w - 5$ changes twice as fast as $w$, while squaring $e$ has local slope $2e$. Multiplying those sensitivities is the **chain rule**:[^openstaxChainRule2016]

$$
\frac{dL}{dw} = 2(2w - 5) \times 2 = 4(2w - 5)
$$

At `w = 3`, $dL/dw = 4$. A **centered finite difference** `(loss(w + eps) - loss(w - eps)) / (2 * eps)` cancels the quadratic's extra $h$ term and matches the analytical derivative cleanly:

<!-- leetllm: test, output=show -->
```python title="analytical-versus-numerical-slope.py"
def loss(weight: float) -> float:
    return (weight * 2.0 - 5.0) ** 2

def analytical_gradient(weight: float) -> float:
    return 2 * (weight * 2.0 - 5.0) * 2.0

w, eps = 3.0, 1e-5
one_sided = (loss(w + 1e-3) - loss(w)) / 1e-3
centered = (loss(w + eps) - loss(w - eps)) / (2 * eps)
exact = analytical_gradient(w)

print("one_sided", round(one_sided, 3))
print("centered ", round(centered, 6))
print("exact    ", exact)
assert abs(centered - exact) < 1e-6
```

<!-- leetllm: output:start -->
```text title="Output" output compact
one_sided 4.004
centered  4.0
exact     4.0
```
<!-- leetllm: output:end -->

## Gradient descent and step-size stability

**Gradient descent** moves opposite the <span data-glossary="gradient">gradient</span>, scaled by a chosen <span data-glossary="learning-rate">learning rate</span> $\eta$:

$$
w_{\text{new}} = w - \eta \frac{dL}{dw}
$$

Starting at `w = 3.0` with $\eta = 0.1$, the first step lands at $3.0 - 0.1 \times 4 = 2.6$, dropping loss from `1.0` to `0.04`. Repeating the update shrinks both loss and slope toward `w = 2.5`, where squared loss hits its global minimum `0`. (On non-convex surfaces, a zero derivative also appears at local maxima and saddle points, not only at minima.)

Calculus tells you which way is downhill, never how far to step. Keep the exact same gradient `4` and raise $\eta$: at `0.125` you land directly on `2.5`; at `1.0` you jump past the valley to `w = -1.0` and explode the loss to `49.0`.

<figure>
  <img src="illustrations/_generated/optimizer_control_loop_dark.png" alt="Three updates on L(w) = (2w - 5)^2 from w = 3, loss 1, and gradient 4. Learning rate 0.1 gives w = 2.6 and loss 0.04. Rate 0.125 gives w = 2.5 and loss 0. Rate 1 gives w = -1 and loss 49. The dashed tangent has slope 4 at the starting point." />
  <figcaption>Each arrow starts at `w = 3` and uses the same gradient `4`. Rate `0.1` takes a steady downhill step; `0.125` hits the exact minimum; `1.0` overshoots to loss `49`.</figcaption>
</figure>

Because $dL/dw = 8(w - 2.5)$, every step multiplies displacement from `2.5` by $(1 - 8\eta)$:

$$
w_{\text{new}} - 2.5 = (1 - 8\eta)(w - 2.5)
$$

Distance shrinks strictly when $|1 - 8\eta| < 1$, i.e. $0 < \eta < 0.25$. At $\eta = 0.25$, `w` bounces forever between `3` and `2`; above `0.25`, it diverges. Even changing input units shifts that stability window: switching from 100-token blocks (`x = 2`) to raw tokens (`x = 200`) multiplies curvature by $100^2 = 10{,}000$, shrinking the stable range to $0 < \eta < 0.000025$.

<!-- leetllm: test, output=show -->
```python title="gradient-descent-and-overshoot.py"
w, x, y = 3.0, 2.0, 5.0
for step in range(4):
    loss = (w * x - y) ** 2
    grad = 2 * (w * x - y) * x
    print(f"step {step}: w={w:.4f} loss={loss:.6f} grad={grad:.4f}")
    w -= 0.1 * grad

for lr in (0.1, 0.125, 1.0):
    w_next = 3.0 - lr * 4.0
    print(f"one step lr={lr:<5} -> w={w_next:5.2f}, loss={(w_next * 2.0 - 5.0) ** 2:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
step 0: w=3.0000 loss=1.000000 grad=4.0000
step 1: w=2.6000 loss=0.040000 grad=0.8000
step 2: w=2.5200 loss=0.001600 grad=0.1600
step 3: w=2.5040 loss=0.000064 grad=0.0320
one step lr=0.1   -> w= 2.60, loss=0.04
one step lr=0.125 -> w= 2.50, loss=0.00
one step lr=1.0   -> w=-1.00, loss=49.00
```
<!-- leetllm: output:end -->

```checkpoint
At `w = 3`, the derivative is `+4`. Why does gradient descent subtract it instead of adding it?
---
A positive derivative means increasing `w` raises the loss locally. Subtracting a scaled positive gradient moves `w` down from `3.0` to `2.6`, cutting loss from `1.0` to `0.04`.
```

## Partial derivatives and backpropagation

Add a second feature, queue delay `x_q = 1.0` second, alongside prompt blocks `x_p = 2.0`, with weights `[w_p, w_q] = [2.0, 2.0]` predicting $\hat{y} = w_p x_p + w_q x_q = 6.0$ against target `y = 5.0`. A **partial derivative** ($\partial$) measures sensitivity to one parameter while holding the others fixed:

$$
\frac{\partial L}{\partial w_p} = 2(\hat{y} - y)x_p = 4, \qquad \frac{\partial L}{\partial w_q} = 2(\hat{y} - y)x_q = 2
$$

Collect both slopes into the gradient <span data-glossary="vector">vector</span> `[4, 2]`. Notice how <span data-glossary="backpropagation">backpropagation</span> computes every entry in a single reverse walk instead of nudging parameters one by one.[^rumelhart1986] During the forward pass, operations cache the intermediate values needed by their backward rules (`prediction = 6`, `error = 1`, `loss = 1`). Starting at `dL/dL = 1`, multiply local derivatives right to left:

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Dual-pass autograd execution: The forward pass computes activations from left to right: features x_p = 2.0 and x_q = 1.0 with weights w_p = 2.0 and w_q = 2.0 produce prediction 6.0, residual error 1.0, and loss 1.0. The backward pass propagates adjoints in reverse from right to left: loss seed 1.0 scales through error adjoint 2.0 and prediction adjoint 2.0 to yield weight gradients dL/dw_p = 4.0 and dL/dw_q = 2.0." />
  <figcaption>The forward pass saves values needed by backward rules. Starting from `dL/dL = 1`, multiplying local derivatives along each path yields `4.0` for `w_p` and `2.0` for `w_q` in one pass.</figcaption>
</figure>

The same reverse rule handles nonlinearities like **ReLU** ($\max(0, h)$). Its local derivative is `1` for $h > 0$ and `0` for $h < 0$. If $h = w_p x_p$ turns negative, ReLU outputs `0` and multiplies the upstream gradient by `0`, so `w_p` receives no update on that example. At the corner $h = 0$, left and right slopes disagree (`0` vs `-12` for $L(w) = (\mathrm{ReLU}(2w) - 3)^2$), so no ordinary derivative exists; PyTorch returns `0` by convention even though moving $w$ slightly positive lowers loss.[^pytorch2026autograd][^pytorch2026gradcheckapi]

<!-- leetllm: test, output=show -->
```python title="relu-chain-backprop.py"
x_p, x_q, w_q, y = 2.0, 1.0, 2.0, 5.0

for label, w_p in [("relu_on ", 2.0), ("relu_off", -0.5)]:
    h = w_p * x_p
    z = max(0.0, h)
    pred = z + w_q * x_q
    error = pred - y
    d_z_dh = 1.0 if h > 0 else 0.0
    grad_wp = (2 * error) * d_z_dh * x_p
    print(f"{label}: h={h:4.1f} z={z:3.1f} pred={pred:3.1f} dL/dw_p={grad_wp:4.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
relu_on : h= 4.0 z=4.0 pred=6.0 dL/dw_p= 4.0
relu_off: h=-1.0 z=0.0 pred=2.0 dL/dw_p=-0.0
```
<!-- leetllm: output:end -->

### Shared parameters sum all incoming paths

When one parameter feeds multiple branches, changing it perturbs every branch at once, so their gradient contributions **add**. Tie both features to one shared coefficient $w = 2$ in $\hat{y} = w x_p + w x_q$: the prompt branch sends `2 * 1 * 2 = 4`, the queue branch sends `2 * 1 * 1 = 2`, and `w` accumulates `4 + 2 = 6` (matching $d/dw[(3w - 5)^2] = 6$).

<figure>
  <img src="illustrations/_generated/chain_rule_graph_dark.png" alt="Multi-variable chain rule graph accumulation: Loss L = 1.0 propagates backward through residual error e = 1.0 (sensitivity 2.0) to prediction ŷ = 6.0 (adjoint 2.0). From the prediction, two separate branches evaluate: prompt path contributes (2.0) * (2.0) = 4.0, while queue path contributes (2.0) * (1.0) = 2.0. Both branches converge at the shared parameter w = 2.0, where their sensitivities accumulate: dL/dw = 4.0 + 2.0 = 6.0." />
  <figcaption>When one parameter feeds multiple calculation paths, its total derivative sums every branch: `4.0 + 2.0 = 6.0`.</figcaption>
</figure>

<details>
<summary>Deep dive: A tiny scalar autograd engine</summary>

Andrej Karpathy's Micrograd captures reverse-mode automatic differentiation in ~45 lines of Python: each `Value` stores a scalar `.data`, a gradient `.grad`, its parent nodes, and a local `_backward` closure.[^karpathy2020micrograd] Running `backward()` sorts the computation graph topologically so every output visits its parents in reverse order, and every local rule uses `+=` so shared variables sum all incoming paths:

<!-- leetllm: test, output=show -->
```python title="scalar-autograd-engine.py"
class Value:
    def __init__(self, data: float, parents: tuple = ()):
        self.data = float(data)
        self.grad = 0.0
        self.parents = parents
        self._backward = lambda: None

    def _wrap(self, other):
        return other if type(other) is Value else Value(other)

    def __add__(self, other):
        other = self._wrap(other)
        out = Value(self.data + other.data, (self, other))
        def backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = backward
        return out

    def __mul__(self, other):
        other = self._wrap(other)
        out = Value(self.data * other.data, (self, other))
        def backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = backward
        return out

    def __sub__(self, other):
        return self + (self._wrap(other) * -1.0)

    def __pow__(self, exponent: float):
        out = Value(self.data ** exponent, (self,))
        def backward():
            self.grad += exponent * (self.data ** (exponent - 1)) * out.grad
        out._backward = backward
        return out

    def backward(self):
        order, seen = [], set()
        def visit(node):
            if node not in seen:
                seen.add(node)
                for parent in node.parents:
                    visit(parent)
                order.append(node)
        visit(self)
        for node in order:
            node.grad = 0.0
        self.grad = 1.0
        for node in reversed(order):
            node._backward()

w = Value(2.0)
loss = (w * 2.0 + w * 1.0 - 5.0) ** 2
loss.backward()
print(f"shared weight loss={loss.data:.1f}, dL/dw={w.grad:.1f}")
assert w.grad == 6.0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
shared weight loss=1.0, dL/dw=6.0
```
<!-- leetllm: output:end -->

</details>

## Batch training, conditioning, and gradient checking

One row cannot separate two weights uniquely. Stack four requests obeying `y = 2 * prompt_blocks + queue_seconds` into a `(4, 2)` matrix `X` and minimize **mean squared error** $\frac{1}{N}\sum_i (\hat{y}_i - y_i)^2$. Its vectorized gradient is `(2 / len(X)) * (X.T @ errors)`:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="train-and-gradcheck-latency.py"
import numpy as np

X = np.array([[1.0, 0.5], [2.0, 1.0], [3.0, 0.5], [4.0, 2.0]])
y = np.array([2.5, 5.0, 6.5, 10.0])

# 1. Train from [0, 0] with gradient descent
weights = np.array([0.0, 0.0])
for step in range(101):
    errors = X @ weights - y
    loss = float(np.mean(errors ** 2))
    grad = (2 / len(X)) * (X.T @ errors)
    if step in (0, 1, 10, 100):
        print(f"step {step:3d}: loss={loss:.6f} weights={np.round(weights, 4).tolist()}")
    weights = weights - 0.03 * grad

# 2. Verify analytical gradient against float64 centered finite differences
probe = np.array([1.3, 1.1])
manual = (2 / len(X)) * (X.T @ (X @ probe - y))
eps = 1e-5
numerical = np.zeros_like(probe)
for i in range(len(probe)):
    delta = np.zeros_like(probe)
    delta[i] = eps
    loss_plus = float(np.mean((X @ (probe + delta) - y) ** 2))
    loss_minus = float(np.mean((X @ (probe - delta) - y) ** 2))
    numerical[i] = (loss_plus - loss_minus) / (2 * eps)

print("manual   ", np.round(manual, 6).tolist())
print("numerical", np.round(numerical, 6).tolist())
assert np.allclose(manual, numerical, atol=1e-6)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
step   0: loss=43.375000 weights=[0.0, 0.0]
step   1: loss=9.852759 weights=[1.08, 0.4425]
step  10: loss=0.003643 weights=[2.0574, 0.8557]
step 100: loss=0.000709 weights=[2.0259, 0.9364]
manual    [-9.9, -3.925]
numerical [-9.9, -3.925]
```
<!-- leetllm: output:end -->

Loss drops rapidly in the first ten steps, then creeps toward `[2, 1]`. Because prompt length and queue delay rise together across these rows, moving `w_p` up while moving `w_q` down partly cancels in the predictions: offset `[+0.1, -0.25]` gives MSE `0.011`, whereas `[+0.1, +0.25]` gives `0.311`. That uneven curvature across directions is **conditioning**: a learning rate safe along the steep direction makes slow progress along the flat valley.[^boyd2004convex]

Always run gradient checks in `float64`. Subtracting two nearly equal `float32` losses suffers **catastrophic cancellation**: at `w = 3` with `eps = 1e-6`, `float64` reports `4.000000`, whereas `float32` drifts to `3.814697` even when the analytical formula is exact.[^pytorch2026gradcheckapi]

## Vanishing and exploding gradients in deep networks

In an $L$-layer network $h_l = \sigma(W_l h_{l-1} + b_l)$, each backward step multiplies the arriving gradient $g_l = \partial L / \partial h_l$ by the layer's weight transpose and activation slope:

$$
g_{l-1} = W_l^\top \left(g_l \odot \sigma'(z_l)\right)
$$

Repeating that product across $L$ layers makes early-layer gradients scale roughly like $\gamma^{L-1}$ for an effective per-layer gain $\gamma$:

- **Vanishing gradients ($\gamma < 1$):** Saturating activations or small weights shrink $\gamma^{L-1} \to 0$, starving early layers of learning signal (and low-precision formats can round tiny gradients to exact `0.0`).
- **Exploding gradients ($\gamma > 1$):** Large weights amplify $\gamma^{L-1} \to \infty$, causing wild updates or `NaN` overflow.

Modern Transformers keep $\gamma \approx 1$ using **residual connections** (providing an additive shortcut with derivative `1`), **normalization** layers, and careful weight initialization. When spikes still happen, **gradient norm clipping** rescales the entire gradient vector $\mathbf{g}$ whenever its Euclidean norm exceeds threshold $C$, preserving its direction:[^pascanu2013][^pytorchClipGrad2026]

$$
\mathbf{g} \leftarrow \mathbf{g} \cdot \min\left(1, \frac{C}{\|\mathbf{g}\|_2 + \epsilon}\right)
$$

<!-- leetllm: test, deps=torch, output=show -->
```python title="gradient-clipping-deep-flow.py"
import torch
from torch import nn

layers = [nn.Linear(4, 4, bias=False) for _ in range(5)]
model = nn.Sequential(*layers)
with torch.no_grad():
    for layer in layers:
        layer.weight.fill_(2.0)

loss = model(torch.ones(1, 4)).sum()
loss.backward()

raw_norm = nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0, error_if_nonfinite=True).item()
post_norm = torch.sqrt(sum(p.grad.norm() ** 2 for p in model.parameters())).item()
print(f"before clip: {raw_norm:.2f}  after clip: {post_norm:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
before clip: 36635.74  after clip: 5.00
```
<!-- leetllm: output:end -->

## PyTorch autograd, vector-Jacobian products, and traps

Reverse-mode automatic differentiation computes all parameter derivatives for one scalar loss in a single backward pass whose cost is comparable to the forward pass.[^baydin2018] In <span data-glossary="pytorch">PyTorch</span>, marking a leaf <span data-glossary="tensor">tensor</span> with `requires_grad=True` records operations into a dynamic graph and writes derivatives into `.grad` when `backward()` runs.[^pytorch2026autograd]

Three framework behaviors trip up beginners:

1. **Gradient persistence across calls:** Calling `backward()` twice *adds* into `.grad` instead of replacing it, which supports multi-batch accumulation but doubles updates unless you clear gradients with `optimizer.zero_grad()` or `w.grad = None`.[^pytorch2026optimization]
2. **Vector-Jacobian products (VJPs):** Calling `backward(seed)` on a non-scalar output multiplies the output Jacobian $J$ by the seed vector $v$ ($J^\top v$) without materializing $J$.[^pytorchBackward2026] For two predictions with rows `[1, 0.5]` and `[3, 0.5]`, seed `[-1, +1]` differentiates `pred[1] - pred[0]` and gives `[2.0, 0.0]`.
3. **In-place mutation errors:** Overwriting a tensor saved for backward (like a sigmoid output `b.add_(1.0)`) or writing in-place into a stride-0 `.expand()` view raises a `RuntimeError`; use out-of-place ops or `.clone()` first.[^pytorchExpand2026]

<!-- leetllm: test, deps=torch,numpy, output=show -->
```python title="pytorch-autograd-and-vjp.py"
import numpy as np
import torch

X = torch.tensor([[1.0, 0.5], [2.0, 1.0], [3.0, 0.5], [4.0, 2.0]], dtype=torch.float64)
y = torch.tensor([2.5, 5.0, 6.5, 10.0], dtype=torch.float64)
w = torch.tensor([1.3, 1.1], dtype=torch.float64, requires_grad=True)

# 1. Backward accumulates until cleared
torch.mean((X @ w - y) ** 2).backward()
first = w.grad.detach().clone().tolist()
torch.mean((X @ w - y) ** 2).backward()
second = w.grad.detach().clone().tolist()
w.grad = None
torch.mean((X @ w - y) ** 2).backward()
reset = w.grad.detach().clone().tolist()
print("first:", np.round(first, 3).tolist(), "second:", np.round(second, 3).tolist(), "reset:", np.round(reset, 3).tolist())

# 2. Seeded vector-Jacobian product for prediction[2] - prediction[0]
w.grad = None
preds = X[[0, 2]] @ w
preds.backward(torch.tensor([-1.0, 1.0], dtype=torch.float64))
print("seeded VJP gradient:", w.grad.tolist())

# 3. In-place overwrite of a saved sigmoid output triggers RuntimeError
a = torch.tensor([2.0], requires_grad=True)
b = torch.sigmoid(a)
c = b * 3
b.add_(1.0)
try:
    c.backward()
except RuntimeError as err:
    print("in-place trap:", str(err).splitlines()[0][:76])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
first: [-9.9, -3.925] second: [-19.8, -7.85] reset: [-9.9, -3.925]
seeded VJP gradient: [2.0, 0.0]
in-place trap: one of the variables needed for gradient computation has been modified by an
```
<!-- leetllm: output:end -->

When a training run blows up or stalls, verify four checks on a tiny deterministic batch: forward loss is finite, gradients have the right shape and sign, a `float64` centered finite difference agrees at smooth points, and one small step lowers loss. If all four pass yet training diverges, inspect the learning rate, feature scale, and gradient norm before rewriting your backward pass.

```mastery-quiz
[
  {
    "question": "A model predicts ŷ = wx with squared error loss. With x = 3, w = 2, and target y = 8, what are the gradient dL/dw, updated weight, and new loss after one gradient-descent step at learning rate 0.05?",
    "options": [
      "−6; 2.3; 1.21.",
      "−12; 1.4; 14.44.",
      "−12; 2.6; 0.04.",
      "−2; 2.1; 2.89."
    ],
    "answer": "−12; 2.6; 0.04.",
    "explanation": "Prediction is 6, so error is −2 and gradient is 2 × (−2) × 3 = −12. Updating w = 2 − 0.05 × (−12) = 2.6 gives prediction 7.8 and loss (7.8 − 8)² = 0.04."
  },
  {
    "question": "For L(w) = (4w − y)², gradient descent runs at a fixed learning rate of 0.08. What factor multiplies the signed displacement (w − w*) on each step, and does distance shrink or grow?",
    "options": [
      "−1.56; distance grows.",
      "−0.28; distance shrinks.",
      "0.36; distance shrinks.",
      "1.56; distance grows."
    ],
    "answer": "−1.56; distance grows.",
    "explanation": "The gradient is 2x²(w − w*) = 32(w − w*), so each step multiplies displacement by 1 − 0.08 × 32 = −1.56. Because |−1.56| > 1, the weight crosses w* and diverges."
  },
  {
    "question": "Three computation-graph paths reach one shared parameter with gradient contributions +7, −4, and +1 (with no mean reduction). What gradient enters that parameter's buffer?",
    "options": [
      "−28.",
      "4.",
      "7.",
      "4/3."
    ],
    "answer": "4.",
    "explanation": "By the multivariable chain rule, all paths feeding the same parameter add their sensitivities: 7 − 4 + 1 = 4."
  },
  {
    "question": "A Jacobian J has rows [2, 1] and [5, 1] (one row per prediction, one column per weight). Running backward with seed v = [−2, +1] differentiates which quantity, and returns what gradient?",
    "options": [
      "Second minus first; [3, 0].",
      "Twice first minus second; [−1, 1].",
      "Second minus twice first; [−3, −9].",
      "Second minus twice first; [1, −1]."
    ],
    "answer": "Second minus twice first; [1, −1].",
    "explanation": "Seed [−2, +1] weights prediction 2 minus twice prediction 1, computing Jᵀv = [5 − 2×2, 1 − 2×1] = [1, −1]."
  },
  {
    "question": "A leaf parameter starts with `.grad = None`. Two freshly computed losses each contribute [−3, 5] via `backward()`, then `.grad` is set to `None` and a third identical pass runs. What are `.grad` after the second and third passes?",
    "options": [
      "[−6, 10]; [−3, 5].",
      "[−3, 5]; [0, 0].",
      "[−1.5, 2.5]; [−3, 5].",
      "[3, −5]; [−6, 10]."
    ],
    "answer": "[−6, 10]; [−3, 5].",
    "explanation": "PyTorch accumulates gradients across consecutive backward calls ([−6, 10]) until explicitly cleared; resetting to `None` lets the third pass store a clean [−3, 5]."
  },
  {
    "question": "In a deep network without residual shortcuts, each layer's backward Jacobian scales gradients by roughly 1.8. What happens to early-layer gradients across 20 layers, and how does gradient norm clipping respond?",
    "options": [
      "Gradients vanish toward zero; norm clipping boosts them up to threshold C.",
      "Gradients explode as 1.8¹⁹; norm clipping rescales the full gradient vector to norm C while keeping its direction.",
      "Gradients explode as 1.8¹⁹; norm clipping clamps each coordinate independently, changing the update direction.",
      "Gradients stay near norm 1 because backpropagation automatically normalizes each layer."
    ],
    "answer": "Gradients explode as 1.8¹⁹; norm clipping rescales the full gradient vector to norm C while keeping its direction.",
    "explanation": "Repeated multiplication by factors above 1 causes exponential explosion. Gradient norm clipping multiplies the whole gradient vector by C / ‖g‖ when ‖g‖ > C, bounding step size without distorting direction."
  }
]
```

> **Next:** Continue to [Probability for Machine Learning](/learn/probability-for-machine-learning).

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Start with the smallest model that can learn anything: one knob. A request has a 200-token prompt, which we write as 2 because we count in hundreds of tokens, and it took 5 seconds. Our model multiplies by an adjustable number $w$, currently 3, so it predicts $3 \times 2 = 6$ seconds. The loss is the squared error, $(6 - 5)^2 = 1$.

Should $w$ go up or down? Chapter 1 answered that by trying it. Add 0.001 to $w$, and the loss rises from 1.000000 to 1.004004. Divide the change in loss by the change in $w$ and you get a slope of about 4. Positive means that raising $w$ makes things worse, so we should lower it.

## The slope, exactly

You can get that slope without any trial. Write the loss as a function of the knob:

$$
L(w) = (2w - 5)^2
$$

Calculus calls the slope at a point the **derivative**, and writes it $dL/dw$. It is what the nudging ratio approaches as the nudge shrinks toward zero.[^openstaxDerivative2016] You only need a few facts about derivatives here, because this chapter's network uses simple operations: the derivative of $x^2$ is $2x$, the derivative of $ax$ is $a$, and constants contribute nothing.

Our loss, though, is one function inside another. Think of a chain of two gears. Turning $w$ moves the prediction twice as fast, because the prediction is $2w$. And the loss moves at twice the error, because of the square. If one gear doubles a motion and the next doubles it again, the total is the product of the two rates. That is the **chain rule**, and it is the one piece of calculus this chapter really needs:[^openstaxChainRule2016]

$$
\frac{dL}{dw} = \underbrace{2(2w - 5)}_{\text{loss per unit of prediction}} \times \underbrace{2}_{\text{prediction per unit of } w}
$$

At $w = 3$, that gives $2 \times 1 \times 2 = 4$. The nudge said about 4.004, because a nudge of 0.001 is not quite zero, and this says exactly 4. With the slope in hand, take the downhill step from Chapter 1:

$$
w_{\text{new}} = w - \text{learning rate} \times \frac{dL}{dw}
$$

<!-- leetllm: test, output=show, id=reader-backprop-descent -->
```python title="one-knob-gradient-descent.py"
w, x, y = 3.0, 2.0, 5.0
learning_rate = 0.1

print("step  weight  prediction      loss  gradient")
for step in range(5):
    prediction = w * x
    loss = (prediction - y) ** 2
    gradient = 2 * (prediction - y) * x
    row = f"{step:4d}  {w:6.4f}  {prediction:10.4f}  {loss:8.6f}"
    print(f"{row}  {gradient:8.4f}")
    w -= learning_rate * gradient
```

<!-- leetllm: output:start -->
```text title="Output" output compact
step  weight  prediction      loss  gradient
   0  3.0000      6.0000  1.000000    4.0000
   1  2.6000      5.2000  0.040000    0.8000
   2  2.5200      5.0400  0.001600    0.1600
   3  2.5040      5.0080  0.000064    0.0320
   4  2.5008      5.0016  0.000003    0.0064
```
<!-- leetllm: output:end -->

Each row's gradient is smaller than the last, because the slope flattens as you approach the bottom. So the steps shrink on their own. The weight is closing in on 2.5, where the prediction is exactly 5 and the loss is zero.

## The learning rate can wreck a correct gradient

The gradient gives you a direction, and it only tells you the truth about the ground right under your feet. The learning rate decides how far to walk on that information.

<figure>
  <img src="illustrations/_generated/learning_rate_paths_dark.png" alt="Three panels show gradient descent on the same loss curve, L of w equals 2 w minus 5, squared, starting from w equals 3. With learning rate 0.05 the steps creep steadily toward the minimum at w equals 2.5. With 0.2 they zigzag across the minimum and still converge. With 0.26 each step overshoots further than the last, and the loss grows." />
  <figcaption>Same loss, same start, and the same correct gradient. Only the step size changes. In exact arithmetic, rates strictly between 0 and 0.25 converge from this start, while rates above 0.25 diverge.</figcaption>
</figure>

For this curve, each update multiplies the signed displacement $w - 2.5$ by $1 - 8 \times \text{rate}$. The magnitude of that factor tells you how the distance changes. From this start, the run converges for rates strictly between 0 and 0.25. At 0.25 the weight alternates between 3 and 2. At the pictured rate of 0.26, the weight crosses the minimum each time, the distance grows by a factor of 1.08, and the loss grows by a factor of 1.1664 from the first step. With finite precision, a sufficiently large squared loss overflows to `inf` and then `NaN` in PyTorch (or raises `OverflowError` in plain Python).

The limit also depends on your units. Measure the input in raw tokens instead of hundreds, and the safe rate shrinks by a factor of ten thousand, even though the model's predictions are the same. So a learning rate that worked before can blow up after a change that looks cosmetic. Picking one is an experiment, and Chapter 5 describes the optimizer that makes the choice less delicate.

```checkpoint
Training was stable, and then a teammate changed one input feature from seconds to milliseconds. Now the loss goes to `nan` within a few steps. What is the likely cause?
---
The input values became a thousand times larger, so the gradients and the curvature of the loss grew with them. A learning rate that was safe before now oversteps the minimum and diverges. Rescale the feature, or lower the rate.
```

## Straight lines are not enough

We have only trained straight lines so far, and it is time to face their limit. Here is a shape every infrastructure engineer knows: latency against server utilization. It sits nearly flat, then climbs, then climbs faster as the server saturates.

No line fits that, and stacking more linear layers will not help. If $Y = XW_1$ and $Z = YW_2$, then $Z = X(W_1 W_2)$, which is one linear layer in disguise. Any tower of matrix multiplications collapses to a single matrix. To model anything interesting, we have to bend something.

A very common bend is about as simple as a function gets. It is called the **rectified linear unit**, or **ReLU**, and it passes positive numbers through and turns negative numbers into zero:[^nair2010]

$$
\mathrm{ReLU}(h) = \max(0, h)
$$

One ReLU gives you one bend, at a place the weights can move. Several units can combine their bends into more complex piecewise-linear shapes.

<figure>
  <img src="illustrations/_generated/relu_bends_dark.png" alt="Latency against server utilization follows a hockey stick: flat near 50 milliseconds, then rising after 0.6 and more steeply after 0.8. Left: the best straight line misses both the flat region and the steep end. Right: two ReLU units, each flat and then rising from its own bend, add up with a base value to fit the curve exactly." />
  <figcaption>A straight line cannot follow a hockey stick, no matter how you fit it. Two ReLU units, plus a base value, can. Each unit contributes one bend, and training decides where the bends go and how steep they are.</figcaption>
</figure>

And that is a **neural network**: linear layers with a simple nonlinearity between them. Each layer between the input and the output is called a **hidden layer**. Here is the two-layer form you will meet again, in the Transformer's feed-forward block in Part 1:

$$
\mathrm{FFN}(x) = \mathrm{ReLU}(xW_1 + b_1)W_2 + b_2
$$

## Backpropagation: the slope of every knob at once

Now for the problem from Chapter 1. Nudging takes one full pass per knob, on every step. A model with a billion knobs would need a billion passes to take one step. Training would never finish.

Go back to the chain rule, and notice something about how it runs. Every knob's slope is a product of local rates along the path from that knob to the loss. Knobs that sit near each other share nearly all of that path. So compute the shared part once, starting at the loss and walking backward, and reuse it at each branch.

That reverse walk is **backpropagation**.[^rumelhart1986] It computes the gradient of one loss with respect to all parameters in one backward pass, with an operation count comparable to the forward evaluation for the usual elementary operations.[^baydin2018] Large neural networks are practical because of that one fact.

Let's do it by hand on the smallest network with all the parts. It has one hidden unit and four knobs:

$$
h = w_1 x + b_1, \qquad z = \mathrm{ReLU}(h), \qquad \hat{y} = w_2 z + b_2, \qquad L = (\hat{y} - y)^2
$$

Take $x = 2$ and target $y = 5$, with $w_1 = 1.5$, $b_1 = -1$, $w_2 = 2$, and $b_2 = 0.5$. Going forward gives $h = 2$, $z = 2$, $\hat{y} = 4.5$, and $L = 0.25$. Then, going backward, you multiply one local rate at each step, as the next figure shows.

<figure>
  <img src="illustrations/_generated/backprop_graph_dark.png" alt="A tiny network as a left-to-right chain. Forward pass: input x equals 2 goes through w1 times x plus b1 to give h equals 2, through ReLU to give z equals 2, through w2 times z plus b2 to give y hat equals 4.5, and against target 5 to give loss 0.25. Backward pass, right to left: the loss signal is 1, the derivative with respect to y hat is minus 1, with respect to z is minus 2, with respect to h is minus 2. Parameter gradients branch off: w2 gets minus 2, b2 gets minus 1, w1 gets minus 4, and b1 gets minus 2." />
  <figcaption>The forward pass computes values, and the backward pass reuses them. Starting from the loss, each step multiplies by one local rate, and each knob reads its gradient from the signal passing its stage. All four gradients come from a single backward pass.</figcaption>
</figure>

Trace it once with a finger, because this is the whole algorithm. At the loss, the signal is $2(\hat{y} - y) = -1$. To reach $z$, multiply by $w_2 = 2$, giving $-2$. ReLU is passing its input through here, so its local rate is 1, and the signal stays $-2$. To reach $w_1$, multiply by $x = 2$, giving $-4$. The gradients are all negative, which fits: the prediction of 4.5 is too low, so raising any of these knobs helps. The code does the same walk, then checks itself against the slow method:

<!-- leetllm: test, output=show, id=reader-backprop-by-hand -->
```python title="backpropagate-by-hand.py"
def forward(w1, b1, w2, b2, x=2.0, y=5.0):
    h = w1 * x + b1
    z = max(0.0, h)
    prediction = w2 * z + b2
    return h, z, prediction, (prediction - y) ** 2

knobs = {"w1": 1.5, "b1": -1.0, "w2": 2.0, "b2": 0.5}
x, y = 2.0, 5.0

# One forward pass stores the values that the backward pass needs.
h, z, prediction, loss = forward(**knobs)

# One backward pass walks from the loss toward the input.
signal = 2 * (prediction - y)            # dL/d(prediction)
grads = {"b2": signal, "w2": signal * z}
signal *= knobs["w2"]                    # dL/dz
signal *= 1.0 if h > 0 else 0.0          # dL/dh, through ReLU
grads["b1"] = signal
grads["w1"] = signal * x

# The slow way: one more forward pass per knob.
eps = 1e-6
for name in knobs:
    nudged = dict(knobs)
    nudged[name] += eps
    slope = (forward(**nudged)[3] - loss) / eps
    print(f"{name}: backprop={grads[name]:6.2f}   nudging={slope:6.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
w1: backprop= -4.00   nudging= -4.00
b1: backprop= -2.00   nudging= -2.00
w2: backprop= -2.00   nudging= -2.00
b2: backprop= -1.00   nudging= -1.00
```
<!-- leetllm: output:end -->

They agree. Comparing the two like this is called a **gradient check**, and it is the right way to test any backward code you write by hand. The cost difference is what matters, though. Nudging needed one extra forward pass per knob, and backprop computed everything in one backward pass. With a billion knobs, that ratio is the difference between possible and impossible.

Frameworks such as PyTorch perform this walk for you. They record each operation as it runs and apply the chain rule when you call `loss.backward()`. Chapter 5 uses that.

<details>
<summary>Deep dive: Build a 40-line scalar autograd engine</summary>

Andrej Karpathy's Micrograd strips automatic differentiation down to one tiny Python class.[^karpathy2020micrograd] Each `Value` holds a scalar `.data`, its gradient `.grad`, links to its parents, and a tiny `_backward` closure. Calling `loss.backward()` walks the graph in reverse topological order and adds (`+=`) each path's contribution so shared knobs accumulate cleanly:

<!-- leetllm: test, output=show, id=reader-scalar-autograd -->
```python title="reader-scalar-autograd.py"
class Value:
    def __init__(self, data: float, parents: tuple = ()):
        self.data = float(data)
        self.grad = 0.0
        self.parents = parents
        self._backward = lambda: None

    def _wrap(self, other):
        return other if type(other) is Value else Value(other)

    def __add__(self, other):
        other = self._wrap(other)
        out = Value(self.data + other.data, (self, other))
        def backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = backward
        return out

    def __mul__(self, other):
        other = self._wrap(other)
        out = Value(self.data * other.data, (self, other))
        def backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = backward
        return out

    def __sub__(self, other):
        return self + (self._wrap(other) * -1.0)

    def __pow__(self, exponent: float):
        out = Value(self.data ** exponent, (self,))
        def backward():
            self.grad += exponent * (self.data ** (exponent - 1)) * out.grad
        out._backward = backward
        return out

    def relu(self):
        out = Value(max(0.0, self.data), (self,))
        def backward():
            self.grad += (1.0 if self.data > 0 else 0.0) * out.grad
        out._backward = backward
        return out

    def backward(self):
        order, seen = [], set()
        def visit(node):
            if node not in seen:
                seen.add(node)
                for p in node.parents:
                    visit(p)
                order.append(node)
        visit(self)
        for node in order:
            node.grad = 0.0
        self.grad = 1.0
        for node in reversed(order):
            node._backward()

w1, b1, w2, b2 = Value(1.5), Value(-1.0), Value(2.0), Value(0.5)
loss = ((w1 * 2.0 + b1).relu() * w2 + b2 - 5.0) ** 2
loss.backward()
print(f"w1={w1.grad:.1f}  b1={b1.grad:.1f}  w2={w2.grad:.1f}  b2={b2.grad:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
w1=-4.0  b1=-2.0  w2=-2.0  b2=-1.0
```
<!-- leetllm: output:end -->

Every gradient matches our hand trace (`-4`, `-2`, `-2`, `-1`), and the `+=` accumulation ensures that if the same knob feeds two branches, both paths add together automatically.

</details>

```checkpoint
Why does backpropagation need to keep values from the forward pass, and what does that imply for memory during training compared with inference?
---
Local rates depend on forward values. For example, the rate for $w_2$ is $z$, and ReLU's rate depends on the sign of $h$. So training has to hold those intermediate values until the backward pass uses them, which is one reason training needs far more memory than inference for the same model. Chapter 6 puts numbers on this.
```

## How gradients go wrong

Because the gradient is a long product of local rates, it inherits the problems of long products. Three of them are worth knowing by name.

**Gradients can die.** Take ReLU's local rate. When $h$ is negative, the output is stuck at zero, and a small change in $h$ does nothing. So its rate is 0, and everything upstream of it receives a gradient of exactly zero. If $h$ stays negative for every example in your data, that unit stops learning, which is why people call it a dead ReLU.

<!-- leetllm: test, output=show, id=reader-backprop-dead-relu -->
```python title="a-relu-that-stopped-learning.py"
x, y = 2.0, 5.0
w1, b1, w2, b2 = 1.5, -4.0, 2.0, 0.5  # b1 is now large and negative

h = w1 * x + b1
z = max(0.0, h)
prediction = w2 * z + b2
signal = 2 * (prediction - y)

loss = (prediction - y) ** 2
print("h:", h, " z:", z, " prediction:", prediction, " loss:", loss)
print("gradient for w1:", signal * w2 * (1.0 if h > 0 else 0.0) * x)
print("gradient for b2:", signal)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
h: -1.0  z: 0.0  prediction: 0.5  loss: 20.25
gradient for w1: -0.0
gradient for b2: -9.0
```
<!-- leetllm: output:end -->

The loss here is large, 20.25, and $w_1$ still receives a gradient of zero. (Python prints `-0.0`, which equals zero.) Nothing is telling it to change.

**Gradients can vanish or explode.** In an $L$-layer network, each layer multiplies the backward signal by its weights and activation slope, so early-layer gradients scale roughly like $\gamma^{L-1}$. Multiply many factors below 1 (for instance, $0.5^{20} \approx 10^{-6}$) and the signal **vanishes**, leaving early layers frozen. Multiply many factors above 1 ($1.8^{20} \approx 1.3 \times 10^5$) and the signal **explodes**, wrecking the next update. Three workhorse ideas tame this behavior: **residual connections** (adding a layer's input to its output so gradients have a direct path with slope 1), **normalization** (keeping activations at a steady scale), and **gradient norm clipping** (rescaling the full gradient vector whenever its norm exceeds a threshold $C$, capping step size without changing direction).[^pascanu2013]

**Gradients can be lost to rounding.** A gradient is a real number stored in a limited format. If it is small enough, a low-precision format rounds it to exactly zero, and the update vanishes with no error message. That happens in practice, and the mixed-precision chapter in Part 3 shows the fix. Chapter 6 introduces the number formats involved.

## What you can do now

You can read a learning curve and suspect the learning rate when it diverges. You can explain why a network needs nonlinearities, trace a backward pass by hand (or inside a 40-line autograd engine), and diagnose dying, vanishing, or exploding gradients. You also know why the hardware bill looks the way it does: one forward pass, one backward pass, and memory to carry values between them, repeated for every step of training.

In the next chapter, we wrap this calculation in a real loop over real data, teach a tiny model to predict the next character of text, and watch how it fails.

<!-- leetllm: edition:reader:end -->
