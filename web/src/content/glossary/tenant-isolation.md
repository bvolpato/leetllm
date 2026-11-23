---
title: Tenant isolation
aliases: ["multi-tenant isolation"]
importance: 78
---
**Tenant isolation** is the set of controls that keep one customer, workspace, organization, or account from reading, writing, billing, or affecting another tenant's data, compute, configuration, caches, tools, or outputs. In multi-tenant SaaS, many tenants share code and often share infrastructure; isolation is the product boundary that makes sharing safe.

A **tenant** is the isolation unit your product defines (company, workspace, project, or end-user account). Trusted code binds tenant identity from authenticated credentials, then enforces that binding on every shared path: databases, vector indexes, object storage, semantic caches, queues, workers, logs, exports, and admin tools. The model can reason over tenant-scoped context; authorization stays in code.

## Intuition

Treat tenancy as a hard partition of *who may see and change what*, not as a soft preference in a prompt.

| Layer | What isolation means |
| --- | --- |
| Identity | Tenant id comes from a verified token or session, never from a free-form header the client invents |
| Data | Rows, blobs, and vectors are either physically separate or always queried with a tenant predicate |
| Retrieval | Grounding chunks for RAG are drawn only from stores the caller may access |
| Cache | Keys include tenant (and often principal scope); similarity alone cannot cross the wall |
| Tools / agents | Credentials and allowlists are minted for this tenant only |
| Ops | Traces, debug UIs, analytics exports, and offboarding respect the same wall |

Classic SaaS literature (AWS SaaS tenant isolation strategies) names three shapes: **silo** (dedicated stack per tenant), **pool** (shared stack with logical separation), and **bridge** (hybrid: silo for some tenants or some resources, pool for the rest). OWASP's multi-tenant security guidance maps the data side to separate databases, separate schemas, shared tables with row-level security (RLS), or hybrid tiers. Vector databases add a fourth practical axis: **namespace (or collection) per tenant** versus **one index with a metadata filter** such as `tenant_id`.

## How it works

### 1. Bind tenant context early

On every request:

1. Authenticate the caller (JWT, session, mTLS).
2. Resolve `tenant_id` (and membership) from that verified identity.
3. Reject inactive or unknown tenants.
4. Propagate the bound context into DB sessions, retrieval clients, cache keys, queue messages, and audit events.

Never trust `X-Tenant-ID` or a body field alone. That is tenant context injection: the attacker picks another tenant and walks in.

### 2. Choose a storage isolation model

| Model | Mechanism | Isolation strength | Typical use |
| --- | --- | --- | --- |
| Silo / store-per-tenant | Separate DB, index, bucket, or cluster | Smaller resource blast radius; still needs access controls on shared services | Regulated or enterprise tiers, noisy-neighbor SLAs |
| Schema / namespace | Shared DB or vector index; separate schema, collection, or namespace | Logical separation; strength depends on credentials and enforced access, not the name | Mid-scale B2B SaaS |
| Pool / row or metadata | Shared tables; `tenant_id` column or payload field + filters / RLS | Dense packing; every access path must enforce the policy | High tenant count, cost-sensitive products |
| Bridge / hybrid | Mix of the above by tier or resource | Variable | Dedicated vector index for whale tenants; pooled for free tier |

For pooled data, defense in depth means application filters *and* database enforcement. PostgreSQL RLS is one pattern: trusted application code sets `app.current_tenant`, then policies restrict rows. **FORCE** RLS subjects ordinary table-owner queries to policies, but superusers and `BYPASSRLS` roles still bypass them; an owner can also change the policy. Use a least-privilege runtime role.

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON documents
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

For pooled connections, set the verified tenant with transaction-local `set_config('app.current_tenant', verified_tenant, true)` inside the request's transaction; the setting resets at commit. Authenticate tenant identity through verified credentials, and keep the setting behind trusted code because clients with arbitrary SQL can change it. The `FOR ALL` policy's omitted `WITH CHECK` defaults to its `USING` expression, covering inserted/updated rows as well as reads.

### 3. Enforce isolation on every shared path

Authorization is membership of the caller's tenant (and finer [ACLs](glossary://acl) inside the tenant). For a principal $P$ with bound tenant $T$, and resource $R$ tagged with tenant $T_R$:

$$
\mathrm{same\_tenant}(P, R) \iff T(P) = T_R
$$

$$
\mathrm{allow}(P, A, R) \implies \mathrm{same\_tenant}(P, R) \land \mathrm{acl}(P, A, R)
$$

Pair the tenant match with roles and document ACLs. Missing either check is a leak.

**Vector search.** A tenant namespace or collection can separate the search scope, but trusted code and access controls must prevent callers from selecting a foreign one. If tenants share an index, attach `tenant_id` (and ACL fields) at ingest and apply a [metadata filter](glossary://metadata-filter) built in trusted code on every query. Filtering only after global ANN can harm recall under low selectivity: top-$k$ global neighbors may exclude all of *your* tenant's rows even when matches exist deeper in the corpus. Correct post-filtering can still prevent unauthorized results from being returned, but foreign candidates must never enter prompts, caches, or unapproved logs.

**Caches.** Exact and [semantic caches](glossary://semantic-cache) must partition by tenant (and usually by permission fingerprint, model, and corpus version). A cosine similarity of $0.95$ shows semantic closeness; current authorization determines whether an answer may be reused.

**Agents and tools.** Mint short-lived credentials scoped to $T$ where supported. A shared service account that can read all tenants expands blast radius if a tool's authorization is bypassed or its credentials are exposed. [Prompt injection](glossary://prompt-injection) does not itself grant access; the tool executor must independently enforce tenant and principal permissions.

**Async paths.** Carry and re-check tenant context in workers, webhooks, batch embeds, deletion jobs, and "export for support," along with request-path middleware.

**Observability.** Logs and traces should be queryable per tenant for support, but search UIs and bulk exports must not become a cross-tenant data lake by default.

## Example

A multi-tenant support assistant serves `acme` and `globex` on one control plane.

**Ingest.** Each PDF is chunked, embedded, and stored with payload:

```json
{
  "id": "acme#policy#chunk-17",
  "tenant_id": "acme",
  "doc_id": "sec-policy-q3",
  "acl_principals": ["role:support_agent", "role:workspace_admin"]
}
```

Acme lives in vector namespace `ns_acme` (or a dedicated index for the enterprise tier). Globex is never in that namespace.

**Query.** User `u_alice` authenticates; middleware sets `tenant_id = acme` from JWT claims. Retrieval:

1. Open only `ns_acme` (or `filter: tenant_id = "acme"`).
2. Apply ACL filter so contractors without `read` never enter the candidate set.
3. Pack top chunks into the prompt; generate.
4. Semantic cache key: `(tenant_id, policy_ver, corpus_ver, model, permission_fingerprint, query_embedding_bucket)`. A Globex hit with the same wording cannot match.
5. Tool call `create_ticket` receives an API token scoped to Acme's CRM project, not a global admin key.
6. Trace `trace_id` is stored with `tenant_id=acme`; the support debug UI lists only Acme traces for Acme operators.

**Concrete leak if step 1 is skipped.** Alice asks "What is our log-retention window?" The shared index returns Globex's internal policy because its retention section has a higher similarity score. The model answers with Globex's numbers. Redacting the final sentence is too late: the prompt, provider logs, and any judge or analytics pipeline may already hold foreign text.

Minimal enforcement shape for pooled retrieval:

```python
def retrieve(query_vec, tenant_id: str, principal: dict, k: int = 8):
    if not tenant_id:
        raise PermissionError("missing tenant context")  # fail closed
    # Namespace isolates tenants; filter is defense in depth + ACL
    hits = vector_store.query(
        namespace=f"ns_{tenant_id}",
        vector=query_vec,
        top_k=k,
        filter={"tenant_id": {"$eq": tenant_id}},
    )
    return [h for h in hits if may_read(principal, h.payload)]
```

## What fails in production

Cross-tenant leakage rarely looks like a cinematic break-in. Common weak points:

| Path | Failure | Fix direction |
| --- | --- | --- |
| Shared index, no filter | ANN returns foreign chunks | Namespace or mandatory metadata filter from bound identity |
| Semantic cache keyed by text only | Tenant B reuses Tenant A's answer | Partition cache by tenant + auth scope |
| Client-supplied `tenant_id` | Impersonation via header or body | Bind from verified session/JWT only |
| IDOR on resource ids | `/docs/{id}` without tenant ownership check | Composite lookup `(tenant_id, id)` at the data layer |
| Broad service account | Worker or agent can scan all tenants | [Least privilege](glossary://least-privilege) credentials per tenant or per job |
| Debug / analytics export | Support UI or warehouse dump spans workspaces | Tenant-scoped queries; audited break-glass |
| Soft-delete / offboarding | Vectors or blobs left behind | Delete namespace/prefix and invalidate caches |
| Async without context | Queue job loses `tenant_id` and falls back to global | Require tenant on message schema; fail closed if absent |

Test isolation the way you test auth: fixtures for two tenants, automated attempts to read the other tenant through retrieval, cache, tools, exports, workers, and admin APIs. A leak can happen outside the final answer.

## Trade-offs

- **Silo** maximizes isolation and cost attribution, limits noisy neighbors, and shrinks blast radius; it raises ops cost and can hit account or index quotas at large tenant counts.
- **Pool** maximizes density and onboarding speed; one missing `WHERE tenant_id = …` or cache key is a multi-customer incident.
- **Namespace + metadata** is the usual sweet spot for RAG vector stores: strong query isolation and simple offboarding, without one full cluster per customer.
- **Hybrid tiers** let free/shared tenants pool while enterprise tenants use siloed indexes or dedicated encryption keys (BYOK). Isolation strength then becomes an explicit service tier, not a single global architecture.

## Why it matters here

Enterprise AI products sell retrieval and agent power on shared infrastructure. Isolation is the foundation for trust: without it, [ACLs](glossary://acl), [RBAC](glossary://rbac), and model refusals cannot repair data that already crossed a tenant wall. Curriculum on multi-tenant RAG, semantic caching, agent tools, and GPU multi-tenancy all assume a deliberate isolation model enforced in code and storage, not in prompt wording.

## Related terms

- [ACL](glossary://acl)
- [RBAC](glossary://rbac)
- [Semantic cache](glossary://semantic-cache)
- [Metadata filter](glossary://metadata-filter)
- [Least privilege](glossary://least-privilege)
