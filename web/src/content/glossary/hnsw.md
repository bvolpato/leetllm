---
title: HNSW
aliases: ["Hierarchical Navigable Small World"]
importance: 88
---
**Hierarchical Navigable Small World (HNSW)** is a multi-layer proximity-graph index for approximate nearest neighbor (ANN) search. Each stored vector is a graph node. Bidirectional edges connect a node to a bounded set of nearby vectors. Upper layers are sparse and carry longer-range links for fast routing; layer $0$ holds every vector and denser short-range links for final refinement. Search starts at a top-layer entry point, greedily walks toward the query, then drops layer by layer until a beam search on layer $0$ returns the top-$k$ candidates.

The structure was introduced by Malkov and Yashunin (*Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs*, arXiv:1603.09320; IEEE TPAMI). It combines navigable small-world graphs with a probabilistic hierarchy inspired by skip lists. Libraries and vector stores (hnswlib, FAISS `IndexHNSWFlat`, pgvector HNSW, Qdrant, Weaviate, and others) implement the same core idea with their own knobs and filter strategies.

HNSW is the approximate nearest-neighbor graph used for dense retrieval over embeddings and a distance metric (usually $L_2$ or inner product). A database or vector store may provide storage, metadata, and filter handling around that graph. The index decides which small fraction of the corpus to score so interactive RAG avoids scanning all $N$ vectors.

## Intuition

Exact $k$-NN scores every vector: $O(N \cdot d)$ distance work per query. HNSW prebuilds a map of neighborhoods so a query can *walk* toward good neighbors.

Think of a multi-floor transit system:

- **Top floors** have few stations and long express links. You jump across the space quickly, even if the stop is coarse.
- **Lower floors** add more stations and shorter hops. You refine toward the query.
- **Ground floor (layer 0)** has every station. A wider candidate list (`efSearch`) explores the local graph so you do not stop at the first local minimum.

Without hierarchy, a flat navigable small-world graph still works but degrades on large $N$: greedy routing more often dies in poor local minima. Layers force the walk to start on long edges, then zoom in. That is why production RAG stacks default to HNSW when RAM can hold the graph and vectors.

## How it works

### Layer assignment

When a vector $q$ is inserted, it draws a maximum layer from an exponential distribution (skip-list style). With level multiplier $m_L$, a common draw is

$$
\ell = \big\lfloor -\ln(U) \cdot m_L \big\rfloor, \qquad U \sim \mathrm{Uniform}(0,1).
$$

The paper’s recommended scale is $m_L = 1 / \ln(M)$, so the expected fraction of points that reach layer $\ell$ or above thins roughly by a factor of $M$ per level:

$$
\Pr(\text{level} \ge \ell) \approx M^{-\ell}.
$$

Every point exists on layer $0$ and on each layer up to its own $\ell$. Higher layers stay sparse; layer $0$ contains all points, not all possible edges.

### Insert

1. Start from the current global entry point on the top layer.
2. On layers **above** the new point’s $\ell$, greedily walk with a tiny candidate list (often $\mathit{ef}=1$) to find a good entry into the next lower layer.
3. From layer $\ell$ down to $0$, run a broader search with beam width `efConstruction`, collect candidates, and select up to $M$ neighbors (closest, or a diversity heuristic that prefers edges in different directions).
4. Add links in both directions. Cap degree at $M$ on upper layers and typically $M_{\max0} = 2M$ on layer $0$. If a neighbor already has too many edges, prune its list the same way; independent pruning means final adjacency need not remain perfectly symmetric.
5. If the new point’s layer exceeds the previous top, it becomes the entry point.

Construction quality is mostly `efConstruction` and $M$. Query latency is mostly `efSearch` and $M$. Memory grows with $N$, $d$, and $M$.

### Search

1. Enter at the top-layer entry point.
2. On each layer above $0$, greedily move to the neighbor closest to the query until no neighbor is closer (local minimum). Drop one layer, using that node as the entry.
3. On layer $0$, maintain a best-results set bounded by `efSearch` ($\mathit{ef} \ge k$) and a separate queue of unexplored candidates. Expand candidates by their neighbors; in the basic search, stop when the nearest unexplored candidate is farther than the farthest of the current best `ef` results. Filter-aware implementations may change this stopping behavior.
4. Return the best $k$ from that list.

Distance is computed under the same metric the embeddings expect. For dual encoders trained with cosine, L2-normalize once and search with inner product so geometry matches training.

## Formula

Exact nearest neighbor under Euclidean distance (what the graph approximates):

$$
j^\star = \arg\min_i \|q - x_i\|_2
$$

Maximum inner product search (common when vectors are unit-normalized):

$$
j^\star = \arg\max_i \langle q, x_i \rangle
$$

ANN fidelity for one query, approximate top-$k$ set $A_k$ vs exact geometric top-$k$ set $E_k$:

$$
\mathrm{ANN\text{-}recall@}k = \frac{|A_k \cap E_k|}{k}
$$

Average over a held-out query set to measure **index** quality. Measure task recall separately against human-relevant documents; the two metrics diagnose different failure modes.

hnswlib’s rule of thumb for graph memory is on the order of $M \times 8$–$10$ bytes per element for edge lists alone; full float32 vectors still cost $4d$ bytes each. A **rough engineering estimate** for search cost is $O(\mathit{ef} \cdot M \cdot \log N)$ distance evaluations. Actual cost depends on dimensionality, graph quality, and the filter path; measure it on the intended index and workload.


## Example

A support RAG corpus holds $N = 5 \times 10^6$ chunks embedded to $d = 768$ float32.

- Raw vectors: $5\mathrm{e}6 \times 768 \times 4 \approx 15.4$ GB.
- HNSW with $M = 16$ adds roughly 128–160 bytes per node under hnswlib's link-storage rule of thumb, plus implementation-specific metadata. Its estimate already accounts approximately for the graph layout; do not add another full $2M$ layer-zero allocation to it. Plan RAM for **vectors + graph + runtime overhead**, not vectors alone.

Build and query with FAISS-style knobs:

```python
import faiss

d, M = 768, 16
index = faiss.IndexHNSWFlat(d, M)  # L2; use IP metric when normalized for cosine
index.hnsw.efConstruction = 200
index.add(xb)                      # xb: (N, d) float32
index.hnsw.efSearch = 64           # must be >= k
D, I = index.search(xq, k=20)
```

Operational path for one query "how do we rotate leaked API keys?":

1. Query encoder yields $q \in \mathbb{R}^{768}$.
2. HNSW walks long upper-layer edges into the security / credentials neighborhood, then beam-searches layer $0$ with `efSearch=64`.
3. Returns up to $k=20$ chunk ids; measure latency on the actual CPU, corpus, concurrency, and search settings.
4. ACL filter and optional cross-encoder rerank before the prompt.

If you only measure unfiltered ANN-recall@20 $= 0.98$ against a flat index, the graph looks healthy. If tenant filters keep 3% of the corpus and you **post-filter** the 20 hits down to 0–2 allowed chunks, task recall collapses even though the algorithm “worked.” Measure filtered recall, raise candidate $k$ / `efSearch`, or use a filter-aware walk when the store supports it.

## Parameters

| Parameter | Role | Practical notes |
| --- | --- | --- |
| $M$ | Max bidirectional links per node on upper layers; layer $0$ often allows $2M$ | Paper guidance often $5$–$48$; hnswlib says $2$–$100$, with $12$–$48$ covering most cases. Higher $M$ helps high-dimensional embeddings and high-recall targets; costs RAM and build/search work. |
| `efConstruction` | Candidate list size while inserting | Larger builds a better graph, slower index time. A common check: at `ef = efConstruction`, $M$-NN recall should be high (hnswlib suggests room to improve if below ~$0.9$). Typical defaults sit around $100$–$200$. |
| `efSearch` / `ef` | Candidate list size at query time | Higher improves ANN recall but increases latency. Must be $\ge k$. Tunable online without rebuild. |
| $m_L$ | Layer height scale | Usually $1/\ln(M)$; rarely hand-tuned in apps. |

Defaults that work as a starting point for many text embedding indexes: $M=16$, `efConstruction=200`, `efSearch=50`–$100`. Always retune on **your** vectors with a flat exact baseline and the filters you ship.

## Trade-offs

| Dimension | What you get | What you pay |
| --- | --- | --- |
| Recall vs latency | High ANN recall at low p95 for moderate $N$ | Raise `efSearch` or $M$ when recall stalls |
| Memory | Excellent interactive search without scanning $N$ | Graph + full vectors often dominate RAM; PQ hybrids trade geometry for size |
| Build | Incremental inserts (online growth) | Large rebuilds and high `efConstruction` are slow; deletes may leave tombstones or require compaction |
| Filters | Fast unfiltered top-$k$ | Post-filtering after a graph walk can starve ACL / tenant slices |
| Freshness | New chunks can be inserted into the live graph | Embedding model upgrades require re-embed + rebuild; mixed vector versions scramble neighborhoods |

Compared with [IVF](glossary://ivf): HNSW usually needs more RAM and has heavier builds, but often hits higher recall at low latency without training centroids. IVF + PQ can win when memory is the bottleneck. Exact flat search provides a baseline for measuring ANN-recall and can also be practical in production with suitable hardware and batching, even at large corpus sizes.

## Why it matters here

HNSW appears in many dense retrieval systems. Curriculum lessons on embeddings, ANN, FAISS, pgvector, and retrieval quality use this graph: long edges for routing, dense layer $0$ for refinement, and knobs $M$ / `efConstruction` / `efSearch` that expose a measurable recall–latency curve. When a gold chunk never reaches the prompt, inspect index fidelity, filter interaction, and the similarity metric to find where retrieval lost it.

## Related terms

- [ANN search](glossary://ann-search)
- [FAISS](glossary://faiss)
- [IVF](glossary://ivf)
- [Dense retrieval](glossary://dense-retrieval)
- [Recall@k](glossary://recall-at-k)
