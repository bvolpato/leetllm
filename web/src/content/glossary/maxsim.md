---
title: MaxSim
aliases: ["maximum similarity", "max sim"]
importance: 84
---
**MaxSim** (maximum similarity) is the late-interaction scoring operator used by ColBERT and related multi-vector retrievers. Given bags of token embeddings for a query and a document, MaxSim takes each query token's highest similarity to any document token, then sums those row maxima into one relevance score. Documents can be encoded offline; at query time only the query bag is produced and the cheap MaxSim aggregation runs over candidates (Khattab and Zaharia, SIGIR 2020; ColBERTv2, Santhanam et al., NAACL 2022).

MaxSim is the math that makes late interaction concrete. It sits between a single pooled vector (one cosine for the whole passage) and a full cross-encoder (joint attention over the pair).

## Intuition

Mean pooling collapses every token into one vector, so a rare identifier, a version number, or a second constraint can be averaged away. MaxSim keeps the bag. Each query token soft-searches the document for its best contextual match and contributes only that best hit. Evidence for "API," "key," and "rotation" can come from different sentences and still add up.

The operator is query-sided and asymmetric: every query vector contributes its best match, even when that match is weak or negative. There is no requirement that every token pass a support threshold, and one document vector can win for several query vectors. Inspecting per-token maxima helps diagnose ranking failures; these similarities do not prove factual support.

## Formula

Let $Q = \{q_1,\ldots,q_N\}$ and $D = \{d_1,\ldots,d_M\}$ be L2-normalized token embeddings (ColBERT projects BERT states to a small width such as 128 before normalizing). With cosine implemented as a dot product, the ColBERT / ColBERTv2 score is:

$$
\mathrm{MaxSim}(Q, D) = S_{q,d} = \sum_{i=1}^{N} \max_{1 \le j \le M} q_i^\top d_j
$$

Equivalently, form the $N \times M$ matrix of pairwise similarities $S_{ij} = q_i^\top d_j$, take the maximum of each row, and sum the $N$ maxima. There are no learned parameters inside the interaction itself: the encoders absorb all training signal; MaxSim is fixed aggregation.

Original ColBERT also evaluated squared $L_2$ distance as an alternative similarity. The [reference ColBERT implementation](https://github.com/stanford-futuredata/ColBERT/blob/main/colbert/modeling/colbert.py) supports normalized token vectors and dot-product scoring; verify the similarity contract of the deployed variant rather than assuming every stack uses it.

Some systems use a length-normalized variant $N^{-1}\sum_i\max_j\mathrm{sim}(q_i,d_j)$. Classical ColBERT uses a sum with query augmentation to a configured length, including contextualized `[MASK]` positions: longer raw text does not necessarily mean more scored vectors. Calibration depends on the encoder, augmentation, normalization, and query-length contract.

## How it works

1. **Encode offline.** Run the document encoder once per passage. Keep one contextual vector per kept token (ColBERT drops punctuation embeddings on the document side). Store the bag, often residual-compressed as in ColBERTv2.
2. **Encode online.** Tokenize the query, mark it with `[Q]`, optionally pad with `[MASK]` up to a fixed length (classically 32), and produce normalized query vectors.
3. **Build similarities.** For each candidate document, compute $q_i^\top d_j$ for all $i,j$ (or an approximate subset during candidate generation).
4. **Row-wise max.** For each query token $i$, keep only $\max_j q_i^\top d_j$. That value is the strength of the best support for that token.
5. **Sum.** Add the $N$ maxima. Rank documents by the total.

Exact MaxSim over a shortlist uses pairwise similarities and max-reduction, still more work than one vector per document. [PLAID](https://arxiv.org/abs/2205.09707) uses centroid interaction and pruning to reduce candidate work; approximation and pruning can miss candidates, so do not assume its estimates are universal lower bounds. Final scoring quality still depends on the candidate set.

## Example

Three query tokens and four document tokens after L2 normalization. Each cell is a cosine (dot product of unit vectors):

|  | $d_1$ gradient | $d_2$ clipping | $d_3$ optimizer | $d_4$ unscale | row max |
| --- | ---: | ---: | ---: | ---: | ---: |
| $q_1$ gradient | **0.93** | 0.21 | 0.18 | 0.25 | 0.93 |
| $q_2$ clipping | 0.19 | **0.91** | 0.22 | 0.30 | 0.91 |
| $q_3$ order | 0.15 | 0.20 | **0.20** | 0.17 | 0.20 |

$$
\mathrm{MaxSim} = 0.93 + 0.91 + 0.20 = 2.04
$$

`gradient` and `clipping` found strong similarity anchors. `order` reached only 0.20 against document tokens such as `optimizer` and `unscale`, which flags a possible sequencing mismatch even though the total looks reasonable. Similarity alone cannot prove whether the passage supports the constraint; verify its text. In production debugging, dump the argmax document token per query token to inspect token-level matches alongside the scalar.

Minimal NumPy sketch (exact MaxSim for one pair):

```python
import numpy as np

def maxsim(Q: np.ndarray, D: np.ndarray) -> float:
    # Q: (N, d), D: (M, d), finite L2-normalized rows, M > 0
    S = Q @ D.T          # (N, M) cosines
    return float(S.max(axis=1).sum())
```

For many candidates, stack document bags with padding or use a packing kernel (PLAID-style padding-free MaxSim) so you do not materialize a dense 3D tensor of waste. Padded document positions must be excluded from the maximum, for example by assigning their similarities $-\infty$; zero-padding alone can incorrectly replace a negative real maximum with zero. The sketch assumes unpadded document bags with at least one valid row.

## Trade-offs

| Choice | Prefer when | Watch for |
| --- | --- | --- |
| MaxSim over token bags | Multi-constraint or fine-grained queries; mid-stage or multi-vector first stage | Index stores many vectors per doc; scoring is $O(NMd)$ per candidate |
| Single-vector cosine (pooled bi-encoder) | Huge corpora, tight storage/latency, good enough average recall | Pooling blurs rare terms and multi-hop constraints |
| Full cross-encoder | Shortlist of tens or low hundreds where joint attention is worth the cost | Cannot pre-index the full corpus cheaply |
| Mean of pairwise sims (not max) | Soft averaging experiments | Dilutes strong token matches; less pruning-friendly than max |
| Sum without query-length control | Fixed query template / fixed pad length | Longer queries dominate; stopwords and `[MASK]` pads add mass |

**What fails in production.** (1) **Missing constraints:** a high total can hide one weak row max; always inspect per-token maxima on failures. (2) **Negation and modifiers:** MaxSim can latch onto "eligible" while ignoring "not" or a number that never appears. (3) **Boilerplate and length:** more document tokens raise the chance of a lucky high max; prune punctuation, repeated headers, or low-value tokens as the encoder training expects. (4) **Tokenizer drift:** train-time and serve-time WordPiece / special-token choices must match, including `[Q]` / `[D]` markers and query mask padding. (5) **Uncalibrated scores:** MaxSim totals are ranking signals, not probabilities; do not threshold them across models or query lengths without measurement. (6) **Approximate search error:** candidate generation with partial bags or centroid pruning can drop the true max document token; exact MaxSim on the final shortlist still depends on that shortlist being complete enough for your recall@k goal.

## Why it matters here

MaxSim is the operator behind ColBERT-style retrieval in the RAG curriculum. It shows how to keep token-level evidence without running a full cross-encoder over every document in a large corpus. When single-vector recall plateaus on identifiers, multi-part policies, or long-tail phrasing, MaxSim is the concrete scoring rule you implement, profile, and debug: row maxima first, sum second, evidence map when something ranks wrong.

## Related terms

- [Late interaction](glossary://late-interaction)
- [ColBERT](glossary://colbert)
- [Bi-encoder](glossary://bi-encoder)
- [Cosine similarity](glossary://cosine-similarity)
- [Cross-encoder](glossary://cross-encoder)
