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
  "shortDescription": "Find out how an index can miss the rollback runbook, then tune HNSW, IVF, and compression against recall, latency, and memory.",
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
    "hybrid-search-dense-sparse-retrieval",
    "reranking-cross-encoders-rag",
    "rag-evaluation-faithfulness-relevance"
  ]
}
---

A support assistant has to find one <span data-glossary="rollback">rollback</span> runbook in a corpus of 100 million runbook chunks and incident summaries. Checking every stored representation can push tail latency past the budget. Skipping most candidates can miss the runbook an operator needs. How much work can we skip while still recovering the right neighbors?

Use that query to make the trade-off visible. An <span data-glossary="embedding">embedding</span> turns the query and each runbook into a vector; the model determines how useful that geometry is for relevance. Exact search checks every vector; <span data-glossary="hnsw">Hierarchical Navigable Small World (HNSW)</span> walks graph links; <span data-glossary="ivf">inverted file (IVF)</span> opens selected partitions; and <span data-glossary="product-quantization">product quantization (PQ)</span> compresses stored vectors. The release decision comes from recovered neighbors, latency, memory, and update behavior measured together.

The [embedding lesson](/learn/embeddings-cosine-dot-product-quantization) established the ranking rule: compare vectors using the metric and normalization expected by the embedding model. Keep that rule fixed here. An index approximates those rankings; it doesn't decide whether the embedding model captures the meaning of a rollback correctly.

## The brute-force problem

Start with **exact search**, also called flat search. Given a query <span data-glossary="vector">vector</span> $q$, it computes a distance to every stored vector and returns the $k$ nearest neighbors; k-NN is shorthand for $k$-nearest-neighbor search.

Use the incident corpus as a concrete baseline: 100 million embeddings, each with 1,536 dimensions, stored as 4-byte floats. An unfiltered flat query scores all 100 million vectors, or 153.6 billion scalar components before considering SIMD vectorization, batching, memory bandwidth, or accelerator hardware. For $N$ vectors with $d$ dimensions, distance scoring takes <span data-glossary="big-o-notation">$O(N \cdot d)$</span> work: doubling either quantity doubles the components processed.

Why not use a k-d tree? Spatial trees prune regions whose distance bounds cannot beat the current best neighbor, which can work well in low dimensions. Query cost still depends on dimension and point distribution; SciPy warns that even 20 dimensions can make its k-d tree no faster than brute force.[^scipyKDTree2026]

One reason is **distance concentration**: under suitable distributional assumptions, distances become similar relative to their scale, weakening useful bounds. It isn't a theorem about every high-dimensional dataset. Intrinsic dimension, clustering, metric, and sample size matter. Pad a one-dimensional dataset with 767 zero coordinates and its distances remain unchanged. Also, similar radii don't imply similar high-dimensional ball volumes: volume scales as radius raised to the dimension. Measure pruning on your embeddings rather than declaring trees unusable from their dimension alone.

Raw storage is the other half of the problem:

$$
100{,}000{,}000 \text{ vectors} \times 1{,}536 \text{ dims} \times 4 \text{ bytes} \approx 614 \text{ GB} \approx 572 \text{ GiB}
$$

That's raw vector storage alone, before index overhead, operating-system page caches, or application state. A single node has to hold that working set before the index adds anything.

<!-- leetllm: test, output=show -->
```python title="estimate-flat-storage-and-work.py"
import math

def gib_for_float32_vectors(count: int, dimensions: int) -> float:
    return count * dimensions * 4 / (1024 ** 3)

def scalar_components_scored(count: int, dimensions: int) -> int:
    return count * dimensions

n_vectors = 100_000_000
dimensions = 1_536

print(f"raw float32 storage: {gib_for_float32_vectors(n_vectors, dimensions):.1f} GiB")
print(f"scalar components scored per flat query: {scalar_components_scored(n_vectors, dimensions):,}")

query = [0.0] * 768
padded_points = [[value] + [0.0] * 767 for value in (1.0, 10.0)]
print(f"zero-padded 768D distances: {[math.dist(query, point) for point in padded_points]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw float32 storage: 572.2 GiB
scalar components scored per flat query: 153,600,000,000
zero-padded 768D distances: [1.0, 10.0]
```
<!-- leetllm: output:end -->

Exact search defines 100% ANN recall when the vectors, metric, filter, numerical conventions, and tie policy match the evaluation baseline. The component count alone doesn't tell us milliseconds or QPS (queries per second). <span data-glossary="ann-search">Approximate nearest-neighbor (ANN) search</span> saves work by accepting possible misses, but its speedup and recall depend on data, hardware, concurrency, and settings. Recovering 97% of exact neighbors is a possible measured operating point, not a built-in promise of an index family.

Measured settings form a **Recall@K versus QPS Pareto frontier** when no other tested setting is at least as good on both axes and better on one. Many tested points lie below that frontier; a tuning change doesn't necessarily move along it. Exact flat search remains your recall baseline, and can be a good execution path when a metadata filter leaves a small eligible subset. For example, <span data-glossary="pgvector">pgvector</span> defaults to exact nearest-neighbor search and recommends considering a filter-column index for highly selective queries.[^pgvector_docs]

```checkpoint
Why is unfiltered exact vector search difficult at 100 million vectors?
---
The system stores hundreds of GB of raw vectors and scores every vector for each unfiltered query. Both storage and query work grow with corpus size, so teams commonly evaluate ANN indexes while retaining exact search as their recall baseline.
```

**<span data-glossary="recall-at-k">Recall@k</span>** answers one question: of the exact top-`k` nearest neighbors, how many did the ANN index recover? A low latency can hide poor neighbor recovery. For example, recovering 98 of the exact top 100 gives 98% ANN recall. Evaluate whether those documents answer the user's question separately.

**ANN recall** compares an index's results with an exact-search baseline. Relevance recall compares results with human-labeled documents. An index can perfectly reproduce a poor embedding ranking. Compute the exact baseline with the same metric, corpus snapshot, and filter as the approximate query, and use a consistent policy for ties at the cutoff.

<!-- leetllm: test, output=show -->
```python title="measure-recall-at-k.py"
def recall_at_k(exact_ids: list[int], approximate_ids: list[int]) -> float:
    expected = set(exact_ids)
    if not expected or len(expected) != len(exact_ids):
        raise ValueError("exact_ids must contain distinct IDs and be nonempty")
    if len(approximate_ids) > len(exact_ids):
        raise ValueError("compare at the same cutoff k, not an overfetched buffer")
    if len(set(approximate_ids)) != len(approximate_ids):
        raise ValueError("approximate_ids must contain distinct IDs")
    return len(expected.intersection(approximate_ids)) / len(expected)

exact_top_5 = [10, 21, 34, 55, 89]
fast_but_weak = [10, 21, 8, 13, 5]
slower_but_better = [10, 21, 34, 55, 3]

print(f"fast candidate recall@5: {recall_at_k(exact_top_5, fast_but_weak):.0%}")
print(f"better candidate recall@5: {recall_at_k(exact_top_5, slower_but_better):.0%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fast candidate recall@5: 40%
better candidate recall@5: 80%
```
<!-- leetllm: output:end -->

> **Recall gate:** Latency without recall is incomplete. Keep an exact-search evaluation set, measure ANN recall against it, and choose an operating point on the Recall@K vs QPS Pareto frontier that satisfies your product SLA.

<figure>
  <img src="illustrations/_generated/vector_db_internals_dark.png" alt="Two constructed index mechanisms narrow a query’s scoring work. In HNSW, a search follows graph links from an entry through closer neighbors and expands a base-layer neighborhood. In IVF, query q at x=4.9 lies in List 0, whose members are v0, v1, and v2; List 1 contains v3 and v4. Both methods send only their candidate pool to the same metric-scoring and top-k step." />
  <figcaption>HNSW follows links; IVF opens lists. Each narrows the vectors that reach exact metric scoring, and each can miss a true neighbor. The graph and one-dimensional IVF membership view are constructed schematics; the next figures work through their search mechanics.</figcaption>
</figure>

## HNSW (Hierarchical Navigable Small World)

With exact search held as ground truth, start with HNSW when the working set can stay in memory. It searches through graph links and does not need an offline centroid-training phase.[^malkov2018]

### Skip-lists in high dimensions: layers skip, then search locally

To understand HNSW, picture a 1D skip-list: an ordered linked list with tiers of express pointers. With promotion probability $1/2$, level 1 contains about half the elements and level 2 about a quarter. One pointer can skip many elements; the whole search still takes multiple hops. HNSW borrows that hierarchy while replacing ordered-list pointers with proximity-graph edges.[^malkov2018] The analogy explains sparse upper layers; search cost depends on graph structure and embedding distribution.

When inserting vector $v$, its maximum layer $\ell$ is drawn from an exponential decay distribution:

$$
P(\text{level} \ge \ell) = \exp(-\ell / m_L)
$$

For $M > 1$, setting the scale parameter to $m_L = 1 / \ln(M)$ produces an intuitive geometric progression:

$$
P(\text{level} \ge \ell) = \exp\left(-\ell \cdot \ln(M)\right) = M^{-\ell} = \left(\frac{1}{M}\right)^\ell
$$

The probability of reaching Layer 1 is $1/M$; reaching Layer 2 has probability $1/M^2$. Expected populations are $N$, $N/M$, and $N/M^2$. Near level $\log_M N$, the expected population is about one; the realized highest level and its population vary randomly. A stored entry point starts the search. Sparse upper layers can connect more distant regions than the dense base layer.

Upper-layer traversal uses **greedy routing**. Starting at the global entry point on the top layer, search evaluates the distance from query $q$ to each neighbor of the current node. If a neighbor is closer to $q$, search hops to that neighbor. It repeats this greedy walk until no neighbor is closer to $q$ than the current node. That identifies the local minimum on that layer. The search then drops down to the next lower layer at the exact same physical node, using that node as the entry point for the denser layer below.

At the base layer (Layer 0), a greedy walk can get trapped at a local minimum. HNSW uses a wider **beam search** with a retained result set bounded by $ef_{\text{search}}$. The expansion queue and visited set can exceed that size, so this parameter doesn't cap total distance evaluations or wall time. The search maintains two heaps:
1. `candidates`: A min-heap of visited, unexpanded nodes sorted by ascending distance to $q$.
2. `results`: A max-heap of size at most $ef_{\text{search}}$ storing the closest vectors encountered so far.

At each step, search pops the closest node $c$ from `candidates`. If it is farther than the worst retained result, the paper's search stops. This is an approximate stopping rule: a farther node could lead to a closer unseen node. Otherwise, previously unvisited neighbors enter both heaps when they improve the retained set or that set is still below capacity; overflowing results are pruned. Finally, search returns up to $k$ retained items.

Graph connectivity is governed by three critical knobs:
- `M`: Number of neighbors selected for a new node; implementations commonly use it as the upper-layer adjacency cap too. Reciprocal insertion followed by pruning can leave asymmetric links.
- `M0`: Layer-0 adjacency cap, commonly $2M$. A larger base-layer budget can improve connectivity at a memory cost; verify graph reachability on the built index.
- `ef_construction`: The candidate beam size used during index insertion to select neighbors.

Why not connect each node to its $M$ nearest neighbors? Those neighbors often cluster together in the same direction, creating redundant cliques with no edges pointing toward other clusters. A query approaching from another direction can't route past that cluster.

HNSW addresses redundant neighbors with a **diversity heuristic** (`SELECT-NEIGHBORS-HEURISTIC`). It examines candidates in ascending distance to the base node $v$. Its first selection pass accepts $e$ when:

$$
d(e, v) < d(e, n) \quad \forall n \in \text{selected}
$$

If $e$ is closer to a selected neighbor than to $v$, that pass treats it as redundant. This favors diverse routes; the builder's later steps determine actual edges and connectivity. The paper also offers candidate extension and `keepPrunedConnections`, which can refill unused slots with initially rejected candidates. Measure recall on the built graph.[^malkov2018]

<figure>
  <img src="illustrations/_generated/hnsw_layers_dark.png" alt="Constructed HNSW search descends through three layers while preserving the same vector ID: entry v7 routes to v4 on Layer 2, v4 descends into Layer 1 and routes to v6, and v6 descends into Layer 0 where v8 and v3 are inspected as neighbors. The solid links show greedy hops and dashed links show same-ID descents. A separate min-heap expands the closest unexpanded candidate first; a max-heap retains at most ef_search results. The expansion queue or visited set can exceed that result limit." />
  <figcaption>Constructed route, with node positions chosen for explanation. Solid edges mark greedy hops, while dashed descent keeps the same vector ID. The base-layer neighbors shown are inspected candidates, not a claim about the final returned set. HNSW's candidate min-heap drives expansion; its separate result max-heap is bounded by <code>ef_search</code>, and its returned items are still approximate.</figcaption>
</figure>

### A worked example: tracing one insertion

To see the layers work, insert one new runbook vector into a graph that already has a few nodes.

First, a random process samples the new node's top layer using $P(\text{level} \ge \ell) = (1/M)^\ell$. Most nodes live only on layer 0; a few appear higher, which keeps upper layers sparse.

Next, start at the current entry point and greedily walk each layer above the new node's top layer. Stop when no neighbor is closer, then drop down. Those upper layers locate a useful neighborhood without wiring the new node into distant parts of the graph.

On each layer the new node actually occupies, run a <span data-glossary="beam-search">beam search</span> retaining up to `ef_construction` candidates. Select up to `M` neighbors using the diversity heuristic and add links in both directions. Prune each overflowing adjacency list to its cap. Those local pruning decisions can leave asymmetric links; the final graph does not need to be strictly undirected. The layer-0 cap is commonly `2M`.

Finally, update the entry point only when the sampled level is *above* the graph's current maximum. Landing on an existing top layer changes local wiring, not the global starting point.

This incremental construction is why HNSW doesn't need an offline training phase. Every new vector is wired into the existing graph using local search.

### Build a tiny graph, then search it

Insertion follows the paper's two phases: greedy descent through layers *above* the new node's top layer, then a wider construction search while wiring the layers it occupies.[^malkov2018] Two simplifications keep the lab readable: it selects the nearest `M` candidates and carries only the nearest entry to the next layer. The paper also gives a diversity heuristic and carries the construction candidate set downward. Diversity can retain a route to a different cluster instead of spending every edge on near-duplicates.

The search loop uses two heaps. `candidates` expands the closest unexplored node first; `results` exposes the farthest retained node using negative distances. If the best unexplored distance is already worse than the full retained set, this search stops. An unseen vector may still be closer, so evaluate recall against exact neighbors.

Level sampling is exponential. `sample_level` is the random process a real builder uses. The lab then inserts with explicit levels so the wiring stays reproducible. In this tiny graph, the returned neighbors match the exact top-2. Benchmark recall on larger datasets to estimate large-scale behavior.

<!-- leetllm: test, output=show -->
```python title="hnsw-insert-and-search.py"
import heapq
import math
import random
from dataclasses import dataclass, field


def squared_l2(left: tuple[float, ...], right: tuple[float, ...]) -> float:
    if len(left) != len(right):
        raise ValueError("vectors must have equal dimensions")
    return sum((a - b) ** 2 for a, b in zip(left, right))


def sample_level(mL: float, rng: random.Random) -> int:
    u = max(rng.random(), 1e-12)
    return math.floor(-math.log(u) * mL)


@dataclass
class ToyHNSW:
    M: int = 2
    ef_construction: int = 4
    vectors: dict[int, tuple[float, ...]] = field(default_factory=dict)
    edges: dict[tuple[int, int], list[int]] = field(default_factory=dict)
    entry_point: int | None = None
    max_level: int = -1

    def neighbors(self, node_id: int, level: int) -> list[int]:
        return list(self.edges.get((node_id, level), []))


def greedy_search(graph: ToyHNSW, query: tuple[float, ...], entry_id: int, level: int) -> int:
    current = entry_id
    improved = True
    while improved:
        improved = False
        for neighbor in graph.neighbors(current, level):
            if squared_l2(query, graph.vectors[neighbor]) < squared_l2(query, graph.vectors[current]):
                current = neighbor
                improved = True
    return current


def search_layer(
    graph: ToyHNSW, query: tuple[float, ...], entry_id: int, level: int, ef: int
) -> list[int]:
    visited = {entry_id}
    entry_dist = squared_l2(query, graph.vectors[entry_id])
    candidates = [(entry_dist, entry_id)]
    results = [(-entry_dist, entry_id)]
    while candidates:
        dist, current = heapq.heappop(candidates)
        if len(results) >= ef and dist > -results[0][0]:
            break
        for neighbor in graph.neighbors(current, level):
            if neighbor in visited:
                continue
            visited.add(neighbor)
            neighbor_dist = squared_l2(query, graph.vectors[neighbor])
            if len(results) < ef or neighbor_dist < -results[0][0]:
                heapq.heappush(candidates, (neighbor_dist, neighbor))
                heapq.heappush(results, (-neighbor_dist, neighbor))
                if len(results) > ef:
                    heapq.heappop(results)
    return [node for _, node in sorted((-neg, node) for neg, node in results)]


def prune(graph: ToyHNSW, node_id: int, level: int, cap: int) -> None:
    linked = graph.edges[(node_id, level)]
    if len(linked) <= cap:
        return
    keep = sorted(
        linked, key=lambda other: squared_l2(graph.vectors[node_id], graph.vectors[other])
    )[:cap]
    graph.edges[(node_id, level)] = keep


def insert(graph: ToyHNSW, node_id: int, vector: tuple[float, ...], level: int) -> None:
    if node_id in graph.vectors:
        raise ValueError("insertion requires a new ID")
    if level < 0 or graph.M < 1 or graph.ef_construction < graph.M:
        raise ValueError("require level >= 0 and ef_construction >= M >= 1")
    if not vector or not all(math.isfinite(x) for x in vector):
        raise ValueError("vectors must be nonempty and finite")
    if graph.vectors and len(vector) != len(next(iter(graph.vectors.values()))):
        raise ValueError("vectors must have equal dimensions")
    graph.vectors[node_id] = vector
    for layer in range(level + 1):
        graph.edges.setdefault((node_id, layer), [])
    if graph.entry_point is None:
        graph.entry_point = node_id
        graph.max_level = level
        return

    entry = graph.entry_point
    for layer in range(graph.max_level, level, -1):
        entry = greedy_search(graph, vector, entry, layer)
    for layer in range(min(level, graph.max_level), -1, -1):
        candidates = search_layer(graph, vector, entry, layer, graph.ef_construction)
        chosen = sorted(candidates, key=lambda i: squared_l2(vector, graph.vectors[i]))[: graph.M]
        cap = 2 * graph.M if layer == 0 else graph.M
        for neighbor in chosen:
            if neighbor == node_id:
                continue
            if neighbor not in graph.edges[(node_id, layer)]:
                graph.edges[(node_id, layer)].append(neighbor)
            graph.edges.setdefault((neighbor, layer), [])
            if node_id not in graph.edges[(neighbor, layer)]:
                graph.edges[(neighbor, layer)].append(node_id)
            prune(graph, neighbor, layer, cap)
        prune(graph, node_id, layer, cap)
        entry = min(candidates, key=lambda i: squared_l2(vector, graph.vectors[i]))
    if level > graph.max_level:
        graph.entry_point = node_id
        graph.max_level = level


def search(graph: ToyHNSW, query: tuple[float, ...], k: int = 2, ef_search: int = 4) -> list[int]:
    if graph.entry_point is None:
        raise ValueError("empty graph")
    if k < 1 or ef_search < k:
        raise ValueError("require ef_search >= k >= 1")
    if not all(math.isfinite(x) for x in query):
        raise ValueError("query must be finite")
    current = graph.entry_point
    for layer in range(graph.max_level, 0, -1):
        current = greedy_search(graph, query, current, layer)
    candidates = search_layer(graph, query, current, 0, ef_search)
    return sorted(candidates, key=lambda i: squared_l2(query, graph.vectors[i]))[:k]


rng = random.Random(0)
mL = 1 / math.log(16)
draws = 0
level = 0
while level == 0:
    level = sample_level(mL, rng)
    draws += 1
print(f"mL for M=16: {mL:.3f}")
print(f"P(level >= 1) = {1 / 16:.1%}")
print(f"first upper-layer draw: level {level} after {draws} samples")

graph = ToyHNSW()
for node_id, vector, level in [
    (0, (0.0, 0.0), 1),
    (1, (0.2, 0.1), 0),
    (2, (0.3, 0.0), 1),
    (3, (5.0, 5.0), 0),
    (4, (5.1, 4.8), 0),
    (5, (0.1, 0.3), 0),
]:
    insert(graph, node_id, vector, level)

query = (0.25, 0.05)
nearest_ids = search(graph, query, k=2, ef_search=4)
exact_ids = sorted(graph.vectors, key=lambda i: squared_l2(query, graph.vectors[i]))[:2]
print(f"nearest ids: {nearest_ids}")
print(f"exact top-2: {exact_ids}")

# A search-only counterexample for traversal bounds, separate from builder output.
bridge = ToyHNSW(
    vectors={0: (0.9, 0.0), 1: (2.0, 0.0), 2: (0.1, 0.0)},
    edges={(0, 0): [1], (1, 0): [2], (2, 0): []},
    entry_point=0,
    max_level=0,
)
print(f"farther bridge, ef=1: {search(bridge, (0.0, 0.0), k=1, ef_search=1)}")
print(f"farther bridge, ef=3: {search(bridge, (0.0, 0.0), k=1, ef_search=3)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mL for M=16: 0.361
P(level >= 1) = 6.2%
first upper-layer draw: level 1 after 36 samples
nearest ids: [1, 2]
exact top-2: [1, 2]
farther bridge, ef=1: [0]
farther bridge, ef=3: [2]
```
<!-- leetllm: output:end -->

The lab returns the exact top-2 for these six vectors. Agreement on this query checks the example, not the correctness of all possible graph builds or large-scale recall. Nearest-only pruning can discard useful cross-cluster routes, which is one reason to use a maintained implementation for real indexes.

In the second graph, node 1 is farther from the query than entry node 0, but it is the only route to the true nearest node 2. With `ef=1`, it isn't admitted for expansion. With `ef=3`, it survives and reveals node 2. The beam budget buys exploration, not a certificate that every unexplored route is useless.

If you set `ef_search = 5` but ask for `k = 10`, this lab rejects the request. Hnswlib documents that `ef` must be at least `k`; other systems can raise the effective budget or return fewer results.[^hnswlibParameters2026][^pgvector_docs] Even a valid budget slightly larger than `k` can miss better neighbors outside the explored region.

> **Common mistake:** Setting `ef_search` from intuition rather than an evaluation curve. A small beam can miss true neighbors; an unnecessarily large beam spends latency without a useful recall gain. Measure `ef_search` values against exact top-`k` results on representative queries.

### Key parameters

`M`, `ef_construction`, and `ef_search` are the knobs that actually move recall, RAM, build time, and latency. Use the table as a starting map, then measure on your queries before copying a default.

| Parameter | Meaning | Example setting | Effect |
|-----------|---------|---------------|--------|
| `M` | Newly selected neighbors; commonly also the upper-layer cap | 16 | More links consume memory and may improve recall. |
| `M0` | Max neighbors on layer 0 (often `2*M`) | `2*M` | Denser base layer, better local connectivity, more memory. |
| `ef_construction` | Retained candidate count during insert | 200 | More exploration may improve graph quality at higher build cost. |
| `ef_search` | Retained candidate count during query | 64 for `k=10` | More exploration usually improves recall and costs latency. |
| `mL` | Controls the layer sampling distribution | $1/\ln(M)$ | Larger values put more nodes on upper layers and tend to increase maximum height. |

These settings illustrate separate controls, not recommended defaults. With the lab's sampling rule, the probability of reaching layer $\ell$ is $\exp(-\ell/m_L)$. Setting $m_L=1/\ln(M)$ gives probability $1/M$ of reaching layer 1.[^malkov2018]

At 4 bytes per packed neighbor ID, $M=16$ permits 128 bytes of layer-0 IDs beside a 1,536-dimensional float32 vector (6,144 bytes). Vectors dominate this **partial budget**. Upper-layer links, per-node headers, allocation, metadata, replicas, and retained originals add storage too. Graph links can become a large fraction after vector compression or with fewer dimensions.

<!-- leetllm: test, output=show -->
```python title="budget-hnsw-layer0-bytes.py"
def hnsw_layer0_bytes_per_vector(dimensions: int, M: int) -> dict[str, int]:
    vector = dimensions * 4
    neighbor_ids = (2 * M) * 4
    return {
        "vector": vector,
        "layer0_ids": neighbor_ids,
        "total": vector + neighbor_ids,
    }

budget = hnsw_layer0_bytes_per_vector(1536, 16)
print(f"float32 vector: {budget['vector']:,} bytes")
print(f"layer-0 ids at M=16: {budget['layer0_ids']:,} bytes")
print(f"vector share: {budget['vector'] / budget['total']:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
float32 vector: 6,144 bytes
layer-0 ids at M=16: 128 bytes
vector share: 98.0%
```
<!-- leetllm: output:end -->

`ef_search` can change at query time without rebuilding. Supplied measurements exercise the decision rule; benchmark libraries on the target machine to select the lowest-p95 setting meeting both constraints. The rule refuses to choose when no setting qualifies.

<!-- leetllm: test, output=show -->
```python title="select-hnsw-operating-point.py"
measurements = [
    {"ef_search": 24, "recall": 0.91, "p95_ms": 4.1},
    {"ef_search": 48, "recall": 0.97, "p95_ms": 6.8},
    {"ef_search": 96, "recall": 0.985, "p95_ms": 12.4},
]
required_recall = 0.96
latency_budget_ms = 10.0

eligible = [
    point for point in measurements
    if point["recall"] >= required_recall and point["p95_ms"] <= latency_budget_ms
]
if not eligible:
    raise RuntimeError("no tested setting meets both recall and latency constraints")
choice = min(eligible, key=lambda point: point["p95_ms"])
print(f"release ef_search={choice['ef_search']} recall={choice['recall']:.3f} p95_ms={choice['p95_ms']}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
release ef_search=48 recall=0.970 p95_ms=6.8
```
<!-- leetllm: output:end -->

Graph search assumes the working set can stay in memory and that links, not partitions, decide where to look. What if the corpus is large enough that you would rather open a few regions than walk a graph?

## IVF (Inverted File Index)

HNSW chooses where to search through graph links. IVF (Inverted File Index) makes that choice through coarse geometric space partitioning. Under Euclidean distance, $k$-means clustering partitions continuous space $\mathbb{R}^d$ into $K = \text{nlist}$ discrete **Voronoi cells**:

$$
V_i = \{x \in \mathbb{R}^d \mid ||x - c_i||^2 \le ||x - c_j||^2 \; \forall j \ne i\}
$$

Each cell is represented by its centroid $c_i$. Search evaluates query distance against these coarse centroids first, then opens only selected inverted posting lists.

### Centroids select lists

Ask the same question as before: where can we avoid work without losing the rollback runbook? If a true neighbor sits just across a partition boundary, opening only the closest partition will miss it completely. IVF protects against that miss by probing a configurable subset of coarse regions rather than committing to only one.

Training happens offline before serving begins. Run <span data-glossary="k-means">K-means clustering</span> on a representative sample of embeddings to learn $\text{nlist}$ cluster centroids. In Faiss terminology, those centroids form the coarse quantizer.

During indexing, choose a list ID $i(x) = \arg\min_j ||x - c_j||^2$ and append the record ID and representation to that list. The centroid is the vector $c_{i(x)}$, whereas the argmin returns an integer. Lists group IDs with full-precision vectors in IVF-Flat or compressed codes in IVF-PQ; their physical allocation and storage layout depend on the backend.

With a flat coarse quantizer, query $q$ scores all $\text{nlist}$ centroids ($O(\text{nlist} \cdot d)$ scalar work) and selects the closest $n_{\text{probe}}$ cells. Top-list selection doesn't require sorting every centroid. Search then scans the selected lists. Faiss also supports an HNSW approximate coarse quantizer, changing the routing cost and introducing possible centroid-search misses.[^faiss2026indexes]

IVF-Flat scores full-precision vectors inside the probed lists. IVF-PQ instead scores compressed codes using <span data-glossary="asymmetric-distance-computation">asymmetric distance computation (ADC)</span>.[^johnson2017]

<figure>
  <img src="illustrations/_generated/ivf_probe_flow_dark.png" alt="Equal-unit 2D plots show centroids C0=(0,0) and C1=(10,0), their Voronoi boundary x=5, query q=(4.9,0), and vectors v0=(0.2,0.1), v1=(0.4,-0.1), v2=(4.6,0), v3=(5.4,0), and v4=(9.8,0.2). Distances from q are 0.30 to v2, 0.50 to v3, and 4.50 to v1. Probing List 0 alone returns v2 and v1 for 1/2 exact top-two neighbors; probing both lists returns v2 and v3 for 2/2." />
  <figcaption>Both scatter windows use equal coordinate units; the right window magnifies x=4 to 6. The distance rail gives q–v₂ 0.30, q–v₃ 0.50, and q–v₁ 4.50. Probing List 0 returns v₂ and v₁, missing v₃ and reaching 1/2 exact top-two recall. Probing both lists returns v₂ and v₃. This hand-set example describes recall, not latency.</figcaption>
</figure>

### A worked example: counting comparisons

Suppose you have 1 million embeddings with 128 dimensions. Compare brute force against IVF with `nlist = 1,024` and `nprobe = 5`. Brute force performs $1{,}000{,}000$ distance computations per query.

IVF first scores its $1{,}024$ centroids. With balanced lists, each list averages $1{,}000{,}000 / 1{,}024 = 976.5625$ vectors, so five probes add about $5 \times 976.5625 \approx 4{,}883$ vector scores.

Together, centroid scoring and list scans cost roughly $5{,}907$ distance computations, about **169× fewer** than the flat scan. These counts describe arithmetic work. Measure request latency to estimate end-to-end speedup because list imbalance, batching, memory access, top-`k` selection, and hardware change the cost per score. Use `nlist = 1,024` as an example starting point and tune it on your data.

<!-- leetllm: test, output=show -->
```python title="estimate-ivf-probe-work.py"
def balanced_ivf_scores(total_vectors: int, nlist: int, nprobe: int) -> int:
    return nlist + round(total_vectors / nlist * nprobe)

total_vectors = 1_000_000
nlist = 1_024
nprobe = 5
estimated_scores = balanced_ivf_scores(total_vectors, nlist, nprobe)

print(f"flat vector scores: {total_vectors:,}")
print(f"balanced IVF vector and centroid scores: {estimated_scores:,}")
print(f"estimated reduction: {total_vectors / estimated_scores:.1f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
flat vector scores: 1,000,000
balanced IVF vector and centroid scores: 5,907
estimated reduction: 169.3x
```
<!-- leetllm: output:end -->

### A boundary miss: `nprobe = 1` drops a true neighbor

When `nprobe = 1`, query `(4.9, 0)` is closer to centroid 0, so only list 0 opens. Vector 3 at `(5.4, 0)` is the true second neighbor, but it lives in list 1 and stays invisible until both lists are probed.

The example uses two hand-set centroids: payments-like vectors near the origin and <span data-glossary="gpu">GPU</span>-like vectors near `(10, 0)`. It isolates the failure mode without hiding it behind clustering noise.

Faiss's `IndexIVFFlat` is the production form of this loop: train centroids, assign inverted lists, then search with `nprobe`.[^johnson2017]

<!-- leetllm: test, output=show -->
```python title="ivf-nprobe-boundary-miss.py"
def squared_l2(left: tuple[float, ...], right: tuple[float, ...]) -> float:
    return sum((a - b) ** 2 for a, b in zip(left, right))


centroids = {0: (0.0, 0.0), 1: (10.0, 0.0)}
vectors = {
    0: (0.2, 0.1),
    1: (0.4, -0.1),
    2: (4.6, 0.0),
    3: (5.4, 0.0),
    4: (9.8, 0.2),
}


def nearest_centroid(vector: tuple[float, ...]) -> int:
    return min(centroids, key=lambda cid: squared_l2(vector, centroids[cid]))


inverted_lists: dict[int, list[int]] = {0: [], 1: []}
for vector_id, vector in vectors.items():
    inverted_lists[nearest_centroid(vector)].append(vector_id)


def ivf_search(query: tuple[float, ...], nprobe: int, k: int = 2) -> tuple[list[int], list[int]]:
    if not 1 <= nprobe <= len(centroids) or k < 1:
        raise ValueError("require 1 <= nprobe <= nlist and k >= 1")
    ranked_lists = sorted(centroids, key=lambda cid: squared_l2(query, centroids[cid]))[:nprobe]
    scored: list[tuple[float, int]] = []
    for list_id in ranked_lists:
        for vector_id in inverted_lists[list_id]:
            scored.append((squared_l2(query, vectors[vector_id]), vector_id))
    scored.sort()
    return [vector_id for _, vector_id in scored[:k]], ranked_lists


query = (4.9, 0.0)
exact = sorted(vectors, key=lambda vid: squared_l2(query, vectors[vid]))[:2]
nprobe_1, lists_1 = ivf_search(query, nprobe=1)
nprobe_2, lists_2 = ivf_search(query, nprobe=2)

print(f"inverted lists: {inverted_lists}")
print(f"exact top-2: {exact}")
print(f"nprobe=1 lists {lists_1} -> {nprobe_1}")
print(f"nprobe=2 lists {lists_2} -> {nprobe_2}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
inverted lists: {0: [0, 1, 2], 1: [3, 4]}
exact top-2: [2, 3]
nprobe=1 lists [0] -> [2, 1]
nprobe=2 lists [0, 1] -> [2, 3]
```
<!-- leetllm: output:end -->

`nprobe` is the main query-time knob. With balanced lists, the scanned fraction is about `nprobe / nlist`. Adding lists adds candidates. For IVF-Flat with exact centroid ordering, nested probed sets, consistent ties, and no other scan limit, this can't lower ANN recall. With PQ scoring, however, extra candidates can displace a true neighbor through quantization errors; final recall against originals does not need to rise monotonically.

Scanning every list makes IVF-Flat exhaustive when no other scan limit is active. It doesn't make IVF-PQ exact against the original vectors: quantization still changes scores. A larger list budget repairs partition misses, not information lost in compression.

| `nprobe` regime | What gets scanned | Practical effect |
|-----------------|-------------------|------------------|
| Very small (`1` to a few lists) | Only the closest coarse cells | Less scan work, greater exposure to partition misses. |
| Moderate | A small fraction of the database | Candidate settings to test against recall and latency constraints. |
| Large (`nprobe` close to `nlist`) | Most or all inverted lists | Approaches exhaustive search and often loses the speed advantage. |

```checkpoint
Why does increasing `nprobe` usually improve IVF recall while increasing query work?
---
IVF scores vectors only inside selected lists. Probing more lists gives the search more chances to inspect a true neighbor that landed outside the closest centroid's cell, but each added list contributes more candidate vectors to score.
```

### Distance metrics

Before comparing index families, fix the ranking rule. The same stored vectors can produce a different neighbor order when magnitude matters, so changing the metric changes both search and any IVF centroids trained for it. Faiss supports L2 and inner product across its main ANN indexes; cosine similarity can use normalized vectors with inner product search.[^faissMetrics2026]

L2 distance measures straight-line separation. Faiss returns **squared** L2 distance, avoiding the square root without changing the ordering. Choose the metric expected by the embedding model, not a rule that all semantic search must use cosine.

Inner product (IP) ranks by maximum <span data-glossary="dot-product">dot-product</span>. Query norm doesn't affect ranking, but database vector norms do, so large-norm items can dominate if that's how the embeddings behave.

<span data-glossary="cosine-similarity">Cosine similarity</span> ignores magnitude and keeps only direction. Normalize both database and query vectors, then use inner product search. On normalized vectors, L2 and inner product give equivalent rankings because $||x-y||^2 = 2 - 2\langle x, y \rangle$.

| Metric | What it measures | Best when | IVF training consideration |
|--------|------------------|-----------|---------------------|
| L2 (Euclidean) | Straight-line distance in space | Magnitude carries signal | Train for the intended L2 geometry |
| Inner product | $x \cdot y$ | You want maximum dot-product ranking | Train/configure coarse routing for IP |
| Cosine | Direction only, no magnitude | The model expects angular similarity | Retrain if moving from raw-vector geometry |

If you move from raw L2 geometry to cosine, normalize the training and stored vectors and retrain the coarse quantizer. A metric-name change alone doesn't logically require retraining: normalized L2 and IP give equivalent rankings when both operands are unit vectors. But unit database vectors don't imply unit centroids. Check coarse routing, centroid normalization, and any compressed scoring as well as final-vector ranking before reusing an index.

<!-- leetllm: test, output=show -->
```python title="verify-cosine-inner-product-ranking.py"
import math


def normalize(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0 or not math.isfinite(norm):
        raise ValueError("cosine requires a finite nonzero vector")
    return [value / norm for value in vector]


vectors = [[3.0, 0.0], [1.0, 1.0], [0.0, 2.0]]
query = [1.0, 0.8]
normalized_vectors = [normalize(vector) for vector in vectors]
normalized_query = normalize(query)
inner_product = [
    sum(left * right for left, right in zip(vector, normalized_query))
    for vector in normalized_vectors
]
l2 = [
    sum((left - right) ** 2 for left, right in zip(vector, normalized_query))
    for vector in normalized_vectors
]

print(f"inner-product rank: {sorted(range(3), key=lambda i: -inner_product[i])}")
print(f"L2 rank after normalization: {sorted(range(3), key=lambda i: l2[i])}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
inner-product rank: [1, 0, 2]
L2 rank after normalization: [1, 0, 2]
```
<!-- leetllm: output:end -->

### HNSW vs IVF

| Feature | HNSW | IVF-Flat |
|---------|------|----------|
| **Category** | Proximity graph | Clustering / inverted file |
| **Search cost** | Empirically sublinear on suitable well-built graphs; benchmark on your data | Centroid scoring plus scanning roughly `nprobe / nlist` of the data if lists are balanced |
| **Memory** | Raw vectors plus about $2M$ layer-0 neighbor ids | Raw vectors plus ids; no graph overlay |
| **Training step** | None | Required to learn centroids |
| **Index updates** | Inserts are natural; deletes are implementation-specific | Inserts are easy, but centroid quality can drift over time |
| **Recall** | Often strong at a fixed in-RAM latency budget; workload dependent | Tunable via `nprobe`; workload dependent |
| **Build work** | Incremental graph searches and link selection | Centroid training, assignment, and list writes |
| **Best for** | Low-latency, high-recall search in RAM | Large datasets where you want a controllable scan fraction or a base for PQ |

IVF requires a **training step** on representative data before indexing. If the vector distribution drifts, stale centroids can unbalance lists or lower recall. Retraining means reassigning and rebuilding the index, not only replacing centroid coordinates. Uncompressed HNSW has no codebook-training step, but insertion order and graph quality still affect recall.

Graph search and compression aren't mutually exclusive. Faiss exposes `IndexHNSWFlat`, `IndexHNSWSQ`, and `IndexHNSWPQ`; compressed variants introduce their own training and accuracy trade-offs.[^faiss2026indexes] The table compares HNSW with raw storage against IVF-Flat, not every possible encoding.

Both of those designs still store the original vectors. At a billion records, where does that storage go?

## Product Quantization (PQ)

Neither HNSW's links nor IVF-Flat's partitions remove the raw vectors. For a separate capacity exercise, use a 768-dimensional embedding model and one billion records. This changes the dimension from the earlier 1,536-dimensional example; changing embedding dimensions requires re-embedding the corpus and rebuilding the index.

$$
10^9 \text{ vectors} \times 768 \text{ dims} \times 4 \text{ bytes} \approx 3 \text{ TB raw vector storage}
$$

One billion vectors at 768 float32 dimensions need about 3 TB of raw vector storage alone. Add index overhead, operating-system buffers, and application memory on top of that.

```checkpoint
You want 1B float32 vectors resident on one 128 GB node, but their raw representations need terabytes. What must product quantization buy you first?
---
It must buy enough memory reduction to fit the chosen representations and overhead. Compact centroid IDs can make many more vectors resident. Benchmark query speed and total RAM use for the chosen representation.
```

Product Quantization (PQ) compresses vectors by breaking them into smaller chunks and quantizing those chunks independently.[^jegou2011] Combined with IVF, PQ is one established way to make billion-point memory budgets tractable; whether a deployment also needs sharding depends on code size, metadata, throughput, and availability requirements.

### The algorithm

Product <span data-glossary="quantization">quantization</span> splits coordinates into disjoint subspaces and quantizes each separately.[^jegou2011] This factorizes the representation; the data's chunks need not be statistically independent. With 96 sub-codebooks of 256 entries, the Cartesian product has $256^{96} = 2^{768}$ possible reconstructed vectors, using only $96 \times 256$ stored sub-centroids. A flat codebook explicitly storing all those combinations would be impractical. Measure how accurately that product represents your data.

Decompose a $d$-dimensional vector $x \in \mathbb{R}^d$ into $m$ equal subvectors:

$$
x = [u_1, u_2, \dots, u_m], \quad u_j \in \mathbb{R}^{d^*}, \quad d^* = d / m
$$

For a 768-dimensional embedding with $m = 96$, each subvector has dimension $d^* = 768 / 96 = 8$.

Next, cluster each subspace separately. Run $k$-means on training data to learn a codebook $C_j$ of $K^* = 256$ centroids for each subspace. Why exactly 256 centroids? Because $256 = 2^8$. An integer index in $[0, 255]$ fits into a single unsigned 8-bit byte (`uint8`).

Finally, map each subvector $u_j$ to the index of its nearest centroid in codebook $C_j$:

$$
\text{code}_j(x) = \arg\min_{k \in \{0, \dots, 255\}} ||u_j - c_{j, k}||^2
$$

The original 768-dimensional float32 vector (3,072 bytes) becomes $m = 96$ single-byte IDs: **32× compression** for the code alone. These 96 float32 codebooks consume $96 \times 256 \times 8 \times 4 = 786{,}432$ bytes, or 768 KiB, shared across records in this setup.

In L2 IVF-PQ, codes normally represent the **residual** $r = x - c_{\text{list}}$.[^faiss2026ImplementationNotes] The coarse centroid captures part of the vector, leaving PQ to encode deviations within lists. This can improve reconstruction at a given code budget. Translating a distribution and its codebook together leaves reconstruction error unchanged; measure error after quantization to evaluate an actual change.

<figure>
  <img src="illustrations/_generated/pq_encoding_pipeline_dark.png" alt="Product quantization splits a 768-dimensional float32 vector into 96 eight-dimensional subvectors. Each subvector maps to one of 256 centroids in its own codebook and contributes one byte. The code-row example maps the first subvector to centroid ID 42 and writes one uint8 code byte per subspace. The 96-byte code is 32 times smaller than the 3,072-byte raw vector, for code storage alone. At query time, an uncompressed query builds a 96 by 256 float32 distance table. Each byte selects one entry per subspace, and 96 selected distances are summed without reconstructing the full vector." />
  <figcaption>The highlighted codebook and lookup-table entries show indexing structure; centroid ID 42 indexes the first subspace codebook while the remaining 95 bytes index their respective subspaces. The first byte selects T[0,42], with one analogous lookup for each of the other 95 subspaces. Codebooks are shared across vectors; the query table is built per query. Code-only compression excludes index overhead.</figcaption>
</figure>

With 256 centroids, an ID requires one byte ($2^8 = 256$). The 3,072-byte vector becomes 96 single-byte IDs: **32× compression** for the code alone. Record IDs, coarse centroids, and other index state add separate overhead.

<!-- leetllm: test, output=show -->
```python title="budget-pq-code-storage.py"
def bytes_per_raw_vector(dimensions: int) -> int:
    return dimensions * 4

def bytes_per_pq_code(chunks: int, bits_per_chunk: int = 8) -> int:
    return (chunks * bits_per_chunk + 7) // 8

raw_bytes = bytes_per_raw_vector(768)
code_bytes = bytes_per_pq_code(96)
ivf_pq_bytes_with_id = code_bytes + 8

print(f"raw vector bytes: {raw_bytes}")
print(f"PQ code bytes: {code_bytes}")
print(f"IVF-PQ code plus 64-bit id bytes: {ivf_pq_bytes_with_id}")
print(f"raw-to-code compression: {raw_bytes / code_bytes:.0f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw vector bytes: 3072
PQ code bytes: 96
IVF-PQ code plus 64-bit id bytes: 104
raw-to-code compression: 32x
```
<!-- leetllm: output:end -->

### OPQ: rotating before you split

Plain PQ has a weakness: it splits dimensions into fixed contiguous chunks. If the <span data-glossary="variance">variance</span> in your embeddings is unevenly spread across dimensions, some subspaces carry most of the signal while others are nearly constant. Their codebooks spend centroids on uninformative directions.

**Optimized Product Quantization (OPQ)** learns an orthogonal rotation <span data-glossary="matrix">matrix</span> $R$ together with the codebooks to reduce reconstruction error.[^ge2013] Rotating can improve how information is distributed across chunks, but balancing variance alone isn't the full optimization objective. A square orthogonal rotation preserves L2 distances: it adds a matrix multiply without losing information before quantization.

In Faiss you can request `OPQ96,IVF4096,PQ96` to retain the original dimension, or `OPQ96_384,IVF4096,PQ96` to output 384 dimensions, with 4 dimensions per chunk.[^faissIndexFactory2026] The dimension-reducing version is a projection: unlike a square orthogonal rotation, it can lose information and doesn't preserve all original L2 distances. Both transform stored vectors as well as queries. Benchmark OPQ at the same code size; its benefit depends on the distribution and training sample.

### Asymmetric distance computation (ADC)

How can search score compressed PQ codes without first reconstructing each full vector? Reconstruction is possible, but adds work that the product structure lets us avoid.

That shortcut is **asymmetric distance computation (ADC)**. The query $q$ stays uncompressed. The database vectors stay compressed as $m$-byte codes.

When query $q$ arrives:
1. Slice $q$ into $m$ subvectors: $[q_1, q_2, \dots, q_m]$.
2. Precompute a distance lookup table (LUT) of shape $m \times 256$, where cell $(j, k)$ stores the squared distance between query subvector $q_j$ and centroid $k$ of codebook $C_j$:

$$
T[j][k] = ||q_j - c_{j, k}||^2 \quad \text{for } j \in \{1, \dots, m\}, \; k \in \{0, \dots, 255\}
$$

With float32 entries, the table occupies $m \times 256 \times 4$ bytes. For $m=96$, that is 98,304 bytes, exactly **96 KiB**. It can fit in some CPU caches; capacity, competing working sets, access patterns, and implementation determine actual residency. Additional precomputed IVF-PQ tables can be much larger.[^faiss2026ImplementationNotes]

Now, to score any stored database vector $y$ encoded as $[c_1, c_2, \dots, c_m]$, the squared Euclidean distance is:

$$
d(q, y)^2 \approx d(q, C(y))^2 = \sum_{j=1}^{m} T[j][c_j]
$$

After table construction, the basic score uses $m$ indexed floating-point distances and $O(m)$ additions, plus reading the byte-sized codes. It needs no full-vector reconstruction or per-coordinate multiplication in that loop. The **indices** are bytes; the ordinary table **values** aren't. Specialized kernels may use different table representations, and this operation count doesn't promise cache hits or a particular speedup.

For L2 IVF-PQ, Faiss normally encodes the *residual* after subtracting the coarse centroid.[^faiss2026ImplementationNotes] ADC compares the query residual $(q - c_{\text{list}})$ with those codes; optimized implementations can combine precomputed terms instead of rebuilding every table from scratch. The lab uses non-residual PQ and floating-point distances, not Hamming distance between codes.

```checkpoint
Which work does ADC move out of the per-vector scoring loop?
---
It precomputes query-to-sub-centroid distances, then sums indexed table entries for each code. This avoids repeatedly reconstructing all coordinates and recomputing their squared differences. In residual IVF-PQ, tables or equivalent precomputed terms depend on the coarse list too. Memory size and operation counts still need a benchmark to become latency claims.
```

<!-- leetllm: test, output=show -->
```python title="asymmetric-distance-computation-adc.py"
def squared_l2(left: list[float], right: list[float]) -> float:
    return sum((a - b) ** 2 for a, b in zip(left, right))


def adc_pq_search(
    query: list[float],
    pq_codes: list[list[int]],
    codebooks: list[list[list[float]]],
    k: int = 2,
) -> list[int]:
    subspaces = len(codebooks)
    if not subspaces or not query or len(query) % subspaces:
        raise ValueError("query dimensions must split evenly into nonempty subspaces")
    dim_per_chunk = len(query) // subspaces
    if k < 1 or any(not book for book in codebooks):
        raise ValueError("require k >= 1 and nonempty codebooks")
    if any(len(centroid) != dim_per_chunk for book in codebooks for centroid in book):
        raise ValueError("codebook centroid has the wrong chunk dimension")
    if any(len(row) != subspaces for row in pq_codes):
        raise ValueError("each code needs one ID per subspace")
    if any(code < 0 or code >= len(codebooks[j]) for row in pq_codes for j, code in enumerate(row)):
        raise ValueError("code ID is outside its codebook")
    tables = []
    for index, codebook in enumerate(codebooks):
        query_chunk = query[index * dim_per_chunk : (index + 1) * dim_per_chunk]
        tables.append([squared_l2(query_chunk, centroid) for centroid in codebook])

    distances = []
    for row in pq_codes:
        distances.append(sum(tables[index][code] for index, code in enumerate(row)))
    ranked = sorted(range(len(pq_codes)), key=lambda vector_id: (distances[vector_id], vector_id))
    return ranked[:k]


query = [0.0, 0.0, 0.0, 0.0]
codebooks = [
    [[0.0, 0.0], [2.0, 0.0], [0.0, 2.0], [2.0, 2.0]],
    [[0.0, 0.0], [2.0, 0.0], [0.0, 2.0], [2.0, 2.0]],
]
pq_codes = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
]

print(f"nearest ids: {adc_pq_search(query, pq_codes, codebooks, k=2)}")
reconstructed = [
    [value for j, code in enumerate(row) for value in codebooks[j][code]]
    for row in pq_codes
]
print(f"reconstructed squared distances: {[squared_l2(query, row) for row in reconstructed]}")

collision_query = [0.9, 0.0, 0.0, 0.0]
originals = [[0.1, 0.0, 0.0, 0.0], [0.9, 0.0, 0.0, 0.0]]
# Both originals map to centroid 0 in each chunk of these codebooks.
same_codes = [[0, 0], [0, 0]]
compressed_top_1 = adc_pq_search(collision_query, same_codes, codebooks, k=1)
exact_top_1 = sorted(range(2), key=lambda i: squared_l2(collision_query, originals[i]))[:1]
reranked_top_1 = sorted(compressed_top_1, key=lambda i: squared_l2(collision_query, originals[i]))[:1]
overfetched = adc_pq_search(collision_query, same_codes, codebooks, k=2)
reranked_top_2 = sorted(overfetched, key=lambda i: squared_l2(collision_query, originals[i]))[:1]
print(f"same-code compressed top-1: {compressed_top_1}")
print(f"original-vector top-1: {exact_top_1}")
print(f"rerank retrieved top-1: {reranked_top_1}")
print(f"rerank overfetched top-2 to top-1: {reranked_top_2}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
nearest ids: [0, 1]
reconstructed squared distances: [0.0, 4.0, 4.0, 8.0]
same-code compressed top-1: [0]
original-vector top-1: [1]
rerank retrieved top-1: [0]
rerank overfetched top-2 to top-1: [1]
```
<!-- leetllm: output:end -->

IDs 1 and 2 tie at squared distance 4, so the lab breaks that tie by ID. These are exact distances to the **reconstructed** vectors; original embeddings can have different distances. Two different originals can receive the same PQ code and become indistinguishable. Full-precision reranking can repair their order only if both survived candidate retrieval and their originals are available.

Compression and graph search still assume the query may look at the whole corpus. What happens when the operator may see only EU runbooks from the last 30 days?

## Filtered search

An index can deliver 99% recall on unfiltered queries and still miss the eligible runbook once access controls or business metadata narrow the candidate pool. Suppose a support assistant queries: "runbooks like this incident, but only from the last 30 days and restricted to the EU region." Before choosing a filter strategy, predict the failure: will the filter shrink work, starve the candidate buffer, or sever graph routes needed to reach valid documents? Three strategies make that trade-off concrete.

**Filter then exact scan:** Resolve the predicate, perhaps through a metadata index, then score all eligible vectors. A 200-record subset needs far less distance work than a 10-million-record subset; neither count specifies milliseconds. This is one form of pre-filtering, but the term also covers filtered ANN. Removing every disallowed node from graph traversal can sever routes to eligible nodes, so a small eligible subset doesn't automatically imply good graph-search recall.

**Post-filtering:** Retrieve an ANN buffer of size $L$, then discard nonmatches. This can cause **buffer starvation**. Under independent Bernoulli selectivity $s=0.005$ across $L=100$ retrieved candidates, linearity of expectation gives: Evaluating $L \cdot s$ directly yields:

$$
E[M] = L \cdot s = 100 \times 0.005 = 0.5
$$

If those match indicators are also independent, the probability of an empty buffer is:

$$
P(M = 0) = (1 - s)^L = (0.995)^{100} \approx 60.6\%
$$

That 60.6% is a model prediction, not an observed query rate. Global metadata selectivity does not necessarily equal selectivity near a query, and neighboring candidates' metadata can be correlated. Even within this model, the buffer can contain more than two matches; low expectation isn't a maximum.

Compare two distributions with the **same** expected count. In the second, the entire buffer shares one matching indicator: either all 100 match, or none do.

<!-- leetllm: test, output=show -->
```python title="filter-expectation-is-not-empty-probability.py"
L = 100
s = 0.005
print(f"expected matches in either model: {L * s:.2f}")
print(f"independent-candidate empty probability: {(1 - s) ** L:.1%}")
print(f"fully correlated empty probability: {1 - s:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
expected matches in either model: 0.50
independent-candidate empty probability: 60.6%
fully correlated empty probability: 99.5%
```
<!-- leetllm: output:end -->

pgvector supports iterative ANN scans that expand exploration until enough results are found or configured scan/resource limits are reached. Relevant controls include `hnsw.max_scan_tuples`, `hnsw.scan_mem_multiplier`, and `ivfflat.max_probes`; these aren't automatic latency deadlines. Its HNSW iterative scan supports strict or relaxed ordering, while IVFFlat supports relaxed ordering.[^pgvector_docs] Check the current version's supported modes and measure filtered recall separately.

**Filter-aware graph traversal:** An allow-list identifies eligible results while traversal retains ways to reach them. <span data-glossary="weaviate">Weaviate</span>'s sweeping strategy can traverse disallowed nodes without returning them. Its custom **ACORN**, inspired by the research algorithm, instead skips distance evaluations for nonmatches and uses multi-hop traversal plus eligible entry points to find matching regions.[^patel2024acorn][^weaviate_filter_docs] The documentation checked September 22, 2026 names ACORN the default since v1.34. These are different search strategies; neither guarantees high recall for every filtered workload.

Filter placement changes which work is done before scoring and which candidates can reach the result set:

<figure>
  <img src="illustrations/_generated/filtered_search_boundary_dark.png" alt="Inside a trusted retrieval boundary, the first three candidates are eu-1, us-1, and us-2. Applying region=EU before returning k=2 leaves only eu-1, so the response is underfilled at 1/2. Scanning all five article fixture candidates adds us-3 and eu-2; the same filter then returns eu-1 and eu-2 for 2/2. Only filtered eligible rows cross to the application." />
  <figcaption>A deterministic fixture shows candidate-window underfill: the first three records contain one EU row, while the full five contain two. The filter stays inside the trusted retrieval boundary; only eligible top-k rows reach the application. This illustration demonstrates candidate coverage, not a security guarantee or measured retrieval performance.</figcaption>
</figure>

Authorization must be enforced inside a **trusted boundary**, independently of the retrieval strategy. Database-side post-filtering is safe if unauthorized rows never leave that boundary. App-side filtering after fetching privileged text can expose it to logs, traces, caches, or partial failures. Graph traversal may inspect disallowed vectors internally without returning them; that isn't the same as granting the application access. [RAG Security & Access Control](/learn/enterprise-rag-security-rbac-access-control) develops that distinction.

<!-- leetllm: test, output=show -->
```python title="show-post-filter-underfill.py"
candidate_ids = ["eu-1", "us-1", "us-2", "us-3", "eu-2"]
region = {"eu-1": "eu", "us-1": "us", "us-2": "us", "us-3": "us", "eu-2": "eu"}

def post_filter(candidates: list[str], required_region: str, k: int) -> list[str]:
    return [item for item in candidates if region[item] == required_region][:k]

initial_candidates = candidate_ids[:3]
expanded_candidates = candidate_ids

print(f"initial result: {post_filter(initial_candidates, 'eu', k=2)}")
print(f"expanded result: {post_filter(expanded_candidates, 'eu', k=2)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
initial result: ['eu-1']
expanded result: ['eu-1', 'eu-2']
```
<!-- leetllm: output:end -->

```checkpoint
Why can a selective filter make post-filtering return fewer than k results?
---
Post-filtering drops non-matches from a limited candidate buffer. Expanding the search or using filter-aware traversal can help, but neither guarantees k results under a finite budget. First check whether at least k eligible records exist. Measure recall against exact top-k within that eligible set, not against the unrestricted ranking.
```

## Four questions before choosing a database

When you evaluate a vector database, ask four questions that survive vendor churn. Each one connects an index choice to an operating constraint:

1. Which ANN families are exposed: HNSW, IVF, PQ, disk-backed graphs, or a managed index whose internals aren't exposed?
2. How does filtered search work: before search, after search, or during traversal?
3. Where does the index body live: RAM, SSD, or object storage?
4. Which compression knobs are available, and what recall do they cost?

Product names change faster than these four constraints. As a working heuristic, **Postgres-style extensions** expose a small set of explicit index types such as HNSW or IVFFlat inside <span data-glossary="sql">SQL</span> workflows.

**General-purpose vector databases** often center HNSW for RAM-resident search, then layer in quantization and filter-aware traversal. Include filtered-search behavior in index evaluation.

**Faiss and Faiss-derived stacks** expose broad ANN menus, which shifts more tuning responsibility onto the engineer. The freedom is useful when you can own benchmarking and deployment decisions.

**Storage-first systems** move more bytes out of RAM and onto SSD or object storage. Measure storage cost and I/O latency together to calculate total serving cost.

These questions lead to a workload decision: **HNSW is a candidate when the working set fits in memory and you do not want a centroid-training step**, while **IVF and PQ are candidates when scan fraction or bytes per vector become central constraints**. Choose from measured recall, tail latency, build/update cost, and memory on your workload.

Those choices still assume one machine can hold the index. What changes when the rollback corpus no longer fits in RAM?

## Scaling to billions

When the rollback corpus grows past RAM, two budgets compete: compress the vectors, or move most of the index body to storage. A billion-vector incident-search platform might compress each trace-summary vector with PQ, keep a sparse graph in memory, or compare both against a sharded design. The right branch depends on bytes, recall, and tail latency together.

### 1. Hybrid approaches (IVF-PQ)
Combining IVF (to reduce search scope) and PQ (to compress vectors) targets both budgets. In Faiss, `IndexIVFPQ` stores `ceil(m_pq * nbits / 8) + 8` bytes per vector for the code and 64-bit record ID.[^faiss2026indexes] A 32-byte code therefore uses about 40 GB for 1B records before shared codebooks and other overhead. The earlier 96-byte code instead needs about 104 GB including IDs. Smaller codes buy capacity at a potentially larger quantization error.

### 2. Disk-based indexes (DiskANN)
Microsoft's **DiskANN**[^subramanya2019] keeps a compact in-memory structure and places the large graph body on SSD. The graph is still navigational, but its layout is optimized for storage access rather than assuming every edge traversal hits RAM. Search quality therefore depends on read amplification and layout as well as graph degree and beam width.

The NeurIPS 2019 paper abstract reports `>5000` queries per second, `<3 ms` mean latency, and `95%+ 1-recall@1` on SIFT1B on a 16-core machine with 64 GB RAM plus SSD. Those measurements describe that SIFT1B setup; benchmark your embedding workload on its target hardware.

### 3. Distributed sharding

Horizontal sharding can divide storage and query work across machines. It also changes result completeness and latency. The full-fan-out design below is one possible architecture; real services may route to selected partitions or replicas rather than broadcasting every query everywhere.

<figure>
  <img src="illustrations/_generated/scatter_gather_topk_dark.png" alt="Constructed four-shard timeline on one shared 0–95 ms axis. Shard 1 returns five candidates at 44 ms, Shard 2 at 58 ms, Shard 3 at 86 ms, and Shard 4 at 51 ms. The slowest response arrives at 86 ms; a separate 3 ms merge ends at 89 ms. Each shard contributes five local candidates, for 20 IDs to rank by comparable scores and reduce to a global top five. Fan-out latency is governed by the slowest shard response plus coordinator merge time." />
  <figcaption>One constructed request, not a p99 measurement. All four shard paths share one elapsed-time axis; the final 3 ms merge starts only after the 86 ms response. The 20 candidates need comparable scores, and ANN misses survive the merge.</figcaption>
</figure>

Suppose the corpus is split across $S$ disjoint shards. This example runs two phases:

1. **Scatter:** A coordinator sends the query and candidate cutoff to every shard. Each searches its local index and returns a ranked list of IDs and scores. Choose a local cutoff $L \ge K$ if later reranking needs an overfetched buffer.
2. **Gather:** Merge the $S$ sorted lists using comparable scores, keeping the best $K$. This is an **$S$-way merge**, because $S$ is the number of input streams. With overfetching, the coordinator can fetch originals for the $S L$ candidates and rerank before cutting to $K$. Different PQ codebooks introduce different score errors; fetch original vectors and rerank when exact ordering matters.

For disjoint shards using the same exact metric, vector representation, and tie order, local top-$K$ sets suffice: an omitted item already has $K$ predecessors on its own shard, so it can't enter the global top-$K$. This proof assumes every required shard responds. With ANN, a coordinator can't recover locally missed candidates. Exact reranking only repairs the order of candidates it receives; overfetching can improve coverage, though a finite pool may still omit the global neighbors. Deduplication or document grouping can also require more than $K$ local results.

Waiting for all shards can amplify latency tails. Let $T_i$ measure each response's elapsed time from a common fan-out start, including its network round trip. Let $T_{\text{merge}}$ be the final reduction work done *after* the last response. Then:

$$
T_{\text{query}} \ge \max(T_1, T_2, \dots, T_S) + T_{\text{merge}}
$$

Streaming can overlap earlier merge work with arrivals; only the remaining work belongs in that final term. To reason about tails, use a **time threshold** $t_{99}$ such that each shard's latency distribution satisfies $P(T_i \le t_{99})=0.99$. The probability 0.99 is dimensionless; $t_{99}$ is measured in time. If shard latencies are independent:

$$
P\!\left(\max_i T_i \le t_{99}\right) = \prod_{i=1}^{S} P(T_i \le t_{99}) = (0.99)^S
$$

Under that model, four shards meet the single-shard threshold 96.1% of the time; twenty meet it 81.8% of the time, before merge overhead. For independent identically distributed shard latencies, a cluster's 99th percentile of the maximum corresponds to single-shard CDF value $0.99^{1/S}$. With twenty shards, that's about the **99.95th percentile**, not the 99.9th. Perfectly correlated latencies instead meet the common threshold 99% of the time. Shared infrastructure makes the dependence an empirical question.

<!-- leetllm: test, output=show -->
```python title="independent-shard-tail-probabilities.py"
for shards in (4, 20):
    print(f"{shards} independent shards within single-shard t99: {0.99 ** shards:.1%}")
print(f"single-shard percentile for 20-shard maximum p99: {100 * 0.99 ** (1 / 20):.4f}%")
print(f"perfectly correlated shards within common t99: {0.99:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
4 independent shards within single-shard t99: 96.1%
20 independent shards within single-shard t99: 81.8%
single-shard percentile for 20-shard maximum p99: 99.9498%
perfectly correlated shards within common t99: 99.0%
```
<!-- leetllm: output:end -->

```checkpoint
Why can't we predict a real twenty-shard service's empty-buffer or latency-tail rate from a marginal probability alone?
---
The formulas for an empty filtered buffer and an all-shards-on-time response multiply probabilities only under independence. Correlated metadata or shard delays change those rates even when the marginal probabilities stay fixed. Measure the joint behavior on representative queries and load.
```

Hedged requests send a backup to another replica after a chosen delay. Tune that delay against measured latency and extra load rather than prescribing p95 universally. Per-shard deadlines can bound waiting, but missing-shard responses must be identified as partial; they no longer carry the exact global-top-$K$ guarantee.

## When vector indexes break

Most failures announce themselves as one of three symptoms: recall drops after the data or metric changes, results underfill after filtering or deletes, or p99 rises while local work looks healthy. Use the table to connect each symptom to the budget that moved and the evidence needed before changing a knob.

| Symptom | Possible cause | Next check or change |
|---|---|---|
| IVF recall drops after a data shift | centroids no longer represent new embeddings | retrain on representative data and gate on held-out recall@k |
| HNSW causes out-of-memory failures | raw vectors (plus graph ids and allocator overhead) exceed budget | measure bytes per vector at production settings; evaluate PQ or IVF-PQ before blaming graph degree |
| Search is fast but misses neighbors | a small search budget, compressed-score errors, or inconsistent metric/filter settings | verify the baseline, then separate candidate-coverage loss from reranking error before tuning |
| Cosine migration breaks IVF recall | old coarse quantizer was trained in raw L2 geometry | normalize training, database, and query vectors; retrain centroids |
| Deletes create stale hits or recall holes | implementation-specific tombstones, dead tuples, or stale replicas | test visibility and recall after deletes; use the system's supported cleanup or rebuild path |
| More shards worsen p99 | full fan-out waits for slowest shard and merge | measure tail latency and routing overhead, not local shard latency alone |

## Index family trade-offs

| Index family | Core idea | Main strength | Main cost | Reach for it when |
|--------------|-----------|---------------|-----------|-------------------|
| **HNSW** | Hierarchical proximity graph | Often strong in-RAM recall/latency behavior | Build time, delete behavior, and raw-vector RAM | Low latency matters, the working set's float32 vectors fit in RAM, and evaluation supports it |
| **IVF-Flat** | Coarse partitioning plus exact scan inside probed lists | Simple and tunable | Needs training and still stores raw vectors | You want controllable scan fraction without graph complexity |
| **IVF-PQ** | IVF plus compressed vector codes | Much lower bytes per vector | Quantization error and more tuning | Memory cost dominates and some recall loss is acceptable |
| **DiskANN** | SSD-backed graph index | Single-node scale beyond RAM | Storage-aware engineering complexity | The dataset is larger than RAM but one fast SSD-backed node is still attractive |

Evaluate **HNSW** when you can afford RAM and need low-latency high-recall retrieval. Evaluate **IVF-PQ** when raw vector storage becomes the bottleneck. Consider **DiskANN**-style systems when a graph index remains attractive but the index body no longer fits in memory. In each case, release from a recall-and-latency curve measured on representative queries.

## Release from a measured index frontier

### Replay metric migration and deletion with Faiss

The earlier loops expose algorithm mechanics. This CPU replay uses Faiss's maintained API on two authored vectors, with explicit record IDs. It checks result identity, not latency or semantic relevance.[^faiss2026indexes][^faissMetrics2026]

Under raw L2, `[1, 1]` is closer to `[1, 0.1]` than `[10, 0]`. Under cosine, `[10, 0]` points more closely along the query's direction. Reusing an old raw-vector index while normalizing only the query would keep the wrong geometry.

Save the code as `vector-index-replay.py` and run `uv run vector-index-replay.py`. Its script metadata pins the CPU packages; it builds separate indexes rather than mutating the original into a different metric.

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
assert int(raw_ids[0, 0]) == 202
assert int(cosine_ids[0, 0]) == 101

removed = cosine.remove_ids(np.array([101], dtype="int64"))
_, after_delete = cosine.search(unit_query, 2)
print("Removed records:", removed)
print("Results after delete:", after_delete[0].tolist())
assert removed == 1 and cosine.ntotal == 1
assert after_delete[0].tolist() == [202, -1]
assert raw_l2.ntotal == 2  # The old index still exists independently.
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Raw L2 winner: 202
Cosine winner after rebuilding: 101
Removed records: 1
Results after delete: [202, -1]
```
<!-- leetllm: output:end -->

`-1` is Faiss's missing-result sentinel when fewer than `k` records remain; never resolve it as a real source ID. This deletion works for the flat index wrapped in `IndexIDMap2`, not every Faiss index type. The old index still contains both records. During a real migration, every serving path and retained replica needs the same deletion and access policy before cutover. Distributed deployments must propagate those deletes across every replica and enforce ACLs at query time. An IVF migration additionally retrains centroids and reassigns lists for the new geometry.

Freeze the embedding model, distance normalization, representative query set, filters, and exact top-$k$ baseline. That fixes what "correct" means while you compare candidates.

Then sweep each candidate's search budget and plot recall against <span data-glossary="p95-latency">p95 latency</span> and bytes per vector under target concurrency. Report CPU/GPU model, RAM, storage, library version, thread count, batch size, warm/cold state, and query count. Hold build settings fixed within a query-budget sweep. Separate index latency from embedding, network, and reranking time, and measure p99 as well as throughput under load.

Add build time, update/delete visibility, filtered-search completeness, and relevance quality to the scorecard. The executable examples here check arithmetic and small deterministic mechanisms. None measures hundred-million-vector performance. Select the index family and search parameters (`efSearch` or `nprobe`) from recall-latency sweeps on your own corpus and filter distribution.

An unfiltered flat scan scores every component, and raising `ef_search` or `nprobe` buys recall with different work. A filter, a delete, or a metric change can still miss the rollback runbook when local latency looks fine. None of those knobs repairs a query vector that points at the wrong neighborhood.

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
    "explanation": "There are 20,000,000 × 1,024 = 20.48 billion components. Four bytes each gives 81.92 billion bytes, or 81.92 decimal GB. These counts do not determine wall time."
  },
  {
    "question": "Exact top-4 IDs are [2, 7, 11, 19]. Candidate A returns [2, 7, 30, 31] in 6 ms; candidate B returns [2, 7, 11, 31] in 14 ms. The gate requires at least 70% recall and at most 15 ms. Which result passes?",
    "options": [
      "Only A.",
      "Both A and B.",
      "Only B.",
      "Neither A nor B."
    ],
    "answer": "Only B.",
    "explanation": "A recovers IDs 2 and 7 (2/4 = 50%). B also recovers ID 11 (3/4 = 75%). A is faster but misses the 70% recall floor. Both pass on latency alone. Rejecting both for missing ID 19 would require perfect recall. Only B meets both limits."
  },
  {
    "question": "An HNSW graph reaches layer 3. A new node samples layer 1 with M=12 and construction beam 80. Which insertion trace matches the usual construction?",
    "options": [
      "Navigate 3/2; search and wire 1/0; typical base cap 24; replace the global entry point with the lower node.",
      "Navigate 3/2; search and wire 1/0; typical base cap 24; retain the existing higher global entry point.",
      "Navigate 3/2/1; search and wire 0; typical base cap 24; retain the existing higher global entry point.",
      "Navigate 3/2; search and wire 1; typical base cap 12; replace the existing higher global entry point."
    ],
    "answer": "Navigate 3/2; search and wire 1/0; typical base cap 24; retain the existing higher global entry point.",
    "explanation": "Layers above the sampled maximum are navigation only. Construction search and connections occur on the occupied layers. Reciprocal pruning can leave asymmetric links; the lower sampled level does not replace the global entry point."
  },
  {
    "question": "The lesson HNSW lab receives k=12 with ef_search=6. What should its caller do before timing the request?",
    "options": [
      "Retain ef_search 6 and k 12; measure the request assuming upper-layer navigation supplies the other results.",
      "Set M 12 and retain ef_search 6; measure the request assuming graph degree supplies the other requested results.",
      "Request six retained results and pad the return to 12; measure that padded result against the original request.",
      "Raise ef_search to at least 12 or reject; measure recall and latency across valid settings for the requested k 12."
    ],
    "answer": "Raise ef_search to at least 12 or reject; measure recall and latency across valid settings for the requested k 12.",
    "explanation": "This lab requires enough retained result capacity for k. A valid beam still provides no exact-recall guarantee. M, query beam and IVF probes control different operations."
  },
  {
    "question": "A flat-coarse IVF-Flat index stores 2 million vectors in 512 balanced lists. Moving nprobe from 3 to 12 changes which comparison counts?",
    "options": [
      "Coarse scores 3→12; estimated list scans 11719→46875.",
      "Coarse scores 512→512; estimated list scans 11719→46875.",
      "Coarse scores 512→512; estimated list scans 11719→11719.",
      "Coarse scores 512→12; estimated list scans 46875→11719."
    ],
    "answer": "Coarse scores 512→512; estimated list scans 11719→46875.",
    "explanation": "Each list averages 2,000,000/512=3,906.25 vectors. Three and twelve probes scan about 11,718.75 and 46,875 vectors. The flat coarse quantizer still scores all 512 centroids; these are work estimates, not measured latency."
  },
  {
    "question": "An IVF index trained on raw vectors under L2 is switched to cosine by normalizing only queries. Recall drops. Which migration matches cosine geometry?",
    "options": [
      "Training/database: raw; queries: normalized. Retain old raw-L2 centroids and increase the probe count.",
      "Training: raw; database/queries: normalized. Retain old raw-L2 centroids and switch the final scorer.",
      "Training/database: raw; queries: normalized. Retain raw-L2 centroids and increase graph degree instead.",
      "Training/database/queries: normalized. Retrain IVF centroids in that geometry and use inner-product scoring."
    ],
    "answer": "Training/database/queries: normalized. Retrain IVF centroids in that geometry and use inner-product scoring.",
    "explanation": "Cosine ranking becomes inner-product ranking after both sides are normalized. IVF routing depends on the geometry used to train its coarse quantizer, so old raw-L2 centroids can send normalized queries to poor lists. Rebuilding restores geometric consistency."
  },
  {
    "question": "A 1,024-dimensional float32 vector uses 128 PQ subspaces with 256 centroids each. Excluding record IDs and shared codebooks, what representation size and raw-to-code ratio follow?",
    "options": [
      "Code 1024 bytes; raw/code ratio 4×.",
      "Code 512 bytes; raw/code ratio 8×.",
      "Code 128 bytes; raw/code ratio 32×.",
      "Code 16 bytes; raw/code ratio 256×."
    ],
    "answer": "Code 128 bytes; raw/code ratio 32×.",
    "explanation": "Each subspace stores one 8-bit centroid ID. The 128-byte code replaces 1,024×4=4,096 raw bytes, giving 32× code-only compression."
  },
  {
    "question": "Two ADC lookup rows are [0,9] and [0,16]. A stored code is [1,0]. Which query-time score follows under the squared-L2 table convention?",
    "options": [
      "Score1: Hamming distance between code bytes.",
      "Score25: add both nonzero table values 9+16.",
      "Score3: take the square root of selected sum 9.",
      "Score9: add row-one[1]=9 and row-two[0]=0."
    ],
    "answer": "Score9: add row-one[1]=9 and row-two[0]=0.",
    "explanation": "Each code byte indexes its own query-to-centroid row. The selected entries sum to 9+0=9. Those values are squared distances to a reconstruction, not distances between integer codes."
  },
  {
    "question": "An ANN query requests 100 candidates, then application code keeps `region = EU`. EU rows are 1% of data and poorly aligned with vector neighborhoods; final `k` is 10. What is the main failure?",
    "options": [
      "Main failure: post-filtering may change stored vector distances. Boundary: before unauthorized content leaves trusted retrieval.",
      "Main failure: the fixed buffer may hold too few eligible rows. Boundary: before unauthorized content leaves trusted retrieval.",
      "Main failure: final k may force the candidate pool to ten before filtering. Boundary: after unrestricted results reach application code.",
      "Main failure: post-filtering may first delete graph bridge nodes. Boundary: after unrestricted results reach application code."
    ],
    "answer": "Main failure: the fixed buffer may hold too few eligible rows. Boundary: before unauthorized content leaves trusted retrieval.",
    "explanation": "A fixed buffer can contain too few eligible IDs. Expansion may help but remains budget-limited. If region is an access rule, enforce it before unauthorized content leaves the trusted database or retrieval service. Post-filtering inside that boundary differs from exposing text and filtering later in application code."
  },
  {
    "question": "Six disjoint shards share exact scoring and a total tie order. Each returns its local top-4. What can the broker conclude if every shard replies?",
    "options": [
      "24 candidates contain the exact global top 4; each locally omitted record has four local predecessors.",
      "24 candidates miss the exact global top 4; a locally fifth record ranks first in the global ordering.",
      "20 candidates after dropping one shard retain exact global top 4; the omitted shard contributes no needed item.",
      "24 approximate local candidates retain exact global top 4; approximate local omissions preserve the exact guarantee."
    ],
    "answer": "24 candidates contain the exact global top 4; each locally omitted record has four local predecessors.",
    "explanation": "A locally omitted record cannot enter the global top four when four records from its own shard precede it. Missing shards, approximate local search and later grouping alter those assumptions."
  }
]
```

> **Next:** Continue to [Advanced RAG: HyDE & Self-RAG](/learn/advanced-rag-query-rewriting-self-rag). HNSW and IVF decide how an index walks once a query vector exists, but they can't repair a vague or underspecified question. <span data-glossary="query-rewriting">Query rewriting</span>, HyDE, Self-<span data-glossary="rag">RAG</span>, and Corrective RAG act before that walk, and their failures are different from an `ef_search` or `nprobe` miss.
