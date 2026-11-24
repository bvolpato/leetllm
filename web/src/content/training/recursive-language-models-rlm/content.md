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

[Agent recovery](/learn/agent-failure-states-retry-fallback) introduced finite tool loops and explicit failure states. Now imagine your task is to find every deprecated-endpoint exception scattered across a 500-page API manual. Stuffing the whole manual into one prompt overflows the window (or suffers from **context rot** as distractors pile up), summarizing the file upfront drops exact sunset dates, and top-$k$ embedding search misses cross-referenced clauses buried in appendices.[^zhang2025rlm]

Dense full-prompt attention scales quadratically in prefill compute with sequence length (even though KV-cached decoding attends linearly per output token), and single-call output limits cap how much structured text one completion can emit.[^dao2022]

A <span data-glossary="recursive-language-model">recursive language model (RLM)</span> changes where the raw text lives.[^zhang2025rlm] Instead of pasting the corpus into the prompt, the runtime binds it to a variable inside an external Python REPL. The root model sees only compact metadata and recent stdout previews, and writes Python code to search, slice, filter, and delegate work to child models: `llm_query` invokes a plain completion on a chosen span, while `rlm_query` launches a nested controller with its own REPL namespace.

## Keep the source corpus external to the root prompt

Picture a CPU processing a gigabyte file from disk while holding only loop indices and extracted records in registers. In an RLM, the root prompt acts like those registers (carrying instructions and short console previews), while the Python REPL holds the raw manual and intermediate data structures.

In the MIT OASYS reference architecture, the runtime binds the input corpus to a variable such as `context` and exposes `llm_query` / `rlm_query` helpers inside the interpreter.[^zhang2025rlm] Because Python code stitches sub-call outputs together programmatically, the final assembled artifact can even exceed a single model call's output token limit.

<figure>
  <img src="illustrations/_generated/rlm_architecture_dark.png" alt="A root model sends generated Python code to an external REPL holding the corpus and variables, receives truncated previews back, delegates slices through plain llm_query or nested rlm_query calls, and merges structured answers." />
  <figcaption>The root prompt carries compact observations rather than the raw corpus. Separate Python namespaces keep variables apart, while untrusted execution still needs OS-level container or VM isolation.</figcaption>
</figure>

Unlike a rigid summarization tree, an interactive REPL lets the controller adapt mid-run: regexes locate headers, date parsers filter out irrelevant changelogs, and child calls focus solely on matching spans.[^zhang2025rlmblog] On cleanly structured documents a deterministic split-and-merge pipeline can still run faster, whereas adaptive REPL code shines when document layouts vary. Keep an immutable copy of the source text outside writable REPL globals so generated code can never silently corrupt the original manual.

## Match decomposition to task complexity

Before dispatching sub-calls, classify the task's information-processing complexity over $N$ clauses:[^zhang2025rlm]

- **$O(1)$ lookup:** Locate one version header using an index or keyword offset.
- **$O(N)$ scan:** Visit every relevant section to collect all deprecation dates.
- **$O(N^2)$ pairwise comparison:** Check every unordered pair of notices for mutual contradictions:

$$
\text{Pairs}(N) = \frac{N(N - 1)}{2}
$$

Doubling a corpus from $5{,}000$ to $10{,}000$ clauses quadruples unordered pairs from `12,497,500` to `49,995,000`:

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

On quadratic benchmarks like OOLONG-Pairs, base-model accuracy collapses as length grows even well inside the context limit.[^zhang2025rlm] An RLM does not magically erase $O(N^2)$ scaling on its own; its win comes from using Python code to hash, group, or index records locally in milliseconds so model sub-calls inspect only candidate pairs.

<figure>
  <img src="illustrations/_generated/task_complexity_scaling_dark.png" alt="A line chart plots normalized work multipliers from 1x to 5x input size for constant O(1) lookup, linear O(N) scans, and quadratic O(N^2) pairwise checks. Metric cards show 12,497,500 unordered pairs at 5,000 items and 49,995,000 pairs at 10,000 items, a 4.00x increase." />
  <figcaption>Task complexity drives sub-call growth. Prune non-matching pairs in Python before invoking child models.</figcaption>
</figure>

```checkpoint
An API review asks whether any deprecation grace period in one appendix conflicts with SLA clauses in 400 other sections. What governs model call cost before pruning?
---
Quadratic $O(N^2)$ cross-section pair comparisons rather than the byte length of any single section. Indexing endpoints by ID inside the REPL collapses candidate checks to $O(N)$ grouped comparisons before any sub-call runs.
```

## Build a recursive split-and-merge baseline

Before unleashing an open-ended controller, establish a deterministic binary split-and-merge baseline. When a span fits inside `window_chars - reserve_chars` (leaving room for instructions and output tokens), one leaf call extracts structured fields. Larger spans split at the midpoint, dispatch two children, and combine their results with one merge call per pair.

For a `5,700`-character manual with `window_chars = 512` and `reserve_chars = 64` (`448` payload chars per request), four binary halvings (`5700 -> 2850 -> 1425 -> 713 -> 357`) yield `16` leaf calls and `15` merge calls (`31` total). Halving the window to `256` (`192` payload chars) forces one more split (`32` leaves, `31` merges, `63` total). And `window_chars <= reserve_chars` must fail immediately before causing infinite recursion:

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
  <figcaption>In any binary split-and-merge tree, L leaf calls always require L - 1 merge calls for 2L - 1 total requests.</figcaption>
</figure>

### Visiting every chunk does not preserve every fact

Scanning every leaf only solves half the problem: intermediate merge prompts can drop rare exceptions, alter dates, or hallucinate extra claims. Track exact-field recall alongside unsupported extra keys separately:

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

An adaptive RLM controller loops until it emits an explicit completion flag or hits its step cap. The reference runtime defaults to `max_depth = 1` and `30` iterations, falling back to one final best-effort answer when iterations run out while raising explicit errors on hard budget or timeout caps.[^zhang2026rlmrepo]

> **Common mistake:** Checking `if state["ready"]:` in Python. A malformed model output like `{"ready": "yes", "content": "..."}` or `{"ready": "false", "content": "..."}` is truthy and terminates the loop early! Require strict identity (`state.get("ready") is True`) plus non-empty content, and keep factual checking in a separate verification step.

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

Externalizing the corpus falls apart if every `print()` dumps full text back into root prompt history. Store full slices in Python variables and return only a bounded console preview (for instance, a `26`-character prefix plus a `14`-character `...[truncated]` marker = `40` characters total). Across `20` turns on `409`-character clauses, preview logging keeps root history at `800` characters instead of `8,180` (`10.2x` smaller):

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
  <figcaption>Full slices remain addressable in named REPL variables while only bounded previews enter root prompt history.</figcaption>
</figure>

Track both step count and accumulated history characters in the controller loop so every run ends with an explicit status (`completed`, `step_budget_exhausted`, or `history_budget_exhausted`):

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
print(run_controller([("peek", "s1"), ("peek", "s2")], max_steps=3, history_limit=20))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
{'status': 'completed', 'steps': 2, 'used_chars': 51, 'answer': 'Found /v1/search exception'}
{'status': 'step_budget_exhausted', 'steps': 3, 'used_chars': 33, 'answer': None}
{'status': 'history_budget_exhausted', 'steps': 1, 'used_chars': 11, 'answer': None}
```
<!-- leetllm: output:end -->

## Filter slices in the REPL and coordinate parallel sub-calls

The biggest RLM win happens when Python filters out irrelevant chapters *before* any child model runs, then fans out workers across matching slices and aggregates results in memory. Across 12 manual sections where only 4 mention deprecations or sunsets, a fast term-frequency matrix skips 8 irrelevant chapters immediately:

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
    ("sec-07", "v1 /v1/export deprecated sunset 2026-12-01 read-only export exception"),
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
    endpoint = next(t for t in text.split() if t.startswith("/v1/"))
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

When `rlm_query` enables nested recursion, call ceilings multiply fast with depth. A 4-way depth-3 tree has $1 + 4 + 16 + 64 = 85$ nodes (`21` internal controllers and `64` leaves). If each internal controller can run up to `30` iterations plus `1` fallback (`31` calls), uncapped requests jump to $21 \times 31 + 64 = 715$:

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

Parallel `ThreadPoolExecutor` fan-out adds a subtle race condition: if 4 concurrent tasks each read a stale `remaining = 6` snapshot and request 3 calls apiece, all 4 pass and dispatch `12` calls against a `6`-call cap.[^zhang2026rlmrepo] Protecting slot reservation with a shared mutex holds dispatched calls strictly at `6`:

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
  <figcaption>Filter irrelevant slices locally first, then protect shared sub-call limits with atomic mutex reservations across concurrent workers.</figcaption>
</figure>

### Concurrent batching cuts wall time without reducing total calls

Running 17 independent `llm_query` calls across 4 worker slots overlaps network waits into $\lceil 17 / 4 \rceil = 5$ sequential waves (`4, 4, 4, 4, 1`), cutting wall-clock latency while leaving total request count and token spend unchanged:

<!-- leetllm: test, output=show -->
```python title="Concurrent wave latency versus constant total request volume"
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

Zhang et al.[^zhang2025rlm] evaluate GPT-5 (with GPT-5-mini sub-calls) and Qwen3-Coder-480B-A35B across CodeQA (23K to 4.2M tokens), BrowseComp+ (1,000 documents at 6M to 11M tokens), OOLONG (131K), and OOLONG-Pairs (32K). The results show both where REPL offloading shines and where extra recursion hurts:

| Benchmark slice | Base | Selected comparator | RLM result |
|---|---:|---:|---:|
| BrowseComp+ accuracy, GPT-5 | 0.0* | Context-offloaded OpenCode: 94.0 | Depth 1: 91.3 |
| OOLONG-Pairs F1, GPT-5 | 0.1 | CodeAct + sub-calls: 28.4 | Depth 1: 58.0; depth 3: 76.0 |
| OOLONG-Pairs F1, Qwen3-Coder | 0.1 | REPL-only depth 0: 17.3 | Depth 1: 23.1 |
| CodeQA accuracy, Qwen3-Coder | 20.0* | REPL-only depth 0: 66.0 | Depth 1: 56.0 |

Scores are on a 0 to 100 scale, and `*` marks base runs truncated by context limits.[^zhang2025rlm] Notice two key lessons in the numbers:

- **Deeper recursion is not automatically better:** GPT-5 CodeQA climbs from `58.0` at depth 0 to `66.0` at depth 2, then falls back to `58.0` at depth 3; Qwen3-Coder CodeQA actually scores higher with REPL-only depth 0 (`66.0`) than depth 1 (`56.0`).
- **Decomposition strategy matters:** On LongCoT-mini MATH, vanilla depth-1 RLM drops GPT-5.2 from `26.0` to `5.6`, while explicit decomposition hints raise overall score from `50.6` to `65.6`.

### Teaching smaller models to drive the REPL

To remove dependence on frontier root models, Zhang et al. fine-tuned `RLM-Qwen3-8B` on multi-turn REPL trajectories, achieving a `28.3%` **relative median gain** across four evaluation tasks.[^zhang2025rlm] From `750` English LongBenchPro tasks (`2,250` candidate traces), filtering out zero-score and single-turn runs leaves `1,072` trajectories, trained for `300` steps at batch size `64` (`48` H100-hours). A companion `Qwen3-4B` model trained on `32K-64K` MRCRv2 inputs generalized out to `512K-1M` tokens.

<figure>
  <img src="illustrations/_generated/root_training_filter_dark.png" alt="A bar chart shows the LongBenchPro filtering funnel from 750 English tasks to 2,250 candidate trajectories and 1,072 retained trajectories after removing zero-score and single-turn runs. Metric cards show 300 SFT steps, 48 H100-hours, and a 28.3% relative median gain on Qwen3-8B." />
  <figcaption>Filtering out zero-score and single-turn traces leaves 1,072 clean multi-turn REPL trajectories, enough to teach an 8B model to slice, delegate, and converge reliably.</figcaption>
</figure>

## Isolate generated REPL code outside Python

The reference repository defaults to running generated Python with `exec` inside the host process.[^zhang2026rlmrepo] Prompt injections embedded inside third-party documents can hijack that code to read environment variables, alter files, or make outbound requests. Enforce CPU, memory, filesystem, and network limits at the OS or container layer (`Docker`, `gVisor`, Firecracker microVMs), and never let child workers hold broader privileges than the root runner. See [code-generation sandboxing](/learn/code-generation-agents-sandboxing) for full isolation designs.

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
    ("unconfined_child", ExecutorConfig("host-exec", 512, 0, False, True)),
]:
    ok, issues = validate_executor_config(cfg)
    print(f"{name:18s} | valid={ok} | issues={issues}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
isolated_container | valid=True | issues=[]
unconfined_child   | valid=False | issues=['unisolated host exec disabled', 'memory_mb and timeout_s must be positive', 'child cannot widen parent network permissions']
```
<!-- leetllm: output:end -->

## Deduplicate source lineage instead of counting child echoes

Parallel sub-calls can suffer from **delusion reinforcement**: if three child workers repeat the same claim with no source ID, or all quote the same stale appendix, naive majority voting treats repetition as independent confirmation. Always deduplicate by source document ID and check claims against authoritative status records:

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
  <figcaption>Deduplicating citation IDs stops three echoes of one stale source from overriding active documentation.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/rlm_candidate_evidence_route_dark.png" alt="A workflow graph routes a loop inspecting manual slices inside a 3-step and 500-character limit through a strict completion check requiring boolean ready equals True and nonempty content, then runs registry claim matching to emit either verified output, a follow-up inspection when margin remains, or explicit abstention." />
  <figcaption>Schema checks validate output format; source deduplication checks whether cited documents support the claim.</figcaption>
</figure>

## Select an execution route on held-out metrics

Not every workload justifies nested recursion. Direct prompting wins on short inputs, REPL-only execution (`depth = 0`) handles many large-document scans cleanly, and recursive sub-calls earn their cost only when sub-tasks require multi-step reasoning. Evaluate all three modes on the same held-out tasks against target recall, `p95` cost, and `p95` latency ceilings:

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
    print("No route meets thresholds: hold deployment")
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
  <figcaption>Multi-metric selection rejects both low-recall direct prompting and high-latency recursive trees, picking REPL-only as the cheapest route meeting every threshold.</figcaption>
</figure>

> **Key insight:** A `p95` ceiling summarizes a held-out distribution; it is not a per-request safeguard. Keep hard per-request call caps and wall-clock timeouts active in production so tail queries abstain cleanly instead of stalling.

## Failure diagnosis checklist

| Symptom | First check | Recovery |
|---|---|---|
| Sub-calls multiply without new findings | Per-parent thread pools, duplicate slices, and non-atomic counters | Enforce a mutex-protected tree-wide call cap and deduplicate slices before dispatch |
| Child returns answer the wrong question | Sub-call prompt scope and extracted slice offsets | Pass explicit global constraints alongside slice metadata |
| Root model forgets earlier findings | Unbounded REPL stdout flooding prompt history | Truncate returned console previews and store full records in REPL variables |
| Run ends without a verified answer | Stop reason vs. fallback completion path | Require strict `ready is True` and abstain explicitly on exhausted iterations |
| Repeated citations inflate confidence | Raw citation count vs. unique source IDs | Deduplicate cited IDs and flag conflicting sources instead of majority voting |
| Execution stalls on user text | Container deadlines and memory caps | Run untrusted `exec` in ephemeral sandboxes with hard wall-clock timeouts |

## Practice: trace tree scaling and merge retention

Experiment with the split-and-merge counter and recall evaluator above using two quick changes:

1. In `count_split_merge`, sweep `window_chars` from `512` down to `256` and `64` on the `5,700`-character manual (`reserve_chars = 64`), confirming how leaves, merges, and total requests double per halving before failing cleanly when `window_chars <= reserve_chars`.
2. In the merge retention check, compare `"dropped_exception"` against `"wrong_date_extra_field"` and observe why exact-field recall drops to `0.67` in both cases, while only `unsupported_fields` catches the extra hallucinated claim.

<details>
<summary>Check the expected outcomes</summary>

With `5,700` characters and `reserve_chars = 64`: `window_chars = 512` (`448` payload) yields `16` leaves, `15` merges, and `31` total calls; `window_chars = 256` (`192` payload) doubles to `32` leaves, `31` merges, and `63` total calls; `window_chars = 64` raises `ValueError` immediately before dispatching any calls. On the 3-key schema (`endpoint`, `sunset_date`, `exception_note`), both `dropped_exception` and `wrong_date_extra_field` drop recall from `1.00` to `0.67` (`2 / 3`), while only `unsupported_fields` flags the extra `"zero-downtime"` claim (`unsupported_fields = 1`).

</details>

```checkpoint
An evaluation shows a recursive controller achieved a 25% relative median gain across four benchmarks, and a single held-out task starts at a baseline score of 40. What can you conclude from those two numbers?
---
A 25% relative gain on that specific task would move 40 to 50 ($40 \times 1.25$), yet a median across four tasks does not reveal the score on any single task or its dispersion across the suite.
```

```mastery-quiz
[
  {
    "question": "A cross-reference check must inspect every unordered pair across 1,200 API records before any indexing or pruning. How many distinct comparisons does that require?",
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

> **Next:** Continue to [Multi-Agent Orchestration](/learn/multi-agent-dags-langgraph-orchestration). Recursive language models show how nested environments solve large-context problems; the next lesson makes worker roles, typed shared state, dependency ordering, and handoffs explicit across larger multi-agent graphs.
