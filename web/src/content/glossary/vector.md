---
title: Vector
importance: 94
---
A **vector** is an ordered list of numbers that lives in a fixed dimension $d$. In math it is an element of $\mathbb{R}^{d}$ (or another field). In code it is almost always a 1D array: shape `(d,)` in NumPy, a 1D [tensor](glossary://tensor) in PyTorch. Order is part of the meaning: index $i$ always means the same coordinate, whether that coordinate is a hand-written feature, a learned embedding component, a partial derivative, or one weight in a flattened parameter block.

The same object shows up under several names in LLM systems. A feature row like `[price, age_days, click_rate]` is a vector. A sentence [embedding](glossary://embedding) with $d = 768$ or $1536$ is a vector. The [gradient](glossary://gradient) of a loss w.r.t. a parameter block is a vector (or a tensor you can flatten into one). A 1D slice of a [matrix](glossary://matrix) (one row of an embedding table, one weight row of a linear layer) is a vector. Higher-rank tensors are stacks of these: a matrix is a grid of numbers; a batch of embeddings is a 2D table whose *rows* are vectors.

## Intuition

Give numbers an order and you get geometry. Two vectors of equal length can be added, scaled, dotted, and measured for distance. That geometry is what makes similarity, linear maps, and gradient steps computable:

| Role | What the coordinates mean | Typical $d$ |
| --- | --- | --- |
| Feature row | Human-defined attributes | tens to thousands |
| Token / sentence embedding | Learned latent dimensions | $256$–$4096$ |
| Hidden state at one position | Model width | $768$–$8192+$ |
| Gradient for a weight vector | $\partial L / \partial w_i$ per parameter | same as the parameters |
| Attention query or key | Projected subspace of the residual stream | head dim (often $64$–$128$) |

"Near" only makes sense once you pick a metric. Euclidean distance cares about length and direction. [Cosine similarity](glossary://cosine-similarity) cares only about direction. The raw [dot product](glossary://dot-product) mixes both. Match the metric to how the numbers were produced (especially for embeddings trained under cosine vs unnormalized IP).

A vector's coordinates get meaning from the encoder, feature pipeline, or loss that produced them. Preserve axis order, dtype, required L2 normalization, and model version. A mismatch can leave arithmetic running while rankings become noise.

## Formula

**Definition.** $v = (v_1, \ldots, v_d) \in \mathbb{R}^{d}$.

**Euclidean (L2) norm** (length from the origin; also written $\lVert v \rVert$):

$$
\lVert v \rVert_2 = \sqrt{\sum_{i=1}^{d} v_i^2} = \sqrt{v \cdot v}
$$

**L1 norm** (Manhattan length), used less often for embedding search but common in sparsity and some regularizers:

$$
\lVert v \rVert_1 = \sum_{i=1}^{d} |v_i|
$$

**Dot product** of equal-length $u, v$:

$$
u \cdot v = \sum_{i=1}^{d} u_i v_i = \lVert u \rVert_2 \lVert v \rVert_2 \cos\theta
$$

**Euclidean distance** (straight-line gap between points):

$$
\lVert u - v \rVert_2 = \sqrt{\sum_{i=1}^{d} (u_i - v_i)^2}
$$

**Unit vector / L2 normalization** (direction only; required when cosine must equal inner product):

$$
\hat{v} = \frac{v}{\lVert v \rVert_2} \quad (\lVert v \rVert_2 > 0), \qquad \lVert \hat{v} \rVert_2 = 1
$$

After both sides are unit, $\cos(u,v) = u \cdot v$ and squared Euclidean distance is monotone in cosine:

$$
\lVert \hat{u} - \hat{v} \rVert_2^2 = 2\big(1 - \hat{u}\cdot\hat{v}\big)
$$

**Storage size.** Raw memory for $N$ vectors of dimension $d$ in dtype with $b$ bytes per element:

$$
\mathrm{bytes} \approx N \cdot d \cdot b
$$

Example: $N = 2 \times 10^6$, $d = 1536$, float32 ($b = 4$) $\approx 12.3$ GB before index overhead.

## Worked numbers

Take $a = [3, 4]$ and $b = [4, 3]$:

$$
\lVert a \rVert_2 = 5, \quad \lVert b \rVert_2 = 5, \quad a \cdot b = 24, \quad \cos(a,b) = \frac{24}{25} = 0.96
$$

$$
\lVert a - b \rVert_2 = \sqrt{(3-4)^2 + (4-3)^2} = \sqrt{2} \approx 1.414
$$

Scale $a$ to $2a = [6, 8]$: $\lVert 2a \rVert_2 = 10$, cosine with $b$ is still $0.96$, but the raw dot product doubles to $48$ and Euclidean distance grows. That is the production trap when an index scores unnormalized IP while the model was trained for angular similarity.

Minimal check:

```python
import numpy as np

a = np.array([3.0, 4.0])
b = np.array([4.0, 3.0])
assert np.isclose(np.linalg.norm(a), 5.0)
assert np.isclose(a @ b, 24.0)
ua, ub = a / np.linalg.norm(a), b / np.linalg.norm(b)
assert np.isclose(ua @ ub, (a @ b) / (np.linalg.norm(a) * np.linalg.norm(b)))
```

In frameworks, prefer explicit shapes: `v.shape == (d,)` for one vector, `(B, d)` for a batch of row vectors. Broadcasting a length-mismatch bug into a silent outer product is a classic failure mode.

## Example

**Dense retrieval path.** A support query "How do I rotate an API key?" is encoded to $e_q \in \mathbb{R}^{768}$. Each doc chunk was previously encoded to $e_d \in \mathbb{R}^{768}$ with the same model and (if the training contract is cosine) L2-normalized at write time. Search ranks chunks by $e_q \cdot e_d$ (maximum inner product) or by cosine. A paraphrase like "Where can I reset credentials?" can rank above a keyword-heavy but off-topic page because the *vectors* are near in direction even when token overlap is low.

Production vector failures usually come from a mismatch in the **vector contract**:

| Failure | Symptom | Fix |
| --- | --- | --- |
| Dimension mismatch | Index insert or query errors; silent pad/truncate in loose code | Assert $d$ equals model output and index schema |
| Inconsistent normalization | Unnormalized corpus lengths can dominate dot-product ranking; with unit corpus vectors an unnormalized query preserves that query's ordering but changes score scale | Normalize both sides for cosine-equivalent scores and consistent thresholds, or use a metric that does it |
| Mixed model versions | Plausible neighbors that are wrong | Version model id with the index; re-embed on upgrade |
| Wrong axis / row vs column | Matmul shape errors or wrong scores | Name axes: batch, dim; keep embeddings as `(N, d)` rows |
| Dtype / NaN | Scores collapse; ANN builds weird graphs | Reject non-finite values; stick to float32 (or known quantized codes) |
| Feature order drift | Tabular model silently misreads columns | Schema-lock feature order the same way embedding models lock $d$ |

**Vectors beyond embeddings.** During training, $\nabla_w L$ is a vector in parameter space: each step $w \leftarrow w - \eta \nabla_w L$ moves along that direction. In a linear layer, each output channel is a weight vector dotted with the input. Attention scores are batches of query–key dots. The word "vector" is the shared shape; the *meaning* of each coordinate depends on which of those pipelines produced it.

## Why it matters here

Vectors are the atomic numeric object behind embeddings, dense retrieval, ANN indexes, gradients, feature rows, and almost every linear map inside a transformer. Curriculum work on cosine similarity, dot products, matrices, tensors, RAG, and vector databases all assumes you can read $v \in \mathbb{R}^{d}$ as geometry plus a production contract: fixed dimension, fixed coordinate order, known dtype, and a similarity metric that matches how the numbers were trained or engineered.

## Related terms

- [Embedding](glossary://embedding)
- [Cosine similarity](glossary://cosine-similarity)
- [Dot product](glossary://dot-product)
- [Matrix](glossary://matrix)
- [Tensor](glossary://tensor)
