---
{
  "id": "core-retrieval-algorithms",
  "title": "Hybrid Search, BM25 & Reranking",
  "slug": "core-retrieval-algorithms",
  "section": "Applied LLM Engineering & RAG",
  "category": "RAG & Retrieval",
  "difficulty": "Medium",
  "order": 12,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Search can return the API-key quota page instead of the rotation steps. Lexical scores, dense vectors, fusion, MMR diversification, cross-encoder reranking, and ANN indexes each shape what reaches the prompt.",
  "keyConceptsTested": [
    "relevance judgments",
    "inverted index",
    "BM25",
    "dense retrieval",
    "cosine similarity",
    "reciprocal rank fusion",
    "Maximal Marginal Relevance (MMR)",
    "two-stage retrieve-then-rerank",
    "Hit Rate, Recall, and MRR",
    "approximate nearest neighbor recall"
  ],
  "aliases": [
    "hybrid-search-dense-sparse-retrieval",
    "reranking-cross-encoders-rag"
  ]
}
---

Ask `How do I rotate an API key?` and search might return the quota dashboard instead of the rotation steps. The language model then writes a fluent paragraph about daily rate limits. Nothing crashed, yet the passage explaining rotation never entered the prompt.

In [Clustering and PCA](/learn/clustering-pca-representation-learning), we examined vector geometry and compared cosine similarity with dot products. Retrieval puts that geometry to work on a concrete problem: given millions of technical passages, surface the exact few that answer a developer's question within milliseconds.

Four short passages are enough to trace every stage by hand:

| Doc | Passage | Relevance |
|---|---|---|
| `d1` | "API key rotation guide. Create a replacement key, deploy it, then revoke the old key." | Direct answer |
| `d2` | "Generate a new credential before disabling the previous credential." | Relevant paraphrase |
| `d3` | "Change a project display name in workspace settings." | Not relevant |
| `d4` | "API key <span data-glossary="quota">quota</span> dashboard. Usage limits reset daily." | Lexical distractor |

Passage `d4` repeats the exact phrase `API key` while solving the wrong problem. Passage `d2` explains rotation cleanly without mentioning `API`, `key`, or `rotate`. Every mechanism in this lesson (BM25, dense vectors, hybrid fusion, MMR, two-stage reranking, and ANN indexes) addresses a specific link in that chain.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Comparison of sparse BM25 and dense cosine search on four documentation passages. BM25 scores d1 at 1.61 and d4 at 1.39 while paraphrase d2 scores 0.00. Dense cosine places d2 closest to query q at 0.994 ahead of d1 at 0.957, d4 at 0.625, and d3 at 0.123." />
  <figcaption>BM25 ranks passages on literal token overlap and drops paraphrase d2 completely. Dense cosine similarity places d2 closest to query q at 0.994.</figcaption>
</figure>

## Sparse retrieval: inverted indexes and BM25

An **inverted index** maps each analyzed term to a **posting list** of document IDs containing it, along with term frequencies and positions.[^manning2008ir] Storing ID gaps encoded as variable-byte integers keeps lists compact, and a disjunction query traverses only matching posting lists ($O(\sum_{t \in Q} |\text{postings}(t)|)$ work before top-$K$ selection). Watch analyzer design on technical corpora: an alphabetic-only regex collapses both `AUTH_401` and `AUTH_403` into `auth`, so production schemas pair a raw keyword field for exact symbols with an analyzed text field for prose.

**Okapi BM25** scores each query term $t$ in document $d$ with two refinements over raw TF-IDF: **term-frequency saturation** ($k_1 \ge 0$) and **document-length normalization** ($0 \le b \le 1$).[^manning2008ir][^robertson1994][^robertson2009]

$$
\mathrm{Score}(t, d) = \mathrm{IDF}(t) \cdot \frac{f(t, d) \cdot (k_1 + 1)}{f(t, d) + k_1 \cdot \left(1 - b + b \cdot \frac{|d|}{\mathrm{avgdl}}\right)}
$$

Here $f(t, d)$ is term frequency in $d$, $|d|$ is document token length, and $\mathrm{avgdl}$ is the corpus mean length. Holding length fixed ($|d| = \mathrm{avgdl}$), the frequency factor $f(k_1 + 1)/(f + k_1)$ saturates at $k_1 + 1$: at Lucene's default $k_1 = 1.2$, counts of 1, 2, 4, and 20 produce weights 1.000, 1.375, 1.692, and 2.075 (always below 2.200), stopping keyword stuffing. Setting $b = 0.75$ penalizes verbose passages proportionally to $|d|/\mathrm{avgdl}$.[^lucene2026bm25][^lucene2026bm25Source] Lucene keeps IDF positive via:

$$
\mathrm{IDF}(t) = \ln\left(1 + \frac{N - \mathrm{df}(t) + 0.5}{\mathrm{df}(t) + 0.5}\right)
$$

On our four-passage corpus (lowercase alphabetic tokens, stopwords removed), the query reduces to `['rotate', 'api', 'key']`, $\mathrm{avgdl} = 8$, and $|d_1| = 11$ (length factor 1.28125). Both `api` and `key` have $\mathrm{df} = 2$, so $\mathrm{IDF} = \ln 2 \approx 0.693$. In `d1`, `api` ($f = 1$) contributes 0.601 and `key` ($f = 3$) contributes 1.008, totaling 1.609. Meanwhile `rotate` matches nothing because `d1` wrote `rotation`.

<!-- leetllm: test, output=show, deps=numpy,scikit-learn -->
```python title="bm25-and-inverted-index.py"
import re
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer

docs = {
    "d1": "API key rotation guide. Create a replacement key, deploy it, then revoke the old key.",
    "d2": "Generate a new credential before disabling the previous credential.",
    "d3": "Change a project display name in workspace settings.",
    "d4": "API key quota dashboard. Usage limits reset daily.",
}
doc_ids = list(docs)
stopwords = ["a", "an", "and", "do", "for", "how", "i", "in", "it", "the", "then", "to", "your"]
vec = CountVectorizer(lowercase=True, token_pattern=r"[a-z]+", stop_words=stopwords)
tf = vec.fit_transform([docs[d] for d in doc_ids]).toarray().astype(float)
q_terms = [w for w in re.findall(r"[a-z]+", "How do I rotate an API key?".lower()) if w not in stopwords]

k1, b = 1.2, 0.75
dl = tf.sum(axis=1)
df = (tf > 0).sum(axis=0)
idf = np.log(1.0 + (len(doc_ids) - df + 0.5) / (df + 0.5))

scores = np.zeros(len(doc_ids))
for term in q_terms:
    col = vec.vocabulary_.get(term)
    hits = [] if col is None else [doc_ids[i] for i in np.flatnonzero(tf[:, col])]
    print(f"postings[{term:6}] -> {hits}")
    if col is not None:
        freq = tf[:, col]
        scores += idf[col] * freq * (k1 + 1.0) / (freq + k1 * (1.0 - b + b * dl / dl.mean()))

ranking = sorted(zip(doc_ids, scores), key=lambda x: (-x[1], x[0]))
print("BM25:", [(d, round(float(s), 3)) for d, s in ranking])
assert [d for d, s in ranking if s > 0] == ["d1", "d4"]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
postings[rotate] -> []
postings[api   ] -> ['d1', 'd4']
postings[key   ] -> ['d1', 'd4']
BM25: [('d1', 1.609), ('d4', 1.386), ('d2', 0.0), ('d3', 0.0)]
```
<!-- leetllm: output:end -->

BM25 ranks `d1` first and quota page `d4` second while scoring relevant paraphrase `d2` at zero. That is **vocabulary mismatch**.

## Dense retrieval recovers paraphrases

Dense retrieval maps queries and passages to vectors in $\mathbb{R}^D$ using neural **bi-encoders** $E_Q(q)$ and $E_D(d)$.[^karpukhin2020] Because passage vectors are independent of incoming queries, you precompute and index them offline, then run one query forward pass at search time.

For directional embedding spaces, **cosine similarity** normalizes out vector lengths:

$$
\cos(q, d) = \frac{q \cdot d}{\lVert q \rVert_2 \lVert d \rVert_2}
$$

When vectors are unit-normalized ($\lVert v \rVert_2 = 1$), dot product and cosine yield identical rankings. Without normalization, dot product rewards larger vector norms, letting a high-magnitude partial match outrank a tightly aligned vector. Match the serving metric to the encoder's training objective (models like DPR trained with inner product can intentionally use norm signal[^karpukhin2020]).

<!-- leetllm: test, output=show, deps=numpy,scikit-learn -->
```python title="dense-cosine-and-norm-effect.py"
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

q = np.array([[1.0, 0.8, 0.0]])
doc_ids = ["d1", "d2", "d3", "d4"]
docs = np.array([[1.0, 0.4, 0.0], [0.9, 0.9, 0.0], [0.0, 0.2, 1.0], [0.4, 0.0, 0.3]])

cos_scores = cosine_similarity(q, docs)[0]
ranking = sorted(zip(doc_ids, cos_scores), key=lambda x: (-x[1], x[0]))
print("Dense cosine:", [(d, round(float(s), 3)) for d, s in ranking])

pair = np.array([[1.0, 0.8, 0.0], [6.0, 0.0, 0.0]])
names = ["aligned_paraphrase", "large_partial_match"]
print("dot winner:", names[int(np.argmax(pair @ q[0]))], "| cosine winner:", names[int(np.argmax(cosine_similarity(pair, q).ravel()))])
assert ranking[0][0] == "d2" and abs(ranking[0][1] - 0.994) < 0.001
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Dense cosine: [('d2', 0.994), ('d1', 0.957), ('d4', 0.625), ('d3', 0.123)]
dot winner: large_partial_match | cosine winner: aligned_paraphrase
```
<!-- leetllm: output:end -->

## Hybrid fusion and MMR diversification

BM25 catches exact identifiers and flags; dense bi-encoders bridge paraphrases. Combining them faces a score-scale mismatch: cosine lives in $[-1, 1]$, whereas BM25 varies with query length and IDF.

Two standard baselines handle fusion:
1. **Normalized score blending:** Min-max scale each lane and form $\alpha S_{\text{sparse}} + (1 - \alpha) S_{\text{dense}}$. Preserves score margins when tuned on held-out queries, though outliers shift extrema.
2. **Reciprocal Rank Fusion (RRF):** Ignores raw scores and sums inverse shifted ranks across lanes $L$:[^cormack2009]

$$
\mathrm{RRF}(d) = \sum_{\ell \in L} \frac{1}{k + r_\ell(d)}
$$

where $r_\ell(d)$ is 1-indexed rank in lane $\ell$ ($0$ if absent). The standard constant $k = 60$ (used in the original paper and Elasticsearch's `rank_constant` default[^cormack2009][^elastic2026rrf]) favors multi-lane consensus over a single lane's rank 1.

<figure>
  <img src="illustrations/_generated/hybrid_pipeline_dark.png" alt="RRF pipeline combining BM25 [d1, d4] and dense [d2, d1, d4]. At k=60, dual-lane consensus keeps d4 (0.0320) ahead of single-lane d2 (0.0164), so top-2 drops d2; at k=0, d2 (1.000) overtakes d4 (0.833)." />
  <figcaption>At k=60, consensus keeps distractor d4 (0.0320) ahead of dense #1 paraphrase d2 (0.0164), so a top-2 cutoff drops d2 before reranking.</figcaption>
</figure>

### Diversifying near-duplicates with Maximal Marginal Relevance

Even after fusion, corpora with mirrored pages or overlapping chunks can fill every prompt slot with slight rewordings of one passage. **Maximal Marginal Relevance (MMR)** iteratively picks the unselected document maximizing query relevance minus its maximum similarity to passages already chosen:[^carbonell1998]

$$
\operatorname{MMR}(q, D, S) = \operatorname{argmax}_{d_i \in D \setminus S} \left[ \lambda \operatorname{Sim}_1(d_i, q) - (1 - \lambda) \max_{d_j \in S} \operatorname{Sim}_2(d_i, d_j) \right]
$$

Setting $\lambda = 1$ recovers pure relevance ranking; lowering $\lambda$ penalizes redundancy. Watch one trap: on a narrow query with only one truly relevant passage (plus a mirror), aggressive MMR can pull an irrelevant distractor into slot 2. Deduplicate identical source IDs first, and reserve MMR for multi-aspect queries needing distinct coverage.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="rrf-and-mmr.py"
import numpy as np

doc_ids = ["d1", "d2", "d4"]
idx = {d: i for i, d in enumerate(doc_ids)}

def rrf(rankings: list[list[str]], k: int = 60) -> list[tuple[str, float]]:
    scores = np.zeros(len(doc_ids))
    for r in rankings:
        scores[[idx[d] for d in r]] += 1.0 / (k + np.arange(1, len(r) + 1))
    order = sorted(range(len(doc_ids)), key=lambda i: (-scores[i], doc_ids[i]))
    return [(doc_ids[i], round(float(scores[i]), 4)) for i in order]

print("RRF k=60:", rrf([["d1", "d4"], ["d2", "d1", "d4"]], k=60))
print("RRF k=0 :", rrf([["d1", "d4"], ["d2", "d1", "d4"]], k=0))

def mmr(q_vec: np.ndarray, pool: dict[str, np.ndarray], top_k: int, lam: float) -> list[str]:
    names = sorted(pool)
    mat = np.vstack([pool[n] for n in names])
    mat /= np.linalg.norm(mat, axis=1, keepdims=True)
    q = q_vec / np.linalg.norm(q_vec)
    rel, sim = mat @ q, mat @ mat.T
    sel, rem = [], list(range(len(names)))
    while rem and len(sel) < top_k:
        best = max(rem, key=lambda i: lam * rel[i] - (1.0 - lam) * (max(sim[i, j] for j in sel) if sel else 0.0))
        sel.append(best)
        rem.remove(best)
    return [names[i] for i in sel]

pool = {
    "d1_guide": np.array([1.0, 0.45, 0.0]),
    "d1_mirror": np.array([0.99, 0.46, 0.0]),
    "d2_credential": np.array([0.55, 0.95, 0.0]),
    "d4_quota": np.array([0.40, 0.0, 0.30]),
}
q_vec = np.array([1.0, 0.8, 0.0])
print("MMR lam=1.0:", mmr(q_vec, pool, 2, 1.0))
print("MMR lam=0.5:", mmr(q_vec, pool, 2, 0.5))
assert mmr(q_vec, pool, 2, 0.5) == ["d1_mirror", "d2_credential"]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
RRF k=60: [('d1', 0.0325), ('d4', 0.032), ('d2', 0.0164)]
RRF k=0 : [('d1', 1.5), ('d2', 1.0), ('d4', 0.8333)]
MMR lam=1.0: ['d1_mirror', 'd1_guide']
MMR lam=0.5: ['d1_mirror', 'd2_credential']
```
<!-- leetllm: output:end -->

## Two-stage retrieve-then-rerank: latency vs. recall

Why split search into two stages instead of scoring every document with one strong model? Because **token interaction depth** separates what can be precomputed offline from what must execute at query time.

| Architecture | Precomputed offline | Online work per candidate | Role in funnel |
|---|---|---|---|
| **Bi-encoder** (`E_Q(q) · E_D(d)`) | One vector $\mathbf{e}_d \in \mathbb{R}^D$ per chunk | Single dot product / ANN hop | Stage 1 recall (millions -> top 50 to 200) |
| **Late interaction** (ColBERT[^thakur2021]) | Per-token vectors per chunk | MaxSim token matrix sum | Middle ground: finer lexical matching, larger index |
| **Cross-encoder**[^nogueira2019] | Raw text only | Full transformer pass on `[CLS] q [SEP] d [SEP]` | Stage 2 precision (top 50 -> top 5 to 10) |

In a bi-encoder, query and document tokens never attend to one another inside the encoder. A **cross-encoder** concatenates query and candidate together (`[CLS] Query [SEP] Document [SEP]`), letting full self-attention inspect negations, version qualifiers, and parameter mismatches.[^nogueira2019]

That accuracy carries a quadratic sequence cost $O((L_Q + L_D)^2)$ per layer and linear scaling in shortlist depth $k$. Padding short pairs to the longest sequence in a batch wastes compute: pairs of lengths 32, 64, and 96 take $3 \times 96^2 = 27{,}648$ padded attention entries versus $32^2 + 64^2 + 96^2 = 14{,}336$ with length bucketing or ragged batching.[^triton2026RaggedBatching] Hosted rerank APIs also cap request size (Cohere recommends under 1,000 documents per call[^cohere2026rerank]).

Remember two hard limits in stage 2:
1. **Stage-1 recall caps stage 2:** Candidate recall $|R \cap C_k| / |R|$ sets the upper bound; a cross-encoder cannot rescue a passage dropped by stage 1.
2. **Raw logits are uncalibrated:** A sigmoid score of $0.95$ needs held-out calibration before acting as a relevance probability or abstention cutoff.[^guo2017]

<figure>
  <img src="illustrations/_generated/shortlist_cascade_dark.png" alt="Retrieval and reranking cascade. RRF (k=60) produces [d1, d4, d2]. A K=2 cutoff drops d2 so the cross-encoder leaves d1 (0.782) first; K=3 retains d2 so its score (0.953) promotes it to rank 1." />
  <figcaption>With RRF k=60, a K=2 shortlist drops d2 before reranking. Widening stage 1 to K=3 retains d2 so the cross-encoder lifts it to rank 1.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy,scipy -->
```python title="two-stage-rerank-and-budget.py"
import numpy as np
from scipy.special import expit

# Cross-encoder interaction features: [lexical_overlap, semantic_paraphrase, distractor_risk]
feats = {
    "d1": np.array([0.85, 0.45, 0.10]),
    "d2": np.array([0.15, 0.98, 0.02]),
    "d4": np.array([0.75, 0.05, 1.10]),
}
w, b = np.array([0.8, 3.6, -2.5]), -0.6
ce = {doc: float(expit(vec @ w + b)) for doc, vec in feats.items()}

for name, cand in [("RRF top-2", ["d1", "d4"]), ("RRF top-3", ["d1", "d4", "d2"])]:
    ranked = sorted(cand, key=lambda d: -ce[d])
    print(f"{name}: {ranked} (top={ce[ranked[0]]:.3f})")

# Stage-1 depth k vs latency budget (30 ms rerank cap)
depths = np.array([10, 25, 50, 100])
stage1_recall = np.array([0.72, 0.86, 0.94, 0.97])
lat_ms = 5.0 + 0.45 * depths
for k, rec, lat in zip(depths, stage1_recall, lat_ms):
    print(f"k={k:3d} | recall={rec:.2f} | rerank_ms={lat:4.1f} | {'OK' if lat <= 30.0 else 'OVER'}")
assert sorted(["d1", "d4", "d2"], key=lambda d: -ce[d])[0] == "d2"
```

<!-- leetllm: output:start -->
```text title="Output" output compact
RRF top-2: ['d1', 'd4'] (top=0.810)
RRF top-3: ['d2', 'd1', 'd4'] (top=0.952)
k= 10 | recall=0.72 | rerank_ms= 9.5 | OK
k= 25 | recall=0.86 | rerank_ms=16.2 | OK
k= 50 | recall=0.94 | rerank_ms=27.5 | OK
k=100 | recall=0.97 | rerank_ms=50.0 | OVER
```
<!-- leetllm: output:end -->

> **Key insight:** Tune first-stage candidate depth $k$ on the recall-latency knee ($k = 50$ here gains $+0.22$ recall over $k = 10$ within budget, whereas $k = 100$ doubles latency for $+0.03$ recall).

## Measure ranking before evaluating generation

Evaluate rankings directly on judged queries before blaming the LLM:

- **Hit Rate @ K:** Fraction of queries with at least one relevant passage in top $K$.
- **Recall @ K:** Mean fraction of all relevant passages per query captured in top $K$.
- **MRR @ K:** Mean of $1/r$ for the first relevant rank $r \le K$ ($0$ if absent). Ignores additional relevant passages after the first.
- **nDCG @ K:** Graded relevance with gain $2^{g_r} - 1$ discounted by $1 / \log_2(r + 1)$, normalized by ideal DCG.[^manning2008ir] Track unjudged rates to avoid pooled-annotation bias.[^thakur2021]

<!-- leetllm: test, output=show, deps=numpy -->
```python title="measure-retrieval-metrics.py"
import numpy as np

gold = {"q1": {"d1", "d2"}, "q2": {"d2"}, "q3": {"d4"}}
runs = {
    "run A": {"q1": ["d1", "d4", "d2"], "q2": ["d3", "d4", "d2"], "q3": ["d4", "d1", "d2"]},
    "run B": {"q1": ["d1", "d2", "d4"], "q2": ["d2", "d1", "d4"], "q3": ["d4", "d1", "d2"]},
}

def eval_run(run: dict[str, list[str]], k: int = 2, mrr_k: int = 3) -> tuple[float, float, float]:
    hits, recs, rrs = [], [], []
    for q, rel in gold.items():
        r = run.get(q, [])
        hits.append(float(any(d in rel for d in r[:k])))
        recs.append(len(set(r[:k]) & rel) / len(rel))
        first = next((i for i, d in enumerate(r[:mrr_k], 1) if d in rel), None)
        rrs.append(0.0 if first is None else 1.0 / first)
    return float(np.mean(hits)), float(np.mean(recs)), float(np.mean(rrs))

for name, run in runs.items():
    h, r, m = eval_run(run)
    print(f"{name}: hit@2={h:.3f} recall@2={r:.3f} mrr@3={m:.3f}")
assert eval_run(runs["run B"]) == (1.0, 1.0, 1.0)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
run A: hit@2=0.667 recall@2=0.500 mrr@3=0.778
run B: hit@2=1.000 recall@2=1.000 mrr@3=1.000
```
<!-- leetllm: output:end -->

## Approximate nearest neighbors: trading checks for recall

Exact flat search multiplies $N \times D$ floats per query: $10^6$ float32 vectors of $D = 1536$ occupy $6.144$ GB ($1.536 \times 10^9$ multiplications per query; $1.23$ TB/s memory read at 200 QPS unbatched). **ANN** indexes prune candidates or compress vectors to cut latency and memory:[^johnson2017]

| Index / Method | Mechanism | Key knobs | Trade-off |
|---|---|---|---|
| **IVF**[^johnson2017] | Partitions space into `nlist` k-means Voronoi cells; scans closest `nprobe` cells. | `nlist`, `nprobe` | Boundary queries miss neighbors in unprobed cells. |
| **HNSW**[^malkov2018] | Multi-layer proximity graph; top layers jump far, bottom layer refines locally. | $M$, `efConstruction`, `efSearch` | Higher RAM for graph edges; hnswlib needs `ef` $\ge K$.[^hnswlibParameters2026] |
| **PQ**[^jegou2011] | Quantizes $M$ subvectors to $2^{n_{\text{bits}}}$ centroids ($D=1536, M=96, 8$-bit: 6,144 B -> 96 B, -98.44% payload[^faiss2026indexes][^faiss2026pqImplementation]). | $M$, bits/code | Composes as IVF-PQ / HNSW-PQ; quantization adds distance error. |

<figure>
  <img src="illustrations/_generated/ann_index_knobs_dark.png" alt="Clustered IVF benchmark on 1,000 16D vectors across 20 Voronoi cells. Raising nprobe from 1 to 8 lifts Recall@10 from 0.584 to 0.974 at under 42% of flat scan checks; nprobe=20 reaches 1.000 at 1,020 checks." />
  <figcaption>Increasing IVF nprobe sweeps adjacent Voronoi cells to lift Recall@10 rapidly while staying far below flat-scan work; probing all 20 cells adds 20 centroid checks (1,020 total).</figcaption>
</figure>

Benchmark **ANN Recall@K** ($|\text{Top-}K_{\text{approx}} \cap \text{Top-}K_{\text{exact}}| / K$) against an exact scan of the **eligible** corpus. Watch **post-filtering starvation**: when version-2 passages are 5% of an index and version-1 passages score slightly higher, taking global top-5 and filtering afterward returns an empty list even with exact math. Filter before or inside ANN search (filter-aware ANN[^qdrantDenseIndex2026]).

<!-- leetllm: test, output=show, deps=numpy,scikit-learn -->
```python title="ivf-recall-and-filter-starvation.py"
import numpy as np
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs

vecs, _ = make_blobs(n_samples=1000, centers=20, n_features=16, cluster_std=1.6, center_box=(-2.5, 2.5), random_state=42)
km = KMeans(n_clusters=20, n_init=10, random_state=42).fit(vecs)
inv = [np.flatnonzero(km.labels_ == c) for c in range(20)]

rng = np.random.default_rng(7)
qs = vecs[rng.choice(len(vecs), 100, replace=False)] + 0.9 * rng.standard_normal((100, 16))
exact_top10 = np.argsort(((qs[:, None, :] - vecs[None, :, :]) ** 2).sum(2), axis=1)[:, :10]

def eval_ivf(nprobe: int, k: int = 10) -> tuple[float, float]:
    probed = np.argsort(((qs[:, None, :] - km.cluster_centers_[None, :, :]) ** 2).sum(2), axis=1)[:, :nprobe]
    recs, chks = [], []
    for i in range(len(qs)):
        cand = np.concatenate([inv[c] for c in probed[i]])
        chks.append(20 + len(cand))
        approx = cand[np.argsort(((vecs[cand] - qs[i]) ** 2).sum(1))[:k]]
        recs.append(len(np.intersect1d(approx, exact_top10[i])) / k)
    return float(np.mean(recs)), float(np.mean(chks))

for npb in (1, 2, 4, 8, 20):
    rec, chk = eval_ivf(npb)
    print(f"nprobe={npb:2d} | Recall@10={rec:.3f} | checks={chk:6.1f} ({100 * chk / 1000:5.1f}% flat)")

rng_f = np.random.default_rng(11)
qf = rng_f.standard_normal(16); qf /= np.linalg.norm(qf)
df = np.vstack([rng_f.standard_normal((475, 16)) + 0.35 * qf, rng_f.standard_normal((25, 16))])
df /= np.linalg.norm(df, axis=1, keepdims=True)
vers = np.array([1] * 475 + [2] * 25)
sc = df @ qf
post = [int(i) for i in np.argsort(-sc)[:5] if vers[i] == 2]
v2 = np.flatnonzero(vers == 2)
pre = v2[np.argsort(-sc[v2])[:5]].tolist()
print("post-filtered v2:", post, "| pre-filtered v2:", pre)
assert post == [] and len(pre) == 5 and eval_ivf(8)[0] >= 0.95
```

<!-- leetllm: output:start -->
```text title="Output" output compact
nprobe= 1 | Recall@10=0.672 | checks=  72.1 (  7.2% flat)
nprobe= 2 | Recall@10=0.809 | checks= 121.5 ( 12.1% flat)
nprobe= 4 | Recall@10=0.918 | checks= 219.1 ( 21.9% flat)
nprobe= 8 | Recall@10=0.978 | checks= 417.0 ( 41.7% flat)
nprobe=20 | Recall@10=1.000 | checks=1020.0 (102.0% flat)
post-filtered v2: [] | pre-filtered v2: [494, 482, 493, 480, 477]
```
<!-- leetllm: output:end -->

```checkpoint
An approximate index cuts p99 latency in half but drops candidate Recall@20 from `0.94` to `0.81`. Can upgrading to a stronger cross-encoder recover the missing passages?
---
No. A reranker only reorders candidates it receives. Raise `nprobe` or `efSearch` until candidate recall recovers before spending more compute downstream.
```

## Retrieval debugging map

| Stage | Diagnostic question | What to inspect |
|---|---|---|
| **Analyzer & BM25** | Did tokenization drop exact identifiers or flags? | Posting lists; keyword vs. analyzed fields |
| **Dense bi-encoder** | Do paraphrases rank close under the trained metric? | Cosine vs. dot-product rankings on judged queries |
| **Fusion & MMR** | Did RRF consensus or low $\lambda$ drop a single-lane hit? | Per-lane ranks, fusion $k$, shortlist cutoff |
| **Two-stage reranker** | Missed in stage 1, or outscored in stage 2? | Stage-1 candidate recall vs. stage-2 latency/scores |
| **ANN & filters** | Did low `nprobe`/`efSearch` or post-filtering starve hits? | ANN vs. exact recall under selective filters |

```mastery-quiz
[
  {
    "question": "Hold IDF and the BM25 length factor fixed at 1 with k1 = 1.5. What are the term-frequency weights at counts 3 and 6, and their upper limit?",
    "options": [
      "1.667, 2.000, and 2.500",
      "1.500, 2.250, and 3.000",
      "2.000, 2.500, and 3.500",
      "1.250, 1.667, and 2.000"
    ],
    "answer": "1.667, 2.000, and 2.500",
    "explanation": "f(k1 + 1)/(f + k1) gives 7.5/4.5 = 1.667 at f=3, 15/7.5 = 2.000 at f=6, and approaches k1 + 1 = 2.500."
  },
  {
    "question": "A sparse lane returns [s1, s3] and a dense lane returns [s2, s3, s1]. RRF uses k = 2 (1-based ranks) and keeps top 2 before a cross-encoder that scores s2 highest. Which shortlist reaches the reranker?",
    "options": [
      "[s1, s3]; the reranker cannot recover the dropped s2.",
      "[s3, s1]; the reranker pulls s2 back from the dense lane.",
      "[s2, s1]; the reranker promotes s2 to rank 1.",
      "[s1, s2]; the reranker drops s3."
    ],
    "answer": "[s1, s3]; the reranker cannot recover the dropped s2.",
    "explanation": "RRF gives s1 = 1/3 + 1/5 = 0.533, s3 = 1/4 + 1/4 = 0.500, s2 = 1/3 = 0.333. Top-2 keeps [s1, s3] and drops s2 permanently."
  },
  {
    "question": "In MMR, doc A has query cosine 0.95, near-duplicate B has query cosine 0.94 (similarity 0.99 to A), and distinct doc C has query cosine 0.80 (similarity 0.20 to A). After selecting A first, which doc wins at lambda = 0.5?",
    "options": [
      "C (MMR 0.300 vs -0.025 for B).",
      "B (query cosine 0.94 beats 0.80).",
      "B (MMR ignores redundancy).",
      "Neither; MMR stops after one document."
    ],
    "answer": "C (MMR 0.300 vs -0.025 for B).",
    "explanation": "MMR(B) = 0.5(0.94) - 0.5(0.99) = -0.025, while MMR(C) = 0.5(0.80) - 0.5(0.20) = 0.300, so C wins."
  },
  {
    "question": "Three cross-encoder pairs have token lengths 32, 64, and 96. Counting T^2 attention entries only, how does naive max-length padding compare to unpadded ragged batching?",
    "options": [
      "27,648 padded versus 14,336 unpadded.",
      "14,336 padded versus 27,648 unpadded.",
      "12,288 padded versus 6,144 unpadded.",
      "27,648 padded versus 18,432 unpadded."
    ],
    "answer": "27,648 padded versus 14,336 unpadded.",
    "explanation": "Padded computes 3 * 96^2 = 27,648 entries; ragged batching computes 32^2 + 64^2 + 96^2 = 14,336."
  },
  {
    "question": "Five passages have descending similarity: a (v2, 0.99), b (v1, 0.98), c (v2, 0.97), d (v1, 0.96), e (v2, 0.95). For version v2 and K = 2, what do post-filtering after global top-2 versus pre-filtering return?",
    "options": [
      "[a] versus [a, c].",
      "[a, c] versus [a, c].",
      "[a] versus [a, e].",
      "[a, b] versus [a, c]."
    ],
    "answer": "[a] versus [a, c].",
    "explanation": "Global top-2 [a, b] drops b to leave [a], whereas pre-filtering searches [a, c, e] and returns [a, c]."
  }
]
```

> **Next:** Continue to [Production RAG Pipelines](/learn/design-production-rag-pipeline).
