---
title: Contrastive learning
importance: 84
---
Contrastive learning trains representations by ranking: for each anchor, a chosen positive should score higher in embedding space than a set of competing negatives. The usual objective is a temperature-scaled softmax over similarities (InfoNCE / NT-Xent). Geometry is not "make these two vectors identical"; it is "this pair should win over the alternatives." Pair construction defines what "similar" means for the task.

## Intuition

Supervised classification says "this input is class $c$." Contrastive training says "this query matches *this* passage more than those others." Positives teach what belongs together (paraphrases, image-caption pairs, two augmented views of one image). Negatives teach which tempting neighbors must stay apart. Easy random negatives teach coarse separation quickly, then stop helping. Hard negatives force fine decision boundaries. The loss only shapes neighborhoods as well as the pairs you supply.

## Formula

For an anchor embedding $q$, positive $k_+$, negatives $\{k_j\}$, and temperature $\tau$:

$$
\mathcal{L} = -\log\frac{\exp(\mathrm{sim}(q,k_+)/\tau)}{\exp(\mathrm{sim}(q,k_+)/\tau)+\sum_j\exp(\mathrm{sim}(q,k_j)/\tau)}
$$

$\mathrm{sim}$ is usually cosine similarity or a scaled dot product on L2-normalized vectors. This is InfoNCE (van den Oord et al., CPC, 2018). SimCLR's NT-Xent is the same normalized temperature-scaled form over in-batch candidates. Smaller $\tau$ sharpens the softmax toward hard competitors; larger $\tau$ flattens the signal.

Triplet loss is a related objective: it compares a chosen positive and negative through the margin $d(a,p) + \alpha \leq d(a,n)$. InfoNCE instead normalizes over a candidate pool. An optimization run can leave some triplet margins unsatisfied.

## Worked numbers

Batch of two query-passage pairs, unit vectors, cosine similarities for query $q_1$:

| Candidate | Similarity | Role |
|---|---|---|
| $p_1$ | $0.90$ | positive |
| $p_2$ | $0.20$ | in-batch negative |

At $\tau = 0.05$: logits are $0.90/0.05 = 18$ and $0.20/0.05 = 4$. Softmax puts almost all mass on $p_1$ ($P_+ \approx 0.999999$), so the row loss is near zero. Swap the scores and the loss jumps to about $14$ nats: a strong gradient that pulls the true pair up and the wrong neighbor down.

Same gap $0.90 - 0.20 = 0.70$ at different temperatures:

| $\tau$ | $P(\text{positive})$ | Effect |
|---|---|---|
| $0.01$ | $\approx 1$ | easy rows saturate (near-zero gradient); competitive wrong neighbors still get extreme pressure |
| $0.05$ | $\approx 0.999999$ | very sharp |
| $0.10$ | $\approx 0.9991$ | still confident |
| $1.00$ | $\approx 0.668$ | soft ranking signal |

When $P_+\approx 1$ at tiny $\tau$, already-correct pairs contribute almost no gradient. False-negative pressure is mainly when a wrong neighbor is competitive. Tune $\tau$ with the batch recipe and label noise, not in isolation.

## Example

Train a support-doc bi-encoder. Positive: query "rotate API credentials" with the credential-rotation runbook. Hard negative: "reset password" doc (shared security language, different intent). Easy negatives: unrelated GPU-memory or tokenizer guides.

With batch size $B$, each mini-batch yields a $B \times B$ score matrix from $B$ query vectors and $B$ passage vectors: diagonal cells are positives, off-diagonal cells are in-batch negatives ($B^2$ scores from $2B$ encoded inputs, which can be processed in batched calls). CLIP uses a symmetric image$\to$text and text$\to$image objective. SimCLR's two augmented views form a positive pair; for each anchor it excludes both that positive and the anchor itself from the negative set.

If two passages both answer the same query and land in one batch, treating one as a negative is a **false negative**: the loss pushes valid matches apart. Dedup, multi-positive losses, or careful mining reduce that damage.

## How training actually works

1. **Define positives for the task.** Supervised: labeled query-doc or paraphrase pairs. Self-supervised text (SimCSE): two dropout passes of the same sentence. Vision (SimCLR): two random augmentations. Multimodal (CLIP): image and its caption.
2. **Choose negatives.** In-batch is cheap and scales with $B$. Mine hard negatives from BM25, ANN near-misses, or a previous model. Verify they are truly wrong.
3. **Encode independently** (bi-encoder / dual tower) so document vectors can be indexed offline.
4. **Score with cosine or dot product**, apply temperature, minimize InfoNCE (often bidirectional for dual towers).
5. **Evaluate geometry on retrieval metrics**, not training loss alone: recall@$k$, nDCG, nearest-neighbor tables, STS/MTEB-style checks. A collapsed loss can hide wrong similarity notions.

```python
# One InfoNCE row (stable log-sum-exp style)
# logits[j] = sim(q, candidate_j) / tau
loss = logsumexp(logits) - logits[positive_index]
```

## Production diagnosis

| Symptom | Likely pair / objective issue |
|---|---|
| Misses obvious docs | Positives too weak or domain mismatch |
| Near-topic wrong docs dominate | Need harder negatives |
| Collapses on one phrasing style | Diversify positives and queries |
| Loss low, retrieval poor | Overfitting batch artifacts; check false negatives |
| Identical text, jittery vectors at serve | Dropout left on; set eval mode |

Nearest-neighbor inspection beats watching training loss alone.

## Why it matters here

Contrastive learning is the training engine behind dense retrieval embeddings, RAG candidate generation, sentence-embedding fine-tunes (SBERT, SimCSE, E5-style models), and multimodal aligners like CLIP. When search returns the wrong chunk, the root cause is often pair design or negatives, not "the vector database." Curriculum lessons on sentence embeddings, InfoNCE, bi-encoders, and vision-language models all rest on this objective family.

## Related terms

- [InfoNCE](glossary://infonce)
- [Hard negative](glossary://hard-negative)
- [Embedding](glossary://embedding)
- [Dense retrieval](glossary://dense-retrieval)
- [Bi-encoder](glossary://bi-encoder)
