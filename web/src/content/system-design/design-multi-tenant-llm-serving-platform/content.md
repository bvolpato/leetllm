---
{
  "id": "design-multi-tenant-llm-serving-platform",
  "title": "Multi-Tenant LLM Platform",
  "slug": "design-multi-tenant-llm-serving-platform",
  "category": "System Design",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/multi_tenant_dark.png",
  "companies": [
    "Google",
    "OpenAI",
    "Anthropic",
    "AWS",
    "Azure"
  ],
  "shortDescription": "A long design review and a short incident summary share GPUs, but neither should wait unfairly or see the other's evidence. Design the identity, quota, scheduling, and cache controls.",
  "keyConceptsTested": [
    "Multi-tenant request routing",
    "GPU cluster management",
    "Continuous batching and in-flight batching",
    "Rate limiting and quota enforcement",
    "Model versioning and deployment",
    "Cost attribution per tenant",
    "KV cache paging and eviction",
    "Tiered and disaggregated KV storage",
    "LoRA adapter hot-swapping",
    "Token-based metering strategies",
    "Request prioritization scheduling",
    "Fairness-aware token budgeting",
    "GPU memory fragmentation",
    "Tenant-scoped prefix caching",
    "Speculative decoding in shared pools",
    "RAG metadata filtering for multi-tenant isolation"
  ],
  "prerequisites": [
    "design-code-completion-system",
    "llm-deployment-gpu-serving-autoscaling",
    "continuous-batching-request-scheduling",
    "kv-cache-paged-attention-llm-serving",
    "llm-cost-engineering-token-economics",
    "lora-parameter-efficient-fine-tuning"
  ],
  "relatedQuestions": [
    "design-llm-powered-search-engine",
    "design-production-rag-pipeline",
    "llm-cost-engineering-token-economics",
    "llm-deployment-gpu-serving-autoscaling"
  ],
  "section": "AI System Design & Interviewing",
  "order": 2
}
---

A shared LLM platform serves one hundred workspaces on one GPU cluster. Tenant A submits a 12,000-token design review; Tenant B asks for a 40-token incident summary. Both stall in the queue even though GPU utilization sits at 55%. Seconds later, B's answer quotes a paragraph from A's private postmortem.

Those two symptoms have completely different root causes. Stall time points to KV-cache exhaustion, chunked-prefill starvation, or quota lock contention; adding GPUs might relieve it. Foreign text in B's reply is an authorization or cache-isolation failure that extra GPUs will never fix.

In [Code Completion](/learn/design-code-completion-system), we optimized a single low-latency serving path. Here we design the shared platform underneath: sharing frozen base weights and GPU batch steps while keeping identity, quotas, memory pages, adapters, caches, and billing strictly isolated per tenant.

## Define what sharing may change

A 72B-parameter model in BF16 (2 bytes per parameter) occupies roughly 144 GB of VRAM just for weights. Running one hundred dedicated copies would burn 14.4 TB before a single token is generated. Sharing frozen model replicas across tenants saves orders of magnitude in hardware, yet sharing weights never implies sharing data or schedules.

Anchor the architecture on six clear guarantees before choosing a serving engine:

| Layer | Design rule |
|---|---|
| Identity | A caller can act only within workspaces it is authorized to access |
| Data state | Prompts, adapters, retrieved chunks, KV caches, and logs stay scoped to the reader |
| Quotas | Concurrent requests cannot double-spend remaining token allowances or GPU pages |
| Scheduling | Backlogged tenants receive their configured compute share without starving short jobs |
| Metering | Retries and duplicate completion messages never double-bill or refund twice |
| Recovery | Uncertain attempts stay held until worker execution stops and usage reconciles |

Separate the <span data-glossary="control-plane">control plane</span> (configuration, deployments, artifact permissions, worker membership) from the data plane (gateway routing and GPU inference). Enforce access checks at **both** the gateway and worker; protecting only the gateway fails if a client can hit worker admin endpoints directly.

<figure>
  <img src="illustrations/_generated/multi_tenant_dark.png" alt="Multi-tenant LLM serving platform architecture with isolated control and data planes. The gateway resolves caller identity and workspace authorization, enforces rate limits, and binds requests to specific tenant quotas. Workers execute requests across continuous batching engines with isolated KV cache pages, scoped LoRA adapter slots, and metered usage accounting." />
  <figcaption>Control plane and data plane separation. The gateway resolves identity and reserves quotas before continuous-batching workers execute requests across isolated KV pages and dynamic LoRA slots.</figcaption>
</figure>

Define <span data-glossary="slo">service-level objectives (SLOs)</span> with exact measurement endpoints:

- **<span data-glossary="ttft">Time to first token (TTFT)</span>:** measured from external gateway arrival to the first usable output token (covering queueing, prefill, and adapter loading), not from when the GPU engine dequeues the prompt.
- **<span data-glossary="itl">Inter-token latency (ITL)</span> vs. TPOT:** serving engines like vLLM can bundle multiple tokens into one streamed event, so raw event gaps differ from request-level **time per output token (TPOT)** $= (\text{completion} - \text{TTFT}) / (\text{output tokens} - 1)$.[^vllm2026metrics]

For example, if a stream emits token 1 at 100 ms, bundles four tokens into one frame at 220 ms, and finishes at 240 ms, the observed event gap is **120 ms** while request TPOT is $(240 - 100) / (5 - 1) = \mathbf{35\text{ ms}}$. Specify whether a tenant's SLO tracks per-event stream gaps or average TPOT, and track completion rate alongside latency so failed streams never make fast-failing traffic look healthy.

<figure>
  <img src="illustrations/_generated/bundled_stream_timing_dark.png" alt="Stream latency timeline comparing observed output event gaps with completion-based time per output token (TPOT). A request arrives at 0 ms, yields its first token at 100 ms, receives a four-token chunk at 220 ms, and completes at 240 ms. The event gap of 120 ms reflects network delivery, whereas true TPOT averages 35 ms per token." />
  <figcaption>Stream bundling separates observed event gaps (120 ms) from completion-based TPOT (35 ms). Define both metrics clearly in tenant SLOs.</figcaption>
</figure>

## Establish identity before touching tenant state

Treat an HTTP `Tenant-ID: A` header as an untrusted workspace selector, never as proof of access. Authenticate the caller, verify current workspace grants server-side, and reject unauthorized selections before any cache lookup, adapter fetch, or retrieval call.[^owasp2026Authorization]

Propagate the resolved tenant, principal, request ID, attempt ID, approved model/adapter revisions, deadline, and output cap inside a signed internal envelope over authenticated service links. Never let a downstream worker overwrite tenant identity from a request body field.

<!-- leetllm: test, id=tenant-context, output=show -->
```python title="trusted-tenant-context.py"
from dataclasses import dataclass


@dataclass(frozen=True)
class Context:
    principal: str
    tenant: str


GRANTS = {"alice": {"A"}, "bob": {"B"}}


def resolve_context(authenticated_principal, requested_tenant):
    if requested_tenant not in GRANTS.get(authenticated_principal, set()):
        raise PermissionError("workspace access denied")
    return Context(authenticated_principal, requested_tenant)


ctx = resolve_context("alice", "A")
assert ctx.tenant == "A"
for principal, tenant in (("alice", "B"), ("unknown", "A")):
    try:
        resolve_context(principal, tenant)
    except PermissionError:
        print(f"denied: {principal} acting for {tenant}")
    else:
        raise AssertionError("unauthorized context created")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
denied: alice acting for B
denied: unknown acting for A
```
<!-- leetllm: output:end -->

Workspace membership is only the outer layer: inside Workspace A, Alice may be allowed to read engineering docs while another user cannot. Pass principal-level permissions into retrieval, tool execution, caches, and logs, and never rely on the LLM prompt to enforce document access.

## Reserve quota and memory before dispatching requests

No single rate limit protects every resource:

| Control | Resource it limits | What it leaves unchecked |
|---|---|---|
| RPM | Request arrival rate | Prompt length, concurrency, and decode work |
| TPM | Tokens over a rolling window | Uneven GPU cost between prefill and decode |
| Period quota | Total spend in a billing period | Fair scheduling among active requests |
| Concurrency cap | Simultaneous in-flight streams per tenant | Per-request KV memory size |
| Context / output cap | Maximum sequence length | Aggregate cluster capacity |
| KV-page budget | Reserved attention memory | Compute throughput and tail latency |

Tokenize the fully assembled prompt (including system instructions and retrieved passages) with the target model's tokenizer, then reserve `input_tokens + max_output` before dispatch. For a fixed-period quota, conservation holds at every instant:

$$
\text{limit} = \text{available} + \text{held reservations} + \text{settled usage}.
$$

Start with 1,000 units and reserve 300 input plus 400 max output (holding 700, leaving 300 available). If generation finishes at 120 output tokens, actual usage is 420; settling releases the unused 280 and leaves **580 available**. Delivering that same completion message twice must still leave 580.

### Make reservation and settlement idempotent

Scope every idempotency key to `(tenant, request_id)` and bind it to a canonical fingerprint of the resolved execution parameters (prompt, model revision, adapter revision, output cap). Replaying the exact request returns the existing hold; reusing the key with different parameters raises a conflict.

Here is an atomic single-process `QuotaStore` implementing hold, idempotent replay, conflict detection, and exact settlement:

<!-- leetllm: test, id=quota-store, output=show -->
```python title="quota-reservations.py"
from dataclasses import dataclass
from threading import Lock


@dataclass(frozen=True)
class Spec:
    fingerprint: str
    input_tokens: int
    max_output: int
    kv_pages: int


@dataclass
class Entry:
    spec: Spec
    output: int | None = None  # None while held or uncertain


class QuotaStore:
    def __init__(self, tenants, token_limit=1000, concurrency=2, page_limit=20):
        if min(token_limit, concurrency, page_limit) <= 0:
            raise ValueError("limits must be positive integers")
        self.limits = (token_limit, concurrency, page_limit)
        self.used = {tenant: 0 for tenant in tenants}
        self.entries = {}
        self.lock = Lock()

    def _held(self, tenant):
        return [e for (owner, _), e in self.entries.items()
                if owner == tenant and e.output is None]

    def available(self, tenant):
        with self.lock:
            held_tokens = sum(e.spec.input_tokens + e.spec.max_output for e in self._held(tenant))
            return self.limits[0] - self.used[tenant] - held_tokens

    def reserve(self, tenant, request_id, spec):
        if tenant not in self.used:
            raise PermissionError("unknown tenant")
        if not request_id or not spec.fingerprint:
            raise ValueError("identity and fingerprint are required")
        if spec.input_tokens < 0 or spec.max_output < 0 or spec.kv_pages <= 0:
            raise ValueError("invalid reservation units")
        key = (tenant, request_id)
        with self.lock:
            if key in self.entries:
                if self.entries[key].spec != spec:
                    raise ValueError("idempotency conflict")
                return key
            held = self._held(tenant)
            held_tokens = sum(e.spec.input_tokens + e.spec.max_output for e in held)
            held_pages = sum(e.spec.kv_pages for e in held)
            limit, concurrency, page_limit = self.limits
            if (self.used[tenant] + held_tokens + spec.input_tokens + spec.max_output > limit
                    or len(held) >= concurrency
                    or held_pages + spec.kv_pages > page_limit):
                raise ValueError("quota or capacity limit exceeded")
            self.entries[key] = Entry(spec)
            return key

    def settle(self, tenant, request_id, output_tokens):
        with self.lock:
            entry = self.entries[(tenant, request_id)]
            if not 0 <= output_tokens <= entry.spec.max_output:
                raise ValueError("invalid usage")
            if entry.output is not None:
                if entry.output != output_tokens:
                    raise ValueError("conflicting settlement")
                return
            self.used[tenant] += entry.spec.input_tokens + output_tokens
            entry.output = output_tokens


store = QuotaStore(["A", "B"])
spec = Spec("resolved-request-v1", 300, 400, 5)
assert store.reserve("A", "r1", spec) == ("A", "r1")
assert store.reserve("A", "r1", spec) == ("A", "r1")
print("after reservation:", store.available("A"))
store.settle("A", "r1", 120)
store.settle("A", "r1", 120)
assert store.available("A") == 580 and store.available("B") == 1000
print("after repeated settlement:", store.available("A"))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
after reservation: 300
after repeated settlement: 580
```
<!-- leetllm: output:end -->

Now race two concurrent threads for the same 700-unit reservation against a 1,000-unit quota, and trace a client disconnect before settlement arrives:

<!-- leetllm: test, continue=quota-store, output=show -->
```python title="quota-failure-cases.py"
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier


def must_reject(call):
    try:
        call()
    except (ValueError, PermissionError):
        return
    raise AssertionError("invalid operation succeeded")


before = store.available("A")
must_reject(lambda: store.reserve("A", "r1", Spec("different-request", 300, 400, 5)))
must_reject(lambda: store.settle("A", "r1", 121))
must_reject(lambda: store.reserve("A", "bad", Spec("bad", -1, 10, 1)))
must_reject(lambda: store.reserve("unknown", "r1", spec))
assert store.available("A") == before

race = QuotaStore(["A"])
barrier = Barrier(2)


def contender(request_id):
    barrier.wait()
    try:
        race.reserve("A", request_id, spec)
        return True
    except ValueError:
        return False


with ThreadPoolExecutor(max_workers=2) as pool:
    accepted = list(pool.map(contender, ["one", "two"]))
assert sum(accepted) == 1 and race.available("A") == 300

uncertain = QuotaStore(["A"])
uncertain.reserve("A", "lost-response", spec)
must_reject(lambda: uncertain.reserve("A", "new-attempt", spec))
assert uncertain.reserve("A", "lost-response", spec) == ("A", "lost-response")
assert uncertain.available("A") == 300
uncertain.settle("A", "lost-response", 120)
assert uncertain.available("A") == 580

print("concurrent reservations accepted:", sum(accepted))
print("conflicts and invalid input leave the quota store unchanged")
print("unconfirmed disconnect: held 700; terminal settlement: available", uncertain.available("A"))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
concurrent reservations accepted: 1
conflicts and invalid input leave the quota store unchanged
unconfirmed disconnect: held 700; terminal settlement: available 580
```
<!-- leetllm: output:end -->

Across multiple gateway replicas, replace the in-process lock with a serializable database transaction or atomic conditional update, retrying serialization conflicts with the **same** idempotency key.[^postgresqlIsolation2026] Dispatch to a GPU worker only after the reservation commits, and never release a hold merely because a response timed out while the worker might still be generating.

<figure>
  <img src="illustrations/_generated/quota_lifecycle_dark.png" alt="Four-stage tenant quota reservation and settlement lifecycle on a 1000-unit scale. Initially 1000 units are available. Reserving 300 input tokens plus 400 max output places a 700-unit hold, leaving 300 available. Settling 120 generated tokens charges 420 and releases 280 back to 580 available. Duplicate settlement produces zero extra charge." />
  <figcaption>Worst-case output tokens stay held during generation. Settling 120 actual output tokens returns 280 unused units once; duplicate reports are no-ops.</figcaption>
</figure>

```checkpoint
A gateway loses the response after dispatch. Can it refund the whole reservation and retry with a new request ID?
---
No. The worker may still be executing. Keep the request in an uncertain state, recover its status from the worker, and reuse the original idempotency key. Refunding and starting a fresh ID risks double execution and quota overrun.
```

<figure>
  <img src="illustrations/_generated/idempotent_admission_race_dark.png" alt="Idempotent race and conflict resolution between two concurrent requests. Two contenders simultaneously request 700 units against a 1000-unit quota. Contender 1 acquires a 700-unit hold, leaving 300 available; Contender 2 is rejected. Replaying the identical request returns the existing hold, while changing the prompt fingerprint triggers an idempotency conflict." />
  <figcaption>Atomic locking guarantees only one 700-unit contender succeeds against a 1,000-unit limit. Identical replays return the existing hold; modified payloads fail with a conflict.</figcaption>
</figure>

## Budget memory before promising concurrency

The [KV cache](/learn/kv-cache-paged-attention-llm-serving) dominates per-request VRAM. For an 80-layer GQA model with 8 KV heads, head dimension 128, and 2-byte FP16/BF16 elements, every cached token costs:

$$
2 \times 80 \times 8 \times 128 \times 2 = 327{,}680\text{ bytes} = 0.3125\text{ MiB}.
$$

At 4,000 tokens, a single sequence consumes **1.2207 GiB** of KV memory before activations or engine metadata. (Always use KV-head count, not query-head count, for grouped-query attention.)

PagedAttention splits KV memory into fixed-size physical blocks (say 16 tokens, or **5 MiB per block**) mapped through per-sequence block tables.[^kwon2023pagedattention] Sequence A (47 tokens) occupies 3 pages and Sequence B (31 tokens) occupies 2 pages, wasting only 2 of 80 allocated token slots. Keep ceiling division in exact integers so large inputs never suffer floating-point rounding drift:

<!-- leetllm: test, output=show -->
```python title="paged-kv-reservations.py"
BYTES_PER_TOKEN = 2 * 80 * 8 * 128 * 2
BLOCK_TOKENS = 16


def reserve_pages(input_tokens, max_output):
    if input_tokens < 0 or max_output < 0:
        raise ValueError("token counts must be nonnegative integers")
    return (input_tokens + max_output + BLOCK_TOKENS - 1) // BLOCK_TOKENS


for tenant, tokens in (("A", 47), ("B", 31)):
    pages = reserve_pages(tokens, 0)
    print(f"{tenant}: {pages} pages, {pages * BLOCK_TOKENS - tokens} unused token slots")
print("MiB per page:", BYTES_PER_TOKEN * BLOCK_TOKENS / 2**20)
print("GiB for 4000 cached tokens:", round(BYTES_PER_TOKEN * 4000 / 2**30, 4))
assert reserve_pages(16, 1) == 2
assert reserve_pages(0, 0) == 0
assert reserve_pages(2**54 + 1, 0) == 2**50 + 1
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A: 3 pages, 1 unused token slots
B: 2 pages, 1 unused token slots
MiB per page: 5.0
GiB for 4000 cached tokens: 1.2207
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/kv_cache_paging_dark.png" alt="PagedAttention memory management with non-contiguous physical block allocation. Tenant A with 47 tokens maps to physical blocks P0, P2, and P4. Tenant B with 31 tokens maps to blocks P1 and P3. Adding one token beyond a 16-token block requires allocating an entire second physical page." />
  <figcaption>PagedAttention eliminates external fragmentation across tenants, confining internal waste to at most 15 tokens in the final block.</figcaption>
</figure>

Reserving `input_tokens + max_output` up front prevents mid-stream OOMs at the cost of lower peak concurrency. Allocating pages incrementally packs more requests onto each GPU, provided you define explicit preemption (swap to CPU RAM or recompute on resume) when memory fills. For shared prefix blocks, track physical reference counts separately from logical tenant billing so one physical block is never freed while another tenant still reads it.

## Schedule active tenant turns fairly

[Continuous batching](/learn/continuous-batching-request-scheduling) inserts new requests and retires finished ones at every decode iteration.[^yu2022] Still, a single 12,000-token prefill from Tenant A can freeze Tenant B's short decode tokens for hundreds of milliseconds.

**Chunked prefill** slices long prompts into small token chunks interleaved with active decode steps. In vLLM, `max_num_batched_tokens` caps total tokens processed per step, letting you trade raw prefill throughput against smooth streaming latency.[^vllm2026optimization]

To keep heavy tenants from crowding out light ones across steps, schedule per-tenant queues with **deficit round-robin (DRR)**. Give Tenant A a 4-unit quantum (chunk cost 3) and Tenant B a 2-unit quantum (chunk cost 1); unused credit carries forward only while a tenant remains backlogged:

<!-- leetllm: test, output=show -->
```python title="deficit-scheduling.py"
from collections import deque

queues = {"A": deque([3] * 10), "B": deque([1] * 20)}
quantum = {"A": 4, "B": 2}
credit = {tenant: 0 for tenant in queues}
served = {tenant: 0 for tenant in queues}
jobs = {tenant: 0 for tenant in queues}

for _ in range(3):
    for tenant, queue in queues.items():
        if not queue:
            credit[tenant] = 0
            continue
        credit[tenant] += quantum[tenant]
        while queue and queue[0] <= credit[tenant]:
            cost = queue.popleft()
            credit[tenant] -= cost
            served[tenant] += cost
            jobs[tenant] += 1
        if not queue:
            credit[tenant] = 0

assert served == {"A": 12, "B": 6} and jobs == {"A": 4, "B": 6}
print("served work units:", served)
print("completed chunks:", jobs)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
served work units: {'A': 12, 'B': 6}
completed chunks: {'A': 4, 'B': 6}
```
<!-- leetllm: output:end -->

> **Key insight:** A 2:1 compute share (12 units vs. 6 units) is **not** a 2:1 chunk or request count (4 chunks vs. 6 chunks). Because prefill tokens, decode tokens, long contexts, and [speculative decoding](/learn/speculative-decoding) proposals all consume different amounts of GPU time, calibrate scheduler work units against measured step latency and cap chunk sizes so tail latency stays predictable.

```checkpoint
Why can two requests with equal token counts deserve different scheduler charges?
---
Their prefill-to-decode split, context length, prefix cache hit rate, and co-batched neighbors change actual GPU execution time. Equal token counts do not mean equal compute cost or equal delay imposed on other tenants.
```

<figure>
  <img src="illustrations/_generated/deficit_service_rounds_dark.png" alt="Deficit round-robin scheduling across three rounds. Tenant A receives 4 credits per round with chunk cost 3; Tenant B receives 2 credits with chunk cost 1. Over three rounds, Tenant A serves 12 work units across 4 chunks while Tenant B serves 6 work units across 6 chunks, maintaining a 2:1 work ratio." />
  <figcaption>Deficit round-robin holds the 2:1 work-unit share (12 vs. 6) across three rounds even though Tenant B completes more individual chunks (6 vs. 4).</figcaption>
</figure>

When memory pressure forces preemption, wait for asynchronous GPU kernels to finish and block references to retire before handing freed pages to another tenant, and add age-based protection so the same low-priority request is not repeatedly evicted.

## Keep adapter residency separate from permission

[Low-Rank Adaptation (LoRA)](/learn/lora-parameter-efficient-fine-tuning) lets one frozen base model serve dozens of fine-tuned tenant behaviors in the same batch by adding small low-rank weight deltas.[^hu2021]

Resolve mutable aliases like `docs-current` to an immutable `(base_revision, adapter_revision)` pair at request entry, verify tenant permission **before** checking whether the adapter is already hot in VRAM, and pin that revision for the request's entire lifetime (including retries and prefix caches). vLLM supports per-request LoRA selection while warning that dynamic runtime loading belongs only inside a trusted, isolated worker perimeter.[^vllm2026lora] Validate artifact ownership, rank, size, and digest inside a trusted adapter service rather than letting tenants supply arbitrary paths.

Track active batch references on every cached adapter slot: an LRU eviction pass must skip any adapter whose reference count is nonzero, either evicting an idle slot, waiting, or routing the incoming request to another replica.

<figure>
  <img src="illustrations/_generated/adapter_reference_lifetime_dark.png" alt="Dynamic LoRA adapter lifecycle with reference counting. Tenant permission and base compatibility are validated before cache lookup. An in-flight request pins adapter A (refcount 1), blocking eviction until execution completes and refcount drops to 0." />
  <figcaption>Reference counting prevents hot-swap thrashing: an active batch pins adapter A in VRAM until its refcount hits zero.</figcaption>
</figure>

## Scope retrieval and caching to the actual reader

Apply tenant and principal access predicates **inside** the trusted retrieval service before top-$K$ truncation, so forbidden passages never leave the database or leak via foreign scores. In PostgreSQL, enabling row-level security without a rule blocks ordinary queries, yet superusers, `BYPASSRLS` roles, and table owners bypass it unless `FORCE ROW LEVEL SECURITY` is set.[^postgresql_rls_docs] Always test queries under the exact production service role.

Similarly, partition prefix caches by the complete compatibility tuple: `(tenant, principal, acl_revision, base_revision, adapter_revision, tokenizer_revision, kv_layout, token_ids)`. vLLM's prefix caching hashes token blocks with LoRA identity and supports a first-block `cache_salt` to isolate sharing groups.[^vllm2026prefix] Combine that salt with server-side authentication so callers can never supply another tenant's salt:

<!-- leetllm: test, continue=tenant-context, output=show -->
```python title="authorized-evidence-and-cache.py"
documents = [
    {"id": "A-public", "tenant": "A", "readers": {"alice"}, "score": 0.80},
    {"id": "A-private", "tenant": "A", "readers": {"carol"}, "score": 0.95},
    {"id": "B-secret", "tenant": "B", "readers": {"bob"}, "score": 0.99},
]


def search(context, top_k):
    if top_k <= 0:
        raise ValueError("top_k must be positive")
    allowed = [d for d in documents if d["tenant"] == context.tenant
               and context.principal in d["readers"]]
    return [d["id"] for d in sorted(allowed, key=lambda d: d["score"], reverse=True)[:top_k]]


def namespace(context, acl_revision, adapter_revision, token_ids):
    return (context.tenant, context.principal, acl_revision, "base-v3",
            adapter_revision, "tokenizer-v3", "kv-layout-v1", tuple(token_ids))


assert search(ctx, 1) == ["A-public"]
old = namespace(ctx, "acl-v1", "docs-v2", [1, 5, 9])
cache = {old: "private-cache-handle"}
assert namespace(ctx, "acl-v2", "docs-v2", [1, 5, 9]) not in cache
assert namespace(ctx, "acl-v1", "docs-v3", [1, 5, 9]) not in cache
bob = resolve_context("bob", "B")
assert namespace(bob, "acl-v1", "docs-v2", [1, 5, 9]) not in cache
print("Alice's result:", search(ctx, 1))
print("ACL revision, adapter revision, and cross-tenant misses verified")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Alice's result: ['A-public']
ACL revision, adapter revision, and cross-tenant misses verified
```
<!-- leetllm: output:end -->

Bumping `acl_revision` or `adapter_revision` immediately misses stale KV entries without touching other tenants. When permissions are revoked, advance the ACL revision and invalidate affected cache entries.

<figure>
  <img src="illustrations/_generated/authorized_evidence_and_cache_dark.png" alt="Multi-tenant retrieval filtering and KV-cache namespace scoping. Search queries filter by tenant and principal before ranking. Cache namespaces combine tenant, principal, ACL revision, model, adapter, and token IDs to prevent cross-tenant reuse." />
  <figcaption>Filtering retrieval before ranking blocks unauthorized passages, while full composite cache keys prevent cross-tenant or stale-ACL prefix hits.</figcaption>
</figure>

## Match isolation perimeters to your threat model

Cache salts and scheduler weights are logical isolation controls, not hardware security perimeters. Pick the physical isolation tier that matches your tenants' threat model:

| Isolation tier | What it separates | What stays shared |
|---|---|---|
| Shared worker process | Logical request queues, adapters, and KV block tables | Process memory, GPU kernels, and serving-engine bugs |
| Separate containers / processes | OS address spaces and cgroup limits | Host kernel, GPU driver, and shared VRAM engines |
| NVIDIA MIG GPU instances | Hardware-sliced GPU memory and SMs | Host OS, driver, and remaining PCIe/NVLink infrastructure |
| Dedicated VMs or node pools | Hypervisor / physical hardware per tenant | Control plane, network fabric, and operator access |

Note a subtle hardware detail: NVIDIA **compute instances** inside a single MIG GPU instance still share that GPU instance's memory and engines, whereas separate **GPU instances** partition memory controllers.[^nvidiaMigConcepts2026] Also keep encryption and PII redaction distinct from access control: redacting emails does not stop Workspace B from retrieving Workspace A's postmortem.

<figure>
  <img src="illustrations/_generated/runtime_security_boundaries_dark.png" alt="Multi-tenant runtime security boundaries across four isolation tiers: in-process multiplexing, container separation, hardware GPU slicing via MIG, and dedicated node or VM clusters." />
  <figcaption>Moving from shared processes to MIG slices or dedicated nodes trades packing density for a smaller tenant blast radius.</figcaption>
</figure>

## Separate usage, allocated cost, and the customer bill

Record one immutable usage event per execution attempt carrying tenant, request ID, attempt ID, model/adapter revision, input/cached/output token counts, and terminal status. Distinguish generated tokens, delivered tokens (before a client disconnect), and billable tokens explicitly.

Wall-clock latency never equals exclusive GPU time when requests share a batch across a multi-GPU replica. Measure compute at the **step** level, then allocate that step cost across co-batched requests without losing conservation. Watch unit consistency: a 4-GPU node running a 0.2 s step burns **0.8 GPU-seconds** (at \$2/GPU-hour) or **0.2 node-seconds** (at \$8/node-hour), both equal to \$0.000444. Multiplying GPU-seconds by the node-hour price silently quadruples the cost:

| Quantity | Formula | Value |
|---|---|---|
| Step cost (GPU-second basis) | `(0.2 s * 4 GPUs * $2/GPU-hr) / 3600` | **\$0.000444444** |
| Step cost (node-second basis) | `(0.2 s * $8/node-hr) / 3600` | **\$0.000444444** |
| Conserved allocation (25% A / 75% B) | `$0.000111111 + $0.000333333` | **\$0.000444444** |
| Unit-mismatch bug (GPU-s x node-hr) | `(0.2 * 4 * $8) / 3600` | **\$0.001777778** (4x overcharge) |

Track idle replicas, queue wait, storage, and failed retries separately from active GPU steps, and compare allocated internal cost against customer token tariffs to spot unprofitable workload mixes early.

```checkpoint
Worker attempt A/r1/1 settles 420 units. Two deliveries have different message IDs but describe that same settlement. Can the second message charge another 420?
---
No. Deduplicate on the stable `(tenant, reservation, attempt)` identity rather than transport message IDs. The second delivery leaves balances unchanged, and any conflicting usage value raises an error.
```

<figure>
  <img src="illustrations/_generated/step_cost_conservation_dark.png" alt="Continuous batch step cost conservation across a 4-GPU node over a 0.2-second forward step. Total compute equals 0.8 GPU-seconds or 0.2 node-seconds, partitioned 25% to Tenant A and 75% to Tenant B, summing to 100%." />
  <figcaption>Step compute is conserved across co-batched tenants (25% A, 75% B). Keep GPU-seconds paired with GPU-hour rates and node-seconds paired with node-hour rates.</figcaption>
</figure>

## Recover without losing ownership

Model every request through explicit durable states: `RESERVED`, `QUEUED`, `RUNNING`, `CANCEL_REQUESTED`, `USAGE_UNCERTAIN`, and `TERMINAL`. Cancellation finishes only after the worker halts generation and frees all KV/adapter references.

- **Before the first token streams:** a retry is transparent if ownership checks prevent two workers from running the same attempt simultaneously.
- **After tokens have streamed:** restarting blindly appends duplicate or contradictory text. Either implement a resumable sequence-numbered stream or close with a clear partial-output error.
- **Poison requests:** quarantine after limited retries using scoped IDs and diagnostic metadata rather than copying raw tenant prompts into shared dead-letter queues.
- **Model upgrades:** pin immutable revisions, isolate incompatible KV namespaces, drain in-flight references before unloading old weights, and verify that any shadow traffic is authorized and accounted for in compute budgets.

<figure>
  <img src="illustrations/_generated/uncertain_attempt_recovery_dark.png" alt="Failure recovery and quota reconciliation for uncertain execution attempts. A 700-token hold is reserved before generation. On a timeout at token 420, the engine stops execution, settles 420 tokens, and refunds 280 tokens without allowing duplicate retries." />
  <figcaption>On a mid-stream timeout, reconcile actual worker progress (420 tokens) and release the remaining 280-token hold only after execution halts.</figcaption>
</figure>

## Diagnose the opening incident with evidence

Return to the opening outage: stalled queues at 55% GPU utilization plus Tenant A's postmortem leaking into Tenant B's summary.

1. **Contain the leak first.** Pause the suspect retrieval or cache path, preserve scoped diagnostic traces, and inspect gateway identity propagation, database access predicates, and prefix-cache salts. Never treat an isolation breach as a performance ticket.
2. **Isolate the bottleneck second.** Inspect queue age, active sequence count, KV-block occupancy, preemption rate, adapter swap misses, and per-tenant TTFT/ITL. A 55% GPU compute reading commonly hides 100% KV-cache saturation from long prompts (like A's design review) or head-of-line blocking from unchunked prefills. Add replicas only once telemetry confirms capacity, rather than scheduling or memory fragmentation, is the constraint.

### Follow-up questions

#### How would you recover a reservation whose worker disappeared after producing some tokens?

Keep the reservation in `USAGE_UNCERTAIN` rather than refunding immediately. Reconcile durable dispatch records against worker heartbeats and event logs, confirm the old execution can no longer emit tokens or hold pages, settle confirmed partial usage under the declared billing rule, and guard any replacement attempt with ownership checks.

#### What would justify sharing cached prefixes across two principals in one tenant?

Both principals must hold identical permissions over every document embedded in the prefix, plus identical model, adapter, and tokenizer revisions. Map them to a server-resolved shared trust group, authorize cache reads on every hit, and bump the group's ACL revision immediately on any permission revocation.

### What strong answers show

- Identity is resolved server-side before retrieval, adapter lookup, quota reservation, cache access, or billing, and workers cannot be bypassed around the gateway.
- Quota and KV-page reservations are atomic, idempotent, and hold uncertain attempts until execution terminates.
- KV sizing uses exact GQA head counts and integer block math, while deficit scheduling charges work units rather than raw request counts.
- Logical isolation (salts, quotas, queues) is clearly distinguished from OS, MIG, VM, and physical-node security perimeters.
- Usage events, step-cost allocation, and customer tariffs conserve units cleanly and handle duplicate deliveries safely.

## Check your understanding

```mastery-quiz
[
  {
    "question": "An authenticated analyst belongs to Cedar but selects Birch and names a Birch adapter already hot on the worker. Which gateway/worker binding is appropriate?",
    "options": [
      "Resolve Cedar at the gateway; let the worker retain the requested Birch adapter",
      "Reject the selection at the gateway; send no Birch execution to the worker",
      "Resolve Birch at the gateway; let the worker restrict retrieval to Cedar documents",
      "Accept the request at the gateway; let the worker resolve grants after adapter lookup"
    ],
    "answer": "Reject the selection at the gateway; send no Birch execution to the worker",
    "explanation": "Authentication identifies the analyst. Authorization must approve the selected workspace before any state lookup. Residency and billing identity do not grant access."
  },
  {
    "question": "A tenant has 1,900 quota units available. Each input or generated output token costs one unit. A request reserves 260 input tokens and up to 640 output tokens. After the worker finishes and retires its references, two messages report the same completion with 240 output tokens. How much allowance remains?",
    "options": [
      "1,000 units",
      "1,660 units",
      "1,400 units",
      "1,800 units"
    ],
    "answer": "1,400 units",
    "explanation": "The 900-unit hold leaves 1,000 available. The worker used 260 input tokens and generated 240 output tokens, so the charge is 500. Returning the unused 400 once brings the balance to 1,400. Both messages describe one execution. Returning 400 twice would give 1,800. The 1,000-unit balance charges the full output cap. The 1,660-unit balance omits the input charge."
  },
  {
    "question": "Birch reuses a tenant-scoped idempotency key but changes the resolved immutable adapter revision in its request fingerprint. What is the safe outcome?",
    "options": [
      "Keep the reservation; replace its adapter and require the worker to reload",
      "Keep the reservation; compare the text prompt before accepting the new revision",
      "Create a second attempt; preserve the original held amount for both revisions",
      "Return a fingerprint conflict; preserve the original reservation and revision"
    ],
    "answer": "Return a fingerprint conflict; preserve the original reservation and revision",
    "explanation": "The key binds to one resolved request. A different immutable execution fingerprint is not a replay, and cannot replace the prior reservation or silently dispatch new work."
  },
  {
    "question": "A full-cap rule accepts 29 input tokens and allows 20 output tokens. Pages hold 16 tokens. How much page capacity must it reserve?",
    "options": [
      "Four pages, providing 64 positions for the declared full cap",
      "Three pages, providing 48 positions for the declared full cap",
      "Two pages, providing 32 positions for the declared full cap",
      "Five pages, providing 80 positions for the declared full cap"
    ],
    "answer": "Four pages, providing 64 positions for the declared full cap",
    "explanation": "The cap covers 29+20=49 positions. Integer ceiling division by 16 gives 4 pages and 64 positions. Incremental prompt-only allocation would require a separately declared growth-failure rule."
  },
  {
    "question": "Cedar is charged 18 synthetic work units in six chunks and Birch 9 units in nine chunks. Which pair describes Cedar:Birch work and chunk ratios?",
    "options": [
      "Work 2:1; chunks 2:1",
      "Work 2:3; chunks 2:1",
      "Work 2:3; chunks 2:3",
      "Work 2:1; chunks 2:3"
    ],
    "answer": "Work 2:1; chunks 2:3",
    "explanation": "18:9 is 2:1 work, while 6:9 is 2:3 chunks. Synthetic units differ from raw chunk counts, and aggregate totals alone do not cap tail wait time."
  },
  {
    "question": "A request pins adapter revision r8. Its alias advances to r9 while every cache slot remains referenced. What can the platform do safely?",
    "options": [
      "Retain r8 for the active batch; wait or reroute the new load",
      "Retain r8 KV for the active batch; load r9 into its adapter slot",
      "Move the active batch to r9; keep its current generated prefix",
      "Remove the r8 slot from LRU; let the next load reuse its memory"
    ],
    "answer": "Retain r8 for the active batch; wait or reroute the new load",
    "explanation": "An active request retains its immutable approved artifact and compatible state. Alias changes affect new resolution; cache eviction waits for safe reference retirement or uses another eligible placement."
  },
  {
    "question": "Two readers share Cedar but have different private-document grants. A caller sends the other reader's cache salt. Which control is still required?",
    "options": [
      "A tenant-plus-salt match, followed by cache lookup before document authorization",
      "A tenant-plus-model match, followed by reuse of the cached document permissions",
      "A trusted reader-group grant, followed by compatible-state and current access checks",
      "A principal-plus-salt match, followed by reuse of the cached ACL revision"
    ],
    "answer": "A trusted reader-group grant, followed by compatible-state and current access checks",
    "explanation": "A salt partitions cache reuse. It neither authenticates its caller nor grants the prefix's document permissions. Broader reuse requires a deliberately authorized compatible group and revocation handling."
  },
  {
    "question": "Two GPUs share a 0.3-second step. The complete two-GPU node costs 6 dollars per hour. What is the compute cost of this step before allocating it between requests?",
    "options": [
      "0.001000 dollars",
      "0.000500 dollars",
      "0.000250 dollars",
      "0.001800 dollars"
    ],
    "answer": "0.000500 dollars",
    "explanation": "Use 0.3 node-seconds×6 dollars per node-hour÷3600=0.0005 dollars. Equivalent GPU accounting uses 0.6 GPU-seconds at 3 dollars per GPU-hour. Allocation between requests is a separate step."
  },
  {
    "question": "During a handoff, an old worker stops submitting GPU work and reports actual token usage while a queued copy is still referencing the request's KV pages. Closing an attempt in this quota store settles its quota and returns its pages to the allocator. What should the recovery owner do?",
    "options": [
      "Record the usage event, keep the quota reserved, and keep the pages assigned",
      "Settle the usage, return the unused quota, and keep the pages assigned",
      "Record the usage event, keep the quota reserved, and release the pages",
      "Settle the usage, return the unused quota, and release the pages"
    ],
    "answer": "Record the usage event, keep the quota reserved, and keep the pages assigned",
    "explanation": "The usage record shows how many tokens to charge. The queued copy still holds an active page reference, so the recovery owner records the event and leaves the entry open. Releasing pages while references remain active risks memory corruption. Once execution halts and references retire, the owner settles quota and releases both holds."
  },
  {
    "question": "A stream emits its first token at 80 ms, three more together at 200 ms, and completes at 230 ms. What can be computed from those observations?",
    "options": [
      "Observed event gap 50 ms; completion-based TPOT 120 ms",
      "Observed event gap 40 ms; completion-based TPOT 50 ms",
      "Observed event gap 120 ms; completion-based TPOT 40 ms",
      "Observed event gap 120 ms; completion-based TPOT 50 ms"
    ],
    "answer": "Observed event gap 120 ms; completion-based TPOT 50 ms",
    "explanation": "The two observed events are 200−80=120 ms apart. TPOT=(230−80)/(4−1)=50 ms. Bundling and terminal overhead prevent reconstructing the three individual decoding gaps."
  }
]
```

> **Next:** Continue to [LLM-Powered Search Engine](/learn/design-llm-powered-search-engine).
