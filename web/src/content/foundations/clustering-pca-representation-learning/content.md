---
{
  "id": "clustering-pca-representation-learning",
  "title": "Clustering and PCA",
  "slug": "clustering-pca-representation-learning",
  "section": "Classical ML & Evaluation",
  "category": "Embeddings & Vector Search",
  "difficulty": "Easy",
  "order": 4,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Inspect unlabeled technical-abstract embeddings with k-means and PCA, then stress-test whether apparent neighborhoods survive scale, metric, and compression choices.",
  "keyConceptsTested": [
    "unlabeled embeddings",
    "k-means",
    "centroids and inertia",
    "cluster evaluation",
    "PCA and SVD",
    "explained variance",
    "feature scaling",
    "embedding metric",
    "representation debugging"
  ]
}
---

Imagine building semantic search over technical abstracts spanning finance, computer vision, and GPU systems. An embedding model turns every abstract into a numeric vector, yet nobody has checked whether nearby vectors actually share a topic. When someone searches for an automated-trading paper, will the nearest vector belong to finance or to an unrelated systems note?

Without labeled query-document pairs, we inspect vector geometry directly. **<span data-glossary="k-means">k-means</span>** partitions nearby points into discrete groups, while <span data-glossary="pca">principal component analysis (PCA)</span> projects vectors onto fewer coordinates for visualization or compression. Neither algorithm reads text. We will derive both from scratch on six concrete vectors, bridge clusters to inverted vector search, and test four traps where scale, metric choice, centering, and compression break neighborhoods.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Three nearest-neighbor pairs in six two-dimensional embedding coordinates: finance abstracts fin_A and fin_B sit 0.82 apart, vision abstracts vis_A and vis_B sit 1.08 apart, and systems abstracts sys_A and sys_B sit 1.28 apart." />
  <figcaption>Three nearest-neighbor pairs in two-dimensional embedding space connect finance, vision, and systems abstracts by Euclidean distance; topic names come only from reading source texts, whereas numeric cluster IDs carry no intrinsic meaning.</figcaption>
</figure>

## Start with six abstracts, not six labels

We use six 2D <span data-glossary="embedding">embeddings</span> so every distance, centroid update, and singular value can be checked by hand:

| Document ID | Abstract excerpt | $x$ | $y$ |
|---|---|---:|---:|
| `fin_A` | "Volatility clustering in limit order books." | 1.0 | 1.0 |
| `fin_B` | "Cross-asset hedging under regime shifts." | 1.2 | 1.8 |
| `vis_A` | "Patch attention in multi-scale vision transformers." | 4.0 | 4.2 |
| `vis_B` | "Depthwise convolutions for semantic segmentation." | 5.0 | 3.8 |
| `sys_A` | "Shared-memory tiling in fused matrix kernels." | 8.0 | 1.0 |
| `sys_B` | "Asynchronous warp scheduling on tensor cores." | 9.0 | 1.8 |

The IDs exist only for our human check; the algorithms see only the six $(x, y)$ rows. Between `fin_A` and `fin_B`, Euclidean distance is $\sqrt{0.2^2 + 0.8^2} \approx 0.82$. Checking nearest pairs first confirms whether local geometry aligns with topics before we cluster:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="nearest-document-neighbors.py"
import numpy as np

names = np.array(["fin_A", "fin_B", "vis_A", "vis_B", "sys_A", "sys_B"])
vectors = np.array([[1.0, 1.0], [1.2, 1.8], [4.0, 4.2], [5.0, 3.8], [8.0, 1.0], [9.0, 1.8]])
distances = np.linalg.norm(vectors[:, None, :] - vectors[None, :, :], axis=2)
np.fill_diagonal(distances, np.inf)

for row, name in enumerate(names):
    nb = distances[row].argmin()
    print(f"{name:6} -> {names[nb]:6} distance={distances[row, nb]:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fin_A  -> fin_B  distance=0.82
fin_B  -> fin_A  distance=0.82
vis_A  -> vis_B  distance=1.08
vis_B  -> vis_A  distance=1.08
sys_A  -> sys_B  distance=1.28
sys_B  -> sys_A  distance=1.28
```
<!-- leetllm: output:end -->

Every abstract's nearest neighbor shares its topic. Pairwise tables scale as $O(n^2)$ and do not summarize a corpus into inspectable groups, so we turn to **k-means**.

## Partition unlabeled vectors with Lloyd's algorithm

Given $K$ clusters, k-means represents each group by its **centroid** $\mu_k$ and minimizes the **within-cluster sum of squares (WCSS)**, or **<span data-glossary="inertia">inertia</span>**:[^bishop2006][^sklearnKMeans2026]

$$
J = \sum_{k=1}^{K} \sum_{i \in S_k} \left\lVert x_i - \mu_k \right\rVert_2^2.
$$

Lloyd's algorithm alternates two coordinate-descent steps until assignments stabilize:[^sklearn2026clustering]

1. **Assignment:** Assign each vector to its nearest centroid, $z_i = \arg\min_{k} \|x_i - \mu_k\|_2^2$.
2. **Update:** Move each nonempty centroid to the mean of its members, $\mu_k = \frac{1}{|S_k|}\sum_{i \in S_k} x_i$ (the unique solution to $\partial J / \partial \mu_k = 0$).

Each step keeps or lowers $J$, so with deterministic tie breaking and nonempty clusters Lloyd's loop halts in finitely many iterations.[^arthur2007KMeansPlusPlus] Coordinate descent can still settle into a local minimum that depends on the initial seeds, and iteration limits or tolerances can halt a run early.

Starting $K = 3$ from `fin_A` $(1.0, 1.0)$, `vis_A` $(4.0, 4.2)$, and `sys_A` $(8.0, 1.0)$ yields initial inertia $J_{\text{seed}} = 0.68 + 1.16 + 1.64 = 3.48$. Updating each center to its pair midpoint $(1.1, 1.4)$, $(4.5, 4.0)$, and $(8.5, 1.4)$ halves inertia cleanly to $1.74$.

<figure>
  <img src="illustrations/_generated/kmeans_loop_dark.png" alt="One Lloyd assignment and mean update on six two-dimensional vectors: fin_A and fin_B join C0, vis_A and vis_B join C1, and sys_A and sys_B join C2, shifting centers to (1.1, 1.4), (4.5, 4.0), and (8.5, 1.4) and halving inertia from 3.48 to 1.74." />
  <figcaption>One assignment and mean update moves each seed to its pair's midpoint, halving total inertia from 3.48 to 1.74 while keeping numeric cluster IDs arbitrary.</figcaption>
</figure>

### Seeding with k-means++ and handling empty clusters

Uniform random seeding can clump two centers inside one cluster and leave distant regions uncovered. **k-means++** draws $\mu_1$ uniformly at random, then samples each next center with probability proportional to its squared distance $D(x)^2 = \min_j \|x - \mu_j\|_2^2$ to the nearest chosen center, yielding an expected initial objective within $8(\ln K + 2)$ of optimal.[^arthur2007KMeansPlusPlus] Always guard against **empty clusters** too: averaging zero points yields `nan`, so libraries like scikit-learn's `KMeans` detect empty cells and reseed them explicitly.[^sklearnKMeans2026]

<!-- leetllm: test, deps=numpy, output=show -->
```python title="kmeans-and-seeding.py"
import numpy as np

names = np.array(["fin_A", "fin_B", "vis_A", "vis_B", "sys_A", "sys_B"])
vectors = np.array([[1.0, 1.0], [1.2, 1.8], [4.0, 4.2], [5.0, 3.8], [8.0, 1.0], [9.0, 1.8]])

def kmeans(x: np.ndarray, initial: np.ndarray, max_steps: int = 20):
    centers, prev = np.asarray(initial, float).copy(), None
    for step in range(1, max_steps + 1):
        labels = ((x[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2).argmin(axis=1)
        if np.array_equal(labels, prev):
            return labels, centers, float(((x - centers[labels]) ** 2).sum()), step
        groups = [x[labels == i] for i in range(len(centers))]
        if any(len(g) == 0 for g in groups):
            raise ValueError("empty cluster")
        centers, prev = np.vstack([g.mean(axis=0) for g in groups]), labels
    raise RuntimeError("did not converge")

labels, centers, inertia, steps = kmeans(vectors, vectors[[0, 2, 4]])
for idx in range(3):
    print(f"cluster {idx}: {names[labels == idx].tolist()} center={centers[idx].round(2).tolist()}")
print(f"converged in {steps} steps with inertia={inertia:.2f}")

d2 = ((vectors - vectors[0]) ** 2).sum(axis=1)
prob = d2 / d2.sum()
print("k-means++ P(next seed):", {str(n): round(float(p), 3) for n, p in zip(names, prob)})
```

<!-- leetllm: output:start -->
```text title="Output" output compact
cluster 0: ['fin_A', 'fin_B'] center=[1.1, 1.4]
cluster 1: ['vis_A', 'vis_B'] center=[4.5, 4.0]
cluster 2: ['sys_A', 'sys_B'] center=[8.5, 1.4]
converged in 2 steps with inertia=1.74
k-means++ P(next seed): {'fin_A': 0.0, 'fin_B': 0.004, 'vis_A': 0.122, 'vis_B': 0.151, 'sys_A': 0.311, 'sys_B': 0.411}
```
<!-- leetllm: output:end -->

After picking `fin_A`, neighbor `fin_B` has only a `0.4%` draw chance while the distant systems pair gets `72.2%`.

### Choosing $K$: elbow curves and silhouette scores

Inertia drops toward zero as $K \to n$, so pair an **elbow curve** with the **silhouette score**, comparing intra-cluster mean distance $a(i)$ to nearest-rival-cluster mean distance $b(i)$ (assigning `0` to singletons):[^sklearn2026silhouette]

$$
s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))} \in [-1, 1].
$$

<!-- leetllm: test, deps=numpy, output=show -->
```python title="elbow-and-silhouette.py"
from itertools import combinations
import numpy as np

vectors = np.array([[1.0, 1.0], [1.2, 1.8], [4.0, 4.2], [5.0, 3.8], [8.0, 1.0], [9.0, 1.8]])

def run_kmeans(x, initial):
    centers, prev = initial.astype(float).copy(), None
    for _ in range(20):
        labels = ((x[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2).argmin(axis=1)
        if np.array_equal(labels, prev):
            return labels, float(((x - centers[labels]) ** 2).sum())
        groups = [x[labels == i] for i in range(len(centers))]
        if any(len(g) == 0 for g in groups):
            return None
        centers, prev = np.vstack([g.mean(axis=0) for g in groups]), labels
    return None

def mean_silhouette(x, labels):
    scores = []
    for i, pt in enumerate(x):
        others = np.where((labels == labels[i]) & (np.arange(len(x)) != i))[0]
        if others.size == 0:
            scores.append(0.0)
            continue
        a = np.linalg.norm(x[others] - pt, axis=1).mean()
        b = min(np.linalg.norm(x[labels == c] - pt, axis=1).mean() for c in np.unique(labels) if c != labels[i])
        scores.append((b - a) / max(a, b) if max(a, b) > 0 else 0.0)
    return float(np.mean(scores))

for k in (2, 3, 4):
    runs = [r for idx in combinations(range(len(vectors)), k) if (r := run_kmeans(vectors, vectors[list(idx)])) is not None]
    labels, inertia = min(runs, key=lambda r: r[1])
    print(f"k={k}: inertia={inertia:.2f}, silhouette={mean_silhouette(vectors, labels):.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
k=2: inertia=20.06, silhouette=0.56
k=3: inertia=1.74, silhouette=0.76
k=4: inertia=0.92, silhouette=0.51
```
<!-- leetllm: output:end -->

`k = 3` cuts inertia from `20.06` to `1.74` and peaks silhouette at `0.76`; `k = 4` splits a coherent pair and drops silhouette to `0.51`. Remember that equal inertia can still mask incompatible stories (four points on a side-2 square `(±1, ±1)` split left/right or bottom/top at identical inertia `4.0`), so always inspect sampled members directly.

### Connecting clusters to vector search

At serving time, k-means centroids double as coarse routing cells in an **inverted file (IVF)** approximate nearest-neighbor index: a query compares against $K$ centroids first, then scans only the $nprobe$ closest posting lists instead of all $N$ documents.[^faiss2026indexes] Probing one cell (`nprobe = 1`) can miss a true nearest neighbor just across a Voronoi edge, so tuning `nprobe` trades work against ANN recall; for full IVF layouts, product quantization, and HNSW graphs, see [Vector Database Internals: HNSW and IVF](/learn/vector-database-internals-hnsw-ivf).

<figure>
  <img src="illustrations/_generated/ivf_coarse_clustering_dark.png" alt="Three centroid cells partition six two-dimensional vectors. Query (2.8, 2.71) sits closer to C1 (2.134) than C0 (2.146), so probing one list misses nearest document fin_B (1.841) in C0, whereas nprobe=2 scans both C1 and C0 to recover it." />
  <figcaption>At `nprobe = 1`, probing the closest centroid (`C1`) misses true nearest neighbor `fin_B` inside unprobed `C0`; probing two cells recovers it at 7 total distance checks (3 centroids + 4 vectors) versus 6 for a flat scan.</figcaption>
</figure>

## Compress representations with principal component analysis

**PCA** projects centered vectors $X_c = X - \mathbf{1}\mu^\top$ onto $m$ orthogonal unit axes capturing maximum variance.[^bishop2006] By Pythagoras, every centered vector splits its fixed squared norm into projected energy plus discarded orthogonal residual, so maximizing projected variance automatically minimizes squared reconstruction error:

$$
\sum_{i=1}^n \|x_i\|_2^2 = \sum_{i=1}^n (x_i^\top w)^2 + \sum_{i=1}^n \left\lVert x_i - (x_i^\top w)w \right\rVert_2^2.
$$

Compute thin **SVD** on the centered matrix, $X_c = U \Sigma V^\top$. Columns of $V$ are the principal directions (eigenvectors of sample covariance $C = \frac{1}{n-1}X_c^\top X_c$) with eigenvalues $\lambda_j = \sigma_j^2/(n - 1)$. Direct thin SVD avoids squaring the condition number in $X_c^\top X_c$ and avoids allocating a $d \times d$ matrix when $n \ll d$ (while scikit-learn's `PCA` can pick `covariance_eigh` when $n \gg d$ and $d$ is small).[^sklearn2026pca] Each component's **explained variance ratio** is $\sigma_j^2 / \sum_k \sigma_k^2$, and rank-$m$ reconstruction gives $\hat{X} = (X_c V_m) V_m^\top + \mathbf{1}\mu^\top$:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="pca-from-svd.py"
import numpy as np

vectors = np.array([[1.0, 1.0], [1.2, 1.8], [4.0, 4.2], [5.0, 3.8], [8.0, 1.0], [9.0, 1.8]])
mean = vectors.mean(axis=0)
centered = vectors - mean
_, s, vt = np.linalg.svd(centered, full_matrices=False)
pc1 = -vt[0] if vt[0, 0] < 0 else vt[0]
ratio = (s ** 2) / (s ** 2).sum()

print("mean:", np.round(mean, 2).tolist(), "pc1:", np.round(pc1, 3).tolist(), "ratios:", np.round(ratio, 3).tolist())
for m in (1, 2):
    recon = (centered @ vt[:m].T) @ vt[:m] + mean
    print(f"m={m}: variance_kept={ratio[:m].sum():.3f}, squared_error={((vectors - recon) ** 2).sum():.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mean: [4.7, 2.27] pc1: [1.0, -0.016] ratios: [0.852, 0.148]
m=1: variance_kept=0.852, squared_error=9.72
m=2: variance_kept=1.000, squared_error=0.00
```
<!-- leetllm: output:end -->

PC1 retains `85.2%` of variance in one scalar with squared reconstruction error `9.72` ($\sigma_2^2$). Eigenvector signs are arbitrary and leave distances and reconstructions invariant.

<figure>
  <img src="illustrations/_generated/pca_pipeline_dark.png" alt="PCA projects six two-dimensional embedding vectors onto their first principal component, a nearly horizontal axis passing through mean (4.7, 2.27), with perpendicular residual segments showing the 14.8% discarded variance (squared error 9.72) versus 85.2% retained variance." />
  <figcaption>Each point projects orthogonally onto PC1 through the sample mean, retaining 85.2% of total variance in one coordinate while discarding perpendicular residuals with squared error 9.72.</figcaption>
</figure>

> **Common mistake:** Do not cluster a 2D PCA plot and assume you preserved full-space neighborhoods. Compression alters pairwise distances, so verify clusters on downstream retrieval metrics.

## Four failure tests for representation geometry

Test every embedding pipeline against four concrete traps before shipping:

1. **Competing units:** Mixing a small-scale topic feature with raw character count `[100, 910]` makes Euclidean distance group by length. Standardize mixed-unit tabular columns (fitting only on the corpus, never held-out queries), while keeping pretrained embeddings in their model-specified normalization.
2. **Metric mismatch and off-sphere centroids:** On unit-norm embeddings[^openai2026EmbeddingFaq], $\|u - v\|_2^2 = 2 - 2\cos(u, v)$, so Euclidean and <span data-glossary="cosine-similarity">cosine</span> match. Once norms vary, <span data-glossary="dot-product">dot product</span> and cosine diverge. Even with unit inputs, ordinary k-means means fall *inside* the unit sphere (the mean of `(1, 0)` and `(0, 1)` has norm `0.707`), splitting Euclidean vs. cosine routing; use **spherical k-means** (re-normalizing centroids each update) to optimize cosine directly.[^faiss2026faq]
3. **Centering shifts cosine angles:** Subtracting $\mu$ preserves Euclidean differences $(u - \mu) - (v - \mu) = u - v$, yet shifts origin-anchored cosine angles and turns any vector equal to $\mu$ into the zero vector (undefined cosine).
4. **High variance can drop the query axis:** PCA maximizes global spread, not query relevance, so keeping `97.8%` of variance can still collapse distinct documents onto ties.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="four-representation-failure-tests.py"
import numpy as np

# 1. Scale overrides topic: col 0 = topic, col 1 = character count
mixed = np.array([[-3.2, 100], [-3.0, 500], [-2.8, 900], [2.8, 110], [3.0, 510], [3.2, 910]], float)
scaled = (mixed - mixed.mean(0)) / mixed.std(0)
print("1) raw dist fin_100->sys_110 vs fin_500:",
      round(float(np.linalg.norm(mixed[0] - mixed[3])), 1), "vs",
      round(float(np.linalg.norm(mixed[0] - mixed[1])), 1))
print("   scaled dist fin_100->sys_110 vs fin_500:",
      round(float(np.linalg.norm(scaled[0] - scaled[3])), 2), "vs",
      round(float(np.linalg.norm(scaled[0] - scaled[1])), 2))

# 2. Unit inputs still produce sub-unit centroids that split Euclidean vs cosine routing
c0 = np.array([[0.1, np.sqrt(0.99)], [0.1, -np.sqrt(0.99)]]).mean(axis=0)
centers, q = np.vstack([c0, [0.8, 0.6]]), np.array([1.0, 0.0])
print(f"2) ||c0||={np.linalg.norm(c0):.2f} -> Euclidean picks C{int(((centers - q)**2).sum(1).argmin())}, "
      f"cosine picks C{int(((centers @ q) / np.linalg.norm(centers, axis=1)).argmax())}")

# 3. Centering flips cosine sign
docs, q3 = np.array([[1.1, 2.1], [2.0, 1.0]]), np.array([1.0, 2.0])
cos = lambda u, v: float(np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v)))
m3 = docs.mean(axis=0)
print(f"3) cos(q, doc2): raw={cos(q3, docs[1]):.4f}, centered={cos(q3 - m3, docs[1] - m3):.4f}")

# 4. 97.8% explained variance still collapses the query's distinguishing axis
names4 = np.array(["fin_note", "fin_guide", "vision_ViT", "sys_note", "kernel_guide"])
docs4 = np.array([[-20.0, 0.0], [0.0, 0.0], [0.0, 3.0], [20.0, 0.0], [0.0, -3.0]])
q4 = np.array([0.0, 3.2])
c4 = docs4 - docs4.mean(0)
_, s4, vt4 = np.linalg.svd(c4, full_matrices=False)
d_proj = np.linalg.norm(c4 @ vt4[:1].T - (q4 - docs4.mean(0)) @ vt4[:1].T, axis=1)
ties = names4[np.isclose(d_proj, d_proj.min())].tolist()
print(f"4) PC1 kept={(s4[0]**2)/(s4**2).sum():.3f}; full nearest={names4[np.linalg.norm(docs4 - q4, axis=1).argmin()]}; PC1 ties={ties}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1) raw dist fin_100->sys_110 vs fin_500: 11.7 vs 400.0
   scaled dist fin_100->sys_110 vs fin_500: 2.0 vs 1.23
2) ||c0||=0.10 -> Euclidean picks C1, cosine picks C0
3) cos(q, doc2): raw=0.8000, centered=-0.9802
4) PC1 kept=0.978; full nearest=vision_ViT; PC1 ties=['fin_guide', 'vision_ViT', 'kernel_guide']
```
<!-- leetllm: output:end -->

Always close the loop on held-out labeled queries: inspect centroid and boundary samples, check whether top PCs correlate with length or formatting, keep clustering and serving metrics aligned, and verify Recall@K or NDCG before deploying compressed vectors.

```mastery-quiz
[
  {
    "question": "A fixed k-means group contains points (2, 1) and (6, 5). Which center and within-group squared-error total result from the exact Euclidean mean update?",
    "options": [
      "Center (2, 1); squared error 32.",
      "Center (4, 3); squared error 8.",
      "Center (4, 3); squared error 16.",
      "Center (8, 6); squared error 66."
    ],
    "answer": "Center (4, 3); squared error 16.",
    "explanation": "The coordinate mean is (4, 3). Each point differs by (±2, ±2), contributing 4 + 4 = 8, so total inertia is 16."
  },
  {
    "question": "Original k-means++ selects coordinate 0 first from [0, 3, 6]. A uniform draw returns u = 0.7 over cumulative intervals in dataset order. Which probabilities and selected coordinate follow?",
    "options": [
      "Probabilities [0, 0.2, 0.8]; selected coordinate 6.",
      "Probabilities [0, 1/3, 2/3]; selected coordinate 6.",
      "Probabilities [1/3, 1/3, 1/3]; selected coordinate 6.",
      "Probabilities [0, 0.2, 0.8]; selected coordinate 3."
    ],
    "answer": "Probabilities [0, 0.2, 0.8]; selected coordinate 6.",
    "explanation": "Squared distances are 0, 9, and 36 (sum 45), giving [0, 0.2, 0.8]; coordinate 6 owns [0.2, 1.0), containing 0.7."
  },
  {
    "question": "A centered five-row matrix has singular values 4 and 2, with all others zero. Which tuple gives the first sample-covariance eigenvalue, PC1 explained-variance ratio, and total squared residual keeping only PC1?",
    "options": [
      "4; 0.800; 1",
      "16; 0.800; 4",
      "4; 0.800; 4",
      "4; 0.667; 4"
    ],
    "answer": "4; 0.800; 4",
    "explanation": "Covariance eigenvalues divide squared singular values by n − 1 = 4, giving 4 and 1. PC1 keeps 16/20 = 0.800, and dropping PC2 leaves squared residual 2² = 4."
  },
  {
    "question": "A unit query is (1, 0). Two cluster means are C0 = (0.2, 0) and unit-norm C1 = (0.9, √0.19). Which center wins squared-Euclidean assignment, and which wins cosine assignment?",
    "options": [
      "Euclidean C0; cosine C1.",
      "Euclidean C1; cosine C1.",
      "Euclidean C0; cosine C0.",
      "Euclidean C1; cosine C0."
    ],
    "answer": "Euclidean C1; cosine C0.",
    "explanation": "Squared distances are 0.64 (C0) vs 0.20 (C1), while cosine scores are 1.0 (C0) vs 0.9 (C1). Sub-unit centroid norms break Euclidean-cosine equivalence."
  },
  {
    "question": "Corpus documents A = (3, 2) and B = (1, 2) define the fitted mean, and query q = (2, 2). After subtracting that mean from both documents and the query, what happens to Euclidean distances and centered cosines?",
    "options": [
      "Distances remain 1 and 1; both query cosines are undefined.",
      "Distances become 0 and 0; both query cosines are undefined.",
      "Distances remain 1 and 1; both query cosines equal 0.",
      "Distances remain 1 and 1; both query cosines equal 1."
    ],
    "answer": "Distances remain 1 and 1; both query cosines are undefined.",
    "explanation": "The mean is (2, 2), making the centered query (0, 0). Translation preserves Euclidean distances of 1, while zero norm leaves cosine undefined."
  }
]
```

> **Next:** Continue to [Validation and Leakage](/learn/cross-validation-leakage-generalization).
