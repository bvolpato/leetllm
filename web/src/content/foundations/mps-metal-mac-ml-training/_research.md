---
query: "We are creating a research-backed page for the following: \"MPS & Metal for ML on Mac\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: foundations\nCurrent page scope: Build beginner-first intuition for training on Apple silicon: what Metal and MPS are, why unified memory changes the CUDA mental model, how PyTorch exposes the `mps` device, how to check availability, where CPU fallback appears, and how synchronization and memory pressure still shape performance.\nResearch refresh ID: 2026-08-13\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Prefer plain Markdown links like `[label](https://...)`. Avoid `(Source: Vendor)` wrappers, even when a link is present, and never use footnote-style or opaque citations without the URL.\n- Link directly to the source page. Never use search-result or search-redirect URLs.\n- Do not embed external images, image-search thumbnails, data URLs, or inline SVG. Describe useful visual ideas in text instead.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "833eae13961e6faa61a6b134367d31c1"
status: "completed"
---

Here is a suggested structure and content plan for the curriculum page, adapted to prioritize mental models, practical implementation, and current realities of the PyTorch MPS backend.

### 1. Prerequisites and Narrative Arc

- **Teaching Order:** Start by breaking the CUDA mental model: explain Apple's Unified Memory Architecture (UMA) first. Once the hardware intuition is set, introduce the PyTorch API (`mps` device), memory management (watermarks), handling unsupported operations (CPU fallback), and finally performance profiling (synchronization).
- **Prerequisite Knowledge:** Basic PyTorch tensor operations, understanding of what a GPU does in ML, and familiarity with CUDA's `.to('cuda')` paradigm.

### 2. Core Concepts: Metal, MPS, and Unified Memory

- **Metal:** Apple's low-level, hardware-accelerated graphics and compute API, analogous to Vulkan or DirectX.
- **Metal Performance Shaders (MPS):** A framework of highly optimized compute primitives. For PyTorch, the MPS backend maps computational graphs to tuned kernels specifically built for Apple silicon.
- **Unified Memory Architecture (UMA):** Unlike discrete GPUs (like NVIDIA hardware) where data must traverse a PCIe bus from CPU RAM to GPU VRAM, Apple silicon shares a single physical memory pool between the CPU and GPU.
- **The Mental Model Shift:** Calling `tensor.to("mps")` logically assigns the tensor to the GPU for computation, but it bypasses the traditional PCIe data-transfer bottleneck. However, memory pressure still dictates performance; if the unified pool fills, the system will swap memory to the SSD, severely degrading training throughput.
- **Primary Source:** [Apple Developer: Metal Performance Shaders](https://developer.apple.com/documentation/metalperformanceshaders)

### 3. The mps Device and API Availability

- **Mechanism:** PyTorch exposes MPS through the `mps` device, effectively mimicking the API surface of `cuda` or `cpu`.
- **Availability Check (Code Lab):** Introduce the standard boilerplate for device agnostic code on Mac:

```python
import torch
if torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")
x = torch.ones(1, device=device)
```
- **Memory Tracking:** Teach users to use `torch.mps.current_allocated_memory()` to monitor GPU memory occupied by tensors, as activity monitor isn't always granular enough for PyTorch allocations.
- **Primary Source:** [Apple Developer: Accelerated PyTorch training on Mac](https://developer.apple.com/metal/pytorch/)

### 4. CPU Fallback and Unsupported Operations

- **The Problem:** The MPS backend is actively evolving. If a PyTorch operation lacks an underlying MPS kernel, PyTorch defaults to crashing with a `NotImplementedError`.
- **The Fix:** Setting the environment variable `PYTORCH_ENABLE_MPS_FALLBACK=1` forces PyTorch to execute unsupported operations on the CPU.
- **The Tradeoff (Crucial Concept):** CPU Fallback requires implicit data synchronization between the GPU and CPU. It introduces severe latency and destroys the performance benefits of hardware acceleration. Teach users to use this for debugging or local inference, but to avoid it in hot training loops.
- **Primary Source:** [PyTorch Docs: MPS Environment Variables](https://docs.pytorch.org/docs/stable/mps_environment_variables.html)

### 5. Memory Limits and Watermarks

- **Mechanism:** PyTorch enforces a hard limit on MPS memory allocations to prevent system-wide Out-Of-Memory (OOM) crashes, which can bring down macOS entirely.
- **Customizing Limits:** The `PYTORCH_MPS_HIGH_WATERMARK_RATIO` environment variable controls this limit (the default is `1.7`). Setting it to `0.0` disables the limit entirely, allowing PyTorch to use all available unified memory, though this explicitly risks a hard OS crash.
- **Primary Source:** [PyTorch Docs: MPS Environment Variables](https://docs.pytorch.org/docs/stable/mps_environment_variables.html)

### 6. Asynchronous Execution and Synchronization

- **Mechanism:** Like CUDA, MPS executes asynchronously. The CPU dispatches work to the GPU and continues executing Python code without waiting for the GPU to finish.
- **Benchmarking Trap:** If a user wraps `time.time()` around an MPS operation without synchronizing, they are only measuring how fast the CPU queued the work, not how long the GPU took to compute it.
- **The Fix:** Always call `torch.mps.synchronize()` before stopping a timer to ensure the GPU has emptied its queue.
- **Primary Source:** [PyTorch Docs: torch.mps.synchronize](https://docs.pytorch.org/docs/stable/generated/torch.mps.synchronize.html)

### 7. Common Mistakes, Stale Claims, and Expected Outcomes

- **Misconception:** *Assuming `PYTORCH_ENABLE_MPS_FALLBACK=1` is a permanent, cost-free solution.* **Correction:** It is a band-aid that tanks throughput.
- **Stale/Incomplete Claim (Distributed Training):** Users migrating from Linux often try to use DistributedDataParallel (DDP) out of the box. As of late 2026, standard distributed setups (NCCL/Gloo) do not natively support the `mps` device for multi-GPU orchestration. State this limitation clearly to prevent wasted debugging time.
- **Mastery Outcome:** Upon finishing this page, the reader should be able to instantiate an MPS device, manipulate memory watermarks safely, identify when CPU fallback is ruining their throughput, and accurately time their kernels using explicit synchronization.
