---
{
  "id": "advanced-rag-query-rewriting-self-rag",
  "title": "Advanced RAG: HyDE & Self-RAG",
  "slug": "advanced-rag-query-rewriting-self-rag",
  "category": "RAG & Retrieval",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/self_rag_loop_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic",
    "Microsoft",
    "Perplexity"
  ],
  "shortDescription": "A fast vector index still misses what a user means when the query is vague or phrased differently from the corpus. Learn query rewriting, HyDE, Self-RAG, and CRAG, then weigh their latency and accuracy trade-offs.",
  "keyConceptsTested": [
    "Query rewriting",
    "Multi-query expansion",
    "Query decomposition",
    "Step-back prompting",
    "HyDE (Hypothetical Document Embeddings)",
    "Self-RAG reflection tokens",
    "Corrective RAG (CRAG)",
    "Knowledge refinement",
    "Adaptive retrieval",
    "Prompt injection in rewrite history",
    "Tenant-safe rewrite and HyDE caches"
  ],
  "section": "Advanced Agents & Retrieval",
  "order": 2,
  "prerequisites": [
    "vector-database-internals-hnsw-ivf",
    "design-production-rag-pipeline",
    "core-retrieval-algorithms"
  ],
  "relatedQuestions": [
    "graphrag-knowledge-graphs-vector-search",
    "design-production-rag-pipeline",
    "agent-memory-persistence-patterns",
    "agent-failure-states-retry-fallback"
  ]
}
---

A developer asks an API documentation assistant, "Why did our batch embedding job hit an HTTP 429?" After reading the reply, they follow up with, "What about the synchronous one?" If the retriever embeds that second message alone, it searches for `"What about the synchronous one?"`. The <span data-glossary="hnsw">HNSW</span> graph returns nearest neighbors in 4 milliseconds: generic SDK overviews that miss synchronous rate limits completely.

The index worked fine; the query vector aimed at the wrong neighborhood. The previous chapter built fast HNSW and <span data-glossary="ivf">IVF</span> indexes; this chapter handles queries that omit context, clash with corpus vocabulary, demand multiple facts, or pull back unsupportive passages. We trace one API docs assistant through four repair families: query transforms, HyDE, Self-RAG, and CRAG.

## Why naive RAG misses

Single-shot <span data-glossary="rag">RAG</span> embeds the latest user message, pulls <span data-glossary="top-k">top-k</span> chunks from a <span data-glossary="vector">vector</span> index, and generates. Misses cluster into four failure modes:

1. **Missing conversational context:** "What about the synchronous one?" needs the prior turn's rate-limit subject.
2. **Query-document style mismatch:** Informal questions ("Can we push more traffic during launch week?") use different vocabulary from formal docs ("Temporary tokens-per-minute quota increases require approval").
3. **Noisy retrieval:** Chunk boundaries or tight <span data-glossary="ann-search">ANN</span> settings rank an SDK install guide above quota rules.
4. **Unnecessary retrieval:** Searching on greetings or self-contained arithmetic wastes latency and prompt <span data-glossary="token">tokens</span>.

Measure which miss actually appears in logs before adding complexity.

## Query rewriting and decomposition

Four lightweight transforms run *before* search: rewriting restores chat context, expansion widens vocabulary, decomposition splits multi-fact requests, and step-back prompting pairs a concrete error with its governing rule.

<figure>
  <img src="illustrations/_generated/query_rewrite_dark.png" alt="Known endpoint names let independent embedding API searches run in parallel and merge while flagging missing evidence. Finding the highest-error endpoint first creates a dependency so the circuit-breaker search runs second." />
  <figcaption>Independent sub-queries run in parallel when every entity is known. Dependent lookups run sequentially and preserve missing-evidence signals.</figcaption>
</figure>

### 1. Conversational query rewriting

**Rewrite-Retrieve-Read** places a rewriter ahead of a frozen retriever and reader.[^ma2023] Given Turn 1 (*"Why did our batch embedding job hit an HTTP 429?"*) and Turn 2 (*"What about the synchronous one?"*), the rewriter emits `"What are the HTTP 429 rate limits for the synchronous embedding endpoint?"`. Keep the raw message for answer generation so tone stays natural, and send the rewritten string to retrieval. Treat prior retrieved text in history as untrusted data: restrict the rewriter strictly to disambiguation, strip secrets, and enforce caller <span data-glossary="acl">ACLs</span> outside the rewriter ([RAG Security & Access Control](/learn/design-production-rag-pipeline)).

### 2. Multi-query expansion and Reciprocal Rank Fusion

When one phrasing misses target pages, **multi-query expansion** generates 2 to 4 variants, searches them in parallel, and merges ranked lists. Because cosine similarities across different queries and unbounded BM25 scores are not on one comparable scale, **RAG-Fusion** merges lists via **<span data-glossary="reciprocal-rank-fusion">Reciprocal Rank Fusion (RRF)</span>**:[^rackauckas2024][^cormack2009]

$$
\text{RRF\_Score}(d) = \sum_{r \in R} \frac{1}{k + r(d)}
$$

Here $r(d)$ is document $d$'s 1-based rank in list $r$, and $k = 60$ damps rank swings.[^cormack2009] At $k = 0$, rank 1 scores $1.0$ vs. $0.5$ for rank 2; at $k = 60$, rank 1 scores $1/61 \approx 0.01639$ vs. $1/62 \approx 0.01613$ (a 1.6% gap), rewarding passages that appear consistently near the top across phrasings. Keep the original query alongside capped, non-duplicate variants so near-identical rewrites do not double-count hits:

<!-- leetllm: test, output=show -->
```python title="fuse-query-variants-with-rrf.py"
import re


def clean_variants(raw_lines: str, fallback: str, max_n: int = 3) -> list[str]:
    cleaned = [re.sub(r"^(?:[-*]|\d+[.)])\s+", "", s.strip()).strip() for s in raw_lines.splitlines()]
    return list(dict.fromkeys(x for x in cleaned if x))[:max_n] or [fallback]


def rrf(rankings: list[list[str]], k: int = 60) -> list[tuple[str, float]]:
    scores: dict[str, float] = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(dict.fromkeys(ranking), start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda pair: (-pair[1], pair[0]))


raw = "1. Rate-limit burst limits during launch traffic\n2. Queue backpressure controls\n3. Autoscaling for traffic spikes"
print("variants:", clean_variants(raw, "How do we handle peak traffic throttling?"))
ranked = [
    ["rate-limit-guide", "quota-increase", "autoscaling"],
    ["autoscaling", "rate-limit-guide", "backpressure"],
    ["rate-limit-guide", "batch-api", "autoscaling"],
]
for doc_id, score in rrf(ranked)[:3]:
    print(f"{doc_id}: {score:.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
variants: ['Rate-limit burst limits during launch traffic', 'Queue backpressure controls', 'Autoscaling for traffic spikes']
rate-limit-guide: 0.0489
autoscaling: 0.0481
batch-api: 0.0161
```
<!-- leetllm: output:end -->

### 3. Query decomposition and step-back prompting

Some requests span multiple pages at once: *"Compare synchronous and batch embedding API latency, limits, and retry behavior."* No single chunk holds all six cells of that comparison, so one vector query returns partial facts and tempts the generator to invent the missing ones. **Query decomposition** breaks the request into focused sub-queries:

1. "What latency does the synchronous embedding endpoint target?"
2. "What throughput and completion limits apply to the batch embedding endpoint?"
3. "What retry behavior applies to each endpoint?"

Execution follows two topologies: **parallel scatter-gather** when every entity is already known (taking $\max(T_1, \dots, T_n)$ plus planning and synthesis), or **sequential least-to-most chains** when a later hop depends on an earlier result (*"Find the endpoint with the highest error rate last week, then fetch its circuit-breaker settings"*).[^zhou2022b] Whenever a sub-query returns nothing, pass that missing-evidence marker explicitly to the synthesizer so it reports the gap instead of fabricating a plausible answer.

When narrow runtime details obscure the underlying rule, **step-back prompting** abstracts the concrete question into its governing concept and retrieves *both* queries together:[^zheng2023stepback]

- **Specific query:** "Why did our client hit HTTP 429 at 120 requests/minute on the tier 2 embedding endpoint?"
- **Step-back query:** "What are the rate limits, burst thresholds, and quota rules for tier 2 embedding endpoints?"

Searching both queries preserves the concrete error context while pulling in the foundational quota rules.

```checkpoint
When should you rewrite a query instead of searching the raw user message?
---
Rewrite when chat history holds a missing referent ("the synchronous one"). Expand for vocabulary gaps, decompose multi-fact comparisons, and step back when a specific error needs its governing rule.
```

## HyDE (Hypothetical Document Embeddings)

All four transforms still search with a *question*. <span data-glossary="hyde">HyDE (Hypothetical Document Embeddings)</span> bridges question-vs-document asymmetry in <span data-glossary="dense-retrieval">dense retrieval</span> in three steps:[^gao2022]

1. **Generate:** Prompt an instruction-tuned LLM zero-shot to draft $N$ hypothetical answer passages.
2. **Embed:** Encode each hypothetical passage $\hat{d}_k$ with the corpus *document encoder* $f$ and average the vectors:

$$
\hat{\mathbf{v}}_q = \frac{1}{N}\sum_{k=1}^{N} f(\hat{d}_k)
$$

3. **Retrieve:** Search with $\hat{\mathbf{v}}_q$ (normalized for cosine similarity), discard the hypothetical text, and pass only *real retrieved passages* to the generator.

Even when the hypothetical draft invents details, the dense encoder bottleneck preserves topical geometry.[^gao2022] On TREC DL19 with InstructGPT + Contriever, HyDE lifted <span data-glossary="ndcg">nDCG</span>@10 from 44.5 to 61.3, and on DL20 from 42.1 to 57.9, with similar zero-shot gains on BEIR and Mr. TyDi.[^gao2022]

<figure>
  <img src="illustrations/_generated/hyde_flow_dark.png" alt="Three search inputs scored against three chunks: raw question recalls 1 of 2 required chunks, useful HyDE proxy recalls both, and drifting proxy drops back to 1 of 2." />
  <figcaption>A document-style proxy recovers both the quota and batch guides, whereas a drifting proxy pulls retrieval back to generic overviews.</figcaption>
</figure>

**Watch for hallucination drift:** HyDE hurts on exact identifiers (error codes like `E-9410`, dates, CVE numbers, commit hashes, prices) because a fabricated proxy drags search toward the wrong subsystem. Route exact-identifier lookups straight to hybrid dense + sparse search:

<!-- leetllm: test, output=show -->
```python title="hyde-search-and-exact-router.py"
import re
import numpy as np

EXACT_LOOKUP = re.compile(r"\b(?:[A-Z]+-\d+|(?:HTTP|error)\s+[A-Z0-9-]+|\d{4}-\d{2}-\d{2})\b|[$€£]\s*\d", re.I)


def tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9-]+", text.lower()))


chunks = [
    ("generic-embeddings", "The embedding API converts text into vectors for search."),
    ("throughput-quota", "Launch traffic needs a temporary tokens-per-minute quota request and approval."),
    ("batch-embeddings", "Batch embedding jobs support offline workloads with retry backoff."),
]
required = {"throughput-quota", "batch-embeddings"}
cases = [
    ("raw question", "Can we increase embedding throughput during a launch week?"),
    ("useful proxy", "Embedding throughput increases need a temporary tokens-per-minute quota request, batch embedding jobs, and retry backoff."),
    ("drifting proxy", "The embedding API converts text into vectors for search."),
]
for label, text in cases:
    q = tokens(text)
    hits = [cid for cid, body in sorted(chunks, key=lambda c: len(q & tokens(c[1])), reverse=True)[:2]]
    print(f"{label:14s}: {hits} | Recall@2={len(required & set(hits)) / len(required):.1f}")

print("mean proxy vec:", np.round(np.array([[0.2, 0.8, 0.1], [0.4, 0.6, 0.3]]).mean(axis=0), 2).tolist())
for q in ["What caused error E-9410?", "How should we plan embedding throughput for launch traffic?"]:
    print(f"{'hybrid_exact' if EXACT_LOOKUP.search(q) else 'hyde_candidate':14s}: {q}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw question  : ['throughput-quota', 'generic-embeddings'] | Recall@2=0.5
useful proxy  : ['throughput-quota', 'batch-embeddings'] | Recall@2=1.0
drifting proxy: ['generic-embeddings', 'batch-embeddings'] | Recall@2=0.5
mean proxy vec: [0.3, 0.7, 0.2]
hybrid_exact  : What caused error E-9410?
hyde_candidate: How should we plan embedding throughput for launch traffic?
```
<!-- leetllm: output:end -->

## Self-RAG (Self-reflective RAG)

<span data-glossary="self-rag">Self-RAG</span> fine-tunes the generator itself to emit four **reflection token** families during autoregressive decoding:[^asai2023]

1. **`Retrieve`** (`Yes`, `No`, `Continue`): skips search on self-contained turns or triggers on-demand lookup before a segment.
2. **`ISREL`** (`Relevant`, `Irrelevant`): rates passage relevance before drafting from it.
3. **`ISSUP`** (`Fully`, `Partially`, `No support`): checks whether the passage entails the draft segment.
4. **`ISUSE`** (`1` through `5`): rates usefulness, mapped linearly onto $[-1, 1]$.

Trace our launch-week throughput question through one Self-RAG step:

1. `[Retrieve=Yes]` -> fetch candidate passages from the index.
2. Retrieved passage: *"Temporary tokens-per-minute (TPM) increases require approval. Clients must use exponential backoff after rate-limit errors."*
3. `[ISREL=Relevant]` -> passage directly addresses the launch-week quota question.
4. Candidate segment: *"For launch traffic, request a temporary TPM increase and keep exponential backoff enabled."*
5. `[ISSUP=Fully Supported]` -> every claim in the segment is entailed by the passage.
6. `[ISUSE=4]` -> direct, actionable answer.

When the model emits `[Retrieve=Yes]`, Self-RAG decodes one continuation per top-$k$ passage in parallel and ranks branches via segment-level <span data-glossary="beam-search">beam search</span> (default width 2):[^asai2023]

$$
\text{Score}(y_t, d) = L(y_t, d) + w_{\text{rel}} s_{\text{rel}} + w_{\text{sup}} s_{\text{sup}} + w_{\text{use}} s_{\text{use}}
$$

Normalized within each family: $s_{\text{rel}} = \frac{p_R}{p_R + p_I}$, $s_{\text{sup}} = \frac{p_F + 0.5\,p_P}{p_F + p_P + p_N}$, and $s_{\text{use}} = \frac{\sum_{i=1}^5 a_i p_i}{\sum_{i=1}^5 p_i}$ with $a = [-1, -0.5, 0, 0.5, 1]$. Because $s_{\text{use}}$ can be negative or zero, critique terms add linearly rather than inside a log.[^asai2023] Raising $w_{\text{sup}}$ favors strict grounding over fluent speculation.[^selfRagInference2026]

<figure>
  <img src="illustrations/_generated/self_rag_loop_dark.png" alt="Candidate A follows the retrieved approval clause and totals 0.922 from weighted relevance 0.184, support 0.576, and utility 0.162. Candidate B claims unlimited launch traffic and totals 0.534." />
  <figcaption>With weights (0.2, 0.6, 0.2) and equal generation likelihood, Candidate A's support score outweighs Candidate B's edge in relevance and utility.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="score-self-rag-branches.py"
import numpy as np


def family_score(probs: list[float], weights: list[float]) -> float:
    p, w = np.asarray(probs, dtype=np.float64), np.asarray(weights, dtype=np.float64)
    return float(np.dot(p, w) / np.sum(p))


def critique_score(rel: list[float], sup: list[float], use: list[float]) -> float:
    return (
        0.2 * family_score(rel, [1.0, 0.0])
        + 0.6 * family_score(sup, [1.0, 0.5, 0.0])
        + 0.2 * family_score(use, [-1.0, -0.5, 0.0, 0.5, 1.0])
    )


branches = [
    ("temporary TPM increase requires approval", [0.92, 0.08], [0.94, 0.04, 0.02], [0.01, 0.02, 0.04, 0.20, 0.73]),
    ("all launch traffic is unlimited", [0.95, 0.05], [0.20, 0.16, 0.64], [0.0, 0.0, 0.04, 0.16, 0.80]),
]
scored = [(critique_score(r, s, u), text) for text, r, s, u in branches]
for score, text in scored:
    print(f"{score:.3f} | {text}")
best_score, best_text = max(scored)
print(f"winner: {best_text} ({best_score:.3f})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
0.922 | temporary TPM increase requires approval
0.534 | all launch traffic is unlimited
winner: temporary TPM increase requires approval (0.922)
```
<!-- leetllm: output:end -->

Distinguish **true Self-RAG** (a fine-tuned generator emitting reflection tokens inline[^asai2023]) from a **prompted critique loop** (application code calling an off-the-shelf LLM to grade passages and drafts). Prompted loops work immediately with frontier APIs; trained reflection tokens skip extra round-trips at the cost of hosting a custom model.

## CRAG (Corrective RAG)

<span data-glossary="corrective-rag">CRAG</span> requires no generator retraining: a lightweight **retrieval evaluator** (fine-tuned T5-large in Yan et al.) scores each retrieved document and routes the set by its **maximum score**:[^yan2024]

1. **Correct ($\max \text{score} > \delta_U$):** Refine surviving internal documents and generate.
2. **Incorrect ($\max \text{score} < \delta_L$):** Discard internal hits and fall back to external search (or refuse if external search is disallowed).
3. **Ambiguous ($\delta_L \le \max \text{score} \le \delta_U$):** Refine internal hits, fetch external evidence, and merge both.

<figure>
  <img src="illustrations/_generated/crag_evaluator_dark.png" alt="Maximum document score on a 0 to 1 scale picks CRAG route: 0.17 is Incorrect (<0.2), 0.45 is Ambiguous (0.2 to 0.7), and 0.81 is Correct (>0.7)." />
  <figcaption>Thresholds 0.2 and 0.7 route retrieval from the highest document score. External fallback still requires explicit permission before leaving private data.</figcaption>
</figure>

Before generation, CRAG runs **decompose-then-recompose**: split surviving passages into 1-to-3-sentence strips, drop strips below threshold $\beta$, and recompose survivors in original order to cut boilerplate noise.[^yan2024]

> **Common mistake:** Enabling open-web fallback on private corpora. Sending a confidential query to a public search API on an `Incorrect` score leaks private data and cannot recover internal docs. Restrict web fallback to explicitly approved public queries on allowlisted domains, and refuse when internal evidence is missing.

<!-- leetllm: test, output=show -->
```python title="crag-router-and-refinement.py"
import numpy as np


def crag_route(scores: list[float], lower: float = 0.2, upper: float = 0.7) -> str:
    if not scores:
        return "incorrect"
    best = float(np.max(scores))
    return "correct" if best > upper else ("incorrect" if best < lower else "ambiguous")


def refine_strips(docs: list[tuple[str, str]], keywords: set[str], limit: int = 6) -> list[tuple[str, str]]:
    kept = []
    for src, text in docs:
        for sent in (s.strip() for s in text.split(".")):
            if sent and (keywords & set(sent.lower().split())):
                kept.append((src, sent))
    return kept[:limit]


def run_crag(internal_docs, scores, public_docs, approved_public_query: str | None = None):
    kw = {"quota", "tpm", "backoff"}
    route = crag_route(scores)
    ctx = refine_strips(internal_docs, kw) if route != "incorrect" else []
    if route != "correct":
        if not approved_public_query:
            return "needs_internal_evidence", ctx
        ext = refine_strips(public_docs, kw)
        ctx = ctx[:3] + ext[:3] if ctx and ext else ctx + ext
    return ("ready" if ctx else "no_evidence"), ctx[:6]


internal = [("internal:quota-v3", "TPM increases need approval. Old SDK install notes.")]
public = [("public:retry-v2", "Use exponential backoff after rate limits.")]
for label, scores in [("strong", [0.81, 0.15]), ("weak", [0.10, 0.17]), ("uncertain", [0.45, 0.09])]:
    status, ctx = run_crag(internal, scores, public, approved_public_query="public retry guide")
    print(f"{label:9s} ({crag_route(scores):9s}) -> {status}: {[s for s, _ in ctx]}")
print("private missing      ->", run_crag([], [], public, approved_public_query=None))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
strong    (correct  ) -> ready: ['internal:quota-v3']
weak      (incorrect) -> ready: ['public:retry-v2']
uncertain (ambiguous) -> ready: ['internal:quota-v3', 'public:retry-v2']
private missing      -> ('needs_internal_evidence', [])
```
<!-- leetllm: output:end -->

Note that keyword strip filtering checks topic overlap rather than negation (`"No TPM increase is permitted"` matches `"tpm"` too); trained evaluators or <span data-glossary="reranker">cross-encoder rerankers</span> handle polarity reliably.

## Iterative retrieval, latency waterfalls, and failure modes

Self-RAG and CRAG still center on a single retrieval pass or one fallback step. When hop 2 depends on what hop 1 uncovers (*"Which embedding endpoint had the highest <span data-glossary="p95-latency">p95 latency</span> last week, and what retry budget applies to it?"*), **IRCoT** (Interleaving Retrieval with Chain-of-Thought) alternates retrieval and reasoning one hop at a time until the evidence chain is complete.[^trivedi2022] If hop 1 returns ambiguous metrics, stop and surface the ambiguity rather than guessing an endpoint name.

```checkpoint
A question needs two facts where the second cannot be searched until the first resolves. Why does naive RAG miss, and what replaces it?
---
Naive RAG executes a single search pass, so it cannot feed hop 1's discovered entity into hop 2's query. Iterative or agentic retrieval (such as IRCoT) interleaves search and reasoning so each hop guides the next.
```

Pick the lightest tier that resolves your measured failure:

| Feature | Naive RAG | HyDE | Self-RAG | CRAG |
| :--- | :--- | :--- | :--- | :--- |
| **When retrieval runs** | Always | Always | Dynamic (`[Retrieve]`) | Always |
| **Search input** | Raw query | Hypothetical passage | Raw query + partial draft | Raw query |
| **Quality check** | None | None (shifts query vector) | Inline reflection tokens | Separate retrieval evaluator |
| **Extra training** | None | None | Fine-tuned generator | Fine-tuned evaluator |
| **Best fit** | Direct single-fact lookups | Vocabulary/style mismatch | Strict-grounding custom serving | Uneven internal recall |
| **Added work per turn** | None | Proxy LLM call + embedding | On-demand retrieval + branching | Evaluator + strip filter (+ web) |

Every rewrite, proxy generation, or evaluator call extends **time to first token (TTFT)**. Suppose an uncached serial rewrite-plus-rerank pipeline spends 120 ms rewriting, 20 ms embedding, 25 ms searching, 50 ms reranking, and 180 ms until the generator emits its first token: 395 ms total TTFT. Never estimate end-to-end p95 by summing per-stage p95s: because stalls in Stage A and Stage B land on *different* requests, sum durations per request first, then take the percentile:

<!-- leetllm: test, output=show -->
```python title="percentiles-from-joint-request-traces.py"
from math import ceil
import numpy as np


def nearest_rank(values: np.ndarray, p: float) -> int:
    return int(np.sort(values)[ceil(p * len(values)) - 1])


traces = [(10, 10)] * 18 + [(100, 10), (10, 100)]
a, b = np.array([x for x, _ in traces]), np.array([y for _, y in traces])
print(f"sum of stage p95s:     {nearest_rank(a, 0.95) + nearest_rank(b, 0.95)} ms")
print(f"p95 of request totals: {nearest_rank(a + b, 0.95)} ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sum of stage p95s:     20 ms
p95 of request totals: 110 ms
```
<!-- leetllm: output:end -->

Parallel fan-out amplifies tail latency too: three independent searches that each clear 25 ms with probability $0.95$ all finish within 25 ms only $0.95^3 \approx 85.7\%$ of the time, pushing 14.3% past 25 ms.

Guard five production failure modes:

1. **Prompt injection in rewrite history:** Treat retrieved chunks and tool outputs strictly as data and enforce ACLs at the retriever.
2. **Cross-tenant cache bleed:** Key rewrite and HyDE caches by `(tenant, scope, permission_version, history_digest, normalized_query, technique, model_version)` and recheck permissions on hits.
3. **SSRF on web fallback:** Allowlist public domains, block private IPs, isolate fetches in a network <span data-glossary="sandbox">sandbox</span>, and require citations to stop <span data-glossary="ssrf">SSRF</span> and injected pages.
4. **Unbounded fan-out:** Enforce hard per-request caps on variants, sub-queries, web fetches, and <span data-glossary="token-budget">token budgets</span>.
5. **Stacking stages blindly:** Start with hybrid search + reranker; add HyDE, CRAG, or iterative loops only when held-out accuracy improves inside your end-to-end p95 budget.

```mastery-quiz
[
  {
    "question": "A developer reports a failed batch job, then asks, \"How can I retry it?\" The retriever sees only the rewritten string. Which rewrite preserves intent and security?",
    "options": [
      "Use relevant history to form a standalone failed-batch retry query while preserving the caller's ACL scope.",
      "Expand the raw turn into synonyms while dropping history so injected text cannot enter search.",
      "Generate a HyDE proxy from the raw turn and let embeddings recover the missing referent.",
      "Search the raw turn with a larger top-k so the generator infers the prior event."
    ],
    "answer": "Use relevant history to form a standalone failed-batch retry query while preserving the caller's ACL scope.",
    "explanation": "History supplies the missing referent. Rewriting into a standalone query fixes retrieval while keeping ACL checks outside the rewriter."
  },
  {
    "question": "Three query variants rank sources as [quota, batch, overview], [batch, overview, quota], and [batch, quota, overview] (best first). RRF adds 1/(40 + rank) starting at rank 1. Which source wins and with what score to five decimals?",
    "options": [
      "quota, 0.02439",
      "batch, 0.07259",
      "quota, 0.07317",
      "batch, 0.07439"
    ],
    "answer": "batch, 0.07259",
    "explanation": "Batch ranks 2nd, 1st, and 1st: 1/42 + 2/41 = 0.07259. Quota scores 1/41 + 1/43 + 1/42 = 0.07146."
  },
  {
    "question": "Two Self-RAG branches share equal generation likelihood. Their normalized (relevance, support, utility) scores are [0.8, 0.9, 0.4] for A and [0.9, 0.3, 0.8] for B, with weights (0.2, 0.6, 0.2). Which branch wins?",
    "options": [
      "B with 0.76",
      "A with 0.78",
      "B with 0.34",
      "A with 0.70"
    ],
    "answer": "A with 0.78",
    "explanation": "A scores 0.16 + 0.54 + 0.08 = 0.78 vs. B's 0.18 + 0.18 + 0.16 = 0.52."
  },
  {
    "question": "CRAG marks internal retrieval Incorrect for a private internal question. Which fallback design prevents data leaks and SSRF?",
    "options": [
      "Allow arbitrary HTTPS fetches after stripping script tags from page HTML.",
      "Search the open web broadly and let the evaluator judge private-network pages.",
      "Block private-query export; allow web fallback only for approved public queries with domain and network allowlists.",
      "Skip citation checks on fallback pages because the evaluator already scored them."
    ],
    "answer": "Block private-query export; allow web fallback only for approved public queries with domain and network allowlists.",
    "explanation": "Low internal scores never justify exporting private questions to public search engines, and approved public fetches still require SSRF controls."
  },
  {
    "question": "Twenty-four serial requests take (20, 20) ms twenty-two times, (150, 20) once, and (20, 150) once. Each stage's nearest-rank p95 is 20 ms. What is the end-to-end p95?",
    "options": [
      "40 ms",
      "300 ms",
      "170 ms",
      "150 ms"
    ],
    "answer": "170 ms",
    "explanation": "Per-request totals are twenty-two 40 ms values and two 170 ms values. Rank ceil(0.95 * 24) = 23 is 170 ms."
  }
]
```

> **Next:** Continue to [GraphRAG & Knowledge Graphs](/learn/graphrag-knowledge-graphs-vector-search).
