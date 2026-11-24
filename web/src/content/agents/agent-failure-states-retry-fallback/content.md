---
{
  "id": "agent-failure-states-retry-fallback",
  "slug": "agent-failure-states-retry-fallback",
  "title": "Agent Failure & Recovery",
  "shortDescription": "When an agent times out, its action may still be running. Learn when to retry, verify state, slow down, or hand off.",
  "difficulty": "Hard",
  "category": "LLM Agents & Tool Use",
  "section": "Advanced Agents & Retrieval",
  "coverImage": "illustrations/_generated/timeout_recovery_fork_dark.png",
  "companies": ["Anthropic", "OpenAI", "Google", "Microsoft", "Shopify", "Notion"],
  "prerequisites": ["agentic-architectures-react-plan-execute", "function-calling-tool-use-llms", "agent-memory-persistence-patterns"],
  "relatedQuestions": ["multi-agent-dags-langgraph-orchestration", "agent-memory-persistence-patterns", "human-in-the-loop-agent-architecture", "guardrails-safety-filters-production"],
  "order": 14,
  "keyConceptsTested": ["Failure Classification", "Action Scope Validation", "Idempotency Keys", "Ambiguous Commits", "State Reconciliation", "Checkpointed Recovery", "Exponential Backoff", "Full Jitter", "Retry Deadlines", "Progress Detection", "Budget Reservation", "Circuit Breakers", "Stale In-Flight Generations", "Cancellation Cleanup", "Tiered Fallback Chains", "Graceful Capability Degradation", "Saga Pattern Compensation", "Recovery Evaluation"]
}
---

<!-- leetllm: edition:reference:start -->

A deployment agent asks a release controller to revert `deploy-412` to `rev-17`. The controller writes `job-1` into durable storage and transmits a confirmation, then the TCP connection drops before that reply reaches the agent. From the caller's side of the socket, all that arrives is a silent timeout.

That single missing packet tempts recovery code into two opposite mistakes. Treating the timeout as proof that nothing ran leads the agent to send a fresh request and queue a second revert on top of `job-1`. Reporting that the revert succeeded is just as misleading when, at best, a job may have entered a queue.

Both failures happen when code fills missing network feedback with a guess. Reliable recovery preserves that uncertainty until the runtime inspects remote state, then takes only an action that fits what it actually observed. [Agent memory](/learn/agent-memory-persistence-patterns) carries context across turns, yet it cannot verify external state or make an unsafe write repeatable. The <span data-glossary="agent-runtime">agent runtime</span> wrapping the model and its tools owns those checks deterministically.

## Separate status inspection from write permission

Before a single packet leaves the host, check what the user actually asked for. When an engineer asks *"What happened to deployment deploy-412?"*, a read-only status check matches that request. Triggering a revert mutates production and needs separate explicit approval. A tool call produced by a language model cannot turn a status question into write permission.

Every <span data-glossary="tool-calling">tool call</span> emitted by a model is an untrusted proposal until host code validates it. Before dispatch, the runtime checks the tool name, parameter schema, target resource ID, and caller permissions against authenticated session state. Passing JSON schema validation confirms syntax only. It never confirms that the caller is allowed to touch a given service or alter a live revision.

In the validator below, `allowed_deploys` stands in for an external permission lookup held outside prompt history. Wrong tool names, unexpected keys, and out-of-scope targets all fail before any client call runs, and copying only verified keys strips stray fields before forwarding.

<!-- leetllm: test, output=show -->

```python title="validate-status-lookup.py"
import re

class RejectedProposal(Exception):
    pass

def validate_lookup(tool: str, args: dict, requested_deploy: str, allowed_deploys: set[str]) -> dict[str, str]:
    if tool != "get_deploy":
        raise RejectedProposal("only get_deploy is permitted for status queries")
    if set(args) != {"id"}:
        raise RejectedProposal("get_deploy requires exactly one key: id")
    deploy_id = args["id"]
    if not re.fullmatch(r"deploy-[0-9]{3,}", deploy_id):
        raise RejectedProposal("id must match deploy-<digits>")
    if deploy_id != requested_deploy or deploy_id not in allowed_deploys:
        raise RejectedProposal("target deployment is outside task permissions")
    return {"id": deploy_id}

test_proposals = [
    ("get_deploy", {"deploy_id": "deploy-412"}),
    ("create_release", {}),
    ("get_deploy", {"id": "deploy-413"}),
    ("get_deploy", {"id": "deploy-412"}),
]
for tool, args in test_proposals:
    try:
        print("accepted:", validate_lookup(tool, args, "deploy-412", {"deploy-412"}))
    except RejectedProposal as exc:
        print(f"rejected ({tool}): {exc}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rejected (get_deploy): get_deploy requires exactly one key: id
rejected (create_release): only get_deploy is permitted for status queries
rejected (get_deploy): target deployment is outside task permissions
accepted: {'id': 'deploy-412'}
```
<!-- leetllm: output:end -->

Every repaired or regenerated model proposal must pass this same host check before dispatch. Even at temperature zero, inference backends do not guarantee identical outputs across batches or hardware nodes, so re-validating every revised output catches drift before it hits a tool.[^openai2023ReproducibleOutputs]

> **Common mistake:** Treating a regenerated model proposal like a network retry. A network retry replays the exact validated payload after a socket drop. A model retry produces fresh untrusted text that must clear schema and permission checks all over again.

## Classify failures by execution stage

Many distinct faults look identical to a user: *"the agent stopped working."* Recovery depends on where execution broke, because repeating the wrong step multiplies the damage. Splitting failures into three stages clarifies what actually happened and what action keeps remote state clean:

1. **Proposal check:** Missing fields, unknown tools, or schema mismatches fail inside host code before any network call. When the task scope still permits it, return the structured error to the model and validate its revised call from scratch.
2. **Transport and remote commit:** Timeouts, connection resets, and `502`/`503` overload responses leave writes uncertain because the server may have committed right before the socket closed. Reads can retry under backoff and a hard deadline, while writes must reconcile remote state using a stable operation key before replaying or halting.
3. **Result interpretation:** A downstream API can return HTTP `200` with an application error body, or confirm `queued` without finishing deployment. Parse explicit machine states so `queued` never turns into `completed` without confirmation from the worker that actually ran the job.

| Observed symptom | Failing stage | Confirmed state | Safe next action |
|---|---|---|---|
| Missing argument or invalid type | Proposal check | Tool never invoked | Return structured diagnostic and revalidate retry |
| Permission denied | Permission check | Action unauthorized | Halt execution and request explicit approval |
| Read timeout or `503` | Transport layer | State unread | Retry read with backoff, jitter, and deadline |
| Write timeout or dropped socket | Remote commit | Outcome unknown | Query operation key or replay unchanged idempotently |
| Controller confirms `queued` | Async queue | Enqueued, not finished | Subscribe to worker status or report `queued` only |

Keeping these stages separate prevents category errors during incidents. Treating a permission denial like a transient timeout burns budget on hopeless retries, while treating an unconfirmed queued job as completed misleads operators.

## Reconcile uncertain writes with stable keys

An <span data-glossary="idempotency">idempotent</span> endpoint produces the exact same persistent side effect whether executed once or retried five times after dropped replies. That guarantee requires server-side coordination: the client sends a stable operation key representing one logical action, and the server writes both the side effect and the key inside a single database transaction.[^awsIdempotentApis2026]

Generating a fresh UUID on every HTTP retry breaks idempotency immediately, because the server sees each attempt as a brand-new command. Separate the logical action ID from the per-attempt network trace ID:

| Identifier | Example value | Lifetime and ownership |
|---|---|---|
| Logical operation key | `rb-412-1` | Constant across all retries for one logical revert |
| Transport trace ID | `att-9f2c` | Fresh per network attempt for log correlation |

In the SQLite controller below, `jobs` and `operations` update inside one `BEGIN IMMEDIATE` write transaction.[^sqliteTransactions2026] A fault before commit rolls both inserts back cleanly. A dropped reply after commit leaves both rows durable, so later lookups or unchanged replays with `rb-412-1` recover `job-1` without inserting a duplicate. Changing `rev-17` to `rev-16` under the same key raises `KeyConflict`, and two threads racing on `rb-414-1` serialize cleanly behind SQLite's write lock.

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
    """Durable SQLite job controller supporting atomic operation keys."""

    def __init__(self, db_path: Path):
        self.db_path = db_path
        with closing(sqlite3.connect(db_path)) as db, db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS jobs (
                    id INTEGER PRIMARY KEY,
                    payload TEXT NOT NULL,
                    state TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS operations (
                    op_key TEXT PRIMARY KEY,
                    payload TEXT NOT NULL,
                    job_id INTEGER NOT NULL REFERENCES jobs(id)
                );
            """)

    def enqueue(self, op_key: str, deploy_id: str, revision: str, fault: str | None = None) -> str:
        payload = json.dumps({"deploy_id": deploy_id, "revision": revision}, sort_keys=True)
        with closing(sqlite3.connect(self.db_path)) as db, db:
            db.execute("BEGIN IMMEDIATE")
            existing = db.execute(
                "SELECT payload, job_id FROM operations WHERE op_key = ?", (op_key,)
            ).fetchone()
            if existing:
                if existing[0] != payload:
                    raise KeyConflict("operation key already bound to different arguments")
                return f"job-{existing[1]}"
            job_id = db.execute(
                "INSERT INTO jobs(payload, state) VALUES (?, 'queued')", (payload,)
            ).lastrowid
            db.execute("INSERT INTO operations VALUES (?, ?, ?)", (op_key, payload, job_id))
            if fault == "before_commit":
                raise TimeoutError("link dropped before commit")
        if fault == "after_commit":
            raise TimeoutError("reply dropped after commit")
        return f"job-{job_id}"

    def lookup(self, op_key: str) -> tuple[str, str] | None:
        with closing(sqlite3.connect(self.db_path)) as db:
            row = db.execute(
                """
                SELECT jobs.id, jobs.state
                FROM operations
                JOIN jobs ON jobs.id = operations.job_id
                WHERE operations.op_key = ?
                """,
                (op_key,),
            ).fetchone()
            return None if row is None else (f"job-{row[0]}", row[1])

    def job_count(self) -> int:
        with closing(sqlite3.connect(self.db_path)) as db:
            return db.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]

with TemporaryDirectory() as directory:
    controller = Controller(Path(directory) / "controller.sqlite")
    try:
        controller.enqueue("rb-412-1", "deploy-412", "rev-17", fault="after_commit")
    except TimeoutError:
        print("client saw: outcome unknown")

    # Reopen the database after simulated caller restart and reconcile via op_key.
    controller = Controller(Path(directory) / "controller.sqlite")
    print("reconciled:", controller.lookup("rb-412-1"))
    print("same-key replay:", controller.enqueue("rb-412-1", "deploy-412", "rev-17"))

    try:
        controller.enqueue("rb-412-1", "deploy-412", "rev-16")
    except KeyConflict as exc:
        print("rejected:", exc)

    try:
        controller.enqueue("rb-413-1", "deploy-413", "rev-17", fault="before_commit")
    except TimeoutError:
        pass
    assert controller.lookup("rb-413-1") is None
    print("queued jobs after pre-commit fault:", controller.job_count())

    start = Barrier(2)
    def competing_send(_: int) -> str:
        start.wait(timeout=5)
        return controller.enqueue("rb-414-1", "deploy-414", "rev-17")

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(competing_send, range(2)))
    print("concurrent race:", results, "| total jobs:", controller.job_count())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
client saw: outcome unknown
reconciled: ('job-1', 'queued')
same-key replay: job-1
rejected: operation key already bound to different arguments
queued jobs after pre-commit fault: 1
concurrent race: ['job-2', 'job-2'] | total jobs: 2
```
<!-- leetllm: output:end -->

Two properties stand out in that trace. First, replaying `rb-412-1` with identical parameters returns `job-1` without creating a second job, and the confirmed state remains **`queued`**, never `completed`. Second, when two threads race on `rb-414-1`, `BEGIN IMMEDIATE` serializes write lock acquisition so only one thread inserts `job-2` while the second reads the committed mapping and returns the same ID.[^sqliteTransactions2026] Reading before locking would create a check-then-insert race where both threads see an empty table and duplicate the work.

<figure>
  <img src="illustrations/_generated/timeout_recovery_fork_dark.png" alt="State diagram for recovering an uncertain timeout after dispatching deploy-rev-17 with a stable operation key. Instead of retrying blindly, recovery queries remote state by operation key: already queued jobs keep their existing record, unobserved requests replay safely with the same key, and changed arguments trigger a 409 conflict halt." />
  <figcaption>A dropped reply never justifies guessing success or minting a new ID. Reconcile via the stable operation key before deciding to return, replay, or halt.</figcaption>
</figure>

> **Key insight:** Persist the operation key *before* making the network call. If the caller crashes between sending the request and saving the reply, restarting with the saved key lets recovery ask the controller what actually landed.

<details>
<summary>Deep dive: Server idempotency windows, replica lag, and compensating actions</summary>

Every remote API sets its own rules for key retention, error caching, and conflict handling. Stripe's v1 idempotency layer saves both successful bodies and server `500` responses for identical keys and can prune stored keys after 24 hours, whereas parameter validation failures before handler execution store no record.[^stripe2026IdempotentRequests] Reusing an expired key acts like a fresh charge, and replaying a cached `500` simply hands back the saved error.

Be cautious with *"not found"* replies from eventually consistent endpoints. Replica lag can hide a write that just committed on the primary node, so turning a stale read miss into a new write without an idempotency key creates split state. Hold ambiguous entries in `unknown` until primary reconciliation or manual review clears them.

When an already-committed step must be reversed, compensation is a new forward action rather than an undo button. Draining a Kubernetes node (`kubectl cordon` and eviction) cannot teleport evicted pods back when you uncordon the node, because uncordoning only permits future scheduling.[^kubernetes2026DrainNode] Likewise, multi-service Sagas often use parallel compensations, forward repairs, or human approvals instead of strict reverse order, and any timeout during compensation creates another ambiguous operation that needs its own operation key.[^azure2026CompensatingTransaction]

</details>

```checkpoint
After a write times out, your retry logic generates a fresh UUID per HTTP attempt so logs show unique IDs. What breaks?
---
The downstream server sees each retry as a distinct operation and can execute duplicate mutations. Keep one stable logical operation key across retries, assign a distinct transport trace ID per network attempt, and reject parameter changes on reuse.
```

## Restore workflow checkpoints and verify live state

A <span data-glossary="workflow-checkpoint">checkpoint</span> lets a long-running agent survive pod restarts, yet restoring local state never rewinds external systems. If a worker crashes right after saving *"about to submit rb-412-1"* while the remote controller already enqueued `job-1`, resuming from that frame will hit the send path again unless the saved operation key and remote lookup bridge the crash gap.

Orchestration frameworks make this split explicit. LangGraph checkpointers persist thread state at super-step intervals in SQLite or PostgreSQL so interrupted threads resume cleanly, while Temporal replays deterministic workflow histories and skips already-recorded Activity completions.[^langgraph2026checkpointers][^temporal2026workflow] If a Temporal Activity finishes its remote API call milliseconds before the worker crashes and fails to record completion, Temporal still runs that Activity again on retry, so the destination itself must be idempotent.[^temporal_activity_definition] Because neither framework checks whether an older human approval or live resource revision still holds after downtime, your executor must verify live preconditions before mutating downstream state.

## Retry reads with jittered backoff and hard deadlines

For idempotent read-only queries (`GET /runs/deploy-412`), transient overloads warrant retries, yet uncoordinated retries make outages worse. Be precise about attempt counts: a budget of three attempts means **one initial call plus at most two retries**, not three extra retries after the first failure. Even with capped attempts, 500 failing workers sleeping an identical `0.5` seconds hammer the controller together half a second later.

Exponential backoff widens the gap after each failure, and **full jitter** spreads clients uniformly across the delay window so retries desynchronize naturally, with zero-indexed failure count $k \ge 0$, base delay $T_0$, and ceiling $T_{\max}$:[^awsbackoff]

$$
T_{\text{sleep}} = \operatorname{random}\left(0, \min\left(T_{\max}, T_0 \cdot 2^k\right)\right)
$$

When an upstream server returns HTTP `429` or `503` with a `Retry-After` header, honor that value as a minimum floor. Keep in mind that `Retry-After` sets wait duration only and never makes a non-idempotent write safe to repeat.[^rfc9110RetryAfter]

> **Common mistake:** Computing `max(retry_after, jitter)` when honoring `Retry-After`. Whenever `retry_after` exceeds your jitter cap (for example `5.0s` vs `0.2s`), `max` returns `5.0s` for every worker and aligns the entire fleet into another thundering herd. Add capped jitter *on top of* `retry_after` instead, and stop immediately if the combined wait exceeds the caller's remaining deadline.

<!-- leetllm: test, output=show -->

```python title="read-retry-with-deadline.py"
import random
from dataclasses import dataclass, field

class TransientReadError(Exception):
    def __init__(self, message: str, retry_after: float = 0.0):
        super().__init__(message)
        if retry_after < 0:
            raise ValueError("retry_after must be nonnegative")
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

def retry_read(
    call,
    *,
    attempts: int = 3,
    timeout: float = 10.0,
    base: float = 0.2,
    cap: float = 2.0,
    clock: VirtualClock,
    rng: random.Random,
):
    if attempts < 1 or timeout <= 0:
        raise ValueError("attempts must be >= 1 and timeout must be > 0")
    deadline = clock.now + timeout
    ceiling = min(base, cap)

    for attempt in range(attempts):
        remaining = deadline - clock.now
        if remaining <= 0:
            raise DeadlineExceeded("caller deadline exhausted before call")
        try:
            result = call(remaining)
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
                raise DeadlineExceeded("response arrived after caller deadline")
            return result

# Verify floor + jitter disperses 8 clients while max() collapses them to one timestamp.
clamped = [max(5.0, random.Random(c).uniform(0.0, 0.2)) for c in range(8)]
spread = [5.0 + random.Random(c).uniform(0.0, 0.2) for c in range(8)]
assert len(set(clamped)) == 1 and len(set(spread)) == 8

clock = VirtualClock()
remaining_trace: list[float] = []
def fetch_deploy_status(remaining: float) -> str:
    remaining_trace.append(round(remaining, 3))
    if len(remaining_trace) < 3:
        raise TransientReadError("controller overloaded", retry_after=0.25)
    return "deploy-412 failed unit-tests"

msg = retry_read(fetch_deploy_status, clock=clock, rng=random.Random(7))
print("result:", msg)
print("waits:", [round(w, 3) for w in clock.waits], "| remaining:", remaining_trace)

# A 20s Retry-After hint against a 3s budget fails immediately without sleeping.
short_clock = VirtualClock()
short_calls = [0]
def long_backoff_hint(_remaining: float) -> str:
    short_calls[0] += 1
    raise TransientReadError("rate limited", retry_after=20.0)

try:
    retry_read(long_backoff_hint, timeout=3.0, clock=short_clock, rng=random.Random(1))
except DeadlineExceeded as exc:
    print("aborted early:", exc, "| calls:", short_calls[0], "| sleeps:", len(short_clock.waits))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
result: deploy-412 failed unit-tests
waits: [0.315, 0.31] | remaining: [10.0, 9.685, 9.375]
aborted early: required wait exceeds remaining deadline | calls: 1 | sleeps: 0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/bounded_read_retry_timeline_dark.png" alt="Line chart comparing remaining caller deadline budget in seconds against the next jittered backoff wait across retry attempts. Across early attempts the wait fits within remaining time, but by Attempt 5 the required 6.4-second wait exceeds the remaining 5.1-second budget, causing deadline-aware retry logic to stop cleanly instead of overshooting the deadline." />
  <figcaption>Each retry checks remaining wall-clock budget against the full scheduled wait (Retry-After floor plus jitter), stopping before scheduling a sleep that would overshoot the deadline.</figcaption>
</figure>

Watch out for multiplicative retries when composing SDKs, schema-repair libraries, and outer agent loops. Stacking two independent three-attempt retry loops permits up to $3 \times 3 = 9$ downstream sends for one user request. Libraries like Instructor separate structured schema re-asking from underlying SDK HTTP retries and note that library-level time or token limits do not abort active HTTP streams externally.[^instructor2026Retrying] Keep one hard deadline and cumulative spend cap in the outer host loop, and log actual wire sends.

## Distinguish forward progress from blind repetition

Calling the same tool repeatedly does not automatically mean the agent is stuck. Polling `get_deploy("deploy-412")` three times and getting the exact same error string wastes turns, whereas fetching ten paginated build log chunks gathers fresh diagnostic lines on every step. Detecting a real stall requires tracking new task-specific evidence rather than counting tool names or argument hashes.

In the monitor below, trusted tool adapters emit verified evidence tokens such as unseen log page IDs or new job states. Unchanged observations increment `stalls`, while any novel token resets `stalls` to zero. An independent `max_calls` cap still halts runs that stream endless novel pages without finishing. Stripping timestamps and paraphrased model summaries before comparison stops cosmetic rewording from posing as fresh evidence.

<!-- leetllm: test, output=show -->

```python title="progress-not-tool-count.py"
class StopRun(Exception):
    pass

class ProgressBudget:
    def __init__(self, max_calls: int = 8, max_stalls: int = 2):
        if max_calls <= 0 or max_stalls <= 0:
            raise ValueError("call and stall caps must be positive")
        self.max_calls, self.max_stalls = max_calls, max_stalls
        self.calls = 0
        self.stalls = 0
        self.seen: set[str] = set()

    def reserve_call(self) -> None:
        if self.calls >= self.max_calls or self.stalls >= self.max_stalls:
            raise StopRun("call cap or no-progress limit reached")
        self.calls += 1

    def record_evidence(self, tokens: set[str]) -> None:
        novel = tokens - self.seen
        self.stalls = 0 if novel else self.stalls + 1
        self.seen.update(tokens)

budget = ProgressBudget()
for batch in [{"status-v1"}, {"status-v1"}, {"log-page-1"}, {"log-page-1"}, {"log-page-1"}]:
    budget.reserve_call()
    budget.record_evidence(batch)

try:
    budget.reserve_call()
except StopRun as exc:
    print(f"stopped cleanly after {budget.calls} calls ({budget.stalls} stalls): {exc}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
stopped cleanly after 5 calls (2 stalls): call cap or no-progress limit reached
```
<!-- leetllm: output:end -->

When one read tool stops turning up new facts, switch to a richer diagnostic tool rather than repeating the same poll. Episodic reflection methods such as Reflexion store concise failure notes so later attempts change strategy from concrete errors.[^shinn2023] Even so, a reflection note in memory cannot grant write permission or bypass host validation.

### Track context length and cumulative spend separately

A frequent budgeting error confuses shortening a prompt with saving past spend. The context window caps **a single forward pass**, whereas token or dollar budgets track **total tokens billed across every turn**. Summarizing history shrinks *upcoming* requests, but it never refunds tokens spent on earlier turns.

Suppose every request carries a fixed $h$-token system prompt and each completed turn appends $s$ tokens of history across $n$ turns. Cumulative input tokens grow quadratically:

$$
\text{Total Input} = n \cdot h + s \cdot \frac{n(n - 1)}{2}
$$

With $h = 100$, $s = 50$, and $n = 4$, the four prompts send `100`, `150`, `200`, and `250` input tokens, totaling `700` tokens before counting generated outputs or prompt caching. Reserve worst-case cost (`input + max_output_tokens`) *before* dispatching each call. If 150 tokens remain in budget and the next request reserves 120 input plus 80 output tokens, reject dispatch up front instead of catching an overrun afterward. For parallel subcalls, draw reservations atomically from one shared budget tracker and hold unresolved timeout reservations until billing settles.

```checkpoint
An agent compresses its conversation window from 8,000 tokens down to 2,000 tokens via summarization. Did it recover 6,000 tokens of its cumulative run budget?
---
No. Compressing the prompt reduces input tokens for upcoming requests only. Prior model passes have already been consumed and billed. Track per-call context limits and cumulative run budgets independently.
```

## Protect dependencies with generation-scoped circuit breakers

Per-run budgets cap a single trajectory, yet across hundreds of concurrent sessions, independent retries still flood a broken downstream service. A <span data-glossary="circuit-breaker">circuit breaker</span> short-circuits calls to an unhealthy dependency so it can recover without absorbing constant traffic.[^azure2026CircuitBreaker]

The breaker moves across three states: **closed** passes normal traffic, **open** fails fast for a cooldown interval after dependency errors hit a threshold, and **half-open** allows one single probe after cooldown ends to test recovery. A healthy probe returns to **closed**, while a dependency error or canceled probe returns to **open**. Application errors such as `ValueError` propagate to callers and release the probe slot without marking the dependency down.

Concurrency creates a subtle race across state transitions. Suppose Call A starts under **closed** generation 4 and stalls slowly. Meanwhile Call B times out and opens generation 5. When Call A finishes seconds later with `"ok"`, that response still belongs to Call A, yet letting it reset generation 5 to **closed** would unmask a live outage. Tagging every started call with the breaker's current `generation` integer lets stale completions return cleanly to their caller without touching a newer generation. Canceling a half-open probe must likewise clear `probe_in_flight` so the breaker never wedges permanently.

<!-- leetllm: test, output=show -->

```python title="circuit-breaker-faults.py"
import asyncio

class CircuitOpen(Exception):
    pass

class CircuitBreaker:
    def __init__(self, threshold: int = 2, cooldown: float = 5.0, clock=lambda: 0.0):
        if threshold <= 0 or cooldown <= 0:
            raise ValueError("threshold and cooldown must be positive")
        self.threshold, self.cooldown, self.clock = threshold, cooldown, clock
        self.state = "closed"
        self.failures = 0
        self.generation = 0
        self.opened_at = 0.0
        self.probe_in_flight = False
        self.lock = asyncio.Lock()

    def _trip_open(self) -> None:
        self.state = "open"
        self.opened_at = self.clock()
        self.probe_in_flight = False
        self.generation += 1

    async def call(self, fn):
        async with self.lock:
            if self.state == "open":
                if self.clock() - self.opened_at < self.cooldown:
                    raise CircuitOpen("cooldown active")
                self.state = "half_open"
            if self.state == "half_open" and self.probe_in_flight:
                raise CircuitOpen("half-open probe already running")
            is_probe = self.state == "half_open"
            if is_probe:
                self.probe_in_flight = True
            call_gen = self.generation

        try:
            result = await fn()
        except (TimeoutError, ConnectionError):
            async with self.lock:
                if call_gen == self.generation:
                    self.failures += 1
                    if is_probe or self.failures >= self.threshold:
                        self._trip_open()
            raise
        except asyncio.CancelledError:
            async with self.lock:
                if call_gen == self.generation and is_probe:
                    self._trip_open()
            raise
        except BaseException:
            async with self.lock:
                if call_gen == self.generation and is_probe:
                    self.probe_in_flight = False
            raise

        async with self.lock:
            if call_gen == self.generation:
                self.state, self.failures, self.probe_in_flight = "closed", 0, False
        return result

async def exercise_breaker() -> None:
    now = [0.0]
    breaker = CircuitBreaker(threshold=1, cooldown=5.0, clock=lambda: now[0])
    started, release = asyncio.Event(), asyncio.Event()

    async def slow_ok() -> str:
        started.set()
        await release.wait()
        return "gen-0 result"

    async def down_err() -> str:
        raise TimeoutError("controller unreachable")

    stale_task = asyncio.create_task(breaker.call(slow_ok))
    await started.wait()
    try:
        await breaker.call(down_err)
    except TimeoutError:
        pass
    release.set()
    assert await stale_task == "gen-0 result" and breaker.state == "open"
    print("late completion leaves state:", breaker.state)

    now[0] = 5.0
    started.clear()
    release.clear()
    probe = asyncio.create_task(breaker.call(slow_ok))
    await started.wait()
    try:
        await breaker.call(down_err)
    except CircuitOpen:
        print("concurrent second probe: rejected")

    probe.cancel()
    try:
        await probe
    except asyncio.CancelledError:
        pass
    assert breaker.state == "open" and not breaker.probe_in_flight

    now[0] = 10.0
    release.set()
    assert await breaker.call(slow_ok) == "gen-0 result"
    print("post-cancel recovery probe:", breaker.state)

    try:
        await breaker.call(down_err)
    except TimeoutError:
        pass
    now[0] = 15.0
    async def schema_mismatch() -> str:
        raise ValueError("malformed payload from caller")
    try:
        await breaker.call(schema_mismatch)
    except ValueError:
        pass
    assert breaker.state == "half_open" and not breaker.probe_in_flight
    assert await breaker.call(slow_ok) == "gen-0 result"
    print("non-health exception probe:", breaker.state)

asyncio.run(exercise_breaker())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
late completion leaves state: open
concurrent second probe: rejected
post-cancel recovery probe: closed
non-health exception probe: closed
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/breaker_concurrent_state_dark.png" alt="State diagram for a generation-scoped circuit breaker. Calls start in Closed generation 4 while dependency failures trip Open generation 5. A delayed completion from generation 4 returns to its caller without resetting the newer Open state. After cooldown, a single half-open probe restores traffic to Closed generation 6." />
  <figcaption>Incrementing a generation counter whenever the circuit opens lets delayed responses return to their callers without falsely closing an active outage.</figcaption>
</figure>

Scope circuit breakers by dependency and error class so one noisy tenant's rate limit never blocks traffic for other customers. This in-process breaker protects one async event loop cleanly. Across multi-worker fleets, coordinate health counters in fast shared storage or budget for aggregate probe rates across independent workers.

## Build tiered fallbacks with honest evidence claims

When a primary model or downstream controller remains unreachable after retries and breaker checks, fallback tiers prevent total stalls only when they stay truthful about what they know. Swapping model providers cannot conjure live controller telemetry that never arrived. Every fallback tier preserves caller permissions, remaining deadline, and cancellation signals while narrowing its claims:

- **Backup model provider:** Normalize message roles, tool schemas, context limits, and refusal formats across providers, check data residency requirements before forwarding inputs, and run the exact same host validation on outputs.
- **Read-only or summary mode:** Fall back to a smaller model or deterministic summarizer over already-fetched logs while disabling write tools completely.
- **Freshness-checked cache or structured handoff:** Serve timestamped snapshots only within a strict age window, or pause automation and emit a redacted handoff packet when current state cannot be verified.

The formatter below keeps freshness rules in host code rather than inside model text. A `queued` observation recorded 10 seconds ago within a 30-second window can accurately say *"job-1 was queued when checked 10s ago."* A 900-second-old `completed` record or missing snapshot returns *"Current revert status is unavailable."* Letting a backup model self-report `is_fresh=True` would turn stale cache data into hallucinated live status.

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
    if max_age < 0:
        raise ValueError("max_age must be >= 0")
    if obs is None:
        return "Current revert status is unavailable."
    if (obs.deploy_id, obs.job_id) != (deploy_id, job_id):
        return "Current revert status is unavailable."
    if obs.source != "controller" or obs.state not in {"queued", "running", "completed", "failed"}:
        return "Current revert status is unavailable."
    age = now - obs.observed_at
    if age < 0 or age > max_age:
        return "Current revert status is unavailable."
    return f"{job_id} was {obs.state} when checked {age}s ago."

fresh = Observation("deploy-412", "job-1", "queued", 990, "controller")
stale = Observation("deploy-412", "job-1", "completed", 100, "controller")
for sample in (fresh, stale, None):
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
  <figcaption>Deterministic freshness checks keep 10-second snapshots cleanly dated while stopping stale 900-second records from asserting current completion.</figcaption>
</figure>

> **Key insight:** Propagate caller cancellation immediately instead of falling back to another provider behind the scenes. If the user canceled a request, starting a secondary call wastes budget and can trigger unexpected side effects.

## Report recovery outcomes without hiding unresolved load

Measuring reliability starts by refusing to fold degraded answers and human handoffs into a single "success" metric. Suppose 100 failed agent runs enter recovery: 60 finish the intended task after idempotent reconciliation, 12 return an explicitly dated degraded answer, 18 route safely to human handoff, and 10 stall unresolved. Reporting `90% success` hides both a 12% capability drop and 18 human tickets added to engineering queues.

| Recovery outcome | Count (of 100) | Operational meaning |
|---|---:|---|
| Full task completed | 60 | Downstream verifier confirms intended result |
| Degraded dated answer | 12 | Scoped fallback answer without full repair |
| Safe human handoff | 18 | Automation halted cleanly with reviewer work pending |
| Unresolved timeout | 10 | Neither task finish nor clean handoff |

Use unique runs in the denominator rather than raw attempt counts, and log deduplicated replays, ambiguity durations, stall triggers, and circuit-open drops. When handing an unresolved write to an engineer, keep the packet compact: include the operation key, canonical payload, last verified remote observation, attempts made, and redacted allowlisted context so the reviewer can inspect state without duplicating writes.

Before shipping recovery code, test every fault path via deterministic fault injection held outside agent prompts and memory:

<details>
<summary>Fault-injection verification checklist</summary>

| Injected fault | Verified system outcome |
|---|---|
| Invalid tool name or foreign deploy ID | Host validation raises before network dispatch |
| Crash before SQLite `BEGIN IMMEDIATE` commits | Zero persisted operations or queued jobs |
| Dropped reply after commit + same-key replay | Original `job-1` returned with zero extra rows |
| Same operation key paired with modified revision | `KeyConflict` raised before modifying state |
| `Retry-After` longer than remaining caller budget | Stops immediately with zero wasted sleep |
| Synchronized retry floor across 8 concurrent clients | Positive jitter added after floor disperses attempts |
| Distinct log pages vs repeated status error strings | Novel observations reset stalls while call cap holds |
| Delayed generation-0 completion after breaker opens | Caller receives value while breaker stays `open` |
| Canceled probe during half-open cooldown check | Cancellation propagates and probe slot clears for retry |
| Stale 900s `completed` cache entry during outage | Returns unavailable rather than false present claim |

</details>

## Check your understanding

Trace the dropped revert reply from the opening scenario and compare minting a new UUID on retry against replaying the original operation key with unchanged arguments. Notice what each layer actually proves: host permission checks, SQLite operation tables, workflow checkpoints, and fresh controller lookups verify different facts and cannot stand in for one another.

```mastery-quiz
[
  {
    "question": "A user asks whether a print job has finished. The runtime has permission to look up that job. The model proposes canceling it with a registered tool and valid arguments. How should the runtime handle the proposal and the user's request?",
    "options": [
      "Reject the cancellation and look up the job status.",
      "Reject the cancellation and close the task without a lookup.",
      "Dispatch the cancellation and look up the job status.",
      "Dispatch the cancellation and close the task without a lookup."
    ],
    "answer": "Reject the cancellation and look up the job status.",
    "explanation": "The user authorized a read. Both choices that dispatch the cancellation would request a change outside that scope, even though the tool accepts the arguments. Rejecting the cancellation leaves the lookup authorized. Closing the task would leave the user's question unanswered."
  },
  {
    "question": "The controller queued a job, but its reply was lost. Its idempotency guarantee is still valid. Which retry preserves the original operation?",
    "options": [
      "New operation key, unchanged payload, and new transport attempt ID.",
      "Same operation key, unchanged payload, and new transport attempt ID.",
      "Same operation key, changed parameter value, and same transport attempt ID.",
      "New operation key, changed parameter value, and same transport attempt ID."
    ],
    "answer": "Same operation key, unchanged payload, and new transport attempt ID.",
    "explanation": "Reusing the same logical operation key with the unchanged payload lets the controller recognize the retry and return the same job without duplicating work. Changing parameters conflicts with the existing key, and minting a new operation key creates another operation."
  },
  {
    "question": "A read call fails when 1.3 seconds remain before the caller's deadline. The retry rule sets the next wait to a 1.1-second Retry-After floor plus 0.4 seconds of jitter. What does deadline-aware backoff do?",
    "options": [
      "Wait 1.1 seconds because the retry fits the remaining deadline.",
      "Wait 0.4 seconds because the retry fits the remaining deadline.",
      "Compute 1.5 seconds and stop because the wait exceeds the remaining deadline.",
      "Truncate the wait to 1.3 seconds and send the retry."
    ],
    "answer": "Compute 1.5 seconds and stop because the wait exceeds the remaining deadline.",
    "explanation": "The retry rule adds the floor and jitter: 1.1 + 0.4 = 1.5 seconds, exceeding 1.3. It cannot shorten the server minimum or extend the caller deadline."
  },
  {
    "question": "A guard allows up to three consecutive no-progress observations and at most six calls. Trusted pages arrive A,A,B,B,B,C. A new page resets stalls. Which state follows before a seventh call?",
    "options": [
      "Six calls dispatched, C resets stalls, and the hard cap blocks the next call.",
      "Six calls dispatched, C resets stalls, and the guard permits the next call.",
      "Five calls dispatched because the repeated B results exhaust the three-stall limit.",
      "Six calls dispatched, C leaves two stalls, and the hard cap blocks the next call."
    ],
    "answer": "Six calls dispatched, C resets stalls, and the hard cap blocks the next call.",
    "explanation": "A is new and its repeat adds one stall. New B resets stalls, its two repeats add two stalls, and new C resets them again. Six calls have still spent the independent hard cap, so the seventh is rejected despite fresh progress."
  },
  {
    "question": "Call A begins in circuit generation 4. A later failure opens generation 5 before A succeeds. What does this implementation do with A's result and the newer circuit state?",
    "options": [
      "Return A's result to its caller and close the circuit using A's earlier generation.",
      "Return A's result to its caller and keep the circuit open in its newer generation.",
      "Discard A's result from its caller and keep the circuit open in its newer generation.",
      "Discard A's result from its caller and close the circuit using A's earlier generation."
    ],
    "answer": "Return A's result to its caller and keep the circuit open in its newer generation.",
    "explanation": "The result can belong to its caller without being current health evidence. Generation checks prevent stale completions from resetting newer state."
  },
  {
    "question": "A half-open probe sends a write. At 14:00 its caller cancels. The one-slot breaker propagates cancellation and reopens for a two-minute cooldown. At 14:03 the first new caller requests a read-only probe. No result or cancellation acknowledgment has arrived from the destination. Should the breaker allow the probe, and what can the caller record about the write at the destination?",
    "options": [
      "Hold the new probe. Record the write as unresolved.",
      "Allow the new probe. Record the write as canceled.",
      "Allow the new probe. Record the write as unresolved.",
      "Hold the new probe. Record the write as canceled."
    ],
    "answer": "Allow the new probe. Record the write as unresolved.",
    "explanation": "Cancellation frees the local slot. The cooldown ended at 14:02, so holding the first new probe at 14:03 would leave that slot blocked. The earlier write had already left the caller. The destination could have applied it before the caller canceled, so recording it as canceled would require confirmation from the destination."
  },
  {
    "question": "A trusted completed observation is 25 minutes old while the current-status freshness limit allows 90 seconds. The live controller is unavailable. Which fallback preserves an honest claim limit?",
    "options": [
      "Report completion now because the cached state is terminal.",
      "Report current status unavailable and date the earlier observation.",
      "Retry the mutation with a new key to obtain a fresh confirmation.",
      "Reset the freshness limit when switching to the backup model."
    ],
    "answer": "Report current status unavailable and date the earlier observation.",
    "explanation": "The observation is older than the declared freshness limit. Preserve the unresolved operation and distinguish the dated past fact from an unsupported present claim."
  },
  {
    "question": "A run submits a fixed 80-token prefix and adds 40 history tokens after each turn. After three requests, how many input tokens were submitted, and can the next request reserve 200 input plus 80 output from 250 remaining?",
    "options": [
      "240 submitted and accept the 280-token reservation.",
      "360 submitted and accept the 280-token reservation.",
      "480 submitted and reject the 280-token reservation.",
      "360 submitted and reject the 280-token reservation."
    ],
    "answer": "360 submitted and reject the 280-token reservation.",
    "explanation": "The three prompts have 80, 120, and 160 tokens, totaling 360. The next reservation is 200 + 80 = 280, greater than 250, so it is rejected before dispatch. This excludes output already spent and cache pricing."
  },
  {
    "question": "The payment service confirms an approved refund for a booking. The booking originally held seat 8B, but the independent seat service can reassign seats. A separate approval permits releasing 8B if this booking still holds it. Which record and approval should the agent use to decide whether to release a seat?",
    "options": [
      "Use the original booking record. Release the seat it lists under the refund approval.",
      "Read the seat service. Release the seat it lists under the refund approval.",
      "Read the seat service. Use the seat approval to release 8B if the record lists it for this booking.",
      "Use the original booking record. Use the seat approval to release 8B if the record lists it for this booking."
    ],
    "answer": "Read the seat service. Use the seat approval to release 8B if the record lists it for this booking.",
    "explanation": "The refund approval covers the payment. Using it to release a seat would exceed its scope, even after a fresh lookup. The original booking record can survive a reassignment. Before dispatch, check that the seat service still shows this booking holding 8B and that the seat approval still applies. A different seat would need its own authorization."
  }
]
```

> **Next:** Continue to [Recursive Language Models (RLM)](/learn/recursive-language-models-rlm). Apply these recovery controls to long-context programs that delegate targeted sub-calls while sharing budgets and preserving task state.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

An approved request to revert deployment `deploy-412` to `rev-17` reaches a release controller. Downstream, the controller writes `job-1` into storage and sends back confirmation, then the network drops before that reply arrives. Your agent sees only an ambiguous timeout while `job-1` is already queued.

Two tempting shortcuts turn that timeout into an incident. Retrying blindly with a fresh request can schedule a second overlapping revert on top of `job-1`. Reporting that the revert succeeded misleads operators when the controller has at most queued a job. Claiming the revert failed cleanly is equally wrong when work is already underway downstream.

All three mistakes come from replacing missing network feedback with a confident guess. Reliable recovery keeps that uncertainty explicit until the runtime inspects downstream state using a durable operation key. While the previous chapter protected human approvals across pauses, this chapter handles failures inside execution itself.

## Diagnose which stage failed first

On the surface, every fault looks like *"the agent could not finish."* Underneath, three distinct stages fail for completely different reasons, and treating a permission denial like a dropped socket makes things worse:

1. **Proposal check before dispatch:** Missing arguments, unknown tool names, or unauthorized targets fail inside host code before hitting the network. If the task still allows it, return the exact error to the model and pass its revised call through the same permission check.
2. **Transport and remote commit:** Timeouts, connection resets, and `502`/`503` overload errors leave writes uncertain because the server may have committed right before the socket closed. Reads can retry under a hard deadline, while writes must look up or replay a stable operation key before doing anything else.
3. **Interpreting partial results:** Receiving HTTP `200` alongside `state="queued"` only confirms queue placement, never finished deployment. Wait for worker updates or report `queued` directly.

## Give every write one stable operation key

An operation is *idempotent* when repeating it produces the exact same outcome as running it once. Attaching a header buys nothing unless the server recognizes repeated keys, checks that arguments match, and stores the key alongside its side effect inside one transaction.[^awsIdempotentApis2026] Minting a fresh UUID on every HTTP retry tricks the server into running duplicate work. Pair one logical action with one stable operation key, and rotate only per-attempt trace IDs.

In the SQLite controller below, a single `BEGIN IMMEDIATE` transaction closes both dropped-reply and concurrency races.[^sqliteTransactions2026] A pre-commit fault leaves zero stray rows, a post-commit drop stays discoverable via lookup, and changing `rev-17` to `rev-16` under the same key raises `KeyConflict`.

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
                CREATE TABLE IF NOT EXISTS jobs (
                    id INTEGER PRIMARY KEY,
                    payload TEXT NOT NULL,
                    state TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS operations (
                    op_key TEXT PRIMARY KEY,
                    payload TEXT NOT NULL,
                    job_id INTEGER NOT NULL REFERENCES jobs(id)
                );
            """)

    def enqueue(self, op_key: str, deploy_id: str, revision: str, fault: str | None = None) -> str:
        payload = json.dumps({"deploy_id": deploy_id, "revision": revision}, sort_keys=True)
        with closing(sqlite3.connect(self.db_path)) as db, db:
            db.execute("BEGIN IMMEDIATE")
            existing = db.execute(
                "SELECT payload, job_id FROM operations WHERE op_key = ?", (op_key,)
            ).fetchone()
            if existing:
                if existing[0] != payload:
                    raise KeyConflict("same operation key cannot reuse changed arguments")
                return f"job-{existing[1]}"
            job_id = db.execute(
                "INSERT INTO jobs(payload, state) VALUES (?, 'queued')", (payload,)
            ).lastrowid
            db.execute("INSERT INTO operations VALUES (?, ?, ?)", (op_key, payload, job_id))
            if fault == "before_commit":
                raise TimeoutError("connection dropped before commit")
        if fault == "after_commit":
            raise TimeoutError("confirmation lost after commit")
        return f"job-{job_id}"

    def lookup(self, op_key: str) -> tuple[str, str] | None:
        with closing(sqlite3.connect(self.db_path)) as db:
            row = db.execute(
                "SELECT jobs.id, jobs.state FROM operations JOIN jobs ON jobs.id = operations.job_id WHERE op_key = ?",
                (op_key,),
            ).fetchone()
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

    try:
        ctrl.enqueue("rb-413-1", "deploy-413", "rev-17", fault="before_commit")
    except TimeoutError:
        pass
    print("Uncommitted key exists?:", ctrl.lookup("rb-413-1") is not None)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Caller saw timeout
Lookup: ('job-1', 'queued')
Same-key replay: job-1
Changed payload blocked: same operation key cannot reuse changed arguments
Uncommitted key exists?: False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/timeout_recovery_fork_dark.png" alt="State diagram for recovering an uncertain timeout after dispatching deploy-rev-17 with a stable operation key. Instead of retrying blindly, recovery queries remote state by operation key: already queued jobs keep their existing record, unobserved requests replay safely with the same key, and changed arguments trigger a 409 conflict halt." />
  <figcaption>Once a reply drops, reconcile remote state by operation key before acting: return found jobs, replay unchanged operations, or reject mismatched parameters.</figcaption>
</figure>

Check API semantics before relying on retry safety. Stripe's v1 API caches both successes and server errors on idempotency keys and can prune them after 24 hours, whereas v2 handles transient server retries differently.[^stripe2026IdempotentRequests] Likewise, neither LangGraph checkpoints nor Temporal workflow replay undoes side effects that already ran before a local crash, so side-effecting activities still require destination idempotency and live precondition checks.[^langgraph2026checkpointers][^temporal2026workflow][^temporal_activity_definition]

## Retry reads with jitter and one hard deadline

For safe read-only lookups, waiting a fixed interval aligns failing clients into synchronized load spikes. Pairing exponential backoff with full jitter samples delays uniformly across the current window so clients fan out over time, capped at $T_{\max}$ from base delay $T_0$ on retry $k$:[^awsbackoff]

$$
T_{\text{sleep}} = U\left(0, \min\left(T_{\max}, T_0 \cdot 2^k\right)\right)
$$

When a service sends a `Retry-After` header, treat it as a floor and add jitter *above* it rather than computing `max(hint, jitter)`.[^rfc9110RetryAfter] Whenever `retry_after` exceeds your jitter ceiling, `max` forces every worker onto the same wake-up timestamp and recreates a thundering herd. Check the combined wait against the caller's remaining deadline so retries never hang past timeout.

<!-- leetllm: test, output=show -->

```python title="recovery-retry.py"
import random
from dataclasses import dataclass, field

class TransientReadError(Exception):
    def __init__(self, message: str, retry_after: float = 0.0):
        super().__init__(message)
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
    deadline = clock.now + timeout
    ceiling = min(base, cap)
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

clock = SimClock()
calls = 0
def flaky_status(rem: float) -> str:
    global calls
    calls += 1
    if calls < 3:
        raise TransientReadError("busy", retry_after=0.25)
    return f"ok with {rem:.2f}s left"

print(retry_read(flaky_status, clock=clock, rng=random.Random(7)))
print("waits:", [round(w, 3) for w in clock.waits])

# Long Retry-After hint exceeds the 3s budget, stopping with zero sleeps.
short_clock = SimClock()
def long_wait(_rem: float) -> str:
    raise TransientReadError("overloaded", retry_after=20.0)

try:
    retry_read(long_wait, timeout=3.0, clock=short_clock, rng=random.Random(1))
except DeadlineExceeded as exc:
    print("aborted:", exc, "| sleeps:", len(short_clock.waits))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ok with 9.37s left
waits: [0.315, 0.31]
aborted: wait exceeds remaining deadline | sleeps: 0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/bounded_read_retry_timeline_dark.png" alt="Line chart comparing remaining caller deadline budget in seconds against the next jittered backoff wait across retry attempts. Across early attempts the wait fits within remaining time, but by Attempt 5 the required 6.4-second wait exceeds the remaining 5.1-second budget, causing deadline-aware retry logic to stop cleanly instead of overshooting the deadline." />
  <figcaption>Comparing the full scheduled wait against the remaining caller deadline stops retries from overshooting timeouts.</figcaption>
</figure>

## Separate progress detection from blind repetition

Polling `get_deploy` for identical status JSON wastes turns, whereas fetching successive paginated log chunks collects new evidence on every call. Measure task progress using deduplicated evidence tokens from trusted adapters rather than tool counts, while keeping an independent call cap and pre-flight spend reservation. Summarizing prompt history shrinks only the *next* request and never refunds tokens spent on earlier turns, so track single-call context windows and cumulative spend separately.

## Stop hammering down dependencies with circuit breakers

When a downstream service stays broken across requests, retries waste deadlines and delay recovery. A *circuit breaker* passes calls while **closed**, trips **open** to fail fast across a cooldown once failures hit threshold, and tests recovery with a single **half-open** probe afterward.[^azure2026CircuitBreaker]

Two concurrency details separate reliable breakers from fragile ones. Tagging each call with an integer `generation` stops a slow response started under generation 0 from closing an **open** breaker later tripped by generation 1. Cleaning up the probe slot when a task cancels ensures an interrupted probe never locks out future recovery checks.

<!-- leetllm: test, output=show -->

```python title="recovery-breaker.py"
import asyncio

class CircuitOpen(Exception):
    pass

class CircuitBreaker:
    def __init__(self, threshold: int = 1, cooldown: float = 5.0, clock=lambda: 0.0):
        self.threshold, self.cooldown, self.clock = threshold, cooldown, clock
        self.state, self.failures, self.generation = "closed", 0, 0
        self.opened_at = 0.0
        self.probe_busy = False
        self.lock = asyncio.Lock()

    def _open(self) -> None:
        self.state = "open"
        self.opened_at = self.clock()
        self.probe_busy = False
        self.generation += 1

    async def call(self, fn):
        async with self.lock:
            if self.state == "open":
                if self.clock() - self.opened_at < self.cooldown:
                    raise CircuitOpen("cooldown active")
                self.state = "half_open"
            if self.state == "half_open" and self.probe_busy:
                raise CircuitOpen("probe already in flight")
            is_probe = self.state == "half_open"
            if is_probe:
                self.probe_busy = True
            gen = self.generation

        try:
            res = await fn()
        except (TimeoutError, ConnectionError):
            async with self.lock:
                if gen == self.generation:
                    self.failures += 1
                    if is_probe or self.failures >= self.threshold:
                        self._open()
            raise
        except asyncio.CancelledError:
            async with self.lock:
                if gen == self.generation and is_probe:
                    self._open()
            raise
        except BaseException:
            async with self.lock:
                if gen == self.generation and is_probe:
                    self.probe_busy = False
            raise

        async with self.lock:
            if gen == self.generation:
                self.state, self.failures, self.probe_busy = "closed", 0, False
        return res

async def demo() -> None:
    now = [0.0]
    breaker = CircuitBreaker(threshold=1, cooldown=5.0, clock=lambda: now[0])
    started, release = asyncio.Event(), asyncio.Event()

    async def slow() -> str:
        started.set()
        await release.wait()
        return "old result"

    async def unavailable() -> str:
        raise TimeoutError("dependency down")

    old = asyncio.create_task(breaker.call(slow))
    await started.wait()
    try:
        await breaker.call(unavailable)
    except TimeoutError:
        pass
    release.set()
    assert await old == "old result" and breaker.state == "open"
    print("Late success leaves:", breaker.state)

    now[0] = 5.0
    started.clear()
    release.clear()
    probe = asyncio.create_task(breaker.call(slow))
    await started.wait()
    probe.cancel()
    try:
        await probe
    except asyncio.CancelledError:
        pass
    assert breaker.state == "open" and not breaker.probe_busy

    now[0] = 10.0
    release.set()
    assert await breaker.call(slow) == "old result"
    print("After new probe:", breaker.state)

asyncio.run(demo())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Late success leaves: open
After new probe: closed
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/breaker_concurrent_state_dark.png" alt="State diagram for a generation-scoped circuit breaker. Calls start in Closed generation 4 while dependency failures trip Open generation 5. A delayed completion from generation 4 returns to its caller without resetting the newer Open state. After cooldown, a single half-open probe restores traffic to Closed generation 6." />
  <figcaption>A generation tag lets stale completions return cleanly to their own caller while protecting newer open circuit state.</figcaption>
</figure>

> **Key insight:** A stale success can still be valid data for the caller that waited on it, without being valid evidence that the downstream service is healthy now.

## Make smaller claims when live data disappears

Switching to a backup model provider swaps inference hosts only. It never creates controller telemetry, enlarges permissions, or resets caller deadlines. Enforce freshness limits in host code so cached reads carry explicit timestamps when recent and refuse present-tense certainty when data grows stale or vanishes.

<figure>
  <img src="illustrations/_generated/fallback_evidence_freshness_dark.png" alt="Flow diagram showing evidence-age checks during fallback when the live controller is unreachable. Observations within the 30-second freshness window can report dated past state such as queued 10 seconds ago, while stale 900-second or missing snapshots are blocked from claiming present completion and routed to explicit human handoff." />
  <figcaption>Freshness-checked fallbacks separate recent timestamped observations from stale caches that must route to honest handoffs.</figcaption>
</figure>

When live verification vanishes, hand off a concise, redacted packet containing the operation key, exact payload, last verified timestamp, and pause reason so reviewers inspect state instead of duplicating writes. Remember that compensation is an independent forward action: uncordoning a Kubernetes node opens future scheduling without restoring evicted pods, and timeouts during Saga compensation need the same operation-key discipline.[^kubernetes2026DrainNode][^azure2026CompensatingTransaction] Finally, report full completion separately from degraded answers, safe handoffs, and unresolved faults so `60%` task completion and `18%` human handoff stay visible rather than collapsing into an inflated metric.

## Verify every fault path systematically

Test recovery logic with deterministic fault injection stored outside model context so tests exercise actual runtime code rather than prompt hints:

| Injected fault | Expected observed outcome |
|---|---|
| Failure before SQLite commit | Zero persisted operations or queued jobs |
| Dropped confirmation after commit + replay | Same `job-1` returned with zero extra jobs |
| Reused key paired with altered revision | `KeyConflict` error and zero second job |
| `Retry-After` longer than remaining timeout | Immediate stop with zero sleeps |
| Novel log chunks from same paginated tool | Stall budget resets while hard call cap holds |
| Slow old completion after breaker trips open | Caller receives response while breaker stays open |
| Canceled half-open probe | Cancellation propagates and probe slot clears |
| Stale `completed` cache entry during outage | Refuses present completion claim cleanly |

## What you can build now

You now have a complete recovery toolkit for production agents: validate every proposal before dispatch, classify failing stages, anchor ambiguous writes to durable operation keys, cap retries with jitter and deadlines, protect down services with generation-scoped breakers, and report degraded or handoff states honestly.

This closes the agents chapter sequence. Restricted tool wrappers, validated schemas, capped loops, managed context, injection defenses, checkpointed human review, and honest failure recovery work together when every step verifies what it knows instead of guessing. Additional concurrency races, progress counters, and fault checklists live in the [complete online chapter](/learn/agent-failure-states-retry-fallback?view=online). Next, follow agent requests down into the inference serving engine, where prompt prefill, KV caches, and shared scheduling determine latency and cost.

> **Next:** Continue to [Inference Mechanics: TTFT, TPS & KV Cache](/learn/inference-mechanics-ttft-tps-kv-cache).

<!-- leetllm: edition:reader:end -->
