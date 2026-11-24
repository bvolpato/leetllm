---
{
  "id": "clustering-pca-representation-learning",
  "title": "Clustering and PCA",
  "slug": "clustering-pca-representation-learning",
  "section": "ML Algorithms & Evaluation",
  "category": "Embeddings & Vector Search",
  "difficulty": "Medium",
  "order": 8,
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

Consider building semantic search over a corpus of technical abstracts spanning finance, computer vision, and GPU systems. An embedding model maps each abstract into a numeric vector, yet nobody has checked whether those vectors preserve topic structure. When someone queries an automated-trading abstract, will the nearest vector belong to another finance paper or an unrelated systems note?

Without labeled query-document pairs, we inspect vector geometry directly. **<span data-glossary="k-means">k-means</span>** partitions nearby points into discrete groups, while <span data-glossary="pca">principal component analysis (PCA)</span> projects vectors onto fewer coordinates for visualization or compression. Neither algorithm reads text strings. We will derive both update rules from scratch, turn those clusters into coarse Voronoi cells for inverted vector search, and stress-test whether nearest neighbors survive changes in scaling, similarity metrics, or dimensionality reduction.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Three nearest-neighbor pairs in six two-dimensional embedding coordinates: finance abstracts fin_A and fin_B sit 0.82 apart, vision abstracts vis_A and vis_B sit 1.08 apart, and systems abstracts sys_A and sys_B sit 1.28 apart." />
  <figcaption>Three nearest-neighbor pairs in two-dimensional embedding space connect finance, vision, and systems abstracts by Euclidean distance; topic names come only from reading source texts, whereas numeric cluster IDs carry no intrinsic meaning.</figcaption>
</figure>

## Start with six abstracts, not six labels

We will analyze six two-number <span data-glossary="embedding">embeddings</span> chosen so every pairwise distance, centroid update, and singular value remains easy to follow on paper. Production embeddings typically span hundreds or thousands of dimensions, whereas working in two coordinates lets us verify each geometric step by hand before generalizing to matrix operations. Every NumPy script below uses only plain arrays and coordinate-wise averages. Look at the topic descriptions alongside their two-dimensional coordinates first, and see which pairs ought to sit close together before calculating distances.

| Document ID | Abstract excerpt | $x$ | $y$ |
|---|---|---:|---:|
| `fin_A` | "Volatility clustering in limit order books." | 1.0 | 1.0 |
| `fin_B` | "Cross-asset hedging under regime shifts." | 1.2 | 1.8 |
| `vis_A` | "Patch attention in multi-scale vision transformers." | 4.0 | 4.2 |
| `vis_B` | "Depthwise convolutions for semantic segmentation." | 5.0 | 3.8 |
| `sys_A` | "Shared-memory tiling in fused matrix kernels." | 8.0 | 1.0 |
| `sys_B` | "Asynchronous warp scheduling on tensor cores." | 9.0 | 1.8 |

Identifiers in the first column exist solely for our external check rather than feeding into any algorithm. An unsupervised clustering routine receives only the six $(x, y)$ coordinate pairs without seeing whether an abstract belongs to finance, vision, or systems. Looking at the finance pair, the two points differ by $0.2$ horizontally and $0.8$ vertically, giving a straight-line separation of $\sqrt{0.2^2+0.8^2}=\sqrt{0.68}\approx0.82$. For any two vectors $a=(a_x,a_y)$ and $b=(b_x,b_y)$, Euclidean distance generalizes this coordinate difference:

$$
d(a,b)=\sqrt{(a_x-b_x)^2 + (a_y-b_y)^2}
$$

Evaluating this formula measures separation in the representation we currently have. Run it before clustering. A sensible local neighborhood gives the later groups something concrete to explain.

Our code computes all 36 pairwise distances. Broadcasting creates a `(6, 6, 2)` array of coordinate differences; `axis=2` reduces each coordinate pair to one distance, and setting the diagonal to infinity prevents each abstract from selecting itself.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="nearest-document-neighbors.py"
import numpy as np

names = np.array(["fin_A", "fin_B", "vis_A", "vis_B", "sys_A", "sys_B"])
vectors = np.array([
    [1.0, 1.0],
    [1.2, 1.8],
    [4.0, 4.2],
    [5.0, 3.8],
    [8.0, 1.0],
    [9.0, 1.8],
])

distances = np.linalg.norm(vectors[:, None, :] - vectors[None, :, :], axis=2)
np.fill_diagonal(distances, np.inf)

for row, name in enumerate(names):
    neighbor = distances[row].argmin()
    print(f"{name:10} -> {names[neighbor]:10} distance={distances[row, neighbor]:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fin_A      -> fin_B      distance=0.82
fin_B      -> fin_A      distance=0.82
vis_A      -> vis_B      distance=1.08
vis_B      -> vis_A      distance=1.08
sys_A      -> sys_B      distance=1.28
sys_B      -> sys_A      distance=1.28
```
<!-- leetllm: output:end -->

Each abstract's nearest neighbor falls within the same topic on this six-point sample, showing that local geometry aligns with subject themes. Yet pairwise neighbor lists grow quadratically as a corpus scales and fail to summarize broader structure across thousands of documents. To partition unlabeled collections into representative groups that we can sample, inspect, and index efficiently, we move from local neighbors to **clustering**.

## Partition unlabeled vectors with Lloyd's algorithm

Search itself does not require partitioning, yet grouping unlabeled <span data-glossary="vector">vectors</span> lets us sample representative documents for review and accelerate large-scale candidate lookup. Given a matrix of coordinates and a chosen cluster count $k$, k-means summarizes each group by its **centroid**, the arithmetic mean of its assigned points. The objective is the **within-cluster sum of squares (WCSS)**, commonly called **<span data-glossary="inertia">inertia</span>**:[^bishop2006][^sklearnKMeans2026]

$$
J = \sum_{k=1}^{K} \sum_{i \in S_k} \left\lVert x_i - \mu_k \right\rVert_2^2
$$

Here, $x_i$ is document vector $i$, $S_k$ is the set of points assigned to cluster $k$, and $\mu_k$ is the centroid of cluster $k$. Summing squared distances makes every distant point exert quadratic pull on its assigned centroid, penalizing dispersed clusters heavily. Lloyd's algorithm minimizes $J$ through alternating coordinate descent, holding assignments and centroids fixed in turn until neither moves:[^sklearn2026clustering]

1. **Assignment step:** Hold the centroids $\mu_k$ fixed and assign each vector $x_i$ to its nearest centroid under squared Euclidean distance:

$$
z_i = \arg\min_{k \in \{1,\dots,K\}} \left\lVert x_i - \mu_k \right\rVert_2^2
$$

2. **Update step:** Hold the cluster assignments $S_k$ fixed and recompute each centroid $\mu_k$ to minimize $J$, which sets the gradient with respect to $\mu_k$ to zero:

$$
\frac{\partial J}{\partial \mu_k} = -2 \sum_{i \in S_k} (x_i - \mu_k) = 0 \implies \mu_k = \frac{1}{|S_k|} \sum_{i \in S_k} x_i
$$

For any nonempty cluster, the sample mean uniquely minimizes the sum of squared Euclidean distances to its members, whereas an empty cluster has an undefined mean that our implementation must detect explicitly. Each alternating step decreases or preserves $J$, so with exact updates, deterministic tie breaking, and nonempty clusters, Lloyd's algorithm converges to a fixed assignment in finitely many iterations.[^arthur2007KMeansPlusPlus] Even so, convergence does not guarantee the global minimum of $J$, because coordinate descent stops at local optima and library step caps or tolerances can halt a run early.

To trace one complete pass by hand for $k=3$, place one initial seed inside each visible pair: $c_0=(1.0,1.0)$ from `fin_A`, $c_1=(4.0,4.2)$ from `vis_A`, and $c_2=(8.0,1.0)$ from `sys_A`. Each remaining point joins its closest seed (`fin_B` to $c_0$, `vis_B` to $c_1$, and `sys_B` to $c_2$). Summing squared Euclidean distances from every point to its assigned seed yields the initial objective $J_{\text{seed}} = (0^2 + 0^2) + (0.2^2 + 0.8^2) + (0^2 + 0^2) + (1.0^2 + (-0.4)^2) + (0^2 + 0^2) + (1.0^2 + 0.8^2) = 0.68 + 1.16 + 1.64 = 3.48$.

Next, recomputing each centroid as the coordinate-wise average of its two assigned members shifts every center to its pair midpoint, producing left group $(1.1, 1.4)$ for `fin_A`/`fin_B`, upper group $(4.5, 4.0)$ for `vis_A`/`vis_B`, and right group $(8.5, 1.4)$ for `sys_A`/`sys_B`. Because both points in a pair now lie equidistant from their shared midpoint, each contributes half of the former squared displacement. Evaluating $J$ around these updated centroids cuts total inertia cleanly in half, from $3.48$ down to $1.74$, which our NumPy check confirms below:

$$
J_{\text{updated}} = 2 \cdot (0.1^2 + 0.4^2) + 2 \cdot (0.5^2 + 0.2^2) + 2 \cdot (0.5^2 + 0.4^2) = 0.34 + 0.58 + 0.82 = 1.74
$$

<!-- leetllm: test, deps=numpy, output=show -->
```python title="one-kmeans-update.py"
import numpy as np

vectors = np.array([
    [1.0, 1.0], [1.2, 1.8],
    [4.0, 4.2], [5.0, 3.8],
    [8.0, 1.0], [9.0, 1.8],
])
centroids = vectors[[0, 2, 4]].copy()

squared_distance = ((vectors[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=2)
cluster = squared_distance.argmin(axis=1)
updated = np.vstack([vectors[cluster == index].mean(axis=0) for index in range(3)])
inertia = ((vectors - updated[cluster]) ** 2).sum()

print("assignment:", cluster.tolist())
print("updated centroids:", np.round(updated, 2).tolist())
print(f"inertia after update: {inertia:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
assignment: [0, 0, 1, 1, 2, 2]
updated centroids: [[1.1, 1.4], [4.5, 4.0], [8.5, 1.4]]
inertia after update: 1.74
```
<!-- leetllm: output:end -->

```checkpoint
Why should you avoid hardcoding `cluster 0 = finance` into a persistent index label?
---
Cluster integers carry no stable semantic meaning because a fresh initialization or retraining pass can permute cluster numbers across the exact same groups. Store a run identifier, sample members from each centroid, and maintain human-reviewed topic labels separately.
```

<figure>
  <img src="illustrations/_generated/kmeans_loop_dark.png" alt="One Lloyd assignment and mean update on six two-dimensional vectors: fin_A and fin_B join C0, vis_A and vis_B join C1, and sys_A and sys_B join C2, shifting centers to (1.1, 1.4), (4.5, 4.0), and (8.5, 1.4) and halving inertia from 3.48 to 1.74." />
  <figcaption>One assignment and mean update moves each seed to its pair's midpoint, halving total inertia from 3.48 to 1.74 while keeping numeric cluster IDs arbitrary.</figcaption>
</figure>

## Build the k-means loop and prevent initialization traps

Production clustering libraries wrap seeding, convergence criteria, and empty-cluster handling into a single call, so writing the loop by hand clarifies what those flags govern. Our scratch implementation accepts a <span data-glossary="matrix">matrix</span> of vectors alongside initial centers, halts when consecutive assignment arrays match (using NumPy's `argmin` for deterministic tie breaking), and caps execution at 20 steps instead of looping indefinitely. Before computing distances, enforce matching feature axes with vectors of shape `(n, d)` and centers of shape `(k, d)`, rejecting non-finite values up front. Without that shape check, an accidental `(k, 1)` center array would silently broadcast across all `d` columns via NumPy rules rather than raising an error.[^numpyBroadcasting2026]

<!-- leetllm: test, deps=numpy, output=show -->
```python title="kmeans-from-scratch.py"
import numpy as np

names = np.array(["fin_A", "fin_B", "vis_A", "vis_B", "sys_A", "sys_B"])
vectors = np.array([
    [1.0, 1.0], [1.2, 1.8],
    [4.0, 4.2], [5.0, 3.8],
    [8.0, 1.0], [9.0, 1.8],
])

def kmeans(x: np.ndarray, initial: np.ndarray, max_steps: int = 20):
    x = np.asarray(x, dtype=float)
    centers = np.asarray(initial, dtype=float).copy()
    if x.ndim != 2 or 0 in x.shape:
        raise ValueError("vectors must be a nonempty (n, d) matrix")
    if centers.ndim != 2 or len(centers) == 0 or centers.shape[1] != x.shape[1]:
        raise ValueError("centers must be a nonempty (k, d) matrix with matching features")
    if not np.isfinite(x).all() or not np.isfinite(centers).all():
        raise ValueError("vectors and centers must contain finite coordinates")
    previous_labels = None
    for step in range(1, max_steps + 1):
        squared = ((x[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2)
        labels = squared.argmin(axis=1)
        next_centers = []
        for index in range(len(centers)):
            members = x[labels == index]
            if members.shape[0] == 0:
                raise ValueError(f"cluster {index} is empty")
            next_centers.append(members.mean(axis=0))
        next_centers = np.vstack(next_centers)
        if np.array_equal(labels, previous_labels):
            inertia = ((x - next_centers[labels]) ** 2).sum()
            return labels, next_centers, inertia, step
        centers = next_centers
        previous_labels = labels.copy()
    raise RuntimeError("k-means did not converge")

labels, centers, inertia, steps = kmeans(vectors, vectors[[0, 2, 4]])
for index in range(3):
    members = names[labels == index].tolist()
    print(f"cluster {index}: {members} center={centers[index].round(2).tolist()}")
print(f"converged in {steps} steps with inertia={inertia:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
cluster 0: ['fin_A', 'fin_B'] center=[1.1, 1.4]
cluster 1: ['vis_A', 'vis_B'] center=[4.5, 4.0]
cluster 2: ['sys_A', 'sys_B'] center=[8.5, 1.4]
converged in 2 steps with inertia=1.74
```
<!-- leetllm: output:end -->

### The initialization trap: why k-means++ matters

Uniform random initialization can place multiple seeds inside a single dense neighborhood and leave distant regions unrepresented, trapping coordinate descent in a poor local minimum. Topic names still come solely from reading representative abstracts rather than from the seeding algorithm. To avoid clumped initial centers, Arthur and Vassilvitskii introduced **k-means++** initialization in 2007, which spreads seeds across space after a single uniform draw:[^arthur2007KMeansPlusPlus]

1. Select the first centroid $\mu_1$ uniformly at random from the dataset $X$.
2. For each point $x \in X$, compute $D(x)$, the shortest Euclidean distance from $x$ to any already chosen centroid:

$$
D(x) = \min_{j \in \{1,\dots,m\}} \|x - \mu_j\|_2
$$

3. Sample the next centroid from $X$ with probability proportional to the squared distance:

$$
P(x) = \frac{D(x)^2}{\sum_{x' \in X} D(x')^2}
$$

4. Repeat steps 2 and 3 until all $K$ centroids have been selected.

Farther points receive more probability. Already selected coordinates have probability zero, but another point in the same neighborhood can still be selected. If every remaining distance is zero, the formula's denominator vanishes: there are fewer distinct locations than requested centers.

Under this sampling rule, the expected initial objective satisfies $\mathbb{E}[J_{\mathrm{seed}}]\leq 8(\ln K+2)J^*$, where $J^*$ is the globally optimal WCSS, and subsequent Lloyd steps can only reduce it further.[^arthur2007KMeansPlusPlus] Because that guarantee holds in expectation over random draws, individual runs can still vary in convergence speed and final inertia. Weighting candidate draws by squared distance makes uncovered clusters disproportionately likely to attract the next seed while avoiding wasted passes in already populated regions. To see how those probabilities behave on our six corpus abstracts, suppose `fin_A` is drawn first:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="kmeans-plus-plus-sampling.py"
import numpy as np

vectors = np.array([
    [1.0, 1.0], [1.2, 1.8],
    [4.0, 4.2], [5.0, 3.8],
    [8.0, 1.0], [9.0, 1.8],
])
names = ["fin_A", "fin_B", "vis_A", "vis_B", "sys_A", "sys_B"]

# First seed picked at index 0 (fin_A)
seed_0 = vectors[0]
d2 = ((vectors - seed_0) ** 2).sum(axis=1)
prob = d2 / d2.sum()

for name, dist2, p in zip(names, d2, prob):
    print(f"{name:10} D(x)^2={dist2:5.2f}  P(selection)={p:5.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fin_A      D(x)^2= 0.00  P(selection)=0.000
fin_B      D(x)^2= 0.68  P(selection)=0.004
vis_A      D(x)^2=19.24  P(selection)=0.122
vis_B      D(x)^2=23.84  P(selection)=0.151
sys_A      D(x)^2=49.00  P(selection)=0.311
sys_B      D(x)^2=64.64  P(selection)=0.411
```
<!-- leetllm: output:end -->

With `fin_A` fixed as the first seed, its neighbor `fin_B` receives less than a 0.5% chance of selection next, while the distant systems abstracts `sys_A` and `sys_B` draw over 72% of the total probability mass. Note that scikit-learn's `KMeans` defaults to *greedy* k-means++ (sampling multiple candidates per step and keeping the lowest-inertia pick) and runs a single restart under `n_init="auto"`, so pass an integer `n_init` whenever you want multiple independent restarts.[^sklearnKMeans2026] Watch out too for an arithmetic trap if an initialized centroid receives zero points: averaging an empty slice produces `nan` unless you reject or reseed empty clusters explicitly.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="empty-cluster-assignment.py"
import numpy as np

vectors = np.array([
    [1.0, 1.0], [1.2, 1.8],
    [4.0, 4.2], [5.0, 3.8],
    [8.0, 1.0], [9.0, 1.8],
])
centers = np.array([[1.0, 1.0], [1.2, 1.8], [100.0, 100.0]])
squared = ((vectors[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2)
labels = squared.argmin(axis=1)
for index in range(3):
    print(f"cluster {index}: {(labels == index).sum()} points")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
cluster 0: 1 points
cluster 1: 5 points
cluster 2: 0 points
```
<!-- leetllm: output:end -->

Never average an empty cluster slice, because dividing zero by zero injects `nan` into every downstream update and silently corrupts future distance comparisons. Production clustering libraries pair empty-cluster detection with an explicit repair rule, such as splitting the highest-variance cluster or reseeding the orphaned centroid at the point farthest from any existing center. Checking slice cardinality before calling `mean` prevents those numerical failures from going unnoticed.

```checkpoint
One embedding dimension ranges from `0` to `1`, while another ranges from `0` to `10,000`. What happens if Euclidean k-means uses them without scaling?
---
The large-range coordinate dominates squared Euclidean distances and forces clusters to align with its numerical scale rather than underlying patterns. Standardize or rescale features consistently before fitting and interpreting clusters.
```

## Evaluate cluster geometry with elbow curves and silhouette scores

Working with six well-separated points made $k=3$ visually obvious, whereas a real embedding corpus offers no ground-truth cluster count up front. Even when topics feel intuitive, adding centers strictly shrinks WCSS until every vector sits at its own centroid with zero error, turning raw inertia into a deceptive model-selection metric on its own. Selecting $k$ therefore requires balancing diminishing inertia gains against cluster separation diagnostics and direct inspection of sampled cluster members:

1. **The elbow method:** Plot inertia against $k$. Globally optimal inertia can't increase as you add centers and reaches zero by $k=n$. Actual Lloyd runs can violate that trend because they find different local solutions. Compare restarts before interpreting a curve. An "elbow" is a visible slowdown in improvement, not necessarily a mathematical inflection or a uniquely correct topic count:

$$
\Delta J(k) = J(k) - J(k+1)
$$

2. **Silhouette analysis:** For each vector $x_i$, compute its intra-cluster cohesion $a(i)$ (the average distance to all other points in its assigned cluster):

$$
a(i) = \frac{1}{|S_{z_i}| - 1} \sum_{j \in S_{z_i}, j \neq i} \left\lVert x_i - x_j \right\rVert_2
$$

Next, find the nearest rival cluster and compute separation $b(i)$, defined as the smallest mean distance from point $i$ to every point in another cluster, $b(i) = \min_{k \neq z_i} \frac{1}{|S_k|} \sum_{j \in S_k} \left\lVert x_i - x_j \right\rVert_2$. Combining intra-cluster cohesion $a(i)$ with nearest-cluster separation $b(i)$ yields the point-wise **silhouette score**, which normalizes separation minus cohesion onto $[-1, 1]$:[^sklearn2026silhouette]

$$
s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}
$$

Scores near $+1$ indicate tight within-cluster cohesion relative to the nearest rival cluster, whereas negative scores mean a point lies closer on average to another cluster's **members** than to its own. A score near $0$ implies $a(i) \approx b(i)$, which does not necessarily place the point on a centroid's Voronoi edge. When a cluster holds a single member, $a(i)$ has a zero denominator, so scikit-learn and our helper below assign $s(i)=0$ (and also return $0$ if $a(i)=b(i)=0$), restricting mean silhouette evaluation to $2 \le K \le n-1$ nonempty clusters.[^sklearn2026silhouette] Watch below how adding a fourth center keeps lowering inertia while dragging silhouette down:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="compare-candidate-cluster-counts.py"
from itertools import combinations

import numpy as np

vectors = np.array([
    [1.0, 1.0], [1.2, 1.8],
    [4.0, 4.2], [5.0, 3.8],
    [8.0, 1.0], [9.0, 1.8],
])

def kmeans(x: np.ndarray, initial: np.ndarray, max_steps: int = 20):
    centers = initial.astype(float).copy()
    previous_labels = None
    for _ in range(max_steps):
        squared = ((x[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2)
        labels = squared.argmin(axis=1)
        next_centers = []
        for index in range(len(centers)):
            members = x[labels == index]
            if members.shape[0] == 0:
                return None
            next_centers.append(members.mean(axis=0))
        next_centers = np.vstack(next_centers)
        if np.array_equal(labels, previous_labels):
            inertia = ((x - next_centers[labels]) ** 2).sum()
            return labels, inertia
        centers = next_centers
        previous_labels = labels.copy()
    return None

def mean_silhouette(x: np.ndarray, labels: np.ndarray) -> float:
    if not 2 <= len(np.unique(labels)) <= len(x) - 1:
        raise ValueError("silhouette needs 2 through n-1 nonempty clusters")
    scores = []
    for i, point in enumerate(x):
        same = np.where(labels == labels[i])[0]
        others = same[same != i]
        if others.size == 0:
            scores.append(0.0)
            continue
        cohesion = np.linalg.norm(x[others] - point, axis=1).mean()
        separation = min(
            np.linalg.norm(x[labels == cluster] - point, axis=1).mean()
            for cluster in np.unique(labels) if cluster != labels[i]
        )
        scale = max(cohesion, separation)
        scores.append((separation - cohesion) / scale if scale > 0 else 0.0)
    return float(np.mean(scores))

for k in (2, 3, 4):
    best = None
    for idx in combinations(range(len(vectors)), k):
        result = kmeans(vectors, vectors[list(idx)])
        if result is None:
            continue
        labels, inertia = result
        if best is None or inertia < best[0]:
            best = (inertia, labels)
    if best is None:
        raise RuntimeError(f"no converged nonempty partition for k={k}")
    inertia, labels = best
    print(f"k={k}: inertia={inertia:.2f}, silhouette={mean_silhouette(vectors, labels):.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
k=2: inertia=20.06, silhouette=0.56
k=3: inertia=1.74, silhouette=0.76
k=4: inertia=0.92, silhouette=0.51
```
<!-- leetllm: output:end -->

Moving from $k=2$ to $k=3$ cuts inertia sharply from 20.06 to 1.74 and raises mean silhouette to 0.76, matching the three underlying topic pairs. Adding a fourth center lowers inertia further to 0.92, yet breaks a coherent pair apart and drops silhouette to 0.51. Notice also that enumerating point seeds finds the lowest inertia among tested initializations rather than proving global optimality.

### Equal scores can still tell different stories

An identical clustering objective value can correspond to completely incompatible partitions whenever geometry leaves the grouping axis ambiguous. Placing four abstracts at the vertices of a square creates two orthogonal two-cluster partitions with identical inertia, splitting either left versus right or bottom versus top. Testing both initializations confirms that squared distance alone cannot resolve structural symmetries:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="same-inertia-different-story.py"
import numpy as np

square = np.array([[0.0, 0.0], [0.0, 2.0], [2.0, 0.0], [2.0, 2.0]])
seeds = {
    "left/right": np.array([[0.0, 1.0], [2.0, 1.0]]),
    "bottom/top": np.array([[1.0, 0.0], [1.0, 2.0]]),
}

for name, seed in seeds.items():
    squared = ((square[:, None, :] - seed[None, :, :]) ** 2).sum(axis=2)
    labels = squared.argmin(axis=1)
    centers = np.vstack([square[labels == i].mean(axis=0) for i in range(2)])
    inertia = ((square - centers[labels]) ** 2).sum()
    groups = [np.where(labels == i)[0].tolist() for i in range(2)]
    print(f"{name:10} groups={groups} inertia={inertia:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
left/right groups=[[0, 1], [2, 3]] inertia=4.0
bottom/top groups=[[0, 2], [1, 3]] inertia=4.0
```
<!-- leetllm: output:end -->

Both partitions minimize squared error equally well, so inertia gives zero preference between them. If the horizontal coordinate encodes publication year and the vertical coordinate encodes theoretical versus systems focus, geometry alone cannot decide which grouping serves your index best. Whenever distinct clusterings tie on an unsupervised score, only task requirements and domain labels tell you which axes deserve priority, proving that equal objective values never make two label stories interchangeable.

## Compress representations with principal component analysis

K-means groups vectors into discrete partitions, whereas PCA asks a complementary geometric question: can we represent the point cloud in fewer continuous dimensions while capturing as much variance as possible? In the next two formulations, $x_i$ denotes a **centered** vector obtained by subtracting the sample mean from every row of $X$ to form $X_c$ (assuming $n > 1$). Two distinct derivations lead to the exact same directions:[^bishop2006]

1. **Maximum variance formulation:** Find a unit vector $w$ ($\|w\|_2=1$) whose projections attain maximum sample variance, where $C = \frac{1}{n-1} X_c^\top X_c$ denotes the sample covariance matrix:

$$
\max_{\|w\|=1} \frac{1}{n-1} \sum_{i=1}^n (x_i^\top w)^2 = \max_{\|w\|=1} w^\top C w
$$

2. **Minimum reconstruction error formulation:** Find a unit direction $w$ that minimizes the total squared orthogonal residual across all centered vectors:

$$
\min_{\|w\|=1} \sum_{i=1}^n \left\lVert x_i - (x_i^\top w) w \right\rVert_2^2
$$

These two objectives are mathematically equivalent because every orthogonal projection forms a right triangle with its residual, letting us apply the Pythagorean theorem point by point: $\|x_i\|_2^2 = \|(x_i^\top w) w\|_2^2 + \|x_i - (x_i^\top w) w\|_2^2$. Summing this identity across all $n$ centered vectors yields a constant total energy split between retained projection length and discarded residual error:

$$
\sum_{i=1}^n \|x_i\|_2^2 = \sum_{i=1}^n (x_i^\top w)^2 + \sum_{i=1}^n \|x_i-(x_i^\top w)w\|_2^2
$$

Dividing every term by $n-1$ casts the identity directly in sample-variance units. Because total variance on the left is fixed by the centered dataset, maximizing projected variance automatically minimizes total squared reconstruction error. Extending from one axis to $m$ components selects $m$ mutually orthogonal principal directions sequentially, and mapping low-dimensional coordinates back to input space adds the fitted mean vector back.

### Covariance eigendecomposition versus singular value decomposition

Before comparing algorithms, center the matrix by subtracting its column-wise mean vector $\mu$ from every row, $X_c = X - \mathbf{1} \mu^\top$. Note that centering aligns the origin with the data cloud so variance measures spread around the centroid rather than squared offset from zero. Two standard matrix factorizations then recover identical principal directions from $X_c$:[^sklearn2026pca]

- **Route A: Eigendecomposition of the covariance matrix.** Form $C = \frac{1}{n-1} X_c^\top X_c$, then solve the symmetric eigenvalue equation $C v_j = \lambda_j v_j$, where each unit eigenvector $v_j$ gives a principal direction and $\lambda_j$ gives the variance along that axis.
- **Route B: Singular Value Decomposition (SVD) directly on $X_c$.** Compute the thin factorization $X_c = U \Sigma V^\top$ with $r = \min(n, d)$, $U \in \mathbb{R}^{n \times r}$, diagonal $\Sigma \in \mathbb{R}^{r \times r}$, and $V \in \mathbb{R}^{d \times r}$. Substituting into the Gram matrix gives $X_c^\top X_c = (V \Sigma^\top U^\top)(U \Sigma V^\top) = V \Sigma^2 V^\top$.

Because $U^\top U = I_r$, the right singular vectors in columns of $V$ are the eigenvectors of $C$ (and when $r < d$, the remaining $d - r$ orthogonal directions carry zero covariance eigenvalue). Singular values and covariance eigenvalues therefore satisfy $\lambda_j = \sigma_j^2 / (n - 1)$. Although exact arithmetic equates both routes, finite-precision storage, matrix aspect ratios, and solver defaults create real engineering differences:

1. **Small directions can disappear.** On the nonzero singular spectrum, forming $X_c^\top X_c$ squares the singular-value ratio $\sigma_{\max}/\sigma_{\min}$, raising the risk that small singular values fall beneath floating-point rounding relative to dominant directions. For full column rank, $\kappa_2(X_c^\top X_c) = \kappa_2(X_c)^2$; when $n \ll d$, the covariance matrix is rank deficient so its ordinary condition number is infinite.
2. **Shape matters.** With 100 documents and 1536 embedding dimensions, computing covariance explicitly allocates a $1536\times1536$ matrix, whereas thin SVD operates directly on the $100\times1536$ matrix. Randomized SVD approximates leading components using matrix products whose runtime and precision depend on oversampling and power iterations, so $O(ndm)$ is not a universal bound across all exact solvers.[^sklearnRandomizedSVD2026]
3. **Library solver selection varies with matrix shape.** Scikit-learn's `PCA` supports both direct SVD solvers and `covariance_eigh`, choosing covariance eigendecomposition automatically when $n \gg d$ and $d$ is small.[^sklearn2026pca] Pick a solver deliberately for your dimensions and precision needs rather than assuming every library runs full SVD.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="svd-vs-covariance-equivalence.py"
import numpy as np

vectors = np.array([
    [1.0, 1.0], [1.2, 1.8],
    [4.0, 4.2], [5.0, 3.8],
    [8.0, 1.0], [9.0, 1.8],
])
n = len(vectors)
centered = vectors - vectors.mean(axis=0)

# Route A: SVD on centered data
_, s, vt = np.linalg.svd(centered, full_matrices=False)
eigenvalues_svd = (s ** 2) / (n - 1)

# Route B: Eigendecomposition of sample covariance matrix
cov = (centered.T @ centered) / (n - 1)
eigenvalues_cov = np.sort(np.linalg.eigvalsh(cov))[::-1]

print("SVD eigenvalues:       ", np.round(eigenvalues_svd, 4).tolist())
print("Covariance eigenvalues:", np.round(eigenvalues_cov, 4).tolist())
print("Eigenvalues match:     ", np.allclose(eigenvalues_svd, eigenvalues_cov))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
SVD eigenvalues:        [11.1825, 1.9442]
Covariance eigenvalues: [11.1825, 1.9442]
Eigenvalues match:      True
```
<!-- leetllm: output:end -->

The **explained variance ratio** measures the proportion of total linear spread captured by component $j$ whenever total variance is nonzero (counting trailing zero eigenvalues when extending a thin SVD to all $d$ coordinates). Because variance scales quadratically with centered projection lengths, squaring singular values partitions total geometric energy neatly across orthogonal axes. On our six technical abstracts, the first principal direction runs nearly horizontally along the $x$-axis and captures 85.2% of the total squared variation:

$$
\text{Ratio}_j = \frac{\lambda_j}{\sum_{k=1}^d \lambda_k} = \frac{\sigma_j^2}{\sum_{k=1}^d \sigma_k^2}
$$

<!-- leetllm: test, deps=numpy, output=show -->
```python title="pca-from-svd.py"
import numpy as np

names = np.array(["fin_A", "fin_B", "vis_A", "vis_B", "sys_A", "sys_B"])
vectors = np.array([
    [1.0, 1.0], [1.2, 1.8],
    [4.0, 4.2], [5.0, 3.8],
    [8.0, 1.0], [9.0, 1.8],
])

centered = vectors - vectors.mean(axis=0)
_, singular_values, vt = np.linalg.svd(centered, full_matrices=False)
pc1 = vt[0]
if pc1[0] < 0:
    pc1 = -pc1
projection = centered @ pc1
ratio = singular_values**2 / (singular_values**2).sum()

print("mean:", np.round(vectors.mean(axis=0), 2).tolist())
print("pc1:", np.round(pc1, 3).tolist())
print("explained variance:", np.round(ratio, 3).tolist())
for name, value in zip(names, projection):
    print(f"{name:10} pc1={value:5.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mean: [4.7, 2.27]
pc1: [1.0, -0.016]
explained variance: [0.852, 0.148]
fin_A      pc1=-3.68
fin_B      pc1=-3.49
vis_A      pc1=-0.73
vis_B      pc1= 0.27
sys_A      pc1= 3.32
sys_B      pc1= 4.31
```
<!-- leetllm: output:end -->

Keeping PC1 reduces each vector to a single scalar coordinate along a line passing through the sample mean. Notice that every eigenvector sign is arbitrary because negating $v_1$ flips the projected scores while leaving pairwise distances and reconstructed vectors unchanged. Likewise, equal eigenvalues permit arbitrary rotation inside the tied eigenspace, so cutting through a tie leaves the retained subspace non-unique.

<figure>
  <img src="illustrations/_generated/pca_pipeline_dark.png" alt="PCA projects six two-dimensional embedding vectors onto their first principal component, a nearly horizontal axis passing through mean (4.7, 2.27), with perpendicular residual segments showing the 14.8% discarded variance (squared error 9.72) versus 85.2% retained variance." />
  <figcaption>Each point projects orthogonally onto PC1 through the sample mean, retaining 85.2% of total variance in one coordinate while discarding perpendicular residuals with squared error 9.72.</figcaption>
</figure>

> **⚠️ Common mistake:** Do not cluster a 2D PCA projection and assume you have recovered exact neighborhoods from the original full-dimensional space. Reducing dimensions before clustering can strip noise or cut runtime, yet it alters pairwise geometry, so compare clusters built on reduced vectors directly against full-space clusters on your downstream task.

### Measure what compression discards

Connecting explained variance to reconstruction error reveals exactly what truncation loses when compressing embeddings. Projecting the centered vectors onto $v_1$ and mapping back via $\hat{X} = (X_c v_1) v_1^\top + \mathbf{1} \mu^\top$ recovers the best rank-1 approximation under Frobenius norm. Comparing $\hat{X}$ against the original coordinates confirms that squared residual error matches the variance along the discarded component:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="pca-reconstruction-error.py"
import numpy as np

vectors = np.array([
    [1.0, 1.0], [1.2, 1.8],
    [4.0, 4.2], [5.0, 3.8],
    [8.0, 1.0], [9.0, 1.8],
])
mean = vectors.mean(axis=0)
centered = vectors - mean
_, singular_values, vt = np.linalg.svd(centered, full_matrices=False)

for components in (1, 2):
    basis = vt[:components]
    reconstructed = (centered @ basis.T) @ basis + mean
    error = ((vectors - reconstructed) ** 2).sum()
    kept = (singular_values[:components] ** 2).sum() / (singular_values ** 2).sum()
    print(f"components={components}: variance_kept={kept:.3f}, squared_error={error:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
components=1: variance_kept=0.852, squared_error=9.72
components=2: variance_kept=1.000, squared_error=0.00
```
<!-- leetllm: output:end -->

This result captures the central limitation of PCA for downstream tasks: explained variance quantifies geometric spread rather than predictive or semantic importance. A low-variance direction may carry the subtle signal that separates rare query intents and determines whether search succeeds. Evaluating compressed representations directly on downstream tasks therefore stays mandatory even when retained variance exceeds 95%.

```checkpoint
Two principal components explain 95% of total variance. Does that prove they preserve retrieval quality?
---
No. PCA preserves high-variance directions, not task relevance. A low-variance direction may still carry the signal needed for a query, so measure downstream neighbors or retrieval metrics after projection.
```

## Connect clustering to vector search: inverted file indexing

Explained variance still leaves a serving bottleneck unsolved: at query time, which subset of documents should search actually inspect? An **inverted file (IVF)** index uses k-means for approximate nearest-neighbor (ANN) retrieval by partitioning vectors into coarse Voronoi cells, an approach offered by Faiss and pgvector (whereas Qdrant's dense index builds on HNSW graphs).[^faiss2026indexes][^pgvector_docs][^qdrantDenseIndex2026] Exhaustive flat search scans all $N$ vectors of dimension $d$ in $O(Nd)$ arithmetic, which can outperform an approximate index on modest corpora once batching, filtering, and memory access patterns enter the budget, making a flat baseline indispensable. A standard Euclidean IVFFlat index uses coarse k-means centroids in three phases:

1. **Training phase:** Learn $K$ coarse centroids from a representative corpus sample. Choose $K$ by measuring routing cost, candidate scans, and recall; a square-root-of-$N$ starting rule is a heuristic, not an optimum.[^faiss2026indexes]
2. **Index building:** Assign each document vector to its closest centroid. Each centroid's inverted list stores its assigned vectors and document IDs. IVFFlat retains full vectors; IVF variants can instead store compressed codes.
3. **Query phase:**
   - Compute distances from the incoming query vector $q$ to the $K$ coarse centroids.
   - Select the $nprobe$ closest centroids (typically $nprobe \ll K$, such as $nprobe = 16$).
   - Scan only the document vectors in the inverted posting lists belonging to those $nprobe$ cells.

With roughly equal posting lists, scanning $nprobe$ out of $K$ lists inspects about $N(nprobe/K)$ documents, giving total candidate-distance work $O(Kd + N(nprobe/K)d)$ once we include flat centroid search. At $K=4096$ and $nprobe=16$, balanced cells skip about 99.6% of document comparisons, although skewed posting lists change that fraction and coarse routing always adds work.[^faiss2026indexes] Crucially, holding $K$ and $nprobe$ constant still leaves query work linear in $N$. Let us build a minimal IVFFlat coarse index over our six corpus abstracts to trace centroid routing and list pruning step by step:

<figure>
  <img src="illustrations/_generated/ivf_coarse_clustering_dark.png" alt="Three centroid cells partition six two-dimensional vectors. Query (2.8, 2.71) sits closer to C1 (2.134) than C0 (2.146), so probing one list misses nearest document fin_B (1.841) in C0, whereas nprobe=2 scans both C1 and C0 to recover it." />
  <figcaption>At nprobe=1, probing the closest centroid (C1) misses true nearest neighbor fin_B inside unprobed C0; probing two cells recovers it at 7 total distance checks (3 centroids + 4 vectors) versus 6 for a flat scan.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="ivf-coarse-quantization-search.py"
import numpy as np

vectors = np.array([
    [1.0, 1.0], [1.2, 1.8],  # finance
    [4.0, 4.2], [5.0, 3.8],  # vision
    [8.0, 1.0], [9.0, 1.8],  # systems
])
names = ["fin_A", "fin_B", "vis_A", "vis_B", "sys_A", "sys_B"]

# Centroids learned during index training (K=3)
centroids = np.array([
    [1.1, 1.4],  # C0: finance
    [4.5, 4.0],  # C1: vision
    [8.5, 1.4],  # C2: systems
])

# Build inverted lists
assignments = ((vectors[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=2).argmin(axis=1)
inverted_lists = {cluster_id: [] for cluster_id in range(3)}
for doc_idx, cluster_id in enumerate(assignments):
    inverted_lists[cluster_id].append(doc_idx)

# Incoming query near the vision cluster
query = np.array([4.2, 4.0])

# Step 1: Coarse search over 3 centroids
centroid_distances = np.linalg.norm(centroids - query, axis=1)
nprobe = 1
probed_clusters = centroid_distances.argsort()[:nprobe]

# Step 2: Fine search only within probed inverted lists
candidate_indices = [idx for c in probed_clusters for idx in inverted_lists[c]]
candidate_distances = np.linalg.norm(vectors[candidate_indices] - query, axis=1)
best_match = candidate_indices[candidate_distances.argmin()]

print("probed clusters:", probed_clusters.tolist())
print("scanned docs:   ", [names[i] for i in candidate_indices])
print("nearest match:  ", names[best_match], f"(distance={candidate_distances.min():.2f})")
print(f"pruning ratio:   {len(names) - len(candidate_indices)} of {len(names)} vectors skipped")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
probed clusters: [1]
scanned docs:    ['vis_A', 'vis_B']
nearest match:   vis_A (distance=0.28)
pruning ratio:   4 of 6 vectors skipped
```
<!-- leetllm: output:end -->

The parameter $nprobe$ directly governs the speed-versus-recall trade-off across Voronoi partitions, controlling how many neighboring posting lists the fine-grained scan visits:

- **Low $nprobe$:** Fewer posting lists get scanned, raising the chance that an unprobed adjacent partition holds the true nearest vector whenever a query sits near a cell edge.
- **High $nprobe$:** More lists enter the candidate pool, improving ANN recall until scanning all lists with exact distances and deterministic tie breaking matches exhaustive flat search (whereas quantized IVF codes such as product quantization can still alter rankings even when every cell is visited).

### Make the nearest centroid give the wrong answer

Our vision query `[4.2, 4.0]` succeeded with one probe because it sat deep inside cell `C1`, well away from rival partitions. Moving the query vector to `[2.8, 2.71]` places it barely on the `C1` side of the Voronoi bisector separating `C0` and `C1`. Running exact lookup alongside increasing $nprobe$ shows how nearest-centroid distance and nearest-document distance diverge:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="ivf-boundary-miss.py"
import numpy as np

names = np.array(["fin_A", "fin_B", "vis_A", "vis_B", "sys_A", "sys_B"])
vectors = np.array([
    [1.0, 1.0], [1.2, 1.8], [4.0, 4.2],
    [5.0, 3.8], [8.0, 1.0], [9.0, 1.8],
])
centroids = np.array([[1.1, 1.4], [4.5, 4.0], [8.5, 1.4]])
assignment = ((vectors[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=2).argmin(axis=1)
query = np.array([2.8, 2.71])
coarse = np.linalg.norm(centroids - query, axis=1)
distance = np.linalg.norm(vectors - query, axis=1)
exact = int(distance.argmin())
print(f"C0 distance={coarse[0]:.3f}; C1 distance={coarse[1]:.3f}")
print(f"flat: {names[exact]} at {distance[exact]:.3f}")

for nprobe in (1, 2, 3):
    cells = coarse.argsort()[:nprobe]
    candidates = np.flatnonzero(np.isin(assignment, cells))
    fine = np.linalg.norm(vectors[candidates] - query, axis=1)
    winner = int(candidates[fine.argmin()])
    comparisons = len(centroids) + len(candidates)
    print(f"nprobe={nprobe}: cells={cells.tolist()} winner={names[winner]} "
          f"ANN recall@1={int(winner == exact)} distances={comparisons}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
C0 distance=2.146; C1 distance=2.134
flat: fin_B at 1.841
nprobe=1: cells=[1] winner=vis_A ANN recall@1=0 distances=5
nprobe=2: cells=[1, 0] winner=fin_B ANN recall@1=1 distances=7
nprobe=3: cells=[1, 0, 2] winner=fin_B ANN recall@1=1 distances=9
```
<!-- leetllm: output:end -->

These comparison counts track one ANN query, excluding the six-distance flat baseline run purely for verification. **ANN recall@1** measures whether the approximate search winner matches the exact Euclidean winner, generalizing at top $r$ to overlap with exact top-$r$ neighbors under consistent tie breaking. Keep this geometric metric distinct from semantic recall on labeled relevance pairs, since 100% ANN recall faithfully reproduces bad embeddings just as readily as good ones.

## Failure test 1: let units manufacture the clusters

Embedding vectors frequently sit beside scalar metadata such as document length, citation count, or publication year. Combining unlike measurements into a single feature matrix causes Euclidean k-means and PCA to align with the largest raw units rather than semantic structure. Below, a synthetic topic axis cleanly separates finance from systems abstracts, yet raw character count stretches across both categories, pulling a short finance abstract closer to a short systems abstract than to a long finance abstract. Running the exact same two-center loop from identical seed rows `[fin_100, sys_110]` before and after z-score scaling exposes the trap:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="scale-can-overrule-topic.py"
import numpy as np

# Column 0 carries topic; column 1 is message length in characters.
names = ["fin_100", "fin_500", "fin_900", "sys_110", "sys_510", "sys_910"]
features = np.array([
    [-3.2, 100.0], [-3.0, 500.0], [-2.8, 900.0],
    [ 2.8, 110.0], [ 3.0, 510.0], [ 3.2, 910.0],
])

def cluster(x: np.ndarray) -> list[int]:
    centers = x[[0, 3]].copy()  # Same source rows in both runs.
    previous = None
    for _ in range(20):
        squared = ((x[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2)
        labels = squared.argmin(axis=1)
        if np.array_equal(labels, previous):
            return labels.tolist()
        groups = [x[labels == i] for i in range(2)]
        if any(len(group) == 0 for group in groups):
            raise ValueError("empty cluster")
        centers = np.vstack([group.mean(axis=0) for group in groups])
        previous = labels.copy()
    raise RuntimeError("k-means did not converge")

print("raw dist fin_100 to sys_110:", round(float(np.linalg.norm(features[0] - features[3])), 1))
print("raw dist fin_100 to fin_900:", round(float(np.linalg.norm(features[0] - features[2])), 1))

raw_labels = cluster(features)
print("raw groups, seeds fin_100 and sys_110:")
for index in range(2):
    members = [names[i] for i, label in enumerate(raw_labels) if label == index]
    print(f"  cluster {index}: {members}")

scaled = (features - features.mean(axis=0)) / features.std(axis=0)
scaled_labels = cluster(scaled)
print("scaled groups, same seed rows:")
for index in range(2):
    members = [names[i] for i, label in enumerate(scaled_labels) if label == index]
    print(f"  cluster {index}: {members}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw dist fin_100 to sys_110: 11.7
raw dist fin_100 to fin_900: 800.0
raw groups, seeds fin_100 and sys_110:
  cluster 0: ['fin_100', 'sys_110']
  cluster 1: ['fin_500', 'fin_900', 'sys_510', 'sys_910']
scaled groups, same seed rows:
  cluster 0: ['fin_100', 'fin_500', 'fin_900']
  cluster 1: ['sys_110', 'sys_510', 'sys_910']
```
<!-- leetllm: output:end -->

Notice how the 800-character difference dwarfs the 6-unit topic gap, forcing the two short abstracts into the same cluster regardless of subject. Standardizing each feature to zero mean and unit variance puts both axes on equal variance footing and recovers the clean topic split. Every Euclidean step that touches raw numerical scales implicitly weighs coordinates by their variance unless rescaled intentionally.

Still, do not apply blind standardization to pretrained embeddings whose coordinates already reflect meaningful model geometry. Standardization imposes equal numerical variance per coordinate rather than semantic importance; if an embedding model specifies L2 normalization, adhere to that specification instead. Fit any scaler or PCA matrix solely on permitted training or corpus documents and reuse that saved transform for unseen queries. While available corpus vectors may participate in building an unsupervised index or transform at serving time, fitting on held-out evaluation queries leaks test distribution statistics into an evaluation promising unseen queries (in contrast to an explicitly transductive setting, as discussed in [supervised validation](/learn/cross-validation-leakage-generalization)).

## Failure test 2: let the similarity rule change neighbors

Text retrieval typically ranks documents by <span data-glossary="cosine-similarity">cosine similarity</span>, whereas Euclidean k-means minimizes squared distance and <span data-glossary="dot-product">dot product</span> scores reward both vector length and angular alignment. Choosing a similarity rule without verifying vector norms creates silent mismatches between clustering and serving. Many modern API embeddings (such as OpenAI's) arrive L2-normalized by default, including after `dimensions` truncation.[^openai2026EmbeddingFaq] On unit-norm vectors, cosine similarity matches dot product and squared Euclidean distance simplifies monotonically:

$$
\|u - v\|_2^2 = \|u\|_2^2 + \|v\|_2^2 - 2 (u \cdot v) = 2 - 2 \cos(u, v)
$$

Because $\|u - v\|_2^2$ decreases strictly as $\cos(u, v)$ increases, cosine nearest neighbors and Euclidean nearest neighbors rank unit vectors identically. Once vector norms vary, such as when concatenating unnormalized metadata or using unnormalized representations, metric choice alters which document wins. Comparing dot product against cosine on two vectors of unequal norm illustrates that flip immediately:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="metric-changes-the-neighbor.py"
import numpy as np

query = np.array([1.0, 0.0])
names = ["concise_finance_note", "long_systems_survey"]
documents = np.array([
    [1.0, 0.1],
    [8.0, 4.0],
])

dot = documents @ query
cosine = dot / (np.linalg.norm(documents, axis=1) * np.linalg.norm(query))

print("dot-product winner:", names[int(dot.argmax())])
print("cosine winner:     ", names[int(cosine.argmax())])
print("cosine scores:     ", np.round(cosine, 3).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dot-product winner: long_systems_survey
cosine winner:      concise_finance_note
cosine scores:      [0.995, 0.894]
```
<!-- leetllm: output:end -->

Equivalence between Euclidean distance and cosine ranking holds only when every compared vector shares unit length. Even when all documents are unit vectors, averaging them inside ordinary k-means produces centroids inside the unit sphere whose lengths fall strictly below 1 whenever members point in different directions. Because centroids sit off the unit sphere, distance comparisons against unnormalized centroids behave differently from pure cosine similarity:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="mean-leaves-the-unit-sphere.py"
import numpy as np

a = np.array([1.0, 0.0])
b = np.array([0.0, 1.0])
mean = (a + b) / 2
print("mean:", np.round(mean, 3).tolist())
print(f"mean L2 norm: {np.linalg.norm(mean):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mean: [0.5, 0.5]
mean L2 norm: 0.707
```
<!-- leetllm: output:end -->

For any unit query $x$, ordinary Euclidean assignment minimizes $1+\|\mu_k\|^2-2x^\top\mu_k$, so centroids with different norms pull decisions away from pure cosine angle. Normalizing vectors only at serving time can therefore route a query to a different cell than the index build assignment. Notice that the constructed centers below illustrate this norm mismatch directly rather than coming from a full clustering run:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="unit-inputs-do-not-make-unit-centers.py"
import numpy as np

# C0 is the mean of two unit vectors; C1 contains one unit vector.
c0_members = np.array([[0.1, np.sqrt(0.99)], [0.1, -np.sqrt(0.99)]])
centers = np.vstack([c0_members.mean(axis=0), [0.8, 0.6]])
query = np.array([1.0, 0.0])
squared = ((centers - query) ** 2).sum(axis=1)
cosine = (centers @ query) / np.linalg.norm(centers, axis=1)
print("squared Euclidean distances:", np.round(squared, 2).tolist())
print("cosine similarities:", np.round(cosine, 2).tolist())
print("Euclidean routes to C" + str(int(squared.argmin())))
print("cosine routes to C" + str(int(cosine.argmax())))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
squared Euclidean distances: [0.81, 0.4]
cosine similarities: [1.0, 0.8]
Euclidean routes to C1
cosine routes to C0
```
<!-- leetllm: output:end -->

To optimize a cosine objective directly during partitioning, use **spherical k-means**, which L2-normalizes nonzero inputs, assigns each vector by maximum dot product against unit centroids, and re-normalizes every updated centroid sum (falling back explicitly on empty cells or opposite unit sums that cancel to zero).[^faiss2026faq] Whichever metric you pick, keep index construction and query routing aligned and verify held-out recall. Keep in mind too that Euclidean k-means yields convex Voronoi regions without assuming clusters follow equal-size spherical Gaussians; if true semantic groups curve or elongate, k-means can split one topic or spend a dedicated center on a stray outlier, so always inspect cluster assignments against representative examples.

## Failure test 3: centering changes cosine geometry

Cosine similarity measures the angle between vectors anchored at the origin, $\text{cosine\_similarity}(u, v) = (u \cdot v) / (\|u\|\|v\|)$. Subtracting the sample mean vector $\mu$ before PCA shifts the origin directly to the data centroid.[^sklearn2026pca] While shared translation cancels out of pairwise Euclidean differences via $(u-\mu)-(v-\mu)=u-v$ (and any complete orthonormal basis keeps Euclidean distances invariant), cosine angles depend explicitly on the origin and therefore shift after centering. Fitting the corpus mean on documents and subtracting it from both documents and query demonstrates this rotation:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="cosine-centering-bias.py"
import numpy as np

query = np.array([1.0, 2.0])
doc1 = np.array([1.1, 2.1])  # Close to query direction
doc2 = np.array([2.0, 1.0])  # Further away in direction

def cos_sim(u, v):
    denominator = np.linalg.norm(u) * np.linalg.norm(v)
    if denominator == 0:
        raise ValueError("cosine is undefined for a zero vector")
    return float(np.dot(u, v) / denominator)

orig_cos1 = cos_sim(query, doc1)
orig_cos2 = cos_sim(query, doc2)

documents = np.array([doc1, doc2])
mean = documents.mean(axis=0)
q_centered = query - mean
d1_centered = doc1 - mean
d2_centered = doc2 - mean

centered_cos1 = cos_sim(q_centered, d1_centered)
centered_cos2 = cos_sim(q_centered, d2_centered)

print(f"Original cos(query, doc1): {orig_cos1:.4f}")
print(f"Original cos(query, doc2): {orig_cos2:.4f}")
print(f"Centered cos(query, doc1): {centered_cos1:.4f}")
print(f"Centered cos(query, doc2): {centered_cos2:.4f}")

assert orig_cos1 > orig_cos2
assert centered_cos1 > 0
assert centered_cos2 < 0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Original cos(query, doc1): 0.9998
Original cos(query, doc2): 0.8000
Centered cos(query, doc1): 0.9802
Centered cos(query, doc2): -0.9802
```
<!-- leetllm: output:end -->

Centering flips `doc2` from positive alignment to over 90 degrees away from the query, and any document equal to the fitted corpus mean becomes the zero vector with undefined cosine similarity. Although the top rank holds here, shifted cosines can easily reorder candidates, so validate compressed cosine spaces directly on zero-vector edge cases and retrieval rankings.

## Failure test 4: PCA can hide the dimension your query needs

A retrieval engine does not optimize low-rank reconstruction error across the whole corpus; it must surface the right document for a specific query. Suppose horizontal spread between finance notes and systems manuals dominates corpus variance, whereas the narrower vertical coordinate separates vision models from neighboring general references. Projecting all five documents onto just one principal component before running nearest-neighbor search shows how high explained variance can still break query lookup:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="compression-can-change-retrieval.py"
import numpy as np

names = np.array(["finance_note", "finance_guide", "vision_ViT", "systems_note", "kernel_guide"])
documents = np.array([
    [-20.0, 0.0],
    [ 0.0, 0.0],
    [ 0.0, 3.0],
    [20.0, 0.0],
    [ 0.0, -3.0],
])
query = np.array([0.0, 3.2])

full_distance = np.linalg.norm(documents - query, axis=1)
full_winner = names[full_distance.argmin()]

mean = documents.mean(axis=0)
centered = documents - mean
singular_values, vt = np.linalg.svd(centered, full_matrices=False)[1:]
pc1 = vt[:1]
compressed_documents = centered @ pc1.T
compressed_query = (query - mean) @ pc1.T
compressed_distance = np.linalg.norm(compressed_documents - compressed_query, axis=1)
compressed_ties = names[np.isclose(compressed_distance, compressed_distance.min())].tolist()
kept = float((singular_values ** 2)[0] / (singular_values ** 2).sum())

print(f"PC1 variance kept: {kept:.3f}")
print("full-space nearest: ", full_winner)
print("one-PC nearest ties: ", compressed_ties)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
PC1 variance kept: 0.978
full-space nearest:  vision_ViT
one-PC nearest ties:  ['finance_guide', 'vision_ViT', 'kernel_guide']
```
<!-- leetllm: output:end -->

After projection onto PC1, `finance_guide`, `vision_ViT`, and `kernel_guide` collapse onto identical one-dimensional coordinates because PCA dropped the vertical axis separating the vision document from alternatives. An `argmin` call then breaks the tie arbitrarily by returning whichever index appears first in memory. Global reconstruction error and query relevance therefore measure distinct goals, making downstream Recall@K and NDCG evaluation on labeled query pairs essential before deploying compressed embeddings.

## Turn every plot into a representation review

An unsupervised projection earns its keep when it produces falsifiable checks rather than just tidy scatter plots. Before relying on any representation for clustering or search, systematically verify five questions across sampled documents:

| Verification question | Evidence to collect |
|---|---|
| Do local neighbors cover the same topic? | Inspect nearest-document pairs sampled across the corpus. |
| Do proposed clusters stay coherent? | Sample abstracts closest to centroids as well as points near cell edges. |
| Does a dominant axis reflect length or formatting? | Correlate PCA coordinates against document length and source metadata. |
| Does cluster metric align with serving retrieval? | Match normalization and Euclidean vs. cosine metrics to the model specification. |
| Does compression hurt rare query intents? | Measure retrieval metrics before and after PCA on held-out query-document pairs. |

Treat reviewed development examples strictly as a tuning set, keeping an untouched held-out benchmark separate for final retrieval evaluation. Recording purity and cluster balances programmatically helps turn spot-checks into repeatable diagnostics across runs. Applying this summary check to our six corpus abstracts verifies that every cluster recovers one consistent topic label:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="cluster-purity-summary.py"
import numpy as np

names = np.array(["fin_A", "fin_B", "vis_A", "vis_B", "sys_A", "sys_B"])
reviewed_topic = np.array(["finance", "finance", "vision", "vision", "systems", "systems"])
vectors = np.array([
    [1.0, 1.0], [1.2, 1.8],
    [4.0, 4.2], [5.0, 3.8],
    [8.0, 1.0], [9.0, 1.8],
])

squared = ((vectors[:, None, :] - vectors[[0, 2, 4]][None, :, :]) ** 2).sum(axis=2)
labels = squared.argmin(axis=1)
centers = np.vstack([vectors[labels == index].mean(axis=0) for index in range(3)])
labels = ((vectors[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2).argmin(axis=1)

for cluster in range(3):
    topics, counts = np.unique(reviewed_topic[labels == cluster], return_counts=True)
    dominant = topics[counts.argmax()]
    purity = counts.max() / counts.sum()
    members = names[labels == cluster].tolist()
    print(f"cluster {cluster}: proposed={dominant:8} purity={purity:.2f} members={members}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
cluster 0: proposed=finance  purity=1.00 members=['fin_A', 'fin_B']
cluster 1: proposed=vision   purity=1.00 members=['vis_A', 'vis_B']
cluster 2: proposed=systems  purity=1.00 members=['sys_A', 'sys_B']
```
<!-- leetllm: output:end -->

> **Key insight:** Cluster purity reaches `1.00` trivially if every point gets its own cluster. Track cluster size distributions, per-topic coverage, and downstream retrieval metrics alongside purity rather than stopping at within-sample purity alone.

## Practice: try to break the representation

Use the clean six-document run as a baseline, then perturb one choice at a time to see where geometry breaks:

1. **Empty center repair.** Modify the initial seeds in `kmeans-from-scratch.py` so one cluster empties. Implement a reseed rule that restarts the orphaned centroid at the point having the highest current squared distance from any center.
2. **K-means++ restart test.** Implement the full k-means++ selection loop. Compare the variance of final inertia across 50 random restarts between uniform random seeding and k-means++ seeding.
3. **Competing units.** Add a metadata column (like character count) with values in $[100, 1000]$. Compare cluster assignments before and after z-score standardization.
4. **IVF recall edge case.** Reproduce the miss at $[2.8,2.71]$. The C0/C1 perpendicular bisector is $3.4q_x+2.6q_y=16.54$; verify the center-distance tie at $[2.8,2.7]$. Then move slightly to each side and compare center routing with exact document lookup. Count coarse and fine comparisons separately.
5. **Lost query signal.** Retain both principal components in `compression-can-change-retrieval.py`. Confirm that the vision query recovers `vision_ViT`, and explain why high explained variance didn't prevent the rank-1 tie.

<details>
<summary>Check what each experiment reveals</summary>

- An empty `mean(axis=0)` produces `NaN`. Detect `members.shape[0] == 0` and trigger an explicit reseed rather than propagating `NaN`.
- K-means++ changes the distribution over starting seeds. Compare inertia and iteration counts across the same restart budget.
- When unscaled metadata dominates distance, clustering reflects units rather than semantics. Standardize mixed-unit features before interpreting clusters.
- One probe can miss an exact neighbor near a cell edge. Sweep $nprobe$ against exact flat-search recall and measured latency.
- PCA preserves global variance, not task labels. Evaluate downstream retrieval metrics on held-out pairs before deploying compressed embeddings.

</details>

```mastery-quiz
[
  {
    "question": "A fixed k-means group contains points (2,1) and (6,5). Which center and within-group squared-error total result from the exact Euclidean mean update?",
    "options": [
      "Center (2,1); squared error 32.",
      "Center (4,3); squared error 8.",
      "Center (4,3); squared error 16.",
      "Center (8,6); squared error 66."
    ],
    "answer": "Center (4,3); squared error 16.",
    "explanation": "The coordinate mean is (4,3). Each point differs by (±2,±2), contributing 4+4=8, so total inertia is 16. Choosing a data point keeps error 32; reporting 8 counts only one member; summing coordinates without division gives the wrong center."
  },
  {
    "question": "Original k-means++ has selected the point at coordinate 0 from the one-dimensional dataset [0,3,6]. A uniform draw returns u=0.7, using half-open cumulative probability intervals in dataset order. Which next-center probabilities and selected coordinate follow?",
    "options": [
      "Probabilities [0,0.2,0.8]; selected coordinate 6.",
      "Probabilities [0,1/3,2/3]; selected coordinate 6.",
      "Probabilities [1/3,1/3,1/3]; selected coordinate 6.",
      "Probabilities [0,0.2,0.8]; selected coordinate 3."
    ],
    "answer": "Probabilities [0,0.2,0.8]; selected coordinate 6.",
    "explanation": "Squared distances are 0,9,36 and sum to 45, giving [0,0.2,0.8]. The interval for coordinate 6 is [0.2,1), which contains 0.7. Unsquared distance gives the tempting one-third/two-thirds distribution. This single draw illustrates one original-rule selection rather than guaranteeing final cluster quality."
  },
  {
    "question": "Points (0,0), (0,1), (9,0), (9,1) are assigned to nearest centers C0=(0,0), C1=(0,1), C2=(100,100), with Euclidean distance. Before any mean update, which C0/C1/C2 member-count vector should the loop inspect?",
    "options": [
      "[1,3,0]",
      "[1,2,1]",
      "[2,1,1]",
      "[2,2,0]"
    ],
    "answer": "[2,2,0]",
    "explanation": "The two points at y=0 choose C0; the two at y=1 choose C1; none chooses the distant C2. Counts [2,2,0] expose the empty center before averaging. The guarded loop must raise or trigger its reseed rule; a mean of no points is undefined."
  },
  {
    "question": "Point P has mean distance 2 to the other members of its cluster. Its only rival clusters are R and S. P is 3 units from one member of R and 9 from the other. Point T is the only member of S and is 4 units from P. What are the silhouette scores for P and T, respectively, rounded to three decimal places?",
    "options": [
      "0.667 and 1.000",
      "0.500 and 0.000",
      "0.667 and 0.000",
      "0.500 and 1.000"
    ],
    "answer": "0.500 and 0.000",
    "explanation": "The distances from P average (3 + 9) / 2 = 6 for R and 4 for S, which contains only T. The smaller mean is 4, so P scores (4 − 2) / 4 = 0.500. A score of 0.667 for P comes from skipping S and using R's mean of 6. T has no cluster mate, so its own silhouette is 0.000 by convention. A score of 1.000 for T comes from setting its missing within-cluster mean to zero and applying the usual formula. The pair 0.667 and 1.000 makes both mistakes."
  },
  {
    "question": "A centered five-row matrix has singular values 4 and 2, with all other singular values zero. Which tuple gives the first sample-covariance eigenvalue, PC1 explained-variance ratio, and total squared residual after keeping only PC1?",
    "options": [
      "4; 0.800; 1",
      "16; 0.800; 4",
      "4; 0.800; 4",
      "4; 0.667; 4"
    ],
    "answer": "4; 0.800; 4",
    "explanation": "Covariance eigenvalues divide squared singular values by n−1=4, giving 4 and 1. PC1 retains 16/(16+4)=0.8 of the squared energy. Dropping the second component leaves squared residual 2²=4, not its covariance eigenvalue 1. Using singular values without squaring produces the wrong ratio."
  },
  {
    "question": "A unit query is (1,0). Two constructed group means are C0=(0.2,0) and C1=(0.9,√0.19). The latter has unit norm. Which center wins ordinary squared-Euclidean assignment, and which wins cosine assignment?",
    "options": [
      "Euclidean C0; cosine C1.",
      "Euclidean C1; cosine C1.",
      "Euclidean C0; cosine C0.",
      "Euclidean C1; cosine C0."
    ],
    "answer": "Euclidean C1; cosine C0.",
    "explanation": "Squared distances are 0.8²=0.64 for C0 and 0.1²+0.19=0.20 for C1. Cosine scores are 1 for C0 and 0.9 for C1. Center norms therefore change the assignment despite a unit query; normalizing centers only during serving can disagree with Euclidean list construction."
  },
  {
    "question": "Corpus documents A=(3,2) and B=(1,2) define the fitted mean. A query is (2,2). Subtract that same mean from both documents and the query. What happens to the query-document Euclidean distances and the centered query cosines?",
    "options": [
      "Distances remain 1 and 1; both query cosines are undefined.",
      "Distances become 0 and 0; both query cosines are undefined.",
      "Distances remain 1 and 1; both query cosines equal 0.",
      "Distances remain 1 and 1; both query cosines equal 1."
    ],
    "answer": "Distances remain 1 and 1; both query cosines are undefined.",
    "explanation": "The fitted mean is (2,2), making the centered query zero and documents (1,0) and (−1,0). Shared translation preserves the two Euclidean distances of 1, but cosine divides by the zero query norm. A zero vector needs explicit handling rather than an arbitrary fallback cosine score."
  },
  {
    "question": "An IVFFlat index has 12,000 full-precision document vectors evenly divided among 60 lists. A query uses a flat coarse search and probes 3 lists. How many document-vector distances and total coarse-plus-document distances does that query compute?",
    "options": [
      "600 document distances; 600 total.",
      "600 document distances; 660 total.",
      "200 document distances; 260 total.",
      "12,000 document distances; 12,060 total."
    ],
    "answer": "600 document distances; 660 total.",
    "explanation": "Balanced lists hold 12,000/60=200 documents each. Three lists require 600 document distances, plus 60 coarse-center distances, totaling 660. Omitting routing, scanning only one list, or scanning all lists yields different work counts, while wall-clock latency also depends on hardware and batching."
  },
  {
    "question": "An evaluation promises unseen queries. A scaler fitted on the permitted corpus stores mean [4,100] and standard deviation [2,50]. A held-out query is [8,200]. Which transform and evaluation decision follows?",
    "options": [
      "Transform to [4,4]; retain the corpus-fitted transform.",
      "Transform to [2,2]; refit the scaler using this query.",
      "Transform to [0,0]; retain the corpus-fitted transform.",
      "Transform to [2,2]; retain the corpus-fitted transform."
    ],
    "answer": "Transform to [2,2]; retain the corpus-fitted transform.",
    "explanation": "Coordinate-wise subtraction and division give [(8−4)/2,(200−100)/50]=[2,2]. Reuse the permitted fitted transform for an evaluation promising unseen queries. Refitting on this held-out query changes the coordinate system and violates that protocol; an explicitly transductive protocol would make a different promise."
  },
  {
    "question": "In storage order P/B/L/D/R, five mean-zero documents are P=(−8,−8), B=(0,0), L=(1,−1), D=(8,8), R=(−1,1). Query q=(1.2,−1.2) is closest to L in full space. Retain only principal direction (1/√2,1/√2), and let exact ties select the first stored document. Which retained-variance ratio and returned ID follow?",
    "options": [
      "About 98.46%; returned B.",
      "About 98.46%; returned L.",
      "About 50.00%; returned B.",
      "About 1.54%; returned B."
    ],
    "answer": "About 98.46%; returned B.",
    "explanation": "P and D contribute 256 squared units along the retained diagonal; L and R contribute 4 in the perpendicular direction. The kept ratio is 256/260≈98.46%. B, L, R and the query all project to zero, so first stored tied B wins. High total retained variance did not preserve this query’s perpendicular distinction. Restoring the second component recovers the full-space unique neighbor."
  }
]
```

> **Next:** Continue to [Probabilistic Generative Models](/learn/probabilistic-generative-models-em). You can now partition unlabeled vectors with Lloyd's algorithm, evaluate cluster geometry with silhouette scores, and inspect compressed subspaces with PCA. Next you'll model how latent Gaussian distributions generate observations, replacing hard cluster assignments with expectation-maximization soft responsibilities.
