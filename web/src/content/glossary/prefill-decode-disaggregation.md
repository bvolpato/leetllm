---
title: Prefill-decode disaggregation
importance: 72
kind: term
---
**Prefill-decode disaggregation** runs prompt processing and autoregressive token generation on separate worker pools. Prefill workers process many prompt tokens in parallel; decode workers repeatedly produce small token steps.

## Why split them

Prefill is compute-heavy and favors large token batches. Decode is often memory- and synchronization-sensitive and favors predictable inter-token latency. Mixing long prefills with decode on same GPU can create contention even with chunked prefill.

Disaggregation adds KV-transfer, routing, capacity-planning, and failure-recovery complexity. The workers must agree on model weights, adapters, prompt tokens and positions, and KV-cache representation; a cache is portable only across compatible states. End-to-end gain depends on workload and transfer path, so measure completed requests or trajectories, TTFT, TPOT, queue time, and KV-transfer time together.

The target is often **goodput**, requests completed within both latency budgets. Raw tokens per second measures a different objective. [DistServe](https://arxiv.org/abs/2401.09670) optimizes that distinction; current [vLLM documentation](https://docs.vllm.ai/en/stable/features/disagg_prefill/) describes independent latency tuning and notes that its disaggregated-prefill feature alone leaves throughput unchanged.


## Example

For a model and deployment that support the required context length, a prefill worker processes a 100K-token agent history and transfers the resulting KV state. A compatible decode worker continues from that state one token step at a time. Some implementations also produce the first output token on the prefill worker, so the handoff must preserve its token and generation state.

## Why it matters here

Long multi-turn histories can interfere with active decode on colocated engines. P/D separation is high-value experiment only when KV transfer and pool balance preserve end-to-end goodput.

## Related terms

- [Prefill](glossary://prefill)
- [Decode phase](glossary://decode-phase)
- [vLLM Router](glossary://vllm-router)
- [KV cache](glossary://kv-cache)
- [TPOT](glossary://tpot)
