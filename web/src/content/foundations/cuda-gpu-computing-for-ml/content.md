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
<!-- leetllm: edition:reference:start -->

The [NumPy lesson](/learn/numpy-and-tensor-shapes) tracked what each tensor axis means: examples, token positions, and features. Reuse that shape reasoning for a small sequence classifier: four sequences, eight token positions, and 16 embedding features give shape `(4, 8, 16)`. The model pools each sequence's tokens and predicts three class scores.

That same tensor also has to live somewhere. An operation can have the right shape and still fail when its <span data-glossary="tensor">tensors</span> disagree about CPU memory versus GPU memory. The same four sequences can be indexed correctly and still sit in the wrong memory, exhaust the device, or look fast because the timer stopped before the GPU finished.

<span data-glossary="cuda">CUDA</span> is NVIDIA's platform and programming model for running parallel work on NVIDIA GPUs. It doesn't turn every Python line into GPU code. Python still runs on the CPU, while <span data-glossary="pytorch">PyTorch</span> launches GPU functions called <span data-glossary="cuda-kernel">CUDA kernels</span> for tensor operations whose data lives on a CUDA device.[^cudaProgrammingGuide2026]

<div data-callout="info" data-callout-title="Apple silicon unified memory and PyTorch MPS">
  <p>On an Apple silicon Mac, CPU and GPU share one physical <span data-glossary="unified-memory">unified memory</span> DRAM pool rather than splitting host RAM and discrete VRAM across PCIe.[^mlx2026] Eliminating the PCIe copy bottleneck lets a single Mac hold larger local models than many entry-level discrete GPUs, though the pool is shared with macOS and active apps (capped by Metal's recommended working-set limit) and unified DRAM bandwidth is typically lower than datacenter HBM, making Apple silicon ideal for local prototyping and small-to-medium runs rather than cluster-scale throughput.</p>
  <p>In PyTorch, route tensor ops through Apple's <span data-glossary="mps-backend">Metal Performance Shaders (MPS) backend</span> with <code>model.to("mps")</code> and <code>batch.to("mps")</code> after checking <code>torch.backends.mps.is_available()</code>.[^appleMetalPytorch2026][^pytorchMpsBackend2026] Even on shared physical DRAM, PyTorch allocates a distinct device buffer for <code>mps</code> tensors, so CPU and MPS tensors cannot mix in one operation and keeping both copies alive doubles memory use. Watch three practical caveats: Metal lacks <code>float64</code> support (casting NumPy <code>float64</code> arrays to <code>float32</code> avoids an immediate allocation <code>TypeError</code>),[^pytorchMpsTensorAllocation2026] unsupported ops fail unless <code>PYTORCH_ENABLE_MPS_FALLBACK=1</code> is set before importing <code>torch</code> (which detours those ops to CPU with synchronization overhead),[^pytorchMpsEnvVars2026] and MPS execution is asynchronous just like CUDA, so time steps with <code>torch.mps.synchronize()</code>.</p>
</div>

## Eight tokens onto two blocks

Would the four-sequence miniature automatically run faster on a GPU? Not necessarily. A GPU earns its keep when many items perform similar arithmetic; a tiny tensor, branch-heavy Python loop, or copy on every line can lose to launch and transfer overhead.

A CPU is tuned for low-latency control flow and varied work. A GPU is tuned for high throughput. Large <span data-glossary="matrix">matrix</span> multiplications, convolutions, and attention scores usually offer enough parallel arithmetic to justify the handoff.

| Part of a training step | CPU host job | GPU device job |
|---|---|---|
| data preparation | read, tokenize, pad, and assemble a batch | no work yet |
| device transfer | request a copy | receive tensor data in device memory |
| forward and backward | launch PyTorch operations | execute tensor kernels |
| reporting | request a Python number or file write | finish and return needed values |

The CPU prepares and launches; the GPU executes. Inside one kernel launch, a **thread** handles one logical slice of work. Threads are grouped into **thread blocks**, and all blocks for one kernel form a **grid**. CUDA schedules each whole block onto one <span data-glossary="streaming-multiprocessor">streaming multiprocessor (SM)</span>, a hardware processor inside the GPU. Several blocks may be active on one SM, and CUDA doesn't promise which block runs first.[^cudaProgrammingGuide2026]

Use the eight <span data-glossary="token">token</span> positions of the first sequence, not all four sequences and not every feature. Two blocks with four threads each make the indexing concrete. For a one-dimensional grid of one-dimensional blocks, each thread computes a unique global index:

$$
\text{global\_id} = \text{block\_id} \times \text{threads\_per\_block} + \text{thread\_id}
$$

For block `1`, thread `2`, the global index is `1 × 4 + 2 = 6`, so that thread handles token position `T6`. The Python trace below checks all eight assignments, taking block and thread counts as input and printing each block's token positions:

<!-- leetllm: test, output=show -->

```python title="map-token-positions.py"
threads_per_block = 4
blocks = 2

for block_id in range(blocks):
    positions = []
    for thread_id in range(threads_per_block):
        global_id = block_id * threads_per_block + thread_id
        positions.append(f"T{global_id}")
    print(f"block {block_id}: {positions}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
block 0: ['T0', 'T1', 'T2', 'T3']
block 1: ['T4', 'T5', 'T6', 'T7']
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Streaming Multiprocessor execution and warp scheduling. Two 4-thread blocks map to global token positions T0 through T7. In hardware, each block is allocated to a separate 32-lane warp, leaving 28 lanes idle per warp and wasting SIMT execution capacity." />
  <figcaption>Each of the eight token positions gets one global id. Warps don't cross thread-block boundaries, so each four-thread block uses only 4 of its 32 lanes (12.5%). This lane fraction isn't a measured throughput efficiency. Multiples of 32 avoid partial warps caused by the block size; bounds checks and branches can still leave lanes inactive.</figcaption>
</figure>

The trace has eight useful threads, but hardware groups threads into a larger unit. An NVIDIA <span data-glossary="cuda-warp">CUDA warp</span> contains 32 threads from one block. Warp lanes execute through a single-instruction, multiple-thread (SIMT) model. If lanes take different branches, CUDA masks inactive lanes while it executes each required path, so divergence can waste throughput.[^cudaProgrammingGuide2026]

The four-thread teaching block is legal, and it still occupies a full warp. CUDA fills that warp with consecutive thread ids from the same block, so 4 lanes process token positions and 28 lanes sit unused for the whole launch. A production kernel should choose its block size to keep more lanes active.

Read the hierarchy from a kernel launch downward: its grid contains blocks; each block is scheduled on one SM and advances in warps; each thread owns its index. A PyTorch operation can launch several kernels, and a shape-only view can launch none. Use the table to name what each level contributes:

| Level | Meaning | Beginner question |
|---|---|---|
| PyTorch operation | a request such as `x * 2` or `x @ w` | Is the tensor on CUDA? |
| kernel | GPU function launched to perform part of the work | Is the work large enough to justify a launch? |
| grid | every block in one launch | How much work exists? |
| block | threads that run on one SM and can cooperate | Which slice of work stays together? |
| warp | 32 threads scheduled together | Are branches, or a short last warp, leaving lanes idle? |
| thread | one logical worker with its own index | Which data item does it handle? |

PyTorch's matrix-multiply kernels use optimized tiling, not one thread per token. Treat the eight-position trace as a map for CUDA's indexing and scheduling terms, not as a model of the library kernel.

What if there are ten positions instead of eight? Two four-thread blocks miss the last two positions; three blocks create twelve threads. The final two threads need a bounds check before reading or writing an array. This CPU simulation checks both coverage and the unused tail:

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

Removing the guard would attempt indexes `10` and `11`, beyond the ten-element array. These are ordinary Python simulations of CUDA indexing, not GPU kernels. PyTorch handles the indexing and bounds checks for the tensor operations used below.

Those launches only happen if this process can see a CUDA device. The next check is whether the driver, the PyTorch build, and the GPU agree.

## Check driver, PyTorch build, and device

The phrase "my CUDA version" separates several layers of the software stack, and each command checks a different piece. The NVIDIA System Management Interface command, `nvidia-smi`, reads driver and GPU state. `nvcc` is NVIDIA's CUDA compiler:

| Signal | What it tells you | What to check next |
|---|---|---|
| `nvidia-smi` | NVIDIA driver can see a GPU. The CUDA Version header (documented as CUDA UMD Version; the older CUDA Version label is deprecated) is the latest CUDA version that driver supports | which CUDA toolkit is installed, or whether this Python has a CUDA-enabled PyTorch build |
| `torch.__version__` | installed PyTorch version and often its build suffix | whether GPU access works |
| `torch.version.cuda` | CUDA version used to build this PyTorch package, or `None` for a build without CUDA | whether driver and device are reachable |
| `torch.cuda.is_available()` | CUDA is currently available to this process | whether a particular kernel can execute, fits, or runs fast |
| `nvcc --version` | version of local CUDA toolkit compiler, when installed | which runtime a prebuilt PyTorch package uses |

The CUDA UMD Version describes driver capability, not an installed compiler. A machine can run a prebuilt CUDA-enabled PyTorch package without having `nvcc` installed.[^nvsmi] It can't prove that *this* Python process loaded a CUDA-enabled PyTorch build.

PyTorch's installer offers builds for supported compute platforms, and its verification step uses `torch.cuda.is_available()`.[^pytorchGetStarted2026] For ordinary prebuilt use, a local toolkit and `nvcc` matter when you build PyTorch from source or compile custom CUDA extensions. Version strings don't need to match; the driver must support the runtime used by the package.

Run the driver check first, then inspect the Python environment. The shell command produces driver output, PyTorch version and runtime, availability, device name, capability, and architectures when CUDA is reachable:

```bash title="terminal"
nvidia-smi
python3 - <<'PY'
import torch

print("PyTorch:", torch.__version__)
print("PyTorch CUDA runtime:", torch.version.cuda)
print("CUDA available:", torch.cuda.is_available())

if torch.cuda.is_available():
    print("device:", torch.cuda.get_device_name(0))
    print("compute capability:", torch.cuda.get_device_capability(0))
    print("build architectures:", torch.cuda.get_arch_list())
PY
```

The **compute capability** pair describes hardware features supported by a GPU generation. `get_arch_list()` reports architectures included in the PyTorch build. Read the first disagreement, not the most alarming line:

| Observed state | Likely layer | Next check |
|---|---|---|
| `nvidia-smi` fails | driver, hardware, or container access | driver installation and device exposure |
| `nvidia-smi` works, `torch.version.cuda is None` | PyTorch package wasn't built for CUDA | select the CUDA-enabled package for this environment |
| PyTorch has a CUDA runtime, but availability is `False` | driver compatibility or process visibility | driver support, container GPU access, `CUDA_VISIBLE_DEVICES` |
| availability is `True`, but kernel reports unsupported architecture | installed binary doesn't support this GPU | check support in PyTorch and any custom extension; older GPUs can also lose support |
| availability is `True` and device name is correct | basic stack works | test placement, memory, and timing |

`CUDA_VISIBLE_DEVICES` changes the GPU indexes visible inside the process. If physical GPU `1` is the only visible device, PyTorch may call it `cuda:0`. Inspect `tensor.device` and device names inside the running process instead of assuming host indexes survive a mask.

Once the stack answers "yes," move the miniature sequence batch and check the result. GPU visibility confirms device access; validate tensor placement, memory use, outputs, and timing in the training step below.

## Move the sequence batch once

Return to the `(4, 8, 16)` sequence tensor. What changes during `.to(device)`: its shape or its residence? Shape stays constant. Residence changes from host memory to CUDA device memory.

On a discrete NVIDIA GPU, a <span data-glossary="host-to-device-transfer">host-to-device (H2D) transfer</span> copies data from CPU memory to GPU memory. **Device-to-host (D2H)** is the return path. Keep model weights, batch tensors, activations, <span data-glossary="gradient">gradients</span>, and <span data-glossary="optimizer-state">optimizer state</span> on the GPU through the hot part of a training step. Bring back the small value needed for reporting.

The runnable step uses random feature values so it needs no dataset download. It tests execution, not classifier quality. It averages eight token <span data-glossary="vector">vectors</span> into one vector per sequence, then scores three classes indexed `0`, `1`, and `2`.

`nn.Linear(16, 3)` multiplies each 16-feature vector by learned weights and adds a bias, producing three scores called <span data-glossary="logits">logits</span>. Cross-entropy turns those scores and the correct label into one error value, the **loss**. `backward()` computes how each weight affects that loss; those derivatives are **gradients**. Stochastic gradient descent (SGD) updates weights opposite the gradient, aiming to reduce the loss.[^pytorch2026optimization] The later [PyTorch training lesson](/learn/pytorch-training-loops) derives the loop; here, watch where its tensors live.

Checking shape and device placement confirms that `(4, 8, 16)` becomes sequence vectors `(4, 16)` and logits `(4, 3)`. On CUDA, model and batch agree; on CPU, the same shape and loss checks still run:

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

On an accessible NVIDIA GPU, the first two lines should report `True`. A CPU-only machine reports `False` for the accelerator line but still validates tensor and training logic. The finite-value assertions check this smoke test before the update; their `.item()` calls can wait for GPU work, so keep them outside a throughput measurement. If a shape fails, debug the reduction or linear layer first; a device error needs a different branch.

Device placement applies to every tensor an operation touches. Moving features but leaving labels on CPU still fails during a CUDA loss calculation. Deliberately leave the features on CPU in the next fragment; on a CUDA machine this raises a device error, while a CPU-only machine prints the fallback message:

<!-- leetllm: test, deps=torch -->

```python title="reproduce-device-mismatch.py"
import torch
import torch.nn as nn

if torch.cuda.is_available():
    cuda_model = nn.Linear(16, 3).to("cuda")
    cpu_features = torch.randn(4, 16)
    try:
        cuda_model(cpu_features)
    except RuntimeError as error:
        if "device" not in str(error).lower():
            raise
        print("device mismatch:", str(error))
    else:
        raise AssertionError("expected a mixed-device forward pass to fail")
else:
    print("CUDA unavailable: real mixed-device failure wasn't executed")
```

The symptom is an error saying tensors or arguments aren't on the same device. Cause is placement, not shape. Move every participating tensor to the model's device before the forward or loss call. Synchronizing won't repair a tensor stored on the wrong device.

The miniature step can succeed while a training-sized batch still fails. Shapes and device placement answer whether an operation is legal; memory pressure decides whether the full forward and backward pass can coexist.

## Count memory before the first big batch

The small step fits. Before increasing batch size, ask which values must survive between steps and which exist only while one kernel runs. CUDA exposes several storage levels, and they aren't interchangeable:

| Storage | Scope | Typical training data |
|---|---|---|
| host RAM | CPU process | dataset objects, decoded examples, CPU batches |
| device global memory, often called video RAM (VRAM) or high-bandwidth memory (HBM) | all SMs on one GPU | weights, activations, gradients, optimizer state |
| L2 and L1 caches | GPU hardware | recently accessed device data |
| shared memory | threads in one block | tiles reused inside a kernel |
| registers | one thread | counters, addresses, and small working values |

PyTorch allocates model tensors in device global memory. Optimized kernels decide when to reuse tiles through caches, shared memory, or registers. Calling `.to("cuda")` doesn't place a whole tensor in a register or in shared memory. An <span data-glossary="optimizer">optimizer</span> adds its own long-lived state during training.

The miniature batch itself contains `4 × 8 × 16 = 512` float32 values, only 2,048 bytes. A larger `(32, 128, 768)` float32 batch contains `32 × 128 × 768 × 4 = 12,582,912` bytes, exactly 12.0 MiB of input features. That input is only one term in a training step:

$$
\text{training memory} \approx \text{weights} + \text{activations} + \text{gradients} + \text{optimizer state} + \text{temporary workspaces}
$$

The example uses SGD without momentum, which doesn't keep per-parameter running statistics. To see why the optimizer choice changes memory, consider **Adam**, an optimizer that tracks two statistics for each parameter: a running average of gradients and a running average of squared gradients.[^pytorchAdamDocs2026]

For a simplified full-precision Adam budget, count 4 bytes for each weight, 4 for its gradient, and 8 for its two statistics. One billion parameters therefore require 16 billion bytes for these tensors when they're all present. Activations, temporary buffers, allocator overhead, and any extra parameter copies still sit outside this accounting.

<figure>
  <img src="illustrations/_generated/memory_path_dark.png" alt="GPU memory hierarchy alongside the 16-byte FP32 Adam parameter budget. The hierarchy spans registers, shared memory, L2 cache, VRAM, and PCIe host transfers. At one billion parameters, the parameter-related floor requires 14.90 GiB before activations and workspaces." />
  <figcaption>Registers belong to threads, shared memory to a block, and caches to the hardware. Their bandwidth and latency depend on the GPU and access pattern. For this simplified FP32 Adam budget, weights occupy only one quarter of the parameter-related tensors. Include gradients, optimizer state, and activations when estimating training-step memory.</figcaption>
</figure>

Compute those two scales before touching a GPU. The first value is a batch input; the second is a parameter-related floor. The script takes the parameter count and feature shape as constants and prints both in human-readable units:

<!-- leetllm: test, output=show -->

```python title="adam-memory-floor.py"
parameters = 1_000_000_000
bytes_per_parameter = 4 + 4 + 8
total_bytes = parameters * bytes_per_parameter
feature_bytes = 32 * 128 * 768 * 4

print(f"bytes per parameter: {bytes_per_parameter}")
print(f"parameter-related floor: {total_bytes / (1024 ** 3):.2f} GiB")
print(f"training-sized sequence features: {feature_bytes / (1024 ** 2):.1f} MiB")
print("activations and temporary work: add more memory")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
bytes per parameter: 16
parameter-related floor: 14.90 GiB
training-sized sequence features: 12.0 MiB
activations and temporary work: add more memory
```
<!-- leetllm: output:end -->

A model can load and still hit an <span data-glossary="out-of-memory">out-of-memory (OOM)</span> failure on its first forward or backward pass. Loading checks that current model state fits. The real batch also needs activations and gradients. Adam's moment tensors are commonly created on the first optimizer step, so that step can fail even after backward succeeds.

For the running text batch, compare halving the batch size with halving the sequence length. Both halve the simple `B × T` count, but attention storage responds differently. This small calculation makes that distinction visible:

<!-- leetllm: test, output=show -->

```python title="activation-position-budget.py"
batch_size = 32
sequence_length = 128
baseline = batch_size * sequence_length

for name, batch, tokens in [
    ("baseline", 32, 128),
    ("half batch", 16, 128),
    ("half length", 32, 64),
]:
    share = batch * tokens / baseline
    print(f"{name:11s}: {share:.0%} of token positions")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
baseline   : 100% of token positions
half batch : 50% of token positions
half length: 50% of token positions
```
<!-- leetllm: output:end -->

The output counts token positions, not full memory. Our mean-pooling classifier has no attention matrix. A later transformer compares each token with every other token; storing those scores can require a tensor shaped `(B, H, T, T)`, where `B` is batch size, `H` is the number of attention heads, and `T` is sequence length. Halving `B` halves that tensor; halving `T` quarters it. Memory-efficient attention can avoid storing the full score matrix, so this isn't a universal prediction of peak memory. Feature width `D = 768` doesn't change the token-position count.

<span data-glossary="mixed-precision">Mixed precision</span> is another memory and throughput tool, but it isn't a safe synonym for calling `.half()` on everything. PyTorch's automatic mixed precision (AMP) uses `torch.autocast(device_type="cuda")` to choose an operation-specific dtype. <span data-glossary="fp16">FP16</span> (16-bit floating point) training may need `torch.amp.GradScaler("cuda")` to prevent small gradients from underflowing, and some models overflow in FP16.[^pytorchAmpDocs2026] Confirm finite loss, finite gradients, and expected model quality. The dedicated mixed-precision lesson covers that workflow.

TensorFloat-32 (TF32) is a separate choice on Ampere and newer NVIDIA GPUs: eligible operations keep float32 tensor storage but use reduced-precision inputs internally, with FP32 accumulation. It can change numerical results without halving tensor memory. Current PyTorch documentation recommends `fp32_precision` controls such as `torch.backends.cuda.matmul.fp32_precision = "ieee"` or `"tf32"`; mixing these with legacy `allow_tf32` controls isn't supported. Record the precision setting when comparing timings, and check accuracy before accepting a faster setting.[^pytorchCudaSemantics2026]

Memory pressure answers "does it fit?" It doesn't answer whether the GPU is moving data efficiently while it works. Access order explains that difference.

## Let access order decide bandwidth

Two kernels can read the same number of `float32` values and still ask the memory system for very different work. On GPUs with compute capability 6.0 or newer, a warp's global-memory requests are serviced in 32-byte segments. Reading adjacent words lets the lanes share segments, an access pattern called **coalescing**. Reading a column in a row-major matrix can instead make neighboring lanes jump by a <span data-glossary="stride">stride</span> of 32 words, so each lane touches a different segment.

Keep eight lanes in the illustration so the addresses stay readable. For a full warp, the adjacent pattern needs four 32-byte transactions when the first word is aligned. The stride-32 pattern can need one transaction per lane. That's why a mathematically identical operation can land on opposite sides of a bandwidth limit.[^cudaBestPractices2026]

Shared memory can repair the global access pattern, but it introduces **banks**, independently accessible storage partitions. In the standard 32-bank layout for 32-bit words, the bank index is the word index modulo 32. For column zero of a `32 × 32` tile, lanes 0, 1, and 2 access word indexes 0, 32, and 64, all in bank 0. These are different addresses, so the accesses serialize. With a `32 × 33` allocation, the indexes become 0, 33, and 66, which map to banks 0, 1, and 2. Padding changes storage layout, not the logical matrix result. Multiple lanes reading the *same* address are a broadcast case, not this bank-conflict case.[^cudaBestPractices2026]

<figure>
  <img src="illustrations/_generated/memory_access_order_dark.png" alt="Eight active lanes read aligned 4-byte words. Adjacent global reads request one 32-byte segment, while stride-32 reads request eight segments. Distinct shared-memory addresses at stride 32 map to bank 0 and cause an eight-way conflict; stride-33 padding maps these lanes to independent banks." />
  <figcaption>For these eight active lanes and aligned 4-byte words, adjacent reads use all 32 requested bytes; strided reads use only 32 of 256 requested bytes. These ratios describe requested segment use. Caching and other hardware behavior determine actual bus traffic and latency. Shared-memory stride 32 creates an eight-way conflict; stride 33 removes that conflict.</figcaption>
</figure>

Verify the figure's address mapping directly in Python before analyzing kernel speed. With a base address aligned to 32 bytes, dividing each byte address by 32 identifies its global-memory segment. Taking each word index modulo 32 identifies its shared-memory bank. This CPU trace checks the address math without claiming to measure CUDA transactions:

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

The same stride of 32 is costly in both examples for different reasons: global reads request eight segments, while shared reads target eight distinct words in one bank. A broadcast would repeat the same word address instead.

Use this compact table after you've inspected the access pattern. It suggests changes to test; measurements on the target kernel show which ones help:

| Observed access | What the hardware sees | First experiment |
|---|---|---|
| adjacent global words | a few 32-byte transactions | keep the layout and measure another bottleneck |
| strided global words | many transactions for the same useful values | load coalesced rows, then reorder in shared memory |
| shared tile stride 32 | several lanes contend for one bank | add a padding column and remeasure |
| shared tile stride 33 | lanes spread across banks | keep padding only if output and end-to-end time improve |

The table explains why "put it in shared memory" isn't a complete optimization. Shared memory helps when it removes global traffic or fixes an access pattern; bank conflicts can give that shortcut a new bottleneck.[^cudaBestPractices2026]

Memory layout answers where time can go. Next, check whether arithmetic or bytes set the upper bound.

## Choose the next optimization with a bound

Suppose a kernel performs 1,000 floating-point operations (FLOPs) and transfers 4,000 bytes to or from device memory. That's `0.25 FLOPs/byte`: little arithmetic for each byte fetched. This ratio is called **arithmetic intensity**:

$$
I = \frac{\text{floating-point operations}}{\text{bytes moved}}
$$

Double the bytes without changing the math and intensity falls to `0.125`. The **Roofline** performance model combines this ratio with two hardware limits: arithmetic per second and bytes per second. Its upper bound is the smaller of the compute ceiling and bandwidth multiplied by intensity. Count bytes and bandwidth at the same memory level; a device-memory Roofline uses traffic beyond the caches, not every load instruction.[^williams2009][^nsightCompute2026]

On a device with a 100 GFLOP/s compute ceiling and 40 GB/s memory bandwidth, intensity `0.25` gives a bandwidth ceiling of `40 × 0.25 = 10 GFLOP/s`, making the workload memory-bound at 10 GFLOP/s.

When intensity is low and measured bandwidth is high, adding more arithmetic will not make the kernel faster. Reuse data, reduce bytes, or make requests coalesced first. When intensity is high but achieved floating-point rate stays far below the compute ceiling, inspect instruction choice, layout, and launch resources instead.

**Occupancy** is the fraction of an SM's maximum resident warps that are currently resident. A resident warp holds execution resources even while waiting for data. Having other ready warps helps the scheduler hide that wait, but 100% occupancy isn't a target by itself. Registers and shared memory are finite; using more of either can reduce the number of resident blocks. A kernel with lower occupancy can still win if its tiles reuse data or its threads do more useful work. Treat occupancy as a constraint and a clue, then let measured throughput and stall reasons decide.[^cudaBestPractices2026]

NVIDIA's Assess, Parallelize, Optimize, Deploy (APOD) cycle gives the work a safe rhythm. At this level, combine its Parallelize and Optimize stages into one controlled change:

1. **Measure (Assess):** profile a representative shape and record end-to-end time, kernel time, output, and memory behavior.
2. **Change (Parallelize, then Optimize):** alter access order, reuse, dtype, launch shape, or transfer behavior because the evidence points there.
3. **Verify, Deploy, and repeat:** compare output with a trusted reference, rerun the same measurement, keep the change only when the whole step improves, then start the next pass from a fresh assessment.

Pick the tool from the question. **Nsight Systems** answers whether the CPU feeds the GPU and where transfers, kernels, streams, or host waits leave gaps. **Nsight Compute** answers what one kernel does with its launch resources, memory hierarchy, and compute or bandwidth ceilings. **Compute Sanitizer** checks custom CUDA work for illegal memory access, shared-memory hazards, and synchronization errors. For a custom kernel, combine those checks with reference-output comparisons; neither alone proves the algorithm is correct.[^nsightSystems2026][^nsightCompute2026][^computeSanitizer2026]

| Question | First tool | Evidence to read |
|---|---|---|
| Is the step CPU-, transfer-, or synchronization-bound? | Nsight Systems (`nsys profile --trace=cuda`) | CUDA API and GPU workload timelines, H2D copies, kernels, streams, and idle gaps |
| Is one kernel limited by bytes, math, or launch resources? | Nsight Compute (`ncu`) | launch statistics, SpeedOfLight, Roofline, cache traffic, bank conflicts, and warp stalls |
| Did a custom kernel produce invalid work? | Compute Sanitizer | `memcheck`, `racecheck`, and `synccheck` reports with source, block, and thread context |

Run correctness checks before comparing numbers. Once the bound and the failure surface are named, the diagnosis table can point to a narrow next action instead of turning every slowdown into a memory tweak.

CUDA's default async launch makes timing another measurement that is easy to get wrong.

## Measure asynchronous work honestly

PyTorch queues CUDA operations asynchronously by default. The CPU can finish a Python call while its GPU kernels are still waiting or running. Operations in the same CUDA stream keep their order, so later GPU work sees correct results without a host wait. A host-visible value or explicit synchronization makes the CPU wait.[^pytorchCudaSemantics2026]

Suppose a larger classifier's forward pass takes 40 ms on the GPU, while Python needs only 2 ms to queue it. Those timings raise a direct question: what does a host timer around the call report? It measures the caller's elapsed time, which may end before device work completes.

<figure>
  <img src="illustrations/_generated/timing_sync_trap_dark.png" alt="Elapsed-time comparison: a naive host timer sees 2 ms of submission, CUDA events span 40 ms on the device stream, and a synchronized host timer includes submission and waiting. Host time does not have to equal device event time." />
  <figcaption>In this scenario, submission takes 2 ms while events span 40 ms on the device stream, so an unsynchronized timer understates completion time roughly twentyfold. A synchronized host timer includes caller overhead and waiting, whereas CUDA events measure a stream interval. They answer different questions and do not have to match.</figcaption>
</figure>

The naive timer stops at 2 ms while the GPU continues. Events record timestamps on a CUDA **stream**, an ordered queue of device work. Their interval includes work and any gaps between the events on that stream; it isn't automatically the sum of individual kernel durations. A synchronized host timer can also include Python overhead, so it does not have to match event time exactly.

Warm up first because initial calls may include library setup or kernel selection. This script uses PyTorch 2.9 or later and times ten matrix multiplications. On CUDA it prints three timings for the same loop: host submission, host completion, and the event interval. On CPU it uses a completed host timer. It selects IEEE FP32 matmul on CUDA and checks against a CPU reference. Input allocation, warmup, transfers, and the correctness check stay outside the timed region; result allocation and Python loop overhead remain inside:

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

The event interval includes the work and gaps between its two timestamps. The host completion timer includes recording and waiting for the end event; its submission timer stops before that wait. These tiny matrices may be dominated by Python and launch overhead, so a run does not have to reproduce the diagram's 20-fold gap. Record the device name from the setup check and repeat with representative shapes before drawing a throughput conclusion. Passing `assert_close` validates this check at its stated tolerance, not every model's accuracy under a precision change.

Common host waits include:

- `loss.item()` for a Python scalar
- `tensor.cpu()` before CPU analysis
- `tensor.cpu().numpy()` before NumPy work
- printing a CUDA tensor's values
- `torch.cuda.synchronize()`

Those operations aren't bugs. They become performance bugs when they sit inside a hot loop more often than reporting or correctness requires. A scalar needed once per full pass is different from a scalar pulled back every step.

Asynchrony also affects error location. A bad kernel may report its error on a later Python line that finally waits for the device. For one debugging reproduction, run with `CUDA_LAUNCH_BLOCKING=1` to make CUDA calls synchronous and recover a more useful <span data-glossary="stack-trace">stack trace</span>. Remove it before performance measurement because it changes execution behavior.[^pytorchCudaSemantics2026]

When the training step is slow, empty, or dead, start with one question: did the CPU fail to feed the GPU, did the GPU run work that doesn't fit, or did the measurement hide the wait? The diagnosis table turns that question into first actions.

## Diagnose setup, memory, and throughput failures

`nvidia-smi` is a useful first observation, not a kernel profiler. Use it to confirm device visibility, process attachment, rough memory pressure, and utilization samples. Before comparing its memory number with PyTorch, ask which counter includes reserved-but-unused allocator blocks: PyTorch's caching allocator can hold blocks for reuse, so `nvidia-smi` may show more memory than live tensors occupy.[^nvsmi][^pytorchCudaSemantics2026]

PyTorch separates two allocator views:

- `torch.cuda.memory_allocated()` counts memory occupied by live tensors.
- `torch.cuda.memory_reserved()` counts the larger pool managed by PyTorch's caching allocator.

`torch.cuda.empty_cache()` releases unused cached blocks for other applications. It doesn't free live tensors or shrink the workload's required memory. Cached blocks are normally reusable by the same job already; repeatedly clearing them can add allocation overhead. `nvidia-smi` also includes the CUDA context, which PyTorch's allocator doesn't count, so it does not have to equal `memory_reserved()`.[^nvsmi][^pytorchForumCudaContext2021]

Use symptom, cause, and next action together. Choose the first row that matches observed evidence instead of tuning every knob at once:

| Symptom | Likely cause | First action |
|---|---|---|
| `torch.cuda.is_available()` is `False` | driver, visibility, or PyTorch build mismatch | compare `nvidia-smi`, `torch.version.cuda`, and process visibility |
| forward says tensors are on different devices | model and one batch field disagree | move every tensor used by model or loss to model device |
| model loads, backward OOMs | activations, gradients, optimizer state, or workspace exceed free memory | add up weights, gradients, and optimizer state; if they fit, lower per-step batch size, then sequence length; read allocation size in OOM message |
| effective batch must stay large | smaller steps change optimization batch | accumulate gradients across several smaller steps and scale loss correctly |
| loss or gradients become not-a-number (`NaN`) under FP16 | numerical overflow or invalid mixed-precision path | disable AMP; if the `NaN` goes away, the precision path is implicated; inspect dtypes, scaling, and any changed kernels with finite-value checks |
| host timer says a kernel took almost zero time | CPU timed enqueue only | warm up and use CUDA events or explicit synchronization |
| memory bar is high but examples per second are low | allocation isn't utilization; data, copies, sync, or tiny kernels may stall | inspect dataloading and host waits before blaming matrix kernels |
| GPU utilization repeatedly falls to zero | possible input starvation, host waits, or brief work missed by sampling | profile data loading, transfer cadence, and synchronization gaps |
| CUDA error points at an innocent later line | asynchronous error surfaced at next wait | reproduce once with `CUDA_LAUNCH_BLOCKING=1` |

Pinned host memory can speed H2D copies. `DataLoader(..., pin_memory=True)` prepares CPU tensors in page-locked memory, and `.to(device, non_blocking=True)` can let the host continue without waiting for each transfer. This doesn't by itself overlap the copy with a later kernel in the same stream: their order is preserved. Actual copy/compute overlap requires suitable hardware, separate streams, and correct dependencies. Don't modify a pinned source buffer until its asynchronous copy finishes.[^pytorchPinnedMemory2026]

The next snippet is a host-to-device transfer fragment, not a full script. It assumes a CPU `dataset` yielding `(features, labels)` and a `model` already exist. Deriving the device from the model gives an explicit index such as `cuda:0`, not an unindexed `cuda` specification:

```python title="pinned-batch-transfer.py"
from torch.utils.data import DataLoader

device = next(model.parameters()).device
loader = DataLoader(dataset, batch_size=32, pin_memory=(device.type == "cuda"))

for features, labels in loader:
    features = features.to(device, non_blocking=True)
    labels = labels.to(device, non_blocking=True)
    assert features.device == device and labels.device == device
    # Forward, backward, and optimizer work stay on device.
```

Measure before and after. Pinned memory and non-blocking copies help a transfer bottleneck; they won't fix a kernel that's already compute-bound or an OOM caused by live tensors. A faster copy doesn't change the amount of model state that must fit.

## Trace the training step end-to-end

Treat the complete training step as a reproducible GPU smoke test. "GPU works" hides setup, shape, placement, memory, and timing in one unverifiable claim. Record evidence for each stage.

1. Check shapes: batch `(4, 8, 16)`, pooled vectors `(4, 16)`, logits `(4, 3)`.
2. Run `nvidia-smi` and the PyTorch environment check. Record driver, PyTorch runtime, device name, and availability separately.
3. Run the training step. Confirm model, features, labels, logits, and loss use one device until reporting.
4. Deliberately leave features on CPU while model is on CUDA. Capture the device-mismatch symptom, then restore `.to(device)`.
5. Time ten matrix multiplies with CUDA events. Compare that result with a naive host timer around the same loop.
6. Write the terms that would make a larger run OOM: weights, activations, gradients, optimizer state, workspaces, and allocator overhead.

Compare expected output with this table, then fix the first stage that fails. A later symptom can be downstream noise:

| Evidence | Pass condition | If it fails |
|---|---|---|
| shape trace | `(4, 8, 16) → (4, 16) → (4, 3)` | revisit reduction axis or linear-layer input width |
| device trace | every training tensor matches model device | move missing batch field before operation that uses it |
| timing trace | event reports completed GPU work | add warmup and synchronization after end event |
| memory trace | full training footprint is named | add activations, gradients, optimizer state, and temporary work |

Check the reasoning without running code. Each answer should name a mechanism, not only repeat a command:

```checkpoint
Why can `model(x)` return to Python before its CUDA kernels finish?
---
PyTorch queues CUDA work asynchronously. Python can continue after enqueueing while the device executes operations in stream order.
```

```checkpoint
Why can a model fit in device memory and then OOM during backward?
---
Model loading accounts for current state, but training also needs activations, gradients, optimizer state, temporary workspaces, and allocator overhead.
```

```checkpoint
Why can `nvidia-smi` show more memory than `memory_allocated()`?
---
PyTorch's caching allocator can reserve unused blocks for fast reuse. `memory_allocated()` counts live tensors, while `nvidia-smi` can reflect the larger reserved pool.
```

```checkpoint
What does the CUDA value printed by `nvidia-smi` mean?
---
It reports the latest CUDA version supported by the installed driver (CUDA UMD Version; the older CUDA Version label is deprecated). Check the installed toolkit and this PyTorch environment separately to confirm they can use CUDA.
```

## Carry shape, device, and timing forward

A CUDA training step depends on three checks:

- **Shape:** each axis still means what the model expects.
- **Device:** every tensor used together lives on a compatible device.
- **Time:** measurements include the GPU work whose latency you intend to report.

The CPU prepares data and launches work. CUDA maps kernels onto grids, blocks, warps, and SMs. Device memory holds long-lived training state, while kernels use caches, shared memory, and registers for smaller working sets. Copies and synchronization are explicit costs, so placement, OOM diagnosis, and timing all follow from the same execution path.

Place the sequence batch, check the driver version against a usable PyTorch build, and see whether a slow step is waiting on bytes, math, or a timer that returned too early. If a run fails, inspect shape, then device, then time.

Those same three checks carry over to Apple silicon's `mps` backend: even without a separate PCIe-attached VRAM pool, mismatched `cpu` and `mps` tensors still fail, unified memory still hits a hard ceiling, and unsynchronized timers still undercount asynchronous GPU work.

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
    "question": "In one load, the 32 lanes of a warp read consecutive 4-byte global words starting at byte address 80, one word per lane. In a separate load, the same lanes read shared words starting at word 1 with a stride of 38 words. Use the standard 32-bank layout for 4-byte words, with word 0 in bank 0. How many aligned 32-byte global segments does the warp touch, and how do the shared words map to banks?",
    "options": [
      "5 segments, 16 odd-numbered banks with 2 words each.",
      "4 segments, 16 odd-numbered banks with 2 words each.",
      "5 segments, all 32 banks with 1 word each.",
      "5 segments, 16 even-numbered banks with 2 words each."
    ],
    "answer": "5 segments, 16 odd-numbered banks with 2 words each.",
    "explanation": "The global load spans bytes 80 through 207. It starts halfway through segment 2 and ends in segment 6, touching 5 segments. Counting 128 bytes as 4 full segments misses the offset. In shared memory, a stride of 38 advances 6 banks on each step because bank numbers wrap at 32. Starting at bank 1 keeps every request in an odd-numbered bank. The first 16 lanes visit all 16 odd banks, then the pattern repeats with different words. Each used bank serves two distinct words. The even-bank answer assumes a start at word 0. Using all 32 banks would require a stride that also reaches even banks."
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
    "question": "Suppose a kernel performs 2,400 FLOPs and moves 600 bytes beyond cache. At the same memory level, bandwidth is 60 GB/s and the compute ceiling is 200 GFLOP/s. A larger tile lowers occupancy but reduces those bytes further. Which bound and conclusion follow?",
    "options": [
      "The bound is 240 GFLOP/s; compare occupancy alone to choose.",
      "The bound is 200 GFLOP/s; compare occupancy alone to choose.",
      "The bound is 240 GFLOP/s; compare output and whole-step time.",
      "The bound is 200 GFLOP/s; compare output and whole-step time."
    ],
    "answer": "The bound is 200 GFLOP/s; compare output and whole-step time.",
    "explanation": "Intensity is 2400/600=4 FLOPs/byte, giving a bandwidth ceiling 240 GFLOP/s. The minimum with compute 200 is 200 GFLOP/s. Once at the compute ceiling, fewer bytes do not raise this bound. Lower occupancy alone does not determine performance; compare correctness and measured whole-step results."
  }
]
```

> **Next:** Continue to [Mixed Precision Training](/learn/mixed-precision-training-loss-scaling).

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

You rent a GPU with 24 GB of memory to fine-tune a model with 7 billion parameters. You have read the last five chapters, so you do the arithmetic first: 7 billion numbers at 2 bytes each is 14 GB, which leaves plenty of room. The model loads. The first batch goes in. A few seconds later the run dies with `CUDA out of memory`.

Your arithmetic was correct. It also counted less than a quarter of what a training step holds in memory, and you just paid for a GPU to tell you so.

## Why this arithmetic ended up on a GPU

Go back to the last line of the matrix multiplication script in Chapter 2: one linear layer, one thousand tokens, nearly 17 billion multiplications. Think about what kind of work that is. Each multiplication is the same small operation on different numbers, and no decision depends on the answer to any of them.

A CPU is built for the opposite job. It is tuned for varied work: branches, function calls, quick reactions, and low latency on each step. A GPU gives that up for throughput, running similar arithmetic across a very large number of simple workers at the same time. For a large matrix multiplication, that trade is a bargain. For a tiny tensor, a Python loop full of `if` statements, or code that copies data on every line, it can be a bad deal, because launching the work and moving the data cost more than the GPU saves. Our next-character model from Chapter 5 has no reason to use one.

**CUDA** is NVIDIA's platform for running this kind of work on its GPUs.[^cudaProgrammingGuide2026] It does not turn your Python into GPU code. Python keeps running on the CPU, and when it reaches a tensor operation whose data lives on the GPU, PyTorch launches a small GPU function called a **kernel** to do the math. So one training step is a relay between two machines:

| Part of a step | The CPU's job | The GPU's job |
|---|---|---|
| Prepare data | Read, tokenize, pad, and assemble a batch | Nothing yet |
| Transfer | Request a copy | Receive the batch in its own memory |
| Forward and backward | Launch tensor operations | Run the kernels |
| Report | Ask for a Python number, write a file | Finish and hand back the value |

Notice the words "its own memory." A discrete GPU has memory of its own, separate from your computer's RAM, often called video RAM (VRAM) or high-bandwidth memory (HBM). A tensor lives in one place at a time. Calling `x.to("cuda")` makes a copy over there, and one operation cannot mix tensors from both sides. That is why a common first error says that your tensors are on different devices. Move the model, and then every field of the batch that the model or the loss uses.

<div data-callout="info" data-callout-title="On a Mac with Apple silicon">
  <p>Apple silicon skips the split between host RAM and discrete VRAM: its CPU and GPU draw from one shared unified memory pool with no PCIe transfer hop.[^mlx2026] That lets a laptop hold larger models locally than a small discrete card, at two trade-offs: macOS and open apps share the same pool, and unified memory bandwidth sits below the HBM on datacenter GPUs.</p>
  <p>PyTorch still treats the Mac GPU as a separate device named <code>mps</code> (for Metal Performance Shaders), so you still move both weights and batches with <code>model.to("mps")</code> and <code>x = x.to("mps")</code> after checking <code>torch.backends.mps.is_available()</code>.[^appleMetalPytorch2026][^pytorchMpsBackend2026] Holding a copy on <code>cpu</code> and another on <code>mps</code> uses twice the shared RAM. Three MPS quirks matter in practice: Metal has no <code>float64</code> (cast NumPy arrays to <code>float32</code> first),[^pytorchMpsTensorAllocation2026] missing kernels raise an error unless you launch Python with <code>PYTORCH_ENABLE_MPS_FALLBACK=1</code> (which runs those ops on CPU at a speed cost),[^pytorchMpsEnvVars2026] and timing needs <code>torch.mps.synchronize()</code> for the same asynchronous reason CUDA does.</p>
</div>

The 24 GB on the rental page is the size of that second memory, and it is a hard ceiling. So let's find out what has to fit under it.

## Question one: will it fit?

A parameter is one number, and a number takes up bytes. How many depends on the format you store it in.

A floating-point number is scientific notation in binary. Write $6.02 \times 10^{23}$ and you have used a sign, a scale, and some digits. A float keeps the same three things in fixed slots: one bit for the sign, some bits for the **exponent**, which sets how large a number can get, and the remaining bits for the **fraction**, which sets how finely it can tell nearby numbers apart. A format has only so many bits, so it has to choose how to divide them between range and fineness.

<figure>
  <img src="illustrations/_generated/float_layouts_dark.png" alt="Three rows of bit cells. FP32 has 32 cells: 1 sign, 8 exponent, and 23 fraction, with a largest value near 3.40e38 and a gap of 1.19e-7 above 1.0. BF16 has 16 cells: 1 sign, 8 exponent, and 7 fraction, and its cells line up with the first 16 cells of FP32. Its largest value is near 3.39e38 and its gap above 1.0 is 0.0078. FP16 has 16 cells: 1 sign, 5 exponent, and 10 fraction, with a largest value of 65,504 and a gap of 0.00098." />
  <figcaption>Each cell is one bit, so a row's length is its memory. FP16 and BF16 both cost half of FP32 and spend their bits in opposite ways: BF16 keeps the range and gives up fineness, and FP16 does the reverse.</figcaption>
</figure>

**FP32** is the traditional format, at 4 bytes. **FP16** and **BF16** both cost 2 bytes and split them differently. The two limits on the right of the figure follow from the bit counts, and PyTorch's `torch.finfo` reports the same limits.[^pytorchTypeInfo2026] Python's `struct` module stores real FP32 and FP16, so we can check those two:

<!-- leetllm: test, output=show, id=reader-gpu-float-formats -->
```python title="float-formats.py"
import struct

def store(code, value):
    return struct.unpack(code, struct.pack(code, value))[0]

FORMATS = [("FP32", 8, 23), ("FP16", 5, 10), ("BF16", 8, 7)]
for name, exponent, fraction in FORMATS:
    largest = (2 - 2.0**-fraction) * 2.0 ** (2 ** (exponent - 1) - 1)
    print(f"{name}: {1 + exponent + fraction} bits, "
          f"largest {largest:.6g}, gap above 1.0 is {2.0**-fraction:.3g}")

# "e" is real FP16: its largest value and the number after 1.0 both survive
assert store("e", 65504.0) == 65504.0
assert store("e", 1 + 2.0**-10) == 1 + 2.0**-10

print("1.0 - 0.0001 stored as FP32:", store("f", 1.0 - 0.0001))
print("1.0 - 0.0001 stored as FP16:", store("e", 1.0 - 0.0001))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FP32: 32 bits, largest 3.40282e+38, gap above 1.0 is 1.19e-07
FP16: 16 bits, largest 65504, gap above 1.0 is 0.000977
BF16: 16 bits, largest 3.38953e+38, gap above 1.0 is 0.00781
1.0 - 0.0001 stored as FP32: 0.9998999834060669
1.0 - 0.0001 stored as FP16: 1.0
```
<!-- leetllm: output:end -->

Those last two lines are the first way this can hurt you. Take a weight of 1.0 and an update of 0.0001. The nearest FP16 number below 1.0 is much further away than that, so the result rounds back to exactly 1.0. The update is gone, and nothing reports an error. BF16's gap is eight times wider than FP16's, so it loses the same update.

The other way is overflow. FP16 stops at 65,504, so a tensor operation that produces 70,000 in FP16 gets infinity. Subtract one infinity from another and you get NaN, which means "not a number," and nearly every later calculation that touches a NaN returns NaN. That is how a loss turns into `nan` in the middle of a run. BF16 stores 70,000 as 70,144, which is a little wrong and much easier to live with. Part 3 shows how real training gets much of the speed and part of the memory savings without these two failures. For the budget in this chapter, the only question is 2 bytes or 4.

## What a training step keeps

Now we can redo the budget properly. Walk through the loop from Chapter 5 and ask what each line leaves in memory. Assume everything is stored at 2 bytes.

| Line of the loop | What appears | Our 7 billion parameter model |
|---|---|---|
| Load the model | The weights | 14 GB |
| `model(x)` | **Activations**: intermediate results kept for the backward pass | Depends on the batch and the model |
| `loss.backward()` | Gradients, one for each parameter | 14 GB more |
| `optimizer.step()`, the first time | Adam's two running averages for each parameter | 28 GB more |

Nothing in that table is new. Chapter 4 showed that the backward pass needs values saved from the forward pass, and that there is one gradient per parameter. Chapter 5 said Adam keeps two running averages. What's new is that you can now put a size on each one.[^pytorchAdamDocs2026]

<figure>
  <img src="illustrations/_generated/memory_budget_dark.png" alt="Three horizontal bars of gigabytes for a 7 billion parameter model, against a vertical line at a 24 GB GPU. Serving at FP16 needs 14 GB of weights and fits, with room for per-request memory. Training with Adam at FP16 needs 14 GB of weights, 14 GB of gradients, and 28 GB of optimizer averages, 56 GB before activations. Training with Adam and FP32 weights doubles each part to 112 GB before activations." />
  <figcaption>The same 7 billion parameters on the same GPU. Serving fits. Training with Adam needs at least four times as much memory as the weights alone, and that is before counting activations.</figcaption>
</figure>

So the GPU in our opening was never close. Weights fit, and then weights plus gradients need 28 GB, before counting a single activation. The second bar is also the generous case. The usual PyTorch mixed-precision setup keeps weights in FP32 and only runs the forward math at lower precision,[^pytorchAmpDocs2026] because of the lost updates you just saw.[^micikevicius2018] That doubles every parameter term, as the third bar shows, and puts you at 112 GB.

Serving needs none of the training extras. It holds the weights and some memory for each request, which Part 5 takes apart. This is why a model that you can serve on one GPU can take several to train, and why Part 3 spends a chapter on LoRA, which avoids training most of the parameters at all.

Activations are the term you cannot read off a parameter count, because they depend on your data. One activation tensor has shape $B \times T \times d$, and a deep model keeps many of them alive until the backward pass. Then there is the score grid from Chapter 2, $XX^T$. It compares every token with every other token, so for a batch it holds $B \times T \times T$ numbers, and attention builds grids like this inside each layer. Attention that stores this grid is called eager attention, and it keeps one per head in every layer, so the formula below is the floor for that path. (A head is one of several attention calculations that run side by side, as Part 1 explains.) PyTorch's `scaled_dot_product_attention` function, which Hugging Face's Transformers library uses by default, usually avoids storing the grid on a CUDA GPU,[^pytorchSdpaDocs2026][^transformers2026attentionBackends] and activations then grow about linearly with length.[^dao2022] Find out which path you are on before you trust either number. Two common calls keep it: Transformers' `output_attentions=True` works only on the eager path, and PyTorch's own `nn.MultiheadAttention` takes that path unless you pass `need_weights=False`.[^pytorchMhaMasks2026] Here is what the grid costs when it is stored:

<!-- leetllm: test, output=show, id=reader-gpu-memory-budget -->
```python title="memory-budget.py"
PARAMETERS = 7_000_000_000
GPU_GB = 24
BYTES = 2  # FP16 or BF16

STEPS = [("load weights", 1), ("backward", 1), ("first step", 2)]
used = 0
for line, numbers_per_parameter in STEPS:
    used += PARAMETERS * numbers_per_parameter * BYTES / 1e9
    verdict = "fits" if used <= GPU_GB else "OUT OF MEMORY"
    print(f"{line:12s}: {used:3.0f} GB  {verdict}")

batch, width = 32, 768
print("\ntokens  activation tensor  score grid")
for tokens in [128, 512, 2048]:
    activation_mb = batch * tokens * width * BYTES / 1e6
    grid_mb = batch * tokens * tokens * BYTES / 1e6
    print(f"{tokens:6d}  {activation_mb:14.1f} MB  {grid_mb:7.1f} MB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
load weights:  14 GB  fits
backward    :  28 GB  OUT OF MEMORY
first step  :  56 GB  OUT OF MEMORY

tokens  activation tensor  score grid
   128             6.3 MB      1.0 MB
   512            25.2 MB     16.8 MB
  2048           100.7 MB    268.4 MB
```
<!-- leetllm: output:end -->

Multiply the length by 16 and the activation tensor grows 16 times, while the grid grows 256 times. In the last row, at 2,048 tokens, the grid has overtaken the tensor that dwarfed it at 128, and that is one grid. Twelve layers of 12 heads would make it about 39 GB. So on the eager path, one long document can ruin a run that handled every short one. Batch size and length look like two equal knobs, and for this term they are not. Halving the batch halves the grid, and halving the length quarters it.

Here is the habit that this arithmetic should give you. Before any long run, push one batch of your longest sequences through a complete step, including `optimizer.step()`, because Adam usually creates its averages on that first step. If the run is going to run out of memory, you want to find out in the first minute and not at hour six, when the longest document finally comes up in the shuffle.

```checkpoint
Your run goes out of memory during `loss.backward()`. Why did it not fail when the model loaded, and what would you try first?
---
Loading only needed room for the weights. By the backward pass, memory also holds the activations from the forward pass and the gradients being created. First check the fixed terms. If weights, gradients, and optimizer state alone exceed the GPU, no batch size will save you, and you need a bigger GPU, more GPUs, or a method like LoRA from Part 3. If they fit, lower the batch size first, because that keeps your data intact, and use gradient accumulation from Chapter 5 if you need the larger effective batch. Shorten the sequences only if you can afford to lose the end of them.
```

## Question two: is the GPU really working?

Your memory bar reads 95 percent, and you are processing a handful of examples per second. It is tempting to read the first number as a sign of a hard-working machine. It is not. Memory tells you what has been allocated, and nothing about what is running.

Go back to the table of who does what. Tokenizing, padding, and assembling batches all happen on the CPU. If the CPU cannot prepare batches fast enough, an expensive GPU sits and waits with its memory full. The sign is GPU utilization that keeps falling to zero. In that case, look at data loading and anything that makes the host wait before you blame the math, because no amount of tuning kernels will help a GPU that has nothing to do.

The memory number itself also needs care. The usual first tool is `nvidia-smi`, which is good for checking that the GPU is visible, that your process is attached, and roughly how full it is.[^nvsmi] It will often show more than your tensors take, because PyTorch keeps freed blocks in a cache for quick reuse,[^pytorchCudaSemantics2026] and because it counts the whole GPU context, which PyTorch's allocator does not track.[^nvsmi][^pytorchForumCudaContext2021] PyTorch gives you two more precise numbers:

- `torch.cuda.memory_allocated()` counts the memory held by live tensors.
- `torch.cuda.memory_reserved()` counts the larger pool that its cache manages.

This explains a popular non-fix. `torch.cuda.empty_cache()` returns unused cached blocks for other programs to use. It cannot free a live tensor or shrink what your step needs, and your job could already reuse those blocks. If you are running out of memory, calling it in a loop mostly adds overhead. It can reduce fragmentation in some cases, but it does not give PyTorch more memory.[^pytorchEmptyCache2026]

## Question three: is the number you measured real?

A teammate wraps a timer around a forward pass and reports 2 milliseconds, on a model that should take far longer. The code runs, the answers are right, and the timer is telling the truth about the wrong thing.

PyTorch queues CUDA operations and returns without waiting for them.[^pytorchCudaSemantics2026] The operations in one queue keep their order, so later work always sees correct results, and the answers give nothing away. Only a clock can catch it.

<figure>
  <img src="illustrations/_generated/step_timeline_dark.png" alt="A timeline in milliseconds with two lanes. In the Python lane on the CPU, queueing the work takes 2 ms, then Python is free to move on. In the GPU lane, the forward pass runs from 2 ms to 42 ms. A timer read right after the call stops at 2 ms. A timer read after synchronize stops at 42 ms, when the work has really finished." />
  <figcaption>Suppose queueing takes 2 ms and the kernels take 40 ms. A timer read right after the call reports the 2 ms. To time the work, you have to wait for it before you read the clock.</figcaption>
</figure>

You can watch this happen without a GPU, because a Python thread pool behaves the same way. Handing it a job returns at once, and the work carries on in the background:

<!-- leetllm: test, output=show, id=reader-gpu-async-timer -->
```python title="async-timer.py"
import time
from concurrent.futures import ThreadPoolExecutor

def device_work():
    time.sleep(0.2)  # stands in for kernels running on the GPU
    return "done"

with ThreadPoolExecutor(max_workers=1) as device:
    start = time.perf_counter()
    job = device.submit(device_work)
    after_call_ms = (time.perf_counter() - start) * 1000
    job.result()  # wait for the work, as a synchronize would
    after_wait_ms = (time.perf_counter() - start) * 1000

print(f"timer read after the call: {round(after_call_ms, -2):.0f} ms")
print(f"timer read after waiting:  {round(after_wait_ms, -2):.0f} ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
timer read after the call: 0 ms
timer read after waiting:  200 ms
```
<!-- leetllm: output:end -->

On a real GPU, the wait is `torch.cuda.synchronize()`. Wait once before you start the clock, so that earlier queued work is not billed to you, and once before you stop it. Run the operation a few times first as well, because the first calls can include setup work. This version also runs on a CPU, where the waits simply do nothing.

```text title="Install first"
pip install torch numpy
```

<!-- leetllm: test, output=show, id=reader-gpu-honest-timer, deps=torch,numpy -->
```python title="honest-timer.py"
import time

import torch

device = "cuda" if torch.cuda.is_available() else "cpu"

def wait_for_device():
    if device == "cuda":
        torch.cuda.synchronize()

def timed_ms(work):
    wait_for_device()
    start = time.perf_counter()
    result = work()
    wait_for_device()
    return result, (time.perf_counter() - start) * 1000

x = torch.randn(256, 256, device=device)
for _ in range(3):  # warm up: the first calls can include setup
    x @ x

result, elapsed_ms = timed_ms(lambda: x @ x)
assert elapsed_ms > 0  # print this on your machine; it varies with the hardware
print("result shape:", list(result.shape))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
result shape: [256, 256]
```
<!-- leetllm: output:end -->

The same queue explains the opposite confusion too. Any line that needs a value back on the CPU, such as `loss.item()` or a `print` of a tensor, has to wait for everything queued before it. So a profile of your training loop may blame an innocent `loss.item()` for time that the forward pass really spent. When a line of Python looks strangely slow, ask what it was waiting for.

```checkpoint
A profile of your training loop says `model(x)` takes 2 ms and the `loss.item()` that logs the loss takes 40 ms. A teammate proposes deleting the logging to save 40 ms on every step. What do you expect to happen?
---
Very little. Those 40 ms are the GPU's forward pass, and `loss.item()` is simply the first line that waited for it. Delete the logging and the wait moves to some other line. Before and after any change like this, compare examples per second over many steps, not the time around one line.
```

## What goes wrong in production

Match what you see to the first row that fits, and change one thing at a time.

| What you see | Likely cause | Check first |
|---|---|---|
| `is_available()` is `False` | Driver, visibility, or PyTorch build mismatch | Compare `nvidia-smi` with `torch.version.cuda` |
| Error says tensors are on different devices | The model and one batch field disagree | Move every tensor that the model or the loss uses |
| The model loads, then backward runs out of memory | Activations and gradients exceed free memory | Add up weights, gradients, and optimizer state. If they fit, lower the batch size, then the length, and read the allocation size in the message |
| The effective batch must stay large | A smaller batch changes training | Accumulate gradients across smaller batches, as in Chapter 5 |
| Loss or gradients become NaN at FP16 | Overflow, or a bad mixed-precision setup | Turn mixed precision off. If the NaN goes away, the precision path is implicated; inspect dtypes, scaling, and any changed kernels before accepting a fix |
| A timer says the GPU took almost no time | The timer measured only the queueing | Warm up, then call `synchronize` before each clock read |
| Memory is high, but examples per second are low | Full memory is not a busy GPU | Look at data loading and host waits before the math |
| GPU utilization keeps falling to zero | Batches arrive late, or the host is waiting | Measure time spent waiting for the next batch |

## What you can do now

You can look at a parameter count and estimate memory for serving and for training before you rent anything, and you can say which line of the loop will fail first. You know what FP32, FP16, and BF16 each give up, what `nan` is telling you, why a full GPU can be an idle one, and how to get a time you can trust.

That finishes the foundations. You have a loss and a way to reduce it, the matrix multiplications that do the work, probabilities and the cost of being wrong, gradients, a real training loop, and the machine it runs on.

Look back over these six chapters, though, and you will notice an assumption running through them. Nearly every example began with numbers. The exception, our character model, got away with a table of single characters, because it only ever had to look one character back. Real models read far longer stretches of text, and they need a better unit than the character to do it cheaply. And the most dangerous letter in this chapter's memory budget, $T$, is a count of something we have not defined. The same count sets your bill and decides how much of a document fits in front of the model.

So what exactly is a token, and who decides where one ends? Part 1 starts there.

<!-- leetllm: edition:reader:end -->
