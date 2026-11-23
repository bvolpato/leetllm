---
{
  "id": "design-multi-tenant-llm-serving-platform",
  "title": "Multi-Tenant LLM Platform",
  "slug": "design-multi-tenant-llm-serving-platform",
  "category": "System Design",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/multi_tenant_dark.png",
  "companies": ["Google", "OpenAI", "Anthropic", "AWS", "Azure"],
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
    "prefix-caching-prompt-caching",
    "model-gateways-routing-fallbacks",
    "lora-parameter-efficient-fine-tuning",
    "advanced-mlops-devops-ai"
  ],
  "relatedQuestions": [
    "design-llm-powered-search-engine",
    "enterprise-rag-security-rbac-access-control",
    "design-production-rag-pipeline",
    "semantic-caching-cost-latency-optimization",
    "model-versioning-continuous-deployment",
    "observability-monitoring-llm-systems"
  ],
  "section": "System Design Capstones",
  "order": 3
}
---

A shared large language model (LLM) platform serves one hundred workspaces. Tenant A submits a long design review; Tenant B needs a short incident summary. Both wait, although the accelerator dashboard looks only moderately busy. Then B receives a passage from A's private postmortem.

These symptoms require different responses. Queueing might come from compute, memory, admission policy, or scheduling. Foreign evidence is an authorization failure. Adding capacity might address the first problem; it won't repair the second.

You already followed [code completion](/learn/design-code-completion-system) through one serving path. The shared platform behind it has to keep A's long review and B's short summary side by side. They can share frozen weights and execution steps. Their evidence, request state, resource budgets, and usage records stay scoped to each one.

## Define what sharing may change

A dense 72-billion-parameter model at two bytes per weight needs about 144 GB of weight storage. One hundred independent copies would need 14.4 TB before runtime state. Sharing a copy across compatible requests can reduce duplication, although a fleet still needs replicas for capacity and availability. A *model replica* can itself span several graphics processing units (GPUs).

That saving is not a <span data-glossary="tenant-isolation">tenant-isolation</span> mechanism. Write down the invariants before picking a serving engine:

| Perimeter | Invariant |
|---|---|
| Identity | A caller can act only for a workspace it is authorized to use |
| State | Prompts, adapters, retrieved evidence, caches, and logs retain their authorized scope |
| Admission | Concurrent decisions cannot reserve the same remaining allowance or physical capacity twice |
| Scheduling | Backlogged tenants receive their declared service shares, subject to explicit overload policy |
| Accounting | Retries and duplicate completion events cannot create free allowance or duplicate charges |
| Recovery | Reconcile attempt status and usage after a lost response before retrying or refunding |

The <span data-glossary="control-plane">control plane</span> owns policy, deployment, artifact authorization, and worker membership. Data-plane services carry requests and run inference. Both the gateway and worker enforce relevant policy; a protected gateway is insufficient if clients can call a worker's administrative endpoints directly.

<figure>
  <img src="illustrations/_generated/multi_tenant_dark.png" alt="Multi-tenant LLM serving platform architecture with isolated control and data planes. The gateway resolves caller identity and workspace authorization, enforces rate limits, and binds requests to specific tenant quotas. Workers execute requests across continuous batching engines with isolated KV cache pages, scoped LoRA adapter slots, and metered usage accounting." />
  <figcaption>The gateway authenticates callers and resolves workspace permissions before execution. Continuous batching workers process requests using isolated KV-cache pages and dynamic LoRA slots while metering GPU usage per tenant.</figcaption>
</figure>

Define <span data-glossary="slo">service-level objectives (SLOs)</span> by tier and workload. In this platform, **<span data-glossary="ttft">time to first token (TTFT)</span>** starts at external request arrival and ends at the first usable output, so it includes queueing, prompt processing, and adapter loading. An engine metric may start later; name the timing measurement point before comparing it with the gateway's result. **<span data-glossary="itl">Inter-token latency (ITL)</span>** also needs a sampling unit: current vLLM records gaps between streamed output events, which can bundle tokens. Its request-level **time per output token (TPOT)** instead uses `(completion latency − TTFT) / (output tokens − 1)` for more than one output token.[^vllm2026metrics] Also report completion latency, error rate, and throughput under the same offered load. A request with a great first-token time and a failed stream isn't a successful completion.

For example, a tier might target p95 TTFT below 800 ms and p95 streamed-output gaps below 120 ms. These targets need measurements under the intended workload. A percentile across all output gaps can overweight requests with more events. For a goodput metric, separately specify a per-request success/deadline rule and count completions satisfying it. A fleet percentile does not enforce a per-request gate.

Make the distinction concrete. One request emits a first token at 100 ms, bundles four more tokens into an event at 220 ms, and completes at 240 ms. Its observed output-event gap is 120 ms, while request TPOT is `(240 − 100) / (5 − 1) = 35 ms`. Neither number reconstructs the individual decoding gaps behind that bundle. Specify whether a tenant's streaming objective constrains observed output gaps, a request mean, or another defined rule before declaring success.

<figure>
  <img src="illustrations/_generated/bundled_stream_timing_dark.png" alt="Stream latency timeline comparing observed output event gaps with completion-based time per output token (TPOT). A request arrives at 0 ms, yields its first token at 100 ms, receives a four-token chunk at 220 ms, and completes at 240 ms. The event gap of 120 ms reflects network delivery, whereas true TPOT averages 35 ms per token." />
  <figcaption>The 120 ms gap between streamed network frames differs from the 35 ms completion-based TPOT, showing why bundled token streaming requires distinct latency metrics.</figcaption>
</figure>

## Establish identity before touching tenant state

Treat an incoming `Tenant-ID: A` header only as a workspace selector. Authenticate the principal, check its current workspace grants, and construct the internal context from that decision. Validate authorization on every protected operation, with denial as the default.[^owasp2026Authorization]

The internal envelope should carry the resolved tenant and principal, request and attempt IDs, policy revision, authorized model/adapter revisions, deadline, and output cap. Protect it with authenticated service communication and narrowly scoped credentials. A signature protects integrity, but the receiver must still validate issuer, audience, expiry, and permission for the operation. Do not let a downstream service overwrite tenant identity from an untrusted body field.

This example evaluates permissions after credential verification, using simulated principal grants rather than a production directory. A caller can select an authorized workspace, but claiming a different one must fail before any lookup.

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

Tenant identity is only the first permission dimension. Workspace A can contain documents visible to Alice but not another employee. Retrieval, tool calls, cached answers, and exported logs must honor those finer grants too. Never ask the language model to decide whether a document belongs to the caller.

## Reserve quota and memory before dispatching requests

Different limits answer different questions:

| Limit | What it controls | Remaining requirement |
|---|---|---|
| Requests per minute (RPM) | Request arrival rate | Concurrent streams, prompt size, or compute cost |
| Tokens per minute (TPM) | A defined time-window token budget | Equal GPU cost per token |
| Period quota | Total usage allowed in a billing period | Fair scheduling of active requests |
| Concurrency cap | Outstanding work per tenant | Memory fit for each request |
| Context/output cap | Maximum sequence growth | Aggregate pool capacity |
| KV-byte/page budget | Reserved conversation state | Available compute or acceptable latency |

Tokenize the fully assembled request with the deployed tokenizer, including templates and authorized retrieved content. Enforce byte and retrieval-size limits before that work too. Reserve input tokens plus the maximum output allowance under the chosen quota policy. If tool iterations or server-added context can expand the request, reserve each extra step or stop before exceeding the remaining allowance.

A period quota has a useful conservation rule. Start with 1,000 units; reserve 300 input plus 400 maximum output. Available allowance becomes 300. If trusted completion reports 120 output tokens, actual usage is 420, so release the unused 280 and leave 580 available. A duplicate completion must leave 580 unchanged.

$$
\text{limit}=\text{available}+\text{held reservations}+\text{settled usage}.
$$

This example charges all input tokens, including cached input, against its quota. A different product policy can choose different units, but it must declare them. This is not yet a TPM implementation: a rolling-window limiter also needs authoritative time, window attribution, and a defined rule for long-running requests and late reconciliation. Refunding an old reservation into an unrelated new window can manufacture allowance.

### Make reservation and settlement idempotent

An idempotency key must be scoped to the tenant and bound to a fingerprint of the resolved execution request. Repeating the same key and request returns the same reservation. Reusing it for a different prompt, model revision, or output cap is a conflict, not free work. This prevents duplicate admission, but a durable dispatcher must also prevent two workers from executing the same reservation.

The next cell implements a **single-process, fixed-period ledger** with integer token and page units. Its lock makes local check-and-update atomic. It does not provide durable storage, distributed locking, authentication, execution ownership, or a rolling time window. Only trusted gateway and worker code may call it.

<!-- leetllm: test, id=quota-ledger, output=show -->
```python title="quota-reservations.py"
from dataclasses import dataclass
from threading import Lock


@dataclass(frozen=True)
class Spec:
    fingerprint: str  # trusted canonical request fingerprint, not a client assertion
    input_tokens: int
    max_output: int
    kv_pages: int


@dataclass
class Entry:
    spec: Spec
    output: int | None = None  # None means held, including uncertain execution


class Ledger:
    def __init__(self, tenants, token_limit=1000, concurrency=2, page_limit=20):
        for value in (token_limit, concurrency, page_limit):
            if value is True or value is False or not isinstance(value, int) or value <= 0:
                raise ValueError("limits must be positive integers")
        self.limits = (token_limit, concurrency, page_limit)
        self.used = {tenant: 0 for tenant in tenants}
        self.entries = {}
        self.lock = Lock()

    def _held(self, tenant):
        return [entry for (owner, _), entry in self.entries.items()
                if owner == tenant and entry.output is None]

    def available(self, tenant):
        with self.lock:
            return self.limits[0] - self.used[tenant] - sum(
                e.spec.input_tokens + e.spec.max_output for e in self._held(tenant))

    def reserve(self, tenant, request_id, spec):
        if tenant not in self.used:
            raise PermissionError("unknown tenant")
        if not request_id or not spec.fingerprint:
            raise ValueError("identity and fingerprint are required")
        if any(x is True or x is False or not isinstance(x, int) or x < 0
               for x in (spec.input_tokens, spec.max_output, spec.kv_pages)):
            raise ValueError("reservation units must be nonnegative integers")
        if spec.kv_pages == 0:
            raise ValueError("a positive page reservation is required")
        key = (tenant, request_id)
        with self.lock:
            if key in self.entries:
                if self.entries[key].spec != spec:
                    raise ValueError("idempotency conflict")
                return key
            held = self._held(tenant)
            tokens = sum(e.spec.input_tokens + e.spec.max_output for e in held)
            pages = sum(e.spec.kv_pages for e in held)
            limit, concurrency, page_limit = self.limits
            if (self.used[tenant] + tokens + spec.input_tokens + spec.max_output > limit
                    or len(held) >= concurrency
                    or pages + spec.kv_pages > page_limit):
                raise ValueError("admission limit exceeded")
            self.entries[key] = Entry(spec)
            return key

    def settle(self, tenant, request_id, output_tokens):
        # Called only after actual usage and execution retirement are known.
        with self.lock:
            entry = self.entries[(tenant, request_id)]
            if output_tokens is True or output_tokens is False or not isinstance(output_tokens, int) or not 0 <= output_tokens <= entry.spec.max_output:
                raise ValueError("invalid usage")
            if entry.output is not None:
                if entry.output != output_tokens:
                    raise ValueError("conflicting settlement")
                return
            self.used[tenant] += entry.spec.input_tokens + output_tokens
            entry.output = output_tokens


ledger = Ledger(["A", "B"])
spec = Spec("resolved-request-v1", 300, 400, 5)
assert ledger.reserve("A", "r1", spec) == ("A", "r1")
assert ledger.reserve("A", "r1", spec) == ("A", "r1")
print("after reservation:", ledger.available("A"))
ledger.settle("A", "r1", 120)
ledger.settle("A", "r1", 120)  # duplicate delivery must be harmless
assert ledger.available("A") == 580
assert ledger.available("B") == 1000
print("after repeated settlement:", ledger.available("A"))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
after reservation: 300
after repeated settlement: 580
```
<!-- leetllm: output:end -->

Test the arithmetic and failure paths. This continuation races two reservations that would jointly exceed the allowance. Exactly one can succeed. Its local lock validates one process; a separate test must cover cross-host consensus.

<!-- leetllm: test, continue=quota-ledger, output=show -->
```python title="quota-failure-cases.py"
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier


def must_reject(call):
    try:
        call()
    except (ValueError, PermissionError):
        return
    raise AssertionError("invalid operation succeeded")


before = ledger.available("A")
must_reject(lambda: ledger.reserve("A", "r1", Spec("different-request", 300, 400, 5)))
must_reject(lambda: ledger.settle("A", "r1", 121))
must_reject(lambda: ledger.reserve("A", "bad", Spec("bad", -1, 10, 1)))
must_reject(lambda: ledger.reserve("unknown", "r1", spec))
assert ledger.available("A") == before

race = Ledger(["A"])
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
assert sum(accepted) == 1
assert race.available("A") == 300
uncertain = Ledger(["A"])
uncertain.reserve("A", "lost-response", spec)
# An unconfirmed attempt supplies no completed usage report.
must_reject(lambda: uncertain.reserve("A", "new-attempt", spec))
assert uncertain.reserve("A", "lost-response", spec) == ("A", "lost-response")
assert uncertain.available("A") == 300
uncertain.settle("A", "lost-response", 120)  # confirmed retirement finally arrives
assert uncertain.available("A") == 580
print("concurrent reservations accepted:", sum(accepted))
print("conflicts and invalid input leave the ledger unchanged")
print("unconfirmed disconnect: held 700; terminal settlement: available", uncertain.available("A"))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
concurrent reservations accepted: 1
conflicts and invalid input leave the ledger unchanged
unconfirmed disconnect: held 700; terminal settlement: available 580
```
<!-- leetllm: output:end -->

The disconnect trace deliberately keeps 700 units held. A new identity cannot spend that allowance again, while replaying the original reservation changes nothing. The final `settle` call records confirmed evidence of both usage and execution retirement; calling it with zero merely because the client disconnected would invent evidence the ledger cannot check itself. This example omits a distributed coordinator.

Across gateways, use a durable transaction, conditional update, or equivalent atomic service for the allowance and idempotency record. “Read balance, then write balance” on separate connections is not sufficient. Serializable database transactions can reject conflicting work and require whole-transaction retries; design retries to preserve the same idempotency identity.[^postgresqlIsolation2026] Publish dispatch only from committed reservation state, through a recoverable delivery protocol. Aborting a database transaction does not undo GPU work already launched as a side effect.

Tenant allowance and physical worker capacity are separate reservations. Either coordinate them transactionally or use a recoverable staged protocol: reserve tenant allowance, obtain worker capacity, dispatch once, and release the first reservation if placement definitely failed. Do not release it merely because an acknowledgment timed out. Execution may already be running.

<figure>
  <img src="illustrations/_generated/quota_lifecycle_dark.png" alt="Four-stage tenant quota reservation and settlement lifecycle on a 1000-unit scale. Initially 1000 units are available. Reserving 300 input tokens plus 400 maximum output tokens places a 700-unit hold, leaving 300 available. When actual completion generates 120 output tokens, 420 tokens settle, releasing 280 unused units back to 580 available. Duplicate settlement delivery produces zero extra charge." />
  <figcaption>Token quota holds reserve worst-case output capacity during generation. Settling the actual 120 generated tokens refunds 280 unused units; duplicate settlement reports are idempotent.</figcaption>
</figure>

```checkpoint
A gateway loses the response after dispatch. Can it refund the whole reservation and retry with a new request ID?
---
No. The worker may still be executing. Keep the request in an uncertain state, recover its authoritative status, and reuse the original idempotency identity. Refunding and starting a new attempt without ownership control can double-execute work and exceed the quota.
```

<figure>
  <img src="illustrations/_generated/idempotent_admission_race_dark.png" alt="Idempotent admission race and conflict resolution between two concurrent requests. Two contenders simultaneously request 700 units against a 1000-unit ledger. Contender 1 wins the lock and acquires a 700-unit hold, leaving 300 units available. Contender 2 is rejected due to insufficient capacity. Replaying the identical request with the same fingerprint returns the existing hold, while changing the prompt fingerprint triggers an idempotency conflict." />
  <figcaption>Contender 1 wins the lock, leaving insufficient units for Contender 2. Identical replayed requests return existing reservations safely, whereas modified payloads trigger idempotency conflicts.</figcaption>
</figure>

## Budget memory before promising concurrency

The [KV cache](/learn/kv-cache-paged-attention-llm-serving) stores attention keys and values for active context. For a full-attention model with 80 layers, 8 KV heads, head dimension 128, and two-byte values, each cached token uses:

$$
2\times80\times8\times128\times2=327{,}680\text{ bytes}=0.3125\text{ MiB}.
$$

At 4,000 tokens, that is 1.2207 GiB per sequence before metadata and other memory. The leading factor counts keys and values. Use KV-head count, not query-head count, for grouped-query attention. Other architectures and cache layouts need their own formula.

PagedAttention maps logical token blocks to non-contiguous physical blocks.[^kwon2023pagedattention] With 16-token blocks, our shape uses 5 MiB per block. Sequence A with 47 tokens requires three blocks and sequence B with 31 tokens requires two. They use 78 of 80 reserved token slots, leaving two slots unused. Paging limits this tail waste; it does not authorize block-table access.

<!-- leetllm: test, output=show -->
```python title="paged-kv-reservations.py"
BYTES_PER_TOKEN = 2 * 80 * 8 * 128 * 2
BLOCK_TOKENS = 16


def reserve_pages(input_tokens, max_output):
    if any(n is True or n is False or not isinstance(n, int) or n < 0 for n in (input_tokens, max_output)):
        raise ValueError("token counts must be nonnegative integers")
    return (input_tokens + max_output + BLOCK_TOKENS - 1) // BLOCK_TOKENS


for tenant, tokens in (("A", 47), ("B", 31)):
    pages = reserve_pages(tokens, 0)
    print(f"{tenant}: {pages} pages, {pages * BLOCK_TOKENS - tokens} unused token slots")
print("MiB per page:", BYTES_PER_TOKEN * BLOCK_TOKENS / 2**20)
print("GiB for 4000 cached tokens:", round(BYTES_PER_TOKEN * 4000 / 2**30, 4))
assert reserve_pages(16, 1) == 2  # output growth crosses a page boundary
assert reserve_pages(0, 0) == 0
assert reserve_pages(2**54 + 1, 0) == 2**50 + 1  # exact integer arithmetic
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
  <img src="illustrations/_generated/kv_cache_paging_dark.png" alt="PagedAttention memory management with non-contiguous physical block allocation. Tenant A with 47 tokens maps to physical blocks P0, P2, and P4. Tenant B with 31 tokens maps to blocks P1 and P3. A separate sequence demonstrates that allocating a single token beyond a 16-token page boundary requires an immediate second physical page reservation." />
  <figcaption>Non-contiguous physical pages eliminate external memory fragmentation across tenants, though sequence growth across 16-token boundaries allocates an entire new page block.</figcaption>
</figure>

Keep page arithmetic in integers. Converting `2**54 + 1` tokens to a float before rounding would lose one token and underreserve a page. That regression input is far beyond a real model's context; deployment must enforce the actual context and output caps before allocation.

The formula above is aggregate logical KV storage. Per-device fit depends on tensor sharding or replicated KV heads, layer placement, precision, and engine metadata. Reserve weights, adapters, activations, graph buffers, and headroom too. Check available memory and tensor placement on the selected worker before scheduling the request.

Reserving the full input-plus-output cap is conservative. Incremental page allocation accommodates more concurrency, but the platform must define what happens when growth fails: queue, preempt, swap, recompute, or terminate under an explicit policy. If reservation covers only the prompt, choose and document the output-growth policy before enabling streaming.

For shared prefix blocks, distinguish physical occupancy from tenant accounting. One physical block may have several references. A policy might charge each tenant logical usage or apportion shared occupancy; either can be coherent if declared. Summing per-request logical bytes overstates physical occupancy when blocks are shared, while forgetting shared references can release live state too early.

Remote KV adds another placement option, not free memory. Authorize the trust scope and verify model, adapter, token sequence, position, and cache-layout compatibility before transfer. Compare lookup and transfer time with recomputation under the deadline. Retire ownership only after readers finish; network timeouts do not establish that a remote reader has stopped.

## Schedule active tenant turns fairly

[Continuous batching](/learn/continuous-batching-request-scheduling) removes finished sequences and inserts new requests at step boundaries.[^yu2022] B shouldn't wait for A's entire generation merely because they started together. But continuous batching alone doesn't prevent A's long prompt from monopolizing a step.

Chunked prefill splits prompt work so it can interleave with decode. In current vLLM documentation, `max_num_batched_tokens` bounds tokens processed per iteration; changing it trades prefill throughput and first-token delay against streaming latency.[^vllm2026optimization] Enforce tenant quotas separately and measure per-tenant latency.

Use per-tenant queues and explicit service shares. A priority class can have a larger share without giving it unbounded priority forever. Otherwise sustained premium traffic can starve B's lower tier. Add maximum waiting time, aging, or reserved service for that tier, then declare what happens when offered load exceeds capacity.

The miniature deficit scheduler below charges **synthetic work units**, not requests or measured GPU time. A receives four units per round and B two. A's chunks cost three units each; B's cost one. Unused credit carries forward while the queue remains backlogged.

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
assert served == {"A": 12, "B": 6}
assert jobs == {"A": 4, "B": 6}
print("served work units:", served)
print("completed chunks:", jobs)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
served work units: {'A': 12, 'B': 6}
completed chunks: {'A': 4, 'B': 6}
```
<!-- leetllm: output:end -->

The intended 2:1 work share is **not** a 2:1 request-count share. Real prefill and decode tokens have different, context-dependent costs, and co-batching changes those costs. Calibrate a scheduling cost model and reconcile estimates with measurements. Bound chunk size and batch-building time; a fair average over three rounds doesn't bound tail latency.

[Speculative decoding](/learn/speculative-decoding) adds proposal and verification work to that budget. Reserve the positions and temporary state used during proposal and verification; the accepted token count understates the work. Keep the proposal path inside the tenant's data permissions and verify compatibility with its target and adapter. Measure latency while other tenants compete for the same positions.

Preemption also has a cost. Preserve the generated prefix and execution state needed to resume, account for repeated prefill, and avoid evicting the same victim indefinitely. A victim-selection function doesn't free memory by itself. Retire or swap its actual blocks, update allocator state, and reserve the newcomer's blocks atomically with respect to competing scheduling decisions. An asynchronous device operation may need to complete before reuse is safe.

```checkpoint
Why can two requests with equal token counts deserve different scheduler charges?
---
Their prefill/decode split, context length, cache reuse, and batch companions can change execution cost. Token counts are convenient units, but equal counts don't prove equal GPU work or equal delay imposed on other tenants.
```

<figure>
  <img src="illustrations/_generated/deficit_service_rounds_dark.png" alt="Deficit round-robin scheduling across three rounds. Tenant A receives 4 quantum credits per round with chunk cost 3; Tenant B receives 2 credits with chunk cost 1. Over three rounds, Tenant A serves 12 work units across 4 chunks, while Tenant B serves 6 work units across 6 chunks, maintaining a 2:1 work ratio despite completing fewer chunks." />
  <figcaption>Deficit round-robin preserves a 2:1 work unit ratio across three rounds, demonstrating that chunk count does not equate to consumed GPU compute.</figcaption>
</figure>

## Keep adapter residency separate from permission

[Low-Rank Adaptation (LoRA)](/learn/lora-parameter-efficient-fine-tuning) adds small learned matrices to selected frozen base layers.[^hu2021] Compatible requests can share base execution while using different adapters. The adapter modifies model behavior; it is not an authorization perimeter or a substitute for document access controls.

Resolve a tenant-facing alias such as `docs-current` into an approved immutable artifact revision and compatible base-model revision. Check permission before consulting a hot cache. Bind the resolved revision to the request for its whole lifetime, including retries and cached KV. A mutable alias must not silently change an active request halfway through generation.

As checked on November 7, 2026, vLLM supports per-request LoRA selection and warns that runtime loading should be used only in an isolated, fully trusted environment.[^vllm2026lora] Do not expose raw load/unload endpoints, filesystem paths, or arbitrary artifact URLs to tenants. An adapter service should validate ownership, format, size, rank, base compatibility, and artifact integrity before a worker loads it.

Cache eviction needs reference tracking. If A's adapter is least recently used but still referenced by an in-flight batch, eviction cannot invalidate that batch's handle. Evict an unreferenced artifact, wait, or use another worker. A least-recently-used list alone does not implement safe concurrent hot-swapping.

<figure>
  <img src="illustrations/_generated/adapter_reference_lifetime_dark.png" alt="Dynamic LoRA adapter lifecycle with reference counting. Tenant permission and base compatibility are validated before cache lookup. An in-flight request pins adapter A (reference count 1), preventing eviction by competing tenant requests. Only when execution completes and reference count drops to 0 does the cache manager permit eviction and hot-swap of adapter B." />
  <figcaption>Active execution pins adapter weights in VRAM with an incremented reference count. Eviction and hot-swapping are deferred until all references drop to zero.</figcaption>
</figure>

## Scope retrieval and caching to the actual reader

A relevant document is not necessarily an authorized document. Apply tenant and principal-level predicates inside the trusted retrieval operation, before retrieved text leaves the security perimeter. Revalidate sensitive permissions before materializing content if grants can change during the request. A broad top-K followed by filtering can lose all authorized candidates and may expose foreign IDs or scores to a component that was not allowed to see them.

The isolation perimeter matters more than a particular database feature. A trusted retrieval service can perform the check internally; keep forbidden evidence inside that service rather than sending it to a tenant-facing application for later discard. Defense-in-depth checks at content fetch remain useful. In PostgreSQL, enabled row-level security without a policy denies ordinary row access, but superusers and `BYPASSRLS` roles bypass it. Table owners normally bypass it too unless subject to `FORCE ROW LEVEL SECURITY`. Test the actual retrieval-service role with the production query path to confirm the policy applies.[^postgresql_rls_docs]

The snippet below extends our multi-tenant model to demonstrate filtered retrieval and cached KV prefixes. It operates on in-memory rows with simulated relevance scores, not a vector database. Alice's own tenant contains a second document she is not allowed to read.

<!-- leetllm: test, continue=tenant-context, output=show -->
```python title="authorized-evidence-and-cache.py"
documents = [
    {"id": "A-public", "tenant": "A", "readers": {"alice"}, "score": 0.80},
    {"id": "A-private", "tenant": "A", "readers": {"carol"}, "score": 0.95},
    {"id": "B-secret", "tenant": "B", "readers": {"bob"}, "score": 0.99},
]


def search(context, top_k):
    if top_k is True or top_k is False or not isinstance(top_k, int) or top_k <= 0:
        raise ValueError("top_k must be a positive integer")
    allowed = [d for d in documents if d["tenant"] == context.tenant
               and context.principal in d["readers"]]
    return [d["id"] for d in sorted(allowed, key=lambda d: d["score"], reverse=True)[:top_k]]


def namespace(context, acl_revision, adapter_revision, token_ids):
    # A conservative identity tuple, not vLLM's wire-level block-hash implementation.
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

A key is a compatibility partition, not permission to fetch its value. The cache service must authenticate and authorize its caller. Do not accept a caller-selected trust-group ID or cache salt without resolving membership. Cached answers, semantic caches, and KV prefixes have different compatibility needs; an answer cache may also depend on retrieval corpus revision, tool state, and generation settings.

vLLM's prefix caching hashes token blocks with extra state such as LoRA identity and supports a first-block `cache_salt` to separate reuse groups.[^vllm2026prefix] Use it alongside API authorization, secure transport, and process isolation. Identical prompt text can tokenize differently or run under different positions, model behavior, and permissions; validate the full sharing context.

For private retrieval, default to a conservative principal or permission-set scope. Broader tenant-wide reuse needs explicit shared-visibility rules. After revocation, stop new reads under stale grants and invalidate or make stale cache entries unreachable according to the retention policy. Existing streams and historical logs need their own revocation/retention decisions.

<figure>
  <img src="illustrations/_generated/authorized_evidence_and_cache_dark.png" alt="Multi-tenant retrieval filtering and KV-cache namespace scoping. Search queries apply tenant and principal access control predicates before ranking to prevent unauthorized document leakage. The cache namespace combines tenant ID, user principal, ACL revision, model revision, adapter ID, and token IDs, ensuring cached KV activations cannot be accessed across tenant or permission boundaries." />
  <figcaption>Filtering retrieval by tenant and principal before ranking prevents leaking unauthorized passages into prompt context. Comprehensive cache namespaces prevent cross-tenant KV reuse.</figcaption>
</figure>

## Match isolation perimeters to your threat model

Namespaces, scheduler quotas, and cache salts protect different paths. They do not create separate operating-system or GPU security domains. Avoid a single “isolation level” that hides which resources remain shared.

| Choice | Separation it can provide | What still needs scrutiny |
|---|---|---|
| Shared worker process | Logical request, adapter, and KV mappings | Shared address space, kernels, administrative access, and implementation bugs |
| Separate processes/containers | Process address-space and deployment boundaries | Host kernel, device access, driver stack, and side channels |
| Separate Multi-Instance GPU (MIG) instances | Partitioned GPU compute and memory resources | Host/driver trust, instance provisioning, model fit, and remaining shared infrastructure |
| Virtual machines or dedicated nodes/pools | Additional host or deployment separation | Hypervisor/platform trust, network, storage, identity, and operational access |

NVIDIA distinguishes GPU instances from compute instances inside them. Compute instances within one GPU instance share its memory and some engines; they are not equivalent to separate GPU-instance memory boundaries.[^nvidiaMigConcepts2026] A MIG partition is not automatically a dedicated node or a virtual machine, and a large tensor-parallel replica may not fit the chosen partitioning scheme.

Encryption and personally identifiable information (PII) masking are additional controls, not replacements for these isolation mechanisms. A masked prompt can still retrieve another tenant's postmortem. A redaction service can also miss sensitive data; protect its placeholder map, logs, and error paths. Do not infer a specific regulatory requirement from the word “regulated”; document the actual data and adversary assumptions.

<figure>
  <img src="illustrations/_generated/runtime_security_boundaries_dark.png" alt="Multi-tenant runtime security boundaries comparison across four isolation tiers: in-process multiplexing, container and process separation, hardware GPU slicing via MIG, and dedicated node or VM clusters. Each tier balances memory density, multiplexing efficiency, and tenant blast radius." />
  <figcaption>Comparing isolation boundaries from in-process multiplexing to dedicated GPU nodes balances resource utilization against tenant blast radius.</figcaption>
</figure>

## Separate usage, allocated cost, and the customer bill

Record immutable usage events with tenant, request, attempt, reservation, model/adapter revision, input/output counts, cached-input counts, terminal status, and metering-policy revision. A retry is a new execution attempt under the same logical request. Generated output, delivered output, and billable output can differ after disconnection; state which metric the billing policy charges.

A timing log showing “this request took 200 ms” does not mean it consumed 200 exclusive GPU-ms. Several requests may share a step, and a replica may span multiple GPUs. Shared execution cost is measured at the worker/step level; assigning it to requests is an **allocation policy**, not a uniquely observable physical truth.

Suppose four GPUs run a shared step for 0.2 seconds. That is 0.8 GPU-seconds. At \$2 per GPU-hour, the step costs about \$0.000444. The equivalent four-GPU node rate is \$8 per node-hour: multiply that by 0.2 **node-seconds**, not 0.8 GPU-seconds. Mixing those units quadruples the charge.

This calculation assigns 25% of shared cost to A and 75% to B as policy inputs. Compare those allocations with measured request-level utilization when setting the policy. Conservation should hold before rounding individual invoices.

<!-- leetllm: test, output=show -->
```python title="shared-cost-allocation.py"
from decimal import Decimal as D

seconds, gpus = D("0.2"), D(4)
per_gpu_hour = D(2)  # USD per GPU-hour
node_hour = per_gpu_hour * gpus
step_cost = seconds * gpus * per_gpu_hour / D(3600)
assert step_cost == seconds * node_hour / D(3600)
shares = {"A": D("0.25"), "B": D("0.75")}
assert sum(shares.values()) == 1
allocated = {tenant: step_cost * share for tenant, share in shares.items()}
assert sum(allocated.values()) == step_cost
wrong = seconds * gpus * node_hour / D(3600)
assert wrong == 4 * step_cost
print("step cost USD:", f"{step_cost:.9f}")
print("allocated USD:", {t: f"{cost:.9f}" for t, cost in allocated.items()})
print("mixing GPU-seconds with node-hour price overcharges by:", f"{wrong / step_cost:.0f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
step cost USD: 0.000444444
allocated USD: {'A': '0.000111111', 'B': '0.000333333'}
mixing GPU-seconds with node-hour price overcharges by: 4
```
<!-- leetllm: output:end -->

Queue wait consumes deadline budget but is not busy accelerator time. Idle replicas, CPU work, storage, transfer, and failed/recomputed attempts still cost money; track them separately and declare their allocation rule. A customer token price can differ from internal allocated cost. Compare the two to detect an unsustainable workload mix, without pretending the tariff is a hardware measurement.

```checkpoint
Worker attempt A/r1/1 settles 420 units. Two deliveries have different message IDs but describe that same settlement. Can the second message charge another 420?
---
No. Bind settlement to a stable tenant/reservation/attempt identity. Transport message IDs can change across deliveries. The balance and logical charge stay unchanged; conflicting usage is rejected. Retain genuine additional attempts separately and apply the declared billing policy to their work.
```

<figure>
  <img src="illustrations/_generated/step_cost_conservation_dark.png" alt="Continuous batch step cost conservation across a 4-GPU node over a 0.2-second forward step. Total compute equals 0.8 GPU-seconds or 0.2 node-seconds. Tenant allocation divides total compute according to batch token occupancy: Tenant A at 25 percent and Tenant B at 75 percent, summing exactly to 100 percent of step cost before rounding." />
  <figcaption>Total node compute time is conserved and partitioned across active batch tokens. Unit matching ensures GPU-seconds are not erroneously multiplied by node-hour rates.</figcaption>
</figure>

## Recover without losing ownership

A durable request state machine should distinguish reserved, queued, running, cancel-requested, usage-uncertain, and terminal states. Dispatch and terminal events need replay-safe processing. Cancellation is not complete until the worker has stopped generation and retired device/state references, or recovery has established an equivalent safe perimeter.

Before streaming begins, a bounded retry may be transparent if request ownership prevents duplicate execution. After output has been delivered, restarting can duplicate or contradict text. Use an explicit resumable-stream protocol with sequence numbers and compatible state, or terminate the stream with a clear partial-result error. Do not silently append a fresh answer to an old prefix.

Quarantine poison requests after bounded retries, but avoid copying raw prompts into broadly accessible dead-letter queues. Store a scoped identifier and protected diagnostic metadata. Evaluate model quality and tenant isolation with separate checks from worker readiness.

For rollout, resolve immutable model and adapter revisions, isolate incompatible cache namespaces, and send only authorized shadow traffic to approved destinations. Shadow inference still consumes data, quota policy decisions, and compute. Change routing for new requests, drain old references, and retain a rollback path. A base-model revision needs compatible loaded weights and state. Choose one shared pool or separate pools according to serving and rollout constraints.

<figure>
  <img src="illustrations/_generated/uncertain_attempt_recovery_dark.png" alt="Failure recovery and quota reconciliation workflow for uncertain execution attempts. A 700-token quota hold is reserved before generation. When a network timeout occurs mid-generation at token 420, the engine terminates execution, reconciles actual usage by billing 420 tokens, and refunds the remaining 280 tokens. Subsequent retries with the same idempotency key detect terminal status and avoid duplicate billing." />
  <figcaption>When a network timeout interrupts generation, reconciling actual token progress charges only consumed compute and refunds remaining quota holds without duplicate execution.</figcaption>
</figure>

## Diagnose the opening incident with evidence

First stop the cross-tenant path, contain access, preserve scoped audit evidence, and inspect identity propagation, retrieval predicates, and cache ownership. Do not treat it as a latency tuning exercise.

Then explain why A and B wait. Compare queue age, dispatched requests, active sequences, KV occupancy, preemptions, adapter misses, and per-stage latency by tenant and route. A generic utilization percentage can hide a memory or policy bottleneck. Scale only when additional ready capacity addresses the measured constraint; otherwise repair admission, batch construction, or state handling.

A representative load test should include short summaries, long prompts, adapter churn, cache misses, disconnects, worker loss, quota-service outages, and retries. Name hardware/count/topology, engine version, model and precision, prompt/output distributions, warmup, concurrency, arrival process, and baseline. Measure aggregate throughput, overload behavior, and per-tenant tail latency. The local examples above verify arithmetic and control logic; benchmark serving speed, hostile-runtime isolation, and distributed correctness separately.

### Follow-up questions

#### How would you recover a reservation whose worker disappeared after producing some tokens?

Keep its usage uncertain rather than refunding immediately. Reconcile durable dispatch/attempt records with worker events, establish that the old execution cannot continue, and apply the documented partial-usage policy. A replacement attempt needs ownership control and a defined streaming behavior.

#### What would justify sharing cached prefixes across two principals in one tenant?

Both must be authorized for the prefix's full data and execution context, with compatible model/adapter/token state. Resolve a deliberate shared trust group, authorize cache reads, and specify how revocation invalidates reuse. Check document-level permissions for each tenant before sharing a prefix.

### What strong answers show

- Trusted identity is resolved before retrieval, adapter lookup, admission, cache access, and billing; worker access cannot bypass the gateway.
- Quota and capacity reservations are atomic or recoverably staged, idempotent, and safe under uncertain execution.
- Memory calculations use the actual cache layout and placement, while scheduling charges bounded work rather than assuming requests cost the same.
- Logical cache and tenant controls are distinguished from process, GPU-instance, VM, and host isolation perimeters.
- Usage events, internal cost allocation, and customer pricing have explicit units and duplicate-event semantics.
- Rollout, cancellation, and retry protocols preserve execution ownership and state compatibility, with production claims limited to measured evidence.

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
    "question": "A full-cap policy accepts 29 input tokens and allows 20 output tokens. Pages hold 16 tokens. How much page capacity must it reserve?",
    "options": [
      "Four pages, providing 64 positions for the declared full cap",
      "Three pages, providing 48 positions for the declared full cap",
      "Two pages, providing 32 positions for the declared full cap",
      "Five pages, providing 80 positions for the declared full cap"
    ],
    "answer": "Four pages, providing 64 positions for the declared full cap",
    "explanation": "The cap covers 29+20=49 positions. Integer ceiling division by 16 gives 4 pages and 64 positions. Incremental prompt-only allocation would require a separately declared growth-failure policy."
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
    "explanation": "18:9 is 2:1 work, while 6:9 is 2:3 chunks. Synthetic units do not represent measured GPU time, and aggregate service totals alone do not guarantee a maximum wait."
  },
  {
    "question": "A request pins adapter revision r 8. Its alias advances to r 9 while every cache slot remains referenced. What can the platform do safely?",
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
    "question": "Two readers share Cedar but have different private-document grants. A caller supplies the other reader’s cache salt. Which control is still required?",
    "options": [
      "A tenant-plus-salt match, followed by cache lookup before document authorization",
      "A tenant-plus-model match, followed by reuse of the cached document permissions",
      "A trusted reader-group grant, followed by compatible-state and current access checks",
      "A principal-plus-salt match, followed by reuse of the cached ACL revision"
    ],
    "answer": "A trusted reader-group grant, followed by compatible-state and current access checks",
    "explanation": "A salt partitions cache reuse. It neither authenticates its caller nor grants the prefix’s document permissions. Broader reuse requires a deliberately authorized compatible group and revocation behavior."
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
    "explanation": "Use 0.3 node-seconds×6 dollars per node-hour÷3600=0.0005 dollars. Equivalent GPU accounting uses 0.6 GPU-seconds at 3 dollars per GPU-hour. Allocation between requests is a separate policy."
  },
  {
    "question": "During a handoff, an old worker stops submitting GPU work and reports actual token usage while a queued copy is still referencing the request's KV pages. Closing an attempt in this ledger settles its quota and returns its pages to the allocator. What should the recovery owner do?",
    "options": [
      "Record the usage event, keep the quota reserved, and keep the pages assigned",
      "Settle the usage, return the unused quota, and keep the pages assigned",
      "Record the usage event, keep the quota reserved, and release the pages",
      "Settle the usage, return the unused quota, and release the pages"
    ],
    "answer": "Record the usage event, keep the quota reserved, and keep the pages assigned",
    "explanation": "The usage record indicates how many tokens to charge. The queued copy still holds an active page reference, so the recovery coordinator records the event and leaves the entry open. Releasing pages while references remain active risks memory corruption. Once execution fully halts and references retire, the coordinator settles quota and releases both holds."
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

> **Next:** Continue to [Design a Multi-Tenant Agent Sandbox & Code Interpreter Platform](/learn/design-agent-sandbox-platform). Trusted tenant identity and reader permissions keep A's private postmortem out of B's answer. The next design lets the model run code. That code must not see the host, the metadata service, or the previous job's files, and it has to be ready without a full VM boot.
