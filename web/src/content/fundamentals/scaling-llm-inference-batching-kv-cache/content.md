---
{
  "id": "scaling-llm-inference-batching-kv-cache",
  "title": "Scaling LLM Inference",
  "slug": "scaling-llm-inference-batching-kv-cache",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/kv_memory_capacity_dark.png",
  "shortDescription": "Size a serving replica from memory bandwidth and KV residency, then pick the batch, precision, and speculation the latency target can afford.",
  "keyConceptsTested": [
    "Prefill vs decode resource ceilings",
    "Arithmetic intensity and memory-bound decode",
    "KV-cache residency as a concurrency cap",
    "Throughput-latency-cost operating points",
    "Batching as weight-read amortization",
    "Paged packing and prefix copy-on-write",
    "Speculative decoding as fewer target passes",
    "Weight quantization as a bandwidth lever",
    "Prefill-decode disaggregation break-even",
    "Context parallelism for long-context KV"
  ],
  "prerequisites": [
    "continuous-batching-request-scheduling",
    "kv-cache-paged-attention-llm-serving",
    "flashattention-memory-efficient-attention",
    "multi-query-grouped-query-attention"
  ],
  "relatedQuestions": [
    "model-parallelism-for-llm-inference",
    "model-quantization-gptq-awq-gguf",
    "speculative-decoding",
    "local-llm-deployment-hardware-quantization",
    "long-context-window-management",
    "llm-deployment-gpu-serving-autoscaling"
  ],
  "companies": [
    "Google",
    "Meta",
    "NVIDIA",
    "Anyscale",
    "Together AI"
  ],
  "section": "Inference & Production Scale",
  "order": 7
}
---

You put an 8B-parameter model on an 80 GB H100 GPU, turn on [continuous batching](/learn/continuous-batching-request-scheduling), and send it a single request. The GPU has nearly 1,000 TFLOP/s of dense Tensor Core compute, yet tokens trickle out at barely 180 per second. So you crank up concurrency to keep the GPU busy, and suddenly long-context requests start stalling or getting evicted before the compute cores even break a sweat.

Why does LLM serving hit two completely different walls before touching peak compute? Every decode step has to stream gigabytes of model weights and <span data-glossary="kv-cache">KV cache</span> out of <span data-glossary="gpu">GPU</span> <span data-glossary="hbm">high-bandwidth memory (HBM)</span> just to emit one <span data-glossary="token">token</span> per active stream. Memory **bandwidth** caps how fast each step runs, and memory **capacity** caps how many concurrent KV histories fit on the card. Scaling inference means sizing every lever (batching, paging, prefix sharing, speculation, quantization, and sharding) against those two physical ceilings.

```checkpoint
Why isn't "keep the batch full" enough to scale LLM serving?
---
Every active request still needs VRAM for its growing KV cache and still pulls weights plus KV bytes across HBM on every decode step. Once bandwidth or KV residency hits its ceiling, queuing more work stalls latency or triggers preemption instead of raising throughput.
```

## Decode sits under a bandwidth roof

In [inference mechanics](/learn/inference-mechanics-ttft-tps-kv-cache), we split generation into two phases with opposite hardware profiles:

- **<span data-glossary="prefill">Prefill</span>** processes all prompt tokens in parallel using large matrix-matrix multiplications (GEMMs), reusing weights across hundreds or thousands of tokens. Users feel prefill plus queueing as <span data-glossary="ttft">time to first token (TTFT)</span>.
- **<span data-glossary="decode-phase">Decode</span>** emits one token per request per step, turning dense layers into matrix-vector products (GEMVs) at batch size 1 or thin GEMMs at small batches. Users feel decode speed as <span data-glossary="itl">inter-token latency (ITL)</span> and its average, <span data-glossary="tpot">time per output token (TPOT)</span> (though a calm mean TPOT can easily hide painful <span data-glossary="p95-latency">p95</span> pauses[^zhong2024]).

The root split is <span data-glossary="arithmetic-intensity">arithmetic intensity</span>: FLOPs executed per byte loaded from HBM. For a dense model with $P$ parameters, linear projections perform roughly $2P$ FLOPs per token. If one decode step streams all $P \times P_{\text{bytes}}$ weight bytes once across batch size $B$ (ignoring KV reads for a moment), the weight-only intensity is:

$$
I_{\text{decode}} \approx \frac{2 \times P \times B}{P \times P_{\text{bytes}}} = \frac{2B}{P_{\text{bytes}}}
$$

In <span data-glossary="fp16">FP16</span> ($P_{\text{bytes}} = 2$), that reduces to $I_{\text{decode}} \approx B$ FLOPs/byte. Now compare that against the <span data-glossary="roofline-model">roofline model</span>[^williams2009][^pope2023] on an NVIDIA H100 SXM (3.35 TB/s HBM bandwidth and 989.5 TFLOP/s dense FP16/BF16 Tensor Core peak, half of NVIDIA's 1,979 TFLOP/s sparse headline[^nvidia2026h100]):

$$
I_{\text{ridge}} = \frac{989.5 \times 10^{12}\text{ FLOP/s}}{3.35 \times 10^{12}\text{ bytes/s}} \approx 295.4\text{ FLOPs/byte}
$$

At $B = 1$, intensity is roughly 1 FLOP/byte, capping throughput at 3.35 TFLOP/s, barely $0.34\%$ of the compute peak. For Llama 3 8B[^dubey2024] in FP16 ($\approx 16\text{ GB}$ of weights), simply reading those weights once at 3.35 TB/s takes $16 / 3{,}350 \approx 4.78\text{ ms}$, capping single-stream decode at **209.4 tokens/s** before you even read a single byte of KV cache.

<figure>
  <img src="illustrations/_generated/roofline_decode_dark.png" alt="Log₂-spaced H100 SXM roofline. Bandwidth is 3.35 TB/s and dense FP16 compute is 989.5 TFLOP/s; their curves meet at 295.4 FLOP/byte. The plotted ceilings are 3.35, 107.2, and 428.8 TFLOP/s at intensity 1, 32, and 128, then 989.5 TFLOP/s at the ridge. The lower of the byte-transfer and arithmetic ceilings limits the rate. I approximately equals batch size only when FP16 weights dominate; KV traffic changes intensity." />
  <figcaption>H100 SXM roofline: below the 295.4 FLOPs/byte ridge, HBM bandwidth sets the throughput ceiling; buying more FLOPs cannot speed up small-batch decode.</figcaption>
</figure>

> **Key insight:** If a GPU trace shows HBM bandwidth pegged while Tensor Cores have wide headroom, extra compute will not move decode latency. You have to either move fewer bytes per step (quantization) or get more tokens out of each weight read (batching or speculative decoding).

```checkpoint
You profile decode and see Tensor Cores underutilized while HBM bandwidth is near saturation. Should you first buy more FLOPs or reduce memory traffic?
---
Reduce bytes moved per emitted token (via weight/KV quantization) or amortize each weight read across more tokens (via batching or speculative decoding). Extra peak FLOPs sit unused below the roofline ridge.
```

## KV bytes cap the batch you can form

Amortizing weights across a larger batch only works if those requests fit in VRAM. Each cached token stores one Key vector and one Value vector at every layer and KV head:

$$
\text{KV\_bytes\_per\_token} = 2 \times N_{\text{layers}} \times N_{\text{kv\_heads}} \times d_{\text{head}} \times P_{\text{bytes}}
$$

Llama 3 uses <span data-glossary="grouped-query-attention">grouped-query attention (GQA)</span> with 8 KV heads across 8B, 70B, and 405B.[^dubey2024][^ainslie2023] Even with GQA, KV cache grows linearly with layers, sequence length, and batch size:

- **Llama 3 70B (FP16):** 80 layers, 8 KV heads, $d_{\text{head}} = 128$ uses $320\text{ KiB/token}$, or **2.5 GiB** for one 8,192-token request. Sixty-four concurrent 8K streams need **160 GiB** of KV cache alone, twice an 80 GB H100 before loading weights.
- **Llama 3 8B (FP16):** 32 layers, 8 KV heads, $d_{\text{head}} = 128$ uses $128\text{ KiB/token}$, or **0.50 GiB** per 4,096-token request.

Given a fixed KV pool $M_{\text{KV\_pool}}$ (say 51.60 GiB on an 80 GB card after weights and runtime scratch, derived later), the payload ceiling for equal unshared histories of length $L$ drops as $1/L$:

$$
B_{\text{max}}(L) = \left\lfloor \frac{M_{\text{KV\_pool}}}{2 \times L \times N_{\text{layers}} \times N_{\text{kv\_heads}} \times d_{\text{head}} \times P_{\text{bytes}}} \right\rfloor
$$

| Sequence length ($L$) | KV per request (8B FP16) | Max concurrent streams ($B_{\text{max}}$) | Concurrency drop |
|---|---|---|---|
| **4,096 tokens (4K)** | 0.50 GiB | **103 requests** | Baseline |
| **16,384 tokens (16K)** | 2.00 GiB | **25 requests** | -76% |
| **32,768 tokens (32K)** | 4.00 GiB | **12 requests** | -88% |
| **65,536 tokens (64K)** | 8.00 GiB | **6 requests** | -94% |
| **131,072 tokens (128K)** | 16.00 GiB | **3 requests** | -97% |

(The 16K to 128K rows assume a 128K-capable checkpoint such as Llama 3.1 8B rather than the original 8K Llama 3 8B release.[^dubey2024][^meta2024llama3Card])

<figure>
  <img src="illustrations/_generated/kv_memory_capacity_dark.png" alt="Five equal 51.60 GiB tracks divide into one cell per unshared KV history. The rows show 103 requests of 0.50 GiB at 4K, 25 of 2 GiB at 16K, 12 of 4 GiB at 32K, 6 of 8 GiB at 64K, and 3 of 16 GiB at 128K. Unused tails show free space. A fourth 128K history needs 16 GiB when only 3.60 GiB remains." />
  <figcaption>A 51.60 GiB KV pool holds 103 unshared 4K streams on an 8B model, but only three 128K streams (leaving 3.60 GiB free, not enough for a fourth).</figcaption>
</figure>

Notice why [PagedAttention](/learn/kv-cache-paged-attention-llm-serving)[^kwon2023] matters so much here: reserving contiguous max-length slabs for every arriving request wastes memory on tokens that never arrive. Allocating fixed 16-token blocks on demand via a logical-to-physical block table eliminates max-length reservation waste, leaving at most 15 unused slots in a request's final partial block.

<figure>
  <img src="illustrations/_generated/scaling_inference_dark.png" alt="Two allocation snapshots hold the same eleven live blocks: A has two, B five, C three, and D one. Four maximum-length slabs reserve 32 blocks, leaving 21 unused. A separate 15-block paged pool holds the same blocks in interleaved physical order, with four available. Logical A0 and A1 map to nonadjacent physical slots." />
  <figcaption>Contiguous max-length slabs waste 21 of 32 blocks; paged allocation packs the exact same 11 live blocks into interleaved physical pages with 4 blocks still free.[^kwon2023]</figcaption>
</figure>

```checkpoint
In the KV-cache formula, which terms can the serving stack reduce without shortening user context?
---
KV-cache quantization shrinks $P_{\text{bytes}}$, and scheduling limits control batch size $B$. Layer count, KV head count, and head dimension are fixed by the chosen checkpoint.
```

## The throughput, latency, cost triangle

Bigger batches amortize weight reads, which drives aggregate throughput up and dollar cost per million tokens down. Why not batch as hard as VRAM allows? Because every extra active stream adds its own KV history to the bytes read on every step.

Watch what happens on an H100 SXM serving Llama 3 8B FP16 when every stream holds a 4K history (0.50 GiB = 0.537 decimal GB of KV). Even at peak 3.35 TB/s bandwidth, combining the 16 GB weight read with $B \times 0.537\text{ GB}$ of KV reads pushes step latency up and caps arithmetic intensity well below the naive weight-only guess of $I \approx B$:

<figure>
  <img src="illustrations/_generated/throughput_scaling_dark.png" alt="Three aligned plots use the same batch positions. With 16 decimal GB of weights and 0.536870912 GB of KV per 4K request, bytes per step rise from 16.54 to 50.36 GB as batch grows from 1 to 64. At assumed 3.35 TB/s those reads give 4.94 to 15.03 ms serialization floors and 202.6 to 4257.4 aggregate tokens per second. Linear intensity is 1.0, 6.3, 15.4, and 20.3 FLOPs per byte. These are assumed floors, not measured latency." />
  <figcaption>Batching from $B=1$ to $B=64$ boosts aggregate throughput 21×, but KV traffic triples the per-step serialization floor from 4.94 ms to 15.03 ms and holds linear intensity at 20.3 FLOPs/byte.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="kv-traffic-and-unit-cost.py"
import numpy as np

weight_bytes = 16_000_000_000.0
kv_per_req = float(2 * 4096 * 32 * 8 * 128 * 2)  # 8B FP16, 4K context
peak_bw = 3.35e12
linear_flops = 2 * 8_000_000_000.0

batches = np.array([1, 8, 32, 64], dtype=np.float64)
bytes_read = weight_bytes + batches * kv_per_req
step_sec = bytes_read / peak_bw
intensities = batches * linear_flops / bytes_read

for b, s, inten in zip(batches.astype(int), step_sec, intensities):
    print(f"B={b:>2}: floor={s * 1000:5.2f} ms, agg={b / s:6.1f} tok/s, intensity={inten:4.1f} FLOPs/byte")

# GPU-only cost per million tokens at $3.00/hr:
for tps in (2_500, 250):
    cost_per_m = 3.00 / (tps * 3600) * 1_000_000
    print(f"At {tps:>4} sustained tok/s -> ${cost_per_m:.2f} / 1M tokens")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
B= 1: floor= 4.94 ms, agg= 202.6 tok/s, intensity= 1.0 FLOPs/byte
B= 8: floor= 6.06 ms, agg=1320.5 tok/s, intensity= 6.3 FLOPs/byte
B=32: floor= 9.90 ms, agg=3230.9 tok/s, intensity=15.4 FLOPs/byte
B=64: floor=15.03 ms, agg=4257.4 tok/s, intensity=20.3 FLOPs/byte
At 2500 sustained tok/s -> $0.33 / 1M tokens
At  250 sustained tok/s -> $3.33 / 1M tokens
```
<!-- leetllm: output:end -->

That $10\times$ gap between \$0.33 and \$3.33 per million tokens is the classic serving trade-off. An interactive chat endpoint caps batch size to hold TTFT and p95 ITL tight, spreading GPU rent over fewer tokens. An offline batch pipeline pushes concurrency right up to the KV pool ceiling to minimize cost per token. Both are optimal for their own <span data-glossary="slo">SLO</span>.

```checkpoint
Two teams serve the same 8B model on identical GPUs, yet the interactive chat team pays 5x more per million tokens than the batch pipeline. Why isn't that automatically a bug?
---
Interactive serving caps batch size to meet tight TTFT and ITL targets, amortizing each GPU-hour over fewer tokens. Batch jobs push concurrency until memory or bandwidth saturates.
```

## Batching, sharing, chunking, and disaggregation

Four scheduling and layout levers attack different parts of the bandwidth-and-KV budget without changing the model weights.

### Continuous batching keeps weight reads productive

Under <span data-glossary="static-batching">static batching</span>, short requests hold empty slots while waiting for the longest completion in their group. <span data-glossary="continuous-batching">Continuous batching</span>[^yu2022] refills freed slots on the very next decode iteration, keeping every full-weight read attached to live work:

<!-- leetllm: test, output=show -->
```python title="batch-amortizes-weight-reads.py"
from collections import deque

lengths = [2, 2, 5, 3, 1]
static_reads = max(lengths[:3]) + max(lengths[3:])

queue, active, max_batch = deque(lengths), [], 3
cont_reads = 0
while queue or active:
    while queue and len(active) < max_batch:
        active.append(queue.popleft())
    cont_reads += 1
    active = [rem - 1 for rem in active if rem > 1]

total_tokens = sum(lengths)
print(f"Static batch:     {total_tokens} tokens in {static_reads} weight reads ({total_tokens / static_reads:.2f} tok/read)")
print(f"Continuous batch: {total_tokens} tokens in {cont_reads} weight reads ({total_tokens / cont_reads:.2f} tok/read)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Static batch:     13 tokens in 8 weight reads (1.62 tok/read)
Continuous batch: 13 tokens in 5 weight reads (2.60 tok/read)
```
<!-- leetllm: output:end -->

### Prefix sharing with copy-on-write

When dozens of requests begin with the same 4K system prompt, [prefix caching](/learn/prefix-caching-prompt-caching) stores that 0.5 GiB KV payload once and shares full immutable blocks across requests. If two continuations diverge inside a partially filled tail block, **copy-on-write** clones that partial block before writing private tokens so neither stream corrupts the other.[^kwon2023]

<figure>
  <img src="illustrations/_generated/copy_on_write_dark.png" alt="Three states show copy-on-write for A and B. Both first map to partial block 7 containing p, q, r and an empty slot, with reference count two. B clones block 7 into block 12; each private block then has one reference. A appends a to block 7 and B appends b to block 12, preserving the shared prefix values." />
  <figcaption>Copy-on-write isolates private writes on a shared partial block while keeping earlier full prefix blocks immutable and shared.</figcaption>
</figure>

### Chunked prefill vs. prefill-decode disaggregation

Dropping a 10K-token prompt onto a worker running active decodes can stall every live stream's ITL until prefill finishes. Two architectures solve this head-of-line blocking:

1. **Chunked prefill** (introduced in SARATHI[^agrawal2023] and enabled by default in <span data-glossary="vllm">vLLM</span> V1[^vllm2026optimization]) slices long prompts into small chunks and mixes them into decode steps, prioritizing pending decodes and filling the remaining `max_num_batched_tokens` budget with prompt chunks.
2. **Prefill-decode disaggregation** (Splitwise[^patel2023], DistServe[^zhong2024]) runs prefill and decode on separate GPU pools and transfers finished KV caches across the interconnect. Disaggregation pays off only when the avoided queueing and interference exceed KV transfer time plus coordination overhead. For a Llama 3 70B 8K request (2.5 GiB of KV), even a fast 200 GiB/s one-way link needs at least $2.5 / 200 = 12.5\text{ ms}$ just to serialize the KV payload before protocol overhead.

```checkpoint
When can prefill-decode disaggregation make latency worse?
---
When KV transfer, network serialization, and cross-pool coordination take longer than the head-of-line blocking they eliminate, such as under short prompts, light traffic, or slow interconnects.
```

## Speculative decoding buys tokens per weight read

Batching amortizes one weight read across multiple users; <span data-glossary="speculative-decoding">speculative decoding</span> amortizes one target weight read across multiple *future tokens* of a single user.[^leviathan2023] A cheap draft model (or feature-level drafter such as EAGLE[^li2024]) proposes $\gamma$ tokens, and the target model scores all $\gamma + 1$ positions in a single parallel pass.

For each drafted token $x_i$ sampled from draft distribution $q$, accept it with probability $\alpha_i = \min(1, p(x_i)/q(x_i))$. On the first rejection, discard the remaining draft tail and sample a replacement from the normalized positive residual:

$$
p_{\text{residual}}(x) = \frac{\max(0, p(x) - q(x))}{\sum_{x'} \max(0, p(x') - q(x'))}
$$

If all $\gamma$ proposals survive, sample one bonus token from the target's final position. In exact arithmetic, this loop preserves the exact target output distribution while emitting between $1$ and $\gamma + 1$ tokens per target pass.

Under i.i.d. acceptance rate $\alpha$, draft-step cost $c = T_{\text{draft}} / T_{\text{target}}$, and verification cost $v$ (in units of one ordinary target decode step), expected tokens per cycle and speedup are:

$$
\mathbb{E}[N] = \sum_{i=0}^\gamma \alpha^i = \frac{1 - \alpha^{\gamma+1}}{1 - \alpha}, \qquad \text{Speedup} = \frac{\mathbb{E}[N]}{\gamma c + v}
$$

With $\gamma = 4$, $c = 0.10$, $v = 1.0$, and $\alpha = 0.80$, each cycle emits $3.36$ tokens in $1.40$ target-step units, a **$2.40\times$ speedup**. Drop acceptance to $\alpha = 0.30$ with $c = 0.15$ and speedup collapses to **$0.89\times$** (12% slower per token). Even at $\alpha = 0.80$, if batch load doubles verification cost to $v = 2.0$, speedup shrinks from $2.40\times$ to $1.40\times$.

<figure>
  <img src="illustrations/_generated/speculative_decode_dark.png" alt="One gamma-four speculative cycle drafts x1 through x4. A target pass scores p1 through p5 together, while acceptance decisions inspect x1, x2, x3, then reject x4. The residual sample x4-prime replaces the rejection, so this cycle emits four tokens. Separately, iid alpha 0.8 with draft cost 0.1 and verify cost 1T gives expected 3.3616 tokens per 1.4T cycle and a 2.40x rate ratio; other assumed costs give 1.40x or 0.89x." />
  <figcaption>A $\gamma=4$ draft-verify cycle emitting 4 tokens after rejecting $x_4$, alongside how acceptance rate $\alpha$ and verification cost $v$ govern net speedup.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="speculative-accept-reject.py"
import random
import numpy as np

def sample_cat(dist: np.ndarray, rng: random.Random) -> int:
    masses = dist / dist.sum()
    return int(np.searchsorted(np.cumsum(masses), rng.random(), side="right"))

def speculative_step(draft_tokens, draft_dists, target_dists, rng):
    accepted = []
    for i, tok in enumerate(draft_tokens):
        p, q = target_dists[i], draft_dists[i]
        if rng.random() < min(1.0, float(p[tok] / q[tok])):
            accepted.append(tok)
        else:
            return accepted + [sample_cat(np.maximum(p - q, 0.0), rng)]
    return accepted + [sample_cat(target_dists[len(draft_tokens)], rng)]

def speedup(gamma: int, alpha: float, c: float, v: float = 1.0) -> float:
    expected = float(np.sum(np.power(alpha, np.arange(gamma + 1, dtype=np.float64))))
    return expected / (gamma * c + v)

draft_q = np.array([[0.8, 0.2], [0.3, 0.7]])
target_p = np.array([[0.7, 0.3], [0.2, 0.8], [0.4, 0.6]])
print("Accepted + bonus:", speculative_step([0, 1], draft_q, target_p, random.Random(0)))
print("Forced rejection:", speculative_step([0], np.array([[1.0, 0.0]]), np.array([[0.0, 1.0], [0.5, 0.5]]), random.Random(1)))
print(f"Speedup (alpha=0.8, v=1): {speedup(4, 0.8, 0.1, 1.0):.2f}x")
print(f"Speedup (alpha=0.8, v=2): {speedup(4, 0.8, 0.1, 2.0):.2f}x")
print(f"Speedup (alpha=0.3, c=0.15): {speedup(4, 0.3, 0.15, 1.0):.2f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Accepted + bonus: [0, 1, 1]
Forced rejection: [1]
Speedup (alpha=0.8, v=1): 2.40x
Speedup (alpha=0.8, v=2): 1.40x
Speedup (alpha=0.3, c=0.15): 0.89x
```
<!-- leetllm: output:end -->

```checkpoint
Why can speculative decoding preserve exact target quality yet still run slower than ordinary decode?
---
Runtime depends on acceptance rate and overhead, not just mathematical exactness. When the draft model misses often or verification takes significantly longer than a normal step, the extra work outweighs the saved target passes.
```

## Quantization cuts bytes from both memory streams

Because decode repeatedly streams both weights and KV cache from HBM, shrinking element precision is the most direct bandwidth lever: FP8 on Hopper/Ada Tensor Cores or weight-only INT4/INT8 formats like GPTQ and AWQ.[^micikevicius2022][^gptq2023]

- **Weight quantization (FP16 $\to$ INT4):** Shrinks an 8B weight footprint from 16 GB to 4 GB, cutting the single-stream serialization floor from 4.8 ms to 1.2 ms and freeing 11.18 GiB of VRAM (adding 22 extra 4K streams to our 8B pool, lifting raw capacity from 103 to 125).
- **KV cache quantization (FP16 $\to$ FP8/INT8):** Halves raw KV bytes per token (128 KiB $\to$ 64 KiB on 8B), roughly doubling 8K stream capacity (51 $\to$ 103) and halving attention KV reads, with backend-specific scale calibration.[^vllm2026kvquant]

> **Common mistake:** Do not expect 4-bit weight quantization to give a $4\times$ decode speedup at large batches or long contexts! At batch 64 with 4K histories on 8B, KV reads already total **34.36 GB**, more than twice the 16 GB weights. Quartering weights only trims total traffic from 50.36 GB to 38.36 GB ($1.31\times$), and at 16K context (137.44 GB KV) weight compression buys barely $1.08\times$. Know which stream dominates before compressing it.

<figure>
  <img src="illustrations/_generated/weight_kv_read_mix_dark.png" alt="Four stacked byte-read rows share a 0-to-160 decimal-GB scale for batch 64. At 4K, KV stays 34.36 GB while weight reads fall from 16 to 4 GB, changing the assumed total from 50.36 to 38.36 GB and the rate ratio to 1.31x. At 16K, KV stays 137.44 GB and totals fall from 153.44 to 141.44 GB, a 1.08x ratio. The 16K traffic case needs 128 GiB of KV, above the 51.6 GiB pool." />
  <figcaption>At batch 64, KV traffic dwarfs weights: 4-bit weight compression cuts combined reads by only 1.31× at 4K context and 1.08× at 16K context.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/quantization_bandwidth_dark.png" alt="The top tensor stream packs the same 8B parameters into 2B-parameter groups: FP16 occupies 16 decimal GB, INT8 8 GB, and INT4 4 GB before scales or padding. The lower stream holds 8K KV requests in the same 51.6 GiB pool: 16-bit elements fit 51, 8-bit fit 103, and 4-bit fit 206. Cells group eight requests except each final partial group; exact request tails are shown in labels." />
  <figcaption>Weight quantization shrinks static bytes streamed per step (top); KV quantization multiplies concurrent streams fitting in the same 51.6 GiB pool (bottom).</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="weight-vs-kv-traffic-mix.py"
import math

fp16_w, int4_w = 16_000_000_000, 4_000_000_000
kv_per_tok = 2 * 32 * 8 * 128 * 2
for history in (4096, 16384):
    kv_read = 64 * history * kv_per_tok
    ratio = (fp16_w + kv_read) / (int4_w + kv_read)
    print(f"B=64, L={history:>5}: KV={kv_read / 1e9:6.2f} GB -> INT4 weight speedup ceiling={ratio:.2f}x")

pool_gib = (80_000_000_000 - fp16_w) / 1024**3 - 8
freed_gib = (fp16_w - int4_w) / 1024**3
print(f"4K KV capacity: {math.floor(pool_gib / 0.5)} -> {math.floor((pool_gib + freed_gib) / 0.5)} (+{math.floor((pool_gib + freed_gib) / 0.5) - math.floor(pool_gib / 0.5)} streams)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
B=64, L= 4096: KV= 34.36 GB -> INT4 weight speedup ceiling=1.31x
B=64, L=16384: KV=137.44 GB -> INT4 weight speedup ceiling=1.08x
4K KV capacity: 103 -> 125 (+22 streams)
```
<!-- leetllm: output:end -->

## When one request exceeds a single GPU

Scale the 70B FP16 KV geometry out to a 1,000,000-token context: $2 \times 10^6 \times 80 \times 8 \times 128 \times 2$ bytes equals **305.2 GiB** of KV cache for a single sequence (on top of 140 GB of weights!). Once a single request outgrows one card, <span data-glossary="context-parallelism">context parallelism (CP)</span> shards the token sequence across multiple GPUs (e.g., 76.3 GiB of KV per GPU across 4 devices). During prefill, schemes like Ring Attention[^liu2024ring] rotate K/V blocks around the ring while computing local attention; during decode, ranks compute shard-local attention and merge partial softmax outputs. Unlike <span data-glossary="tensor-parallelism">tensor parallelism</span> (which shards weights inside each layer) or pipeline parallelism (which shards layers), context parallelism partitions sequence length directly.

<figure>
  <img src="illustrations/_generated/context_parallel_shards_dark.png" alt="A one-million-token request with Llama 3 70B dimensions requires 305.2 GiB of raw KV, or 76.3 GiB on each of four equal sequence shards; each device also needs unquantified weights and buffers. During one prefill Ring Attention approach, K/V blocks rotate between sequence shards. During decode, shard-local partial attention states combine into one result; the figure does not imply every decode circulates all KV. The lower axis diagrams distinguish context parallelism across tokens, tensor parallelism within a layer, and pipeline parallelism across layer depth. Sharding does not extend supported context." />
  <figcaption>Context parallelism shards sequence length across GPUs when one sequence's KV cache exceeds single-GPU memory, orthogonal to tensor and pipeline parallelism.</figcaption>
</figure>

### Quick diagnostic table

| Symptom | Most likely bottleneck | First move |
|---|---|---|
| Bought a higher-FLOP GPU, decode barely moved | HBM bandwidth-bound below the roofline ridge | Batch harder, quantize weights/KV, or add speculation |
| Aggregate TPS jumped, chat feels laggy | Mixed prefill stalls or oversized decode batch inflating ITL | Bound chunked prefill size and evaluate p95 ITL, not just mean TPOT |
| Speculative decoding slowed down p50 | Low acceptance rate or heavy verification under batch load | Measure accepted tokens/cycle; lower $\gamma$ or disable at high load |
| HBM climbs despite shared system prompt | Prefix caching disabled or keys mismatched (Copy-on-Write only isolates writes after a hit) | Inspect block reference counts and prefix hit rate |

## Sizing an 8B replica end-to-end

Let us put the full memory partition together for one 80 GB card (taking exactly $80 \times 10^9$ bytes = $74.51\text{ GiB}$):

$$
M_{\text{total}} = M_{\text{weights}} + M_{\text{KV\_pool}} + M_{\text{activations}} + M_{\text{slack}}
$$

Subtracting $14.90\text{ GiB}$ for 8B FP16 weights and an $8.00\text{ GiB}$ activation and runtime reserve (in vLLM, controlled via `gpu_memory_utilization` or explicit `kv_cache_memory_bytes`[^vllm2026cacheConfig]) leaves **$M_{\text{KV\_pool}} = 51.60\text{ GiB}$**.

At 0.50 GiB per 4,096-token sequence, the raw snapshot fits $\lfloor 51.60 / 0.50 \rfloor = \mathbf{103}$ requests. But every live request needs room to generate tokens! Reserving 512 output tokens per request (4,608 total positions = 0.5625 GiB) immediately lowers the safe ceiling to $\lfloor 51.60 / 0.5625 \rfloor = \mathbf{91}$ requests. And with 16-token PagedAttention blocks, each request rounds up to a whole block boundary individually rather than by fleet average:

<figure>
  <img src="illustrations/_generated/replica_budget_admission_dark.png" alt="An assumed 80,000,000,000-byte device budget is 74.5058 GiB. A proportional partition subtracts 14.9012 GiB of 8B FP16 weights and an assumed 8 GiB runtime reserve, leaving a 51.6046 GiB KV pool. On one shared pool scale, 103 current 4K payloads use 51.5 GiB; reserving 512 output tokens leaves room for 91 requests at 0.5625 GiB each. A 92nd requires 51.75 GiB and exceeds the pool by 0.1454 GiB." />
  <figcaption>A 74.51 GiB budget minus 14.90 GiB weights and 8.00 GiB runtime reserve yields 51.60 GiB for KV: 103 current 4K payloads, or 91 requests once 512 output tokens are reserved.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="replica-budget-and-page-admission.py"
import math

BYTES_PER_TOK = 2 * 32 * 8 * 128 * 2  # 128 KiB/token (Llama 3 8B FP16)
BLOCK = 16

device_gib = 80_000_000_000 / 1024**3
weight_gib = 16_000_000_000 / 1024**3
kv_pool_gib = device_gib - weight_gib - 8.0

raw_4k = math.floor(kv_pool_gib / (4096 * BYTES_PER_TOK / 1024**3))
with_512_out = math.floor(kv_pool_gib / ((4096 + 512) * BYTES_PER_TOK / 1024**3))
print(f"KV pool: {kv_pool_gib:.2f} GiB -> {raw_4k} raw 4K streams, {with_512_out} with 512-token headroom")

# Page-aware reservation with 16-token blocks for prompts [4090, 4096, 4100] + 512 output:
prompts = [4090, 4096, 4100]
reserved_slots = [((p + 512 + BLOCK - 1) // BLOCK) * BLOCK for p in prompts]
actual_slots = [p + 512 for p in prompts]
print("Reserved slots per request:", reserved_slots)
print("Unused tail-block slots:   ", sum(reserved_slots) - sum(actual_slots))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
KV pool: 51.60 GiB -> 103 raw 4K streams, 91 with 512-token headroom
Reserved slots per request: [4608, 4608, 4624]
Unused tail-block slots:    18
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/page_aware_admission_dark.png" alt="A zoom into each request’s final 16-token KV block shows prompt plus 512 reserved output positions. A 4,090-token prompt needs 4,602 positions, so 4,608 are allocated and six slots remain unused. A 4,096-token prompt lands exactly on 4,608. A 4,100-token prompt needs 4,612, so 4,624 are allocated and twelve slots remain unused. The three reservations total 13,840 slots with 18 unused; an exact budget equal to their summed bytes fits, while one byte less rejects the third request." />
  <figcaption>Per-request 16-token block rounding: 4,090 + 512 rounds to 4,608 (6 unused slots), 4,096 + 512 lands cleanly on 4,608, and 4,100 + 512 crosses into 4,624 (12 unused slots).</figcaption>
</figure>

```checkpoint
Why isn't the 103-request snapshot a safe production concurrency limit?
---
It counts current 4K prompts with zero room for output growth, tail-block rounding, or prompt bursts, and it says nothing about whether p95 ITL meets the latency target at that batch size.
```

```mastery-quiz
[
  {
    "question": "A full-attention model has 24 layers and 4 KV heads per layer. At each token position, each head stores a key and a value, both vectors of 64 elements at 2 bytes per element. Each request needs space for 6,000 prompt positions and 1,281 output positions in its own 16-position pages. How many requests fit in a 3 GiB KV pool with no other overhead, and how many bytes does the pool reserve per request?",
    "options": [
      "18 reservations of 178,937,856 bytes each.",
      "17 reservations of 179,306,496 bytes each.",
      "21 reservations of 147,456,000 bytes each.",
      "35 reservations of 89,653,248 bytes each."
    ],
    "answer": "17 reservations of 179,306,496 bytes each.",
    "explanation": "The key and value together take 2 × 24 × 4 × 64 × 2 = 24,576 bytes per position. The 7,281 positions need 456 pages, or 7,296 slots. Each request reserves 179,306,496 bytes, so 17 fit in 3 GiB. The estimate of 18 skips the 15 unused slots in each request's last page. Counting only the prompt gives 21. Counting only the keys gives 35."
  },
  {
    "question": "A single decode step has 8 active requests. It reads 12 decimal GB of weights and 4 decimal GB of total current KV once, at an achieved 500 GB/s. Ignore other work. What serialization time and aggregate output rate follow?",
    "options": [
      "24 ms and 333.3 tokens/s.",
      "32 ms and 31.25 tokens/s.",
      "16 ms and 500 tokens/s.",
      "32 ms and 250 tokens/s."
    ],
    "answer": "32 ms and 250 tokens/s.",
    "explanation": "Add both streams: 16/500 seconds=0.032 seconds. Eight output tokens divided by 0.032 gives 250 tokens/s. 24 ms omits KV; 31.25 treats one step as one aggregate token; 16 ms incorrectly subtracts the KV stream from the weights."
  },
  {
    "question": "Two deployments each cost $4.80 per hour over their complete billed intervals. One sustains 800 useful output tokens/s, the other 400. What are their GPU-only costs per million useful tokens?",
    "options": [
      "$1.67 and $3.33.",
      "$0.60 and $0.30.",
      "$6.00 and $12.00.",
      "$3.33 and $1.67."
    ],
    "answer": "$1.67 and $3.33.",
    "explanation": "Divide hourly spend by sustained tokens/s×3600, then multiply by one million. The results are 1.6667 and 3.3333 dollars. Taking reciprocal costs gives 0.60 and 0.30, which have the wrong units; using 1000 instead of 3600 or omitting time conversion gives a different denominator."
  },
  {
    "question": "Four already-prefilled requests have remaining lengths [1, 4, 2, 2] and two slots. Static batching finishes each consecutive pair before starting the next. Continuous batching refills a vacated slot before the next iteration. Each live request emits one token per iteration. How many idealized weight reads do the two schedules need?",
    "options": [
      "Static 5; continuous 6.",
      "Static 6; continuous 4.",
      "Static 6; continuous 5.",
      "Static 7; continuous 5."
    ],
    "answer": "Static 6; continuous 5.",
    "explanation": "Static takes max(1, 4)+max(2, 2)=6. Continuous memberships are [1, 2], [2, 3], [2, 3], [2, 4], [4], for 5 iterations and the same 9 tokens. It preserves the survivor rather than restarting it; the newly admitted request cannot emit before the next iteration."
  },
  {
    "question": "Requests A and B map to the same partially filled four-slot page 9 containing [u, v, empty, empty], with reference count 2. They will append different private tokens. The shared prefix is already found. Which state transition preserves both histories?",
    "options": [
      "Keep page 9 shared; append each token there and distinguish the two writers using their separate logical lengths.",
      "Copy page 9 to a new page and redirect one request; each writer then owns its page and still attends to u, v.",
      "Copy page 9 to a new page and redirect B; stop both requests from reading u, v after their private appends.",
      "Redirect B to an empty new page and append there; preserve its earlier logical indices without copying u, v."
    ],
    "answer": "Copy page 9 to a new page and redirect one request; each writer then owns its page and still attends to u, v.",
    "explanation": "Clone the shared partial page before a private write, copy its valid prefix and redirect one owner. Logical lengths do not isolate writes in shared storage. Dropping prefix values changes the history; copying all immutable pages after every token adds work and removing their attention changes the computation."
  },
  {
    "question": "In a chunked-prefill scheduler, 4 live decode requests each take one new-position slot from a 10-position mixed-step budget; one prompt still has 20 positions. Separately, a phase split transfers 1.5 GiB at 100 GiB/s, adds 4 ms coordination and avoids 18 ms interference, with no overlap. What first prompt chunk and net latency change follow?",
    "options": [
      "10 prompt positions; 1 ms slower.",
      "6 prompt positions; 3 ms faster.",
      "10 prompt positions; 3 ms faster.",
      "6 prompt positions; 1 ms slower."
    ],
    "answer": "6 prompt positions; 1 ms slower.",
    "explanation": "Decode consumes 4 of 10 scheduled-position slots, leaving 6. Transfer takes 1.5/100 seconds=15 ms; adding 4 and subtracting 18 leaves 1 ms extra latency. The token budget is not a cache-length budget, and comparing only transfer or only coordination omits part of the path."
  },
  {
    "question": "A serial speculative model uses gamma 3, iid acceptance mean 0.5, draft-step cost 0.2 baseline steps and verification-plus-overhead 1.2 steps. Assume long outputs. What expected tokens per cycle and rate ratio follow?",
    "options": [
      "1.875 tokens; about 1.042×.",
      "1.875 tokens; about 1.172×.",
      "1.750 tokens; about 0.972×.",
      "3.000 tokens; about 1.667×."
    ],
    "answer": "1.875 tokens; about 1.042×.",
    "explanation": "Expected tokens are 1+0.5+0.25+0.125=1.875. Cycle cost is 3×0.2+1.2=1.8, so the ratio is 1.875/1.8≈1.042. Using v=1 gives the tempting 1.172; omitting the final survival term gives 1.75; counting every draft as accepted gives 3."
  },
  {
    "question": "For the same prefix, the target model gives probabilities p = [0.50, 0.20, 0.30] and the draft model gives q = [0.20, 0.60, 0.20] for token IDs 0, 1, and 2 in that order. The draft proposes ID 1 and has more proposals pending. Which distribution would supply a replacement if ID 1 were rejected? What should the verifier do with a uniform draw of 0.55?",
    "options": [
      "Use [0.625, 0, 0.375] on rejection. With this draw, accept ID 1 and check the next proposal.",
      "Use [0.625, 0, 0.375] on rejection. With this draw, reject ID 1, discard the tail, and sample a replacement.",
      "Use [0.75, 0, 0.25] on rejection. With this draw, reject ID 1, discard the tail, and sample a replacement.",
      "Use [0.75, 0, 0.25] on rejection. With this draw, accept ID 1 and check the next proposal."
    ],
    "answer": "Use [0.75, 0, 0.25] on rejection. With this draw, reject ID 1, discard the tail, and sample a replacement.",
    "explanation": "For ID 1, the acceptance threshold is 0.20 / 0.60 = 1/3. The draw of 0.55 exceeds it, so reject ID 1. The pending proposals assumed that ID 1 was accepted. Discard them. Subtract the draft probabilities from the target probabilities and keep the positive differences, [0.30, 0, 0.10]. Dividing by their sum of 0.40 gives [0.75, 0, 0.25]. The vector [0.625, 0, 0.375] comes from removing ID 1 and rescaling the remaining target probabilities, which skips the subtraction. Reversing the acceptance ratio gives a threshold of 1 after capping and would accept ID 1 in error."
  },
  {
    "question": "A fixed-batch inference step moves 10 GB of weights and 30 GB of KV each step at unchanged achieved bandwidth. Compare two separate changes: quarter only the weights, or halve only the KV. What bandwidth-only rate ratios follow, before conversion or kernel overhead?",
    "options": [
      "4.00× and 2.00×.",
      "1.23× and 1.60×.",
      "1.60× and 1.23×.",
      "1.23× and 2.00×."
    ],
    "answer": "1.23× and 1.60×.",
    "explanation": "Original bytes are 40. Quartered weights give 2.5+30=32.5, so 40/32.5≈1.23. Halved KV gives 10+15=25, so 40/25=1.60. Compressing one stream does not scale the total by that factor, and the two streams cannot be swapped."
  },
  {
    "question": "A freshly initialized replica has 32 GiB total HBM, 8 GiB weights and 4 GiB runtime reserve. After a cache-width change, each current history is 0.25 GiB and each output-reserved allocation 0.3125 GiB. Read weights plus current histories once at 400 GiB/s. Among batches 16/32/48/64, choose the largest fitting the pool and a 40 ms iteration limit. What choice and modeled aggregate rate follow?",
    "options": [
      "B 64 and 1066.7 tokens/s.",
      "B 48 and 960 tokens/s.",
      "B 16 and 533.3 tokens/s.",
      "B 32 and 800 tokens/s."
    ],
    "answer": "B 32 and 800 tokens/s.",
    "explanation": "The pool is 20 GiB, so all listed reservations fit through B 64. Iteration time is (8+0.25 B)/400 seconds, giving 30/40/50/60 ms. B 32 is the largest at most 40 ms, and 32/0.040=800 tokens/s. B 64 uses the memory-only ceiling; B 48 violates latency; B 16 leaves a larger eligible candidate unused."
  }
]
```

> **Next:** Continue to [Model Parallelism for LLM Inference](/learn/model-parallelism-for-llm-inference). An 8B replica fits within an 80 GB GPU memory budget. Llama 3 70B's FP16 weights need roughly 140 GB before caching a single token, so one device cannot hold the model. The next chapter partitions that model across GPUs.
