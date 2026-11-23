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
  "shortDescription": "A fast index can still miss what a user means. Learn when query rewriting, HyDE, Self-RAG, and CRAG help, then test the trade-off on a docs assistant.",
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
    "Rewrite injection and untrusted history",
    "Tenant-safe rewrite and HyDE caches"
  ],
  "section": "Advanced Agents & Retrieval",
  "order": 2,
  "prerequisites": [
    "vector-database-internals-hnsw-ivf",
    "design-production-rag-pipeline",
    "hybrid-search-dense-sparse-retrieval",
    "reranking-cross-encoders-rag",
    "rag-evaluation-faithfulness-relevance"
  ],
  "relatedQuestions": [
    "graphrag-knowledge-graphs-vector-search",
    "enterprise-rag-security-rbac-access-control",
    "agent-memory-persistence-patterns",
    "agent-failure-states-retry-fallback"
  ]
}
---

A developer reports a leaked API key, then asks an internal docs assistant, "What do I do now?" Searching that latest turn alone misses the revocation procedure. The index can be healthy while the search request is missing its subject. Before changing ANN settings, recover the missing context.

The previous chapter showed how <span data-glossary="hnsw">HNSW</span> and <span data-glossary="ivf">IVF</span> find nearby chunks quickly. <span data-glossary="rag">Retrieval-augmented generation (RAG)</span> grounds an answer in those chunks. That speed doesn't help when the search object is "the other one." A fast index returns the wrong neighborhood faster. Stay with this API-docs assistant, from the leaked key through later throughput questions. The repairs below change the search request or the check on what comes back. Measure whether each one recovers the right page, then weigh that gain against the latency and cost it adds.

## The problem with naive RAG

A naive RAG pipeline embeds the user's raw question and fetches the <span data-glossary="top-k">top-k</span> nearest neighbors from a <span data-glossary="vector">vector</span> database. Retrieve once, then generate. Before adding pipeline routing, diagnose which of these failure modes accounts for retrieval misses:

1. **The query is ambiguous.** "What about the other one?" depends on chat history. A stateless retriever never sees that history.
2. **The query and the document don't share a style.** Someone asks "How do I rotate a key?" The page title is "Credential Rotation Workflow". The <span data-glossary="embedding">embedding</span> of a short question may not sit near the embedding of a formal policy paragraph.
3. **The retriever still returns the wrong chunks.** Wording, embedding geometry, <span data-glossary="ann-search">approximate nearest-neighbor (ANN)</span> knobs such as `ef_search` and `nprobe`, or a messy corpus can all put SDK install notes above the rate-limit policy. Once those chunks enter context, the generator can write an unsupported answer.
4. **The model doesn't know *when* to retrieve.** Naive RAG retrieves for every turn, including "Hi" or "What is 2+2?", and burns <span data-glossary="token">tokens</span> and latency for nothing.

Index tuning from the last chapter and query control in this one are different repairs. Measure which failure you actually have, then add the smallest intervention that fixes it.

Each technique changes a different part of the request. Rewriting restores conversational context when the rewrite is correct. Expansion tries alternative vocabulary. Decomposition separates required facts, which may be independent or dependent. Later controls estimate relevance and support, but none establishes source truth by itself.

## Query rewriting and decomposition

Three failures can look identical in a chat transcript. A rewrite creates a standalone question; expansion creates vocabulary variants; decomposition creates a plan for required facts. Determine whether each lookup can be dispatched concurrently or requires intermediate results from an upstream stage:

<figure>
  <img src="illustrations/_generated/query_rewrite_dark.png" alt="Known endpoint names let independent embedding API searches start together and merge into a comparison that marks missing evidence. Finding the endpoint with the most errors first creates a dependency: the circuit-breaker search waits for that endpoint result." />
  <figcaption>Known independent lookups can run concurrently; an unresolved endpoint makes the next query wait. The sequential branch waits on the first hop before issuing the second query. Missing evidence remains an explicit gap for the comparison.</figcaption>
</figure>

"What do I do now?" is an ineffective search query. The leaked key context resides in the previous turn, while a multi-part comparison packs several lookups into one sentence. These examples illustrate which conversational referents must survive rewriting and which multi-part queries require distinct retrieval steps.

### 1. Rewrite for disambiguation

An on-call engineer often clarifies a vague conversation thread into a precise search request before querying runbooks and product documentation. <span data-glossary="query-rewriting">Query rewriting</span> gives the model that same job. Ma et al.'s Rewrite-Retrieve-Read pipeline adds a rewrite stage in front of a frozen retriever and reader, including a small T5 rewriter trained with reader feedback, instead of treating the user's wording as sacred.[^ma2023] In a conversational assistant, a practical variant is simpler: rewrite the latest turn into a standalone, search-oriented question.

A faithful rewrite preserves conversational intent while stripping sensitive identifiers: it retains the credential leakage context and recovery intent without leaking the actual secret value into search infrastructure.

A developer sends two messages:

> **Developer:** "My <span data-glossary="secrets-management">API key</span> leaked in a public issue."
> **Developer:** "What do I do now?"

A stateless retriever searching for "What do I do now?" might return generic onboarding articles. A rewrite step instead produces:

> **Standalone query:** "How do I revoke and rotate a leaked API key and audit recent usage?"

The rewrite model sits behind a small interface. The deterministic fake below checks plumbing without API keys. Evaluate arbitrary conversation handling and resistance to injected instructions separately. Revoke and rotate follow from the reported leak. Auditing is an added retrieval subtopic; a user request to audit does not itself authorize a tool action.

<!-- leetllm: test, output=show -->
```python title="1-rewrite-for-disambiguation.py"
from typing import Protocol, TypedDict

class ChatMessage(TypedDict):
    role: str
    content: str

class RewriteModel(Protocol):
    def rewrite(self, latest_query: str, history_text: str) -> str: ...

class FakeRewriteModel:
    def rewrite(self, latest_query: str, history_text: str) -> str:
        if "api key leaked" in history_text.lower() and "what do i do" in latest_query.lower():
            return "How do I revoke and rotate a leaked API key and audit recent usage?"
        return latest_query

def rewrite_query_with_history(
    query: str, chat_history: list[ChatMessage], model: RewriteModel
) -> str:
    history_text = "\n".join(
        f"{message['role']}: {message['content']}" for message in chat_history
    )
    rewritten = model.rewrite(query, history_text).strip()
    return rewritten or query  # An empty rewrite mustn't erase the request.

history = [
    {"role": "developer", "content": "My API key leaked in a public issue."},
]

rewritten = rewrite_query_with_history("What do I do now?", history, FakeRewriteModel())
print(rewritten)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
How do I revoke and rotate a leaked API key and audit recent usage?
```
<!-- leetllm: output:end -->

Rewrite is search input, not authorization. History, tool output, and retrieved pages can contain "ignore policy / search all tickets" style instructions. Constrain the prompt to *disambiguate the user's question*, not follow instructions found in history, and never let a rewrite broaden <span data-glossary="acl">ACL</span> or tenant scope. [RAG Security & Access Control](/learn/enterprise-rag-security-rbac-access-control) covers the trusted retrieval plane these transforms must preserve.

### 2. Multi-query expansion

**Multi-query expansion** is the repair when one wording misses the page. "How do you handle peak traffic throttling?" never mentions "rate-limit burst policy", "queue <span data-glossary="backpressure">backpressure</span>", or "<span data-glossary="autoscaling">autoscaling</span> capacity". Generate those variants, search each one, then merge the lists.

Raw scores are not automatically calibrated across disparate queries or retrieval models. Cosine similarity is bounded in $[-1,1]$, but its relevance distribution differs across queries, while BM25 operates on an unconstrained positive scale. Score fusion requires suitable normalization or rank-based merging. Here, rank fusion avoids assuming that raw similarity scores across query variants are directly comparable.

Once you fan out into several queries, you have several ranked result lists to merge. One documented pattern is **RAG-Fusion**, which pairs generated query variants with **Reciprocal Rank Fusion (RRF)** to combine the lists into one ranking.[^rackauckas2024] <span data-glossary="reciprocal-rank-fusion">RRF</span> ignores raw similarity scores and sums reciprocal ranks instead, so a document that lands near the top of several lists rises even if no single list ranked it first.[^cormack2009]

For a document $d$, the score across rankings $R$ is:

$$
\text{RRF\_Score}(d) = \sum_{r \in R} \frac{1}{k + r(d)}
$$

Here, $R$ is the set of variant rankings, $r(d)$ is the document's one-based position in one ranking, and $k$ is a rank damping constant. Cormack et al. fixed $k = 60$ after empirical tuning.[^cormack2009]

Why $k = 60$? With $k = 0$, ranks 1 and 2 contribute 1.0 and 0.5. With $k = 60$, they contribute about 0.01639 and 0.01613, a 1.6% drop. Increasing $k$ reduces the advantage of a single high position relative to appearing in several lists. Noisy variants can still distort fusion. One first-place appearance ties two second-place appearances when $k=0$; it doesn't beat them. A document missing from a truncated list contributes zero. Repeated or near-identical variants can overweight the same result, so cap and evaluate expansion rather than treating every appearance as independent evidence.

Implement multi-query expansion behind a testable boundary. The model returns one query per line; the parser removes list markers, deduplicates variants, and caps their count so they can be searched in parallel. Keep the original query as a separate retrieval candidate when exact wording matters. The retriever should see clean search objects, not formatting noise.

<!-- leetllm: test, output=show -->
```python title="2-multi-query-expansion.py"
import re
from typing import Protocol

class QueryExpansionModel(Protocol):
    def expand(self, query: str, n: int) -> str: ...

class FakeExpansionModel:
    def expand(self, query: str, n: int) -> str:
        return "\n".join(
            [
                "Rate-limit burst policy during launch traffic",
                "Queue backpressure controls for high-volume periods",
                "Autoscaling capacity for traffic spikes",
            ][:n]
        )

def clean_query_line(line: str) -> str:
    # Remove a list marker only when followed by whitespace. Preserve "429".
    return re.sub(r"^(?:[-*]|\d+[.)])\s+", "", line.strip()).strip()

def generate_multi_queries(
    query: str, model: QueryExpansionModel, n: int = 3
) -> list[str]:
    if not 1 <= n <= 5:
        raise ValueError("n must be between 1 and 5")
    content = model.expand(query, n)
    queries = [clean_query_line(line) for line in content.splitlines()]
    return list(dict.fromkeys(item for item in queries if item))[:n] or [query]

queries = generate_multi_queries(
    "How do you handle peak traffic throttling?", FakeExpansionModel(), n=3
)

for query in queries:
    print(f"- {query}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
- Rate-limit burst policy during launch traffic
- Queue backpressure controls for high-volume periods
- Autoscaling capacity for traffic spikes
```
<!-- leetllm: output:end -->

Generating variants requires merging candidate lists without assuming similarity scores across disparate queries are directly comparable. RRF provides a deterministic rank-based merge, rewarding documents that appear consistently near the top across multiple variant searches:

<!-- leetllm: test, output=show -->
```python title="fuse-query-variants-with-rrf.py"
def reciprocal_rank_fusion(rankings: list[list[str]], rank_constant: int = 60) -> list[tuple[str, float]]:
    if rank_constant < 0:
        raise ValueError("rank_constant must be nonnegative")
    scores: dict[str, float] = {}
    for ranking in rankings:
        # A result list ranks distinct documents, not repeated copies of a hit.
        for rank, document_id in enumerate(dict.fromkeys(ranking), start=1):
            scores[document_id] = scores.get(document_id, 0.0) + 1 / (rank_constant + rank)
    return sorted(scores.items(), key=lambda pair: (-pair[1], pair[0]))

ranked_lists = [
    ["rate-limit-policy", "quota-increase", "autoscaling"],
    ["autoscaling", "rate-limit-policy", "backpressure"],
    ["rate-limit-policy", "batch-api", "autoscaling"],
]

for document_id, score in reciprocal_rank_fusion(ranked_lists)[:3]:
    print(f"{document_id}: {score:.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rate-limit-policy: 0.0489
autoscaling: 0.0481
batch-api: 0.0161
```
<!-- leetllm: output:end -->

### 3. Query decomposition (least-to-most)

**Decomposition** is the repair when one search can't collect every fact. Take this comparison:

"Compare synchronous and batch embedding API latency, limits, and retry behavior."

No single document in the corpus covers all three dimensions across both architectures. A naive dense retriever pulls chunks that mention "embedding API", but misses either the batch limits or the retry backoff policy. The repair breaks the prompt into focused sub-queries:

1. "What latency does the synchronous embedding endpoint target?"
2. "What throughput and completion limits does the batch embedding endpoint have?"
3. "What retry behavior applies to each endpoint?"
4. "Compare synchronous and batch embeddings given the latency, limit, and retry facts."

There are two distinct execution topologies for decomposed queries:

1. **Parallel scatter-gather decomposition:** When searches have no dependencies (as in the comparison above, where the endpoint names are already known), they can run concurrently. If $T_i$ measures each search's completion time from the common launch, the wait for all results is $\max(T_1,T_2,T_3)$. Query planning, scheduling, fusion, and final synthesis add work outside that wait; limited concurrency can serialize searches.
2. **Sequential least-to-most chains:** When sub-problems depend on each other, resolve the dependency before constructing the next query. Zhou et al.'s least-to-most prompting studies this decomposition-and-sequential-solving pattern for reasoning; using it with a retriever is an application of that idea.[^zhou2022b] For example, "Find the endpoint with the highest error rate during the last incident, then retrieve its circuit-breaker configuration." Hop 2 needs the endpoint from Hop 1.

A frequent failure mode in decomposed retrieval is **partial-evidence hallucination**: if sub-query 3 returns empty context, the synthesizer can fabricate a plausible retry policy to complete the comparison table. A reliable pipeline explicitly flags missing evidence dimensions instead of guessing.

A real model produces the sub-questions. The rest of the system depends only on the clean line-oriented contract:

<!-- leetllm: test, output=show -->
```python title="3-query-decomposition-least-to-most.py"
import re
from typing import Protocol

class DecompositionModel(Protocol):
    def decompose(self, query: str) -> str: ...

class FakeDecompositionModel:
    def decompose(self, query: str) -> str:
        return "\n".join(
            [
                "What latency does the synchronous embedding endpoint target?",
                "What throughput and completion limits does the batch embedding endpoint have?",
                "What retry behavior applies to each endpoint?",
                "How do synchronous and batch embeddings compare given those facts?",
            ]
        )

def decompose_query(query: str, model: DecompositionModel) -> list[str]:
    lines = [
        re.sub(r"^(?:[-*]|\d+[.)])\s+", "", line.strip()).strip()
        for line in model.decompose(query).splitlines()
    ]
    return list(dict.fromkeys(line for line in lines if line))[:4]

sub_questions = decompose_query(
    "Compare synchronous and batch embedding API latency, limits, and retry behavior.",
    FakeDecompositionModel(),
)

for index, question in enumerate(sub_questions, start=1):
    print(f"{index}. {question}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1. What latency does the synchronous embedding endpoint target?
2. What throughput and completion limits does the batch embedding endpoint have?
3. What retry behavior applies to each endpoint?
4. How do synchronous and batch embeddings compare given those facts?
```
<!-- leetllm: output:end -->

### 4. Step-back prompting (abstraction)

When a query is overloaded with specific runtime parameters, error codes, or customer-specific configurations, direct dense search often fails if the knowledge corpus documents high-level architecture rules, rate limits, or protocols instead of the exact numerical combination.

**Step-back prompting** abstracts the specific inquiry into a broader, foundational question.[^zheng2023stepback] Zheng et al. prompt the model to "step back" and identify the overarching concept or policy behind the question.

The two queries retrieve complementary evidence: the specific query targets error codes and operational telemetry, while the step-back query retrieves governing policies and service limits. Combining both evidence sets prevents high-level policy from obscuring operational specifics.

For instance, consider an operational question:

> **Specific query:** "Why did our client receive an HTTP 429 when sending 120 requests/minute on the tier 2 embedding endpoint?"
> **Step-back query:** "What are the rate limits, burst thresholds, and quota policies for tier 2 embedding endpoints?"

In RAG, the retriever queries the index for *both* the original specific question and the abstracted step-back question. The step-back search retrieves foundational rules and architecture guides, while the specific search retrieves endpoint parameters. The generator conditions on both evidence sets, keeping broad policy from replacing exact diagnosis.

Implement step-back generation behind a clear interface that pairs the original question with its conceptual counterpart. The pair is the boundary: later code can choose retrieval behavior without losing the original wording:

<!-- leetllm: test, output=show -->
```python title="4-step-back-prompting.py"
from typing import Protocol

class StepBackModel(Protocol):
    def step_back(self, query: str) -> str: ...

class FakeStepBackModel:
    def step_back(self, query: str) -> str:
        if "429" in query and "tier 2" in query.lower():
            return "What are the rate limits, burst thresholds, and quota policies for tier 2 embedding endpoints?"
        return query

def generate_step_back_query(query: str, model: StepBackModel) -> str:
    return model.step_back(query).strip()

def plan_step_back_queries(
    query: str, model: StepBackModel
) -> dict[str, str]:
    abstract_query = generate_step_back_query(query, model)
    return {
        "original_query": query,
        "step_back_query": abstract_query,
    }

plan = plan_step_back_queries(
    "Why did our client receive an HTTP 429 when sending 120 requests/minute on tier 2?",
    FakeStepBackModel(),
)

print(f"original:  {plan['original_query']}")
print(f"step-back: {plan['step_back_query']}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
original:  Why did our client receive an HTTP 429 when sending 120 requests/minute on tier 2?
step-back: What are the rate limits, burst thresholds, and quota policies for tier 2 embedding endpoints?
```
<!-- leetllm: output:end -->

```checkpoint
When should you rewrite a query instead of searching the raw user message?
---
Rewrite when history supplies a missing referent. Expansion may help vocabulary mismatch; decomposition separates multiple required facts. Preserve the original question and constraints, then choose the transformation that addresses the observed miss.
```

These transforms change the search object *before* the same hybrid index from earlier chapters runs. They don't grade the chunks that come back. HyDE goes one step further: it changes the *kind* of vector used for search. That makes proxy quality and evidence boundaries matter.

## HyDE (Hypothetical Document Embeddings)

Standard <span data-glossary="dense-retrieval">dense retrieval</span> matches a **query embedding** to **document embeddings**. A question can be short and vague while the relevant passage names a specific policy. That mismatch can hurt retrieval, especially without relevance supervision. It doesn't imply that query and document vectors occupy separate subspaces: retrievers can be trained to align them. HyDE instead uses a generated passage as an intermediate search representation.[^gao2022]

<span data-glossary="hyde">HyDE (Hypothetical Document Embeddings)</span> prompts an instruction-tuned LLM zero-shot to write a **hypothetical document** answering the prompt, embeds that document-style proxy with the corpus *passage encoder*, and retrieves real corpus passages near the resulting vector.[^gao2022] Gao et al. prompt the model to "write a document that answers the question." If you need a throughput-limit clause but can't remember the exact internal phrasing, don't search "Can we handle more traffic?" Have the model generate a hypothetical policy paragraph, and search for documents that match that paragraph's dense representation.

HyDE shifts the geometric origin of the query vector from question space to document passage space without certifying factual correctness. A document-style proxy supplies domain-specific terminology, though hallucinated details can steer retrieval toward unrelated clusters unless verified against benchmark cases.

A developer asks:

> **Query:** "Can we increase embedding throughput during a launch week?"

A standard dense retriever might embed that short question and pull generic "embedding API overview" articles because they share high-frequency terms like "embedding" and "throughput". HyDE instead prompts the model to generate a hypothetical policy paragraph:

> **Hypothetical document:** "Embedding throughput increases: teams can request a temporary tokens-per-minute quota increase, use the batch embedding endpoint for offline jobs, shard requests across approved projects, and apply <span data-glossary="retry-backoff">exponential backoff</span> when <span data-glossary="rate-limit">rate limits</span> are returned..."

That generated paragraph is longer, declarative, and packed with domain vocabulary like "tokens-per-minute quota", "batch embedding endpoint", and "exponential backoff". It serves strictly as a dense retrieval probe rather than grounded evidence. The generated limit might be completely wrong, so only retrieved source text may support the final response.

Cache HyDE proxies and rewrite strings with tenant- and principal-scoped keys (plus policy version), not raw query text alone. A shared string key lets Tenant A's proxy or rewrite serve Tenant B's retrieval path.

### How HyDE works

The original HyDE pipeline has three phases:

1. **Generate:** Prompt an instruction-tuned language model to sample one or more hypothetical passages for the query. The passages may contain fabricated details, but they capture the topical density, syntax, and relevance patterns of real corpus documents.[^gao2022]
2. **Embed:** Encode each sampled passage with the corpus document encoder $f$. Average the vectors to estimate the expected hypothetical-document embedding:[^gao2022]

$$
\hat{\mathbf{v}}_q = \frac{1}{N}\sum_{k=1}^{N} f(\hat{d}_k)
$$

Here $f$ is the document encoder, $\hat{d}_k$ is the $k$-th sampled proxy, and $N$ is the number of samples. Gao et al. also try averaging in the original query vector as one extra hypothesis.
3. **Retrieve:** Search the corpus with that averaged vector. Gao et al. hypothesize that the encoder's dense bottleneck can discard some fabricated detail while retaining useful relevance patterns.[^gao2022] Compression doesn't identify which details are false; a fabricated name or policy can still change the neighbors. Use the same compatible encoder and preprocessing as the corpus. For cosine search, normalize a nonzero mean vector if the backend requires unit vectors; don't silently change the metric.

In production, HyDE pairs an LLM generator with a dense passage encoder. The runnable example below demonstrates the mechanics using lexical sets: the query is expanded into a document-like paragraph, and the retriever scores candidates against the proxy rather than the raw query, surfacing policy passages over generic overviews.

<!-- leetllm: test, output=show -->
```python title="how-hyde-works.py"
from dataclasses import dataclass
from typing import Protocol

class HypotheticalDocGenerator(Protocol):
    def generate(self, query: str) -> str: ...

@dataclass(frozen=True)
class Chunk:
    id: str
    text: str

class FakeHyDEGenerator:
    def generate(self, query: str) -> str:
        return (
            "Embedding throughput increases require a temporary tokens-per-minute "
            "quota request, batch embedding jobs, and exponential backoff for rate limits."
        )

class KeywordRetriever:
    def __init__(self, chunks: list[Chunk]) -> None:
        self.chunks = chunks

    def search(self, search_text: str, k: int = 2) -> list[Chunk]:
        query_terms = set(
            search_text.lower().replace(",", " ").replace(".", " ").split()
        )

        def score(chunk: Chunk) -> int:
            chunk_terms = set(
                chunk.text.lower().replace(",", " ").replace(".", " ").split()
            )
            return len(query_terms & chunk_terms)

        return sorted(self.chunks, key=score, reverse=True)[:k]

def hyde_retrieve(
    query: str, generator: HypotheticalDocGenerator, retriever: KeywordRetriever
) -> list[Chunk]:
    hypothetical_doc = generator.generate(query)
    return retriever.search(hypothetical_doc, k=2)

chunks = [
    Chunk("generic-embeddings", "The embedding API converts text into vectors for search."),
    Chunk(
        "throughput-quota",
        "Launch traffic needs a temporary tokens-per-minute quota request and approval.",
    ),
    Chunk("batch-embeddings", "Batch embedding jobs support offline workloads with retry backoff."),
]

query = "Can we increase embedding throughput during a launch week?"
retriever = KeywordRetriever(chunks)
required_ids = {"throughput-quota", "batch-embeddings"}
routes = {
    "raw question": retriever.search(query),
    "useful proxy": hyde_retrieve(query, FakeHyDEGenerator(), retriever),
    "drifting proxy": retriever.search("The embedding API converts text into vectors for search."),
}
for route, matches in routes.items():
    match_ids = [chunk.id for chunk in matches]
    recall = len(required_ids & set(match_ids)) / len(required_ids)
    print(f"{route}: {match_ids}; required Recall@2={recall:.1f}")
assert required_ids <= {chunk.id for chunk in routes["useful proxy"]}
assert "throughput-quota" not in {chunk.id for chunk in routes["drifting proxy"]}
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw question: ['throughput-quota', 'generic-embeddings']; required Recall@2=0.5
useful proxy: ['throughput-quota', 'batch-embeddings']; required Recall@2=1.0
drifting proxy: ['generic-embeddings', 'batch-embeddings']; required Recall@2=0.5
```
<!-- leetllm: output:end -->

The raw question misses the batch policy, the useful proxy recovers both required chunks, and the drifting proxy loses the quota policy. The corpus, top-k, and gold IDs stay fixed while the search text changes. These keyword traces show how query wording changes lexical retrieval. The useful proxy contains the exact words needed by the authored corpus, while ties retain corpus order. Use retrieved source text as answer evidence; proxies remain search inputs.

In the paper, the actual query vector is an average of document embeddings. With two 3-d proxies below, calculate each coordinate before running it: add the two values, then divide by two:

<!-- leetllm: test, output=show -->
```python title="average-hyde-proxy-vectors.py"
def mean_vector(vectors: list[list[float]]) -> list[float]:
    if not vectors or not vectors[0]:
        raise ValueError("at least one nonempty vector is required")
    count = len(vectors)
    dims = len(vectors[0])
    if any(len(vector) != dims for vector in vectors):
        raise ValueError("all vectors must have the same dimension")
    return [sum(vector[i] for vector in vectors) / count for i in range(dims)]

proxy_a = [0.2, 0.8, 0.1]
proxy_b = [0.4, 0.6, 0.3]
query_vector = mean_vector([proxy_a, proxy_b])
print([round(value, 2) for value in query_vector])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[0.3, 0.7, 0.2]
```
<!-- leetllm: output:end -->

HyDE alters the search representation before retrieval begins. The figure below tracks retrieval scores across three candidate chunks as the search text shifts from raw question to hypothetical proxy:

<figure>
  <img src="illustrations/_generated/hyde_flow_dark.png" alt="Three search representations scored against three source chunks on a zero-to-nine word-overlap scale. The raw question recalls one required policy chunk, the useful HyDE proxy recalls both required chunks, and the drifting proxy recalls one. Each card shows chunk scores and top-two retrieval ranks." />
  <figcaption>Production HyDE encodes a generated document-like passage with the corpus passage encoder, then retrieves source chunks. This chart traces the article’s lexical control on the same three fixed chunks: lowercase text, replace commas and periods with spaces, split into words, then count set intersections. Stable sorting retains the original corpus order for ties; each route returns the top two chunks. Recall@2 treats the quota and batch guides as required. The displayed counts describe lexical overlap in this comparison; the production search ranks dense passage embeddings.</figcaption>
</figure>

In the paper's InstructGPT-based configuration on TREC DL19, Gao et al. report Contriever <span data-glossary="ndcg">nDCG</span>@10 of 44.5 and HyDE nDCG@10 of 61.3. DL20 nDCG@10 moves from 42.1 to 57.9, and they also report gains on BEIR and multilingual Mr. TyDi.[^gao2022] These are the paper's 0-100 ranking scores, not answer-accuracy percentages or a product comparison. A proxy can still invent a high-impact identifier or policy detail, so transfer to your corpus is a hypothesis to test.

### When to use HyDE

HyDE was designed for zero-shot retrieval without relevance labels. Gao et al. evaluate it on web search, BEIR, and multilingual Mr. TyDi tasks.[^gao2022] Use it when users phrase questions differently from stored documents. Skip it when the query already is the identifier you must keep.

Preserve exact identifiers and constraints such as system IDs, error codes, CVEs, commit hashes, dates, and prices. For this assistant, bypassing HyDE on exact lookups is a conservative application policy, not a requirement in the HyDE algorithm. A mixed conceptual query can keep an exact-term search alongside a proxy. If a proxy invents a cause for an incident, it may favor documents matching that cause rather than the relevant incident. We'll call that **hallucination drift**.

The routing classifier preserves exact technical identifiers while routing conceptual questions to HyDE:

<!-- leetllm: test, output=show -->
```python title="route-exact-lookups-around-hyde.py"
import re

EXACT_LOOKUP = re.compile(
    r"\b(?:[A-Z]{2,}-\d+|(?:HTTP|error)\s+[A-Z0-9-]+|\d{4}-\d{2}-\d{2})\b|[$€£]\s*\d",
    re.IGNORECASE,
)

def retrieval_route(query: str) -> str:
    if EXACT_LOOKUP.search(query):
        return "hybrid_exact_preserving"
    return "hyde_candidate"

queries = [
    "What caused error ERR-48291?",
    "Why did HTTP 429 occur on 2026-08-31?",
    "How should we plan embedding throughput for launch traffic?",
]

for query in queries:
    print(f"{retrieval_route(query)}: {query}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
hybrid_exact_preserving: What caused error ERR-48291?
hybrid_exact_preserving: Why did HTTP 429 occur on 2026-08-31?
hyde_candidate: How should we plan embedding throughput for launch traffic?
```
<!-- leetllm: output:end -->

```checkpoint
Why should HyDE be gated away from exact error codes, system IDs, dates, and prices?
---
The hypothetical document can invent precise details. For exact lookups, invented values can pull retrieval toward the wrong chunks, while ordinary hybrid search preserves the user's exact identifier.
```

The regex is a deliberately incomplete guard for known forms, not a security classifier. Unmatched identifiers, version strings, and locale-specific dates need corpus-specific handling. Keep the original query and exact terms available even on a proxy route.

A closer neighborhood still doesn't say whether the next sentence is supported. Should the model retrieve at all, and does this passage back the claim it is about to write?

## Self-RAG (Self-reflective RAG)

Many retrieve-then-generate pipelines fetch context once without a model-generated critique step. <span data-glossary="self-rag">Self-reflective RAG (Self-RAG)</span> instead fine-tunes a generator to emit special **reflection tokens** that control retrieval and score <span data-glossary="candidate-generation">candidate generation</span> segments during autoregressive decoding.[^asai2023]

### Reflection tokens

Self-RAG integrates one retrieval token family and three critique token families directly into the generator's vocabulary:[^asai2023]

1. **`Retrieve`** with values `Yes`, `No`, or `Continue`. This predicts whether to fetch evidence before the next segment (typically a sentence). `No` can avoid unnecessary retrieval. `Continue` reuses prior evidence. Actual latency savings depend on the serving path; a no-retrieval prediction can also be wrong.
2. **`ISREL`**, `Relevant` or `Irrelevant`. The generator predicts passage relevance before its passage-conditioned continuation. Decoding can reward relevant branches or apply hard filtering; the token doesn't automatically establish that every noisy passage was removed.
3. **`ISSUP`**, `Fully supported`, `Partially supported`, or `No support`. After generating a candidate segment, the model predicts support in the passage. A wrong support judgment can still select an unsupported claim.
4. **`ISUSE`**, ratings `1` to `5`. This predicts overall response utility. The decoder maps the rating distribution into a weighted score in $[-1,1]$; that score is not a calibrated probability of helpfulness.

We'll use readable paper-style labels such as `[Retrieve=Yes]` and `[ISSUP=Fully Supported]`. These describe token families, not literal strings to paste into an arbitrary model tokenizer. A deployed checkpoint has its own registered token spellings and token IDs.

Tracing the launch-throughput query through reflection tokens illustrates Self-RAG's active control loop: the model decides whether retrieval is necessary, validates candidate passage relevance, and scores claim entailment before emitting text:

1. `[Retrieve=Yes]`: the model decides it needs external policy evidence before answering.
2. It retrieves a candidate policy passage: *"Temporary tokens-per-minute (TPM) increases require approval. Clients must use exponential backoff after rate-limit errors."*
3. `[ISREL=Relevant]`: the retrieved passage contains actionable quota rules.
4. The model generates: *"For launch traffic, request a temporary TPM increase and keep exponential backoff enabled."*
5. `[ISSUP=Fully Supported]`: the claim is factually supported by the passage.
6. `[ISUSE=4]`: the response is helpful and directly answers the user's intent.

Without reflection tokens, a standard RAG pipeline might have retrieved the same passage without explicitly scoring passage relevance or claim support. Reflection tokens expose the model's predicted judgments for scoring and control; they aren't proof that a claim is true.

### Architecture and segment-level beam search

Self-RAG is more than "retrieve once, then critique at the end." At inference time it can emit a retrieval decision, retrieve top-$k$ passages on demand, generate candidate segments conditioned on different passages in parallel, and score those branches with reflection-token probabilities.[^asai2023]

During decoding, Self-RAG runs a segment-level <span data-glossary="beam-search">beam search</span> (default beam width 2). For each candidate segment $y_t$ conditioned on passage $d$, the beam score balances generation likelihood with a weighted critique score:

$$
\text{Score}(y_t,d)=L(y_t,d)+w_{\text{rel}}s_{\text{rel}}+w_{\text{sup}}s_{\text{sup}}+w_{\text{use}}s_{\text{use}}
$$

Each $s$ normalizes token probabilities within its own family. Thus $s_{\text{rel}}=p_R/(p_R+p_I)$ and $s_{\text{sup}}=(p_F+0.5p_P)/(p_F+p_P+p_N)$. Here $R/I$ mean relevant/irrelevant and $F/P/N$ mean fully/partially/no support. Each $p$ is a token probability at its reflection step; family probabilities do not need to sum to one over the full vocabulary. Utility is $s_{\text{use}}=\sum_{i=1}^{5}a_i p_i/\sum_{i=1}^{5}p_i$ with $a=[-1,-0.5,0,0.5,1]$. The critique reward is **linear**. Utility can be zero or negative, so taking its logarithm would be undefined.[^asai2023]

The paper combines a generation term $L$ with that reward. The released inference code optionally adds the exponential of mean generated-token log probability, and also supports critique-only scoring.[^selfRagInference2026] Check the exact decoder configuration before reproducing results. The scorer below computes the weighted critique-token reward that Self-RAG adds to segment log-probability during beam search.

Asai et al.'s reported default critique weights are 1.0 for `ISREL`, 1.0 for `ISSUP`, and 0.5 for `ISUSE`; they raise the support weight $w_{\text{sup}}$ when citation precision is critical. In the example below, with equal generation likelihood assumed and weights 0.2 / 0.6 / 0.2, Branch A (grounded policy claim) defeats Branch B (an unsupported claim of unlimited traffic), even though Branch B scored slightly higher on user utility:

<figure>
  <img src="illustrations/_generated/self_rag_loop_dark.png" alt="A retrieved policy says temporary tokens-per-minute increases require approval. Candidate A, which follows that clause, receives weighted relevance, support, and utility contributions of 0.184, 0.576, and 0.162, totaling 0.922. Candidate B claims all launch traffic is unlimited and totals 0.534 from contributions 0.190, 0.168, and 0.176. A leads in support by 0.408; B leads in relevance and utility by 0.020; A leads overall by 0.388." />
  <figcaption>The bars show reflection-token probabilities with weights 0.2, 0.6, and 0.2 and equal generation likelihood assumed. The weighted critique reward scores candidate support against retrieved evidence.</figcaption>
</figure>

### Implementation note

Deploying a true Self-RAG system requires a generator specifically fine-tuned to emit these reflection tokens during generation. Asai et al. train Llama 2 7B and 13B generators that way, with a separate Llama 2 7B critic that inserts reflection tokens into supervised examples offline before generator training.[^asai2023] At inference the generator emits the tokens itself; you don't host the critic.

A prompted model can imitate parts of this control loop. Without reflection-token fine-tuning, you're building a **prompted critique loop**: routing, retrieval grading, and answer validation orchestrated in application code. Separate hosted calls can add round-trips; local, batched, or combined checks have different costs. Self-RAG predicts reflection tokens during decoding, but retrieval, passage-conditioned continuations, and critique tokens still add serving work.

Self-RAG cost comes from on-demand retrieval plus branching over multiple passages and scoring those branches, not from a few extra control tokens. Evaluate it where support-aware generation is worth that additional serving path. That path needs a generator trained to emit the tokens. If you only have an ordinary model, what can a separate judge still correct after the first retrieval?

The scoring sketch below executes the family normalization with authored token probabilities. It doesn't call a trained model or implement beam search. Branch A's support distribution is `[0.94, 0.04, 0.02]`, so its support score is `0.94 + 0.5 * 0.04 = 0.96`. Its utility score is 0.81. Check how these become a weighted score of 0.922.

<!-- leetllm: test, output=show -->
```python title="score-self-rag-branches.py"
from dataclasses import dataclass
import numpy as np

def family_score(probabilities: list[float] | np.ndarray, weights: list[float] | np.ndarray) -> float:
    p = np.asarray(probabilities, dtype=np.float64)
    w = np.asarray(weights, dtype=np.float64)
    total = float(np.sum(p))
    if total <= 0:
        raise ValueError("token family must have positive probability mass")
    return float(np.dot(p, w) / total)

@dataclass(frozen=True)
class CandidateSegment:
    text: str
    relevance: list[float]  # relevant, irrelevant
    support: list[float]  # fully, partially, unsupported
    utility: list[float]  # ratings 1 through 5

def branch_score(candidate: CandidateSegment) -> float:
    return (
        0.2 * family_score(candidate.relevance, [1, 0])
        + 0.6 * family_score(candidate.support, [1, 0.5, 0])
        + 0.2 * family_score(candidate.utility, [-1, -0.5, 0, 0.5, 1])
    )

candidates = [
    CandidateSegment("temporary TPM increase requires approval",
                     [0.92, 0.08], [0.94, 0.04, 0.02], [0.01, 0.02, 0.04, 0.20, 0.73]),
    CandidateSegment("all launch traffic is unlimited",
                     [0.95, 0.05], [0.20, 0.16, 0.64], [0, 0, 0.04, 0.16, 0.80]),
]
winner = max(candidates, key=branch_score)

print(f"chosen segment: {winner.text}")
print(f"score: {branch_score(winner):.3f}")
assert abs(branch_score(candidates[1]) - 0.534) < 1e-12
assert family_score([1, 1, 1, 1, 1], [-1, -0.5, 0, 0.5, 1]) == 0
assert family_score([1, 0, 0, 0, 0], [-1, -0.5, 0, 0.5, 1]) == -1
```

<!-- leetllm: output:start -->
```text title="Output" output compact
chosen segment: temporary TPM increase requires approval
score: 0.922
```
<!-- leetllm: output:end -->

## CRAG (Corrective RAG)

<span data-glossary="corrective-rag">Corrective Retrieval-Augmented Generation (CRAG)</span> focuses on evaluation and correction after initial retrieval. It doesn't require retraining the answer generator to emit reflection tokens. A separately trained **retrieval evaluator** scores retrieved documents and selects correction routes; the paper combines it with both ordinary and Self-RAG generators.[^yan2024]

### The evaluator and 3-way confidence routing

In the original paper, the evaluator is a lightweight **T5-large** model fine-tuned to score each retrieved question-document pair on a $[-1, 1]$ range, then threshold those scores into one of three distinct paths:[^yan2024]

1. **Correct ($\max \text{score} > \delta_U$):** At least one document clears the upper threshold. CRAG treats the set as usable and refines its internal evidence. Verify source truth and coverage of every required fact separately.
2. **Incorrect ($\max \text{score} < \delta_L$):** Every document falls below the lower threshold. CRAG discards the internal evidence and searches the web in its paper configuration. This threshold predicts a failure path; inspect the documents separately to assess their relevance.
3. **Ambiguous (otherwise):** Neither condition holds, including threshold equality. CRAG combines refined internal and external evidence. The score alone doesn't determine which fact is missing.

Yan et al. set those thresholds empirically per dataset, for example $0.59$ and $-0.99$ on PopQA.[^yan2024] The sketch below uses a 0-1 teaching scale (`upper=0.7`, `lower=0.2`) so you can check the three-way rule by hand. Don't copy those teaching numbers into production without calibrating on your own labeled evals.

<figure>
  <img src="illustrations/_generated/crag_evaluator_dark.png" alt="The maximum document score on a 0–1 teaching scale selects a CRAG route: 0.17 is Incorrect, 0.45 is Ambiguous, and 0.81 is Correct. Scores below 0.2 discard internal evidence, scores from 0.2 through 0.7 inclusive take the Ambiguous route, and scores above 0.7 refine usable internal evidence. A separate policy gate controls any public search." />
  <figcaption>This teaching scale uses lower 0.2 and upper 0.7 thresholds; equality at either threshold is Ambiguous. The maximum retrieved-document score selects a correction route. Incorrect and Ambiguous routes may propose external evidence; an independent policy gate must allow query egress before public search. The paper uses a different score range with dataset-calibrated thresholds.</figcaption>
</figure>

### Fallback security and data governance

A request for a provider's public API rate limits may justify public web fallback after **Incorrect** retrieval. But a query about your organization's internal infrastructure, customer data, or security runbooks never should: public search engines can't answer internal questions, and sending private queries to third-party search APIs risks catastrophic data leakage.

Guarded web fallback requires production controls:

- **Tenant and data policy gating:** Never export queries containing customer names, proprietary code, or internal hostnames.
- **Query review:** Use an approved public query. Removing names alone can leave confidential intent or other identifying details; sanitization is not authorization.
- **Source and network restrictions:** Allow only approved public sources. Revalidate redirects and resolved addresses; block private, loopback, link-local, and metadata destinations, including IPv6 equivalents.
- **Injection handling:** Treat fetched text as untrusted evidence. Source allowlisting and text sanitization don't prevent every injection; keep tool permissions and policy decisions outside retrieved instructions.

If an internal question can't be answered from internal evidence, the safest action is to refuse and escalate, not search the public web. Retrieval relevance isn't permission to export confidential context.

The classifier assigns each candidate score to an operational route: scores above 0.70 stay internal, scores below 0.20 trigger external retrieval, and intermediate scores combine sources:

<!-- leetllm: test, output=show -->
```python title="route-crag-evaluator-scores.py"
from typing import Literal
import numpy as np

Decision = Literal["correct", "incorrect", "ambiguous"]

def crag_action(scores: list[float] | np.ndarray, lower: float = 0.2, upper: float = 0.7) -> Decision:
    # Teaching 0-1 scale. The paper scores [-1, 1] with dataset-specific thresholds.
    if not 0 <= lower < upper <= 1:
        raise ValueError("thresholds must satisfy 0 <= lower < upper <= 1")
    if not len(scores):
        return "incorrect"  # No evidence: correction still needs policy approval.
    arr = np.asarray(scores, dtype=np.float64)
    best_score = float(np.max(arr))
    if best_score > upper:
        return "correct"
    if best_score < lower:
        return "incorrect"
    return "ambiguous"

print(f"strong retrieval: {crag_action([0.81, 0.15])}")
print(f"weak retrieval: {crag_action([0.10, 0.17])}")
print(f"uncertain retrieval: {crag_action([0.45, 0.09])}")
assert crag_action([0.2]) == crag_action([0.7]) == "ambiguous"
assert crag_action([]) == "incorrect"
```

<!-- leetllm: output:start -->
```text title="Output" output compact
strong retrieval: correct
weak retrieval: incorrect
uncertain retrieval: ambiguous
```
<!-- leetllm: output:end -->

```checkpoint
What separates true Self-RAG from a prompted critique loop?
---
True Self-RAG uses a generator trained to emit retrieval and critique tokens during generation. A prompted critique loop can be useful, but it's application orchestration around a standard model.
```

### Knowledge refinement (decompose-then-recompose)

Even relevant documents contain distracting noise. Long retrieved passages often contain navigation menus, copyright notices, or tangential details that dilute the generator's attention. CRAG introduces a **decompose-then-recompose** algorithm to isolate key facts:

1. **Decompose:** Segment each document into smaller knowledge strips. The paper keeps a one- or two-sentence document as one strip and splits longer passages into units of a few sentences.
2. **Filter:** Score each strip with the retrieval evaluator. Discard strips whose confidence score falls below a filtering threshold $\beta$ (Yan et al. use $\beta = -0.5$).
3. **Recompose:** Concatenate the surviving, high-confidence strips in their original document order to form an information-dense context payload.

The runnable controller below demonstrates the routing contract. It preserves source IDs, caps the number of strips, and denies external web fallback by default. It uses keyword relevance and a deliberately crude sentence splitter; it doesn't reproduce the trained evaluator or bound token length. An application must explicitly supply an approved public query before external search can fire:

The resulting source IDs demonstrate the routing decisions: the correct branch retains internal documentation, the incorrect branch falls back to public sources, and the ambiguous branch merges both. When internal retrieval returns empty and no public fallback is configured, the system terminates without redundant web calls, preventing ungrounded generation.

The returned object is candidate context, not a verified answer. A real adapter must enforce ACLs, source policy, network controls, timeouts, and claim-level support checks separately.

<!-- leetllm: test, output=show -->
```python title="knowledge-refinement.py"
from dataclasses import dataclass
from typing import Literal, Protocol

Decision = Literal["correct", "incorrect", "ambiguous"]

@dataclass(frozen=True)
class Evidence:
    source_id: str
    text: str

@dataclass(frozen=True)
class RequestPolicy:
    # Trusted application input, never populated by the rewrite model.
    approved_public_query: str | None = None

class SearchBackend(Protocol):
    def search(self, query: str, k: int = 5) -> list[Evidence]: ...

class RetrievalEvaluator(Protocol):
    def classify(self, query: str, docs: list[Evidence]) -> Decision: ...
    def is_relevant_strip(self, query: str, strip: str) -> bool: ...

class CorrectiveRetrieval:
    def __init__(self, internal: SearchBackend, evaluator: RetrievalEvaluator,
                 public: SearchBackend) -> None:
        self.internal, self.evaluator, self.public = internal, evaluator, public

    def run(self, query: str, policy: RequestPolicy) -> tuple[str, list[Evidence]]:
        # Internal backend must enforce the caller's ACL before returning hits.
        docs = self.internal.search(query, k=5)
        decision = self.evaluator.classify(query, docs) if docs else "incorrect"
        if decision not in {"correct", "incorrect", "ambiguous"}:
            raise ValueError("unknown retrieval decision")
        context = self.refine(query, docs) if decision != "incorrect" else []
        if decision != "correct":
            if not policy.approved_public_query or not policy.approved_public_query.strip():
                return "needs_authorized_evidence", context
            # A separate reviewed query avoids leaking the private request.
            public_query = policy.approved_public_query
            external = self.refine(public_query, self.public.search(public_query, k=5))
            # Reserve room for both sources when ambiguity triggers a mixed route.
            context = context[:3] + external[:3] if context and external else context + external
        # No answer generation or semantic support verification in this fixture.
        return ("candidate_context" if context else "no_evidence"), context[:6]

    def refine(self, query: str, docs: list[Evidence]) -> list[Evidence]:
        kept: list[Evidence] = []
        seen: set[tuple[str, str]] = set()
        for doc in docs:
            # Simplified splitter: real prose needs sentence-aware segmentation.
            for strip in (part.strip() for part in doc.text.split(".")):
                key = (doc.source_id, strip)
                if strip and key not in seen and self.evaluator.is_relevant_strip(query, strip):
                    kept.append(Evidence(doc.source_id, strip))
                    seen.add(key)
        return kept[:6]

class FakeSearch:
    def __init__(self, docs: list[Evidence]) -> None:
        self.docs, self.calls = docs, []

    def search(self, query: str, k: int = 5) -> list[Evidence]:
        self.calls.append(query)
        return self.docs[:k]

class FakeEvaluator:
    def __init__(self, decision: Decision) -> None:
        self.decision = decision

    def classify(self, query: str, docs: list[Evidence]) -> Decision:
        return self.decision  # Authored branch fixture, not a relevance prediction.

    def is_relevant_strip(self, query: str, strip: str) -> bool:
        return bool({"quota", "tpm", "backoff"} & set(strip.lower().split()))

internal_docs = [Evidence("internal:quota-v3", "TPM increases need internal approval. Old SDK notes.")]
public_docs = [Evidence("public:retry-v2", "Use exponential backoff after rate limits.")]
for decision in ("correct", "incorrect", "ambiguous"):
    internal, public = FakeSearch(internal_docs), FakeSearch(public_docs)
    pipeline = CorrectiveRetrieval(internal, FakeEvaluator(decision), public)
    status, context = pipeline.run("our private TPM process", RequestPolicy("public retry policy"))
    print(decision, status, [item.source_id for item in context])
    assert len(public.calls) == (decision != "correct")
    assert all(call == "public retry policy" for call in public.calls)

public = FakeSearch(public_docs)
blocked = CorrectiveRetrieval(FakeSearch([]), FakeEvaluator("incorrect"), public)
status, context = blocked.run("private project secret", RequestPolicy())
assert status == "needs_authorized_evidence" and not context and not public.calls
print("private fallback:", status, "web_calls=0")
assert blocked.run("private project secret", RequestPolicy("   "))[0] == "needs_authorized_evidence"
assert not public.calls

# Relevant-looking words can survive even when the strip negates the claim.
evaluator = FakeEvaluator("correct")
assert evaluator.is_relevant_strip("TPM increase", "No TPM increase is permitted")
print("keyword overlap is not claim support")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
correct candidate_context ['internal:quota-v3']
incorrect candidate_context ['public:retry-v2']
ambiguous candidate_context ['internal:quota-v3', 'public:retry-v2']
private fallback: needs_authorized_evidence web_calls=0
keyword overlap is not claim support
```
<!-- leetllm: output:end -->

Refinement still starts from one retrieval decision. What happens when the second fact can't be searched until the first fact names it?

## Agentic and iterative retrieval

Self-RAG and CRAG both introduce feedback, but at different boundaries: Self-RAG can make retrieval and critique decisions while generating segments, while CRAG routes after initial retrieval. An application can generalize that feedback into **agentic retrieval**: instead of one fixed retrieve-then-generate pass, a model with tool access searches, reads results, tests whether evidence is sufficient, and either answers or searches again with a refined query.

The mechanism is older than the agent framing. IRCoT studies one version of this pattern: retrieve, reason a step, use that step to drive the next retrieval, and repeat until the chain of evidence is complete.[^trivedi2022] For "Which embedding endpoint has the highest <span data-glossary="p95-latency">p95 latency</span>, and what retry budget applies to that endpoint?", the second search can use the endpoint identified by the first. Compare latency over the same workload and time window. If the first hop is uncertain, preserve that uncertainty or stop rather than guessing an endpoint.

Selecting an appropriate routing tier depends on request complexity and data dependencies. A single-fact FAQ terminates at standard retrieval, whereas multi-hop comparisons require sequential decomposition where evidence from one stage feeds the next:

1. **Naive RAG** for single-fact lookups answerable by one retrieval.
2. **Query rewriting plus hybrid search and reranking** for conversational ambiguity and vocabulary mismatch. This is a practical baseline to evaluate before more expensive routes.
3. **HyDE behind a router** for abstract or vocabulary-mismatched queries where a document-style proxy helps.
4. **A correction gate** (CRAG-style evaluator or prompted critique) when retrieval quality is inconsistent and a single bad context causes user-visible errors.
5. **Iterative or agentic retrieval** for genuinely multi-hop questions, where one retrieval pass can't gather all the facts.

Escalate only when the failure mode and evaluation demand it. On a simple FAQ lookup, an agentic loop can add latency and failure paths without improving retrieved evidence.

These are the basic methods, not limits on possible compositions; adding a router or web tool changes the application. No universal latency ordering follows from their names. That distinction explains the comparison below. Read it by asking which component owns each decision, then check whether each added control changes retrieval, evidence scoring, or both.

```checkpoint
A question needs two facts where the second depends on resolving the first. Which strategy fits, and why not naive RAG?
---
Iterative or agentic retrieval. Naive RAG runs one retrieval pass, so it can't use the answer to the first hop to form the query for the second. Interleaving retrieval with reasoning lets each hop drive the next search.
```

## Comparison of advanced techniques

Choose these techniques by failure mode, not by novelty. HyDE targets semantic mismatch. Self-RAG changes retrieval timing and branch scoring inside a trained generator. CRAG adds a separate correction gate after retrieval.

| Feature | Naive RAG | HyDE | Self-RAG | CRAG |
| :--- | :--- | :--- | :--- | :--- |
| **Retrieval trigger** | Always | Always | Dynamic (`[Retrieve]`) | Always |
| **Search object** | Raw query | Hypothetical document | Raw query plus partial generation | Raw query |
| **Quality check** | None | None; changes the query vector | Predicted relevance, support, and utility tokens | Retrieval evaluator confidence |
| **Who owns the decision** | Application always retrieves | Application generates a proxy, then retrieves | Trained generator during decoding | Separate evaluator after retrieval |
| **External search** | Depends on backend | Depends on corpus | Optional; used in some paper experiments | Web fallback in the paper's ambiguous/incorrect routes |
| **Primary use** | Simple Q&A | Abstract or vocabulary-mismatched queries | High-factuality generation with a specialized model | Inconsistent internal retrieval |
| **Added work** | One retrieval plus generation | Proxy generation and embedding before retrieval | Conditional retrieval and passage-conditioned branches | Evaluator, refinement, and possibly web search |

## What rewrite, HyDE, and CRAG can break

Advanced RAG helps only when it matches the failure. Watch for these symptoms before adding another model call. Rewrite, HyDE, multi-query, and CRAG affect more than quality. They expand the attack and cost surface of retrieval.

Diagnose in order: identify the wrong search object, check evidence scope, then check added calls and trust boundaries. A quality gain without that diagnosis can hide a security or latency regression.

### Symptom: the query is vague, but the answer needs history

The retriever sees only the latest turn, so it searches for "the other one" instead of the backup API key or failed batch job. Rewrite the latest turn into a standalone query using the last few conversation turns. Keep the raw user message for the generator, but search with the rewritten query so the answer can retain conversational context.

### Symptom: rewrite or history poisons retrieval intent

Conversation history, tool output, or a retrieved doc can contain "ignore policy / search secrets / dump all tickets." If the rewrite model treats history as trusted instructions, it can adopt that intent and retrieve privileged neighborhoods. Treat rewrite input as untrusted data. Constrain the prompt to *disambiguate the user's question*, mark tool/page text as data, preserve principal identity and ACL scope, and never let a rewrite broaden grants.

### Symptom: HyDE improves recall on policy questions but breaks exact lookups

The hypothetical document can invent precise identifiers, dates, or prices. That invented detail may pull retrieval toward the wrong neighborhood. Route exact-match queries to normal hybrid retrieval; use HyDE for conceptual or vocabulary-mismatched questions where a document-style proxy helps more than it hurts.

### Symptom: CRAG web fallback becomes SSRF or untrusted-source injection

An "Incorrect" retrieval score triggers an open-web fetch. Without controls, the worker can hit internal metadata endpoints through <span data-glossary="ssrf">server-side request forgery (SSRF)</span> or pull attacker-controlled pages that inject instructions into generation. Use domain allowlists, block links into private networks, fetch in a network <span data-glossary="sandbox">sandbox</span>, treat web HTML as untrusted observations, and require citations from allowlisted sources before generation. Prefer "refuse / escalate" over a wide-open web tool.

### Symptom: rewrite or HyDE cache bleeds across tenants

Caches keyed only on the raw string miss tenant, user, and policy version. User A's rewritten query or HyDE proxy can then serve User B's retrieval path. Key private-context caches by tenant, effective authorization scope, policy version, history/context digest, normalized query, technique, and generator/prompt version; include encoder version for vectors. Two identical follow-ups can refer to different previous turns even for the same user. A role name alone may omit per-document grants. Recheck current authorization on retrieval, and invalidate revoked scope rather than relying on TTL alone. Share only artifacts explicitly classified as public and context-independent.

### Symptom: multi-query / agentic loops become a cost DoS

Decomposition and multi-query fan-out multiply embedding, ANN, and LLM calls per user message. Set hard caps on rewrite count, sub-queries, web fetches, and dollar/<span data-glossary="token-budget">token budgets</span> per request. Fail closed with a partial answer or clarification when the budget trips, instead of letting a loop define its own spend.

### Symptom: prompting imitates the loop without training its retrieval policy

True Self-RAG trains a generator to emit retrieval and critique tokens during generation. Separate prompted grading calls can mimic the control loop, but they don't create the same reflection-token model. Name the system honestly: call it a prompted critique loop or CRAG-style evaluator unless you're hosting a model trained with Self-RAG reflection tokens.

### Symptom: accuracy rises, but users feel the product is slow

Rewriting, HyDE generation, dense retrieval, sparse retrieval, reranking, grading, and final synthesis can become a long sequential path. Parallelize independent retrievals, cap reranker candidates, cache repeated rewrites or hypothetical documents with tenant-safe keys, and measure retrieval and generation latency separately. If supported-answer quality misses its gate, lower latency alone isn't a release win.

## Latency waterfall economics and deployment gates

Don't stack rewrite, HyDE, CRAG, and an agent loop on the first launch-throughput query. Treat each control as an experiment: name the failure, add one intervention, and compare against the same labeled cases.

Advanced RAG pipelines turn one user message into several sequential model and retrieval calls. To set realistic service level objectives (<span data-glossary="slo">SLOs</span>), map out where milliseconds go in the latency waterfall.

### Trace the request before estimating a percentile

There is no portable latency tier for "HyDE" or "CRAG." Model size, hardware, prompt length, queueing, network path, retrieved candidate count, and cache state all matter. Record a request trace under a declared workload. For **time to first token (TTFT)**, stop the end-to-end clock when the first answer token reaches the user; full-answer completion is a different measurement.

Trace an uncached serial rewrite-plus-rerank request across its component stages:

| Stage | Start → finish (ms) | Duration (ms) |
| :--- | :--- | :--- |
| Rewrite | 0 → 120 | 120 |
| Embed rewritten query | 120 → 140 | 20 |
| Hybrid retrieval | 140 → 165 | 25 |
| Rerank candidates | 165 → 215 | 50 |
| Generator startup through first delivered answer token | 215 → 395 | 180 |

This trace gives a TTFT of 395 ms for one authored request. Measure p95 latency under representative load, and measure the target model rather than extrapolating from this fixture. An uncached HyDE route adds proxy generation and encoding before its search. A corrective route adds evaluation and possibly external retrieval. Work can overlap or be skipped, so adding controls does not necessarily produce a fixed latency ordering.

**Can you add component p95s to get end-to-end p95?** No. Calculating end-to-end system tail latency requires aggregating durations per request before evaluating percentiles, because slow requests at separate stages rarely coincide on the same request:

<!-- leetllm: test, output=show -->
```python title="percentiles-from-joint-request-traces.py"
from math import ceil
import numpy as np

def nearest_rank(values: list[int] | np.ndarray, percentile: float) -> int:
    arr = np.asarray(values)
    if arr.size == 0 or not 0 < percentile <= 1:
        raise ValueError("need observations and a percentile in (0, 1]")
    return int(np.sort(arr)[ceil(percentile * len(arr)) - 1])

# Serial durations: (stage A, stage B), in milliseconds.
traces = [(10, 10)] * 18 + [(100, 10), (10, 100)]
stage_a = np.array([a for a, b in traces])
stage_b = np.array([b for a, b in traces])
stage_a_p95 = nearest_rank(stage_a, 0.95)
stage_b_p95 = nearest_rank(stage_b, 0.95)
request_p95 = nearest_rank(stage_a + stage_b, 0.95)
print(f"sum of stage p95s: {stage_a_p95 + stage_b_p95} ms")
print(f"p95 of request totals: {request_p95} ms")
assert (stage_a_p95, stage_b_p95, request_p95) == (10, 10, 110)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sum of stage p95s: 20 ms
p95 of request totals: 110 ms
```
<!-- leetllm: output:end -->

This tiny sample exposes a calculation error; it doesn't estimate a stable production tail. Declare your percentile convention, sample size, workload, and treatment of failures and timeouts.

### Tail latency hazards and fan-out variance

When three searches launch together and all results are required, their wait is $\max(T_1,T_2,T_3)$. Suppose each search finishes within 25 ms with probability 0.95. **If those completion times are independent**, all three finish by 25 ms with probability $0.95^3\approx0.857$, so 14.3% of fan-outs exceed that threshold. With identical independent latency distributions, the fan-out p95 corresponds to each search's $0.95^{1/3}\approx0.983$ quantile. Shared load and query difficulty can correlate the times; measure the actual fan-out instead of assuming independence. Planning and fusion remain outside this wait.

To protect user-facing SLOs:
- **Speculative retrieval:** Evaluate searching the original query while a rewrite runs. Reuse its evidence only if it covers the actual request. A high similarity score on "What do I do now?" cannot recover the missing referent. Cancellation may not stop billed work.
- **Query routing:** Evaluate a cheap router on labeled failure types. There is no universal 85/15 split or latency target; report route frequency, misrouting, and quality on your traffic.
- **Tenant-scoped semantic caching:** Cache common rewrites, HyDE vectors, and reranked contexts with tenant- and permission-aware cache keys.

### Adding controls incrementally

Add a control only when a measured failure needs it:

### Stable baseline
Keep raw-query **hybrid search** (dense retrieval + <span data-glossary="sparse-retrieval">sparse keyword retrieval</span>) as a control. Add rewriting for history-dependent turns, not automatically for every request. Compare retrieved evidence and answer support; a rewrite adds generation work and can also damage an already precise query.

### Add reranking
Add a **<span data-glossary="reranker">cross-encoder reranker</span>** after retrieval when initial retrieval has decent recall but final candidates are noisy. It can improve precision, at moderate cost: <span data-glossary="cross-encoder">cross-encoders</span> are slower than initial retrieval, so keep candidate count small.

### Specialized handling (HyDE / router)
Use a **router** to classify queries. For a conceptual request such as "Explain launch-week embedding throughput planning," evaluate a HyDE route if your labeled cases show vocabulary mismatch. For a precise request such as "What caused error ERR-48291?", choose standard retrieval because HyDE risks inventing or distorting the exact identifier. The router pays HyDE's extra generation only where a document-style proxy helps.

### Add correction loops
If accuracy is still insufficient, add a **prompted critique loop or a CRAG-style evaluator** before investing in a true Self-RAG model. Prompt the model or a lightweight evaluator to grade retrieved documents before answer generation; when evidence is weak, trigger a rewrite, a second retrieval pass, or web fallback. Compare this correction route with Self-RAG on the same evaluation to measure parity.

Don't release a more elaborate route because it improves a few anecdotes. Compare supported-answer quality and latency on a labeled set, then release only paths that meet both requirements. For each route, retain the corpus snapshot, model and retriever versions, candidate count, latency percentiles, token or dollar cost, and citation-support results. Without that evidence, route comparisons aren't reproducible.

The next table supplies decision data for calculating the evaluation metrics. Define supported accuracy as the fraction of all answerable evaluation questions answered correctly with source-supported claims; abstentions on those questions count as failures. Separately score correct abstention on unanswerable cases, citation precision/completeness, and access violations. Measure model performance on a held-out evaluation set.

For a real release, record the sample size, paired baseline changes, important slices, and uncertainty before choosing a threshold. Measure end-to-end p95 at a declared workload, not just retriever latency. Here, the authored gate is supported accuracy at least 0.93 and p95 no more than 350 ms. Compare which route satisfies both gates:

<!-- leetllm: test, output=show -->
```python title="release-a-retrieval-route-from-evals.py"
evaluations = [
    {"route": "rewrite+hybrid", "supported_accuracy": 0.91, "p95_ms": 180},
    {"route": "hyde+rerank", "supported_accuracy": 0.94, "p95_ms": 260},
    {"route": "agentic-loop", "supported_accuracy": 0.95, "p95_ms": 710},
]
minimum_supported_accuracy = 0.93
maximum_p95_ms = 350

eligible = [
    row for row in evaluations
    if row["supported_accuracy"] >= minimum_supported_accuracy
    and row["p95_ms"] <= maximum_p95_ms
]
released = max(eligible, key=lambda row: row["supported_accuracy"], default=None)
if released is None:
    print("hold: no route clears both gates")
else:
    print(f"eligible synthetic route: {released['route']}")
    print(f"supported_accuracy={released['supported_accuracy']:.2f} p95_ms={released['p95_ms']}")
assert max([], key=lambda row: row["supported_accuracy"], default=None) is None
```

<!-- leetllm: output:start -->
```text title="Output" output compact
eligible synthetic route: hyde+rerank
supported_accuracy=0.94 p95_ms=260
```
<!-- leetllm: output:end -->

## Hands-on diagnostics: evaluating query transforms on live misses

Stay with five API-docs messages and measure top-3 evidence hits. This exercise does not need to reproduce paper scores. It should connect each retrieval miss to one intervention and one release decision.

### Exercise: Build a query rewriter for a developer-support assistant

Collect five developer-support messages from an API docs assistant (or write realistic ones). Include one ambiguous message that needs conversation history, one complex comparison, and one vague keyword so each control has a case to test.

Step 1, Rewrite: Write a Python function that takes a developer message plus the last two turns of chat history and outputs a standalone query. Run it on the five messages and inspect the results. Check whether the rewritten query contains full intent while leaving authorization and tenant scope unchanged.

Step 2, Measure: For each original message, manually decide which internal policy documents *should* be retrieved. Run both original and rewritten queries against the same dozen chunks and retrieval configuration. The keyword retriever above is enough to debug the loop; a later dense-encoder run is a separate experiment. Label a <span data-glossary="golden-dataset">gold set</span> of required chunk IDs before inspecting results. For each question, report Hit@3 (any required chunk found), Recall@3 (fraction of required chunks found), and all-required-found (complete evidence coverage). A comparison needing three facts can score Hit@3=1 while missing two of them. Don't assume rewriting wins.

Keep these five examples as development cases, not a release benchmark. Add held-out questions before tuning gates.

Step 3, Diagnose: Pick one message where retrieval still fails. Categorize the failure mode: vocabulary mismatch (try multi-query expansion), semantic asymmetry (try HyDE), or weak evidence (try a CRAG-style evaluator). Implement only that fix and measure again.

Expected outcome: Record which interventions improve top-3 evidence hits or catch weak retrieval on the examples, and which add latency without a gain. A small exercise may not reproduce paper results; its value is exposing the measurement loop.

## Architecture decisions: matching retrieval rungs to failure modes

The exercise should leave you with evidence about retrieval quality, latency, and the shape of each failure. Turn those observations into a route decision before adding a more expensive path. Three deployment questions provide the boundary.

### When does HyDE justify its latency cost?

HyDE adds at least one extra generation call before retrieval. That cost is worth paying only when measured retrieval quality improves enough to justify it. A smaller instruction model may be adequate for the hypothetical document, but evaluate it rather than assuming equivalence. Cache repeated proxy documents only when generation configuration and source policy make reuse valid. For exact-match lookups like incident IDs, error codes, or dates, skip HyDE.

### Cases where Self-RAG adds cost without improving answer quality

Self-RAG degrades when retrieval itself is weak or when the model's learned critique tokens stop correlating with real answer quality. It also raises inference cost because the model may retrieve on demand, branch over multiple passages, and spend extra decoding steps on critique tokens before choosing a continuation. For a simple FAQ bot, first measure a cheaper baseline such as rewrite plus reranking or a correction gate before committing to a specialized Self-RAG serving path.

### Can you combine HyDE and Self-RAG?

As a system design, you can use HyDE to propose initial candidate passages, then let a true Self-RAG model score branches with `ISREL`, `ISSUP`, and `ISUSE`. That composition needs its own evaluation. Neither mechanism guarantees the other improves it. If you don't have a reflection-token model, describe the composition as HyDE plus a CRAG-style evaluator or prompted support checks rather than Self-RAG.

Match a miss to the smallest control that targets it: missing history, unfamiliar wording, a fact that depends on an earlier hop, or a passage that doesn't support the claim. Note what that control still leaves open.

```mastery-quiz
[
  {
    "question": "A developer reports that a batch job failed, then asks, \"How can I retry it?\" The retriever sees only the rewritten search text. Which rewrite preserves intent and security?",
    "options": [
      "Use relevant history to form a standalone failed-batch retry query while preserving the caller’s ACL scope.",
      "Expand the raw turn into action synonyms while excluding history so injected text can't affect the search request.",
      "Generate a document-style HyDE proxy from the raw turn and let semantic similarity resolve the missing referent.",
      "Search the raw turn with a larger top-k, then let the answer model infer which prior event the developer meant."
    ],
    "answer": "Use relevant history to form a standalone failed-batch retry query while preserving the caller’s ACL scope.",
    "explanation": "History identifies the failed batch job. A standalone retry query repairs the missing referent without authorizing an action or broadening grants. More variants or a larger top-k cannot reliably recover context the retriever never sees."
  },
  {
    "question": "Three query variants rank source IDs as [quota, batch, overview], [batch, overview, quota], and [batch, quota, overview], with the best match first. Reciprocal rank fusion adds 1/(40 + rank) for each appearance, starting at rank 1. Which source wins, and what is its score to five decimal places?",
    "options": [
      "quota, 0.02439",
      "batch, 0.07259",
      "quota, 0.07317",
      "batch, 0.07439"
    ],
    "answer": "batch, 0.07259",
    "explanation": "Batch ranks second, first, and first, so it scores 1/42 + 2/41 ≈ 0.07259. Quota scores 1/41 + 1/43 + 1/42 ≈ 0.07146, and overview scores 2/43 + 1/42 ≈ 0.07032. Using only the first list gives quota 0.02439. Merging by list position gives quota all three first-place contributions, or 0.07317, even though batch holds first place in the other two lists. Starting ranks at zero gives batch 0.07439."
  },
  {
    "question": "HyDE samples proxy vectors [0.1, 0.5, 0.9] and [0.7, 0.3, 0.1]. Under component-wise averaging, which vector enters search before any required metric normalization?",
    "options": [
      "[0.8, 0.8, 1.0]",
      "[0.1, 0.5, 0.9]",
      "[0.4, 0.4, 0.5]",
      "[0.7, 0.5, 0.9]"
    ],
    "answer": "[0.4, 0.4, 0.5]",
    "explanation": "Pair the values in each coordinate and divide their sum by two. The three means are (0.1 + 0.7)/2 = 0.4, (0.5 + 0.3)/2 = 0.4, and (0.9 + 0.1)/2 = 0.5. The vector [0.8, 0.8, 1.0] gives the sums before division. The vector [0.1, 0.5, 0.9] copies the first proxy, and [0.7, 0.5, 0.9] takes the larger value in each pair."
  },
  {
    "question": "A standard LLM is called separately to route retrieval, grade passages, and check support. It was never trained to emit Retrieve, ISREL, ISSUP, or ISUSE tokens during decoding. How should the system be described?",
    "options": [
      "A CRAG implementation, because any separate relevance grader defines CRAG regardless of its correction routes.",
      "A true Self-RAG service, because application calls reproduce the four reflection decisions at inference time.",
      "A HyDE pipeline, because support grading converts generated answers into document-style retrieval proxies.",
      "A Self-RAG-inspired critique loop, because application orchestration imitates controls without a reflection-token model."
    ],
    "answer": "A Self-RAG-inspired critique loop, because application orchestration imitates controls without a reflection-token model.",
    "explanation": "True Self-RAG fine-tunes the generator to emit retrieval and critique tokens while producing segments. Separate calls can implement useful routing and support checks, but their control lives in application code."
  },
  {
    "question": "Two Self-RAG branches have equal generation likelihood. Their scores for relevance, support, and utility are [0.8, 0.9, 0.4] for A and [0.9, 0.3, 0.8] for B. The critique weights are 0.2 for relevance, 0.6 for support, and 0.2 for utility. Which branch wins, and what is its weighted critique score?",
    "options": [
      "B with 0.76",
      "A with 0.78",
      "B with 0.34",
      "A with 0.70"
    ],
    "answer": "A with 0.78",
    "explanation": "A scores 0.16 + 0.54 + 0.08 = 0.78. B scores 0.18 + 0.18 + 0.16 = 0.52. A wins because its lead in support outweighs B’s gains in relevance and utility. Swapping the relevance and support weights gives B 0.76 and A 0.74. Dropping support gives B 0.34 and A 0.24. An unweighted mean gives A 0.70 and B about 0.67. Check the winning claim against the retrieved passage."
  },
  {
    "question": "A CRAG teaching router uses lower = 0.25 and upper = 0.75 on a 0–1 scale. Retrieved-document scores are [0.55, 0.12]. Which path follows from the best score?",
    "options": [
      "Treat retrieval as correct, refine only internal strips, and generate from the surviving internal evidence.",
      "Treat retrieval as incorrect, discard internal results, and refine only the external-search evidence.",
      "Treat retrieval as ambiguous, refine internal and external evidence, and combine both before generation.",
      "Treat retrieval as unresolved, raise top-k, and bypass the evaluator until one score crosses the upper threshold."
    ],
    "answer": "Treat retrieval as ambiguous, refine internal and external evidence, and combine both before generation.",
    "explanation": "The best score is 0.55. It is neither above 0.75 nor below 0.25, so the ambiguous branch combines refined internal and approved external candidate evidence. Real thresholds require calibration; external search still needs authorization."
  },
  {
    "question": "A request asks which repository supplied the latest deployment, then asks for that repository’s rollback procedure. Which plan preserves the dependency?",
    "options": [
      "Resolve the repository from deployment evidence, then use its identity in a bounded rollback-procedure search.",
      "Search every repository’s rollback guide in parallel and pick the guide with the highest similarity.",
      "Generate a likely repository name and rollback plan, then search for evidence matching that guess.",
      "Search once for deployment and rollback terms, then fill an absent repository identity from common practice."
    ],
    "answer": "Resolve the repository from deployment evidence, then use its identity in a bounded rollback-procedure search.",
    "explanation": "The second query needs the repository identity returned by the first. Preserve that source lineage and uncertainty. Parallel independent variants cannot safely invent the missing identity."
  },
  {
    "question": "A rewrite and HyDE cache uses only normalized query text as its key. Two tenants ask the same question under different grants and policy versions. Which cache strategy prevents cross-scope reuse?",
    "options": [
      "Key by normalized query and model version, then verify tenant grants only when the cached artifact produces retrieval hits.",
      "Key by effective scope, policy and model versions, history digest, query, and technique; recheck current grants.",
      "Key by tenant and normalized query, then share cached proxies among principals because document retrieval still applies ACL filters.",
      "Key by principal and raw query, then omit policy version because cached rewrites contain search intent rather than policy data."
    ],
    "answer": "Key by effective scope, policy and model versions, history digest, query, and technique; recheck current grants.",
    "explanation": "A proxy or rewrite can encode tenant-specific vocabulary and policy context. Query-only keys can cross scopes or reuse the wrong conversation. Include context and configuration in the key; cache hits never replace current authorization checks."
  },
  {
    "question": "Twenty-four serial traces have durations (20, 20) ms twenty-two times, (150, 20) once, and (20, 150) once. With nearest-rank p95, each stage p95 is 20 ms. What is the end-to-end p95?",
    "options": [
      "40 ms",
      "300 ms",
      "170 ms",
      "150 ms"
    ],
    "answer": "170 ms",
    "explanation": "Add the two stages within each request, then sort the totals. Ranks 1 through 22 are 40 ms. Ranks 23 and 24 are 170 ms because the stalls occur on different requests. Rounding 0.95 × 24 = 22.8 up gives rank 23, so the end-to-end p95 is 170 ms. Adding the two stage p95s gives 40 ms. Adding the two stage maxima gives 300 ms, although no request had both stalls. Taking the longest stage alone gives 150 ms and leaves out the other stage. A production estimate needs representative request traces."
  },
  {
    "question": "CRAG marks internal retrieval incorrect and proposes open-web fallback for a private policy question. Which design preserves the correction benefit without turning fallback into an SSRF or injection path?",
    "options": [
      "Permit arbitrary HTTPS fetches, but remove script tags before passing page text to the answer generator.",
      "Search the open web broadly, then ask the same evaluator to decide whether private-network pages are trustworthy.",
      "Deny private-query export; use approved public queries only, with source/network controls and supported citations.",
      "Disable citation checks for fallback results, because external evidence has already passed a retrieval-quality evaluator."
    ],
    "answer": "Deny private-query export; use approved public queries only, with source/network controls and supported citations.",
    "explanation": "A relevance score can't authorize sending private policy questions to the web, and public pages can't establish internal policy. Approved public searches still need SSRF controls and untrusted-content handling. Refuse or seek an authorized source when evidence is missing."
  }
]
```

> **Next:** Continue to [GraphRAG & Knowledge Graphs](/learn/graphrag-knowledge-graphs-vector-search). Query rewriting, HyDE, Self-RAG, and CRAG help a system recover better passages for one question. Some questions instead depend on relationships scattered across a corpus; <span data-glossary="graphrag">GraphRAG</span> adds entity graphs and hierarchical community reports for that broader retrieval problem.
