---
title: NDCG
aliases: ["normalized discounted cumulative gain"]
importance: 84
---
**NDCG** (normalized discounted cumulative gain) scores a ranked list by how much useful material it puts near the top. Each item can have a graded relevance, such as $0,1,2,3$. Gain at lower ranks is discounted, then the sum is divided by the best possible sum for those same labels. A perfect ordering scores $1.0$; random or inverted order scores lower. Järvelin and Kekäläinen introduced cumulated-gain and discounted measures for IR evaluation (SIGIR 2000; TOIS 2002); NDCG is the form used almost everywhere for search, recommendations, and retrieval evals.

## Intuition

Three ideas sit under the acronym:

1. **Gain:** highly relevant items are worth more than partially relevant ones (grades such as $0,1,2,3$).
2. **Discount:** a hit at rank $1$ is worth more than the same hit at rank $10$, because users and RAG packers look at the top first.
3. **Normalize:** divide by ideal DCG (IDCG) so queries with different amounts of relevance stay comparable, and so a perfect ranking is always $1.0$.

[Recall@k](glossary://recall-at-k) only asks whether gold items appeared somewhere in the top $k$. [MRR](glossary://mrr) only cares about the rank of the *first* relevant item. NDCG cares about *all* graded hits in the list and *where* they sit.

## Formula

**Cumulative gain** at cutoff $p$ ignores order:

$$
\mathrm{CG}_p = \sum_{i=1}^{p} rel_i
$$

where $rel_i$ is the graded relevance of the item at rank $i$ (1-based).

**Discounted cumulative gain** (a common linear-gain form, used by scikit-learn's `dcg_score` / `ndcg_score`) is:

$$
\mathrm{DCG}_p = \sum_{i=1}^{p} \frac{rel_i}{\log_2(i+1)}
$$

Rank $1$ has discount $\log_2 2 = 1$, so the top item keeps full gain. Rank $2$ is divided by $\log_2 3 \approx 1.585$, rank $3$ by $2$, and so on.

An **exponential gain** form (common in industry and learning-to-rank; emphasized by Burges et al., 2005) weights high grades much more:

$$
\mathrm{DCG}_p = \sum_{i=1}^{p} \frac{2^{rel_i}-1}{\log_2(i+1)}
$$

For binary $rel_i \in \{0,1\}$ the two DCG formulas agree. For multi-level grades they do not. Always report which gain function you used when comparing runs.

**Ideal DCG** sorts the known relevance labels for the evaluation universe in nonincreasing order and applies the same DCG formula to the top $p$ of that ideal list. For end-to-end retrieval, that includes judged relevant documents the system failed to return. Normalizing only against the retrieved candidates instead measures ordering within that candidate set and can hide missed evidence. Then:

$$
\mathrm{NDCG}_p = \frac{\mathrm{DCG}_p}{\mathrm{IDCG}_p}
$$

with the convention $\mathrm{NDCG}_p = 0$ when $\mathrm{IDCG}_p = 0$ (no positive labels). Macro-average $\mathrm{NDCG}_p$ over queries for a corpus score. **NDCG@k** means $p = k$: only the top $k$ ranks enter both DCG and IDCG.

## Worked numbers

Suppose a query returns three items with grades $[3, 1, 2]$ at ranks $1$ to $3$ (linear gain, $p=3$):

$$
\begin{align*}
\mathrm{DCG}
&= \frac{3}{\log_2 2} + \frac{1}{\log_2 3} + \frac{2}{\log_2 4} \\
&= 3 + 0.631 + 1 = 4.631
\end{align*}
$$

Ideal order for the same labels is $[3, 2, 1]$:

$$
\mathrm{IDCG} = 3 + \frac{2}{\log_2 3} + \frac{1}{\log_2 4} = 3 + 1.262 + 0.5 = 4.762
$$

$$
\mathrm{NDCG@3} = \frac{4.631}{4.762} \approx 0.973
$$

Near-perfect: the only error is swapping grades $1$ and $2$ below the top. Swapping a $3$ far down the list drops NDCG much harder than swapping two weak partial matches.

## Example

A developer-assistant RAG pipeline retrieves $k=5$ chunks for "Which fields are required in a v2 deployment manifest?" Graded labels measure answerability, not mere topical similarity:

| Rank | Chunk | $rel$ |
|------|--------|-------|
| 1 | v2 manifest schema with required fields | 3 |
| 2 | Deployment overview without field definitions | 1 |
| 3 | v1-to-v2 migration guide with two renamed fields | 2 |
| 4 | Unrelated cache configuration | 0 |
| 5 | Deprecated v1 schema | 0 |

With linear gain, DCG rewards the complete schema at rank $1$ and the migration guide at rank $3$. If a [reranker](glossary://reranker) moves the migration guide to rank $2$ and the overview lower, NDCG@5 rises even though recall@5 is unchanged: the same evidence set is ordered better for the generator. If the v2 schema never entered the candidate set, NDCG@5 can't recover it; pair the metric with [recall@k](glossary://recall-at-k) on the first stage.


## How it works in practice

1. **Labels.** Collect graded relevance per query (human judges, rubric, or carefully constrained auto-grades). Incomplete labels bias IDCG and can punish correct unjudged docs.
2. **Cutoff.** Choose $k$ to match the product: top-$10$ SERP, top-$5$ chunks packed into context, top-$20$ recs. Report NDCG@k, not a bare "NDCG".
3. **Score.** For each query, rank by model score, compute DCG@k and IDCG@k with one fixed gain function, then average.
4. **Slice.** Break out hard queries, long docs, multi-intent, and ACL-filtered traffic; a global mean hides regressions.

Libraries: `sklearn.metrics.ndcg_score` (linear gain, log base $2$ by default on DCG), torchmetrics retrieval NDCG, and most IR toolkits. Match gain function and tie handling when you reimplement.

## What fails in production

- **Missed candidates.** NDCG only sees items in the scored list (or top-$k$). If [candidate generation](glossary://candidate-generation) never retrieved the gold doc, the metric blames ranking for a recall failure. Track recall@k (and coverage) separately.
- **Wrong or incomplete grades.** NDCG assumes labels are the truth for IDCG. Stale docs, single-intent labels on multi-hop questions, and topical-but-not-answerable chunks inflate or deflate scores.
- **Gain mismatch.** Comparing a $2^{rel}-1$ run to a linear-gain run is not an apples-to-apples lift. Log base cancels in the NDCG ratio when DCG and IDCG share the same base (for either gain form); the gain function does not. Pin the gain function and library defaults in the eval harness.
- **Zeros and junk.** Non-relevant items ($rel=0$) add nothing and do not actively penalize; a list padded with junk can score like a shorter clean list at the same $k$ if positive grades sit in the same places. Fix $k$ and interpret with precision-oriented checks when junk hurts users.
- **Position bias in labels.** Click or impression labels prefer items that already ranked high. Offline graded judgments reduce that loop; pure click NDCG can reward the current ranker for its own bias.
- **Query mix.** Easy FAQ queries with one obvious doc score near $1.0$ and dominate averages. Weight or slice by product importance.

## Trade-offs

| Metric | Strength | Weak fit |
|--------|----------|----------|
| NDCG@k | Graded relevance + position | Needs relevance judgments; heavy on label quality (binary labels also work) |
| MRR | First useful hit | Ignores second+ evidence |
| Recall@k | Did gold enter the set? | Ignores order among hits |

Prefer NDCG when several results can be partly useful and order after retrieval matters: product search, multi-doc RAG packing, recommendations. Prefer MRR for known-item "one right answer" lookup. Prefer recall@k to debug first-stage retrieval before you tune a reranker.

## Why it matters here

RAG and ranking lessons need a metric for how much relevant evidence appears and where it ranks. NDCG is the standard for graded lists, and its result depends on candidate-set recall and honest labels. Use it in [offline evaluation](glossary://offline-evaluation) gates next to recall@k, then confirm live behavior with product metrics.

## Related terms

- [Recall@k](glossary://recall-at-k)
- [MRR](glossary://mrr)
- [Reranker](glossary://reranker)
- [Candidate generation](glossary://candidate-generation)
- [Offline evaluation](glossary://offline-evaluation)
