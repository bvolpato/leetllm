---
{
  "id": "cuda-gpu-computing-for-ml",
  "title": "CUDA for ML Training",
  "slug": "cuda-gpu-computing-for-ml",
  "section": "Training, Fine-Tuning & Alignment",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "order": 4,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "NVIDIA",
    "OpenAI",
    "Meta",
    "Anthropic",
    "Google"
  ],
  "shortDescription": "Four token sequences can have the right shape and still fail: wrong device, a batch that doesn't fit, or a timer that stops before the GPU finishes.",
  "keyConceptsTested": [
    "CPU host vs GPU device roles",
    "kernel, grid, block, thread, warp, and SM hierarchy",
    "host memory vs CUDA device memory",
    "PyTorch, driver, runtime, and toolkit checks",
    "model and batch device placement",
    "asynchronous CUDA execution and synchronization",
    "CUDA OOM and mixed-precision safety",
    "pinned memory and non-blocking transfer",
    "nvidia-smi and allocator counters",
    "coalesced and strided global memory access",
    "shared-memory bank conflicts and padding",
    "arithmetic intensity and Roofline reasoning",
    "occupancy as a performance constraint",
    "APOD profiling and correctness workflow"
  ],
  "prerequisites": [
    "numpy-and-tensor-shapes"
  ],
  "relatedQuestions": [
    "pytorch-training-loops",
    "mixed-precision-training-loss-scaling",
    "distributed-training-fsdp-deepspeed-zero"
  ],
  "aliases": [
    "mps-metal-mac-ml-training"
  ]
}
---

You rent a 24 GB GPU to fine-tune a 7-billion-parameter model. Your quick arithmetic looks safe: 7 billion weights at 2 bytes each is 14 GB. The model loads, the first batch enters, and seconds later the run crashes with `CUDA out of memory`. Your weight math was right, yet it counted less than a quarter of what a training step keeps alive in GPU memory.

An operation can also have the right <span data-glossary="tensor">tensor</span> shape and still fail when its tensors disagree about CPU memory versus GPU memory, or look blazingly fast because a host timer stopped before the GPU finished. <span data-glossary="cuda">CUDA</span> is NVIDIA's platform for parallel execution on NVIDIA GPUs: Python stays on the CPU host while <span data-glossary="pytorch">PyTorch</span> launches <span data-glossary="cuda-kernel">CUDA kernels</span> on the GPU device for operations whose tensors live in device memory.[^cudaProgrammingGuide2026]

<div data-callout="info" data-callout-title="Apple silicon unified memory and PyTorch MPS">
  <p>On an Apple silicon Mac, CPU and GPU share one physical <span data-glossary="unified-memory">unified memory</span> DRAM pool rather than splitting host RAM and discrete VRAM across PCIe.[^mlx2026] That lets a single Mac hold larger local models than many entry-level discrete GPUs, though the pool is shared with macOS and unified DRAM bandwidth sits below datacenter HBM.</p>
  <p>In PyTorch, route tensor ops through Apple's <span data-glossary="mps-backend">Metal Performance Shaders (MPS) backend</span> with <code>model.to("mps")</code> and <code>batch.to("mps")</code> after checking <code>torch.backends.mps.is_available()</code>.[^appleMetalPytorch2026][^pytorchMpsBackend2026] CPU and MPS tensors still cannot mix in one operation, and keeping both copies alive doubles memory use. Three practical quirks matter: Metal lacks <code>float64</code> (cast NumPy arrays to <code>float32</code> first),[^pytorchMpsTensorAllocation2026] unsupported ops fail unless <code>PYTORCH_ENABLE_MPS_FALLBACK=1</code> is set before importing <code>torch</code>,[^pytorchMpsEnvVars2026] and MPS execution is asynchronous just like CUDA, so time steps with <code>torch.mps.synchronize()</code>.</p>
</div>

## CPU host, GPU device, and the CUDA execution hierarchy

A CPU optimizes low-latency branching and control flow; a GPU trades single-thread latency for massive parallel throughput on uniform <span data-glossary="matrix">matrix</span> math. Tiny tensors or copy-heavy loops can run slower on GPU due to launch and transfer overhead. One training step is a relay: the CPU prepares batches and launches kernels; the GPU receives tensors in device memory and executes forward, backward, and optimizer kernels.

Inside a kernel launch, **threads** group into **thread blocks**, and all blocks form a **grid**. CUDA schedules each whole block onto one <span data-glossary="streaming-multiprocessor">streaming multiprocessor (SM)</span> and executes threads in 32-lane **<span data-glossary="cuda-warp">CUDA warps</span>** (SIMT execution, where divergent branches mask inactive lanes).[^cudaProgrammingGuide2026] For a 1D grid of 1D blocks, each thread computes:

$$
\text{global\_id} = \text{block\_id} \times \text{threads\_per\_block} + \text{thread\_id}
$$

Mapping 8 <span data-glossary="token">token</span> positions onto two 4-thread blocks assigns `T0..T3` to block 0 and `T4..T7` to block 1. Because warps never cross block boundaries, each 4-thread block still consumes a 32-lane warp (leaving 28 lanes idle), which is why production kernels choose block sizes that are multiples of 32.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Streaming Multiprocessor execution and warp scheduling. Two 4-thread blocks map to global token positions T0 through T7. In hardware, each block is allocated to a separate 32-lane warp, leaving 28 lanes idle per warp and wasting SIMT execution capacity." />
  <figcaption>Each of the eight token positions gets one global id. Warps never cross block boundaries, so each 4-thread block leaves 28 of 32 lanes unused.</figcaption>
</figure>

When array length is not a multiple of block size (say 10 positions across three 4-thread blocks), tail threads (`10, 11`) must guard memory reads with `if i < positions`. If a block also synchronizes at a shared-memory barrier (`__syncthreads()`), out-of-bounds tail threads must publish neutral values (like `0`) and still reach the barrier rather than returning early, and any reduction mean must divide by the valid count (`positions`), not total launched threads:

<!-- leetllm: test, output=show -->
```python title="guard-the-last-block.py"
positions = 10
threads_per_block = 4
blocks = (positions + threads_per_block - 1) // threads_per_block
visited = []
skipped = []
for block_id in range(blocks):
    for thread_id in range(threads_per_block):
        i = block_id * threads_per_block + thread_id
        if i < positions:
            visited.append(i)
        else:
            skipped.append(i)
assert visited == list(range(positions))
print("blocks:", blocks)
print("guarded indexes:", skipped)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
blocks: 3
guarded indexes: [10, 11]
```
<!-- leetllm: output:end -->

## Check driver, PyTorch build, and device placement

"My CUDA version" mixes distinct stack layers: `nvidia-smi` reports driver visibility and the latest CUDA version the driver supports (CUDA UMD Version, not an installed compiler),[^nvsmi] `torch.version.cuda` reports the CUDA runtime bundled with PyTorch, `torch.cuda.is_available()` checks whether this process can actually reach a GPU, and `nvcc --version` checks an optional local toolkit compiler.[^pytorchGetStarted2026] Remember also that `CUDA_VISIBLE_DEVICES` remaps physical GPU IDs: if physical GPU `5` is the only exposed card, PyTorch names it `cuda:0`.

Moving a `(4, 8, 16)` batch (`sequences, tokens, features`) with `.to(device)` preserves shape while performing a <span data-glossary="host-to-device-transfer">host-to-device (H2D) transfer</span> from CPU RAM to GPU VRAM. Every tensor entering an operation (weights, inputs, and labels) must reside on the same device:

<!-- leetllm: test, deps=torch -->
```python title="one-cuda-training-step.py"
import torch
import torch.nn as nn
import torch.nn.functional as F

torch.manual_seed(7)
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

model = nn.Linear(16, 3).to(device)
optimizer = torch.optim.SGD(model.parameters(), lr=0.1)

cpu_batch = {
    "token_features": torch.randn(4, 8, 16),
    "labels": torch.tensor([0, 2, 1, 0]),
}
batch = {name: tensor.to(device) for name, tensor in cpu_batch.items()}

optimizer.zero_grad()
seq_vectors = batch["token_features"].mean(dim=1)
logits = model(seq_vectors)
loss = F.cross_entropy(logits, batch["labels"])
loss.backward()
assert torch.isfinite(loss).item()
assert all(parameter.grad is not None and torch.isfinite(parameter.grad).all().item()
           for parameter in model.parameters())
optimizer.step()

model_device = next(model.parameters()).device
assert all(tensor.device == model_device for tensor in batch.values())
assert logits.device == loss.device == model_device
assert seq_vectors.shape == (4, 16) and logits.shape == (4, 3)
reported_loss = loss.detach().cpu().item()
print("selected accelerator:", device.type == "cuda")
print("model and batch agree:", model_device == batch["token_features"].device)
print("sequence vectors:", tuple(seq_vectors.shape))
print("logits:", tuple(logits.shape))
print("finite loss:", -float("inf") < reported_loss < float("inf"))
```

## Precision formats and training memory budgets

Why did our 7B model OOM on a 24 GB GPU? Start with floating-point bit layouts. **FP32** uses 4 bytes; **FP16** and **BF16** use 2 bytes and spend them oppositely: BF16 keeps FP32's 8-bit exponent range (`~3.39e38`) with coarser precision, whereas FP16 keeps 10 fraction bits but overflows past `65,504`.[^pytorchTypeInfo2026]

<figure>
  <img src="illustrations/_generated/float_layouts_dark.png" alt="Three rows of bit cells. FP32 has 32 cells: 1 sign, 8 exponent, and 23 fraction, with a largest value near 3.40e38 and a gap of 1.19e-7 above 1.0. BF16 has 16 cells: 1 sign, 8 exponent, and 7 fraction, and its cells line up with the first 16 cells of FP32. Its largest value is near 3.39e38 and its gap above 1.0 is 0.0078. FP16 has 16 cells: 1 sign, 5 exponent, and 10 fraction, with a largest value of 65,504 and a gap of 0.00098." />
  <figcaption>FP16 and BF16 halve storage relative to FP32 in opposite ways: BF16 preserves dynamic range while FP16 preserves finer spacing above 1.0.</figcaption>
</figure>

A training step keeps far more than weights in device VRAM:

$$
\text{training memory} \approx \text{weights} + \text{activations} + \text{gradients} + \text{optimizer state} + \text{temporary workspaces}
$$

**Adam** stores two running statistics per parameter (mean and squared gradient), usually allocated on the *first* `optimizer.step()`.[^pytorchAdamDocs2026] At 16 bytes per parameter in FP32 (`4 B` weights + `4 B` gradients + `8 B` Adam moments), every billion parameters demands a `14.90 GiB` floor *before* activations, temporary workspaces, or allocator overhead (for 7B parameters: `14 GB` serving at FP16 fits on 24 GB, whereas all-FP16 Adam hits `56 GB` and FP32 Adam, or mixed-precision Adam keeping FP16 weights and gradients alongside FP32 master weights and moments, hits `112 GB` before activations!).[^micikevicius2018][^pytorchAmpDocs2026]

<figure>
  <img src="illustrations/_generated/memory_budget_dark.png" alt="Three horizontal bars of gigabytes for a 7 billion parameter model, against a vertical line at a 24 GB GPU. Serving at FP16 needs 14 GB of weights and fits, with room for per-request memory. Training with Adam at FP16 needs 14 GB of weights, 14 GB of gradients, and 28 GB of optimizer averages, 56 GB before activations. Training with Adam and FP32 weights doubles each part to 112 GB before activations." />
  <figcaption>On a 24 GB GPU, 7B FP16 inference fits (14 GB weights), while Adam training requires 4× to 8× the weight footprint before counting a single activation.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/memory_path_dark.png" alt="GPU memory hierarchy alongside the 16-byte FP32 Adam parameter budget. The hierarchy spans registers, shared memory, L2 cache, VRAM, and PCIe host transfers. At one billion parameters, the parameter-related floor requires 14.90 GiB before activations and workspaces." />
  <figcaption>Long-lived training tensors sit in VRAM (HBM); kernels reuse smaller tiles in L2/L1 caches, per-block shared memory, and per-thread registers.</figcaption>
</figure>

Watch two extra memory levers:

1. **Sequence length vs batch size:** A `(B, T, d)` activation scales linearly in both `B` and `T`, whereas eager attention score matrices `(B, H, T, T)` scale quadratically in `T`. Halving `B` halves scores; halving `T` quarters them. PyTorch's `scaled_dot_product_attention` (SDPA) avoids materializing the full $T \times T$ grid on eligible CUDA paths (making activation growth roughly linear in `T`),[^pytorchSdpaDocs2026][^dao2022] unless callers force eager mode (`output_attentions=True` or `need_weights=True`).[^pytorchMhaMasks2026]
2. **Mixed precision vs TF32:** <span data-glossary="mixed-precision">Mixed precision</span> (`torch.autocast("cuda")` + `GradScaler` for FP16) lowers eligible activation dtypes while keeping master parameters in FP32. **TF32** on Ampere+ GPUs keeps tensor storage at full `float32` (`4 B/value`) while reducing internal matmul input precision, so it never halves tensor memory and still requires checking output tolerances (`torch.backends.cuda.matmul.fp32_precision = "ieee"` or `"tf32"`).[^pytorchCudaSemantics2026]

## Coalesced global memory and shared-memory bank conflicts

Two kernels reading the exact same number of `float32` values can sit on opposite sides of memory bandwidth. On compute capability 6.0+ GPUs, warp global loads are serviced in aligned 32-byte segments. When consecutive lanes read adjacent 4-byte words (**coalescing**), 8 lanes share one 32-byte segment (32 lanes share 4 aligned segments, or 5 if unaligned such as starting at byte 80). Reading a column at stride 32 makes every lane touch a separate segment, wasting 7/8 of requested bus bytes.[^cudaBestPractices2026]

Staging tiles in per-block **shared memory** fixes strided global loads, yet shared memory is divided into 32 **banks** (`bank = word_index % 32` for 4-byte words). When distinct words in a warp land on the same bank (such as stride 32, hitting bank 0 for every lane), accesses serialize into bank conflicts. Padding a `32 × 32` tile to `32 × 33` shifts stride from 32 to 33, mapping consecutive lanes across banks `0, 1, 2, ...` with zero conflicts (broadcasting the *same* address to multiple lanes is conflict-free).

<figure>
  <img src="illustrations/_generated/memory_access_order_dark.png" alt="Eight active lanes read aligned 4-byte words. Adjacent global reads request one 32-byte segment, while stride-32 reads request eight segments. Distinct shared-memory addresses at stride 32 map to bank 0 and cause an eight-way conflict; stride-33 padding maps these lanes to independent banks." />
  <figcaption>Adjacent global reads coalesce into one 32-byte segment for 8 lanes; stride-32 global reads touch eight segments and trigger 8-way shared-memory bank conflicts until padded to stride 33.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="trace-segments-and-banks.py"
lanes = range(8)
adjacent_segments = [(lane * 4) // 32 for lane in lanes]
strided_segments = [(lane * 32 * 4) // 32 for lane in lanes]
unpadded_banks = [(lane * 32) % 32 for lane in lanes]
padded_banks = [(lane * 33) % 32 for lane in lanes]

assert len(set(adjacent_segments)) == 1
assert len(set(strided_segments)) == 8
assert len(set(unpadded_banks)) == 1
assert len(set(padded_banks)) == 8
print("adjacent segments:", adjacent_segments)
print("stride-32 segments:", strided_segments)
print("stride-32 banks:", unpadded_banks)
print("stride-33 banks:", padded_banks)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
adjacent segments: [0, 0, 0, 0, 0, 0, 0, 0]
stride-32 segments: [0, 4, 8, 12, 16, 20, 24, 28]
stride-32 banks: [0, 0, 0, 0, 0, 0, 0, 0]
stride-33 banks: [0, 1, 2, 3, 4, 5, 6, 7]
```
<!-- leetllm: output:end -->

## Roofline bounds, occupancy, and profiling tools

To decide whether a kernel is waiting on math or bytes, compute **arithmetic intensity**:

$$
I = \frac{\text{FLOPs}}{\text{bytes moved}}
$$

The **Roofline** ceiling is $\min(\text{compute ceiling},\; \text{bandwidth} \times I)$, using bytes moved at the matching memory level (beyond cache for device HBM).[^williams2009][^nsightCompute2026] On a GPU with 200 GFLOP/s compute ceiling and 60 GB/s bandwidth, intensity `4 FLOPs/byte` gives a bandwidth ceiling of `240 GFLOP/s`, capped at `200 GFLOP/s` (compute-bound); intensity `0.25` gives `15 GFLOP/s` (memory-bound).

**Occupancy** (resident warps divided by SM maximum) helps hide latency, yet 100% occupancy is not a goal on its own: a larger tile that uses more registers or shared memory can lower occupancy while cutting global traffic and winning end-to-end.[^cudaBestPractices2026] Follow NVIDIA's **APOD** loop (Assess, Parallelize/Optimize, Deploy) with the right tool for each question:

| Question | First tool | Evidence to inspect |
|---|---|---|
| CPU-, transfer-, or sync-bound step? | **Nsight Systems** (`nsys`)[^nsightSystems2026] | Host/GPU timelines, H2D copies, streams, idle gaps |
| Single kernel compute- or byte-bound? | **Nsight Compute** (`ncu`)[^nsightCompute2026] | Roofline, SpeedOfLight, bank conflicts, warp stalls |
| Custom kernel memory/race bug? | **Compute Sanitizer**[^computeSanitizer2026] | `memcheck`, `racecheck`, `synccheck` with block/thread context |

## Measure asynchronous work honestly

PyTorch queues CUDA kernels asynchronously and returns to Python immediately.[^pytorchCudaSemantics2026] A naive host timer around a 40 ms GPU forward pass measures only the 2 ms Python enqueue time. To measure real GPU completion, warm up first, then either bracket with `torch.cuda.Event(enable_timing=True)` (measuring the CUDA stream interval) or call `torch.cuda.synchronize()` before starting and stopping `time.perf_counter()` (measuring completed host time, including caller overhead):

<figure>
  <img src="illustrations/_generated/timing_sync_trap_dark.png" alt="Elapsed-time comparison: a naive host timer sees 2 ms of submission, CUDA events span 40 ms on the device stream, and a synchronized host timer includes submission and waiting. Host time does not have to equal device event time." />
  <figcaption>A naive host timer stops at 2 ms of Python enqueueing. CUDA events record the 40 ms stream interval, while a synchronized host timer spans submission plus completion.</figcaption>
</figure>

<!-- leetllm: test, deps=torch>=2.9 -->
```python title="honest-matmul-timing.py"
import time

import torch

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
torch.manual_seed(7)
x_cpu = torch.randn(256, 256, dtype=torch.float32)
x = x_cpu.to(device)
if device.type == "cuda":
    torch.backends.cuda.matmul.fp32_precision = "ieee"

for _ in range(3):
    result = x @ x

if device.type == "cuda":
    torch.cuda.synchronize()
    start = torch.cuda.Event(enable_timing=True)
    end = torch.cuda.Event(enable_timing=True)
    start.record()
    host_start = time.perf_counter()
    for _ in range(10):
        result = x @ x
    enqueue_ms = (time.perf_counter() - host_start) * 1000
    end.record()
    end.synchronize()
    completed_ms = (time.perf_counter() - host_start) * 1000
    elapsed_ms = start.elapsed_time(end)
    print(f"mean host submission: {enqueue_ms / 10:.3f} ms")
    print(f"mean host completion: {completed_ms / 10:.3f} ms")
    print("CUDA matmul precision:", torch.backends.cuda.matmul.fp32_precision)
else:
    start_time = time.perf_counter()
    for _ in range(10):
        result = x @ x
    elapsed_ms = (time.perf_counter() - start_time) * 1000

torch.testing.assert_close(result.cpu(), x_cpu @ x_cpu, rtol=1e-4, atol=1e-4)
print("timing backend:", device.type)
print("PyTorch:", torch.__version__)
print("dtype:", x.dtype)
print("result shape:", tuple(result.shape))
interval = "CUDA stream interval" if device.type == "cuda" else "completed CPU loop"
print(f"mean {interval}: {elapsed_ms / 10:.3f} ms")
print("completed timing is positive:", elapsed_ms > 0)
```

Any line pulling a device value back to CPU (`loss.item()`, `.cpu()`, printing a CUDA tensor) forces an implicit wait; avoid putting it inside hot loops, and remember that a profiler blaming `loss.item()` is usually reporting the GPU work that finished while `loss.item()` waited. When a CUDA error reports on an innocent later line, reproduce once with `CUDA_LAUNCH_BLOCKING=1` to locate the failing kernel, then turn it back off before benchmarking.

## Allocator counters, pinned transfers, and triage

`nvidia-smi` shows device memory including the CUDA context plus PyTorch's caching allocator pool, so it often exceeds live tensor usage.[^nvsmi][^pytorchForumCudaContext2021] Inspect `torch.cuda.memory_allocated()` (live tensors) separately from `torch.cuda.memory_reserved()` (allocator pool). `torch.cuda.empty_cache()` releases unused cached blocks to other processes; it never frees live tensors or gives your own step more capacity.[^pytorchEmptyCache2026]

For transfer-bound pipelines, `DataLoader(..., pin_memory=True)` with `.to(device, non_blocking=True)` accelerates H2D copies using page-locked host memory (avoid mutating a pinned buffer until its async copy completes).[^pytorchPinnedMemory2026]

| Symptom | Likely cause | First check |
|---|---|---|
| `torch.cuda.is_available()` is `False` | Driver, build, or visibility mismatch | Compare `nvidia-smi`, `torch.version.cuda`, `CUDA_VISIBLE_DEVICES` |
| Tensors on different devices error | Model and batch field disagree | Move every input and target tensor to `model` device |
| Model loads, backward/step OOMs | Activations, gradients, or Adam moments exceed VRAM | Budget 16 B/param FP32 Adam floor; lower batch size, then length |
| Host timer reads ~0 ms | Timed enqueue only | Warm up and bracket with CUDA events or `synchronize()` |
| High VRAM bar, low throughput | Allocated memory is not GPU compute | Profile CPU data loading and sync waits with Nsight Systems |
| CUDA error points to wrong line | Asynchronous kernel failure | Reproduce once with `CUDA_LAUNCH_BLOCKING=1` |

```checkpoint
Why can `nvidia-smi` report more GPU memory than `torch.cuda.memory_allocated()`, and does `empty_cache()` free live tensors?
---
PyTorch's caching allocator retains freed blocks inside `memory_reserved()` for fast reuse, and `nvidia-smi` also counts the CUDA context outside PyTorch's allocator. `empty_cache()` only releases unused cached blocks to other processes; it never frees live tensors.
```

```mastery-quiz
[
  {
    "question": "A one-dimensional CUDA kernel assigns one thread per array position, starting at index 0. The caller launches the fewest 8-thread blocks that cover all 19 positions. Which block and local thread own index 18, and how many launched indexes fall outside the array?",
    "options": [
      "Block 2, thread 2; 3 indexes.",
      "Block 1, thread 2; 5 indexes.",
      "Block 2, thread 2; 5 indexes.",
      "Block 2, thread 3; 3 indexes."
    ],
    "answer": "Block 2, thread 2; 5 indexes.",
    "explanation": "Two blocks cover 16 positions, so the caller needs a third block. Block 2 starts at index 16, and its thread 2 owns index 18. The last block has three valid indexes (16 through 18) and five indexes outside the array (19 through 23). Block 1, thread 2 owns index 10. Block 2, thread 3 reaches index 19, the first index past the end."
  },
  {
    "question": "Only physical GPU 5 is exposed, as logical cuda:0 in this process. Trace A has model/features on cuda:0 and labels on CPU. Trace B has model/labels on cuda:0 and features on CPU. Which paired transfers preserve a GPU forward and loss?",
    "options": [
      "A: labels → cuda:0; B: features → cuda:0.",
      "A: labels → cuda:0; B: labels → cuda:0.",
      "A: features → cuda:0; B: features → cuda:0.",
      "A: labels → cuda:5; B: features → cuda:5."
    ],
    "answer": "A: labels → cuda:0; B: features → cuda:0.",
    "explanation": "In trace A, move the labels to cuda:0 so the loss can use them with the logits. Moving the features there again leaves the labels on the CPU. In trace B, move the features to cuda:0 so the model can use them in the forward pass. Moving the labels there again leaves the features on the CPU. Both transfers use cuda:0 because this process sees physical GPU 5 as its first and only device. A transfer to cuda:5 would fail."
  },
  {
    "question": "A float32 tensor has shape (7, 11, 20) in (sequences, tokens, features) order. A classifier averages the tokens into one vector per sequence and applies Linear(20, 5). What are the shapes of the pooled tensor and the logits, and how many bytes do the input values occupy?",
    "options": [
      "(11, 20), (11, 5); 6,160 bytes.",
      "(7, 20), (7, 5); 1,540 bytes.",
      "(7, 11), (7, 5); 6,160 bytes.",
      "(7, 20), (7, 5); 6,160 bytes."
    ],
    "answer": "(7, 20), (7, 5); 6,160 bytes.",
    "explanation": "Averaging the 11 tokens leaves 20 features for each of 7 sequences. The pooled shape is (7, 20), and the layer produces 5 logits per sequence, giving (7, 5). A pooled shape of (11, 20) would average across sequences. A shape of (7, 11) would average across features and leave only 11 inputs for a layer that needs 20. The input contains 7 × 11 × 20 = 1,540 values. Each float32 value takes 4 bytes, so the input occupies 6,160 bytes."
  },
  {
    "question": "A float32 tensor contains 1,000,000 values. An eligible operation changes from IEEE FP32 arithmetic to TF32 while the tensor dtype stays float32. Which storage count and required validation fit?",
    "options": [
      "2,000,000 bytes; output tolerance needs validation.",
      "4,000,000 bytes; output tolerance needs validation.",
      "4,000,000 bytes; unchanged dtype settles accuracy.",
      "2,000,000 bytes; unchanged dtype settles accuracy."
    ],
    "answer": "4,000,000 bytes; output tolerance needs validation.",
    "explanation": "TF32 changes eligible internal arithmetic, not this tensor’s float32 storage, so it remains 4 million bytes. Reduced internal input precision can change numerical results, so matching storage dtype still requires output tolerance checks."
  },
  {
    "question": "A model has 300 million parameters. Count 4 bytes of weights, 4 of gradients and 8 of Adam moments per parameter. The device has 6 GiB. What conclusion follows before activations and workspaces?",
    "options": [
      "The floor is 2.24 GiB; the full step fits the 6 GiB device.",
      "The floor is 4.47 GiB; the full step fits the 6 GiB device.",
      "The floor is 2.24 GiB; finish budgeting other live state.",
      "The floor is 4.47 GiB; finish budgeting other live state."
    ],
    "answer": "The floor is 4.47 GiB; finish budgeting other live state.",
    "explanation": "The count is 300 million×16=4.8 billion bytes, or about 4.47 GiB. That floor is below 6 GiB, but activations, workspaces, allocator overhead and any extra copies still need room. A fitting parameter total leaves the rest of the step unbudgeted."
  },
  {
    "question": "In one load, the 32 lanes of a warp read consecutive 4-byte global words starting at byte address 112, one word per lane. In a separate load, the same lanes read shared words starting at word 1 with a stride of 38 words. Use the standard 32-bank layout for 4-byte words, with word 0 in bank 0. How many aligned 32-byte global segments does the warp touch, and how do the shared words map to banks?",
    "options": [
      "5 segments, 16 odd-numbered banks with 2 words each.",
      "4 segments, 16 odd-numbered banks with 2 words each.",
      "5 segments, all 32 banks with 1 word each.",
      "5 segments, 16 even-numbered banks with 2 words each."
    ],
    "answer": "5 segments, 16 odd-numbered banks with 2 words each.",
    "explanation": "The global load spans bytes 112 through 239. It starts halfway through segment 3 and ends in segment 7, touching 5 segments. Counting 128 bytes as 4 full segments misses the offset. In shared memory, a stride of 38 advances 6 banks on each step because bank numbers wrap at 32. Starting at bank 1 keeps every request in an odd-numbered bank. The first 16 lanes visit all 16 odd banks, then the pattern repeats with different words. Each used bank serves two distinct words. The even-bank answer assumes a start at word 0. Using all 32 banks would require a stride that also reaches even banks."
  },
  {
    "question": "A block launches 8 threads for the 6 input values [5, 1, 4, 2, 8, 0]. Shared memory has one slot per thread. After the block barrier, thread 0 sums all 8 slots. How should the two tail threads handle their slots, and what mean should the block return for the input?",
    "options": [
      "Invalid lanes return before the barrier; mean 20/8.",
      "Invalid lanes publish zero and join the barrier; mean 20/8.",
      "Invalid lanes publish zero and join the barrier; mean 20/6.",
      "Invalid lanes return before the barrier; mean 20/6."
    ],
    "answer": "Invalid lanes publish zero and join the barrier; mean 20/6.",
    "explanation": "The guard prevents the two invalid array reads. They publish neutral zeros while still reaching the required barrier. The six real values sum 20, and their mean uses six valid values rather than eight launched workers. Returning early can break the synchronization barrier."
  },
  {
    "question": "A warmed modeled run records a CUDA start event at 5 ms and end event at 23 ms. Its host timer starts at 4 ms and stops after the scalar is ready at 24 ms. Which event interval and completed host interval are being reported?",
    "options": [
      "18 ms and 19 ms.",
      "18 ms and 20 ms.",
      "20 ms and 18 ms.",
      "23 ms and 24 ms."
    ],
    "answer": "18 ms and 20 ms.",
    "explanation": "Event time is 23−5=18 ms; the completed host interval is 24−4=20 ms. These use different origins and include different overhead and waits. Reading a timestamp as a duration or subtracting the event origin from the host endpoint mixes incompatible timing scopes."
  },
  {
    "question": "Suppose an allocator model has 5 GiB live tensors, 2 GiB unused cache and 1 GiB context outside the allocator. Assume no other memory. After all unused cache is released, what are allocated, reserved and driver-visible modeled totals?",
    "options": [
      "5 GiB, 5 GiB, 6 GiB.",
      "3 GiB, 5 GiB, 6 GiB.",
      "5 GiB, 7 GiB, 8 GiB.",
      "5 GiB, 6 GiB, 7 GiB."
    ],
    "answer": "5 GiB, 5 GiB, 6 GiB.",
    "explanation": "Live tensors remain 5 GiB. Releasing the two unused cached GiB makes reserved 5 GiB, and the separate 1 GiB context makes the modeled driver total 6 GiB. This simplified breakdown is not a general equation equating actual nvidia-smi and allocator counters."
  },
  {
    "question": "Suppose a kernel performs 3,000 FLOPs and moves 500 bytes beyond cache. At the same memory level, bandwidth is 50 GB/s and the compute ceiling is 250 GFLOP/s. A larger tile lowers occupancy but reduces those bytes further. Which bound and conclusion follow?",
    "options": [
      "The bound is 300 GFLOP/s; compare occupancy alone to choose.",
      "The bound is 250 GFLOP/s; compare occupancy alone to choose.",
      "The bound is 300 GFLOP/s; compare output and whole-step time.",
      "The bound is 250 GFLOP/s; compare output and whole-step time."
    ],
    "answer": "The bound is 250 GFLOP/s; compare output and whole-step time.",
    "explanation": "Intensity is 3000/500=6 FLOPs/byte, giving a bandwidth ceiling 300 GFLOP/s. The minimum with compute 250 is 250 GFLOP/s. Once at the compute ceiling, fewer bytes do not raise this bound. Lower occupancy alone does not determine performance; compare correctness and measured whole-step results."
  }
]
```

> **Next:** Continue to [Mixed Precision Training](/learn/mixed-precision-training-loss-scaling).
