---
{
  "id": "design-code-completion-system",
  "title": "Code Completion System",
  "slug": "design-code-completion-system",
  "category": "System Design",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/code_completion_dark.png",
  "companies": [
    "Google",
    "GitHub",
    "JetBrains",
    "Anthropic",
    "OpenAI"
  ],
  "shortDescription": "A suggestion for `is_allowed =` can arrive after the developer has typed past it. Keep the useful ones, and do not paint the stale line.",
  "keyConceptsTested": [
    "IDE context gathering from cursor position and open files",
    "Context window construction with relevant code",
    "Hybrid local semantic plus LLM candidate generation",
    "Measured low-latency inference requirements",
    "Debouncing, cancellation, and stale-response handling",
    "Fill-in-the-middle training",
    "KV cache reuse for prefix matching"
  ],
  "prerequisites": [
    "design-real-time-content-moderation-system",
    "llm-deployment-gpu-serving-autoscaling",
    "speculative-decoding",
    "prefix-caching-prompt-caching",
    "kv-cache-paged-attention-llm-serving",
    "continuous-batching-request-scheduling",
    "long-context-window-management"
  ],
  "relatedQuestions": [
    "design-multi-tenant-llm-serving-platform",
    "ai-coding-workflow-with-agents",
    "code-generation-agents-sandboxing",
    "computer-use-gui-browser-agents",
    "agent-evaluation-benchmarks",
    "function-calling-tool-use-llms"
  ],
  "section": "System Design Capstones",
  "order": 2
}
---

A developer types `is_allowed =`, pauses for a beat, and keeps typing `graph.`. Half a second later, a remote suggestion computed for the earlier buffer arrives at the editor. If accepting that suggestion overwrites the newer line, the editor corrupts working code. Even a brilliant completion feels broken when it arrives after the cursor has moved on.

Code completion runs against a moving editor state. Modern tools such as GitHub Copilot split this work into dimmed ghost text at the cursor and next-edit suggestions that predict where the following change should land.[^github2026copilotcodesuggestions] Remote inline suggestions rely on <span data-glossary="fill-in-the-middle">fill-in-the-middle (FIM)</span>, which conditions generated code on both the prefix before the cursor and the suffix after it. Coding agents that plan multi-file patches sit on a slower loop with a completely different latency target.

In this design, single-line inline completions target a 200 ms <span data-glossary="p95-latency">p95</span> <span data-glossary="slo">service-level objective (SLO)</span>. Every piece of the architecture exists to keep exact lookups local, ship only high-value context over the wire, reuse <span data-glossary="kv-cache">key-value (KV) cache</span> blocks across keystrokes, and drop stale responses before they ever paint.

<figure>
  <img src="illustrations/_generated/code_completion_dark.png" alt="Captured editor snapshot containing document, version, selection, and access state paired with a request epoch. Local lexical lookup completes Polic to PolicyGraph; local semantic lookup handles graph.; open-ended is_allowed equals routes to remote FIM when upload is allowed. All lanes pass a freshness check before painting ghost text or applying Tab insertion, while multi-file coding agents run on a separate plan-edit-test loop." />
  <figcaption>One captured editor snapshot travels with every completion request. Exact lexical and type-informed completions stay local, open-ended spans can call remote FIM when uploads are allowed, and every lane checks snapshot freshness before painting ghost text or inserting on Tab.</figcaption>
</figure>

## One cursor, five lanes

Consider a half-typed `validate_token_scope` function in Python. At different keystrokes in the same five-line file, five distinct completion lanes apply:

| Lane | Input at the cursor | Best used for |
| :--- | :--- | :--- |
| **Lexical** | Prefix `Polic` or `is_all` | Local identifiers and keywords already in the buffer |
| **Semantic** | Typed receiver after `graph.` | Exact members resolved by the language server |
| **Inline generation** | Prefix and suffix around `is_allowed =` | An expression or block that must match `return is_allowed` |
| **Next-edit** | Accepted line plus nearby edits | The next related edit elsewhere in the file |
| **Coding agent** | Repository, test runner, task prompt | Multi-file patches off the keystroke clock |

### Lexical and semantic first

A local prefix index can complete `PolicyGraph` directly from the import line in a couple of milliseconds. After `graph.`, the language server already knows the receiver's type and valid methods whenever indexing is complete. Dynamic code or missing imports can leave the type unknown, in which case local lexical fallback still responds without a network hop.

### Inline generation for an open-ended span

An empty assignment like `is_allowed =` has no deterministic answer in a symbol table. Generating the right expression requires reading the function name, imports, and the `return is_allowed` line below the cursor. That open-ended span is what earns the 200 ms remote FIM call.

### Agents stay off the keystroke clock

A coding agent searches the repository, runs test suites, and proposes multi-file patches.[^github2026copilotcloudagent] Mixing that workflow into inline completion destroys both experiences: ghost text must assemble a compact prompt, generate a short span, and render within 200 ms at p95.

## The keystroke budget

An inline suggestion competes with the next keystroke: arriving late wastes GPU work, and irrelevant text creates visual clutter. Measure end-to-end latency from the qualifying editor event to painting fresh ghost text, covering debounce, local parse, context build, network transfer, server wait, prefill, decoding enough tokens to paint, and UI render. Track client <span data-glossary="ttft">time-to-first-token (TTFT)</span> separately so you do not double-count transport and queue wait.

For an immediately triggered request (0 ms debounce), a 200 ms <span data-glossary="gpu">GPU</span>-backed budget breaks into five serial stages totaling 183 ms (17 ms headroom):

| Stage | Budget | Work performed |
| :--- | :--- | :--- |
| Client handling + local parse | 12 ms | Capture document version, selection, and syntax state |
| Network | 55 ms | Transport round trip without server queueing |
| Context assembly | 28 ms | Rank allowed snippets and build the FIM prompt |
| Queue + model service | 78 ms | Scheduling, prefill, and decode through the visible span |
| UI render | 10 ms | Check snapshot freshness and paint ghost text |

Adding a 150 ms typing debounce pushes elapsed time to 333 ms, so ordinary typing needs either a shorter debounce, local completion, or a separate pause-to-suggestion target.

> **Common mistake:** Do not compute end-to-end p95 by summing each stage's individual p95. Tail spikes across stages hit different requests, so summed stage percentiles hide real end-to-end latency.

The script below checks the serial budget and demonstrates why nearest-rank p95 must run over complete request traces:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="latency-budget-check.py"
import math
import numpy as np

stage_budget_ms = {
    "client_parse": 12,
    "network": 55,
    "context": 28,
    "queue_and_model": 78,
    "paint": 10,
}
objective_ms = 200

total_ms = sum(stage_budget_ms.values())
headroom_ms = objective_ms - total_ms

def nearest_rank_p95(values: np.ndarray) -> float:
    ordered = np.sort(values)
    idx = math.ceil(0.95 * len(ordered)) - 1
    return float(ordered[idx])

# 20 requests across 2 stages: two separate requests spike to 100 ms.
traces = np.array([(100, 1), (1, 100)] + [(1, 1)] * 18)
whole_trace_p95 = nearest_rank_p95(traces.sum(axis=1))
sum_of_stage_p95 = sum(nearest_rank_p95(traces[:, i]) for i in range(traces.shape[1]))

print(f"allocated_path_ms: {total_ms} (headroom: {headroom_ms} ms)")
print(f"with_150ms_debounce: {total_ms + 150} ms")
print(f"whole_trace_p95: {whole_trace_p95:.0f} ms vs sum_of_stage_p95: {sum_of_stage_p95:.0f} ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
allocated_path_ms: 183 (headroom: 17 ms)
with_150ms_debounce: 333 ms
whole_trace_p95: 101 ms vs sum_of_stage_p95: 2 ms
```
<!-- leetllm: output:end -->

In that 20-request trace, each individual stage spikes only once (5% of requests), so each stage's p95 is 1 ms and their sum is 2 ms. Yet two of the 20 complete requests take 101 ms, making the true end-to-end p95 equal to 101 ms.

<figure>
  <img src="illustrations/_generated/edit_to_paint_budget_dark.png" alt="Shared 0 to 333 ms timeline showing immediate serial stages totaling 183 ms with 17 ms headroom to 200 ms, and a debounced lane adding 150 ms to reach 333 ms. A 20-request matrix compares whole-trace p95 of 101 ms against the 2 ms sum of stage p95 values." />
  <figcaption>An immediate request spends 183 ms across five serial stages, while a 150 ms typing debounce extends total elapsed time to 333 ms. Always compute p95 over whole request traces rather than summing individual stage percentiles.</figcaption>
</figure>

## Who owns the `is_allowed =` keystroke

Three components cooperate on every edit: the IDE extension, a context engine, and an inference server.

The IDE extension tracks keystrokes, open tabs, and cursor coordinates. The context engine (running locally in the editor or on a gateway) selects snippets that fit the live token budget. Between the editor and semantic tooling sits the Language Server Protocol (LSP), allowing one semantic engine to serve completion, go-to-definition, and diagnostics across editors.[^microsoft2026lsp]

While a developer types `is_allowed =`, the file is syntactically incomplete. Incremental parsers like Tree-sitter recover partial syntax trees around broken statements so the client can still identify enclosing scopes and imports.[^treeSitter2026] When syntax recovery fails or leaves error nodes, fall back to a narrower local window and let the language server provide whatever type information is ready.

On the serving side, the inference engine runs <span data-glossary="continuous-batching">continuous batching</span> so hundreds of short, cancellable completions share resident model weights without stalling behind fixed batch windows.

### Local fallback lane

Keep a deterministic local lane for cheap, exact completions:

- **Language-server members:** Exact attributes and method signatures after `.` or `(`.
- **Prefix indexes and tries:** Keywords and local identifiers already present in the file.
- **Fuzzy matching:** Small typo recovery such as `pritn` to `print`.

A local lane eliminates network round trips for deterministic lookups and keeps the editor responsive offline.

A subtle trap lurks in both naive scope scanning and cursor indexing. First, scanning backward for `def ` fails as soon as code dedents out of a finished function, so real clients rely on syntax-node ranges rather than text scans. Second, editors and backend runtimes count character offsets in different units: VS Code's `Position.character` counts UTF-16 code units, Python indexes Unicode code points, and many tokenizers or parsers count UTF-8 bytes.[^vscode2026EditorSnapshotApi] Place the caret right after the emoji in `a😀b`: slicing Python with the UTF-16 offset skips `b`, and slicing UTF-8 bytes at that offset splits a multi-byte character.

<!-- leetllm: test, output=show -->
```python title="compare-editor-position-units.py"
def nearest_def_header(source: str, cursor_line: int) -> str | None:
    lines = source.splitlines()
    for idx in range(min(cursor_line, len(lines) - 1), -1, -1):
        stripped = lines[idx].lstrip()
        if stripped.startswith(("def ", "async def ")):
            return stripped
    return None

# Naive backward scan crosses a dedent and misattributes top-level code.
outside = "def finished():\n    pass\nx = 1\n"
print("naive_scan_after_dedent:", nearest_def_header(outside, 2))

# Caret after the emoji in "a😀b" maps to three different offsets.
line = "a😀b"
py_idx = 2
prefix = line[:py_idx]
utf16_offset = len(prefix.encode("utf-16-le")) // 2
utf8_offset = len(prefix.encode("utf-8"))

print(f"offsets (Python, UTF-16, UTF-8): {py_idx}, {utf16_offset}, {utf8_offset}")
print("correct_suffix:", repr(line[py_idx:]))
print("wrong_utf16_slice_in_python:", repr(line[utf16_offset:]))
try:
    line.encode("utf-8")[:utf16_offset].decode("utf-8")
except UnicodeDecodeError:
    print("wrong_utf8_byte_slice: splits the emoji")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
naive_scan_after_dedent: def finished():
offsets (Python, UTF-16, UTF-8): 2, 3, 5
correct_suffix: 'b'
wrong_utf16_slice_in_python: ''
wrong_utf8_byte_slice: splits the emoji
```
<!-- leetllm: output:end -->

Always convert editor coordinates into the backend's native unit before slicing prefix and suffix spans, and verify the edit range against the live document version on insertion.

<figure>
  <img src="illustrations/_generated/editor_position_units_dark.png" alt="Alignment of characters in a😀b across Python code points, UTF-16 code units, and UTF-8 bytes. The caret after the emoji sits at Python index 2, UTF-16 offset 3, and UTF-8 byte 5." />
  <figcaption>The same cursor position after the emoji in a😀b is Python index 2, UTF-16 offset 3, and UTF-8 offset 5. Slicing with the wrong coordinate unit drops the suffix or splits a multi-byte character.</figcaption>
</figure>

## Context gathering and management

Modern models advertise huge <span data-glossary="context-window">context windows</span>, yet long <span data-glossary="prefill">prefills</span> blow past a 200 ms keystroke clock. Even when the model accepts 128k tokens, the inline prompt budget stays small, typically capped around 8,000 tokens including FIM markers, with output tokens reserved separately.

### Context priority strategy

Filter every candidate buffer by repository access permissions and upload rules *before* ranking. Among allowed files, reserve a fixed minimum slice for the suffix first so greedy prefix packing never erases the code below the cursor. Then fill the remaining prompt budget in priority order:

| Priority | Source | Selection method | Purpose |
| :--- | :--- | :--- | :--- |
| **1 (Highest)** | Code before cursor | Direct prefix | Immediate syntax, variables, and indentation |
| **2** | Code after cursor | Reserved FIM suffix | Matching return statements, types, and closing delimiters |
| **3** | Imports and definitions | Static analysis | Signatures and types referenced in the active file |
| **4** | Recently edited files | Temporal locality | Active cross-file edits |
| **5** | Neighboring files | Symbol Jaccard or BM25 | Related modules sharing types or imports |

### Fill-in-the-middle (FIM)

A standard causal language model predicts left-to-right from the prefix alone. When editing inside an existing function, a prefix-only prompt hides the `return is_allowed` line or closing braces waiting below the cursor.

FIM solves this by reordering the prompt so the model reads both prefix and suffix before generating the missing middle:

$$
P_{\text{FIM}} = \texttt{<PRE>} + x_{\text{prefix}} + \texttt{<SUF>} + x_{\text{suffix}} + \texttt{<MID>}
$$

Marker strings vary by checkpoint and <span data-glossary="tokenization">tokenizer</span>, so the serving adapter must emit the model's exact sentinel token IDs and encode user source code strictly as text tokens. Otherwise a comment containing `<MID>` inside a source file could hijack prompt framing.

<figure>
  <img src="illustrations/_generated/fim_prompt_dark.png" alt="Prefix and suffix spans from one file reordered into PRE, prefix, SUF, suffix, MID prompt order so the model reads the suffix before generating the middle span." />
  <figcaption>Prefix-Suffix-Middle (PSM) places the suffix ahead of the middle sentinel so a decoder-only model conditions its insertion on code both above and below the cursor.</figcaption>
</figure>

During FIM pretraining, a fraction of training documents are split at two character offsets into `(prefix, middle, suffix)` and reordered with sentinel tokens under ordinary causal next-token loss.[^bavarian2022] Two inference orderings are common:

- **PSM (Prefix-Suffix-Middle):** `<PRE>prefix<SUF>suffix<MID>middle`, used in file-level completion models such as Qwen2.5-Coder.[^qwen352024]
- **SPM (Suffix-Prefix-Middle):** `<PRE><SUF>suffix<MID>prefixmiddle`, where prefix and generated middle stay contiguous.[^bavarian2022]

> **Key insight:** An edit near the cursor in PSM invalidates the suffix's KV cache because the suffix follows the prefix in token order. In SPM, placing the suffix first lets the model keep cached suffix KV blocks intact while you type in the prefix.

For our `validate_token_scope` buffer, PSM wraps the prefix (`from authz.rules import PolicyGraph ... is_allowed = `) and suffix (`return is_allowed`) into one contiguous prompt:

```text
<PRE>from authz.rules import PolicyGraph

def validate_token_scope(request):
    """Check whether the requested API scope is allowed."""
    is_allowed = <SUF>
    return is_allowed
<MID>
```

Because the model sees `return is_allowed` before `<MID>`, it generates a boolean expression matching the return value instead of opening an unrelated block.

### Repository-level context

Cross-file definitions matter whenever the active buffer calls project-local classes. Maintain a lightweight repository index outside the request path so lookup takes single-digit milliseconds:

1. **Jaccard symbol overlap:** Score candidate files by dividing shared unique symbols by the union of unique symbols.
2. **<span data-glossary="bm25">BM25</span> / <span data-glossary="sparse-retrieval">sparse retrieval</span>:** Fast keyword lookup over identifiers and docstrings.[^robertson2009]
3. **Dense <span data-glossary="vector">vector</span> retrieval:** Viable only when embeddings are precomputed asynchronously and retrieval plus optional <span data-glossary="reranker">reranking</span> fits inside the 28 ms context budget. Iterative retrieve-generate loops belong on the slower coding-agent path.

The example below ranks three permitted files against active symbols in `validate_token_scope` and packs a suffix-preserving FIM prompt inside a fixed token budget:

<!-- leetllm: test, output=show -->
```python title="select-nearby-context.py"
active_symbols = {"PolicyGraph", "ScopeRule", "TokenClaims"}
candidate_files = {
    "scope_rules.py": {"ScopeRule", "TokenClaims", "AccessEvent"},
    "metrics.py": {"Counter", "Histogram"},
    "policy_graph.py": {"PolicyGraph", "Node"},
}

def jaccard(left: set[str], right: set[str]) -> float:
    union = left | right
    return len(left & right) / len(union) if union else 0.0

ranked = sorted(
    ((jaccard(active_symbols, syms), path) for path, syms in candidate_files.items()),
    reverse=True,
)
selected = [(path, round(score, 2)) for score, path in ranked if score >= 0.25]

# Reserve framing and suffix before allocating remaining tokens to prefix and retrieval.
def allocate_prompt_tokens(cap: int, framing: int, suffix_min: int,
                           prefix_want: int, retrieval_want: int) -> dict[str, int]:
    remaining = max(0, cap - framing)
    suffix = min(suffix_min, remaining)
    remaining -= suffix
    prefix = min(prefix_want, remaining)
    remaining -= prefix
    retrieval = min(retrieval_want, remaining)
    return {"framing": framing, "suffix": suffix, "prefix": prefix, "retrieval": retrieval}

print("selected_files:", selected)
print("token_plan:", allocate_prompt_tokens(cap=8000, framing=100, suffix_min=1200,
                                            prefix_want=4800, retrieval_want=3000))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
selected_files: [('scope_rules.py', 0.5), ('policy_graph.py', 0.25)]
token_plan: {'framing': 100, 'suffix': 1200, 'prefix': 4800, 'retrieval': 1900}
```
<!-- leetllm: output:end -->

`scope_rules.py` scores `2/4 = 0.50` and `policy_graph.py` scores `1/4 = 0.25`, while `metrics.py` shares zero symbols and drops out. Even though retrieval wanted 3,000 tokens, the suffix reservation keeps its 1,200 tokens intact and trims retrieval to 1,900.

<figure>
  <img src="illustrations/_generated/authorized_context_selection_dark.png" alt="Symbol membership matrix across active symbols and three candidate files showing Jaccard scores of 0.5 for scope_rules.py, 0.25 for policy_graph.py, and 0 for metrics.py, alongside an 8,000-token prompt container reserving suffix and framing before prefix and retrieval." />
  <figcaption>Rank only upload-permitted files. Symbol overlap selects scope_rules.py (2/4) and policy_graph.py (1/4), while the 8,000-token prompt cap reserves framing and suffix space ahead of prefix and retrieved snippets.</figcaption>
</figure>

## Model serving for low latency

A compact prompt still misses 200 ms if serving stalls in queueing, prefill, or serial decoding. Profile all three separately because each requires a different optimization: prefix caching shrinks prefill, speculative decoding accelerates decode, and quantization reduces memory bandwidth pressure.

### Speculative decoding

Decoding is serial: generating $K$ tokens ordinarily requires $K$ sequential forward passes of the target model. In speculative decoding, a small draft model (or n-gram / multi-token head) proposes $K$ candidate tokens cheaply, and the target model verifies all $K$ positions in a single parallel forward pass.[^leviathan2023][^vllm2026spec]

<figure>
  <img src="illustrations/_generated/speculative_decode_dark.png" alt="Five candidate tokens from a fast draft model verified in one parallel forward pass by the target model, accepting four tokens and emitting a corrected fifth token." />
  <figcaption>One parallel verification pass evaluates five draft tokens at once, accepting the first four and emitting a target correction for the fifth. Under stochastic acceptance, the output distribution matches the target model exactly.</figcaption>
</figure>

To preserve the target model's exact sampling distribution $p(x)$ when drafting from $q(x)$, accept each proposed token $x$ with probability:

$$
\alpha(x) = \min\!\left(1, \frac{p(x)}{q(x)}\right)
$$

At the first rejection, resample the replacement token from the normalized residual distribution:

$$
p'(x) = \frac{\max(0, p(x) - q(x))}{\sum_v \max(0, p(v) - q(v))}
$$

When all $K$ draft tokens are accepted, the verification pass also yields a $(K+1)$-th bonus token from the target model. With constant per-token acceptance rate $\alpha$, the expected number of emitted tokens per verification step is:

$$
\mathbb{E}[\text{tokens}] = \frac{1 - \alpha^{K+1}}{1 - \alpha}
$$

Speculative decoding is not a universal win. Repetitive boilerplate like Python imports yields high acceptance, whereas unconstrained SQL or prose yields frequent rejections and extra verification overhead. Under heavy continuous batching, verifying $K$ draft tokens per request can also crowd out compute for neighboring requests and raise tail latency. Measure both mean accepted length and p95 latency per language slice before turning it on.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="speculative-decoding-math.py"
import numpy as np

# Target distribution p and draft distribution q over a 3-token vocabulary.
p = np.array([0.1, 0.6, 0.3])
q = np.array([0.4, 0.4, 0.2])

# Draft proposes token 0: compute exact acceptance probability and residual distribution.
accept_prob = min(1.0, p[0] / q[0])
residual = np.maximum(0.0, p - q)
residual /= residual.sum()

# Expected tokens emitted per target pass for K=5 draft tokens at acceptance alpha.
def expected_tokens(alpha: float, k: int = 5) -> float:
    return (1.0 - alpha ** (k + 1)) / (1.0 - alpha)

# Enable speculation per slice only when acceptance and p95 gain clear thresholds.
slices = {
    "python_imports": {"mean_accepted": 3.8, "base_p95_ms": 178, "spec_p95_ms": 136},
    "sql_queries": {"mean_accepted": 1.1, "base_p95_ms": 169, "spec_p95_ms": 176},
}
enabled = [
    name for name, m in slices.items()
    if m["mean_accepted"] >= 2.0 and (m["base_p95_ms"] - m["spec_p95_ms"]) >= 10
]

print(f"token_0_accept_prob: {accept_prob:.3f}")
print("rejection_residual:", np.round(residual, 3).tolist())
print(f"expected_tokens (alpha=0.80, K=5): {expected_tokens(0.80):.2f}")
print(f"expected_tokens (alpha=0.35, K=5): {expected_tokens(0.35):.2f}")
print("enabled_slices:", enabled)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
token_0_accept_prob: 0.250
rejection_residual: [0.0, 0.667, 0.333]
expected_tokens (alpha=0.80, K=5): 3.69
expected_tokens (alpha=0.35, K=5): 1.54
enabled_slices: ['python_imports']
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/speculation_slice_gate_dark.png" alt="Two-axis qualification chart requiring at least 2.0 mean accepted draft tokens and 10 ms p95 latency reduction. Python imports pass at 3.8 tokens and 42 ms gain; SQL queries fail at 1.1 tokens and a 7 ms regression." />
  <figcaption>Evaluate speculative decoding per workload slice. Python imports pass with 3.8 accepted tokens and 42 ms lower p95 latency, while SQL queries regress by 7 ms under verification overhead.</figcaption>
</figure>

### KV cache reuse (prefix caching)

While a developer edits one function, the top of the file (imports, types, earlier helpers) stays unchanged across dozens of keystrokes. Automatic <span data-glossary="prefix-cache">prefix caching</span> stores the computed KV blocks for that stable prefix so subsequent requests prefill only the newly typed delta tokens.[^vllm2026prefix] Prefix caching cuts prefill latency; decode latency for generated tokens stays unchanged.

Suppose a 1,280-token prompt shares a 1,200-token cached prefix and appends an 80-token delta. A cold miss spends 72 ms on prefill and 24 ms on decode (96 ms total). A warm hit spends 11 ms prefilling the 80-token delta plus the same 24 ms on decode (35 ms total).

| Next request | Reusable KV work | Remaining compute |
| :--- | :--- | :--- |
| Same file header, characters added near cursor | Reuse all matching prefix blocks | Prefill short delta, then decode |
| Edit near top of file | Only blocks before the edit match | Prefill from first changed block onward, then decode |
| Different tenant, model, adapter, or tokenizer | None | Full prompt prefill, then decode |

<figure>
  <img src="illustrations/_generated/prefix_cache_dark.png" alt="Comparison of a 1,280-token prompt with 1,200 cached prefix tokens and 80 delta tokens: cold miss takes 72 ms prefill plus 24 ms decode (96 ms), while a warm hit takes 11 ms prefill plus 24 ms decode (35 ms)." />
  <figcaption>Prefix caching eliminates duplicate prefill over the 1,200 shared tokens while leaving the 24 ms decode phase unchanged. In PSM, an early prefix edit invalidates later suffix KV states; suffix-first SPM preserves them when the model supports it.</figcaption>
</figure>

Never key a KV cache by raw text alone. Two tokens can merge across an edit, and sharing KV blocks across tenants leaks timing or state. Build the cache key from the gateway's authenticated security scope (never a client-chosen salt), exact model/tokenizer/adapter revisions, KV layout, and exact prefix token IDs. Serving engines like vLLM expose `cache_salt` for isolating reuse across trust groups.[^vllm2026prefix]

<!-- leetllm: test, output=show -->
```python title="prefix-cache-key.py"
from dataclasses import dataclass, replace

@dataclass(frozen=True)
class CacheKey:
    security_scope: str     # gateway-derived tenant/repo/access epoch
    model_revision: str
    tokenizer_revision: str
    adapter_revision: str
    kv_layout: str          # dtype and engine block layout
    prefix_ids: tuple[int, ...]

base = CacheKey("acme/repo-a/acl-7", "weights-3", "tok-3",
                "no-adapter", "fp16-v1", (10, 20, 30))
kv_store = {base: "kv-block-handle-7"}

checks = {
    "same_scope": base in kv_store,
    "other_tenant": replace(base, security_scope="contoso/repo-a/acl-7") in kv_store,
    "changed_token": replace(base, prefix_ids=(10, 20, 31)) in kv_store,
    "other_adapter": replace(base, adapter_revision="adapter-2") in kv_store,
    "revoked_acl": replace(base, security_scope="acme/repo-a/acl-8") in kv_store,
}
for label, hit in checks.items():
    print(f"{label}: {hit}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
same_scope: True
other_tenant: False
changed_token: False
other_adapter: False
revoked_acl: False
```
<!-- leetllm: output:end -->

Prefix KV reuse is distinct from response caching: changing temperature or sampling seed keeps the prefix KV valid, whereas reusing a finished completion text requires identical input, generation settings, and active permissions.

### Quantization

Post-training <span data-glossary="quantization">quantization</span> compresses <span data-glossary="fp16">FP16</span> weights by roughly 2x at 8-bit and 4x at 4-bit, though scale factors, unquantized layers, and KV cache buffers shrink the net memory reduction.[^gptq2023][^huggingface2026gptq] Because short-output decode is often memory-bandwidth bound, narrower weights can speed up token generation when efficient hardware kernels exist. Methods like GPTQ quantize an existing FIM checkpoint without retraining, letting a stronger model fit a smaller GPU. Always re-measure syntax validity, acceptance rate, and retained characters after quantizing: subtle precision loss often shows up as mangled API names before perplexity moves noticeably.

## Debounce `r` and `o`; fire on `.`

Dispatching a remote request on every keystroke of `is_allowed` floods the GPU fleet with completions that expire before the packets return. The client needs a deliberate schedule for waiting, firing, canceling, and discarding late responses.

<figure>
  <img src="illustrations/_generated/snapshot_freshness_dark.png" alt="Sequence showing keystrokes r, o, and dot advancing request epochs 1, 2, and 3. Pending debounce tasks for r and o cancel so only dot sends immediately. A cursor move or access-rule change increments epoch, clears ghost text, and rejects late responses before paint or Tab insertion." />
  <figcaption>Every edit, cursor move, or permission change advances the request epoch, clears visible ghost text, and cancels pending timers. Both ghost-text rendering and Tab insertion require an exact match against the current document version, selection, access epoch, and request epoch.</figcaption>
</figure>

### Debouncing and cancellation

A dynamic debounce separates exploratory typing from high-signal triggers:

- **0 ms delay** on explicit trigger characters such as `.`, `(`, and `\n`.
- **150 ms delay** during ordinary identifier typing (or shorter if your end-to-end budget demands 200 ms from the keystroke itself).

Every change to the document text, cursor selection, or upload permission must immediately increment the epoch, clear any visible ghost text, and cancel pending requests, even when no replacement request will be sent. Editor APIs like VS Code pass a cancellation token into inline completion providers, yet network latency still allows an already-sent response to arrive after a newer edit.[^vscodeInlineApi2026] Check the captured snapshot both before painting ghost text and again atomically when the user presses Tab.

<!-- leetllm: test, output=show -->
```python title="debouncing-and-cancellation.py"
import asyncio
from dataclasses import dataclass

@dataclass(frozen=True)
class Snapshot:
    document: str
    version: int
    selection: tuple[int, int]
    access_epoch: int

class RequestManager:
    def __init__(self) -> None:
        self.pending: asyncio.Task[None] | None = None
        self.epoch = 0
        self.snapshot: Snapshot | None = None
        self.ghost: tuple[int, Snapshot, str] | None = None
        self.triggers = {".", "(", "\n"}
        self.sent: list[int] = []
        self.shown: list[str] = []

    def on_change(self, snapshot: Snapshot, char: str | None = None) -> None:
        self.epoch += 1
        self.snapshot = snapshot
        self.ghost = None
        if self.pending and not self.pending.done():
            self.pending.cancel()
        if char is None:
            return
        delay = 0.0 if char in self.triggers else 0.15
        self.pending = asyncio.create_task(self._fetch(delay, self.epoch, snapshot))

    async def _fetch(self, delay: float, epoch: int, snapshot: Snapshot) -> None:
        try:
            await asyncio.sleep(delay)
            self.sent.append(epoch)
            self.on_response(epoch, snapshot, f"completion-{epoch}")
        except asyncio.CancelledError:
            return

    def on_response(self, epoch: int, snapshot: Snapshot, text: str) -> None:
        if epoch == self.epoch and snapshot == self.snapshot:
            self.ghost = (epoch, snapshot, text)
            self.shown.append(text)

    def accept(self) -> str | None:
        if self.ghost is None:
            return None
        epoch, snapshot, text = self.ghost
        self.ghost = None
        if epoch != self.epoch or snapshot != self.snapshot:
            return None
        return text

async def main() -> None:
    mgr = RequestManager()
    tasks = []
    for version, ch in enumerate("ro.", 1):
        snap = Snapshot("handler.py", version, (version, version), 7)
        mgr.on_change(snap, ch)
        tasks.append(mgr.pending)
    await asyncio.gather(*tasks, return_exceptions=True)

    # Late response from canceled epoch 2 is dropped.
    mgr.on_response(2, snap, "stale-2")
    # Cursor move invalidates epoch without firing a new request.
    mgr.on_change(Snapshot("handler.py", 3, (0, 0), 7))
    mgr.on_response(3, snap, "stale-after-move")
    assert mgr.accept() is None

    # Fresh response paints, then an access-epoch change invalidates Tab accept.
    mgr.on_response(mgr.epoch, mgr.snapshot, "fresh")
    mgr.on_change(Snapshot("handler.py", 3, (0, 0), 8))
    assert mgr.accept() is None

    print("sent_epochs:", mgr.sent)
    print("shown_suggestions:", mgr.shown)

asyncio.run(main())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sent_epochs: [3]
shown_suggestions: ['completion-3', 'fresh']
```
<!-- leetllm: output:end -->

Propagate cancellations upstream to the inference server so queued or decoding work stops early, while remembering that TCP aborts lag behind GPU scheduling. Cap max output tokens and deadlines server-side so zombie requests never monopolize a batch.

### Ghost text, not a second product

Inline completion should stay lightweight ghost text directly at the cursor.[^vscode2026inlinecompletion] If the user types characters that match the prefix of a visible suggestion, the client can trim and rebase the remaining ghost text onto the new document version; any mismatch invalidates it immediately. Natural-language comments such as `// validate token scopes against the graph` fit naturally into this inline lane, whereas repository-wide Q&A and test generation belong in the agent UI.

## Did `is_allowed =` actually help?

A developer can accept an entire block, take a single word via partial acceptance, or dismiss the suggestion.[^github2026CopilotPartialAcceptance] Optimizing raw acceptance rate alone encourages a degenerate model that suggests tiny, safe tokens like closing parentheses. Measuring **accepted-and-retained characters** over a fixed observation window exposes suggestions that looked plausible on Tab and were deleted thirty seconds later.

<figure>
  <img src="illustrations/_generated/quality_metrics_dark.png" alt="Four shown suggestions: A inserts 18 characters and retains 0, B inserts and retains 4, C inserts 42 and retains 35, and D inserts 0. Three of four shown IDs are accepted (75%), while 39 of 64 inserted characters remain (60.9%)." />
  <figcaption>Four distinct shown suggestions illustrate why acceptance and retention diverge: three suggestions produce an insertion (75% acceptance), but 25 of 64 inserted characters are later deleted (60.9% retention).</figcaption>
</figure>

| Metric | Definition | Signal captured |
| :--- | :--- | :--- |
| **Acceptance rate** | Fraction of distinct shown suggestion IDs with any inserted text (report full vs. partial separately) | Early Copilot telemetry measured 27% acceptance and found it correlated with perceived productivity.[^ziegler2022CopilotProductivity] |
| **Retained characters** | Fraction of inserted characters still surviving after an observation window | Catches plausible-looking completions that developers promptly rewrite or delete.[^ziegler2022CopilotProductivity] |
| **Shown rate** | Fraction of eligible triggers that display ghost text | Detects overly timid models that hide behind high precision by rarely speaking. |
| **End-to-end p95 / p99** | Whole-trace latency across edit-to-paint, paired with timeout and stale-drop rates | Prevents fast p95 numbers on a tiny surviving slice from masking widespread timeouts. |

Multiple word-by-word partial accepts of the same shown suggestion still count as one accepted suggestion ID, while every inserted character enters the retention denominator:

<!-- leetllm: test, output=show -->
```python title="measure-retained-completions.py"
suggestions = [
    {"shown": True, "accepted_chars": 18, "retained_chars": 0},
    {"shown": True, "accepted_chars": 4, "retained_chars": 4},
    {"shown": True, "accepted_chars": 42, "retained_chars": 35},
    {"shown": True, "accepted_chars": 0, "retained_chars": 0},
]

def score_cohort(events: list[dict[str, int | bool]]) -> tuple[float | None, float | None]:
    shown = sum(1 for e in events if e["shown"])
    accepted = sum(1 for e in events if e["accepted_chars"] > 0)
    inserted = sum(e["accepted_chars"] for e in events)
    retained = sum(e["retained_chars"] for e in events)
    return (
        accepted / shown if shown else None,
        retained / inserted if inserted else None,
    )

acc_rate, ret_rate = score_cohort(suggestions)
print(f"acceptance_rate: {acc_rate:.0%}")
print(f"retained_char_rate: {ret_rate:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
acceptance_rate: 75%
retained_char_rate: 60.9%
```
<!-- leetllm: output:end -->

Pair offline and online evaluation. Offline benchmarks such as HumanEval[^chen2021] catch regressions quickly, and repository-frozen infill tests check whether reconstructed files parse and pass unit tests inside an isolated sandbox. Only online randomized experiments (split by user or workspace with fixed trigger rules) measure editor timing, cancellation behavior, and whether inserted code actually survives in real work. Compute character retention locally on the client whenever possible so telemetry never needs to upload raw code, and treat sessions that close before the observation window finishes as censored rather than deleted.

## Routing by suggestion size

A larger model can write a cleaner function body and still lose if it misses the 200 ms clock. Start with a compact FIM-trained model on the single-line keystroke lane (for example, the Qwen2.5-Coder family documents native file-level and repository-level FIM formats[^qwen352024]), and reserve heavier models for multi-line triggers that tolerate a 500 ms budget:

| Trigger | Suggestion class | p95 target |
| :--- | :--- | :--- |
| Mid-expression (`.`, `(`) | Local semantic member lookup | 60 ms |
| End of line | Remote single-line inline completion | 200 ms |
| After function signature | Remote multi-line body | 500 ms |
| Empty line inside block | Remote multi-line block | 500 ms |

Client routing also enforces local-only upload settings strictly. In Python, the string `"False"` is truthy: checking `if not remote_permitted:` would mistakenly send a restricted buffer to the remote multi-line lane. Require literal `remote_permitted is True` on the client, and enforce authenticated upload rules independently at the gateway.

<!-- leetllm: test, output=show -->
```python title="route-completion-request.py"
def route(trigger: str, after_signature: bool, *,
          semantic_available: bool = True, remote_permitted: object = True) -> tuple[str, int]:
    if semantic_available and trigger in {".", "("}:
        return "LOCAL_SEMANTIC", 60
    if remote_permitted is not True:
        return "LOCAL_FALLBACK", 60
    if after_signature:
        return "REMOTE_MULTILINE", 500
    return "REMOTE_INLINE", 200

print("dot_trigger:", route(".", False))
print("after_sig:", route("\n", True))
print("mid_line:", route("r", False))
print("string_False:", route("\n", True, remote_permitted="False"))
print("none_value:", route("\n", True, remote_permitted=None))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dot_trigger: ('LOCAL_SEMANTIC', 60)
after_sig: ('REMOTE_MULTILINE', 500)
mid_line: ('REMOTE_INLINE', 200)
string_False: ('LOCAL_FALLBACK', 60)
none_value: ('LOCAL_FALLBACK', 60)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/route_permission_dark.png" alt="Client routing flowchart: dot or open-paren with available semantic types stays local (60 ms); all other inputs require literal remote_permitted is True, routing malformed values to local fallback (60 ms) and permitted calls to remote inline (200 ms) or multiline (500 ms)." />
  <figcaption>Exact semantic triggers stay local whenever type information is ready. Remote routing requires literal True so misconfigured values stay on the local fallback lane, while the gateway independently verifies access permissions.</figcaption>
</figure>

## The fleet behind one keystroke

Code completion is a high-churn, prefill-heavy GPU workload. Most requests cancel before the user ever sees a token, and traffic spikes sharply during regional work hours. Provision the fleet to protect tail latency during peak typing windows rather than sizing for average tokens per second.

### GPU fleet management and load balancing

Routing balances three competing goals:

- **Prefix-aware routing:** Prefer an eligible replica holding warm KV blocks for the file's prefix, but only when its queue wait stays smaller than the prefill time you save.
- **Geographic routing:** Serve from the nearest permitted region. A 50 ms network round trip already consumes a quarter of a 200 ms budget.
- **Model tiering:** Isolate fast single-line models from slower multi-line pools so long blocks never stall keystroke traffic.

<figure>
  <img src="illustrations/_generated/compatible_kv_prefix_dark.png" alt="KV prefix lookup requiring exact match across security scope, model revision, tokenizer, adapter, KV layout, and prefix token IDs; any mismatch triggers full prefill before decoding." />
  <figcaption>A replica reuses cached KV blocks only when security scope, model revision, tokenizer, adapter, layout, and prefix token IDs all match. Any mismatch falls back to full prefill.</figcaption>
</figure>

Notice the exact tipping point for cache affinity. Let $q$ be the base queue wait on a cold worker, $\Delta$ the extra queue wait on a warm worker, and $T_{\text{cold}}, T_{\text{warm}}$ their model-service times. The warm worker finishes sooner only when:

$$
q + \Delta + T_{\text{warm}} < q + T_{\text{cold}} \iff \Delta < T_{\text{cold}} - T_{\text{warm}}
$$

With our earlier numbers ($T_{\text{cold}} = 96\text{ ms}$, $T_{\text{warm}} = 35\text{ ms}$), any extra queue wait above 61 ms makes the cold worker faster. Cache affinity is a soft preference, never an unconditional pin.

<figure>
  <img src="illustrations/_generated/cache_affinity_wait_dark.png" alt="Plot of total service plus extra queue wait from 0 to 100 ms comparing a flat cold worker at 96 ms against a warm worker rising from 35 ms to 135 ms, crossing at 61 ms extra wait." />
  <figcaption>Cold queue wait cancels out of the route comparison: once extra wait on the warm shard exceeds the 61 ms prefill savings, sending the request to a cold replica finishes earlier.</figcaption>
</figure>

#### Fleet sizing by token volume

Size GPUs by uncached token volume, not active editor count. Suppose a region has 5,000 actively typing developers generating 0.4 debounced remote requests per second (2,000 raw req/s). If 60% cancel before reaching a GPU, 800 req/s enter inference. With 2,048-token prompts, a 50% prefix hit rate that skips 75% of prefill gives:

$$
\text{Prefill load} = \sum_{i} \lambda_i L_i (1 - s_i)
$$

When hits and misses have the same 2,048-token length, load is $800 \times 2048 \times (0.5 \times 0.25 + 0.5 \times 1.0) = 1{,}024{,}000$ tokens/s, or 52 GPUs at 20,000 effective prefill tokens/s per GPU (before decode, late-cancel waste, KV memory limits, and failover headroom).

> **Key insight:** You cannot multiply the overall average prompt length by the overall request hit rate when length correlates with cache hits. Sum each cohort's rate times its uncached tokens directly.

Keep 800 req/s, a 2,048-token overall average, and a 50% request hit rate, but vary which requests hit:

| Workload cohort | 400 hits/s (75% skipped) | 400 misses/s (0% skipped) | Uncached prefill | Prefill GPUs |
| :--- | :--- | :--- | :--- | :--- |
| Both 2,048 tokens | 204,800 tok/s | 819,200 tok/s | 1,024,000 tok/s | 52 |
| Hits 3,072; misses 1,024 | 307,200 tok/s | 409,600 tok/s | 716,800 tok/s | 36 |
| Hits 1,024; misses 3,072 | 102,400 tok/s | 1,228,800 tok/s | 1,331,200 tok/s | 67 |

<!-- leetllm: test, output=show -->
```python title="size-completion-fleet.py"
import math

GPU_PREFILL_TOK_S = 20_000
raw_qps = 5_000 * 0.4
gpu_qps = raw_qps * (1 - 0.60)  # 60% canceled before GPU scheduling

def prefill_load(cohorts: list[tuple[float, int, float]]) -> tuple[int, int]:
    tokens_s = int(sum(qps * length * (1 - skip) for qps, length, skip in cohorts))
    return tokens_s, math.ceil(tokens_s / GPU_PREFILL_TOK_S)

workloads = {
    "uniform_2048": [(400, 2048, 0.75), (400, 2048, 0.0)],
    "long_hits":    [(400, 3072, 0.75), (400, 1024, 0.0)],
    "long_misses":  [(400, 1024, 0.75), (400, 3072, 0.0)],
}

print(f"raw_qps: {raw_qps:.0f}, surviving_gpu_qps: {gpu_qps:.0f}")
for name, cohorts in workloads.items():
    tok_s, gpus = prefill_load(cohorts)
    print(f"{name:12s}: {tok_s:>9,d} tok/s -> {gpus} prefill GPUs")

# Warm-shard crossover using 96 ms cold vs 35 ms warm service time.
crossover_ms = 96 - 35
print(f"warm_shard_wait_crossover_ms: {crossover_ms}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw_qps: 2000, surviving_gpu_qps: 800
uniform_2048: 1,024,000 tok/s -> 52 prefill GPUs
long_hits   :   716,800 tok/s -> 36 prefill GPUs
long_misses : 1,331,200 tok/s -> 67 prefill GPUs
warm_shard_wait_crossover_ms: 61
```
<!-- leetllm: output:end -->

Every row has the exact same 800 req/s, 2,048-token mean, and 50% hit rate, yet GPU demand swings by 86% from 36 to 67 GPUs. Scale on uncached token throughput rather than request counts.

<figure>
  <img src="illustrations/_generated/token_weighted_fleet_dark.png" alt="Three workloads sharing a 50% hit rate and 2,048-token mean demand 36 GPUs for long hits, 52 GPUs for uniform lengths, and 67 GPUs for long misses." />
  <figcaption>Identical request counts, mean prompt lengths, and hit rates produce an 86% swing in GPU requirements depending on whether long prompts hit or miss the prefix cache.</figcaption>
</figure>

### Continuous batching

Static batching forces arriving completions to wait until a batch fills or the slowest sequence finishes. Continuous batching lets short completions join and exit on every decode iteration. Engines such as <span data-glossary="vllm">vLLM</span> combine continuous batching with <span data-glossary="pagedattention">PagedAttention</span> to allocate KV blocks without fragmentation.[^kwon2023] <span data-glossary="hugging-face-tgi">TGI</span> implemented similar ideas, though Hugging Face now recommends vLLM or <span data-glossary="sglang">SGLang</span> for new deployments.[^huggingface2026tgi] Cap maximum batch concurrency against inline p95 latency: pushing GPU utilization higher hurts user experience as soon as queue wait eats the 200 ms headroom.

### Cost economics

Because keystroke churn cancels so many requests and prefill dominates compute, cost per request is a misleading unit. Track **cost per accepted-and-retained suggestion**. Better debouncing, local semantic lanes, and prefix caching cut wasted compute, while overly aggressive abstention hurts usefulness. Always evaluate cost reductions alongside retention and shown rate.

## What of this buffer may leave the laptop

Open editor buffers routinely sit beside proprietary algorithms and stray <span data-glossary="secrets-management">credentials</span>. Decide what may leave the client, what gets logged, and how tenants stay isolated before sending the first remote request.

### Data isolation

For enterprise deployments where code may never cross organizational lines, enforce <span data-glossary="tenant-isolation">tenant isolation</span> across ingestion, caches, and logs:

- **No training on customer code:** Disable raw-prompt collection and downstream training exports by default; frozen inference weights alone do not stop a logging pipeline from archiving prompts.
- **Minimal retention:** Keep zero raw-code logs on the serving path, emitting only allowlisted operational metadata (tenant ID, model revision, and coarse latency bucket). Check proxy logs, exception trackers, and crash dumps separately so prompts cannot leak through error handlers.
- **Strict cache and batch isolation:** Key prefix caches by gateway-derived tenant scope, and verify per-request memory isolation before sharing GPU batches across tenants.

### Secret redaction and upload controls

Scan prompts on the client with <span data-glossary="regex">regular-expression</span> and entropy detectors before upload, replacing recognized secrets with placeholders such as `<API_KEY_1>` while keeping the secret map strictly in local memory. Never auto-restore raw secrets into model-generated output positions: a completion could paste the secret into a log statement or outbound HTTP call. Keep placeholders visible so the developer replaces them with a secret-store lookup. If the source buffer already contains the reserved placeholder prefix, abort the upload rather than risking a collision.

<!-- leetllm: test, output=show -->
```python title="mask-known-secrets-before-upload.py"
import re

TOKEN_RE = re.compile(r"demo_api_token_[A-Za-z0-9]+")

def redact_for_upload(text: str) -> tuple[str, dict[str, str]]:
    if "<API_KEY_" in text:
        raise ValueError("reserved placeholder prefix present in buffer")
    local_map: dict[str, str] = {}
    def _sub(match: re.Match[str]) -> str:
        placeholder = f"<API_KEY_{len(local_map) + 1}>"
        local_map[placeholder] = match.group(0)
        return placeholder
    return TOKEN_RE.sub(_sub, text), local_map

def telemetry_record(request: dict[str, str]) -> dict[str, str]:
    allowed = ("tenant", "model", "latency_bucket")
    return {k: request[k] for k in allowed}

clean_prompt, secret_map = redact_for_upload("client = API('demo_api_token_abc123')")
log_row = telemetry_record({
    "tenant": "acme-devtools",
    "model": "code-fim-v3",
    "latency_bucket": "100_to_200ms",
    "prompt": clean_prompt,
})

print("upload_prompt:", clean_prompt)
print("local_only_keys:", list(secret_map))
print("telemetry_fields:", sorted(log_row))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
upload_prompt: client = API('<API_KEY_1>')
local_only_keys: ['<API_KEY_1>']
telemetry_fields: ['latency_bucket', 'model', 'tenant']
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/upload_redaction_boundary_dark.png" alt="Client-side redaction replaces API tokens with placeholders before network upload, keeping the secret mapping in local memory while the server sees only sanitized text and logs allowlisted metadata." />
  <figcaption>Redact detected secrets locally before prompt upload and keep reversible mappings on the client. Preserve placeholders in generated output for developer review and log only allowlisted telemetry fields.</figcaption>
</figure>

### On-premises deployment

Regulated organizations may forbid sending source code to any multi-tenant cloud endpoint. Supporting those environments requires private VPC hosting, customer-managed self-hosted inference servers, or fully air-gapped local setups where the context engine and model run inside the customer network.

### Public-code matching and the mastery gap

Tools like GitHub Copilot offer optional filters that compare suggestions against public repositories and either suppress matches or attach license references.[^github2026copilotcodesuggestions] That reduces verbatim regurgitation, though developers still need ordinary code review. Equally important is the human risk: accepting fluent completions without reading them lets subtle bugs, deprecated APIs, and broken permission checks slip into production. Good UX and review habits keep completion as an accelerator rather than an autopilot.

## Common pitfalls

- **Stale suggestions paint late:** Missing cancellation or trusting arrival order. Advance a request epoch on every edit, cursor move, or permission change, and check the snapshot at both paint and Tab acceptance.
- **High acceptance, unhappy developers:** Optimizing raw acceptance rewards trivial punctuation. Track retained characters and shown rate alongside acceptance.
- **Slow `.` completions:** Routing deterministic member lookups to the LLM. Keep the language server on `.` and `(`.
- **Low prefix-cache hit rate:** Random load balancing scatters keystrokes across replicas, or early edits invalidate PSM blocks. Add queue-aware prefix affinity.
- **Code conflicts with lines below cursor:** Missing suffix reservation or left-to-right prompting. Reserve suffix tokens first and use native FIM sentinels.
- **Empty scope mid-line:** Waiting for a valid full AST. Use Tree-sitter recovery and convert UTF-16 editor offsets accurately.

## What to ship with

| Dimension | Ship criterion |
| :--- | :--- |
| **Latency** | Whole-trace edit-to-paint meets p95 target, with debounce and drops counted |
| **Context** | Suffix reserved first, then prefix, imports, and ranked allowed files inside token cap |
| **Infill** | Native FIM sentinels expose `(prefix, suffix)` without colliding with source text |
| **Serving** | Speculative decoding and prefix caching enabled only on slices with verified gains |
| **Freshness** | Every edit, cursor move, or rule change cancels stale work; paint and Tab verify snapshot |
| **Privacy** | Client redaction, allowlisted telemetry, tenant-scoped KV keys, and gateway enforcement |

```mastery-quiz
[
  {
    "question": "An immediate serial latency plan allocates 10 ms client handling, 45 ms transport, 25 ms context, 70 ms queue and model through a usable span, and 8 ms paint. Ordinary typing adds 60 ms debounce. Against a 200 ms edit-to-paint target, what follows?",
    "options": [
      "Immediate 158 ms; debounced 218 ms; actual p95 is proven under 200 ms.",
      "Immediate 148 ms; debounced 208 ms; actual p95 still requires whole-trace measurement.",
      "Immediate 158 ms; debounced 218 ms; actual p95 still requires whole-trace measurement.",
      "Immediate 158 ms; debounced 198 ms; actual p95 is proven under 200 ms."
    ],
    "answer": "Immediate 158 ms; debounced 218 ms; actual p95 still requires whole-trace measurement.",
    "explanation": "Summing the five serial stages gives 10 + 45 + 25 + 70 + 8 = 158 ms. Adding 60 ms debounce reaches 218 ms, exceeding 200 ms. A static budget allocation cannot determine p95 without measuring complete request traces."
  },
  {
    "question": "In the line `ab😀cd`, the caret sits right after the emoji. The editor counts UTF-16 units, a byte API counts UTF-8, and Python indexes code points. What are the (Python, UTF-16, UTF-8) offsets and correct Python suffix?",
    "options": [
      "3 / 4 / 6; suffix `cd`.",
      "4 / 4 / 6; suffix `d`.",
      "3 / 3 / 6; suffix `cd`.",
      "3 / 4 / 5; suffix `cd`."
    ],
    "answer": "3 / 4 / 6; suffix `cd`.",
    "explanation": "Two ASCII characters plus one supplemental emoji give Python index 3, four UTF-16 code units (a surrogate pair for the emoji), and six UTF-8 bytes. Convert the editor's offset 4 to Python index 3 before slicing so `cd` stays intact."
  },
  {
    "question": "A FIM prompt cap is 1,200 tokens. Framing uses 50, reserved suffix 200, prefix 500, and allowed definitions 300. One more allowed snippet needs 250 tokens, and a higher-scoring private file is blocked from upload. What fits?",
    "options": [
      "Include 250 snippet tokens; keep suffix 200; exclude the blocked file.",
      "Include 250 snippet tokens; shrink suffix to 100; exclude the blocked file.",
      "Include 150 snippet tokens; keep suffix 200; include the blocked file.",
      "Include 150 snippet tokens; keep suffix 200; exclude the blocked file."
    ],
    "answer": "Include 150 snippet tokens; keep suffix 200; exclude the blocked file.",
    "explanation": "Fixed prompt parts use 50 + 200 + 500 + 300 = 1,050 tokens, leaving 150 tokens. Preserve the reserved suffix and never let ranking scores override upload restrictions."
  },
  {
    "question": "At one speculative step, target p = [0.1, 0.6, 0.3] and draft q = [0.4, 0.4, 0.2]. The draft proposes index 0. What acceptance probability and rejection-resampling distribution preserve the target distribution?",
    "options": [
      "Acceptance 1/4; residual [0.1, 0.6, 0.3].",
      "Acceptance 1/4; residual [0, 2/3, 1/3].",
      "Acceptance 2/5; residual [0, 2/3, 1/3].",
      "Acceptance 1; residual [0.4, 0.4, 0.2]."
    ],
    "answer": "Acceptance 1/4; residual [0, 2/3, 1/3].",
    "explanation": "Acceptance is min(1, 0.1 / 0.4) = 1/4. Positive differences max(0, p - q) are [0, 0.2, 0.1], which normalize to [0, 2/3, 1/3]."
  },
  {
    "question": "A response for file F, version 8, selection (10, 10), epoch 55 is in flight. The user moves the cursor to (12, 12), advancing to epoch 56 with no text edit or new request. The old response arrives. What should the editor do?",
    "options": [
      "Paint at (10, 10) because document version 8 still matches.",
      "Paint at (12, 12) and check freshness on Tab.",
      "Discard before paint and leave Tab empty for that response.",
      "Paint at (12, 12) because no text edit occurred."
    ],
    "answer": "Discard before paint and leave Tab empty for that response.",
    "explanation": "Cursor movement advances the epoch and invalidates in-flight responses even without a replacement request. Both paint and Tab acceptance must require matching snapshot and epoch."
  },
  {
    "question": "Two eligible replicas have equal base queue wait. A cold worker needs 60 ms prefill plus 20 ms decode; a warm worker needs 15 ms prefill plus 20 ms decode but carries 50 ms of extra queue wait. Which worker finishes sooner?",
    "options": [
      "Cold 80 ms; warm 85 ms; choose cold.",
      "Cold 80 ms; warm 35 ms; choose warm.",
      "Cold 80 ms; warm 65 ms; choose warm.",
      "Cold 100 ms; warm 85 ms; choose warm."
    ],
    "answer": "Cold 80 ms; warm 85 ms; choose cold.",
    "explanation": "Cold finishes in 60 + 20 = 80 ms. Warm takes 50 + 15 + 20 = 85 ms because its 50 ms extra queue wait exceeds the 45 ms prefill savings."
  },
  {
    "question": "Five distinct shown suggestion IDs insert [10, 20, 0, 8, 0] characters and retain [4, 20, 0, 0, 0] characters after the observation window. What are the acceptance and retained-character rates?",
    "options": [
      "4/5 accepted; 12/19 retained.",
      "3/5 accepted; 12/19 retained.",
      "3/5 accepted; 24/30 retained.",
      "4/5 accepted; 24/30 retained."
    ],
    "answer": "3/5 accepted; 12/19 retained.",
    "explanation": "Three of five shown IDs inserted text (3/5). Total inserted characters are 38 and retained characters are 24, giving 24/38 = 12/19."
  },
  {
    "question": "6,000 active editors send 0.5 req/s, and half cancel before GPU scheduling. Of 1,500 surviving req/s, 600 hits have 1,800 tokens and skip 50% of prefill; 900 misses have 800 tokens. At 30,000 effective prefill tokens/GPU-s, what prefill load and GPU count follow?",
    "options": [
      "1,440,000 tokens/s; 48 GPUs.",
      "720,000 tokens/s; 24 GPUs.",
      "2,520,000 tokens/s; 84 GPUs.",
      "1,260,000 tokens/s; 42 GPUs."
    ],
    "answer": "1,260,000 tokens/s; 42 GPUs.",
    "explanation": "Hits contribute 600 * 1800 * 0.5 = 540,000 tok/s and misses contribute 900 * 800 = 720,000 tok/s, totaling 1,260,000 tok/s. Dividing by 30,000 tok/GPU-s yields 42 prefill GPUs."
  },
  {
    "question": "Two upload-permitted files request remote completion. File A contains `connect('demo_api_token_fern82')`. File B has the same call plus `# expect <API_KEY_24>`. The scanner reserves `<API_KEY_` for placeholders. What should the client upload?",
    "options": [
      "Upload masked A; upload masked B.",
      "Upload masked A; block B.",
      "Block both A and B.",
      "Upload masked A with its secret mapping; block B."
    ],
    "answer": "Upload masked A; block B.",
    "explanation": "File A masks cleanly to `connect('<API_KEY_1>')` while keeping the mapping strictly local. File B already contains the reserved `<API_KEY_` prefix, so the scanner rejects B before upload."
  }
]
```

> **Next:** Continue to [Multi-Tenant LLM Platform](/learn/design-multi-tenant-llm-serving-platform). You now have one product path that reuses a prefix cache only inside a tenant, model, and tokenizer key, and that drops stale work before it touches the editor. Next you will put many specialized models onto shared GPUs and keep isolation, quotas, cost attribution, and canary deployments honest when the fleet is no longer dedicated.
