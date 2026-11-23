---
{
  "id": "prefix-caching-prompt-caching",
  "title": "Prefix Caching and Prompt Caching",
  "slug": "prefix-caching-prompt-caching",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 4,
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "xAI",
    "NVIDIA"
  ],
  "shortDescription": "Reuse a shared guide's KV state across requests only when the token prefix, the stored entry, and the tenant all match.",
  "keyConceptsTested": [
    "KV reuse across requests",
    "Static-prefix prompt structure",
    "Implicit vs explicit cache breakpoints",
    "Provider prompt caching behavior",
    "Cache hit instrumentation",
    "Whitespace, serialization, and eviction invalidation traps",
    "Privacy and invalidation trade-offs"
  ],
  "prerequisites": [
    "kv-cache-paged-attention-llm-serving",
    "inference-mechanics-ttft-tps-kv-cache"
  ],
  "relatedQuestions": [
    "flashattention-memory-efficient-attention",
    "continuous-batching-request-scheduling",
    "semantic-caching-cost-latency-optimization",
    "design-production-rag-pipeline",
    "long-context-window-management",
    "scaling-llm-inference-batching-kv-cache"
  ],
  "coverImage": "illustrations/_generated/prefix_cache_dark.png"
}
---
<!-- leetllm: edition:reference:start -->
Three developers ask a coding assistant different questions about the same repository. Each request carries 6,000 shared tokens: 600 of instructions, a 4,200-token architecture guide, an 800-token tool schema, and 400 tokens of examples. The first question adds another 48 tokens. Should the model process that entire guide three times?

An available prefix cache can reuse the guide's previously computed state. Put a changing request ID before the guide, though, and the guide no longer has the same preceding context. The unchanged text is insufficient. Reuse also needs compatible model settings, an eligible matching prefix length, and the right sharing scope.

For ordinary full causal attention, prefix caching retains Key-Value (KV) state for an exact starting token sequence. The state can live in a GPU pool or another cache tier. Our idealized warm request reuses 6,000 tokens and freshly processes its 48-token question during <span data-glossary="prefill">prefill</span>. Standard KV caching retains state *inside* a request during decoding; prefix caching makes compatible state reusable *across* requests. A cache hit saves input work, not a previously generated answer.

The [previous KV-cache lesson](/learn/kv-cache-paged-attention-llm-serving) kept that state inside one generating request. The ledger below asks how many of those tokens a second request can skip, and what it still has to compute.

<figure>
  <img src="illustrations/_generated/prefix_cache_dark.png" alt="A proportional 6,000-position prefix contains 600 instruction, 4,200 repository-guide, 800 tool-schema, and 400 example positions. One cold request stores 375 complete 16-position KV blocks. Two warm questions reuse the prefix and compute tails of 37 and 51 positions. Across all three requests, fresh input work falls from 18,136 to 6,136, avoiding 12,000 repeated-prefix positions. An enlarged inset compares question tails of 48, 37, and 51 positions. Editing token zero causes a lookup miss while the old entry may remain stored." />
  <figcaption>The top rail shows the prefix proportions. The inset expands 48-, 37-, and 51-position question tails for comparison. One cold request and two warm requests compute 6,136 fresh positions in total, avoiding 12,000 repeated-prefix positions. Editing token zero causes a lookup miss while the old KV entry may remain.</figcaption>
</figure>

## Worked example: tracking tokens across cache hits

Suppose our coding assistant's shared prefix breaks down into four parts:

```text
system instructions: 600 tokens
repo guide:          4,200 tokens
tool schema:           800 tokens
few-shot examples:     400 tokens
```

Assume the first request has made its prefix available before the second arrives. Notice what request two can skip: it avoids recomputing the shared guide, but it still processes its own question and generates its own response. During a simultaneous cold burst, each request may need a warmup because a cache hit becomes available only after the write completes.

With the eligible entry available, the runtime reuses those 6,000 prefix tokens for requests two and three. New question tokens still attend to the cached guide; reuse does not remove the guide from the context.

Now place a changing `request_id` before the guide. Tokens before the changed ID may still match, including message wrappers. The guide after it cannot reuse state computed with a different ID. Moving the ID after the eligible guide prefix preserves more reusable work.

For questions of 48, 37, and 51 tokens, three cold requests freshly process 18,136 input tokens. One cold request followed by two full-prefix hits freshly processes 6,136, avoiding 12,000 repeated prefix-token computations. This worked breakdown assumes compatible settings, a qualifying 6,000-token prefix, and an available entry; exact FLOPs, billing, and latency depend on the serving stack.

<!-- leetllm: test, output=show -->
```python title="prefix-cache-hit-calculator.py"
shared_prefix_tokens = 6000
question_tails = [48, 37, 51]

total_fresh_without_cache = 0
total_fresh_with_cache = 0

for request_index, tail_tokens in enumerate(question_tails, start=1):
    fresh_without_cache = shared_prefix_tokens + tail_tokens
    fresh_with_cache = fresh_without_cache if request_index == 1 else tail_tokens
    reused_prefix = 0 if request_index == 1 else shared_prefix_tokens

    total_fresh_without_cache += fresh_without_cache
    total_fresh_with_cache += fresh_with_cache

    print(
        f"request {request_index}: reused_prefix={reused_prefix:4d} "
        f"fresh_tokens={fresh_with_cache:4d}"
    )

saved_tokens = total_fresh_without_cache - total_fresh_with_cache
print(f"fresh tokens without cache: {total_fresh_without_cache}")
print(f"fresh tokens with cache:    {total_fresh_with_cache}")
print(f"prefix tokens saved:        {saved_tokens}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
request 1: reused_prefix=   0 fresh_tokens=6048
request 2: reused_prefix=6000 fresh_tokens=  37
request 3: reused_prefix=6000 fresh_tokens=  51
fresh tokens without cache: 18136
fresh tokens with cache:    6136
prefix tokens saved:        12000
```
<!-- leetllm: output:end -->

```checkpoint
For the 6,000-token shared prefix example, which work is skipped on requests two and three?
---
The runtime skips repeated prefill computation for the identical 6,000-token prefix. It still processes each new user question and still decodes each answer token.
```

The `prefix tokens saved` count represents a work ledger, not a billing outcome. Provider write and read fees, cache retention lifetimes, and arrival rates determine whether the initial cache write pays for itself. Those savings also depend on how the inference engine indexes and stores those 6,000 tokens. What does a "match" actually hash under the hood?

## Two indexes, one causal dependency

During generation, a decoder-only <span data-glossary="transformer">transformer</span> stores keys and values for tokens it has already processed. When predicting token 501, it doesn't recompute attention keys and values for tokens 1 through 500. That's the normal <span data-glossary="kv-cache">KV cache</span>.

Retaining that state for generation doesn't by itself make it discoverable by the next incoming request.

With ordinary full causal attention, position $t$ attends only to positions $0 \dots t$. Appending a question doesn't change the prefix's ideal mathematical computation. Changing earlier tokens can change deeper-layer state for a later tools section even if the tools text stays identical. Compatibility includes weights, adapters, positions, attention configuration, and any nontext conditioning. Different execution paths can still introduce floating-point variation.

A single whole-prompt hash would miss a partial overlap. A hash table indexed by successive prefix blocks can discover it. A compressed token trie offers another approach:

| Index | How it finds overlap |
|---|---|
| SGLang's original RadixAttention | Traverses a compressed token trie; splits an edge when requests diverge within its token sequence |
| vLLM's automatic prefix cache | Looks up successive full blocks using chained keys that include preceding history |

<span data-glossary="sglang">SGLang</span>'s paper describes <span data-glossary="radixattention">RadixAttention</span> retaining prompt and generation state through a <span data-glossary="radix-tree">radix tree</span> and evicting eligible leaves with LRU.[^sglang2024] A trie split can expose a shared initial segment. The original paper describes the algorithm; each backend's current cache granularity determines whether single-token splits are available, so verify that behavior in the deployed implementation.

vLLM uses a hash-based index, not that radix-tree implementation.[^vllm2026prefix] With sixteen-token blocks, 6,005 shared positions contain 375 complete blocks (6,000 tokens). Alignment rules and the final uncached token tail can leave additional work, as the [previous lesson](/learn/kv-cache-paged-attention-llm-serving) demonstrated. <span data-glossary="pagedattention">PagedAttention</span> supplies block-oriented attention storage; it isn't itself the prefix-matching algorithm.[^kwon2023]

The vLLM key includes its parent hash, block token IDs, and relevant extras such as adapter IDs, multimodal hashes, and a cache salt. A teaching notation is:

$$
H_k = \text{hash}(\text{serialize}(H_{k-1},\ \text{token\_ids}_k,\ \text{extras}_k))
$$

The engine's cache namespace must also be compatible with its model revision; this formula doesn't assert that every vLLM block embeds a model ID. vLLM documents `sha256` as the default and `sha256_cbor` for reproducible cross-language serialization. It also offers noncryptographic options with a collision-risk warning. Collision resistance is different from authenticating who selected a sharing scope.[^vllm2026prefix]

Consider what happens downstream when the repository guide changes in block 1 while the `tools` schema in block 2 stays byte-for-byte identical: can block 2 still reuse its old cache key?

<figure>
  <img src="illustrations/_generated/block_hash_tree_dark.png" alt="One system block, digest prefix 314414, branches to two guide blocks. Guide v1 hashes to f6015e and guide v2 hashes to 79a94c. Both branches then contain the same tools block text, but the child digest prefixes differ: 6223fb and a238c9. These short hashes come from the article teaching serialization." />
  <figcaption>These short strings stand in for serialized token blocks. Editing the guide branches the shared system history, so identical tools text inherits different parent hashes and produces different child keys. The serialization is a teaching aid; reuse still requires compatible model scope and an available cache entry.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="trace-prefix-block-hashes.py"
from hashlib import sha256
import json


def chain(blocks: list[str]) -> list[str]:
    parent = "root"
    hashes = []
    for block in blocks:
        material = json.dumps(["teaching-block-v1", parent, block], separators=(",", ":"))
        parent = sha256(material.encode()).hexdigest()
        hashes.append(parent)
    return hashes


original = chain(["system", "repo guide v1", "tools"])
edited = chain(["system", "repo guide v2", "tools"])

for index, (left, right) in enumerate(zip(original, edited)):
    print(f"block {index}: {'same key' if left == right else 'different key'}")
assert original[0] == edited[0]
assert all(a != b for a, b in zip(original[1:], edited[1:]))
assert all(len(digest) == 64 for digest in original + edited)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
block 0: same key
block 1: different key
block 2: different key
```
<!-- leetllm: output:end -->

The strings above stand in for token blocks. This minimal model tests hash chaining across parent blocks rather than vLLM's full serialization format or cache residency: a matching key still needs a stored usable entry. That entry also has to be reachable from the front of the prompt. A question placed before the guide changes the history the guide's blocks inherit.

## Prompt architecture: static-first ordering

Cache hits require strictly stable prefixes. Put shared, immutable content first and variable, dynamic content last. Comparing these two layouts shows how block order near position zero controls prefix reuse.

Good prompt shape:

```text
system: You are the repository maintenance assistant.
repo_guide: <shared repository guide>
tools: <shared tool schema>
examples: <shared examples>
user: Why is this test failing?
```

Poor prompt shape:

```text
user: Why is this test failing?
system: You are the repository maintenance assistant.
repo_guide: <shared repository guide>
tools: <shared tool schema>
```

In the second layout, changing the question changes the context preceding the guide. A common wrapper might still match, but the guide after the divergence can't reuse its old state. These layouts illustrate serialized content order, not instructions to violate an API's role rules.

That's why agent architectures keep dynamic tool outputs and user-specific state after stable instructions whenever possible. Anthropic also renders `tools`, then `system`, then `messages` internally, so reshuffling a tool schema invalidates a cache even when the visible user text didn't move at all.[^anthropic2026promptcaching]

<!-- leetllm: test, deps=numpy, output=show -->
```python title="measure-reusable-prefix.py"
import numpy as np

def shared_prefix_tokens(left: np.ndarray, right: np.ndarray) -> int:
    mismatch = np.flatnonzero(left != right)
    return int(mismatch[0]) if mismatch.size else int(left.size)

# Token IDs representing [system, repo_guide, tools, query]
stable_first_a = np.array([101, 202, 303, 901], dtype=np.int64)
stable_first_b = np.array([101, 202, 303, 902], dtype=np.int64)
variable_first_a = np.array([901, 101, 202, 303], dtype=np.int64)
variable_first_b = np.array([902, 101, 202, 303], dtype=np.int64)

print("stable-first reusable units:", shared_prefix_tokens(stable_first_a, stable_first_b))
print("variable-first reusable units:", shared_prefix_tokens(variable_first_a, variable_first_b))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
stable-first reusable units: 3
variable-first reusable units: 0
```
<!-- leetllm: output:end -->

These lists contain named sections for clarity; in production, compare actual tokenizer token IDs when diagnosing cache behavior. Always preserve proper message roles; these sketches aren't instructions to stuff user queries into a system message.

```checkpoint
Given a long repo guide and a short user question, where should each part go for cache hits?
---
Put stable instructions, the repo guide, tool schemas, and few-shot examples first. Put the user question, retrieved snippets, per-user session state, and dynamic tool results after the stable prefix.
```

### Exact-match invalidation traps in production

Semantic equivalence isn't enough. Prefix reuse depends on the exact resulting token sequence, so formatting and serialization differences break the prefix earlier than you might expect.

- **Whitespace and line endings:** Extra spaces or `\r\n` instead of `\n` can change <span data-glossary="tokenization">tokenization</span>. The result depends on preprocessing and the tokenizer.
- **JSON key order:** Reordering keys in JSON rendered as prompt text can alter its token sequence. A provider may separately canonicalize structured API fields.
- **Non-deterministic renderers:** Timestamps, generated IDs, iteration over sets, or unstable external tool ordering can change the rendered prefix. Python dictionaries themselves preserve insertion order.

Make prompt templates strictly deterministic during prompt serialization. Serialize JSON with sorted keys where key order doesn't carry meaning, and preserve ordered arrays. Don't blindly strip whitespace from code or structured markdown, since whitespace often defines syntax. Log a prefix version hash so a cache miss can be traced directly to rendered prompt tokens rather than guessed from template files.

Exact token stability enables a match, while memory pressure can still evict unreferenced blocks. Self-hosted engines use least recently used (LRU) policies when <span data-glossary="vram">VRAM</span> is tight.[^sglang2024] A later request takes the correct cold path and recomputes the prefix. Treat eviction as a latency and cost event; capacity-plan for misses and keep application correctness independent of cache hits.

```checkpoint
Why can two prompts that mean the same thing miss the prefix cache even when no guide changed?
---
Formatting or unstable rendering can change token IDs even when meaning is unchanged. Eligibility and availability are separate: an identical prefix can miss after eviction. Keep rendering deterministic and the cold path correct.
```

## Hosted provider APIs and pricing economics

Hosted providers don't expose the same raw block-hash controls as <span data-glossary="vllm">vLLM</span>. They still match exact prefixes, but the knobs, field names, and break-even economics differ by vendor and model family. Before examining either provider API specification, trace what happens when a stable guide precedes a changing question: only a cache breakpoint placed before the variable tail lets the next request reuse that prefix.

OpenAI documents prompt caching in usage fields.[^openai2026promptcaching] Anthropic documents `cache_control` at the top level for automatic caching and on content blocks for explicit breakpoints.[^anthropic2026promptcaching] Both APIs expose the same underlying mechanics through different controls.

> **Provider APIs verified October 16, 2026.** Model, platform, settings, and cache residency determine live hits. The examples below depict request payloads and worked usage breakdowns; always check returned provider usage fields in production.

Don't assume a hosted cache behaves like your local runtime. Verify:

| Question | Why it matters |
|---|---|
| Is caching automatic or explicit? | Determines prompt construction and breakpoint placement |
| What is the minimum cacheable prefix? | Short prompts below the threshold never hit the cache |
| How long does the cache live? | Dictates traffic batching and request interval requirements |
| Is cache scoped by org, project, or region? | Governs privacy isolation and cross-worker hit rates |
| Where are cached tokens reported? | Required for accurate cost accounting and margin tracking |

OpenAI's guide distinguishes GPT-5.6 and later from earlier models. The newer family has a 1,024-visible-token minimum, exact breakpoint reporting, and `prompt_cache_options.ttl: "30m"` (minimum lifetime after the latest write or reuse). Earlier-model minimums vary with request settings; reported cached counts round down to multiples of 128, and retention uses `prompt_cache_retention`.[^openai2026promptcaching]

Implicit lookup can check earlier eligible message endings and the end of the initial consecutive developer messages. A lookup candidate becomes a stored entry only after a matching prefix has been written; writing through a changing question doesn't create a separate entry ending at the stable guide. Mark that guide in both the warmup and later requests. Explicit-only mode also keeps the changing suffix outside the write; confirm actual reuse from usage and diagnostics.[^openai2026promptcaching][^openai2026cacheDiagnostics]

Distinguish a candidate prefix offset from an actually stored cache entry. These tuple elements stand in for token IDs to show the documented prefix-endpoint dependency. OpenAI's private cache implementation remains internal:

<!-- leetllm: test, output=show -->
```python title="lookup-boundary-needs-a-prior-write.py"
guide = (7,) * 6000
first = guide + (11,) * 48
second = guide + (12,) * 37
entries = {first}  # Only the first complete request was written.

def longest_available_prefix(tokens, candidates):
    return max((end for end in candidates if tokens[:end] in entries), default=0)

candidates = [len(second), len(guide)]
before = longest_available_prefix(second, candidates)
entries.add(guide)  # A warmup with an explicit marker writes this boundary.
after = longest_available_prefix(second, candidates)
assert (before, after) == (0, 6000)
print("reused tokens without / with the guide entry:", before, "/", after)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reused tokens without / with the guide entry: 0 / 6000
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/prompt_boundary_entries_dark.png" alt="Stable-first requests share three leading units; variable-first requests share zero leading units even though their later guide and tools match. An automatic write stores 6,048 tokens including the first question, so a later 6,037- or 6,000-token request reuses zero. Placing an explicit marker at 6,000 guide tokens keeps each question outside the stored entry so later requests reuse 6,000 tokens." />
  <figcaption>The top panel compares prompt ordering, while the bottom panel contrasts automatic end-of-prompt writes against explicit markers stopped after the 6,000-token guide. Hosted eligibility varies by provider and model.</figcaption>
</figure>

For our coding assistant, mark the end of the repository guide explicitly and place the user question after it. This Responses API request structure illustrates the controls. Replace its placeholder with the complete guide; the placeholder alone won't meet the minimum:

```json title="openai-explicit-prefix.json"
{
  "model": "gpt-6-astra",
  "prompt_cache_options": { "mode": "explicit", "ttl": "30m" },
  "prompt_cache_key": "workspace-alpha:repo-guide-v7",
  "input": [
    {
      "role": "developer",
      "content": [{
        "type": "input_text",
        "text": "<stable instructions and the complete repository guide>",
        "prompt_cache_breakpoint": { "mode": "explicit" }
      }]
    },
    { "role": "user", "content": "Why is this test failing?" }
  ]
}
```

Explicit-only mode leaves the suffix outside the selected write. For GPT-5.6 and later, `prompt_cache_key` is optional separate accounting, not a routing requirement. Diagnostics even distinguish a key-related reported miss from a physical cache miss. Earlier models use keys to help routing. Choose any customer key in the trusted gateway; a caller-provided label offers no tenant isolation.[^openai2026cacheDiagnostics]

Current OpenAI pricing lists 1.25-times write and 0.10-times read rates for GPT-6 Astra and the GPT-5.6 family, relative to their corresponding uncached input rates. GPT-6.1 Sol's read rate is 0.05 times.[^openai2026pricing] Anthropic's pricing lists 1.25-times five-minute writes and 2-times one-hour writes. Most Claude reads cost 0.10 times base input; Fable 5.1 and Mythos 5.1 use 0.025 times, while Opus 5.5 and Sonnet 5.5 use 0.05 times. Availability and other pricing dimensions remain model-specific.[^anthropic2026pricing]

At a 0.10-times read rate, the 5-minute write surcharge is 0.25 units and each subsequent full read saves 0.90 units. The break-even requirement is:

$$
\text{Break-Even Reads} = \left\lceil \frac{\text{Write Rate} - 1.0}{1.0 - \text{Read Rate}} \right\rceil
$$

For the 5-minute tier, $\lceil 0.25 / 0.90 \rceil = 1$ read repays that premium. For the 1-hour tier with a 1.0-unit surcharge, $\lceil 1.0 / 0.90 \rceil = 2$ reads are required. If a cached prefix is written and never read before it expires, you paid a 25% to 100% financial penalty over uncached input!

Claude cache minimums are model-specific. As checked October 16, 2026, the guide lists thresholds of 512, 1,024, 2,048, or 4,096 tokens. Confirm the exact model and platform before placing a breakpoint. The documentation directs Bedrock users to AWS's platform pricing and limit reference. A breakpoint checks twenty positions, including itself, for earlier entries. An entry twenty new positions behind the breakpoint is just outside that lookup window, which measures eligible positions rather than prefix length. Consecutive tool-use blocks or consecutive tool-result blocks count as one position on the Claude API. Requests have four breakpoint slots; top-level automatic `cache_control` uses one. Concurrent reuse becomes available after the first response begins.[^anthropic2026promptcaching]

For the same stable-guide pattern, Claude's Messages API places the explicit marker on a system content block. Replace the placeholder with your complete guide; the literal placeholder is below the model's minimum:

```json title="claude-explicit-prefix.json"
{
  "model": "claude-opus-5",
  "max_tokens": 256,
  "system": [{
    "type": "text",
    "text": "<stable instructions and the complete repository guide>",
    "cache_control": { "type": "ephemeral" }
  }],
  "messages": [{ "role": "user", "content": "Why is this test failing?" }]
}
```

Both examples mark a reusable prefix offset. Neither marker creates a hit unless a compatible entry is available. For supported newer OpenAI models, `prompt_cache_options.prewarm: true` can write the selected prefix without generating a response; cache-write charges still apply.[^openai2026promptcaching]

<!-- leetllm: test, output=show -->
```python title="read-openai-cached-token-usage.py"
response_usage = {
    "input_tokens": 2600,
    "input_tokens_details": {
        "cached_tokens": 2000,
        "cache_write_tokens": 400,
    },
}

details = response_usage["input_tokens_details"]
cache_reads = details.get("cached_tokens", 0)
cache_writes = details.get("cache_write_tokens", 0)
uncached = response_usage["input_tokens"] - cache_reads - cache_writes
print(f"cache-read prompt tokens: {cache_reads}")
print(f"cache-write prompt tokens: {cache_writes}")
print(f"uncached prompt tokens: {uncached}")
assert cache_reads + cache_writes + uncached == response_usage["input_tokens"]
assert min(cache_reads, cache_writes, uncached) >= 0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
cache-read prompt tokens: 2000
cache-write prompt tokens: 400
uncached prompt tokens: 200
```
<!-- leetllm: output:end -->

Now compute the exact reuse threshold that repays the write premium across cache lifetimes:

<!-- leetllm: test, output=show -->
```python title="compute-anthropic-read-break-even.py"
from math import ceil

read_rate = 0.1
for ttl, write_rate in [("5m", 1.25), ("1h", 2.0)]:
    extra_write_cost = write_rate - 1.0
    savings_per_read = 1.0 - read_rate
    reads_needed = ceil(extra_write_cost / savings_per_read)
    print(f"{ttl} cache: {reads_needed} reuse request(s) to repay write premium")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
5m cache: 1 reuse request(s) to repay write premium
1h cache: 2 reuse request(s) to repay write premium
```
<!-- leetllm: output:end -->

The preceding worked breakdown uses Responses API field names; Chat Completions uses a different usage schema. For an authored Claude usage breakdown of the same 2,600-token total, use 2,000 `cache_read_input_tokens`, 400 `cache_creation_input_tokens`, and 200 `input_tokens`. Claude's `input_tokens` excludes the read/write portions. Sum all three before calculating its reused-token percentage.[^anthropic2026promptcaching]

The break-even calculation assumes full reads of the written prefix. Can three reported hits still cost more than four cold requests? Try a 6,000-token guide where only the first 1,024 tokens stay stable and the other 4,976 change each time. The authored usage rows assume all changing tokens are written at the 1.25-times rate, and reads use the 0.10-times rate. Output and other charges are held aside.[^openai2026pricing][^anthropic2026pricing]

<!-- leetllm: test, output=show -->
```python title="price-partial-hits-and-repeated-writes.py"
usage = [(0, 6000)] + [(1024, 4976)] * 3  # (read tokens, write tokens)
base_cost = sum(read + write for read, write in usage)
cached_cost = sum(0.10 * read + 1.25 * write for read, write in usage)
hits = sum(read > 0 for read, _ in usage)
assert hits == 3 and cached_cost > base_cost
print(f"requests with reads: {hits}/{len(usage)}")
print(f"input cost units, uncached / cached: {base_cost:.1f} / {cached_cost:.1f}")
print(f"cost increase despite hits: {cached_cost / base_cost - 1:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
requests with reads: 3/4
input cost units, uncached / cached: 24000.0 / 26467.2
cost increase despite hits: 10.3%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/cache_write_economics_dark.png" alt="Four 6,000-token requests contain one cold write and three partial reads. With 0.10-times reads and 1.25-times writes, the cached input bill is 26,467.2 units compared with 24,000 uncached units, even though three requests report reads. Full-prefix reuse repays the five-minute write premium in one read and the one-hour premium in two." />
  <figcaption>Applying 0.10× reads and 1.25× writes across 6,000 tokens leaves three partial reads 10.3% more expensive than uncached input; full-prefix reads repay the five-minute premium in one read and the one-hour premium in two.</figcaption>
</figure>

Price each returned read, write, and uncached portion. A high binary hit rate can hide repeated write premiums. If only the first 1,024 tokens are worth retaining, place the write marker there and process the changing suffix uncached; verify that offset qualifies for the selected model and settings.

```checkpoint
Why should production code log provider usage fields instead of hardcoding a prompt-caching discount?
---
Provider thresholds, lifetimes, scopes, and pricing vary by model. Usage fields tell you exactly how many tokens were read from cache, written to cache, or processed uncached for every request.
```

## Distributed serving: cache-aware routing versus round-robin

With independent worker-local caches, round-robin routing can require one cold warmup per worker. After those workers warm, repeated requests can hit. A deployment with shared tiers or cache transfers has different locality and transfer costs; not every cache entry is confined permanently to its original GPU.

Cache-aware routing can prefer a compatible warm worker. SGLang's paper describes cache-aware scheduling inside its engine; a distributed router needs its own cross-worker routing logic.[^sglang2024] Routing affinity also doesn't enforce cache ownership. Apply the authenticated sharing scope at lookup independently of the destination.

Affinity needs health and load handling. A hot prefix can overload its preferred worker; spilling to another worker may be worth a cold warmup. Bounded-load consistent hashing is one policy; tune its load threshold for the router and workload.

```checkpoint
Why can round-robin routing require more cold requests than prefix affinity?
---
Worker-local caches store KV blocks in local GPU VRAM. Round-robin spreads requests across distinct workers, forcing each replica to perform an independent cold prefill. Affinity routes matching prefixes to the same warm worker.
```

This routing simulation uses a fixed set of three initially cold workers, sequential completed warmups, one prefix, and no eviction. Its modulo hash models fixed worker affinity, so changing the worker count can remap many keys. Health-aware routing would need additional signals and logic.

<!-- leetllm: test, output=show -->
```python title="route-stable-prefixes-together.py"
from hashlib import sha256

workers = ["gpu-a", "gpu-b", "gpu-c"]
prefix = "repo-guide-v7|tool-schema-v2"


def affinity_worker(stable_prefix: str) -> str:
    digest = int(sha256(stable_prefix.encode()).hexdigest(), 16)
    return workers[digest % len(workers)]


round_robin = [workers[i % len(workers)] for i in range(4)]
affinity = [affinity_worker(prefix) for _ in range(4)]
print("round-robin workers:", round_robin)
print("affinity workers:", affinity)
print("cold workers with round-robin:", len(set(round_robin)))
print("cold workers with affinity:", len(set(affinity)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
round-robin workers: ['gpu-a', 'gpu-b', 'gpu-c', 'gpu-a']
affinity workers: ['gpu-b', 'gpu-b', 'gpu-b', 'gpu-b']
cold workers with round-robin: 3
cold workers with affinity: 1
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/worker_warmup_routing_dark.png" alt="Four sequential requests reach three initially cold workers. Round-robin causes three cold warmups; fixed prefix affinity sends all four requests to GPU B, causing one cold warmup. Worker state is shown after each trace. Health and load may send a request elsewhere." />
  <figcaption>With three initially cold workers and four sequential requests, round-robin warms three worker caches; affinity warms one. Health or load can change the selected worker.</figcaption>
</figure>

Sending every repeat to one warm worker cuts cold prefills. It does not remove the work that still happens after the prefix hits.

## Prefill versus decode: what prefix caching doesn't change

In our full-attention example, new input and generated tokens still attend to the retained prefix. GPU-resident entries still occupy the pool; another cache tier can add transfer costs. Reuse doesn't extend the model's context limit. Long output generation can dominate total response time even when input processing improves.

Separate <span data-glossary="ttft">time to first token (TTFT)</span> from <span data-glossary="itl">inter-token latency (ITL)</span>. A hit can reduce input processing; client TTFT also includes queueing and transport. It doesn't directly skip output-token generation. Decode performance can still change indirectly with batching, kernels, or load.

Prefix caching doesn't match by meaning. These questions express similar intent but don't share the same complete question prefix; any common message wrapper is a separate overlap:

```text
Why did this test fail after the refactor?
What broke in the failing spec after the code change?
```

Reusing an answer for such questions belongs to [semantic caching](/learn/semantic-caching-cost-latency-optimization). <span data-glossary="semantic-cache">Semantic caching</span> needs an answer-validity policy. Exact prefix reuse preserves the input prompt context; it doesn't make the model's answer accurate or eliminate numerical differences between execution paths.

```checkpoint
Why does prefix caching need a different correctness check from semantic caching?
---
Correctly keyed prefix caching reuses mathematically equivalent tensor activations, not an old answer. It requires weight and isolation checks; different execution kernels can also introduce floating-point variation. Semantic caching deliberately reuses an answer for a different query, so it also needs an answer-validity policy.
```

Holding decode constant at 880 ms isolates how prefix caching reduces input prefill latency before measuring full engine traces:

<!-- leetllm: test, output=show -->
```python title="separate-ttft-from-decode-gains.py"
uncached = {"prefill_ms": 1220, "decode_ms": 880}
cached = {"prefill_ms": 170, "decode_ms": 880}

prefill_saved = uncached["prefill_ms"] - cached["prefill_ms"]
decode_change = uncached["decode_ms"] - cached["decode_ms"]
print(f"prefill saved: {prefill_saved} ms")
print(f"decode change: {decode_change} ms")
assert prefill_saved > decode_change
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prefill saved: 1050 ms
decode change: 0 ms
```
<!-- leetllm: output:end -->

Consider this counterexample carefully: if prefill compute drops by 1,050 ms while queue wait grows by 1,180 ms, does the client observe a lower time to first token?

<!-- leetllm: test, output=show -->
```python title="queueing-can-hide-cache-gains.py"
# First-token work includes computation through the first output token.
cold = {"queue_ms": 20, "first_token_work_ms": 1220}
warm = {"queue_ms": 1200, "first_token_work_ms": 170}
cold_ttft = sum(cold.values())
warm_ttft = sum(warm.values())
print("first-token work saved:", cold["first_token_work_ms"] - warm["first_token_work_ms"], "ms")
print("cold / warm TTFT:", cold_ttft, "/", warm_ttft, "ms")
print("client TTFT change:", warm_ttft - cold_ttft, "ms")
assert warm["first_token_work_ms"] < cold["first_token_work_ms"]
assert warm_ttft > cold_ttft
```

<!-- leetllm: output:start -->
```text title="Output" output compact
first-token work saved: 1050 ms
cold / warm TTFT: 1240 / 1370 ms
client TTFT change: 130 ms
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/latency_profile_dark.png" alt="Phase timings on a common 2,100-ms scale: cold input processing takes 1,220 ms followed by 880 ms of decode; warm input processing takes 170 ms followed by the same 880-ms decode. In a queued request trace, queueing rises from 20 to 1,200 ms, so TTFT increases from 1,240 to 1,370 ms despite 1,050 ms less first-token work." />
  <figcaption>The server phase chart holds decode constant at 880 ms to isolate prefill savings. Client TTFT includes queueing and can move the other way under load; measure both paths.</figcaption>
</figure>

The warm request is slower from the client's perspective. Compare both server work and client timestamps under representative load; a hit alone doesn't determine latency.

## Telemetry: token-level yield versus binary hit counters

Usage fields report credited reuse for a request. Operations teams also need to know whether that reuse helps the route over time. Provider accounting and physical cache behavior need not be identical, as OpenAI's key-change diagnostic illustrates.[^openai2026cacheDiagnostics]

For self-hosted runtimes, log prefix cache hit rates, reused token counts, prefill latency, decode latency, and GPU memory allocation. For hosted APIs, parse and record returned cache fields. Always slice metrics by route, model revision, prefix version, and traffic window. Long-lived multi-turn chat sessions reuse substantial prefixes too; route names alone don't explain savings.

Example application log schema:

```json title="instrumentation.json"
{
  "route": "repo-guide-rag",
  "prompt_tokens": 6048,
  "cached_tokens": 6000,
  "cache_write_tokens": 0,
  "prefill_ms": 170,
  "decode_ms": 880,
  "cache_version_id": "repo_guide_v7"
}
```

Version the static prefix in telemetry. If the repository guide changes, blocks containing and following the first changed token can't reuse the old cache entry, but earlier unchanged blocks can still hit. A version label correlates that partial warmup with software rollouts.

Beware the binary hit counter trap. A request reusing 6,000 of 6,048 tokens has 99.2% token reuse; one reusing 600 has 9.9%. Both increment a binary hit counter. These percentages measure input-token volume, not prefill FLOPs or elapsed time. Compute a volume-weighted token ratio, then measure time and price separately:

$$
\text{Token Hit Ratio} = \frac{\sum \text{Cached Input Tokens}}{\sum \text{Total Prompt Tokens}}
$$

<figure>
  <img
    src="illustrations/_generated/cache_observability_dark.png"
    alt="Two requests each count as a hit but reuse 99.2% and 9.9% of prompt tokens. By prefix version, guide-v6 has one hit and 99.2% token reuse; guide-v7 has two hits and 54.6% token reuse. The ratio uses summed reused input tokens over summed prompt tokens."
  />
  <figcaption>
    These ratios describe input-token volume. Measure prefill, client latency, and price separately.
  </figcaption>
</figure>

```checkpoint
Which metrics prove prefix caching is helping a route?
---
Track token reuse and read/write costs alongside input-processing time, client TTFT, output intervals, queueing, and block-pool pressure. Slice by route, model, and prefix version. Token counts alone don't establish latency gains or unchanged decode speed.
```

## Memory management: cached can also mean available

Physical GPU VRAM is strictly bounded. What happens when hundreds of concurrent requests arrive and memory fills up?

vLLM V1's block pool distinguishes references, cached content, and allocation availability. On release, an unreferenced block can retain its cache key while joining the free queue. A matching request can touch it; allocation for different content can evict it. Resident pool storage need not shrink when ownership changes.[^vllm2026prefix]

Don't recycle a block while owners or pending GPU operations still need it. Proper scheduler preemption can instead release ownership and arrange recomputation or supported offload. When available blocks run out, the engine must defer or preempt work according to its policy. The previous lesson's failed-append lab demonstrated that allocation failure must preserve existing state.

No universal 85%/95% VRAM watermarks follow from this design. Measure referenced blocks, cached unreferenced candidates, available blocks, eviction churn, and preemption. GPU allocation alone can stay constant while the logical pool fills.

In the 1,000-block KV pool snapshot below, 450 blocks hold active references while 400 remain cached unreferenced alongside 150 uncached free blocks, leaving 550 allocatable blocks in total:

<!-- leetllm: test, output=show -->
```python title="count-available-prefix-blocks.py"
pool = {"referenced": 450, "cached_unreferenced": 400, "uncached_free": 150}
assert sum(pool.values()) == 1000
available = pool["cached_unreferenced"] + pool["uncached_free"]
new_blocks = 200
print("available blocks:", available)
print("200 new blocks fit:", new_blocks <= available)
print("available after allocating 200:", available - new_blocks)
print("must replace at least this many cached blocks:", max(0, new_blocks - pool["uncached_free"]))
assert available == 550
```

<!-- leetllm: output:start -->
```text title="Output" output compact
available blocks: 550
200 new blocks fit: True
available after allocating 200: 350
must replace at least this many cached blocks: 50
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/cached_pool_availability_dark.png" alt="A 1,000-block snapshot has 450 referenced, 400 cached but unreferenced, and 150 uncached free blocks. The two unreferenced groups provide 550 available blocks; allocating 200 leaves 350 and replaces at least 50 cached blocks. Actual eviction order can vary, and referenced blocks remain owned." />
  <figcaption>A cached block can retain its prefix key after ownership ends, then be reclaimed when another prefix needs space.</figcaption>
</figure>

The allocation order could replace more cached entries; this lower bound leaves the engine's free-queue order unspecified. A hit-rate drop can accompany successful allocation without any change in resident pool bytes.

Treat LRU eviction as a capacity signal. If your token hit ratio suddenly drops during peak traffic hours, check eviction churn: high concurrency may be evicting unpinned prefixes before subsequent requests arrive to reuse them.

<!-- leetllm: test, output=show -->
```python title="summarize-hits-by-prefix-version.py"
events = [
    {"version": "guide-v6", "cached_tokens": 6000, "input_tokens": 6048},
    {"version": "guide-v7", "cached_tokens": 600, "input_tokens": 6048},
    {"version": "guide-v7", "cached_tokens": 6000, "input_tokens": 6048},
]

for version in sorted({event["version"] for event in events}):
    rows = [event for event in events if event["version"] == version]
    hits = sum(event["cached_tokens"] > 0 for event in rows)
    reused = sum(event["cached_tokens"] for event in rows)
    total = sum(event["input_tokens"] for event in rows)
    print(f"{version}: {hits}/{len(rows)} requests hit; {reused / total:.1%} tokens reused")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
guide-v6: 1/1 requests hit; 99.2% tokens reused
guide-v7: 2/2 requests hit; 54.6% tokens reused
```
<!-- leetllm: output:end -->

## Multi-tenant security: timing side-channels and cache isolation

A cache hit is faster, and that speed can leak. A probe that contains suspected confidential text, if it comes back repeatedly faster, may indicate that another tenant already warmed that prefix. Queueing, routing, and other warm prefixes also affect one response's timing, so identify the source with repeated controlled probes and provider-side evidence. Returned cache counters can also be a probing signal.

Incorrect history keys or collisions can cause reuse of the wrong state; memory corruption requires a separate out-of-bounds condition. Exact token matching and SHA-256 also don't authenticate the caller or authorize cross-tenant sharing.

vLLM supports an optional request `cache_salt` included in the first block's key. The gateway should select and enforce the scope from verified identity, overriding or rejecting unauthorized caller-selected values.[^vllm2026prefix] A salt known to an attacker and accepted without authorization provides no tenant isolation. Distinct structured keys and collision resistance protect this lookup path under the configured policy; they don't prove all side channels impossible.

Provider isolation scopes differ by platform. OpenAI documents organization and regional processing isolation; its newer accounting keys describe cache accounting, while physical KV storage separation requires separate provider documentation. Claude documents workspace isolation on its API, Claude Platform on AWS, and Microsoft Foundry, and organization isolation on Bedrock and Google Cloud. A tenant label in application logs cannot create physical KV cache separation inside the provider.[^openai2026promptcaching][^anthropic2026promptcaching]

This Python hash check verifies distinct block keys for separate namespace salts. Authentication of those strings and provider isolation require separate controls:

<!-- leetllm: test, output=show -->
```python title="scope-prefix-keys-by-tenant.py"
from hashlib import sha256
import json


def cache_key(tenant: str, prefix_version: str, tokens: str) -> str:
    material = json.dumps(
        ["model-revision-42", tenant, prefix_version, tokens],
        ensure_ascii=False, separators=(",", ":"),
    )
    return sha256(material.encode()).hexdigest()


prefix = "system|private-guide|tools"
alpha = cache_key("tenant-alpha", "v7", prefix)
beta = cache_key("tenant-beta", "v7", prefix)
print("same tokens, scoped keys differ:", alpha != beta)
print("stored key length:", len(alpha))
print("alpha key for display:", alpha[:12])
assert alpha != beta
assert len(alpha) == 64
assert cache_key("a|b", "c", "d") != cache_key("a", "b|c", "d")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
same tokens, scoped keys differ: True
stored key length: 64
alpha key for display: 5f867552dca0
```
<!-- leetllm: output:end -->

Now try a forged label. The sessions below stand in for authentication results; a real login service must verify the session before supplying its tenant scope.

<!-- leetllm: test, output=show -->
```python title="enforce-server-selected-cache-scope.py"
from hashlib import sha256
import json

verified_sessions = {"session-a": "tenant-alpha", "session-b": "tenant-beta"}


def scoped_key(scope: str, prefix: str) -> str:
    return sha256(json.dumps([scope, prefix], separators=(",", ":")).encode()).hexdigest()


def gateway_key(session: str, client_label: str, prefix: str) -> str:
    # The untrusted client_label never selects the sharing scope.
    principal = verified_sessions[session]
    return scoped_key(principal, prefix)


prefix = "private-guide-v7"
victim = gateway_key("session-a", "tenant-alpha", prefix)
unsafe_probe = scoped_key("tenant-alpha", prefix)
safe_probe = gateway_key("session-b", "tenant-alpha", prefix)
print("caller-selected probe matches victim:", unsafe_probe == victim)
print("server-selected probe matches victim:", safe_probe == victim)
assert unsafe_probe == victim and safe_probe != victim
try:
    gateway_key("unknown-session", "tenant-alpha", prefix)
except KeyError:
    print("unknown session rejected before lookup")
else:
    raise AssertionError("unauthenticated session accepted")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
caller-selected probe matches victim: True
server-selected probe matches victim: False
unknown session rejected before lookup
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/authenticated_cache_scope_dark.png" alt="A gateway authenticates session-b to tenant-beta and ignores its untrusted alpha claim. From the root hash trie, separate verified namespace salts give tenant-alpha and tenant-beta disjoint KV block keys even for identical system, guide, and tools text." />
  <figcaption>Deriving the prefix-trie root salt from verified gateway auth forces identical system, guide, and tools blocks onto disjoint KV block keys per tenant; hardware isolation and timing side channels require separate controls.</figcaption>
</figure>

## Failure modes: debugging stale outputs and silent eviction

A common engineering trap is blaming exact-prefix caching when a model outputs outdated rules:

- **Symptom:** The coding bot continues enforcing last week's 90-day key rotation rule even after the repository guide changed to 30 days.
- **Input check:** Did the request actually contain the new guide? Inspect retrieval and rollout versions, plus a protected digest of the actual rendered stable guide. Comparing a full prompt digest to a guide-only digest is meaningless; changing user questions also changes the full digest.
- **Cache check:** Were preceding history, weights, adapters, and other conditioning included in the computation key? Correct exact keys prevent the edited guide from matching its old entry; custom keys can be wrong.
- **Answer check:** If input and cache behavior are correct, evaluate instruction following and answer quality. Fresh computation can still produce stale advice.

For supported OpenAI Responses models, set `prompt_cache_options.comparison_response_id` to a recent completed baseline response's ID and inspect `prompt_cache_diagnostics`. This requests a comparison; it doesn't load the old conversation or change caching behavior. Diagnostics are best effort. Use current usage counts for credited reuse.[^openai2026cacheDiagnostics]

<!-- leetllm: test, output=show -->
```python title="require-miss-on-guide-change.py"
from hashlib import sha256


def exact_prefix_key(guide: str) -> str:
    return sha256(f"system|{guide}|tools".encode()).hexdigest()


before = exact_prefix_key("keys rotate after 90 days")
after = exact_prefix_key("keys rotate after 30 days")
print("changed guide invalidates exact-prefix key:", before != after)
assert before != after
```

<!-- leetllm: output:start -->
```text title="Output" output compact
changed guide invalidates exact-prefix key: True
```
<!-- leetllm: output:end -->

```checkpoint
Can requests still count as cache hits immediately after a guide edit?
---
Yes. Earlier unchanged blocks before the edit can hit while the changed guide and its downstream blocks are recomputed. Check the matched token offset, rendered version, and cached token count alongside the binary hit counter.
```

Before promoting the guide, test both cold and warm requests against the updated rule. The cache should change the work performed, not which guide the model receives. A reused prefix and a reused answer are different events. Check the matched prefix offset, usage counts, and verified tenant namespace together.

```mastery-quiz
[
  {
    "question": "A full-block cache uses 32-token blocks. A stored 4300-token prompt and the new 4300-token prompt first differ at position 4238, counting from one. Model, scope and entry availability match. How much input can this cache reuse?",
    "options": [
      "4224 reused; 76 fresh.",
      "4237 reused; 63 fresh.",
      "4256 reused; 44 fresh.",
      "4300 reused; 0 fresh."
    ],
    "answer": "4224 reused; 76 fresh.",
    "explanation": "The common prefix has 4237 tokens. Only floor(4237/32) = 132 complete blocks qualify, so 4224 tokens are reused and 4300 − 4224 = 76 are fresh. A matching partial block never writes a stored full-block entry."
  },
  {
    "question": "An empty cache writes only at explicit markers. A write requires at least 2,100 tokens through the marker. A 1,860-token guide precedes a changing 320-token question. A shared glossary adds 220 tokens and a shared checklist adds 260. Which plan should you use on both warmup and later requests to qualify the guide while keeping the question outside the write?",
    "options": [
      "Append the glossary to the guide and mark the end of the glossary.",
      "Append the checklist to the guide and mark the end of the checklist.",
      "Append the checklist to the question and mark the end of the original guide.",
      "Append the glossary to the guide and mark the end of the question."
    ],
    "answer": "Append the checklist to the guide and mark the end of the checklist.",
    "explanation": "The guide needs 240 more tokens to reach 2,100. Marking the checklist after the guide gives 2,120 stable tokens. Marking the glossary gives only 2,080. Appending the checklist after the question leaves the original guide marker at 1,860. Marking the question after the glossary reaches 2,400 but includes the changing question in the write. A later request can reuse the checklist entry once the write completes and a compatible copy is available."
  },
  {
    "question": "A Claude-style cache has compatible, available entries ending at eligible positions 12 and 40. Every endpoint meets the model minimum. The request marks positions 31 and 60; each marker checks 20 positions including itself. Consider existing reads, excluding new writes. What is the longest reusable prefix initially, and after adding a third marker at 40?",
    "options": [
      "Initially 0; with marker 40, reuse 40 positions.",
      "Initially 40; with marker 40, reuse 40 positions.",
      "Initially 52; with marker 40, reuse 92 positions.",
      "Initially 12; with marker 40, reuse 40 positions."
    ],
    "answer": "Initially 12; with marker 40, reuse 40 positions.",
    "explanation": "Marker 31 searches 31 through 12 and reaches entry 12. Marker 60 searches 60 through 41 and misses entry 40. Adding marker 40 directly reaches the available endpoint 40, extending the longest reused initial prefix. Overlapping prefix lengths are not added; three explicit markers remain within the four-slot API limit."
  },
  {
    "question": "Three requests each contain 4000 input tokens. The first writes all 4000. Each later request reads the same 1500-token prefix and writes its unique 2500-token suffix. Ordinary input costs 1 unit/token, writes 1.25 and reads 0.10. Exclude output and other charges. What is the input bill versus three uncached requests?",
    "options": [
      "11550 versus 12000 units; saving 450.",
      "12000 versus 12000 units; saving 0.",
      "9350 versus 12000 units; saving 2650.",
      "12750 versus 12000 units; extra 750."
    ],
    "answer": "11550 versus 12000 units; saving 450.",
    "explanation": "The first write costs 4000×1.25 = 5000. Each later row costs 1500×0.10 + 2500×1.25 = 3275. Total 5000 + 2×3275 = 11550, saving 450 relative to 12000. Two reported hits do not specify the savings without token-level writes and reads."
  },
  {
    "question": "For the same prompt and output, worker A has a warm first-token computation of 80 ms and a 600 ms queue. Worker B needs 500 ms cold computation and has a 50 ms queue. Remaining generation is 700 ms on either worker; no transfers overlap or add time. Which route minimizes first-token arrival, and what is its completion time?",
    "options": [
      "A; first token 80 ms and completion 780 ms.",
      "A; first token 680 ms and completion 1380 ms.",
      "B; first token 550 ms and completion 1250 ms.",
      "B; first token 500 ms and completion 1200 ms."
    ],
    "answer": "B; first token 550 ms and completion 1250 ms.",
    "explanation": "Queue wait precedes first-token computation here. A arrives at 600+80 = 680 ms; B at 50+500 = 550 ms. B completes at 550+700 = 1250 ms. The warm worker saves computation but its extra waiting more than consumes that gain."
  },
  {
    "question": "An OpenAI Responses usage log reports input_tokens 4096, cached_tokens 1024 and cache_write_tokens 2048 in its input details. A Claude usage log reports ordinary input_tokens 1024, cache_read_input_tokens 1024 and cache_creation_input_tokens 2048. Which normalized totals and read fractions are consistent?",
    "options": [
      "OpenAI total 7168, read 14.3%; Claude total 4096, read 25%.",
      "Both total 4096 and read 25%; ordinary input is 1024 each.",
      "OpenAI total 4096, read 25%; Claude total 1024, read 100%.",
      "Both total 4096 and read 75%; ordinary input is 1024 each."
    ],
    "answer": "Both total 4096 and read 25%; ordinary input is 1024 each.",
    "explanation": "OpenAI input_tokens already includes the three disjoint input buckets: ordinary = 4096−1024−2048 = 1024. Claude ordinary input excludes the read and write portions, so add 1024+1024+2048 = 4096. Each read fraction is 1024/4096 = 25%; writes are not reads."
  },
  {
    "question": "A fixed 120-block pool has 53 referenced blocks, 41 cached unreferenced blocks and 26 uncached free blocks. A free-first allocator grants 35 new distinct blocks, with no shared-block touch or release. Which resulting state follows?",
    "options": [
      "79 referenced, 32 cached unreferenced, 9 uncached free; 41 available.",
      "88 referenced, 41 cached unreferenced, 0 uncached free; 41 available.",
      "88 referenced, 6 cached unreferenced, 26 uncached free; 32 available.",
      "88 referenced, 32 cached unreferenced, 0 uncached free; 32 available."
    ],
    "answer": "88 referenced, 32 cached unreferenced, 0 uncached free; 32 available.",
    "explanation": "Use the 26 uncached free blocks, then replace 9 cached unreferenced entries. Referenced ownership rises to 53+35 = 88; cached unreferenced entries fall to 41−9 = 32. All 120 resident blocks remain present, and only the 32 unreferenced blocks remain available."
  },
  {
    "question": "A self-hosted cache holds a completed guide for verified team C, model M and adapter A. Two authorized C requests reach that same worker. R1 preserves guide tokens but switches to adapter B. R2 retains adapter A and changes a timestamp placed after the guide. Other computation settings match. Which guide reuse decision follows?",
    "options": [
      "R1 must miss; R2 can reuse the available compatible guide.",
      "R1 can reuse; R2 must miss because its timestamp changed.",
      "Both can reuse because the visible guide text is unchanged.",
      "Both must miss because each request has a changed field."
    ],
    "answer": "R1 must miss; R2 can reuse the available compatible guide.",
    "explanation": "The adapter changes the computation that produced R1’s guide state, so matching guide tokens cannot validate the A entry for B. R2 preserves the guide’s full starting tokens and computation identity; a later timestamp does not change that earlier prefix. The stem specifies the verified scope, compatible cache entry, and target worker. The timestamp itself still needs fresh processing."
  },
  {
    "question": "After a guide update from v3 to v4, a support bot still quotes the old refund deadline on two routes. The release log identifies guide digest 7ac1 as v3 and 96ef as v4. The rendered guide digest is 7ac1 on A and 96ef on B. A verified cold run on B read zero prefix tokens. Keep the model revision fixed in both replays and use the same captured input on B. Which pair of replays tests where the old deadline entered each path?",
    "options": [
      "On A, render the prompt from v4. On B, replay with prefix reuse disabled.",
      "On A, flush the prefix cache and resend the captured prompt. On B, replay with the answer cache bypassed.",
      "On A, render the prompt from v4. On B, replay with the answer cache bypassed.",
      "On A, flush the prefix cache and resend the captured prompt. On B, replay with prefix reuse disabled."
    ],
    "answer": "On A, render the prompt from v4. On B, replay with the answer cache bypassed.",
    "explanation": "A sent v3. Flushing its prefix cache would still make the model process the old deadline. Render A from v4 and check that the guide digest is 96ef before replay. B already sent v4 and read zero prefix tokens. Disabling prefix reuse would repeat that condition while leaving the answer cache in place. Bypassing the answer cache lets you inspect what the same model generates from the same input. If that fresh reply still gives the old deadline, the model can reproduce the error on its own."
  },
  {
    "question": "A full-block cache uses 32-token blocks. A new request has a 5120-token guide plus an 80-token question. Its compatible stored guide first differs at one-based position 4481. An admission threshold permits at most 700 fresh input tokens. Which decision follows?",
    "options": [
      "4480 reused; 640 fresh; admission at 700 is sufficient.",
      "4480 reused; 720 fresh; admission requires at least 720.",
      "4512 reused; 688 fresh; admission at 700 is sufficient.",
      "5120 reused; 80 fresh; admission at 700 is sufficient."
    ],
    "answer": "4480 reused; 720 fresh; admission requires at least 720.",
    "explanation": "The first 4480 positions match, exactly 140 full blocks. Fresh input is (5120−4480)+80 = 720, above 700. The changed position cannot reuse its old block or restart the old chain later. Defer or explicitly authorize sufficient work; a cache hit cannot repair an insufficient admission budget."
  }
]
```

> **Next:** Continue to [FlashAttention & Memory Efficiency](/learn/flashattention-memory-efficient-attention). Prefix caching can skip repeated prefill, but a hit still runs attention over those cached KV <span data-glossary="tensor">tensors</span>. <span data-glossary="flashattention">FlashAttention</span> attacks that remaining memory traffic inside each attention kernel.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
Someone on your team adds one helpful line to the top of the system prompt: `Current time: 2026-05-14 09:12:03`. The change passes review. Tests pass. Nothing breaks. A week later the input bill has tripled and first-token latency has jumped, and nobody can say why, because every dashboard still shows the same traffic.

That timestamp changed on every request, and it sat in front of everything else. It silently destroyed every cache hit you were counting on.

Picture three developers asking a coding assistant about the same repository. Their questions differ, but each request starts with the same 6,000 tokens: instructions, a repository guide, tool schemas, and examples. The server could process those 6,000 positions three times. Or it could process them once, keep the resulting attention state, and let later requests start from there. That's **prefix caching**.

The [previous chapter](/learn/kv-cache-paged-attention-llm-serving) showed how one sequence owns and reads its cache blocks. Prefix caching stretches that idea across separate requests, and that's where things get interesting. You have to decide what "the same prefix" means, find an entry that actually exists, and make sure one customer's cached state never serves another.

## Count the work you avoid

Use that 6,000-token prefix, followed by questions of 48, 37, and 51 tokens.

Without reuse, prompt processing covers

$$
(6000+48)+(6000+37)+(6000+51)=18{,}136
$$

positions. If the first request writes a reusable entry and the next two find it, fresh prompt work drops to

$$
6048+37+51=6136.
$$

That's 12,000 positions you didn't compute. Generated output is untouched, since a prefix hit saves input work and every answer still has to be decoded token by token.

<figure>
  <img src="illustrations/_generated/prefix_cache_dark.png" alt="A 6,000-position prefix is computed once, with separate question tails of 48, 37, and 51 positions." />
  <figcaption>One cold request pays for the prefix, and two warm requests skip it. Across the three requests, fresh input work falls from 18,136 positions to 6,136.</figcaption>
</figure>

Be careful how you report this. Two of the three requests hit, which is a 66.7% request hit rate. Reused positions are 12,000 of 18,136, or 66.2% of input tokens. Those two numbers happen to be close here, and in production they often aren't. A request that reuses 6,000 of 6,048 tokens and one that reuses 600 of 6,048 both increment the same hit counter, yet one saved 99.2% of its input and the other 9.9%. A fleet can show a healthy hit rate while most tokens still get computed from scratch. Track the volume-weighted ratio:

$$
\text{Token hit ratio} = \frac{\sum \text{cached input tokens}}{\sum \text{total prompt tokens}}
$$

Remember too that this counts positions. Skipping half the positions doesn't halve the latency, because prefill is parallel work with kernel costs that depend on shape, and a long answer may dominate the request anyway.

## A prefix includes its history

Why does an edit at the top of a prompt invalidate everything after it, even text that didn't change? Because at a causal Transformer layer, a later position's state depends on everything before it. The same tool schema after two different repository guides produces different attention state. Reusing one for the other would hand the model a false memory.

So a block's identity must include both its tokens and its entire past. Hash chaining captures this:

$$
h_j=H(h_{j-1},\text{tokens}_j,\text{compatible context}).
$$

The compatible context covers anything that changes the computation: the model revision, the adapter, the tokenizer and template, how positions are interpreted, and the sharing scope. The exact keys vary by engine. The rule doesn't: a lookup must never merge states produced by different computations.[^kwon2023][^vllm2026prefix] A radix tree reaches the same goal a different way, following the longest shared token path and branching at the first difference.[^sglang2024]

<figure>
  <img src="illustrations/_generated/block_hash_tree_dark.png" alt="Changing a guide block changes the digest of a later identical tools block because its predecessor differs." />
  <figcaption>The tools block is byte-for-byte identical on both branches. Its key still changes, because the block before it changed. One edit near the top invalidates everything below it.</figcaption>
</figure>

This means matching happens on exact token IDs, and semantic equivalence counts for nothing. Here are the bugs that actually show up in production:

- **Timestamps and generated IDs** near the top of the prompt, like the one in our opening.
- **Unstable tool ordering**, such as iterating over a set when rendering tool definitions.
- **JSON key order** in structured data rendered into prompt text. Providers may separately normalize structured API fields, so check yours.
- **Whitespace and line endings**, since `\r\n` and `\n` can tokenize differently.
- **A template update**, which can add a role separator and shift every token after it.

Make your serialization deterministic. Sort JSON keys when their order carries no meaning, keep arrays in order, and don't strip whitespace blindly from code, where it can be syntax. Then log a version hash of the rendered prefix. When a cache miss appears, you'll be able to trace it to the exact token where two prompts diverged rather than guessing from template files.

## Scope is a security decision

Now the part that can get you on the front page. Two tenants might send identical tokens, and sharing their cache looks like free savings. Should you?

Consider a timing attack. An attacker guesses at some confidential text and sends it as a prompt prefix. If it comes back consistently faster, someone else probably warmed that exact prefix, which tells the attacker the guess was right. Timing is noisy for a single request, but repeated probes can filter out noise, and returned cache counters can be an even clearer signal. So a cache shared across tenants can leak information without ever returning a wrong answer.

The defense is to bind the sharing scope into the key, and to have your server choose that scope from a verified identity. The caller's claim about who they are doesn't count. Here's a small version, using strings in place of token blocks:

<!-- leetllm: test, output=show, id=reader-prefix-scoped-lookup -->
```python title="scoped-prefix-lookup.py"
import hashlib
import json

sessions = {"session-a": "tenant-alpha", "session-b": "tenant-beta"}
entries = set()

def key(session, units, *, model="model-v7", adapter="base"):
    scope = sessions[session]  # Unknown sessions fail before lookup.
    parent = hashlib.sha256(
        json.dumps([scope, model, adapter]).encode()
    ).hexdigest()
    for unit in units:
        parent = hashlib.sha256(
            json.dumps([parent, unit], separators=(",", ":")).encode()
        ).hexdigest()
    return parent

prefix = ("instructions-v1", "guide-v1", "tools-v1")
alpha = key("session-a", prefix)
assert alpha not in entries
entries.add(alpha)
assert key("session-a", prefix) in entries
assert key("session-b", prefix) not in entries
edited = ("instructions-v1", "guide-v2", "tools-v1")
assert key("session-a", edited) not in entries
assert key("session-a", prefix, adapter="adapter-v2") not in entries
print("same authorized history: hit")
print("different scope, guide, or adapter: miss")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
same authorized history: hit
different scope, guide, or adapter: miss
```
<!-- leetllm: output:end -->

Notice where the scope comes from: a trusted session lookup. Nothing in the request can set it, and an unknown session fails before any lookup happens. That's the whole lesson. A caller saying "I am tenant alpha" must not be able to read alpha's cache. vLLM offers a `cache_salt` that goes into the first block's key, which works well when your gateway picks the salt from verified identity and overrides anything the caller sends. A salt the attacker knows and you accept without checking is no isolation at all.[^vllm2026prefix] A hash also doesn't authenticate anyone. It only makes the lookup key depend on whatever you fed it. On a hosted API, read the provider's documented isolation scope, since a tenant label in your own logs can't create isolation the provider doesn't enforce.[^openai2026promptcaching][^anthropic2026promptcaching]

## Put stable material first

Since reuse follows the leading tokens, one design rule delivers most of the benefit: stable things go first, changing things go last. Instructions, shared reference material, and tool schemas lead. The user's question, the timestamp, and the request ID trail.

Take this seriously as an architecture rule, because small accidents can erase the benefit. Add a code review check for it, and alert on sudden drops in the token hit ratio after a deploy.

Even a perfectly stable prefix can be evicted. Self-hosted engines reclaim unreferenced blocks under memory pressure, often least recently used first, and the next request simply takes the cold path.[^sglang2024] Treat that as a latency and cost event, plan capacity for it, and make sure nothing about correctness depends on a hit.

There's a limit, though. Don't reorder content merely to chase a hit. The position of a document can change how a model behaves, and a shared guide can be stale or restricted. Get the correct prompt first, then make equivalent serialization stable, and evaluate anything that changes meaning.

## A hit needs a prior write

Here's a subtle one. Two requests share 6,000 leading tokens, and the second one misses anyway. How?

A common prefix doesn't create a cache entry. Something has to have written one at a length the lookup can use. Suppose the cache stored one entry for the first request's complete 6,048-token prompt. A later 6,037-token request has no entry ending at 6,037, and nothing guarantees one at 6,000 either.

<!-- leetllm: test, output=show, id=reader-prefix-write-boundary -->
```python title="lookup-needs-a-prior-write.py"
guide = (7,) * 6000
first = guide + (11,) * 48
second = guide + (12,) * 37
entries = {first}  # Only the first complete request was written.

def longest_available_prefix(tokens, candidates):
    return max(
        (end for end in candidates if tokens[:end] in entries),
        default=0,
    )

candidates = [len(second), len(guide)]
before = longest_available_prefix(second, candidates)
# A warmup with an explicit marker writes this length.
entries.add(guide)
after = longest_available_prefix(second, candidates)
assert (before, after) == (0, 6000)
print("reused tokens without / with the guide entry:",
      before, "/", after)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reused tokens without / with the guide entry: 0 / 6000
```
<!-- leetllm: output:end -->

So placing an explicit breakpoint at the end of the stable guide can make that unit reusable. Self-hosted engines often retain full blocks or tree prefixes instead, which behaves differently. Each cache has its own rule about which lengths exist.[^anthropic2026promptcaching][^vllm2026prefix]

<figure>
  <img src="illustrations/_generated/prompt_boundary_entries_dark.png" alt="A stable-first prompt shares leading units, while a variable-first prompt shares none. Stopping an explicit cache write at 6,000 positions lets subsequent changing questions hit." />
  <figcaption>Top: only stable-first prompts share leading tokens. Bottom: sharing still isn't enough. A later request can reuse only a length that some earlier request actually wrote.</figcaption>
</figure>

Timing matters as well. Two identical requests that arrive together can both miss, since neither has finished writing. A runtime may coordinate in-flight work, but that's an extra mechanism you shouldn't assume. Benchmarks need to say whether the first request completed and whether entries started warm. On a hosted API, check the current rules for minimum cacheable length, supported models, lifetime, and explicit markers, because these change often.[^openai2026promptcaching]

## Price it properly

Caching changes your bill in three categories: fresh input, cache writes, and cache reads. Providers report these differently. Some count total input including cached tokens, and others list them separately, so normalize before you price anything, or you'll count the same tokens twice.

Let $P_u$, $P_w$, and $P_r$ be the per-token prices for ordinary input, writes, and reads. For a prefix of $N$ tokens written once and then read $r$ times,

$$
C_{\mathrm{cache}}=NP_w+rNP_r,\qquad
C_{\mathrm{fresh}}=(r+1)NP_u.
$$

Caching pays off once

$$
r(P_u-P_r)\geq P_w-P_u.
$$

Suppose ordinary input costs one unit, a write 1.25, and a read 0.10. The write premium is 0.25, and each read saves 0.90. So one full read covers it, and everything after that is profit.

<!-- leetllm: test, deps=numpy, output=show, id=reader-prefix-breakeven -->
```python title="cache-break-even.py"
import numpy as np

fresh, write, read = 1.0, 1.25, 0.10
tokens = 6000
reads_grid = np.array([0, 1, 10], dtype=np.int64)
cached_costs = tokens * write + reads_grid * tokens * read
uncached_costs = (reads_grid + 1) * tokens * fresh

for reads, cached, uncached in zip(reads_grid, cached_costs, uncached_costs):
    print(f"{int(reads)} reads: cached={cached:,.0f} "
          f"fresh={uncached:,.0f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
0 reads: cached=7,500 fresh=6,000
1 reads: cached=8,100 fresh=12,000
10 reads: cached=13,500 fresh=66,000
```
<!-- leetllm: output:end -->

Look at the first row. A prefix that's written and never read costs 25% more than no caching at all. That's the failure mode to watch for, and our opening timestamp is the worst version of it: every request writes a new entry and nothing ever reads it. You pay the premium on every call and get no savings. A request that reads only 100 cached tokens and writes much of its remaining 6,000 is still a "hit" on your dashboard, and it can cost you more than a miss.

Output cost, tool charges, and capacity sit outside this equation. [Cost engineering](/learn/llm-cost-engineering-token-economics) brings them together later.

## Cold can beat warm

Here's a trap that catches teams who optimize for cache hits alone. Suppose cold first-token work takes 1,220 ms and warm takes 170 ms, with decode at 880 ms in both. A hit saves 1,050 ms. Excellent.

Now add queueing. Route everything to the worker with the warm cache, and it develops a 1,200 ms queue, while a cold worker has just 20 ms. Client TTFT is then 1,240 ms on the cold worker and 1,370 ms on the warm one. The request did far less work and the user waited longer.

<figure>
  <img src="illustrations/_generated/latency_profile_dark.png" alt="Cold and warm phase bars both include 880 ms of decode. In a separate queueing example, the warm-cache request has 1,370 ms TTFT, compared with 1,240 ms for the cold-cache request." />
  <figcaption>A cache hit saves prefill time, not queue time. When traffic piles onto the warm worker, its queue can outweigh everything the hit saved. Here the warm request reaches its first token 130 ms later.</figcaption>
</figure>

That's why **prefix-affinity routing** has to be one signal among several. With worker-local caches, round-robin can warm the same prefix on every worker, while affinity sends matching prefixes to one worker and warms it once.

<figure>
  <img src="illustrations/_generated/worker_warmup_routing_dark.png" alt="Four sequential requests cause three cold warmups under round-robin and one under fixed prefix affinity." />
  <figcaption>Four requests, three workers. Round-robin pays three cold warmups, and affinity pays one. The price of affinity is a hot worker, so a real router has to weigh queue depth and health too.</figcaption>
</figure>

A good router compares the expected wait on the warm worker against cold processing on an idle one. Mooncake's scheduler is one that does: for each worker, it estimates queue time plus prefill time given the prefix that worker already holds, and it picks the lowest.[^qin2024] Health, tenant eligibility, and deadlines come before any cache preference. Bounded-load consistent hashing gets you part of the way with less machinery: it caps each worker's share of requests and spills the rest to the next worker, so one hot prefix can't bury one GPU.[^mirrokni2018boundedLoads] It doesn't compare wait times, so keep queue depth in the decision.

Scaling out adds another wrinkle: new workers arrive cold, so your aggregate hit rate can fall exactly when capacity grows. If you see that after a scale-up, check cache state and queueing together before you blame the new replicas.

## Cached doesn't mean occupied

A dashboard shows 85% of your KV blocks in use, and someone wants to add GPUs. Before you agree, ask what "in use" means.

A block can hold reusable cache state with no active request depending on it, and such a block can usually be replaced when someone needs the space.[^vllm2026prefix] Take a 1,000-block pool with 450 blocks referenced by active requests, 400 holding cached state with no references, and 150 entirely free. There are 550 blocks available, not 150. Allocating 200 leaves 350, and it has to replace at least 50 cached blocks to get there.

<figure>
  <img src="illustrations/_generated/cached_pool_availability_dark.png" alt="A 1,000-block pool contains 450 referenced blocks, 400 cached unreferenced blocks, and 150 uncached free blocks." />
  <figcaption>A pool that looks 85% full can have 55% of its blocks available. Report live ownership and reusable contents as separate metrics, or you'll scale for a shortage you don't have.</figcaption>
</figure>

Report both numbers. Eviction should cost you hits, latency, and money, and nothing else. It must never corrupt an active request or change a correct answer. If an evicted entry seems to affect output, investigate the cache's identity and ownership logic right away, because that's a real bug.

## Debugging a miss, and a wrong answer

When hit rates drop, work through this in order: the identity fields (model, adapter, template version, scope), the actual leading tokens, whether an entry was written at a usable length, whether it's still there, and where the router sent the request. Log these per request, using safe identifiers rather than raw prompts: model and adapter revision, prefix version, scope, total and reused and fresh input, write counts, route, and timings.

Some providers offer more help. As of November 2026, OpenAI's Responses API can, on GPT-5.6 and later models, compare a request against a recent baseline and report where they diverged. It's best effort, and your usage counts remain the record of what was actually credited.[^openai2026cacheDiagnostics]

Sooner or later someone will blame the cache for a stale answer: the bot keeps enforcing last week's 90-day key rotation rule even though the guide now says 30 days. Don't assume. Check first whether the request really contained the new guide, by inspecting retrieval and rollout versions. Then check whether everything that shapes the computation is in the key. Correct exact keys can't match an edited guide against its old entry. If both are fine, the model simply ignored its instructions, which fresh computation can do too.

That leads to one last distinction. **Prefix state reuse** supplies earlier model state and generates a new answer. An **answer cache** returns a previous answer when a new request seems equivalent. The first can't serve stale content if its keys are right. The second has freshness and correctness problems of its own. Don't let anyone on your team use "the cache" for both.

```checkpoint
After a deploy, your request hit rate holds steady at 90%, but input cost doubles. What's the likely story, and which metric would have caught it?
---
Requests still hit, but reuse far fewer tokens, perhaps because a changing value moved earlier in the prompt. The token hit ratio, weighted by input volume, would have fallen sharply while the binary hit rate stayed flat. Cache write counts would likely rise too.
```

You can now say what a shared prefix saves, who may use it, and when a hit is worth waiting for. The next question is timing. [Continuous batching](/learn/continuous-batching-request-scheduling) decides who gets to use the GPU on each step, how fresh prompt work joins streams already running, and what happens when demand exceeds what the next iteration can hold.

<!-- leetllm: edition:reader:end -->
