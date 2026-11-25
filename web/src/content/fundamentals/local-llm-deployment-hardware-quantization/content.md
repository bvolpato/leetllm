---
{
  "id": "local-llm-deployment-hardware-quantization",
  "title": "Local & Edge LLM Deployment",
  "slug": "local-llm-deployment-hardware-quantization",
  "section": "GPU Systems & LLM Inference",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 8,
  "companies": [
    "Google",
    "Ollama",
    "NVIDIA",
    "Apple",
    "Meta"
  ],
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
    "continuous-batching-request-scheduling",
    "kv-cache-paged-attention-llm-serving"
  ],
  "relatedQuestions": [
    "llm-deployment-gpu-serving-autoscaling",
    "speculative-decoding",
    "llm-cost-engineering-token-economics",
    "continuous-batching-request-scheduling",
    "model-quantization-gptq-awq-gguf"
  ],
  "coverImage": "illustrations/_generated/memory_budget_dark.png",
  "aliases": [
    "slm-specialization-edge-deployment"
  ]
}
---

A 12B `Q4_K_M` checkpoint takes just 7.6 GB on disk, loads cleanly onto a 24 GB discrete GPU, and breezes through a single short prompt. Then four concurrent users send 16,384-token codebases at once and the server crashes with CUDA out-of-memory (OOM). The weight file fit easily; the live execution working set did not.

[Model Quantization](/learn/model-quantization-gptq-awq-gguf) explains how weights shrink to 7.6 GB, and [KV Cache & PagedAttention](/learn/kv-cache-paged-attention-llm-serving) derives how KV bytes grow with context and concurrency. Local and edge deployment adds three physical constraints that cloud worksheets gloss over: **which physical memory pool holds each tensor**, **thermal and battery ceilings on mobile silicon**, and **how hybrid edge-cloud routing decides when a query stays local**.

## Follow the bytes across physical memory pools

Single-stream decode is memory-bandwidth-bound, so placement determines both whether a model fits and how fast it streams:

| Hardware | Physical pool layout | Primary bottleneck to inspect |
|---|---|---|
| **Discrete GPU** | Separate GDDR VRAM (e.g., RTX 4090: 24 GB, 1,008 GB/s[^nvidiaAdaArchitecture2026]) + PCIe-attached host RAM | Layer offload across PCIe; W4A16 on-the-fly dequantization |
| **Apple Silicon** | Unified physical RAM shared by CPU and Metal GPU (M5 Max: 460-614 GB/s up to 128 GB; M5 Ultra: 1.2 TB/s up to 512 GB[^appleMacStudioSpecs2026]) | OS + app contention and Metal working-set limits (MLX runs on CPU/GPU, not ANE[^mlx2026][^mlxUnifiedMemory2026]) |
| **CPU host** | System DDR channels (2-ch DDR5-5600 = 89.6 GB/s; 8-ch = 358.4 GB/s theoretical) | Populated channels, NUMA locality, thread-count saturation |

<figure>
  <img src="illustrations/_generated/memory_pools_dark.png" alt="Three physical layouts show where inference bytes reside. A discrete GPU has separate host RAM and device VRAM joined by an explicit transfer path. Apple CPU and GPU operations share a physical memory pool used by the operating system, other applications, and the model working set. A two-node NUMA sketch distinguishes local from remote memory access and reports theoretical DDR5 channel bandwidth before controller overhead." />
  <figcaption>Discrete GPUs split VRAM from host RAM across PCIe; Apple Silicon shares physical memory across OS, CPU, and Metal GPU; multi-socket CPUs depend on NUMA locality and populated DDR channels.</figcaption>
</figure>

## Budget every coexisting allocation, not just the weight file

For any device pool and request phase, budget every live tensor that coexists at peak:

$$
M_{\text{peak}} \approx M_{\text{weights}} + M_{\text{cache}} + M_{\text{workspace}} + M_{\text{other}}
$$

Watch two traps that blow up local budgets:

1. **Bundled extra tensors:** Gemma 4 12B has 11.95B weights (~5.98 GB at 4 bits), yet Ollama's `gemma4:12b` artifact is **8.0 GB** because it also loads a BF16 multimodal projector and a Q8_0 423M draft model.[^gemma4modelcard2026][^ollamaGemma4Artifact2026] Pin local SHA-256 digests and budget every loaded component.
2. **Sliding-window eviction vs. full-length buffers:** Gemma 4 12B's text backbone combines 40 sliding-window layers (8 KV heads, width 256, 1,024-token window) with 8 full-attention layers (1 KV head, width 512).[^gemma4config2026][^gemma4CacheImplementation2026] Across 4 concurrent 16,384-token sessions in FP16, evicting sliding layers keeps KV at **2.416 GB** (1.342 GB sliding + 1.074 GB full). If a runtime allocates full-length buffers for those 40 sliding layers while masking attention, KV balloons to **22.549 GB** and blows past a 24 GB card!

<figure>
  <img src="illustrations/_generated/cache_retention_dark.png" alt="In this model of a 16,384-token prompt, each tile represents 1,024 positions. The 40 sliding layers retain the final warm key and value tiles; dashed empty earlier tiles are evicted by the modeled window. Eight full-attention layers retain all 16 blue key and value tiles. At four sequences and 16-bit values, capped cache payload is 2.415919104 decimal GB. Full-length sliding buffers use 22.548578304 GB while the attention mask still applies a 1,024-token window." />
  <figcaption>Evicting old tokens in the 40 sliding layers holds 4x16K KV cache to 2.416 GB; keeping full-length buffers expands it to 22.549 GB even though the attention mask still reads only 1,024 tokens.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="local-memory-budget.py"
def kv_bytes(layers, heads, width, tokens, seqs, elem_bytes=2):
    return 2 * layers * heads * width * tokens * seqs * elem_bytes

def gemma_cache_gb(tokens, seqs, evict=True):
    sliding = kv_bytes(40, 8, 256, min(tokens, 1024) if evict else tokens, seqs)
    full = kv_bytes(8, 1, 512, tokens, seqs)
    return (sliding + full) / 1e9

weight_gb, workspace_gb, limit_gb = 7.6, 2.0, 24.0 * 0.80  # 19.2 GB planning cap
for tokens, seqs, evict in ((16384, 4, True), (32768, 4, True), (16384, 8, True), (16384, 4, False)):
    kv = gemma_cache_gb(tokens, seqs, evict)
    total = weight_gb + workspace_gb + kv
    print(f"ctx={tokens:5d} seqs={seqs} evict={str(evict):5s} -> KV={kv:6.3f} GB, total={total:6.3f} GB, fits={total <= limit_gb}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ctx=16384 seqs=4 evict=True  -> KV= 2.416 GB, total=12.016 GB, fits=True
ctx=32768 seqs=4 evict=True  -> KV= 3.490 GB, total=13.090 GB, fits=True
ctx=16384 seqs=8 evict=True  -> KV= 4.832 GB, total=14.432 GB, fits=True
ctx=16384 seqs=4 evict=False -> KV=22.549 GB, total=32.149 GB, fits=False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/memory_budget_dark.png" alt="Four memory layouts share a zero-origin 0 to 36 decimal GB scale. Each includes a 7.6 GB weight proxy and 2.0 GB assumed workspace. Capped-cache totals are 12.016 GB at 16K by 4, 13.090 GB at 32K by 4, and 14.432 GB at 16K by 8. Full-length sliding storage reaches 32.149 GB, above the 19.2 GB planning limit and 24 GB device capacity. These bars model device demand; offload requires an explicit runtime plan." />
  <figcaption>With 7.6 GB weights and 2.0 GB workspace, sliding-window eviction keeps all three long-context workloads inside the 19.2 GB planning limit; keeping full sliding buffers hits 32.149 GB and crashes a 24 GB GPU.</figcaption>
</figure>

## Offload, allocation failure, and the PCIe cliff

When a model exceeds discrete VRAM, runners like `llama.cpp` split layers between GPU and CPU via `-ngl`.[^llamacpp2023] For uniform blocks of size $M_{\text{block}}$ beside fixed non-block memory $M_{\text{fixed}}$, roughly $\lfloor (M_{\text{budget}} - M_{\text{fixed}}) / M_{\text{block}} \rfloor$ blocks fit on GPU (for example, 16 of 32 0.3 GB blocks on an 8 GB card with 3.2 GB fixed usage). Always verify versioned flag semantics in startup logs: in `llama.cpp` commit `709fe755`, `-ngl 24` on a 40-block model places the **last 23 blocks plus the output head** on GPU while keeping input embeddings on CPU.[^llamaCppLayerPlacement2026]

<figure>
  <img src="illustrations/_generated/block_capacity_dark.png" alt="An equal-block model gives each of 32 blocks 0.3 GB: a 16 GB budget with 3.2 GB fixed use fits all 32, while an 8 GB budget fits 16 and leaves 16 for CPU execution. The fixed term already includes the output head. A separate version-pinned llama.cpp row shows 40 transformer blocks, with -ngl 24 selecting the final 23 blocks plus one output slot; the input layer remains on CPU. Actual tensor sizes and backend allocations can differ." />
  <figcaption>Uniform block math estimates GPU capacity, while `llama.cpp` `-ngl 24` reserves one slot for the output head and places the trailing 23 blocks on GPU.</figcaption>
</figure>

Distinguish four distinct memory events when debugging slowdowns or crashes: ordinary `cudaMalloc` failure (`cudaErrorMemoryAllocation`), explicit CPU/GPU offload, managed-memory migration (opt-in, not automatic for `cudaMalloc`[^cudaDeviceAllocation2026][^cudaUnifiedSystemMemory2026]), and host OS page faults (clean `mmap` rereads vs. anonymous swap).

<figure>
  <img src="illustrations/_generated/allocation_paths_dark.png" alt="Four allocation paths produce different outcomes. Ordinary cudaMalloc targets the device pool and can return cudaErrorMemoryAllocation; explicit runtime offload assigns selected layers to CPU or GPU with a chosen transfer path. Supported managed or system memory can migrate or access host pages when platform capabilities allow. Host pressure separates clean file-backed mmap pages that can be reread from anonymous pages that may swap; allocation logs, migration traces, page faults, file I/O, and swap activity distinguish the paths." />
  <figcaption>Device allocation failure, explicit layer offload, managed migration, and host page faults leave distinct telemetry signatures.</figcaption>
</figure>

Streaming even a small slice of weights across PCIe crushes decode latency. Moving just 2 GB of a 7.6 GB model across a 25 GB/s host link adds 80 ms to a 5.6 ms VRAM sweep (an **11.35x** slowdown in serial stream time):

<!-- leetllm: test, output=show -->
```python title="serial-weight-stream.py"
weight_gb, vram_gbs, pcie_gbs, nvme_gbs = 7.6, 1008.0, 25.0, 5.0
for name, sec in (
    ("All 7.6 GB in VRAM", weight_gb / vram_gbs),
    ("5.6 GB VRAM + 2 GB PCIe", 5.6 / vram_gbs + 2.0 / pcie_gbs),
    ("All 7.6 GB over PCIe", weight_gb / pcie_gbs),
    ("All 7.6 GB from NVMe", weight_gb / nvme_gbs),
):
    print(f"{name:24s}: {sec * 1000:7.2f} ms ({1 / sec:6.2f} steps/s)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
All 7.6 GB in VRAM      :    7.54 ms (132.63 steps/s)
5.6 GB VRAM + 2 GB PCIe :   85.56 ms ( 11.69 steps/s)
All 7.6 GB over PCIe    :  304.00 ms (  3.29 steps/s)
All 7.6 GB from NVMe    : 1520.00 ms (  0.66 steps/s)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/transfer_floor_dark.png" alt="A logarithmic time axis compares four serial 7.6 GB weight-stream calculations: 7.54 ms at an advertised 1,008 GB/s device peak; 85.56 ms for 5.6 GB at that peak plus an assumed 2 GB over a 25 GB/s host link; 304 ms over that assumed host link; and 1,520 ms at an assumed 5 GB/s storage rate. The mixed path spends about 80 ms on its 2 GB host segment and is 11.35 times the device-only stream time under these assumptions. The calculations omit compute, attention, unpacking, launch overhead, transfer overlap, and real runtime policy, so these values describe a serial stream-time floor." />
  <figcaption>Offloading just 2 GB across a 25 GB/s PCIe link raises the serial decode floor 11.35x from 7.54 ms to 85.56 ms.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/private_boundary_dark.png" alt="Side-by-side comparison of discrete GPU versus Apple Silicon unified memory for a Q4_K_M GGUF model. On a discrete GPU, offloaded host RAM layers cross PCIe at roughly 25 GB/s to 24 GB VRAM at 1,008 GB/s holding quantized weights and FP16 KV cache before SM register dequantization and Tensor Cores. On Apple Silicon unified memory, OS buffers, Q4 weights, and KV cache share one high-bandwidth 614 to 1,200 GB/s pool accessed directly by Metal GPU compute units without PCIe copies." />
  <figcaption>Discrete GPUs isolate fast VRAM from PCIe host RAM, whereas Apple Silicon lets Metal dequantize GGUF blocks and read KV directly from one shared unified pool alongside OS buffers.</figcaption>
</figure>

## Local runners, SLM architectures, and mobile physical limits

Pick the local runtime for your hardware and concurrency model:

| Runner | Format & target | Engineering watchpoints |
|---|---|---|
| **`llama.cpp` / `llama-server`** | GGUF container[^gguf_spec2026]; CUDA, Metal, Vulkan, CPU | `-ngl` placement; KV cache types `f16`, `bf16`, `q8_0`, `q4_0`[^llamaCppArguments2026] |
| **Ollama** | Modelfile config importing GGUF/Safetensors[^ollama2026import][^ollamagithub2026] | Bind `127.0.0.1`, set `OLLAMA_NO_CLOUD=1`, pin digests, check `/api/ps`[^ollama2026faq][^ollamaRunningModels2026][^ollama2026authentication][^ollama2026openai] |
| **MLX-LM** | Safetensors on Apple unified memory | CPU/GPU unified arrays; verify Metal memory pressure[^mlx2026] |
| **vLLM** | Continuous batching + PagedAttention on GPUs | Compare two single-GPU replicas vs. 2-way TP before adding collectives[^vllm2024] |

### Edge SLMs, thermal throttling, and battery budgets

On phones, laptops, and embedded terminals, architecture design matters as much as quantization. Meta's **MobileLLM** work established four structural levers for sub-billion and compact decoders: **deep-and-thin layers** outperform shallow-and-wide at 125M-350M scale, **embedding tying** reclaims 10-15% of parameters, **immediate block weight sharing** improves cache locality, and **GQA** slashes KV RAM (4x smaller when grouping 16 query heads onto 4 KV heads).[^liu2024mobilellm] Never budget RAM from an "effective parameter" headline alone: Gemma 4 E2B reports 2.3B effective parameters but totals **5.1B stored parameters** including per-layer embeddings.[^gemma4modelcard2026]

Mobile silicon also hits two physical walls that desktop benchmarks miss:

- **Thermal DVFS throttling:** A 10-second cold burst at `23.0 tok/s` can sag to `19.4 tok/s` at 90 seconds and `16.8 tok/s` at 10 minutes as enclosure heat forces clocks down.[^androidThermalAPI2026] Qualify edge SLMs on 10-minute thermal soak tests, not cold bursts.
- **Whole-shift battery energy:** Integrate system power across prefill, decode, and idle:

$$
E_{\text{1K tokens}} = \frac{P_{\text{avg}} \times 1000}{\text{tokens/s} \times 3600}\text{ Wh}
$$

At `3.5 W` and `18 tok/s`, 1,000 tokens consume `54 mWh`. Across an 8-hour shift generating 30,000 tokens (plus 600 s prefill at 4 W and 1.2 W idle), a fast `3.5 W / 18 tok/s` model spends **11.13 Wh** because it races back to idle quickly, whereas a slower, hotter `6 W / 10 tok/s` model burns **14.07 Wh**, leaving almost zero margin on a 15 Wh battery.

### Hybrid edge-cloud routing and safe OTA updates

When edge devices can escalate public queries to the cloud, route on three independent signals rather than raw token probabilities: **calibrated confidence** (mapping entropy and top-2 margin via Platt scaling or isotonic regression), **evidence grounding** (an ungrounded `0.97` answer still must not answer locally), and **whole-payload privacy class** (restricted or offline payloads *never* leave the device; they answer from grounded local context or abstain locally).

<!-- leetllm: test, output=show -->
```python title="calibrated-edge-router.py"
import math

def calibrated_confidence(entropy_bits, margin):
    return 1.0 / (1.0 + math.exp(-(1.1 - 1.6 * entropy_bits + 4.2 * margin)))

def route(conf, grounded, data_class, online, threshold=0.80):
    if grounded and conf >= threshold:
        return "answer_on_device"
    if data_class == "public" and online:
        return "cloud_fallback"
    return "abstain_locally"

for name, ent, margin, grounded, cls, online in (
    ("faq_lookup",        0.35, 0.62, True,  "public",     True),
    ("long_tail_public",  1.40, 0.20, True,  "public",     True),
    ("private_note",      0.90, 0.30, True,  "restricted", True),
    ("ungrounded_answer", 0.30, 0.70, False, "internal",   True),
    ("offline_query",     1.60, 0.15, True,  "public",     False),
):
    p = calibrated_confidence(ent, margin)
    print(f"{name:18s} p={p:.3f} -> {route(p, grounded, cls, online)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
faq_lookup         p=0.959 -> answer_on_device
long_tail_public   p=0.426 -> cloud_fallback
private_note       p=0.715 -> abstain_locally
ungrounded_answer  p=0.972 -> abstain_locally
offline_query      p=0.304 -> abstain_locally
```
<!-- leetllm: output:end -->

To avoid bricking offline devices during weight updates, follow **dual-slot A/B OTA updates**: stream new bundles into inactive Slot B while Slot A stays runnable, verify a signed manifest (Ed25519 signature + SHA-256 digests + monotonic version to block rollbacks), clear incompatible KV caches on switchover, and fall back to Slot A automatically if cold-start smoke tests fail.[^androidABUpdates2026][^tufSpecification2026]

## Measure uncached speed and paired quantization regressions

Server timing APIs (such as Ollama's `/api/generate`[^ollama2026generate][^ollama2026apiusage]) report nanosecond durations alongside total prompt tokens and cached prefix tokens. Subtract cached tokens before computing prefill speed, and measure TTFT and ITL from streaming client timestamps.

<figure>
  <img src="illustrations/_generated/timing_receipt_dark.png" alt="A 1,000-token prompt contains 600 cached tokens and 400 newly evaluated tokens. Dividing the 400 uncached tokens by 0.2 seconds gives 2,000 prompt tokens per second; dividing all 1,000 by that duration would incorrectly report 5,000. A separate 80-token output over 2 seconds gives 40 output tokens per second. Client time to first token and individual streaming gaps require separate timestamps." />
  <figcaption>With 600 of 1,000 prompt tokens served from cache in 0.2 s, uncached prefill speed is 400 / 0.2 = 2,000 tok/s (not 5,000 tok/s). Measure TTFT and ITL separately from streaming client timestamps.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="read-generation-timing.py"
def rate(count, duration_ns):
    if count is None or not duration_ns:
        return None
    return count * 1_000_000_000 / duration_ns

resp = {
    "prompt_eval_count": 1000,
    "prompt_eval_cached_count": 600,
    "prompt_eval_duration": 200_000_000,
    "eval_count": 80,
    "eval_duration": 2_000_000_000,
}
uncached = resp["prompt_eval_count"] - resp["prompt_eval_cached_count"]
print(f"Uncached prompt: {rate(uncached, resp['prompt_eval_duration']):.1f} tok/s")
print(f"Output decode:   {rate(resp['eval_count'], resp['eval_duration']):.1f} tok/s")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Uncached prompt: 2000.0 tok/s
Output decode:   40.0 tok/s
```
<!-- leetllm: output:end -->

> **Common mistake:** Relying on aggregate accuracy when promoting a 4-bit checkpoint. Both BF16 and `Q4_K_M` can score 75% overall while `Q4_K_M` breaks strict JSON tool schemas. Always compare paired per-task outcomes on identical prompts and decoding settings.

<figure>
  <img src="illustrations/_generated/quantization_cases_dark.png" alt="Paired benchmark comparison showing BF16 and Q4_K_M both scoring 3 out of 4 (75%), while Q4_K_M regresses on critical json_tool_schema validation despite improving on long_ctx_recall." />
  <figcaption>Identical 75% aggregate scores hide a critical JSON schema regression in Q4_K_M; track paired per-task outcomes before shipping a quantized artifact.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="paired-quantization-outcomes.py"
import numpy as np

tasks = np.array(["json_tool_schema", "mmlu_core", "gsm8k_exact", "long_ctx_recall"])
bf16_pass = np.array([True, True, True, False])
q4_pass = np.array([False, True, True, True])

print(f"BF16: {bf16_pass.mean():.0%} | Q4_K_M: {q4_pass.mean():.0%}")
print("Regressed:", tasks[bf16_pass & ~q4_pass].tolist())
print("Improved: ", tasks[~bf16_pass & q4_pass].tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
BF16: 75% | Q4_K_M: 75%
Regressed: ['json_tool_schema']
Improved:  ['long_ctx_recall']
```
<!-- leetllm: output:end -->

### Quick diagnosis matrix

| Symptom | Primary suspects | Discriminating check |
|---|---|---|
| Startup OOM | Bundled extra tensors (projector/draft), competing VRAM apps | Inspect backend load logs and exact loaded tensor dtypes |
| Long-context OOM | Uncapped sliding-window buffers or prefill workspace peak | Sweep context at fixed concurrency; check cache retention policy |
| Sudden decode cliff | Partial PCIe offload, host swap/page faults, or DVFS thermal throttling | Check layer placement, PCIe transfer counters, major faults, and 10-min thermal soak |
| Broken JSON at equal score | 4-bit quantization loss or mutable registry tag drift | Run paired schema checks and pin GGUF/container SHA-256 digests |

```mastery-quiz
[
  {
    "question": "A local GPU has a 12 GB planning limit, 6 GB weights, 1.5 GB workspace, and 0.8 GB KV cache per concurrent session. What maximum whole-session concurrency fits?",
    "options": [
      "Six sessions (12.3 GB).",
      "Four sessions (10.7 GB).",
      "Five sessions (11.5 GB).",
      "Seven sessions (11.6 GB)."
    ],
    "answer": "Five sessions (11.5 GB).",
    "explanation": "KV headroom is 12 - 6 - 1.5 = 4.5 GB, so floor(4.5 / 0.8) = 5 sessions (11.5 GB total)."
  },
  {
    "question": "Under the llama.cpp commit 709fe755 rule, a 36-block model runs with `-ngl 17`. Which blocks land on GPU before overrides?",
    "options": [
      "First 17 blocks on GPU, output head on CPU.",
      "Last 16 blocks and output head on GPU.",
      "Last 17 blocks on GPU, output head on CPU.",
      "First 16 blocks and output head on GPU."
    ],
    "answer": "Last 16 blocks and output head on GPU.",
    "explanation": "`-ngl` counts one slot for the output head and assigns trailing blocks backward from the output: blocks 20..35 plus the output head on GPU, blocks 0..19 and input embeddings on CPU."
  },
  {
    "question": "A decode step reads 8 GB of weights with 400 GB/s VRAM and a 20 GB/s PCIe link (ignoring compute/overlap). Compare all 8 GB in VRAM vs. 6 GB in VRAM + 2 GB over PCIe.",
    "options": [
      "20 ms full VRAM vs. 100 ms mixed.",
      "20 ms full VRAM vs. 115 ms mixed.",
      "15 ms full VRAM vs. 115 ms mixed.",
      "15 ms full VRAM vs. 100 ms mixed."
    ],
    "answer": "20 ms full VRAM vs. 115 ms mixed.",
    "explanation": "Full VRAM takes 8/400 = 20 ms. Mixed takes 6/400 = 15 ms plus 2/20 = 100 ms = 115 ms."
  },
  {
    "question": "Log A reports 1,400 prompt tokens (500 cached) in 300 ms and 90 output tokens in 1.5 s. Log B omits cached tokens. What are A's uncached prompt rate, A's decode rate, and B's uncached prompt rate (tok/s)?",
    "options": [
      "4,667 / 60 / 4,667",
      "3,000 / 300 / 4,667",
      "3,000 / 60 / unknown",
      "4,667 / 300 / unknown"
    ],
    "answer": "3,000 / 60 / unknown",
    "explanation": "Log A evaluated 900 uncached tokens in 0.3 s (3,000 tok/s) and decoded 90 tokens in 1.5 s (60 tok/s). Without cached count, B's uncached prompt rate is unknown."
  },
  {
    "question": "An edge device runs a hybrid router (threshold 0.80) on two online requests: a restricted clinical note (grounded, confidence 0.72) and an internal note (ungrounded, confidence 0.97). What should the router do?",
    "options": [
      "Send both to the cloud for a stronger model.",
      "Answer the 0.97 note locally and send the 0.72 note to the cloud.",
      "Abstain locally on both requests.",
      "Answer both locally since both are online."
    ],
    "answer": "Abstain locally on both requests.",
    "explanation": "Restricted/internal payloads never leave the device for cloud fallback, the 0.72 request is below threshold, and the 0.97 request fails the evidence-grounding check."
  }
]
```

> **Next:** Continue to [Model Parallelism for LLM Inference](/learn/model-parallelism-for-llm-inference).
