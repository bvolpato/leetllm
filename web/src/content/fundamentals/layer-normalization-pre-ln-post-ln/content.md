---
{
  "id": "layer-normalization-pre-ln-post-ln",
  "title": "Layer Normalization: Pre-LN vs Post-LN",
  "slug": "layer-normalization-pre-ln-post-ln",
  "section": "Transformer & Multimodal Architectures",
  "category": "Transformer Architecture",
  "difficulty": "Hard",
  "order": 3,
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

In a 32-layer decoder, every token carries a hidden vector through the stack. That running vector is the <span data-glossary="residual-stream">residual stream</span>. Take one token state: `[3.0, 1.0, -1.0, 5.0]`. Attention reads other visible tokens and adds an update; the feed-forward network adds another. Across dozens of layers, repeated additions stretch the stream's scale. How do we keep what each sublayer reads well-scaled without strangling gradients on their way back from the loss?

<span data-glossary="layernorm">LayerNorm</span> centers a single token's features and scales them by their spread, then applies learned gain and shift parameters. Placing that exact operation **after** the residual addition (Post-LN) versus **before** the sublayer branch (Pre-LN) creates two completely different forward trajectories and backward gradient paths.

## One residual stream, many writes

Write the bare residual update for any transformer sublayer (attention or MLP):

$$
x_{l+1} = x_l + F_l(x_l)
$$

If each sublayer adds a roughly independent perturbation with variance $\sigma_{\text{sub}}^2$, hidden variance grows linearly with depth $l$ and standard deviation expands like $\sqrt{l}$:

$$
\operatorname{Var}(x_l) \approx \operatorname{Var}(x_0) + l \cdot \sigma_{\text{sub}}^2
$$

Correlated writes can bend that curve faster or slower, yet left unchecked, deep residual sums drift in magnitude. Normalization tames that drift, and where it sits around the `+` decides how error signals flow backward during <span data-glossary="backpropagation">backpropagation</span>.[^xiong2020] First, trace the exact arithmetic inside LayerNorm on one vector.

## LayerNorm by hand

Take a single 4-dimensional token state `x = [3.0, 1.0, -1.0, 5.0]` and compute every step without framework magic:

1. **Feature mean:** Average across the token's $d = 4$ hidden features:

$$
\mu = \frac{3.0 + 1.0 + (-1.0) + 5.0}{4} = 2.0
$$

2. **Centering:** Subtract $\mu = 2.0$ from every coordinate, giving `[1.0, -1.0, -3.0, 3.0]`.
3. **Population variance:** Average the squared deviations using $1/d$ (not Bessel's $1/(d - 1)$):

$$
\sigma^2 = \frac{1.0^2 + (-1.0)^2 + (-3.0)^2 + 3.0^2}{4} = \frac{20.0}{4} = 5.0
$$

4. **Standardize:** Ignoring $\epsilon$ for the hand check, divide by $\sigma = \sqrt{5.0} \approx 2.236$:

$$
\hat{x} = \left[\frac{1.0}{2.236}, \frac{-1.0}{2.236}, \frac{-3.0}{2.236}, \frac{3.0}{2.236}\right] \approx [0.447, -0.447, -1.342, 1.342]
$$

5. **Affine transform:** Multiply by learned per-channel scale $\gamma$ (initialized to `1`) and add shift $\beta$ (initialized to `0`), giving the general formula for $x \in \mathbb{R}^d$:[^ba2016]

$$
\text{LayerNorm}(x) = \gamma \odot \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} + \beta
$$

Adding $\epsilon$ (typically $10^{-5}$ or $10^{-6}$) prevents division by zero on constant vectors, turning pre-affine output variance into $\sigma^2 / (\sigma^2 + \epsilon)$. Notice that every reduction stays strictly inside **one token's feature axis**.

<figure>
  <img src="illustrations/_generated/layer_norm_dark.png" alt="Three side-by-side bar charts track features f1 through f4 on a shared scale from negative three to six. Input x = [3, 1, -1, 5] has mean 2 and variance 5. Subtracting mean 2 gives centered [1, -1, -3, 3] with mean 0 and variance 5. Dividing by sqrt(5) compresses outputs to [0.45, -0.45, -1.34, 1.34] with mean 0 and variance 1." />
  <figcaption>Tracking features $f_1$ through $f_4$ on a shared $[-3, 6]$ axis. Subtracting $\mu = 2$ centers the vector while preserving variance $5$; dividing by $\sqrt{5}$ compresses spread to unit variance ($\epsilon=0, \gamma=1, \beta=0$).</figcaption>
</figure>

### Why transformers use LayerNorm instead of BatchNorm

BatchNorm normalizes each feature channel across the mini-batch (and often across time in `BatchNorm1d`), creating three headaches for causal language models:[^pytorchBatchNorm2142026]

| Property | BatchNorm | LayerNorm |
|---|---|---|
| **Reduction axis** | Mini-batch (and temporal positions) | Feature coordinates within one token |
| **Causality & padding** | Time reduction can leak future tokens; padding skews stats | Hidden-only stats never mix tokens |
| **Train vs eval behavior** | Uses batch stats in training, stored running averages in eval | Identical per-token computation in both modes |
| **Single-token decoding** | Relies on running estimates; sensitive to batch shift | Exact match with training, even at batch size 1 |

In PyTorch, passing an integer `nn.LayerNorm(d_model)` to a `(batch, seq_len, d_model)` tensor normalizes strictly along the last axis.[^pytorch_layernorm] Passing a tuple `(seq_len, d_model)` reduces over time too and leaks future-token edits backward into earlier positions. In <span data-glossary="mixed-precision">mixed precision</span>, always upcast FP16/BF16 inputs to FP32 for the mean and variance reductions before casting back.

<!-- leetllm: test, deps=torch, output=show, output_title="Per-token LayerNorm matches hand math and preserves causality" -->
```python title="layernorm-verify-and-causality.py"
import torch
import torch.nn as nn


class LayerNorm(nn.Module):
    def __init__(self, d_model: int, eps: float = 1e-5):
        super().__init__()
        self.gamma = nn.Parameter(torch.ones(d_model))
        self.beta = nn.Parameter(torch.zeros(d_model))
        self.eps = eps

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        work = x.float() if x.dtype in (torch.float16, torch.bfloat16) else x
        mean = work.mean(dim=-1, keepdim=True)
        var = work.var(dim=-1, keepdim=True, unbiased=False)
        x_hat = (work - mean) / torch.sqrt(var + self.eps)
        return (self.gamma * x_hat + self.beta).to(x.dtype)


# 1. Match the hand calculation on [3, 1, -1, 5].
ln = LayerNorm(4)
out = ln(torch.tensor([[[3.0, 1.0, -1.0, 5.0]]]))
print("hand check:", out.round(decimals=2).detach().tolist())
assert torch.allclose(out.round(decimals=2), torch.tensor([[[0.45, -0.45, -1.34, 1.34]]]))

# 2. Hidden-only LayerNorm isolates token 0 when token 1 changes; reducing over (seq, d) leaks future edits.
seq = torch.tensor([[[1.0, 2.0, 4.0], [2.0, 5.0, 8.0]]], dtype=torch.float64)
edited = seq.clone()
edited[:, 1] += 100.0
per_token = nn.LayerNorm(3, elementwise_affine=False).double()
over_time = nn.LayerNorm((2, 3), elementwise_affine=False).double()
print("token 0 unchanged (hidden-only):", torch.allclose(per_token(seq)[:, 0], per_token(edited)[:, 0]))
print("token 0 unchanged (seq+hidden): ", torch.allclose(over_time(seq)[:, 0], over_time(edited)[:, 0]))
assert torch.allclose(per_token(seq)[:, 0], per_token(edited)[:, 0])
assert not torch.allclose(over_time(seq)[:, 0], over_time(edited)[:, 0])
```

<!-- leetllm: output:start -->
```text title="Per-token LayerNorm matches hand math and preserves causality" output compact
hand check: [[[0.44999998807907104, -0.44999998807907104, -1.340000033378601, 1.340000033378601]]]
token 0 unchanged (hidden-only): True
token 0 unchanged (seq+hidden):  False
```
<!-- leetllm: output:end -->

```checkpoint
If you pass a batch of 16 sequences through `nn.LayerNorm(d_model)`, which numbers determine the mean and variance of token `t` in sequence `b`?
---
Only the `d_model` feature coordinates of that single token `(b, t)`. Neighboring tokens in the sequence and other examples in the batch have zero effect on its statistics.
```

## Pre-LN vs Post-LN: placement and gradient flow

Every transformer block wraps two sublayers (multi-head attention and an MLP), each taking $x_l$ and adding an update $F(x_l)$. Two classic placements put LayerNorm on opposite sides of the addition:

- **Post-LN** (original Transformer, BERT) normalizes *after* the residual sum:[^vaswani2017][^devlin2019]

$$
x_{l+1} = \text{LayerNorm}(x_l + F(x_l))
$$

- **Pre-LN** (GPT-2, Llama, Mistral, Qwen) normalizes the branch input *before* $F$, leaving the residual highway untouched and appending one final norm before the output head:[^radford2019][^xiong2020]

$$
x_{l+1} = x_l + F(\text{LayerNorm}(x_l)), \qquad y = \text{Head}(\text{FinalNorm}(x_L))
$$

<figure>
  <img src="illustrations/_generated/pre_vs_post_ln_dark.png" alt="Two stacked computational graphs trace a blue identity skip. In Pre-LN it bypasses LayerNorm and the sublayer before reaching the addition. In Post-LN the skip reaches the addition and the whole sum then passes through LayerNorm. The corresponding Jacobians preserve this operation order." />
  <figcaption>Trace the blue identity skip from $x$ to $y$. Pre-LN bypasses normalization ($J = I + J_F J_{\text{LN}}$), whereas Post-LN pushes the combined sum through LayerNorm ($J = J_{\text{LN}}(I + J_F)$). Backpropagation multiplies by $J^T$.</figcaption>
</figure>

### Why Pre-LN trains more stably

Differentiating each block exposes why depth behaves so differently in backward pass. For one token with standardized state $\hat{x}$ and denominator $s = \sqrt{\sigma^2 + \epsilon}$, the LayerNorm Jacobian scales inversely with $s$ and projects out the constant mean direction and radial scaling direction:

$$
J_{\text{LN}} = \frac{\operatorname{diag}(\gamma)}{s}\left(I - \frac{\mathbf{1}\mathbf{1}^T}{d} - \frac{\hat{x}\hat{x}^T}{d}\right)
$$

Now compare how block Jacobians chain from layer $l$ to output $L$:

- **Post-LN:** $\frac{\partial x_{l+1}}{\partial x_l} = J_{\text{LN}, l}(I + J_{F, l})$. Every backward signal along the skip path must pass through a chain of normalization Jacobians $J_{\text{LN}, l}^T \cdots J_{\text{LN}, L-1}^T$. Under Xiong et al.'s initialization analysis, gradients concentrate heavily near the top layers (final-FFN norm $O(d\sqrt{\ln d})$ vs Pre-LN's $O(d\sqrt{\ln d / L})$), making careful learning-rate warmup essential to keep early steps from diverging.[^xiong2020]
- **Pre-LN:** $\frac{\partial x_{l+1}}{\partial x_l} = I + J_{F, l} J_{\text{LN}, l}$. Expanding across layers keeps an explicit identity term $I$ outside the branch products:

$$
\frac{\partial x_L}{\partial x_l} = I + \sum_{k=l}^{L-1} J_{F, k} J_{\text{LN}, k} \frac{\partial x_k}{\partial x_l}
$$

That additive identity highway carries gradients cleanly to early blocks right from step zero. (Note that $I$ does not create an absolute lower bound, since a branch can cancel along specific directions where $J_F J_{\text{LN}} v = -v$, and real recipes still pair Pre-LN with tuned warmup and initialization.)[^xiong2020][^kim2025]

Verify both block Jacobians and the forward/backward contrast directly in PyTorch:

<!-- leetllm: test, deps=torch, output=show, output_title="Pre-LN vs Post-LN Jacobians and 6-layer gradients" -->
```python title="pre-vs-post-ln-verify.py"
import torch
import torch.nn as nn
from torch.autograd.functional import jacobian

# 1. Verify exact analytical block Jacobians against autograd.
torch.manual_seed(11)
x = torch.tensor([3.0, 1.0, -1.0, 5.0], dtype=torch.float64, requires_grad=True)
W = torch.randn(4, 4, dtype=torch.float64) * 0.2
I = torch.eye(4, dtype=torch.float64)
ln = lambda v: nn.functional.layer_norm(v, (4,), eps=1e-5)
pre = lambda v: v + W @ ln(v)
post = lambda v: ln(v + W @ v)

torch.testing.assert_close(jacobian(pre, x), I + W @ jacobian(ln, x))
torch.testing.assert_close(jacobian(post, x), jacobian(ln, x + W @ x) @ (I + W))
print("Block Jacobians match autograd: True")

# 2. Compare stream norm growth and per-block gradients across a 6-layer residual MLP stack.
def run_stack(style: str, depth: int = 6, d_model: int = 64):
    torch.manual_seed(0)
    norms = nn.ModuleList([nn.LayerNorm(d_model) for _ in range(depth)])
    mlps = nn.ModuleList([
        nn.Sequential(nn.Linear(d_model, d_model * 4), nn.ReLU(), nn.Linear(d_model * 4, d_model))
        for _ in range(depth)
    ])
    final_norm = nn.LayerNorm(d_model) if style == "pre" else nn.Identity()
    head = nn.Linear(d_model, 16)
    h = torch.randn(2, 8, d_model)
    target = torch.randn(2, 8, 16)
    for norm, mlp in zip(norms, mlps):
        h = h + mlp(norm(h)) if style == "pre" else norm(h + mlp(h))
    stream_rms = float(h.pow(2).mean().sqrt())
    loss = nn.functional.mse_loss(head(final_norm(h)), target)
    loss.backward()
    grads = [round(float(m[0].weight.grad.norm()), 4) for m in mlps]
    print(f"{style:4s} | pre-head stream RMS={stream_rms:.3f} | block grads={grads}")


run_stack("pre")
run_stack("post")
```

<!-- leetllm: output:start -->
```text title="Pre-LN vs Post-LN Jacobians and 6-layer gradients" output compact
Block Jacobians match autograd: True
pre  | pre-head stream RMS=1.151 | block grads=[0.2664, 0.2565, 0.2494, 0.2392, 0.2472, 0.2415]
post | pre-head stream RMS=1.000 | block grads=[0.2663, 0.2614, 0.2619, 0.2555, 0.2684, 0.2698]
```
<!-- leetllm: output:end -->

Notice two concrete signatures in that output: Post-LN clamps the stream RMS right at `1.000`, while Pre-LN's unnormalized residual stream has already grown to `1.351` after just 6 blocks, which is why deleting `FinalNorm` in a Pre-LN checkpoint port changes the scale hitting the language-modeling head.

## Representation collapse and DeepNorm

Leaving the Pre-LN residual highway unnormalized carries a structural tradeoff in very deep stacks. Because $x_L = x_0 + \sum_{l=0}^{L-1} F_l(\text{LN}(x_l))$, uncorrelated unit-scale writes push $\|x_l\| \approx O(\sqrt{l})$, so each late layer's relative write shrinks like:

$$
\frac{\|\Delta x_l\|}{\|x_l\|} \approx O\!\left(\frac{1}{\sqrt{l}}\right)
$$

In deep Pre-LN translation models, ResiDual documented rising cosine similarity between consecutive normalized states and diminishing late-layer updates (often called **representation collapse**).[^xie2023] Before declaring a late block redundant from a small norm ratio alone, run a controlled ablation zeroing only that block's write on held-out tokens and check task loss directly.

To recover Post-LN's crisp representation updates at extreme depth without instability, **DeepNorm** (Wang et al., 2022) scales the residual skip by a depth-dependent constant $\alpha > 1$ while down-scaling selected sublayer initializations (FFN weights and attention value/output projections) by $\beta < 1$:[^wang2022]

$$
x_{l+1} = \text{LayerNorm}(\alpha \cdot x_l + G_l(x_l))
$$

For an $N$-layer encoder-only or $M$-layer decoder-only model, DeepNorm sets $\alpha = (2N)^{1/4}$ and $\beta = (8N)^{-1/4}$ (encoder-decoder stacks adjust constants for cross-attention). Critically, $\beta$ is applied **only at weight initialization**, never as a second runtime multiplier on $G_l(x_l)$. DeepNet scaled Post-LN transformers to 1,000 layers while still retaining learning-rate warmup in its translation runs.[^wang2022]

| Property | Post-LN | Pre-LN | DeepNorm |
|---|---|---|---|
| **Residual equation** | $\text{LN}(x + F(x))$ | $x + F(\text{LN}(x))$ | $\text{LN}(\alpha x + G(x))$ |
| **Skip gradient path** | Chained $J_{\text{LN}}$ | Direct identity $I$ | Scaled skip through $J_{\text{LN}}$ |
| **Final norm needed?** | No (last block normalizes) | Yes (stream unnormalized) | No (last block normalizes) |
| **Primary risk** | Steep top-layer gradients without warmup | Relative write dilution at great depth | Must preserve exact $(\alpha, \beta)$ init recipe |

## RMSNorm and mixed-precision traps

Zhang and Sennrich (2019) asked whether mean-centering was necessary at all and introduced **RMSNorm**, which drops mean subtraction and learned bias $\beta$, dividing only by the uncentered root mean square:[^zhang2019]

$$
\text{RMSNorm}(x) = \gamma \odot \frac{x}{\sqrt{\frac{1}{d}\sum_{i=1}^d x_i^2 + \epsilon}}
$$

<figure>
  <img src="illustrations/_generated/norm_variants_dark.png" alt="Two side-by-side line plots compare LayerNorm and RMSNorm on input x = [3, 1, -1, 5] and shifted input x + 10 = [13, 11, 9, 15]. LayerNorm outputs remain identical at [0.45, -0.45, -1.34, 1.34] after adding 10 because mean subtraction cancels uniform shifts. RMSNorm lacks centering, so outputs shift from [1.00, 0.33, -0.33, 1.67] to [1.07, 0.90, 0.74, 1.23]." />
  <figcaption>Comparing LayerNorm (purple) and RMSNorm (green) on <code>x</code> and <code>x + 10</code> ($\epsilon=0, \gamma=1, \beta=0$). Centering makes LayerNorm invariant to uniform additive shifts; uncentered RMSNorm pulls every output positive.</figcaption>
</figure>

Llama, Mistral, Qwen 2.5, and Gemma 2 all adopt RMSNorm.[^qwen252024][^gemma2team2024] Do not assume dropping mean calculation halves GPU runtime, though: fused LayerNorm kernels compute mean and variance in one pass via Welford's algorithm, so memory bandwidth dominates, and even halving a normalization kernel that takes 2% of step time only trims 1% end to end.[^pytorchLayerNormKernel2026][^tritonLayerNorm2026][^zhang2019]

In mixed precision, **always cast FP16 activations to FP32 before squaring**. A finite FP16 number like `300.0` squares to `90,000`, overflowing FP16's ceiling (`65,504`) into `inf` before the square root ever runs. Separately, FP32 accumulation cannot rescue precision already destroyed by input rounding (`[10000, 10001, 9999, 10002]` all round to `10000.0` in FP16 before normalization starts):[^pytorch_rmsnorm][^pytorchTypeInfo2026]

<!-- leetllm: test, deps=torch, output=show, output_title="RMSNorm and FP16 squaring overflow" -->
```python title="rmsnorm-and-fp16-overflow.py"
import torch
import torch.nn as nn


class RMSNorm(nn.Module):
    def __init__(self, d_model: int, eps: float = 1e-6):
        super().__init__()
        self.weight = nn.Parameter(torch.ones(d_model))
        self.eps = eps

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        work = x.float() if x.dtype in (torch.float16, torch.bfloat16) else x
        rms = torch.sqrt(work.pow(2).mean(dim=-1, keepdim=True) + self.eps)
        return (self.weight * (work / rms)).to(x.dtype)


x = torch.tensor([[[3.0, 1.0, -1.0, 5.0]]])
out = RMSNorm(4)(x)
print("RMSNorm([3, 1, -1, 5]):", out.round(decimals=4).detach().tolist())

large = torch.tensor([300.0, -300.0], dtype=torch.float16)
fp16_rms = (large.square().mean() + 1e-6).sqrt()
fp32_rms = (large.float().square().mean() + 1e-6).sqrt()
print(f"FP16 squaring RMS={fp16_rms.item()} | FP32 upcast RMS={fp32_rms.item():.1f}")
assert torch.isinf(fp16_rms) and fp32_rms.item() == 300.0
```

<!-- leetllm: output:start -->
```text title="RMSNorm and FP16 squaring overflow" output compact
RMSNorm([3, 1, -1, 5]): [[[1.0, 0.33329999446868896, -0.33329999446868896, 1.666700005531311]]]
FP16 squaring RMS=inf | FP32 upcast RMS=300.0
```
<!-- leetllm: output:end -->

> **Common mistake:** Upcasting to FP32 *after* squaring FP16 inputs. `300.0 ** 2` overflows `65,504` immediately in FP16; cast to FP32 before squaring.

## Modern layouts: QK-Norm and Peri-LN

Modern frontier models combine residual placement with targeted internal normalizers:

| Layout | Representative models | Structural mechanism |
|---|---|---|
| **Pre-RMSNorm** | Llama 3, Mistral, Qwen 2.5 | RMSNorm on sublayer inputs + final norm[^qwen252024] |
| **Peri-LN / Sandwich** | Gemma 2, Kim et al. (2025) | Norm on *both* input and output of each branch, before the residual add[^gemma2team2024][^kim2025] |
| **QK-Norm** | ViT-22B, Gemma 3, Qwen3 | Normalizes per-head $Q$ and $K$ inside attention before dot products[^dehghani2023Vit22B][^gemma3Technical2025][^transformersQwen35172026] |

> **Key insight:** Never infer Pre-LN vs Post-LN from PyTorch attribute names. Qwen3's `post_attention_layernorm` sits *after* the attention residual add and *before* the MLP, making it the MLP's Pre-LN input norm.[^transformersQwen35172026] Always read the residual `+` order in `forward()`.

### QK-Norm tames attention logit growth

Inside self-attention, $S_{ij} = q_i k_j^T / \sqrt{d_k}$ can grow extreme score differences as projection weights expand during long runs, pushing attention softmax toward one-hot spikes whose Jacobian $\operatorname{Softmax}(S)_i(\delta_{ij} - \operatorname{Softmax}(S)_j)$ collapses near zero. **QK-Norm** normalizes per-head queries and keys right before the dot product:[^henry2020QKNorm][^rybakov2024]

$$
q' = \text{Norm}(q), \qquad k' = \text{Norm}(k), \qquad S_{ij} = \frac{q'_i {k'_j}^T}{\sqrt{d_k}}
$$

By Cauchy-Schwarz, unit-RMS vectors (Euclidean length $\sqrt{d_k}$) bound un-gained logits to $|S_{ij}| \le \sqrt{d_k}$. Learned gains raise that ceiling, and aligned signs across large $d_k$ can still produce sharp softmax weights, so QK-Norm controls one scale source inside attention without replacing residual-stream normalization.

### Peri-LN (sandwich normalization)

Sandwich layouts normalize both the incoming branch input and the outgoing branch write *inside* the branch before adding to the residual stream:

$$
x_{l+1} = x_l + \text{Norm}_{\text{out}}(F(\text{Norm}_{\text{in}}(x_l)))
$$

Because $\text{Norm}_{\text{out}}$ stays before the `+`, the direct identity skip survives while every newly added write has controlled scale. Kim et al. (2025) reported fewer gradient spikes and lower validation loss across 400M–3.2B models relative to Pre-LN.[^kim2025]

## Debugging normalization failures

| Symptom | Likely cause | Check and fix |
|---|---|---|
| **Nonfinite loss on early steps** | FP16 squaring overflow, bad mask, or steep Post-LN gradients | Find the first nonfinite tensor; verify FP32 norm reduction and test learning-rate warmup |
| **Nearly one-hot attention** | Growing $Q/K$ projection norms or affine gains | Log attention logit gaps and entropy; compare QK-Norm or logit soft-capping |
| **Shifted logits after porting Pre-LN** | Dropped `FinalNorm` or mismatched `eps` | Restore final norm, match checkpoint `eps` (note PyTorch `nn.RMSNorm` defaults `eps=None` to machine epsilon), and verify activations |
| **Small early-block gradients** | Chained Post-LN Jacobians or branch cancellation | Log per-block gradient norms across depth; compare Pre-LN or DeepNorm scaling |
| **Suspected late-layer redundancy** | Large Pre-LN stream diluting relative write size | Measure loss with only that block's write zeroed on held-out tokens before pruning |

```mastery-quiz
[
  {
    "question": "For token [1, 2, 6, 11], LayerNorm uses gamma = 1, beta = 0, and eps = 0. What is the output to two decimal places?",
    "options": [
      "[-1.02, -0.76, 0.25, 1.52]",
      "[-0.88, -0.66, 0.22, 1.32]",
      "[0.16, 0.31, 0.94, 1.73]",
      "[-4.00, -3.00, 1.00, 6.00]"
    ],
    "answer": "[-1.02, -0.76, 0.25, 1.52]",
    "explanation": "Mean is 5, centered vector is [-4, -3, 1, 6], and population variance is (16 + 9 + 1 + 36) / 4 = 15.5. Dividing by sqrt(15.5) = 3.937 gives [-1.02, -0.76, 0.25, 1.52]. Dividing by sqrt(62/3) uses sample variance instead."
  },
  {
    "question": "A port replaces Pre-LN (x + F(LN(x))) with Post-LN (LN(x + F(x))). How does the direct skip contribution to the block Jacobian change?",
    "options": [
      "The skip contribution must pass through the outer LayerNorm Jacobian evaluated at x + F(x).",
      "The skip contribution keeps an unobstructed identity matrix outside normalization.",
      "The skip contribution passes through F first and then LayerNorm.",
      "The skip contribution passes through LayerNorm evaluated at x before the addition."
    ],
    "answer": "The skip contribution must pass through the outer LayerNorm Jacobian evaluated at x + F(x).",
    "explanation": "In Pre-LN, J = I + J_F J_LN leaves the identity skip outside normalization. In Post-LN, J = J_LN(x + F(x)) (I + J_F), forcing every skip signal through the outer normalization Jacobian evaluated at the summed state."
  },
  {
    "question": "An engineer ports a GPT-2-style Pre-LN decoder and deletes the final LayerNorm before the vocabulary head, arguing every block already normalizes its input. What should review flag?",
    "options": [
      "Restore the final norm: Pre-LN block outputs bypass normalization, so the accumulated residual stream reaches the head unnormalized.",
      "Keep it deleted: the identity residual highway requires unnormalized logits before softmax.",
      "Replace it with BatchNorm to stabilize single-token autoregressive decoding.",
      "Move every block to Post-LN because any final norm breaks the Pre-LN identity path."
    ],
    "answer": "Restore the final norm: Pre-LN block outputs bypass normalization, so the accumulated residual stream reaches the head unnormalized.",
    "explanation": "Pre-LN normalizes only sublayer inputs, leaving the residual stream to accumulate across all layers. Deleting the final norm feeds an unnormalized, depth-grown stream directly into the vocabulary projection."
  },
  {
    "question": "A preprocessing shift adds +10 to every feature of a token vector while gamma, beta, and eps stay fixed. Separately, an FP16 RMSNorm kernel computes (x * x).mean() in FP16 on [300.0, -300.0]. What happens in each case?",
    "options": [
      "LayerNorm is unchanged and RMSNorm shifts; FP16 squaring overflows 65,504 to inf unless cast to FP32 first.",
      "Both LayerNorm and RMSNorm are unchanged; FP16 squaring returns 300.0 cleanly.",
      "LayerNorm shifts and RMSNorm is unchanged; FP16 squaring overflows to inf.",
      "LayerNorm is unchanged and RMSNorm shifts; FP16 squaring underflows to 0.0."
    ],
    "answer": "LayerNorm is unchanged and RMSNorm shifts; FP16 squaring overflows 65,504 to inf unless cast to FP32 first.",
    "explanation": "LayerNorm subtracts the feature mean, canceling uniform offsets, whereas uncentered RMSNorm changes when a constant is added. In FP16, 300^2 = 90,000 exceeds 65,504 and overflows to inf unless cast to FP32 before squaring."
  },
  {
    "question": "A DeepNorm port initializes selected branch weights with gain beta = 0.5, and then multiplies the trained branch output G(x) by 0.5 again during every forward pass. Separately, a team removes residual normalization after adding QK-Norm. What should review flag?",
    "options": [
      "Remove the extra runtime beta factor (DeepNorm uses LN(alpha*x + G(x))), and keep residual norms alongside QK-Norm.",
      "Keep the runtime beta factor, and drop residual norms because QK-Norm bounds FFN writes too.",
      "Replace alpha with beta in the skip path, and move QK-Norm after attention softmax.",
      "Remove the extra runtime beta factor, and drop residual norms because bounded attention scores fix stream growth."
    ],
    "answer": "Remove the extra runtime beta factor (DeepNorm uses LN(alpha*x + G(x))), and keep residual norms alongside QK-Norm.",
    "explanation": "DeepNorm applies beta only to sublayer weight initialization while using alpha on the skip path during forward pass. QK-Norm controls query-key dot scale inside attention but does not regulate FFN writes or residual-stream scale."
  }
]
```

> **Next:** Continue to [Mixture of Experts Architecture](/learn/mixture-of-experts-architecture).
