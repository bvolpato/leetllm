---
{
  "id": "recursive-language-models-rlm",
  "title": "Recursive Language Models (RLM)",
  "slug": "recursive-language-models-rlm",
  "section": "Advanced Agents & Retrieval",
  "category": "Reasoning & Scaling",
  "difficulty": "Hard",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google DeepMind",
    "Meta",
    "Prime Intellect"
  ],
  "shortDescription": "When an API manual exceeds a single prompt and summaries lose critical exceptions, store the text in an external Python REPL so a root model inspects, splits, delegates, and aggregates slices under tight call budgets and evidence checks.",
  "keyConceptsTested": [
    "RLM architecture: prompt as external environment state",
    "Symbolic recursion vs. standard tool-agent loops",
    "Task complexity scaling: O(1), O(N), O(N^2)",
    "REPL-mediated context slicing and truncation",
    "Sub-call fan-out, shared call caps, and wave batching",
    "Native recursive post-training for smaller models",
    "Decomposition hints vs. naive recursive reasoning",
    "Cost-quality trade-offs on long-context benchmarks",
    "Execution isolation for generated REPL code",
    "Citation deduplication vs. majority-vote reinforcement"
  ],
  "order": 15,
  "coverImage": "illustrations/_generated/rlm_architecture_dark.png",
  "prerequisites": [
    "function-calling-tool-use-llms",
    "long-context-engineering-beyond-management",
    "code-generation-agents-sandboxing",
    "agent-failure-states-retry-fallback"
  ],
  "relatedQuestions": [
    "vector-database-internals-hnsw-ivf",
    "long-context-engineering-beyond-management",
    "reasoning-models-test-time-compute",
    "code-generation-agents-sandboxing"
  ]
}
---

[Agent recovery](/learn/agent-failure-states-retry-fallback) introduced finite tool loops and explicit failure states. Suppose an application needs every deprecated-endpoint exception across an API manual that is far too large for one model request. Summarizing the whole file upfront can drop an expiry date, and top-$k$ embedding retrieval can miss cross-referenced clauses scattered across appendices.

Even when a corpus technically fits inside an advertised context window, accuracy still degrades as distractors accumulate. Researchers often call this empirical drop "context rot", while its exact attention mechanisms remain active areas of study.[^zhang2025rlm] Dense full-prompt attention scales quadratically in compute with sequence length, though cached token decoding attends to prior keys linearly per step rather than recomputing the entire prefix matrix at every output token.[^dao2022] Output limits cap single responses, yet many questions only require assembling clean structured answers once the right evidence spans are isolated.

A <span data-glossary="recursive-language-model">recursive language model (RLM)</span> shifts where raw context lives.[^zhang2025rlm] Rather than stuffing the corpus into the prompt, the runtime stores it as a variable inside a programmable Python REPL. The root language model sees compact metadata plus recent execution observations, and writes Python code to search, slice, transform, and partition the data. Inside that code, the controller can launch child model calls: `llm_query` triggers a plain completion over a chosen text span, while `rlm_query` starts a nested controller with its own REPL namespace when recursion is enabled. Namespace separation keeps child variables distinct, though OS-level sandboxing still requires container or VM isolation outside Python.

## Keep the source corpus external to the root prompt

Think of a program reading sections of a large file from disk while keeping only loop indices and extracted records in registers. The root model prompt acts like those working registers, holding task instructions and recent console previews, while the Python environment holds the raw text and intermediate arrays. Keeping the bulk text out of working registers lets the controller iterate across large manuals without overflowing its attention budget.

The MIT OASYS reference architecture initializes a Python interpreter, binds the input corpus to a variable such as `context`, and exposes helper functions for child queries.[^zhang2025rlm] Because generated Python code stitches together sub-call outputs programmatically, the assembled result can even exceed one model call's single output limit. Every leaf and merge step still operates under finite context limits, so the controller must account for instruction overhead and output reserves before sending any request.

<figure>
  <img src="illustrations/_generated/rlm_architecture_dark.png" alt="A root model sends generated Python code to an external REPL holding the corpus and variables, receives truncated previews back, delegates slices through plain llm_query or nested rlm_query calls, and merges structured answers." />
  <figcaption>The root prompt holds compact observations rather than the raw corpus. Separate Python namespaces do not provide process isolation; untrusted execution needs an external sandbox.</figcaption>
</figure>

Unlike a static summarization tree, an interactive REPL lets the controller change strategy mid-run.[^zhang2025rlmblog] Code can locate section headers with regular expressions, inspect date stamps, or filter out changelog noise before invoking child models. Adaptivity is a structural option rather than a universal win: on clean hierarchical documents, a deterministic pipeline can achieve higher throughput at lower latency, while adaptive search shines when structure varies across inputs. Always preserve an immutable copy of the source corpus outside writable REPL globals so faulty code cannot silently overwrite reference records.

## Match decomposition to task complexity

Information-processing complexity determines whether a long-context task needs simple lookup, linear scanning, or pairwise comparison.[^zhang2025rlm] Consider searching $N$ manual clauses of roughly equal size. Finding one version header can succeed in $O(1)$ sub-calls once an index or keyword offset narrows the span. Aggregating all exception dates requires visiting every relevant section in $O(N)$ work. Checking every unordered pair of deprecation notices for mutual contradictions scales as $O(N^2)$ comparisons:

$$
\text{Pairs}(N) = \frac{N(N - 1)}{2}
$$

Doubling the corpus from $N = 5{,}000$ to $N = 10{,}000$ items nearly quadruples exact pair comparisons from $12{,}497{,}500$ to $49{,}995{,}000$. Even when each leaf comparison takes only a fraction of a second, quadratic scaling rapidly turns a straightforward audit into thousands of dollars of unnecessary token generation. Running the NumPy calculation below confirms both the exact counts and the relative growth curves across $1\times$ to $5\times$ input sizes.

<!-- leetllm: test, output=show -->
```python title="Constant, linear, and quadratic sub-call scaling across corpus sizes"
import numpy as np

counts = np.array([5_000, 10_000], dtype=np.int64)
pairs = counts * (counts - 1) // 2
ratio = pairs[1] / pairs[0]

scale = np.array([1, 2, 3, 4, 5], dtype=np.int64)
work_table = np.column_stack([scale, np.ones_like(scale), scale, scale ** 2])

print("5,000 items pairs:", int(pairs[0]))
print("10,000 items pairs:", int(pairs[1]))
print(f"Doubling ratio: {ratio:.3f}x")
print("Relative work [scale, O(1), O(N), O(N^2)]:")
print(work_table)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
5,000 items pairs: 12497500
10,000 items pairs: 49995000
Doubling ratio: 4.000x
Relative work [scale, O(1), O(N), O(N^2)]:
[[ 1  1  1  1]
 [ 2  1  2  4]
 [ 3  1  3  9]
 [ 4  1  4 16]
 [ 5  1  5 25]]
```
<!-- leetllm: output:end -->

In `zhang2025rlm`, base model accuracy falls steadily on OOLONG and OOLONG-Pairs as document length increases, even before hitting hard context ceilings.[^zhang2025rlm] Analyzing complexity upfront stops engineers from blindly sending dense all-pairs prompts to a single context window. Instead, Python code can index, hash, or cluster records in milliseconds so child model calls only inspect candidate pairs.

<figure>
  <img src="illustrations/_generated/task_complexity_scaling_dark.png" alt="A line chart plots normalized work multipliers from 1x to 5x input size for constant O(1) lookup, linear O(N) scans, and quadratic O(N^2) pairwise checks. Metric cards show 12,497,500 unordered pairs at 5,000 items and 49,995,000 pairs at 10,000 items, a 4.00x increase." />
  <figcaption>Task complexity governs sub-call count. An RLM does not erase quadratic pair growth unless REPL code prunes non-matching candidates first.</figcaption>
</figure>

```checkpoint
An API audit asks whether any deprecation grace period in one appendix conflicts with SLA clauses in 400 other sections. Which factor primarily governs model call cost before pruning?
---
Quadratic $O(N^2)$ cross-section relationships rather than the raw byte length of a single section.

Comparing every appendix exception against 400 independent sections creates candidate pairs across spans; indexing endpoints by ID inside the REPL reduces those pairs to $O(N)$ grouped checks before any sub-call runs.
```

## Build a recursive split-and-merge baseline

Before adopting open-ended agent code, examine a deterministic binary split-and-merge tree. When a text span fits inside `window_chars - reserve_chars` (leaving room for prompt instructions and expected output), one leaf call reads it and extracts fields. Larger spans split at the midpoint, spawn two child calls, and merge their JSON payloads upward with one merge call per pair.

For a `5,700`-character manual with `window_chars = 512` and `reserve_chars = 64` (`448` payload characters per request), four recursive halvings reduce every branch to `357` characters (`5700 -> 2850 -> 1425 -> 713 -> 357 <= 448`), producing $16$ leaf calls and $15$ internal merge calls for $31$ total calls. Halving `window_chars` to `256` (`192` payload limit) forces one more split (`357 -> 179 <= 192`), yielding $32$ leaves, $31$ merges, and $63$ calls. Setting `window_chars = 64` leaves zero payload capacity (`64 - 64 <= 0`) and is rejected upfront before infinite recursion starts.

<!-- leetllm: test, output=show -->
```python title="Payload budget reservation and recursive binary splitting"
import numpy as np


def make_manual(total_chars: int = 5_700) -> str:
    clauses = []
    idx = 0
    while sum(len(c) + 1 for c in clauses) < total_chars:
        date = "2026-11-01" if idx % 7 == 0 else "2026-08-15"
        clauses.append(
            f"[SEC-{idx:03d}] endpoint=/v1/item-{idx:03d} status=deprecated sunset={date}"
        )
        idx += 1
    return "\n".join(clauses)[:total_chars]


def count_split_merge(length: int, window_chars: int, reserve_chars: int = 64) -> tuple[int, int, int]:
    payload_cap = window_chars - reserve_chars
    if payload_cap <= 0:
        raise ValueError(f"window_chars={window_chars} must exceed reserve_chars={reserve_chars}")
    if length <= payload_cap:
        return 1, 0, 1
    mid = length // 2
    l_leaves, l_merges, l_calls = count_split_merge(mid, window_chars, reserve_chars)
    r_leaves, r_merges, r_calls = count_split_merge(length - mid, window_chars, reserve_chars)
    return l_leaves + r_leaves, l_merges + r_merges + 1, l_calls + r_calls + 1


manual_text = make_manual(5_700)
results = []
for w in (512, 256):
    leaves, merges, total = count_split_merge(len(manual_text), window_chars=w)
    results.append((w, leaves, merges, total))
    print(f"window={w}: leaves={leaves}, merges={merges}, total_calls={total}")

try:
    count_split_merge(len(manual_text), window_chars=64)
except ValueError as err:
    print("window=64 rejected:", err)

print("Summary array [window, leaves, merges, total]:")
print(np.array(results))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
window=512: leaves=16, merges=15, total_calls=31
window=256: leaves=32, merges=31, total_calls=63
window=64 rejected: window_chars=64 must exceed reserve_chars=64
Summary array [window, leaves, merges, total]:
[[512  16  15  31]
 [256  32  31  63]]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/recursive_call_tree_dark.png" alt="A split-and-merge tree halves a 5,700-character manual into 357-character leaves inside a 512-character window after a 64-character reserve, producing 16 leaf calls and 15 merge calls for 31 total calls. Reducing the window to 256 raises total calls to 63." />
  <figcaption>A deterministic binary tree isolates window math cleanly: $L$ leaves always require $L - 1$ binary merges for $2L - 1$ total requests.</figcaption>
</figure>

### Visiting every chunk does not preserve every fact

Scanning every leaf only solves half the extraction problem: intermediate merge prompts can silently drop rare exceptions or alter sunset dates when combining summaries. Tracking exact-field recall across merged fields measures how faithfully each clause survives aggregation. Unsupported extra fields require a separate precision check so hallucinations do not pass unnoticed alongside high recall.

<!-- leetllm: test, output=show -->
```python title="Exact-field recall across leaf extraction and merge stages"
import numpy as np

truth_keys = ["endpoint", "sunset_date", "exception_note"]

cases = {
    "exact_merge": {"endpoint": "/v1/search", "sunset_date": "2026-10-01", "exception_note": "enterprise-read-only"},
    "dropped_exception": {"endpoint": "/v1/search", "sunset_date": "2026-10-01", "exception_note": None},
    "wrong_date_extra_field": {"endpoint": "/v1/search", "sunset_date": "2025-01-01", "exception_note": "enterprise-read-only", "extra_claim": "zero-downtime"},
}
reference = cases["exact_merge"]

for name, candidate in cases.items():
    hits = np.array([candidate.get(k) == reference[k] for k in truth_keys], dtype=float)
    recall = hits.mean()
    extra_keys = set(candidate.keys()) - set(truth_keys)
    print(f"{name:22s} | recall={recall:.2f} | unsupported_fields={len(extra_keys)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
exact_merge            | recall=1.00 | unsupported_fields=0
dropped_exception      | recall=0.67 | unsupported_fields=0
wrong_date_extra_field | recall=0.67 | unsupported_fields=1
```
<!-- leetllm: output:end -->

## Completion rules and root observation truncation

In production runtimes, an adaptive controller iterates until it sets an explicit completion flag or reaches its step ceiling. In Zhang et al.'s `rlm/core/rlm.py` and `rlm/environments/local_repl.py`, the runtime defaults to local execution, `max_depth = 1`, and `30` iterations.[^zhang2026rlmrepo] Exhausting iterations falls back to one final best-effort completion, whereas strict timeout or budget caps raise explicit exceptions. Notice that any truthy string such as `{"ready": "yes", "content": "..."}` passes a naive `if state["ready"]` check in Python, which can terminate a loop prematurely on malformed output. Requiring `state.get("ready") is True` and non-empty text keeps shape checks unambiguous while leaving factual checking to a separate verification stage.

<!-- leetllm: test, output=show -->
```python title="Strict boolean completion parsing without truthy string traps"
def parse_completion(state: dict[str, object]) -> tuple[bool, str]:
    ready = state.get("ready")
    content = state.get("content", "")
    if ready is True and str(content).strip():
        return True, str(content).strip()
    return False, "rejected_shape"


for sample in [
    {"ready": "yes", "content": "Draft note"},
    {"ready": True, "content": "   "},
    {"ready": True, "content": "/v1/search exception: enterprise-read-only until 2026-10-01"},
]:
    accepted, message = parse_completion(sample)
    print(f"ready={sample['ready']!r} -> accepted={accepted}, detail={message}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ready='yes' -> accepted=False, detail=rejected_shape
ready=True -> accepted=False, detail=rejected_shape
ready=True -> accepted=True, detail=/v1/search exception: enterprise-read-only until 2026-10-01
```
<!-- leetllm: output:end -->

### Truncate REPL returns before appending to root history

Keeping raw source text external only works if printed stdout observations do not re-flood the root prompt across iterations. Suppose an interactive step extracts a `409`-character clause in the REPL and stores it in a Python variable, while returning a `40`-character console preview made of a `26`-character prefix plus a `14`-character marker (`...[truncated]`). Over `20` turns, appending full slice text expands history to `8,180` characters, whereas preview logging stays at `800` characters, a `10.2x` reduction before system prompts or wrappers. Whenever a loop step needs more context from a slice, it can re-index the Python variable directly instead of pulling the entire raw text into prompt memory.

<!-- leetllm: test, output=show -->
```python title="Bounded stdout preview truncation for externalized REPL history"
import numpy as np


def preview_for_history(text: str, limit: int = 40, marker: str = "...[truncated]") -> str:
    if len(text) <= limit:
        return text
    prefix_len = limit - len(marker)
    return text[:prefix_len] + marker


raw_slice = ("endpoint=/v1/search deprecated 2026-10-01 " * 10)[:409]
preview = preview_for_history(raw_slice)
turns = np.array([0, 5, 10, 15, 20], dtype=np.int64)
full_hist = turns * len(raw_slice)
prev_hist = turns * len(preview)

print("raw slice len:", len(raw_slice), "| preview len:", len(preview))
print("preview text:", repr(preview))
print("full history chars across [0,5,10,15,20]:", full_hist.tolist())
print("preview history chars across [0,5,10,15,20]:", prev_hist.tolist())
print(f"turn-20 compaction ratio: {full_hist[-1] / prev_hist[-1]:.1f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw slice len: 409 | preview len: 40
preview text: 'endpoint=/v1/search deprec...[truncated]'
full history chars across [0,5,10,15,20]: [0, 2045, 4090, 6135, 8180]
preview history chars across [0,5,10,15,20]: [0, 200, 400, 600, 800]
turn-20 compaction ratio: 10.2x
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/rlm_context_boundary_contract_dark.png" alt="A flow shows a 409-character REPL return trimmed to a 40-character preview made of 26 prefix characters and a 14-character truncation marker. A line chart across 20 returns shows full history reaching 8,180 characters while preview history stays at 800 characters." />
  <figcaption>Full slices stay in named REPL variables for downstream sub-calls while only short summaries enter root prompt history.</figcaption>
</figure>

A clean controller tracks step count and accumulated history length together, stopping immediately with an explicit status (`completed`, `step_budget_exhausted`, or `history_budget_exhausted`) instead of letting a loop spin or truncate silently.

<!-- leetllm: test, output=show -->
```python title="Step and history budget accounting in an RLM controller"
def run_controller(actions: list[tuple[str, str]], max_steps: int = 3, history_limit: int = 500) -> dict[str, object]:
    history: list[str] = []
    used_chars = 0
    for step, (kind, payload) in enumerate(actions[:max_steps], start=1):
        obs = f"[{step}:{kind}] {payload[:40]}"
        if used_chars + len(obs) > history_limit:
            return {"status": "history_budget_exhausted", "steps": step - 1, "used_chars": used_chars, "answer": None}
        history.append(obs)
        used_chars += len(obs)
        if kind == "finish":
            return {"status": "completed", "steps": step, "used_chars": used_chars, "answer": payload}
    return {"status": "step_budget_exhausted", "steps": len(history), "used_chars": used_chars, "answer": None}


print(run_controller([("peek", "index"), ("finish", "Found /v1/search exception")], max_steps=3, history_limit=500))
print(run_controller([("peek", "s1"), ("peek", "s2"), ("peek", "s3")], max_steps=3, history_limit=500))
print(run_controller([("peek", "s1"), ("peek", "s2")], max_steps=3, history_limit=30))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
{'status': 'completed', 'steps': 2, 'used_chars': 51, 'answer': 'Found /v1/search exception'}
{'status': 'step_budget_exhausted', 'steps': 3, 'used_chars': 33, 'answer': None}
{'status': 'step_budget_exhausted', 'steps': 2, 'used_chars': 22, 'answer': None}
```
<!-- leetllm: output:end -->

## Filter slices in the REPL and coordinate parallel sub-calls

The real power of RLM prompt externalization appears when Python code filters noisy sections before model sub-calls ever execute, then fans out workers across matching spans and merges structured results in memory. Suppose the REPL holds `12` manual sections, only `4` of which discuss deprecated endpoints or sunset schedules. Scoring slices locally with a fast term-frequency matrix avoids wasting sub-calls on the `8` irrelevant installation or SDK changelog chapters, and merges extracted JSON objects inside Python.

<!-- leetllm: test, output=show -->
```python title="Local term-frequency slice filtering before child sub-calls"
import numpy as np

sections = [
    ("sec-00", "SDK setup and pip install notes"),
    ("sec-01", "v1 /v1/search endpoint deprecated sunset 2026-10-01 read-only exception"),
    ("sec-02", "Authentication header examples"),
    ("sec-03", "Rate limiting headers and retry backoff"),
    ("sec-04", "v1 /v1/batch removed after sunset 2026-07-01 legacy migration"),
    ("sec-05", "Python client timeout defaults"),
    ("sec-06", "Webhook signature verification"),
    ("sec-07", "v1 /v1/export deprecated sunset 2026-12-01 audit exception"),
    ("sec-08", "Pagination cursor format"),
    ("sec-09", "Error status codes table"),
    ("sec-10", "v1 /v1/legacy-auth removed sunset 2026-06-01"),
    ("sec-11", "Changelog formatting guide"),
]

terms = ["deprecated", "removed", "sunset", "v1"]
tf_matrix = np.array(
    [[1 if term in text.lower() else 0 for term in terms] for _, text in sections],
    dtype=np.int32,
)
scores = tf_matrix.sum(axis=1)
selected_idx = np.flatnonzero(scores >= 2)

extracted = {}
for idx in selected_idx:
    sec_id, text = sections[idx]
    tokens = text.split()
    endpoint = next(t for t in tokens if t.startswith("/v1/"))
    status = "removed" if "removed" in text else "deprecated"
    extracted[endpoint] = {"section": sec_id, "status": status, "score": int(scores[idx])}

print(f"Filtered {len(selected_idx)}/{len(sections)} slices with keyword score >= 2")
print("Selected indices:", selected_idx.tolist())
print("Aggregated findings:", extracted)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Filtered 4/12 slices with keyword score >= 2
Selected indices: [1, 4, 7, 10]
Aggregated findings: {'/v1/search': {'section': 'sec-01', 'status': 'deprecated', 'score': 3}, '/v1/batch': {'section': 'sec-04', 'status': 'removed', 'score': 3}, '/v1/export': {'section': 'sec-07', 'status': 'deprecated', 'score': 3}, '/v1/legacy-auth': {'section': 'sec-10', 'status': 'removed', 'score': 3}}
```
<!-- leetllm: output:end -->

When `rlm_query` permits nested child recursion, call budgets scale with tree depth as well as slice count. In a 4-way depth-3 tree, total run nodes equal $1 + 4 + 16 + 64 = 85$: `21` internal recursive controllers plus `64` leaf calls. If each internal controller runs up to `30` iterations plus `1` best-effort fallback (`31` calls) like `core/rlm.py`'s default cap, maximum requests explode to $21 \times 31 + 64 = 715$ calls unless a shared counter limits the whole tree.

<!-- leetllm: test, output=show -->
```python title="Recursive tree node and call budget explosion by depth"
import numpy as np

branching = 4
max_depth = 3
nodes_per_level = branching ** np.arange(max_depth + 1)
total_nodes = int(nodes_per_level.sum())
internal_controllers = int(nodes_per_level[:-1].sum())
leaf_nodes = int(nodes_per_level[-1])
max_requests_uncapped = internal_controllers * 31 + leaf_nodes

print("Nodes by depth:", nodes_per_level.tolist())
print(f"Run nodes: {total_nodes} ({internal_controllers} controllers + {leaf_nodes} leaves)")
print("Uncapped potential requests (31 per controller):", max_requests_uncapped)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Nodes by depth: [1, 4, 16, 64]
Run nodes: 85 (21 controllers + 64 leaves)
Uncapped potential requests (31 per controller): 715
```
<!-- leetllm: output:end -->

Checking a stale remaining-budget snapshot inside child threads creates an insidious race condition during parallel `ThreadPoolExecutor` fan-out. In `rlm/core/rlm.py` and `rlm/core/lm_handler.py`, batches use per-parent thread pools or semaphores, passing remaining allowances to children without atomic reservation.[^zhang2026rlmrepo] If `4` concurrent sub-call tasks each read `remaining = 6` at the same instant and request `3` calls each, a stale check lets all `4` proceed (`12` dispatched calls against a `6`-call cap). Wrapping slot allocation in a shared mutex reserves `2` batches (`6` calls) and halts the remaining `2` before dispatch.

<!-- leetllm: test, output=show -->
```python title="Atomic mutex call-budget reservation across worker threads"
from concurrent.futures import ThreadPoolExecutor
import threading


class SharedCallPool:
    def __init__(self, max_calls: int, use_lock: bool = True) -> None:
        self.remaining = max_calls
        self.dispatched = 0
        self.use_lock = use_lock
        self._lock = threading.Lock()
        self._barrier = threading.Barrier(4)

    def run_batch(self, batch_size: int) -> bool:
        if not self.use_lock:
            snap = self.remaining
            self._barrier.wait()
            if batch_size > snap:
                return False
            self.remaining -= batch_size
            self.dispatched += batch_size
            return True
        with self._lock:
            if batch_size > self.remaining:
                return False
            self.remaining -= batch_size
            self.dispatched += batch_size
            return True


for label, locked in [("stale_snapshot", False), ("atomic_lock", True)]:
    pool = SharedCallPool(max_calls=6, use_lock=locked)
    with ThreadPoolExecutor(max_workers=4) as ex:
        outcomes = list(ex.map(pool.run_batch, [3, 3, 3, 3]))
    print(f"{label:15s} | granted={sum(outcomes)}/4 | dispatched={pool.dispatched}/6 | remaining={pool.remaining}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
stale_snapshot  | granted=4/4 | dispatched=12/6 | remaining=-6
atomic_lock     | granted=2/4 | dispatched=6/6 | remaining=0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/shared_budget_admission_dark.png" alt="A pipeline filters 12 manual slices in the Python REPL down to 4 matching spans, reserves sub-call slots atomically against a shared 6-call ceiling, fans out workers concurrently, and aggregates hits in NumPy. A bar chart shows stale snapshot checks overshooting to 12 calls while atomic reservation stays at 6." />
  <figcaption>Filter irrelevant slices locally first, then protect shared sub-call limits with atomic slot reservations across parallel workers.</figcaption>
</figure>

### Concurrent batching cuts wall time without reducing total calls

Overlapping `llm_query` requests across worker threads improves latency when providers accept concurrent requests, yet queuing `17` independent sub-calls across `4` worker slots still sends all `17` model requests across $\lceil 17 / 4 \rceil = 5$ sequential waves (`4, 4, 4, 4, 1`). As a result, parallel execution reduces wall-clock latency proportionally to concurrency while leaving total token and request volume unchanged. Batching prompts into async workers is therefore a throughput optimization rather than a cost-saving technique.

<!-- leetllm: test, output=show -->
```python title="Concurrent wave latency versus invariant total request volume"
import numpy as np


def schedule_waves(num_calls: int, workers: int) -> tuple[int, np.ndarray]:
    waves = int(np.ceil(num_calls / workers))
    counts = np.full(waves, workers, dtype=np.int64)
    counts[-1] = num_calls - workers * (waves - 1)
    return waves, counts


for w in (1, 4):
    waves, counts = schedule_waves(17, w)
    print(f"workers={w} -> {int(counts.sum())} requests across {waves} waves ({counts.tolist()[:5]})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
workers=1 -> 17 requests across 17 waves ([1, 1, 1, 1, 1])
workers=4 -> 17 requests across 5 waves ([4, 4, 4, 4, 1])
```
<!-- leetllm: output:end -->

## Benchmark evidence and root post-training

Empirical comparisons in paper v3 (May 11, 2026) evaluate GPT-5 (with GPT-5-mini sub-calls) and Qwen3-Coder-480B-A35B across CodeQA (23K to 4.2M tokens), BrowseComp+ (1,000 documents at 6M to 11M tokens), OOLONG (131K), and OOLONG-Pairs (32K).[^zhang2025rlm] Selected results show both the strengths of REPL offloading and the situations where recursion alone falls short:

| Benchmark slice | Base | Selected comparator | RLM result |
|---|---:|---:|---:|
| BrowseComp+ accuracy, GPT-5 | 0.0* | Context-offloaded OpenCode: 94.0 | Depth 1: 91.3 |
| OOLONG-Pairs F1, GPT-5 | 0.1 | CodeAct + sub-calls: 28.4 | Depth 1: 58.0; depth 3: 76.0 |
| OOLONG-Pairs F1, Qwen3-Coder | 0.1 | REPL-only depth 0: 17.3 | Depth 1: 23.1 |
| CodeQA accuracy, Qwen3-Coder | 20.0* | REPL-only depth 0: 66.0 | Depth 1: 56.0 |

Scores follow a 0 to 100 scale, and `*` indicates base runs that truncated against input-window limits rather than failing purely on in-window reasoning.[^zhang2025rlm] Extra depth is not monotonically better: GPT-5 CodeQA improves from `58.0` at depth 0 to `66.0` at depth 2, then drops back to `58.0` at depth 3; on LongCoT-mini, GPT-5.2 drops on the MATH subset (`26.0` down to `5.6` for vanilla depth-1 RLM) until explicit decomposition hints lift overall score from `50.6` to `65.6`. Reported historical average API costs (`$0.11` vs `$0.13` on CodeQA; `$0.33` vs `$0.16` on OOLONG-Pairs) also reflect sequential calls without container infrastructure overhead, so production teams must profile tail latency and total cost on their own workloads.

### Teaching smaller models to drive the REPL

To remove reliance on frontier root models, Zhang et al. supervised-fine-tuned a smaller controller, `RLM-Qwen3-8B`, reporting a `28.3%` **relative median gain** across four evaluation tasks in paper v3.[^zhang2025rlm] Starting from `750` English LongBenchPro tasks (`2,250` generated trajectories), Appendix A drops zero-score and single-turn traces to retain `1,072` trajectories (rounded to `1,000` in the main text), filters overlong turns, applies protocol fixes, and trains for `300` steps with batch size `64` (`48` H100-hours). A companion `Qwen3-4B-Instruct-0527` experiment trained on `32K-64K` token MRCRv2 inputs generalized out to `512K-1M` token evaluations.

<figure>
  <img src="illustrations/_generated/root_training_filter_dark.png" alt="A bar chart shows the LongBenchPro filtering funnel from 750 English tasks to 2,250 candidate trajectories and 1,072 retained trajectories after removing zero-score and single-turn runs. Metric cards show 300 SFT steps, 48 H100-hours, and a 28.3% relative median gain on Qwen3-8B." />
  <figcaption>Post-training on filtered multi-turn REPL traces teaches 8B models to inspect variables, filter slices, and complete tasks cleanly.</figcaption>
</figure>

## Isolate generated REPL code outside Python

In `zhang2026rlmrepo`, default local execution runs generated Python with `exec` inside the host process.[^zhang2026rlmrepo] Prompt injections embedded inside third-party API docs can hijack generated code to inspect environment secrets, mutate shared files, or make unauthorized network requests. Always enforce filesystem, CPU/memory, and egress limits at the container or OS layer (`Docker`, `gVisor`, Firecracker microVMs), and never allow child workers broader privileges than the root runner. Validate runtime configuration before spawning workers; see [code-generation sandboxing](/learn/code-generation-agents-sandboxing) for isolation architecture details.

<!-- leetllm: test, output=show -->
```python title="Sandbox isolation and privilege monotonicity validation"
from dataclasses import dataclass


@dataclass(frozen=True)
class ExecutorConfig:
    backend: str
    memory_mb: int
    timeout_s: int
    network_egress: bool
    child_network_egress: bool


def validate_executor_config(cfg: ExecutorConfig) -> tuple[bool, list[str]]:
    errors = []
    if cfg.backend == "host-exec":
        errors.append("unisolated host exec disabled")
    if cfg.memory_mb <= 0 or cfg.timeout_s <= 0:
        errors.append("memory_mb and timeout_s must be positive")
    if cfg.child_network_egress and not cfg.network_egress:
        errors.append("child cannot widen parent network permissions")
    return len(errors) == 0, errors


for name, cfg in [
    ("isolated_container", ExecutorConfig("docker", 1024, 30, False, False)),
    ("escalated_child", ExecutorConfig("host-exec", 512, 0, False, True)),
]:
    ok, issues = validate_executor_config(cfg)
    print(f"{name:18s} | valid={ok} | issues={issues}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
isolated_container | valid=True | issues=[]
escalated_child    | valid=False | issues=['unisolated host exec disabled', 'memory_mb and timeout_s must be positive', 'child cannot widen parent network permissions']
```
<!-- leetllm: output:end -->

## Deduplicate source lineage instead of counting child echoes

Recursive sub-calls can suffer from delusion reinforcement: if `3` parallel children repeat the same claim with no source identifier, or all cite copies of the same outdated file, naive voting treats repetition as confirmation. Ground every extracted claim against deduplicated source identities and verify current status fields before publishing an answer.

<!-- leetllm: test, output=show -->
```python title="Source-deduplicated claim verification against status registry"
REGISTRY = {
    "doc:registry": {"endpoint": "/v1/search", "status": "active"},
    "doc:archive": {"endpoint": "/v1/search", "status": "removed"},
}


def verify_claim(citations: list[str], endpoint: str, claimed_status: str) -> tuple[str, set[str]]:
    unique_ids = set(citations)
    matched = {
        doc_id: REGISTRY[doc_id]["status"]
        for doc_id in unique_ids
        if doc_id in REGISTRY and REGISTRY[doc_id]["endpoint"] == endpoint
    }
    if not matched:
        return "needs_evidence", set()
    statuses = set(matched.values())
    if len(statuses) > 1:
        return "conflict", set(matched.keys())
    observed = next(iter(statuses))
    verdict = "supported" if observed == claimed_status else "contradicted"
    return verdict, set(matched.keys())


scenarios = [
    ("ungrounded_x3", ["", "", ""]),
    ("duplicate_registry_x3", ["doc:registry", "doc:registry", "doc:registry"]),
    ("mixed_sources", ["doc:registry", "doc:archive"]),
    ("archive_only", ["doc:archive"]),
]
for label, cites in scenarios:
    verdict, docs = verify_claim(cites, "/v1/search", "removed")
    print(f"{label:22s} -> {verdict:15s} (unique_docs={sorted(docs)})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ungrounded_x3          -> needs_evidence  (unique_docs=[])
duplicate_registry_x3  -> contradicted    (unique_docs=['doc:registry'])
mixed_sources          -> conflict        (unique_docs=['doc:archive', 'doc:registry'])
archive_only           -> supported       (unique_docs=['doc:archive'])
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/source_evidence_lineage_dark.png" alt="A directed graph maps four citation patterns for the claim that /v1/search was removed to their deduplicated outcomes: three ungrounded echoes yield needs_evidence; three duplicates of active doc:registry yield contradicted; mixed active and removed docs yield conflict; only removed doc:archive yields supported." />
  <figcaption>Deduplicating citation IDs prevents three echoes of one stale source from overriding active documentation.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/rlm_candidate_evidence_route_dark.png" alt="A workflow graph routes a loop inspecting manual slices inside a 3-step and 500-character limit through a strict completion check requiring boolean ready equals True and nonempty content, then runs registry claim matching to emit either verified output, a follow-up inspection when margin remains, or explicit abstention." />
  <figcaption>Schema validation checks output structure; registry deduplication checks whether cited sources support the claim.</figcaption>
</figure>

## Select an execution route on held-out metrics

Not every workload justifies nested recursion. Direct prompting can serve short documents cheaply, REPL-only execution solves many scanning tasks without nested child trees, and depth-1+ recursion earns its latency only when sub-tasks require multi-step iterative reasoning. Evaluate candidates on identical held-out tasks using NumPy mask filtering over target accuracy/recall, `p95` cost, and `p95` latency ceilings before selecting a default route.

<!-- leetllm: test, output=show -->
```python title="Cost, latency, and recall routing across direct, REPL, and recursive modes"
import numpy as np

routes = ["direct", "repl_only", "recursive"]
# Columns: [recall, p95_cost_usd, p95_latency_s]
metrics = np.array([
    [0.73, 0.08, 4.1],
    [0.92, 0.19, 8.7],
    [0.95, 0.58, 24.0],
])

min_recall, max_cost, max_latency = 0.90, 0.30, 12.0
eligible = (
    (metrics[:, 0] >= min_recall)
    & (metrics[:, 1] <= max_cost)
    & (metrics[:, 2] <= max_latency)
)

for name, (rec, cost, lat), ok in zip(routes, metrics, eligible):
    print(f"{name:10s} | recall={rec:.2f} | p95_cost=${cost:.2f} | p95_lat={lat:4.1f}s | eligible={bool(ok)}")

if np.any(eligible):
    cand_indices = np.flatnonzero(eligible)
    best_idx = cand_indices[np.argmin(metrics[cand_indices, 1])]
    print("Selected lowest-cost eligible route:", routes[best_idx])
else:
    print("No route meets thresholds: hold rollout")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
direct     | recall=0.73 | p95_cost=$0.08 | p95_lat= 4.1s | eligible=False
repl_only  | recall=0.92 | p95_cost=$0.19 | p95_lat= 8.7s | eligible=True
recursive  | recall=0.95 | p95_cost=$0.58 | p95_lat=24.0s | eligible=False
Selected lowest-cost eligible route: repl_only
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/rlm_dynamic_routing_policy_dark.png" alt="Three side-by-side bar charts evaluate Direct, REPL-only, and Recursive execution routes across recall against 0.90 minimum, p95 cost against $0.30 maximum, and p95 latency against 12s maximum. REPL-only meets every threshold at 0.92 recall, $0.19 cost, and 8.7 seconds." />
  <figcaption>Multi-metric thresholds prevent choosing high-recall routes that blow latency budgets or cheap direct prompts that miss target coverage.</figcaption>
</figure>

Remember that a `p95` ceiling is a percentile across a held-out sample rather than a hard per-query cap; keep runtime call and timeout limits active per request so outlier queries abstain cleanly instead of stalling.

## Failure diagnosis checklist

| Symptom | First check | Recovery |
|---|---|---|
| Sub-calls multiply without new findings | Per-parent thread pools, duplicate slices, and non-atomic call counters | Enforce a mutex-protected tree-wide call cap and deduplicate slices before dispatch |
| Child returns answer the wrong question | Sub-call prompt scope and extracted slice offsets | Pass explicit global constraints alongside slice metadata and re-run held-out tests |
| Root model forgets earlier findings | Unbounded REPL stdout prints overwriting prompt history | Truncate returned console previews and store full records in external Python variables |
| Run ends without a verified answer | Check stop reason vs. fallback completion path | Reject malformed `ready` flags and abstain explicitly on exhausted iterations |
| Repeated citations inflate confidence | Raw citation count vs. unique source IDs | Deduplicate cited identifiers and escalate conflicting sources instead of taking a majority vote |
| Execution stalls on user text | Container execution deadlines and memory caps | Run untrusted `exec` in ephemeral sandboxes with hard wall-clock timeouts |

## Practice: trace tree scaling and merge retention

Experiment with the split-and-merge counter and recall evaluator above using two quick changes:

1. In `count_split_merge`, vary `window_chars` from `512` down to `256` and `64` on the `5,700`-character manual while keeping `reserve_chars = 64`, confirming how leaf count, merge count, and total requests double per halving before failing cleanly when `window_chars <= reserve_chars`.
2. In the merge retention check, compare `"dropped_exception"` against `"wrong_date_extra_field"` and observe why exact-field recall drops to `0.67` when either the exception or date fails, yet misses extra unsupported keys unless counted separately.

<details>
<summary>Check the expected outcomes</summary>

With `5,700` characters and `reserve_chars = 64`: `window_chars = 512` (`448` payload) yields `16` leaves, `15` merges, and `31` total calls; `window_chars = 256` (`192` payload) doubles the leaf layer to `32` leaves, `31` merges, and `63` total calls; `window_chars = 64` raises `ValueError` immediately before dispatching any calls. On the 3-key schema (`endpoint`, `sunset_date`, `exception_note`), both `dropped_exception` and `wrong_date_extra_field` drop recall from `1.00` to `0.67` (`2 / 3`), while only tracking `unsupported_fields` flags the extra `"zero-downtime"` assertion (`unsupported_fields = 1`).

</details>

```checkpoint
An evaluation shows a recursive controller achieved a 25% relative median gain across four benchmarks, and a single held-out task starts at a baseline score of 40. What can you conclude from those two numbers?
---
A 25% relative gain on that specific task would move 40 to 50, yet the median across four tasks does not specify the individual task's score.

Relative gains multiply the baseline ($40 \times 1.25 = 50$) rather than adding 25 percentage points. Furthermore, a four-task median cannot determine per-task dispersion or generalization outside the suite.
```

```mastery-quiz
[
  {
    "question": "A compliance check must inspect every unordered pair across 1,200 API records before any indexing or pruning. How many distinct comparisons does that require?",
    "options": [
      "1,440,000",
      "1,438,800",
      "719,400",
      "360,000"
    ],
    "answer": "719,400",
    "explanation": "Applying N * (N - 1) / 2 gives 1,200 * 1,199 / 2 = 719,400 unique pairs. The larger figures double-count ordered pairs or include self-pairs, while dividing twice undercounts valid combinations."
  },
  {
    "question": "A controller must extract exact regional deprecation dates from an API manual larger than one context window. Which initial setup preserves source accuracy while keeping the root prompt compact?",
    "options": [
      "Keep an immutable manual variable in the external Python REPL and pass only compact metadata and inspection helpers to the root prompt.",
      "Store a pre-generated summary of the manual in the Python REPL and omit access to the raw text.",
      "Paste the raw manual into the root prompt and hold a secondary pointer only for deduplication checks.",
      "Pass a bare file path to the root prompt without schema metadata or slice helpers."
    ],
    "answer": "Keep an immutable manual variable in the external Python REPL and pass only compact metadata and inspection helpers to the root prompt.",
    "explanation": "Externalizing the immutable manual lets Python code inspect exact clauses on demand without truncating the prompt. A precomputed summary can lose dates, while pasting the full text overflows the context window."
  },
  {
    "question": "A binary splitter divides 7,200 source tokens until every leaf chunk fits within a 900-token payload cap. Each leaf call and each pair merge makes one model request. How many leaf calls and total calls run?",
    "options": [
      "8 leaf calls and 15 total calls.",
      "8 leaf calls and 8 total calls.",
      "4 leaf calls and 7 total calls.",
      "16 leaf calls and 31 total calls."
    ],
    "answer": "8 leaf calls and 15 total calls.",
    "explanation": "Three binary halvings produce eight 900-token leaves (7,200 -> 3,600 -> 1,800 -> 900). Combining them hierarchically takes 4 + 2 + 1 = 7 merge calls, giving 8 + 7 = 15 total requests."
  },
  {
    "question": "A strict completion parser checks state = {\"ready\": \"yes\", \"content\": \"Draft answer\"}. What should happen next?",
    "options": [
      "Accept the output because content is non-empty and ready is truthy.",
      "Reject the malformed completion state because ready is a string rather than boolean True, keeping factual checking separate.",
      "Promote the draft immediately and skip citation checks to save sub-calls.",
      "Overwrite the external manual variable with the last console string."
    ],
    "answer": "Reject the malformed completion state because ready is a string rather than boolean True, keeping factual checking separate.",
    "explanation": "Truthy strings like \"yes\" trigger accidental early termination under loose checks. Requiring `ready is True` isolates completion signaling from source verification."
  },
  {
    "question": "Seventeen independent slice sub-calls are queued simultaneously across a thread pool of 4 worker slots, with zero retries or failures. How many model requests are sent and how many waves do they take?",
    "options": [
      "5 requests across 5 waves.",
      "17 requests across 4 waves.",
      "17 requests across 5 waves.",
      "17 requests across 17 waves."
    ],
    "answer": "17 requests across 5 waves.",
    "explanation": "Concurrency overlaps network waits without merging independent prompts: all 17 requests still execute, taking four full waves of 4 workers plus a fifth wave for the final call."
  },
  {
    "question": "A container sandbox must pass three runtime checks before handling untrusted documents: outbound network blocked, secret environment variable absent, and scratch files cleared on reset. After a network check fails and engineers fix firewall egress, the outbound probe is blocked as expected. Which checks still lack runtime verification?",
    "options": [
      "Secret variable absence and scratch-file reset cleanup.",
      "Secret variable absence and outbound network denial.",
      "Outbound network denial and scratch-file reset cleanup.",
      "None; fixing network egress verifies the entire sandbox."
    ],
    "answer": "Secret variable absence and scratch-file reset cleanup.",
    "explanation": "Re-testing network egress only confirms network blocking after the patch. Credential isolation and disk cleanup on reset still require direct runtime checks."
  },
  {
    "question": "A 3-way recursive tree of depth 3 has 13 internal controllers each allowed 4 calls, plus 27 leaf models each making 1 call. Excluding retries, what is the maximum total request count?",
    "options": [
      "40",
      "79",
      "52",
      "160"
    ],
    "answer": "79",
    "explanation": "The 13 internal controllers can dispatch up to 13 * 4 = 52 calls, and the 27 leaves add 27 * 1 = 27 calls, totaling 79 requests (13 + 27 = 40 counts tree nodes rather than model requests)."
  },
  {
    "question": "A routing check selects the lowest-cost execution mode meeting recall >= 0.92, p95 cost <= $0.30, and p95 latency <= 12s. Route A gets (0.94, $0.24, 11s), B gets (0.96, $0.30, 9s), and C gets (0.98, $0.21, 14s). Which routes qualify and which runs?",
    "options": [
      "A and B qualify; run B.",
      "A, B, and C qualify; run C.",
      "A and B qualify; run A.",
      "Only A qualifies; run A."
    ],
    "answer": "A and B qualify; run A.",
    "explanation": "Route C misses the 12s latency cap at 14s. Both A and B satisfy all three inclusive thresholds, and A costs $0.24 compared with B at $0.30."
  },
  {
    "question": "A reference registry lists doc1: endpoint E is active, and doc2: endpoint F is removed. Child workers cite [doc1, doc1, doc2] alongside an unknown ID while claiming E was removed. What does source deduplication conclude?",
    "options": [
      "Contradicted by doc1 after deduplication; doc2 concerns endpoint F and does not apply to E.",
      "Supported by doc2 because two valid citations agree on removal.",
      "Conflict between doc1 and doc2 over endpoint E.",
      "Needs evidence because unknown citation IDs invalidate doc1."
    ],
    "answer": "Contradicted by doc1 after deduplication; doc2 concerns endpoint F and does not apply to E.",
    "explanation": "Deduplicating source IDs collapses [doc1, doc1] to one record, filters doc2 because it describes endpoint F rather than E, and reports that active record doc1 contradicts removal."
  },
  {
    "question": "A console logger truncates every REPL observation to 40 characters using a 14-character marker (\"...[truncated]\") inside the cap. How many characters of source prefix remain per turn, and what size do 20 previews reach before wrappers?",
    "options": [
      "40 source characters per turn and 1,080 characters total.",
      "14 source characters per turn and 280 characters total.",
      "26 source characters per turn and 520 characters total.",
      "26 source characters per turn and 800 characters total."
    ],
    "answer": "26 source characters per turn and 800 characters total.",
    "explanation": "Subtracting the 14-character truncation marker leaves 40 - 14 = 26 prefix characters inside each 40-character preview, so 20 logged turns accumulate 20 * 40 = 800 characters in prompt history."
  }
]
```

> **Next:** Continue to [Multi-Agent Orchestration](/learn/multi-agent-dags-langgraph-orchestration). Recursive language models show how nested environments solve large-context problems; the next lesson makes worker roles, typed shared state, dependency ordering, and escalation explicit across larger multi-agent graphs.
