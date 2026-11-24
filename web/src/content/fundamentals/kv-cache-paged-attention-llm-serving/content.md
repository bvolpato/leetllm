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
    "prefix-caching-prompt-caching",
    "flashattention-memory-efficient-attention",
    "continuous-batching-request-scheduling",
    "scaling-llm-inference-batching-kv-cache",
    "model-parallelism-for-llm-inference",
    "model-quantization-gptq-awq-gguf",
    "long-context-window-management"
  ],
  "section": "Inference & Production Scale",
  "order": 3
}
---
<!-- leetllm: edition:reference:start -->
An internal coding assistant receives a repository question with system instructions, file excerpts, a failing test, and earlier tool results. When it emits its next token, it still needs to attend to that history. Recomputing every old attention state at every step would turn one response into repeated replay.

Request A keeps each attention layer's Key (K) and Value (V) vectors after their first computation. A decode step processes one token, appends its K/V state, and reads the cached history to predict the next token. That running state is the <span data-glossary="kv-cache">KV cache</span> (Key-Value cache). <span data-glossary="grouped-query-attention">Grouped-Query Attention (GQA)</span> and <span data-glossary="multi-query-attention">Multi-Query Attention (MQA)</span> already shrink each <span data-glossary="token">token</span>'s footprint.

The remaining problem is placement. The cache grows with every token and concurrent request, so variable-length traffic can strand expensive <span data-glossary="gpu">GPU</span> memory. <span data-glossary="pagedattention">PagedAttention</span>, introduced with <span data-glossary="vllm">vLLM</span>, borrows operating-system paging so live request state sits in small reusable blocks instead of one oversized contiguous reservation per request.[^kwon2023]

The examples use full causal attention: each position reads all earlier positions and itself. Sliding-window attention, hybrid architectures, and compressed caches have different storage layouts. Start with A's ordinary full-attention cache, where both its contents and its allocation are easy to inspect.

---

## Why the KV cache exists

Request A relies on two ideas from earlier lessons. **<span data-glossary="transformer">Transformer</span> <span data-glossary="self-attention">self-attention</span>** computes Query, Key, and Value vectors so the current token can weigh earlier tokens.[^vaswani2017] **Autoregressive generation** then produces one token at a time, with each new token able to attend to everything that came before it.

### Autoregressive generation

Call the assistant's first request **A**. Suppose it has already processed $t-1$ tokens. What must the next step carry forward? Without a KV cache, it would re-run the Key and Value projections for every earlier token. With a cache, A writes $k_t$ and $v_t$ once, then later queries read those stored vectors.

For full causal attention, processing token $t$ uses positions 1 through $t$ to predict token $t+1$.[^vaswani2017] At one layer and attention head:

$$
\text{Attention}(q_t, K_{1:t}, V_{1:t}) = \text{softmax}\left(\frac{q_t K_{1:t}^T}{\sqrt{d_k}}\right) V_{1:t}
$$

The current token's query $q_t$ is scored against every key in $K_{1:t}$ (dot product, scaled by $\sqrt{d_k}$). <span data-glossary="softmax">Softmax</span> turns those scores into weights, and $V_{1:t}$ is blended with those weights. $K_{1:t}$ and $V_{1:t}$ are the Key and Value <span data-glossary="matrix">matrices</span> for tokens 1 through $t$.

Without a cache, replaying the prefix recomputes Key and Value <span data-glossary="vector">vectors</span> for every earlier position. Across $T$ one-token steps, that's $1+2+\cdots+T$ position-wise K/V projections rather than $T$. Caching removes that repeated projection work, but attention still has to *read* the growing history. Prompt prefill computes many positions together; it isn't a loop of single-token decode calls.

### KV cache: cache K, V from previous steps

At step $t$, compute $q_t, k_t, v_t$ for the new token and append $k_t, v_t$ to the cache. Request A's first five tokens look like this:

<figure>
  <img src="illustrations/_generated/kv_decode_cache_loop_dark.png" alt="Three aligned decode snapshots show one new K/V pair at steps one, two, and five. Earlier pairs stay in the cache and each query reads the visible prefix; future slots remain empty. Full-model Llama 3 8B payloads are 128, 256, and 640 KiB. Pair boxes are a single-head schematic." />
  <figcaption>One new token's state per step, a growing history to attend over. O(1) describes the added payload for a fixed architecture, not constant allocation latency. The KiB counts use Llama 3 8B's full-model shape; measured HBM reads depend on the kernel and cache reuse.</figcaption>
</figure>

With the KV cache, the **<span data-glossary="decode-phase">decode</span>** phase (generating one new token at a time) still scales linearly per step in sequence length because each new token attends over all cached tokens. As cache reads grow, long-context decode can become sensitive to <span data-glossary="memory-bandwidth">memory bandwidth</span> even after caching.[^kwon2023]

---

Those five tokens already show the next problem: even a tiny request writes a growing tensor into GPU memory. Real serving multiplies that cost by layers, KV heads, and concurrent requests.

## KV cache memory analysis

Before writing a general formula, compare three concrete tensor shapes. Llama 3 8B and 70B use GQA with 8 KV heads; GPT-3 175B uses full <span data-glossary="multi-head-attention">multi-head attention (MHA)</span>.[^dubey2024][^brown2020]

### Memory footprint examples (FP16)

| Architecture | Layers | KV Heads | $d_{head}$ | Cache/token | 4K Context | 32K Context |
|----------------------|--------|----------|------------|-------------|------------|-------------|
| **Llama 3 8B** (GQA) | 32 | 8 | 128 | 128 KiB | 512 MiB | 4 GiB |
| **Llama 3 70B** (GQA) | 80 | 8 | 128 | 320 KiB | 1.25 GiB | 10 GiB |
| **GPT-3 175B** (MHA) | 96 | 96 | 128 | 4.5 MiB | 18 GiB | 144 GiB |

Here 4K means 4,096 tokens and 32K means 32,768. These are full-retention payload extrapolations, not supported-context claims: original GPT-3 trained with a 2,048-token context and alternated dense and locally banded sparse attention layers; the initial Llama 3 releases had 8K contexts. The table counts every cached position in every layer. A sparse runtime that retains fewer positions has a different bill.[^brown2020][^dubey2024]

<figure>
  <img src="illustrations/_generated/memory_footprint_dark.png" alt="Three equal-width bars partition the same 40 GiB payload-only KV pool. Llama 3 8B fits 80 half-GiB requests, Llama 3 70B fits 32 1.25-GiB requests, and the extrapolated GPT-3 175B shape fits two 18-GiB requests with 4 GiB free. Segment sizes use one common 0-to-40-GiB scale." />
  <figcaption>Raw full-retention payload ceilings inside a chosen 40 GiB KV budget: 80, 32, and 2 concurrent 4,096-token requests (excluding runtime overhead; GPT-3's shape is extrapolated beyond its original 2,048-token context).</figcaption>
</figure>

For Llama 3 70B, one 4K-context request already consumes **1.25 GiB** of KV cache. A batch of 128 such requests would need **160 GiB** of <span data-glossary="hbm">High Bandwidth Memory (HBM)</span>, before weights and runtime buffers.

That's beyond a single 80 GB-class accelerator. Memory capacity can cap throughput before raw FLOPs do.

Llama 3 70B has 64 query heads but only 8 KV heads.[^dubey2024] If it stored a KV head per query head, the cache would be **2.5 MiB per token** in <span data-glossary="fp16">FP16</span>. GQA-8 drops that to **320 KiB per token**.

At 4K context, that's **10 GiB** versus **1.25 GiB** for a single request. The architecture has already bought an 8× reduction before the allocator makes any decision.

Each token stores a Key vector and a Value vector across every layer and KV head:

$$
\text{Bytes per token}
= 2 \times n_{\text{layers}}
\times n_{\text{kv-heads}}
\times d_{\text{head}}
\times P_{\text{bytes}}
$$

For each token, store Key and Value (the $2$) across every layer and KV head. Each vector has $d_{\text{head}}$ dimensions, and $P_{\text{bytes}}$ is the stored precision. In MHA, $n_{\text{kv-heads}} = n_{\text{heads}}$. GQA and MQA use fewer KV heads, which shrinks the cache directly.[^ainslie2023][^shazeer2019]

This is the <span data-glossary="tensor">tensor</span>-payload calculation. A deployed engine may also reserve <span data-glossary="quantization">quantization</span> scales, block tables, temporary workspaces, communication buffers, graph memory, and allocator headroom. Use the formula to reason about slopes, then profile the runtime before setting capacity limits.

```checkpoint
For Llama 3 70B (80 layers, 8 KV heads, head dimension 128, FP16), how many bytes does one token add?
---
Use $2 \times 80 \times 8 \times 128 \times 2 = 327{,}680$ bytes, or 320 KiB per token. That is Llama 3 70B's per-token cache, so a 4K-token sequence needs 1.25 GiB.
```

<!-- leetllm: test, output=show -->
```python title="calculate-kv-cache-footprint.py"
def cache_gib(layers: int, kv_heads: int, head_dim: int, bytes_per_value: int, tokens: int) -> float:
    bytes_per_token = 2 * layers * kv_heads * head_dim * bytes_per_value
    return bytes_per_token * tokens / (1024 ** 3)


for label, heads in [("MHA-64", 64), ("GQA-8", 8), ("MQA-1", 1)]:
    size = cache_gib(layers=80, kv_heads=heads, head_dim=128, bytes_per_value=2, tokens=4096)
    print(f"{label}: {size:.2f} GiB at 4K tokens")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
MHA-64: 10.00 GiB at 4K tokens
GQA-8: 1.25 GiB at 4K tokens
MQA-1: 0.16 GiB at 4K tokens
```
<!-- leetllm: output:end -->

---

GQA shrinks bytes per token. It doesn't stop a naive allocator from reserving far more than those bytes. That's the next failure.

## The memory fragmentation problem

In a naive serving system, each request gets one contiguous KV buffer. A CPU program would grow that buffer token by token. Why doesn't the serving engine do the same?

Growing a contiguous allocation can require allocating a larger region and copying the existing tensor. Repeating that operation wastes work. But maximum-length reservation isn't forced by CUDA: runtimes can reuse memory pools, use stream-ordered allocation, or commit virtual pages dynamically. NVIDIA's `cudaMallocAsync` and `cudaFreeAsync` provide a pool-based alternative to globally synchronizing allocation operations. Their lifetimes still require correct ordering across every stream that accesses the allocation.[^nvidia2021streamAllocator]

To avoid mid-generation reallocation, naive engines made a blunt compromise: reserve a single contiguous buffer sized for the configured *maximum* sequence length (such as 8,192 tokens) up front as soon as a request arrives.

Suppose Request A currently has 600 cached tokens. What can Request B use from A's untouched reservation? Nothing while A owns it. If A finishes at token 600, the reservation finally frees up, but that empty tail remained locked and unusable throughout A's entire execution.

<figure>
  <img src="illustrations/_generated/paged_attention_dark.png" alt="Two snapshots of the same ten physical KV blocks. With maximum reservations, A and B each hold five blocks while using three, so C cannot obtain its two blocks. With dynamic allocation, A uses three, B three, and C two, leaving blocks 8 and 9 free." />
  <figcaption>Dynamic block assignment lets C enter the same 10-block pool while A and B are still growing, whereas upfront maximum reservations lock C out.</figcaption>
</figure>

### Types of memory waste

That static contiguous reservation wastes memory in three distinct ways identified by the vLLM team:[^kwon2023]

1.  **Internal fragmentation:** Request A reserves 8,192 slots but finishes generating at token 600. The 7,592 slots it never used remain trapped inside A's reservation, unavailable to any other request until A finishes.
2.  **External fragmentation:** An allocator that sizes each reservation to its request instead frees variable-sized chunks as requests finish at different times, leaving scattered holes across VRAM. Even if total free memory across all holes is plenty for a new request, no single contiguous region is large enough to satisfy a new reservation.
3.  **Reservation waste:** Even slots that A will eventually use in later decode steps (such as token 3,000 in a 4,000-token sequence) are reserved from the very first step. That memory sits idle for hundreds of decode cycles, locked away from concurrent work.

The vLLM team's 2023 introduction reported **60% to 80%** waste in the systems it studied.[^vllm2023pagedBlog] The paper's serving experiments generated workloads from ShareGPT/Alpaca token-length distributions and Poisson arrivals, rather than replaying production timing traces. Those historical results show a real packing problem; they don't determine today's waste fraction for every runtime.[^kwon2023]

<!-- leetllm: test, output=show -->
```python title="measure-reservation-waste.py"
bytes_per_token = 320 * 1024
max_tokens = 8192
live_tokens = [600, 1250, 4000, 128]

reserved = len(live_tokens) * max_tokens * bytes_per_token
live = sum(live_tokens) * bytes_per_token
waste_fraction = 1 - live / reserved

print(f"reserved: {reserved / 1024**3:.2f} GiB")
print(f"live state: {live / 1024**3:.2f} GiB")
print(f"unused reservation: {waste_fraction:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reserved: 10.00 GiB
live state: 1.82 GiB
unused reservation: 81.8%
```
<!-- leetllm: output:end -->

---

If max-length reservations waste most of the pool, the next question is how to allocate only live tokens without needing one huge contiguous region.

## PagedAttention (vLLM)

### Virtual memory for KV cache

Operating systems solved physical memory fragmentation decades ago using virtual memory paging. Rather than demanding a single contiguous region of physical RAM for every process, the OS divides virtual memory into fixed-size pages (such as 4 KiB) and maps them via a page table to arbitrary physical frames scattered across DRAM. A process perceives a smooth, contiguous address space, while the underlying memory manager allocates uniform physical frames on demand.

PagedAttention borrows the logical-to-physical mapping idea. Its software block table is not the operating system's hardware page table:[^kwon2023]

-   **Logical blocks:** Divide a request's token positions into groups of $B$. Block 0 covers positions $0$ through $B-1$; block 1 covers $B$ through $2B-1$.
-   **Physical blocks:** Reusable slots in GPU cache storage. A token-block ID can index corresponding storage in multiple layer tensors. It does not have to describe one contiguous chunk containing every layer and head.
-   **Block table:** Mapping metadata maintained by the memory manager and passed to the GPU kernel, so each logical block resolves to the correct physical storage.

Physical blocks don't need to sit next to each other in VRAM. The engine assigns blocks as needed. Reuse requires that no running request or in-flight kernel still depends on the old contents. With prefix caching, an unreferenced block can remain cached and reusable until the pool evicts it.[^vllm2026prefix]

<figure>
  <img src="illustrations/_generated/paged_block_table_mapping_dark.png" alt="With block size four and valid length five, A maps logical block zero to physical block 19 and logical block one to physical block 7. Positions 0 through 3 fill block 19; position 4 maps by divmod(4, 4) = (1, 0) to block 7 slot 0. The other three slots in block 7 remain owned by A but invalid for attention. B owns separate physical block 12." />
  <figcaption>This teaching map uses A table [19, 7] to keep logical order across scattered blocks. The following CPU stack example uses a separate mapping.</figcaption>
</figure>

### What paging saves, and what it doesn't

| Scope | What uniform paging changes | What remains |
|--------|----------------------|----------------|
| **Free blocks within one pool** | Any free block can satisfy a same-size allocation | Other pool classes and non-KV allocations have their own constraints |
| **Maximum-length reservation** | Current token-block occupancy can determine allocation | Lookahead or scheduler reservations may hold extra capacity |
| **Final partial block** | In the basic append-only layout, unused slots are fewer than $B$ | Short requests can have a large percentage of unused slots |
| **Serving performance** | Better packing can permit larger batches | Kernel cost, scheduling, request lengths, and latency targets still matter |

Within a uniform pool, a free block doesn't need a neighboring free block to serve a one-block allocation. That removes the variable-sized-hole problem at the pool level. Other allocations, reserved regions, and cache groups still determine which GPU memory is available to a request.

For basic full-attention storage with no extra reservations, a request wastes at most $B-1$ slots in its last block. With $B=16$, one live token uses sixteen slots: **93.75%** of those slots are unused. At 120 tokens, eight blocks reserve 128 slots: **6.25%** are unused. Long aligned requests can have no tail waste. Count occupied slots and state the denominator before quoting a percentage.

The 2023 paper reported **2–4× throughput** for particular models, A100 deployments, workloads, and reimplemented Orca reservation schemes. Measure concurrency gains on the target engine and request mix. Paging preserves the intended attention operation, while changing a GPU kernel can still change floating-point rounding.[^kwon2023]

Block size involves a clear trade-off:
- **Smaller blocks (such as 8 or 16 tokens):** Minimize tail waste and allow finer-grained memory sharing, but require larger block tables and slightly less regular memory access.
- **Larger blocks (such as 32 or 64 tokens):** Reduce table entries, but coarsen sharing and leave larger partial tails. Block size can also change kernel speed in either direction: larger blocks slowed vLLM's kernel by up to 1.9×, while smaller blocks slowed a FlashAttention-2 paged kernel by up to 9%.[^prabhu2024vattention] The vLLM paper's best range was 16–128 for ShareGPT and 16/32 for Alpaca. Modern backend constraints and workloads need their own check.[^kwon2023]

### Reading attention through a block table

How does a GPU compute attention when Key and Value tensors are scattered across non-contiguous physical blocks?

A kernel could gather K/V into a contiguous temporary tensor, but that adds copying and workspace. A paged-KV-aware kernel can instead read through the table. Its basic addressing steps are:

1.  **Resolve the logical position:** For sequence position $i$, compute the logical block as $\lfloor i / B \rfloor$ and the slot offset as $i \pmod B$.
2.  **Look up the physical block:** Read the device-accessible table at index $\text{logical\_block}$ to obtain $\text{physical\_block\_id} = \text{block\_table}[\text{logical\_block}]$.
3.  **Load the correct vectors:** Combine the physical ID and slot with the actual tensor layout, KV-head selection, and strides. K and V can have different packed layouts; a two-stride formula doesn't describe every backend.
4.  **Apply validity and attention:** Exclude unfilled positions and respect the model's attention mask. Compute scaled scores, softmax, and the weighted value result using the selected kernel's reduction strategy.

Paging doesn't prescribe one warp per head, a particular load instruction, or FlashAttention's online-softmax implementation. vLLM's historical kernel walkthrough describes warps processing KV blocks and an intermediate logits array in shared memory; it explicitly warns that it no longer describes the current code. Use it as a worked historical implementation, not a template for every modern attention backend.[^vllm2026historicalPagedKernel]

Direct reads avoid a mandatory whole-cache gather copy before each attention call. They don't eliminate cache writes, copy-on-write block copies, or transfers between devices.

### Paging changes the kernel interface

Non-contiguous physical blocks recover stranded HBM, but the attention kernel must follow the block table and gather K/V from those addresses. PagedAttention therefore needs paged-attention kernels; a contiguous-cache kernel isn't a drop-in consumer.

The original vLLM microbenchmark measured **20-26% higher attention-kernel latency** than FasterTransformer's contiguous kernel, from block-table walks, extra branches, and variable lengths.[^kwon2023] That's a kernel-only comparison. End-to-end throughput still rose dramatically in the paper's A100 experiments because recovered HBM supported larger batches, so measure allocator capacity and kernel speed together.

vAttention is a counter-design. It reserves a contiguous virtual-address range for each KV cache and backs virtual pages with physical GPU memory on demand through CUDA virtual-memory APIs.[^prabhu2024vattention] The kernel still sees contiguous virtual addresses, so existing contiguous attention kernels can run without a paged-KV interface. Complexity moves into virtual-memory mapping, page commitment, and platform support.

Neither layout wins by definition. PagedAttention has broad serving-engine adoption and explicit block-sharing. A contiguous-virtual design may reuse more existing kernels but depends on the runtime, driver, page granularity, and workload. Compare end-to-end throughput, latency, memory utilization, and implementation constraints on the target stack.

> **Key insight:** PagedAttention trades a modest per-kernel indirection cost (block-table lookups) for large HBM capacity savings and fine-grained block sharing. End-to-end throughput rises whenever the recovered memory unlocks larger concurrent batches.

<!-- leetllm: test, output=show -->
```python title="bound-paged-tail-waste.py"
def allocated_tokens(live_tokens: int, block_size: int) -> int:
    return ((live_tokens + block_size - 1) // block_size) * block_size


lengths = [1, 120, 505, 1000, 4096]
block_size = 16
for length in lengths:
    allocated = allocated_tokens(length, block_size)
    unused = allocated - length
    print(f"{length} live tokens -> {allocated} slots, {unused} unused ({unused / allocated:.2%})")

assert max(allocated_tokens(length, block_size) - length for length in lengths) < block_size
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1 live tokens -> 16 slots, 15 unused (93.75%)
120 live tokens -> 128 slots, 8 unused (6.25%)
505 live tokens -> 512 slots, 7 unused (1.37%)
1000 live tokens -> 1008 slots, 8 unused (0.79%)
4096 live tokens -> 4096 slots, 0 unused (0.00%)
```
<!-- leetllm: output:end -->

---

## Implementation sketch

The manager below is a CPU-side sketch of the block table. vLLM coordinates allocation on the host and provides mapping metadata to <span data-glossary="cuda">CUDA</span> kernels that read K and V. This class doesn't allocate GPU tensors, run a scheduler, share blocks, or implement prefix caching.

`PagedKVCacheManager` starts with a stack of free physical IDs, highest first, so the first `pop()` returns `19` in a 20-block pool. `allocate` hands request A one block. Each `append_slot` returns the **physical block index and slot offset** for the new token. When A later needs a fifth token with `block_size = 4`, the manager pops block `18`.

<!-- leetllm: test, deps=numpy, output=show, id=block-manager -->
```python title="implementation-sketch.py"
class PagedKVCacheManager:
    """
    Manages the mapping between logical pages and physical GPU blocks.
    Doesn't store the actual tensors (that happens in GPU memory).
    """

    def __init__(self, num_blocks: int, block_size: int):
        self.block_size = block_size
        # Stack of free physical block indices
        self.free_blocks: list[int] = list(range(num_blocks))

        # Maps request_id -> list of physical block indices
        # Example: { "A": [19, 18] }
        self.block_tables: dict[str, list[int]] = {}

        # Maps request_id -> number of processed tokens, including prompt tokens
        self.seq_lens: dict[str, int] = {}

    def allocate(self, request_id: str) -> None:
        """Initialize a new request with one empty block."""
        if request_id in self.block_tables:
            raise ValueError(f"request already allocated: {request_id}")
        if not self.free_blocks:
            raise MemoryError("KV block pool exhausted")

        first_block = self.free_blocks.pop()
        self.block_tables[request_id] = [first_block]
        self.seq_lens[request_id] = 0

    def append_slot(self, request_id: str) -> tuple[int, int]:
        """
        Reserves the cache position for one token being processed.
        Allocates a new block if the current last block is full.
        Returns (physical_block_index, slot_offset_within_block).
        """
        if request_id not in self.block_tables:
            raise KeyError(f"unknown request: {request_id}")
        current_blocks = self.block_tables[request_id]

        token_idx = self.seq_lens[request_id]

        # Allocate a fresh block when the previous one is full.
        if token_idx > 0 and token_idx % self.block_size == 0:
            if not self.free_blocks:
                raise MemoryError("KV block pool exhausted")
            new_block = self.free_blocks.pop()
            current_blocks.append(new_block)

        block_id = current_blocks[-1]
        slot_offset = token_idx % self.block_size
        self.seq_lens[request_id] = token_idx + 1
        return block_id, slot_offset

    def free(self, request_id: str) -> None:
        """Release all blocks associated with a request back to the pool."""
        if request_id in self.block_tables:
            blocks = self.block_tables.pop(request_id)
            self.free_blocks.extend(blocks)
            del self.seq_lens[request_id]


manager = PagedKVCacheManager(num_blocks=20, block_size=4)
manager.allocate("A")
for _ in range(5):
    print("A", manager.append_slot("A"))

manager.allocate("B")
print("B", manager.append_slot("B"))

manager.free("A")
print("free blocks:", len(manager.free_blocks))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A (19, 0)
A (19, 1)
A (19, 2)
A (19, 3)
A (18, 0)
B (17, 0)
free blocks: 19
```
<!-- leetllm: output:end -->

`allocate` grabs one block. `append_slot` pulls the next block only when the current one is full. `free` returns every block A held, so B can keep running while those IDs go back on the stack. This free-list pool tracks fixed-size pages without variable-sized holes; a production runtime still allocates model weights, kernel workspaces, and scheduler state outside the KV block pool.

### Tracing a small example

The manager uses `block_size = 4` and `num_blocks = 20`. Free IDs form a stack, so `pop()` yields 19, then 18, then 17.

First, **Request A arrives**. `allocate("A")` pops physical block `19`, giving the table `{"A": [19]}` and sequence length `0`.

After four processed tokens, block `19` holds offsets `0` through `3`, and `seq_lens["A"] = 4`. Prompt tokens count too; the allocator doesn't distinguish prefill from decode.

At token five, `token_idx = 4` and `4 % 4 == 0`, so block `19` is full. `append_slot("A")` pops `18`, writes at offset `0`, and leaves the table as `{"A": [19, 18]}`, matching `A (18, 0)` in the output.

Next, **Request B arrives**. `allocate("B")` pops block `17`, so the tables are `{"A": [19, 18], "B": [17]}`.

Finally, **A finishes**. `free("A")` returns `19` and `18`; B still holds `17`, leaving 19 free IDs in the 20-block pool.

Blocks are grabbed one at a time and returned when the request completes. Real engines add a **reference count** per physical block (for shared prefixes) and **copy-on-write** when a sequence writes into a shared block.

PagedAttention changes storage rather than the intended attention math. It reduces long reservation tails; it doesn't remove the final partial block. Recovered capacity can improve throughput when the scheduler and kernels turn it into useful work.

```checkpoint
In this block manager, when is a new physical block allocated?
---
A request starts with one block. As tokens are processed, `append_slot` allocates another block only when the current sequence length is a positive multiple of `block_size`, meaning the previous block is full.
```

<!-- leetllm: test, output=show -->
```python title="resolve-logical-block-reads.py"
block_size = 4
block_table = [19, 18]
sequence_length = 5


def resolve(token_position: int) -> tuple[int, int]:
    if not 0 <= token_position < sequence_length:
        raise ValueError("position must name a processed token")
    logical_block, slot = divmod(token_position, block_size)
    return block_table[logical_block], slot


for position in [0, 3, 4]:
    print(f"token {position}: physical block, slot = {resolve(position)}")

assert resolve(0) == (19, 0)
assert resolve(4) == (18, 0)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
token 0: physical block, slot = (19, 0)
token 3: physical block, slot = (19, 3)
token 4: physical block, slot = (18, 0)
```
<!-- leetllm: output:end -->

### Read actual values through the table

An address trace isn't enough to verify attention indexing. Continue in the same Python session with a fresh four-block pool at two slots per block, where A and B interleave allocations so A's block table becomes `[3, 1]`. Each slot holds one two-dimensional key and value vector for one head at one layer, with an extreme sentinel placed in A's unfilled trailing slot so reading past the valid sequence length visibly corrupts the attention output:

<!-- leetllm: test, output=show, continue=block-manager, id=paged-read-parity -->
```python title="compare-paged-and-contiguous-attention.py"
import numpy as np

pool = PagedKVCacheManager(num_blocks=4, block_size=2)
k_pool = np.full((4, 2, 2), 1000.0, dtype=np.float64)
v_pool = np.full((4, 2, 2), 999.0, dtype=np.float64)
k_seq = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]], dtype=np.float64)
v_seq = np.array([[2.0, 1.0], [0.0, 3.0], [4.0, 2.0]], dtype=np.float64)

def write(request: str, k_vec: np.ndarray, v_vec: np.ndarray) -> None:
    block, offset = pool.append_slot(request)
    k_pool[block, offset] = k_vec
    v_pool[block, offset] = v_vec

def read(request: str) -> tuple[np.ndarray, np.ndarray]:
    length = pool.seq_lens[request]
    blocks = [pool.block_tables[request][pos // 2] for pos in range(length)]
    offsets = [pos % 2 for pos in range(length)]
    return k_pool[blocks, offsets], v_pool[blocks, offsets]

def attend(query: np.ndarray, keys: np.ndarray, values: np.ndarray) -> np.ndarray:
    scores = (keys @ query) / np.sqrt(keys.shape[-1])
    weights = np.exp(scores - np.max(scores))
    return (weights / weights.sum()) @ values

pool.allocate("A")
write("A", k_seq[0], v_seq[0])
pool.allocate("B")
write("B", np.array([-1.0, 0.0]), np.array([-5.0, -5.0]))
write("A", k_seq[1], v_seq[1])
write("A", k_seq[2], v_seq[2])

query = np.array([1.0, 0.5], dtype=np.float64)
expected = attend(query, k_seq, v_seq)
k_paged, v_paged = read("A")
actual = attend(query, k_paged, v_paged)
assert pool.block_tables["A"] == [3, 1]
assert np.array_equal(k_paged, k_seq) and np.array_equal(v_paged, v_seq)
assert np.allclose(actual, expected, atol=1e-12)
assert not np.allclose(attend(query, k_pool[[3, 3, 1, 1], [0, 1, 0, 1]], v_pool[[3, 3, 1, 1], [0, 1, 0, 1]]), expected)
assert not np.allclose(attend(query, k_pool[[3, 3, 2], [0, 1, 0]], v_pool[[3, 3, 2], [0, 1, 0]]), expected)
print("A block table:", pool.block_tables["A"])
print("attention output:", tuple(round(float(value), 6) for value in actual))
print("paged == contiguous; wrong mapping and unfilled-tail controls differ")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A block table: [3, 1]
attention output: (2.461842, 1.90474)
paged == contiguous; wrong mapping and unfilled-tail controls differ
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/paged_read_parity_dark.png" alt="With block size two, A table [3, 1] reads logical positions zero and one from physical block 3 and position two from block 1. Block 1 slot 1 holds an invalid K=(1000,1000), V=(999,999) sentinel and is excluded at valid length three; B owns block 2. For q=(1,0.5), the paged read matches contiguous attention at (2.461842, 1.904740). Mapping A to B or including the sentinel changes the result." />
  <figcaption>A’s table preserves logical order across physical blocks 3 and 1. Valid length three excludes the sentinel tail and B’s block, so the gathered read reproduces contiguous attention exactly.</figcaption>
</figure>

This exercises the three things a paged attention kernel must get right: gathering K and V through the block table, preserving logical order across scattered physical blocks, and stopping at the valid sequence length so stale slots never leak into the softmax. A GPU kernel such as vLLM's performs the same gather per warp, reading block-table entries from global memory and K/V tiles into shared memory. The class also reserves one empty block at `allocate`, so a zero-token request briefly holds a block; the earlier ceiling formula counts occupied token storage and leaves out that eager reservation.

Packing live blocks raises the concurrency ceiling. Now push Request A until it needs one more block and the pool has none. The scheduler still has to decide how A gives up its place and gets it back.

## Preemption when the pool is empty

vLLM pairs PagedAttention with a **scheduler**. Memory is a shared pool, so an exhausted pool turns allocation into a scheduling decision: delay A, evict another request, or recover A's cache later.

In a heavily loaded multi-tenant system, the GPU block pool can still become exhausted. Current vLLM V1's default recovery releases the preempted request's block ownership, reschedules it, and recomputes missing cache state later. Shared or retained prefix blocks do not all have to be erased. The optimization guide warns that preemption can hurt end-to-end latency.[^vllm2026optimization][^vllm2026prefix]

The original vLLM paper and legacy V0 runtime also evaluated CPU swapping. Keeping both designs separate makes the tradeoff clear:[^kwon2023]

1.  **Recomputing (default current vLLM V1):** Release the request's blocks and rerun missing prior work when it resumes. This spends extra FLOPs rather than transferring the missing cache over Peripheral Component Interconnect Express (PCIe).
2.  **Swapping (original paper and legacy V0):** Move KV blocks from GPU HBM to CPU RAM, then swap them back in later. This preserves previous work but consumes transfer bandwidth. This isn't the default V1 preemption path described by the current optimization guide.[^vllm2026optimization]

Recompute spends extra FLOPs; swap spends PCIe bandwidth. Both paths make A pay before it can resume, so frequent preemption belongs in the capacity plan rather than in the happy-path throughput estimate.

Default preemption isn't the whole offload story. Current vLLM also documents optional KV-offloading connectors that move reusable KV state between GPU and CPU memory. Enabling one changes the transfer path; it doesn't make legacy V0 swapping the default V1 scheduler behavior.[^vllm2026kvoffload]

Once GPU space opens up, the request can resume after obtaining the needed cache state. Other runtimes may expose <span data-glossary="model-offload">offload</span> or swap designs. Recovery costs belong in the latency budget; packing alone doesn't prevent frequent preemption.

Suppose a two-rank deployment serves Llama 3 70B (80 layers, 8 KV heads, head dimension 128, FP16 cache) with an 8K <span data-glossary="context-window">context window</span>. That cache adds 320 KiB per token, or 2.5 GiB per full request across the model. If its eight KV heads are evenly sharded over two ranks, each rank stores 1.25 GiB. With 16-token blocks, 8,192 tokens fill exactly 512 blocks, so tail waste is zero at full length.

Don't derive a capacity limit from advertised HBM minus model weights alone. Profile how much per-rank memory remains after weights, kernels, communication buffers, graphs, and safety headroom. With an assumed 8 GiB usable KV payload budget per rank, six fully occupied 8K requests fit. The seventh needs more blocks than remain. This arithmetic estimates capacity under the stated budget; measure the runtime's actual serving capacity.

<!-- leetllm: test, output=show -->
```python title="fit-full-context-requests.py"
bytes_per_token = 2 * 80 * 8 * 128 * 2
context_tokens = 8192
tp_ranks = 2
block_size = 16
kv_budget_per_rank_bytes = 8 * 1024**3

bytes_per_rank_block = bytes_per_token // tp_ranks * block_size
available_blocks = kv_budget_per_rank_bytes // bytes_per_rank_block
blocks_per_request = (context_tokens + block_size - 1) // block_size
capacity = available_blocks // blocks_per_request

print(f"per request per rank: {blocks_per_request * bytes_per_rank_block / 1024**3:.2f} GiB")
print(f"available blocks: {available_blocks}; blocks per request: {blocks_per_request}")
print(f"payload ceiling: {capacity} full 8K requests; {available_blocks % blocks_per_request} blocks remain")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
per request per rank: 1.25 GiB
available blocks: 3276; blocks per request: 512
payload ceiling: 6 full 8K requests; 204 blocks remain
```
<!-- leetllm: output:end -->

```checkpoint
Why doesn't PagedAttention add much capacity when every request already holds its full maximum context?
---
If every reserved token slot is already filled, no reserved slot sits empty, so there is little left to recover. A request still growing toward that maximum does leave reserved slots idle, and paging recovers those.[^kwon2023] PagedAttention helps most when request lengths vary, requests are still growing, related branches can share blocks, or requests finish early, because the scheduler can allocate based on actual blocks in use.
```

---

Packing live blocks raises how many requests fit. It doesn't keep the GPU busy when one long decode holds a static batch hostage. To see the second bottleneck, keep the same Request A and compare its finish time with a longer Request B.

## Continuous batching (iteration-level batching)

PagedAttention pairs especially well with **<span data-glossary="continuous-batching">continuous batching</span>** (also called iteration-level scheduling). The dedicated [continuous batching lesson](/learn/continuous-batching-request-scheduling) owns the scheduler. This lesson stays on the memory interaction.

### Static batching limitations
A needs 20 decode iterations while B needs 200. In traditional <span data-glossary="static-batching">static batching</span>, the system waits for $N$ requests, bundles them, and processes that batch until *all* requests finish. A completes early, but its slot remains tied to B's long tail, so the shorter request contributes no useful work for the remaining iterations.

### The continuous batching approach
Continuous batching, made explicit in systems like Orca, schedules at iteration granularity.[^yu2022] After A emits an End-of-Sequence (EOS) token or reaches another stopping condition, the scheduler can retire it and start waiting work at a later scheduling step. Unshared blocks become reusable after pending GPU accesses finish; a prefix cache may retain their contents.

That replacement keeps a batch slot productive instead of waiting for B. Continuous batching changes the live batch every step, while paged allocation makes freed capacity easy to reuse; tail latency still depends on load and prefill scheduling.

| Strategy | Idle Time on skewed generations | When are requests added? | Throughput posture |
|----------|-----------|--------------------------|------------|
| **Static Batching** | Can be high while waiting for longest sequence | Only when the entire previous batch completes | Baseline for comparison |
| **Continuous Batching** | Can be lower | At iteration steps after requests finish | Can improve on skewed workloads |

Orca's historical GPT-3 175B evaluation reported up to **36.9×** throughput over FasterTransformer at the same latency level. Its system combined iteration-level scheduling with selective batching of model operations. The comparison doesn't isolate one feature's speedup or determine modern serving performance.[^yu2022]

A dynamic batch needs an effective memory allocator. Paging is one approach; vAttention's virtual-memory design shows that iteration-level scheduling doesn't require PagedAttention specifically.[^prabhu2024vattention]

<!-- leetllm: test, output=show -->
```python title="recycle-blocks-between-iterations.py"
from math import ceil

block_size = 16
live_tokens = {"A": 48, "B": 5}


def blocks(tokens: int) -> int:
    return ceil(tokens / block_size)


before = sum(blocks(tokens) for tokens in live_tokens.values())
del live_tokens["A"]  # A emits EOS; scheduler retires it before next iteration.
live_tokens["C"] = 30
after = sum(blocks(tokens) for tokens in live_tokens.values())

print(f"blocks before retire and start: {before}")
print(f"blocks after retire A and start C: {after}")
assert after <= before
```

<!-- leetllm: output:start -->
```text title="Output" output compact
blocks before retire and start: 4
blocks after retire A and start C: 3
```
<!-- leetllm: output:end -->

---

Iteration-level scheduling creates and frees live sequences constantly. Block tables also make a different trick possible: sharing physical blocks. That sharing works in two distinct ways.

## How serving engines build on PagedAttention

### Memory sharing: parallel sampling, beam search, and copy-on-write

Many LLM serving patterns produce multiple output sequences from a single prompt:

-   **Parallel sampling:** Generating $N$ candidate responses from one prompt (such as $N = 4$ for temperature sampling, Best-of-N reranking in reasoning tasks, or parallel drafting in speculative decoding).
-   **Beam search:** Maintaining the top $K$ candidate hypotheses, where candidates share identical history for early tokens and branch later.

A system that stores a separate prompt cache for each branch duplicates that payload. For a **4,096-token** prompt on Llama 3 70B, four private copies require $4 \times 1.25 = 5.0\text{ GiB}$. Sharing the prompt can reduce occupied cache slots; fixed GPU pool storage itself may remain allocated.

Reference-counted **Copy-on-Write (CoW)** permits safe branch sharing:[^vllm2023pagedBlog]

1. **Fork:** Each branch's table can reference the same valid prompt blocks. Reference counts track their owners.
2. **Read:** Shared contents do not need to be duplicated for attention. Readers still compete for bandwidth and kernel resources; safe sharing isn't zero hardware contention.
3. **Append:** After a full shared block, allocate a new block. To append inside a shared *partial* block, first copy its valid contents into private storage and update ownership. This is necessary even if two branches happen to produce identical next tokens.
4. **Retire:** Release the branch's references. A block can become reusable only after other owners and pending GPU accesses no longer require it. A prefix cache can retain unreferenced contents for future hits.

Try the dangerous case: A and B share three valid slots in a four-slot block. Both branches will write their fourth position. A write into the shared empty slot doesn't change B's three-token prefix, but B's later write would overwrite A's fourth K/V pair. A reference count protects ownership only if the append path obeys it.[^kwon2023]

The copy-on-write trace below demonstrates why shared prefix blocks must clone on divergence: mutating an aliased block corrupts sibling beams, whereas copying the shared block on the first diverging write isolates each branch.

<!-- leetllm: test, output=show -->
```python title="isolate-shared-partial-block-writes.py"
storage = [[10, 20, 30, None], [None] * 4]
tail_blocks = {"A": 0, "B": 0}
references = {0: 2, 1: 0}
free_blocks = [1]

storage[tail_blocks["A"]][3] = 90
storage[tail_blocks["B"]][3] = 80
assert storage[tail_blocks["A"]][3] == 80  # B corrupted A's appended state.
print("without copying, A's fourth value:", storage[tail_blocks["A"]][3])
storage[0][3] = None  # Reset before the safe writes.

def append_fourth(branch, value):
    old_block = tail_blocks[branch]
    assert storage[old_block][3] is None
    if references[old_block] > 1:
        if not free_blocks:
            raise MemoryError("no block available for copy-on-write")
        new_block = free_blocks.pop()
        storage[new_block] = storage[old_block][:3] + [None]
        tail_blocks[branch] = new_block
        references[old_block] -= 1
        references[new_block] = 1
    storage[tail_blocks[branch]][3] = value

append_fourth("A", 90)
assert storage[tail_blocks["B"]] == [10, 20, 30, None]
append_fourth("B", 80)  # Now B is the only owner of the original block.
assert references == {0: 1, 1: 1} and not free_blocks
assert storage[tail_blocks["A"]] == [10, 20, 30, 90]
assert storage[tail_blocks["B"]] == [10, 20, 30, 80]
print("with copy-on-write:", {branch: storage[block] for branch, block in tail_blocks.items()})
```

<!-- leetllm: output:start -->
```text title="Output" output compact
without copying, A's fourth value: 80
with copy-on-write: {'A': [10, 20, 30, 90], 'B': [10, 20, 30, 80]}
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/shared_partial_block_cow_dark.png" alt="A and B begin on shared physical block 0 with values 10, 20, 30 and one empty slot, reference count two. Without copy-on-write, B overwrites A’s appended 90 with 80. In the safe branch A copies only the three valid values to block 1 and writes 90; B keeps block 0 and writes 80. Each block then has one owner." />
  <figcaption>This small trace makes the aliasing bug visible: shared writes target one slot, while copying the three valid entries gives the branches independent tails. A full shared block gets a new tail instead; GPU stream ordering remains outside this CPU check.</figcaption>
</figure>

Only A copies the three valid entries; B can write the original block after its reference count falls to one. A full shared block would instead stay shared while each branch allocates its next block. In a GPU implementation, order the copy before the destination write and preserve the source until all readers finish.[^nvidia2021streamAllocator]

> **Common mistake:** Appending into a shared *partial* KV block without checking its reference count lets sibling beams overwrite each other's latest token in place. Trigger copy-on-write whenever `ref_count > 1`, even if the target slot is currently empty.

### Prefix caching across independent requests

Copy-on-write safely shares blocks across branches forked within the *same* request. Reusing state across *separate, independently arriving* requests requires an additional **<span data-glossary="prefix-cache">prefix cache</span>** layer: retain completed prefix blocks in memory after a request finishes, match incoming prompts against cached token sequences, verify security isolation keys, and only then map the new request's block table to the existing physical blocks. vLLM documents this feature as Automatic Prefix Caching (APC).[^vllm2026prefix]

Suppose 100 independent requests share a compatible 1,000-token prompt, a warm available cache, and 16-token blocks. vLLM's prefix cache reuses complete blocks. In this full-attention snapshot, 992 tokens form 62 reused blocks and the remaining 8 occupy a private partial block per request:[^vllm2026prefix]

- Without prefix caching: `100 × 63 = 6300` occupied blocks cover those prefix tokens.
- With compatible prefix caching: `62 + (100 × 1) = 162` blocks cover the shared full prefix and private tails.

That's a **97.4% reduction** in occupied prefix blocks for this snapshot. It frees capacity for other work, not necessarily CUDA allocations back to the driver. Evicted prefixes, a cold cache, different model state, or different isolation keys change the result.

Now make the prompt exactly **1,008 tokens**, filling 63 blocks. Can current vLLM skip the entire prompt? No: it recomputes the last token to obtain next-token logits, so its block-aligned matcher recomputes the entire final block.[^vllm2026kvmanager0280] Its V1 append-only block tables can also retain duplicate full blocks until a request is freed rather than deduplicating on every step.[^vllm2026prefix]

<!-- leetllm: test, output=show -->
```python title="estimate-prefix-block-reuse.py"
requests = 100
prefix_tokens = 1000
block_size = 16
full_blocks = (prefix_tokens - 1) // block_size  # Leave work to obtain next-token logits.
tail_tokens = prefix_tokens - full_blocks * block_size
private_tail_blocks = (tail_tokens + block_size - 1) // block_size

without_cache = requests * (full_blocks + private_tail_blocks)
with_compatible_cache = full_blocks + requests * private_tail_blocks
saved_fraction = 1 - with_compatible_cache / without_cache

print(f"shared full blocks: {full_blocks}; private tail tokens per request: {tail_tokens}")
print(f"occupied prefix blocks: {without_cache} without reuse -> {with_compatible_cache} with reuse")
print(f"saved occupied prefix slots: {saved_fraction:.1%}")
assert (without_cache, with_compatible_cache) == (6300, 162)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
shared full blocks: 62; private tail tokens per request: 8
occupied prefix blocks: 6300 without reuse -> 162 with reuse
saved occupied prefix slots: 97.4%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/prefix_reuse_boundary_dark.png" alt="For 100 compatible requests with a warm full-attention 1,000-token prefix and 16-token blocks, one shared run occupies 62 full blocks and the requests keep 100 private tail blocks: 162 occupied blocks instead of 6,300. At prompt lengths 1,000, 1,008, and 1,009, the aligned hit rule reuses 992, 992, and 1,008 tokens and recomputes 8, 16, and 1." />
  <figcaption>Complete blocks form the shared run; each request keeps a private partial tail. The aligned hit cutoff leaves suffix work for next-token logits, and compatible isolation keys still decide which requests may share.</figcaption>
</figure>

### RadixAttention (SGLang)
<span data-glossary="sglang">SGLang</span>'s **RadixAttention** organizes reusable token prefixes in a radix tree, a tree whose edges can store sequences rather than one token each. Its original design evicts unused leaf prefixes in least-recently-used (LRU) order when space is needed.[^zheng2024sglang] A hit skips computation for the compatible cached prefix; the unmatched suffix still needs prefill. A full miss recomputes the prompt. It doesn't promise to retain every request forever.

That makes it particularly effective for multi-turn chat and agentic workloads where long prompt prefixes repeat across calls.[^zheng2024sglang]

### FlashInfer and kernel optimization
FlashInfer provides attention kernels and APIs for serving workloads, including paged KV caches and variable-length sequences.[^ye2025] It doesn't replace the memory manager. Whether a particular backend improves decode performance depends on its supported shapes, hardware, and workload.

### PagedAttention vs. FlashAttention
These names are easy to mix up, but they solve different problems.[^kwon2023][^dao2022]

-   PagedAttention: A KV-cache layout and allocation strategy. It places cached K/V tensors in blocks and supports block sharing; a prefix cache handles cross-request reuse.
-   FlashAttention: An IO-aware attention kernel. It tiles attention so the GPU does less wasteful movement between HBM and on-chip memory, especially during full attention computation.[^dao2022]

Modern serving stacks often use both or close variants together.[^ye2025] PagedAttention makes the cache fit and stay shareable. <span data-glossary="flashattention">FlashAttention</span>-style kernels make attention itself faster once those tensors are in place.

---

## Reducing KV cache at the architecture level

Return to Request A's per-token bill. PagedAttention can pack those bytes, but it can't make the tensor payload smaller. That requires changing *how much* K/V state the model produces in the first place.

[Grouped-Query Attention (GQA)](/learn/multi-query-grouped-query-attention) shrinks the baseline cache. Instead of a Key and Value head per query head, GQA groups query heads so they share KV heads. Ainslie et al. found intermediate group counts recovered much of MHA quality while keeping MQA-like inference benefits after uptraining; other models still need their own quality evaluation.[^ainslie2023]

Llama 3 70B is the worked example: 64 query heads, 8 KV heads, so each token's cache is 8× smaller than full MHA with those query heads.[^dubey2024]

| Attention Type | Example KV Heads | KV Cache/token | Evaluation posture |
|:--------------|:--------------:|:--------------:|----------|
| **Multi-Head (MHA)** | 64 | 2,560 KiB | Reference cache size for 70B-width MHA |
| **Grouped-Query (GQA)**[^ainslie2023] | 8 | 320 KiB | 8x smaller cache; measure task quality |
| **Multi-Query (MQA)**[^shazeer2019] | 1 | 40 KiB | 64x smaller cache; measure task quality |

<span data-glossary="multi-head-latent-attention">Multi-Head Latent Attention (MLA)</span> takes a different architectural route: it jointly compresses keys and values into a learned low-rank latent representation, so its cache layout isn't just a smaller `n_kv_heads` value.[^deepseekv2_2024] MLA can shrink the cache further, but it needs an MLA-aware model and execution path. It isn't a serving switch for a GQA checkpoint.

GQA reduces the *size* of the problem, while PagedAttention solves the *allocation* of the problem. They are complementary when the selected model architecture and serving runtime support both.

---

## Practical considerations

Start capacity planning with two separate memory budgets: model weights and request state. A typical GPU-resident deployment shares fixed weights across requests while its occupied KV state grows with the live workload. Weight offloading and prefix sharing change the accounting. Sizing only for weights can still leave too little space for long conversations.

### 1. The prefill vs. decode bottleneck
LLM inference still has two useful workload categories:[^kwon2023][^zhong2024]
-   <span data-glossary="prefill">Prefill</span>: Processing the input prompt. For sufficiently large prompt batches, dense matrix multiplications often make this phase compute-heavy and highly parallelizable.
-   Decode: Generating tokens one by one. At common serving batch sizes, repeatedly loading weights and growing KV state often makes this phase memory-bandwidth-sensitive.

PagedAttention manages both prompt and generated-token storage. Current vLLM V1 can mix decode work and chunks of prefill under an iteration token budget. Chunking limits prompt work in a batch, but a chunk can still interfere with running decodes; measure the result.[^vllm2026optimization][^agrawal2023] At larger scale, disaggregated serving separates pools to tune <span data-glossary="ttft">time to first token (TTFT)</span> and inter-token latency independently, adding state-transfer and coordination costs.[^zhong2024]

These example timings only flag which measurements to inspect next. TTFT includes queueing and transport as well as prefill; inter-token delay can also include scheduler or network stalls. Neither number identifies a cause by itself. Check both, since a request can breach both thresholds.

<!-- leetllm: test, output=show -->
```python title="separate-prefill-and-decode-slos.py"
traces = [
    {"prompt_tokens": 8000, "ttft_ms": 780, "inter_token_ms": 22},
    {"prompt_tokens": 200, "ttft_ms": 48, "inter_token_ms": 23},
    {"prompt_tokens": 220, "ttft_ms": 51, "inter_token_ms": 61},
    {"prompt_tokens": 8000, "ttft_ms": 900, "inter_token_ms": 75},
]

def inspect_signals(trace):
    if trace["ttft_ms"] < 0 or trace["inter_token_ms"] < 0:
        raise ValueError("latencies must be nonnegative")
    flags = []
    if trace["ttft_ms"] > 500:
        flags.append("inspect queueing, prefill, and transport")
    if trace["inter_token_ms"] > 50:
        flags.append("inspect decode, scheduling, and transport")
    return flags or ["within sample thresholds"]

for trace in traces:
    print(f"{trace['prompt_tokens']} prompt tokens: {'; '.join(inspect_signals(trace))}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
8000 prompt tokens: inspect queueing, prefill, and transport
200 prompt tokens: within sample thresholds
220 prompt tokens: inspect decode, scheduling, and transport
8000 prompt tokens: inspect queueing, prefill, and transport; inspect decode, scheduling, and transport
```
<!-- leetllm: output:end -->

### 2. Context window limits
Even with PagedAttention, the KV cache still grows linearly with context length. A Llama 3 70B-shaped GQA cache at **128K tokens** needs **40 GiB** in FP16. At that scale, KV memory can rival or exceed the room left after loading weights, so long-context serving may need distribution, KV-cache quantization, explicit compression, or smaller active contexts.
- Compression / eviction: Research systems such as **SnapKV**[^li2024snapkv] and **H2O**[^zhang2023h2o] retain selected KV positions instead of the complete history. Selection is approximate and can remove evidence a later token needs, so memory savings require quality checks.
-   [Quantization](/learn/model-quantization-gptq-awq-gguf): **FP8** halves raw bytes per value relative to FP16. Scales, workspaces, replication, and kernel support still affect actual capacity; this doesn't promise twice the serving throughput.

The right lever depends on where Request A's bytes are stuck. Ask which limit binds first before choosing a technique.

KIVI's local 2-bit path uses per-channel quantization for keys and per-token quantization for values: its experiments found persistent high-magnitude key channels, but no matching fixed pattern in values. It also keeps a recent-token residual in full precision.[^liu2024kivi] That changes the representation and bytes stored for K/V; it isn't a drop-in two-bit setting for any block allocator. Check kernel support, residual-buffer overhead, dequantization cost, and task quality on the deployed model.

SnapKV and H2O change which tokens remain in a runtime cache. CacheGen addresses transfer: it encodes precomputed KV into compact, bandwidth-adaptive bitstreams, streams chunks, and decodes them back into regular KV tensors before attention.[^liu2024cachegen] That reduces stored and transferred bytes, not necessarily the steady-state local tensor footprint after reconstruction. Lossy reconstruction still needs quality evaluation.

Mooncake separates prefill and decode, pools CPU/DRAM/SSD resources with GPU workers, and transfers KV state over RDMA when reuse justifies movement.[^qin2024] Distribution changes location and scheduling, but doesn't itself shrink each cached value. Measure time to first token, inter-token latency, throughput, and network traffic under the target workload.

Compare these as separate interventions with the same model, hardware, precision, prompt/output distribution, concurrency, and correctness target before changing a capacity or latency promise.

### 3. Distributed inference
In <span data-glossary="tensor-parallelism">tensor parallelism</span> (TP), a runtime may shard KV heads across ranks when the model layout permits it. TP splits a layer's weights (and often its KV heads) across GPUs so each rank holds a slice. If the number or grouping of KV heads doesn't divide cleanly across ranks, a runtime may replicate some KV state instead. Capacity planning must use the actual deployed layout, not assume ideal division.

Each rank stores its own slice of the blocks, and logical block growth has to stay aligned across ranks so token positions 0-15, 16-31, and so on map to the correct local KV blocks on every worker.

In the original vLLM design, workers share one manager and one logical-to-physical mapping, so every GPU uses the same physical block IDs and stores only the slice for its own attention heads.[^kwon2023] Consistent logical bookkeeping is the core requirement: each rank must know which local block corresponds to each logical block for its shard of the cache.

Exact coordination is runtime-specific. Capacity planning needs a safer rule: profile each rank's local KV allocation after sharding or replication instead of assuming the global tensor-payload bytes divide perfectly by TP degree.

The helper below budgets only two explicitly chosen layouts: equal head sharding or full replication. Divisibility is necessary for the first calculation; verify that the model and runtime support the chosen TP configuration before using the estimate. An unverified layout should stop the estimate rather than silently invent a supported deployment.

<!-- leetllm: test, output=show -->
```python title="avoid-assuming-ideal-kv-sharding.py"
def local_kv_heads(kv_heads: int, tp_ranks: int, layout: str) -> int:
    if layout == "replicated":
        return kv_heads
    if layout == "head-sharded" and kv_heads % tp_ranks == 0:
        return kv_heads // tp_ranks
    raise ValueError("unknown layout or indivisible head sharding")


for kv_heads, ranks, layout in [(8, 2, "head-sharded"), (8, 2, "replicated"), (1, 4, "replicated")]:
    heads = local_kv_heads(kv_heads, ranks, layout)
    print(f"{kv_heads} KV heads on TP={ranks}, {layout}: {heads} local heads")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
8 KV heads on TP=2, head-sharded: 4 local heads
8 KV heads on TP=2, replicated: 8 local heads
1 KV heads on TP=4, replicated: 1 local heads
```
<!-- leetllm: output:end -->

---

## Make the pool run out

Use `PagedKVCacheManager(num_blocks=2, block_size=4)` in a fresh session. Allocate A and B, then append four slots to A, and consider what a fifth append must leave behind when it fails. The free list is empty. A must remain at length four with table `[1]`; B still owns `[0]`, even though it hasn't processed a token. The failed append must change none of that state. Free B, retry A's append, and it should return `(0, 0)`. Repeatedly freeing B must not insert block zero twice. These checks catch ownership errors that a successful five-token trace misses.

Continue after defining the manager, with a fresh tiny pool. The snapshot below protects the failure path rather than merely checking the successful trace.

<!-- leetllm: test, output=show, continue=paged-read-parity -->
```python title="retry-after-block-pool-exhaustion.py"
tiny = PagedKVCacheManager(num_blocks=2, block_size=4)
tiny.allocate("A")
tiny.allocate("B")
for _ in range(4):
    tiny.append_slot("A")

def snapshot():
    return (tuple(tiny.free_blocks),
            {name: tuple(ids) for name, ids in tiny.block_tables.items()},
            dict(tiny.seq_lens))

before = snapshot()
try:
    tiny.append_slot("A")
except MemoryError as error:
    print("blocked:", error)
else:
    raise AssertionError("the full pool must reject another block")
assert snapshot() == before
print("failed append preserved state:", snapshot() == before)

tiny.free("B")
tiny.free("B")  # A repeated release must not create another free copy.
assert tiny.free_blocks == [0]
retry = tiny.append_slot("A")
assert retry == (0, 0)
assert tiny.seq_lens == {"A": 5}
assert tiny.block_tables == {"A": [1, 0]} and not tiny.free_blocks
print("retry after freeing B:", retry)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
blocked: KV block pool exhausted
failed append preserved state: True
retry after freeing B: (0, 0)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/pool_exhaustion_state_dark.png" alt="A two-block, four-slot manager starts with A owning block 1 at length four and B owning empty block 0 at length zero. A fifth append raises MemoryError because the free list is empty and leaves both tables, lengths, and blocks unchanged. Freeing B twice returns block 0 once; retry writes slot (0, 0), giving A table [1, 0] and length five." />
  <figcaption>The rejected append preserves A and B’s ownership and lengths. Freeing B twice returns block 0 once, so A’s retry can take that slot without duplicating a free-list entry.</figcaption>
</figure>

Next compare 1,000, 1,008, and 1,009-token prompts assuming all compatible full-attention prefix blocks hit under vLLM's block-aligned logit boundary, where even an exact 1,008-token match recomputes its final sixteen tokens:

<!-- leetllm: test, output=show -->
```python title="recompute-full-prefix-logits.py"
block_size = 16
requests = 100
for prompt_tokens in [1000, 1008, 1009]:
    hit_tokens = ((prompt_tokens - 1) // block_size) * block_size
    remaining = prompt_tokens - hit_tokens
    shared_blocks = hit_tokens // block_size
    private_blocks = (remaining + block_size - 1) // block_size
    occupied = shared_blocks + requests * private_blocks
    assert 0 < remaining <= block_size
    print(f"{prompt_tokens} prompt tokens: {hit_tokens} reused, {remaining} recomputed; "
          f"{occupied} occupied prefix blocks for {requests} requests")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1000 prompt tokens: 992 reused, 8 recomputed; 162 occupied prefix blocks for 100 requests
1008 prompt tokens: 992 reused, 16 recomputed; 162 occupied prefix blocks for 100 requests
1009 prompt tokens: 1008 reused, 1 recomputed; 163 occupied prefix blocks for 100 requests
```
<!-- leetllm: output:end -->

These occupied-block snapshots exclude unreferenced cached blocks, continuation tokens, hybrid cache groups, and other reservations. Calculate prefix capacity from the implementation's block references and reservations; the aligned example's 97.4% saving depends on those accounting choices.

On a GPU system, pair these address and arithmetic checks with a real serving benchmark: compare outputs, actual allocated bytes, preemption counts, TTFT, and inter-token latency under the same model and request trace.

A raw KV payload has a size, a block table has a walk, and packing waste is a different problem from prefix reuse or a scheduler stall. The open question is which prefixes are safe to share, and what a hit changes in prefill.

```mastery-quiz
[
  {
    "question": "A team adds a KV cache to a full-causal-attention model and expects per-token decode time to stop depending on context length. At a decode step with t positions of history, including the new token, how many positions need new K/V projections, and how many positions does the new query read?",
    "options": [
      "1 position needs new projections, and the query reads 1 position.",
      "1 position needs new projections, and the query reads t positions.",
      "t positions need new projections, and the query reads t positions.",
      "t positions need new projections, and the query reads 1 position."
    ],
    "answer": "1 position needs new projections, and the query reads t positions.",
    "explanation": "The cache stores K and V once per position, so each step projects only the new token. That is the work the cache saves. Full causal attention still compares the new query with every key and mixes every value, so the query reads all t positions. Per-step reads therefore grow with context, which is why the team's expectation is wrong and why long-context decode can become sensitive to memory bandwidth. Projecting t positions per step describes decoding with no cache. Reading 1 position would mean that the model ignores its history."
  },
  {
    "question": "A model has 40 layers, 16 query heads, 4 KV heads, head dimension 64, and FP16 cache values. How much raw KV cache does one 4,096-token request need?",
    "options": [
      "640 MiB",
      "160 MiB",
      "80 MiB",
      "40 MiB"
    ],
    "answer": "160 MiB",
    "explanation": "Use 2 x layers x KV heads x head dimension x bytes per value: 2 x 40 x 4 x 64 x 2 = 40,960 bytes, or 40 KiB per token. Over 4,096 tokens, that is 160 MiB. The value 640 MiB uses the 16 query heads, but only KV heads store K and V. The value 80 MiB counts only K or only V, or it forgets that FP16 uses 2 bytes. The value 40 MiB assumes one KV head, which is MQA and not this model."
  },
  {
    "question": "Four requests currently hold 500, 1,000, 250, and 250 cached tokens. Engine X reserves 4,096 slots per request up front. Engine Y allocates 16-slot blocks as needed. How many allocated slots sit empty in each engine?",
    "options": [
      "Engine X: 14,384. Engine Y: 32.",
      "Engine X: 2,096. Engine Y: 32.",
      "Engine X: 2,096. Engine Y: 0.",
      "Engine X: 14,384. Engine Y: 0."
    ],
    "answer": "Engine X: 14,384. Engine Y: 32.",
    "explanation": "Engine X commits 4 x 4,096 = 16,384 slots for 2,000 live tokens, so 14,384 sit empty, and no other request can use them. The value 2,096 treats the four requests as sharing one 4,096-slot buffer. Engine Y rounds each request up to whole blocks: 512 + 1,008 + 256 + 256 = 2,032 slots, which leaves 32 empty. Paging does not remove all waste, because a request's last block can be partly empty. It limits that waste to fewer than 16 slots per request, which is why long reservation tails are what paging recovers."
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
    "explanation": "The logical block is floor(35 / 16) = 2, and the slot is 35 mod 16 = 3. The table maps logical block 2 to physical block 9. Physical block 2 comes from using the logical block number as a physical ID, which skips the table and can read another request's data. Slot 4 comes from counting positions from 1. Physical blocks need not be adjacent or in order, which is why the kernel must follow the table."
  },
  {
    "question": "A team must keep an existing attention kernel that reads K and V from one contiguous address range. It also wants to avoid committing the maximum physical GPU buffer when each request starts. Which design fits both needs?",
    "options": [
      "Store K and V in scattered blocks and pass the block table to the existing kernel.",
      "Reserve contiguous virtual addresses and back pages with physical memory on demand.",
      "Sort the free-block list so that each request's blocks are usually physically adjacent.",
      "Reserve a contiguous physical buffer at the maximum size per request and release it when the request ends."
    ],
    "answer": "Reserve contiguous virtual addresses and back pages with physical memory on demand.",
    "explanation": "The vAttention design reserves a contiguous virtual range for the maximum length. As the cache grows into a page, the runtime backs that whole page with physical GPU memory. Unused slots in the last mapped page still take memory. Later pages can stay unbacked. Passing a block table requires a kernel that can read it. Sorting free blocks cannot preserve contiguous addresses across mixed allocations and frees. Reserving the maximum physical buffer commits memory for every page when the request starts."
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
    "explanation": "With 7 tokens, all three branches need the same empty slot. The first two writers each copy the seven cached entries into a private block and append there. The last writer owns the original block alone and appends in place. Counting only the two copies misses that third block. With 8 tokens, the original stays full and shared. Each branch needs a new block for its next token. Counting only the three new blocks misses the original, which all three branches still read."
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
    "explanation": "500 = 15 x 32 + 20, so there are 15 complete blocks and 20 remaining tokens. All requests share the 15 complete blocks once. Each request keeps its own block for the remaining tokens, so the total is 15 + 50 = 65. That is about 92% fewer than the 800 blocks needed with no sharing. The answer 16 also shares the partial block, but only complete blocks are shared. The answer 15 ignores that the remaining 20 tokens also need K/V slots."
  },
  {
    "question": "A KV pool is full, so the scheduler preempts a request with 6,400 cached tokens at 320 KiB per token. The CPU link moves 2,500 MiB/s in either direction. If the scheduler drops the cache, the GPU must replay all 6,400 tokens at 12,800 tokens/s. From preemption until the cache is ready again, how much transfer time does swapping take, and how much compute time does replay take?",
    "options": [
      "0.8 s to swap and 0.5 s to replay.",
      "1.6 s to swap and 2.0 s to replay.",
      "0.8 s to swap and 2.0 s to replay.",
      "1.6 s to swap and 0.5 s to replay."
    ],
    "answer": "1.6 s to swap and 0.5 s to replay.",
    "explanation": "The cache holds 6,400 × 320 KiB = 2,000 MiB. Moving it to CPU memory takes 2,000 / 2,500 = 0.8 s. Swapping also brings it back to the GPU, for 1.6 s in total. The GPU can replay 12,800 tokens in one second, so rebuilding 6,400 takes half a second. Dividing 12,800 by 6,400 gives two requests of this size per second. Reading that rate as 2.0 seconds per request reverses the units."
  },
  {
    "question": "A serving route's time to first token (TTFT) spikes whenever one very large prompt joins the batch, and KV block usage is high. Which investigation should come first?",
    "options": [
      "Measure how long the allocator spends finding a contiguous buffer for the large prompt.",
      "Split TTFT into queue wait and prefill time, then test chunked prefill on the same traffic.",
      "Profile block-table lookups during prefill, because a large prompt adds more block entries.",
      "Measure cached-history reads per generated token, because a large prompt adds K/V traffic."
    ],
    "answer": "Split TTFT into queue wait and prefill time, then test chunked prefill on the same traffic.",
    "explanation": "TTFT includes queueing, prefill, and transport, and a large prompt adds prefill work that paging does not remove. So first measure where the time goes, then compare chunked prefill on the same traffic before you name a cause. A paged engine allocates in blocks and needs no contiguous buffer, so that search is not a likely suspect. Block-table lookups add some kernel overhead, but they are not the main work that a very large prompt adds. Reads per generated token affect the delay between tokens, which comes after the first token."
  },
  {
    "question": "Every running request fills the full context, so the KV pool has almost no slack left to recover, and each token still costs 320 KiB of raw cache. Which change cuts that per-token cost in half?",
    "options": [
      "Halve the block size from 16 to 8 tokens.",
      "Schedule and retire requests each iteration.",
      "Switch to a FlashAttention-style kernel.",
      "Store KV values in FP8 instead of FP16."
    ],
    "answer": "Store KV values in FP8 instead of FP16.",
    "explanation": "Bytes per token equal 2 x layers x KV heads x head dimension x bytes per value, so halving the bytes per value halves the raw cost. Halving the KV heads in a model trained for that layout would do the same. Smaller blocks reduce only the last partial block, and full requests have almost none. Scheduling and retiring requests each iteration changes when requests use memory, not how many bytes a live token takes. A FlashAttention-style kernel changes how attention moves data during computation, not how many bytes are cached. Real capacity also depends on scales, workspaces, and kernel support, and lower precision needs a quality check."
  }
]
```

> **Next:** Continue to [Prefix Caching and Prompt Caching](/learn/prefix-caching-prompt-caching). Decide which compatible prefixes may be reused, how cache hits change prefill work, and where the reuse cutoff belongs between tenants.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->
Here's an outage that looks impossible. Your server is rejecting new requests because its KV pool is full. You check what's actually stored: 1.82 GiB of live attention state in a 10 GiB pool. Eighty-two percent of the memory holds nothing at all, and users are getting errors anyway.

The arithmetic checks out, and systems used to be built exactly this way. Four requests each reserved room for 8,192 positions the moment they arrived, in case they grew that far. Most never will, but nobody else can touch their reserved space while they run.

<!-- leetllm: test, output=show, id=reader-kv-reservation-waste -->
```python title="measure-reservation-waste.py"
bytes_per_token = 320 * 1024
max_tokens = 8192
live_tokens = [600, 1250, 4000, 128]

reserved = len(live_tokens) * max_tokens * bytes_per_token
live = sum(live_tokens) * bytes_per_token
print(f"reserved: {reserved / 1024**3:.2f} GiB")
print(f"live state: {live / 1024**3:.2f} GiB")
print(f"unused reservation: {1 - live / reserved:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reserved: 10.00 GiB
live state: 1.82 GiB
unused reservation: 81.8%
```
<!-- leetllm: output:end -->

The fix came from an idea operating systems settled decades ago: virtual memory. This chapter explains how serving engines applied it to the KV cache, and it answers three plain questions you'll need in any capacity conversation. How many bytes does a token add? Where do those bytes live? And who is allowed to change or release them?

## Why keep this state at all

You met the cache in the [inference chapter](/learn/inference-mechanics-ttft-tps-kv-cache). Now look at it from the point of view of one attention layer.

The newest position produces a query, a key, and a value. Its query gets compared against the keys of every visible position, and the resulting weights mix their values. Causal decoding means the new position can look at earlier positions and itself, and never ahead.[^vaswani2017] Earlier positions' queries have already done their job, so you can throw those away. Their keys and values get used again on every future step, so you keep them.

<figure>
  <img src="illustrations/_generated/kv_decode_cache_loop_llama70b_dark.png" alt="Decode snapshots append one key-value pair per new position while each new query reads the accumulated visible prefix. Full-model payloads for the shape below are 320, 640, and 1,600 KiB." />
  <figcaption>Each step appends one key-value pair and reads all cached positions, including the new pair. Earlier pairs never change.</figcaption>
</figure>

Caching saves you from recomputing the projections of the history. It doesn't save you from reading the history, and each new query still scans all of it in ordinary full attention. So a longer conversation costs you twice: more bytes stored, and more work on every step.

One distinction will matter when we get to failure recovery. A **sampled token** is one the model has chosen, and it may already be on its way to the user. A **processed position** is one whose keys and values exist in the cache. These differ by one, because a token gets its cache entry only when it's fed back in. Mix them up and a paused request can resume incorrectly.

## How many bytes does a token cost?

For ordinary full-attention layers, the payload is

$$
M_{\mathrm{KV}}=2BLTn_{\mathrm{kv}}d_hs,
$$

the same formula as in the [inference chapter](/learn/inference-mechanics-ttft-tps-kv-cache). $B$ is the number of active requests, $L$ the number of those layers, $T$ the cached positions per request, $n_{\mathrm{kv}}$ the KV-head count, $d_h$ each head's width, and $s$ the bytes per stored value. The leading two counts keys and values.

Grouped-query attention lets several query heads share a KV head, so use the smaller KV count here. Query heads still affect computation, but they don't change storage. Multi-query attention pushes the same idea further.[^ainslie2023][^shazeer2019]

We'll switch models here, because Qwen's hybrid layers need a second term and every layer of Llama 3 70B is ordinary attention. Put in its numbers: 80 layers, eight KV heads, head width 128, two bytes per value.[^dubey2024] One cached position across the whole model costs

$$
2\times80\times8\times128\times2
=327{,}680\text{ bytes}
=320\text{ KiB}.
$$

Hold on to that figure. Every token in every active conversation costs a third of a megabyte. A 4,096-position request takes 1.25 GiB. At 8,192 positions it's 2.5 GiB. At 128K positions, the limit of the later Llama 3.1 version, a single request's cache needs 40 GiB, which can exceed what's left after loading the model.

<!-- leetllm: test, output=show, id=reader-kv-payload -->
```python title="kv-payload.py"
layers, kv_heads, head_width, value_bytes = 80, 8, 128, 2
bytes_per_position = 2 * layers * kv_heads * head_width * value_bytes
for length in (4096, 8192, 131072):
    payload = bytes_per_position * length
    print(f"{length} positions: {payload / 1024**3:.2f} GiB")
assert bytes_per_position == 320 * 1024
```

<!-- leetllm: output:start -->
```text title="Output" output compact
4096 positions: 1.25 GiB
8192 positions: 2.50 GiB
131072 positions: 40.00 GiB
```
<!-- leetllm: output:end -->

This is why "long context" is a capacity decision and not only a model feature. Offering 128K positions on this shape means each such request consumes what 16 ordinary 8K requests would. It also explains a common surprise: quantizing the weights can make a checkpoint fit on your GPU, and leave more room for the cache, while each request's two-byte cache stays exactly as large as before. Reducing cache precision is a separate choice, with its own kernel support and accuracy checks.

A few things change the arithmetic. For requests of unequal length, sum each request's length rather than multiplying everyone by the longest. Hybrid architectures need a second term, because their recurrent or linear-attention layers hold state that doesn't grow with context, though it still grows with the number of active requests. And when a model spans several GPUs, do the budget **per rank**. Some tensors split across ranks and others replicate, so dividing the total by the device count is valid only when the actual layout allows it. The fullest rank decides how many requests you can take.

## Reservations hide usable capacity

Now return to that impossible outage. Picture a pool of ten equal blocks. Requests A and B each reserve five, because they might grow that far, but each is using only three right now. A third request needs two blocks.

<figure>
  <img src="illustrations/_generated/paged_attention_dark.png" alt="Two snapshots of ten blocks compare two maximum-length reservations against dynamic allocation for A, B, and C." />
  <figcaption>The same ten blocks, the same live state, two different answers. Reserving for the future locks C out. Allocating on demand lets C in and still leaves two blocks free.</figcaption>
</figure>

Under maximum reservations, every block has an owner and C gets rejected. Allocate on demand instead, and A and B hold six blocks between them, C gets its two, and two stay free. The live data never changed. Only the allocation strategy did.

The vLLM team, who introduced this design, identified three distinct kinds of waste:[^kwon2023]

- **Internal fragmentation:** a request reserves 8,192 slots and finishes at 600. The other 7,592 sat trapped the whole time.
- **Reservation waste:** even slots a request will eventually use are locked from the first step, so they sit idle for hundreds of decode cycles.
- **External fragmentation:** requests of different lengths finish at different times and leave scattered holes. There may be plenty of free memory in total and no single region large enough for a new reservation.

Their 2023 announcement reported 60% to 80% waste in the systems they studied, and the paper reported 2 to 4 times the throughput for particular models and workloads.[^vllm2023pagedBlog][^kwon2023] Keep those results in their setting. They came from synthesized workloads on specific hardware, and modern runtimes have other options, such as pool-based allocators, so don't treat those percentages as a padding factor for your own capacity plan.[^nvidia2021streamAllocator] Measure your own.

## Paging: the operating system's old trick

Your laptop solved this problem long ago. A program sees one continuous address space, and the operating system quietly scatters its pages across physical memory. PagedAttention applies the same idea to the KV cache.

Storage is divided into fixed-size blocks in one shared pool. Each request gets a **block table** that maps its logical blocks, which stay in token order, to physical blocks, which can sit anywhere. For a block holding $b$ positions, logical position $t$ resolves as

$$
j=\left\lfloor\frac{t}{b}\right\rfloor,\qquad
r=t\bmod b,\qquad
\text{address}(t)=(\text{table}[j],r).
$$

Say the block size is four, the table is $[19,7]$, and the request has five valid positions. Positions zero through three live in block 19. Position four lives at slot zero of block 7.

<figure>
  <img src="illustrations/_generated/paged_block_table_mapping_dark.png" alt="A five-position request maps its first four positions to block 19 and its fifth to slot zero in block 7; three trailing slots are invalid." />
  <figcaption>The table translates addresses, and the valid length says where the data stops. The last three slots of block 7 belong to this request but hold nothing it should read.</figcaption>
</figure>

Look at those last three slots of block 7. The request owns them, but they contain no valid data, and reading them produces a wrong answer rather than an error. So the allocator and the attention kernel have to agree exactly about tables, lengths, head layout, and element type.

> **Common mistake:** Passing the block table to an attention kernel without enforcing `valid_length` silently mixes uninitialized trailing slots from the last block into the softmax weights. Always test paged attention against a contiguous reference on lengths that are not multiples of the block size.

Paging also changes what fragmentation means. Any free block can satisfy any one-block allocation, so scattered holes stop being a problem within that pool. Waste moves to the tail: $T$ positions take $\lceil T/b\rceil$ blocks, leaving

$$
b\left\lceil T/b\right\rceil-T
$$

unused slots, somewhere from zero to $b-1$. Percentages can mislead here. With 16-position blocks, one live token wastes 93.75% of its block, but that's only 15 slots. A 120-token request wastes 6.25%. An 8,192-token request fills exactly 512 blocks and wastes none.

Block size is a real engineering trade-off. Small blocks cut tail waste and allow finer sharing, but they mean bigger tables and less regular memory access. Large blocks do the reverse. Block size can also change kernel speed in either direction, depending on the kernel. The vLLM paper's best range was 16 to 128 positions for one workload and 16 to 32 for another, which should tell you to test your own traffic on your own kernel.[^kwon2023]

## Test the read, not just the addresses

Address arithmetic is easy to get right and still ship a bug that silently corrupts answers. So test attention itself. The example below compares a paged read against a plain contiguous reference. Three valid pairs span blocks 3 and 1, a large sentinel fills the invalid tail, and a different request owns block 2.

<!-- leetllm: test, deps=numpy, output=show, id=reader-kv-read-parity -->
```python title="paged-read-parity.py"
import numpy as np

k_seq = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]], dtype=np.float64)
v_seq = np.array([[2.0, 1.0], [0.0, 3.0], [4.0, 2.0]], dtype=np.float64)
k_pool = np.full((4, 2, 2), 1000.0, dtype=np.float64)
v_pool = np.full((4, 2, 2), 999.0, dtype=np.float64)
k_pool[3, :2], v_pool[3, :2] = k_seq[:2], v_seq[:2]
k_pool[1, 0], v_pool[1, 0] = k_seq[2], v_seq[2]
k_pool[2, 0], v_pool[2, 0] = [-1.0, 0.0], [-5.0, -5.0]
table, block_size, valid_length = [3, 1], 2, 3

def gather(mapping: list[int], length: int) -> tuple[np.ndarray, np.ndarray]:
    blocks = [mapping[pos // block_size] for pos in range(length)]
    offsets = [pos % block_size for pos in range(length)]
    return k_pool[blocks, offsets], v_pool[blocks, offsets]

def attend(query: np.ndarray, keys: np.ndarray, values: np.ndarray) -> np.ndarray:
    scores = (keys @ query) / np.sqrt(keys.shape[-1])
    weights = np.exp(scores - np.max(scores))
    return (weights / weights.sum()) @ values

query = np.array([1.0, 0.5], dtype=np.float64)
expected = attend(query, k_seq, v_seq)
k_paged, v_paged = gather(table, valid_length)
actual = attend(query, k_paged, v_paged)
assert np.array_equal(k_paged, k_seq) and np.array_equal(v_paged, v_seq)
assert np.allclose(actual, expected, atol=1e-12)
assert not np.allclose(attend(query, *gather(table, 4)), expected)
assert not np.allclose(attend(query, *gather([3, 2], 3)), expected)
print(tuple(round(float(value), 6) for value in actual))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
(2.461842, 1.90474)
```
<!-- leetllm: output:end -->

Reading one position too far pulls in the sentinel, and the wrong table reads another request's data. Think about what that second failure means in production: one customer's context leaking into another customer's answer. The test also checks gathered order directly, since an attention sum alone can hide a permutation when keys and values move together. A real kernel reads the mapped layout directly and doesn't build a Python list, but a reference like this tells you what correct looks like.

```checkpoint
A paged read returns the right addresses, but answers are subtly wrong for requests whose length isn't a multiple of the block size. Where would you look first?
---
At the valid length. A request's last block can contain stale slots it owns but never wrote. If the kernel reads the full block rather than stopping at the valid length, those slots enter attention and change the result without raising any error.
```

## Sharing needs an ownership rule

Paging unlocks something contiguous buffers can't do easily: two sequences can share blocks. Beam search and parallel sampling branch from a common prefix, and there's no reason to store that prefix twice. A **reference count** on each physical block records how many sequences depend on it. Releasing one branch decrements the count, and the block returns to the pool only when the count reaches zero.

The hard case is a partly full shared block. Suppose it holds 10, 20, and 30 with one free slot. Branch A wants to append 90 and branch B wants to append 80. If both write to the same physical slot, the later write silently destroys the earlier branch.

<figure>
  <img src="illustrations/_generated/shared_partial_block_cow_dark.png" alt="Two branches share values 10,20,30, then copy-on-write gives A a private 90 tail while B writes 80." />
  <figcaption>Two branches can share history until they write. Copy-on-write gives the first writer a private block, so neither branch can overwrite the other.</figcaption>
</figure>

**Copy-on-write** solves it, as it does in your operating system's process fork. Before A modifies a block with more than one owner, allocate a private block, copy the valid prefix, move A's ownership over, and append 90 there. B is now the sole owner of the original block and can append 80 in place.

The order of those steps matters. Allocation can fail partway through, and when it does, the original table and ownership have to be intact. Update the table before you hold the new block, and a request can lose its usable history.

Sharing also has a meaning problem, which the next chapter takes up. Text that looks identical isn't enough if the token history, the model, the adapter, or the permitted sharing scope differs.

## When the pool runs out anyway

Paging cuts waste, but it doesn't create memory. Eventually an append needs a block and none are free. Your scheduler has to delay new work, pause something, reclaim cached blocks, or recover later. Whichever it does, the first rule is that failure must leave existing state usable.

Take the smallest possible case: two physical blocks of four positions each. A owns one full block and B owns the other. A's fifth append needs a new block and fails. At that moment A's length and table, B's ownership, and the free list must all be exactly what they were.

<figure>
  <img src="illustrations/_generated/pool_exhaustion_state_dark.png" alt="A failed fifth append leaves the two-block pool unchanged; freeing B once allows A to retry into that returned block." />
  <figcaption>A failed append changes nothing. Freeing B returns its block exactly once, and A's retry advances its length only after it holds storage.</figcaption>
</figure>

When B finishes, its block goes back to the pool. Make sure that happens once. If cleanup runs twice and a block appears in the free list twice, two later requests will both believe they own it, and you'll spend a very bad week tracking down answers that mix two conversations.

Often nothing finishes in time, and the scheduler has to pause a running request. So who gets paused? The original vLLM design pauses the newest arrival first, so a request that has been running a long time, and may be one token from done, usually keeps going while the latest one waits.[^kwon2023] That victim rule is configurable, so check what your engine uses.

Getting a paused request running again costs something either way. **Recomputation** releases the blocks and rebuilds the missing cache from the accepted tokens, spending compute. **Swapping** moves blocks to CPU memory and back, spending PCIe bandwidth, and needs a compatible restore. vLLM V1 defaults to recomputation, and its optimization guide warns that preemption can hurt end-to-end latency.[^vllm2026optimization] The original paper evaluated both.[^kwon2023] Whichever you use, a request that gets preempted repeatedly pays over and over, so treat frequent preemption as a sign you're short of capacity.

Tie cleanup to every way a request can end: completion, cancellation, timeout, and failure. A client that disconnects should release what it owns. Reusable prefix blocks can stay behind as evictable entries, but that's a different lifetime from a live request's, and you should track them separately.

## Put a number on your capacity

Now put it together. Use Llama 3 70B at 8,192 positions again, which is 2.5 GiB per request across the model. If those eight KV heads really do shard evenly across two ranks, each rank stores 1.25 GiB per request. Suppose profiling shows 8 GiB of usable KV pool per rank after weights, kernels, communication buffers, and safety headroom. Then six full requests fit, and the seventh doesn't.

<!-- leetllm: test, output=show, id=reader-kv-capacity -->
```python title="full-context-capacity.py"
bytes_per_position = 2 * 80 * 8 * 128 * 2
per_request = bytes_per_position * 8192
ranks, kv_heads = 2, 8
assert kv_heads % ranks == 0
per_rank = per_request / ranks
pool_per_rank = 8 * 1024**3
print(f"per rank, per request: {per_rank / 1024**3:.2f} GiB")
print("full requests that fit:", int(pool_per_rank // per_rank))
print("blocks per request:", 8192 // 16)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
per rank, per request: 1.25 GiB
full requests that fit: 6
blocks per request: 512
```
<!-- leetllm: output:end -->

That 8 GiB has to come from measuring the runtime. Advertised memory minus model size is not your pool. And six is a limit on stored bytes for requests at full length, which isn't a promise about latency. Shorter requests, sharing, and preemption all change the live state, and only a load test tells you where the useful operating point sits.

If that number is too small, it gets worse before it gets better, because the cache keeps growing with context. A Llama 3 70B-shaped cache at 128K positions needs 40 GiB in FP16, which can rival what's left after loading the weights. You have several levers, and they do different things. An 8-bit cache format such as FP8 halves the bytes per value, which isn't the same as doubling throughput, since scales, workspaces, and kernel support still count. Research systems such as SnapKV and H2O keep only selected positions from the history.[^li2024snapkv][^zhang2023h2o] That saves memory, but selection is approximate and can drop the very passage a later token needs, so it requires a quality check. Spreading the model across more ranks moves the bytes without shrinking them.

It helps to keep straight what each lever actually changes:[^liu2024kivi][^liu2024cachegen][^qin2024]

| Lever | What it changes | What to check |
|---|---|---|
| FP8 cache format | Bytes per value | Kernel support, scales, and answer quality |
| KIVI | How keys and values are represented, with recent tokens kept at full precision | Residual-buffer size and dequantization cost |
| SnapKV, H2O | Which positions stay in the cache | Quality, since a dropped position can be the one a later token needs |
| CacheGen | Bytes stored and sent, decoded back to ordinary tensors before attention | Reconstruction quality. The local footprint may not shrink. |
| Mooncake | Where the state lives, across pooled CPU, DRAM, SSD, and GPU workers | Time to first token, token gaps, and network traffic |

Compare them one at a time, with the same model, hardware, precision, length distribution, concurrency, and quality target, before you change a capacity or latency promise.

Before you accept anyone's capacity claim, including your own, ask whether it names the architecture, the cache precision, the sequence-length distribution, the per-rank layout, the pool size, and the sharing and eviction rules. Then ask whether reads were checked against a reference, and whether cancellation and exhaustion keep state correct.

The cache now has an address model and a lifetime. That sets up an obvious question: if two requests begin with the same 6,000 tokens, why compute them twice? [Prefix caching](/learn/prefix-caching-prompt-caching) reuses that work across requests, and the savings can be large, provided you define "the same" carefully.

<!-- leetllm: edition:reader:end -->
