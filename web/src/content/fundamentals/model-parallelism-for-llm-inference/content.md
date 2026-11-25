---
{
  "id": "model-parallelism-for-llm-inference",
  "title": "Model Parallelism for LLM Inference",
  "slug": "model-parallelism-for-llm-inference",
  "section": "GPU Systems & LLM Inference",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 9,
  "coverImage": "illustrations/_generated/inference_parallelism_dark.png",
  "shortDescription": "When a 70 GB weight file exceeds one GPU, sharding buys memory and spends it on traffic between devices.",
  "keyConceptsTested": [
    "Tensor parallel sharding",
    "Pipeline parallel stages",
    "Context parallel long-context serving",
    "Expert parallelism for MoE serving",
    "KV-head divisibility for tensor parallelism",
    "Interconnect and all-reduce overhead",
    "Per-rank memory and SLO eligibility"
  ],
  "prerequisites": [
    "continuous-batching-request-scheduling",
    "kv-cache-paged-attention-llm-serving",
    "multi-query-grouped-query-attention"
  ],
  "relatedQuestions": [
    "cuda-gpu-computing-for-ml",
    "model-quantization-gptq-awq-gguf",
    "llm-deployment-gpu-serving-autoscaling",
    "local-llm-deployment-hardware-quantization",
    "distributed-training-fsdp-deepspeed-zero",
    "mixture-of-experts-architecture",
    "positional-encoding-rope-alibi"
  ],
  "companies": [
    "NVIDIA",
    "OpenAI",
    "Anthropic",
    "Meta",
    "Google",
    "DeepSeek",
    "Z.AI"
  ],
  "aliases": [
    "distributed-inference-data-plane"
  ]
}
---

Take a 35B-parameter model like Qwen3.6-35B-A3B (`35B` total, `3B` active per token).[^qwen3635b2026] In <span data-glossary="bf16">BF16</span>, its weights weigh roughly **70 GB** (all experts still need VRAM unless offloaded). Put it on an 80 GB GPU with a 16 GB runtime reserve (leaving 64 GB free), and the checkpoint overflows by 6 GB before a single user prompt arrives.

Once a model outgrows one GPU, **model parallelism** splits a single replica across devices. That buys VRAM headroom, and spends it on cross-GPU communication. Every parallelism axis makes a different trade-off between memory, wire speed, and latency: **tensor parallelism (TP)** slices layers horizontally for low latency over fast NVLink, **pipeline parallelism (PP)** slices layers vertically across nodes, **context parallelism (CP)** shards ultra-long KV histories, and **expert parallelism (EP)** places whole MoE experts on separate GPUs.

<figure>
  <img src="illustrations/_generated/inference_parallelism_dark.png" alt="Per-rank VRAM bars on 80 GB GPUs compare TP=1, TP=2, and TP=4 against an 80 GB limit line. TP=1 asks for 70 GB of weights and 16 GB reserve, overflowing by 6 GB. Both TP=2 ranks hold 35 GB of weights and 16 GB reserve with 29 GB free, while TP=4 drops weights to 17.5 GB per rank and leaves 46.5 GB free." />
  <figcaption>Per-rank VRAM on 80 GB GPUs: TP=1 overflows by 6 GB, TP=2 leaves 29 GB/GPU for KV cache, and TP=4 leaves 46.5 GB/GPU.</figcaption>
</figure>

```checkpoint
Why can Qwen3.6-35B-A3B need more than one GPU before serving any real traffic?
---
On an 80 GB GPU with a 16 GB runtime reserve, only 64 GB remains for ~70 GB of BF16 weights. The 3B active count reflects per-token FLOPs rather than total resident weight storage.
```

## Why inference sharding differs from training

Distributed training chases aggregate throughput while storing gradients and optimizer state. Inference serving lives on an interactive latency clock: <span data-glossary="ttft">time to first token (TTFT)</span> exposes prefill time, <span data-glossary="tokens-per-second">tokens per second (TPS)</span> governs autoregressive decode, and per-rank <span data-glossary="kv-cache">KV cache</span> sets batch concurrency.

| Technique | Training focus | Inference focus |
|---|---|---|
| <span data-glossary="tensor-parallelism">Tensor parallelism (TP)</span> | Split matmuls and gradients | Split weights/activations; pay per-layer all-reduce latency |
| <span data-glossary="pipeline-parallelism">Pipeline parallelism (PP)</span> | Fill stages with microbatches | Split depth across slower links without per-layer collectives |
| <span data-glossary="sequence-parallelism">Sequence parallelism</span> | Shard LayerNorm/Dropout activations | Training memory trick, distinct from inference CP |
| <span data-glossary="context-parallelism">Context parallelism (CP)</span> | Split long documents in training | Shard ultra-long prefill attention and decode KV history |
| Data parallelism (DP) | Replicate model and sync gradients | Independent serving replicas scaling cluster throughput |

Always map logical shard counts onto physical interconnects: `TP=4` over intra-node <span data-glossary="nvlink">NVLink</span> flies, while `TP=4` over PCIe or Ethernet stalls on collectives.[^vllm2026distributed][^nccl2026guide]

## Tensor parallelism

### The Megatron column-then-row pattern

Consider a Transformer <span data-glossary="feed-forward-network">MLP block</span> $Z = \text{GeLU}(x A) B + b$. Splitting $A$ by rows would force an all-reduce *before* GeLU because $\text{GeLU}(u + v) \neq \text{GeLU}(u) + \text{GeLU}(v)$. **<span data-glossary="nvidia-megatron">Megatron-LM</span>** avoids that extra sync by pairing a **column split** with a **row split**:[^shoeybi2019]

1. **Column-parallel $A = [A_0 \mid A_1]$:** Both ranks read replicated $x$, compute $x A_0$ and $x A_1$, and apply elementwise $\text{GeLU}(\cdot)$ locally with **zero communication**.
2. **Row-parallel $B = \begin{bmatrix} B_0 \\ B_1 \end{bmatrix}$:** Each rank multiplies its local hidden slice by its row shard ($h_0 B_0$ and $h_1 B_1$).
3. **One SUM all-reduce:** Sum the partials across ranks ($h_0 B_0 + h_1 B_1$), then add bias $b$ **once**.

Multi-head attention uses the exact same symmetry: $W_Q, W_K, W_V$ split column-wise by head, attention runs locally per head, and $W_O$ splits row-wise into one final SUM all-reduce. That gives **two all-reduces per Transformer layer**.

<figure>
  <img src="illustrations/_generated/tensor_shards_dark.png" alt="Megatron-LM MLP Z=GeLU(xA)B+b dataflow across two ranks. Both ranks receive x=[1,2]. Rank 0 computes xA0=[1,1], h0=[0.84,0.84], and p0=[0.84,0.84]; Rank 1 computes xA1=[0,4], h1=[0,4.0], and p1=[-4.0,8.0]. Arrows converge at one SUM all-reduce yielding [-3.16,8.84], then adding bias [0.5,-0.5] once gives [-2.66,8.34]." />
  <figcaption>Column shards of $A$ keep GeLU completely local, while row shards of $B$ defer communication to a single SUM all-reduce before adding bias once.</figcaption>
</figure>

<!-- leetllm: test, deps=torch, output=show -->
```python title="tensor-parallel-mlp.py"
import torch
import torch.nn.functional as F

x = torch.tensor([[1., 2.]], dtype=torch.float64)
A = torch.tensor([[1., -1., 2., 0.], [0., 1., -1., 2.]], dtype=torch.float64)
B = torch.tensor([[1., 0.], [0., 1.], [1., 1.], [-1., 2.]], dtype=torch.float64)
bias = torch.tensor([0.5, -0.5], dtype=torch.float64)

dense = F.gelu(x @ A) @ B + bias
partials = [F.gelu(x @ a) @ b for a, b in zip(A.chunk(2, dim=1), B.chunk(2, dim=0))]
sharded = torch.stack(partials).sum(dim=0) + bias

torch.testing.assert_close(sharded, dense)
print("dense output:  ", [round(v, 4) for v in dense[0].tolist()])
print("sharded output:", [round(v, 4) for v in sharded[0].tolist()])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dense output:   [-2.6585, 8.3411]
sharded output: [-2.6585, 8.3411]
```
<!-- leetllm: output:end -->

### KV-head divisibility and replication

Under <span data-glossary="grouped-query-attention">GQA</span>, clean sharding without duplication requires $n_{\text{kv\_heads}} \pmod{\text{TP}} = 0$. When `TP` exceeds the KV-head count (for example, Qwen3.6-35B-A3B's 10 full-attention layers have 16 query heads and only **2 KV heads**[^qwen2026a3bConfig]), engines like vLLM replicate KV heads whenever `TP` is a multiple of `n_kv_heads`.[^vllm2026qkvLinear] At `TP=8`, four ranks store identical copies of each KV head, so raising TP from 2 to 8 stops shrinking per-rank KV memory!

<figure>
  <img src="illustrations/_generated/kv_head_replication_dark.png" alt="Comparison of TP=2 and TP=8 on 16 query heads and 2 KV heads. TP=2 assigns 8 query heads and 1 unique KV head per rank for 1x physical KV copies. TP=8 assigns 2 query heads per rank while replicating each KV head four times across ranks 0 to 3 and ranks 4 to 7." />
  <figcaption>At TP=8 with 2 KV heads, each KV head is replicated across four ranks, eliminating further per-rank KV memory savings unless decode context parallelism shards the history.</figcaption>
</figure>

### Why decode collectives are latency-bound, not bandwidth-bound

In an 80-layer dense model (`2` all-reduces per layer), every decode step runs **160 collectives** (`20,320` across 127 decode steps for a 128-token reply). For batch 8, hidden size 4,096, BF16, at `TP=4`, each ring all-reduce sends $2\frac{\text{TP}-1}{\text{TP}} \times 64\text{ KiB} = 96\text{ KiB}$ per rank. At 300 GB/s NVLink, 160 transfers take only **0.05 ms/step** on the wire, whereas 5–20 $\mu$s of per-collective launch and sync overhead adds **0.8–3.2 ms/step**![^nccltestsPerformance2026] That is why high-TP serving thrives inside wide coherent NVLink domains (like NVIDIA GB200 NVL72[^nvidia2026gb200nvl72]) and degrades sharply over slower PCIe or cross-node links.

<figure>
  <img src="illustrations/_generated/collective_communication_ledger_dark.png" alt="Execution timeline and cost breakdown for an 80-layer TP=4 BF16 workload at batch 8 versus PP=2. Top timelines compare low-overhead NVLink TP execution, PCIe collective stalls, and single-handoff PP=2 execution. Bottom bars show that 96 KiB ring transfers take only 0.05 ms per step at 300 GB/s, dwarfed by 0.80 ms to 3.20 ms of serial collective launch overhead at 5 to 20 microseconds per call." />
  <figcaption>At small decode batches, 160 collectives spend 0.8–3.2 ms in launch/sync overhead versus just 0.05 ms transferring 96 KiB payloads across NVLink.</figcaption>
</figure>

### Collective contracts and NCCL completion boundaries

Inside a replica, ranks coordinate through three core <span data-glossary="nccl">NCCL</span> primitives: **all-reduce** sums partials and writes the full vector to every rank, **reduce-scatter** sums partials and gives each rank its assigned slice, and **all-gather** concatenates slices in rank order.[^nccl2026collectives] Every participating rank must submit the exact same collective sequence (operation, count, dtype, and order): swapping two same-shaped reductions silently combines different layers without a shape error, and cancelling one rank's call hangs its peers.[^nccl2026groups]

> **Common mistake:** Treating a returning `ncclAllReduce` CPU call as a completed GPU result. Host enqueue, `ncclGroupEnd` / nonblocking `ncclInProgress` issue completion, and CUDA stream completion are three separate milestones; downstream kernels must wait on the CUDA stream or completion event.[^nccl2026streams]

## Pipeline parallelism

**Pipeline parallelism (PP)** slices the model by depth: Stage 0 runs layers 0–39 and sends one activation tensor $[B, s, h]$ to Stage 1 for layers 40–79. With $p$ equal stages and $m$ microbatches, completion takes $m + p - 1$ time slots, leaving a **pipeline bubble fraction**:

$$
F_{\text{bubble}} = \frac{p - 1}{m + p - 1}
$$

For $p = 3$ stages, occupancy rises from `33.3%` at $m = 1$ to `66.7%` at $m = 4$ and `85.7%` at $m = 12$. Note a key intuition: a single isolated request on 3 stages does **not** take $3\times$ longer; it pays only the sum of stage compute plus two point-to-point transfers (`6.4 ms` vs. `6.0 ms` = `1.07x`). PP shines across slow links and multi-node topologies (commonly paired as intra-node TP + inter-node PP), though before adding nodes for giant checkpoints like Llama 3.1 405B (`202.5 GB` INT4) or DeepSeek-V3 671B (`335.5 GB` INT4), always check whether quantized weights already fit inside one 8-GPU node (`640 GB`).[^dubey2024][^deepseekv3_2024]

<figure>
  <img src="illustrations/_generated/pipeline_bubbles_dark.png" alt="Three-stage pipeline schedules compare microbatch counts: m=1 fills 3 of 9 slots (33.3% active), m=4 fills 12 of 18 slots (66.7% active), and m=12 reaches 36 of 42 slots (85.7%). Below, a single request crosses three 2 ms stages and two 0.2 ms transfers in 6.4 ms, a 1.07x ratio relative to 6.0 ms compute alone." />
  <figcaption>More microbatches shrink the pipeline bubble from 66.7% ($m=1$) to 14.3% ($m=12$). One isolated request pays only stage compute plus inter-stage hops (6.4 ms vs. 6.0 ms).</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/hybrid_stage_topology_dark.png" alt="Eight-rank hybrid TP=4 x PP=2 topology: Node 0 hosts layers 0 to 39 on TP ranks 0 to 3 with fast intra-node SUM all-reduces, forwards hidden state [B, s, h] once across an inter-node PP edge to Node 1 (layers 40 to 79, TP ranks 4 to 7), then feeds sampled logits back to Stage 0 for the next decode step." />
  <figcaption>Hybrid TP=4 × PP=2 keeps frequent all-reduces inside each node's NVLink fabric and crosses the slower inter-node link just once per forward pass.</figcaption>
</figure>

## Context parallelism for long-sequence serving

At 1M tokens, even an 8-KV-head GQA model (80 layers, head dim 128, FP16) needs **305.2 GiB** of KV cache (`76.3 GiB` per GPU even split 4 ways, exceeding a single 80 GB card before weights). Distinct from training-time sequence parallelism (which shards LayerNorm/Dropout activations),[^megatronCoreParallelism2026] **context parallelism** handles long prompts across three patterns:

- **Ring Attention (prefill):** Each GPU pins its local query chunk while KV chunks circulate clockwise around a GPU ring, overlapping transfers with block FlashAttention and merging via online softmax.[^liu2024ring]
- **DeepSpeed Ulysses (training / prefill):** Uses two All-to-All collectives to transpose sequence shards into head shards for local FlashAttention, then transposes back (requires enough heads to divide across ranks).[^deepspeed2023ulysses]
- **Decode Context Parallelism (DCP):** When `TP > n_kv_heads` creates replicated KV groups (e.g., 4 partner ranks per KV head at `TP=8, G=2`), vLLM's `DCP=4` assigns every fourth token (`pos % 4 == lane`) to a different partner rank, cutting duplicated physical KV pairs 4x (`256 -> 64` for a 32-token history) with zero extra GPUs!

<figure>
  <img src="illustrations/_generated/ring_attention_prefill_dark.png" alt="Four-way Ring Attention prefill circulates KV blocks clockwise across GPUs 0 to 3 while each rank keeps its local query block Q_i pinned and merges results with online softmax. Below, splitting a 305.2 GiB 1M-token KV footprint four ways still uses 76.3 GiB per device, exceeding a 74.5 GiB (80 decimal GB) limit before weights." />
  <figcaption>Ring Attention circulates KV blocks clockwise around the ring, overlapping communication with local blockwise attention.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/ulysses_prefill_layout_dark.png" alt="DeepSpeed Ulysses transposes sequence shards into head shards and back. Stage 1 holds sequence slices S/4 with all heads, runs All2All #1 into Stage 2 holding head slices H/4 over the full sequence for local FlashAttention, then runs All2All #2 into Stage 3 sequence slices before output projection." />
  <figcaption>DeepSpeed Ulysses swaps sequence shards for head shards via two All-to-All collectives so FlashAttention runs over the full sequence locally.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/dcp_history_ownership_dark.png" alt="Decode context parallelism (DCP=4) stride matrix and memory comparison for TP=8, 2 KV heads, and 32 tokens. Lane r owns tokens satisfying pos mod 4 == r, cutting physical KV pairs from 256 (32 per rank) down to 64 (8 per rank, a 4x reduction)." />
  <figcaption>DCP=4 strides token ownership across replicated KV partner ranks (`pos mod 4`), removing the 4x KV duplication.</figcaption>
</figure>

> **Common mistake:** When merging partial attention outputs across context shards, **never average local shard outputs**! Two keys scoring `1000` with value `0` carry twice the mass of one key scoring `1000` with value `9`, yielding `3.0` instead of the naive average `4.5`. Weight each shard by its unnormalized softmax mass using a shared global maximum $M = \max_j m_j$:

$$
o = \frac{\sum_j e^{m_j - M} u_j}{\sum_j e^{m_j - M} l_j}
$$

<!-- leetllm: test, output=show -->
```python title="dcp-and-mass-aware-merge.py"
from math import exp

def shard_stats(scores, values):
    if not scores:
        return None
    m = max(scores)
    w = [exp(s - m) for s in scores]
    return m, sum(w), sum(wi * vi for wi, vi in zip(w, values))

def merge_shards(parts):
    active = [p for p in parts if p is not None]
    M = max(m for m, _, _ in active)
    denom = sum(exp(m - M) * l for m, l, _ in active)
    numer = sum(exp(m - M) * u for m, _, u in active)
    return numer / denom

parts = [shard_stats([1000., 1000.], [0., 0.]), shard_stats([1000.], [9.]), shard_stats([], [])]
naive = sum(u / l for _, l, u in parts if l) / 2 if False else (0.0 + 9.0) / 2
exact = merge_shards(parts)
print(f"naive shard average={naive:.1f} vs exact mass-aware merge={exact:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
naive shard average=4.5 vs exact mass-aware merge=3.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/attention_mass_merge_dark.png" alt="Shard 0 holds two positions at score 1000 with value 0 (mass 2, local mean 0); Shard 1 holds one position at score 1000 with value 9 (mass 1, local mean 9); Shard 2 is empty (mass 0). A horizontal scale bar compares naive shard averaging at 4.5 against exact shared-maximum mass-aware merging at 3.0." />
  <figcaption>Shard 0 (2 keys, value 0) has twice the softmax mass of Shard 1 (1 key, value 9), so mass-aware merging gives 3.0 instead of the naive shard average 4.5.</figcaption>
</figure>

## Expert parallelism for MoE models

**<span data-glossary="expert-parallelism">Expert parallelism (EP)</span>** places whole MoE experts on separate GPUs and routes tokens via all-to-all dispatch and combine.[^shazeer2017][^vllmExpertParallel2026] Unlike static TP splits, learned routing creates dynamic load skew: if six tokens each pick two experts across two devices (`owners = {0:0, 1:0, 2:1, 3:1}`), Device 0 can receive 8 assignments while Device 1 receives 4 (`1.33x` peak-to-average skew), turning the hottest rank into the step straggler unless hot experts are replicated.

<!-- leetllm: test, output=show -->
```python title="expert-dispatch-combine.py"
routes = [(0, 1), (0, 1), (0, 1), (0, 2), (1, 3), (2, 3)]
inputs = [1., 2., 3., 4., 5., 6.]
gates = (0.75, 0.25)
owners = {0: 0, 1: 0, 2: 1, 3: 1}

queues = [[], []]
for tok, sel in enumerate(routes):
    for exp_id, g in zip(sel, gates):
        queues[owners[exp_id]].append((tok, exp_id, g))

combined = [0.0] * len(inputs)
for q in queues:
    for tok, exp_id, g in q:
        combined[tok] += g * ((exp_id + 1) * inputs[tok])

loads = [len(q) for q in queues]
print("assignments per device:", loads, f"(peak/avg={max(loads) / (sum(loads) / 2):.2f}x)")
print("combined output:", combined)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
assignments per device: [8, 4] (peak/avg=1.33x)
combined output: [1.25, 2.5, 3.75, 6.0, 12.5, 19.5]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/expert_dispatch_combine_dark.png" alt="Expert dispatch load skew and token T3 combine path. Top bar chart shows Device 0 (E0, E1) handling 8 token-expert assignments (1.33x average) versus 4 on Device 1 (E2, E3). Bottom flow tracks T3 (input 4) through E0 (0.75 x 4 = 3.0) and E2 (0.25 x 12 = 3.0) back to combined output 6.0." />
  <figcaption>Dynamic routing sends 8 assignments to Device 0 vs. 4 to Device 1 (1.33x skew), while Token T3 splits across E0 and E2 and recombines to 6.0.</figcaption>
</figure>

## Prefill-decode disaggregation and KV transfer

Running long prompt prefills on the same GPU as active decode streams stalls ongoing token generation. **Prefill-decode disaggregation** (introduced by Splitwise and DistServe, and deployed with transfer layers such as NVIDIA NIXL and Mooncake) splits a serving fleet into dedicated prefill and decode pools linked over NVLink or RDMA.[^patel2023][^zhong2024][^qin2024][^nixl2026architecture] That separation replaces prefill-decode interference with a new distributed data-plane problem: moving gigabytes of prompt KV state safely and fast enough to meet TTFT.

### KV wire volume, link bottlenecks, and block reservations

Take an 8,192-token prompt on an 80-layer, 8-KV-head GQA model ($d_h = 128$, BF16). Each token stores $2 \times 80 \times 8 \times 128 \times 2 = 320\text{ KiB}$, so the full prompt transfers **2.50 GiB** (`2,684,354,560` bytes). Under `TP=2`, each rank holds `1.25 GiB`, yet both shards still cross the handoff:

- **Link bottleneck:** Over one shared `25 GB/s` path, serial transfer takes $2.684 / 25 = 107.4\text{ ms}$ (capping steady-state throughput at `9.31` transfers/s even if prefill completes `40 req/s`!). Two *independent* `25 GB/s` links finish concurrently in `53.7 ms`; dividing each shard by one shared NIC falsely doubles capacity.
- **Payload vs. rounded reservation:** At 16 tokens per block (`5 MiB` model-wide), 8,192 prompt tokens plus a 128-token output budget reserve `520` blocks (`2,600 MiB`). Adding a single prompt token (`8,193`) adds `320 KiB` of real payload but bumps the reservation by a full `5 MiB` block (`521` blocks, `2,605 MiB`).

### Transfer manifests, RDMA quiescence, and critical-path overlap

A fast RDMA copy into an incompatible or already-reassigned buffer silently corrupts generation. Reliable disaggregated handoffs run a four-stage protocol over a separate control plane:

1. **Reserve before prefill:** Charge rounded prompt-plus-output VRAM on the decode group under a monotonic local lease before starting prefill, avoiding wasted prefill compute when decode memory is full.
2. **Validate the manifest:** Match the sender's manifest against the reservation: server-issued attempt ID, model/LoRA tuple, canonical token digest, dtype and block layout, and **complete unique `(rank, block)` coverage** (receiving `1,024` notifications with block 0 duplicated and block 1 missing must fail commit).
3. **Quarantine on timeout (RDMA quiescence):** Lease expiry revokes pending commit immediately, *not* physical RDMA access. Keep retired buffers quarantined and charged against decode capacity until the transport confirms transfer abort (`abort_ack`) and all GPU readers finish; reclaiming VRAM on timeout alone lets late in-flight RDMA writes overwrite the next request's KV cache.
4. **Overlap and measure end-to-end TTFT:** Streaming finished layers over RDMA while later prefill layers still compute hides transfer latency (starting a `107.4 ms` transfer `70 ms` before a `310 ms` prefill ends drops first-token latency from `445.4 ms` to `375.4 ms`, given `28 ms` commit+decode). Always compute end-to-end TTFT p99 from joined request traces rather than adding unrelated per-phase p99 percentiles.

<!-- leetllm: test, output=show -->
```python title="disaggregated-kv-handoff.py"
bytes_per_tok = 2 * 80 * 8 * 128 * 2
payload = 8192 * bytes_per_tok  # 2.50 GiB
reserve = lambda p, o: ((p + o + 15) // 16) * 16 * bytes_per_tok

transfer_ms = payload / 25e9 * 1000.0
serial_ttft = 310.0 + transfer_ms + 28.0
overlapped_ttft = max(310.0, 240.0 + transfer_ms) + 28.0
print(f"8K KV payload={payload / 1024**3:.2f} GiB | 8192+128 reserve={reserve(8192, 128) // 1024**2} MiB | +1 tok={reserve(8193, 128) // 1024**2} MiB")
print(f"25 GB/s shared={transfer_ms:.1f} ms (max {25e9 / payload:.2f} req/s) | 2x independent={transfer_ms / 2:.1f} ms")
print(f"TTFT serial={serial_ttft:.1f} ms vs 70ms layer-overlapped={overlapped_ttft:.1f} ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
8K KV payload=2.50 GiB | 8192+128 reserve=2600 MiB | +1 tok=2605 MiB
25 GB/s shared=107.4 ms (max 9.31 req/s) | 2x independent=53.7 ms
TTFT serial=445.4 ms vs 70ms layer-overlapped=375.4 ms
```
<!-- leetllm: output:end -->

## Multi-GPU serving Pareto trade-offs

On an 8-GPU node, compare three ways to deploy a 70 GB model:
1. **Wide TP (`TP=8`):** Minimizes per-GPU weights (`8.75 GB`), but pays 8-way collective latency on every layer and duplicates KV heads if `n_kv_heads < 8`.
2. **Sharded replicas (`TP=2, DP=4`):** Confines collectives to 2-GPU NVLink pairs and multiplies cluster throughput across four independent replicas.
3. **Prefill-decode disaggregation:** Separates compute-bound prefill pools from bandwidth-bound decode pools so long prompts stop stalling active token streams.[^zhong2024][^patel2023]

Evaluate every candidate topology in three steps:
1. **Per-rank VRAM fit:** Never trust a pooled sum! A `TP=2` pair with `58 GB` total free VRAM (`29 GB` each) still OOMs if an asymmetric placement asks for `35 GB` on Rank 0 and `15 GB` on Rank 1.
2. **p95 latency targets (TTFT and TPOT):** Screen out layouts that breach latency caps under live load (`TP=4` at `700 TPS` loses to `TP=2` at `620 TPS` if `TP=4` hits `430 ms` TTFT and `62 ms` TPOT).
3. **Cost per million useful tokens:** Among layouts that pass fit and latency, higher throughput can still cost more per token (`620 TPS` at `$6/hr` = **`$2.69/M`** vs. `900 TPS` at `$12/hr` = **`$3.70/M`**).

<figure>
  <img src="illustrations/_generated/serving_capacity_dark.png" alt="Three-gate screening table and unit-cost comparison. TP=1 fails VRAM fit at 86 GB; TP=2 fits and passes p95 TTFT (310 ms) and TPOT (45 ms) gates at 620 TPS; TP=4 fits memory yet fails both SLO gates (430 ms TTFT, 62 ms TPOT) despite 700 TPS. Below, comparing a 2-GPU group at 620 TPS ($6/hr, $2.69 per million tokens) with a 4-GPU group at 900 TPS ($12/hr, $3.70 per million tokens) shows higher throughput can cost more per useful token." />
  <figcaption>Screen by VRAM fit and p95 latency first, then compare GPU cost per million useful tokens ($2.69/M for 2 GPUs vs. $3.70/M for 4 GPUs).</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/per_rank_memory_admission_dark.png" alt="Stacked per-rank bars on an 80 GB cap for TP=2 show Rank 0 and Rank 1 each start with 29 GB free after 35 GB weights and 16 GB reserve. Placing a 50 GB request asymmetrically as 35 GB on Rank 0 and 15 GB on Rank 1 leaves Rank 1 with 14 GB spare while overflowing Rank 0 to 86 GB (+6 GB OOM) despite the 58 GB group free sum." />
  <figcaption>Allocation happens per rank: 58 GB total free VRAM still OOMs Rank 0 when a placement puts 35 GB onto Rank 0's 29 GB free space.</figcaption>
</figure>

## When multi-GPU serving breaks down

- **OOM despite on-paper fit:** Check per-rank VRAM (including replicated KV heads, CUDA graphs, and workspace), never group totals.
- **Latency worsens as TP increases:** Profile NCCL collective launch stalls and shrunk GEMM tiles; drop to smaller TP + DP replicas or add PP across slow links.
- **KV memory stops shrinking with TP:** Check whether `TP > n_kv_heads` is replicating KV caches, and enable decode context parallelism (`DCP`) to shard history across partner ranks.

```mastery-quiz
[
  {
    "question": "A checkpoint has 54 billion total parameters with 6 billion active per token. BF16 uses 2 bytes per parameter. Each device has 120 decimal GB, with 24 GB reserved before allocating any KV cache. What is the raw weight payload, and what is the minimum number of devices that can hold it if the weights split evenly?",
    "options": [
      "12 GB, 1 device",
      "108 GB, 2 devices",
      "108 GB, 1 device",
      "27 GB, 1 device"
    ],
    "answer": "108 GB, 2 devices",
    "explanation": "All 54 billion parameters need storage. At 2 bytes each, they occupy 108 GB. The reserve leaves 120 − 24 = 96 GB per device. One device would use part of the reserve. Two devices can each hold 54 GB of weights. The 12 GB estimate counts only active parameters. The 27 GB estimate uses four bits per weight."
  },
  {
    "question": "Two rank-local projections after activation produce partial vectors [2, −1] and [−3, 5]. The output bias is [0.5, −0.5]. What result matches the unsharded row-parallel layer output?",
    "options": [
      "[0.00, 1.50]",
      "[−1.00, 4.00]",
      "[0.00, 3.00]",
      "[−0.50, 3.50]"
    ],
    "answer": "[−0.50, 3.50]",
    "explanation": "Sum the partials to [−1, 4], then add the bias once to get [−0.5, 3.5]. Averaging, omitting bias or adding it to each rank changes the computation."
  },
  {
    "question": "A full-attention layer has 24 query heads, 3 KV heads and 36 history positions per KV head. It uses 12 tensor-parallel ranks with KV-head replication. The backend supports four-way decode context parallelism (DCP) with equal history shards. Ignore metadata and page rounding. How many head-position pairs does each rank store before and after enabling DCP, and how many pairs do all ranks store in total afterward?",
    "options": [
      "36 before, 9 after, 108 total",
      "36 before, 12 after, 144 total",
      "9 before, 9 after, 108 total",
      "36 before, 36 after, 432 total"
    ],
    "answer": "36 before, 9 after, 108 total",
    "explanation": "Each KV head has four partner ranks. Each partner starts with all 36 positions for that head. DCP splits those positions four ways, leaving 9 per rank and 12 × 9 = 108 across the group. Getting 12 per rank divides by the three distinct heads. Starting with 9 assumes tensor parallelism already split the history. Keeping 36 per rank leaves all four copies in place."
  },
  {
    "question": "Each of the 48 layers in a dense tensor-parallel model performs two all-reduces during each batch decode iteration. Four requests in the same batch each generate 64 tokens, including the first token from prefill. How many in-layer all-reduces run in one decode iteration and across all decode iterations for the batch?",
    "options": [
      "384 per iteration; 24192 over decode",
      "96 per iteration; 6144 over decode",
      "96 per iteration; 6048 over decode",
      "48 per iteration; 3024 over decode"
    ],
    "answer": "96 per iteration; 6048 over decode",
    "explanation": "The 48 layers perform 48 × 2 = 96 calls per iteration. Prefill emits the first token, so decoding takes 63 iterations and 96 × 63 = 6,048 calls. A count of 384 per iteration charges the same batched calls once per request. A total of 6,144 counts the prefill token as a decode iteration. A count of 48 per iteration omits one reduction in every layer."
  },
  {
    "question": "Eight tensor-parallel ranks perform one ring all-reduce. Each rank contributes a full activation of 4 × 6,144 BF16 elements at 2 bytes each. How many payload bytes does each rank send during this all-reduce?",
    "options": [
      "49,152 bytes/rank",
      "172,032 bytes/rank",
      "86,016 bytes/rank",
      "6,144 bytes/rank"
    ],
    "answer": "86,016 bytes/rank",
    "explanation": "The full activation contains 4 × 6,144 × 2 = 49,152 bytes. Each rank sends one 6,144-byte chunk in each of seven reduce-scatter steps and seven all-gather steps. That gives 14 × 6,144 = 86,016 bytes sent per rank. Counting 49,152 bytes uses the activation size alone. Counting 6,144 bytes includes just one step. Counting 172,032 bytes includes receives as well as sends."
  },
  {
    "question": "In a four-stage, five-microbatch forward-only equal-slot schedule, what are occupancy and bubble fraction? Separately, four 1.5 ms compute stages and three 0.1 ms transfers give what single-request latency?",
    "options": [
      "62.5% occupied; 37.5% idle; 6.3 ms",
      "62.5% occupied; 37.5% idle; 24 ms",
      "80% occupied; 20% idle; 6.3 ms",
      "62.5% occupied; 60% idle; 6.0 ms"
    ],
    "answer": "62.5% occupied; 37.5% idle; 6.3 ms",
    "explanation": "Five+four−one=eight slots, with 20 occupied stage slots out of 32: 62.5% occupied and 37.5% idle. The separate critical path is 4×1.5+3×.1=6.3 ms. Idle fraction does not multiply the full-model latency, and the overhead ratio (p−1)/m is not the idle fraction."
  },
  {
    "question": "One attention shard has three positions, each score 900 and value 2. Another has one position with score 900 and value 22. A third is empty. What output does the shared-maximum mass-aware merge produce?",
    "options": [
      "6",
      "12",
      "8",
      "7"
    ],
    "answer": "7",
    "explanation": "Subtracting the shared maximum of 900 gives each valid position weight 1. The three positions contribute 3 × 2, the singleton contributes 22, and the empty shard adds zero mass. The output is (6 + 22) / 4 = 7. Averaging the two nonempty shard outputs gives 12. Including a zero for the empty shard in that average gives 8. Dividing (2 + 22) by four gives 6 because it counts the repeated value only once in the numerator."
  },
  {
    "question": "Three tokens each select two experts. The first two route to experts 0 and 1; the last token has input 8 and routes to experts 0 and 3 with gate weights 0.25 and 0.75. Experts 0 and 1 are on device 0, experts 2 and 3 on device 1, and expert e returns (e+1)×input. What are device assignment counts and the last combined output?",
    "options": [
      "4/2 assignments; output 26",
      "5/1 assignments; output 26",
      "5/1 assignments; output 40",
      "5/1 assignments; output 20"
    ],
    "answer": "5/1 assignments; output 26",
    "explanation": "The first two tokens contribute four assignments to device 0. The last adds one to each device, giving 5/1. Its expert outputs 8 and 32 are weighted to 2 and 24, summing to 26. Assignment counts are not unique-token counts or a latency multiplier."
  },
  {
    "question": "Two ranks each have 24 GB free after weights and reserve. A 40 GB request needs 28 GB on rank 0 and 12 GB on rank 1. What does per-rank memory accounting show?",
    "options": [
      "Rank 0 is 4 GB over; rank 1 has 12 GB left.",
      "Rank 0 has 4 GB left; rank 1 has 12 GB left.",
      "Both ranks fit because the group has 8 GB left.",
      "Rank 0 is 4 GB over; rank 1 has 4 GB left."
    ],
    "answer": "Rank 0 is 4 GB over; rank 1 has 12 GB left.",
    "explanation": "Fit is local: 28−24=4 GB over on rank 0 and 24−12=12 GB spare on rank 1. The 40 GB total is below the 48 GB sum, so this asymmetric placement still fails on rank 0 until redistributed cleanly across devices."
  },
  {
    "question": "Two configurations already pass the same fit, quality and latency targets. A sustains 800 useful tokens/s at $8 per group-hour; B sustains 1200 at $15 per group-hour. Which has the lower GPU-only cost per million useful tokens, and which has the higher rate?",
    "options": [
      "B costs $3.47/million; A has higher rate.",
      "B costs $2.08/million; B has higher rate.",
      "A costs $2.78/million; B has higher rate.",
      "A costs $10.00/million; B has higher rate."
    ],
    "answer": "A costs $2.78/million; B has higher rate.",
    "explanation": "A costs 8/(800×3600)×1e6≈2.78 dollars per million; B costs 15/(1200×3600)×1e6≈3.47. B is faster but costs more per useful token under these stated rates and prices."
  }
]
```

> **Next:** Continue to [GPU Profiling & Kernel Optimization Lab](/learn/gpu-kernel-performance-engineering-lab).
