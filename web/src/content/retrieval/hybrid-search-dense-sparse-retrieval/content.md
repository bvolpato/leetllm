---
{
  "id": "hybrid-search-dense-sparse-retrieval",
  "title": "Hybrid Search: Dense + Sparse",
  "slug": "hybrid-search-dense-sparse-retrieval",
  "category": "RAG & Retrieval",
  "difficulty": "Medium",
  "coverImage": "illustrations/_generated/hybrid_search_dark.png",
  "companies": [
    "Google",
    "Microsoft",
    "Cohere",
    "Pinecone",
    "Elastic"
  ],
  "shortDescription": "Help a support engineer find the right EU key-rotation policy by code or paraphrase, while keeping expired and restricted rules out of search results.",
  "keyConceptsTested": [
    "BM25 lexical retrieval",
    "SPLADE learned sparse expansion",
    "Dense semantic retrieval",
    "Reciprocal Rank Fusion",
    "RRF dual-list bias",
    "MMR diversity selection",
    "Candidate recall evaluation",
    "Authorization before ranking",
    "Retrieval traces"
  ],
  "section": "Applied LLM Engineering",
  "order": 12
}
---
<!-- leetllm: edition:reference:start -->

In [Production RAG Pipelines](/learn/design-production-rag-pipeline), we built a retriever that filters by permissions and effective dates first, then ranks by overlapping words. That recovered queries using the document's exact phrasing ("stale service-account keys"), yet returned nothing for a natural paraphrase like "refresh an expired machine <span data-glossary="secrets-management">credential</span>."

Switch to pure vector search and the opposite problem appears: a semantic encoder catches the paraphrase, yet often misranks an opaque internal identifier like `KROT-14`. <span data-glossary="hybrid-search">Hybrid search</span> runs both <span data-glossary="sparse-retrieval">sparse</span> lexical search and <span data-glossary="dense-retrieval">dense</span> vector search over the same permitted corpus, then merges their rankings with <span data-glossary="reciprocal-rank-fusion">Reciprocal Rank Fusion (RRF)</span> (introduced in [Core Retrieval Algorithms](/learn/core-retrieval-algorithms)).

## Two query styles, two opposite misses

Consider two queries that both point to the exact same key-rotation rule:

| Query | Useful signal | Required evidence |
|---|---|---|
| `KROT-14` | Exact rule code | `eu-key-rotation-v2-rule` |
| `refresh expired machine credential` | Meaning close to "stale service-account key rotation" | `eu-key-rotation-v2-rule` |

Word matching nails the code and fails completely on the paraphrase because the two phrases share zero vocabulary terms (**vocabulary mismatch**). Dense embeddings bridge that vocabulary gap, yet subword tokenizers split unfamiliar codes like `KROT-14` into generic pieces that easily collide with neighboring codes like `KROT-13`.

Running both lanes over the same pre-filtered, permitted corpus gives each lane a chance to recover its specialty while keeping restricted and superseded records completely out of ranking, fusion, and logs.

```checkpoint
Why do both retrieval lanes receive an already permitted corpus in this lab?
---
Filtering before ranking keeps restricted text and IDs out of ranker outputs, traces, and caches, and avoids wasting candidate slots on records the caller cannot read. If 40 of an unfiltered lane's top 50 hits are unauthorized, post-filtering leaves only 10. Internal engine post-filtering can still protect disclosure when enforced before results leave a trusted search service, though approximate indexes may traverse nonmatching nodes internally.[^azure2026VectorFilters]
```

## Recreate the permitted candidate universe

We reuse the EU corpus from the previous chapter and tag the current key-rotation rule with diagnostic code `KROT-14`. Two tempting records remain in storage: a superseded revision (`eu-key-rotation-v1-rule`) and a restricted admin rule (`restricted-admin-key-rotation`). The permission and freshness filter excludes both before either ranker sees the corpus.

<!-- leetllm: test, output=show, id=hybrid-lab -->
```python title="permitted-candidates.py"
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from math import isfinite, log
import re


@dataclass(frozen=True)
class PolicyChunk:
    chunk_id: str
    document_id: str
    parent_id: str
    version: str
    region: str
    acl_tag: str
    effective_from: date
    effective_to: date | None
    text: str


@dataclass(frozen=True)
class Caller:
    actor_id: str
    region: str
    acl_tags: frozenset[str]


EVAL_DATE = date(2026, 5, 27)
CALLER = Caller("eu-support-01", "EU", frozenset({"support:eu"}))
CHUNKS = [
    PolicyChunk(
        "eu-key-rotation-v2-rule",
        "eu-access",
        "eu-access-v2",
        "eu-access/2026-04-01",
        "EU",
        "support:eu",
        date(2026, 4, 1),
        None,
        (
            "Rule KROT-14. Stale service-account keys qualify for automated "
            "rotation up to 14 days after becoming stale, provided the risk "
            "signal is at most 48 hours old."
        ),
    ),
    PolicyChunk(
        "eu-key-rotation-v1-rule",
        "eu-access",
        "eu-access-v1",
        "eu-access/2025-02-01",
        "EU",
        "support:eu",
        date(2025, 2, 1),
        date(2026, 3, 31),
        "Rule KROT-14. Stale service-account keys require manual rotation within 30 days.",
    ),
    PolicyChunk(
        "restricted-admin-key-rotation",
        "admin-override-terms",
        "admin-override-terms",
        "admin-override/2026-05-01",
        "EU",
        "security:admins",
        date(2026, 5, 1),
        None,
        "ADMIN-KROT-1. Security admins may run emergency key rotation.",
    ),
    PolicyChunk(
        "eu-session-timeout-v1-rule",
        "eu-session",
        "eu-session-v1",
        "eu-session/2026-01-03",
        "EU",
        "support:eu",
        date(2026, 1, 3),
        None,
        "Idle browser sessions expire after 30 days of inactivity.",
    ),
    PolicyChunk(
        "eu-audit-rebuild-v1",
        "eu-audit",
        "eu-audit-rebuild-v1",
        "eu-audit/2026-02-10",
        "EU",
        "support:eu",
        date(2026, 2, 10),
        None,
        "Rule AUD-7. Missing audit-log shards after ingestion failure qualify for replay rebuild.",
    ),
]


def is_current(chunk: PolicyChunk, on_date: date) -> bool:
    return chunk.effective_from <= on_date and (
        chunk.effective_to is None or on_date <= chunk.effective_to
    )


def permitted_chunks(
    caller: Caller,
    chunks: list[PolicyChunk],
    on_date: date,
) -> list[PolicyChunk]:
    return [
        chunk
        for chunk in chunks
        if chunk.region == caller.region
        and chunk.acl_tag in caller.acl_tags
        and is_current(chunk, on_date)
    ]


permitted = permitted_chunks(CALLER, CHUNKS, EVAL_DATE)
permitted_ids = [chunk.chunk_id for chunk in permitted]
print("Permitted current ids:", permitted_ids)
assert "eu-key-rotation-v2-rule" in permitted_ids
assert "eu-key-rotation-v1-rule" not in permitted_ids
assert "restricted-admin-key-rotation" not in permitted_ids
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Permitted current ids: ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule', 'eu-audit-rebuild-v1']
```
<!-- leetllm: output:end -->

Every retrieval path below passes `permitted` into both rankers. Verify explicitly that the superseded rule and restricted admin rule stay blocked:

<!-- leetllm: test, output=show, continue=hybrid-lab, id=hybrid-boundary -->
```python title="candidate-filtering-regression.py"
blocked_ids = sorted(
    chunk.chunk_id
    for chunk in CHUNKS
    if chunk.chunk_id not in permitted_ids
)
print("Searchable by caller:", permitted_ids)
print("Stored but blocked:", blocked_ids)
assert blocked_ids == ["eu-key-rotation-v1-rule", "restricted-admin-key-rotation"]
old_rule = CHUNKS[1]
assert is_current(old_rule, date(2026, 3, 31))
assert not is_current(old_rule, date(2026, 4, 1))
assert not is_current(CHUNKS[0], date(2026, 3, 31))
assert permitted_chunks(Caller("other-region", "US", CALLER.acl_tags), CHUNKS, EVAL_DATE) == []
assert permitted_chunks(Caller("no-tags", "EU", frozenset()), CHUNKS, EVAL_DATE) == []
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Searchable by caller: ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule', 'eu-audit-rebuild-v1']
Stored but blocked: ['eu-key-rotation-v1-rule', 'restricted-admin-key-rotation']
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/hybrid_search_dark.png" alt="Five stored chunks pass the caller's EU support and current-version filter. The current key, session, and audit chunks pass; the superseded key rule and restricted admin rule do not. Both retrieval lanes receive the same three permitted IDs. BM25 preserves KROT-14 as krot-14 in query and document analysis. The paraphrase refresh expired machine credential has no lexical overlap. A coordinate plot shows its test vector (0.98, 0.05, 0), close to the key axis (1, 0, 0) and far from the session axis (0, 1, 0). Cosines are approximately 0.9987 and 0.0510." />
  <figcaption>Permissions and effective dates select the three searchable records before either lane runs. BM25 keeps `krot-14` as a single token to recover exact codes, while dense cosine similarity aligns the paraphrase with the key-rotation axis.</figcaption>
</figure>

## Build the sparse lane with BM25

Sparse retrieval represents each document by its vocabulary terms, with <span data-glossary="bm25">BM25</span> weighting rare terms more heavily, saturating repeated occurrences, and normalizing for document length.[^robertson2009]

For query terms $q$ and document $d$:

$$
\operatorname{BM25}(q,d)=\sum_{t \in q}\operatorname{IDF}(t)
\frac{f(t,d)(k_1+1)}
{f(t,d)+k_1(1-b+b\lvert d\rvert/\operatorname{avgdl})}
$$

Here $f(t,d)$ is the term count in chunk $d$, $\lvert d\rvert$ is its length in <span data-glossary="token">tokens</span>, and `avgdl` is the corpus average length. Using Lucene's standard defaults ($k_1=1.2$, $b=0.75$) and positive IDF $\ln(1 + (N - n_t + 0.5)/(n_t + 0.5))$:[^lucene2025bm25]

- **$k_1$ controls term-frequency saturation:** Repeated mentions yield diminishing returns instead of scaling linearly.
- **$b$ controls length normalization:** A shorter chunk with one match outscores a long chunk with one match.

For a quick hand check across three equal-length chunks where `krot-14` appears once in a single chunk, $\operatorname{IDF} = \ln(1 + (3 - 1 + 0.5)/(1 + 0.5)) = \ln(8/3) \approx 0.981$. The frequency factor at average length is $(1 \times 2.2)/(1 + 1.2) = 1$, giving a score of `0.981` while nonmatching chunks score `0`.

> **Common mistake:** Default search analyzers often split on hyphens, turning `KROT-14` into `krot` and `14`. Always make sure index-time and query-time analyzers keep domain codes intact.

<!-- leetllm: test, output=show, continue=hybrid-boundary, id=hybrid-bm25 -->
```python title="bm25-lane.py"
TOKEN_RE = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
STOPWORDS = {"a", "an", "the", "after", "for", "of", "is", "within", "when"}


def tokens(text: str) -> list[str]:
    return [
        token
        for token in TOKEN_RE.findall(text.lower())
        if token not in STOPWORDS
    ]


def bm25_rank(
    query: str,
    chunks: list[PolicyChunk],
    top_k: int = 2,
    k1: float = 1.2,
    b: float = 0.75,
) -> list[tuple[PolicyChunk, float]]:
    if top_k <= 0:
        raise ValueError("top_k must be a positive integer")
    if k1 < 0 or not 0 <= b <= 1:
        raise ValueError("require finite k1 >= 0 and 0 <= b <= 1")
    if len({chunk.chunk_id for chunk in chunks}) != len(chunks):
        raise ValueError("chunk IDs must be unique within the corpus")
    if not chunks:
        return []

    doc_tokens = {chunk.chunk_id: tokens(chunk.text) for chunk in chunks}
    avgdl = sum(len(value) for value in doc_tokens.values()) / len(chunks)
    query_terms = sorted(set(tokens(query)))
    if avgdl == 0 or not query_terms:
        return []
    ranked: list[tuple[PolicyChunk, float]] = []

    for chunk in chunks:
        document = doc_tokens[chunk.chunk_id]
        score = 0.0
        for term in query_terms:
            term_count = document.count(term)
            if term_count == 0:
                continue
            containing_docs = sum(term in value for value in doc_tokens.values())
            idf = log(1 + (len(chunks) - containing_docs + 0.5) / (containing_docs + 0.5))
            numerator = term_count * (k1 + 1)
            denominator = term_count + k1 * (1 - b + b * len(document) / avgdl)
            score += idf * (numerator / denominator)
        if score > 0:
            ranked.append((chunk, score))

    return sorted(ranked, key=lambda item: (-item[1], item[0].chunk_id))[:top_k]


EXACT = "KROT-14"
PARAPHRASE = "refresh expired machine credential"
bm25_exact = bm25_rank(EXACT, permitted)
bm25_paraphrase = bm25_rank(PARAPHRASE, permitted)

print("BM25 exact:", [chunk.chunk_id for chunk, _ in bm25_exact])
print("BM25 paraphrase:", [chunk.chunk_id for chunk, _ in bm25_paraphrase])
assert bm25_exact[0][0].chunk_id == "eu-key-rotation-v2-rule"
assert bm25_paraphrase == []
assert bm25_rank("the", permitted) == []
assert bm25_rank(EXACT, []) == []
assert bm25_rank("KROT-14 KROT-14", permitted) == bm25_exact
```

<!-- leetllm: output:start -->
```text title="Output" output compact
BM25 exact: ['eu-key-rotation-v2-rule']
BM25 paraphrase: []
```
<!-- leetllm: output:end -->

BM25 nails `KROT-14` and returns nothing for the paraphrase because the analyzed token sets have zero overlap:

<!-- leetllm: test, output=show, continue=hybrid-bm25, id=hybrid-sparse-debug -->
```python title="diagnose-sparse-miss.py"
required_text = next(
    chunk.text for chunk in permitted if chunk.chunk_id == "eu-key-rotation-v2-rule"
)
exact_overlap = sorted(set(tokens(EXACT)) & set(tokens(required_text)))
paraphrase_overlap = sorted(set(tokens(PARAPHRASE)) & set(tokens(required_text)))
print("Exact overlap:", exact_overlap)
print("Paraphrase overlap:", paraphrase_overlap)
assert exact_overlap == ["krot-14"]
assert paraphrase_overlap == []
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Exact overlap: ['krot-14']
Paraphrase overlap: []
```
<!-- leetllm: output:end -->

<details>
<summary>Deep dive: Learned sparse expansion with SPLADE</summary>

BM25 only scores terms that literally appear in both query and document. **SPLADE** (SParse Lexical AnD Expansion) uses a Transformer's masked language modeling head to assign nonnegative weights across the entire vocabulary, expanding documents with semantically related terms. Given MLM logit $z_{ij}$ for vocabulary item $j$ at position $i$, original SPLADE used sum pooling:[^formal2021]

$$
w_j=\sum_i \log(1+\operatorname{ReLU}(z_{ij}))
$$

SPLADE v2 replaced sum pooling with max pooling across token positions:[^formal2021spladeV2]

$$
w_j=\max_i \log(1+\operatorname{ReLU}(z_{ij}))
$$

ReLU zeroes negative logits and sparsity regularization keeps most weights at zero, allowing dot-product lookup over an inverted index that supports learned term weights.

</details>

```checkpoint
If BM25 returns no result for "refresh expired machine credential," should you relax an authorization or freshness filter?
---
No. Keep permission and freshness filters fixed. Add a semantic retrieval lane or improve query/document representations, then measure whether it recovers the paraphrase within the same permitted set.
```

## Add a dense semantic lane

A dense retriever encodes queries and passages into compact <span data-glossary="vector">vectors</span> so semantically related phrases land near each other even with zero shared words. Dense Passage Retrieval (DPR) pioneered this bi-encoder setup with separate BERT query and passage encoders scored by dot product, computing passage vectors offline and encoding only the query at request time.[^karpukhin2020]

To keep the vector geometry transparent before running a full neural encoder, we represent our three permitted documents as orthogonal 3D basis vectors (key rotation, session timeout, audit rebuild) and place the paraphrase query at `(0.98, 0.05, 0)`. We intentionally leave `KROT-14` out of `QUERY_VECTORS` to mirror a semantic miss on an opaque code.

Ranking with <span data-glossary="cosine-similarity">cosine similarity</span>:

$$
\operatorname{Sim}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}
$$

For `(0.98, 0.05, 0)`, the Euclidean norm is $\sqrt{0.98^2 + 0.05^2} \approx 0.9813$. Its cosine with the key-rotation axis `(1, 0, 0)` is $0.98 / 0.9813 \approx 0.9987$, whereas its cosine with the session axis `(0, 1, 0)` is $0.05 / 0.9813 \approx 0.0510$.

<!-- leetllm: test, output=show, continue=hybrid-sparse-debug, id=hybrid-dense -->
```python title="dense-lane.py"
import numpy as np

Vector = tuple[float, float, float]

DOCUMENT_VECTORS: dict[str, Vector] = {
    "eu-key-rotation-v2-rule": (1.00, 0.00, 0.00),
    "eu-session-timeout-v1-rule": (0.00, 1.00, 0.00),
    "eu-audit-rebuild-v1": (0.00, 0.00, 1.00),
}
QUERY_VECTORS: dict[str, Vector] = {
    PARAPHRASE: (0.98, 0.05, 0.00),
    "stale service-account key rotation within 14 days": (0.96, 0.15, 0.02),
}


def cosine(left: Vector | np.ndarray, right: Vector | np.ndarray) -> float:
    a = np.asarray(left, dtype=np.float64)
    b = np.asarray(right, dtype=np.float64)
    if a.size == 0 or a.shape != b.shape or not (np.isfinite(a).all() and np.isfinite(b).all()):
        raise ValueError("vectors must have matching nonempty dimensions and finite numbers")
    max_a = np.max(np.abs(a))
    max_b = np.max(np.abs(b))
    if max_a == 0.0 or max_b == 0.0:
        raise ValueError("cosine is undefined for a zero vector")
    scaled_a = a / max_a
    scaled_b = b / max_b
    norm_a = np.linalg.norm(scaled_a)
    norm_b = np.linalg.norm(scaled_b)
    score = float(np.dot(scaled_a / norm_a, scaled_b / norm_b))
    return max(-1.0, min(1.0, score))


def dense_rank(
    query: str,
    chunks: list[PolicyChunk],
    top_k: int = 2,
) -> list[tuple[PolicyChunk, float]]:
    if top_k <= 0:
        raise ValueError("top_k must be a positive integer")
    query_vector = QUERY_VECTORS.get(query)
    if query_vector is None:
        return []
    ranked = [
        (chunk, cosine(query_vector, DOCUMENT_VECTORS[chunk.chunk_id]))
        for chunk in chunks
    ]
    return sorted(
        [(chunk, score) for chunk, score in ranked if score > 0],
        key=lambda item: (-item[1], item[0].chunk_id),
    )[:top_k]


dense_exact = dense_rank(EXACT, permitted)
dense_paraphrase = dense_rank(PARAPHRASE, permitted)
print("Dense exact:", [chunk.chunk_id for chunk, _ in dense_exact])
print("Dense paraphrase:", [chunk.chunk_id for chunk, _ in dense_paraphrase])
assert dense_exact == []
assert dense_paraphrase[0][0].chunk_id == "eu-key-rotation-v2-rule"
assert abs(cosine((0.98, 0.05, 0.0), (1.0, 0.0, 0.0)) - 0.9987009944894547) < 1e-9
assert cosine((1.0, 0.0, 0.0), (-1.0, 0.0, 0.0)) == -1.0
assert dense_rank(PARAPHRASE, []) == []
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Dense exact: []
Dense paraphrase: ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule']
```
<!-- leetllm: output:end -->

Now the two lanes disagree in complementary ways, and their scores live on incompatible numeric scales (unbounded BM25 scores versus cosines in $[-1, 1]$). How do we combine them cleanly?

## Fuse candidates without mixing score scales

Adding a raw BM25 score of 3.8 to a cosine similarity of 0.99 lets whichever lane happens to have larger numbers dominate. **Reciprocal Rank Fusion (RRF)** sidesteps incompatible scales by ignoring raw scores and combining only rank positions:[^cormack2009]

$$
\operatorname{RRF}(d)=\sum_{l:\,d\in L_l}\frac{1}{k+\operatorname{rank}_l(d)}
$$

Here $L_l$ is lane $l$'s ranked list (1-indexed) and $k$ is a smoothing constant, commonly initialized at $k=60$ from Cormack et al. With $k=60$, rank 1 earns $1/61 \approx 0.01639$ and rank 2 earns $1/62 \approx 0.01613$, a gentle $1.6\%$ step:

$$
\frac{1/61 - 1/62}{1/61} = \frac{1}{62} \approx 1.61\%
$$

That gentle slope rewards cross-lane consensus: a document ranked near the top of both lanes accumulates roughly $2/61 \approx 0.03279$, outscoring a document that appears in only one lane.

<!-- leetllm: test, output=show, continue=hybrid-dense, id=hybrid-fusion -->
```python title="rrf-fusion.py"
RRF_K = 60


def reciprocal_rank_fusion(
    result_lists: list[list[tuple[PolicyChunk, float]]],
    k: int = RRF_K,
) -> list[tuple[PolicyChunk, float]]:
    if k < 0:
        raise ValueError("k must be a nonnegative integer")
    by_id: dict[str, PolicyChunk] = {}
    scores: dict[str, float] = {}
    for results in result_lists:
        seen: set[str] = set()
        for rank, (chunk, _raw_score) in enumerate(results, start=1):
            if chunk.chunk_id in seen:
                raise ValueError("a lane must return each chunk ID at most once")
            seen.add(chunk.chunk_id)
            if chunk.chunk_id in by_id and by_id[chunk.chunk_id] != chunk:
                raise ValueError("same chunk ID has conflicting records across lanes")
            by_id[chunk.chunk_id] = chunk
            scores[chunk.chunk_id] = scores.get(chunk.chunk_id, 0.0) + 1 / (k + rank)
    return sorted(
        [(by_id[chunk_id], score) for chunk_id, score in scores.items()],
        key=lambda item: (-item[1], item[0].chunk_id),
    )


def hybrid_rank(
    query: str,
    caller: Caller,
    chunks: list[PolicyChunk],
    top_k: int = 2,
    candidate_pool: int | None = None,
) -> list[tuple[PolicyChunk, float]]:
    if top_k <= 0 or (
        candidate_pool is not None and candidate_pool <= 0
    ):
        raise ValueError("result and candidate depths must be positive integers")
    searchable = permitted_chunks(caller, chunks, EVAL_DATE)
    pool = candidate_pool if candidate_pool is not None else max(50, top_k)
    pool = min(pool, len(searchable)) if searchable else top_k
    fused = reciprocal_rank_fusion(
        [bm25_rank(query, searchable, pool), dense_rank(query, searchable, pool)]
    )
    return fused[:top_k]


SHARED_WORDS = "stale service-account key rotation within 14 days"
for query in [EXACT, PARAPHRASE, SHARED_WORDS]:
    hits = hybrid_rank(query, CALLER, CHUNKS)
    print(query, "->", [chunk.chunk_id for chunk, _ in hits])

shared_fused = hybrid_rank(SHARED_WORDS, CALLER, CHUNKS)
assert shared_fused[0][0].chunk_id == "eu-key-rotation-v2-rule"
assert shared_fused[0][1] == 2 / 61
assert reciprocal_rank_fusion([[], []]) == []
assert hybrid_rank("the", CALLER, CHUNKS) == []
```

<!-- leetllm: output:start -->
```text title="Output" output compact
KROT-14 -> ['eu-key-rotation-v2-rule']
refresh expired machine credential -> ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule']
stale service-account key rotation within 14 days -> ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule']
```
<!-- leetllm: output:end -->

> **Key insight:** Keep **lane depth** (`candidate_pool`) separate from **final context size** (`top_k`). If each lane only fetches 2 hits, mid-ranked candidates never meet in fusion.

Even with full lists, RRF's consensus bias has a classic trap: a mediocre distractor appearing at rank 2 in *both* lanes scores $2/62 \approx 0.03226$, beating a correct single-lane rank-1 hit that scores $1/61 \approx 0.01639$:

| Chunk | Sparse rank | Dense rank | RRF |
|---|---|---|---|
| key-rotation (correct) | 1 | absent | $1/61$ |
| session-timeout (distractor) | 2 | 2 | $2/62$ |
| audit-rebuild (noise) | absent | 1 | $1/61$ |

With alphabetical tie-breaking, the correct rule drops to third place, falling right out of a top-2 cutoff:

<!-- leetllm: test, output=show, continue=hybrid-fusion, id=hybrid-fusion-pathology -->
```python title="fusion-depth-pathology.py"
correct = next(c for c in permitted if c.chunk_id == "eu-key-rotation-v2-rule")
distractor = next(c for c in permitted if c.chunk_id == "eu-session-timeout-v1-rule")
noise = next(c for c in permitted if c.chunk_id == "eu-audit-rebuild-v1")

sparse_only_lists = [
    [(correct, 8.0), (distractor, 3.0)],
    [(noise, 0.9), (distractor, 0.85)],
]
fused_full = reciprocal_rank_fusion(sparse_only_lists)
fused_ids = [chunk.chunk_id for chunk, _ in fused_full]
top2_ids = fused_ids[:2]

assert fused_ids[0] == "eu-session-timeout-v1-rule"
assert abs(fused_full[0][1] - 2 / 62) < 1e-12
assert abs(next(s for c, s in fused_full if c.chunk_id == correct.chunk_id) - 1 / 61) < 1e-12

recall_after_fusion_at_1 = int(correct.chunk_id in fused_ids[:1])
recall_after_fusion_at_2 = int(correct.chunk_id in top2_ids)
print("Fused order:", fused_ids)
print("Recall@1 after fusion:", recall_after_fusion_at_1)
print("Recall@2 after fusion:", recall_after_fusion_at_2)
assert recall_after_fusion_at_1 == 0
assert recall_after_fusion_at_2 == 0
assert correct.chunk_id in fused_ids
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Fused order: ['eu-session-timeout-v1-rule', 'eu-audit-rebuild-v1', 'eu-key-rotation-v2-rule']
Recall@1 after fusion: 0
Recall@2 after fusion: 0
```
<!-- leetllm: output:end -->

To keep the correct rule alive for downstream reranking, pass a deeper fused pool forward rather than truncating at `top_k=2`. Also deduplicate chunk IDs within each lane so a single chunk cannot vote twice, and reject zero or NaN vectors before cosine normalization:

<!-- leetllm: test, output=show, continue=hybrid-fusion-pathology, id=hybrid-boundary-inputs -->
```python title="ranking-edge-cases.py"
from dataclasses import replace

def rejects(call):
    try:
        call()
    except (ValueError, TypeError):
        return True
    return False

assert rejects(lambda: reciprocal_rank_fusion([[(correct, 2.0), (correct, 1.0)]]))
assert rejects(lambda: reciprocal_rank_fusion([
    [(correct, 2.0)], [(replace(correct, text="conflicting version"), 1.0)],
]))
assert rejects(lambda: cosine((0.0, 0.0, 0.0), (1.0, 0.0, 0.0)))
assert rejects(lambda: cosine((float("nan"), 0.0, 0.0), (1.0, 0.0, 0.0)))
assert rejects(lambda: bm25_rank(EXACT, permitted, k1=-1))
assert rejects(lambda: dense_rank(PARAPHRASE, permitted, top_k=0))
assert rejects(lambda: hybrid_rank(EXACT, CALLER, CHUNKS, candidate_pool=0))
assert rejects(lambda: bm25_rank(EXACT, [correct, correct]))
assert rejects(lambda: reciprocal_rank_fusion([[]], k=-1))
assert rejects(lambda: bm25_rank(EXACT, permitted, b=2.0))
assert cosine((1e308, 1e308, 0.0), (1e308, 1e308, 0.0)) > 0.999999999
assert cosine((1e-308, 0.0, 0.0), (1.0, 0.0, 0.0)) == 1.0
unsmoothed = reciprocal_rank_fusion(sparse_only_lists, k=0)
assert all(score == 1.0 for _, score in unsmoothed)
assert bm25_rank(EXACT, [replace(correct, text="")]) == []
print("Duplicate votes, conflicting records, invalid vectors and depths: rejected")
print("All-empty lexical corpus: no candidates")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Duplicate votes, conflicting records, invalid vectors and depths: rejected
All-empty lexical corpus: no candidates
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/rank_fusion_dark.png" alt="Two complete rank lists feed reciprocal rank fusion at k=60. BM25 ranks key rotation first and session timeout second; dense ranks session timeout first and key rotation second. Combined, session timeout wins with score 0.0323 while key rotation scores 0.0323 with alphabetical tie-breaking." />
  <figcaption>Two rank-2 votes (`2/62 = 0.0323`) outscore a single rank-1 vote (`1/61 = 0.0164`), pushing the correct key-rotation rule below a top-2 cutoff. Passing a larger fused pool to reranking preserves it.</figcaption>
</figure>

```checkpoint
Why shouldn't you add a BM25 score directly to a cosine-similarity score?
---
They live on different numeric scales. A large BM25 score can overpower cosine similarity regardless of relevance. RRF combines rank positions instead; normalized weighted fusion is an alternative once calibrated on labeled queries.
```

### Should you tune weights instead?

RRF requires no training data and avoids score-scale mismatch, making it an ideal baseline. When you have labeled relevance queries, Bruch, Gai, and Ingber showed that a tuned convex combination of normalized scores can outperform RRF even out of domain:[^bruch2023fusion]

$$
\operatorname{score}_{\text{hybrid}}(d)
=\alpha\widetilde{\operatorname{score}}_{\text{dense}}(d)
+(1-\alpha)\widetilde{\operatorname{score}}_{\text{sparse}}(d)
$$

A common choice is per-query min-max scaling into $[0, 1]$:

$$
\widetilde{s}_i = \frac{s_i - s_{\min}}{s_{\max} - s_{\min}}
$$

Watch for three pitfalls with min-max normalization: a single extreme outlier compresses all remaining scores, changing candidate pool depth can shift $s_{\min}$ or $s_{\max}$ and flip rankings, and equal scores cause division by zero (requiring an explicit zero-spread fallback).

Compare raw weighted scores against lane-normalized weighted scores on `SHARED_WORDS`. Even with $\alpha = 0.7$ favoring dense, the raw BM25 term (`0.3 × 3.788 = 1.136`) outweighs the raw dense term (`0.7 × 0.988 = 0.692`) until both lanes are normalized:

<!-- leetllm: test, output=show, continue=hybrid-boundary-inputs, id=hybrid-weighted-fusion -->
```python title="lane-normalized-weighted-fusion.py"
def min_max(scores: dict[str, float]) -> dict[str, float]:
    if not scores:
        return {}
    values = np.array(list(scores.values()), dtype=np.float64)
    if not np.isfinite(values).all():
        raise ValueError("scores must be finite numbers")
    low, high = float(np.min(values)), float(np.max(values))
    if high == low:
        return {key: 0.0 for key in scores}
    scale = float(np.max(np.abs(values)))
    low_s, high_s = low / scale, high / scale
    spread = high_s - low_s
    return {key: float((val / scale - low_s) / spread) for key, val in scores.items()}


def score_map(
    ranked: list[tuple[PolicyChunk, float]],
    chunk_ids: list[str],
) -> dict[str, float]:
    by_id = {chunk.chunk_id: score for chunk, score in ranked}
    return {chunk_id: by_id.get(chunk_id, 0.0) for chunk_id in chunk_ids}


lane_ids = [chunk.chunk_id for chunk in permitted]
bm25_raw = score_map(bm25_rank(SHARED_WORDS, permitted, top_k=3), lane_ids)
dense_raw = score_map(dense_rank(SHARED_WORDS, permitted, top_k=3), lane_ids)
alpha = 0.7
krot = "eu-key-rotation-v2-rule"

raw_weighted = {
    chunk_id: alpha * dense_raw[chunk_id] + (1 - alpha) * bm25_raw[chunk_id]
    for chunk_id in bm25_raw
}
assert (1 - alpha) * bm25_raw[krot] > alpha * dense_raw[krot]

bm25_n = min_max(bm25_raw)
dense_n = min_max(dense_raw)
normalized_weighted = {
    chunk_id: alpha * dense_n[chunk_id] + (1 - alpha) * bm25_n[chunk_id]
    for chunk_id in bm25_raw
}
weighted_order = sorted(
    normalized_weighted,
    key=lambda chunk_id: (-normalized_weighted[chunk_id], chunk_id),
)
rrf_order = [
    chunk.chunk_id
    for chunk, _ in reciprocal_rank_fusion(
        [
            bm25_rank(SHARED_WORDS, permitted, top_k=3),
            dense_rank(SHARED_WORDS, permitted, top_k=3),
        ]
    )
]
print("Raw BM25:", {k: round(v, 3) for k, v in bm25_raw.items()})
print("Raw dense:", {k: round(v, 3) for k, v in dense_raw.items()})
print("Raw weighted (unadjusted scales):", {k: round(v, 3) for k, v in raw_weighted.items()})
print("Lane-normalized weighted order:", weighted_order)
print("RRF order:", rrf_order)
assert weighted_order[0] == krot
assert rrf_order[0] == krot
assert min_max({}) == {}
assert min_max({"a": 7.0, "b": 7.0}) == {"a": 0.0, "b": 0.0}
assert min_max({"a": -2.0, "b": 2.0}) == {"a": 0.0, "b": 1.0}
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Raw BM25: {'eu-key-rotation-v2-rule': 3.788, 'eu-session-timeout-v1-rule': 0.579, 'eu-audit-rebuild-v1': 0.0}
Raw dense: {'eu-key-rotation-v2-rule': 0.988, 'eu-session-timeout-v1-rule': 0.154, 'eu-audit-rebuild-v1': 0.021}
Raw weighted (unadjusted scales): {'eu-key-rotation-v2-rule': 1.828, 'eu-session-timeout-v1-rule': 0.282, 'eu-audit-rebuild-v1': 0.014}
Lane-normalized weighted order: ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule', 'eu-audit-rebuild-v1']
RRF order: ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule', 'eu-audit-rebuild-v1']
```
<!-- leetllm: output:end -->

### Test access controls under fused ranking

Verify that probing directly for the restricted admin code `ADMIN-KROT-1`, or querying from an unauthorized region, never surfaces forbidden chunks:

<!-- leetllm: test, output=show, continue=hybrid-weighted-fusion, id=hybrid-attack -->
```python title="hidden-source-attack.py"
NO_ACCESS = Caller("visitor-9000", "APAC", frozenset())
attack_hits = hybrid_rank("ADMIN-KROT-1", CALLER, CHUNKS)
attack_ids = [chunk.chunk_id for chunk, _ in attack_hits]
no_access_hits = hybrid_rank(EXACT, NO_ACCESS, CHUNKS)
print("Visible candidates for hidden code:", attack_ids)
print("Visible candidates without corpus access:", no_access_hits)
assert "restricted-admin-key-rotation" not in attack_ids
assert attack_ids == []
assert no_access_hits == []
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Visible candidates for hidden code: []
Visible candidates without corpus access: []
```
<!-- leetllm: output:end -->

## Evaluate recall and safety before touching generation

Because each query here has a single relevant chunk, recovering it inside the top 2 scores 1 and missing it scores 0, so HitRate@2 equals mean <span data-glossary="recall-at-k">Recall@2</span>. (When a query needs multiple passages, Recall@k measures the fraction of relevant passages recovered.)

<figure>
  <img src="illustrations/_generated/retrieval_release_gate_dark.png" alt="Three evaluation queries test lexical and semantic lanes against release thresholds. Exact code KROT-14 succeeds in lexical lane; paraphrase succeeds in dense lane; restricted identifier query is blocked by the authorization filter." />
  <figcaption>BM25 recovers exact codes, dense search recovers paraphrases, and hybrid fusion handles both while pre-filtering keeps restricted and stale records out of every lane.</figcaption>
</figure>

<!-- leetllm: test, output=show, continue=hybrid-attack, id=hybrid-eval -->
```python title="retrieval-evaluation.py"
@dataclass(frozen=True)
class RetrievalCase:
    name: str
    query: str
    expected_chunk_id: str


CASES = [
    RetrievalCase("exact-code", EXACT, "eu-key-rotation-v2-rule"),
    RetrievalCase("paraphrase", PARAPHRASE, "eu-key-rotation-v2-rule"),
    RetrievalCase("shared-language", SHARED_WORDS, "eu-key-rotation-v2-rule"),
]


def recall_at_2(rank_fn) -> float:
    recovered = 0
    for case in CASES:
        ids = [chunk.chunk_id for chunk, _ in rank_fn(case.query)]
        recovered += case.expected_chunk_id in ids[:2]
    return recovered / len(CASES)


bm25_recall = recall_at_2(lambda query: bm25_rank(query, permitted))
dense_recall = recall_at_2(lambda query: dense_rank(query, permitted))
hybrid_recall = recall_at_2(lambda query: hybrid_rank(query, CALLER, CHUNKS))

restricted_attack = hybrid_rank("ADMIN-KROT-1", CALLER, CHUNKS)
superseded_attack = hybrid_rank(
    "KROT-14 key rotation manual 30 days",
    CALLER,
    CHUNKS,
)
restricted_ids = [chunk.chunk_id for chunk, _ in restricted_attack]
superseded_ids = [chunk.chunk_id for chunk, _ in superseded_attack]
safety_pass = (
    "restricted-admin-key-rotation" not in restricted_ids
    and "eu-key-rotation-v1-rule" not in superseded_ids
)

print(f"BM25 Recall@2: {bm25_recall:.2f}")
print(f"Dense Recall@2: {dense_recall:.2f}")
print(f"Hybrid RRF Recall@2: {hybrid_recall:.2f}")
print("Restricted attack ids:", restricted_ids)
print("Superseded attack ids:", superseded_ids)
print("Safety check:", safety_pass)
assert hybrid_recall == 1.0
assert hybrid_recall > bm25_recall
assert hybrid_recall > dense_recall
assert restricted_ids == []
assert "eu-key-rotation-v1-rule" not in superseded_ids
assert safety_pass
```

<!-- leetllm: output:start -->
```text title="Output" output compact
BM25 Recall@2: 0.67
Dense Recall@2: 0.67
Hybrid RRF Recall@2: 1.00
Restricted attack ids: []
Superseded attack ids: ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule']
Safety check: True
```
<!-- leetllm: output:end -->

In production, evaluate on a held-out query set spanning exact codes, natural paraphrases, unanswerable questions, and restricted probes while keeping corpus version, encoder, tokenizer, lane depths, and fusion parameters fixed across comparisons:

| Check | What to evaluate | Failure signal |
|---|---|---|
| Permitted Recall@k | Query and required current chunk ID | Relevant evidence misses context |
| Restricted-source exclusion | Queries targeting hidden chunks | Authorization filter leaked |
| Superseded-source exclusion | Queries matching outdated wording | Freshness filter regressed |
| Unanswerable cases | Questions with no permitted evidence | Retriever or generator overreaches |

```checkpoint
Hybrid reaches Recall@2 of 1.00 on these three labeled queries. Can you conclude hybrid search wins across every policy query?
---
No. These three cases verify complementary single-lane misses and exclusion filters. Production claims require a representative held-out query set and latency measurements across query families.
```

## Trace each lane before adding reranking

Logging per-lane IDs alongside the full fused pool and final shortlist tells you immediately which stage lost a document:

| Failure | Trace evidence | Next repair |
|---|---|---|
| Retrieval miss | Expected chunk absent from sparse, dense, and fused lists | Fix analyzer, embedding model, or lane depth |
| Fusion cutoff loss | Expected chunk exists in a lane but falls below cutoff | Deepen fused pool or tune fusion weights |
| Precision noise | Correct chunk is in the pool but distractors outrank it | Add a cross-encoder reranker (next chapter) |

<!-- leetllm: test, output=show, continue=hybrid-eval, id=hybrid-trace -->
```python title="hybrid-retrieval-trace.py"
def trace_hybrid_request(
    query: str,
    query_kind: str,
    caller: Caller,
) -> dict[str, object]:
    searchable = permitted_chunks(caller, CHUNKS, EVAL_DATE)
    pool = max(1, min(50, len(searchable)))
    sparse = bm25_rank(query, searchable, pool)
    dense = dense_rank(query, searchable, pool)
    fused = reciprocal_rank_fusion([sparse, dense])
    return {
        "versions": {
            "retriever": "policy-retriever-v2",
            "index": "policy-index/2026-05-27",
            "sparse": "bm25-tokenizer-v1",
            "dense": "static-embeddings-v1",
            "fusion": f"rrf-k{RRF_K}",
        },
        "caller_metadata": {
            "actor_id": caller.actor_id,
            "region": caller.region,
            "acl_tags": sorted(caller.acl_tags),
            "grant_revision": "grants-v1",
        },
        "effective_date": EVAL_DATE.isoformat(),
        "query_kind": query_kind,
        "candidate_pool": pool,
        "final_top_k": 2,
        "sparse_ids": [chunk.chunk_id for chunk, _ in sparse],
        "dense_ids": [chunk.chunk_id for chunk, _ in dense],
        "fused_pool_ids": [chunk.chunk_id for chunk, _ in fused],
        "fused_ids": [chunk.chunk_id for chunk, _ in fused[:2]],
        "timings_ms": {
            "authorize": 2, "bm25": 4, "dense": 11, "fusion": 1, "retrieval_total": 18,
        },
    }


trace = trace_hybrid_request(PARAPHRASE, "paraphrase-regression", CALLER)
stores_raw_policy_text = any(
    chunk.text in str(trace)
    for chunk in CHUNKS
)
print("Versions:", trace["versions"])
print("Sparse ids:", trace["sparse_ids"])
print("Dense ids:", trace["dense_ids"])
print("Full fused pool ids:", trace["fused_pool_ids"])
print("Fused ids:", trace["fused_ids"])
print("Trace stores raw policy text:", stores_raw_policy_text)
assert trace["fused_ids"][0] == "eu-key-rotation-v2-rule"
assert "eu-session-timeout-v1-rule" in trace["fused_ids"]
assert "restricted-admin-key-rotation" not in str(trace)
assert not stores_raw_policy_text
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Versions: {'retriever': 'policy-retriever-v2', 'index': 'policy-index/2026-05-27', 'sparse': 'bm25-tokenizer-v1', 'dense': 'static-embeddings-v1', 'fusion': 'rrf-k60'}
Sparse ids: []
Dense ids: ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule']
Full fused pool ids: ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule']
Fused ids: ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule']
Trace stores raw policy text: False
```
<!-- leetllm: output:end -->

Notice that the trace stores IDs and versions rather than copying private text into logs, and keeps `eu-session-timeout-v1-rule` visible as a rank-2 distractor for downstream inspection.

## Diversify candidates with maximal marginal relevance

When a corpus contains near-duplicate paragraphs across multiple documents, fusion can fill every context slot with copies of the same passage. <span data-glossary="maximal-marginal-relevance">Maximal Marginal Relevance (MMR)</span> trades relevance against redundancy with already selected passages:[^carbonell1998]

$$
\operatorname{MMR}(q, D, S) = \operatorname{argmax}_{d_i \in D \setminus S} \left[ \lambda \operatorname{Sim}_1(d_i, q) - (1-\lambda) \max_{d_j \in S} \operatorname{Sim}_2(d_i, d_j) \right]
$$

Here $D$ is the candidate pool, $S$ is the set selected so far, and $\lambda \in [0, 1]$ balances query relevance against similarity to already chosen chunks ($\lambda=1$ reduces to standard relevance ranking).

<!-- leetllm: test, output=show, continue=hybrid-trace, id=hybrid-mmr -->
```python title="maximal-marginal-relevance.py"
def maximal_marginal_relevance(
    query_vector: Vector,
    candidate_vectors: dict[str, Vector],
    top_k: int = 2,
    lambda_param: float = 0.5,
) -> list[str]:
    if top_k <= 0:
        raise ValueError("top_k must be a positive integer")
    if not (0.0 <= lambda_param <= 1.0):
        raise ValueError("lambda_param must be between 0.0 and 1.0")
    if not candidate_vectors:
        return []

    selected: list[str] = []
    unselected = set(candidate_vectors.keys())

    while unselected and len(selected) < top_k:
        best_candidate: str | None = None
        best_score = float("-inf")

        for candidate_id in sorted(unselected):
            cand_vec = candidate_vectors[candidate_id]
            relevance = cosine(cand_vec, query_vector)
            redundancy = (
                max(cosine(cand_vec, candidate_vectors[sel_id]) for sel_id in selected)
                if selected
                else 0.0
            )
            mmr_score = lambda_param * relevance - (1.0 - lambda_param) * redundancy
            if mmr_score > best_score:
                best_score = mmr_score
                best_candidate = candidate_id

        if best_candidate is None:
            break
        selected.append(best_candidate)
        unselected.remove(best_candidate)

    return selected


MMR_VECTORS: dict[str, Vector] = {
    "eu-key-rotation-v2-rule": (1.00, 0.00, 0.00),
    "eu-key-rotation-v2-duplicate": (0.99, 0.02, 0.00),
    "eu-session-timeout-v1-rule": (0.00, 1.00, 0.00),
}
query_vec = QUERY_VECTORS[PARAPHRASE]

greedy_top2 = maximal_marginal_relevance(
    query_vec, MMR_VECTORS, top_k=2, lambda_param=1.0
)
diverse_top2 = maximal_marginal_relevance(
    query_vec, MMR_VECTORS, top_k=2, lambda_param=0.5
)

print("Greedy top-2 (lambda=1.0):", greedy_top2)
print("Diverse MMR top-2 (lambda=0.5):", diverse_top2)
assert greedy_top2 == ["eu-key-rotation-v2-duplicate", "eu-key-rotation-v2-rule"]
assert diverse_top2 == ["eu-key-rotation-v2-duplicate", "eu-session-timeout-v1-rule"]
assert maximal_marginal_relevance(query_vec, {}, top_k=2) == []
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Greedy top-2 (lambda=1.0): ['eu-key-rotation-v2-duplicate', 'eu-key-rotation-v2-rule']
Diverse MMR top-2 (lambda=0.5): ['eu-key-rotation-v2-duplicate', 'eu-session-timeout-v1-rule']
```
<!-- leetllm: output:end -->

> **Common mistake:** Diversity does not automatically improve precision. Here MMR replaces a near-duplicate with the irrelevant session-timeout rule. For narrow single-rule queries, deduplicate by source ID and leave extra slots empty; reserve MMR for multi-aspect queries where distinct passages are genuinely required.

## Enforce retrieval latency budgets

Running two retrieval lanes adds work, so monitor per-stage timings alongside an end-to-end retrieval budget. Even when parallel lanes each meet their own limits (`authorize=10 ms`, `bm25=12 ms`, `dense=40 ms`, `fusion=8 ms`), the parallel path takes `10 + max(12, 40) + 8 = 58 ms` and breaches a 50 ms overall budget:

<!-- leetllm: test, output=show, continue=hybrid-mmr, id=hybrid-release-gate -->
```python title="retrieval-latency-budget.py"
RETRIEVAL_BUDGET_MS = {
    "authorize": 10, "bm25": 12, "dense": 40, "fusion": 8, "retrieval_total": 50,
}


def exceeded_retrieval_budgets(timings: dict[str, float]) -> list[str]:
    failures = []
    for stage, budget in RETRIEVAL_BUDGET_MS.items():
        val = timings.get(stage)
        if val is None or not isfinite(val) or val < 0 or val > budget:
            failures.append(stage)
    return failures


healthy = trace["timings_ms"]
missing_dense = {
    stage: elapsed
    for stage, elapsed in healthy.items()
    if stage != "dense"
}
print("Healthy exceeded:", exceeded_retrieval_budgets(healthy))
print("Missing timing exceeded:", exceeded_retrieval_budgets(missing_dense))
all_stages_pass = {
    "authorize": 10, "bm25": 12, "dense": 40, "fusion": 8, "retrieval_total": 58,
}
print("Stage limits met, total missed:", exceeded_retrieval_budgets(all_stages_pass))
assert exceeded_retrieval_budgets(healthy) == []
assert exceeded_retrieval_budgets(missing_dense) == ["dense"]
assert exceeded_retrieval_budgets({**healthy, "dense": 40}) == []
assert exceeded_retrieval_budgets({**healthy, "dense": 41}) == ["dense"]
assert exceeded_retrieval_budgets({**healthy, "dense": float("nan")}) == ["dense"]
assert exceeded_retrieval_budgets({**healthy, "dense": -1}) == ["dense"]
assert exceeded_retrieval_budgets(all_stages_pass) == ["retrieval_total"]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Healthy exceeded: []
Missing timing exceeded: ['dense']
Stage limits met, total missed: ['retrieval_total']
```
<!-- leetllm: output:end -->

BM25 now recovers `KROT-14`, dense search recovers paraphrases, and pre-filtering keeps expired and restricted records out of both lanes. Yet the session-timeout distractor still sits right beside the right rule in our shortlist. Reordering that shortlist accurately requires a second-stage cross-encoder, which we build next.

```mastery-quiz
[
  {
    "question": "A search service must recover both `KROT-14` and the paraphrase `refresh expired machine credential`. BM25 finds only the code, while the chosen dense encoder finds only the paraphrase. Which design meets both requirements without weakening access controls?",
    "options": [
      "Expand BM25 to every stored revision, then remove stale hits after lexical ranking produces enough candidates.",
      "Replace BM25 with the dense encoder, then add the exact code to the query whenever semantic search returns nothing.",
      "Run BM25 and dense search over the same permitted current chunks, then fuse their ranked candidate IDs.",
      "Run dense search over permitted chunks, then use MMR to reconstruct code matches that the encoder did not retrieve."
    ],
    "answer": "Run BM25 and dense search over the same permitted current chunks, then fuse their ranked candidate IDs.",
    "explanation": "The two lanes cover the complementary misses inside the same permission and freshness filters. Fusion reorders candidates without widening access."
  },
  {
    "question": "A developer lets retrieval rankers return hidden document IDs to fusion and request traces, then removes those IDs before prompt construction. Which review finding is decisive?",
    "options": [
      "Reject the design because hidden content can influence ranks, identifiers, caches, or traces before the late filter runs.",
      "Accept the design if fused scores are discarded, because chunk IDs alone can't reveal restricted evidence.",
      "Accept the design after lowering each lane's depth, because a smaller candidate pool limits any disclosure.",
      "Reject only the dense lane, because sparse term statistics can't carry signals from restricted documents."
    ],
    "answer": "Reject the design because hidden content can influence ranks, identifiers, caches, or traces before the late filter runs.",
    "explanation": "Filtering at prompt construction arrives too late when retrieval already exposed hidden IDs to fusion, caches, and traces."
  },
  {
    "question": "In a BM25 calculation, k1=1.5 and document length equals the corpus average. A rare term has IDF 1.0. What are its contributions at frequencies 1 and 3?",
    "options": [
      "1 and 3",
      "1 and 5/3",
      "1.5 and 2.5",
      "0.75 and 1.5"
    ],
    "answer": "1 and 5/3",
    "explanation": "At average length the factor is f*(k1+1)/(f+k1), giving 2.5/2.5 = 1 and 7.5/4.5 = 5/3. Repeated occurrences saturate."
  },
  {
    "question": "With RRF smoothing 10, A is first in one lane and missing in the other. B is fourth in both. Which ordering and scores follow?",
    "options": [
      "A leads: 1/11 > 1/14.",
      "B leads: 2/13 > 1/10.",
      "B leads: 2/14 > 1/11.",
      "A leads: 1 > 2/4."
    ],
    "answer": "B leads: 2/14 > 1/11.",
    "explanation": "A earns 1/(10 + 1) = 1/11 from its single rank-1 hit. B earns 1/(10 + 4) twice, so 2/14 > 1/11."
  },
  {
    "question": "A team sets each lane's candidate depth equal to final `top_k = 2`. The required chunk ranks fourth in both lanes and would gain from two RRF contributions. What change addresses the failure?",
    "options": [
      "Increase final prompt size while leaving both lane depths at two, so generation can recover the missing candidate.",
      "Lower RRF `k` until a candidate absent from both input lists receives a large enough fusion score.",
      "Retrieve deeper per-lane pools, fuse those ranks, then apply the final context or reranking budget.",
      "Normalize the two top-2 raw score lists, because normalization restores candidates discarded before fusion."
    ],
    "answer": "Retrieve deeper per-lane pools, fuse those ranks, then apply the final context or reranking budget.",
    "explanation": "Fusion can score only candidates returned by a lane. Keeping lane depth larger than final context size lets mid-ranked matches accumulate consensus across lanes."
  },
  {
    "question": "A candidate has normalized dense score 0.6 and lexical score 0.3. Dense weight is 0.8. Which fused score and interpretation follow?",
    "options": [
      "0.54; it is a weighted ranking score.",
      "0.54; it is a calibrated relevance chance.",
      "0.48; it is a weighted ranking score.",
      "0.36; it is a calibrated relevance chance."
    ],
    "answer": "0.54; it is a weighted ranking score.",
    "explanation": "0.8 * 0.6 + 0.2 * 0.3 = 0.54. Normalized weighted sums order candidates rather than producing calibrated relevance probabilities."
  },
  {
    "question": "An IVF index has 400 equal lists for 200,000 vectors. A query scores all 400 centers and probes 6 lists. What work estimate follows, and what repairs a cross-list miss?",
    "options": [
      "3,400 comparisons; increase query probes.",
      "3,000 comparisons; increase query probes.",
      "3,400 comparisons; reduce query probes.",
      "30,400 comparisons; increase query probes."
    ],
    "answer": "3,400 comparisons; increase query probes.",
    "explanation": "Each list averages 500 vectors, so 400 + 6 * 500 = 3,400 comparisons. Increasing query probes scans adjacent clusters to recover boundary neighbors."
  },
  {
    "question": "Only passage R7 answers a ferry refund question. Both searches completed over current, permitted passages. In rank order, the sparse lane returned [], the dense lane returned [R4, R7], and RRF kept [R4, R7]. The reader gets only the first passage. Which change should you test to get R7 into that one slot?",
    "options": [
      "Return more passages from the dense ranking because R4 survived in the top two.",
      "Raise the RRF smoothing constant to narrow the gap between R4 and R7.",
      "Keep more passages from the fused ranking before passing the first one to the reader.",
      "Rerank the two retained passages against the refund question before choosing one."
    ],
    "answer": "Rerank the two retained passages against the refund question before choosing one.",
    "explanation": "R7 reached the shortlist, yet R4 occupies the reader's single slot. Reranking the shortlist directly against the query tests whether R7 moves ahead of R4."
  },
  {
    "question": "After choosing one source, a near-copy has relevance 0.8 and redundancy 0.9; a distinct candidate has relevance 0.6 and redundancy 0.2. At λ=0.5, which gets the next MMR slot and why?",
    "options": [
      "Near-copy: 0.85 versus 0.40; the larger adjusted score wins.",
      "Distinct: 0.20 versus −0.05; the larger adjusted score wins.",
      "Near-copy: 0.05 versus −0.20; the larger adjusted score wins.",
      "Distinct: 0.40 versus 0.85; the smaller adjusted score wins."
    ],
    "answer": "Distinct: 0.20 versus −0.05; the larger adjusted score wins.",
    "explanation": "The MMR scores are 0.5 * 0.8 - 0.5 * 0.9 = -0.05 for the near-copy and 0.5 * 0.6 - 0.5 * 0.2 = 0.20 for the distinct candidate."
  },
  {
    "question": "Authorization takes 7 ms, parallel lanes take 13 and 29 ms, and fusion takes 6 ms. The overall budget is 45 ms. Which total time and verdict follow?",
    "options": [
      "55 ms; the request exceeds its budget.",
      "42 ms; the request fits its budget.",
      "35 ms; the request fits its budget.",
      "29 ms; the request fits its budget."
    ],
    "answer": "42 ms; the request fits its budget.",
    "explanation": "The two lanes run in parallel after authorization, so fusion waits for the slower lane: 7 + 29 + 6 = 42 ms, leaving 3 ms of headroom."
  }
]
```

> **Next:** Continue to [Reranking and Cross-Encoders for RAG](/learn/reranking-cross-encoders-rag). Hybrid retrieval recovers `KROT-14` and the credential paraphrase, yet `eu-session-timeout-v1-rule` still sits right beside the right rule. Next, add a cross-encoder pass to reorder that shortlist before context packing.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

The support service now knows what the user may read, and it can trace every claim to a source. Its search is still embarrassing. The user types "refresh expired machine credential," and not one word matches. The service still returns two records, and it puts the key-rotation policy first only because a tie on zero falls to alphabetical order. Add one more document, and that luck runs out.

So you add vector search, which handles paraphrases well, and you are pleased until the next day. The user pastes in `KROT-14`, the diagnostic code printed in the policy itself, and the new search returns a different rule. An embedding captures the general meaning of a passage, and an opaque internal code may carry little meaning for it to capture. The old word-matching search would have found this instantly.

These two failures have opposite causes, and that is the reason to run both kinds of search. Hybrid search combines a lexical lane, which matches the words people actually typed, with a dense lane, which matches what they meant. This chapter builds both, and combines their results with a method simple enough to work out by hand. Then it shows you where that method fails.

We retain the EU policy rules and caller permissions from the previous chapter, using `KROT-14` as the rule diagnostic identifier.

## Both lanes search the same permitted documents

Before any ranking, one trusted decision determines what the caller may search. In our small example, that leaves three passages: the key rule the caller needs, and two permitted distractors about idle browser sessions and rebuilding audit logs. The superseded key policy and the administrative recovery procedure never enter the pool.

| Eligible chunk | Role in this exercise |
|---|---|
| `eu-key-rotation-v2-rule` | The policy the caller needs |
| `eu-session-timeout-v1-rule` | Permitted distractor about idle browser sessions |
| `eu-audit-rebuild-v1` | Permitted distractor about rebuilding audit logs |

Running two lanes doubles your opportunities to leak. If only one lane applies the permission filter, a restricted passage returned by the other can flow into fusion, reranking, traces, and the model's context. Enforce the same rule in both, before any text leaves the trusted search service. Internally, an approximate index may walk through records that fail the filter while it searches. That is acceptable as long as only permitted results ever come out, though you should measure separately how well it finds enough permitted neighbors.

<figure>
<img src="illustrations/_generated/hybrid_search_dark.png" alt="Five records meet a permission and validity check. The key rule, session rule, and audit note pass; the old key rule and admin recovery do not. A matrix then crosses two queries with two lanes. For KROT-14, BM25 finds the key rule, and cosine depends on the encoder, with no toy axis for a code. For refresh expired machine credential, BM25 has no candidates because no word is shared, and cosine points almost along the key rule axis, scoring 0.9987 against 0.0510 for the session rule." />
<figcaption>Three records pass the permission and validity check, and then two different kinds of matching find the same rule. The exact code survives analysis as one token for BM25, and in our hand-placed vectors the paraphrase lands close to the rule.</figcaption>
</figure>

## The lexical lane: why BM25 beats counting words

Our last chapter's retriever counted shared words, and treated every word as equally informative. That has two problems. A match on "the" counts as much as a match on `krot-14`, and a long document gets to match more words merely by being long.

BM25 addresses both, and it has been the workhorse of search for decades.[^robertson2009] Rare terms get more weight, repeated terms bring diminishing returns, and scores are adjusted for document length. For one query term $t$ in document $d$, a common form contributes

$$
\operatorname{IDF}(t)\,
\frac{f(t,d)(k_1+1)}
{f(t,d)+k_1\left(1-b+b\,|d|/\overline{L}\right)}.
$$

That looks worse than it is. $f(t,d)$ counts how often the term appears in the document, $|d|$ is the document's analyzed length, and $\overline{L}$ is the average length. The right-hand fraction grows with term frequency and flattens out, with $k_1$ controlling how quickly. The parameter $b$ controls how much document length matters: at $b=0$ it does not matter at all, and as $b$ grows, a long passage needs more occurrences to earn the same score as a short one.

The left-hand factor, called inverse document frequency or IDF, is where rarity comes in. Our example uses the positive form

$$
\operatorname{IDF}(t)=\log\left(1+\frac{N-n_t+0.5}{n_t+0.5}\right),
$$

where $N$ is the number of passages and $n_t$ is how many contain the term. This form, and the settings $k_1=1.2$ and $b=0.75$, follow Lucene's documented convention.[^lucene2025bm25]

Work through it with our three passages. The code `krot-14` appears in one of them, so its IDF is about $\log(1+2.5/1.5)=0.981$. A word that appears in all three gets about $\log(1+0.5/3.5)=0.134$. A rare code is worth more than seven times as much as a word that appears everywhere, before frequency and length have their say.

Now for the part that catches people: all of this happens after text analysis. Lowercasing `KROT-14` consistently gives you `krot-14`. An analyzer that splits on hyphens gives you `krot` and `14`, and `14` also matches the "14 days" in every policy with a two-week deadline. Drop the digits and the code is gone. Splitting on hyphens is the out-of-the-box behavior of a very common engine, so this is no corner case. Elasticsearch's default analyzer uses a tokenizer that splits on hyphens, so `KROT-14` becomes `krot` and `14` unless you index identifiers in a field that keeps them whole.[^elasticStandardTokenizer2026] When lexical search disappoints you, look at the analyzed tokens before you look at the formula, because a tokenizer mistake is often the real cause.

```checkpoint
A corpus has 1,000 passages. The code `krot-14` appears in 2 of them, and the word `key` appears in 400. Using the positive IDF form above, about how much more is one match on the code worth?
---
For the code, $\log(1+998.5/2.5)=\log(400.4)\approx5.99$. For the word, $\log(1+600.5/400.5)=\log(2.5)\approx0.92$. So the code is worth about 6.5 times as much, before frequency and length have their say.
```

One more option is worth knowing about. Learned sparse models such as SPLADE use a transformer to assign weights across the vocabulary, including to words that never appeared in the text, which gives a query and a passage more ways to overlap without shared words.[^formal2021][^formal2021spladeV2] They need an index that accepts learned weights, so evaluate their cost and permission behavior before you swap one in for BM25.

## The dense lane: matching by meaning

Dense retrieval encodes a query and a passage into vectors, so that passages with similar meanings land near each other even when their words differ. The vector comes from an embedding model, usually a small [Transformer](/learn/transformer-architecture-end-to-end) trained on pairs of texts that belong together, so that those pairs end up scoring higher than random ones. Run a passage through it, and you get one output vector per token. Average those vectors, as many models do, and you have one vector for the passage. The original Dense Passage Retrieval work used separate encoders for queries and passages, and scored them with a dot product.[^karpukhin2020] Passage vectors get computed ahead of time, and only the query needs encoding at request time.

Real embeddings have hundreds of dimensions, and you cannot read them. For a first look we use three hand-picked axes that you can read: key rotation, browser sessions, and audit rebuilding. The key rule is $(1,0,0)$, the session rule is $(0,1,0)$, and the audit note is $(0,0,1)$. We place the paraphrase query at $(0.98,0.05,0)$.

Cosine similarity measures the angle between two vectors, ignoring their lengths:

$$
\cos(q,d)=\frac{q\cdot d}{\lVert q\rVert\lVert d\rVert}.
$$

[The dot-product chapter](/learn/linear-algebra-machine-learning-deeper) promised we would come back to cosine versus the dot product, so here is the rule. On unit-length vectors, the two give the same ranking. On other vectors, the dot product also rewards length, so a long vector can outscore a closer one. Use what your embedding model was trained for, and check what your vector database actually computes.

For the key rule, that is $0.98/\sqrt{0.98^2+0.05^2}\approx0.9987$. For the session rule, about $0.0510$. The query points almost straight along the key axis, so the key rule wins, even though the two share no words.

## A real embedding model

Hand-picked axes make the geometry clean. Real models are messier. Here is the same search with `all-MiniLM-L6-v2`, the small model we met in the chunking chapter, plus three look-alike rules we made up, the kind a real policy corpus collects over the years. We run it through the Sentence Transformers library, which brings PyTorch with it when you install it. The first run then downloads about 90 MB of model weights, and after that it runs offline on a laptop CPU.

```text title="Install first"
pip install sentence-transformers==6.2.0
```

Notice which rule the bare code `KROT-14` ranks first.

<!-- leetllm: test, output=show, deps=sentence-transformers==6.2.0 -->
```python title="a-real-embedding-model.py"
# The first run downloads about 90 MB of model weights.
from sentence_transformers import SentenceTransformer

model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2", device="cpu"
)
passages = {
    "key rule": "Rule KROT-14. Stale service-account keys qualify "
        "for automated rotation up to 14 days after becoming stale, "
        "provided the risk signal is at most 48 hours old.",
    "session rule": "Idle browser sessions expire after 30 days of "
        "inactivity.",
    "audit note": "Rebuild audit logs from the retained event "
        "archive.",
}
look_alikes = {
    "KROT-41": "Rule KROT-41. Stale service-account keys must be "
        "retired 30 days after their last use, provided no incident "
        "is open.",
    "KROT-13": "Rule KROT-13. Service-account keys are rotated every "
        "90 days by the platform team.",
    "CERT-14": "Rule CERT-14. Machine certificates are refreshed 14 "
        "days before they expire.",
}

def search(query, corpus):
    texts = [query, *corpus.values()]
    vectors = model.encode(texts, normalize_embeddings=True)
    scores = vectors[1:] @ vectors[0]
    pairs = sorted(zip(scores, corpus), reverse=True)
    rows = [f"{score:.2f} {name}" for score, name in pairs]
    print(query)
    for start in range(0, len(rows), 3):
        print("  " + ", ".join(rows[start:start + 3]))

PARAPHRASE = "refresh expired machine credential"
vector = model.encode(PARAPHRASE)
print(len(vector), "numbers, starting", vector[:3].round(3))
search(PARAPHRASE, passages)
search(PARAPHRASE, passages | look_alikes)
search("KROT-14", passages | look_alikes)

filler = "Stale keys rotate on a schedule. " * 60
catch = filler + "Only if the risk signal is at most 48 hours old."
a, b = model.encode([filler, catch], normalize_embeddings=True)
print(f"with and without the last sentence: {a @ b:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
384 numbers, starting [-0.065 -0.052 -0.01 ]
refresh expired machine credential
  0.43 key rule, 0.33 session rule, 0.27 audit note
refresh expired machine credential
  0.55 CERT-14, 0.52 KROT-41, 0.43 key rule
  0.33 session rule, 0.31 KROT-13, 0.27 audit note
KROT-14
  0.39 KROT-13, 0.36 key rule, 0.25 KROT-41
  0.14 CERT-14, 0.03 audit note, -0.03 session rule
with and without the last sentence: 1.00
```
<!-- leetllm: output:end -->

Line up that output against our toy, and four things change. First, you can no longer read the vector: it has 384 numbers, and no axis means "key rotation." Second, the scores bunch up. The paraphrase gives 0.43 for the key rule, 0.33 for the session rule, and 0.27 for the audit note, where the toy gave 0.9987 and 0.0510. The order holds, and the gap is a fraction of what the toy shows, so a similarity threshold you borrowed from somewhere else means very little.

Third, the look-alikes win. Add three rules about keys and certificates, and the key rule falls to third, behind a certificate rule that really does sound like the paraphrase and a rule about retiring keys. Fourth, the code fails. Asked for `KROT-14`, the model prefers `KROT-13`, at 0.39 against 0.36 for the rule that contains the code. Its tokenizer splits a code into pieces such as `k`, `##rot`, `-`, and `14`, so two such codes share most of their input. That is why you keep the lexical lane. The last line shows the input limit at work: past 256 word pieces, the model stops reading, so a passage with its condition at the end gets the same vector as a passage with no condition at all.

One small model on a few sentences shows you direction and no more. A larger model may separate these better, so test yours on your own codes and paraphrases.

Dense search has its own failure modes, and they tend to be silent. A zero-length vector makes cosine undefined, and needs an explicit error. Upgrading the encoder without re-embedding your passages leaves you comparing vectors from two different spaces. Inconsistent normalization skews every score. Truncating a long passage before embedding can drop its deciding clause. So record the encoder and its preprocessing alongside your retrieval results, or you will have no way to investigate any of this later.

## Finding the nearest vectors without reading them all

Each search above compared one query with a handful of vectors. Now scale it up. At 384 numbers per passage and 4 bytes per number, a million passages take about 1.5 GB of memory, and one exact search reads all of it. On one core of a laptop, that took us from about 30 ms to about a tenth of a second per query, depending on what else the machine was doing. At 100 million passages, you need about 154 GB of memory and several seconds per query, which no interactive service can afford.

A vector index gives up the guarantee of finding the true nearest neighbors, in exchange for looking at a small fraction of the vectors. This is the approximate search from the last chapter, and ANN recall is how you measure what it gave up. Two designs cover most of what you will meet, and each one comes down to a simple idea.

**IVF**, the inverted file index, groups vectors into clusters ahead of time. A clustering algorithm places some number of centers, and each vector gets filed in a list under its nearest center. A query compares itself with the centers, then scans only the few lists whose centers are closest. It can miss a true neighbor that sits just across the border of a cell, in a list it did not scan.

**HNSW**, the hierarchical navigable small world graph, links each vector to a few of its neighbors ahead of time. The bottom layer holds every vector, and each layer above it holds fewer, so that its links cover longer distances.[^malkov2018] A query starts at the top and keeps hopping to whichever neighbor is closest, until no neighbor is closer. Then it drops a layer and repeats. On the bottom layer, it keeps a running list of the best vectors it has seen, and it explores their neighbors until that list stops improving. It can miss a true neighbor when the walk settles too soon in the wrong neighborhood.

<figure>
<img src="illustrations/_generated/vector_index_families_dark.png" alt="Two panels. In the IVF panel, a query sits in one of six clusters, close to the border with the next one. Scanning one list misses the true neighbor just across the border, and scanning two lists finds it. In the HNSW panel, a walk starts at the top of three layers of nodes, hops toward the query, drops a layer, hops again, and drops to the bottom layer, where it explores a small group of neighbors around the query." />
<figcaption>IVF narrows the search by place, and HNSW narrows it by walking from coarse to fine. Each has one setting that spends more time for better recall: how many lists to scan, or how many candidates to keep on the bottom layer. The drawing flattens both ideas to two dimensions and one axis.</figcaption>
</figure>

Both give you one knob that trades time for recall. In pgvector, those knobs are `ivfflat.probes` (default 1) and `hnsw.ef_search` (default 40).[^pgvector_docs] In Faiss, a widely used library of these indexes, they are `nprobe` and `efSearch`.[^faiss2026indexes]

To see what the knobs do, here is a run with Faiss. It needs no model download, and it runs offline once it is installed. The command below names the right package, which differs from the import, because the package called `faiss` has no build for current Python releases.

```text title="Install first"
pip install faiss-cpu==1.15.1 numpy==2.5.4
```

When you combine it with an embedding model, import PyTorch before Faiss on macOS to avoid shared-library conflicts. This listing makes 20,000 random clustered vectors of 128 dimensions to stand in for embeddings, finds the true top 10 for 500 queries with exact search, and counts what each setting recovers and how many vectors it had to score:

<!-- leetllm: test, output=show, deps=faiss-cpu==1.15.1,numpy==2.5.4 -->
```python title="ivf-and-hnsw.py"
import faiss
import numpy as np

faiss.omp_set_num_threads(1)
rng = np.random.default_rng(7)
SIZE, DIM, QUERIES, K, LISTS = 20_000, 128, 500, 10, 500
centers = rng.normal(size=(50, DIM))

def clustered(count):
    picks = rng.integers(0, len(centers), size=count)
    noise = rng.normal(scale=2.0, size=(count, DIM))
    vectors = (centers[picks] + noise).astype("float32")
    faiss.normalize_L2(vectors)
    return vectors

stored, queries = clustered(SIZE), clustered(QUERIES)
flat = faiss.IndexFlatIP(DIM)
flat.add(stored)
_, truth = flat.search(queries, K)

def recall(found):
    hits = sum(len(set(f) & set(t)) for f, t in zip(found, truth))
    return hits / (QUERIES * K)

ivf = faiss.IndexIVFFlat(
    faiss.IndexFlatIP(DIM), DIM, LISTS, faiss.METRIC_INNER_PRODUCT
)
ivf.train(stored)
ivf.add(stored)
for probes in (1, 2, 4, 8, 16, 32, 64):
    ivf.nprobe = probes
    faiss.cvar.indexIVF_stats.reset()
    _, found = ivf.search(queries, K)
    scored = faiss.cvar.indexIVF_stats.ndis / QUERIES + LISTS
    print(f"IVF  probes={probes:<3} recall={recall(found):.3f} "
          f"scored={scored:.0f}")

hnsw = faiss.IndexHNSWFlat(DIM, 16, faiss.METRIC_INNER_PRODUCT)
hnsw.add(stored)
for ef in (10, 20, 40, 80, 160, 320):
    hnsw.hnsw.efSearch = ef
    faiss.cvar.hnsw_stats.reset()
    _, found = hnsw.search(queries, K)
    scored = faiss.cvar.hnsw_stats.ndis / QUERIES
    print(f"HNSW ef={ef:<7} recall={recall(found):.3f} "
          f"scored={scored:.0f}")

print(f"exact: recall=1.000 scored={SIZE}")
for name, index in (("exact", flat), ("IVF", ivf), ("HNSW", hnsw)):
    size = faiss.serialize_index(index).size / 1e6
    print(f"{name} index: {size:.1f} MB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
IVF  probes=1   recall=0.246 scored=561
IVF  probes=2   recall=0.424 scored=619
IVF  probes=4   recall=0.671 scored=724
IVF  probes=8   recall=0.880 scored=873
IVF  probes=16  recall=0.935 scored=1149
IVF  probes=32  recall=0.958 scored=1772
IVF  probes=64  recall=0.978 scored=3039
HNSW ef=10      recall=0.653 scored=323
HNSW ef=20      recall=0.823 scored=449
HNSW ef=40      recall=0.914 scored=618
HNSW ef=80      recall=0.942 scored=878
HNSW ef=160     recall=0.960 scored=1444
HNSW ef=320     recall=0.981 scored=2923
exact: recall=1.000 scored=20000
exact index: 10.2 MB
IVF index: 10.7 MB
HNSW index: 13.1 MB
```
<!-- leetllm: output:end -->

The `scored` column counts every vector the query was compared with, including IVF's 500 centers. Exact search scores all 20,000. HNSW reaches a recall of 0.914 after scoring 618, about 3% of the vectors, while IVF needs 1,149 to get past 0.9. Both curves flatten, so the last few points of recall are the expensive ones: going from `ef=80` to `ef=320` more than triples the work for four more points of recall.

<figure>
<img src="illustrations/_generated/index_recall_tradeoff_dark.png" alt="A chart of recall at 10 against vectors scored per query on a logarithmic axis. The HNSW curve rises from 0.653 at 323 scored to 0.981 at 2,923. The IVF curve rises from 0.246 at 561 scored to 0.978 at 3,039, staying below HNSW until the two nearly meet. Exact search sits alone at recall 1.0 and 20,000 scored." />
<figcaption>The same run as a picture: each dot is one knob setting, measured on 20,000 random vectors. Turning a knob up moves you along a curve. Different data gives different curves, so measure on your own.</figcaption>
</figure>

Here is what each design costs you:

| | IVF | HNSW |
|---|---|---|
| Built by | Clustering, then filing each vector in a list | Inserting vectors one at a time into a layered graph |
| Knob at query time | `probes`: how many lists to scan | `ef_search`: how many candidates to keep |
| Knobs at build time | `lists` | `m`, `ef_construction` |
| Memory in our run | 10.7 MB, against 10.2 MB for the vectors alone | 13.1 MB, because it stores the links |
| Build time in our run | The faster to build | Several times as long |
| New data | Needs existing data to train its centers | Needs no training, and takes vectors one at a time |

pgvector's documentation draws the same line: HNSW has the better speed-recall tradeoff, and slower builds and more memory to pay for it. Deleting is harder than it looks too, since Faiss's HNSW cannot remove a vector at all, which is one more reason to carry tombstones outside the index.

Here is how I would choose. Start with no index, because exact search is the baseline you need anyway to measure ANN recall, and it may simply be fast enough: at a tenth of a second or less per million vectors on one core, it handles a hundred thousand in about 10 ms or less. When it gets too slow, use HNSW, as long as the graph fits in memory. Reach for IVF when memory or build time is the tighter limit, or when you rebuild in batches anyway. At hundreds of millions of vectors, you may need to compress them with product quantization, which stores a short code in place of each vector, or keep the graph on disk, as DiskANN does.[^faissGuidelines2026][^subramanya2019] In every case, turn the knob up until ANN recall stops improving on your own queries, then measure what that cost you in latency. And remember that the knob and the permission filter interact, which [retrieval security](/learn/enterprise-rag-security-rbac-access-control) takes up.

```checkpoint
An IVF index holds 1,000,000 vectors in 1,000 lists of about 1,000 each, with `probes` at 10. About how many vectors does one query score? You measure an ANN recall of 0.90 and you need 0.95. What do you change, and what will it cost?
---
It scores the 1,000 centers plus 10 lists of about 1,000, so about 11,000, or roughly 1% of the index. Raise `probes` and measure again. Going to 20 means about 21,000 vectors, nearly double the work, and since recall flattens as you go, you may need more than that. Leave the index itself alone until you have tried this, because changing `lists` means rebuilding it.
```

## Combining two lists that speak different languages

Now you have two ranked lists, and the obvious move is to add the scores. That is a trap. A BM25 score and a cosine similarity have different meanings and different ranges. Adding a BM25 score of 4 to a cosine of 1 does not make the lexical lane four times as convincing. It just means the numbers happened to be bigger.

Reciprocal Rank Fusion, or RRF, sidesteps the problem by ignoring scores entirely and using only positions.[^cormack2009] A document at rank $r$ in a list earns $1/(c+r)$ from that list, and its total is the sum across lists:

$$
\operatorname{RRF}(d)=\sum_{\ell:\,d\in L_\ell}\frac{1}{c+r_\ell(d)}.
$$

Ranks start at one, and a document missing from a list earns nothing from it. We use $c=60$ as our setting. A bigger constant shrinks the differences between nearby ranks, and any change to it needs testing on your task.

Here is the whole thing as one program: the analyzer, BM25, cosine on our hand-placed vectors, and fusion. Its input is the three records that already passed the permission check. Notice how the fused list picks up the dense lane when BM25 returns empty:

<!-- leetllm: test, output=show -->
```python title="reader-hybrid-lanes.py"
from collections import Counter, defaultdict
import math
import re

corpus = {
    "eu-key-rotation-v2-rule": (
        "Rule KROT-14. Stale service-account keys qualify for "
        "automated rotation up to 14 days after becoming stale, "
        "provided the risk signal is at most 48 hours old."
    ),
    "eu-session-timeout-v1-rule": (
        "Idle browser sessions expire after 30 days of inactivity."
    ),
    "eu-audit-rebuild-v1": (
        "Rebuild audit logs from the retained event archive."
    ),
}

def analyze(text):
    return re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)*", text.lower())

counts = {doc: Counter(analyze(text)) for doc, text in corpus.items()}
lengths = {doc: sum(terms.values()) for doc, terms in counts.items()}
average = sum(lengths.values()) / len(lengths)

def idf(term):
    n_t = sum(term in other for other in counts.values())
    return math.log(1 + (len(counts) - n_t + 0.5) / (n_t + 0.5))

def lexical(query):
    scores = {}
    for doc, terms in counts.items():
        score = 0.0
        for term in set(analyze(query)):
            f = terms[term]
            if not f:
                continue
            length = 0.25 + 0.75 * lengths[doc] / average
            score += idf(term) * f * 2.2 / (f + 1.2 * length)
        if score > 0:
            scores[doc] = score
    return sorted(scores, key=lambda doc: (-scores[doc], doc))

axes = ((1., 0., 0.), (0., 1., 0.), (0., 0., 1.))
vectors = dict(zip(corpus, axes))

def dense(query_vector):
    norm = math.sqrt(sum(x*x for x in query_vector))
    if norm == 0:
        raise ValueError("cosine needs a nonzero query vector")
    scores = {
        doc: sum(a*b for a, b in zip(query_vector, vector)) / norm
        for doc, vector in vectors.items()
    }
    return sorted((doc for doc in scores if scores[doc] > 0),
                  key=lambda doc: (-scores[doc], doc))

def fuse(lanes):
    scores = defaultdict(float)
    for lane in lanes:
        for rank, doc in enumerate(dict.fromkeys(lane), 1):
            scores[doc] += 1 / (60 + rank)
    return sorted(scores, key=lambda doc: (-scores[doc], doc))

exact = lexical("KROT-14")
paraphrase = lexical("refresh expired machine credential")
semantic = dense((0.98, 0.05, 0.0))
assert exact == ["eu-key-rotation-v2-rule"]
assert paraphrase == []
assert semantic[0] == "eu-key-rotation-v2-rule"
print("exact lexical:", exact)
print("paraphrase lexical:", paraphrase)
print("dense:", semantic)
print("fused:", fuse([paraphrase, semantic]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
exact lexical: ['eu-key-rotation-v2-rule']
paraphrase lexical: []
dense: ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule']
fused: ['eu-key-rotation-v2-rule', 'eu-session-timeout-v1-rule']
```
<!-- leetllm: output:end -->

This is hybrid search doing its job. BM25 finds the rule from `KROT-14`, and finds nothing for the paraphrase, because there is no vocabulary in common. The dense lane finds the rule from the paraphrase. Here the fused list is just the dense list, because the lexical lane found nothing for this query. That is the point: on a code the lexical lane can carry the rule, on a paraphrase the dense lane can, and your code never has to guess which kind of query arrived. Notice that the session policy also keeps second place, since reaching the fused list does not mean a passage deserves a place in the prompt. Deciding that takes a later stage.

There is an operational detail hiding in that `paraphrase lexical: []` line. An empty result from BM25 is a valid answer, and a timeout from the BM25 service is an outage. If you fall back to a single lane when one is down, record that fact and evaluate that degraded mode separately, or a real outage will look like a mild quality dip.

## How consensus can bury the right answer

RRF rewards documents that both lists agree on. Most of the time that is what you want. Sometimes, a passage that is moderately attractive to both lanes will beat the rule that only one lane found.

Here is a stress test, with two lists we wrote by hand to isolate this behavior:

| Rank | Lexical list | Dense list |
|---|---|---|
| 1 | Key rule | Audit-rebuild note |
| 2 | Session rule | Session rule |

Work out the scores. The session rule gets $1/62+1/62\approx0.03226$. Each first-place document, appearing on one list only, gets $1/61\approx0.01639$. So the session rule wins outright, despite being first on neither list. The other two tie, and our ascending-ID tie-break puts `eu-audit-rebuild-v1` second and `eu-key-rotation-v2-rule` third. Now suppose you keep only the top two. The one rule the caller needs has been lost.

<figure>
<img src="illustrations/_generated/rank_fusion_dark.png" alt="BM25 ranks the key rule first and the session rule second. The dense list ranks the audit note first and the session rule second. Reciprocal rank fusion gives the session rule two rank-two contributions totaling 0.03226. The audit note and the required key rule each get one rank-one contribution of 0.01639, and ascending ID breaks their tie, so a top-two cutoff drops the key rule." />
<figcaption>Two second-place votes beat a single first place. The tie-break then pushes the key rule to third, below a two-candidate cutoff, so a passage present in the union never reaches the next stage.</figcaption>
</figure>

As an exercise, redo this with $c=1$. The session rule still wins: its two contributions total $2/3$, and each singleton gets $1/2$. Changing the constant does not rescue you here. Then keep three candidates in place of two. The key rule survives to the next stage, but a two-passage context can still exclude it if nothing changes the order.

This tells you how to debug. Measure the target at three points: each lane's results, their union, and the retained fused list. If the rule is absent from both lanes, fusion cannot help. If it is in the union and lost at the fused cutoff, then a larger context budget changes nothing unless you also pass more candidates forward.

Two small rules prevent self-inflicted damage. Deduplicate within a lane before counting votes, so that a chunk appearing in two rows does not vote twice. Be careful about deduplicating across document versions, since different revisions may say different things, so settle which version applies before fusion runs.

## When the shortlist repeats itself

Fusion has no idea when two passages say the same thing. If a paragraph was copied into three documents, or two chunks overlap heavily, all of them can rank well and fill the prompt with one idea. Carbonell and Goldstein's maximal marginal relevance is the classic response.[^carbonell1998] It picks passages one at a time, rewarding each for being close to the question and penalizing it for being close to something already picked:

$$
\operatorname{MMR}(d)=\lambda\,\operatorname{sim}(d,q)-(1-\lambda)\max_{s\in S}\operatorname{sim}(d,s),
$$

where $S$ is the set selected so far. At $\lambda=1$ the penalty disappears and you have a plain ranking. Lowering $\lambda$ trades relevance for variety. Here it is on our query, with a near copy of the key rule added to the vectors. At $\lambda=0.5$, MMR balances proximity against redundancy.

<!-- leetllm: test, output=show, id=reader-hybrid-mmr -->
```python title="maximal-marginal-relevance.py"
from math import sqrt

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sqrt(sum(x * x for x in a))
    return dot / (norm_a * sqrt(sum(y * y for y in b)))

def mmr(query, vectors, k, weight):
    selected = []
    def score(name):
        vector = vectors[name]
        relevance = cosine(vector, query)
        seen = [cosine(vector, vectors[s]) for s in selected]
        redundancy = max(seen, default=0.0)
        return weight * relevance - (1 - weight) * redundancy
    while len(selected) < min(k, len(vectors)):
        remaining = sorted(set(vectors) - set(selected))
        selected.append(max(remaining, key=score))
    return selected

query = (0.98, 0.05)
vectors = {
    "key rule": (1.00, 0.00),
    "key rule copy": (0.99, 0.02),
    "session rule": (0.00, 1.00),
}
print("lambda 1.0:", mmr(query, vectors, 2, 1.0))
print("lambda 0.5:", mmr(query, vectors, 2, 0.5))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
lambda 1.0: ['key rule copy', 'key rule']
lambda 0.5: ['key rule copy', 'session rule']
```
<!-- leetllm: output:end -->

It removed a duplicate, as promised, and look at which one. The copy sits a hair closer to the query, so the original rule is the one that went. In a system that cites sources, that can keep an unofficial copy and drop the governing document. Then it filled the slot with the session rule, which has nothing to do with the user's question. Diversity is a property of the list, so to know whether the answer got better, you still have to evaluate the answer. For a narrow question like this one, drop the copy by source ID or by verified equal content, and leave the slot empty. MMR earns its place on questions that really need several different policies, and even there you should check that every required rule survives. It also works only on the pool it is given, so it can never bring back a passage retrieval missed.

## Too many things are called top-k

A hybrid pipeline has at least three different sizes: how deep each lane searches, how many fused candidates you keep, and how many passages reach the model. Add a reranker in the next chapter, and you have a fourth. Calling all of these "top-$k$" makes failure reports impossible to read, so give each one its own name in your configuration and your traces.

To choose their values, build a frozen set of queries containing exact codes, ordinary paraphrases, look-alike distractors, questions with no answer, and permission tests. Label the passage each answerable question needs. Then compare lexical only, dense only, and hybrid at the same point in the pipeline, with the caller and the document snapshot held fixed.

Look at each query family separately. A gain on paraphrases can hide a loss on rare identifiers, and a better overall recall can hide a leak of forbidden sources, which needs its own safety check entirely. If a question has no answer under the caller's permissions, returning more candidates is no success at all.

Deeper search has a cost in search time, data transfer, and downstream scoring. When two lanes run in parallel, the slower one tends to set your latency, with fusion and coordination on top. Per-stage budgets will also fool you. Say permissions take 10 ms, the lanes take 12 and 40 ms in parallel, and fusion takes 8 ms. The request has spent 58 ms, and a 50 ms overall limit is gone even if each stage met its own. Per-stage p95 values do not add up to an end-to-end p95 either, so measure the request's real latency distribution under load, including what happens when one lane stalls.

You may eventually want weighted score fusion, and there is good reason to try it. Bruch, Gai, and Ingber found that a tuned convex combination of normalized scores outperformed RRF in their experiments, including out-of-domain tests.[^bruch2023fusion] The formula is a weighted sum, $\alpha\tilde{s}_{\text{dense}}+(1-\alpha)\tilde{s}_{\text{lexical}}$, so normalized scores of 0.8 and 0.2 give 0.62 at $\alpha=0.7$. Resist reading that 0.7 as "the dense lane controls 70% of the ranking," since which lane decides a comparison depends on how far apart the two candidates' scores are.

This method asks more of you. It takes an explicit procedure to normalize or calibrate the scores, weights tuned on development data, and evaluation on cases you held back. Min-max scaling per query is sensitive to a single outlier, it can shift when a deeper pool moves its endpoints, and it divides by zero when every score in a lane is the same. Compare both on your own data, and keep RRF as the baseline any fancier method has to beat.

## Fix the stage that lost the rule

Suppose a deployment returns the session policy for the user's rotation question. Your trace points to one of three repairs. If the analyzer stripped `KROT-14`, fix the analysis and rebuild that part of the index. If the dense encoder missed the paraphrase, examine the model, its inputs, and how deep the lane searches. If the rule reached the union and fell below the fused cutoff, keep more candidates or improve their order.

Resist the urge to change all three at once. Hold the document snapshot, the caller's policy, and the other ranking settings fixed, and change one thing, so you know what helped. Record the improvement along with any new failures it caused. Fixing one exposed example tells you that example works. A claim about your system as a whole takes representative evaluation.

If you are building this now, start with BM25 and one dense lane over the same permitted set, combine them with RRF, keep the three sizes separate, and test exact identifiers from day one. They are the queries most likely to fail silently once you move to embeddings.

That leaves the problem from our stress test. The right rule made it into the candidate pool at third place, but the model takes only two passages. No amount of further recall will fix that, because the problem is now the order. [Reranking](/learn/reranking-cross-encoders-rag) adds a second, more careful scorer that reads the question and each candidate together, before you spend your limited context on them.

<!-- leetllm: edition:reader:end -->
