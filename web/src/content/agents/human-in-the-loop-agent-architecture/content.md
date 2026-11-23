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
    "Escalation Policies",
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

Consider a release orchestration agent preparing to promote `recommendation-reranker-v17` from a shadow deployment into a production canary handling 25% of live traffic. The model emits a single structured proposal requesting the rollout change, while organization policy forbids applying traffic shifts without human review. If that proposal executes directly upon receiving a simple chat click, any shift in live traffic or backend worker state goes completely unchecked.

```text title="canary-proposal.txt"
promote_model(
  model_id="recommendation-reranker-v17",
  from_stage="shadow",
  to_stage="canary",
  traffic_percent=25,
)
```

A common shortcut posts a chat modal asking *"Approve routing 25% of traffic to reranker-v17?"* with a callback button. While it looks like a control gate, four routine production failures break that design almost immediately. Review fatigue sets in when dozens of low-risk alerts condition operators to click through without reading diffs. Worker restarts wipe in-memory pause state if a reviewer takes 45 minutes to respond, leaving the workflow orphaned or re-planned from scratch.

Live state can also drift while the request sits in queue: if another engineer pushes revision 42 during that 45-minute wait, the original rollout plan against revision 41 is already stale. Applying that aged rollout blindly would silently overwrite an emergency mitigation or newer configuration without warning. Finally, any external ticket text or incident note attached for context can carry <span data-glossary="prompt-injection">prompt injection</span> or unverified claims that must never be mistaken for trusted system facts.[^owaspExcessiveAgency2025] Solving all four problems turns an approval button into an architecture of durable state, cryptographic digests, and atomic execution preconditions.

## Map action risk to policy gates

Not every tool call deserves a human pause, and interrupting everything destroys both latency and reviewer attention. Effective <span data-glossary="human-in-the-loop">human-in-the-loop</span> systems route tool invocations according to two orthogonal dimensions: **blast radius** (how many users, tenants, or downstream services feel the change) and **reversibility cost** (whether an instant rollback restores prior state without data loss). Evaluating those two axes before queuing work concentrates reviewer focus on mutations that genuinely carry irreversible operational weight.

<figure>
  <img src="illustrations/_generated/action_risk_matrix_dark.png" alt="Four-quadrant action policy matrix plotting agent tool calls by blast radius on the horizontal axis and reversibility cost on the vertical axis. Low-scope reversible tools auto-execute, irreversible low-scope changes log and notify, reversible wide-scope shifts require single human approval, and wide irreversible mutations require dual approval plus precondition locks." />
  <figcaption>Policy routing separates cheap, reversible inspection calls from wide-scope or irreversible mutations that require pre-execution locks and sign-off.</figcaption>
</figure>

Read-only tools like `git_diff` or test runners (`pytest`) sit in the bottom-left quadrant and execute without blocking. Wide-scope canary traffic shifts and feature-flag flips sit in the bottom-right quadrant: they affect live traffic immediately, yet remain fast to roll back, making a single authenticated approval appropriate. Irreversible production mutations such as dropping columns, rotating root keys, or granting broad IAM policies sit in the top-right quadrant and demand dual review, short expiry windows, and strict version preconditions.

Policy thresholds also control queue health when an agent scores uncertainty or risk before deferring to an engineer. Setting an escalation threshold too low routes safe routine actions to human reviewers, driving queue load past 70% and inviting rubber-stamping. Setting it too high keeps queues empty while letting rare high-impact errors slip past unreviewed. Calibrated operating thresholds combine automated guardrails and step budgets with targeted human escalation.

<figure>
  <img src="illustrations/_generated/deferral_threshold_curve_dark.png" alt="Line chart plotting human review load and unreviewed high-risk mutations across risk threshold settings from 0.2 to 0.9. Raising the threshold drops reviewer load from 74 percent to 5 percent while increasing unreviewed risk from 2 percent to 39 percent, favoring calibrated operating gates plus reversible canary limits." />
  <figcaption>Lowering the deferral threshold eliminates missed tail risk at the cost of overwhelming reviewers; pairing a balanced threshold with narrow blast-radius steps keeps both metrics tractable.</figcaption>
</figure>

A small policy router makes these rules explicit in host code, outside the model prompt. In the runnable classifier below, tool identity, target stage, and traffic delta determine whether a proposal runs immediately, escalates for single approval, demands dual sign-off, or stays blocked altogether. Expressing routing as plain deterministic Python logic guarantees that prompt wording never bypasses operational controls.

<!-- leetllm: test, output=show -->

```python title="classify-action-risk.py"
from dataclasses import dataclass
from enum import Enum

class GateTier(str, Enum):
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

def classify_proposal(proposal: ActionProposal) -> GateTier:
    if proposal.tool in {"read_logs", "git_diff", "run_tests"}:
        return GateTier.AUTO
    if proposal.tool == "drop_table":
        return GateTier.DENY if proposal.stage == "production" else GateTier.DUAL_REVIEW
    if proposal.tool != "promote_model":
        return GateTier.DUAL_REVIEW
    if not proposal.reversible or proposal.traffic_percent > 25:
        return GateTier.DUAL_REVIEW
    return GateTier.SINGLE_REVIEW if proposal.stage == "canary" else GateTier.AUTO

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

Every decision happens deterministically on structured parameters rather than natural-language rationales. That keeps prompt text from shifting an action's risk tier just by phrasing a dangerous database change cautiously. Because the policy function lives outside the model context, changing escalation rules requires code review rather than prompt editing.

## Track a durable lifecycle, not a Boolean

Because an engineer may respond minutes or hours after an agent requests review, holding the call open in worker memory fails across deployments, autoscaling events, and container restarts. Durable review models an approval workflow as a persistent state machine stored in checkpoints or a database ledger, completely independent of any single worker process. Any idle period costs zero active memory and survives arbitrary pod restarts before resuming cleanly.

<figure>
  <img src="illustrations/_generated/human_in_loop_dark.png" alt="State diagram of a durable human-in-the-loop workflow. An agent saves checkpoint v3 and pauses for human review. The reviewer either cancels or edits into a new digest with zero gated writes, or atomically commits an authorization and outbox token. Execution checks live preconditions with compare-and-swap, routing timeouts to remote reconciliation by operation key." />
  <figcaption>Durable orchestration separates checkpointed suspension, atomic authorization persistence, live compare-and-swap verification, and remote timeout reconciliation.</figcaption>
</figure>

A pending request passes through distinct phases rather than toggling a Boolean flag:

1. **Checkpoint and pause:** The workflow persists thread state, freezes a canonical snapshot of the proposed tool call, assigns a unique operation key and expiry timestamp, and exits cleanly so zero worker memory is held hostage during review.
2. **Scoped decision:** An authenticated human reviewer inspects the host-verified parameters and either rejects the request, lets it expire, edits parameters into a fresh version with a new digest, or authorizes the exact pending version.
3. **Atomic outbox and dispatch:** The database commits both the granted status and a resume message inside a single transaction, ensuring a crash immediately after clicking Approve never strands a granted action without a resume trigger.
4. **Live check and reconciliation:** Before mutating production, the executor checks expiry and applies an optimistic compare-and-swap precondition against the live target revision; if a network timeout leaves dispatch uncertain, recovery polls the remote target by operation key before attempting any retry.

Durable workflow engines implement this suspension natively, though each treats replay differently. In <span data-glossary="langgraph">LangGraph</span>, a graph configured with a SQLite or PostgreSQL checkpointer saves state before pausing at `interrupt()`, freeing the worker until `Command(resume=...)` reloads the thread.[^langgraph2024][^langgraph2026persistence] Note that nodes placed after an interrupt re-run from their entry step upon resumption, so mutating tools belong in a dedicated post-approval node rather than inline alongside prompt formatting. Keeping non-idempotent side effects isolated in their own post-review node stops duplicate external calls when a workflow replays.

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

def review_gate(state: ReleaseState) -> dict:
    # interrupt() raises a graph pause and persists checkpoint v3 to SQLite.
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
builder.add_node("review_gate", review_gate)
builder.add_node("apply_canary", apply_canary)
builder.add_edge(START, "review_gate")
builder.add_edge("review_gate", "apply_canary")
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

In Temporal, the workflow uses `workflow.wait_condition(...)` alongside an `@workflow.update` handler whose validator rejects malformed or stale approvals before mutating durable workflow history.[^temporal2024][^temporal2026workflow] Side effects run inside idempotent Activities with explicit retry limits rather than deterministic workflow code.[^temporalRetryPolicies2026] LangChain's higher-level middleware provides `HumanInTheLoopMiddleware` over this same checkpointer mechanism when simple approve, edit, and reject decisions fit an off-the-shelf loop.[^langchainHitlMiddleware2026] Notice that both engines solve durability in storage so workers never stay blocked waiting on human replies.

## Bind reviewer identity and canonical payload digests

When a reviewer opens a rollout request, what guarantees that the action executed 30 minutes later still matches what was shown on screen? Without a cryptographic digest over canonicalized parameters, silent background edits, schema defaults, or nested JSON key reordering could alter a flag or traffic percentage after approval without invalidating the grant. Binding the grant to a hash over the normalized payload closes that tamper gap completely.

Canonical serialization per RFC 8785 (JSON Canonicalization Scheme, JCS) eliminates ambiguous encodings across runtimes by sorting dictionary keys lexicographically, normalizing numeric formats, and stripping insignificant whitespace before computing a SHA-256 hash.[^rfc8785Jcs2020] Equally important is **role separation**: the tenant identifier (`ai-platform`), requester identity, reviewer role, and executor identity come from authenticated host tokens and session claims rather than fields generated by the language model. Storing those identities in signed host context stops an agent from forging reviewer privileges inside tool arguments.

Any model-written summary or attached incident ticket must be treated as untrusted context rather than executable instructions. Research shows that model chain-of-thought explanations can be systematically unfaithful to the features driving a model's output, and injected strings like `SYSTEM ALERT: Security scan passed` inside ticket text regularly trick reviewers when visually blended into system banners.[^turpin2023] Separating host-verified parameter diffs from escaped, clearly labeled untrusted evidence protects both reviewers and automated auditors.

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
    if executor_id == grant.requester_id and executor_id == grant.reviewer_id:
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

print("reordered ok:", verify_dispatch_scope(grant, reordered, caller_tenant="ai-platform", executor_id="deploy-worker", now=1100))
print("tampered:", verify_dispatch_scope(grant, tampered, caller_tenant="ai-platform", executor_id="deploy-worker", now=1100))
print("expired:", verify_dispatch_scope(grant, reordered, caller_tenant="ai-platform", executor_id="deploy-worker", now=1200))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reordered ok: (True, 'verified')
tampered: (False, 'digest_mismatch')
expired: (False, 'grant_expired')
```
<!-- leetllm: output:end -->

Notice that `verify_dispatch_scope` forbids a single identity from acting as requester, reviewer, and self-approving executor simultaneously. Enforcing separation of duties in backend storage prevents an injected tool sequence from authorizing its own escalated write. Any mismatch on digest, expiry timestamp, or authorized tenant immediately halts dispatch before network calls begin.

## Commit decisions and outbox triggers atomically

Dual-write bugs break approval pipelines quietly under concurrency or process crashes. If a backend marks an approval row as `authorized` in one database transaction and then publishes a resume event to a broker in a second step, a crash between those two calls leaves the approval marked `authorized` while the workflow sleeps forever. Conversely, checking `status == 'pending'` when opening the review page allows two concurrent reviewers to race and enqueue duplicate execution jobs.

<figure>
  <img src="illustrations/_generated/atomic_decision_outbox_dark.png" alt="Sequence diagram showing two concurrent reviewers competing for approval apr_123 at version 3 inside SQLite BEGIN IMMEDIATE. Reviewer A updates status to authorized and inserts outbox message apr_123:v3 in one atomic transaction. Reviewer B sees zero pending rows and receives conflict 409. The worker reads the committed outbox token and dispatches with a stable operation key." />
  <figcaption>A conditional status transition combined with a transactional outbox insert guarantees at most one winning approval paired one-for-one with a resume event.</figcaption>
</figure>

The transactional outbox pattern eliminates both races. Inside one `BEGIN IMMEDIATE` SQLite transaction, the backend executes a conditional update (`WHERE approval_id = ? AND version = ? AND status = 'pending' AND expires_at > ?`) and verifies `rowcount == 1` before inserting a unique resume record into the `outbox` table.[^sqliteTransactions2026] A competing second request blocks until the first commits, matches zero pending rows, and receives a clean conflict error; if an exception occurs mid-transaction, SQLite rolls back both tables together.

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

Every winning decision produces exactly one outbox entry, while every conflict or mid-flight crash leaves state clean and deterministic. A background dispatcher polls the outbox and forwards the durable `op_key` to the downstream executor without holding database locks over network calls. Decoupling lock ownership from network latency keeps review queues responsive even when remote deployment endpoints slow down.

## Recheck live preconditions at write time

Even when an approval token has a valid reviewer signature, matching digest, and unexpired timestamp, executing it blindly can still corrupt production if the target moved while the request waited in the review queue. A proposal created against revision 41 authorizes transitioning *from revision 41*, not overwriting whatever revision happens to exist 45 minutes later. Checking live system state at the exact instant of commit closes the window between human review and execution.

<figure>
  <img src="illustrations/_generated/intent_and_live_state_dark.png" alt="Diagram comparing an immutable approval snapshot against a mutating live deployment. Proposal v3 records digest sha256=9f3c and requires revision 41. Between approval and execution, another writer moves live state from revision 41 to 42. Because the write enforces WHERE revision = 41, zero rows update even though the proposal digest never changed." />
  <figcaption>Compare-and-swap enforces live target preconditions at the moment of the write, rejecting stale approvals even when their payload digests remain untouched.</figcaption>
</figure>

Optimistic concurrency control enforces that precondition directly inside the target write. On HTTP resources, the executor sends an `If-Match` header carrying the observed `ETag`, letting the origin reject stale updates with `412 Precondition Failed`.[^rfc9110ConditionalRequests2022] Inside relational state stores, an atomic `UPDATE ... WHERE revision = expected_revision` statement returns zero updated rows whenever another writer advanced the cluster to revision 42 in the meantime.

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

Separating digest verification (did the proposal change?) from live compare-and-swap (did the cluster change?) prevents stale approvals from silently clobbering intermediate fixes. When CAS rejects an approved step, the runtime surfaces the new live revision cleanly so a fresh diff can be reviewed if the promotion is still wanted. That clean failure protects parallel incident responders from losing emergency rollbacks to queued agent proposals.

## Handle batch sagas and partial outcomes

Single-target approvals already face concurrent drift; multi-target operations add partial failures across ordered steps. When a reviewer authorizes migrating 50 database shards or notifying 50 service owners in sequence, shards 1 through 41 can succeed cleanly before shard 42 times out over the network, leaving shards 43 through 50 undispatched. Resuming safely demands exact per-shard bookkeeping rather than treating a multi-step batch as one opaque success-or-failure event.

<figure>
  <img src="illustrations/_generated/saga_partial_outcomes_dark.png" alt="Proportional state split and recovery sequence for a 50-item batch migration. Items 1 through 41 are verified committed, item 42 timed out in flight with unknown remote status, and items 43 through 50 are halted undispatched. Recovery polls item 42 using its operation key before deciding whether to repair or resume." />
  <figcaption>A batch approval never provides magic distributed rollback; when item 42 enters an unknown state, halt the remaining queue and reconcile item 42 first using its operation key.</figcaption>
</figure>

Approving a batch never turns 50 external network writes into one atomic transaction. Treating shard 42's timeout as "failed" and blindly launching shard 42 again with a fresh key risks duplicate mutations, while pretending items 1 through 41 rolled back misstates live cluster state. Robust saga execution persists a per-item ledger binding order, parameters, and an immutable operation key per shard, halts the frontier immediately upon ambiguity, polls the remote system for item 42, and repairs or resumes from explicit state rather than guesswork.

<!-- leetllm: test, output=show -->

```python title="batch-saga-frontier.py"
def advance_batch(items: list[str], ledger: dict[str, str], outcomes: dict[str, str]) -> dict[str, list[str]]:
    for idx, shard in enumerate(items):
        op_key = f"mig-v3-{idx}-{shard}"
        state = outcomes.get(shard, "unknown")
        ledger[shard] = f"{state}:{op_key}"
        if state != "committed":
            # Stop at the exact ambiguous frontier; hold downstream shards undispatched.
            for held in items[idx + 1 :]:
                ledger[held] = "held"
            break

    summary: dict[str, list[str]] = {"committed": [], "inspect": [], "held": []}
    for shard, status in ledger.items():
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

Every committed shard retains its confirmation and operation key, shard 3 halts in explicit `inspect` status, and shards 4 and 5 stay safely queued. If full reversal is required after partial progress, the system plans an explicit compensating migration on the committed subset rather than assuming automatic undo. Distinguishing confirmed shards from the uncertain frontier makes batch recovery auditable after arbitrary mid-run faults.

## Operate and measure human oversight

Regulatory frameworks such as NIST AI RMF (`GOVERN` and `MAP`) and EU AI Act Article 14 emphasize that human oversight fails when operators become rubber stamps under time pressure or opaque UI summaries.[^nistAiRmfCore2023][^euAiActArticle14] Simply placing a modal dialog in front of every call does not satisfy meaningful oversight if reviewers lack context or click blindly to clear their inbox. Engineering teams keep oversight real by tracking operational metrics rather than counting raw clicks, measuring catch quality alongside turnaround latency:

| Metric | Healthy signal | Failure signal | Remediation |
|---|---|---|---|
| **Seeded-defect catch rate** | Reviewers block intentional non-executing canary faults | High approval rate alongside missed seeded defects | Trim noisy alerts; surface exact state diffs first |
| **Queue intervention latency** | P95 review completes comfortably within grant TTL | Approvals regularly expire before execution | Tighten scope for low-risk auto paths; route urgent queues cleanly |
| **CAS rejection rate** | Occasional safe rejects during concurrent releases | Frequent stale writes forcing repeated reviews | Shorten review window or group batched state transitions |
| **Edit-and-rehash rate** | Reviewers revise mis-scoped limits cleanly before commit | Edited parameters bypass digest verification | Enforce mandatory re-hashing and re-approval on any edit |

Non-executing shadow drills, where realistic defective proposals appear in the review queue with writes disabled downstream, reveal whether reviewers genuinely examine parameters or simply clear their inbox. Tracking catch rates on those shadow drills exposes queue fatigue long before an unreviewed mistake hits live production traffic. Pair that drill data with periodic policy audits to trim noisy low-risk interruptions out of the human inbox altogether.

<details>
<summary>Diagnostic guide for common approval workflow failures</summary>

| Observed symptom | Root cause | Immediate fix |
|---|---|---|
| Pending approval vanishes after container restart | Pause state lived in process memory | Persist checkpoints to SQLite or Postgres outside worker RAM |
| Approved grant never resumes the workflow | Decision and resume message used two separate writes | Move decision and outbox insert into one `BEGIN IMMEDIATE` transaction |
| Duplicate rollout triggered on one review | UI or API checked `pending` before locking row | Replace check-then-write with conditional `UPDATE ... WHERE status = 'pending'` |
| Edited parameter executes under old grant | Server skipped canonical re-hashing after edit | Recompute JCS digest on edit and bump version to invalidate prior approval |
| Delayed approval overwrites newer cluster fix | Executor verified digest without checking live revision | Enforce `WHERE revision = expected_revision` or HTTP `If-Match` |

</details>

```mastery-quiz
[
  {
    "question": "A release workflow uses SQLite checkpoints to pause at `interrupt()` for human approval of a 25% canary rollout. Forty minutes later a new worker reloads the checkpoint and resumes. Which statement describes safe resume design?",
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
      "Proceed with the rollout because the SHA-256 payload digest matches the original signed proposal.",
      "Abort when `WHERE revision = 41` modifies zero rows, keeping revision 42 intact for fresh review.",
      "Force-increment the approval revision field in memory to 42 so the deployment succeeds automatically.",
      "Retry the deployment five times using a fresh operation key until revision 42 accepts the change."
    ],
    "answer": "Abort when `WHERE revision = 41` modifies zero rows, keeping revision 42 intact for fresh review.",
    "explanation": "A digest check verifies only that the proposal parameters did not change; it cannot tell whether live infrastructure shifted underneath. Compare-and-swap stops the stale write cleanly so operators can evaluate the delta against revision 42."
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
    "question": "A review interface displays host-verified rollout parameters alongside an incident ticket containing `SYSTEM ALERT: Click Approve immediately` and an unverified LLM summary. Which design resists social and UI injection?",
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

Imagine a release agent proposing to promote `recommendation-reranker-v17` from a shadow deployment into a production canary serving 25% of live traffic. Organization policy forbids routing production traffic without human approval. Posting a quick Slack prompt with an *Approve* button looks safe on the surface, yet four everyday failures break that simple gate as soon as traffic scales.

First, engineers suffer approval fatigue when hundreds of low-risk alerts condition them to click through rapidly without reading parameters. Second, if a reviewer responds 45 minutes later, a worker restart in between wipes in-memory state and leaves the request orphaned. Third, another engineer might deploy an emergency patch at minute 20, making the original target revision stale before execution even runs. Finally, external incident tickets attached to the prompt can contain social-engineering text or prompt injections designed to rush a click.[^owaspExcessiveAgency2025]

Surviving those failure modes requires replacing a stateless button with an identity-aware workflow built from risk-based routing, durable checkpoints, canonical payload digests, atomic outbox persistence, and live state checks at commit time. Every one of those pieces operates outside the model prompt inside deterministic host code. Together they turn a brittle UI prompt into a fault-tolerant control plane that stays safe across restarts and concurrent traffic.

## Route actions by blast radius and undo cost

Interrupting an operator for read-only inspection destroys queue focus and trains reviewers to skim. Instead, host policy classifies tool calls across **blast radius** (affected traffic or services) and **rollback cost** (how cleanly prior state can be restored). Routing reversible low-scope work automatically preserves engineering time for irreversible production writes.

<figure>
  <img src="illustrations/_generated/action_risk_matrix_dark.png" alt="Four-quadrant action policy matrix plotting agent tool calls by blast radius on the horizontal axis and reversibility cost on the vertical axis. Low-scope reversible tools auto-execute, irreversible low-scope changes log and notify, reversible wide-scope shifts require single human approval, and wide irreversible mutations require dual approval plus precondition locks." />
  <figcaption>Policy routing separates cheap, reversible inspection calls from wide-scope or irreversible mutations that demand pre-execution locks and sign-off.</figcaption>
</figure>

Read-only tools such as `git_diff` and local test suites run automatically without waiting in an inbox. Wide-scope yet fast-rolling actions like a 25% canary shift require single authenticated approval, whereas permanent production schema changes or root IAM grants require dual approval, tight expiry timers, and strict version preconditions. Setting confidence or risk deferral thresholds thoughtfully prevents queue overload while keeping critical tail mutations out of automated fast paths.

<figure>
  <img src="illustrations/_generated/deferral_threshold_curve_dark.png" alt="Line chart plotting human review load and unreviewed high-risk mutations across risk threshold settings from 0.2 to 0.9. Raising the threshold drops reviewer load from 74 percent to 5 percent while increasing unreviewed risk from 2 percent to 39 percent, favoring calibrated operating gates plus reversible canary limits." />
  <figcaption>A narrow threshold floods the queue and fuels rubber-stamping; pairing calibrated deferral with narrow canary steps keeps both missed risk and human workload controlled.</figcaption>
</figure>

## Track a durable lifecycle, not a Boolean

Because human judgment happens on human timescales, pause state cannot live in process RAM. A durable workflow checkpoints the exact proposed diff, stores an expiry timestamp and unique operation key, and shuts down the worker cleanly until a review arrives. When a human opens the inbox 45 minutes later, any available worker reloads the persisted record without repeating earlier computation.

<figure>
  <img src="illustrations/_generated/human_in_loop_dark.png" alt="State diagram of a durable human-in-the-loop workflow. An agent saves checkpoint v3 and pauses for human review. The reviewer either cancels or edits into a new digest with zero gated writes, or atomically commits an authorization and outbox token. Execution checks live preconditions with compare-and-swap, routing timeouts to remote reconciliation by operation key." />
  <figcaption>Durable orchestration separates checkpointed suspension, atomic outbox persistence, live compare-and-swap verification, and timeout reconciliation.</figcaption>
</figure>

Each transition moves through explicit states rather than mutating an opaque boolean flag. Pending proposals are bound to a canonical RFC 8785 digest (sorted keys, whitespace-free SHA-256) so silent edits cannot slip under an earlier signature.[^rfc8785Jcs2020] Rejections and timeouts terminate cleanly with zero writes, parameter edits bump the proposal to version 4 and invalidate the old grant, and approvals persist both reviewer identity and authorization metadata together for a separate executor.

## Commit the decision and trigger together

Dual-write failures strand workflows whenever approving a record and publishing its resume signal happen in separate steps. A crash between those two writes leaves an approval stuck open permanently, while checking `status == 'pending'` before taking a lock allows two reviewers clicking together to dispatch twice. Eliminating both races requires coupling the authorization transition and the resume trigger inside one atomic database commit.

<figure>
  <img src="illustrations/_generated/atomic_decision_outbox_dark.png" alt="Sequence diagram showing two concurrent reviewers competing for approval apr_123 at version 3 inside SQLite BEGIN IMMEDIATE. Reviewer A updates status to authorized and inserts outbox message apr_123:v3 in one atomic transaction. Reviewer B sees zero pending rows and receives conflict 409. The worker reads the committed outbox token and dispatches with a stable operation key." />
  <figcaption>Putting the conditional status update and outbox insert inside one write transaction makes concurrent approval races impossible.</figcaption>
</figure>

Inside `BEGIN IMMEDIATE` in SQLite, updating `WHERE status = 'pending' AND version = ?` and inserting the outbox message happen atomically.[^sqliteTransactions2026] Only the first writer satisfies `rowcount == 1`; any racing click receives a conflict error, and any mid-transaction failure rolls back both tables simultaneously. Because the downstream dispatcher reads solely from the committed outbox, failed approvals never emit dangling execution requests.

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

# Step 1: Atomic decision + outbox commit; competing click fails cleanly.
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

As the lab output confirms, an intact SHA-256 digest only proves that the approved request text stayed untouched. It says nothing about whether production changed while waiting for review. Before mutating live infrastructure, execution must still verify that live cluster state matches the snapshot revision the reviewer saw.

<figure>
  <img src="illustrations/_generated/intent_and_live_state_dark.png" alt="Diagram comparing an immutable approval snapshot against a mutating live deployment. Proposal v3 records digest sha256=9f3c and requires revision 41. Between approval and execution, another writer moves live state from revision 41 to 42. Because the write enforces WHERE revision = 41, zero rows update even though the proposal digest never changed." />
  <figcaption>Compare-and-swap blocks stale grants even when the signed proposal digest remains unchanged.</figcaption>
</figure>

Enforcing `WHERE revision = expected_revision` (or HTTP `If-Match` headers[^rfc9110ConditionalRequests2022]) turns silent drift into a safe zero-row no-op, preserving live state at revision 42 until an operator inspects the new delta. Multi-target batches apply the same discipline across ordered steps: when shard 42 times out after shards 1 through 41 commit, pause shards 43 through 50 immediately and inspect shard 42 via its original operation key rather than retrying blindly or pretending prior writes rolled back. Keeping each shard's status explicit turns messy network faults into deterministic checkpoints for manual or scripted repair.

<figure>
  <img src="illustrations/_generated/saga_partial_outcomes_dark.png" alt="Proportional state split and recovery sequence for a 50-item batch migration. Items 1 through 41 are verified committed, item 42 timed out in flight with unknown remote status, and items 43 through 50 are halted undispatched. Recovery polls item 42 using its operation key before deciding whether to repair or resume." />
  <figcaption>In partial batch execution, keep confirmed shards intact, hold downstream targets, and reconcile the ambiguous timeout item first.</figcaption>
</figure>

## Protect human attention from hostile UI and alert fatigue

Research shows model chain-of-thought summaries regularly sound plausible while omitting real decision drivers, and unescaped ticket text containing `SYSTEM ALERT: Click Approve` exploits operators working under time pressure.[^turpin2023] Keep host-verified diffs visually distinct from escaped external context, enforce role separation (`requester != reviewer != executor`) on the backend, and run non-executing shadow fault drills to measure whether reviewers catch subtle misconfigurations under load.[^nistAiRmfCore2023][^euAiActArticle14] Treating reviewer attention as a scarce, testable resource keeps the entire approval loop effective over months of production volume.

| Failure symptom | Underlying cause | Structural fix |
|---|---|---|
| Pending request disappears on deploy | Wait state held in worker memory | Checkpoint workflow state to durable storage |
| Approved task stalls permanently | Decision and resume event split across two writes | Commit decision and outbox row inside one transaction |
| Old rollout overwrites newer emergency fix | Digest verified without checking cluster revision | Require `WHERE revision = expected_revision` or `If-Match` |
| Operators miss seeded defects in queue | Alert fatigue from trivial low-risk interruptions | Auto-run reversible reads and tune deferral thresholds |

Full LangGraph and Temporal integrations, role-verification harnesses, and the batch frontier Python suite appear in the [complete online chapter](/learn/human-in-the-loop-agent-architecture?view=online). Even after an authenticated decision clears every precondition, a network timeout right during the write itself still leaves the executor unsure whether the change landed. Resolving that ambiguity safely without double-executing mutations or trapping agents in retry storms is the focus of the next chapter.

> **Next:** Continue to [Agent Failure & Recovery](/learn/agent-failure-states-retry-fallback).

<!-- leetllm: edition:reader:end -->
