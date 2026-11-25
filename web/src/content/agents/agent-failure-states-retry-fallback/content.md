---
{
  "id": "agent-failure-states-retry-fallback",
  "slug": "agent-failure-states-retry-fallback",
  "title": "Agent Reliability, Recovery & Human Approval",
  "shortDescription": "Build reliable agents with risk-tiered human interrupts, durable checkpoint-and-resume, atomic idempotency keys, deadline-aware backoff, generation-scoped circuit breakers, and honest fallbacks.",
  "difficulty": "Hard",
  "category": "LLM Agents & Tool Use",
  "section": "Advanced Agents & Retrieval",
  "coverImage": "illustrations/_generated/timeout_recovery_fork_dark.png",
  "companies": [
    "Anthropic",
    "OpenAI",
    "Google",
    "Microsoft",
    "Shopify",
    "Notion"
  ],
  "prerequisites": [
    "agentic-architectures-react-plan-execute",
    "function-calling-tool-use-llms",
    "agent-memory-persistence-patterns"
  ],
  "relatedQuestions": [
    "multi-agent-dags-langgraph-orchestration",
    "agent-memory-persistence-patterns",
    "prompt-injection-defense-strategies"
  ],
  "order": 10,
  "keyConceptsTested": [
    "Risk-Tiered Human-in-the-Loop Interrupts",
    "Durable Checkpoint-and-Resume & Outbox Commits",
    "Failure Stage Classification",
    "Atomic Operation Keys & Ambiguous Commits",
    "Deadline-Aware Backoff & Full Jitter",
    "Progress Detection & Cumulative Spend Budgets",
    "Generation-Scoped Circuit Breakers",
    "Freshness-Checked Fallbacks & Saga Compensation"
  ],
  "aliases": [
    "human-in-the-loop-agent-architecture"
  ]
}
---

<!-- leetllm: edition:reference:start -->

A release agent asks a deployment controller to revert `deploy-412` to `rev-17`. The controller writes `job-1` to disk and transmits a confirmation, then the TCP link drops before that packet arrives. From the caller's side, all that arrives is a silent timeout.

Treating that timeout as proof that nothing ran queues a duplicate revert on top of `job-1`, while reporting success misleads operators when work is at most queued. Reliable runtimes preserve uncertainty until host code inspects live remote state, gate high-impact writes behind durable human approvals, and bound retries and failovers deterministically.

## Gate actions by blast radius and undo cost

Treat every model <span data-glossary="tool-calling">tool call</span> as an untrusted proposal: JSON schema validation checks syntax only, never caller authorization or whether a read-only question (*"What happened to deploy-412?"*) permits a production write.[^openai2023ReproducibleOutputs][^owaspExcessiveAgency2025] Sort tool calls in host code outside the prompt along **blast radius** and **undo cost**:

| Risk tier | Action class | Examples | Runtime behavior |
|---|---|---|---|
| **Read-only (`auto`)** | Zero mutation | `get_deploy`, `git_diff`, `read_logs` | Validate scope and run automatically |
| **Reversible write (`single_review`)** | Live impact, fast rollback | Canary shift (`<=25%`), feature flag, revert | Checkpoint and pause for one reviewer |
| **Irreversible / wide (`dual_review` or `deny`)** | Data loss or wide blast | `drop_table`, root key rotation, >25% jump | Require dual sign-off with short expiry, or deny |

## Pause and resume durably with human-in-the-loop checkpoints

Human review runs on minutes or hours, so holding an open coroutine in RAM fails on the first pod restart. Durable <span data-glossary="human-in-the-loop">human-in-the-loop</span> workflows follow four persistent phases:

1. **Checkpoint and pause:** Persist thread state, a canonical SHA-256 payload digest (RFC 8785 JCS key sorting), expected target revision, stable operation key, and expiry timestamp, then exit the worker cleanly.[^rfc8785Jcs2020]
2. **Scoped decision:** An authenticated reviewer (`reviewer != requester`) rejects, edits into a new version/digest, or approves the exact pending version and digest while viewing host-verified parameter diffs separated from untrusted model summaries or ticket text.[^turpin2023]
3. **Atomic decision and outbox commit:** Inside one `BEGIN IMMEDIATE` transaction, conditionally update `status = 'pending' -> 'authorized'` (`WHERE version = ? AND digest = ? AND expires_at > ?`) and insert an `outbox` resume token so crashes never orphan approvals and concurrent clicks hit a conflict.[^sqliteTransactions2026]
4. **Idempotent resume and live check:** On resume, verify the token, digest, expiry, and live target revision (compare-and-swap) before dispatching the side effect.[^rfc9110ConditionalRequests2022]

In <span data-glossary="langgraph">LangGraph</span>, a SQLite or PostgreSQL checkpointer saves state before `interrupt()` frees the worker and `Command(resume=...)` reloads it.[^langgraph2024][^langgraph2026persistence][^langgraph2026checkpointers] In Temporal, `workflow.wait_condition(...)` pauses durably while `@workflow.update` validates approvals before mutating history.[^temporal2024][^temporal2026workflow]

> **Common mistake:** Placing a mutating API call in a LangGraph node *before* `interrupt()`. On resume, LangGraph replays that node from line 1 and fires the write twice. Isolate side effects in a dedicated post-approval node backed by an idempotency key.

<!-- leetllm: test, output=show -->
```python title="risk-tiered-hitl-checkpoint.py"
from dataclasses import dataclass
import hashlib
import json
import sqlite3

@dataclass(frozen=True)
class ActionProposal:
    tool: str
    stage: str
    params: dict
    reversible: bool

def classify_tier(p: ActionProposal) -> str:
    if p.tool in {"get_deploy", "git_diff", "read_logs"}:
        return "auto"
    if p.tool == "drop_table":
        return "deny" if p.stage == "production" else "dual_review"
    if not p.reversible or p.params.get("traffic_percent", 0) > 25:
        return "dual_review"
    return "single_review"

def payload_digest(params: dict) -> str:
    canonical = json.dumps(params, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(canonical).hexdigest()[:16]

conn = sqlite3.connect(":memory:", isolation_level=None)
conn.executescript("""
    CREATE TABLE checkpoints (
        approval_id TEXT PRIMARY KEY, version INT NOT NULL, requester TEXT NOT NULL,
        digest TEXT NOT NULL, expected_rev INT NOT NULL, op_key TEXT NOT NULL,
        status TEXT NOT NULL, expires_at INT NOT NULL, reviewer TEXT
    );
    CREATE TABLE outbox (message_key TEXT PRIMARY KEY, approval_id TEXT NOT NULL, op_key TEXT NOT NULL);
""")

def pause_for_approval(aid: str, requester: str, params: dict, expected_rev: int, op_key: str, expires_at: int) -> str:
    dig = payload_digest(params)
    conn.execute("INSERT INTO checkpoints VALUES (?, 1, ?, ?, ?, ?, 'pending', ?, NULL)",
                 (aid, requester, dig, expected_rev, op_key, expires_at))
    return dig

def approve_atomic(aid: str, version: int, dig: str, reviewer: str, now: int) -> str:
    conn.execute("BEGIN IMMEDIATE")
    try:
        row = conn.execute("SELECT requester FROM checkpoints WHERE approval_id = ?", (aid,)).fetchone()
        if not row or row[0] == reviewer:
            conn.execute("ROLLBACK")
            return "self_approval_forbidden"
        cur = conn.execute(
            "UPDATE checkpoints SET status='authorized', reviewer=? WHERE approval_id=? AND version=? AND digest=? AND status='pending' AND expires_at>?",
            (reviewer, aid, version, dig, now),
        )
        if cur.rowcount != 1:
            conn.execute("ROLLBACK")
            return "conflict_or_expired"
        op_key = conn.execute("SELECT op_key FROM checkpoints WHERE approval_id=?", (aid,)).fetchone()[0]
        conn.execute("INSERT INTO outbox VALUES (?, ?, ?)", (f"{aid}:v{version}", aid, op_key))
        conn.execute("COMMIT")
        return "authorized_and_queued"
    except Exception:
        conn.execute("ROLLBACK")
        raise

def resume_and_execute(aid: str, params: dict, live_rev: int, now: int) -> str:
    row = conn.execute("SELECT digest, expected_rev, op_key, status, expires_at FROM checkpoints WHERE approval_id=?", (aid,)).fetchone()
    if not row or row[3] != "authorized":
        return "not_authorized"
    if now >= row[4]:
        return "grant_expired"
    if payload_digest(params) != row[0]:
        return "digest_mismatch"
    if live_rev != row[1]:
        return f"stale_revision(expected={row[1]}, live={live_rev})"
    return f"dispatched:{row[2]}"

for prop in [
    ActionProposal("get_deploy", "production", {"id": "deploy-412"}, True),
    ActionProposal("promote_model", "canary", {"model": "reranker-v17", "traffic_percent": 25}, True),
    ActionProposal("drop_table", "production", {"table": "orders"}, False),
]:
    print(f"tier({prop.tool}) -> {classify_tier(prop)}")

canary = {"model": "reranker-v17", "traffic_percent": 25}
dig = pause_for_approval("apr-17", "deploy-bot", canary, expected_rev=41, op_key="op-canary-17", expires_at=1200)
print("self-approve:", approve_atomic("apr-17", 1, dig, "deploy-bot", now=1000))
print("lead approve:", approve_atomic("apr-17", 1, dig, "release-lead", now=1000))
print("duplicate click:", approve_atomic("apr-17", 1, dig, "other-lead", now=1001))
print("tampered resume:", resume_and_execute("apr-17", {**canary, "traffic_percent": 100}, live_rev=41, now=1050))
print("drifted rev resume:", resume_and_execute("apr-17", canary, live_rev=42, now=1050))
print("clean resume:", resume_and_execute("apr-17", canary, live_rev=41, now=1050))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tier(get_deploy) -> auto
tier(promote_model) -> single_review
tier(drop_table) -> deny
self-approve: self_approval_forbidden
lead approve: authorized_and_queued
duplicate click: conflict_or_expired
tampered resume: digest_mismatch
drifted rev resume: stale_revision(expected=41, live=42)
clean resume: dispatched:op-canary-17
```
<!-- leetllm: output:end -->

Every guard in that output prevents a distinct production outage: self-approval is rejected, a second concurrent reviewer click receives a conflict, modifying `traffic_percent` from `25` to `100` after sign-off fails digest verification, and an emergency cluster patch moving revision `41` to `42` stops the resumed worker from overwriting the newer fix.

## Classify failures and reconcile uncertain writes with stable keys

Once an approved action enters execution, failures split across three distinct stages:

| Observed symptom | Failing stage | Confirmed state | Safe next action |
|---|---|---|---|
| Invalid arguments or unknown tool | Proposal check | Never invoked | Return diagnostic to model and revalidate retry |
| Permission denied or expired grant | Authorization check | Unauthorized | Halt and request fresh scoped approval |
| Read timeout or HTTP `503` | Transport layer | State unread | Retry read with jittered backoff and hard deadline |
| Write timeout or dropped socket | Remote commit | Outcome unknown | Query operation key or replay unchanged idempotently |
| Controller returns `queued` | Async queue | Enqueued only | Poll worker status or report `queued` (never `completed`) |

An <span data-glossary="idempotency">idempotent</span> write produces the exact same persistent side effect whether executed once or replayed after dropped confirmations. That guarantee requires server-side coordination: persist one stable **logical operation key** (`rb-412-1`) *before* dialing the network, rotate only per-attempt transport trace IDs (`att-9f2c`), and write both the side effect and operation key inside one atomic database transaction.[^awsIdempotentApis2026][^sqliteTransactions2026]

<!-- leetllm: test, output=show -->
```python title="lost-reply-idempotency.py"
import json
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Barrier

class KeyConflict(Exception):
    pass

class Controller:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        with closing(sqlite3.connect(db_path)) as db, db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY, payload TEXT NOT NULL, state TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS operations (op_key TEXT PRIMARY KEY, payload TEXT NOT NULL, job_id INTEGER NOT NULL REFERENCES jobs(id));
            """)

    def enqueue(self, op_key: str, deploy_id: str, revision: str, fault: str | None = None) -> str:
        payload = json.dumps({"deploy_id": deploy_id, "revision": revision}, sort_keys=True)
        with closing(sqlite3.connect(self.db_path)) as db, db:
            db.execute("BEGIN IMMEDIATE")
            existing = db.execute("SELECT payload, job_id FROM operations WHERE op_key = ?", (op_key,)).fetchone()
            if existing:
                if existing[0] != payload:
                    raise KeyConflict("operation key already bound to different arguments")
                return f"job-{existing[1]}"
            job_id = db.execute("INSERT INTO jobs(payload, state) VALUES (?, 'queued')", (payload,)).lastrowid
            db.execute("INSERT INTO operations VALUES (?, ?, ?)", (op_key, payload, job_id))
            if fault == "before_commit":
                raise TimeoutError("link dropped before commit")
        if fault == "after_commit":
            raise TimeoutError("reply dropped after commit")
        return f"job-{job_id}"

    def lookup(self, op_key: str) -> tuple[str, str] | None:
        with closing(sqlite3.connect(self.db_path)) as db:
            row = db.execute("SELECT jobs.id, jobs.state FROM operations JOIN jobs ON jobs.id = operations.job_id WHERE op_key = ?", (op_key,)).fetchone()
            return None if row is None else (f"job-{row[0]}", row[1])

    def job_count(self) -> int:
        with closing(sqlite3.connect(self.db_path)) as db:
            return db.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]

with TemporaryDirectory() as directory:
    ctrl = Controller(Path(directory) / "controller.sqlite")
    try:
        ctrl.enqueue("rb-412-1", "deploy-412", "rev-17", fault="after_commit")
    except TimeoutError:
        print("client saw: outcome unknown")

    ctrl = Controller(Path(directory) / "controller.sqlite")
    print("reconciled:", ctrl.lookup("rb-412-1"))
    print("same-key replay:", ctrl.enqueue("rb-412-1", "deploy-412", "rev-17"))

    try:
        ctrl.enqueue("rb-412-1", "deploy-412", "rev-16")
    except KeyConflict as exc:
        print("rejected:", exc)

    try:
        ctrl.enqueue("rb-413-1", "deploy-413", "rev-17", fault="before_commit")
    except TimeoutError:
        pass
    assert ctrl.lookup("rb-413-1") is None

    start = Barrier(2)
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: (start.wait(5), ctrl.enqueue("rb-414-1", "deploy-414", "rev-17"))[1], range(2)))
    print("concurrent race:", results, "| total jobs:", ctrl.job_count())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
client saw: outcome unknown
reconciled: ('job-1', 'queued')
same-key replay: job-1
rejected: operation key already bound to different arguments
concurrent race: ['job-2', 'job-2'] | total jobs: 2
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/timeout_recovery_fork_dark.png" alt="State diagram for recovering an uncertain timeout after dispatching deploy-rev-17 with a stable operation key. Instead of retrying blindly, recovery queries remote state by operation key: already queued jobs keep their existing record, unobserved requests replay safely with the same key, and changed arguments trigger a 409 conflict halt." />
  <figcaption>A dropped reply never justifies guessing success or minting a new ID. Reconcile via the stable operation key before returning, replaying unchanged, or halting on parameter mismatch.</figcaption>
</figure>

Check each downstream API's retention rules: Stripe's v1 layer caches both successes and `500` responses per idempotency key and prunes keys after 24 hours, while eventually consistent read replicas can hide fresh commits.[^stripe2026IdempotentRequests] Likewise, Temporal Activity retries still require idempotent destinations if a worker crashes right after a remote call commits, and Saga compensation is always a new forward operation (uncordoning a Kubernetes node permits future scheduling without restoring evicted pods) that needs its own operation key.[^temporal_activity_definition][^temporalRetryPolicies2026][^kubernetes2026DrainNode][^azure2026CompensatingTransaction]

## Retry reads with jittered backoff, progress checks, and hard deadlines

For safe read-only calls (`GET /runs/deploy-412`), a budget of 3 attempts means **1 initial call plus at most 2 retries**. Fixed sleeps align failing workers into synchronized load spikes; exponential backoff with **full jitter** spreads retries uniformly across the delay window (for zero-indexed failure $k$, base delay $T_0$, and cap $T_{\max}$):[^awsbackoff]

$$
T_{\text{sleep}} = \operatorname{random}\left(0, \min\left(T_{\max}, T_0 \cdot 2^k\right)\right)
$$

When an upstream returns HTTP `429` or `503` with `Retry-After`, add capped jitter *on top of* `Retry-After` rather than taking `max(retry_after, jitter)` (which collapses every client onto the exact same timestamp whenever `retry_after` exceeds the jitter cap), and abort immediately if the combined sleep exceeds the remaining caller deadline.[^rfc9110RetryAfter] Watch out for stacked retries across SDKs and schema-repair wrappers (two 3-attempt layers allow $3 \times 3 = 9$ wire sends); enforce one outer wall-clock deadline and cumulative spend budget.[^instructor2026Retrying]

<!-- leetllm: test, output=show -->
```python title="read-retry-and-progress.py"
import random
from dataclasses import dataclass, field

class TransientReadError(Exception):
    def __init__(self, msg: str, retry_after: float = 0.0):
        super().__init__(msg)
        self.retry_after = retry_after

class DeadlineExceeded(Exception):
    pass

@dataclass
class VirtualClock:
    now: float = 0.0
    waits: list[float] = field(default_factory=list)
    def sleep(self, seconds: float) -> None:
        self.waits.append(seconds)
        self.now += seconds

def retry_read(call, *, attempts: int = 3, timeout: float = 10.0, base: float = 0.2, cap: float = 2.0, clock: VirtualClock, rng: random.Random):
    deadline, ceiling = clock.now + timeout, min(base, cap)
    for attempt in range(attempts):
        remaining = deadline - clock.now
        if remaining <= 0:
            raise DeadlineExceeded("caller deadline exhausted")
        try:
            res = call(remaining)
        except TransientReadError as exc:
            if attempt + 1 == attempts:
                raise
            delay = exc.retry_after + rng.uniform(0.0, ceiling)
            if delay >= deadline - clock.now:
                raise DeadlineExceeded("required wait exceeds remaining deadline") from exc
            clock.sleep(delay)
            ceiling = min(cap, ceiling * 2)
        else:
            if clock.now >= deadline:
                raise DeadlineExceeded("reply arrived past deadline")
            return res

clock, calls = VirtualClock(), [0]
def fetch_status(_rem: float) -> str:
    calls[0] += 1
    if calls[0] < 3:
        raise TransientReadError("overloaded", retry_after=0.25)
    return "deploy-412 failed unit-tests"

print("result:", retry_read(fetch_status, clock=clock, rng=random.Random(7)), "| waits:", [round(w, 3) for w in clock.waits])

short_clock = VirtualClock()
try:
    retry_read(lambda _: (_ for _ in ()).throw(TransientReadError("rate limited", retry_after=20.0)), timeout=3.0, clock=short_clock, rng=random.Random(1))
except DeadlineExceeded as exc:
    print("aborted early:", exc, "| sleeps:", len(short_clock.waits))

# Progress detection: novel paginated evidence resets stalls; identical errors trip max_stalls
seen, stalls, max_stalls = set(), 0, 2
for step, evidence in enumerate(["status-v1", "status-v1", "log-page-1", "log-page-1", "log-page-1"], 1):
    stalls = 0 if evidence not in seen else stalls + 1
    seen.add(evidence)
    if stalls >= max_stalls:
        print(f"progress guard stopped at step {step} after {stalls} consecutive stalls")
        break
```

<!-- leetllm: output:start -->
```text title="Output" output compact
result: deploy-412 failed unit-tests | waits: [0.315, 0.31]
aborted early: required wait exceeds remaining deadline | sleeps: 0
progress guard stopped at step 5 after 2 consecutive stalls
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/bounded_read_retry_timeline_dark.png" alt="Line chart comparing remaining caller deadline budget in seconds against the next jittered backoff wait across retry attempts. Across early attempts the wait fits within remaining time, but by Attempt 5 the required 6.4-second wait exceeds the remaining 5.1-second budget, causing deadline-aware retry logic to stop cleanly instead of overshooting the deadline." />
  <figcaption>Comparing the full scheduled wait (Retry-After floor plus jitter) against remaining wall-clock budget stops retries before overshooting the deadline.</figcaption>
</figure>

Pair stall guards (tracking novel trusted evidence tokens rather than raw tool counts, while still enforcing a hard `max_calls` cap and episodic notes like Reflexion[^shinn2023]) with separate **context-window** and **cumulative spend** accounting. With a fixed $h$-token system header and $s$ history tokens appended per turn across $n$ turns, cumulative input tokens grow quadratically:

$$
\text{Total Input} = n \cdot h + s \cdot \frac{n(n - 1)}{2}
$$

Summarizing prompt history shrinks only upcoming passes and never refunds earlier turns, so reserve worst-case cost (`input + max_output_tokens`) before each dispatch.

## Protect dependencies with generation-scoped circuit breakers

Across hundreds of concurrent sessions, per-run retries still hammer an unhealthy service. A <span data-glossary="circuit-breaker">circuit breaker</span> passes traffic when **closed**, fails fast during cooldown when **open**, and admits one **half-open** probe afterward to test recovery.[^azure2026CircuitBreaker] Tag every call with the breaker's integer `generation` so a slow reply started under generation 4 returns to its caller without closing a newer **open** generation 5, and clear `probe_in_flight` on cancellation so recovery never wedges.

<!-- leetllm: test, output=show -->
```python title="generation-scoped-circuit-breaker.py"
import asyncio

class CircuitOpen(Exception):
    pass

class CircuitBreaker:
    def __init__(self, threshold: int = 1, cooldown: float = 5.0, clock=lambda: 0.0):
        self.threshold, self.cooldown, self.clock = threshold, cooldown, clock
        self.state, self.failures, self.generation = "closed", 0, 0
        self.opened_at, self.probe_in_flight = 0.0, False
        self.lock = asyncio.Lock()

    def _trip_open(self) -> None:
        self.state, self.opened_at, self.probe_in_flight = "open", self.clock(), False
        self.generation += 1

    async def call(self, fn):
        async with self.lock:
            if self.state == "open":
                if self.clock() - self.opened_at < self.cooldown:
                    raise CircuitOpen("cooldown active")
                self.state = "half_open"
            if self.state == "half_open" and self.probe_in_flight:
                raise CircuitOpen("probe already running")
            is_probe = self.state == "half_open"
            if is_probe:
                self.probe_in_flight = True
            gen = self.generation
        try:
            res = await fn()
        except (TimeoutError, ConnectionError):
            async with self.lock:
                if gen == self.generation:
                    self.failures += 1
                    if is_probe or self.failures >= self.threshold:
                        self._trip_open()
            raise
        except asyncio.CancelledError:
            async with self.lock:
                if gen == self.generation and is_probe:
                    self._trip_open()
            raise
        except BaseException:
            async with self.lock:
                if gen == self.generation and is_probe:
                    self.probe_in_flight = False
            raise
        async with self.lock:
            if gen == self.generation:
                self.state, self.failures, self.probe_in_flight = "closed", 0, False
        return res

async def demo() -> None:
    now, started, release = [0.0], asyncio.Event(), asyncio.Event()
    cb = CircuitBreaker(threshold=1, cooldown=5.0, clock=lambda: now[0])
    async def slow_ok() -> str:
        started.set(); await release.wait(); return "gen-0-data"
    async def fail_timeout() -> str:
        raise TimeoutError("down")

    stale = asyncio.create_task(cb.call(slow_ok))
    await started.wait()
    try: await cb.call(fail_timeout)
    except TimeoutError: pass
    release.set()
    assert await stale == "gen-0-data" and cb.state == "open"
    print("stale gen-0 finish keeps state:", cb.state)

    now[0] = 5.0; started.clear(); release.clear()
    probe = asyncio.create_task(cb.call(slow_ok))
    await started.wait()
    probe.cancel()
    try: await probe
    except asyncio.CancelledError: pass
    assert cb.state == "open" and not cb.probe_in_flight

    now[0] = 10.0; release.set()
    assert await cb.call(slow_ok) == "gen-0-data" and cb.state == "closed"
    print("post-cancel recovery probe:", cb.state)

asyncio.run(demo())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
stale gen-0 finish keeps state: open
post-cancel recovery probe: closed
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/breaker_concurrent_state_dark.png" alt="State diagram for a generation-scoped circuit breaker. Calls start in Closed generation 4 while dependency failures trip Open generation 5. A delayed completion from generation 4 returns to its caller without resetting the newer Open state. After cooldown, a single half-open probe restores traffic to Closed generation 6." />
  <figcaption>Incrementing a generation counter whenever the circuit opens lets delayed responses return to their callers without closing an active outage.</figcaption>
</figure>

## Build honest fallbacks and report outcomes transparently

When a controller stays unavailable, swapping model providers never invents live telemetry, widens permissions, or overrides caller cancellation. Enforce observation freshness in host code so recent snapshots stay dated (*"job-1 was queued when checked 10s ago"*) while stale or missing records return *"Current revert status is unavailable"* and emit a compact, redacted human handoff packet (operation key, canonical payload, last verified timestamp, and pause reason).

<!-- leetllm: test, output=show -->
```python title="evidence-aware-fallback.py"
from dataclasses import dataclass

@dataclass(frozen=True)
class Observation:
    deploy_id: str
    job_id: str
    state: str
    observed_at: int
    source: str

def format_status(obs: Observation | None, *, deploy_id: str, job_id: str, now: int, max_age: int = 30) -> str:
    if obs is None or (obs.deploy_id, obs.job_id) != (deploy_id, job_id):
        return "Current revert status is unavailable."
    if obs.source != "controller" or obs.state not in {"queued", "running", "completed", "failed"}:
        return "Current revert status is unavailable."
    age = now - obs.observed_at
    return f"{job_id} was {obs.state} when checked {age}s ago." if 0 <= age <= max_age else "Current revert status is unavailable."

for sample in (Observation("deploy-412", "job-1", "queued", 990, "controller"),
               Observation("deploy-412", "job-1", "completed", 100, "controller"), None):
    print(format_status(sample, deploy_id="deploy-412", job_id="job-1", now=1000))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
job-1 was queued when checked 10s ago.
Current revert status is unavailable.
Current revert status is unavailable.
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/fallback_evidence_freshness_dark.png" alt="Flow diagram showing evidence-age checks during fallback when the live controller is unreachable. Observations within the 30-second freshness window can report dated past state such as queued 10 seconds ago, while stale 900-second or missing snapshots are blocked from claiming present completion and routed to explicit human handoff." />
  <figcaption>Deterministic freshness checks keep 10-second snapshots cleanly dated while blocking stale 900-second records from asserting current completion.</figcaption>
</figure>

Finally, never collapse degraded fallbacks and human handoffs into a single "success" number. If 100 failed runs recover as 60 full completions, 12 dated degraded answers, 18 safe human handoffs, and 10 unresolved timeouts, report all four rates separately using unique runs in the denominator so reviewer workload and capability drops stay visible.

```mastery-quiz
[
  {
    "question": "A release agent pauses for human approval on a 25% canary shift at cluster revision 41. Forty minutes later an engineer approves it, after an emergency patch already moved the cluster to revision 42. What must durable checkpoint-and-resume do?",
    "options": [
      "Execute immediately because the approval grant has not expired.",
      "Verify the canonical digest and compare-and-swap against live revision 41, rejecting dispatch on revision drift.",
      "Re-run the pre-interrupt node to fetch revision 42 and reuse the old approval.",
      "Downgrade the action to read-only and report completion."
    ],
    "answer": "Verify the canonical digest and compare-and-swap against live revision 41, rejecting dispatch on revision drift.",
    "explanation": "Checkpoints survive restarts, not external drift. Verify expiry, canonical digest, and live revision before mutating production."
  },
  {
    "question": "A controller commits a queued revert job, then the TCP link drops before confirmation arrives. Which retry preserves idempotency?",
    "options": [
      "Mint a new operation key with the same payload and a new trace ID.",
      "Reuse the original logical operation key with the unchanged payload and a new transport trace ID.",
      "Reuse the original logical operation key with an updated revision.",
      "Wait 5 seconds and assume the job completed."
    ],
    "answer": "Reuse the original logical operation key with the unchanged payload and a new transport trace ID.",
    "explanation": "Replaying the same operation key with identical arguments returns the existing job without duplicating work, while rotating transport trace IDs."
  },
  {
    "question": "A read fails with 1.3s left before deadline. Retry-After is 1.1s plus 0.4s of jitter. What should happen?",
    "options": [
      "Sleep 1.1s because the server floor fits inside 1.3s.",
      "Sleep 0.4s because jitter fits inside 1.3s.",
      "Compute 1.5s and abort immediately because the combined wait exceeds 1.3s.",
      "Clamp the sleep to 1.3s and retry at the deadline."
    ],
    "answer": "Compute 1.5s and abort immediately because the combined wait exceeds 1.3s.",
    "explanation": "Add jitter above Retry-After (1.1 + 0.4 = 1.5s) to prevent thundering herds, then abort without sleeping when the total wait exceeds the remaining deadline."
  },
  {
    "question": "Call A starts in closed circuit generation 4. Another request fails and opens generation 5 before Call A returns a valid result. What should the breaker do?",
    "options": [
      "Return Call A's result and close the circuit.",
      "Return Call A's result while keeping the circuit open in generation 5.",
      "Discard Call A's result and keep the circuit open.",
      "Discard Call A's result and move to half-open."
    ],
    "answer": "Return Call A's result while keeping the circuit open in generation 5.",
    "explanation": "Call A's data is still valid for its caller, yet it belongs to generation 4 and cannot clear newer outage evidence in generation 5."
  },
  {
    "question": "During an outage, the newest cached record is a 25-minute-old 'completed' snapshot while the freshness limit is 90s. What should fallback report?",
    "options": [
      "Report completion now because 'completed' is terminal.",
      "Report current status unavailable and date any earlier observation explicitly.",
      "Swap to a backup LLM and raise the freshness limit to 30 minutes.",
      "Retry the write with a fresh operation key."
    ],
    "answer": "Report current status unavailable and date any earlier observation explicitly.",
    "explanation": "Host freshness rules bound present-tense claims regardless of model swaps or cached terminal states."
  }
]
```

> **Next:** Continue to [Multi-Agent Orchestration](/learn/multi-agent-dags-langgraph-orchestration).

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

An approved request to revert `deploy-412` to `rev-17` reaches a release controller. Downstream, the controller writes `job-1` to disk and sends back confirmation, then the network drops before that packet arrives. Your agent sees only a silent timeout while `job-1` is already queued.

Two shortcuts turn that timeout into an incident. Retrying blindly with a fresh request queues a duplicate revert on top of `job-1`. Reporting success is equally false when the controller has at most enqueued work. Reliable agents keep uncertainty explicit until host code reconciles remote state, gate risky writes behind durable human approvals, and cap retries, circuit breakers, and fallbacks deterministically.

## Gate actions by risk tier and pause durably for human approval

Not every tool call deserves a human interrupt, and not every call can run unguarded. Classify every proposed action in host code by **blast radius** and **undo cost** before execution:[^owaspExcessiveAgency2025]

- **Read-only (`auto`):** Inspection calls (`get_deploy`, `git_diff`, `read_logs`) validate target scope and run automatically.
- **Reversible wide-scope (`single_review`):** Live canary shifts (`<=25%`) or scoped rollbacks pause for one authenticated reviewer.
- **Irreversible or high-blast (`dual_review` or `deny`):** Production table drops, root key rotations, or >25% traffic shifts require dual sign-off with short expiry or hard-deny in production.

Because human review takes minutes or hours, holding an open coroutine in memory breaks on the first pod restart. Instead, **checkpoint and pause**: persist the workflow state, a canonical SHA-256 payload digest (sorted JSON keys per RFC 8785), expected target revision, stable operation key, and expiry timestamp to SQLite or PostgreSQL, then free the worker completely.[^rfc8785Jcs2020][^langgraph2026checkpointers][^temporal2026workflow]

When an authenticated reviewer (`reviewer != requester`) approves, commit the status transition (`pending -> authorized` conditioned on exact version, digest, and expiry) and an `outbox` resume event inside **one atomic `BEGIN IMMEDIATE` transaction** so a crash never orphans an approval and double-clicks get a clean conflict.[^sqliteTransactions2026] On resume (via LangGraph `Command(resume=...)` or Temporal `@workflow.update`), verify the digest, expiry, and live cluster revision before dispatching the write in a dedicated post-approval step (never before `interrupt()`, which replays from the top on resume).[^langgraph2024][^rfc9110ConditionalRequests2022]

<!-- leetllm: test, output=show -->
```python title="reader-hitl-checkpoint-resume.py"
import hashlib
import json
import sqlite3

def digest(params: dict) -> str:
    return hashlib.sha256(json.dumps(params, sort_keys=True, separators=(",", ":")).encode()).hexdigest()[:16]

db = sqlite3.connect(":memory:", isolation_level=None)
db.executescript("""
    CREATE TABLE approvals (id TEXT PRIMARY KEY, ver INT, requester TEXT, dig TEXT, exp_rev INT, op_key TEXT, status TEXT, expires_at INT);
    CREATE TABLE outbox (msg_key TEXT PRIMARY KEY, id TEXT, op_key TEXT);
""")

def pause(aid: str, requester: str, params: dict, exp_rev: int, op_key: str, expires_at: int) -> str:
    d = digest(params)
    db.execute("INSERT INTO approvals VALUES (?, 1, ?, ?, ?, ?, 'pending', ?)", (aid, requester, d, exp_rev, op_key, expires_at))
    return d

def approve(aid: str, ver: int, d: str, reviewer: str, now: int) -> str:
    db.execute("BEGIN IMMEDIATE")
    row = db.execute("SELECT requester, op_key FROM approvals WHERE id=?", (aid,)).fetchone()
    if not row or row[0] == reviewer:
        db.execute("ROLLBACK"); return "forbidden"
    cur = db.execute("UPDATE approvals SET status='authorized' WHERE id=? AND ver=? AND dig=? AND status='pending' AND expires_at>?",
                     (aid, ver, d, now))
    if cur.rowcount != 1:
        db.execute("ROLLBACK"); return "conflict"
    db.execute("INSERT INTO outbox VALUES (?, ?, ?)", (f"{aid}:v{ver}", aid, row[1]))
    db.execute("COMMIT")
    return "authorized"

def resume(aid: str, params: dict, live_rev: int, now: int) -> str:
    row = db.execute("SELECT dig, exp_rev, op_key, status, expires_at FROM approvals WHERE id=?", (aid,)).fetchone()
    if not row or row[3] != "authorized" or now >= row[4]:
        return "not_valid"
    if digest(params) != row[0]:
        return "digest_mismatch"
    if live_rev != row[1]:
        return f"stale_rev({live_rev}!={row[1]})"
    return f"dispatched:{row[2]}"

proposal = {"model": "reranker-v17", "traffic_percent": 25}
d = pause("apr-17", "deploy-bot", proposal, exp_rev=41, op_key="op-17", expires_at=1200)
print("approve:", approve("apr-17", 1, d, "release-lead", now=1000))
print("second click:", approve("apr-17", 1, d, "other-lead", now=1001))
print("tampered:", resume("apr-17", {**proposal, "traffic_percent": 100}, live_rev=41, now=1050))
print("drifted rev:", resume("apr-17", proposal, live_rev=42, now=1050))
print("valid resume:", resume("apr-17", proposal, live_rev=41, now=1050))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
approve: authorized
second click: conflict
tampered: digest_mismatch
drifted rev: stale_rev(42!=41)
valid resume: dispatched:op-17
```
<!-- leetllm: output:end -->

## Classify failures and anchor every write to one operation key

Once execution begins, split faults by stage so you never treat a permission denial like a dropped socket:

1. **Proposal check before dispatch:** Schema errors or out-of-scope IDs fail inside host code before any network call; every model retry must clear host validation from scratch.[^openai2023ReproducibleOutputs]
2. **Transport and remote commit:** Dropped connections leave writes uncertain because the server may have committed just before the socket closed.
3. **Partial result state:** Receiving HTTP `200` with `state="queued"` confirms queue placement only, never finished execution.

To make dropped writes recoverable, assign one stable **logical operation key** (`rb-412-1`) before sending the first packet, rotate only per-attempt trace IDs, and store the operation key alongside the job inside one atomic `BEGIN IMMEDIATE` transaction on the server.[^awsIdempotentApis2026][^sqliteTransactions2026]

<!-- leetllm: test, output=show -->
```python title="recovery-lost-reply.py"
import json
import sqlite3
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory

class KeyConflict(Exception):
    pass

class Controller:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        with closing(sqlite3.connect(db_path)) as db, db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY, payload TEXT NOT NULL, state TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS operations (op_key TEXT PRIMARY KEY, payload TEXT NOT NULL, job_id INTEGER NOT NULL REFERENCES jobs(id));
            """)

    def enqueue(self, op_key: str, deploy_id: str, revision: str, fault: str | None = None) -> str:
        payload = json.dumps({"deploy_id": deploy_id, "revision": revision}, sort_keys=True)
        with closing(sqlite3.connect(self.db_path)) as db, db:
            db.execute("BEGIN IMMEDIATE")
            existing = db.execute("SELECT payload, job_id FROM operations WHERE op_key = ?", (op_key,)).fetchone()
            if existing:
                if existing[0] != payload:
                    raise KeyConflict("same operation key cannot reuse changed arguments")
                return f"job-{existing[1]}"
            job_id = db.execute("INSERT INTO jobs(payload, state) VALUES (?, 'queued')", (payload,)).lastrowid
            db.execute("INSERT INTO operations VALUES (?, ?, ?)", (op_key, payload, job_id))
            if fault == "before_commit":
                raise TimeoutError("connection dropped before commit")
        if fault == "after_commit":
            raise TimeoutError("confirmation lost after commit")
        return f"job-{job_id}"

    def lookup(self, op_key: str) -> tuple[str, str] | None:
        with closing(sqlite3.connect(self.db_path)) as db:
            row = db.execute("SELECT jobs.id, jobs.state FROM operations JOIN jobs ON jobs.id = operations.job_id WHERE op_key = ?", (op_key,)).fetchone()
            return None if row is None else (f"job-{row[0]}", row[1])

with TemporaryDirectory() as directory:
    ctrl = Controller(Path(directory) / "ctrl.sqlite")
    try:
        ctrl.enqueue("rb-412-1", "deploy-412", "rev-17", fault="after_commit")
    except TimeoutError:
        print("Caller saw timeout")

    print("Lookup:", ctrl.lookup("rb-412-1"))
    print("Same-key replay:", ctrl.enqueue("rb-412-1", "deploy-412", "rev-17"))
    try:
        ctrl.enqueue("rb-412-1", "deploy-412", "rev-16")
    except KeyConflict as exc:
        print("Changed payload blocked:", exc)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Caller saw timeout
Lookup: ('job-1', 'queued')
Same-key replay: job-1
Changed payload blocked: same operation key cannot reuse changed arguments
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/timeout_recovery_fork_dark.png" alt="State diagram for recovering an uncertain timeout after dispatching deploy-rev-17 with a stable operation key. Instead of retrying blindly, recovery queries remote state by operation key: already queued jobs keep their existing record, unobserved requests replay safely with the same key, and changed arguments trigger a 409 conflict halt." />
  <figcaption>Once a reply drops, reconcile remote state by operation key before acting: return found jobs, replay unchanged operations, or reject mismatched parameters.</figcaption>
</figure>

Check API retention limits (Stripe's v1 keys cache both successes and server errors and can expire after 24 hours[^stripe2026IdempotentRequests]), and remember that workflow checkpoints never undo external writes that ran right before a crash, so side-effecting activities still require destination idempotency.[^temporal_activity_definition]

## Retry reads with jitter and one hard deadline

For safe read-only lookups, fixed delays align failing clients into thundering herds. Pairing exponential backoff with full jitter spreads retries uniformly across the window (for retry $k$, base delay $T_0$, and ceiling $T_{\max}$):[^awsbackoff]

$$
T_{\text{sleep}} = U\left(0, \min\left(T_{\max}, T_0 \cdot 2^k\right)\right)
$$

When a service returns `Retry-After`, add jitter *above* that floor instead of taking `max(hint, jitter)` (which synchronizes clients whenever `hint` exceeds the jitter ceiling), and stop immediately if the total wait exceeds the caller's remaining deadline.[^rfc9110RetryAfter]

<!-- leetllm: test, output=show -->
```python title="recovery-retry.py"
import random
from dataclasses import dataclass, field

class TransientReadError(Exception):
    def __init__(self, msg: str, retry_after: float = 0.0):
        super().__init__(msg)
        self.retry_after = retry_after

class DeadlineExceeded(Exception):
    pass

@dataclass
class SimClock:
    now: float = 0.0
    waits: list[float] = field(default_factory=list)
    def sleep(self, seconds: float) -> None:
        self.waits.append(seconds)
        self.now += seconds

def retry_read(call, *, attempts: int = 3, timeout: float = 10.0, base: float = 0.2, cap: float = 2.0, clock: SimClock, rng: random.Random):
    deadline, ceiling = clock.now + timeout, min(base, cap)
    for attempt in range(attempts):
        remaining = deadline - clock.now
        if remaining <= 0:
            raise DeadlineExceeded("deadline exhausted")
        try:
            res = call(remaining)
        except TransientReadError as exc:
            if attempt + 1 == attempts:
                raise
            delay = exc.retry_after + rng.uniform(0.0, ceiling)
            if delay >= deadline - clock.now:
                raise DeadlineExceeded("wait exceeds remaining deadline") from exc
            clock.sleep(delay)
            ceiling = min(cap, ceiling * 2)
        else:
            if clock.now >= deadline:
                raise DeadlineExceeded("reply arrived past deadline")
            return res

clock, calls = SimClock(), [0]
def flaky_status(rem: float) -> str:
    calls[0] += 1
    if calls[0] < 3:
        raise TransientReadError("busy", retry_after=0.25)
    return f"ok with {rem:.2f}s left"

print(retry_read(flaky_status, clock=clock, rng=random.Random(7)), "| waits:", [round(w, 3) for w in clock.waits])

short_clock = SimClock()
try:
    retry_read(lambda _: (_ for _ in ()).throw(TransientReadError("overloaded", retry_after=20.0)), timeout=3.0, clock=short_clock, rng=random.Random(1))
except DeadlineExceeded as exc:
    print("aborted:", exc, "| sleeps:", len(short_clock.waits))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ok with 9.37s left | waits: [0.315, 0.31]
aborted: wait exceeds remaining deadline | sleeps: 0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/bounded_read_retry_timeline_dark.png" alt="Line chart comparing remaining caller deadline budget in seconds against the next jittered backoff wait across retry attempts. Across early attempts the wait fits within remaining time, but by Attempt 5 the required 6.4-second wait exceeds the remaining 5.1-second budget, causing deadline-aware retry logic to stop cleanly instead of overshooting the deadline." />
  <figcaption>Comparing the full scheduled wait against the remaining caller deadline stops retries from overshooting timeouts.</figcaption>
</figure>

Separately, measure forward progress by tracking novel evidence tokens from trusted adapters rather than counting tool calls, keep an independent hard call cap, and track single-call context windows separately from cumulative token spend (summarizing history never refunds tokens spent on earlier turns).

## Circuit breakers and honest fallbacks

When a downstream service stays down across requests, a **circuit breaker** stops fleet-wide retries by failing fast in the **open** state across a cooldown, then testing recovery with one **half-open** probe.[^azure2026CircuitBreaker] Two concurrency guards keep breakers reliable under async load: tag each call with an integer `generation` so a slow response from generation 4 returns cleanly to its caller without closing a newer **open** generation 5, and clear the probe slot whenever a half-open probe is canceled so recovery never wedges. (See the full async implementation in the online reference edition.)

<figure>
  <img src="illustrations/_generated/breaker_concurrent_state_dark.png" alt="State diagram for a generation-scoped circuit breaker. Calls start in Closed generation 4 while dependency failures trip Open generation 5. A delayed completion from generation 4 returns to its caller without resetting the newer Open state. After cooldown, a single half-open probe restores traffic to Closed generation 6." />
  <figcaption>A generation tag lets stale completions return cleanly to their own caller while protecting newer open circuit state.</figcaption>
</figure>

> **Key insight:** A stale success can still be valid data for the caller that waited on it, without being valid evidence that the downstream service is healthy right now.

When live verification vanishes, swapping to a backup LLM never invents missing controller telemetry, widens permissions, or overrides caller cancellation. Enforce freshness limits in host code so recent cached observations carry explicit timestamps while stale or missing records route to a concise, redacted human handoff packet (operation key, canonical payload, last verified timestamp, and pause reason).

<figure>
  <img src="illustrations/_generated/fallback_evidence_freshness_dark.png" alt="Flow diagram showing evidence-age checks during fallback when the live controller is unreachable. Observations within the 30-second freshness window can report dated past state such as queued 10 seconds ago, while stale 900-second or missing snapshots are blocked from claiming present completion and routed to explicit human handoff." />
  <figcaption>Freshness-checked fallbacks separate recent timestamped observations from stale caches that must route to honest handoffs.</figcaption>
</figure>

Remember that Saga compensation is always an independent forward action (uncordoning a Kubernetes node allows future pods without restoring evicted ones) that needs its own operation key.[^kubernetes2026DrainNode][^azure2026CompensatingTransaction] Report full completions, degraded dated answers, safe handoffs, and unresolved faults separately so reviewer queues stay visible.

## What you can build now

You now have a complete reliability toolkit for production agents: route actions by blast radius and undo cost, pause and resume durably across restarts with atomic outbox approvals and live revision checks, anchor ambiguous writes to stable operation keys, bound read retries with jitter and deadlines, protect failing services with generation-scoped breakers, and keep fallback claims strictly honest. Additional concurrency traces live in the [complete online chapter](/learn/agent-failure-states-retry-fallback?view=online).

> **Next:** Continue to [Multi-Agent Orchestration](/learn/multi-agent-dags-langgraph-orchestration).

<!-- leetllm: edition:reader:end -->
