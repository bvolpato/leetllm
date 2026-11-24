---
{
  "id": "embeddings-cosine-dot-product-quantization",
  "slug": "embeddings-cosine-dot-product-quantization",
  "title": "Embedding Similarity & Quantization",
  "shortDescription": "Measure how vector length, Matryoshka prefixes, scalar quantization, product quantization, and binary codes trade retrieval RAM for ranking accuracy.",
  "difficulty": "Hard",
  "category": "Embeddings & Vector Search",
  "section": "Transformer Deep Dives",
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
  "order": 2,
  "keyConceptsTested": [
    "Cosine Similarity",
    "Dot Product",
    "Embedding Dimensions",
    "Hamming Distance",
    "Scalar Quantization",
    "Product Quantization",
    "Binary Quantization",
    "Matryoshka Representation Learning",
    "Asymmetric Distance Computation"
  ]
}
---

A developer asks, "How does FlashAttention fuse softmax into tiled SRAM passes?" A vector retriever embeds that query and scans technical passages stored in its index. One similarity rule puts `flash-attention-v2` at the top; another favors a longer embedding from an unverified draft; compressing vectors to fit RAM can reshuffle candidates yet again. Distinguishing metric choice from geometric approximation pinpoints which step shifted the ranking.

[Sentence embeddings](/learn/sentence-embeddings-contrastive-learning) covered how contrastive training arranges meaning in vector space. Here the encoder stays fixed while we examine the arithmetic behind searching it at scale, tracking diagnostic vectors like our target passage `flash-attention-v2` (explaining SRAM tiling and online softmax rescaling) alongside an unverified draft note. Including that draft illustrates why corpus metadata predicates belong outside raw similarity ranking so unmatched rows are excluded regardless of score, and keeping the scoring rule fixed before comparing shorter <span data-glossary="vector">vectors</span> or coarser <span data-glossary="quantization">quantization</span> codes isolates which approximation shifted the result.

## Three ways to measure closeness

Start with one small question: what should "close" mean for these two chunks? An <span data-glossary="embedding">embedding</span> is a point in high-dimensional space, represented by a list of numbers from the encoder. Three common rulers answer different versions of that question.

| Ruler | Question | Range | Scaling one document by a positive factor |
|:------|:---------|:------|:---------------------------------------|
| <span data-glossary="cosine-similarity">Cosine similarity</span> | Do they point the same way? | $-1$ to $1$ | No |
| <span data-glossary="dot-product">Dot product</span> | How much do matching coordinates reinforce each other? | $-\infty$ to $+\infty$ | Can change rank |
| Euclidean (L2) distance | What's the straight-line gap? | $0$ to $+\infty$ | Can change rank |

Positive scaling preserves a nonzero vector's direction. Negative scaling reverses it, and scaling to zero makes cosine undefined. If every stored vector and query has length 1, descending cosine, descending dot product, and ascending L2 distance give the same exact ranking. Approximate indexes can still return different candidates.

A zero vector is the exception you have to reject explicitly: cosine divides by both vector norms, so a zero-norm query has no defined direction. Replacing that division with an arbitrary zero score can quietly reorder an entire shortlist. Record the encoder failure and refuse retrieval instead of pretending the query matched nothing.

A compact 2D example makes the split visible. Two passages discussing FlashAttention tiling map to:

- Passage A, `flash-attention-v2`: `[3, 4]`
- Passage B, `tiled-softmax-notes`: `[4, 3]`

These coordinates put the two vectors in nearby directions, yet neither geometric intuition nor a raw dot score guarantees topical relevance without measuring exact values. Working out dot product, cosine similarity, and squared Euclidean distance side by side clarifies how each metric behaves before ranking a larger candidate set. Keep this equal-length pair in mind as a baseline, because real encoder outputs often vary in magnitude even along the same semantic direction.

### Cosine similarity

To compute **cosine similarity**, multiply matching coordinates to find the inner product and divide by the product of both vector lengths. Starting with the pairwise coordinate sum gives:

$$
\mathbf{A} \cdot \mathbf{B} = (3 \times 4) + (4 \times 3) = 12 + 12 = 24
$$

Each vector's Euclidean norm equals the square root of its squared coordinates, $\|\mathbf{A}\| = \sqrt{3^2 + 4^2} = \sqrt{25} = 5$ and $\|\mathbf{B}\| = \sqrt{4^2 + 3^2} = \sqrt{25} = 5$. Dividing the dot product $24$ by $5 \times 5$ removes scale completely and yields the cosine of the angle between them:

$$
\cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|} = \frac{24}{5 \times 5} = 0.96
$$

Values range from `1` for identical rays through `0` for orthogonal vectors down to `-1` for opposite directions. This normalized score isolates directional alignment independently of vector magnitude. Even so, a high geometric angle match is not a guarantee of topical relevance on its own, because ranking usefulness still depends on how the embedding model aligns semantic pairs during training.

### Dot product

Removing length division leaves the raw inner product $\mathbf{A} \cdot \mathbf{B} = \sum_{i=1}^{n} a_i b_i$, which evaluates to $24$ for our 2D pair. Because dot product scales linearly with vector magnitude, stretching vector $\mathbf{A}$ tenfold scales a positive inner product tenfold as well, while multiplying a negative score makes it more negative. Raw inner product preserves identical rankings to cosine whenever every stored document shares the same L2 norm, yet diverges as soon as vector lengths vary across the corpus.

### Euclidean distance

The third metric measures the straight-line spatial separation between vector endpoints rather than their ray angle:

$$
\|\mathbf{A} - \mathbf{B}\|_2 = \sqrt{(3-4)^2 + (4-3)^2} = \sqrt{2} \approx 1.41
$$

A gap of $1.41$ is only interpretable relative to the coordinate scale of the surrounding index, because varying vector norms change Euclidean spacing even between parallel vectors. Scaling $A$ by $10$ moves its endpoint far further from $B$ along the same direction and inflates dot product tenfold, yet leaves cosine similarity locked at $0.96$. The NumPy check below confirms these numbers directly across all three metrics:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="two-dimensional-rulers.py"
import numpy as np

passage_a = np.array([3.0, 4.0])
passage_b = np.array([4.0, 3.0])

score = float(np.dot(passage_a, passage_b))
cosine = score / (float(np.linalg.norm(passage_a)) * float(np.linalg.norm(passage_b)))
euclidean = float(np.linalg.norm(passage_a - passage_b))
print(f"dot={score:.0f}, cosine={cosine:.2f}, euclidean={euclidean:.2f}")

longer_a = 10.0 * passage_a
same_direction_cosine = float(np.dot(longer_a, passage_b)) / (
    float(np.linalg.norm(longer_a)) * float(np.linalg.norm(passage_b))
)
print(f"10x vector: cosine={same_direction_cosine:.2f}, dot={float(np.dot(longer_a, passage_b)):.0f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dot=24, cosine=0.96, euclidean=1.41
10x vector: cosine=0.96, dot=240
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/cosine_vs_dot_dark.png" alt="Top panels plot equal-length vectors A = (3, 4) and B = (4, 3) with norm 5, dot product 24, cosine 0.96, and Euclidean distance 1.414. Bottom AxisPlot scales A by k from 1 to 10: normalized dot product rises linearly to 10x while normalized cosine stays flat at 1.0." />
  <figcaption>The top plot compares A = (3, 4) and B = (4, 3) on equal axes. Scaling A by k leaves cosine ratio constant at 1.0 while the normalized dot product climbs linearly to 10x at k = 10.</figcaption>
</figure>

```checkpoint
If vector A is `[3, 4]` and vector C is `[30, 40]`, what happens to cosine similarity and dot product when you compare both vectors to `[4, 3]`?
---
Cosine similarity stays the same because A and C point in the same direction. Dot product grows by 10x because C is 10x longer. Cosine ignores magnitude. Dot product keeps it.
```

The experiment gives you a serving decision. Use cosine when the <span data-glossary="model-card">model card</span>, training setup, or labeled queries say length shouldn't change rank. Use raw dot product when magnitude is part of the learned score, as in maximum inner product search (MIPS).

If every vector is already unit length, the rankings match and inner product avoids norm divisions while scoring candidates.

## When the three rulers agree

The opening example used equal-length vectors, whereas real embedding encoders can return varying norms unless L2 normalization is applied explicitly across model encoding, index insertion, and query scoring. Once unit normalization holds on both queries and documents, all three similarity metrics produce identical candidate orderings because the cosine denominator collapses to $1 \times 1 = 1$. Cosine then equals raw dot product directly, and squared Euclidean distance turns into a strictly decreasing linear function of that inner product:

$$
\begin{aligned}
\|\mathbf{A} - \mathbf{B}\|_2^2 &= \sum_{i=1}^{n} (a_i - b_i)^2 \\
&= \sum_{i=1}^{n} a_i^2 - 2 \sum_{i=1}^{n} a_i b_i + \sum_{i=1}^{n} b_i^2 \\
&= \|\mathbf{A}\|_2^2 - 2 (\mathbf{A} \cdot \mathbf{B}) + \|\mathbf{B}\|_2^2
\end{aligned}
$$

Because both vectors are unit-normalized ($\|\mathbf{A}\|_2 = 1$ and $\|\mathbf{B}\|_2 = 1$), those squared norms simplify directly:

$$
\|\mathbf{A} - \mathbf{B}\|_2^2 = 1 - 2 (\mathbf{A} \cdot \mathbf{B}) + 1 = 2 - 2 (\mathbf{A} \cdot \mathbf{B})
$$

Rearranging gives the exact geometric connection:

$$
\cos(\mathbf{A}, \mathbf{B}) = \mathbf{A} \cdot \mathbf{B} = 1 - \frac{\|\mathbf{A} - \mathbf{B}\|_2^2}{2}
$$

For example, unit-vector dot scores of 0.73 and 0.60 correspond to squared Euclidean gaps of $2 - 2 \times 0.73 = 0.54$ and $2 - 2 \times 0.60 = 0.80$. The larger dot score has the smaller distance. Minimizing straight-line gap on the unit hypersphere is mathematically identical to maximizing cosine similarity or inner product.

Higher inner product, higher cosine, and smaller squared L2 distance now induce the same ranking. Normalize stored rows once and each incoming query once. Candidate scoring can use a fast <span data-glossary="matrix">matrix</span>-multiply kernel without repeated norm divisions.[^faissMetrics2026]

The next diagnostic example isolates that norm-inflation failure directly. Giving `linear-attn-draft` a much larger raw norm lets it dominate raw dot product even though its angle diverges further from the query than `flash-attention-v2`. Comparing unnormalized dot product against normalized cosine confirms why vector length must match the index metric:

<!-- leetllm: test, output=show, deps=numpy, id=vector-normalization -->
```python title="normalization-invariance.py"
import math
import numpy as np

labels = ["flash-attention-v2", "linear-attn-draft", "rope-encoding"]
documents = np.array([
    [0.95, 0.05],  # Closely aligned with the query ray.
    [8.00, 6.00],  # Inflated norm boosts raw inner product.
    [0.20, 0.90],
])
query = np.array([1.0, 0.0])


def dot(left, right) -> float:
    return float(np.dot(left, right))


def l2_norm(vector) -> float:
    return float(np.linalg.norm(vector))


def l2_normalize(vector) -> np.ndarray:
    arr = np.asarray(vector, dtype=np.float64)
    if arr.size == 0 or not np.all(np.isfinite(arr)):
        raise ValueError("expected a nonempty finite vector")
    scale = float(np.max(np.abs(arr)))
    if scale == 0.0:
        raise ValueError("zero vector has no cosine direction")
    # Rescale by max amplitude first to avoid underflow or overflow on extreme magnitudes.
    scaled = arr / scale
    return scaled / np.linalg.norm(scaled)


raw_dot = documents @ query
unit_documents = np.vstack([l2_normalize(row) for row in documents])
unit_query = l2_normalize(query)
unit_dot = unit_documents @ unit_query
doc_norms = np.linalg.norm(documents, axis=1)
raw_cosine = raw_dot / (doc_norms * l2_norm(query))
unit_squared_l2 = np.sum((unit_documents - unit_query) ** 2, axis=1)
assert np.allclose(unit_squared_l2, 2.0 - 2.0 * unit_dot, atol=1e-12)

for invalid in [[], [0.0, 0.0], [float("nan"), 1.0], [float("inf"), 1.0]]:
    try:
        l2_normalize(invalid)
    except ValueError:
        pass
    else:
        raise AssertionError("invalid direction was accepted")
for extreme in [[1e308, 1e308], [1e-308, 1e-308]]:
    assert math.isclose(l2_norm(l2_normalize(extreme)), 1.0)

print(f"raw dot winner: {labels[int(np.argmax(raw_dot))]}")
print(f"normalized winner: {labels[int(np.argmax(unit_dot))]}")
print(f"cosine equals unit dot: {np.allclose(raw_cosine, unit_dot, atol=1e-6)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw dot winner: linear-attn-draft
normalized winner: flash-attention-v2
cosine equals unit dot: True
```
<!-- leetllm: output:end -->

A large-norm vector is not automatically noisy, since certain bi-encoders encode passage centrality or prior strength directly into vector magnitude when trained with inner product. When an index relies on angular similarity, however, omitting L2 normalization alters the optimization objective, whereas rejecting zero or non-finite inputs and scaling extreme magnitudes before normalizing prevents tiny nonzero directions (`1e-308`) from underflowing to zero. Notice also that while an unnormalized query produces the same relative ranking against unit-normalized documents, normalizing the query too gives consistent cosine thresholds and preserves the unit-vector L2 identity, and original product quantization explicitly approximates squared L2 distance between an unquantized query and compressed codes.[^jegou2011]

## Choosing how many dimensions you need

Embedding dimensionality directly governs RAM footprint, cache residency, and multiply-accumulate work per distance evaluation. However, raw coordinate count carries no universal cross-model quality ranking, because a task-tuned 512-dimensional encoder can easily beat a general 1,536-dimensional baseline. Meaningful width comparisons therefore hold model family, normalization convention, corpus, and evaluation queries fixed:

| Choice under evaluation | What you can conclude | What you still must measure |
|:------------------------|:----------------------|:----------------------------|
| Full trained width | Baseline payload and retrieval score for this model | Latency, RAM, and evidence recall |
| Model-supported shorter prefix | Lower raw payload for the same family | Recall loss and <span data-glossary="evaluation-slice">failure slices</span> |
| Different smaller model | Possibly cheaper candidate system | Everything again; training changed too |

Separating dimension count from normalization avoids a common serving bug: truncation selects how many semantic coordinates stay in the index, while L2 normalization defines the metric. Any shortened prefix still requires L2 normalization matching the encoder's serving configuration.

For one representation family, extra dimensions buy capacity but charge the same predictable systems costs:

1. **Storage.** Each float32 is 4 bytes. 1M vectors at 1536d is about **5.7 GiB** of raw payload.
2. **Exact scoring work.** A dot product or L2 comparison does <span data-glossary="big-o-notation">linear work in the number of dimensions</span>, written $O(d)$, per candidate.
3. **Memory bandwidth.** Loading vectors from memory can bottleneck <span data-glossary="ann-search">approximate nearest neighbor (ANN) search</span>, which finds close vectors without scanning every row.
4. **End-to-end latency.** Fewer dimensions reduce vector reads and exact scoring work. Graph traversal, filters, networking, and reranking also contribute, so measure the complete search path before estimating latency savings.

### Matryoshka prefixes still need a recall test

When memory budgets favor 256 dimensions over 1,536, preserving quality requires a model explicitly trained to front-load information into leading coordinates. <span data-glossary="matryoshka-representation-learning">Matryoshka Representation Learning (MRL)</span> optimizes a weighted sum of losses at multiple nested cutoff widths $d \in \mathcal{D}$, ensuring short prefixes remain searchable on their own rather than relying on accidental coordinate ordering.[^kusupati2022] Unlike post-hoc <span data-glossary="pca">PCA</span>, which projects frozen embeddings onto top variance directions for one fixed target dimension, MRL equips a single encoder to serve any nested prefix width on demand. This multi-scale objective concentrates broad semantics in early indices and reserves fine-grained distinctions for tail coordinates.

Hosted embedding APIs often expose supported truncation widths directly without manual slicing, such as the `dimensions` control for OpenAI `text-embedding-3` models (defaulting to 1,536 and 3,072 coordinates).[^openai2024_embeddings] On MTEB, a `text-embedding-3-large` vector shortened to 256 dimensions still outperforms an unshortened 1,536-dimensional `text-embedding-ada-002` vector. Even with strong public benchmark margins, general suites never guarantee ranking fidelity on specialized domains, so evaluate the target queries including `flash-attention-v2`. When truncating precomputed vectors manually, slice the desired prefix and immediately L2-normalize both documents and queries before scoring:[^openai2024_embeddings]

<!-- leetllm: test, output=show, deps=numpy, continue=vector-normalization, id=prefix-normalization -->
```python title="renormalize-a-sliced-prefix.py"
full_embedding = np.array([0.21, -0.05, 0.44, 0.31, 0.18, -0.27, 0.12, 0.09])
short_embedding = l2_normalize(full_embedding[:4])
norm = l2_norm(short_embedding)
assert math.isclose(norm, 1.0)
print(f"dims={short_embedding.size}, norm={norm:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dims=4, norm=1.000
```
<!-- leetllm: output:end -->

Normalization restores unit length whenever the retained prefix is nonzero, yet it can never recover semantics carried only by truncated tail dimensions. The diagnostic below compares three candidate passages filtered cleanly into the same domain pool: `sparse-attn` (`[1, 0, 1, 0]`), `flash-attn` (`[1, 0, 0, 1]`), and `rope-enc` (`[0, 1, 0, 1]`). At full 4d width, trailing coordinates cleanly match `[1, 0, 0, 1]` to `flash-attn` (`cos = 1.00`) ahead of `sparse-attn` (`cos = 0.50`). Slicing to two dimensions collapses both `sparse-attn` and `flash-attn` onto `(1, 0)`, leaving top-1 retrieval tied until full-width rescoring resolves the ambiguity.

<figure>
  <img src="illustrations/_generated/matryoshka_dimensions_dark.png" alt="Grid lists query [1, 0, 0, 1] and three 4d vectors: flash-attention [1, 0, 0, 1] with 2d cos 1.00 and 4d cos 1.00, sparse-attention [1, 0, 1, 0] with 2d cos 1.00 and 4d cos 0.50, and rope-encoding [0, 1, 0, 1] with 2d cos 0.00 and 4d cos 0.50. An AxisPlot shows the first two dimensions collapsing flash-attention and sparse-attention onto (1, 0), and a ProgressList compares full 4d cosine separation." />
  <figcaption>Keeping only head coordinates d₀ and d₁ collapses flash-attn and sparse-attn onto the same prefix ray (1, 0) at cosine 1.00. Returning a shortlist K > 1 from the compact prefix lets full 4d rescoring restore flash-attn (1.00) cleanly ahead of sparse-attn (0.50).</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, continue=prefix-normalization, id=prefix-recall -->
```python title="prefix-still-needs-recall-evaluation.py"
labels = ["sparse-attn", "flash-attn", "rope-enc"]
documents = np.array([
    [1.0, 0.0, 1.0, 0.0],
    [1.0, 0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
])
queries = np.array([
    [1.0, 0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
])
expected = ["flash-attn", "rope-enc"]


def top1_at_width(width: int) -> list[str]:
    if not 1 <= width <= documents.shape[1]:
        raise ValueError("width must lie within the full embedding dimensionality")
    docs = np.vstack([l2_normalize(row[:width]) for row in documents])
    asks = np.vstack([l2_normalize(row[:width]) for row in queries])
    scores = asks @ docs.T
    return [labels[int(np.argmax(row_scores))] for row_scores in scores]


full = top1_at_width(4)
short = top1_at_width(2)
full_recall = sum(got == want for got, want in zip(full, expected, strict=True)) / len(expected)
short_recall = sum(got == want for got, want in zip(short, expected, strict=True)) / len(expected)
assert full_recall == 1.0 and short_recall == 0.5
print(f"full top-1 recall={full_recall:.1%}, results={full}")
print(f"short top-1 recall={short_recall:.1%}, results={short}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
full top-1 recall=100.0%, results=['flash-attn', 'rope-enc']
short top-1 recall=50.0%, results=['sparse-attn', 'rope-enc']
```
<!-- leetllm: output:end -->

Each query above has one labeled target passage, so mean top-1 hit rate equals Recall@1. When queries have multiple relevant documents, Recall@K measures the fraction appearing in the top K results. Always evaluate approximate ANN recall against exact full-precision neighbors separately from ground-truth relevance judgments so retrieval bottlenecks stay visible.

```checkpoint
You shorten a unit-normalized 3072-dimensional embedding by taking only the first 256 values. Should you index that prefix immediately?
---
No. Verify that the model was trained for prefix truncation and evaluate held-out retrieval. Always L2-normalize nonzero prefixes consistently across both corpus documents and queries, and handle zero vectors explicitly since renormalization cannot recover discarded tail dimensions.
```

## The memory problem: a sizing example

The prefix experiment captures the accuracy constraint. Next, calculate the raw memory footprint for one million 1,536-dimensional embeddings before graph links, metadata columns, or replicas, tracking how storage scales from 32-bit floats down through 8-bit integers, single bits, and product-quantization IDs.

### Step 1: the FP32 baseline

Each dimension is a float32, which takes 4 bytes. Multiply rows, dimensions, and bytes per value:

$$
\begin{aligned}
1{,}000{,}000 \times 1{,}536 \times 4\text{ bytes}
&=6.144\times10^9\text{ bytes}\\
&\approx6.14\text{ GB}\\
&\approx5.72\text{ GiB}
\end{aligned}
$$

That's only the raw numbers. Real indexes add graph links, metadata, and replicas, but the vector payload alone is already over 5.7 GiB. If that's too large for hot memory, precision is the next lever.

### Step 2: 8-bit scalar quantization

Map each float32 to a single byte (INT8). The row count and width stay fixed, so storage drops by about 4x:

$$
\begin{aligned}
1{,}000{,}000 \times 1{,}536\text{ bytes}
&\approx1.54\text{ GB}\\
&\approx1.43\text{ GiB}
\end{aligned}
$$

### Step 3: product quantization

Split each 1,536-dimensional vector into 96 subvectors and store one 8-bit centroid ID per subvector. The compressed row is 96 bytes:

$$
1{,}000{,}000 \times 96 \text{ bytes} \approx 91.6 \text{ MiB}
$$

That's a **64x** cut in per-row code payload. The <span data-glossary="product-quantization">PQ</span> codebooks are shared, not free: 96 subspaces × 256 centroids × 16 float32 coordinates require 1,572,864 bytes (1.5 MiB). If you retain FP32 vectors for rescoring, those 5.72 GiB still exist somewhere; compression may save hot RAM without eliminating total storage.

<figure>
  <img src="illustrations/_generated/payload_bytes_dark.png" alt="AxisPlot tracks compression ratio from 1x at 32 bits per dimension (FP32) to 4x at INT8, 32x at binary 1-bit, and 64x at PQ-96. Below a downward FlowArrow, a ProgressList reports exact 1,536d per-vector sizes and 1M-vector RAM: 6,144 bytes (5.72 GiB), 1,536 bytes (1.43 GiB), 192 bytes (183.1 MiB), and 96 bytes (91.6 MiB)." />
  <figcaption>Compression ratio climbs 64x from raw 32-bit floats to 96-subspace product quantization across one million 1,536-dimensional rows. The PQ-96 configuration uses 96 subspaces with 256 centroids of width 16 each, adding 1.5 MiB for shared FP32 codebooks alongside HNSW graph links, metadata, and optional full-precision rescore copies.</figcaption>
</figure>

Check these payload numbers with a sizing helper. Decimal gigabytes divide by $10^9$; binary gibibytes divide by $1024^3$. Label the unit explicitly because storage tools differ:

<!-- leetllm: test, output=show, deps=numpy, continue=prefix-recall, id=payload-sizing -->
```python title="vector-payload-sizing.py"
def payload_bytes(num_vectors: int, bytes_per_vector: int) -> int:
    return num_vectors * bytes_per_vector


raw_bytes = payload_bytes(1_000_000, 1_536 * 4)
int8_bytes = payload_bytes(1_000_000, 1_536)
pq_bytes = payload_bytes(1_000_000, 96)
codebook_bytes = 96 * 256 * (1_536 // 96) * 4
binary_bytes = payload_bytes(1_000_000, (1_536 + 7) // 8)
assert codebook_bytes == 1_572_864
assert raw_bytes // pq_bytes == 64
assert raw_bytes // binary_bytes == 32

print(f"FP32={raw_bytes / 1e9:.2f} GB ({raw_bytes / 1024**3:.2f} GiB)")
print(f"INT8={int8_bytes / 1e9:.2f} GB ({int8_bytes / 1024**3:.2f} GiB)")
print(f"PQ={pq_bytes / 1024**2:.1f} MiB")
print(f"shared_PQ_codebooks={codebook_bytes / 1024**2:.1f} MiB")
print(f"binary_codes={binary_bytes / 1024**2:.1f} MiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FP32=6.14 GB (5.72 GiB)
INT8=1.54 GB (1.43 GiB)
PQ=91.6 MiB
shared_PQ_codebooks=1.5 MiB
binary_codes=183.1 MiB
```
<!-- leetllm: output:end -->

Re-embedding a large corpus when switching encoders scales directly with total <span data-glossary="token">token</span> volume rather than document count alone (`total_tokens / 1_000_000 * price_per_1M_tokens`). Keep a single metadata header alongside every built index recording model identifier, embedding width, normalization mode, and quantization parameters. Tracking these settings explicitly prevents rolling migrations from silently mixing incompatible vector representations in the same search pool.

## Shrinking vectors without losing the hit

The sizing math clarifies where memory pressure originates: an exact scan reads up to $N \times d$ coordinates per query, so ANN indexes visit fewer rows while quantization stores fewer bytes per coordinate. Because these are independent approximations, either shortcut can push the target passage out of the top-$K$ shortlist and both require separate recall measurements. Benchmark every compressed representation (SQ8, PQ, or binary) against a labeled full-precision baseline, widening shortlist depth $K$ or applying higher-precision rescoring whenever compressed recall lags. Where metadata predicates restrict eligible rows, evaluating filters inline during search prevents disqualified neighbors from crowding out valid hits under tight $K$ cutoffs.

### Scalar quantization (SQ)

Scalar quantization (SQ8) replaces each 32-bit float (4 bytes) with an 8-bit integer (1 byte), giving a 4x reduction in **coordinate payload**, before scales and index overhead. In this symmetric signed scheme, each dimension is mapped linearly around zero using its calibration scale $s$:

$$
\begin{aligned}
x_q &= \operatorname{clip}\left(\operatorname{round}\left(\frac{x}{s}\right), -127, 127\right) \\
\hat{x} &\approx s \cdot x_q
\end{aligned}
$$

Here $s = \max(|x|) / 127$ over the calibration values for that dimension, with a separate rule for a constant-zero dimension. This scheme uses 255 levels from -127 through 127, leaving -128 unused. With one shared scale for all dimensions, approximate inner-product scoring is:

$$
\langle \mathbf{q}, \hat{\mathbf{x}} \rangle \approx s \sum_{i=1}^{d} q_i x_{q, i}
$$

An alternative is a **range-offset** quantizer. For a nonconstant interval $[a,b]$, map its endpoints to the unsigned codes 0 and 255:

$$
s = \frac{b-a}{255}, \quad c = \operatorname{clip}\left(\operatorname{round}\left(\frac{x-a}{s}\right),0,255\right), \quad \hat{x}=a+s c
$$

The offset is a real value, not necessarily a representable integer zero-point. An integer-zero-point codec instead specifies a rule such as $c=\operatorname{clip}(\operatorname{round}(x/s)+z,0,255)$ and $\hat{x}=s(c-z)$, with $z$ inside the code domain. Its calibration must account for that restriction. Mixing the two formulas changes the reconstruction. For per-dimension range offsets, a dot score is $\sum_j(q_j a_j+s_j q_j c_j)$. Shared offsets add the same query-specific constant to every row, so you may omit that constant for a fixed-query ranking when all rows share calibration. Keep it for score values and thresholds; document-specific offsets do not cancel this way.

Signed storage does not imply symmetric calibration. Sentence Transformers documents per-dimension min/max buckets and both signed and unsigned byte formats.[^sbertEmbeddingQuantization2026] Qdrant describes its scalar codec as `float32 -> uint8`.[^qdrant2024] Follow the selected codec's range, rounding, clipping, offset, and scoring rules instead of assuming every engine uses the symmetric helper below.

For example, an interval $[2,3]$ has $s=1/255$. Its range-offset codec can represent both endpoints. The quantity $\operatorname{round}(-2/s)=-510$ is not a valid unsigned-byte zero-point. If exact zero representation is required, expand the calibration interval to include zero, which sacrifices some resolution over $[2,3]$.

<!-- leetllm: test, output=show -->
```python title="range-offset-is-not-a-byte-zero-point.py"
a, b = 2.0, 3.0
step = (b - a) / 255
endpoint_codes = [round((value - a) / step) for value in (a, b)]
reconstructed = [a + step * code for code in endpoint_codes]
invalid_zero_point = round(-a / step)
zero_inclusive_step = (b - 0.0) / 255
assert endpoint_codes == [0, 255] and reconstructed == [2.0, 3.0]
assert not 0 <= invalid_zero_point <= 255
print("endpoint codes:", endpoint_codes, "reconstructed:", reconstructed)
print("proposed byte zero-point:", invalid_zero_point, "(outside 0..255)")
print(f"step over [2,3]={step:.6f}; step over [0,3]={zero_inclusive_step:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
endpoint codes: [0, 255] reconstructed: [2.0, 3.0]
proposed byte zero-point: -510 (outside 0..255)
step over [2,3]=0.003922; step over [0,3]=0.011765
```
<!-- leetllm: output:end -->

Fit ranges on representative calibration vectors, freeze them, and use the same ranges to encode later rows. Sentence Transformers accepts explicit ranges or calibration embeddings instead of deriving ranges from a small query batch.[^sbertEmbeddingQuantization2026]

Separating scale fitting from integer encoding keeps calibration reproducible across batches. Packing quantized rows directly into a contiguous `int8` byte array matches production vector-database layouts instead of Python integer objects. Three diagnostic rows make the mechanics explicit, whereas production codecs fit quantile bounds over thousands of held-out vectors:

<!-- leetllm: test, output=show, deps=numpy, continue=payload-sizing, id=scalar-quantization -->
```python title="symmetric-int8-quantization.py"
vectors = np.array([
    [0.20, -1.00, 2.50],
    [0.24, -0.80, 2.10],
    [0.50, -1.40, 2.30],
], dtype=np.float32)


def fit_scales(rows) -> np.ndarray:
    arr = np.asarray(rows, dtype=np.float32)
    max_abs = np.max(np.abs(arr), axis=0)
    # A constant-zero coordinate keeps scale 1.0 to avoid dividing by zero.
    return np.where(max_abs > 0.0, max_abs / 127.0, 1.0).astype(np.float32)


def encode_int8(rows, scales: np.ndarray) -> np.ndarray:
    arr = np.asarray(rows, dtype=np.float32)
    return np.clip(np.rint(arr / scales), -127, 127).astype(np.int8)


scale = fit_scales(vectors)
codes = encode_int8(vectors, scale)
reconstructed = codes.astype(np.float32) * scale
max_error = float(np.max(np.abs(vectors - reconstructed)))

assert codes.itemsize == 1 and codes.nbytes == 9
assert np.array_equal(encode_int8([[0.0, 0.0]], fit_scales([[0.0, 0.0]])), [[0, 0]])
assert np.array_equal(encode_int8([[100.0, -100.0, 0.0]], scale)[0, :2], [127, -127])
print(f"codes[0]={codes[0].tolist()}, max_error={max_error:.4f}")
print(f"packed_code_bytes={codes.nbytes}; scales_stored_separately={scale.size}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
codes[0]=[51, -91, 127], max_error=0.0063
packed_code_bytes=9; scales_stored_separately=3
```
<!-- leetllm: output:end -->

With NumPy's vectorized `rint` and `int8` storage, the nine quantized coordinates occupy nine bytes cleanly, though per-dimension float scales, ID mappings, and graph edges still add overhead outside the raw matrix. Monitoring distribution drift over time catches coordinates that begin near zero during calibration and later saturate when vector distributions shift. Because <span data-glossary="recall-at-k">Recall@K</span> drop depends on embedding geometry, <span data-glossary="calibration">calibration</span> sample coverage, shortlist depth, and second-stage rescoring, always multiply quantized codes by their corresponding coordinate scales during scoring (`query * scale * code`) so coordinates with wide dynamic ranges stay properly weighted:

<!-- leetllm: test, output=show, deps=numpy, continue=scalar-quantization, id=int8-rescore -->
```python title="int8-rescoring-needs-scales.py"
scales = fit_scales([[10.0, 1.0], [-10.0, -1.0]])
database = np.array([[8.0, 0.0], [0.0, 1.0]], dtype=np.float32)
query = np.array([1.0, 1.0], dtype=np.float32)
codes = encode_int8(database, scales)

naive = codes.astype(np.float32) @ query
weighted = (codes.astype(np.float32) * scales) @ query
assert int(np.argmax(naive)) == 1 and int(np.argmax(weighted)) == 0
print(f"codes={codes.tolist()}; unscaled winner={int(np.argmax(naive))}")
print(f"scaled scores={[round(float(score), 3) for score in weighted]}; winner={int(np.argmax(weighted))}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
codes=[[102, 0], [0, 127]]; unscaled winner=1
scaled scores=[8.031, 1.0]; winner=0
```
<!-- leetllm: output:end -->

The true dot products are 8 and 1. Applying per-coordinate scales preserves that ordering, whereas summing raw unscaled byte codes reverses it. While inner-product scoring only depends on aligned scaling factors, cosine similarity on quantized vectors also requires either recomputing reconstructed norms or measuring how much drift assumes unit norms.

Even with exact calibration scales, fixed-width integer arithmetic can silently wrap when multiplying INT8 arrays directly. NumPy's integer matrix multiplication preserves narrow input dtypes unless operands are widened first. Casting inputs to `int32` prior to `matmul` keeps inner-product sums accurate across full embedding widths:[^numpyMatmul2026]

<!-- leetllm: test, output=show, deps=numpy -->
```python title="int8-scores-need-wide-arithmetic.py"
import numpy as np

query = np.array([127, 127], dtype=np.int8)
documents = np.array([[127, 127], [126, 126]], dtype=np.int8)
wrapped = documents @ query
cast_after = wrapped.astype(np.int32)
wide = documents.astype(np.int32) @ query.astype(np.int32)

assert wrapped.tolist() == [2, 4]
assert cast_after.tolist() == [2, 4]  # Lost high bits cannot be recovered.
assert wide.tolist() == [32_258, 32_004]
assert int(wrapped.argmax()) == 1 and int(wide.argmax()) == 0
bound = 1_536 * 127**2
assert bound < np.iinfo(np.int32).max
print(f"INT8 scores={wrapped.tolist()}; winner={int(wrapped.argmax())}")
print(f"INT32 scores={wide.tolist()}; winner={int(wide.argmax())}")
print(f"1536-d symmetric-code absolute sum bound={bound}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
INT8 scores=[2, 4]; winner=1
INT32 scores=[32258, 32004]; winner=0
1536-d symmetric-code absolute sum bound=24774144
```
<!-- leetllm: output:end -->

> **Common mistake:** Multiplying `int8` embedding arrays directly with `documents @ query` in NumPy. Narrow 8-bit accumulation wraps around (`[32258, 32004]` wraps to `[2, 4]`) and flips the top-ranked document; always widen to `int32` before multiplying.

The true integer inner products favor row 0, whereas narrow 8-bit arithmetic wraps the products to 2 and 4 and reverses the winner. Casting after multiplication comes too late to undo overflow. For symmetric signed bytes confined to $[-127, 127]$, the worst-case dot magnitude across $d$ dimensions reaches $d \cdot 127^2$, meaning even three aligned coordinates overflow signed INT16's limit of 32,767. Verifying accumulator bit width prevents arithmetic wrap from masking genuine quantization error.

Benchmark INT8 as the first candidate, then release it when measured quality, latency, and memory meet the declared budgets.

> [!WARNING]
> Deriving scales directly from the raw minimum and maximum of a calibration sample invites dynamic range collapse. If one coordinate spikes far outside the distribution, the scale stretches and ordinary values collapse into fewer integer buckets. Percentile clipping (such as a 99.9th percentile bound) preserves resolution for typical values while saturating outliers, but the clipping threshold is an empirical systems choice, not a universal constant.

The next example contrasts calibrating across an extreme spike against clipping ordinary coordinates cleanly onto $[-1, 1]$:

<!-- leetllm: test, output=show, deps=numpy, continue=int8-rescore, id=outlier-calibration -->
```python title="outlier-calibration-costs-resolution.py"
ordinary = np.linspace(-1.0, 1.0, 101)
with_outlier = np.append(ordinary, 25.0)


def quantize_reconstruct(values: np.ndarray, bound: float) -> np.ndarray:
    step = bound / 127.0
    q = np.clip(np.rint(values / step), -127, 127)
    return q * step


bound_from_max = float(np.max(np.abs(with_outlier)))
max_scaled = quantize_reconstruct(ordinary, bound_from_max)
clipped_scaled = quantize_reconstruct(ordinary, 1.0)
print(f"outlier-bound ordinary MAE={np.mean(np.abs(ordinary - max_scaled)):.4f}")
print(f"clipped-bound ordinary MAE={np.mean(np.abs(ordinary - clipped_scaled)):.4f}")
print(f"clipped_outlier_error={abs(25.0 - float(quantize_reconstruct(np.array([25.0]), 1.0)[0])):.1f}")

# Compare two closely aligned vectors under coarse vs. fine quantization steps.
nearby = np.vstack([l2_normalize([1.0, 0.05]), l2_normalize([1.0, 0.04])])
q_dir = np.array([1.0, 0.0])


def winner(rows: np.ndarray) -> int:
    normed = np.vstack([l2_normalize(row) for row in rows])
    return int(np.argmax(normed @ q_dir))


coarse = quantize_reconstruct(nearby, 25.0)
fine = quantize_reconstruct(nearby, 1.0)
assert winner(nearby) == winner(fine) == 1
assert np.allclose(coarse[0], coarse[1]) and winner(coarse) == 0
print(f"original winner={winner(nearby)}, coarse winner={winner(coarse)}, fine winner={winner(fine)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
outlier-bound ordinary MAE=0.0483
clipped-bound ordinary MAE=0.0019
clipped_outlier_error=24.0
original winner=1, coarse winner=0, fine winner=1
```
<!-- leetllm: output:end -->

Clipping shrinks ordinary-value error 25-fold while introducing a reconstruction error of 24.0 on the clipped outlier. Reporting bulk MAE alone hides that tail loss, so always pair quantile diagnostics with outlier-query checks. As the close-angle comparison confirms, an overly coarse scale collapses `[1.0, 0.05]` and `[1.0, 0.04]` onto the same integer level, letting row order swap top-1 ranking until tighter quantile calibration restores angular separation.

<figure>
  <img src="illustrations/_generated/scalar_calibration_dark.png" alt="AxisPlot over [-1, 1] shows how signed INT8 calibration with bound 25 creates coarse 0.197 quantization steps compared with clipped bound 1 at step 0.0079 closely tracking y = x. A ProgressList reports ordinary-range mean absolute error dropping from 0.0483 to 0.0019 (25x finer), while clipping saturates the single outlier 25 at 1.00." />
  <figcaption>Calibrating signed INT8 step size to max(|v|) = 25 stretches step width to 25/127 ≈ 0.197 and wastes resolution across [-1, 1]. Clipping calibration to bound 1 shrinks ordinary MAE 25x from 0.0483 to 0.0019 while saturating the single outlier at 1.00 (clipped error 24.0).</figcaption>
</figure>

### Product quantization (PQ)

SQ keeps one approximate number for every coordinate. If that still leaves too many bytes, PQ changes the unit of storage: instead of storing individual coordinates, it groups coordinates into subvectors and stores the IDs of nearby learned centroids. Jégou, Douze, and Schmid introduced this pattern by splitting each $d$-dimensional vector into $M$ distinct **subvectors**, each of dimension $d^* = d / M$:[^jegou2011]

See the storage change in a small example with $M=4$ on an 8-dimensional vector:

$$
\begin{aligned}
\text{Pairs: } &(1.2, 3.4),\ (0.8, 2.1),\\
               &(5.3, 1.7),\ (0.4, 3.2)\\
\text{FP32 payload: } &8 \times 4 = 32\text{ bytes}
\end{aligned}
$$

Each 2-d chunk maps to the nearest centroid ID in that subspace's codebook. Codebooks are fitted offline by clustering representative calibration subvectors with $k$-means separately in each subspace. With $K=256$ centroids per codebook, each centroid ID fits into a single byte (8 bits).

With 256 centroids per subspace, compressing 768-d float32 vectors (3,072 bytes) using 96 subspaces produces a 96-byte code, a **32x** payload cut. Compressing 1536-d float32 vectors (6,144 bytes) using 96 subspaces (16 dimensions per subvector) yields the same 96 bytes per vector, a **64x** compression ratio. The second configuration's shared codebooks occupy 1,572,864 bytes (1.5 MiB). Cache residency depends on hardware and competing working sets.

#### Asymmetric distance computation (ADC)

The real power of PQ is that scoring doesn't require decompressing database vectors. In Asymmetric Distance Computation (ADC), the query $\mathbf{q}$ is deliberately kept in full float32 precision. When a query arrives, the engine precomputes a small distance lookup table $T[m, k]$ across all subspaces $m \in \{1, \dots, M\}$ and centroids $k \in \{0, \dots, K-1\}$:[^jegou2011]

For an L2 distance objective:

$$
T[m, k] = \|\mathbf{q}_m - \mathbf{c}_{m, k}\|_2^2
$$

For approximate inner-product scoring:

$$
T[m, k] = \langle \mathbf{q}_m, \mathbf{c}_{m, k} \rangle
$$

For 96 subspaces and 256 centroids, a float32 lookup table contains $96 \times 256 \times 4\text{ bytes} = 98{,}304\text{ bytes}$ (96 KiB). Compare the 96 KiB working set with the target CPU's cache; profile the scoring path to measure latency.

Scoring a compressed database row with centroid IDs $(i_1, i_2, \dots, i_M)$ becomes $M$ table lookups and **floating-point additions** for these float32 tables:

$$
\begin{aligned}
\|\mathbf{q} - \mathbf{x}\|_2^2 &\approx \|\mathbf{q} - \hat{\mathbf{x}}\|_2^2 = \sum_{m=1}^{M} T[m, i_m] \\
\langle \mathbf{q}, \mathbf{x} \rangle &\approx \langle \mathbf{q}, \hat{\mathbf{x}} \rangle = \sum_{m=1}^{M} T[m, i_m]
\end{aligned}
$$

This path does not explicitly reconstruct each database vector during scoring. It streams compact codes and sums the selected table entries. FAISS implements PQ scoring; its specialized **FastScan** path uses smaller codebooks and quantized lookup entries for register-based lookups and integer accumulation. That is a separate implementation choice, with additional approximation, rather than what the float tables above do.[^faissFastScan2026]

In Symmetric Distance Computation (SDC), both query and database vectors are quantized, allowing a centroid-to-centroid table. ADC avoids that **additional query quantization**, but does not remove database approximation. There is no rule that SDC doubles score error or that ADC wins every ranking. Errors depend on both vectors and their reconstruction; consider one subspace with centroids 0 and 2:

<!-- leetllm: test, output=show -->
```python title="sdc-does-not-double-every-score-error.py"
centroids = (0.0, 2.0)
query = 1.4
quantized_query = min(centroids, key=lambda c: abs(query - c))
for document in (1.4, 2.0):
    quantized_document = min(centroids, key=lambda c: abs(document - c))
    true_distance = (query - document) ** 2
    adc = (query - quantized_document) ** 2
    sdc = (quantized_query - quantized_document) ** 2
    print(f"document={document}: true={true_distance:.2f}, ADC={adc:.2f}, SDC={sdc:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
document=1.4: true=0.00, ADC=0.36, SDC=0.00
document=2.0: true=0.36, ADC=0.36, SDC=0.00
```
<!-- leetllm: output:end -->

SDC happens to match the first true distance and misses the second. ADC does the reverse. Both documents have the same stored centroid here, so compressed scoring cannot distinguish their original coordinates. Compare aggregate retrieval metrics rather than inferring recall from one distance error.

Don't assume the unit-vector L2/IP identity survives compression. Even if the original vectors were normalized, reconstructed norms may vary, making L2 ADC and IP ADC rankings differ. The inner-product table gives $q^\top\hat{x}$, not necessarily $\cos(q,\hat{x})$. Cosine needs the reconstructed norm too, which can be computed from codebook norm tables. Choose the scoring objective explicitly and measure the resulting retrieval loss.[^faissMetrics2026]

**Optimized Product Quantization (OPQ)** learns an orthonormal transform $\mathbf{R}$ and codebooks to reduce reconstruction distortion for the selected subspace decomposition.[^ge2013] Apply the same transform to queries; an orthonormal transform preserves exact L2 and inner products before quantization. The paper's Gaussian analysis and PCA-based construction describe a specific case of OPQ; measure retrieval quality as well as reconstruction error. Residual / IVFADC pipelines first assign vectors to coarse clusters, then quantize $\mathbf{x}-\mathbf{c}_{\text{coarse}}$; scoring must account for the selected coarse centroid.[^jegou2011]

The snippet below encodes two 8D documents across four 2D subspaces, builds the per-query ADC lookup table, and verifies that summing table lookups matches direct squared distance to the reconstructed vectors:

<figure>
  <img src="illustrations/_generated/product_quantization_flow_dark.png" alt="Grid splits 8-dimensional embeddings into four 2d subspaces for two documents: FlashAttention stores centroid code [1, 1, 1, 1] and LayerNorm stores [0, 0, 0, 0]. Below a downward FlowArrow, a 2x4 Heatmap displays the asymmetric distance lookup table between unquantized query subvectors and centroid IDs 0 and 1, giving total squared distance 0.08 vs 56.57." />
  <figcaption>Each query subvector computes two squared distances into a lightweight per-query ADC table. Summing the four entries indexed by stored centroid IDs yields 0.08 for FlashAttention [1, 1, 1, 1] and 56.57 for LayerNorm [0, 0, 0, 0]; production 96-byte indexes scale the same lookup scheme to 96 subspaces with 256 centroids per codebook.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, continue=outlier-calibration, id=pq-lookups -->
```python title="pq-asymmetric-distance-lookups.py"
# Four 2-dimensional subspaces, each holding two centroids (ID 0 and ID 1).
codebooks = np.array([
    [[0.0, 0.0], [1.2, 3.4]],
    [[0.0, 0.0], [0.8, 2.1]],
    [[0.0, 0.0], [1.9, 5.3]],
    [[0.0, 0.0], [2.2, 2.4]],
])
query = np.array([1.1, 3.3, 0.7, 2.0, 1.8, 5.2, 2.1, 2.3])
database = {
    "FlashAttention": np.array([1.2, 3.4, 0.8, 2.1, 1.9, 5.3, 2.2, 2.4]),
    "LayerNorm": np.zeros(8),
}

# Encode each vector by finding the nearest centroid per 2d subspace.
stored_codes = {}
for name, row in database.items():
    chunks = row.reshape(4, 1, 2)
    dists = np.sum((chunks - codebooks) ** 2, axis=2)
    stored_codes[name] = np.argmin(dists, axis=1).astype(np.uint8)

# Compute one per-query lookup table T[subspace, centroid_id] with unquantized q.
lookup = np.sum((query.reshape(4, 1, 2) - codebooks) ** 2, axis=2)
scores = {
    name: float(lookup[np.arange(4), code].sum())
    for name, code in stored_codes.items()
}

for name, code in stored_codes.items():
    reconstructed = codebooks[np.arange(4), code].reshape(-1)
    direct = float(np.sum((query - reconstructed) ** 2))
    assert np.isclose(scores[name], direct, atol=1e-12)
    assert code.nbytes == 4

winner = min(scores, key=scores.get)
assert winner == "FlashAttention"
print({name: round(score, 2) for name, score in scores.items()})
print(f"ADC nearest code: {winner}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
{'FlashAttention': 0.08, 'LayerNorm': 56.57}
ADC nearest code: FlashAttention
```
<!-- leetllm: output:end -->

More compression can lower recall. The loss depends on subspace count, centroid count, query distribution, and reranking budget. Benchmark PQ against the real query distribution instead of trusting one headline number.

### Binary quantization (BQ)

If one byte per coordinate still misses the budget, binary quantization keeps only one bit per dimension. Values greater than zero map to `1`, while zero or negative numbers map to `0`. Float magnitude is completely discarded, leaving only the coordinate's sign bit.

Thresholding the original coordinates at zero uses $d$ **fixed coordinate hyperplanes**. Random-hyperplane hashing samples hyperplane orientations instead. For $b$ independently sampled isotropic random hyperplanes, the expected fraction of differing hash bits for two nonzero vectors is:[^charikar2002Hyperplanes]

$$
\mathbb{E}_{\text{random hyperplanes}}\left[\frac{D_H(h(\mathbf{u}),h(\mathbf{v}))}{b}\right] = \frac{\theta}{\pi} = \frac{\arccos(\cos(\mathbf{u}, \mathbf{v}))}{\pi}
$$

This expectation holds over random isotropic hyperplanes, and adding independent bits concentrates the empirical Hamming fraction tightly around the true normalized angle. Taking raw encoder coordinate signs directly can diverge systematically whenever coordinates carry unequal variance or correlation. Balanced marginal bit frequencies alone never reproduce the random-hyperplane joint distribution, so sign-quantized embeddings must still be verified on retrieval queries.

Packing sign bits into machine words enables similarity scanning without floating-point arithmetic or distance lookup tables:

1. **Bitwise XOR (`^`):** Produces a `1` at every bit position where signs disagree, and `0` where they match.
2. **Population count:** Counts set bits across machine words using scalar or SIMD popcount instructions, accumulating totals across all packed bytes of each vector.

On CPUs with AVX-512 VPOPCNTDQ, a single vector popcount scans 512 packed bits per instruction after bitwise XOR. While coordinate packing shrinks vector payloads 32x relative to float32, total serving RAM and latency still depend on HNSW graph links, query vectors, metadata filters, and rescoring fetches. End-to-end profiling across realistic traffic reveals how much of that payload reduction translates into wall-clock speedup.

Evaluate two failure modes carefully before deploying one-bit search:

- **Bit budget and ties:** A 384-bit vector offers only 385 distinct Hamming distances, ensuring heavy score ties across 100,000 candidates. Increasing code length alone does not eliminate cutoff ambiguity or restore magnitude distinctions, so measure recall across candidate shortlist depths directly.
- **Bit distribution:** Coordinates that keep the same sign across most documents add almost zero separation under Hamming comparison. Inspect per-bit activation frequencies and consider zero-centering embeddings (after validating geometry changes) or quantization-aware training that regularizes bit balance directly rather than relying solely on saturating nonlinearities such as `tanh`.

Qdrant recommends high-dimensional, centered embeddings for binary quantization and flags lower widths for task-specific validation.[^qdrant2024] Packing sign bits cleanly with `np.packbits` keeps vector layouts compact and unambiguous:

<!-- leetllm: test, output=show, deps=numpy, continue=pq-lookups, id=binary-packing -->
```python title="binary-quantization-hamming.py"
vec_a = np.array([0.3, -0.1, 0.8, -0.4])
vec_b = np.array([0.5, -0.2, 0.7, 0.1])


def pack_sign_bits(vector) -> tuple[np.ndarray, int]:
    arr = np.asarray(vector, dtype=np.float64)
    bits = (arr > 0).astype(np.uint8)
    packed = np.packbits(bits, bitorder="little")
    return packed, arr.size


def hamming_distance(packed_a: tuple[np.ndarray, int], packed_b: tuple[np.ndarray, int]) -> int:
    bytes_a, dims_a = packed_a
    bytes_b, dims_b = packed_b
    if dims_a != dims_b:
        raise ValueError("binary dimensions differ")
    xor_val = int.from_bytes(bytes_a.tobytes(), "little") ^ int.from_bytes(bytes_b.tobytes(), "little")
    return xor_val.bit_count()


packed_a = pack_sign_bits(vec_a)
packed_b = pack_sign_bits(vec_b)
assert hamming_distance(packed_a, packed_b) == 1
assert packed_a[0].nbytes == 1
assert pack_sign_bits(np.ones(9))[0].nbytes == 2
print(f"packed_a={packed_a[0].tobytes().hex()}, packed_b={packed_b[0].tobytes().hex()}, hamming={hamming_distance(packed_a, packed_b)}")
print(f"payload_bytes={packed_a[0].nbytes}; dimensions={packed_a[1]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
packed_a=05, packed_b=0d, hamming=1
payload_bytes=1; dimensions=4
```
<!-- leetllm: output:end -->

Notice how two vectors with different coordinate signs at index 3 (`-0.4` vs `+0.1`) pack cleanly via `bitorder="little"` into `0x05` (`0b0101`) and `0x0d` (`0b1101`), differing by one bit in `ceil(dims / 8)` zero-padded bytes. Because Hamming distance discards coordinate magnitudes, even sign-balanced vectors can lose important ranking distinctions unless evaluated against downstream relevance.[^sbertEmbeddingQuantization2026] In the diagnostic vectors below, both documents share mean coordinate zero and two positive signs, yet their coordinate alignments tell two different stories under cosine vs sign comparison:

<!-- leetllm: test, output=show, deps=numpy, continue=binary-packing, id=coordinate-sign-collision -->
```python title="coordinate-signs-are-not-random-hyperplanes.py"
import math

left = np.array([1.0, 0.01, -1.0, -0.01])
right = np.array([0.01, 1.0, -0.01, -1.0])
assert np.isclose(left.sum(), 0.0, atol=1e-15) and np.isclose(right.sum(), 0.0, atol=1e-15)
assert int((left > 0).sum()) == int((right > 0).sum()) == 2
distance = hamming_distance(pack_sign_bits(left), pack_sign_bits(right))
cosine = dot(l2_normalize(left), l2_normalize(right))
angle_fraction = math.acos(cosine) / math.pi
print(f"coordinate-sign Hamming fraction={distance / 4:.3f}")
print(f"cosine={cosine:.6f}; angle/pi={angle_fraction:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
coordinate-sign Hamming fraction=0.000
cosine=0.019998; angle/pi=0.493634
```
<!-- leetllm: output:end -->

> **Key insight:** Coordinate-sign hashing is not the same as random-hyperplane LSH. Two nearly orthogonal vectors (`cosine = 0.020`) can produce identical sign bits (`Hamming = 0`) when their dominant energy sits on different positive axes, which is why 1-bit codes need full-precision rescoring on a shortlist.

| Dimension | Practical effect |
|-----------|------------------|
| Compression | 32x raw payload reduction from float32 when the dimension count is divisible by 8, before metadata. |
| Speed | Packed bits use XOR plus popcount, so both memory traffic and arithmetic drop. Implementations can add architecture-specific SIMD for packed-byte comparisons. |
| Quality | Sign collisions can change ranking. Use it for shortlisting only when measured recall supports that choice. |

You don't have to stop at one bit. Engines such as Qdrant also support 1.5-bit and 2-bit binary encodings alongside TurboQuant, which applies a random rotation before compression and scores full-precision queries against compressed documents.[^qdrant2024] Exactly 1.5 bits per coordinate yields a $32/1.5 \approx 21.3\times$ coordinate-payload reduction; measure full index RAM including retained originals and HNSW graph links before sizing memory.

### Shortlist cheaply, then rescore

When a compressed first stage loses too much ordering detail, consider a **coarse-to-fine retrieval funnel**:

1. **Stage 1: Candidate generation.** Search compressed codes or supported short prefixes. Test shortlist depths from 100 to 1,000 against measured recall and latency to learn whether millions of rows fit single-digit milliseconds.
2. **Corpus Metadata Filter.** Restrict candidates against metadata attributes such as `corpus_tier`, `release`, or programming language. Evaluating metadata predicates natively during graph traversal or bitmap masking prevents non-matching entries from crowding out sparse valid hits.
3. **Stage 2: Higher-precision rescoring.** Fetch retained vectors for filtered survivors. Scoring retained original FP32 vectors removes the first-stage codec approximation within that shortlist; SQ8 remains an approximation. Fetch latency and total retained storage belong in the budget.
4. **Stage 3: Optional cross-encoder reranking.** Jointly score a compact shortlist of filtered query-passage pairs when measured relevance gains justify the model and latency cost.

These stages trade memory, I/O, and compute without guaranteeing dramatic memory reductions or near-perfect recall, because rescoring only reorders shortlisted survivors and cannot recover an omitted passage. Keeping nearest-neighbor recall against exact FP32 search distinct from end-to-end relevance recall prevents conflating index traversal loss with encoder errors. When sign codes collide, Hamming scanning can place an unverified draft right beside the target passage (`linear-attn-draft` vs `flash-attention-v2`), whereas full-precision cosine rescoring separates them (`1.000` vs `0.410`). Whenever a metadata filter restricts `corpus_tier == "verified"`, evaluating that predicate inline during search prevents disqualified neighbors from crowding out valid hits under tight shortlist cutoffs.

<figure>
  <img src="illustrations/_generated/hamming_vs_precise_dark.png" alt="Grid compares query q = [0.8, -0.4, 0.6, -0.2] (sign bits [1, 0, 1, 0]) against three candidates: linear-attention-draft and flash-attention-v2 tie at Hamming distance 0 even though exact cosines differ (0.410 vs 1.000), while adamw-decay has Hamming distance 2 and cosine -0.435. Below a FlowArrow, ProgressList and summary Grid show top-2 binary shortlisting plus exact rescoring recovering flash-attention-v2." />
  <figcaption>Both linear-attn and flash-attn-v2 map to sign code 1010 and tie at Hamming distance 0 against query 1010, even though exact cosines sit at 0.410 and 1.000. Shortlisting K = 2 before full-precision rescoring restores flash-attn-v2 cleanly; inline metadata filtering can also prune deprecated draft rows prior to top-K selection.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, continue=coordinate-sign-collision -->
```python title="binary-shortlist-rescore-filter.py"
labels = ["linear-attn-draft", "flash-attention-v2", "adamw-decay"]
verified_tier = np.array([False, True, True])
documents = np.array([
    [0.05, -2.00, 0.05, -2.00],  # Matching sign pattern, low cosine (0.410), draft tier.
    [0.78, -0.38, 0.58, -0.22],  # Matching sign pattern, high cosine (1.000), verified tier.
    [0.10, 0.60, -0.40, -0.20],
])
query = np.array([0.80, -0.40, 0.60, -0.20])
expected = "flash-attention-v2"

q_bits = query > 0
hamming = np.sum((documents > 0) != q_bits, axis=1)
unit_query = l2_normalize(query)


def shortlist_at(k: int, *, prefilter: bool) -> list[int]:
    indices = [i for i in range(len(labels)) if not prefilter or verified_tier[i]]
    return sorted(indices, key=lambda i: (int(hamming[i]), i))[:k]


def rescore(shortlist: list[int]) -> str | None:
    valid = [i for i in shortlist if verified_tier[i]]
    if not valid:
        return None
    winner = max(valid, key=lambda i: dot(l2_normalize(documents[i]), unit_query))
    return labels[winner]


shortlist = shortlist_at(2, prefilter=False)
served = rescore(shortlist)
assert rescore(shortlist_at(1, prefilter=False)) is None
assert rescore(shortlist_at(1, prefilter=True)) == expected

recall_at_2 = expected in [labels[i] for i in shortlist]
print(f"binary shortlist={[labels[i] for i in shortlist]}, recall@2={recall_at_2}")
print(f"rescored winner={served}, verified={bool(verified_tier[labels.index(served)])}")
print(f"postfiltered_top1={rescore(shortlist_at(1, prefilter=False))}")
print(f"prefiltered_top1={rescore(shortlist_at(1, prefilter=True))}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
binary shortlist=['linear-attn-draft', 'flash-attention-v2'], recall@2=True
rescored winner=flash-attention-v2, verified=True
postfiltered_top1=None
prefiltered_top1=flash-attention-v2
```
<!-- leetllm: output:end -->

With unfiltered $K=1$, the first-row Hamming tie favors the unverified draft and post-filtering collapses to an empty result. Expanding the coarse shortlist to $K=2$ keeps `flash-attention-v2` in contention so exact cosine rescoring surfaces it cleanly, while native metadata pre-filtering during ANN traversal preserves valid candidates even at $K=1$. Measure filtered graph recall explicitly on real selective predicates rather than assuming post-filtering will never starve narrow cutoffs.

```checkpoint
Why is binary quantization usually paired with reranking instead of used as the final answer?
---
Binary quantization keeps only one sign bit per dimension, so Hamming distance is fast but coarse. Higher-precision rescoring may improve ordering within the shortlist. Use it, and any optional cross-encoder, when held-out gains justify the cost. It cannot recover missing candidates, and INT8 still approximates the retained FP32 vectors.
```

## Indexing the compressed codes

Compression answers "how many bytes per row?" Approximate Nearest Neighbor (ANN) search answers "how many rows do we visit?" Keep those levers separate. Exact composition is library-specific: some engines combine HNSW graphs with scalar or product quantization, while others keep full-precision vectors beside compressed codes for rescoring.

<span data-glossary="hnsw">HNSW (Hierarchical Navigable Small World)</span> organizes vectors into a hierarchy of proximity graphs.[^malkov2018] Implementations such as hnswlib expose construction and search controls separately.[^hnswlibParameters2026]

- **Layer 0 (Base layer):** Contains every vector in the collection connected by local neighborhood edges.
- **Upper layers:** Contain nested, exponentially sparser subsets of nodes. One common maximum-level sampler is $L=\lfloor-\ln(U)m_L\rfloor$, with $U$ uniform on $(0,1)$ and $m_L=1/\ln M$. Thus $\Pr(L\ge\ell)=e^{-\ell/m_L}=M^{-\ell}$. The fraction retained from one layer to the next is **$1/M$**, not $1/\ln M$. The latter is the exponential scale parameter.[^malkov2018]
- **Search traversal:** Search begins at the top layer from a fixed entry point. At each upper layer, search performs a greedy 1-NN walk, hopping along express links until no neighbor is closer to the query than the current node. It then drops to that same node in the layer below and resumes. At Layer 0, the algorithm switches from a greedy 1-NN walk to a prioritized beam search of size $ef_{\text{search}}$ to assemble the candidate shortlist.

At $M=32$, the scale parameter $m_L$ is about 0.289 while only 3.125% ($1/32$) of nodes reach layer 1:

<!-- leetllm: test, output=show -->
```python title="hnsw-level-scale-is-not-a-probability.py"
from math import exp, log

M = 32
level_scale = 1 / log(M)
print(f"M={M}; level_scale={level_scale:.6f}")
for level in (1, 2):
    probability = exp(-level / level_scale)
    print(f"P(max_level >= {level})={probability:.6f}")
    assert abs(probability - M ** (-level)) < 1e-15
```

<!-- leetllm: output:start -->
```text title="Output" output compact
M=32; level_scale=0.288539
P(max_level >= 1)=0.031250
P(max_level >= 2)=0.000977
```
<!-- leetllm: output:end -->

When a quantized ANN index still misses the target passage, diagnosing which knob adjusts live without rebuilding the graph saves days of compute. HNSW implementations expose three primary tuning controls across build and serving stages:

| Control | Changed during | Systems trade-off | Operational rule |
|:--------|:---------------|:------------------|:-----------------|
| **M** (connectivity) | Index build | Controls neighbor-link capacity and graph memory. hnswlib estimates roughly $8M$–$10M$ bytes per stored element for this overhead. Actual link counts and representations vary. | Compare rebuilt graphs at fixed queries and search settings; more links cost memory and construction work. |
| **ef_construction** | Index build | Controls candidate exploration during insertion. More exploration can improve graph quality but lengthens construction; improvements can saturate. | Compare build time, index size, and recall at the intended query budget. No universal build-time complexity follows from one parameter. |
| **ef_search** | Query serving | Controls the retained nearest-neighbor candidate list. hnswlib requires it to be at least requested $k$; graph visits are not limited to exactly that many rows. | Measure recall and tail latency together. Lowering it under load can change answer coverage, so keep an explicit quality requirement. |

As a concrete sizing check, reserving $2M$ four-byte neighbor IDs at layer 0 consumes 256 bytes of neighbor slots per node when $M=32$ before counting upper layers, metadata, or labels. That link table often matches or exceeds a 96-byte PQ or 192-byte binary payload in total index footprint. At query time, `hnswlib` configures search beam width via `set_ef` (`efSearch` or `ef_search` in other engines), which must remain at least as large as the requested neighbor count $k$.[^hnswlibParameters2026]

Always begin tuning with query-time exploration depth while recording Recall@K and P99 latency jointly. Rebuild with larger `M` or `ef_construction` only if graph connectivity hits a recall ceiling within the latency budget. While public suites such as MTEB[^muennighoff2023] help narrow candidate embedding models across task families, benchmark averages never reveal which quantized graph retrieves `flash-attention-v2` cleanly under production memory limits and selective filters:

| Decision | Baseline to record | Accept a change only when |
|:---------|:-------------------|:--------------------------|
| Model family | Full-precision Recall@K on verified queries | Target slices and latency meet targets |
| Supported prefix width | Full trained width with matching scoring | Measured recall drop stays within release tolerances |
| SQ, PQ, or BQ | Uncompressed shortlist and final ranking | Compressed shortlist preserves top-K evidence recall |
| ANN settings | Exact-search results on a labeled sample | Recall and P99 latency both meet targets |

Recording each model identifier, prefix width, normalization convention, quantizer, HNSW build parameters, shortlist depth, and reranker in one versioned experiment log keeps every trade-off reproducible. Whenever a compressed-index upgrade shifts live search output, comparing adjacent entries isolates which parameter change altered Recall@K or latency. Keeping these experiment records paired with saved evaluation queries turns every production regression into a controlled comparison instead of guesswork.

## Bytes, RAM, and the shortlist bill

The one-million-row example captures only raw coordinate storage before index scale sets in. Because float32 arrays grow linearly with vector count and compete for RAM with graph links and metadata indexes, comparing memory-mapped, hybrid, and quantized deployments demands full latency and RSS measurements rather than judging from code byte counts alone. Holding the 1,536-d width from the sizing example fixed and reporting capacities in binary units (before HNSW links, metadata columns, and replicas) highlights the scale jump across codecs:

| Scale | Raw payload (1536d, FP32) | With INT8 SQ | With PQ (96-byte code) |
|:------|:-------------------------:|:------------:|:----------------------:|
| 1M vectors | 5.72 GiB | 1.43 GiB | 92 MiB |
| 10M vectors | 57.2 GiB | 14.3 GiB | 916 MiB |
| 100M vectors | 572 GiB | 143 GiB | 8.94 GiB |
| 1B vectors | 5.6 TiB | 1.4 TiB | 89 GiB |

## Practice: choose a retrieval stack

Suppose an index serves 50 million 768-dimensional machine-learning corpus embeddings where deprecated draft rows such as `linear-attn-draft` must be filtered out by `corpus_tier="verified"`. The P99 latency budget is 60 ms, and holding raw FP32 payloads in RAM starves adjacent serving components. Designing a concrete architecture to benchmark requires weighing each trade-off carefully:

1. Would you keep raw FP32 vectors resident in RAM for first-stage search?
2. When ingestion L2-normalizes vectors, would you configure online search with cosine or inner product?
3. Would you start benchmarking with INT8 SQ, PQ, or BQ for the first stage?
4. Where does full-precision float compute belong in the pipeline?
5. Which evaluation suite prevents a quantized index from silently dropping relevant evidence?

Answering each question systematically anchors the serving architecture to exact byte counts, metric consistency, and metadata selectivity before commissioning index benchmarks. The design sketch below summarizes the quantitative trade-offs at 50-million-vector scale:

- Raw FP32 requires 50M × 768 × 4 = 153.6 GB (about 143.1 GiB) before graph links and metadata. Moving to INT8 SQ shrinks coordinate arrays to 38.4 GB, while 96-byte PQ codes need only 4.8 GB; factor shared codebooks and optional retained FP32 rescore copies into node RAM planning.
- Configure online index scoring as inner product when vectors are already unit-normalized, yielding identical rankings to cosine without repeated division.
- Benchmark INT8 SQ first because its 4x compression introduces far less ranking distortion than aggressive PQ or binary codes; adopt coarser codecs only when measured RAM savings justify widened shortlists.
- Reserve full-precision vector reads and optional cross-encoder computation for the top-$K$ filtered shortlist, keeping disk or remote vector fetches proportional to $K$ rather than corpus size $N$.
- Assemble a held-out evaluation suite pairing verified passages (`flash-attention-v2`, `rope-scaling-guide`) with tempting near-matches (`linear-attn-draft`) filtered by metadata, verifying zero Recall@K regression relative to the full-precision baseline.

## Common pitfalls

When retrieval quality shifts in production, symptoms usually isolate cleanly to one stage of the vector search path:

- Recall drops after INT8 deployment. Inspect outlier distortion, clipping thresholds, omitted coordinate scales during scoring, and offline/online normalization mismatches before re-tuning calibration quantiles.
- ANN results pass offline evaluation yet fail on live traffic. Check whether held-out queries mirror real phrasing, metadata filter selectivity, and <span data-glossary="chunking">chunking</span> granularity.
- Query latency stays high after quantization. Profile graph exploration hops, disk vector fetches during rescoring, and reranker batch overhead rather than assuming vector code size dominates latency.
- Index upgrades scramble existing rankings. Check embedding version, dimensionality, normalization flag, and quantizer parameters, building versioned indexes separately instead of mixing incompatible representations.

Every ranking shift traces cleanly to direction, vector length, prefix width, quantization step, or metadata filter placement, each isolated by the diagnostic checks above.

```checkpoint
A range-offset codec covers [4, 6], maps endpoints to unsigned codes 0 and 255, and stores code 51. Which reconstruction and proposed integer-zero-point diagnosis are correct?

- Reconstruction 4.4; proposed zero-point −510 is outside the byte domain.
- Reconstruction 0.4; proposed zero-point −510 is outside the byte domain.
- Reconstruction 4.4; proposed zero-point −510 is a valid byte-domain offset.
- Reconstruction 5.1; proposed zero-point −510 is a valid byte-domain offset.
---
Reconstruction 4.4; proposed zero-point −510 is outside the byte domain.

The step is (6−4)/255=2/255, so 4+51×2/255=4.4. An attempted integer zero-point −4/(2/255)=−510 is outside 0..255. The real offset 4 belongs in the range-offset reconstruction and is not itself an unsigned-byte integer zero-point.
```

```checkpoint
A scalar-code experiment narrows its calibration bound from 12 to 3 on a held-out set containing ordinary coordinates in [−3, 3] and an outlier at 12. Which summary accurately states both the resolution change and the required quality check?

- Ordinary step is 4× finer, outlier error is 9; report both and remeasure held-out shortlist recall.
- Ordinary step is 4× finer, outlier error is 0; report both and remeasure held-out shortlist recall.
- Ordinary step is 4× coarser, outlier error is 9; report both and remeasure held-out shortlist recall.
- Ordinary step is 4× coarser, outlier error is 0; report both and remeasure held-out shortlist recall.
---
Ordinary step is 4× finer, outlier error is 9; report both and remeasure held-out shortlist recall.

Under symmetric INT8 calibration on [−127, 127], the step shrinks fourfold from 12/127 to 3/127 across ordinary values while clipping saturates the outlier 12 down to 3 (absolute error 9). Reporting bulk reconstruction MAE alone never proves downstream shortlist recall or outlier behavior.
```

```mastery-quiz
[
  {
    "question": "A new query is [0, 2]. Document A is [3, 4] and document B is [0, 3]. Which pair of winners is correct for raw dot product and cosine?",
    "options": [
      "Raw dot selects A; cosine selects B.",
      "Raw dot selects B; cosine selects A.",
      "Raw dot selects A; cosine selects A.",
      "Raw dot selects B; cosine selects B."
    ],
    "answer": "Raw dot selects A; cosine selects B.",
    "explanation": "Raw dot gives A 8 and B 6, so A wins. Cosine divides by lengths: A gives 8/(2×5)=0.8 and B gives 6/(2×3)=1, so B wins. Normalizing only the query leaves raw document norms in the score."
  },
  {
    "question": "A unit-vector retrieval service receives a finite query [1e-300, 1e-300]. Its naive squared norm underflows to zero. Which repair preserves the direction while retaining an explicit zero-vector failure path?",
    "options": [
      "Scale by the largest absolute coordinate, then normalize the scaled vector; reject a truly zero maximum.",
      "Add 1e-6 to the squared norm, then normalize the original coordinates; reject a truly zero maximum.",
      "Replace underflowed coordinates by zeros, then use zero dot scores; reject a truly zero maximum.",
      "Multiply every score by the largest coordinate, then omit document normalization; reject a truly zero maximum."
    ],
    "answer": "Scale by the largest absolute coordinate, then normalize the scaled vector; reject a truly zero maximum.",
    "explanation": "The nonzero maximum is 1e-300. Dividing first yields [1,1], which safely normalizes to [1/√2,1/√2]. A fixed epsilon changes this tiny nonzero direction into a near-zero vector; replacing it with zeros destroys the direction. Rescaling scores does not repair invalid norm computation or an omitted document transform."
  },
  {
    "question": "In a Matryoshka prefix test, query [0, 1, 1] has relevant passage B [0, 1, 1] and distractor A [0, 1, 0], stored first. An index truncates vectors to two coordinates, normalizes them, and breaks ties by row order. What does keeping full width show?",
    "options": [
      "Full width selects B; the prefix selects A; renormalization cannot restore the discarded coordinate.",
      "Full width selects A; the prefix selects B; renormalization cannot restore the discarded coordinate.",
      "Full width selects B; the prefix selects B; renormalization preserves the discarded distinction.",
      "Full width selects A; the prefix selects A; renormalization preserves the discarded distinction."
    ],
    "answer": "Full width selects B; the prefix selects A; renormalization cannot restore the discarded coordinate.",
    "explanation": "Full-width cosine is 1 for B and 1/√2 for A. Both two-coordinate prefixes normalize to [0,1], so the specified first-row tie rule selects A. This result diagnoses this cut; Matryoshka support and held-out retrieval still require their own checks."
  },
  {
    "question": "A new store has 3 million vectors at 1024 dimensions. It keeps original FP32 vectors for rescoring and adds PQ codes with 128 one-byte IDs per row. Ignoring shared codebooks and index metadata, which pair is the PQ-code payload and combined vector payload in decimal GB?",
    "options": [
      "0.384 GB of codes; 12.672 GB combined.",
      "0.384 GB of codes; 12.288 GB combined.",
      "3.072 GB of codes; 15.360 GB combined.",
      "0.048 GB of codes; 12.336 GB combined."
    ],
    "answer": "0.384 GB of codes; 12.672 GB combined.",
    "explanation": "Codes require 3,000,000×128=384,000,000 bytes, or 0.384 decimal GB. Retained FP32 vectors still require 3,000,000×1024×4=12.288 GB. Their combined payload is 12.672 GB. One byte per coordinate describes SQ rather than these subspace IDs; treating an 8-bit ID as one bit understates the code payload."
  },
  {
    "question": "For query [1, 2], two stored scalar-code rows are A [50, 0] and B [0, 80]. Their per-dimension scales are [0.1, 0.01]. Which scaled inner-product scores should the rescorer use?",
    "options": [
      "A = 5; B = 1.6.",
      "A = 50; B = 160.",
      "A = 0.5; B = 16.",
      "A = 5; B = 0.8."
    ],
    "answer": "A = 5; B = 1.6.",
    "explanation": "Reconstruct each coordinate with its own scale before the dot product: A is 1×0.1×50=5 and B is 2×0.01×80=1.6. Raw codes incorrectly favor B. Swapping scales or dropping the second query coefficient produces other tempting values."
  },
  {
    "question": "An INT8 matrix product uses query [120, 120] and database rows [120, 120] and [119, 119]. Narrow results are [−128, −112]. Which correction recovers the intended integer ranking?",
    "options": [
      "Widen operands before multiplication; scores [28800, 28560] select the first row.",
      "Cast the completed result to INT32; scores [28800, 28560] select the first row.",
      "Widen operands before multiplication; scores [−128, −112] select the second row.",
      "Cast the completed result to INT32; scores [−128, −112] select the first row."
    ],
    "answer": "Widen operands before multiplication; scores [28800, 28560] select the first row.",
    "explanation": "The exact products sum to 2×120×120=28800 and 2×119×120=28560. Narrow INT8 wrapping loses their high bits and reverses the order. Casting afterward retains [−128,−112]. Widening before the products and using a sufficient accumulator preserves the correct sums."
  },
  {
    "question": "A fresh two-subspace PQ example has query pairs [1, 3] and [2, 4]. Codebook centroids are [0,0]/[1,2] and [0,0]/[2,5]. What squared-L2 ADC totals do stored IDs [1,1] and [0,0] select?",
    "options": [
      "2 and 30.",
      "0 and 30.",
      "2 and 0.",
      "30 and 2."
    ],
    "answer": "2 and 30.",
    "explanation": "The all-one code selects (1−1)²+(3−2)²=1 and (2−2)²+(4−5)²=1, totaling 2. The all-zero code selects 1²+3²=10 and 2²+4²=20, totaling 30. Quantizing the query too would be a different computation; ADC retains its full values."
  },
  {
    "question": "A nine-dimensional query is positive at dimensions 0, 3, 5 and 8 and negative elsewhere. The index packs positive signs as ones, with dimension 0 in the low bit and the low byte first. A document's packed bytes are [24, 00] in hexadecimal. What are the query's hexadecimal bytes and its Hamming distance from the document?",
    "options": [
      "[29, 01] with distance 3.",
      "[94, 80] with distance 4.",
      "[29, 01] with distance 4.",
      "[94, 80] with distance 3."
    ],
    "answer": "[29, 01] with distance 4.",
    "explanation": "Bits 0, 3 and 5 contribute 1 + 8 + 32 = 41, or hexadecimal 29. Dimension 8 sets the low bit of the second byte. Its seven padding bits stay zero. XOR with the document gives [0D, 01], with three set bits in the first byte and one in the second. The distance is 4. The bytes [94, 80] reverse the bit order within each byte. A distance of 3 counts only the first byte."
  },
  {
    "question": "An index ranks passages Transformer-v1, FlashAttention, and SparseAttention in that order and allocates one shortlist slot. Only passages matching corpus_tier=\"verified\" (FlashAttention and SparseAttention) are eligible during search; by final display time, only Transformer-v1 and SparseAttention remain non-deprecated. The index evaluates the corpus_tier predicate inline during search. Which passage enters the shortlist slot, and what can the pipeline return after checking deprecation?",
    "options": [
      "Keep Transformer-v1. Return its passage.",
      "Keep FlashAttention. Return no passage.",
      "Keep FlashAttention. Return SparseAttention instead.",
      "Keep Transformer-v1. Return no passage."
    ],
    "answer": "Keep FlashAttention. Return no passage.",
    "explanation": "Inline search pre-filtering retains only verified passages, placing FlashAttention ahead of SparseAttention in the single shortlist slot. When the post-search deprecation check rejects FlashAttention, no verified fallback remains in the fixed 1-slot shortlist, so returning no passage is correct rather than falling back outside the shortlist or returning a deprecated draft."
  },
  {
    "question": "A graph uses M = 16 and the maximum-level sampler taught here. On a fixed built graph, query ef values 32, 64 and 128 measure Recall@10/p99 of 0.90/50 ms, 0.97/74 ms and 0.98/102 ms. The gates are recall at least 0.96 and p99 at most 80 ms. Which pair is the layer-two retention probability and a measured serving choice?",
    "options": [
      "1/256 and ef 64.",
      "1/log(16) and ef 64.",
      "1/16 and ef 128.",
      "1/256 and ef 32."
    ],
    "answer": "1/256 and ef 64.",
    "explanation": "The level sampler yields P(L≥2)=M^−2=1/256, whereas 1/log M is only its exponential scale factor. Here efSearch=64 satisfies both recall and latency targets, while efSearch=32 falls short on recall and efSearch=128 misses the latency limit. Rebuilding the index with a different M or efConstruction invalidates these measurements and requires re-benchmarking."
  }
]
```

> **Next:** Continue to [Scaled Dot-Product Attention](/learn/scaled-dot-product-attention). Attention also compares query and key vectors with inner products, but turns their scores into weights over tokens. The next lesson explains why dividing by $\sqrt{d_k}$ helps control score variance before softmax; it isn't cosine normalization.
