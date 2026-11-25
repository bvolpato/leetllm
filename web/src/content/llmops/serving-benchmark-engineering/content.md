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

The new serving build finishes more requests per second than the old one. The benchmark says so, and the chart in the pull request climbs up and to the right. Yet users wait longer for the first word, a few streams stall partway through, and some of the fastest responses contain invalid tool arguments.

Did the build improve? A single throughput number can't answer that. Worse, it can mislead you for an uncomfortable reason: when a server slows down, a badly built load test quietly backs off, stops sending, and reports a healthy result.

The stakes go beyond one bad chart. [Continuous Batching and Scheduling](/learn/continuous-batching-request-scheduling) shows why prompt processing and generation compete, and [GPU Profiling, Correctness, and Benchmarking](/learn/gpu-kernel-performance-engineering-lab) separates kernel timing from wider execution. In [GPU Serving & Autoscaling](/learn/llm-deployment-gpu-serving-autoscaling), we assumed one replica sustains five active requests and derived a replica count, warm buffer, and budget from that assumption. If that capacity number came from a flattering benchmark, the fleet plan fails during the surge it was built for. Here we move measurement outward to the client, gateway, and serving system to earn that number honestly: reproduce the offered load, time what clients actually observe, keep every failure in the denominator, and state how sure you are.

## Freeze what arrives and when

An average prompt length hides the exact shapes that break tail latency. Keep the real workload: prompts or token IDs, scheduled arrival times, output policies, request classes, and conversation dependencies, including the system prompt, retrieved context, and history the application actually sends.

A six-request trace for an incident-response assistant anchors the accounting math throughout this lesson:

| Request | Scheduled ms | Prompt tokens | Output policy | Shared prefix | Class |
|---|---:|---:|---|---|---|
| `r01` | 0 | 320 | natural stop, cap 96 | runbook A | interactive |
| `r02` | 120 | 336 | natural stop, cap 96 | runbook A | interactive |
| `r03` | 700 | 4,096 | natural stop, cap 256 | none | interactive |
| `r04` | 760 | 280 | natural stop, cap 64 | none | interactive |
| `r05` | 800 | 2,048 | natural stop, cap 512 | policy B | background |
| `r06` | 1,900 | 480 | natural stop, cap 128 | runbook A | interactive |

Six requests is small, but every row exercises a distinct interaction. The long prompt at `r03` lands 60 ms ahead of the short `r04`, so it can [interfere with it](/learn/continuous-batching-request-scheduling). The background request `r05` can occupy a decode slot for longer. And `r01`, `r02`, and `r06` share a runbook, which lets <span data-glossary="prefix-cache">prefix caching</span> [save real work](/learn/kv-cache-paged-attention-llm-serving) when compatible entries stay warm. Repeating one prompt isn't inherently wrong; it's wrong to pass off a cache-friendly test as an unrelated production mix.

Count tokens with the pinned tokenizer and <span data-glossary="chat-template">chat template</span>. Keep output caps separate from actual lengths, since a cap isn't an observed output length. Forcing exact lengths by ignoring <span data-glossary="end-of-sequence-token">end-of-sequence (EOS) tokens</span> can isolate scheduler behavior, turning the run into a shape-controlled stress test rather than a natural-response quality evaluation.

Generate the realized trace once, save it, and hash its exact bytes. A seed isn't enough because library or tokenizer upgrades can emit different rows from the same seed. Public traces such as BurstGPT and ServeGen help challenge assumptions about length tails and burstiness,[^wang2025burstgpt][^xiang2026servegen] but neither represents your own traffic mix. Preserve the length tails, prompt-to-output correlations, tenant mix, prefix reuse, and conversation dependencies that govern your application.

## Don't let a slow server turn down its own test

This is the most important distinction in serving benchmarks. An **open-loop** generator schedules requests independently of completions: if `r04` is due at 760 ms, `r03` still running doesn't cancel or delay that arrival. A **closed-loop** generator starts another request only after a virtual user finishes and waits a think time. When the server slows down, a closed-loop generator's offered rate drops, so the slow server quietly turns down its own test.

Neither mode is wrong; they answer different questions:

| Mode | What controls arrivals | Question it answers |
|---|---|---|
| Open-loop | Stored timestamps or an independent clock | Can the system sustain this offered workload? |
| Closed-loop | Completions and user think time | What do this many active users experience? |
| All-at-once | Every request released at the start | How does the system handle a batch or arrival burst? |

<figure>
  <img src="illustrations/_generated/arrival_clock_and_client_slots_dark.png" alt="Two client-slot timelines share a 700 to 1400 millisecond clock. With independent arrivals, r03 occupies one slot from its actual send at 705 to terminal completion at 1220, while r04 is due at 760 and occupies another slot from send 765 to terminal 1310. A separate single-virtual-user model stays occupied by r03 through 1220, then waits 80 milliseconds of think time before sending again at 1300. The due-time marker remains at 760." />
  <figcaption>The independent clock sends r04 while r03 still occupies a slot from 705 to 1220 ms. The lower lane models one virtual user waiting for completion plus an 80 ms think time before sending at 1300 ms, isolating client-slot occupancy rather than server queue internals.</figcaption>
</figure>

MLPerf Inference formalizes distinct scenarios along this line: Single Stream waits for each completion, while Server and Interactive use Poisson arrivals with explicit latency and quality rules.[^mlcommons2026inference]

### Rate, concurrency, and burstiness aren't interchangeable

Capacity claims need the open-loop answer. Little's Law then checks whether your load generator can even sustain the rate you asked for.[^little1961] In a stable system with consistent boundaries, average outstanding requests $L$ equal accepted arrival rate $\lambda$ times mean residence time $W$:

$$
L = \lambda W
$$

At 3.0 requests/s and 0.9 s mean residence, average outstanding work is $L = 2.7$ requests. A client capped at two concurrent slots can't sustain that rate regardless of how fast the server runs. Even a three-slot cap throttles bursts because an average isn't a maximum, so verify whether any client cap bound during the run.

<figure>
  <img src="illustrations/_generated/concurrency_budget_dark.png" alt="Little's Law throughput curve comparing client concurrency limits from 1 to 8 slots against a target arrival rate of 3.0 requests per second and 0.9 second mean residence time. Deterministic pacing reaches the 3.0 RPS target at 3 slots, whereas Poisson arrival bursts stall below target until 6 to 8 slots provide burst headroom." />
  <figcaption>At 3.0 accepted requests/s and 0.9 s mean residence, Little's Law yields 2.7 average active slots. A 1- or 2-slot cap throttles throughput below the offered rate, and even 3 slots fall behind under Poisson arrival bursts until 6 to 8 slots leave headroom for spikes.</figcaption>
</figure>

Report rate, burstiness, and concurrency separately. A Poisson process has exponential inter-arrival gaps with coefficient of variation $CV = 1$, while regular spacing has $CV = 0$. Real traffic often exhibits correlated bursts that neither describes, so save realized timestamps when replay identity matters.

Tool defaults require inspection too. `vllm bench serve`, for example, exposes `--request-rate`, `--burstiness` (a Gamma shape parameter $k$ with $CV = 1/\sqrt{k}$), and `--max-concurrency`. An infinite request rate creates an all-at-once or concurrency-limited stress mode rather than an open-loop test, and its constant-rate path rescales sampled gaps so the final arrival lands at request count divided by rate (whereas self-timed replay uses stored timestamps directly).[^vllm2026benchmarkcli][^vllm2026benchmarkServeImplementation] Similarly, time-scaling a stored trace to sweep offered rate compresses its duration: either extend the trace to keep duration comparable or report the shorter window explicitly.

## Catch the generator being late

Here is a subtle failure that makes a run look better as the system degrades. Suppose `r04` is scheduled at 760 ms, leaves the client late at 800 ms because the load generator fell behind, and still receives its first token at 1,050 ms. Measured from send time, <span data-glossary="ttft">time to first token (TTFT)</span> *improves* from 285 ms to 250 ms. Generator lateness masquerades as faster inference.

This is one form of **coordinated omission**: the test stops observing the work that should have arrived during a slowdown.[^tene2014wrk2] The defense is cheap. Record `scheduled_ms` and `sent_ms` on one client monotonic clock, and report send-relative latency alongside schedule lag (`sent_ms - scheduled_ms`). Declare a schedule-lag tolerance before the run, such as 20 ms. When `r04`'s lag climbs from 5 ms to 40 ms, the run is invalid for its declared offered load. Delayed and unsent requests must stay in the workload denominator.

Monitor the load generator like any service: connections, CPU, memory, and event-loop lag. Some tools (such as vLLM's `client_queue_time` and `e2el_including_client_queue` under finite rates with a client concurrency cap) surface client backpressure on successful requests,[^vllm2026benchmarkServeImplementation] but they don't replace full offered-request failure accounting. Finally, keep clock domains separate: use client timestamps for client latency, and use server-local spans or measured clock synchronization to attribute server queues.

```checkpoint
A client cap of two binds while you test a target of 3 requests/s, and the server's latency stays low. What did you just learn?
---
You learned how the system behaves under the throttled workload, not its capacity at 3 requests/s. Keep the delayed arrivals, report schedule lag, and rerun with a generator that can sustain the intended schedule.
```

## Decide which requests belong to the run

Separate every run into four phases: readiness, warmup, measurement, and drain. Warmup covers model loading, kernel compilation, CUDA Graph capture, connection pools, and scheduler initialization. Populate prefix caches during warmup only if the target production scenario actually begins with those prefixes warm.

During the measurement arrival window, such as $[0, 2000)$ ms, send the declared workload. Once arrivals stop, retain every in-flight request through drain until it reaches a terminal outcome: success, rejection, cancellation, error, or timeout. Fix timeouts before the run; a late response never erases a timeout the client already experienced.

Two accounting views are valid, and mixing them breaks every rate:

- An **arrival cohort** includes every request scheduled in the window and tracks all of its outcomes through drain.
- A **wall-clock interval** counts completions occurring inside a fixed interval, including arrivals from before the interval; track starting and ending outstanding work to interpret it.

Never divide one population's count by the other population's elapsed time. For our finite six-request trace, the cohort horizon runs from window start through the later of window end and final terminal outcome. Because that span includes drain, finite-cohort rates are accounting summaries rather than sustainable-capacity estimates.

For sustained load tests, plot outstanding work over time and compare accepted, completed, rejected, and timed-out rates. A flat server queue alone isn't proof of health because aggressive rejection keeps the queue shallow while users fail. Run long enough to cover warmup, cache turnover, thermal behavior, and traffic cycles.

## Time what the protocol actually shows you

Let $s$ be client send time, $t_1$ first output-token time, $t_n$ final output-token time, and $c$ terminal completion time. With genuine per-token events on one clock, TTFT, <span data-glossary="itl">inter-token latency (ITL)</span>, request-mean <span data-glossary="tpot">time per output token (TPOT)</span>, and terminal end-to-end latency are:

$$
\mathrm{TTFT} = t_1 - s, \qquad \mathrm{ITL}_i = t_i - t_{i-1},
$$

$$
\mathrm{TPOT} = \frac{t_n - t_1}{n - 1} \quad (n > 1), \qquad \mathrm{E2E} = c - s.
$$

Take `r01`, sent at 0 ms, with token times `[240, 280, 320, 440, 480]` ms and terminal completion at 500 ms. TTFT is 240 ms, mean TPOT is 60 ms, and terminal E2E is 500 ms. Yet the four inter-token gaps are `[40, 40, 120, 40]` ms: a real 120 ms mid-stream pause disappears inside the 60 ms average.

<figure>
  <img src="illustrations/_generated/observed_stream_clock_dark.png" alt="Request r01 shares one millisecond clock: send at 0, normalized token events at 240, 280, 320, 440, and 480, and terminal completion at 500. TTFT spans 0 to 240. The four inter-token gaps are 40, 40, 120, and 40 milliseconds. Their first-to-last span is 240 milliseconds over four intervals, giving TPOT 60. Last-token latency is 480, while terminal E2E is 500. The aligned r02 inset has send at 125 and one token at 295, so TTFT is 170 milliseconds and TPOT is not applicable. These token events come directly from logged arrivals rather than reconstructed SSE chunks." />
  <figcaption>The gap between tokens three and four is 120 ms, while TPOT averages all four gaps to 60 ms. Terminal completion follows the last token, and the single-token inset has a 170 ms TTFT with undefined TPOT.</figcaption>
</figure>

Three protocol details routinely distort real reports:

1. **Terminal completion isn't the last token.** Usage metadata, stop signals, or connection close can follow $t_n$. Replacing $c$ with $t_n$ silently turns terminal E2E into last-token latency.
2. **One-token outputs have undefined TPOT.** With $n = 1$, there are zero inter-token intervals, so TPOT is undefined rather than zero. Declare the eligibility rule before scoring: skip the TPOT gate on successful single-token replies while still checking TTFT and quality, and fail empty successful outputs unless the endpoint explicitly allows them.
3. **A streaming chunk isn't necessarily a token.** A server-sent event (SSE) may bundle several tokens, emit metadata without text, or split a multibyte fragment, and TCP reads don't align with SSE frames. Dividing a multi-token chunk's delay by its token count invents timestamps you never observed. Name the exact metric your observations support:

| What you observed | Honest metric | What it can't tell you |
|---|---|---|
| First response byte | Time to first byte | Whether output text has started |
| First content-bearing chunk | Time to first content chunk | Exact first-token emission time |
| Client text chunks | Inter-chunk latency | Individual token ITL |
| Server token events | Server token cadence | Client-visible network cadence |
| Client token-level events | Client-observed ITL | GPU kernel duration |

<figure>
  <img src="illustrations/_generated/chunk_observation_layers_dark.png" alt="Two-part diagram separating raw network reads from token-granular timing. Across the upper pipeline, TCP bytes feed SSE frames, a single chunk timestamp spans three tokens, and only a per-token event log exposes inter-token latency. Two lower panels contrast a multi-token chunk whose inner gaps remain unknown against request r01's recorded token timestamps at 240, 280, 320, 440, and 480 milliseconds." />
  <figcaption>Network reads and SSE chunks bundle multiple tokens behind one frame timestamp, hiding per-token jitter. Genuine ITL requires per-token timestamps like r01's 40, 40, 120, and 40 ms gaps.</figcaption>
</figure>

Tools differ here too. vLLM's benchmark calls gaps between accepted stream events ITL even when speculative decoding bundles several tokens into one event, and its Chat Completions adapter stops latency at the last chunk with nonempty `choices` (ignoring trailing usage frames and `[DONE]`).[^vllm2026benchmarkStreamImplementation][^vllm2026benchmarkServeImplementation] Match the endpoint, observed events, token-count source, and adapter version before comparing numbers across tools.

### Smoothness depends on event order

A long gap isn't always a visible stall because earlier tokens can arrive ahead of reading speed and build slack. Etalon's fluidity metric evaluates streams against playback deadlines to capture that difference.[^agrawal2024etalon] Suppose token 1 is due at 300 ms and each subsequent token every 80 ms, giving deadlines `[300, 380, 460, 540, 620]` ms. Our `r01` trace (`Stream A`) meets every deadline despite its 120 ms gap. By contrast, `Stream B` arriving at `[300, 380, 460, 580, 620]` ms averages exactly 80 ms TPOT yet misses token four by 40 ms.

<figure>
  <img src="illustrations/_generated/playback_deadline_slack_dark.png" alt="Cumulative token-arrival chart comparing Stream A and Stream B against a 300 millisecond first-token deadline plus 80 milliseconds per subsequent token. Stream A finishes every token ahead of deadline even with a 120 millisecond fourth-token pause, whereas Stream B maintains an 80 millisecond mean TPOT yet crosses 40 milliseconds past the 540 millisecond deadline on token four." />
  <figcaption>Early slack absorbs later pauses: Stream A stays beneath every deadline despite a 120 ms gap, while Stream B averages 80 ms TPOT yet crosses the 540 ms deadline on token four.</figcaption>
</figure>

Etalon goes further by resetting subsequent deadlines after a stall so sustained freezes weigh more than isolated blips.[^agrawal2024etalon] When playback smoothness matters, keep the ordered timestamp sequence instead of reducing each stream to one mean.

## Score everyone you invited

Now build the accounting that catches a flattering benchmark. A request is **qualified** only if it reaches terminal success, passes your task quality check, and satisfies your declared latency limits. Every other offered request stays in the denominator: wrong answers, partial timeouts, rejections, and requests the generator never sent.

Here is the six-request cohort scored against a 300 ms TTFT limit, an 80 ms TPOT limit, and a 20 ms schedule-lag limit. Quality verdicts are supplied as inputs here because the scorer enforces accounting rather than judging semantics:

<!-- leetllm: test, output=show, id=benchmark-cohort -->
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
    tpot = ((tokens[-1] - tokens[0]) / (len(tokens) - 1)
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

Those four numbers describe the exact same run, yet a selective report can quote any one of them. Five requests returned HTTP success, so "2.0 successful RPS" is technically true, even though only half of the offered requests delivered an acceptable result:

| Request | Outcome | Qualified? |
|---|---|---|
| `r01` | TTFT 240 ms, TPOT 60 ms, terminal E2E 500 ms | Yes |
| `r02` | Single token, TTFT 170 ms; TPOT not applicable | Yes |
| `r03` | TTFT 340 ms exceeds the 300 ms limit | No |
| `r04` | TTFT 285 ms and TPOT 61 ms | Yes |
| `r05` | Fast successful reply, but task quality check fails | No |
| `r06` | Partial output followed by timeout at 2,500 ms | No |

<figure>
  <img src="illustrations/_generated/offered_request_ledger_dark.png" alt="Six request identities share a 0 to 2500 millisecond clock. Scheduled arrivals are 0, 120, 700, 760, 800, and 1900; actual sends are 0, 125, 705, 765, 805, and 1905; terminal outcomes are 500, 310, 1220, 1310, 1180, and 2500. The arrival cohort ends at 2000 and drain continues to the r06 timeout at 2500. Requests r01, r02, and r04 qualify; r03 misses TTFT, r05 fails the quality check, and r06 times out. Six offered, five successful, and three qualified give 50 percent attainment. Offered rate is 3.0 per second over the two-second arrival window; success and qualified rates are 2.0 and 1.2 over the 2.5-second cohort horizon. An inset changes only r04 send from 765 to 800 while its first token remains at 1050. Send-relative TTFT falls from 285 to 250 milliseconds, but schedule lag rises from 5 to 40 and exceeds the 20 millisecond limit." />
  <figcaption>All six offered requests remain in the cohort through drain. Two seconds of arrivals give 3.0 offered RPS, and the 2.5-second horizon gives 2.0 successful and 1.2 qualified RPS. In the inset, delaying r04's send shrinks apparent TTFT while schedule lag breaches 20 ms.</figcaption>
</figure>

To run the full CLI validator locally (Python 3.12+ and `uv`, zero external packages), download [the scorer](assets/score_requests.py), [the scheduling manifest](assets/example-trace.json), [the sample outcomes](assets/example-events.jsonl), and [the accounting tests](assets/test_score_requests.py), then run `uv run score_requests.py example-trace.json example-events.jsonl > scored.json` and `uv run test_score_requests.py`.

Notice its strict exit-code and omission contract:
- **Exit 0:** Schema, cohort completeness, and schedule checks passed (data integrity passed, not deployment approval).
- **Exit 1:** Malformed or incomplete inputs (for example, deleting `r06`'s timeout record aborts without printing a report, preventing dropped failures from inflating attainment).
- **Exit 2:** Accounting report printed with all offered requests retained, but the generator missed its schedule (lag exceeded 20 ms or a request stayed unsent, recorded with `status: "not_sent"`, null `sent_ms`, no tokens, a terminal accounting timestamp, and `quality_pass: false`).

If your client retries requests, keep attempt-level records alongside one logical-request result rather than silently merging duplicate IDs.

## Goodput isn't the same as capacity

<span data-glossary="goodput">Goodput</span> counts useful completed work over a declared interval:

$$
G_{\text{requests}} = \frac{\text{qualified requests}}{\text{declared elapsed seconds}}.
$$

SLO-constrained capacity asks a different question: what is the highest tested offered rate that still satisfies your <span data-glossary="slo">service-level objective (SLO)</span> attainment target $\alpha$ while reproducing the load and staying stable?

$$
C_{\mathrm{SLO}} = \max\{\lambda_{\mathrm{tested}} : A(\lambda) \geq \alpha \ \land \ \text{load reproduced} \ \land \ \text{stable}\}.
$$

Here $A(\lambda)$ is qualified requests divided by all offered requests. DistServe defines goodput per GPU closer to $C_{\mathrm{SLO}}$,[^zhong2024] so state your exact definition instead of assuming two tools mean the same quantity.

Goodput and capacity can pull in opposite directions. Pushing a server past its knee can finish more qualifying requests per second while failing a larger share of incoming users. Consider a rate sweep across three replicas running 200 longer incident-summary requests per point, requiring $\ge 95\%$ attainment, $\le 20$ ms schedule lag, and a flat backlog:

| Offered RPS | Qualified / offered | Attainment | Max lag | Backlog | Point estimate passes? |
|---:|---:|---:|---:|---|---|
| 0.5 | 200 / 200 | 100% | 8 ms | flat | Yes |
| 1.0 | 200 / 200 | 100% | 9 ms | flat | Yes |
| 1.5 | 190 / 200 | 95% | 11 ms | flat | Yes |
| 2.0 | 160 / 200 | 80% | 12 ms | growing | No |
| 2.5 | 116 / 200 | 58% | 16 ms | growing | No |

Over the arrival window alone, 200 requests at 1.5 RPS arrive in ~133 s (`1.43` qualified RPS), whereas at 2.0 RPS they arrive in 100 s (`1.60` qualified RPS). A chart plotting only goodput crowns 2.0 RPS the winner even though one in five users fails the SLO and the backlog grows without bound.

<figure>
  <img src="illustrations/_generated/operating_curve_dark.png" alt="Two stacked line charts trace SLO attainment and goodput from 0.5 to 2.5 offered requests per second. Attainment holds at 100% through 1.0 RPS and clears the 95% floor at 1.5 RPS before dropping to 80% at 2.0 RPS and 58% at 2.5 RPS. Goodput keeps rising to 1.60 qualified requests per second at 2.0 RPS while failing the 95% objective." />
  <figcaption>The highest passing tested rate is 1.5 RPS (11 ms max lag, flat backlog). At 2.0 RPS, arrival-window goodput climbs to 1.60 qualified RPS even as attainment drops to 80% and queueing grows.</figcaption>
</figure>

> **Key insight:** `1.5 RPS` is the highest *tested* rate that passed under a point-estimate rule, not a zero-margin production target. Confirm the failing neighbor (`2.0 RPS`), refine the step size near the knee when tighter sizing matters, and reserve headroom for traffic drift and replica loss.

## Back to five requests per replica

Now connect this sweep back to [GPU Serving & Autoscaling](/learn/llm-deployment-gpu-serving-autoscaling), which needed a per-replica concurrency $c$. Little's Law converts the passing pool rate into active concurrency using the measured mean residence time at 1.5 RPS. Suppose requests average 10.0 s from send to terminal completion (consistent with ~120-token replies at the 80 ms pacing limit):

<!-- leetllm: test, output=show, id=benchmark-earn-five -->
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

Both routes yield 20 replicas before headroom because five active requests at 10 s each is 0.5 RPS per replica. Keep three guardrails on that conversion: it is a *mean* (bursts momentarily exceed five), it belongs strictly to this length mix (if replies double, run a new sweep), and three replicas don't automatically scale linearly to twenty (routing, prefix locality, and shared bottlenecks shift with fleet size). Little's Law also sizes the load generator: holding 15 mean active requests requires client concurrency headroom well above 15 during bursts.

## How sure are you?

A percentile needs both a defined population and enough observations. Nearest-rank p95 of 20 values is the 19th ordered item; nearest-rank p99 of 80 gaps is simply the maximum. Pooled ITL percentiles weight long responses more heavily because they emit more gaps, whereas a percentile across each request's worst gap weights every request equally. Averaging percentiles across runs reconstructs neither, so retain raw samples and stratify by prompt length, output length, and priority class.

Attainment carries the same sampling uncertainty. Does `190 / 200` truly establish 95% attainment? Under idealized independent Bernoulli trials with constant pass probability at one preselected load, compute the one-sided 95% Wilson lower confidence bound:[^nistBinomialIntervals2026]

<!-- leetllm: test, deps=numpy, output=show, id=benchmark-uncertainty -->
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

<figure>
  <img src="illustrations/_generated/attainment_uncertainty_dark.png" alt="Zoomed 85% to 100% plot of one-sided 95% Wilson lower confidence bounds for three benchmark outcomes. Only 200 of 200 passes a 95% lower-bound gate at 98.7%. Both 190 of 200 (95% observed, 91.8% lower bound) and 20 of 20 (100% observed, 88.1% lower bound) fall below 95%." />
  <figcaption>Sample size tightens the one-sided 95% Wilson lower bound under independent trials. Only 200/200 clears a 95% lower-bound rule (98.7%), whereas 190/200 (91.8%) and 20/20 (88.1%) fall short.</figcaption>
</figure>

> **Key insight:** `190/200` passes a 95% point-estimate rule yet fails a 95% lower-bound rule (`91.8%`), and even a perfect `20/20` only reaches `88.1%`. Falling back to `1.0 RPS` (200/200) drops per-replica capacity to ~3.3 active requests and raises the 100-request surge plan from 20 to 30 replicas until a finer sweep between 1.0 and 1.5 RPS earns replicas back.

Real traffic breaks independence via bursts and multi-turn conversations, so resample whole runs or time blocks instead of single gaps. Picking the best point from many noisy sweeps requires a fresh confirmation run. Alternate baseline and candidate run order so neither permanently inherits warm cache or thermal state, separate cold-start from warm-capacity runs, and keep rejected runs alongside passing ones.

## Join performance and quality, and leave an auditable record

Performance and semantic quality need linked yet distinct evidence. Check protocol completion, finish reason, output length, and required schema on every performance response so accidental truncation never masquerades as a speedup. When speculative decoding or quantization changes the serving path, verify task quality alongside throughput. If semantic quality is graded only on a separate sampled suite, report performance attainment and semantic suite acceptance separately instead of labeling unscored performance responses semantically qualified.

Record six elements with every benchmark so another engineer can check your claim:

- **Identity:** model, tokenizer, chat template, quantization, engine, client, and container image.
- **Environment:** GPU count, placement, drivers, gateway/network scope, and relevant limits.
- **Workload:** exact trace bytes and hashes, realized timestamps, warmup/cache policy, timeouts, and run duration.
- **Outcomes:** every terminal outcome, raw timing events, quality verdicts, and system telemetry.
- **Analysis:** populations, denominators, SLO thresholds, uncertainty rules, repetitions, and rejected runs.
- **Decision:** chosen operating margin, recovery plan, and untested conditions.

```checkpoint
Your report shows strong attainment, a flat server queue, and a local scorer that exited with code 0. Can you approve the serving configuration from that alone?
---
No. Exit code 0 confirms schema and cohort accounting integrity, not production readiness. Approving capacity requires reproduced open-loop load, retained failures and rejections, representative workload and quality evidence, repeated runs, and live validation with a stable rollout assignment.
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
