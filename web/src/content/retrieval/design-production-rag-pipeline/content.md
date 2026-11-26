---
{
  "id": "design-production-rag-pipeline",
  "title": "Production RAG Pipelines",
  "slug": "design-production-rag-pipeline",
  "category": "RAG & Retrieval",
  "difficulty": "Medium",
  "coverImage": "illustrations/_generated/rag_pipeline_dark.png",
  "companies": [
    "OpenAI",
    "Google",
    "Meta",
    "Anthropic",
    "Microsoft",
    "Cohere"
  ],
  "shortDescription": "Build a RAG pipeline that filters permissions before vector search, expands version-matched parent sections, abstains when evidence is missing, and attributes failures between retrieval and generation.",
  "keyConceptsTested": [
    "RAG as an evidence pipeline",
    "Versioned chunk records and tombstones",
    "Parent-child evidence retrieval",
    "Pre-filter ACL enforcement in ANN search",
    "Context precision, context recall, faithfulness, and answer relevance",
    "Retrieval-vs-generation failure attribution",
    "Latency budgets and TTFT"
  ],
  "section": "Applied LLM Engineering & RAG",
  "order": 7,
  "aliases": [
    "rag-evaluation-faithfulness-relevance",
    "enterprise-rag-security-rbac-access-control"
  ]
}
---

A developer asks an internal engineering assistant what maximum batch size the `v2` inference API allows for offline embedding jobs. The assistant replies "50,000 requests per file" and cites `[E1]`. The endpoint returns `200 OK`, and every dashboard stays green.

The answer is wrong in the quietest way possible. Under `v2`, the ceiling dropped to 20,000 requests per file, and only when the compressed payload stays under 100 MB. That 50,000 figure came from last year's deprecated `v1` specification, which is what `[E1]` resolved to.

Retrieval-augmented generation (<span data-glossary="rag">RAG</span>) grounds a language model in an external document index so answers track live documentation without retraining weights.[^lewis2020] Building a demo takes an afternoon, yet five failures break it in production: mistaking nearest neighbors for evidence, leaking restricted docs via post-filtering, letting stale revisions outrank current ones, splitting a specification across chunk edges so its 100 MB cap disappears, and tuning prompts when retrieval dropped the passage.

## Four guarantees and three paths

Every grounded response needs four properties simultaneously:

| Property | Target behavior | Failure prevented |
|---|---|---|
| **Scope & ACL** | Search only records permitted for the caller's workspace and groups | Restricted drafts leak into prompts or rerankers |
| **Freshness** | Serve only active document versions and honor deletions permanently | Deprecated `v1` limits override `v2` specs |
| **Completeness** | Expand matched child chunks to version-matched parent sections | Clause split drops the 100 MB payload cap |
| **Grounding & attribution** | Cite packed sources faithfully, abstain when unsupported, trace every stage | Unverifiable claims or blind prompt tuning |

<figure>
  <img src="illustrations/_generated/rag_pipeline_dark.png" alt="A log-scaled RAG candidate narrowing funnel reduces 100,000 indexed chunks to 18,000 ACL- and version-permitted chunks (2 ms, privacy boundary), 50 hybrid BM25+dense RRF candidates (18 ms, recall), 5 cross-encoder reranked parent sections (35 ms, precision), and 1,800 packed prompt tokens driving a cited answer or abstention (320 ms model TTFT)." />
  <figcaption>Each stage narrows candidates by orders of magnitude while enforcing a distinct invariant: ACL pre-filtering protects privacy before scoring, hybrid retrieval preserves recall, cross-encoder reranking sharpens precision, and parent expansion grounds generation.</figcaption>
</figure>

Splitting the system into three paths localizes every regression quickly:
- **Ingestion path (offline):** Parses docs, builds child chunks linked to parent sections, attaches trusted tenant/group/version metadata, and publishes atomic versioned bundles.
- **Request path (online):** Filters by caller identity and active version, retrieves and reranks candidates, packs source-labeled context within a token budget, and returns a cited answer or explicit abstention.
- **Evaluation path (pre-release):** Replays a fixed labeled suite across any new index, retriever, prompt, or model, attributing regressions to the earliest failing stage before cutover.

## Versioned evidence records and parent-child expansion

Carry source metadata from [Chunking Strategies](/learn/chunking-strategies-document-processing) onto every indexed record: `chunk_id`, `document_id`, `parent_id`, `version`, `workspace`, `acl_group`, `effective_from`, and `effective_to`. Populate these fields strictly from trusted ingestion pipelines rather than document text, and version ACL grants separately from document content because group membership changes while text stays unchanged.

### Retrieve small, expand to version-matched parents

Short chunks produce crisp retrieval vectors, while complete sections supply qualifiers and exceptions. **Parent-child indexing** searches compact child chunks, then resolves each hit through `parent_id` to its surrounding parent section after rechecking revision and ACL.[^langchain_parent_document_retriever] A lighter alternative is **sentence-window retrieval**, indexing single sentences and expanding to neighboring sentences on hit.[^llamaindex_sentence_window]

<figure>
  <img src="illustrations/_generated/parent_child_indexing_dark.png" alt="A scaled 0 to 512 token document span compares four 128-token child chunks against their full 512-token parent section batch-api-sec4-v2. Query similarity matches Child 2 (tokens 128 to 256, 20,000 req/file ceiling, cos=0.89), while the dependent 100 MB payload cap sits in Child 3 (tokens 256 to 384). Following parent_id after rechecking revision and ACL expands the hit to the complete 512-token parent section packed as source E1." />
  <figcaption>Searching over tight 128-token child chunks sharpens retrieval precision; resolving `parent_id` after rechecking revision and ACL expands the match to the full 512-token parent section (`[E1]`) so the neighboring 100 MB cap is never lost.</figcaption>
</figure>

Sliding overlap helps short phrases cross a split, yet multi-clause specifications with footnotes or exceptions still fracture unless you expand to the parent section.

<figure>
  <img src="illustrations/_generated/chunk_overlap_boundary_dark.png" alt="Clause segmentation across chunk boundaries showing how a multi-clause specification splits under naive windowing, whereas sliding overlap or parent-child expansion keeps linked conditions together for generation." />
  <figcaption>Splitting mid-specification separates linked constraints. Parent-child expansion keeps every dependent clause intact when assembling context.</figcaption>
</figure>

Publish each index update as an atomic **bundle** (child index, parent store, manifest, retriever config) and pin one bundle per request so child matches and expanded parents share the exact same revision. Separate **deletions** from **supersession**: archived versions stay queryable for replay, while deleted documents carry a permanent **tombstone** (plus cache purge) so rolling back an index pointer never resurrects deleted text. When swapping embedding models, build the new index in parallel and validate on shadow traffic because two models with the same dimension still inhabit incompatible vector spaces.

### Pre-filter ACLs inside search, never after top-k

> **Pre-filter ACL invariant:** Run tenant, workspace, and group predicates *before or inside* vector and lexical search rather than post-filtering global top-$k$ in application code. Post-filtering breaks twice: restricted chunks enter worker memory, caches, traces, and external rerankers before removal, and when another tenant dominates top-$k$, the caller gets underfilled or empty results even when permitted docs sit just below the cutoff. In <span data-glossary="hnsw">HNSW</span> engines, pgvector's `hnsw.iterative_scan` keeps traversing until enough eligible rows match,[^malkov2018][^pgvector_docs][^pgvector_iterative] while Weaviate and Azure AI Search build allow-lists before or during traversal (such as ACORN or flat fallback).[^weaviate_filter_docs][^patel2024acorn][^azure2026VectorFilters] Never retry an empty authorized search by relaxing the filter.

## Authorized retrieval and context packing in code

This runnable pipeline indexes a technical documentation corpus with `TfidfVectorizer` and cosine similarity, applies workspace, ACL, effective-date, and tombstone filters *before* scoring, and packs version-matched parents:

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, id=rag-core -->
```python title="authorized-rag-retrieval.py"
# fold:start imports, dataclasses & documentation corpus
from dataclasses import dataclass
from datetime import date
from hashlib import sha256
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass(frozen=True)
class DocChunk:
    chunk_id: str
    document_id: str
    parent_id: str
    version: str
    workspace: str
    acl_group: str
    effective_from: date
    effective_to: date | None
    text: str


@dataclass(frozen=True)
class ParentSection:
    parent_id: str
    document_id: str
    version: str
    workspace: str
    acl_group: str
    effective_from: date
    effective_to: date | None
    locator: str
    text: str


@dataclass(frozen=True)
class Caller:
    user_id: str
    workspace: str
    groups: frozenset[str]


TODAY = date(2026, 6, 15)
BATCH_SPEC_V2 = (
    "Batch Inference API v2 accepts up to 20,000 requests per JSONL file, "
    "provided the compressed payload stays under 100 MB."
)
CHUNKS = [
    DocChunk("batch-api-v2-limits", "batch-api", "batch-api-sec4-v2", "batch-api/2026-05-01",
             "ml-platform", "eng:platform", date(2026, 5, 1), None, BATCH_SPEC_V2),
    DocChunk("batch-api-v1-limits", "batch-api", "batch-api-sec4-v1", "batch-api/2025-03-01",
             "ml-platform", "eng:platform", date(2025, 3, 1), date(2026, 4, 30),
             "Batch Inference API v1 accepts up to 50,000 requests per JSONL file."),
    DocChunk("stream-sse-timeout-v2", "streaming-api", "streaming-sec2-v2", "streaming-api/2026-02-10",
             "ml-platform", "eng:platform", date(2026, 2, 10), None,
             "Streaming SSE connections close after 90 seconds of idle time unless heartbeats arrive."),
    DocChunk("batch-capacity-internal", "capacity-plan", "capacity-plan-v1", "capacity/2026-06-01",
             "ml-platform", "infra:capacity-admins", date(2026, 6, 1), None,
             "Batch Inference API v2 internal quota override: capacity admins may submit 200,000 requests per JSONL file."),
]
PARENTS = {
    "batch-api-sec4-v2": ParentSection(
        "batch-api-sec4-v2", "batch-api", "batch-api/2026-05-01", "ml-platform", "eng:platform",
        date(2026, 5, 1), None, "Batch Inference API v2 > Section 4.1 Limits",
        "Section 4.1 Batch Limits. " + BATCH_SPEC_V2,
    ),
    "streaming-sec2-v2": ParentSection(
        "streaming-sec2-v2", "streaming-api", "streaming-api/2026-02-10", "ml-platform", "eng:platform",
        date(2026, 2, 10), None, "Streaming API v2 > Section 2.3 Timeouts",
        "Section 2.3 Timeouts. Streaming SSE connections close after 90 seconds of idle time unless heartbeats arrive.",
    ),
}
# fold:end


def is_active(record: DocChunk | ParentSection, on_date: date) -> bool:
    return record.effective_from <= on_date and (record.effective_to is None or on_date <= record.effective_to)


def prefilter_chunks(
    caller: Caller, chunks: list[DocChunk], on_date: date, deleted_docs: frozenset[str] = frozenset()
) -> list[DocChunk]:
    return [
        c for c in chunks
        if c.document_id not in deleted_docs and c.workspace == caller.workspace
        and c.acl_group in caller.groups and is_active(c, on_date)
    ]


def search_prefiltered(
    query: str, caller: Caller, chunks: list[DocChunk], on_date: date,
    top_k: int = 2, deleted_docs: frozenset[str] = frozenset(),
) -> list[tuple[DocChunk, float]]:
    eligible = prefilter_chunks(caller, chunks, on_date, deleted_docs)
    if not eligible:
        return []
    vec = TfidfVectorizer(stop_words="english")
    matrix = vec.fit_transform([c.text for c in eligible])
    sims = cosine_similarity(vec.transform([query]), matrix).ravel()
    order = np.argsort(-sims)[:top_k]
    return [(eligible[int(i)], float(sims[int(i)])) for i in order if sims[int(i)] > 0.0]


def pack_parents(
    hits: list[tuple[DocChunk, float]], caller: Caller, on_date: date,
    parents: dict[str, ParentSection], max_chars: int = 420,
    deleted_docs: frozenset[str] = frozenset(),
) -> list[dict[str, str]]:
    packed, seen, total_chars = [], set(), 0
    for chunk, _ in hits:
        parent = parents.get(chunk.parent_id)
        if parent is None or parent.parent_id in seen or parent.document_id in deleted_docs:
            continue
        if (parent.document_id != chunk.document_id or parent.version != chunk.version
                or parent.workspace != caller.workspace or parent.acl_group not in caller.groups
                or not is_active(parent, on_date)):
            continue
        entry = f"[E{len(packed) + 1}] ({parent.version}) {parent.text}"
        if total_chars + len(entry) > max_chars:
            continue
        packed.append({
            "label": f"E{len(packed) + 1}", "chunk_id": chunk.chunk_id, "parent_id": parent.parent_id,
            "version": parent.version, "locator": parent.locator, "text": parent.text,
            "sha256": sha256(parent.text.encode()).hexdigest()[:12],
        })
        seen.add(parent.parent_id)
        total_chars += len(entry)
    return packed


# fold:start demo query, prints & assertions
caller = Caller("dev-42", "ml-platform", frozenset({"eng:platform"}))
query = "batch inference API v2 max requests per JSONL file"

all_vec = TfidfVectorizer(stop_words="english")
all_mat = all_vec.fit_transform([c.text for c in CHUNKS])
all_sims = cosine_similarity(all_vec.transform([query]), all_mat)[0]
unfiltered_top = CHUNKS[int(np.argmax(all_sims))].chunk_id

hits = search_prefiltered(query, caller, CHUNKS, TODAY, top_k=2)
packed = pack_parents(hits, caller, TODAY, PARENTS)

print("Unfiltered top hit (leaky/stale risk):", unfiltered_top)
print("Pre-filtered hits:", [(c.chunk_id, round(s, 3)) for c, s in hits])
print("Packed context:", [(p["label"], p["parent_id"], p["sha256"]) for p in packed])
print("After tombstone delete:", search_prefiltered(query, caller, CHUNKS, TODAY, deleted_docs=frozenset({"batch-api"})))

assert hits[0][0].chunk_id == "batch-api-v2-limits"
assert all(c.acl_group == "eng:platform" for c, _ in hits)
assert len(packed) == 1 and packed[0]["parent_id"] == "batch-api-sec4-v2"
# fold:end
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Unfiltered top hit (leaky/stale risk): batch-api-v1-limits
Pre-filtered hits: [('batch-api-v2-limits', 0.661)]
Packed context: [('E1', 'batch-api-sec4-v2', 'a609ac25af27')]
After tombstone delete: []
```
<!-- leetllm: output:end -->

Keep three operational guardrails beside context packing: avoid padding prompts with weak distractors (relevant passages buried in the middle lose accuracy[^liu2023lost]), delimit retrieved passages as untrusted quoted data to block indirect prompt injection ([Prompt Injection Defense](/learn/prompt-injection-defense-strategies)),[^greshake2023] and key caches by workspace, ACL revision, effective date, bundle ID, and prompt/model version while rechecking live grants and answer-critical numeric thresholds (`18,000` vs. `25,000` requests) before reusing any cached or buffered reply.

```checkpoint
A developer loses access to an internal design doc after retrieval finishes and after the LLM drafted a reply, even though the draft only cites a public doc. Can you strip the unquoted doc and send the draft?
---
No. Because the restricted doc was inside the prompt when the model generated the text, its wording can reflect that source even without citing it. Discard the draft and regenerate from currently permitted context alone.
```

## Evaluate retrieval and generation separately

An end-to-end score hides whether retrieval, context packing, or generation failed. Measure each layer separately (as in RAGAS and TruLens's **RAG triad**[^es2023][^trulens2023triad]):

| Layer | Metric | Formula / Definition | Failure caught |
|---|---|---|---|
| **Stage 1 Retrieval** | **Candidate Recall** | $\lvert C_k \cap R \rvert / \lvert R \rvert$ | First-stage search missed required passages $R$ (distinct from ANN recall vs. exact search) |
| **Context Packing** | **Context Recall**[^ragas2026ContextRecall] | $\lvert E \cap R \rvert / \lvert R \rvert$ | Reranker or token budget dropped a retrieved passage before the prompt |
| **Context Packing** | **Context Precision** | $\lvert E \cap R \rvert / \lvert E \rvert$ | Prompt is flooded with distractors (set precision vs. rank-weighted Ragas `ContextPrecision`[^ragas2026ContextPrecision]) |
| **Generation** | **Faithfulness**[^ragas2026Faithfulness] | $\frac{1}{m}\sum_{j=1}^m \mathbb{I}(\text{entailed}(c_j, E))$ | Model contradicts context or invents unsupported claims |
| **Generation** | **Answer Relevance** | Fraction of required query aspects addressed (or clean abstention when $R \not\subseteq E$) | Model cites valid text faithfully yet dodges the question |

### Faithfulness vs. citation syntax vs. answer relevance

Checking whether packed context $E$ entails atomic claim $c_j$ is an NLI check (**entailed**, **contradicted**, or **unsupported**). Keep three distinct failures separate: a **valid citation with an unfaithful claim** (`[E1]` exists and states 20,000, yet the model claims 50,000), a **faithful but off-topic answer** (accurately summarizing SSE timeouts when asked about batch limits: faithfulness `1.0`, answer relevance `0.0`), and **supported denial vs. abstention** (a 25,000-request job against the `v2` limit is a supported no, whereas missing documentation calls for explicit abstention).

### Attribute the first failed stage

Check stages in **causal pipeline order**: authorization -> candidate retrieval -> context packing -> faithfulness -> citation support -> answer relevance. Stopping at the earliest failure prevents editing prompts when retrieval or reranking dropped the source.

<figure>
  <img src="illustrations/_generated/rag_metrics_dark.png" alt="A decision matrix evaluating candidate records against eligibility, freshness, task relevance, and multi-condition satisfaction, distinguishing supported answers, supported denials, and abstentions." />
  <figcaption>Multi-criteria evaluation checks authorization, freshness, context relevance, and compound-condition support in order, separating valid answers from denials and abstentions.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy, continue=rag-core, id=rag-eval -->
```python title="failure-attribution-and-rag-metrics.py"
# fold:start dataclasses & labeled ground-truth fixtures
@dataclass(frozen=True)
class Claim:
    text: str
    cited_label: str | None


@dataclass(frozen=True)
class RagTrace:
    caller_authorized: bool
    candidate_ids: tuple[str, ...]
    packed_ids: tuple[str, ...]
    source_map: dict[str, str]
    claims: tuple[Claim, ...]
    answered_aspects: frozenset[str]


REQUIRED_DOCS = frozenset({"batch-api-v2-limits"})
REQUIRED_ASPECTS = frozenset({"max_requests", "payload_cap"})
ENTAILED_BY = {
    "Batch API v2 allows up to 20,000 requests per JSONL file.": "batch-api-v2-limits",
    "Compressed payloads must stay under 100 MB.": "batch-api-v2-limits",
    "SSE connections time out after 90 seconds idle.": "stream-sse-timeout-v2",
}
# fold:end


def compute_metrics(trace: RagTrace) -> dict[str, float]:
    cand_set, pack_set = set(trace.candidate_ids), set(trace.packed_ids)
    cand_recall = len(cand_set & REQUIRED_DOCS) / len(REQUIRED_DOCS)
    ctx_recall = len(pack_set & REQUIRED_DOCS) / len(REQUIRED_DOCS)
    ctx_prec = len(pack_set & REQUIRED_DOCS) / len(pack_set) if pack_set else 0.0
    if trace.claims:
        entailed = [ENTAILED_BY.get(c.text) in pack_set for c in trace.claims]
        cited_ok = [c.cited_label is not None and trace.source_map.get(c.cited_label) == ENTAILED_BY.get(c.text) for c in trace.claims]
        faith, cite_acc = float(np.mean(entailed)), float(np.mean(cited_ok))
    else:
        faith, cite_acc = 0.0, 0.0
    ans_rel = len(trace.answered_aspects & REQUIRED_ASPECTS) / len(REQUIRED_ASPECTS)
    return {"cand_recall": cand_recall, "ctx_recall": ctx_recall, "ctx_prec": ctx_prec,
            "faithfulness": faith, "cite_support": cite_acc, "ans_relevance": ans_rel}


def first_failed_stage(trace: RagTrace) -> str:
    if not trace.caller_authorized:
        return "1_authorization"
    m = compute_metrics(trace)
    for key, stage in (
        ("cand_recall", "2_candidate_retrieval"),
        ("ctx_recall", "3_context_packing"),
        ("faithfulness", "4_faithfulness"),
        ("cite_support", "5_citation_support"),
        ("ans_relevance", "6_answer_relevance"),
    ):
        if m[key] < 1.0:
            return stage
    return "pass"


# fold:start six failure scenarios, prints & assertions
good_claims = (
    Claim("Batch API v2 allows up to 20,000 requests per JSONL file.", "E1"),
    Claim("Compressed payloads must stay under 100 MB.", "E1"),
)
scenarios = {
    "healthy": RagTrace(True, ("batch-api-v2-limits", "stream-sse-timeout-v2"), ("batch-api-v2-limits",),
                        {"E1": "batch-api-v2-limits"}, good_claims, REQUIRED_ASPECTS),
    "noisy_context_still_pass": RagTrace(True, ("batch-api-v2-limits", "stream-sse-timeout-v2"),
                                         ("batch-api-v2-limits", "stream-sse-timeout-v2"),
                                         {"E1": "batch-api-v2-limits", "E2": "stream-sse-timeout-v2"}, good_claims, REQUIRED_ASPECTS),
    "retrieval_miss": RagTrace(True, ("stream-sse-timeout-v2",), ("stream-sse-timeout-v2",),
                               {"E1": "stream-sse-timeout-v2"}, good_claims, REQUIRED_ASPECTS),
    "packer_dropped_v2": RagTrace(True, ("batch-api-v2-limits", "stream-sse-timeout-v2"), ("stream-sse-timeout-v2",),
                                  {"E1": "stream-sse-timeout-v2"}, good_claims, REQUIRED_ASPECTS),
    "hallucinated_v1_limit": RagTrace(True, ("batch-api-v2-limits",), ("batch-api-v2-limits",), {"E1": "batch-api-v2-limits"},
                                      (Claim("Batch API v2 allows up to 50,000 requests per JSONL file.", "E1"),), REQUIRED_ASPECTS),
    "faithful_but_off_topic": RagTrace(True, ("batch-api-v2-limits", "stream-sse-timeout-v2"),
                                       ("batch-api-v2-limits", "stream-sse-timeout-v2"),
                                       {"E1": "batch-api-v2-limits", "E2": "stream-sse-timeout-v2"},
                                       (Claim("SSE connections time out after 90 seconds idle.", "E2"),), frozenset()),
}

for name, tr in scenarios.items():
    m = compute_metrics(tr)
    print(f"{name:24} | ctx_rec={m['ctx_recall']:.1f} ctx_prec={m['ctx_prec']:.2f} faith={m['faithfulness']:.1f} rel={m['ans_relevance']:.1f} -> {first_failed_stage(tr)}")

assert first_failed_stage(scenarios["healthy"]) == "pass"
assert compute_metrics(scenarios["noisy_context_still_pass"])["ctx_prec"] == 0.5
assert first_failed_stage(scenarios["retrieval_miss"]) == "2_candidate_retrieval"
assert first_failed_stage(scenarios["packer_dropped_v2"]) == "3_context_packing"
assert first_failed_stage(scenarios["hallucinated_v1_limit"]) == "4_faithfulness"
assert first_failed_stage(scenarios["faithful_but_off_topic"]) == "6_answer_relevance"
# fold:end
```

<!-- leetllm: output:start -->
```text title="Output" output compact
healthy                  | ctx_rec=1.0 ctx_prec=1.00 faith=1.0 rel=1.0 -> pass
noisy_context_still_pass | ctx_rec=1.0 ctx_prec=0.50 faith=1.0 rel=1.0 -> pass
retrieval_miss           | ctx_rec=0.0 ctx_prec=0.00 faith=0.0 rel=1.0 -> 2_candidate_retrieval
packer_dropped_v2        | ctx_rec=0.0 ctx_prec=0.00 faith=0.0 rel=1.0 -> 3_context_packing
hallucinated_v1_limit    | ctx_rec=1.0 ctx_prec=1.00 faith=0.0 rel=1.0 -> 4_faithfulness
faithful_but_off_topic   | ctx_rec=1.0 ctx_prec=0.50 faith=1.0 rel=0.0 -> 6_answer_relevance
```
<!-- leetllm: output:end -->

## Traceability and latency budgets

Log compact identifiers (`request_id`, `user_id`, `workspace`, `acl_revision`, `index_bundle_id`, `candidate_ids`, `source_map` with `parent_id`/`version`/`sha256`, `cited_labels`, `abstained`, `model_version`, stage timings) instead of dumping restricted corpus text into shared logs. Because greedy decoding (`temperature = 0`) is still best-effort across serving upgrades,[^openai2023ReproducibleOutputs] store full prompts only in an access-controlled archive when required.

### Budget TTFT and tail latency by stage

Distinguish **model <span data-glossary="ttft">TTFT</span>** (prompt arrival to first token) from **end-to-end TTFT** (caller arrival through authorization, retrieval, packing, and prefill to first client token). Streaming over <span data-glossary="server-sent-events">SSE</span> shows tokens as they decode, whereas buffering the entire answer for post-generation verification delays first text until decode plus verification finish.

<figure>
  <img src="illustrations/_generated/rag_latency_budget_dark.png" alt="A request timeline shows 2 ms authorization, 18 ms retrieval, and 1 ms packing before 320 ms model startup. The first token arrives at 341 ms, 410 ms of generation ends at 751 ms, and a separate nonblocking trace write ends at 754 ms." />
  <figcaption>One streaming request timeline: 2 ms auth + 18 ms retrieval + 1 ms packing + 320 ms model startup = 341 ms caller-visible TTFT. Nonblocking trace writes run off the critical path.</figcaption>
</figure>

Propagate one **end-to-end deadline** across stages and measure complete-request p95 directly: if five independent stages each pass 95% of the time, all five pass together only $0.95^5 \approx 77.4\%$ of the time.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="latency-and-tail-budget.py"
# fold:start imports & stage budget config
import numpy as np

STAGE_BUDGET_MS = {"authorize": 10, "retrieve": 80, "pack": 10, "model_ttft": 500, "generate": 500, "trace": 10}
CRITICAL_PATH = ("authorize", "retrieve", "pack", "model_ttft", "generate")
DEADLINE_MS = 1000
# fold:end


def check_latency(timings: dict[str, int]) -> list[str]:
    breaches = [s for s, lim in STAGE_BUDGET_MS.items() if timings.get(s, -1) < 0 or timings[s] > lim]
    if all(s in timings and timings[s] >= 0 for s in CRITICAL_PATH):
        if sum(timings[s] for s in CRITICAL_PATH) > DEADLINE_MS:
            breaches.append("end_to_end_deadline")
    return breaches


# fold:start timing scenarios, Monte Carlo check & assertions
healthy = {"authorize": 2, "retrieve": 18, "pack": 1, "model_ttft": 320, "generate": 410, "trace": 3}
cumulative = {"authorize": 10, "retrieve": 80, "pack": 10, "model_ttft": 500, "generate": 450, "trace": 3}

e2e_ttft = sum(healthy[s] for s in ("authorize", "retrieve", "pack", "model_ttft"))
print(f"Healthy e2e TTFT: {e2e_ttft} ms | breaches: {check_latency(healthy)}")
print(f"Cumulative slow : {sum(cumulative[s] for s in CRITICAL_PATH)} ms | breaches: {check_latency(cumulative)}")

rng = np.random.default_rng(42)
stage_ok = rng.random((100_000, 5)) < 0.95
print(f"All-5-pass empirical rate: {stage_ok.all(axis=1).mean():.3f} (analytic 0.95^5 = {0.95**5:.3f})")

assert e2e_ttft == 341 and check_latency(healthy) == []
assert check_latency(cumulative) == ["end_to_end_deadline"]
# fold:end
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Healthy e2e TTFT: 341 ms | breaches: []
Cumulative slow : 1050 ms | breaches: ['end_to_end_deadline']
All-5-pass empirical rate: 0.774 (analytic 0.95^5 = 0.774)
```
<!-- leetllm: output:end -->

## Pre-launch verification checklist

| Check | Release blocker | First place to fix |
|---|---|---|
| **Pre-filter ACL** | Any restricted chunk enters candidates, reranker, or traces | Search-engine pre-filter and metadata schema |
| **Version & tombstones** | Superseded or deleted revision surfaces on rollback | Bundle pinning, effective-date filter, tombstone table |
| **Context recall & precision** | Required parent dropped or drowned by distractors | Stage-1 retriever, chunking, rerank cutoff, packer budget |
| **Faithfulness & relevance** | Unsupported claims, wrong citations, or off-topic replies | Prompt grounding, claim verifier, abstention threshold |
| **Prompt injection** | Retrieved text alters system behavior or invokes tools | Data delimiters; keep tool authorization outside the model |
| **Cache isolation** | Cache key omits workspace, ACL revision, or bundle version | Cache key schema and pre-return grant recheck |
| **Tail latency** | End-to-end p95 misses request deadline | Profile slowest stage; enforce deadline propagation |

Ship RAG as an evidence pipeline rather than a prompt wrapper: enforce ACLs and versions inside search, expand to pinned parent sections, attribute failures to the first broken stage, and budget end-to-end tail latency before launch.

```mastery-quiz
[
  {
    "question": "A vector index ranks documents A through F in descending similarity. A, C, and E are restricted for the caller; B, D, and F are permitted. Fetching global top-3 into the app worker and post-filtering returns which documents, and what two defects occur?",
    "options": [
      "Returns [B]; exposes A and C to application memory and underfills permitted results D and F.",
      "Returns [B, D, F]; matches pre-filtered search with zero leakage.",
      "Returns [B, D]; only the context budget needs expansion.",
      "Returns [A, B, C]; post-filtering skips permission checks."
    ],
    "answer": "Returns [B]; exposes A and C to application memory and underfills permitted results D and F.",
    "explanation": "Global top-3 pulls [A, B, C] into the worker before discarding A and C, exposing restricted text and starving the caller of permitted documents D and F below the cutoff."
  },
  {
    "question": "A request pins index bundle B4 and retrieves child chunk X at revision r4. Serving flips to bundle B5 before context packing. B4 holds X's parent at r4; B5 holds the same document at r5. Both pass current ACL checks. Which parent should packing load?",
    "options": [
      "Load B4 parent r4 from the pinned bundle and revalidate current grants.",
      "Load B5 parent r5 to get the newest text regardless of what child matched.",
      "Load both r4 and r5 and let the generator reconcile differences.",
      "Skip parent loading and send only the unexpanded child span."
    ],
    "answer": "Load B4 parent r4 from the pinned bundle and revalidate current grants.",
    "explanation": "Pinning one bundle per request keeps child matches and cited parents revision-consistent while still validating live caller permissions and deletion tombstones."
  },
  {
    "question": "For a query requiring document R, first-stage retrieval returns [R, D1, D2], and context packing sends [R, D1, D2] to the prompt. The model writes two claims: one supported by R (cited [E1]) and one contradicted by R (cited [E1]). What are context recall, context precision, and faithfulness?",
    "options": [
      "Context recall 1.0, context precision 0.33, faithfulness 0.50.",
      "Context recall 0.33, context precision 1.0, faithfulness 1.00.",
      "Context recall 1.0, context precision 1.0, faithfulness 0.50.",
      "Context recall 1.0, context precision 0.33, faithfulness 1.00."
    ],
    "answer": "Context recall 1.0, context precision 0.33, faithfulness 0.50.",
    "explanation": "R is present in packed context (context recall 1/1 = 1.0), 1 of 3 packed chunks is relevant (context precision 1/3 = 0.33), and 1 of 2 emitted claims is entailed by context (faithfulness 0.50)."
  },
  {
    "question": "In causal failure attribution, a trace shows: caller authorized (pass), candidate recall 1.0, context recall 0.0 (reranker dropped the required section), faithfulness 0.0, answer relevance 0.0. Which stage should engineers fix first?",
    "options": [
      "Context selection / reranking cutoff, because the passage survived retrieval but never entered the prompt.",
      "Prompt wording, because faithfulness scored 0.0.",
      "The embedding model, because candidate recall was imperfect.",
      "ACL filtering, because downstream metrics failed."
    ],
    "answer": "Context selection / reranking cutoff, because the passage survived retrieval but never entered the prompt.",
    "explanation": "Candidate recall was 1.0, so stage-1 retrieval succeeded. The first failing stage is context selection (context recall 0.0); editing prompts cannot fix a missing passage."
  },
  {
    "question": "A serial request spends 3 ms on auth, 27 ms on retrieval, 5 ms on packing, 260 ms on model prefill, 390 ms decoding tokens, and 15 ms on full-answer verification. Ignoring network jitter, what are caller-visible first-text latencies for immediate streaming versus buffered verification?",
    "options": [
      "295 ms streaming versus 700 ms buffered.",
      "260 ms streaming versus 650 ms buffered.",
      "295 ms streaming versus 685 ms buffered.",
      "310 ms streaming versus 700 ms buffered."
    ],
    "answer": "295 ms streaming versus 700 ms buffered.",
    "explanation": "Streaming emits token one after 3 + 27 + 5 + 260 = 295 ms. Full-answer buffering must wait through 390 ms of decoding plus 15 ms of verification, reaching 700 ms."
  }
]
```

> **Next:** Continue to [LLM-as-a-Judge Evaluation](/learn/llm-as-judge-automated-evaluation).
