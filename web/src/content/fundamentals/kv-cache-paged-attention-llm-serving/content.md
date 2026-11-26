---
{
  "id": "kv-cache-paged-attention-llm-serving",
  "title": "KV Cache & PagedAttention",
  "slug": "kv-cache-paged-attention-llm-serving",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/paged_attention_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic",
    "NVIDIA"
  ],
  "shortDescription": "Paging packs growing KV state into reusable blocks, but a full pool, a shared prefix, and a slow first token are three different problems.",
  "keyConceptsTested": [
    "KV cache role in autoregressive generation",
    "Memory fragmentation in multi-tenant batching",
    "PagedAttention block allocation",
    "Paged kernels vs. contiguous virtual-memory alternatives",
    "Prefill vs decode phase scheduling",
    "Continuous batching vs static batching",
    "PagedAttention vs FlashAttention",
    "Copy-on-write mechanism",
    "RadixAttention & Prefix Caching",
    "Distributed inference and tensor parallelism"
  ],
  "prerequisites": [
    "inference-mechanics-ttft-tps-kv-cache",
    "multi-query-grouped-query-attention"
  ],
  "relatedQuestions": [
    "flashattention-memory-efficient-attention",
    "continuous-batching-request-scheduling",
    "model-parallelism-for-llm-inference",
    "model-quantization-gptq-awq-gguf",
    "positional-encoding-rope-alibi"
  ],
  "section": "GPU Systems & LLM Inference",
  "order": 3,
  "aliases": [
    "prefix-caching-prompt-caching"
  ]
}
---
A coding assistant receives a repository question with system instructions, file excerpts, a failing test, and earlier tool results. Every generated token must attend back to that history. Recomputing every earlier attention projection on every step would turn a response into quadratic replay.

Instead, the engine retains each attention layer's Key ($K$) and Value ($V$) vectors in GPU HBM as the **<span data-glossary="kv-cache">KV cache</span>**. Each decode step projects only the newest token, appends $(k_t, v_t)$, and reads the cached history. <span data-glossary="grouped-query-attention">Grouped-Query Attention (GQA)</span> and <span data-glossary="multi-query-attention">Multi-Query Attention (MQA)</span> shrink each token's footprint, yet placement remains the bottleneck: variable-length requests can strand 60% to 80% of VRAM inside oversized contiguous reservations. **<span data-glossary="pagedattention">PagedAttention</span>** (introduced in <span data-glossary="vllm">vLLM</span>) adapts operating-system paging to store KV state in fixed-size reusable blocks, unlocking near-zero fragmentation, copy-on-write branching, and cross-request **prefix caching** (**RadixAttention** and chained block hashes).[^kwon2023][^sglang2024]

## Why the KV cache exists

In full causal <span data-glossary="self-attention">self-attention</span>, generating token $t+1$ attends over positions $1 \dots t$:[^vaswani2017]

$$
\text{Attention}(q_t, K_{1:t}, V_{1:t}) = \text{softmax}\!\left(\frac{q_t K_{1:t}^T}{\sqrt{d_k}}\right) V_{1:t}
$$

Without a cache, generating $T$ tokens recomputes $1 + 2 + \cdots + T = O(T^2)$ Key/Value projections. Caching writes $k_t$ and $v_t$ once per position ($O(T)$ projections total), though full causal decode still *reads* all $t$ cached positions at step $t$, making long-context decode **memory-bandwidth bound**.[^kwon2023]

<figure>
  <img src="illustrations/_generated/kv_decode_cache_loop_dark.png" alt="Three aligned decode snapshots show one new K/V pair at steps one, two, and five. Earlier pairs stay in the cache and each query reads the visible prefix; future slots remain empty. Full-model Llama 3 8B payloads are 128, 256, and 640 KiB. Pair boxes are a single-head schematic." />
  <figcaption>One new token's K/V pair appends per decode step while the query reads the entire visible history (Llama 3 8B adds 128 KiB per token).</figcaption>
</figure>

## KV cache memory analysis

Every cached token stores both $K$ and $V$ across every layer and KV head:

$$
\text{Bytes per token} = 2 \times n_{\text{layers}} \times n_{\text{kv-heads}} \times d_{\text{head}} \times P_{\text{bytes}}
$$

In <span data-glossary="multi-head-attention">MHA</span>, $n_{\text{kv-heads}} = n_{\text{heads}}$. Under <span data-glossary="grouped-query-attention">GQA</span>, multiple query heads share one KV head: Llama 3 70B has 64 query heads and 8 KV heads, cutting FP16 KV storage $8\times$ from **2.5 MiB/token** down to **320 KiB/token** (`1.25 GiB` at 4K context, `10 GiB` at 32K, `40 GiB` at 128K).[^ainslie2023][^dubey2024]

| Architecture | Layers | KV Heads | $d_{\text{head}}$ | Cache/token (FP16) | 4K Context | 32K Context |
|---|---|---|---|---|---|---|
| **Llama 3 8B** (GQA) | 32 | 8 | 128 | 128 KiB | 512 MiB | 4 GiB |
| **Llama 3 70B** (GQA) | 80 | 8 | 128 | 320 KiB | 1.25 GiB | 10 GiB |
| **GPT-3 175B** (MHA) | 96 | 96 | 128 | 4.5 MiB | 18 GiB | 144 GiB |

<figure>
  <img src="illustrations/_generated/memory_footprint_dark.png" alt="Three equal-width bars partition the same 40 GiB payload-only KV pool. Llama 3 8B fits 80 half-GiB requests, Llama 3 70B fits 32 1.25-GiB requests, and the extrapolated GPT-3 175B shape fits two 18-GiB requests with 4 GiB free. Segment sizes use one common 0-to-40-GiB scale." />
  <figcaption>Raw full-retention KV capacity inside a 40 GiB pool at 4,096 tokens: 80 Llama 3 8B requests, 32 Llama 3 70B requests, or 2 MHA 175B requests.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="calculate-kv-cache-footprint.py"
def cache_gib(layers: int, kv_heads: int, head_dim: int, bytes_per_value: int, tokens: int) -> float:
    return (2 * layers * kv_heads * head_dim * bytes_per_value * tokens) / (1024 ** 3)

for label, heads in [("MHA-64", 64), ("GQA-8", 8), ("MQA-1", 1)]:
    print(f"{label}: {cache_gib(80, heads, 128, 2, 4096):.2f} GiB at 4K tokens")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
MHA-64: 10.00 GiB at 4K tokens
GQA-8: 1.25 GiB at 4K tokens
MQA-1: 0.16 GiB at 4K tokens
```
<!-- leetllm: output:end -->

```checkpoint
For Llama 3 70B (80 layers, 8 KV heads, head dimension 128, FP16), how many bytes does one token add?
---
$2 \times 80 \times 8 \times 128 \times 2 = 327{,}680$ bytes = 320 KiB per token (1.25 GiB at 4K tokens).
```

## Memory fragmentation and PagedAttention

Early serving engines avoided repeated reallocation by reserving one contiguous buffer sized for `max_model_len` (e.g., 8,192 tokens) when each request arrived. That static reservation created three distinct forms of waste totaling 60% to 80% of KV VRAM:[^kwon2023][^vllm2023pagedBlog]

1. **Internal fragmentation:** A request reserves 8,192 slots and stops at token 600, locking 7,592 unused slots until exit.
2. **Reservation waste:** Even slots that a sequence will eventually reach sit idle for hundreds of decode steps.
3. **External fragmentation:** Variable-sized reservations free scattered holes that cannot satisfy a larger contiguous allocation.

<figure>
  <img src="illustrations/_generated/paged_attention_dark.png" alt="Two snapshots of the same ten physical KV blocks. With maximum reservations, A and B each hold five blocks while using three, so C cannot obtain its two blocks. With dynamic allocation, A uses three, B three, and C two, leaving blocks 8 and 9 free." />
  <figcaption>Dynamic block assignment lets C enter the 10-block pool while A and B are growing, whereas upfront max-length reservations lock C out.</figcaption>
</figure>

**PagedAttention** borrows operating-system virtual memory paging:[^kwon2023]

- **Logical blocks** divide each request's token positions into fixed-size pages of $B$ tokens (commonly $B = 16$).
- **Physical blocks** form a uniform pool of fixed-size VRAM slots that need not be contiguous.
- A per-request **block table** translates logical position $i$ to $(\text{block\_table}[\lfloor i / B \rfloor],\; i \bmod B)$.

<figure>
  <img src="illustrations/_generated/paged_block_table_mapping_dark.png" alt="With block size four and valid length five, A maps logical block zero to physical block 19 and logical block one to physical block 7. Positions 0 through 3 fill block 19; position 4 maps by divmod(4, 4) = (1, 0) to block 7 slot 0. The other three slots in block 7 remain owned by A but invalid for attention. B owns separate physical block 12." />
  <figcaption>Request A's block table `[19, 7]` preserves logical token order across scattered physical blocks while `valid_length = 5` excludes the three trailing empty slots in block 7.</figcaption>
</figure>

> **Common mistake:** Passing the block table to an attention kernel without enforcing `valid_length` silently mixes uninitialized trailing slots from the last block into softmax weights. Always test paged attention against a contiguous reference on lengths that are not multiples of the block size.

Paging eliminates external fragmentation inside the uniform pool and caps per-request waste to at most $B - 1$ unfilled slots in the final block ($0\%$ at exact multiples of $B$, $6.25\%$ at 120 tokens with $B=16$). Choosing $B$ trades finer sharing and lower tail waste (smaller $B$) against smaller block tables and more regular vector loads (larger $B$; vLLM's sweet spot is typically 16 or 32).

### Paged kernels vs. contiguous virtual memory (vAttention)

PagedAttention requires attention kernels that follow the block table per warp. In vLLM's original microbenchmark, block-table indirection added 20% to 26% attention-kernel latency over FasterTransformer's contiguous kernel, while recovered VRAM unlocked larger batches for $2\text{--}4\times$ higher end-to-end throughput.[^kwon2023] **vAttention** takes the opposite trade-off: it reserves contiguous *virtual* address ranges and commits physical GPU pages on demand via CUDA virtual-memory APIs, letting unmodified contiguous attention kernels run while shifting complexity into driver page management.[^prabhu2024vattention]

Also keep **PagedAttention** distinct from **<span data-glossary="flashattention">FlashAttention</span>**[^dao2022] and **FlashInfer**:[^ye2025] PagedAttention is a KV memory layout and allocator, whereas FlashAttention/FlashInfer are IO-aware GPU attention kernels that read tiled Q/K/V (including paged KV layouts) with minimal HBM round-trips.

> **Key insight:** PagedAttention trades a small block-table indirection cost for large HBM capacity recovery and fine-grained block sharing. End-to-end throughput climbs whenever recovered VRAM supports larger continuous batches.

## Block manager implementation and read parity

The CPU-side manager below tracks free physical block IDs and per-request block tables, then verifies that gathering $K$ and $V$ through scattered blocks reproduces contiguous attention exactly while excluding invalid trailing slots:

<!-- leetllm: test, deps=numpy, output=show, id=block-manager -->
```python title="implementation-sketch.py"
class PagedKVCacheManager:
    def __init__(self, num_blocks: int, block_size: int):
        self.block_size = block_size
        self.free_blocks: list[int] = list(range(num_blocks))
        self.block_tables: dict[str, list[int]] = {}
        self.seq_lens: dict[str, int] = {}

    def allocate(self, request_id: str) -> None:
        if request_id in self.block_tables:
            raise ValueError(f"request already allocated: {request_id}")
        if not self.free_blocks:
            raise MemoryError("KV block pool exhausted")
        self.block_tables[request_id] = [self.free_blocks.pop()]
        self.seq_lens[request_id] = 0

    def append_slot(self, request_id: str) -> tuple[int, int]:
        blocks = self.block_tables[request_id]
        idx = self.seq_lens[request_id]
        if idx > 0 and idx % self.block_size == 0:
            if not self.free_blocks:
                raise MemoryError("KV block pool exhausted")
            blocks.append(self.free_blocks.pop())
        self.seq_lens[request_id] = idx + 1
        return blocks[-1], idx % self.block_size

    def free(self, request_id: str) -> None:
        if request_id in self.block_tables:
            self.free_blocks.extend(self.block_tables.pop(request_id))
            del self.seq_lens[request_id]

manager = PagedKVCacheManager(num_blocks=20, block_size=4)
manager.allocate("A")
slots = [manager.append_slot("A") for _ in range(5)]
manager.allocate("B")
b_slot = manager.append_slot("B")
manager.free("A")
print("A slots:", slots, "| B slot:", b_slot, "| free after freeing A:", len(manager.free_blocks))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A slots: [(19, 0), (19, 1), (19, 2), (19, 3), (18, 0)] | B slot: (17, 0) | free after freeing A: 19
```
<!-- leetllm: output:end -->

<!-- leetllm: test, output=show, continue=block-manager, id=paged-read-parity -->
```python title="compare-paged-and-contiguous-attention.py"
import numpy as np

pool = PagedKVCacheManager(num_blocks=4, block_size=2)
k_pool = np.full((4, 2, 2), 1000.0, dtype=np.float64)
v_pool = np.full((4, 2, 2), 999.0, dtype=np.float64)
k_seq = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]], dtype=np.float64)
v_seq = np.array([[2.0, 1.0], [0.0, 3.0], [4.0, 2.0]], dtype=np.float64)

def write(req, kv_k, kv_v):
    b, o = pool.append_slot(req)
    k_pool[b, o], v_pool[b, o] = kv_k, kv_v

def read(req):
    n = pool.seq_lens[req]
    return k_pool[[pool.block_tables[req][i // 2] for i in range(n)], [i % 2 for i in range(n)]], \
           v_pool[[pool.block_tables[req][i // 2] for i in range(n)], [i % 2 for i in range(n)]]

def attend(q, k, v):
    s = (k @ q) / np.sqrt(k.shape[-1])
    w = np.exp(s - np.max(s))
    return (w / w.sum()) @ v

pool.allocate("A"); write("A", k_seq[0], v_seq[0])
pool.allocate("B"); write("B", np.array([-1.0, 0.0]), np.array([-5.0, -5.0]))
write("A", k_seq[1], v_seq[1]); write("A", k_seq[2], v_seq[2])

q = np.array([1.0, 0.5], dtype=np.float64)
expected = attend(q, k_seq, v_seq)
actual = attend(q, *read("A"))
assert pool.block_tables["A"] == [3, 1] and np.allclose(actual, expected, atol=1e-12)
assert not np.allclose(attend(q, k_pool[[3, 3, 1, 1], [0, 1, 0, 1]], v_pool[[3, 3, 1, 1], [0, 1, 0, 1]]), expected)
print("A table:", pool.block_tables["A"], "| output:", tuple(round(float(x), 6) for x in actual))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A table: [3, 1] | output: (2.461842, 1.90474)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/paged_read_parity_dark.png" alt="With block size two, A table [3, 1] reads logical positions zero and one from physical block 3 and position two from block 1. Block 1 slot 1 holds an invalid K=(1000,1000), V=(999,999) sentinel and is excluded at valid length three; B owns block 2. For q=(1,0.5), the paged read matches contiguous attention at (2.461842, 1.904740). Mapping A to B or including the sentinel changes the result." />
  <figcaption>A's block table `[3, 1]` reproduces contiguous attention `(2.461842, 1.904740)` while `valid_length = 3` excludes the sentinel tail and B's block.</figcaption>
</figure>

## Copy-on-write branching and prefix caching

Block tables unlock two distinct kinds of KV sharing: **intra-request branching** (beam search, Best-of-N parallel sampling) via reference-counted **Copy-on-Write (CoW)**, and **cross-request reuse** via **prefix caching** / **RadixAttention**.

### Copy-on-write for shared partial blocks

When branches A and B fork from one prompt, both block tables point to the same physical blocks with `ref_count = 2`. Full shared blocks stay read-only while each branch appends into its own new block. The subtle bug sits in a **shared partial block**: if A and B share 3 slots of a 4-slot block, letting both write into slot 3 lets B overwrite A's token in place. Trigger CoW whenever `ref_count > 1`: copy the 3 valid slots into a private block for A, decrement the original block's count to `1`, and let B write the original in place.[^kwon2023]

<!-- leetllm: test, output=show -->
```python title="isolate-shared-partial-block-writes.py"
storage = [[10, 20, 30, None], [None] * 4]
tail_blocks, refs, free = {"A": 0, "B": 0}, {0: 2, 1: 0}, [1]

def append_fourth(branch, val):
    old = tail_blocks[branch]
    if refs[old] > 1:
        new = free.pop()
        storage[new] = storage[old][:3] + [None]
        tail_blocks[branch] = new
        refs[old] -= 1
        refs[new] = 1
    storage[tail_blocks[branch]][3] = val

append_fourth("A", 90)
append_fourth("B", 80)
print("isolated branches:", {k: storage[b] for k, b in tail_blocks.items()}, "| refs:", refs)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
isolated branches: {'A': [10, 20, 30, 90], 'B': [10, 20, 30, 80]} | refs: {0: 1, 1: 1}
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/shared_partial_block_cow_dark.png" alt="A and B begin on shared physical block 0 with values 10, 20, 30 and one empty slot, reference count two. Without copy-on-write, B overwrites A’s appended 90 with 80. In the safe branch A copies only the three valid values to block 1 and writes 90; B keeps block 0 and writes 80. Each block then has one owner." />
  <figcaption>Copy-on-write clones the three valid slots into block 1 for branch A before writing 90, leaving B as sole owner of block 0.</figcaption>
</figure>

> **Common mistake:** Appending into a shared *partial* KV block without checking `ref_count > 1` lets sibling beams overwrite each other's latest token in place, even when the target slot is currently empty.

### Prefix caching, RadixAttention, and cache-hit TTFT math

In causal self-attention, position $t$ depends only on positions $0 \dots t$. When separate requests share an identical prefix (system prompt, repository guide, tool schemas), **prefix caching** (called **prompt caching** on hosted APIs) keeps those completed KV blocks reusable across requests. Editing even one token near position 0 invalidates every downstream block!

Serving engines index reusable prefixes in two main ways:

| Engine | Indexing structure | Lookup and eviction |
|---|---|---|
| **vLLM** (Automatic Prefix Caching)[^vllm2026prefix] | Hash table over fixed-size PagedAttention blocks | Chains each block hash $H_k = \text{hash}(\text{serialize}(H_{k-1}, \text{token\_ids}_k, \text{extras}_k))$ including LoRA ID and `cache_salt`; evicts unreferenced blocks via LRU |
| **SGLang** (<span data-glossary="radixattention">RadixAttention</span>)[^sglang2024] | Compressed <span data-glossary="radix-tree">radix tree</span> (token trie) | Traverses shared token edges, splits edges on divergence, and evicts unreferenced leaves via LRU |

Suppose 100 requests share a 1,000-token prompt with 16-token blocks: 62 complete blocks (`992` tokens) are shared once while each request keeps 1 private tail block (`8` tokens), dropping occupied prefix blocks from `6,300` to `162` (**97.4% reduction**). Even on an exact 1,008-token match, vLLM recomputes the final block so it can emit next-token logits.[^vllm2026kvmanager0280]

<figure>
  <img src="illustrations/_generated/prefix_reuse_boundary_dark.png" alt="For 100 compatible requests with a warm full-attention 1,000-token prefix and 16-token blocks, one shared run occupies 62 full blocks and the requests keep 100 private tail blocks: 162 occupied blocks instead of 6,300. At prompt lengths 1,000, 1,008, and 1,009, the aligned hit rule reuses 992, 992, and 1,008 tokens and recomputes 8, 16, and 1." />
  <figcaption>Complete blocks share across requests while each request keeps a private tail block; even an exact 1,008-token match recomputes its last 16-token block for next-token logits.</figcaption>
</figure>

On prefill latency, consider three requests sharing a **6,000-token** guide with question tails of `48`, `37`, and `51` tokens: fresh prefill drops from `18,136` tokens to `6,136` tokens (saving `12,000` prefill tokens). Warm prefill can drop from `1,220 ms` to `170 ms` (saving `1,050 ms` on <span data-glossary="ttft">TTFT</span>), while decode latency stays unchanged (`880 ms`) because decode still reads the cached prefix.

Four operational rules govern production prefix caching:

1. **Static-first prompt layout and hosted break-even economics:** Put immutable instructions, guides, and tool schemas first, and dynamic timestamps, retrieved chunks, and user queries last. On hosted APIs with a cache write surcharge (e.g., $1.25\times$ for 5-min TTL or $2.0\times$ for 1-hour TTL) and discounted reads ($0.10\times$),[^openai2026pricing][^anthropic2026pricing] full-prefix break-even reads equal:
   $$
   \text{Break-Even Reads} = \left\lceil \frac{\text{Write Rate} - 1.0}{1.0 - \text{Read Rate}} \right\rceil
   $$
   That repays a $1.25\times$ write in **1 read** and a $2.0\times$ write in **2 reads**. Beware partial hits: paying $1.25\times$ writes on an initial 6,000-token call and then reusing only 1,024 of 6,000 tokens (with $1.25\times$ writes on the remaining 4,976 tokens) across three follow-up calls costs **10.3% more** than uncached input! Always report **volume-weighted token hit ratio** ($\sum \text{cached} / \sum \text{prompt}$) rather than binary request hits, and normalize provider schemas (OpenAI `input_tokens` includes `cached_tokens`; Anthropic `input_tokens` excludes `cache_read_input_tokens`).
2. **Cached does not mean occupied:** Completed requests leave blocks **cached but unreferenced** on the free queue. In a 1,000-block pool with 450 referenced, 400 cached-unreferenced, and 150 free blocks, **550 blocks** are allocatable without preempting active requests.
3. **Prefix-affinity routing vs. queueing inversion:** Sending repeat prefixes to one warm replica saves cold warmups, yet if queueing on a hot worker jumps from `20 ms` to `1,200 ms` while prefill drops from `1,220 ms` to `170 ms`, client TTFT actually gets **130 ms slower** (`1,370 ms` vs. `1,240 ms`). Pair prefix affinity with queue-depth caps or bounded-load consistent hashing.[^mirrokni2018boundedLoads]
4. **Server-derived tenant isolation:** Because cache hits return faster, sharing prefixes across untrusted tenants opens a timing side-channel. Bind `cache_salt` strictly from server-verified authentication, never from raw client headers.[^vllm2026prefix]

<!-- leetllm: test, output=show -->
```python title="prefix-hash-and-economics.py"
from hashlib import sha256
from math import ceil
import json

def chain(salt: str, blocks: list[str]) -> list[str]:
    parent, out = salt, []
    for blk in blocks:
        parent = sha256(json.dumps([parent, blk], separators=(",", ":")).encode()).hexdigest()
        out.append(parent)
    return out

v1 = chain("tenant-a", ["sys", "guide-v1", "tools"])
v2 = chain("tenant-a", ["sys", "guide-v2", "tools"])
tb = chain("tenant-b", ["sys", "guide-v1", "tools"])
print("v1 vs v2 hits:", [a == b for a, b in zip(v1, v2)], "| cross-tenant collision:", any(a == b for a, b in zip(v1, tb)))

# 3 requests sharing 6,000 prefix tokens + tails [48, 37, 51]
tails = [48, 37, 51]
print(f"Fresh prefill tokens: {sum(6000 + t for t in tails)} -> {6000 + sum(tails)} (saved {2 * 6000})")
print(f"Break-even reads (1.25x / 2.0x write, 0.10x read): {ceil(0.25 / 0.90)} / {ceil(1.0 / 0.90)}")

usage = [(0, 6000)] + [(1024, 4976)] * 3
uncached = sum(r + w for r, w in usage)
cached = sum(0.10 * r + 1.25 * w for r, w in usage)
print(f"Partial-hit trap: uncached={uncached} vs cached={cached:.1f} ({cached / uncached - 1:+.1%})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
v1 vs v2 hits: [True, False, False] | cross-tenant collision: False
Fresh prefill tokens: 18136 -> 6136 (saved 12000)
Break-even reads (1.25x / 2.0x write, 0.10x read): 1 / 2
Partial-hit trap: uncached=24000 vs cached=26467.2 (+10.3%)
```
<!-- leetllm: output:end -->

## Preemption, pool exhaustion, and continuous batching

PagedAttention pairs naturally with **<span data-glossary="continuous-batching">continuous batching</span>** (iteration-level scheduling from Orca[^yu2022]): as soon as a short request emits EOS, its blocks return to the pool and a waiting request enters on the next iteration instead of waiting for the longest sequence in a static batch.

When the block pool fills completely under heavy load, two invariants protect correctness and recovery:

1. **Failed allocation must preserve state:** A rejected `append_slot` leaves block tables, lengths, and ownership untouched, and duplicate `free()` calls must never insert a physical block ID into the free list twice (which would alias two live customers onto the same KV memory).
2. **Recompute vs. swap preemption:** vLLM V1 defaults to **recomputation** (releasing preempted blocks and replaying tokens on resume, spending GPU FLOPs rather than PCIe bandwidth), whereas legacy V0 also supported **CPU swapping** (moving blocks over PCIe to host RAM and back).[^kwon2023][^vllm2026optimization] Optional KV-offloading connectors also allow tiering reusable blocks to CPU/SSD (as in Mooncake[^qin2024]).

<!-- leetllm: test, output=show, continue=paged-read-parity -->
```python title="retry-after-block-pool-exhaustion.py"
tiny = PagedKVCacheManager(num_blocks=2, block_size=4)
tiny.allocate("A"); tiny.allocate("B")
for _ in range(4):
    tiny.append_slot("A")

before = (tuple(tiny.free_blocks), {k: tuple(v) for k, v in tiny.block_tables.items()}, dict(tiny.seq_lens))
try:
    tiny.append_slot("A")
except MemoryError as err:
    print("blocked:", err)
assert (tuple(tiny.free_blocks), {k: tuple(v) for k, v in tiny.block_tables.items()}, dict(tiny.seq_lens)) == before

tiny.free("B"); tiny.free("B")  # Idempotent release prevents double-free aliasing.
assert tiny.free_blocks == [0]
print("retry after freeing B:", tiny.append_slot("A"), "| A table:", tiny.block_tables["A"])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
blocked: KV block pool exhausted
retry after freeing B: (0, 0) | A table: [1, 0]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/pool_exhaustion_state_dark.png" alt="A two-block, four-slot manager starts with A owning block 1 at length four and B owning empty block 0 at length zero. A fifth append raises MemoryError because the free list is empty and leaves both tables, lengths, and blocks unchanged. Freeing B twice returns block 0 once; retry writes slot (0, 0), giving A table [1, 0] and length five." />
  <figcaption>A failed append leaves A and B intact; idempotent release returns block 0 once so A's retry succeeds cleanly.</figcaption>
</figure>

## Capacity levers beyond paging

Paging eliminates fragmentation waste, not raw KV bytes per token. When every request fills its context window (e.g., Llama 3 70B at 128K = `40 GiB` in FP16), shrink or relocate the state using complementary levers:

| Lever | What it changes | Primary trade-off |
|---|---|---|
| **GQA / MQA / MLA**[^ainslie2023][^deepseekv2_2024] | Architectural KV heads or low-rank latent cache | Fixed at model architecture/training time |
| **KV Quantization (FP8 / KIVI)**[^liu2024kivi] | Stored precision per value (FP8 halves raw bytes) | Requires kernel support, scale factors, and accuracy validation |
| **Token Eviction (SnapKV / H2O)**[^li2024snapkv][^zhang2023h2o] | Drops low-attention KV positions from history | Lossy; can drop facts needed by later turns |
| **Chunked Prefill & Disaggregation**[^agrawal2023][^zhong2024] | Bounds prefill interference with active decode steps | Disaggregation adds RDMA KV transfer and pool coordination |
| **Tensor Parallelism (TP)**[^kwon2023] | Shards KV heads across ranks (only when `n_kv_heads % TP == 0`) | Always budget **per rank**; indivisible TP replicates KV heads |

```mastery-quiz
[
  {
    "question": "A model has 40 layers, 16 query heads, 4 KV heads, head dimension 64, and FP16 cache values. How much raw KV cache does one 4,096-token request need?",
    "options": [
      "640 MiB",
      "160 MiB",
      "80 MiB",
      "40 MiB"
    ],
    "answer": "160 MiB",
    "explanation": "2 x 40 x 4 x 64 x 2 = 40,960 bytes (40 KiB) per token. Over 4,096 tokens, that is 160 MiB. Using 16 query heads gives 640 MiB, while 80 MiB omits K/V doubling or 2-byte FP16."
  },
  {
    "question": "A paged KV cache uses 16-slot blocks, positions start at 0, and a request's block table is [7, 2, 9]. Where does the kernel read K and V for position 35?",
    "options": [
      "Physical block 2, slot 4",
      "Physical block 9, slot 3",
      "Physical block 9, slot 4",
      "Physical block 2, slot 3"
    ],
    "answer": "Physical block 9, slot 3",
    "explanation": "Logical block floor(35 / 16) = 2 maps via block_table[2] to physical block 9, and slot offset is 35 mod 16 = 3."
  },
  {
    "question": "Three beam-search branches are the only owners of a single 8-slot KV block. The engine uses copy-on-write, and each branch appends a different token. How many physical blocks hold the branches' tokens after all three appends if the block starts with 7 tokens? How many if it starts with 8?",
    "options": [
      "2 blocks if partly filled and 3 if full.",
      "3 blocks if partly filled and 3 if full.",
      "2 blocks if partly filled and 4 if full.",
      "3 blocks if partly filled and 4 if full."
    ],
    "answer": "3 blocks if partly filled and 4 if full.",
    "explanation": "With 7 tokens, the first two writers each copy into a private block while the third keeps the original (3 blocks). With 8 tokens, the full block stays shared while each branch allocates a new block (4 blocks)."
  },
  {
    "question": "Fifty requests start with the same 500-token prompt. The engine shares only complete 32-token blocks between requests, and all of those blocks are already cached. How many physical blocks hold this prompt's K/V state across the fifty requests?",
    "options": [
      "16 blocks",
      "800 blocks",
      "15 blocks",
      "65 blocks"
    ],
    "answer": "65 blocks",
    "explanation": "500 = 15 x 32 + 20, so 15 complete blocks are shared once and each of the 50 requests keeps 1 private tail block: 15 + 50 = 65 blocks."
  },
  {
    "question": "A hosted prompt cache charges 2.5x base input price to write an entry and 0.40x to read it. How many full-prefix cache reads are needed to break even, and why can prefix-affinity routing still worsen client TTFT?",
    "options": [
      "2 reads; cached blocks cannot be read in parallel across attention layers.",
      "3 reads; queuing behind a hot replica can add more wait time than warm prefill saves.",
      "3 reads; cache hits increase autoregressive decode time on every generated token.",
      "4 reads; cached blocks double HBM bandwidth usage during subsequent prefills."
    ],
    "answer": "3 reads; queuing behind a hot replica can add more wait time than warm prefill saves.",
    "explanation": "Break-even reads = ceil((2.5 - 1.0) / (1.0 - 0.40)) = ceil(1.5 / 0.60) = ceil(2.5) = 3. Two reads recover only 1.2x against the 1.5x write surcharge. Even with warm cache hits, if queueing on a hot prefix replica grows by more than the saved prefill duration, end-to-end client TTFT becomes slower."
  },
  {
    "question": "A KV pool is full, so the scheduler preempts a request with 6,400 cached tokens at 320 KiB per token. The CPU link moves 2,500 MiB/s in either direction. If the scheduler drops the cache, the GPU replays all 6,400 tokens at 12,800 tokens/s. How much time does round-trip swapping take versus GPU replay?",
    "options": [
      "0.8 s to swap and 0.5 s to replay.",
      "1.6 s to swap and 2.0 s to replay.",
      "0.8 s to swap and 2.0 s to replay.",
      "1.6 s to swap and 0.5 s to replay."
    ],
    "answer": "1.6 s to swap and 0.5 s to replay.",
    "explanation": "The cache holds 6,400 x 320 KiB = 2,000 MiB. Swapping out and back takes 2 x (2,000 / 2,500) = 1.6 s, whereas GPU recomputation takes 6,400 / 12,800 = 0.5 s."
  }
]
```

> **Next:** Continue to [FlashAttention & Memory Efficiency](/learn/flashattention-memory-efficient-attention).
