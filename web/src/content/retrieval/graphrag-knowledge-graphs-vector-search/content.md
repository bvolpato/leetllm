---
{
  "id": "graphrag-knowledge-graphs-vector-search",
  "slug": "graphrag-knowledge-graphs-vector-search",
  "title": "GraphRAG & Knowledge Graphs",
  "shortDescription": "Top-k vector search answers single-document lookups well, yet misses multi-hop dependencies and corpus-wide themes. Build entity graphs, Leiden communities, and local/global GraphRAG retrieval.",
  "difficulty": "Hard",
  "category": "RAG & Retrieval",
  "section": "Advanced Agents & Retrieval",
  "coverImage": "illustrations/_generated/graphrag_dark.png",
  "companies": [
    "Microsoft",
    "Google",
    "Neo4j",
    "Amazon",
    "Salesforce"
  ],
  "order": 3,
  "keyConceptsTested": [
    "Knowledge Graphs",
    "Property Graphs",
    "Community Detection",
    "Leiden Algorithm",
    "Community Reports",
    "Entity Extraction",
    "Relationship Modeling",
    "Global vs Local Search",
    "Hybrid Graph-Vector Retrieval",
    "DRIFT Search",
    "LazyGraphRAG",
    "Community-report ACL continuity",
    "Authz before map-reduce"
  ],
  "prerequisites": [
    "vector-database-internals-hnsw-ivf",
    "advanced-rag-query-rewriting-self-rag",
    "design-production-rag-pipeline",
    "hybrid-search-dense-sparse-retrieval",
    "rag-evaluation-faithfulness-relevance"
  ],
  "relatedQuestions": [
    "enterprise-rag-security-rbac-access-control",
    "structured-output-constrained-generation",
    "agent-memory-persistence-patterns",
    "multi-agent-dags-langgraph-orchestration"
  ]
}
---

Imagine an engineering archive with 10,000 service postmortems, architecture notes, and trace summaries. Ask a standard vector search engine, *"What is the timeout for the embeddings API?"*, and top-5 similarity search pulls the exact specification paragraph in milliseconds. Now ask, *"What are the top three recurring reasons model-serving services breach their latency <span data-glossary="slo">SLO</span> across the fleet?"* Top-5 similarity search returns five near-duplicate cache postmortems from one service and misses queue starvation and configuration drift happening everywhere else.

The previous chapter showed how query rewriting, HyDE, Self-RAG, and CRAG sharpen what <span data-glossary="rag">RAG</span> retrieves for one question. **<span data-glossary="graphrag">GraphRAG</span>** changes the underlying index itself.[^edge2024][^pan2024] Alongside text chunk <span data-glossary="embedding">embeddings</span>, it extracts entities and relationships into a graph, clusters tightly connected subgraphs into communities, and summarizes those communities into hierarchical reports.[^microsoft2025graphragindex][^microsoft2025graphragdataflow] That extra structure lets retrieval follow multi-hop links across separate documents or synthesize themes across the entire corpus.

## Why small top-k vector search hits a ceiling

Vector similarity excels when the answer lives inside a handful of semantically close chunks (**local queries**). It struggles on two other query shapes:

1. **Global sensemaking queries** ask about patterns across thousands of documents, where no single chunk holds the fleet-wide answer. Near-duplicate documents crowd the <span data-glossary="top-k">top-k</span> slots, while simply raising `k` blows up prompt tokens and risks mid-context attention drops ("lost in the middle").[^liu2023lost]
2. **Multi-hop entity queries** require bridging separate records through a shared entity that the user's question never named.

GraphRAG moves clustering and summarization **offline** during indexing, creating four artifacts: source text units, extracted entities, relationships, and hierarchical community reports.[^edge2024]

| Dimension | Standard Vector RAG | GraphRAG |
|:---|:---|:---|
| **Indexed artifacts** | Embedded text chunks | Text units, entities, relationships, community reports |
| **Sweet spot** | Direct lookups ("What is X?") | Multi-hop entity links and corpus-wide themes |
| **Query-time context** | Top-k similarity chunks | Ranked mixed graph/text context or report map-reduce |
| **Indexing work** | Chunk embedding (+ BM25) | LLM or NLP extraction, Leiden clustering, report generation |
| **Query cost** | One retrieval + one generation | Local: moderate; Global: map-reduce over report batches |

<figure>
  <img src="illustrations/_generated/local_global_scope_dark.png" alt="Local search ranks mixed candidate records for one entity question: the candidate 0.98-score, 30-token relationship and 0.91-score, 55-token text unit fit an 85-of-90-token budget, while an 80-token report does not fit. Global search maps community reports in batches and returns cache, queue, and config report points. This walkthrough batches two reports per prompt; production GraphRAG packs by token limits." />
  <figcaption>Local search packs the highest-scoring graph and text records into a fixed token budget (85 of 90 tokens here). Global search maps batches of community reports in parallel and reduces their rated points into a corpus-wide answer.</figcaption>
</figure>

> **Common mistake:** Treating community report ratings as statistical frequency counts. Global search surfaces recurring *themes*, not exact counts. If a user literally needs the three most *frequent* root causes across 10,000 incidents, deduplicate the records by ID, classify them with a consistent taxonomy, and count them directly.

## A concrete multi-hop example

Consider three short records from our model-serving archive:

- **Record 1842:** `inference-api` depends on `redis-cache`. Release `2026.06.14` of `inference-api` ran in `us-east-1`. Cache evictions and higher p95 latency appeared during that release.
- **Record 2031:** `redis-cache` in `us-east-1` still uses the old `maxmemory` policy. The config migration is blocked by a compatibility test.
- **Record 3155:** `inference-api` breached its latency SLO twelve minutes after deploy; reverting restored latency.

Now ask: **"Why did `inference-api` breach the latency SLO, and is this likely to happen again?"**

Because Record 2031 never mentions `inference-api` or latency, a top-2 retriever returns Records 3155 and 1842 and misses Record 2031 completely. Now add extracted directed edges with source-chunk citations:

- `(inference-api) --[depends_on]--> (redis-cache)` *(source: 1842)*
- `(redis-cache) --[uses_policy]--> (old maxmemory policy)` *(source: 2031)*
- `(old maxmemory policy) --[migration_blocked_by]--> (compatibility test)` *(source: 2031)*

Starting from `inference-api` and walking two hops through `redis-cache` pulls Record 2031 directly into context. Notice also what the graph *does* and *does not* prove: it connects the latency spike, cache dependency, and unresolved `maxmemory` setting, giving an engineer a concrete hypothesis to investigate, while every hop must carry a valid source chunk ID so unsupported claims cannot slip into the path:

<!-- leetllm: test, output=show -->
```python title="require-lineage-for-graph-paths.py"
from dataclasses import dataclass


@dataclass(frozen=True)
class Edge:
    source: str
    relation: str
    target: str
    source_chunks: tuple[str, ...]


def cited_path(edges: list[Edge], known_chunks: set[str]) -> tuple[bool, list[str]]:
    if not edges or any(not e.source_chunks for e in edges):
        return False, []
    if any(left.target != right.source for left, right in zip(edges, edges[1:])):
        return False, []
    if any(chunk not in known_chunks for e in edges for chunk in e.source_chunks):
        return False, []
    return True, sorted({chunk for e in edges for chunk in e.source_chunks})


path = [
    Edge("inference-api", "depends_on", "redis-cache", ("incident-1842",)),
    Edge("redis-cache", "uses_policy", "old maxmemory policy", ("incident-2031",)),
]
uncited_path = path + [Edge("old maxmemory policy", "will_cause", "future SLO breach", ())]
known = {"incident-1842", "incident-2031"}

print("connected cited path:", cited_path(path, known))
print("uncited claim:       ", cited_path(uncited_path, known))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
connected cited path: (True, ['incident-1842', 'incident-2031'])
uncited claim:        (False, [])
```
<!-- leetllm: output:end -->

## Property graphs vs. Graph Neural Networks

A knowledge graph stores **triples** `(Subject) -[Predicate]-> (Object)`. In a **property graph**, both nodes and edges carry rich attributes (`type`, `description`, `weight`, `source_chunk_ids`, timestamps) so retrieval can filter, rank, and cite exact chunks.

Identify entities by `(canonical_title, canonical_type)` within a tenant/environment scope, never by raw title alone: `Service:gateway` and `Datastore:gateway` are different components.

Keep **graph traversal** separate from **<span data-glossary="graph-neural-network">Graph Neural Networks (GNNs)</span>**. GraphRAG's standard pipeline walks stored edges and summarizes communities without training any graph neural model. A GNN or <span data-glossary="message-passing-neural-network">Message-Passing Neural Network (MPNN)</span> learns neural representations by aggregating neighbor feature vectors across layers (for instance, averaging scalar neighbor signals `0.4` and `0.8` into `0.6` to predict node properties or missing links).[^kipf2016gcn][^gilmer2017mpnn] You can combine GNN link prediction with RAG for ranking, but treat predicted edges as hypotheses until backed by source text.

```checkpoint
Why should every extracted relationship store both source chunk IDs and typed endpoints?
---
Source chunk IDs let answers trace every hop back to verbatim text, while endpoint types prevent same-named components (such as a Service and a Datastore both named "gateway") from silently merging into one node.
```

## Phase 1: Building the GraphRAG index

Microsoft's GraphRAG indexing pipeline transforms raw text chunks into four linked artifacts: entities, relationships, hierarchical communities, and community reports.[^microsoft2025graphragindex][^microsoft2025graphragdataflow]

### Step 1: Entity extraction and typed resolution

<figure>
  <img src="illustrations/_generated/entity_graph_dark.png" alt="Three extracted entities form a directed path: inference-api (Service), Redis Cache (Datastore), and Old Maxmemory Policy (ConfigPolicy). The depends_on edge cites source 1842 and uses_policy cites source 2031; the Redis Cache identity carries both source IDs." />
  <figcaption>Entity resolution merges mentions of Redis Cache across Records 1842 and 2031 under one typed identity while keeping each edge tied to its own source record.</figcaption>
</figure>

For each text unit, an LLM with <span data-glossary="structured-output">structured output</span> (or an NLP extractor in lightweight variants[^microsoft2025graphragmethods]) proposes typed entities and directed relationships. After per-chunk extraction, **<span data-glossary="entity-resolution">entity resolution</span>** merges duplicate mentions sharing `(canonical_title, canonical_type)` (plus reviewed aliases), unions their `source_chunk_ids`, and combines their descriptions into a single node and edge table.[^edge2024][^microsoft2025graphragdataflow][^microsoft2025graphragoutputs]

The runnable builder below resolves entities by typed canonical key, rejects ambiguous untyped edge endpoints, and constructs an adjacency index:

<!-- leetllm: test, output=show -->
```python title="build-resolved-property-graph.py"
from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class Entity:
    name: str
    type: str
    description: str
    source_chunks: list[int] = field(default_factory=list)


@dataclass
class Relationship:
    source: str
    source_type: str
    target: str
    target_type: str
    relation: str
    weight: float
    source_chunks: list[int] = field(default_factory=list)


def norm(text: str) -> str:
    return " ".join(text.casefold().split())


def build_graph(entities: list[Entity], rels: list[Relationship]) -> dict:
    nodes: dict[tuple[str, str], Entity] = {}
    by_name: dict[str, list[tuple[str, str]]] = defaultdict(list)

    for e in entities:
        key = (norm(e.name), norm(e.type))
        if key not in nodes:
            nodes[key] = Entity(e.name, e.type, e.description, sorted(set(e.source_chunks)))
            by_name[key[0]].append(key)
        else:
            existing = nodes[key]
            existing.source_chunks = sorted(set(existing.source_chunks + e.source_chunks))
            if e.description not in existing.description:
                existing.description = f"{existing.description}; {e.description}"

    def resolve(name: str, etype: str) -> tuple[str, str]:
        if etype:
            key = (norm(name), norm(etype))
            if key in nodes:
                return key
            raise ValueError(f"unknown typed entity: {name!r} ({etype})")
        matches = by_name.get(norm(name), [])
        if len(matches) != 1:
            raise ValueError(f"ambiguous or unknown untyped entity: {name!r} -> {matches}")
        return matches[0]

    out_edges: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for r in rels:
        src = resolve(r.source, r.source_type)
        dst = resolve(r.target, r.target_type)
        out_edges[src].append({
            "target": dst, "relation": r.relation,
            "weight": r.weight, "source_chunks": sorted(set(r.source_chunks)),
        })
    return {"nodes": nodes, "out_edges": dict(out_edges)}


raw_entities = [
    Entity("inference-api", "Service", "Inference API service", [1842]),
    Entity("Redis Cache", "Datastore", "Shared cache dependency", [1842]),
    Entity("Redis Cache", "Datastore", "Cache in us-east-1", [2031]),
    Entity("Old Maxmemory Policy", "ConfigPolicy", "Legacy eviction setting", [2031]),
]
raw_rels = [
    Relationship("inference-api", "Service", "Redis Cache", "Datastore", "depends_on", 1.0, [1842]),
    Relationship("Redis Cache", "Datastore", "Old Maxmemory Policy", "ConfigPolicy", "uses_policy", 0.9, [2031]),
]

graph = build_graph(raw_entities, raw_rels)
print("nodes:", [f"{e.type}:{e.name} {e.source_chunks}" for e in graph["nodes"].values()])
for src, edges in graph["out_edges"].items():
    for edge in edges:
        print(f"edge:  {graph['nodes'][src].name} -[{edge['relation']}]-> {graph['nodes'][edge['target']].name} {edge['source_chunks']}")

# Ambiguous untyped reference check:
try:
    build_graph(
        [Entity("gateway", "Service", "API", [8]), Entity("gateway", "Datastore", "DB", [9])],
        [Relationship("gateway", "", "gateway", "Service", "depends_on", 0.5, [10])],
    )
except ValueError as err:
    print("rejected:", err)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
nodes: ['Service:inference-api [1842]', 'Datastore:Redis Cache [1842, 2031]', 'ConfigPolicy:Old Maxmemory Policy [2031]']
edge:  inference-api -[depends_on]-> Redis Cache [1842]
edge:  Redis Cache -[uses_policy]-> Old Maxmemory Policy [2031]
rejected: ambiguous or unknown untyped entity: 'gateway' -> [('gateway', 'service'), ('gateway', 'datastore')]
```
<!-- leetllm: output:end -->

### Step 2: Community detection with the Leiden algorithm

Walking edges one by one does not answer fleet-wide questions. GraphRAG projects the entity graph into an undirected weighted graph and runs **hierarchical Leiden** clustering to partition entities into densely connected communities.[^traag2019][^graphragClustering2026]

Unlike the older Louvain algorithm, which can leave communities internally disconnected after moving a bridge node, Leiden adds a refinement pass that guarantees every detected community is internally connected.[^traag2019] Microsoft's GraphRAG wrapper optimizes **Newman modularity** $Q$ (at resolution 1.0), which measures how many more edges fall *inside* communities than expected under a degree-preserving random null model:[^graphragLeidenWrapper2026]

$$
Q = \frac{1}{2m} \sum_{i,j} \left[ A_{ij} - \frac{k_i k_j}{2m} \right] \delta(c_i, c_j)
$$

Here $A_{ij} \in \{0, 1\}$ is the adjacency matrix, $k_i$ and $k_j$ are node degrees, $m$ is the total number of undirected edges, and $\delta(c_i, c_j) = 1$ if nodes $i$ and $j$ share a community ($0$ otherwise). Putting every node in one single community yields $Q = 0$; cleanly separating dense clusters yields positive $Q$:

<!-- leetllm: test, output=show -->
```python title="score-community-modularity.py"
from collections import defaultdict


def modularity(
    nodes: list[str], edges: list[tuple[str, str]], community: dict[str, str]
) -> float:
    adj: dict[str, set[str]] = defaultdict(set)
    for u, v in edges:
        adj[u].add(v)
        adj[v].add(u)
    two_m = 2 * len(edges)
    total = sum(
        (1.0 if j in adj[i] else 0.0) - (len(adj[i]) * len(adj[j])) / two_m
        for i in nodes for j in nodes
        if community[i] == community[j]
    )
    return total / two_m


nodes = [
    "inference-api", "redis-cache", "us-east-1", "old-maxmemory",
    "compatibility-test", "eval-harness", "flaky-judge",
]
edges = [
    ("inference-api", "redis-cache"), ("inference-api", "us-east-1"),
    ("redis-cache", "us-east-1"), ("redis-cache", "old-maxmemory"),
    ("old-maxmemory", "compatibility-test"), ("eval-harness", "flaky-judge"),
]
one_group = {n: "all" for n in nodes}
two_groups = {n: ("eval" if n in {"eval-harness", "flaky-judge"} else "cache") for n in nodes}

print("one community Q:", round(modularity(nodes, edges, one_group), 3))
print("cache vs eval Q:", round(modularity(nodes, edges, two_groups), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
one community Q: 0.0
cache vs eval Q: 0.278
```
<!-- leetllm: output:end -->

Hierarchical Leiden recursively subdivides large communities down to a target size threshold, producing a **forest** of nested themes (Level 0 holds broad top-level communities, Level 1 and deeper hold finer sub-communities; Edge et al. report 34 Level-0 communities on their podcast corpus and 55 on their news corpus).[^edge2024][^microsoft2025graphragdataflow]

<figure>
  <img src="illustrations/_generated/community_hierarchy_dark.png" alt="A sample latency query applies a 0.5 relevance threshold to a two-root community forest. Serving at 0.9 passes, then Cache at 0.8 and Queue at 0.7 pass; Eval at 0.1 prunes its branch, so Judges and Metrics stay unrated. In a counterfactual where Serving scores 0.2, Cache's candidate score of 0.8 stays unseen because the selector stops at the root." />
  <figcaption>In dynamic community selection, root reports are rated first. Serving (0.9) passes the 0.5 threshold and expands to Cache and Queue; Eval (0.1) prunes its branch. A false negative on Serving (0.2) would hide Cache (0.8) below it.</figcaption>
</figure>

### Step 3: Community reports and authorization continuity

For every community in the hierarchy, an LLM generates a structured **Community Report**: title, executive summary, key findings linked back to entity/relationship IDs, and a 0-10 **impact rating**.[^graphragReportPrompt2026] Remember that the impact rating reflects general severity in the corpus, not relevance to the current user's question.

Because each community report compresses dozens or hundreds of chunks into one summary, it creates a subtle **indirect leakage** hazard when your corpus has document-level <span data-glossary="acl">access control lists (ACLs)</span>:

| Text unit | ACL | Fact inside chunk |
|---|---|---|
| `tu-public-slo` | `all-staff` | p95 latency SLO is 200 ms |
| `tu-security-key` | `security-only` | key rotation requires break-glass approval |
| `tu-public-runbook` | `all-staff` | restart cache before scaling out |

If one community report summarizes all three chunks and global search hands that report to a regular engineer, the restricted key-rotation fact enters model context even though chunk-level vector search blocked `tu-security-key`.

> **Key insight:** **Authz before map-reduce.** A derived community report's permitted audience is the **intersection** of the permissions of *every* contributing source at its current version. Enforce access checks before a report enters the prompt, and invalidate affected reports immediately whenever a source chunk is edited, deleted, or revoked.

Three production patterns maintain ACL continuity for community reports:
1. **Equivalence-class partitioning:** Build separate community hierarchies within homogeneous permission scopes (for example, an `all-staff` graph built solely from `all-staff` documents).
2. **Query-time dynamic summarization:** Filter to the caller's permitted chunks first, then summarize on the fly (practical with LazyGraphRAG-style deferred synthesis).
3. **Drop with local fallback:** Exclude any precomputed report containing an unauthorized source chunk; if too many reports drop, fall back to authorized local entity search.

We develop multi-tenant ACL architecture in depth in [RAG Security & Access Control](/learn/enterprise-rag-security-rbac-access-control).

```checkpoint
Why can community reports leak restricted data even when vector chunk search enforces ACLs?
---
A precomputed report summarizes many chunks together. If even one contributing chunk is restricted, passing the report to an unauthorized user exposes that fact without ever fetching the chunk directly. The caller must be authorized to read every contributing source.
```

## Phase 2: Querying the graph (Local, Global, and DRIFT)

GraphRAG exposes four query modes: **Basic Search** (plain vector chunk baseline), **Local Search**, **Global Search**, and **DRIFT Search**.[^microsoft2025graphraglocal][^microsoft2025graphragglobal][^microsoft2025graphragdrift]

### Local search: entity-focused context packing

Local search maps the user's question to semantically related entities, expands their graph neighborhood, and packs the highest-scoring entities, relationships, community reports, and linked source text units into the prompt's <span data-glossary="token-budget">token budget</span>.[^microsoft2025graphraglocal]

<!-- leetllm: test, output=show -->
```python title="local-neighborhood-and-token-packer.py"
from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class Candidate:
    source: str
    score: float
    tokens: int
    citation: str


def expand_hops(out_edges: dict[str, list[dict]], seeds: list[str], hops: int = 2) -> list[str]:
    visited, frontier = set(seeds), set(seeds)
    for _ in range(hops):
        nxt: set[str] = set()
        for node in frontier:
            nxt.update(e["target"] for e in out_edges.get(node, []))
            for src, edges in out_edges.items():
                if any(e["target"] == node for e in edges):
                    nxt.add(src)
        frontier = nxt - visited
        visited.update(frontier)
    return sorted(visited)


def pack_context(candidates: list[Candidate], token_budget: int) -> list[Candidate]:
    order = np.argsort([-c.score for c in candidates])
    selected, used = [], 0
    for idx in order:
        item = candidates[int(idx)]
        if used + item.tokens <= token_budget:
            selected.append(item)
            used += item.tokens
    return selected


edges = {
    "inference-api": [{"target": "Redis Cache", "type": "depends_on"}],
    "Redis Cache": [{"target": "Old Maxmemory Policy", "type": "uses_policy"}],
}
print("2-hop neighborhood:", expand_hops(edges, ["inference-api"], hops=2))

candidates = [
    Candidate("relationship: depends_on", 0.98, 30, "incident-1842"),
    Candidate("text: maxmemory issue", 0.91, 55, "incident-2031"),
    Candidate("report: cache overview", 0.62, 80, "community-7"),
]
packed = pack_context(candidates, token_budget=90)
print("packed:", [(c.source, c.citation) for c in packed], "tokens:", sum(c.tokens for c in packed))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
2-hop neighborhood: ['Old Maxmemory Policy', 'Redis Cache', 'inference-api']
packed: [('relationship: depends_on', 'incident-1842'), ('text: maxmemory issue', 'incident-2031')] tokens: 85
```
<!-- leetllm: output:end -->

### Global search: map-reduce and dynamic community selection

Global search answers corpus-wide questions by running a **map-reduce** over community reports at a chosen hierarchy level:[^edge2024][^microsoft2025graphragglobal][^graphragGlobalContext2026]

1. **Map:** Pack community reports into token-sized batches. Each parallel LLM call extracts key points relevant to the question and assigns each point a relevance rating.
2. **Reduce:** Sort the rated points across all batches, drop zero-relevance points, and synthesize the top points into one final answer.

<!-- leetllm: test, output=show -->
```python title="global-search-map-reduce.py"
from dataclasses import dataclass


@dataclass(frozen=True)
class RatedPoint:
    report_id: str
    text: str
    rating: int


def global_map_reduce(query: str, reports: list[tuple[str, str]], batch_size: int = 2, top_k: int = 3) -> list[RatedPoint]:
    q_terms = set(query.lower().split())
    mapped: list[RatedPoint] = []
    for i in range(0, len(reports), batch_size):
        for report_id, text in reports[i : i + batch_size]:
            hits = len({"latency", "slo", "queue", "eviction", "drift"} & set(text.lower().split()))
            if hits and ({"latency", "slo"} & q_terms):
                mapped.append(RatedPoint(report_id, text, rating=5 + hits))
    return sorted(mapped, key=lambda p: p.rating, reverse=True)[:top_k]


level_1_reports = [
    ("report-cache", "Latency breaches cluster around cache eviction storms."),
    ("report-queue", "GPU queue starvation delays batch inference jobs."),
    ("report-eval", "Evaluation failures cluster around flaky judge prompts."),
    ("report-config", "SLO breaches recur after cache config drift."),
]
for pt in global_map_reduce("What are the main reasons services miss the latency SLO?", level_1_reports):
    print(f"[{pt.report_id}] (rating={pt.rating}) {pt.text}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[report-cache] (rating=7) Latency breaches cluster around cache eviction storms.
[report-queue] (rating=6) GPU queue starvation delays batch inference jobs.
[report-config] (rating=6) SLO breaches recur after cache config drift.
```
<!-- leetllm: output:end -->

Mapping every report at Level 1 or Level 2 gets expensive on large graphs. **Dynamic community selection** cuts that cost by rating Level-0 root reports first and only descending into children of branches that clear a relevance threshold.[^microsoft2025graphragdynamic][^graphragDynamicSelection2026] In Microsoft's AP News benchmark (50 global questions), dynamic selection cut average token cost by **77%** compared to static Level-1 search with comparable LLM-judge ratings (while descending to Level 3 on the 29 questions that needed deeper reports added 34% cost for a 58.8% comprehensiveness win rate).[^microsoft2025graphragdynamic]

The risk of top-down pruning is a **parent false negative**: if a broad root report scores below threshold, its highly relevant child is never visited:

<!-- leetllm: test, output=show -->
```python title="a-relevance-mistake-hides-a-child.py"
roots = ["serving", "eval"]
children = {"serving": ["cache", "queue"], "eval": ["judges", "metrics"]}


def select_leaf_reports(scores: dict[str, float], threshold: float = 0.5) -> tuple[list[str], list[str]]:
    visited, selected = [], []

    def visit(report: str) -> None:
        visited.append(report)
        if scores[report] < threshold:
            return
        kids = children.get(report, [])
        if not kids:
            selected.append(report)
        for child in kids:
            visit(child)

    for root in roots:
        visit(root)
    return visited, selected


scores = {"serving": 0.9, "eval": 0.1, "cache": 0.8, "queue": 0.7}
print("normal pass:          ", select_leaf_reports(scores))
print("parent false negative:", select_leaf_reports({**scores, "serving": 0.2}))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
normal pass:           (['serving', 'cache', 'queue', 'eval'], ['cache', 'queue'])
parent false negative: (['serving', 'eval'], [])
```
<!-- leetllm: output:end -->

### DRIFT search: combining global context with local follow-ups

**DRIFT** (Dynamic Reasoning and Inference with Flexible Traversal) bridges the two modes.[^microsoft2025graphragdrift] It starts with a **thematic primer** over semantically matched community reports, generates targeted follow-up questions to fill specific entity gaps, executes **local searches** for those follow-ups, and synthesizes the resulting question-answer tree into one cited response.

## Hybrid routing, cost, and lighter graph variants

Vector RAG and GraphRAG work best side by side. A lightweight router sends direct lookups to fast hybrid vector/BM25 search and reserves Local, Global, or DRIFT search for multi-hop and thematic questions. You also do not need a dedicated graph database to start: Microsoft's reference pipeline stores entities, edges, and reports as Parquet tables, whereas Neo4j or Neptune make sense when teams need live custom graph queries across services.[^microsoft2025graphragoutputs]

<!-- leetllm: test, output=show -->
```python title="route-and-workload-economics.py"
from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class RouteResult:
    route: str
    query_class: str
    accuracy: float
    p95_ms: int


def pick_route(results: list[RouteResult], query_class: str, min_acc: float, max_p95: int) -> str | None:
    eligible = [r for r in results if r.query_class == query_class and r.accuracy >= min_acc and r.p95_ms <= max_p95]
    if not eligible:
        return None
    order = np.lexsort(([r.p95_ms for r in eligible], [-r.accuracy for r in eligible]))
    return eligible[int(order[0])].route


results = [
    RouteResult("basic", "fact_lookup", 0.96, 95),
    RouteResult("local", "fact_lookup", 0.96, 240),
    RouteResult("basic", "corpus_trend", 0.61, 92),
    RouteResult("global", "corpus_trend", 0.91, 580),
]
print("fact route: ", pick_route(results, "fact_lookup", 0.90, 200))
print("trend route:", pick_route(results, "corpus_trend", 0.90, 700))

# Break-even between low-index deferred work (LazyGraphRAG) and precomputed reports:
for q_count in (10, 500):
    lazy_cost = 1.0 + q_count * 1.7
    precomputed_cost = 200.0 + q_count * 0.8
    winner = "lazy" if lazy_cost < precomputed_cost else "precomputed_reports"
    print(f"Q={q_count:3d} -> {winner} (lazy={lazy_cost:.1f}, precomputed={precomputed_cost:.1f})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fact route:  basic
trend route: global
Q= 10 -> lazy (lazy=18.0, precomputed=208.0)
Q=500 -> precomputed_reports (lazy=851.0, precomputed=600.0)
```
<!-- leetllm: output:end -->

### Managing indexing cost: FastGraphRAG, LazyGraphRAG, and LightRAG

LLM entity/relationship extraction plus summarization accounts for roughly **75% of standard GraphRAG indexing cost**.[^microsoft2025graphragmethods][^microsoft2025graphragstart] Three lighter designs trade upfront indexing spend against query-time work:

- **FastGraphRAG** swaps LLM entity extraction for NLP noun phrases and co-occurrence edges while still generating LLM community reports.[^microsoft2025graphragmethods]
- **LazyGraphRAG** removes LLM work from indexing altogether, building an NLP concept graph with community structure at roughly **0.1% of full GraphRAG indexing cost** (similar to vector RAG) and spending a tunable **relevance test budget** at query time.[^lazygraphrag] On Microsoft's AP News evaluation (100 queries over 5,590 articles), low-budget LazyGraphRAG matched Global Search quality at over 700x lower query cost, while a higher budget (~4% of Level-2 Global Search cost) outperformed tested baselines on both local and global criteria.[^lazygraphrag]
- **LightRAG** extracts entity/relationship profiles without a community-report hierarchy, pairing low-level entity keywords with high-level relationship keywords and supporting incremental merges as new documents arrive.[^guo2024LightRag]

| Architecture | Indexing work | Query-time evidence | Best fit |
|:---|:---|:---|:---|
| **Vector RAG** | Chunk embeddings (+ BM25) | Top-k chunks | Fast fact lookups, rapidly changing corpora |
| **Standard GraphRAG** | LLM extraction + Leiden + community reports | Basic, Local, Global, or DRIFT | High-volume thematic analysis on a stable corpus |
| **FastGraphRAG** | NLP noun-phrase graph + LLM reports | Community reports + graph context | Global summarization on a tighter indexing budget |
| **LazyGraphRAG** | NLP concept graph (no precomputed reports) | Budgeted relevance tests at query time | Infrequent global queries or frequently updated docs |
| **LightRAG** | LLM entity/edge profiles (no report hierarchy) | Dual-level entity + relationship retrieval | Incremental graph additions without full report rebuilds |

Incremental updates (`standard-update` / `fast-update` in GraphRAG) merge new nodes and edges into existing tables, yet **deletions** are harder than dropping a vector row: you must remove nodes and edges supported solely by the deleted document and recompute any community reports whose evidence changed.[^microsoft2025graphragcli][^microsoft2025graphragoutputs]

```checkpoint
Why is LazyGraphRAG's indexing cost close to plain vector RAG?
---
LazyGraphRAG eliminates upfront LLM entity summarization and precomputed community reports, indexing only NLP noun phrases and graph statistics while deferring LLM synthesis to query time.
```

## Production failure modes

| Failure mode | Symptom | Root cause & fix |
|:---|:---|:---|
| **Stuffing long contexts** | 100K-<span data-glossary="token">token</span> prompts miss themes or contradict themselves | Mid-context attention degrades[^liu2023lost] and prefill grows quadratically; use hierarchical reports or map-reduce for global questions. |
| **Replacing vector search everywhere** | Simple fact lookups become slow and pricey | Keep hybrid vector/BM25 for direct lookups and route only multi-hop or thematic queries to GraphRAG. |
| **Skipping entity resolution** | `RedisCache`, `redis-cache`, and `redis.internal` fragment into separate nodes | Canonicalize by `(title, type)` within tenant/environment scope with reviewed aliases. |
| **Unconstrained noun extraction** | Generic terms (`service`, `alert`, `team`) form million-edge super-hubs | Restrict extraction to high-signal domain entity types and prune high-degree hubs. |
| **Unbudgeted full-corpus builds** | First production build burns through LLM token quotas | Measure extraction + report token cost on a 1% sample first, or evaluate LazyGraphRAG. |
| **Stale graph and report lineage** | Deleted or revoked documents linger in community summaries | Track `text_unit_ids` on every node, edge, and report so edits and revocations invalidate downstream summaries immediately. |

## Hands-on: running the end-to-end incident graph lab

[Download `incident_graph_lab.py`](assets/incident_graph_lab.py) and run `uv run incident_graph_lab.py` (or execute the cell below). It compares lexical top-2 retrieval against 2-hop graph expansion on Records 1842, 2031, and 3155, verifies source-hash and ACL checks on every traversed edge, and demonstrates a crucial subtlety: a false causal edge (`will_cause`) carrying a genuine quotation and valid source hash still passes mechanical lineage checks, proving that **citation integrity is necessary but never replaces semantic claim verification**.

<!-- leetllm: test, output=show -->
```python title="run-the-incident-retrieval-lab.py"
import runpy

runpy.run_path("assets/incident_graph_lab.py", run_name="__main__")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
lexical top-two: [1842, 3155] evidence recall: 0.667
graph expansion: [1842, 2031, 3155] evidence recall: 1.0
false causal edge with genuine quote: source checks pass; claim remains unsupported
source mutation, deletion, revocation, direction, hop, and report-admission checks pass
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/graphrag_dark.png" alt="For the query inference-api latency SLO, lexical ranking finds three matching terms in record 3155, two in 1842, and none in 2031, selecting 3155 and 1842. The graph traversal path inference-api to Redis Cache to Old Maxmemory Policy adds record 2031. Annotated recall rises from 2/3 to 3/3 on this three-record example; embedding retrieval and causal attribution require separate evaluation." />
  <figcaption>Lexical top-2 retrieves Records 3155 and 1842 (2/3 recall). Following <code>inference-api -> Redis Cache -> Old Maxmemory Policy</code> recovers Record 2031 and brings evidence recall to 3/3.</figcaption>
</figure>

```mastery-quiz
[
  {
    "question": "A search returns six near-duplicate passages about cache failures and none about queue failures. An analyst can read all fleet incident records and their community reports. How should the analyst describe recurring themes across the fleet and check whether cache failures are the most frequent?",
    "options": [
      "Use community reports for themes. Count distinct fleet incidents by reviewed failure label.",
      "Use community reports for themes. Rank failure labels by their highest report impact rating.",
      "Use the six retrieved passages for themes. Count distinct fleet incidents by reviewed failure label.",
      "Use the six retrieved passages for themes. Rank failure labels by their highest report impact rating."
    ],
    "answer": "Use community reports for themes. Count distinct fleet incidents by reviewed failure label.",
    "explanation": "Reports from different communities surface themes that six near-duplicate cache passages miss. To compare frequency, deduplicate records by incident ID and count reviewed labels, since a rare outage can carry a high impact rating."
  },
  {
    "question": "Two disconnected triangles form a simple undirected graph with m = 6 edges. Each triangle is one community with e = 3 internal edges and degree sum K = 6. What is the modularity of this partition using Q = sum[e/m − (K/(2m))²]?",
    "options": [
      "0.00",
      "0.50",
      "1.00",
      "0.25"
    ],
    "answer": "0.50",
    "explanation": "Each triangle contributes 3/6 − (6/12)² = 0.25, so summing both gives 0.50. Putting all nodes in one community yields 0.00, while skipping the expected-share subtraction gives 1.00."
  },
  {
    "question": "A local search has 96 tokens for evidence. In order from highest score to lowest, four items cost 54, 60, 28, and 20 tokens. The greedy packer considers each item in that order and takes it if it fits. Which items enter the context, and how many tokens remain?",
    "options": [
      "54 (54 used, 42 free)",
      "60 and 28 (88 used, 8 free)",
      "54 and 28 (82 used, 14 free)",
      "28 and 20 (48 used, 48 free)"
    ],
    "answer": "54 and 28 (82 used, 14 free)",
    "explanation": "Taking 54 leaves 42 tokens. Skip 60 (too large), take 28 (14 left), and skip 20 (too large). Total used is 82 tokens with 14 remaining."
  },
  {
    "question": "A genuine source says a service depends on a cache. An extracted edge reuses its citation and hash but changes the relation to caused_all_outages. What can the system conclude?",
    "options": [
      "Source document citation: valid; causal relation: supported; dependency: retain its original supported status.",
      "Source document citation: valid; causal relation: supported by modularity; dependency: retain its original status.",
      "Source document citation: invalid; causal relation: unsupported; dependency: discard despite its separate source support.",
      "Source document citation: valid; causal relation: unsupported; dependency: retain its separate source support."
    ],
    "answer": "Source document citation: valid; causal relation: unsupported; dependency: retain its separate source support.",
    "explanation": "Matching hashes and valid source IDs verify document integrity, not semantic entailment. Keep the supported dependency edge and reject the unsupported causal relation."
  },
  {
    "question": "Two entities share title Atlas, one a Service and one a Datastore in the same environment. An edge gives the title but no endpoint type. What should the resolver do?",
    "options": [
      "Resolve to the first Service record; preserve its type and source as the endpoint identity.",
      "Reject the ambiguous title; require an explicit endpoint type before storing this relationship.",
      "Merge the Service and Datastore records; use the shared canonical title as their identity.",
      "Infer the endpoint type from graph degree; use that inferred type to store this relationship."
    ],
    "answer": "Reject the ambiguous title; require an explicit endpoint type before storing this relationship.",
    "explanation": "Entity identity uses (canonical_title, canonical_type). When an untyped title matches multiple entities, reject the edge instead of guessing."
  },
  {
    "question": "A parent report depends on the old S2 source version through an old child report. S2 is corrected while other sources remain unchanged. Which old artifacts must be invalidated immediately?",
    "options": [
      "Old S2 blocked; old child blocked; old parent still served; unrelated reports unchanged during rebuilding.",
      "Old S2 citation removed; old child still served; old parent still served; unrelated reports unchanged.",
      "Old S2 blocked; old child blocked; old parent blocked; unrelated reports unchanged during rebuilding.",
      "Old S2 blocked; old child blocked; old parent blocked; unrelated independent reports also blocked."
    ],
    "answer": "Old S2 blocked; old child blocked; old parent blocked; unrelated reports unchanged during rebuilding.",
    "explanation": "Dependency invalidation is transitive and immediate across the old source and every report derived from it while regeneration runs asynchronously. Unrelated reports remain unaffected."
  },
  {
    "question": "A dynamic community selector expands a parent only when relevance >= 0.6. Root A scores 0.4; its child C has score 0.9. Root B scores 0.7 and leaf D scores 0.8. Which leaves are selected?",
    "options": [
      "Rate A, B, D; select D; leave C unvisited after its parent fails the threshold.",
      "Rate A, B, C, D; select C, D; visit both leaves independently of parent scores.",
      "Rate A, C, B; select C; replace the passing B branch with C.",
      "Rate A, B; select neither leaf; let A's failure reject branch B."
    ],
    "answer": "Rate A, B, D; select D; leave C unvisited after its parent fails the threshold.",
    "explanation": "Top-down pruning stops at Root A (0.4 < 0.6), so Child C (0.9) is never visited, while Root B (0.7) opens Leaf D (0.8)."
  },
  {
    "question": "Fact lookups require accuracy >= 0.92 and p95 <= 250 ms; trend queries require accuracy >= 0.92 and p95 <= 700 ms. Basic/local facts score 0.94/130 ms and 0.96/320 ms; Basic/global trends score 0.70/100 ms and 0.95/640 ms. Which routes qualify?",
    "options": [
      "Facts: Local (0.96 / 320 ms); Trends: Basic (0.70 / 100 ms).",
      "Facts: Basic (0.94 / 130 ms); Trends: Basic (0.70 / 100 ms).",
      "Facts: Local (0.96 / 320 ms); Trends: Global (0.95 / 640 ms).",
      "Facts: Basic (0.94 / 130 ms); Trends: Global (0.95 / 640 ms)."
    ],
    "answer": "Facts: Basic (0.94 / 130 ms); Trends: Global (0.95 / 640 ms).",
    "explanation": "Local facts exceed the 250 ms latency ceiling, and Basic trends fall below the 0.92 accuracy floor. Only Basic for facts and Global for trends clear both constraints."
  },
  {
    "question": "A deferred strategy (LazyGraphRAG) costs 5 + 2Q and a precomputed strategy costs 125 + 0.5Q for Q queries over one index refresh. Which strategy has lower total cost at Q = 50 and Q = 500?",
    "options": [
      "Q = 50: precomputed (150); Q = 500: precomputed (375).",
      "Q = 50: deferred (105); Q = 500: precomputed (375).",
      "Q = 50: deferred (105); Q = 500: deferred (1005).",
      "Q = 50: precomputed (150); Q = 500: deferred (1005)."
    ],
    "answer": "Q = 50: deferred (105); Q = 500: precomputed (375).",
    "explanation": "At Q = 50, deferred costs 105 vs. 150 for precomputed. At Q = 500, deferred costs 1,005 vs. 375 for precomputed. The two strategies break even at Q = 80."
  },
  {
    "question": "A caller can read public sources P1 and P2 but not restricted source R7. One community report combines P1, P2, and R7; a second report uses only P1 and P2. What may enter query-time map context?",
    "options": [
      "Include both reports and scrub restricted phrases from the final answer.",
      "Include both reports and hide the R7 citation from the user.",
      "Include only the P1/P2 report; drop the mixed report (or recompute/fall back to authorized sources).",
      "Drop both reports because their source sets differ."
    ],
    "answer": "Include only the P1/P2 report; drop the mixed report (or recompute/fall back to authorized sources).",
    "explanation": "A derived report's audience is the intersection of all contributing source ACLs. Drop the mixed report before map-reduce; output scrubbing is too late."
  }
]
```

> **Next:** Continue to [RAG Security & Access Control](/learn/enterprise-rag-security-rbac-access-control). GraphRAG puts vector candidates, entities, and community reports on one retrieval surface. The next chapter asks who may read that surface: row-level security, document <span data-glossary="acl">ACLs</span>, and per-user filters must run before protected evidence reaches model context.
