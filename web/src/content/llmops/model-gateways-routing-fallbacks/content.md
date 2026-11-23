---
{
  "id": "model-gateways-routing-fallbacks",
  "title": "Model Gateways, Routing, and Fallbacks",
  "slug": "model-gateways-routing-fallbacks",
  "section": "Applied LLM Engineering",
  "category": "MLOps & Deployment",
  "difficulty": "Medium",
  "order": 24,
  "companies": [
    "OpenAI",
    "Anthropic"
  ],
  "prerequisites": [
    "llm-cost-engineering-token-economics"
  ],
  "relatedQuestions": [
    "design-conversational-ai-support-bot",
    "agent-failure-states-retry-fallback",
    "observability-monitoring-llm-systems"
  ],
  "shortDescription": "Route requests across model lanes by privacy scope, schema capability, and EWMA latency without silently dropping constraints on fallback.",
  "keyConceptsTested": [
    "Application-to-gateway responsibility split",
    "Constraint-first routing and EWMA latency scoring",
    "Pre-output fallback eligibility and deadline propagation",
    "Circuit breakers for transport vs semantic failures",
    "Idempotent side effects and auditable route events"
  ],
  "coverImage": "social_banner.png"
}
---

<!-- leetllm: edition:reference:start -->
When a primary model stalls on a private customer billing review, an availability dashboard immediately favors switching to any healthy backup. If that backup returns plain prose without structured JSON fields or source citations, or runs outside your private virtual network, a fast fallback converts a transient timeout into a silent data leak or product failure. Returning an answer quickly never helps if the fallback strips away the properties the caller depends on.

A **model gateway** resolves this trade-off in one centralized layer instead of scattering vendor URLs and retry loops across application services. Your service submits one normalized request declaring its data privacy scope, token window, schema version, and citation rules, and every route faces those exact checks first. The gateway filters approved model endpoints against those rules, ranks survivors by observed latency, cost, and error rate, enforces shared request clocks and spend limits during retries, and logs every attempt for auditing.

![Model gateway policy filter and quality-latency Pareto frontier](./illustrations/_generated/model_gateway_dark.png)

Keeping gateway and application responsibilities distinct avoids tangled control flow later. The gateway owns endpoint translation, credential isolation, capability filtering, latency-weighted route scoring, pre-output retries, and per-provider circuit breakers. Your application retains ownership of user permissions, prompt construction, evidence grounding against caller-authorized records, and deciding whether a billing credit or state mutation should commit. Separating transport policy from business logic lets platform engineers swap models or adjust retry parameters without risking unauthorized refunds or ungrounded claims.

## Adapters, lanes, and wire-format differences

Three concepts organize gateway architecture cleanly, starting with how wire protocols map onto operational controls. An **adapter** translates an internal request format, including messages, tool definitions, schema settings, and cancellation signals, into one provider's HTTP wire protocol. A **lane** pairs a specific model checkpoint with an adapter, deployment region, network scope, and evaluated capability flags. The **gateway** evaluates incoming requests against registered lanes, selects the top candidate, and supervises any fallback sequence within fixed time and budget caps.

Treating a shared SDK interface as proof of interchangeability causes subtle production bugs when failover kicks in. Native structured-output fields vary across providers even for identical JSON schemas: OpenAI Responses expects `text.format` with `type: "json_schema"`, OpenAI Chat Completions uses `response_format`, and Claude Messages uses `output_config.format`.[^openai_structured_outputs][^anthropic2026StructuredOutputs] Compatibility wrappers add extra restrictions; Anthropic's OpenAI-compatible mode only honors `strict: true` under `json_schema`, ignores tool-level `strict` flags, and disables prompt caching.[^anthropic2026openaisdk] Even within a native API, structured JSON output can forbid mixing provider citation blocks with strict JSON formatting, requiring citation identifiers inside JSON fields instead. Because failures emerge at the intersection of model checkpoint, adapter, schema version, and privacy mode, teams must register evaluated capabilities per lane rather than trusting vendor feature sheets.[^litellm2026reliability] Keeping provider credentials sealed inside the gateway perimeter reinforces that separation: a valid key tells the upstream endpoint whom to bill, whereas your lane registry decides where private tenant data may travel.

<!-- leetllm: test, id=gw, deps=numpy, output=show -->
```python title="gateway-lane-filtering.py"
from dataclasses import dataclass
from enum import Enum
import numpy as np


class DataScope(str, Enum):
    PUBLIC = "public"
    PRIVATE_VPC = "private_vpc"


@dataclass(frozen=True)
class ModelLane:
    name: str
    provider: str
    data_scope: DataScope
    max_context_tokens: int
    supports_schema: bool
    supports_citations: bool
    input_per_1k_usd: float
    output_per_1k_usd: float
    base_latency_ms: float
    eval_pass_rate: float

    def estimate_cost_usd(self, input_tokens: int, output_tokens: int) -> float:
        return (
            (input_tokens / 1000.0) * self.input_per_1k_usd
            + (output_tokens / 1000.0) * self.output_per_1k_usd
        )


@dataclass(frozen=True)
class RequestSpec:
    request_id: str
    data_scope: DataScope
    input_tokens: int
    max_output_tokens: int
    requires_schema: bool
    requires_citations: bool
    requires_human_review_tag: bool
    deadline_ms: int = 2000
    max_attempt_usd: float = 0.010
    max_request_usd: float = 0.020


LANES = [
    ModelLane("fast-public-8b", "hosted-alpha", DataScope.PUBLIC, 32_000, True, False, 0.0002, 0.0006, 360.0, 0.84),
    ModelLane("public-cited-70b", "hosted-alpha", DataScope.PUBLIC, 128_000, True, True, 0.0012, 0.0036, 820.0, 0.94),
    ModelLane("private-vpc-70b", "vpc-primary", DataScope.PRIVATE_VPC, 64_000, True, True, 0.0015, 0.0050, 920.0, 0.95),
    ModelLane("private-vpc-8b", "vpc-backup", DataScope.PRIVATE_VPC, 32_000, True, True, 0.0005, 0.0018, 490.0, 0.86),
    ModelLane("private-vpc-plain", "vpc-backup", DataScope.PRIVATE_VPC, 64_000, False, False, 0.0004, 0.0012, 410.0, 0.78),
]


def compatible_lanes(req: RequestSpec, lanes: list[ModelLane]) -> list[ModelLane]:
    total_tokens = req.input_tokens + req.max_output_tokens
    allowed_scopes = (
        {DataScope.PRIVATE_VPC}
        if req.data_scope is DataScope.PRIVATE_VPC
        else {DataScope.PUBLIC, DataScope.PRIVATE_VPC}
    )
    matches = []
    for lane in lanes:
        if lane.data_scope not in allowed_scopes:
            continue
        if total_tokens > lane.max_context_tokens:
            continue
        if req.requires_schema and not lane.supports_schema:
            continue
        if req.requires_citations and not lane.supports_citations:
            continue
        if lane.estimate_cost_usd(req.input_tokens, req.max_output_tokens) > req.max_attempt_usd:
            continue
        matches.append(lane)
    return matches


billing_review = RequestSpec(
    request_id="req-credit-01",
    data_scope=DataScope.PRIVATE_VPC,
    input_tokens=2200,
    max_output_tokens=300,
    requires_schema=True,
    requires_citations=True,
    requires_human_review_tag=True,
)
eligible = compatible_lanes(billing_review, LANES)
print("Eligible lanes for private cited review:")
for lane in eligible:
    est = lane.estimate_cost_usd(billing_review.input_tokens, billing_review.max_output_tokens)
    print(f"  {lane.name:18s} | est=${est:.5f} | base={lane.base_latency_ms:.0f}ms | eval={lane.eval_pass_rate:.0%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Eligible lanes for private cited review:
  private-vpc-70b    | est=$0.00480 | base=920ms | eval=95%
  private-vpc-8b     | est=$0.00164 | base=490ms | eval=86%
```
<!-- leetllm: output:end -->

Notice how `private-vpc-plain` and both public lanes disappear immediately before any latency or price ranking runs. Keeping hard exclusions in a deterministic filter guarantees an overloaded primary cluster never triggers an accidental fallback to a non-VPC or plain-text model. When requirements grow stricter over time, adding a new capability flag in `compatible_lanes` protects every request type across the fleet uniformly.

## Constraint-first filtering and EWMA latency scoring

Once incompatible endpoints are stripped away, static price or accuracy sorting still leaves tail reliability on the table. A primary endpoint whose tail latency climbs from 900 ms to 2,500 ms during an upstream bottleneck technically stays the top choice on a static list until requests begin timing out in flight. Real production gateways track live performance per lane using **Exponentially Weighted Moving Averages (EWMA)** so route weights adapt within a handful of slow calls:

$$
\hat{L}_t = (1 - \alpha)\,\hat{L}_{t-1} + \alpha\,L_t, \qquad \hat{E}_t = (1 - \alpha)\,\hat{E}_{t-1} + \alpha\,\mathbb{I}(\text{transport fault}_t)
$$

In these recurrences, $\alpha \in (0, 1)$ determines how aggressively recent observations replace historical averages. A smoothing constant around $\alpha = 0.25$ puts roughly 75% of the weight on the last five requests, letting the score react within seconds to provider congestion without oscillating wildly on one stray slow response.[^routellm2024] Combining normalized EWMA latency, estimated dollar cost, EWMA error penalty, and offline evaluation quality yields a compact scalar score that shifts load smoothly toward healthy backups before a hard outage even opens a circuit breaker.

<!-- leetllm: test, id=gw-ewma, continue=gw, deps=numpy, output=show -->
```python title="ewma-lane-scoring.py"
class LaneTelemetry:
    def __init__(self, lanes: list[ModelLane], alpha: float = 0.25):
        self.alpha = alpha
        self.ewma_latency = {lane.name: lane.base_latency_ms for lane in lanes}
        self.ewma_error = {lane.name: 0.02 for lane in lanes}

    def record(self, lane_name: str, latency_ms: float, transport_error: bool) -> None:
        a = self.alpha
        self.ewma_latency[lane_name] = (1 - a) * self.ewma_latency[lane_name] + a * latency_ms
        err = 1.0 if transport_error else 0.0
        self.ewma_error[lane_name] = (1 - a) * self.ewma_error[lane_name] + a * err

    def rank(self, req: RequestSpec, candidates: list[ModelLane]) -> list[tuple[float, ModelLane]]:
        if not candidates:
            return []
        costs = np.array([l.estimate_cost_usd(req.input_tokens, req.max_output_tokens) for l in candidates])
        lats = np.array([self.ewma_latency[l.name] for l in candidates])
        errs = np.array([self.ewma_error[l.name] for l in candidates])
        quals = np.array([l.eval_pass_rate for l in candidates])

        # Lower score wins: balance normalized latency, normalized cost, error rate, and quality gap
        norm_lat = lats / max(req.deadline_ms, 1)
        norm_cost = costs / max(req.max_attempt_usd, 1e-6)
        utility = 0.45 * norm_lat + 0.20 * norm_cost + 2.50 * errs + 1.20 * (1.0 - quals)
        order = np.argsort(utility, kind="stable")
        return [(float(utility[i]), candidates[i]) for i in order]


telemetry = LaneTelemetry(LANES)
for score, lane in telemetry.rank(billing_review, eligible):
    print(f"Healthy rank  | {lane.name:16s} | score={score:.3f} | ewma_lat={telemetry.ewma_latency[lane.name]:.0f}ms")

# Simulate 5 slow timeouts hitting private-vpc-70b
for obs in [1850.0, 2100.0, 2000.0, 1950.0, 2050.0]:
    telemetry.record("private-vpc-70b", obs, transport_error=True)

print()
for score, lane in telemetry.rank(billing_review, eligible):
    print(f"Degraded rank | {lane.name:16s} | score={score:.3f} | ewma_lat={telemetry.ewma_latency[lane.name]:.0f}ms | err={telemetry.ewma_error[lane.name]:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Healthy rank  | private-vpc-8b   | score=0.361 | ewma_lat=490ms
Healthy rank  | private-vpc-70b  | score=0.413 | ewma_lat=920ms

Degraded rank | private-vpc-8b   | score=0.361 | ewma_lat=490ms | err=0.02
Degraded rank | private-vpc-70b  | score=2.467 | ewma_lat=1746ms | err=0.77
```
<!-- leetllm: output:end -->

Look closely at the shift in ordering between healthy and degraded state in the output. When both private lanes are healthy, `private-vpc-70b` leads comfortably because its higher evaluation pass rate outweighs its moderate extra latency and cost. Once five consecutive slow failures hit the primary cluster, its EWMA latency doubles and its error penalty climbs, allowing `private-vpc-8b` to step forward smoothly before a full outage occurs.

## Safe fallback timing and budget propagation

Not every failure encountered during inference can be retried silently on a backup model. Designers must draw a strict boundary in execution state between **pre-output failures**, where zero visible tokens have reached the caller, and **post-output failures**, where streaming has already started:

![Fallback retry under shared deadline and spend ceiling](./illustrations/_generated/fallback_budget_timeline_dark.png)

If an upstream provider returns HTTP 429, HTTP 503, a connection reset, or a timeout before any output token leaves the adapter, retrying an eligible backup lane stays invisible to downstream consumers. Once even a single streamed token has been emitted, or once an attempt times out after producing partial JSON or partial tool-call arguments, retrying transparently would splice incompatible responses together or risk duplicating external actions. Authentication errors (401/403), safety refusals, and JSON schema mismatches also abort automatic lane retries because failing over across models masks real credential issues or prompt defects.[^awsbackoff]

Whenever a transparent pre-output fallback is permitted, two shared request budgets propagate strictly across attempts:
1. **Shared request deadline.** Never issue a fresh 2,000 ms timeout for the backup attempt. Subtract all elapsed time and backoff delay (`elapsed`), and prune any fallback whose expected finish time (`elapsed + delay + ewma_latency`) meets or exceeds the original deadline.
2. **Cumulative spend limit.** Whenever a prior attempt incurred partial upstream charges, subtract that spend from `max_request_usd` before authorizing another attempt. A \$0.01 single-generation cap therefore pairs naturally with a \$0.02 two-attempt request ceiling whenever automatic fallback is enabled; otherwise attempt two is declined even with clock left on the request.
3. **Full-jitter backoff.** When multiple clients hit a rate-limited endpoint together, deterministic retry timers synchronize load spikes across retries. Sampling delay uniformly from `[0, min(cap, base * 2**attempt)]` spreads recovery load smoothly across time so congested providers drain queues faster.[^awsRetriesJitter2026]

## Circuit breakers and outage simulation

Single-request fallbacks protect latency only one call at a time, leaving every new request to wait a full second for a timeout during a prolonged brownout. A **circuit breaker** eliminates that wasted wait locally across all incoming traffic while an upstream dependency heals:

![EWMA circuit breaker state machine and outage recovery curve](./illustrations/_generated/circuit_breaker_state_dark.png)

Three states govern how traffic interacts with a provider endpoint:
- **CLOSED:** Normal routing applies while the breaker updates EWMA fault rates and consecutive transport failure counters. Crossing the burst threshold or EWMA fault ceiling trips the circuit to **OPEN**.
- **OPEN:** Incoming calls fail locally in sub-millisecond time without touching the network or exhausting attempt budgets, routing traffic directly to eligible backup lanes during a cooldown interval.
- **HALF_OPEN:** Once cooldown elapses, the gateway allows one time-capped probe request through to test recovery. A clean transport completion restores **CLOSED**, whereas another transport fault immediately re-opens the circuit for a fresh cooldown interval.

Crucially, semantic validation defects such as missing JSON fields or invalid citations never increment transport failure counters. Keeping transport availability orthogonal to response quality prevents a broken prompt template from shutting off an otherwise healthy inference cluster. Let's simulate a 300-request production burst using NumPy where `vpc-primary` suffers a sustained outage between requests 90 and 160 before recovering, comparing a static ranker against EWMA scoring paired with a circuit breaker.

<!-- leetllm: test, id=gw-sim, continue=gw-ewma, deps=numpy, output=show -->
```python title="circuit-breaker-outage-sim.py"
class CircuitStatus(str, Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    def __init__(self, fail_threshold: int = 4, ewma_trip: float = 0.35, cooldown_s: float = 30.0):
        self.fail_threshold = fail_threshold
        self.ewma_trip = ewma_trip
        self.cooldown_s = cooldown_s
        self.status: dict[str, CircuitStatus] = {}
        self.opened_at: dict[str, float] = {}
        self.consec_fails: dict[str, int] = {}
        self.probe_in_flight: dict[str, bool] = {}

    def allow(self, provider: str, now_s: float) -> bool:
        st = self.status.get(provider, CircuitStatus.CLOSED)
        if st is CircuitStatus.CLOSED:
            return True
        if st is CircuitStatus.OPEN:
            if now_s - self.opened_at.get(provider, 0.0) >= self.cooldown_s:
                self.status[provider] = CircuitStatus.HALF_OPEN
                self.probe_in_flight[provider] = True
                return True
            return False
        if not self.probe_in_flight.get(provider, False):
            self.probe_in_flight[provider] = True
            return True
        return False

    def observe(self, provider: str, transport_ok: bool, ewma_err: float, now_s: float) -> None:
        self.probe_in_flight[provider] = False
        if transport_ok:
            self.status[provider] = CircuitStatus.CLOSED
            self.consec_fails[provider] = 0
            return
        self.consec_fails[provider] = self.consec_fails.get(provider, 0) + 1
        if self.status.get(provider, CircuitStatus.CLOSED) is CircuitStatus.HALF_OPEN:
            self.status[provider] = CircuitStatus.OPEN
            self.opened_at[provider] = now_s
        elif self.consec_fails[provider] >= self.fail_threshold or ewma_err >= self.ewma_trip:
            self.status[provider] = CircuitStatus.OPEN
            self.opened_at[provider] = now_s


def simulate_workload(use_ewma_breaker: bool, seed: int = 42) -> dict[str, float]:
    rng = np.random.default_rng(seed)
    n_requests = 300
    tel = LaneTelemetry(LANES, alpha=0.25)
    breaker = CircuitBreaker(fail_threshold=4, ewma_trip=0.35, cooldown_s=20.0)

    latencies = []
    spends = []
    successes = 0
    breaker_skips = 0
    now_s = 0.0

    for step in range(n_requests):
        now_s += float(rng.uniform(0.6, 1.4))  # ~1 req/s arrival
        outage = 90 <= step < 160
        candidates = compatible_lanes(billing_review, LANES)
        if use_ewma_breaker:
            ordered = [lane for _, lane in tel.rank(billing_review, candidates)]
        else:
            ordered = sorted(candidates, key=lambda l: -l.eval_pass_rate)

        elapsed_ms = 0.0
        spend_usd = 0.0
        served = False

        for attempt_idx, lane in enumerate(ordered):
            if attempt_idx >= 2 or elapsed_ms >= billing_review.deadline_ms:
                break
            est_cost = lane.estimate_cost_usd(billing_review.input_tokens, billing_review.max_output_tokens)
            if spend_usd + est_cost > billing_review.max_request_usd:
                break
            if attempt_idx > 0 and tel.ewma_latency[lane.name] + elapsed_ms >= billing_review.deadline_ms:
                continue
            if use_ewma_breaker and not breaker.allow(lane.provider, now_s):
                breaker_skips += 1
                continue

            # Sample provider latency & pre-output failure
            if lane.provider == "vpc-primary" and outage:
                failed = True
                raw_ms = float(rng.uniform(1100.0, 1400.0))
                billed = 0.0
            else:
                failed = bool(rng.random() < 0.02)
                raw_ms = float(lane.base_latency_ms * rng.lognormal(mean=0.0, sigma=0.22))
                billed = 0.0 if failed else est_cost

            remaining = billing_review.deadline_ms - elapsed_ms
            step_ms = min(raw_ms, remaining)
            elapsed_ms += step_ms
            spend_usd += billed

            if raw_ms >= remaining:
                failed = True

            if use_ewma_breaker:
                tel.record(lane.name, step_ms, transport_error=failed)
                breaker.observe(lane.provider, not failed, tel.ewma_error[lane.name], now_s)

            if not failed:
                served = True
                break

        successes += int(served)
        latencies.append(elapsed_ms)
        spends.append(spend_usd)

    lat_arr = np.array(latencies)
    spend_arr = np.array(spends)
    return {
        "availability": successes / n_requests,
        "p50_ms": float(np.percentile(lat_arr, 50)),
        "p95_ms": float(np.percentile(lat_arr, 95)),
        "mean_usd_per_1k": float(spend_arr.mean() * 1000.0),
        "breaker_skips": float(breaker_skips),
    }


baseline = simulate_workload(use_ewma_breaker=False)
protected = simulate_workload(use_ewma_breaker=True)
print("Static ranker :", {k: round(v, 3) for k, v in baseline.items()})
print("EWMA + breaker:", {k: round(v, 3) for k, v in protected.items()})
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Static ranker : {'availability': 0.99, 'p50_ms': 983.845, 'p95_ms': 1894.734, 'mean_usd_per_1k': 4.01, 'breaker_skips': 0.0}
EWMA + breaker: {'availability': 0.997, 'p50_ms': 532.242, 'p95_ms': 1083.24, 'mean_usd_per_1k': 2.224, 'breaker_skips': 0.0}
```
<!-- leetllm: output:end -->

During the 70-request outage window, the static ranker stalls over a second on `vpc-primary` for every single call before falling back, pushing overall p95 latency straight up toward 1,900 ms. Enabling EWMA telemetry and circuit breaking cuts p95 tail latency dramatically by skipping doomed primary calls during cooldown while keeping overall request availability high. Notice too how average cost per thousand requests drops when traffic shifts cleanly onto healthy backups without burning dead timeouts.

## Post-generation validation and idempotent side effects

Even after a healthy lane finishes inside clock and spend budgets, transport success does not guarantee application safety. The gateway normalizes token counts, finish reasons, and refusal payloads, checks response fields against the versioned JSON schema, and hands the parsed record back to your application. Two downstream safeguards stay cleanly outside transport retries:

1. **Application grounding and authorization:** Your service must confirm that every cited document identifier appears in passages the current user is permitted to inspect and actually supports the answer text. A language model must never validate its own escalation state by setting `"review": "approved"`, and any automated workflow engine verifies account entitlements independently before mutating records.
2. **Idempotency for state-changing tools:** Repeating pure text generation after a pre-output stall is safe, whereas re-executing a refund or support-ticket mutation creates duplicate ledger writes. Every consequential tool invocation uses a deterministic idempotency key derived from `(request_id, operation_name, canonical_payload)` paired with a stored transaction table so retried explanation turns read back the already-committed write result instead of repeating the mutation.[^awsIdempotentApis2026]

<!-- leetllm: test, id=gw-idemp, continue=gw-sim, deps=numpy, output=show -->
```python title="gateway-validation-idempotency.py"
import hashlib
import json


REQUIRED_FIELDS = {"schema", "status", "answer", "citations", "review"}


def validate_structured_reply(payload: dict, allowed_sources: set[str]) -> tuple[bool, str]:
    missing = REQUIRED_FIELDS - payload.keys()
    if missing:
        return False, f"missing_fields:{sorted(missing)}"
    if payload["schema"] != "cited-support-answer-v3":
        return False, "wrong_schema_version"
    if payload["review"] != "pending":
        return False, "invalid_review_status"
    cites = payload["citations"]
    if not cites or not all(c in allowed_sources for c in cites):
        return False, "unauthorized_or_empty_citations"
    return True, "ok"


class IdempotentWriteLedger:
    def __init__(self):
        self._records: dict[str, tuple[str, dict]] = {}

    @staticmethod
    def payload_hash(params: dict) -> str:
        encoded = json.dumps(params, sort_keys=True).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()[:12]

    def execute_once(self, op_key: str, params: dict) -> dict:
        digest = self.payload_hash(params)
        if op_key in self._records:
            saved_digest, saved_result = self._records[op_key]
            if saved_digest != digest:
                raise ValueError(f"Idempotency mismatch on key {op_key}")
            return {**saved_result, "replayed_from_ledger": True}
        result = {"write_id": f"wr_{digest[:6]}", "status": "committed", "replayed_from_ledger": False}
        self._records[op_key] = (digest, result)
        return result


good_reply = {
    "schema": "cited-support-answer-v3",
    "status": "complete",
    "answer": "Escalate billing discrepancy to human specialist.",
    "citations": ["DOC-41"],
    "review": "pending",
}
bad_self_approve = {**good_reply, "review": "approved"}

print("Valid check :", validate_structured_reply(good_reply, {"DOC-41", "DOC-42"}))
print("Self-approve:", validate_structured_reply(bad_self_approve, {"DOC-41", "DOC-42"}))

ledger = IdempotentWriteLedger()
first = ledger.execute_once("req-credit-01:queue-review", {"account": "acct-902", "amount_usd": 45})
retry = ledger.execute_once("req-credit-01:queue-review", {"account": "acct-902", "amount_usd": 45})
print("First write :", first)
print("Retry write :", retry)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Valid check : (True, 'ok')
Self-approve: (False, 'invalid_review_status')
First write : {'write_id': 'wr_84f462', 'status': 'committed', 'replayed_from_ledger': False}
Retry write : {'write_id': 'wr_84f462', 'status': 'committed', 'replayed_from_ledger': True}
```
<!-- leetllm: output:end -->

Notice why `validate_structured_reply` rejects self-approved responses locally without tripping `CircuitBreaker`: semantic mistakes indicate a prompt or evaluation gap rather than an unreachable server. Meanwhile, `IdempotentWriteLedger` demonstrates why retries across explanation turns stay harmless once tool writes commit under deterministic parameter hashes. Even if a network hiccup interrupts formatting after the write succeeds, reading back the ledger entry returns the same confirmation ID cleanly.

## Operational summary and mastery check

A production model gateway unifies capability rules, shared deadlines, cumulative spend ceilings, and provider health into one enforceable routing loop. Hard constraint filtering blocks incompatible backups from weakening privacy or schema guarantees, EWMA latency and error scoring steer load smoothly around congestion, circuit breakers protect tail latency during multi-minute provider outages, and structured validation plus idempotency keys separate semantic defects from network retries.

```mastery-quiz
[
  {
    "question": "A private customer request requires VPC isolation, a 64,000-token window, structured JSON output, and citations. The primary private lane stalls before emitting any tokens. Which fallback option is safe to try automatically?",
    "options": [
      "A fast public lane that supports JSON schemas, citations, and 128,000 tokens.",
      "A smaller private VPC lane with verified JSON schema support, citations, 64,000 tokens, and enough remaining time and budget.",
      "A private VPC lane that returns plain text so citations can be added with regex post-processing.",
      "Retrying the primary lane immediately with a fresh full deadline regardless of the spend ceiling."
    ],
    "answer": "A smaller private VPC lane with verified JSON schema support, citations, 64,000 tokens, and enough remaining time and budget.",
    "explanation": "Fallback selection must pass the exact same hard capability and privacy filter as the primary request, then satisfy remaining deadline and cumulative spend caps."
  },
  {
    "question": "An upstream model streams the first 25 tokens of a response and then hits a connection drop. How should the gateway respond?",
    "options": [
      "Switch silently to the backup lane and append the backup's tokens to the stream.",
      "Discard the first 25 tokens cleanly in the gateway and transparently retry if the client hasn't acknowledged.",
      "Stop the stream and propagate an error without silent retry, recording a transport fault on the provider.",
      "Keep the provider circuit CLOSED because partial tokens proved reachability."
    ],
    "answer": "Stop the stream and propagate an error without silent retry, recording a transport fault on the provider.",
    "explanation": "Once any output reaches the downstream consumer, silently retrying splices incompatible completions or hides partial execution; mid-stream drops still count as transport faults for the breaker."
  },
  {
    "question": "A request shares a 2,000 ms overall deadline. The primary lane fails before output at 1,100 ms. One backup lane has an EWMA latency of 1,050 ms and another has an EWMA latency of 520 ms. With 50 ms backoff delay, what should the gateway do?",
    "options": [
      "Try the 1,050 ms backup with its timeout clamped to 900 ms.",
      "Skip the 1,050 ms backup (1,100 + 50 + 1,050 = 2,200 ms > 2,000 ms) and call the 520 ms backup with an 850 ms remaining deadline.",
      "Reset the request clock to 2,000 ms so the 1,050 ms backup can finish normally.",
      "Escalate immediately without calling either backup because more than half the budget is spent."
    ],
    "answer": "Skip the 1,050 ms backup (1,100 + 50 + 1,050 = 2,200 ms > 2,000 ms) and call the 520 ms backup with an 850 ms remaining deadline.",
    "explanation": "Elapsed time plus backoff leaves 850 ms of usable budget. Skipping the 1,050 ms backup avoids a predictable timeout and spends no attempt, allowing the 520 ms backup to complete inside the shared ceiling."
  },
  {
    "question": "A hosted provider responds with HTTP 200 OK in 450 ms, but three consecutive responses contain malformed JSON missing a required field. What should happen to that provider's circuit breaker?",
    "options": [
      "Trip the breaker to OPEN immediately so traffic stops hitting a buggy model.",
      "Leave the breaker CLOSED because transport succeeded, and surface the schema validation failure to prompt/capability review.",
      "Move the breaker to HALF_OPEN until a manual operator resets it.",
      "Disable structured output checks on the fallback lane so requests succeed."
    ],
    "answer": "Leave the breaker CLOSED because transport succeeded, and surface the schema validation failure to prompt/capability review.",
    "explanation": "Circuit breakers isolate unreachable or timing-out infrastructure. Semantic and formatting errors reflect model capability or prompt issues and require evaluation review rather than transport blacklisting."
  },
  {
    "question": "A state-changing tool write succeeded under an idempotency key, after which answer generation timed out before producing user-visible text. How should the system recover?",
    "options": [
      "Replay both the state-changing write and answer generation together so they stay synchronized.",
      "Retry answer generation only using the stored outcome of the idempotent write key.",
      "Roll back the database write automatically inside the gateway retry loop.",
      "Skip idempotency keys whenever a circuit breaker is in HALF_OPEN state."
    ],
    "answer": "Retry answer generation only using the stored outcome of the idempotent write key.",
    "explanation": "Generation retries do not roll back committed actions. Isolating side effects behind deterministic idempotency keys lets explanation layers safely retry without duplicating mutations."
  }
]
```

> **Next:** Continue to [Design an Automated Support Agent](/learn/design-conversational-ai-support-bot). Wire this gateway directly into retrieval pipelines, scoped tool actions, and human handoff workflows while keeping model routing logic cleanly decoupled from business rules.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
Your primary model times out while preparing a confidential credit-review response. A cheaper backup model sits healthy and idle in another lane, ready to answer in half the time, yet it emits plain prose with no source citations and no human-review flag. Letting that fallback answer keeps availability metrics bright green while silently turning a transient vendor stall into an application bug that leaks ungrounded advice. Returning any answer quickly never helps if the fallback strips away the guarantees the calling workflow relies on.

A **model gateway** prevents silent downgrades by enforcing one set of guarantees across every endpoint. Your application sends a normalized request specifying privacy scope, token window, schema version, citation rules, deadline, and spend ceiling. The gateway filters registered routes against those requirements first, ranks surviving lanes by live performance and price, supervises pre-output retries under shared limits, and records every attempt for auditability. You could embed identical logic inside a shared service library, provided that one canonical layer owns the policy so product promises never drift across endpoints.

![Model gateway policy filter and quality-latency Pareto frontier](./illustrations/_generated/model_gateway_dark.png)

Throughout this chapter we trace a confidential customer credit-review request requiring private VPC execution, roughly 2,200 input tokens, and a 300-token output cap. From the previous chapter it inherits the required JSON structure, source-citation fields, human review triage, and the one-cent single-generation ceiling. The gateway catalog below pairs per-tier latencies, token tariffs, and VPC compliance flags so we can trace timeout and budget enforcement under load.

## Translation and permission are separate jobs

Keeping three concepts distinct clears up most gateway architecture confusion. An **adapter** translates your internal prompts, tool definitions, and output constraints into one vendor's HTTP wire protocol. A **lane** pairs a specific model checkpoint with an adapter, network placement, and evaluated feature flags. The **gateway** evaluates incoming requests against registered lanes, selects the top candidate, and supervises any fallback sequence.

Shared request shapes mislead teams when models fail over under pressure. OpenAI Responses configures structured JSON via `text.format` with `type: "json_schema"`, Chat Completions reads `response_format`, and Claude Messages uses `output_config.format`.[^openai_structured_outputs][^anthropic2026StructuredOutputs] Compatibility layers carry extra quirks: Anthropic's OpenAI-compatible surface honors `json_schema` only when `strict: true`, ignores tool-level strictness flags, and disables prompt caching, while native structured JSON can restrict mixing native citation blocks with `output_config.format`.[^anthropic2026openaisdk] Testing evaluated combinations of checkpoint, adapter, and schema per lane prevents subtle surprises during an outage.[^litellm2026reliability] Keeping vendor API keys sealed inside the gateway perimeter reinforces that safeguard: credentials tell an upstream vendor whom to bill, while lane metadata decides where tenant records are allowed to travel.

## Filter before ranking by cost or latency

Before ranking routes by speed or price, a gateway evaluates hard pass/fail requirements across every registered lane so no overloaded cluster ever spills onto an unsafe backup. Private VPC workloads strip out all external public endpoints regardless of price, while any endpoint whose context window falls short of prompt plus output tokens is removed rather than silently truncating evidence. Surviving lanes must also pass verified JSON schema compatibility, inline citation support, and the per-generation one-cent cost ceiling for the requested token envelope. Every rule runs deterministically on lane attributes before traffic statistics are even consulted.

Among eligible survivors, static price or accuracy sorting still leaves reliability on the table during upstream congestion. If a primary cluster stalls, a hardcoded primary-first table keeps hammering the slow endpoint until timeouts pile up. Tracking an **Exponentially Weighted Moving Average (EWMA)** of latency and transport error rate lets the gateway shift traffic gradually along the quality-latency Pareto frontier as latency rises.[^routellm2024] Within four or five delayed calls, EWMA scoring smoothly demotes the congested primary in favor of a healthy backup well before requests stack up against hard timeouts.

<!-- leetllm: test, output=show, id=reader-gateway-routing, deps=numpy -->
```python title="reader-gateway-ewma-routing.py"
import numpy as np

lanes = [
    {"name": "fast-public-8b",    "vpc": False, "cited": True,  "cost_usd": 0.0006, "lat_ms": 360.0, "err": 0.02, "eval": 0.84},
    {"name": "private-vpc-plain", "vpc": True,  "cited": False, "cost_usd": 0.0012, "lat_ms": 410.0, "err": 0.02, "eval": 0.78},
    {"name": "private-vpc-70b",   "vpc": True,  "cited": True,  "cost_usd": 0.0048, "lat_ms": 920.0, "err": 0.02, "eval": 0.95},
    {"name": "private-vpc-8b",    "vpc": True,  "cited": True,  "cost_usd": 0.0016, "lat_ms": 490.0, "err": 0.02, "eval": 0.86},
]

# Filter first: private VPC + citation support + <= $0.010 single-call cap
eligible = [l for l in lanes if l["vpc"] and l["cited"] and l["cost_usd"] <= 0.010]
ewma_70b = 920.0
for step, sample_ms in enumerate([940.0, 2100.0, 2400.0, 2600.0], start=1):
    ewma_70b = 0.75 * ewma_70b + 0.25 * sample_ms
    scores = np.array([
        (ewma_70b / 1000.0 if l["name"] == "private-vpc-70b" else l["lat_ms"] / 1000.0)
        + 5.0 * l["err"] + 6.0 * (1.0 - l["eval"])
        for l in eligible
    ])
    winner = eligible[int(np.argmin(scores))]["name"]
    print(f"call {step}: primary_ewma={ewma_70b:6.1f}ms -> top_route={winner}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
call 1: primary_ewma= 925.0ms -> top_route=private-vpc-70b
call 2: primary_ewma=1218.8ms -> top_route=private-vpc-8b
call 3: primary_ewma=1514.1ms -> top_route=private-vpc-8b
call 4: primary_ewma=1785.5ms -> top_route=private-vpc-8b
```
<!-- leetllm: output:end -->

## Safe fallbacks under a shared clock and spend cap

Fallback rules split cleanly around a single moment in execution: whether any token has already been published downstream. If a model fails before emitting output tokens through HTTP 429 rate limits, HTTP 503 overloads, connection drops, or pre-token timeouts, retrying an eligible backup stays invisible to the caller. Once partial text streams out to the user, silently switching routes would splice incompatible answers together, so the gateway halts immediately and returns an error to the application. Authentication errors (401/403), safety refusals, and JSON parsing failures also skip automatic retries because swapping models cannot mend bad credentials or flawed prompts.[^awsbackoff]

![Fallback retry under shared deadline and spend ceiling](./illustrations/_generated/fallback_budget_timeline_dark.png)

Whenever a pre-output fallback is valid, the gateway never grants a fresh clock or fresh wallet. Subtracting elapsed milliseconds and randomized backoff delay from the original 2,000 ms deadline leaves only the true remaining window, ensuring slow backups that cannot finish in time are skipped cleanly instead of wasted on predictable timeouts. Equally important, cumulative spending across attempts checks against the two-cent two-attempt request ceiling so automatic failover never bypasses per-generation cost controls. Pairing that check with full random jitter spreads retry traffic across time so concurrent clients do not crush a recovering provider in synchronized spikes.[^awsRetriesJitter2026]

## Circuit breakers isolate transport outages cleanly

Per-request retries soften isolated stalls, whereas a **circuit breaker** saves the entire fleet from burning timeout seconds during sustained upstream outages. Under normal operation (**CLOSED**), traffic flows to the highest-ranked lane while EWMA transport error rates update continuously. Crossing a consecutive-failure limit or EWMA fault threshold flips the breaker **OPEN**, failing calls to that provider locally in under a millisecond for a cooldown window so compatible fallbacks take over immediately. Once cooldown ends, **HALF_OPEN** allows a single timed probe request; a healthy transport response closes the breaker again, while another transport fault restarts the cooldown timer. Crucially, invalid JSON or missing citations never count toward breaker failures because semantic errors signal prompt or evaluation issues rather than dead infrastructure.

![EWMA circuit breaker state machine and outage recovery curve](./illustrations/_generated/circuit_breaker_state_dark.png)

## Output validation and downstream handoff

Once a compatible lane returns within time and cost budgets, the gateway validates structural JSON fields before returning control upstream. It checks required keys, schema versions, normalized finish reasons, and token counts, rejecting partial or malformed completions early. The parsed response then returns to your application in a uniform envelope ready for business-level verification:

```json title="cited-review-reply.json"
{
  "schema": "cited-support-answer-v3",
  "status": "complete",
  "answer": "Escalate this credit dispute for specialist review.",
  "citations": ["E1"],
  "review": "pending"
}
```

From that handoff onward, your application enforces grounding and action safety independently from transport retries. First, it confirms that every citation identifier such as `"E1"` comes strictly from passages authorized for the active user and actually supports the answer text. Second, it rejects any output where the model attempts to self-approve `"review": "approved"`, preserving human triage guarantees. Third, downstream write services attach deterministic idempotency keys derived from canonical request parameters so retrying a failed explanation turn never repeats an already-committed financial mutation.[^awsIdempotentApis2026] Here is the unified gateway configuration connecting token economics directly to the conversational support agent architecture in the next chapter:

```json title="gateway-policy.json"
{
  "policy_id": "gateway-policy-v1",
  "required_answer_schema": "cited-support-answer-v3",
  "max_generated_answer_usd": "0.010",
  "max_output_tokens": 300,
  "retry_limits": {
    "max_generation_attempts": 2,
    "request_deadline_ms": 2000,
    "request_spend_cap_usd": "0.020",
    "max_attempt_reservation_usd": "0.010"
  },
  "escalate_when": [
    "no lane meets privacy, context, and schema rules",
    "failure occurs after streamed output begins",
    "remaining clock or spend ceiling cannot fund fallback",
    "failure is an auth error, refusal, or schema mismatch"
  ]
}
```

Outages no longer compromise privacy, grounding, or cost discipline because every fallback faces identical constraints under a shared clock and spend cap. Centralizing routing in one layer lets platform engineers tune EWMA decay weights, cooldown timers, and lane inventories without editing support-bot business code. Notice finally what the gateway leaves out of scope: it prepares a private, structured, cited packet ready for specialist review, while verifying customer identity, ledger eligibility, and credit settlement belong squarely to the support agent in the next chapter.
<!-- leetllm: edition:reader:end -->
