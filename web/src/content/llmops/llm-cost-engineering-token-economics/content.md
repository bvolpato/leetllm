---
{
  "id": "llm-cost-engineering-token-economics",
  "title": "LLM Cost Engineering & Token Economics",
  "slug": "llm-cost-engineering-token-economics",
  "section": "Applied LLM Engineering",
  "category": "MLOps & Deployment",
  "difficulty": "Medium",
  "coverImage": "social_banner.png",
  "companies": [
    "OpenAI"
  ],
  "prerequisites": [
    "semantic-caching-cost-latency-optimization"
  ],
  "relatedQuestions": [
    "model-gateways-routing-fallbacks",
    "observability-monitoring-llm-systems"
  ],
  "shortDescription": "Forecast a USD 717.18 monthly bill against a USD 750 cap by separating stored semantic hits from prefix reads, long-context cliffs, batch queues, and retry cost.",
  "keyConceptsTested": [
    "Uncached input, cache read, cache write, and output token accounting",
    "Reasoning-token inclusion without double billing",
    "Short-context versus 272K long-context tariff tiers",
    "Semantic response reuse versus provider prompt-prefix caching",
    "Versioned rate tables and provider-reported usage fields",
    "Output-token caps that preserve structured citation schemas",
    "Interactive traffic versus asynchronous batch evaluation lanes",
    "Cohort attribution, budget sensitivity, and sample confidence bounds"
  ],
  "order": 23
}
---

<!-- leetllm: edition:reference:start -->
An enterprise customer-support assistant handles 8,500 live queries and 2,000 nightly offline evaluation calls per day against a monthly generation budget of \$750. Depending on the query, the service can return a previously validated semantic response, invoke a frontier chat model with a warm prompt prefix, or fetch fresh order state before generating a cited answer. All four paths satisfy users on similar-looking requests, yet each path moves different cost levers on the monthly invoice. Knowing which line items can actually shrink requires tracing every dollar back to the exact computation that ran.

Across the full 10,500-call daily workload under the frontier pricing schedule below, concise structured replies paired with batched evaluations cost \$23.906 per day, or \$717.18 over a 30-day month. That leaves just \$32.82 of budget headroom (4.4%), which vanishes if interactive traffic grows by 10% or prompt prefixes turn cold.

## Separate avoided generation from billed token lanes

Before multiplying <span data-glossary="token">tokens</span> by prices, classify each incoming request by whether it ran an LLM generation pass at all. A semantic cache hit serves a previously evaluated response directly from the cache store, avoiding LLM inference entirely and incurring zero generation-token fees. By contrast, a provider prompt-prefix hit skips redundant prefill over a shared system prompt or document header, yet still runs fresh query prefill and full auto-regressive decoding. Calling both events a "cache hit" in telemetry dashboards conflates zero marginal token spend with full output decoding bills.

<figure>
  <img src="illustrations/_generated/generation_billing_paths_dark.png" alt="Generation billing paths split between stored-answer hits and four token-billed usage lines alongside token tariffs" />
  <figcaption>Separating stored semantic cache hits from interactive prefix reads, cold cache writes, long-context escalation, and asynchronous batch runs keeps unit costs traceable to actual GPU computation.</figcaption>
</figure>

Scheduling lane and prompt size add two more orthogonal dimensions to the same request record. Interactive user calls require immediate streaming and pay full standard tariffs, whereas nightly offline evaluations can wait in an asynchronous 24-hour queue for half price[^openai2026batch]. Meanwhile, crossing a model's long-context threshold shifts every input token in that turn onto a higher per-million rate card[^openai2026gpt54]. Separating execution path, scheduling lane, and context tier before summing costs prevents dashboards from hiding expensive regressions inside blended averages.

| Request outcome | What runs on GPU clusters | How the ledger prices it |
|---|---|---|
| Semantic response hit | Vector lookup returns stored evaluated reply | \$0 generation cost; record avoided miss cost separately |
| Warm prefix read | KV-cache prefix blocks loaded; fresh tail prefilled and decoded | Fresh input + cached read + output (including reasoning) |
| Cold prefix write | Full prompt prefilled and written to cache slots; answer decoded | Cache write + fresh suffix + output; amortize over repeated reads |
| Long-context turn | Attention over >272K context tokens | Entire prompt and reply priced on long-context rate tier |
| Asynchronous batch job | Offline queue scheduled within a 24-hour SLA | 50% discount applied across standard input, read, and output lines |

## Token economics and inference physics

Billing multipliers across input, cached-read, cache-write, and output tokens mirror physical hardware bottlenecks during serving. Computing prefill across a user prompt runs as large matrix-matrix multiplications (`GEMM`) that saturate GPU tensor cores in parallel. Generating response tokens one step at a time, however, reloads model weights and growing <span data-glossary="kv-cache">KV-cache</span> tensors from high-bandwidth memory (`HBM`) for every single decoded token, making decoding severely memory-bandwidth bound[^vllm2026optimization][^leviathan2023]. Providers price output tokens 4x to 6x higher than uncached input tokens because sequential decoding ties up KV-cache capacity and memory bandwidth far longer per token than parallel prefill[^openai2026pricing].

Prefix caching works by keeping computed key-value states resident in high-speed server memory across shared prompt headers[^openai2026promptcaching][^anthropic2026promptcaching]. When a second turn shares an exact prefix hash, the engine skips recomputing those KV tensors and discounts cached reads by 75% to 90% relative to fresh prefill[^openai2026pricing]. Output decoding still dominates long responses, and hidden reasoning tokens billed inside `completion_tokens` expand output charges linearly with chain-of-thought length even when the visible reply stays brief[^openai2026reasoning].

## Build a versioned tariff table

Pricing calculations break quietly when engineers hard-code stale per-token constants inside application logic or mix standard interactive prices with batch discounts. Storing effective dates, unit denominators (`1_000_000` tokens), long-context cutoffs, and non-overlapping billing rules in an explicit table keeps historical cost tracking reproducible when providers revise prices. Providers also expose different usage field shapes: OpenAI reports cached tokens inside `input_tokens` (so uncached input equals total input minus `cached_tokens`) and folds `reasoning_tokens` into `output_tokens`, whereas Anthropic splits uncached input, `cache_creation_input_tokens`, and `cache_read_input_tokens` into disjoint fields[^openai2026pricing][^anthropic2026promptcaching].

Under this sample frontier pricing schedule, interactive uncached input costs \$2.00 per million tokens, cached reads drop 90% to \$0.20 per million, explicit 5-minute TTL cache writes cost \$2.50 per million (1.25x base input), and output tokens (including reasoning) cost \$12.00 per million. Asynchronous batch lanes apply a flat 50% discount (\$1.00 input, \$0.10 cached read, \$1.25 cache write, and \$6.00 output per million), while crossing 272K context tokens escalates interactive rates to \$4.00 input, \$0.40 read, and \$18.00 output. Our normalized ledger holds four mutually exclusive buckets (`fresh_input`, `cached_read`, `cache_write`, `output`) so no token is ever billed twice.

<!-- leetllm: test, output=show, id=cost-ledger, deps=numpy -->
```python title="token-ledger-and-pricing.py"
from dataclasses import dataclass
import numpy as np

MILLION = 1_000_000.0


@dataclass(frozen=True)
class RateCard:
    name: str
    effective_date: str
    long_context_threshold: int
    rates: dict[tuple[str, str], tuple[float, float, float, float]]  # (fresh, read, write, out) per 1M


APRIL_2026_CARD = RateCard(
    name="frontier-chat-v2026-04",
    effective_date="2026-04-01",
    long_context_threshold=272_000,
    rates={
        ("interactive", "short"): (2.00, 0.20, 2.50, 12.00),
        ("interactive", "long"):  (4.00, 0.40, 5.00, 18.00),
        ("batch", "short"):       (1.00, 0.10, 1.25,  6.00),
        ("batch", "long"):        (2.00, 0.20, 2.50,  9.00),
    },
)


def select_context_tier(total_input_tokens: int, card: RateCard) -> str:
    return "long" if total_input_tokens > card.long_context_threshold else "short"


def normalize_provider_usage(
    *,
    prompt_tokens: int,
    cached_read_tokens: int,
    cache_write_tokens: int,
    completion_tokens: int,
    reasoning_tokens: int,
    style: str = "openai",
) -> np.ndarray:
    """Return disjoint [fresh_input, cached_read, cache_write, output] token counts."""
    if style == "openai":
        fresh_in = max(0, prompt_tokens - cached_read_tokens - cache_write_tokens)
        # reasoning_tokens already live inside completion_tokens on OpenAI usage records.
        out_tokens = completion_tokens
    elif style == "anthropic":
        fresh_in = prompt_tokens
        out_tokens = completion_tokens
    else:
        raise ValueError(f"Unsupported usage style: {style}")
    if reasoning_tokens > out_tokens:
        raise ValueError("reasoning_tokens cannot exceed total output tokens")
    return np.array([fresh_in, cached_read_tokens, cache_write_tokens, out_tokens], dtype=np.float64)


def price_tokens(tokens: np.ndarray, *, lane: str, card: RateCard) -> float:
    total_input = int(tokens[0] + tokens[1] + tokens[2])
    tier = select_context_tier(total_input, card)
    rate_vec = np.asarray(card.rates[(lane, tier)], dtype=np.float64)
    return float(np.dot(tokens, rate_vec) / MILLION)


sample_vec = normalize_provider_usage(
    prompt_tokens=2_200,
    cached_read_tokens=1_200,
    cache_write_tokens=0,
    completion_tokens=420,
    reasoning_tokens=160,
    style="openai",
)
sample_cost = price_tokens(sample_vec, lane="interactive", card=APRIL_2026_CARD)
print(f"Disjoint buckets [fresh, read, write, out]: {sample_vec.astype(int).tolist()}")
print(f"Interactive short-tier cost: ${sample_cost:.6f} (output share: {sample_vec[3]*12/MILLION/sample_cost*100:.1f}%)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Disjoint buckets [fresh, read, write, out]: [1000, 1200, 0, 420]
Interactive short-tier cost: $0.007280 (output share: 69.2%)
```
<!-- leetllm: output:end -->

> **Key insight:** Even when prefix caching covers over half the prompt (`1,200` of `2,200` tokens), output decoding (`420` tokens including `160` reasoning tokens) drives **69.2%** of the call's cost. Because output tokens cost 6x fresh input and 60x cached reads, trimming verbose replies usually saves far more than shrinking a static system prompt. Separating disjoint buckets first also prevents double-billing `cached_tokens` or `reasoning_tokens` on OpenAI-style usage payloads.[^openai2026reasoning]

## Context cliffs, prefix write amortization, and the Pareto frontier

Two nonlinear effects dominate per-call cost optimization: context-tier cliffs and prefix-cache amortization. Crossing the `272,000`-token context window doubles both interactive input and cached read tariffs (`$2.00 -> $4.00`, `$0.20 -> $0.40`) and raises output rates by 50% (`$12.00 -> $18.00`), so a single `280,000`-token request does not pay the higher rate only on the extra `8,000` tokens; it reprices the entire prompt and response[^openai2026gpt54]. Meanwhile, explicit prefix writes carry a `1.25x` write surcharge over uncached prefill, which loses money whenever a prompt prefix is only queried once[^anthropic2026promptcaching]. Tracking both thresholds prevents sudden jumps in unit economics when retrieval sizes or session histories grow.

<figure>
  <img src="illustrations/_generated/cost_optimization_dark.png" alt="Prefix-cache amortization break-even curve over six calls paired with the cost-versus-quality Pareto frontier" />
  <figcaption>Explicit prompt-prefix writes pay back their 1.25x surcharge by the second shared call and cut six-call prefix spend below one-third of uncached prefill, while the Pareto curve flags configurations that dominate slower, higher-cost alternatives.</figcaption>
</figure>

Let $C_{\text{write}} = 1.25$ and $C_{\text{read}} = 0.10$ denote write and read cost multipliers relative to one uncached prefill pass. Over $n$ reuse requests sharing the same prefix, uncached cost scales as $n$, while cached cost equals $1.25 + 0.10(n - 1)$:

$$
1.25 + 0.10(n - 1) < n \iff 1.15 < 0.90n \iff n \ge 2
$$

By the second call ($n=2$), cumulative relative cost drops from $2.00\times$ to $1.35\times$, and by $n=6$ calls total prefix spend falls by more than 70% ($1.75\times$ vs. $6.00\times$). Conversely, if a timestamp, session UUID, or unsorted dictionary changes inside the header on every request, every call triggers a fresh `1.25x` write and ends up 25% more expensive than disabling explicit prefix writes altogether[^openai2026promptcaching]. Keeping deterministic headers stable at the very front of the prompt preserves warm KV blocks across worker instances as well as user sessions.

Even with prefix caching tuned, choosing an operating configuration requires comparing unit spend against answer quality on the actual Pareto frontier. Cutting `max_tokens` too aggressively truncates JSON citations and drags quality down to 74%, whereas leaving an interactive batch-eligible endpoint unbatched costs `$6.80` per thousand calls at only 84% quality (strictly dominated by both concise prompting and smaller routing tiers). Computing non-dominated configurations numerically keeps teams from celebrating cheap answers that fail validation or break customer trust.

<!-- leetllm: test, output=show, continue=cost-ledger, id=cost-frontier, deps=numpy -->
```python title="context-cliff-and-pareto-frontier.py"
# 1) Long-context cliff: crossing 272K tokens reprices all tokens in the turn
just_under = normalize_provider_usage(
    prompt_tokens=271_500, cached_read_tokens=200_000, cache_write_tokens=0,
    completion_tokens=300, reasoning_tokens=80, style="openai",
)
just_over = normalize_provider_usage(
    prompt_tokens=273_000, cached_read_tokens=200_000, cache_write_tokens=0,
    completion_tokens=300, reasoning_tokens=80, style="openai",
)
print(f"271.5K tokens (short tier): ${price_tokens(just_under, lane='interactive', card=APRIL_2026_CARD):.4f}")
print(f"273.0K tokens (long tier):  ${price_tokens(just_over, lane='interactive', card=APRIL_2026_CARD):.4f}")

# 2) Vectorized prefix-cache amortization curve for n = 1..6 shared calls
n_calls = np.arange(1, 7)
uncached_rel = 1.0 * n_calls
cached_rel = 1.25 + 0.10 * (n_calls - 1)
savings_pct = (1.0 - cached_rel / uncached_rel) * 100.0
for n, u, c, s in zip(n_calls, uncached_rel, cached_rel, savings_pct):
    print(f"n={n}: uncached={u:.2f}x | write+read={c:.2f}x | net savings={s:+.1f}%")

# 3) Pareto frontier across 5 operating candidates: (name, cost_per_1k, quality_pct)
candidates = [
    ("Truncated", 1.5, 74.0),
    ("Small-8B",  2.8, 86.0),
    ("Concise",   4.6, 95.0),
    ("Unbatched", 6.8, 84.0),
    ("Verbose",   7.2, 96.0),
]
costs = np.array([row[1] for row in candidates])
quals = np.array([row[2] for row in candidates])
is_pareto = np.array([
    not np.any((costs <= costs[i]) & (quals >= quals[i]) & ((costs < costs[i]) | (quals > quals[i])))
    for i in range(len(candidates))
])
frontier_names = [row[0] for row, keep in zip(candidates, is_pareto) if keep]
dominated_names = [row[0] for row, keep in zip(candidates, is_pareto) if not keep]
print(f"Pareto frontier configs: {frontier_names}")
print(f"Strictly dominated:      {dominated_names}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
271.5K tokens (short tier): $0.1866
273.0K tokens (long tier):  $0.3774
n=1: uncached=1.00x | write+read=1.25x | net savings=-25.0%
n=2: uncached=2.00x | write+read=1.35x | net savings=+32.5%
n=3: uncached=3.00x | write+read=1.45x | net savings=+51.7%
n=4: uncached=4.00x | write+read=1.55x | net savings=+61.3%
n=5: uncached=5.00x | write+read=1.65x | net savings=+67.0%
n=6: uncached=6.00x | write+read=1.75x | net savings=+70.8%
Pareto frontier configs: ['Truncated', 'Small-8B', 'Concise', 'Verbose']
Strictly dominated:      ['Unbatched']
```
<!-- leetllm: output:end -->

Notice how stark the `272K` tier jump is: adding just `1,500` tokens across the threshold raises a single turn's price from `$0.1866` to `$0.3774`, more than doubling the request invoice overnight. Putting that alongside the amortization curve makes both tuning levers concrete, since losing prefix reads on a 200K system prompt raises costs sharply too. That is why stable prompt prefixes and sliding document retrieval caps save money on both sides of the invoice: they preserve warm KV reads below `1.0x` while preventing stray retrieval dumps from pushing requests over the long-context threshold.

## Replay daily cohorts and attribute spend cleanly

Blended averages hide which traffic slice actually drives the monthly bill, because identical per-token prices yield completely different invoice totals once caching rates and output verbosity diverge across user flows. Assigning requests by functional cohort clarifies which optimization targets carry the highest leverage and prevents engineers from wasting effort optimizing low-volume lanes. Our support system handles 10,500 calls per day split across five distinct cohorts:

1. **Stored semantic cache hits (3,200/day):** Matched against pre-evaluated FAQ answers at \$0 generation cost, avoiding \$13.824 per day of live model calls (at 1,500 fresh input and 110 output tokens per uncached miss).
2. **Live order lookups (3,000/day):** Dynamic database records appended after a small static header (`400` read, `1,000` fresh input, `133` output tokens), making this the largest billed cohort at \$11.03 per day (46.1% of spend).
3. **Policy and doc questions (1,800/day):** Deep system prompts shared across queries (`830` read, `450` fresh input, `20` periodic header writes, `267` output tokens), costing \$7.78 per day (32.5%).
4. **Access review escalations (500/day):** Complex multi-rule checks (`1,400` read, `500` fresh input, `40` writes, `266` output tokens) totaling \$2.29 per day (9.6%).
5. **Nightly offline evaluation (2,000/day):** Regression benchmark runs queued through the asynchronous batch lane (`400` fresh input, `1,320` cached read, `146` output tokens at 50% off), costing \$2.82 per day (11.8%).

<figure>
  <img src="illustrations/_generated/cost_guardrail_flow_dark.png" alt="Cohort share of the daily generation bill compared with avoided stored-answer generation" />
  <figcaption>Cohorts with dynamic per-request payloads generate nearly half of total daily cash spend, whereas avoided semantic cache hits represent a separate exposure pool that returns to the bill immediately if cache precision drops.</figcaption>
</figure>

Putting avoided spend beside actual cohort spend reveals two vital budgeting lessons. First, avoided generation (\$13.82/day) exceeds any billed cohort, yet it cannot offset real cash outflow; if semantic cache quality drifts and miss rates climb, real bills jump by up to \$415 per month.

Second, once prompts are compressed to `Concise` structured JSON (`cited-support-answer-v3`), uncached live-order queries still absorb nearly half of total spend (\$11.03/day) because dynamic SQL order JSON changes on every request and resists both semantic reuse and heavy prompt caching.

Wait before attributing unit economics by call count alone: interactive multi-step requests and validation retries change cost per **accepted answer**. Suppose an access-review task invokes retrieval, rewrites malformed JSON on a `12%` retry rate, and averages `1.28` model calls per accepted user outcome. Cost per accepted task rises proportionally by that `1.28x` multiplier, making concise schema enforcement cheaper per resolved ticket than unvalidated low-cost tiers that retry three times.

<!-- leetllm: test, output=show, continue=cost-frontier, id=daily-cohort-replay, deps=numpy -->
```python title="daily-cohort-spend-replay.py"
from dataclasses import dataclass

@dataclass(frozen=True)
class CohortSpec:
    name: str
    calls_per_day: int
    lane: str
    fresh_in: int
    cached_read: int
    cache_write: int
    output: int
    retries_per_task: float = 1.0


WORKLOAD = [
    CohortSpec("Orders", 3_000, "interactive", 1_000,   400,  0, 133, retries_per_task=1.08),
    CohortSpec("Docs",   1_800, "interactive",   450,   830, 20, 267, retries_per_task=1.05),
    CohortSpec("Review",   500, "interactive",   500, 1_400, 40, 266, retries_per_task=1.28),
    CohortSpec("Eval",   2_000, "batch",         400, 1_320,  0, 146, retries_per_task=1.00),
]

stored_hit_calls = 3_200
avoided_per_hit = price_tokens(np.array([1_500, 0, 0, 110], dtype=np.float64), lane="interactive", card=APRIL_2026_CARD)
avoided_daily = stored_hit_calls * avoided_per_hit

daily_costs = {}
for c in WORKLOAD:
    vec = np.array([c.fresh_in, c.cached_read, c.cache_write, c.output], dtype=np.float64)
    per_call = price_tokens(vec, lane=c.lane, card=APRIL_2026_CARD)
    daily_costs[c.name] = {
        "per_call": per_call,
        "per_accepted_task": per_call * c.retries_per_task,
        "daily_spend": per_call * c.calls_per_day,
    }

total_daily = sum(v["daily_spend"] for v in daily_costs.values())
monthly_base = total_daily * 30.0
for name, stats in daily_costs.items():
    share = stats["daily_spend"] / total_daily * 100.0
    print(
        f"{name:6s} | ${stats['per_call']:.5f}/call | "
        f"${stats['per_accepted_task']:.5f}/task | "
        f"${stats['daily_spend']:6.2f}/day ({share:4.1f}%)"
    )

print(f"Avoided stored hits ({stored_hit_calls}/day): ${avoided_daily:.2f}/day")
print(f"Total daily billed spend: ${total_daily:.3f} -> 30-day bill: ${monthly_base:.2f} (headroom vs $750: ${750 - monthly_base:.2f})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Orders | $0.00368/call | $0.00397/task | $ 11.03/day (46.1%)
Docs   | $0.00432/call | $0.00454/task | $  7.78/day (32.5%)
Review | $0.00457/call | $0.00585/task | $  2.29/day ( 9.6%)
Eval   | $0.00141/call | $0.00141/task | $  2.82/day (11.8%)
Avoided stored hits (3200/day): $13.82/day
Total daily billed spend: $23.906 -> 30-day bill: $717.18 (headroom vs $750: $32.82)
```
<!-- leetllm: output:end -->

Every number in that ledger ties directly back to raw token counts and scheduling lanes. The baseline interactive mix costs \$21.09 per day (\$632.70/month), nightly batch eval adds \$2.82 per day (\$84.48/month), and combined 30-day spend lands at \$717.18. With only \$32.82 separating the forecast from a \$750 ceiling, small operational drifts become budget breaches quickly.

## Stress-test the monthly forecast and size quality samples

Point forecasts fail in production because traffic, cache hit ratios, and batch scheduling fluctuate together rather than one variable at a time. Modeling three realistic failure modes shows how fragile a 4.4% cushion actually is:

1. **+10% interactive traffic (`+10%`):** Marketing promotions push daily interactive calls up 10% (`Orders`, `Docs`, `Review`), adding \$63.27/month and pushing spend to \$780.45.
2. **Evaluation falls back to synchronous interactive + cold warmups (`ColdEval`):** A batch scheduler outage forces nightly evaluation onto the standard interactive tariff (+2x base eval) plus brief cache-write overhead, climbing to \$804.06/month.
3. **Interactive prefix cache goes completely cold (`ColdAll`):** An accidental system-prompt timestamp busts prefix reuse across `Orders`, `Docs`, and `Review`, turning cached `$0.20` reads into `$2.00` uncached inputs and `1.25x` cold writes and surging past \$916/month.

<figure>
  <img src="illustrations/_generated/release_budget_gate_dark.png" alt="Monthly spend sensitivity scenarios against a $750 cap paired with the 3/n zero-defect confidence bound" />
  <figcaption>A 10% interactive traffic uptick, lost batch scheduling, or cold prompt prefixes each breach the $750 monthly cap, while the Rule of Three shows how sample size tightens zero-defect reliability guarantees.</figcaption>
</figure>

Spend simulations alone still miss the other half of release verification: ensuring prompt compaction or output caps have not broken answer correctness. When an evaluation sample of $n$ requests finishes with **zero observed format or citation failures**, the classic Rule of Three gives an approximate upper bound on the true latent defect rate $p_{\max}$ at 95% confidence:

$$
(1 - p)^n \ge 0.05 \implies \ln(1 - p) \approx -p \ge \frac{\ln 0.05}{n} \approx -\frac{3.0}{n} \implies p_{\max} \approx \frac{3}{n}
$$

Testing only $n = 100$ queries with zero defects looks reassuring on a slide deck, yet $3/100 = 3.0\%$ means up to one in thirty-three live user replies could still violate the JSON schema. Pushing that 95% upper confidence bound safely below a `0.5%` quality ceiling requires at least $n = 600$ defect-free evaluations (and running $n = 1,000$ compresses the bound cleanly to `0.3%`).

Once you verify both spend sensitivity and quality confidence bounds, the final step is turning monthly math into two deterministic numbers a runtime gateway can enforce per request without global state: a single-generation dollar ceiling and a hard `max_output_tokens` cap. Setting `max_output_tokens = 300` bounds worst-case output decoding on short-tier calls to \$0.0036 (300 output tokens at \$12 per million), leaving headroom for up to 3,200 fresh prompt tokens (\$0.0064) under a strict **\$0.01 single-generation ceiling** for cited-support-answer-v3 responses.

<!-- leetllm: test, output=show, continue=daily-cohort-replay, id=budget-and-gateway-cap, deps=numpy -->
```python title="monthly-sensitivity-and-gateway-cap.py"
# 1) Monthly spend stress scenarios vs $750 cap
interactive_daily = sum(daily_costs[k]["daily_spend"] for k in ("Orders", "Docs", "Review"))
eval_daily = daily_costs["Eval"]["daily_spend"]

plus10_mo = (1.10 * interactive_daily + eval_daily) * 30.0
# ColdEval: eval loses batch discount (2x -> interactive rate) plus warmup write overhead
cold_eval_daily = interactive_daily + 2.0 * eval_daily + (2_000 * 16.0 * 2.50 / MILLION)
cold_eval_mo = cold_eval_daily * 30.0
# ColdAll: interactive prefix reads shift $0.20 -> $2.00 (+$1.80/1M) + 30% pay cold $2.50 writes
interactive_read_tokens = 3_000 * 400 + 1_800 * 830 + 500 * 1_400
cold_read_delta = interactive_read_tokens * (2.00 - 0.20) / MILLION
cold_write_churn = interactive_read_tokens * 0.30 * (2.50 - 2.00) / MILLION
cold_all_mo = (total_daily + cold_read_delta + cold_write_churn) * 30.0

for label, val in [("Base", monthly_base), ("+10%", plus10_mo), ("ColdEval", cold_eval_mo), ("ColdAll", cold_all_mo)]:
    status = "PASS" if val <= 750.0 else f"OVER (+${val - 750.0:.2f})"
    print(f"Scenario {label:8s}: ${val:6.2f}/mo  [{status}]")

# 2) Rule-of-Three 95% upper defect bound vs exact 1 - 0.05**(1/n)
sample_sizes = np.array([100, 250, 500, 1000, 1500, 2000])
rule_of_three = 3.0 / sample_sizes * 100.0
exact_upper = (1.0 - np.power(0.05, 1.0 / sample_sizes)) * 100.0
for n, r3, ex in zip(sample_sizes, rule_of_three, exact_upper):
    print(f"Zero-defect n={n:4d} -> 3/n upper bound: {r3:.2f}% (exact binomial: {ex:.2f}%)")

# 3) Per-call gateway ceiling & max_output_tokens check
MAX_OUTPUT_TOKENS = 300
SINGLE_CALL_CEILING = 0.01  # $0.01 per generation
max_fresh_prompt_tokens = int((SINGLE_CALL_CEILING - (MAX_OUTPUT_TOKENS * 12.00 / MILLION)) / (2.00 / MILLION))
gateway_rule = {
    "schema": "cited-support-answer-v3",
    "max_output_tokens": MAX_OUTPUT_TOKENS,
    "single_call_ceiling_usd": SINGLE_CALL_CEILING,
    "max_uncached_prompt_tokens_under_ceiling": max_fresh_prompt_tokens,
}
print("Gateway enforcement rule:", gateway_rule)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Scenario Base    : $717.18/mo  [PASS]
Scenario +10%    : $780.45/mo  [OVER (+$30.45)]
Scenario ColdEval: $804.06/mo  [OVER (+$54.06)]
Scenario ColdAll : $915.73/mo  [OVER (+$165.73)]
Zero-defect n= 100 -> 3/n upper bound: 3.00% (exact binomial: 2.95%)
Zero-defect n= 250 -> 3/n upper bound: 1.20% (exact binomial: 1.19%)
Zero-defect n= 500 -> 3/n upper bound: 0.60% (exact binomial: 0.60%)
Zero-defect n=1000 -> 3/n upper bound: 0.30% (exact binomial: 0.30%)
Zero-defect n=1500 -> 3/n upper bound: 0.20% (exact binomial: 0.20%)
Zero-defect n=2000 -> 3/n upper bound: 0.15% (exact binomial: 0.15%)
Gateway enforcement rule: {'schema': 'cited-support-answer-v3', 'max_output_tokens': 300, 'single_call_ceiling_usd': 0.01, 'max_uncached_prompt_tokens_under_ceiling': 3200}
```
<!-- leetllm: output:end -->

Every number in that output ties forecast math directly to runtime enforcement: `300` maximum output tokens keep worst-case decoding predictable, `3,200` uncached prompt tokens keep any single attempt within `$0.01`, and `n = 1,000` evaluation checks verify answer quality below a `0.30%` upper failure rate. Still, static single-call limits leave one operational flaw open: if a primary endpoint hangs and triggers a fallback retry, two back-to-back attempts double spend unless the gateway tracks a cumulative per-request budget across attempts.

```mastery-quiz
[
  {
    "question": "A support assistant resolves 3,200 queries/day via stored semantic answers and 1,800 queries/day via warm prompt-prefix reads. Why do both appear as cache hits in naive telemetry yet behave differently on the provider bill?",
    "options": [
      "Semantic hits return stored answers with zero inference tokens, while prompt-prefix reads discount cached inputs and still bill fresh inputs and decoded outputs.",
      "Prompt-prefix reads apply a 90% discount across both input and output tokens, whereas semantic cache hits trigger per-token vector similarity charges on generation.",
      "Semantic cache hits pay a 1.25x cache write surcharge per query, whereas prompt-prefix reads automatically route onto the asynchronous 50% off-peak batch tariff.",
      "Both produce identical model invoices because provider gateways waive fresh input and decoded output fees whenever a shared system prompt prefix stays hot."
    ],
    "answer": "Semantic hits return stored answers with zero inference tokens, while prompt-prefix reads discount cached inputs and still bill fresh inputs and decoded outputs.",
    "explanation": "Semantic response caching skips the generation call completely once an answer matches a validated entry. Prompt-prefix caching accelerates GPU prefill by reading cached KV tensors at roughly 0.10x cost, yet still executes prefill on new input tokens and memory-bandwidth-bound auto-regressive decoding at full output tariffs."
  },
  {
    "question": "An OpenAI-style usage payload reports prompt_tokens = 2,200, cached_tokens = 1,200, completion_tokens = 420, and reasoning_tokens = 160. How should the billing ledger compute fresh uncached input and output tokens?",
    "options": [
      "Fresh input = 2,200 uncached input tokens (keeping prompt_tokens intact) and billable output = 420 + 160 = 580 total output tokens.",
      "Fresh input = 2,200 - 1,200 = 1,000 uncached tokens and billable output = 420 tokens (since reasoning_tokens sit inside completion_tokens).",
      "Fresh input = 2,200 uncached tokens (plus 1,200 cached read tokens) and billable output = 420 - 160 = 260 non-reasoning output tokens.",
      "Fresh input = 1,200 prompt-prefix tokens billed at full price and billable output = 160 reasoning tokens billed alongside zero visible completion tokens."
    ],
    "answer": "Fresh input = 2,200 - 1,200 = 1,000 uncached tokens and billable output = 420 tokens (since reasoning_tokens sit inside completion_tokens).",
    "explanation": "On OpenAI-style responses, cached_tokens is a subset of prompt_tokens, and reasoning_tokens is a billed subset already included inside completion_tokens. Subtracting cached tokens prevents billing the cached prefix at both the fresh and discounted rates, while avoiding adding reasoning tokens prevents double-billing output."
  },
  {
    "question": "Under an explicit cache pricing scheme where a cache write costs 1.25x base input and each subsequent cache read costs 0.10x base input, when does prefix caching break even compared to paying 1.00x uncached input every time?",
    "options": [
      "On the opening request (n = 1), because initializing shared KV tensors lowers initial prefill attention FLOPs right away.",
      "Starting on the second call (n = 2), where cumulative input spend drops from 2.00x uncached down to 1.35x.",
      "After the tenth repeat call (n = 10), because discounting cached reads to 0.10x adds minimal savings until write costs amortize.",
      "Across zero request counts, because a 1.25x write premium keeps cumulative cached spend above 1.00x uncached billing."
    ],
    "answer": "Starting on the second call (n = 2), where cumulative input spend drops from 2.00x uncached down to 1.35x.",
    "explanation": "With a 1.25x write and 0.10x read, n calls spend 1.25 + 0.10*(n - 1), which drops strictly below n as soon as n >= 2 (1.35x vs 2.00x). Unstable prefixes that change timestamps on every call remain stuck at n = 1 and pay a permanent 25% surcharge."
  },
  {
    "question": "Why does crossing a 272,000-token long-context threshold produce a steep price cliff rather than a smooth ramp?",
    "options": [
      "Long-context tariff rows apply retroactively across every input and output token in the request, not merely excess tokens past 272,000.",
      "Provider routers switch requests past 272,000 tokens out of cached prefix pools and apply a mandatory 50% priority concurrency surcharge.",
      "Exceeding 272,000 prompt tokens promotes the calling API project onto the dedicated long-context billing tier across the rest of the calendar month.",
      "Decoding prices drop to zero once context exceeds 272,000 tokens while cached read rates double across the trailing query suffix."
    ],
    "answer": "Long-context tariff rows apply retroactively across every input and output token in the request, not merely excess tokens past 272,000.",
    "explanation": "Crossing 272K context shifts the entire request onto the long-context tariff row (for example doubling interactive input and cached read prices and raising output rates by 50%), creating a discontinuous cost step."
  },
  {
    "question": "A prompt change finishes with zero schema failures on a sample of n = 100 test cases. What does the Rule of Three (3/n) tell you before promoting the change against a 0.5% maximum failure rate?",
    "options": [
      "Zero failures across 100 schema checks confirms the underlying failure probability sits safely below 0.1% with 95% confidence.",
      "At 95% confidence, up to 3/100 = 3.0% defect rates remain plausible, requiring 600 to 1,000 defect-free cases for a 0.5% cap.",
      "Observed defect variance shrinks linearly with token length rather than trial count once structured JSON outputs hit zero parse errors.",
      "Increasing sample size to n = 200 eliminates remaining binomial sampling variance around rare schema edge cases."
    ],
    "answer": "At 95% confidence, up to 3/100 = 3.0% defect rates remain plausible, requiring 600 to 1,000 defect-free cases for a 0.5% cap.",
    "explanation": "The zero-defect 95% upper confidence bound scales as 3/n. With n = 100, a true 3.0% failure rate still passes all checks roughly 5% of the time; clearing a 0.5% defect threshold requires at least n = 600 zero-failure evaluations."
  }
]
```

> **Next:** Continue to [Model Gateways, Routing, and Fallbacks](/learn/model-gateways-routing-fallbacks). Carry forward the `cited-support-answer-v3` JSON output schema, the \$0.01 single-generation ceiling, and the 300-token output cap while tracking cumulative multi-attempt request spend separately.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
A lower price per token can still produce a higher monthly bill. When an answer generator adds verbose markdown padding, expands hidden reasoning chains, retries malformed JSON, or crosses a context-tier cutoff, a cheaper nominal tariff ends up costing more per resolved customer question than a disciplined configuration. Making LLM unit economics predictable means tracing cost down to the hardware work each token performs.

## Start with the model work that actually executed

Before opening a rate table, separate requests that actually run auto-regressive decoding from requests that bypass inference altogether. In a tiered support architecture, a **semantic cache hit** returns a previously verified response from vector storage, incurring zero model-generation charges. A **provider prompt-prefix read** skips recomputing shared system instructions by loading saved KV tensors, yet still runs prefill on the user's fresh query and generates every output token sequentially[^openai2026promptcaching][^anthropic2026promptcaching].

<figure>
  <img src="illustrations/_generated/generation_billing_paths_dark.png" alt="Generation billing paths split between stored-answer hits and four token-billed usage lines alongside token tariffs" />
  <figcaption>Separating stored semantic cache hits from interactive prefix reads, cold cache writes, long-context escalation, and asynchronous batch runs keeps unit costs traceable to actual GPU computation.</figcaption>
</figure>

Labeling both paths a "cache hit" hides massive bill variance. Output decoding dominates GPU cost because sequential token generation is memory-bandwidth bound (HBM reloads weights and KV states every step), whereas parallel prefill saturates compute cores cleanly[^vllm2026optimization][^leviathan2023]. Providers mirror that physics directly in their tariffs: on our sample frontier rate card, cached input reads cost \$0.20 per million tokens, fresh input costs \$2.00, 5-minute TTL cache writes cost \$2.50, and output tokens cost \$12.00 (6x fresh input)[^openai2026pricing].

## Price a single call without counting any token twice

Provider invoices fail silently when downstream code misreads nested usage fields or forgets long-context tier shifts. On OpenAI-style responses, `cached_tokens` lives inside `prompt_tokens`, and hidden `reasoning_tokens` already sit inside `completion_tokens`[^openai2026reasoning]. Subtracting `cached_tokens` and `cache_write_tokens` isolates fresh input so cached prefixes are never billed twice, and reading `completion_tokens` directly prices reasoning without double counting.

```python title="reader-price-usage-record.py"
import numpy as np

MILLION = 1_000_000.0
APRIL_RATES = {
    ("interactive", "short"): (2.00, 0.20, 2.50, 12.00),  # fresh, read, write, output ($/1M)
    ("interactive", "long"):  (4.00, 0.40, 5.00, 18.00),
    ("batch", "short"):       (1.00, 0.10, 1.25,  6.00),
}


def price_usage_record(prompt_tokens, cached_read, cache_write, completion_tokens, lane="interactive"):
    tier = "long" if prompt_tokens > 272_000 else "short"
    fresh = max(0, prompt_tokens - cached_read - cache_write)
    vec = np.array([fresh, cached_read, cache_write, completion_tokens], dtype=np.float64)
    rate_vec = np.asarray(APRIL_RATES[(lane, tier)], dtype=np.float64)
    return float(np.dot(vec, rate_vec) / MILLION)
```

Notice the second trap built directly into `price_usage_record`: crossing the `272,000`-token context cutoff moves the entire request onto the higher rate tier, not merely the tokens beyond `272K`[^openai2026gpt54]. Prefix writes behave nonlinearly as well: because writing a shared prefix costs `1.25x` uncached input while reads drop to `0.10x`, prefix caching loses money if every prompt header mutates (`1.25x > 1.0x`) and breaks even starting at the second call (`1.35x < 2.0x`). Plotting prompt length, output cap, and model size against answer quality exposes which variants sit on the genuine cost-quality Pareto frontier rather than burning budget without accuracy gains.

<figure>
  <img src="illustrations/_generated/cost_optimization_dark.png" alt="Prefix-cache amortization break-even curve over six calls paired with the cost-versus-quality Pareto frontier" />
  <figcaption>Explicit prompt-prefix writes pay back their 1.25x surcharge by the second shared call and cut six-call prefix spend below one-third of uncached prefill, while the Pareto curve flags configurations that dominate slower, higher-cost alternatives.</figcaption>
</figure>

## Build a monthly forecast from distinct traffic cohorts

Rather than applying one blended average across all requests, build your forecast cohort by cohort so high-spend traffic jumps out immediately. Across 10,500 daily support and evaluation requests, 3,200 stored semantic hits cost \$0 while avoiding \$13.82/day of live generation, 3,000 uncached live order lookups drive \$11.03/day (46.1% of spend), shared document prompts cost \$7.78/day (32.5%), escalation checks cost \$2.29/day (9.6%), and 2,000 asynchronous batch evaluation calls add \$2.82/day (11.8%)[^openai2026batch]. That daily run rate of \$23.91 sums to \$717.18 over 30 days, leaving only \$32.82 beneath a \$750 monthly cap.

<figure>
  <img src="illustrations/_generated/cost_guardrail_flow_dark.png" alt="Cohort share of the daily generation bill compared with avoided stored-answer generation" />
  <figcaption>Cohorts with dynamic per-request payloads generate nearly half of total daily cash spend, whereas avoided semantic cache hits represent a separate exposure pool that returns to the bill immediately if cache precision drops.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=reader-cost-forecast, deps=numpy -->
```python title="reader-monthly-cohort-forecast.py"
import numpy as np

# Cohorts: (daily_calls, lane, fresh_in, read, write, out, retry_factor)
cohorts = [
    ("Orders", 3_000, "interactive", 1_000,   400,  0, 133, 1.08),
    ("Docs",   1_800, "interactive",   450,   830, 20, 267, 1.05),
    ("Review",   500, "interactive",   500, 1_400, 40, 266, 1.28),
    ("Eval",   2_000, "batch",         400, 1_320,  0, 146, 1.00),
]

rates = {"interactive": np.array([2.00, 0.20, 2.50, 12.00]), "batch": np.array([1.00, 0.10, 1.25, 6.00])}
daily_spend = np.array([
    calls * float(np.dot([f, r, w, o], rates[lane]) / 1_000_000.0)
    for _, calls, lane, f, r, w, o, _ in cohorts
])
monthly_total = float(daily_spend.sum() * 30.0)
print(f"Daily total: ${daily_spend.sum():.3f} | 30-day bill: ${monthly_total:.2f} | Cushion: ${750 - monthly_total:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Daily total: $23.906 | 30-day bill: $717.18 | Cushion: $32.82
```
<!-- leetllm: output:end -->

Stress-testing that \$717.18 forecast reveals why a 4.4% monthly cushion provides almost no operational safety. A 10% uptick in interactive queries raises 30-day spend to \$780.45, falling out of the batch lane during evaluation jumps to \$804.06, and a prefix-cache breakdown pushes spend to \$916. Simultaneously, checking quality on too few prompts can hide breaking changes: by the Rule of Three (`3/n`), clearing 100 tests with zero failures still leaves a 3.0% upper defect risk, so hitting a `0.5%` failure cap requires at least `600` to `1,000` defect-free checks.

<figure>
  <img src="illustrations/_generated/release_budget_gate_dark.png" alt="Monthly spend sensitivity scenarios against a $750 cap paired with the 3/n zero-defect confidence bound" />
  <figcaption>A 10% interactive traffic uptick, lost batch scheduling, or cold prompt prefixes each breach the $750 monthly cap, while the Rule of Three shows how sample size tightens zero-defect reliability guarantees.</figcaption>
</figure>

## Turn the forecast into a per-call gateway rule

Monthly invoices arrive weeks too late to stop a runaway prompt or broken retry loop. Instead, translate your unit economics into two stateless numbers the serving layer can inspect before dialing an upstream model: a **300-token output cap** matching `cited-support-answer-v3`, and a **\$0.01 single-generation ceiling** covering up to 3,200 uncached input tokens. Yet a single-generation limit alone still leaves a critical blind spot: when an endpoint times out or triggers a fallback model, two sequential attempts double the per-user spend unless a model gateway enforces one cumulative clock and budget across retries.

## What this ledger still leaves open

Token rates tell you what a single clean attempt costs, not how often real traffic times out, switches models, or burns retries across slow dependencies. Pricing also ignores infrastructure capacity when batch jobs stall or vector lookups miss under peak load[^jiang2024]. Solving multi-attempt spend caps, privacy routing constraints, and automatic provider failover brings us directly to the architecture of a production model gateway.
<!-- leetllm: edition:reader:end -->
