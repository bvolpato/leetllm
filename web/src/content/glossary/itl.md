---
title: ITL
aliases: ["Inter-token latency", "Intertoken latency"]
importance: 82
---
**Inter-token latency (ITL)** is the wall-clock gap between consecutive streamed output tokens after generation has already started. For a request that emits tokens at arrival times $t_1, t_2, \ldots, t_n$ (client or server clock, consistently chosen), the per-step ITLs are

$$
\mathrm{ITL}_i = t_{i+1} - t_i \quad (i = 1,\ldots,n-1).
$$

ITL is a **decode cadence** metric. It does not include the wait before the first token. That wait is [TTFT](glossary://ttft). When people say a chat "starts fine but stutters," they are usually describing high or spiky ITL, not TTFT.

Some stacks call the same idea **time between tokens (TBT)**. [TPOT](glossary://tpot) is closely related: for one request, TPOT is usually defined as the average of those gaps.

## Formula

With end-to-end latency defined here as $\mathrm{E2E} = t_n - t_{\mathrm{request}}$ and $n \ge 2$ individually observed output tokens, the request-level mean ITL (often called TPOT) is

$$
\overline{\mathrm{ITL}}
= \mathrm{TPOT}
= \frac{\mathrm{E2E} - \mathrm{TTFT}}{n - 1}
= \frac{t_n - t_1}{n - 1}.
$$

The $-1$ in the denominator is intentional: there are $n-1$ gaps between $n$ tokens. Empty stream chunks and terminal `[DONE]` signals aren't output-token observations. A request with fewer than two output tokens has no ITL sample.

Transport chunks can contain multiple tokens, so chunk arrival times don't reveal each token's generation time. GenAI-Perf reports a response-level gap divided by the number of tokens in the later response; that is an estimate of cadence, not a set of individually observed token timestamps. Also check whether a benchmark's end-to-end timer stops at the last content token or at a later completion frame before applying the formula.

Across many requests, **aggregates of ITL and TPOT can diverge** even when per-request mean ITL equals TPOT. Two aggregation conventions illustrate the difference; check the actual benchmark or dashboard definition:

- **Avg TPOT**: unweighted mean of each request's TPOT (each request counts once).
- **Avg ITL**: gap-weighted mean of every measured gap (long answers dominate).

Short, slow requests and long, fast requests produce a higher request-weighted average than a gap-weighted average. Long, slow requests and short, fast requests reverse that relationship.

Approximate streaming rate after the first token:

$$
\text{user tokens/s} \approx \frac{1}{\overline{\mathrm{ITL}}}
$$

for large $n$. Mean ITL of $40\,\mathrm{ms}$ is about $25$ tokens/s of cadence; that is not the same number as system-wide [tokens per second](glossary://tokens-per-second).

## Example

A chat response streams four tokens with client receive times $320$, $356$, $391$, and $427\,\mathrm{ms}$ after request send:

| Gap | Tokens | $\mathrm{ITL}$ |
|-----|--------|----------------|
| 1 | token 1 $\to$ 2 | $36\,\mathrm{ms}$ |
| 2 | token 2 $\to$ 3 | $35\,\mathrm{ms}$ |
| 3 | token 3 $\to$ 4 | $36\,\mathrm{ms}$ |

$$
\overline{\mathrm{ITL}} = \frac{36+35+36}{3} = 35.7\,\mathrm{ms}
\approx \frac{1}{28}\,\mathrm{s/token}
$$

TTFT is $320\,\mathrm{ms}$ and stays out of those gaps. The user already saw the stream start; mean cadence looks fine (~28 tokens/s).

For a different stream with a stall, gaps $30$, $30$, $200\,\mathrm{ms}$ have mean ITL about $87\,\mathrm{ms}$. The $200\,\mathrm{ms}$ hole exposes a hitch that the mean hides. Report p50 / p95 / p99 of the gap distribution as well as request-level TPOT; percentiles of per-request means don't reveal every within-request stall.

**Multi-request aggregation trap.** Request A: 100 tokens at $10\,\mathrm{ms}$ ITL ($99$ gaps). Request B: 2 tokens at $50\,\mathrm{ms}$ ITL ($1$ gap). Weight **gaps** ($n-1$), not tokens:

- Avg TPOT $= (10 + 50)/2 = 30\,\mathrm{ms}$ (requests equal).
- Gap-weighted avg ITL $= (99\cdot 10 + 1\cdot 50)/100 = 10.4\,\mathrm{ms}$.

Same traffic, different "average." Know which one your dashboard plots before you page on it.

TTFT ends when token 1 is delivered. Every later arrow is an ITL sample. Decode work, scheduler pauses, and client/proxy buffering all stretch those arrows.

## How it works

After [prefill](glossary://prefill) fills the [KV cache](glossary://kv-cache) for the prompt, ordinary autoregressive [decode](glossary://decode-phase) selects one new token per step per sequence. Speculative decoding can accept several tokens in one verification step. In the ordinary case, each step:

1. Loads model weights (and reads growing KV) for the live batch.
2. Runs one forward pass for every sequence still generating.
3. Samples or selects the next token and streams it.
4. Retains K/V created by that forward pass and repeats until stop. The just-selected token gets its K/V when it is consumed by the next forward pass.

On a single quiet request, ITL tracks the hardware cost of that step (often memory-bandwidth bound at small batch). Under load, ITL also includes **time the sequence waited between scheduled steps**: other prefills sharing the GPU, larger decode batches, KV reclaim / preemption, speculative-decode rejection retries, or engine-level chunked prefill interrupting decode.

Client-visible ITL can also grow after the GPU already finished a step:

- HTTP/SSE or WebSocket buffering in a reverse proxy
- Provider-side batching of stream chunks
- Detokenization that emits multi-token chunks irregularly
- Client UI coalescing updates

Always say whether you measure **engine step time**, **bytes leaving the inference process**, or **bytes arriving in the app**. They diverge under buffering.

## What drives ITL

| Driver | Effect on ITL |
|--------|----------------|
| Decode batch / concurrent sequences | Larger batches can improve aggregate TPS while increasing per-step latency; the tradeoff depends on utilization and kernels |
| Prefill mixed into the same iteration | New long prompts steal a step; decode streams pause |
| KV-cache pressure / preemption | Sequences swap out; multi-hundred-ms gaps appear as p95/p99 spikes |
| Context length so far | Attention and KV traffic can grow with prefix length, depending on attention windows and cache strategy |
| Speculative decoding | Good accept rates cut effective ITL; low accept rates add wasted draft work |
| Quantization / kernel / parallelism | Faster step kernels lower the floor; bad configs raise it for everyone |
| Stream path buffering | Leaves engine ITL flat while users still see stalls |

Choose cadence targets from the application's interaction needs and measured user experience. Tokenization varies by language and model, so a universal tokens-per-second reading threshold isn't reliable. Long tail gaps can matter even when mean ITL meets the target.

## Debug path

If **ITL spikes while TTFT stays normal**, the first token path is fine and decode or streaming is not:

1. Plot ITL (or TPOT) p50 vs p95/p99 by model, route, and concurrency. Mean-only charts hide stalls.
2. Check concurrent decode depth, `max_num_seqs` / batch token caps, and whether chunked or priority prefill is starving decode.
3. Inspect KV usage, preemption counts, and prefix-cache thrash. Evictions create multi-step holes.
4. Compare engine-side step metrics to client-side gap histograms. If only the client is bad, chase proxies and SSE buffering.
5. For speculative decoding, track acceptance rate alongside ITL; regressions often show up there first.
6. Confirm you are not averaging empty chunks or counting the final done frame as a token.

If **both TTFT and ITL** degrade together, inspect overload across the serving path: queueing, GPU saturation, autoscaling lag, deployment changes, and the decode kernel.

## Why it matters here

LeetLLM serving material splits [TTFT](glossary://ttft), ITL, [TPOT](glossary://tpot), and [tokens per second](glossary://tokens-per-second) on purpose. Diagnose "the model is slow" by metric: bad TTFT points at queueing and prefill, while bad ITL points at decode scheduling, batching, KV pressure, or stream plumbing. Keeping those axes separate helps locate the right layer before changing model size or GPU count.

## Related terms

- [TTFT](glossary://ttft)
- [TPOT](glossary://tpot)
- [Tokens per second](glossary://tokens-per-second)
- [Decode phase](glossary://decode-phase)
- [Continuous batching](glossary://continuous-batching)
