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

Suppose your search engine holds 100 million 1,536-dimensional <span data-glossary="embedding">embeddings</span>, and a query arrives with a 15-millisecond latency budget. Exact scan streams 572 GiB of float32 numbers and scores 153.6 billion scalar components for a single request. Yet skipping 99.9% of the corpus risks missing the exact passage the user needed. How can an index ignore almost every vector in $\mathbb{R}^{1536}$ and still land in the right neighborhood?

Every modern vector database builds on three ideas: **<span data-glossary="hnsw">Hierarchical Navigable Small World (HNSW)</span>** navigates a multi-layer proximity graph, **<span data-glossary="ivf">Inverted File (IVF)</span>** partitions space into coarse Voronoi cells and opens only a few, and **<span data-glossary="product-quantization">Product Quantization (PQ)</span>** compresses vectors into short byte codes so billions fit in RAM.

The [embedding lesson](/learn/embeddings-cosine-dot-product-quantization) fixed the ranking rule (metric and normalization). A vector index approximates that exact ranking faster and in less memory; it cannot rescue weak embeddings, and its accuracy is always judged against exact search on the same vectors.

## The brute-force problem

**Exact search** (flat search) scores query <span data-glossary="vector">vector</span> $q$ against every stored vector in <span data-glossary="big-o-notation">$O(N \cdot d)$</span> work. Raw float32 storage alone requires:

$$
100{,}000{,}000 \text{ vectors} \times 1{,}536 \text{ dims} \times 4 \text{ bytes} \approx 614 \text{ GB} \approx 572.2 \text{ GiB}
$$

Classic k-d trees partition one coordinate axis at a time and prune subtrees via bounding boxes, which works in 2D or 3D but collapses around 20 dimensions.[^scipyKDTree2026] When many coordinates carry independent variance, **distance concentration** clusters pairwise distances tightly around their mean so bounding boxes overlap almost everywhere (whereas zero-padding 1D points into 768D leaves their true intrinsic distances unchanged).

**<span data-glossary="ann-search">Approximate nearest-neighbor (ANN) search</span>** inspects a tiny candidate subset and scores its accuracy against exact top-$k$ with **<span data-glossary="recall-at-k">Recall@k</span>**:

$$
\text{Recall@}k = \frac{\lvert S_{\text{approx}} \cap S_{\text{exact}} \rvert}{k}
$$

If exact top-5 is `[10, 21, 34, 55, 89]`, a fast setting returning `[10, 21, 8, 13, 5]` achieves 40% Recall@5, while a tuned setting returning `[10, 21, 34, 55, 3]` reaches 80%. Keep ANN recall distinct from relevance recall: an index can hit 100% ANN recall while faithfully reproducing a mediocre embedding model.

> **Key insight:** Never report latency without Recall@k. Sweeping search parameters traces a **Recall@k vs. QPS Pareto frontier**; pick the fastest point that clears your recall floor. Exact flat search remains both your recall baseline and the fastest engine when a selective filter shrinks the eligible pool to a few thousand rows.[^pgvector_docs]

<figure>
  <img src="illustrations/_generated/vector_db_internals_dark.png" alt="Two constructed index mechanisms narrow a query’s scoring work. In HNSW, a search follows graph links from an entry through closer neighbors and expands a base-layer neighborhood. In IVF, query q at x=4.9 lies in List 0, whose members are v0, v1, and v2; List 1 contains v3 and v4. Both methods send only their candidate pool to the same metric-scoring and top-k step." />
  <figcaption>HNSW walks proximity-graph links while IVF opens selected Voronoi lists. Both shrink the candidate pool handed to exact distance scoring.</figcaption>
</figure>

## HNSW (Hierarchical Navigable Small World)

When your working set fits in RAM and you want low latency without offline clustering, **HNSW** is usually the first index to try.[^malkov2018]

### Skip-lists generalized to high-dimensional graphs

HNSW generalizes a 1D skip-list to a proximity graph in $\mathbb{R}^d$.[^malkov2018] Each inserted vector $v$ samples its maximum layer $\ell$ from an exponential decay distribution. Setting $m_L = 1 / \ln(M)$ yields a geometric ladder:

$$
P(\text{level} \ge \ell) = \exp(-\ell / m_L) = \left(\frac{1}{M}\right)^\ell
$$

Every vector resides on Layer 0, roughly $N/M$ on Layer 1, $N/M^2$ on Layer 2, up to height $\approx \log_M N$. Upper layers act as sparse express highways; Layer 0 is the dense local road network.

Search runs in two phases:
1. **Greedy descent on upper layers:** From the global entry point on the top layer, hop to any closer neighbor until reaching a local minimum, then drop to the *same vector* on the next layer below.
2. **Beam search on Layer 0:** A greedy walk on Layer 0 traps in local minima, so Layer 0 expands a beam of width `ef_search` using two heaps: a min-heap `candidates` (closest unexpanded node first) and a max-heap `results` (holding at most `ef_search` closest vectors found so far). Pop the closest candidate $c$; if `results` is full and $c$ is farther than the worst item in `results`, stop and return the best $k$ items. Otherwise inspect $c$'s unvisited neighbors and push improvements onto both heaps.

<figure>
  <img src="illustrations/_generated/hnsw_layers_dark.png" alt="Constructed HNSW search descends through three layers while preserving the same vector ID: entry v7 routes to v4 on Layer 2, v4 descends into Layer 1 and routes to v6, and v6 descends into Layer 0 where v8 and v3 are inspected as neighbors. The solid links show greedy hops and dashed links show same-ID descents. A separate min-heap expands the closest unexpanded candidate first; a max-heap retains at most ef_search results. The expansion queue or visited set can exceed that result limit." />
  <figcaption>Search greedily descends from the entry point across sparse upper layers (dashed arrows keep the same node ID), then runs a two-heap beam search of width <code>ef_search</code> on Layer 0.</figcaption>
</figure>

### Why HNSW prefers diverse neighbors over nearest neighbors

Three build parameters shape the graph: `M` (upper-layer link cap), `M0` (Layer-0 cap, normally $2M$), and `ef_construction` (insertion beam width). Wiring a new node $v$ blindly to its $M$ closest neighbors creates dense local cliques with poor inter-cluster bridges. HNSW's **diversity heuristic** (`SELECT-NEIGHBORS-HEURISTIC`) visits candidates in ascending distance to $v$ and keeps candidate $e$ only if it is closer to $v$ than to every already-selected neighbor $n$:

$$
d(e, v) < d(e, n) \quad \forall n \in \text{selected}
$$

Skipping candidates hidden right behind existing links forces edges to point outward in fresh directions.[^malkov2018]

### Tracing an insertion and building a working HNSW

Insertion mirrors search: sample top layer $\ell$, greedily descend layers *above* $\ell$, then run beam search of width `ef_construction` on layers $\ell$ down to $0$, adding reciprocal links and pruning adjacency lists exceeding `2M` (Layer 0) or `M` (upper layers). The global entry point changes only if $\ell$ strictly exceeds the current maximum layer.

This self-contained HNSW (using nearest-$M$ pruning for brevity) builds a 2-layer graph and shows why widening `ef_search` rescues a query whose only path to the true nearest neighbor crosses a farther bridge node:

<!-- leetllm: test, output=show -->
```python title="hnsw-insert-and-search.py"
# fold:start imports, distance helper & MiniHNSW structure
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


def prune(graph: MiniHNSW, node_id: int, level: int, cap: int) -> None:
    linked = graph.edges[(node_id, level)]
    if len(linked) > cap:
        graph.edges[(node_id, level)] = sorted(
            linked, key=lambda other: sq_l2(graph.vectors[node_id], graph.vectors[other])
        )[:cap]
# fold:end


def greedy_search(graph: MiniHNSW, query: tuple[float, ...], entry: int, level: int) -> int:
    current = entry
    while True:
        best = min([current, *graph.neighbors(current, level)], key=lambda n: sq_l2(query, graph.vectors[n]))
        if best == current:
            return current
        current = best


def search_layer(graph: MiniHNSW, query: tuple[float, ...], entry: int, level: int, ef: int) -> list[int]:
    visited = {entry}
    d0 = sq_l2(query, graph.vectors[entry])
    candidates, results = [(d0, entry)], [(-d0, entry)]  # min-heap & bounded max-heap
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


# fold:start graph demo & bridge-node test
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
    entry_point=0, max_level=0,
)
print("bridge ef=1:", search(bridge, (0.0, 0.0), k=1, ef_search=1))
print("bridge ef=3:", search(bridge, (0.0, 0.0), k=1, ef_search=3))
# fold:end
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

With `ef_search = 1`, node 1 is farther than entry 0 so the beam stops immediately and misses node 2; raising `ef_search` to 3 crosses the bridge. Always keep `ef_search >= k` (`results` holds at most `ef_search` items, and engines like `hnswlib` reject `ef < k`).[^hnswlibParameters2026][^pgvector_docs]

### Key HNSW knobs and memory budget

| Parameter | Role | Starting value | Trade-off |
|-----------|------|----------------|-----------|
| `M` | Upper-layer link cap per node | `16` | Higher `M` boosts recall at extra RAM and build time. |
| `M0` | Layer-0 adjacency cap | `2 * M` | Denser base layer improves local routing. |
| `ef_construction` | Build-time beam width | `200` | Cleaner graph at slower indexing speed. |
| `ef_search` | Query-time beam width (`>= k`) | `64` (for `k=10`) | Tunable per query without rebuilding; higher raises recall and latency. |
| `mL` | Layer-sampling scale | $1 / \ln(M)$ | Controls upper-layer density. |

At high float32 dimensions, raw vectors dominate RAM rather than graph links: for $d = 1{,}536$ and $M = 16$, each vector takes $6{,}144$ bytes while $2M = 32$ 4-byte Layer-0 neighbor IDs take only $128$ bytes (98.0% vector, 2.0% Layer-0 links). Links become a large share only after compression or at low dimensions. Tune `ef_search` at query time by sweeping recall against p95 latency and choosing the fastest setting that clears your floor (for example, choosing `ef_search = 48` at 0.97 recall and 6.8 ms p95 over `ef_search = 24` at 0.91 recall or `96` at 12.4 ms against a 0.96 recall / 10 ms target).

Graph traversal shines in RAM, yet it still requires adjacency lists and lacks a fixed scan fraction. Partitioning space into cells solves both.

## IVF (Inverted File Index)

**IVF** replaces graph links with coarse geometric partitions. Offline <span data-glossary="k-means">k-means</span> learns $K = \text{nlist}$ cluster centroids $c_1, \dots, c_K$ (the **coarse quantizer**), dividing $\mathbb{R}^d$ into $K$ **Voronoi cells**:

$$
V_i = \{x \in \mathbb{R}^d \mid \|x - c_i\|^2 \le \|x - c_j\|^2 \;\; \forall j \ne i\}
$$

Each indexed vector appends to its nearest centroid's **inverted list**. A query scores all `nlist` centroids, picks the closest `nprobe` cells, and scans only those lists.[^johnson2017][^faiss2026indexes] With 1 million vectors, `nlist = 1,024`, and `nprobe = 5`, balanced IVF scores $1{,}024$ centroids plus $5 \times (10^6 / 1{,}024) \approx 4{,}883$ list vectors ($\approx 5{,}907$ total comparisons, **169x less work** than brute force).

### Why `nprobe = 1` misses neighbors across cell edges

When a query lands near the dividing plane between two Voronoi cells, its true nearest neighbor can sit just across the line in the neighboring cell. Raising `nprobe` opens adjacent cells and recovers it:

<figure>
  <img src="illustrations/_generated/ivf_probe_flow_dark.png" alt="Equal-unit 2D plots show centroids C0=(0,0) and C1=(10,0), their Voronoi boundary x=5, query q=(4.9,0), and vectors v0=(0.2,0.1), v1=(0.4,-0.1), v2=(4.6,0), v3=(5.4,0), and v4=(9.8,0.2). Distances from q are 0.30 to v2, 0.50 to v3, and 4.50 to v1. Probing List 0 alone returns v2 and v1 for 1/2 exact top-two neighbors; probing both lists returns v2 and v3 for 2/2." />
  <figcaption>Query <code>q = (4.9, 0)</code> falls on the List 0 side of the Voronoi dividing line <code>x = 5</code>. Probing List 0 alone misses <code>v3 = (5.4, 0)</code> (distance 0.50); probing both lists recovers the exact top-2.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="ivf-nprobe-edge-miss.py"
# fold:start distance helper, centroids & inverted-list build
def sq_l2(a: tuple[float, ...], b: tuple[float, ...]) -> float:
    return sum((x - y) ** 2 for x, y in zip(a, b))


centroids = {0: (0.0, 0.0), 1: (10.0, 0.0)}
vectors = {0: (0.2, 0.1), 1: (0.4, -0.1), 2: (4.6, 0.0), 3: (5.4, 0.0), 4: (9.8, 0.2)}

lists: dict[int, list[int]] = {0: [], 1: []}
for vid, vec in vectors.items():
    lists[min(centroids, key=lambda c: sq_l2(vec, centroids[c]))].append(vid)
# fold:end


def ivf_search(query: tuple[float, ...], nprobe: int, k: int = 2) -> list[int]:
    probed = sorted(centroids, key=lambda c: sq_l2(query, centroids[c]))[:nprobe]
    scored = [(sq_l2(query, vectors[vid]), vid) for cid in probed for vid in lists[cid]]
    return [vid for _, vid in sorted(scored)[:k]]


# fold:start probe comparison prints
query = (4.9, 0.0)
print("inverted lists:", lists)
print("exact top-2:   ", sorted(vectors, key=lambda vid: sq_l2(query, vectors[vid]))[:2])
print("nprobe=1:      ", ivf_search(query, nprobe=1))
print("nprobe=2:      ", ivf_search(query, nprobe=2))
# fold:end
```

<!-- leetllm: output:start -->
```text title="Output" output compact
inverted lists: {0: [0, 1, 2], 1: [3, 4]}
exact top-2:    [2, 3]
nprobe=1:       [2, 1]
nprobe=2:       [2, 3]
```
<!-- leetllm: output:end -->

With balanced lists, IVF scans roughly `nprobe / nlist` of the corpus. In **IVF-Flat**, probing all `nlist` cells recovers exact search; in **IVF-PQ**, quantization error remains even at full scan.

### Distance metrics and centroid geometry

Every index ranks under one metric: squared **L2**, **Inner Product (IP)** ($\langle x, y \rangle$), or **<span data-glossary="cosine-similarity">Cosine similarity</span>** (L2-normalize stored vectors and queries, then run IP).[^faissMetrics2026] On unit vectors, L2 and IP induce identical rankings because $\|x - y\|^2 = 2 - 2\langle x, y \rangle$:

> **Common mistake:** Switching IVF from raw L2 to cosine by normalizing only the queries. Centroids trained on unnormalized vectors route unit queries into the wrong Voronoi cells. Normalize training, database, and query vectors, retrain centroids, and score with IP.

<!-- leetllm: test, output=show -->
```python title="verify-cosine-inner-product-ranking.py"
import numpy as np

vectors = np.array([[3.0, 0.0], [1.0, 1.0], [0.0, 2.0]])
query = np.array([1.0, 0.8])
unit_v = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
unit_q = query / np.linalg.norm(query)

print("IP rank on unit vectors:", np.argsort(-(unit_v @ unit_q)).tolist())
print("L2 rank on unit vectors:", np.argsort(np.sum((unit_v - unit_q) ** 2, axis=1)).tolist())
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
| **Offline training** | None | Required ($k$-means centroids) |
| **Memory** | Raw vectors + ~$2M$ Layer-0 IDs | Raw vectors + IDs (no graph edges) |
| **Updates & drift** | Incremental inserts; deletes vary by engine | Easy inserts; distribution drift stales centroids |
| **Main query knob** | `ef_search` | `nprobe` |
| **Best fit** | Low-latency, high-recall in-RAM search | Predictable scan fraction or base for PQ |

Graph search and compression are orthogonal (`IndexHNSWFlat`, `IndexHNSWSQ`, `IndexHNSWPQ`, `IndexIVFPQ` in Faiss).[^faiss2026indexes] Yet raw float32 vectors still break RAM at billion scale: $10^9 \times 768 \times 4\text{ bytes} \approx 3.07\text{ TB}$. Fitting a billion vectors into RAM requires shrinking each vector.

## Product Quantization (PQ)

**Product Quantization (PQ)** splits a $d$-dimensional vector into $m$ disjoint subvectors $x = [u_1, \dots, u_m]$ ($u_j \in \mathbb{R}^{d/m}$) and runs $k$-means independently on each subspace to learn a codebook $C_j$ of $K^* = 256$ centroids.[^jegou2011] Because $256 = 2^8$, each centroid ID fits in one `uint8` byte:

$$
\text{code}_j(x) = \arg\min_{k \in \{0, \dots, 255\}} \|u_j - c_{j,k}\|^2
$$

For $d = 768$ and $m = 96$ ($d^* = 8$), a 3,072-byte float32 vector shrinks to **96 bytes** (**32x code-only compression**; adding an 8-byte ID gives 104 bytes per record). The 96 shared codebooks use only $96 \times 256 \times 8 \times 4 = 768\text{ KiB}$ globally while spanning $256^{96}$ reconstructed points. In L2 IVF-PQ, PQ normally encodes the **residual** $r = x - c_{\text{list}}$ around each coarse centroid so residuals cluster near zero and quantize more accurately.[^faiss2026ImplementationNotes] **Optimized Product Quantization (OPQ)** learns an orthogonal rotation $R$ jointly with the codebooks to balance variance across subspaces while preserving L2 distance (`OPQ96,IVF4096,PQ96`).[^ge2013][^faissIndexFactory2026]

<figure>
  <img src="illustrations/_generated/pq_encoding_pipeline_dark.png" alt="Product quantization splits a 768-dimensional float32 vector into 96 eight-dimensional subvectors. Each subvector maps to one of 256 centroids in its own codebook and contributes one byte. The code-row example maps the first subvector to centroid ID 42 and writes one uint8 code byte per subspace. The 96-byte code is 32 times smaller than the 3,072-byte raw vector, for code storage alone. At query time, an uncompressed query builds a 96 by 256 float32 distance table. Each byte selects one entry per subspace, and 96 selected distances are summed without reconstructing the full vector." />
  <figcaption>Each 8D subvector maps to one byte (a 32x code reduction from 3,072 B to 96 B). At query time, ADC precomputes a 96 x 256 lookup table so scoring a compressed vector requires only 96 table lookups and additions.</figcaption>
</figure>

### Asymmetric Distance Computation (ADC)

At query time, **<span data-glossary="asymmetric-distance-computation">Asymmetric Distance Computation (ADC)</span>** leaves the query $q$ uncompressed and never reconstructs stored vectors. Slice $q = [q_1, \dots, q_m]$, precompute one cache-resident $m \times 256$ lookup table $T[j][k] = \|q_j - c_{j,k}\|^2$ (96 KiB for $m = 96$), and score any code $[c_1, \dots, c_m]$ with $m$ indexed additions:[^faiss2026ImplementationNotes]

$$
d(q, y)^2 \approx \sum_{j=1}^{m} T[j][c_j]
$$

The script below implements ADC and shows **code collision**: two distinct vectors sharing one PQ code cannot be ordered until you overfetch and rerank against full-precision originals.

<!-- leetllm: test, output=show -->
```python title="asymmetric-distance-computation-adc.py"
import numpy as np


def adc_search(query: np.ndarray, codes: np.ndarray, codebooks: np.ndarray, k: int = 2) -> list[int]:
    m, _, d_sub = codebooks.shape
    q_subs = query.reshape(m, d_sub)
    tables = np.sum((codebooks - q_subs[:, None, :]) ** 2, axis=2)  # (m, K*) lookup table
    dists = np.sum(tables[np.arange(m), codes], axis=1)             # m additions per code
    return sorted(range(len(codes)), key=lambda i: (float(dists[i]), i))[:k]


# fold:start sample codebooks, collision test & prints
raw_bytes, code_bytes = 768 * 4, 96
print(f"768D float32: {raw_bytes} B -> PQ96: {code_bytes} B ({raw_bytes // code_bytes}x), +8B ID = {code_bytes + 8} B")

codebooks = np.array([
    [[0.0, 0.0], [2.0, 0.0], [0.0, 2.0], [2.0, 2.0]],
    [[0.0, 0.0], [2.0, 0.0], [0.0, 2.0], [2.0, 2.0]],
])
codes = np.array([[0, 0], [1, 0], [0, 1], [1, 1]])
print("ADC top-2 for origin:", adc_search(np.array([0.0, 0.0, 0.0, 0.0]), codes, codebooks, k=2))

# Code collision: two originals quantize to [0, 0]; overfetch + exact rerank fixes top-1.
q = np.array([0.9, 0.0, 0.0, 0.0])
originals = np.array([[0.1, 0.0, 0.0, 0.0], [0.9, 0.0, 0.0, 0.0]])
same_codes = np.array([[0, 0], [0, 0]])

compressed_top1 = adc_search(q, same_codes, codebooks, k=1)
overfetched = adc_search(q, same_codes, codebooks, k=2)
reranked_top1 = sorted(overfetched, key=lambda i: float(np.sum((q - originals[i]) ** 2)))[:1]
print(f"collision top-1 without overfetch: {compressed_top1} | after overfetch+rerank: {reranked_top1}")
# fold:end
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

Real retrieval filters by tenant, region, or date (`region = 'EU'`). Three strategies behave very differently under selective filters:

1. **Pre-filter then exact scan:** Resolve metadata first via B-tree or bitmap, then run flat search on the matching rows. Fast and exact when only a few thousand rows match; too slow when millions match (and stripping disallowed nodes from an HNSW graph beforehand can disconnect it).
2. **Post-filtering:** Fetch an unfiltered buffer of $L$ ANN candidates, then discard non-matches. With selectivity $s = 0.005$ and $L = 100$, expected matches are $E[M] = L \cdot s = 0.5$, and the probability of zero results is $(1 - s)^L = 0.995^{100} \approx 60.6\%$ under independence (or $1 - s = 99.5\%$ when nearby vectors share excluded metadata).
3. **Filter-aware traversal and iterative scans:** <span data-glossary="pgvector">pgvector</span> expands iterative ANN scans (`hnsw.max_scan_tuples`, `ivfflat.max_probes`) until $k$ matches are collected or a scan cap hits.[^pgvector_docs] <span data-glossary="weaviate">Weaviate</span> sweeps across disallowed nodes without returning them and supports **ACORN** traversal, skipping distance computation on non-matches with multi-hop jumps from eligible entry points.[^patel2024acorn][^weaviate_filter_docs]

<!-- leetllm: test, output=show -->
```python title="post-filter-starvation.py"
L, s = 100, 0.005
print(f"expected matches:              {L * s:.2f}")
print(f"independent empty probability: {(1 - s) ** L:.1%}")
print(f"correlated empty probability:  {1 - s:.1%}")

# fold:start buffer underfill example
candidates = ["eu-1", "us-1", "us-2", "us-3", "eu-2"]
region = {"eu-1": "eu", "us-1": "us", "us-2": "us", "us-3": "us", "eu-2": "eu"}

def post_filter(pool: list[str], target: str, k: int) -> list[str]:
    return [doc for doc in pool if region[doc] == target][:k]

print("buffer L=3:", post_filter(candidates[:3], "eu", k=2))
print("buffer L=5:", post_filter(candidates, "eu", k=2))
# fold:end
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

<figure>
  <img src="illustrations/_generated/filtered_search_boundary_dark.png" alt="Side-by-side 2D vector neighborhoods compare post-filtering versus pre-filtered ACORN traversal for query q=(5,5) with predicate region=EU and k=3. On the left, the unfiltered top-3 circle captures eu-1, us-1, and us-2; dropping disallowed US points leaves only eu-1 (1/3 underfilled). On the right, filter-aware ACORN traversal skips US nodes and steps cleanly through eligible EU vectors eu-4, eu-2, eu-1, and eu-3 to fill all 3/3 slots." />
  <figcaption>Post-filtering a fixed global top-3 neighborhood drops disallowed US neighbors and underfills at 1/3 (`eu-1` only); pre-filtered ACORN traversal skips excluded US nodes inside the index to fill all 3/3 eligible EU slots.</figcaption>
</figure>

> **Key insight:** Run access-control filters *inside* the database or trusted retrieval service, never in application code after fetching raw rows. Fetching unauthorized text into app memory exposes it to logs, caches, and traces. See [Production RAG Pipelines](/learn/design-production-rag-pipeline).

## Scaling to billions and choosing an index

Beyond single-machine RAM, three architectures dominate:

1. **IVF-PQ in RAM:** Faiss's `IndexIVFPQ` stores `ceil(m_pq * nbits / 8) + 8` bytes per vector (code + 64-bit ID): ~40 GB for 1B vectors at 32-byte codes, or ~104 GB at 96-byte codes.[^faiss2026indexes]
2. **SSD-backed graphs (DiskANN):** Keeps a compact compressed index in RAM and stores full vectors and adjacency lists on NVMe SSD to minimize random reads, achieving >5,000 QPS at <3 ms mean latency and 95%+ 1-recall@1 on SIFT1B on one 16-core, 64 GB RAM + SSD machine.[^subramanya2019]
3. **Horizontal sharding (scatter-gather):** Partition the corpus across $S$ disjoint shards, query all $S$ shards, and merge local top-$k$ lists on comparable scores. When every shard runs **exact** search with consistent tie-breaking and all $S$ shards respond, the $S \cdot k$ candidates are guaranteed to contain the exact global top-$k$ (any omitted item already trails $k$ items on its own shard); dropping a slow shard or using approximate per-shard search breaks that guarantee.

<figure>
  <img src="illustrations/_generated/scatter_gather_topk_dark.png" alt="Constructed four-shard timeline on one shared 0–95 ms axis. Shard 1 returns five candidates at 44 ms, Shard 2 at 58 ms, Shard 3 at 86 ms, and Shard 4 at 51 ms. The slowest response arrives at 86 ms; a separate 3 ms merge ends at 89 ms. Each shard contributes five local candidates, for 20 IDs to rank by comparable scores and reduce to a global top five. Fan-out latency is set by the slowest shard response plus coordinator merge time." />
  <figcaption>A scatter-gather coordinator waits for the slowest shard (86 ms) before running the final merge (3 ms, finishing at 89 ms).</figcaption>
</figure>

Full fan-out amplifies tail latency ($T_{\text{query}} \ge \max(T_1, \dots, T_S) + T_{\text{merge}}$). If each shard independently clears its threshold $t_{99}$ with probability $0.99$, all $S$ shards clear it with probability $0.99^S$: 96.1% across 4 shards, dropping to 81.8% across 20 shards (where cluster p99 is driven by the single-shard $0.99^{1/20} \approx 99.95\text{th}$ percentile). Use replica hedging or per-shard deadlines with explicit partial-result flags to rein in tails.

### Index family comparison

| Index family | Core mechanism | Strength | Main cost | Reach for it when |
|--------------|----------------|----------|-----------|-------------------|
| **HNSW** | Hierarchical proximity graph | Fast, high-recall in-RAM search | Raw-vector RAM, build time, deletes | Vectors fit in RAM and low latency matters |
| **IVF-Flat** | Coarse Voronoi cells + exact list scan | Predictable scan fraction | Offline training, raw-vector RAM | You want fixed scan budgets without graph edges |
| **IVF-PQ** | IVF + subspace byte codes + ADC | ~10x-32x smaller footprint | Quantization error, rerank tuning | RAM capacity is the primary bottleneck |
| **DiskANN** | SSD-resident graph + compact RAM guide | Billion-scale on one NVMe node | Storage-layout and I/O engineering | Corpus exceeds RAM but single-node SSD fits |

When evaluating any vector engine, check four fundamentals: which ANN families it exposes, how it executes filtered search, where the index lives (RAM, NVMe, object storage), and what compression plus full-precision reranking knobs it supports.

## When vector indexes break

| Symptom | Likely root cause | Concrete fix |
|---------|-------------------|--------------|
| IVF recall drops over months | Embedding distribution drifted from stale centroids | Retrain centroids on recent data and rebuild lists |
| HNSW exhausts RAM | Float32 vectors + links + allocator overhead exceed memory | Measure bytes/vector; adopt SQ, PQ, or IVF-PQ |
| Fast queries miss obvious matches | Too-small `ef_search` / `nprobe`, PQ error, or metric mismatch | Check exact baseline first; separate recall from reranking |
| Cosine switch tanks IVF recall | Centroids trained on unnormalized L2 vectors | Normalize all vectors and retrain centroids for IP |
| Deleted docs still appear | Tombstones, dead tuples, or lagging replicas | Test delete visibility; run compaction or index rebuild |
| Adding shards spikes p99 | Full fan-out waits on slowest shard | Prune shard routing, hedge requests, or cap shard deadlines |

## Hands-on: metric migration and deletion in Faiss

Run this self-contained Faiss script with `uv run vector-index-replay.py` to see metric geometry and deletion behavior directly.[^faiss2026indexes][^faissMetrics2026] Under raw L2, `[1, 1]` beats `[10, 0]` for query `[1, 0.1]`; after L2 normalization and inner-product indexing, `[10, 0]` aligns along the query and wins. Removing ID `101` leaves Faiss's `-1` sentinel in the unfilled second slot:

<!-- leetllm: test, output=show, deps="faiss-cpu==1.15.1,numpy==2.4.3" -->
```python title="vector-index-replay.py"
# fold:start uv script metadata & imports
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["faiss-cpu==1.15.1", "numpy==2.4.3"]
# ///
import faiss
import numpy as np

faiss.omp_set_num_threads(1)
# fold:end
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

removed = cosine.remove_ids(np.array([101], dtype="int64"))
_, after_delete = cosine.search(unit_query, 2)

# fold:start print results
print("Raw L2 winner:", int(raw_ids[0, 0]))
print("Cosine winner after rebuilding:", int(cosine_ids[0, 0]))
print("Removed records:", removed)
print("Results after delete:", after_delete[0].tolist())
# fold:end
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Raw L2 winner: 202
Cosine winner after rebuilding: 101
Removed records: 1
Results after delete: [202, -1]
```
<!-- leetllm: output:end -->

Check for `-1` sentinels when fewer than `k` matches exist, propagate deletes across replicas before cutover, and benchmark `ef_search` or `nprobe` against an exact top-$k$ baseline under real queries and metadata filters.

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
