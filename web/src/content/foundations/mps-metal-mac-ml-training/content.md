---
{
  "id": "mps-metal-mac-ml-training",
  "title": "MPS & Metal for ML on Mac",
  "slug": "mps-metal-mac-ml-training",
  "section": "Computing Foundations",
  "category": "Fine-Tuning & Training",
  "difficulty": "Easy",
  "order": 6,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "Apple",
    "OpenAI",
    "Meta",
    "Anthropic",
    "Google"
  ],
  "shortDescription": "The classifier is on `mps` and the batch is still on `cpu`, even though a Mac shares memory. Placement, fallback, and honest timing explain the failed forward pass.",
  "keyConceptsTested": [
    "Metal vs MPS vs `mps` device",
    "unified memory architecture vs discrete GPU VRAM",
    "PyTorch `is_built()` vs `is_available()`",
    "model and tensor device placement on Mac",
    "CPU fallback for unsupported ops",
    "precision checks on MPS",
    "MPS synchronization and timing",
    "MPS profiling with OS Signposts",
    "Apple GPU memory-pressure debugging basics"
  ],
  "prerequisites": [
    "numpy-and-tensor-shapes",
    "cuda-gpu-computing-for-ml"
  ],
  "relatedQuestions": [
    "cuda-gpu-computing-for-ml",
    "pytorch-training-loops",
    "mixed-precision-training-loss-scaling"
  ]
}
---

<div data-callout="info" data-callout-title="Platform path">
  <p>If you train on Linux or Windows with an NVIDIA <span data-glossary="gpu">GPU</span>, start with <a href="/learn/cuda-gpu-computing-for-ml">CUDA for ML Training</a>. On an Apple silicon Mac, use this lesson to adapt those placement and timing habits to Metal.</p>
</div>

You move a classifier onto your Mac's GPU, run the first forward pass, and hit an immediate mixed-device crash: the model is on `mps`, while the batch is still on `cpu`. Apple silicon shares physical memory between CPU and GPU, so why does PyTorch still refuse to mix them?

Physical memory and PyTorch device placement live at different layers. Keeping the `(B, T, D) = (4, 8, 16)` four-sequence batch from the [CUDA lesson](/learn/cuda-gpu-computing-for-ml), we will trace one training step through Apple silicon: where tensors live, how unified memory changes your budget, what happens when an op falls back to CPU, and how to measure real GPU time instead of Python launch time.[^appleMetalPytorch2026][^pytorchMpsBackend2026]

## Metal, MPS, and the `mps` device

Writing `model.to("mps")` touches three stacked layers:

- **Metal:** Apple's low-level GPU compute and graphics framework.
- **MPS:** Metal Performance Shaders, Apple's library of tuned GPU kernels and MPS Graph operations.
- **`mps`:** the PyTorch device string that routes tensor ops through the <span data-glossary="mps-backend">Metal Performance Shaders (MPS) backend</span>.[^appleMetalPytorch2026][^pytorchMpsBackend2026]

Python still runs on the CPU and enqueues GPU commands asynchronously onto Metal whenever your <span data-glossary="tensor">tensors</span> live on `mps`. Operator coverage on MPS evolves across PyTorch releases, so check availability and measure speed on your target model rather than assuming every op accelerates automatically.[^pytorchMpsEnvVars2026]

## One memory pool, two PyTorch devices

Discrete NVIDIA GPUs separate host RAM from GPU VRAM across PCIe. Apple silicon uses a <span data-glossary="unified-memory">unified memory architecture</span> where CPU and GPU share one physical DRAM pool.[^mlx2026] Even so, `tensor.to("mps")` in PyTorch still allocates a distinct device-backed tensor buffer and copies values into it, so holding both `x` (on `cpu`) and `x.to("mps")` alive occupies twice the storage inside that shared pool.[^pytorchTensorTo2026] (Apple's MLX array framework uses a different unified array model that shares buffers directly across devices.[^mlx2026])

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Separate physical pools hold CPU and CUDA copies of the same four-sequence tensor on a discrete GPU. Apple silicon places distinct CPU and MPS copies inside one shared physical pool. Each copy has four rows of eight token positions with sixteen float32 features per position, totaling two KiB." />
  <figcaption>On a discrete GPU, <code>.to("cuda")</code> copies the <code>(4, 8, 16)</code> tensor across PCIe into separate VRAM. On Apple silicon, <code>.to("mps")</code> allocates a distinct device buffer inside shared DRAM, so both tensors draw from the same pool while alive.</figcaption>
</figure>

> **Common mistake:** `model.to("mps")` mutates module parameters in place, whereas `seq_batch.to("mps")` returns a new tensor and leaves `seq_batch` on `cpu`. Always assign the result: `seq_batch = seq_batch.to("mps")`.

Unified memory also means your training job shares physical RAM with macOS and every open app. Metal reports a recommended GPU working-set limit via `torch.mps.recommended_max_memory()`, and PyTorch caps MPS allocations relative to that limit.

Compare our tiny `(4, 8, 16)` teaching batch (2 KiB) against a realistic `(32, 128, 768)` float32 input batch (12 MiB) to see how quickly allocations grow once activations, <span data-glossary="gradient">gradients</span>, and <span data-glossary="optimizer-state">optimizer state</span> join the inputs:

<!-- leetllm: test, output=show -->

```python title="seq_batch_bytes.py"
tiny = 4 * 8 * 16 * 4
realistic = 32 * 128 * 768 * 4
mib = 1024 ** 2

print(f"CUDA teaching batch (4, 8, 16): {tiny / 1024:.1f} KiB")
print(f"larger step (32, 128, 768): {realistic / mib:.1f} MiB")
print("training also keeps weights, activations, gradients, and any state the optimizer needs")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
CUDA teaching batch (4, 8, 16): 2.0 KiB
larger step (32, 128, 768): 12.0 MiB
training also keeps weights, activations, gradients, and any state the optimizer needs
```
<!-- leetllm: output:end -->

Those 12.0 MiB cover only the raw input tensor; a real step also holds weights, intermediate activations for backprop, gradients, temporary workspaces, and any per-parameter optimizer buffers (plain SGD with `momentum=0` adds none, whereas Adam adds two buffers per parameter).

## Environment prerequisites on macOS

MPS acceleration requires an Apple silicon Mac on a supported macOS release, Python 3.10+, Xcode command-line tools, and a matching `torch` wheel from the [PyTorch install selector](https://pytorch.org/get-started/locally/).[^appleMetalPytorch2026][^pytorchGetStarted2026] Verify your toolchain first (if `xcode-select -p` fails, run `xcode-select --install`), then install `torch` inside a fresh <span data-glossary="virtual-environment">virtual environment</span>:

```bash title="terminal"
xcode-select -p
python3 --version
sw_vers

python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install torch
```

## Runtime availability: is_built() vs. is_available()

PyTorch separates package support from runtime access with two distinct booleans: `is_built()` asks whether this PyTorch binary was compiled with MPS support, while `is_available()` asks whether the current Mac and macOS runtime can expose an MPS device right now.[^pytorchMpsBackend2026]

<figure>
  <img src="illustrations/_generated/backend_availability_dark.png" alt="Three MPS availability states: built false and available false selects CPU; built true and available false also selects CPU; both true selects MPS. The first check describes the installed wheel and the second describes access on this machine." />
  <figcaption><code>is_built()</code> checks the installed PyTorch binary; <code>is_available()</code> checks runtime GPU access on this machine. Select <code>mps</code> only when both are true.</figcaption>
</figure>

<!-- Note: output=show is omitted to prevent device-specific output (e.g. mps built/available status) from being overwritten on non-Mac devices -->
<!-- leetllm: test, deps=torch -->

```python title="mps_sanity_check.py"
import torch

has_mps_backend = hasattr(torch.backends, "mps")
mps_built = bool(has_mps_backend and torch.backends.mps.is_built())
mps_available = bool(has_mps_backend and torch.backends.mps.is_available())

device = torch.device("mps") if mps_available else torch.device("cpu")

x = torch.arange(6, dtype=torch.float32).reshape(2, 3).to(device)
model = torch.nn.Linear(3, 2).to(device)
y = model(x)

print(f"mps built: {mps_built}")
print(f"mps available: {mps_available}")
print(f"selected device: {device}")
print(f"output shape: {tuple(y.shape)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
mps built: True
mps available: True
selected device: mps
output shape: (2, 2)
```
<!-- leetllm: output:end -->

- **`built = False`**: your PyTorch wheel has no MPS backend (expected off macOS; on Mac, check your Python architecture and wheel).
- **`built = True, available = False`**: the wheel supports MPS, but macOS version, hardware, or runtime access blocks it.
- **`available = True`**: safe to place models and tensors on `torch.device("mps")`.

## The same four sequences on `mps`

Take our `(4, 8, 16)` batch of encoded token features, average across the eight token positions with `mean(dim=1)` to get `(4, 16)`, and project through `nn.Linear(16, 3)` into three class <span data-glossary="logits">logits</span> per sequence for labels `[0, 2, 1, 0]`.

| Step | CPU side | `mps` side | Why it matters |
|---|---|---|---|
| Batch assembly | tokenizer, collator, padding | nothing yet | data always starts on host |
| Device move | `.to("mps")` | allocates `mps` buffer | placement is explicit |
| Forward pass | host enqueues ops | Metal kernels compute math | main compute work |
| Loss read | `.item()` asks for scalar | drains queued work first | frequent logging stalls the pipeline |
| Backward pass | autograd schedules grads | Metal gradient kernels | memory adds activations + grads |
| Optimizer step | host calls `step()` | updates weights on `mps` | weights stay on device across steps |

Even with unified memory, `cpu` and `mps` are distinct PyTorch device targets, so forgetting to move `seq_batch` lets `mean(dim=1)` succeed on CPU and then crashes inside `model(seq_vectors)`.[^pytorchMpsBackend2026]

<!-- leetllm: test, deps=torch, output=show, id=mps-seq-lab -->

```python title="mps_device_placement.py"
import torch
import torch.nn as nn

torch.manual_seed(7)
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
model = nn.Linear(16, 3).to(device)
seq_batch = torch.randn(4, 8, 16).to(device)

seq_vectors = seq_batch.mean(dim=1)
logits = model(seq_vectors)
devices_match = next(model.parameters()).device == seq_batch.device == logits.device
print("model and batch agree:", devices_match)
print("sequence vectors:", tuple(seq_vectors.shape))
print("logits shape:", tuple(logits.shape))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
model and batch agree: True
sequence vectors: (4, 16)
logits shape: (4, 3)
```
<!-- leetllm: output:end -->

Now run one <span data-glossary="optimizer">optimizer</span> step in the same session: compute cross-entropy loss, backpropagate gradients, update the weights, and pull the scalar loss back to CPU for logging with `.detach().cpu().item()`.

<!-- leetllm: test, continue=mps-seq-lab, id=mps-trained, output=show -->

```python title="one_mps_seq_step.py"
import torch.nn.functional as F

optimizer = torch.optim.SGD(model.parameters(), lr=0.1)
labels = torch.tensor([0, 2, 1, 0], device=device)
weights_before = model.weight.detach().clone()

optimizer.zero_grad()
loss = F.cross_entropy(model(seq_vectors), labels)
loss.backward()
optimizer.step()
logged_loss = loss.detach().cpu().item()

print("weights changed:", not torch.equal(weights_before, model.weight.detach()))
print("finite loss:", bool(torch.isfinite(loss).item()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
weights changed: True
finite loss: True
```
<!-- leetllm: output:end -->

When comparing devices in assertions, compare against an actual parameter's device (`next(model.parameters()).device`): PyTorch treats indexless `torch.device("mps")` as unequal to `torch.device("mps:0")`, even though both point to the Mac GPU.

<!-- leetllm: test, continue=mps-trained -->

```python title="catch_mps_mismatch.py"
import torch

batch = torch.randn(4, 8, 16)
model_device = next(model.parameters()).device
print("before move:", batch.device == model_device)
batch = batch.to(model_device)
print("after move:", batch.device == model_device)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
before move: False
after move: True
```
<!-- leetllm: output:end -->

On MPS, the fresh CPU batch prints `False` before `.to(model_device)` and `True` afterward.

## One Mac GPU isn't a CUDA cluster

Activity Monitor may report 10, 30, or 76 Apple GPU cores, yet PyTorch exposes the integrated GPU as one `mps` device (`mps:0`), reported by `torch.mps.device_count()`.[^pytorchMpsApi2026][^appleMetalPytorch2026] GPU cores are parallel execution units inside that single device, not separate cluster ranks. Use MPS for local single-device development and small-to-medium runs; configure multi-GPU distributed training directly on your target cluster.

## Unsupported operations and CPU fallback

When a model hits an operation that lacks an MPS kernel, PyTorch raises a runtime error unless you enable CPU fallback before Python imports `torch`:[^pytorchMpsEnvVars2026]

```bash title="terminal"
PYTORCH_ENABLE_MPS_FALLBACK=1 python train.py
```

Setting `os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"` after `import torch` usually has no effect because the C++ backend reads the environment at initialization.

> **Common mistake:** CPU-side <span data-glossary="tokenization">tokenization</span> and batch collation before `.to("mps")` are normal host preprocessing, not MPS fallback. Fallback occurs when an op *inside* the `mps` graph has no Metal implementation and silently detours to CPU mid-step, adding synchronization and conversion overhead that can wreck throughput.

<figure>
  <img src="illustrations/_generated/mps_backend_decision_dark.png" alt="Two routes through an operation U. A supported U runs between A and B on the MPS lane. With CPU fallback enabled, an unsupported U takes its inputs to a CPU implementation and returns results to MPS before B." />
  <figcaption>A supported op <code>U</code> stays on the MPS lane between <code>A</code> and <code>B</code>. With fallback enabled, an unsupported <code>U</code> detours through CPU and converts results back to MPS before <code>B</code> can run.</figcaption>
</figure>

```checkpoint
Your tokenizer runs on CPU before `seq_batch.to("mps")`. Is that MPS fallback?
---
No. CPU-side batch assembly before the device move is normal. MPS fallback happens when an unsupported PyTorch operation on the accelerator path runs on CPU instead of `mps`.
```

Treat fallback as a diagnostic tool: use it to identify the unsupported op, then remove the flag and either rewrite that op, upgrade PyTorch, or measure whether the detour is acceptable.

## Keep precision changes measurable

NumPy arrays default to `float64`, and `torch.from_numpy` preserves that dtype. Because the Metal MPS backend does not support `float64` tensors, placing a `float64` tensor on `mps` raises `TypeError` immediately at allocation time, before operator fallback can ever run.[^pytorchMpsTensorAllocation2026]

Casting to `float32` solves placement, but remember `float32` only has 24 bits of significand precision. Above $2^{24} = 16{,}777{,}216$, consecutive representable floats are spaced by 2, so `16_777_216` and `16_777_217` collapse to the exact same `float32` value:

<!-- leetllm: test, deps=torch,numpy, output=show -->
```python title="mps_input_dtype.py"
import numpy as np
import torch

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
original = torch.from_numpy(np.array([16_777_216, 16_777_217], dtype=np.float64))
placed = original.to(device=device, dtype=torch.float32)
restored = placed.cpu().to(torch.float64)

assert original.dtype == torch.float64
assert placed.dtype == torch.float32
assert restored.tolist() == [16_777_216.0, 16_777_216.0]
print("input dtype:", original.dtype)
print("placed dtype:", placed.dtype)
print("values preserved:", torch.equal(original, restored))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
input dtype: torch.float64
placed dtype: torch.float32
values preserved: False
```
<!-- leetllm: output:end -->

Normalize large continuous features on CPU before casting to `float32`, and keep tasks that truly need `float64` on CPU.

Keep `float32` as your correctness baseline before trying <span data-glossary="mixed-precision">automatic mixed precision (AMP)</span>. Avoid blanket `model.half()`, which downcasts sensitive layers indiscriminately. Instead, probe whether your PyTorch build supports `mps` autocast and wrap only the forward pass and loss (using <span data-glossary="loss-scaling">gradient scaling</span> when `float16` training needs it):[^pytorchAmpDocs2026]

<!-- Note: output=show is omitted because autocast support and output dtype depend on the installed PyTorch release and host -->
<!-- leetllm: test, deps=torch -->

```python title="mps_precision_probe.py"
from contextlib import nullcontext

import torch

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
model = torch.nn.Linear(8, 3).to(device)
features = torch.randn(4, 8, device=device)

use_mps_amp = (
    device.type == "mps"
    and torch.amp.autocast_mode.is_autocast_available("mps")
)
precision_context = (
    torch.autocast(device_type="mps", dtype=torch.float16)
    if use_mps_amp
    else nullcontext()
)

with precision_context:
    logits = model(features)
    loss = logits.square().mean()

print("device:", device.type)
print("MPS autocast enabled:", use_mps_amp)
print("logits dtype:", logits.dtype)
print("finite loss:", bool(torch.isfinite(loss).item()))
```

After confirming finite loss, check that validation accuracy stays within your target tolerance against the `float32` baseline before accepting any speed or memory win. The [Mixed Precision Training](/learn/mixed-precision-training-loss-scaling) lesson explores autocast and loss scaling in detail.

## Time and profile MPS work

MPS execution is asynchronous, just like CUDA. In the timeline below, Python finishes enqueuing work at 3 ms, while the Mac GPU finishes computing at 35 ms. Stopping a host timer right after the Python call measures dispatch alone and misses 32 ms of real work. Always warm up first, then call `torch.mps.synchronize()` immediately before starting and before stopping the clock.[^pytorchMpsApi2026]

<figure>
  <img src="illustrations/_generated/host_device_timing_dark.png" alt="Shared time axis from zero to 35 milliseconds. The CPU launches GPU work during the first three milliseconds while MPS continues until 35 milliseconds. A launch-only host timer stops at three; a synchronized host timer includes the wait and stops at 35." />
  <figcaption>Python returns at 3 ms while Metal finishes at 35 ms. Calling <code>torch.mps.synchronize()</code> before stopping the timer captures the full GPU execution time instead of just launch overhead.</figcaption>
</figure>

<!-- leetllm: test, deps=torch -->

```python title="mps_timing.py"
import time
import torch

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
x = torch.randn(256, 256, device=device)
w = torch.randn(256, 256, device=device)

for _ in range(3):
    y = x @ w
if device.type == "mps":
    torch.mps.synchronize()

start = time.perf_counter()
for _ in range(10):
    y = x @ w
if device.type == "mps":
    torch.mps.synchronize()
elapsed_ms = (time.perf_counter() - start) * 1000

print("timed matmuls:", 10)
print("result shape:", tuple(y.shape))
print(f"{device.type}: {elapsed_ms / 10:.3f} ms per matmul")
```

Watch out for hidden synchronization points inside your training loop: `loss.item()`, `tensor.cpu().numpy()`, or printing an MPS tensor all force the CPU to wait for queued Metal work to drain. To pass a tensor back to Python or NumPy, move it explicitly to CPU outside the gradient graph (for example, once every 50 steps):

<!-- leetllm: test, deps=torch, output=show -->

```python title="mps_logging_handoff.py"
import torch

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
loss = torch.tensor(2.5, device=device)
reported_loss = loss.detach().cpu().item()

print(f"reported loss: {reported_loss:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
reported loss: 2.5
```
<!-- leetllm: output:end -->

### When a timer says the step is slow

A synchronized timer tells you **whether** a step is slow; a trace shows **where** the time went. PyTorch's MPS profiler emits macOS OS Signposts that Xcode Instruments records alongside GPU activity.[^pytorchMpsApi2026] Wrap only the warmed-up steady-state loop and keep `wait_until_completed=False` so profiling preserves realistic queueing rather than serializing every kernel launch:

```python title="profile_mps_step.py"
import torch

if not torch.backends.mps.is_available():
    raise SystemExit("Run this profiler example on an MPS-capable Mac")

x = torch.randn(256, 256, device="mps")
w = torch.randn(256, 256, device="mps")

for _ in range(3):
    y = x @ w
torch.mps.synchronize()

with torch.mps.profiler.profile(
    mode="interval",
    wait_until_completed=False,
):
    for _ in range(10):
        y = x @ w
torch.mps.synchronize()
print("profiled matmuls:", 10)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
profiled matmuls: 10
```
<!-- leetllm: output:end -->

In Instruments, look for wide host gaps between launches, tiny fragmented ops, and CPU fallback detours.

## Memory pressure on Apple GPUs

PyTorch exposes three MPS memory tools: `current_allocated_memory()` reports bytes held by live tensors, `driver_allocated_memory()` reports total Metal memory held for the process (including cached allocator blocks and MPSGraph buffers), and `empty_cache()` releases unused cached blocks back to the system.[^pytorchMpsApi2026] Because `empty_cache()` never frees live tensors, clearing the cache cannot rescue a batch whose true peak exceeds the working-set limit.

<!-- leetllm: test, deps=torch -->

```python title="mps_allocator_check.py"
import torch

if torch.backends.mps.is_available():
    before = torch.mps.current_allocated_memory()
    tensor = torch.ones(1024, 1024, device="mps")
    after = torch.mps.current_allocated_memory()
    del tensor
    torch.mps.empty_cache()
    print("live tensor allocation increased:", after > before)
    print("recommended working-set size reported:", torch.mps.recommended_max_memory() > 0)
else:
    print("MPS allocator counters need an available mps device")
```

When memory pressure hits, shrink the workload before touching allocator environment variables:

1. Halve batch size (cuts input, activation, and gradient memory linearly).
2. Shorten sequence length (cuts attention score memory quadratically).
3. Remove unnecessary `.cpu()` syncs and close competing memory-heavy apps.

<!-- leetllm: test, output=show -->

```python title="mps_workload_reduction.py"
batch_size = 32
sequence_length = 128
baseline_positions = batch_size * sequence_length

for label, batch, tokens in [
    ("baseline", 32, 128),
    ("half batch", 16, 128),
    ("half length", 32, 64),
]:
    share = (batch * tokens) / baseline_positions
    print(f"{label:11s}: {share:.0%} of token positions")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
baseline   : 100% of token positions
half batch : 50% of token positions
half length: 50% of token positions
```
<!-- leetllm: output:end -->

> **Key insight:** Both changes cut linear <span data-glossary="token">token</span> activations in half, while halving sequence length shrinks quadratic $T \times T$ attention score tensors by 4×.

<details>
<summary>Deep dive: MPS allocator watermark variables</summary>

PyTorch exposes `PYTORCH_MPS_HIGH_WATERMARK_RATIO` (default `1.7`) and `PYTORCH_MPS_LOW_WATERMARK_RATIO`.[^pytorchMpsEnvVars2026] The high watermark multiplies Metal's *recommended working-set size* (not total installed RAM) to form the allocator's hard cap; for example, `1.7 × 8 GiB = 13.6 GiB`. The low watermark triggers cache cleanup and adaptive command-buffer commits rather than adding extra memory. Setting the high watermark to `0.0` removes the safety cap and risks system-wide macOS freezes under OOM, so reduce batch or sequence size first.

</details>

## Diagnose by symptom, not by backend name

"MPS is slow" or "MPS crashed" is not a diagnosis. Capture four facts on the smallest failing batch: tensor shape, dtype, device, and PyTorch version.

| Observed symptom | Subsystem to check first | Evidence to collect |
|---|---|---|
| `is_built()` or `is_available()` is false | wheel, hardware, or macOS | both booleans, `torch.__version__`, `sw_vers` |
| Forward pass reports mixed devices | placement | parameter device vs. every input tensor device |
| Run requires fallback flag | operator coverage | exact unsupported op name and PyTorch version |
| Loss becomes `NaN` after dtype change | numerical range | dtype, first non-finite step, `float32` baseline |
| Host timer looks impossibly fast | async execution | warmup + `torch.mps.synchronize()` around clock |
| Allocator OOMs or macOS swaps | live peak + system RAM | batch shape, `current` vs. `driver` memory, open apps |

```checkpoint
You're on an Apple silicon Mac. `torch.backends.mps.is_built()` is `True`, but `torch.backends.mps.is_available()` is `False`. What does that tell you first?
---
PyTorch knows how to speak to the MPS backend, but current machine state still blocks usage. Check macOS version, hardware support, runtime access, and install path before blaming your model code.
```

```checkpoint
Your training loop "works" only with `PYTORCH_ENABLE_MPS_FALLBACK=1`, but step time is awful. What's most likely happening?
---
One or more operations are running through CPU fallback. The script survives, but repeated backend switches, synchronization, or unsupported hot-path ops are erasing GPU gains.
```

## Dispatch overhead and the MPS crossover point

Tiny tensors often run faster on CPU than on MPS. Enqueuing a Metal kernel pays fixed Python dispatch, command-encoding, and queue-submission overhead; a `(4, 8, 16)` classifier step finishes on CPU before the GPU repays that launch cost.

For an $N \times N$ matrix multiply, arithmetic scales as $O(N^3)$, so scaling up to $1024 \times 1024$ or $2048 \times 2048$ amortizes launch overhead and lets the Apple GPU pull cleanly ahead. Measure CPU versus MPS on your own Mac with identical shapes, dtype, warmup, and `torch.mps.synchronize()` calls to find the exact crossover point for your workload.

Unified memory changes where allocations live physically, not how you engineer PyTorch training loops: keep placement explicit, keep unsupported fallbacks out of the hot path, synchronize before stopping timers, and shrink batch or sequence sizes when memory pressure appears.

```mastery-quiz
[
  {
    "question": "A CPU float32 tensor has shape (2, 4, 48). On an available Apple-silicon MPS device, you retain source and placed=source.to(\"mps\"), then keep both alive. Ignoring allocator overhead, which devices and raw-storage accounting follow?",
    "options": [
      "Source mps; placed mps; one 1.5 KiB allocation in the shared pool.",
      "Source cpu; placed mps; one 1.5 KiB allocation shared by both tensor names.",
      "Source cpu; placed mps; two 1.5 KiB allocations drawing from the shared pool.",
      "Source mps; placed cpu; two 1.5 KiB allocations in separate physical pools."
    ],
    "answer": "Source cpu; placed mps; two 1.5 KiB allocations drawing from the shared pool.",
    "explanation": "2×4×48×4=1536 bytes, or 1.5 KiB per tensor. A device-changing Tensor.to returns a distinct placed copy while source remains CPU. Shared physical memory does not alias these two PyTorch allocations; their raw values total 3 KiB while both remain alive."
  },
  {
    "question": "Installation A reports built=False, available=False. Installation B reports built=True, available=False. Neither has created model tensors. Which first diagnosis pair matches those states?",
    "options": [
      "A: wheel lacks MPS support; B: inspect machine, OS and runtime access.",
      "A: unsupported model operator; B: the batch has a mixed-device error.",
      "A: current GPU memory pressure; B: the wheel lacks MPS support.",
      "A: CPU fallback enabled; B: the optimizer has not initialized MPS yet."
    ],
    "answer": "A: wheel lacks MPS support; B: inspect machine, OS and runtime access.",
    "explanation": "is_built describes the installed binary; is_available describes usable runtime access. Neither boolean pair indicates a model-operator, placement, or training-memory failure before those paths run."
  },
  {
    "question": "A placed batch has shape (5, 10, 12) and five integer labels. The model averages positions with mean(dim=1), then applies Linear(12, 4). Which pooled and logits shapes match those operations?",
    "options": [
      "Pooled (10, 12); logits (10, 4).",
      "Pooled (5, 10); logits (5, 4).",
      "Pooled (5, 12); logits (12, 4).",
      "Pooled (5, 12); logits (5, 4)."
    ],
    "answer": "Pooled (5, 12); logits (5, 4).",
    "explanation": "Averaging the ten-position axis preserves the five batch rows and twelve features. The linear layer maps the final feature dimension 12 to 4 classes, leaving five paired label rows."
  },
  {
    "question": "A serial chain uses A=4 ms, B=3 ms. Supported U would take 1 ms. The fallback route adds an outward 2 ms transfer, CPU U=7 ms and a 2 ms return. A separate 5 ms CPU tokenizer runs before the measured chain. Which fallback total and increase over the supported chain follow?",
    "options": [
      "Fallback 13 ms; increase 5 ms.",
      "Fallback 18 ms; increase 10 ms.",
      "Fallback 23 ms; increase 15 ms.",
      "Fallback 14 ms; increase 6 ms."
    ],
    "answer": "Fallback 18 ms; increase 10 ms.",
    "explanation": "The supported chain is 4+1+3=8 ms. The fallback chain is 4+2+7+2+3=18 ms, an increase of 10 ms. The five-ms tokenizer runs outside this measured window; it is ordinary host preparation rather than the unsupported operation’s fallback."
  },
  {
    "question": "Float64 features contain 16,777,220 and 16,777,221. You choose nearest-even float32 before MPS placement. At this magnitude, the float32 grid has spacing 2, and 16,777,220 is the even-significand tie choice. Which resulting pair and fallback conclusion follow?",
    "options": [
      "[16,777,220; 16,777,221]; distinction kept; float64 allocation enabled by fallback.",
      "[16,777,220; 16,777,222]; distinction kept; float64 allocation blocked before fallback.",
      "[16,777,220; 16,777,220]; distinction lost; float64 allocation blocked before fallback.",
      "[16,777,222; 16,777,222]; distinction lost; float64 allocation enabled by fallback."
    ],
    "answer": "[16,777,220; 16,777,220]; distinction lost; float64 allocation blocked before fallback.",
    "explanation": "The second value is exactly halfway between consecutive float32 grid points and rounds to the even value 16,777,220. Both become 16,777,220. Casting produces a supported dtype while losing precision; the MPS double-precision allocation restriction triggers before operator fallback."
  },
  {
    "question": "After warmup and pre-synchronization, you start a host clock at t=0. Dispatch returns at 4 ms; the measured MPS work completes at 22 ms from that same origin. Allocation and placement happened earlier. Which completed-block measurement follows?",
    "options": [
      "4 ms; dispatch included; earlier placement excluded.",
      "22 ms; dispatch included; earlier placement excluded.",
      "26 ms; dispatch included; earlier placement excluded.",
      "22 ms; dispatch included; earlier placement included."
    ],
    "answer": "22 ms; dispatch included; earlier placement excluded.",
    "explanation": "Synchronize before stopping the clock. The completion timestamp is 22 ms from the original start, not 22 additional milliseconds after dispatch. Allocation and placement outside the measured window remain excluded."
  },
  {
    "question": "A completed-block timer is slow. You need a representative trace of queued operations and host gaps. Which profiler configuration and interpretation fit that question?",
    "options": [
      "Warmed repeated workload; wait_until_completed=False; interpret operation intervals and host gaps.",
      "Warmed repeated workload; wait_until_completed=True; interpret inserted waits as normal queueing.",
      "Initialization workload; wait_until_completed=False; interpret setup gaps as steady-state behavior.",
      "Live-memory counter region; wait_until_completed=True; interpret allocated bytes as operation time."
    ],
    "answer": "Warmed repeated workload; wait_until_completed=False; interpret operation intervals and host gaps.",
    "explanation": "The MPS profiler emits OS Signposts for Instruments. Per-operation completion waits change scheduling and performance; they can help inspect dispatches but do not preserve the ordinary queueing pattern. A steady-state trace answers where elapsed time went."
  },
  {
    "question": "A process memory breakdown shows live 28 MiB (input 8+other live 20), unused cache 12 and driver extras 6. Emptying unused cache leaves driver 34. The next activation needs 32 under a 60 MiB budget. Halving only batch halves input and that activation; other live and extras stay fixed. Which peaks follow?",
    "options": [
      "After cache clear 46 MiB; after halving batch 30 MiB.",
      "After cache clear 60 MiB; after halving batch 34 MiB.",
      "After cache clear 66 MiB; after halving batch 50 MiB.",
      "After cache clear 66 MiB; after halving batch 46 MiB."
    ],
    "answer": "After cache clear 66 MiB; after halving batch 46 MiB.",
    "explanation": "After release, the projected peak is 28+6+32=66 MiB, so cache cleanup alone does not fit 60. Half batch gives input 4+other 20+extras 6+activation 16=46 MiB. The change affects the batch-sized live demands, not unrelated retained state."
  },
  {
    "question": "A Mac has installed memory 16 GiB and recommended GPU working set 8 GiB. A high-watermark ratio 1.7 is selected. Which limit and low-watermark role follow from those numbers?",
    "options": [
      "13.6 GiB hard limit; the low watermark triggers cleanup and adaptive commits.",
      "27.2 GiB hard limit; the low watermark reserves additional physical memory.",
      "13.6 GiB live-tensor limit; the low watermark moves existing tensors to CPU.",
      "8 GiB hard limit; the low watermark triggers cleanup and adaptive commits."
    ],
    "answer": "13.6 GiB hard limit; the low watermark triggers cleanup and adaptive commits.",
    "explanation": "The high ratio multiplies the recommended working set: 1.7×8=13.6 GiB, not installed RAM. It limits allowed allocations. The low ratio is a cleanup/commit trigger, not extra capacity or an automatic tensor-device migration."
  },
  {
    "question": "On a validation set, float32 scores 0.960 and float16 autocast scores 0.943. Both losses are finite; the target accuracy threshold is 0.950. The lower-precision run uses less memory and is faster under synchronized timing. Which retention decision matches these observations?",
    "options": [
      "Keep float16; finite loss and improved resources satisfy the quality threshold.",
      "Keep float16; resource savings replace the validation requirement for this run.",
      "Retain float32 as the baseline; the float16 candidate misses the quality threshold.",
      "Reject both dtypes; any measured difference means the float32 baseline is invalid."
    ],
    "answer": "Retain float32 as the baseline; the float16 candidate misses the quality threshold.",
    "explanation": "0.943 falls short of the 0.950 accuracy threshold despite finite loss and resource gains, whereas the float32 baseline clears it. Diagnose the changed path and accept a later optimization only after quality, completed-work timing, and memory criteria all hold."
  }
]
```

> **Next:** Continue to [Data Structures for AI](/learn/data-structures-for-ai-systems). You can now place a training batch on `cuda` or `mps`, time queued kernels honestly, and shrink work when memory pressure shows up. The next lesson leaves the accelerator and asks a host-side question: once those tensors feed real pipelines, which in-memory structures make lookups, queues, caches, and <span data-glossary="top-k">top-k</span> cheap enough to keep the GPU busy.
