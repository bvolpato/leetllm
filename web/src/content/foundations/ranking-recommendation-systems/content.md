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
  "shortDescription": "When a developer searches for a retry idempotency key, a private draft can outscore the runbook, so eligibility, retrieval, and ranking stay separate decisions.",
  "keyConceptsTested": ["candidate generation", "pairwise ranking loss", "NDCG", "two-tower recommendation", "position bias", "implicit feedback", "online experimentation"]
}
---

A developer searches a documentation portal for `retry idempotency key`. One matching document is a private postmortem draft, another is a deprecated v1 migration guide, and a third is an active, production-tested runbook buried on page two. Showing the private draft leaks confidential incident data. Missing the runbook leaves the developer stuck reading stale code.

Which documents may this developer see, which can we retrieve within the service's measured budget, and which survivor deserves the top slot? In single-item classification, a model scores each row independently: flag or pass. In ranking and recommendation systems, presentation order influences what developers see, click, and trust. A recommendation feed can use the same broad funnel without a typed query: user history, role, and session context supply request features.

## Separate eligibility, retrieval, and ranking

Suppose your portal indexes one million documents. Running a costly joint query-document model on every row for every keystroke is usually impractical. A multi-stage design reduces candidate volume so later scorers can spend more compute per item. The counts below illustrate one design. Measure end-to-end latency under representative load, including authorization, retrieval, networking, queueing, and rendering.

<figure>
  <img src="illustrations/_generated/ranking_funnel_dark.png" alt="A horizontal log-scale chart traces a document pool through four shrinking stages: 1,000,000 eligible documents, 1,000 retrieved candidates, 100 scored items, and a final slate of 10." />
  <figcaption>One representative search funnel shrinks a million eligible documents down to ten displayed results. The worked lab below uses a seven-document corpus and a hand-written scorer so every arithmetic step stays transparent.</figcaption>
</figure>

1. **Eligibility:** Enforce access, tenancy, deletion, and product-specific freshness rules independently of learned scores. For this example design, suppose one million documents remain eligible. Filtering may be integrated with retrieval, and permissions must still be current at disclosure.
2. **Candidate retrieval (1,000,000 to 1,000):** Retrieve a shortlist using lexical indexes, precomputed vectors, or their combination. Measure **candidate recall** and request cost: a relevant item dropped here can't be recovered by a ranker restricted to this set. Approximate vector search adds its own speed/recall trade-off.
3. **Scoring (1,000 to 100):** Use query-document interactions, user affinities, and available context. DCN supplies a feature-interaction architecture; its loss is a separate choice. LambdaMART uses metric-weighted training updates. Neither guarantees the best final slate.
4. **Final slate (100 to 10):** Apply deduplication and any declared source-diversity constraints, then recheck hard filtering rules. Freshness boosts or sponsored placement are product choices, not universal stages. A diversity constraint can lower unconstrained relevance metrics while satisfying product requirements.

A document that never enters the candidate set cannot be rescued by even the most accurate downstream ranker. In this lab, we filter unauthorized and stale documents prior to candidate generation, though production search engines often integrate metadata predicates directly into index traversal. Regardless of where filtering happens, a high relevance score must never authorize disclosure, so permissions must still be checked against current access state at serving time.

To inspect every stage of ranking arithmetic directly, we begin with a small seven-document corpus carrying hand-assigned scores and offline relevance judgments. Here `relevance` serves solely as the evaluation target for this fixed query: `0` means the document gives no answer, `2` marks useful guidance, and `3` marks a direct answer (while `1` would indicate marginal utility, though none of these rows uses it). Those human labels belong strictly to offline training and evaluation, never to serving features, whereas the two Boolean eligibility fields stand in for request-time access and freshness checks.

<!-- leetllm: test, output=show, id=ranking-lab, deps=numpy,scipy,scikit-learn -->
```python title="build-doc-search-corpus.py"
from hashlib import sha256
from json import dumps
import numpy as np


query = "retry idempotency key"
corpus = [
    {"id": "api-guide", "title": "retry idempotency API guide", "current": True, "permitted": True, "retrieval": 0.96, "query_fit": 0.98, "reliability": 0.88, "relevance": 3},
    {"id": "blog-post", "title": "general release blog", "current": True, "permitted": True, "retrieval": 0.91, "query_fit": 0.35, "reliability": 0.97, "relevance": 0},
    {"id": "legacy-changelog", "title": "legacy changelog", "current": True, "permitted": True, "retrieval": 0.90, "query_fit": 0.15, "reliability": 0.99, "relevance": 0},
    {"id": "retry-runbook", "title": "HTTP retry strategy runbook", "current": True, "permitted": True, "retrieval": 0.84, "query_fit": 0.92, "reliability": 0.98, "relevance": 2},
    {"id": "sdk-example", "title": "idempotency SDK example", "current": True, "permitted": True, "retrieval": 0.80, "query_fit": 0.86, "reliability": 0.96, "relevance": 2},
    {"id": "private-draft", "title": "private retry incident draft", "current": True, "permitted": False, "retrieval": 0.99, "query_fit": 0.99, "reliability": 0.99, "relevance": 3},
    {"id": "stale-guide", "title": "stale retry migration guide", "current": False, "permitted": True, "retrieval": 0.95, "query_fit": 0.94, "reliability": 0.70, "relevance": 2},
]

grades = np.array([item["relevance"] for item in corpus], dtype=int)
print("corpus rows:", len(corpus))
print("query:", query)
print("relevance grades:", grades.tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
corpus rows: 7
query: retry idempotency key
relevance grades: [3, 0, 0, 2, 2, 3, 2]
```
<!-- leetllm: output:end -->

The corpus includes a private draft (`permitted=False`) and a stale guide (`current=False`) that must be excluded before candidate scoring, because a high relevance score must never override access or freshness rules. Filtering on those two Boolean masks leaves five eligible documents. Notice that the two excluded rows carry the strongest retrieval and query-fit signals in the table, which illustrates why eligibility enforcement cannot be left to learned ranking weights.

<!-- leetllm: test, output=show, continue=ranking-lab, id=eligibility-filter, deps=numpy,scipy,scikit-learn -->
```python title="filter-eligible-docs.py"
import numpy as np

eligible_mask = np.array([item["current"] and item["permitted"] for item in corpus], dtype=bool)
eligible = [item for item, keep in zip(corpus, eligible_mask) if keep]
blocked = sorted(item["id"] for item, keep in zip(corpus, eligible_mask) if not keep)

print("eligible:", [item["id"] for item in eligible])
print("blocked:", blocked)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
eligible: ['api-guide', 'blog-post', 'legacy-changelog', 'retry-runbook', 'sdk-example']
blocked: ['private-draft', 'stale-guide']
```
<!-- leetllm: output:end -->

## Measure candidate recall before ordering quality

Candidate generation is the fast first-stage filter that narrows the eligible pool before expensive scoring runs. This lab uses a precomputed `retrieval` score so the boundary between retrieval and ranking stays transparent, playing the same role that BM25, dense similarity, or a fused shortlist played in [Core Retrieval Algorithms](/learn/core-retrieval-algorithms). That interface follows a single discipline: recover the relevant documents first, then spend compute ordering them. Because the judged relevant eligible documents are `api-guide`, `retry-runbook`, and `sdk-example`, we can compare candidate survival directly at cutoffs `k=3` and `k=5`.

<!-- leetllm: test, output=show, continue=eligibility-filter, id=candidate-recall, deps=numpy,scipy,scikit-learn -->
```python title="measure-candidate-recall.py"
import numpy as np

relevant_ids = {
    item["id"]
    for item in eligible
    if item["relevance"] > 0
}


def candidates_at(limit):
    if limit < 0:
        raise ValueError("candidate limit must be nonnegative")
    scores = np.array([item["retrieval"] for item in eligible], dtype=float)
    ids = np.array([item["id"] for item in eligible])
    order = np.lexsort((ids, -scores))
    return [eligible[idx] for idx in order[:limit]]


def candidate_recall(items):
    if not relevant_ids:
        raise ValueError("recall needs at least one judged relevant eligible item")
    returned = np.array([item["id"] for item in items])
    hits = np.isin(list(relevant_ids), returned).sum()
    return float(hits / len(relevant_ids))


for limit in (3, 5):
    items = candidates_at(limit)
    print(
        f"k={limit} ids={[item['id'] for item in items]} "
        f"recall={candidate_recall(items):.3f}"
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
k=3 ids=['api-guide', 'blog-post', 'legacy-changelog'] recall=0.333
k=5 ids=['api-guide', 'blog-post', 'legacy-changelog', 'retry-runbook', 'sdk-example'] recall=1.000
```
<!-- leetllm: output:end -->

At `k=3`, retrieval retains only one of the three relevant eligible documents because `blog-post` and `legacy-changelog` outscore `retry-runbook` and `sdk-example` on the coarse `retrieval` signal. Since the downstream reranker sees only what enters the shortlist, no ranking model can recover those two missed guides once `k=3` truncates them. Raising the candidate budget to `5` restores full candidate recall (`1.000`) before the heavier scorer runs, shifting our problem from coverage to ordering those five survivors.

```checkpoint
The relevant item never enters the top-100 candidate set. Can a more accurate reranker place it first?
---
No. Ranking can reorder only retrieved candidates. Fix candidate recall before interpreting downstream ordering metrics.
```

## Rerank the surviving candidates

Keep all five surviving candidates so nothing relevant is missing from the pool. On retrieval scores alone, `blog-post` and `legacy-changelog` sit in positions 2 and 3 even though their `query_fit` for idempotency keys is weak (`0.35` and `0.15`). A second-stage scorer combines `query_fit` (matching the specific query intent) with `reliability` (source trustworthiness) as normalized `[0, 1]` signals; neither signal reads the offline `relevance` target, and their weighted sum is an uncalibrated ranking score rather than a probability.

<!-- leetllm: test, output=show, continue=candidate-recall, id=reranked-slate, deps=numpy,scipy,scikit-learn -->
```python title="score-and-rerank.py"
import numpy as np

candidates = candidates_at(5)
scorer_weights = np.array([2.0, 0.6])


def rank_score(item):
    features = np.array([item["query_fit"], item["reliability"]], dtype=float)
    return float(features @ scorer_weights)


cand_scores = np.array([rank_score(item) for item in candidates])
cand_ids = np.array([item["id"] for item in candidates])
ranked = [candidates[idx] for idx in np.lexsort((cand_ids, -cand_scores))]

print("retrieval order:", [item["id"] for item in candidates])
print("ranked order:", [item["id"] for item in ranked])
print("rank scores:", [(item["id"], round(rank_score(item), 3)) for item in ranked])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
retrieval order: ['api-guide', 'blog-post', 'legacy-changelog', 'retry-runbook', 'sdk-example']
ranked order: ['api-guide', 'retry-runbook', 'sdk-example', 'blog-post', 'legacy-changelog']
rank scores: [('api-guide', 2.488), ('retry-runbook', 2.428), ('sdk-example', 2.296), ('blog-post', 1.282), ('legacy-changelog', 0.894)]
```
<!-- leetllm: output:end -->

A learned scorer can estimate weights or nonlinear interactions directly from labeled examples, while keeping the request pipeline intact: retrieve candidates, score the bounded shortlist, and enforce final-slate constraints. Always hold evaluation queries out of training and tuning, since fitting weights on these five rows would merely memorize this single example. With both orders of the same five documents in hand, we now need quantitative metrics to tell how much better the reranked order really is.

## Evaluate rank order with DCG, NDCG, MRR, and MAP

A classifier's accuracy doesn't care which mistakes you made first. A ranked list does. Putting the best document first is a much bigger win than sliding it from position 40 to position 39. To evaluate lists rigorously, ranking systems use position-discounted metrics.

### Graded relevance and logarithmic discounting (DCG and NDCG)

The API guide has grade `3`, while the runbook has grade `2`. Exponential gain values those grades as $2^{rel} - 1$, producing gains of `7` and `3`. At rank 1 the full gain counts. This DCG convention uses the logarithmic discount $\frac{1}{\log_2(i+1)}$ to value earlier results more. The discount is a metric design choice; measuring examination probability for this portal requires user-study data:

| Rank Position $i$ | Discount Denominator $\log_2(i+1)$ | Position Multiplier |
| --- | --- | --- |
| 1 | $\log_2(2) = 1.000$ | 1.000 |
| 2 | $\log_2(3) \approx 1.585$ | 0.631 |
| 3 | $\log_2(4) = 2.000$ | 0.500 |
| 4 | $\log_2(5) \approx 2.322$ | 0.431 |
| 5 | $\log_2(6) \approx 2.585$ | 0.387 |

**Discounted Cumulative Gain** (DCG) sums those discounted gains across the top $k$ items:

$$
\text{DCG@k} = \sum_{i=1}^{k} \frac{2^{rel_i} - 1}{\log_2(i+1)}
$$

Here $rel_i$ is the judged relevance grade at position $i$, counting from 1. This exponential-gain form rewards finding direct answers early.[^manning2008ir] Linear gain would use $rel_i$ instead of $2^{rel_i}-1$; both agree for binary labels $\{0, 1\}$, but exponential gain separates grade 3 answers from grade 2 guides.

Because raw DCG sums grow automatically with the number of relevant documents a query happens to have, comparing unnormalized DCG across distinct queries mixes ordering skill with query difficulty. **Normalized DCG** (NDCG) fixes that scale mismatch by dividing DCG@k by the Ideal DCG (IDCG@k) achieved by sorting all eligible judged documents in descending grade order:

$$
\text{NDCG@k} = \frac{\text{DCG@k}}{\text{IDCG@k}} \in [0, 1]
$$

For our retrieval order `[3, 0, 0, 2, 2]`, the two grade-0 items contribute nothing while the grade-3 answer at slot 1 and the two grade-2 guides at slots 4 and 5 produce the discounted total:

$$
\begin{align*}
\text{DCG@5}
&= \frac{7}{\log_2 2} + 0 + 0 + \frac{3}{\log_2 5} + \frac{3}{\log_2 6} \\
&\approx 7 + 0 + 0 + 1.292 + 1.161 = 9.453
\end{align*}
$$

Sorting those same five candidate grades into the ideal order `[3, 2, 2, 0, 0]` puts the two grade-2 guides in slots 2 and 3, raising the best achievable score to:

$$
\text{IDCG@5} = 7 + \frac{3}{\log_2 3} + \frac{3}{\log_2 4} \approx 7 + 1.893 + 1.500 = 10.393
$$

Dividing $9.453$ by $10.393$ gives a retrieval-order NDCG@5 of about $0.910$. Always construct the ideal list from the complete judged candidate pool *before* truncating to $k$, because truncating first can silently discard relevant documents sitting below position $k$ and inflate the normalized ratio.

### Single-target and binary metrics: MRR and MAP

Different user journeys place very different penalties on missing or buried results, so no single list metric fits every product surface:

- **Mean Reciprocal Rank (MRR):** In navigational search or command-palette queries, the developer wants exactly one target (such as the login page or API root). MRR evaluates only the rank of the *first* relevant document:

$$
\text{RR} = \frac{1}{\text{rank}_{\text{first}}}, \qquad \text{MRR} = \frac{1}{|Q|} \sum_{q=1}^{|Q|} \frac{1}{\text{rank}_q}
$$

Notice how reciprocal discounting $\frac{1}{i}$ drops far more sharply than logarithmic discounting: rank 2 receives $0.50$, rank 3 receives $0.33$, and rank 5 falls to $0.20$. That steep curve matches a navigational intent where finding one canonical entry fast matters far more than surfacing secondary guides.

- **Mean Average Precision (MAP@k):** For informational queries with binary relevance labels ($\{0, 1\}$), MAP rewards putting all relevant documents near the top with high precision density:

$$
\text{AP@k} = \frac{1}{\min(R, k)} \sum_{i=1}^{k} P@i \cdot \mathbb{I}(\text{doc}_i \text{ is relevant})
$$

Here $P@i$ denotes precision at rank $i$, while $R$ counts relevant documents in the declared judgment universe. Notice that this lab caps the denominator at $\min(R,k)$, whereas another common definition retains $R$ even at a cutoff so unretrieved relevant items always count against the score; because full-list AP awards zero credit to relevant documents omitted from the list, always declare your denominator convention before comparing numbers across reports.[^manning2008ir]

Both RR and AP evaluate a single query, while MRR and MAP average those single-query values across a declared query benchmark with explicit query weights. In this lab's worked example, RR treats only grade 3 as a target and AP counts grades 2 and above as relevant, while candidate recall accepts any positive grade; those choices match on our seven rows because no grade-1 item exists, though they would diverge as soon as marginal items appear. Notice also that an absent RR target scores zero, and our code assigns zero when a query has no relevant documents at all, another edge-case convention worth documenting explicitly.

<!-- leetllm: test, output=show, continue=reranked-slate, id=ndcg-metric, deps=numpy,scipy,scikit-learn -->
```python title="compare-ndcg.py"
import numpy as np
from sklearn.metrics import ndcg_score


def dcg(relevances):
    rel = np.asarray(relevances, dtype=float)
    if rel.size == 0:
        return 0.0
    discounts = np.log2(np.arange(2, rel.size + 2))
    return float(np.sum((2.0**rel - 1.0) / discounts))


def reranker_ndcg(items, limit):
    if limit <= 0:
        raise ValueError("evaluation cutoff must be positive")
    if len({item["id"] for item in items}) != len(items):
        raise ValueError("duplicate document IDs would double-count gain")
    relevances = np.array([item["relevance"] for item in items[:limit]], dtype=float)
    if np.any(relevances < 0):
        raise ValueError("relevance grades must be nonnegative")
    ideal = np.sort(np.array([item["relevance"] for item in items], dtype=float))[::-1][:limit]
    best = dcg(ideal)
    return dcg(relevances) / best if best else 0.0


def reciprocal_rank(items, target_grade=3):
    grades = np.array([item["relevance"] for item in items])
    hits = np.flatnonzero(grades >= target_grade)
    return float(1.0 / (hits[0] + 1)) if hits.size else 0.0


def average_precision(items, threshold=2, limit=5):
    if limit <= 0:
        raise ValueError("evaluation cutoff must be positive")
    rel = (np.array([item["relevance"] for item in items[:limit]]) >= threshold).astype(float)
    total_rel = int(np.sum(np.array([item["relevance"] for item in items]) >= threshold))
    if not total_rel:
        return 0.0
    precisions = np.cumsum(rel) / np.arange(1, rel.size + 1)
    return float(np.sum(precisions * rel) / min(total_rel, limit))


# Cross-check exponential-gain NDCG@5 against scikit-learn on position-descending scores
sklearn_cand_ndcg = float(
    ndcg_score(
        np.array([[2**item["relevance"] - 1 for item in candidates]]),
        np.arange(len(candidates), 0, -1, dtype=float)[None, :],
        k=5,
        ignore_ties=True,
    )
)
assert np.isclose(reranker_ndcg(candidates, 5), sklearn_cand_ndcg)

print("retrieval-order ndcg@5:", f"{reranker_ndcg(candidates, 5):.3f}")
print("ranked-order ndcg@5:", f"{reranker_ndcg(ranked, 5):.3f}")
print("retrieval-order rr:", f"{reciprocal_rank(candidates):.3f}", "ap@5:", f"{average_precision(candidates):.3f}")
print("ranked-order rr:", f"{reciprocal_rank(ranked):.3f}", "ap@5:", f"{average_precision(ranked):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
retrieval-order ndcg@5: 0.910
ranked-order ndcg@5: 1.000
retrieval-order rr: 1.000 ap@5: 0.700
ranked-order rr: 1.000 ap@5: 1.000
```
<!-- leetllm: output:end -->

Retrieval order already earns RR `1.000` because its single grade-3 answer lands at slot 1, yet AP@5 sits at `0.700` and NDCG@5 at `0.910` because two irrelevant pages separate it from `retry-runbook` and `sdk-example`. Reordering by the hand-written scorer achieves ideal rank order (`1.000` on both AP@5 and NDCG@5) on this example, though true generalization still requires held-out queries. Look closely at how cutoff denominator conventions behave when two relevant documents exist and only one slot is displayed: even with perfect top-slot precision (`P@1 = 1.0`), capping the denominator at `min(R, k)` produces AP@1 of `1.0`, whereas keeping the full universe count `R = 2` yields `0.5`:

<!-- leetllm: test, output=show, continue=ndcg-metric, id=ap-conventions, deps=numpy,scipy,scikit-learn -->
```python title="compare-cutoff-ap-conventions.py"
import numpy as np

two_relevant = [{"id": "a", "relevance": 2}, {"id": "b", "relevance": 2}]
top_slot_precision = np.array([1.0])
print("capped-denominator AP@1:", average_precision(two_relevant, limit=1))
print("full-R-denominator AP@1:", float(top_slot_precision.sum() / len(two_relevant)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
capped-denominator AP@1: 1.0
full-R-denominator AP@1: 0.5
```
<!-- leetllm: output:end -->

Neither number reflects a bug, because the two denominators measure distinct properties of a ranked list. Our `average_precision` helper counts relevant items present in its supplied shortlist, which measures how tightly a reranker packs surviving candidates at the top. A whole-system AP metric, by contrast, draws `R` from the full eligible judgment universe so dropped candidates penalize the final score directly, much like whole-system NDCG does below.

### Reranker NDCG versus whole-system NDCG

So far we have evaluated **reranker NDCG** strictly over items that survived retrieval. Candidate recall tracks omissions before ranking, while reranker NDCG isolates ordering quality inside that bounded shortlist. To penalize upstream retrieval misses inside one end-to-end score, **system NDCG** constructs its ideal DCG denominator over the full eligible judged corpus instead, exposing truncation losses that local ranking metrics hide:

<!-- leetllm: test, output=show, continue=ap-conventions, id=system-vs-reranker-ndcg, deps=numpy,scipy,scikit-learn -->
```python title="compare-system-and-reranker-ndcg.py"
import numpy as np


def system_ndcg(items, eligible_items, limit):
    reranker_ndcg(items, limit)
    reranker_ndcg(eligible_items, limit)
    judged = {item["id"]: item["relevance"] for item in eligible_items}
    if any(item["id"] not in judged or item["relevance"] != judged[item["id"]] for item in items):
        raise ValueError("results must use the eligible corpus and its static judgments")
    relevances = np.array([item["relevance"] for item in items[:limit]], dtype=float)
    ideal = np.sort(np.array([item["relevance"] for item in eligible_items], dtype=float))[::-1][:limit]
    best = dcg(ideal)
    return dcg(relevances) / best if best else 0.0


tight = candidates_at(3)
tight_scores = np.array([rank_score(item) for item in tight])
tight_ids = np.array([item["id"] for item in tight])
tight_ranked = [tight[idx] for idx in np.lexsort((tight_ids, -tight_scores))]

print("k=3 survivors:", [item["id"] for item in tight_ranked])
print("k=3 grades:", [item["relevance"] for item in tight_ranked])
print("k=3 reranker ndcg:", f"{reranker_ndcg(tight_ranked, 3):.3f}")
print("k=3 system ndcg:", f"{system_ndcg(tight_ranked, eligible, 3):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
k=3 survivors: ['api-guide', 'blog-post', 'legacy-changelog']
k=3 grades: [3, 0, 0]
k=3 reranker ndcg: 1.000
k=3 system ndcg: 0.674
```
<!-- leetllm: output:end -->

At `k=3`, placing `api-guide` ahead of the two grade-0 documents gives a perfect reranker NDCG of `1.000` only because the denominator considers those three survivors alone. Whole-system NDCG falls to `0.674` because the ideal top three across the eligible corpus has grades `[3, 2, 2]` and two relevant documents were dropped before the ranker ran. In real collections, incomplete relevance labels, shifting eligibility, or evaluation rules that treat unjudged documents as irrelevant shift these denominators further, so always record the judgment coverage and snapshot version rather than mistaking a high judged score for proof of user value or authorization.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Side-by-side comparison of candidate budgets k=3 and k=5 at cutoff NDCG@3: a table shows grades [3, 0, 0] for k=3 versus [3, 2, 2] for k=5, and grouped bars compare candidate recall (0.333 vs 1.000), local reranker NDCG@3 (1.000 vs 1.000), and system NDCG@3 (0.674 vs 1.000)." />
  <figcaption>Comparing candidate budgets <code>k=3</code> and <code>k=5</code> at cutoff <code>NDCG@3</code>: at <code>k=3</code>, perfect local reranking (<code>1.000</code>) conceals the two omitted grade-2 guides, dragging whole-system <code>NDCG@3</code> down to <code>0.674</code>.</figcaption>
</figure>

```checkpoint
Why does normalized discounted cumulative gain (NDCG) penalize moving a relevant item from rank 1 to rank 10?
---
Discounted cumulative gain gives earlier positions more weight through a logarithmic discount. NDCG then divides by the ideal ordering, making the score comparable across queries with different relevance sets.
```

## Two-tower retrieval and feature interaction networks

How can the first stage search a million documents without running the heavy ranker on each one? The core architectural move is hoisting expensive representation compute out of the live request path. In a **two-tower architecture**,[^huang2013] a query tower encodes the live query or session context into a vector $u(q) \in \mathbb{R}^d$, while a separate item tower maps each document to an independent vector $v(i) \in \mathbb{R}^d$ whose similarity is measured by inner product $\langle u(q), v(i) \rangle$ or cosine similarity.

Because the item tower doesn't depend on the current query, item vectors can be precomputed and searched with an ANN index, such as an HNSW graph or ScaNN. HNSW and ScaNN aren't themselves databases; match the index's distance metric to training, since normalized dot product equals cosine similarity while unnormalized dot product depends on magnitude as well. A dot-product serving path encodes the query once and executes approximate maximum-inner-product search, though real index recall, freshness, and latency must still be measured empirically rather than inferred from theory.[^tensorflow2026retrieval]

The vectors must be learned or supplied by a suitable pretrained encoder. A common retrieval objective pushes observed positive query-item pairs above sampled negatives, remembering that unobserved negatives are not verified dislikes. TFRS's reference implementation follows this pattern by training on positive pairs and evaluating against a full candidate catalog.[^tensorflow2026retrieval] Whenever you retrain an encoder or alter vector normalization, rebuild the indexed item vectors together so query and item spaces remain compatible.

### The cross-feature bottleneck

Two-tower similarity can even serve as a final ranker when its quality and cost fit the application. Its fundamental restriction is structural independence: each tower encodes its input without seeing the other, so only the final dot product couples query and item. Whenever fine-grained matching matters, a joint scorer models early query-document interactions at higher per-candidate request cost. An early **cross-feature** mixes query and item tokens before producing a score, as in a joint transformer where attention spans both inputs; parts of the document can sometimes be cached, yet the full joint representation still shifts with every query. Restricting that joint scorer to a bounded shortlist keeps total work manageable, though wall-clock latency still depends on sequence lengths, batching, hardware, and request concurrency rather than candidate count alone.

### Deep and cross networks for heavy ranking

For tabular and sparse-plus-dense ranking features, **Deep & Cross Networks** learn explicit bounded-degree feature crosses alongside an implicit neural network. The family evolved from DCN's original vector cross layer to DCN-v2's expressive matrix layer.[^wang2017dcn][^wang2021dcnv2] Both architectures typically concatenate embedded categorical features with dense query, item, and context signals into $x_0 = [x_{\text{query}}, x_{\text{item}}, x_{\text{context}}] \in \mathbb{R}^D$, wiring the cross and deep branches either in parallel or stacked in series.[^wang2021dcnv2]

1. **Cross network:** The original vector-parameterized layer updates as:

$$
x_{l+1} = x_0 x_l^T w_l + b_l + x_l
$$

Here $w_l,b_l\in\mathbb{R}^D$, and after $L$ stacked layers the highest polynomial feature degree reaches $L+1$. Because parameters are shared across coordinates, the vector layer cannot tune every individual feature cross independently.[^wang2017dcn] Collapsing the inner dot product to a scalar executes one layer in $O(D)$ arithmetic, whereas DCN-v2 replaces that vector weight with a full matrix and elementwise multiplication $\odot$:

$$
x_{l+1}=x_0\odot(W_lx_l+b_l)+x_l,\qquad W_l\in\mathbb{R}^{D\times D}
$$

That dense matrix raises per-layer arithmetic complexity to $O(D^2)$. Factoring $W_l=U_lV_l^T$ with rank $r$ restores roughly $O(Dr)$ arithmetic (plus expert gating in mixture-of-experts variants). Actual serving speed still depends on hardware utilization and batch layout rather than FLOP counts alone.[^wang2021dcnv2]

2. **Deep network:** Paired with the cross branch, a standard feed-forward multilayer perceptron with ReLU or GeLU activations learns smooth, higher-order nonlinear combinations that explicit low-degree polynomials may miss. In a binary click model, concatenating the cross and deep outputs into a sigmoid head with log loss predicts click odds, though other heads predict grades or continuous utilities, and the DCN architecture alone optimizes neither NDCG nor position-debiased relevance without an appropriate loss and target.[^tensorflow2026dcn]

<!-- leetllm: test, output=show, id=two-tower-precompute, deps=numpy -->
```python title="two-tower-vs-cross-feature.py"
import numpy as np

rng = np.random.default_rng(42)
n_items = 1_000
dim = 16
candidate_budget = 5

# Precomputed item-tower embeddings indexed before query arrival.
doc_embeddings = rng.normal(0.0, 1.0, size=(n_items, dim))
query_embedding = rng.normal(0.0, 1.0, size=dim)

# Exact inner product stands in for an ANN lookup in this small lab.
retrieval_scores = doc_embeddings @ query_embedding
item_indices = np.arange(n_items)
candidate_ids = np.lexsort((item_indices, -retrieval_scores))[:candidate_budget]


def dcn_cross_layer(x_0, x_l, weight, bias):
    # x_{l+1} = x_0 * (x_l^T w) + b + x_l computed in O(D)
    return x_0 * (x_l @ weight) + bias + x_l


# Original DCN vector layer over concatenated query and item inputs.
w_cross = rng.normal(0.0, 1.0, size=2 * dim)
b_cross = rng.normal(0.0, 1.0, size=2 * dim)
cross_features = np.array([
    dcn_cross_layer(
        np.concatenate([query_embedding, doc_embeddings[item_id]]),
        np.concatenate([query_embedding, doc_embeddings[item_id]]),
        w_cross,
        b_cross,
    )
    for item_id in candidate_ids
])

print("offline item vectors:", doc_embeddings.shape[0])
print("live query vectors:", 1)
print("exact dot products on request:", retrieval_scores.size)
print("expensive candidates routed to DCN:", cross_features.shape[0])
print("DCN output dimension:", cross_features.shape[1])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
offline item vectors: 1000
live query vectors: 1
exact dot products on request: 1000
expensive candidates routed to DCN: 5
DCN output dimension: 32
```
<!-- leetllm: output:end -->

These are random embeddings and cross weights rather than trained encoders or measured relevance, and exact matrix multiplication over 1,000 rows demonstrates the factorization idea without running an ANN index or a latency benchmark. Even on five candidates, an early DCN vector layer entangles query and item coordinates, so the crossed representation for every item must be recomputed whenever the query changes. Comparing the vector layer and the DCN-v2 matrix layer on the same two-dimensional input highlights how their parameterizations and bias placement diverge:

<!-- leetllm: test, output=show, continue=two-tower-precompute, id=dcn-layer-specs, deps=numpy -->
```python title="compare-vector-and-matrix-cross-layers.py"
import numpy as np

x0 = np.array([2.0, 3.0])
xl = np.array([5.0, 7.0])
vector_result = dcn_cross_layer(x0, xl, np.array([1.0, 0.0]), np.array([0.5, 1.0]))


def matrix_cross_layer(x_0, x_l, matrix, bias):
    return x_0 * (matrix @ x_l + bias) + x_l


matrix_result = matrix_cross_layer(x0, xl, np.eye(2), np.array([0.5, 1.0]))
print("original vector layer:", vector_result.tolist())
print("v2 matrix layer:", matrix_result.tolist())

probe_item = np.array([1.0, 2.0])
probe_weight = np.array([0.5, 0.25, 0.5, 0.25])
zero_bias = np.zeros(4)
first = np.concatenate([np.array([0.0, 1.0]), probe_item])
second = np.concatenate([np.array([1.0, 0.0]), probe_item])
item_after_first = dcn_cross_layer(first, first, probe_weight, zero_bias)[2:]
item_after_second = dcn_cross_layer(second, second, probe_weight, zero_bias)[2:]
print("changed query changes crossed item:", not np.allclose(item_after_first, item_after_second))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
original vector layer: [15.5, 23.0]
v2 matrix layer: [16.0, 31.0]
changed query changes crossed item: True
```
<!-- leetllm: output:end -->

Neither layer emits a calibrated probability until a trained scoring head maps its output to a click or utility target, and both helpers assume matching vector dimensions.

### Evaluate a language-model reranker

A language model can also compare a retrieved group directly and output a reordered slate. RankGPT's 2023 study explored identifier permutations over sliding context windows and distilled those rankings into smaller student scorers.[^sun2023rankgpt] Before deploying a language-model reranker, benchmark it against lexical, two-tower, and lightweight cross-encoder baselines on held-out queries for accuracy, cost, and tail latency.

Supply only the query and **eligible** document snippets paired with stable IDs, ask for an exact permutation from most useful to least useful, and treat every text field inside a snippet as untrusted content. Access checks and external-transfer authorization must stay enforced outside the prompt, since model instructions alone never secure boundaries. Even when a response conforms cleanly to an exact permutation check, structural validity still cannot guarantee relevance or ranking quality, as the swapped ordering below demonstrates:

<!-- leetllm: test, output=show, continue=dcn-layer-specs, id=reranker-output-check, deps=numpy -->
```python title="validate-a-proposed-reranker-order.py"
import numpy as np


def validate_order(proposed_ids, candidate_items):
    expected = {item["id"] for item in candidate_items}
    if len(proposed_ids) != len(expected) or set(proposed_ids) != expected:
        raise ValueError("reranker output must be an exact candidate permutation")
    by_id = {item["id"]: item for item in candidate_items}
    return [by_id[item_id] for item_id in proposed_ids]


# Candidate IDs are supplied separately for this independent code chain.
allowed_ids = ["api-guide", "retry-runbook", "sdk-example", "blog-post", "legacy-changelog"]
grades_by_id = {"api-guide": 3, "retry-runbook": 2, "sdk-example": 2, "blog-post": 0, "legacy-changelog": 0}
proposed_ids = ["retry-runbook", "api-guide", "sdk-example", "blog-post", "legacy-changelog"]
candidate_items = [{"id": item_id} for item_id in allowed_ids]
validated = validate_order(proposed_ids, candidate_items)

discounts = np.log2(np.arange(2, 5))
ideal_dcg3 = float(np.sum((2.0 ** np.array([3, 2, 2]) - 1.0) / discounts))
proposed_grades = np.array([grades_by_id[item["id"]] for item in validated[:3]])
proposed_ndcg3 = float(np.sum((2.0 ** proposed_grades - 1.0) / discounts) / ideal_dcg3)

print("valid permutation:", len(validated) == len(candidate_items))
print(f"proposed ndcg@3: {proposed_ndcg3:.3f}")
for invalid in [
    ["private-draft"] + allowed_ids[1:],
    [allowed_ids[0]] + allowed_ids[:-1],
]:
    try:
        validate_order(invalid, candidate_items)
    except ValueError:
        print("invalid candidate permutation rejected:", True)
    else:
        raise AssertionError("invalid permutation was accepted")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
valid permutation: True
proposed ndcg@3: 0.858
invalid candidate permutation rejected: True
invalid candidate permutation rejected: True
```
<!-- leetllm: output:end -->

The accepted permutation swaps the grade-3 guide with the grade-2 runbook, dropping NDCG@3 on the baseline judgments from `1.000` to `0.858`. Structural checks filter out malformed or unauthorized IDs rather than weak orderings, so always recheck live eligibility before rendering results. Specify a deterministic fallback for timeouts or invalid lists, and measure sensitivity to candidate order and adversarial text directly rather than trusting generated rationales.

### What changes for a recommendation feed?

Remove the typed search query while keeping the exact same documentation portal. A developer who has been reading retry guides might benefit next from an idempotency SDK example. In a feed recommender, the request-side tower encodes developer history and session context instead of query text, while the item tower still encodes every document independently for fast ANN lookup.[^tensorflow2026retrieval] Two complementary sources of signal feed that request context, each carrying a classic cold-start limitation:[^google2026recommendationTypes]

| Evidence | Docs-portal example | Missing-data problem |
| --- | --- | --- |
| content-based | recommend a document whose topics resemble those the developer chose | a new developer has little preference history |
| collaborative | learn from developers who used overlapping documents | a new document has no interaction history |

An ID-only user-item embedding model implements collaborative filtering via matrix factorization. Adding document text or metadata features to the item tower allows newly indexed documentation to receive recommendations before accumulating clicks.[^tensorflow2026retrieval] Because aggregate feed metrics are dominated by active users and popular pages, evaluate recommendation quality separately on cold-start users and freshly published guides. Always enforce a strict temporal split during training and offline validation so features never leak future clicks, and remember that an unclicked item often reflects zero exposure rather than negative preference.[^tensorflow2026retrieval]

## Learning to rank: pointwise, pairwise, and listwise

The hand-written scorer ordered five survivors for a single query. Training a learned model requires choosing a loss objective whose target defines what the optimizer can see. That choice falls into three standard families with distinct trade-offs:

| Family | Training target | Loss formulation | Limitation |
| --- | --- | --- | --- |
| pointwise | one item's grade, click, or utility | MSE or binary cross-entropy | A plain unweighted loss doesn't explicitly value rank position; context and weights can still be added |
| pairwise | a preferred item over another within the same query | RankNet logistic loss on $s_i-s_j$ | An unweighted pair with the same score gap has the same score derivative regardless of position |
| listwise | a query's ranked set or list distribution | ListNet/ListMLE-style objectives or differentiable metric surrogates | Requires a declared list/judgment universe; training can use sampled lists |

Notice where LambdaRank and LambdaMART sit in that taxonomy. Both weight **pairs** using changes in a full-list ranking metric, giving them list-metric awareness. Because their updates remain pairwise constructions rather than smooth derivatives of NDCG, grouping them cleanly clarifies how gradient updates are actually computed.[^burges2010lambda]

### The pairwise loss (RankNet)

Pairwise methods such as RankNet train on preference pairs within the same query so a higher-graded document scores above a lower-graded one.[^burges2005ranknet] Rather than fitting absolute grades globally, the objective focuses purely on relative score margins inside each query. For a preferred item $i$ and less relevant item $j$, RankNet maps their score difference $\Delta = s_i - s_j$ through a logistic preference probability and cross-entropy loss:

$$
p_{ij} = \frac{1}{1 + e^{-\Delta}}, \qquad L_{ij} = -\log p_{ij} = \log(1 + e^{-\Delta})
$$

Differentiating with respect to $\Delta$ yields $\frac{\partial L_{ij}}{\partial \Delta} = p_{ij} - 1$. At initialization when both items share the same score ($\Delta = 0$), the preference probability sits at $p_{ij} = 0.5$. The resulting score-gap gradient equals $-0.5$, pushing $s_i$ upward and $s_j$ downward symmetrically.

### Metric-weighted pairs: LambdaRank and LambdaMART

Consider two preferred-versus-other pairs that happen to have **equal score gaps**: plain RankNet assigns both pairs the exact same score-gap derivative even when one swap rescues position 1 while the other nudges position 40, whereas top-heavy metrics like NDCG (and developer satisfaction) value early gains far more strongly. As a function of predicted scores on fixed judgments, NDCG behaves as a piecewise-constant step function that jumps only when items cross order and has zero derivative almost everywhere else, preventing standard gradient descent from optimizing it directly. LambdaRank bridges that gap by constructing surrogate pairwise update signals weighted by the discrete NDCG change produced by swapping each pair.[^burges2010lambda] Scaling the logistic loss by steepness $\sigma > 0$ via $L_{ij} = \log(1 + e^{-\sigma(s_i - s_j)})$ (with $\sigma = 1$ in the RankNet step above) and multiplying its score derivative by $|\Delta\text{NDCG}_{ij}|$ yields the metric-weighted derivative:

$$
\lambda_{ij} = \frac{\partial L_{ij}}{\partial (s_i - s_j)} \cdot |\Delta\text{NDCG}_{ij}| = \frac{-\sigma}{1 + e^{\sigma(s_i - s_j)}} |\Delta\text{NDCG}_{ij}|
$$

<figure>
  <img src="illustrations/_generated/lambdamart_gradients_dark.png" alt="A ranked five-document list shows grades 0, 2, 3, 0, 2. Two highlighted swaps compare the API guide at position 3 with the blog at position 1, and the SDK example at position 5 with the changelog at position 4. With equal score gaps and sigma 1, their NDCG changes are 0.337 and 0.013, and their preferred-item derivatives are −0.1684 and −0.0063. Shared-scale bars show the 26.6× magnitude ratio; grade and position differences both contribute." />
  <figcaption>These pairs differ in grade gap as well as position. With equal score gaps, metric weighting gives a <code>26.6×</code> derivative-magnitude ratio. It doesn't isolate position alone or execute a LambdaMART training run.</figcaption>
</figure>

Each document receives a net weighted score derivative $\lambda_i = \sum_{j:(i,j) \in P} \lambda_{ij} - \sum_{k:(k,i) \in P} \lambda_{ki}$. Under our derivative sign convention, gradient descent raises the preferred item's score by stepping along $-\lambda_i$, while the lower-graded item steps in the opposite direction; since some references define the update vector itself with the reversed sign, always state the sign convention alongside any gradient formula. **LambdaMART** combines these metric-weighted pairwise signals with boosted regression trees and curvature-based leaf updates, aggregating information across pairs and queries rather than weighting a single tree split by one swap's delta or differentiating NDCG directly.[^burges2010lambda]

To see those derivatives numerically, construct the preference pairs for our running query from the judged grades in `ranked`:

<!-- leetllm: test, output=show, continue=system-vs-reranker-ndcg, id=pairwise-labels, deps=numpy,scipy,scikit-learn -->
```python title="build-pair-preferences.py"
import numpy as np

ranked_grades = np.array([item["relevance"] for item in ranked])
i_idx, j_idx = np.where(ranked_grades[:, None] > ranked_grades[None, :])
pairs = [(ranked[int(i)]["id"], ranked[int(j)]["id"]) for i, j in zip(i_idx, j_idx)]

print("pair count:", len(pairs))
print("first pairs:", pairs[:5])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
pair count: 8
first pairs: [('api-guide', 'retry-runbook'), ('api-guide', 'sdk-example'), ('api-guide', 'blog-post'), ('api-guide', 'legacy-changelog'), ('retry-runbook', 'blog-post')]
```
<!-- leetllm: output:end -->

Each ordered pair such as `("api-guide", "blog-post")` encodes that the guide belongs ahead of the blog for this query. Equal-grade ties such as `retry-runbook` versus `sdk-example` generate no preference pair. Next, take one linear RankNet update on that pair and separately evaluate two LambdaRank metric-weighted score derivatives at zero score gap (`s_i - s_j = 0`, using the displayed row order as the tie order):

<!-- leetllm: test, output=show, continue=pairwise-labels, id=pairwise-update, deps=numpy,scipy,scikit-learn -->
```python title="take-one-pairwise-step.py"
import numpy as np
from scipy.special import expit

by_id = {item["id"]: item for item in eligible}
preferred, other = by_id["api-guide"], by_id["blog-post"]
feature_names = ("query_fit", "reliability")
difference = np.array([preferred[name] - other[name] for name in feature_names], dtype=float)

weights = np.zeros(2, dtype=float)
gap_before = float(weights @ difference)
loss_before = float(np.logaddexp(0.0, -gap_before))
gradient = float(expit(gap_before) - 1.0) * difference
weights = weights - 0.5 * gradient
gap_after = float(weights @ difference)


def delta_ndcg(grades, pos_i, pos_j, limit=5):
    base = np.asarray(grades, dtype=float)
    swapped = base.copy()
    swapped[pos_i], swapped[pos_j] = swapped[pos_j], swapped[pos_i]
    best = dcg(np.sort(base)[::-1][:limit])
    return abs(dcg(swapped[:limit]) - dcg(base[:limit])) / best if best else 0.0


# State: [blog-post(0), retry-runbook(2), api-guide(3), legacy-changelog(0), sdk-example(2)]
misordered_grades = np.array([0, 2, 3, 0, 2], dtype=float)
d_top = delta_ndcg(misordered_grades, 0, 2, 5)
d_bottom = delta_ndcg(misordered_grades, 3, 4, 5)

lambda_top = -0.5 * d_top
lambda_bottom = -0.5 * d_bottom

print("RankNet weight gradient:", [round(float(g), 4) for g in gradient])
print("RankNet updated weights:", [round(float(w), 4) for w in weights])
print(f"top swap delta_ndcg: {d_top:.3f} -> preferred derivative: {lambda_top:.4f}")
print(f"bottom swap delta_ndcg: {d_bottom:.3f} -> preferred derivative: {lambda_bottom:.4f}")
print(f"weighted derivative magnitude ratio: {lambda_top / lambda_bottom:.1f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
RankNet weight gradient: [-0.315, 0.045]
RankNet updated weights: [0.1575, -0.0225]
top swap delta_ndcg: 0.337 -> preferred derivative: -0.1684
bottom swap delta_ndcg: 0.013 -> preferred derivative: -0.0063
weighted derivative magnitude ratio: 26.6x
```
<!-- leetllm: output:end -->

The single-pair RankNet step shifts weights toward `query_fit`, immediately creating a positive score gap for the guide (`+0.0972` relative to the blog). Separately, the two metric-weighted score derivatives differ by `26.6x` in magnitude: because the guide/blog grade jump is `3` at ranks 1 and 3 whereas the SDK/changelog jump is `2` at ranks 4 and 5, both grade margin and position discount amplify the upper swap. In full tree training, measure held-out NDCG after fitting rather than judging from two isolated derivatives.

## Log exposure before reading clicks

Once the ranked slate leaves the server, clicks tell you only which shown results attracted selection, never which items were hidden or missed. Recording displayed impressions (including unclicked rows) separately from downstream outcome events connects future training data back to actual serving exposure: the server log records what slate it proposed, and a matching client exposure signal records what the browser actually rendered. The structured log below captures both tables for one served request, storing candidate set IDs, access rules, and model versions alongside click and resolution events while leaving sensitive logs encrypted and bound by strict retention schedules.

<!-- leetllm: test, output=show, continue=pairwise-update, id=impression-log, deps=numpy,scipy,scikit-learn -->
```python title="write-impression-log.py"
import numpy as np

slate = ranked[:3]
positions = np.arange(1, len(slate) + 1)
impressions = [
    {
        "request_id": "req-1042",
        "shown_at": "2026-05-01T12:00:00Z",
        "replay_snapshot": "docs-request-snapshot-1042",
        "query": query,
        "access_ruleset": "docs-access-v4",
        "candidate_set": "retrieval-v3",
        "ranker": "docs-ranker-v7",
        "document_id": item["id"],
        "position": int(position),
    }
    for position, item in zip(positions, slate)
]
outcomes = [
    {
        "event_id": "evt-click-1042",
        "occurred_at": "2026-05-01T12:00:03Z",
        "request_id": "req-1042",
        "document_id": "api-guide",
        "event": "click",
    },
    {
        "event_id": "evt-resolved-1042",
        "occurred_at": "2026-05-01T12:04:18Z",
        "request_id": "req-1042",
        "document_id": "api-guide",
        "event": "resolved",
    },
]

print("slate:", [item["id"] for item in slate])
print("logged positions:", [(row["document_id"], row["position"]) for row in impressions])
print("later outcomes:", [(row["document_id"], row["event"]) for row in outcomes])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
slate: ['api-guide', 'retry-runbook', 'sdk-example']
logged positions: [('api-guide', 1), ('retry-runbook', 2), ('sdk-example', 3)]
later outcomes: [('api-guide', 'click'), ('api-guide', 'resolved')]
```
<!-- leetllm: output:end -->

Here `api-guide` is logged at position `1` and later joined by separate click and task-resolution events for the same `request_id`. Keeping impressions and outcomes decoupled prevents delayed positive events from erasing unclicked exposures at higher ranks. Every replay record requires strict access control and data minimization because query text often holds credentials or identifiers that keyed hashing of low-entropy strings fails to anonymize.

| Logged field | Reason |
| --- | --- |
| request and query ID | group displayed slate and join later outcomes |
| access-ruleset version | know which documents were allowed |
| candidate IDs and feature snapshot | know what could have ranked and reproduce scores |
| rendered positions and exposure timestamp | record display context; examination remains latent |
| ranker version | attribute outcomes |
| timestamped click, save, resolved events | distinguish curiosity from value |
| freshness and permission snapshot | reproduce context without overriding current access checks |

## Debias click logs with inverse propensity scoring

Position affects clicks through attention, presentation, and perceived authority. Training directly on raw clicks reinforces prior exposure because visible items collect more opportunities to be clicked. Left uncorrected, this selection loop degrades exploration over time rather than guaranteeing permanent lock-in.[^joachims2017]

### An explicit position-based model

In the standard **position-based click model**, a click occurs only when the developer both examines slot $k$ and judges item $x$ relevant. We ignore accidental clicks and assume examination $p_k = P(\text{examine} = 1 \mid k)$ depends strictly on rank position once request context is fixed. Under these assumptions, click probability factors cleanly into examination and intrinsic relevance:

$$
P(\text{click} = 1 \mid x, k) = P(\text{examine} = 1 \mid k) \cdot P(\text{relevant} = 1 \mid x)
$$

Raw click-through rate (CTR) multiplies those two probabilities together, so comparing CTRs across ranks confuses examination drop-off with true relevance. **Inverse Propensity Scoring (IPS)** recovers an unbiased relevance estimate $\hat{R}_i = C_{i, k} / p_k$ whenever $p_k > 0$ specifies the true examination probability. Every observed click $C_{i,k} \in \{0, 1\}$ is scaled by $1/p_k$, so at $p_k = 0.1$ a single click contributes weight `10` to keep the expected estimate equal to true relevance $R_i = P(\text{relevant} = 1 \mid x_i)$:

$$
\mathbb{E}[\hat{R}_i] = \frac{\mathbb{E}[C_{i, k}]}{p_k} = \frac{p_k \cdot P(\text{relevant} = 1 \mid x_i)}{p_k} = P(\text{relevant} = 1 \mid x_i) = R_i
$$

Notice how raw CTR misleads on equal-relevance items placed at different slots. In the snippet below, two identical-quality rows sit at positions 1 and 2. Comparing their raw click counts without weighting hides their equal underlying appeal:

<!-- leetllm: test, output=show, continue=impression-log, id=position-bias, deps=numpy,scipy,scikit-learn -->
```python title="reproduce-position-bias.py"
import numpy as np

historical = [
    {"document": "same-quality-a", "position": 1, "impressions": 100, "clicks": 40},
    {"document": "same-quality-b", "position": 2, "impressions": 100, "clicks": 20},
]

clicks = np.array([row["clicks"] for row in historical], dtype=float)
impressions_count = np.array([row["impressions"] for row in historical], dtype=float)
raw_ctrs = clicks / impressions_count

for row, raw_ctr in zip(historical, raw_ctrs):
    print(f"{row['document']}: position={row['position']} raw_ctr={raw_ctr:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
same-quality-a: position=1 raw_ctr=0.40
same-quality-b: position=2 raw_ctr=0.20
```
<!-- leetllm: output:end -->

Observed CTRs alone cannot separate intrinsic relevance from rank attention, since a lower CTR at position 2 might reflect reduced examination rather than inferior content. Assuming absolute examination propensities of `1.0` at slot 1 and `0.5` at slot 2, inverse propensity weighting recovers matching `0.40` relevance estimates while illustrating why deep-slot weights require clipping:

<!-- leetllm: test, output=show, continue=position-bias, id=propensity-correction, deps=numpy,scipy,scikit-learn -->
```python title="correct-toy-position-bias.py"
import numpy as np

examination_propensity = {1: 1.0, 2: 0.5, 3: 0.1, 4: 0.02}
row_propensities = np.array([examination_propensity[row["position"]] for row in historical], dtype=float)
corrected_signals = raw_ctrs / row_propensities

for row, signal in zip(historical, corrected_signals):
    print(f"{row['document']}: corrected_signal={signal:.2f}")

# Demonstrate propensity truncation for deep positions
deep_row = {"document": "rare-doc-d", "position": 4, "impressions": 100, "clicks": 1}
raw_weight = np.array([1.0 / examination_propensity[deep_row["position"]]], dtype=float)
clipped_weight = np.minimum(raw_weight, 10.0)
print(f"slot 4 raw inverse weight: {raw_weight[0]:.1f}")
print(f"slot 4 clipped inverse weight: {clipped_weight[0]:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
same-quality-a: corrected_signal=0.40
same-quality-b: corrected_signal=0.40
slot 4 raw inverse weight: 50.0
slot 4 clipped inverse weight: 10.0
```
<!-- leetllm: output:end -->

### Real-world propensity estimation and clipping

Randomized position interventions allow a search team to estimate **relative** propensities directly from live traffic: comparing clicks across swapped positions cancels intrinsic item appeal, so CTR ratios identify $p_r / p_k$ whenever examination drives position effects cleanly. Joachims et al. normalize propensities against a landmark slot, which suffices for pairwise or listwise risk comparisons even though identifying **absolute** relevance probabilities still requires anchoring that landmark's examination rate.[^joachims2017] If slot 1 is examined `0.8` of the time rather than `1.0`, the exact same relative ratio implies slot-2 examination `0.4` and scales both corrected relevance estimates proportionally:

<!-- leetllm: test, output=show, continue=propensity-correction, id=propensity-anchor, deps=numpy,scipy,scikit-learn -->
```python title="check-absolute-propensity-anchor.py"
import numpy as np

observed_ctrs = np.array([0.4, 0.2], dtype=float)
for first_slot_probability in [1.0, 0.8]:
    absolute_probabilities = np.array([first_slot_probability, 0.5 * first_slot_probability])
    estimates = observed_ctrs / absolute_probabilities
    print(f"slot-1 anchor={first_slot_probability:.1f}: estimates={[round(float(v), 2) for v in estimates]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
slot-1 anchor=1.0: estimates=[0.4, 0.4]
slot-1 anchor=0.8: estimates=[0.5, 0.5]
```
<!-- leetllm: output:end -->

Matching IPS-adjusted scores still do not guarantee equal quality under finite samples or misspecified click models, and weighting cannot cure blind spots where documents never enter the candidate pool. Meanwhile, counterfactual evaluation of an alternative ranker depends on logged action probabilities from the live randomization scheme rather than $p_k$ alone, always constrained by permission and safety boundaries. Notice also that **clipping trades variance for bias, and the bias can be substantial**: at `p = 0.02` with an inverse-weight cap of `10`, the expected clipped contribution shrinks to `10 * 0.02 * R = 0.2 R` rather than `R`, dragging a true `0.5` relevance rate down to an expected clipped estimate of `0.1`, so always validate any clipping threshold directly on bias-variance curves rather than treating clipping as free smoothing.[^joachims2017]

```checkpoint
Why can't raw click rate serve as an unbiased relevance label?
---
Users can click only items they were shown, and higher-ranked items receive more attention. Log exposure and position, then use controlled exploration or bias-aware estimation before treating clicks as preference evidence.
```

## Protect users and enforce slate rules

Ranking shapes which documentation developers actually see. In this portal, stale guides and private drafts stay out of every result list, whereas an archive search might intentionally surface older pages, so always settle the domain rule explicitly before encoding a hard filter in code. Post-scoring slate constraints adjust ordered outputs to protect diversity, freshness, or user safety, such as capping each source at two results within a three-slot display while maintaining multi-source candidate supply upstream. Define fallback behavior explicitly when eligible alternatives run short, and slice monitoring by new documents, small collections, and language so rare cohorts are not hidden inside a single global NDCG average. Here the three relevant documents share `"platform"` while the remaining two belong to `"community"`; walking the ranked list greedily reveals which item fills slot 3 and how the constraint shifts system NDCG:

<!-- leetllm: test, output=show, continue=propensity-anchor, id=source-quota, deps=numpy,scipy,scikit-learn -->
```python title="apply-a-source-quota.py"
import numpy as np

source_by_id = {
    "api-guide": "platform",
    "retry-runbook": "platform",
    "sdk-example": "platform",
    "blog-post": "community",
    "legacy-changelog": "community",
}


def source_limited_slate(ordered_items, slots, per_source):
    selected = []
    counts = {}
    for item in ordered_items:
        if len(selected) == slots:
            break
        source = source_by_id[item["id"]]
        if counts.get(source, 0) < per_source:
            selected.append(item)
            counts[source] = counts.get(source, 0) + 1
    return selected


constrained = source_limited_slate(ranked, slots=3, per_source=2)
one_source = [item for item in ranked if source_by_id[item["id"]] == "platform"]
underfilled = source_limited_slate(one_source, slots=3, per_source=2)
print("constrained slate:", [item["id"] for item in constrained])
print("constrained grades:", np.array([item["relevance"] for item in constrained]).tolist())
print("system ndcg@3:", f"{system_ndcg(constrained, eligible, 3):.3f}")
print("one-source slate:", [item["id"] for item in underfilled])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
constrained slate: ['api-guide', 'retry-runbook', 'blog-post']
constrained grades: [3, 2, 0]
system ndcg@3: 0.856
one-source slate: ['api-guide', 'retry-runbook']
```
<!-- leetllm: output:end -->

Enforcing the per-source cap swaps the grade-2 `sdk-example` out for the grade-0 `blog-post`, pulling system NDCG@3 down from `1.000` to `0.856`. Every diversity or fairness constraint introduces an explicit relevance trade-off that needs a clear product justification, and when only `"platform"` candidates are available this fallback leaves slot 3 empty rather than breaking the cap or inserting an ineligible page. Notice also that greedy top-down scanning guarantees feasibility for this single-attribute count limit rather than solving arbitrary overlapping slate optimization constraints.

Hard authorization rules must remain strictly separated from learned scoring. Sorting the unfiltered corpus directly shows how omitting the prefilter immediately leaks restricted drafts. Run the unfiltered sort below to observe which row claims rank 1:

<!-- leetllm: test, output=show, continue=source-quota, id=filter-bypass, deps=numpy,scipy,scikit-learn -->
```python title="reproduce-filter-bypass.py"
import numpy as np

corpus_scores = np.array([rank_score(item) for item in corpus], dtype=float)
corpus_ids = np.array([item["id"] for item in corpus])
unsafe_order = [corpus[idx] for idx in np.lexsort((corpus_ids, -corpus_scores))]

print("unsafe first result:", unsafe_order[0]["id"])
print("permitted:", unsafe_order[0]["permitted"])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unsafe first result: private-draft
permitted: False
```
<!-- leetllm: output:end -->

Because `private-draft` matches the query strongly, an unguarded scorer puts it straight into slot 1. High textual similarity never implies permission to view a document. Keep hard eligibility checks active both before retrieval and at display time so stale candidate caches cannot surface newly restricted documents.

## Gate offline candidates and evaluate online

Before promoting a ranker to live traffic, evaluate offline retrieval recall and system NDCG alongside reranker NDCG, tail latency, slate constraint compliance, and exposure logging integrity. Offline gains also do not authorize a model to reinforce its own future training labels without debiasing or live checks. The following validation suite verifies structural and metric invariants on our single worked query and sample latencies without constituting release approval:

- candidate recall at `5` must be `1.0`
- reranker NDCG@5 and system NDCG@3 must each be at least `0.95`
- the supplied latency sample must have nearest-rank p95 at most `20` milliseconds
- blocked documents must stay absent from the slate
- impression rows must contain every field needed for replay
- outcome events must join a logged impression and carry unique event IDs

<!-- leetllm: test, output=show, continue=filter-bypass, id=offline-gates, deps=numpy,scipy,scikit-learn -->
```python title="check-offline-ranking-gates.py"
import numpy as np

# Sample latencies in ms for percentile-gate arithmetic, not live timings of this scorer.
latencies_ms = np.array([11, 13, 12, 15, 14, 16, 13, 12, 17, 18], dtype=float)
p95_latency_ms = int(np.percentile(latencies_ms, 95, method="inverted_cdf"))

required_impression_fields = {
    "request_id",
    "shown_at",
    "replay_snapshot",
    "query",
    "access_ruleset",
    "candidate_set",
    "ranker",
    "document_id",
    "position",
}
required_outcome_fields = {
    "event_id",
    "occurred_at",
    "request_id",
    "document_id",
    "event",
}
exposed_keys = {
    (row["request_id"], row["document_id"])
    for row in impressions
}
release_checks = {
    "candidate_recall_at_5": candidate_recall(candidates) >= 1.0,
    "reranker_ndcg_at_5": reranker_ndcg(ranked, 5) >= 0.95,
    "system_ndcg_at_3": system_ndcg(ranked, eligible, 3) >= 0.95,
    "p95_latency_ms": p95_latency_ms <= 20,
    "blocked_items_absent": not (
        {"private-draft", "stale-guide"}
        & {item["id"] for item in ranked}
    ),
    "impression_schema": bool(impressions) and all(
        required_impression_fields <= row.keys()
        for row in impressions
    ),
    "outcome_schema": all(
        required_outcome_fields <= row.keys()
        for row in outcomes
    ),
    "outcomes_join_impressions": all(
        (row["request_id"], row["document_id"]) in exposed_keys
        for row in outcomes
    ),
    "unique_outcome_events": len({row["event_id"] for row in outcomes}) == len(outcomes),
}

for name, passed in release_checks.items():
    print(f"{name}: {passed}")
print("all checks passed:", all(release_checks.values()))
assert all(release_checks.values())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
candidate_recall_at_5: True
reranker_ndcg_at_5: True
system_ndcg_at_3: True
p95_latency_ms: True
blocked_items_absent: True
impression_schema: True
outcome_schema: True
outcomes_join_impressions: True
unique_outcome_events: True
all checks passed: True
```
<!-- leetllm: output:end -->

Because only ten latency observations exist here, the nearest-rank 95th percentile simply returns their maximum (`18`). Measuring production tail latency properly requires repeated requests across representative live concurrency and document distributions. Remember also that key-presence assertions do not verify field types, monotonic timestamps, browser rendering, or live permission freshness, and promoting the source-capped slate requires checking NDCG and cap compliance on that final constrained output instead.

Moving to online testing requires randomized assignment rather than pre/post time-window comparisons, as detailed in [Experiment Design and A/B Testing](/learn/experiment-design-ab-testing).[^kohavi2020] Because repeated sessions from the same developer are correlated, assign traffic at the developer level (`developer_id`) from first eligible exposure and compute clustered standard errors at that same unit. Predeclare sample size, minimum run duration, primary metric definition (averaging per-developer session rates weights every developer equally, unlike a pooled ratio), early safety stops, and one efficacy analysis before launch, then store that specification alongside the offline summary:

<!-- leetllm: test, output=show, continue=offline-gates, deps=numpy,scipy,scikit-learn -->
```python title="publish-ranking-candidate-receipt.py"
import numpy as np

p95_ms = int(np.percentile(latencies_ms, 95, method="inverted_cdf"))
receipt = {
    "artifact": "docs-ranker-v7",
    "evidence_type": "worked_example",
    "operational_status": "not_evaluated",
    "access_ruleset": "docs-access-v4",
    "candidate_set": "retrieval-v3",
    "offline": {
        "candidate_recall_at_5": round(candidate_recall(candidates), 3),
        "reranker_ndcg_at_5": round(reranker_ndcg(ranked, 5), 3),
        "system_ndcg_at_3": round(system_ndcg(ranked, eligible, 3), 3),
        "p95_latency_ms": p95_ms,
    },
    "release_checks": release_checks,
    "required_checks_pass": all(release_checks.values()),
    "experiment": {
        "assignment_unit": "developer_id",
        "analysis_unit": "developer_id",
        "control": "docs-ranker-v6",
        "treatment": "docs-ranker-v7",
        "primary_metric": "mean_developer_resolution_rate",
        "metric_definition": "resolved sessions / all sessions for each developer, then mean over developers",
        "minimum_duration_days": 14,
        "minimum_developers_per_arm": 5000,
        "analysis_schedule": "one efficacy analysis after both minimums; no significance peeking",
        "guardrails": [
            "bad_result_reports_per_session",
            "p95_latency_ms",
            "blocked_document_impressions",
        ],
        "safety_stops": {
            "blocked_document_impressions": 0,
            "p95_latency_ms": 20,
        },
    },
    "status": "checks_passed" if all(release_checks.values()) else "checks_failed",
}
payload = dumps(receipt, sort_keys=True)
print("status:", receipt["status"])
print("offline:", receipt["offline"])
print("receipt sha256:", sha256(payload.encode()).hexdigest()[:12])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
status: checks_passed
offline: {'candidate_recall_at_5': 1.0, 'reranker_ndcg_at_5': 1.0, 'system_ndcg_at_3': 1.0, 'p95_latency_ms': 18}
receipt sha256: 42477c2307d1
```
<!-- leetllm: output:end -->

That short SHA-256 prefix fingerprints the serialized JSON record rather than model weights or live traffic telemetry. It proves only that this structured report matches its serialized bytes. A real deployment record must bind exact dataset snapshots, ranker artifact revisions, index versions, and representative latency scopes before rollout.

## Common ranking failure modes and debugging

When offline or online ranking numbers diverge from expectations, locate the earliest broken boundary in the pipeline instead of blaming the scoring model alone. No downstream reranker can rescue a dropped candidate, repair an authorization leak, or fix click logs that fail to join back to exposure. Use the diagnostic table below to map observed symptoms to targeted pipeline measurements before changing model weights:

| Symptom | Probable cause | Fix |
| --- | --- | --- |
| NDCG looks strong but desired document never appears | Candidate retrieval lost recall | Measure retrieval recall and system NDCG separately from reranker NDCG |
| Prohibited document is displayed | Authorization was absent, stale, or bypassed | Enforce current eligibility pre-filters and gate blocked impressions |
| Popular documents dominate the slate | Exposure/position feedback, candidate coverage, or genuinely strong demand | Inspect retrieval coverage and click-model assumptions; evaluate constrained exploration and propensity weighting |
| Corrected click score still looks suspicious | Propensity estimate is wrong | Validate click model or collect randomized intervention data |
| Corrected click score becomes unstable | Tiny propensities create large inverse weights | Check support and model fit; evaluate clipping's bias/variance trade-off |
| CTR improves while bad-result reports rise | Clickbait objective mismatch | Pair engagement with task resolution and explicit negative feedback guardrails |

Treat each diagnostic row as an empirical hypothesis to investigate rather than a universal verdict. A drop in click-through rate, for example, might stem from degraded relevance, a UI layout shift, or faster zero-click task completion, so isolate the cause with slice-level metrics and log audits before retuning weights.

## Try changing one assumption

Copy the full pipeline before modifying parameters so every ablation starts from the original baseline behavior. Working through these four controlled edits confirms how candidate recall, ranking metrics, pairwise gradients, and log integrity react under single-variable perturbations:

1. Set the candidate budget to `4`, rerank those candidates, and evaluate at cutoff `3`. Calculate candidate recall, reranker NDCG, and system NDCG.
2. Swap `api-guide` and `retry-runbook` in the original ranked list. Determine whether candidate recall, NDCG@3, or both change.
3. In the one-pair update, reverse the preference while keeping zero initial weights. Verify what happens to the two weight-gradient signs and whether the newly preferred document gains a positive score gap.
4. Add an outcome for a document absent from `impressions`. Separately, duplicate an existing outcome's `event_id`. Verify which check fails for each edit.

### Check your predictions

1. Four candidates include the guide and runbook but miss the SDK example: recall is `2/3`. Their best order has grades `[3, 2, 0]`, giving reranker NDCG@3 `1.000` but system NDCG@3 about `0.856`. The whole-corpus ideal remains `[3, 2, 2]`.
2. Recall stays `1.000` because no document leaves the candidate set. The reordered grades `[2, 3, 2]` give NDCG@3 about `0.858`: the grade-3 answer loses more from moving down than the grade-2 answer gains from moving up.
3. The feature difference becomes `[-0.63, 0.09]`; the gradient becomes `[0.315, -0.045]` and the updated weights `[-0.1575, 0.0225]`. The update follows the supplied label, even when that label contradicts the judgment you intended.
4. The orphan event fails `outcomes_join_impressions`. A repeated event ID fails `unique_outcome_events`, even though both copies join an impression. Joinability and deduplication protect different failure modes.

```mastery-quiz
[
  {
    "question": "A fresh eligible judgment universe has grades P:0, Q:2, R:3, S:1, T:0. Retrieval returns only P, Q, T; a reranker puts Q first. Candidate recall treats every positive grade as relevant. Use gain 2^grade −1 and log2(rank+1) discount at cutoff 3. Which recall, local NDCG and system NDCG follow?",
    "options": [
      "Recall 1/3; local 1; system 1.",
      "Recall 1/3; local 1; system 3/(7+3/log2(3)+1/2).",
      "Recall 2/3; local 1; system 3/(7+3/log2(3)+1/2).",
      "Recall 1/3; local 3/(7+3/log2(3)+1/2); system 1."
    ],
    "answer": "Recall 1/3; local 1; system 3/(7+3/log2(3)+1/2).",
    "explanation": "Only Q survives from relevant Q, R, S, so recall is 1/3. Q, P, T is ideal among survivors, giving local 1. System ideal R, Q, S gives IDCG 7+3/log2(3)+1/2; returned DCG is 3, so system NDCG is about 0.319394."
  },
  {
    "question": "Two query lists have grades A=[0,3,2,0] and B=[2,0,0,3]. Evaluate only the first 3 results. RR targets grade 3 and assigns 0 if absent; AP counts grades≥2 and uses min(R,3), with R=2 for each complete eligible universe. What macro MRR@3 and MAP@3 follow?",
    "options": [
      "MRR 3/8; MAP 13/24.",
      "MRR 1/4; MAP 7/12.",
      "MRR 1/2; MAP 13/24.",
      "MRR 1/4; MAP 13/24."
    ],
    "answer": "MRR 1/4; MAP 13/24.",
    "explanation": "At cutoff 3, A has RR 1/2 and B has 0, averaging 1/4. A AP is (1/2+2/3)/2=7/12; B AP is 1/2 because its missing relevant target still counts in R. Their mean is 13/24."
  },
  {
    "question": "A zero-weight linear RankNet model compares preferred features [0.8,0.2] with other features [0.2,0.6]. Use steepness 1 and learning rate 0.4. Compare an ordinary zero-gap pair update with the same local derivative multiplied by a fixed absolute metric-swap weight 0.2. What new preferred-minus-other score gaps follow?",
    "options": [
      "Ordinary 0.104; weighted 0.0208.",
      "Ordinary 0.104; weighted 0.5200.",
      "Ordinary −0.104; weighted −0.0208.",
      "Ordinary 0.026; weighted 0.0052."
    ],
    "answer": "Ordinary 0.104; weighted 0.0208.",
    "explanation": "The feature difference is [0.6,−0.4] and zero-gap derivative −0.5 gives gradient [−0.3,0.2]. Descent produces weights [0.12,−0.08] and gap 0.104. A fixed 0.2 metric weight scales that local gradient and gap by 0.2, giving 0.0208. This is a constructed linear local step, not a full LambdaMART fit."
  },
  {
    "question": "Use x0=[1,2], current xl=[3,4] and bias [0.5,−1]. The original DCN vector layer has weight [0,1]; DCN-v2 has identity matrix W. Compute the original x0(xlᵀw)+b+xl and v2 x0⊙(Wxl+b)+xl. Which pair of results follows?",
    "options": [
      "Original [7.5,10]; v2 [6.5,11].",
      "Original [7.5,11]; v2 [6.5,11].",
      "Original [7.5,11]; v2 [6.5,10].",
      "Original [7.5,10]; v2 [6.5,10]."
    ],
    "answer": "Original [7.5,11]; v2 [6.5,10].",
    "explanation": "The dot product of xl and w is 4. The original layer scales x0 by 4, then adds the bias and xl to get [7.5,11]. In v2, Wxl+b is [3.5,3]. Multiply its coordinates by 1 and 2 to get [3.5,6], then add xl to get [6.5,10]. An original result ending in 10 puts its bias inside the product. A v2 result ending in 11 puts its bias outside. The pair with those two endings moves both biases."
  },
  {
    "question": "Under the examination × relevance click model, two raw click-through rates are 0.18 and 0.09. The first position has examination probability 0.6, and the second is half as likely to be examined. In a separate population, examination probability is 0.05, relevance probability is 0.4, and the inverse weight per click is capped at 4. What are the two corrected rates and the expected clipped contribution per impression in the separate population?",
    "options": [
      "Corrected [0.3,0.3]; clipped expectation 0.08.",
      "Corrected [0.18,0.18]; clipped expectation 0.4.",
      "Corrected [0.3,0.3]; clipped expectation 0.4.",
      "Corrected [0.18,0.18]; clipped expectation 0.08."
    ],
    "answer": "Corrected [0.3,0.3]; clipped expectation 0.08.",
    "explanation": "The examination probabilities are 0.6 and 0.3. Dividing 0.18 by 0.6 and 0.09 by 0.3 gives 0.3 at both positions. The pair [0.18,0.18] assumes everyone examines the first position. In the separate population, the click probability is 0.05 × 0.4 = 0.02. Each click contributes 4, so the expected contribution per impression is 0.02 × 4 = 0.08. An expectation of 0.4 uses the full inverse weight of 20. Pairing 0.4 with [0.18,0.18] makes both mistakes."
  },
  {
    "question": "A reranker receives unique candidate IDs [a, b, c] with frozen grades a:2, b:3, c:0, then returns [b, c, a]. Validate an exact candidate permutation and evaluate NDCG@3 using gain 2^grade −1 and log2(rank+1) discount. The declared quality floor is 0.97. Which structural and quality decisions follow?",
    "options": [
      "Permutation fails; quality floor passes.",
      "Permutation fails; quality floor fails.",
      "Permutation passes; quality floor passes.",
      "Permutation passes; quality floor fails."
    ],
    "answer": "Permutation passes; quality floor fails.",
    "explanation": "Each candidate appears once, so structural validation passes. Returned DCG is 7+3/2=8.5; ideal [b, a, c] gives 7+3/log2(3), about 8.892789. Their ratio is about 0.95583, below 0.97. Valid structure leaves ordering quality unchecked."
  },
  {
    "question": "Logged impressions contain (request R, document a) and (request R, document b). All outcome fields are present. Three outcomes are (id E1, R, a), (id E1, R, b), (id E2, R, c). Which pair of join and unique-event-ID gates follows?",
    "options": [
      "Join passes; IDs fail.",
      "Join fails; IDs fail.",
      "Join fails; IDs pass.",
      "Join passes; IDs pass."
    ],
    "answer": "Join fails; IDs fail.",
    "explanation": "The c outcome has no matching impression, so the join gate fails. E1 occurs twice, so the unique-event-ID gate also fails, even though both E1 rows individually join. These checks leave browser rendering, clock order and field types unverified."
  },
  {
    "question": "Documents rank in descending score order as A1, A2, A3, A4, B1, B2, C1. The leading letter is each document’s source. Greedily fill 3 slots, allowing at most 2 per source. Then permission for A1 is revoked and the same algorithm replays all remaining eligible rows. Which new slate follows?",
    "options": [
      "A1, A2, B1.",
      "A2, B1, C1.",
      "A2, A3, B1.",
      "A2, A3, A4."
    ],
    "answer": "A2, A3, B1.",
    "explanation": "Remove A1 and scan from the top. A2 and A3 take both places allowed for source A. Skip A4 and take B1 for the third slot. A slate that keeps A1 uses its old permission. Taking A4 as the third result ignores the source cap. The slate A2, B1, C1 applies a limit of one per source."
  },
  {
    "question": "A developer-randomized experiment has one developer resolving 2 of 2 sessions and another resolving 1 of 8. The declared metric averages each developer’s resolution rate equally. Which equal-developer metric and pooled-session rate describe these same observations?",
    "options": [
      "Developer 0.3000; pooled 0.3000.",
      "Developer 0.5625; pooled 0.5625.",
      "Developer 0.7500; pooled 0.3000.",
      "Developer 0.5625; pooled 0.3000."
    ],
    "answer": "Developer 0.5625; pooled 0.3000.",
    "explanation": "The equal-developer mean is (1+1/8)/2=0.5625. Pooling sessions gives 3/10=0.3. Assignment and analysis unit determine which target is intended; repeated sessions do not create independent developer units."
  },
  {
    "question": "A declared three-item list-distribution surrogate uses target masses [0.5,0.3,0.2] and model scores [0,0,0]. The loss is cross-entropy against softmax of those scores. What score-gradient vector follows?",
    "options": [
      "[−1/6,1/30,2/15].",
      "[1/6,−1/30,−2/15].",
      "[−1/2,−3/10,−1/5].",
      "[1/3,1/3,1/3]."
    ],
    "answer": "[−1/6,1/30,2/15].",
    "explanation": "The predicted mass is 1/3 per item. Score gradients are predicted minus target: [1/3−1/2,1/3−3/10,1/3−1/5]=[−1/6,1/30,2/15], summing to 0. This couples the declared list and is a smooth surrogate, not the derivative of NDCG."
  }
]
```

> **Next:** Continue to [Forecasting and Anomaly Detection](/learn/forecasting-anomaly-detection). Ranking scores a slate for one request. Next you'll predict values that unfold over time and tell a repeating weekly pattern apart from a real operational surprise.
