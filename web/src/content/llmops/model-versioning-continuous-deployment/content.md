---
{
  "id": "model-versioning-continuous-deployment",
  "title": "Model Versioning & Deployment",
  "slug": "model-versioning-continuous-deployment",
  "category": "MLOps & Deployment",
  "difficulty": "Medium",
  "coverImage": "social_banner.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Amazon",
    "Microsoft",
    "Anthropic"
  ],
  "shortDescription": "An engineer reverts the prompt in Git, but the serving image and retrieved corpus have already moved. The release ID must lock down the exact bundle answering users.",
  "keyConceptsTested": [
    "Behavior-producing release bundles",
    "Content-addressed artifact digests",
    "Immutable registry records and compare-and-swap aliases",
    "Offline F1 and zero-violation safety gates",
    "Hosted-model snapshot date pinning",
    "Read-only shadow evaluation and trace replay",
    "Deterministic sticky canary thread routing",
    "Canary abort versus production rollback readiness",
    "Clopper-Pearson bounds and sequential rollout checks",
    "Traceable rollout and rollback decisions"
  ],
  "section": "Applied LLM Engineering",
  "order": 21
}
---

<!-- leetllm: edition:reference:start -->
Suppose an enterprise compliance assistant tells an engineer that a payment service is approved for production deploy when the deployment registry contains no approval record. During triage, the engineer reverts a single prompt file in Git, yet the production container image still bundles a newer compiled prompt artifact and the retrieval index has shifted to an updated policy snapshot. Because each layer updates on a separate release schedule, reverting one file independently leaves live traffic running an untested hybrid configuration.

In classic software systems, source commits and build artifacts largely capture program behavior. In production machine learning and LLM services, end-to-end outputs depend on an entangled bundle: base weights or hosted snapshot date, prompt and tool schemas, retrieval corpus snapshot, decoding flags, safety filters, and the inference engine image[^sculley2015][^paleyes2022]. Treating that entire tuple as one content-addressed release bundle, promoting traffic by atomically switching environment pointers, and validating rollouts against sequential statistical bounds keeps changes reversible under pressure.

<figure>
  <img src="illustrations/_generated/model_versioning_dark.png" alt="Four runtime dependencies hashed together into one immutable release digest paired with regression drivers" />
  <figcaption>Combining weights, prompts, retrieval index snapshots, and runtime configuration into one immutable SHA-256 digest guarantees that every deployment reproduces exact end-to-end behavior.</figcaption>
</figure>

Every Python block in this walkthrough runs on deterministic in-memory telemetry for a `payments-compliance-helper` service using NumPy and SciPy, with zero network calls or external registries required. Tracing through the math and state transitions step by step reveals why hash verification, sticky bucketing, and statistical stop rules prevent partial rollbacks from hiding production regressions.

## Package every runtime dependency into one immutable digest

A filename like `policy-prompt-v4.json` identifies a mutable path, not the actual text loaded into memory at startup. Two containers pointing at the same Git tag or mutable image tag can serve completely different behaviors if an underlying file was modified or a hosted API model silently rolled forward to a newer snapshot[^ociDescriptorDigest2026]. Content-addressed registries solve this drift by hashing canonical serialized metadata alongside verified SHA-256 digests of every referenced prompt file, tool schema, retrieval collection, and runtime image[^mlflow2026registryworkflow].

Consider how many independent fields combine to shape model behavior in production:

| Bundle component | Example pin | What breaks if omitted |
|---|---|---|
| Hosted or open weights | `gpt-5.4-2026-04-01` or weight SHA-256 | Model behavior shifts silently under vendor or cluster updates[^openai2026backwardcompatibility][^openai2026deprecations] |
| Prompt and tool definitions | `prompt_sha256`, `tool_schema_sha256` | Parameter validation or function signatures drift from model instructions |
| Retrieval index snapshot | `corpus_version="2026-04-15"`, `embedder_id` | Queries retrieve stale facts or misaligned vector coordinates |
| Serving engine and flags | `runtime_image_digest`, `temperature=0.0`, `max_tokens=300` | Decoding nondeterminism or tokenizer upgrades alter formatting |

Separating **immutable release creation** from **mutable alias movement** gives deployments clean atomic semantics. Once a release bundle earns its SHA-256 digest `rev_id`, its underlying bytes never change in storage; staging, canary, and production environments simply maintain named pointers (`aliases`) with monotonically increasing integer revisions. Updating an alias through a **compare-and-swap (CAS)** transition requiring both `expected_target` and `expected_revision` defeats the classic ABA race condition: if an alias moved from `stable (r7)` to `candidate (r8)` and reverted back to `stable (r9)`, a delayed automation job still expecting `(stable, r7)` is safely rejected instead of overwriting later operational state.

<figure>
  <img src="illustrations/_generated/immutable_alias_promotion_dark.png" alt="Compare-and-swap alias state transitions paired with traffic share curves across promotion and rollback" />
  <figcaption>Compare-and-swap alias updates block stale automation jobs from overwriting recent promotions or rollbacks, while immutable release targets shift traffic safely in seconds.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=release-digest, deps=numpy,scipy -->
```python title="canonical-release-digest.py"
from dataclasses import dataclass, asdict
from hashlib import sha256
import json


def sha256_text(payload: str) -> str:
    return sha256(payload.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class ReleaseBundle:
    service: str
    model_snapshot: str
    prompt_digest: str
    tool_schema_digest: str
    corpus_version: str
    runtime_image_digest: str
    temperature: float = 0.0
    max_tokens: int = 300

    def release_id(self) -> str:
        canonical = json.dumps(asdict(self), sort_keys=True, separators=(",", ":"))
        return sha256(canonical.encode("utf-8")).hexdigest()[:12]


class AliasRegistry:
    def __init__(self, initial_prod: str) -> None:
        self._releases: dict[str, ReleaseBundle] = {}
        self._aliases: dict[str, tuple[str, int]] = {
            "production": (initial_prod, 7),
            "canary": (initial_prod, 7),
        }

    def register(self, bundle: ReleaseBundle) -> str:
        rid = bundle.release_id()
        self._releases[rid] = bundle
        return rid

    def compare_and_swap(
        self, alias: str, *, expected_target: str, expected_rev: int, new_target: str
    ) -> tuple[bool, tuple[str, int]]:
        cur_target, cur_rev = self._aliases[alias]
        if (cur_target, cur_rev) != (expected_target, expected_rev):
            return False, (cur_target, cur_rev)
        if new_target not in self._releases:
            raise KeyError(f"Unknown release: {new_target}")
        updated = (new_target, cur_rev + 1)
        self._aliases[alias] = updated
        return True, updated


stable = ReleaseBundle(
    service="payments-compliance-helper",
    model_snapshot="chat-frontier-2026-03-15",
    prompt_digest=sha256_text("cite-approved-deploy-records-v3")[:16],
    tool_schema_digest=sha256_text("read_deploy_status:v2")[:16],
    corpus_version="corpus-2026-04-01",
    runtime_image_digest="oci:sha256:99aa41",
)
candidate = ReleaseBundle(
    service="payments-compliance-helper",
    model_snapshot="chat-frontier-2026-03-15",
    prompt_digest=sha256_text("cite-approved-deploy-records-v4")[:16],
    tool_schema_digest=sha256_text("read_deploy_status:v2")[:16],
    corpus_version="corpus-2026-04-01",
    runtime_image_digest="oci:sha256:bb720c",
)

registry = AliasRegistry(initial_prod=stable.release_id())
stable_id = registry.register(stable)
cand_id = registry.register(candidate)

# Verify byte-level integrity against overwritten file
loaded_digest = sha256_text("corrupted-prompt-bytes")[:16]
print(f"Stable ID: {stable_id} | Candidate ID: {cand_id}")
print(f"Runtime prompt byte verification passed?: {loaded_digest == stable.prompt_digest}")

# Simulate ABA protection across production alias transitions
ok1, state1 = registry.compare_and_swap("production", expected_target=stable_id, expected_rev=7, new_target=cand_id)
ok2, state2 = registry.compare_and_swap("production", expected_target=cand_id, expected_rev=8, new_target=stable_id)
stale_ok, cur = registry.compare_and_swap("production", expected_target=stable_id, expected_rev=7, new_target=cand_id)
print(f"Step 1 CAS -> {ok1} {state1} | Step 2 rollback -> {ok2} {state2}")
print(f"Delayed stale CAS expecting (stable, 7) accepted?: {stale_ok} (current={cur})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Stable ID: 0727901aaf60 | Candidate ID: 2f60e93c4304
Runtime prompt byte verification passed?: False
Step 1 CAS -> True ('2f60e93c4304', 8) | Step 2 rollback -> True ('0727901aaf60', 9)
Delayed stale CAS expecting (stable, 7) accepted?: False (current=('0727901aaf60', 9))
```
<!-- leetllm: output:end -->

Every byte check in that registry closes a real failure mode. Notice why comparing against `(stable_id, 7)` failed after `rev=8` reverted back to `stable_id` at `rev=9`: the version counter exposes intermediate transitions even when the target pointer returned to its starting digest. Next, before routing any live user request toward `cand_id`, every candidate bundle must pass offline metric gates, deterministic trace replay, and read-only shadow checks[^sato2019].

## Validate candidates via offline F1, trace replay, and read-only shadow runs

Offline evaluation checks both classification utility and hard safety thresholds across labeled incidents. Treating `SERVE` (delivering an evidence-backed response) as the positive class and `ABSTAIN` as negative isolates unsupported hallucinations clearly: if a suite logs `84` supported serves (`TP`), `4` unsupported serves (`FP`), and `8` false abstentions (`FN`), route F1 equals $2 \times 84 / (2 \times 84 + 4 + 8) = 0.933$, whereas precision alone (`84 / 88 = 0.955`) omits missed answers. Crucially, clearing a `0.92` F1 floor still rejects the candidate whenever safety rules enforce zero unsupported serves.

Once offline suites pass, engineers replay captured failure traces (`trace-0412`) against the candidate bundle without issuing live mutations. During replay, a recorded tool transcript only remains valid when both tool name and invocation arguments match (`read_policy(version=7)`); if the new prompt requests `read_policy(version=8)` and the harness has no verified snapshot for version 8, replay must halt and flag the argument divergence rather than silently re-feeding version 7 data or hitting mutable production endpoints. Similarly, distributed shadow workers copying live read traffic must satisfy **both** credential permissions and per-worker tool allowlists (and block write tools completely), while Welch's two-sample t-test on shadow latency distributions verifies tail regressions (`p < 0.05`) before real users see a single token[^argoCanaryRouting2026].

<!-- leetllm: test, output=show, continue=release-digest, id=offline-eval-replay, deps=numpy,scipy -->
```python title="offline-f1-and-trace-replay.py"
import numpy as np
from scipy import stats

# 1) Offline route F1 vs zero-violation safety rule
tp_served, fp_unsupported, fn_abstained = 84, 4, 8
route_precision = tp_served / (tp_served + fp_unsupported)
route_f1 = (2 * tp_served) / (2 * tp_served + fp_unsupported + fn_abstained)
offline_pass = route_f1 >= 0.92 and fp_unsupported == 0
print(f"Offline route precision={route_precision:.3f}, F1={route_f1:.3f}, gate_pass={offline_pass}")


# 2) Replay tool-invocation integrity check
def check_replay_tool_match(recorded_call: tuple[str, int], candidate_call: tuple[str, int]) -> str:
    if recorded_call == candidate_call:
        return "EXACT_REPLAY_MATCH"
    return f"STOP_MISMATCH: expected {recorded_call}, got {candidate_call}"


print("Replay check A:", check_replay_tool_match(("read_policy", 7), ("read_policy", 7)))
print("Replay check B:", check_replay_tool_match(("read_policy", 7), ("read_policy", 8)))


# 3) Dual authorization check (role scopes AND worker allowlist AND read-only)
def authorize_shadow_tool(worker_scopes: set[str], worker_allowlist: set[str], tool: str, scope: str, writes: bool) -> bool:
    return (not writes) and (tool in worker_allowlist) and (scope in worker_scopes)


print(
    "Shadow tool checks (A policy, B case, C unprivileged):",
    [
        authorize_shadow_tool({"cases:read", "policies:read"}, {"read_case"}, "read_policy", "policies:read", False),
        authorize_shadow_tool({"cases:read", "policies:read"}, {"read_case"}, "read_case", "cases:read", False),
        authorize_shadow_tool({"policies:read"}, {"read_case", "read_policy"}, "read_case", "cases:read", False),
    ],
)

# 4) Welch's t-test on shadow latencies (stable vs candidate regression test)
rng = np.random.default_rng(42)
stable_lat_ms = rng.normal(loc=410.0, scale=45.0, size=250)
cand_lat_ms = rng.normal(loc=468.0, scale=65.0, size=250)
t_stat, p_val = stats.ttest_ind(cand_lat_ms, stable_lat_ms, equal_var=False)
print(f"Welch t-test (cand vs stable mean {cand_lat_ms.mean():.1f} vs {stable_lat_ms.mean():.1f} ms): t={t_stat:.2f}, p={p_val:.2e}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Offline route precision=0.955, F1=0.933, gate_pass=False
Replay check A: EXACT_REPLAY_MATCH
Replay check B: STOP_MISMATCH: expected ('read_policy', 7), got ('read_policy', 8)
Shadow tool checks (A policy, B case, C unprivileged): [False, True, False]
Welch t-test (cand vs stable mean 469.5 vs 407.8 ms): t=12.75, p=7.72e-32
```
<!-- leetllm: output:end -->

Every safeguard in that stage works together without touching production user streams. Notice how Welch's test handles unequal variances natively (`equal_var=False`) when a candidate's new prompt adds noisy tail latency before reaching customers. Once shadow evaluation is clean, live rollout starts at minimal blast radius with deterministic thread assignment.

## Route multi-turn conversations with sticky hashing and denominator checks

Splitting single requests uniformly at random breaks stateful AI conversations: if turn 1 invokes candidate retrieval and turn 2 falls back to stable prompt formatting, assistant tone, tool formatting, and citation numbering oscillate mid-thread. Production gateways instead compute a deterministic bucket from `SHA-256(conversation_id) mod 100` on a thread's first request and pin that chosen release across subsequent turns even as canary exposure widens from `10%` to `25%` or `50%`[^argoCanaryRouting2026].

<figure>
  <img src="illustrations/_generated/sticky_canary_routing_dark.png" alt="Deterministic SHA-256 conversation hash router and abort override paired with thread vs request volume skew" />
  <figcaption>Sticky conversation hashing preserves consistent prompts across multi-turn chats while allowing immediate abort fallback, and tracking request volume prevents power-user threads from masking overload.</figcaption>
</figure>

Two subtle operational behaviors follow directly from sticky conversation hashing. First, **thread exposure percentage rarely equals request share**: if 2 out of 20 conversations (`10%` of threads) route to the candidate and happen to be power users averaging 9 requests per thread while the 18 stable threads average 1 request each, candidate pods carry `18 / 36 = 50%` of live query load despite a `10%` conversation split! Always monitor thread counts and request counts with separate denominators. Second, an explicit **canary abort override** must trump thread stickiness immediately: if the candidate triggers a safety alert, setting canary exposure to `0%` and blocking `cand_id` overrides existing thread pins cleanly back to `stable_id` so affected conversations heal on their next turn.

<!-- leetllm: test, output=show, continue=offline-eval-replay, id=sticky-canary-router, deps=numpy,scipy -->
```python title="sticky-canary-hash-router.py"
class StickyCanaryRouter:
    def __init__(self, stable_id: str, candidate_id: str, pct: int = 10) -> None:
        self.stable_id = stable_id
        self.candidate_id = candidate_id
        self.pct = pct
        self.aborted = False
        self.pins: dict[str, str] = {}

    def _bucket(self, thread_id: str) -> int:
        digest = sha256(thread_id.encode("utf-8")).hexdigest()
        return int(digest[:8], 16) % 100

    def route(self, thread_id: str) -> str:
        if self.aborted or self.pct <= 0:
            self.pins[thread_id] = self.stable_id
            return self.stable_id
        if thread_id in self.pins:
            return self.pins[thread_id]
        chosen = self.candidate_id if self._bucket(thread_id) < self.pct else self.stable_id
        self.pins[thread_id] = chosen
        return chosen


router = StickyCanaryRouter(stable_id, cand_id, pct=10)
sample_threads = [f"thread-{i}" for i in range(20)]
assigned = [router.route(tid) for tid in sample_threads]
cand_threads = [tid for tid, rid in zip(sample_threads, assigned) if rid == cand_id]

# Existing stable threads stay on stable when widening; abort overrides all pins immediately
existing_stable = next(tid for tid, rid in zip(sample_threads, assigned) if rid == stable_id)
router.pct = 100
print(f"10% split candidate threads: {len(cand_threads)}/20 | widening keeps {existing_stable} on stable?: {router.route(existing_stable) == stable_id}")

# Demonstrate heavy-hitter skew: 2 candidate threads x 9 turns vs 18 stable threads x 1 turn
cand_reqs = 2 * 9
stable_reqs = 18 * 1
print(f"Thread share={2/20:.0%} vs Observed request load share={cand_reqs/(cand_reqs + stable_reqs):.0%}")

router.aborted = True
print(f"After canary abort, former candidate thread moves to stable?: {all(router.route(t) == stable_id for t in cand_threads)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
10% split candidate threads: 3/20 | widening keeps thread-0 on stable?: True
Thread share=10% vs Observed request load share=50%
After canary abort, former candidate thread moves to stable?: True
```
<!-- leetllm: output:end -->

Every routing invariant shows up transparently in that simulation: widening grows future threads without flipping mid-conversation context, request-volume skewness surfaces instantly alongside thread exposure, and a single abort boolean reclaims every live thread on the next turn without losing request identity.

## Apply sequential canary gates, SPRT bounds, and rollback readiness

Once live canary windows emit telemetry, an automated controller classifies each window into `PASS`, `HOLD`, or `ABORT` under strict precedence rules[^automated_rollback_ml]:

1. **Attribution check first:** Reject telemetry belonging to another release or rollout attempt (`HOLD`), because failures or passes from an outdated run cannot judge the active release.
2. **Safety breach precedence:** Even if telemetry lacks full latency coverage or sample volume, **any confirmed unsupported serve triggers immediate `ABORT`**. Waiting for cleaner latency histograms while serving wrong compliance answers widens blast radius needlessly.
3. **Telemetry completeness (`HOLD`):** Missing latency samples (`1,100` latencies on `1,500` requests) or undersized windows halt promotion until observability repairs complete.

Even across zero-violation windows, sample size determines what confidence you have earned. Under fixed independent binomial sampling of $n$ trials with $k$ observed failures, the exact one-sided $95\%$ Clopper-Pearson upper failure bound comes from the Beta quantile $B^{-1}(0.95;\, k + 1,\, n - k)$, simplifying cleanly to $1 - 0.05^{1/n}$ when $k = 0$: at $n = 500$, zero violations still permit up to `0.597%` latent errors, whereas clearing $n = 1,200$ tightens the upper bound to `0.250%` cleanly below a `0.5%` ceiling. When inspecting continuous streaming batches instead of one fixed horizon, Wald's **Sequential Probability Ratio Test (SPRT)** accumulates log-likelihood ratios step by step ($\Lambda_t = \sum [k_i \ln(p_1/p_0) + (n_i - k_i)\ln((1-p_1)/(1-p_0))]$), aborting the `10%` failure stream (`112/8,000 = 1.4%`) decisively while passing clean cohorts!

<figure>
  <img src="illustrations/_generated/progressive_rollout_safety_loop_dark.png" alt="Canary window unsupported-serve rates vs the 0.5% gate cap alongside the one-sided 95% zero-failure bound" />
  <figcaption>Canary promotion requires clearing both observed unsupported-serve limits and finite-sample confidence bounds so small clean batches are never mistaken for production safety.</figcaption>
</figure>

Finally, distinguish **canary abort** from **production rollback**. During a canary abort, the production pointer never left `stable_id`; dropping canary exposure to zero removes the candidate safely. After full promotion, production recovery moves the live `production` alias back to the previous retained release (`stable_id`), yet that rollback only restores service if engineers verify both **returning replica throughput** (`195 req/s >= 180 req/s` demand rather than scaled-down `169 req/s`) and **backward-compatible conversation schema reading** (`v3` vs `v2`).

<figure>
  <img src="illustrations/_generated/canary_abort_vs_production_rollback_dark.png" alt="Canary abort vs post-promotion rollback readiness capacity against returning traffic demand" />
  <figcaption>Aborting a canary drains only experimental traffic onto intact production replicas, whereas rolling back a full promotion requires sufficient warm capacity and schema compatibility on the restored release.</figcaption>
</figure>

<!-- leetllm: test, output=show, continue=sticky-canary-router, id=sequential-canary-gate, deps=numpy,scipy -->
```python title="sequential-canary-sprt-gate.py"
def clopper_pearson_upper_95(failures: int, n: int) -> float:
    return float(stats.beta.ppf(0.95, failures + 1, n - failures))


def evaluate_canary_window(
    *,
    window_name: str,
    rollout_id: str,
    expected_rollout: str,
    requests: int,
    latency_samples: int,
    unsupported_serves: int,
    p95_ms: float,
    max_p95_ms: float = 530.0,
) -> str:
    if rollout_id != expected_rollout:
        return f"{window_name}: HOLD (wrong rollout attribution {rollout_id})"
    if unsupported_serves > 0:
        return f"{window_name}: ABORT ({unsupported_serves}/{requests} = {unsupported_serves/requests:.2%} unsupported serves)"
    if latency_samples < requests:
        return f"{window_name}: HOLD (incomplete latency telemetry {latency_samples}/{requests})"
    if p95_ms > max_p95_ms:
        return f"{window_name}: ABORT (p95 {p95_ms:.0f}ms > {max_p95_ms:.0f}ms)"
    ub = clopper_pearson_upper_95(unsupported_serves, requests)
    return f"{window_name}: PASS (0 violations; 95% upper risk bound = {ub:.3%})"


print(evaluate_canary_window(window_name="1% Clean", rollout_id="R89", expected_rollout="R89", requests=1200, latency_samples=1200, unsupported_serves=0, p95_ms=525.0))
print(evaluate_canary_window(window_name="10% Bad", rollout_id="R89", expected_rollout="R89", requests=8000, latency_samples=8000, unsupported_serves=112, p95_ms=495.0))
print(evaluate_canary_window(window_name="Gapped", rollout_id="R89", expected_rollout="R89", requests=1500, latency_samples=1100, unsupported_serves=0, p95_ms=480.0))

# Sequential Probability Ratio Test (H0: p0=0.002 healthy vs H1: p1=0.012 degraded; alpha=beta=0.01)
p0, p1 = 0.002, 0.012
upper_stop = np.log((1 - 0.01) / 0.01)  # ~ +4.60 triggers H1 ABORT
lower_stop = np.log(0.01 / (1 - 0.01))  # ~ -4.60 triggers H0 PASS
bad_batch_k = np.array([4, 7, 11, 14])
bad_batch_n = np.full(4, 1000)
llr = np.cumsum(bad_batch_k * np.log(p1 / p0) + (bad_batch_n - bad_batch_k) * np.log((1 - p1) / (1 - p0)))
print(f"Cumulative SPRT LLR (1.4%-like stream): {np.round(llr, 2).tolist()} (abort threshold={upper_stop:.2f})")

# Post-rollback capacity + conversation state readability check (demand = 180 req/s, schema v3)
checks = [
    ("WarmOK", 195, {"v2", "v3"}),
    ("ScaledDown", 169, {"v2", "v3"}),
    ("OldReaderOnly", 195, {"v2"}),
]
for label, cap_rps, supported_schemas in checks:
    ready = (cap_rps >= 180) and ("v3" in supported_schemas)
    print(f"Rollback readiness [{label:13s}]: rps={cap_rps}, schemas={sorted(supported_schemas)} -> ready={ready}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1% Clean: PASS (0 violations; 95% upper risk bound = 0.249%)
10% Bad: ABORT (112/8000 = 1.40% unsupported serves)
Gapped: HOLD (incomplete latency telemetry 1100/1500)
Cumulative SPRT LLR (1.4%-like stream): [-2.86, -0.32, 9.43, 24.58] (abort threshold=4.60)
Rollback readiness [WarmOK       ]: rps=195, schemas=['v2', 'v3'] -> ready=True
Rollback readiness [ScaledDown   ]: rps=169, schemas=['v2', 'v3'] -> ready=False
Rollback readiness [OldReaderOnly]: rps=195, schemas=['v2'] -> ready=False
```
<!-- leetllm: output:end -->

LOOK AT THAT FULL PIPELINE IN ONE PLACE: Clopper-Pearson upper risk bounds, precedence-ordered canary gating (`attribution -> breach -> telemetry -> latency`), sequential Wald SPRT accumulation crossing the exact alert barrier in batch 2, and operational readiness verification (`195 req/s >= 180` AND `v3` state compatibility) before declaring any rollback healthy. Once a restored release is live and serving cleanly, every downstream request must also carry that release ID directly into answer-cache scope so stale or bad responses from another revision never leak back to users.

```mastery-quiz
[
  {
    "question": "A model loader reads prompt file policy-v4.json. The retained release pins its original SHA-256 byte digest, yet the local file was modified on disk while the model snapshot ID remained identical. Which action keeps releases reproducible?",
    "options": [
      "Keep serving the runtime container unchanged and emit a telemetry warning logging the modified prompt checksum.",
      "Update the release manifest checksum in place to match disk edits while preserving historical benchmark scores.",
      "Reject the mismatch at startup, restore pinned artifact bytes, or cut and re-evaluate a new release bundle.",
      "Resolve runtime configuration by mounted filename and checkpoint ID so local hotfixes ship cleanly without rebuilds."
    ],
    "answer": "Reject the mismatch at startup, restore pinned artifact bytes, or cut and re-evaluate a new release bundle.",
    "explanation": "Filenames are mutable pointers, not byte-integrity checks. Serving unverified bytes creates an untested runtime combination; restore the retained artifact bytes or create and evaluate a fresh bundle ID."
  },
  {
    "question": "An atomic alias log progressed stable (rev 7) -> candidate (rev 8) -> stable (rev 9). A stale automation worker tries a compare-and-swap expecting (stable, rev 7). How should the registry respond?",
    "options": [
      "Reject the stale compare-and-swap so callers re-read state and retry against (stable, rev 9).",
      "Commit the transition immediately because current production alias target already points back to stable.",
      "Match expected target strings cleanly and increment the monotonic revision counter forward to revision 10.",
      "Freeze mutations on the production alias until manual inspection clears the repeated target history."
    ],
    "answer": "Reject the stale compare-and-swap so callers re-read state and retry against (stable, rev 9).",
    "explanation": "Comparing both target ID and monotonic revision defeats ABA races. Matching the target name alone ignores two intervening transitions between rev 7 and rev 9."
  },
  {
    "question": "An offline benchmark logs 84 supported serves, 4 unsupported serves, and 8 false abstentions. With route F1 >= 0.92 and a zero-unsupported-serves requirement, what is route F1 and should the bundle advance?",
    "options": [
      "F1 = 0.955; advance candidate.",
      "F1 = 0.955; reject candidate.",
      "F1 = 0.933; advance candidate.",
      "F1 = 0.933; reject candidate."
    ],
    "answer": "F1 = 0.933; reject candidate.",
    "explanation": "F1 = 2 * 84 / (2 * 84 + 4 + 8) = 168 / 180 = 0.933, clearing 0.92. Precision (84/88 = 0.955) ignores missed answers. Despite clearing F1, the 4 unsupported serves violate the zero-violation safety rule, so the candidate fails promotion."
  },
  {
    "question": "Twenty new conversations contain two candidate threads averaging 9 requests each, while the 18 stable threads average 1 request each. How should candidate exposure be reported?",
    "options": [
      "10% of conversations and 50% of requests.",
      "10% of conversations and 10% of requests.",
      "50% of conversations and 50% of requests.",
      "50% of conversations and 10% of requests."
    ],
    "answer": "10% of conversations and 50% of requests.",
    "explanation": "2/20 = 10% of threads route to candidate, yet those threads generate 18 out of 36 total queries (50%). Sticky thread routing can skew request load significantly above bucket thresholds."
  },
  {
    "question": "Under expected rollout R89, window A arrives under R88 with 1 unsupported serve. Window B arrives under R89 with 1 unsupported serve and incomplete latency samples. Window C arrives under R89 with 0 unsupported serves and 1,100/1,500 latency samples. What verdicts apply to A, B, and C?",
    "options": [
      "A: ABORT; B: HOLD; C: HOLD.",
      "A: HOLD; B: ABORT; C: HOLD.",
      "A: HOLD; B: ABORT; C: PASS.",
      "A: ABORT; B: ABORT; C: PASS."
    ],
    "answer": "A: HOLD; B: ABORT; C: HOLD.",
    "explanation": "Window A reflects a different rollout attempt (R88) and cannot judge R89. Window B confirms a violation under R89, triggering immediate ABORT even with missing latency samples. Window C has zero violations yet fails telemetry completeness, triggering HOLD."
  },
  {
    "question": "At fixed sample size n = 500 independent evaluations with zero observed failures, the exact one-sided 95% upper bound 1 - 0.05^(1/500) equals roughly 0.597%. What does that statistic justify?",
    "options": [
      "Latent failure probability equals zero regardless of whether peeking triggered early stopping.",
      "With 95% confidence on fixed n = 500 trials, latent risk stays <= 0.597%; early stopping voids it.",
      "Latent defect rates exceed 5% unless sample counts reach 2,000 queries across production slices.",
      "Scaling sample size from 500 to 1,000 leaves the 95% binomial upper risk bound unchanged near 0.6%."
    ],
    "answer": "With 95% confidence on fixed n = 500 trials, latent risk stays <= 0.597%; early stopping voids it.",
    "explanation": "Zero observed failures in 500 trials tighten the 95% upper risk bound to 0.597%, provided sample size n was fixed before looking at outcomes and trials are independent."
  }
]
```

> **Next:** Continue to [Semantic Caching & Cost Optimization](/learn/semantic-caching-cost-latency-optimization). A restored release can still leak superseded answers if cache lookups omit release identity; carry `release_id`, `corpus_version`, `tenant_id`, and freshness TTL rules directly into cache scope.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
An engineer reverts a failing prompt template in Git, watches CI turn green, and yet broken answers keep streaming to production users. Why? Because the serving image still wraps a stale compiled prompt, the vector retrieval snapshot moved yesterday, and the hosted model API updated its default alias last week. In LLM systems, code in a repository rarely captures the complete running system; behavior depends on the **entire runtime bundle** executing together[^sculley2015][^paleyes2022].

## A release is the whole bundle

Version weights alone leave teams blind to three bigger sources of production regressions: prompt and tool schema edits, retrieval corpus changes, and runtime flags or dependencies[^sato2019]. Updating any single layer independently produces an untested combination because system instructions, tool argument shapes, and chunk embeddings interact tightly at inference time. Packaging all dependencies into a canonical metadata bundle (`model_snapshot`, `prompt_digest`, `tool_schema_digest`, `corpus_version`, `runtime_image_digest`, decoding configuration) turns every live deployment into an unambiguous, reproducible artifact.

<figure>
  <img src="illustrations/_generated/model_versioning_dark.png" alt="Four runtime dependencies hashed together into one immutable release digest paired with regression drivers" />
  <figcaption>Combining weights, prompts, retrieval index snapshots, and runtime configuration into one immutable SHA-256 digest guarantees that every deployment reproduces exact end-to-end behavior.</figcaption>
</figure>

## Filenames lie, so hash the bytes

Mutable filenames and tags conceal silent drift on disk. Hashing canonical JSON metadata alongside byte-level SHA-256 digests ensures two deployments share an identical `release_id` if and only if every underlying component matches byte for byte[^ociDescriptorDigest2026][^mlflow2026registryworkflow]. At startup, containers recompute hashes of mounted prompts and schemas before joining load-balancer rotation, rejecting mismatched files automatically instead of serving drifted prompts under an old version label.

<!-- leetllm: test, output=show, id=reader-release-digest, deps=numpy,scipy -->
```python title="reader-bundle-digest.py"
from hashlib import sha256
import json


def bundle_digest(model_snapshot: str, prompt_text: str, corpus_version: str, runtime_tag: str) -> str:
    payload = {
        "model": model_snapshot,
        "prompt_sha": sha256(prompt_text.encode("utf-8")).hexdigest()[:16],
        "corpus": corpus_version,
        "runtime": runtime_tag,
    }
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return sha256(encoded).hexdigest()[:12]


stable_id = bundle_digest("frontier-2026-03-15", "cite-deploy-v3", "corpus-2026-04", "vllm-0.8")
cand_id = bundle_digest("frontier-2026-03-15", "cite-deploy-v4", "corpus-2026-04", "vllm-0.9")
print(f"Stable digest: {stable_id} | Candidate digest: {cand_id} | Equal?: {stable_id == cand_id}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Stable digest: 5c5a5cb9868a | Candidate digest: b26e89f85d78 | Equal?: False
```
<!-- leetllm: output:end -->

## Fixed records, movable pointers

Rather than rebuilding images to swap environments, store release bundles immutably and expose traffic through mutable pointers (`staging`, `canary`, `production`). Using atomic compare-and-swap transitions (`expected_target` + `expected_revision`) protects against delayed rollouts overwriting intervening emergencies even when an environment temporarily visits and leaves an earlier digest. Zero-code rollbacks revert `production` back to the retained stable bundle in seconds without waiting for a new container build or CI run.

<figure>
  <img src="illustrations/_generated/immutable_alias_promotion_dark.png" alt="Compare-and-swap alias state transitions paired with traffic share curves across promotion and rollback" />
  <figcaption>Compare-and-swap alias updates block stale automation jobs from overwriting recent promotions or rollbacks, while immutable release targets shift traffic safely in seconds.</figcaption>
</figure>

## Offline checks, trace replay, and shadow validation

Before touching live users, candidate bundles must clear offline route F1 (`2 * TP / (2 * TP + FP + FN)`) alongside zero-tolerance safety checks and Welch's t-tests across shadow traffic[^openai2026backwardcompatibility][^openai2026deprecations]. Replaying failed historical traces must halt cleanly whenever candidate tool calls ask for versions or parameters missing from the captured trace, preventing invalid offline comparisons. Async shadow workers also require both scoped read credentials and explicit tool allowlists with write actions blocked so shadowing never alters live state.

## Canaries: real users, limited blast radius

When opening live traffic, hash `conversation_id` modulo 100 (`SHA-256`) on each thread's opening request and pin the selected release for that conversation's lifetime. Sticky routing prevents mid-chat prompt oscillation across canary ramp steps while preserving an instant abort switch that overrides all pins back to stable[^argoCanaryRouting2026]. Always track thread share separately from query volume, since active multi-turn threads can turn a `10%` bucket split into `50%` of live request load.

<figure>
  <img src="illustrations/_generated/sticky_canary_routing_dark.png" alt="Deterministic SHA-256 conversation hash router and abort override paired with thread vs request volume skew" />
  <figcaption>Sticky conversation hashing preserves consistent prompts across multi-turn chats while allowing immediate abort fallback, and tracking request volume prevents power-user threads from masking overload.</figcaption>
</figure>

<!-- leetllm: test, output=show, continue=reader-release-digest, id=reader-sticky-router, deps=numpy,scipy -->
```python title="reader-sticky-canary-router.py"
def sticky_bucket(thread_id: str) -> int:
    return int(sha256(thread_id.encode("utf-8")).hexdigest()[:8], 16) % 100


aborted = False
pins: dict[str, str] = {}


def pick_release(thread_id: str, pct: int = 10) -> str:
    if aborted or pct <= 0:
        pins[thread_id] = stable_id
        return stable_id
    if thread_id not in pins:
        pins[thread_id] = cand_id if sticky_bucket(thread_id) < pct else stable_id
    return pins[thread_id]


threads = [f"chat-{i}" for i in range(10)]
assignments = [pick_release(t, pct=20) for t in threads]
print(f"20% bucket count on candidate: {sum(r == cand_id for r in assignments)}/10")
aborted = True
print(f"All returned to stable after abort?: {all(pick_release(t, 100) == stable_id for t in threads)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
20% bucket count on candidate: 2/10
All returned to stable after abort?: True
```
<!-- leetllm: output:end -->

## Pass, hold, or abort on statistical confidence

Live canary controllers apply strict decision precedence rather than treating every metric equally. Telemetry from an earlier rollout attempt enters `HOLD` automatically, whereas any confirmed safety breach triggers immediate `ABORT` even before full latency histograms finish arriving. Across clean windows, engineers use fixed-horizon Clopper-Pearson bounds ($1 - 0.05^{1/n}$ at zero errors) or sequential probability ratio tests before advancing candidate exposure[^automated_rollback_ml].

<figure>
  <img src="illustrations/_generated/progressive_rollout_safety_loop_dark.png" alt="Canary window unsupported-serve rates vs the 0.5% gate cap alongside the one-sided 95% zero-failure bound" />
  <figcaption>Canary promotion requires clearing both observed unsupported-serve limits and finite-sample confidence bounds so small clean batches are never mistaken for production safety.</figcaption>
</figure>

## Abort or roll back, then confirm production readiness

Ending a failing canary leaves `production` untouched on stable and drops canary exposure straight to zero. By contrast, recovering from a faulty full promotion restores the `production` pointer back to its prior verified digest. Neither recovery event is complete until operations verifies that retained replicas absorb full returning traffic (`WarmOK >= 180 req/s`) and read active conversation schemas cleanly.

<figure>
  <img src="illustrations/_generated/canary_abort_vs_production_rollback_dark.png" alt="Canary abort vs post-promotion rollback readiness capacity against returning traffic demand" />
  <figcaption>Aborting a canary drains only experimental traffic onto intact production replicas, whereas rolling back a full promotion requires sufficient warm capacity and schema compatibility on the restored release.</figcaption>
</figure>

<!-- leetllm: test, output=show, continue=reader-sticky-router, id=reader-canary-gate, deps=numpy,scipy -->
```python title="reader-zero-fail-upper-bound.py"
from scipy import stats

n_clean = 500
zero_fail_upper_95 = float(stats.beta.ppf(0.95, 1, n_clean))
can_handle_peak = 195 >= 180
supports_v3_state = True
print(f"Zero-error 95% upper bound at n={n_clean}: {zero_fail_upper_95:.3%}")
print(f"Rollback ready under peak load & schema?: {can_handle_peak and supports_v3_state}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Zero-error 95% upper bound at n=500: 0.597%
Rollback ready under peak load & schema?: True
```
<!-- leetllm: output:end -->
<!-- leetllm: edition:reader:end -->
