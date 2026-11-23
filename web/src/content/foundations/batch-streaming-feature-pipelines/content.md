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

In [feature engineering](/learn/feature-engineering-production-ml), we saw why training rows must capture only signals that were observable when the prediction was made. Now follow an online fraud and risk model scoring account `A-409` at `09:00 UTC` on May 1, 2026. One predictive feature measures how many hours have elapsed since the account's most recent verified security check. During a network partition, verification event `E2` happens at `08:30 UTC` but does not reach the broker until `11:00 UTC`. Tomorrow, a historical lakehouse query reads the `08:30` event and computes a feature age of `0.5` hours, whereas at `09:00` the live scoring service saw only the `01:00` check (`E1`) and computed `8.0` hours.

Which feature value belongs in the labeled training example for that `09:00` score? Train on the `8.0`-hour value that live inference actually received. Tomorrow's retrospective visibility changes what an analyst knows later, not what the production model saw when it acted. The mismatch between `0.5` and `8.0` signals an arrival delay, yet neither age by itself shows whether the account is fraudulent or whether packet delivery failed downstream. Feeding `0.5` hours into offline training leaks future knowledge into the classifier and makes offline validation metrics look artificially strong.

**Batch processing** operates over bounded slices of history, such as daily partitions archived in object storage. **Streaming processing** updates materialized state continuously as records arrive from an unbounded log. Both architectures experience latency shaped by input skew, batch intervals, and broker throughput, and a faithful **historical replay** depends on keeping raw event logs, publication timestamps, transformation versions, and routing rules intact so training data mirrors what online serving could read at every cutoff.

## Dual-clock time semantics: event time versus ingestion time

Reproducing an inference vector accurately requires distinguishing when an event occurred from when the pipeline received it and when the model scored the entity. These three clocks govern historical replay and live serving alike:

| Field | Example | Meaning |
| --- | --- | --- |
| `event_time` | May 1, 08:30 UTC | When the source service generated the verification event |
| `ingested_at` | May 1, 11:00 UTC | When the message broker or lakehouse sink registered the record |
| `prediction_time` | May 1, 09:00 UTC | When the scoring service evaluated features for account `A-409` |

Event `E2` carries an <span data-glossary="event-time">event time</span> 30 minutes ahead of the `09:00` decision, yet its two-hour transport delay keeps it invisible until `11:00`. Reading raw storage tomorrow without checking broker arrival time pulls `E2` into the past, creating target leakage during training. **Throughout this first simulation, assume an accepted record becomes readable immediately at `ingested_at`.** Under that assumption, eligibility for cutoff $t_p$ requires both timestamps to satisfy:

$$
t_{\mathrm{event}} \le t_p \quad\text{and}\quad t_{\mathrm{ingested}} \le t_p
$$

Here $t_{\mathrm{event}}$ is the source timestamp, $t_{\mathrm{ingested}}$ is pipeline arrival time, and $t_p$ is the <span data-glossary="prediction-timestamp">prediction timestamp</span>. Filtering by $t_{\mathrm{event}} \le t_p$ prevents future-dated clocks from polluting history, while $t_{\mathrm{ingested}} \le t_p$ excludes delayed deliveries that were still in transit at inference time. Both predicates remain preconditions rather than guarantees of visibility, because downstream windowed aggregates or quarantine filters can still hold an ingested event out of online state.

Event and ingestion clocks still leave open the exact moment a computed value enters the low-latency serving table. When a broker receives a message at `08:58` and the stream processor finishes writing to Redis at `09:02`, a `09:00` inference call cannot observe that update. Reproducing that distinction in historical backfill requires either recording an explicit **feature availability timestamp** ($t_{\mathrm{available}} \le t_p$) or logging published feature snapshots directly. Notice also that including equality ($\le$) covers exact-second matches, so coarse timestamps in real workloads need deterministic sequence keys or version counters to break ties cleanly.

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

The opening script defines three verification events for account `A-409`: on-time event `E1`, delayed event `E2`, and later afternoon event `E3`. Numbered code blocks below execute sequentially inside one stateful Python session so shared helper functions remain in memory. All naive timestamps are normalized to UTC using Python's `datetime` timezone utilities, and NumPy computes ingestion lag in minutes.[^python_datetime]

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

Filtering strictly by event time accepts both `E1` and `E2`. Running that naive filter first makes the resulting temporal leakage explicit so we can compare it directly against faithful serving behavior. Notice how easily a clean-looking SQL query over `event_time` introduces this `0.5`-hour distortion without raising any runtime error.

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

Adding the arrival check `ingested_at <= prediction_time` drops `E2` immediately. Only `E1` remains visible to the `09:00` request, restoring the exact `8.0`-hour age observed online. Reconstructing that cut reliably requires persisting broker arrival times alongside source timestamps for every ingested event.

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

Across multiple inference timestamps, the historical training table evaluates the most recent visible verification timestamp at each decision cutoff separately. Storing the underlying verification timestamp rather than caching a static age lets serving compute exact elapsed hours (`09:00 -> 8.0h`, `12:00 -> 3.5h`, `16:00 -> 4.0h`) without updating the store every minute. Each cutoff reuses the exact same visibility filter while updating the elapsed duration relative to the request clock.

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

Ordering by `(event_time, source_version)` ranks timestamp freshness first and breaks same-timestamp revisions monotonically. When multiple records share the exact same `(event_time, source_version)` key with conflicting `risk_tier` values, the lookup quarantines the result instead of letting ingestion timing break the tie arbitrarily. Production feature pipelines extend that conflict detector across all materialized columns or a canonical hash of the payload.

Keep compliance audits separate from ML training tables. An operational audit asking which events actually transpired before `09:00` deliberately incorporates late arrivals such as `E2`, whereas a decision-time model training dataset must omit `E2` because live inference never received it. Even forensic audits still trust source clocks and upstream event payloads unless external telemetry verifies them.

## Per-entity temporal cutoffs: point-in-time joins versus table time travel

Enforcing two-clock filters still leaks future information if a batch pipeline joins all labeled rows against a single global table snapshot. Lakehouse **time travel** restores a historical table commit at a chosen batch snapshot timestamp, which measures storage commit time rather than per-example prediction cutoffs.[^databricks2026pit][^icebergMaintenance2026] A <span data-glossary="point-in-time-join">point-in-time join</span> evaluates a different cutoff $t_p$ for every row in the label table. Retaining historical commits allows storage engines to keep older versions, yet reading one shared snapshot does not isolate per-row event horizons.

In fraud scoring, every training label carries its own prediction timestamp $t_p$, even though chargeback confirmation arrives weeks later. Account `A-401` might be evaluated at `09:00` while account `A-402` is evaluated at `09:30`. A point-in-time join matches each row independently against the latest feature update at or before its own $t_p$. Pulling each account's latest value from a single `09:30` table snapshot gets `A-402` right while accidentally giving `A-401` its `09:15` dispute update, leaking fifteen minutes of future state into `A-401`.

To isolate per-row timestamp cutoffs from arrival delays, the comparison below lets feature updates become readable immediately at `time` and runs an as-of lookup alongside a global `09:30` snapshot lookup.

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

In production tabular pipelines, <span data-glossary="pandas">pandas</span> vectorizes this lookup through `pd.merge_asof`. Both <span data-glossary="dataframe">DataFrames</span> must be sorted globally on the join timestamp before matching within each entity key (`by="account"`). With `direction="backward"`, exact timestamp matches stay eligible and `A-401` correctly retrieves `5` instead of the leaky snapshot value `12`.[^pandas2026mergeasof]

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

An unbounded backward search creates another subtlety when an inactive account receives no events for months. Specifying `tolerance=pd.Timedelta("24h")` caps how far backward `merge_asof` may scan while still leaving arrival-time filtering to a separate availability predicate.[^pandas2026mergeasof] Feature platforms frequently express that maximum scan window as a <span data-glossary="ttl-deadline">time-to-live (TTL)</span> lookback alongside storage retention. Keep those concepts distinct: dropping expired rows physically deletes history, whereas capping a feature join's lookback changes how silence is represented (for example, turning a multi-day quiet spell into a null rather than an explicit elapsed age).

In Feast, the default offline join constrains event time relative to each entity row timestamp, which can still pull in backdated corrections created later. Passing `filter_by_created_timestamp=True` enables an additional creation-time constraint on supported offline stores, requiring non-null creation timestamps that faithfully record when serving actually saw each row rather than an arbitrary warehouse load time.[^feast2026pit] Even with an exact point-in-time join for batch training, live scoring needs sub-10ms reads for a single account rather than multi-terabyte scans, raising the question of how to serve fast lookups while keeping feature semantics identical.

## Dual-store architecture: offline lakehouses and low-latency online stores

Serving and training impose opposite access requirements, so production teams separate storage engines while preserving shared feature logic. Model training scans months of aligned history across millions of entities, whereas real-time fraud scoring needs one account's latest state within a tight latency SLA. Offline-only batch scoring pipelines can read columnar tables directly without standing up an online store at all.

<figure>
  <img src="illustrations/_generated/dual_storage_reconciliation_dark.png" alt="Dual-store feature pipeline splitting a shared Kafka event stream into a streaming online updater (Redis key-value state) and an append-only offline archive (Parquet lakehouse). At the 09:00 cutoff both paths select event E1 from 01:00, compute 8.0 hours age, and verify parity in a paired audit joined by request ID." />
  <figcaption>Dual-store topology comparing real-time serving against historical point-in-time replay. Routing events through a common message bus aligns inputs, yet paired audits logged by request ID remain essential to catch write lag, serialization drift, or ordering bugs between stores.</figcaption>
</figure>

| System attribute | Offline feature store | Online feature store |
| --- | --- | --- |
| Example technology | Iceberg or Delta tables over columnar Parquet files | Redis, DynamoDB, or another entity-keyed store |
| Access pattern | Historical full-range scans and temporal joins | Single-key lookups by entity ID (`account_id`) |
| Latency and throughput focus | Batch scan cost and backfill build time | Tail lookup latency (p99) and serving availability |
| Temporal depth | Full append-only revision history across retention windows | Latest materialized feature row per entity key |
| Core ML workload | Per-row point-in-time training dataset construction | Live inference lookup and freshness inspection |

A shared event backbone such as Apache Kafka fans out each incoming record to two independent consumers, letting low-latency inference and full historical replay evolve without blocking one another:

1. **Streaming path**: An incremental engine such as Apache Flink consumes incoming verification events, maintains stateful windows or latest-state aggregators, and upserts the current feature values into the online store.
2. **Batch archive path**: A lakehouse sink preserves raw event payloads alongside ingestion and availability metadata in append-only tables so offline jobs can replay exact historical cutoffs later.

Feast's online store explicitly tracks only the latest value per entity key to guarantee constant-time point lookups rather than scanning historical arrays at request time.[^feast2026online] Google Cloud's MLOps reference architecture likewise defines a <span data-glossary="feature-store">feature store</span> as a central metadata and storage layer uniting batch training generation with low-latency inference retrieval under canonical definitions.[^google2026mlops] Keeping both stores synchronized begins with deciding which timestamp values get persisted in the low-latency table.

Because inference timestamps advance continuously even when no account event arrives, store the source `event_time` of the latest verification event instead of materializing a static elapsed-hour float. If a stream consumer writes `hours_since_last_verification = 0.03` at `01:02` and no check follows, a `09:00` prediction must compute `8.0` hours dynamically from the stored timestamp. Precomputed elapsed ages require scheduled periodic refreshes whose staleness interval must be accounted for in downstream model calibration.

Out-of-order deliveries and retries can also overwrite fresher online values unless writes follow a strict monotonic rule. Ordering updates by `(event_time, source_version)` lets a version `2` correction overwrite version `1` at the same `event_time`, while preventing a delayed retry of version `1` from regressing current state backward. Notice that distributed writers in production require atomic compare-and-set updates plus clock sanity checks so a misconfigured client stamp far in the future cannot lock out legitimate state updates.

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

An online key storing only current state cannot answer arbitrary historical requests once later records arrive. Logging the served feature vector at prediction time gives you an exact audit record, while `online_age_hours` explicitly raises an error if asked to backfill a cutoff older than the stored state rather than returning a negative age or leaking future values backward. Keeping that check strict catches inadvertent offline queries routed to online key-value tables during evaluation.

```checkpoint
A version-2 correction and a later retry of version 1 share the same event timestamp. Which state should stay in the online store?
---
Version 2. Comparing `(event_time, source_version)` prevents a delayed retry from reverting current state to version 1. If two deliveries match on both ordering fields yet disagree in feature payload, quarantine the entity rather than resolving ties by arrival order.
```

## Stream windowing, watermarks, and out-of-order event routing

Aggregated behavioral features such as hourly authentication failures or rolling dispute rates require partitioning an unbounded event stream into finite intervals. Without fixed buckets, running counts grow forever and cannot be joined cleanly to decision cutoffs. Stream engines define three canonical window shapes to group arriving records consistently:[^flinkWindows2026]

1. **Tumbling windows**: Fixed-width, non-overlapping buckets such as `[08:00, 09:00)` and `[09:00, 10:00)`. Every event maps cleanly to a single hourly bucket.
2. **Sliding windows**: Fixed-width buckets advancing by a smaller slide step, such as a 60-minute count recomputed every 5 minutes, so a single event can contribute to twelve consecutive windows.
3. **Session windows**: Variable-length bursts grouped by activity gaps, closing only once an account stays quiet past an inactivity threshold such as 30 minutes.

Clock semantics dictate when those buckets close and emit. Processing-time windows slice events by machine arrival clock, which distorts features during consumer restarts or network bursts. Event-time windows group records by source timestamps and rely on a **<span data-glossary="watermark">watermark</span>** to track input completeness, recognizing that a watermark estimates stream progress rather than guaranteeing zero stragglers will arrive later.[^beam2026watermarks][^flinkWindows2026]

Under bounded out-of-orderness progress tracking, the watermark trails the highest observed source timestamp by a fixed delay parameter $\Delta_{\mathrm{delay}}$:

$$
W(t) = \max_{e \in S}(e.t_{\mathrm{event}}) - \Delta_{\mathrm{delay}}
$$

Here $\Delta_{\mathrm{delay}}$ is an operational latency budget tuned against observed network jitter, not a physical invariant. Engine details matter when reproducing behavior exactly: Apache Flink's periodic bounded-out-of-orderness watermark generator subtracts one extra millisecond beyond this expression so window ends are strictly passed before firing.[^flinkBoundedWatermarks2026] Downstream operators receiving multiple partitions advance using the minimum watermark across all active inputs, meaning one idle shard stalls emission unless partition idleness timeouts are enabled (which in turn risks marking resumed shard records as late).[^flinkWatermarks2026]

**Allowed lateness is anchored to each window's end timestamp.** When Flink's default event-time trigger detects the watermark crossing window end, it fires the initial window calculation; keeping a nonzero allowed-lateness horizon retains window state in memory so subsequent late updates can trigger revised outputs or be routed to a side output for batch reconciliation.[^flinkWindows2026]

In practice, streaming pipelines separate record-level routing lag from per-window state expiration. The next function routes individual arriving events cleanly across three streams: timestamps ahead of the watermark take the on-time path, events within a 45-minute lag budget trigger incremental late updates, and older events go to a replay queue. Separating record lag from bucket expiration clarifies which late arrivals still patch active online windows.

<!-- leetllm: test, output=show, continue=online-state, id=lateness-policy -->
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

Contrast that record-lag policy with window-retention policy. Consider an `11:05` verification event belonging to the hourly window `[11:00, 12:00)` when the watermark sits at `12:20` and the window holds state for `30` minutes past closure. Even though the `11:05` event trails the watermark by 75 minutes (triggering the 45-minute quarantine route above), the `[11:00, 12:00)` bucket itself remains active until `12:30`. Keep those two budgets cleanly aligned or downstream consumers will fail to reconcile updates across windows.

<!-- leetllm: test, output=show, continue=lateness-policy, id=window-budget -->
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

When a window fires a revised aggregate after a late arrival, downstream sinks must treat emission units carefully.[^flinkWindows2026] If window `[11:00, 12:00)` first emits a whole-window total of `2` and later emits a revised total of `3`, adding those messages produces `5` instead of `3`. Keying the materialized sink by `(account, window_start, window_end)` and overwriting only when `revision` strictly increases replaces `2` with `3` while ignoring stale retries; incremental `+1` deltas follow a completely different additive convention that cannot be mixed with full-window totals, and merging session windows additionally requires retracting retired window keys before writing replacements.

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

Logging late routing and window revision metadata ensures offline backfill matches online behavior. When streaming routes a late event to replay while batch blindly includes it inside historical scans, offline metrics silently diverge from online feature quality even though every timestamp passes the primary filter.

## Idempotency, deduplication ledgers, and atomic state mutations

Replacing latest-value rows handles overwrites, whereas cumulative aggregates such as active open disputes require <span data-glossary="idempotency">idempotency</span> so broker redeliveries never double-count. Without deduplication, replaying message `D1` with delta `+3` increments `open_dispute_count` to `6` instead of `3`. Here we apply source-ordered dispute deltas per account while preserving rejected states across duplicate retries; if deltas arrive out of order across partitions, buffer or version-order them before validating invariants like nonnegativity.

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

An in-memory dictionary demonstrates retry semantics without crash durability. Production consumers commit the deduplication entry, payload fingerprint, outcome status, and updated counter inside one atomic database transaction or compare-and-set operation, otherwise a worker crash between updating the aggregate and recording the ID leaves room for lost or duplicated updates on restart. Retaining rejected outcomes prevents a subsequent retry of `D3` from unexpectedly succeeding once later positive additions raise the total. Set ledger retention TTLs longer than your maximum broker redelivery and replay horizon, because Kafka transactional commits coordinate Kafka offsets and topics without making external Redis writes atomic on their own.[^kafkaDeliverySemantics2026]

## Freshness SLAs, degraded mode fallbacks, and silent feature staleness

An idempotent consumer can still feed a model hours-old state if an upstream connector stalls silently while the online key stays readable. Retrieval latency measures cache health rather than data freshness, so inference services track **source progress** (`feature_as_of`) separately from database write timestamps (`last_updated_at`). Overwriting an unchanged row with a periodic no-op refresh updates `last_updated_at` even when upstream partitions stopped advancing.

Using an explicit lag schedule keeps degraded behavior predictable and auditable across traffic spikes and upstream slowdowns:

- **Normal scoring**: lag at most 15 minutes. Serve predictions from the primary model.
- **Degraded fallback**: lag strictly above 15 minutes and at most 45 minutes. Log degraded mode and invoke a validated fallback model that excludes stale streaming inputs.
- **Abstention**: lag above 45 minutes. Withhold automated risk scoring and escalate to deterministic rules or human review.

Always evaluate exact `timedelta` comparisons prior to human-readable formatting, because truncating `15m 30s` down to `15m` silently classifies stale state as normal and masking negative future timestamps hides upstream clock drift. Recording <span data-glossary="feature-freshness">freshness lag</span> in every inference <span data-glossary="tracing">trace</span> separates degraded inputs from true model drift during post-incident analysis. Notice too that a fallback model cannot recover signal if it reads from the same stalled broker topic.

<!-- leetllm: test, output=show, continue=idempotent-updates, id=freshness-policy -->
```python title="09-apply-serving-freshness-policy.py"
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

## Automated reconciliation pipelines and training-serving skew detection

Running separate offline and online engines works cleanly as long as both compute identical feature values for identical inputs. Computing a 7-day rolling mean offline while reading a 1-hour counter online under the same column name creates <span data-glossary="training-serving-skew">training-serving skew</span>, invalidating offline validation metrics before deployment. Detecting that drift automatically requires logging live inference inputs and comparing them against point-in-time batch replay.

Two distinct failure modes cause most production skew, spanning both code semantics and arrival timing:

1. **Implementation skew**: SQL or Spark batch jobs diverge from streaming Java/Python logic in null handling, edge inclusion rules, timezone truncation, or floating-point rounding.
2. **Temporal data skew**: Offline backfills see late arrivals or corrected records that were not yet present when online inference scored the live request.

Three practices keep offline and online paths synchronized:

- **Versioned canonical definitions**: Publish shared transformation specs covering window spans, units, tie-breaking order, and null semantics, verifying engine equivalence through cross-runtime tests.
- **Serving vector logging**: Persist the live feature vector alongside `request_id`, `prediction_time`, feature version, and freshness lag as an immutable log distinct from shadow inference runs.
- **Paired row reconciliation**: Recompute features for sampled logged requests using offline replay and compare field-by-field on `(request_id, prediction_time)`. Marginal distribution checks such as Population Stability Index (PSI) or two-sample Kolmogorov-Smirnov (KS) tests monitor aggregate drift, yet they cannot verify row-level parity.

When comparing paired records, enforce exact type and equality checks for categoricals and booleans (`False == 0` is true in Python value comparisons even though boolean vs. integer schemas differ) and distinguish missing keys from explicit nulls, reserving numeric tolerances strictly for finite floating-point calculations.

<!-- leetllm: test, output=show, continue=freshness-policy, id=parity-sample -->
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

Replaying dispute updates from an empty ledger confirms that batch backfill reproduces the online count `2` deterministically without peeking at live store state. While sharing helper logic reduces implementation skew, parity tests alone cannot reveal an arithmetic bug shared identically across both engines, which is why asserting known expected outputs alongside parity checks matters.

To see why marginal checks are insufficient on their own, swap the dispute counts between accounts `A-401` and `A-402` while running SciPy's two-sample Kolmogorov-Smirnov test alongside a paired entity comparison. Notice how aggregate distribution summaries can report perfect agreement even when individual accounts receive inverted features.

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

Both samples produce the exact same empirical distribution (`[5, 18]`), so `ks_2samp` yields a test statistic of `0.000` even though every account received the wrong number. Joining rows by `request_id` or entity key catches the permutation immediately. That distinction explains why paired row checks act as a release gate whereas distribution tests serve mainly as coarse monitoring.

Simulating a stale precomputed age (`0.03` hours written at `01:02` instead of request-time age `4.0`) triggers an explicit parity failure that blocks deployment. Comparing field-by-field values flags the cached float immediately so broken updates never slip into model promotion.

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

The final summary records our verified invariants across three matching cases and two deliberate failure modes. In production CI and continuous monitoring, attach comparable metadata to versioned dataset manifests, retained raw logs, and captured serving vectors before promoting a feature change.

<!-- leetllm: test, output=show, continue=parity-failure -->
```python title="13-inspect-replay-summary.py"
replay_summary = {
    "feature_definition": "fraud_risk_features_v1",
    "availability_rule": "event_time <= prediction_time and ingested_at <= prediction_time",
    "offline_online_ordering": "(event_time, source_version); equal-key conflicts quarantine",
    "age_rule": "store last verification timestamp; compute hours at request time",
    "aggregate_updates": "require atomic ID/outcome ledger; demo uses in-memory state",
    "dataset_id": "fraud-pipeline-lab-2026-05-01",
    "paired_cases": 5,
    "freshness_policy": "risk-freshness-v1",
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
aggregate_updates=require atomic ID/outcome ledger; demo uses in-memory state
dataset_id=fraud-pipeline-lab-2026-05-01
paired_cases=5
freshness_policy=risk-freshness-v1
```
<!-- leetllm: output:end -->

```checkpoint
Offline replay says verification age is `4.0` hours, while the captured online row says `0.03` hours for the same account and cutoff. Should the model release proceed?
---
No. The mismatch reveals that offline replay and online serving disagree on timestamp definition, ordering, or freshness logic. Resolve that parity bug before trusting offline validation metrics to predict live quality.
```

## Diagnostic guide: symptoms, root causes, and production remediation

When paired replay and serving logs diverge, isolate the broken clock, join key, or state transition before tuning model hyperparameters.

| Observed symptom | Check before assigning a cause | Response if confirmed |
| --- | --- | --- |
| Offline AUC exceeds live production AUC | Inspect paired rows for post-cutoff arrivals alongside label or population drift | Enforce availability cutoffs and rerun offline evaluation |
| Verification age stays near zero while events stall | Compare stored source timestamp, cached age float, and request clock units | Compute elapsed age at request time from the stored verification timestamp |
| Entity state reverts after consumer retry | Inspect source revisions and concurrent write interleaving | Enforce monotonic `(event_time, source_version)` ordering atomically and quarantine conflicts |
| Dispute counts double during broker blips | Trace event IDs, redeliveries, and sink offset commits | Persist idempotent ledger entries atomically alongside counter updates |
| Live score distribution shifts during stream lag | Audit partition watermarks, mode selection, and fallback triggers | Route lagging entities via validated lag policy and monitor fallback shares |
| Stream window counts diverge from batch | Compare window assignment, duplicate suppression, triggers, and publication cutoffs | Align window configuration and side-output routing across both runtimes |

## Edge-case test scenarios

Before declaring a pipeline production-ready, vary one condition at a time and assert both return values and side-effect state:

1. **Exact lag thresholds**: Call `serving_mode` at `15:00`, `15:01`, `45:00`, and `45:01` minutes of lag, plus a timestamp one second ahead of `requested_at`. Expect normal scoring at `15:00`, fallback from `15:01` through `45:00`, abstention at `45:01`, and a `ValueError` for future progress.
2. **Equal-key payload conflicts**: Submit conflicting `E5-a` and `E5-b` revisions in both arrival orders. Neither ordering may pick a silent winner; both orders must lock the account in `"quarantined"` status.
3. **Persistent rejections and ID reuse**: After `D3` (`-5`) is blocked, apply `D4` (`+10`) so total disputes reach `12`, then retry `D3` and also reuse `D1` with a different delta. Total disputes must remain `12` on the `D3` retry, and mutating `D1`'s delta must raise `ValueError`.
4. **Delayed cache publication**: Keep `E2`'s broker ingestion at `08:59` while delaying Redis publication until `09:02`. The `09:00` request still cannot see `E2`, requiring an explicit `feature_available_at <= prediction_time` predicate (or snapshot capture replay) because raw broker arrival time misses store write lag.

Holding these invariants steady across offline joins and online lookups ensures that model improvements translate directly into live scoring gains rather than disappearing into silent training-serving skew.

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
    "question": "A SQLite writer uses a ledger of event IDs and outcomes to suppress retries. Current dispute count is 4. For a +5 event, the writer inserts the ledger entry inside a transaction, then exits before updating the counter or committing. After reopening, it retries and commits both writes. The broker acknowledgment drops, so the event arrives again. What sequence of dispute counts occurs?",
    "options": [
      "Reopen 4; after first retry 9; after lost-ack retry 14.",
      "Reopen 4; after first retry 4; after lost-ack retry 4.",
      "Reopen 9; after first retry 9; after lost-ack retry 9.",
      "Reopen 4; after first retry 9; after lost-ack retry 9."
    ],
    "answer": "Reopen 4; after first retry 9; after lost-ack retry 9.",
    "explanation": "On reopen, SQLite has rolled back the uncommitted ledger insert and the counter stays at 4. The first retry finds no ledger entry, increments the counter to 9, and commits both writes atomically. When the lost-ack retry arrives, the committed ledger entry deduplicates it and leaves the count at 9."
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
    "question": "At 14:00, a feature row was touched at 13:59 yet covers source progress only through 13:44:50. A second row reports source progress of 14:00:20. Under an exact-duration policy allowing normal scoring through 15 minutes, degraded fallback through 45 minutes, and flagging future progress as invalid, how should both rows be classified?",
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
