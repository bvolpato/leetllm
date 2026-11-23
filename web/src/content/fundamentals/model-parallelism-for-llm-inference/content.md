---
{
  "id": "model-parallelism-for-llm-inference",
  "title": "Model Parallelism for LLM Inference",
  "slug": "model-parallelism-for-llm-inference",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 8,
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
    "scaling-llm-inference-batching-kv-cache",
    "continuous-batching-request-scheduling",
    "kv-cache-paged-attention-llm-serving",
    "multi-query-grouped-query-attention"
  ],
  "relatedQuestions": [
    "accelerator-architecture-field-guide",
    "model-quantization-gptq-awq-gguf",
    "llm-deployment-gpu-serving-autoscaling",
    "local-llm-deployment-hardware-quantization",
    "distributed-training-fsdp-deepspeed-zero",
    "mixture-of-experts-architecture",
    "long-context-window-management"
  ],
  "companies": [
    "NVIDIA",
    "OpenAI",
    "Anthropic",
    "Meta",
    "Google",
    "DeepSeek",
    "Z.AI"
  ]
}
---

A <span data-glossary="llm">large language model (LLM)</span> has an estimated 70 GB weight payload. Give each GPU an assumed 80 decimal GB budget and set aside 16 GB for other allocations and headroom, leaving 64 GB before any request arrives so weights exceed memory and a runtime may reject the configuration or run out of memory. Earlier chapters treated a single GPU as a standalone serving box where weights load into VRAM and active requests compete for whatever bytes remain in the <span data-glossary="kv-cache">KV cache</span>; data-parallel replicas scale throughput once one copy fits, whereas model parallelism splits one model across devices. Across multiple GPUs, communication, replicated tensors, stage imbalance, and idle slots govern whether sharding helps, and floating-point reduction order can shift sampled tokens even when the underlying math stays invariant.

Use Qwen3.6-35B-A3B's approximately 35B total and 3B active parameters as the starting estimate.[^qwen3635b2026] At two <span data-glossary="bf16">BF16</span> bytes per parameter, that gives about 70 decimal GB: <span data-glossary="mixture-of-experts">MoE</span> routing selects only some experts per token, yet a GPU-resident deployment still stores the full expert set across its devices unless layers are explicitly offloaded. Using 70 GB as a rounded checkpoint alongside a 16 GB per-device runtime reserve illustrates why capacity is the first gate. Once a weight matrix is sliced across chips, the next question is how partial results combine to recover the exact layer output.

```checkpoint
Why can Qwen3.6-35B-A3B need more than one GPU before serving any real traffic?
---
Under an assumed 80 GB device budget and 16 GB runtime reserve, only 64 GB remains for an approximately 70 GB BF16 payload. Actual sizing must include the checkpoint, KV pool, workspace, replicated tensors, and headroom on every rank. The 3B active count reflects per-token FLOPs rather than weight storage, so fitting on one chip requires narrower precision or offloading.
```

<figure>
  <img src="illustrations/_generated/inference_parallelism_dark.png" alt="Per-rank VRAM bars on 80 GB GPUs compare TP=1, TP=2, and TP=4 against an 80 GB limit line. TP=1 asks for 70 GB of weights and 16 GB reserve, overflowing by 6 GB. Both TP=2 ranks hold 35 GB of weights and 16 GB reserve with 29 GB free, while TP=4 drops weights to 17.5 GB per rank and leaves 46.5 GB free." />
  <figcaption>Compare each rank against the 80 GB limit line. TP=1 overflows by 6 GB, whereas TP=2 frees 29 GB per rank and TP=4 frees 46.5 GB per rank under an even weight split.</figcaption>
</figure>

## Why inference sharding differs from training

Distributed training optimizes throughput across gradients, <span data-glossary="optimizer">optimizer</span> states, and backward passes over thousands of steps. Inference serving runs on an interactive latency clock: <span data-glossary="ttft">time to first token (TTFT)</span> exposes prompt processing latency, <span data-glossary="tokens-per-second">tokens per second (TPS)</span> governs the autoregressive decode loop, and per-token KV cache memory bounds request concurrency. Because activations and optimizer state disappear or shrink, optimizations built for training backward memory can fail to help serving latency, and layouts sized for a single prompt can leave pipeline stages starved under live traffic.

| Technique | Training concern | Inference concern |
|---|---|---|
| <span data-glossary="tensor-parallelism">Tensor parallelism (TP)</span> | Split matmuls and <span data-glossary="gradient">gradients</span> | Split weights and activations, paying for intra-layer all-reduce collectives |
| <span data-glossary="pipeline-parallelism">Pipeline parallelism (PP)</span> | Fill stages with microbatches | Balance layer stages while avoiding decode latency bloat |
| <span data-glossary="sequence-parallelism">Sequence parallelism</span> | Shard LayerNorm and activations alongside TP | Training memory optimization, distinct from inference long-context serving |
| <span data-glossary="context-parallelism">Context parallelism</span> | Split long training documents across ranks | Distribute massive prompt attention and KV caches across devices |
| Data parallelism | Replicate model state and synchronize gradients | Independent serving replicas; EP deployments can couple their expert work |

Serving engines such as <span data-glossary="vllm">vLLM</span> expose `tensor_parallel_size` and `pipeline_parallel_size`, defaulting to single-GPU execution when sufficient, intra-node TP for larger checkpoints, and TP combined with PP across nodes (or **intra-node PP** across GPUs lacking NVLink).[^vllm2026distributed] Logical degrees omit physical transport because `TP=4` assigns four worker ranks without revealing link topology or whether communication stalls the critical path. The NVIDIA Collective Communication Library (NCCL) inspects PCIe and <span data-glossary="nvlink">NVLink</span> interconnects to choose ring or tree collectives, so `TP=4` over NVLink behaves completely differently from `TP=4` over PCIe.[^nccl2026guide] Mapping logical shards to physical wire speed prevents deploying a split that spends more time synchronizing than computing. Before choosing a layout, write down the per-device memory ledger:

```text
weight memory ~= parameters x bytes per parameter
serving memory ~= weights + KV cache + runtime buffers + safety headroom
```

Two bytes per BF16 parameter gives raw payload size, whereas a preallocated KV pool reserves fixed device capacity whose live occupancy fluctuates with active requests. Runtime activation buffers, CUDA graph capture workspaces, and fragmentation headroom further narrow what remains for long prompts and concurrent decode slots. Calculate the minimum device count under an even split first, remembering that real runtimes also require quantization scales, buffers, and divisible head counts:

<!-- leetllm: test, output=show -->
```python title="multi-gpu-sizing-sketch.py"
from math import ceil

def weight_memory_gb(params_billion: float, bytes_per_param: float) -> float:
    return params_billion * bytes_per_param

params_billion = 35
gpu_gb = 80
reserve_fraction = 0.20
usable_gb = gpu_gb * (1 - reserve_fraction)

bf16_weights = weight_memory_gb(params_billion, bytes_per_param=2)
raw_min_gpus = ceil(bf16_weights / usable_gb)
int4_weights = weight_memory_gb(params_billion, bytes_per_param=0.5)

print(f"Qwen3.6-35B-A3B BF16 total weights: {bf16_weights:.0f} GB")
print(f"80GB GPU usable with 20% reserve: {usable_gb:.0f} GB")
print(f"minimum GPUs for weights with reserve: {raw_min_gpus}")
print(f"Qwen3.6-35B-A3B INT4 total weight-only estimate: {int4_weights:.1f} GB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Qwen3.6-35B-A3B BF16 total weights: 70 GB
80GB GPU usable with 20% reserve: 64 GB
minimum GPUs for weights with reserve: 2
Qwen3.6-35B-A3B INT4 total weight-only estimate: 17.5 GB
```
<!-- leetllm: output:end -->

This two-device bound assumes an even split and ignores quantization scales, packing, and unquantized layers. Even when checkpoint bytes fit across two devices, serving long prompts and deep concurrent batches demands substantial extra KV pool capacity. For example, Qwen's official model card documents a `TP=8` launch at 262,144 context to secure both memory headroom and latency.[^qwen3635b2026] Calculate the per-rank remainder on the same 80 GB configuration before communication costs:

<!-- leetllm: test, output=show -->
```python title="weight-shards-leave-room-for-kv.py"
weights_gb = 70
gpu_gb = 80
reserved_runtime_gb = 16

for tp_size in (1, 2):
    shard_gb = weights_gb / tp_size
    kv_room_gb = gpu_gb - reserved_runtime_gb - shard_gb
    print(f"TP={tp_size}: {shard_gb:.0f} GB weights/GPU, {kv_room_gb:.0f} GB left for KV")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
TP=1: 70 GB weights/GPU, -6 GB left for KV
TP=2: 35 GB weights/GPU, 29 GB left for KV
```
<!-- leetllm: output:end -->

Halving the weights leaves 29 GB on paper, yet a sliced weight tensor does not form an independent layer. Each rank produces only a partial matrix product over its subset of input channels or hidden dimensions. Consequently, the runtime must synchronize those partials across ranks to recover the exact dense layer output before the next operation reads them.

## Tensor parallelism

Tensor parallelism shards operations inside a layer across an execution group of **ranks** (individual GPU processes). Each rank multiplies local weight shards against activations and exchanges partial sums using **collectives**, reducing per-device parameter footprint while keeping every GPU working on the same request. Synchronization still sits on the critical path of every block, so this layout pays off primarily when fast intra-node <span data-glossary="nvlink">NVLink</span> links carry the traffic.[^shoeybi2019]

### The Megatron pattern: column then row

Consider a standard linear projection $y = xW$ inside the <span data-glossary="feed-forward-network">MLP block</span> $Z = \text{GeLU}(x A) B + b$. Placing two arbitrary linear splits back-to-back would force an expensive cross-GPU reduction between every multiply, doubling communication frequency. The <span data-glossary="nvidia-megatron">Megatron-LM</span> pairing avoids an intermediate synchronization after the first multiply by matching column and row cuts:[^shoeybi2019]

1. **Column-parallel expansion**: Split weight matrix $A$ along its columns into $[A_0 \mid A_1]$. The input vector $x$ is replicated on all ranks. Rank 0 calculates $x A_0$ while Rank 1 calculates $x A_1$. Because GeLU is an element-wise function, each rank applies $\text{GeLU}(\cdot)$ to its local activation slice independently with no cross-device communication. Splitting $A$ by rows instead would require an all-reduce before the nonlinearity because $\text{GeLU}(u + v) \neq \text{GeLU}(u) + \text{GeLU}(v)$.
2. **Row-parallel projection**: Split weight matrix $B$ along its rows into $\begin{bmatrix} B_0 \\ B_1 \end{bmatrix}$. Rank 0's local activation $h_0 = \text{GeLU}(x A_0)$ matches the inner dimension of row shard $B_0$ and yields partial output $h_0 B_0$, while Rank 1 yields $h_1 B_1$.
3. **Single all-reduce reduction**: Because $h B = h_0 B_0 + h_1 B_1$, one sum all-reduce collective combines the partial outputs across ranks, and the bias vector $b$ is added once after reduction to match the unsharded computation.

Multi-head attention mirrors this exact column-then-row symmetry: query ($W_Q$), key ($W_K$), and value ($W_V$) projections shard column-wise across independent <span data-glossary="attention-head">attention heads</span>, each rank computes local scaled dot-product attention without talking to peers, and the output projection ($W_O$) shards row-wise into one final sum all-reduce. Under this classic dense forward pattern with $TP > 1$, a transformer layer performs two sum all-reduces (excluding embeddings and logits). Fused kernels or hybrid attention layouts can shift that synchronization count, yet the core principle remains matching shard dimensions so reductions defer until outputs sum cleanly.

<figure>
  <img src="illustrations/_generated/tensor_shards_dark.png" alt="Megatron-LM MLP Z=GeLU(xA)B+b dataflow across two ranks. Both ranks receive x=[1,2]. Rank 0 computes xA0=[1,1], h0=[0.84,0.84], and p0=[0.84,0.84]; Rank 1 computes xA1=[0,4], h1=[0,4.0], and p1=[-4.0,8.0]. Arrows converge at one SUM all-reduce yielding [-3.16,8.84], then adding bias [0.5,-0.5] once gives [-2.66,8.34]." />
  <figcaption>Column shards of A feed local GeLU activations into row shards of B, deferring cross-device communication to a single SUM all-reduce before one bias addition.</figcaption>
</figure>

### Verify the split with actual tensors

Let's verify this sharding identity in PyTorch on a two-feature input expanded to four hidden units across two ranks. Summing the rank partials first and adding bias once reproduces the dense reference to floating-point precision. In contrast, mistakenly reducing by mean or adding bias twice inside each shard produces skewed activations that diverge from the unsharded model:

<!-- leetllm: test, deps=torch, output=show, id=tensor-lab -->
```python title="tensor-parallel-mlp.py"
import torch
import torch.nn.functional as F

torch.set_num_threads(1)
x = torch.tensor([[1., 2.]], dtype=torch.float64)
A = torch.tensor([[1., -1., 2., 0.], [0., 1., -1., 2.]], dtype=x.dtype)
B = torch.tensor([[1., 0.], [0., 1.], [1., 1.], [-1., 2.]], dtype=x.dtype)
bias = torch.tensor([0.5, -0.5], dtype=x.dtype)
dense = F.gelu(x @ A) @ B + bias

def sharded_mlp(x, A, B, bias, ranks):
    if ranks < 1 or ranks > A.shape[1] or A.shape[1] % ranks:
        raise ValueError("hidden features must divide evenly across ranks")
    if A.shape[1] != B.shape[0]:
        raise ValueError("hidden dimensions disagree")
    partials = [F.gelu(x @ a) @ b for a, b in
                zip(A.chunk(ranks, dim=1), B.chunk(ranks, dim=0))]
    return torch.stack(partials).sum(dim=0) + bias, partials

sharded, partials = sharded_mlp(x, A, B, bias, ranks=2)
torch.testing.assert_close(sharded, dense)
wrong_mean = torch.stack(partials).mean(dim=0) + bias
wrong_bias = sum(part + bias for part in partials)
assert not torch.allclose(wrong_mean, dense)
assert not torch.allclose(wrong_bias, dense)
print("xA:", (x @ A).tolist())
print("dense output:", [round(v, 4) for v in dense[0].tolist()])
print("sharded equals dense:", torch.allclose(sharded, dense))
print("mean reduction and duplicated bias: rejected")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
xA: [[1.0, 1.0, 0.0, 4.0]]
dense output: [-2.6585, 8.3411]
sharded equals dense: True
mean reduction and duplicated bias: rejected
```
<!-- leetllm: output:end -->

With two ranks, each local weight slice $A_i$ has shape `[2, 2]`, each hidden activation slice is `[1, 2]`, and each local projection slice $B_i$ has shape `[2, 2]`. Both ranks compute their local contribution independently. An all-reduce sum combines the slices so every participating rank holds the identical final activation vector.[^nccl2026guide]

### KV head counts and sharding constraints

For clean head sharding, your tensor parallel size must divide the attention head counts. In standard multi-head attention (MHA), each query head pairs one-to-one with its own key and value head across devices. That keeps every shard self-contained during attention as long as $\text{num\_attention\_heads} \pmod{\text{TP}} = 0$.

Under <span data-glossary="grouped-query-attention">Grouped-Query Attention (GQA)</span>, multiple query heads share a single key-value head to shrink KV cache storage. While query projections still split readily across many GPUs, the smaller set of KV heads hits a much tighter floor. Slicing KV heads across ranks without replicating them imposes a strict divisibility condition:

$$
n_{\text{kv\_heads}} \pmod{\text{TP}} = 0
$$

For example, Llama 3 70B has 64 query heads and 8 KV heads. On `TP=8`, each GPU owns 8 query heads and exactly 1 KV head ($8 / 8 = 1$). On `TP=4`, each GPU owns 16 query heads and 2 KV heads ($8 / 4 = 2$). Both divide evenly.

When TP exceeds the KV-head count, plain head partitioning fails divisibility because you cannot give fractional KV heads to separate ranks. Qwen3.6-35B-A3B's ten full-attention layers have 16 query heads, 2 KV heads, and head dimension 256 (while its other thirty layers maintain Gated DeltaNet recurrent state).[^qwen2026a3bConfig] As checked below, `TP=4` and `TP=8` divide all 16 query heads evenly, yet both leave too few KV heads for unique rank assignment:

<!-- leetllm: test, output=show -->
```python title="qwen-kv-head-divisibility.py"
q_heads = 16
kv_heads = 2

for tp in (1, 2, 4, 8):
    divides_q = q_heads % tp == 0
    divides_kv = kv_heads % tp == 0
    print(f"TP={tp}: divides Q heads={divides_q}, divides KV heads={divides_kv}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
TP=1: divides Q heads=True, divides KV heads=True
TP=2: divides Q heads=True, divides KV heads=True
TP=4: divides Q heads=True, divides KV heads=False
TP=8: divides Q heads=True, divides KV heads=False
```
<!-- leetllm: output:end -->

Rather than fail on `TP=4` or `TP=8`, vLLM's QKV linear layer replicates KV heads whenever TP is a multiple of the KV-head count.[^vllm2026qkvLinear] Under `TP=8` with two KV heads, four ranks carry duplicate copies of each KV head's projection and cache. Consequently, expanding TP from 2 to 8 stops shrinking per-rank full-attention KV memory unless decode context parallelism shards sequence history inside those replicated groups. Always verify how your target attention backend lays out both full-attention caches and hybrid state layers before relying on TP for context scaling.

<figure>
  <img src="illustrations/_generated/kv_head_replication_dark.png" alt="Comparison of TP=2 and TP=8 on 16 query heads and 2 KV heads. TP=2 assigns 8 query heads and 1 unique KV head per rank for 1x physical KV copies. TP=8 assigns 2 query heads per rank while replicating each KV head four times across ranks 0 to 3 and ranks 4 to 7." />
  <figcaption>At TP=8, each of the two KV heads is replicated across four ranks while query heads split into pairs. The comparison covers full-attention layers; the 30 Gated DeltaNet layers follow separate state rules.</figcaption>
</figure>

### Count communication, then measure its exposed cost

Under an 80-layer dense tensor-parallel model with two in-layer all-reduces per block, each batch decode iteration executes 160 collectives before any embedding or sampling synchronization. Notice that this collective count depends only on model depth and sharding pattern, not on request batch size or prompt length. Across 128 iterations (or 127 decode steps after prefill emits the first token), communication fires more than 20,000 times per generated sequence:

<!-- leetllm: test, output=show -->
```python title="decode-collective-count.py"
layers = 80
all_reduces_per_layer = 2
decode_iterations = 128

per_step = layers * all_reduces_per_layer
generation_total = per_step * decode_iterations

print(f"all-reduces per batch decode iteration: {per_step}")
print(f"all-reduces over {decode_iterations} iterations: {generation_total:,}")
print(f"decode-only count for 128 output tokens: {per_step * 127:,}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
all-reduces per batch decode iteration: 160
all-reduces over 128 iterations: 20,480
decode-only count for 128 output tokens: 20,320
```
<!-- leetllm: output:end -->

How much latency these collectives add on the critical path depends on kernel launch overhead, link bandwidth, and whether collectives overlap compute. At small serving batches, activation tensors weigh only tens of kilobytes, so wire transmission completes almost immediately once data leaves the GPU. Comparing 5 and 20 microseconds of per-call startup cost illustrates why decode collectives are typically launch-latency-bound rather than bandwidth-bound:

<!-- leetllm: test, output=show -->
```python title="collective-latency-floor.py"
collectives_per_token = 160

for assumed_collective_latency_us in (5, 20):
    floor_ms = collectives_per_token * assumed_collective_latency_us / 1000
    print(f"{assumed_collective_latency_us} us startup -> {floor_ms:.1f} ms/step before payload transfer")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
5 us startup -> 0.8 ms/step before payload transfer
20 us startup -> 3.2 ms/step before payload transfer
```
<!-- leetllm: output:end -->

Adding 3.2 ms of serial collective startup to a 6 ms decode compute baseline increases step latency by 53.3% before payload bytes even finish copying. That overhead recurs on every single generated token, directly slowing inter-token latency for every user in the batch. Now compute the pure payload transfer floor at 300 GB/s sustained per-rank send bandwidth for a batch of 8 BF16 requests to contrast wire cost against launch startup:

<!-- leetllm: test, output=show -->
```python title="all-reduce-payload-floor.py"
batch, hidden, dtype_bytes = 8, 4096, 2  # BF16 activations
tp = 4
collectives_per_token = 160
# Ring all-reduce bytes ~= 2*(TP-1)/TP * activation_bytes
activation_bytes = batch * hidden * dtype_bytes
ring_factor = 2 * (tp - 1) / tp
bytes_per_collective = ring_factor * activation_bytes
bytes_per_token = bytes_per_collective * collectives_per_token
# Assumed sustained per-rank send bandwidth, not aggregate send + receive.
link_gbs = 300
payload_ms = bytes_per_token / (link_gbs * 1_000_000_000) * 1000

print(f"bytes sent per rank per collective: {bytes_per_collective / 1024:.1f} KiB")
print(f"payload-only estimate @ {link_gbs} GB/s: {payload_ms:.2f} ms/step")
print("Compare to startup-only estimates (0.8 to 3.2 ms); larger batch raises payload.")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
bytes sent per rank per collective: 96.0 KiB
payload-only estimate @ 300 GB/s: 0.05 ms/step
Compare to startup-only estimates (0.8 to 3.2 ms); larger batch raises payload.
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/collective_communication_ledger_dark.png" alt="Execution timeline and cost breakdown for an 80-layer TP=4 BF16 workload at batch 8 versus PP=2. Top timelines compare low-overhead NVLink TP execution, PCIe collective stalls, and single-handoff PP=2 execution. Bottom bars show that 96 KiB ring transfers take only 0.05 ms per step at 300 GB/s, dwarfed by 0.80 ms to 3.20 ms of serial collective launch overhead at 5 to 20 microseconds per call." />
  <figcaption>Decode all-reduces on small batches spend far more time in collective startup and synchronization (0.8 to 3.2 ms across 160 calls) than moving 96 KiB payloads across NVLink (0.05 ms). Pipeline parallelism avoids per-layer synchronization at the cost of stage latency.</figcaption>
</figure>

That `0.05 ms` payload estimate assumes a sustained `300 GB/s` ring transfer, whereas actual exposed latency depends on NCCL's collective algorithm choice (ring versus tree) and kernel fusion.[^nccltestsPerformance2026] Collectives on small hidden vectors are further bounded by launch latency and synchronization barriers, so real step overhead sits noticeably above raw byte-division estimates. When interconnect domains span wide NVLink fabrics such as NVIDIA GB200 NVL72 connecting 72 GPUs over high-speed coherent links, high TP degrees remain practical for low-latency serving.[^nvidia2026gb200nvl72] On clusters connected over narrower node-level links or PCIe fabrics, splitting layers across pipeline depth avoids putting frequent intra-layer collectives on the slow link.

```checkpoint
Roughly how much communication does tensor parallelism add per decode step, and why does the interconnect decide if it helps?
---
An 80-layer dense pattern triggers 160 in-layer all-reduces per decode step independently of batch size. Even at negligible 96 KiB payloads (0.05 ms on NVLink), 5 to 20 microseconds of collective launch latency adds 0.8 to 3.2 ms per step unless overlapped, so link latency and bandwidth dictate whether compute savings outweigh synchronization overhead.
```

## Pipeline parallelism

Pipeline parallelism partitions the model along its depth rather than inside each weight matrix: GPU 0 executes layers 0 to 39 and forwards the resulting hidden tensor $[B, s, h]$ once across the stage handoff to GPU 1 for layers 40 to 79. Replacing 160 in-layer all-reduces with sparse stage-to-stage activation transfers suits slower interconnects or multi-node deployments. During autoregressive decode, however, token $t+1$ depends on token $t$'s final logits, so a lone request must cross every pipeline stage sequentially and cannot benefit from stage pipelining unless multiple independent microbatches keep earlier stages busy.

```checkpoint
Why can pipeline parallelism hurt single-request latency?
---
A single request must wait through every stage serially plus inter-stage transfers and scheduling delays, so total latency equals the sum of stage times rather than improving with GPU count. When utilization drops, idle pipeline slots leave compute stranded while adding handoff latency.
```

### Microbatch scheduling and pipeline bubbles

With multiple independent requests, the scheduler splits work into $m$ equal microbatches so stage $s$ executes microbatch $m$ at slot $s + m$. Under an idealized forward-only schedule with $p$ equal stages and negligible handoff overhead, completion takes $m + p - 1$ total slots with $pm$ occupied slots out of $p(m + p - 1)$ total hardware slots. Subtracting occupied utilization from unity yields the **pipeline bubble fraction**:

$$
F_{\text{bubble}} = \frac{p - 1}{m + p - 1}
$$

Relative to the ideal busy interval $m t_{\text{stage}}$, the warm-up and cool-down fill/drain overhead adds a dimensionless ratio $R_{\text{bubble}} = \frac{p-1}{m}$ (elapsed extra time $(p-1)t_{\text{stage}}$), rather than multiplying full-model single-request latency by $p$.

<figure>
  <img src="illustrations/_generated/pipeline_bubbles_dark.png" alt="Three-stage pipeline schedules compare microbatch counts: m=1 fills 3 of 9 slots (33.3% active), m=4 fills 12 of 18 slots (66.7% active), and m=12 reaches 36 of 42 slots (85.7%). Below, a single request crosses three 2 ms stages and two 0.2 ms transfers in 6.4 ms, a 1.07x ratio relative to 6.0 ms compute alone." />
  <figcaption>Increasing microbatch count amortizes warm-up and drain idle slots from 66.7% wasted at m=1 down to 14.3% at m=12. For one isolated request, total latency rises only by inter-stage transfer time (6.4 ms vs. 6.0 ms compute).</figcaption>
</figure>

Before deploying a pipeline schedule, check both its theoretical utilization curve and its discrete stage constraints explicitly in code. Because pipeline stages partition whole transformer layers across devices, rounding errors or zero stage counts would otherwise misalign parameter shards or stall ranks at launch time. Confirm in Python that utilization rises smoothly with microbatch depth while fractional or nonpositive pipeline counts fail immediately:

<!-- leetllm: test, id=pipeline-lab, output=show -->
```python title="pipeline-bubble-utilization.py"
def ideal_pipeline_utilization(stages: int, microbatches: int) -> float:
    if stages < 1 or microbatches < 1 or int(stages) != stages or int(microbatches) != microbatches:
        raise ValueError("stages and microbatches must be positive integers")
    return microbatches / (microbatches + stages - 1)

def schedule(stages, microbatches):
    ideal_pipeline_utilization(stages, microbatches)
    return [[m if 0 <= (m := t - s) < microbatches else None
             for t in range(microbatches + stages - 1)]
            for s in range(stages)]

for microbatches in (1, 4, 12):
    grid = schedule(3, microbatches)
    occupied = sum(cell is not None for row in grid for cell in row)
    utilization = ideal_pipeline_utilization(stages=3, microbatches=microbatches)
    assert occupied == 3 * microbatches
    assert abs(occupied / sum(map(len, grid)) - utilization) < 1e-12
    print(f"3 stages, {microbatches:2d} microbatches: {utilization:.1%} ideal utilization")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
3 stages,  1 microbatches: 33.3% ideal utilization
3 stages,  4 microbatches: 66.7% ideal utilization
3 stages, 12 microbatches: 85.7% ideal utilization
```
<!-- leetllm: output:end -->

Every scheduler guard must reject fractional or nonpositive parameters before building execution queues. Silent coercion would allow degenerate schedules to reach collective initialization and fail with obscure communicator size mismatches. Test a sweep of invalid stage and microbatch inputs against `ideal_pipeline_utilization`:

<!-- leetllm: test, continue=pipeline-lab, output=show -->
```python title="fractional-stages-are-not-a-schedule.py"
for stages, microbatches in ((2.5, 4), (3, 1.5), (0, 4), (3, -1)):
    try:
        ideal_pipeline_utilization(stages, microbatches)
    except ValueError:
        pass
    else:
        raise AssertionError("invalid pipeline count accepted")
print("noninteger and nonpositive stage/microbatch counts rejected")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
noninteger and nonpositive stage/microbatch counts rejected
```
<!-- leetllm: output:end -->

### When pipeline parallelism is justified

Even when two-thirds of stage slots stay idle on a three-stage, single-microbatch schedule, an individual request does not take three times as long to finish. Total single-request latency equals the sum of active stage compute along the pipeline critical path plus point-to-point activation transfers between adjacent stages. Compare a standalone forward pass against a three-stage split carrying two `0.2 ms` activation hops:

<!-- leetllm: test, output=show -->
```python title="idle-slots-do-not-triple-request-latency.py"
stage_compute_ms = (2.0, 2.0, 2.0)
assumed_transfer_ms = 0.2
full_stack_ms = sum(stage_compute_ms)
pipeline_ms = full_stack_ms + (len(stage_compute_ms) - 1) * assumed_transfer_ms
print(f"assumed full-stack compute: {full_stack_ms:.1f} ms")
print(f"same compute plus two transfers: {pipeline_ms:.1f} ms")
print(f"latency ratio: {pipeline_ms / full_stack_ms:.2f}x, not 3x")
assert abs(pipeline_ms - 6.4) < 1e-12
```

<!-- leetllm: output:start -->
```text title="Output" output compact
assumed full-stack compute: 6.0 ms
same compute plus two transfers: 6.4 ms
latency ratio: 1.07x, not 3x
```
<!-- leetllm: output:end -->

Real partitioned kernels add scheduling jitter and cross-node transfer latency, so always benchmark target stages under load. In practice, pipeline parallelism fits three situations: uneven layer splits or slow intra-node links without NVLink where all-reduces hurt more than stage hops;[^vllm2026distributed] hybrid node scaling with intra-node TP paired with inter-node PP; and sustained multi-request microbatch queues large enough to hide fill/drain bubbles. Before adding nodes for giant checkpoints such as Llama 3.1 405B or DeepSeek-V3 671B, check raw quantized capacity first to see whether INT4/FP8 weights already fit a single 8-GPU node:[^dubey2024][^deepseekv3_2024]

<!-- leetllm: test, output=show -->
```python title="int4-payload-is-not-a-multi-node-proof.py"
assumed_group_budget_gb = 8 * 80
for parameters_billion in (405, 671):
    packed_gb = parameters_billion * 0.5
    print(f"{parameters_billion}B raw INT4: {packed_gb:.1f} GB vs {assumed_group_budget_gb} GB group budget")
    assert packed_gb < assumed_group_budget_gb
print("Raw weights fit this sum; scales, per-rank placement, KV, and latency still need validation.")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
405B raw INT4: 202.5 GB vs 640 GB group budget
671B raw INT4: 335.5 GB vs 640 GB group budget
Raw weights fit this sum; scales, per-rank placement, KV, and latency still need validation.
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/hybrid_stage_topology_dark.png" alt="Eight-rank hybrid TP=4 x PP=2 topology: Node 0 hosts layers 0 to 39 on TP ranks 0 to 3 with fast intra-node SUM all-reduces, forwards hidden state [B, s, h] once across an inter-node PP edge to Node 1 (layers 40 to 79, TP ranks 4 to 7), then feeds sampled logits back to Stage 0 for the next decode step." />
  <figcaption>Two four-rank TP groups own contiguous layer ranges, restricting frequent all-reduces to intra-node NVLink while passing activations once per token across the pipeline handoff.</figcaption>
</figure>

## Context parallelism for long-sequence serving

Long prompts can exhaust memory via attention KV history well before weights become the limiting factor, though sequence sharding alone never extends a checkpoint's trained context range. Unlike Megatron's training-time **sequence parallelism** (which shards LayerNorm and Dropout activations around TP blocks to save backward memory[^megatronCoreParallelism2026]), **context parallelism (CP)** distributes long prompt attention computation and KV cache history across multiple devices. Computing raw FP16 storage for a 1M-token full-attention GQA prompt (80 layers, 8 KV heads, head dimension 128) shows why long sequences require multi-device distribution:

<!-- leetllm: test, output=show -->
```python title="context-parallel-kv-capacity.py"
tokens = 1_000_000
layers = 80
kv_heads = 8
head_dim = 128
dtype_bytes = 2
devices = 4

kv_gib = 2 * tokens * layers * kv_heads * head_dim * dtype_bytes / 1024**3
print(f"dense GQA 1M-token KV footprint: {kv_gib:.1f} GiB")
print(f"even {devices}-way context shard: {kv_gib / devices:.1f} GiB/device before overhead")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dense GQA 1M-token KV footprint: 305.2 GiB
even 4-way context shard: 76.3 GiB/device before overhead
```
<!-- leetllm: output:end -->

Even after splitting 305.2 GiB across four GPUs, each shard needs 76.3 GiB before model weights or runtime buffers, exceeding an 80 decimal GB (`74.5 GiB`) GPU budget on its own. Sequence capacity scaling therefore requires pairing more devices with techniques that overlap attention transfers or compress retained keys and values. Inspect both prefill and decode mechanics to see how engines actually shard that history.

### Ring Attention

Ring Attention partitions the sequence into $C$ chunks across a logical GPU ring, pinning each GPU's local query chunk while Key-Value chunks circulate peer-to-peer around the loop.[^liu2024ring] At every ring step, GPU $i$ computes blockwise self-attention between its local Query and the visiting KV chunk while asynchronously sending that KV chunk to GPU $i+1$ and receiving the next from GPU $i-1$, merging partial scores and outputs through online softmax. Noncausal attention requires $C - 1$ ring shifts after the local block, whereas causal attention can skip masked upper-triangular blocks. Communication hides cleanly behind attention compute during compute-heavy prefill, whereas memory-bound decode steps rarely offer enough FLOPs to overlap transfers.

<figure>
  <img src="illustrations/_generated/ring_attention_prefill_dark.png" alt="Four-way Ring Attention prefill circulates KV blocks clockwise across GPUs 0 to 3 while each rank keeps its local query block Q_i pinned and merges results with online softmax. Below, splitting a 305.2 GiB 1M-token KV footprint four ways still uses 76.3 GiB per device, exceeding a 74.5 GiB (80 decimal GB) limit before weights." />
  <figcaption>Ring Attention overlaps clockwise KV transfers with block attention across local queries. At 1M tokens, a four-way KV split still leaves 76.3 GiB per rank, above a 74.5 GiB (80 decimal GB) device limit before weights.</figcaption>
</figure>

### DeepSpeed Ulysses

DeepSpeed Ulysses, introduced for long-sequence **training**, trades peer-to-peer KV rings for all-to-all transposes.[^deepspeed2023ulysses] Each rank starts with sequence-partitioned inputs (all heads, $S/C$ tokens), projects local Q/K/V, runs a first **All-to-All collective** to transpose ownership to head slices (assigned heads, full sequence $S$), executes local FlashAttention across the complete sequence per head, and runs a second **All-to-All** back to sequence slices before output projection $W_O$. Avoiding ring shifts simplifies attention kernel scheduling over fast intra-node interconnects. However, nonduplicating head slicing requires head divisibility across ranks (often tight under small GQA KV-head counts), whereas Ring Attention works cleanly even when heads cannot divide across ranks.

<figure>
  <img src="illustrations/_generated/ulysses_prefill_layout_dark.png" alt="DeepSpeed Ulysses transposes sequence shards into head shards and back. Stage 1 holds sequence slices S/4 with all heads, runs All2All #1 into Stage 2 holding head slices H/4 over the full sequence for local FlashAttention, then runs All2All #2 into Stage 3 sequence slices before output projection." />
  <figcaption>Ulysses alternates sequence ownership and head ownership with two All-to-All collectives so FlashAttention runs locally per head. That training layout requires head divisibility and differs from serving decode KV storage.</figcaption>
</figure>

### Decode context sharding addresses another axis

For serving, vLLM separates prefill context parallelism from **decode context parallelism (DCP)**, which shards retained token history across existing tensor-parallel partner ranks without expanding the GPU count.[^vllm2026contextParallel] When GQA replicates 2 KV heads across `TP=8`, each four-rank subgroup normally stores identical full copies of its head. `DCP=4` distributes every fourth token position (`token % 4 == lane`) to a different rank in that group, cutting total physical KV pairs from 256 to 64 on a 32-token history while keeping each rank's decode attention local before a final weighted merge:

<!-- leetllm: test, output=show -->
```python title="context-shards-remove-duplicated-history.py"
tp, kv_heads, dcp, history = 8, 2, 4, 32
owned = []
for rank in range(tp):
    head = rank // dcp
    lane = rank % dcp
    owned.append({(head, token) for token in range(lane, history, dcp)})
assert set.union(*owned) == {(head, token) for head in range(kv_heads) for token in range(history)}
assert sum(map(len, owned)) == kv_heads * history
print(f"plain replicated-head cache: {history} head-position pairs/rank")
print(f"ideal DCP={dcp}: {len(owned[0])} pairs/rank")
print(f"total physical pairs: {tp * history} -> {sum(map(len, owned))}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
plain replicated-head cache: 32 head-position pairs/rank
ideal DCP=4: 8 pairs/rank
total physical pairs: 256 -> 64
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/dcp_history_ownership_dark.png" alt="Decode context parallelism (DCP=4) stride matrix and memory comparison for TP=8, 2 KV heads, and 32 tokens. Lane r owns tokens satisfying pos mod 4 == r, cutting physical KV pairs from 256 (32 per rank) down to 64 (8 per rank, a 4x reduction)." />
  <figcaption>DCP shards each replicated KV head by token stride across existing partner ranks, eliminating the 4x KV duplication introduced by head replication.</figcaption>
</figure>

Combining partial attention outputs across sequence or DCP shards requires weighting by unnormalized partition mass rather than averaging normalized rank outputs. Let each non-empty shard $j$ hold local maximum logit $m_j$, shifted exponential sum $l_j = \sum_i e^{s_{j,i} - m_j}$, and shifted weighted value sum $u_j = \sum_i e^{s_{j,i} - m_j} v_{j,i}$; with shared global maximum $M = \max_j m_j$, the exact merged attention vector is:

$$
o = \frac{\sum_j e^{m_j-M}u_j}{\sum_j e^{m_j-M}l_j}
$$

Two equally scored positions of value zero carry twice the probability mass of one equally scored position of value nine, yielding an exact output of $3.0$ rather than the naive average $(0 + 9)/2 = 4.5$. Run the numerical verification below to inspect how online softmax rescaling prevents both `exp(1000)` overflow and unequal-mass distortion:

<!-- leetllm: test, output=show -->
```python title="merge-attention-mass-not-shard-averages.py"
from math import exp, isclose

def statistics(scores, values):
    if not scores:
        return None  # empty or wholly masked shard: contributes no mass
    maximum = max(scores)
    shifted = [exp(score - maximum) for score in scores]
    return maximum, sum(shifted), sum(w * v for w, v in zip(shifted, values))

def merge(parts):
    parts = [part for part in parts if part is not None]
    if not parts:
        raise ValueError("query has no valid key positions")
    maximum = max(part[0] for part in parts)
    mass = sum(exp(m - maximum) * total for m, total, _ in parts)
    numerator = sum(exp(m - maximum) * value for m, _, value in parts)
    return numerator / mass

parts = [statistics([1000., 1000.], [0., 0.]),
         statistics([1000.], [9.]), statistics([], [])]
valid_parts = [part for part in parts if part is not None]
wrong = sum(value / mass for _, mass, value in valid_parts) / len(valid_parts)
correct = merge(parts)
dense = merge([statistics([1000., 1000., 1000.], [0., 0., 9.])])
assert isclose(correct, dense) and isclose(correct, 3.)
assert not isclose(wrong, correct)
assert isclose(merge([statistics([0.], [0.]), statistics([1000.], [9.])]), 9.)
try:
    merge([None, None])
except ValueError as error:
    print(error)
else:
    raise AssertionError("all-empty shards accepted")
print(f"local-output average={wrong:.1f}; mass-aware merge={correct:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
query has no valid key positions
local-output average=4.5; mass-aware merge=3.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/attention_mass_merge_dark.png" alt="Shard 0 holds two positions at score 1000 with value 0 (mass 2, local mean 0); Shard 1 holds one position at score 1000 with value 9 (mass 1, local mean 9); Shard 2 is empty (mass 0). A horizontal scale bar compares naive shard averaging at 4.5 against exact shared-maximum mass-aware merging at 3.0." />
  <figcaption>Two zero-valued positions carry twice the probability mass of one value-nine position: mass-aware merging gives 3.0, whereas naive shard averaging gives 4.5. Empty shards add zero mass while still participating in NCCL collectives.</figcaption>
</figure>

Scores near `1,000` would overflow a direct `exp(score)` calculation in float16 or float32, so subtracting the shared global maximum keeps every intermediate exponential bounded inside $[0, 1]$. Merging by probability mass rather than averaging already-normalized local outputs preserves exact numerical equivalence to full-context attention across arbitrary shard lengths. Even when a shard holds no local keys and contributes `None` with zero mass, every rank must still participate in NCCL collectives with matching buffer counts and datatypes so the communicator never deadlocks or silently drops ranks.[^nccl2026guide]

```checkpoint
When does context-aware parallelism become relevant for inference?
---
Context parallelism matters when long prompts exhaust KV memory or prefill attention time before weights fill a GPU. Choose the mechanism by workload phase: Ring Attention and Ulysses parallelize long prefill attention, whereas decode context parallelism eliminates duplicated KV history across replicated tensor-parallel heads. Verify backend support directly, as training sequence-parallel flags alone never cover serving decode caches.
```

## Expert parallelism for MoE models

Mixture-of-experts architectures distribute feed-forward capacity across conditional experts, where a learned router sends each token to its top-$k$ chosen experts rather than running identical dense layers for every token.[^shazeer2017] <span data-glossary="expert-parallelism">Expert parallelism (EP)</span> places disjoint subsets of experts on separate GPUs so total parameter capacity scales linearly across devices without replicating every expert on every rank. While tensor parallelism slices individual weight matrices within a rank group, expert parallelism assigns whole experts across ranks and often combines with TP for attention or with redundant replicas for popular hot experts.

Because router weights respond dynamically to token hidden states rather than following a fixed round-robin schedule, bursty workloads can overload individual ranks with straggler tokens. Dispatching activations to the GPUs that own each selected expert and gathering weighted outputs back to the originating ranks forms a logical all-to-all communication pattern implemented via fused dispatch-and-combine kernels or collective exchanges.[^vllmExpertParallel2026] In vLLM, passing `--enable-expert-parallel` creates an expert communication group spanning $\text{TP} \times \text{DP}$ ranks while keeping attention confined to local TP groups and optionally replicating high-traffic experts to smooth load skew.[^vllmExpertParallel2026] Trace a concrete schedule where six tokens route two experts each across two GPUs:

<!-- leetllm: test, output=show, id=expert-lab -->
```python title="expert-dispatch-combine.py"
routes = [(0, 1), (0, 1), (0, 1), (0, 2), (1, 3), (2, 3)]
inputs = [1., 2., 3., 4., 5., 6.]
gates = (0.75, 0.25)
owners = {0: 0, 1: 0, 2: 1, 3: 1}
queues = [[], []]
for token, selected in enumerate(routes):
    for expert, gate in zip(selected, gates):
        queues[owners[expert]].append((token, expert, gate))

def expert_value(expert, value):
    return (expert + 1) * value

combined = [0.] * len(inputs)
for queue in queues:
    for token, expert, gate in queue:
        combined[token] += gate * expert_value(expert, inputs[token])
reference = [sum(g * expert_value(e, x) for e, g in zip(r, gates))
             for x, r in zip(inputs, routes)]
assert combined == reference
loads = list(map(len, queues))
assert sum(loads) == 2 * len(inputs)
print("assignments per device:", loads)
print("combined output:", combined)
print(f"peak / average assignments: {max(loads) / (sum(loads) / 2):.2f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
assignments per device: [8, 4]
combined output: [1.25, 2.5, 3.75, 6.0, 12.5, 19.5]
peak / average assignments: 1.33x
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/expert_dispatch_combine_dark.png" alt="Expert dispatch load skew and token T3 combine path. Top bar chart shows Device 0 (E0, E1) handling 8 token-expert assignments (1.33x average) versus 4 on Device 1 (E2, E3). Bottom flow tracks T3 (input 4) through E0 (0.75 x 4 = 3.0) and E2 (0.25 x 12 = 3.0) back to combined output 6.0." />
  <figcaption>Weighted routing sends eight assignments to device 0 and four to device 1 (1.33x peak-to-average skew). Token T3 splits across E0 and E2, returning two equal weighted contributions that combine to 6.0.</figcaption>
</figure>

## Multi-GPU serving Pareto trade-offs

Given an 8x 80 GB cluster serving a 70 GB checkpoint, the same hardware can operate as one wide model-parallel replica, four independent replicas, or disaggregated phase pools. Choosing well means evaluating memory headroom, collective latency, and phase interference side by side rather than assuming wider sharding automatically improves throughput. Compare the three primary deployment layouts across those operational dimensions:

### 1. Pure Tensor Parallelism (`TP=8`)

A single replica spanning all 8 GPUs maximizes per-token weight sharding and matrix parallelism across every layer, cutting per-GPU weight storage down to `8.75 GB`. At the same time, it exposes collective barriers inside every block, shrinks local GEMM tile dimensions into launch-bound shapes, and duplicates KV heads whenever `n_kv_heads < 8`. Benchmark both prompt prefill and decode concurrency on your target interconnect before assuming `TP=8` minimizes end-to-end latency.

### 2. Sharded Data-Parallel Replicas (`TP=2, DP=4`)

Four independent 2-GPU replicas duplicate weights four times while confining collectives to fast two-GPU pairs, letting separate request batches progress independently unless cross-rank expert parallelism couples them. Isolating collectives inside pairs raises per-GPU arithmetic intensity and frees collective bandwidth on nodes without full-mesh all-to-all NVLink. Under balanced traffic, total cluster throughput multiplies relative to a single `TP=2` pair, rather than scaling linearly to fourfold over a wide `TP=8` instance.

### 3. Prefill-Decode Disaggregation

Separating prefill pools from decode pools eliminates batching interference between compute-bound prompt ingestion and memory-bandwidth-bound token generation.[^zhong2024][^patel2023] Each pool tunes tensor and pipeline parallelism independently so prompt workers optimize matrix utilization while decode workers maximize resident KV cache capacity. Those gains come at the expense of cross-pool KV transfer latency and queue coordination on the critical path.

<figure>
  <img src="illustrations/_generated/serving_capacity_dark.png" alt="Three-gate screening table and unit-cost comparison. TP=1 fails VRAM fit at 86 GB; TP=2 fits and passes p95 TTFT (310 ms) and TPOT (45 ms) gates at 620 TPS; TP=4 fits memory yet fails both SLO gates (430 ms TTFT, 62 ms TPOT) despite 700 TPS. Below, comparing a 2-GPU group at 620 TPS ($6/hr, $2.69 per million tokens) with a 4-GPU group at 900 TPS ($12/hr, $3.70 per million tokens) shows higher throughput can cost more per useful token." />
  <figcaption>Fit and p95 latency targets eliminate TP=1 and TP=4 in favor of TP=2. When two valid configurations both pass latency targets, GPU-only unit cost ($2.69/M vs. $3.70/M tokens) can favor the smaller, cheaper group over raw peak throughput.</figcaption>
</figure>

Verify the KV cache headroom on a `TP=2` pair (80 GB per GPU, 70 GB weights, 32 GB total runtime reserve across both GPUs, and 0.75 GB aggregate KV per concurrent request):

<!-- leetllm: test, output=show -->
```python title="serving-memory-budget.py"
gpu_count = 2
gpu_capacity_gb = 80
weights_gb = 70
runtime_reserve_gb = 32
assumed_kv_per_request_gb = 0.75  # total across both GPUs, not per GPU

kv_budget_gb = gpu_count * gpu_capacity_gb - weights_gb - runtime_reserve_gb
arithmetic_batch_ceiling = int(kv_budget_gb / assumed_kv_per_request_gb)

print(f"KV budget after weights and reserve: {kv_budget_gb} GB")
print(f"arithmetic request ceiling at assumed KV/request: {arithmetic_batch_ceiling}")
print("Latency and burst headroom determine the admitted batch below this ceiling.")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
KV budget after weights and reserve: 58 GB
arithmetic request ceiling at assumed KV/request: 77
Latency and burst headroom determine the admitted batch below this ceiling.
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/per_rank_memory_admission_dark.png" alt="Stacked per-rank bars on an 80 GB cap for TP=2 show Rank 0 and Rank 1 each start with 29 GB free after 35 GB weights and 16 GB reserve. Placing a 50 GB request asymmetrically as 35 GB on Rank 0 and 15 GB on Rank 1 leaves Rank 1 with 14 GB spare while overflowing Rank 0 to 86 GB (+6 GB OOM) despite the 58 GB group free sum." />
  <figcaption>Per-rank fit matters more than group capacity sums: 58 GB total free space cannot accommodate a placement demanding 35 GB on Rank 0 when each rank holds only 29 GB free.</figcaption>
</figure>

## What to measure

Compare layouts on identical hardware, checkpoint precision, prompt/output distributions, quality gates, and per-rank telemetry using three sequential screening gates:

1. **Gate 1: Physical Fit**: Verify that checkpoint shards, runtime workspace, and KV pool headroom fit within physical VRAM on every individual rank without out-of-memory faults.
2. **Gate 2: Latency SLOs**: Check p95 TTFT (e.g., $\le 400$ ms) and p95 TPOT (e.g., $\le 55$ ms) under target arrival concurrency rather than empty-queue latency.
3. **Gate 3: Cost**: Among candidates passing quality, fit, and SLO targets, rank sustained useful tokens per billed GPU-hour rather than raw unscreened TPS.

Filter a worked table of candidate measurements by memory fit and latency SLOs first, noting that `TP=4` stalls past both latency limits despite higher raw throughput:

<!-- leetllm: test, output=show -->
```python title="select-config-under-slo.py"
benchmarks = [  # candidate benchmark measurements for one target arrival mix
    {"name": "TP=1", "fits": False, "ttft_p95": None, "tpot_p95": None, "tps": None},
    {"name": "TP=2", "fits": True, "ttft_p95": 310, "tpot_p95": 45, "tps": 620},
    {"name": "TP=4", "fits": True, "ttft_p95": 430, "tpot_p95": 62, "tps": 700},
]
ttft_limit, tpot_limit = 400, 55
eligible = [b for b in benchmarks if b["fits"] and b["ttft_p95"] <= ttft_limit and b["tpot_p95"] <= tpot_limit]
best = max(eligible, key=lambda b: b["tps"], default=None)
print(f"eligible configurations: {[b['name'] for b in eligible]}")
print(f"highest-throughput configuration inside SLO: {best['name'] if best else 'none'}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
eligible configurations: ['TP=2']
highest-throughput configuration inside SLO: TP=2
```
<!-- leetllm: output:end -->

In this worked comparison, `TP=4` delivers higher aggregate throughput yet breaches both p95 latency targets, leaving `TP=2` as the only configuration meeting the serving SLO. Pinpointing why the four-GPU configuration stalls requires kernel timeline traces and NCCL collective profiles alongside tail token-gap distributions, because small GEMM launches or all-reduce stalls often dominate compute savings once latency bounds tighten. When multiple layouts satisfy both memory capacity and p95 latency targets, rank the eligible candidates directly by GPU cost per million useful tokens:

<!-- leetllm: test, output=show -->
```python title="more-tokens-can-cost-more-per-token.py"
eligible = [  # chosen sustained useful rates and group prices
    {"name": "two-GPU group", "tps": 620, "hourly_cost": 6.0},
    {"name": "four-GPU group", "tps": 900, "hourly_cost": 12.0},
]
for candidate in eligible:
    candidate["cost_per_million"] = candidate["hourly_cost"] / (candidate["tps"] * 3600) * 1_000_000
    print(f"{candidate['name']}: ${candidate['cost_per_million']:.2f}/million useful tokens")
fastest = max(eligible, key=lambda candidate: candidate["tps"])
cheapest = min(eligible, key=lambda candidate: candidate["cost_per_million"])
print(f"highest rate: {fastest['name']}; lowest GPU-only unit cost: {cheapest['name']}")
assert fastest is not cheapest
```

<!-- leetllm: output:start -->
```text title="Output" output compact
two-GPU group: $2.69/million useful tokens
four-GPU group: $3.70/million useful tokens
highest rate: four-GPU group; lowest GPU-only unit cost: two-GPU group
```
<!-- leetllm: output:end -->

Because doubling GPU cost from \$6 to \$12/hour raises sustained throughput by only 45% (620 to 900 TPS), the faster four-GPU group raises unit token cost from \$2.69 to \$3.70 per million tokens. Choosing the faster pool trades substantially lower margin per token for lower queue latency on heavy traffic spikes. Whole-service pricing must also include idle capacity, retries, network egress, and host orchestration overhead.

```checkpoint
How do you choose between model parallelism and replicas?
---
Use model parallelism when weights or a single request's context and compute exceed one GPU's budget, and use data-parallel replicas once one sharded group fits and higher request concurrency is needed. Start with the smallest validated group that clears memory and latency targets, compare wider groups for latency and unit cost, then replicate that winner across the cluster.
```

## When multi-GPU serving breaks down

Trace each multi-GPU failure symptom directly to its per-rank hardware counter rather than relying on group aggregates or transport labels. Logical degrees such as `TP=8` or `DP=4` obscure per-GPU asymmetries in KV cache replication, CUDA graph captures, and NCCL synchronization stalls. Inspecting physical per-rank telemetry isolates whether memory exhaustion or interconnect latency is driving the bottleneck:

- **OOM despite on-paper fit**: Inspect each rank's replicated tensors, KV layout, CUDA graphs, and workspace separately, since a group-free sum hides a local single-rank deficit.
- **Latency worsens with more ranks**: Profile NCCL collectives, small-batch kernel efficiency, and scheduling overlap to check whether exposed synchronization outweighs split compute on the real interconnect.
- **KV history stops shrinking with TP**: Check whether `TP` exceeds `n_kv_heads` (forcing KV replication) or whether hybrid state layers resist splitting, and evaluate decode context parallelism if history replication dominates VRAM.
- **Concurrent traffic creates token gaps**: Inspect scheduler queues, prefill/decode batch interference, and KV transfers in a trace before deciding whether chunked prefill or phase disaggregation improves goodput.

### Evaluation rubric

- Reconstruct the dense MLP result from column-parallel and row-parallel shards, adding output bias once.
- Count collectives under the classic dense layout and measure which communication is exposed.
- Derive the pipeline bubble fraction $F_{\text{bubble}} = \frac{p-1}{m+p-1}$ from first principles.
- Distinguish Ring Attention from DeepSpeed Ulysses sequence sharding for long-context workloads.
- Filter by per-rank fit and target latency SLOs before comparing sustained useful rates and unit token costs.

Reject any placement that balances only on paper as a group total. Verify row-parallel reductions directly against unsharded outputs so numerical accumulation and bias additions match dense execution. Keep weight sharding distinct from KV-history replication when sizing long-context capacity across multi-GPU serving pools.

### Follow-up questions

```checkpoint
What changes if all twelve expert assignments land on device 0?
---
Peak-to-average assignment ratio rises to 12/6 = 2.0 across two devices while all-to-all dispatch concentrates work on device 0's SMs. Weighted outputs remain mathematically exact once reduced, yet skewed queues turn device 0 into the step straggler unless kernel cost and load balancing redistribute hot experts.
```

```checkpoint
Why doesn't 58 GB of free group memory prove that a 50 GB request fits?
---
Allocation happens per GPU rather than across a pooled sum. A placement requiring 35 GB on rank 0 and 15 GB on rank 1 overflows rank 0's 29 GB free budget by 6 GB even though 58 GB remains free globally across the pair.
```

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
    "question": "Two rank-local projections after activation produce partial vectors [2, −1] and [−3, 5]. The output bias is [0.5, −0.5]. What result preserves the row-parallel output invariant?",
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
    "question": "Two ranks each have 24 GB free after weights and reserve. A 40 GB request needs 28 GB on rank 0 and 12 GB on rank 1. What does the local memory ledger show?",
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
    "question": "Two configurations already pass the same fit, quality and latency gates. A sustains 800 useful tokens/s at $8 per group-hour; B sustains 1200 at $15 per group-hour. Which has the lower GPU-only cost per million useful tokens, and which has the higher rate?",
    "options": [
      "B costs $3.47/million; A has higher rate.",
      "B costs $2.08/million; B has higher rate.",
      "A costs $2.78/million; B has higher rate.",
      "A costs $10.00/million; B has higher rate."
    ],
    "answer": "A costs $2.78/million; B has higher rate.",
    "explanation": "A costs 8/(800×3600)×1e6≈2.78 dollars per million; B costs 15/(1200×3600)×1e6≈3.47. B is faster but costs more per useful token under these stated rates and prices, before accounting for whole-service infrastructure and retry overhead."
  }
]
```

> **Next:** Continue to [Accelerator Architecture Field Guide](/learn/accelerator-architecture-field-guide). Model parallelism describes how work is split. The next lesson maps those shards onto real accelerator execution units, memory systems, and interconnects so placement decisions start from hardware evidence instead of product names.
