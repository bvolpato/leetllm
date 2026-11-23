---
title: Recall@k
aliases: ["recall at k"]
importance: 84
---
**Recall@k** measures what fraction of the *relevant* items for a query appear anywhere in the top $k$ retrieved results. It is a set measure on the top-$k$ set $S_k$: order inside that window does not change the score. The classical IR definition of recall (Manning, Raghavan, Schütze, *Introduction to Information Retrieval*, Ch. 8) is the fraction of relevant documents that are retrieved; Recall@k is that same quantity when "retrieved" means "present in the top $k$."

In multi-stage search and RAG, Recall@k answers the first-stage question: *did the evidence enter the candidate budget at all?* A [reranker](glossary://reranker) and a generator can only use what [candidate generation](glossary://candidate-generation) admitted. Rank one is secondary until that inclusion test passes.

## Intuition

Precision@k asks how pure the top $k$ is. Recall@k asks how complete it is relative to the gold set. For a fixed ranking, Recall@k is non-decreasing in $k$: enlarge the window and you can only add gold, never remove it. Larger $k$ usually costs latency, reranker spend, and noise that later stages must filter.

Three useful special cases:

1. **One gold item per query** (common FAQ / known-item evals). Then Recall@k is $1$ if that item is in the top $k$, else $0$. Averaged over queries, this is the same as **Hit Rate@k** / **Success@k**: the fraction of queries that "hit" within $k$.
2. **Several gold items** (multi-evidence RAG, multi-relevant TREC-style qrels). Then each query scores $|R \cap S_k| / |R|$, and you still macro-average over queries.
3. **More gold than $k$**. Full Recall@k cannot reach $1.0$ if $|R| > k$. Some benchmarks report **capped recall** $\mathrm{R_{cap}@}k = |R \cap S_k| / \min(k, |R|)$ so a perfect top-$k$ scores $1.0$ even when the label set is larger than the budget (BEIR-style tooling when $|R|$ is large relative to $k$).

Recall@k depends on set membership within the top $k$. Swapping a gold doc from rank $1$ to rank $k$ leaves Recall@k unchanged while changing [MRR](glossary://mrr) and [NDCG](glossary://ndcg).

## Formula

Let $R_q$ be the set of relevant item IDs for query $q$, and $S_k(q)$ the set of the top $k$ IDs returned for $q$ (ties broken by a fixed rule).

**Per-query recall at $k$:**

$$
\mathrm{Recall@}k(q)
=
\frac{|R_q \cap S_k(q)|}{|R_q|}
$$

when $|R_q| > 0$. Queries with empty relevance labels are usually dropped from the average (undefined otherwise).

**Corpus score** (macro-average over the query set $Q$):

$$
\mathrm{Recall@}k
=
\frac{1}{|Q|}\sum_{q\in Q}\mathrm{Recall@}k(q)
$$

Macro treats every query equally. Micro-average $\sum_q |R_q \cap S_k(q)| / \sum_q |R_q|$ weights multi-label queries more; name which average you report.

**Single-relevant reduction.** If $|R_q|=1$ for every $q$, with gold item $r_q$:

$$
\mathrm{Recall@}k
=
\frac{1}{|Q|}\sum_{q\in Q}\mathbf{1}\!\left[r_q \in S_k(q)\right]
$$

**Capped form** (when you want a perfect top-$k$ to score $1$ even if $|R_q| > k$):

$$
\mathrm{R_{cap}@}k(q)
=
\frac{|R_q \cap S_k(q)|}{\min\!\big(k,\,|R_q|\big)}
$$

Always name which form you report. Uncapped Recall@100 on a query with $500$ relevant docs has a ceiling of $0.2$; that is honest about coverage of $R_q$, not a bug in the ranker.

In contingency language with the top-$k$ treated as the positive predictions: true positives are gold items inside $S_k$, false negatives are gold items outside it, so $\mathrm{Recall@}k = \mathrm{TP}/(\mathrm{TP}+\mathrm{FN})$. Precision@k is $\mathrm{TP}/k$ (or $\mathrm{TP}/|S_k|$ if fewer than $k$ results are returned).

## Worked numbers

Developer-docs corpus. Query: "How do I rotate signing keys without dropping active sessions?" Gold chunks (answerable evidence): $R = \{A, B, C\}$ (rotation procedure, overlap window, rollback procedure). Retriever returns top $5$:

| Rank | ID | Gold? |
|------|----|-------|
| 1 | $D$ authentication overview | no |
| 2 | $A$ rotation procedure | yes |
| 3 | $E$ cache configuration | no |
| 4 | $B$ overlap window | yes |
| 5 | $F$ tokenizer reference | no |

$$
\mathrm{Recall@}5 = \frac{|\{A,B\}|}{|\{A,B,C\}|} = \frac{2}{3} \approx 0.667
$$

$\mathrm{Precision@}5 = 2/5 = 0.4$. Gold $C$ never entered the window: no amount of cross-encoder reordering of $\{D,A,E,B,F\}$ recovers it.

If the same query is labeled with a single gold FAQ ($R=\{A\}$ only), then $\mathrm{Recall@}5 = 1$ as soon as $A$ appears anywhere in the five, even at rank $5$.

Macro example over three queries with one gold each, hits at ranks $2$, $15$, and miss: $\mathrm{Recall@}10 = (1 + 0 + 0)/3 \approx 0.333$. Raising the cutoff to $k=20$ lifts the second query and yields $\mathrm{Recall@}20 = 2/3$.

```python
def recall_at_k(
    ranked_ids: list[list[str]],
    relevant: list[set[str]],
    k: int,
    *,
    capped: bool = False,
) -> float:
    if k <= 0:
        raise ValueError("k must be positive")
    if len(ranked_ids) != len(relevant):
        raise ValueError("one relevance set is required per ranking")
    scores = []
    for ranking, gold in zip(ranked_ids, relevant):
        if not gold:
            continue
        top = set(ranking[:k])
        hits = len(gold & top)
        denom = min(k, len(gold)) if capped else len(gold)
        scores.append(hits / denom)
    if not scores:
        raise ValueError("no queries with nonempty relevance labels")
    return sum(scores) / len(scores)
```

## Example

A RAG pipeline for internal policy Q&A packs the top $8$ chunks into the prompt. Offline eval uses $200$ questions with human-judged answerable chunk IDs (often $1$–$3$ golds per question). Macro Recall@k is the mean per-query fraction of golds found, not "fraction of queries with a complete gold set."

| Stage | $k$ | Recall@k | What it means |
|-------|-----|----------|----------------|
| Dense ANN only | $8$ | $0.71$ | On average ~29% of needed gold chunks are still outside the packed window |
| Dense + BM25 hybrid fused to $50$ | $50$ | $0.93$ | First stage covers most labeled evidence |
| Hybrid top $50$ → cross-encoder keep $8$ | $8$ (after rerank) | $0.88$ | Rerank drops a few golds that sat near rank $40$–$50$ |

Product choice: set first-stage $k$ high enough that Recall@k plateaus near your coverage target (for example $0.95$ on the hard slice), then set the pack size the model sees from latency and context budget. If packed Recall@8 is low while first-stage Recall@50 is high, the bug is rank order or pack policy, not the index. If first-stage Recall@50 is already low, fix retrieval before blaming the LLM.

Sentence-Transformers `InformationRetrievalEvaluator` and MTEB/BEIR-style retrieval tasks report Recall@k alongside nDCG and MRR for this reason: different cutoffs expose different stages of the funnel.

## How it works in practice

1. **Fix the unit of retrieval.** Score chunk IDs, parent docs, or passage IDs consistently with production. Labels on parent docs with retrieval of child chunks (or the reverse) undercount hits.
2. **Choose $k$ to match a real budget.** First-stage candidate pool ($50$–$200$), post-rerank pack ($5$–$20$), or UI page size. Report Recall@k with that $k$, not a bare "recall."
3. **Build qrels you trust.** Binary answerability for RAG beats topical similarity. Incomplete labels make a correct retrieval look like a miss; stale labels punish the right current doc version.
4. **Macro-average, then slice.** Global means hide ACL-filtered tenants, long-tail queries, and multi-hop questions. Break out [evaluation slices](glossary://evaluation-slice).
5. **Plot recall vs $k$.** The curve shows how much headroom hybrid search, larger ANN lists, or query rewriting still have before the next stage.

## What fails in production

- **Low Recall@k, wrong stage blamed.** Generators invent answers when gold never entered context. The fix is retrieval/index/chunking, not a longer system prompt.
- **High Recall@k, bad answers.** Evidence was present but buried, truncated, poorly cited, or ignored. Move to MRR, NDCG, and generation-side checks.
- **Label / ID mismatch.** Chunk split changes IDs; qrels still point at old hashes. Metric collapses overnight after a reindex with no model change.
- **Filters and ACL.** Production drops docs the offline index still scores. Offline Recall@k overstates live coverage unless eval applies the same filters.
- **ANN under-retrieval.** Approximate indexes trade recall for speed. Measure Recall@k against exact top-$k$ on a sample before shipping a tighter nprobe / efSearch.
- **Optimistic gold.** Only easy FAQs labeled. Macro Recall@10 looks fine while the multi-doc legal slice is near zero.

## Trade-offs

| Metric | Question it answers | Blind spot |
|--------|---------------------|------------|
| Recall@k | Did gold enter the top $k$? | Ignores order among hits |
| Precision@k | How pure is the top $k$? | Ignores golds left outside $k$ |
| MRR | How early is the *first* hit? | Ignores second+ evidence |
| NDCG@k | How well is relevance gain ordered? | Requires relevance labels (binary or graded); still needs candidates |

Prefer Recall@k to size and debug the **candidate budget**. Prefer MRR for known-item "one right FAQ" products. Prefer NDCG when several graded passages and their order both matter. Use all three in [offline evaluation](glossary://offline-evaluation) gates for RAG: recall for inclusion, NDCG/MRR for order, then end-to-end answer quality.

## Why it matters here

Almost every retrieval and RAG lesson on LeetLLM bottoms out on a hard constraint: later stages cannot recover evidence that never entered the top $k$. Recall@k is the clean probe for that constraint. Tune first-stage Recall@k until the curve plateaus at your coverage target, keep $k$ honest about cost, then optimize ranking and generation. A strong generator on a low-recall retriever is still a low-recall system.

## Related terms

- [Candidate generation](glossary://candidate-generation)
- [Reranker](glossary://reranker)
- [MRR](glossary://mrr)
- [NDCG](glossary://ndcg)
- [Precision and recall](glossary://precision-recall)
