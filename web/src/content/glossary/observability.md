---
title: Observability
importance: 82
---
**Observability** is the ability to infer a system's internal state from the telemetry it emits, so you can answer novel questions about behavior without adding new instrumentation for each incident. Rudolf Kalman introduced the idea in control theory: a dynamical system is observable if its outputs over a finite interval uniquely determine its state. In software, the "outputs" are signals such as metrics, logs, traces, and structured events; the "state" is whatever you need after a failure (which model route ran, what was retrieved, which policy fired, where time went, and why the user saw that answer).

OpenTelemetry's primer frames the practical test: existing telemetry should help engineers answer new questions during an incident. When a class of production issues requires new logging before it can be debugged, the system has an observability gap. Monitoring tells you *that* something is wrong (rates, percentiles, alerts). Observability is what lets you start from an alert or a user report and reconstruct *why this request* failed.

## Intuition

A traditional service fails with timeouts, 5xx, and saturated queues. An AI product can look "healthy" on those signals while still serving wrong answers, stale evidence, skipped safety gates, or silent provider fallbacks. Reliable behavior also depends on answer quality, evidence freshness, policy execution, and provider routing.

Observability depends on emitted evidence. If two internal paths produce the same external response shape and coarse metrics, operators cannot distinguish them later. Telemetry must make important internal decisions identifiable without dumping secrets into long-lived stores.

| Signal | Answers | Weak alone when... |
|---|---|---|
| **Metrics** | Is the fleet healthy *now*? Trends and SLOs | You need one request's story |
| **Logs / events** | What happened at a point in time? | Events lack correlation IDs |
| **Traces** | How did *this* request flow and where did time go? | Spans omit product semantics (route, evidence, gate) |
| **Product/quality events** | Did we serve a correct, safe, grounded outcome? | You only track infrastructure latency |

Observability depends on signals joined by stable IDs and meaningful attributes so operators can explain behavior. Three dashboards full of unlinked counters still leave you guessing.

## How it works

### 1. Instrument the request path

Name every hop that can change latency, cost, or correctness: gateway, auth, routing, retrieval, rerank, prompt pack, model call, tools, safety, stream. Attach one **trace ID** / **request ID** that propagates across queues, workers, and provider callbacks. Missing context at an async boundary is a common production hole.

### 2. Emit the three classic signals plus AI semantics

| Signal | Role in AI systems |
|---|---|
| Metrics | Traffic, error rate, [p95 latency](glossary://p95-latency), [TTFT](glossary://ttft), tokens/s, queue depth, cache hit rate, unsafe-serve rate |
| Logs / structured events | Discrete decisions: route chosen, gate deny, tool error class, abstention reason |
| Traces / spans | Nested timeline of one request with durations and attributes |

OpenTelemetry GenAI semantic conventions standardize many attributes (for example `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`). Prefer stable, bounded fields over free-text dumps.

GenAI conventions are still marked Development; pin the convention version and instrumentation behavior because these fields can change. A correctly enforced policy block can be the expected outcome. Define product failure separately from deliberate denial.

### 3. Cover the golden signals, then product outcomes

Google SRE's four golden signals for user-facing systems are **latency**, **traffic**, **errors**, and **saturation**. For LLM paths, map them carefully:

| Golden signal | LLM-oriented measures |
|---|---|
| Latency | End-to-end, TTFT, ITL/TPOT, retrieval span, tool span (success vs error latency separately) |
| Traffic | Requests/s, concurrent generations, input/output tokens/s |
| Errors | Transport failures *and* product failures: empty retrieval, schema invalid, policy block, unsafe claim served |
| Saturation | GPU/KV cache occupancy, queue wait, provider quota, worker pool fullness |

A fifth class matters for AI: **outcome quality**. Rate of grounded answers, abstentions, judge failures on a slice, or escape of a known bad claim can all stay invisible if you only watch 5xx.

### 4. Join signals for diagnosis

A useful loop is:

1. Metric or SLO fires (symptom).
2. Open an exemplar trace or event for a failing request ID.
3. Walk spans in path order until the first wrong or slow hop.
4. Confirm with logs for policy text, error class, or version pins.
5. Fix the owner of that hop; re-check the same metric slice after deploy.

## Example

Developer-assistant request `req_8841` (tenant `acme`, route `rag-runbook-v3`) returns a confident but obsolete deployment-approval rule. Infrastructure looks fine: error rate $0.02\%$, p95 end-to-end $1.1\,\mathrm{s}$, GPU utilization $55\%$.

Trace spans for `req_8841`:

| Span | Duration | Key attributes |
|---|---:|---|
| `gateway.auth` | $12\,\mathrm{ms}$ | `tenant=acme` |
| `retrieve.hybrid` | $210\,\mathrm{ms}$ | `top_k=8`, doc IDs include `deploy_policy_v1` |
| `rerank` | $95\,\mathrm{ms}$ | dropped `deploy_policy_v3` |
| `gen_ai.chat` | $780\,\mathrm{ms}$ TTFT $420\,\mathrm{ms}$ | `model=docs-large`, in $1{,}240$ / out $180$ tokens |
| `policy.serve_gate` | $8\,\mathrm{ms}$ | `decision=serve` |

Joined events show `prompt_template_id=runbook-v4`, `index_build=2025-06-01`, and `first_failed_stage=rerank` (stale guidance ranked above the current policy). Without document IDs and template version on the trace, the team would have retuned the model. With them, the fix is reranker features or index freshness, not another fine-tune.

In this hypothetical example, aggregate the same fields over a 15-minute window of $N=6{,}000$ requests. If a later audit finds $n_{\mathrm{unsafe}}=18$ served answers violated the claim-gate policy:

$$
\hat{p}_{\mathrm{unsafe}} = \frac{n_{\mathrm{unsafe}}}{N} = \frac{18}{6000} = 0.003 = 0.3\%.
$$

Page on $\hat{p}_{\mathrm{unsafe}}$ (and burn rate against an [SLO](glossary://slo)) even when latency and 5xx stay green. Attach exemplars so on-call opens `req_8841`-style traces instead of staring at a lone percentage.

```text
# Minimal join keys every hop should carry
request_id, trace_id, tenant_id, route, model_id,
prompt_template_id, index_version, cache_status,
input_tokens, output_tokens, first_failed_stage, final_status
```

## Semantic telemetry (what to keep)

Prefer **identifiers and shapes** over raw private content in long-lived systems:

- **Versions:** app build, prompt template, index build, safety policy, model id / checkpoint
- **Path facts:** route, provider, retriever name, tool names, cache hit/miss, retry count
- **Sizes:** prompt tokens, completion tokens, retrieved doc count, context char budget used
- **Outcomes:** status, error class, gate decision, abstention reason, judge score bucket
- **Timing:** queue wait, retrieval, prefill/TTFT, decode/TPOT, tool wall time

Treat full prompts, retrieved text, and tool payloads as sensitive. Redact, hash, sample, or put them behind short retention and strict access. High-cardinality labels (user id, raw prompt hash, full exception strings) on metrics backends explode cost; put those details in traces or events with retention policy, not on every Prometheus series.

## Debug path

When production hurts:

1. **Name the symptom.** Slow (TTFT vs total), wrong answer, empty answer, blocked, cost spike, or safety escape.
2. **Confirm with aggregates.** Slice by route, model, tenant, cache class, region, deploy version.
3. **Pick one exemplar** request ID from the bad slice.
4. **Walk the [request path](glossary://request-path)** spans in order; stop at the first hop that is slow, empty, or policy-wrong.
5. **Check versions** on that hop (prompt, index, model, feature flags). Many "model regressions" are template or corpus deploys.
6. **Close the loop.** Add any missing attribute that forced guesswork; that missing field *was* the observability bug.

If a hop has no timing and no IDs, you cannot attribute ownership. Fix instrumentation before arguing about algorithms.

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Full prompt/content capture | Fast content debugging | Privacy risk, storage cost, legal exposure |
| Metrics only | Cheap SLO dashboards | Cannot explain single-request quality |
| Traces on 100% traffic | Complete exemplars | Backend cost; sample intelligently under load |
| Huge metric label sets | Fine-grained charts | Cardinality blow-ups, slow queries |
| Quality metrics from judges | Outcome signal beyond 5xx | Judge noise, cost, need stable eval definitions |

Good systems bias toward **high coverage of structured metadata**, **careful sampling of bulky content**, and **alerts that link to exemplars**.

## Why it matters here

LeetLLM production and agent material assumes systems fail in ways dashboards do not name by default: retrieval skew, prompt drift, tool loops, silent fallbacks, and safety gate escapes. Observability is the skill of making those paths reconstructible from telemetry so you can set SLOs, run incidents, and improve the product without flying blind after launch.

## Related terms

- [OpenTelemetry](glossary://opentelemetry)
- [Tracing](glossary://tracing)
- [SLO](glossary://slo)
- [Request path](glossary://request-path)
- [Prometheus](glossary://prometheus)
