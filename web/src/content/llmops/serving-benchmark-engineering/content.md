---
{
  "id": "serving-benchmark-engineering",
  "title": "Serving Benchmark Engineering",
  "slug": "serving-benchmark-engineering",
  "section": "GPU Systems & LLM Inference",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Hard",
  "order": 16,
  "companies": [
    "NVIDIA",
    "Google",
    "Meta",
    "Microsoft",
    "Amazon"
  ],
  "shortDescription": "The server finishes more requests per second, but the first word is slower and some fast answers are invalid. Keep the offered load, the client's timing, and every failure.",
  "keyConceptsTested": [
    "Open-loop and closed-loop load generation",
    "Arrival rate, burstiness, concurrency, and schedule lag",
    "Prompt and output-length workload distributions",
    "Warmup, arrival windows, and drain accounting",
    "TTFT, TPOT, ITL, and terminal completion latency",
    "Request goodput versus SLO-constrained capacity",
    "Streaming chunk and token telemetry boundaries",
    "Percentile populations and statistical uncertainty",
    "Serving correctness and quality gates",
    "Reproducible benchmark records"
  ],
  "prerequisites": [
    "model-parallelism-for-llm-inference",
    "llm-deployment-gpu-serving-autoscaling",
    "continuous-batching-request-scheduling",
    "gpu-kernel-performance-engineering-lab"
  ],
  "relatedQuestions": [
    "experiment-design-ab-testing",
    "llm-deployment-gpu-serving-autoscaling",
    "llm-evaluation-benchmarks-limitations"
  ]
}
---
<!-- leetllm: edition:reference:start -->
The server finishes more requests per second, but users wait longer for the first word. Some streams pause halfway through. A few fast responses contain invalid tool arguments. Has the new build improved?

A single throughput number can't answer that. A useful serving benchmark preserves the incoming workload, measures the client's experience, and counts which responses actually satisfy the task. It must also notice when the load generator, rather than the server, is overloaded.

[Continuous Batching and Scheduling](/learn/continuous-batching-request-scheduling) explains why prompt processing and generation compete. [GPU Profiling, Correctness, and Benchmarking](/learn/gpu-kernel-performance-engineering-lab) separates kernel timing from broader execution. Here, the measurement scope moves outward to the client, gateway, and serving system, capturing failures and queueing time alongside model work.

Throughout this chapter, a six-request burst for an incident-response assistant anchors the accounting math and exercises the local cohort scorer.

## Freeze what arrives and when

A workload needs more than an average prompt length. Keep the prompt or token IDs, output policy, request class, and scheduled arrival for each identity. Include the system prompt, retrieved context, and conversation history that the application actually sends.

Consider these six arrivals:

| ID | Scheduled time | Prompt tokens | Output policy | Shared prefix | Class |
|---|---:|---:|---|---|---|
| `r01` | 0 ms | 320 | natural stop, cap 96 | runbook A | interactive |
| `r02` | 120 ms | 336 | natural stop, cap 96 | runbook A | interactive |
| `r03` | 700 ms | 4,096 | natural stop, cap 256 | none | interactive |
| `r04` | 760 ms | 280 | natural stop, cap 64 | none | interactive |
| `r05` | 800 ms | 2,048 | natural stop, cap 512 | policy B | background |
| `r06` | 1,900 ms | 480 | natural stop, cap 128 | runbook A | interactive |

The long prompt at `r03` can interfere with the short request arriving 60 ms later. `r05` may occupy a decode slot for longer. <span data-glossary="prefix-cache">Prefix reuse</span> can reduce work, but only if the runtime supports it and the cache state permits a hit. Repeating one prompt isn't inherently wrong; it's wrong to represent a cache-friendly test as an unrelated production mix.

Count tokens with the pinned tokenizer and <span data-glossary="chat-template">chat template</span>. An output cap isn't an observed output length. Keep both. Forcing exact output lengths, for example by ignoring <span data-glossary="end-of-sequence-token">end-of-sequence (EOS) tokens</span>, can isolate scheduler behavior, but that is a shape-controlled stress test rather than a natural-response quality evaluation.

Generate the realized trace once, save it, and hash the exact bytes. Library or tokenizer changes can produce different rows from the same seed. The six-row download later contains only scheduling metadata rather than raw prompts, so treat it as a minimal cohort input for the local scorer instead of a replay suite for a live endpoint.

Public traces can help challenge assumptions. BurstGPT reports real arrival and token-length patterns. ServeGen models production workload characteristics with per-client arrival and request-data models.[^wang2025burstgpt][^xiang2026servegen] Neither makes its traffic representative of your users. Preserve length tails, prompt/output correlation, tenant mix, prefix reuse, and conversation dependencies that matter to your application. Saving those arrivals still fails if the generator stops offering work as soon as the server slows down.

## Don't let a slow server turn down its own test

An open-loop generator schedules requests independently of completions. If `r04` is due at 760 ms, `r03` still running doesn't cancel that arrival.

A closed-loop generator starts another request when a virtual user becomes free. When responses slow down, its offered rate falls. That is appropriate for studying a fixed user population, but it answers a different question from capacity under an external arrival rate.

| Mode | What controls arrivals | Suitable question |
|---|---|---|
| Open-loop | Stored timestamps or an independent clock | Can the system sustain this offered workload? |
| Closed-loop | Completions and user think time | What do this many active users experience? |
| All-at-once | Every request released at the start | How does the system handle a batch or arrival burst? |

<figure>
  <img src="illustrations/_generated/arrival_clock_and_client_slots_dark.png" alt="Two client-slot timelines share a 700 to 1400 millisecond clock. With independent arrivals, r03 occupies one slot from its actual send at 705 to terminal completion at 1220, while r04 is due at 760 and occupies another slot from send 765 to terminal 1310. A separate single-virtual-user model stays occupied by r03 through 1220, then waits 80 milliseconds of think time before sending again at 1300. The due-time marker remains at 760." />
  <figcaption>The independent clock sends r04 while r03 still occupies a slot from 705 to 1220 ms. The lower lane models one virtual user waiting for completion plus an 80 ms think time before sending at 1300 ms, isolating client-slot occupancy rather than server queue internals.</figcaption>
</figure>

MLPerf Inference formalizes different scenarios: Single Stream waits for each completion, while Server/Interactive uses Poisson arrivals. These quality and latency rules define those scenarios; declare separate rules for a custom load test.[^mlcommons2026inference]

### Rate, concurrency, and burstiness aren't interchangeable

In a stable system, Little's Law relates average outstanding requests $L$, accepted arrival rate $\lambda$, and mean time in the same system $W$:[^little1961]

$$
L = \lambda W
$$

At 3 requests/s and 0.9 seconds average latency, the average outstanding count is 2.7. A client capped at two outstanding requests can't sustain that combination. Even a cap of three may throttle bursts because an average isn't a maximum, so verify whether the cap actually constrains concurrency.

<figure>
  <img src="illustrations/_generated/concurrency_budget_dark.png" alt="Little's Law throughput curve comparing client concurrency limits from 1 to 8 slots against a target arrival rate of 3.0 requests per second and 0.9 second mean residence time. Deterministic pacing reaches the 3.0 RPS target at 3 slots, whereas Poisson arrival bursts stall below target until 6 to 8 slots provide burst headroom." />
  <figcaption>At 3.0 accepted requests/s and 0.9 s mean residence, Little's Law yields 2.7 average active slots. A 1- or 2-slot cap throttles throughput below the offered rate, and even 3 slots fall behind under Poisson arrival bursts until 6 to 8 slots leave room for spikes.</figcaption>
</figure>

A Poisson process has exponential inter-arrival gaps with coefficient of variation $CV=1$. Regular spacing has $CV=0$. Real traffic can have correlated bursts that neither description captures. Save realized timestamps when replay identity matters.

For example, `vllm bench serve` exposes `--request-rate`, `--burstiness`, and `--max-concurrency`. Its `burstiness` is a Gamma shape parameter $k$, with $CV=1/\sqrt{k}$: values below one make gaps more variable. Infinite request rate creates an all-at-once or concurrency-limited stress mode; use a finite arrival rate for an open-loop test. For production server benchmarking, vLLM recommends GuideLLM while built-in benchmarks focus primarily on feature evaluation and regressions.[^vllm2026benchmarkcli]

Inspect the realized schedule too: the current implementation's constant-rate path rescales sampled gaps so the final scheduled arrival is at request count divided by rate. This finite trace conditions the final arrival and differs from an unconditioned Poisson realization. Self-timed replay instead uses stored timestamps and bypasses rate, burstiness, and ramp-up controls.[^vllm2026benchmarkServeImplementation]

Time-scaling a stored trace is one way to sweep offered rate while preserving order and relative gaps. It also compresses the duration of a fixed-size cohort. Either extend the trace to keep measurement duration comparable or report that changed duration; you can't claim both fixed request count and fixed duration while changing the rate.

### Measure the generator's lateness

Keep `scheduled_ms` and `sent_ms` in a common client monotonic-clock domain. If a request is scheduled at 760 ms but sent at 1,100 ms, the generator is 340 ms late. Measuring only from send time hides that discrepancy.

Report send-relative latency and scheduled-relative delay separately. Declare a schedule-lag tolerance and invalidate capacity evidence when the generator can't reproduce the offered load. Delayed or unsent requests must not disappear from the workload denominator. This is one form of coordinated omission: the test stops observing the work that should have arrived during a slowdown.

Current vLLM supports `client_queue_time` in `--percentile-metrics` when a client concurrency cap creates a wait. With a finite request rate and a client cap, `e2el_including_client_queue` adds that wait to the adapter's reported latency. It doesn't independently measure scheduler lateness or extend the adapter's end timestamp to terminal completion. That metric is omitted for infinite request rate. These summaries cover successful requests; they don't replace offered-request failure accounting. A client queue measures its own backpressure; use server spans to attribute a separate server queue.[^vllm2026benchmarkServeImplementation]

Client and server clocks aren't automatically comparable. Use client timestamps for client latency, and use server-local spans or synchronized clocks for queueing and compute attribution.

```checkpoint
A client cap of two binds while testing a target of 3 requests/s. The server's measured latency remains low. What does that show?
---
It shows behavior under the throttled workload, not capacity at 3 requests/s. Keep the delayed arrivals, report schedule lag, and rerun with a generator that can sustain the intended schedule.
```

## Give the run an arrival window and a drain policy

Separate readiness, warmup, measurement, and drain. Warmup may include loading, kernel compilation, CUDA Graph capture, connections, and scheduler initialization. Don't populate prefix caches unless the measured scenario is supposed to begin with those entries warm.

During the measurement arrival window, send the declared workload. When arrivals stop, retain every request until terminal success, rejection, cancellation, error, or timeout. Choose timeouts before the run. A late response doesn't retroactively undo an earlier timeout experienced by the client.

There are two useful but different accounting views:

- An arrival cohort includes requests scheduled in a half-open window such as `[0, 2000)` ms. Judge all of their outcomes, including those observed during drain.
- A wall-clock interval counts completions occurring inside that interval, regardless of when those requests arrived. Track starting and ending outstanding work to interpret it.

Don't divide one population by the other population's elapsed time. For the local exercise, cohort rates use elapsed time from arrival-window start through the later of window end and last terminal outcome. Those finite-run rates include drain and aren't sustainable-capacity estimates.

<figure>
  <img src="illustrations/_generated/offered_request_ledger_dark.png" alt="Six request identities share a 0 to 2500 millisecond clock. Scheduled arrivals are 0, 120, 700, 760, 800, and 1900; actual sends are 0, 125, 705, 765, 805, and 1905; terminal outcomes are 500, 310, 1220, 1310, 1180, and 2500. The arrival cohort ends at 2000 and drain continues to the r06 timeout at 2500. Requests r01, r02, and r04 qualify; r03 misses TTFT, r05 fails the quality check, and r06 times out. Six offered, five successful, and three qualified give 50 percent attainment. Offered rate is 3.0 per second over the two-second arrival window; success and qualified rates are 2.0 and 1.2 over the 2.5-second cohort horizon. An inset changes only r04 send from 765 to 800 while its first token remains at 1050. Send-relative TTFT falls from 285 to 250 milliseconds, but schedule lag rises from 5 to 40 and exceeds the 20 millisecond limit." />
  <figcaption>All six offered requests remain in the cohort through drain; five succeed and three qualify. r03 misses TTFT, and r05 fails the quality check. The two-second arrival window gives 3.0 offered RPS, while the 2.5-second horizon gives 2.0 successful and 1.2 qualified RPS. In the inset, delaying only r04’s send shortens apparent TTFT while lag exceeds 20 ms, with all other timestamps fixed.</figcaption>
</figure>

For sustained load, inspect outstanding work over time and compare accepted, completed, rejected, and timed-out rates. A flat server queue alone isn't enough because aggressive rejection can keep the queue shallow while users fail. Repeat long runs across warmup, cache, thermal, and traffic cycles so that short bursts don't masquerade as steady capacity.

## Time what the protocol actually reveals

Let $s$ be client send time, $t_1$ first output-token time, $t_n$ final output-token time, and $c$ terminal completion time. Assume these token events genuinely have token granularity and use the same clock.

<span data-glossary="ttft">Time to first token (TTFT)</span> measures the initial wait. <span data-glossary="itl">Inter-token latency (ITL)</span> measures each subsequent gap:

$$
TTFT = t_1-s, \qquad ITL_i=t_i-t_{i-1}
$$

For $n>1$, request-mean <span data-glossary="tpot">time per output token (TPOT)</span> is:

$$
TPOT=\frac{t_n-t_1}{n-1}
$$

End-to-end completion latency is:

$$
E2E=c-s
$$

The final token can precede the terminal event, usage metadata, or connection completion. Replacing $c$ with $t_n$ silently changes the metric to last-token latency.

For a request sent at zero, token times `[240, 280, 320, 440, 480]` ms and terminal time 500 ms produce TTFT 240 ms, TPOT 60 ms, and E2E 500 ms. The four gaps are `[40, 40, 120, 40]` ms. One 120 ms pause is hidden inside the 60 ms mean.

Compute these streaming milestones from normalized arrival timestamps:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="stream-timing.py"
from math import ceil
import numpy as np

tokens = np.array([240, 280, 320, 440, 480], dtype=np.int64)
sent, terminal = 0, 500
assert sent <= int(tokens[0]) <= int(tokens[-1]) <= terminal
gaps = np.diff(tokens)
assert np.all(gaps >= 0)
print(f"TTFT: {int(tokens[0]) - sent} ms")
print(f"ITL: {gaps.tolist()} ms")
print(f"TPOT: {gaps.mean():.0f} ms")
print(f"last-token latency: {int(tokens[-1]) - sent} ms")
print(f"terminal E2E: {terminal - sent} ms")
p99_gap = int(np.sort(gaps)[ceil(0.99 * gaps.size) - 1])
print(f"nearest-rank p99 of four gaps: {p99_gap} ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
TTFT: 240 ms
ITL: [40, 40, 120, 40] ms
TPOT: 60 ms
last-token latency: 480 ms
terminal E2E: 500 ms
nearest-rank p99 of four gaps: 120 ms
```
<!-- leetllm: output:end -->

For one-token output, there are no inter-token intervals, so TPOT is undefined rather than zero. Declare the eligibility rule before scoring: the local scorer skips the TPOT check on a successful single-token response while still checking TTFT and quality, whereas an empty successful response fails the text-response rule used here unless an endpoint explicitly allows empty outputs.

<figure>
  <img src="illustrations/_generated/observed_stream_clock_dark.png" alt="Request r01 shares one millisecond clock: send at 0, normalized token events at 240, 280, 320, 440, and 480, and terminal completion at 500. TTFT spans 0 to 240. The four inter-token gaps are 40, 40, 120, and 40 milliseconds. Their first-to-last span is 240 milliseconds over four intervals, giving TPOT 60. Last-token latency is 480, while terminal E2E is 500. The aligned r02 inset has send at 125 and one token at 295, so TTFT is 170 milliseconds and TPOT is not applicable. These token events come directly from logged arrivals rather than reconstructed SSE chunks." />
  <figcaption>The long gap between tokens three and four is 120 ms, while TPOT averages all four gaps to 60 ms. Terminal completion follows the last token, and the one-token inset has a 170 ms TTFT with undefined TPOT because SSE chunks can combine several tokens into a single timestamped event.</figcaption>
</figure>

### A streaming chunk isn't necessarily a token

A server-sent event (SSE) may contain several tokens, metadata without text, or a fragment whose tokenization depends on later text. TCP reads don't align with SSE event frames either. An adapter must reconstruct the protocol, recognize terminal and error events, and preserve arrival timestamps before producing normalized records.

| Observation | Honest metric | Additional validation |
|---|---|---|
| First response byte | Time to first byte | That output text has started |
| First content-bearing chunk | Time to first content chunk | Exact first-token emission time |
| Client text chunks | Inter-chunk latency | Individual token ITL |
| Server token events | Server token cadence | Client-visible network cadence |
| Client token-granular events | Client-observed ITL | GPU kernel duration |

Dividing a multi-token chunk's delay by its token count invents arrival times. Keep chunk metrics when those are the available observations. The downloadable scorer accepts normalized token events; it isn't an SSE parser and can't manufacture missing granularity.

For example, vLLM calls gaps between accepted stream events ITL, even when speculation packs several tokens into one event. Its request TPOT amortizes the adapter's reported latency minus TTFT over output tokens minus one. Its Completions and Chat Completions adapters end that latency at the last event with nonempty `choices` (ignoring trailing usage-only frames and `[DONE]`), whereas the Responses adapter timestamps text and reasoning deltas.[^vllm2026benchmarkStreamImplementation][^vllm2026benchmarkServeImplementation]

This lesson's token-granular worksheet uses the first-to-last token interval and records terminal completion separately. Match the endpoint, observed events, token-count source, and installed adapter version before comparing those numbers.

<figure>
  <img src="illustrations/_generated/chunk_observation_layers_dark.png" alt="Two-part diagram separating raw network reads from token-granular timing. Across the upper pipeline, TCP bytes feed SSE frames, a single chunk timestamp spans three tokens, and only a per-token event log exposes inter-token latency. Two lower panels contrast a multi-token chunk whose inner gaps remain unknown against request r01's recorded token timestamps at 240, 280, 320, 440, and 480 milliseconds." />
  <figcaption>Network reads and SSE chunks aggregate tokens behind a single frame timestamp, hiding per-token jitter. Genuine inter-token latency requires direct per-token timestamps like request r01's 40, 40, 120, and 40 ms intervals.</figcaption>
</figure>

### Smoothness needs the order of events

A long gap isn't always a playback stall. Earlier tokens can arrive ahead of a reading cadence and provide slack. Etalon's fluidity metric uses token deadlines to capture this distinction.[^agrawal2024etalon]

For a simple illustration, set a first-token deadline of 300 ms and a cadence of 80 ms. Deadlines for five tokens are `[300, 380, 460, 540, 620]`. The earlier example meets all five even though one raw ITL is 120 ms. In `[300, 380, 460, 580, 620]`, the fourth token misses its deadline despite mean TPOT being 80 ms.

<figure>
  <img src="illustrations/_generated/playback_deadline_slack_dark.png" alt="Cumulative token-arrival chart comparing Stream A and Stream B against a 300 millisecond first-token deadline plus 80 milliseconds per subsequent token. Stream A finishes every token ahead of deadline even with a 120 millisecond fourth-token pause, whereas Stream B maintains an 80 millisecond mean TPOT yet crosses 40 milliseconds past the 540 millisecond deadline on token four." />
  <figcaption>Plotting arrival trajectories against fixed playback deadlines shows how early slack absorbs later pauses. Stream A stays below every deadline despite a 120 ms gap, whereas Stream B averages exactly 80 ms TPOT yet misses token four by 40 ms.</figcaption>
</figure>

This comparison explains why deadline and gap metrics answer different questions. Etalon goes further by counting how many playback deadlines a stall crosses and resetting subsequent deadlines after a late token, so its fluidity index weighs sustained stalls rather than treating each late event identically. Use the five-token comparison to grasp early slack, then measure human reading-speed requirements with the full deadline-reset algorithm on your target workload.[^agrawal2024etalon] A smooth stream can still carry a wrong answer, a timeout, or an unsent request, so next we inspect the offered-request denominator.

## Keep the denominator visible

Define a request as qualified only when it has terminal success, acceptable output, and the declared latency properties. Evaluate task correctness alongside HTTP status and JSON validity. Errors, timeouts, rejected requests, unsent requests, and wrong answers stay in the offered-request denominator.

Two quantities are often both called <span data-glossary="goodput">goodput</span>:

$$
G_{\text{requests}}=\frac{\text{qualified requests}}{\text{declared elapsed seconds}}
$$

This is a rate of useful completed work for a specified population and interval. SLO-constrained capacity asks which offered rate still meets the declared <span data-glossary="slo">service-level objective (SLO)</span>:

$$
C_{\text{SLO}}=\max\{\lambda\text{ tested}: A(\lambda)\geq\alpha\ \land\ \text{load reproduced}\ \land\ \text{stable}\}
$$

Here $A(\lambda)$ is qualified requests divided by all offered requests, and $\alpha$ is the required attainment. DistServe ties its goodput definition to the maximum offered rate per GPU satisfying TTFT and TPOT attainment targets.[^zhong2024] State your definition explicitly rather than assuming two tools mean the same thing by goodput.

A system may finish more qualifying requests per second while also failing a larger fraction of incoming requests. Useful-work rate alone then improves, but a 95% attainment promise fails. Divide a fleet rate by GPU count only when comparing a fixed, stated resource allocation.

## Run a strict local scorer

Download [the scorer](assets/score_requests.py), [the scheduling manifest](assets/example-trace.json), and [the sample outcomes](assets/example-events.jsonl) into one directory. Python 3.12 or newer and `uv` are sufficient, with no model downloads, endpoint calls, or third-party dependencies required.

```bash title="score-example-cohort.sh"
uv run score_requests.py example-trace.json example-events.jsonl > scored.json
```

Save [the accounting tests](assets/test_score_requests.py) beside those files and run `uv run test_score_requests.py`. They exercise timing, missing and duplicate outcomes, failure denominators, single-token output, malformed records, and CLI exit codes. Passing them checks the scorer, not a serving system.

The manifest fixes six IDs and scheduled times in `[0, 2000)` ms. Each JSONL outcome has this shape:

```json title="normalized-request-outcome.json"
{
  "id": "r01",
  "sent_ms": 0,
  "terminal_ms": 500,
  "token_ms": [240, 280, 320, 440, 480],
  "status": "success",
  "quality_pass": true
}
```

`quality_pass` records a precomputed task judgment because the scorer checks accounting rather than judging semantics. Input validation enforces exact fields, finite nonnegative timestamps, temporal ordering, unique IDs, and a terminal outcome for every expected request, rejecting unknown IDs, missing outcomes, duplicate JSON keys, nonfinite values, and empty successful outputs while allowing equal token timestamps under finite clock resolution.

These six outcomes exercise different branches:

| Request | Outcome | Qualified? |
|---|---|---|
| `r01` | TTFT 240 ms, TPOT 60 ms, terminal E2E 500 ms | Yes |
| `r02` | Single token, TTFT 170 ms; TPOT not applicable | Yes |
| `r03` | TTFT 340 ms exceeds the 300 ms limit | No |
| `r04` | TTFT 285 ms and TPOT 61 ms | Yes |
| `r05` | Fast successful response, but task quality check fails | No |
| `r06` | Partial output followed by timeout at 2,500 ms | No |

All six count toward attainment, giving `3 / 6 = 50%`. There are five protocol successes, not six. The cohort horizon is 2.5 seconds, giving 2.0 successful requests/s and 1.2 qualified requests/s. The arrival window is two seconds, giving a realized offered rate of 3.0 requests/s. These denominators are printed separately.

The report includes exact input hashes, per-request metrics, and successful-request-only percentile populations. Failed requests remain in attainment even though their partial streams don't enter successful-latency percentiles. `capacity_estimate_rps` is deliberately null: these records contain neither a sustained run nor a capacity sweep.

With both CLI file paths provided, exit code zero means the input and schedule checks passed, not that a deployment is approved. Code 2 means the accounting is available but a request was unsent or schedule lag exceeded 20 ms. Code 1 means malformed or incomplete inputs. Missing CLI arguments instead trigger argparse's usage error and exit code 2 without an accounting report. Preserve nonzero exits in automation; don't let a successful `tee` hide them.

Try three changes in a copy of the JSONL file:

1. Delete `r06`. The scorer must reject the incomplete cohort instead of improving attainment by dropping a timeout.
2. Mark `r05` as quality-passing. Attainment becomes four of six; the parser is trusting a changed judgment, not discovering better model quality.
3. Change `r04.sent_ms` from 765 to 800. Its measured TTFT falls to 250 ms, but schedule lag rises to 40 ms and the run becomes invalid for its declared load.

For an unsent request, retain its ID with status `not_sent`, null `sent_ms`, no tokens, a terminal accounting time, and `quality_pass: false`. If the client retries requests, keep attempt-level records and a separate logical-request result; this small schema deliberately rejects duplicate IDs rather than silently merging retries.

## Find capacity without overstating the evidence

Now consider a separate rate sweep requiring at least 95% attainment, at most 20 ms schedule lag, and no sustained backlog growth across 200 offered requests per rate point:

| Offered RPS | Qualified / offered | Attainment | Max schedule lag | Backlog trend | Point estimate passes? |
|---:|---:|---:|---:|---|---|
| 0.5 | 200 / 200 | 100% | 8 ms | flat | Yes |
| 1.0 | 200 / 200 | 100% | 9 ms | flat | Yes |
| 1.5 | 190 / 200 | 95% | 11 ms | flat | Yes |
| 2.0 | 160 / 200 | 80% | 12 ms | growing | No |
| 2.5 | 116 / 200 | 58% | 16 ms | growing | No |

Under those arithmetic rules, 1.5 RPS is the highest passing tested rate. Even so, a discrete grid point neither certifies unmeasured intermediate rates nor leaves production headroom, so refine the step size, verify the failing neighbor at 2.0 RPS, and reserve margin for failures and traffic drift.

To turn this rate into the per-replica capacity that the [GPU serving lesson](/learn/llm-deployment-gpu-serving-autoscaling) assumes, use Little's Law at the passing point. If this sweep ran against three replicas and requests averaged ten seconds in the system, then 1.5 RPS × 10 s = 15 active requests, or five per replica.

<figure>
  <img src="illustrations/_generated/operating_curve_dark.png" alt="Two stacked line charts trace SLO attainment and goodput from 0.5 to 2.5 offered requests per second. Attainment holds at 100% through 1.0 RPS and meets the 95% floor at 1.5 RPS before dropping to 80% at 2.0 RPS and 58% at 2.5 RPS. Goodput keeps rising to 1.60 qualified requests per second at 2.0 RPS even as attainment fails the 95% objective." />
  <figcaption>At 1.5 RPS, attainment clears the 95% floor with 11 ms schedule lag and a flat backlog. At 2.0 RPS, arrival-window goodput climbs to 1.60 qualified requests per second even as attainment falls to 80% and queueing grows.</figcaption>
</figure>

### A percentile needs a population and enough observations

Nearest-rank p95 of 20 values selects the 19th ordered value. Nearest-rank p99 of 80 gaps selects the maximum. These calculations are reproducible; estimating a production tail requires a larger representative sample.

Pooled ITL percentiles give longer responses more weight because they contribute more gaps. A percentile across per-request worst gaps answers a different question. Neither can be recovered by averaging percentile summaries from separate runs. Keep raw samples, state the convention, and stratify meaningful prompt-length, output-length, and priority classes.

The same caution applies to attainment: 190 successes in 200 trials leaves sampling uncertainty around the observed 95% rate. Predeclare an uncertainty rule and minimum evidence. For correlated traffic, resample whole runs or suitable time blocks rather than treating each token gap as an independent sample. Use a representative trace that includes the workload classes you expect in deployment.

### What does 190 of 200 actually support?

Suppose, for this calculation, that request outcomes are independent Bernoulli trials with a constant pass probability at one preselected load. A one-sided 95% Wilson lower confidence bound is below the observed proportion. NIST documents this method and distinguishes it from a simple symmetric normal interval.[^nistBinomialIntervals2026]

<!-- leetllm: test, output=show -->
```python title="attainment-uncertainty.py"
from math import sqrt
from statistics import NormalDist

z = NormalDist().inv_cdf(.95)
for good, n in [(190, 200), (200, 200), (20, 20)]:
    observed = good / n
    lower = (
        observed + z*z/(2*n)
        - z*sqrt(observed*(1-observed)/n + z*z/(4*n*n))
    ) / (1 + z*z/n)
    print(f"{good}/{n}: observed {observed:.1%}; one-sided 95% Wilson lower {lower:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
190/200: observed 95.0%; one-sided 95% Wilson lower 91.8%
200/200: observed 100.0%; one-sided 95% Wilson lower 98.7%
20/20: observed 100.0%; one-sided 95% Wilson lower 88.1%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/attainment_uncertainty_dark.png" alt="Zoomed 85% to 100% plot of one-sided 95% Wilson lower confidence bounds for three benchmark outcomes. Only 200 of 200 passes a 95% lower-bound gate at 98.7%. Both 190 of 200 (95% observed, 91.8% lower bound) and 20 of 20 (100% observed, 88.1% lower bound) fall below 95%." />
  <figcaption>Zooming into the 85% to 100% interval highlights how sample size tightens the one-sided 95% Wilson lower bound under independent Bernoulli trials. Only 200 of 200 clears a 95% lower-bound gate, whereas 190 of 200 (91.8%) and 20 of 20 (88.1%) fall short.</figcaption>
</figure>

> **Key insight:** `190/200` passes a 95% point-estimate rule yet fails a 95% lower-bound rule (`91.8%`), and even `20/20` only lifts the lower bound to `88.1%`. Decide your evidence bar before sweeping rates, run fresh confirmation checks after picking a winner, and resample whole runs or time blocks when correlated bursts break independence.

Alternate baseline and candidate run order. Keep cold-start and warm-capacity results separate, and consider a downward sweep when cache or thermal history creates hysteresis. Don't select the best of many noisy runs and omit the others.

## Join performance and quality before release

Performance and quality need linked but distinct evidence. Check every performance response for protocol completion, finish reason, actual output length, and required schema. Use a stable task suite for factual support, correct tool arguments, abstention, and other semantic requirements.

A short answer produced by accidental truncation can look faster. A valid speculative decoder should preserve its target sampling distribution under its stated assumptions. Verify the implemented combination, including stop handling and output parsing, and measure task quality alongside throughput.

If semantic quality is evaluated only on a separate sampled suite, don't label every unscored performance request semantically qualified. Report performance attainment and the separate quality acceptance result. A per-request `quality_pass` field needs actual per-request evidence for that stronger claim.

Keep a compact record of:

- Model, tokenizer, template, quantization, engine, client, and image identities.
- Hardware count, placement, drivers, gateway/network scope, and relevant limits.
- Exact workload bytes, realized timestamps, warmup/cache policy, timeouts, and run duration.
- All terminal outcomes, raw timing events, quality judgments, and system telemetry.
- Metric populations, denominators, thresholds, uncertainty rules, repetitions, and rejected runs.
- Selected operating margin, recovery plan, and conditions that weren't tested.

A hash identifies bytes, and a successful parser validates schema and arithmetic rules. Preserve original logs and measurement lineage so another engineer can verify how the records were collected.

A throughput gain does not count when it hid schedule lag, dropped timeouts, or counted only the fast responses. Whether that configuration helps users is a different measurement, taken on live traffic with a stable assignment.

```checkpoint
The report shows good attainment, flat queue depth, and exit code zero. Can you approve the serving configuration from that alone?
---
To support a capacity claim, reproduce the load, retain failures and rejections, use representative workload and quality evidence, and run long enough to repeat the result. The local scorer checks data integrity; capacity and deployment approval require separate evidence.
```

```mastery-quiz
[
  {
    "question": "A request sends at 60 ms, has token events at 260, 310, 360 and 510, then terminates at 550. What are TTFT, mean TPOT and terminal E2E?",
    "options": [
      "200 ms; 83.3 ms; 490 ms.",
      "200 ms; 83.3 ms; 450 ms.",
      "200 ms; 62.5 ms; 490 ms.",
      "260 ms; 83.3 ms; 550 ms."
    ],
    "answer": "200 ms; 83.3 ms; 490 ms.",
    "explanation": "TTFT = 260 − 60 = 200. Three intervals span 510 − 260 = 250, giving 83.3 ms. Terminal E2E = 550 − 60 = 490; last-token latency is 450."
  },
  {
    "question": "Eight offered requests arrive within four seconds. Six succeed, five qualify, and the final outcome is at five seconds from the window start. Which attainment and qualified cohort rate follow?",
    "options": [
      "83.3%; 1.25 qualified requests/s.",
      "75.0%; 1.20 qualified requests/s.",
      "62.5%; 1.25 qualified requests/s.",
      "62.5%; 1.00 qualified requests/s."
    ],
    "answer": "62.5%; 1.00 qualified requests/s.",
    "explanation": "All eight offered requests remain the attainment denominator: 5/8 = 62.5%. The cohort horizon includes drain through five seconds, giving 5/5 = 1.00, while the arrival-window offered rate is 8/4 = 2."
  },
  {
    "question": "The client sends at 100 ms and observes only text chunks at 260 and 420, each containing multiple tokens. No token-level trace exists. Which report matches those observations?",
    "options": [
      "First chunk 160 ms; chunk gap 80 ms; token TPOT 80 ms.",
      "First chunk 160 ms; chunk gap 160 ms; token TPOT unknown.",
      "First token 160 ms; token gap 160 ms; token TPOT 160 ms.",
      "First chunk 260 ms; chunk gap 160 ms; token TPOT unknown."
    ],
    "answer": "First chunk 160 ms; chunk gap 160 ms; token TPOT unknown.",
    "explanation": "Subtract send for the first observed chunk and consecutive chunk timestamps for its gap. Individual emission times inside each multi-token chunk were not observed, so neither TTFT nor TPOT can be inferred from those chunk times."
  },
  {
    "question": "A request is scheduled at 620 ms with a 30 ms lag limit. Its first token stays at 860. Compare send A at 640 with send B at 655. Which tuple is correct?",
    "options": [
      "A: lag 20, TTFT 220, valid; B: lag 35, TTFT 240, invalid.",
      "A: lag 20, TTFT 220, valid; B: lag 35, TTFT 205, invalid.",
      "A: lag 20, TTFT 240, valid; B: lag 35, TTFT 205, valid.",
      "A: lag 20, TTFT 220, invalid; B: lag 35, TTFT 205, valid."
    ],
    "answer": "A: lag 20, TTFT 220, valid; B: lag 35, TTFT 205, invalid.",
    "explanation": "Both use the same first-token time. B looks faster after send, but its 35 ms lateness exceeds 30. The generator schedule check and response latency are separate."
  },
  {
    "question": "Two runs use the same eight-request manifest. In both, seven requests were sent on time and have valid outcome records. In run A, the eighth request timed out after send, and its outcome record is missing. In run B, the send log confirms that the client never sent the eighth request, and its outcome file includes a valid `not_sent` record. What exit code and offered count does the scorer report for each run?",
    "options": [
      "A exits 0 with seven offered. B exits 0 with seven offered.",
      "A exits 0 with seven offered. B exits 2 with eight offered.",
      "A exits 1 without a report. B exits 2 with eight offered.",
      "A exits 1 without a report. B exits 0 with seven offered."
    ],
    "answer": "A exits 1 without a report. B exits 2 with eight offered.",
    "explanation": "The manifest fixes the offered count at eight. Reporting seven for A drops a known timeout. The missing record makes the file incomplete, so the scorer exits 1 before printing a count. B accounts for all eight, including the request the client never sent. Reporting seven for B would hide that missed send. The scorer prints the full count and exits 2 because the client missed the schedule."
  },
  {
    "question": "A load sweep requires attainment ≥95%, lag ≤20 ms and flat backlog. At 2 RPS it has 98%/15 ms/flat; at 2.5, 96%/25 ms/flat; at 3, 94%/15 ms/growing. Which tested point passes?",
    "options": [
      "2.5 RPS; all three required checks pass.",
      "3.0 RPS; all three required checks pass.",
      "No passing point; no tested row passes all three checks.",
      "2.0 RPS; all three required checks pass."
    ],
    "answer": "2.0 RPS; all three required checks pass.",
    "explanation": "Every requirement must pass. The middle point fails lag and the final point fails attainment and stability. The result is the highest passing tested point, with unmeasured intervals and production margin still unresolved."
  },
  {
    "question": "At one preselected load, 98 of 100 independent constant-probability trials pass. The resulting one-sided 95% Wilson lower bound is 94.1%. A policy requires 95% attainment. Which pair of decisions follows?",
    "options": [
      "Observed-rate rule: pass; lower-bound rule: fail.",
      "Observed-rate rule: fail; lower-bound rule: pass.",
      "Observed-rate rule: pass; lower-bound rule: pass.",
      "Observed-rate rule: fail; lower-bound rule: fail."
    ],
    "answer": "Observed-rate rule: pass; lower-bound rule: fail.",
    "explanation": "The point estimate is 98%, while the computed lower bound is below the 95% floor. The policy must predeclare which evidence rule applies. Shared bursts or selecting the best noisy sweep point require further treatment."
  },
  {
    "question": "Response A contributes 90 gaps of 2 ms, response B contributes 6 gaps of 30 ms, and response C contributes 4 gaps of 100 ms. Using nearest-rank p95, what are pooled-gap p95 and p95 across per-request worst gaps?",
    "options": [
      "7.6 ms pooled; 100 ms across worst gaps.",
      "30 ms pooled; 44 ms across worst gaps.",
      "100 ms pooled; 100 ms across worst gaps.",
      "30 ms pooled; 100 ms across worst gaps."
    ],
    "answer": "30 ms pooled; 100 ms across worst gaps.",
    "explanation": "There are 100 gaps. Ordered position ceil(.95 × 100) = 95 falls among the six 30 ms gaps at positions 91 through 96. The per-request worst gaps are [2,30,100], whose position ceil(.95 × 3) = 3 is 100. The pooled mean is 7.6 and the mean of worst gaps is 44; neither is the requested percentile."
  },
  {
    "question": "A passing four-replica run accepts 2 requests/s with 12 s measured mean residence. For the same mix, what mean active count per replica and ideal replica arithmetic for 60 active requests follow?",
    "options": [
      "24 active per replica; 3 replicas before margin.",
      "2 active per replica; 30 replicas before margin.",
      "6 active per replica; 10 replicas before margin.",
      "8 active per replica; 8 replicas before margin."
    ],
    "answer": "6 active per replica; 10 replicas before margin.",
    "explanation": "L = 2 × 12 = 24 mean active across four replicas, hence six each and ceil(60/6) = 10. This is conditional mean arithmetic; bursts, changed workload and scaling still need measurement and margin."
  },
  {
    "question": "All 50 benchmark requests return protocol-valid answers, and 44 meet the latency limit. A separate run generates new answers for 12 of the same prompts. Reviewers accept 10 of those 12 new answers. Alongside the suite result of 10/12, what should the team report for the benchmark?",
    "options": [
      "Report 44/50 for performance. Copy the suite verdicts to the 12 benchmark answers with matching prompts.",
      "Leave performance pending. Leave all 50 benchmark answers ungraded for semantic quality.",
      "Report 44/50 for performance. Leave all 50 benchmark answers ungraded for semantic quality.",
      "Leave performance pending. Copy the suite verdicts to the 12 benchmark answers with matching prompts."
    ],
    "answer": "Report 44/50 for performance. Leave all 50 benchmark answers ungraded for semantic quality.",
    "explanation": "All 50 benchmark answers passed the protocol check, and 44 also met the latency limit. Those records confirm 88% performance attainment, so holding that result for semantic review would discard a measurement the team already has. The 10 passes and two failures belong to the separate suite. Copying either verdict to a benchmark answer would grade a different output just because its prompt matched."
  }
]
```

> **Next:** Continue to [Code Completion System](/learn/design-code-completion-system).
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
The new serving build finishes more requests per second than the old one. The benchmark says so, and the chart in the pull request goes up and to the right. But users are waiting longer for first output, a few streams stall partway through, and some of the fastest responses contain invalid tool arguments.

Did the build improve? A single throughput number can't tell you. Worse, it can mislead you for an uncomfortable reason: when a server gets slow, a badly built load test quietly backs off, stops sending, and reports a healthy result.

The stakes are bigger than one bad chart. In the [previous chapter](/learn/llm-deployment-gpu-serving-autoscaling) we assumed that one replica sustains five active requests, and then derived a replica count, a warm buffer, and a budget from that assumption. If that number came from a flattering benchmark, the fleet plan is wrong too, and you'll discover it during the surge it was built for. This chapter is about earning that number honestly: reproduce the load, measure what clients experience, keep every failure, and say how sure you are.

## Freeze what arrives and when

An average prompt length hides exactly what hurts you. Keep the real thing: prompts or token IDs, scheduled arrivals, output policy, request class, and conversation dependencies, including the instructions, retrieved context, and history your application actually sends.

Our running example is a six-request incident-assistant trace:

| Request | Scheduled ms | Prompt positions | Output policy | Prefix | Class |
|---|---:|---:|---|---|---|
| r01 | 0 | 320 | natural stop, cap 96 | runbook A | interactive |
| r02 | 120 | 336 | natural stop, cap 96 | runbook A | interactive |
| r03 | 700 | 4,096 | natural stop, cap 256 | none | interactive |
| r04 | 760 | 280 | natural stop, cap 64 | none | interactive |
| r05 | 800 | 2,048 | natural stop, cap 512 | policy B | background |
| r06 | 1,900 | 480 | natural stop, cap 128 | runbook A | interactive |

Six requests is small, but every row is there for a reason. The long prompt at r03 lands 60 ms ahead of a short request, so it can [interfere with it](/learn/continuous-batching-request-scheduling). The background r05 can hold decode state for a long time. And r01, r02, and r06 share a runbook, which might [save real work](/learn/kv-cache-paged-attention-llm-serving) if compatible entries are warm. Repeating a prompt isn't wrong in itself, as long as you don't pass off a cache-friendly test as an unrelated production mix.

Pin the tokenizer and template. Keep output caps separate from actual lengths, since a cap isn't an observed length. Forcing exact lengths by ignoring end-of-sequence tokens can isolate scheduler behavior, but that makes it a stress test of execution shape, which says nothing about natural task completion.

Then save the realized trace and hash its bytes. A seed isn't enough, because library or tokenizer changes can produce different rows from the same seed. Public traces such as BurstGPT and ServeGen can challenge your assumptions about length tails and burstiness, but they don't represent your users.[^wang2025burstgpt][^xiang2026servegen]

## Don't let a slow server turn down its own test

This is the most important idea in the chapter. An **open-loop** generator schedules work independently of completions. If r04 is due at 760 ms, r03 still running doesn't cancel that arrival. A **closed-loop** generator waits for a virtual user to finish before starting that user's next request. So when service slows, the offered rate falls, and the server has effectively turned down its own test.

Neither one is wrong, because they answer different questions:

| Mode | What controls arrivals | The question it answers |
|---|---|---|
| Open-loop | Stored timestamps or an independent clock | Can the system sustain this offered workload? |
| Closed-loop | Completions and user think time | What do this many active users experience? |
| All-at-once | Every request released at the start | How does the system handle a burst? |

<figure>
  <img src="illustrations/_generated/arrival_clock_and_client_slots_dark.png" alt="Two client-slot timelines share a 700 to 1400 millisecond clock. With independent arrivals, r04 is sent at 765 while r03 occupies a slot until 1220. A single virtual user stays occupied by r03 through 1220, then waits a declared 80 millisecond think time before its next send at 1300." />
  <figcaption>The independent clock sends r04 while r03 is still running. The one-user model waits for completion and then an 80 ms think time, sending next at 1300 ms. These are client-slot timings, and server queue times remain unknown.</figcaption>
</figure>

Capacity claims need the open-loop answer. Little's Law then lets you check whether your client can even generate the load you asked for.[^little1961] In a stable system, with consistent definitions of what's "in" it, the average outstanding requests $L$ equal the arrival rate $\lambda$ times the mean time in the system $W$, or $L=\lambda W$.

Suppose a heavier version of this trace offers three requests per second with 0.9 seconds of mean residence. The average outstanding work is then 2.7 requests. A client capped at two outstanding requests can't sustain that combination, however good the server is. A cap of three holds the mean, and it can still throttle bursts, because an average isn't a maximum.

So rate, burstiness, and concurrency are three separate settings, and you should report each one and whether any cap actually limited the run. A Poisson process has exponential gaps with a coefficient of variation of one, while regular spacing has zero. Real traffic can have correlated bursts that neither describes, so save realized timestamps. If you time-scale a stored trace to sweep rates, that compresses its duration, so extend the trace or report the change. You can't keep both a fixed request count and a fixed duration while changing the rate.

## Catch the generator being late

Here's a failure that can make a test look better as the system gets worse. Say r04 was due at 760 ms and goes out at 800 ms because the generator fell behind, and its first token still arrives at 1,050 ms. Measured from the send, time to first token (TTFT) *improves* from 285 ms to 250 ms. Lateness has been converted into a better number.

This is one form of **coordinated omission**: the test stops observing the work that should have arrived during a slowdown.[^tene2014wrk2] The defense is cheap. Keep scheduled and sent timestamps in one client monotonic clock, and report both latency from the send and lag from the schedule. Declare a lag tolerance before the run, such as 20 ms. In that example, r04's lag rises from 5 ms to 40 ms and the run is invalid for its declared load. Delayed and unsent requests stay in the books.

Your load generator needs monitoring like any other system: connections, CPU, memory, event loop. A fast result from a throttled generator tells you very little about the rate you meant to offer.

Clocks need care too. A client queue shows client-side backpressure, and only server-local spans can attribute a separate server queue. Don't subtract client and server timestamps from each other without a measured synchronization scheme.

```checkpoint
A client cap of two binds while you test a target of three requests per second, and the server's latency stays low. What did you just learn?
---
You learned how the system behaves under the throttled workload, not its capacity at three requests per second. Keep the delayed arrivals, report schedule lag, and rerun with a generator that can sustain the intended schedule.
```

## Decide which requests belong to the run

Separate the run into phases: readiness, warmup, measurement, and drain. Warmup can include connections, kernel compilation, graphs, and scheduler state. Warm the prefix caches only if the scenario you're testing really starts with them warm, or you'll publish a number your morning surge won't see.

During an arrival window such as $[0, 2000)$ ms, offer the stored requests. When the window closes, keep every request until it reaches a terminal outcome: success, rejection, cancellation, error, or timeout. Choose timeouts before the run. A late response doesn't undo a timeout the client already experienced.

That gives two legitimate ways to count, and mixing them produces nonsense. An **arrival cohort** includes requests scheduled in the window, along with their outcomes during drain. A **wall-clock interval** counts completions inside some interval, including ones from earlier arrivals. Don't divide one population by the other's elapsed time. For our finite trace, the cohort runs from the window's start through the later of the window's end and the final outcome. That span includes drain, so don't read the result as a rate you could sustain.

For sustained runs, track starting and ending outstanding work, and compare accepted, completed, rejected, and timed-out rates. A flat server queue isn't enough to call a system healthy, because aggressive rejection can keep the queue flat while users fail. Run long enough to expose the relevant warmup, cache, thermal, and traffic cycles.

## Time what the protocol actually shows you

Let $s$ be the send time, $t_1$ the first token, $t_n$ the final token, and $c$ the terminal completion. With genuine token events on one clock:

$$
\mathrm{TTFT}=t_1-s,\qquad
\mathrm{ITL}_i=t_i-t_{i-1},
$$

$$
\mathrm{TPOT}=\frac{t_n-t_1}{n-1}\quad(n>1),\qquad
\mathrm{E2E}=c-s.
$$

Take r01, sent at zero, with tokens at 240, 280, 320, 440, and 480 ms, completing at 500 ms. TTFT is 240 ms, and mean time per output token (TPOT) is 60 ms. Terminal end-to-end latency is 500 ms. The inter-token gaps are 40, 40, 120, and 40 ms. That 120 ms pause is real, and the mean of 60 buries it.

<figure>
  <img src="illustrations/_generated/observed_stream_clock_dark.png" alt="Request r01 has a send at zero, token events at 240, 280, 320, 440, and 480 milliseconds, and terminal completion at 500. The inter-token gaps are 40, 40, 120, and 40 milliseconds. A one-token inset has TTFT 170 milliseconds and no TPOT." />
  <figcaption>The long gap between tokens three and four is 120 ms, while TPOT averages all four gaps to 60 ms. Terminal completion follows the last token, and a one-token response has no pacing to measure.</figcaption>
</figure>

Three details here cause wrong numbers in real reports. The final token isn't the end, since usage metadata and connection completion can follow it, and swapping $c$ for $t_n$ silently turns your metric into last-token latency. A one-token response has no interval at all, so its TPOT is undefined rather than zero, and you need to declare before scoring how such responses are treated.

The third is the big one: a streaming chunk may not be a token. A server-sent event can hold several tokens, metadata without text, or a fragment. TCP reads don't line up with event boundaries either. If you divide a multi-token chunk's delay by its token count, you've invented arrival times. So name what you actually observed:

| What you observed | The honest metric | What it can't tell you |
|---|---|---|
| First response byte | Time to first byte | Whether output text has started |
| First content-bearing chunk | Time to first content chunk | The exact first-token time |
| Client text chunks | Inter-chunk latency | Individual token gaps |
| Server token events | Server token cadence | What the client's network delivered |
| Client token-level events | Client-observed token gaps | GPU kernel duration |

Tools differ here as well. vLLM's benchmark calls gaps between accepted stream events ITL, even when speculation packs several tokens into one event.[^vllm2026benchmarkStreamImplementation][^vllm2026benchmarkServeImplementation] Match the endpoint, the events, and the installed version before you compare numbers between tools.

Averages also can't tell you whether a stream felt smooth, because order matters. Etalon's fluidity metric checks tokens against playback deadlines.[^agrawal2024etalon] Suppose the first token is due by 300 ms and one more every 80 ms, which makes the deadlines 300, 380, 460, 540, and 620. Our r01 stream meets all five despite its 120 ms gap, because it built up slack. A stream arriving at 300, 380, 460, 580, and 620 misses the fourth by 40 ms, even though its mean pacing sits exactly at the 80 ms target. Etalon goes further and also resets future deadlines after a stall, so read the paper before implementing it. If smoothness matters to your product, keep the event sequence rather than reducing each stream to one mean.

## Score everyone you invited

Now the accounting that catches the flattering benchmark. A request is **qualified** only if it reached terminal success, passed your task's quality check, and met your declared latency conditions. Everything else stays in the denominator: wrong answers, partial timeouts, rejections, and work that was never sent.

Here's the whole cohort, scored against a 300 ms first-output limit and an 80 ms pacing limit. We set the quality flags by hand here, so this scorer checks accounting and can't judge answers.

<!-- leetllm: test, output=show, id=reader-benchmark-cohort -->
```python title="score-six-requests.py"
scheduled = {"r01": 0, "r02": 120, "r03": 700,
             "r04": 760, "r05": 800, "r06": 1900}
# ID, sent, terminal, token times, status, quality verdict
rows = [
    ("r01", 0, 500, [240, 280, 320, 440, 480], "success", True),
    ("r02", 125, 310, [295], "success", True),
    ("r03", 705, 1220, [1045, 1085, 1125, 1165, 1205],
     "success", True),
    ("r04", 765, 1310, [1050, 1111, 1172, 1233, 1294],
     "success", True),
    ("r05", 805, 1180, [1005, 1045, 1085, 1125, 1165],
     "success", False),
    ("r06", 1905, 2500, [2200], "timeout", False),
]
assert len({row[0] for row in rows}) == len(rows)
assert {row[0] for row in rows} == set(scheduled)
successes = qualified = 0
for request_id, sent, terminal, tokens, status, quality in rows:
    assert scheduled[request_id] <= sent <= tokens[0]
    assert tokens[-1] <= terminal
    assert tokens == sorted(tokens)
    lag = sent - scheduled[request_id]
    assert lag <= 20
    ttft = tokens[0] - sent
    tpot = ((tokens[-1]-tokens[0]) / (len(tokens)-1)
            if len(tokens) > 1 else None)
    success = status == "success"
    paced = tpot is None or tpot <= 80
    good = success and quality and ttft <= 300 and paced
    successes += success
    qualified += good

horizon_s = max(2000, max(row[2] for row in rows)) / 1000
assert (successes, qualified, horizon_s) == (5, 3, 2.5)
print(f"attainment: {qualified}/{len(rows)}")
print(f"successful RPS: {successes/horizon_s:.1f}")
print(f"qualified RPS: {qualified/horizon_s:.1f}")
print(f"offered arrival-window RPS: {len(rows)/2:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
attainment: 3/6
successful RPS: 2.0
qualified RPS: 1.2
offered arrival-window RPS: 3.0
```
<!-- leetllm: output:end -->

Those four numbers describe the same run, and a dishonest report could quote any of them. Five requests returned success, so "2.0 RPS" is true. But only half of the requests that were offered got an acceptable result.

| Request | What happened | Qualified? |
|---|---|---|
| r01 | First output at 240 ms, pacing 60 ms | Yes |
| r02 | One token, first output at 170 ms, pacing doesn't apply | Yes |
| r03 | First output at 340 ms, over the 300 ms limit | No |
| r04 | First output at 285 ms, pacing 61 ms | Yes |
| r05 | Fast and successful, but its answer failed the quality check | No |
| r06 | Partial output, then a timeout at 2,500 ms | No |

<figure>
  <img src="illustrations/_generated/offered_request_ledger_dark.png" alt="Six requests share a 0 to 2500 millisecond clock. The arrival cohort ends at 2000 and drain continues to the r06 timeout at 2500. Requests r01, r02, and r04 qualify; r03 misses first output, r05 fails quality, and r06 times out." />
  <figcaption>All six requests stay in the cohort through drain. Two seconds of arrivals give 3.0 offered RPS, and the 2.5-second horizon gives 2.0 successful and 1.2 qualified RPS. Each rate names its own interval.</figcaption>
</figure>

Now you can see how the flattering version gets made. Remove r06 and attainment rises. Count r05 as good because it returned quickly, and attainment rises. Drop the requests the generator never got around to sending, and it rises again. No single step feels like cheating. The scorer above catches the dropped requests: its set comparison fails on an incomplete cohort, and its lag assertion fails past the 20 ms limit, so either one exits nonzero. It has to trust the quality label it's given, so that label needs a real check of its own. A fuller version, with its tests, is in this chapter's online edition at leetllm.com/learn/serving-benchmark-engineering.

If your client retries, keep attempt-level records and a separate result for each logical request. Otherwise, a retried request can count as both a failure and a success, or vanish into either.

## Goodput isn't the same as capacity

Goodput, the rate the [scheduling chapter](/learn/continuous-batching-request-scheduling) told you to put on the wall, counts useful completed work:

$$
G=\frac{\text{qualified requests}}{\text{declared elapsed seconds}}.
$$

Capacity is a different question: at which tested offered rate do you still meet your promise, with the load actually reproduced and the system stable? Call that promise a service-level objective, or SLO.

$$
C_{\mathrm{SLO}}=
\max\{\lambda_{\mathrm{tested}}:
A(\lambda)\geq\alpha,\quad
\text{load reproduced},\
\text{stable}\}.
$$

Here $A$ is qualified requests divided by all offered requests, and $\alpha$ is your required attainment. DistServe uses the word goodput for something closer to $C_{\mathrm{SLO}}$, measured per GPU,[^zhong2024] so name your definition.

Those two quantities can disagree, and that's how a build can look better while serving people worse. Pushing more load through may complete more qualifying requests per second while failing a larger fraction of your users. Consider a load sweep across three serving replicas, with 200 requests at each rate, a 95% attainment requirement, a 20 ms lag limit, and no sustained backlog growth. The traffic is the last chapter's incident summaries, whose replies run far longer than the six-request trace above:

| Offered RPS | Qualified / offered | Attainment | Max lag | Backlog | Passes? |
|---:|---:|---:|---:|---|---|
| 0.5 | 200 / 200 | 100% | 8 ms | flat | Yes |
| 1.0 | 200 / 200 | 100% | 9 ms | flat | Yes |
| 1.5 | 190 / 200 | 95% | 11 ms | flat | Yes |
| 2.0 | 160 / 200 | 80% | 12 ms | growing | No |
| 2.5 | 116 / 200 | 58% | 16 ms | growing | No |

Now work out goodput, using just the arrival window for simplicity. Two hundred requests at 1.5 RPS arrive over about 133 seconds, which gives about 1.43 qualified requests per second. At 2.0 RPS they arrive over 100 seconds, which gives 1.6. If your chart plots only goodput, the 2.0 point looks like the winner, even though one request in five failed its promise and the backlog is growing. Drain time would lengthen that denominator and shrink the gain, which is one more reason to name your interval.

<figure>
  <img src="illustrations/_generated/operating_curve_dark.png" alt="Two stacked line charts trace SLO attainment and goodput from 0.5 to 2.5 offered requests per second. Attainment holds at 100% through 1.0 RPS and clears the 95% floor at 1.5 RPS before dropping to 80% at 2.0 RPS and 58% at 2.5 RPS. Goodput keeps rising to 1.60 qualified requests per second at 2.0 RPS while failing the 95% objective." />
  <figcaption>The highest passing tested point is 1.5 RPS. Lag stays under 20 ms everywhere, so the generator isn't the bottleneck; attainment fails first at 2.0 RPS even as goodput peaks at 1.60 RPS.</figcaption>
</figure>

> **Key insight:** `1.5 RPS` is the highest *tested* rate that passed, not a safe operating target with zero margin. Confirm the failing neighbor (`2.0 RPS`), refine the sweep near the knee if you need tighter sizing, and reserve headroom for traffic spikes and replica failures.

## Back to five requests per replica

Now close the loop from the last chapter. Its replica formula wants a per-replica concurrency $c$, and you have a rate for a whole pool. Little's Law converts one into the other, as long as you measured the mean time in the system at the passing point. Say the run at 1.5 RPS averaged ten seconds from send to terminal completion, which is about what a 120-token reply costs at the 80 ms pacing limit. With first output inside 300 ms, almost none of that is queue wait, so it's also the time each request holds its slot.

<!-- leetllm: test, output=show, id=reader-benchmark-earn-five -->
```python title="earn-five.py"
from math import ceil

passing_rps, replicas, mean_seconds = 1.5, 3, 10.0
rate = passing_rps / replicas
active = rate * mean_seconds  # Little's Law: L = lambda * W
print(f"per replica: {rate:.1f} RPS, {active:.0f} active")

surge = 100  # active requests the fleet must carry
print("replicas by concurrency:", ceil(surge / active))
print("replicas by rate:", ceil(surge / mean_seconds / rate))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
per replica: 0.5 RPS, 5 active
replicas by concurrency: 20
replicas by rate: 20
```
<!-- leetllm: output:end -->

There's the five the last chapter took on faith, and the 0.5 requests per second that came with it, now earned for this request mix, as long as you take that 95% at face value. Both routes reach the same 20 replicas, because they're the same fact stated twice: five active requests at ten seconds each is 0.5 requests per second.

Three things keep that number honest. It's a mean, so a replica at this rate holds more than five during a burst and fewer in a lull, and the sweep only passed with those bursts in it. It belongs to this mix, so if replies double in length, you need a new sweep and not a new division. And it came from three replicas. Twenty can behave differently, because routing, prefix warmth, and shared storage all change with scale, so confirm it at a larger size before you trust the budget. Little's Law also sizes your generator: this run holds about 15 requests open on average. A client cap near 15 could bind during bursts; inspect actual schedule lag and whether the cap capped acceptance.

## How sure are you?

A percentile needs a population and enough observations. The nearest-rank p95 of 20 values is the 19th, and the p99 of 80 gaps is simply the maximum. Pooled token-gap percentiles weight long responses more, since they contribute more gaps. A percentile of each request's worst gap answers a different question, and averaging percentiles from separate runs reconstructs neither. Keep the raw samples.

Attainment has the same problem. Is 190 out of 200 really 95%? Under idealized assumptions of independent trials with constant probability at one preselected load, you can compute a one-sided 95% Wilson lower bound:[^nistBinomialIntervals2026]

<!-- leetllm: test, deps=numpy, output=show, id=reader-benchmark-uncertainty -->
```python title="attainment-bound.py"
from statistics import NormalDist
import numpy as np

z = NormalDist().inv_cdf(0.95)
good = np.array([190, 200, 20], dtype=np.float64)
n = np.array([200, 200, 20], dtype=np.float64)
p = good / n
lowers = (p + z * z / (2 * n) - z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / (1 + z * z / n)
for g_i, n_i, obs, low in zip(good.astype(int), n.astype(int), p, lowers):
    print(f"{g_i}/{n_i}: observed={obs:.1%}, lower={low:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
190/200: observed=95.0%, lower=91.8%
200/200: observed=100.0%, lower=98.7%
20/20: observed=100.0%, lower=88.1%
```
<!-- leetllm: output:end -->

Twenty perfect results give a lower bound of only 88.1%. If your rule requires the lower bound to reach 95%, then only the 200-of-200 row passes, and the 1.5 RPS point from our sweep fails. That's a stricter rule than the point-estimate one, and you should pick which you're using before the run, because it moves the fleet plan. Fall back to the 1.0 RPS point and assume its mean residence remains ten seconds for the same mix. Under that assumption, the conversion gives about 3.3 active requests per replica, so the 100 active requests that needed 20 replicas now need 30. Under that stricter policy, planning for 30 replicas makes sense because 190 of 200 sits right on the 95% threshold while 2.0 RPS is already failing, and this fleet exists for an incident surge when dropped promises cost more than idle GPUs. A finer sweep between 1.0 and 1.5 RPS could then earn some of those replicas back.

Real traffic breaks these assumptions in ways that make you overconfident. Correlated bursts and conversations mean requests aren't independent, so resample whole runs or time blocks. And picking the best of many noisy sweeps needs a selection-aware analysis or a fresh confirmation run, since the best of many is often just the luckiest. Alternate baseline and candidate run order so that one doesn't always inherit the other's warm state. Keep your rejected runs too, because without them nobody can tell a result from a lucky pick, and report cold-start and warm-capacity results apart, since they answer different questions.

## Leave a record someone else can check

A benchmark is an argument, and someone will want to check it, possibly you, six months from now, when a capacity plan fails. Record these:

- **Identity:** model, tokenizer, template, quantization, engine, client, and image.
- **Environment:** hardware count, placement, drivers, and gateway or network scope.
- **Workload:** exact trace bytes, realized timestamps, warmup and cache policy, timeouts, and duration.
- **Outcomes:** all terminal outcomes, raw timing events, quality judgments, and system telemetry.
- **Analysis:** populations, denominators, thresholds, uncertainty rules, repetitions, and rejected runs.
- **Decision:** the operating margin you chose, your recovery plan, and what you didn't test.

Performance and quality results need linking as well. A response truncated by accident looks fast, so check protocol completion, finish reason, actual output length, and schema on every performance request. If you only evaluated semantic quality on a separate sample, report it separately. Calling every unreviewed performance request "qualified" claims a check you never ran.

```checkpoint
Your report shows good attainment, a flat queue, and a scorer that exited cleanly. Can you approve this configuration for production?
---
Not from that alone. A clean exit checks that the data is complete and consistent. A capacity claim also needs a reproduced load, a representative workload, retained failures and rejections, real quality checks, and a repeated result. Whether it helps users is a further question, answered on live traffic with a stable assignment.
```

That's the arc of this part of the book: one request's clocks, the memory it occupies, the work it can reuse, the scheduler it competes in, the weights it reads, the signals that show it working, the release that defines it, the fleet that carries it, and now the measurements that show the whole thing delivers what you promised. [Responsible governance](/learn) takes those measurements into questions of ownership, risk, and oversight. And cost and gateway decisions can then rest on a measured limit in place of a headline throughput number.

<!-- leetllm: edition:reader:end -->
