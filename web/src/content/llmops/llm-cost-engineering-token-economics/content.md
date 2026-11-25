---
{
  "id": "llm-cost-engineering-token-economics",
  "title": "LLM Cost Engineering, Routing & Caching",
  "slug": "llm-cost-engineering-token-economics",
  "section": "Applied LLM Engineering & RAG",
  "category": "MLOps & Deployment",
  "difficulty": "Medium",
  "coverImage": "social_banner.png",
  "companies": [
    "OpenAI"
  ],
  "prerequisites": [],
  "relatedQuestions": [
    "observability-monitoring-llm-systems"
  ],
  "shortDescription": "Control LLM unit economics by separating semantic hits from KV prefix reads, cascading fast-to-frontier routes with schema-preserving fallbacks, and sizing cohort budgets.",
  "keyConceptsTested": [
    "Disjoint input, cached-read, cache-write, and output token accounting",
    "Reasoning-token billing and memory-bandwidth decoding physics",
    "Long-context tariff cliffs and prefix-write amortization",
    "Semantic-cache antonym collisions versus deterministic KV prefix caching",
    "Model cascading and schema-preserving fallback under shared budgets",
    "Interactive traffic versus asynchronous batch evaluation lanes",
    "Cohort spend attribution, budget sensitivity, and Rule-of-Three sizing"
  ],
  "order": 18,
  "aliases": [
    "semantic-caching-cost-latency-optimization",
    "model-gateways-routing-fallbacks"
  ]
}
---

<!-- leetllm: edition:reference:start -->
A customer-support assistant handles 8,500 live queries and 2,000 nightly offline evaluations per day against a monthly generation ceiling of \$750. Depending on the query, the service can return a stored semantic answer, route to a fast 8B model and escalate to a frontier model only on low confidence or schema failure, hit a warm KV prompt prefix, or queue offline evaluations in an asynchronous batch lane. All four paths look identical to a caller, yet each moves a different line on the monthly invoice.

Across 10,500 daily calls under a parameterized frontier rate card, concise structured replies paired with batched evaluations cost \$23.906/day (\$717.18 over 30 days), leaving just \$32.82 (4.4%) of headroom before a traffic spike or cold cache breaches the cap. Controlling spend without hurting accuracy requires tracing every dollar to GPU execution, guarding caches from semantic collisions, and cascading routine turns away from frontier decoding.

## Separate avoided generation from billed token lanes

Before multiplying <span data-glossary="token">tokens</span> by rates, separate requests that skip inference from requests that execute auto-regressive decoding. A semantic cache hit serves a stored response from vector storage for \$0 in generation fees. A provider prompt-prefix hit reuses resident <span data-glossary="kv-cache">KV-cache</span> tensors over a shared header, yet still runs prefill on fresh query tokens and full sequential decoding. Calling both a "cache hit" hides massive bill variance.

<figure>
  <img src="illustrations/_generated/generation_billing_paths_dark.png" alt="Generation billing paths split between stored-answer hits and four token-billed usage lines alongside token tariffs" />
  <figcaption>Separating stored semantic cache hits from interactive prefix reads, cold cache writes, long-context escalation, and asynchronous batch runs keeps unit costs traceable to actual GPU computation.</figcaption>
</figure>

Scheduling lane and prompt length add two orthogonal cost multipliers: asynchronous 24-hour batch queues cut token prices in half[^openai2026batch], whereas crossing a model's long-context threshold reprices every token in the turn onto a steeper tier[^openai2026gpt54].

| Request outcome | GPU work executed | Pricing treatment |
|---|---|---|
| Semantic response hit | Vector lookup returns stored reply | \$0 generation; track avoided spend separately |
| Warm KV prefix read | Exact prefix KV blocks loaded; tail prefilled & decoded | Fresh input + cached read + output (incl. reasoning) |
| Cold KV prefix write | Full prompt prefilled and written to cache slots | Cache write + fresh suffix + output; amortize over reads |
| Long-context turn | Attention over >272K context tokens | Entire turn repriced on long-context tier |
| Asynchronous batch job | Offline queue scheduled within 24h SLA | 50% discount across input, read, and output |

Billing ratios mirror hardware bottlenecks: prompt prefill runs parallel matrix multiplications (`GEMM`) that saturate GPU tensor cores, whereas auto-regressive decoding reloads weights and growing KV tensors from `HBM` on every step, making decoding memory-bandwidth bound[^vllm2026optimization][^leviathan2023]. Providers therefore price output tokens 4x to 6x higher than fresh input, while discounting exact-prefix KV reads by 75% to 90%[^openai2026pricing][^openai2026promptcaching][^anthropic2026promptcaching]. Hidden reasoning tokens billed inside `completion_tokens` expand output charges linearly even when the visible answer is short[^openai2026reasoning].

## Parameterize rate cards and disjoint token buckets

Hardcoding dated provider pricing tables breaks silently whenever tariffs change. Parameterize every tier by its structural rates (`input_rate`, `cached_input_rate`, `cache_write_rate`, `output_rate`, `long_context_threshold`, and batch discount) and normalize provider payloads into four disjoint buckets `[fresh_input, cached_read, cache_write, output]`. OpenAI nests `cached_tokens` inside `prompt_tokens` and `reasoning_tokens` inside `completion_tokens`, whereas Anthropic reports uncached input, `cache_creation_input_tokens`, and `cache_read_input_tokens` separately[^openai2026pricing][^anthropic2026promptcaching].

<!-- leetllm: test, output=show, id=cost-ledger, deps=numpy -->
```python title="parameterized-token-pricing.py"
from dataclasses import dataclass
import numpy as np

MILLION = 1_000_000.0


@dataclass(frozen=True)
class RateCard:
    name: str
    input_rate: float
    cached_input_rate: float
    cache_write_rate: float
    output_rate: float
    long_context_threshold: int = 272_000
    long_input_mult: float = 2.0
    long_output_mult: float = 1.5
    batch_discount: float = 0.5

    def rate_vector(self, *, lane: str, total_input_tokens: int) -> np.ndarray:
        in_mult = self.long_input_mult if total_input_tokens > self.long_context_threshold else 1.0
        out_mult = self.long_output_mult if total_input_tokens > self.long_context_threshold else 1.0
        lane_mult = self.batch_discount if lane == "batch" else 1.0
        return np.array([
            self.input_rate * in_mult,
            self.cached_input_rate * in_mult,
            self.cache_write_rate * in_mult,
            self.output_rate * out_mult,
        ], dtype=np.float64) * lane_mult


FRONTIER_CARD = RateCard("frontier-tier", input_rate=2.00, cached_input_rate=0.20, cache_write_rate=2.50, output_rate=12.00)
FAST_CARD = RateCard("fast-8b-tier", input_rate=0.25, cached_input_rate=0.025, cache_write_rate=0.3125, output_rate=1.00)


def normalize_provider_usage(
    *, prompt_tokens: int, cached_read_tokens: int, cache_write_tokens: int,
    completion_tokens: int, reasoning_tokens: int, style: str = "openai",
) -> np.ndarray:
    """Return disjoint [fresh_input, cached_read, cache_write, output] counts."""
    if style == "openai":
        fresh_in = max(0, prompt_tokens - cached_read_tokens - cache_write_tokens)
    elif style == "anthropic":
        fresh_in = prompt_tokens
    else:
        raise ValueError(f"Unsupported style: {style}")
    if reasoning_tokens > completion_tokens:
        raise ValueError("reasoning_tokens cannot exceed completion_tokens")
    return np.array([fresh_in, cached_read_tokens, cache_write_tokens, completion_tokens], dtype=np.float64)


def price_tokens(tokens: np.ndarray, *, lane: str, card: RateCard) -> float:
    total_input = int(tokens[0] + tokens[1] + tokens[2])
    return float(np.dot(tokens, card.rate_vector(lane=lane, total_input_tokens=total_input)) / MILLION)


sample_vec = normalize_provider_usage(
    prompt_tokens=2_200, cached_read_tokens=1_200, cache_write_tokens=0,
    completion_tokens=420, reasoning_tokens=160, style="openai",
)
sample_cost = price_tokens(sample_vec, lane="interactive", card=FRONTIER_CARD)
out_share = (sample_vec[3] * FRONTIER_CARD.output_rate / MILLION) / sample_cost * 100.0
print(f"Disjoint buckets [fresh, read, write, out]: {sample_vec.astype(int).tolist()}")
print(f"Frontier interactive cost: ${sample_cost:.6f} (output share: {out_share:.1f}%)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Disjoint buckets [fresh, read, write, out]: [1000, 1200, 0, 420]
Frontier interactive cost: $0.007280 (output share: 69.2%)
```
<!-- leetllm: output:end -->

> **Key insight:** Even with over half the prompt cached (`1,200` of `2,200` tokens), output decoding (`420` tokens including `160` reasoning tokens) drives **69.2%** of the call cost. Bounding output verbosity and reasoning length saves far more than trimming a warm system prompt.[^openai2026reasoning]

## Context cliffs, prefix amortization, and semantic-cache collisions

Three nonlinear effects dominate caching and context spend. First, crossing the `272,000`-token long-context cutoff reprices the entire turn retroactively[^openai2026gpt54]. Second, explicit prefix writes carry a `1.25x` surcharge over uncached prefill[^anthropic2026promptcaching]: with write multiplier $C_{\text{write}} = 1.25$ and read multiplier $C_{\text{read}} = 0.10$, $n$ shared calls beat uncached prefill once:

$$
1.25 + 0.10(n - 1) < n \iff 1.15 < 0.90n \iff n \ge 2
$$

Prefix caching breaks even on the second call ($1.35\times$ vs. $2.00\times$) and cuts six-call prefix cost by 70.8%; putting a per-request timestamp at the front of the prompt keeps every call stuck at $n = 1$ (a permanent 25% surcharge)[^openai2026promptcaching].

<figure>
  <img src="illustrations/_generated/cost_optimization_dark.png" alt="Prefix-cache amortization break-even curve over six calls paired with the cost-versus-quality Pareto frontier" />
  <figcaption>Explicit prompt-prefix writes pay back their 1.25x surcharge by the second shared call and cut six-call prefix spend below one-third of uncached prefill, while the Pareto curve flags configurations that dominate slower, higher-cost alternatives.</figcaption>
</figure>

Third, **semantic response caching** carries a failure mode that **KV prefix caching** never has: **antonym and negation collision**. Semantic caches retrieve stored replies when <span data-glossary="cosine-similarity">cosine similarity</span> clears a cutoff $\tau$ and beat fresh inference only above break-even hit rate $h^*$[^bang2023][^reimers2019]:

$$
\operatorname{cosine}(a, b) = \frac{a \cdot b}{\lVert a \rVert_2 \lVert b \rVert_2}, \qquad h^* = \frac{c_{\text{lookup}}}{c_{\text{gen}}}
$$

Because embeddings measure topical and lexical overlap rather than logical equivalence, opposite commands like `"enable TLS"` vs. `"disable TLS"` or `"refund eligible"` vs. `"not eligible"` routinely score `0.90` to `0.96` under dense encoders, serving inverted answers on a cache hit. **KV prefix caching** hashes **exact token IDs from token 0 forward**, splitting `"enable"` from `"disable"` deterministically at zero semantic collision risk[^vllm2026prefix][^openai2026promptcaching]. Put semantic caches behind strict scope keys (tenant, access scope, corpus version, schema) plus intent/polarity gates, and verify your store's metric direction (cosine similarity $\ge 0.88$ vs. Redis cosine distance $d_{\text{cos}} \le 0.12$)[^redis2026SemanticCacheApi].

<!-- leetllm: test, output=show, continue=cost-ledger, id=cost-frontier-and-collisions, deps=numpy,scikit-learn -->
```python title="cliffs-amortization-and-antonym-collisions.py"
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

just_under = normalize_provider_usage(prompt_tokens=271_500, cached_read_tokens=200_000, cache_write_tokens=0, completion_tokens=300, reasoning_tokens=80)
just_over = normalize_provider_usage(prompt_tokens=273_000, cached_read_tokens=200_000, cache_write_tokens=0, completion_tokens=300, reasoning_tokens=80)
print(f"271.5K short tier: ${price_tokens(just_under, lane='interactive', card=FRONTIER_CARD):.4f} | 273.0K long tier: ${price_tokens(just_over, lane='interactive', card=FRONTIER_CARD):.4f}")

for n in (1, 2, 4, 6):
    c = 1.25 + 0.10 * (n - 1)
    print(f"n={n}: uncached={n:.2f}x | write+read={c:.2f}x | net={(1 - c / n) * 100:+.1f}%")

pairs = [
    ("How do I enable TLS on the API gateway?", "How do I disable TLS on the API gateway?"),
    ("Is my annual subscription refund eligible?", "Is my annual subscription not eligible for a refund?"),
    ("How long are revoked API keys retained?", "How long do revoked API keys stay stored?"),
]
vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5)).fit_transform([t for p in pairs for t in p])
for idx, (a, b) in enumerate(pairs):
    sim = float(cosine_similarity(vec[2 * idx], vec[2 * idx + 1])[0, 0])
    ta, tb = a.lower().split(), b.lower().split()
    shared = next((i for i, (x, y) in enumerate(zip(ta, tb)) if x != y), min(len(ta), len(tb)))
    print(f"Pair {idx + 1}: cosine={sim:.3f} | exact shared word prefix={shared}/{len(ta)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
271.5K short tier: $0.1866 | 273.0K long tier: $0.3774
n=1: uncached=1.00x | write+read=1.25x | net=-25.0%
n=2: uncached=2.00x | write+read=1.35x | net=+32.5%
n=4: uncached=4.00x | write+read=1.55x | net=+61.3%
n=6: uncached=6.00x | write+read=1.75x | net=+70.8%
Pair 1: cosine=0.762 | exact shared word prefix=3/9
Pair 2: cosine=0.793 | exact shared word prefix=4/6
Pair 3: cosine=0.530 | exact shared word prefix=2/7
```
<!-- leetllm: output:end -->

Notice the inversion: both opposite-intent pairs (`0.762` for `"enable TLS"` vs. `"disable TLS"` and `0.793` for `"refund eligible"` vs. `"not eligible"`) outscore the valid paraphrase (`0.530`). Dense neural embeddings show the same geometry at `0.94` to `0.96`, whereas exact prefix hashing splits Pair 1 cleanly at word 3 (`"enable"` vs. `"disable"`).

To use a semantic cache safely in production, layer three gates before checking cosine similarity:

- **Canonical scope key:** Hash `tenant_id`, `access_scope`, `corpus_version`, `locale`, and `response_schema` together so a cached answer from an older policy snapshot or another customer never leaks across boundaries.
- **Intent and polarity filter:** Route state-changing verbs (`enable` vs. `disable`, `upgrade` vs. `downgrade`, `eligible` vs. `not eligible`) through a fast deterministic classifier or exact-match allowlist so opposite instructions never share a vector bucket.
- **Shadow calibration before live serving:** Measure hit precision against live generation in shadow mode before turning on cached replies, and track the break-even hit rate $h^* = c_{\text{lookup}} / c_{\text{gen}}$ so lookup infrastructure never costs more than the calls it avoids.

Choosing an operating point across prompt length, output cap, and model size also means plotting cost against measured answer quality on the **Pareto frontier**. Cutting `max_tokens` too hard truncates JSON citations and drags quality down to 74%, whereas leaving batch-eligible evaluations on the interactive lane is strictly dominated by both concise prompting and smaller routing tiers.

## Cascade fast models to frontier with schema-preserving fallback

Dynamic requests (such as live order lookups) change on every turn and cannot hit a semantic cache. **Model cascading** cuts their cost by routing incoming queries to a fast 8B tier first and escalating to a frontier model only on low confidence, strict JSON schema failure, or a pre-output transport error[^routellm2024][^litellm2026reliability]. In a multi-provider gateway, track an exponentially weighted moving average (`EWMA`) of each lane's latency and transport error rate so degraded endpoints lose rank smoothly before a full outage occurs.

Three engineering rules keep cascading and failover reliable in production:

1. **Preserve schema and privacy scope:** Every fallback lane must honor the exact same JSON schema (`cited-support-answer-v3`) and data-residency boundary. Register evaluated lane capabilities explicitly because native structured-output wire fields differ across APIs (OpenAI `text.format` / `response_format` vs. Anthropic `output_config.format`), and compatibility wrappers can silently disable prompt caching or tool-level strictness[^openai_structured_outputs][^anthropic2026StructuredOutputs].
2. **Buffer before streaming:** Silent failover is valid only before any token streams to the caller; post-output failover cannot splice two partial responses together, and auth errors (`401`/`403`) or safety refusals should abort failover rather than masking broken credentials[^awsbackoff].
3. **Share one deadline and dollar ceiling:** Subtract first-hop latency and spend before dialing the frontier tier, aborting escalation if remaining time is shorter than the frontier model's EWMA latency.

<!-- leetllm: test, output=show, continue=cost-frontier-and-collisions, id=model-cascade, deps=numpy,scikit-learn -->
```python title="schema-preserving-model-cascade.py"
from dataclasses import dataclass

REQUIRED_KEYS = {"answer", "citations", "confidence"}


@dataclass(frozen=True)
class Attempt:
    payload: dict | None
    latency_ms: float
    prompt_tokens: int
    cached_tokens: int
    output_tokens: int
    transport_error: bool = False


def valid_schema(p: dict | None) -> bool:
    return p is not None and REQUIRED_KEYS.issubset(p) and bool(p["answer"]) and len(p["citations"]) >= 1


def cascade(fast: Attempt, frontier: Attempt, *, conf_floor=0.85, deadline_ms=2_000.0, budget_usd=0.01, frontier_ewma_ms=900.0) -> dict:
    fast_vec = normalize_provider_usage(prompt_tokens=fast.prompt_tokens, cached_read_tokens=fast.cached_tokens, cache_write_tokens=0, completion_tokens=fast.output_tokens, reasoning_tokens=0)
    spent, elapsed = price_tokens(fast_vec, lane="interactive", card=FAST_CARD), fast.latency_ms
    if (not fast.transport_error) and valid_schema(fast.payload) and fast.payload["confidence"] >= conf_floor:
        return {"route": "fast-8b", "ok": True, "cost": spent, "ms": elapsed}

    fr_vec = normalize_provider_usage(prompt_tokens=frontier.prompt_tokens, cached_read_tokens=frontier.cached_tokens, cache_write_tokens=0, completion_tokens=frontier.output_tokens, reasoning_tokens=0)
    fr_cost = price_tokens(fr_vec, lane="interactive", card=FRONTIER_CARD)
    if frontier_ewma_ms > (deadline_ms - elapsed) or (spent + fr_cost) > budget_usd:
        return {"route": "aborted-budget", "ok": False, "cost": spent, "ms": elapsed}

    ok = (not frontier.transport_error) and valid_schema(frontier.payload)
    return {"route": "escalated-frontier", "ok": ok, "cost": spent + fr_cost, "ms": elapsed + frontier.latency_ms}


fr_ok = Attempt({"answer": "Refund approved.", "citations": ["pol-4"], "confidence": 0.96}, 820, 1400, 400, 133)
for label, fa in [
    ("High-conf fast hit",  Attempt({"answer": "Order shipped.", "citations": ["ord-9"], "confidence": 0.93}, 260, 1400, 400, 133)),
    ("Low-conf escalate",   Attempt({"answer": "Maybe eligible.", "citations": ["pol-4"], "confidence": 0.62}, 280, 1400, 400, 133)),
    ("Bad schema escalate", Attempt({"answer": "No citations", "confidence": 0.95}, 240, 1400, 400, 95)),
    ("Slow fast timeout",   Attempt(None, 1350, 1400, 400, 0, transport_error=True)),
]:
    r = cascade(fa, fr_ok)
    print(f"{label:20s} -> {r['route']:18s} | ok={str(r['ok']):5s} | ${r['cost']:.5f} | {r['ms']:.0f}ms")

fr_only = price_tokens(np.array([1000, 400, 0, 133], dtype=np.float64), lane="interactive", card=FRONTIER_CARD)
fast_only = price_tokens(np.array([1000, 400, 0, 133], dtype=np.float64), lane="interactive", card=FAST_CARD)
blended = 0.70 * fast_only + 0.30 * (fast_only + fr_only)
print(f"Always frontier: ${fr_only:.5f}/call | 70/30 cascade: ${blended:.5f}/call ({(1 - blended / fr_only) * 100:.1f}% saved)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
High-conf fast hit   -> fast-8b            | ok=True  | $0.00039 | 260ms
Low-conf escalate    -> escalated-frontier | ok=True  | $0.00407 | 1100ms
Bad schema escalate  -> escalated-frontier | ok=True  | $0.00403 | 1060ms
Slow fast timeout    -> aborted-budget     | ok=False | $0.00026 | 1350ms
Always frontier: $0.00368/call | 70/30 cascade: $0.00150/call (59.3% saved)
```
<!-- leetllm: output:end -->

Resolving 70% of dynamic queries cleanly on `fast-8b` and escalating 30% cuts blended unit spend by **59.3%**, while enforcing the shared deadline stops a slow `1,350 ms` timeout from launching an escalation that cannot finish within `2,000 ms`.

## Replay cohorts, stress-test budgets, and size quality samples

Splitting our 10,500 daily requests into functional cohorts reveals where spend concentrates: 3,200 scoped semantic FAQ hits avoid \$13.82/day of live inference at \$0 generation cost, while dynamic `Orders` lookups absorb 46.1% of real cash spend (\$11.03/day), making them the prime cascade target. Track cost per **accepted answer** alongside raw per-call cost: if `Review` retries malformed JSON at `1.28` calls per accepted outcome, a slightly higher per-call tier with zero retries wins on total spend.

<figure>
  <img src="illustrations/_generated/cost_guardrail_flow_dark.png" alt="Cohort share of the daily generation bill compared with avoided stored-answer generation" />
  <figcaption>Cohorts with dynamic per-request payloads generate nearly half of total daily cash spend, whereas avoided semantic cache hits represent a separate exposure pool that returns to the bill immediately if cache precision drops.</figcaption>
</figure>

<!-- leetllm: test, output=show, continue=model-cascade, id=daily-cohort-replay, deps=numpy,scikit-learn -->
```python title="daily-cohort-spend-replay.py"
WORKLOAD = [
    ("Orders", 3_000, "interactive", 1_000,   400,  0, 133, 1.08),
    ("Docs",   1_800, "interactive",   450,   830, 20, 267, 1.05),
    ("Review",   500, "interactive",   500, 1_400, 40, 266, 1.28),
    ("Eval",   2_000, "batch",         400, 1_320,  0, 146, 1.00),
]

avoided_daily = 3_200 * price_tokens(np.array([1_500, 0, 0, 110], dtype=np.float64), lane="interactive", card=FRONTIER_CARD)
daily_costs = {}
for name, calls, lane, fi, cr, cw, out, retry_mult in WORKLOAD:
    per_call = price_tokens(np.array([fi, cr, cw, out], dtype=np.float64), lane=lane, card=FRONTIER_CARD)
    daily_costs[name] = {"per_call": per_call, "per_task": per_call * retry_mult, "daily": per_call * calls}

total_daily = sum(v["daily"] for v in daily_costs.values())
monthly_base = total_daily * 30.0
for name, s in daily_costs.items():
    print(f"{name:6s} | ${s['per_call']:.5f}/call | ${s['per_task']:.5f}/task | ${s['daily']:6.2f}/day ({s['daily']/total_daily*100:4.1f}%)")
print(f"Avoided semantic hits (3200/day): ${avoided_daily:.2f}/day")
print(f"Daily billed: ${total_daily:.3f} -> 30-day bill: ${monthly_base:.2f} (headroom vs $750: ${750 - monthly_base:.2f})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Orders | $0.00368/call | $0.00397/task | $ 11.03/day (46.1%)
Docs   | $0.00432/call | $0.00454/task | $  7.78/day (32.5%)
Review | $0.00457/call | $0.00585/task | $  2.29/day ( 9.6%)
Eval   | $0.00141/call | $0.00141/task | $  2.82/day (11.8%)
Avoided semantic hits (3200/day): $13.82/day
Daily billed: $23.906 -> 30-day bill: $717.18 (headroom vs $750: $32.82)
```
<!-- leetllm: output:end -->

A 4.4% monthly cushion fails immediately under realistic drift: +10% interactive traffic (`+10%`), a batch outage falling back to interactive (`ColdEval`), or a dynamic header breaking prefix reuse (`ColdAll`) each breach \$750. Before promoting a prompt compression or fast-tier cascade to reclaim margin, size your zero-defect evaluation set with the Rule of Three at 95% confidence:

$$
(1 - p)^n \ge 0.05 \implies \ln(1 - p) \approx -p \ge \frac{\ln 0.05}{n} \approx -\frac{3.0}{n} \implies p_{\max} \approx \frac{3}{n}
$$

Zero errors across $n = 100$ cases still leaves a `3.0%` latent defect ceiling; pushing $p_{\max}$ to `0.5%` requires at least $n = 600$ independent defect-free checks ($n = 1,000$ gives `0.30%`). Enforce the resulting unit economics in the gateway via `max_output_tokens = 300` and a **\$0.01 cumulative request ceiling** across attempts.

<figure>
  <img src="illustrations/_generated/release_budget_gate_dark.png" alt="Monthly spend sensitivity scenarios against a USD 750 cap paired with the 3/n zero-defect confidence bound" />
  <figcaption>A 10% interactive traffic uptick, lost batch scheduling, or cold prompt prefixes each breach the \$750 monthly cap, while the Rule of Three shows how sample size tightens zero-defect reliability guarantees.</figcaption>
</figure>

<!-- leetllm: test, output=show, continue=daily-cohort-replay, id=budget-and-gateway-cap, deps=numpy,scikit-learn -->
```python title="monthly-sensitivity-and-gateway-cap.py"
inter_daily = sum(daily_costs[k]["daily"] for k in ("Orders", "Docs", "Review"))
eval_daily = daily_costs["Eval"]["daily"]
plus10_mo = (1.10 * inter_daily + eval_daily) * 30.0
cold_eval_mo = (inter_daily + 2.0 * eval_daily + 2_000 * 16.0 * FRONTIER_CARD.cache_write_rate / MILLION) * 30.0
inter_reads = 3_000 * 400 + 1_800 * 830 + 500 * 1_400
cold_all_mo = (
    total_daily
    + inter_reads * (FRONTIER_CARD.input_rate - FRONTIER_CARD.cached_input_rate) / MILLION
    + inter_reads * 0.30 * (FRONTIER_CARD.cache_write_rate - FRONTIER_CARD.input_rate) / MILLION
) * 30.0

for label, val in [("Base", monthly_base), ("+10%", plus10_mo), ("ColdEval", cold_eval_mo), ("ColdAll", cold_all_mo)]:
    print(f"Scenario {label:8s}: ${val:6.2f}/mo [{'PASS' if val <= 750 else f'OVER (+${val - 750:.2f})'}]")
for n in (100, 600, 1000):
    print(f"Zero-defect n={n:4d} -> 3/n={300/n:.2f}% (exact={(1 - 0.05**(1/n))*100:.2f}%)")

max_fresh = int((0.01 - 300 * FRONTIER_CARD.output_rate / MILLION) / (FRONTIER_CARD.input_rate / MILLION))
print(f"Gateway cap: max_output=300, ceiling=$0.01, max_fresh_prompt={max_fresh} tokens")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Scenario Base    : $717.18/mo [PASS]
Scenario +10%    : $780.45/mo [OVER (+$30.45)]
Scenario ColdEval: $804.06/mo [OVER (+$54.06)]
Scenario ColdAll : $915.73/mo [OVER (+$165.73)]
Zero-defect n= 100 -> 3/n=3.00% (exact=2.95%)
Zero-defect n= 600 -> 3/n=0.50% (exact=0.50%)
Zero-defect n=1000 -> 3/n=0.30% (exact=0.30%)
Gateway cap: max_output=300, ceiling=$0.01, max_fresh_prompt=3200 tokens
```
<!-- leetllm: output:end -->

```mastery-quiz
[
  {
    "question": "An OpenAI usage payload reports prompt_tokens=2,200, cached_tokens=1,200, completion_tokens=420, and reasoning_tokens=160. What are the disjoint fresh input and billable output counts?",
    "options": [
      "Fresh input = 2,200; output = 580.",
      "Fresh input = 1,000; output = 420.",
      "Fresh input = 2,200; output = 260.",
      "Fresh input = 1,200; output = 160."
    ],
    "answer": "Fresh input = 1,000; output = 420.",
    "explanation": "cached_tokens is nested inside prompt_tokens (2,200 - 1,200 = 1,000 fresh input) and reasoning_tokens is already counted inside completion_tokens (420 total billable output)."
  },
  {
    "question": "Why can a semantic cache misfire on 'enable TLS' versus 'disable TLS', whereas KV prefix caching cannot?",
    "options": [
      "Embeddings capture topical overlap rather than logical equivalence, while KV prefix caching hashes exact token IDs from token 0.",
      "KV prefix caching runs a secondary LLM judge on every cache lookup.",
      "Semantic caches match only output tokens, while KV prefix caching matches JSON schemas.",
      "KV prefix caching uses a fixed 0.99 cosine threshold."
    ],
    "answer": "Embeddings capture topical overlap rather than logical equivalence, while KV prefix caching hashes exact token IDs from token 0.",
    "explanation": "Antonyms and negations share nearly identical vocabulary and score high cosine similarity. KV prefix caching matches exact token prefixes deterministically, splitting cleanly at 'enable' vs 'disable'."
  },
  {
    "question": "With a 1.25x explicit cache-write surcharge and 0.10x cached reads, when does prefix caching beat 1.00x uncached prefill, and what breaks it?",
    "options": [
      "Call 1 (n = 1); long outputs break amortization.",
      "Call 2 (n = 2, costing 1.35x vs 2.00x); a dynamic timestamp at the front of the prompt keeps every call at n = 1.",
      "Call 10 (n = 10); batch lanes disable prefix reads.",
      "Never, because the 1.25x write surcharge exceeds all read savings."
    ],
    "answer": "Call 2 (n = 2, costing 1.35x vs 2.00x); a dynamic timestamp at the front of the prompt keeps every call at n = 1.",
    "explanation": "Cached cost 1.25 + 0.10*(n - 1) beats n starting at n = 2. Mutating the prompt header forces a 1.25x cold write on every request."
  },
  {
    "question": "A cascade tries fast-8b first and escalates to frontier-70b on schema failure. Which invariants must the gateway enforce?",
    "options": [
      "Reset the caller timeout and drop JSON citation fields on the backup.",
      "Preserve the output schema and privacy scope while deducting first-hop time and spend from one shared budget.",
      "Stream fast-8b tokens first, then splice frontier-70b tokens on validation error.",
      "Route escalated calls to the 24-hour batch queue."
    ],
    "answer": "Preserve the output schema and privacy scope while deducting first-hop time and spend from one shared budget.",
    "explanation": "Buffer pre-output responses, keep identical schema and data-residency constraints across tiers, and enforce one cumulative deadline and dollar ceiling."
  },
  {
    "question": "Zero schema defects occur across n = 100 independent tests. What does the Rule of Three (3/n) say against a 0.5% defect cap?",
    "options": [
      "True failure rate is below 0.3% at 95% confidence.",
      "Up to 3.0% defect rates remain plausible; clearing 0.5% needs at least 600 independent zero-defect checks.",
      "Structured JSON eliminates binomial sampling uncertainty.",
      "Replaying the same 100 prompts six times establishes the n = 600 bound."
    ],
    "answer": "Up to 3.0% defect rates remain plausible; clearing 0.5% needs at least 600 independent zero-defect checks.",
    "explanation": "For zero failures across n independent checks, p_max is roughly 3/n (3.0% at n = 100), so p_max <= 0.5% requires n >= 600 independent cases."
  }
]
```

> **Next:** Continue to [Scaled Dot-Product Attention](/learn/scaled-dot-product-attention).
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
A lower price per token can still produce a higher monthly bill. When a model pads replies with verbose prose, burns hidden reasoning tokens, retries malformed JSON, or crosses a context-tier cutoff, a cheaper nominal tariff ends up costing more per accepted answer than a disciplined pipeline. Making LLM unit economics predictable means tracing cost down to GPU work, avoiding semantic cache traps, and routing routine turns away from frontier decoding.

## Start with the model work that actually executed

Before opening a rate card, separate requests that execute auto-regressive decoding from requests that bypass inference completely. A **semantic cache hit** returns a stored answer from vector storage for \$0 in generation fees. A **provider prompt-prefix read** loads resident KV-cache tensors for a shared system prompt, skipping redundant prefill on the header while still running fresh query prefill and sequential output decoding[^openai2026promptcaching][^anthropic2026promptcaching].

<figure>
  <img src="illustrations/_generated/generation_billing_paths_dark.png" alt="Generation billing paths split between stored-answer hits and four token-billed usage lines alongside token tariffs" />
  <figcaption>Separating stored semantic cache hits from interactive prefix reads, cold cache writes, long-context escalation, and asynchronous batch runs keeps unit costs traceable to actual GPU computation.</figcaption>
</figure>

Output decoding dominates GPU spend because generating tokens sequentially reloads model weights and KV tensors from memory every step (memory-bandwidth bound), whereas parallel prompt prefill saturates compute cores cleanly[^vllm2026optimization][^leviathan2023]. Parameterized rate cards mirror that physics directly: on a typical frontier tier (`input_rate = 2.00`, `cached_input_rate = 0.20`, `cache_write_rate = 2.50`, `output_rate = 12.00` per million tokens), output costs 6x fresh input and 60x cached reads[^openai2026pricing].

## Parameterize rate cards and separate disjoint token buckets

Avoid hardcoding dated provider pricing tables or double-counting nested usage fields. On OpenAI-style responses, `cached_tokens` sits inside `prompt_tokens`, and hidden `reasoning_tokens` already sit inside `completion_tokens`[^openai2026reasoning]. Subtracting cached and write tokens isolates fresh input, and reading `completion_tokens` directly prices reasoning without double billing.

```python title="reader-price-usage-record.py"
import numpy as np

MILLION = 1_000_000.0


def price_usage_record(
    prompt_tokens, cached_read, cache_write, completion_tokens,
    *, input_rate=2.00, cached_rate=0.20, write_rate=2.50, output_rate=12.00,
    lane="interactive", long_threshold=272_000,
):
    in_mult = 2.0 if prompt_tokens > long_threshold else 1.0
    out_mult = 1.5 if prompt_tokens > long_threshold else 1.0
    lane_mult = 0.5 if lane == "batch" else 1.0
    fresh = max(0, prompt_tokens - cached_read - cache_write)
    vec = np.array([fresh, cached_read, cache_write, completion_tokens], dtype=np.float64)
    rates = np.array([input_rate * in_mult, cached_rate * in_mult, write_rate * in_mult, output_rate * out_mult]) * lane_mult
    return float(np.dot(vec, rates) / MILLION)
```

Notice two sharp pricing cliffs built into that helper. First, crossing the `272,000`-token long-context cutoff reprices every token in the turn, not merely the tokens beyond `272K`[^openai2026gpt54]. Second, explicit prefix writes carry a `1.25x` surcharge over uncached prefill, so a prompt header that mutates on every call (for example from an injected timestamp) loses 25% immediately, whereas a stable header breaks even on the second call (`1.35x < 2.00x`) and cuts six-call prefix cost by 70.8%.

<figure>
  <img src="illustrations/_generated/cost_optimization_dark.png" alt="Prefix-cache amortization break-even curve over six calls paired with the cost-versus-quality Pareto frontier" />
  <figcaption>Explicit prompt-prefix writes pay back their 1.25x surcharge by the second shared call and cut six-call prefix spend below one-third of uncached prefill, while the Pareto curve flags configurations that dominate slower, higher-cost alternatives.</figcaption>
</figure>

## Guard semantic caches against antonym collisions

Semantic caching and KV prefix caching solve different problems and carry opposite risk profiles. A semantic cache embeds user queries and reuses stored responses above a cosine similarity cutoff $\tau$[^bang2023][^reimers2019]. Because embeddings capture topical similarity rather than logical equivalence, opposite commands routinely collide at cosine `0.90` to `0.96`: `"enable TLS"` vs. `"disable TLS"`, or `"refund eligible"` vs. `"not eligible"`. Returning a cached answer across an antonym or negation swap hands users the inverted answer.

**KV prefix caching** eliminates that collision risk completely because it hashes **exact token IDs from token 0 forward**[^vllm2026prefix][^openai2026promptcaching]. The moment `"enable"` changes to `"disable"`, the prefix match ends deterministically and the model recomputes fresh attention for the tail. Keep semantic caches behind strict scoping keys (tenant, access scope, corpus version, response schema) plus explicit intent gates, verify your vector store's metric direction (similarity $\ge \tau$ vs. distance $\le 1 - \tau$)[^redis2026SemanticCacheApi], and check that hit rate exceeds the break-even floor $h^* = c_{\text{lookup}} / c_{\text{gen}}$.

## Cascade fast models to frontier with schema-preserving fallback

Dynamic requests (such as live order lookups) change every turn and bypass semantic caches. Instead of sending all of them straight to a frontier model, route them through a **model cascade**[^routellm2024][^litellm2026reliability]:

1. **Try a fast 8B tier first** under the exact same structured JSON schema and privacy scope.
2. **Buffer before streaming** so a low confidence score, JSON schema failure, or pre-output transport error (`429`/`503`/timeout) can escalate cleanly to the frontier tier without splicing partial tokens into the user's stream[^awsbackoff].
3. **Share one deadline and dollar ceiling** across both hops: subtract first-hop latency and spend before dialing the frontier model, and abort escalation if the remaining clock cannot fit the frontier tier's expected latency.

If a fast 8B model costs roughly one-tenth of a frontier call and resolves 70% of dynamic queries cleanly while escalating 30% to frontier, blended unit cost drops by nearly **60%** while preserving identical schema guarantees on every accepted response.

## Build and stress-test a cohort-level monthly forecast

Forecast spend cohort by cohort so high-leverage traffic stands out. Across 10,500 daily requests under the frontier baseline, 3,200 stored semantic hits cost \$0 while avoiding \$13.82/day of live generation, 3,000 live order lookups drive \$11.03/day (46.1% of spend), shared doc prompts add \$7.78/day (32.5%), access reviews add \$2.29/day (9.6%), and 2,000 asynchronous batch evaluations add \$2.82/day (11.8%)[^openai2026batch]. Together they cost \$23.91/day (\$717.18/month), leaving just \$32.82 beneath a \$750 ceiling.

<figure>
  <img src="illustrations/_generated/cost_guardrail_flow_dark.png" alt="Cohort share of the daily generation bill compared with avoided stored-answer generation" />
  <figcaption>Cohorts with dynamic per-request payloads generate nearly half of total daily cash spend, whereas avoided semantic cache hits represent a separate exposure pool that returns to the bill immediately if cache precision drops.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=reader-cost-forecast, deps=numpy -->
```python title="reader-cohort-and-cascade-forecast.py"
import numpy as np

MILLION = 1_000_000.0
FRONTIER = np.array([2.00, 0.20, 2.50, 12.00])  # fresh, read, write, output ($/1M)
FAST_8B  = np.array([0.25, 0.025, 0.3125, 1.00])

# Cohorts: (name, daily_calls, batch_mult, fresh, read, write, out)
cohorts = [
    ("Orders", 3_000, 1.0, 1_000,   400,  0, 133),
    ("Docs",   1_800, 1.0,   450,   830, 20, 267),
    ("Review",   500, 1.0,   500, 1_400, 40, 266),
    ("Eval",   2_000, 0.5,   400, 1_320,  0, 146),
]

daily_base = sum(calls * float(np.dot([f, r, w, o], FRONTIER * mult) / MILLION) for _, calls, mult, f, r, w, o in cohorts)
monthly_base = daily_base * 30.0

# Route 70% of dynamic Orders cleanly on fast-8b; escalate 30% to frontier
order_frontier = float(np.dot([1_000, 400, 0, 133], FRONTIER) / MILLION)
order_fast = float(np.dot([1_000, 400, 0, 133], FAST_8B) / MILLION)
order_cascade = 0.70 * order_fast + 0.30 * (order_fast + order_frontier)
monthly_cascaded = (daily_base - 3_000 * (order_frontier - order_cascade)) * 30.0

print(f"Baseline 30-day bill: ${monthly_base:.2f} (headroom vs $750: ${750 - monthly_base:.2f})")
print(f"With 70/30 Orders cascade: ${monthly_cascaded:.2f} (headroom vs $750: ${750 - monthly_cascaded:.2f})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Baseline 30-day bill: $717.18 (headroom vs $750: $32.82)
With 70/30 Orders cascade: $520.96 (headroom vs $750: $229.04)
```
<!-- leetllm: output:end -->

Without cascading, a 4.4% monthly cushion breaks easily: +10% interactive traffic reaches \$780.45, losing batch evaluation jumps to \$804.06, and cold prompt prefixes surge past \$915. Adding the 70/30 fast-to-frontier cascade on the dynamic `Orders` cohort drops the 30-day bill from \$717.18 to \$520.98, creating \$229 of safety margin. Before shipping any prompt compression or cascade, validate quality with enough independent examples: by the Rule of Three (`3/n`), passing 100 checks with zero failures still leaves a 3.0% upper defect risk, so clearing a `0.5%` ceiling requires `600` to `1,000` independent zero-defect checks.

<figure>
  <img src="illustrations/_generated/release_budget_gate_dark.png" alt="Monthly spend sensitivity scenarios against a USD 750 cap paired with the 3/n zero-defect confidence bound" />
  <figcaption>A 10% interactive traffic uptick, lost batch scheduling, or cold prompt prefixes each breach the \$750 monthly cap, while the Rule of Three shows how sample size tightens zero-defect reliability guarantees.</figcaption>
</figure>

## Enforce the economics in the gateway

Monthly bills arrive far too late to catch a runaway retry loop or broken prefix header. Translate your forecast into two stateless per-request limits in the model gateway: a `300`-token `max_output_tokens` cap matching your structured JSON schema, and a **\$0.01 cumulative request ceiling** spanning both fast and escalated attempts alongside one shared wall-clock deadline[^jiang2024]. Pairing disjoint token accounting, deterministic KV prefix caching, collision-safe semantic lookup, and schema-preserving model cascades turns unpredictable LLM invoices into an engineered budget.

> **Next:** Continue to [Scaled Dot-Product Attention](/learn/scaled-dot-product-attention).
<!-- leetllm: edition:reader:end -->
