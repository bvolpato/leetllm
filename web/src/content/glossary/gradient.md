---
title: Gradient
importance: 96
---
The **gradient** of a differentiable scalar objective $L$ with respect to a parameter vector $\mathbf{w}$ is the vector of partial derivatives $\nabla_{\mathbf{w}} L$. Each component answers: if this parameter moved a tiny amount while the others stayed fixed, how would $L$ change? Where the gradient is nonzero, its direction gives steepest *ascent* under a Euclidean unit-step constraint, and its norm is that maximal directional derivative. Plain gradient descent steps in the opposite direction; loss decreases locally for a sufficiently small step. Other optimizers can use a different update direction.

In neural nets and LLMs, $L$ is almost always a batch loss (for example average cross-entropy on next tokens). The gradient lives in the same shape as the parameters: one tensor per weight matrix, bias, or adapter. Frameworks fill those tensors with reverse-mode automatic differentiation after `loss.backward()`; optimizers then turn $\nabla L$ into an update.

## Intuition

A single loss number does not say which of a billion weights is "wrong." The gradient is the local credit assignment: for every trainable value, a signed sensitivity of loss to that value.

The hill-walking picture is accurate at small scale. Stand on a foggy hillside (the loss surface). You cannot see the global valley, but a clinometer gives the slope under your feet. The gradient is that clinometer reading in every parameter direction at once. Move against it and height (loss) drops for a small enough step. Move with it and loss rises (gradient ascent, used in some adversarial and generative settings).

Two caveats keep the picture honest. First, the slope is *local*: a good direction near $\mathbf{w}$ can point the wrong way a few steps later on a curved surface. Second, minibatch training only estimates the full-data gradient, so the compass reading varies with the sampled batch.

## Formula

For a differentiable scalar $L: \mathbb{R}^n \to \mathbb{R}$,

$$
\nabla_{\mathbf{w}} L =
\begin{bmatrix}
\partial L / \partial w_1 \\
\vdots \\
\partial L / \partial w_n
\end{bmatrix}
$$

The first-order (linear) approximation around the current $\mathbf{w}$ is

$$
L(\mathbf{w} + \Delta\mathbf{w}) \approx L(\mathbf{w}) + \nabla_{\mathbf{w}} L \cdot \Delta\mathbf{w}
$$

so for a unit step, loss changes most when $\Delta\mathbf{w}$ aligns with the gradient, and least (most negative) when it aligns with $-\nabla_{\mathbf{w}} L$. Plain gradient descent uses that fact:

$$
\mathbf{w} \leftarrow \mathbf{w} - \eta\, \nabla_{\mathbf{w}} L
$$

with learning rate $\eta > 0$. For small enough $\eta$, $L$ does not increase when $L$ is smooth. Modern optimizers (SGD with momentum, AdamW) still start from $\nabla L$; they reshape, smooth, or rescale the step using gradient history rather than replacing the gradient itself.

In practice $L$ is a composition of layers. Reverse-mode autodiff (backpropagation) applies the chain rule so one backward pass yields all $\partial L / \partial w_i$ without building a full Jacobian of the network. When the "output" is a vector rather than a scalar, frameworks compute a vector-Jacobian product; training losses are scalars so `backward()` with no extra tensor is enough.

## Worked numbers

Take a toy loss of two parameters, $L(w_1, w_2) = w_1^2 + 4 w_2^2$, at $\mathbf{w} = (1, 1)$:

$$
\nabla L = (2 w_1,\, 8 w_2) = (2,\, 8)
$$

A unit step along the gradient would increase $L$ most quickly; the steepest-descent direction is $(-2, -8)$. With $\eta = 0.05$:

$$
\mathbf{w}' = (1, 1) - 0.05 \cdot (2, 8) = (0.9,\, 0.6)
$$

$L(1,1) = 5$ and $L(0.9, 0.6) = 0.81 + 1.44 = 2.25$, so one modest step cut the loss. Notice the $w_2$ axis is steeper (coefficient $4$ in $L$): the gradient correctly assigns a larger component there, and the update moves $w_2$ farther than $w_1$.

Same idea at one weight in a linear model. Prediction $\hat{y} = w x$, squared loss $L = \frac{1}{2}(\hat{y} - y)^2$, then

$$
\frac{\partial L}{\partial w} = (\hat{y} - y)\, x
$$

If $x = 2$, $y = 1$, $w = 0.8$, then $\hat{y} = 1.6$ and $\partial L/\partial w = 0.6 \cdot 2 = 1.2$. Descent decreases $w$, which pulls $\hat{y}$ toward $y$.

## Example

In PyTorch, leaf parameters with `requires_grad=True` accumulate $\partial L/\partial w$ in `.grad` after a scalar `backward()`. A minimal training step:

```python
import torch
import torch.nn.functional as F

w = torch.randn(4, 8, requires_grad=True)
b = torch.zeros(8, requires_grad=True)
x = torch.randn(2, 4)
y = torch.randint(0, 8, (2,))

logits = x @ w + b
loss = F.cross_entropy(logits, y)

# zero_grad first: backward *accumulates* into .grad
w.grad = None
b.grad = None
loss.backward()

# w.grad has shape (4, 8); b.grad has shape (8)
eta = 1e-2
with torch.no_grad():
    w -= eta * w.grad
    b -= eta * b.grad
```

For an LLM, the same pattern scales across every transformer block: next-token cross-entropy produces one scalar (or a reduced batch mean), and `backward()` walks the autograd graph through the LM head, residual stream, attention, and embeddings. Participating trainable tensors receive gradients of matching shape; unused or frozen tensors may have `.grad=None`. In adapter-only LoRA, frozen base weights do not accumulate gradients, while adapter gradients can be zero or nonzero. Mixed-precision training may scale the loss before backward so tiny FP16 gradients do not underflow, then unscale before the optimizer step.

## Debug path

Healthy training needs gradients that are finite, appropriately scaled, and actually attached to the parameters you intend to update.

| Signal | Typical meaning |
|---|---|
| Global grad norm $\to 0$ while loss is high | Vanishing signal: saturated activations, dead ReLUs, too-small loss scale, or broken data path |
| Grad norm spikes / `Inf` / `NaN` | Exploding grads, bad LR, overflow in FP16, or a pathological batch |
| Some modules always have zero `.grad` | Frozen params, detached graph, wrong `requires_grad`, or unused path in the forward |
| Loss falls but eval is garbage | Optimizing the wrong objective; gradients are "correct" for a bad $L$ |
| Sudden divergence after restore | Missing optimizer state, wrong LR schedule, or grads not zeroed (accumulation bug) |

Operational checks: log unclipped global L2 norm per step, fraction of clipped steps, first layer with non-finite values, and whether every trainable param participates. Compare a short FP32 run against FP16/BF16. If norms explode, lower $\eta$, enable [gradient clipping](glossary://gradient-clipping), fix data outliers, or check residual / norm placement. If norms vanish, inspect depth, activation choice, residual connections, and [loss scaling](glossary://loss-scaling). Always zero gradients before each logical step unless you are intentionally accumulating over micro-batches.

Production failure modes that show up as "gradient problems":

- **Silent graph breaks:** `.detach()`, incorrect `with torch.no_grad()`, or rebuilding modules so parameters are no longer the ones the optimizer holds.
- **Precision traps:** FP16 underflow of small grads without scaling; overflow of large intermediates under too-large scale.
- **Distributed mismatches:** partial all-reduce, unused parameters under DDP/FSDP, or different loss reduction (sum vs mean) across ranks, which rescales the effective gradient.
- **Accumulation bugs:** forgetting `zero_grad` so steps use summed history; or zeroing *after* `step` inconsistently with micro-batch counting.

## Why it matters here

Every training stack in this curriculum (pretraining, SFT, LoRA, DPO, RLHF) is a pipeline that turns a scalar objective into parameter updates. The gradient is the bridge: it is what backpropagation computes, what optimizers reshape, what clipping and loss scaling stabilize, and what you inspect when loss curves lie. Reading a training log without thinking about $\nabla L$ is reading only half the story.

## Related terms

- [Backpropagation](glossary://backpropagation)
- [Optimizer](glossary://optimizer)
- [Learning rate](glossary://learning-rate)
- [Gradient clipping](glossary://gradient-clipping)
- [Loss scaling](glossary://loss-scaling)
