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

Start with the smallest model that can learn anything: one adjustable weight. A 200-token request (`x = 2.0`, counted in hundreds of <span data-glossary="token">tokens</span>) took `y = 5.0` seconds, yet our model currently sets `w = 3.0` and predicts `3 × 2 = 6.0` seconds. Should `w` move up or down, and by how much?

The [NumPy lesson](/learn/numpy-and-tensor-shapes) organized inputs into tensors. Training closes the loop: turn prediction error into slopes, send those slopes backward through every operation in one pass, and step parameters downhill.

## One parameter, one loss, one slope

A **parameter** is a stored number updated during training. Here squared-error **loss** is $L(w) = (wx - y)^2 = (6 - 5)^2 = 1.0$. To test whether `w` should rise or fall, nudge it by `eps = 0.001`: prediction moves from `6.000` to `6.002`, loss rises to `1.004004`, and the **finite-difference** slope estimate is `(1.004004 - 1.000000) / 0.001 = 4.004`. Positive slope means raising `w` makes loss worse, so `w` must go down.

Shrinking the nudge $h \to 0$ gives the exact **derivative** $dL/dw$:[^openstaxDerivative2016]

$$
\frac{(1 + 2h)^2 - 1}{h} = \frac{4h + 4h^2}{h} = 4 + 4h \xrightarrow{h \to 0} 4
$$

Because $L(w) = (2w - 5)^2$ nests one function inside another, think of two meshing gears. Turning $w$ moves the prediction twice as fast, and squaring moves the loss at twice the error. Multiplying those local rates is the **chain rule**:[^openstaxChainRule2016]

$$
\frac{dL}{dw} = \underbrace{2(2w - 5)}_{\text{loss per unit of prediction}} \times \underbrace{2}_{\text{prediction per unit of } w} = 4(2w - 5)
$$

At `w = 3`, $dL/dw = 4$. A **centered finite difference** `(loss(w + eps) - loss(w - eps)) / (2 * eps)` cancels the quadratic's $h$ term and matches the analytical derivative cleanly:

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

**Gradient descent** moves opposite the <span data-glossary="gradient">gradient</span>, scaled by a <span data-glossary="learning-rate">learning rate</span> $\eta$:

$$
w_{\text{new}} = w - \eta \frac{dL}{dw}
$$

Starting at `w = 3.0` with $\eta = 0.1$, the first step lands at $3.0 - 0.1 \times 4 = 2.6$, slashing loss from `1.0` to `0.04`. Repeating shrinks both loss and slope toward `w = 2.5`. (On non-convex surfaces, a zero derivative also appears at local maxima and saddle points, not only at minima.)

Calculus only names the downhill direction under your feet, never how far to walk. Keep the exact same gradient `4` and raise $\eta$: at `0.125` you land directly on `2.5`; at `1.0` you jump past the valley to `w = -1.0` and blow loss up to `49.0`.

<figure>
  <img src="illustrations/_generated/optimizer_control_loop_dark.png" alt="Three updates on L(w) = (2w - 5)^2 from w = 3, loss 1, and gradient 4. Learning rate 0.1 gives w = 2.6 and loss 0.04. Rate 0.125 gives w = 2.5 and loss 0. Rate 1 gives w = -1 and loss 49. The dashed tangent has slope 4 at the starting point." />
  <figcaption>Each arrow starts at `w = 3` and uses the same gradient `4`. Rate `0.1` takes a steady downhill step; `0.125` hits the exact minimum; `1.0` overshoots to loss `49`.</figcaption>
</figure>

Because $dL/dw = 8(w - 2.5)$, each step multiplies signed displacement from `2.5` by $(1 - 8\eta)$:

$$
w_{\text{new}} - 2.5 = (1 - 8\eta)(w - 2.5)
$$

Distance shrinks strictly when $|1 - 8\eta| < 1$, i.e. $0 < \eta < 0.25$. At $\eta = 0.25$, `w` bounces forever between `3` and `2`; above `0.25`, it diverges. Even switching input units shifts that window: measuring raw tokens (`x = 200`) instead of 100-token blocks (`x = 2`) multiplies curvature by $100^2 = 10{,}000$, shrinking the safe range to $0 < \eta < 0.000025$.

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

## Partial derivatives, ReLU bends, and backpropagation

Stacking linear layers alone never bends a curve: $Y = XW_1$ followed by $Z = YW_2$ collapses into a single linear map $X(W_1W_2)$. Real workloads, like latency climbing sharply as server utilization approaches saturation, need nonlinearities such as **ReLU** ($\max(0, h)$).[^nair2010] Each ReLU contributes one bend whose location and slope training adjusts:

<figure>
  <img src="illustrations/_generated/relu_bends_dark.png" alt="Latency against server utilization follows a hockey stick: flat near 50 milliseconds, then rising after 0.6 and more steeply after 0.8. Left: the best straight line misses both the flat region and the steep end. Right: two ReLU units, each flat and then rising from its own bend, add up with a base value to fit the curve exactly." />
  <figcaption>A straight line misses both the flat region and the steep tail. Combining ReLU bends between linear layers creates piecewise-linear functions that fit curved relationships.</figcaption>
</figure>

Now add a second feature, queue delay `x_q = 1.0` second, alongside prompt blocks `x_p = 2.0`, with weights `[w_p, w_q] = [2.0, 2.0]` predicting $\hat{y} = w_p x_p + w_q x_q = 6.0$ against target `y = 5.0`. Each **partial derivative** ($\partial$) measures sensitivity to one parameter while holding others fixed:

$$
\frac{\partial L}{\partial w_p} = 2(\hat{y} - y)x_p = 4, \qquad \frac{\partial L}{\partial w_q} = 2(\hat{y} - y)x_q = 2
$$

Nudging parameters one by one would require a billion forward passes per step on a billion-parameter model. **<span data-glossary="backpropagation">Backpropagation</span>** exploits shared paths in the chain rule: run one forward pass saving intermediate values needed by backward rules (`prediction = 6`, `error = 1`, `loss = 1`), then walk right to left from `dL/dL = 1` multiplying local derivatives to populate every entry of the gradient <span data-glossary="vector">vector</span> `[4, 2]` in one backward pass.[^rumelhart1986][^baydin2018] (Holding those forward activations until backward finishes is why training uses far more memory than inference.)

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Dual-pass autograd execution: The forward pass computes activations from left to right: features x_p = 2.0 and x_q = 1.0 with weights w_p = 2.0 and w_q = 2.0 produce prediction 6.0, residual error 1.0, and loss 1.0. The backward pass propagates adjoints in reverse from right to left: loss seed 1.0 scales through error adjoint 2.0 and prediction adjoint 2.0 to yield weight gradients dL/dw_p = 4.0 and dL/dw_q = 2.0." />
  <figcaption>The forward pass saves values needed by backward rules. Starting from `dL/dL = 1`, multiplying local derivatives along each path yields `4.0` for `w_p` and `2.0` for `w_q` in one pass.</figcaption>
</figure>

For **ReLU** ($\max(0, h)$), the local derivative is `1` when $h > 0$ and `0` when $h < 0$. If $h = w_p x_p$ drops below zero, ReLU zeros both its output and the backward gradient, freezing `w_p` on that example (a **dead ReLU** if it stays negative across the dataset). At the corner $h = 0$, left and right slopes disagree, so PyTorch uses `0` by convention.[^pytorch2026autograd][^pytorch2026gradcheckapi]

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

When one parameter feeds multiple branches, perturbing it affects every branch at once, so their backward contributions **add**. Tie both features to one shared weight $w = 2$ in $\hat{y} = w x_p + w x_q$: the prompt branch sends `2 × 1 × 2 = 4`, the queue branch sends `2 × 1 × 1 = 2`, and `w` accumulates `4 + 2 = 6` (matching $d/dw[(3w - 5)^2] = 6$).

<figure>
  <img src="illustrations/_generated/chain_rule_graph_dark.png" alt="Multi-variable chain rule graph accumulation: Loss L = 1.0 propagates backward through residual error e = 1.0 (sensitivity 2.0) to prediction ŷ = 6.0 (adjoint 2.0). From the prediction, two separate branches evaluate: prompt path contributes (2.0) * (2.0) = 4.0, while queue path contributes (2.0) * (1.0) = 2.0. Both branches converge at the shared parameter w = 2.0, where their sensitivities accumulate: dL/dw = 4.0 + 2.0 = 6.0." />
  <figcaption>When one parameter feeds multiple calculation paths, its total derivative sums every branch: `4.0 + 2.0 = 6.0`.</figcaption>
</figure>

<details>
<summary>Deep dive: A tiny scalar autograd engine</summary>

Andrej Karpathy's Micrograd captures reverse-mode automatic differentiation in ~45 lines of Python: each `Value` stores a scalar `.data`, its gradient `.grad`, parent nodes, and a `_backward` closure.[^karpathy2020micrograd] Running `backward()` sorts the computation graph topologically so outputs visit parents in reverse order, and every local rule uses `+=` so shared variables sum incoming branches:

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

Stack four requests obeying `y = 2 * prompt_blocks + queue_seconds` into a `(4, 2)` matrix `X` and minimize mean squared error $\frac{1}{N}\sum_i (\hat{y}_i - y_i)^2$, whose vectorized gradient is `(2 / len(X)) * (X.T @ errors)`:

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

Loss drops rapidly in ten steps, then creeps toward `[2, 1]`. Because prompt length and queue delay rise together, moving `w_p` up while moving `w_q` down partly cancels in predictions, creating uneven curvature (**conditioning**) where a step size safe along the steep wall makes slow progress along the valley floor.[^boyd2004convex] Always run gradient checks in `float64`: subtracting two nearly equal `float32` losses suffers catastrophic cancellation even when the analytical derivative is exact.[^pytorch2026gradcheckapi]

## Vanishing and exploding gradients in deep networks

In an $L$-layer network $h_l = \sigma(W_l h_{l-1} + b_l)$, each backward step multiplies the arriving gradient $g_l = \partial L / \partial h_l$ by the layer's weight transpose and activation slope:

$$
g_{l-1} = W_l^\top \left(g_l \odot \sigma'(z_l)\right)
$$

Repeating that product across $L$ layers makes early-layer gradients scale roughly as $\gamma^{L-1}$ for an effective per-layer gain $\gamma$:

- **Vanishing gradients ($\gamma < 1$):** Saturating activations or small weights drive $\gamma^{L-1} \to 0$, freezing early layers (and low-precision formats round tiny gradients to exact `0.0`).
- **Exploding gradients ($\gamma > 1$):** Large weights amplify $\gamma^{L-1} \to \infty$, wrecking updates or overflowing to `NaN`.

Modern Transformers keep $\gamma \approx 1$ using **residual connections** (adding an identity shortcut with slope `1`), **normalization** layers, and careful initialization. When spikes still happen, **gradient norm clipping** rescales the entire gradient vector $\mathbf{g}$ whenever $\|\mathbf{g}\|_2$ exceeds threshold $C$, bounding step size while preserving direction:[^pascanu2013][^pytorchClipGrad2026]

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

In <span data-glossary="pytorch">PyTorch</span>, marking a leaf <span data-glossary="tensor">tensor</span> with `requires_grad=True` records operations into a dynamic graph and writes derivatives into `.grad` when `backward()` runs.[^pytorch2026autograd] Three framework behaviors catch newcomers off guard:

1. **Gradient persistence across calls:** Calling `backward()` twice *adds* into `.grad` rather than replacing it, which supports gradient accumulation across micro-batches yet doubles updates unless you clear gradients with `optimizer.zero_grad()` or `w.grad = None`.[^pytorch2026optimization]
2. **Vector-Jacobian products (VJPs):** Calling `backward(seed)` on a non-scalar output computes $J^\top v$ without materializing the Jacobian $J$.[^pytorchBackward2026] For two predictions with rows `[1, 0.5]` and `[3, 0.5]`, seed `[-1, +1]` differentiates `pred[1] - pred[0]` and returns `[2.0, 0.0]`.
3. **In-place mutation errors:** Overwriting a tensor saved for backward (like `b.add_(1.0)` on a sigmoid output) or writing in-place into a stride-0 `.expand()` view raises `RuntimeError`; use out-of-place ops or `.clone()` first.[^pytorchExpand2026]

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

When a run blows up or stalls, verify four checks on one deterministic batch: forward loss is finite, gradients have the expected shape and sign, a `float64` centered finite difference agrees at smooth points, and one small step lowers loss. If all four pass yet training diverges, inspect learning rate, feature scale, and gradient norm before rewriting your backward pass.

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
