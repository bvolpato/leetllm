---
title: Embedding
importance: 98
---
An **embedding** is a learned numeric [vector](glossary://vector) that places an item in a continuous space so similarity, clustering, ranking, and retrieval become geometry. The item can be a token, sentence, document chunk, image, user, product, or any other object the encoder was trained to represent. Nearby vectors mean "these items behave alike *for this task*": a retrieval embedding, a classification embedding, and a recommender embedding can put the same text in different neighborhoods because the training objective defined different notions of closeness.

Two related uses of the word show up in LLM systems and are easy to confuse:

1. **Token (input) embeddings.** A vocabulary lookup table $E \in \mathbb{R}^{|V| \times d}$ maps each token id to a $d$-dimensional row. That is the first step inside a transformer: discrete ids become continuous vectors that attention and MLPs then transform into contextual hidden states.
2. **Item / sentence / chunk embeddings.** A full encoder (often a dual encoder / [bi-encoder](glossary://bi-encoder)) maps a whole string or multimodal input to one fixed-size vector used for search, clustering, semantic cache keys, and RAG candidate generation. The vector is usually a pool over token states (`[CLS]`, mean pool, last-token, or a trained projection head), not a raw table row.

The rest of this entry focuses on the second sense, with the first as the building block.

## Intuition

An embedding turns a messy object into coordinates. Strings, images, and structured records are not natively comparable by arithmetic. Once each item is $e \in \mathbb{R}^{d}$, you can compare pairs with [cosine similarity](glossary://cosine-similarity) or a [dot product](glossary://dot-product), find nearest neighbors with [ANN search](glossary://ann-search), cluster with $k$-means, and train linear heads on top.

Embedding geometry is task-specific and shaped by training data, loss, negatives, pooling, and normalization. Classic static word vectors (Word2Vec CBOW/Skip-gram, GloVe) assign one vector per word type regardless of context. Modern sentence and passage encoders assign a vector that depends on the full input, so "river bank" and "bank account" can land in different places when the surrounding text differs.

What "near" means is defined by the objective. [Contrastive learning](glossary://contrastive-learning) (InfoNCE / dual-encoder ranking) raises matched-pair scores relative to negatives under the chosen similarity metric. Supervised contrastive losses can pull same-class items together; ordinary classification cross-entropy optimizes class labels, while pairwise closeness needs an explicit metric-learning objective. Multimodal models like CLIP align image and text towers into one space. Change the pairs, and you change the map.

## How it works

**Token table (inside the model).** For vocabulary size $|V|$ and width $d$, the embedding matrix is $E \in \mathbb{R}^{|V| \times d}$. Token id $i$ becomes row $E_i$. A sequence of length $n$ becomes $X \in \mathbb{R}^{n \times d}$ before positional encoding and transformer blocks. Storage cost is roughly $|V| \cdot d \cdot \mathrm{bytes\_per\_param}$ (for example $|V|=50{,}000$, $d=768$, fp16 $\approx 77$ MB for the table alone).

**Item encoder (for retrieval).** A bi-encoder $f$ maps text $x$ to $e = f(x) \in \mathbb{R}^{d}$. Common path:

1. Tokenize $x$ with the encoder's tokenizer (artifact is part of the model contract).
2. Run the transformer; obtain token states $H \in \mathbb{R}^{n \times h}$.
3. Pool to one vector (mean of non-padding tokens, CLS, or last token).
4. Optional linear projection to $d$ and L2 normalize so cosine equals inner product.

Documents are embedded offline and stored in a vector index. At query time you embed the query and search. That is why [dense retrieval](glossary://dense-retrieval) scales: $N$ corpus vectors are precomputed, so each request pays one encode plus ANN instead of $N$ joint cross-encodes.

**Similarity contract.** After L2 normalization ($\lVert e \rVert_2 = 1$),

$$
\cos(e_q, e_d) = e_q^\top e_d
$$

Production indexes often normalize once at write and at query, then use maximum inner product search (MIPS). Raw (unnormalized) dot product and Euclidean distance are different contracts; match the metric to how the model was trained and evaluated.

## Formula

**Lookup.** For the one-hot vector $t \in \mathbb{R}^{|V|}$ of token $i$ (an integer id instead indexes row $E_i$ directly):

$$
e_{\mathrm{tok}} = E^\top t = E_i \in \mathbb{R}^{d}
$$

**Mean-pooled sentence embedding** over non-pad positions $\mathcal{P}$:

$$
e = \frac{1}{|\mathcal{P}|}\sum_{j \in \mathcal{P}} h_j, \qquad
\hat{e} = \frac{e}{\lVert e \rVert_2}
$$

**Contrastive dual-encoder score** (temperature $\tau$), as in InfoNCE / DPR-style training:

$$
\mathcal{L}
=
-\log
\frac{\exp(\mathrm{sim}(q, p^+)/\tau)}
{\exp(\mathrm{sim}(q, p^+)/\tau)+\sum_j \exp(\mathrm{sim}(q, p_j^-)/\tau)}
$$

The score may use cosine or raw dot product; the original [DPR](https://aclanthology.org/2020.emnlp-main.550/) uses an unnormalized dot product with no explicit temperature. In-batch negatives turn $B$ query and $B$ passage vectors into a $B \times B$ score matrix from $2B$ encoded inputs, typically computed in two batched encoder forward passes.

**Matryoshka / truncatable dimensions.** Some models ([MRL; Kusupati et al., 2022](https://arxiv.org/abs/2205.13147)) train so prefixes $e_{1:d'}$ remain useful. OpenAI's `text-embedding-3-*` models expose a [`dimensions` parameter](https://developers.openai.com/api/docs/guides/embeddings) so you can shorten vectors (for example 3072 $\to$ 256 for `text-embedding-3-large`) with a measured quality trade-off. If you truncate manually after the fact, re-normalize:

```python
import numpy as np

def truncate_and_normalize(e, d_prime):
    e = np.asarray(e, dtype=np.float32)[:d_prime]
    n = np.linalg.norm(e)
    return e / n if n > 0 else e
```


## Example

**Semantic neighbors despite different words.** Query: "How do I reset my API key?" A good support-doc embedding places that near "Where can I rotate credentials?" even when term overlap is low. The same model may still rank a long boilerplate footer near many queries if length, template text, or nav chrome dominate the pooled vector. That is a chunking and content-prep failure as much as a model failure.

**Worked storage numbers.** Suppose you embed $2$ million chunks at $d = 1536$ in float32:

$$
2 \times 10^6 \times 1536 \times 4\,\mathrm{B} = 12{,}288{,}000{,}000\,\mathrm{B} \approx 11.4\,\mathrm{GiB}
$$

of raw vectors before index overhead. Truncating a Matryoshka-capable model to $d = 256$ cuts that to about $1.9\,\mathrm{GiB}$. Product quantization or int8 can cut further at some recall cost. Dimension, dtype, and ANN structure are production knobs, not afterthoughts.

**Index contract.** Embed corpus with model `emb-v3`, L2-normalize, build HNSW under inner product. At serve time use the **same** model id, same tokenizer, same normalize-then-IP path. If you upgrade the encoder without re-embedding the corpus, query vectors and index vectors live in different spaces and rankings become noise.

## Sizing and production

| Concern | What to fix in the embedding path |
| --- | --- |
| Recall of paraphrases | Model choice, domain fine-tune, hard negatives |
| Exact IDs / CVEs / SKUs | Hybrid BM25 + dense; do not rely on dense alone |
| Score thresholds | Calibrate per model and corpus; never copy $0.8$ cutoffs across families |
| Stale docs | Re-embed on content change; version model + index together |
| Latency / cost | Batch encode, smaller $d$, MRL prefixes, quantization, cache query embeddings |
| Boilerplate dominance | Better [chunking](glossary://chunking), strip chrome, inspect nearest neighbors |
| Anisotropy | Random-pair cosine baseline; crowded scores need geometry diagnosis |

Inspect nearest neighbors alongside benchmark averages (MTEB-style aggregates). A strong retrieval embedding should surface exact answers, paraphrases, rare terminology, and short queries without letting boilerplate, document length, or duplicate chunks dominate the top hits. Log embedding **model version**, dimension, and normalize policy with every index and every request trace.

## Why it matters here

Embeddings are the shared substrate behind semantic search, RAG candidate generation, vector databases, clustering, personalization, semantic caches, and the token tables inside transformers. Curriculum work on dense retrieval, bi-encoders, contrastive losses, cosine similarity, ANN indexes, and multimodal models all assumes you know what the vector is, how it was trained, and which production contracts (version, metric, dimension, reindex) keep the geometry honest.

## Related terms

- [Vector](glossary://vector)
- [Cosine similarity](glossary://cosine-similarity)
- [Dense retrieval](glossary://dense-retrieval)
- [Contrastive learning](glossary://contrastive-learning)
- [Bi-encoder](glossary://bi-encoder)
