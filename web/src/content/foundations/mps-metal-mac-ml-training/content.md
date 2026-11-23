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
  <p>If you train on Linux or Windows with an NVIDIA <span data-glossary="gpu">GPU</span>, start with <a href="/learn/cuda-gpu-computing-for-ml">CUDA for ML Training</a>. If you train on a Mac with Apple silicon, use this matching backend path after that lesson's placement and timing habits.</p>
</div>

You move a classifier to your Mac's GPU, but its first forward pass fails: the model is on `mps` and the batch is still on `cpu`. Doesn't Apple silicon share memory between CPU and GPU? It does, yet shared physical memory and PyTorch device placement are different things.

The previous [CUDA lesson](/learn/cuda-gpu-computing-for-ml) introduced device placement and timing. Both habits transfer from <span data-glossary="cuda">CUDA</span> to the Mac, but the memory picture changes. We keep its four-sequence batch, `(B, T, D) = (4, 8, 16)`, and follow one classifier step through the Mac path: where tensors live, which memory pool they use, whether an operation runs on the accelerator, and when the host has actually waited. Python still runs on the CPU; <span data-glossary="pytorch">PyTorch</span> launches GPU kernels for <span data-glossary="tensor">tensors</span> that live on the selected device.[^appleMetalPytorch2026][^pytorchMpsBackend2026]

## Metal, MPS, and the `mps` device

Start with `model.to("mps")`. The string is one small part of a three-layer stack:

- **Metal:** Apple's GPU programming framework.
- **MPS:** Metal Performance Shaders, Apple's library of optimized GPU operations.
- **`mps`:** the PyTorch device string you pass to tensors and modules.

Metal is Apple's graphics and compute API. For ordinary training, PyTorch maps tensor ops onto MPS Graph and tuned MPS kernels through its <span data-glossary="mps-backend">Metal Performance Shaders (MPS) backend</span>.[^appleMetalPytorch2026][^pytorchMpsBackend2026] The machine's available PyTorch backend determines which device string you can select.

<div data-callout="info" data-callout-title="Backend status">
  <p>Apple's PyTorch setup page still labels the MPS backend beta. Operator coverage changes across PyTorch releases. An available backend means the GPU is reachable, not that every model runs there or runs faster than CPU.[^appleMetalPytorch2026][^pytorchMpsEnvVars2026]</p>
</div>

## One memory pool, two PyTorch devices

With a discrete NVIDIA GPU, host RAM and GPU video memory are separate physical pools, with copies across an interconnect. Apple silicon uses a <span data-glossary="unified-memory">unified memory architecture</span>: CPU and GPU share system memory instead of splitting storage into CPU RAM plus a separate VRAM card.[^mlx2026]

The same `.to(...)` call therefore moves across different hardware paths:

- On a discrete NVIDIA GPU, `tensor.to("cuda")` moves data from host RAM to the GPU's own device memory.
- On Apple silicon, `tensor.to("mps")` doesn't cross a separate RAM-to-VRAM bus. Changing a PyTorch tensor's device still returns a copy, while the CPU and MPS allocations draw from the same physical pool. Apple's MLX has a different array model, so its shared-memory behavior applies to MLX arrays.[^pytorchTensorTo2026][^mlx2026]

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Separate physical pools hold CPU and CUDA copies of the same four-sequence tensor on a discrete GPU. Apple silicon places distinct CPU and MPS copies inside one shared physical pool. Each copy has four rows of eight token positions with sixteen float32 features per position, totaling two KiB." />
  <figcaption>Follow the same <code>(4, 8, 16)</code> tensor through a device-changing copy. Each small cell holds sixteen float32 features. On a discrete-GPU machine, the copy crosses PCIe into VRAM. On Apple silicon, <code>.to("mps")</code> allocates a distinct device buffer within shared DRAM. Both copies occupy storage while the original CPU tensor remains alive. Pool sizes are schematic.</figcaption>
</figure>

Two practical consequences follow:

1. **There isn't a dedicated VRAM budget for the integrated GPU.** The GPU shares physical memory with the CPU, macOS, and other apps. The pool is still limited. Metal reports a recommended GPU working-set size through `torch.mps.recommended_max_memory()`. PyTorch’s high-watermark ratio sets the allocator’s hard limit relative to that recommendation. The GPU can still run out of memory.
2. **Placement is still explicit.** You still write `cpu` and `mps`, keep model and batch on compatible devices, and avoid needless host-visible scalar reads in the hot path.

Assign the returned tensor: `seq_batch = seq_batch.to("mps")`. Calling `seq_batch.to("mps")` and discarding the result leaves `seq_batch` on CPU. By contrast, `model.to("mps")` updates a module's parameters in place. This small API difference often explains the first mixed-device error.

Compare the tiny teaching shape against a realistic classifier step to see where memory pressure starts. The CUDA lesson kept `(4, 8, 16)` small enough for any card because that float32 batch takes only 2 KiB of raw features, whereas a 32-sequence batch with 128 tokens and 768 features makes the input allocation clearly visible:

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

The expected output is 2.0 KiB and 12.0 MiB. That 12.0 MiB is only input features. Training also stores weights, activations, <span data-glossary="gradient">gradients</span>, and temporary workspaces. Some optimizers also keep <span data-glossary="optimizer-state">optimizer state</span> for each parameter. The plain SGD step below uses the default `momentum=0` and keeps no momentum buffers. On a Mac those tensors compete for the same system memory as the rest of the laptop.

## Environment prerequisites on macOS

Apple's setup page lists macOS 14.0 or later, Python 3.10 or later, and Xcode command-line tools for its PyTorch 2.11.0 instructions.[^appleMetalPytorch2026] The [PyTorch 2.15 MPS note](https://docs.pytorch.org/docs/2.15/notes/mps.html) uses macOS 15.0 or later in its availability example. Match the selected PyTorch release to your Python and macOS versions, then use the [PyTorch install selector](https://pytorch.org/get-started/locally/) for that combination.[^pytorchGetStarted2026]

Check the machine before changing model code. If `xcode-select -p` reports missing developer tools, run `xcode-select --install` once.

```bash title="terminal"
xcode-select -p
python3 --version
sw_vers
```

Create a <span data-glossary="virtual-environment">virtual environment</span> so this lesson doesn't replace packages used by another project. Then install the current `torch` wheel:

```bash title="terminal"
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install torch
```

## Runtime availability: is_built() vs. is_available()

When `mps built: True` and `mps available: False` appear together, the PyTorch package was compiled with MPS support even though this machine or OS cannot expose the device at runtime. More broadly, the check distinguishes three states:

1. This PyTorch binary was not built with MPS support.
2. The binary knows about MPS, but this machine or OS can't use it right now.
3. MPS is available, so you can move model and tensors onto `mps`.

PyTorch's MPS note uses that `is_built()` / `is_available()` split. A wheel without MPS support fails the first check. For a wheel with MPS support, the [PyTorch 2.15 example](https://docs.pytorch.org/docs/2.15/notes/mps.html) identifies macOS below 15.0 or a machine without an MPS-capable device as reasons the runtime may be unavailable.[^pytorchMpsBackend2026]

<figure>
  <img src="illustrations/_generated/backend_availability_dark.png" alt="Three MPS availability states: built false and available false selects CPU; built true and available false also selects CPU; both true selects MPS. The first check describes the installed wheel and the second describes access on this machine." />
  <figcaption>Each row describes a possible installation and machine state. The example below selects <code>mps</code> when <code>is_available()</code> is true and otherwise uses <code>cpu</code>. A build with MPS support can still run on a machine where MPS is unavailable.</figcaption>
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

The output shows a Mac where both probes return `True`. When `is_available()` returns `False`, this program selects `cpu`. A wheel built with MPS support can still return `True` for `is_built()` on a machine where MPS is unavailable. The output shape stays `(2, 2)` either way.

- **built = False** means this PyTorch binary lacks MPS support. That's expected off macOS. On a supported Mac, check the wheel and Python architecture.
- **built = True, available = False** usually means the backend exists in the package, but OS, hardware, or runtime access is missing.
- **available = True** means you can use `torch.device("mps")`.

`is_built()` answers "does this wheel even know about MPS?" `is_available()` answers "can this specific machine use it right now?" Keep those two questions separate.

## The same four sequences on `mps`

Reuse the CUDA lesson's batch: four sequences, eight token positions, sixteen features. These randomly generated features stand in for already-encoded text; a tokenizer itself produces token IDs, not sixteen floating-point features per position. Average the eight positions into one <span data-glossary="vector">vector</span> per sequence, then produce three <span data-glossary="logits">logits</span> (unnormalized class scores) per sequence. Labels stay `[0, 2, 1, 0]`.

The shape calculation is `(4, 8, 16)` to `(4, 16)` to `(4, 3)`: `mean(dim=1)` removes the eight-position axis, and `Linear(16, 3)` maps each sixteen-feature vector to three scores. If the batch stays on CPU while the model moves to `mps`, the mean can succeed on CPU; the linear layer is where the incompatible devices meet.

On a Mac training run, one small step usually looks like this:

| Step | CPU side | `mps` side | Why it matters |
|---|---|---|---|
| batch assembly | tokenizer, collator, padding, labels | nothing yet | data still starts on host |
| device move | Python asks for `.to("mps")` | batch becomes an `mps` tensor | placement is explicit |
| forward pass | host launches ops | Metal kernels run the math | most heavy arithmetic lives here |
| loss read | maybe host asks for a scalar | device may need to finish queued work first | logging can stall the loop |
| backward pass | autograd schedules gradient work | gradient kernels run on `mps` | memory now includes activations and grads |
| optimizer step | host calls `step()` | parameter updates happen on `mps` | model stays on device across steps |

Read the table as a debugging trace: for each row, name tensor location, kernel location, synchronization point, and likely failure. The device tag is logical even when physical memory is shared.

Unified memory tempts people into "one laptop, one pool, one device." The hardware shares memory. PyTorch still doesn't. `cpu` and `mps` are separate device targets, and the forward pass still fails if model and batch land on different devices.[^pytorchMpsBackend2026]

The next cell checks those shapes and device agreement. Its fixed seed makes the random example easier to rerun, although exact floating-point draws do not need to match across backends.

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

Continue in the same Python session with one <span data-glossary="optimizer">optimizer</span> step. Cross-entropy compares the three scores with each sequence's target class. `backward()` computes parameter gradients, and `step()` changes the weights using those gradients. We're checking that this path executes, not teaching a useful classifier from four random examples. The [training-loop lesson](/learn/pytorch-training-loops) develops the learning process later.

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

The `.cpu().item()` call sits outside gradient computation. It marks the handoff point where a scalar returns to the host for reporting.

If model and batch devices don't agree, fix placement before hunting deeper bugs. Compare actual parameter and tensor devices, including their indices. An indexless `torch.device("mps")` isn't equal to `torch.device("mps:0")`, even though both can select the Mac GPU. Continue in the same session to catch and repair an unplaced batch:

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

On MPS, the first line is `False` and the second is `True`. On the CPU path, both are `True`: the new batch already matches the model. This check applies to the single-device classifier here, not to intentionally partitioned models.

## One Mac GPU isn't a CUDA cluster

If Activity Monitor shows many Apple GPU cores, should PyTorch expose one device per core? No. `torch.mps.device_count()` reports available MPS devices.[^pytorchMpsApi2026] This lesson uses the default `mps` device, which Apple's verification example prints as `mps:0`.[^appleMetalPytorch2026] GPU core count and PyTorch device count answer different questions.

That differs from a CUDA server with several discrete cards. If a job needs multi-device or multi-node training, verify the target framework and communication backend on that cluster instead of translating CUDA distributed settings onto the Mac. The local MPS path here is for one-device development and smaller training runs.

## Unsupported operations and CPU fallback

Suppose one operation has no MPS implementation. A valid training loop can stop at that line. PyTorch exposes `PYTORCH_ENABLE_MPS_FALLBACK=1` so unsupported MPS operations can run on CPU instead of failing immediately.[^pytorchMpsEnvVars2026] Treat that flag as a temporary compatibility aid, then run the exact workload to verify that each operation has a working CPU path. Set it before the process loads PyTorch.

```bash title="terminal"
PYTORCH_ENABLE_MPS_FALLBACK=1 python train.py
```

Putting `os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"` after `import torch` is often a no-op, because the C++ backend reads that state at initialization.

<div data-callout="warning" data-callout-title="Fallback is a debugging tool">
  <p>Fallback keeps debugging unblocked, but it can hide a CPU detour inside the accelerator path. That detour may add synchronization, device conversion, and copy work even though CPU and GPU share physical memory. If one hot operation keeps falling back, throughput can collapse while the script still looks correct.</p>
</div>

CPU work isn't automatically fallback. <span data-glossary="tokenization">Tokenization</span> and batch assembly normally happen on CPU before `.to("mps")`. MPS fallback means a PyTorch operation on the accelerator path has no MPS implementation and runs on CPU instead.

<figure>
  <img src="illustrations/_generated/mps_backend_decision_dark.png" alt="Two routes through an operation U. A supported U runs between A and B on the MPS lane. With CPU fallback enabled, an unsupported U takes its inputs to a CPU implementation and returns results to MPS before B. The drawing shows execution order without assigning durations." />
  <figcaption>A, U, and B represent operations in order. If U has an MPS implementation, the tensor stays on the upper lane. If U needs CPU fallback, its inputs and results move between devices while the physical memory pool stays shared. Measure the detour on the actual workload.</figcaption>
</figure>

```checkpoint
Your tokenizer runs on CPU before `seq_batch.to("mps")`. Is that MPS fallback?
---
No. CPU-side batch assembly before the device move is normal. MPS fallback happens when an unsupported PyTorch operation on the accelerator path runs on CPU instead of `mps`.
```

Use fallback to identify the blocking operation. Then remove the flag and choose deliberately: rewrite that operation, try a newer supported PyTorch release, keep the full workload on CPU, or accept the measured detour. The question is no longer "does it run?" but "where did the step leave MPS, and is that cost acceptable?"

## Keep precision changes measurable

Check the incoming dtype before blaming an unsupported operation. A NumPy array can arrive as `float64`; `torch.from_numpy` preserves that dtype. In PyTorch 2.14.1, creating a float64 MPS tensor raises `TypeError` with this message: `Cannot convert a MPS Tensor to float64 dtype as the MPS framework doesn't support float64. Please use float32 instead.` The check happens during tensor allocation, so the operator fallback flag doesn't repair it.[^pytorchMpsTensorAllocation2026]

Convert floating-point features deliberately before placing them on MPS, and keep class labels as integers. The next snippet runs on CPU when MPS is unavailable so its dtype arithmetic reproduces identically across machines, and it checks whether `float32` can distinguish the consecutive integers `16_777_216` and `16_777_217`:

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

Float32 can't distinguish these two integers: at $2^{24}$, the next larger representable value is two units away. Casting solves the placement constraint, but it loses information in this example. Normalize large continuous features on CPU when appropriate, or keep a computation that needs float64 on CPU. A dtype accepted by the backend still needs a numerical check for your task.

The examples so far use `float32`. Keep that as the correctness baseline before trying lower precision. Ask what success would mean before changing dtype: finite loss, unchanged evaluation behavior, lower memory, or a faster synchronized step? A blanket `model.half()` changes every floating-point parameter, including operations that may need more range, and makes numerical failures harder to localize.

PyTorch's <span data-glossary="mixed-precision">automatic mixed precision (AMP)</span> API chooses dtypes per operation. Its documentation recommends leaving model and inputs in their normal dtype, wrapping the forward pass and loss with `torch.autocast`, and using <span data-glossary="loss-scaling">gradient scaling</span> when float16 training needs it.[^pytorchAmpDocs2026] The official AMP examples are written for CUDA and CPU. On Mac, ask the installed build whether autocast is available for `mps` before copying a CUDA AMP snippet:

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

On a compatible Mac, this probe tells you whether the installed release enables MPS autocast and which dtype reached the logits. It doesn't prove the full training job is stable. Compare loss curves or evaluation metrics with the float32 baseline, then compare synchronized step time and peak memory. If results become non-finite or accuracy shifts, return to float32 before changing anything else. The later [Mixed Precision Training](/learn/mixed-precision-training-loss-scaling) lesson develops autocast and gradient scaling in depth.

## Time and profile MPS work

The Mac timing trap looks like the CUDA timing trap. In the figure below, the host call returns at 3 ms and the GPU finishes at 35 ms on the same clock. If the timer stops at return, it misses the remaining 32 ms. Warm up the operation first, then synchronize before and after the measured block using `torch.mps.synchronize()`.[^pytorchMpsApi2026]

<figure>
  <img src="illustrations/_generated/host_device_timing_dark.png" alt="Shared time axis from zero to 35 milliseconds. The CPU launches GPU work during the first three milliseconds while MPS continues until 35 milliseconds. A launch-only host timer stops at three; a synchronized host timer includes the wait and stops at 35." />
  <figcaption>The two lanes share a clock: the Python call returns at 3 ms while the GPU finishes at 35 ms from the same start. Synchronizing before stopping the host timer captures the remaining wait, whereas launch-only timing measures only dispatch.</figcaption>
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

Expect `timed matmuls: 10`, `result shape: (256, 256)`, and a measured number of milliseconds per multiplication. That number depends on the Mac, PyTorch build, and other work. The timer includes Python dispatch and, on MPS, the final synchronization. Both inputs are allocated and initialized directly on the selected device before timing starts. Repeat the block and compare several measurements; one tiny run proves nothing about which backend is faster.

The same hidden sync points still matter:

- `loss.item()` when `loss` is an MPS tensor
- `tensor.cpu()`, including `tensor.cpu().numpy()` for NumPy analysis
- printing values that must come back to host memory

Calling `.numpy()` directly on an MPS tensor isn't the route back to NumPy: move the data to CPU first.

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

Check whether the host waited for the device before interpreting a timing result. Compare CPU and MPS on the same Mac, with the same shapes, dtype, warmup, and number of steps. GPU availability confirms access; the timed comparison shows whether a tiny `(4, 8, 16)` step runs faster there.

### When a timer says the step is slow

A synchronized timer tells you **whether** the step is slow. A trace helps explain **where** time went. PyTorch's MPS profiler emits operating-system signposts that Xcode Instruments can record and display.[^pytorchMpsApi2026] Once timing proves a problem, profile the steady-state region rather than the setup path.

After opening Instruments with an OS Signpost or Logging trace, wrap only the steady-state region you want to inspect:

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

Keep `wait_until_completed=False` for a representative trace. Setting it to `True` waits after each encoded operation, which can make individual dispatches easier to inspect but changes the performance you're trying to understand. Look for long gaps between operations, many tiny dispatches, and CPU detours before guessing at a fix.[^pytorchMpsApi2026]

## Memory pressure on Apple GPUs

The first memory lesson is the same as CUDA: weights aren't the whole bill. Activations, gradients, temporary workspaces, and any per-parameter state the optimizer keeps also use memory. If `empty_cache()` releases bytes but the next batch still fails, live tensors or the workload peak are the likely limit, not a stale cache alone.

Unified memory adds one twist. There isn't a separate video-memory pool: a large run competes for system memory with macOS and every other app. PyTorch exposes `current_allocated_memory()` for bytes occupied by live tensors, `driver_allocated_memory()` for total memory allocated by Metal for the process (including cached allocator blocks and MPS/MPSGraph allocations), and `empty_cache()` to release unoccupied cached memory.[^pytorchMpsApi2026] `empty_cache()` doesn't free tensors that are still alive, so it can't repair a workload whose real peak exceeds the limit.

Inspect those counters only after MPS is available:

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

Use the symptom to choose the first experiment, not an allocator knob:

| Symptom | First question | First fix |
|---|---|---|
| OOM on first real batch | Is batch or sequence length too large? | shrink batch size first |
| Step time swings wildly | Are unsupported ops or sync points bouncing work back to CPU? | check fallback and logging paths |
| MPS allocator errors | Are you near working-set limits? | reduce workload before touching allocator env vars |
| macOS starts swapping | Is training competing with other memory-heavy apps? | stop the run, reduce workload, then close unneeded apps |

PyTorch also exposes MPS-specific allocator controls such as `PYTORCH_MPS_HIGH_WATERMARK_RATIO` and `PYTORCH_MPS_LOW_WATERMARK_RATIO`. The documented high-watermark default, 1.7, is a multiple of Metal's recommended working-set size, not 170% of your Mac's installed RAM. The low watermark triggers allocator cleanup and adaptive command-buffer commits; it isn't extra memory.[^pytorchMpsEnvVars2026] These are advanced tuning controls. Disabling the high watermark (`0.0`) can cause system failure under system-wide out-of-memory conditions. Start by shrinking work.

For the larger `(32, 128, 768)` budget, start with the smallest reversible workload change:

1. lower per-step batch size before touching allocator ratios
2. shorten sequence length if the task allows it
3. remove needless `.cpu()` calls before blaming Metal
4. confirm fallback isn't firing inside the hot path

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

> **Memory lever:** Both changes halve <span data-glossary="token">token</span> positions and many activation tensors. Shorter sequences can reduce attention score tensors faster because attention has two sequence axes.

## Diagnose by symptom, not by backend name

An "MPS is slow" report isn't a diagnosis. Start with the smallest failing batch and preserve its shape, dtype, device, and PyTorch version. Those four facts separate placement, operator coverage, precision, timing, and capacity failures that otherwise look identical.

| Observed symptom | Most likely subsystem to check first | Evidence to collect |
|---|---|---|
| `is_built()` or `is_available()` is false | package, hardware, or macOS | both booleans, `torch.__version__`, `sw_vers` |
| forward pass reports mixed devices | placement | model parameter device and every batch tensor device |
| run needs the fallback flag | operator coverage | exact unsupported operator and PyTorch version |
| loss becomes `NaN` after precision change | numerical range | dtype, first non-finite step, float32 baseline |
| host timer looks impossibly fast | asynchronous execution | warmup plus synchronized timing |
| allocator OOMs or macOS swaps | live workload and system pressure | batch shape, both MPS memory counters, open-app pressure |

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

For a final experiment, run the timing example on CPU and MPS without changing its shapes or dtype. Record both measurements, then try a moderately larger matrix (such as $1024 \times 1024$ or $2048 \times 2048$).

A tiny operation can favor CPU because launching GPU work adds overhead. Python dispatch, Metal command encoding, and queue submission all contribute costs; their sizes depend on the operation, backend, and batching. A small matrix multiplication may finish on CPU before the GPU path repays those costs. Measure that crossover on your Mac rather than assigning it a universal matrix size.

For a dense $N \times N$ matrix multiplication, the arithmetic grows as $O(N^3)$. A fixed launch cost becomes a smaller share as the work grows, so the GPU may become faster. Actual dispatch cost and kernel choice aren't guaranteed to stay constant. If MPS lags behind CPU, size is one hypothesis; precision, kernel implementation, memory pressure, and other running work can also explain it. Change one size at a time and compare warmed-up, synchronized measurements.

When a real model behaves differently from this small classifier, keep the diagnosis specific. A mixed-device error calls for placement checks. An unsupported operator calls for a compatibility decision. A slow but correct run calls for synchronized timing and, if needed, an Instruments signpost trace. Unified memory changes where allocations physically reside. It doesn't excuse a mixed-device batch, a hot-path fallback, or a timer that returns before the queue finishes.

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
    "question": "A completed-block timer is slow. You need a representative trace of queued operations and host gaps. Which profiler policy and interpretation fit that question?",
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
    "question": "A process memory ledger has live 28 MiB (input 8+other live 20), unused cache 12 and driver extras 6. Emptying unused cache leaves driver 34. The next activation needs 32 under a 60 MiB budget. Halving only batch halves input and that activation; other live and extras stay fixed. Which peaks follow?",
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
