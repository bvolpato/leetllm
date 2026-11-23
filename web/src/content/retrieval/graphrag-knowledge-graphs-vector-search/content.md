---
{
  "id": "graphrag-knowledge-graphs-vector-search",
  "slug": "graphrag-knowledge-graphs-vector-search",
  "title": "GraphRAG & Knowledge Graphs",
  "shortDescription": "Top-k may explain one incident and miss the fleet pattern. Source-linked reports support broader answers when coverage, identity, and grants hold.",
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

An AI platform has 10,000 incident reports, runbooks, and trace summaries. An on-call engineer asks: "Why did `inference-api` breach the latency <span data-glossary="slo">service-level objective (SLO)</span> during release 2026.06.14?" Ordinary retrieval quickly finds the write-up about that service. When an analyst follows up asking "What are the top three recurring reasons model-serving incidents breach latency SLOs across the fleet?", a small <span data-glossary="top-k">top-k</span> result set can look convincing while covering only a couple of incidents from the same cluster. Similarity does not by itself provide theme coverage across an entire corpus.

The previous chapter changed how <span data-glossary="rag">retrieval-augmented generation (RAG)</span> forms a query and checks evidence. <span data-glossary="graphrag">GraphRAG</span> changes the representation. It indexes relationships, entities, and community summaries alongside the text, so a question can follow a connection or a corpus-level theme. That extra extraction helps only when <span data-glossary="vector">vector</span> similarity can't see the evidence you need.

Microsoft's GraphRAG architecture builds a graph index of entities and relationships, pregenerates hierarchical community reports, and <span data-glossary="embedding">embeds</span> those artifacts for retrieval [^edge2024][^microsoft2025graphragindex][^microsoft2025graphragdataflow]. The original paper evaluates global sensemaking on podcast and news corpora using LLM judges, showing notable gains in comprehensiveness and diversity over a vector RAG baseline. Those preferences highlight broad coverage benefits, though factual accuracy, exact incident counts, and domain fitness still require rigorous offline evaluation. A broader roadmap by Pan et al. places this work in the wider effort to combine LLMs with structured knowledge graphs [^pan2024].

Vector search ranks chunks that resemble the question. A graph index adds entity relationships and summary layers for cases where evidence spans multiple incidents. Standard GraphRAG local search builds ranked mixed context from graph and text artifacts. The small examples below use a custom directed, typed property graph so you can inspect each hop. Microsoft's standard entity graph instead represents relationships with descriptions and weights; it does not enforce this application-specific traversal protocol. If your product needs an explicit path walk, implement that policy and test it.[^microsoft2025graphragdataflow][^microsoft2025graphraglocal]

## Why small top-k retrieval can be insufficient

### The global query problem

Keep those 10,000 incident reports, runbooks, <span data-glossary="tracing">traces</span>, and postmortems as the running corpus. First ask what shape of evidence each question needs.

#### Local queries (vector search handles well)

For a specific question about one issue, vector search usually earns its keep:

> "What is the timeout for the embeddings API?"
> Retrieval path: top-5 similar documents, then answer from local context. This works because the needed evidence is concentrated in a few chunks.

The question is self-contained. A few chunks describing API specifications and runbooks contain everything the system needs.

#### Global queries (small top-k retrieval misses coverage)

For a question that must synthesize across the entire corpus, small top-k vector retrieval runs into a different problem:

> "What are the top 3 recurring reasons model-serving incidents breach the latency <span data-glossary="slo">SLO</span>?"
> Failure mode: no single chunk contains a cross-corpus summary, and a top-5 result set is unlikely to represent themes across 10,000 documents. The resulting answer can be incomplete or misleading.

Before raising `k`, predict what changes: coverage may grow, but top-k alone doesn't count every theme. Community reports broaden the evidence considered, yet they also compress and omit details. If "top three" means most frequent, define an incident taxonomy, label and deduplicate incidents, and count them. Report salience scores aren't frequency estimates.

### Why similarity-only retrieval struggles

Similarity ranking favors nearby vectors and can omit other important regions. Three different failures deserve separate remedies:

1. **Scattered evidence:** Individual write-ups may never state a fleet-wide theme. A summary question needs aggregation across records, because the nearest passage may cover only one incident.
2. **Repeated incidents:** Near-duplicate gateway reports can occupy several result slots when they rank closest to the query. Nearest-neighbor search follows distance to the query; it doesn't always select the densest cluster. Deduplication and diversity ranking can improve coverage, but don't turn top-k into a statistical sample.
3. **A limited context budget:** Raising $k$ can recover missing evidence. It also adds serialized text, with token growth depending on chunk lengths and packing. Long-context models may underuse information in some positions; the "lost in the middle" experiments demonstrate this risk, not an inevitable failure of every large prompt.[^liu2023lost]

Standard GraphRAG moves graph clustering and community summarization **offline**. Global search then distributes report batches across bounded prompts and reduces their partial answers. This broadens the summary units considered, while extraction and report compression can omit facts. Compare report coverage with the source corpus; frequency analysis needs its own computation.[^edge2024]

Its additional indexing stages are:

1. **Entity extraction** across the entire corpus
2. **Relationship modeling** between entities
3. **Community detection** to find natural clusters of related information
4. **Hierarchical summarization** at different levels of abstraction

| Feature | Vector Search (Standard RAG) | GraphRAG |
|:---|:---|:---|
| **Available artifacts** | Ranked text chunks | Text units, entities, relationships, community reports |
| **Natural starting point** | Specific evidence lookup ("What is X?") | Entity-focused or thematic analysis ("What are the trends?") |
| **Context construction** | Similarity-ranked chunks | Ranked graph/text context or report map-reduce |
| **Indexing work** | Embedding and optional sparse index | Additional extraction, clustering, reports, and embeddings |
| **Query work** | Retrieval plus generation | Depends on search mode; global search adds map-reduce calls |

<figure>
  <img src="illustrations/_generated/local_global_scope_dark.png" alt="Local search ranks mixed candidate records for one entity question: the candidate 0.98-score, 30-token relationship and 0.91-score, 55-token text unit fit an 85-of-90-token budget, while an 80-token report does not fit. Global search maps community reports in batches and returns cache, queue, and config report points. This walkthrough batches two reports per prompt; production GraphRAG packs by token limits." />
  <figcaption>The local packer fits a relationship and text unit into 85 of 90 tokens. The global pipeline maps two-report batches to three candidate report points; production batches use token limits. Ratings express query relevance. Source review checks whether each claim is supported. Frequency claims need reviewed labels, deduplication, and counts; causal claims need separate evaluation.</figcaption>
</figure>

## A concrete multi-hop example

Before naming graph pieces, predict what each route can see. Compare the two approaches on this tiny incident corpus:

> **Incident 1842:** "inference-api depends on redis-cache. Release 2026.06.14 of inference-api ran in us-east-1. Cache evictions and increased p95 latency were observed during the release."
> **Incident 2031:** "redis-cache in us-east-1 still uses the old maxmemory policy. The config migration is blocked by a compatibility test."
> **Incident 3155:** "inference-api breached the inference latency SLO twelve minutes after deploy. <span data-glossary="rollback">Rollback</span> restored latency."

The decision question is:

> **"Why did inference-api breach the latency SLO, and is this likely to happen again?"**

Suppose a top-two retriever returns Incident 3155 and Incident 1842 but misses Incident 2031. That's an assumed result for comparing evidence paths, not an executed vector-search benchmark. A semantic retriever does not strictly require the service's exact name. Later, a small lexical baseline makes this particular miss reproducible. That answer can identify the <span data-glossary="rollout">rollout</span> and cache eviction while missing the unresolved maxmemory policy.

Now add graph structure. Suppose extraction produced these entities and relationships, with source-chunk <span data-glossary="provenance">attribution links</span>:

- `(inference-api) --[ran_in]--> (us-east-1)`
- `(inference-api) --[depends_on]--> (redis-cache)`
- `(inference-api) --[released_as]--> (release 2026.06.14)`
- `(redis-cache) --[located_in]--> (us-east-1)`
- `(redis-cache) --[uses_policy]--> (old maxmemory policy)`
- `(old maxmemory policy) --[migration_blocked_by]--> (compatibility test)`

An evidence-backed traversal can start at `inference-api`, follow `depends_on` to `redis-cache`, and retrieve evidence about both the eviction event and the unresolved maxmemory policy. It may report the observed latency, cache evictions, dependency, and still-active policy. Those facts justify investigating the cache path, but they don't identify the policy as the cause or estimate the probability of another breach. In relationship-heavy retrieval, useful evidence is connected through entities that were not all present in the query.

Microsoft's standard local-search dataflow ranks graph and text artifacts into a <span data-glossary="context-window">context window</span>; generated answers depend on the retrieved artifacts and model behavior. If explicit multi-hop paths matter, preserve edge attribution and test the traversal policy. First check a smaller condition: does a proposed path connect, and do its source IDs resolve? Then evaluate whether the sources entail the edge labels.

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
    if not edges or any(not edge.source_chunks for edge in edges):
        return False, []
    if any(left.target != right.source for left, right in zip(edges, edges[1:])):
        return False, []
    if any(chunk not in known_chunks for edge in edges for chunk in edge.source_chunks):
        return False, []
    citations = sorted({chunk for edge in edges for chunk in edge.source_chunks})
    return True, citations

path = [
    Edge("inference-api", "depends_on", "redis-cache", ("incident-1842",)),
    Edge("redis-cache", "uses_policy", "old maxmemory policy", ("incident-2031",)),
]
unsupported_path = path + [
    Edge("old maxmemory policy", "will_cause", "future SLO breach", ()),
]

known_chunks = {"incident-1842", "incident-2031"}
print("connected path with known sources:", cited_path(path, known_chunks))
print("uncited prediction rejected:", cited_path(unsupported_path, known_chunks))
assert not cited_path([], known_chunks)[0]
assert not cited_path(list(reversed(path)), known_chunks)[0]
assert not cited_path([Edge("a", "uses", "b", ("invented",))], known_chunks)[0]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
connected path with known sources: (True, ['incident-1842', 'incident-2031'])
uncited prediction rejected: (False, [])
```
<!-- leetllm: output:end -->

The path recovered a note the top-two list missed. What must each hop record for the path to support a citation?

## Entities, edges, and source attribution

A knowledge graph represents information as a network of **entities** (nodes) and **relationships** (edges). A vector index ranks embeddings. Its records can also carry metadata and links. The graph makes selected relationships explicit instead of relying on similarity alone.

The basic unit is the **triple**: `(Subject) - [Predicate] -> (Object)`. Edge direction should follow the semantic meaning of the relation rather than generic reading order. From our running example, triples include `(inference-api) --[depends_on]--> (redis-cache)`, `(redis-cache) --[uses_policy]--> (old maxmemory policy)`, and `(old maxmemory policy) --[migration_blocked_by]--> (compatibility test)`.

This application uses a **property graph** rather than bare triples. Nodes and edges carry metadata such as `type`, `description`, `source_chunk_ids`, timestamps, or confidence. RDF-based knowledge graphs can also express source lineage; property graphs aren't a requirement for graph-assisted retrieval. In production, these fields are what you filter, cite, and rank at query time.

For this standalone demonstration, use `(canonical_title, canonical_type)`, not a title-only key. A real index also needs stable IDs scoped by tenant, environment, and source identity: even two `Service:gateway` records may name different services. Keep endpoint types and reviewed aliases, and reject ambiguous or unknown references. Case and whitespace normalization is a declared local convention; stripping punctuation would silently merge names such as `a-bc` and `ab-c`.

This graph structure mirrors how an on-call engineer traces an incident. When a query mentions `redis-cache`, typed relationships and source lineage can separate service dependencies, region-specific incidents, config drift, and release side effects. Service-name similarity alone cannot reliably make those distinctions.

### Separate graph traversal from learned message passing

Following `inference-api -> redis-cache -> old maxmemory policy` traverses existing relationships and returns their cited source chunks without training a model or updating a node embedding. In contrast, a <span data-glossary="graph-neural-network">graph neural network (GNN)</span> adds a separate learned model that combines node features, edges, and neighboring information to predict properties such as incident impact or service relevance [^kipf2016gcn]. A <span data-glossary="message-passing-neural-network">message-passing neural network (MPNN)</span> makes that distinction concrete: each layer computes messages from neighboring node features, aggregates them, and updates the destination node's learned representation [^gilmer2017mpnn].

Suppose `redis-cache` and another dependency contribute scalar messages `0.4` and `0.8`; mean aggregation produces `0.6`, which becomes an input to the next `inference-api` update. That learned update can help rank candidates, but predicted relationships must be verified against underlying source documents before treating them as facts. Standard GraphRAG can extract entities, follow stored edges, cluster communities, and prepare reports without training either a GNN or an MPNN.

```checkpoint
What makes a knowledge graph useful beyond storing triples?
---
The graph connects entities through typed relationships and citations. Retrieval can then follow meaningful paths, filter by metadata, and explain which source chunks support the path.
```

## The GraphRAG pipeline

### Phase 1: Graph construction (indexing)

The indexing phase turns raw document chunks into a structured graph index. Microsoft's default dataflow extracts entities and relationships, optionally extracts claims (covariates), uses <span data-glossary="entity-resolution">entity resolution</span> to identify descriptions of the same object, builds hierarchical communities, generates community reports, and embeds the artifacts used at query time [^microsoft2025graphragindex][^microsoft2025graphragdataflow]:

#### Step 1: Entity & relationship extraction

<figure>
  <img src="illustrations/_generated/entity_graph_dark.png" alt="Three extracted entities form a directed path: inference-api (Service), Redis Cache (Datastore), and Old Maxmemory Policy (ConfigPolicy). The depends_on edge cites source 1842 and uses_policy cites source 2031; the Redis Cache identity carries both source IDs." />
  <figcaption>The resolver associates both records with the reviewed Redis Cache identity. Each directed edge keeps its own source record: 1842 for `depends_on`, 2031 for `uses_policy`.</figcaption>
</figure>

Start with one text unit. Standard GraphRAG prompts an LLM to name entities and describe their relationships. Entity types can be tuned to the domain; a prompt's type list isn't an enforced ontology or proof of a clean graph. For this application, choose types such as `Service`, `Datastore`, `Region`, `Release`, `ConfigPolicy`, and `TestGate`, then validate them. Broad extraction can introduce low-information hubs; an overly narrow schema can lose useful connections. FastGraphRAG instead uses NLP noun-phrase extraction and co-occurrence edges, while still using an LLM for reports.[^microsoft2025graphragmethods]

This application-specific prompt proposes directed relation labels and typed endpoints. It isn't Microsoft's default extraction format:

```python title="step-1-entity-and-relationship-extraction.py"
EXTRACTION_PROMPT = """
Extract all entities and relationships from the following text.

Entities should include: services, datastores, regions, releases, config policies, and test gates.
Relationships may include: ran_in, depends_on, released_as, located_in, uses_policy, migration_blocked_by.
Extract only relationships asserted by the text. Preserve negation and uncertainty.
Co-occurrence and temporal order do not establish a dependency or a cause.

Text: {chunk_text}

Output as JSON:
{
  "entities": [
    {"name": "...", "type": "...", "description": "..."}
  ],
  "relationships": [
    {
      "source": "...",
      "source_type": "...",
      "target": "...",
      "target_type": "...",
      "type": "...",
      "description": "...",
      "strength": 1.0
    }
  ]
}
"""
```

That prompt isn't a parser. Use <span data-glossary="structured-output">structured output</span> when supported, or parse and validate the chosen format before indexing. A schema-valid object can still contain an unsupported relationship. Attach the input's source ID outside the model response. This system schema requires typed entities and typed endpoints: `source: "gateway"` is ambiguous when both a `Service` and a `Datastore` use that title. The `{chunk_text}` marker is conceptual; if you interpolate this with Python's `str.format`, escape the literal JSON braces.

**Entity resolution** needs more than a plausible name match. The original GraphRAG experiments use exact string matching, and the dataflow docs describe merging entities with the same title and type.[^edge2024][^microsoft2025graphragdataflow] They don't promise to establish that `redis-cache`, `Redis Cache`, and `redis-prod` identify one deployment. An LLM summary of merged descriptions isn't authoritative and can conceal contradictions. Preserve conflicting claims and their dates and sources.

The custom resolver below accepts only configured aliases and rejects ambiguous references. In production, stable identifiers and reviewed alias rules should establish identity within the tenant and environment before descriptions are combined.

The executable version accepts two reference documents whose relationships were specified for this example. Changed or unknown text is rejected. Its rules aren't an NLP extractor, and its numeric weights aren't calibrated probabilities. A real extractor needs schema validation plus reviewed tests for negation, uncertain claims, incorrect merges, and missing relationships.

After per-chunk extraction, GraphRAG merges entities that share a title and type, concatenates their descriptions, then asks a model to compress that list into one description per entity and relationship [^microsoft2025graphragdataflow]. The merge below does the bookkeeping; the LLM summary is the step you'd swap in later. It uses a typed canonical key, carries endpoint types on every edge, and fails closed when an untyped name matches more than one entity.

<!-- leetllm: test, output=show -->
```python title="step-1-entity-and-relationship-extraction-2.py"
from collections import defaultdict
from dataclasses import dataclass, field

@dataclass
class Entity:
    name: str
    type: str
    description: str
    source_chunk_ids: list[int] = field(default_factory=list)
    aliases: list[str] = field(default_factory=list)

@dataclass
class Relationship:
    source: str
    source_type: str
    target: str
    target_type: str
    type: str
    description: str
    confidence: float
    source_chunk_ids: list[int] = field(default_factory=list)

def canonicalize(value: str) -> str:
    normalized = " ".join(value.casefold().split())
    if not normalized:
        raise ValueError("entity names and types must be nonempty")
    return normalized

def entity_key(name: str, entity_type: str) -> tuple[str, str]:
    """Identify an entity by canonical title and canonical type."""
    return canonicalize(name), canonicalize(entity_type)

def extract_from_chunk(chunk_id: int, chunk: str) -> tuple[list[Entity], list[Relationship]]:
    reviewed_texts = {
        1842: "inference-api depends on redis-cache. Release 2026.06.14 of inference-api ran in us-east-1. Cache evictions and increased p95 latency were observed during the release.",
        2031: "redis-cache in us-east-1 still uses the old maxmemory policy. The config migration is blocked by a compatibility test.",
    }
    if reviewed_texts.get(chunk_id) != chunk:
        raise ValueError("unknown or changed document text requires relationship review")
    chunk = chunk.casefold()
    entities: list[Entity] = []
    relationships: list[Relationship] = []

    if "inference-api" in chunk:
        entities.append(Entity("inference-api", "Service", "Inference API service", [chunk_id]))
    if "redis-cache" in chunk:
        entities.append(Entity("Redis Cache", "Datastore", "Shared cache dependency", [chunk_id]))
    if "us-east-1" in chunk:
        entities.append(Entity("US East 1", "Region", "Production region", [chunk_id]))
    if "release 2026.06.14" in chunk:
        entities.append(Entity("Release 2026.06.14", "Release", "Inference API deployment", [chunk_id]))
    if "old maxmemory policy" in chunk:
        entities.append(Entity("Old Maxmemory Policy", "ConfigPolicy", "Policy still in use", [chunk_id]))
    if "compatibility test" in chunk:
        entities.append(Entity("Compatibility Test", "TestGate", "Migration-blocking test", [chunk_id]))

    entity_keys = {entity_key(entity.name, entity.type) for entity in entities}
    if {entity_key("inference-api", "Service"), entity_key("Redis Cache", "Datastore")} <= entity_keys:
        relationships.append(
            Relationship(
                source="inference-api", source_type="Service",
                target="Redis Cache", target_type="Datastore",
                type="depends_on", description="Service uses cache",
                confidence=1.0, source_chunk_ids=[chunk_id],
            )
        )
    if {entity_key("inference-api", "Service"), entity_key("US East 1", "Region")} <= entity_keys:
        relationships.append(
            Relationship(
                source="inference-api", source_type="Service",
                target="US East 1", target_type="Region",
                type="ran_in", description="Service ran in region",
                confidence=0.9, source_chunk_ids=[chunk_id],
            )
        )
    if {entity_key("inference-api", "Service"), entity_key("Release 2026.06.14", "Release")} <= entity_keys:
        relationships.append(
            Relationship(
                source="inference-api", source_type="Service",
                target="Release 2026.06.14", target_type="Release",
                type="released_as", description="Service release observed in source",
                confidence=0.8, source_chunk_ids=[chunk_id],
            )
        )
    if chunk_id == 2031 and {entity_key("Redis Cache", "Datastore"), entity_key("US East 1", "Region")} <= entity_keys:
        relationships.append(
            Relationship(
                source="Redis Cache", source_type="Datastore",
                target="US East 1", target_type="Region",
                type="located_in", description="Cache region",
                confidence=0.8, source_chunk_ids=[chunk_id],
            )
        )
    if {entity_key("Redis Cache", "Datastore"), entity_key("Old Maxmemory Policy", "ConfigPolicy")} <= entity_keys:
        relationships.append(
            Relationship(
                source="Redis Cache", source_type="Datastore",
                target="Old Maxmemory Policy", target_type="ConfigPolicy",
                type="uses_policy", description="Cache still uses the old policy",
                confidence=0.8, source_chunk_ids=[chunk_id],
            )
        )
    if {entity_key("Old Maxmemory Policy", "ConfigPolicy"), entity_key("Compatibility Test", "TestGate")} <= entity_keys:
        relationships.append(
            Relationship(
                source="Old Maxmemory Policy", source_type="ConfigPolicy",
                target="Compatibility Test", target_type="TestGate",
                type="migration_blocked_by", description="Migration from this policy is blocked by the test",
                confidence=0.7, source_chunk_ids=[chunk_id],
            )
        )

    return entities, relationships

def deduplicate_entities(entities: list[Entity]) -> list[Entity]:
    merged: dict[tuple[str, str], Entity] = {}
    for entity in entities:
        key = entity_key(entity.name, entity.type)
        if key not in merged:
            merged[key] = Entity(
                name=entity.name,
                type=entity.type,
                description=entity.description,
                source_chunk_ids=sorted(set(entity.source_chunk_ids)),
                aliases=list(entity.aliases),
            )
            continue
        existing = merged[key]
        existing.source_chunk_ids = sorted(set(existing.source_chunk_ids + entity.source_chunk_ids))
        existing.aliases = sorted(set(existing.aliases + entity.aliases))
        if entity.name != existing.name and entity.name not in existing.aliases:
            existing.aliases.append(entity.name)
        if entity.description not in existing.description:
            existing.description = f"{existing.description}; {entity.description}"
    return [merged[key] for key in sorted(merged)]

def index_entities(
    entities: list[Entity],
) -> tuple[dict[tuple[str, str], Entity], dict[str, list[Entity]]]:
    by_key = {entity_key(entity.name, entity.type): entity for entity in entities}
    if len(by_key) != len(entities):
        raise ValueError("deduplicate identities before resolving references")
    by_name: dict[str, dict[tuple[str, str], Entity]] = defaultdict(dict)
    for entity in entities:
        key = entity_key(entity.name, entity.type)
        by_name[canonicalize(entity.name)][key] = entity
        for alias in entity.aliases:
            by_name[canonicalize(alias)][key] = entity
    return by_key, {name: list(candidates.values()) for name, candidates in by_name.items()}

def resolve_entity(
    name: str,
    entity_type: str | None,
    by_key: dict[tuple[str, str], Entity],
    by_name: dict[str, list[Entity]],
) -> Entity:
    """Resolve a typed reference, or reject an ambiguous untyped reference."""
    if entity_type:
        candidates = [candidate for candidate in by_name.get(canonicalize(name), [])
                      if canonicalize(candidate.type) == canonicalize(entity_type)]
        if len(candidates) != 1:
            raise ValueError(f"Unknown or ambiguous typed entity: {name!r} ({entity_type})")
        return candidates[0]

    candidates = by_name.get(canonicalize(name), [])
    if not candidates:
        raise ValueError(f"Unknown entity reference: {name!r}")
    if len(candidates) > 1:
        candidate_types = ", ".join(sorted({candidate.type for candidate in candidates}))
        raise ValueError(
            f"Ambiguous entity reference {name!r}; endpoint type required ({candidate_types})"
        )
    return candidates[0]

def resolve_relationships(
    relationships: list[Relationship],
    entities: list[Entity],
) -> list[Relationship]:
    """Resolve both endpoints by typed identity and merge duplicate edges."""
    by_key, by_name = index_entities(entities)
    merged: dict[tuple[tuple[str, str], tuple[str, str], str], Relationship] = {}
    for relationship in relationships:
        source = resolve_entity(relationship.source, relationship.source_type, by_key, by_name)
        target = resolve_entity(relationship.target, relationship.target_type, by_key, by_name)
        edge_key = (
            entity_key(source.name, source.type),
            entity_key(target.name, target.type),
            canonicalize(relationship.type),
        )
        resolved = Relationship(
            source=source.name,
            source_type=source.type,
            target=target.name,
            target_type=target.type,
            type=relationship.type,
            description=relationship.description,
            confidence=relationship.confidence,
            source_chunk_ids=sorted(set(relationship.source_chunk_ids)),
        )
        if edge_key not in merged:
            merged[edge_key] = resolved
            continue
        existing = merged[edge_key]
        existing.source_chunk_ids = sorted(
            set(existing.source_chunk_ids + resolved.source_chunk_ids)
        )
        existing.confidence = max(existing.confidence, resolved.confidence)
        if resolved.description not in existing.description:
            existing.description = f"{existing.description}; {resolved.description}"
    return [merged[key] for key in sorted(merged)]

def extract_graph_elements(chunks: dict[int, str]) -> tuple[list[Entity], list[Relationship]]:
    all_entities: list[Entity] = []
    all_relationships: list[Relationship] = []

    for chunk_id, chunk in chunks.items():
        entities, relationships = extract_from_chunk(chunk_id, chunk)
        all_entities.extend(entities)
        all_relationships.extend(relationships)

    deduped_entities = deduplicate_entities(all_entities)
    return deduped_entities, resolve_relationships(all_relationships, deduped_entities)

chunks = {
    1842: "inference-api depends on redis-cache. Release 2026.06.14 of inference-api ran in us-east-1. Cache evictions and increased p95 latency were observed during the release.",
    2031: "redis-cache in us-east-1 still uses the old maxmemory policy. The config migration is blocked by a compatibility test.",
}

entities, relationships = extract_graph_elements(chunks)
relationship_types = {rel.type for rel in relationships}

print(
    "entity identities:",
    ", ".join(sorted(f"{entity.type}:{entity.name}" for entity in entities)),
)
print("relationships:", ", ".join(sorted(relationship_types)))
print(
    "resolved edges:",
    ", ".join(
        sorted(f"{rel.source} -[{rel.type}]-> {rel.target}" for rel in relationships)
    ),
)

ambiguous_entities = deduplicate_entities(
    [
        Entity("gateway", "Service", "API gateway", [8]),
        Entity("gateway", "Datastore", "Gateway state store", [9]),
    ]
)
try:
    resolve_relationships(
        [
            Relationship(
                source="gateway",
                source_type="",
                target="gateway",
                target_type="Service",
                type="depends_on",
                description="Untrusted untyped source",
                confidence=0.5,
                source_chunk_ids=[10],
            )
        ],
        ambiguous_entities,
    )
except ValueError as error:
    print("ambiguous endpoint rejected:", error)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
entity identities: ConfigPolicy:Old Maxmemory Policy, Datastore:Redis Cache, Region:US East 1, Release:Release 2026.06.14, Service:inference-api, TestGate:Compatibility Test
relationships: depends_on, located_in, migration_blocked_by, ran_in, released_as, uses_policy
resolved edges: Old Maxmemory Policy -[migration_blocked_by]-> Compatibility Test, Redis Cache -[located_in]-> US East 1, Redis Cache -[uses_policy]-> Old Maxmemory Policy, inference-api -[depends_on]-> Redis Cache, inference-api -[ran_in]-> US East 1, inference-api -[released_as]-> Release 2026.06.14
ambiguous endpoint rejected: Ambiguous entity reference 'gateway'; endpoint type required (Datastore, Service)
```
<!-- leetllm: output:end -->

```checkpoint
Why should extracted relationships store source chunk IDs and endpoint types?
---
Graph paths still need evidence and unambiguous endpoints. Source chunk IDs let the answer cite the text that produced each edge, while endpoint types let the resolver distinguish same-titled entities such as a `Service` and a `Datastore`. If an edge omits a type and the title has multiple candidates, reject the edge instead of guessing.
```

#### Step 2: Build the knowledge graph

In this custom application, store the resolved elements as a directed property graph. Nodes hold type and description; edges hold relation type, weight, and source chunk IDs.

Later retrieval can follow relationships that never appeared together in one chunk.

The next function builds a small adjacency structure. It keeps typed canonical IDs internally and uses display names only when printing. Microsoft GraphRAG also stores structured artifacts in tables; its relationship schema and context policy differ from this sketch.[^microsoft2025graphragoutputs]

<!-- leetllm: test, output=show -->
```python title="step-2-build-the-knowledge-graph.py"
from collections import defaultdict
from dataclasses import dataclass, field

@dataclass
class Entity:
    name: str
    type: str
    description: str
    source_chunk_ids: list[int] = field(default_factory=list)

@dataclass
class Relationship:
    source: str
    source_type: str
    target: str
    target_type: str
    type: str
    description: str
    confidence: float
    source_chunk_ids: list[int] = field(default_factory=list)

def canonicalize(value: str) -> str:
    normalized = " ".join(value.casefold().split())
    if not normalized:
        raise ValueError("entity names and types must be nonempty")
    return normalized

def entity_key(name: str, entity_type: str) -> tuple[str, str]:
    return canonicalize(name), canonicalize(entity_type)

def build_knowledge_graph(
    entities: list[Entity],
    relationships: list[Relationship],
) -> dict:
    """Store a directed property graph as nodes plus typed outbound edges."""
    nodes = {
        entity_key(entity.name, entity.type): {
            "name": entity.name,
            "type": entity.type,
            "description": entity.description,
            "source_chunk_ids": entity.source_chunk_ids,
        }
        for entity in entities
    }
    out_edges: dict[tuple[str, str], list[dict]] = defaultdict(list)
    if len(nodes) != len(entities):
        raise ValueError("deduplicate reviewed identities before graph construction")
    for rel in relationships:
        source_key = entity_key(rel.source, rel.source_type)
        target_key = entity_key(rel.target, rel.target_type)
        if not rel.source_chunk_ids:
            raise ValueError("edge has no source chunk attribution")
        if source_key not in nodes or target_key not in nodes:
            raise ValueError(f"relationship references unknown entity: {rel.source} -> {rel.target}")
        out_edges[source_key].append(
            {
                "target": target_key,
                "type": rel.type,
                "description": rel.description,
                "weight": rel.confidence,
                "source_chunk_ids": rel.source_chunk_ids,
            }
        )
    return {"nodes": nodes, "out_edges": dict(out_edges)}

entities = [
    Entity("inference-api", "Service", "Inference API service", [0]),
    Entity("Redis Cache", "Datastore", "Shared cache dependency", [0]),
    Entity("US East 1", "Region", "Production region", [0, 1]),
]
relationships = [
    Relationship(
        "inference-api", "Service", "Redis Cache", "Datastore",
        "depends_on", "Service uses cache", 1.0, [0]
    ),
    Relationship(
        "inference-api", "Service", "US East 1", "Region",
        "ran_in", "Service ran in region", 0.9, [0]
    ),
]

graph = build_knowledge_graph(entities, relationships)
edge_tuples = sorted(
    (graph["nodes"][source]["name"], edge["type"], graph["nodes"][edge["target"]]["name"])
    for source, edges in graph["out_edges"].items()
    for edge in edges
)
depends_on = next(
    edge["weight"]
    for edge in graph["out_edges"][entity_key("inference-api", "Service")]
    if edge["type"] == "depends_on"
)

print("nodes:", sorted(node["name"] for node in graph["nodes"].values()))
print("edges:", edge_tuples)
print("US East 1 node type:", graph["nodes"][entity_key("US East 1", "Region")]["type"])
print("depends_on weight:", depends_on)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
nodes: ['Redis Cache', 'US East 1', 'inference-api']
edges: [('inference-api', 'depends_on', 'Redis Cache'), ('inference-api', 'ran_in', 'US East 1')]
US East 1 node type: Region
depends_on weight: 1.0
```
<!-- leetllm: output:end -->

#### Step 3: Community detection (Leiden algorithm)

For questions about patterns across many records, inspecting edges one at a time gets tedious. Community detection groups connected nodes into candidate themes. For this custom graph, one possible clustering input is an **undirected** projection. Retain the original directed records for retrieval rather than trying to reconstruct their types afterward. Microsoft's clustering code normalizes endpoint direction, deduplicates edge pairs, and passes weights to hierarchical Leiden; its optional largest-connected-component filter can omit smaller components [^graphragClustering2026]. Clusters can suggest operational themes such as cache pressure versus eval harness flakiness, but their membership follows extracted topology and edge weights; inspect source evidence to determine whether cluster members truly share a root cause.

**Leiden** addresses a defect of Louvain: moving a bridge node can leave an internally disconnected community. Leiden adds a refinement phase and guarantees connected communities under the paper's assumptions. Stronger guarantees require iteration. Connectedness describes graph structure; verify community meaning and summary claims against source material.[^traag2019]

Leiden can optimize different objectives, including **modularity** and the Constant Potts Model.[^traag2019] Microsoft's inspected wrapper chooses modularity with resolution 1.0.[^graphragLeidenWrapper2026] Modularity compares within-community adjacency against a degree-based null model; a high score isn't a semantic quality or extraction-accuracy score.

For a simple, unweighted, undirected graph with $m>0$ and resolution 1:

$$
Q = \frac{1}{2m} \sum_{i,j} \left[ A_{ij} - \frac{k_i k_j}{2m} \right] \delta(c_i, c_j)
$$

Breaking down each term reveals the intuition:
- $A_{ij}$ is the actual adjacency matrix entry (1 if an edge connects nodes $i$ and $j$, and 0 otherwise).
- $k_i$ and $k_j$ are the degrees of nodes $i$ and $j$.
- $m$ is the total number of undirected edges ($2m$ is the sum of all node degrees).
- $\frac{k_i k_j}{2m}$ is the null model's expected adjacency contribution. It can exceed 1, so it isn't a probability of an edge in a simple graph.
- $\delta(c_i, c_j)$ is the Kronecker delta (1 if nodes $i$ and $j$ belong to the same community, 0 otherwise).

Each same-community pair contributes a surplus or deficit. $Q>0$ requires a positive **total**, not one pair exceeding expectation. Putting all nodes in one community gives $Q=0$ for this definition.

Microsoft's **hierarchical Leiden** flow recursively splits communities toward a configured size threshold.[^microsoft2025graphragdataflow] Don't confuse those recursive subdivisions with the aggregation phase inside a Leiden run. The hierarchy is a forest: Level 0 can contain several communities, and branches do not need to reach the same depth. The original paper reports **34** Level-0 communities for its podcast corpus and **55** for its news corpus, not one all-corpus root.[^edge2024]

In a hierarchical partition, Level 0 might group Serving & Latency alongside Quality & Tooling. A split of Serving & Latency could create Level-1 Cache and Queue communities. Those names and cluster partitions must be inferred and reviewed, not assumed from the level number.

```checkpoint
What does high modularity mean in a GraphRAG entity graph?
---
Entities inside the same community connect more densely than random chance would predict in the extracted graph. Validate the entity and edge evidence before treating that cluster as a real topic.
```

Score two candidate partitions of the same undirected graph. The cache group contains five of six edges; the separate eval pair contains one. With no cross-group edge, their contributions are `5/6 - (10/12)^2` and `1/6 - (2/12)^2`, totaling about `0.278`. These two groups were chosen by hand. The code evaluates modularity; it doesn't run Leiden, find an optimum, or generate a hierarchy.

<!-- leetllm: test, output=show -->
```python title="step-3-score-community-modularity.py"
from collections import defaultdict

def modularity(
    nodes: list[str],
    undirected_edges: list[tuple[str, str]],
    community: dict[str, str],
) -> float:
    """Newman modularity Q for an unweighted undirected graph."""
    if len(set(nodes)) != len(nodes) or set(community) != set(nodes):
        raise ValueError("unique nodes and one community label per node are required")
    if not undirected_edges:
        raise ValueError("modularity is undefined for a graph with no edges")
    seen = set()
    adjacency: dict[str, set[str]] = defaultdict(set)
    degree: dict[str, int] = {node: 0 for node in nodes}
    for source, target in undirected_edges:
        edge = frozenset((source, target))
        if source not in degree or target not in degree or source == target or edge in seen:
            raise ValueError("expected a simple graph: known endpoints, no loops or duplicate edges")
        seen.add(edge)
        adjacency[source].add(target)
        adjacency[target].add(source)
        degree[source] += 1
        degree[target] += 1
    two_m = 2 * len(undirected_edges)
    total = 0.0
    for i in nodes:
        for j in nodes:
            if community[i] != community[j]:
                continue
            a_ij = 1.0 if j in adjacency[i] else 0.0
            total += a_ij - (degree[i] * degree[j]) / two_m
    return total / two_m

nodes = [
    "inference-api",
    "redis-cache",
    "us-east-1",
    "old-maxmemory",
    "compatibility-test",
    "eval-harness",
    "flaky-judge",
]
edges = [
    ("inference-api", "redis-cache"),
    ("inference-api", "us-east-1"),
    ("redis-cache", "us-east-1"),
    ("redis-cache", "old-maxmemory"),
    ("old-maxmemory", "compatibility-test"),
    ("eval-harness", "flaky-judge"),
]
one_bucket = {node: "all" for node in nodes}
split = {
    "inference-api": "cache",
    "redis-cache": "cache",
    "us-east-1": "cache",
    "old-maxmemory": "cache",
    "compatibility-test": "cache",
    "eval-harness": "eval",
    "flaky-judge": "eval",
}

print("one community Q:", round(modularity(nodes, edges, one_bucket), 3))
print("cache vs eval Q:", round(modularity(nodes, edges, split), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
one community Q: 0.0
cache vs eval Q: 0.278
```
<!-- leetllm: output:end -->

Hierarchical clustering creates nested groups, which can be summarized at several levels. Static global search uses reports at a chosen level. Dynamic community selection rates branches and descends selectively, skipping branches irrelevant to the user's question.

<figure>
  <img src="illustrations/_generated/community_hierarchy_dark.png" alt="A sample latency query applies a 0.5 relevance threshold to a two-root community forest. Serving at 0.9 passes, then Cache at 0.8 and Queue at 0.7 pass; Eval at 0.1 prunes its branch, so Judges and Metrics stay unrated. In a counterfactual where Serving scores 0.2, Cache's candidate score of 0.8 stays unseen because the selector stops at the root." />
  <figcaption>Each root is scored first. Serving clears the 0.5 threshold and opens Cache and Queue; Eval falls below it, so Judges and Metrics remain unscored. If Serving were rated 0.2, the selector would never see Cache's candidate score of 0.8. This walkthrough provides the two roots, their child links, and the relevance scores. Microsoft's GraphRAG indexing flow applies hierarchical Leiden to derive communities from graph structure.</figcaption>
</figure>

#### Step 4: Community summarization

Eligible communities become precomputed **Community Reports**. The default prompt requests a descriptive title, summary, findings, a 0–10 **impact severity rating**, and a rating explanation [^graphragReportPrompt2026]. The title is generated prose, not a canonical entity ID. Findings refer to referenced entity, relationship, and claim record IDs; resolve those records back to their text units before verifying source support.

The rating is a prompt-defined model judgment of impact or importance, rather than calibrated outage severity, recurrence probability, query relevance, or incident frequency. A high-impact security community may be irrelevant to a latency query, while a low-impact configuration note may contain the exact evidence needed. These precomputed reports become retrieval artifacts, allowing Global Search to compare summaries instead of sending thousands of raw chunks through map-reduce. The adapter below lists the extracted evidence lines to show that interface.

<!-- leetllm: test, output=show -->
```python title="step-4-community-summarization.py"
from dataclasses import dataclass
from typing import Protocol

@dataclass(frozen=True)
class Entity:
    name: str
    description: str
    source_chunk_ids: tuple[int, ...]

@dataclass(frozen=True)
class Relationship:
    source: str
    type: str
    target: str
    source_chunk_ids: tuple[int, ...]

class CommunitySummarizer(Protocol):
    def summarize(self, prompt: str) -> str: ...

class EvidenceListingSummarizer:
    def summarize(self, prompt: str) -> str:
        return "\n".join(line for line in prompt.splitlines() if line.startswith("- "))

def summarize_community(
    community_entities: list[Entity],
    community_relationships: list[Relationship],
    level: int,
    summarizer: CommunitySummarizer,
) -> str:
    if (not community_entities or not community_relationships
        or any(not entity.source_chunk_ids for entity in community_entities)
        or any(not rel.source_chunk_ids for rel in community_relationships)):
        raise ValueError("report requires source-linked entity and relationship evidence")
    entity_lines = "\n".join(
        f"- {entity.name}: {entity.description} [chunks: {entity.source_chunk_ids}]"
        for entity in community_entities
    )
    relationship_lines = "\n".join(
        f"- {rel.source} {rel.type} {rel.target} [chunks: {rel.source_chunk_ids}]"
        for rel in community_relationships
    )
    prompt = (
        f"Community level: {level}\n"
        f"Entities:\n{entity_lines}\n"
        f"Relationships:\n{relationship_lines}\n"
        "Summarize the main operational pattern."
    )
    return summarizer.summarize(prompt)

summary = summarize_community(
    [Entity("Redis Cache", "Cache in us-east-1", (2031,))],
    [Relationship("Redis Cache", "uses_policy", "Old Maxmemory Policy", (2031,))],
    level=0,
    summarizer=EvidenceListingSummarizer(),
)

print(summary)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
- Redis Cache: Cache in us-east-1 [chunks: (2031,)]
- Redis Cache uses_policy Old Maxmemory Policy [chunks: (2031,)]
```
<!-- leetllm: output:end -->

#### Authorization continuity for graph artifacts

Community reports aggregate dozens or hundreds of text units into a single summary. This creates a critical security risk: **indirect information leakage**. If any single text unit in that community is restricted, a global-search answer that synthesizes the report can leak confidential facts to callers who lack permission to read the original document, even when chunk-level vector search enforces strict <span data-glossary="acl">access control lists (ACLs)</span>.

Suppose three text units land in one Leiden community:

| Text unit | ACL | Fact in unit |
|---|---|---|
| `tu-public-slo` | `all-staff` | p95 latency SLO is 200 ms |
| `tu-security-key` | `security-only` | production key rotation requires break-glass approval |
| `tu-public-runbook` | `all-staff` | restart cache before scale-out |

An offline report over all three chunks **can** include the restricted key-rotation requirement. If global search includes that report for an unauthorized caller, the protected information has entered model context even though leaf retrieval blocked `tu-security-key`. Whether the final answer repeats it doesn't repair that access violation.

Include a derived report only when the caller can read **every contributing source** at its current version. Sources may have different ACLs; a caller authorized for all of them can read the combined report. The report's permitted audience is their intersection, not their union. Output scrubbing cannot repair including an unauthorized source in the prompt.

These are deployment controls to add and verify, not built-in authorization guarantees of the reference examples. Carry access grants through every tier of the graph index:

1. **Text units:** Every chunk maintains tenant and principal ACL metadata (standard enterprise RAG security architecture).
2. **Entities and edges:** Authorize the exact evidence used to construct each returned node description and relationship. A public endpoint doesn't make a restricted edge public. Similarly, an authorized fact about an entity doesn't grant access to descriptions merged from restricted documents.
3. **Community reports:** Reject reports with any contributing source the caller cannot read. To serve different audiences, choose and evaluate a conservative pattern:
   - **Equivalence-class partitioning:** Build separate community hierarchies and reports strictly within homogeneous ACL security perimeters (e.g. an `all-staff` report built exclusively from `all-staff` chunks).
   - **Per-principal dynamic recomputation:** At query time, filter the caller's authorized text units and generate community summaries on the fly from that permitted subset.
   - **Fail-closed drop with local fallback:** Drop any community report that contains one or more unauthorized source units from the map-reduce pool. If too many reports are dropped, fall back to local entity search over authorized nodes.
4. **Cascading revocation and deletion:** Block dependent graph artifacts and cached contexts as soon as a source version or permission changes. Check current versions and grants on reads, then rebuild affected artifacts asynchronously. Track transitive dependencies through child reports too. A stale report must remain unreadable while rebuilding; asynchronous regeneration isn't permission to keep serving it.

Every graph retrieval mode needs the same fail-closed rule: **authz before map-reduce**, not after the summary is already in context. Ask it of this report before the map step: can the caller read every source it compressed? [RAG Security & Access Control](/learn/enterprise-rag-security-rbac-access-control) asks that question when a vector filter runs only after forbidden text has already been copied out.

```checkpoint
Why can community reports leak data even when vector search is ACL-aware?
---
A summary can carry restricted facts without retrieving the original chunk at query time. Check every contributing source before injecting the report into context. Mixed ACL labels aren't themselves a denial condition; the caller must have all required permissions.
```

### Phase 2: Query processing (runtime)

At runtime, GraphRAG exposes **Basic Search**, **Local Search**, **Global Search**, and **DRIFT Search**. Local search builds mixed context for entity-centric questions, while global search synthesizes over community reports. Basic Search serves as a text-unit vector baseline, whereas DRIFT (Dynamic Reasoning and Inference with Flexible Traversal) starts from community reports and executes local-search follow-ups [^microsoft2025graphraglocal][^microsoft2025graphragglobal][^microsoft2025graphragdrift].

#### Local search (specific questions)

Local search goes beyond named-entity matching and one-hop neighbors by first mapping the query into semantically related entities. It then ranks a mixed context from connected entities, relationships, community reports, linked text units, and optional covariates if claim extraction is enabled [^microsoft2025graphraglocal].

The runnable example below is a bounded neighborhood walk for intuition. For the incident question, predict that two hops from `inference-api` reach `Redis Cache` and `Old Maxmemory Policy`. The walk expands candidates; ranking and source attribution still decide what enters context. It isn't a copy of GraphRAG's context builder or ranking policy:

<!-- leetllm: test, output=show -->
```python title="local-search-specific-questions.py"
class EntityStore:
    def __init__(self, entity_names: list[str]) -> None:
        self.entity_names = entity_names

    def exact_name_matches(self, query: str, k: int = 10) -> list[str]:
        if k < 0:
            raise ValueError("k must be a nonnegative integer")
        query_lower = query.lower()
        matches = [
            entity for entity in self.entity_names if entity.lower() in query_lower
        ]
        return matches[:k]

def neighbors(graph: dict, node: str) -> set[str]:
    names = {edge["target"] for edge in graph["out_edges"].get(node, [])}
    for source, edges in graph["out_edges"].items():
        for edge in edges:
            if edge["target"] == node:
                names.add(source)
    return names

def expand_entity_neighborhood(graph: dict, entity_names: list[str], hops: int = 1) -> set[str]:
    if hops < 0:
        raise ValueError("hops must be a nonnegative integer")
    nodes: set[str] = set(entity_names)
    frontier: set[str] = set(entity_names)
    for _ in range(hops):
        next_frontier: set[str] = set()
        for node in frontier:
            next_frontier.update(neighbors(graph, node))
        frontier = next_frontier - nodes
        nodes.update(frontier)
    return nodes

def collect_relationships(graph: dict, nodes: set[str]) -> list[tuple[str, str, str]]:
    return sorted(
        (source, edge["type"], edge["target"])
        for source, edges in graph["out_edges"].items()
        if source in nodes
        for edge in edges
        if edge["target"] in nodes
    )

def local_search(
    query: str,
    entity_store: EntityStore,
    graph: dict,
    text_units: dict[str, list[str]],
    community_reports: dict[str, list[str]],
) -> str:
    mapped_entities = entity_store.exact_name_matches(query, k=10)
    neighborhood_entities = sorted(expand_entity_neighborhood(graph, mapped_entities, hops=2))
    relationships = collect_relationships(graph, set(neighborhood_entities))
    context = "\n".join(
        [
            f"Entities: {neighborhood_entities}",
            f"Relationships: {relationships}",
            f"Text units: { {entity: text_units.get(entity, []) for entity in neighborhood_entities} }",
            f"Reports: { {entity: community_reports.get(entity, []) for entity in neighborhood_entities} }",
        ]
    )
    return f"Candidate context only (no generated answer):\n{context}"

graph = {
    "out_edges": {
        "inference-api": [{"target": "Redis Cache", "type": "depends_on"}],
        "Redis Cache": [{"target": "Old Maxmemory Policy", "type": "uses_policy"}],
    }
}

answer = local_search(
    "Why did inference-api breach the latency SLO?",
    EntityStore(["inference-api", "Redis Cache", "Old Maxmemory Policy"]),
    graph,
    text_units={"inference-api": ["inference-api breached the latency SLO after release 2026.06.14."]},
    community_reports={"Redis Cache": ["The cache still uses the old maxmemory policy; migration is blocked."]},
)

print(answer)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Candidate context only (no generated answer):
Entities: ['Old Maxmemory Policy', 'Redis Cache', 'inference-api']
Relationships: [('Redis Cache', 'uses_policy', 'Old Maxmemory Policy'), ('inference-api', 'depends_on', 'Redis Cache')]
Text units: {'Old Maxmemory Policy': [], 'Redis Cache': [], 'inference-api': ['inference-api breached the latency SLO after release 2026.06.14.']}
Reports: {'Old Maxmemory Policy': [], 'Redis Cache': ['The cache still uses the old maxmemory policy; migration is blocked.'], 'inference-api': []}
```
<!-- leetllm: output:end -->

This name matcher isn't semantic search. Its neighborhood function considers incoming and outgoing edges for candidate discovery while retaining each relation's original direction. The printed string is context, not an answer, and this isolated sketch has no ACL or source-content checks. The integrated exercise below adds those controls.

The actual context-builder problem includes a <span data-glossary="token-budget">token budget</span>: entities, relationships, text units, and reports compete for room. The greedy knapsack packer below selects scored graph and text records under a hard token cap. It doesn't optimize total utility; count the fully serialized context with the target tokenizer and reserve instructions, query, and output space separately.

<!-- leetllm: test, output=show -->
```python title="pack-ranked-local-context-under-a-budget.py"
from dataclasses import dataclass
import numpy as np

@dataclass(frozen=True)
class Candidate:
    source: str
    score: float
    tokens: int
    citation: str

def pack_context(candidates: list[Candidate], token_budget: int) -> list[Candidate]:
    if token_budget < 0:
        raise ValueError("budget must be a nonnegative integer")
    if len({item.source for item in candidates}) != len(candidates):
        raise ValueError("deduplicate candidate identities before packing")
    if any(item.tokens <= 0 or not item.citation for item in candidates):
        raise ValueError("candidates need positive token counts and citations")
    scores = np.array([item.score for item in candidates])
    rank_order = np.argsort(-scores)
    selected: list[Candidate] = []
    used = 0
    for idx in rank_order:
        candidate = candidates[idx]
        if used + candidate.tokens <= token_budget:
            selected.append(candidate)
            used += candidate.tokens
    return selected

candidates = [
    Candidate("relationship: depends_on", 0.98, 30, "incident-1842"),
    Candidate("text: maxmemory issue", 0.91, 55, "incident-2031"),
    Candidate("report: cache overview", 0.62, 80, "community-7"),
]
selected = pack_context(candidates, token_budget=90)

print("selected:", [item.source for item in selected])
print("citations:", [item.citation for item in selected])
print("tokens:", sum(item.tokens for item in selected))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
selected: ['relationship: depends_on', 'text: maxmemory issue']
citations: ['incident-1842', 'incident-2031']
tokens: 85
```
<!-- leetllm: output:end -->

#### Global search (broad questions)

For questions that need cross-corpus coverage, GraphRAG uses a **map-reduce** over community reports at a chosen hierarchy level. The docs batch reports and produce rated intermediate points during map. Map calls process separate report batches; reduce then selects rated points across those batches for the final answer. A point's rating is a relevance judgment, not an incident count or proof that its claim is true [^edge2024][^microsoft2025graphragglobal].

The following example groups four community report strings to expose map and reduce mechanics. A keyword rule assigns fixed ratings, and ties preserve input order. This is neither LLM summarization nor a ranking by incident frequency. It selects up to three matching reports and retains their report IDs; those IDs still need source-level attribution in a real index.

<!-- leetllm: test, output=show -->
```python title="global-search-broad-questions.py"
from dataclasses import dataclass

@dataclass(frozen=True)
class RatedPoint:
    text: str
    rating: int
    report_id: str

def batch_reports(reports: list[tuple[str, str]], batch_size: int = 2) -> list[list[tuple[str, str]]]:
    if batch_size <= 0:
        raise ValueError("batch_size must be a positive integer")
    return [reports[index:index + batch_size] for index in range(0, len(reports), batch_size)]

def map_report_batch(query: str, report_batch: list[tuple[str, str]]) -> list[RatedPoint]:
    points: list[RatedPoint] = []
    query_lower = query.lower()
    asks_about_latency = any(term in query_lower for term in ("latency", "slo", "miss", "delay"))
    for report_id, report in report_batch:
        report_lower = report.lower()
        if asks_about_latency and any(term in report_lower for term in ("latency", "slo", "queue", "eviction")):
            points.append(RatedPoint(report, rating=9, report_id=report_id))
        elif "security" in query_lower and "credential" in report_lower:
            points.append(RatedPoint(report, rating=6, report_id=report_id))
    return points

def select_top_points(points: list[RatedPoint], top_k: int) -> list[RatedPoint]:
    if top_k < 0:
        raise ValueError("top_k must be a nonnegative integer")
    return sorted(points, key=lambda point: point.rating, reverse=True)[:top_k]

def global_search(
    query: str,
    reports_by_level: dict[int, list[tuple[str, str]]],
    level: int,
) -> str:
    """Select report-level candidates; no semantic synthesis is performed."""
    batches = batch_reports(reports_by_level[level], batch_size=2)
    mapped_points = [
        point
        for batch in batches
        for point in map_report_batch(query, batch)
    ]
    top_points = select_top_points(mapped_points, top_k=3)
    bullets = "\n".join(f"- [{point.report_id}] {point.text}" for point in top_points)
    return f"Selected synthetic report points for '{query}':\n{bullets or '(none)'}"

reports_by_level = {
    1: [
        ("report-cache", "Latency breaches cluster around cache eviction storms."),
        ("report-queue", "GPU queue starvation delays batch inference jobs."),
        ("report-eval", "Evaluation failures cluster around flaky judge prompts."),
        ("report-config", "SLO breaches recur after cache config drift."),
    ]
}

answer = global_search(
    "What are the main reasons services miss the latency SLO?",
    reports_by_level,
    level=1,
)

print(answer)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Selected synthetic report points for 'What are the main reasons services miss the latency SLO?':
- [report-cache] Latency breaches cluster around cache eviction storms.
- [report-queue] GPU queue starvation delays batch inference jobs.
- [report-config] SLO breaches recur after cache config drift.
```
<!-- leetllm: output:end -->

The `level` argument exposes a cost choice. Static global search builds **token-bounded batches** of eligible reports at the chosen level and runs map calls over those batches. Fifty reports don't imply fifty calls: packing, filtering, report lengths, and configured limits determine the batch count. Parallelism affects elapsed time, not the total number of billed calls.[^graphragGlobalContext2026]

**Dynamic community selection** rates reports against the query before map-reduce. It starts with the **Level-0 communities**, explores children of selected communities, and prunes irrelevant branches.[^microsoft2025graphragdynamic][^graphragDynamicSelection2026] In the illustrated latency example, Serving passes and its Cache and Queue children are rated; Eval falls below threshold and its children are skipped.

Consider the cost and recall trade-offs before running this hierarchical pruning policy. It retains only relevant leaf reports and lacks a recovery pass. Microsoft's selector has additional behavior, including a fallback when no relevant community is found; this cell isolates the pruning risk rather than copying that implementation.

<!-- leetllm: test, output=show -->
```python title="a-relevance-mistake-hides-a-child.py"
import numpy as np

roots = ["serving", "eval"]
children = {
    "serving": ["cache", "queue"],
    "eval": ["judges", "metrics"],
}

def select_leaf_reports(scores: dict[str, float], threshold: float = 0.5) -> tuple[list[str], list[str]]:
    if not 0.0 <= threshold <= 1.0:
        raise ValueError("invalid threshold")
    visited, selected = [], []

    def visit(report: str) -> None:
        score = scores[report]
        if not 0.0 <= score <= 1.0:
            raise ValueError("invalid relevance score")
        visited.append(report)
        if score < threshold:
            return
        descendants = children.get(report, [])
        if not descendants:
            selected.append(report)
        for child in descendants:
            visit(child)

    for root in roots:
        visit(root)
    return visited, selected

# Map-stage relevance scores assigned to community report points.
scores = {"serving": 0.9, "eval": 0.1, "cache": 0.8, "queue": 0.7}
visited, selected = select_leaf_reports(scores)
print("rated:", visited)
print("selected:", selected)

missed_parent = dict(scores, serving=0.2)
visited, selected = select_leaf_reports(missed_parent)
assert "cache" not in visited and scores["cache"] >= 0.5
print("parent false negative:", visited, "selected:", selected)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rated: ['serving', 'cache', 'queue', 'eval']
selected: ['cache', 'queue']
parent false negative: ['serving', 'eval'] selected: []
```
<!-- leetllm: output:end -->

Microsoft's **November 15, 2024** AP News experiment reports **77% lower average token cost** for dynamic versus static Level-1 search on 50 global questions. The LLM-judge comparisons found no statistically significant difference on the reported quality criteria; evaluate factual accuracy directly before claiming equivalence.[^microsoft2025graphragdynamic]

The deeper Level-3 comparison used the **29 of 50** questions for which it included more reports than static Level 1. Table 1 reports a 58.8% comprehensiveness win rate on that subset and **34% higher average cost**. Neither result is a fixed saving for this incident example or an unbiased all-question estimate of deeper-search quality.[^microsoft2025graphragdynamic]

Rating calls also cost tokens and time. Measure saved map work and missed evidence together: an inexpensive false negative at a parent can conceal a useful descendant.

#### DRIFT search

DRIFT (Dynamic Reasoning and Inference with Flexible Traversal) bridges global thematic search with fine-grained local search [^microsoft2025graphragdrift]. It combines community context with iterative local-search follow-ups:
1. **Thematic primer**: It uses semantically related community reports to build initial answers and follow-up questions.
2. **Follow-up query generation**: Based on the primer, the engine generates targeted follow-up questions to drill into specific ambiguities or entity details.
3. **Local searches**: It builds ranked local context for follow-up questions and can generate further questions. This isn't necessarily an explicit directed path traversal.
4. **Answer synthesis**: The system merges the resulting question-answer tree into a final response grounded in both high-level context and low-level source citations.

Use DRIFT when a query spans both macro-level themes and micro-level entity facts, and benchmark its latency and token spend against standard local search on representative workloads.

## Hybrid graph-vector architecture

Don't treat vector search and GraphRAG as mutually exclusive. The GraphRAG stack already mixes graph structure with embeddings during both indexing and query-time context building [^microsoft2025graphragindex][^microsoft2025graphraglocal]. One hybrid architecture looks like this:

Evaluate the router's supported-answer accuracy, <span data-glossary="p95-latency">p95 latency</span>, and spend for each query class. A text route may cover most requests in workloads dominated by direct evidence lookups. Analyst-heavy workloads may justify more graph/report queries. Each candidate route is evaluated against accuracy, p95 latency, and cost ceilings. The function applies threshold validation to evaluated metrics and returns no route if none qualifies.

<!-- leetllm: test, output=show -->
```python title="release-graph-routes-from-evaluation.py"
from dataclasses import dataclass
import numpy as np

@dataclass(frozen=True)
class RouteResult:
    route: str
    query_class: str
    supported_accuracy: float
    p95_ms: int

def release_route(
    results: list[RouteResult],
    query_class: str,
    minimum_accuracy: float,
    maximum_p95_ms: int,
) -> str | None:
    if not 0.0 <= minimum_accuracy <= 1.0 or maximum_p95_ms < 0:
        raise ValueError("invalid quality or latency threshold")
    eligible = [
        result for result in results
        if result.query_class == query_class
        and result.supported_accuracy >= minimum_accuracy
        and result.p95_ms <= maximum_p95_ms
    ]
    if not eligible:
        return None
    accuracies = np.array([r.supported_accuracy for r in eligible])
    latencies = np.array([r.p95_ms for r in eligible])
    order = np.lexsort((latencies, -accuracies))
    return eligible[order[0]].route

results = [
    RouteResult("basic", "fact_lookup", 0.96, 95),
    RouteResult("local", "fact_lookup", 0.96, 240),
    RouteResult("basic", "corpus_trend", 0.61, 92),
    RouteResult("global", "corpus_trend", 0.91, 580),
]

print("fact route:", release_route(results, "fact_lookup", 0.90, 200))
print("trend route:", release_route(results, "corpus_trend", 0.90, 700))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fact route: basic
trend route: global
```
<!-- leetllm: output:end -->

One subtle detail: GraphRAG the technique doesn't require a dedicated graph database. Microsoft's reference implementation writes structured output tables to disk and builds query context from those artifacts directly. A graph database like Neo4j or Neptune becomes useful when you need custom traversals, shared KG infrastructure, or analyst-facing graph queries outside the stock pipeline [^microsoft2025graphragoutputs].

### Query expansion and context bridging

Beyond simple routing, the knowledge graph layer can enrich vector results through query expansion and context bridging. Query expansion uses entities found in initial vector results to expand the search query, finding semantically related but textually distinct content. Context bridging matters when two retrieved chunks don't directly connect: if edges retain supporting chunks, a traversal can identify intermediate entities for retrieval and citation.

For example, if one chunk mentions "`inference-api` depends on `redis-cache`" and another mentions "`redis-cache` still uses the old maxmemory policy," a policy can inspect `inference-api -> redis-cache -> old maxmemory policy`, then fetch source text before answering. Result ranking can boost text results with short, supported paths to query entities, though node proximity alone does not prove answer support.

## What the extra index costs

### Indexing cost

The extra structure has to earn its cost. A standard GraphRAG index does more work before the first query than vector-only RAG: it adds LLM-heavy graph extraction, summarization, community report generation, and multiple embedding passes [^edge2024][^microsoft2025graphragdataflow]. Whether the resulting query quality justifies that additional investment is an empirical evaluation question for each production deployment.

#### Mitigation strategies

To keep indexing affordable, start cheap. Microsoft recommends fast, inexpensive models while you learn the system [^microsoft2025graphragstart]. Their indexing-methods docs estimate that graph extraction (entity and relationship extraction plus their summarization) is roughly **75% of standard indexing cost** [^microsoft2025graphragmethods].

If your use case is mostly global summarization, benchmark **FastGraphRAG**. It replaces LLM entity extraction with NLP noun phrases and defines edges by co-occurrence within a text unit. Co-occurrence doesn't assert a dependency or cause. It still generates community reports with an LLM; actual savings and graph usefulness depend on the corpus and configuration.[^microsoft2025graphragmethods]

#### LazyGraphRAG in practice

Microsoft Research introduced **LazyGraphRAG** in November 2024 [^lazygraphrag]. It targets a central cost concern with standard GraphRAG: paying for an LLM-driven index before knowing how often graph-assisted queries will run.

A **June 6, 2025** editor's note reports integration into Microsoft Discovery and Azure Local services. That reflects product packaging rather than formal verification of this tutorial's reference implementation. Current Microsoft documentation calls the local offering **Agentic Retrieval in Foundry Local** and marks it as preview; verify the intended product's supported search modes before selecting an implementation.[^foundryLocalRetrieval2026]

LazyGraphRAG defers LLM use to query time. Its index uses NLP noun-phrase extraction and graph statistics for community structure, without entity summaries or precomputed community reports.

In Microsoft's reported experiment, indexing cost matched the vector RAG setup and was about **0.1% of full GraphRAG indexing cost** [^lazygraphrag]. Treat that as a benchmark result, not a constant for every corpus.

At query time, LazyGraphRAG blends vector similarity with community structure and exposes a **relevance test budget** that trades query cost for quality.

In the same write-up, a low-budget setting was comparable to GraphRAG global search on global queries at more than 700 times lower query cost, and a higher budget (about 4% of global-search query cost at community level 2) beat the tested alternatives on both local and global criteria [^lazygraphrag]. Those comparisons used LLM-as-judge win rates on 100 synthetic queries over 5,590 AP news articles.

Precomputed community reports aren't the only candidate for global sensemaking. If the corpus changes frequently or global queries are rare, benchmark alternative architectures against standard GraphRAG.

#### LightRAG: Dual-level retrieval and incremental updates

**LightRAG** (Guo et al., first posted October 2024) extracts entities and relationships and creates text profiles for graph records. Its **dual-level retrieval** concerns query keywords: low-level keywords retrieve entity detail, while high-level keywords retrieve broader relationships. It combines graph records and linked source chunks without standard GraphRAG's hierarchy of community reports.[^guo2024LightRag]

High-level retrieval isn't a separate set of community-report-like topic nodes, nor does it count every corpus theme. The paper's incremental algorithm extracts a new document's graph and merges its nodes and edges into the existing graph. This avoids report regeneration, but doesn't make additions free or establish correct deletion, revocation, and contradiction handling.[^guo2024LightRag]

Compare what each design does, rather than assigning universal quality or cost rankings:

| Design | Indexing distinction | Query evidence | Maintenance question |
|:---|:---|:---|:---|
| **Vector RAG** | Chunk embeddings, optionally sparse indexing | Ranked source chunks; expansion can add hops | Can corrected and deleted chunks be withdrawn promptly? |
| **Standard GraphRAG** | LLM graph extraction and reports | Basic, local, global, or DRIFT context | Which merges, communities, and reports change after an update? |
| **FastGraphRAG** | NLP co-occurrence graph plus LLM reports | Report synthesis or configured graph/text context | Are noisy noun phrases and report dependencies manageable? |
| **LazyGraphRAG** | NLP concept graph; no precomputed reports | Budgeted relevance tests and query-time synthesis | Does deferred work suit query volume and refresh cadence? |
| **LightRAG** | LLM graph records and profiles; no community-report hierarchy | Entity and relationship retrieval plus source chunks | Are incremental merges and source removal auditable? |

If reusable community reports are a core product requirement, the standard index provides structured summary artifacts that alternative paths intentionally omit. Use observed quality and workload volume to compare indexing strategies rather than choosing from architecture labels:

<!-- leetllm: test, output=show -->
```python title="choose-index-strategy-from-workload.py"
from dataclasses import dataclass
import numpy as np

@dataclass(frozen=True)
class Strategy:
    name: str
    index_cost: float
    query_cost: float
    supported_accuracy: float

def choose_strategy(
    strategies: list[Strategy], query_count: int, accuracy_floor: float
) -> tuple[str, float] | None:
    if query_count < 0 or not 0.0 <= accuracy_floor <= 1.0:
        raise ValueError("invalid workload or quality threshold")
    eligible = [
        s for s in strategies
        if s.supported_accuracy >= accuracy_floor
    ]
    if not eligible:
        return None
    index_costs = np.array([s.index_cost for s in eligible], dtype=np.float64)
    query_costs = np.array([s.query_cost for s in eligible], dtype=np.float64)
    total_costs = index_costs + query_count * query_costs
    best_idx = int(np.argmin(total_costs))
    return eligible[best_idx].name, float(total_costs[best_idx])

# Example cost units and quality inputs for the decision calculation.
strategies = [
    Strategy("lazy", index_cost=1.0, query_cost=1.7, supported_accuracy=0.91),
    Strategy("precomputed_reports", index_cost=200.0, query_cost=0.8, supported_accuracy=0.93),
]

print("few queries:", choose_strategy(strategies, query_count=10, accuracy_floor=0.90))
print("many queries:", choose_strategy(strategies, query_count=500, accuracy_floor=0.90))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
few queries: ('lazy', 18.0)
many queries: ('precomputed_reports', 600.0)
```
<!-- leetllm: output:end -->

```checkpoint
What part of LazyGraphRAG makes its reported indexing cost close to the vector RAG comparison?
---
It skips LLM entity and relationship summarization and doesn't precompute community reports. Its index uses NLP noun-phrase extraction plus graph statistics, while LLM work happens at query time. The exact cost ratio still depends on the evaluated corpus and configuration.
```

### Query cost

Include index refreshes and query volume in total cost. Runtime queries can also cost more than a simple vector baseline:

- Local search: Usually moderate. You still have to build a mixed context from entity embeddings, graph neighborhoods, text units, and community reports, but the response path is much narrower than global search [^microsoft2025graphraglocal].
- Global search: Potentially expensive. Cost grows with the number of community-report batches you need to map over and the hierarchy level you choose [^microsoft2025graphragglobal].

#### Mitigation strategies

At query time, evaluate whether coarse reports answer adequately before paying for finer context. **Larger level numbers** mean deeper subdivisions; more reports can increase map work, while missing reports and unbalanced branches complicate coverage. Compare answer quality across levels on held-out queries.[^edge2024][^microsoft2025graphragglobal]

### Graph maintenance

Knowledge graphs aren't static. They have to change when the document corpus changes. Keeping the graph aligned with those edits is a separate pipeline from embedding a new chunk.

Current GraphRAG releases expose explicit `update` flows and `standard-update` / `fast-update` methods. The output tables also include fields used for incremental update merges [^microsoft2025graphragcli][^microsoft2025graphragoutputs].

- Additions: When new documents arrive, the system must extract entities and relationships, then merge them into the existing graph. New connections can shift community structure, requiring reclustering and regeneration of affected reports.
- Deletions: Removing a document is not the same operation as deleting one table row. The system must trace and remove nodes or edges supported solely by that document. If removed evidence changes graph structure, communities and reports may need recomputation.
- Strategy: Even with update support, a deployment may prefer scheduled refreshes for structural artifacts. Entity merges, community cluster partitions, and report summaries can shift when new documents arrive, so online reclustering is harder to operate than plain vector re-indexing.

### When to use GraphRAG

GraphRAG isn't a default replacement for retrieval. It adds indexing and maintenance for analytical workloads. Label real queries before committing to the architecture:

| Scenario | Start with vector RAG | Add GraphRAG when |
|:---|:---|:---|
| **Fact lookup** ("What is the embeddings API timeout?") | Strong, cheap baseline | Extra structure rarely pays off |
| **Entity investigation** ("Why did inference-api breach the SLO?") | Works if evidence sits in similar chunks | Linked entities or reports recover missing hops |
| **Global summary** ("What are the top 3 SLO reasons?") | Small top-k underrepresents themes | Community reports are built for this class |
| **Relationship-heavy question** ("How does Redis config drift affect inference latency?") | Needs expansion or luck | Graph-linked evidence can help; test path policy |
| **Corpus change rate** | Frequent edits, direct lookups | Stable corpus, reusable reports, or rare global queries that still matter |

The pragmatic path: start with vector search. Add a graph layer only when you can show a failure that reports or cited paths fix:

1. Users ask questions that need synthesis across many documents
2. You need to trace influence chains (what depends on what) with source attribution
3. Global sensemaking is a core use case, not an edge case
4. The corpus is large and stable enough that indexing cost can amortize

## Failure modes beyond a 200-document prototype

Scaling from a small <span data-glossary="sandbox">sandbox</span> corpus to production exposes six recurring operational failure modes:

| Failure mode | Operational symptom | Root cause & mitigation |
|:---|:---|:---|
| **Stuffing long context windows** | 100K-<span data-glossary="token">token</span> prompts miss recurring themes or contradict themselves | Models under-attend to mid-context evidence[^liu2023lost] and pay quadratic prefill cost; benchmark hierarchical community reports against long-context prompting. |
| **Replacing vector search wholesale** | Direct fact lookups become slow and expensive | GraphRAG complements rather than replaces chunk retrieval; route point lookups to hybrid vector/BM25 search and reserve local/global graph modes for multi-hop or thematic queries. |
| **Skipping entity resolution** | `RedisCache`, `redis-cache`, and `redis.internal` split into disconnected components | Key nodes by `(canonical_title, canonical_type)` within a single tenant/environment scope, carrying source lineage on every alias merge. |
| **Unbounded noun extraction** | Generic nouns (`service`, `team`, `alert`) form million-edge super-hubs | Constrain extraction to high-signal domain types (`Service`, `Datastore`, `ConfigPolicy`, `Runbook`) and audit high-degree hub nodes against multi-hop recall. |
| **Unbudgeted full-corpus indexing** | First production build exhausts LLM token quotas | Extrapolate per-chunk extraction and report-generation token spend on a 1% sample first, or defer LLM synthesis via LazyGraphRAG when global queries are infrequent. |
| **Stale graph and report lineage** | Deleted or revised documents linger inside cached community summaries | Track `text_unit_ids` on every node, edge, and community report so document edits, deletions, and ACL revocations invalidate downstream summaries promptly. |

## Run one retrieval comparison

The earlier cells isolate mechanisms and run on CPU without credentials. [Download the complete incident graph lab](assets/incident_graph_lab.py) to execute the same three-record example end to end with `uv run incident_graph_lab.py`. It performs lexical top-two retrieval, follows two directed graph edges, and returns source IDs. No embedding model, LLM extractor, Leiden optimizer, or answer generator is invoked.

The expected evidence set `{1842, 2031, 3155}` is a test-author annotation for the incident question. Each edge stores its supporting quotation and source-text hash. Before following it, retrieval checks the caller's group, the source version, and the quotation. A hash binds an edge to a version; it doesn't independently establish semantic support.

After saving the download under `assets/`, this cell runs its checks:

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
  <figcaption>The lab adds record 2031 through the dependency and policy edges, moving annotated recall from 2/3 to 3/3. Lineage checks verify record identity, version, access, and quotation integrity; review source text for semantic support and evaluate causal claims separately.</figcaption>
</figure>

The lexical baseline retrieves 1842 and 3155, so annotated evidence recall is `2/3`. Graph expansion adds 2031 through the extracted dependency path, raising recall to `3/3` on this benchmark example. Removing an edge loses that gain. Revoking, editing, or deleting 2031 blocks both its graph contribution and any report derived from its old version.

The lab also replaces the reviewed policy edge with `inference-api --[will_cause]--> future SLO breach`, keeping the genuine quotation and matching source hash. That false edge still adds record 2031 in one hop. Its source checks pass because the code verifies identity, version, access, and quotation presence, not whether the quotation entails the relation. A valid citation can therefore accompany a false claim. Measure extraction precision/recall and answer support separately on reviewed examples. The `group` argument also assumes an already authenticated caller; it isn't an authentication service or a complete multi-tenant policy engine.

Evaluate point lookups, multi-hop entity investigations, and corpus-wide thematic summaries on separate slices so graph indexing earns its token and maintenance budget only where cited multi-hop paths or authorized community reports measurably outperform hybrid chunk retrieval.

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
    "explanation": "Reports from different communities can surface themes the six cache passages miss. To compare frequency, deduplicate the fleet records by incident ID, then count incidents under each reviewed failure label. A rare failure can have the highest impact rating. Using the six passages for themes and impact ratings for frequency makes both mistakes."
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
    "explanation": "Each triangle contributes 3/6 − (6/12)² = 0.25. Adding both contributions gives 0.50. A score of 0.25 counts just one triangle. A score of 1.00 adds the internal edge fractions without subtracting the expected shares. A score of 0.00 applies if you put all the nodes in one community."
  },
  {
    "question": "A local search has 96 tokens for evidence. In order from highest score to lowest, four items cost 54, 60, 28 and 20 tokens. The packer considers each item in that order and takes the whole item if it fits. Which items enter the context, and how many tokens remain?",
    "options": [
      "54 (54 used, 42 free)",
      "60 and 28 (88 used, 8 free)",
      "54 and 28 (82 used, 14 free)",
      "28 and 20 (48 used, 48 free)"
    ],
    "answer": "54 and 28 (82 used, 14 free)",
    "explanation": "Taking 54 leaves 42 tokens. Skip 60, take 28, and skip 20 because only 14 tokens remain. Stopping at the first item that fails to fit leaves 54 alone and misses 28. Taking 60 and 28 fills more space but skips the highest-scored item. Taking 28 and 20 packs the shortest items first."
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
    "explanation": "Hashes, resolvable sources and endpoint identity do not establish entailment. Preserve the supported dependency and evaluate the causal claim separately."
  },
  {
    "question": "Two entities share title Atlas, one a Service and one a Datastore in the same environment. An edge gives the title but no endpoint type. What should the resolver do?",
    "options": [
      "Resolve to the first Service record; preserve its type and source as the endpoint identity.",
      "Reject the ambiguous title; require a reviewed endpoint type before storing this relationship.",
      "Merge the Service and Datastore records; use the shared canonical title as their identity.",
      "Infer the endpoint type from graph degree; use that inferred type to store this relationship."
    ],
    "answer": "Reject the ambiguous title; require a reviewed endpoint type before storing this relationship.",
    "explanation": "The resolver uses canonical title plus type and fails closed when an untyped name has multiple candidates. Tenant/environment/stable-source scope adds further production identity requirements."
  },
  {
    "question": "A report depends on the old S2 source version through an old child report. S2 is corrected while other sources remain unchanged. Which old artifacts must be blocked immediately? The corrected source remains eligible under normal checks.",
    "options": [
      "Old S2 blocked; old child blocked; old parent still served; unrelated reports unchanged during rebuilding.",
      "Old S2 citation removed; old child still served; old parent still served; unrelated reports unchanged.",
      "Old S2 blocked; old child blocked; old parent blocked; unrelated reports unchanged during rebuilding.",
      "Old S2 blocked; old child blocked; old parent blocked; unrelated independent reports also blocked."
    ],
    "answer": "Old S2 blocked; old child blocked; old parent blocked; unrelated reports unchanged during rebuilding.",
    "explanation": "Dependency invalidation is transitive and immediate for the old source version and its old descendants. Regeneration can happen asynchronously, but stale or unauthorized content must stay out of context while rebuilding. The corrected source may pass current authorization checks; independent artifacts need not change."
  },
  {
    "question": "A custom no-fallback selector expands a parent only at relevance>=0.6. Root A scores 0.4; its child C has score 0.9. Root B scores 0.7 and leaf D scores 0.8. Which leaves are selected?",
    "options": [
      "Rate A,B,D; select D; leave C unvisited after its parent fails the relevance threshold.",
      "Rate A,B,C,D; select C,D; visit both leaves independently of their parent relevance.",
      "Rate A,C,B; select C; replace the passing B branch with the higher C score.",
      "Rate A,B; select neither leaf; let A's failed threshold reject the separate B branch."
    ],
    "answer": "Rate A,B,D; select D; leave C unvisited after its parent fails the relevance threshold.",
    "explanation": "Parent-gated traversal visits B and D but never reaches C. The example isolates a false-negative risk; the reference implementation has additional recovery behavior."
  },
  {
    "question": "Fact gates require accuracy>=0.92 and p95<=250 ms; trend gates require 0.92 and 700 ms. Basic/local facts score 0.94/130 and 0.96/320; Basic/global trends score 0.70/100 and 0.95/640. Which routes are eligible?",
    "options": [
      "Facts:Local at 0.96/320; trends:Basic at 0.70/100.",
      "Facts:Basic at 0.94/130; trends:Basic at 0.70/100.",
      "Facts:Local at 0.96/320; trends:Global at 0.95/640.",
      "Facts:Basic at 0.94/130; trends:Global at 0.95/640."
    ],
    "answer": "Facts:Basic at 0.94/130; trends:Global at 0.95/640.",
    "explanation": "Local facts fail the 250 ms ceiling; Basic trends fail the 0.92 quality floor. Route eligibility requires both constraints before any ranking or release choice."
  },
  {
    "question": "A quality-qualified deferred strategy costs 5+2Q and a precomputed strategy costs 125+0.5Q in cost units for Q queries, with one refresh. Which total-cost choice follows at Q=50 and Q=500?",
    "options": [
      "Q=50: precomputed 150; Q=500: precomputed 375.",
      "Q=50: deferred 105; Q=500: precomputed 375.",
      "Q=50: deferred 105; Q=500: deferred 1005.",
      "Q=50: precomputed 150; Q=500: deferred 1005."
    ],
    "answer": "Q=50: deferred 105; Q=500: precomputed 375.",
    "explanation": "Compute index cost plus query volume times query cost after quality eligibility. At50 queries the totals are 105 and150; at 500 they are 1005 and375. Equality is atQ=80 for these inputs. Choosing from index cost or per-query slope alone gives the wrong volume decision; refreshes can change the deployment choice."
  },
  {
    "question": "A caller can read public sources P1 and P2 but not restricted R7. A report combines all three and a second report uses only P1/P2. What may enter query-time map context?",
    "options": [
      "Public report included; mixed report included; remove restricted-looking phrases from the final answer.",
      "Public report included; mixed report included; hide the restricted source reference before showing citations.",
      "Public report included; mixed report dropped; use permitted recomputation or local fallback before mapping.",
      "Public report dropped; mixed report dropped; reject the public summary because its audience differs from R7."
    ],
    "answer": "Public report included; mixed report dropped; use permitted recomputation or local fallback before mapping.",
    "explanation": "A derived report requires access to every contributing current source. Audience intersection includes the public report while excluding the mixed report for this caller; final-output filtering is too late."
  }
]
```

> **Next:** Continue to [RAG Security & Access Control](/learn/enterprise-rag-security-rbac-access-control). GraphRAG puts vector candidates, entities, and community reports on one retrieval surface. The next chapter asks who may read that surface: row-level security, document <span data-glossary="acl">ACLs</span>, and per-user filters must run before protected evidence reaches model context.
