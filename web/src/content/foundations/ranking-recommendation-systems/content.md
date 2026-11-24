---
{
  "id": "ranking-recommendation-systems",
  "title": "Ranking and Recommendation Systems",
  "slug": "ranking-recommendation-systems",
  "section": "Production ML Systems",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Medium",
  "order": 4,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": ["Amazon", "Netflix", "Spotify", "DoorDash"],
  "shortDescription": "Build multi-stage retrieval and ranking pipelines, evaluate list order with NDCG/MRR/MAP, train pairwise and metric-weighted rankers, and debias click logs with IPS.",
  "keyConceptsTested": ["candidate generation", "pairwise ranking loss", "NDCG", "two-tower recommendation", "position bias", "implicit feedback", "online experimentation"]
}
---

A developer searches your documentation portal for `retry idempotency key`. Three matching documents sit in the index: a confidential incident draft, a deprecated v1 migration guide, and the current HTTP retry guide buried on page two. Showing the private draft leaks restricted data; burying the current guide leaves the developer reading stale code.

In binary classification, a model scores each item independently. In **ranking and recommendation systems**, *order* determines what users see, click, and trust, and today's displayed list shapes tomorrow's training data. Whether the request starts from a typed query (search) or user history (a recommendation feed), modern systems split the problem into distinct stages so speed, access control, and ordering quality do not fight each other.

## Separate eligibility, retrieval, and ranking

Scoring one million documents with a heavy cross-attention model on every keystroke is too slow. Multi-stage ranking narrows the pool progressively so expensive models only touch the strongest candidates:

<figure>
  <img src="illustrations/_generated/ranking_funnel_dark.png" alt="A horizontal log-scale chart traces a document pool through four shrinking stages: 1,000,000 eligible documents, 1,000 retrieved candidates, 100 scored items, and a final slate of 10." />
  <figcaption>A typical four-stage funnel shrinks one million eligible items down to ten displayed results, concentrating heavy interaction models on the top candidates.</figcaption>
</figure>

1. **Eligibility (1,000,000):** Enforce permissions, tenant boundaries, and freshness rules *independently* of learned scores. A high relevance score must never override access control.
2. **Candidate retrieval (1,000,000 $\to$ 1,000):** Pull a fast shortlist using lexical indexes (BM25), precomputed vector similarity, or hybrid fusion. Anything dropped here is gone forever.
3. **Heavy scoring (1,000 $\to$ 100):** Run richer query-document or user-item models (GBDTs, Deep & Cross Networks, or cross-encoders) over the shortlist.
4. **Final slate (100 $\to$ 10):** Apply deduplication, diversity caps, and final permission checks before rendering.

Let's walk through the entire funnel on a concrete seven-document corpus with offline relevance grades (`3` = direct answer, `2` = helpful guide, `0` = irrelevant; used strictly for offline evaluation, never as serving features):

<!-- leetllm: test, output=show, id=ranking-lab, deps=numpy,scipy,scikit-learn -->
```python title="build-and-filter-corpus.py"
import numpy as np

query = "retry idempotency key"
corpus = [
    {"id": "api-guide",        "current": True,  "permitted": True,  "retrieval": 0.96, "query_fit": 0.98, "reliability": 0.88, "relevance": 3},
    {"id": "blog-post",        "current": True,  "permitted": True,  "retrieval": 0.91, "query_fit": 0.35, "reliability": 0.97, "relevance": 0},
    {"id": "legacy-changelog", "current": True,  "permitted": True,  "retrieval": 0.90, "query_fit": 0.15, "reliability": 0.99, "relevance": 0},
    {"id": "retry-guide",      "current": True,  "permitted": True,  "retrieval": 0.84, "query_fit": 0.92, "reliability": 0.98, "relevance": 2},
    {"id": "sdk-example",      "current": True,  "permitted": True,  "retrieval": 0.80, "query_fit": 0.86, "reliability": 0.96, "relevance": 2},
    {"id": "private-draft",    "current": True,  "permitted": False, "retrieval": 0.99, "query_fit": 0.99, "reliability": 0.99, "relevance": 3},
    {"id": "stale-guide",      "current": False, "permitted": True,  "retrieval": 0.95, "query_fit": 0.94, "reliability": 0.70, "relevance": 2},
]

eligible = [d for d in corpus if d["current"] and d["permitted"]]
blocked = [d["id"] for d in corpus if not (d["current"] and d["permitted"])]
print("eligible:", [d["id"] for d in eligible])
print("blocked: ", blocked)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
eligible: ['api-guide', 'blog-post', 'legacy-changelog', 'retry-guide', 'sdk-example']
blocked:  ['private-draft', 'stale-guide']
```
<!-- leetllm: output:end -->

Notice that `private-draft` has the highest scores in the entire table (`0.99`), which is exactly why eligibility filtering must stay outside learned weights.

## Measure candidate recall before ordering quality

Retrieval's job is **candidate recall**: capturing relevant eligible items inside budget $k$ (just like the recall stage in [Core Retrieval Algorithms](/learn/core-retrieval-algorithms)). Watch what happens at $k = 3$ versus $k = 5$:

<!-- leetllm: test, output=show, continue=ranking-lab, id=candidate-recall, deps=numpy,scipy,scikit-learn -->
```python title="measure-candidate-recall.py"
relevant_ids = {d["id"] for d in eligible if d["relevance"] > 0}

def retrieve(k):
    order = np.lexsort(([d["id"] for d in eligible], [-d["retrieval"] for d in eligible]))
    return [eligible[i] for i in order[:k]]

def candidate_recall(items):
    return len(relevant_ids & {d["id"] for d in items}) / len(relevant_ids)

for k in (3, 5):
    shortlist = retrieve(k)
    print(f"k={k}: ids={[d['id'] for d in shortlist]} | recall={candidate_recall(shortlist):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
k=3: ids=['api-guide', 'blog-post', 'legacy-changelog'] | recall=0.333
k=5: ids=['api-guide', 'blog-post', 'legacy-changelog', 'retry-guide', 'sdk-example'] | recall=1.000
```
<!-- leetllm: output:end -->

At $k = 3$, retrieval drops both `retry-guide` and `sdk-example` (`recall = 0.333`). No downstream reranker can rescue documents that never entered the shortlist.

```checkpoint
A relevant document never enters the top-100 retrieved candidates. Can a better reranker put it at position 1?
---
No. A reranker can only reorder surviving candidates. Fix retrieval recall before tuning downstream ranking models.
```

## Rerank the surviving candidates

With $k = 5$, all three relevant guides survive, though coarse retrieval placed `blog-post` and `legacy-changelog` ahead of `retry-guide` and `sdk-example`. A second-stage scorer combines richer signals (`query_fit` and `reliability`) to reorder the shortlist:

<!-- leetllm: test, output=show, continue=candidate-recall, id=reranked-slate, deps=numpy,scipy,scikit-learn -->
```python title="score-and-rerank.py"
candidates = retrieve(5)
weights = np.array([2.0, 0.6])

def rank_score(item):
    return float(np.array([item["query_fit"], item["reliability"]]) @ weights)

scores = np.array([rank_score(d) for d in candidates])
ranked = [candidates[i] for i in np.lexsort(([d["id"] for d in candidates], -scores))]
print("retrieval order:", [d["id"] for d in candidates])
print("ranked order:   ", [d["id"] for d in ranked])
print("rank scores:    ", [(d["id"], round(rank_score(d), 3)) for d in ranked])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
retrieval order: ['api-guide', 'blog-post', 'legacy-changelog', 'retry-guide', 'sdk-example']
ranked order:    ['api-guide', 'retry-guide', 'sdk-example', 'blog-post', 'legacy-changelog']
rank scores:     [('api-guide', 2.488), ('retry-guide', 2.428), ('sdk-example', 2.296), ('blog-post', 1.282), ('legacy-changelog', 0.894)]
```
<!-- leetllm: output:end -->

## Evaluate rank order with DCG, NDCG, MRR, and MAP

Moving the best answer from slot 2 to slot 1 matters far more than moving it from slot 40 to slot 39. Three position-aware metrics capture that intuition:[^manning2008ir]

### 1. DCG and NDCG (graded relevance)

**Discounted Cumulative Gain (DCG@k)** awards exponential gain $2^{\text{rel}_i} - 1$ discounted logarithmically by rank position $i$:

$$
\text{DCG@k} = \sum_{i=1}^{k} \frac{2^{\text{rel}_i} - 1}{\log_2(i + 1)}, \qquad \text{NDCG@k} = \frac{\text{DCG@k}}{\text{IDCG@k}} \in [0, 1]
$$

At rank 1 the multiplier is $1 / \log_2(2) = 1.000$; by rank 5 it drops to $1 / \log_2(6) \approx 0.387$. Dividing by the ideal ordering (**IDCG@k**) normalizes scores across queries with different numbers of relevant items.

For our retrieval list `[3, 0, 0, 2, 2]`:

$$
\text{DCG@5} = 7 + 0 + 0 + \frac{3}{\log_2 5} + \frac{3}{\log_2 6} \approx 9.453, \qquad \text{IDCG@5} = 7 + \frac{3}{\log_2 3} + \frac{3}{\log_2 4} \approx 10.393
$$

giving $\text{NDCG@5} = 9.453 / 10.393 \approx 0.910$.

### 2. MRR and MAP (single-target and binary relevance)

- **Mean Reciprocal Rank (MRR):** Scores only the *first* target hit via $\text{RR} = 1 / \text{rank}_{\text{first}}$, averaged over queries $Q$. Ideal for navigational queries where the user wants one canonical page.
- **Mean Average Precision (MAP@k):** For binary relevance, averages precision $P@i$ at every relevant hit in the top $k$:

$$
\text{AP@k} = \frac{1}{\min(R, k)} \sum_{i=1}^{k} P@i \cdot \mathbb{I}(\text{doc}_i \text{ is relevant})
$$

(Note whether your benchmark caps the denominator at $\min(R, k)$ or keeps the full corpus relevant count $R$; at $k = 1$ with $R = 2$ relevant items, hitting one yields `1.0` under $\min(R, k)$ versus `0.5` under $R$.)

### Reranker NDCG versus whole-system NDCG

> **Key insight:** Never look at local reranker NDCG alone. Computing IDCG only over retrieved survivors gives `k = 3` a misleading **1.000** reranker NDCG@3 even though retrieval dropped two relevant guides! Computing IDCG over the full eligible corpus (**system NDCG@3**) exposes the real drop to **0.674**.

<!-- leetllm: test, output=show, continue=reranked-slate, id=ndcg-metric, deps=numpy,scipy,scikit-learn -->
```python title="compare-ranking-metrics.py"
from sklearn.metrics import ndcg_score

def dcg(rels):
    r = np.asarray(rels, dtype=float)
    return float(np.sum((2.0**r - 1.0) / np.log2(np.arange(2, len(r) + 2))))

def ndcg_at_k(items, k, universe=None):
    pool = items if universe is None else universe
    ideal = np.sort([d["relevance"] for d in pool])[::-1][:k]
    best = dcg(ideal)
    return dcg([d["relevance"] for d in items[:k]]) / best if best else 0.0

def rr(items, target=3):
    hits = [i + 1 for i, d in enumerate(items) if d["relevance"] >= target]
    return 1.0 / hits[0] if hits else 0.0

def ap_at_k(items, k=5, threshold=2):
    rel = np.array([d["relevance"] >= threshold for d in items[:k]], dtype=float)
    total = sum(d["relevance"] >= threshold for d in items)
    return float(np.sum((np.cumsum(rel) / np.arange(1, len(rel) + 1)) * rel) / min(total, k)) if total else 0.0

# Cross-check with scikit-learn
sk = float(ndcg_score([[2**d["relevance"] - 1 for d in candidates]], [np.arange(5, 0, -1)], k=5, ignore_ties=True))
assert np.isclose(ndcg_at_k(candidates, 5), sk)

tight_k3 = sorted(retrieve(3), key=lambda d: (-rank_score(d), d["id"]))
print(f"k=5 retrieval -> NDCG@5={ndcg_at_k(candidates, 5):.3f} | RR={rr(candidates):.3f} | AP@5={ap_at_k(candidates):.3f}")
print(f"k=5 reranked  -> NDCG@5={ndcg_at_k(ranked, 5):.3f} | RR={rr(ranked):.3f} | AP@5={ap_at_k(ranked):.3f}")
print(f"k=3 reranked  -> local NDCG@3={ndcg_at_k(tight_k3, 3):.3f} | system NDCG@3={ndcg_at_k(tight_k3, 3, eligible):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
k=5 retrieval -> NDCG@5=0.910 | RR=1.000 | AP@5=0.700
k=5 reranked  -> NDCG@5=1.000 | RR=1.000 | AP@5=1.000
k=3 reranked  -> local NDCG@3=1.000 | system NDCG@3=0.674
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Side-by-side comparison of candidate budgets k=3 and k=5 at cutoff NDCG@3: a table shows grades [3, 0, 0] for k=3 versus [3, 2, 2] for k=5, and grouped bars compare candidate recall (0.333 vs 1.000), local reranker NDCG@3 (1.000 vs 1.000), and system NDCG@3 (0.674 vs 1.000)." />
  <figcaption>Comparing candidate budgets <code>k=3</code> and <code>k=5</code> at cutoff <code>NDCG@3</code>: at <code>k=3</code>, perfect local reranking (<code>1.000</code>) masks the two dropped grade-2 guides, pulling system <code>NDCG@3</code> down to <code>0.674</code>.</figcaption>
</figure>

```checkpoint
Why does NDCG penalize moving a relevant document from position 1 to position 10?
---
DCG discounts each item's gain by 1 / log2(rank + 1), weighting top positions heavily. Dividing by IDCG normalizes scores to [0, 1] across queries with different relevant counts.
```

## Two-tower retrieval and feature interaction networks

How do production systems search millions of items in milliseconds and still model fine-grained interactions on the shortlist?

### Two-tower retrieval (hoisting item compute offline)

A **two-tower model** encodes the query or user context into $u(q) \in \mathbb{R}^d$ and each document into an independent item vector $v(i) \in \mathbb{R}^d$, scoring similarity via dot product $\langle u(q), v(i) \rangle$.[^huang2013][^tensorflow2026retrieval] Because $v(i)$ does not depend on the live query, all million item vectors are precomputed offline and indexed in an approximate nearest-neighbor (ANN) structure such as HNSW or ScaNN. At serving time you run the query tower *once* and execute fast MIPS lookup.

The trade-off is the **cross-feature bottleneck**: because the two towers never interact until the final dot product, fine-grained feature crosses (like "this specific user segment + this specific document freshness") wait for the heavy ranking stage.

### Deep & Cross Networks (DCN and DCN-v2)

On the top 100 candidates, **Deep & Cross Networks** combine an explicit polynomial cross branch with a standard MLP over concatenated features $x_0 = [x_{\text{query}}, x_{\text{item}}, x_{\text{context}}] \in \mathbb{R}^D$:[^wang2017dcn][^wang2021dcnv2][^tensorflow2026dcn]

- **Original DCN (vector weight, $O(D)$ per layer):** $x_{l+1} = x_0 (x_l^\top w_l) + b_l + x_l$
- **DCN-v2 (matrix weight, $O(D^2)$ or low-rank $O(Dr)$):** $x_{l+1} = x_0 \odot (W_l x_l + b_l) + x_l$

Compare both cross layers directly on a two-dimensional input and verify how changing the query shifts the crossed item representation (explaining why cross-networks cannot be precomputed offline):

<!-- leetllm: test, output=show, id=two-tower-precompute, deps=numpy -->
```python title="two-tower-and-dcn-layers.py"
import numpy as np

rng = np.random.default_rng(42)
doc_vecs = rng.normal(size=(1000, 16))
query_vec = rng.normal(size=16)
top5 = np.argsort(-(doc_vecs @ query_vec))[:5]
print(f"two-tower: 1,000 precomputed item vectors -> 1 query pass -> top {len(top5)} candidates: {top5.tolist()}")

x0, xl, bias = np.array([2.0, 3.0]), np.array([5.0, 7.0]), np.array([0.5, 1.0])
dcn_v1 = x0 * (xl @ np.array([1.0, 0.0])) + bias + xl
dcn_v2 = x0 * (np.eye(2) @ xl + bias) + xl
print("DCN-v1 vector layer:", dcn_v1.tolist(), "| DCN-v2 matrix layer:", dcn_v2.tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
two-tower: 1,000 precomputed item vectors -> 1 query pass -> top 5 candidates: [244, 494, 958, 120, 948]
DCN-v1 vector layer: [15.5, 23.0] | DCN-v2 matrix layer: [16.0, 31.0]
```
<!-- leetllm: output:end -->

<details>
<summary>Deep dive: LLM listwise rerankers and recommendation feeds</summary>

- **LLM listwise rerankers (e.g., RankGPT):** Pass only *eligible* candidate IDs and snippets to a language model and validate that its output is an exact permutation of the supplied IDs before serving (falling back to the baseline scorer on malformed or unauthorized IDs).[^sun2023rankgpt] Often teams distill slow LLM rerankers into lightweight cross-encoders for production latency budgets.
- **Recommendation feeds (no query text):** Replace the query tower with user history and session context. **Collaborative filtering** learns from user-item interaction overlaps (suffering item cold start on new documents), while **content-based** features encode item metadata and text (suffering user cold start on new visitors). Combining both inside a two-tower encoder handles new items immediately.[^google2026recommendationTypes][^tensorflow2026retrieval]

</details>

## Learning to rank: pointwise, pairwise, and listwise

How do you train a ranker from labeled queries? Three loss families trade off simplicity against direct alignment with list metrics:

| Family | Target | Example loss | Trade-off |
| --- | --- | --- | --- |
| **Pointwise** | Single item grade or click | MSE or binary cross-entropy | Simple, ignores relative rank position |
| **Pairwise** | Item $i$ preferred over item $j$ | RankNet logistic loss on $s_i - s_j$[^burges2005ranknet] | Focuses on relative order, treats top and bottom swaps equally |
| **Listwise / metric-weighted** | Full query list or NDCG delta | ListNet / LambdaRank / LambdaMART[^burges2010lambda] | Directly emphasizes top-of-list swaps that move NDCG |

### From RankNet to LambdaMART

For a preferred item $i$ over item $j$ with score gap $\Delta = s_i - s_j$, **RankNet** minimizes pairwise logistic cross-entropy:[^burges2005ranknet]

$$
p_{ij} = \frac{1}{1 + e^{-\Delta}}, \qquad L_{ij} = \log(1 + e^{-\Delta}), \qquad \frac{\partial L_{ij}}{\partial \Delta} = p_{ij} - 1
$$

Plain RankNet treats a swap between positions 1 and 3 identically to a swap between positions 4 and 5 whenever their score gaps match. Because NDCG itself is a flat step function with zero derivative almost everywhere, **LambdaRank** and **LambdaMART** multiply each pairwise logistic derivative by the discrete NDCG change $|\Delta\text{NDCG}_{ij}|$ produced by swapping items $i$ and $j$:[^burges2010lambda]

$$
\lambda_{ij} = \frac{-\sigma}{1 + e^{\sigma(s_i - s_j)}} \, |\Delta\text{NDCG}_{ij}|
$$

<figure>
  <img src="illustrations/_generated/lambdamart_gradients_dark.png" alt="A ranked five-document list shows grades 0, 2, 3, 0, 2. Two highlighted swaps compare the API guide at position 3 with the blog at position 1, and the SDK example at position 5 with the changelog at position 4. With equal score gaps and sigma 1, their NDCG changes are 0.337 and 0.013, and their preferred-item derivatives are −0.1684 and −0.0063. Shared-scale bars show the 26.6× magnitude ratio; grade and position differences both contribute." />
  <figcaption>Metric weighting focuses gradient updates where list quality matters most: fixing the top-slot swap gives a <code>26.6×</code> stronger derivative than fixing the bottom-slot swap at equal score gaps.</figcaption>
</figure>

Compute both one RankNet linear weight step and the LambdaRank top-versus-bottom derivative ratio directly:

<!-- leetllm: test, output=show, continue=ndcg-metric, id=pairwise-update, deps=numpy,scipy,scikit-learn -->
```python title="ranknet-and-lambdarank-step.py"
from scipy.special import expit

by_id = {d["id"]: d for d in eligible}
diff = np.array([by_id["api-guide"]["query_fit"] - by_id["blog-post"]["query_fit"],
                 by_id["api-guide"]["reliability"] - by_id["blog-post"]["reliability"]])
w = np.zeros(2)
grad = float(expit(w @ diff) - 1.0) * diff
w_new = w - 0.5 * grad

def swap_delta_ndcg(grades, i, j):
    g = np.array(grades, dtype=float)
    s = g.copy()
    s[i], s[j] = s[j], s[i]
    return abs(dcg(s) - dcg(g)) / dcg(np.sort(g)[::-1])

misordered = [0, 2, 3, 0, 2]
d_top, d_bot = swap_delta_ndcg(misordered, 0, 2), swap_delta_ndcg(misordered, 3, 4)
print(f"RankNet grad={np.round(grad, 4).tolist()} -> w_new={np.round(w_new, 4).tolist()}")
print(f"top swap ΔNDCG={d_top:.3f} (λ={-0.5*d_top:.4f}) | bottom swap ΔNDCG={d_bot:.3f} (λ={-0.5*d_bot:.4f}) | ratio={d_top/d_bot:.1f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
RankNet grad=[-0.315, 0.045] -> w_new=[0.1575, -0.0225]
top swap ΔNDCG=0.337 (λ=-0.1684) | bottom swap ΔNDCG=0.013 (λ=-0.0063) | ratio=26.6x
```
<!-- leetllm: output:end -->

LambdaMART plugs these metric-weighted pairwise $\lambda$ gradients (and second derivatives) straight into gradient-boosted decision trees, producing one of the strongest tabular ranking algorithms ever built.[^burges2010lambda]

## Log exposure before reading clicks

Training on click logs without logging *impressions* creates a fatal blind spot: you only know what users clicked, never what was shown and ignored. Always emit two decoupled event streams linked by `request_id`:

1. **Exposure log:** Every rendered item, its display `position`, `ranker` version, `candidate_set` ID, and access ruleset snapshot.
2. **Outcome log:** Timestamped `click`, `save`, or `resolved` events carrying unique `event_id`s that join back to a logged impression.

Keeping exposure and outcomes decoupled ensures delayed resolutions never erase unclicked high-rank impressions.

## Debias click logs with inverse propensity scoring

Even with clean exposure logs, raw click-through rate (CTR) is heavily skewed by **position bias**: developers examine slot 1 far more often than slot 4. Training naively on raw clicks creates a self-reinforcing loop that rewards whatever the old ranker placed at the top.[^joachims2017]

Under the **position-based click model**, clicking requires both examining position $k$ and finding item $x$ relevant:

$$
P(\text{click} = 1 \mid x, k) = P(\text{examine} = 1 \mid k) \cdot P(\text{relevant} = 1 \mid x)
$$

When the examination propensity $p_k = P(\text{examine} = 1 \mid k) > 0$ is known (estimated via small randomized position swaps), **Inverse Propensity Scoring (IPS)** weights each observed click $C_{i, k}$ by $1 / p_k$ to recover an unbiased estimate of true relevance $R_i$:[^joachims2017]

$$
\mathbb{E}\left[\frac{C_{i, k}}{p_k}\right] = \frac{p_k \cdot R_i}{p_k} = R_i
$$

Watch IPS equalize two identical-quality items placed at slots 1 and 2, and notice why deep slots with tiny propensities ($p_4 = 0.02 \implies 1/p_4 = 50$) require **propensity clipping** to tame variance (trading variance reduction for downward bias):

<!-- leetllm: test, output=show, continue=pairwise-update, id=propensity-correction, deps=numpy,scipy,scikit-learn -->
```python title="debias-clicks-with-ips.py"
raw_ctr = np.array([0.40, 0.20])        # identical items at rank 1 and rank 2
propensity = np.array([1.0, 0.5])       # examination probabilities p1=1.0, p2=0.5
print("raw CTRs:      ", raw_ctr.tolist())
print("IPS debiased:  ", (raw_ctr / propensity).tolist())

# Deep slot (p4 = 0.02, true relevance R = 0.5): clipping at 10 cuts variance but adds bias
p4, R_true, cap = 0.02, 0.50, 10.0
print(f"slot 4 raw weight={1/p4:.0f} (unbiased E={p4*R_true*(1/p4):.2f}) | clipped weight={cap:.0f} (biased E={p4*R_true*cap:.2f})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw CTRs:       [0.4, 0.2]
IPS debiased:   [0.4, 0.4]
slot 4 raw weight=50 (unbiased E=0.50) | clipped weight=10 (biased E=0.10)
```
<!-- leetllm: output:end -->

Notice that relative propensity ratios ($p_2 / p_1 = 0.5$) suffice for comparing or training rankers, whereas estimating *absolute* relevance probabilities requires anchoring $p_1$ (if $p_1 = 0.8$ and $p_2 = 0.4$, both debiased estimates scale to `0.50`).

```checkpoint
Why can't raw click-through rate serve as an unbiased training label for a ranker?
---
Users can only click items they were shown, and top positions receive far more attention. Training on raw clicks reinforces old ranker exposure unless you log impressions and correct for position bias (e.g., via IPS).
```

## Protect users and enforce slate rules

The highest-scoring list is not always the best slate. Two post-scoring boundaries protect users:

- **Hard access enforcement:** Re-verify permissions at display time; bypassing eligibility on our 7-document corpus immediately puts `private-draft` at slot 1!
- **Diversity and source caps:** Suppose `api-guide`, `retry-guide`, and `sdk-example` all come from `"platform"` while `blog-post` comes from `"community"`. Capping any single source at 2 of 3 displayed slots swaps `sdk-example` for `blog-post`, trading system NDCG@3 from `1.000` down to `0.856` in exchange for source diversity:

<!-- leetllm: test, output=show, continue=propensity-correction, id=slate-rules, deps=numpy,scipy,scikit-learn -->
```python title="enforce-slate-and-access-rules.py"
source_of = {"api-guide": "platform", "retry-guide": "platform", "sdk-example": "platform",
             "blog-post": "community", "legacy-changelog": "community"}

def apply_source_cap(items, slots=3, max_per_source=2):
    slate, counts = [], {}
    for d in items:
        if len(slate) == slots:
            break
        src = source_of[d["id"]]
        if counts.get(src, 0) < max_per_source:
            slate.append(d)
            counts[src] = counts.get(src, 0) + 1
    return slate

diverse_slate = apply_source_cap(ranked, slots=3, max_per_source=2)
unfiltered_top = max(corpus, key=rank_score)
print(f"diverse slate: {[d['id'] for d in diverse_slate]} | system NDCG@3={ndcg_at_k(diverse_slate, 3, eligible):.3f}")
print(f"bypassing eligibility puts '{unfiltered_top['id']}' (permitted={unfiltered_top['permitted']}) at rank 1!")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
diverse slate: ['api-guide', 'retry-guide', 'blog-post'] | system NDCG@3=0.856
bypassing eligibility puts 'private-draft' (permitted=False) at rank 1!
```
<!-- leetllm: output:end -->

## Gate offline candidates and evaluate online

Before launching a new ranker, verify both offline metrics (candidate recall, reranker NDCG, system NDCG, blocked-item absence, tail latency, and impression-to-outcome join integrity) and then run a live randomized A/B test as covered in [Experiment Design and A/B Testing](/learn/experiment-design-ab-testing).[^kohavi2020] Randomize at the user/developer level (`developer_id`) so repeated searches by one person stay in the same arm, and pair engagement metrics (CTR) with task resolution and bad-result guardrails so clickbait never wins an experiment.

## Common ranking failure modes and debugging

| Symptom | Probable cause | Fix |
| --- | --- | --- |
| High reranker NDCG yet key docs missing | Retrieval lost candidate recall | Track candidate recall and system NDCG alongside reranker NDCG |
| Restricted document appears in results | Stale or bypassed eligibility filter | Filter before retrieval and re-check live permissions at render |
| Popular items crowd out everything else | Position-bias feedback loop | Log impressions, estimate propensities, and add controlled exploration |
| IPS-weighted training becomes noisy | Tiny propensities inflate $1/p_k$ | Clip inverse weights and validate the bias-variance trade-off |
| CTR climbs while user satisfaction drops | Clickbait objective mismatch | Optimize for task resolution and add negative-feedback guardrails |

## Try changing one assumption

Run four quick mental (or code) perturbations on our pipeline:

1. **Tighten candidate budget to $k = 4$:** `sdk-example` is dropped (`recall = 2/3`). Reranker NDCG@3 stays `1.000`, while system NDCG@3 drops to `0.856`.
2. **Swap `api-guide` (grade 3) and `retry-guide` (grade 2):** Candidate recall stays `1.000`, while NDCG@3 drops to `0.858` because demoting the grade-3 item hurts more than promoting the grade-2 item helps.
3. **Flip the RankNet pair preference:** Feature difference negates to `[-0.63, 0.09]`, reversing the weight update to `[-0.1575, 0.0225]`.
4. **Emit an orphan click or duplicate `event_id`:** Join checks catch unlogged impressions, while deduplication catches double-counted click events.

```mastery-quiz
[
  {
    "question": "An eligible judgment universe has grades P:0, Q:2, R:3, S:1, T:0. Retrieval returns only P, Q, T, and the reranker puts Q first. Using exponential gain (2^rel - 1) and log2(rank + 1) discount at k = 3, what candidate recall, local reranker NDCG@3, and system NDCG@3 follow?",
    "options": [
      "Recall 1/3; local 1.000; system 1.000.",
      "Recall 1/3; local 1.000; system 3 / (7 + 3/log2(3) + 1/2).",
      "Recall 2/3; local 1.000; system 3 / (7 + 3/log2(3) + 1/2).",
      "Recall 1/3; local 3 / (7 + 3/log2(3) + 1/2); system 1.000."
    ],
    "answer": "Recall 1/3; local 1.000; system 3 / (7 + 3/log2(3) + 1/2).",
    "explanation": "Only Q survives out of three relevant items (Q, R, S), so recall = 1/3. Ordering [Q, P, T] is optimal among survivors (local NDCG@3 = 1.0), whereas system IDCG@3 uses [R, Q, S] = 7 + 3/log2(3) + 1/2, exposing the retrieval loss (~0.319)."
  },
  {
    "question": "Two query lists have grades A = [0, 3, 2, 0] and B = [2, 0, 0, 3]. Evaluated at cutoff k = 3 (RR targets grade 3; AP counts grades >= 2 with denominator min(R, 3) where R = 2), what MRR@3 and MAP@3 follow?",
    "options": [
      "MRR 3/8; MAP 13/24.",
      "MRR 1/4; MAP 7/12.",
      "MRR 1/2; MAP 13/24.",
      "MRR 1/4; MAP 13/24."
    ],
    "answer": "MRR 1/4; MAP 13/24.",
    "explanation": "In the top 3, A hits grade 3 at rank 2 (RR = 1/2) while B misses it (RR = 0), so MRR@3 = 1/4. AP@3 is (1/2 + 2/3)/2 = 7/12 for A and (1/1)/2 = 1/2 for B, averaging 13/24."
  },
  {
    "question": "For x0 = [1, 2], xl = [3, 4], and bias b = [0.5, -1], compare DCN-v1 (w = [0, 1]) and DCN-v2 (W = I). What outputs follow?",
    "options": [
      "DCN-v1 [7.5, 10]; DCN-v2 [6.5, 11].",
      "DCN-v1 [7.5, 11]; DCN-v2 [6.5, 11].",
      "DCN-v1 [7.5, 11]; DCN-v2 [6.5, 10].",
      "DCN-v1 [7.5, 10]; DCN-v2 [6.5, 10]."
    ],
    "answer": "DCN-v1 [7.5, 11]; DCN-v2 [6.5, 10].",
    "explanation": "In DCN-v1, xl @ w = 4, so [1, 2]*4 + [0.5, -1] + [3, 4] = [7.5, 11]. In DCN-v2, W*xl + b = [3.5, 3], so [1, 2] * [3.5, 3] + [3, 4] = [6.5, 10]."
  },
  {
    "question": "A zero-weight linear RankNet model compares preferred features [0.8, 0.2] with other features [0.2, 0.6] using sigma = 1 and learning rate 0.4. Compare the new score gap after an unweighted step versus a step multiplied by |delta NDCG| = 0.2.",
    "options": [
      "Unweighted 0.104; weighted 0.0208.",
      "Unweighted 0.104; weighted 0.5200.",
      "Unweighted -0.104; weighted -0.0208.",
      "Unweighted 0.026; weighted 0.0052."
    ],
    "answer": "Unweighted 0.104; weighted 0.0208.",
    "explanation": "Feature diff is [0.6, -0.4], zero-gap derivative is -0.5, so gradient is [-0.3, 0.2]. Stepping by 0.4 gives w = [0.12, -0.08] and score gap 0.12*0.6 + (-0.08)*(-0.4) = 0.104. Scaling by 0.2 yields 0.0208."
  },
  {
    "question": "Raw CTRs at slots 1 and 2 are 0.18 and 0.09 with examination propensities 0.6 and 0.3. Separately, a deep slot has p = 0.05, true relevance R = 0.4, and IPS weight clipped at 4. What are the IPS-corrected rates and the expected clipped contribution per impression?",
    "options": [
      "Corrected [0.3, 0.3]; clipped expectation 0.08.",
      "Corrected [0.18, 0.18]; clipped expectation 0.40.",
      "Corrected [0.3, 0.3]; clipped expectation 0.40.",
      "Corrected [0.18, 0.18]; clipped expectation 0.08."
    ],
    "answer": "Corrected [0.3, 0.3]; clipped expectation 0.08.",
    "explanation": "Dividing 0.18/0.6 and 0.09/0.3 gives [0.3, 0.3]. In the deep slot, click probability is 0.05 * 0.4 = 0.02; multiplying by clipped weight 4 yields expected contribution 0.08 (down from unbiased 0.40)."
  },
  {
    "question": "Documents rank in order A1, A2, A3, A4, B1, B2, C1 (leading letter = source). Greedily fill 3 slots allowing at most 2 per source after permission for A1 is revoked. Which slate results?",
    "options": [
      "A1, A2, B1.",
      "A2, B1, C1.",
      "A2, A3, B1.",
      "A2, A3, A4."
    ],
    "answer": "A2, A3, B1.",
    "explanation": "Excluding revoked A1 leaves A2 and A3 to fill source A's cap of 2; A4 is skipped, and B1 takes slot 3."
  },
  {
    "question": "In a developer-randomized search A/B test, Developer 1 resolves 2/2 sessions and Developer 2 resolves 1/8 sessions. What are the equal-developer mean resolution rate and the pooled session resolution rate?",
    "options": [
      "Developer 0.3000; pooled 0.3000.",
      "Developer 0.5625; pooled 0.5625.",
      "Developer 0.7500; pooled 0.3000.",
      "Developer 0.5625; pooled 0.3000."
    ],
    "answer": "Developer 0.5625; pooled 0.3000.",
    "explanation": "Averaging per-developer rates gives (1.0 + 0.125) / 2 = 0.5625, while pooling sessions gives (2 + 1) / (2 + 8) = 0.3000."
  }
]
```

> **Next:** Continue to [Forecasting and Anomaly Detection](/learn/forecasting-anomaly-detection). Ranking scores a slate for one request. Next you'll predict values that unfold over time and tell a repeating weekly pattern apart from a real operational surprise.
