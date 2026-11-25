---
{
  "id": "observability-monitoring-llm-systems",
  "title": "LLM Observability & Monitoring",
  "slug": "observability-monitoring-llm-systems",
  "category": "MLOps & Deployment",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/observability_dark.png",
  "companies": [
    "Google",
    "OpenAI",
    "Meta",
    "Amazon"
  ],
  "shortDescription": "Six responses return HTTP 200 and still include two false deployment approvals. Latency, cost, and traces matter only once that failure is visible.",
  "keyConceptsTested": [
    "Monitoring aggregates versus request-level observability",
    "Serving-gate quality metrics, failure-stage attribution, and missed guardrails",
    "Time to first token and post-first-token throughput",
    "Trace attributes and OpenTelemetry GenAI conventions",
    "Versioned cost attribution",
    "Data minimization and durable debugging evidence",
    "Alert policies, agent budgets, canary digests, and experiment handoff"
  ],
  "section": "GPU Systems & LLM Inference",
  "order": 22,
  "aliases": [
    "advanced-mlops-devops-ai",
    "model-versioning-continuous-deployment"
  ]
}
---
<!-- leetllm: edition:reference:start -->
Every systems dashboard is green: all six deployment-assistant responses returned `200 OK`, first-token latency stayed below 500 ms, and spend stayed on budget. Yet two answers told engineers they were cleared to deploy when no approval existed. Standard HTTP monitoring sees fast text generation rather than an implicit error returned with a 200 status.[^sreMonitoringDistributedSystems]

Population monitoring tracks rates over windows so you spot shifts quickly; request-level <span data-glossary="observability">observability</span> preserves parent-child <span data-glossary="tracing">trace</span> trees and exact version digests so you isolate why an unsafe reply slipped past guardrails.

<figure>
  <img src="illustrations/_generated/observability_dark.png" alt="Six reviewed requests share a 0 to 500 ms first-visible-token axis. All return HTTP 200; nearest-rank p95 is 240 ms under the 500 ms warning line. One safe answer, three abstentions, and two unsafe served answers yield 2/6 unsafe reviewed requests and 2/3 unsafe served answers." />
  <figcaption>The two unsafe delivered responses (`trace-05`, `trace-06`) sit well below 500 ms with HTTP 200. Denominator separation distinguishes request-level incidence (2/6) from user-facing risk among delivered answers (2/3).</figcaption>
</figure>

## Emit containment and outcome fields at the serving gate

Log what left the serving boundary beside what an independent check later verified. Counting a guardrail's own `serve` or `abstain` routes reports self-assessment alone; measuring real safety requires recording whether substantive text reached the user (`substantive_output_served`) and joining an independent verdict (`unsafe_claim_served`: `True`, `False`, or `None` pending) back by `request_id`.

| Field | Purpose |
| :--- | :--- |
| `route` / `substantive_output_served` | Separates delivered payloads from deliberate abstentions |
| `unsafe_claim_served` | Tri-state independent verdict (`True`, `False`, `None` unreviewed) |
| `first_failed_stage` / `escape_stage` | Separates retrieval/generation bugs from missed serving guardrails |
| `evidence_version`, `prompt_id`, `gate_version` | Pins reproducible artifacts for replay |

Never default `None` to safe when reviews lag traffic. Update existing request rows in place when delayed reviews arrive, and reconcile terminal events against an independent ingress counter so dropped collector batches show up as missing coverage.

## Turn request evidence into quality metrics

Across `trace-01` through `trace-06`, `deploy-answerer-v1` delivers one grounded answer (`trace-01`) and withholds three defective or context-missing drafts (`trace-02`..`04`), while `deploy-answerer-v1.1-regression` delivers fabricated approvals on `trace-05` and `trace-06`. Thus `2/6` (`33.3%`) of reviewed requests leaked an unsafe answer, whereas `2/3` (`66.7%`) of users who received a substantive reply got false advice. Pair zero-violation windows with sample size `N` and a 95% Wilson score bound (`(0.0000, 0.0713)` for 0/50), and remember confirmed abstentions cannot leak unsafe claims when computing attainable bounds over unreviewed traces.

## Keep the golden signals and explain LLM latency

Keep latency, traffic, errors, and saturation alongside prompt/output token lengths, queue wait, and [KV-cache pressure](/learn/kv-cache-paged-attention-llm-serving). Measure `ttft_ms` and post-first-token throughput from one monotonic clock:

$$
\text{post-first-token throughput} = \frac{\text{output\_tokens} - 1}{(\text{total\_ms} - \text{ttft\_ms}) / 1000}
$$

Omit later-token throughput on single-token replies, never divide visible-token windows by billed totals containing hidden reasoning tokens, and attach sample size `N` to nearest-rank percentiles (`p95 = 240 ms` over six calls simply picks the slowest call).[^pope2023]

<!-- leetllm: test, id=obs-quality-metrics, deps=numpy,scipy, output=show, output_title="Denominators, Wilson CI, streaming throughput, and rate-card validation" -->
```python title="window_telemetry.py"
import numpy as np
from scipy.stats import binomtest

# (id, served, unsafe, ttft_ms, total_ms, in_tok, cached_tok, out_tok)
window = [
    ("trace-01", True, False, 172, 340, 180, 60, 22),
    ("trace-02", False, False, 181, 210, 175, 50, 8),
    ("trace-03", False, False, 188, 225, 190, 60, 10),
    ("trace-04", False, False, 205, 240, 160, 0, 9),
    ("trace-05", True, True, 218, 412, 198, 80, 29),
    ("trace-06", True, True, 240, 455, 201, 80, 30),
]

reviewed = [r for r in window if r[2] is not None]
served = [r for r in reviewed if r[1]]
unsafe = [r for r in reviewed if r[2]]
p95 = float(np.percentile([r[3] for r in window], 95, method="nearest"))
_, _, _, ttft, tot, inp, cached, out = window[-1]
assert 0 <= cached <= inp and out >= 0
tps = (out - 1) / ((tot - ttft) / 1000.0)
cost = ((inp - cached) * 1.0 + cached * 0.10 + out * 5.0) / 1_000_000.0
ci = binomtest(k=0, n=50).proportion_ci(confidence_level=0.95, method="wilson")

print(f"reviewed={len(unsafe)}/{len(reviewed)} ({len(unsafe)/len(reviewed):.1%}) | served_risk={len(unsafe)}/{len(served)} ({len(unsafe)/len(served):.1%})")
print(f"p95_ttft_ms={p95:.0f} | t6_post_tps={tps:.1f} | t6_cost=${cost:.6f} | wilson_0_50=({ci.low:.4f}, {ci.high:.4f})")
```

<!-- leetllm: output:start -->
```text title="Denominators, Wilson CI, streaming throughput, and rate-card validation" output compact
reviewed=2/6 (33.3%) | served_risk=2/3 (66.7%)
p95_ttft_ms=240 | t6_post_tps=134.9 | t6_cost=$0.000279 | wilson_0_50=(0.0000, 0.0713)
```
<!-- leetllm: output:end -->

## Follow request execution with distinct spans

Under W3C Trace Context and OpenTelemetry GenAI conventions, one request shares a `trace_id`, while retrieval, model calls, tools, and serving guardrails emit distinct `span_id` records linked via `parent_span_id`.[^w3cTraceContext2021][^otelgenaispans2026] Propagating the caller's exact `span_id` across queues preserves parentage even when two tool calls share the name `lookup`.

<figure>
  <img src="illustrations/_generated/request_span_tree_dark.png" alt="Request trace-05 is span 0, deploy-answer.request. Three sibling spans share parent_id 0: span 1 retrieval deploy-policy with evidence version deploy-policy@v17, span 2 chat deploy-assistant-prod marking first failure stage claim_generation, and span 3 serving_gate recording unsafe_claim_served=true and escape_stage=serving_gate." />
  <figcaption>A three-child span tree separates where the bad draft started (`claim_generation`) from where the guardrail failed to block it (`serving_gate`).</figcaption>
</figure>

## Keep standard telemetry and product decisions together

Pin OpenTelemetry GenAI schema versions while conventions evolve.[^otelgenai2026][^otelgenaiRegistry2026] Combine standard fields (`gen_ai.operation.name`, `gen_ai.request.model`) with application decision tags (`platform.evidence.version`, `platform.failure.stage`, `platform.failure.escape_stage`). Keep metric labels low-cardinality (version, operation, route) and keep high-cardinality `request_id` values on trace spans and exemplars.[^otelgenaimetrics2026]

## Attribute cost with a versioned rate card

Store raw disjoint token counters (`input_tokens`, `cached_input_tokens`, `output_tokens`) separately from named rate cards (`$1.00 / $0.10 / $5.00` per million) so price changes never rewrite history. Reject impossible telemetry like `cached_input > input_tokens` loudly rather than clamping bugs silently. See [LLM cost engineering](/learn/llm-cost-engineering-token-economics) for billing allocation.

## Store durable debugging evidence without operator text

Retain only registered IDs, release digests, route verdicts, latencies, and token counts long-term; keep raw prompt/completion capture opt-in with tight expiry.[^otelsensitivedata2026] Enforce trusted metadata boundaries everywhere: an allowlisted exporter strips `operator_note`, yet any log writer copying an unvalidated `event.request_id` leaks private text stuffed into that field unless IDs come from a trusted registry.

## Alert on decisions engineers can act on

Include exemplar IDs (`trace-05`), version tags, and failure stages directly in alerts, and evaluate telemetry channels independently. If latency emits `NaN` or usage accounting fails during an incident, emit the confirmed safety page first and report explicit `UNKNOWN` operational channels beside it.

## Root-cause triage: from metric anomalies to span exemplars

Verify both `2/6` reviewed risk and `2/3` conditional delivered risk, slice by version, and open exemplar `trace-05`. Slicing proves both `v1` and `v1.1-regression` drafted hallucinations, yet only `v1.1-regression` let `trace-05` and `trace-06` pass the serving boundary. Span 2 (`claim_generation`) and span 3 (`serving_gate`) point straight to the template and guardrail diff.

<figure>
  <img src="illustrations/_generated/observability_metrics_triage_dark.png" alt="Four requests share claim_generation failures. Traces trace-02 and trace-03 are caught and withheld by deploy-answerer-v1, whereas trace-05 and trace-06 pass through serving_gate to operators under deploy-answerer-v1.1-regression." />
  <figcaption>Version slicing isolates upstream generation defects from a serving-guardrail regression.</figcaption>
</figure>

## Distributed tracing in multi-agent trajectories and tool loops

When each agent turn appends `growth` tokens to prior history starting at `start`, cumulative input tokens grow quadratically: $N \cdot s + g \cdot \frac{N(N - 1)}{2}$. Enforce three independent admission guards before every tool call: a consecutive identical-state repeat cap (resetting when a progress marker advances), a wall-clock deadline, and a pre-dispatch spend reservation check.

<figure>
  <img src="illustrations/_generated/agent_trace_state_loop_dark.png" alt="Two polling paths share tool lookup_deploy_status and operation-42. The top path returns marker scan:v17 three consecutive times, hitting the repeat limit and stopping for review. The bottom path resets its repeat counter when poll 3 advances to scan:v18 while remaining subject to a separate elapsed-time deadline." />
  <figcaption>Consecutive repeat caps halt stalled polling without aborting progressing jobs, while time and spend limits protect the outer envelope.</figcaption>
</figure>

<!-- leetllm: test, id=obs-otel-spans-alerts, output=show, output_title="Span minimization, loop budgets, and independent alert channels" -->
```python title="otel_spans_and_alerts.py"
ALLOWED = {"gen_ai.operation.name", "gen_ai.request.model", "platform.failure.stage"}
span_2 = {"gen_ai.operation.name": "chat", "gen_ai.request.model": "deploy-assistant-prod", "platform.failure.stage": "claim_generation", "prompt_text": "SECRET"}
print("exported_keys:", sorted(k for k in span_2 if k in ALLOWED))


def loop_tokens(calls: int, start: int = 100, growth: int = 20) -> int:
    return calls * start + growth * calls * (calls - 1) // 2


def admit_poll(markers: list[str], rem_sec: float, avail_usd: float, next_usd: float, cap: int = 4) -> str:
    streak, prev = 0, None
    for m in markers:
        streak = streak + 1 if m == prev else 1
        prev = m
    if streak >= cap:
        return f"HALT_REPEAT(streak={streak})"
    return "HALT_BUDGET" if (rem_sec <= 0 or next_usd > avail_usd) else f"CONTINUE(streak={streak})"


def alerts(unsafe: int, obs: int, ingress: int, lat_ok: bool, use_ok: bool) -> list[str]:
    out = [f"PAGE_UNSAFE count={unsafe} exemplar=trace-05"] if unsafe else []
    if obs < ingress:
        out.append(f"WARN_MISSING {obs}/{ingress}")
    if not lat_ok:
        out.append("UNKNOWN_LATENCY")
    if not use_ok:
        out.append("UNKNOWN_USAGE")
    return out


print("loop_tokens:", [loop_tokens(n) for n in (4, 8, 16)], "| poller:", admit_poll(["A", "A", "B", "B", "B"], 9.0, 0.08, 0.09))
print("alerts:", alerts(2, 5, 6, False, False))
```

<!-- leetllm: output:start -->
```text title="Span minimization, loop budgets, and independent alert channels" output compact
exported_keys: ['gen_ai.operation.name', 'gen_ai.request.model', 'platform.failure.stage']
loop_tokens: [520, 1360, 4000] | poller: HALT_BUDGET
alerts: ['PAGE_UNSAFE count=2 exemplar=trace-05', 'WARN_MISSING 5/6', 'UNKNOWN_LATENCY', 'UNKNOWN_USAGE']
```
<!-- leetllm: output:end -->

## Preserve the evidence for experiment tracking

Hand off `trace-05`, evidence revision, template tag, and clean-case controls into replay evaluation. Reject any candidate that eliminates unsafe responses simply by abstaining on every query (require a predeclared usefulness floor), and isolate one changed variable at a time before attributing gains.

Reproducible replay and safe recovery depend on pinning **immutable content-addressed digests** in every trace span. Because LLM behavior reflects an entangled bundle of weights or hosted snapshot date, prompt bytes, tool schemas, retrieval corpus snapshot, and serving container image, reverting one prompt file in Git can leave production running an untested hybrid configuration.[^sculley2015][^ociDescriptorDigest2026] Hash the entire release tuple into one SHA-256 `release_id`, emit it on every span, and update mutable environment aliases (`production`, `canary`) strictly through compare-and-swap (CAS) revision guards so stale automation jobs expecting an older `(target, rev)` pair never overwrite a newer promotion or rollback.[^mlflow2026registryworkflow]

Before full promotion, route multi-turn threads deterministically with sticky `SHA-256(conversation_id)` hashing while tracking thread share and request share separately so power-user sessions cannot overload canary pods silently.[^argoCanaryRouting2026] Gate each canary stage on zero unsafe deliveries, complete telemetry, and exact one-sided 95% Clopper-Pearson upper bounds ($1 - 0.05^{1/n}$) or sequential SPRT rules, with an instant canary-abort override breaking thread stickiness back to `stable_id`. Before any post-promotion rollback, verify warm replica capacity for returning demand and backward-compatible conversation schema readers.

## Count before sampling traces

Pair unlabeled drift detectors with sound sampling.[^chen2023drift] Track **PSI** (`< 0.10` stable, `0.10-0.25` watch, `> 0.25` major shift),[^potgieter2026psi] two-sample **Kolmogorov-Smirnov** tests (`ks_2samp`),[^scipyKs2Sample2026] and unbiased RBF-kernel **$\text{MMD}^2$** on query embeddings. When `tail` sampling keeps 100% of unsafe traces and probability $p$ of routine traces, raw stored percentages grossly inflate error rates.[^otelsampling2026][^otelTailSampling2026] Count total ingress and flagged events **before** sampling, and apply **inverse-probability weighting** ($1/p$ per routine trace) to recover unbiased population estimates with finite-window variance.

<!-- leetllm: test, id=obs-drift-sampling, deps=numpy,scipy, output=show, output_title="PSI, KS drift, RBF-MMD, and IPW tail-sampling recovery" -->
```python title="drift_and_sampling.py"
import numpy as np
from scipy.stats import ks_2samp

rng = np.random.default_rng(42)
ref_e = rng.normal(0.0, 1.0, (250, 16))
shift = np.zeros(16)
shift[:4] = 1.6
drift_e = np.vstack([rng.normal(0.0, 1.0, (165, 16)), rng.normal(shift, 1.0, (85, 16))])
ref_t = rng.lognormal(np.log(190.0), 0.18, 250)
drift_t = rng.lognormal(np.log(265.0), 0.25, 250)

edges = np.quantile(ref_t, np.linspace(0.0, 1.0, 11))
edges[0], edges[-1] = -np.inf, np.inf
p = np.clip(np.histogram(ref_t, bins=edges)[0] / len(ref_t), 1e-6, None)
q = np.clip(np.histogram(drift_t, bins=edges)[0] / len(drift_t), 1e-6, None)
psi = float(np.sum((q - p) * np.log(q / p)))
ks = ks_2samp(ref_t, drift_t)

sq_xx = np.sum((ref_e[:, None, :] - ref_e[None, :, :]) ** 2, axis=2)
sq_yy = np.sum((drift_e[:, None, :] - drift_e[None, :, :]) ** 2, axis=2)
sq_xy = np.sum((ref_e[:, None, :] - drift_e[None, :, :]) ** 2, axis=2)
g = 1.0 / (2.0 * np.median(sq_xy) + 1e-12)
k_xx, k_yy, k_xy = np.exp(-g * sq_xx), np.exp(-g * sq_yy), np.exp(-g * sq_xy)
np.fill_diagonal(k_xx, 0.0)
np.fill_diagonal(k_yy, 0.0)
mmd2 = float(k_xx.sum() / (len(ref_e) * (len(ref_e) - 1)) + k_yy.sum() / (len(drift_e) * (len(drift_e) - 1)) - 2.0 * k_xy.mean())

kept_u, kept_o, p_o = 3, 12, 0.20
print(f"drift | psi={psi:.3f} | ks={ks.statistic:.3f} (p={ks.pvalue:.2e}) | mmd2={mmd2:.4f}")
print(f"ipw   | naive={kept_u/(kept_u+kept_o):.1%} | weighted={kept_u/(kept_u+kept_o/p_o):.2%}")
```

<!-- leetllm: output:start -->
```text title="PSI, KS drift, RBF-MMD, and IPW tail-sampling recovery" output compact
drift | psi=2.333 | ks=0.628 (p=1.61e-46) | mmd2=0.0217
ipw   | naive=20.0% | weighted=4.76%
```
<!-- leetllm: output:end -->

```checkpoint
Stored tail-sampled logs show 40% unsafe responses when the sampler retains 100% of flagged traces and 5% of routine traces (40 flagged, 60 routine kept). Estimate the true rate and name what pre-sampling counters you still need.
---
Weighting each routine trace by 1/0.05 = 20 yields 40 / (40 + 60 * 20) = 40 / 1240 ≈ 3.2%. Count total ingress and total flagged events before sampling so finite-sample variance never replaces exact baseline volume.
```

```mastery-quiz
[
  {
    "question": "Eight requests enter a window. Six have independent reviews; four of those six delivered substantive answers. Two reviewed substantive answers are unsafe. Which tuple reports reviewed unsafe rate, conditional unsafe-answer risk, and review coverage?",
    "options": [
      "2/8; 2/4; 6/8.",
      "2/6; 2/8; 4/8.",
      "2/6; 2/4; 6/8.",
      "2/4; 2/6; 4/6."
    ],
    "answer": "2/6; 2/4; 6/8.",
    "explanation": "Use reviewed requests for reviewed risk, reviewed substantive deliveries for conditional risk, and total ingress for coverage; missing reviews are not safe."
  },
  {
    "question": "Two eight-request windows each have five reviewed requests, including one unsafe serve, and three unreviewed final events. In A, all three unreviewed events are confirmed withholdings. In B, one is a substantive delivery and two are confirmed withholdings. What full-window unsafe-rate bounds follow?",
    "options": [
      "A: exactly 1/8. B: from 1/8 through 2/8.",
      "A: from 1/8 through 4/8. B: from 1/8 through 4/8.",
      "A: exactly 1/5. B: from 1/5 through 2/5.",
      "A: from 1/8 through 2/8. B: exactly 1/8."
    ],
    "answer": "A: exactly 1/8. B: from 1/8 through 2/8.",
    "explanation": "Withheld payloads cannot deliver an unsafe claim even when unreviewed; B has one unchecked substantive delivery that could add at most one unsafe serve."
  },
  {
    "question": "Visible tokens arrive individually from a shared monotonic start. A emits 17 tokens, with its first at 120 ms and last at 320 ms. B emits one token at 120 ms. Which pair correctly describes post-first-token throughput?",
    "options": [
      "A: 85 tokens/s. B: no later-token throughput.",
      "A: 50 tokens/s. B: zero tokens/s over the request.",
      "A: 53.1 tokens/s. B: 8.3 tokens/s over the request.",
      "A: 80 tokens/s. B: no later-token throughput."
    ],
    "answer": "A: 80 tokens/s. B: no later-token throughput.",
    "explanation": "A emits 16 tokens after the first over 0.200 s (16/0.200 = 80 tokens/s). B has no post-first-token interval."
  },
  {
    "question": "A request trace has two distinct tool spans, IDs 11 and 12, both named lookup. A remote worker is invoked by span 11 and receives its propagated context. Which worker record preserves that invocation?",
    "options": [
      "Reuse span ID 11 for the worker, keep its request trace, and treat lookup as one combined operation.",
      "Give the worker a new span ID, retain the request trace, and record parent span 11.",
      "Give the worker a new trace and span ID, then reconstruct its parent from the repeated lookup name.",
      "Give the worker a new span ID in the request trace, and record the latest lookup span 12 as parent."
    ],
    "answer": "Give the worker a new span ID, retain the request trace, and record parent span 11.",
    "explanation": "Propagated context identifies the exact caller; the worker gets its own span ID in the shared trace with parent_span_id 11."
  },
  {
    "question": "A named rate card charges \\$2, \\$0.25, and \\$8 per million uncached-input, cached-input, and output tokens. A reports 500 total input including 180 cached, plus 25 output. B reports 501 cached out of 500 input. Which paired accounting result is valid?",
    "options": [
      "A: \\$0.001245. B: reject impossible usage.",
      "A: \\$0.000885. B: clamp cached input to 500.",
      "A: \\$0.000885. B: reject impossible usage.",
      "A: \\$0.000640. B: clamp cached input to 500."
    ],
    "answer": "A: \\$0.000885. B: reject impossible usage.",
    "explanation": "A has 320 uncached tokens: (320*2 + 180*0.25 + 25*8)/1e6 = \\$0.000885. B violates cached <= total input and must be rejected rather than clamped."
  },
  {
    "question": "A trace exporter writes only request, prompt and evidence IDs. It rejects a record if any ID is absent from its registry. A separate log writer sets `record.request_id = event.request_id`. Two exporter inputs have registered request and prompt IDs. Only evidence revision r7 is registered. A test expects the exporter to reject the r8 record, then to export the r7 record without its extra `operator_note`. Finally, it expects the log writer to redact private billing text passed as `request_id`. Which check fails first, if any?",
    "options": [
      "The evidence revision check fails.",
      "The extra note check fails.",
      "The copied request ID check fails.",
      "All three checks pass."
    ],
    "answer": "The copied request ID check fails.",
    "explanation": "The exporter rejects r8 and strips `operator_note` from r7, so both exporter checks pass. The log writer copies private text verbatim as `request_id` and fails redaction."
  },
  {
    "question": "A zero-tolerance deploy policy observes one independently confirmed unsafe serve. Its latency channel contains NaN and its usage channel reports cached input larger than total input. Which findings should survive validation?",
    "options": [
      "An unsafe-serve warning, with latency and cost recorded as zero until the channels recover.",
      "An unsafe-serve page, with latency and cost estimated from the remaining valid channels.",
      "Unknown safety, latency and usage until every channel validates against the same complete window.",
      "An unsafe-serve page, plus separate unknown-latency and unknown-usage findings."
    ],
    "answer": "An unsafe-serve page, plus separate unknown-latency and unknown-usage findings.",
    "explanation": "Broken operational channels never suppress an independently confirmed safety page; report their unknown states explicitly alongside the page."
  },
  {
    "question": "A trace sampler keeps each detected unsafe request with probability 1. It independently keeps each other request with probability 0.20. In one window it kept three unsafe traces and 12 other traces. Assume valid labels and no extra drops. What does inverse-probability weighting tell you about the unsafe-request rate in that window?",
    "options": [
      "A weighted rate of 20.0%, because all 15 stored traces retain equal population weight.",
      "A weighted estimate of about 4.76%, with sampling uncertainty in the finite-window ratio.",
      "An exact full-window rate of about 4.76%, because known inclusion probabilities remove all uncertainty.",
      "A weighted estimate of 5.00%, after estimating the request total from only the other traces."
    ],
    "answer": "A weighted estimate of about 4.76%, with sampling uncertainty in the finite-window ratio.",
    "explanation": "Each routine trace has weight 1/0.20 = 5, giving 3/(3 + 12*5) = 3/63 ≈ 4.76% with finite-window sampling uncertainty."
  },
  {
    "question": "A poller stops at four consecutive identical tool/operation/marker observations. Its latest markers for one operation are A,A,B,B,B. It has 9 seconds remaining, \\$0.08 available, and the next reservation is \\$0.09. Which budget decision follows?",
    "options": [
      "Reject for the repeat cap; the latest B run already contains four identical observations.",
      "Proceed; the new B marker reset the repeat count and also reset the spend reservation.",
      "Reject for spend; the latest repeat count is three and the time budget is still open.",
      "Proceed; only completed charges count, so a reservation above available spend is permissible."
    ],
    "answer": "Reject for spend; the latest repeat count is three and the time budget is still open.",
    "explanation": "The trailing B streak is three (below four), time remains open, and the \\$0.09 reservation exceeds \\$0.08 available before dispatch."
  },
  {
    "question": "A candidate removes every observed unsafe serve by withholding all answers. Its incident replay passes, but it fails the predeclared clean-case usefulness floor. Another proposed fix changes both prompt and gate configuration in the comparison. What release and attribution conclusions follow?",
    "options": [
      "Hold the first candidate for failed usefulness; isolate the second comparison before attributing improvement to the prompt.",
      "Promote the first candidate for zero observed unsafe serves; isolate the second comparison before attributing improvement to the prompt.",
      "Hold the first candidate for failed usefulness; attribute the second improvement to the prompt because its version changed.",
      "Promote the first candidate for zero observed unsafe serves; attribute the second improvement to the prompt because its version changed."
    ],
    "answer": "Hold the first candidate for failed usefulness; isolate the second comparison before attributing improvement to the prompt.",
    "explanation": "Safety and usefulness are separate release checks, and changing two components together requires isolated replay before attributing credit."
  }
]
```

> **Next:** Continue to [Serving Benchmark Engineering](/learn/serving-benchmark-engineering).

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
Every dashboard is green. The service returned HTTP 200 on all six requests in this window, first output arrived in 240 ms at p95 (well under the 500 ms warning), and token spend stayed on budget. Yet two of those six answers told engineers they were cleared to deploy when no approval existed.

HTTP status says the server replied, and latency says it replied quickly; neither checks whether the reply was true. Google's SRE guidance calls wrong content delivered with a 200 an implicit error.[^sreMonitoringDistributedSystems] In an LLM service, implicit errors are the hardest failure mode because fluent text arrives at full speed with nothing in standard logs to flag it.

LLM observability answers three concrete questions: what actually reached the user, which internal step produced it, and which exact artifact versions ran? We follow a six-request window (`trace-01` through `trace-06`) from a deployment assistant to separate bad drafts from missed guardrails, pinpoint failures in span trees, catch silent drift early, pin immutable release digests, and keep alerts intact when telemetry degrades.

## Start from what reached the user

A serving guardrail may deliver a full answer, shorten it, route to review, or abstain. Counting those self-reported routes alone hides failures whenever the guardrail lets a bad draft slip through. Record whether substantive text reached the user (`substantive_output_served`) and join an independent review verdict (`unsafe_claim_served`: `True`, `False`, or `None` for pending) back by `request_id`.

| Request | Template | Route | Answer served? | Unsafe claim delivered? |
|---|---|---|---|---|
| trace-01 | strict v1 | serve | yes | no |
| trace-02, trace-03, trace-04 | strict v1 | abstain | no | no |
| trace-05, trace-06 | regressed v1.1 | serve | yes | yes |

Keep two concepts separate: a **defective draft** is a hallucination produced by the model (`trace-02`, `trace-03`), whereas a **missed guardrail** lets that bad draft reach the user (`trace-05`, `trace-06`). Leave unreviewed rows as `None` rather than defaulting them to safe, update records in place when delayed reviews arrive instead of appending duplicate rows, and reconcile terminal events against an independent ingress counter so dropped collector batches show up as missing coverage.

<figure>
  <img src="illustrations/_generated/observability_dark.png" alt="Six reviewed requests include two unsafe serves and three abstentions; first-output and cost signals remain within their thresholds." />
  <figcaption>Requests `trace-05` and `trace-06` sit well below the 500 ms latency threshold. Only independent outcome review exposes that both delivered false approvals.</figcaption>
</figure>

## Every rate needs a denominator

> **Common mistake:** Treating `2/6` (33.3%) and `2/3` (66.7%) as interchangeable. Two of six reviewed requests leaked an unsafe claim, while two of the three users who actually received an answer got bad advice. Publish review coverage alongside both denominators.

| Metric | Population | What it tells you |
|---|---|---|
| Unsafe-request rate | Reviewed requests | How often checked requests leak an unsafe claim |
| Conditional answer risk | Reviewed delivered answers | Risk facing a user who actually got an answer |
| Review coverage | All ingress requests | Fraction of live traffic with verified verdicts |
| Useful-answer rate | Reviewed answerable cases | Whether safety preserves product utility |

<!-- leetllm: test, output=show, id=reader-observe-denominators -->
```python title="reviewed-window.py"
rows = [
    ("trace-01", True, False),
    ("trace-02", False, False),
    ("trace-03", False, False),
    ("trace-04", False, False),
    ("trace-05", True, True),
    ("trace-06", True, True),
]
reviewed = [r for r in rows if r[2] is not None]
served = [r for r in reviewed if r[1]]
unsafe = sum(r[2] is True for r in reviewed)
print(f"reviewed unsafe: {unsafe}/{len(reviewed)}")
print(f"served-answer risk: {unsafe}/{len(served)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reviewed unsafe: 2/6
served-answer risk: 2/3
```
<!-- leetllm: output:end -->

Keep Google's four golden signals (latency, traffic, errors, saturation) beside quality metrics, enriched with prompt and output lengths, queue wait, and [KV-cache pressure](/learn/kv-cache-paged-attention-llm-serving). Measure time to first visible token and post-first-token throughput from one monotonic clock: for a 30-token reply landing its first visible token at 240 ms and last at 455 ms, 29 later intervals span 215 ms (`134.9 tokens/s`). Leave single-token replies without a later-token rate, never divide visible intervals by billed totals including hidden reasoning tokens, and attach sample size `N` beside nearest-rank percentiles.[^pope2023]

## Follow one request and cap agent loops

Metrics spot population shifts; traces locate the failing operation inside one call. In `trace-05`, a single root span owns retrieval (`deploy-policy@v17`), chat generation (`first_failed_stage=claim_generation`), and the serving guardrail (`escape_stage=serving_gate`).

<figure>
  <img src="illustrations/_generated/request_span_tree_dark.png" alt="One request root owns retrieval, model, and serving-gate spans, with generation and containment failures attached to different operations." />
  <figcaption>One request, three child operations. The chat span marks where the bad draft started, and the serving-gate span marks where it slipped through.</figcaption>
</figure>

Propagate W3C Trace Context headers across worker queues so asynchronous calls stay attached to the caller's exact `span_id` even when tool names repeat.[^w3cTraceContext2021] Pin OpenTelemetry GenAI schema versions while conventions evolve, keep raw prompts opt-in, and exclude high-cardinality `request_id` values from metric labels.[^otelgenai2026][^otelgenaispans2026][^otelsensitivedata2026] Because multi-turn agent tool loops resend growing histories and drive quadratic input tokens (`calls * start + growth * calls * (calls - 1) // 2`), enforce consecutive identical-state repeat caps alongside hard time and spend ceilings inside the runtime rather than waiting for post-hoc telemetry.

<figure>
  <img src="illustrations/_generated/agent_trace_state_loop_dark.png" alt="Two polling paths share tool lookup_deploy_status and operation-42. The top path returns marker scan:v17 three consecutive times, hitting the repeat limit and stopping for review. The bottom path resets its repeat counter when poll 3 advances to scan:v18 while remaining subject to a separate elapsed-time deadline." />
  <figcaption>Counting consecutive repeated markers halts stalled polling loops while letting genuinely progressing jobs continue under separate time and spend limits.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=reader-observe-loop-cost -->
```python title="agent-loop-tokens.py"
def input_tokens(calls, start=100, growth=20):
    return calls * start + growth * calls * (calls - 1) // 2

for calls in (4, 8, 16):
    print(f"{calls} calls: {input_tokens(calls):,} input tokens")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
4 calls: 520 input tokens
8 calls: 1,360 input tokens
16 calls: 4,000 input tokens
```
<!-- leetllm: output:end -->

## Minimize data, price usage, and keep alerts independent

Persist registered IDs, release digests, route verdicts, latencies, and raw disjoint token counts (`input_tokens`, `cached_input_tokens`, `output_tokens`) separately from named rate cards so price changes never alter historical traces. Enforce trusted metadata boundaries everywhere: stripping `operator_note` in an exporter helps little if a separate log writer copies untrusted text passed as `request_id`. For `trace-05` (`198` total input, `80` cached, `29` output at `$1.00 / $0.10 / $5.00` per million), uncached input is `118` tokens (`$0.000271`); reject impossible records where `cached_input > input_tokens` instead of clamping upstream bugs, and see [LLM cost engineering](/learn/llm-cost-engineering-token-economics) for full allocation workflows.

Evaluate alert channels independently so a broken latency or usage collector never suppresses a confirmed safety page. Attach concrete triage handles (`trace-05`, version tags, failure stage) directly to the page.

<!-- leetllm: test, output=show, id=reader-observe-alert-precedence -->
```python title="alert-precedence.py"
def findings(unsafe_count, observed, ingress, latency_known, usage_known):
    result = []
    if unsafe_count:
        result.append(f"PAGE unsafe responses served={unsafe_count}")
    if observed < ingress:
        result.append("UNKNOWN missing final outcomes")
    if not latency_known:
        result.append("UNKNOWN latency telemetry")
    if not usage_known:
        result.append("UNKNOWN usage telemetry")
    return result

print("\n".join(findings(2, 5, 6, False, False)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
PAGE unsafe responses served=2
UNKNOWN missing final outcomes
UNKNOWN latency telemetry
UNKNOWN usage telemetry
```
<!-- leetllm: output:end -->

## Detect drift, undo sampling bias, and pin release digests

Because human labels lag live traffic, monitor unlabeled shifts with Population Stability Index (PSI) across baseline quantiles and two-sample Kolmogorov-Smirnov tests on continuous latencies or similarity scores.[^potgieter2026psi][^scipyKs2Sample2026] When tail sampling keeps 100% of flagged traces and probability `p` of routine traffic, stored error shares jump unless you count totals before sampling and inverse-weight kept routine traces by `1 / p`.[^otelsampling2026][^otelTailSampling2026]

<!-- leetllm: test, id=reader-observe-drift-ipw, deps=numpy,scipy, output=show, output_title="Latency drift (PSI + KS) and IPW sampling correction" -->
```python title="reader-drift-ipw.py"
import numpy as np
from scipy.stats import ks_2samp

rng = np.random.default_rng(7)
ref_ttft = rng.lognormal(np.log(190.0), 0.18, size=250)
shifted_ttft = rng.lognormal(np.log(255.0), 0.22, size=250)

edges = np.quantile(ref_ttft, np.linspace(0.0, 1.0, 11))
edges[0], edges[-1] = -np.inf, np.inf
p = np.clip(np.histogram(ref_ttft, bins=edges)[0] / len(ref_ttft), 1e-6, None)
q = np.clip(np.histogram(shifted_ttft, bins=edges)[0] / len(shifted_ttft), 1e-6, None)
psi = float(np.sum((q - p) * np.log(q / p)))
ks = ks_2samp(ref_ttft, shifted_ttft)

flagged, kept_routine, keep_p = 2, 1, 0.25
print(f"stored_unsafe={flagged/(flagged+kept_routine):.1%} ipw_rate={flagged/(flagged+kept_routine/keep_p):.1%}")
print(f"latency_psi={psi:.3f} ks_stat={ks.statistic:.3f} ks_p={ks.pvalue:.2e}")
```

<!-- leetllm: output:start -->
```text title="Latency drift (PSI + KS) and IPW sampling correction" output compact
stored_unsafe=66.7% ipw_rate=33.3%
latency_psi=3.030 ks_stat=0.584 ks_p=7.99e-40
```
<!-- leetllm: output:end -->

```checkpoint
Your stored traces show 40% of answers flagged unsafe. Your sampler keeps every flagged trace and 5% of routine traces (40 flagged, 60 routine kept). Estimate the true window rate and name what pre-sampling counters you still need.
---
Inverse-probability weighting gives 40 / (40 + 60 / 0.05) = 40 / 1240 ≈ 3.2%. Keep pre-sampling total ingress and flagged counters beside diagnostic traces because the weighted ratio still carries finite-sample variance.
```

## From incident to safe rollout

<figure>
  <img src="illustrations/_generated/observability_metrics_triage_dark.png" alt="Two strict cases with generation defects are withheld, while two cases under the regressed template also escape the serving gate." />
  <figcaption>Both versions produced bad drafts. The difference sits at the serving boundary: strict v1 withheld them while regressed v1.1 delivered them.</figcaption>
</figure>

Pin immutable SHA-256 digests covering model snapshot, prompt bytes, tool schemas, retrieval corpus, and runtime image inside every trace span so reverting one file never leaves an untested hybrid deployment, and update `canary` and `production` aliases via compare-and-swap revisions so stale jobs never overwrite a rollback.[^ociDescriptorDigest2026][^mlflow2026registryworkflow] When triaging a live incident like `trace-05`, follow a strict four-step sequence:

1. **Verify both quality denominators:** separate the reviewed unsafe rate (`2/6`) from conditional delivered-answer risk (`2/3`), and keep unreviewed abstentions distinct from unreviewed substantive replies so full-window risk bounds stay exact.
2. **Slice by pinned release digest:** compare `deploy-answerer-v1` against `deploy-answerer-v1.1-regression` to see whether defects rose in generation (`claim_generation`) or slipped past the serving boundary (`serving_gate`).
3. **Replay against clean controls:** test every proposed fix on both the captured incident trace and an answerable control suite so a blanket refusal rule cannot slip past safety checks by breaking usefulness.
4. **Promote progressively with abort and rollback readiness:** route multi-turn canary threads deterministically by `SHA-256(conversation_id)` while tracking thread share and request share separately, verify zero unsafe deliveries, telemetry completeness, and Clopper-Pearson confidence bounds before widening traffic, wire an instant canary-abort override that breaks thread stickiness back to `stable_id`, and confirm warm replica capacity plus backward-compatible conversation schemas before any post-promotion rollback.[^argoCanaryRouting2026]

Continue with [Serving Benchmark Engineering](/learn/serving-benchmark-engineering) to benchmark serving throughput and latency budgets end to end.

<!-- leetllm: edition:reader:end -->
