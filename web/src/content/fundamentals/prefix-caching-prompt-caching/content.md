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
Three developers ask a coding assistant different questions about the same repository. Every request starts with the exact same **6,000 shared tokens**: 600 of instructions, a 4,200-token architecture guide, an 800-token tool schema, and 400 tokens of examples, followed by a short 48-, 37-, or 51-token question. Why recompute those 6,000 tokens from scratch three times?

Whereas [standard KV caching](/learn/kv-cache-paged-attention-llm-serving) keeps Key-Value tensors alive *inside* one generating request, **prefix caching** (often called **prompt caching** on hosted APIs) keeps compatible KV state reusable *across* separate requests. On a warm hit, the server skips <span data-glossary="prefill">prefill</span> for the 6,000-token prefix and processes only the new question tail, trimming total fresh prefill work across those three requests from **18,136 tokens** down to **6,136 tokens** (saving 12,000 repeated prefix positions!). Notice what a hit does *not* skip: the new question still attends to those 6,000 cached tokens, and every output token still decodes autoregressively.

<figure>
  <img src="illustrations/_generated/prefix_cache_dark.png" alt="A proportional 6,000-position prefix contains 600 instruction, 4,200 repository-guide, 800 tool-schema, and 400 example positions. One cold request stores 375 complete 16-position KV blocks. Two warm questions reuse the prefix and compute tails of 37 and 51 positions. Across all three requests, fresh input work falls from 18,136 to 6,136, avoiding 12,000 repeated-prefix positions. An enlarged inset compares question tails of 48, 37, and 51 positions. Editing token zero causes a lookup miss while the old entry may remain stored." />
  <figcaption>One cold request writes 375 complete 16-token KV blocks (6,000 tokens); two warm requests reuse them and freshly process only their 37- and 51-token question tails.</figcaption>
</figure>

## How causal attention makes prefix lookup work

In causal self-attention, position $t$ depends only on positions $0 \dots t$. Appending a new user question leaves the earlier prefix's KV tensors mathematically unchanged. Flip that dependency around and you immediately see the golden rule of prefix caching: **changing even one token near position 0 invalidates every block after it**, even if a downstream tool schema is byte-for-byte identical.

Serving engines index reusable prefix history in two main ways:

| Engine | Indexing structure | How it finds shared prefixes |
|---|---|---|
| **<span data-glossary="sglang">SGLang</span>** (<span data-glossary="radixattention">RadixAttention</span>)[^sglang2024] | Compressed <span data-glossary="radix-tree">radix tree</span> (token trie) | Traverses shared token edges, splits on divergence, evicts unreferenced leaves via LRU |
| **<span data-glossary="vllm">vLLM</span>** (automatic prefix caching)[^vllm2026prefix][^kwon2023] | Hash table over fixed-size <span data-glossary="pagedattention">PagedAttention</span> blocks (e.g., 16 tokens) | Chains each block's hash from its parent hash, block token IDs, and extras (adapter ID, multimodal hashes, `cache_salt`) |

$$
H_k = \text{hash}\bigl(\text{serialize}(H_{k-1},\ \text{token\_ids}_k,\ \text{extras}_k)\bigr)
$$

Because each block hash incorporates $H_{k-1}$, editing the repository guide in block 1 automatically changes the key for an identical `tools` schema in block 2:

<figure>
  <img src="illustrations/_generated/block_hash_tree_dark.png" alt="One system block, digest prefix 314414, branches to two guide blocks. Guide v1 hashes to f6015e and guide v2 hashes to 79a94c. Both branches then contain the same tools block text, but the child digest prefixes differ: 6223fb and a238c9. These short hashes come from the article teaching serialization." />
  <figcaption>Chained block hashes propagate history: editing `guide` in block 1 produces a different hash for an identical `tools` block downstream.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="prefix-hash-chain-and-savings.py"
from hashlib import sha256
import json

def chain(blocks: list[str]) -> list[str]:
    parent, out = "root", []
    for block in blocks:
        parent = sha256(json.dumps([parent, block], separators=(",", ":")).encode()).hexdigest()
        out.append(parent)
    return out

v1 = chain(["system", "repo guide v1", "tools"])
v2 = chain(["system", "repo guide v2", "tools"])
for i, (a, b) in enumerate(zip(v1, v2)):
    print(f"block {i}: {'hit' if a == b else 'miss'} ({a[:8]} vs {b[:8]})")

# 3 requests sharing 6,000 prefix tokens with tails [48, 37, 51]
tails = [48, 37, 51]
cold_total = sum(6000 + t for t in tails)
warm_total = 6000 + sum(tails)
print(f"Fresh prefill tokens: {cold_total} -> {warm_total} (saved {cold_total - warm_total})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
block 0: hit (22cf4e05 vs 22cf4e05)
block 1: miss (a61da758 vs ade5ea71)
block 2: miss (899d5a08 vs 0ff9041f)
Fresh prefill tokens: 18136 -> 6136 (saved 12000)
```
<!-- leetllm: output:end -->

## Static-first prompt layout and hosted cache economics

To maximize reuse, order prompts **static-first, dynamic-last**: system instructions, shared repository guides, tool schemas (Anthropic renders `tools`, then `system`, then `messages`[^anthropic2026promptcaching]), and few-shot examples at the top; timestamps, request IDs, retrieved chunks, and user turns at the bottom. Make serialization strictly deterministic (consistent line endings, sorted JSON keys where order is irrelevant, stable tool ordering).

On hosted APIs such as OpenAI Responses and Anthropic Messages, a shared prefix only hits when a prior request **actually wrote a cache entry at a matching boundary** above the model's minimum token threshold.[^openai2026promptcaching][^anthropic2026promptcaching] Writing only the complete 6,048-token first request stores no standalone 6,000-token boundary unless you place an explicit breakpoint (`prompt_cache_breakpoint` / `cache_control: {"type": "ephemeral"}`) right after the stable guide!

<figure>
  <img src="illustrations/_generated/prompt_boundary_entries_dark.png" alt="Stable-first requests share three leading units; variable-first requests share zero leading units even though their later guide and tools match. An automatic write stores 6,048 tokens including the first question, so a later 6,037- or 6,000-token request reuses zero. Placing an explicit marker at 6,000 guide tokens keeps each question outside the stored entry so later requests reuse 6,000 tokens." />
  <figcaption>Static-first ordering creates a shared prefix (top); an explicit breakpoint at 6,000 tokens keeps changing questions out of the written cache entry (bottom).</figcaption>
</figure>

Hosted prompt caching introduces a **write surcharge** (e.g., $1.25\times$ base input for 5-minute TTL or $2.0\times$ for 1-hour TTL) paid back by deeply discounted **cache reads** (e.g., $0.10\times$ or lower depending on model).[^openai2026pricing][^anthropic2026pricing] Full-prefix break-even reads follow directly:

$$
\text{Break-Even Reads} = \left\lceil \frac{\text{Write Rate} - 1.0}{1.0 - \text{Read Rate}} \right\rceil
$$

At $0.10\times$ reads, a $1.25\times$ write repays itself in **1 read** ($\lceil 0.25 / 0.90 \rceil = 1$), and a $2.0\times$ write repays itself in **2 reads**. Watch out for partial hits combined with repeated writes: if only 1,024 of 6,000 tokens stay stable and the remaining 4,976 tokens incur $1.25\times$ write charges on every request, three "cache hits" end up **10.3% more expensive** than uncached input!

<figure>
  <img src="illustrations/_generated/cache_write_economics_dark.png" alt="Four 6,000-token requests contain one cold write and three partial reads. With 0.10-times reads and 1.25-times writes, the cached input bill is 26,467.2 units compared with 24,000 uncached units, even though three requests report reads. Full-prefix reuse repays the five-minute write premium in one read and the one-hour premium in two." />
  <figcaption>Three partial hits (1,024 read + 4,976 written each) cost 10.3% more than four uncached requests when write premiums dominate.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="cache-boundary-and-write-economics.py"
from math import ceil

# 1. Explicit boundary write unlocks reuse for a different question tail.
guide = (7,) * 6000
entries = {guide + (11,) * 48}
second = guide + (12,) * 37
longest = lambda toks, offs: max((e for e in offs if toks[:e] in entries), default=0)
before = longest(second, [len(second), len(guide)])
entries.add(guide)
after = longest(second, [len(second), len(guide)])
print(f"Reused tokens without/with guide breakpoint: {before} / {after}")

# 2. Break-even full reads and partial-hit write trap.
for ttl, w_rate in [("5m", 1.25), ("1h", 2.0)]:
    print(f"{ttl} tier (write={w_rate}x, read=0.10x): break-even = {ceil((w_rate - 1.0) / 0.90)} read(s)")

usage = [(0, 6000)] + [(1024, 4976)] * 3
uncached = sum(r + w for r, w in usage)
cached = sum(0.10 * r + 1.25 * w for r, w in usage)
print(f"Partial-hit trap: uncached={uncached:.0f} vs cached={cached:.1f} ({cached/uncached - 1:+.1%})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Reused tokens without/with guide breakpoint: 0 / 6000
5m tier (write=1.25x, read=0.10x): break-even = 1 read(s)
1h tier (write=2.0x, read=0.10x): break-even = 2 read(s)
Partial-hit trap: uncached=24000 vs cached=26467.2 (+10.3%)
```
<!-- leetllm: output:end -->

> **Common mistake:** Normalize provider usage schemas before computing savings! OpenAI's Responses API `input_tokens` already *includes* `cached_tokens` and `cache_write_tokens`, whereas Anthropic's `input_tokens` *excludes* `cache_read_input_tokens` and `cache_creation_input_tokens`. And always report **token hit ratio** ($\sum \text{cached} / \sum \text{prompt}$) rather than binary request hit counts: a 600-token hit and a 6,000-token hit both count as "1 hit" while differing $10\times$ in savings.

## Routing, queueing, VRAM availability, and tenant isolation

In a multi-replica deployment with worker-local caches, **round-robin** forces every replica to warm the same prefix cold, while **prefix-affinity routing** sends repeat prefixes to one warm GPU.[^sglang2024] Yet blind affinity creates a classic latency inversion: if warm prefill drops from 1,220 ms to 170 ms (saving 1,050 ms), while queueing behind a hot prefix balloons from 20 ms to 1,200 ms, client <span data-glossary="ttft">TTFT</span> actually gets **130 ms slower** (1,370 ms vs. 1,240 ms)! Production routers combine prefix affinity with queue-depth estimation (as in Mooncake[^qin2024]) or bounded-load consistent hashing[^mirrokni2018boundedLoads] so overloaded warm workers spill to idle replicas.

<figure>
  <img src="illustrations/_generated/worker_warmup_routing_dark.png" alt="Four sequential requests reach three initially cold workers. Round-robin causes three cold warmups; fixed prefix affinity sends all four requests to GPU B, causing one cold warmup. Worker state is shown after each trace. Health and load may send a request elsewhere." />
  <figcaption>Across three cold replicas, round-robin pays three cold warmups while prefix affinity pays one.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/latency_profile_dark.png" alt="Phase timings on a common 2,100-ms scale: cold input processing takes 1,220 ms followed by 880 ms of decode; warm input processing takes 170 ms followed by the same 880-ms decode. In a queued request trace, queueing rises from 20 to 1,200 ms, so TTFT increases from 1,240 to 1,370 ms despite 1,050 ms less first-token work." />
  <figcaption>A prefix hit cuts prefill from 1,220 ms to 170 ms (leaving decode unchanged at 880 ms), but heavy queueing on a hot worker can still make client TTFT worse.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/cache_observability_dark.png" alt="Two requests each count as a hit but reuse 99.2% and 9.9% of prompt tokens. By prefix version, guide-v6 has one hit and 99.2% token reuse; guide-v7 has two hits and 54.6% token reuse. The ratio uses summed reused input tokens over summed prompt tokens." />
  <figcaption>Slice volume-weighted token hit ratios by prefix version so a 9.9% partial hit does not masquerade behind a 100% binary request hit counter.</figcaption>
</figure>

Three operational facts round out production prefix caching:

1. **Cached does not mean occupied:** In vLLM V1's block pool, completed requests leave blocks **cached but unreferenced** on the free queue.[^vllm2026prefix] In a 1,000-block pool with 450 referenced blocks, 400 cached-unreferenced blocks, and 150 free blocks, **550 blocks are available** for new allocations (allocating 200 blocks evicts at least 50 cached blocks cleanly via LRU without hurting live requests).
2. **Scope cache keys from verified identity:** Because a cache hit returns faster, sharing a prefix cache across untrusted tenants opens a timing side-channel. Derive the namespace salt (`cache_salt` in vLLM[^vllm2026prefix]) strictly from server-verified authentication, never from an untrusted caller header!
3. **Prefix cache vs. [semantic answer cache](/learn/semantic-caching-cost-latency-optimization):** Prefix caching reuses exact prompt KV tensors and generates a fresh answer (so editing a guide from 90-day to 30-day rotation automatically misses its old key[^openai2026cacheDiagnostics]). If a bot still quotes the old rule, check whether the prompt renderer actually sent the new guide or whether a separate <span data-glossary="semantic-cache">semantic cache</span> returned an old answer.

<figure>
  <img src="illustrations/_generated/cached_pool_availability_dark.png" alt="A 1,000-block snapshot has 450 referenced, 400 cached but unreferenced, and 150 uncached free blocks. The two unreferenced groups provide 550 available blocks; allocating 200 leaves 350 and replaces at least 50 cached blocks. Actual eviction order can vary, and referenced blocks remain owned." />
  <figcaption>In a 1,000-block pool, 400 cached-unreferenced blocks plus 150 free blocks yield 550 allocatable blocks.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/authenticated_cache_scope_dark.png" alt="A gateway authenticates session-b to tenant-beta and ignores its untrusted alpha claim. From the root hash trie, separate verified namespace salts give tenant-alpha and tenant-beta disjoint KV block keys even for identical system, guide, and tools text." />
  <figcaption>Binding server-verified tenant identity into the root salt isolates identical prefixes across tenants.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="pool-availability-and-tenant-scope.py"
from hashlib import sha256
import json

# 1. Available KV blocks = cached_unreferenced + uncached_free
pool = {"referenced": 450, "cached_unreferenced": 400, "uncached_free": 150}
available = pool["cached_unreferenced"] + pool["uncached_free"]
alloc = 200
print(f"Available blocks: {available} -> after allocating {alloc}: {available - alloc} (min evicted={max(0, alloc - pool['uncached_free'])})")

# 2. Server-derived tenant salt blocks forged client labels
verified_sessions = {"session-a": "tenant-alpha", "session-b": "tenant-beta"}
def gateway_key(session: str, prefix: str) -> str:
    principal = verified_sessions[session]
    return sha256(json.dumps([principal, prefix], separators=(",", ":")).encode()).hexdigest()

k_alpha = gateway_key("session-a", "private-guide-v7")
k_beta = gateway_key("session-b", "private-guide-v7")
print("Cross-tenant key collision:", k_alpha == k_beta)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Available blocks: 550 -> after allocating 200: 350 (min evicted=50)
Cross-tenant key collision: False
```
<!-- leetllm: output:end -->

```checkpoint
Can requests still register cache hits right after you edit a repository guide?
---
Yes. Blocks preceding the edit (such as static system instructions) still match and count as a binary hit, while the edited guide and everything after it miss. Always inspect token hit ratio and prefix version alongside binary hit counts.
```

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
    "explanation": "The guide needs 240 more tokens to reach 2,100. Marking the checklist after the guide gives 2,120 stable tokens. Marking the glossary gives only 2,080. Appending the checklist after the question leaves the original guide marker at 1,860. Marking the question after the glossary reaches 2,400 but includes the changing question in the write."
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
    "explanation": "Marker 31 searches 31 through 12 and reaches entry 12. Marker 60 searches 60 through 41 and misses entry 40. Adding marker 40 directly reaches the available endpoint 40, extending the longest reused initial prefix."
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
    "explanation": "The first write costs 4000×1.25 = 5000. Each later row costs 1500×0.10 + 2500×1.25 = 3275. Total 5000 + 2×3275 = 11550, saving 450 relative to 12000."
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
    "explanation": "Queue wait precedes first-token computation here. A arrives at 600+80 = 680 ms; B at 50+500 = 550 ms. B completes at 550+700 = 1250 ms."
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
    "explanation": "OpenAI input_tokens already includes the three disjoint input buckets: ordinary = 4096−1024−2048 = 1024. Claude ordinary input excludes the read and write portions, so add 1024+1024+2048 = 4096. Each read fraction is 1024/4096 = 25%."
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
    "explanation": "Use the 26 uncached free blocks, then replace 9 cached unreferenced entries. Referenced ownership rises to 53+35 = 88; cached unreferenced entries fall to 41−9 = 32."
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
    "explanation": "The adapter changes the computation that produced R1’s guide state, so matching guide tokens cannot validate the A entry for B. R2 preserves the guide’s full starting tokens and computation identity; a later timestamp does not change that earlier prefix."
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
    "explanation": "A sent v3, so render A from v4. B already sent v4 and read zero prefix tokens, so bypass the answer cache to see what the model generates fresh."
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
    "explanation": "The first 4480 positions match, exactly 140 full blocks. Fresh input is (5120−4480)+80 = 720, above 700."
  }
]
```

> **Next:** Continue to [FlashAttention & Memory Efficiency](/learn/flashattention-memory-efficient-attention). Prefix caching can skip repeated prefill, but a hit still runs attention over those cached KV <span data-glossary="tensor">tensors</span>. <span data-glossary="flashattention">FlashAttention</span> attacks that remaining memory traffic inside each attention kernel.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
Someone on your team adds one helpful line to the top of the system prompt: `Current time: 2026-05-14 14:22:18`. The change passes review. Tests pass. Nothing breaks. A week later the input bill has tripled and first-token latency has jumped, and nobody can say why, because every dashboard still shows the same traffic.

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

Some hosted APIs also expose cache diagnostics (for instance, OpenAI's Responses API can compare a request against a recent baseline and pinpoint where their prefixes diverged, while usage counts remain the billing record).[^openai2026cacheDiagnostics]

Sooner or later someone will blame the cache for a stale answer: the bot keeps enforcing last week's 90-day key rotation rule even though the guide now says 30 days. Don't assume. Check first whether the request really contained the new guide, by inspecting retrieval and deployed prompt versions. Then check whether everything that shapes the computation is in the key. Correct exact keys can't match an edited guide against its old entry. If both are fine, the model simply ignored its instructions, which fresh computation can do too.

That leads to one last distinction. **Prefix state reuse** supplies earlier model state and generates a new answer. An **answer cache** returns a previous answer when a new request seems equivalent. The first can't serve stale content if its keys are right. The second has freshness and correctness problems of its own. Don't let anyone on your team use "the cache" for both.

```checkpoint
After a deploy, your request hit rate holds steady at 90%, but input cost doubles. What's the likely story, and which metric would have caught it?
---
Requests still hit, but reuse far fewer tokens, perhaps because a changing value moved earlier in the prompt. The token hit ratio, weighted by input volume, would have fallen sharply while the binary hit rate stayed flat. Cache write counts would likely rise too.
```

You can now say what a shared prefix saves, who may use it, and when a hit is worth waiting for. The next question is timing. [Continuous batching](/learn/continuous-batching-request-scheduling) decides who gets to use the GPU on each step, how fresh prompt work joins streams already running, and what happens when demand exceeds what the next iteration can hold.

<!-- leetllm: edition:reader:end -->
