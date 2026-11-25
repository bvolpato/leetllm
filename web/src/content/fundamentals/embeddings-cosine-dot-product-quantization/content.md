---
{
  "id": "embeddings-cosine-dot-product-quantization",
  "slug": "embeddings-cosine-dot-product-quantization",
  "title": "Embedding Similarity & Quantization",
  "shortDescription": "Master cosine vs dot vs L2 geometry, dimensionality reduction with Matryoshka prefixes, PCA, and Johnson-Lindenstrauss projections, the 2D-map trap, and INT8/binary quantization.",
  "difficulty": "Medium",
  "category": "Embeddings & Vector Search",
  "section": "Applied LLM Engineering & RAG",
  "coverImage": "social_banner.png",
  "companies": [
    "Pinecone",
    "Weaviate",
    "Google",
    "OpenAI",
    "Cohere",
    "Anthropic"
  ],
  "prerequisites": [
    "sentence-embeddings-contrastive-learning"
  ],
  "order": 11,
  "keyConceptsTested": [
    "Cosine Similarity",
    "Dot Product",
    "Euclidean Distance",
    "Matryoshka Representation Learning",
    "Principal Component Analysis (PCA)",
    "Johnson-Lindenstrauss Random Projection",
    "t-SNE and UMAP 2D Distortion",
    "Scalar Quantization (SQ8)",
    "Binary Quantization & Hamming Distance"
  ],
  "aliases": [
    "dimensionality-reduction-embeddings"
  ]
}
---

A developer asks, "How does FlashAttention fuse softmax into tiled SRAM passes?" Your retriever embeds that query and scans stored passages. One similarity rule puts `flash-attention-v2` first; another favors a longer embedding from a draft note; compressing vectors to fit RAM shuffles the shortlist again. Separating similarity geometry from dimensionality reduction and quantization isolates which step changed the rank.

[Sentence embeddings](/learn/sentence-embeddings-contrastive-learning) showed how contrastive training organizes meaning in vector space. Here the encoder stays fixed while we dissect searching it at scale: similarity metrics, Matryoshka prefixes, <span data-glossary="pca">PCA</span>, Johnson-Lindenstrauss projections, the 2D-map trap, and INT8/1-bit quantization.

## Three ways to measure closeness

An <span data-glossary="embedding">embedding</span> maps text to a vector in $\mathbb{R}^d$. Three rulers answer different versions of "how close are two vectors?"

| Ruler | Formula | Range | Sensitive to positive length scaling? |
|:------|:--------|:------|:--------------------------------------|
| <span data-glossary="cosine-similarity">Cosine similarity</span> | $\frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$ | $[-1, 1]$ | No |
| <span data-glossary="dot-product">Dot product</span> | $\sum_{i=1}^d a_i b_i$ | $(-\infty, +\infty)$ | Yes |
| Euclidean (L2) distance | $\|\mathbf{A} - \mathbf{B}\|_2$ | $[0, +\infty)$ | Yes |

Check `flash-attention-v2` at $\mathbf{A} = [3, 4]$ and `tiled-softmax-notes` at $\mathbf{B} = [4, 3]$. Both have norm `5`: dot product is `24`, cosine is `24 / 25 = 0.96`, and L2 distance is $\sqrt{2} \approx 1.41$. Stretching $\mathbf{A}$ tenfold to `[30, 40]` multiplies dot product tenfold to `240` and expands L2 distance, while cosine stays locked at `0.96`.

<figure>
  <img src="illustrations/_generated/cosine_vs_dot_dark.png" alt="Top panels plot equal-length vectors A = (3, 4) and B = (4, 3) with norm 5, dot product 24, cosine 0.96, and Euclidean distance 1.414. Bottom AxisPlot scales A by k from 1 to 10: normalized dot product rises linearly to 10x while normalized cosine stays flat at 1.0." />
  <figcaption>Top: equal-length vectors <code>A = (3, 4)</code> and <code>B = (4, 3)</code> have cosine 0.96 and dot product 24. Bottom: scaling <code>A</code> by <code>k</code> keeps cosine flat at 1.0x while dot product climbs linearly to 10x.</figcaption>
</figure>

### When all three rulers agree

When every stored vector and query is L2-normalized ($\|\mathbf{A}\|_2 = \|\mathbf{B}\|_2 = 1$), cosine equals dot product and squared L2 is a strictly decreasing linear function of it:

$$
\cos(\mathbf{A}, \mathbf{B}) = \mathbf{A} \cdot \mathbf{B} = 1 - \frac{\|\mathbf{A} - \mathbf{B}\|_2^2}{2}
$$

On the unit hypersphere, descending cosine, descending dot product, and ascending squared L2 induce the **exact same ranking**. Normalize rows once at ingestion and queries once at search time, then score with a fast inner-product <span data-glossary="matrix">matrix</span> multiply.[^faissMetrics2026] Reject zero vectors explicitly, and rescale by `max(abs(v))` before dividing by the norm so tiny nonzero values like `1e-308` do not underflow to zero. Use raw dot product only for maximum inner product search (MIPS) models trained to store learned priors in magnitude.

<!-- leetllm: test, output=show, deps=numpy, id=vector-normalization -->
```python title="metric-equivalence-and-norm-trap.py"
import numpy as np


def l2_normalize(v: np.ndarray) -> np.ndarray:
    arr = np.asarray(v, dtype=np.float64)
    scale = float(np.max(np.abs(arr)))
    if scale == 0.0 or not np.all(np.isfinite(arr)):
        raise ValueError("need a finite nonzero vector")
    scaled = arr / scale
    return scaled / np.linalg.norm(scaled)


labels = ["flash-attention-v2", "linear-attn-draft", "rope-encoding"]
docs = np.array([[0.95, 0.05], [8.00, 6.00], [0.20, 0.90]])
query = np.array([1.0, 0.0])

unit_docs = np.vstack([l2_normalize(r) for r in docs])
unit_q = l2_normalize(query)
unit_dot = unit_docs @ unit_q
sq_l2 = np.sum((unit_docs - unit_q) ** 2, axis=1)

print("raw dot winner:", labels[int(np.argmax(docs @ query))], "| unit winner:", labels[int(np.argmax(unit_dot))])
print("unit dot == 1 - L2^2/2:", np.allclose(unit_dot, 1.0 - sq_l2 / 2.0))
assert np.allclose(sq_l2, 2.0 - 2.0 * unit_dot, atol=1e-12)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw dot winner: linear-attn-draft | unit winner: flash-attention-v2
unit dot == 1 - L2^2/2: True
```
<!-- leetllm: output:end -->

## Shrinking dimensions: Matryoshka, PCA, and random projection

Every float32 coordinate costs 4 bytes and one multiply-add per candidate ($O(d)$ work). One million 1,536-dimensional FP32 vectors already take **5.72 GiB** (`6.14 GB`) before graph links or metadata. Three linear methods cut $d$ before quantization starts.

### Matryoshka prefixes (MRL)

<span data-glossary="matryoshka-representation-learning">Matryoshka Representation Learning (MRL)</span> trains an encoder with nested losses at multiple prefix widths $d \in \mathcal{D}$, packing broad semantics into leading coordinates so you can slice a vector to 256 or 512 dimensions on demand.[^kusupati2022][^openai2024_embeddings] Always **re-normalize** sliced prefixes for both documents and queries. Renormalization restores unit norm, yet it cannot recover distinctions stored only in truncated tail coordinates:

<figure>
  <img src="illustrations/_generated/matryoshka_dimensions_dark.png" alt="Grid lists query [1, 0, 0, 1] and three 4d vectors: flash-attention [1, 0, 0, 1] with 2d cos 1.00 and 4d cos 1.00, sparse-attention [1, 0, 1, 0] with 2d cos 1.00 and 4d cos 0.50, and rope-encoding [0, 1, 0, 1] with 2d cos 0.00 and 4d cos 0.50. An AxisPlot shows the first two dimensions collapsing flash-attention and sparse-attention onto (1, 0), and a ProgressList compares full 4d cosine separation." />
  <figcaption>Keeping only head coordinates collapses <code>flash-attn</code> and <code>sparse-attn</code> onto prefix ray <code>(1, 0)</code> at cosine 1.00. Returning a shortlist <code>K &gt; 1</code> lets full 4d rescoring separate <code>flash-attn</code> (1.00) from <code>sparse-attn</code> (0.50).</figcaption>
</figure>

### PCA: learn a shorter linear basis

When an encoder lacks MRL training, **Principal Component Analysis (PCA)** learns an orthogonal rotation aligned with the corpus's top variance directions. Subtract column means $\mu = \frac{1}{N}\mathbf{1}^T X$ to get $X_c = X - \mu$ and take its thin <span data-glossary="svd">SVD</span> (avoiding $X_c^T X_c$, which squares the condition number):[^trefethen1997][^sklearn2026pca]

$$
X_c = U \Sigma V^T, \qquad C = \frac{1}{N - 1} V \Sigma^2 V^T
$$

Project every document and live query through the same persisted basis $z = (x - \mu) V_k$, then L2-normalize before cosine search. Watch the central pitfall: **explained variance is not search relevance.** High-variance axes often track length or prose-vs-code formatting while fine retrieval distinctions sit in lower-variance components. Always pick $k$ from held-out Recall@K, not a fixed variance cutoff:

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=vector-normalization, id=prefix-pca -->
```python title="prefix-and-pca-recall-sweep.py"
from sklearn.decomposition import PCA

# 1. MRL prefix slicing loses tail distinctions until full-width rescoring.
mrl_docs = np.array([[1.0, 0.0, 1.0, 0.0], [1.0, 0.0, 0.0, 1.0], [0.0, 1.0, 0.0, 1.0]])
mrl_q = np.array([1.0, 0.0, 0.0, 1.0])
mrl_names = ["sparse-attn", "flash-attn", "rope-enc"]
pick = lambda w: mrl_names[int(np.argmax(np.vstack([l2_normalize(r[:w]) for r in mrl_docs]) @ l2_normalize(mrl_q[:w])))]
print(f"MRL 4d winner={pick(4)} | 2d prefix tie winner={pick(2)}")

# 2. PCA sweep: Recall@3 hits 1.000 at k=8 with only 0.715 explained variance.
rng = np.random.default_rng(21)
norm_rows = lambda x: x / np.linalg.norm(x, axis=1, keepdims=True)
topics = norm_rows(rng.normal(0, 1, size=(20, 24)))
docs = np.vstack([t + rng.normal(0, 0.11, size=(3, 24)) for t in topics])
queries = np.vstack([t + rng.normal(0, 0.03, size=(1, 24)) for t in topics])
relevant = [set(range(3 * i, 3 * i + 3)) for i in range(20)]


def recall3(q: np.ndarray, d: np.ndarray) -> float:
    topk = np.argsort(-(norm_rows(q) @ norm_rows(d).T), axis=1, kind="stable")[:, :3]
    return float(np.mean([len(rel & set(row)) / 3 for rel, row in zip(relevant, topk)]))


for k in [2, 4, 8, 12]:
    pca = PCA(n_components=k).fit(docs)
    print(f"PCA k={k:>2}: recall@3={recall3(pca.transform(queries), pca.transform(docs)):.3f}, var={pca.explained_variance_ratio_.sum():.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
MRL 4d winner=flash-attn | 2d prefix tie winner=sparse-attn
PCA k= 2: recall@3=0.433, var=0.264
PCA k= 4: recall@3=0.900, var=0.452
PCA k= 8: recall@3=1.000, var=0.716
PCA k=12: recall@3=1.000, var=0.867
```
<!-- leetllm: output:end -->

### Johnson-Lindenstrauss random projection

When streaming corpora shift continuously and refitting PCA across replicas is impractical, **random projection** multiplies every vector by one fixed zero-mean matrix $R \in \mathbb{R}^{d \times k}$ (Gaussian $R_{ij} \sim \mathcal{N}(0, 1/k)$ or sparse Achlioptas entries $\{-\sqrt{3/k}, 0, +\sqrt{3/k}\}$ with probabilities $\{1/6, 2/3, 1/6\}$).[^sklearn2026RandomProjection]

The <span data-glossary="johnson-lindenstrauss-lemma">Johnson-Lindenstrauss (JL) lemma</span> proves that for any $N \ge 2$ points and distortion $0 < \epsilon < 1$, a linear map $R$ exists keeping all pairwise squared Euclidean distances inside $(1 \pm \epsilon)$ whenever:[^johnson1984][^dasgupta2003Jl]

$$
k \ge \frac{4 \ln N}{\epsilon^2 / 2 - \epsilon^3 / 3}, \qquad (1 - \epsilon)\|u - v\|^2 \le \|uR - vR\|^2 \le (1 + \epsilon)\|u - v\|^2
$$

Crucially, $k$ scales only as $\mathcal{O}(\ln N / \epsilon^2)$, independent of ambient dimension $d$. Yet the worst-case bound is conservative: at $N = 10^7$ and $\epsilon = 0.15$, it asks for $k \ge 6{,}368$ (over 4x wider than $d = 1{,}536$), and overlapping $(1 \pm \epsilon)$ intervals can still swap close neighbors. Low-rank real embeddings often tolerate $k = 256$, while isotropic unstructured vectors drop sharply:

<!-- leetllm: test, output=show, deps=numpy,scikit-learn -->
```python title="jl-budget-and-projection.py"
import numpy as np
from sklearn.random_projection import GaussianRandomProjection

for eps in [0.15, 0.25, 0.50]:
    k_min = int(np.ceil(4 * np.log(10_000_000) / (eps**2 / 2 - eps**3 / 3)))
    print(f"JL bound (N=10M, eps={eps:.2f}): k >= {k_min}")

rng = np.random.default_rng(33)
docs = rng.normal(0, 1, size=(180, 48))
queries = docs[:12] + rng.normal(0, 0.03, size=(12, 48))
top5 = lambda q, d: np.argsort(-((q / np.linalg.norm(q, axis=1, keepdims=True)) @ (d / np.linalg.norm(d, axis=1, keepdims=True)).T), axis=1, kind="stable")[:, :5]

rp = GaussianRandomProjection(n_components=16, random_state=0).fit(docs)
overlap = np.mean([len(set(g) & set(p)) / 5 for g, p in zip(top5(queries, docs), top5(rp.transform(queries), rp.transform(docs)))])
print(f"48d -> 16d isotropic Gaussian RP top-5 cosine overlap: {overlap:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
JL bound (N=10M, eps=0.15): k >= 6368
JL bound (N=10M, eps=0.25): k >= 2476
JL bound (N=10M, eps=0.50): k >= 774
48d -> 16d isotropic Gaussian RP top-5 cosine overlap: 0.367
```
<!-- leetllm: output:end -->

Persist `rp.components_` beside the index so every serving replica applies the identical transform.

## The 2D-map trap: t-SNE and UMAP

Linear projections compress vectors for search. Nonlinear 2D maps do a completely different job: exploratory visual debugging to spot drift or anomalies before checking the original high-dimensional vectors.

Projecting hundreds of orthogonal axes onto a 2D plane triggers the **crowding problem**: volume grows exponentially with dimension, so moderate high-dimensional distances cannot all fit on a flat sheet. Two standard nonlinear methods trade global geometry to preserve local neighborhoods:

- **<span data-glossary="t-sne">t-SNE</span>** converts high-dimensional distances into Gaussian neighbor probabilities $p_{ij}$ (tuned via `perplexity`), uses a heavy-tailed Student-$t$ (Cauchy) kernel $q_{ij} \propto (1 + \|y_i - y_j\|^2)^{-1}$ in 2D to relieve crowding, and minimizes <span data-glossary="kl-divergence">KL divergence</span> $D_{\text{KL}}(P \parallel Q)$.[^maaten2008] Classic t-SNE cannot project unseen live queries.
- **<span data-glossary="umap">UMAP</span>** builds a local $k$-NN graph with fuzzy union edge weights $p_{ij} = p_{j|i} + p_{i|j} - p_{j|i} p_{i|j}$ and optimizes 2D weights via stochastic fuzzy <span data-glossary="cross-entropy">cross-entropy</span> (balancing attraction against negative-sampled repulsion).[^mcinnes2018][^damrich2021UmapLoss]

> **Common mistake:** Reading 2D t-SNE or UMAP cluster sizes, inter-cluster gaps, or crisp islands as true high-dimensional geometry, or indexing 2D coordinates for retrieval. Nonlinear maps distort global distances and shift with seed, `perplexity`, or `min_dist`.

Always measure **nearest-neighbor overlap** (the fraction of points keeping their exact high-dimensional nearest neighbor in 2D) and confirm visual patterns directly in the full embedding space.

| Goal | Primary metric | Best methods |
|------|----------------|--------------|
| Inspect clusters or drift | 1-NN / $k$-NN overlap + manual inspection | PCA, t-SNE, UMAP (plots only) |
| Shrink dimensions for serving | Recall@K, RAM, latency | MRL prefix, PCA, random projection |
| Shrink bytes per coordinate | Compressed Recall@K + rescored accuracy | SQ8, binary (1-bit), PQ |

## Memory sizing and scalar quantization (SQ8)

When shrinking $d$ still overflows RAM, **quantization** cuts bytes per coordinate. Raw coordinate payload for 1,536-dimensional vectors (before graph links, metadata, or retained FP32 copies):

| Representation | Per vector | 1M vectors | 100M vectors | Raw cut |
|:---------------|:----------:|:----------:|:------------:|:-------:|
| FP32 (4 B/dim) | 6,144 B | 5.72 GiB | 572 GiB | 1x |
| INT8 SQ (1 B/dim) | 1,536 B | 1.43 GiB | 143 GiB | 4x |
| Binary (1 bit/dim) | 192 B | 183.1 MiB | 17.9 GiB | 32x |
| PQ-96 (96 one-byte IDs) | 96 B | 91.6 MiB | 8.94 GiB | 64x (+1.5 MiB codebooks) |

<figure>
  <img src="illustrations/_generated/payload_bytes_dark.png" alt="AxisPlot tracks compression ratio from 1x at 32 bits per dimension (FP32) to 4x at INT8, 32x at binary 1-bit, and 64x at PQ-96. Below a downward FlowArrow, a ProgressList reports exact 1,536d per-vector sizes and 1M-vector RAM: 6,144 bytes (5.72 GiB), 1,536 bytes (1.43 GiB), 192 bytes (183.1 MiB), and 96 bytes (91.6 MiB)." />
  <figcaption>Compression ratio climbs 64x from FP32 to 96-subspace PQ across one million 1,536d rows. Shared codebooks, graph links, metadata, and optional full-precision rescore copies add to total RAM.</figcaption>
</figure>

**Scalar quantization (SQ8)** maps each float32 coordinate to one byte (4x payload cut). Symmetric signed INT8 calibrates $s_j = \max(|x_j|) / 127$ per dimension:

$$
x_{q, j} = \operatorname{clip}\!\left(\operatorname{round}\!\left(\frac{x_j}{s_j}\right), -127, 127\right), \qquad \hat{x}_j = s_j x_{q, j}
$$

Range-offset codecs (such as Qdrant's `uint8`) instead map calibrated intervals $[a, b]$ to `0..255` via $s = (b - a)/255$, $\hat{x} = a + s c$.[^sbertEmbeddingQuantization2026][^qdrant2024] Freeze calibration ranges once across ingestion and serving, and watch three bugs that wreck SQ8 recall:

1. **Dropping per-dimension scales:** Scoring unscaled integer codes lets narrow-range dimensions overpower wide-range ones and reverses rank.
2. **Narrow `int8` overflow:** In NumPy, `int8 @ int8` wraps in 8 bits; widen operands to `int32` *before* multiplying.[^numpyMatmul2026]
3. **Outlier-stretched ranges:** One outlier at `25.0` stretches step width to `0.197`, crushing ordinary coordinates in `[-1, 1]`. Quantile clipping (e.g., 99.9th percentile) shrinks ordinary MAE 25x while saturating the rare outlier.

<figure>
  <img src="illustrations/_generated/scalar_calibration_dark.png" alt="AxisPlot over [-1, 1] shows how signed INT8 calibration with bound 25 creates coarse 0.197 quantization steps compared with clipped bound 1 at step 0.0079 closely tracking y = x. A ProgressList reports ordinary-range mean absolute error dropping from 0.0483 to 0.0019 (25x finer), while clipping saturates the single outlier 25 at 1.00." />
  <figcaption>Calibrating signed INT8 to <code>max(|v|) = 25</code> stretches steps to 0.197 across <code>[-1, 1]</code>. Clipping to bound 1 shrinks ordinary MAE 25x (0.0483 to 0.0019) while saturating the outlier at 1.00.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy -->
```python title="sq8-scales-overflow-and-outliers.py"
import numpy as np

# 1. Per-dimension scales preserve dot order.
scales = np.array([10.0, 1.0], dtype=np.float32) / 127.0
db = np.array([[8.0, 0.0], [0.0, 1.0]], dtype=np.float32)
q = np.array([1.0, 1.0], dtype=np.float32)
codes = np.clip(np.rint(db / scales), -127, 127).astype(np.int8)
print("unscaled winner:", int(np.argmax(codes.astype(np.float32) @ q)), "| scaled winner:", int(np.argmax((codes.astype(np.float32) * scales) @ q)))

# 2. Narrow INT8 matmul wraps; widen to INT32 before multiplying.
q8, d8 = np.array([127, 127], dtype=np.int8), np.array([[127, 127], [126, 126]], dtype=np.int8)
wrapped, wide = d8 @ q8, d8.astype(np.int32) @ q8.astype(np.int32)
print(f"INT8 wrap={wrapped.tolist()} | INT32={wide.tolist()}")

# 3. Quantile clipping cuts ordinary MAE 25x.
ordinary = np.linspace(-1.0, 1.0, 101)
quant = lambda v, b: np.clip(np.rint(v / (b / 127.0)), -127, 127) * (b / 127.0)
print(f"MAE bound=25: {np.mean(np.abs(ordinary - quant(ordinary, 25.0))):.4f} | bound=1: {np.mean(np.abs(ordinary - quant(ordinary, 1.0))):.4f}")
assert int(wide.argmax()) == 0 and int(wrapped.argmax()) == 1
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unscaled winner: 1 | scaled winner: 0
INT8 wrap=[2, 4] | INT32=[32258, 32004]
MAE bound=25: 0.0483 | bound=1: 0.0019
```
<!-- leetllm: output:end -->

> **Common mistake:** Multiplying `int8` embedding arrays directly with `documents @ query` in NumPy. Narrow 8-bit accumulation wraps `[32258, 32004]` to `[2, 4]` and flips the winner; widen to `int32` first.

## Binary quantization and coarse-to-fine rescoring

**Binary quantization (BQ)** keeps only each coordinate's sign bit (`1` if $x_j > 0$, else `0`), cutting payload **32x** relative to FP32. Packed into machine words, two binary codes compare via bitwise XOR and CPU popcount (`AVX-512 VPOPCNTDQ` processes 512 bits per instruction), computing Hamming distance with zero floating-point math.

For $b$ isotropic random hyperplanes, expected normalized Hamming distance matches vector angle:[^charikar2002Hyperplanes]

$$
\mathbb{E}_{\text{random hyperplanes}}\!\left[\frac{D_H(h(\mathbf{u}), h(\mathbf{v}))}{b}\right] = \frac{\theta}{\pi} = \frac{\arccos(\cos(\mathbf{u}, \mathbf{v}))}{\pi}
$$

Raw coordinate signs are **not** random hyperplanes, however: nearly orthogonal vectors `[1.0, 0.01, -1.0, -0.01]` and `[0.01, 1.0, -0.01, -1.0]` (`cosine = 0.020`) share identical sign bits and tie at Hamming `0`. Pair binary codes (best on high-dimensional, centered embeddings, or 1.5/2-bit rotated variants)[^qdrant2024] with a **coarse-to-fine funnel**: (1) scan 1-bit codes for a generous top-$K$ shortlist while evaluating metadata filters **inline** so disqualified rows never crowd out valid hits, (2) rescore those $K$ survivors with retained FP32 or SQ8 vectors, and (3) optionally rerank the top shortlist with a cross-encoder.

<figure>
  <img src="illustrations/_generated/hamming_vs_precise_dark.png" alt="Grid compares query q = [0.8, -0.4, 0.6, -0.2] (sign bits [1, 0, 1, 0]) against three candidates: linear-attention-draft and flash-attention-v2 tie at Hamming distance 0 even though exact cosines differ (0.410 vs 1.000), while adamw-decay has Hamming distance 2 and cosine -0.435. Below a FlowArrow, ProgressList and summary Grid show top-2 binary shortlisting plus exact rescoring recovering flash-attention-v2." />
  <figcaption>Both <code>linear-attn-draft</code> and <code>flash-attention-v2</code> tie at Hamming 0 against the query even though exact cosines are 0.410 vs 1.000. Shortlisting <code>K = 2</code> plus FP32 rescoring (or inline metadata filtering) recovers <code>flash-attention-v2</code>.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, continue=prefix-pca -->
```python title="binary-pack-shortlist-and-rescore.py"
labels = ["linear-attn-draft", "flash-attention-v2", "adamw-decay"]
verified = np.array([False, True, True])
docs = np.array([[0.05, -2.00, 0.05, -2.00], [0.78, -0.38, 0.58, -0.22], [0.10, 0.60, -0.40, -0.20]])
query = np.array([0.80, -0.40, 0.60, -0.20])

pack = lambda v: int.from_bytes(np.packbits((v > 0).astype(np.uint8), bitorder="little").tobytes(), "little")
q_code = pack(query)
hamming = [(pack(row) ^ q_code).bit_count() for row in docs]
unit_q = l2_normalize(query)

pick_top = lambda ids: max([i for i in ids if verified[i]], key=lambda i: float(np.dot(l2_normalize(docs[i]), unit_q)), default=None)
k1 = sorted(range(3), key=lambda i: (hamming[i], i))[:1]
k2 = sorted(range(3), key=lambda i: (hamming[i], i))[:2]
prefilter_k1 = sorted([i for i in range(3) if verified[i]], key=lambda i: (hamming[i], i))[:1]

print("hamming:", hamming, "| post-filter K=1:", pick_top(k1))
print("rescore K=2:", labels[pick_top(k2)], "| pre-filter K=1:", labels[pick_top(prefilter_k1)])
assert pick_top(k1) is None and labels[pick_top(k2)] == "flash-attention-v2"
```

<!-- leetllm: output:start -->
```text title="Output" output compact
hamming: [0, 0, 2] | post-filter K=1: None
rescore K=2: flash-attention-v2 | pre-filter K=1: flash-attention-v2
```
<!-- leetllm: output:end -->

Rescoring only reorders shortlisted survivors; it cannot recover a document missed in stage one.

## Product quantization and HNSW indexes

Quantization shrinks bytes per vector, while approximate nearest neighbor (ANN) indexes reduce how many vectors each query visits. When SQ8 still exceeds RAM, **Product Quantization (PQ)** splits each vector into $M$ subvectors, clusters each subspace into $K$ centroids offline (storing one byte ID per subspace for 32x–64x cuts), and scores unquantized queries via **Asymmetric Distance Computation (ADC)** lookup tables without decompressing database rows.[^jegou2011] Production engines combine those codes with multi-layer **HNSW** graphs or inverted-file partitions (**IVF**), where graph links often rival the compressed code payload in RAM.[^malkov2018] Continue to [Vector Database Internals: HNSW & IVF](/learn/vector-database-internals-hnsw-ivf) for full PQ/ADC math, IVF residuals, OPQ rotations, and HNSW construction and search tuning (`M`, `ef_construction`, `ef_search`).

<figure>
  <img src="illustrations/_generated/product_quantization_flow_dark.png" alt="Grid splits 8-dimensional embeddings into four 2d subspaces for two documents: FlashAttention stores centroid code [1, 1, 1, 1] and LayerNorm stores [0, 0, 0, 0]. Below a downward FlowArrow, a 2x4 Heatmap displays the asymmetric distance lookup table between unquantized query subvectors and centroid IDs 0 and 1, giving total squared distance 0.08 vs 56.57." />
  <figcaption>PQ stores compact subspace centroid IDs and scores unquantized queries via a small per-query lookup table; see <a href="/learn/vector-database-internals-hnsw-ivf">Vector Database Internals: HNSW &amp; IVF</a> for full PQ/ADC and HNSW internals.</figcaption>
</figure>

## Common pitfalls

- **Metric mismatch:** Scoring unnormalized vectors with dot product lets long rows beat closer angles. Store model ID, width, normalization rule, and codec settings in one versioned index header.
- **Tuning PCA by variance alone:** High variance can live on formatting axes; pick $k$ by held-out Recall@K.
- **Trusting 2D maps:** t-SNE and UMAP distort global distances; verify patterns with neighbor overlap in full space.
- **SQ8 scale and overflow bugs:** Include per-dimension scales, widen `int8` to `int32` before multiplying, and clip outliers with quantiles.
- **Post-filter starvation:** Apply selective metadata predicates inline during ANN or binary search rather than after taking a narrow top-$K$.

```mastery-quiz
[
  {
    "question": "Query is [0, 2]; document A is [3, 4] and document B is [0, 3]. Which winners do raw dot product and cosine select?",
    "options": [
      "Raw dot selects A; cosine selects B.",
      "Raw dot selects B; cosine selects A.",
      "Raw dot selects A; cosine selects A.",
      "Raw dot selects B; cosine selects B."
    ],
    "answer": "Raw dot selects A; cosine selects B.",
    "explanation": "Raw dot gives A = 8 and B = 6 (A wins). Cosine gives A = 8 / 10 = 0.8 and B = 6 / 6 = 1.0 (B wins)."
  },
  {
    "question": "A PCA projection keeps 95% of corpus explained variance yet drops a target passage outside top-5 on held-out queries. Why, and what is the fix?",
    "options": [
      "Explained variance tracks global spread rather than task relevance; raise k or use an MRL prefix and validate on held-out Recall@K.",
      "PCA only works without mean centering; skip subtracting the mean so cosine stays fixed.",
      "95% explained variance proves top-5 recall is at least 95%; debug the evaluation harness.",
      "Index 2D t-SNE coordinates directly so local neighborhoods stay intact."
    ],
    "answer": "Explained variance tracks global spread rather than task relevance; raise k or use an MRL prefix and validate on held-out Recall@K.",
    "explanation": "PCA optimizes global squared reconstruction error, so top axes may capture formatting rather than query distinctions. Select k from held-out Recall@K, and never index 2D t-SNE layouts."
  },
  {
    "question": "At N = 10M and epsilon = 0.15, the Johnson-Lindenstrauss bound asks for k >= 6,368 even though embeddings have d = 1,536. What follows?",
    "options": [
      "Random projection can never work below 6,368 dimensions.",
      "The JL formula is a conservative worst-case bound; smaller k can work on low-rank embeddings if validated on held-out Recall@K.",
      "Gaussian random projection preserves exact nearest-neighbor order for any k >= 256.",
      "Random projection requires refitting on every streaming batch."
    ],
    "answer": "The JL formula is a conservative worst-case bound; smaller k can work on low-rank embeddings if validated on held-out Recall@K.",
    "explanation": "The JL bound covers arbitrary point sets. Real embeddings often occupy lower-rank subspaces and tolerate smaller k, but overlapping (1 +/- eps) bands can swap close neighbors, so empirical Recall@K validation is essential."
  },
  {
    "question": "For query [1, 2], INT8 rows are A = [50, 0] and B = [0, 80] with scales [0.1, 0.01]. Separately, int8 [120, 120] @ [120, 120] wraps to -128 in NumPy. Which scores and fix are right?",
    "options": [
      "A = 5.0, B = 1.6; widen operands to int32 before multiplying.",
      "A = 50.0, B = 160.0; widen operands to int32 before multiplying.",
      "A = 5.0, B = 1.6; cast the int8 product to int32 afterward.",
      "A = 0.5, B = 16.0; cast the int8 product to int32 afterward."
    ],
    "answer": "A = 5.0, B = 1.6; widen operands to int32 before multiplying.",
    "explanation": "Applying scales gives A = 1 * 0.1 * 50 = 5.0 and B = 2 * 0.01 * 80 = 1.6. Widening operands to int32 before multiplying avoids 8-bit wrap; casting afterward cannot recover lost bits."
  },
  {
    "question": "Vectors [1.0, 0.01, -1.0, -0.01] and [0.01, 1.0, -0.01, -1.0] have cosine 0.020 yet share identical sign bits (Hamming 0). How do you prevent this collision from breaking retrieval?",
    "options": [
      "Fetch a wider binary shortlist (K > 1) with inline metadata filtering, then rescore survivors using retained higher-precision vectors.",
      "Keep K = 1 in binary search and L2-normalize the packed sign bits.",
      "Drop the first coordinate so remaining bits have equal variance.",
      "Replace Hamming distance with raw dot product on unscaled bytes."
    ],
    "answer": "Fetch a wider binary shortlist (K > 1) with inline metadata filtering, then rescore survivors using retained higher-precision vectors.",
    "explanation": "Coordinate signs discard magnitudes and can collide on nearly orthogonal vectors. Shortlisting K > 1 with inline metadata filtering and rescoring with retained FP32 or SQ8 vectors restores accurate ranking."
  }
]
```

> **Next:** Continue to [Hybrid Search, BM25 & Reranking](/learn/core-retrieval-algorithms).
