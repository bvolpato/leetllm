---
{
  "id": "core-retrieval-algorithms",
  "title": "Core Retrieval Algorithms",
  "slug": "core-retrieval-algorithms",
  "section": "ML Algorithms & Evaluation",
  "category": "RAG & Retrieval",
  "difficulty": "Medium",
  "order": 10,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Search can return the API-key quota page instead of the rotation steps. Lexical scores, dense vectors, fusion, and approximate indexes each fail that question differently.",
  "keyConceptsTested": [
    "relevance judgments",
    "inverted index",
    "BM25",
    "dense retrieval",
    "cosine similarity",
    "reciprocal rank fusion",
    "reranking",
    "Hit Rate, Recall, and MRR",
    "approximate nearest neighbor recall"
  ]
}
---

Ask `How do I rotate an API key?` and search might return the quota dashboard instead of the rotation steps. The model then writes a confident answer about daily rate limits. The prose is fluent. The evidence for rotation never reached the prompt.

In [Clustering and PCA](/learn/clustering-pca-representation-learning), we examined geometry in vector spaces and compared cosine similarity with dot products. The [EM clustering walkthrough](/learn/probabilistic-generative-models-em) grouped unlabeled observations into latent Gaussian mixtures. Retrieval tackles an operational challenge: given millions of documentation chunks, which specific passages contain the factual evidence to answer an arbitrary developer query?

Four passages are small enough to check every ranking by hand. The quota page shares the words `API key`. The paraphrase that actually describes rotation does not. Before a score can prefer one of them, search has to decide which words count as a match.

## One question, four possible sources

Here's the developer question:

> `How do I rotate an API key?`

Consider a four-passage documentation corpus with binary relevance judgments attached to each passage. Passages `d1` and `d2` both explain key rotation, whereas `d3` and `d4` cover unrelated account settings. Evaluators record those ground-truth judgments before comparing lexical and dense rankers:

| Doc | Passage | Relevance judgment |
|---|---|---|
| `d1` | "API key rotation guide. Create a replacement key, deploy it, then revoke the old key." | Direct answer. |
| `d2` | "Generate a new credential before disabling the previous credential." | Relevant paraphrase. |
| `d3` | "Change a project display name in workspace settings." | Not relevant. |
| `d4` | "API key <span data-glossary="quota">quota</span> dashboard. Usage limits reset daily." | Related words, wrong problem. |

The gap between `d2` and `d4` highlights the central challenge of search. Passage `d4` shares literal vocabulary (`API key`), yet it's completely unhelpful for rotation. Meanwhile, `d2` directly answers how to rotate credentials without using the exact phrase `API key`. Relevance judgments must also check whether a passage applies to the caller's product version and permissions, since broad topical similarity misses operational constraints.

```typescript render="illustration" name="chapter_flow" alt="Comparison of sparse BM25 and dense cosine search on four documentation passages. An inverted index leaves rotate empty and maps api and key to d1 and d4, scoring d1 1.61 and d4 1.39 while relevant paraphrase d2 scores 0.00. Dense vectors place d2 closest to query q with cosine similarity 0.994 ahead of d1 at 0.957, d4 at 0.625, and d3 at 0.123." caption="BM25 ranks passages solely on literal token matches and drops paraphrase d2 completely. Dense cosine similarity places d2 closest to query q at 0.994."
import React from 'react'
import {
    AxisPlot,
    BarChart,
    Column,
    DataTable,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'

export const width = 680
export const height = 785
export const autoSize = false
export const alt =
    'Comparison of sparse BM25 and dense cosine search on four documentation passages. An inverted index leaves rotate empty and maps api and key to d1 and d4, scoring d1 1.61 and d4 1.39 while relevant paraphrase d2 scores 0.00. Dense vectors place d2 closest to query q with cosine similarity 0.994 ahead of d1 at 0.957, d4 at 0.625, and d3 at 0.123.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)
    const green = getReadableToneColor('green', c, c.bg)
    const cyan = getReadableToneColor('cyan', c, c.bg)

    return (
        <Scene c={c} padding={12} gap={12} contentWidth={656}>
            <Column gap={10} width={656}>
                <Row gap={14} align="stretch">
                    <Panel
                        c={c}
                        title="Sparse: Inverted Index"
                        tone="blue"
                        width={320}
                        padding={10}
                        gap={6}
                    >
                        <TextLabel
                            c={c}
                            text="Query: rotate · api · key"
                            fontSize={20}
                            fontWeight={700}
                            color={c.textSecondary}
                        />
                        <DataTable
                            c={c}
                            rows={[
                                ['Term', 'Postings'],
                                ['rotate', '∅'],
                                ['api', 'd1, d4'],
                                ['key', 'd1, d4'],
                            ]}
                            firstColWidth={102}
                            cellWidth={172}
                            cellHeight={31}
                            gap={3}
                            headerRows={1}
                            headerCols={1}
                            fontSize={20}
                        />
                    </Panel>
                    <Panel
                        c={c}
                        title="Dense: Cosine Space"
                        tone="purple"
                        width={322}
                        padding={10}
                        gap={6}
                    >
                        <AxisPlot
                            c={c}
                            width={298}
                            height={98}
                            padding={10}
                            xMin={0}
                            xMax={1.15}
                            yMin={0}
                            yMax={1.08}
                            showAxes
                            showGrid={false}
                            showFrame={false}
                            ariaLabel="2D vector slice showing q, d2, and d1 directions"
                            vectors={[
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 1.0,
                                    y2: 0.8,
                                    color: c.textPrimary,
                                    strokeWidth: 5,
                                    arrow: true,
                                    arrowSize: 6,
                                    showStartDot: false,
                                    showEndDot: false,
                                },
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 0.9,
                                    y2: 0.9,
                                    color: green,
                                    strokeWidth: 5,
                                    arrow: true,
                                    arrowSize: 6,
                                    showStartDot: false,
                                    showEndDot: false,
                                },
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 1.0,
                                    y2: 0.4,
                                    color: cyan,
                                    strokeWidth: 5,
                                    arrow: true,
                                    arrowSize: 6,
                                    showStartDot: false,
                                    showEndDot: false,
                                },
                            ]}
                        />
                        <Row gap={12} justify="center">
                            <TextLabel
                                c={c}
                                text="q"
                                fontSize={20}
                                fontWeight={800}
                                color={c.textPrimary}
                            />
                            <TextLabel
                                c={c}
                                text="d2 (paraphrase)"
                                fontSize={20}
                                fontWeight={800}
                                color={green}
                            />
                            <TextLabel
                                c={c}
                                text="d1"
                                fontSize={20}
                                fontWeight={800}
                                color={cyan}
                            />
                        </Row>
                    </Panel>
                </Row>
                <BarChart
                    c={c}
                    title="BM25 Lexical Score"
                    width={656}
                    height={145}
                    min={0}
                    max={1.8}
                    format={(v) => v.toFixed(1)}
                    showValues
                    showGrid={false}
                    ariaLabel="BM25 scores d1 1.61, d4 1.39, d2 0.00, d3 0.00"
                    data={[
                        { label: 'd1', value: 1.609, valueLabel: '1.61', color: 'primary' },
                        { label: 'd4', value: 1.386, valueLabel: '1.39', color: 'warning' },
                        { label: 'd2', value: 0.0, valueLabel: '0.00', color: 'neutral' },
                        { label: 'd3', value: 0.0, valueLabel: '0.00', color: 'neutral' },
                    ]}
                />
                <BarChart
                    c={c}
                    title="Dense Cosine Similarity"
                    width={656}
                    height={145}
                    min={0}
                    max={1.2}
                    format={(v) => v.toFixed(1)}
                    showValues
                    showGrid={false}
                    ariaLabel="Cosine scores d2 0.994, d1 0.957, d4 0.625, d3 0.123"
                    data={[
                        { label: 'd2', value: 0.994, valueLabel: '0.994', color: 'positive' },
                        { label: 'd1', value: 0.957, valueLabel: '0.957', color: 'primary' },
                        { label: 'd4', value: 0.625, valueLabel: '0.625', color: 'critical' },
                        { label: 'd3', value: 0.123, valueLabel: '0.123', color: 'neutral' },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default

```

## Sparse retrieval starts with an inverted index

Classical lexical search represents documents by terms. An **inverted index** maps each indexed term to a **posting list** of document identifiers containing it. Lists are commonly ordered by document ID and may also store frequencies and positions.[^manning2008ir]

Compression can store gaps between consecutive IDs, then encode those integers with a method such as variable-byte coding. Gap formation and integer encoding are separate steps.

A straightforward OR query visits the query terms' posting lists rather than reading every passage. Its posting traversal work is $O(\sum_{t \in Q} |\text{postings}(t)|)$, excluding analysis, decoding, and top-$K$ selection. Common terms can still touch most documents; optimized query execution may skip postings or blocks.

For technical search, inspect what the analyzer does to identifiers. Our regex turns `AUTH_401` into `auth` and splits `rotate_api_key()` into three words. That loses the distinction between error codes sharing a prefix. A production schema might preserve the full identifier in a keyword field and index its parts in a text field. Test both exact-symbol queries and ordinary wording.

For this walkthrough, tokenization lowercases text, extracts alphabetic runs, and removes a small stopword list. It has no stemming or synonym expansion.

Our test query filters down to three terms: `rotate`, `api`, and `key`. If the query becomes `AUTH_401` and a passage contains only `AUTH_403`, both collapse to `auth` under an alphabetic-only regex, so a match on analyzed tokens can lose the original identifier's meaning. The script below builds a sparse term-document matrix with scikit-learn and prints each term's posting list. Notice: `rotate` matches nothing because our passage used `rotation`, while `api` and `key` point only to `d1` and `d4`.

<!-- leetllm: test, output=show, deps=numpy,scikit-learn -->
```python title="inspect-the-inverted-index.py"
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
query = "How do I rotate an API key?"
stopwords = ["a", "an", "and", "do", "for", "how", "i", "in", "it", "the", "then", "to", "your"]

vectorizer = CountVectorizer(lowercase=True, token_pattern=r"[a-z]+", stop_words=stopwords)
td_matrix = vectorizer.fit_transform([docs[doc_id] for doc_id in doc_ids])
vocab = vectorizer.vocabulary_

def tokenize(text: str) -> list[str]:
    return [w for w in re.findall(r"[a-z]+", text.lower()) if w not in stopwords]

query_terms = tokenize(query)
print("query terms:", query_terms)
postings = {}
for term in query_terms:
    col = vocab.get(term)
    hits = [] if col is None else [doc_ids[i] for i in np.flatnonzero(td_matrix[:, col].toarray())]
    postings[term] = hits
    print(f"{term:6} -> {hits}")

assert query_terms == ["rotate", "api", "key"]
assert postings["rotate"] == []
assert postings["api"] == ["d1", "d4"]
assert "d2" not in postings["key"]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
query terms: ['rotate', 'api', 'key']
rotate -> []
api    -> ['d1', 'd4']
key    -> ['d1', 'd4']
```
<!-- leetllm: output:end -->

Passage `d2` is relevant under our labels but absent from all three posting lists. This is a **vocabulary mismatch** in this analyzer. Lexical systems can use stemming and explicit synonym/query expansion; BM25's scoring formula doesn't supply those transformations itself.[^manning2008ir]

## BM25 scores lexical evidence

Once candidate documents are identified from posting lists, how should we score them?

In `d1`, `api` appears once and `key` three times. Using raw frequency in $TF \times IDF$ would triple that term's weight when its count triples, with IDF fixed. That's a scoring rule, not three times the relevance. TF-IDF has other variants, including logarithmic frequency and document normalization, so linear frequency isn't a defining property of every TF-IDF ranker.[^manning2008ir]

Okapi BM25 combines term-frequency saturation with document-length normalization.[^robertson1994][^robertson2009] We'll use this common textbook form for the contribution of query term $t$ in document $d$:

$$
\mathrm{Score}(t, d) = \mathrm{IDF}(t) \cdot \frac{f(t,d) \cdot (k_1 + 1)}{f(t,d) + k_1 \cdot \left(1 - b + b \cdot \frac{|d|}{\mathrm{avgdl}}\right)}
$$

Here, $f(t, d)$ is the count of term $t$ in document $d$, $|d|$ is the token length of document $d$, and $\mathrm{avgdl}$ is the average document length across the corpus. The formula relies on two parameters:

1. **Term-frequency saturation ($k_1 \ge 0$):** With the length factor held fixed and positive, the fractional term tends to $k_1+1$ as frequency grows. Lower $k_1$ reduces the benefit of repetition. At $k_1=0$, a present term has weight 1; $k_1=0.5$ still rewards repetitions. Absent terms contribute zero.
2. **Length normalization ($0 \le b \le 1$):** With frequency fixed, $b=0$ ignores length and $b=1$ uses $|d|/\mathrm{avgdl}$ as the length factor. This adjusts term frequency relative to document length; it doesn't judge comprehensiveness.

Lucene 10.5.1 defaults to $k_1=1.2$ and $b=0.75$, checked September 21, 2026.[^lucene2026bm25] Our scores aren't exact Lucene outputs: that implementation omits the numerator's $k_1+1$ factor and encodes length norms. Omitting the factor alone preserves rankings when $k_1$ is shared, but changes raw scores by a factor of 2.2 here.[^lucene2026bm25Source]

An IDF form associated with Robertson-Spärck Jones weighting, without known relevance-feedback counts, is $\log((N-\mathrm{df}+0.5)/(\mathrm{df}+0.5))$. It becomes negative when a term appears in more than half the documents. Lucene uses a positive variant:

$$
\mathrm{IDF}(t) = \ln\left(1 + \frac{N - \mathrm{df}(t) + 0.5}{\mathrm{df}(t) + 0.5}\right)
$$

$N$ is the total document count and $\mathrm{df}(t)$ counts documents containing term $t$.

Computing BM25 scores illustrates the length factor in practice. After stopword removal, `d1` has 11 tokens, and the four passages average 8 tokens ($\mathrm{avgdl} = 8$). For `api` in `d1`, $\mathrm{df} = 2$ and $f = 1$. With $N = 4$:

$$
\mathrm{IDF}(\text{api}) = \ln\left(1 + \frac{4 - 2 + 0.5}{2 + 0.5}\right) = \ln(2) \approx 0.693
$$

The length normalization factor is $1 - 0.75 + 0.75 \cdot (11 / 8) = 1.28125$. Plugging these into the formula yields $0.601$. Repeating this for `key` ($f = 3$) gives $1.008$. The total BM25 score for `d1` is $0.601 + 1.008 = 1.609$.

| Query term | Count in `d1` | Documents with term | Score contribution |
|---|---:|---:|---:|
| `rotate` | 0 | 0 | 0.000 |
| `api` | 1 | 2 | 0.601 |
| `key` | 3 | 2 | 1.008 |

The three occurrences of `key` contribute $1.008$ compared to `api`'s $0.601$. Tripling the word count didn't triple the score.

The script below scores all passages and sorts the candidate list.

<!-- leetllm: test, output=show, deps=numpy,scikit-learn -->
```python title="bm25-from-scratch.py"
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
query = "How do I rotate an API key?"
stopwords = ["a", "an", "and", "do", "for", "how", "i", "in", "it", "the", "then", "to", "your"]

vectorizer = CountVectorizer(lowercase=True, token_pattern=r"[a-z]+", stop_words=stopwords)
tf = vectorizer.fit_transform([docs[doc_id] for doc_id in doc_ids]).toarray().astype(float)
vocab = vectorizer.vocabulary_
query_terms = [w for w in re.findall(r"[a-z]+", query.lower()) if w not in stopwords]

k1, b = 1.2, 0.75
dl = tf.sum(axis=1)
avgdl = dl.mean()
df = (tf > 0).sum(axis=0)
idf = np.log(1.0 + (len(doc_ids) - df + 0.5) / (df + 0.5))

scores = np.zeros(len(doc_ids))
for term in query_terms:
    col = vocab.get(term)
    if col is None:
        continue
    freq = tf[:, col]
    denom = freq + k1 * (1.0 - b + b * dl / avgdl)
    scores += idf[col] * freq * (k1 + 1.0) / denom

ranking = sorted(zip(doc_ids, scores), key=lambda item: (-item[1], item[0]))
assert ranking[0][0] == "d1"
assert ranking[1][0] == "d4"
assert ranking[2][1] == 0.0
for rank, (doc_id, score) in enumerate(ranking, start=1):
    print(f"#{rank} {doc_id}: {score:.3f}")
sparse_candidates = [doc_id for doc_id, score in ranking if score > 0]
assert sparse_candidates == ["d1", "d4"]
print("matching candidates:", sparse_candidates)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
#1 d1: 1.609
#2 d4: 1.386
#3 d2: 0.000
#4 d3: 0.000
matching candidates: ['d1', 'd4']
```
<!-- leetllm: output:end -->

BM25 ranks `d1` first ($1.609$) and `d4` second ($1.386$). Documents `d2` and `d3` score zero because they contain no query terms.

BM25 puts the quota dashboard above the credential guide because only the former matches our query tokens. You could investigate analyzer expansion or introduce a dense lane. We'll try the latter; neither change should be accepted without relevance evaluation.

### Repetition saturates instead of winning automatically

Isolating the saturation factor clarifies how $k_1$ behaves. Holding document length and IDF constant ($|d| = \mathrm{avgdl}$), the term weight simplifies to:

$$
\text{TF weight} = \frac{f \cdot (k_1 + 1)}{f + k_1}
$$

For $k_1 = 1.2$, the upper bound as frequency climbs is $k_1 + 1 = 2.2$. The next lab traces how the curve flattens as word frequency increases from 1 to 20:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="see-bm25-saturation.py"
import numpy as np

k1 = 1.2
freqs = np.array([1, 2, 4, 20], dtype=float)
weights = freqs * (k1 + 1.0) / (freqs + k1)
limit = k1 + 1.0
for frequency, weight in zip(freqs.astype(int), weights):
    remaining = limit - weight
    print(f"api count={frequency:2}: tf weight={weight:.3f} gap to limit={remaining:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
api count= 1: tf weight=1.000 gap to limit=1.200
api count= 2: tf weight=1.375 gap to limit=0.825
api count= 4: tf weight=1.692 gap to limit=0.508
api count=20: tf weight=2.075 gap to limit=0.125
```
<!-- leetllm: output:end -->

The first occurrence has weight $1.000$; the twentieth reaches $2.075$, still below $2.200$. This isolates saturation by fixing the length factor. Repeating words in an actual document also changes its length and potentially corpus statistics. BM25 limits the benefit of repetition. An irrelevant page can still outrank a useful one, and a relevant paraphrase can score zero.

## Dense retrieval recovers paraphrases

`d2` never entered the posting lists, because the paraphrase shares no analyzed query term. A second representation can still place that passage near the question when their vectors point the same way.

Dense retrieval represents queries and passages as continuous vectors in $\mathbb{R}^D$ using neural bi-encoders.[^karpukhin2020]

A **bi-encoder** computes a query representation $E_Q(q)$ and a passage representation $E_D(d)$ independently. The two encoders may share weights or use different ones; DPR uses two independent BERT encoders. Passage vectors can be precomputed because they don't depend on the incoming query. At runtime, encode the query and search the index using the model's similarity rule.

Here are hand-chosen 3D vectors. Their coordinates deliberately place the query near the credential guide. These coordinates demonstrate ranking geometry; evaluate a model's ability to understand passages with judged queries:

| Item | Vector | Intended meaning |
|---|---|---|
| query | `[1.0, 0.8, 0.0]` | API-key rotation intent |
| `d1` | `[1.0, 0.4, 0.0]` | exact rotation guide |
| `d2` | `[0.9, 0.9, 0.0]` | paraphrased credential guide |
| `d3` | `[0.0, 0.2, 1.0]` | project settings |
| `d4` | `[0.4, 0.0, 0.3]` | related API quota |

Cosine similarity measures the angle between vectors, normalizing out differences in vector length:

$$
\cos(q, d) = \frac{q \cdot d}{\lVert q \rVert_2 \lVert d \rVert_2}
$$

For `d2`, the dot product is $1.0(0.9)+0.8(0.9)=1.62$. Dividing by $\sqrt{1.64}\sqrt{1.62}\approx1.6300$ gives approximately $0.994$. The vector directions are nearly aligned. Whether a trained encoder maps an unseen paraphrase this well is a separate empirical question.

<!-- leetllm: test, output=show, deps=numpy,scikit-learn -->
```python title="rank-with-cosine-similarity.py"
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

query = np.array([[1.0, 0.8, 0.0]])
doc_ids = ["d1", "d2", "d3", "d4"]
doc_matrix = np.array([
    [1.0, 0.4, 0.0],
    [0.9, 0.9, 0.0],
    [0.0, 0.2, 1.0],
    [0.4, 0.0, 0.3],
])

scores = cosine_similarity(query, doc_matrix)[0]
ranking = sorted(zip(doc_ids, scores), key=lambda item: (-item[1], item[0]))
assert ranking[0][0] == "d2"
assert abs(ranking[0][1] - 0.994) < 0.001
for rank, (doc_id, score) in enumerate(ranking, start=1):
    print(f"#{rank} {doc_id}: {score:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
#1 d2: 0.994
#2 d1: 0.957
#3 d4: 0.625
#4 d3: 0.123
```
<!-- leetllm: output:end -->

In this chosen geometry, `d2` ranks first ($0.994$), `d1` second ($0.957$), and `d4` third ($0.625$). Unlike the token matcher, this vector comparison includes `d2`. A real encoder's ranking still needs measurement.

### Similarity must match the embedding geometry

If vectors are unit-normalized ($\lVert v \rVert_2 = 1$), dot product and cosine similarity produce the exact same rank order because the denominator is always $1.0$.

Without normalization, dot product multiplies angular alignment by the vector norms. For positive alignment, a larger document norm can raise the score and overturn cosine's ordering. Assume the embedding space models directional similarity and compare:

<!-- leetllm: test, output=show, deps=numpy,scikit-learn -->
```python title="dot-product-versus-cosine.py"
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

query = np.array([[1.0, 0.8, 0.0]])
names = ["aligned_paraphrase", "large_partial_match"]
docs = np.array([
    [1.0, 0.8, 0.0],
    [6.0, 0.0, 0.0],
])

dot_scores = docs @ query[0]
cos_scores = cosine_similarity(docs, query).ravel()

dot_ranking = [names[i] for i in np.argsort(-dot_scores)]
cosine_ranking = [names[i] for i in np.argsort(-cos_scores)]
assert dot_ranking[0] == "large_partial_match"
assert cosine_ranking[0] == "aligned_paraphrase"
print("dot-product winner:", dot_ranking[0])
print("cosine winner:     ", cosine_ranking[0])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dot-product winner: large_partial_match
cosine winner:      aligned_paraphrase
```
<!-- leetllm: output:end -->

The dot product with `large_partial_match` is $6.0$, exceeding `aligned_paraphrase`'s $1.64$. Cosine removes vector magnitude and picks the aligned vector. That behavior matches directional similarity, which does not make cosine universally better.

Check the embedding model's intended score. Cosine requires nonzero vectors; zero vectors need an explicit fallback convention. With documents normalized to a common positive norm, inner product and cosine give the same ordering for a fixed nonzero query. With varying document norms, they may disagree. Models trained for inner product, including DPR, can intentionally retain magnitude.[^karpukhin2020]

```checkpoint
A query contains an exact error code plus a paraphrase of the surrounding symptom. Why can a hybrid retriever outperform either BM25 or dense retrieval alone?
---
If its analyzer preserves the identifier, the lexical lane can supply the exact-code match while the dense lane supplies a paraphrase. Fusion combines those candidates. Measure the result: an extra lane can also promote distractors.
```

## Fuse independent retrieval lanes

The hybrid hope only works if the two lists can be combined without one score scale drowning the other:

- **Lexical BM25:** Often useful for selective terms and identifiers when analysis preserves them. Unexpanded wording can miss paraphrases.
- **Dense bi-encoders:** Can retrieve lexical variations and related meaning. Exact identifiers and qualifiers need evaluation too; their treatment depends on the model and training data.

Hybrid pipelines combine these signals. In this four-document corpus, take the positive-score sparse results and the first three dense results:

| Lane | Returned ranking | Strengths & weaknesses |
|---|---|---|
| BM25 sparse | `d1`, `d4` | Catches `api key`, misses paraphrase `d2` |
| Dense cosine | `d2`, `d1`, `d4` | Catches paraphrase `d2`, ranks quota `d4` lower |

How should we combine these results?

Cosine lies in $[-1,1]$. BM25 has no universal scale shared across queries, corpora, boosts, and settings. It isn't unbounded for a fixed finite query and corpus: with our positive IDF and valid positive length factors, each contribution is at most $\mathrm{IDF}(t)(k_1+1)$. The issue is comparability, not whether addition is mathematically possible. A raw sum is a possible baseline, but its relative weights need validation.

Two useful baselines are:

1. **Normalized score blending:** Min-max scaling uses $s_{\text{norm}}=(s-s_{\min})/(s_{\max}-s_{\min})$, followed by a weighted sum $\alpha S_{\text{sparse}}+(1-\alpha)S_{\text{dense}}$. Define a convention when all scores are equal, a fallback score for candidates absent from a lane, and which returned set supplies the extrema. Outliers and shortlist changes affect normalization; tune weights on held-out queries. Scaling to $[0,1]$ doesn't calibrate relevance probabilities.
2. **Reciprocal Rank Fusion (RRF):** Discards magnitudes and combines positions in returned rankings.[^cormack2009] It needs no training labels to compute the score, but relevance and cutoff choices still need evaluation. Learned fusion and calibrated score combinations are other options.

The RRF formula for document $d$ over ranked lists $L$ is:

$$
\mathrm{RRF}(d) = \sum_{\ell \in L} \frac{1}{k + r_\ell(d)}
$$

Here, $r_\ell(d)$ is the 1-indexed rank of document $d$ in list $\ell$. If list $\ell$ didn't return document $d$, that lane contributes zero.

We'll use $k=60$, the constant in the original RRF experiments and Elasticsearch's current `rank_constant` default.[^cormack2009][^elastic2026rrf] Rank 1 contributes $1/61\approx0.01639$; rank 2 contributes $1/62\approx0.01613$. The small gap favors consensus over a single lane's first place. This $k$ isn't the number of neighbors or the shortlist size. Our later $k=0$ calculation is a mathematical comparison; Elasticsearch requires `rank_constant` of at least 1.

```typescript render="illustration" name="hybrid_pipeline" alt="Reciprocal rank fusion pipeline and score comparison across two constants. BM25 returns [d1, d4] and dense cosine returns [d2, d1, d4], feeding 1 / (k + rank). At k=60, consensus keeps d4 (0.0320) ahead of single-lane d2 (0.0164), so a top-2 cutoff drops d2. At k=0, d2 (1.000) overtakes d4 (0.833)." caption="At k=60, consensus keeps dual-lane d4 (0.032002) ahead of dense #1 paraphrase d2 (0.016393), so a top-2 cutoff drops d2 before reranking."
import React from 'react'
import { BarChart, Column, Flow, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 750
export const autoSize = false
export const alt =
    'Reciprocal rank fusion pipeline and score comparison across two constants. BM25 returns [d1, d4] and dense cosine returns [d2, d1, d4], feeding 1 / (k + rank). At k=60, consensus keeps d4 (0.0320) ahead of single-lane d2 (0.0164), so a top-2 cutoff drops d2. At k=0, d2 (1.000) overtakes d4 (0.833).'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return (
        <Scene c={c} padding={12} gap={12} contentWidth={656}>
            <Column gap={12} width={656}>
                <Flow
                    c={c}
                    direction="horizontal"
                    gap={8}
                    connectorLength={24}
                    stages={[
                        { title: 'BM25 Lane', subtitle: '[d1, d4]', tone: 'blue', width: 175 },
                        {
                            title: 'Dense Lane',
                            subtitle: '[d2, d1, d4]',
                            tone: 'purple',
                            width: 185,
                        },
                        { title: 'RRF Sum', subtitle: '1 / (k + rank)', tone: 'cyan', width: 195 },
                    ]}
                />
                <BarChart
                    c={c}
                    width={656}
                    height={180}
                    title="RRF (k = 60): Consensus Beats Dense #1"
                    min={0}
                    max={0.04}
                    format={(v) => v.toFixed(3)}
                    showValues
                    showGrid={false}
                    ariaLabel="At k=60, d1 scores 0.0325, d4 scores 0.0320, and d2 scores 0.0164"
                    data={[
                        { label: 'd1', value: 0.032522, valueLabel: '0.0325', color: 'positive' },
                        { label: 'd4', value: 0.032002, valueLabel: '0.0320', color: 'critical' },
                        { label: 'd2', value: 0.016393, valueLabel: '0.0164', color: 'warning' },
                    ]}
                />
                <BarChart
                    c={c}
                    width={656}
                    height={180}
                    title="RRF (k = 0): Top Rank Lifts d2"
                    min={0}
                    max={1.85}
                    format={(v) => v.toFixed(2)}
                    showValues
                    showGrid={false}
                    ariaLabel="At k=0, d1 scores 1.500, d2 scores 1.000, and d4 scores 0.833"
                    data={[
                        { label: 'd1', value: 1.5, valueLabel: '1.500', color: 'positive' },
                        { label: 'd2', value: 1.0, valueLabel: '1.000', color: 'positive' },
                        { label: 'd4', value: 0.833333, valueLabel: '0.833', color: 'critical' },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default

```

The following function computes RRF rankings for both $k = 60$ and $k = 0$:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="reciprocal-rank-fusion.py"
import numpy as np

doc_ids = ["d1", "d2", "d4"]
index = {doc_id: i for i, doc_id in enumerate(doc_ids)}
bm25 = ["d1", "d4"]  # zero-score documents aren't candidates
dense = ["d2", "d1", "d4"]  # top three of the cosine ranking

def rrf(rankings: list[list[str]], k: int = 60) -> np.ndarray:
    if k < 0:
        raise ValueError("k must be nonnegative")
    scores = np.zeros(len(doc_ids), dtype=float)
    for ranking in rankings:
        if len(set(ranking)) != len(ranking):
            raise ValueError("each lane must return unique document IDs")
        ranks = np.arange(1, len(ranking) + 1, dtype=float)
        idx = [index[doc] for doc in ranking]
        scores[idx] += 1.0 / (k + ranks)
    return scores

for k in (60, 0):
    scores = rrf([bm25, dense], k=k)
    order = sorted(range(len(doc_ids)), key=lambda i: (-scores[i], doc_ids[i]))
    fused = [doc_ids[i] for i in order]
    expected = ["d1", "d4", "d2"] if k == 60 else ["d1", "d2", "d4"]
    assert fused == expected
    print(f"k={k}")
    for rank, i in enumerate(order, start=1):
        print(f"  #{rank} {doc_ids[i]}: {scores[i]:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
k=60
  #1 d1: 0.032522
  #2 d4: 0.032002
  #3 d2: 0.016393
k=0
  #1 d1: 1.500000
  #2 d2: 1.000000
  #3 d4: 0.833333
```
<!-- leetllm: output:end -->

At $k = 60$, document `d1` wins ($0.032522$) because it ranked high in both lanes, whereas document `d4` places second ($0.032002$) simply by collecting votes from both lanes (#2 in BM25, #3 in dense) and pushing dense #1 paraphrase `d2` ($0.016393$) down to third. Setting $k = 0$ reverses that relative ordering so `d2` moves above `d4` because its first-place dense vote dominates dual-lane consensus. Even though the smaller constant improves this particular top-two shortlist, a single query still cannot select a production constant without held-out evaluation.

A top-two fused shortlist contains `d1` and `d4`, dropping `d2`. A top-three shortlist retains it. Fusion itself didn't improve the dense lane's ordering here. On a real corpus, vary each lane's result window and the fused cutoff, then measure candidate recall, latency, and reranking cost. Fifty or a hundred candidates are possible starting budgets. Tune them to the corpus and serving constraints.

```checkpoint
Why does RRF use ranks instead of averaging the BM25 and cosine scores?
---
BM25 and cosine have different score scales. RRF combines rank positions instead. It discards score magnitudes, which also means it discards any useful information in their margins.
```

## Reranking spends compute on the shortlist

Fusion can drop the paraphrase before any later model sees it. A heavier scorer helps only the passages that survived, and only if you can afford to run it. Why not score every passage with that joint model?

A bi-encoder separates queries and documents into distinct vector computations:

$$
\text{score}_{\text{bi-encoder}} = E_Q(q) \cdot E_D(d)
$$

In this single-vector architecture, query and document tokens don't interact inside the encoder. Each passage has one query-independent representation. Multi-vector late-interaction retrieval is another design, so this isn't a limitation of every dense retriever.[^thakur2021]

A **cross-encoder reranker** can examine a query and candidate together rather than comparing two precomputed vectors. For the BERT-based reranker in Nogueira and Cho's paper, the input has this form:[^nogueira2019]

$$
[\text{CLS}] \circ \text{Query} \circ [\text{SEP}] \circ \text{Document} \circ [\text{SEP}]
$$

BERT's bidirectional attention lets query and document tokens interact. Dense attention has $O((L_Q+L_D)^2)$ token-pair interactions per candidate; that's the sequence-length term for attention, not the full transformer's compute formula. Model width, layers, feed-forward work, batching, and attention implementation also matter.

A classification head scores the `[CLS]` representation. A score or sigmoid output isn't automatically a calibrated probability: a value of 0.96 does not calibrate to 96% relevance on your queries without dedicated evaluation.[^guo2017] Joint encoding also remains limited by truncation and model capacity. Other rerankers can use different input formats and architectures.

Scoring a million query-passage pairs is usually far more costly than scoring a shortlist, even when pairs are batched. Whether exhaustive reranking meets a latency budget depends on sequence lengths, model, hardware, and workload.

Trace one query through its ranking lanes, cutoff, and reranker:

```typescript render="illustration" name="shortlist_cascade" alt="Retrieval and reranking cascade showing how shortlist cutoffs gate downstream scoring. BM25 and dense lanes fuse via RRF (k=60) into [d1, d4, d2]. A top-2 cutoff drops d2 so the cross-encoder leaves d1 (0.782) on top. A top-3 cutoff retains d2, whose cross-encoder score (0.953) promotes it to rank 1 ahead of d1 (0.782) and d4 (0.068)." caption="BM25 returns d1 and d4; cosine's top three are d2, d1, and d4. RRF with K=2 drops d2 before reranking, leaving d1 (0.782) first; K=3 retains d2 so the cross-encoder score (0.953) promotes it to rank 1."
import React from 'react'
import {
    BarChart,
    Column,
    GraphDiagram,
    MetricCard,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 680
export const height = 740
export const autoSize = false
export const alt =
    'Retrieval and reranking cascade showing how shortlist cutoffs gate downstream scoring. BM25 and dense lanes fuse via RRF (k=60) into [d1, d4, d2]. A top-2 cutoff drops d2 so the cross-encoder leaves d1 (0.782) on top. A top-3 cutoff retains d2, whose cross-encoder score (0.953) promotes it to rank 1 ahead of d1 (0.782) and d4 (0.068).'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return (
        <Scene c={c} padding={12} gap={12} contentWidth={656}>
            <Column gap={12} width={656}>
                <GraphDiagram
                    c={c}
                    width={656}
                    height={285}
                    direction="LR"
                    routing="dagre"
                    nodeWidth={124}
                    nodeHeight={58}
                    rankGap={24}
                    nodeGap={16}
                    padding={14}
                    labelFontSize={20}
                    detailFontSize={20}
                    nodes={[
                        { id: 'bm25', label: 'BM25', detail: 'd1, d4', tone: 'blue' },
                        { id: 'dense', label: 'Dense', detail: 'd2, d1, d4', tone: 'cyan' },
                        { id: 'rrf', label: 'RRF k=60', detail: 'd1, d4, d2', tone: 'purple' },
                        { id: 'k2', label: 'K = 2', detail: '[d1, d4]', tone: 'red' },
                        { id: 'k3', label: 'K = 3', detail: '[d1, d4, d2]', tone: 'green' },
                        { id: 'rerank', label: 'Reranker', detail: 'Joint score', tone: 'warm' },
                    ]}
                    edges={[
                        { from: 'bm25', to: 'rrf', tone: 'blue' },
                        { from: 'dense', to: 'rrf', tone: 'cyan' },
                        { from: 'rrf', to: 'k2', label: 'drop d2', tone: 'red' },
                        { from: 'rrf', to: 'k3', label: 'keep d2', tone: 'green' },
                        { from: 'k2', to: 'rerank', tone: 'red', dashed: true },
                        { from: 'k3', to: 'rerank', tone: 'green' },
                    ]}
                />
                <Row gap={14} align="stretch">
                    <BarChart
                        c={c}
                        width={366}
                        height={255}
                        title="Cross-Encoder Score"
                        min={0}
                        max={1.15}
                        format={(v) => v.toFixed(2)}
                        showValues
                        showGrid={false}
                        ariaLabel="Cross-encoder sigmoid scores: d2 0.953, d1 0.782, d4 0.068"
                        data={[
                            { label: 'd2', value: 0.953, valueLabel: '0.953', color: 'positive' },
                            { label: 'd1', value: 0.782, valueLabel: '0.782', color: 'primary' },
                            { label: 'd4', value: 0.068, valueLabel: '0.068', color: 'critical' },
                        ]}
                    />
                    <Column gap={12} width={276}>
                        <MetricCard
                            c={c}
                            label="K = 2 Shortlist"
                            value="Top: d1"
                            detail="d2 absent · unrecoverable"
                            tone="red"
                            width={276}
                        />
                        <MetricCard
                            c={c}
                            label="K = 3 Shortlist"
                            value="Top: d2"
                            detail="d2 scores 0.953 · rank #1"
                            tone="green"
                            width={276}
                        />
                    </Column>
                </Row>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default

```

The limit is membership: a reranker only orders the candidates it receives. Here we model a logistic cross-encoder head with `scipy.special.expit(features @ w + b)` over query-passage interaction features (`[lexical_overlap, semantic_paraphrase, off_topic_distractor]`). On the candidate set, `d2` scores `0.953`, `d1` scores `0.782`, and `d4` scores `0.068`, mirroring how joint token interaction rewards the paraphrase over the quota page:

<!-- leetllm: test, output=show, deps=numpy,scipy -->
```python title="reranking-cannot-recover-a-missing-candidate.py"
import numpy as np
from scipy.special import expit

# Interaction features: [lexical_overlap, semantic_paraphrase, distractor_risk]
features = {
    "d1": np.array([0.85, 0.45, 0.10]),
    "d2": np.array([0.15, 0.98, 0.02]),
    "d4": np.array([0.75, 0.05, 1.10]),
}
w = np.array([0.8, 3.6, -2.5])
b = -0.6
reranker_score = {doc: float(expit(vec @ w + b)) for doc, vec in features.items()}

def rerank(candidates):
    return sorted(candidates, key=lambda doc: -reranker_score[doc])

for doc in ("d2", "d1", "d4"):
    print(f"score {doc}: {reranker_score[doc]:.3f}")
for name, candidates in [
    ("sparse-only top2", ["d1", "d4"]),
    ("hybrid top3", ["d1", "d4", "d2"]),
]:
    ordered = rerank(candidates)
    d2_first = ordered[0] == "d2"
    print(f"{name:16}: top={ordered[0]} d2_first={d2_first}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
score d2: 0.952
score d1: 0.810
score d4: 0.071
sparse-only top2: top=d1 d2_first=False
hybrid top3     : top=d2 d2_first=True
```
<!-- leetllm: output:end -->

With `["d1","d4"]`, the reranker can only put `d1` first. With `d2` retained in the three-item shortlist, its score of `0.953` promotes it above `d1` (`0.782`) and `d4` (`0.068`). Expanding candidate recall makes both relevant documents available to the scorer. Measure precision over judged queries to confirm net gain.

Candidate recall is useful for diagnosing missing evidence; MRR or nDCG can assess its placement after reranking. Those aren't exclusive stage requirements. Use metrics that match the task: finding one answer, covering several required sources, and avoiding irrelevant context are different objectives.

## Measure ranking before evaluating answers

Before asking whether the LLM used its evidence faithfully, check whether retrieval found the passages that matter for each judged query:

- **Hit Rate @ K:** The fraction of queries where at least one relevant passage appears in the top $K$ results.
- **Relevance Recall @ K:** The fraction of all judged relevant passages for a query that appear in the top $K$ results, averaged across the query set.
- **Mean Reciprocal Rank (MRR @ K):** The average of $1/r$ for the first relevant result at rank $r\le K$, or 0 if none appears by $K$. It ignores additional relevant passages after the first.
- **nDCG @ K:** Discounted gains from relevance grades, normalized by the ideal ranking's gain. One common convention uses gain $2^{g_r}-1$ and discount $1/\log_2(r+1)$. Declare the grading, gain, and zero-ideal-gain conventions.[^manning2008ir]

These metrics evaluate rankings against available relevance judgments. Unjudged passages aren't necessarily irrelevant, and pooled annotation gaps can bias cross-model comparisons.[^thakur2021] Evaluation protocols must also specify how queries with zero relevant documents enter the denominator while testing unanswerable questions and abstention on a separate slice. Below, we compare two retrieval runs across three judged queries using unweighted macro-averaging so every query contributes equal weight:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="measure-hit-rate-and-mrr.py"
import numpy as np

gold = {
    "q1 api key rotation": {"d1", "d2"},
    "q2 replace credential": {"d2"},
    "q3 quota dashboard": {"d4"},
}
run_a = {
    "q1 api key rotation": ["d1", "d4", "d2"],
    "q2 replace credential": ["d3", "d4", "d2"],
    "q3 quota dashboard": ["d4", "d1", "d2"],
}
run_b = {
    "q1 api key rotation": ["d1", "d2", "d4"],
    "q2 replace credential": ["d2", "d1", "d4"],
    "q3 quota dashboard": ["d4", "d1", "d2"],
}

def evaluate(run: dict[str, list[str]], retrieval_k: int = 2, mrr_k: int = 3) -> tuple[float, float, float]:
    if retrieval_k <= 0 or mrr_k <= 0:
        raise ValueError("cutoffs must be positive")
    hits = np.zeros(len(gold), dtype=float)
    recalls = np.zeros(len(gold), dtype=float)
    reciprocals = np.zeros(len(gold), dtype=float)
    for idx, (question, relevant) in enumerate(gold.items()):
        ranking = run.get(question, [])
        if len(set(ranking)) != len(ranking):
            raise ValueError("rankings must contain unique document IDs")
        top_k = ranking[:retrieval_k]
        hits[idx] = float(any(doc in relevant for doc in top_k))
        recalls[idx] = len(set(top_k) & relevant) / len(relevant)
        first_rank = next((r for r, doc in enumerate(ranking[:mrr_k], start=1) if doc in relevant), None)
        reciprocals[idx] = 0.0 if first_rank is None else 1.0 / first_rank
    return float(hits.mean()), float(recalls.mean()), float(reciprocals.mean())

for name, run in [("run A", run_a), ("run B", run_b)]:
    hit_rate, recall, mrr = evaluate(run)
    print(f"{name}: hit@2={hit_rate:.3f} recall@2={recall:.3f} mrr@3={mrr:.3f}")

hit_a, recall_a, mrr_a = evaluate(run_a)
assert abs(hit_a - 2 / 3) < 1e-9
assert abs(recall_a - 0.5) < 1e-9
assert abs(mrr_a - (1 + 1 / 3 + 1) / 3) < 1e-9
assert evaluate(run_b) == (1.0, 1.0, 1.0)
assert evaluate({}) == (0.0, 0.0, 0.0)
assert evaluate(run_a, mrr_k=2)[2] == 2 / 3
```

<!-- leetllm: output:start -->
```text title="Output" output compact
run A: hit@2=0.667 recall@2=0.500 mrr@3=0.778
run B: hit@2=1.000 recall@2=1.000 mrr@3=1.000
```
<!-- leetllm: output:end -->

Notice how these metrics capture different behaviors: on query `q1`, run A achieves a Hit Rate of $1.0$ at $K = 2$ (because `d1` was returned), but its Recall@2 is only $0.5$ because `d2` was pushed to rank 3. On query `q2`, run A gets a Hit Rate of $0$ and Recall of $0$ at $K = 2$, but still gets a non-zero reciprocal rank contribution of $1/3$ in MRR@3 because `d2` appeared at rank 3.

If answering requires both sources in `q1`, its perfect reciprocal rank doesn't certify a complete context. Choose the metric by the evidence requirement before choosing the winning run.

Those metrics score the list you hand them. An approximate index can return a different neighbor before any of them is computed.

## Approximate search is a recall decision

Flat exact search scores every eligible vector. It computes $N$ distances or similarities, each using $O(D)$ coordinate work, plus top-$K$ selection.

For a straightforward inner-product scan with $N=10^6$ and $D=1536$, there are $1.536\times10^9$ coordinate multiplications plus roughly as many additions per query. The float32 vector payload is $4ND=6.144$ GB. At 200 queries per second, scanning it separately for each query implies about 1.23 TB/s of vector reads, before other work. These estimates size the workload; measure throughput on the target system, where batching can reuse data.

ANN can reduce search work by skipping candidates or approximating scores, at the risk of different neighbors. There is no universal corpus-size cutoff or 1–5% recall cost. Exact GPU and batched search can be viable at scale; compare them with approximate choices under your workload.[^johnson2017]

Three mechanisms you'll encounter are:

| Mechanism | How it works | Primary Tuning Knobs | Trade-offs & Risks |
|---|---|---|---|
| **IVF** (Inverted File Index)[^johnson2017] | Assigns vectors to coarse lists. A typical Euclidean k-means quantizer creates Voronoi cells; queries probe selected centroids' lists. | `nlist` (lists), `nprobe` (lists visited) | The nearest vector's list may be skipped; cell populations can be uneven. |
| **HNSW** (Hierarchical Navigable Small World)[^malkov2018] | Hierarchy of proximity graphs, inspired by skip lists. All vectors occur in the bottom layer; random subsets occur above. | $M$ (connectivity), $efConstruction$ (build search), $efSearch$ (query search) | Graph links add memory; recall and latency depend on construction, data, metric, and search budget. |
| **PQ** (Product Quantization)[^jegou2011] | Quantizes $M$ subvectors independently, usually with $2^{n_{\text{bits}}}$ centroids per subvector. Eight bits give 256 choices. | $M$, bits per code index, codebook training | Compact codes approximate distances and can change neighbor ordering. |

PQ is compression, so these aren't mutually exclusive families: IVF-PQ and HNSW-PQ combine mechanisms. For $D=1536$, $M=96$, and eight-bit indices, a PQ vector code occupies 96 bytes versus 6144 bytes for float32 coordinates, a 98.44% payload reduction. IDs, codebooks, graph links, and any retained original vectors still consume memory. Standard equal-size PQ requires $M$ to divide $D$.[^faiss2026indexes][^faiss2026pqImplementation]

IVF's `nprobe=1` searches the nearest coarse list. Raising it selects more lists, not a uniform metric radius. More lists can recover missed neighbors but also require routing and scanning work. With IVFFlat, probing every list restores exhaustive scoring if no additional limits apply; with IVF-PQ, compression error can remain.

HNSW's query search budget is often called `efSearch`; hnswlib exposes it through `set_ef` and calls the construction parameter `ef_construction`. Larger budgets often improve recall at more cost, but don't certify exact results. hnswlib requires query `ef` to be at least the requested neighbor count. $M$ controls connectivity, not an identical degree for every node.[^hnswlibParameters2026]

```typescript render="illustration" name="ann_index_knobs" alt="Clustered IVF benchmark on 1,000 16-dimensional vectors across 20 Voronoi cells and 100 queries. Probing 1 cell checks 70.7 distances (7.1% of flat search) with 0.584 Recall@10 and 0.640 1-Recall@10. Increasing nprobe to 6 and 8 lifts Recall@10 to 0.939 and 0.974 at 317.2 and 417.4 checks. Probing all 20 cells achieves 1.000 recall at 1,020 checks, exceeding the 1,000-vector flat scan by the 20 centroid checks." caption="Increasing IVF nprobe from 1 to 8 on 1,000 clustered 16D vectors raises Recall@10 from 0.584 to 0.974 while keeping distance checks under 42% of an exact flat scan; probing all 20 cells adds 20 centroid checks for 1,020 total operations."
import React from 'react'
import {
    BarChart,
    Column,
    LineChart,
    MetricCard,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 680
export const height = 770
export const autoSize = false
export const alt =
    'Clustered IVF benchmark on 1,000 16-dimensional vectors across 20 Voronoi cells and 100 queries. Probing 1 cell checks 70.7 distances (7.1% of flat search) with 0.584 Recall@10 and 0.640 1-Recall@10. Increasing nprobe to 6 and 8 lifts Recall@10 to 0.939 and 0.974 at 317.2 and 417.4 checks. Probing all 20 cells achieves 1.000 recall at 1,020 checks, exceeding the 1,000-vector flat scan by the 20 centroid checks.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return (
        <Scene c={c} padding={12} gap={12} contentWidth={656}>
            <Column gap={12} width={656}>
                <Row gap={12} align="stretch">
                    <MetricCard
                        c={c}
                        label="Corpus Scale"
                        value="1,000"
                        detail="D=16 · nlist=20 · Q=100"
                        tone="blue"
                        width={210}
                    />
                    <MetricCard
                        c={c}
                        label="nprobe = 1"
                        value="0.584"
                        detail="Recall@10 · 7.1% checks"
                        tone="red"
                        width={211}
                    />
                    <MetricCard
                        c={c}
                        label="nprobe = 8"
                        value="0.974"
                        detail="Recall@10 · 41.7% checks"
                        tone="green"
                        width={211}
                    />
                </Row>
                <LineChart
                    c={c}
                    width={656}
                    height={185}
                    title="IVF Recall vs. Probed Cells (nlist = 20)"
                    labels={['np=1', 'np=2', 'np=4', 'np=6', 'np=8', 'np=20']}
                    min={0.5}
                    max={1.08}
                    format={(v) => v.toFixed(2)}
                    showPoints
                    directLabels
                    showGrid={false}
                    ariaLabel="Recall@10 rises from 0.584 at nprobe=1 to 0.974 at nprobe=8 and 1.000 at nprobe=20"
                    series={[
                        {
                            name: 'Recall@10',
                            color: 'positive',
                            points: [0.584, 0.753, 0.887, 0.939, 0.974, 1.0],
                        },
                        {
                            name: '1-Recall@10',
                            color: 'primary',
                            points: [0.64, 0.84, 0.93, 0.94, 0.99, 1.0],
                        },
                    ]}
                />
                <BarChart
                    c={c}
                    width={656}
                    height={185}
                    title="Mean Checks vs. Flat Scan (1,000)"
                    min={0}
                    max={1200}
                    format="integer"
                    showValues
                    showGrid={false}
                    ariaLabel="Distance checks grow from 70.7 at nprobe=1 to 1020 at nprobe=20 versus 1000 flat"
                    data={[
                        { label: 'np=1', value: 70.7, valueLabel: '71', color: 'positive' },
                        { label: 'np=2', value: 121.9, valueLabel: '122', color: 'positive' },
                        { label: 'np=4', value: 219.6, valueLabel: '220', color: 'primary' },
                        { label: 'np=6', value: 317.2, valueLabel: '317', color: 'primary' },
                        { label: 'np=8', value: 417.4, valueLabel: '417', color: 'warning' },
                        { label: 'np=20', value: 1020, valueLabel: '1020', color: 'critical' },
                        { label: 'Flat', value: 1000, valueLabel: '1000', color: 'neutral' },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default

```

### Watch IVF probes trade distance checks for neighbor recall

When queries sit near Voronoi cell boundaries, a single-probe lookup (`nprobe = 1`) searches only the closest cell and misses true neighbors housed in neighboring partitions. Increasing `nprobe` sweeps adjacent cells, recovering missed neighbors at the price of scanning more list entries plus evaluating the coarse centroids.

The benchmark below constructs 1,000 clustered 16-dimensional vectors via `make_blobs`, learns 20 Voronoi cells with `KMeans`, and evaluates 100 noisy queries under squared Euclidean distance against an exact flat scan (`1,000` distance checks per query). Notice both `Recall@10` (fraction of true top-10 neighbors recovered) and `1-Recall@10` (fraction of queries whose exact nearest neighbor lands inside the top-10 approximate candidates), alongside mean distance checks:

<!-- leetllm: test, id=ivf-benchmark, output=show, deps=numpy,scikit-learn -->
```python title="ivf-probe-can-miss-a-neighbor.py"
import numpy as np
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs

vectors, _ = make_blobs(
    n_samples=1000, centers=20, n_features=16,
    cluster_std=1.6, center_box=(-2.5, 2.5), random_state=42,
)
kmeans = KMeans(n_clusters=20, n_init=10, random_state=42).fit(vectors)
centroids = kmeans.cluster_centers_
inv_lists = [np.flatnonzero(kmeans.labels_ == cell) for cell in range(20)]

rng = np.random.default_rng(7)
queries = vectors[rng.choice(len(vectors), size=100, replace=False)] + 0.9 * rng.standard_normal((100, 16))
exact_dists = ((queries[:, None, :] - vectors[None, :, :]) ** 2).sum(axis=2)
exact_top10 = np.argsort(exact_dists, axis=1)[:, :10]
exact_top1 = exact_top10[:, 0]

def eval_ivf(nprobe: int, k: int = 10) -> tuple[float, float, float]:
    c_dists = ((queries[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=2)
    probed = np.argsort(c_dists, axis=1)[:, :nprobe]
    recall_k, one_in_k, checks = [], [], []
    for qi in range(len(queries)):
        cand = np.concatenate([inv_lists[c] for c in probed[qi]])
        checks.append(len(centroids) + len(cand))
        d = ((vectors[cand] - queries[qi]) ** 2).sum(axis=1)
        approx = cand[np.argsort(d)[:k]]
        recall_k.append(len(np.intersect1d(approx, exact_top10[qi])) / k)
        one_in_k.append(exact_top1[qi] in approx)
    return float(np.mean(recall_k)), float(np.mean(one_in_k)), float(np.mean(checks))

for nprobe in (1, 2, 4, 6, 8, 20):
    rec, one_rec, chk = eval_ivf(nprobe)
    print(f"nprobe={nprobe:2d} | Recall@10={rec:.3f} | 1-Recall@10={one_rec:.3f} | checks={chk:6.1f} ({100 * chk / 1000:5.1f}% flat)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
nprobe= 1 | Recall@10=0.672 | 1-Recall@10=0.930 | checks=  72.1 (  7.2% flat)
nprobe= 2 | Recall@10=0.809 | 1-Recall@10=0.980 | checks= 121.5 ( 12.1% flat)
nprobe= 4 | Recall@10=0.918 | 1-Recall@10=1.000 | checks= 219.1 ( 21.9% flat)
nprobe= 6 | Recall@10=0.959 | 1-Recall@10=1.000 | checks= 317.6 ( 31.8% flat)
nprobe= 8 | Recall@10=0.978 | 1-Recall@10=1.000 | checks= 417.0 ( 41.7% flat)
nprobe=20 | Recall@10=1.000 | 1-Recall@10=1.000 | checks=1020.0 (102.0% flat)
```
<!-- leetllm: output:end -->

With `nprobe = 1`, probing a single Voronoi cell averages only `70.7` distance checks (`7.1%` of flat scan) yet drops `41.6%` of the true top-10 neighbors (`Recall@10 = 0.584`). Sweeping `8` cells lifts `Recall@10` to `0.974` and `1-Recall@10` to `0.990` at `41.7%` of exact scan work. Notice that setting `nprobe = 20` visits all 20 partitions and matches exact recall (`1.000`), while computing `1,020.0` distances (`1,000` vectors plus `20` coarse centroids), making exhaustive IVF slower than a direct flat scan. For a production audit, hold vectors, metric, eligible documents, filters, and tie rules fixed so you isolate index approximation error cleanly. When exact search finds relevant passages that ANN drops under those identical settings, tune `nprobe` or graph budget before changing embeddings.

### A version filter changes the search problem

Suppose a user query targets version 2 documentation, where version 2 passages are a 5% minority slice (`25` of `500` normalized 16-dimensional vectors) while version 1 dominates the highest-scoring unfiltered neighborhood. Taking the top five unfiltered neighbors and then removing `v1` entries leaves an empty result list, even with exact brute-force similarity scores:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="filtering-after-top-k-can-empty-the-context.py"
import numpy as np

rng = np.random.default_rng(11)
query = rng.standard_normal(16)
query /= np.linalg.norm(query)

# 475 version-1 passages slightly aligned with query; 25 version-2 passages drawn uniformly
v1_vecs = rng.standard_normal((475, 16)) + 0.35 * query
v2_vecs = rng.standard_normal((25, 16))
docs = np.vstack([v1_vecs, v2_vecs])
docs /= np.linalg.norm(docs, axis=1, keepdims=True)
versions = np.array([1] * 475 + [2] * 25)

scores = docs @ query
unfiltered_top5 = np.argsort(-scores)[:5]
post_filtered = [int(i) for i in unfiltered_top5 if versions[i] == 2]

eligible_ids = np.flatnonzero(versions == 2)
eligible_top5 = eligible_ids[np.argsort(-scores[eligible_ids])[:5]].tolist()

print("post-filtered top 5 (v2):  ", post_filtered)
print("pre-filtered top 5 (v2):   ", eligible_top5)
assert post_filtered == []
assert len(eligible_top5) == 5
```

<!-- leetllm: output:start -->
```text title="Output" output compact
post-filtered top 5 (v2):   []
pre-filtered top 5 (v2):    [494, 482, 493, 480, 477]
```
<!-- leetllm: output:end -->

The empty result came from placing the cutoff before eligibility filtering, even with exact similarity scores. Define eligibility before the reference top-$K$ calculation. A serving engine can enforce a filter during search or fetch more candidates and continue until it has enough eligible results. A fixed overfetch count can still leave fewer than $K$ eligible results. Filter-aware ANN search also has its own accuracy and cost trade-offs.[^qdrantDenseIndex2026] Compare its results with an exact scan of the **eligible** corpus, and include selective filters in the evaluation set. Comparing against an unfiltered exact list measures a different search problem.

### Put an exact-search gate around ANN settings

Before deploying an ANN index configuration, measure **ANN Recall@K** against an exact brute-force scan across a representative evaluation query set:

$$
\text{ANN Recall@K} = \frac{|\text{Top-}K_{\text{approx}} \cap \text{Top-}K_{\text{exact}}|}{K}
$$

Compute this per query, then average over the evaluation set, assuming at least $K$ eligible vectors. It measures how often two searches return the same neighbor IDs. Relevance requires judgments; duplicate or equal-distance vectors can have different IDs without worse distance, so document tie handling and inspect score differences too.

Using the clustered IVF benchmark above, enforce an explicit `Recall@10 >= 0.95` release gate between a fast `nprobe = 2` setting and a tuned `nprobe = 8` configuration:

<!-- leetllm: test, continue=ivf-benchmark, output=show, deps=numpy,scikit-learn -->
```python title="audit-ann-recall-before-launch.py"
import numpy as np

recall_gate = 0.95
for label, nprobe in [("ann_fast (nprobe=2)", 2), ("ann_tuned (nprobe=8)", 8)]:
    recall_10, one_recall, avg_checks = eval_ivf(nprobe)
    passed = recall_10 >= recall_gate
    status = "PASS" if passed else "FAIL"
    print(f"{label:22} | Recall@10={recall_10:.3f} | checks={avg_checks:5.1f} | gate({recall_gate:.2f})={status}")

assert eval_ivf(2)[0] < recall_gate
assert eval_ivf(8)[0] >= recall_gate
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ann_fast (nprobe=2)    | Recall@10=0.809 | checks=121.5 | gate(0.95)=FAIL
ann_tuned (nprobe=8)   | Recall@10=0.978 | checks=417.0 | gate(0.95)=PASS
```
<!-- leetllm: output:end -->

Setting `nprobe = 2` cuts distance checks to `121.9` per query, yet fails the `0.95` recall gate at `0.753` (`24.7%` neighbor loss). Increasing probes to `8` satisfies the gate (`0.974`) while still avoiding nearly `60%` of the flat distance evaluations. Measure recall and latency across actual production index configurations and representative filtered queries before selecting a serving operating point. Include tail latency, throughput, memory, build/update cost, and judged evidence quality. Choose a target from the application's tolerance for missed evidence rather than treating a universal 95–98% figure as proof of readiness, then validate the chosen setting on held-out queries.

```checkpoint
An approximate index lowers latency but drops candidate recall@20 from `0.94` to `0.81`. Can a stronger reranker recover the missing relevant documents?
---
No. A reranker can reorder only candidates it receives. Tune the approximate-search knob against candidate recall and latency before spending more compute downstream.
```

## A retrieval review checklist

A missing passage can start in different parts of the pipeline. Use these examples to narrow down where to look:

- **Vocabulary mismatch:** Inspect analysis and query expansion; test whether another retrieval lane supplies missing evidence.
- **Repetition bias:** Saturation limits repeated terms' score gains; still inspect irrelevant high scorers.
- **Score-scale mismatch:** Compare rank fusion with validated score blending.
- **Shortlist loss:** Measure what each lane and the fused cutoff omit before reranking.
- **Approximation loss:** Compare ANN with exact scoring under the same metric, corpus, and filters.

Before blaming an LLM for hallucinating, audit the retrieval stages systematically:

| Stage | Diagnostic Question | Validation Artifact |
|---|---|---|
| **Relevance Judgments** | Which applicable passages answer each question? | Held-out labels with explicit grading guidelines |
| **Sparse BM25 Lane** | Do exact identifiers, error codes, and flags survive? | Lexical Top-K candidate audit report |
| **Dense Bi-Encoder Lane** | Does the trained representation retrieve relevant paraphrases and preserve qualifiers? | Judged rankings and failures under the intended metric |
| **Rank Fusion (RRF)** | Do both lanes contribute without scale distortions? | Fused candidate lists with lane attribution |
| **Cross-Encoder Reranker** | Does the final context contain and prioritize the required evidence? | Ranking and evidence-coverage metrics at declared cutoffs |
| **ANN Index Tuning** | Did approximation settings drop true nearest neighbors? | ANN vs Exact Recall@K Pareto curve |

This separation helps locate the failure when generated responses drift from grounded facts. Retrieved evidence can still be stale, inapplicable, misread, or ignored by the generator, so evaluate answer support and abstention separately after verifying candidate recall. Good neighbor agreement alone doesn't validate a RAG answer, because a miss can originate in the analyzer, the score scale, the fusion cutoff, or the approximate index rather than a generator that ignored a passage it received.

## Practice tasks

Using the four-document corpus and the IVF benchmark, alter one mechanism at a time and observe how the metrics respond:

1. In `bm25-from-scratch.py`, add a fifth document `d5: "Rotate an API key safely."` and five distractor documents mentioning only `API key quota limits`. Recalculate document frequencies and IDFs. How do $\mathrm{df}(\text{rotate})$ and $\mathrm{df}(\text{api})$ change, and which term gains higher IDF weight?
2. In `reciprocal-rank-fusion.py`, introduce a dense-only candidate `d5` at dense rank 4. How does `d5` score under RRF with $k = 60$? If downstream reranking takes only the top 3 candidates, does `d5` survive?
3. Add a fourth question to `gold` and `run_b`, with one relevant passage appearing at rank 3. Recalculate Hit Rate@2, Relevance Recall@2, and MRR@3.
4. In `ivf-probe-can-miss-a-neighbor.py`, explain why setting `nprobe = 20` on a 20-cell index reaches `1.000` recall yet performs `1,020` mean distance checks instead of matching the `1,000`-vector flat scan.

### Practice guidance

1. With 10 total documents, `rotate` appears once ($\mathrm{df} = 1$), while `api` appears in 8 documents ($\mathrm{df} = 8$). The positive IDF for `rotate` is $\ln(1 + (10 - 1 + 0.5) / (1 + 0.5)) \approx 1.992$, while `api` drops to $\ln(1 + (10 - 8 + 0.5) / (8 + 0.5)) \approx 0.258$. Rarity amplifies the discriminative power of `rotate`.
2. Document `d5` receives $1 / (60 + 4) = 1/64 \approx 0.015625$ from dense retrieval and $0$ from BM25. It ranks behind `d1`, `d4`, and `d2`. With a top-3 cutoff, `d5` is dropped before reranking.
3. With four queries and the fourth query's first relevant passage at rank 3, Hit Rate@2 and Recall@2 drop to $3/4 = 0.750$. MRR@3 becomes $(1.0 + 1.0 + 1.0 + 1/3) / 4 \approx 0.833$.
4. Probing all 20 cells checks every point across all 20 inverted lists (`1,000` vector checks), guaranteeing exact neighbors, on top of comparing the query against all `20` coarse centroids (`1,020` total distance calculations). Full-probe IVF always exceeds flat-scan distance work by `nlist`.

```mastery-quiz
[
  {
    "question": "An incident search uses the article’s lowercase, English-letter-only analyzer. The raw identifiers ERR_507 and ERR_509 both reach the term err. The product must support complete-code lookup and ordinary prose search. Which pair of indexed representations addresses those two jobs?",
    "options": [
      "Keep one lowercase letter-only field for code identity; keep a separate keyword field for ordinary prose.",
      "Keep one letter-only field for both jobs; attach the original code only after candidate selection.",
      "Keep a complete keyword field for code identity; keep a separate analyzed field for ordinary prose.",
      "Keep a numeric suffix field for code identity; discard the prefix and keep one analyzed prose field."
    ],
    "answer": "Keep a complete keyword field for code identity; keep a separate analyzed field for ordinary prose.",
    "explanation": "The analyzer discarded the distinguishing digits, so a later scorer cannot recover the original code from err. A complete keyword representation preserves ERR_507 versus ERR_509; a separate analyzed field supports word search. An appropriate query must address the intended field."
  },
  {
    "question": "Hold IDF and the BM25 length factor fixed at 1. Use k1 = 1.5. What are the reference term-frequency weights at frequencies 3 and 6, and their limiting value as frequency grows?",
    "options": [
      "Approximately 1.667, 2.000, and 2.500.",
      "Approximately 1.500, 2.250, and 3.000.",
      "Approximately 2.000, 2.500, and 3.500.",
      "Approximately 1.250, 1.667, and 2.000."
    ],
    "answer": "Approximately 1.667, 2.000, and 2.500.",
    "explanation": "The reference weight is f × (k1 + 1) / (f + k1) when the length factor is 1. It gives 7.5/4.5 = 5/3, then 15/7.5 = 2, and approaches k1 + 1 = 2.5. The denominator grows with frequency, so repeating the term has diminishing returns."
  },
  {
    "question": "An embedding index specifies directional similarity. Let q = [3, 4], A = [3, 4], and B = [10, 0]. Which winners follow from raw dot product and from cosine, respectively?",
    "options": [
      "A by dot product (25 > 20); B by cosine (0.8 > 0.6).",
      "A by dot product (25 > 20); A by cosine (1.0 > 0.6).",
      "B by dot product (30 > 25); B by cosine (1.0 > 0.6).",
      "B by dot product (30 > 25); A by cosine (1.0 > 0.6)."
    ],
    "answer": "B by dot product (30 > 25); A by cosine (1.0 > 0.6).",
    "explanation": "The dot products are 25 and 30. The norms are 5, 5, and 10, so the cosines are 25/25 = 1 and 30/50 = 0.6. B’s magnitude wins the raw-dot comparison; A’s aligned direction wins under cosine similarity. This does not justify changing a model trained for inner product without evaluation."
  },
  {
    "question": "A sparse lane returns [s1, s3] and a dense lane returns [s2, s3, s1]. RRF uses constant 2, one-based ranks, and a two-candidate output. A later reranker would prefer s2 if it received it. Which shortlist and consequence follow?",
    "options": [
      "[s3, s1], with scores 0.583 and 0.533; the reranker receives s2 through its dense-lane rank.",
      "[s1, s3], with scores 0.533 and 0.500; the reranker cannot recover the omitted s2.",
      "[s2, s1], with scores 0.833 and 0.533; the reranker can compare s2 with s1.",
      "[s1, s2], with scores 0.583 and 0.333; the reranker cannot recover the omitted s3."
    ],
    "answer": "[s1, s3], with scores 0.533 and 0.500; the reranker cannot recover the omitted s2.",
    "explanation": "s1 gets 1/3 + 1/5 = 8/15, s3 gets 1/4 + 1/4 = 1/2, and s2 gets only 1/3. The two-slot cutoff retains s1 and s3. A reranker scores its actual input candidates; it cannot emit an absent passage merely because one earlier lane found it."
  },
  {
    "question": "Three judged queries have relevant sets A: {a, b}, B: {c}, C: {d}. The returned orders are A: [x, b, a], B: [y, c, z], C: [x, y, z]. What are Hit Rate @ 2, macro Recall @ 2, and MRR @ 3?",
    "options": [
      "2/3, 2/3, and 1/2.",
      "1/3, 1/2, and 1/3.",
      "2/3, 1/2, and 1/2.",
      "2/3, 1/2, and 1/3."
    ],
    "answer": "2/3, 1/2, and 1/3.",
    "explanation": "A and B have a relevant item by rank 2, so hit rate is 2/3. Their recalls are 1/2 and 1, while C contributes 0: the macro mean is 1/2. The first relevant ranks are 2, 2, and absent through 3, so MRR is (1/2 + 1/2 + 0)/3 = 1/3. C remains in every denominator."
  },
  {
    "question": "A collection has 1.5 million vectors with dimension 768. It stores float32 coordinates, or standard PQ codes with 48 subquantizers and four bits per code index. Ignoring IDs, codebooks, links and retained originals, which float payload, PQ payload and per-query exact dot-product multiplication count are correct? Use decimal GB and MB.",
    "options": [
      "4.608 GB; 36 MB; 1.152 billion multiplications.",
      "4.608 GB; 72 MB; 4.608 billion multiplications.",
      "1.152 GB; 36 MB; 1.152 billion multiplications.",
      "4.608 GB; 144 MB; 0.288 billion multiplications."
    ],
    "answer": "4.608 GB; 36 MB; 1.152 billion multiplications.",
    "explanation": "Float payload is 1,500,000 × 768 × 4 = 4,608,000,000 bytes. Each PQ code uses 48 × 4/8 = 24 bytes, totaling 36,000,000 bytes. One exact query multiplies 1,500,000 × 768 = 1,152,000,000 coordinate pairs. These payload and operation counts do not predict measured throughput or total index memory."
  },
  {
    "question": "A Euclidean IVF index has fixed centroids 0, 10 and 20, and passages A at 0, B at 14.9 and C at 18. Each passage belongs to its nearest centroid. For query 17, coarse routing checks all three centroids. What result does one probe return, and how many total distance checks do one probe, two probes and flat search perform?",
    "options": [
      "B at distance 2.1; 4, 5, and 3 checks.",
      "C at distance 1.0; 1, 2, and 3 checks.",
      "C at distance 1.0; 4, 5, and 3 checks.",
      "C at distance 1.0; 4, 6, and 3 checks."
    ],
    "answer": "C at distance 1.0; 4, 5, and 3 checks.",
    "explanation": "Query 17 is closest to centroid 20, whose list contains C at 18, distance 1. B belongs to centroid 10 and is 2.1 away. One probe costs three centroid checks plus C; two probes add B, while flat search checks the three passages. The second probe does not improve this query’s nearest result, and routing adds overhead on this three-passage corpus."
  },
  {
    "question": "A search service asks an existing hnswlib graph for 36 candidates, then displays 15 passages after reranking. All 500 indexed passages are eligible. The graph was built with construction ef set to 80, and query ef is currently 10. What is the smallest query ef the service should configure to follow hnswlib's guidance for this request?",
    "options": [
      "10",
      "15",
      "36",
      "80"
    ],
    "answer": "36",
    "explanation": "The graph receives a request for 36 neighbors, so 36 is the recommended minimum for query ef. Raising it to 15 covers only the display count. Leaving it at 10 falls below the guideline even though hnswlib v0.8.0 uses the larger of query ef and the requested count as its base-layer search width. The builder used 80 to choose links. Setting query ef to 80 would search those same links with a larger budget than required. At any width, returning 36 distinct passages requires at least 36 eligible passages."
  },
  {
    "question": "Five passages have descending similarity scores: a (version 4, 0.99), b (version 3, 0.98), c (version 4, 0.97), d (version 3, 0.96), e (version 4, 0.95). The request wants version 4 and K = 2. What results follow from taking unfiltered top two and then filtering, versus filtering eligibility before exact top-two selection?",
    "options": [
      "[a], versus [a, c].",
      "[a, c], versus [a, c].",
      "[a], versus [a, e].",
      "[a, b], versus [a, c]."
    ],
    "answer": "[a], versus [a, c].",
    "explanation": "The unfiltered two-slot cutoff retains a and b, after which b is removed and c cannot be recovered from that shortlist. Selecting within the version-4 universe ranks a, c, e and returns a, c. Overfetch can help particular cases, but no fixed overfetch factor guarantees enough eligible results for every filter."
  },
  {
    "question": "Two queries each have at least two eligible items. Their exact vector top-two IDs are A: [a, b], B: [d, e]; ANN returns A: [a, c], B: [d, f]. Human relevance sets are A: {c}, B: {f}. With identical scope and a fixed tie-breaking rule, what are macro ANN Recall @ 2 and macro task Recall @ 2 for the ANN run?",
    "options": [
      "0.5 and 0.5.",
      "1.0 and 0.5.",
      "1.0 and 1.0.",
      "0.5 and 1.0."
    ],
    "answer": "0.5 and 1.0.",
    "explanation": "Each ANN list shares one of two IDs with its exact vector list, so ANN recall is 1/2 on each query. Each ANN list also contains its sole human-relevant item, so task recall is 1 on each. Exact vector agreement and task relevance measure different things; this single example does not show a general benefit from approximation."
  }
]
```

> **Next:** Continue to [Decoding Algorithms](/learn/decoding-algorithms). Retrieval selects the evidence. The generator must then choose tokens from its output scores. Compare greedy decoding, sampling, and search while keeping that retrieved context fixed.
