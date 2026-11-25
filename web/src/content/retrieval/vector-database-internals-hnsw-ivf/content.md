---
{
  "id": "vector-database-internals-hnsw-ivf",
  "title": "Vector DB Internals: HNSW & IVF",
  "slug": "vector-database-internals-hnsw-ivf",
  "category": "Embeddings & Vector Search",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/vector_db_internals_dark.png",
  "companies": [
    "Google",
    "Meta",
    "Pinecone",
    "Weaviate",
    "Qdrant",
    "Databricks"
  ],
  "shortDescription": "Scan 100 million embeddings naively and every query touches 153.6 billion floats. Build HNSW, IVF, and Product Quantization from scratch, then tune recall, memory, and filtered search.",
  "keyConceptsTested": [
    "HNSW small-world navigation",
    "IVF Voronoi partitioning",
    "Product Quantization (PQ) compression",
    "Asymmetric Distance Computation (ADC)",
    "Recall-Latency Tradeoff Curves",
    "Memory vs Compute Constraints",
    "Disk-based indexing (DiskANN)",
    "Filtered-search completeness",
    "Distributed top-k and tail latency"
  ],
  "section": "Advanced Agents & Retrieval",
  "order": 1,
  "prerequisites": [
    "embeddings-cosine-dot-product-quantization",
    "chunking-strategies-document-processing",
    "design-production-rag-pipeline"
  ],
  "relatedQuestions": [
    "advanced-rag-query-rewriting-self-rag",
    "core-retrieval-algorithms",
    "design-production-rag-pipeline"
  ]
}
---

Suppose your search engine holds 100 million 1,536-dimensional <span data-glossary="embedding">embeddings</span>, and a user query arrives with a 15-millisecond latency budget. Checking every vector exactly means streaming 572 GiB of float32 numbers and scoring 153.6 billion scalar components for a single request. Yet skipping 99.9% of the corpus risks missing the exact passage the user needed. How can an index ignore almost every vector in a 1,536-dimensional space and still land in the right neighborhood?

Three ideas answer that question, and every modern vector database builds on them: **<span data-glossary="hnsw">Hierarchical Navigable Small World (HNSW)</span>** walks a multi-layer proximity graph, **<span data-glossary="ivf">Inverted File (IVF)</span>** partitions space into coarse Voronoi cells and opens only a few, and **<span data-glossary="product-quantization">Product Quantization (PQ)</span>** compresses each vector into short byte codes so billions of records fit in RAM.

The [embedding lesson](/learn/embeddings-cosine-dot-product-quantization) fixed the ranking rule: compare vectors using the distance metric and normalization expected by the embedding model. A vector index approximates that exact ranking faster and in less memory; it cannot fix weak embeddings, and its accuracy is always measured against exact search on the same vectors.

## The brute-force problem

**Exact search** (flat search) computes the distance from query <span data-glossary="vector">vector</span> $q$ to every stored vector and returns the $k$ closest ($k$-NN). For $N$ vectors of dimension $d$, each unfiltered query does <span data-glossary="big-o-notation">$O(N \cdot d)$</span> arithmetic, and storing the raw float32 matrix alone takes:

$$
100{,}000{,}000 \text{ vectors} \times 1{,}536 \text{ dims} \times 4 \text{ bytes} \approx 614 \text{ GB} \approx 572.2 \text{ GiB}
$$

Why not reach for a classic k-d tree? Spatial trees partition one axis at a time and prune subtrees whose bounding boxes cannot beat the best distance found so far. That works beautifully in 2D or 3D, but breaks down quickly as dimension grows: SciPy notes that by roughly 20 dimensions, a k-d tree often inspects nearly as many points as brute force.[^scipyKDTree2026] In high-dimensional spaces, **distance concentration** makes pairwise distances cluster closely around their mean whenever many coordinates carry independent variance, so axis-aligned bounding boxes overlap almost everywhere. (Intrinsic dimension still matters: padding 1D points with 767 zeros leaves their distances untouched.)

<!-- leetllm: test, output=show -->
```python title="estimate-flat-storage-and-work.py"
import math

n_vectors = 100_000_000
dimensions = 1_536

raw_gib = n_vectors * dimensions * 4 / (1024 ** 3)
scalar_ops = n_vectors * dimensions
print(f"raw float32 storage: {raw_gib:.1f} GiB")
print(f"scalar components scored per flat query: {scalar_ops:,}")

# Zero-padding adds coordinates without changing intrinsic 1D geometry.
origin = [0.0] * 768
padded = [[value] + [0.0] * 767 for value in (1.0, 10.0)]
print(f"zero-padded 768D distances: {[math.dist(origin, p) for p in padded]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw float32 storage: 572.2 GiB
scalar components scored per flat query: 153,600,000,000
zero-padded 768D distances: [1.0, 10.0]
```
<!-- leetllm: output:end -->

**<span data-glossary="ann-search">Approximate nearest-neighbor (ANN) search</span>** trades a tiny fraction of exact matches for orders-of-magnitude less work. We measure that trade-off with **<span data-glossary="recall-at-k">Recall@k</span>**: the fraction of the exact top-$k$ neighbors recovered by the approximate index (computed with the same metric, snapshot, and filter). Keep ANN recall separate from end-to-end relevance recall: an index can score 100% ANN recall while faithfully reproducing a mediocre embedding model.

<!-- leetllm: test, output=show -->
```python title="measure-recall-at-k.py"
def recall_at_k(exact_ids: list[int], approx_ids: list[int]) -> float:
    return len(set(exact_ids) & set(approx_ids)) / len(exact_ids)

exact_top_5 = [10, 21, 34, 55, 89]
fast_setting = [10, 21, 8, 13, 5]
tuned_setting = [10, 21, 34, 55, 3]

print(f"fast setting recall@5:  {recall_at_k(exact_top_5, fast_setting):.0%}")
print(f"tuned setting recall@5: {recall_at_k(exact_top_5, tuned_setting):.0%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fast setting recall@5:  40%
tuned setting recall@5: 80%
```
<!-- leetllm: output:end -->

> **Key insight:** Never evaluate latency without Recall@k. Sweeping search parameters traces a **Recall@k vs. QPS Pareto frontier**; pick the fastest operating point on that frontier that clears your recall target. Exact flat search stays useful both as your ground-truth benchmark and as the fastest path when a selective metadata filter shrinks the eligible set to a few thousand rows.[^pgvector_docs]

<figure>
  <img src="illustrations/_generated/vector_db_internals_dark.png" alt="Two constructed index mechanisms narrow a query’s scoring work. In HNSW, a search follows graph links from an entry through closer neighbors and expands a base-layer neighborhood. In IVF, query q at x=4.9 lies in List 0, whose members are v0, v1, and v2; List 1 contains v3 and v4. Both methods send only their candidate pool to the same metric-scoring and top-k step." />
  <figcaption>HNSW walks proximity-graph links while IVF opens selected Voronoi lists. Both shrink the candidate pool handed to exact distance scoring.</figcaption>
</figure>

```checkpoint
Why is unfiltered exact vector search expensive at 100 million 1,536-dimensional vectors?
---
Storing raw float32 vectors alone requires ~572 GiB, and every unfiltered query must score all 153.6 billion scalar components. ANN indexes inspect a tiny candidate subset while exact search remains the recall baseline.
```

## HNSW (Hierarchical Navigable Small World)

When your working set fits in RAM and you want low latency without an offline clustering phase, **HNSW** is usually the first index to try.[^malkov2018]

### Skip-lists generalized to high-dimensional graphs

Picture a 1D skip-list: an ordered linked list topped by sparser express lanes that jump across large spans in a single hop, dropping down to denser lanes only near the target. HNSW applies that hierarchy to a proximity graph in $\mathbb{R}^d$.[^malkov2018]

When a new vector $v$ is inserted, its maximum layer $\ell$ is sampled from an exponential decay distribution:

$$
P(\text{level} \ge \ell) = \exp(-\ell / m_L)
$$

Setting $m_L = 1 / \ln(M)$ (for $M > 1$) turns this into a clean geometric ladder:

$$
P(\text{level} \ge \ell) = \exp(-\ell \ln M) = \left(\frac{1}{M}\right)^\ell
$$

Every vector lives on Layer 0. Roughly $N/M$ vectors appear on Layer 1, $N/M^2$ on Layer 2, and the tallest layer sits near $\log_M N$. Upper layers are sparse highways linking distant regions; Layer 0 is a dense local road network.

Search runs in two phases:

1. **Greedy descent on upper layers.** Starting from the global entry point on the top layer, repeatedly hop to any neighbor closer to query $q$. When no neighbor improves the distance, you have hit a local minimum on that layer. Drop straight down to the *same vector* on the next layer below and repeat.
2. **Beam search on Layer 0.** A greedy walk on the dense base layer gets trapped in local minima, so Layer 0 switches to a wider beam search parameterized by `ef_search`. It maintains two heaps:
   - `candidates`: a min-heap of unexpanded nodes ordered by ascending distance to $q$.
   - `results`: a max-heap holding at most `ef_search` closest vectors found so far.

At each step, pop the closest node $c$ from `candidates`. If $c$ is already farther from $q$ than the worst vector in `results` (once `results` is full), stop and return the best $k$ items from `results`. Otherwise inspect $c$'s unvisited neighbors and push any that improve `results` onto both heaps.

<figure>
  <img src="illustrations/_generated/hnsw_layers_dark.png" alt="Constructed HNSW search descends through three layers while preserving the same vector ID: entry v7 routes to v4 on Layer 2, v4 descends into Layer 1 and routes to v6, and v6 descends into Layer 0 where v8 and v3 are inspected as neighbors. The solid links show greedy hops and dashed links show same-ID descents. A separate min-heap expands the closest unexpanded candidate first; a max-heap retains at most ef_search results. The expansion queue or visited set can exceed that result limit." />
  <figcaption>Search greedily descends from the entry point across sparse upper layers (dashed arrows keep the same node ID), then runs a two-heap beam search of width <code>ef_search</code> on Layer 0.</figcaption>
</figure>

### Why HNSW prefers diverse neighbors over nearest neighbors

Three build knobs control graph connectivity: `M` (links per node on upper layers), `M0` (Layer-0 link cap, usually $2M$), and `ef_construction` (beam width during insertion).

A subtle design detail makes HNSW navigate across clusters: when wiring a new node $v$, connecting it blindly to its $M$ closest neighbors creates dense local cliques with no bridges pointing toward other clusters. Instead, HNSW's **diversity heuristic** (`SELECT-NEIGHBORS-HEURISTIC`) inspects candidates in ascending distance to $v$ and accepts candidate $e$ only if it is closer to $v$ than to every already-selected neighbor $n$:

$$
d(e, v) < d(e, n) \quad \forall n \in \text{selected}
$$

If $e$ lies right behind an already-selected neighbor in the same direction, it is skipped in favor of a neighbor pointing in a new direction.[^malkov2018]

### Tracing an insertion and building a working HNSW

Inserting a new vector mirrors search: sample its top layer $\ell$, greedily descend all layers *above* $\ell$ to land in the right region, then run a beam search of width `ef_construction` on layers $\ell$ down to $0$, adding reciprocal links and pruning any adjacency list that exceeds its cap (`2M` on Layer 0, `M` above). Only if $\ell$ exceeds the graph's current maximum layer does the new node become the global entry point.

Here is a compact, self-contained HNSW implementation (using nearest-$M$ pruning for brevity) that builds a 2-layer graph, searches it, and demonstrates why widening `ef_search` rescues a query when the only path to the true nearest neighbor crosses a farther bridge node:

<!-- leetllm: test, output=show -->
```python title="hnsw-insert-and-search.py"
import heapq
import math
import random
from dataclasses import dataclass, field


def sq_l2(a: tuple[float, ...], b: tuple[float, ...]) -> float:
    return sum((x - y) ** 2 for x, y in zip(a, b))


def sample_level(mL: float, rng: random.Random) -> int:
    return math.floor(-math.log(max(rng.random(), 1e-12)) * mL)


@dataclass
class MiniHNSW:
    M: int = 2
    ef_construction: int = 4
    vectors: dict[int, tuple[float, ...]] = field(default_factory=dict)
    edges: dict[tuple[int, int], list[int]] = field(default_factory=dict)
    entry_point: int | None = None
    max_level: int = -1

    def neighbors(self, node_id: int, level: int) -> list[int]:
        return list(self.edges.get((node_id, level), []))


def greedy_search(graph: MiniHNSW, query: tuple[float, ...], entry: int, level: int) -> int:
    current = entry
    while True:
        best = min(
            [current, *graph.neighbors(current, level)],
            key=lambda n: sq_l2(query, graph.vectors[n]),
        )
        if best == current:
            return current
        current = best


def search_layer(
    graph: MiniHNSW, query: tuple[float, ...], entry: int, level: int, ef: int
) -> list[int]:
    visited = {entry}
    d0 = sq_l2(query, graph.vectors[entry])
    candidates = [(d0, entry)]     # min-heap: closest unexplored first
    results = [(-d0, entry)]       # max-heap: farthest retained at index 0
    while candidates:
        dist, current = heapq.heappop(candidates)
        if len(results) >= ef and dist > -results[0][0]:
            break
        for nb in graph.neighbors(current, level):
            if nb in visited:
                continue
            visited.add(nb)
            d = sq_l2(query, graph.vectors[nb])
            if len(results) < ef or d < -results[0][0]:
                heapq.heappush(candidates, (d, nb))
                heapq.heappush(results, (-d, nb))
                if len(results) > ef:
                    heapq.heappop(results)
    return [node for _, node in sorted((-neg, node) for neg, node in results)]


def prune(graph: MiniHNSW, node_id: int, level: int, cap: int) -> None:
    linked = graph.edges[(node_id, level)]
    if len(linked) > cap:
        graph.edges[(node_id, level)] = sorted(
            linked, key=lambda other: sq_l2(graph.vectors[node_id], graph.vectors[other])
        )[:cap]


def insert(graph: MiniHNSW, node_id: int, vector: tuple[float, ...], level: int) -> None:
    graph.vectors[node_id] = vector
    for layer in range(level + 1):
        graph.edges.setdefault((node_id, layer), [])
    if graph.entry_point is None:
        graph.entry_point, graph.max_level = node_id, level
        return

    entry = graph.entry_point
    for layer in range(graph.max_level, level, -1):
        entry = greedy_search(graph, vector, entry, layer)
    for layer in range(min(level, graph.max_level), -1, -1):
        candidates = search_layer(graph, vector, entry, layer, graph.ef_construction)
        chosen = sorted(candidates, key=lambda i: sq_l2(vector, graph.vectors[i]))[: graph.M]
        cap = 2 * graph.M if layer == 0 else graph.M
        for nb in chosen:
            if nb != node_id:
                if nb not in graph.edges[(node_id, layer)]:
                    graph.edges[(node_id, layer)].append(nb)
                graph.edges.setdefault((nb, layer), [])
                if node_id not in graph.edges[(nb, layer)]:
                    graph.edges[(nb, layer)].append(node_id)
                prune(graph, nb, layer, cap)
        prune(graph, node_id, layer, cap)
        entry = min(candidates, key=lambda i: sq_l2(vector, graph.vectors[i]))
    if level > graph.max_level:
        graph.entry_point, graph.max_level = node_id, level


def search(graph: MiniHNSW, query: tuple[float, ...], k: int = 2, ef_search: int = 4) -> list[int]:
    if ef_search < k:
        raise ValueError("ef_search must be at least k")
    current = graph.entry_point
    assert current is not None
    for layer in range(graph.max_level, 0, -1):
        current = greedy_search(graph, query, current, layer)
    return search_layer(graph, query, current, 0, ef_search)[:k]


rng = random.Random(0)
mL = 1 / math.log(16)
draws, level = 0, 0
while level == 0:
    level = sample_level(mL, rng)
    draws += 1
print(f"mL for M=16: {mL:.3f}, P(level >= 1) = {1/16:.1%}, first upper draw after {draws} samples")

graph = MiniHNSW()
for node_id, vec, lvl in [
    (0, (0.0, 0.0), 1), (1, (0.2, 0.1), 0), (2, (0.3, 0.0), 1),
    (3, (5.0, 5.0), 0), (4, (5.1, 4.8), 0), (5, (0.1, 0.3), 0),
]:
    insert(graph, node_id, vec, lvl)

q = (0.25, 0.05)
print("HNSW top-2: ", search(graph, q, k=2, ef_search=4))
print("Exact top-2:", sorted(graph.vectors, key=lambda i: sq_l2(q, graph.vectors[i]))[:2])

# Bridge test: node 1 is farther than entry 0, yet it is the only path to node 2.
bridge = MiniHNSW(
    vectors={0: (0.9, 0.0), 1: (2.0, 0.0), 2: (0.1, 0.0)},
    edges={(0, 0): [1], (1, 0): [2], (2, 0): []},
    entry_point=0,
    max_level=0,
)
print("bridge ef=1:", search(bridge, (0.0, 0.0), k=1, ef_search=1))
print("bridge ef=3:", search(bridge, (0.0, 0.0), k=1, ef_search=3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mL for M=16: 0.361, P(level >= 1) = 6.2%, first upper draw after 36 samples
HNSW top-2:  [1, 2]
Exact top-2: [1, 2]
bridge ef=1: [0]
bridge ef=3: [2]
```
<!-- leetllm: output:end -->

Look closely at the bridge output: with `ef_search = 1`, node 1 is farther from the query than entry node 0, so the beam stops immediately and never sees node 2. Raising `ef_search` to 3 keeps node 1 in the beam long enough to cross the bridge and discover node 2. Also note that `ef_search` must be at least `k` (libraries like `hnswlib` reject `ef < k`).[^hnswlibParameters2026][^pgvector_docs]

### Key HNSW knobs and memory budget

| Parameter | Role | Starting value | Trade-off |
|-----------|------|----------------|-----------|
| `M` | Neighbors wired per new node (upper-layer cap) | `16` | Higher `M` strengthens recall and raises RAM + build time. |
| `M0` | Layer-0 adjacency cap | `2 * M` | Denser base layer improves local routing at extra link memory. |
| `ef_construction` | Build-time beam width | `200` | Higher values build cleaner graphs at slower indexing speed. |
| `ef_search` | Query-time beam width | `64` (for `k=10`) | Tunable per query without rebuilding; higher raises recall and latency. |
| `mL` | Layer-sampling scale | $1 / \ln(M)$ | Higher values populate upper layers more densely. |

People often assume HNSW's graph edges are what blow up RAM. For high-dimensional float32 embeddings, the raw vectors themselves dominate: at $d = 1{,}536$ and $M = 16$, a vector takes $1{,}536 \times 4 = 6{,}144$ bytes, while $2M = 32$ 4-byte Layer-0 neighbor IDs take only 128 bytes (98.0% vector, 2.0% Layer-0 links, before upper layers and allocator headers). Graph links only become a large fraction after vector compression or at low dimensions.

Because `ef_search` can be changed at query time, pick it by sweeping recall against p95 latency on representative queries and selecting the fastest setting that clears your recall floor:

<!-- leetllm: test, output=show -->
```python title="select-hnsw-operating-point.py"
vec_bytes = 1536 * 4
layer0_link_bytes = (2 * 16) * 4
print(f"float32 vector: {vec_bytes:,} B | layer-0 links (M=16): {layer0_link_bytes} B | vector share: {vec_bytes / (vec_bytes + layer0_link_bytes):.1%}")

sweep = [
    {"ef_search": 24, "recall": 0.91, "p95_ms": 4.1},
    {"ef_search": 48, "recall": 0.97, "p95_ms": 6.8},
    {"ef_search": 96, "recall": 0.985, "p95_ms": 12.4},
]
eligible = [p for p in sweep if p["recall"] >= 0.96 and p["p95_ms"] <= 10.0]
best = min(eligible, key=lambda p: p["p95_ms"])
print(f"selected ef_search={best['ef_search']} (recall={best['recall']:.3f}, p95={best['p95_ms']} ms)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
float32 vector: 6,144 B | layer-0 links (M=16): 128 B | vector share: 98.0%
selected ef_search=48 (recall=0.970, p95=6.8 ms)
```
<!-- leetllm: output:end -->

Graph traversal shines in RAM, yet it still requires storing full adjacency lists and struggles when you want a crisp, predictable scan fraction or tight compression. What if we partition the space into regions instead?

## IVF (Inverted File Index)

**IVF (Inverted File Index)** replaces graph links with coarse geometric partitioning. Before serving begins, offline <span data-glossary="k-means">k-means clustering</span> learns $K = \text{nlist}$ cluster centroids $c_1, \dots, c_K$ (the **coarse quantizer**). Under Euclidean distance, those centroids partition $\mathbb{R}^d$ into $K$ **Voronoi cells**:

$$
V_i = \{x \in \mathbb{R}^d \mid \|x - c_i\|^2 \le \|x - c_j\|^2 \;\; \forall j \ne i\}
$$

During indexing, every vector $x$ is assigned to its closest centroid $i(x) = \arg\min_j \|x - c_j\|^2$ and appended to that centroid's **inverted list**. At query time, search compares $q$ against the `nlist` centroids, picks the closest `nprobe` cells, and scans only those `nprobe` lists.[^johnson2017][^faiss2026indexes]

### Counting the work saved

With 1 million vectors, `nlist = 1,024`, and `nprobe = 5`:
- Brute force computes $1{,}000{,}000$ distances.
- IVF scores $1{,}024$ centroids plus $5 \times (1{,}000{,}000 / 1{,}024) \approx 4{,}883$ vectors (assuming balanced lists), totaling roughly $5{,}907$ distance computations, about **169x fewer comparisons**.

### Why `nprobe = 1` misses neighbors across cell edges

If a query lands near the dividing plane between two Voronoi cells, its true nearest neighbor can easily sit just across that edge in the neighboring cell. Opening only `nprobe = 1` list misses it completely; raising `nprobe` opens adjacent cells and recovers it.

<figure>
  <img src="illustrations/_generated/ivf_probe_flow_dark.png" alt="Equal-unit 2D plots show centroids C0=(0,0) and C1=(10,0), their Voronoi boundary x=5, query q=(4.9,0), and vectors v0=(0.2,0.1), v1=(0.4,-0.1), v2=(4.6,0), v3=(5.4,0), and v4=(9.8,0.2). Distances from q are 0.30 to v2, 0.50 to v3, and 4.50 to v1. Probing List 0 alone returns v2 and v1 for 1/2 exact top-two neighbors; probing both lists returns v2 and v3 for 2/2." />
  <figcaption>Query <code>q = (4.9, 0)</code> falls on the List 0 side of the Voronoi dividing line <code>x = 5</code>. Probing List 0 alone misses <code>v3 = (5.4, 0)</code> (distance 0.50); probing both lists recovers the exact top-2.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="ivf-nprobe-edge-miss.py"
def sq_l2(a: tuple[float, ...], b: tuple[float, ...]) -> float:
    return sum((x - y) ** 2 for x, y in zip(a, b))


centroids = {0: (0.0, 0.0), 1: (10.0, 0.0)}
vectors = {0: (0.2, 0.1), 1: (0.4, -0.1), 2: (4.6, 0.0), 3: (5.4, 0.0), 4: (9.8, 0.2)}

lists: dict[int, list[int]] = {0: [], 1: []}
for vid, vec in vectors.items():
    cid = min(centroids, key=lambda c: sq_l2(vec, centroids[c]))
    lists[cid].append(vid)


def ivf_search(query: tuple[float, ...], nprobe: int, k: int = 2) -> list[int]:
    probed = sorted(centroids, key=lambda c: sq_l2(query, centroids[c]))[:nprobe]
    scored = [(sq_l2(query, vectors[vid]), vid) for cid in probed for vid in lists[cid]]
    return [vid for _, vid in sorted(scored)[:k]]


query = (4.9, 0.0)
print("inverted lists:", lists)
print("exact top-2:   ", sorted(vectors, key=lambda vid: sq_l2(query, vectors[vid]))[:2])
print("nprobe=1:      ", ivf_search(query, nprobe=1))
print("nprobe=2:      ", ivf_search(query, nprobe=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
inverted lists: {0: [0, 1, 2], 1: [3, 4]}
exact top-2:    [2, 3]
nprobe=1:       [2, 1]
nprobe=2:       [2, 3]
```
<!-- leetllm: output:end -->

With balanced lists, IVF scans roughly `nprobe / nlist` of the corpus. In **IVF-Flat** (full-precision vectors inside each list), raising `nprobe` never lowers recall and scanning all `nlist` lists becomes exact search. In **IVF-PQ** (compressed codes), scanning every list still cannot eliminate quantization error.

```checkpoint
Why does raising `nprobe` improve IVF recall while increasing query work?
---
Probing more coarse cells lets search inspect true neighbors that fell across a Voronoi cell edge, at the cost of scanning one more inverted list per added probe.
```

### Distance metrics and centroid geometry

Every index ranks vectors under one metric: **L2** (Euclidean straight-line distance, usually squared to skip the square root), **Inner Product (IP)** ($\langle x, y \rangle$, where vector magnitude boosts score), or **<span data-glossary="cosine-similarity">Cosine similarity</span>** (angle only, implemented by L2-normalizing both stored vectors and queries and running inner product).[^faissMetrics2026] On unit vectors, L2 and inner product induce identical rankings because:

$$
\|x - y\|^2 = \|x\|^2 + \|y\|^2 - 2\langle x, y \rangle = 2 - 2\langle x, y \rangle
$$

> **Common mistake:** Switching an IVF index from raw L2 to cosine by normalizing only the queries. If the coarse centroids were trained on unnormalized vectors, unit queries get routed into the wrong Voronoi cells. Normalize the training set, stored vectors, and queries, then retrain the coarse quantizer.

<!-- leetllm: test, output=show -->
```python title="verify-cosine-inner-product-ranking.py"
import numpy as np

vectors = np.array([[3.0, 0.0], [1.0, 1.0], [0.0, 2.0]])
query = np.array([1.0, 0.8])

unit_v = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
unit_q = query / np.linalg.norm(query)

ip_scores = unit_v @ unit_q
l2_dists = np.sum((unit_v - unit_q) ** 2, axis=1)

print("IP rank on unit vectors:", np.argsort(-ip_scores).tolist())
print("L2 rank on unit vectors:", np.argsort(l2_dists).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
IP rank on unit vectors: [1, 0, 2]
L2 rank on unit vectors: [1, 0, 2]
```
<!-- leetllm: output:end -->

### HNSW vs. IVF-Flat at a glance

| Feature | HNSW | IVF-Flat |
|---------|------|----------|
| **Structure** | Multi-layer proximity graph | Coarse centroids + inverted lists |
| **Offline training** | None | Required (`k`-means centroids) |
| **Memory** | Raw vectors + ~$2M$ Layer-0 IDs | Raw vectors + IDs (no graph edges) |
| **Updates & drift** | Incremental inserts; deletes vary by engine | Easy inserts; distribution drift degrades stale centroids |
| **Main query knob** | `ef_search` | `nprobe` |
| **Best fit** | Low-latency, high-recall in-RAM search | Predictable scan fraction or base for PQ compression |

Notice that graph search and vector compression are orthogonal: Faiss supports `IndexHNSWFlat`, `IndexHNSWSQ`, and `IndexHNSWPQ` as well as `IndexIVFPQ`.[^faiss2026indexes]

Still, both HNSW and IVF-Flat hold raw float32 vectors in memory. What happens when your corpus reaches one billion 768-dimensional vectors?

$$
10^9 \text{ vectors} \times 768 \text{ dims} \times 4 \text{ bytes} \approx 3.07 \text{ TB}
$$

To fit a billion vectors on ordinary RAM budgets, we need to shrink the vectors themselves.

## Product Quantization (PQ)

**Product Quantization (PQ)** compresses high-dimensional vectors by splitting them into disjoint subvectors and quantizing each subspace separately.[^jegou2011]

### Splitting into subspaces and 1-byte codebooks

Slice a $d$-dimensional vector $x$ into $m$ equal subvectors of dimension $d^* = d / m$:

$$
x = [u_1, u_2, \dots, u_m], \quad u_j \in \mathbb{R}^{d^*}
$$

For $d = 768$ and $m = 96$, each subvector has $d^* = 8$ dimensions. Run $k$-means independently on each subspace to learn a codebook $C_j$ of $K^* = 256$ sub-centroids. Why 256? Because $256 = 2^8$, so each centroid ID fits in a single unsigned byte (`uint8`). Encoding $x$ replaces every subvector $u_j$ with its nearest centroid index:

$$
\text{code}_j(x) = \arg\min_{k \in \{0, \dots, 255\}} \|u_j - c_{j,k}\|^2
$$

A 3,072-byte float32 vector shrinks to **96 bytes**: **32x code compression**. The 96 shared codebooks take only $96 \times 256 \times 8 \times 4 = 768\text{ KiB}$ across the entire index, yet their Cartesian product can represent $256^{96} = 2^{768}$ distinct reconstructed points. In L2 IVF-PQ, PQ normally encodes the **residual** $r = x - c_{\text{list}}$ relative to the coarse Voronoi centroid, which clusters closer to zero and quantizes more accurately.[^faiss2026ImplementationNotes]

<figure>
  <img src="illustrations/_generated/pq_encoding_pipeline_dark.png" alt="Product quantization splits a 768-dimensional float32 vector into 96 eight-dimensional subvectors. Each subvector maps to one of 256 centroids in its own codebook and contributes one byte. The code-row example maps the first subvector to centroid ID 42 and writes one uint8 code byte per subspace. The 96-byte code is 32 times smaller than the 3,072-byte raw vector, for code storage alone. At query time, an uncompressed query builds a 96 by 256 float32 distance table. Each byte selects one entry per subspace, and 96 selected distances are summed without reconstructing the full vector." />
  <figcaption>Each 8D subvector maps to one byte (a 32x code reduction from 3,072 B to 96 B). At query time, ADC precomputes a 96 x 256 lookup table so scoring a compressed vector requires only 96 table lookups and additions.</figcaption>
</figure>

**Optimized Product Quantization (OPQ)** addresses a weakness of fixed contiguous slices: if embedding <span data-glossary="variance">variance</span> is concentrated in certain coordinates, some subspaces waste centroids on near-constant dimensions. OPQ learns an orthogonal rotation <span data-glossary="matrix">matrix</span> $R$ jointly with the codebooks to spread variance more evenly while preserving L2 distances (e.g., Faiss's `OPQ96,IVF4096,PQ96`; note that dimension-reducing variants like `OPQ96_384` project away dimensions and do not preserve full L2 distances).[^ge2013][^faissIndexFactory2026]

### Asymmetric Distance Computation (ADC)

The real magic of PQ happens at query time. We never decompress stored vectors back into 768 floats. Instead, **<span data-glossary="asymmetric-distance-computation">Asymmetric Distance Computation (ADC)</span>** leaves the query $q$ uncompressed and scores compressed codes via a lookup table:

1. Slice $q$ into $m$ subvectors $[q_1, \dots, q_m]$.
2. Precompute a float32 lookup table $T$ of shape $m \times 256$:

$$
T[j][k] = \|q_j - c_{j,k}\|^2 \quad \text{for } j \in \{1, \dots, m\},\; k \in \{0, \dots, 255\}
$$

For $m = 96$, that table is $96 \times 256 \times 4 = 96\text{ KiB}$, small enough to sit comfortably in CPU cache.
3. Score any compressed vector $y$ with code $[c_1, \dots, c_m]$ by summing $m$ table entries:

$$
d(q, y)^2 \approx d(q, C(y))^2 = \sum_{j=1}^{m} T[j][c_j]
$$

Scoring drops from 768 floating-point subtractions and multiplications per candidate to 96 indexed additions (in residual IVF-PQ, the query residual $q - c_{\text{list}}$ or precomputed cross-terms are used).[^faiss2026ImplementationNotes]

The runnable example below implements ADC and shows **code collision**: two distinct original vectors that quantize to the same PQ code become indistinguishable until you overfetch candidates and rerank against full-precision vectors.

<!-- leetllm: test, output=show -->
```python title="asymmetric-distance-computation-adc.py"
import numpy as np


def adc_search(query: np.ndarray, codes: np.ndarray, codebooks: np.ndarray, k: int = 2) -> list[int]:
    m, _, d_sub = codebooks.shape
    q_subs = query.reshape(m, d_sub)
    # Build (m, K*) squared-L2 lookup table once per query.
    tables = np.sum((codebooks - q_subs[:, None, :]) ** 2, axis=2)
    # Score every compressed code by summing m indexed table lookups.
    dists = np.sum(tables[np.arange(m), codes], axis=1)
    return sorted(range(len(codes)), key=lambda i: (float(dists[i]), i))[:k]


raw_bytes, code_bytes = 768 * 4, 96
print(f"768D float32: {raw_bytes} B -> PQ96: {code_bytes} B ({raw_bytes // code_bytes}x), +8B ID = {code_bytes + 8} B")

codebooks = np.array([
    [[0.0, 0.0], [2.0, 0.0], [0.0, 2.0], [2.0, 2.0]],
    [[0.0, 0.0], [2.0, 0.0], [0.0, 2.0], [2.0, 2.0]],
])
codes = np.array([[0, 0], [1, 0], [0, 1], [1, 1]])
print("ADC top-2 for origin:", adc_search(np.array([0.0, 0.0, 0.0, 0.0]), codes, codebooks, k=2))

# Code collision: two originals quantize to [0, 0]; overfetching + exact reranking fixes top-1.
q = np.array([0.9, 0.0, 0.0, 0.0])
originals = np.array([[0.1, 0.0, 0.0, 0.0], [0.9, 0.0, 0.0, 0.0]])
same_codes = np.array([[0, 0], [0, 0]])

compressed_top1 = adc_search(q, same_codes, codebooks, k=1)
overfetched = adc_search(q, same_codes, codebooks, k=2)
reranked_top1 = sorted(overfetched, key=lambda i: float(np.sum((q - originals[i]) ** 2)))[:1]
print(f"collision top-1 without overfetch: {compressed_top1} | after overfetch+rerank: {reranked_top1}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
768D float32: 3072 B -> PQ96: 96 B (32x), +8B ID = 104 B
ADC top-2 for origin: [0, 1]
collision top-1 without overfetch: [0] | after overfetch+rerank: [1]
```
<!-- leetllm: output:end -->

```checkpoint
What work does Asymmetric Distance Computation (ADC) move out of the per-vector scoring loop?
---
ADC precomputes a small lookup table of distances between the uncompressed query subvectors and every subspace centroid once per query, reducing each candidate's score to m table lookups and additions instead of full-vector decompression and coordinate math.
```

## Filtered search

Real retrieval rarely searches the entire index. Users filter by tenant, date range, region, or document type (`region = 'EU' AND created_at >= now() - interval '30 days'`). An index delivering 99% unfiltered recall can quietly collapse under selective metadata filters. Three execution strategies govern what happens:

1. **Pre-filter then exact scan:** Resolve the metadata predicate first (for example via a B-tree or bitmap index), then run exact distance scoring on the matching subset. When only 500 rows match, flat scan is both exact and fast. When 10 million rows match, exact scan is too slow; on the flip side, deleting disallowed nodes from an HNSW graph before traversal can disconnect the graph and trap search in isolated islands.
2. **Post-filtering:** Fetch an ANN candidate buffer of size $L$, then discard rows failing the predicate. This causes **buffer starvation**. If a filter matches a fraction $s = 0.005$ of records and $L = 100$ candidates are drawn with independent selectivity, the expected match count is:

$$
E[M] = L \cdot s = 100 \times 0.005 = 0.5
$$

and the probability of returning *zero* results is:

$$
P(M = 0) = (1 - s)^L = (0.995)^{100} \approx 60.6\%
$$

If neighboring vectors share metadata (say all 100 nearby chunks belong to `region = 'US'`), the expected count is still $0.5$, yet the empty-result probability jumps to $1 - s = 99.5\%$.

<!-- leetllm: test, output=show -->
```python title="post-filter-starvation.py"
L, s = 100, 0.005
print(f"expected matches:              {L * s:.2f}")
print(f"independent empty probability: {(1 - s) ** L:.1%}")
print(f"correlated empty probability:  {1 - s:.1%}")

candidates = ["eu-1", "us-1", "us-2", "us-3", "eu-2"]
region = {"eu-1": "eu", "us-1": "us", "us-2": "us", "us-3": "us", "eu-2": "eu"}

def post_filter(pool: list[str], target: str, k: int) -> list[str]:
    return [doc for doc in pool if region[doc] == target][:k]

print("buffer L=3:", post_filter(candidates[:3], "eu", k=2))
print("buffer L=5:", post_filter(candidates, "eu", k=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
expected matches:              0.50
independent empty probability: 60.6%
correlated empty probability:  99.5%
buffer L=3: ['eu-1']
buffer L=5: ['eu-1', 'eu-2']
```
<!-- leetllm: output:end -->

3. **Filter-aware traversal and iterative scans:** Modern engines bridge the gap inside the index. <span data-glossary="pgvector">pgvector</span> offers iterative ANN scans (`hnsw.max_scan_tuples`, `ivfflat.max_probes`) that expand the candidate pool automatically until $k$ matches are found or a scan limit hits.[^pgvector_docs] <span data-glossary="weaviate">Weaviate</span> supports sweeping across disallowed nodes without returning them as well as an **ACORN**-based traversal that skips distance computation on non-matching nodes and uses multi-hop jumps from eligible entry points.[^patel2024acorn][^weaviate_filter_docs]

<figure>
  <img src="illustrations/_generated/filtered_search_boundary_dark.png" alt="Inside a trusted retrieval service, the first three candidates are eu-1, us-1, and us-2. Applying region=EU before returning k=2 leaves only eu-1, so the response is underfilled at 1/2. Scanning all five candidates adds us-3 and eu-2; the same filter then returns eu-1 and eu-2 for 2/2. Only filtered eligible rows reach the application." />
  <figcaption>A narrow candidate window (<code>L = 3</code>) underfills <code>k = 2</code> with only <code>eu-1</code>; expanding the scan inside the database recovers <code>eu-2</code> without exposing unauthorized rows to application code.</figcaption>
</figure>

> **Key insight:** Keep access-control filters *inside* the database or trusted retrieval service, never in application code after fetching raw passages. An index may traverse a disallowed graph node internally without returning it; fetching unauthorized text into application memory exposes it to logs, caches, and traces. See [RAG Security & Access Control](/learn/design-production-rag-pipeline).

```checkpoint
Why can a selective metadata filter make post-filtering return fewer than k results?
---
Post-filtering discards non-matches from a fixed candidate buffer L. When selectivity s is low or neighboring vectors share excluded metadata, fewer than k eligible rows survive in that window.
```

## Scaling to billions and choosing an index

When a corpus outgrows a single machine's RAM, three architectural paths open up:

1. **IVF-PQ in RAM:** Combining coarse partitioning with PQ compression drops storage dramatically. In Faiss, `IndexIVFPQ` uses `ceil(m_pq * nbits / 8) + 8` bytes per vector (code plus 64-bit ID).[^faiss2026indexes] A 32-byte code holds 1 billion vectors in ~40 GB (plus shared codebooks); a 96-byte code takes ~104 GB.
2. **SSD-backed graphs (DiskANN):** **DiskANN** keeps a compact compressed index in RAM and stores the full-precision vectors and navigation graph on fast NVMe SSD, laying out adjacency lists to minimize random disk reads.[^subramanya2019] On SIFT1B with a single 16-core, 64 GB RAM + SSD machine, Subramanya et al. report over 5,000 QPS at under 3 ms mean latency and 95%+ 1-recall@1.[^subramanya2019]
3. **Horizontal sharding (scatter-gather):** Split the corpus across $S$ disjoint shards, broadcast the query to all $S$ shards, and run an **$S$-way merge** over comparable scores (overfetching $L > K$ per shard if you rerank with full-precision vectors afterward).

<figure>
  <img src="illustrations/_generated/scatter_gather_topk_dark.png" alt="Constructed four-shard timeline on one shared 0–95 ms axis. Shard 1 returns five candidates at 44 ms, Shard 2 at 58 ms, Shard 3 at 86 ms, and Shard 4 at 51 ms. The slowest response arrives at 86 ms; a separate 3 ms merge ends at 89 ms. Each shard contributes five local candidates, for 20 IDs to rank by comparable scores and reduce to a global top five. Fan-out latency is governed by the slowest shard response plus coordinator merge time." />
  <figcaption>A scatter-gather coordinator waits for the slowest shard (86 ms) before running the final merge (3 ms, finishing at 89 ms).</figcaption>
</figure>

Waiting for every shard amplifies tail latency:

$$
T_{\text{query}} \ge \max(T_1, T_2, \dots, T_S) + T_{\text{merge}}
$$

If each shard independently stays under its single-shard threshold $t_{99}$ with probability $0.99$, then all $S$ shards finish within $t_{99}$ with probability $(0.99)^S$. For 4 shards that is 96.1%; for 20 shards it drops to 81.8%, meaning a 20-shard cluster's p99 hits the single-shard $0.99^{1/20} \approx 99.95\text{th}$ percentile! (Correlated infrastructure stalls change that joint rate, so measure real fan-out latency.) Hedged requests to replicas or per-shard deadlines with explicit partial-result flags help rein in tails.

<!-- leetllm: test, output=show -->
```python title="independent-shard-tail-probabilities.py"
for shards in (4, 20):
    print(f"{shards:2d} independent shards within single-shard t99: {0.99 ** shards:.1%}")
print(f"single-shard quantile driving 20-shard p99:    {100 * 0.99 ** (1 / 20):.4f}%")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
 4 independent shards within single-shard t99: 96.1%
20 independent shards within single-shard t99: 81.8%
single-shard quantile driving 20-shard p99:    99.9498%
```
<!-- leetllm: output:end -->

### Index family comparison

| Index family | Core mechanism | Strength | Main cost | Reach for it when |
|--------------|----------------|----------|-----------|-------------------|
| **HNSW** | Hierarchical proximity graph | Fast, high-recall in-RAM search | Raw-vector RAM, build time, delete handling | Vectors fit in RAM and low latency matters |
| **IVF-Flat** | Coarse Voronoi cells + exact list scan | Simple, controllable scan fraction | Offline centroid training, raw-vector RAM | You want predictable scan work without graph overhead |
| **IVF-PQ** | IVF + subspace byte codes + ADC | ~10x-32x smaller vector footprint | Quantization error, rerank/tuning complexity | RAM capacity is the primary bottleneck |
| **DiskANN** | SSD-resident graph + compact RAM guide | Billion-scale on a single NVMe node | Storage-layout and I/O engineering | Corpus exceeds RAM but single-node SSD fits |

### Four enduring questions when evaluating any vector database

Product logos shift faster than hardware constraints. Ask four questions before picking an engine:
1. Which ANN families does it expose (HNSW, IVF, PQ, DiskANN, or an opaque managed index)?
2. How does it execute filtered search (pre-filter, post-filter, iterative scan, or filter-aware graph traversal)?
3. Where does the index live (RAM, NVMe SSD, or object storage)?
4. What compression and full-precision reranking knobs are available?

## When vector indexes break

| Symptom | Likely root cause | Concrete fix |
|---------|-------------------|--------------|
| IVF recall drops over months | Embedding distribution drifted away from stale centroids | Retrain centroids on recent data and rebuild lists |
| HNSW runs out of RAM | Raw float32 vectors + links + allocator overhead exceed host memory | Measure bytes/vector; evaluate PQ, SQ, or IVF-PQ |
| Fast queries miss obvious matches | Too-small `ef_search` / `nprobe`, PQ error, or metric mismatch | Check exact baseline first; separate candidate recall from reranking |
| Cosine switch tanks IVF recall | Centroids were trained on unnormalized L2 vectors | Normalize all vectors and retrain centroids for IP |
| Deleted docs still appear or recall degrades | Tombstones, dead tuples, or lagging replicas | Test delete visibility and run index compaction or rebuild |
| Adding shards spikes p99 | Full fan-out waits on slowest shard | Measure cluster tail latency, prune shard routing, or hedge requests |

## Hands-on: metric migration and deletion in Faiss

To see metric geometry and deletion behavior in a real engine, run this self-contained Faiss script with `uv run vector-index-replay.py`.[^faiss2026indexes][^faissMetrics2026] Under raw L2, `[1, 1]` is closer to `[1, 0.1]` than `[10, 0]`; once normalized for cosine similarity, `[10, 0]` points almost directly along the query and wins. Removing ID `101` from the `IndexIDMap2`-wrapped index returns Faiss's `-1` sentinel for the missing second slot.

<!-- leetllm: test, output=show, deps="faiss-cpu==1.15.1,numpy==2.4.3" -->
```python title="vector-index-replay.py"
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["faiss-cpu==1.15.1", "numpy==2.4.3"]
# ///
import faiss
import numpy as np

faiss.omp_set_num_threads(1)
vectors = np.array([[10.0, 0.0], [1.0, 1.0]], dtype="float32")
ids = np.array([101, 202], dtype="int64")
query = np.array([[1.0, 0.1]], dtype="float32")

raw_l2 = faiss.IndexIDMap2(faiss.IndexFlatL2(2))
raw_l2.add_with_ids(vectors, ids)
_, raw_ids = raw_l2.search(query, 1)

unit_vectors, unit_query = vectors.copy(), query.copy()
faiss.normalize_L2(unit_vectors)
faiss.normalize_L2(unit_query)
cosine = faiss.IndexIDMap2(faiss.IndexFlatIP(2))
cosine.add_with_ids(unit_vectors, ids)
_, cosine_ids = cosine.search(unit_query, 1)

print("Raw L2 winner:", int(raw_ids[0, 0]))
print("Cosine winner after rebuilding:", int(cosine_ids[0, 0]))

removed = cosine.remove_ids(np.array([101], dtype="int64"))
_, after_delete = cosine.search(unit_query, 2)
print("Removed records:", removed)
print("Results after delete:", after_delete[0].tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Raw L2 winner: 202
Cosine winner after rebuilding: 101
Removed records: 1
Results after delete: [202, -1]
```
<!-- leetllm: output:end -->

Always check for `-1` sentinels when fewer than `k` matches exist, propagate deletes across every replica before cutover, and benchmark `ef_search` or `nprobe` sweeps against your frozen exact top-$k$ baseline under real query load and metadata filters.

```mastery-quiz
[
  {
    "question": "A collection holds 20 million vectors with 1,024 float32 dimensions. Before index overhead, what raw bytes and component comparisons does an unfiltered exact query require?",
    "options": [
      "Raw storage 81.92 GB; exact score 20.48 billion vector components.",
      "Raw storage 20.48 GB; exact score 20 million vector components.",
      "Raw storage 81.92 MB; exact score 1024 vector components.",
      "Raw storage 20.48 GB; exact score 81.92 billion vector components."
    ],
    "answer": "Raw storage 81.92 GB; exact score 20.48 billion vector components.",
    "explanation": "There are 20,000,000 × 1,024 = 20.48 billion components. At four bytes each, raw storage is 81.92 billion bytes, or 81.92 decimal GB."
  },
  {
    "question": "Exact top-4 IDs are [2, 7, 11, 19]. Candidate A returns [2, 7, 30, 31] in 6 ms; candidate B returns [2, 7, 11, 31] in 14 ms. The target requires at least 70% recall and at most 15 ms. Which result qualifies?",
    "options": [
      "Only A.",
      "Both A and B.",
      "Only B.",
      "Neither A nor B."
    ],
    "answer": "Only B.",
    "explanation": "A recovers 2/4 = 50% recall, missing the 70% floor despite being faster. B recovers 3/4 = 75% in 14 ms, meeting both targets."
  },
  {
    "question": "An HNSW graph reaches layer 3. A new node samples layer 1 with M=12 and construction beam 80. Which insertion trace matches standard HNSW construction?",
    "options": [
      "Navigate layers 3 and 2; search and wire layers 1 and 0 with base cap 24; replace the global entry point with the new node.",
      "Navigate layers 3 and 2; search and wire layers 1 and 0 with base cap 24; keep the existing higher global entry point.",
      "Navigate layers 3, 2, and 1; search and wire layer 0 with base cap 24; keep the existing higher global entry point.",
      "Navigate layers 3 and 2; search and wire layer 1 with base cap 12; replace the global entry point with the new node."
    ],
    "answer": "Navigate layers 3 and 2; search and wire layers 1 and 0 with base cap 24; keep the existing higher global entry point.",
    "explanation": "Layers above the sampled maximum are greedy-navigation only. Construction search and wiring happen on the occupied layers (1 and 0, with Layer-0 cap 2M = 24), and the global entry point changes only when a node reaches a strictly higher layer."
  },
  {
    "question": "An HNSW search requests k=12 with ef_search=6. What should the caller do before running the query?",
    "options": [
      "Keep ef_search=6 and k=12, because upper-layer navigation supplies the remaining results.",
      "Set M=12 and keep ef_search=6, because graph degree supplies the remaining results.",
      "Return 6 results and pad the list to 12 with random neighbors.",
      "Raise ef_search to at least 12 (or reject the request) and tune ef_search against recall and latency for k=12."
    ],
    "answer": "Raise ef_search to at least 12 (or reject the request) and tune ef_search against recall and latency for k=12.",
    "explanation": "The result heap holds at most ef_search items, so ef_search must be at least k to return k candidates."
  },
  {
    "question": "A flat-coarse IVF-Flat index stores 2 million vectors in 512 balanced lists. Moving nprobe from 3 to 12 changes which comparison counts?",
    "options": [
      "Coarse scores 3 -> 12; estimated list scans 11,719 -> 46,875.",
      "Coarse scores 512 -> 512; estimated list scans 11,719 -> 46,875.",
      "Coarse scores 512 -> 512; estimated list scans 11,719 -> 11,719.",
      "Coarse scores 512 -> 12; estimated list scans 46,875 -> 11,719."
    ],
    "answer": "Coarse scores 512 -> 512; estimated list scans 11,719 -> 46,875.",
    "explanation": "Each list averages 2,000,000 / 512 = 3,906.25 vectors, so 3 and 12 probes scan ~11,719 and 46,875 vectors. The flat coarse quantizer still compares the query against all 512 centroids."
  },
  {
    "question": "An IVF index trained on raw vectors under L2 is switched to cosine by normalizing only queries. Recall drops. Which migration restores cosine geometry?",
    "options": [
      "Keep raw training and database vectors, normalize queries, and raise nprobe.",
      "Keep raw training vectors, normalize database and query vectors, and switch the final scorer.",
      "Keep raw vectors and switch to HNSW with higher M.",
      "Normalize training, database, and query vectors; retrain IVF centroids and use inner-product scoring."
    ],
    "answer": "Normalize training, database, and query vectors; retrain IVF centroids and use inner-product scoring.",
    "explanation": "Cosine similarity equals inner product on unit vectors. IVF routing depends on the geometry used to train its coarse quantizer, so raw-L2 centroids route normalized queries to the wrong lists until centroids are retrained."
  },
  {
    "question": "A 1,024-dimensional float32 vector uses 128 PQ subspaces with 256 centroids each. Excluding record IDs and shared codebooks, what code size and raw-to-code compression ratio result?",
    "options": [
      "1,024 bytes; 4x compression.",
      "512 bytes; 8x compression.",
      "128 bytes; 32x compression.",
      "16 bytes; 256x compression."
    ],
    "answer": "128 bytes; 32x compression.",
    "explanation": "Each of the 128 subspaces stores one 8-bit centroid ID (128 bytes total), replacing 1,024 × 4 = 4,096 raw bytes for 32x code-only compression."
  },
  {
    "question": "Two ADC lookup rows are [0, 9] and [0, 16]. A stored code is [1, 0]. What is the squared-L2 ADC score?",
    "options": [
      "1 (Hamming distance between code bytes).",
      "25 (sum of both nonzero table values 9 + 16).",
      "3 (square root of the selected sum 9).",
      "9 (sum of row 0 entry 1 = 9 and row 1 entry 0 = 0)."
    ],
    "answer": "9 (sum of row 0 entry 1 = 9 and row 1 entry 0 = 0).",
    "explanation": "Each code byte indexes its own subspace lookup row, giving T[0][1] + T[1][0] = 9 + 0 = 9."
  },
  {
    "question": "An ANN query fetches 100 candidates, then application code filters for `region = EU`. Only 1% of rows match EU and final `k` is 10. What are the two problems with this setup?",
    "options": [
      "Post-filtering alters stored vector distances, and filtering should happen inside the database.",
      "The fixed buffer can underfill k, and access filters must run inside the trusted retrieval layer before unauthorized rows reach application code.",
      "Final k forces the ANN buffer down to 10, and filtering should happen after results reach application code.",
      "Post-filtering deletes bridge nodes in HNSW, and filtering should happen in application code."
    ],
    "answer": "The fixed buffer can underfill k, and access filters must run inside the trusted retrieval layer before unauthorized rows reach application code.",
    "explanation": "At 1% selectivity, 100 candidates average only 1 eligible row (far short of k=10). In addition, access controls must run inside the trusted database or retrieval service so unauthorized rows never enter application memory or logs."
  },
  {
    "question": "Six disjoint shards use exact scoring with a consistent tie order. Each shard returns its local top-4. If every shard responds, what can the coordinator conclude?",
    "options": [
      "The 24 candidates contain the exact global top-4, because any locally omitted record already trails four records on its own shard.",
      "The 24 candidates can miss the exact global top-4 if a shard's fifth item ranks first globally.",
      "Dropping one slow shard still preserves the exact global top-4.",
      "Approximate local search on each shard preserves the exact global top-4 guarantee."
    ],
    "answer": "The 24 candidates contain the exact global top-4, because any locally omitted record already trails four records on its own shard.",
    "explanation": "Any item omitted from a shard's exact top-4 already has four closer predecessors on that shard, so it can never enter the global top-4. Missing shards or approximate local search break that guarantee."
  }
]
```

> **Next:** Continue to [Advanced RAG: HyDE & Self-RAG](/learn/advanced-rag-query-rewriting-self-rag).
