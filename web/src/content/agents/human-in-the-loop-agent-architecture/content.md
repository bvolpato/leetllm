---
{
  "id": "human-in-the-loop-agent-architecture",
  "slug": "human-in-the-loop-agent-architecture",
  "title": "Human-in-the-Loop Agent Architecture",
  "shortDescription": "An agent proposes a risky change. Learn to pause it for review, bind the exact proposal to a reviewer identity, and check live state before writing.",
  "difficulty": "Hard",
  "category": "LLM Agents & Tool Use",
  "section": "Advanced Agents & Retrieval",
  "coverImage": "illustrations/_generated/human_in_loop_dark.png",
  "companies": [
    "Shopify",
    "Plaid",
    "Google",
    "Anthropic",
    "GitHub",
    "Linear"
  ],
  "prerequisites": [
    "agentic-architectures-react-plan-execute",
    "function-calling-tool-use-llms",
    "guardrails-safety-filters-production",
    "computer-use-gui-browser-agents"
  ],
  "relatedQuestions": [
    "ai-coding-workflow-with-agents",
    "multi-agent-dags-langgraph-orchestration",
    "agent-failure-states-retry-fallback",
    "observability-monitoring-llm-systems"
  ],
  "order": 11,
  "keyConceptsTested": [
    "Approval Workflows",
    "Checkpoint/Resume",
    "Risk Classification",
    "Approval Routing",
    "Async Agent Execution",
    "Temporal Workflows",
    "Optimistic Concurrency Control",
    "State Persistence",
    "Input Validation",
    "Intervention Latency",
    "Reviewer Workload Metrics"
  ]
}
---

<!-- leetllm: edition:reference:start -->

A release agent proposes promoting `recommendation-reranker-v17` from a shadow deployment into a production canary serving 25% of live traffic. Team rules require human sign-off before shifting production traffic, so the agent pauses and emits this structured proposal:

```text title="canary-proposal.txt"
promote_model(
  model_id="recommendation-reranker-v17",
  from_stage="shadow",
  to_stage="canary",
  traffic_percent=25,
)
```

The fastest shortcut is posting a chat modal asking *"Approve routing 25% of traffic to reranker-v17?"* with a callback button. That looks like a safety check until four everyday failures break it in production:

- **Review fatigue:** Dozens of low-risk alerts train engineers to click through without reading parameters.
- **Worker restarts:** If a reviewer takes 45 minutes to answer, a container restart wipes in-memory wait state and orphans the workflow.
- **Live state drift:** If another engineer ships an emergency patch moving the cluster from revision 41 to revision 42 during that 45-minute wait, executing the approved plan blindly overwrites the newer fix.
- **Hostile context:** An attached ticket or incident note can carry <span data-glossary="prompt-injection">prompt injection</span> or spoofed alert banners aimed at rushing a click.[^owaspExcessiveAgency2025]

Fixing all four requires replacing a stateless button with durable checkpoints, cryptographic payload digests, atomic outbox writes, and live preconditions checked at commit time.

## Route actions by blast radius and undo cost

Interrupting an engineer for every tool call wrecks latency and trains reviewers to skim. Effective <span data-glossary="human-in-the-loop">human-in-the-loop</span> systems sort tool calls along two axes: **blast radius** (how many users or downstream services feel the change) and **undo cost** (whether reverting restores prior state cleanly without data loss). Checking those two dimensions before queuing work saves human attention for mutations that genuinely carry operational weight.

<figure>
  <img src="illustrations/_generated/action_risk_matrix_dark.png" alt="Four-quadrant action risk matrix plotting agent tool calls by blast radius on the horizontal axis and reversibility cost on the vertical axis. Low-scope reversible tools auto-execute, irreversible low-scope changes log and notify, reversible wide-scope shifts require single human approval, and wide irreversible mutations require dual approval plus precondition locks." />
  <figcaption>Risk-based routing separates cheap, reversible inspection calls from wide-scope or irreversible mutations that require pre-execution locks and sign-off.</figcaption>
</figure>

Read-only tools like `git_diff` or test runners (`pytest`) sit in the bottom-left quadrant and run automatically. Wide-scope canary traffic shifts and feature-flag flips sit in the bottom-right quadrant: they touch live traffic immediately, yet revert quickly, making single authenticated approval appropriate. Irreversible production mutations such as dropping columns, rotating root keys, or granting broad IAM permissions sit in the top-right quadrant and demand dual review, short expiry timers, and strict version checks.

Deferral thresholds also control queue health when an agent scores uncertainty or risk before pausing for a human. Setting the threshold too low floods reviewers with routine traffic, driving queue load past 70% and inviting rubber-stamping. Setting it too high keeps queues quiet while letting rare high-impact errors slip past unreviewed.

<figure>
  <img src="illustrations/_generated/deferral_threshold_curve_dark.png" alt="Line chart plotting human review load and unreviewed high-risk mutations across risk threshold settings from 0.2 to 0.9. Raising the threshold drops reviewer load from 74 percent to 5 percent while increasing unreviewed risk from 2 percent to 39 percent, favoring calibrated operating thresholds plus reversible canary limits." />
  <figcaption>Lowering the deferral threshold cuts missed tail risk at the cost of overwhelming reviewers. Pairing a balanced threshold with narrow blast-radius steps keeps both metrics manageable.</figcaption>
</figure>

Keep the routing logic in deterministic host code outside the model prompt. In the classifier below, tool name, target stage, and traffic percentage decide whether a proposal runs automatically, requires single or dual approval, or is denied outright.

<!-- leetllm: test, output=show -->

```python title="classify-action-risk.py"
from dataclasses import dataclass
from enum import Enum

class ReviewTier(str, Enum):
    AUTO = "auto"
    SINGLE_REVIEW = "single_review"
    DUAL_REVIEW = "dual_review"
    DENY = "deny"

@dataclass(frozen=True)
class ActionProposal:
    tool: str
    stage: str
    traffic_percent: int
    reversible: bool

def classify_proposal(proposal: ActionProposal) -> ReviewTier:
    if proposal.tool in {"read_logs", "git_diff", "run_tests"}:
        return ReviewTier.AUTO
    if proposal.tool == "drop_table":
        return ReviewTier.DENY if proposal.stage == "production" else ReviewTier.DUAL_REVIEW
    if proposal.tool != "promote_model":
        return ReviewTier.DUAL_REVIEW
    if not proposal.reversible or proposal.traffic_percent > 25:
        return ReviewTier.DUAL_REVIEW
    return ReviewTier.SINGLE_REVIEW if proposal.stage == "canary" else ReviewTier.AUTO

cases = [
    ActionProposal("git_diff", "local", 0, True),
    ActionProposal("promote_model", "canary", 25, True),
    ActionProposal("promote_model", "canary", 50, True),
    ActionProposal("drop_table", "production", 100, False),
]
for item in cases:
    print(f"{item.tool} ({item.stage}, {item.traffic_percent}%): {classify_proposal(item).value}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
git_diff (local, 0%): auto
promote_model (canary, 25%): single_review
promote_model (canary, 50%): dual_review
drop_table (production, 100%): deny
```
<!-- leetllm: output:end -->

Because routing operates strictly on structured parameters outside the prompt, cautious wording from the model can never downgrade a production schema change into an auto-approved step.

## Track a durable lifecycle, not a Boolean

Human review happens on human timescales: minutes, hours, or the next morning. Holding an open coroutine or worker thread in memory fails as soon as a pod restarts or scales down. Durable review models approval as a persistent state machine stored in checkpoints or a database table so idle requests consume zero worker RAM and survive arbitrary restarts.

<figure>
  <img src="illustrations/_generated/human_in_loop_dark.png" alt="State diagram of a durable human-in-the-loop workflow. An agent saves checkpoint v3 and pauses for human review. The reviewer either cancels or edits into a new digest with zero unapproved writes, or atomically commits an authorization and outbox token. Execution checks live preconditions with compare-and-swap, routing timeouts to remote reconciliation by operation key." />
  <figcaption>Durable orchestration separates checkpointed suspension, atomic authorization persistence, live compare-and-swap verification, and remote timeout reconciliation.</figcaption>
</figure>

A pending request moves through four explicit phases instead of toggling a Boolean flag:

1. **Checkpoint and pause:** Persist thread state, freeze a canonical snapshot of the proposed tool call, attach a unique operation key and expiry timestamp, and exit the worker cleanly.
2. **Scoped decision:** An authenticated reviewer inspects host-verified parameters and either rejects the request, lets it expire, edits parameters into a fresh version with a new digest, or authorizes the exact pending version.
3. **Atomic outbox and dispatch:** Commit both the granted status and a resume message inside a single database transaction so a crash right after clicking Approve never strands an approved workflow.
4. **Live check and reconciliation:** Before mutating production, verify expiry and apply an optimistic compare-and-swap check against the live target revision. If a network timeout makes dispatch uncertain, poll the target by operation key before retrying.

Durable workflow engines handle suspension directly, though their replay semantics differ. In <span data-glossary="langgraph">LangGraph</span>, a graph paired with a SQLite or PostgreSQL checkpointer saves state before pausing at `interrupt()`, freeing the worker until `Command(resume=...)` reloads the thread.[^langgraph2024][^langgraph2026persistence]

> **Common mistake:** Putting a mutating API call inside the same LangGraph node before `interrupt()`. When a node resumes from an interrupt, LangGraph re-runs that node from its top line. Place side effects in a dedicated post-approval node so resume replay never fires duplicate writes.

<!-- leetllm: test, output=show, deps=langgraph==1.2.12,langgraph-checkpoint-sqlite==3.1.1 -->

```python title="langgraph-checkpoint-resume.py"
import sqlite3
import tempfile
from pathlib import Path
from typing import TypedDict

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

class ReleaseState(TypedDict):
    proposal_id: str
    model_id: str
    traffic_percent: int
    revision: int
    approved_by: str
    applied: list[str]

def review_step(state: ReleaseState) -> dict:
    # interrupt() raises a graph pause and persists checkpoint state to SQLite.
    decision = interrupt({
        "proposal_id": state["proposal_id"],
        "model_id": state["model_id"],
        "traffic_percent": state["traffic_percent"],
        "expected_revision": state["revision"],
    })
    if decision.get("status") != "authorized":
        return {"approved_by": "none"}
    return {"approved_by": decision["reviewer"]}

def apply_canary(state: ReleaseState) -> dict:
    if state["approved_by"] == "none":
        return {}
    entry = f"{state['model_id']}->{state['traffic_percent']}%@rev{state['revision']}"
    return {"applied": [*state["applied"], entry]}

builder = StateGraph(ReleaseState)
builder.add_node("review_step", review_step)
builder.add_node("apply_canary", apply_canary)
builder.add_edge(START, "review_step")
builder.add_edge("review_step", "apply_canary")
builder.add_edge("apply_canary", END)

with tempfile.TemporaryDirectory() as tmpdir:
    db_path = Path(tmpdir) / "checkpoints.sqlite"
    with sqlite3.connect(db_path, check_same_thread=False) as conn:
        graph = builder.compile(checkpointer=SqliteSaver(conn))
        config = {"configurable": {"thread_id": "release-thread-17"}}
        paused = graph.invoke(
            {
                "proposal_id": "apr_17",
                "model_id": "reranker-v17",
                "traffic_percent": 25,
                "revision": 41,
                "approved_by": "pending",
                "applied": [],
            },
            config=config,
        )
        print("paused interrupts:", [item.value["proposal_id"] for item in paused["__interrupt__"]])

    # Reopen SQLite from a fresh connection, simulating a separate worker after restart.
    with sqlite3.connect(db_path, check_same_thread=False) as fresh_conn:
        restarted_graph = builder.compile(checkpointer=SqliteSaver(fresh_conn))
        resumed = restarted_graph.invoke(
            Command(resume={"status": "authorized", "reviewer": "release-lead-2"}),
            config={"configurable": {"thread_id": "release-thread-17"}},
        )
        print("resumed applied:", resumed["applied"])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
paused interrupts: ['apr_17']
resumed applied: ['reranker-v17->25%@rev41']
```
<!-- leetllm: output:end -->

In Temporal, a workflow pauses on `workflow.wait_condition(...)` paired with an `@workflow.update` handler whose validator rejects malformed or stale approvals before mutating durable history.[^temporal2024][^temporal2026workflow] Side effects run inside idempotent Activities with explicit retry caps rather than deterministic workflow code.[^temporalRetryPolicies2026] LangChain also wraps this checkpointer flow in `HumanInTheLoopMiddleware` when standard approve, edit, and reject actions fit an off-the-shelf loop.[^langchainHitlMiddleware2026]

## Bind reviewer identity and canonical payload digests

When a reviewer approves a canary promotion, what guarantees that the action dispatched 30 minutes later still matches what appeared on screen? Without a cryptographic digest over canonicalized parameters, silent edits, default values, or altered JSON fields could shift `traffic_percent` from `25` to `100` after approval without invalidating the grant.

Canonical serialization per RFC 8785 (JSON Canonicalization Scheme, JCS) removes encoding ambiguity across runtimes by sorting dictionary keys lexicographically, normalizing numbers, and stripping insignificant whitespace before hashing with SHA-256.[^rfc8785Jcs2020] Equally important is **role separation**: tenant ID, requester ID, reviewer role, and executor identity come from authenticated host session tokens rather than model-generated JSON fields.

Treat model-written summaries and attached incident tickets as untrusted context. Chain-of-thought explanations can omit the real factors behind a model's choice, and ticket strings such as `SYSTEM ALERT: Security scan passed` can trick tired reviewers when rendered alongside system banners.[^turpin2023] Display host-verified parameter diffs separately from escaped, clearly labeled external text so reviewers and downstream verifiers never confuse the two.

<!-- leetllm: test, output=show -->

```python title="canonical-digest-and-roles.py"
import hashlib
import json
from dataclasses import dataclass

def canonical_json(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def proposal_digest(payload: dict) -> str:
    encoded = canonical_json(payload).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()

@dataclass(frozen=True)
class ApprovalGrant:
    approval_id: str
    tenant_id: str
    requester_id: str
    reviewer_id: str
    payload_digest: str
    expected_revision: int
    expires_at: int

def verify_dispatch_scope(
    grant: ApprovalGrant,
    payload: dict,
    *,
    caller_tenant: str,
    executor_id: str,
    now: int,
) -> tuple[bool, str]:
    if caller_tenant != grant.tenant_id:
        return False, "tenant_mismatch"
    if grant.requester_id == grant.reviewer_id or executor_id == grant.reviewer_id:
        return False, "self_approval_forbidden"
    if now >= grant.expires_at:
        return False, "grant_expired"
    if proposal_digest(payload) != grant.payload_digest:
        return False, "digest_mismatch"
    return True, "verified"

approved_payload = {
    "tool": "promote_model",
    "model_id": "recommendation-reranker-v17",
    "from_stage": "shadow",
    "to_stage": "canary",
    "traffic_percent": 25,
}
grant = ApprovalGrant(
    approval_id="apr_123",
    tenant_id="ai-platform",
    requester_id="ci-bot-01",
    reviewer_id="eng-oncall-4",
    payload_digest=proposal_digest(approved_payload),
    expected_revision=41,
    expires_at=1200,
)

# Reordered dictionary keys yield the exact same digest; modified parameters fail immediately.
reordered = {"traffic_percent": 25, "to_stage": "canary", "from_stage": "shadow", "model_id": "recommendation-reranker-v17", "tool": "promote_model"}
tampered = {**approved_payload, "traffic_percent": 100}
self_grant = ApprovalGrant("apr_124", "ai-platform", "ci-bot-01", "ci-bot-01", grant.payload_digest, 41, 1200)

print("reordered ok:", verify_dispatch_scope(grant, reordered, caller_tenant="ai-platform", executor_id="deploy-worker", now=1100))
print("tampered:", verify_dispatch_scope(grant, tampered, caller_tenant="ai-platform", executor_id="deploy-worker", now=1100))
print("expired:", verify_dispatch_scope(grant, reordered, caller_tenant="ai-platform", executor_id="deploy-worker", now=1200))
print("self-approved:", verify_dispatch_scope(self_grant, reordered, caller_tenant="ai-platform", executor_id="deploy-worker", now=1100))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reordered ok: (True, 'verified')
tampered: (False, 'digest_mismatch')
expired: (False, 'grant_expired')
self-approved: (False, 'self_approval_forbidden')
```
<!-- leetllm: output:end -->

Enforcing separation of duties (`requester != reviewer` and `executor != reviewer`) in backend storage stops an injected tool sequence from signing off on its own privileged write. Any mismatch on tenant, role, expiry, or digest halts dispatch before network calls begin.

## Commit decisions and outbox triggers atomically

Dual-write bugs break approval pipelines quietly under concurrency or crashes. If a backend updates an approval row to `authorized` in one step and publishes a resume event to a queue in a second step, a crash between the two leaves the approval marked `authorized` while the workflow sleeps forever. Checking `status == 'pending'` when opening the review page also lets two concurrent reviewers click Approve together and enqueue duplicate jobs.

<figure>
  <img src="illustrations/_generated/atomic_decision_outbox_dark.png" alt="Sequence diagram showing two concurrent reviewers competing for approval apr_123 at version 3 inside SQLite BEGIN IMMEDIATE. Reviewer A updates status to authorized and inserts outbox message apr_123:v3 in one atomic transaction. Reviewer B sees zero pending rows and receives conflict 409. The worker reads the committed outbox token and dispatches with a stable operation key." />
  <figcaption>A conditional status transition paired with a transactional outbox insert guarantees at most one winning approval matched one-for-one with a resume event.</figcaption>
</figure>

The transactional outbox pattern eliminates both races. Inside one `BEGIN IMMEDIATE` SQLite transaction, the backend runs a conditional update (`WHERE approval_id = ? AND version = ? AND status = 'pending' AND expires_at > ?`) and verifies `rowcount == 1` before inserting a resume row into `outbox`.[^sqliteTransactions2026] A competing click blocks until the first commits, matches zero pending rows, and returns a conflict. If a crash strikes mid-transaction, SQLite rolls both tables back together.

<!-- leetllm: test, output=show -->

```python title="atomic-outbox-sqlite.py"
import sqlite3

def setup_db() -> sqlite3.Connection:
    conn = sqlite3.connect(":memory:", isolation_level=None)
    conn.execute("""
        CREATE TABLE approvals (
            approval_id TEXT PRIMARY KEY,
            version INTEGER NOT NULL,
            digest TEXT NOT NULL,
            status TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            reviewer TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE outbox (
            message_key TEXT PRIMARY KEY,
            approval_id TEXT NOT NULL,
            version INTEGER NOT NULL,
            op_key TEXT NOT NULL
        )
    """)
    conn.execute(
        "INSERT INTO approvals VALUES ('apr_123', 3, 'sha256:9f3c', 'pending', 120, NULL)"
    )
    return conn

def decide_and_enqueue(
    conn: sqlite3.Connection,
    approval_id: str,
    version: int,
    digest: str,
    reviewer: str,
    now: int,
    fail_before_commit: bool = False,
) -> str:
    conn.execute("BEGIN IMMEDIATE")
    try:
        cur = conn.execute(
            """
            UPDATE approvals
            SET status = 'authorized', reviewer = ?
            WHERE approval_id = ? AND version = ? AND digest = ?
              AND status = 'pending' AND expires_at > ?
            """,
            (reviewer, approval_id, version, digest, now),
        )
        if cur.rowcount != 1:
            conn.execute("ROLLBACK")
            return "conflict_not_pending"

        conn.execute(
            "INSERT INTO outbox VALUES (?, ?, ?, ?)",
            (f"{approval_id}:v{version}", approval_id, version, f"op-{approval_id}-v{version}"),
        )
        if fail_before_commit:
            raise RuntimeError("injected crash after outbox insert")
        conn.execute("COMMIT")
        return "authorized"
    except Exception:
        conn.execute("ROLLBACK")
        return "rolled_back"

conn = setup_db()
print("first reviewer:", decide_and_enqueue(conn, "apr_123", 3, "sha256:9f3c", "rev-a", now=100))
print("second reviewer:", decide_and_enqueue(conn, "apr_123", 3, "sha256:9f3c", "rev-b", now=101))
print("outbox rows:", conn.execute("SELECT message_key, op_key FROM outbox").fetchall())

fail_conn = setup_db()
print("crash run:", decide_and_enqueue(fail_conn, "apr_123", 3, "sha256:9f3c", "rev-a", now=100, fail_before_commit=True))
print("crash state:", fail_conn.execute("SELECT status FROM approvals").fetchone(), fail_conn.execute("SELECT count(*) FROM outbox").fetchone())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
first reviewer: authorized
second reviewer: conflict_not_pending
outbox rows: [('apr_123:v3', 'op-apr_123-v3')]
crash run: rolled_back
crash state: ('pending',) (0,)
```
<!-- leetllm: output:end -->

Every winning approval creates exactly one outbox record, while conflicts and crashes leave the database untouched. A separate background dispatcher polls `outbox` and sends the durable `op_key` to the downstream executor without holding database locks across network I/O.

## Recheck live preconditions at write time

Even with a valid reviewer identity, matching SHA-256 digest, and unexpired timestamp, executing a grant blindly can still corrupt production if the target changed while waiting in the queue. A proposal drafted against revision 41 authorizes transitioning *from revision 41*, not overwriting whatever revision sits live 45 minutes later.

<figure>
  <img src="illustrations/_generated/intent_and_live_state_dark.png" alt="Diagram comparing an immutable approval snapshot against a mutating live deployment. Proposal v3 records digest sha256=9f3c and requires revision 41. Between approval and execution, another writer moves live state from revision 41 to 42. Because the write enforces WHERE revision = 41, zero rows update even though the proposal digest never changed." />
  <figcaption>Compare-and-swap enforces live target preconditions at write time, rejecting stale approvals even when their payload digests remain untouched.</figcaption>
</figure>

Optimistic concurrency control enforces that precondition directly inside the target write. Over HTTP, the executor sends an `If-Match` header with the observed `ETag` so the origin rejects stale updates with `412 Precondition Failed`.[^rfc9110ConditionalRequests2022] Inside a relational store, an atomic `UPDATE ... WHERE revision = expected_revision` updates zero rows whenever another writer moved the cluster to revision 42 in the meantime.

<!-- leetllm: test, output=show -->

```python title="live-precondition-cas.py"
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE deployments (service TEXT PRIMARY KEY, stage TEXT, traffic INTEGER, revision INTEGER)")
db.execute("INSERT INTO deployments VALUES ('reranker-v17', 'shadow', 0, 41)")

def apply_with_cas(service: str, new_stage: str, new_traffic: int, expected_rev: int) -> bool:
    cur = db.execute(
        """
        UPDATE deployments
        SET stage = ?, traffic = ?, revision = revision + 1
        WHERE service = ? AND revision = ?
        """,
        (new_stage, new_traffic, service, expected_rev),
    )
    return cur.rowcount == 1

# At 14:20 another team rolls out a 10% emergency patch (revision 41 -> 42).
print("peer emergency write:", apply_with_cas("reranker-v17", "canary", 10, expected_rev=41))

# At 14:45 the delayed approval targeting revision 41 arrives and executes CAS.
print("stale approval write:", apply_with_cas("reranker-v17", "canary", 25, expected_rev=41))
print("live state preserved:", db.execute("SELECT stage, traffic, revision FROM deployments").fetchone())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
peer emergency write: True
stale approval write: False
live state preserved: ('canary', 10, 42)
```
<!-- leetllm: output:end -->

> **Key insight:** Digest checks and compare-and-swap answer two different questions. The digest proves the *proposal* did not change after review. Compare-and-swap proves the *cluster* did not change after review. You need both.

When CAS rejects a stale step, the runtime surfaces revision 42 cleanly so an operator can review a fresh diff if the promotion is still wanted.

## Handle batch sagas and partial outcomes

Multi-target approvals add partial failures across ordered steps. When a reviewer approves migrating 50 database shards in sequence, shards 1 through 41 can commit cleanly before shard 42 times out, leaving shards 43 through 50 unsent. Safe recovery requires per-shard bookkeeping rather than treating a 50-step batch as one binary pass or fail.

<figure>
  <img src="illustrations/_generated/saga_partial_outcomes_dark.png" alt="Proportional state split and recovery sequence for a 50-item batch migration. Items 1 through 41 are verified committed, item 42 timed out in flight with unknown remote status, and items 43 through 50 are halted undispatched. Recovery polls item 42 using its operation key before deciding whether to repair or resume." />
  <figcaption>A batch approval never creates a distributed transaction. When item 42 enters an unknown state, halt the remaining queue and reconcile item 42 first using its operation key.</figcaption>
</figure>

Approving a batch never turns 50 network writes into one atomic commit. Treating shard 42's timeout as "failed" and retrying with a fresh key risks duplicate mutations, while claiming shards 1 through 41 rolled back misstates live cluster state. Safe batch execution records each shard's status, parameters, and immutable operation key, halts downstream shards immediately on ambiguity, and reconciles shard 42 remotely before repairing or resuming.

<!-- leetllm: test, output=show -->

```python title="batch-saga-frontier.py"
def advance_batch(items: list[str], progress: dict[str, str], outcomes: dict[str, str]) -> dict[str, list[str]]:
    for idx, shard in enumerate(items):
        op_key = f"mig-v3-{idx}-{shard}"
        state = outcomes.get(shard, "unknown")
        progress[shard] = f"{state}:{op_key}"
        if state != "committed":
            # Stop at the exact ambiguous frontier and hold downstream shards undispatched.
            for held in items[idx + 1 :]:
                progress[held] = "held"
            break

    summary: dict[str, list[str]] = {"committed": [], "inspect": [], "held": []}
    for shard, status in progress.items():
        if status.startswith("committed:"):
            summary["committed"].append(shard)
        elif status == "held":
            summary["held"].append(shard)
        else:
            summary["inspect"].append(f"{shard} ({status})")
    return summary

shards = ["shard-01", "shard-02", "shard-03", "shard-04", "shard-05"]
print(advance_batch(shards, {}, {"shard-01": "committed", "shard-02": "committed", "shard-03": "timeout"}))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
{'committed': ['shard-01', 'shard-02'], 'inspect': ['shard-03 (timeout:mig-v3-2-shard-03)'], 'held': ['shard-04', 'shard-05']}
```
<!-- leetllm: output:end -->

Shards 1 and 2 keep their confirmations and operation keys, shard 3 pauses in `inspect`, and shards 4 and 5 stay held. If reversing partial progress is necessary, the system schedules an explicit compensating migration over the committed subset rather than assuming automatic undo.

## Operate and measure human oversight

Standards such as the NIST AI Risk Management Framework and EU AI Act Article 14 highlight a practical truth: human oversight fails when operators rubber-stamp opaque prompts under time pressure.[^nistAiRmfCore2023][^euAiActArticle14] Dropping a modal in front of every call achieves nothing if reviewers lack exact diffs or click Approve just to clear an inbox. Track catch quality alongside turnaround latency:

| Metric | Healthy signal | Failure signal | Remediation |
|---|---|---|---|
| **Seeded-defect catch rate** | Reviewers block intentional non-executing canary faults | High approval rate alongside missed seeded defects | Trim noisy alerts and surface exact state diffs first |
| **Queue intervention latency** | P95 review completes comfortably within grant TTL | Approvals regularly expire before execution | Tighten scope for low-risk auto paths and route urgent queues cleanly |
| **CAS rejection rate** | Occasional safe rejects during concurrent releases | Frequent stale writes forcing repeated reviews | Shorten review window or group batched state transitions |
| **Edit-and-rehash rate** | Reviewers revise mis-scoped limits cleanly before commit | Edited parameters bypass digest verification | Enforce mandatory re-hashing and re-approval on any edit |

Non-executing shadow drills, where realistic defective proposals enter the review queue with downstream writes disabled, show whether reviewers actually inspect diffs or simply clear their inbox. Pair that drill data with regular queue reviews to remove noisy low-risk interruptions from human queues.

<details>
<summary>Diagnostic guide for common approval workflow failures</summary>

| Observed symptom | Root cause | Immediate fix |
|---|---|---|
| Pending approval vanishes after container restart | Pause state lived in process memory | Persist checkpoints to SQLite or Postgres outside worker RAM |
| Approved grant never resumes the workflow | Decision and resume message used two separate writes | Move decision and outbox insert into one `BEGIN IMMEDIATE` transaction |
| Duplicate promotion triggered on one review | UI or API checked `pending` before locking row | Replace check-then-write with conditional `UPDATE ... WHERE status = 'pending'` |
| Edited parameter executes under old grant | Server skipped canonical re-hashing after edit | Recompute JCS digest on edit and bump version to invalidate prior approval |
| Delayed approval overwrites newer cluster fix | Executor verified digest without checking live revision | Enforce `WHERE revision = expected_revision` or HTTP `If-Match` |

</details>

```mastery-quiz
[
  {
    "question": "A release workflow uses SQLite checkpoints to pause at `interrupt()` for human approval of a 25% canary promotion. Forty minutes later a new worker reloads the checkpoint and resumes. Which statement describes safe resume design?",
    "options": [
      "Place the production API call immediately before `interrupt()` so the worker holds an active socket while waiting.",
      "Reconstruct pending approval state from conversation history on startup instead of reading persisted database checkpoints.",
      "Run side effects in a dedicated post-approval node carrying the canonical payload digest and expected revision.",
      "Store `approved=True` inside process globals across restarts so downstream executor steps skip checkpoint reads."
    ],
    "answer": "Run side effects in a dedicated post-approval node carrying the canonical payload digest and expected revision.",
    "explanation": "Holding sockets in memory fails across restarts, and conversation history does not bind reviewer authorization. Isolating side effects after the interrupt while carrying the frozen digest and expected revision lets execution recheck live preconditions safely."
  },
  {
    "question": "Two reviewers open the same pending approval `apr_123` (version 3) and click Approve milliseconds apart. How does an engineered backend guarantee a single resume message without race conditions or orphan grants?",
    "options": [
      "Read `status == 'pending'` when rendering the review form, update status on submit, and publish to Kafka afterward.",
      "Execute `UPDATE ... WHERE version = 3` and `INSERT INTO outbox` inside `BEGIN IMMEDIATE`, requiring `rowcount == 1`.",
      "Allow both review clicks to commit while counting on the downstream worker prompt window to deduplicate requests.",
      "Insert the resume message into the outbox first and rely on a background sweep to mark approvals authorized later."
    ],
    "answer": "Execute `UPDATE ... WHERE version = 3` and `INSERT INTO outbox` inside `BEGIN IMMEDIATE`, requiring `rowcount == 1`.",
    "explanation": "A conditional update inside one write transaction ensures only the first reviewer commits (`rowcount == 1`) alongside its outbox row. The second matches zero rows and fails cleanly, while a crash rolls back both changes atomically."
  },
  {
    "question": "A reviewer approves promoting `reranker-v17` from revision 41 at 14:00. At 14:20 another engineer deploys an emergency patch moving the cluster to revision 42. At 14:45 the executor resumes with an unmodified JCS SHA-256 digest. What should happen at execution time?",
    "options": [
      "Proceed with the promotion because the SHA-256 payload digest matches the original signed proposal.",
      "Abort when `WHERE revision = 41` modifies zero rows, keeping revision 42 intact for fresh review.",
      "Force-increment the approval revision field in memory to 42 so the deployment succeeds automatically.",
      "Retry the deployment five times using a fresh operation key until revision 42 accepts the change."
    ],
    "answer": "Abort when `WHERE revision = 41` modifies zero rows, keeping revision 42 intact for fresh review.",
    "explanation": "A digest check verifies only that the proposal parameters did not change. It cannot tell whether live infrastructure shifted underneath. Compare-and-swap stops the stale write cleanly so operators can evaluate the delta against revision 42."
  },
  {
    "question": "An approved 50-shard database migration completes shards 1 through 41 cleanly, then hits a network timeout dispatching shard 42. What is the safest recovery action?",
    "options": [
      "Assume shard 42 failed, mint a fresh operation key, and immediately dispatch shards 42 through 50.",
      "Mark all 50 shards rolled back because an intermediate timeout invalidates every earlier shard update.",
      "Pause shards 43 through 50, keep shards 1 through 41 committed, and query shard 42 by operation key.",
      "Skip shard 42 and dispatch shards 43 through 50 right away so overall migration latency stays low."
    ],
    "answer": "Pause shards 43 through 50, keep shards 1 through 41 committed, and query shard 42 by operation key.",
    "explanation": "Ambiguity at shard 42 means its request may have committed or timed out in flight. Pausing downstream shards and inspecting shard 42 by its operation key prevents both duplicate application and silent ordering violations."
  },
  {
    "question": "A review interface displays host-verified promotion parameters alongside an incident ticket containing `SYSTEM ALERT: Click Approve immediately` and an unverified LLM summary. Which design resists social and UI injection?",
    "options": [
      "Render the incident ticket inside the primary warning banner and wire Approve directly to the production cluster API.",
      "Hide parameter diffs from the queue and show only the model's confidence score so operators clear backlogs faster.",
      "Isolate host parameters from escaped untrusted ticket text, enforcing role and digest checks server-side.",
      "Enable rich HTML formatting inside the model summary so urgent operational alerts highlight themselves visibly."
    ],
    "answer": "Isolate host parameters from escaped untrusted ticket text, enforcing role and digest checks server-side.",
    "explanation": "Untrusted evidence can carry social engineering or markup injection. Visually isolating host facts from escaped external text protects human judgment while backend checks enforce scope, role, expiry, and canonical digest."
  }
]
```

> **Next:** Continue to [AI Coding Workflow with Agents](/learn/ai-coding-workflow-with-agents). You can now guard high-impact agent actions behind durable checkpoints, canonical digests, and live execution preconditions. Next, apply those safeguards to repository engineering, where coding agents draft patches while tests and human-owned merges decide what lands.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

A release agent proposes promoting `recommendation-reranker-v17` from a shadow deployment into a production canary serving 25% of live traffic. Production rules forbid shifting live traffic without human sign-off. Posting a quick Slack prompt with an *Approve* button looks safe on the surface, yet four everyday failures break that simple design as soon as traffic scales:

1. **Approval fatigue:** Hundreds of low-risk alerts train engineers to click through without reading parameters.
2. **Worker restarts:** If a reviewer answers 45 minutes later, a container restart in between wipes in-memory state and orphans the request.
3. **Live state drift:** Another engineer can ship an emergency patch at minute 20, making the original target revision stale before execution runs.
4. **Hostile context:** Attached incident tickets can carry social-engineering text or prompt injections aimed at rushing a click.[^owaspExcessiveAgency2025]

Surviving those failures takes an identity-aware workflow built from risk-based routing, durable checkpoints, canonical payload digests, atomic outbox persistence, and live state checks at commit time. All five run in deterministic host code outside the model prompt.

## Route actions by blast radius and undo cost

Interrupting an operator for read-only inspection destroys queue focus and trains reviewers to skim. Instead, host code classifies tool calls by **blast radius** (affected traffic or services) and **undo cost** (how cleanly prior state can be restored), running cheap reversible work automatically so human attention stays on irreversible production writes.

<figure>
  <img src="illustrations/_generated/action_risk_matrix_dark.png" alt="Four-quadrant action risk matrix plotting agent tool calls by blast radius on the horizontal axis and reversibility cost on the vertical axis. Low-scope reversible tools auto-execute, irreversible low-scope changes log and notify, reversible wide-scope shifts require single human approval, and wide irreversible mutations require dual approval plus precondition locks." />
  <figcaption>Risk-based routing separates cheap, reversible inspection calls from wide-scope or irreversible mutations that require pre-execution locks and sign-off.</figcaption>
</figure>

Read-only tools such as `git_diff` and local test suites run automatically without waiting in an inbox. Wide-scope yet fast-reverting actions like a 25% canary shift require single authenticated approval, whereas permanent production schema changes or root IAM grants require dual approval, tight expiry timers, and strict version preconditions.

<figure>
  <img src="illustrations/_generated/deferral_threshold_curve_dark.png" alt="Line chart plotting human review load and unreviewed high-risk mutations across risk threshold settings from 0.2 to 0.9. Raising the threshold drops reviewer load from 74 percent to 5 percent while increasing unreviewed risk from 2 percent to 39 percent, favoring calibrated operating thresholds plus reversible canary limits." />
  <figcaption>A narrow threshold floods the queue and fuels rubber-stamping. Pairing calibrated deferral with narrow canary steps keeps both missed risk and reviewer workload controlled.</figcaption>
</figure>

## Track a durable lifecycle, not a Boolean

Because human judgment happens on human timescales, pause state cannot live in worker RAM. A durable workflow checkpoints the exact proposed diff, stores an expiry timestamp and unique operation key, and shuts down the worker cleanly until a review arrives. When an engineer opens the inbox 45 minutes later, any available worker reloads the persisted record without repeating earlier computation.

<figure>
  <img src="illustrations/_generated/human_in_loop_dark.png" alt="State diagram of a durable human-in-the-loop workflow. An agent saves checkpoint v3 and pauses for human review. The reviewer either cancels or edits into a new digest with zero unapproved writes, or atomically commits an authorization and outbox token. Execution checks live preconditions with compare-and-swap, routing timeouts to remote reconciliation by operation key." />
  <figcaption>Durable orchestration separates checkpointed suspension, atomic outbox persistence, live compare-and-swap verification, and timeout reconciliation.</figcaption>
</figure>

Each transition moves through explicit states instead of flipping a Boolean flag. Pending proposals bind to a canonical RFC 8785 digest (sorted keys, whitespace-free SHA-256) so silent edits cannot slip under an earlier approval.[^rfc8785Jcs2020] Rejections and expiries finish cleanly with zero writes, edits bump the proposal version and invalidate the old grant, and approvals save reviewer identity alongside the grant for a separate executor.

## Commit the decision and trigger together

Dual-write failures strand workflows whenever approving a record and publishing its resume signal happen in separate steps. A crash between those two writes leaves an approval stuck open permanently, while checking `status == 'pending'` before taking a lock lets two reviewers clicking together dispatch twice.

<figure>
  <img src="illustrations/_generated/atomic_decision_outbox_dark.png" alt="Sequence diagram showing two concurrent reviewers competing for approval apr_123 at version 3 inside SQLite BEGIN IMMEDIATE. Reviewer A updates status to authorized and inserts outbox message apr_123:v3 in one atomic transaction. Reviewer B sees zero pending rows and receives conflict 409. The worker reads the committed outbox token and dispatches with a stable operation key." />
  <figcaption>Putting the conditional status update and outbox insert inside one write transaction eliminates concurrent approval races.</figcaption>
</figure>

Inside `BEGIN IMMEDIATE` in SQLite, updating `WHERE status = 'pending' AND version = ?` and inserting the outbox row happen atomically.[^sqliteTransactions2026] Only the first writer satisfies `rowcount == 1`. Any racing click gets a conflict, and any mid-transaction crash rolls both tables back together.

<!-- leetllm: test, output=show -->

```python title="reader-atomic-outbox-and-cas.py"
import hashlib
import json
import sqlite3

def canonical_digest(payload: dict) -> str:
    body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(body).hexdigest()

conn = sqlite3.connect(":memory:", isolation_level=None)
conn.execute("CREATE TABLE deployments (service TEXT PRIMARY KEY, traffic INTEGER, revision INTEGER)")
conn.execute("INSERT INTO deployments VALUES ('reranker-v17', 0, 41)")
conn.execute("CREATE TABLE approvals (id TEXT PRIMARY KEY, version INTEGER, digest TEXT, expected_rev INTEGER, status TEXT)")
conn.execute("CREATE TABLE outbox (msg_key TEXT PRIMARY KEY, op_key TEXT)")

target_payload = {"service": "reranker-v17", "traffic": 25}
digest = canonical_digest(target_payload)
conn.execute("INSERT INTO approvals VALUES ('apr_123', 3, ?, 41, 'pending')", (digest,))

# Step 1: Atomic decision + outbox commit so a competing click fails cleanly.
def approve(id_val: str, version: int) -> str:
    conn.execute("BEGIN IMMEDIATE")
    cur = conn.execute(
        "UPDATE approvals SET status = 'authorized' WHERE id = ? AND version = ? AND status = 'pending'",
        (id_val, version),
    )
    if cur.rowcount != 1:
        conn.execute("ROLLBACK")
        return "conflict"
    conn.execute("INSERT INTO outbox VALUES (?, ?)", (f"{id_val}:v{version}", f"op-{id_val}-v{version}"))
    conn.execute("COMMIT")
    return "committed"

print("click A:", approve("apr_123", 3))
print("click B:", approve("apr_123", 3))

# Step 2: Concurrent deploy moves live revision 41 -> 42 before execution runs.
conn.execute("UPDATE deployments SET traffic = 10, revision = 42 WHERE service = 'reranker-v17' AND revision = 41")
row = conn.execute("SELECT digest, expected_rev FROM approvals WHERE id = 'apr_123' AND status = 'authorized'").fetchone()
cas = conn.execute(
    "UPDATE deployments SET traffic = 25, revision = revision + 1 WHERE service = 'reranker-v17' AND revision = ?",
    (row[1],),
)
print("digest matches:", row[0] == canonical_digest(target_payload), "| stale CAS rows updated:", cas.rowcount)
print("live state:", conn.execute("SELECT traffic, revision FROM deployments").fetchone())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
click A: committed
click B: conflict
digest matches: True | stale CAS rows updated: 0
live state: (10, 42)
```
<!-- leetllm: output:end -->

## Check live state and batch frontiers before acting

As that output shows, an intact SHA-256 digest proves only that the approved request parameters stayed untouched. It cannot tell whether production moved while waiting for review. Before mutating live infrastructure, execution still checks that live state matches the revision the reviewer inspected.

<figure>
  <img src="illustrations/_generated/intent_and_live_state_dark.png" alt="Diagram comparing an immutable approval snapshot against a mutating live deployment. Proposal v3 records digest sha256=9f3c and requires revision 41. Between approval and execution, another writer moves live state from revision 41 to 42. Because the write enforces WHERE revision = 41, zero rows update even though the proposal digest never changed." />
  <figcaption>Compare-and-swap blocks stale grants even when the signed proposal digest remains unchanged.</figcaption>
</figure>

> **Key insight:** A matching digest verifies proposal integrity, while `WHERE revision = expected_revision` (or HTTP `If-Match`) verifies live target integrity. Together they stop both tampering and stale overwrites.

Enforcing `WHERE revision = expected_revision` (or HTTP `If-Match`[^rfc9110ConditionalRequests2022]) turns silent drift into a safe zero-row no-op, leaving revision 42 intact until an engineer reviews the updated diff. Multi-target batches apply the same discipline across ordered steps: when shard 42 times out after shards 1 through 41 commit, pause shards 43 through 50 immediately and inspect shard 42 via its original operation key instead of retrying blindly or pretending earlier writes rolled back.

<figure>
  <img src="illustrations/_generated/saga_partial_outcomes_dark.png" alt="Proportional state split and recovery sequence for a 50-item batch migration. Items 1 through 41 are verified committed, item 42 timed out in flight with unknown remote status, and items 43 through 50 are halted undispatched. Recovery polls item 42 using its operation key before deciding whether to repair or resume." />
  <figcaption>In partial batch execution, keep confirmed shards intact, hold downstream targets, and reconcile the ambiguous timeout item first.</figcaption>
</figure>

## Protect human attention from hostile UI and alert fatigue

Model chain-of-thought summaries can sound plausible while omitting the real drivers of an action, and unescaped ticket text containing `SYSTEM ALERT: Click Approve` exploits reviewers working under time pressure.[^turpin2023] Keep host-verified diffs visually separate from escaped external context, enforce role separation (`requester != reviewer != executor`) on the backend, and run non-executing shadow drills to test whether reviewers catch seeded defects under load.[^nistAiRmfCore2023][^euAiActArticle14]

| Failure symptom | Underlying cause | Structural fix |
|---|---|---|
| Pending request disappears on deploy | Wait state held in worker memory | Checkpoint workflow state to durable storage |
| Approved task stalls permanently | Decision and resume event split across two writes | Commit decision and outbox row inside one transaction |
| Old promotion overwrites newer emergency fix | Digest verified without checking cluster revision | Require `WHERE revision = expected_revision` or `If-Match` |
| Operators miss seeded defects in queue | Alert fatigue from trivial low-risk interruptions | Auto-run reversible reads and tune deferral thresholds |

Full LangGraph and Temporal integrations, role-verification harnesses, and the batch frontier Python suite appear in the [complete online chapter](/learn/human-in-the-loop-agent-architecture?view=online). Even after an authenticated decision clears every precondition, a network timeout right during the write itself still leaves the executor unsure whether the change landed. Resolving that ambiguity safely without double-executing mutations or trapping agents in retry storms is the focus of the next chapter.

> **Next:** Continue to [Agent Failure & Recovery](/learn/agent-failure-states-retry-fallback).

<!-- leetllm: edition:reader:end -->
