---
title: Latency budget
importance: 80
---
A **latency budget** is a fixed time envelope for a request or user-visible interaction, then an allocation of that envelope across the stages of the [request path](glossary://request-path). The product [SLO](glossary://slo) says how fast the whole path must be (for example p95 end-to-end under $2\,\mathrm{s}$). The budget turns that single number into stage targets with owners: gateway, retrieval, prefill, decode, tools, safety, and stream delivery.

Without a budget, every hop "tries to be fast" and nobody owns the residual. When the path overruns, attribute latency to the stage that spent beyond its share across the model, index, network, or other request-path components.

An error budget tracks reliability misses against an [SLO](glossary://slo) over a window. A latency budget allocates one request's allowed wall time across stages.

## Intuition

An end-to-end latency target must be allocated across stages. If p95 "first useful token on screen" must stay below $900\,\mathrm{ms}$, encode, retrieve, pack, queue, prefill, and first decode need budgets whose total leaves margin for variance and bounded retries. A stage with no cap can consume the entire target.

For LLM products the pie has a few different shapes:

| What users feel | Metric to budget | Typical owner |
|---|---|---|
| Silence before anything appears | [TTFT](glossary://ttft) (or time-to-first-audio / first UI paint) | routing, retrieval, prefill, queue |
| Stream that stutters after it starts | [ITL](glossary://itl) / [TPOT](glossary://tpot) | decode scheduler, batching, KV pressure |
| Full answer done before next action | end-to-end (E2E) latency | answer length, tools, multi-step agents |

Interactive chat often budgets TTFT tightly and treats total E2E as a softer target that scales with output length. Code-complete, voice, and agent tool loops may reverse that: the full result must land before a deadline, so E2E (or per-hop tool timeout) is the hard budget.

## Formula

Let $B$ be the end-to-end latency target for a defined SLI. Split a sequential path into stages $1,\ldots,k$ with per-request allocations $b_i$ and a reserved residual $m$ (queue spikes, GC, cold cache, client jitter):

$$
\sum_{i=1}^{k} b_i + m \le B.
$$

Use this arithmetic for planning; percentiles do not add: $p95(\sum_i L_i)\ne\sum_i p95(L_i)$. Measure the end-to-end distribution from matching request traces; if statistical stage bounds are used, account for their joint exceedance probability. Timeouts should nest **inside** the budget. If stage $i$ is sequential and may not retry into another stage's share:

$$
t_{\mathrm{timeout},i} \le b_i \le B - \sum_{j \ne i} b_j - m.
$$

For a request with $n \ge 2$ individually timestamped output tokens, define E2E here as request start to the **last content token**, and TPOT as the mean of that request's $n-1$ token gaps:

$$
\mathrm{E2E} \approx \mathrm{TTFT} + (n-1)\cdot \overline{\mathrm{ITL}},
$$

with $\overline{\mathrm{ITL}}$ equal to request-level [TPOT](glossary://tpot). So a product that must finish $n$ tokens by time $B$ forces a joint constraint:

$$
\mathrm{TTFT} + (n-1)\cdot \mathrm{TPOT} \le B.
$$

That is why "make the model faster" is under-specified: cutting TPOT helps long answers; cutting TTFT helps perceived start; both must fit the same pie if the product waits for completion.

An **SLO-attainment fraction** measures the share of requests meeting every latency target. Multiplying that fraction by the offered request rate gives a goodput rate in successful requests per second; serving papers and tools may report either a rate or a normalized fraction, so state the units:

$$
\mathrm{attainment} = \frac{\#\{\text{requests meeting every latency SLO}\}}{\#\{\text{requests}\}}.
$$

High throughput with collapsing goodput means you are serving more work that users still experience as slow.

## Example

Interactive support chat: product SLO is **p95 time-to-first-token under $900\,\mathrm{ms}$** and **p95 mean ITL under $40\,\mathrm{ms}$** after the stream starts. Answers are short ($n \approx 120$ tokens), so users care more about start than total wall time. An explicit budget for first token:

| Stage | Planning allocation | Notes |
|---|---:|---|
| Edge + API gateway + auth | $40\,\mathrm{ms}$ | CDN / TLS / RBAC |
| Query rewrite + embed | $60\,\mathrm{ms}$ | small model or cache |
| Vector retrieve + rerank | $180\,\mathrm{ms}$ | index + top-$k$ cross-encoder |
| Prompt pack + policy checks | $40\,\mathrm{ms}$ | template, PII, allowlists |
| Queue wait (inference) | $80\,\mathrm{ms}$ | residual under load |
| Prefill + first decode token | $400\,\mathrm{ms}$ | prompt length dominates |
| **Margin** | $100\,\mathrm{ms}$ | retries, tail, clock skew |
| **Total** | **$900\,\mathrm{ms}$** | matches TTFT SLO |

Suppose traces show retrieval p95 at $320\,\mathrm{ms}$ and prefill p95 at $450\,\mathrm{ms}$. Both exceed their allocations, but those two marginal percentiles alone do not determine end-to-end p95. Inspect slow requests' joint spans. Possible fixes include shrinking $k$, caching embeddings, dropping the heavy reranker on FAQ intents, or routing long-context tickets to an async lane with a different SLO.

For the same product, mean stream cadence is a separate budget: a request-level TPOT of $40\,\mathrm{ms}$ corresponds to about 25 tokens/s across its measured gaps. A p95 target across those request means does not bound every individual gap; inspect gap tails to catch UI stalls. Continuous batching, KV capacity, and concurrency caps own that cadence.


## How it works

1. **Name the SLI.** Client-visible first token, time-to-first-audio, full JSON ready, or agent step complete. Measure at the point users feel and instrument the model-server stages that contribute to it.
2. **Pick percentile and population.** Budgets follow [p95 latency](glossary://p95-latency) / p99 on comparable traffic (same route, region, cache class). Averages hide the path that burns the budget.
3. **Draw the request path.** List sequential hops and true parallel fan-outs. Parallel stages take $\max$ of their times, not the sum; sequential stages sum.
4. **Assign $b_i$ with owners.** Each budget needs a team or service that can change that hop. Unowned residual becomes everyone's fault and nobody's fix.
5. **Align timeouts and retries.** A $2\,\mathrm{s}$ client timeout with a $5\,\mathrm{s}$ provider timeout and three retries will exceed any honest budget. Cap retries so worst-case time stays inside $B$.
6. **Enforce under load.** Admission control, smaller models, [routing policy](glossary://routing-policy) to fast lanes, and hard deadlines (cancel work that cannot finish in remaining budget) protect goodput when traffic spikes.
7. **Re-measure after changes.** New retrieval stages, multi-tool agents, or longer prompts silently reallocate the pie. Update the table when the path changes.

## Worked numbers

For one illustrative streaming request, take $B_{\mathrm{E2E}} = 5\,\mathrm{s}$, $n = 81$ tokens, and $\mathrm{TTFT} = 0.9\,\mathrm{s}$:

$$
(n-1)\cdot \mathrm{TPOT} \le 5 - 0.9 = 4.1\,\mathrm{s}
\quad\Rightarrow\quad
\mathrm{TPOT} \le \frac{4.1}{80} \approx 51\,\mathrm{ms/token}.
$$

If that request runs at $80\,\mathrm{ms}$ TPOT, its E2E is $0.9\,\mathrm{s} + 80 \times 80\,\mathrm{ms} = 7.3\,\mathrm{s}$, which misses $B$. This is per-request arithmetic; estimating E2E p95 requires the joint request distribution, including output lengths.

One [RAG characterization study](https://arxiv.org/html/2412.11854v1) reported retrieval accounting for roughly $35\%$ to $47\%$ of TTFT and $41\%$ of end-to-end latency in its setups, with added RAG stages nearly doubling TTFT versus its baseline. Those shares depend on the study setup; measure your own retrieve+rerank line item.

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Tighter $B$ | Snappier UX, clearer ownership | More timeouts, simpler models, less retrieval depth |
| Larger margin $m$ | Survives load spikes | Starves productive stages; hides waste |
| Budget TTFT only | Matches chat "is it thinking?" | Long answers still feel slow if TPOT is bad |
| Budget E2E only | Fits batch / agent completion | Hides first-token pain on streaming UIs |
| Same budget all routes | Simple ops | Forces FAQ and deep research onto one wrong number |

Different task classes need different pies: autocomplete may allow ~$100\,\mathrm{ms}$ total; multi-hop agents may allow tens of seconds with per-tool sub-budgets.

## Debug path

When users say "slow":

1. Confirm which budget failed: TTFT, ITL/TPOT, or E2E (and which percentile).
2. Break the slow trace into stage spans that match the budget table.
3. Compare each span to its $b_i$. The first stage over budget is the primary owner.
4. Check whether queue time is eating margin (capacity) versus stage compute (algorithm / prompt size).
5. Verify timeouts and retries are not stacking past $B$.
6. Re-check after the fix under the same population (route, cache hit/miss, prompt length bucket).

## Why it matters here

LeetLLM serving and system-design material treats latency as a **design constraint** that connects product SLOs to retrieval depth, context packing, model route, batching, and tool timeouts. Learners who allocate the pie can decide what work fits on the interactive path and what should move to async, cached, or smaller-model lanes.

## Related terms

- [SLO](glossary://slo)
- [p95 latency](glossary://p95-latency)
- [TTFT](glossary://ttft)
- [Request path](glossary://request-path)
- [TPOT](glossary://tpot)
