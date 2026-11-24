---
{
  "id": "layer-normalization-pre-ln-post-ln",
  "title": "Layer Normalization: Pre-LN vs Post-LN",
  "slug": "layer-normalization-pre-ln-post-ln",
  "section": "Transformer Deep Dives",
  "category": "Transformer Architecture",
  "difficulty": "Hard",
  "order": 6,
  "prerequisites": [
    "positional-encoding-rope-alibi"
  ],
  "coverImage": "illustrations/_generated/layer_norm_dark.png",
  "companies": [
    "Google",
    "Meta",
    "Microsoft",
    "DeepMind",
    "OpenAI",
    "Anthropic"
  ],
  "shortDescription": "Each residual write can change a token's scale, and where LayerNorm sits decides what the next branch reads and how its gradient gets back.",
  "keyConceptsTested": [
    "LayerNorm Formula",
    "BatchNorm vs LayerNorm",
    "Pre-LN vs Post-LN",
    "Gradient Flow Dynamics",
    "Representation Collapse",
    "RMSNorm",
    "QK-Norm",
    "Peri-LN",
    "DeepNorm",
    "Hybrid Norm Layouts"
  ]
}
---

In a 32-layer decoder, each token carries its own hidden vector through the stack. The collection of those states is the <span data-glossary="residual-stream">residual stream</span>. Take one token's state: `[3.0, 1.0, -1.0, 5.0]`. Attention reads other visible tokens and writes an update; a feed-forward network writes another. Repeated additions can change the stream's scale. We want to control what each branch reads without accidentally blocking useful gradients.

<span data-glossary="layernorm">LayerNorm</span> subtracts the token's mean and divides by the square root of its variance plus a small epsilon, then applies a learned scale and shift. Which vector should it normalize: the residual sum after the addition, or the branch input before the addition? Trace those two choices and you get different activations and gradient paths.

Positional techniques like <span data-glossary="rope">RoPE</span> and <span data-glossary="alibi">ALiBi</span> tell the model where tokens sit relative to one another. Normalization addresses a different question: what scale does each operation read? If each write is a roughly independent perturbation, how fast does that scale grow before any norm is applied?

---

## One residual stream, many writes

Before introducing normalization operators or residual scale multipliers, write down the bare update rule for any transformer block wrapping a self-attention or feed-forward sublayer:

$$
x_{l+1} = x_l + \text{Sublayer}(x_l)
$$

In this plain update, the input $x_l$ bypasses the transformation directly along the skip path while the `Sublayer` adds a perturbation on top. When each successive sublayer contributes roughly independent variance $\sigma_{\text{sub}}^2$, the accumulated hidden variance grows linearly with layer depth $l$:

$$
\operatorname{Var}(x_l) \approx \operatorname{Var}(x_0) + l \cdot \sigma_{\text{sub}}^2
$$

Because real variance obeys $\operatorname{Var}(x+\Delta)=\operatorname{Var}(x)+\operatorname{Var}(\Delta)+2\operatorname{Cov}(x,\Delta)$, correlated or canceling writes can shift exact trajectories away from linearity, yet standard deviation still expands gently like $\sqrt{l}$ rather than $l$ under uncorrelated writes. Where LayerNorm sits inside this addition governs both stream growth and gradient flow. In Post-LN, normalization wraps the full sum after the residual write, whereas Pre-LN moves normalization onto the branch input so the skip connection adds an unobstructed identity term during <span data-glossary="backpropagation">backpropagation</span> (Post-LN inserts a normalization Jacobian outside the addition).[^xiong2020] Those Jacobians stay abstract until we watch what normalization does to actual numbers inside a token vector, so let us trace every arithmetic step by hand first.

---

## LayerNorm by hand

To see every arithmetic operation clearly without framework abstractions hiding intermediate steps, work through a concrete example by hand. Consider a single token whose hidden representation has four dimensions spanning negative and positive values. We will track this exact four-element vector through mean subtraction, variance scaling, and affine rescaling:

```python title="layernorm-by-hand.py"
x = [3.0, 1.0, -1.0, 5.0]
```

First, average all four coordinates of that hidden vector to locate its feature mean. Summing across the hidden axis cancels out offsetting positive and negative entries while retaining any net DC shift across features. For our example vector, the coordinates add to `8.0` and divide evenly by the dimension width `4`:

$$
\mu = \frac{3.0 + 1.0 + (-1.0) + 5.0}{4} = \frac{8.0}{4} = 2.0
$$

Subtracting $\mu = 2.0$ shifts the coordinate origin to zero without changing the distances between features, giving centered vector `[1.0, -1.0, -3.0, 3.0]`. Next, measure the spread around that centered origin by squaring each coordinate offset so positive and negative excursions add constructively. Dividing by $d = 4$ rather than Bessel-corrected $d - 1$ gives the population variance used across neural network normalization layers:

$$
\sigma^2 = \frac{1.0^2 + (-1.0)^2 + (-3.0)^2 + 3.0^2}{4} = \frac{1.0 + 1.0 + 9.0 + 9.0}{4} = \frac{20.0}{4} = 5.0
$$

Standard LayerNorm uses this exact $1/d$ population factor inside every layer rather than estimating an unbiased sample statistic. Ignoring $\epsilon$ for the hand calculation, take the root-mean-square deviation $\sigma = \sqrt{5.0} \approx 2.236$. Dividing each centered coordinate by $\sigma$ rescales the entire vector to unit spread:

$$
\hat{x} = \left[ \frac{1.0}{2.236}, \frac{-1.0}{2.236}, \frac{-3.0}{2.236}, \frac{3.0}{2.236} \right] \approx [0.447, -0.447, -1.342, 1.342]
$$

Before applying any learned affine parameters, $\hat{x}$ has exact zero mean and unit variance in this $\epsilon$-free calculation. Adding a positive $\epsilon$ slightly shrinks the variance when inputs vary and keeps constant vectors cleanly scaled at zero instead of dividing by zero. Finally, learned scale ($\gamma$) and shift ($\beta$) vectors restore flexible feature dynamic range: initialized to $\gamma = [1.0, 1.0, 1.0, 1.0]$ and $\beta = [0.0, 0.0, 0.0, 0.0]$, they start as an identity map and adapt smoothly during optimization. Because every reduction runs strictly across the feature axis of one token, neighboring tokens in the sequence or batch have zero effect on $\mu$ and $\sigma^2$.

```checkpoint
If you feed 16 token hidden states through LayerNorm, which numbers determine the mean and variance for one token?
---
For per-token LayerNorm over the hidden dimension, only that token's feature values determine its statistics. The normalization formula is the same during training and evaluation; the surrounding model can still differ because of dropout, masks, or different token contexts.
```

Packaging those arithmetic steps into a standalone Python helper makes each transformation explicit and reproducible. Beyond matching the manual numbers above, the implementation also exercises the constant-vector edge case where variance drops to zero and epsilon stabilizes division. Notice how the affine parameters $\gamma$ and $\beta$ default to identity scaling and zero shift when omitted:

<!-- leetllm: test -->
```python title="layernorm-by-hand-2.py"
from math import isclose, sqrt

def layer_norm(values, gamma=None, beta=None, eps=1e-5):
    gamma = [1.0] * len(values) if gamma is None else gamma
    beta = [0.0] * len(values) if beta is None else beta
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    scale = sqrt(variance + eps)
    return [
        gamma_i * ((value - mean) / scale) + beta_i
        for value, gamma_i, beta_i in zip(values, gamma, beta)
    ]

normalized = layer_norm([3.0, 1.0, -1.0, 5.0])
rounded = [round(value, 2) for value in normalized]
assert rounded == [0.45, -0.45, -1.34, 1.34]
assert isclose(sum(normalized), 0.0, abs_tol=1e-12)
assert layer_norm([3.0, 1.0], gamma=[0.0, 0.0]) == [0.0, 0.0]
assert layer_norm([7.0, 7.0], beta=[2.0, -1.0]) == [2.0, -1.0]
```

### The general formula

For any token state $x \in \mathbb{R}^d$, LayerNorm computes:[^ba2016]

$$
\text{LayerNorm}(x) = \gamma \odot \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} + \beta
$$

where:
- $\mu = \frac{1}{d} \sum_{i=1}^d x_i$: feature mean of this token
- $\sigma^2 = \frac{1}{d} \sum_{i=1}^d (x_i - \mu)^2$: feature variance of this token
- $\gamma, \beta \in \mathbb{R}^d$: learnable per-channel scale and bias parameters
- $\epsilon$: small positive constant (typically $10^{-5}$ or $10^{-6}$) guarding against division by zero

Before the affine transform, variance equals $\sigma^2/(\sigma^2+\epsilon)$. It is near 1 when $\sigma^2\gg\epsilon$, exactly $1/2$ when $\sigma^2=\epsilon$, and zero for a flat vector. Learned per-channel $\gamma$ and $\beta$ can change both output mean and variance. Epsilon keeps the denominator nonzero, but the gain near a flat input can still approach $1/\sqrt{\epsilon}$.

In <span data-glossary="mixed-precision">mixed precision</span>, distinguish the input dtype from the dtype used for reductions and epsilon addition. FP16's smallest positive subnormal is about $5.96\times10^{-8}$; `1e-12` rounds to zero if represented directly in FP16. BF16 has a wider exponent range. Accumulating statistics in FP32 avoids that particular epsilon underflow, but cannot recover differences already lost when inputs were rounded. Match the checkpoint's epsilon and check the actual kernel; changing it changes the function.

#### Why BatchNorm is awkward in causal sequence models

BatchNorm reduces each channel across the mini-batch and spatial or temporal dimensions, creating several structural friction points for variable-length language transformers compared with per-token LayerNorm:[^pytorchBatchNorm2142026]

1. **Padding and causality:** Padding can contaminate statistics unless explicitly excluded. `BatchNorm1d` on `(batch, channels, time)` reduces across batch and time, so a training-time token can depend on future tokens through those statistics. A causal attention mask does not repair that separate dependency.
2. **Cross-sample coupling:** With batch statistics, changing the other examples changes a token's normalization. Whether that helps or hurts depends on the task and sampling.
3. **Train/eval statistics:** With PyTorch's default running-statistics behavior, evaluation uses stored estimates and can handle batch size one. If `track_running_stats=False`, evaluation also uses current batch statistics. One value per channel is insufficient for PyTorch's training-style BatchNorm; batch size one with several temporal positions is a different case.

Per-token LayerNorm eliminates batch coupling and time mixing cleanly at the normalization layer itself. Note that it does not erase padding tokens elsewhere in the forward pass, so causal attention masks and loss weights still remain mandatory whenever sequences are batched together. The comparison table below summarizes the practical contrasts before showing the effect directly in Python:

| Property | BatchNorm | LayerNorm |
|---|---|---|
| **Reduction axis** | Mini-batch and spatial positions | Feature coordinates within one token |
| **Batch size dependency** | Current statistics depend on all reduced samples; stored-statistics eval is different | Statistics independent of peer tokens |
| **Inference statistics** | Stored estimates by default; current batch statistics if configured | Computed from each token |
| **Variable sequence lengths** | Padding/time reduction requires care | Hidden-dimension statistics do not mix tokens |
| **Autoregressive decoding** | Mismatched train vs eval statistics | Identical computation in both modes |
| **Modern LLM adoption** | Rare | Foundation of transformer normalization |

```checkpoint
Why is BatchNorm awkward for autoregressive decoding while LayerNorm is natural?
---
BatchNorm's reduction and running-statistics behavior need to fit causal training and single-token evaluation. Stored-statistics evaluation can handle batch size one; it is the different statistics source and possible time reduction that need care. Per-token LayerNorm uses just the current token's features in either mode.
```

The executable script below compares how LayerNorm and BatchNorm respond when neighboring elements in the batch change. It evaluates both normalizers on the same `[1.0, 3.0, 5.0, 7.0]` token vector while perturbing the peer tokens around it. Watch how BatchNorm shifts the output for that identical token while LayerNorm leaves every coordinate untouched:

<!-- leetllm: test, output=show -->
```python title="layernorm-is-per-token.py"
from math import sqrt

def layer_norm(values, eps=1e-5):
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    return [(value - mean) / sqrt(variance + eps) for value in values]

def batch_norm_one_feature(values, eps=1e-5):
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    return [(value - mean) / sqrt(variance + eps) for value in values]

token = [1.0, 3.0, 5.0, 7.0]
ln_before = [layer_norm(row) for row in [token, [2.0, 4.0, 6.0, 8.0]]][0]
ln_after = [layer_norm(row) for row in [token, [100.0, 100.0, 100.0, 100.0]]][0]
batch_a = batch_norm_one_feature([token[0], 2.0, 3.0])
batch_b = batch_norm_one_feature([token[0], 2.0, 100.0])

print("LayerNorm token:", [round(value, 3) for value in ln_before])
print("Batch feature with peers=2,3:", round(batch_a[0], 3))
print("Batch feature with peers=2,100:", round(batch_b[0], 3))
assert ln_before == ln_after
assert round(batch_a[0], 3) != round(batch_b[0], 3)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
LayerNorm token: [-1.342, -0.447, 0.447, 1.342]
Batch feature with peers=2,3: -1.225
Batch feature with peers=2,100: -0.718
```
<!-- leetllm: output:end -->

The LayerNorm output for `token` stays identical whether its batch neighbor sits near 2 or jumps to 100. By contrast, the batch-normalized feature swings from `-1.225` to `-0.718` solely from its peer token changing. Because each token owns only its hidden axis under LayerNorm, autoregressive inference matches training behavior cleanly step for step.

### PyTorch implementation

In PyTorch, passing an integer width `nn.LayerNorm(d_model)` to a `(batch, seq_len, d_model)` tensor restricts normalization exclusively to the trailing hidden dimension.[^pytorch_layernorm] By contrast, `normalized_shape` averages across every trailing dimension you name, so passing `(seq_len, d_model)` mixes statistics across sequence positions and leaks later-token shifts backward into earlier tokens. The check below perturbs only the final token in a two-token sequence and verifies which axis leaves position zero unchanged:

<!-- leetllm: test, deps=torch, output=show -->
```python title="normalization-axes-and-causality.py"
import torch

x = torch.tensor([[[1., 2., 4.], [2., 5., 8.]]], dtype=torch.float64)
changed = x.clone()
changed[:, 1] += 100
per_token = torch.nn.LayerNorm(3, elementwise_affine=False).double()
over_time = torch.nn.LayerNorm((2, 3), elementwise_affine=False).double()
same_token = torch.allclose(per_token(x)[:, 0], per_token(changed)[:, 0])
same_time = torch.allclose(over_time(x)[:, 0], over_time(changed)[:, 0])
assert same_token and not same_time
print("First token unchanged with hidden-only reduction:", same_token)
print("First token unchanged with time-and-hidden reduction:", same_time)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
First token unchanged with hidden-only reduction: True
First token unchanged with time-and-hidden reduction: False
```
<!-- leetllm: output:end -->

This single-hidden-dimension implementation upcasts half-precision statistics, keeps the output dtype, and broadcasts the affine parameters:

<!-- leetllm: test, deps=torch, output=show -->
```python title="pytorch-implementation.py"
import torch
import torch.nn as nn

class LayerNorm(nn.Module):
    """Layer Normalization from scratch."""
    def __init__(self, d_model: int, eps: float = 1e-5):
        super().__init__()
        self.gamma = nn.Parameter(torch.ones(d_model))
        self.beta = nn.Parameter(torch.zeros(d_model))
        self.eps = eps

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        work = x.float() if x.dtype in (torch.float16, torch.bfloat16) else x
        mean = work.mean(dim=-1, keepdim=True)
        var = work.var(dim=-1, keepdim=True, unbiased=False)
        x_norm = (work - mean) / torch.sqrt(var + self.eps)
        return (self.gamma * x_norm + self.beta).to(x.dtype)

# Quick check with the hand-worked example
x = torch.tensor([[[3.0, 1.0, -1.0, 5.0]]])  # shape (1, 1, 4)
ln = LayerNorm(d_model=4)
# Fix gamma=1, beta=0 to match the hand calculation
nn.init.constant_(ln.gamma, 1.0)
nn.init.constant_(ln.beta, 0.0)
out = ln(x)
print(out.round(decimals=2).detach())
expected = torch.tensor([[[0.45, -0.45, -1.34, 1.34]]])
assert torch.allclose(out.round(decimals=2), expected)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tensor([[[ 0.4500, -0.4500, -1.3400,  1.3400]]])
```
<!-- leetllm: output:end -->

### The gradients of scale and shift

Tracing how LayerNorm transforms the forward vector also clarifies how gradients travel backward through its mean and variance reductions. Writing $y = \text{LayerNorm}(x) = \gamma \odot \hat{x} + \beta$ with standardized coordinates $\hat{x} = (x - \mu) / s$ and $s = \sqrt{\sigma^2 + \epsilon}$, let $g = \partial \mathcal{L} / \partial y$ denote the upstream loss gradient. Because the learned vectors $\gamma$ and $\beta$ are shared across every sequence slot in the batch, their parameter gradients sum over both the batch axis $b$ and token position $t$:

$$
\frac{\partial \mathcal{L}}{\partial \beta_j} = \sum_{b, t} g_{btj}, \qquad \frac{\partial \mathcal{L}}{\partial \gamma_j} = \sum_{b, t} g_{btj} \hat{x}_{btj}
$$

To find the input gradient $\partial \mathcal{L} / \partial x$ for an individual token, begin by folding the learned gain into the upstream gradient via $u = g \odot \gamma$. Each coordinate $x_j$ influences the normalized vector both directly in its own numerator and indirectly through its contribution to the token's mean $\mu$ and standard deviation $s$. Applying the chain rule through both reductions yields a compact geometric projection formula:

$$
\frac{\partial \mathcal{L}}{\partial x} = \frac{1}{s} \left( u - \operatorname{mean}(u) - \hat{x} \odot \operatorname{mean}(u \odot \hat{x}) \right)
$$

Every average inside this formula operates across that single token's feature coordinates, with each of the three terms performing a clear role:
1. $u$: passes the direct scaled upstream gradient through the gain vector.
2. $-\operatorname{mean}(u)$: subtracts the uniform component so backward updates remain invariant to constant input shifts.
3. $-\hat{x} \odot \operatorname{mean}(u \odot \hat{x})$: damps radial changes along the vector direction (for $\epsilon > 0$, small scale sensitivity remains rather than exact orthogonal projection).

PyTorch autograd computes the exact same backward projection automatically from the forward normalization graph. Running both the analytic formula and autograd on random `float64` tensors removes floating-point tolerance ambiguity and tests every reduction axis at once. Confirm below that all three backward gradients match to full double precision:

<!-- leetllm: test, deps=torch, output=show -->
```python title="layernorm-gradient-check.py"
import torch

torch.manual_seed(7)
x = torch.randn(2, 3, 4, dtype=torch.float64, requires_grad=True)
norm = torch.nn.LayerNorm(4, eps=1e-5).double()
with torch.no_grad():
    norm.weight.copy_(torch.tensor([0.5, 1.0, -2.0, 3.0]))
    norm.bias.copy_(torch.tensor([1.0, -1.0, 0.2, 0.0]))
g = torch.randn_like(x)
s = (x.var(-1, keepdim=True, unbiased=False) + norm.eps).sqrt()
xhat = (x - x.mean(-1, keepdim=True)) / s
manual = norm.weight * xhat + norm.bias
torch.testing.assert_close(norm(x), manual)
dx, dgamma, dbeta = torch.autograd.grad(norm(x), (x, norm.weight, norm.bias), g)
u = g * norm.weight
expected_dx = (u - u.mean(-1, keepdim=True)
               - xhat * (u * xhat).mean(-1, keepdim=True)) / s
torch.testing.assert_close(dx, expected_dx)
torch.testing.assert_close(dgamma, (g * xhat).sum((0, 1)))
torch.testing.assert_close(dbeta, g.sum((0, 1)))
print("Forward, input gradient, scale gradient, shift gradient: match")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Forward, input gradient, scale gradient, shift gradient: match
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/layer_norm_dark.png" alt="Three side-by-side bar charts track features f1 through f4 on a shared scale from negative three to six. Input x = [3, 1, -1, 5] has mean 2 and variance 5. Subtracting mean 2 gives centered [1, -1, -3, 3] with mean 0 and variance 5. Dividing by sqrt(5) compresses outputs to [0.45, -0.45, -1.34, 1.34] with mean 0 and variance 1." />
  <figcaption>Follow features $f_1$ through $f_4$ across three side-by-side bar charts on a shared $[-3, 6]$ value axis. Subtracting the mean $2$ shifts every feature while preserving variance $5$, and dividing by $\sqrt{5}$ shrinks the spread to unit variance ($\epsilon=0$, $\gamma=1$, $\beta=0$).</figcaption>
</figure>

---

## Where you put LayerNorm matters

Knowing how LayerNorm transforms a single vector sets up the main architectural choice inside a transformer block: where normalization sits along the residual stream. Every block wraps two sublayers, multi-head self-attention and a feed-forward network, each taking an activation $x_l$ and adding an update $F(x_l)$. Placing normalization **after** the residual addition versus **before** entering the sublayer fundamentally changes how gradients flow across depth:

- **Post-LN**: Normalizes *after* adding the residual update.
- **Pre-LN**: Normalizes *before* feeding the vector into the sublayer.

### Post-LN: the original transformer

Vaswani et al. (2017) originally introduced LayerNorm directly outside each residual addition, and early bidirectional encoders such as BERT followed that exact convention. In this configuration, the residual shortcut closes before normalization, forcing the combined main-stream activation through mean subtraction and variance division at every sublayer boundary. Formally, a single Post-LN sublayer block computes:[^vaswani2017][^devlin2019]

$$
x_{l+1} = \text{LayerNorm}(x_l + F(x_l))
$$

Here, every block computes the sublayer update $F(x_l)$, adds it back onto $x_l$, and then normalizes the combined sum. Placing normalization directly on the main residual highway keeps activation scales uniform at every layer boundary. During backpropagation, however, every error signal traveling down the skip connection must multiply through a LayerNorm Jacobian at each block.

### Pre-LN: an identity contribution around the branch

GPT-2 reversed the operation order by moving normalization onto the sublayer input branch while leaving the residual highway untouched. Each token representation enters the block unnormalized, copies directly along the additive skip path, and sends a normalized view into attention or the MLP. Writing out one Pre-LN sublayer block makes the identity path explicit:[^radford2019]

$$
x_{l+1} = x_l + F(\text{LayerNorm}(x_l))
$$

Because $x_l$ enters $x_{l+1}$ without passing through LayerNorm, the skip path maintains an unobstructed additive term all the way from input embeddings to the final layer. One structural consequence of skipping normalization along the residual stream is that block outputs grow cumulatively across layers rather than remaining unit-variance. GPT-2-style Pre-LN therefore appends one final normalization layer right before the language modeling head:[^radford2019][^xiong2020]

$$
y = \text{Head}(\text{FinalNorm}(x_L))
$$

<figure>
  <img src="illustrations/_generated/pre_vs_post_ln_dark.png" alt="Two stacked computational graphs trace a blue identity skip. In Pre-LN it bypasses LayerNorm and the sublayer before reaching the addition. In Post-LN the skip reaches the addition and the whole sum then passes through LayerNorm. The corresponding Jacobians preserve this operation order." />
  <figcaption>Trace the blue skip from input $x$ to output $y$, where $F$ is the attention or feed-forward sublayer. Pre-LN bypasses normalization and has $J=I+J_FJ_{\text{LN}}$. Post-LN normalizes the residual sum and has $J=J_{\text{LN}}(I+J_F)$. Here $J$ is the input-to-output Jacobian. Backpropagation uses $J^T$, and the additive identity term does not bound the norm of the total gradient.</figcaption>
</figure>

```checkpoint
In one equation, what is the architectural difference between Post-LN and Pre-LN?
---
Post-LN is $x_{l+1} = \text{LayerNorm}(x_l + F(x_l))$. Pre-LN is $x_{l+1} = x_l + F(\text{LayerNorm}(x_l))$. The critical difference is whether normalization sits on the residual highway after the addition, or only on the sublayer branch before the addition.
```

---

## A two-layer walkthrough

Tracing a concrete two-layer calculation shows immediately how activation amplitudes evolve under each placement. Fix $F(x) = 0.2 \cdot x + 0.1$ and step forward twice from $x_0 = [1.0, 2.0, 4.0, 8.0]$ with $\gamma = 1$ and $\beta = 0$. Under unit affine parameters, Post-LN re-centers every layer output to zero mean and near-unit standard deviation, whereas Pre-LN accumulates these positive updates across steps (an arbitrary learned branch $F$ can cancel or redirect updates differently in full training).

<!-- leetllm: test, output=show -->
```python title="pre-ln-stack.py"
from math import sqrt

def layer_norm(values, eps=1e-5):
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    scale = sqrt(variance + eps)
    return [(value - mean) / scale for value in values]

def sublayer(values):
    # Deterministic residual sublayer update.
    return [0.2 * value + 0.1 for value in values]

def pre_ln_step(values):
    return [value + update for value, update in zip(values, sublayer(layer_norm(values)))]

def post_ln_step(values):
    raw = [value + update for value, update in zip(values, sublayer(values))]
    return layer_norm(raw)

start = [1.0, 2.0, 4.0, 8.0]
pre_after_two = pre_ln_step(pre_ln_step(start))
post_after_two = post_ln_step(post_ln_step(start))

assert sum(abs(value) for value in pre_after_two) > sum(abs(value) for value in start)
assert abs(sum(post_after_two) / len(post_after_two)) < 1e-12
assert abs(sum(pre_after_two) / len(pre_after_two) - 3.95) < 1e-12
print("Pre-LN after two steps:", [round(v, 3) for v in pre_after_two])
print("Post-LN after two steps:", [round(v, 3) for v in post_after_two])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Pre-LN after two steps: [0.79, 1.939, 4.237, 8.834]
Post-LN after two steps: [-1.026, -0.653, 0.093, 1.585]
```
<!-- leetllm: output:end -->

---

## Why Pre-LN can train more stably

The forward pass tracks which hidden tensor enters normalization, whereas training stability hinges on how gradients climb back from the loss to the earliest layers. Comparing block Jacobians directly reveals why Post-LN and Pre-LN behave differently across deep stacks.

### The Post-LN gradient problem

Differentiating one Post-LN block gives the product of the output normalization Jacobian (evaluated at $x_l + F(x_l)$) and the residual branch sum:

$$
\frac{\partial x_{l+1}}{\partial x_l} = J_{\text{LN}, l} \cdot (I + J_{F, l})
$$

Writing $A_k = J_{\text{LN}, k}(I + J_{F, k})$, the multi-layer Jacobian across blocks $l$ through $L - 1$ forms an ordered matrix chain where non-commutativity preserves sequential layer ordering:

$$
\frac{\partial x_L}{\partial x_l}=A_{L-1}A_{L-2}\cdots A_l,\qquad g_l=A_l^TA_{l+1}^T\cdots A_{L-1}^Tg_L
$$

For an individual token, the exact normalization Jacobian acts as an inverse-scale projection matrix:

$$
J_{\text{LN}}=\frac{\operatorname{diag}(\gamma)}{s}\left(I-\frac{\mathbf{1}\mathbf{1}^T}{d}-\frac{\hat{x}\hat{x}^T}{d}\right).
$$

This projection annihilates changes along the constant all-ones direction and rescales orthogonal directions inversely with standard deviation $s$ and gain $\gamma$. Because long non-commutative products of $A_k$ can shrink or explode depending on weights and scales, normalization placement by itself yields no universal depth exponent law. Under a simplified uniform-attention Gaussian initialization with width $d$ and depth $L$, Xiong et al. derive high-probability gradient bounds on the final FFN output weight matrix $\|\partial\tilde{\mathcal L}/\partial W_{2,L}\|_F$:[^xiong2020]

$$
\text{Post-LN}: O(d\sqrt{\ln d}),\qquad \text{Pre-LN}: O\!\left(d\sqrt{\frac{\ln d}{L}}\right).
$$

While those bounds cover only the last FFN weight matrix under simplified initialization rather than every trained checkpoint layer, Xiong et al.'s empirical sweeps confirm steep gradient concentration near Post-LN outputs and show why learning-rate warmup is critical for Post-LN stability. Checking initial gradient norms across depth therefore guides warmup tuning alongside initialization and precision choices.

### The Pre-LN gradient advantage

Applying the chain rule to a Pre-LN block places the identity skip outside the sublayer and LayerNorm Jacobians:

$$
\frac{\partial x_{l+1}}{\partial x_l} = I + J_{F, l} \cdot J_{\text{LN}, l}
$$

Expanding that recursion from output $L$ back to block $l$ yields an additive residual decomposition rather than a single multiplicative chain of $J_{\text{LN}}$ factors:

$$
\frac{\partial x_L}{\partial x_l} = I + \sum_{k=l}^{L-1} J_{F, k} J_{\text{LN}, k} \frac{\partial x_k}{\partial x_l}
$$

That explicit identity matrix $I$ creates a direct skip gradient route around the branch. Even with an identity skip, gradients can still blow up when $B$ is large or cancel along directions where $B h = -h$, and final output normalization plus prediction-head weights shape total loss gradients too. In Xiong et al.'s tested machine translation and BERT settings, Pre-LN removed the need for learning-rate warmup, yet subsequent Peri-LN studies report gradient spikes and evolving variance growth under Pre-LN and retain warmup themselves.[^xiong2020][^kim2025] Consequently, placement, initialization gain, precision, and warmup schedule act as one coupled recipe. Checking autograd against the analytical block Jacobians above confirms the exact gradient structure in code:

<!-- leetllm: test, deps=torch, output=show -->
```python title="block-jacobians.py"
import torch
from torch.autograd.functional import jacobian

torch.manual_seed(11)
x = torch.tensor([3.0, 1.0, -1.0, 5.0], dtype=torch.float64, requires_grad=True)
W = torch.randn(4, 4, dtype=x.dtype) * 0.2
identity = torch.eye(4, dtype=x.dtype)
def ln(v):
    return torch.nn.functional.layer_norm(v, (4,), eps=1e-5)
def pre(v):
    return v + W @ ln(v)
def post(v):
    return ln(v + W @ v)

J_pre = jacobian(pre, x)
J_post = jacobian(post, x)
torch.testing.assert_close(J_pre, identity + W @ jacobian(ln, x))
torch.testing.assert_close(J_post, jacobian(ln, x + W @ x) @ (identity + W))
g = torch.tensor([1.0, -2.0, 0.5, 3.0], dtype=x.dtype)
for block, J in [(pre, J_pre), (post, J_post)]:
    actual = torch.autograd.grad(block(x), x, grad_outputs=g)[0]
    torch.testing.assert_close(actual, J.T @ g)
print("Both block Jacobians and transposed gradient products: match")

# A fixed branch can cancel the identity on a particular direction.
point = torch.tensor([1., -1., 2., -2.], dtype=x.dtype)
direction = torch.tensor([2., -2., -1., 1.], dtype=x.dtype)
fixed_scale = (point.var(unbiased=False) + 1e-5).sqrt()
J_cancel = jacobian(lambda v: v - fixed_scale * ln(v), point)
cancelled = torch.allclose(J_cancel @ direction, torch.zeros_like(direction), atol=1e-12)
assert cancelled
print("Pre-LN identity term can cancel in one direction:", cancelled)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Both block Jacobians and transposed gradient products: match
Pre-LN identity term can cancel in one direction: True
```
<!-- leetllm: output:end -->

---

## A reported Pre-LN risk: representation collapse

While Pre-LN keeps gradient paths open early in training, leaving the residual highway unnormalized lets accumulated stream magnitudes grow relative to each new sublayer write. Tracking activation variance over depth shows why this happens and when to check for it under real weights. Since the skip stream collects every block write without passing through a normalizer:

$$
x_L = x_0 + \sum_{l=0}^{L-1} F_l(\text{LayerNorm}(x_l))
$$

When sublayer outputs maintain bounded, comparable variance across depth and stay roughly uncorrelated with the prior stream, total stream variance grows linearly with layer count $l$:

$$
\operatorname{Var}(x_l) \approx O(l) \implies \|x_l\| \approx O(\sqrt{l})
$$

Meanwhile, each newly appended update remains around $\|\Delta x_l\| \approx O(1)$, so its relative magnitude compared with the residual stream shrinks like $O(1/\sqrt{l})$:

$$
\frac{\|\Delta x_l\|}{\|x_l\|} \approx O\left(\frac{1}{\sqrt{l}}\right)
$$

Even so, a normalized branch input does not freeze $F$'s weight norms, and correlated branch updates can bend variance growth away from $O(l)$. ResiDual documents rising cosine similarity between normalized states and shrinking late-layer contributions across deep Pre-LN translation stacks.[^xie2023] Because a small raw norm ratio alone reveals little about layer function, evaluate normalized feature changes, update alignment, and layer ablation effects directly.

| Property | Post-LN | Pre-LN |
|---|---|---|
| **Skip gradient path** | Passes through chained $J_{\text{LN}}$ matrices | Direct identity highway ($I$) |
| **Initialization evidence** | Large output-near gradients in Xiong's analyzed setup | Smaller last-FFN bound in that setup |
| **Warmup** | Helps tested recipes; tune and measure | Removable in some recipes; still used in others |
| **Deep layer contribution** | Depends on training and branch behavior | Relative writes can dilute under stated assumptions |
| **Final norm** | Last block already applies an output norm | Part of GPT-2-style recipe; preserve checkpoint design |
| **Primary adopters** | Original Transformer, BERT | GPT-2, Llama, Mistral, Qwen |

```checkpoint
What is the representation-collapse risk reported for Pre-LN?
---
If writes have comparable bounded variance and little correlation, stream scale can grow while relative write size shrinks. ResiDual reports increasingly similar normalized hidden states. Those assumptions need checking in trained models; normalized branch inputs alone do not bound branch outputs, and small norm ratios need task-level ablations before declaring a layer redundant.
```

### Residual magnitude growth across depth

This simulation deliberately adds the same aligned write eight times. Its Pre-LN norm grows **linearly**, so it illustrates write dilution, not the preceding uncorrelated-write $\sqrt{l}$ estimate. The residual-scaled column applies an $\alpha > 1$ skip multiplier to show how residual up-weighting bounds single-layer write share. The displayed write share is $\|\Delta x\|/(\|x_l\|+\|\Delta x\|)$, distinct from $\|\Delta x\|/\|x_l\|$:

<!-- leetllm: test, output=show -->
```python title="residual-stream-magnitude-vs-depth.py"
from math import sqrt

def l2(values: list[float]) -> float:
    return sqrt(sum(v * v for v in values))

def layer_norm(values: list[float], eps: float = 1e-5) -> list[float]:
    mean = sum(values) / len(values)
    var = sum((v - mean) ** 2 for v in values) / len(values)
    scale = sqrt(var + eps)
    return [(v - mean) / scale for v in values]

depth = 8
update = [1.0, 0.0, 0.0, 0.0]
alpha = (2 * depth) ** 0.25  # encoder-only residual scale from DeepNet
x_pre = [1.0, 0.0, 0.0, 0.0]
x_post = [1.0, 0.0, 0.0, 0.0]
x_deep = [1.0, 0.0, 0.0, 0.0]

print(f"alpha={alpha:.3f}")
print("layer | Pre ||x|| | Pre write share | Post ||x|| | Deep ||αx|| | Deep ||x||")
for layer in range(1, depth + 1):
    pre_share = l2(update) / (l2(x_pre) + l2(update))
    x_pre = [a + b for a, b in zip(x_pre, update)]
    x_post = layer_norm([a + b for a, b in zip(x_post, update)])
    scaled = [alpha * a for a in x_deep]
    x_deep = layer_norm([a + b for a, b in zip(scaled, update)])
    print(
        f"{layer:5d} | {l2(x_pre):8.3f} | {pre_share:15.3f} | "
        f"{l2(x_post):10.3f} | {l2(scaled):9.3f} | {l2(x_deep):9.3f}"
    )

assert l2(x_pre) > l2(x_post)
assert abs(l2(x_post) - l2(x_deep)) < 1e-5
assert alpha == 2.0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
alpha=2.000
layer | Pre ||x|| | Pre write share | Post ||x|| | Deep ||αx|| | Deep ||x||
    1 |    2.000 |           0.500 |      2.000 |     2.000 |     2.000
    2 |    3.000 |           0.333 |      2.000 |     4.000 |     2.000
    3 |    4.000 |           0.250 |      2.000 |     4.000 |     2.000
    4 |    5.000 |           0.200 |      2.000 |     4.000 |     2.000
    5 |    6.000 |           0.167 |      2.000 |     4.000 |     2.000
    6 |    7.000 |           0.143 |      2.000 |     4.000 |     2.000
    7 |    8.000 |           0.125 |      2.000 |     4.000 |     2.000
    8 |    9.000 |           0.111 |      2.000 |     4.000 |     2.000
```
<!-- leetllm: output:end -->

In this aligned-write toy trace, Pre-LN vector norm expands steadily from `2.0` to `9.0` while each identical write's share shrinks from `0.50` to `0.11`. By contrast, Post-LN and DeepNorm re-normalize every residual output back near $\sqrt{d} = 2.0$ when affine gains equal one and $\epsilon$ is tiny. Learned scales $\gamma$ shift that target amplitude during real training.

### DeepNorm: scaled residual and matched init

Wang et al. (2022) introduced **DeepNorm** in DeepNet to scale Post-LN-style stacks up to extreme depth without triggering optimization instability.[^wang2022] Rather than dropping normalization from the skip path, DeepNorm amplifies the residual carry with a depth-dependent constant $\alpha > 1$ while damping initial sublayer weights with a matched gain $\beta < 1$:

$$
x_{l+1} = \text{LayerNorm}(\alpha \cdot x_l + G_l(x_l))
$$

Specifically, Xavier initialization scales FFN matrices and attention value/output projections by $\beta$ (shrinking initial weight variance by $\beta^2$) while leaving query and key weights at unit gain. During the forward pass, activations flow straight through those initialized weights without multiplying $G_l(x_l)$ by $\beta$ a second time. For an encoder-only transformer containing $N$ layers (each with two residual sublayers), DeepNorm sets:

$$
\alpha = (2N)^{1/4}, \qquad \beta = (8N)^{-1/4}
$$

Decoder-only models match the exact same formulas using decoder layer count $M$, whereas encoder-decoder stacks adjust constants to account for the decoder's extra cross-attention sublayer:

| Stack | Residual scale $\alpha$ | Initialization gain $\beta$ |
|---|---|---|
| Encoder-only, $N$ layers | $(2N)^{1/4}$ | $(8N)^{-1/4}$ |
| Decoder-only, $M$ layers | $(2M)^{1/4}$ | $(8M)^{-1/4}$ |
| Encoder in encoder-decoder | $0.81(N^4M)^{1/16}$ | $0.87(N^4M)^{-1/16}$ |
| Decoder in encoder-decoder | $(3M)^{1/4}$ | $(12M)^{-1/4}$ |

The analyzed model update is a change in the **same model's output after a parameter update**, $\|F(x;\theta+\Delta\theta)-F(x;\theta)\|$. It is not the difference between the final and initial hidden states. Under its assumptions, DeepNet targets an output change on the order of the SGD step size, independent of increasing depth. The paper reports scaling to 1,000 layers while still using learning-rate warmup in its translation runs (such as 4,000 updates on WMT-17), so DeepNorm scaling alone does not make warmup unnecessary.[^wang2022]

```checkpoint
What two mechanisms does DeepNorm add on top of a Post-LN-shaped block?
---
A depth-dependent residual scale $\alpha$ on the skip path in $x_{l+1} = \text{LayerNorm}(\alpha x_l + G_l(x_l))$, and a matched down-scaling factor $\beta$ applied to sublayer weight initialization.
```

---

## RMSNorm: scale-only normalization

Where normalization sits along the residual graph is one architectural axis; what statistic sits inside that normalization box is another. Zhang and Sennrich (2019) tested whether mean-centering was actually required across transformer blocks and proposed **RMSNorm**, which divides exclusively by the uncentered root mean square and pairs it with a learned scale gain $\gamma$ without subtracting a mean or adding a learned bias.[^zhang2019] Their experiments matched LayerNorm task quality on the evaluated benchmarks while saving the mean reduction pass, making RMSNorm an option worth benchmarking directly against LayerNorm on a target workload:

$$
\text{RMSNorm}(x) = \gamma \odot \frac{x}{\operatorname{RMS}(x)} = \gamma \odot \frac{x}{\sqrt{\frac{1}{d} \sum_{i=1}^d x_i^2 + \epsilon}}
$$

### Less arithmetic does not specify a GPU speedup

Llama, Qwen 2.5, and Gemma 2 all adopt RMSNorm while differing in where normalizers sit inside the block.[^qwen252024][^gemma2team2024] Dropping mean computation and subtraction trims scalar FLOPs cleanly on paper, yet scalar operation counts do not translate one-for-one into HBM memory traffic or GPU kernel launch overhead. Standard fused LayerNorm implementations compute mean and variance together via Welford's algorithm and apply normalization plus affine transform inside a single kernel (as shown in Triton's fused LayerNorm tutorial), so RMSNorm rarely halves kernel runtime or register pressure on modern GPUs.[^pytorchLayerNormKernel2026][^tritonLayerNorm2026] Zhang and Sennrich measured 7%–64% speedups depending heavily on width, dtype, and framework in their original benchmarks; in full training steps where normalization accounts for 2% of wall time, halving normalization runtime saves only 1% end to end.[^zhang2019]

| Step | LayerNorm | RMSNorm |
|---|---|---|
| **Mean calculation** | Yes ($\mu = \frac{1}{d}\sum x_i$) | No |
| **Mean subtraction** | Yes ($x - \mu$) | No |
| **Required statistics** | Mean and centered variance; computation can be fused | Uncentered mean square |
| **Scale statistic** | Standard deviation $\sqrt{\sigma^2 + \epsilon}$ | Root mean square $\sqrt{\frac{1}{d}\sum x_i^2 + \epsilon}$ |
| **Learned scale $\gamma$** | Usual default; affine can be disabled | Usual default; affine can be disabled |
| **Learned shift $\beta$** | Usual default; bias can be disabled | Omitted in the common formulation |
| **Runtime cost** | Depends on the implementation and workload | Less formula work; benchmark actual kernels |

<figure>
  <img src="illustrations/_generated/norm_variants_dark.png" alt="Two side-by-side line plots compare LayerNorm and RMSNorm on input x = [3, 1, -1, 5] and shifted input x + 10 = [13, 11, 9, 15]. LayerNorm outputs remain identical at [0.45, -0.45, -1.34, 1.34] after adding 10 because mean subtraction cancels uniform shifts. RMSNorm lacks centering, so outputs shift from [1.00, 0.33, -0.33, 1.67] to [1.07, 0.90, 0.74, 1.23]." />
  <figcaption>Comparing LayerNorm (purple) and RMSNorm (green) across features $f_1$ through $f_4$ on a shared scale ($\epsilon=0$, $\gamma=1$, $\beta=0$). Adding $10$ to every feature leaves LayerNorm untouched because centering cancels uniform shifts, whereas uncentered RMSNorm divides by $\sqrt{149}$ and pulls every output positive.</figcaption>
</figure>

```checkpoint
What does RMSNorm remove from LayerNorm, and what does it keep?
---
The common formulation removes mean-centering and the learned shift. It divides by an epsilon-adjusted uncentered RMS and retains a learned gain. That controls a magnitude statistic while leaving the output mean unconstrained.
```

Both a scalar Python version and a PyTorch `nn.Module` highlight how much simpler RMSNorm looks without mean tracking or a bias parameter, normalizing each token solely by its root-mean-square amplitude:[^pytorch_rmsnorm]

<!-- leetllm: test -->
```python title="rmsnorm-a-common-modern-shortcut.py"
from math import sqrt

def rms_norm(values, weight=None, eps=1e-6):
    weight = [1.0] * len(values) if weight is None else weight
    rms = sqrt(sum(value * value for value in values) / len(values) + eps)
    return [value * scale / rms for value, scale in zip(values, weight)]

values = [3.0, 1.0, -1.0, 5.0]
normalized = rms_norm(values)

assert round(sqrt(sum(value * value for value in normalized) / len(normalized)), 6) == 1.0
assert round(sum(normalized) / len(normalized), 6) != 0.0
assert rms_norm([3.0, 1.0], weight=[0.0, 0.0]) == [0.0, 0.0]
assert rms_norm([0.0, 0.0]) == [0.0, 0.0]
```

And the matching PyTorch module wraps half-precision reductions in FP32 before dividing by the RMS scale and casting back to the input dtype:[^pytorch_rmsnorm]

<!-- leetllm: test, deps=torch, output=show -->
```python title="rmsnorm-a-common-modern-shortcut-2.py"
import torch
import torch.nn as nn

class RMSNorm(nn.Module):
    """Root Mean Square Layer Normalization."""
    def __init__(self, d_model: int, eps: float = 1e-6):
        super().__init__()
        self.weight = nn.Parameter(torch.ones(d_model))
        self.eps = eps

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        work = x.float() if x.dtype in (torch.float16, torch.bfloat16) else x
        rms = torch.sqrt(work.pow(2).mean(dim=-1, keepdim=True) + self.eps)
        return (self.weight * (work / rms)).to(x.dtype)

# Quick sanity check
x = torch.tensor([[[3.0, 1.0, -1.0, 5.0]]])
rms = RMSNorm(d_model=4)
out = rms(x)
print(out.round(decimals=4).detach())
feature_rms = torch.sqrt(out.pow(2).mean(dim=-1))
assert torch.allclose(feature_rms, torch.ones_like(feature_rms), atol=1e-5)
assert not torch.allclose(out.mean(dim=-1), torch.zeros_like(out.mean(dim=-1)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tensor([[[ 1.0000,  0.3333, -0.3333,  1.6667]]])
```
<!-- leetllm: output:end -->

To compare directly against PyTorch, pass an explicit `eps=1e-6` to `nn.RMSNorm(4, eps=1e-6)` because PyTorch defaults `eps=None` to the computation dtype's machine epsilon (FP32 for half, BF16, or FP32 inputs, and FP64 for FP64). Positive epsilon prevents division by zero and turns scale invariance into an approximation on tiny inputs, leaving zeros at zero while slightly attenuating small nonzero signals. Upcasting before squaring also prevents silent FP16 overflow because FP16 stores `300.0` cleanly, yet its square `90,000` exceeds `torch.finfo(torch.float16).max` (`65504.0`) and overflows before the square root ever runs. Below, compare raw FP16 accumulation directly against FP32 upcasting.[^pytorch_rmsnorm][^pytorchTypeInfo2026]

<!-- leetllm: test, deps=torch, output=show -->
```python title="normalization-fp16-overflow-and-input-rounding.py"
import torch
import torch.nn.functional as F

large = torch.tensor([300., -300.], dtype=torch.float16)
half_rms = (large.square().mean() + 1e-6).sqrt()
wide_rms = (large.float().square().mean() + 1e-6).sqrt()
assert torch.isinf(half_rms) and wide_rms.item() == 300.
print("RMS, FP16 accumulation:", half_rms.item())
print("RMS, FP32 accumulation:", wide_rms.item())

# A separate failure occurs before the normalization kernel runs.
original = torch.tensor([10000., 10001., 9999., 10002.])
rounded = original.half().float()
before = F.layer_norm(original, (4,), eps=1e-5)
after = F.layer_norm(rounded, (4,), eps=1e-5)
assert torch.equal(rounded, torch.full_like(rounded, 10000.))
assert torch.equal(after, torch.zeros_like(after))
assert before.abs().max() > 1.
print("FP16 input, cast back to FP32:", rounded.tolist())
print("LayerNorm of original:", [round(v, 4) for v in before.tolist()])
print("LayerNorm after input rounding:", after.tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
RMS, FP16 accumulation: inf
RMS, FP32 accumulation: 300.0
FP16 input, cast back to FP32: [10000.0, 10000.0, 10000.0, 10000.0]
LayerNorm of original: [-0.4472, 0.4472, -1.3416, 1.3416]
LayerNorm after input rounding: [0.0, 0.0, 0.0, 0.0]
```
<!-- leetllm: output:end -->

> **Common mistake:** Upcasting to FP32 *after* squaring FP16 activations. A finite FP16 value like `300.0` overflows `65,504` the moment you compute `x * x` in FP16, turning RMS into `inf`; always cast to FP32 before squaring.

In the second case, FP16 rounds all four values (`10000, 10001, 9999, 10002`) to `10000.0` before LayerNorm even runs, and FP32 accumulation cannot recover differences already lost during input casting. When checking a low-precision kernel against a reference, feed both the same rounded input and measure input-rounding error separately.

---

## Reported normalization layouts

Placing LayerNorm after the residual add represents just one configuration in a broad design space. Production transformers vary both the normalization operator (LayerNorm versus RMSNorm) and its graph placement across residual branches and attention projections. The reference summary below catalogs how representative models combine these choices:

| Layout | Representative model | Structural mechanism |
|---|---|---|
| **Post-LN** | Original Transformer, BERT | Normalizes after the residual addition |
| **Pre-LN** | GPT-2 | Normalizes sublayer inputs; preserves identity gradient path |
| **Pre-RMSNorm** | Llama 3, Mistral, Qwen 2.5 | Pre-LN placement with RMSNorm; retain the model's recipe[^qwen252024] |
| **Dual input-output norm** | Gemma 2 | RMSNorm on both input and output of each sublayer, before the add[^gemma2team2024] |
| **Peri-LN** | Kim et al. (2025) study | Input/output branch norms plus embedding/final norms in its full recipe[^kim2025] |
| **DeepNorm** | DeepNet (Wang et al. 2022) | Post-LN layout with depth-dependent skip scaling $\alpha$ and init scaling $\beta$[^wang2022] |
| **QK-Norm** | ViT-22B, Gemma 3, Qwen3 | Normalizes Q/K inside attention; can accompany residual norms[^dehghani2023Vit22B][^gemma3Technical2025][^transformersQwen35172026] |

These rows combine cleanly: Qwen3 pairs Pre-RMSNorm with per-head Q/K RMSNorm before RoPE, while Gemma 3 keeps its input/output residual-branch norms and replaces Gemma 2's attention soft-capping with QK-Norm.[^transformersQwen35172026][^gemma3Technical2025]

> **Key insight:** Do not infer Pre-LN vs. Post-LN from attribute names. Qwen3's `post_attention_layernorm` runs *after* the attention residual add but *before* the MLP, making it the MLP's Pre-LN input norm.[^transformersQwen35172026] Always read the order of operations around the residual add.

### QK-Norm controls one source of attention scale

Residual normalization regulates activations at block boundaries, yet another numerical instability emerges strictly inside the self-attention head. When query and key vector norms grow unchecked during long training runs, scaled dot-product logits widen sharply and drive attention softmax distributions into loss-stalling saturation. Dividing by $\sqrt{d_k}$ keeps unit-variance inputs well scaled, but it cannot contain unbounded parameter growth on the projections themselves:

$$
S_{ij} = \frac{q_i k_j^T}{\sqrt{d_k}}
$$

Growing Q/K norms widen logit **differences**, saturating softmax toward near one-hot weights even though raw magnitude alone is insufficient (`softmax([1000, 1000])` remains `[0.5, 0.5]`, and uniform offsets cancel). ViT-22B and Rybakov et al. study these instabilities empirically using both standalone QK-Norm and logit soft-capping.[^dehghani2023Vit22B][^rybakov2024] Notice that as softmax approaches a sharp spike, its score-to-probability Jacobian collapses toward zero:

$$
\frac{\partial \operatorname{Softmax}(S)_i}{\partial S_j} = \operatorname{Softmax}(S)_i (\delta_{ij} - \operatorname{Softmax}(S)_j) \approx 0
$$

Saturated softmax weakens that gradient path through attention weights rather than halting all network learning, since value projections still propagate error and cross-entropy targets at the output have linear logit gradients $p - y$. To tame growing score spreads inside attention itself, one common QK-Norm variant normalizes per-head queries and keys right before computing scaled dot products:[^rybakov2024]

$$
q' = \text{Norm}(q), \quad k' = \text{Norm}(k), \quad S_{ij} = \frac{q'_i {k'_j}^T}{\sqrt{d_k}}
$$

By contrast, the original QKNorm formulation normalizes vectors to unit $L_2$ norm and multiplies cosine similarity by a learned scalar temperature rather than preserving unit-RMS vectors under $1/\sqrt{d_k}$ scaling; choices over normalization axis, affine gains, temperatures, and whether normalization precedes RoPE vary across checkpoints.[^henry2020QKNorm][^transformersQwen35172026] Regardless of variant, Cauchy-Schwarz bounds the normalized dot product directly via vector Euclidean lengths:

$$
|q'_i \cdot k'_j| \le \|q'_i\|_2 \|k'_j\|_2
$$

Without learned gains, unit-RMS vectors have Euclidean length $\sqrt{d_k}$, bounding scaled logits at $|S_{ij}| \le \sqrt{d_k}$. Learned affine gains raise that ceiling directly, while biases and learned inverse temperatures scale score spread further. As the first check below demonstrates, even exact unit-RMS scaling admits sharp attention distributions when feature signs align strongly across width $d = 256$, while the second shows how normalization removes raw multiplicative scaling from a query vector.

<!-- leetllm: test, deps=torch, output=show -->
```python title="normalized-queries-can-still-saturate.py"
import torch

d = 256
q = torch.cat((torch.ones(d // 2), -torch.ones(d // 2))).double()
keys = torch.stack((q, -q))
# Both vectors already have zero mean, RMS 1, and L2 norm sqrt(d).
scores = keys @ q / d**0.5
probabilities = scores.softmax(0)
large_equal = torch.tensor([1000., 1000.]).softmax(0)
gain = 10
gained_scores = (gain * keys) @ (gain * q) / d**0.5
assert scores.tolist() == [16., -16.]
assert probabilities[1] < 2e-14
assert torch.equal(large_equal, torch.tensor([0.5, 0.5]))
assert gained_scores.tolist() == [1600., -1600.]
print("Uniform large logits:", large_equal.tolist())
print("Normalized logits:", scores.tolist())
print(f"Opposite-key probability: {probabilities[1].item():.2e}")
print("Gain 10 on both Q and K:", gained_scores.tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Uniform large logits: [0.5, 0.5]
Normalized logits: [16.0, -16.0]
Opposite-key probability: 1.27e-14
Gain 10 on both Q and K: [1600.0, -1600.0]
```
<!-- leetllm: output:end -->

<!-- leetllm: test, output=show -->
```python title="qk-norm-controls-dot-scale.py"
from math import isclose, sqrt

def rms_rescale(values):
    rms = sqrt(sum(value * value for value in values) / len(values))
    if rms == 0:
        raise ValueError("This epsilon-free illustration requires a nonzero vector")
    return [value / rms for value in values]

def attention_logit(query, key):
    return sum(q * k for q, k in zip(query, key)) / sqrt(len(query))

query = [6.0, -3.0, 2.0, 1.0]
key = [4.0, -2.0, 1.0, 3.0]
large_query = [20.0 * value for value in query]

raw = attention_logit(query, key)
raw_large = attention_logit(large_query, key)
controlled = attention_logit(rms_rescale(query), rms_rescale(key))
controlled_large = attention_logit(rms_rescale(large_query), rms_rescale(key))

print("raw logits:", round(raw, 3), round(raw_large, 3))
print("RMS-rescaled logits:", round(controlled, 3), round(controlled_large, 3))
assert raw_large == 20.0 * raw
assert isclose(controlled, controlled_large, rel_tol=1e-12)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw logits: 17.5 350.0
RMS-rescaled logits: 1.807 1.807
```
<!-- leetllm: output:end -->

### Peri-LN and sandwich normalization

Sandwich-style layouts wrap each sublayer inside two distinct normalizers, one reading the incoming stream and a second normalizing the branch write right before addition:

$$
x_{l+1} = x_l + \text{Norm}_{\text{out}}(F(\text{Norm}_{\text{in}}(x_l)))
$$

Notice that $\text{Norm}_{\text{out}}$ remains inside the branch **before the residual addition**, regulating every newly appended write while leaving the identity highway unbroken across depth. Because the stream still accumulates writes across layers and learned affine gains rescale branch amplitudes, activation magnitude can continue to evolve. Gemma 2 uses input/output RMSNorm on each sublayer branch, while Kim et al.'s Peri-LN configuration also normalizes token embeddings and final pre-head logits, emphasizing that a "post-branch norm" is still structurally distinct from wrapping the summed residual in classical Post-LN.[^kim2025][^gemma2team2024] In Kim et al.'s experiments from 400M to 3.2B parameters over 30B tokens, Peri-LN reduced gradient spikes and improved validation loss relative to Pre-LN using RMSNorm and 10% warmup, while observing training-time shifts in Pre-LN variance growth that underscore measuring dynamics empirically rather than treating initialization bounds as universal laws.[^kim2025]

---

## Debug normalization failures

When activations explode or gradients stall in a deep stack, matching the failure signature against tensor diagnostics separates placement, scaling, and mixed-precision bugs systematically:

| Symptom | Probable cause | Diagnostic check and fix |
|---|---|---|
| **Nonfinite loss in early steps** | Invalid inputs/masks, precision overflow, or excessive updates | Locate the first nonfinite tensor and log layerwise gradients and optimizer updates. Test a smaller early rate/warmup only after identifying the affected route. |
| **Nearly one-hot attention** | Large score gaps, Q/K gains, temperature, or actual data | Log visible score gaps, attention entropy, and gains. Check stable softmax and compare the checkpoint's QK/soft-cap recipe; no universal score-50 trigger exists. |
| **Changed scale at a ported Pre-LN head** | Missing final norm or other checkpoint mismatch | Compare final norm, epsilon, affine weights, head scaling, and reference activations. Restore the checkpoint's design. |
| **Small early-block gradients** | Jacobian geometry, loss/head behavior, optimizer, or precision | Measure activations, gradients, and updates across depth. Compare matched recipes; adding an identity term alone proves no gradient bound. |
| **Half-precision normalization differs** | Reduction dtype, epsilon, input rounding, or kernel behavior | Compare FP32 calculations on the same rounded inputs. Match epsilon and inspect accumulation/output dtypes instead of imposing a universal epsilon floor. |
| **Late Pre-LN states look redundant** | Stream-dominated writes under the measured training conditions | Compare raw write ratios and normalized-state changes, then ablate blocks on task metrics before changing architecture. |

---

## Practice: compare residual MLP blocks

Testing gradient propagation directly in code exposes how placement changes early-to-late gradient norms without changing parameter count or hidden dimension. The configurable residual block below toggles between Pre-LN and Post-LN styles so you can inspect per-block gradients across a six-layer stack:

<!-- leetllm: test, deps=torch, output=show -->
```python title="practice-build-a-toggle-switch-transformer.py"
import torch
import torch.nn as nn

class ToggleBlock(nn.Module):
    """Residual MLP block with style='pre' or style='post'."""
    def __init__(self, d_model: int, style: str = "pre"):
        super().__init__()
        if style not in ("pre", "post"):
            raise ValueError("style must be 'pre' or 'post'")
        self.style = style
        self.norm = nn.LayerNorm(d_model)
        # Simplified sublayer: single linear + ReLU
        self.sublayer = nn.Sequential(
            nn.Linear(d_model, d_model * 4),
            nn.ReLU(),
            nn.Linear(d_model * 4, d_model),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if self.style == "pre":
            # x_l + Sublayer(LayerNorm(x_l))
            return x + self.sublayer(self.norm(x))
        else:
            # LayerNorm(x_l + Sublayer(x_l))
            return self.norm(x + self.sublayer(x))

class TinyStack(nn.Module):
    def __init__(self, d_model: int = 64, depth: int = 6, style: str = "pre"):
        super().__init__()
        self.blocks = nn.ModuleList([ToggleBlock(d_model, style) for _ in range(depth)])
        self.final_norm = nn.LayerNorm(d_model) if style == "pre" else nn.Identity()
        self.head = nn.Linear(d_model, 16)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        for block in self.blocks:
            x = block(x)
        return self.head(self.final_norm(x))

def inspect_grad(style: str, d_model: int = 64, depth: int = 6, seed: int = 0):
    torch.manual_seed(seed)
    model = TinyStack(d_model=d_model, depth=depth, style=style)
    x = torch.randn(2, 8, d_model)
    target = torch.randn(2, 8, 16)
    out = model(x)
    loss = nn.functional.mse_loss(out, target)
    loss.backward()
    grad_norms = [block.sublayer[0].weight.grad.norm().item() for block in model.blocks]
    rounded_norms = [round(value, 4) for value in grad_norms]
    print(f"{style:4} | loss={loss.item():.4f} | block grad norms={rounded_norms}")
    return grad_norms

pre_grad_norms = inspect_grad("pre")
post_grad_norms = inspect_grad("post")

assert len(pre_grad_norms) == len(post_grad_norms) == 6
assert all(value > 0 for value in pre_grad_norms + post_grad_norms)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
pre  | loss=1.3247 | block grad norms=[0.2664, 0.2565, 0.2494, 0.2392, 0.2472, 0.2415]
post | loss=1.3183 | block grad norms=[0.2663, 0.2614, 0.2619, 0.2555, 0.2684, 0.2698]
```
<!-- leetllm: output:end -->

Both layouts have healthy nonzero gradients in this six-layer MLP stack, with the shared seed matching linear weights, inputs, targets, and heads across runs (the final Pre-LN norm initializes deterministically to unit scale and zero bias). Use the mini exercises below to push the same harness to deeper stacks and test ablations directly.

### Mini exercise

1. Try depths 6, 24, and 48 across several seeds. Record first/last-block gradient ratios. Does a claimed placement effect survive seed changes, or do both layouts remain similar?
2. Replace the final Pre-LN norm with `nn.Identity()` while preserving the other weights. Measure head input RMS and logits. This is an architectural ablation, not a safe checkpoint-porting change.
3. Compare `nn.LayerNorm(d_model, eps=1e-5)` with `nn.RMSNorm(d_model, eps=1e-5)`. Match epsilon and learned gains; then ask whether any difference comes from centering, placement, or the training recipe. Benchmark GPU kernel speed on the target device; CPU gradient norms describe a different measurement.

Normalize one token by hand, then place that same norm on the branch or on the sum. That placement is why a deep Post-LN stack can start with uneven gradients. The stream those norms protect still holds the features the model uses. Keeping the scale stable does not tell you which features the stream holds.

---

<!-- leetllm: mastery:start -->

## Mastery check

- Calculate LayerNorm by hand: token mean, population variance, epsilon adjustment, and learned scale/shift.
- Trace the exact reduction axes. Explain BatchNorm's batch/time coupling and eval behavior, and show why a hidden-only norm avoids future-token mixing.
- Formulate the block Jacobians for Pre-LN ($I + J_F J_{\text{LN}}$) and Post-LN ($J_{\text{LN}}(I + J_F)$).
- Scope Xiong's last-FFN initialization bound and explain why measured gradients/updates motivate a warmup experiment without establishing a universal schedule.
- State the assumptions behind relative-write dilution, distinguish aligned from uncorrelated writes, and use task ablations to investigate redundancy.
- Implement RMSNorm with explicit epsilon and gain. Separate formula simplification from measured operator or full-step performance.
- Preserve DeepNorm's $\operatorname{LN}(\alpha x+G(x))$ placement and selective initialization gain. Distinguish decoder-only from encoder-decoder scales, and demonstrate why normalized Q/K can still produce peaked attention.

### Practice checkpoints

```checkpoint
Your 48-layer decoder diverges during the first few hundred steps, but the same optimizer settings work on a 12-layer version. What should you inspect first?
---
Find the first nonfinite activation or gradient, then compare layerwise gradients and optimizer updates. Inspect masks, data, precision, initialization, normalization placement, and head configuration. If excessive early updates are observed, test a smaller early learning rate or warmup. For the ported Pre-LN model, also verify its final norm. A depth correlation is a clue, not a diagnosis.
```

```checkpoint
An RMSNorm implementation is faster in a microbenchmark. What must you check before claiming a training speedup?
---
Match shape, dtype, epsilon, affine settings, hardware, synchronization, and forward/backward work. Check fusion and measure full steps too. RMSNorm removes centering and usually a bias, but LayerNorm can fuse its work; two statistics do not imply two HBM passes. A small operator fraction limits the full-step improvement.
```

```checkpoint
Why can't QK-Norm replace residual normalization?
---
QK-Norm operates inside attention. It does not normalize FFN writes, the value/output branch, or the accumulated stream. Normalized Q/K can still produce large score gaps because of width, alignment, gains, or temperature. A checkpoint's residual norms and Q/K norms control different routes; replacing one with the other changes its recipe.
```

<!-- leetllm: mastery:end -->

```mastery-quiz
[
  {
    "question": "For token [1, 2, 6, 11], LayerNorm uses unit gain and zero shift. Ignore epsilon. Which output do you get to two decimal places?",
    "options": [
      "[-1.02, -0.76, 0.25, 1.52]",
      "[-0.88, -0.66, 0.22, 1.32]",
      "[0.16, 0.31, 0.94, 1.73]",
      "[-4.00, -3.00, 1.00, 6.00]"
    ],
    "answer": "[-1.02, -0.76, 0.25, 1.52]",
    "explanation": "The feature mean is 5. Subtract it to get [-4, -3, 1, 6]. The squared deviations sum to 62, so divide each deviation by sqrt(62/4). Using 62/3 for the variance gives the sample-variance result. Dividing the original features by their RMS gives the all-positive vector. Stopping after centering leaves the integer deviations."
  },
  {
    "question": "A token keeps features [1,3] while its batch peers change from small to large values. Its hidden-only LayerNorm stays fixed, but training BatchNorm changes. Which dependency explains the result?",
    "options": [
      "LayerNorm uses this token’s features; training BatchNorm uses statistics shared with the changed peers.",
      "LayerNorm uses stored batch averages; training BatchNorm uses this token’s own fixed feature mean.",
      "LayerNorm learns fresh gains for this call; training BatchNorm freezes its gains when peers change.",
      "LayerNorm applies a causal mask to peers; training BatchNorm changes the current token’s attention weights."
    ],
    "answer": "LayerNorm uses this token’s features; training BatchNorm uses statistics shared with the changed peers.",
    "explanation": "Hidden-only LayerNorm recomputes statistics inside each token. Training BatchNorm couples examples through batch statistics. Stored running estimates describe its default evaluation mode, not the training case in this question."
  },
  {
    "question": "A port changes x+F(LN(x)) into LN(x+F(x)). Which change appears in the direct skip contribution to the block Jacobian?",
    "options": [
      "The skip contribution crosses the outer normalization Jacobian evaluated at x + F(x).",
      "The skip contribution retains an additive identity term outside all normalization in the new block.",
      "The skip contribution crosses the branch Jacobian at x and then the normalization Jacobian at x + F(x).",
      "The skip contribution crosses the outer normalization Jacobian evaluated at the incoming state x."
    ],
    "answer": "The skip contribution crosses the outer normalization Jacobian evaluated at x + F(x).",
    "explanation": "In the original block, the skip carries a perturbation directly to the output. In the port, the skip carries it to the sum x + F(x), which is the input to LayerNorm. The derivative of addition passes the perturbation through unchanged there, but the outer norm still acts on it. Only the other path passes through F. Evaluating the norm derivative at x would use the state before the branch wrote to it."
  },
  {
    "question": "A 72-layer Post-LN transformer diverges early with plain SGD. On the first step, the update norm is 20% of the weight norm in the top blocks and 2% in the lower blocks. A stable reference starts near 2% in both groups. You replay the step with the same weights and gradients and measure both ratios again. Which learning-rate schedule would bring both ratios near 2% on the replay?",
    "options": [
      "Start the top blocks at their original rate and decay to one tenth of it over ten steps. Keep the lower-block rate unchanged.",
      "Warm up the top blocks from one tenth of their original rate. Keep the lower-block rate unchanged.",
      "Warm up both the top and lower blocks from one tenth of their original rates.",
      "Warm up the lower blocks from one tenth of their original rate. Keep the top-block rate unchanged."
    ],
    "answer": "Warm up the top blocks from one tenth of their original rate. Keep the lower-block rate unchanged.",
    "explanation": "With plain SGD, the update norm is the learning rate times the gradient norm. At the same weights and on the same batch, cutting the top rate tenfold takes its first update from 20% to 2%. Starting a decay at the original rate leaves that update at 20%. Warming up both groups also cuts the lower update to 0.2%. Warming up only the lower blocks leaves the large top update in place. Later measurements tell you whether this schedule helps training."
  },
  {
    "question": "An engineer ports a GPT-2-style Pre-LN decoder but deletes the final normalization before the vocabulary projection, arguing that each block already has LayerNorm on its sublayer input. What should the review flag?",
    "options": [
      "Keep it removed, because the identity residual path requires unnormalized logits for stable softmax behavior.",
      "Replace it with BatchNorm, because running statistics are needed once decoding uses batch size one.",
      "Restore the final norm: Pre-LN block outputs bypass normalization, so the accumulated stream reaches the head.",
      "Move every block to Post-LN, because any final norm makes the Pre-LN identity path disappear."
    ],
    "answer": "Restore the final norm: Pre-LN block outputs bypass normalization, so the accumulated stream reaches the head.",
    "explanation": "Inside a Pre-LN block, the residual stream is added after the sublayer input normalization, so the block output itself isn't normalized. GPT-2-style Pre-LN architectures and the Pre-LN setup discussed by Xiong et al. include a final normalization before prediction; deleting it changes the architecture and can change output scale."
  },
  {
    "question": "In a 96-layer Pre-LN model, a late block's write is 1% of the incoming stream norm. The normalized states before and after the block have cosine similarity 0.999. Which comparison, if it gave similar losses, would directly support skipping this block on the held-out task?",
    "options": [
      "Compare loss with this block bypassed on tokens with high state similarity to loss with it active on tokens with lower similarity.",
      "Compare losses on the same tokens with all late blocks active and with all late blocks bypassed.",
      "Compare losses on the same tokens with this block's write at full strength and at half strength.",
      "Compare losses on the same tokens with the model intact and with only this block's write set to zero."
    ],
    "answer": "Compare losses on the same tokens with the model intact and with only this block's write set to zero.",
    "explanation": "Setting the write to zero passes the incoming stream through the block unchanged. Even similar normalized states can yield different predictions. Little change in loss on the same tokens would support skipping the block for this metric. Grouping tokens by state similarity changes which tokens each model sees. Bypassing several blocks measures their combined effect. Halving the write leaves part of its signal in the stream."
  },
  {
    "question": "For token [2, -2, 4, 8], RMSNorm uses unit gain and ignores epsilon. What are the output vector and its feature mean, rounded to two decimal places?",
    "options": [
      "[0.43, -0.43, 0.85, 1.71] with mean 0.64",
      "[-0.28, -1.39, 0.28, 1.39] with mean 0.00",
      "[0.67, -0.67, 1.33, 2.67] with mean 1.00",
      "[2.00, -2.00, 4.00, 8.00] with mean 3.00"
    ],
    "answer": "[0.43, -0.43, 0.85, 1.71] with mean 0.64",
    "explanation": "The squared features sum to 88, so divide each input by sqrt(88/4), or sqrt(22). The input mean of 3 becomes 3/sqrt(22), about 0.64. Centering first and dividing by the standard deviation gives the zero-mean LayerNorm output. Dividing by 3 gives mean one. Returning the input skips the RMS division, which still applies when the gain is one."
  },
  {
    "question": "A preprocessing change adds the same constant offset to every feature in a token vector. Gamma, beta, and epsilon stay fixed. How do LayerNorm and RMSNorm respond?",
    "options": [
      "Both produce the same output because any normalization operation removes additive offsets as well as multiplicative scaling.",
      "LayerNorm is unchanged after centering; RMSNorm generally changes because its uncentered scale and ratios change.",
      "LayerNorm generally changes, while RMSNorm stays fixed because root-mean-square scaling removes any shared constant offset.",
      "Both outputs gain the same constant because learned gamma and beta preserve offsets introduced before normalization."
    ],
    "answer": "LayerNorm is unchanged after centering; RMSNorm generally changes because its uncentered scale and ratios change.",
    "explanation": "Adding a constant shifts LayerNorm's input mean by that same amount, so subtracting the new mean cancels the offset and leaves the centered deviations unchanged. RMSNorm divides the uncentered vector by its root mean square, so an additive offset generally changes both that scale and the resulting feature ratios."
  },
  {
    "question": "A port adds QK normalization and removes residual-stream normalization, arguing that bounded attention scores replace it. Which review diagnosis follows?",
    "options": [
      "Keep both controls: QK normalization controls query/key scale, while residual norms control branch or stream scale.",
      "Keep the replacement: query/key scale determines every feature scale in feed-forward and residual additions.",
      "Remove the final norm too: bounded attention logits imply that the accumulated stream has unit feature variance.",
      "Move QK normalization after softmax: probability normalization then controls the residual addition’s feature axes."
    ],
    "answer": "Keep both controls: QK normalization controls query/key scale, while residual norms control branch or stream scale.",
    "explanation": "QK normalization operates on queries and keys inside attention, whereas residual and branch norms regulate different tensors around the residual addition. Bounding raw attention logits fixes neither residual stream growth nor overall gradient flow."
  },
  {
    "question": "A DeepNorm port initializes its selected branch matrices with gain beta=0.5. Later the trained branch produces G(x)=2, but the forward pass multiplies that result by 0.5 again. What should review require?",
    "options": [
      "Use LN(alpha*x+2): beta belongs to the specified initialization, so another forward factor changes the recipe.",
      "Use LN(alpha*x+1): the initialization gain must also multiply every trained branch result during forward.",
      "Use alpha*x+2 without LN: the smaller initialization gain changes the layout into a Pre-LN residual block.",
      "Use LN(0.5*x+2): the initialization gain replaces the depth-dependent skip scale after training begins."
    ],
    "answer": "Use LN(alpha*x+2): beta belongs to the specified initialization, so another forward factor changes the recipe.",
    "explanation": "DeepNorm uses LN(alpha*x+G(x)). Beta is the selective initialization gain, while alpha scales the skip path during forward. Applying beta to G again changes the specified architecture. Preserve the matching depth-dependent coefficients and initialization rule."
  }
]
```

> **Next:** Continue to [Mechanistic Interpretability](/learn/mechanistic-interpretability-sparse-autoencoders). Use sparse autoencoders to study features inside the residual stream, then test what those features do.
