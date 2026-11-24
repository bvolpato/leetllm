---
{
  "id": "batch-streaming-feature-pipelines",
  "title": "Batch and Streaming Feature Pipelines",
  "slug": "batch-streaming-feature-pipelines",
  "section": "Production ML Systems",
  "category": "MLOps & Deployment",
  "difficulty": "Medium",
  "order": 2,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": ["Amazon", "DoorDash", "Uber", "Netflix"],
  "shortDescription": "Replay fraud-scoring features at decision time from events, then keep that same meaning in online serving.",
  "keyConceptsTested": ["event time", "point-in-time joins", "batch backfills", "streaming freshness", "offline online parity", "late events"]
}
---

At `09:00 UTC` on May 1, a fraud model scores account `A-409` using one key feature: hours since the last verified security check. During a network blip, verification event `E2` happens at `08:30 UTC` but does not reach the message broker until `11:00 UTC`. Live serving at `09:00` only saw the earlier `01:00` check (`E1`) and fed the model `8.0` hours. The next day, a naive warehouse query reads `E2`'s `08:30` timestamp and writes `0.5` hours into the training row for that exact `09:00` score.

Training on `0.5` hours leaks future knowledge into the model and inflates offline metrics while live inference still sees `8.0` hours. Building reliable ML pipelines means keeping **batch processing** (bounded historical slices in object storage) and **streaming processing** (continuous stateful updates from an unbounded log) locked to the exact same temporal semantics. Following on from [feature engineering](/learn/feature-engineering-production-ml), we will trace how dual-clock timestamps, point-in-time joins, dual feature stores, watermarks, idempotent updates, and paired parity checks keep training and serving in lockstep.

## Dual-clock time semantics: event time versus ingestion time

Reproducing an online feature vector requires three separate clocks:

| Field | Example | Meaning |
| --- | --- | --- |
| `event_time` | May 1, 08:30 UTC | When the source service generated the event |
| `ingested_at` | May 1, 11:00 UTC | When the broker or lakehouse sink received it |
| `prediction_time` | May 1, 09:00 UTC | When the model scored account `A-409` |

Event `E2` carries an <span data-glossary="event-time">event time</span> 30 minutes before `09:00`, yet its two-hour network delay kept it invisible at decision time. Assuming an accepted record becomes readable immediately at `ingested_at`, eligibility at <span data-glossary="prediction-timestamp">prediction timestamp</span> $t_p$ requires both clocks to clear the cutoff:

$$
t_{\mathrm{event}} \le t_p \quad\text{and}\quad t_{\mathrm{ingested}} \le t_p.
$$

If stream processing also takes time between broker ingestion (`08:58`) and Redis publication (`09:02`), track an explicit **feature availability timestamp** ($t_{\mathrm{available}} \le t_p$) or log the served feature vector directly at inference time.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Dual-clock timeline plotting event time (top lane) and broker arrival time (bottom lane) against decision cutoffs at 09:00, 12:00, and 16:00 UTC. Event E1 (01:00 to 01:02) satisfies both clocks by 09:00 (age 8.0h); E2 (08:30 to 11:00) crosses the 09:00 cutoff and appears at 12:00 (age 3.5h); E3 (12:00 to 12:01) appears at 16:00 (age 4.0h)." />
  <figcaption>At <code>09:00</code>, only <code>E1</code> meets both event-time and ingestion-time cutoffs, producing a verification age of <code>8.0h</code>. Once <code>E2</code> arrives at <code>11:00</code>, the <code>12:00</code> score sees <code>3.5h</code>, and <code>E3</code> updates the <code>16:00</code> score to <code>4.0h</code>.</figcaption>
</figure>

```checkpoint
A verification event occurred at `08:30` UTC but was not ingested until `11:00` UTC. Should a training row for a `09:00` UTC prediction include it?
---
No. Reproducing what live inference saw requires both `event_time <= prediction_time` and `ingested_at <= prediction_time`. The event had already occurred at the source, yet the feature pipeline had not received it at decision time.
```

## Rebuilding what live serving knew at decision time

Let's simulate three verification events for `A-409` across one stateful Python session, normalizing timestamps to UTC with `datetime` and measuring arrival lag in NumPy.[^python_datetime]

<!-- leetllm: test, output=show, id=pipeline-lab -->
```python title="01-inspect-event-clocks.py"
from datetime import datetime, timedelta, timezone
import numpy as np


def dt(value):
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


events = [
    {
        "id": "E1",
        "account": "A-409",
        "event_time": dt("2026-05-01T01:00:00"),
        "ingested_at": dt("2026-05-01T01:02:00"),
        "source_version": 1,
    },
    {
        "id": "E2",
        "account": "A-409",
        "event_time": dt("2026-05-01T08:30:00"),
        "ingested_at": dt("2026-05-01T11:00:00"),
        "source_version": 1,
    },
    {
        "id": "E3",
        "account": "A-409",
        "event_time": dt("2026-05-01T12:00:00"),
        "ingested_at": dt("2026-05-01T12:01:00"),
        "source_version": 1,
    },
]
prediction_time = dt("2026-05-01T09:00:00")

lags_min = np.array(
    [(event["ingested_at"] - event["event_time"]).total_seconds() / 60 for event in events]
)
for event, lag in zip(events, lags_min):
    print(
        f'{event["id"]} occurred={event["event_time"]:%H:%M} '
        f'arrived={event["ingested_at"]:%H:%M} lag={int(lag)}m'
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
E1 occurred=01:00 arrived=01:02 lag=2m
E2 occurred=08:30 arrived=11:00 lag=150m
E3 occurred=12:00 arrived=12:01 lag=1m
```
<!-- leetllm: output:end -->

Filtering by `event_time <= prediction_time` alone silently pulls `E2` into the `09:00` feature row (`0.5h`):

<!-- leetllm: test, output=show, continue=pipeline-lab, id=event-time-only -->
```python title="02-expose-event-time-only-bug.py"
def event_time_only(events, account_id, at):
    return [
        event
        for event in events
        if event["account"] == account_id and event["event_time"] <= at
    ]


def verification_age_hours(visible, at):
    if not visible:
        return "missing"
    latest = max(visible, key=lambda event: event["event_time"])
    return (at - latest["event_time"]).total_seconds() / 3600


naive_replay = event_time_only(events, "A-409", prediction_time)
print("event-time-only ids:", [event["id"] for event in naive_replay])
print(f"event-time-only age: {verification_age_hours(naive_replay, prediction_time):.1f}h")
print("leaked late verification:", any(event["id"] == "E2" for event in naive_replay))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
event-time-only ids: ['E1', 'E2']
event-time-only age: 0.5h
leaked late verification: True
```
<!-- leetllm: output:end -->

Adding `ingested_at <= prediction_time` excludes `E2` and recovers the `8.0h` age live serving actually computed:

<!-- leetllm: test, output=show, continue=event-time-only, id=decision-time-replay -->
```python title="03-filter-by-decision-time.py"
def known_by(events, account_id, at):
    return [
        event
        for event in events
        if (
            event["account"] == account_id
            and event["event_time"] <= at
            and event["ingested_at"] <= at
        )
    ]


faithful_replay = known_by(events, "A-409", prediction_time)
print("decision-time ids:", [event["id"] for event in faithful_replay])
print(f"decision-time age: {verification_age_hours(faithful_replay, prediction_time):.1f}h")
print("late verification excluded:", all(event["id"] != "E2" for event in faithful_replay))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
decision-time ids: ['E1']
decision-time age: 8.0h
late verification excluded: True
```
<!-- leetllm: output:end -->

To handle revisions at the same timestamp, rank visible events by `(event_time, source_version)` and quarantine any equal-key records with conflicting payloads rather than letting arrival order pick a winner:

<!-- leetllm: test, output=show, continue=decision-time-replay, id=as-of-rows -->
```python title="04-build-as-of-rows.py"
def state_order(event):
    return (event["event_time"], event.get("source_version", 0))


def revision_value(event):
    return event.get("risk_tier")


def as_of_hours(events, account_id, at):
    visible = known_by(events, account_id, at)
    if not visible:
        return "missing"
    latest_order = max(state_order(event) for event in visible)
    latest = [event for event in visible if state_order(event) == latest_order]
    if len({revision_value(event) for event in latest}) > 1:
        return "quarantined"
    hours = (at - latest[0]["event_time"]).total_seconds() / 3600
    return hours


for requested_at in [
    dt("2026-05-01T09:00:00"),
    dt("2026-05-01T12:00:00"),
    dt("2026-05-01T16:00:00"),
]:
    age = as_of_hours(events, "A-409", requested_at)
    rendered = age if age in {"missing", "quarantined"} else f"{age:.1f}h"
    print(f"{requested_at:%H:%M} -> {rendered}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
09:00 -> 8.0h
12:00 -> 3.5h
16:00 -> 4.0h
```
<!-- leetllm: output:end -->

> **Key insight:** Keep retrospective analytics tables separate from ML training tables. An analyst reconstructing what actually happened before `09:00` wants late event `E2` included; an ML training set wants `E2` excluded because the model did not see it at `09:00`.

## Per-entity temporal cutoffs: point-in-time joins versus table time travel

Lakehouse **time travel** queries a single historical table commit for the whole table.[^databricks2026pit][^icebergMaintenance2026] A <span data-glossary="point-in-time-join">point-in-time join</span> evaluates a *different* cutoff $t_p$ for every row.

Suppose `A-401` is scored at `09:00` and `A-402` at `09:30`. Reading one `09:30` table snapshot gets `A-402` right, yet leaks `A-401`'s `09:15` dispute spike (`12`) backward into its `09:00` training row (where the true value was `5`):

<!-- leetllm: test, output=show, id=pit-vs-snapshot -->
```python title="pit-vs-snapshot-join.py"
from datetime import datetime
import pandas as pd


def ts(value):
    return datetime.fromisoformat(value)


labels_rows = [
    {"account": "A-401", "prediction_time": ts("2026-05-01T09:00:00")},
    {"account": "A-402", "prediction_time": ts("2026-05-01T09:30:00")},
]
updates_rows = [
    {"account": "A-401", "time": ts("2026-05-01T08:50:00"), "open_dispute_count": 5},
    {"account": "A-401", "time": ts("2026-05-01T09:15:00"), "open_dispute_count": 12},
    {"account": "A-402", "time": ts("2026-05-01T09:20:00"), "open_dispute_count": 8},
]


def asof_join(labels, updates):
    rows = []
    for label in labels:
        visible = [
            update
            for update in updates
            if update["account"] == label["account"] and update["time"] <= label["prediction_time"]
        ]
        latest = max(visible, key=lambda update: update["time"]) if visible else None
        rows.append({
            "account": label["account"],
            "prediction_time": label["prediction_time"],
            "open_dispute_count": None if latest is None else latest["open_dispute_count"],
        })
    return rows


def snapshot_join(labels, updates, snapshot_time):
    latest_by_account = {}
    for update in updates:
        if update["time"] <= snapshot_time:
            previous = latest_by_account.get(update["account"])
            if previous is None or update["time"] > previous["time"]:
                latest_by_account[update["account"]] = update
    return [
        {
            "account": label["account"],
            "prediction_time": label["prediction_time"],
            "open_dispute_count": latest_by_account[label["account"]]["open_dispute_count"],
        }
        for label in labels
    ]


pit_join = asof_join(labels_rows, updates_rows)
leakage_join = snapshot_join(labels_rows, updates_rows, ts("2026-05-01T09:30:00"))

print("ASOF (PIT) JOIN:")
for row in pit_join:
    print(f'{row["account"]} {row["prediction_time"]:%H:%M} disputes={row["open_dispute_count"]}')
print("SNAPSHOT JOIN (LEAKAGE):")
for row in leakage_join:
    print(f'{row["account"]} {row["prediction_time"]:%H:%M} disputes={row["open_dispute_count"]}')

assert next(r["open_dispute_count"] for r in pit_join if r["account"] == "A-401") == 5
assert next(r["open_dispute_count"] for r in leakage_join if r["account"] == "A-401") == 12
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ASOF (PIT) JOIN:
A-401 09:00 disputes=5
A-402 09:30 disputes=8
SNAPSHOT JOIN (LEAKAGE):
A-401 09:00 disputes=12
A-402 09:30 disputes=8
```
<!-- leetllm: output:end -->

In <span data-glossary="pandas">pandas</span>, `pd.merge_asof(..., direction="backward")` vectorizes this join across sorted <span data-glossary="dataframe">DataFrames</span>:[^pandas2026mergeasof]

<!-- leetllm: test, output=show, id=pit-merge-asof -->
```python title="pandas-merge-asof-pit.py"
from datetime import datetime
import pandas as pd


def ts(value):
    return datetime.fromisoformat(value)


labels = pd.DataFrame(
    [
        {"account": "A-401", "prediction_time": ts("2026-05-01T09:00:00")},
        {"account": "A-402", "prediction_time": ts("2026-05-01T09:30:00")},
    ]
).sort_values("prediction_time")

updates = pd.DataFrame(
    [
        {"account": "A-401", "prediction_time": ts("2026-05-01T08:50:00"), "open_dispute_count": 5},
        {"account": "A-401", "prediction_time": ts("2026-05-01T09:15:00"), "open_dispute_count": 12},
        {"account": "A-402", "prediction_time": ts("2026-05-01T09:20:00"), "open_dispute_count": 8},
    ]
).sort_values("prediction_time")

pit = pd.merge_asof(
    labels,
    updates,
    by="account",
    on="prediction_time",
    direction="backward",
)

for row in pit.itertuples(index=False):
    print(f"{row.account} {row.prediction_time:%H:%M} disputes={row.open_dispute_count}")
assert int(pit.loc[pit["account"].eq("A-401"), "open_dispute_count"].iloc[0]) == 5
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A-401 09:00 disputes=5
A-402 09:30 disputes=8
```
<!-- leetllm: output:end -->

Pass `tolerance=pd.Timedelta("24h")` to bound how far backward the join looks (a <span data-glossary="ttl-deadline">TTL</span> lookback). In Feast, pair event-time joins with `filter_by_created_timestamp=True` when supported so backdated corrections do not slip into earlier training rows.[^feast2026pit]

## Dual-store architecture: offline lakehouses and low-latency online stores

Training scans months of history across millions of accounts; live fraud scoring needs one account's state in under 10 ms. A <span data-glossary="feature-store">feature store</span> separates the two storage engines behind shared feature definitions:[^feast2026online][^google2026mlops]

<figure>
  <img src="illustrations/_generated/dual_storage_reconciliation_dark.png" alt="Dual-store feature pipeline splitting a shared Kafka event stream into a streaming online updater (Redis key-value state) and an append-only offline archive (Parquet lakehouse). At the 09:00 cutoff both paths select event E1 from 01:00, compute 8.0 hours age, and verify parity in a paired audit joined by request ID." />
  <figcaption>Dual-store topology comparing real-time serving against historical point-in-time replay. Routing events through a common message bus aligns inputs, and paired request-ID checks catch write lag, serialization drift, or ordering bugs between stores.</figcaption>
</figure>

| System attribute | Offline feature store | Online feature store |
| --- | --- | --- |
| Storage engine | Iceberg or Delta over Parquet | Redis, DynamoDB, or entity-keyed store |
| Access pattern | Full-range scans and point-in-time joins | Single-key lookup by `account_id` |
| Temporal depth | Append-only revision history | Latest materialized row per entity |
| Primary workload | Training dataset construction | Low-latency inference and freshness checks |

A shared Kafka topic fans each event to both paths: a stream processor (such as Apache Flink) maintains latest state in the online store, while a lakehouse sink archives raw payloads plus arrival timestamps for offline replay.

> **Common mistake:** Never materialize a static elapsed-age float like `hours_since_last_verification = 0.03` in Redis. Store the source `event_time` timestamp instead and compute `(requested_at - event_time)` at request time so elapsed age stays accurate even when an account goes quiet for hours.

To stop out-of-order deliveries or retries from overwriting fresher online state, compare `(event_time, source_version)` monotonically and quarantine equal-key payload conflicts:

<!-- leetllm: test, output=show, continue=as-of-rows, id=online-state -->
```python title="05-protect-latest-online-state.py"
online_state = {}


def apply_latest_state(state, event):
    previous = state.get(event["account"])
    if previous is not None:
        if state_order(event) < state_order(previous):
            return "ignored stale event"
        if state_order(event) == state_order(previous):
            if previous.get("quarantined"):
                return "quarantine persists"
            if revision_value(event) == revision_value(previous):
                return "ignored duplicate revision"
            state[event["account"]] = {
                "account": event["account"],
                "event_time": event["event_time"],
                "source_version": event.get("source_version", 0),
                "ingested_at": max(event["ingested_at"], previous["ingested_at"]),
                "risk_tier": "quarantined",
                "quarantined": True,
            }
            return "quarantined conflicting revision"
    state[event["account"]] = event.copy()
    return "stored"


def online_age_hours(state, account_id, requested_at):
    current = state.get(account_id)
    if current is None:
        return "missing"
    if current["event_time"] > requested_at or current["ingested_at"] > requested_at:
        raise ValueError("current online state cannot answer this historical request")
    if current.get("quarantined"):
        return "quarantined"
    return (requested_at - current["event_time"]).total_seconds() / 3600


arrivals = [
    {
        "id": "E4",
        "account": "A-409",
        "event_time": dt("2026-05-01T10:30:00"),
        "ingested_at": dt("2026-05-01T10:31:00"),
        "source_version": 1,
        "risk_tier": "elevated",
    },
    {
        "id": "E4-correction",
        "account": "A-409",
        "event_time": dt("2026-05-01T10:30:00"),
        "ingested_at": dt("2026-05-01T10:34:00"),
        "source_version": 2,
        "risk_tier": "verified_clean",
    },
    {
        "id": "E4-v1-retry",
        "account": "A-409",
        "event_time": dt("2026-05-01T10:30:00"),
        "ingested_at": dt("2026-05-01T10:36:00"),
        "source_version": 1,
        "risk_tier": "elevated",
    },
    {
        "id": "E1-retry",
        "account": "A-409",
        "event_time": dt("2026-05-01T01:00:00"),
        "ingested_at": dt("2026-05-01T11:05:00"),
        "source_version": 1,
    },
]

cutoff = dt("2026-05-01T10:40:00")
for event in arrivals:
    if event["ingested_at"] <= cutoff:
        print(f'{event["id"]}: {apply_latest_state(online_state, event)}')
age_at_1040 = online_age_hours(online_state, "A-409", cutoff)
print(f"age at 10:40: {age_at_1040:.2f}h")
print("stored version:", online_state["A-409"]["source_version"])

# Late retry of the 01:00 event arrives after the 10:40 lookup.
print(f'{arrivals[-1]["id"]}: {apply_latest_state(online_state, arrivals[-1])}')
```

<!-- leetllm: output:start -->
```text title="Output" output compact
E4: stored
E4-correction: stored
E4-v1-retry: ignored stale event
age at 10:40: 0.17h
stored version: 2
E1-retry: ignored stale event
```
<!-- leetllm: output:end -->

Because an online key holds only current state, `online_age_hours` rejects any historical query older than its stored timestamp rather than leaking future values backward.

```checkpoint
A version-2 correction and a later retry of version 1 share the same event timestamp. Which state should stay in the online store?
---
Version 2. Comparing `(event_time, source_version)` prevents a delayed retry from reverting current state to version 1. If two deliveries match on both ordering fields yet disagree in feature payload, quarantine the entity rather than resolving ties by arrival order.
```

## Stream windowing, watermarks, and out-of-order event routing

Rolling behavioral aggregates (like hourly failed logins) partition an unbounded stream into finite windows: **tumbling** (non-overlapping fixed buckets), **sliding** (overlapping buckets advancing on a slide step), or **session** (activity bursts closed after an inactivity gap).[^flinkWindows2026]

Event-time windows rely on a **<span data-glossary="watermark">watermark</span>** to decide when a bucket is ready to emit.[^beam2026watermarks][^flinkWindows2026] Under bounded out-of-orderness, the watermark trails the highest observed event timestamp by a delay budget $\Delta_{\mathrm{delay}}$:

$$
W(t) = \max_{e \in S}(e.t_{\mathrm{event}}) - \Delta_{\mathrm{delay}}.
$$

In Apache Flink, the periodic bounded watermark generator subtracts one extra millisecond so window ends pass strictly before firing, and multi-partition operators take the minimum watermark across active shards (so an idle partition needs an idleness timeout to avoid stalling downstream emission).[^flinkBoundedWatermarks2026][^flinkWatermarks2026]

Keep **record lag** (how far behind the watermark an event is) distinct from **window allowed lateness** (how long a window keeps state past its end timestamp):[^flinkWindows2026]

<!-- leetllm: test, output=show, continue=online-state, id=lateness-rule -->
```python title="06-classify-late-events.py"
def late_event_action(event_time, watermark, max_behind):
    if max_behind < timedelta(0):
        raise ValueError("lateness budget must be nonnegative")
    if event_time >= watermark:
        return "on-time path"
    lateness = watermark - event_time
    if lateness <= max_behind:
        return "accept late update"
    return "quarantine for replay"


watermark = dt("2026-05-01T12:00:00")
max_behind = timedelta(minutes=45)

for event_time in [
    dt("2026-05-01T12:05:00"),
    dt("2026-05-01T12:00:00"),
    dt("2026-05-01T11:30:00"),
    dt("2026-05-01T11:15:00"),
    dt("2026-05-01T10:00:00"),
]:
    print(f"{event_time:%H:%M} -> {late_event_action(event_time, watermark, max_behind)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
12:05 -> on-time path
12:00 -> on-time path
11:30 -> accept late update
11:15 -> accept late update
10:00 -> quarantine for replay
```
<!-- leetllm: output:end -->

An `11:05` event can trail a `12:20` watermark by 75 minutes (exceeding a 45-minute record lag limit) even while its hourly `[11:00, 12:00)` window still retains state under a 30-minute post-closure allowance:

<!-- leetllm: test, output=show, continue=lateness-rule, id=window-budget -->
```python title="07-contrast-window-and-record-budgets.py"
window_start = dt("2026-05-01T11:00:00")
window_end = dt("2026-05-01T12:00:00")
later_watermark = dt("2026-05-01T12:20:00")
late_record = dt("2026-05-01T11:05:00")
window_allowance = timedelta(minutes=30)

window_may_update = (
    window_start <= late_record < window_end
    and later_watermark < window_end + window_allowance
)
print("record-lag rule:", late_event_action(late_record, later_watermark, max_behind))
print("window still within lateness allowance:", window_may_update)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
record-lag rule: quarantine for replay
window still within lateness allowance: True
```
<!-- leetllm: output:end -->

When a window re-emits a revised **whole-window total** (`2`, then `3`), the sink must *replace* the keyed window row on strictly higher revisions rather than adding them together (`2 + 3 = 5`):[^flinkWindows2026]

<!-- leetllm: test, output=show -->
```python title="replace-revised-window-count.py"
window_key = ("A-409", "11:00", "12:00")
results = [
    {"revision": 1, "count": 2},
    {"revision": 2, "count": 3},
    {"revision": 1, "count": 2},  # Retry of earlier output.
]
materialized = {}
for result in results:
    previous = materialized.get(window_key)
    if previous is None or result["revision"] > previous["revision"]:
        materialized[window_key] = result.copy()
    elif result["revision"] == previous["revision"] and result["count"] != previous["count"]:
        raise ValueError("conflicting count for the same window revision")
print("adding the first two totals:", sum(r["count"] for r in results[:2]))
print("materialized window count:", materialized[window_key]["count"])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
adding the first two totals: 5
materialized window count: 3
```
<!-- leetllm: output:end -->

## Idempotency, deduplication ledgers, and atomic state mutations

Cumulative counters like `open_dispute_count` cannot rely on last-write-wins: redelivering event `D1` (`+3`) doubles the count to `6` unless updates are <span data-glossary="idempotency">idempotent</span>. Recording each event ID, delta, and outcome (including rejected events so a later retry cannot unexpectedly take effect) keeps retries safe:

<!-- leetllm: test, output=show, continue=window-budget, id=idempotent-updates -->
```python title="08-deduplicate-aggregate-updates.py"
dispute_state = {"seen": {}, "open_dispute_count": 0}


def apply_dispute_update(state, event):
    if event["id"] in state["seen"]:
        old_delta, outcome = state["seen"][event["id"]]
        if old_delta != event["delta"]:
            raise ValueError("event ID reused with a different delta")
        return "duplicate skipped" if outcome == "applied" else outcome
    next_count = state["open_dispute_count"] + event["delta"]
    if next_count < 0:
        state["seen"][event["id"]] = (event["delta"], "blocked negative dispute count")
        return "blocked negative dispute count"
    state["seen"][event["id"]] = (event["delta"], "applied")
    state["open_dispute_count"] = next_count
    return "applied"


dispute_updates = [
    {"id": "D1", "delta": 3},
    {"id": "D1", "delta": 3},
    {"id": "D2", "delta": -1},
    {"id": "D3", "delta": -5},
]

for update in dispute_updates:
    result = apply_dispute_update(dispute_state, update)
    print(f'{update["id"]}: {result}; open_dispute_count={dispute_state["open_dispute_count"]}')
```

<!-- leetllm: output:start -->
```text title="Output" output compact
D1: applied; open_dispute_count=3
D1: duplicate skipped; open_dispute_count=3
D2: applied; open_dispute_count=2
D3: blocked negative dispute count; open_dispute_count=2
```
<!-- leetllm: output:end -->

In production, commit the deduplication record and counter update inside **one atomic database transaction** (with retention TTL longer than your maximum broker replay window), because Kafka transactions coordinate offsets and topics without making external Redis writes atomic.[^kafkaDeliverySemantics2026]

## Freshness SLAs, degraded mode fallbacks, and silent feature staleness

A healthy Redis lookup can still return hours-old data if an upstream connector stalls. Track **source progress** (`feature_as_of`) separately from cache write timestamps (`last_updated_at`), and branch on exact `timedelta` lag before formatting:

- **Normal (`<= 15m`):** Score with the primary streaming model.
- **Fallback (`15m < lag <= 45m`):** Switch to a validated fallback model that excludes stale streaming inputs and log degraded mode in the <span data-glossary="tracing">trace</span>.
- **Abstain (`> 45m`):** Withhold automated risk scoring and route to deterministic rules or manual review.

<!-- leetllm: test, output=show, continue=idempotent-updates, id=freshness-tiers -->
```python title="09-apply-serving-freshness-tiers.py"
def serving_mode(feature_as_of, requested_at):
    if feature_as_of is None:
        return "abstain: unknown feature freshness"
    lag = requested_at - feature_as_of
    if lag < timedelta(0):
        raise ValueError("feature update is from the future")
    if lag <= timedelta(minutes=15):
        return "normal scoring"
    if lag <= timedelta(minutes=45):
        return "fallback and log degraded mode"
    return "abstain from automated risk decision"


requested_at = dt("2026-05-01T12:00:00")
for feature_as_of in [
    dt("2026-05-01T11:52:00"),
    dt("2026-05-01T11:30:00"),
    dt("2026-05-01T10:30:00"),
]:
    print(f"{feature_as_of:%H:%M} -> {serving_mode(feature_as_of, requested_at)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
11:52 -> normal scoring
11:30 -> fallback and log degraded mode
10:30 -> abstain from automated risk decision
```
<!-- leetllm: output:end -->

Recording <span data-glossary="feature-freshness">feature freshness</span> on every inference log separates upstream pipeline lag from genuine model drift.

## Automated reconciliation pipelines and training-serving skew detection

<span data-glossary="training-serving-skew">Training-serving skew</span> arises either from **implementation skew** (SQL/Spark diverging from streaming code on nulls, edges, or timezones) or **temporal data skew** (backfills seeing late records that live inference missed). Catch both by logging served feature vectors with `request_id` and running **paired row reconciliation** against offline point-in-time replay:

<!-- leetllm: test, output=show, continue=freshness-tiers, id=parity-sample -->
```python title="10-check-offline-online-parity.py"
def mismatches(left, right):
    keys = sorted(left.keys() | right.keys())
    return {
        key: (left.get(key, "<absent>"), right.get(key, "<absent>"))
        for key in keys
        if key not in left or key not in right or left[key] != right[key]
    }


correction_offline_row = {
    "hours_since_last_verification": as_of_hours(arrivals, "A-409", dt("2026-05-01T10:40:00")),
}
correction_online_row = {
    "hours_since_last_verification": online_age_hours(
        online_state, "A-409", dt("2026-05-01T10:40:00")
    ),
}
correction_differences = mismatches(correction_offline_row, correction_online_row)
print("same-time retry mismatches:", correction_differences)

conflicting_revisions = [
    {
        "id": "E5-a",
        "account": "A-410",
        "event_time": dt("2026-05-01T10:30:00"),
        "ingested_at": dt("2026-05-01T10:31:00"),
        "source_version": 7,
        "risk_tier": "elevated",
    },
    {
        "id": "E5-b",
        "account": "A-410",
        "event_time": dt("2026-05-01T10:30:00"),
        "ingested_at": dt("2026-05-01T10:32:00"),
        "source_version": 7,
        "risk_tier": "blocked",
    },
]
conflict_online_state = {}
for event in conflicting_revisions:
    apply_latest_state(conflict_online_state, event)
conflict_offline = as_of_hours(conflicting_revisions, "A-410", dt("2026-05-01T10:40:00"))
conflict_online = online_age_hours(
    conflict_online_state, "A-410", dt("2026-05-01T10:40:00")
)
assert conflict_offline == conflict_online == "quarantined"
print("equal-order conflict parity:", conflict_offline, "==", conflict_online)

all_verifications = events + arrivals
online_state_at_1600 = {}
for event in sorted(all_verifications, key=lambda row: row["ingested_at"]):
    if event["ingested_at"] <= dt("2026-05-01T16:00:00"):
        apply_latest_state(online_state_at_1600, event)


def replay_disputes(log):
    replayed = {"seen": {}, "open_dispute_count": 0}
    for event in log:
        apply_dispute_update(replayed, event)
    return replayed["open_dispute_count"]


offline_row = {
    "hours_since_last_verification": as_of_hours(
        all_verifications, "A-409", dt("2026-05-01T16:00:00")
    ),
    "open_dispute_count": replay_disputes(dispute_updates),
}
online_row = {
    "hours_since_last_verification": online_age_hours(
        online_state_at_1600, "A-409", dt("2026-05-01T16:00:00")
    ),
    "open_dispute_count": dispute_state["open_dispute_count"],
}

print("offline row:", offline_row)
print("online row:", online_row)
print("mismatches:", mismatches(offline_row, online_row))
assert offline_row["open_dispute_count"] == 2
assert mismatches({"open_dispute_count": None}, {})
```

<!-- leetllm: output:start -->
```text title="Output" output compact
same-time retry mismatches: {}
equal-order conflict parity: quarantined == quarantined
offline row: {'hours_since_last_verification': 4.0, 'open_dispute_count': 2}
online row: {'hours_since_last_verification': 4.0, 'open_dispute_count': 2}
mismatches: {}
```
<!-- leetllm: output:end -->

Why aren't marginal distribution checks like two-sample KS enough? Swap the feature values of `A-401` and `A-402` and `ks_2samp` reports `0.000` distance (`p = 1.000`) while 100% of accounts receive the wrong value:

<!-- leetllm: test, output=show, continue=parity-sample, id=parity-swap -->
```python title="11-expose-distribution-only-parity.py"
from scipy.stats import ks_2samp

swap_offline = {"A-401": 5, "A-402": 18}
swap_online = {"A-401": 18, "A-402": 5}
ks_stat, ks_p = ks_2samp(
    np.array(list(swap_offline.values())),
    np.array(list(swap_online.values())),
)
swap_differences = mismatches(swap_offline, swap_online)
print(f"KS statistic={ks_stat:.3f}, p-value={ks_p:.3f}")
print("paired mismatches:", swap_differences)
print("wrong entities:", len(swap_differences))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
KS statistic=0.000, p-value=1.000
paired mismatches: {'A-401': (5, 18), 'A-402': (18, 5)}
wrong entities: 2
```
<!-- leetllm: output:end -->

Paired comparison also catches a stale cached float (`0.03h` vs `4.0h`) immediately before a broken feature change reaches production:

<!-- leetllm: test, output=show, continue=parity-swap, id=parity-failure -->
```python title="12-detect-stale-online-state.py"
stale_online_row = {
    "hours_since_last_verification": 0.03,
    "open_dispute_count": dispute_state["open_dispute_count"],
}
differences = mismatches(offline_row, stale_online_row)
print("mismatches:", differences)
print("parity check passed:", not differences)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mismatches: {'hours_since_last_verification': (4.0, 0.03)}
parity check passed: False
```
<!-- leetllm: output:end -->

Finally, assert all five verification cases together and emit the versioned feature summary:

<!-- leetllm: test, output=show, continue=parity-failure -->
```python title="13-inspect-replay-summary.py"
replay_summary = {
    "feature_definition": "fraud_risk_features_v1",
    "availability_rule": "event_time <= prediction_time and ingested_at <= prediction_time",
    "offline_online_ordering": "(event_time, source_version); equal-key conflicts quarantine",
    "age_rule": "store last verification timestamp; compute hours at request time",
    "aggregate_updates": "atomic ID/outcome deduplication store; lab uses in-memory dict",
    "dataset_id": "fraud-pipeline-lab-2026-05-01",
    "paired_cases": 5,
    "freshness_schedule": "risk-freshness-v1",
}

assert as_of_hours(events, "A-409", dt("2026-05-01T09:00:00")) == 8.0
assert as_of_hours(events, "A-409", dt("2026-05-01T12:00:00")) == 3.5
assert not correction_differences
assert conflict_offline == conflict_online == "quarantined"
assert not mismatches(offline_row, online_row)
assert swap_differences and differences

for key, value in replay_summary.items():
    print(f"{key}={value}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
feature_definition=fraud_risk_features_v1
availability_rule=event_time <= prediction_time and ingested_at <= prediction_time
offline_online_ordering=(event_time, source_version); equal-key conflicts quarantine
age_rule=store last verification timestamp; compute hours at request time
aggregate_updates=atomic ID/outcome deduplication store; lab uses in-memory dict
dataset_id=fraud-pipeline-lab-2026-05-01
paired_cases=5
freshness_schedule=risk-freshness-v1
```
<!-- leetllm: output:end -->

```checkpoint
Offline replay says verification age is `4.0` hours, while the captured online row says `0.03` hours for the same account and cutoff. Should the model release proceed?
---
No. The mismatch reveals that offline replay and online serving disagree on timestamp definition, ordering, or freshness logic. Resolve that parity bug before trusting offline validation metrics to predict live quality.
```

## Diagnostic guide: symptoms, root causes, and production remediation

| Observed symptom | What to check first | Fix once confirmed |
| --- | --- | --- |
| Offline AUC exceeds live AUC | Paired rows for post-cutoff arrivals vs label/population drift | Enforce availability cutoffs and rerun offline evaluation |
| Verification age stays near zero during stalls | Stored timestamp vs cached age float and clock units | Compute elapsed age at request time from stored `event_time` |
| Entity state reverts after consumer retry | Source revisions and concurrent write interleaving | Enforce monotonic `(event_time, source_version)` atomically and quarantine conflicts |
| Dispute counts double during broker blips | Event IDs, redeliveries, and sink commit boundaries | Persist deduplication IDs and outcomes atomically with counter updates |
| Live score distribution shifts during lag | Partition watermarks, freshness mode, and fallback shares | Route lagging entities to validated fallback models |
| Stream window counts diverge from batch | Window boundaries, duplicate suppression, and emission mode | Align window configs and side-output routing across both runtimes |

## Edge-case test scenarios

<details>
<summary>Four targeted boundary tests to run on your pipeline before shipping</summary>

1. **Exact lag thresholds:** Call `serving_mode` at `15:00`, `15:01`, `45:00`, and `45:01` minutes of lag, plus 1 second in the future (expect normal, fallback, fallback, abstain, and `ValueError`).
2. **Equal-key payload conflicts:** Submit conflicting `E5-a` and `E5-b` revisions in both arrival orders and assert both orders end in `"quarantined"`.
3. **Persistent rejections and ID reuse:** After `D3` (`-5`) is blocked, apply `D4` (`+10`) to reach `12`, then retry `D3` (count must stay `12`) and reuse `D1` with a new delta (must raise `ValueError`).
4. **Delayed cache publication:** Keep `E2`'s broker ingestion at `08:59` while delaying Redis publication to `09:02`; verify `feature_available_at <= prediction_time` excludes `E2` at `09:00`.

</details>

```mastery-quiz
[
  {
    "question": "At 10:00 a fraud scorer evaluates an account. Its authentication service emitted E1 at 06:48, and the feature store published it at 07:02. A second check E2 occurred at 09:50, reached the broker at 09:55, and became readable in the online store at 10:03. Which event and age belong in the captured 10:00 row?",
    "options": [
      "E2, 10 minutes old.",
      "E2, 5 minutes old.",
      "E1, 178 minutes old.",
      "E1, 192 minutes old."
    ],
    "answer": "E1, 192 minutes old.",
    "explanation": "Only E1 was readable at 10:00. Elapsed time from E1's event timestamp of 06:48 to the 10:00 request is 3 hours 12 minutes, or 192 minutes. Measuring from store publication at 07:02 would yield 178 minutes. E2 occurred 10 minutes before the request and arrived at the broker 5 minutes ahead, yet the online store published it 3 minutes too late."
  },
  {
    "question": "One event time carries version 4 with tier standard, then version 6 with tier elevated, then a later retry of version 4. A fourth record arrives claiming version 6 with tier blocked. Under (event_time, source_version) order and persistent equal-key quarantine, what states follow the third and fourth records?",
    "options": [
      "After the retry: version 4 standard; after the conflict: version 6 blocked.",
      "After the retry: version 6 elevated; after the conflict: quarantined.",
      "After the retry: version 4 standard; after the conflict: quarantined.",
      "After the retry: version 6 elevated; after the conflict: version 6 blocked."
    ],
    "answer": "After the retry: version 6 elevated; after the conflict: quarantined.",
    "explanation": "Because all records share the same event time, the highest source version wins, so retrying version 4 cannot revert version 6 elevated. The fourth record gives version 6 two conflicting tiers, elevated and blocked, so quarantining avoids letting broker delivery order break the tie."
  },
  {
    "question": "A backward pandas merge_asof joins on event time within each account using a 15-minute tolerance and no publication filter. For a 10:20 request, the latest event for that account is stamped 10:10 and was published to the store at 10:25. Does the join match that row, and could online serving read it at 10:20?",
    "options": [
      "The join matches the row. Serving could not read it.",
      "The join skips the row. Serving could not read it.",
      "The join matches the row. Serving could read it.",
      "The join skips the row. Serving could read it."
    ],
    "answer": "The join matches the row. Serving could not read it.",
    "explanation": "The 10-minute gap from 10:10 to 10:20 fits inside the 15-minute backward tolerance, and without a publication predicate merge_asof selects the row. Because the store did not publish that record until 10:25, online serving could not read it at 10:20."
  },
  {
    "question": "A 13:10 event belongs to window [13:00, 14:00). The watermark sits at 14:15, and the window retains state for 20 minutes after its end. An independent routing rule accepts records at most 40 minutes behind the watermark. Which paired result follows?",
    "options": [
      "Window state expired; record takes the accepted-late route.",
      "Window state expired; record takes the replay route.",
      "Window state retained; record takes the replay route.",
      "Window state retained; record takes the accepted-late route."
    ],
    "answer": "Window state retained; record takes the replay route.",
    "explanation": "A watermark at 14:15 is only 15 minutes past the 14:00 window end, well within its 20-minute lateness retention. However, the 13:10 event trails the 14:15 watermark by 65 minutes, exceeding the independent 40-minute routing limit."
  },
  {
    "question": "A fixed entity-window sink receives whole totals (revision 1, count 4), (revision 2, count 7), then a revision 1 retry. The sink updates only on strictly higher revisions and rejects equal-revision conflicts. What value should remain materialized?",
    "options": [
      "Count 11 at revision 2, because the first two whole totals are cumulative increments.",
      "Count 7 at revision 2, because the newer whole total replaces 4 and the stale retry is ignored.",
      "Count 4 at revision 1, because the last delivery owns the current materialized state.",
      "Count 15 at revision 2, because each delivered whole total contributes once to the final count."
    ],
    "answer": "Count 7 at revision 2, because the newer whole total replaces 4 and the stale retry is ignored.",
    "explanation": "Whole-window revisions replace earlier aggregates rather than accumulating like incremental deltas. Revision 2 replaces 4 with 7, and the stale revision 1 retry cannot revert or double-count the window."
  },
  {
    "question": "A SQLite writer uses a deduplication table of event IDs and outcomes to suppress retries. Current dispute count is 4. For a +5 event, the writer inserts the ID row inside a transaction, then exits before updating the counter or committing. After reopening, it retries and commits both writes. The broker acknowledgment drops, so the event arrives again. What sequence of dispute counts occurs?",
    "options": [
      "Reopen 4; after first retry 9; after lost-ack retry 14.",
      "Reopen 4; after first retry 4; after lost-ack retry 4.",
      "Reopen 9; after first retry 9; after lost-ack retry 9.",
      "Reopen 4; after first retry 9; after lost-ack retry 9."
    ],
    "answer": "Reopen 4; after first retry 9; after lost-ack retry 9.",
    "explanation": "On reopen, SQLite has rolled back the uncommitted ID insert and the counter stays at 4. The first retry finds no matching ID, increments the counter to 9, and commits both writes atomically. When the lost-ack retry arrives, the committed ID entry deduplicates it and leaves the count at 9."
  },
  {
    "question": "A source-ordered aggregate starts at 3. Event E1 with delta -7 is durably rejected. Event E2 with delta +8 is then applied. Next, the exact E1 payload is retried. Under persistent-outcome idempotency, what state and outcome follow?",
    "options": [
      "Count 11; E1 retains its recorded negative-count rejection.",
      "Count 4; E1 is newly applied because the later state now permits its arithmetic.",
      "Count 11; E1 becomes applied metadata while its old aggregate change remains skipped.",
      "Count 3; E2 is undone so that E1 can retain its original rejected precondition."
    ],
    "answer": "Count 11; E1 retains its recorded negative-count rejection.",
    "explanation": "E2 raises the count from 3 to 11. Retrying E1 replays its persisted rejection so redeliveries remain idempotent rather than unexpectedly taking effect after unrelated updates; fixing a prior rejection requires an explicit correction event or replay."
  },
  {
    "question": "At 14:00, a feature row was touched at 13:59 yet covers source progress only through 13:44:50. A second row reports source progress of 14:00:20. Under an exact-duration freshness rule allowing normal scoring through 15 minutes, degraded fallback through 45 minutes, and flagging future progress as invalid, how should both rows be classified?",
    "options": [
      "First normal using the recent write; second normal after truncating its future 20 seconds toward zero.",
      "First normal using the recent write; second invalid because its source progress is in the future.",
      "First degraded at 15 minutes 10 seconds; second invalid because its source progress is in the future.",
      "First degraded at 15 minutes 10 seconds; second normal after truncating its future 20 seconds toward zero."
    ],
    "answer": "First degraded at 15 minutes 10 seconds; second invalid because its source progress is in the future.",
    "explanation": "Freshness measures source progress (`feature_as_of`), not the latest no-op write time. From 13:44:50 to 14:00 is 15 minutes 10 seconds, crossing the 15-minute normal cutoff into degraded mode, while future timestamps must trigger clock-error rejection before rounding."
  },
  {
    "question": "Offline replay values for accounts A, B, and C are 4, 9, and 12; captured online serving values at matching cutoffs are 9, 4, and 12. A marginal empirical-distribution comparison reports no difference. Which conclusion holds?",
    "options": [
      "One paired mismatch exists, and the equal marginals certify the other two serving rows.",
      "No paired mismatches exist, because the same multiset defines the feature values completely.",
      "Three paired mismatches exist, because any wrong-key swap invalidates every row's numeric value.",
      "Two paired mismatches exist; the preserved multiset discarded the request-to-value pairing."
    ],
    "answer": "Two paired mismatches exist; the preserved multiset discarded the request-to-value pairing.",
    "explanation": "Accounts A and B are swapped while C matches. Because both samples form the identical multiset [4, 9, 12], marginal statistics like KS distance discard per-entity alignment and fail to detect the two swapped rows."
  },
  {
    "question": "A type-aware reconciliation check compares integer flags strictly and finite float estimates with absolute tolerance 0.001. Paired replay and serving values are flag `0` vs. `False` and estimate `0.5000` vs. `0.5008`. What should the check report?",
    "options": [
      "Flag mismatch; float estimate passes the declared tolerance.",
      "Flag passes Python equality; float estimate fails because its bits differ.",
      "Both pass because booleans can be numerically compared with integers.",
      "Both fail because a paired replay must use byte equality for every field."
    ],
    "answer": "Flag mismatch; float estimate passes the declared tolerance.",
    "explanation": "Boolean `False` violates the integer schema requirement even though Python evaluates `False == 0` as True. Meanwhile, the finite floating-point difference `0.0008` sits below the `0.001` tolerance."
  }
]
```

> **Next:** Continue to [Gradient Boosted Trees in Production](/learn/gradient-boosted-trees-production). Honest point-in-time rows now align offline replay with live scoring inputs; next you'll train boosted trees on historical tabular features and evaluate whether calibration and slice performance support deployment.
