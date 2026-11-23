---
title: Usage shape
importance: 78
---
**Usage shape** is the multi-dimensional profile of how capacity is consumed over time: when load arrives, how large each request is, which tenants and routes burn the scarce resource, and how that burn maps onto billing, quotas, and GPUs. Totals answer "how much?" Usage shape answers "how is that much *distributed*?" Two products can share the same monthly token volume and still need different rate limits, different fleet sizes, and different plan failure modes.

Usage shape is the joint distribution of **arrival process** (smooth vs bursty), **request cost** (short chat vs long-context vs long-decode), **tenant mix**, **cache state**, and **phase pressure** ([prefill](glossary://prefill) vs [decode](glossary://decode-phase)). Capacity planning, [rate limits](glossary://rate-limit), [quotas](glossary://quota), [fair use](glossary://fair-use-limit), and [metered billing](glossary://metered-billing) all encode assumptions about that joint distribution. Wrong assumptions look like "traffic only grew 10 percent" while p95 and invoices explode.

## Intuition

Treat volume as area under a curve and shape as the curve itself. Same area can be a flat line or a spike. A flat line fits a small always-on fleet and a gentle token bucket. A weekday 09:00 spike needs either reserved peak capacity, admission control, or a product promise that queues or degrades during the crest.

LLM cost is non-linear in request size. Prefill is compute-heavy and pays for prompt tokens (worse on cache miss). Decode is memory-bandwidth heavy and pays for output length and concurrent live sequences. Providers therefore publish multi-axis limits such as **RPM** (requests per minute) and **TPM** (tokens per minute): either axis can bind first depending on shape. Twenty tiny requests can exhaust RPM while barely touching TPM; a handful of long-context agents can exhaust TPM and KV memory while RPM still looks healthy.

## Dimensions to measure

Slice usage before you change infra or packaging. Useful axes:

| Axis | What to record | Why it changes decisions |
|---|---|---|
| Time | tokens/s, QPS, concurrent streams by minute of day / day of week | Peak sizing, autoscaling, fair-use windows |
| Request size | input tokens, output tokens, total, max context | Prefill vs decode pressure, TPM vs RPM |
| Tenant / plan | identity, workspace, plan tier | Noisy-neighbor isolation, reserve vs best-effort |
| Route / model | model class, tool loops, multimodal | Cost rate card and shared-pool blast radius |
| Cache state | prefix / KV hit vs miss | Same prompt length, very different GPU seconds |
| Outcome | success, cancel, retry, 429 | Retries reshape load into thundering herds |

If you only store monthly aggregates, you cannot replay a dispute, explain a 3x outage, or choose between a rolling quota and hard metered overage.

## Example

Two workspaces both bill **30 million tokens in a 30-day month** (~1M tokens/day average). Same invoice line if you only sum tokens. Different systems if you look at shape.

**Workspace A (interactive support):** ~2,000 short turns/day, mean 400 input + 100 output tokens (1M tokens/day). Traffic is near-uniform over a 10-hour workday, so business-hour average is about $10^{6} / (10 \times 3600) \approx 28$ tokens/s, with mild peaks above that. Cache hit rate ~60% on system prompts. Concurrency rarely exceeds 8 streams.

**Workspace B (agent + RAG batch):** same daily token total, but ~50% of tokens land in a **2-hour morning batch** of long-context jobs (mean 8k input + 1.5k output), plus continuous agent loops with low cache hit rate. Peak concurrent streams hit 40; many requests hold large KV pages for minutes.

Rough peak token rates during the busy window (order of magnitude):

$$
R_{\mathrm{avg,day}} \approx \frac{10^{6}}{24 \times 3600} \approx 11.6\ \mathrm{tokens/s}.
$$

If B concentrates half the day's tokens into 2 hours:

$$
R_{\mathrm{peak,B}} \approx \frac{0.5 \times 10^{6}}{2 \times 3600} \approx 69\ \mathrm{tokens/s}
$$

on average across that window, with short sub-minute bursts much higher. This busy-window average is about $69 / 11.6 \approx 6\times$ the daily average. Long context can also raise attention work and KV residency; GPU time per token depends on batching, cache hits, hardware, and phase as well as length.

| Same monthly tokens | Workspace A | Workspace B |
|---|---|---|
| Dominant bottleneck | modest decode concurrency | prefill bursts + KV residency |
| RPM vs TPM | often RPM-safe, TPM easy | TPM and concurrency bind first |
| Rate-limit fit | small burst allowance | needs sustained TPM + concurrency caps |
| Cache | high reuse, cheaper effective load | cold long prompts, expensive misses |
| Plan failure mode | rarely hits ceiling | hard stop or queue every weekday morning |
| Fleet implication | small steady pool | either scale for peak or shed/queue |

Product packaging that quotes only "30M tokens/month" sells both as the same plan. Serving reality treats them as different products.

## Worked numbers: policy fit

Suppose the shared gateway enforces a per-workspace [token bucket](glossary://token-bucket) of capacity $C = 200{,}000$ tokens and refill $r = 50{,}000$ tokens/min (a TPM-like envelope), plus a concurrency cap of 10 streams.

Idle refill fills the bucket; a burst of size $b$ is admitted only if $b \le C$ and concurrent slots remain. Long-run average cannot exceed $r$.

- **A:** business-hour rate ~ $28$ tokens/s $\approx 1{,}700$ tokens/min $\ll r$. Bursts of a few thousand tokens fit in $C$. Concurrency 8 $\le 10$. Shape fits the bucket.
- **B:** morning window averages ~ $69$ tokens/s $\approx 4{,}100$ tokens/min still under $r$, but a single 8k+1.5k request costs ~9.5k tokens and a fleet of 40 agents tries to enter at once. Concurrency 40 $> 10$ binds first; simultaneous prefills also spike TTFT for everyone on the pool. The monthly total never predicted the 429s.

If B instead hits a **fixed calendar quota** that resets at midnight UTC, the batch that starts at 00:05 can drain the day in an hour, then hard-stop until the next reset. A [rolling quota](glossary://rolling-quota) over 24h spreads recovery as old usage ages out, but still cannot create GPU capacity that was never provisioned for the peak.

## How product and serving read the same shape

Usage shape is the shared language between packaging and infrastructure:

1. **Smooth interactive traffic** → fair-use or soft rolling limits, modest burst buckets, prioritize TTFT, small always-on pool.
2. **Bursty batch / agents** → hard concurrency caps, separate batch lane, reserved capacity or async queue, metered overage for peak.
3. **Long-prefill heavy** (RAG, doc QA) → prefill capacity, [prefix cache](glossary://prefix-cache) investment, TPM-weighted limits, watch TTFT.
4. **Long-decode heavy** (reasoning, code gen) → decode slots and KV pages dominate; concurrency and output-token meters matter more than request count.
5. **Multi-tenant mix** → per-tenant shape plus global shape; one agent tenant can rewrite the fleet curve for everyone on a shared pool.

Databricks-style "model unit" abstractions exist for the same reason: request count and raw tokens are weak proxies when cost is a non-linear function of input length, output length, cache hits, and multimodality. Whatever unit you pick, size its **distribution over time** alongside the monthly sum.

## Production failure modes

These failures arise from load shape and affect serving capacity:

- **Peak blind totals.** Monthly tokens look fine; weekday open or a cron job creates a cliff in TTFT and 429s.
- **Wrong binding axis.** You raise RPM while the workload is TPM-bound (or the reverse). OpenAI-style multi-metric limits fail on whichever metric hits first.
- **Concurrency ignored.** Token totals fit; live sequences exhaust KV and collapse [continuous batching](glossary://continuous-batching) goodput.
- **Cache-blind sizing.** Prompt tokens look identical on paper; miss-heavy traffic needs several times the prefill capacity of hit-heavy traffic.
- **Retry amplification.** Clients without jitter retry into a full bucket and turn a short crest into a sustained overload.
- **Opaque plan ceiling.** Marketing says unlimited; the real shape is a five-hour session budget or a weekly fair-use cap. Users experience "random" hard stops unless the failure shape (reset, top-up, queue, fallback, overage) is explicit.

When "traffic grew 10 percent" cannot explain a 3x incident, compare peak rates, size histograms, tenant shares, cache hit rate, and concurrency alongside monthly totals.

## Why it matters here

Curriculum and production work on multi-tenant serving, plan design, and capacity all need a characterized load curve alongside its integral. Usage shape explains why the same total volume can be cheap and stable or expensive and fragile, and it tells you whether the next lever is a bigger fleet, a different [quota](glossary://quota), a fair-use policy, or a clearer metered product.

## Related terms

- [Quota](glossary://quota)
- [Rate limit](glossary://rate-limit)
- [Fair use limit](glossary://fair-use-limit)
- [Metered billing](glossary://metered-billing)
- [Token bucket](glossary://token-bucket)
