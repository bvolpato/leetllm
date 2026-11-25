---
{
  "id": "distributed-inference-data-plane",
  "title": "Distributed Inference Data Plane",
  "slug": "distributed-inference-data-plane",
  "section": "GPU Systems & LLM Inference",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 12,
  "shortDescription": "An 8,192-token prompt moves 2.50 GiB of KV state, not a small routing note. See why a correct-looking copy can still be unsafe to reuse.",
  "keyConceptsTested": [
    "Control plane and data plane ownership",
    "Collective ordering and completion",
    "Prefill-decode disaggregation",
    "KV cache byte sizing and transfer latency",
    "Transfer manifests and routing identity",
    "Topology-aware placement",
    "Memory reservation and backpressure",
    "Failure fencing and retry ownership",
    "KV transfer isolation and namespace scoping",
    "Phase-level observability and SLO budgets"
  ],
  "prerequisites": [
    "model-parallelism-for-llm-inference",
    "kv-cache-paged-attention-llm-serving"
  ],
  "relatedQuestions": [
    "serving-benchmark-engineering",
    "continuous-batching-request-scheduling",
    "prefix-caching-prompt-caching",
    "observability-monitoring-llm-systems",
    "design-multi-tenant-llm-serving-platform"
  ],
  "companies": [
    "NVIDIA",
    "Microsoft",
    "Moonshot AI",
    "Google",
    "Amazon",
    "Meta"
  ]
}
---

Consider an 8,192-token prompt request. While one replica processes that prompt, already-streaming replies may wait for their next decode step. Moving <span data-glossary="prefill">prefill</span> to a separate worker can reduce this interference, but creates another wait: the prompt's <span data-glossary="kv-cache">key-value (KV) cache</span> must reach the decoder. For the teaching model below, that's **2.50 GiB**, not a small routing message.

A fast copy to an incompatible decoder is useless. A correct copy into a buffer that's already been reassigned is dangerous. Distributed inference has to coordinate both the movement of bytes and the right to use them.

[Model parallelism](/learn/model-parallelism-for-llm-inference) explained how ranks cooperate inside a model replica. [KV Cache and PagedAttention](/learn/kv-cache-paged-attention-llm-serving) explained cached token state and logical blocks. The [GPU failure operations lesson](/learn/gpu-failure-operations) covered worker failures. Here those pieces meet in one request's prefill-to-decode handoff.

## Decisions, tensor traffic, and token streams

The **<span data-glossary="control-plane">control plane</span>** chooses workers, checks caller permissions, reserves capacity, and assigns request ownership. The **data plane** executes the model and carries its prompt, intermediate tensors, KV state, and output. These names describe responsibilities, not whole processes: a router makes placement decisions and also forwards request bytes.

Our request uses prefill group `P7` and decode group `D3`, each with two <span data-glossary="tensor-parallelism">tensor-parallel (TP)</span> ranks. Communication inside either group combines partial model results. Communication between the groups transfers request state. These are different operations even if they share the same physical network.

<figure>
  <img src="illustrations/_generated/request_plane_contract_dark.png" alt="A connected topology has prefill ranks P7:0 and P7:1 on the left and decode ranks D3:0 and D3:1 on the right. Vertical two-way collective links stay inside each group. Horizontal arrows carry one 1.25 GiB KV shard per corresponding rank. The first shard owns heads 0 through 3 and the second owns heads 4 through 7. Both span all 8,192 token positions, totaling 2.50 GiB under ideal KV-head sharding. A separate control lane reserves D3 for attempt 4 and assigns one stream owner." />
  <figcaption>The two horizontal transfers carry disjoint head shards over the same 8,192 token positions (2.50 GiB total under even KV-head sharding), while vertical collectives stay inside each model group.</figcaption>
</figure>

Splitwise and DistServe study separating prefill and decode so their resources and latency targets can be tuned independently.[^patel2023][^zhong2024] Disaggregation adds KV transfer, coordination, and separate worker pools, so benchmark it against a tuned mixed pool with chunked prefill before splitting your fleet.[^vllm2026disaggregatedprefill]

## Collectives inside a replica must agree

Suppose one layer produces partial activation vectors `[1,2]` on rank 0 and `[10,20]` on rank 1. A sum **<span data-glossary="all-reduce">all-reduce</span>** gives `[11,22]` to both ranks. An **<span data-glossary="all-gather">all-gather</span>** concatenates contributions in rank order. **<span data-glossary="reduce-scatter">Reduce-scatter</span>** sums corresponding elements and gives each rank only its assigned output chunk.[^nccl2026collectives]

<figure>
  <img src="illustrations/_generated/collective_contracts_dark.png" alt="Two aligned index cells hold rank 0 values 1 and 2 and rank 1 values 10 and 20. Corresponding elements sum to 11 and 22. All-reduce copies the ordered vector 11,22 to both ranks. Reduce-scatter gives index 0, value 11, to rank 0 and index 1, value 22, to rank 1. All-gather then reconstructs the ordered vector 11,22 on both ranks." />
  <figcaption>Corresponding index cells keep the same meaning through the sum. All-reduce returns the whole [11,22] vector to both ranks. Reduce-scatter gives one summed chunk to each rank, and all-gather reconstructs the vector in rank order.</figcaption>
</figure>

The example below contrasts these three collective patterns and checks that every rank submits the same schedule. Keep in mind that <span data-glossary="nccl">NVIDIA Collective Communications Library (NCCL)</span> itself does not check application-level sequence labels for you.

<!-- leetllm: test, deps=numpy, output=show, id=collective-contracts -->
```python title="collective-contracts.py"
import numpy as np

partials = np.array([[1, 2], [10, 20]], dtype=np.int64)  # [num_ranks, num_elements]
reduced = partials.sum(axis=0)
all_reduce = np.broadcast_to(reduced, partials.shape).tolist()
reduce_scatter = np.array_split(reduced, partials.shape[0])
all_gather = np.concatenate(reduce_scatter).tolist()
assert all_reduce == [[11, 22], [11, 22]]
assert all_gather == reduced.tolist()
print("all-reduce:", all_reduce)
print("reduce-scatter:", [s.tolist() for s in reduce_scatter], "then gather:", all_gather)


def matching_schedule(rank_logs):
    return bool(rank_logs) and all(log == rank_logs[0] for log in rank_logs)


# (model step, layer, operation, element count, dtype)
a = (0, 3, "all_reduce_sum", 2, "float32")
b = (0, 4, "all_reduce_sum", 2, "float32")
assert matching_schedule([[a, b], [a, b]])
assert not matching_schedule([[a, b], [b, a]])
assert not matching_schedule([[a, b], [a]])
wrong_count = (0, 3, "all_reduce_sum", 3, "float32")
assert not matching_schedule([[a], [wrong_count]])
wrong_dtype = (0, 3, "all_reduce_sum", 2, "float16")
assert not matching_schedule([[a], [wrong_dtype]])
print("reordered, missing, mismatched-count and mismatched-dtype calls: detected")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
all-reduce: [[11, 22], [11, 22]]
reduce-scatter: [[11], [22]] then gather: [11, 22]
reordered, missing, mismatched-count and mismatched-dtype calls: detected
```
<!-- leetllm: output:end -->

For a given collective, participating ranks must agree on the operation and its arguments, including element count and dtype. They must issue matching collective sequences. Swapping two same-shaped reductions can combine the wrong layers without an obvious shape error; mismatches can also hang or corrupt results. NCCL's group-call documentation makes the ordering requirement explicit.[^nccl2026collectives][^nccl2026groups]

A successful NCCL enqueue isn't a completed GPU result. The consumer needs the appropriate CUDA stream dependency or completion event.[^nccl2026streams] Cancelling a request on just one rank mustn't make that rank skip a collective that its peers still execute. Coordinate scheduling changes across the group; a failed group needs the runtime's communicator recovery procedure, not an independent retry of one rank's next collective.

Grouped calls add another synchronization stage: an individual call can return before NCCL enqueues the group. Wait for `ncclGroupEnd`. With a nonblocking communicator, an `ncclInProgress` return means checking communicator state until issuing succeeds before using related CUDA synchronization. Even then, issued work isn't GPU-complete.[^nccl2026groups]

<figure>
  <img src="illustrations/_generated/collective_order_and_completion_dark.png" alt="Aligned rank timelines compare matching application calls a at layer 3 followed by b at layer 4, against rank 1 issuing b then a. Equal element counts and dtypes still join the wrong layers when order differs. A separate completion path passes host enqueue and GroupEnd, nonblocking issuing success, a CUDA completion event, and the consumer. ncclInProgress remains before issuing success. A final trace shows one rank skipping a call while its peer waits." />
  <figcaption>Swapping two same-shaped reductions (a and b) silently combines different layers, while a skipped call hangs peer ranks. Host return, issuing success, and GPU completion remain separate milestones.</figcaption>
</figure>

> **Common mistake:** Treating a successful `ncclAllReduce` return on the CPU as a completed result on the GPU. Host enqueue, nonblocking issue completion, and CUDA stream completion are three separate points in time.

Inside one replica, the ranks have to agree on every collective. The prefill-to-decode handoff moves a different object: the prompt's KV state. How many bytes is that for our 8,192-token prompt?

## How much state crosses the handoff?

Keep that 8,192-token prompt fixed on an 80-layer decoder-only model with 8 KV heads per layer, head dimension 128, and 2-byte BF16 cache values. Every cached token stores both a key and a value:

$$
B_{token}=2 \times 80 \times 8 \times 128 \times 2
=327{,}680\text{ bytes}=320\text{ KiB}.
$$

The full prompt payload is $8{,}192 \times 327{,}680\,\text{bytes} = 2{,}684{,}354{,}560\,\text{bytes} = 2.50\,\text{GiB}$. Under ideal two-way KV-head sharding, each rank holds $2.50/2 = 1.25\,\text{GiB}$. Both shards must arrive, so TP=2 doesn't halve the model-wide payload. Replicated heads, padding, quantization metadata, or layout conversion can change physical bytes. Recalculate with the target architecture's actual cache layout.

At 16 tokens per logical block, the $8{,}192$-token prompt occupies $8{,}192/16 = 512$ blocks. Each model-wide block accounts for $16 \times 320\,\text{KiB} = 5\,\text{MiB}$. Reserving another 128 token positions adds $128/16 \times 5\,\text{MiB} = 40\,\text{MiB}$, giving **2,726,297,600 bytes** before allocator and other runtime overhead. A partial final block rounds allocation up; the payload of real tokens and the reserved block capacity are different quantities.

<figure>
  <img src="illustrations/_generated/kv_payload_reservation_dark.png" alt="A common byte scale compares 2,560 MiB of real prompt KV with a 2,600 MiB reservation and a 2,605 MiB reservation after one extra prompt token. The 8,192 prompt positions form 512 blocks of 16 positions. Eight future output blocks add 40 MiB of allocated capacity. Magnified 16-position blocks show the exact final prompt block edge and why 8,193 plus 128 output positions rounds from 520 to 521 blocks." />
  <figcaption>The common byte scale separates 2,560 MiB of real prompt payload from 2,600 MiB of reserved capacity. The magnified block edge shows 16 positions per 5 MiB block. Reserving 128 future output positions adds 40 MiB. It does not transfer future KV. One extra real prompt token adds 320 KiB of payload but raises rounded capacity by 5 MiB, to 521 blocks and 2,605 MiB.</figcaption>
</figure>

Keep payload size and rounded block reservation separate as you run the budget below (GB/s uses decimal bytes; GiB uses powers of 1,024):

<!-- leetllm: test, output=show, id=kv-budget -->
```python title="kv-budget.py"
BYTES_PER_TOKEN = 2 * 80 * 8 * 128 * 2
BLOCK_TOKENS = 16


def reserved_bytes(prompt_tokens, output_tokens):
    if prompt_tokens < 0 or output_tokens < 0:
        raise ValueError("token counts must be nonnegative integers")
    blocks = (prompt_tokens + output_tokens + BLOCK_TOKENS - 1) // BLOCK_TOKENS
    return blocks * BLOCK_TOKENS * BYTES_PER_TOKEN


payload = 8192 * BYTES_PER_TOKEN
reservation = reserved_bytes(8192, 128)
assert payload == 2_684_354_560
assert reservation == 2_726_297_600
assert reserved_bytes(8193, 128) - reservation == 16 * BYTES_PER_TOKEN
assert reserved_bytes(0, 0) == 0
capacity = 8 * 1024**3
assert capacity // reservation == 3
print(f"payload: {payload / 1024**3:.2f} GiB; reservation: {reservation / 1024**2:.0f} MiB")
print("8 GiB capacity fits", capacity // reservation, "requests before other overhead")
for assumed_gb_s in (12.5, 25.0, 50.0):
    milliseconds = payload / (assumed_gb_s * 1e9) * 1000
    print(f"assumed {assumed_gb_s:4.1f} GB/s -> {milliseconds:6.1f} ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
payload: 2.50 GiB; reservation: 2600 MiB
8 GiB capacity fits 3 requests before other overhead
assumed 12.5 GB/s ->  214.7 ms
assumed 25.0 GB/s ->  107.4 ms
assumed 50.0 GB/s ->   53.7 ms
```
<!-- leetllm: output:end -->

For serial transfer with aggregate effective payload rate $R$, the transfer term is $B/R$. At an assumed $25\,\text{GB/s}$, it's $107.4\,\text{ms}$. If two independent links each carry one $1.25\,\text{GiB}$ shard concurrently at $25\,\text{GB/s}$, the transfer finishes in roughly $53.7\,\text{ms}$ before overhead. If both streams share a $25\,\text{GB/s}$ bottleneck, dividing each shard by that rate falsely doubles the available capacity.

<figure>
  <img src="illustrations/_generated/shared_path_capacity_dark.png" alt="Two identical 1.25 GiB shards converge on one shared 25 GB/s path or travel on two independent 25 GB/s paths. On the same 0 to 120 millisecond scale, the shared path completes at 107.3741824 milliseconds, while both independent paths complete at 53.6870912 milliseconds. The link rates are assumptions. Forty requests per second demand 107.3741824 GB/s, above the shared path maximum of about 9.31 transfers per second." />
  <figcaption>Both cases carry the same two 1.25 GiB shards. One shared 25 GB/s bottleneck takes 107.4 ms, whereas two independent 25 GB/s paths finish in 53.7 ms before overhead. Forty such requests per second demand 107.4 GB/s, far above the shared path's 9.31 transfers/s ceiling.</figcaption>
</figure>

> **Key insight:** Tensor parallelism splits each prompt's KV cache across ranks, not across total wire bytes. If both shards cross one shared NIC, TP=2 does not halve transfer time.

## Reserve capacity before creating expensive state

`D3` has 8 GiB of available KV capacity in our simplified budget. Three requests fit; four don't. A request counter alone misses that limit: one 100-token prompt and one 8K prompt each count as one request but consume very different memory.

Our teaching protocol reserves downstream capacity before prefill starts. This reduces wasted prompt computation when decode is full. It demonstrates one reservation sequence; compare the target engine's implementation. Mooncake discusses early rejection and KV-aware scheduling to avoid completing prefill for work that can't be served.[^qin2024]

Free capacity now may differ from decode load when prefill finishes. Mooncake describes oscillation caused by that scheduling delay and uses a system-level future-load prediction to improve early rejection. A byte reservation protects a memory bound; output-length and latency estimates need additional workload signals.[^qin2024]

Capacity reservation must balance four constraints together:

| Resource | Charge | When new work waits or rejects |
|---|---|---|
| Prefill work | Prompt tokens or estimated compute | Bounded prefill queue is full or deadline is implausible |
| Destination memory | Rounded prompt plus output KV bytes | Reservation would exceed allocatable capacity |
| Transfer path | Bytes in flight and queue age per shared path | Transport queue or its deadline budget is exhausted |
| Decode execution | Active sequences and expected output work | Memory fits but token-step latency would suffer |

Treat an output reservation as a budget. Generation may use less, so enforce an output cap or acquire more credit before crossing the reserved limit. Cancellation, timeout, and completed requests must eventually release their charges, after the associated memory is safe to reuse.

A lease limits how long a reservation may become ready. Its expiry uses the destination's monotonic clock; the sender doesn't get to extend it by providing a larger timestamp. After commit, active request ownership replaces this reservation lease. **Expiry revokes pending commit immediately. Remote writes may continue while transfers drain, so retired buffers can remain physically charged until they are safe to reuse.**

## Agree on the interpretation before moving bytes

The destination first compares the sender's manifest against a trusted reservation. The manifest describes the transfer; it doesn't authorize itself.

| Identity or shape | Running value | Why it matters |
|---|---|---|
| Request and attempt | `prompt_8k_kv`, attempt `4` | Reject a delayed completion from superseded attempt 3 |
| Pool and sharing scope | `pool_llama70b` | Isolate cached KV prefixes across independent serving pools |
| Model tuple | `llama3-70b/gqa8/bf16/tp2`, no LoRA | Match weights, token interpretation, and tensor layout |
| Prompt and position | Token digest `hash_8192_bf16`, positions 0 through 8191 | Match the exact canonical token sequence and positions |
| KV interpretation | BF16, `hnd-v3`, block size 16 | Interpret bytes with the correct dtype, strides, and block layout |
| Shard coverage | Ranks 0 and 1, logical blocks 0 through 511 | Require every needed layer, head shard, and token range |
| Destination reservation | `slot_decode_r3` | Bind the transfer to reserved VRAM capacity and local expiry |

Use canonical token IDs from one owner rather than independently rendering chat templates at both workers. vLLM supports experimental reuse of prefill token IDs through `kv_transfer_params` on `/v1/chat/completions`, though `messages` stays required and non-text content or `echo` causes those IDs to be ignored, so a proxy cannot assume they always bypass preprocessing.[^vllm2026disaggregatedprefill] Sampling state, the last token or hidden state needed to start decode, and first-token ownership also belong in the engine handoff because KV tensors alone are not enough to resume generation.

Logical block 31 can live at physical block 904 in prefill rank 7 and block 118 in decode rank 3. Local physical indices do not need to match, so long as logical token positions map to the right destination shard. A connector may explicitly support repartitioning or layout conversion; budget and validate that conversion rather than silently reinterpreting bytes. A correct manifest still does not say who may write the buffer, or when those bytes are safe to reuse.

<figure>
  <img src="illustrations/_generated/manifest_and_stream_ownership_dark.png" alt="Disaggregated KV transfer flows from Router Control assigning attempt 4 and checking Decode Quota against free HBM backpressure, through Prefill Pool TP2 holding 2.50 GiB shards over an RDMA or NVLink TX queue at 68% capacity to Decode Pool TP2 verifying layout match and 1,024 unique blocks before granting one decode stream." />
  <figcaption>Decode capacity is reserved before launching prefill, bounded by HBM backpressure. Prefill retains KV shards over the RDMA or NVLink transmit queue while the decode pool validates attempt identity, dtype, and all 1,024 unique blocks before handing the stream to one decoder.</figcaption>
</figure>

## A transfer engine doesn't own the request

Request ownership changes through protocol transitions; copying bytes alone leaves the reservation and buffer-lifetime state unchanged. NIXL separates memory registration, connection-metadata exchange, buffer descriptors, and asynchronous transfer operations while an external conductor coordinates the workload and metadata path.[^nixl2026architecture] Serialize only that small metadata into JSON, keeping gigabytes of tensors in registered GPU or host memory.

The surrounding service still owns authorization, placement, retry rules, and output ownership. Protect the metadata channel, keep remote keys and descriptors out of logs, and layer encryption, tenant isolation, and authenticated workload identity on top of RDMA.

<details>
<summary>Deep dive: Engine-specific connector details (Dynamo and NIXL/UCX)</summary>

- **Dynamo routing and handoff:** Dynamo passes backend-specific handoff metadata from prefill to coordinate decode and NIXL movement.[^nvidia2026dynamodisaggregated] Its topology-aware routing can require or prefer the same transfer domain, because a lightly loaded decoder across a congested path can finish later than a busier nearby one.[^nvidia2026dynamoKvTransferTopology] Automatic prefill-router activation applies to the integrated `dynamo.frontend` path; standalone Python routers wire stages explicitly, and a failed handoff returns an error rather than silently falling back to decode-only execution.[^nvidia2026dynamoroutertopology]
- **NIXL ordering and cancellation:** Distinct transfer requests are not automatically ordered, so the application must prevent concurrent transfers from overlapping the same region. Releasing a transfer can involve asynchronous cancellation, keeping "cancel requested," "operation stopped," and "buffer reusable" as separate milestones.[^nixl2026backendGuide]
- **UCX error reporting:** The UCX plugin defaults `ucx_error_handling_mode` to `peer`. Switching to `none` can unlock extra transport lanes but drops peer-failure reporting guarantees, meaning a timeout or absent disconnect error is never proof that a remote writer stopped.[^nixl2026backendGuide]

</details>

## Timeout revokes ownership, not physical access

Suppose 70% of attempt 4's KV has arrived when its lease expires. The destination must reject commit. Returning those blocks to the allocator immediately, however, could let an in-flight remote write overwrite attempt 5's cache.

<figure>
  <img src="illustrations/_generated/transfer_retirement_dark.png" alt="Ordered steps down the left describe buffer B4 holding 2,600 MiB: RDMA writes start for attempt 4, lease expiry fences commit, in-flight RDMA writes continue landing while B4 stays quarantined and reuse stays blocked, abort acknowledgement and idle GPU readers complete quiescence, and 2,600 MiB is reclaimed free." />
  <figcaption>Expiry fences commit while late writes can still reach B4. Its full 2,600 MiB charge stays held until RDMA writes abort and all GPU readers finish, then reclamation frees the buffer.</figcaption>
</figure>

For a clean whole-prompt protocol, keep four stages distinct:

1. **Reserve:** charge capacity and record the expected manifest under a server-issued attempt.
2. **Transfer:** keep incoming blocks unavailable to attention, even if some are complete.
3. **Commit:** after compatibility, complete unique coverage, integrity, and visibility checks pass, grant one decoder ownership.
4. **Retire and reclaim:** stop queueing and streaming, then wait for confirmed cancellation or completion and GPU-reader quiescence before reusing memory.

Advanced connectors can overlap layer-wise transfer and compute, which requires per-region dependency tracking so attention never reads an unfinished layer. This whole-prompt commit rule is simpler to reason about.

A duplicate arrival mustn't count as a new block. Counting 1,024 notifications isn't equivalent to receiving 512 distinct blocks on each of two ranks. Likewise, a completed byte count doesn't validate layer coverage or a manifest's interpretation.

<figure>
  <img src="illustrations/_generated/reservation_and_coverage_dark.png" alt="A common 8 GiB pool scale holds three 2,600 MiB reservations, leaving 392 MiB; a fourth 2,600 MiB reservation is rejected. The third reservation remains charged while retired but not quiescent. Two rank strips each span 512 logical blocks. A magnification shows block 0 received twice and block 1 missing on rank 0, so 1,024 notifications represent only 1,023 unique rank-block pairs. Full unique coverage, interpretation and integrity, visibility, and stopped writers must all hold before commit." />
  <figcaption>The 8 GiB pool keeps three 2,600 MiB charges and 392 MiB free. A retired reservation remains charged until accesses stop, so it cannot fund a fourth request. The two strips each cover 512 logical blocks. Magnification shows how a duplicate (rank 0, block 0) hides missing (rank 0, block 1) despite 1,024 notifications. Commit requires complete unique coverage, compatible interpretation, integrity, connector-required visibility, and stopped writers.</figcaption>
</figure>

### Execute the ownership rules locally

Use [handoff_model.py](assets/handoff_model.py) to explore the ownership transitions. It serializes them in one Python process and tracks block identities while leaving tensor payloads outside the model. The expected manifest comes from the local slot reservation; a received manifest must match it. `finish()`, `abort_ack()`, and `consumer_stopped()` represent transport and reader quiescence signals passed to this model.

The simulation uses integer ticks from one local destination clock instead of accepting sender timestamps. Invalid durations and block identities are rejected before changing ownership or coverage. In a real service, bind every callback to the actual transfer handle and device region.

This short run expires a lease while writes are still possible. Credit remains unavailable until successful abort acknowledgement.

<!-- leetllm: test, output=show, id=handoff-expiry -->
```python title="expire-without-reusing.py"
from assets.handoff_model import Manifest, Receiver, rejected

manifest = Manifest()
pool = Receiver(manifest.reserved)
key = pool.reserve(manifest, now=0, ttl=10)
pool.begin(key, manifest)
pool.arrive(key, rank=0, block=0)
rejected(lambda: pool.commit(key, now=10))  # exact expiry tick
pool.arrive(key, rank=1, block=0)           # late write remains possible
rejected(lambda: pool.reclaim(key))
print("after expiry, free bytes:", pool.free)
pool.abort_ack(key)                       # assumed connector confirmation
pool.reclaim(key)
pool.reclaim(key)                         # duplicate cleanup is harmless
print("after quiescence, free bytes:", pool.free)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
after expiry, free bytes: 0
after quiescence, free bytes: 2726297600
```
<!-- leetllm: output:end -->

The longer checks reject eight manifest mismatches, exercise duplicate and missing blocks, reject streaming before commit, retain an old attempt's charge during replacement, and prevent retries after visible output. They also enumerate 720 orderings of two arrivals, completion, commit, cancellation, and reclamation.

<!-- leetllm: test, output=show, id=handoff-checks -->
```python title="check-handoff-interleavings.py"
from assets.handoff_model import run_checks

run_checks()
```

<!-- leetllm: output:start -->
```text title="Output" output compact
8 manifest mismatches, duplicate/missing blocks, stale attempts and expiry: pass
720 event orders: no partial commit or premature credit reuse
invalid leases, clock ticks, manifests and block identities: rejected
```
<!-- leetllm: output:end -->

> **Key insight:** A timed-out reservation still consumes physical VRAM until every in-flight RDMA write aborts and every GPU reader finishes. Reclaiming credit on expiry alone invites silent buffer corruption.

In production, wire those state transitions to authoritative attempt ownership (for example via compare-and-swap at commit), durable recovery state, and a frontend that fences stale streams, then verify cancellation and visibility on your real NIXL, vLLM, Dynamo, or RDMA stack.

## Failure modes and retry limits

Before output is visible, the service may retry if it can fence the old owner, preserve request semantics, and stay within its deadline and retry budget. vLLM exposes `fail` and `recompute` modes for KV-load failure; those are local engine behaviors, not a complete resumable-stream protocol.[^vllm2026kvtransferconfig]

After output may have reached the client, don't transparently restart at token 1. A lost acknowledgement can make delivery uncertain. Exact continuation requires an agreed cursor, token or frame deduplication, sampling state, and authoritative ownership. Without that protocol, return an explicit interrupted-stream error.

| Failure | Safe recovery point |
|---|---|
| Prefill fails | Fence that attempt; recompute on a healthy group if retry limits allow |
| Partial transfer times out | Retire it; reclaim only after its accesses stop; retransmit retained source KV or recompute |
| One decode rank fails | Stop scheduling the affected model group; recover its collective state before reuse |
| Commit acknowledgement is lost | Query the authoritative state; don't infer “not committed” from timeout |
| Decode dies after visible output | Surface a stream error unless explicit resume semantics exist |
| Client cancels | Stop new work, fence output, drain accesses, and release each owner's resources idempotently |

Retaining source KV briefly after commit can make retransmission cheaper, but consumes prefill memory. The retained copy needs its own accounted capacity and expiry. Never release a source buffer while a transport may still read it. NIXL's remote-agent invalidation helps manage disappearing peers, but the application still has to coordinate safe buffer lifetime.[^nixl2026architecture]

## Measure the critical path, not a sum of unrelated percentiles

For TTFT, measure elapsed time between request arrival and first-token emission. Joined spans help explain that elapsed time. Without overlap, complete edge, routing, queue, prefill, handoff, and first-token terms can add up to it. With overlap, follow dependencies and waits. Don't count prefill again inside a handoff term that already includes it. The union of active spans can miss uninstrumented queueing gaps, so it can't replace endpoint timing.

Consider a request whose prefill runs from 0 to 310 ms. Its KV transfer either starts afterward or starts at 240 ms, overlapping the last 70 ms of prefill by streaming finished layers while later layers still compute. Commit plus the first decode step takes 28 ms once both prefill and transfer have finished.

<!-- leetllm: test, output=show, id=critical-path -->
```python title="handoff-critical-path.py"
prefill_end = 310.0
transfer_ms = 2_684_354_560 / 25e9 * 1000
commit_and_first_token = 28.0
for transfer_start in (310.0, 240.0):
    ready = max(prefill_end, transfer_start + transfer_ms)
    first_token = ready + commit_and_first_token
    print(f"transfer starts {transfer_start:.0f} ms: first token at {first_token:.1f} ms")
assert abs((310 + transfer_ms + 28) - (240 + transfer_ms + 28) - 70) < 1e-9

# Same overlapped work, shifted by an otherwise uninstrumented 25 ms queue.
request_start = 0.0
prefill_start = 25.0
prefill_end = prefill_start + 310.0
transfer_start = prefill_end - 70.0
first_token = max(prefill_end, transfer_start + transfer_ms) + 28.0
ttft = first_token - request_start
active_union = first_token - prefill_start  # these active intervals overlap
assert abs(ttft - active_union - 25.0) < 1e-9
print(f"with 25 ms queue: TTFT {ttft:.1f} ms; active-span union {active_union:.1f} ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
transfer starts 310 ms: first token at 445.4 ms
transfer starts 240 ms: first token at 375.4 ms
with 25 ms queue: TTFT 400.4 ms; active-span union 375.4 ms
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/handoff_overlap_dark.png" alt="Three timelines share the same 0 to 500 millisecond scale. Serial prefill runs 0 to 310, transfer 310 to 417.3741824, and commit plus first token ends at 445.3741824. Starting transfer at 240 leaves prefill unchanged and moves first token to 375.3741824, saving 70 milliseconds. Shifting that same overlapped work after a 25 millisecond queue produces 400.3741824 milliseconds of TTFT while its active-span union remains 375.3741824. Dependency arrows join both prefill and transfer completion before commit." />
  <figcaption>All three schedules share one 0 to 500 ms scale. Commit plus the first token waits for both prefill and transfer, so overlapping transfer at 240 ms saves 70 ms (375.4 ms vs. 445.4 ms). Adding a 25 ms queue raises TTFT to 400.4 ms while the active-span union stays 375.4 ms, showing why endpoint timing must anchor TTFT.</figcaption>
</figure>

Phase p99 values don't generally add to end-to-end p99. The slowest prefill and slowest transfer may belong to different requests. Compute end-to-end quantiles from joined request traces, and keep request IDs in traces rather than unbounded metric labels.

| Signal | Denominator or unit | Question it answers |
|---|---|---|
| Transfer payload rate | Unique completed payload bytes / transfer duration | How quickly did useful KV arrive? |
| Fabric bytes | Bytes crossing the measured link | Did retries, replication, or protocol overhead add traffic? |
| Quarantined KV | Bytes retired but not yet safe to reuse | Is cancellation or cleanup reducing capacity? |
| Wasted prefill | Prefill tokens for requests that never commit / all prefill tokens | Is backpressure applied too late or handoff unreliable? |
| TTFT and decode attainment | Successful requests meeting each target / offered requests | How much offered work meets the user-facing objectives? |
| Rejection and error rate | Rejected or failed requests / offered requests | Is apparently good latency hiding dropped work? |

A host staging copy increases memory-system traffic; its effect on network wire bytes depends on the transfer path. Specify where every byte counter is measured. Likewise, reduced handoff bandwidth may raise TTFT while steady-state inter-token latency (ITL) stays similar, but shared-fabric contention can also slow collectives and hurt ITL. Compare stage timings and fabric counters to identify the cause.

Compare a mixed pool and a split pool under the same offered workload, output lengths, hardware budget, and SLO definitions. Report goodput, rejection, errors, and tail latency together. A service that rejects almost everything can have excellent latency for the few requests it accepts. This prompt's handoff has a size you can compute, an expired buffer stays charged until writes stop, and unrelated phase percentiles don't fold into one TTFT number.

## Try a changed workload

### Follow-up questions

```checkpoint
Prefill can finish 40 of these 8K requests per second, but all KV transfers share an effective 25 GB/s path. Can the transfer queue remain stable at that arrival rate?
---
Each request moves $2{,}684{,}354{,}560\,\text{bytes}$, so $40\,\text{requests/s}$ demands about $107.4\,\text{GB/s}$. Even before other overhead, the $25\,\text{GB/s}$ path supports only about $9.31\,\text{transfers/s}$. A finite queue can absorb a short burst, not this sustained mismatch. Backpressure must slow or reject work, or the system needs less transferred state or more independent bandwidth. Faster prefill alone doesn't resolve it.
```

```checkpoint
The prompt grows from 8,192 to 8,193 tokens while the 128-position output budget stays fixed. How much additional KV capacity does the 16-token block allocator reserve?
---
The total grows from $8{,}320$ positions, exactly $520$ blocks, to $8{,}321$ positions, which requires $521$ blocks. One model-wide block is $16 \times 320\,\text{KiB} = 5\,\text{MiB}$. Reserved capacity rises from $2{,}600$ to $2{,}605\,\text{MiB}$, although the additional real token contains only $320\,\text{KiB}$ of KV. The allocation bound and logical payload bound serve different purposes.
```

### Evaluation rubric

- Calculate both logical KV payload and rounded allocation; distinguish aggregate link capacity from each stream's requested rate.
- Trace a timed-out attempt through fencing, late writes, quiescence, and reclamation without returning its byte credit early.
- Explain which guarantees the local model checks and which require actual connector, GPU, and coordinator evidence.

```mastery-quiz
[
  {
    "question": "Two ranks contribute [3,7] and [20,40]. Which output is a sum all-reduce?",
    "options": [
      "[23,47] on both ranks",
      "[3,7,20,40] on both ranks",
      "[23] on rank 0 and [47] on rank 1",
      "[3,7] on rank 0 and [20,40] on rank 1"
    ],
    "answer": "[23,47] on both ranks",
    "explanation": "All-reduce sums matching indices and gives the whole vector to every rank. Concatenation is all-gather; partitioned sums are reduce-scatter."
  },
  {
    "question": "At layer 11, two ranks use one communicator for equal-sized FP16 sum reductions. Rank 0 will issue buffer 4 for request Pine, then buffer 7 for Ash. On rank 1, buffer 9 for Pine arrived first, then 4 for Elm, then 7 for Ash. Which buffers should rank 1 issue in those two slots?",
    "options": [
      "Buffer 4, then buffer 7",
      "Buffer 9, then buffer 7",
      "Buffer 9, then buffer 4",
      "Buffer 7, then buffer 9"
    ],
    "answer": "Buffer 9, then buffer 7",
    "explanation": "The first sum needs Pine on both ranks, so rank 1 uses buffer 9. The second needs Ash, in buffer 7. Copying rank 0's buffer numbers puts Elm in the first sum. Following local arrival order puts Elm in the second. Issuing Ash before Pine mixes the two requests in both sums."
  },
  {
    "question": "A prompt holds 4,096 tokens at 256 KiB of KV per token across the model. Under ideal four-way sharding, what is the total prompt payload, and how much does each rank send?",
    "options": [
      "1 GiB total and 256 MiB per rank",
      "1 GiB total and 1 GiB per rank",
      "4 GiB total and 1 GiB per rank",
      "256 MiB total and 256 MiB per rank"
    ],
    "answer": "1 GiB total and 256 MiB per rank",
    "explanation": "4,096 × 256 KiB gives 1,024 MiB, or 1 GiB, for the whole prompt. Each rank sends a quarter, or 256 MiB. Sending 1 GiB from each rank would replicate the prompt. A 4 GiB total counts the prompt four times. A 256 MiB total counts just one shard."
  },
  {
    "question": "Two 500 MiB shards share one aggregate 10 GB/s bottleneck. What ideal combined transfer time follows before overhead?",
    "options": [
      "About 52 ms",
      "About 105 ms",
      "About 210 ms",
      "About 1000 ms"
    ],
    "answer": "About 105 ms",
    "explanation": "1000 MiB is 1,048,576,000 bytes. Dividing by 10 billion bytes/second gives 104.86 milliseconds. Each stream cannot independently claim the full shared rate."
  },
  {
    "question": "A destination has 100 free KV blocks. A request needs 90 prompt blocks and a reservation of 16 future output blocks. Which scheduling decision follows?",
    "options": [
      "Wait or reject; the full reservation needs 106 blocks.",
      "Accept; the 90 prompt blocks fit before generation starts.",
      "Accept; future output KV is already included in the transfer.",
      "Wait; output reservation doubles the 90 prompt blocks."
    ],
    "answer": "Wait or reject; the full reservation needs 106 blocks.",
    "explanation": "Reserve the requested prompt plus future output capacity before exceeding the budget. The total is 106, so prompt-only accounting hides the shortage."
  },
  {
    "question": "A lease expires while a remote KV write may still be in flight. When may the allocator reuse its destination buffer?",
    "options": [
      "As soon as the router increments the attempt number",
      "When a new request needs the same amount of capacity",
      "After retirement and confirmation that all accesses stopped",
      "Once enough blocks arrived to compute the first token"
    ],
    "answer": "After retirement and confirmation that all accesses stopped",
    "explanation": "Fencing prevents logical commit, not physical writes. Keep the buffer charged and quarantined until the transport and any GPU readers are quiescent."
  },
  {
    "question": "A receiver expects 96 logical blocks on each of four ranks. It gets 384 notifications, including one repeated rank-block pair. Is complete coverage established?",
    "options": [
      "Yes; 384 notifications equal the expected total.",
      "Yes; notification order makes duplicate arrival harmless.",
      "No; complete unique rank-and-block coverage is still required.",
      "No; all four ranks must use the same physical addresses."
    ],
    "answer": "No; complete unique rank-and-block coverage is still required.",
    "explanation": "The expected set has 384 unique pairs. A duplicate can hide a missing pair even when notification counts agree. Physical addresses need not match across workers."
  },
  {
    "question": "The router sends attempt 6 to decoder North and times out waiting for its commit reply. The sender reports a complete KV copy, and the client has seen no token. Which rule should guide the router's decision about stream ownership?",
    "options": [
      "Recognize North as owner if the sender's copy confirmation covers every block for attempt 6.",
      "Assign South if the router's reply log has no commit entry for attempt 6.",
      "Recognize North as owner if the coordinator's record shows that attempt 6 committed there.",
      "Assign South if the client's delivery log has no token from attempt 6."
    ],
    "answer": "Recognize North as owner if the coordinator's record shows that attempt 6 committed there.",
    "explanation": "Commit grants ownership. Read the coordinator's record for this attempt. A complete copy can still be waiting for commit. North may also have committed before its reply was lost or before its first token reached the client. Starting South in that case would give the request two owners."
  },
  {
    "question": "In a CPU test, a canceled transfer still holds all 12 MiB in a pool. No reader has started. The test calls reclaim, supplies a simulated writer-stop callback, then calls reclaim twice more. The pool reports 0, 0, 12 and 12 MiB free after those four events, respectively. Which claim does the run establish?",
    "options": [
      "Reclaim returned the credit once, on the first call after the callback.",
      "The callback returned the credit, and the next reclaim call read the new balance.",
      "The callback confirmed that the connector had finished its last physical write.",
      "Two reclaim calls racing on separate workers would also return the credit once."
    ],
    "answer": "Reclaim returned the credit once, on the first call after the callback.",
    "explanation": "The pool still had 0 MiB free after the callback. The next reclaim raised the balance to 12 MiB, and the repeat left it there. The test invoked the stop callback itself. Checking when physical writes stop needs connector status checks, and checking cleanup on racing workers needs a concurrency test."
  },
  {
    "question": "A request arrives at 0 ms, its first active span starts at 20 ms, and its first token appears at 95 ms. Which record supports end-to-end TTFT analysis?",
    "options": [
      "TTFT 95 ms; retain request endpoints and the 20 ms wait.",
      "TTFT 75 ms; exclude waiting before the first active span.",
      "TTFT 20 ms; report the gap before active work alone.",
      "TTFT 115 ms; add the waiting gap to the first-token timestamp."
    ],
    "answer": "TTFT 95 ms; retain request endpoints and the 20 ms wait.",
    "explanation": "End-to-end elapsed time is 95 - 0 = 95 milliseconds. The active-span duration (75 ms) omits queueing. Compute end-to-end quantiles from joined request endpoints rather than adding phase quantiles."
  }
]
```

> **Next:** Continue to [Accelerator Architecture Field Guide](/learn/accelerator-architecture-field-guide).
