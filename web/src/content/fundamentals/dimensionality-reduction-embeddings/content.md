---
{
  "id": "dimensionality-reduction-embeddings",
  "title": "Dimensionality Reduction for Embeddings",
  "slug": "dimensionality-reduction-embeddings",
  "category": "Embeddings & Vector Search",
  "difficulty": "Medium",
  "coverImage": "illustrations/_generated/dim_reduction_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Microsoft",
    "Pinecone"
  ],
  "shortDescription": "Shortening dense embeddings saves gigabytes of RAM and can drop the exact passage a query needs. Measure Recall@K before trusting PCA, random projection, Matryoshka prefixes, or quantization.",
  "keyConceptsTested": [
    "Distance concentration assumptions and graph index memory budgets",
    "PCA: SVD decomposition, covariance geometry, and explained variance ratio",
    "Random projection: Johnson-Lindenstrauss lemma distance preservation bounds",
    "Manifold visualization: t-SNE crowding problem vs UMAP cross-entropy objective",
    "Scalar quantization (SQ8) and SIMD hardware acceleration",
    "Product quantization (PQ) and Asymmetric Distance Computation (ADC)",
    "Matryoshka Representation Learning (MRL) and two-stage cascade search",
    "Downstream retrieval evaluation: Recall@K and nDCG trade-offs"
  ],
  "section": "Applied LLM Engineering",
  "order": 1
}
---

Even after aligning a model's output format with a [chat template](/learn/instruction-tuning-chat-templates), a retrieval-augmented system still succeeds or fails on the passages placed in its prompt. Suppose an engineer asks, "How does FlashAttention avoid quadratic HBM reads while computing exact softmax?" An accurate dense retriever must surface the passage explaining SRAM tiling and online softmax rescaling, rather than letting a generic overview of multi-head attention push that mechanism off the top-$K$ list. Every design trade-off in this chapter revolves around keeping that decisive passage high in the ranking while cutting storage cost.

Each document chunk sits in RAM or flash storage as a high-dimensional <span data-glossary="embedding">embedding</span>. When an index scales to tens of millions of <span data-glossary="vector">vectors</span>, keeping every coordinate in `float32` stresses memory budgets and saturates memory bandwidth during search. Compressing those vectors lowers hardware costs and latency, yet aggressive reduction can silently drop relevant evidence. Keeping two engineering objectives cleanly separated prevents premature trade-offs:

1. **Retrieval compression:** Store and search shorter or quantized representations while keeping top-$K$ relevant passages intact within latency and RAM budgets.
2. **Exploratory visualization:** Project high-dimensional vectors onto two coordinates so you can spot clusters, anomalies, and misrouted queries before checking hypotheses back in the original space.

Both workflows shrink dimensionality, yet their acceptance tests differ completely. A production search representation is judged by held-out retrieval quality, total RAM, and query latency. A two-dimensional projection is judged by diagnostic clarity and nearest-neighbor faithfulness, never serving live retrieval directly.

<figure>
  <img src="illustrations/_generated/dim_reduction_dark.png" alt="Two paired charts connect storage savings with retrieval recall. Top: ProgressList compares raw payload RAM for 10 million vectors dropping from 61.4 GB at 1536d float32 to 10.2 GB at 256d float32, 2.56 GB at 256d int8, and 0.16 GB with PQ-16. Bottom: AxisPlot plots Recall@4 across 4, 8, 16, 32, and 64 dimensions on 64d clustered embeddings: PCA reaches 0.98 and MRL-ordered prefix reaches 0.95 by 16d while Gaussian random projection reaches 0.59." />
  <figcaption>Shortening from 1,536 to 256 float32 coordinates trims raw array storage sixfold, and pairing a 256-coordinate vector with 8-bit quantization yields a 24x drop before counting graph edges or metadata. As the bottom Recall@4 curves across target dimensions show, neighborhood accuracy diverges sharply across compression methods.</figcaption>
</figure>

## Measure the storage and retrieval budget

Before picking any dimensionality reducer, write down the storage math in concrete bytes. A single `float32` number takes four bytes, so holding ten million 1,536-dimensional embeddings requires $10{,}000{,}000 \times 1{,}536 \times 4 = 61{,}440{,}000{,}000$ bytes, or 61.44 GB in decimal gigabytes for the raw vectors alone. Adding Hierarchical Navigable Small World (HNSW) neighbor lists, document IDs, metadata columns, and replicas raises cluster RAM well beyond the vector matrix itself.

Large coordinate counts also raise the arithmetic cost of scoring and introduce **distance concentration** under isotropic variance. Take independent vectors $X, Y \sim \mathcal{N}(0, \sigma^2 I_d)$ with $d \ge 1$ and $\sigma > 0$. Their squared Euclidean distance $D = \|X - Y\|^2$ concentrates around its expectation $\mathbb{E}[D] = 2d\sigma^2$ because the relative standard deviation drops toward zero at rate $\sqrt{2/d}$:

$$
\mathbb{E}[D] = 2d\sigma^2, \qquad \operatorname{Var}(D) = 8d\sigma^4, \qquad \frac{\operatorname{SD}(D)}{\mathbb{E}[D]} = \sqrt{\frac{2}{d}}
$$

Under independent Gaussian noise, pairwise distances cluster tightly around $\sqrt{2d}\sigma$, leaving thin margins between near and far vectors. Learned text embeddings typically place semantic variation onto far fewer effective dimensions than their nominal coordinate count, so empirical score distributions and held-out benchmarks always matter more than worst-case isotropic bounds. At the same time, graph indexes such as HNSW allocate fixed bytes per vector for neighbor pointers tuned via degree $M$ and search depth `efSearch`; as Faiss's index tables document, once quantization compresses vectors to 16 or 32 bytes, graph links often take more RAM than the vector codes themselves.[^faiss2026indexes] Running the raw-array arithmetic upfront turns vague memory complaints into testable capacity constraints across two distinct compression levers: dimensionality reduction lowers $d$, whereas quantization lowers bits per coordinate or subspace code.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="estimate-vector-storage.py"
import numpy as np

documents = 10_000_000
dims = np.array([1536, 256, 256], dtype=np.int64)
bytes_per_coord = np.array([4, 4, 1], dtype=np.int64)
labels = ["1536d float32", "256d float32 ", "256d int8    "]

total_gb = (documents * dims * bytes_per_coord) / 1e9
for label, gb in zip(labels, total_gb):
    print(f"{label}: {gb:6.2f} GB ({total_gb[0] / gb:4.1f}x reduction)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1536d float32:  61.44 GB ( 1.0x reduction)
256d float32 :  10.24 GB ( 6.0x reduction)
256d int8    :   2.56 GB (24.0x reduction)
```
<!-- leetllm: output:end -->

Keeping hardware **cost metrics** strictly separate from retrieval **quality metrics** prevents memory wins from hiding semantic regressions. Compression changes byte counts immediately, whereas dropped facts show up only when real queries miss relevant passages. Every reduction trial should measure RAM footprint alongside retrieval quality and diagnostic fidelity on judged queries.

| Question | Useful metric |
|---|---|
| Will vectors fit in memory? | Bytes per vector, total RAM, graph index overhead |
| Will useful evidence still be retrieved? | <span data-glossary="recall-at-k">Recall@K</span>, <span data-glossary="ndcg">nDCG</span>@K, downstream answer accuracy |
| Where does the embedding space break down? | 2D inspection maps verified back in original vector space |

```checkpoint
Why can't a six-times smaller vector index be approved from storage savings alone?
---
Storage figures report the hardware savings, not the semantic degradation. A shorter vector can push the exact passage needed to answer a query outside top-K retrieval, so approval requires held-out recall and downstream evaluation measurements.
```

## Build a retrieval baseline

Before compressing any vector matrix, measure exact search behavior on the uncompressed index so later runs have an unmistakable reference point. Our baseline corpus groups six short passages across three ML domains: coordinates 0 and 1 capture attention mechanisms, 2 and 3 capture tokenization algorithms, and 4 and 5 capture optimization schedules. L2-normalizing both document vectors and queries puts all points on the unit hypersphere so <span data-glossary="cosine-similarity">cosine similarity</span> reduces to a fast matrix-vector dot product free of raw vector length distortions.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="baseline-ml-retrieval.py"
import numpy as np

documents = [
    "FlashAttention tiles Q, K, and V in SRAM to reduce HBM memory traffic.",
    "Online softmax rescaling keeps tiled attention numerically exact.",
    "BPE iteratively merges the most frequent adjacent byte or symbol pairs.",
    "Unigram tokenization prunes a candidate vocabulary by corpus likelihood.",
    "AdamW decouples L2 weight decay from adaptive gradient moment updates.",
    "Cosine learning-rate decay smoothly lowers step sizes toward zero.",
]

vectors = np.array([
    [1.00, 0.92, 0.04, 0.00, 0.02, 0.00],
    [0.92, 0.80, 0.04, 0.01, 0.02, 0.00],
    [0.02, 0.00, 1.00, 0.88, 0.04, 0.00],
    [0.02, 0.02, 0.91, 0.98, 0.00, 0.00],
    [0.00, 0.00, 0.04, 0.02, 1.00, 0.89],
    [0.02, 0.00, 0.00, 0.02, 0.91, 1.00],
], dtype=float)
query = np.array([0.98, 1.00, 0.03, 0.00, 0.01, 0.00])


def normalize_rows(rows: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(rows, axis=-1, keepdims=True)
    return rows / norms


scores = normalize_rows(vectors) @ normalize_rows(query)
ranking = np.argsort(-scores, kind="stable")

for rank, idx in enumerate(ranking[:3], start=1):
    print(f"{rank}. score={scores[idx]:.3f}  {documents[idx]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1. score=0.999  FlashAttention tiles Q, K, and V in SRAM to reduce HBM memory traffic.
2. score=0.997  Online softmax rescaling keeps tiled attention numerically exact.
3. score=0.036  Unigram tokenization prunes a candidate vocabulary by corpus likelihood.
```
<!-- leetllm: output:end -->

Because both attention passages land at ranks 1 and 2 (`Recall@2 = 1.000`) with a wide cosine margin above unrelated chunks, this baseline defines the retrieval target every compressed index must defend. Unigram tokenization sits far below at score `0.036` because the query shares almost no directional alignment with the tokenization subspace. Any reduction method we test next is evaluated against how faithfully it retains those top ranks as bytes per vector decline.

## PCA: learn a shorter linear coordinate system

Imagine three two-dimensional vectors `[1, 1]`, `[2, 2]`, and `[3, 3]`. Subtracting their sample mean `[2, 2]` gives `[-1, -1]`, `[0, 0]`, and `[1, 1]`, showing that every point lies on the single diagonal axis $e_1 = [1/\sqrt{2}, 1/\sqrt{2}]$ while the perpendicular axis $e_2 = [-1/\sqrt{2}, 1/\sqrt{2}]$ carries zero variation. Projecting onto $e_1$ produces `[-\sqrt{2}, 0, \sqrt{2}]` and discards the redundant coordinate without losing any geometric separation.

<span data-glossary="pca">Principal component analysis (PCA)</span> automates that coordinate rotation across hundreds or thousands of dimensions. Given an $N \times d$ embedding matrix $X$, subtract column means $\mu = \frac{1}{N}\mathbf{1}^T X$ to center the cloud around the origin, producing $X_c = X - \mu$ with sample covariance $C = \frac{1}{N - 1} X_c^T X_c \in \mathbb{R}^{d \times d}$. Rather than forming the $d \times d$ matrix $X_c^T X_c$ explicitly (which squares condition numbers and consumes extra memory when $d$ is large), practical solvers decompose $X_c$ directly via thin <span data-glossary="svd">Singular Value Decomposition (SVD)</span>:[^trefethen1997][^sklearn2026pca]

$$
X_c = U \Sigma V^T, \qquad C = \frac{1}{N - 1} V \Sigma^2 V^T
$$

In a thin SVD with $r = \min(N, d)$, $U \in \mathbb{R}^{N \times r}$ and $V \in \mathbb{R}^{d \times r}$ carry orthonormal columns, and diagonal matrix $\Sigma$ orders singular values $\sigma_1 \ge \sigma_2 \ge \dots \ge 0$ (at most $\min(N - 1, d)$ can be nonzero after mean centering). Right singular vectors in $V$ match covariance eigenvectors cleanly with eigenvalues $\lambda_i = \sigma_i^2 / (N - 1)$. Keeping the top $k$ columns $V_k \in \mathbb{R}^{d \times k}$ projects embeddings to $Z = X_c V_k$, while the **explained-variance ratio** ($\text{EVR}_k$) reports what share of total corpus spread survives in those $k$ coordinates:

$$
\text{EVR}_k = \frac{\sum_{i=1}^k \sigma_i^2}{\sum_{j=1}^r \sigma_j^2}
$$

<figure>
  <img src="illustrations/_generated/pca_algorithm_flow_dark.png" alt="Three centered rows sit on the 45-degree direction e₁ = [1, 1]/√2 in an equal-scale coordinate plot. Projection gives −√2, 0, and √2. The orthogonal coordinate e₂ has zero variance, so the first component retains all variation in this special case." />
  <figcaption>Equal unit scaling on both axes preserves true orthogonality between the principal axis $e_1$ and zero-variance axis $e_2$. When coordinates correlate linearly, projection onto top singular vectors discards redundant axes cleanly.</figcaption>
</figure>

Production serving requires strict transform parity between indexed chunks and incoming queries. Fit $\mu$ and $V_k$ once on index-build documents, store both arrays beside the index, and transform every document and live query with the identical `(x - mean) @ V_k` linear map. Because shifting by $\mu$ moves the origin, even retaining all $d$ dimensions alters raw cosines, so re-normalize projected vectors before cosine search and filter degenerate zero-norm cases cleanly. Before shipping PCA on real encoders, check two practical pitfalls:

1. **Anisotropic spectra:** Pretrained sentence encoders frequently show strong mean offsets and concentrate variance onto a handful of directions tied to length, syntax, or broad domain. Inspect the singular-value decay empirically rather than assuming leading axes are noise.
2. **Variance is not relevance:** PCA optimizes squared reconstruction error across the whole corpus, not search accuracy. A dominant axis separating prose from Python blocks consumes huge variance, whereas the subtle difference separating FlashAttention SRAM tiling from standard softmax could live along a lower-variance component that aggressive truncation deletes.

Using `PCA` from `scikit-learn` fits the centered SVD basis once on 60 clustered vectors and reuses it consistently across both indexed chunks and incoming search queries. Keeping only two principal components preserves `0.992` of total corpus variance across three dense topic clusters. As the output shows, projecting both documents and query through that single persisted basis retrieves the attention cluster cleanly even in two dimensions.

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, id=pca-fit -->
```python title="fit-one-pca-transform.py"
import numpy as np
from sklearn.decomposition import PCA

rng = np.random.default_rng(4)
centers = np.array([
    [1.0, 0.9, 0.0, 0.0, 0.0, 0.0],  # attention
    [0.0, 0.0, 1.0, 0.9, 0.0, 0.0],  # tokenization
    [0.0, 0.0, 0.0, 0.0, 1.0, 0.9],  # optimization
])
labels = ["attention"] * 20 + ["tokenization"] * 20 + ["optimization"] * 20
documents = np.vstack([c + rng.normal(0, 0.05, size=(20, 6)) for c in centers])
query = np.array([[0.96, 0.91, 0.02, 0.01, 0.00, 0.00]])


def normalize_rows(rows: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(rows, axis=1, keepdims=True)
    return rows / norms


pca = PCA(n_components=2).fit(documents)
reduced_docs = normalize_rows(pca.transform(documents))
reduced_query = normalize_rows(pca.transform(query))
best_idx = int(np.argmax(reduced_docs @ reduced_query[0]))

print(f"Shape: {documents.shape} -> {reduced_docs.shape}")
print(f"Explained variance kept: {pca.explained_variance_ratio_.sum():.3f}")
print(f"Closest retrieved topic: {labels[best_idx]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Shape: (60, 6) -> (60, 2)
Explained variance kept: 0.992
Closest retrieved topic: attention
```
<!-- leetllm: output:end -->

### Sweep dimensions against neighbor recall

A single clean query says almost nothing about where retrieval recall breaks as dimensions shrink. Sweeping `PCA` dimensions `2`, `4`, `8`, and `12` across 20 distinct technical topics in a noisy 24-dimensional embedding space compares explained variance side by side against held-out `Recall@3`. Each topic embeds around a distinct unit centroid plus per-document Gaussian perturbations so nearest neighbors challenge low-dimensional projections.

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, continue=pca-fit, id=pca-sweep -->
```python title="pca-recall-sweep.py"
rng = np.random.default_rng(21)
dimensions, topic_count, docs_per_topic = 24, 20, 3

topics = rng.normal(0, 1, size=(topic_count, dimensions))
topics = normalize_rows(topics - topics.mean(axis=0))

docs_list, queries_list, relevant = [], [], []
for topic in topics:
    first = len(docs_list)
    for _ in range(docs_per_topic):
        docs_list.append(topic + rng.normal(0, 0.11, size=dimensions))
    queries_list.append(topic + rng.normal(0, 0.03, size=dimensions))
    relevant.append(set(range(first, first + docs_per_topic)))

documents = np.array(docs_list)
queries = np.array(queries_list)


def eval_recall(q_rows: np.ndarray, d_rows: np.ndarray, k: int = 3) -> float:
    scores = normalize_rows(q_rows) @ normalize_rows(d_rows).T
    topk = np.argsort(-scores, axis=1, kind="stable")[:, :k]
    return float(np.mean([len(rel & set(row)) / len(rel) for rel, row in zip(relevant, topk)]))


print(f"Full-space recall@3: {eval_recall(queries, documents):.3f}")
for target_dim in [2, 4, 8, 12]:
    model = PCA(n_components=target_dim).fit(documents)
    rec = eval_recall(model.transform(queries), model.transform(documents))
    var = float(model.explained_variance_ratio_.sum())
    print(f"{target_dim:>2} dims: recall@3={rec:.3f}, variance={var:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Full-space recall@3: 1.000
 2 dims: recall@3=0.333, variance=0.266
 4 dims: recall@3=0.817, variance=0.454
 8 dims: recall@3=1.000, variance=0.715
12 dims: recall@3=1.000, variance=0.869
```
<!-- leetllm: output:end -->

> **Key insight:** `Recall@3` hits `1.000` at 8 dimensions even though explained variance is only `0.715`. Explained variance measures corpus-wide spread, not search relevance; always pick target dimension $k$ from held-out retrieval recall.

Try inspecting `target_dim = 6` (`recall@3 = 0.983`), and then raise document noise from `0.11` to `0.20`: under higher noise, six dimensions drop to `recall@3 = 0.867` while even the full 24-dimensional space falls to `0.983`. Separating development sweeps from held-out evaluation queries keeps $k$ from overfitting a small benchmark sample.

```checkpoint
A PCA model retains 95 percent of explained variance across a corpus, yet drops a required technical passage outside the top five results for critical benchmark queries. Should it ship?
---
No. Explained variance tracks overall corpus spread rather than task relevance. Raise k, switch to a prefix-trained representation, or adjust the search pipeline until held-out retrieval quality meets the target threshold.
```

## A two-dimensional map is an investigation tool

Retrieval compression optimizes accuracy, memory, and query speed. Two-dimensional maps answer an entirely different debugging question, helping engineers pick candidate anomalies to inspect back in full space. The scatter plots below reveal where clusters overlap or separate before any query metrics run:

- Do sparse-attention queries scatter across unrelated clusters or land close to dense FlashAttention passages?
- Does a new encoder checkpoint segregate recent chunks into a separate island away from older documentation?
- Which boundary documents sit close enough to the wrong topic cluster to inspect directly in the original matrix?

Tidy visual islands never turn a 2D plot into a viable search index. Collapsing hundreds of orthogonal dimensions onto two axes creates unavoidable crowding and distortion, erasing fine boundaries that still matter in full space. Treat every low-dimensional plot purely as an exploration map whose patterns you confirm back in the original high-dimensional vectors.

### Check the neighbors behind a picture

While PCA computes a single global linear projection, nonlinear algorithms like <span data-glossary="t-sne">t-distributed stochastic neighbor embedding (t-SNE)</span> and <span data-glossary="umap">Uniform Manifold Approximation and Projection (UMAP)</span> preserve local neighborhoods through iterative optimization. Before drawing conclusions from any 2D map, check **nearest-neighbor overlap**: how many passages keep their exact high-dimensional nearest neighbor when distances are measured on the 2D layout? L2-normalizing high-dimensional vectors makes original Euclidean nearest neighbors identical to cosine neighbors (since $\|u - v\|^2 = 2 - 2\,u^T v$), whereas map overlap computes Euclidean distance directly on the unnormalized 2D plot coordinates.

<figure>
  <img src="illustrations/_generated/pca_tsne_umap_dark.png" alt="Two equal-scale maps compare nearest-neighbor choices for six embedding passages. The PCA map preserves six of six directed choices. Three detail plots center the exact PCA coordinates for the attention, tokenization, and optimization pairs at one shared magnification, so all six observations remain visible without moving them. A distorted map moves tok-a beside attn-b, leaving three choices correct." />
  <figcaption>Left: exact 2D PCA coordinates from our normalized six-passage matrix preserve all six directed nearest neighbors, as shown in the equal-magnification pair insets below. Right: shifting one point (`tok-a`) near `attn-b` preserves tidy cluster separation to the eye while breaking half of the nearest-neighbor links.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy,scikit-learn -->
```python title="pretty-maps-can-lie.py"
import numpy as np
from sklearn.decomposition import PCA

names = ["attn-a", "attn-b", "tok-a", "tok-b", "opt-a", "opt-b"]
vectors = np.array([
    [1.00, 0.92, 0.04, 0.00, 0.02, 0.00],
    [0.92, 0.80, 0.04, 0.01, 0.02, 0.00],
    [0.02, 0.00, 1.00, 0.88, 0.04, 0.00],
    [0.02, 0.02, 0.91, 0.98, 0.00, 0.00],
    [0.00, 0.00, 0.04, 0.02, 1.00, 0.89],
    [0.02, 0.00, 0.00, 0.02, 0.91, 1.00],
], dtype=float)
distorted_map = np.array([
    [0.00, 0.00],
    [0.20, 0.10],
    [0.30, 0.05],  # tok-a pulled next to attn-b
    [2.00, 2.00],
    [0.00, 2.00],
    [0.20, 2.10],
])


def nearest_names(rows: np.ndarray) -> list[str]:
    diff = rows[:, None, :] - rows[None, :, :]
    sq_dist = np.sum(diff ** 2, axis=-1)
    np.fill_diagonal(sq_dist, np.inf)
    return [names[int(j)] for j in np.argmin(sq_dist, axis=1)]


def overlap(left: list[str], right: list[str]) -> float:
    return sum(a == b for a, b in zip(left, right)) / len(left)


unit_vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
original = nearest_names(unit_vectors)
pca_map = PCA(n_components=2).fit_transform(unit_vectors)
pca_neighbors = nearest_names(pca_map)
distorted_neighbors = nearest_names(distorted_map)

print("Original 1-NN:", list(zip(names, original)))
print(f"PCA 1-NN overlap:       {overlap(original, pca_neighbors):.2f}")
print(f"Distorted 1-NN overlap: {overlap(original, distorted_neighbors):.2f}")
print(f"Distorted neighbor of tok-a: {distorted_neighbors[2]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Original 1-NN: [('attn-a', 'attn-b'), ('attn-b', 'attn-a'), ('tok-a', 'tok-b'), ('tok-b', 'tok-a'), ('opt-a', 'opt-b'), ('opt-b', 'opt-a')]
PCA 1-NN overlap:       1.00
Distorted 1-NN overlap: 0.50
Distorted neighbor of tok-a: attn-b
```
<!-- leetllm: output:end -->

Here 2D PCA kept 1.00 neighbor overlap across all six points, while shifting `tok-a` close to the attention island preserved tidy visual groups at the cost of cutting overlap to 0.50. Because `tok-a` and `tok-b` separated cleanly only along coordinates discarded in the perturbation, the plot fooled visual inspection into pairing attention with tokenization. Measuring local overlap checks map faithfulness to original vectors, while confirming whether original vectors themselves satisfy user queries still requires task labels.

### t-SNE: match neighbor probabilities

Imagine two closely aligned vectors carry target probability `0.10`, while a 2D layout spreads them far enough apart that map probability drops to `0.01`. That single mismatch adds $0.10 \ln(0.10 / 0.01) \approx 0.230$ to the objective, vanishing completely if optimization brings the pair back to `0.10`. <span data-glossary="t-sne">t-distributed stochastic neighbor embedding (t-SNE)</span> turns high-dimensional Euclidean distances into symmetric probabilities $p_{ij}$ by tuning per-point Gaussian widths $\sigma_i$ so each conditional entropy matches the chosen `perplexity`:[^maaten2008]

$$
p_{j|i} = \frac{\exp(-\|x_i - x_j\|^2 / 2\sigma_i^2)}{\sum_{k \ne i} \exp(-\|x_i - x_k\|^2 / 2\sigma_i^2)}, \qquad p_{ij} = \frac{p_{j|i} + p_{i|j}}{2N}
$$

Because available volume grows exponentially with dimension, a 2D sheet cannot match all moderate distances found inside high-dimensional neighborhoods. Under a Gaussian kernel in 2D, cumulative attractive forces from moderately distant points collapse the map center in the **crowding problem**. van der Maaten and Hinton relieved crowding by substituting a heavy-tailed one-degree-of-freedom Student-$t$ (Cauchy) distribution for map probabilities $q_{ij}$ and minimizing <span data-glossary="kl-divergence">KL divergence</span>:[^maaten2008]

$$
q_{ij} = \frac{(1 + \|y_i - y_j\|^2)^{-1}}{\sum_{k \ne l} (1 + \|y_k - y_l\|^2)^{-1}}, \qquad D_{\text{KL}}(P \parallel Q) = \sum_{i \ne j} p_{ij} \log \frac{p_{ij}}{q_{ij}}
$$

Slowly decaying Cauchy tails allow moderate original distances to stretch onto broader 2D areas without crowding nearest neighbors. Self-pair probabilities $p_{ii}$ and $q_{ii}$ are fixed to zero, and `perplexity` acts as an effective neighbor count rather than cluster count. Always compare multiple seeds and perplexities, avoid equating cluster area or whitespace with true semantic density, and recall that classic nonparametric t-SNE maps fixed batches without an encoder for unseen live queries.[^maaten2008]

<figure>
  <img src="illustrations/_generated/tsne_algorithm_flow_dark.png" alt="Three three-node pair-probability graphs compare target P, uniform map Q, and an aligned map Q. Edge width encodes probability mass; target P assigns 0.80 to A-B, and the aligned Q assigns 0.70 to A-B, lowering KL divergence from 0.460 to 0.038." />
  <figcaption>A three-node probability comparison isolates the KL divergence penalty: pulling the strong A–B edge weight in $Q$ toward its target mass $0.80$ slashes $D_{\text{KL}}(P \parallel Q)$ from `0.460` down to `0.038`.</figcaption>
</figure>

### UMAP: optimize a weighted neighbor graph

Instead of normalizing pair probabilities across the entire corpus matrix, <span data-glossary="umap">Uniform Manifold Approximation and Projection (UMAP)</span> builds a local $k$-nearest-neighbor graph motivated by Riemannian manifolds and fuzzy simplicial sets.[^mcinnes2018] Applying UMAP helps visually surface structure without implying that embedding vectors satisfy idealized manifold assumptions. For each sample's nearest neighbors, UMAP computes local offset $\rho_i$ (distance to its nearest distinct point) and bandwidth $\sigma_i$, builds directed memberships $p_{j|i} = \exp(-\max(0, d(x_i, x_j) - \rho_i) / \sigma_i)$ in $[0, 1]$, and symmetrizes via fuzzy union:

$$
p_{ij} = p_{j|i} + p_{i|j} - p_{j|i} p_{i|j}
$$

Two directed strengths of `0.80` and `0.60`, for instance, combine into edge strength $0.80 + 0.60 - 0.48 = 0.92$, while disconnected pairs take strength zero. Optimizing low-dimensional weights $q_{ij} = (1 + a\|y_i - y_j\|^{2b})^{-1}$ minimizes fuzzy <span data-glossary="cross-entropy">cross-entropy</span> (omitting constant terms in $P$):

$$
\mathcal{L}_{\text{UMAP}} = \sum_{i \ne j} \left[ \underbrace{p_{ij} \log \frac{p_{ij}}{q_{ij}}}_{\text{edge attraction}} + \underbrace{(1 - p_{ij}) \log \frac{1 - p_{ij}}{1 - q_{ij}}}_{\text{non-edge repulsion}} \right]
$$

In practice, UMAP implementations sample negative edges via stochastic gradient descent rather than summing every non-edge pair, shifting the effective balance between attraction and repulsion.[^damrich2021UmapLoss] Tune `n_neighbors` to set neighborhood scale and `min_dist` to control point tightness without mistaking crisp islands for true semantic separation.[^umap2026Parameters] Unlike nonparametric t-SNE, UMAP exposes `.transform()` to project unseen samples into an existing simplicial complex, though that nonlinear lookup behaves quite differently from a linear projection; record metric, normalization, hyperparameters, and seed with every figure.

<figure>
  <img src="illustrations/_generated/umap_algorithm_flow_dark.png" alt="UMAP combines directed membership strengths 0.80 and 0.60 into one edge with strength 0.92. The theoretical loss has edge-attraction and non-edge-repulsion terms; stochastic optimization can vary with initialization and sampled edges." />
  <figcaption>The probabilistic union merges asymmetric directed memberships (`0.80` and `0.60`) into undirected weight `0.92`, while the two cross-entropy terms drive strong neighbors toward $q \to 1$ and weak pairs toward $q \to 0$.</figcaption>
</figure>

| Engineering goal | Primary evaluation metric | Candidate methods |
|---|---|---|
| Inspect clusters or outliers | Neighbor overlap plus human inspection | PCA, t-SNE, UMAP |
| Compress vectors for serving | Recall@K or nDCG@K plus RAM and latency | Native prefix (MRL), PCA, random projection |
| Push memory down further | Compressed search recall plus rescore accuracy | Scalar (SQ8), binary, product <span data-glossary="quantization">quantization</span> |

## Random projection: a no-fit serving baseline

Streaming indexes that ingest new topics continuously make periodic PCA refitting painful to coordinate across read replicas. A random projection trades corpus-adapted directions for a fixed matrix $R \in \mathbb{R}^{d \times k}$ sampled once from a zero-mean distribution and applied uniformly via $z = xR$ to every indexed document and query. Even without looking at a single training vector, random isotropic projections preserve pairwise Euclidean distances tightly once $k$ is large enough.

Theoretical support comes from the <span data-glossary="johnson-lindenstrauss-lemma">Johnson-Lindenstrauss lemma</span>, which proves that for any fixed set of $N \ge 2$ vectors and distortion tolerance $0 < \epsilon < 1$, a linear map $R \in \mathbb{R}^{d \times k}$ exists preserving all pairwise squared Euclidean distances within $(1 \pm \epsilon)$ whenever $k$ exceeds $\frac{4 \ln N}{\epsilon^2 / 2 - \epsilon^3 / 3}$. Both the sufficient dimension rule and the multiplicative squared-distance interval take the exact algebraic form:[^johnson1984][^dasgupta2003Jl]

$$
k \ge \frac{4 \ln N}{\epsilon^2 / 2 - \epsilon^3 / 3}, \qquad (1 - \epsilon)\|u - v\|^2 \le \|uR - vR\|^2 \le (1 + \epsilon)\|u - v\|^2
$$

Remarkably, the bound grows only logarithmically as $\mathcal{O}(\ln N / \epsilon^2)$ with zero dependence on ambient dimension $d$. At the same time, it is a worst-case sufficient bound on a fixed point set rather than a tight lower bound or a blanket guarantee on unseen queries, and single random draws carry failure probabilities governed by construction constants. Evaluating the formula on ten million vectors across tolerances $\epsilon \in \{0.10, 0.15, 0.25, 0.50\}$ immediately clarifies how conservative that bound sits relative to $d = 1{,}536$:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="check-the-jl-budget.py"
import numpy as np

n_points = 10_000_000
epsilons = np.array([0.10, 0.15, 0.25, 0.50])
sufficient_k = np.ceil(4 * np.log(n_points) / (epsilons**2 / 2 - epsilons**3 / 3)).astype(int)

for eps, k in zip(epsilons, sufficient_k):
    dist_lo = 100 * (np.sqrt(1 - eps) - 1)
    dist_hi = 100 * (np.sqrt(1 + eps) - 1)
    print(f"eps={eps:.2f} -> k>={k:>5} (below 1536? {str(k < 1536):<5})  "
          f"distance band [{dist_lo:+.1f}%, {dist_hi:+.1f}%]")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
eps=0.10 -> k>=13816 (below 1536? False)  distance band [-5.1%, +4.9%]
eps=0.15 -> k>= 6368 (below 1536? False)  distance band [-7.8%, +7.2%]
eps=0.25 -> k>= 2476 (below 1536? False)  distance band [-13.4%, +11.8%]
eps=0.50 -> k>=  774 (below 1536? True )  distance band [-29.3%, +22.5%]
```
<!-- leetllm: output:end -->

Even allowing 15% squared-distance distortion ($\epsilon = 0.15$, or $[-7.8\%, +7.2\%]$ in Euclidean norm), the worst-case formula asks for 6,368 dimensions, more than four times larger than $d = 1{,}536$. Empirical embeddings often behave well at $k = 256$, yet only held-out experiments justify smaller projections. Two constructions dominate practice: **Gaussian projection** samples $R_{ij} \sim \mathcal{N}(0, 1/k)$, whereas **sparse Achlioptas projection** draws from $\{-\sqrt{3/k}, 0, +\sqrt{3/k}\}$ with probabilities $\{1/6, 2/3, 1/6\}$, zeroing two-thirds of entries while still requiring sparse kernels and benchmarking before claiming speedups.[^sklearn2026RandomProjection] Crucially, a $(1 \pm \epsilon)$ interval does not freeze nearest-neighbor order: squared distances $1.00$ and $1.15$ have overlapping $\epsilon = 0.15$ intervals $[0.85, 1.15]$ and $[0.9775, 1.3225]$, permitting the farther item to swap ahead before L2 normalization reshapes cosine angles further.

<figure>
  <img src="illustrations/_generated/random_projection_flow_dark.png" alt="Equal-scale axes compare Euclidean distances for document pairs before and after a seeded 48-to-16 Gaussian random projection. Dashed cone lines show a plus-or-minus 15 percent band around the diagonal. Pair 0-1 rises from 9.252 to 10.551 (+14.0%), pair 0-2 drops from 8.820 to 5.771 (-34.6%), and pair 1-2 drops from 10.222 to 7.846 (-23.2%), swapping the distance ranking between 0-1 and 1-2." />
  <figcaption>Running `GaussianRandomProjection` from `scikit-learn` on 48-dimensional vectors compresses payloads 3x (`192 B` to `64 B`) while allowing Doc 0–1 (`+14.0%`) and Doc 1–2 (`-23.2%`) to swap relative L2 rank.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy,scikit-learn -->
```python title="random-projection-recall.py"
import numpy as np
from sklearn.random_projection import GaussianRandomProjection

rng = np.random.default_rng(33)
documents = rng.normal(0, 1, size=(180, 48))
queries = documents[:12] + rng.normal(0, 0.03, size=(12, 48))


def top_k(q_rows: np.ndarray, d_rows: np.ndarray, k: int = 5) -> np.ndarray:
    q_hat = q_rows / np.linalg.norm(q_rows, axis=1, keepdims=True)
    d_hat = d_rows / np.linalg.norm(d_rows, axis=1, keepdims=True)
    return np.argsort(-(q_hat @ d_hat.T), axis=1, kind="stable")[:, :k]


gold = top_k(queries, documents, k=5)
rp = GaussianRandomProjection(n_components=16, random_state=0).fit(documents)
short_docs = rp.transform(documents)
short_queries = rp.transform(queries)
predicted = top_k(short_queries, short_docs, k=5)

for left, right in ((0, 1), (0, 2), (1, 2)):
    d_full = float(np.linalg.norm(documents[left] - documents[right]))
    d_proj = float(np.linalg.norm(short_docs[left] - short_docs[right]))
    pct = 100 * (d_proj / d_full - 1)
    print(f"Doc {left}–{right}: {d_full:.3f} → {d_proj:.3f} ({pct:+.1f}%)")

overlap_at_5 = np.mean([len(set(g) & set(p)) / 5 for g, p in zip(gold, predicted)])
print(f"Bytes/vector: {documents[0].astype(np.float32).nbytes} -> {short_docs[0].astype(np.float32).nbytes}")
print(f"Cosine top-5 overlap: {overlap_at_5:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Doc 0–1: 9.252 → 10.551 (+14.0%)
Doc 0–2: 8.820 → 5.771 (-34.6%)
Doc 1–2: 10.222 → 7.846 (-23.2%)
Bytes/vector: 192 -> 64
Cosine top-5 overlap: 0.367
```
<!-- leetllm: output:end -->

Compressing unstructured 48-dimensional vectors down to 16 random coordinates leaves only `0.367` top-5 cosine overlap, exposing pure geometric loss when no dominant subspace exists. Pairwise distance shifts confirm why: Doc `0–1` grew by `+14.0%` while Doc `1–2` shrank by `-23.2%`, overtaking it in ranking. In production comparisons, evaluate PCA and random projection side by side across candidate dimensions on judged queries, and persist the exact `rp.components_` matrix across serving processes.

## Compression after reduction: quantization

Reducing dimension shrinks coordinate count $d$, whereas **quantization** shrinks the bit width allocated to each coordinate or vector slice, combining cleanly with shorter embeddings. Where a 256-dimensional `float32` vector requires $256 \times 4 = 1{,}024$ bytes, 8-bit integer quantization drops storage to 256 bytes and 1-bit sign quantization drops it to 32 bytes. Each step down in precision exchanges small discretization noise for steep RAM savings and lower memory bandwidth during vector scans.

### Scalar and binary codes

Scalar quantization maps continuous coordinates onto evenly spaced integer levels. Under symmetric signed **SQ8** calibration over $[-127, 127]$ (skipping `-128` to preserve symmetry around zero), values scale by peak magnitude while **binary quantization (BQ)** keeps only coordinate signs:

$$
x_q = \operatorname{round}\!\left(127 \cdot \frac{x}{\max |x|}\right), \qquad b_i = \begin{cases} 1 & \text{if } x_i > 0 \\ 0 & \text{if } x_i \le 0 \end{cases}
$$

SQ8 cuts raw coordinate RAM fourfold minus minor scale metadata and leverages integer SIMD instructions on modern CPUs, though actual speedup varies by hardware instruction set and should be measured end to end. Binary quantization packs eight sign bits per byte (32 bytes total at 256 dimensions) and scores pairs via fast XOR plus `popcount` Hamming distance, discarding all coordinate magnitude information. In vector engines such as <span data-glossary="qdrant">Qdrant</span>, configuring `rescore: true` with an oversampling ratio (for instance, `oversampling: 2.4` at `limit: 100` selects 240 compressed candidates before exact full-vector rescoring) preserves high precision across binary, SQ8, and PQ modes (verify whether rescoring is enabled by default for your chosen quantizer). Rotation schemes like **TurboQuant** apply orthogonal rotations prior to coding to curb extreme coordinates and support 4-bit asymmetric scoring at half SQ8 footprint.[^qdrant2024][^zandieh2025TurboQuant]

Fitting one shared symmetric SQ8 scale and packing binary sign bits across four eight-dimensional embedding rows exposes both the exact byte ratios and resulting quantization errors.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="scalar-and-binary-codes.py"
import numpy as np

vectors = np.array([
    [0.90, 0.80, -0.10, -0.20, 0.04, 0.02, -0.05, 0.08],
    [0.85, 0.74, -0.04, -0.16, 0.01, 0.04, -0.02, 0.05],
    [-0.02, 0.04, 0.92, 0.81, -0.06, 0.01, 0.02, -0.04],
    [-0.05, 0.03, 0.88, 0.79, -0.03, 0.00, 0.06, -0.02],
], dtype=np.float32)

scale = 127.0 / float(np.abs(vectors).max())
int8_codes = np.clip(np.rint(vectors * scale), -127, 127).astype(np.int8)
dequantized = int8_codes.astype(np.float32) / scale
mean_l2_err = float(np.linalg.norm(vectors - dequantized, axis=1).mean())

binary_bits = vectors > 0
packed_binary = np.packbits(binary_bits, axis=1)
hamming = np.count_nonzero(binary_bits ^ binary_bits[0], axis=1)

print(f"float32 bytes/vector:       {vectors[0].nbytes}")
print(f"int8 bytes/vector:          {int8_codes[0].nbytes}  (mean L2 error={mean_l2_err:.4f})")
print(f"packed binary bytes/vector: {packed_binary[0].nbytes}")
print(f"Hamming distance from row 0: {hamming.tolist()}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
float32 bytes/vector:       32
int8 bytes/vector:          8  (mean L2 error=0.0060)
packed binary bytes/vector: 1
Hamming distance from row 0: [0, 0, 6, 7]
```
<!-- leetllm: output:end -->

Stage 2 exact rescoring recovers ranking among shortlisted candidates, yet it cannot restore relevant documents omitted in Stage 1. At `int8` width (`8 B` per vector), the shared global scale introduces only `0.0060` mean L2 error, whereas packing signs to `1 B` retains coarse discrimination (`[0, 0, 6, 7]` Hamming separation). Benchmark oversampling multiples directly against held-out recall and Stage 2 storage fetch latency before fixing configuration defaults.

### Product quantization: code sub-vectors

Where scalar quantization encodes coordinates one number at a time, **Product Quantization (PQ)** cuts each $d$-dimensional vector into $m$ disjoint subspaces of width $d/m$, runs $k$-means separately within each subspace to learn $k^*$ centroids, and stores only the $m$ integer centroid IDs.[^jegou2011] Choosing $k^* = 256$ packs each subspace code into one unsigned byte (`uint8`), compressing each subvector to a single table index. Splitting a 128-dimensional `float32` vector into $m = 8$ sixteen-dimensional subspaces therefore drops storage from $128 \times 4 = 512$ bytes down to 8 bytes, delivering a 64x payload reduction.

<figure>
  <img src="illustrations/_generated/product_quantization_flow_dark.png" alt="Product quantization diagram partitions a 16-dimensional vector into four 4-dimensional subspaces s1 through s4 and assigns discrete centroid code [1, 0, 3, 1]. Below a downward FlowArrow, a 4x4 Heatmap shows asymmetric squared distances T[k][s] computed against an unquantized query. Looking up each stored byte gives 0.09 + 0.33 + 0.06 + 0.42 = 0.90 to approximate squared L2 distance." />
  <figcaption>Product quantization with Asymmetric Distance Computation (ADC): each database vector stores only $m$ centroid IDs (`[1, 0, 3, 1]`), while each incoming query populates a small $k^* \times m$ lookup table $T[k][s]$ so distance estimation reduces to $m$ table reads and additions.</figcaption>
</figure>

Rather than quantizing the query too, <span data-glossary="asymmetric-distance-computation">Asymmetric Distance Computation (ADC)</span> leaves the query vector at full precision and avoids query-side assignment error:[^jegou2011]

1. Split the incoming query $q$ into $m$ subvectors $q_1, q_2, \dots, q_m$ matching the indexed subspaces.
2. Precompute the query's squared L2 distance table $T[k][s] = \|q_s - \mathbf{c}_{s, k}\|^2$ across all $k^*$ centroids in each subspace $s \in \{1, \dots, m\}$.
3. Score every coded database vector $[c_1, \dots, c_m]$ by summing $m$ table lookups, $\|q - x\|^2 \approx \sum_{s=1}^m T[c_s][s]$.

For $m = 96$ and $k^* = 256$, the `float32` table spans $96 \times 256 \times 4 = 98{,}304$ bytes (96 KiB), fitting near CPU L1/L2 caches while optimized kernels such as Faiss `PQFastScan` batch 4-bit centroid lookups inside AVX2 SIMD registers.[^faiss2026ImplementationNotes] Symmetric Distance Computation (SDC) quantizes both sides to eliminate table builds at higher error, whereas ADC pays table setup once per query to keep query error zero. Keep metric assumptions aligned too: ADC approximates squared L2 distance rather than cosine directly because reconstructed centroid vectors rarely have unit norm, so calibrate after normalization, use inner-product PQ codebooks, or rescore top candidates against original normalized vectors.

Running `KMeans` from `scikit-learn` per two-dimensional block builds subspace codebooks, converts 4-float vectors into 2-byte codes, and ranks documents via vectorized ADC table summation.

<!-- leetllm: test, output=show, deps=numpy,scikit-learn -->
```python title="mini-product-quantization.py"
import numpy as np
from sklearn.cluster import KMeans

rng = np.random.default_rng(12)
documents = np.vstack([
    rng.normal([1, 1, 0, 0], 0.08, size=(20, 4)),  # attention cluster
    rng.normal([0, 0, 1, 1], 0.08, size=(20, 4)),  # tokenization cluster
]).astype(np.float32)
query = np.array([0.94, 1.02, 0.01, -0.02], dtype=np.float32)

subspace_width = 2
codebooks, codes, adc_tables = [], [], []
for start in range(0, documents.shape[1], subspace_width):
    block = documents[:, start:start + subspace_width]
    km = KMeans(n_clusters=4, n_init=10, random_state=start).fit(block)
    centroids = km.cluster_centers_.astype(np.float32)
    codebooks.append(centroids)
    codes.append(km.labels_.astype(np.uint8))
    adc_tables.append(np.sum((centroids - query[start:start + subspace_width]) ** 2, axis=1))

codes_arr = np.column_stack(codes)
adc_scores = sum(adc_tables[s][codes_arr[:, s]] for s in range(len(codebooks)))
best_idx = int(np.argmin(adc_scores))

print(f"Document shape: {documents.shape} ({documents[0].nbytes} B/vector)")
print(f"Code array shape: {codes_arr.shape} ({codes_arr[0].nbytes} B/vector)")
print(f"Shared codebook bytes: {sum(book.nbytes for book in codebooks)}")
print(f"Nearest ADC passage cluster: {'attention' if best_idx < 20 else 'tokenization'}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Document shape: (40, 4) (16 B/vector)
Code array shape: (40, 2) (2 B/vector)
Shared codebook bytes: 64
Nearest ADC passage cluster: attention
```
<!-- leetllm: output:end -->

Every 16-byte vector compacts to two `uint8` codes backed by one shared 64-byte set of codebooks across the index. Multiplying 40 documents scales raw array storage linearly while codebook memory stays constant. Always train codebooks strictly on representative build-time vectors and freeze them across indexing and queries so distance tables remain consistent.

```checkpoint
Why can a system combine PCA or native prefix shortening with product quantization?
---
They attack orthogonal parts of the memory budget. Dimension reduction shrinks the number of coordinates d, while product quantization compresses the remaining coordinates into byte-sized subspace centroid IDs scored via fast lookup tables.
```

## Native shortening: train prefixes to be useful

Post-hoc projection compresses embeddings *after* inference finishes. <span data-glossary="matryoshka-representation-learning">Matryoshka Representation Learning (MRL)</span> instead builds truncatability directly into encoder weights by summing training losses evaluated simultaneously at nested prefix dimensions $\mathcal{M}$ such as $\{64, 128, 256, 1024\}$.[^kusupati2022] With positive weights $c_m$ and prefix prediction heads $W^{(m)}$, the combined multi-scale objective optimizes:

$$
\mathcal{L}_{\text{MRL}} = \sum_{m \in \mathcal{M}} c_m \, \mathcal{L}\!\bigl(W^{(m)} e_{:m}, y\bigr)
$$

Because early coordinates $e_{:64}$ participate in every loss term, gradient updates pack broad discriminative information near the front of the vector while later coordinates refine finer distinctions, a formulation extended cleanly to contrastive sentence-embedding retrieval via Sentence Transformers `MatryoshkaLoss`.[^kusupati2022][^sentenceTransformers2026MatryoshkaLoss] Ordered prefixes unlock **two-stage cascade search**: keep an in-memory HNSW graph over compact 64- or 256-coordinate prefixes (optionally quantized to SQ8) to fetch a fast shortlist of 200 candidates, then load full 1,024- or 1,536-dimensional `float32` vectors for those 200 candidates from NVMe storage to re-rank exact cosine similarity. Keeping 64 `float32` coordinates cuts Stage 1 vector RAM 16x below 1,024 dimensions, though graph link RAM and NVMe fetch latency stay part of total cost, and Stage 2 can never recover relevant items omitted in Stage 1.

<figure>
  <img src="illustrations/_generated/matryoshka_truncation_dark.png" alt="AxisPlot compares Recall@4 across 4, 8, 16, 32, and 64 dimensions on 64d clustered embeddings: an MRL-ordered prefix rises from 0.33 to 0.70 at 8d and 0.95 at 16d, while slicing an unordered embedding starts at 0.07 and reaches only 0.56 at 16d. Below, a FlowArrow connects a fast 64d prefix index shortlisting 200 candidates to full 1024d exact rescoring for the top 10 results." />
  <figcaption>Concentrating discriminative energy in leading coordinates lifts short-prefix `Recall@4` dramatically (`0.95` vs `0.56` at `16d`), making a narrow prefix effective for Stage 1 shortlist generation prior to exact full-vector rescoring.</figcaption>
</figure>

Comparing prefix slices on two 64-dimensional corpora, one concentrating topic signal in leading coordinates and one permuting coordinates uniformly, contrasts ordered prefix recall directly against naive truncation and shows how larger Stage 1 shortlists rescue downstream rescoring accuracy.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="evaluate-ordered-prefixes.py"
import numpy as np

rng = np.random.default_rng(7)
n_topics, d = 60, 64
decay = np.repeat([1.8, 1.0, 0.45, 0.2], 16)

raw_topics = rng.normal(0, 1, size=(n_topics, d))
raw_topics /= np.linalg.norm(raw_topics, axis=1, keepdims=True)
ordered_topics = raw_topics * decay

docs_ord = np.vstack([t + rng.normal(0, 0.14, size=(4, d)) for t in ordered_topics])
qs_ord = ordered_topics + rng.normal(0, 0.05, size=(n_topics, d))
relevant = [set(range(4 * i, 4 * i + 4)) for i in range(n_topics)]

perm = rng.permutation(d)
docs_unord, qs_unord = docs_ord[:, perm], qs_ord[:, perm]


def topk(q_rows: np.ndarray, d_rows: np.ndarray, k: int) -> np.ndarray:
    q_hat = q_rows / np.linalg.norm(q_rows, axis=1, keepdims=True)
    d_hat = d_rows / np.linalg.norm(d_rows, axis=1, keepdims=True)
    return np.argsort(-(q_hat @ d_hat.T), axis=1, kind="stable")[:, :k]


def recall_at_k(indices: np.ndarray) -> float:
    return float(np.mean([len(rel & set(row)) / len(rel) for rel, row in zip(relevant, indices)]))


for p in [4, 8, 16, 32, 64]:
    rec_ord = recall_at_k(topk(qs_ord[:, :p], docs_ord[:, :p], 4))
    rec_unord = recall_at_k(topk(qs_unord[:, :p], docs_unord[:, :p], 4))
    print(f"prefix={p:>2}d  ordered_recall@4={rec_ord:.3f}  naive_slice_recall@4={rec_unord:.3f}")

# Cascade search from a tiny 8d ordered shortlist, then exact 64d rescore:
for cand_count in [4, 16, 48]:
    shortlists = topk(qs_ord[:, :8], docs_ord[:, :8], cand_count)
    q_full = qs_ord / np.linalg.norm(qs_ord, axis=1, keepdims=True)
    d_full = docs_ord / np.linalg.norm(docs_ord, axis=1, keepdims=True)
    rescored = np.array([row[np.argsort(-(d_full[row] @ q_full[i]), kind="stable")[:4]]
                         for i, row in enumerate(shortlists)])
    print(f"8d shortlist={cand_count:>2} -> rescore recall@4={recall_at_k(rescored):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prefix= 4d  ordered_recall@4=0.333  naive_slice_recall@4=0.071
prefix= 8d  ordered_recall@4=0.700  naive_slice_recall@4=0.204
prefix=16d  ordered_recall@4=0.950  naive_slice_recall@4=0.562
prefix=32d  ordered_recall@4=0.992  naive_slice_recall@4=0.829
prefix=64d  ordered_recall@4=0.983  naive_slice_recall@4=0.983
8d shortlist= 4 -> rescore recall@4=0.700
8d shortlist=16 -> rescore recall@4=0.938
8d shortlist=48 -> rescore recall@4=0.967
```
<!-- leetllm: output:end -->

With ordered signal, `prefix=16d` holds `0.950` `Recall@4` whereas slicing an unordered embedding collapses to `0.562`. When Stage 1 compresses down to `8d` (`0.700`), expanding candidate generation from `4` to `16` items recovers `0.938` `Recall@4` after full-vector rescoring, and expanding to `48` reaches `0.967` at the expense of higher Stage 2 I/O. With hosted embedding APIs, use a supported `dimensions` parameter rather than slicing arbitrarily: OpenAI's `text-embedding-3` models output `1,536` (`small`) and `3,072` (`large`) coordinates natively and support shorter prefixes via `dimensions`, where 256d `text-embedding-3-large` outperformed full-length `text-embedding-ada-002` at launch.[^openai2024_embeddings]

```json title="embedding-request.json"
{
  "model": "text-embedding-3-large",
  "input": "How does FlashAttention reduce HBM traffic without approximating softmax?",
  "dimensions": 256
}
```

> **⚠️ Common mistake:** Whenever you slice a local or returned embedding manually to prefix `e[:k]`, L2-normalize the slice again before cosine or dot-product indexing. Hosted API `dimensions` parameters return unit-normalized prefixes automatically, whereas manual array slicing shrinks vector norms and skews dot products.[^openai2026EmbeddingFaq]

## Choose a deployment experiment

Each reduction family modifies a distinct layer: post-hoc projection removes axes after inference, Matryoshka training bakes short prefixes directly into encoder weights, quantization reduces bit width per coordinate or subspace, and 2D maps remain exclusively diagnostic tools. Combining levers frequently delivers the best cost-recall point in production. Starting from a 1,536-dimensional `float32` baseline (`6,144 B` per vector), one practical experiment tests emitting 256 Matryoshka coordinates (remembering encoder GPU runtime barely drops since the transformer still computes full layers), quantizing those 256 coordinates to SQ8 (`256 B`, a 24x array saving excluding HNSW edges), fetching 200 Stage 1 candidates, and rescoring retained full vectors from NVMe storage to select the top five passages. Persist encoder version, prefix length, normalization flag, and quantizer scales alongside the index, and verify end-to-end p95 latency and task quality rather than guessing targets from byte math.

| Tool family | What changes | Key question to test |
|---|---|---|
| PCA or random projection | Served coordinate count after encoding | How much Recall@K survives at $k \in \{128, 256, 512\}$? |
| Matryoshka native shortening | Prefix dimensions emitted by trained encoder | Does a trained prefix outperform PCA at equal RAM? |
| Scalar, binary, or product quantization | Bits per scalar or subspace centroid code | Does compressed search plus <span data-glossary="reranker">reranking</span> fit RAM and p95 latency? |
| t-SNE or UMAP | Coordinates used for 2D inspection maps | Which misclustered passages merit inspection in original space? |

Evaluating candidate pipelines jointly on 10M-vector memory footprint, per-vector code size, and measured `Recall@10` isolates the smallest representation passing deployment thresholds. Across these measurements, `mrl-256-sq8` fits under 3 GB while keeping `0.978` recall, whereas `pq-16-byte` sacrifices too much Stage 1 accuracy without a rescore stage. Every trial should record five artifacts so regressions remain easy to diagnose when encoders or corpora evolve: a frozen benchmark query set with judged passages, `Recall@K` and `nDCG@K` at the downstream candidate count, measured RAM (including graph links) and p50/p95/p99 query latency, failure cases examining dropped passages, and periodic re-evaluation triggers whenever models or documents update.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="select-a-serving-candidate.py"
import numpy as np

configs = [
    ("float32-1536", 1536 * 4, 1.000),
    ("mrl-256-f32 ", 256 * 4, 0.986),
    ("mrl-256-sq8 ", 256 * 1, 0.978),
    ("pca-256-f32 ", 256 * 4, 0.971),
    ("pq-16-byte  ", 16, 0.939),
]
docs_n = 10_000_000
min_recall, max_ram_gb = 0.975, 12.0

bytes_arr = np.array([c[1] for c in configs], dtype=float)
recall_arr = np.array([c[2] for c in configs], dtype=float)
ram_gb = (docs_n * bytes_arr) / 1e9
eligible = (recall_arr >= min_recall) & (ram_gb <= max_ram_gb)

for (name, b, rec), gb, ok in zip(configs, ram_gb, eligible):
    print(f"{name}  ram={gb:5.2f} GB  bytes={int(b):>4}  recall={rec:.3f}  {'PASS' if ok else 'reject'}")

best_idx = int(np.where(eligible)[0][np.argmin(bytes_arr[eligible])])
print("Smallest passing configuration:", configs[best_idx][0].strip())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
float32-1536  ram=61.44 GB  bytes=6144  recall=1.000  reject
mrl-256-f32   ram=10.24 GB  bytes=1024  recall=0.986  PASS
mrl-256-sq8   ram= 2.56 GB  bytes= 256  recall=0.978  PASS
pca-256-f32   ram=10.24 GB  bytes=1024  recall=0.971  reject
pq-16-byte    ram= 0.16 GB  bytes=  16  recall=0.939  reject
Smallest passing configuration: mrl-256-sq8
```
<!-- leetllm: output:end -->

Keeping explicit recall thresholds alongside RAM budgets catches silent retrieval regressions early. Compression changes byte footprints on disk immediately, whereas semantic errors emerge only when real queries miss evidence at rank $K$. Measuring Recall@K at every reduction and quantization step ensures lower serving cost never drops decisive passages like FlashAttention tiling explanations out of the context window.

```checkpoint
An engineer proposes deploying a visually clean 2D UMAP projection as the production vector index to cut RAM. What experiment should you run instead?
---
Keep UMAP strictly for exploratory visual inspection. Benchmark retrieval-preserving compressors instead, comparing Matryoshka prefixes, PCA, or random projections with optional SQ8/PQ quantization and full-vector rescoring on held-out Recall@K, RAM, and query latency.
```

```checkpoint
Under the independent isotropic Gaussian model X, Y ~ N(0, σ²I_d), what is the relative standard deviation of squared distance at d = 128?
---
0.125, from √(2/128).

Dividing the squared-distance standard deviation √(8dσ⁴) by its mean 2dσ² yields √(2/d). At d = 128 that gives √(1/64) = 1/8 = 0.125. Learned text embeddings may have lower intrinsic dimension, so check actual empirical distance distributions.
```

```checkpoint
A query has three judged relevant passages. A compressed index returns two of them in its top four results alongside two unrelated chunks; the third relevant passage ranks fifth. What is Recall@4?
---
2/3, because two of the three judged relevant passages appeared in the top four.

Recall@K divides retrieved relevant items within rank K by total judged relevant items (2/3). Returning 2 relevant items out of 4 positions gives Precision@4 = 2/4 = 0.5, while the item at rank 5 falls outside rank 4.
```

```checkpoint
A centered embedding matrix has nonzero singular values 5, 2, and 1. Keeping the top two principal components gives which explained-variance ratio, and is that metric alone enough to ship?
---
29/30; no, still verify held-out retrieval quality before shipping.

Explained variance sums squared singular values: (25 + 4) / (25 + 4 + 1) = 29/30 ≈ 0.967. Because high variance can reflect corpus formatting or broad topics rather than task relevance, retrieval metrics remain mandatory.
```

```checkpoint
A squared-distance guarantee holds with ε = 0.2. Two original squared distances are 1.0 and 1.1. Can their nearest-neighbor ordering flip after projection?
---
Yes, because their admissible intervals [0.80, 1.20] and [0.88, 1.32] overlap.

The Johnson-Lindenstrauss bound permits the closer pair to expand up to 1.20 while the farther pair shrinks down to 0.88, reversing their rank. L2-normalizing projected vectors for cosine scoring alters pairwise order further.
```

```mastery-quiz
[
  {
    "question": "A candidate index moves three million vectors from 768 float32 coordinates to 192 eight-bit coordinates. Counting only raw vector arrays, which memory reduction follows?",
    "options": [
      "9.216 GB to 2.304 GB, a 4-fold reduction.",
      "9.216 GB to 0.576 GB, a 16-fold reduction.",
      "2.304 GB to 0.576 GB, a 4-fold reduction.",
      "9.216 GB to 0.072 GB, a 128-fold reduction."
    ],
    "answer": "9.216 GB to 0.576 GB, a 16-fold reduction.",
    "explanation": "The baseline uses 3,000,000 × 768 × 4 = 9,216,000,000 bytes (9.216 GB). Reducing dimensions 4x and precision 4x uses 3,000,000 × 192 × 1 = 576,000,000 bytes (0.576 GB), a 16-fold array reduction before adding HNSW graph edges or metadata."
  },
  {
    "question": "A saved PCA transform has document mean [1, 2] and one retained unit vector [0.8, 0.6]. What unnormalized 1D coordinate does document [4, 1] receive?",
    "options": [
      "3.8, by projecting the uncentered vector directly.",
      "2.4, by dropping the second centered coordinate.",
      "1.8, by projecting the centered difference [3, −1].",
      "−1.8, by reversing the saved basis direction."
    ],
    "answer": "1.8, by projecting the centered difference [3, −1].",
    "explanation": "Subtract the persisted training mean first: [4, 1] − [1, 2] = [3, −1]. Taking the dot product with [0.8, 0.6] yields 2.4 − 0.6 = 1.8. Both indexed documents and incoming queries must reuse the same saved mean and basis."
  },
  {
    "question": "A 1D t-SNE layout places three points at 0, 1, and 3, with unnormalized ordered-pair weights 1 / (1 + squared distance). What symmetric map probability q does it assign to the ordered pair from 0 to 1 (to four decimal places)?",
    "options": [
      "0.6250",
      "0.5000",
      "0.8333",
      "0.3125"
    ],
    "answer": "0.3125",
    "explanation": "The three distinct pairwise distances are 1, 2, and 3, yielding Cauchy weights 1/2 = 0.5, 1/5 = 0.2, and 1/10 = 0.1. Summing all six ordered non-self pairs gives 2 × (0.5 + 0.2 + 0.1) = 1.6, so q₀₁ = 0.5 / 1.6 = 0.3125."
  },
  {
    "question": "Two directed UMAP neighborhood memberships for the same passage pair are 0.7 and 0.4. What undirected fuzzy-union edge weight results?",
    "options": [
      "0.82, from 0.7 + 0.4 − 0.7 × 0.4.",
      "0.28, from 0.7 × 0.4.",
      "0.55, from the arithmetic mean of the two memberships.",
      "1.1, from adding both memberships without subtracting overlap."
    ],
    "answer": "0.82, from 0.7 + 0.4 − 0.7 × 0.4.",
    "explanation": "UMAP combines asymmetric memberships using the probabilistic fuzzy union p + q − pq = 1.1 − 0.28 = 0.82, avoiding double-counting shared neighborhood strength."
  },
  {
    "question": "For N = 20 fixed points and squared-distance tolerance ε = 0.5, apply the Johnson-Lindenstrauss bound k ≥ (4 ln N) / (ε²/2 − ε³/3). What is the smallest integer dimension k satisfying the inequality?",
    "options": [
      "36",
      "143",
      "144",
      "288"
    ],
    "answer": "144",
    "explanation": "The denominator equals 1/8 − 1/24 = 1/12, giving 48 ln(20) ≈ 143.795. Taking the ceiling gives 144 dimensions (143 falls just below the bound, while omitting the factor of 4 gives 36)."
  },
  {
    "question": "A symmetric scalar quantizer calibrates its corpus peak magnitude at 4.0 and encodes into [−127, 127]. Rounding to the nearest integer, what code and reconstructed value correspond to 0.8?",
    "options": [
      "Code 127; reconstruct 0.8 by recalibrating per vector.",
      "Code 102; reconstruct about 3.213 with the saved scale.",
      "Code 25; reconstruct about 0.197 without dividing by scale.",
      "Code 25; reconstruct about 0.787 using the saved scale."
    ],
    "answer": "Code 25; reconstruct about 0.787 using the saved scale.",
    "explanation": "The shared scale is 127 / 4.0 = 31.75. Multiplying 0.8 × 31.75 = 25.4 rounds to int8 code 25; dequantizing via 25 / 31.75 = 100/127 ≈ 0.7874 keeps the vector on the shared index scoring scale."
  },
  {
    "question": "A 96-dimensional float32 index uses product quantization with 12 subspaces and 256 centroids per subspace (one byte per centroid ID). What are the per-vector code size and shared float32 codebook size?",
    "options": [
      "12 bytes and 98,304 bytes.",
      "384 bytes and 98,304 bytes.",
      "12 bytes and 1,179,648 bytes.",
      "96 bytes and 12,288 bytes."
    ],
    "answer": "12 bytes and 98,304 bytes.",
    "explanation": "Each document vector stores 12 one-byte subspace centroid IDs (12 bytes). Each of the 12 subspaces holds 256 centroids of dimension 8 (8 × 12 = 96 total floats per centroid index), giving 256 × 96 × 4 = 98,304 shared codebook bytes."
  },
  {
    "question": "A Stage 1 prefix index returns 16 candidate documents containing 8 of 12 judged relevant passages. Stage 2 full-vector rescoring can only reorder those 16 candidates. What is the maximum achievable final Recall@K?",
    "options": [
      "1",
      "1/3",
      "2/3",
      "1/2"
    ],
    "answer": "2/3",
    "explanation": "Only the 8 relevant documents present in the shortlist can ever reach the final output, capping recall at 8/12 = 2/3 regardless of how accurately Stage 2 reorders them."
  },
  {
    "question": "A deployment target requires vector payload ≤ 700 bytes per item and Recall@10 ≥ 0.96. Candidate A uses 1,280 bytes at 0.99 recall, B uses 640 bytes at 0.965 recall, C uses 128 bytes at 0.95 recall, and D uses 640 bytes with NaN recall. Which candidate passes?",
    "options": [
      "Candidate A",
      "Candidate B",
      "Candidate C",
      "Candidate D"
    ],
    "answer": "Candidate B",
    "explanation": "Candidate B satisfies both the 700-byte RAM cap and the 0.96 finite recall requirement. Candidate A exceeds RAM, C falls short of the recall floor, and D lacks a valid finite measurement."
  },
  {
    "question": "Documents [1, 0] and [0, 1] have cosine similarity 0. Center both around mean [0.5, 0.5] and project using the full 2×2 identity basis. What cosine similarity results before dropping any coordinate?",
    "options": [
      "0, because keeping all dimensions preserves cosine similarity.",
      "0.5, because subtracting the mean halves both coordinates.",
      "1, because shifting both vectors aligns their directions.",
      "−1, because the centered vectors point in opposite directions."
    ],
    "answer": "−1, because the centered vectors point in opposite directions.",
    "explanation": "Centering produces [0.5, −0.5] and [−0.5, 0.5], which are exact negatives and therefore have cosine similarity −1. Shifting the origin changes angles even when zero dimensions are discarded."
  }
]
```

> **Next:** Continue to [CoT, ToT & Self-Consistency Prompting](/learn/chain-of-thought-advanced-prompting). Compact embeddings bring the right technical passages into context; next, look at what happens after retrieval when a model chooses between single-pass generation, majority voting over sampled chains, and structured search across reasoning trees.
