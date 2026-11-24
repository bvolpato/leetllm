---
{
  "id": "design-llm-powered-search-engine",
  "title": "LLM-Powered Search Engine",
  "slug": "design-llm-powered-search-engine",
  "category": "System Design",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/llm_search_dark.png",
  "companies": [
    "Google",
    "Microsoft",
    "Perplexity",
    "OpenAI",
    "Anthropic"
  ],
  "shortDescription": "Help a developer find the current parser rule without exposing another team's roadmap. Design a search path that preserves its exception and shows only checked claims.",
  "keyConceptsTested": [
    "Query planning and intent classification",
    "Freshness tiers and structured-data routing",
    "Hybrid retrieval and rank fusion",
    "Evidence packing and citation-aware synthesis",
    "Query-aware prompt compression",
    "Streaming response architecture",
    "Claim-level verification",
    "Reference-free and labeled evaluation loops",
    "Serving-side latency levers",
    "Latency and cost trade-offs"
  ],
  "section": "System Design Capstones",
  "order": 5,
  "prerequisites": [
    "design-multi-tenant-llm-serving-platform",
    "hybrid-search-dense-sparse-retrieval",
    "reranking-cross-encoders-rag",
    "rag-evaluation-faithfulness-relevance",
    "advanced-rag-query-rewriting-self-rag",
    "long-context-window-management",
    "llm-deployment-gpu-serving-autoscaling",
    "semantic-caching-cost-latency-optimization"
  ],
  "relatedQuestions": [
    "vision-language-models-clip-beyond",
    "multimodal-llms-architecture-design",
    "enterprise-rag-security-rbac-access-control",
    "design-production-rag-pipeline",
    "design-conversational-ai-support-bot",
    "model-gateways-routing-fallbacks"
  ]
}
---

A developer asks an internal search engine: **"Which parser-v2 migration window applies to service accounts?"** Four documents sit in the corpus. The current migration standard requires starting within 30 days. A separate exception allows 60 days for service accounts, **only with security approval**. An obsolete revision says 90 days, and a private roadmap in another workspace shares almost the exact same keywords. A fluent answer built from either wrong document is worse than returning no answer at all.

Traditional search hands back ten links and lets the reader judge freshness and caveats. An LLM-powered search engine synthesizes a direct statement that users act on, so the architecture must enforce document identity, freshness, access rights, and claim verification across every hop from ingestion to streaming tokens.

In the [multi-tenant serving lesson](/learn/design-multi-tenant-llm-serving-platform), we kept one workspace from reading another's model state. Here we trace those controls through <span data-glossary="embedding">embeddings</span>, <span data-glossary="chunking">chunking</span>, <span data-glossary="reranker">reranking</span>, context packing, citation checks, and streaming.

## Decide what counts as an answer

For CodeAtlas, a complete answer must include both the general 30-day rule and the conditional 60-day exception. Saying "service accounts get 60 days" drops the approval qualifier. Citing only the 30-day rule omits the exception that answers the developer's actual question. Pulling text from another workspace's private roadmap leaks confidential data even if the number happens to be right.

<span data-glossary="rag">Retrieval-augmented generation</span> conditions an LLM on retrieved passages.[^lewis2020] Around that core mechanism, the search system enforces three explicit answer rules:

1. Use only current, authorized sources and preserve qualifying clauses such as "only with security approval."
2. When two current sources disagree without an explicit supersession link, surface the conflict rather than letting the model invent precedence.
3. When required evidence is missing or stale, return an incomplete-answer notice or authorized source links instead of guessing.

Size the architecture around this target envelope:

| Dimension | Design target | Pre-deployment check |
|---|---|---|
| Access control | Zero unauthorized text, titles, citations, or cached replies leave retrieval | Cross-tenant and live revocation tests |
| Freshness | Serve only the active published revision with its effective date | Ingest lag, deletion, and supersession checks |
| Latency | Track progress, first draft token, first checked claim, and completion separately | End-to-end traces and tail percentiles |
| Coverage | Include both the base rule and its applicable conditional exception | Held-out queries with required passage and claim labels |
| Peak load | 1,000 requests/s peak; 60% require LLM synthesis | Measured route mix, stage times, and GPU throughput |

A progress spinner at 100 ms reassures the user that work has started, and a draft token at 800 ms can arrive before verification completes. Both clocks matter only once every passage in the index carries an exact revision, byte span, and reader list.

## Make evidence identifiable before it becomes searchable

Ingestion fetches source revisions, parses them into chunks, and updates lexical and vector indexes. Every chunk needs an immutable `(doc_id, revision)` key, tenant ID, source URL, character offsets tied to a specific text-normalization version, SHA-256 content digest, effective timestamp, and access metadata.

Updating or deleting a document cannot wait for an overnight re-embedding job. Maintain a lightweight **current-revision registry** alongside the indexes so the query path rejects superseded, unpublished, or revoked chunks immediately while vector indexes catch up asynchronously.

<figure>
  <img src="illustrations/_generated/llm_search_dark.png" alt="Architecture of an LLM-powered search engine showing offline document ingestion with cryptographic span hashing, dual lexical and dense index retrieval, and online grounded synthesis. Before citation publication, a verification check confirms tenant access, document revision freshness, and verbatim claim support, invalidating stale or revoked sources." />
  <figcaption>The 30-day base rule and conditional 60-day exception retain exact revisions, offsets, and SHA-256 digests. Registry updates invalidate stale candidates and active streams before publication.</figcaption>
</figure>

### Authorization belongs to the service, not the query planner

Derive tenant and group membership exclusively from authenticated server-side credentials. Apply that scope to every retrieval call, speculative rewrite, parent-chunk fetch, external reranker, citation preview, log line, and cache lookup.

Filter candidates **inside** the index query before top-$K$ truncation. Vector engines like Qdrant support filtered search directly and recommend payload indexes on access-control fields.[^qdrantFiltering2026] Post-filtering a global top-$K$ list wastes candidate slots on forbidden or stale hits, potentially leaving zero usable passages.

> **Common mistake:** Relying solely on indexed ACL tags. Permissions can be revoked minutes after indexing. Always recheck live permissions before sending passages to external components or streaming verified claims, and treat missing access metadata as a hard deny.

Even when forbidden hits are hidden, shared corpus statistics such as global IDF weights can leak subtle score or timing signals. Elasticsearch explicitly notes that document-level security does not alter global relevance statistics.[^elasticDls2026] When strict statistical noninterference is required, place tenants in isolated indexes.

### Freshness isn't a timestamp boost

Re-crawling an obsolete document gives it a brand-new crawl timestamp without making it current. Store source publication time, effective date, crawl time, and index publication time as separate fields, and rely on explicit revision supersession rather than exponential time decay. Hot and warm index tiers shorten ingestion lag for fast-changing release notes, while live mutable state (like whether a CI build is running right now) belongs behind an authorized live API rather than a search index.

## Route the question without weakening its constraints

"Which parser-v2 migration window applies to service accounts?" belongs on hybrid document search. "Is build-1042 running now?" belongs on a live job-status API. A combined question needs both branches concurrently.

Query expansion techniques like Hypothetical Document Embeddings (HyDE) generate a synthetic passage whose embedding can boost recall.[^gao2022] Keep generated expansions strictly inside retrieval: never cite a synthetic HyDE passage as source evidence, and never let query rewriting drop identifiers, dates, or negations.

The compact router below keeps freshness independent of route selection, so asking for the "latest" rule or combining a live build check with a migration question preserves both constraints:

<!-- leetllm: test, output=show -->
```python title="query-routing.py"
from dataclasses import dataclass

@dataclass(frozen=True)
class Plan:
    routes: tuple[str, ...]
    requires_current_revision: bool


def plan_query(query: str) -> Plan:
    text = query.lower().replace("service-account", "service account")
    fresh = any(term in text for term in ("latest", "current", "right now"))
    live = any(term in text for term in ("build-", "job status", "quota remaining"))
    rule_doc = any(term in text for term in ("policy", "migration", "exception"))
    routes = []
    if live:
        routes.append("authorized_live_api")
    if rule_doc or not live:
        routes.append("authorized_hybrid_search")
    return Plan(tuple(routes), fresh or rule_doc)


assert plan_query("Latest parser-v2 policy for service-accounts").requires_current_revision
assert plan_query("Is build-1042 running right now?").routes == ("authorized_live_api",)
assert len(plan_query("build-1042 status and current migration policy").routes) == 2
print(plan_query("Latest parser-v2 migration policy for service accounts"))
print(plan_query("build-1042 status and current migration policy"))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Plan(routes=('authorized_hybrid_search',), requires_current_revision=True)
Plan(routes=('authorized_live_api', 'authorized_hybrid_search'), requires_current_revision=True)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/query_source_routes_dark.png" alt="Three questions route under authenticated workspace-a scope: a latest parser-v2 rule question uses authorized_hybrid_search with requires_current_revision True; build-1042 running right now uses authorized_live_api; mixed build status and current migration question uses both routes with requires_current_revision True. Both branches merge versioned evidence and recheck access." />
  <figcaption>Independent routing and freshness flags. Document questions hit filtered hybrid search, mutable job state hits the live API, and mixed queries fan out to both while retaining the current-revision constraint.</figcaption>
</figure>

If the query planner fails or times out, fall back to a narrower authorized search or ask for clarification; never widen tenant scope. Treat raw query logs as sensitive data too, since queries often contain internal identifiers.

## Retrieve broadly within the permitted corpus

<span data-glossary="bm25">BM25</span> excels at exact identifiers like `parser-v2` using term frequency, inverse document frequency, and length normalization.[^robertson2009] Dense vector search catches paraphrases and conceptual matches. Run both branches concurrently and merge them with <span data-glossary="reciprocal-rank-fusion">reciprocal rank fusion</span> (RRF):

$$
\operatorname{RRF}(d) = \sum_{j:\,d \in R_j} \frac{1}{k + \operatorname{rank}_{R_j}(d)}.
$$

Ranks start at 1, and each document contributes at most once per list so duplicate chunks cannot inflate a document's score. Using $k = 60$ provides a standard starting balance without assuming BM25 and cosine similarities share a numerical scale.[^cormack2009]

<figure>
  <img src="illustrations/_generated/rank_fusion_identity_dark.png" alt="Lexical ranking puts policy@2 then exception@1, while vector ranking reverses them. At k = 60 each receives 1/61 + 1/62 = 0.03252247488101534. Identity ordering breaks the tie with exception@1 first. Duplicate hits within one branch are deduplicated before scoring." />
  <figcaption>With k = 60, reversing two documents across lexical and dense lists gives an exact tie (1/61 + 1/62 = 0.03252). Deduplicating within each list prevents repeated chunks from double-counting.</figcaption>
</figure>

After fusion, a cross-encoder jointly scores the query and top candidate passages, while late-interaction models like ColBERT keep per-token embeddings to balance precision and speed.[^khattab2020] Tune candidate counts against measured recall and latency rather than hardcoding arbitrary funnels.

<figure>
  <img src="illustrations/_generated/retrieval_funnel_dark.png" alt="A four-document global ranking contains roadmap@1 in workspace-b, obsolete policy@1, current policy@2, and exception@1. With K = 2, filtering after top-K wastes both slots on forbidden and obsolete documents, leaving zero usable passages. Filtering before top-K fills both slots with current workspace-a policy@2 and exception@1." />
  <figcaption>Eligibility-before-top-K versus top-K-then-filter at K = 2. Filtering after truncation empties both slots; pre-filtering preserves both required workspace-a documents.</figcaption>
</figure>

### Run a miniature evidence pipeline

Let's wire the entire corpus into an executable pipeline: pre-filtered BM25 and cosine retrieval, RRF fusion, budget-aware packing, and exact span publication. Watch how the checks handle five real failure modes: empty budget, tenant mismatch, duplicate hits, truncated qualifiers, and mid-flight permission or revision changes.

<!-- leetllm: test, output=show -->
```python title="local-search-pipeline.py"
import hashlib
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Principal:
    tenant: str
    groups: frozenset[str]

@dataclass(frozen=True)
class Document:
    doc_id: str
    revision: int
    tenant: str
    text: str
    vector: tuple[float, float]

    @property
    def key(self):
        return (self.doc_id, self.revision)

    @property
    def digest(self):
        return hashlib.sha256(self.text.encode()).hexdigest()

@dataclass(frozen=True)
class Access:
    current_revision: int
    readers: frozenset[str]
    published: bool = True

@dataclass(frozen=True)
class Quote:
    key: tuple[str, int]
    start: int
    end: int
    text: str
    digest: str

alice = Principal("workspace-a", frozenset({"engineering"}))
corpus = [
    Document("policy", 1, "workspace-a", "Parser-v2 migrations may start within 90 days.", (1.0, 1.0)),
    Document("policy", 2, "workspace-a", "Parser-v2 SDK migrations must start within 30 days after the deprecation notice.", (1.0, 0.5)),
    Document("exception", 1, "workspace-a", "Service-account SDK migrations may start within 60 days after the notice only with security approval.", (0.5, 1.0)),
    Document("roadmap", 1, "workspace-b", "Private parser-v2 service-account SDK migration roadmap.", (1.0, 1.0)),
]
store = {doc.key: doc for doc in corpus}
registry = {
    "policy": Access(2, frozenset({"engineering"})),
    "exception": Access(1, frozenset({"engineering"})),
    "roadmap": Access(1, frozenset({"engineering"})),
}


def eligible(doc, principal, access):
    rule = access.get(doc.doc_id)
    return bool(rule and rule.published
                and doc.tenant == principal.tenant
                and doc.revision == rule.current_revision
                and principal.groups & rule.readers)


def words(text):
    return re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)*", text.lower())


def lexical_ranking(query, docs):
    if not docs:
        return []
    counts = {doc.key: Counter(words(doc.text)) for doc in docs}
    avg_len = sum(sum(c.values()) for c in counts.values()) / len(docs)
    scores = {}
    for doc in docs:
        score = 0.0
        for term in set(words(query)):
            df = sum(term in c for c in counts.values())
            idf = math.log(1 + (len(docs) - df + 0.5) / (df + 0.5))
            tf = counts[doc.key][term]
            length = sum(counts[doc.key].values())
            score += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * length / avg_len))
        scores[doc.key] = score
    return sorted(scores, key=lambda key: (-scores[key], key))


def vector_ranking(query_vector, docs):
    def cosine(doc):
        dot = sum(a * b for a, b in zip(query_vector, doc.vector))
        norm = math.sqrt(sum(a * a for a in query_vector) * sum(b * b for b in doc.vector))
        return dot / norm if norm else 0.0
    return [doc.key for doc in sorted(docs, key=lambda doc: (-cosine(doc), doc.key))]


def rrf(rankings, k=60):
    if k < 0:
        raise ValueError("k must be nonnegative")
    scores = defaultdict(float)
    for ranking in rankings:
        for rank, key in enumerate(dict.fromkeys(ranking), 1):
            scores[key] += 1 / (k + rank)
    return sorted(scores, key=lambda key: (-scores[key], key))


def retrieve(principal, access):
    docs = [doc for doc in corpus if eligible(doc, principal, access)]
    query = "parser-v2 SDK migration policy for service-account exceptions"
    return rrf([lexical_ranking(query, docs), vector_ranking((1.0, 1.0), docs)])


def pack(keys, word_budget):
    if word_budget < 0:
        raise ValueError("budget must be nonnegative")
    selected, used = [], 0
    for key in dict.fromkeys(keys):
        doc = store[key]
        cost = len(words(doc.text))
        if used + cost <= word_budget:
            selected.append(Quote(key, 0, len(doc.text), doc.text, doc.digest))
            used += cost
    return selected


def publish(quotes, principal, access):
    if len(quotes) != 2 or {q.key[0] for q in quotes} != {"policy", "exception"}:
        return "Insufficient current, authorized evidence."
    for quote in quotes:
        doc = store.get(quote.key)
        if (doc is None or not eligible(doc, principal, access)
                or quote.digest != doc.digest
                or quote.start != 0 or quote.end != len(doc.text)
                or doc.text[quote.start:quote.end] != quote.text):
            return "Insufficient current, authorized evidence."
    return "\n".join(f'"{q.text}" [{q.key[0]}@{q.key[1]}:{q.start}-{q.end}]'
                     for q in sorted(quotes, key=lambda q: q.key))


ranked = retrieve(alice, registry)
assert set(ranked) == {("policy", 2), ("exception", 1)}
assert rrf([ranked + ranked]) == rrf([ranked])
assert retrieve(Principal("workspace-c", alice.groups), registry) == []

packed = pack(ranked, word_budget=40)
answer = publish(packed, alice, registry)
assert "only with security approval" in answer
assert "Insufficient" in publish(pack(ranked, 0), alice, registry)

corrupted = [replace(packed[0], text="Approval is not required."), *packed[1:]]
assert "Insufficient" in publish(corrupted, alice, registry)

exc = next(q for q in packed if q.key[0] == "exception")
short_text = exc.text.split(" only with security approval.")[0]
truncated = [replace(exc, end=len(short_text), text=short_text) if q.key[0] == "exception" else q for q in packed]
assert "Insufficient" in publish(truncated, alice, registry)

revoked = {**registry, "exception": replace(registry["exception"], readers=frozenset())}
assert "Insufficient" in publish(packed, alice, revoked)
advanced = {**registry, "policy": replace(registry["policy"], current_revision=3)}
assert retrieve(alice, advanced) == [("exception", 1)]
assert "Insufficient" in publish(packed, alice, advanced)

print("eligible ranked keys:", ranked)
print(answer)
print("Revocation, missing evidence, stale revision, and changed-span checks passed.")
print("condition-truncated exact quotation rejected:", "Insufficient" in publish(truncated, alice, registry))
print("revision advanced before reindex:", publish(packed, alice, advanced))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
eligible ranked keys: [('exception', 1), ('policy', 2)]
"Service-account SDK migrations may start within 60 days after the notice only with security approval." [exception@1:0-101]
"Parser-v2 SDK migrations must start within 30 days after the deprecation notice." [policy@2:0-80]
Revocation, missing evidence, stale revision, and changed-span checks passed.
condition-truncated exact quotation rejected: True
revision advanced before reindex: Insufficient current, authorized evidence.
```
<!-- leetllm: output:end -->

Look closely at the two edge cases caught at the end of that run. First, a substring `[0, 72)` of `exception@1` matches the document's SHA-256 digest and is a verbatim prefix, yet drops `"only with security approval."` Checking full clause integrity prevents silent truncation of qualifying conditions.

<figure>
  <img src="illustrations/_generated/condition_preserving_evidence_dark.png" alt="Condition-preserving citation verification comparing truncated and full evidence spans. An exact substring from 0 to 72 matches the source document digest but drops 'only with security approval,' failing verification. The complete 101-character span retains the qualifier and passes." />
  <figcaption>A verbatim prefix [0, 72) matches the source digest while stripping the approval condition. Requiring complete conditional spans catches silent qualifier truncation before publication.</figcaption>
</figure>

Second, when the registry advances `policy` to revision 3 while the search index still holds revision 2, `retrieve` excludes `policy@2` and `publish` blocks even a previously complete quote pack. Availability pauses briefly until revision 3 lands rather than silently serving an obsolete 30-day rule.

<figure>
  <img src="illustrations/_generated/revision_publication_gap_dark.png" alt="Ordered states show policy@2 and exception@1 initially eligible. When the registry advances to policy revision 3 while the index still holds revision 2, policy@2 is excluded, leaving a required slot empty and withholding publication." />
  <figcaption>When the registry moves to revision 3 ahead of the index, stale revision 2 is withheld rather than silently substituted.</figcaption>
</figure>

## Pack evidence without changing its meaning

Packing turns ranked passages into a prompt budget counted with the serving model's actual tokenizer (reserving space for system instructions, the user query, tool schemas, and output tokens). Pure relevance sorting can fill the entire window with ten near-duplicate chunks of the general 30-day rule and crowd out the single exception chunk. Add document-diversity and coverage constraints so secondary rules survive packing.

Position matters too: Liu et al.'s *Lost in the Middle* study showed that models can overlook relevant facts buried in the middle of long contexts.[^liu2023lost] Measure recall sensitivity across prompt positions on your serving model before tuning chunk order. If you apply prompt compression such as LLMLingua, run it strictly **after** authorization and passage selection, verify that numbers and negations survive, and keep mappings back to exact original spans for verification.[^jiang2023a]

### Verify that citations support their claims

Split citation verification into three independent checks:

| Check | What it verifies | Failure caught |
|---|---|---|
| Resolution | Citation ID maps to a current, authorized revision and span | Link points to a deleted or cross-tenant document |
| Support | The cited span entails the claim, including numbers and conditions | Model drops "only with security approval" |
| Coverage | Every material part of the question has backing evidence | General rule cited, relevant exception omitted |

Verbatim quotes can be checked deterministically; paraphrased claims require semantic verification via natural language inference (NLI) models or calibrated verifier LLMs (as studied in TRUE and FActScore).[^honovich2022][^min2023] Never confuse keyword overlap with semantic entailment:

<!-- leetllm: test, output=show -->
```python title="lexical-support-counterexample.py"
import re


def terms(text):
    return set(re.findall(r"[a-z0-9]+", text.lower()))

claim = "Security approval is required"
negated_source = "Security approval is not required"
paraphrased_source = "Authorization from the security team is mandatory"
assert terms(claim) <= terms(negated_source)
assert not terms(claim) <= terms(paraphrased_source)
print("Negated source passes lexical check:", terms(claim) <= terms(negated_source))
print("Paraphrase passes lexical check:", terms(claim) <= terms(paraphrased_source))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Negated source passes lexical check: True
Paraphrase passes lexical check: False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/lexical_support_counterexample_dark.png" alt="Lexical token containment accepts the negated source 'Security approval is not required' while rejecting the valid paraphrase 'Authorization from the security team is mandatory.'" />
  <figcaption>Token overlap accepts a direct contradiction and rejects an accurate paraphrase. Verifying paraphrased claims requires semantic entailment models.</figcaption>
</figure>

Treat every retrieved passage as untrusted data, never as instructions. Delimit retrieved chunks clearly, block tool calls triggered solely by retrieved text, and keep secrets out of the generation context to defend against indirect prompt injection.[^owasp2026LLMTop10]

<figure>
  <img src="illustrations/_generated/streaming_verification_dark.png" alt="Streaming claim verification state machine. A pending draft claim is held until verified. An accepted verdict emits it once over the stream and ignores duplicate deliveries. A rejection permanently blocks publication, and stale or malformed verdicts are dropped." />
  <figcaption>Streaming verification binds each check event to `(request_id, draft_hash, source_revision)`. Valid approval emits the claim once; rejection permanently blocks it.</figcaption>
</figure>

## Stream progress before policy claims

Users want fast visual feedback, yet you cannot un-show a leaked or wrong rule after a reader copies it. Stream safe progress updates and authorized source citations immediately, while holding factual claims until their verification verdict arrives.

Server-Sent Events (SSE) provide simple HTTP streaming with `Last-Event-ID` reconnect cursors, though authentication, authorization, and replay deduplication remain application responsibilities.[^whatwgSse2026] One subtle browser quirk breaks naive deduplication: if an SSE event omits an `id:` line, the browser silently inherits the previous event's `lastEventId`:

```text title="inherited-sse-event-id.txt"
id: 12
data: {"type":"progress"}

data: {"type":"checked_claim"}

```

Both callbacks receive `lastEventId == "12"`. Deduplicating solely on `lastEventId` drops the second frame! Always emit monotonic explicit IDs (`12`, `13`, ...) on every replayable frame. Also note that native browser `EventSource` only supports `GET` requests, so create the search job separately or stream via `fetch` instead of stuffing secrets into query strings.[^mdn2026sse]

<figure>
  <img src="illustrations/_generated/sse_event_identity_dark.png" alt="Server-Sent Events ID inheritance hazard. Omitting an explicit id on the second frame causes the browser to reuse lastEventId 12, dropping the distinct checked_claim payload under naive deduplication. Monotonic explicit IDs (12, then 13) guarantee reliable delivery." />
  <figcaption>Omitting an SSE `id` field makes the browser inherit `lastEventId = 12`. Emit explicit monotonic IDs on every replayable event so reconnects and deduplication never drop verified claims.</figcaption>
</figure>

The state machine below shows how to bind every verification verdict to `(request_id, draft_hash, source_revision)` with strict boolean checking so a string `"false"` or integer `1` never accidentally releases an unverified claim:

<!-- leetllm: test, output=show -->
```python title="stream-publication-state.py"
from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Event:
    event_id: int
    request_id: str
    kind: str
    draft_hash: str
    source_revision: int
    accepted: bool = False


def apply_events(events):
    state = "pending"
    emitted = []
    seen = set()
    for ev in events:
        if ev.request_id != "request-a" or ev.event_id in seen:
            continue
        if ev.event_id < 0 or ev.source_revision < 0:
            continue
        if ev.accepted is True:
            verdict = "checked"
        elif ev.accepted is False:
            verdict = "blocked"
        else:
            continue
        seen.add(ev.event_id)
        if ev.draft_hash != "draft-2" or ev.source_revision != 2:
            continue
        if state != "pending" or ev.kind != "check":
            continue
        state = verdict
        if state == "checked":
            emitted.append("checked policy claim")
    return state, emitted


accepted = Event(1, "request-a", "check", "draft-2", 2, True)
rejected = Event(2, "request-a", "check", "draft-2", 2, False)
stale = Event(3, "request-a", "check", "draft-1", 1, True)
assert apply_events([stale]) == ("pending", [])
assert apply_events([rejected]) == ("blocked", [])
assert apply_events([accepted, accepted]) == ("checked", ["checked policy claim"])
assert apply_events([rejected, accepted]) == ("blocked", [])
for bad in (replace(accepted, accepted="false"), replace(accepted, accepted=1)):
    assert apply_events([bad]) == ("pending", [])

print("stale result:", apply_events([stale]))
print("rejected claim:", apply_events([rejected]))
print("accepted replay:", apply_events([accepted, accepted]))
print("malformed verdict:", apply_events([replace(accepted, accepted="false")]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
stale result: ('pending', [])
rejected claim: ('blocked', [])
accepted replay: ('checked', ['checked policy claim'])
malformed verdict: ('pending', [])
```
<!-- leetllm: output:end -->

Matching `ev.accepted is True` and `ev.accepted is False` by identity rejects truthy strings like `"false"` and numeric flags like `1` before a malformed payload can release unverified text.

## Measure the useful response from request to verification

You can overlap query planning (40 ms) with an independent retrieval branch that searches the raw query (260 ms). A branch that depends on a rewritten query must wait for planning to finish first. Adding reranking (90 ms), packing (20 ms), model TTFT (430 ms), first claim completion (100 ms), and claim verification (80 ms) gives the critical path:

<!-- leetllm: test, output=show -->
```python title="response-critical-path.py"
plan, retrieve, rerank, pack, first_token = 40, 260, 90, 20, 430
claim_completion, check = 100, 80
draft_ttft = max(plan, retrieve) + rerank + pack + first_token
checked_claim = draft_ttft + claim_completion + check
rewrite_required_ttft = plan + retrieve + rerank + pack + first_token
assert (draft_ttft, checked_claim, rewrite_required_ttft) == (800, 980, 840)
print("raw-branch draft TTFT:", draft_ttft, "ms")
print("first checked claim:", checked_claim, "ms")
print("rewrite-dependent draft TTFT:", rewrite_required_ttft, "ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw-branch draft TTFT: 800 ms
first checked claim: 980 ms
rewrite-dependent draft TTFT: 840 ms
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/latency_budget_dark.png" alt="0-1000 ms critical-path timeline: planning (40 ms) overlaps raw retrieval (260 ms), followed by rerank (90 ms), pack (20 ms), model TTFT (430 ms), claim completion (100 ms), and check (80 ms), reaching draft TTFT at 800 ms and first checked claim at 980 ms. Rewrite-dependent retrieval waits for planning and hits draft TTFT at 840 ms." />
  <figcaption>Overlapping planning with raw-query retrieval saves 40 ms on the critical path (800 ms draft TTFT vs. 840 ms when waiting on a rewrite), reaching the first checked claim at 980 ms.</figcaption>
</figure>

Always compute end-to-end percentiles from complete request traces (including timeouts, cancellations, and retries) rather than adding individual stage p95s. Optimizations like PagedAttention and speculative decoding speed up the generation slice, not slow upstream retrievals or claim checks.[^kwon2023][^leviathan2023]

### Count KV-resident requests separately

By Little's Law ($L = \lambda W$), mean concurrency equals arrival rate times residence time. Crucially, a search request only occupies GPU KV cache during the **model-resident** portion of its life, not while waiting on retrieval or post-generation CPU checks.

At 1,000 peak QPS with 60% synthesis traffic (600 synthesis requests/s), suppose each synthesis request spends 0.37 s in retrieval/packing, 1.93 s holding GPU KV cache, and 0.20 s in final checks (2.50 s total). For a 32-layer GQA decoder with 8 KV heads, head dimension 128, and 2-byte FP16/BF16 entries, each cached position takes $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes (128 KiB). Let's size both KV memory and decode throughput lower bounds with a 12 GiB net KV budget and 6,000 output tokens/s per GPU:

<!-- leetllm: test, output=show -->
```python title="search-capacity.py"
from math import ceil

all_qps, synthesis_fraction = 1000, 0.60
synthesis_qps = all_qps * synthesis_fraction
before_model, model_resident, after_model = 0.37, 1.93, 0.20
in_flight = synthesis_qps * (before_model + model_resident + after_model)
kv_resident = synthesis_qps * model_resident

kv_bytes_per_position = 2 * 32 * 8 * 128 * 2
mean_cached_positions = 1560
kv_gib = kv_resident * mean_cached_positions * kv_bytes_per_position / 2**30

kv_devices = ceil(kv_gib / 12)
decode_devices = ceil(synthesis_qps * 120 / 6000)
assert round(in_flight) == 1500 and round(kv_resident) == 1158
assert kv_devices == 19 and decode_devices == 12
print("synthesis in flight:", round(in_flight))
print("KV-resident requests:", round(kv_resident))
print("mean KV GiB:", round(kv_gib, 2))
print("KV / decode device lower bounds:", kv_devices, "/", decode_devices)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
synthesis in flight: 1500
KV-resident requests: 1158
mean KV GiB: 220.52
KV / decode device lower bounds: 19 / 12
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/kv_residency_capacity_dark.png" alt="2.5-second request lifecycle split into 0.37 s before model, 1.93 s KV-resident, and 0.20 s after release. At 600 synthesis QPS, 1,500 requests are in flight and 1,158 are KV-resident, requiring 220.52 GiB of KV cache (19-device memory lower bound vs. 12-device decode lower bound)." />
  <figcaption>Only the 1.93 s model interval consumes KV cache (1,158 of 1,500 in-flight requests), driving 220.52 GiB of KV state. The 19-device memory bound and 12-device decode bound run on the same pool and are never summed.</figcaption>
</figure>

> **Key insight:** KV memory (19 devices) and decode throughput (12 devices) are two lower bounds on the **same** GPU pool, not additive fleets. Do not add them into 31 devices; take the tighter constraint, then add headroom for prefill compute, traffic bursts, and replica failures.

## Price the route mix, including the cheap routes

Full synthesis pays for retrieval, reranking, prompt + output tokens, and claim verification. Cache hits and structured API lookups are far cheaper, though they still pay for auth, storage, and formatting. With a 60% synthesis / 30% validated cache / 10% structured lookup split (using a 1,500-token prompt and 400-token answer at \$3 per million tokens):

<!-- leetllm: test, output=show -->
```python title="search-route-cost.py"
prompt_tokens, output_tokens = 1500, 400
rate_per_million = 3.0
synthesis_usd = (prompt_tokens + output_tokens) * rate_per_million / 1_000_000
full_usd = 0.002 + 0.001 + synthesis_usd + 0.001
cache_usd, structured_usd = 0.0003, 0.001
mean_usd = 0.60 * full_usd + 0.30 * cache_usd + 0.10 * structured_usd
assert round(full_usd, 4) == 0.0097 and round(mean_usd, 5) == 0.00601
print(f"full route: ${full_usd:.4f}")
print(f"weighted mean: ${mean_usd:.5f}")
print(f"1,000 QPS: ${mean_usd * 1000 * 60:.2f} per minute")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
full route: $0.0097
weighted mean: $0.00601
1,000 QPS: $360.60 per minute
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/cost_quality_dark.png" alt="Route serving economics across full synthesis ($0.0097), semantic cache ($0.0003), and structured lookup ($0.0010). A 60/30/10 split yields a $0.00601 weighted mean per query ($360.60/min at 1,000 QPS)." />
  <figcaption>Offloading 40% of traffic to validated cache and structured routes trims mean cost from $0.0097 to $0.00601 per query ($360.60/min at 1,000 QPS).</figcaption>
</figure>

A semantic cache match is only a candidate lookup. Before returning a cached answer, revalidate the caller's tenant scope, prompt/model version, and every cited document revision against the live registry. If freshness or access cannot be verified, take the miss path instead of serving stale private text.

## Evaluate each kind of failure separately

Measure each stage independently on held-out labeled queries containing deletions, conflicting rules, mid-stream revocations, indirect prompt injections, and conditional exceptions:

| Layer | Primary metric | What it misses alone |
|---|---|---|
| Retrieval | Recall@K, MRR, nDCG over current authorized docs | Whether the generator actually used the retrieved exception |
| Packing | Fraction of required evidence surviving token budget | Multi-document coverage when one topic dominates ranking |
| Citations | Resolution, semantic support, and claim coverage | Each of the three can fail while the other two pass |
| Answer | Task correctness and calibrated abstention | Faithfulness to a stale source still produces a wrong answer |
| Service | Checked-claim p95/p99, error rate, cost, KV occupancy | Averages over successful requests hide timeouts and overload |
| Security | Zero unauthorized leaks across revocation tests | High relevance never offsets an access breach |

Reference-free LLM-as-a-judge frameworks like RAGAS help track faithfulness trends when labeled sets are small, while click-through and reformulation rates supply useful online signals; neither replaces labeled retrieval and security regression suites.[^es2023]

When computing Recall@K and nDCG@K, deduplicate by document identity first so two chunks from the same document do not earn double credit, and return `None` for empty gold sets (unanswerable queries):

<!-- leetllm: test, output=show -->
```python title="retrieval-metrics.py"
from math import log2


def metrics(ranked, relevant, k):
    if k <= 0:
        raise ValueError("k must be positive")
    if not relevant:
        return {"recall": None, "ndcg": None}
    unique = list(dict.fromkeys(ranked))[:k]
    recall = len(set(unique) & relevant) / len(relevant)
    dcg = sum((doc in relevant) / log2(rank + 1) for rank, doc in enumerate(unique, 1))
    ideal = sum(1 / log2(rank + 1) for rank in range(1, min(k, len(relevant)) + 1))
    return {"recall": round(recall, 4), "ndcg": round(dcg / ideal, 4)}


gold = {"policy@2", "exception@1"}
assert metrics(["policy@2", "policy@2"], gold, 2)["recall"] == 0.5
assert metrics([], set(), 2)["recall"] is None
print("missing exception:", metrics(["policy@2", "faq"], gold, 2))
print("both required sources:", metrics(["policy@2", "exception@1"], gold, 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
missing exception: {'recall': 0.5, 'ndcg': 0.6131}
both required sources: {'recall': 1.0, 'ndcg': 1.0}
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/retrieval_coverage_metrics_dark.png" alt="Retrieval metrics against gold set {policy@2, exception@1}. Missing the exception gives 0.5 recall and 0.6131 nDCG; retrieving both gives 1.0 recall and 1.0 nDCG." />
  <figcaption>Deduplicating by document identity prevents multiple chunks of policy@2 from masking a missing exception@1 (recall 0.50, nDCG 0.6131).</figcaption>
</figure>

Keep stage-level attribution in traces so regressions point straight to their cause: a missing active revision points to ingestion or retrieval, a dropped exception points to packing, a stripped qualifier points to synthesis or NLI verification, and any cross-tenant hit points directly to access control.

## Mastery check

### Evaluation rubric

- Trace both the base rule and its conditional exception through revision tracking, pre-filtered hybrid retrieval, RRF, packing, and span verification, explaining why stale or forbidden hits cannot occupy top-$K$ slots.
- Separate citation resolution, semantic support, and coverage, and show how composite event binding stops stale verdicts or live revocations from releasing text.
- Derive the 980 ms checked-claim path, 1,158 KV-resident requests, and route-weighted cost, distinguishing memory lower bounds from decode lower bounds.

### Follow-up questions

```checkpoint
The source publishes policy revision 3, but its embeddings aren't ready. The registry knows revision 3 is current. Should the service answer from indexed revision 2?
---
Not as the current rule. The service can fetch and authorize revision 3 through a direct fallback, wait within a tight deadline, or report that current evidence is temporarily unavailable. Silently serving revision 2 turns indexing lag into an incorrect answer.
```

```checkpoint
Packing the exception improves labeled coverage but lengthens the prompt. Which capacity and latency assumptions need another measurement?
---
Remeasure prefill latency, mean cached KV positions, KV-residence time, and joint GPU throughput under the longer prompt distribution. Holding output length fixed does not keep the 1,560-position or 1.93-second numbers valid once prompt sizes grow.
```

```checkpoint
How would you evaluate an automated support checker when deploying NLI verifiers in production?
---
Test on held-out claim-and-span pairs covering negations, dropped conditions, mismatched dates, contradictions, unsupported extrapolations, and valid paraphrases. Track false acceptances and false rejections separately against human labels, tune abstention thresholds to domain risk, and test event binding independently.
```

```mastery-quiz
[
  {
    "question": "A trusted global ranking is [forbidden-X, obsolete-Y, allowed-A, allowed-B, allowed-C]. All three allowed documents are current and relevant. With K = 3, how many useful documents survive top-K-then-filter versus eligibility-before-top-K?",
    "options": [
      "0 useful documents versus 3 useful documents",
      "1 useful document versus 3 useful documents",
      "1 useful document versus 1 useful document",
      "3 useful documents versus 3 useful documents"
    ],
    "answer": "1 useful document versus 3 useful documents",
    "explanation": "The first three global slots contain only allowed-A after the two invalid hits are removed. Filtering the population before truncation lets A, B and C occupy all three slots. A larger generator cannot recover documents that retrieval discarded."
  },
  {
    "question": "The local router receives “quota remaining and current exception”. Which source plan and current-revision flag result from the independent live and document routing rules?",
    "options": [
      "Live API with no document branch; require the current revision.",
      "Hybrid search with no live branch; require the current revision.",
      "Live API plus hybrid search; omit the current-revision constraint.",
      "Live API plus hybrid search; require the current revision."
    ],
    "answer": "Live API plus hybrid search; require the current revision.",
    "explanation": "Quota remaining triggers the live route, exception triggers the document route, and current independently preserves the freshness constraint. Taking only the first matched route would lose part of the question."
  },
  {
    "question": "Use RRF with k = 10 on branch lists [M, M, N] and [N]. After within-branch deduplication, which document wins and what is its fused score?",
    "options": [
      "N wins with 1/12 + 1/11.",
      "M wins with 1/11 + 1/11.",
      "N wins with 1/13 + 1/11.",
      "M wins with 1/11 + 1/12."
    ],
    "answer": "N wins with 1/12 + 1/11.",
    "explanation": "The first branch deduplicates to [M, N], so N has rank 2 there and rank 1 in the other branch. Its reciprocal sum exceeds M's single 1/11 term. Counting both M occurrences or skipping ranks would distort fusion scoring."
  },
  {
    "question": "The miniature publisher receives four packs for policy@5 (120 characters) and exception@3 (84 characters). Both records are current, published and authorized, with matching document digests. Every quote equals its stated source slice. A has spans policy [0,120), exception [1,84); B has [0,120), [0,84); C has [2,120), [0,84); D has [0,119), [0,84). Which pack does the publisher release?",
    "options": [
      "Pack A; the other three are withheld.",
      "Pack C; the other three are withheld.",
      "Pack B; the other three are withheld.",
      "Pack D; the other three are withheld."
    ],
    "answer": "Pack B; the other three are withheld.",
    "explanation": "B preserves both complete original spans. A omits the exception's first character, C omits two base-rule characters, and D omits the last character. All four retain valid substrings and correct document hashes, showing that hash verification alone cannot guarantee that critical qualifying clauses are retained."
  },
  {
    "question": "The search engine's publication reducer receives three check events for a pending draft. All three match request-a, draft-2 and source revision 2. In arrival order, their accepted values are 1 (event 6), True (event 7) and False (event 8). Which event first makes the reducer emit a claim, if any? What are the final state and total number of claims emitted?",
    "options": [
      "Event 6, checked, one claim",
      "Event 7, blocked, one claim",
      "Event 7, checked, one claim",
      "No event, blocked, zero claims"
    ],
    "answer": "Event 7, checked, one claim",
    "explanation": "The reducer skips event 6 because 1 is an integer. Treating 1 as True would release the claim early. Treating a malformed value as a rejection would block the draft before it could emit anything. Event 7 carries the Boolean True, so the reducer marks the draft checked and emits once. Only a pending draft can change state, so the rejection at event 8 leaves it checked."
  },
  {
    "question": "Three SSE events carry these id fields in order: “27”, no id field, then an explicitly empty id field. Each has distinct nonempty data and a terminating blank line. What lastEventId values do callbacks receive, and is a nonempty Last-Event-ID available afterward for reconnect?",
    "options": [
      "27, 27, empty; no nonempty reconnect ID",
      "27, 28, empty; no nonempty reconnect ID",
      "27, 27, 27; reconnect retains the ID 27",
      "27, empty, empty; no nonempty reconnect ID"
    ],
    "answer": "27, 27, empty; no nonempty reconnect ID",
    "explanation": "Missing id inherits the prior buffer; an explicit empty id clears it. The browser does not generate 28 for the second event. Each distinct replayable application event still needs an explicit validated identity and authenticated request binding."
  },
  {
    "question": "A search request has planning 55 ms, independent raw retrieval 210 ms, rerank 70 ms, pack 30 ms, model-to-first-token 360 ms, claim completion 90 ms and checking 60 ms. What are the first checked-claim times with raw-branch overlap and with rewrite-dependent retrieval?",
    "options": [
      "765 ms overlapped; 820 ms rewrite-dependent",
      "820 ms overlapped; 820 ms rewrite-dependent",
      "875 ms overlapped; 930 ms rewrite-dependent",
      "820 ms overlapped; 875 ms rewrite-dependent"
    ],
    "answer": "820 ms overlapped; 875 ms rewrite-dependent",
    "explanation": "The independent path uses max(55,210) + 70 + 30 + 360 + 90 + 60 = 820. The dependent path must add planning before retrieval, so 55 + 210 + 70 + 30 + 360 + 90 + 60 = 875. Draft-token time and checked-claim time are separate endpoints."
  },
  {
    "question": "A steady-state synthesis route receives 400 requests/s. Mean total residence is 2.8 s, of which model KV is retained for 1.6 s. Each resident averages 2048 cached positions at 24576 bytes/position. Use 1 GiB = 2^30 bytes. What are the mean total in-flight count, KV-resident count and KV footprint?",
    "options": [
      "640 in flight; 1120 KV-resident; 52.5 GiB",
      "1120 in flight; 640 KV-resident; 30 GiB",
      "1120 in flight; 1120 KV-resident; 52.5 GiB",
      "1120 in flight; 640 KV-resident; 15 GiB"
    ],
    "answer": "1120 in flight; 640 KV-resident; 30 GiB",
    "explanation": "Multiply arrival rate by the corresponding residence interval: 400 * 2.8 = 1120 total in-flight and 400 * 1.6 = 640 KV-resident. Cache bytes are 640 * 2048 * 24576 / 2^30 = 30 GiB."
  },
  {
    "question": "A search route mix is 50% full synthesis at \\$0.012, 35% valid cache at \\$0.0004 and 15% structured lookup at \\$0.002. At 800 total requests/s, what are the mean cost per request and cost per minute?",
    "options": [
      "\\$0.00644 per request; \\$309.12 per minute",
      "\\$0.00600 per request; \\$288.00 per minute",
      "\\$0.00644 per request; \\$5.152 per minute",
      "\\$0.01440 per request; \\$691.20 per minute"
    ],
    "answer": "\\$0.00644 per request; \\$309.12 per minute",
    "explanation": "Weight the route prices: .5×.012 + .35×.0004 + .15×.002 = .00644. Multiply by 800×60 requests/minute for 309.12. Ignoring cheap routes, omitting the seconds-to-minute conversion or adding unweighted prices gives the other values."
  },
  {
    "question": "The relevant document identities are {A, B, C}. A search returns [C, C, irrelevant, A] in rank order. When scoring by document identity, what are recall@3 and binary nDCG@3, rounded to four decimals?",
    "options": [
      "Recall 0.6667, nDCG 0.6667",
      "Recall 0.6667, nDCG 0.7654",
      "Recall 0.6667, nDCG 0.7039",
      "Recall 0.3333, nDCG 0.4693"
    ],
    "answer": "Recall 0.6667, nDCG 0.7039",
    "explanation": "Keeping the first occurrence of each identity gives [C, irrelevant, A]. C and A cover two of the three relevant documents, so recall is 2/3. Their gains at ranks 1 and 3 sum to 1 + 1/log2(4) = 1.5. The ideal ranking has three relevant hits and gain 1 + 1/log2(3) + 1/log2(4), about 2.1309. Dividing gives nDCG 0.7039. Cutting the raw list at three loses A and gives 0.3333 and 0.4693. Skipping the irrelevant hit when numbering ranks moves A up to rank 2 and gives nDCG 0.7654."
  }
]
```

> **Next:** Continue to [Vision-Language Models & CLIP](/learn/vision-language-models-clip-beyond). This search design tracks text evidence from source to answer. The next lesson introduces representations for visual evidence, including screenshots and diagrams that text-only retrieval can miss.
