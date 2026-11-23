---
title: Tensor
importance: 94
---
A **tensor** is a multidimensional array of numbers that frameworks treat as one object with a fixed [shape](glossary://tensor-shape), element type (**dtype**), and storage location (**device**). In deep learning code it is the universal container for inputs, weights, activations, gradients, masks, and [logits](glossary://logits). A scalar is a rank-0 tensor, a [vector](glossary://vector) is rank-1, a [matrix](glossary://matrix) is rank-2, and higher ranks stack batch, sequence, head, channel, or other axes on top of that geometry.

In machine learning, tensor usually refers to an array object; differential geometry uses the word for multilinear maps that obey transformation laws under coordinate change. Frameworks reuse the term because $N$-dimensional arrays store and multiply those components in practice. For a dense strided tensor, think **numeric grid + metadata (shape, dtype, device, layout) + optional autograd history**. Frameworks also support sparse and other layouts whose storage is not one dense grid.

## Intuition

Track three layers every time you hold a tensor:

1. **Meaning.** Each axis has a job: batch, token position, head, hidden width, vocabulary, height, channel, and so on.
2. **Layout.** Values live in a flat buffer. Shape and strides tell the runtime how to map an $N$-tuple index onto that buffer (same idea as a [NumPy array](glossary://numpy-array)).
3. **Execution.** Device and dtype decide *where* ops run and *how wide* each number is. Moving a tensor to a [GPU](glossary://gpu) preserves the intended operation, but changes bandwidth, kernel choice, and memory budget. Different floating-point kernels can produce different rounding results.

Name axes before you multiply. A legal shape product can still be wrong if you matmul "head" against "sequence" after a bad `permute`. Shape errors often come from axis meaning rather than arithmetic.

## Formula

**Rank and shape.** A tensor $X$ of rank (order) $r$ has shape $(d_0, d_1, \ldots, d_{r-1})$ and element count

$$
\mathrm{numel}(X) = \prod_{k=0}^{r-1} d_k.
$$

Common low ranks:

| Rank | Name | Typical set | Example shape |
| --- | --- | --- | --- |
| $0$ | scalar | $\mathbb{R}$ | $()$ |
| $1$ | vector | $\mathbb{R}^{d}$ | $(d,)$ |
| $2$ | matrix | $\mathbb{R}^{m \times n}$ | $(m, n)$ |
| $3$ | 3-tensor | $\mathbb{R}^{B \times T \times D}$ | batch $\times$ tokens $\times$ hidden |
| $4$ | 4-tensor | $\mathbb{R}^{B \times H \times T \times d}$ | batch $\times$ heads $\times$ tokens $\times$ head dim |

Here rank means the number of axes, not the algebraic rank of a matrix.

**Memory (bytes).** For a dense materialized tensor with homogeneous dtype of $b$ bytes per element (ignoring allocator padding and metadata):

$$
\mathrm{bytes}(X) \approx b \cdot \mathrm{numel}(X).
$$

Examples: FP32 $b=4$, FP16/BF16 $b=2$, INT8 $b=1$. A hidden state $X \in \mathbb{R}^{B \times T \times D}$ in BF16 costs about $2 B T D$ bytes of activation payload alone. Views can share storage, and an expanded broadcast view can have a large logical `numel` without allocating that many values; this formula is not incremental allocation accounting for such views or sparse tensors.

**Index into storage.** For C-contiguous (row-major) layout with element size $b$, strides in bytes are

$$
s_k = b \prod_{j=k+1}^{r-1} d_j,
$$

so the last axis is contiguous. A transpose can be a view that only swaps shape and strides; a forced `.contiguous()` materializes a new buffer when a kernel needs dense layout.

**Broadcasting (framework rule, NumPy/PyTorch-compatible).** Align shapes from the trailing axis leftward. Two axes are compatible if they are equal, or one of them is $1$, or one tensor is missing that leading axis. Use the equal size, or the non-singleton size when one side is $1$; this matters for empty axes, where $0$ and $1$ broadcast to $0$, not $1$. Broadcasting does not invent new semantics: it reuses values along size-$1$ axes (often via zero stride), which is why a silent broadcast can hide a missing dimension.

## How it works

In [PyTorch](glossary://pytorch) (and similar frameworks), a tensor is more than the array of values:

| Attribute | What it answers |
| --- | --- |
| `shape` / `size` | Length of each axis |
| `dtype` | Encoding of each element (`float32`, `bfloat16`, `int64`, …) |
| `device` | Where storage lives (`cpu`, `cuda:0`, …) |
| `layout` / strides | How indices map into the buffer (dense strided vs sparse layouts) |
| `requires_grad` | Whether autograd should record ops for reverse-mode differentiation |
| `grad` | Accumulated gradient after `backward` (same shape as the tensor, when present) |

Typical life cycle in an LLM forward pass:

1. **IDs.** Integer token tensor, often `int64`, shape $[B, T]$.
2. **Embedding lookup.** Table $E \in \mathbb{R}^{|V| \times D}$ gathers rows into activations $X \in \mathbb{R}^{B \times T \times D}$.
3. **Linear maps and attention.** Reshape/transpose into multi-head layouts such as $[B, H, T, d_k]$, run matmuls, mask, softmax, project back.
4. **Logits.** Final projection to $[B, T, |V|]$ (or $[B, |V|]$ for last-token only).
5. **Loss / sampling.** Cross-entropy or decode step consumes those scores.

Weights are tensors too. So are the KV cache, attention masks, position ids, and optimizer moments. Many training or serving bugs that "look like the model is weird" start with a tensor contract bug: wrong axis, wrong dtype, wrong device, or wrong contiguity.


## Example

**Language-model batch.** Batch size $B=2$, sequence length $T=4$, hidden size $D=8$, vocabulary $|V|=16$:

```python
import torch

B, T, D, V = 2, 4, 8, 16
device = "cpu"

# discrete inputs
input_ids = torch.randint(0, V, (B, T), device=device)  # [2, 4], int64
assert input_ids.shape == (B, T)

# toy embedding table and lookup
E = torch.randn(V, D, device=device, dtype=torch.float32)  # [16, 8]
x = E[input_ids]  # advanced indexing: [2, 4, 8]
assert x.shape == (B, T, D)

# linear projection to logits (row-batch convention)
W = torch.randn(D, V, device=device)  # [8, 16]
logits = x @ W  # [2, 4, 16]
assert logits.shape == (B, T, V)

# memory habit: payload bytes for one activation tensor
bytes_x = x.numel() * x.element_size()  # 2*4*8*4 = 256
assert bytes_x == 256
```

**Multi-head layout.** For $H=2$ heads and head dim $d_k = D // H = 4$, a common reshape is

$$
X \in \mathbb{R}^{B \times T \times D}
\;\xrightarrow{\text{view / reshape}}\;
\mathbb{R}^{B \times T \times H \times d_k}
\;\xrightarrow{\text{transpose}}\;
\mathbb{R}^{B \times H \times T \times d_k}.
$$

Attention then does batched matmuls on the last two axes while batch and head ride along. If you transpose the wrong pair of axes, `matmul` may still run (or fail loudly) and the model quietly attends over the wrong geometry.

**Image batch (channel convention).** NCHW vs NHWC is the same idea with different axis order:

- NCHW: `[batch, channels, height, width]` e.g. `[32, 3, 224, 224]`
- NHWC: `[batch, height, width, channels]` e.g. `[32, 224, 224, 3]`

Same pixels, different stride contracts. Kernels and exported models often hard-require one layout.

## Worked numbers

Activation payload for a single transformer layer hidden state at $B=8$, $T=2048$, $D=4096$ in BF16 ($b=2$):

$$
\mathrm{bytes} = 2 \cdot 8 \cdot 2048 \cdot 4096 = 134{,}217{,}728 \approx 128\ \mathrm{MiB}.
$$

That is one tensor. Training keeps many activations for backward; inference keeps the KV cache across layers and tokens. Multiplying by layer count and by cache structure is how "why did we OOM?" becomes arithmetic instead of mystery.

Weight table for an embedding matrix $|V|=50{,}000$, $D=4096$, FP16:

$$
\mathrm{bytes}(E) = 2 \cdot 50{,}000 \cdot 4096 = 409{,}600{,}000 \approx 391\ \mathrm{MiB}.
$$

## Debug path

When a tensor op misbehaves, check in this order:

1. **Shape and axis names.** Print `tuple(x.shape)` at module boundaries. Assert contracts like `assert h.shape == (B, T, D)`. Prefer named dims in comments and tests over guessing from rank alone.
2. **Broadcast honesty.** If an op succeeded "for free," confirm you meant size-$1$ expansion. Loss code is a common trap: targets shaped `(B, 1)` against logits `(B, C)` can mask a wrong reduction axis.
3. **Device.** Most tensor operations require operands on the same device (with operation-specific exceptions, such as some CPU scalar tensors). `Expected all tensors to be on the same device` is the honest failure; silent host/device copies in a hot path are the slow failure.
4. **Dtype.** Integer ids must not accidentally cast to float before embedding gather. Mixed precision wants matmuls in FP16/BF16 while sensitive reductions often stay wider. Compare `x.dtype` at cast boundaries.
5. **Contiguity.** After `transpose` / `permute`, some kernels require `.contiguous()`. A view-vs-copy surprise also shows up when you mutate a slice and another tensor sharing storage changes with it.
6. **Grad / inference mode.** Training tensors may need `requires_grad`; serving should avoid building graphs. In-place ops (`add_`, …) can break autograd history.

Production symptoms that are usually tensor contracts first:

- **OOM on HBM** after a batch or context increase: `numel * bytes` crossed the free-memory line (activations, weights, or KV cache).
- **Shape-legal, semantics-wrong:** loss is "a bit off," generation is nonsense, because a permute swapped head and time without updating the matmul.
- **Layout / export mismatch:** ONNX or TensorRT expects NCHW while the training stack emitted NHWC (or the reverse).
- **Silent host fallback or per-step `.cpu()` / `.numpy()`** in a request path: correct numbers, catastrophic latency.

## Why it matters here

Every LLM curriculum topic bottoms out in tensors: attention scores, residual streams, embedding tables, [logits](glossary://logits), gradients, and sharded weights under [tensor parallelism](glossary://tensor-parallelism). Frameworks abstract kernels, but they do not invent meaning for axes. Engineers who can state shape, dtype, device, and bytes for the tensors on a critical path can debug training and serving failures before they blame the optimizer, the dataset, or the GPU.

## Related terms

- [Tensor shape](glossary://tensor-shape)
- [Matrix](glossary://matrix)
- [Vector](glossary://vector)
- [NumPy array](glossary://numpy-array)
- [PyTorch](glossary://pytorch)
