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
    "prompt-injection-defense-strategies",
    "llm-deployment-gpu-serving-autoscaling",
    "speculative-decoding",
    "kv-cache-paged-attention-llm-serving",
    "continuous-batching-request-scheduling",
    "positional-encoding-rope-alibi"
  ],
  "relatedQuestions": [
    "design-multi-tenant-llm-serving-platform",
    "code-generation-agents-sandboxing",
    "agentic-architectures-react-plan-execute",
    "agent-evaluation-benchmarks",
    "function-calling-tool-use-llms"
  ],
  "section": "AI System Design & Interviewing",
  "order": 1
}
---

A developer types `is_allowed =`, pauses, and keeps typing `graph.`. Half a second later, a remote suggestion computed for the earlier buffer arrives. Accepting it corrupts working code. Even a brilliant completion fails when it arrives behind the cursor.

Code completion runs against moving editor state. Tools such as GitHub Copilot split this into dimmed ghost text at the cursor and next-edit suggestions elsewhere in the file.[^github2026copilotcodesuggestions] Inline generation uses <span data-glossary="fill-in-the-middle">fill-in-the-middle (FIM)</span> to condition on prefix and suffix, while coding agents run off the keystroke clock.

Targeting **200 ms <span data-glossary="p95-latency">p95</span> <span data-glossary="slo">SLO</span>** for single-line inline completions drives every decision: keep exact lookups local, ship compact suffix-preserving context, reuse <span data-glossary="kv-cache">KV cache</span> blocks across keystrokes, and drop stale replies before paint.

<figure>
  <img src="illustrations/_generated/code_completion_dark.png" alt="Editor snapshot routing local lookups and remote FIM through freshness checks." />
  <figcaption>Exact lookups stay local, open spans call remote FIM if allowed, and freshness checks guard paint and Tab.</figcaption>
</figure>

## One cursor, five lanes

Five lanes apply at different keystrokes in `validate_token_scope`:

| Lane | Input | Best for |
| :--- | :--- | :--- |
| **Lexical** | `Polic` | Local identifiers and keywords |
| **Semantic** | `graph.` | Exact members from the language server |
| **Inline generation** | `is_allowed =` | Open expression matching `return is_allowed` |
| **Next-edit** | Accepted edit | Follow-up change elsewhere in the file |
| **Coding agent** | Repo + tests | Multi-file patches off the keystroke clock |

### Lexical and semantic first

A local prefix index completes `PolicyGraph` in milliseconds; after `graph.`, the language server returns exact typed members (falling back to local lexical matches when types are unknown).

### Inline generation for an open-ended span

An empty assignment `is_allowed =` has no symbol-table answer; generating a matching boolean expression needs imports and `return is_allowed` below, earning the 200 ms remote FIM call.

### Agents stay off the keystroke clock

Coding agents search repos, run tests, and build multi-file patches.[^github2026copilotcloudagent] Mixing that loop into inline completion breaks the 200 ms ghost-text clock.

## The keystroke budget

Measure end-to-end latency from qualifying edit to fresh paint (debounce, parse, context, network, server wait, prefill, visible decode, render), tracking client <span data-glossary="ttft">TTFT</span> separately so transport and queue wait are not double-counted.

An immediate <span data-glossary="gpu">GPU</span>-backed request (0 ms debounce) spends 183 ms across five serial stages (17 ms headroom): **12 ms** client parse, **55 ms** network RTT, **28 ms** context assembly, **78 ms** queue + model service, and **10 ms** UI render. Adding 150 ms debounce reaches 333 ms, requiring tighter debounce, local completions, or a pause-to-suggestion target.

> **Common mistake:** Summing stage p95 values to estimate end-to-end p95. Tail spikes hit different requests, so always compute p95 over whole traces.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="latency-budget-check.py"
import math, numpy as np

total = sum([12, 55, 28, 78, 10])
p95 = lambda a: float(np.sort(a)[math.ceil(0.95 * len(a)) - 1])
traces = np.array([(100, 1), (1, 100)] + [(1, 1)] * 18)
print(f"immediate={total}ms headroom={200 - total}ms debounced={total + 150}ms")
print(f"whole_p95={p95(traces.sum(axis=1)):.0f}ms vs sum_stage_p95={p95(traces[:, 0]) + p95(traces[:, 1]):.0f}ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
immediate=183ms headroom=17ms debounced=333ms
whole_p95=101ms vs sum_stage_p95=2ms
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/edit_to_paint_budget_dark.png" alt="183 ms immediate and 333 ms debounced timelines beside 101 ms whole-trace versus 2 ms summed p95." />
  <figcaption>Immediate stages sum to 183 ms (333 ms with 150 ms debounce). Always compute p95 on complete traces.</figcaption>
</figure>

## Who owns the `is_allowed =` keystroke

Three components cooperate: the IDE extension (snapshots, cancellation), the context engine (allowed snippet packing), and the inference server (<span data-glossary="continuous-batching">continuous batching</span>). The Language Server Protocol (LSP) powers semantic lookup,[^microsoft2026lsp] while Tree-sitter recovers partial syntax trees around half-typed lines.[^treeSitter2026]

### Local fallback lane

Keep deterministic local lookups for instant offline response: language-server members on `.`/`(`, prefix tries, and fuzzy typo matching. Avoid two client bugs: use syntax-node ranges instead of backward `def ` text scans (which cross dedents), and convert coordinates before slicing because VS Code counts UTF-16 code units, Python indexes code points, and byte APIs count UTF-8 bytes.[^vscode2026EditorSnapshotApi] After the emoji in `a😀b`, Python index `2` is UTF-16 offset `3` and UTF-8 byte `5`; slicing Python at `3` drops `'b'`.

<figure>
  <img src="illustrations/_generated/editor_position_units_dark.png" alt="Caret after emoji in a😀b aligned at Python 2, UTF-16 3, and UTF-8 byte 5." />
  <figcaption>Convert UTF-16 editor positions to native indices before slicing so non-BMP characters never corrupt the suffix.</figcaption>
</figure>

## Context gathering and management

Long <span data-glossary="prefill">prefills</span> miss 200 ms even on 128k <span data-glossary="context-window">context windows</span>. Cap inline prompts around 8,000 tokens (including FIM sentinels) with output reserved separately.

### Context priority strategy

Filter candidate files by upload permissions *before* ranking. Reserve framing and a minimum suffix slice first so greedy prefix packing never erases code below the cursor: (1) prefix before cursor, (2) reserved suffix, (3) referenced imports/definitions, (4) recently edited files, (5) neighboring files.

### Fill-in-the-middle (FIM)

FIM reorders prefix and suffix with checkpoint-specific sentinels so the causal decoder reads both boundaries before generating the hole:

$$
P_{\text{FIM}} = \texttt{<PRE>} + x_{\text{prefix}} + \texttt{<SUF>} + x_{\text{suffix}} + \texttt{<MID>}
$$

Emit sentinel token IDs from the adapter and encode user code strictly as text tokens so comments containing `<MID>` cannot hijack framing. Insert only the generated middle span back into the hole.

<figure>
  <img src="illustrations/_generated/fim_prompt_dark.png" alt="Prefix and suffix spans reordered into PRE, prefix, SUF, suffix, MID prompt layout." />
  <figcaption>Prefix-Suffix-Middle (PSM) exposes code below the cursor before generating the middle span.</figcaption>
</figure>

FIM pretraining splits documents into `(prefix, middle, suffix)` under causal next-token loss.[^bavarian2022] **PSM** (`<PRE>prefix<SUF>suffix<MID>middle`, used by Qwen2.5-Coder[^qwen352024]) invalidates suffix KV blocks whenever the prefix changes; **SPM** (`<PRE><SUF>suffix<MID>prefixmiddle`) keeps suffix KV warm while typing in the prefix.[^bavarian2022]

```text
<PRE>from authz.rules import PolicyGraph
def validate_token_scope(request):
    is_allowed = <SUF>
    return is_allowed
<MID>
```

### Repository-level context

Index asynchronously outside the 28 ms budget using **Jaccard symbol overlap**, **<span data-glossary="bm25">BM25</span> / <span data-glossary="sparse-retrieval">sparse retrieval</span>**,[^robertson2009] or precomputed <span data-glossary="vector">vector</span> search (with <span data-glossary="reranker">reranking</span> only if it fits 28 ms).

<!-- leetllm: test, output=show -->
```python title="select-nearby-context.py"
active = {"PolicyGraph", "ScopeRule", "TokenClaims"}
files = {
    "scope_rules.py": {"ScopeRule", "TokenClaims", "AccessEvent"},
    "metrics.py": {"Counter", "Histogram"},
    "policy_graph.py": {"PolicyGraph", "Node"},
}
ranked = sorted(((len(active & s) / len(active | s), p) for p, s in files.items()), reverse=True)
print("selected:", [(p, round(sc, 2)) for sc, p in ranked if sc >= 0.25])

def alloc(cap: int, frame: int, suf_min: int, pre: int, ret: int) -> dict[str, int]:
    rem = max(0, cap - frame)
    suf = min(suf_min, rem); rem -= suf
    p = min(pre, rem); rem -= p
    return {"frame": frame, "suffix": suf, "prefix": p, "retrieval": min(ret, rem)}

print("tokens:", alloc(8000, 100, 1200, 4800, 3000))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
selected: [('scope_rules.py', 0.5), ('policy_graph.py', 0.25)]
tokens: {'frame': 100, 'suffix': 1200, 'prefix': 4800, 'retrieval': 1900}
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/authorized_context_selection_dark.png" alt="Jaccard scores across allowed files next to an 8,000-token prompt reserving suffix first." />
  <figcaption>Rank only upload-permitted files; suffix reservation keeps 1,200 tokens intact before retrieval.</figcaption>
</figure>

## Model serving for low latency

Profile queueing, prefill, and decode separately: prefix caching cuts prefill, speculative decoding accelerates decode, and quantization relieves memory bandwidth.

### Speculative decoding

A small draft model proposes $K$ tokens and the target verifies all $K$ in one parallel pass.[^leviathan2023][^vllm2026spec]

<figure>
  <img src="illustrations/_generated/speculative_decode_dark.png" alt="Five draft tokens verified in parallel, accepting four and correcting the fifth." />
  <figcaption>Parallel verification accepts four draft tokens and resamples the fifth to match target distribution p.</figcaption>
</figure>

To preserve target distribution $p(x)$ from draft $q(x)$, accept $x$ with probability $\alpha(x) = \min(1, p(x)/q(x))$, and on first rejection resample from:

$$
p'(x) = \frac{\max(0, p(x) - q(x))}{\sum_v \max(0, p(v) - q(v))}
$$

All-$K$ acceptance adds a $(K+1)$-th bonus token, yielding expected tokens $\mathbb{E}[\text{tokens}] = (1 - \alpha^{K+1})/(1 - \alpha)$ at constant $\alpha$. Enable speculation per slice only when both mean accepted length and p95 latency improve.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="speculative-decoding-math.py"
import numpy as np

p, q = np.array([0.1, 0.6, 0.3]), np.array([0.4, 0.4, 0.2])
res = np.maximum(0.0, p - q); res /= res.sum()
etok = lambda a, k=5: (1.0 - a ** (k + 1)) / (1.0 - a)
slices = {"python_imports": (3.8, 178, 136), "sql_queries": (1.1, 169, 176)}
enabled = [k for k, (a, b, s) in slices.items() if a >= 2.0 and (b - s) >= 10]
print(f"accept={min(1.0, p[0]/q[0]):.3f} residual={np.round(res, 3).tolist()} E(0.8)={etok(0.8):.2f} enabled={enabled}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
accept=0.250 residual=[0.0, 0.667, 0.333] E(0.8)=3.69 enabled=['python_imports']
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/speculation_slice_gate_dark.png" alt="Qualification chart passing Python imports (3.8 tokens, 42 ms gain) and rejecting SQL (-7 ms)." />
  <figcaption>Qualify speculation per language slice: Python imports save 42 ms while SQL queries regress 7 ms.</figcaption>
</figure>

### KV cache reuse (prefix caching)

Automatic <span data-glossary="prefix-cache">prefix caching</span> reuses KV blocks for unchanged file headers so requests prefill only the delta while decode stays unchanged.[^vllm2026prefix] On a 1,280-token prompt sharing 1,200 cached tokens, cold prefill + decode takes `72 + 24 = 96 ms`, while a warm hit takes `11 + 24 = 35 ms`.

<figure>
  <img src="illustrations/_generated/prefix_cache_dark.png" alt="Cold miss 72+24=96 ms versus warm hit 11+24=35 ms over 1,200 cached tokens." />
  <figcaption>Prefix caching cuts prefill over shared tokens while 24 ms decode stays unchanged.</figcaption>
</figure>

Key KV blocks on gateway-derived security scope (such as vLLM `cache_salt`[^vllm2026prefix]), model/tokenizer/adapter revisions, KV layout, and exact prefix token IDs (not raw text). Sampling temperature changes keep prefix KV valid, unlike response caching.

<!-- leetllm: test, output=show -->
```python title="prefix-cache-key.py"
from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Key:
    scope: str; model: str; tok: str; adapter: str; layout: str; ids: tuple[int, ...]

base = Key("acme/repo-a/acl-7", "w3", "t3", "none", "fp16-v1", (10, 20, 30))
store = {base: "kv-7"}
for name, k in [
    ("same", base), ("other_tenant", replace(base, scope="contoso/repo-a/acl-7")),
    ("changed_id", replace(base, ids=(10, 20, 31))), ("other_adapter", replace(base, adapter="lora-2")),
    ("revoked_acl", replace(base, scope="acme/repo-a/acl-8")),
]:
    print(f"{name:14s}: {k in store}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
same          : True
other_tenant  : False
changed_id    : False
other_adapter : False
revoked_acl   : False
```
<!-- leetllm: output:end -->

### Quantization

Post-training <span data-glossary="quantization">quantization</span> (like GPTQ[^gptq2023][^huggingface2026gptq]) shrinks <span data-glossary="fp16">FP16</span> weights ~2x (8-bit) or ~4x (4-bit) before scale/KV overhead, speeding bandwidth-bound decode. Re-check syntax validity and retained characters because subtle precision loss breaks API names before perplexity moves.

## Debounce `r` and `o`; fire on `.`

Dispatching a remote request on every keystroke floods GPUs with completions that expire in flight.

<figure>
  <img src="illustrations/_generated/snapshot_freshness_dark.png" alt="Epochs 1, 2, 3 canceling r and o so dot fires immediately, and cursor moves rejecting late replies." />
  <figcaption>Every edit, cursor move, or permission change advances epoch, clears ghost text, and guards paint and Tab.</figcaption>
</figure>

### Debouncing and cancellation

Use **0 ms** delay on explicit triggers (`.`, `(`, `\n`) and **150 ms** during ordinary typing. Every edit, selection change, or permission change advances the epoch, clears ghost text, and cancels pending tasks even when no new call fires.[^vscodeInlineApi2026] Check snapshot and epoch at both paint and Tab acceptance, and propagate cancellations alongside server-side token/deadline caps.

<!-- leetllm: test, output=show -->
```python title="debouncing-and-cancellation.py"
import asyncio
from dataclasses import dataclass

@dataclass(frozen=True)
class Snap:
    doc: str; ver: int; sel: tuple[int, int]; acl: int

class Manager:
    def __init__(self) -> None:
        self.pending = self.snap = self.ghost = None
        self.epoch = 0; self.sent, self.shown = [], []

    def on_change(self, snap: Snap, ch: str | None = None) -> None:
        self.epoch += 1; self.snap, self.ghost = snap, None
        if self.pending and not self.pending.done():
            self.pending.cancel()
        if ch is not None:
            self.pending = asyncio.create_task(self._fetch(0.0 if ch in {".", "(", "\n"} else 0.15, self.epoch, snap))

    async def _fetch(self, delay: float, ep: int, snap: Snap) -> None:
        try:
            await asyncio.sleep(delay); self.sent.append(ep); self.on_reply(ep, snap, f"comp-{ep}")
        except asyncio.CancelledError:
            return

    def on_reply(self, ep: int, snap: Snap, text: str) -> None:
        if ep == self.epoch and snap == self.snap:
            self.ghost = (ep, snap, text); self.shown.append(text)

    def accept(self) -> str | None:
        g, self.ghost = self.ghost, None
        return g[2] if g and g[0] == self.epoch and g[1] == self.snap else None

async def main() -> None:
    m, tasks = Manager(), []
    for v, ch in enumerate("ro.", 1):
        s = Snap("h.py", v, (v, v), 7); m.on_change(s, ch); tasks.append(m.pending)
    await asyncio.gather(*tasks, return_exceptions=True)
    m.on_reply(2, s, "stale-2")
    m.on_change(Snap("h.py", 3, (0, 0), 7)); m.on_reply(3, s, "stale-move"); assert m.accept() is None
    m.on_reply(m.epoch, m.snap, "fresh"); m.on_change(Snap("h.py", 3, (0, 0), 8)); assert m.accept() is None
    print("sent:", m.sent, "shown:", m.shown)

asyncio.run(main())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sent: [3] shown: ['comp-3', 'fresh']
```
<!-- leetllm: output:end -->

### Ghost text, not a second product

Keep completions as lightweight ghost text at the cursor.[^vscode2026inlinecompletion] Typing characters matching the ghost prefix trims and rebases the remainder onto the new version; any mismatch clears it immediately.

## Did `is_allowed =` actually help?

Developers accept whole blocks, accept word-by-word, or dismiss.[^github2026CopilotPartialAcceptance] Optimizing raw acceptance rewards tiny punctuation; pair it with **retained characters** over a fixed window to expose suggestions deleted seconds later.

<figure>
  <img src="illustrations/_generated/quality_metrics_dark.png" alt="Four shown IDs: 3 accepted (75%), 39 of 64 inserted characters retained (60.9%)." />
  <figcaption>Multiple partial accepts count as one accepted ID (3/4 = 75%), while 39/64 inserted chars survive (60.9%).</figcaption>
</figure>

| Metric | Definition | Signal |
| :--- | :--- | :--- |
| **Acceptance rate** | Distinct shown IDs with any insertion | Early Copilot linked 27% acceptance to productivity.[^ziegler2022CopilotProductivity] |
| **Retained characters** | Inserted chars surviving the window | Catches plausible completions quickly deleted.[^ziegler2022CopilotProductivity] |
| **Shown rate** | Eligible triggers painting ghost text | Exposes overly timid models |
| **End-to-end p95/p99** | Whole-trace latency + timeout/drop rate | Stops surviving subsets hiding timeouts |

Pair offline suites (HumanEval[^chen2021] plus frozen-repo infill tests) with randomized online experiments, computing retention locally on the client and treating early-closed sessions as censored.

## Routing by suggestion size

Use a compact FIM model (such as Qwen2.5-Coder[^qwen352024]) for single-line keystrokes (**200 ms** p95), local semantic lookup on `.`/`(` (**60 ms**), and heavier models for post-signature multi-line bodies (**500 ms**). Require literal `remote_permitted is True` on the client (rejecting truthy strings like `"False"`), and verify upload rules independently at the gateway.

<figure>
  <img src="illustrations/_generated/route_permission_dark.png" alt="Router sending semantic triggers locally and requiring literal remote_permitted is True for remote lanes." />
  <figcaption>Semantic triggers stay local; remote lanes require literal True with independent gateway enforcement.</figcaption>
</figure>

## The fleet behind one keystroke

Completion traffic is high-churn and prefill-heavy: most calls cancel before paint, and demand spikes during regional work hours.

### GPU fleet management and load balancing

Balance **prefix-aware routing**, **geographic proximity** (50 ms RTT eats a quarter of 200 ms), and **model tiering** (isolating fast single-line from slow multi-line pools).

<figure>
  <img src="illustrations/_generated/compatible_kv_prefix_dark.png" alt="KV hit requiring exact scope, model, tokenizer, adapter, layout, and prefix token match." />
  <figcaption>KV reuse requires exact scope, model, tokenizer, adapter, layout, and prefix ID matches.</figcaption>
</figure>

At equal base queue wait $q$, extra warm wait $\Delta$, and service times $T_{\text{cold}}, T_{\text{warm}}$, the warm replica wins strictly when $\Delta < T_{\text{cold}} - T_{\text{warm}}$ (61 ms for 96 ms cold vs. 35 ms warm).

<figure>
  <img src="illustrations/_generated/cache_affinity_wait_dark.png" alt="Cold 96 ms flat line crossing rising warm service plus extra queue wait at 61 ms." />
  <figcaption>Once warm queue wait exceeds the 61 ms prefill savings, routing to a cold worker finishes faster.</figcaption>
</figure>

Size GPUs by **uncached token volume** summed per cohort: $\sum_i \lambda_i L_i (1 - s_i)$. With 5,000 editors sending 0.4 req/s (60% canceled pre-GPU -> 800 req/s), identical 50% hit rate and 2,048-token mean swing prefill GPUs by 86%:

<!-- leetllm: test, output=show -->
```python title="size-completion-fleet.py"
import math

GPU_TOK_S = 20_000
print(f"raw=2000 surviving=800 crossover_ms={96 - 35}")
for name, cohorts in {
    "uniform_2048": [(400, 2048, 0.75), (400, 2048, 0.0)],
    "long_hits":    [(400, 3072, 0.75), (400, 1024, 0.0)],
    "long_misses":  [(400, 1024, 0.75), (400, 3072, 0.0)],
}.items():
    tok = int(sum(q * l * (1 - s) for q, l, s in cohorts))
    print(f"{name:12s}: {tok:>9,d} tok/s -> {math.ceil(tok / GPU_TOK_S)} GPUs")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw=2000 surviving=800 crossover_ms=61
uniform_2048: 1,024,000 tok/s -> 52 GPUs
long_hits   :   716,800 tok/s -> 36 GPUs
long_misses : 1,331,200 tok/s -> 67 GPUs
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/token_weighted_fleet_dark.png" alt="Same 800 req/s and 50% hit rate requiring 36, 52, or 67 GPUs by hit length." />
  <figcaption>Identical QPS, mean length, and hit rate swing prefill capacity from 36 to 67 GPUs.</figcaption>
</figure>

### Continuous batching

Continuous batching with <span data-glossary="pagedattention">PagedAttention</span> (<span data-glossary="vllm">vLLM</span> or <span data-glossary="sglang">SGLang</span>, recommended over <span data-glossary="hugging-face-tgi">TGI</span>) lets short completions join/exit every step.[^kwon2023][^huggingface2026tgi] Cap concurrency against 200 ms p95.

### Cost economics

Track **cost per accepted-and-retained suggestion**, not cost per request, pairing cost wins with retention and shown-rate checks.

## What of this buffer may leave the laptop

Open buffers sit beside proprietary logic and <span data-glossary="secrets-management">credentials</span>; enforce privacy before tokens leave the laptop.

### Data isolation

Enforce <span data-glossary="tenant-isolation">tenant isolation</span> end to end: disable training exports by default, log only allowlisted metadata (scrubbing proxies and crash dumps), key KV caches by gateway-derived tenant scope, and verify GPU memory isolation across tenants.

### Secret redaction and upload controls

Scan buffers locally with <span data-glossary="regex">regex</span> and entropy checks before upload, replacing secrets with placeholders like `<API_KEY_1>` while keeping the map strictly in local memory. Never auto-restore raw secrets into generated output, and abort upload if the buffer already contains the reserved placeholder prefix.

<!-- leetllm: test, output=show -->
```python title="mask-known-secrets-before-upload.py"
import re

PAT = re.compile(r"demo_api_token_[A-Za-z0-9]+")

def redact(text: str) -> tuple[str, dict[str, str]]:
    if "<API_KEY_" in text:
        raise ValueError("reserved placeholder present")
    local: dict[str, str] = {}
    def sub(m: re.Match[str]) -> str:
        k = f"<API_KEY_{len(local) + 1}>"
        local[k] = m.group(0); return k
    return PAT.sub(sub, text), local

clean, smap = redact("client = API('demo_api_token_abc123')")
meta = {k: v for k, v in {"tenant": "acme", "model": "fim-v3", "bucket": "100_200ms", "prompt": clean}.items() if k != "prompt"}
print("upload:", clean, "| local:", list(smap), "| meta:", sorted(meta))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
upload: client = API('<API_KEY_1>') | local: ['<API_KEY_1>'] | meta: ['bucket', 'model', 'tenant']
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/upload_redaction_boundary_dark.png" alt="Client scanner masking secrets to placeholders locally and sending allowlisted metadata only." />
  <figcaption>Mask secrets locally before upload, keep maps on the client, and log allowlisted telemetry only.</figcaption>
</figure>

### On-premises deployment

Regulated teams forbidding multi-tenant cloud endpoints require private VPC hosting, customer-managed inference servers, or air-gapped local deployments.

### Public-code matching and the mastery gap

Optional public-code filters suppress verbatim matches or attach license references.[^github2026copilotcodesuggestions] Reviewing generated code remains essential so fluent completions do not smuggle subtle bugs or broken auth checks.

## Common pitfalls

- **Stale ghost text:** Advance epoch on edits, cursor moves, and permission changes; verify snapshot at paint and Tab.
- **High acceptance, low value:** Track retained characters and shown rate alongside acceptance.
- **Slow `.` lookup:** Keep deterministic members on the local language server.
- **Cold prefix cache:** Use queue-aware prefix affinity instead of random balancing.
- **Conflicts below cursor:** Reserve suffix tokens first and use native FIM sentinels.
- **Broken mid-line scope:** Use Tree-sitter recovery and convert UTF-16 editor offsets cleanly.

## What to ship with

| Dimension | Ship bar |
| :--- | :--- |
| **Latency** | Whole-trace edit-to-paint meets p95 with debounce and drops counted |
| **Context & infill** | Suffix reserved first inside cap; native FIM sentinels without source collision |
| **Serving & freshness** | Verified speculation/prefix wins; snapshot + epoch checked at paint and Tab |
| **Privacy** | Client redaction, allowlisted logs, tenant-scoped KV keys, gateway enforcement |

```mastery-quiz
[
  {
    "question": "Serial stages allocate 10 ms parse, 45 ms net, 25 ms context, 70 ms model, 8 ms paint; typing adds 60 ms debounce. Against 200 ms, what holds?",
    "options": [
      "158 ms / 218 ms; p95 proven <200 ms.",
      "148 ms / 208 ms; p95 needs whole-trace check.",
      "158 ms / 218 ms; p95 needs whole-trace check.",
      "158 ms / 198 ms; p95 proven <200 ms."
    ],
    "answer": "158 ms / 218 ms; p95 needs whole-trace check.",
    "explanation": "10+45+25+70+8 = 158 ms (+60 = 218 ms); static sums never prove whole-trace p95."
  },
  {
    "question": "In `ab😀cd`, caret is right after the emoji. What are (Python, UTF-16, UTF-8) offsets and Python suffix?",
    "options": ["3 / 4 / 6; `cd`.", "4 / 4 / 6; `d`.", "3 / 3 / 6; `cd`.", "3 / 4 / 5; `cd`."],
    "answer": "3 / 4 / 6; `cd`.",
    "explanation": "2 ASCII + 1 surrogate-pair/4-byte emoji = Python 3, UTF-16 4, UTF-8 6; slice at 3 keeps `cd`."
  },
  {
    "question": "FIM cap 1,200: 50 framing, 200 suffix, 500 prefix, 300 defs. One allowed snippet needs 250; a higher-scoring restricted file is blocked. What fits?",
    "options": [
      "250 snippet; suffix 200; exclude blocked.",
      "250 snippet; suffix 100; exclude blocked.",
      "150 snippet; suffix 200; include blocked.",
      "150 snippet; suffix 200; exclude blocked."
    ],
    "answer": "150 snippet; suffix 200; exclude blocked.",
    "explanation": "Fixed parts use 1,050 tokens leaving 150; preserve suffix and upload permissions."
  },
  {
    "question": "Target p=[0.1,0.6,0.3], draft q=[0.4,0.4,0.2], draft proposes index 0. Acceptance probability and rejection residual?",
    "options": ["1/4; [0.1,0.6,0.3].", "1/4; [0,2/3,1/3].", "2/5; [0,2/3,1/3].", "1; [0.4,0.4,0.2]."],
    "answer": "1/4; [0,2/3,1/3].",
    "explanation": "min(1, 0.1/0.4) = 1/4; max(0, p-q) = [0, 0.2, 0.1] normalizes to [0, 2/3, 1/3]."
  },
  {
    "question": "Reply for F v8 sel(10,10) epoch 55 is in flight. Caret moves to (12,12) (epoch 56, no edit/call). Old reply arrives. Action?",
    "options": [
      "Paint at (10,10).",
      "Paint at (12,12), check on Tab.",
      "Discard before paint; Tab empty.",
      "Paint at (12,12), text unchanged."
    ],
    "answer": "Discard before paint; Tab empty.",
    "explanation": "Caret movement advances epoch and invalidates old replies for both paint and Tab."
  },
  {
    "question": "Equal base wait: cold needs 60 ms prefill + 20 ms decode; warm needs 15 ms prefill + 20 ms decode + 50 ms extra wait. Which wins?",
    "options": ["Cold 80 vs warm 85 -> cold.", "Cold 80 vs warm 35 -> warm.", "Cold 80 vs warm 65 -> warm.", "Cold 100 vs warm 85 -> warm."],
    "answer": "Cold 80 vs warm 85 -> cold.",
    "explanation": "50 ms extra wait exceeds 45 ms prefill savings (80 ms < 85 ms)."
  },
  {
    "question": "Five shown IDs insert [10,20,0,8,0] chars and retain [4,20,0,0,0]. Acceptance and retention rates?",
    "options": ["4/5; 12/19.", "3/5; 12/19.", "3/5; 24/30.", "4/5; 24/30."],
    "answer": "3/5; 12/19.",
    "explanation": "3/5 shown IDs inserted text; 24/38 = 12/19 inserted chars survived."
  },
  {
    "question": "6,000 editors * 0.5 req/s, 50% cancel pre-GPU. Of 1,500 surviving: 600 hits (1,800 tok, 50% skipped) + 900 misses (800 tok) at 30,000 tok/GPU-s. Load and GPUs?",
    "options": ["1,440,000; 48.", "720,000; 24.", "2,520,000; 84.", "1,260,000; 42."],
    "answer": "1,260,000; 42.",
    "explanation": "600*900 + 900*800 = 1,260,000 tok/s / 30,000 = 42 GPUs."
  },
  {
    "question": "File A has `demo_api_token_fern82`. File B adds `# expect <API_KEY_24>` when `<API_KEY_` is reserved. Upload?",
    "options": ["Masked A and B.", "Masked A; block B.", "Block both.", "Masked A + map; block B."],
    "answer": "Masked A; block B.",
    "explanation": "File A masks cleanly with local-only map; File B collides with reserved prefix and aborts."
  },
  {
    "question": "In PSM FIM (`<PRE>prefix<SUF>suffix<MID>`), why insert only the generated middle and encode user code strictly as text tokens?",
    "options": [
      "To skip tokenizing the suffix.",
      "To avoid duplicating preserved boundaries or letting `<MID>` in comments hijack framing.",
      "To preserve suffix KV blocks after prefix edits.",
      "To run speculation without a draft model."
    ],
    "answer": "To avoid duplicating preserved boundaries or letting `<MID>` in comments hijack framing.",
    "explanation": "Inserting only the middle preserves existing prefix/suffix; text encoding stops literal sentinels from corrupting framing."
  }
]
```

> **Next:** Continue to [Multi-Tenant LLM Platform](/learn/design-multi-tenant-llm-serving-platform).
