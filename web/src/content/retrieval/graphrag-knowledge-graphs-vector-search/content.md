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
    "core-retrieval-algorithms"
  ],
  "relatedQuestions": [
    "design-production-rag-pipeline",
    "structured-output-constrained-generation",
    "agent-memory-persistence-patterns",
    "multi-agent-dags-langgraph-orchestration"
  ]
}
---

Imagine an AI systems archive holding 10,000 research notes, model-serving specs, and architecture records. Ask standard vector search, *"What block size does PagedAttention use in our serving config?"*, and top-5 similarity returns the exact paragraph in milliseconds. Now ask, *"What are the dominant architectural bottlenecks limiting throughput across our inference stack?"* Top-5 similarity pulls five near-duplicate notes on KV-cache fragmentation and misses kernel memory bandwidth, batch scheduling, and quantization trade-offs spread across the corpus.

The previous chapter showed how query rewriting, HyDE, Self-RAG, and CRAG sharpen single-query <span data-glossary="rag">RAG</span>. **<span data-glossary="graphrag">GraphRAG</span>** upgrades the index itself.[^edge2024][^pan2024] Alongside chunk <span data-glossary="embedding">embeddings</span>, it extracts typed entities and relationships into a property graph, clusters dense subgraphs into hierarchical communities, and summarizes those communities into reports.[^microsoft2025graphragindex][^microsoft2025graphragdataflow] That offline structure unlocks multi-hop traversals across separate documents and corpus-wide thematic synthesis.

## Why small top-k vector search hits a ceiling

Vector similarity excels on **local lookups** whose answer sits in a handful of nearby chunks. It stalls on two other query shapes:

1. **Global sensemaking queries** ask about patterns across thousands of documents. Near-duplicate passages crowd the <span data-glossary="top-k">top-k</span> window, while simply raising `k` inflates prompt tokens and triggers mid-context attention drops ("lost in the middle").[^liu2023lost]
2. **Multi-hop entity queries** link separate documents through an intermediate entity the question never named.

GraphRAG shifts clustering and summarization **offline** during indexing, storing four linked artifacts: source text units, extracted entities, directed relationships, and hierarchical community reports.[^edge2024]

<figure>
  <img src="illustrations/_generated/local_global_scope_dark.png" alt="Local search ranks mixed candidate records into a 90-token budget (packing 30-token relationship and 55-token text unit for 85 tokens while skipping an 80-token report). Global search maps batches of community reports and reduces rated cache, queue, and config findings." />
  <figcaption>Local search packs top-scoring graph and text records into a fixed token budget (85 of 90 tokens). Global search maps community report batches in parallel and reduces rated points into a corpus-wide answer.</figcaption>
</figure>

> **Common mistake:** Treating community report impact ratings as exact frequency counts. Global search surfaces recurring *themes*, not statistical counts. When exact counts matter, deduplicate by document ID, classify with a fixed taxonomy, and count directly.

## Multi-hop retrieval and property graphs

Consider three architecture records from a model-serving knowledge base:

- **Record 1842:** `inference-api` depends on `Redis Cache` for embedding lookups; evictions climbed alongside p95 latency during benchmark `2026.06.14`.
- **Record 2031:** `Redis Cache` in `us-east-1` still runs `Old Maxmemory Policy`, whose migration waits on a client compatibility test.
- **Record 3155:** `inference-api` exceeded its latency target twelve minutes after rollout; rolling back restored baseline latency.

Because Record 2031 never mentions `inference-api` or latency, lexical or narrow top-2 search fetches Records 3155 and 1842 and misses Record 2031. Adding source-cited directed edges (`inference-api -[depends_on]-> Redis Cache -[uses_policy]-> Old Maxmemory Policy`) lets a two-hop walk pull Record 2031 directly into context.

<figure>
  <img src="illustrations/_generated/graphrag_dark.png" alt="For the query inference-api latency SLO, lexical search selects records 3155 and 1842 and omits 2031. Traversing inference-api to Redis Cache to Old Maxmemory Policy recovers 2031, lifting recall from 2/3 to 3/3." />
  <figcaption>Lexical top-2 retrieves Records 3155 and 1842 (2/3 recall). Following <code>inference-api -> Redis Cache -> Old Maxmemory Policy</code> recovers Record 2031 (3/3 recall).</figcaption>
</figure>

A **property graph** stores triples `(Subject) -[Predicate]-> (Object)` with typed attributes (`type`, `description`, `weight`, `source_chunk_ids`). Always identify entities by `(canonical_title, canonical_type)` within a workspace scope rather than title alone: `Compiler:Triton` (the GPU kernel DSL) and `Server:Triton` (the inference runtime) must never merge into one node.

Keep **graph traversal** distinct from **<span data-glossary="graph-neural-network">Graph Neural Networks (GNNs)</span>**. Standard GraphRAG walks stored edges and summarizes communities without training a neural graph model. A GNN or <span data-glossary="message-passing-neural-network">Message-Passing Neural Network (MPNN)</span> learns embeddings by aggregating neighbor vectors across layers to predict node labels or missing links.[^kipf2016gcn][^gilmer2017mpnn] Treat any GNN-predicted edge as a hypothesis until anchored to source text.

## Phase 1: Building the GraphRAG index

Microsoft's GraphRAG pipeline turns raw chunks into entities, relationships, hierarchical communities, and community reports.[^microsoft2025graphragindex][^microsoft2025graphragdataflow]

### Step 1: Typed entity resolution, lineage, and local context packing

<figure>
  <img src="illustrations/_generated/entity_graph_dark.png" alt="Directed path from inference-api (Service) through Redis Cache (Datastore, sources 1842 and 2031) to Old Maxmemory Policy (ConfigPolicy), with depends_on citing 1842 and uses_policy citing 2031." />
  <figcaption>Entity resolution merges mentions of Redis Cache across Records 1842 and 2031 under one typed node while keeping each edge anchored to its source record.</figcaption>
</figure>

For each text unit, an LLM using <span data-glossary="structured-output">structured output</span> (or an NLP extractor in lighter variants[^microsoft2025graphragmethods]) proposes typed entities and directed edges. **<span data-glossary="entity-resolution">Entity resolution</span>** merges duplicates sharing `(canonical_title, canonical_type)` plus curated aliases and unions their `source_chunk_ids`.[^edge2024][^microsoft2025graphragoutputs]

At query time, **Local Search** maps the question to seed entities, expands their $k$-hop neighborhood, verifies every hop carries valid source chunks, and packs the highest-scoring entities, edges, reports, and text units into the prompt's <span data-glossary="token-budget">token budget</span>.[^microsoft2025graphraglocal] The script below resolves an ML systems graph, rejects an ambiguous untyped `Triton` edge, expands two hops from `vLLM`, and packs candidates into a 90-token budget:

<!-- leetllm: test, output=show -->
```python title="typed-entity-graph-and-local-packer.py"
from collections import defaultdict
from dataclasses import dataclass
import numpy as np


@dataclass
class Entity:
    name: str
    type: str
    sources: list[str]


@dataclass(frozen=True)
class Edge:
    src: str
    src_type: str
    rel: str
    dst: str
    dst_type: str
    sources: tuple[str, ...]


@dataclass(frozen=True)
class Candidate:
    label: str
    score: float
    tokens: int
    source: str


def norm(s: str) -> str:
    return " ".join(s.casefold().split())


def build_graph(entities: list[Entity], edges: list[Edge]) -> tuple[dict, dict]:
    nodes: dict[tuple[str, str], Entity] = {}
    by_name: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for e in entities:
        key = (norm(e.name), norm(e.type))
        if key not in nodes:
            nodes[key] = Entity(e.name, e.type, sorted(set(e.sources)))
            by_name[key[0]].append(key)
        else:
            nodes[key].sources = sorted(set(nodes[key].sources + e.sources))

    def resolve(name: str, etype: str) -> tuple[str, str]:
        if etype:
            key = (norm(name), norm(etype))
            if key in nodes:
                return key
            raise ValueError(f"unknown entity: {name!r} ({etype})")
        matches = by_name.get(norm(name), [])
        if len(matches) != 1:
            raise ValueError(f"ambiguous untyped entity: {name!r} -> {matches}")
        return matches[0]

    adj: dict[tuple[str, str], list[tuple[tuple[str, str], str, tuple[str, ...]]]] = defaultdict(list)
    for ed in edges:
        if not ed.sources:
            raise ValueError(f"uncited edge: {ed.src} -[{ed.rel}]-> {ed.dst}")
        adj[resolve(ed.src, ed.src_type)].append((resolve(ed.dst, ed.dst_type), ed.rel, ed.sources))
    return nodes, dict(adj)


def expand_hops(adj: dict, seed: tuple[str, str], hops: int = 2) -> list[tuple[str, str]]:
    visited, frontier = {seed}, {seed}
    for _ in range(hops):
        nxt = {v for u in frontier for v, _, _ in adj.get(u, [])} | {
            u for u, es in adj.items() if any(v in frontier for v, _, _ in es)
        }
        frontier = nxt - visited
        visited |= frontier
    return sorted(visited)


def pack_context(candidates: list[Candidate], budget: int) -> list[Candidate]:
    selected, used = [], 0
    for idx in np.argsort([-c.score for c in candidates]):
        item = candidates[int(idx)]
        if used + item.tokens <= budget:
            selected.append(item)
            used += item.tokens
    return selected


nodes, adj = build_graph(
    [
        Entity("FlashAttention", "Algorithm", ["paper-dao22"]),
        Entity("HBM", "Hardware", ["paper-dao22"]),
        Entity("HBM", "Hardware", ["paper-kwon23"]),
        Entity("PagedAttention", "Algorithm", ["paper-kwon23"]),
        Entity("vLLM", "Engine", ["paper-kwon23"]),
    ],
    [
        Edge("FlashAttention", "Algorithm", "minimizes_io_to", "HBM", "Hardware", ("paper-dao22",)),
        Edge("vLLM", "Engine", "implements", "PagedAttention", "Algorithm", ("paper-kwon23",)),
        Edge("PagedAttention", "Algorithm", "reduces_waste_in", "HBM", "Hardware", ("paper-kwon23",)),
    ],
)
print("HBM sources:", nodes[("hbm", "hardware")].sources)
print("2-hop vLLM: ", [nodes[k].name for k in expand_hops(adj, ("vllm", "engine"), hops=2)])
try:
    build_graph(
        [Entity("Triton", "Compiler", ["p1"]), Entity("Triton", "Server", ["p2"])],
        [Edge("Triton", "", "targets", "Triton", "Compiler", ("p3",))],
    )
except ValueError as err:
    print("rejected:   ", err)
packed = pack_context(
    [
        Candidate("vLLM->PagedAttention", 0.98, 30, "paper-kwon23"),
        Candidate("block-table KV text", 0.91, 55, "paper-kwon23"),
        Candidate("serving report", 0.62, 80, "comm-serving"),
    ],
    budget=90,
)
print("packed:     ", [(c.label, c.source) for c in packed])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
HBM sources: ['paper-dao22', 'paper-kwon23']
2-hop vLLM:  ['HBM', 'PagedAttention', 'vLLM']
rejected:    ambiguous untyped entity: 'Triton' -> [('triton', 'compiler'), ('triton', 'server')]
packed:      [('vLLM->PagedAttention', 'paper-kwon23'), ('block-table KV text', 'paper-kwon23')]
```
<!-- leetllm: output:end -->

### Step 2: Community detection with the Leiden algorithm

Single-entity hops cannot summarize an entire corpus. GraphRAG projects the entity graph into an undirected weighted graph and runs **hierarchical Leiden** clustering.[^traag2019][^graphragClustering2026]

Older Louvain clustering moves individual nodes to maximize modularity, which can detach a bridge node and leave a community internally disconnected. Leiden adds a **refinement phase** before aggregation so every community remains internally connected.[^traag2019] Microsoft's GraphRAG wrapper optimizes **Newman modularity** $Q$ (resolution $1.0$), measuring excess internal edge density over a degree-preserving random null model:[^graphragLeidenWrapper2026]

$$
Q = \frac{1}{2m} \sum_{i,j} \left[ A_{ij} - \frac{k_i k_j}{2m} \right] \delta(c_i, c_j)
$$

Here $A_{ij} \in \{0, 1\}$ is the adjacency matrix, $k_i$ and $k_j$ are node degrees, $m$ is the undirected edge count, and $\delta(c_i, c_j) = 1$ when nodes $i$ and $j$ share a community. Putting all nodes in one community yields $Q = 0$; isolating dense clusters raises $Q$:

<!-- leetllm: test, output=show -->
```python title="leiden-modularity-and-refinement.py"
from collections import defaultdict, deque


def build_adj(nodes: list[str], edges: list[tuple[str, str]]) -> dict[str, set[str]]:
    adj = {n: set() for n in nodes}
    for u, v in edges:
        adj[u].add(v)
        adj[v].add(u)
    return adj


def modularity(nodes: list[str], adj: dict[str, set[str]], m: int, comm: dict[str, str]) -> float:
    two_m = 2 * m
    total = sum(
        (1.0 if j in adj[i] else 0.0) - (len(adj[i]) * len(adj[j])) / two_m
        for i in nodes for j in nodes if comm[i] == comm[j]
    )
    return total / two_m


def refine_connected(adj: dict[str, set[str]], comm: dict[str, str]) -> dict[str, str]:
    """Ensure every community is internally connected (Leiden connectivity invariant)."""
    by_comm: dict[str, set[str]] = defaultdict(set)
    for node, cid in comm.items():
        by_comm[cid].add(node)
    refined: dict[str, str] = {}
    for cid, members in by_comm.items():
        unseen, part = set(members), 0
        while unseen:
            seed = min(unseen)
            unseen.remove(seed)
            q, label = deque([seed]), (f"{cid}_{part}" if part else cid)
            while q:
                cur = q.popleft()
                refined[cur] = label
                for nxt in adj[cur] & unseen:
                    unseen.remove(nxt)
                    q.append(nxt)
            part += 1
    return refined


nodes = ["FlashAttention", "Triton", "SRAM", "vLLM", "PagedAttention", "KV-Cache", "LoRA", "QLoRA", "NF4"]
edges = [
    ("FlashAttention", "Triton"), ("FlashAttention", "SRAM"), ("Triton", "SRAM"),
    ("vLLM", "PagedAttention"), ("vLLM", "KV-Cache"), ("PagedAttention", "KV-Cache"),
    ("LoRA", "QLoRA"), ("QLoRA", "NF4"), ("LoRA", "NF4"),
    ("FlashAttention", "vLLM"),
]
adj = build_adj(nodes, edges)
comm = {n: n for n in nodes}
improved = True
while improved:
    improved, best_q = False, modularity(nodes, adj, len(edges), comm)
    for node in nodes:
        best_c = comm[node]
        for cand in sorted({comm[nbr] for nbr in adj[node]}):
            comm[node] = cand
            q = modularity(nodes, adj, len(edges), comm)
            if q > best_q + 1e-9:
                best_q, best_c, improved = q, cand, True
        comm[node] = best_c

refined = refine_connected(adj, comm)
groups: dict[str, list[str]] = defaultdict(list)
for node, cid in refined.items():
    groups[cid].append(node)

print("all-in-one Q:", round(modularity(nodes, adj, len(edges), {n: "all" for n in nodes}), 3))
print("optimized Q: ", round(modularity(nodes, adj, len(edges), refined), 3))
for cid, members in sorted(groups.items()):
    print(f"community {cid}: {sorted(members)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
all-in-one Q: -0.0
optimized Q:  0.565
community KV-Cache: ['KV-Cache', 'PagedAttention', 'vLLM']
community NF4: ['LoRA', 'NF4', 'QLoRA']
community SRAM: ['FlashAttention', 'SRAM', 'Triton']
```
<!-- leetllm: output:end -->

Hierarchical Leiden subdivides large communities recursively into a **forest** of nested themes (Level 0 holds broad communities; deeper levels hold finer sub-communities; Edge et al. report 34 Level-0 communities on their podcast corpus and 55 on their news corpus).[^edge2024][^microsoft2025graphragdataflow]

<figure>
  <img src="illustrations/_generated/community_hierarchy_dark.png" alt="A query uses a 0.5 relevance threshold on a two-root forest. Serving (0.9) opens Cache (0.8) and Queue (0.7); Eval (0.1) prunes Judges and Metrics. In a counterfactual where Serving scores 0.2, Cache (0.8) stays hidden." />
  <figcaption>Dynamic community selection scores roots first. Serving (0.9) passes 0.5 and opens Cache and Queue; Eval (0.1) prunes its branch. A false negative on Serving (0.2) hides Cache (0.8) below it.</figcaption>
</figure>

### Step 3: Community reports and authorization continuity

For every community, an LLM writes a structured **Community Report** (title, executive summary, key findings citing entity/edge IDs, and a 0-10 **impact rating**).[^graphragReportPrompt2026]

Compressing dozens of chunks into one report introduces an **indirect leakage** hazard whenever documents carry <span data-glossary="acl">access control lists (ACLs)</span>. If one community report summarizes two `all-staff` notes alongside one `security-only` note, showing that report to a regular reader exposes the restricted fact even when chunk-level vector search filtered out the restricted chunk.

> **Key insight:** **Authz before map-reduce.** A derived community report's permitted audience is the **intersection** of every contributing source's ACL at its current version. Enforce access checks before a report enters any prompt, and transitively invalidate affected child and parent reports immediately when a source edits or revokes.

Three production patterns enforce ACL continuity: **equivalence-class partitioning** (separate graphs per homogeneous permission scope), **query-time dynamic summarization** over authorized chunks (as in LazyGraphRAG), or **drop with local fallback** (exclude mixed unauthorized reports and fall back to authorized local entity search). See [RAG Security & Access Control](/learn/design-production-rag-pipeline) for full multi-tenant ACL design.

```checkpoint
Why can community reports leak restricted data even when vector chunk search enforces ACLs?
---
A precomputed report summarizes many chunks together. If any contributing chunk is restricted, handing the report to an unauthorized caller exposes that fact without ever fetching the chunk directly.
```

## Phase 2: Global search, dynamic selection, and DRIFT

Global search answers corpus-wide questions via **map-reduce** over community reports at a chosen level:[^edge2024][^microsoft2025graphragglobal][^graphragGlobalContext2026]

1. **Map:** Pack community reports into token-budgeted batches and score each report's relevance to the question in parallel.
2. **Reduce:** Sort rated points across all batches, drop zero-relevance items, and synthesize the highest-ranked findings.

The code below builds real TF-IDF vectors over ML-systems community reports, packs token-bounded batches, scores cosine similarity weighted by community size, and reduces the top themes:

<!-- leetllm: test, output=show -->
```python title="global-search-tfidf-map-reduce.py"
from dataclasses import dataclass
import math
import re
import numpy as np


@dataclass(frozen=True)
class Report:
    id: str
    title: str
    summary: str
    entities: int
    tokens: int


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def tfidf(docs: list[str]) -> tuple[np.ndarray, dict[str, int], np.ndarray]:
    toks = [tokenize(d) for d in docs]
    vocab = {t: i for i, t in enumerate(sorted({w for d in toks for w in d}))}
    df = np.zeros(len(vocab))
    for d in toks:
        for t in set(d):
            df[vocab[t]] += 1.0
    idf = np.log((1.0 + len(docs)) / (1.0 + df)) + 1.0
    mat = np.zeros((len(docs), len(vocab)))
    for r, d in enumerate(toks):
        for t in d:
            mat[r, vocab[t]] += 1.0
        if d:
            mat[r] = (mat[r] / len(d)) * idf
            norm = float(np.linalg.norm(mat[r]))
            if norm > 0:
                mat[r] /= norm
    return mat, vocab, idf


def global_map_reduce(query: str, reports: list[Report], batch_tokens: int = 80, top_k: int = 3) -> list[tuple[float, Report]]:
    mat, vocab, idf = tfidf([f"{r.title} {r.summary}" for r in reports])
    q_vec = np.zeros(len(vocab))
    q_toks = tokenize(query)
    for t in q_toks:
        if t in vocab:
            q_vec[vocab[t]] += 1.0
    if q_toks and np.linalg.norm(q_vec) > 0:
        q_vec = (q_vec / len(q_toks)) * idf
        q_vec /= float(np.linalg.norm(q_vec))

    # Pack into token-bounded batches, map similarity + log community size, then reduce.
    batches, cur, used = [], [], 0
    for idx, rep in enumerate(reports):
        if cur and used + rep.tokens > batch_tokens:
            batches.append(cur)
            cur, used = [], 0
        cur.append((idx, rep))
        used += rep.tokens
    if cur:
        batches.append(cur)

    mapped = []
    for batch in batches:
        for idx, rep in batch:
            sim = float(np.dot(mat[idx], q_vec))
            if sim > 0.0:
                mapped.append((sim * (1.0 + 0.15 * math.log1p(rep.entities)), rep))
    return sorted(mapped, key=lambda pair: pair[0], reverse=True)[:top_k]


reports = [
    Report("c-kernels", "Attention Kernels", "FlashAttention tiles softmax in SRAM to cut GPU HBM memory bandwidth traffic.", 14, 38),
    Report("c-serving", "Serving Engines", "vLLM uses PagedAttention block tables to eliminate KV cache memory fragmentation and raise throughput.", 19, 42),
    Report("c-quant", "Weight Quantization", "AWQ and FP8 compress weights to reduce GPU memory footprint and speed up decode throughput.", 12, 36),
    Report("c-align", "Preference Alignment", "DPO and RLHF optimize helpfulness and refusal boundaries using human preference pairs.", 16, 35),
]
query = "How do serving engines and kernels cut GPU memory bottlenecks to improve throughput?"
for score, rep in global_map_reduce(query, reports):
    print(f"[{rep.id}] score={score:.3f} | {rep.title}: {rep.summary}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[c-serving] score=0.589 | Serving Engines: vLLM uses PagedAttention block tables to eliminate KV cache memory fragmentation and raise throughput.
[c-kernels] score=0.539 | Attention Kernels: FlashAttention tiles softmax in SRAM to cut GPU HBM memory bandwidth traffic.
[c-quant] score=0.408 | Weight Quantization: AWQ and FP8 compress weights to reduce GPU memory footprint and speed up decode throughput.
```
<!-- leetllm: output:end -->

Mapping every Level-1 or Level-2 report gets pricey on large graphs. **Dynamic community selection** rates Level-0 roots first and expands only branches clearing a relevance cutoff (cutting AP News token cost by **77%** vs. static Level-1 at comparable judge ratings, while descending to Level 3 on deeper queries added 34% cost for a 58.8% comprehensiveness win rate).[^microsoft2025graphragdynamic][^graphragDynamicSelection2026] Its risk is a **parent false negative**, where a low root score hides a relevant child:

<!-- leetllm: test, output=show -->
```python title="dynamic-community-pruning.py"
children = {"serving": ["cache", "queue"], "eval": ["judges", "metrics"]}


def select_leaves(scores: dict[str, float], cutoff: float = 0.5) -> tuple[list[str], list[str]]:
    visited, selected = [], []

    def visit(node: str) -> None:
        visited.append(node)
        if scores[node] < cutoff:
            return
        kids = children.get(node, [])
        if not kids:
            selected.append(node)
        for c in kids:
            visit(c)

    for root in ("serving", "eval"):
        visit(root)
    return visited, selected


scores = {"serving": 0.9, "eval": 0.1, "cache": 0.8, "queue": 0.7}
print("normal pass:          ", select_leaves(scores))
print("parent false negative:", select_leaves({**scores, "serving": 0.2}))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
normal pass:           (['serving', 'cache', 'queue', 'eval'], ['cache', 'queue'])
parent false negative: (['serving', 'eval'], [])
```
<!-- leetllm: output:end -->

**DRIFT** (Dynamic Reasoning and Inference with Flexible Traversal) combines both modes: it primes context with matched community reports, asks follow-up questions to close entity gaps, runs **local searches** for those follow-ups, and synthesizes the resulting tree.[^microsoft2025graphragdrift]

## Hybrid routing, lighter variants, and failure modes

LLM extraction and report generation drive roughly **75% of standard GraphRAG indexing cost**.[^microsoft2025graphragmethods][^microsoft2025graphragstart] Keep hybrid vector/BM25 for direct lookups and choose the lightest graph variant that fits your query rate and corpus churn:

| Architecture | Indexing work | Query-time evidence | Best fit |
|:---|:---|:---|:---|
| **Vector RAG** | Embeddings (+ BM25) | Top-k chunks | Fast fact lookups, high-churn corpora |
| **GraphRAG** | LLM extraction + Leiden + reports | Basic, Local, Global, DRIFT | High-volume themes on a stable corpus |
| **FastGraphRAG** | NLP noun-phrase graph + LLM reports[^microsoft2025graphragmethods] | Community reports + graph | Global synthesis on a tighter budget |
| **LazyGraphRAG** | NLP concept graph (~0.1% cost)[^lazygraphrag] | Budgeted relevance tests | Infrequent global queries, high churn |
| **LightRAG** | LLM entity/edge profiles[^guo2024LightRag] | Entity + relationship search | Incremental updates without report rebuilds |

On AP News (100 queries, 5,590 articles), low-budget **LazyGraphRAG** matched Global Search quality at >700x lower query cost, while a higher budget (~4% of Level-2 Global cost) beat baselines on both local and global criteria.[^lazygraphrag] Start with Parquet tables rather than a dedicated graph database, adding Neo4j or Neptune only for live cross-service traversals.[^microsoft2025graphragoutputs] Incremental updates merge new nodes cleanly, whereas **deletions** must remove edges supported solely by the removed document and rebuild affected reports.[^microsoft2025graphragcli]

Watch six failure modes: **stuffing 100K-<span data-glossary="token">token</span> prompts** (mid-context attention drops[^liu2023lost]); **routing direct lookups to GraphRAG** instead of vector/BM25; **skipping typed entity resolution** (`FlashAttention` vs. `flash-attn`); **unconstrained noun extraction** creating generic super-hubs; **unbudgeted full-corpus builds** (benchmark on a 1% sample first); and **stale report lineage** failing to invalidate summaries after edits or ACL revocations.

```mastery-quiz
[
  {
    "question": "Top-k vector search returns six near-duplicate passages on KV-cache fragmentation and misses kernel bandwidth and quantization. How should an analyst summarize corpus-wide themes and find which bottleneck appears in the most documents?",
    "options": [
      "Use community reports for themes, and count distinct documents by reviewed bottleneck label.",
      "Use community reports for themes, and rank labels by highest report impact rating.",
      "Use the six retrieved passages for themes, and count distinct documents by reviewed label.",
      "Use the six retrieved passages for themes, and rank labels by highest report impact rating."
    ],
    "answer": "Use community reports for themes, and count distinct documents by reviewed bottleneck label.",
    "explanation": "Community reports surface themes hidden by near-duplicate vector hits, while exact counts require deduplicating by document ID rather than ranking by impact score."
  },
  {
    "question": "Two disconnected triangles form a simple undirected graph with m = 6 edges. Each triangle is one community with e = 3 internal edges and degree sum K = 6. What is the modularity Q = sum[e/m - (K/(2m))^2]?",
    "options": [
      "0.00",
      "0.50",
      "1.00",
      "0.25"
    ],
    "answer": "0.50",
    "explanation": "Each triangle contributes 3/6 - (6/12)^2 = 0.25, so both together yield 0.50. Merging all nodes into one community gives 0.00."
  },
  {
    "question": "A local search has 96 tokens for context. Ordered highest score to lowest, four items cost 54, 60, 28, and 20 tokens. Which items does a greedy packer select, and how many tokens remain?",
    "options": [
      "54 (54 used, 42 free)",
      "60 and 28 (88 used, 8 free)",
      "54 and 28 (82 used, 14 free)",
      "28 and 20 (48 used, 48 free)"
    ],
    "answer": "54 and 28 (82 used, 14 free)",
    "explanation": "Take 54 (42 left), skip 60, take 28 (14 left), skip 20. Total used is 82 tokens with 14 free."
  },
  {
    "question": "A dynamic community selector expands a parent only when relevance >= 0.6. Root A scores 0.4 (child C is 0.9); Root B scores 0.7 (leaf D is 0.8). Which leaves are selected?",
    "options": [
      "Rate A, B, D; select D; leave C unvisited after A fails the threshold.",
      "Rate A, B, C, D; select C and D independently of parent scores.",
      "Rate A, C, B; select C; replace branch B with C.",
      "Rate A, B; select neither leaf after A fails."
    ],
    "answer": "Rate A, B, D; select D; leave C unvisited after A fails the threshold.",
    "explanation": "Top-down pruning stops at Root A (0.4 < 0.6), leaving Child C unvisited, while Root B opens Leaf D."
  },
  {
    "question": "A caller may read P1 and P2 but not restricted source R7. Report 1 summarizes P1, P2, and R7; Report 2 summarizes only P1 and P2. What may enter global map-reduce?",
    "options": [
      "Include both reports and scrub restricted phrases from the final answer.",
      "Include both reports and hide the R7 citation.",
      "Include only Report 2; exclude the mixed report or fall back to authorized sources.",
      "Drop both reports because their source sets differ."
    ],
    "answer": "Include only Report 2; exclude the mixed report or fall back to authorized sources.",
    "explanation": "A derived report's audience is the intersection of all contributing source ACLs. Exclude mixed reports before map-reduce."
  }
]
```

> **Next:** Continue to [ReAct & Plan-and-Execute](/learn/agentic-architectures-react-plan-execute).
