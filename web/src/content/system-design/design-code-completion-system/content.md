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
  "shortDescription": "A suggestion for `is_allowed =` can arrive after the developer has typed past it. Keep the useful ones, and don't paint the stale line.",
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

Content moderation put a safety decision on a low-latency path. Code completion adds a moving editor state: a developer types `is_allowed =`, continues with `graph.`, and then receives a suggestion built for the older buffer. If accepting that suggestion replaces the newer line, the system has corrupted the edit. Even a correct suggestion feels broken when it arrives after the developer has moved on.

A code completion system predicts useful edits while a developer is still typing. GitHub Copilot's product family splits that job into dimmed ghost text at the cursor and next-edit suggestions that also predict *where* the next change should land.[^github2026copilotcodesuggestions] Remote suggestions can use <span data-glossary="fill-in-the-middle">fill-in-the-middle (FIM)</span>, which conditions the missing code on both the text before the cursor and the text after it.

Coding agents that plan multi-file patches sit a layer above and get a different latency budget. In the design scenario below, the inline path has a 200 ms <span data-glossary="p95-latency">p95</span> <span data-glossary="slo">service-level objective (SLO)</span>. A real product has to set and validate its own objective from user research and telemetry.

Before tracing the path, predict what should happen to an exact member lookup after `graph.` and to an open-ended assignment after `is_allowed =`. One should stay local; the other may justify remote generation. The figure makes that split, and its freshness gate, visible:

<figure>
  <img src="illustrations/_generated/code_completion_dark.png" alt="A captured editor snapshot S contains document, version, selection and policy, and a request epoch travels with each candidate. Three concrete triggers route differently: Polic uses local lexical completion to PolicyGraph; graph. uses local semantic type members when receiver type information is available; is_allowed equals may use remote FIM with upload permission. All results rejoin the same current-snapshot gate before ghost text and version-checked Tab insertion. A separate plan, edit, test, review loop depicts the slower multi-file coding agent." />
  <figcaption>Follow the same captured snapshot with every result. Lexical and available type-informed completions stay local; permitted open-ended spans can use remote FIM. Both lanes check freshness before ghost text and insertion. The multi-file agent loop has a separate interaction budget.</figcaption>
</figure>

You've already seen how Transformer-based large language models (LLMs) predict the next <span data-glossary="token">token</span> and how the <span data-glossary="kv-cache">key-value (KV) cache</span> avoids recomputing shared work. This chapter puts those ideas on a keystroke path: the client may notice every edit, but it only sends qualified requests and only displays fresh results. The Python examples below are local contract tests with invented inputs; measure model quality and hardware performance separately.

```checkpoint
What makes code completion harder than a normal chat product?
---
The user keeps editing while inference is in flight. The product must choose when to request a suggestion, use code before and after the cursor for infill, meet a measured latency objective, and suppress stale responses.
```

## One cursor, five lanes

The running example is a half-typed `validate_token_scope` function. Ask which lane should complete `PolicyGraph`, which should answer `graph.`, and which can suggest the expression after `is_allowed =`:

| Lane | What it sees in this file | Best at |
| :--- | :--- | :--- |
| **Lexical** | Prefix of `is_all` or `Polic` | Local identifiers and keywords already in the buffer |
| **Semantic** | Typed receiver after `graph.` | Members available from the language server's current type information |
| **Inline generation** | Prefix plus suffix around `is_allowed =` | A line or block that has to match `return is_allowed` |
| **Next-edit** | The accepted line plus nearby edits | The next nearby change after that insertion |
| **Coding agent** | The repo, tests, and a task prompt | A multi-file patch, not a ghost-text keystroke |

### Lexical and semantic first

A prefix index can finish `PolicyGraph` from the import line. After `graph.`, prefer the language server when it knows the receiver type and valid members. Dynamic code, missing dependencies, and incomplete indexing can leave it uncertain. A lexical fallback remains useful without a model call.

### Inline generation for an open-ended span

The empty assignment `is_allowed =` is the generative case. No symbol table can invent the policy check that has to produce `is_allowed` for the return below. That's the fill-in-the-middle path the 200 ms budget is for.

### Agents stay off the keystroke clock

A coding agent can research the repo, run tests, and edit several files.[^github2026copilotcloudagent] That's a different product loop. Ghost text still has to gather a small prompt, generate a candidate, and stay under the 200 ms p95 clock.

```checkpoint
Why should a design separate inline completion from coding agents?
---
Inline completion optimizes keystroke latency and local context. Coding agents optimize multi-step repository changes, tool use, tests, and review. They share model and context foundations, but their latency budgets and product loops differ.
```

## The keystroke budget

An inline suggestion on `is_allowed =` competes with the next keystroke. If it arrives too late, the developer has already typed past it. If it's irrelevant, it becomes visual noise.

Those two failure modes set the constraints:

- Latency: For this scenario, keep single-line inline completion under 200 ms at p95. Give multi-line suggestions a separately measured budget.
- Context: Use open files, imports, function signatures, and nearby project structure, not the current file alone.
- Quality: Track acceptance *and* accepted-and-retained characters. The exact target varies by language, editor UX, and how aggressively the client shows suggestions.
- Scale: Developer fleets spike by time of day, so <span data-glossary="gpu">GPU</span> utilization and cancel rate both matter.
- Privacy: Define what code may leave the client, what is retained, whether training use is disabled by default, and how tenants are isolated.

Measure edit-to-usable-suggestion from the qualifying editor event until a fresh span is painted. That includes debounce, context construction, queueing, network transfer, generation of enough text to display, and paint. Separately measure client <span data-glossary="ttft">time-to-first-token (TTFT)</span> from request submission to the first response token. TTFT already includes network and server waiting; don't add it to those stages again.

This serial allocation models an immediately triggered request. Estimate percentiles from observed request traces. A longer prompt can increase transfer and prefill; profile both.

| Stage | Latency budget | Notes |
|-------|----------------|-------|
| Client handling + local parse | 12 ms | Capture document version, selection, and syntax state. |
| Network | 55 ms | Transport only; no server queue or compute included. |
| Context assembly | 28 ms | Fetch permitted snippets and construct the prompt. |
| Queue + model service | 78 ms | Admission, prefill, and decode through the displayed span. |
| UI render | 10 ms | Validate freshness and paint. |

The allocation totals 183 ms, leaving 17 ms against the 200 ms objective. Adding the later 150 ms ordinary-typing debounce makes this path 333 ms. Either shorten that debounce, route locally, or declare a separate pause-to-suggestion objective. Don't hide the delay by starting the clock at HTTP submission.

The calculation below also shows why a percentile must be computed over complete request traces, not by summing stage percentiles:

<!-- leetllm: test, output=show -->
```python title="latency-budget-check.py"
import math

STAGE_BUDGET_MS = {
    "client_parse": 12,
    "network": 55,
    "context": 28,
    "queue_and_model_through_span": 78,
    "paint": 10,
}
INLINE_P95_OBJECTIVE_MS = 200

total_ms = sum(STAGE_BUDGET_MS.values())
headroom_ms = INLINE_P95_OBJECTIVE_MS - total_ms

assert total_ms <= INLINE_P95_OBJECTIVE_MS
assert total_ms + 150 > INLINE_P95_OBJECTIVE_MS

def p95(values: list[int]) -> int:
    if not values:
        raise ValueError("no completed traces")
    return sorted(values)[math.ceil(0.95 * len(values)) - 1]

# Per-stage latency traces (ms) across five completion requests.
traces = [(100, 1), (1, 100)] + [(1, 1)] * 18
assert p95([sum(trace) for trace in traces]) == 101
assert sum(p95(list(stage)) for stage in zip(*traces)) == 2
print("allocated_path_ms:", total_ms)
print("headroom_ms:", headroom_ms)
print("synthetic_trace_p95_ms:", p95([sum(trace) for trace in traces]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
allocated_path_ms: 183
headroom_ms: 17
synthetic_trace_p95_ms: 101
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/edit_to_paint_budget_dark.png" alt="A shared 0 to 333 millisecond scale compares an immediate serial allocation of 12 parse, 55 transport, 28 context, 78 queue and model through usable span, and 10 paint, totaling 183 with 17 headroom to 200. A second lane adds 150 debounce and ends at 333. TTFT is a request-to-first-token observation inside the path, not another stage. A separate 20-request matrix has rows (100,1), (1,100), then eighteen (1,1). Whole-trace nearest-rank p95 is 101 while the sum of stage p95 values is 2; the allocation alone does not determine measured p95." />
  <figcaption>These serial allocations total 183 ms immediately and 333 ms after debounce. TTFT is observed from request submission to the first token within the request path. Whole-trace latency percentiles reflect full end-to-end execution rather than a simple sum of stage p95 values.</figcaption>
</figure>

```checkpoint
If a completion arrives after the user typed three more characters, what should the client do?
---
Treat it as stale. Abort when possible and gate rendering and acceptance against the captured document version, selection, and editor epoch, not response arrival order.
```

---

## Who owns the `is_allowed =` keystroke

Three pieces share that keystroke: the IDE (Integrated Development Environment) extension, a context engine, and an inference server.

The extension owns keystrokes, open tabs, and cursor position. The context engine, which can run on the client or the gateway, picks the snippets that actually fit the live prompt budget. The Language Server Protocol (LSP) is the usual interface between an editor and a language server, so the same semantic engine can power completion, go-to-definition, and diagnostics across editors.[^microsoft2026lsp]

Now make the parser answer a smaller question: after the unfinished `is_allowed =`, which function and imports surround the cursor? Incremental parsers such as Tree-sitter are designed to produce useful syntax trees despite errors.[^treeSitter2026] Malformed buffers can leave error or missing nodes, so inspect the returned scope before using it. Ask for the nearest reliable scope, fall back conservatively, and let the language server supply available type information.

That hybrid is the product, not an optimization. After a dot, semantic candidates from the language server are usually faster and more accurate than free-form generation. The model earns GPU time on longer spans, comment-to-code, and cases the type system doesn't capture.

The inference server hosts the model and uses <span data-glossary="continuous-batching">continuous batching</span> so many short, cancellable requests can share resident weights.

```checkpoint
When should deterministic semantic completion beat the LLM?
---
After exact trigger characters like `.`, when the language server knows the receiver type and valid members. It's faster, more precise, works offline, and avoids spending GPU cycles on a deterministic lookup.
```

### Local fallback lane

Not every keystroke should take the remote generation path. Keep a deterministic lane for the cheap, high-confidence cases:

- Local symbols and imported APIs: Exact member completion from the parser or language server.
- Prefix indexes or tries: Keyword and snippet lookup with predictable latency.
- Fuzzy matching: Edit-distance recovery for small typos like `pritn` instead of `print`.

That lane avoids network latency for exact matches and provides a fallback when remote inference is unavailable. Its latency still depends on index readiness and client workload.

A backward scan illustrates the difference between a cheap context hint and an enclosing-scope parser. This helper returns a preceding function header, including on incomplete input. Use a parser with scope tracking to determine whether the cursor is inside that function:

<!-- leetllm: test, output=show -->
```python title="enclosing-def.py"
def nearest_def_header(source: str, cursor_line: int) -> str | None:
    if cursor_line < 0:
        raise ValueError("cursor_line must be nonnegative")
    lines = source.splitlines()
    start = min(cursor_line, len(lines) - 1)
    for index in range(start, -1, -1):
        stripped = lines[index].lstrip()
        if stripped.startswith(("def ", "async def ")):
            return stripped
    return None

source = """from authz.policies import PolicyGraph

def validate_token_scope(request):
    is_allowed =
    return is_allowed
"""

assert nearest_def_header(source, 3) == "def validate_token_scope(request):"
assert nearest_def_header(source, 0) is None
assert nearest_def_header("", 0) is None
# A preceding header is not an enclosing scope after a dedent.
outside = "def finished():\n    pass\nx = 1\n"
assert nearest_def_header(outside, 2) == "def finished():"
print("preceding_header:", nearest_def_header(source, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
preceding_header: def validate_token_scope(request):
```
<!-- leetllm: output:end -->

A production client uses syntax-node ranges and the language server for scope and types. The scan can match text inside multiline strings, miss multiline definitions, and cross a dedent. Never use it to decide symbol visibility or file authorization. Convert editor positions using the editor's documented encoding; UTF-16 code units, UTF-8 byte offsets, and Python string indices are not interchangeable. VS Code's `Position.character` counts UTF-16 code units; its `positionAt` and `offsetAt` methods convert between document positions and offsets in that same unit.[^vscode2026EditorSnapshotApi]

Put the caret after the emoji in `a😀b`. What suffix should an infill request preserve? It is `b`, but copying the editor's character offset directly into a Python slice loses it:

<!-- leetllm: test, output=show -->
```python title="compare-editor-position-units.py"
line = "a😀b"
python_index = 2  # caret after a and the emoji
prefix = line[:python_index]
utf16_offset = len(prefix.encode("utf-16-le")) // 2
utf8_offset = len(prefix.encode("utf-8"))

assert (python_index, utf16_offset, utf8_offset) == (2, 3, 5)
assert line[python_index:] == "b"
assert line[utf16_offset:] == ""  # wrong unit for this slice
print("offsets (Python, UTF-16, UTF-8):", python_index, utf16_offset, utf8_offset)
print("correct suffix:", repr(line[python_index:]))
print("wrong-unit suffix:", repr(line[utf16_offset:]))
try:
    line.encode("utf-8")[:utf16_offset].decode("utf-8")
except UnicodeDecodeError:
    print("wrong-unit byte slice: splits the emoji")
else:
    raise AssertionError("expected an incomplete UTF-8 sequence")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
offsets (Python, UTF-16, UTF-8): 2 3 5
correct suffix: 'b'
wrong-unit suffix: ''
wrong-unit byte slice: splits the emoji
```
<!-- leetllm: output:end -->

The unit belongs to the API contract, not the language of the file being edited. Preserve the editor snapshot, convert positions before slicing or replacing, and validate the range again against the current document version.

<figure>
  <img src="illustrations/_generated/editor_position_units_dark.png" alt="Three character encodings aligned on character boundaries. Python tracks Unicode code points, UTF-16 uses surrogate pairs for supplemental characters, and UTF-8 uses multi-byte variable length sequences. Exact caret coordinates require consistent representation between IDE editor models and backend tokenizers." />
  <figcaption>The columns align characters of a😀b; subdivisions count encoding units. The explicit U+1F600 drawing represents the emoji. The same caret is Python index 2, UTF-16 offset 3, and UTF-8 offset 5. Copying 3 into a Python slice loses b; cutting UTF-8 at byte 3 splits the emoji.</figcaption>
</figure>

```checkpoint
The editor reports character 3 after the emoji in `a😀b`. Can the Python context builder use `line[3:]` as the suffix?
---
No. Here the editor counts UTF-16 units, while Python indexes Unicode code points. Convert to Python index 2 to preserve `b`; freshness checks won't repair a range that was built in the wrong unit.
```

The client keeps lightweight parsing and exact-member lookup on-device, so only qualified prompts reach GPUs. `graph.` can stay local. `is_allowed =` can justify a permitted generative request. Which tokens earn a place in that remote prompt?

---

## Context gathering and management

The model needs enough context to make useful suggestions, but the live prompt budget is deliberately kept small because long <span data-glossary="prefill">prefills</span> destroy latency. Even if the base model advertises a much larger <span data-glossary="context-window">context window</span>, you can't stuff the whole repository into the keystroke path. Choose the tokens that can change the next edit, then fit them within the latency budget.

### Context priority strategy

First filter candidates by authenticated repository access and upload policy, including unsaved buffers and retrieved files. Rank only the permitted candidates. In this scenario the entire prompt is capped at 8,000 tokens, including FIM markers and other framing; reserve output separately within the model's total context limit. Keep a minimum suffix allocation before filling the remaining space with prefix and retrieved definitions. A greedy prefix-first truncation can otherwise erase the infill boundary.

| Priority | Source | Method | Rationale |
|----------|--------|--------|-----------|
| **1 (Highest)** | Code before cursor | Direct prefix | Immediate grammatical context. |
| **2** | Code after cursor (suffix) | FIM Suffix | Needed to close brackets, match types. |
| **3** | Imports & Definitions | Static Analysis | Types and functions used in the file. |
| **4** | Recently Edited Files | Temporal locality | Code you just touched is likely relevant. |
| **5** | Neighboring Files | Jaccard Similarity | Files that share imports with current file. |

### Fill-in-the-middle (FIM)

Standard causal language models predict the next token based *only* on the past (left-to-right). In coding, you often insert code in the middle of a file. Pause before naming the format: if the suffix contains `return is_allowed`, what can a prefix-only model not see? It might generate valid code that conflicts with the closing braces or logic below.

> **FIM context:** A prefix-only completion prompt exposes only code before the cursor. FIM also exposes code after the cursor before generation, so the completion can match a return type, closing delimiter, later variable use, or test expectation that appears below the edit.

FIM reorders the prompt so the model sees the suffix before generating the middle. Marker strings differ by <span data-glossary="tokenization">tokenizer</span> and model; the notation below names their roles rather than defining a universal API:

$$
P_{\text{FIM}} = \texttt{<PRE>} + x_{\text{prefix}} + \texttt{<SUF>} + x_{\text{suffix}} + \texttt{<MID>}
$$

<figure>
  <img src="illustrations/_generated/fim_prompt_dark.png" alt="Prefix and suffix spans route from one file into PRE, prefix, SUF, suffix, MID prompt order. The suffix is visible before the generated middle returns to the original hole." />
  <figcaption>The PSM prompt exposes the suffix before generating the middle. Only the middle returns to the hole; the suffix stays in place. Marker strings name checkpoint-specific sentinel roles.</figcaption>
</figure>

#### Building the FIM prompt

Build the input in FIM order: prefix marker + code before cursor + suffix marker + code after cursor + middle marker. Then the model generates the missing middle section.

Use a concrete example: you're editing an authorization helper and your cursor sits inside an empty function body.

#### Prefix (code before cursor)

```python title="prefix-code-before-cursor.py"
from authz.policies import PolicyGraph

def validate_token_scope(request):
    """Check whether the requested API scope is allowed."""
    is_allowed =
```

#### Suffix (code after cursor)

```python title="suffix-code-after-cursor.py"
    return is_allowed
```

#### FIM prompt sent to the model

```text
<PRE>from authz.policies import PolicyGraph

def validate_token_scope(request):
    """Check whether the requested API scope is allowed."""
    is_allowed = <SUF>
    return is_allowed
<MID>
```

The suffix gives the model a constraint, not an authorization specification. Completing calls against policy interfaces requires matching their actual signatures and schema semantics. Generated permission checks require review and tests. No completion should grant access or run tools merely because the model emitted it.

Before wiring up a real tokenizer, test the transformation itself. This formatter is notation only. A serving adapter must insert the model's sentinel IDs and encode code as ordinary content, rather than accidentally interpreting marker-like strings inside a file as control tokens.

<!-- leetllm: test, output=show -->
```python title="format-fim-request.py"
def format_fim(prefix: str, suffix: str) -> str:
    return f"<PRE>{prefix}<SUF>{suffix}<MID>"

prefix = "def validate_token_scope(request):\n    is_allowed = "
suffix = "\n    return is_allowed\n"
prompt = format_fim(prefix, suffix)

assert prompt.endswith("<MID>")
assert prompt.index("<SUF>") < prompt.index("return is_allowed")
print(prompt.replace("\n", "\\n"))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
<PRE>def validate_token_scope(request):\n    is_allowed = <SUF>\n    return is_allowed\n<MID>
```
<!-- leetllm: output:end -->

FIM gives a decoder-only model suffix information without changing left-to-right decoding. A native FIM adapter must use the checkpoint's documented sentinel tokens and input format. An instruction-following causal model can also receive prefix and suffix in an ordinary task prompt and attempt an insertion; left-to-right attention doesn't prohibit that. It is a different interface, whose output boundaries, quality, and latency need their own evaluation. Arbitrary `<PRE>` strings don't establish native FIM support.

During pre-training, a subset of examples is transformed:

1. Split a sequence at two boundaries into `(prefix, middle, suffix)`.
2. Reorder to `(prefix, suffix, middle)` with sentinel tokens between segments.
3. Apply causal next-token training to the transformed sequence; at its final segment, the model predicts the middle conditioned on the preceding prefix and suffix.

The two common inference formats are:

- PSM (Prefix-Suffix-Middle): `<PRE>prefix<SUF>suffix<MID>middle`. This is the format used in the prompt above, and the one Qwen2.5-Coder documents for file-level completion.[^qwen352024]
- SPM (Suffix-Prefix-Middle), in Bavarian et al.'s joint-training encoding: `<PRE><SUF>suffix<MID>prefixmiddle`. Prefix and generated middle are contiguous. At inference, stop the prompt after `prefix` and generate `middle`. Other SPM encodings exist, so follow the checkpoint's training format.[^bavarian2022]

Bavarian et al. found that FIM pretraining could preserve left-to-right capability on their evaluations. Treat that as a result for the evaluated checkpoints and data mixtures; validate the behavior of your own combination. Character-level span selection also exposes mid-token edits during training.[^bavarian2022]

```checkpoint
Why does fill-in-the-middle matter more for IDE completion than for chat?
---
Developers usually edit inside existing files. For an insertion that must fit existing code, the model needs suffix context such as closing braces, return statements, or following tests.
```

### Repository-level context

Large repos need more than simple file buffering. Retrieve definitions that can change the next few tokens, using an index updated outside the request path. Imagine `scope_validator.py` imports `PolicyGraph` and `ScopeRule`, while `metrics.py` contains only counters. Two candidate ranking methods are:

1. **Jaccard similarity:** Divide the intersection of unique symbols by their union. In the worked example below, three active symbols and three candidate symbols share two names: the score is `2 / (3 + 3 - 2) = 0.5`. Use this score as a ranking hint; validate relevance and authorization separately.
2.  **<span data-glossary="bm25">BM25</span> / <span data-glossary="sparse-retrieval">Sparse Retrieval</span>:** A lightweight keyword search over the local repo index to find defining files for classes used in the current buffer.[^robertson2009]

Dense <span data-glossary="vector">vector</span> retrieval can also fit if embeddings and indexes are ready. Measure lookup, optional <span data-glossary="reranker">reranking</span>, and prompt assembly together. This design leaves iterative retrieve-generate-retrieve loops on the slower route because each serial model call consumes another latency budget.

This three-file ranking example keeps `scope_rules.py` and `policy_graph.py`. It tests ranking arithmetic, not repository-scale lookup speed. All candidates are assumed already authorized:

<!-- leetllm: test, output=show -->
```python title="select-nearby-context.py"
active_symbols = {"PolicyGraph", "ScopeRule", "TokenClaims"}
candidate_files = {
    "scope_rules.py": {"ScopeRule", "TokenClaims", "AuditEvent"},
    "metrics.py": {"Counter", "Histogram"},
    "policy_graph.py": {"PolicyGraph", "Node"},
}

def jaccard(left: set[str], right: set[str]) -> float:
    union = left | right
    return len(left & right) / len(union) if union else 0.0

ranked = sorted(
    ((jaccard(active_symbols, symbols), path) for path, symbols in candidate_files.items()),
    reverse=True,
)
selected = [path for score, path in ranked if score >= 0.25]

assert selected == ["scope_rules.py", "policy_graph.py"]
assert jaccard(set(), set()) == 0.0
assert jaccard({"A"}, {"A"}) == 1.0
print("selected_context:", selected)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
selected_context: ['scope_rules.py', 'policy_graph.py']
```
<!-- leetllm: output:end -->

The score ranks retrieval candidates; verify repository relevance before adding a file to the prompt. If a known definition repeatedly misses the threshold, inspect symbol extraction and index freshness before increasing the context window.

<figure>
  <img src="illustrations/_generated/authorized_context_selection_dark.png" alt="Only authorized and upload-permitted files enter a symbol-membership matrix. A is active, S is scope_rules.py, P policy_graph.py, M metrics.py. Rows contain PolicyGraph, ScopeRule, TokenClaims, AuditEvent, Node, Counter and Histogram, with exact memberships. Active and S intersect in ScopeRule and TokenClaims, two of four union symbols, scoring 0.5. Active and P share PolicyGraph, one of four, scoring 0.25. Active and M share zero of five. A 0.25 threshold retains S and P. A model-context container reserves suffix and framing inside the 8,000-token prompt cap, then fits prefix and permitted retrieval. Output reserve is separate from the prompt within total model context; component sizes are symbolic." />
  <figcaption>Rank only permitted files. The membership rows expose both intersection and union: scope_rules scores 2/4 and policy_graph 1/4, so both meet 0.25. The prompt and output containers show separate reserves with an 8,000-token prompt cap.</figcaption>
</figure>

```checkpoint
Why is "send the whole repository" the wrong context strategy?
---
Long prefills break latency and irrelevant files can distract the model. Rank context by cursor proximity, suffix, imports, recent edits, and lightweight symbol overlap before spending tokens.
```

---

## Model serving for low latency

A small prompt can still miss the 200 ms paint. Profile queueing, prefill, and decode separately, because a slow queue and a slow prefill need different fixes. Long context can make prefill dominant, but short output doesn't make decode free. Speculation targets serial decoding, not prompt prefill, and can worsen first-token latency through added draft work. If it proposes five tokens and rejects token five, how many tokens does a correction step emit?

### Speculative decoding

In the classical two-model version of speculative decoding, a smaller, faster draft model proposes the next $K$ tokens, then a larger target model verifies them in one parallel pass.[^leviathan2023] Other proposal methods include prompt n-grams and checkpoint-native multi-token prediction. Choose among methods using serving-stack compatibility, acceptance rate, and measured latency before <span data-glossary="rollout">rollout</span>.[^vllm2026spec]

If the target agrees, you emit several tokens after one target pass. If the draft misses, the target supplies the correction and you continue from there.

<figure>
  <img src="illustrations/_generated/speculative_decode_dark.png" alt="Speculative decoding pipeline showing five candidate tokens generated by a fast draft model. In a single parallel verification forward pass, the target model accepts the first four tokens, rejects the fifth, and emits a correction, producing five valid tokens in two compute units." />
  <figcaption>The verification pass evaluates five candidate tokens in parallel, accepting the first four and emitting a target-generated correction for the fifth. With stochastic verification, each candidate is accepted with probability $\min(1, p(x)/q(x))$, preserving target model output distribution exactly.</figcaption>
</figure>

Treat `graph`, `.`, `allows`, `(`, and `user` as five sample token IDs; an actual tokenizer may segment them differently. With four accepted drafts, the correction `request` makes five emitted tokens. With one accepted draft, a correction makes two. With an immediate rejection, only the correction is emitted, but draft overhead was still paid. If all five are accepted, the standard algorithm can emit a sixth, bonus target token, subject to stopping rules.

For stochastic decoding, "agrees" means accepting draft token $x$ with probability $\min(1,p(x)/q(x))$, where $p$ and $q$ are target and draft distributions over the same token vocabulary. On rejection, sample from normalized $\max(p-q,0)$. A greedy implementation instead verifies against the target's greedy choices. A confidence threshold isn't a substitute for this distribution-preserving rule.[^leviathan2023]

Under an intentionally simplified cost model, five draft steps costing one target step plus verification costing one more yield `5 / 2 = 2.5` times the baseline output per unit cost when four drafts survive. The 2.5x figure follows this simplified arithmetic; real verification cost depends on how many target-model tokens each step processes, so benchmark before forecasting performance.

Code with repetitive imports or boilerplate can raise acceptance. Treat that as a rollout hypothesis, not a property of all languages: measure accepted draft length and end-to-end latency by language and suggestion type before enabling it broadly.[^leviathan2023]

The sketch treats target verification as roughly one target step for the whole draft. Under continuous batching, verifying many draft tokens can steal decode slots from neighbors, raise their TTFT, and erase the headline speedup. Re-measure with production batch occupancy; see [speculative decoding](/learn/speculative-decoding) for that interaction.

The candidate gate below evaluates draft acceptance, p95 latency, and regression slices jointly. For a release decision, collect Python and SQL measurements on the target distribution, verify target-distribution or greedy equivalence, run representative load with enough samples for tail estimates, and check quality and failure-rate guardrails:

<!-- leetllm: test, output=show -->
```python title="gate-speculative-decoding.py"
measurements = {
    "python_imports": {"mean_accepted_tokens": 3.8, "baseline_p95_ms": 178, "spec_p95_ms": 136},
    "sql_queries": {"mean_accepted_tokens": 1.1, "baseline_p95_ms": 169, "spec_p95_ms": 176},
}

def enable_speculation(sample: dict[str, float]) -> bool:
    latency_gain_ms = sample["baseline_p95_ms"] - sample["spec_p95_ms"]
    return sample["mean_accepted_tokens"] >= 2.0 and latency_gain_ms >= 10

enabled = [name for name, sample in measurements.items() if enable_speculation(sample)]
assert enabled == ["python_imports"]
print("speculative_decode_enabled_for:", enabled)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
speculative_decode_enabled_for: ['python_imports']
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/speculation_slice_gate_dark.png" alt="Dual-axis qualification gate evaluating speculative decoding suitability across completion slices. The qualification boundary requires at least 2.0 mean accepted draft tokens and at least 10 ms p95 latency reduction. Python imports pass with 3.8 accepted tokens and 42 ms improvement, while SQL queries fail with 1.1 tokens and a 7 ms latency regression." />
  <figcaption>Dual-axis qualification evaluates speculative decoding suitability across completion workloads. Python imports qualify with 3.8 accepted tokens and a 42 ms p95 latency reduction, whereas SQL queries fail the gate with 1.1 accepted tokens and a 7 ms latency regression under verification overhead.</figcaption>
</figure>

```checkpoint
Your draft model proposes 5 tokens and the target accepts 3. Did speculative decoding fail?
---
Not necessarily. Three accepted drafts plus a correction can emit four tokens. Whether that helps depends on draft and verification costs, batch occupancy, and end-to-end latency; high acceptance alone is not sufficient.
```

### KV cache reuse (prefix caching)

Developers often type, pause, and type again in the same file. The file's header (imports, class definitions, and previously written functions) remains constant across these rapid sequential interactions. Ask what a cache hit can remove before reading the timing example: prefill work, decode work, or both?

Instead of prefilling the same stable file header on every request, the server can cache Key-Value (KV) blocks for a shared prefix. When the next prompt begins with the same cacheable blocks under the same tenant and model policy, it reuses those blocks and prefills only the uncached delta. Automatic <span data-glossary="prefix-cache">prefix caching</span> does **not** make generation of new output tokens cheaper; it removes duplicate prefill work for reused input context.[^vllm2026prefix]

For a synthetic arithmetic example, suppose the complete 1,280-token prompt contains a 1,200-token reusable prefix and an 80-token delta. Assign a miss 72 ms of prefill plus 24 ms through the output span; assign a hit 11 ms plus 24 ms. The resulting model-service totals are 96 ms and 35 ms. They exclude network, queueing, and paint and are not TTFT measurements.

Cache reuse requires an exact token prefix and compatible KV computation. Matching source text alone can hide a changed final token, so include framing and retrieved context before the file, retokenize, and match full cache blocks. In PSM, editing the prefix also invalidates the later suffix's cached states. SPM can preserve a suffix-first prefix when supported by the trained model.

| Next request | Reusable prefix work | Remaining work |
|------------------|------------------------------|----------------------------|
| Same stable header, a few characters appended | Skip prefill for matching cached blocks | Prefill new input delta, then decode suggestion tokens |
| Edit near the top of the file | Only blocks before the changed point can match | Prefill from first changed block onward, then decode |
| Different tenant, model, tokenizer, or cache policy | No permitted reuse | Full prompt prefill, then decode |

Those savings depend on stable prefixes, block matching, routing affinity, and isolation. A long header with a small cursor-adjacent delta is a good candidate. An early edit or a cross-tenant request is a miss by design.

<figure>
  <img src="illustrations/_generated/prefix_cache_dark.png" alt="A 1,280-token prompt strip contains exactly 1,200 matching prefix tokens and 80 delta tokens. Two model-service timelines share a 0 to 96 ms scale. A miss uses 72 ms prefill and 24 decode, totaling 96. A permitted hit uses 11 prefill and the same-width 24 decode, totaling 35. Prompt identity and scope govern reuse. Order strips show an early PSM prefix edit invalidating later suffix KV, while a supported suffix-first SPM keeps earlier suffix KV. Queue, network and paint are excluded." />
  <figcaption>The two service timelines use one millisecond scale and retain the same 24 ms decode span. A hit removes matching prefill work, under compatible scope and token-prefix identity. The order strips show why an early prefix edit invalidates later PSM states; suffix-first preservation needs a supported SPM adapter. Queue, network, and paint are excluded.</figcaption>
</figure>

Use a cache key that enforces isolation as well as computation compatibility. The tuple below illustrates canonical prefix identity, distinct from vLLM's internal block-hash layout or raw KV tensors. The gateway supplies the security scope from authenticated identity and current policy; it must not trust a tenant or salt chosen by an arbitrary client. vLLM's `cache_salt` can isolate reuse between trust groups.[^vllm2026prefix]

<!-- leetllm: test, output=show -->
```python title="prefix-cache-contract.py"
from dataclasses import dataclass, replace

@dataclass(frozen=True)
class CacheKey:
    security_scope: str  # server-derived tenant/repo/access-policy epoch
    model_revision: str
    tokenizer_revision: str
    adapter_revision: str
    kv_layout: str       # dtype, position policy, and engine compatibility
    prefix_ids: tuple[int, ...]

same_scope = CacheKey("acme/repo-a/policy-7", "weights-3", "tok-3",
                      "no-adapter", "fp16-layout-1", (10, 20, 30))
cached = {same_scope: "kv-block-handle-7"}
other_tenant = replace(same_scope, security_scope="contoso/repo-a/policy-7")

assert cached.get(same_scope) == "kv-block-handle-7"
assert cached.get(other_tenant) is None
assert replace(same_scope, prefix_ids=(10, 20, 31)) not in cached
assert replace(same_scope, adapter_revision="adapter-2") not in cached
assert replace(same_scope, security_scope="acme/repo-a/policy-8") not in cached
print("same_scope_hit:", same_scope in cached)
print("cross_tenant_hit:", other_tenant in cached)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
same_scope_hit: True
cross_tenant_hit: False
```
<!-- leetllm: output:end -->

KV reuse is not response caching: sampling settings can change without changing prefix KV, whereas reusing a completed suggestion requires its full input, model, generation settings, and policy contract. Neither kind of cache bypasses current authorization or the editor's freshness gate.

```checkpoint
Why is prefix caching especially useful for a developer typing in one file?
---
Most consecutive requests share imports, class definitions, and earlier functions. Reusing cached KV blocks avoids recomputing the same prefix on every keystroke.
```

### Quantization

Code models may tolerate post-training <span data-glossary="quantization">quantization</span>, but re-check completion quality after compression. Relative to <span data-glossary="fp16">FP16</span>, 8-bit and 4-bit weights use half and one quarter of the raw weight payload. Scales, metadata, unquantized layers, KV cache, and temporary buffers reduce whole-model savings.[^gptq2023][^huggingface2026gptq]

Weight compression can help bandwidth-bound decode when the hardware has efficient kernels for that format. Actual traffic and speedup depend on kernel support and workload. Profile prefill and decode separately, and size memory for the admitted batch's KV states as well as weights.

GPTQ (a post-training method for generative pretrained transformers) compresses off-the-shelf weights without a full fine-tune. That's useful when you need a FIM model to fit a specific GPU, not when you want a new capability.

```checkpoint
What metric should you re-check after quantizing a code model?
---
Don't check throughput alone. Re-check acceptance rate, accepted-and-retained characters, syntax/error regressions, and latency percentiles by language and suggestion type.
```

---

## Debounce `r` and `o`; fire on `.`

Sending remote work for every edit of `is_allowed` floods the GPU with requests that will be stale before they return. The client has to decide when to request, when to wait, and when to cancel. Imagine requests for `r`, `o`, and `.` crossing in flight. Predict which response the editor may paint before following the request IDs through the diagram:

<figure>
  <img src="illustrations/_generated/snapshot_freshness_dark.png" alt="Ordered local handler state. Typing r, o and dot creates snapshots with request epochs 1, 2 and 3, document versions 1, 2 and 3 and caret offsets 1, 2 and 3 under policy epoch 7. The first two 150 ms debounce tasks are canceled. Only request 3 is sent, immediately. A paint gate checks both request epoch and the entire editor snapshot: completion-3 paints, while late epoch 2 is dropped. A cursor move sets epoch 4, version 3 and selection (0,0), clears the ghost and sends nothing. Late epoch 3 drops; fresh at epoch 4 paints. Policy 7 to 8 sets epoch 5, clears the ghost, and sends nothing. Tab checks freshness and requires a version-checked insertion." />
  <figcaption>Request epoch e, document version v, and policy epoch p track distinct application state. The caret is a collapsed selection range. Each change invalidates, clears, and cancels pending work; only the qualified trigger sends immediately. Paint and Tab insertion both require matching document version, caret selection, policy epoch, and request epoch.</figcaption>
</figure>

### Debouncing and cancellation

For the cancellation demonstration, use a dynamic debounce:
- 0 ms delay on trigger characters such as `.`, `(`, and `\n`.
- 150 ms delay on ordinary typing.

With a 150 ms debounce, only 50 ms remain under the earlier 200 ms edit-to-paint allocation. Choose a production debounce from an end-to-end latency budget. Invalidate the epoch immediately on every document, cursor, selection, or policy change, even when no replacement request will be sent. Clear visible ghost text too. VS Code's provider receives a document, position, completion context, and cancellation token; the client still needs to validate its application state when asynchronous work finishes.[^vscodeInlineApi2026]

This local test covers cancelled debounce tasks, an explicitly delivered late response, a cursor-only move, and a change between paint and acceptance. It uses no HTTP service:

<!-- leetllm: test, output=show -->
```python title="debouncing-and-cancellation.py"
import asyncio
from dataclasses import dataclass

@dataclass(frozen=True)
class Snapshot:
    document: str
    version: int
    selection: tuple[int, int]  # Character index tuple (start, end)
    policy_epoch: int

class RequestManager:
    def __init__(self):
        self.pending_task: asyncio.Task[None] | None = None
        self.epoch = 0
        self.snapshot: Snapshot | None = None
        self.ghost: tuple[int, Snapshot, str] | None = None
        self.trigger_chars = {'.', '(', '\n'}
        self.sent_requests: list[int] = []
        self.shown_suggestions: list[str] = []

    def on_change(self, snapshot: Snapshot, char: str | None = None) -> None:
        self.epoch += 1
        self.snapshot = snapshot
        self.ghost = None
        if self.pending_task and not self.pending_task.done():
            self.pending_task.cancel()
        if char is None:  # cursor/policy change: invalidate without requesting
            return
        delay_sec = 0.0 if char in self.trigger_chars else 0.15
        self.pending_task = asyncio.create_task(
            self.debounce_fetch(delay_sec, self.epoch, snapshot)
        )

    async def debounce_fetch(self, delay: float, epoch: int, snapshot: Snapshot) -> None:
        try:
            await asyncio.sleep(delay)
            self.sent_requests.append(epoch)
            self.handle_response(epoch, snapshot, f"completion-{epoch}")
        except asyncio.CancelledError:
            return

    def handle_response(self, epoch: int, snapshot: Snapshot, suggestion: str) -> None:
        if epoch == self.epoch and snapshot == self.snapshot:
            self.ghost = epoch, snapshot, suggestion
            self.shown_suggestions.append(suggestion)

    def accept(self) -> str | None:
        if self.ghost is None:
            return None
        epoch, snapshot, suggestion = self.ghost
        self.ghost = None
        if epoch != self.epoch or snapshot != self.snapshot:
            return None
        return suggestion  # real editor applies a version-checked edit atomically

async def demo() -> None:
    manager = RequestManager()
    tasks = []
    for version, char in enumerate('ro.', 1):
        snapshot = Snapshot("handler.py", version, (version, version), 7)
        manager.on_change(snapshot, char)
        tasks.append(manager.pending_task)
    await asyncio.gather(*tasks, return_exceptions=True)
    manager.handle_response(2, snapshot, "late-completion-2")
    assert manager.ghost is not None
    manager.on_change(Snapshot("handler.py", 3, (0, 0), 7))
    manager.handle_response(3, snapshot, "late-after-cursor-move")
    assert manager.accept() is None
    current = manager.snapshot
    assert current is not None
    manager.handle_response(manager.epoch, current, "fresh")
    manager.on_change(Snapshot("handler.py", 3, (0, 0), 8))
    assert manager.accept() is None  # policy changed after paint
    assert manager.sent_requests == [3]
    assert manager.shown_suggestions == ["completion-3", "fresh"]
    print("sent_requests:", manager.sent_requests)
    print("shown_suggestions:", manager.shown_suggestions)

asyncio.run(demo())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sent_requests: [3]
shown_suggestions: ['completion-3', 'fresh']
```
<!-- leetllm: output:end -->

Propagate an abort to the server's queued or running request, but don't assume closing a connection instantly stops GPU work. Bound deadlines and output length, account for work already executed, and discard late chunks. Check freshness again when Tab applies the edit, using the editor's atomic version/range contract. A render-time check alone leaves a race before insertion.

```checkpoint
Why do you need both HTTP cancellation and request-ID gating?
---
Cancellation can save work. Snapshot/epoch gating protects the editor even when cancellation races or is ignored. It must cover cursor and policy changes without new requests, and run again at acceptance.
```

### Ghost text, not a second product

The inline surface is ghost text: a suggestion at the cursor.[^vscode2026inlinecompletion] A client may keep a remainder when typed characters match, but only by explicitly rebasing it to the new document version and range. Otherwise invalidate it. A comment such as `// validate token scopes against the policy graph` can still trigger an inline completion, with a natural-language prefix.

Repo-wide questions and test generation belong on the slower agent path, not on `is_allowed =`. Mixing them into the keystroke SLO is how teams accidentally build a chat product with ghost-text cosmetics.

---

## Did `is_allowed =` actually help?

A developer can accept a whole suggestion, take just a word or line, or ignore it. Copilot supports partial acceptance, so a binary accept event hides how much text was actually inserted.[^github2026CopilotPartialAcceptance] A four-character accept that gets deleted still counts as an accept. Suppose a new model raises acceptance while developers delete more generated code. Which release improved the product? Hold that question while the figure separates inserted text from retained text.

A useful scoreboard measures how often suggestions appear, how often they're inserted, how much of that inserted text survives, and whether the path still meets its latency objective. Split those metrics by language, suggestion class, and traffic period or a model regression hides inside an aggregate.

<figure>
  <img src="illustrations/_generated/quality_metrics_dark.png" alt="Four distinct shown suggestion objects share a 0 to 42 character scale. A inserts 18 and retains zero, so its entire 18-character span is hatched as deleted. B inserts and retains 4. C inserts 42, with 35 retained and 7 deleted. D is shown but inserts and retains zero, so it paints no span. Three of four shown suggestions have any acceptance, or 75 percent. Thirty-nine of 64 inserted characters remain, or 60.9375 percent. Partial accepts count one suggestion ID; unobserved windows are censored." />
  <figcaption>All four suggestions were shown, including D with no insertion. A is fully deleted, B remains, and C retains 35 of 42 characters. Three accepted IDs give 75%, while 39/64 inserted characters give 60.9375% retention. Partial accepts count one suggestion ID; unobserved retention windows are censored, and retained code still needs correctness review.</figcaption>
</figure>

| Metric | Definition | Why it matters |
|--------|------------|----------------|
| **Acceptance Rate** | % of distinct shown suggestions with any inserted text; report full acceptance separately. | An early-2022 Copilot study reported 27% acceptance and found acceptance rate most correlated with perceived productivity among its usage metrics. Treat this historical observational association as context for measurement design; estimate current productivity effects with a study of your own deployment.[^ziegler2022CopilotProductivity] |
| **Accepted-and-retained characters** | Characters from accepted suggestions that still remain after a chosen observation window. | Detects inserted text later removed. The study also measured unchanged and mostly unchanged completion persistence, but acceptance was its stronger productivity correlate. Use retention as a complementary editing signal and pair it with correctness checks.[^ziegler2022CopilotProductivity] |
| **Completion Shown Rate** | % of eligible requests that surface a suggestion. | A model that abstains too often won't feel helpful even if the few suggestions it shows are accurate. |
| **Latency p95 / p99** | Percentiles of complete edit-to-usable-suggestion traces, with the population stated. | Also report timeouts, stale drops, and shown rate so missing responses don't disappear from the scorecard. |

Offline evaluation on benchmarks like HumanEval[^chen2021] is useful for catching model regressions, but it doesn't measure editor timing, shown-rate policy, or accepted edits that users later undo. An online experiment is needed to determine whether a model or context heuristic improves the product experience.

Optimizing solely for acceptance rate can lead to a model that only suggests short, obvious tokens like closing parens because they are safe. You need value metrics such as retained characters, not click-through alone.

The metric computation should retain that distinction. This synthetic cohort has one row per distinct shown suggestion, three with accepted text and two with surviving characters. `accepted_chars` counts only text actually inserted, including a partial accept. Repeated word-by-word accepts of the same shown suggestion must not become several accepted suggestions. Size alone can't tell whether either edit was useful or correct. This calculation tracks character counts; production telemetry must choose a consistent unit and observation window:

<!-- leetllm: test, output=show -->
```python title="measure-retained-completions.py"
suggestions = [
    {"shown": True, "accepted_chars": 18, "retained_chars": 0},
    {"shown": True, "accepted_chars": 4, "retained_chars": 4},
    {"shown": True, "accepted_chars": 42, "retained_chars": 35},
    {"shown": True, "accepted_chars": 0, "retained_chars": 0},
]

def metrics(events):
    for item in events:
        assert 0 <= item["retained_chars"] <= item["accepted_chars"]
        assert item["shown"] or item["accepted_chars"] == 0
    shown = sum(item["shown"] for item in events)
    accepted = sum(item["accepted_chars"] > 0 for item in events)
    inserted = sum(item["accepted_chars"] for item in events)
    retained = sum(item["retained_chars"] for item in events)
    return (accepted / shown if shown else None,
            retained / inserted if inserted else None)

acceptance_rate, retained_char_rate = metrics(suggestions)
assert metrics([]) == (None, None)
assert metrics([suggestions[-1]]) == (0.0, None)
assert acceptance_rate == 0.75
assert round(retained_char_rate, 3) == 0.609
print("acceptance_rate:", f"{acceptance_rate:.0%}")
print("retained_char_rate:", f"{retained_char_rate:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
acceptance_rate: 75%
retained_char_rate: 60.9%
```
<!-- leetllm: output:end -->

```checkpoint
A developer takes four words from one shown suggestion through four partial-accept actions. How many accepted suggestions should the rate count?
---
One distinct shown suggestion with accepted text. Count all inserted characters separately, observe their retention, and distinguish partial from full acceptance. Counting four suggestions would inflate the numerator without four shown suggestions in the denominator.
```

For an offline completion set, freeze the buffer at a real edit point, hide the target insertion, and retrieve only files available at that point. Split by repository and time where possible to avoid near-duplicate leakage. Test whether the reconstructed file parses and whether relevant tests pass inside an isolated, no-secret execution environment. Exact-string match penalizes valid alternatives; add explicit policy checks for safety-sensitive behavior.

For an online experiment, randomize at a stable user or workspace boundary, hold trigger and display policy fixed, and compare eligible, requested, shown, accepted, and retained counts. Count cancellation, timeout, stale-drop, and error rates alongside latency; a low p95 among the few responses shown can hide a failing service. Treat unobserved retention windows as censored, not automatically deleted. Track retained characters locally where possible rather than uploading source to compute them.

Tie release metrics to language and suggestion-class slices. Investigate queueing and cache behavior when latency regresses, and model/context changes when quality falls. Use predefined rollback guardrails with enough observations, not one noisy percentile. Keep a last known-good route for each slice.

---

## Routing by suggestion size

A more capable model can write a better function body and still lose if it arrives after the developer has moved on. A fast model that emits the wrong API also fails.

Start by evaluating a smaller FIM-trained checkpoint for the keystroke path; measure its speed and accuracy. The Qwen2.5-Coder report documents FIM training, file-level formatting, and repository markers, making it an example of the required interface rather than a current model recommendation.[^qwen352024] A larger model or distilled model is another candidate, subject to the same measured constraints.

Don't assume parameter count predicts editor usefulness. Measure TTFT, acceptance, and retained characters on the actual trigger mix.

How much to generate is a separate routing decision. A single extra token after `.` and an empty function body have different requirements. For this design, assign separate scenario targets:

| Trigger | Suggestion Type | Scenario p95 objective |
|---------|----------------|----------------|
| Mid-expression (after `.`, `(`) | Type-informed local suggestion first | 60 ms |
| End of line | Single line completion | 200 ms |
| After function signature | Multi-line body | 500 ms |
| Empty line in a function | Multi-line block | 500 ms |

A lightweight client classifier can pick the request class before sending remote work. The dispatch logic makes policy denial override remote routing even for a multiline request. Only the actual boolean `True` permits the remote lane; malformed or missing policy values keep the buffer local. The gateway must independently enforce that policy; client classification is not authentication.

<!-- leetllm: test, output=show -->
```python title="route-completion-request.py"
def route(trigger: str, after_signature: bool, *,
          semantic_available: bool = True, remote_permitted: bool = True) -> tuple[str, int]:
    if semantic_available and trigger in {".", "("}:
        return "LOCAL_SEMANTIC", 60
    if remote_permitted is not True:
        return "LOCAL_FALLBACK", 60
    if after_signature:
        return "REMOTE_MULTILINE", 500
    return "REMOTE_INLINE", 200

cases = [
    route(".", False),
    route("\n", True),
    route("r", False),
]
assert cases == [
    ("LOCAL_SEMANTIC", 60),
    ("REMOTE_MULTILINE", 500),
    ("REMOTE_INLINE", 200),
]
assert route(".", False, semantic_available=False) == ("REMOTE_INLINE", 200)
assert route("\n", True, remote_permitted=False) == ("LOCAL_FALLBACK", 60)
for unknown_policy in ("False", None, 1):
    assert route("\n", True, remote_permitted=unknown_policy) == ("LOCAL_FALLBACK", 60)
print("string False policy:", route("\n", True, remote_permitted="False"))
print("routes:", cases)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
string False policy: ('LOCAL_FALLBACK', 60)
routes: [('LOCAL_SEMANTIC', 60), ('REMOTE_MULTILINE', 500), ('REMOTE_INLINE', 200)]
```
<!-- leetllm: output:end -->

A Python string `"False"` is truthy. A gate using `if not remote_permitted` would choose the remote multiline lane for that value and could upload a buffer the configuration intended to keep local. The explicit `is not True` check treats it as unknown permission. Validate policy at its source too; this local choice still needs independent gateway enforcement.

<figure>
  <img src="illustrations/_generated/route_permission_dark.png" alt="Client routing first keeps dot or opening-parenthesis member completion local when semantic type information is available, with a scenario p95 objective of 60 ms. Other input or unavailable types reaches a literal remote_permitted is True gate. Unknown values string False, None and integer 1 route to local fallback 60 ms. Actual True allows remote routing: after a signature chooses multiline 500 ms, otherwise inline 200 ms. The gateway independently enforces authenticated access and upload policy; client classification is not authorization. Results still pass editor freshness before paint and Tab." />
  <figcaption>Available semantic completion takes priority for the exact triggers. Remote routing requires the literal boolean True; string "False", None, and integer 1 keep the unknown-permission cases local. The budgets are separate scenario p95 objectives. The gateway independently enforces access and upload policy.</figcaption>
</figure>

```checkpoint
Why route single-token and multi-line completions differently?
---
They have different budgets and quality needs. Single-token completions need ultra-low latency and exactness; multi-line blocks can spend more time for structure, tests, and style consistency.
```

---

## The fleet behind one keystroke

Code completion is a high-churn GPU workload: many requests die while the developer is still typing `is_allowed`. Provisioning has to protect the 200 ms objective during spikes and report average tokens per second as a separate throughput measure.

### GPU fleet management and load balancing

Route for latency, cache affinity, and isolation at the same time:

- Prefix-aware routing: Prefer an authorized instance with matching warm KV blocks when its queue permits. An overloaded warm instance can lose more time in queueing than a cooler instance spends on prefill; cache affinity isn't an unconditional pin.
- Geographic routing: Prefer an approved nearby region when residency and capacity allow. A 50 ms network round trip already consumes one quarter of the 200 ms objective.
- Model tiering: Smaller models for single-line completions, larger models for multi-line bodies.

<figure>
  <img src="illustrations/_generated/compatible_kv_prefix_dark.png" alt="A cached KV prefix handle is keyed by server-derived acme/repo-a/policy-7, weights-3, tok-3, no-adapter, fp16-layout-1, and exact prefix IDs 10,20,30. A next tokenized prompt matching every field permits KV reuse. Separate changed-field cases, contoso scope, last token 31, adapter-2 and policy-8, take full prefill. Reuse and full-prefill paths join the same decode step. Response caching and editor freshness remain separate guarantees." />
  <figcaption>Compare every compatibility field under gateway-derived security scope. Exact permitted token-prefix identity allows KV reuse; a changed field takes full prefill. Both paths decode. Response caching and editor freshness remain separate guarantees.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/cache_affinity_wait_dark.png" alt="Algebraic route reversal using the earlier assumed model-service times. Let q be cold-worker wait and delta be the extra warm-worker wait. Cold completes at q plus 96 ms; warm at q plus delta plus 35 ms. A shared plot of extra wait delta from 0 to 100 ms shows warm rising from 35 to 135, crossing cold 96 at delta 61. Warm is earlier below 61; cold is earlier above 61. Region, residency and isolation eligibility precede route choice, and editor freshness still gates output." />
  <figcaption>The curves are algebra from the assumed 35 ms warm and 96 ms cold model-service terms. Cold wait q cancels from the comparison: more than 61 ms of extra warm wait reverses the preference. Eligibility precedes choice, and either result still faces the editor freshness checks.</figcaption>
</figure>

#### Fleet sizing sketch

Count tokens, not "editors per GPU." Before calculating, estimate the surviving prefill load for 5,000 active editors. The cancellation rate and prefix-hit rate both change the answer, so one labeled peak-hour scenario is:

1. **5,000** editors actively typing in a region, not 50,000 idle sessions.
2. After debounce, about **0.4** remote requests per typing editor per second → 2,000 raw req/s.
3. **60%** cancelled before GPU admission → **800** requests that still need serving work. A cancel after admission still burns partial GPU time and belongs in utilization.
4. Every surviving request has **2,048** prompt tokens in this worksheet. **50%** are prefix-cache hits that skip **75%** of their prefill. Equal mean lengths in the hit and miss groups would give the same arithmetic.

Effective prefill rate is then `800 × 2048 × (0.50 × 0.25 + 0.50 × 1.0) = 1,024,000` tokens/s. With an assumed capacity of 20,000 effective prefill tokens/s per GPU, the quotient rounds up to 52. Use this as a prefill-only arithmetic envelope. Tokens require different work across sequence lengths, and the calculation leaves out decode, partial work on late cancellations, KV-memory capacity, load imbalance, failover, and headroom. Measure the mixed workload at the required latency before choosing a GPU count.

Now change only the length distribution. Keep 800 req/s, a 2,048-token overall mean, and a 50% request hit rate. Can you still multiply those averages? No: which requests hit matters.

| Synthetic distribution | Work on 400 hits/s (75% skipped) | Work on 400 misses/s | Remaining prefill | Worksheet GPUs |
|---|---|---|---|---|
| Both groups: 2,048 tokens | 204,800 tokens/s | 819,200 tokens/s | 1,024,000 tokens/s | 52 |
| Hits: 3,072; misses: 1,024 | 307,200 tokens/s | 409,600 tokens/s | 716,800 tokens/s | 36 |
| Hits: 1,024; misses: 3,072 | 102,400 tokens/s | 1,228,800 tokens/s | 1,331,200 tokens/s | 67 |

The aggregate mean and request hit rate are identical in all three rows. Sum each cohort's rate times its remaining prompt tokens, or measure uncached token work directly. A request-level hit rate alone doesn't give a token-weighted saving.

<!-- leetllm: test, output=show -->
```python title="size-completion-fleet.py"
import math

TYPING_EDITORS = 5_000
REQ_PER_EDITOR_PER_S = 0.4
CANCEL_BEFORE_GPU = 0.60
TOKENS_PER_REQUEST = 2_048
PREFIX_HIT_RATE = 0.50
PREFIX_SKIP_FRACTION = 0.75
GPU_PREFILL_TOK_PER_S = 20_000

raw_qps = TYPING_EDITORS * REQ_PER_EDITOR_PER_S
gpu_qps = raw_qps * (1 - CANCEL_BEFORE_GPU)
miss_or_partial = (1 - PREFIX_HIT_RATE) + PREFIX_HIT_RATE * (1 - PREFIX_SKIP_FRACTION)
prefill_tok_s = gpu_qps * TOKENS_PER_REQUEST * miss_or_partial
gpus = math.ceil(prefill_tok_s / GPU_PREFILL_TOK_PER_S)

assert raw_qps == 2_000
assert gpu_qps == 800
assert prefill_tok_s == 1_024_000
assert gpus == 52
print("gpu_qps:", gpu_qps)
print("prefill_tok_s:", int(prefill_tok_s))
print("busy_gpus:", gpus)

def prefill_load(cohorts):
    return sum(qps * tokens * (1 - skip) for qps, tokens, skip in cohorts)

long_hits = [(400, 3_072, 0.75), (400, 1_024, 0.0)]
long_misses = [(400, 1_024, 0.75), (400, 3_072, 0.0)]
for cohorts in (long_hits, long_misses):
    assert sum(qps for qps, _, _ in cohorts) == 800
    assert sum(qps * tokens for qps, tokens, _ in cohorts) / 800 == 2_048
assert prefill_load(long_hits) == 716_800
assert prefill_load(long_misses) == 1_331_200
print("long-hit prefill/GPU envelope:", int(prefill_load(long_hits)),
      math.ceil(prefill_load(long_hits) / GPU_PREFILL_TOK_PER_S))
print("long-miss prefill/GPU envelope:", int(prefill_load(long_misses)),
      math.ceil(prefill_load(long_misses) / GPU_PREFILL_TOK_PER_S))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
gpu_qps: 800.0
prefill_tok_s: 1024000
busy_gpus: 52
long-hit prefill/GPU envelope: 716800 36
long-miss prefill/GPU envelope: 1331200 67
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/token_weighted_fleet_dark.png" alt="Comparison of three completion workloads sharing an identical 50 percent cache hit rate and 2,048-token overall mean. Because cache misses require full prefill while hits skip 75 percent, workload demand ranges from 716,800 tokens per second (36 GPUs) when hits are long to 1,331,200 tokens per second (67 GPUs) when misses are long, proving that token volume, not request count, dictates fleet capacity." />
  <figcaption>All three cohorts share an identical 2,048-token overall mean and 50% request hit rate. Because KV cache hits bypass 75% of prefill compute while misses require 100%, required GPU capacity varies by 86% across workloads, demonstrating that autoscaling must monitor aggregate token volume rather than raw request counts.</figcaption>
</figure>

### Continuous batching

Waiting to fill a fixed batch can add queue delay before first-token work begins. Continuous batching allows requests to join and leave an active serving schedule. <span data-glossary="vllm">vLLM</span>[^kwon2023] supports optimized scheduling and uses <span data-glossary="pagedattention">PagedAttention</span> to manage KV-cache storage in blocks. <span data-glossary="hugging-face-tgi">TGI</span> also documents continuous batching, although Hugging Face now labels TGI maintenance mode and recommends newer engines such as vLLM or <span data-glossary="sglang">SGLang</span> for future work.[^huggingface2026tgi] More batching isn't automatically faster. Ask whether its saved GPU work outweighs added queueing at the inline p95. Tune batching against TTFT and throughput because higher utilization can still harm inline latency when queues grow.

### Cost economics

At scale, code completion is expensive because the IDE emits a steady stream of short-lived requests while the user is typing. The key design question isn't just cost per token. It's cost per useful suggestion.

- High churn: Many requests are cancelled before the user ever sees the output.
- Prefill-heavy workload: Much of the cost sits in reading context, not in generating long responses.
- Useful north-star metric: Track cost per accepted-and-retained suggestion, not cost per request alone.

Those controls can reduce wasted work, but aggressive abstention can also reduce usefulness, and cache-affinity routing can overload a warm shard. Compare cost and user outcomes together.

```checkpoint
What is a better cost metric than cost per request?
---
Cost per accepted-and-retained suggestion. Completion systems generate many cancelled or ignored requests, so request volume alone overstates useful value.
```

---

## What of this buffer may leave the laptop

`validate_token_scope` may sit next to proprietary source, configuration, and <span data-glossary="secrets-management">credentials</span> accidentally present in the buffer. The product has to say what may be uploaded, logged, or retained before the first remote call. Before trusting TLS or a cache setting, ask whether the policy still holds in prompt logs, GPU batches, and recovery paths.

A useful design begins with explicit contracts: which buffers may be uploaded, whether prompts can be logged or used for training, how long operational data is retained, and which controls prevent cross-tenant reuse.

### Data isolation

For an enterprise configuration that forbids code reuse across organizations, enforce <span data-glossary="tenant-isolation">tenant isolation</span> across request ingestion, telemetry, and caches:

- **No training on user code** is this design's contractual default. Disable downstream training exports and raw-prompt collection too; frozen inference weights do not enforce this policy.
- Prompt data retention: Define explicit, minimal retention policies. Enterprises often require no raw-code retention or short, auditable windows for operational logs.
- Tenant isolation: Prevent one organization's code context from leaking through another organization's cache, logs, or outputs. Shared GPU batches can be acceptable when the runtime preserves per-request state boundaries and <span data-glossary="observability">observability</span> keeps tenant scopes intact. Partition batches until runtime tests verify that boundary.

An allowlist enforces minimal telemetry for client events. Check proxy logs, exceptions, tracing, crash dumps, and third-party SDKs separately to assess end-to-end privacy. The implementation below accepts validated identifiers and a bounded latency bucket; arbitrary client-provided strings could contain source or secrets:

<!-- leetllm: test, output=show -->
```python title="apply-prompt-retention-policy.py"
def audit_record(request: dict[str, str]) -> dict[str, str]:
    record = {
        "tenant": request["tenant"],
        "model": request["model"],
        "latency_bucket": request["latency_bucket"],
    }
    return record

request = {
    "tenant": "acme-devtools",
    "model": "code-fim-v3",
    "latency_bucket": "100_to_200ms",
    "prompt": "API_TOKEN='secret-value'",
}
record = audit_record(request)

assert "prompt" not in record
print("audit_fields:", sorted(record))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
audit_fields: ['latency_bucket', 'model', 'tenant']
```
<!-- leetllm: output:end -->

### Secret redaction and upload controls

For enterprise usage, client-side redaction can reduce the chance that recognized secrets leave the developer's machine. <span data-glossary="regex">Regular-expression</span> and entropy-based scanners can catch some API keys, tokens, and passwords, while policy-based filters can mask selected identifiers before prompt construction. Scanners are incomplete, so redaction complements upload controls, restricted logging, access control, and incident response.

If a policy promises that matching secret patterns won't be uploaded, replacement must run before upload. The system replaces matched strings with placeholders such as `<API_KEY>` before constructing the remote prompt.

Don't automatically restore secrets into model-chosen output positions, even for a known placeholder: generated code could put the value into a log or an outbound request. Keep placeholders visible and require explicit local review, preferably replacing them with a secret-store lookup. A repository comment or retrieved file is untrusted model input, not authority to change upload policy, read another repository, or execute a tool.

<!-- leetllm: test, output=show -->
```python title="mask-known-secrets-before-upload.py"
import re

TOKEN = re.compile(r"demo_api_token_[A-Za-z0-9]+")

def redact(text: str) -> tuple[str, dict[str, str]]:
    if "<API_KEY_" in text:
        raise ValueError("placeholder collision detected in buffer")
    mapping: dict[str, str] = {}
    def replace(match: re.Match[str]) -> str:
        placeholder = f"<API_KEY_{len(mapping) + 1}>"
        mapping[placeholder] = match.group(0)
        return placeholder
    return TOKEN.sub(replace, text), mapping

prompt, local_mapping = redact("client = API('demo_api_token_abc123')")
assert "demo_api_token_" not in prompt
assert local_mapping["<API_KEY_1>"] == "demo_api_token_abc123"
assert redact("ordinary code")[0] == "ordinary code"
print("upload_prompt:", prompt)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
upload_prompt: client = API('<API_KEY_1>')
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/upload_redaction_boundary_dark.png" alt="Client-to-server security boundary for code completion prompt dispatch. Local redaction substitutes detected API tokens with placeholders before egress, retaining secret-to-placeholder mappings strictly inside client memory. The completion server and inference fleet receive only sanitized tokens and log allowlisted telemetry fields, preventing secret leakage into shared caches or server logs." />
  <figcaption>Redact identified secrets before prompt upload and retain reversible mappings strictly inside local client memory. Generated completions preserve placeholders for developer review rather than restoring raw secrets automatically, and outbound telemetry logs restrict fields to allowlisted execution metadata.</figcaption>
</figure>

```checkpoint
Why must secret redaction happen before prompt upload?
---
When policy forbids uploading known secret patterns, scanning before upload can keep matched values out of prompt logs, caches, batches, and model context. Test detector coverage against your secret formats and pair pre-upload scanning with runtime redaction and logging controls.
```

### On-premises deployment

Some enterprise policies prohibit sending source code to a shared external service. A product serving those customers may need private Virtual Private Cloud (VPC), self-hosted, or offline deployment options.

- Self-hosted models: Deploy suitable code models inside customer-controlled infrastructure. This changes trust boundaries, but still requires identity, network, logging, and supply-chain controls.
- Air-gapped environments: Support fully offline operation for classified environments. The context engine, model, and inference server all run locally.

### Public-code matching and the mastery gap

A completion can be locally useful and still be the wrong artifact to insert. Copilot-style products can check suggestions against publicly available code and then discard a match or attach a reference, depending on policy.[^github2026copilotcodesuggestions] That's one control for training-data regurgitation, not a license to skip review.

A separate risk is accepting code without understanding it. Suggestions can invent APIs, use deprecated calls, or introduce insecure behavior. Measure understanding through review and correctness checks; retention measures whether a suggestion remains in the edited code. Apply both checks to the authorization helper in this example.

```checkpoint
What ethical failure can happen even when completions are technically correct?
---
Developers may accept code they don't understand, miss security problems, or stop building debugging instincts. Product telemetry should reward retained useful edits, not blind acceptance.
```

---


## Common pitfalls

Treat these as diagnoses, not a release checklist. Start with the first user-visible symptom, isolate the stage or state that can cause it, change one lever, and compare the next measured slice. That sequence keeps a model-quality complaint from turning into blind serving work.

- Symptom: Suggestions appear after the user already typed past them.
  **Cause:** No real cancellation path, or UI trusts arrival order instead of request IDs.
  **Fix:** Abort when possible, invalidate on every relevant state change, and check the snapshot at paint and acceptance.

- Symptom: Completions are often exact but still feel unhelpful.
  **Cause:** System optimizes for raw acceptance with tiny safe suggestions.
  **Fix:** Track accepted-and-retained characters and shown rate, not acceptance alone.

- Symptom: Member completion is slower and less accurate after `.` than IDE autocomplete used to be.
  **Cause:** Every keystroke is routed to the LLM instead of keeping semantic lane for deterministic cases.
  **Fix:** Let parser or language server own exact symbol completion and reserve GPU work for open-ended spans.

- Symptom: Prefix caching hit rate stays low even though users edit the same file repeatedly.
  **Cause:** Routing breaks shard affinity, so matching prefixes miss the cached KV blocks.
  **Fix:** Inspect token-prefix stability, block eviction, compatible model/adapter state, and permitted cache scope before adding shard affinity.

- Symptom: Inserted code fights the code below the cursor.
  **Cause:** System ignores suffix context or uses left-to-right continuation where infill is required.
  **Fix:** Preserve suffix context and use the checkpoint's supported infill interface; verify that the generated span fits both boundaries.

- Symptom: Local scope is empty while the developer is mid-token, so every request ships the whole file.
  **Cause:** The client waits for a valid AST and gives up on incomplete buffers.
  **Fix:** Recover reliable syntax-node ranges from incomplete input. Use a parser or syntax-tree recovery path to determine enclosing scope; the backward scan only returns a nearby function header.

- Symptom: Model quality looks strong in offline code benchmarks but users still dislike the product.
  **Cause:** Benchmarks miss stale-response behavior, latency tails, abstention policy, and IDE interaction friction.
  **Fix:** Pair offline evals with online product metrics and real editor A/B tests.

---

## What to ship with

Code completion moves part of the work from typing to reviewing suggestions. A useful system gathers bounded context, reuses permitted computation, drops stale output, and measures whether retained edits justify the latency and the data you touched.

| Check | Pass when |
| :--- | :--- |
| Latency | Complete edit-to-paint traces meet the declared objective; debounce and failures remain visible |
| Context | Prefix, suffix, imports, then nearby files by overlap; no whole-repo dump |
| Infill | Supported infill interface exposes `(prefix, suffix)` before generating the middle |
| Serving | Speculative decoding and prefix reuse are gated on measured gain, not hope |
| Freshness | Every relevant state change invalidates old work; paint and acceptance both check the captured snapshot |
| Privacy | Upload, retention, training-use, cache isolation, and deployment match the contract |

Those same isolation and accounting checks become tenant-scoped in the next capstone, where many products share one GPU platform.

```mastery-quiz
[
  {
    "question": "A fresh serial allocation uses 10 ms client handling, 45 transport, 25 context, 70 queue/model through a usable span and 8 paint. Ordinary typing adds 60 ms debounce. Against a 200 ms edit-to-paint objective, which arithmetic and measurement statement follows?",
    "options": [
      "Immediate 158 ms; debounced 218 ms; measured p95 is established.",
      "Immediate 148 ms; debounced 208 ms; measured p95 remains unestablished.",
      "Immediate 158 ms; debounced 218 ms; measured p95 remains unestablished.",
      "Immediate 158 ms; debounced 198 ms; measured p95 is established."
    ],
    "answer": "Immediate 158 ms; debounced 218 ms; measured p95 remains unestablished.",
    "explanation": "Sum complete serial stages: 10+45+25+70+8=158. The same qualifying edit plus 60 debounce ends at 218 and exceeds 200. These supplied allocations contain no observed population from which to estimate p95."
  },
  {
    "question": "In the line ab😀cd, the caret follows the emoji. The editor counts UTF-16 units, the byte API counts UTF-8, and Python slices code points. Which Python/UTF-16/UTF-8 offsets and correct Python suffix follow?",
    "options": [
      "3 / 4 / 6; suffix cd.",
      "4 / 4 / 6; suffix d.",
      "3 / 3 / 6; suffix cd.",
      "3 / 4 / 5; suffix cd."
    ],
    "answer": "3 / 4 / 6; suffix cd.",
    "explanation": "The two ASCII characters plus one emoji give Python index 3, four UTF-16 units and six UTF-8 bytes. Convert the editor’s 4 to Python 3 before slicing to preserve cd; direct Python 4 loses c."
  },
  {
    "question": "A permitted FIM prompt has a 1200-token cap. Framing 50, preserved suffix 200, prefix 500 and authorized definitions 300 are fixed. One more authorized snippet has 250 tokens; a higher-scoring private file is denied by policy. Which admission fits the contract?",
    "options": [
      "Admit 250 snippet tokens; preserve suffix 200; exclude the denied file.",
      "Admit 250 snippet tokens; reduce suffix 100; exclude the denied file.",
      "Admit 150 snippet tokens; preserve suffix 200; include the denied file.",
      "Admit 150 snippet tokens; preserve suffix 200; exclude the denied file."
    ],
    "answer": "Admit 150 snippet tokens; preserve suffix 200; exclude the denied file.",
    "explanation": "The fixed permitted prompt uses 1050, leaving 150. Preserve the edit suffix and framing before filling that remainder. A ranking score cannot override authenticated access or upload policy."
  },
  {
    "question": "For one speculative position, target p=[0.1,0.6,0.3] and draft q=[0.4,0.4,0.2] share the same vocabulary. The draft proposes the first coordinate (index 0). What acceptance probability and rejection-correction distribution preserve the specified stochastic rule?",
    "options": [
      "Acceptance 1/4; correction [0.1,0.6,0.3].",
      "Acceptance 1/4; correction [0,2/3,1/3].",
      "Acceptance 2/5; correction [0,2/3,1/3].",
      "Acceptance 1; correction [0.4,0.4,0.2]."
    ],
    "answer": "Acceptance 1/4; correction [0,2/3,1/3].",
    "explanation": "The proposed entry has min(1,.1/.4)=1/4 acceptance. Positive p − q is [0,.2,.1]; normalizing gives [0,2/3,1/3]. Argmax agreement and confidence thresholds implement different rules."
  },
  {
    "question": "A response for file F/version 8/selection (10,10)/policy 4/epoch 55 is in flight. The user moves the caret to (12,12), making epoch 56, with no text edit or replacement request. The old response then arrives. Which paint/Tab action fits the unchanged-snapshot contract?",
    "options": [
      "Paint at selection 10; permit Tab because version 8 still matches.",
      "Paint at selection 12; permit Tab because policy 4 still matches.",
      "Discard before paint; keep Tab empty for that old response.",
      "Paint at selection 12; defer the snapshot comparison until Tab."
    ],
    "answer": "Discard before paint; keep Tab empty for that old response.",
    "explanation": "Cursor-only movement invalidates outstanding work and clears ghost text even without a new request. The captured selection and epoch differ, so the response fails before paint; acceptance must also check current state."
  },
  {
    "question": "Two otherwise eligible workers have equal base queue wait. Cold service costs 60 ms prefill plus 20 decode; warm costs 15 plus 20 but has 50 ms additional queueing. Which complete route totals, excluding equal components, are earlier?",
    "options": [
      "Cold 80 ms; warm 85 ms; choose cold.",
      "Cold 80 ms; warm 35 ms; choose warm.",
      "Cold 80 ms; warm 65 ms; choose warm.",
      "Cold 100 ms; warm 85 ms; choose warm."
    ],
    "answer": "Cold 80 ms; warm 85 ms; choose cold.",
    "explanation": "Cold is 60+20=80. Warm is 50+15+20=85, so extra queueing exceeds the 45 ms saved prefill. Cache affinity is a preference among eligible routes, not a command to ignore queue time."
  },
  {
    "question": "Five distinct shown suggestion IDs insert [10,20,0,8,0] characters and retain [4,20,0,0,0] original characters after completed observation windows. Repeated partial accepts still belong to their original ID. What acceptance and retained-character rates follow?",
    "options": [
      "4/5 accepted; 12/19 retained.",
      "3/5 accepted; 12/19 retained.",
      "3/5 accepted; 24/30 retained.",
      "4/5 accepted; 24/30 retained."
    ],
    "answer": "3/5 accepted; 12/19 retained.",
    "explanation": "Three shown IDs insert any text. Inserted characters total 38 and retained originals 24, so retention is 24/38=12/19. The five shown IDs and 38 inserted characters are different denominators; these editing rates establish no code correctness."
  },
  {
    "question": "A fresh worksheet has 6000 active editors at 0.5 requests/s; half cancel before admission. Of 1500 surviving requests/s, 600 hits have 1800 prompt tokens and skip 50% of prefill; 900 misses have 800 tokens. At an assumed 30000 effective prefill tokens/GPU-second, what load and prefill-only envelope follow?",
    "options": [
      "1,440,000 tokens/s; 48 worksheet GPUs.",
      "720,000 tokens/s; 24 worksheet GPUs.",
      "2,520,000 tokens/s; 84 worksheet GPUs.",
      "1,260,000 tokens/s; 42 worksheet GPUs."
    ],
    "answer": "1,260,000 tokens/s; 42 worksheet GPUs.",
    "explanation": "Hits contribute 600×1800×.5=540000; misses 900×800=720000. Total 1260000 divided by 30000 gives 42. The aggregate mean is 1200, but applying the request-weighted hit factor to that mean gives the wrong 1440000 when hit status and length are correlated. Decode and operational headroom remain excluded."
  },
  {
    "question": "An editor requests a remote completion for each of two test files. Both have upload permission. File A contains only connect('demo_api_token_fern82'). File B has the same call followed by the comment # expect <API_KEY_24>. The client recognizes the token in the call and reserves the prefix <API_KEY_ for its own replacements throughout the source. What should the client send for each request?",
    "options": [
      "For A, send the masked call. For B, send the masked call and its comment.",
      "For A, send the masked call. For B, send nothing.",
      "For A, send nothing. For B, send nothing.",
      "For A, send the masked call and its token mapping. For B, send nothing."
    ],
    "answer": "For A, send the masked call. For B, send nothing.",
    "explanation": "The client sends connect('<API_KEY_1>') for A. The mapping stays on the device because it contains the original token. Blocking both requests would discard A even though masking succeeds. In B, the comment already contains the reserved prefix. Choosing an unused number for the token would still leave that prefix in the input, so the scanner rejects B before it makes a copy. Both source files stay intact."
  },
  {
    "question": "An adapter requires its documented native PSM sentinels PRE, SUF and MID. A fresh file has prefix timeout = and suffix return timeout; the model returns middle limits.read_timeout(). Which prompt-order and edit pair follows that contract?",
    "options": [
      "PRE, suffix, SUF, prefix, MID; insert the returned middle into the hole.",
      "PRE, prefix, SUF, suffix, MID; insert the returned middle plus suffix.",
      "PRE, prefix, SUF, suffix, MID; insert the returned middle into the hole.",
      "PRE, suffix, SUF, prefix, MID; insert the returned middle plus suffix."
    ],
    "answer": "PRE, prefix, SUF, suffix, MID; insert the returned middle into the hole.",
    "explanation": "The declared PSM adapter exposes prefix and suffix before MID, then generates the middle. Return only limits.read_timeout() to the original hole, preserving return timeout in place. A supported SPM adapter is a different contract; duplicating the suffix or interpreting arbitrary marker-like source text as sentinels changes this one."
  }
]
```

> **Next:** Continue to [Multi-Tenant LLM Platform](/learn/design-multi-tenant-llm-serving-platform). You now have one product path that reuses a prefix cache only inside a tenant, model, and tokenizer key, and that drops stale work before it hits the editor. Next you'll put many of those specialized models on shared GPUs and keep isolation, quotas, cost attribution, and canary rollouts honest when the fleet is no longer dedicated.
