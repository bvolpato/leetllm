---
title: Static batching
importance: 72
kind: code
---
**Static batching** groups a fixed set of requests, runs that set together, and keeps batch membership unchanged until the batch completes. In autoregressive LLM serving, every active row advances through decode steps while finished rows become idle or padded until the longest generation ends. The next waiting request can't take an empty slot inside the running batch.

The server can choose batch size dynamically at admission. It may wait a few milliseconds to collect arrivals, then keep that group fixed while it runs. [Continuous batching](glossary://continuous-batching), also called iteration-level scheduling, admits and removes sequences between decoding iterations.

## Why variable output lengths waste slots

Suppose batch $B$ contains output lengths $T_1,\ldots,T_B$. A simplified decode-slot utilization is:

$$
\eta_{\text{slots}}
= \frac{\sum_{i=1}^{B} T_i}
{B \cdot \max_i T_i}
$$

For lengths $[10, 20, 100, 500]$:

$$
\eta_{\text{slots}} = \frac{630}{4 \cdot 500} = 31.5\%
$$

The ratio measures decode-slot occupancy. GPU FLOP utilization also depends on prefill cost, attention length, kernel shape, padding, and memory traffic. This example isolates one scheduling loss: $1{,}370$ of $2{,}000$ possible sequence-step slots do no useful decode work after shorter requests finish.

## Lifecycle

1. **Collect:** wait until target batch size or queueing timeout.
2. **Pad/prefill:** align prompt tensors and process the batch.
3. **Decode:** run one next-token step for every unfinished sequence.
4. **Hold membership:** finished rows stay unavailable to queued work.
5. **Release:** only after the longest request stops does the whole batch retire.

Static batching is easy to implement, benchmark, and reason about. It can work well for offline jobs with bucketed lengths, fixed output sizes, or synchronized workloads. It is usually a poor fit for interactive traffic with bursty arrivals and highly variable generations.


## Example

**See the scheduling loss.**

```python
lengths = [10, 20, 100, 500]
batch_size = len(lengths)
steps = max(lengths)

useful = sum(lengths)
available = batch_size * steps
utilization = useful / available

print({
    "useful_sequence_steps": useful,
    "available_sequence_steps": available,
    "slot_utilization": utilization,
})
# {'useful_sequence_steps': 630,
#  'available_sequence_steps': 2000,
#  'slot_utilization': 0.315}
```

Length bucketing improves this baseline. Group requests with similar prompt and output budgets so $\max T_i$ is closer to the other $T_i$. Bucketing still can't reclaim a slot early, and output length is only partly predictable before decoding.

## Static versus continuous

| Property | Static batch | Continuous batch |
| --- | --- | --- |
| Membership | Fixed until all requests finish | Changes between iterations |
| Scheduler frequency | Per batch | Per token iteration or scheduling step |
| Finished slot | Idle until batch ends | Refilled with waiting work |
| Implementation | Simpler | More scheduler and KV bookkeeping |
| Best fit | Offline, uniform lengths | Interactive, variable lengths |

[Orca's iteration-level scheduling](https://www.usenix.org/conference/osdi22/presentation/yu) showed why request-level batching leaves throughput on the table for generative models. Modern serving engines combine iteration-level scheduling with [KV cache](glossary://kv-cache) block management so each sequence can grow, finish, pause, or be preempted independently.

## Operational trade-offs

- **Queue delay:** waiting to fill a batch improves kernel size but hurts TTFT at low traffic.
- **Head-of-line blocking:** one long sequence delays release of every slot.
- **Padding:** prompt length differences waste prefill work unless requests are bucketed or attention kernels avoid padding work.
- **Memory reservation:** batch-wide max lengths can reserve more KV/activation memory than short requests use.
- **Predictability:** fixed membership makes capacity tests and deterministic offline pipelines easier.

Measure throughput and latency together: requests/s, input/output tokens/s, queue delay, TTFT, TPOT, batch fill ratio, and idle sequence slots. A high nominal batch size with low useful-slot utilization is not high effective batching.

## Why it matters here

Static batching is the baseline that makes [continuous batching](glossary://continuous-batching) intuitive. The model math is unchanged; scheduler granularity changes. Once generated lengths vary, fixed request groups turn finished work into idle GPU slots, so serving systems schedule at finer boundaries.

## Related terms

- [Continuous batching](glossary://continuous-batching)
- [Inference scheduler](glossary://inference-scheduler)
- [KV cache](glossary://kv-cache)
- [Decode phase](glossary://decode-phase)
- [Prefill](glossary://prefill)
- [TTFT](glossary://ttft)
- [TPOT](glossary://tpot)
