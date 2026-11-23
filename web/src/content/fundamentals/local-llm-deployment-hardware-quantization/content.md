---
{
  "id": "local-llm-deployment-hardware-quantization",
  "title": "Local LLM Deployment",
  "slug": "local-llm-deployment-hardware-quantization",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 19,
  "companies": ["Google", "Ollama", "NVIDIA", "Apple", "Meta"],
  "shortDescription": "A 7.6 GB model can load on a 24 GB GPU and still run out of memory once cache, workspace, and long prompts share the card.",
  "keyConceptsTested": [
    "Weights, KV cache, workspace, and device-specific memory budgets",
    "Discrete GPU, Apple unified memory, and CPU memory channels",
    "Estimated block capacity versus versioned GPU offload flags",
    "Allocation failure, explicit offload, managed migration, and disk faults",
    "llama.cpp, Ollama, MLX-LM, and vLLM serving trade-offs",
    "Cached-token timing, local fallback, and paired quantization evaluation"
  ],
  "prerequisites": [
    "model-quantization-gptq-awq-gguf",
    "model-parallelism-for-llm-inference",
    "scaling-llm-inference-batching-kv-cache",
    "kv-cache-paged-attention-llm-serving"
  ],
  "relatedQuestions": [
    "slm-specialization-edge-deployment",
    "llm-deployment-gpu-serving-autoscaling",
    "speculative-decoding",
    "model-gateways-routing-fallbacks",
    "continuous-batching-request-scheduling",
    "model-quantization-gptq-awq-gguf"
  ],
  "coverImage": "illustrations/_generated/memory_budget_dark.png"
}
---

Imagine serving a 12B Q4_K_M checkpoint whose downloaded weight file is 7.6 GB. It loads cleanly on a 24 GB discrete GPU and answers a short single-turn prompt. Four concurrent users then send 16,384-token codebases or tool schemas at once, and a request fails with CUDA out-of-memory (OOM). The weight file fit easily; the live execution working set did not.

Measure live allocations, CPU/GPU placement, and prefill peak memory under realistic request shapes before sizing hardware. Short single-turn prompts hide the growth of attention state and temporary workspaces under long contexts and concurrency.

Our target deployment runs locally with pinned model digests so weights, tokenizer, KV cache, and execution workspaces share host memory or discrete VRAM without calling an external API.

[Model Quantization](/learn/model-quantization-gptq-awq-gguf) explains the 7.6 GB weight payload. [KV Cache and PagedAttention](/learn/kv-cache-paged-attention-llm-serving) explains why four long contexts expand runtime memory. Neither alone specifies which physical memory pool held the bytes when the allocation failed.

## Follow the bytes before counting the cores

An out-of-memory failure occurs when the live model, cache, and workspace exceed the memory available to their execution path. A discrete GPU, Apple Silicon, and a CPU offer different memory pools, so follow where each allocation resides.

Single-sequence dense-model decode often has low arithmetic intensity: a matrix must supply many weight bytes for one new token, so memory bandwidth can dominate. Batching reuses weights across sequences; attention, unpacking, launches, CPU work, and long contexts can shift the bottleneck. Measure the target workload to identify its limiting resource.

| Hardware | Where model data can live | Memory pool to inspect |
|---|---|---|
| Discrete GPU | Device VRAM, with separate host RAM | Host/device transfers and the actual allocation/offload policy |
| Apple Silicon | Physical memory shared by CPU and GPU | Available Metal working memory, system pressure, and competing users of the bus |
| CPU | System RAM, possibly spread across NUMA nodes | Populated memory channels, sustained bandwidth, locality, and kernel support |

### Discrete GPU: capacity and bandwidth are different limits

The GeForce RTX 4090 provides a concrete capacity and bandwidth example. NVIDIA specifies 24 GB GDDR6X, a 384-bit interface, and 1,008 GB/s peak memory bandwidth.[^nvidiaAdaArchitecture2026] Peak bandwidth describes the hardware specification; measure decode rate on the target workload. Four-bit stored weights also do not imply every multiplication uses native INT4 instructions: W4A16 kernels can unpack into floating-point arithmetic.

Host RAM does not become extra ordinary CUDA device memory just because the machine has plenty of it. A runtime can intentionally execute some layers on CPU, transfer data, or use a supported managed-memory path. An ordinary device allocation can instead fail. Establish which path your installed backend uses before explaining a slowdown.

### Apple Silicon: shared storage still has a working-set limit

Unified memory lets CPU and GPU access the same physical memory pool without copying an array across a discrete GPU's PCIe link. Shared physical storage does not require identical CPU/GPU virtual addresses, eliminate synchronization, or make all installed RAM freely available to the model.

As checked September 22, 2026, Apple's Mac Studio specifications list M5 Max variants at 460 or 614 GB/s and M5 Ultra at 1.2 TB/s, with supported memory configurations reaching 128 GB and 512 GB respectively.[^appleMacStudioSpecs2026] These are advertised hardware specifications. Model fit and token rate depend on the actual model, context, and runtime, so measure them on the target system.

Include macOS, other applications, runtime caches, and the Metal working-set constraints in your budget. There is no universal rule that macOS reserves exactly 20–25%. In MLX, supported execution devices are CPU and GPU; the framework does not expose the Neural Engine as an execution device.[^mlx2026][^mlxUnifiedMemory2026] Evaluate MLX-LM against another compatible runner using the same artifact quality, prompt, and concurrency before claiming one is faster.

### CPU: channels, locality, and workload shape

On a dual-channel DDR5-5600 host, theoretical peak bandwidth is $2 \times 5.6\text{ GT/s} \times 8\text{ bytes} = 89.6\text{ GB/s}$ before controller overhead, and an eight-channel server reaches 358.4 GB/s. Check the processor's supported channels, DIMM population, transfer rate, and NUMA placement.

More threads help until another resource dominates; they can also increase contention. Measure a thread-count sweep instead of prescribing a token rate from core count. A server with more sockets can have more aggregate bandwidth while a poorly placed process still accesses remote memory.

<figure>
  <img src="illustrations/_generated/memory_pools_dark.png" alt="Three physical layouts show where inference bytes reside. A discrete GPU has separate host RAM and device VRAM joined by an explicit transfer path. Apple CPU and GPU operations share a physical memory pool used by the operating system, other applications, and the model working set. A two-node NUMA sketch distinguishes local from remote memory access and reports theoretical DDR5 channel bandwidth before controller overhead." />
  <figcaption>Discrete devices keep host RAM and VRAM in separate pools; Apple Silicon shares physical memory across CPU and GPU; NUMA placement changes which CPU memory channels serve an allocation. The 89.6 GB/s and 358.4 GB/s rates reflect theoretical 2-channel and 8-channel DDR5-5600 peak bandwidth before controller overhead.</figcaption>
</figure>

```checkpoint
Assume one dense decode sequence reads 5 GB of weights per step and sustains 80 GB/s. A teammate predicts at most 16 tokens/s total even when eight sequences are batched. What did the prediction miss?
---
$80\,\mathrm{GB/s} \div 5\,\mathrm{GB} = 16\,\mathrm{steps/s}$ is a weight-stream ceiling for the single-sequence assumptions. A batched step can reuse those weights to produce one token for each of eight sequences, potentially increasing aggregate tokens/s. It also does more arithmetic and cache work, so neither 16 nor 128 tokens/s is a measured multi-user result. Test the required queueing, TTFT, and token-gap limits under the actual arrival pattern.
```

## Build a budget for each memory pool

Estimate before downloading a large artifact, then replace estimates with measurements after loading it. For a particular device and a particular request phase:

$$
M_{\text{peak}} \approx M_{\text{weights}} + M_{\text{cache}} + M_{\text{workspace}} + M_{\text{other}}
$$

The terms must refer to allocations that coexist. Do not sum unrelated peaks, count reserved allocator memory twice, or mix CPU RAM and GPU VRAM into one fictitious pool. For a split deployment, make separate host and device budgets. Unified-memory machines instead share a capacity constraint with the operating system.

| Term | What to record |
|---|---|
| Weights | Actual loaded tensor types, scales, preserved tensors, placement, and any separate multimodal components |
| Cache | Architecture, cache dtype, retained context, concurrent sequences, page rounding, sharing, and reserved capacity |
| Workspace | Prefill chunk size, attention backend, graph captures, temporary buffers, and peak coexistence |
| Other | Driver/runtime allocations, display and other processes, allocator overhead, and an explicit reserve |

### Weight payload is a starting point

For $N$ uniformly stored weights at $b$ bits, the ideal payload is $Nb/8$ bytes. Real artifacts include grouping metadata and a mixture of tensor precisions. A dense array of zeros does not shrink just because someone calls it pruned; a sparse representation and compatible execution path are separate requirements.

Google's model card lists Gemma 4 12B Unified at 11.95B parameters.[^gemma4modelcard2026] At uniform 16-bit precision, those weights occupy 23.9 decimal GB; four-bit codes alone would take 5.975 GB. As checked October 10, 2026, Ollama's `gemma4:12b` artifact page lists an 8.0 GB native payload, with Q4_K_M model data, a BF16 projector, and a Q8_0 423M-parameter draft model.[^ollamaGemma4Artifact2026] The draft adds another set of weights and execution/cache costs when used. Do not budget only the target model's four-bit codes. File size alone does not reveal loaded device footprint; preserve the local artifact identity because the tag can change.

### Cache arithmetic starts with the architecture

For $L$ homogeneous full-attention layers with separate key/value buffers:

$$
M_{\text{KV,raw}} = 2 L H_{\text{KV}} D T B s
$$

$H_{\text{KV}}$ is the KV-head count, $D$ the configured head width, $T$ retained tokens per sequence, $B$ concurrent sequences, and $s$ bytes per scalar. Do not automatically derive $D$ as hidden width divided by query-head count; architectures can use a different projection width. Sum layer types separately when dimensions differ. This formula excludes page rounding, quantization metadata, temporary updates, and reserved-but-unused cache space.

A 32-layer model with eight KV heads of width 128 and two-byte scalars needs $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes per retained token, or **128 KiB**. At 4,096 tokens that is 0.5 GiB (536.9 decimal MB). At 32,768 tokens across four sequences it is 16 GiB (17.18 decimal GB), before workspace.

Caching avoids recomputing the old prefix's states. Full-attention decode still reads history and its attention work grows with retained length. Re-evaluating a whole full-attention prefix would instead include quadratic attention work in that prefix. Cache projection work alone is not quadratic.

Gemma 4 12B's inspected text configuration has 40 sliding layers with eight KV heads of width 256 and a 1,024-token window, plus eight full layers with one KV head of width 512.[^gemma4config2026] It also enables shared K/V **projection** in global layers. The inspected Transformers implementation separately normalizes/transforms key and value states and updates each in the cache; inspect the cache layout to determine how storage is arranged.[^gemma4CacheImplementation2026]

For a worksheet assuming separate 16-bit K/V arrays and retention capped at 1,024 tokens in sliding layers, four 16,384-token sequences require:

- Sliding payload: $2 \times 40 \times 8 \times 256 \times 1{,}024 \times 4 \times 2 = 1.342\text{ GB}$.
- Full payload: $2 \times 8 \times 1 \times 512 \times 16{,}384 \times 4 \times 2 = 1.074\text{ GB}$.
- Combined raw payload: **2.416 GB**.

If the runtime stores full-length buffers for the sliding layers, the same two-array calculation gives **22.549 GB**. Keeping those buffers is not, by itself, an attention-correctness bug: the attention mask can still enforce the sliding window. A runtime may reserve full buffers by design. Verify storage behavior separately from the mathematical attention pattern.

<figure>
  <img src="illustrations/_generated/cache_retention_dark.png" alt="In this model of a 16,384-token prompt, each tile represents 1,024 positions. The 40 sliding layers retain the final warm key and value tiles; dashed empty earlier tiles are evicted by the modeled window. Eight full-attention layers retain all 16 blue key and value tiles. At four sequences and 16-bit values, capped cache payload is 2.415919104 decimal GB. Full-length sliding buffers use 22.548578304 GB while the attention mask still applies a 1,024-token window." />
  <figcaption>Each tile represents 1,024 positions. Filled cells are retained; dashed empty cells are evicted by the modeled sliding window. At four sequences and 16-bit values, capped payload is 1.342 GB across 40 sliding layers plus 1.074 GB across eight full layers, for 2.416 GB total. Keeping full-length sliding buffers raises total payload to 22.549 GB while the attention mask still applies a 1,024-token window. Shared K/V projections still store distinct key and value arrays.</figcaption>
</figure>

### Workspace and reserve are inputs to the experiment

Memory-efficient attention avoids materializing the full quadratic score matrix. It does not provide a universal 1.5–2.5 GB prefill workspace bound. Prefill chunks, logits, graph captures, kernel workspaces, model dimensions, and concurrency all matter.

Likewise, display and CUDA context costs vary across machines. Measure free device memory and other processes, then capture the server's peak under the intended request shape. Treat a chosen 20% reserve as a **planning margin** and measure OOM headroom on the target system.

## A worksheet that makes its assumptions visible

Using those Gemma layer dimensions with a **7.6 GB weight footprint**, a **2 GB workspace reservation**, and a 20% headroom reserve on a 24 GB device bounds the maximum resident KV tokens: `evict=False` changes storage retention; it does not change the model's attention semantics.

<!-- leetllm: test, output=show -->
```python title="local-memory-budget.py"
def kv_bytes(layers, heads, width, tokens, sequences, bytes_per_value=2):
    dims = (layers, heads, width, tokens, sequences, bytes_per_value)
    if any(d <= 0 for d in dims):
        raise ValueError("cache dimensions must be positive integers")
    return 2 * layers * heads * width * tokens * sequences * bytes_per_value


def gemma_cache_gb(tokens, sequences, evict=True):
    if tokens <= 0 or sequences <= 0:
        raise ValueError("tokens and sequences must be positive")
    sliding_tokens = min(tokens, 1024) if evict else tokens
    sliding = kv_bytes(40, 8, 256, sliding_tokens, sequences)
    full = kv_bytes(8, 1, 512, tokens, sequences)
    return (sliding + full) / 1e9


weight_proxy_gb = 7.6
working_gb = 2.0
capacity_gb = 24.0
reserve_fraction = 0.20
usable_gb = capacity_gb * (1 - reserve_fraction)

print(f"Assumed planning limit (80% of {capacity_gb} GB): {usable_gb:.2f} GB\n")

for tokens, sequences, evict in (
    (16384, 4, True),
    (32768, 4, True),
    (16384, 8, True),
    (16384, 4, False),
):
    cache = gemma_cache_gb(tokens, sequences, evict)
    total = weight_proxy_gb + working_gb + cache
    fits = total <= usable_gb
    print(f"Context={tokens:5d} Concurrency={sequences} Eviction={str(evict):5s} -> "
          f"KV={cache:6.3f} GB, Total={total:6.3f} GB, Fits Modeled Limit={fits}")

assert round(gemma_cache_gb(16384, 4), 3) == 2.416
assert gemma_cache_gb(16384, 8) == 2 * gemma_cache_gb(16384, 4)
assert gemma_cache_gb(32768, 4) < 2 * gemma_cache_gb(16384, 4)
assert gemma_cache_gb(32768, 4, evict=True) < gemma_cache_gb(16384, 4, evict=False)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Assumed planning limit (80% of 24.0 GB): 19.20 GB

Context=16384 Concurrency=4 Eviction=True  -> KV= 2.416 GB, Total=12.016 GB, Fits Modeled Limit=True
Context=32768 Concurrency=4 Eviction=True  -> KV= 3.490 GB, Total=13.090 GB, Fits Modeled Limit=True
Context=16384 Concurrency=8 Eviction=True  -> KV= 4.832 GB, Total=14.432 GB, Fits Modeled Limit=True
Context=16384 Concurrency=4 Eviction=False -> KV=22.549 GB, Total=32.149 GB, Fits Modeled Limit=False
```
<!-- leetllm: output:end -->

Doubling context from 16K to 32K adds 1.074 GB under capped retention. Doubling concurrency doubles this raw cache, **not** the shared weights or every allocation in the process. Full-length sliding storage takes the modeled total to 32.149 GB, beyond the assumed device capacity. Whether the server rejects the configuration, preempts requests, offloads, or fails allocation depends on its implementation.

<figure>
  <img src="illustrations/_generated/memory_budget_dark.png" alt="Four memory layouts share a zero-origin 0 to 36 decimal GB scale. Each includes a 7.6 GB weight proxy and 2.0 GB assumed workspace. Capped-cache totals are 12.016 GB at 16K by 4, 13.090 GB at 32K by 4, and 14.432 GB at 16K by 8. Full-length sliding storage reaches 32.149 GB, above the 19.2 GB planning limit and 24 GB device capacity. These bars model device demand; offload requires an explicit runtime plan." />
  <figcaption>Each zero-origin bar uses the same 7.6 GB weight proxy and 2.0 GB assumed workspace. Capped-cache totals are 12.016 GB (16K × 4), 13.090 GB (32K × 4), and 14.432 GB (16K × 8). Full-length sliding storage reaches 32.149 GB. The 19.2 GB line leaves a 4.8 GB planning reserve. Above 24 GB: device capacity exceeded. These bars model device demand; offload requires an explicit runtime plan.</figcaption>
</figure>

**Try changing the worksheet:** keep four sessions, reduce the assumed working term to 1 GB, and then remove the reserve. Does the full-storage case fit? It still exceeds 24 GB. Next, keep capped retention but double sessions: identify which terms need new measurements rather than multiplying the whole total by two.

```checkpoint
Your worksheet predicts 11 GB on a 24 GB device, but a long request fails with CUDA OOM. Can display overhead alone explain the failure?
---
Not from those two numbers. Inspect the failed allocation, other processes, peak prefill workspace, configured/reserved cache capacity, graph pools, allocator state, and actual placement. The worksheet may omit a large buffer or a competing allocation. A nominal 13 GB cushion does not identify the missing term, and small generic overhead estimates fail to explain the root cause.
```

## Estimate block capacity, then verify the offload flag

`llama.cpp` supports CPU/GPU placement through `-ngl` and related controls.[^llamacpp2023] A block left on CPU executes there using its supported backend; this differs from transferring its entire weight payload to GPU each token.

For a **uniform-block transformer**, assume every non-block allocation, including the output head at its intended placement, is already covered by $M_{\text{fixed}}$. Then the block-capacity estimate is:

$$
n_{\text{blocks}} = \min\left(L, \left\lfloor\frac{M_{\text{budget}}-M_{\text{fixed}}}{M_{\text{block}}}\right\rfloor\right)
$$

With 32 blocks totaling 9.6 GB and 3.2 GB fixed usage, a 16 GB modeled budget accommodates all 32 blocks. An 8 GB budget accommodates $(8-3.2)/0.3 = 16$ blocks, leaving the other 16 on CPU. Neither result includes a reserve unless one was included in the chosen budget.

Do not label that integer an exact, universally safe `-ngl` value. Hybrid blocks, MoE blocks, tensor overrides, cache placement, backend buffers, and precision mixtures can make block sizes unequal. Use actual tensor/suffix sizes and startup logs, then measure peak memory.

Flag semantics are versioned too. In the `llama.cpp` source inspected at commit `709fe755`, the trailing offload range includes an **output-layer slot**. With 40 transformer blocks, `-ngl 24` selects the last **23 blocks plus the output slot**, before tensor/backend overrides. It does not mean 24 hidden blocks; input-layer assignment remains on CPU.[^llamaCppLayerPlacement2026] Check your installed version's help and allocation logs rather than copying counts from an older tutorial.

<figure>
  <img src="illustrations/_generated/block_capacity_dark.png" alt="An equal-block model gives each of 32 blocks 0.3 GB: a 16 GB budget with 3.2 GB fixed use fits all 32, while an 8 GB budget fits 16 and leaves 16 for CPU execution. The fixed term already includes the output head. A separate version-pinned llama.cpp row shows 40 transformer blocks, with -ngl 24 selecting the final 23 blocks plus one output slot; the input layer remains on CPU. Actual tensor sizes and backend allocations can differ." />
  <figcaption>The equal-block worksheet assigns 0.3 GB to each of 32 blocks: 32 fit beside 3.2 GB of fixed use in a 16 GB budget, and 16 fit in an 8 GB budget. The separate `llama.cpp` example follows the inspected commit's placement rule: `-ngl 24` selects 23 trailing blocks plus the output slot. Real tensor and backend allocations set actual fit.</figcaption>
</figure>

## Allocation failure, offload, and paging are different events

A CUDA OOM message can arise through four different allocation paths. Identify the path before concluding that weights first migrated through host RAM:

| Path | What happens | Evidence to seek |
|---|---|---|
| Ordinary device allocation | `cudaMalloc` may fail with `cudaErrorMemoryAllocation` | Allocation error and pool/device-memory state |
| Explicit runtime offload | Chosen layers run on CPU, or the runtime deliberately transfers selected data | Backend placement logs and a transfer/CPU trace |
| Managed memory | Supported managed/system allocations can migrate or access host memory; oversubscription depends on platform capabilities | Allocation type, queried CUDA capabilities, and migration trace |
| Host memory pressure | Anonymous pages may swap if enabled; clean file-backed pages can be discarded and reread from the model file | Major faults, file I/O, swap activity, and resident working set |

NVIDIA's current guide distinguishes device-only allocation, managed memory, mapped host memory, HMM/ATS support, and limited-support platforms.[^cudaDeviceAllocation2026][^cudaUnifiedSystemMemory2026] Ordinary `cudaMalloc` allocations do not acquire automatic oversubscription merely because Unified Memory exists.

`mmap` maps file-backed pages into a process's virtual address space. Page residency depends on which pages the operating system keeps in memory. File-backed rereads and swap reads are separate sources; observe file I/O and swap activity to distinguish them. Ordinary CUDA weight allocations also remain device allocations as the KV cache grows, so a server may reject, preempt, or fail when VRAM runs short.

<figure>
  <img src="illustrations/_generated/allocation_paths_dark.png" alt="Four allocation paths produce different outcomes. Ordinary cudaMalloc targets the device pool and can return cudaErrorMemoryAllocation; explicit runtime offload assigns selected layers to CPU or GPU with a chosen transfer path. Supported managed or system memory can migrate or access host pages when platform capabilities allow. Host pressure separates clean file-backed mmap pages that can be reread from anonymous pages that may swap; allocation logs, migration traces, page faults, file I/O, and swap activity distinguish the paths." />
  <figcaption>Trace the allocation type, selected CPU/GPU placement, migration support, and host page backing independently. Device-allocation errors, runtime transfer logs, migration events, major faults, file reads, and swap activity provide evidence for different routes.</figcaption>
</figure>

### A transfer calculation you can falsify

Suppose one step must read a 7.6 GB payload. Ignore compute, attention, unpacking, and launch overhead. Use 1,008 GB/s as a peak device-memory scenario, **assume** 25 GB/s for a host-to-device path, and **assume** 5 GB/s for storage. These are serial weight-stream calculations, not a Gemma benchmark or a prediction of what your runtime migrates.

<!-- leetllm: test, output=show -->
```python title="serial-weight-stream.py"
weight_gb = 7.6
vram_gbs = 1008.0
transfer_gbs = 25.0
storage_gbs = 5.0

resident_s = weight_gb / vram_gbs
mixed_s = 5.6 / vram_gbs + 2.0 / transfer_gbs
host_s = weight_gb / transfer_gbs
storage_s = weight_gb / storage_gbs

for name, seconds in (
    ("Device stream", resident_s),
    ("5.6 GB device + 2 GB transfer", mixed_s),
    ("All bytes over host link", host_s),
    ("Storage read only", storage_s),
):
    print(f"{name}: {seconds*1000:.2f} ms, {1/seconds:.2f} steps/s")
print(f"Mixed/device stream-time ratio: {mixed_s/resident_s:.2f}x")
assert mixed_s > resident_s
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Device stream: 7.54 ms, 132.63 steps/s
5.6 GB device + 2 GB transfer: 85.56 ms, 11.69 steps/s
All bytes over host link: 304.00 ms, 3.29 steps/s
Storage read only: 1520.00 ms, 0.66 steps/s
Mixed/device stream-time ratio: 11.35x
```
<!-- leetllm: output:end -->

The 11.35× ratio compares two modeled stream times with the same assumptions. It cannot be compared directly with an unrelated measured 50 tokens/s to claim a fivefold slowdown. CPU-executed layers have CPU compute and activation-boundary costs; overlapped transfer has another timing model; disk reads also need subsequent processing. Profile the path your server actually takes.

<figure>
  <img src="illustrations/_generated/transfer_floor_dark.png" alt="A logarithmic time axis compares four serial 7.6 GB weight-stream calculations: 7.54 ms at an advertised 1,008 GB/s device peak; 85.56 ms for 5.6 GB at that peak plus an assumed 2 GB over a 25 GB/s host link; 304 ms over that assumed host link; and 1,520 ms at an assumed 5 GB/s storage rate. The mixed path spends about 80 ms on its 2 GB host segment and is 11.35 times the device-only stream time under these assumptions. The calculations omit compute, attention, unpacking, launch overhead, transfer overlap, and real runtime policy, so these values describe a serial stream-time floor." />
  <figcaption>With the stated serial assumptions, 7.6 GB takes 7.54 ms at the advertised device peak. The mixed path adds 80.00 ms for its 2 GB host leg to 5.56 ms of device streaming, totaling 85.56 ms. Host-PCIe and NVMe transfer rates represent serial link bounds. The plot gives a serial stream-time floor; a runtime benchmark also measures compute, attention, unpacking, launch overhead, transfer overlap, and placement policy.</figcaption>
</figure>

```checkpoint
A server slows on long prompts while allocated VRAM is near capacity and host/device traffic increases. Is managed-memory weight paging proven?
---
No. Check the allocation type and migration trace. Explicit cache transfer, CPU offload, request preemption/recomputation, or other traffic can produce similar symptoms. Distinguish memory.used/total (capacity occupancy) from utilization.memory (memory activity); neither alone tells you which tensors moved.
```

## Choose the runner by the workload it must pass

Ruling a migration path in or out still leaves the question of how the runtime lays out GGUF tensors, KV cache, and workspace across hardware pools under concurrent 16K prompts.

| Option | Role and model packaging | What to check before selecting it |
|---|---|---|
| `llama.cpp` / `llama-server` | Native inference tools, commonly loading GGUF | Model/backend support, CPU/GPU split, cache settings, parallel serving, and driver/build dependencies |
| Ollama | Model manager and HTTP server; imports supported Safetensors or GGUF through a Modelfile | Model/backend compatibility, loaded placement, parallel slots, queue limits, cloud policy, and API subset |
| MLX-LM on MLX | Language-model tooling on Apple's array framework, commonly using Safetensors plus configuration | Supported architecture/quantization, task quality, CPU/GPU memory pressure, and serving needs |
| vLLM | Server/runtime with scheduling, paged cache, and distributed inference features | Supported hardware/model/kernel combination, installation environment, arrival-load SLOs, and parallelism costs |

GGUF is a tensor/metadata container, not “GPT-Generated Unified Format.” It can be sharded, and mapping it does not make startup instantaneous.[^gguf_spec2026] `llama.cpp` can run through native binaries without PyTorch/Python as the inference runtime, but its chosen backends still have dependencies. In the inspected CLI source, cache types include `f16`, `bf16`, `q8_0`, and `q4_0`; generic FP8 is not in that accepted list. Quantized cache carries metadata, has backend restrictions, and needs task evaluation.[^llamaCppArguments2026]

A **Modelfile is configuration**, not a weight serialization format. Ollama's import documentation covers supported Safetensors and GGUF inputs.[^ollama2026import][^ollamagithub2026] Its API compatibility covers a subset of OpenAI endpoints/features. A basic client can target `http://localhost:11434/v1`, but model names, supported fields, context settings, and conversation behavior still need checking. The placeholder API key used by some clients does not secure the unauthenticated local server.[^ollama2026openai][^ollama2026authentication]

MLX is the array framework; MLX-LM supplies language-model tools. Its supported CPU/GPU operations share unified arrays, with dependencies scheduled between streams. There is no universal “MLX beats every Metal runner” result.[^mlx2026][^mlxUnifiedMemory2026]

vLLM's PagedAttention maps logical token blocks to cache blocks. These are not ordinary OS virtual-memory pages. Waste depends on block size, sequence lengths, sharing, and pool policy; “under 4%” is not a bound for every workload. It offers continuous batching and distributed serving, while **Ollama and llama-server also support concurrent requests**. Ollama documents parallel-request and queue controls, with memory implications.[^vllm2024][^ollama2026faq]

```checkpoint
You have two GPUs and 30 technicians, but the quantized model fits on one GPU. Must you tensor-parallelize it across both?
---
No. Compare two independent replicas with one tensor-parallel instance, including cache capacity, queueing, TTFT, token gaps, and interconnect costs. vLLM is a candidate when its scheduling and distributed features meet the workload; concurrency alone neither requires tensor parallelism nor rules out another server. Test the selected model/backend rather than declaring a winner from user count.
```

## Place quantized weights and KV cache in local memory

When serving quantized checkpoints locally, where weights and KV states sit governs both peak memory headroom and decode tokens per second. On a discrete GPU such as an RTX 4090, GGUF Q4_K_M weights and the FP16 or quantized KV cache must coexist inside the 24 GB GDDR6X pool to sustain 1,008 GB/s memory streaming into SM registers for on-the-fly dequantization. Any layers left on host DRAM must either execute on the CPU or cross a ~25 GB/s PCIe bridge, turning decode memory-transfer bound.

Apple Silicon workstations eliminate the PCIe split: CPU and GPU cores address the same unified memory pool at 614 GB/s to 1.2 TB/s without copying layers between host and device buffers. However, macOS, runtime arenas, quantized weights, and growing KV pages contend for one shared physical budget, so long-context batches can trigger system memory compression or Metal allocation failures even when host RAM looks ample on paper.

<figure>
  <img src="illustrations/_generated/private_boundary_dark.png" alt="Side-by-side comparison of discrete GPU versus Apple Silicon unified memory for a Q4_K_M GGUF model. On a discrete GPU, offloaded host RAM layers cross PCIe at roughly 25 GB/s to 24 GB VRAM at 1,008 GB/s holding quantized weights and FP16 KV cache before SM register dequantization and Tensor Cores. On Apple Silicon unified memory, OS buffers, Q4 weights, and KV cache share one high-bandwidth 614 to 1,200 GB/s pool accessed directly by Metal GPU compute units without PCIe copies." />
  <figcaption>Discrete GPUs isolate fast 1,008 GB/s VRAM from slower PCIe-attached host RAM, whereas Apple Silicon lets Metal compute units dequantize GGUF blocks and read KV cache directly from one shared unified pool alongside OS allocations.</figcaption>
</figure>

Keep your local serving configuration self-contained and deterministic across restarts:

1. **Disable remote fallback and pin local weights.** Set `OLLAMA_NO_CLOUD=1` when using Ollama so requests never silently fall back to remote cloud endpoints or web search, and resolve model artifacts by local content digest rather than mutable registry tags.[^ollama2026faq]
2. **Bind loopback and measure worker saturation.** Keep local engine sockets on `127.0.0.1` behind an authenticating proxy if multiple local clients share the host, configure explicit parallel-slot and queue caps so long prompts reject predictably rather than starving active decode streams, and verify that worker crashes fail fast locally instead of hanging clients.[^ollama2026authentication][^ollama2026faq]

## Inspect placement and measure what users receive

Start with a pinned local GGUF or Safetensors checkpoint and a running server. The commands below inspect the installation; their output depends on your machine.

```bash title="inspect-local-model.sh"
set -euo pipefail
ollama --version
curl --fail --silent --show-error --max-time 10 \
  http://127.0.0.1:11434/api/tags > local-models.json
curl --fail --silent --show-error --max-time 10 \
  http://127.0.0.1:11434/api/ps > loaded-models.json
ollama ps
```

`/api/tags` is inventory. `/api/ps` lists loaded models and reported size, VRAM size, digest, and context length.[^ollamaRunningModels2026] The CLI's `PROCESSOR` column summarizes CPU/GPU placement. Treat `100% GPU` as a placement summary; check Tensor Core use, peak memory fit, and latency separately. Percentages are not an exact hidden-layer count.[^ollama2026faq]

### Separate the server's timings from client latency

This native Ollama request fixes the context and output caps. Use a pinned local model checkpoint; the registry tag here is a reproducible request example, not an immutable checkpoint identity.[^ollama2026generate]

```bash title="measure-local-request.sh"
curl --fail --silent --show-error --max-time 300 \
  --write-out 'client_total_seconds=%{time_total}\n' \
  http://127.0.0.1:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gemma4:12b",
    "prompt": "Explain why model file size alone cannot predict peak inference memory.",
    "stream": false,
    "options": {"num_ctx": 4096, "num_predict": 128, "temperature": 0}
  }' \
  -o local-response.json
ollama ps
```

Ollama reports timing fields in nanoseconds. Current usage documentation distinguishes total prompt tokens, cached prompt tokens, uncached-prompt evaluation duration, and output generation count/duration.[^ollama2026apiusage] Dividing **all** prompt tokens by the uncached duration can overstate prefill performance. Reported generation counts should not be assumed to count only visible final-answer text; record thinking mode too. Earlier server versions can differ, so preserve the runtime version and full JSON payload.

The helper below uses example server metrics to parse uncached prefill and decode speeds cleanly. Save it as `read-generation-timing.py`; passing your JSON filename prints its rates. Missing metrics and zero durations produce an unavailable rate, rather than an invented one-nanosecond duration or division by zero.

<!-- leetllm: test, output=show -->
```python title="read-generation-timing.py"
import json
import math
import sys


def metric(response, key):
    value = response.get(key)
    if value is not None and value < 0:
        raise ValueError(f"{key} must be nonnegative")
    return value


def rate(count, duration_ns):
    if count is None or duration_ns is None or count == 0 or duration_ns == 0:
        return None
    try:
        result = count * 1_000_000_000 / duration_ns
    except OverflowError as exc:
        raise ValueError("Token rate exceeds finite FP64 range") from exc
    if not math.isfinite(result):
        raise ValueError("Token rate exceeds finite FP64 range")
    return result


def generation_rates(response):
    if response.get("done") is not True:
        raise ValueError("A completed response is required")
    prompt = metric(response, "prompt_eval_count")
    cached = metric(response, "prompt_eval_cached_count")
    prompt_ns = metric(response, "prompt_eval_duration")
    output = metric(response, "eval_count")
    output_ns = metric(response, "eval_duration")
    if prompt is not None and cached is not None and cached > prompt:
        raise ValueError("Cached prompt count exceeds prompt count")
    uncached = prompt - cached if prompt is not None and cached is not None else None
    return {
        "uncached_prompt_tokens_per_second": rate(uncached, prompt_ns),
        "output_tokens_per_second": rate(output, output_ns),
    }


if len(sys.argv) == 2:
    with open(sys.argv[1], encoding="utf-8") as f:
        print(json.dumps(generation_rates(json.load(f)), indent=2))
else:
    example = {
        "done": True,
        "prompt_eval_count": 1000,
        "prompt_eval_cached_count": 600,
        "prompt_eval_duration": 200_000_000,
        "eval_count": 80,
        "eval_duration": 2_000_000_000,
    }
    result = generation_rates(example)
    print(f"Uncached prompt: {result['uncached_prompt_tokens_per_second']:.1f} tok/s")
    print(f"Output: {result['output_tokens_per_second']:.1f} tok/s")
    print("Zero duration:", generation_rates({"done": True, "eval_count": 80, "eval_duration": 0})
          ["output_tokens_per_second"])
    print("Missing duration:", generation_rates({"done": True, "eval_count": 80})
          ["output_tokens_per_second"])
    assert result["uncached_prompt_tokens_per_second"] == 2000.0
    assert rate(10 ** 400, 10 ** 400) == 1_000_000_000.0
    for key, value in (
        ("eval_duration", -1),
        ("prompt_eval_cached_count", 1001),
        ("eval_count", 10 ** 400),
    ):
        invalid = dict(example, **{key: value})
        try:
            generation_rates(invalid)
        except ValueError:
            pass
        else:
            raise AssertionError("Invalid timing metric accepted")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Uncached prompt: 2000.0 tok/s
Output: 40.0 tok/s
Zero duration: None
Missing duration: None
```
<!-- leetllm: output:end -->

Run `python3 read-generation-timing.py local-response.json` after the request. JSON `null` means the rate cannot be computed from the reported fields. A missing cached-count field does not justify guessing a cache hit count. Negative counts, inconsistent cache counts, and rates outside finite FP64 range are rejected; integer nanosecond conversion also avoids overflowing an intermediate float when the final ratio is representable.

Those rates describe aggregate generation throughput. Measure **time to first token (TTFT)** and individual token gaps with streaming and client arrival timestamps, stating whether the first thinking/content token or first chunk defines TTFT. Transport buffering can group tokens. Also measure client completion time, queueing, cold versus warm loads, cache reuse, peak memory, and failures under the intended arrival load; concurrency requires representative concurrent workloads.

<figure>
  <img src="illustrations/_generated/timing_receipt_dark.png" alt="A 1,000-token prompt contains 600 cached tokens and 400 newly evaluated tokens. Dividing the 400 uncached tokens by 0.2 seconds gives 2,000 prompt tokens per second; dividing all 1,000 by that duration would incorrectly report 5,000. A separate 80-token output over 2 seconds gives 40 output tokens per second. Client time to first token and individual streaming gaps require separate timestamps." />
  <figcaption>A 1,000-token prompt with 600 KV-cached prefix tokens leaves only 400 uncached tokens for the 0.2 s prompt evaluation clock (2,000 tok/s), while 80 generated tokens over 2.0 s give 40 tok/s. Client first-token time and inter-token latencies require streaming timestamps.</figcaption>
</figure>

## Keep the case identities when comparing quantization

A checkpoint that fits inside 24 GB VRAM can still silently drop structured output formatting under 4-bit quantization. Run baseline BF16 and quantized candidates on identical prompts, templates, and decoding parameters, keeping per-task pass/fail results alongside aggregate accuracy. Repeated trials help separate systematic quantization error from sampling noise.

This comparison illustrates why identical 75% aggregate scores can hide a breaking regression when moving from BF16 to Q4_K_M; run the same paired checks against your quantized model checkpoints before deploying.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="paired-quantization-outcomes.py"
import numpy as np

tasks = np.array(["json_tool_schema", "mmlu_core", "gsm8k_exact", "long_ctx_recall"])
bf16_pass = np.array([True, True, True, False])
q4_km_pass = np.array([False, True, True, True])  # Quantization regression on strict JSON grammar

regressed = sorted(tasks[bf16_pass & ~q4_km_pass].tolist())
improved = sorted(tasks[~bf16_pass & q4_km_pass].tolist())
print(f"BF16 pass rate:   {int(bf16_pass.sum())}/{tasks.size} ({bf16_pass.mean():.0%})")
print(f"Q4_K_M pass rate: {int(q4_km_pass.sum())}/{tasks.size} ({q4_km_pass.mean():.0%})")
print(f"Regressed task checks: {regressed}")
print(f"Improved task checks:  {improved}")
assert regressed == ["json_tool_schema"]
assert improved == ["long_ctx_recall"]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
BF16 pass rate:   3/4 (75%)
Q4_K_M pass rate: 3/4 (75%)
Regressed task checks: ['json_tool_schema']
Improved task checks:  ['long_ctx_recall']
```
<!-- leetllm: output:end -->

Both models score 75%, yet their failure modes differ completely. Under a release threshold that protects strict tool-call JSON conformance, the Q4_K_M candidate fails and requires higher-precision quantization (such as Q6_K or Q8_0) on attention/output projections or grammar-constrained decoding.

<figure>
  <img src="illustrations/_generated/quantization_cases_dark.png" alt="Paired benchmark comparison showing BF16 and Q4_K_M both scoring 3 out of 4 (75%), while Q4_K_M regresses on critical json_tool_schema validation despite improving on long_ctx_recall." />
  <figcaption>BF16 and Q4_K_M both achieve 3 out of 4 (75%), but aggregate scoring conceals a critical JSON tool-schema regression in the quantized model. Track individual task regressions rather than relying on scalar benchmark averages.</figcaption>
</figure>

## Diagnose with competing explanations

| Symptom | Possible causes | A discriminating check |
|---|---|---|
| Startup OOM | Weight/workspace/pool demand, competing allocations, unsupported placement | Failed allocation and backend logs; device free/used memory; actual tensor types |
| Long-input failure | Cache growth/reservation, prefill peak, graph/workspace pool | Hold concurrency fixed while sweeping context and prefill chunk; inspect peak and cache policy |
| Long-context decode slowdown | Attention/cache work, CPU offload, explicit transfer, migration, faults, recomputation | Trace transfers/placement and cache events; correlate major faults, file I/O, swap, and request preemption |
| Slow CPU decode | Bandwidth, NUMA placement, kernel path, thread contention | Thread sweep and locality experiment; use `perf list` to find platform-supported memory-controller counters |
| Equal scores, broken schema | Quantization precision loss, template/chat-format shift, or sampling variance | Inspect paired outputs against strict schema validators and isolate one changed variable |
| Changed outputs after restart | Mutable model tags, runtime version change, cache warmup, or seed variance | Pin GGUF/Safetensors SHA-256 digests, tokenizer config, and runtime flags |
| Server responds but inference fails | Worker backend crashed or VRAM exhausted despite HTTP socket staying open | Run a minimal generation readiness check and inspect backend logs |

A restart does not itself re-pull a Docker image or an Ollama model, though pulling mutable tags like `latest` can swap weights across builds. Pin immutable container digests and local model artifact SHA-256 hashes alongside tokenizer templates, quantization format, context caps, and parallel-slot counts.

Record five measurements for every local serving configuration: weights + KV cache + workspace peak VRAM, CPU/GPU layer placement, uncached prefill vs decode throughput under real concurrency, per-task quantization regressions, and fallback behavior under load.

Separate the model file size from the live bytes that coexist at runtime. A smaller checkpoint helps only when weights, KV cache, workspace, and bandwidth fit the target device's physical memory pool without silently degrading task accuracy.

```mastery-quiz
[
  {
    "question": "A local GPU device budget has 6 GB shared weights, 1.5 GB workspace overhead, and 0.8 GB KV cache per concurrent session. Its planning limit is 12 GB. What is the maximum whole-session concurrency that fits within this budget?",
    "options": [
      "Six sessions, using 12.3 GB.",
      "Four sessions, using 10.7 GB.",
      "Five sessions, using 11.5 GB.",
      "Seven sessions, using 11.6 GB."
    ],
    "answer": "Five sessions, using 11.5 GB.",
    "explanation": "Remaining KV cache headroom is 12 − 6 − 1.5 = 4.5 GB. Taking floor(4.5 / 0.8) gives 5 sessions (11.5 GB total), whereas six sessions would require 12.3 GB and exceed the 12 GB budget."
  },
  {
    "question": "A full-attention KV cache uses 12 layers, 2 KV heads per layer, configured head width 64, separate K/V buffers, and 2-byte scalars. Two concurrent sequences each retain 8,192 tokens. What is its raw cache payload before rounding or metadata?",
    "options": [
      "96 MiB.",
      "48 MiB.",
      "192 MiB.",
      "24 MiB."
    ],
    "answer": "96 MiB.",
    "explanation": "2 × 12 × 2 × 64 × 2 = 6,144 bytes per retained token per sequence. Multiplying by 8,192 tokens and 2 sequences gives 100,663,296 bytes, or 96 MiB."
  },
  {
    "question": "Using the llama.cpp commit 709fe755 layer placement rule, a model has 36 transformer blocks and `-ngl 17` is requested. Before tensor overrides, which blocks are placed on the GPU?",
    "options": [
      "The first 17 blocks on the GPU and the output head on the CPU.",
      "The last 16 blocks on the GPU and the output head on the GPU.",
      "The last 17 blocks on the GPU and the output head on the CPU.",
      "The first 16 blocks on the GPU and the output head on the GPU."
    ],
    "answer": "The last 16 blocks on the GPU and the output head on the GPU.",
    "explanation": "The offload flag reserves one slot for the output head and counts trailing transformer blocks backward from the output, placing blocks 20 through 35 and the output head on GPU while keeping blocks 0 through 19 and the input embeddings on CPU."
  },
  {
    "question": "A decode step reads 8 GB of weights. Device memory provides 400 GB/s and the PCIe host link provides 20 GB/s. Ignoring compute and overlap, how long does the step take when all 8 GB reside in VRAM versus when 6 GB sit in VRAM and 2 GB cross the host link?",
    "options": [
      "20 ms for full VRAM and 100 ms for mixed offload.",
      "20 ms for full VRAM and 115 ms for mixed offload.",
      "15 ms for full VRAM and 115 ms for mixed offload.",
      "15 ms for full VRAM and 100 ms for mixed offload."
    ],
    "answer": "20 ms for full VRAM and 115 ms for mixed offload.",
    "explanation": "Full VRAM reads 8 / 400 = 0.020 s (20 ms). Mixed offload spends 6 / 400 = 15 ms on the VRAM portion plus 2 / 20 = 100 ms on the PCIe leg, totaling 115 ms."
  },
  {
    "question": "Two API timing logs each report 1,400 prompt tokens and 300,000,000 ns of prompt evaluation. Log A reports 500 cached tokens and 90 output tokens in 1,500,000,000 ns of generation. Log B omits the cached-token count. Which row lists A's uncached prompt rate, A's output rate, and B's uncached prompt rate in tok/s?",
    "options": [
      "4,667 / 60 / 4,667",
      "3,000 / 300 / 4,667",
      "3,000 / 60 / unknown",
      "4,667 / 300 / unknown"
    ],
    "answer": "3,000 / 60 / unknown",
    "explanation": "Log A evaluated 1,400 − 500 = 900 uncached tokens in 0.3 s (3,000 tok/s) and generated 90 tokens in 1.5 s (60 tok/s). Log B lacks the cached prefix count, so uncached prompt throughput cannot be derived without assuming zero cache reuse."
  },
  {
    "question": "A 10 GB Q4_K_M GGUF checkpoint is loaded onto a 32 GB Apple Silicon unified-memory machine alongside 8 GB of OS and editor memory pressure. If 4 concurrent 16K prompts reserve 6 GB of KV cache and 2.5 GB of compute workspace, which outcome is most accurate?",
    "options": [
      "No PCIe transfer bottleneck occurs because CPU and GPU share one physical pool, leaving 5.5 GB of free headroom.",
      "Weights must still cross an internal PCIe bridge into Metal VRAM before every decode step.",
      "The Q4_K_M weights double in physical RAM size because CPU and GPU each allocate separate copies.",
      "macOS permanently locks 50% of unified memory away from Metal kernels."
    ],
    "answer": "No PCIe transfer bottleneck occurs because CPU and GPU share one physical pool, leaving 5.5 GB of free headroom.",
    "explanation": "Unified memory eliminates host-to-device copies across PCIe, allowing CPU and Metal compute to read one shared weight and KV pool. Summing 8 + 10 + 6 + 2.5 = 26.5 GB out of 32 GB leaves 5.5 GB before OS compression or Metal working-set pressure."
  },
  {
    "question": "A quantized model has 4 billion parameters stored uniformly at 6 bits, plus 0.2 GB metadata, 0.4 GB multimodal projector, and 0.6 GB draft model weights. What is the loaded-weight subtotal before KV cache and workspace?",
    "options": [
      "4.2 GB.",
      "3.0 GB.",
      "3.6 GB.",
      "4.8 GB."
    ],
    "answer": "4.2 GB.",
    "explanation": "4 billion × 6 / 8 = 3.0 GB for the primary weights. Adding 0.2 + 0.4 + 0.6 GB yields 4.2 GB before KV cache and execution workspace."
  },
  {
    "question": "A 4-channel DDR5 subsystem delivers 6.4 GT/s per channel at 8 bytes per transfer. Each decode step reads 6.4 GB of weights once for a batch of 4 sequences. What is the theoretical aggregate token-rate ceiling from weight bandwidth alone?",
    "options": [
      "204.8 GB/s and 32 steps/s × 1 token/step.",
      "51.2 GB/s and 8 steps/s × 4 tokens/step.",
      "51.2 GB/s and 8 steps/s × 1 token/step.",
      "204.8 GB/s and 32 steps/s × 4 tokens/step."
    ],
    "answer": "204.8 GB/s and 32 steps/s × 4 tokens/step.",
    "explanation": "Four channels yield 4 × 6.4 × 8 = 204.8 GB/s, allowing 204.8 / 6.4 = 32 steps/s. Producing one token per sequence across a batch of 4 reaches 128 aggregate tokens/s before attention bandwidth or compute overhead."
  },
  {
    "question": "A BF16 baseline and a Q4_K_M candidate evaluate six tasks A through F. The baseline passes A, B, and E. The candidate passes A, B, D, and F. Tasks B and C are protected schema checks that must not regress from baseline. Which decision follows?",
    "options": [
      "Candidate passes three tasks; reject it.",
      "Candidate passes four tasks and retains protected task B; promote it.",
      "Candidate passes four tasks but still fails task C; reject it.",
      "Candidate passes three tasks; promote it."
    ],
    "answer": "Candidate passes four tasks and retains protected task B; promote it.",
    "explanation": "The Q4_K_M candidate passes 4 tasks (above the baseline 3), preserves protected check B that previously passed, and only trades unprotected task E (task C failed on BF16 too)."
  },
  {
    "question": "On two identical GPUs serving a model that fits on one GPU, two independent replicas give 700 ms p95 TTFT and 200 aggregate tok/s, while one 2-way tensor-parallel instance gives 900 ms p95 TTFT and 300 tok/s. If the deployment target requires p95 TTFT <= 800 ms and aggregate throughput >= 180 tok/s, which setup meets both targets?",
    "options": [
      "Tensor parallelism, because its higher throughput offsets the TTFT overrun.",
      "Two independent replicas, because tensor parallelism violates the 800 ms TTFT ceiling.",
      "Both setups satisfy every target.",
      "Neither setup, because serving across two GPUs always requires tensor parallelism."
    ],
    "answer": "Two independent replicas, because tensor parallelism violates the 800 ms TTFT ceiling.",
    "explanation": "Two replicas satisfy both 700 <= 800 ms and 200 >= 180 tok/s. Tensor parallelism beats the throughput floor (300 >= 180 tok/s) but exceeds the 800 ms TTFT target (900 > 800 ms)."
  }
]
```

> **Next:** Continue to [SLM Specialization & Edge Deployment](/learn/slm-specialization-edge-deployment). Apply these same memory, quantization, and accuracy measurements when small models run under strict mobile power, thermal, and offline hardware limits.
