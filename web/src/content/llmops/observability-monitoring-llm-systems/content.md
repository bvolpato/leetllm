---
{
  "id": "observability-monitoring-llm-systems",
  "title": "LLM Observability & Monitoring",
  "slug": "observability-monitoring-llm-systems",
  "category": "MLOps & Deployment",
  "difficulty": "Medium",
  "coverImage": "illustrations/_generated/observability_dark.png",
  "companies": [
    "Google",
    "OpenAI",
    "Meta",
    "Amazon"
  ],
  "shortDescription": "Six responses return HTTP 200 and still include two unsupported approvals. Latency, cost, and traces matter only once that claim is visible.",
  "keyConceptsTested": [
    "Monitoring aggregates versus request-level observability",
    "Claim-gate quality metrics, failure-stage attribution, and containment escapes",
    "Time to first token and post-first-token throughput",
    "Trace attributes and OpenTelemetry GenAI conventions",
    "Versioned cost attribution",
    "Data minimization and durable debugging evidence",
    "Alert policies, agent budgets, and experiment handoff"
  ],
  "section": "Applied LLM Engineering",
  "order": 18
}
---
<!-- leetllm: edition:reference:start -->
Every systems dashboard looks healthy at 09:12: all six policy-assistant responses returned `200 OK`, first-token latency stayed below the 500 ms warning line, and total token spend stayed comfortably under budget. Yet two of those six answers told engineers they had approval to deploy when no authorization record existed in the retrieved policy. Standard HTTP monitoring sees fast, inexpensive text generation rather than an implicit error returned with a successful status code.[^sreMonitoringDistributedSystems]

Traditional Application Performance Monitoring (APM) captures latency, traffic, HTTP errors, and saturation, which form the necessary floor for any serving stack. For language models, however, monitoring aggregates must sit alongside quality outcomes, <span data-glossary="tracing">trace</span> trees, token economics, and embedding distribution checks. Monitoring summarizes population rates over windows so an operator knows when something shifted, while request-level <span data-glossary="observability">observability</span> preserves parent-child execution spans and version metadata so the on-call engineer can isolate why a specific response broke containment.

<figure>
  <img src="illustrations/_generated/observability_dark.png" alt="Six reviewed requests share a 0 to 500 ms first-visible-token axis. All return HTTP 200; nearest-rank p95 is 240 ms under the 500 ms warning line. One safe answer, three abstentions, and two unsafe served answers yield 2/6 unsafe reviewed requests and 2/3 unsafe served answers." />
  <figcaption>The two unsafe served responses (`trace-05` and `trace-06`) sit well under the 500 ms latency threshold and return HTTP 200. Denominator separation separates request-level incidence (2/6) from user-facing risk among delivered answers (2/3).</figcaption>
</figure>

## Separate generation defects from containment escapes

Before computing any aggregate rate, record what left the serving gate alongside what an independent check observed later. A claim gate decides whether to serve a full reply, shorten it, route to human review, or abstain when evidence is missing. Counting the gate's own `abstain` or `serve` labels only reports self-assessed behavior; determining safety requires inspecting the actual payload delivered to the user and joining an independent evaluator verdict or human review back to the unique `request_id`.

| Question | Telemetry field | Diagnostic purpose |
| :--- | :--- | :--- |
| Which decision did the gate make? | `route` | Distinguishes served answers from deliberate abstentions |
| Did substantive text reach the operator? | `substantive_output_served` | Separates payload delivery from fallback refusals |
| Was an unsupported claim delivered? | `unsafe_claim_served` | Tri-state independent check (`True`, `False`, or `None` pending) |
| Which pipeline step failed first? | `first_failed_stage` | Distinguishes retrieval gaps from model hallucination |
| Which defense failed to hold a bad draft? | `escape_stage` | Isolates serving-gate misses from upstream errors |
| Which exact versions ran? | `evidence_version`, `prompt_id`, `gate_version` | Pins reproducible state for offline investigation |

Represent `unsafe_claim_served` as three distinct states rather than two booleans coerced together: `False` indicates independent verification with zero unsupported claims, `True` marks a confirmed violation, and `None` indicates an unreviewed item or timed-out evaluator. Treating missing reviews as safe understates risk whenever review queues lag behind live traffic. Likewise, reconciling received terminal trace events against an independent ingress counter ensures dropped collector batches register as missing coverage rather than silent reliability.

## Compute quality denominators, latency, and rate-card cost

Different denominators answer fundamentally different operational questions about the same six-request window (`trace-01` through `trace-06`). Under the strict policy path (`deploy-answerer-v1`), `trace-01` serves a grounded answer while `trace-02` and `trace-03` catch defective drafts inside the gate and abstain alongside `trace-04` (which lacked policy context). Under the regressed template (`deploy-answerer-v1.1-regression`), both `trace-05` and `trace-06` leak fabricated approvals into the served payload. Thus `2/6` (`33.3%`) of all reviewed requests leaked an unsupported claim, whereas `2/3` (`66.7%`) of users who received a substantive answer received unsafe advice.

Timing and billing also depend on exact definitions rather than generic averages. Measure time to first visible token (`ttft_ms`) and post-first-token throughput (`(output_tokens - 1) / ((total_ms - ttft_ms) / 1000)`) from the same monotonic request clock, omitting throughput for single-token answers rather than inventing infinite or zero-duration rates.[^pope2023] Store raw token counts separately from named price schedules (`uncached_input`, `cached_input`, `output`) so price updates never rewrite historical traces, and reject contradictory usage counters such as `cached_input > total_input` instead of clamping corrupted upstream fields silently. Even with zero unsafe serves across a finite evaluation window, compute a binomial confidence interval (such as a Wilson score bound) alongside sample size `N` so low failure rates are never misread as mathematical certainty.

<!-- leetllm: test, id=obs-quality-metrics, deps=numpy,scipy, output=show, output_title="Denominators, Wilson CI, streaming throughput, and rate-card validation" -->
```python title="window_telemetry.py"
from dataclasses import dataclass
import numpy as np
from scipy.stats import binomtest


@dataclass(frozen=True)
class WindowTrace:
    request_id: str
    draft_defect: str
    evidence_version: str | None
    prompt_version: str
    route: str
    substantive_served: bool
    unsafe_served: bool | None
    ttft_ms: float
    total_ms: float
    input_tokens: int
    cached_tokens: int
    output_tokens: int
    first_failed_stage: str | None
    escape_stage: str | None


window = [
    WindowTrace("trace-01", "none", "deploy-policy@v17", "deploy-answerer-v1", "serve", True, False, 172, 340, 180, 60, 22, None, None),
    WindowTrace("trace-02", "invented_approval", "deploy-policy@v17", "deploy-answerer-v1", "abstain", False, False, 181, 210, 175, 50, 8, "claim_generation", None),
    WindowTrace("trace-03", "wrong_freeze_status", "deploy-policy@v17", "deploy-answerer-v1", "abstain", False, False, 188, 225, 190, 60, 10, "claim_generation", None),
    WindowTrace("trace-04", "missing_policy", None, "deploy-answerer-v1", "abstain", False, False, 205, 240, 160, 0, 9, "retrieval", None),
    WindowTrace("trace-05", "invented_approval", "deploy-policy@v17", "deploy-answerer-v1.1-regression", "serve", True, True, 218, 412, 198, 80, 29, "claim_generation", "serving_gate"),
    WindowTrace("trace-06", "invented_approval", "deploy-policy@v17", "deploy-answerer-v1.1-regression", "serve", True, True, 240, 455, 201, 80, 30, "claim_generation", "serving_gate"),
]

# Deduplicate check and quality denominator breakdown
assert len({row.request_id for row in window}) == len(window)
reviewed = [row for row in window if row.unsafe_served is not None]
served_reviewed = [row for row in reviewed if row.substantive_served]
unsafe = [row for row in reviewed if row.unsafe_served]

for row in window:
    label = "UNSAFE SERVE" if row.unsafe_served else "reviewed safe"
    print(f"{row.request_id}: {row.route:7s} {label}")

p95_ttft = float(np.percentile([r.ttft_ms for r in window], 95, method="nearest"))
t6 = window[-1]
post_tps = (t6.output_tokens - 1) / ((t6.total_ms - t6.ttft_ms) / 1000.0)

# Wilson score interval when 0 violations appear across 50 canary requests
ci = binomtest(k=0, n=50).proportion_ci(confidence_level=0.95, method="wilson")

# Rate card ($ per 1M tokens): uncached=$1.00, cached=$0.10, output=$5.00
def estimate_cost(rec: WindowTrace) -> float:
    if rec.cached_tokens > rec.input_tokens or rec.input_tokens < 0 or rec.output_tokens < 0:
        raise ValueError(f"invalid usage counts on {rec.request_id}")
    uncached = rec.input_tokens - rec.cached_tokens
    return (uncached * 1.0 + rec.cached_tokens * 0.10 + rec.output_tokens * 5.0) / 1_000_000.0


print(
    f"reviewed_unsafe={len(unsafe)}/{len(reviewed)} ({len(unsafe)/len(reviewed):.1%}) | "
    f"served_risk={len(unsafe)}/{len(served_reviewed)} ({len(unsafe)/len(served_reviewed):.1%})"
)
print(f"p95_ttft_ms={p95_ttft:.0f} | trace-06_post_first_tps={post_tps:.1f} | trace-06_cost=${estimate_cost(t6):.6f}")
print(f"zero_of_50_wilson_95ci=({ci.low:.4f}, {ci.high:.4f})")
```

<!-- leetllm: output:start -->
```text title="Denominators, Wilson CI, streaming throughput, and rate-card validation" output compact
trace-01: serve   reviewed safe
trace-02: abstain reviewed safe
trace-03: abstain reviewed safe
trace-04: abstain reviewed safe
trace-05: serve   UNSAFE SERVE
trace-06: serve   UNSAFE SERVE
reviewed_unsafe=2/6 (33.3%) | served_risk=2/3 (66.7%)
p95_ttft_ms=240 | trace-06_post_first_tps=134.9 | trace-06_cost=$0.000279
zero_of_50_wilson_95ci=(0.0000, 0.0713)
```
<!-- leetllm: output:end -->

Look closely at the Wilson interval (`(0.0000, 0.0713)`): observing zero unsafe answers across 50 reviewed traces still remains compatible with up to a 7.1% true violation rate under a 95% confidence interval. By contrast, even over just six requests, separating `2/6` overall violations from `2/3` conditional served risk makes the severity shift unambiguous. Reporting sample sizes alongside zero-defect counts prevents premature release confidence on sparse canary windows.

## Trace OpenTelemetry span trees, agent loops, and alert rules

Population metrics reveal when an operational curve shifts, while distributed traces reconstruct which internal step caused a failure. Under W3C Trace Context and OpenTelemetry GenAI semantic conventions, a single incoming request carries a shared `trace_id`, and each retrieval lookup, model call, tool invocation, and serving gate emits its own `span_id` linked via `parent_span_id`.[^w3cTraceContext2021][^otelgenaispans2026] When two calls invoke the same tool name or cross an asynchronous worker queue, explicit parent-context propagation preserves exact execution order instead of forcing engineers to guess from wall-clock timestamps.

<figure>
  <img src="illustrations/_generated/request_span_tree_dark.png" alt="Request trace-05 is span 0, deploy-answer.request. Three sibling spans share parent_id 0: span 1 retrieval deploy-policy with evidence version deploy-policy@v17, span 2 chat deploy-assistant-prod marking first failure stage claim_generation, and span 3 serving_gate recording unsafe_claim_served=true and escape_stage=serving_gate." />
  <figcaption>A three-span child tree isolates where the bad claim was generated (`claim_generation`) separately from where containment failed (`serving_gate`).</figcaption>
</figure>

Two governance habits make traces durable and safe in production. First, keep metric attributes low-cardinality (deployment version, operation name, route) and reserve high-cardinality `request_id` values for trace spans and exemplar pointers, while disabling raw prompt/completion capture unless an explicit time-limited debugging scope requires it.[^otelsensitivedata2026][^otelgenaimetrics2026] Even an anonymized trace field can leak private strings if upstream callers pass free text inside an identifier, so validate identifier formats at the exporter before persistence.

Second, autonomous tool-calling loops demand hard runtime limits rather than relying on telemetry alerts after spend accumulates. When an agent appends every prior tool output to its conversation history and grows by `growth` tokens per step, cumulative input tokens across `N` turns scale quadratically: $N \cdot s + g \cdot \frac{N(N-1)}{2}$. Combining a consecutive identical-state repeat cap (resetting when a progress marker advances) with independent time and dollar budgets stops runaway polling loops cleanly inside the runtime.

<figure>
  <img src="illustrations/_generated/agent_trace_state_loop_dark.png" alt="Two polling paths share tool lookup_deploy_status and operation-42. The top path returns marker scan:v17 three consecutive times, hitting the repeat limit and stopping for review. The bottom path resets its repeat counter when poll 3 advances to scan:v18 while remaining subject to a separate elapsed-time deadline." />
  <figcaption>Counting consecutive repeated markers stops stalled polling loops without prematurely aborting genuinely progressing jobs, while time and spend limits protect the outer envelope.</figcaption>
</figure>

When an alert evaluator inspects these signals, channel isolation matters just as much as span accuracy. If the latency stream drops out or usage accounting turns corrupt during an incident, alert evaluation must never bail out before paging on confirmed unsafe deliveries; surface the safety page first and emit explicit unknown-channel warnings right behind it.

<!-- leetllm: test, id=obs-otel-spans-alerts, output=show, output_title="OpenTelemetry span tree correlation, loop control, and independent alerting" -->
```python title="otel_spans_and_alerts.py"
from dataclasses import dataclass


@dataclass(frozen=True)
class GenAISpan:
    trace_id: str
    span_id: int
    parent_span_id: int | None
    operation: str
    attributes: dict[str, object]


ALLOWED_FIELDS = {
    "gen_ai.operation.name",
    "gen_ai.provider.name",
    "gen_ai.request.model",
    "platform.evidence.version",
    "platform.failure.stage",
    "platform.failure.escape_stage",
}

raw_spans = [
    GenAISpan("trace-05", 0, None, "deploy-answer.request", {"gen_ai.operation.name": "invoke_agent", "prompt_text": "SECRET_TEXT"}),
    GenAISpan("trace-05", 1, 0, "retrieval", {"gen_ai.operation.name": "retrieval", "platform.evidence.version": "deploy-policy@v17"}),
    GenAISpan("trace-05", 2, 0, "chat", {"gen_ai.operation.name": "chat", "gen_ai.request.model": "deploy-assistant-prod", "platform.failure.stage": "claim_generation"}),
    GenAISpan("trace-05", 3, 0, "serving_gate", {"gen_ai.operation.name": "gate", "platform.failure.escape_stage": "serving_gate"}),
]

# Verify connected parentage and minimize attributes prior to export
span_ids = {s.span_id for s in raw_spans}
minimized = []
for sp in raw_spans:
    if sp.parent_span_id is not None and sp.parent_span_id not in span_ids:
        raise ValueError(f"orphan span {sp.span_id}")
    safe_attrs = {k: v for k, v in sp.attributes.items() if k in ALLOWED_FIELDS}
    minimized.append((sp.span_id, sp.parent_span_id, sp.operation, safe_attrs))

print("minimized_span_2_keys:", sorted(minimized[2][3].keys()))

# Quadratic token growth + progress-aware repeat limit
def cumulative_input_tokens(calls: int, start: int = 100, growth: int = 20) -> int:
    return calls * start + growth * calls * (calls - 1) // 2

def check_poller(markers: list[str], remaining_sec: float, budget_usd: float, next_cost_usd: float, repeat_cap: int = 4) -> str:
    streak = 0
    prev = None
    for marker in markers:
        streak = streak + 1 if marker == prev else 1
        prev = marker
    if streak >= repeat_cap:
        return f"HALT_REPEAT(streak={streak})"
    if remaining_sec <= 0 or next_cost_usd > budget_usd:
        return "HALT_BUDGET"
    return f"CONTINUE(streak={streak})"

print("loop_tokens_4_8_16:", [cumulative_input_tokens(n) for n in (4, 8, 16)])
print("poller_decision:", check_poller(["A", "A", "B", "B", "B"], remaining_sec=9.0, budget_usd=0.08, next_cost_usd=0.09))

# Independent alert evaluation: telemetry outages never suppress confirmed safety pages
def evaluate_alerts(unsafe_count: int, observed_events: int, ingress_events: int, latency_ok: bool, usage_ok: bool) -> list[str]:
    alerts = []
    if unsafe_count > 0:
        alerts.append(f"PAGE_UNSAFE_SERVED count={unsafe_count} exemplar=trace-05")
    if observed_events < ingress_events:
        alerts.append(f"WARN_MISSING_EVENTS observed={observed_events} ingress={ingress_events}")
    if not latency_ok:
        alerts.append("UNKNOWN_LATENCY_CHANNEL")
    if not usage_ok:
        alerts.append("UNKNOWN_USAGE_CHANNEL")
    return alerts

print("alerts:", evaluate_alerts(unsafe_count=2, observed_events=5, ingress_events=6, latency_ok=False, usage_ok=False))
```

<!-- leetllm: output:start -->
```text title="OpenTelemetry span tree correlation, loop control, and independent alerting" output compact
minimized_span_2_keys: ['gen_ai.operation.name', 'gen_ai.request.model', 'platform.failure.stage']
loop_tokens_4_8_16: [520, 1360, 4000]
poller_decision: HALT_BUDGET
alerts: ['PAGE_UNSAFE_SERVED count=2 exemplar=trace-05', 'WARN_MISSING_EVENTS observed=5 ingress=6', 'UNKNOWN_LATENCY_CHANNEL', 'UNKNOWN_USAGE_CHANNEL']
```
<!-- leetllm: output:end -->

Pinning OpenTelemetry GenAI semantic conventions in your schema documentation protects downstream dashboards and alert pipelines while the GenAI telemetry specifications remain under active development.[^otelgenai2026][^otelgenaiRegistry2026] Storing `platform.failure.stage` separately from `platform.failure.escape_stage` lets engineers slice defects by model release without conflating draft generation bugs with containment leaks. Pairing minimized trace exports with hard runtime loop caps keeps agent failures visible without bloating telemetry storage or bills.

<figure>
  <img src="illustrations/_generated/observability_metrics_triage_dark.png" alt="Four requests share claim_generation failures. Traces trace-02 and trace-03 are caught and withheld by deploy-answerer-v1, whereas trace-05 and trace-06 pass through serving_gate to operators under deploy-answerer-v1.1-regression." />
  <figcaption>Slicing traces by candidate version separates upstream draft defects from a regression in serving containment.</figcaption>
</figure>

## Detect embedding and latency drift while correcting sampled rates

Human annotation always lags live traffic, and silent semantic drift often signals trouble hours before safety reviews populate. When incoming user prompts shift into an unfamiliar topic cluster or latency distributions thicken in the tail, statistical two-sample detectors catch the shift early across unlabeled traffic.[^chen2023drift] Three complementary metrics work cleanly together in NumPy and SciPy:

- **Population Stability Index (PSI):** partitions a scalar score (such as similarity margin or retrieval distance) into fixed quantiles from the reference baseline, clipping empty bins with a tiny floor $\epsilon = 10^{-6}$ and summing $\sum_b (q_b - p_b) \ln(q_b / p_b)$. Values under `0.10` indicate stability, `0.10–0.25` merit watchfulness, and `> 0.25` flag major distributional change.[^potgieter2026psi]
- **Two-sample Kolmogorov-Smirnov test:** compares continuous empirical CDFs ($D = \sup_x |F_{\text{ref}}(x) - F_{\text{cur}}(x)|$) without binning choices via `scipy.stats.ks_2samp`.[^scipyKs2Sample2026]
- **Unbiased RBF-Kernel Maximum Mean Discrepancy ($\text{MMD}^2$):** tests multivariate shifts across dense embedding vectors $X, Y \in \mathbb{R}^{n \times d}$ directly using median-bandwidth Gaussian kernels and permutation $p$-values, detecting topic mixtures that keep univariate means unchanged.

Alongside drift detection, high-volume pipelines sample stored traces (`head` sampling at request start or `tail` sampling once the outcome completes) to control storage spend.[^otelsampling2026][^otelTailSampling2026] Whenever a tail sampler keeps 100% of unsafe traces and only probability $p$ (say `0.20`) of routine traffic, naive percentages in stored logs inflate the apparent failure rate dramatically. Counting total requests and flagged detections prior to sampling provides exact denominators, while inverse-probability weighting (giving each kept routine trace weight $1/p$) recovers an unbiased ratio estimate with explicit sampling variance from the kept sample.

<!-- leetllm: test, id=obs-drift-sampling, deps=numpy,scipy, output=show, output_title="PSI, KS two-sample test, RBF-kernel MMD drift, and IPW tail-sampling recovery" -->
```python title="drift_and_sampling.py"
import numpy as np
from scipy.stats import ks_2samp

rng = np.random.default_rng(42)

# Baseline reference traffic: 300 16-d query embeddings + retrieval similarity margins + TTFT (ms)
n_ref, n_cur, dim = 300, 300, 16
ref_emb = rng.normal(loc=0.0, scale=1.0, size=(n_ref, dim))
stable_emb = rng.normal(loc=0.02, scale=1.0, size=(n_cur, dim))
# Drifted window: 35% of queries shift into a new off-policy topic direction
shift_vec = np.zeros(dim)
shift_vec[:4] = 1.6
drifted_emb = np.vstack([
    rng.normal(loc=0.0, scale=1.0, size=(195, dim)),
    rng.normal(loc=shift_vec, scale=1.0, size=(105, dim)),
])

ref_ttft = rng.lognormal(mean=np.log(190.0), sigma=0.18, size=n_ref)
stable_ttft = rng.lognormal(mean=np.log(193.0), sigma=0.18, size=n_cur)
drifted_ttft = rng.lognormal(mean=np.log(265.0), sigma=0.25, size=n_cur)


def compute_psi(baseline: np.ndarray, current: np.ndarray, n_bins: int = 10) -> float:
    edges = np.quantile(baseline, np.linspace(0.0, 1.0, n_bins + 1))
    edges[0], edges[-1] = -np.inf, np.inf
    p = np.histogram(baseline, bins=edges)[0] / len(baseline)
    q = np.histogram(current, bins=edges)[0] / len(current)
    p = np.clip(p, 1e-6, None)
    q = np.clip(q, 1e-6, None)
    return float(np.sum((q - p) * np.log(q / p)))


def rbf_mmd2_unbiased(x: np.ndarray, y: np.ndarray) -> float:
    sq_xx = np.sum((x[:, None, :] - x[None, :, :]) ** 2, axis=2)
    sq_yy = np.sum((y[:, None, :] - y[None, :, :]) ** 2, axis=2)
    sq_xy = np.sum((x[:, None, :] - y[None, :, :]) ** 2, axis=2)
    # Median heuristic bandwidth from pooled pairwise squared distances
    gamma = 1.0 / (2.0 * np.median(sq_xy) + 1e-12)
    k_xx = np.exp(-gamma * sq_xx)
    k_yy = np.exp(-gamma * sq_yy)
    k_xy = np.exp(-gamma * sq_xy)
    n, m = len(x), len(y)
    np.fill_diagonal(k_xx, 0.0)
    np.fill_diagonal(k_yy, 0.0)
    return float(k_xx.sum() / (n * (n - 1)) + k_yy.sum() / (m * (m - 1)) - 2.0 * k_xy.mean())


for name, emb, ttft in [("stable", stable_emb, stable_ttft), ("drifted", drifted_emb, drifted_ttft)]:
    psi = compute_psi(ref_ttft, ttft)
    ks_res = ks_2samp(ref_ttft, ttft)
    mmd2 = rbf_mmd2_unbiased(ref_emb, emb)
    print(f"{name:7s} | ttft_psi={psi:.3f} | ks_stat={ks_res.statistic:.3f} (p={ks_res.pvalue:.2e}) | emb_mmd2={mmd2:.4f}")

# Inverse-probability weighting recovery for tail-sampled traces
# Policy: keep 100% of unsafe traces (3 kept) and 20% of routine traces (12 kept).
kept_unsafe, kept_other, p_other = 3, 12, 0.20
naive_stored_rate = kept_unsafe / (kept_unsafe + kept_other)
ipw_total = kept_unsafe / 1.0 + kept_other / p_other
ipw_rate = kept_unsafe / ipw_total
print(f"tail_sampling | naive_stored_rate={naive_stored_rate:.1%} | ipw_estimated_rate={ipw_rate:.2%}")
```

<!-- leetllm: output:start -->
```text title="PSI, KS two-sample test, RBF-kernel MMD drift, and IPW tail-sampling recovery" output compact
stable  | ttft_psi=0.054 | ks_stat=0.080 (p=2.93e-01) | emb_mmd2=0.0001
drifted | ttft_psi=1.861 | ks_stat=0.557 (p=4.08e-43) | emb_mmd2=0.0205
tail_sampling | naive_stored_rate=20.0% | ipw_estimated_rate=4.76%
```
<!-- leetllm: output:end -->

Every metric separates the healthy window from the drifted cohort cleanly: stable traffic yields `ttft_psi = 0.054` (well under the `0.10` stability cutoff) and negligible embedding divergence (`emb_mmd2 = 0.0001`), whereas the shifted traffic cohort produces `ttft_psi = 1.861`, strong Kolmogorov-Smirnov rejection (`p = 4.08e-43`), and a two-order-of-magnitude jump in kernel `MMD^2` (`0.0205`). Notice also why naive tail-sampled averages mislead operators: retaining every unsafe trace alongside 20% of clean traces makes a `4.76%` window look like `20.0%` unsafe unless inverse-probability weighting restores the denominator. Pair pre-sampling ingress counters with enriched traces, and pass exact regression handles (`trace-05`, template tag, policy revision, and minimum usefulness checks) straight into controlled experiment tracking.

```checkpoint
Two eight-request windows each contain five reviewed requests (one unsafe serve) and three unreviewed terminal events. In Window A all three unreviewed traces abstained cleanly; in Window B one unreviewed trace delivered a substantive answer and two abstained. What bounds hold for the full-window unsafe rate?
---
Window A has an exact 1/8 full-window unsafe-delivery rate because withheld answers cannot leak an unsupported served claim. Window B ranges from 1/8 to 2/8 because the unreviewed substantive delivery might contain a violation while the two abstentions cannot.
```

```checkpoint
Stored tail-sampled logs show 40% unsafe responses when the sampler retains 100% of flagged traces and 5% of routine traces (e.g., 40 flagged and 60 routine kept). Estimate the true window rate and name what pre-sampling counters you still need.
---
Weighting each routine trace by 1/0.05 = 20 yields 40 / (40 + 60 * 20) = 40 / 1240 ≈ 3.2%. Count total ingress requests and total flagged events before sampling so finite-sample estimator uncertainty never replaces exact baseline volume.
```

```checkpoint
In trace-05, why attach first_failed_stage='claim_generation' to span 2 and escape_stage='serving_gate' to span 3 instead of summarizing only at root span 0?
---
Separating generation failure from serving-gate escape isolates whether the model drafted something false or the containment layer let a bad draft escape, guiding which service artifacts to compare during reproduction.
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
    "explanation": "Use the reviewed population for reviewed risk, reviewed substantive deliveries for conditional answer risk, and all ingress requests for coverage. Missing reviews cannot be counted as safe."
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
    "explanation": "A withheld payload cannot contain an unsafe served claim, even when its review is missing. B has one unchecked substantive delivery that could add one unsafe serve. These bounds concern unsafe delivery, not whether the withholdings were useful."
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
    "explanation": "A has 16 tokens after the first over 0.200 seconds, so 16/0.200 = 80. B has no later-token interval. A billed-token total or a multi-token chunk count would require a different measurement rule."
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
    "explanation": "Context identifies the actual calling operation. Repeated names do not merge operations or choose parents. The worker needs its own span ID; shared trace identity links it to the original request."
  },
  {
    "question": "A named rate card charges $2, $0.25, and $8 per million uncached-input, cached-input, and output tokens. A reports 500 total input including 180 cached, plus 25 output. B reports 501 cached out of 500 input. Which paired accounting result is valid?",
    "options": [
      "A: $0.001245. B: reject impossible usage.",
      "A: $0.000885. B: clamp cached input to 500.",
      "A: $0.000885. B: reject impossible usage.",
      "A: $0.000640. B: clamp cached input to 500."
    ],
    "answer": "A: $0.000885. B: reject impossible usage.",
    "explanation": "A has 320 uncached tokens: (320×2 + 180×0.25 + 25×8)/1,000,000 = $0.000885. Cached tokens are a subset of total input. B breaks that invariant; clamping would manufacture a different event."
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
    "explanation": "The exporter rejects r8 because the evidence lookup fails. The r7 record passes all three lookups, and `operator_note` is outside the fields the exporter writes. Both exporter checks pass. The log writer copies the billing text unchanged, so the redaction check fails. This writer needs a trusted source for its request IDs."
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
    "explanation": "Malformed operational channels do not erase an independently valid safety fact. Report their unknown status explicitly. The lab prints findings; production paging integration is a separate responsibility."
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
    "explanation": "Each unsafe trace represents one request, and each other trace represents five. The estimated unsafe rate is 3/(3 + 12 × 5) = 3/63, or about 4.76%. The stored share of 20% counts each trace once. Dividing 3 by 60 gives 5% because it leaves the unsafe requests out of the denominator. Another draw from the same window could keep a different number of other traces, so the weighted denominator is an estimate."
  },
  {
    "question": "A poller stops at four consecutive identical tool/operation/marker observations. Its latest markers for one operation are A,A,B,B,B. It has 9 seconds remaining, $0.08 available, and the next reservation is $0.09. Which budget decision follows?",
    "options": [
      "Reject for the repeat cap; the latest B run already contains four identical observations.",
      "Proceed; the new B marker reset the repeat count and also reset the spend reservation.",
      "Reject for spend; the latest repeat count is three and the time budget is still open.",
      "Proceed; only completed charges count, so a reservation above available spend is permissible."
    ],
    "answer": "Reject for spend; the latest repeat count is three and the time budget is still open.",
    "explanation": "Only the consecutive suffix matters, so B occurs three times and is below four. A changed marker does not reset time or money. The next $0.09 reservation exceeds $0.08 available before dispatch."
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
    "explanation": "Safety, coverage and usefulness are separate release gates. A correlated version change narrows investigation but does not identify a cause. Freeze the relevant inputs, model, policy, evaluator and artifacts for controlled replay, then use untouched representative holdout cases."
  }
]
```

> **Next:** Continue to [Experiment Tracking with MLflow and W&B](/learn/experiment-tracking-mlflow-wandb). You can now page on an unsafe serve and hand off the failing template, exemplar trace, and required metrics. Next you will turn those identifiers into controlled, tracked experiment runs.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
Every dashboard is green. The service returned HTTP 200 on all six requests in this window. First output arrived in about 240 ms at p95, well under the 500 ms warning. Cost is within budget. And two of those six answers told an engineer they had approval to deploy, when no such approval existed.

HTTP status and latency alone do not reveal this failure. The status says the server responded, and the latency chart says it responded quickly. Product-quality monitoring checks whether the response was true. Google's SRE guidance has a name for wrong content returned with a 200: an implicit error.[^sreMonitoringDistributedSystems] In an LLM system, it is the failure you should worry about most, because a model can be wrong in perfect grammar, at full speed, with nothing in standard logs to show for it.

Observability for these systems has to answer three questions: what did the user actually receive, how was it produced, and which exact versions produced it? By the end of this chapter you will know how to measure answer quality cleanly, trace one bad answer back to its cause, keep debugging evidence without hoarding private text, detect distributional shifts early, and set alerts someone can act on. Throughout the chapter we follow a small window of six requests (`trace-01` through `trace-06`) handled by an internal deployment-policy assistant.

## Start from what reached the user

Your safety gate might choose to serve an answer, shorten it, send it for review, or abstain. Counting those route labels and calling that your quality metric creates a blind spot, because the gate's own opinion of what it did is never independent verification. Inspect the payload the user received, or join an independently reviewed outcome back to the `request_id`.

Here is our six-request window, with outcomes reviewed independently:

| Request | Template | Route | Answer served? | Unsupported claim served? |
|---|---|---|---|---|
| trace-01 | strict v1 | serve | yes | no |
| trace-02, trace-03, trace-04 | strict v1 | abstain | no | no |
| trace-05 | regressed v1.1 | serve | yes | yes |
| trace-06 | regressed v1.1 | serve | yes | yes |

Keep two distinct concepts apart. A **defective draft** is a bad answer generated by the model, while a **failed containment** is a bad answer that reached a person. Requests `trace-02` and `trace-03` had defective drafts caught and withheld by the strict gate, and `trace-04` abstained because it lacked policy context. Those drafts warrant investigation, yet the safety gate held cleanly. Requests `trace-05` and `trace-06` are the incident because unsupported approvals escaped.

| Question | Field | Why it matters |
|---|---|---|
| Which route was chosen? | `route` | Serve, shorten, review, or abstain |
| Did an answer reach the person? | `substantive_output_served` | The observed payload beside the gate decision |
| Did an unsupported claim reach them? | `unsafe_claim_served` | An independent review verdict separate from the gate |
| Where did it first go wrong? | `first_failed_stage` | Separates retrieval gaps from generation defects |
| Which protection leaked? | `escape_stage` | Separates the draft defect from failed containment |
| Which versions were used? | `evidence_version`, `prompt_template_id` | Reproducibility metadata for replay |

Store `unsafe_claim_served` with three values rather than two: `False` means reviewed and clean, `True` means reviewed and unsafe, and `None` means nobody has verified it yet. Missing labels and evaluator timeouts remain `None`, representing unknown safety rather than confirmed safety.

<figure>
  <img src="illustrations/_generated/observability_dark.png" alt="Six reviewed requests include two unsafe serves and three abstentions; first-output and cost signals remain within their thresholds." />
  <figcaption>The last two requests (`trace-05` and `trace-06`) are the slowest of a fast set, and nothing about their timing looks wrong. Only the reviewed outcome reveals that they served unsafe answers.</figcaption>
</figure>

## Every rate needs a denominator

Two of the six reviewed requests leaked an unsupported claim (`33.3%`), whereas two of the three answers actually delivered were unsafe (`66.7%`). Both percentages are mathematically true because they answer different operational questions: the first summarizes how often reviewed traffic leaks overall, while the second states the chance that a user who received an answer got bad advice. Reporting `33%` to a user-facing product team cuts perceived risk in half. Equally important, sparse sampling can fool you completely: checking only two suspicious requests and finding both unsafe tells you `2/2` on inspected rows and nothing about unreviewed traffic, so always publish review coverage alongside every safety rate because missing labels remain unknown rather than safe.

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
assert len({request_id for request_id, _, _ in rows}) == len(rows)
reviewed = [row for row in rows if row[2] is not None]
served = [row for row in reviewed if row[1]]
unsafe = sum(row[2] is True for row in reviewed)
print(f"reviewed unsafe: {unsafe}/{len(reviewed)}")
print(f"served-answer risk: {unsafe}/{len(served)}")
assert unsafe == 2 and len(reviewed) == 6 and len(served) == 3
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reviewed unsafe: 2/6
served-answer risk: 2/3
```
<!-- leetllm: output:end -->

| Metric | Population | What it tells you |
|---|---|---|
| Unsafe-request rate | Reviewed requests | How often checked requests leak a bad claim |
| Unsafe-answer risk | Answers actually served | The risk a user who got an answer is exposed to |
| Review coverage | All ingress requests | How much of your traffic has verified outcomes |
| Abstention rate | All requests | How often the service declines to answer |
| Useful-answer rate | Reviewed answerable cases | Whether safety preserves product usefulness |

When delayed reviews arrive late, update the existing request record in place rather than appending a second row, which silently inflates the denominator and distorts safety rates. Always reconcile terminal trace events against an independent ingress counter so dropped collector batches register as a coverage gap rather than silent success. Running both checks together keeps denominators honest as evaluation traffic scales.

## Keep the old signals too

Quality comes first, yet Google's four golden signals (latency, traffic, errors, and saturation) remain indispensable when enriched with prompt lengths, output lengths, active stream counts, queue wait time, and [cache pressure](/learn/kv-cache-paged-attention-llm-serving). Split streaming latency into time to first visible token, inter-token gaps, post-first-token pacing, total completion time, and pre-token failures. For a 30-token reply whose first visible token lands at 240 ms and last at 455 ms, 29 subsequent intervals span 215 ms (`134.9 tokens/s`). Keep timing tied to visible tokens from one monotonic clock, never divide chunk durations by billed totals that include hidden reasoning tokens, leave single-token outputs undefined instead of inventing zero pacing, and always state sample size `N` beside any percentile because nearest-rank p95 over six points merely selects the slowest request (`240 ms`).

## Follow one request

Metrics identify a shift, traces isolate the failing operation inside one call, and logs record discrete events carrying a shared trace identifier. For `trace-05`, a single root span owns three child operations: retrieval (`deploy-policy@v17`), chat generation (`first_failed_stage=claim_generation`), and the serving gate (`escape_stage=serving_gate`). Keeping these operations separate prevents teams from confusing upstream draft hallucinations with missing containment checks.

<figure>
  <img src="illustrations/_generated/request_span_tree_dark.png" alt="One request root owns retrieval, model, and serving-gate spans, with generation and containment failures attached to different operations." />
  <figcaption>One request, three operations. The chat span records where the defect first appeared, and the serving-gate span records where it escaped.</figcaption>
</figure>

Propagate W3C Trace Context headers across queues and background workers so asynchronous execution stays linked under the caller's exact `span_id` even when tool names repeat.[^w3cTraceContext2021] Pin your OpenTelemetry GenAI attribute schema version while those conventions evolve, mark sensitive prompt and completion bodies opt-in, and leave high-cardinality `request_id` values out of metric labels.[^otelgenai2026][^otelgenaispans2026][^otelsensitivedata2026] Remember also that agent tool loops drive quadratic input-token growth (`calls * start + growth * calls * (calls - 1) // 2`) whenever each turn resends prior outputs, so enforce progress-aware repeat counters alongside hard runtime time and spend ceilings rather than waiting on trace retention to stop a stalled poller.

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

## Keep records without hoarding data and price usage cleanly

Long-lived operational records need `request_id`, release tag, policy version, template ID, route, reviewed verdict, latency, and token counts, whereas raw prompts and model outputs require explicit access, storage, and expiry rules. Remember that fields named `"id"` can still hold sensitive text, hashing guessable tokens fails privacy protection, and scrubbing downstream exporters cannot undo earlier unredacted buffers.[^otelsensitivedata2026] Store raw `input_tokens`, `cached_input_tokens`, and `output_tokens` separately from named rate cards so pricing updates never obscure historical cost explanations. For `trace-05` (`198` total input, `80` cached, `29` output at `$1.00 / $0.10 / $5.00` per million), uncached input is `198 - 80 = 118` tokens, yielding `$0.000271`; reject malformed records claiming more cached tokens than total input rather than clamping upstream bugs, and see [LLM cost engineering](/learn/llm-cost-engineering-token-economics) for full billing workflows.

## Alerts someone can act on

Every actionable alert carries concrete triage handles (`trace-05`, version tags, failure stage, escape stage, and first comparison step) and evaluates channels independently. If latency or usage collectors go silent during a safety failure, report the confirmed safety page first and surface unknown operational channels beside it so missing telemetry never masks an active incident. Having clear next steps attached directly to the page saves crucial minutes during an on-call response.

<!-- leetllm: test, output=show, id=reader-observe-alert-precedence -->
```python title="alert-precedence.py"
def findings(unsafe_count, observed, ingress, latency_known, usage_known):
    result = []
    if unsafe_count:
        result.append(f"PAGE unsupported claims served={unsafe_count}")
    if observed < ingress:
        result.append("UNKNOWN missing final outcomes")
    if not latency_known:
        result.append("UNKNOWN latency telemetry")
    if not usage_known:
        result.append("UNKNOWN usage telemetry")
    return result

result = findings(2, 5, 6, False, False)
assert result == [
    "PAGE unsupported claims served=2",
    "UNKNOWN missing final outcomes",
    "UNKNOWN latency telemetry",
    "UNKNOWN usage telemetry",
]
print("\n".join(result))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
PAGE unsupported claims served=2
UNKNOWN missing final outcomes
UNKNOWN latency telemetry
UNKNOWN usage telemetry
```
<!-- leetllm: output:end -->

## Detect distribution drift and undo sampling bias

Because human reviews always trail production traffic, track unlabeled shifts continuously using statistical distribution tests alongside sampling controls.[^potgieter2026psi][^scipyKs2Sample2026] Population Stability Index (PSI) bins current traffic against baseline quantiles, while the two-sample Kolmogorov-Smirnov test detects unbinned shifts across continuous scores or latencies. Similarly, whenever tail sampling retains 100% of unsafe traces and a small fraction `p` of routine requests, stored error shares jump sharply unless you inverse-weight routine traces by `1 / p` and keep pre-sampling total counters beside enriched traces.[^otelsampling2026][^otelTailSampling2026] Together, drift monitors and weighted sampling prevent silent blind spots across high-volume serving fleets.

<!-- leetllm: test, id=reader-observe-drift-ipw, deps=numpy,scipy, output=show, output_title="Latency drift (PSI + KS) and IPW sampling correction" -->
```python title="reader-drift-ipw.py"
import numpy as np
from scipy.stats import ks_2samp

rng = np.random.default_rng(7)
ref_ttft = rng.lognormal(mean=np.log(190.0), sigma=0.18, size=250)
shifted_ttft = rng.lognormal(mean=np.log(255.0), sigma=0.22, size=250)

edges = np.quantile(ref_ttft, np.linspace(0.0, 1.0, 11))
edges[0], edges[-1] = -np.inf, np.inf
p = np.clip(np.histogram(ref_ttft, bins=edges)[0] / len(ref_ttft), 1e-6, None)
q = np.clip(np.histogram(shifted_ttft, bins=edges)[0] / len(shifted_ttft), 1e-6, None)
psi = float(np.sum((q - p) * np.log(q / p)))
ks = ks_2samp(ref_ttft, shifted_ttft)

# Recover unbiased rate from tail-sampled traces (100% of unsafe, 25% of routine)
flagged, kept_routine, keep_p = 2, 1, 0.25
ipw_rate = flagged / (flagged + kept_routine / keep_p)
print(f"stored_unsafe={flagged / (flagged + kept_routine):.1%} ipw_rate={ipw_rate:.1%}")
print(f"latency_psi={psi:.3f} ks_stat={ks.statistic:.3f} ks_p={ks.pvalue:.2e}")
```

<!-- leetllm: output:start -->
```text title="Latency drift (PSI + KS) and IPW sampling correction" output compact
stored_unsafe=66.7% ipw_rate=33.3%
latency_psi=3.030 ks_stat=0.584 ks_p=7.99e-40
```
<!-- leetllm: output:end -->

```checkpoint
Your stored traces show 40% of answers flagged unsafe. Your sampler keeps every flagged trace and 5% of the others. What can you conclude about the real unsafe rate, and what should you have collected?
---
For 40 flagged and 60 routine kept traces, inverse-probability weighting gives 40 / (40 + 60/0.05) = 40/1240 ≈ 3.2%. This estimate still carries finite-window uncertainty and depends on accurate inclusion weights, no unrecorded drops, and pre-sampling total counters alongside diagnostic traces.
```

## From incident to fix

Bringing every piece together for the window: all four defective drafts under `deploy-answerer-v1` stayed contained, whereas both defective drafts under `deploy-answerer-v1.1-regression` (`trace-05` and `trace-06`) passed `serving_gate`.

<figure>
  <img src="illustrations/_generated/observability_metrics_triage_dark.png" alt="Two strict cases with generation defects are withheld, while two cases under the regressed template also escape the serving gate." />
  <figcaption>Both versions produced bad drafts. The difference is at the gate: one withheld them and the other let them through.</figcaption>
</figure>

Investigate cleanly in order: verify the conditional served-answer denominator (`2/3`), slice by version (`deploy-answerer-v1.1-regression`), inspect root-to-gate spans for `trace-05`, compare exact template, source, and gate configuration artifacts, and validate any mitigation against both incident replay and clean-case usefulness. Hand off the failing version, example trace (`trace-05`), evidence policy revision, and minimum usefulness floor directly into [Model versioning and deployment](/learn/model-versioning-continuous-deployment) and experiment tracking so a repaired candidate must prove recovery under fixed replay checks before promotion.

<!-- leetllm: edition:reader:end -->
