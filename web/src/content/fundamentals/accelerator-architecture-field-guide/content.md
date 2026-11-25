---
{
  "id": "accelerator-architecture-field-guide",
  "title": "Accelerator Architecture Field Guide",
  "slug": "accelerator-architecture-field-guide",
  "section": "GPU Systems & LLM Inference",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 13,
  "coverImage": "social_banner.png",
  "shortDescription": "A chip with twice the peak arithmetic can still leave decode almost unchanged. Follow one projection and see what to remeasure on NVIDIA, AMD, TPU, Trainium, and Apple silicon.",
  "keyConceptsTested": [
    "Prefill versus decode arithmetic intensity",
    "SIMT thread execution and systolic matrix dataflow",
    "Accelerator memory hierarchy and the host-PCIe bandwidth cliff",
    "CUDA warp and AMD CDNA wavefront mapping",
    "TPU Pallas HBM and VMEM tiling",
    "Trainium NKI SBUF and PSUM ownership",
    "Apple MPS unified-memory boundaries",
    "Accelerator interconnect topology and tensor-parallel communication",
    "Hardware evaluation gates from numerical precision to tail latency"
  ],
  "prerequisites": [
    "model-parallelism-for-llm-inference",
    "cuda-gpu-computing-for-ml"
  ],
  "relatedQuestions": [
    "gpu-kernel-performance-engineering-lab",
    "deep-dive-nccl",
    "jax-for-ml-research",
    "cuda-gpu-computing-for-ml",
    "llm-deployment-gpu-serving-autoscaling"
  ],
  "companies": [
    "NVIDIA",
    "AMD",
    "Google",
    "Amazon",
    "Apple"
  ]
}
---

An 8B code assistant ingests eight 4,096-<span data-glossary="token">token</span> prompts in a blink, yet stumbles generating answers token by token. Buying a chip with double the peak TFLOP/s can leave generation latency almost unchanged. Building on [CUDA for ML Training](/learn/cuda-gpu-computing-for-ml) and [Model Parallelism](/learn/model-parallelism-for-llm-inference), follow one feed-forward projection across NVIDIA, AMD, TPU, Trainium, and Apple silicon to see who owns execution, local memory, and multi-chip links.

## One projection, two different machines inside it

Take one <span data-glossary="bf16">BF16</span> projection $Y_{M \times N} = X_{M \times K} W_{K \times N}$ with $K = 4{,}096$ and $N = 11{,}008$ (an 86 MiB weight <span data-glossary="matrix">matrix</span>). Across eight 4,096-token requests, **<span data-glossary="prefill">prefill</span>** batches $M = 32{,}768$ rows together (2,736 FLOP/byte ideal <span data-glossary="arithmetic-intensity">arithmetic intensity</span>), whereas **decode** supplies $M = 8$ rows (8.0 FLOP/byte, a **343x** reuse gap).

<figure>
  <img src="illustrations/_generated/phase_reuse_gap_dark.png" alt="Two schematic matrix-product lanes use the same 86 MiB BF16 weight matrix W. Both mark the fourth of four output-channel partitions in W and Y; that W tile is reused across four aggregated row bands containing eight decode rows or 32,768 prefill rows. The shapes give 8.0 versus 2,736.0 ideal FLOP per byte under the one-read traffic model; row bands are aggregates, and the figure reports no hardware utilization." />
  <figcaption>The same 86 MiB weight matrix feeds 8 decode rows (8.0 FLOP/byte) or 32,768 prefill rows (2,736.0 FLOP/byte).</figcaption>
</figure>

### Compare work and traffic before predicting time

On a 200 TFLOP/s, 1 TB/s accelerator (ridge point 200 FLOP/byte), the roofline floor $t_{\text{floor}} = \max(F/P, Q/B)$ puts prefill at `14.775 ms` (compute-bound) and decode at `0.090 ms` (memory-bound).[^williams2009] Doubling compute to 400 TFLOP/s halves prefill to `7.387 ms` while leaving decode pinned at `0.090 ms`.

<figure>
  <img src="illustrations/_generated/projection_roofline_terms_dark.png" alt="Paired compute F/P and traffic Q/B bars use independent linear time axes: 0-15 ms for prefill and 0-0.10 ms for decode. Bars use full-precision model values and labels round to 0.001 ms. With 1 TB/s bandwidth and compute ceilings of 200 and 400 TFLOP/s, prefill values display as 14.775 and 7.387 ms compute versus 1.080 ms traffic; decode values display as 0.004 and 0.002 ms compute versus 0.090 ms traffic. A compute-only 0-0.005 ms inset expands the short decode bars 20 times; the exact compute times are 0.00360710144 and 0.00180355072 ms, or 72.142% and 36.071% of that scale. Doubling compute halves F/P time but leaves the decode maximum at 0.090 ms." />
  <figcaption>Doubling compute from 200 to 400 TFLOP/s halves compute-bound prefill (14.775 to 7.387 ms) but leaves memory-bound decode unchanged at 0.090 ms.</figcaption>
</figure>

## Memory paths: capacity belongs to an owner

Registers, shared memory, L2 cache, HBM, and host PCIe sit at distinct ownership tiers. Take **H100 SXM** as a concrete anchor: 64K 32-bit registers (256 KiB) and 228 KB shared memory per SM (max 227 KB/block), 50 MB L2, and 80 GB HBM at 3.35 TB/s.[^nvidiahoppertuning2026][^nvidia2026h100]

### How much offload is enough to hurt?

Because HBM (3.35 TB/s) is ~52x faster than a 64 GB/s PCIe link, streaming even a tiny fraction of a 16 GB BF16 model from host RAM destroys step latency:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="partial-offload-traffic.py"
import numpy as np

weight_bytes, hbm_rate, host_rate = 16e9, 3.35e12, 64e9
fracs = np.array([0.0, 0.01, 0.10, 1.0], dtype=np.float64)
hbm_s = weight_bytes * (1.0 - fracs) / hbm_rate
host_s = weight_bytes * fracs / host_rate
total_s = hbm_s + host_s
baseline_s = weight_bytes / hbm_rate
for frac, hs, ts in zip(fracs, host_s, total_s):
    print(f"host={frac:4.0%}: {ts * 1000:6.1f} ms ({ts / baseline_s:4.1f}x, host share {hs / ts:5.1%})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
host=  0%:    4.8 ms ( 1.0x, host share  0.0%)
host=  1%:    7.2 ms ( 1.5x, host share 34.6%)
host= 10%:   29.3 ms ( 6.1x, host share 85.3%)
host=100%:  250.0 ms (52.3x, host share 100.0%)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/offload_transfer_cliff_dark.png" alt="One weight stream is split between resident and host reads on separate time scales." />
  <figcaption>Offloading just 1% of 16 GB weights across a 64 GB/s host link slows sequential transfer 1.5x; offloading 10% stretches transfer 6.1x (85.3% waiting on PCIe).</figcaption>
</figure>

## Thread execution and matrix dataflow

Modern accelerators compute $D = AB + C$ using two distinct hardware philosophies:

### SIMT warps and matrix cores

NVIDIA GPUs execute 32-thread **warps**; AMD CDNA GPUs execute 64-thread **wavefronts**.[^cudaProgrammingGuide2026][^amdhipmodel2026] Matrix ops dispatch to Tensor Cores (`mma.sync`, Hopper 128-thread `wgmma`[^nvidiaPtxIsa2026]) or AMD Matrix Cores, while scalar/vector pipes handle normalization, RoPE, and <span data-glossary="softmax">softmax</span>.

### Systolic arrays

Google TPU MXUs and AWS Trainium Tensor Engines flow operands through a grid of processing elements (PEs) without returning partial sums to memory between multiplies.[^google2017tpuDataflow][^awsneuroncorev32026] In a weight-stationary array, $B$ stays in PE registers while staggered $A$ rows stream right and partial sums accumulate downward. Padding 8 decode rows into a 128-row systolic tile leaves $8/128 = 6.25\%$ active rows in that tile.

<figure>
  <img src="illustrations/_generated/systolic_matrix_dataflow_dark.png" alt="Four ordered states hold the 2 by 2 B weights in place as A activations move right and partial sums move down, producing 19, 22, 43, and 50." />
  <figcaption>In a weight-stationary systolic array, $B$ weights stay stationary in PE registers while $A$ activations advance right and partial sums flow downward, producing $19 = 1\times 5 + 2\times 7$ first.</figcaption>
</figure>

## The invariant behind every accelerator

Across all five accelerator families, four questions locate any bottleneck: (1) which group executes one instruction together, (2) which fast memory it shares, (3) who schedules large-to-local transfers, and (4) which physical link carries multi-device collectives.

<figure>
  <img src="illustrations/_generated/memory_owner_paths_dark.png" alt="One projection tile passes through GPU memory owners, while peer traffic uses a separate device link." />
  <figcaption>One tiled path streams $W$ through HBM and L2 into block shared memory and registers, writing $Y$ back to HBM, while cross-device collectives traverse a separate interconnect.</figcaption>
</figure>

| Stack & target | Execution unit | Fast local storage | HBM movement | Multi-device fabric | First porting check |
|---|---|---|---|---|---|
| **NVIDIA CUDA** (Hopper / Blackwell)[^nvidiahoppertuning2026][^nvidiablackwelltuning2026] | 32-thread warp in SM block | Registers, shared memory, Hopper DSMEM | Explicit loads, compiler, TMA | NVLink / NVSwitch (<span data-glossary="nccl">NCCL</span>) | Native binary target (`compute_90a` PTX won't run on Blackwell); tile vs. occupancy |
| **AMD ROCm/HIP** (CDNA 3/4)[^amdrocm7142026] | 64-thread wavefront on CU | Vector regs + LDS | HIP kernels / libraries | Infinity Fabric (RCCL) | 32-lane warp assumptions; exact `gfx942` / `gfx950` target |
| **Google TPU v6e** (JAX/Pallas)[^googletpuv6e2026] | TensorCore (2 MXUs + vector + scalar) | VMEM + SMEM | Compiler-pipelined `BlockSpec` DMA | ICI slice topology | Trailing tile divisibility; grid order for VMEM reuse |
| **AWS Trainium2** (Neuron/NKI)[^awsnkimemory2026] | Tensor, vector, scalar, GPSIMD engines | SBUF + PSUM | Explicit DMA HBM $\leftrightarrow$ SBUF | NeuronLink-v3 (4x4 torus) | Engine assignment; live-set spills from PSUM/SBUF |
| **Apple Silicon** (PyTorch MPS)[^appleMetalPytorch2026] | MPS Graph / Metal GPU | Caches + threadgroup | Unified physical RAM | Single host | Unsupported op CPU fallback (`float64` fails); OS RAM headroom |

## NVIDIA Hopper and Blackwell: preserve mapping, retune pressure

Hopper introduced the Tensor Memory Accelerator (TMA) and thread-block clusters, while Blackwell extends the same SIMT model with updated occupancy and register/shared budgets.[^nvidiahoppertuning2026][^nvidiablackwelltuning2026] When porting Hopper to Blackwell, remember that architecture-conditional PTX like `compute_90a` is **not** forward-compatible with Blackwell; compile native targets or portable PTX and retune.[^nvidiaBlackwellCompatibility2026]

### A CUDA failure that looks like architecture progress

Doubling a decode kernel's shared-memory tile can improve per-block reuse while cutting resident blocks per SM and worsening <span data-glossary="tpot">TPOT</span>. Always inspect occupancy, eligible warps, and global traffic together before keeping a larger tile.

## AMD CDNA and ROCm: familiar syntax, different lane contract

HIP mirrors CUDA syntax (`threadIdx`, `blockIdx`, LDS), yet **CDNA 3 (`gfx942`, MI300) and CDNA 4 (`gfx950`, MI350) execute 64-thread wavefronts**.[^amdhipmodel2026][^amdrocm7142026] Porting a CUDA reduction that hardcodes 32-lane masks silently drops lanes 32 through 63 of every wave:

<!-- leetllm: test, output=show -->
```python title="wave-width-ownership.py"
physical_wave = 64

def emitted_sum(values, consumed_lanes):
    return sum(sum(values[s:s + consumed_lanes]) for s in range(0, len(values), physical_wave))

for n in (63, 64, 65):
    vals = list(range(1, n + 1))
    expected, faulty, fixed = sum(vals), emitted_sum(vals, 32), emitted_sum(vals, 64)
    assert fixed == expected
    print(f"n={n}: expected={expected}, assumes_32={faulty}, uses_64={fixed}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
n=63: expected=2016, assumes_32=528, uses_64=2016
n=64: expected=2080, assumes_32=528, uses_64=2080
n=65: expected=2145, assumes_32=593, uses_64=2145
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/simt_wave_ownership_dark.png" alt="A 64-lane CDNA wave loses lanes 33–64 when a helper consumes only the first 32, even when input 65 starts another wave." />
  <figcaption>A CUDA-ported helper reading only 32 lanes drops lanes 33 through 64 on a 64-lane CDNA wavefront; always derive reductions from `warpSize` and test sizes 63, 64, and 65.</figcaption>
</figure>

## TPU and Pallas: map tiles, not CUDA threads

Each TPU v6e TensorCore combines two MXUs with vector and scalar units.[^googletpuv6e2026] In JAX's **Pallas**, `BlockSpec` declares which <span data-glossary="hbm">HBM</span> slices enter VMEM so the compiler pipelines DMA transfers with MXU math.[^googlepallastpu2026] Because Pallas traverses grids lexicographically, **grid order controls which operand stays resident in VMEM**.

### Which operand does grid order reuse?

For a $2 \times 2$ output grid with one VMEM slot per operand, 1 KiB activation tiles ($X$), and 4 KiB weight tiles ($W$), traversing rows-first reuses the larger weight tiles and cuts HBM input traffic from 18 KiB to 12 KiB:

<!-- leetllm: test, output=show -->
```python title="tile-order-traffic.py"
orders = {
    "columns first": [(i, j) for i in range(2) for j in range(2)],
    "rows first": [(i, j) for j in range(2) for i in range(2)],
}
for name, order in orders.items():
    prev_i = prev_j = None
    x_loads = w_loads = 0
    for i, j in order:
        x_loads += i != prev_i
        w_loads += j != prev_j
        prev_i, prev_j = i, j
    print(f"{name:13s}: X={x_loads}, W={w_loads}, input={x_loads * 1 + w_loads * 4} KiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
columns first: X=2, W=4, input=18 KiB
rows first   : X=4, W=2, input=12 KiB
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/pallas_grid_reuse_dark.png" alt="Two grid orders visit the same four Y tiles but retain different one-tile X and W slots, yielding 18 KiB or 12 KiB of input traffic." />
  <figcaption>Rows-first traversal retains the heavier 4 KiB weight tiles across consecutive grid steps, dropping input HBM traffic from 18 KiB to 12 KiB.</figcaption>
</figure>

## Trainium and NKI: assign work to engines and memories

Trainium2's NeuronCore-v3 separates tensor, vector, scalar, and GPSIMD engines over three software-managed memory levels: **HBM**, on-chip **SBUF**, and partial-sum **PSUM**.[^awsneuroncorev32026][^awsnkimemory2026] Systems connect 16 chips in a 4x4 2D torus over NeuronLink-v3.[^awstrn2arch2026]

### An NKI failure that keeps answers correct

Over-aggressive kernel fusion extends intermediate tile lifetimes past SBUF capacity, forcing compiler spills to HBM (or PSUM spills into SBUF) that slow execution even while launching fewer kernels. Shrink tiles or split fusion until live sets stay on chip.

<figure>
  <img src="illustrations/_generated/nki_live_set_and_spills_dark.png" alt="A schematic split schedule ends an intermediate lifetime, while fusion extends the live set beyond SBUF and spills through HBM; PSUM pressure spills first to SBUF." />
  <figcaption>Fusion can extend live sets past SBUF and spill through HBM; PSUM overflow spills to SBUF first and reaches HBM only if SBUF overflows too.</figcaption>
</figure>

## Apple MPS: unified memory changes transfer, not capacity

PyTorch's MPS backend compiles graphs to Apple's integrated GPU (not the Neural Engine) over one shared physical memory pool.[^appleMetalPytorch2026][^pytorchMpsBackend2026][^applempsgraph2026][^mlx2026] Unified memory removes PCIe copies, yet 16 GB of 8B BF16 weights still compete directly with <span data-glossary="kv-cache">KV cache</span>, activations, macOS, and apps. Enabling `PYTORCH_ENABLE_MPS_FALLBACK=1` can silently drop unsupported ops onto CPU with sync cliffs, while `float64` allocations still fail outright on MPS.[^pytorchMpsEnvVars2026][^pytorchMpsTensorAllocation2026]

<figure>
  <img src="illustrations/_generated/mps_shared_capacity_dark.png" alt="MPS Graph and CPU fallback use separate execution owners that draw from one finite unified physical memory pool." />
  <figcaption>MPS GPU kernels and CPU fallback share one finite unified RAM pool alongside macOS and other applications.</figcaption>
</figure>

## Interconnect topologies: count exchanges, then measure the route

<span data-glossary="tensor-parallelism">Tensor parallelism</span> (TP) exchanges activations twice per dense transformer layer (attention output + MLP down-projection), totaling **160 all-reduces per decode step** on an 80-layer model.[^shoeybi2019] At batch 8, hidden 8,192, BF16, each logical payload is just 128 KiB (a $p$-rank ring sends $\frac{2(p-1)}{p} \times 128\text{ KiB}$ per rank), so fixed collective startup latency dominates: 160 calls at 5 µs vs. 20 µs add `0.8 ms` vs. `3.2 ms` per decode step.[^megatronCoreParallelism2026][^nccltestsPerformance2026]

| Domain | Reference fabric | Porting check |
|---|---|---|
| HGX H100 / B200 (8 GPU) | NVLink 900 GB/s (H100) / 1,800 GB/s (B200)[^nvidia2026hgxComponents] | Measure small-message all-reduce latency, not peak spec |
| GB200 NVL72 | 72-GPU rack NVLink domain[^nvidia2026gb200nvl72] | Match TP/EP shard degrees to model heads, not raw domain size |
| MI300X (8 GPU) | Dedicated Infinity Fabric links[^amdrccl2026] | Record exact rank subset used by RCCL |
| Cross-node (IB / RoCE) | Switched NIC fabric | Compare intra-node TP + inter-node PP vs. cross-node TP[^vllm2026distributed] |

## Choose programming depth after the bottleneck

Stop at the highest software layer that hits your correctness and SLO targets: start at framework graphs (PyTorch/JAX), tune compilers and vendor libraries (`torch.compile`, XLA, cuBLAS, hipBLASLt, MPS Graph), drop to portable kernel DSLs (<span data-glossary="triton-language">Triton</span>, Pallas) only for proven hotspots, and reserve CUDA C++/HIP/NKI for hardware features higher layers cannot express.

## Read failures as ownership mistakes

| Symptom | Ownership error | Disambiguating check & first fix |
|---|---|---|
| Fast prefill, poor TPOT | Too few decode rows per weight read | Increase continuous-batch rows or test quantized/small-$M$ kernels |
| Wrong output only on AMD | 32-lane warp assumption on 64-lane wave | Replace hardcoded 32 with `warpSize`; test `n = 63, 64, 65` |
| TPU output right, HBM traffic up | Grid order lost VMEM reuse | Reorder grid axes so heavier operand stays resident |
| Fused NKI kernel slows down | Live tiles spilled from PSUM/SBUF | Check spill counters; shrink tile or split fusion |
| MPS latency cliff | Unsupported op fell back to CPU | Profile CPU gaps; replace op or drop `float64` |
| Multi-GPU TPOT regresses | Shards crossed slower interconnect | Remap TP inside fast NVLink/IF domain; use PP across nodes |

## The four-gate hardware evaluation funnel

Before ranking accelerators by dollars per million tokens, disqualify broken, OOM, or slow candidates in strict order:

<figure>
  <img src="illustrations/_generated/gate_decision_path_dark.png" alt="Four acceptance gates run in order. Gate 1 checks correctness and task quality against declared tolerances and task criteria; failing quality routes to Revise config. Gate 2 checks per-device memory allocations plus measured reserve; OOM or tight headroom routes to Disqualified. Gate 3 requires p95 TTFT below 450 ms and p95 TPOT below 45 ms; tail latency failure routes to Disqualified. Passing all three gates sends the candidate to Gate 4, which ranks useful output by SLO-compliant tokens per dollar." />
  <figcaption>Evaluate hardware strictly in order: correctness and precision, memory fit, tail latency SLOs, and only then joint-SLO goodput per dollar.</figcaption>
</figure>

| Gate | Requirement | Disqualifying failure |
|---|---|---|
| **1. Correctness & precision** | Match BF16/reference tolerances and task quality across target dtypes (FP8, MXFP4, NVFP4) | NaN/Inf or task accuracy drop → revise config |
| **2. Memory fit & residency** | Weights + KV cache + workspace + headroom fit per device (including OS on Apple Silicon) | OOM or unbudgeted offload → disqualify |
| **3. Latency SLOs** | Pass both p95 <span data-glossary="ttft">TTFT</span> (<450 ms) and p95 TPOT (<45 ms) under production concurrency | Either tail misses limit → disqualify |
| **4. Goodput & cost** | Count output tokens from requests meeting **both** latency limits divided by total interval cost | Rank passing setups by eligible tokens per dollar |

Watch the joint-compliance trap: if request 0 misses TTFT and request 1 misses TPOT in a 20-request trace, individual p95 checks both pass at 95%, yet **joint** compliance drops to 90% (18 of 20 requests):

<!-- leetllm: test, output=show -->
```python title="separate-tails-and-joint-success.py"
from math import ceil

requests = [(500 if i == 0 else 100, 60 if i == 1 else 20, 100) for i in range(20)]
p95 = lambda xs: sorted(xs)[ceil(0.95 * len(xs)) - 1]
joint = [r for r in requests if r[0] < 450 and r[1] < 45]
print(f"p95 TTFT={p95([r[0] for r in requests])} ms, p95 TPOT={p95([r[1] for r in requests])} ms")
print(f"joint pass={len(joint) / 20:.0%}, eligible goodput={sum(r[2] for r in joint) / 10:.0f} tok/s")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
p95 TTFT=100 ms, p95 TPOT=20 ms
joint pass=90%, eligible goodput=180 tok/s
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/joint_slo_goodput_dark.png" alt="Two overlapping latency filters each pass 19 requests, but only their common 18 requests pass both and contribute 180 useful tokens per second." />
  <figcaption>Separate p95 checks pass 19/20 (95%) each, yet only 18/20 (90%) satisfy both TTFT and TPOT jointly for 180 eligible tok/s.</figcaption>
</figure>

```mastery-quiz
[
  {
    "question": "An isolated op runs 6 TFLOPs with 12 GB traffic on a 300 TFLOP/s, 1.5 TB/s chip. Under the roofline floor, what happens when compute doubles to 600 TFLOP/s while bandwidth stays fixed?",
    "options": [
      "Floor drops 20 ms -> 8 ms; traffic bounds both.",
      "Floor drops 20 ms -> 10 ms; compute bounds both.",
      "Floor drops 8 ms -> 4 ms; compute bounds both.",
      "Floor drops 28 ms -> 18 ms; serial sum bounds both."
    ],
    "answer": "Floor drops 20 ms -> 10 ms; compute bounds both.",
    "explanation": "Compute time is 6e12/300e12 = 20 ms (halving to 10 ms at 600 TFLOP/s), still above traffic time 12e9/1.5e12 = 8 ms."
  },
  {
    "question": "Sequential decode streams 8 GB of weights: 5% over a 40 GB/s host link and 95% from 1 TB/s HBM. What total transfer time and slowdown vs. all-HBM follow?",
    "options": [
      "10.0 ms and 1.25x",
      "8.0 ms and 1.00x",
      "200.0 ms and 25.00x",
      "17.6 ms and 2.20x"
    ],
    "answer": "17.6 ms and 2.20x",
    "explanation": "0.4 GB / 40 GB/s = 10.0 ms plus 7.6 GB / 1000 GB/s = 7.6 ms gives 17.6 ms total, 2.20x slower than 8.0 ms all-resident."
  },
  {
    "question": "A 64-lane CDNA wavefront owns inputs 1..66 (two waves), while a CUDA-ported helper sums only the first 32 lanes of each wave. What faulty and correct totals result?",
    "options": [
      "Faulty 528; correct 2,211.",
      "Faulty 659; correct 2,211.",
      "Faulty 2,145; correct 2,211.",
      "Faulty 2,211; correct 2,211."
    ],
    "answer": "Faulty 659; correct 2,211.",
    "explanation": "Wave 1 sums 1..32 = 528 (omitting 33..64); wave 2 sums 65 + 66 = 131, giving 659 instead of 66*67/2 = 2,211."
  },
  {
    "question": "On a 2x2 Pallas output grid with one VMEM slot per operand, X tiles are 2 KiB and W tiles are 5 KiB. Compare columns-first (0,0),(0,1),(1,0),(1,1) vs. rows-first (0,0),(1,0),(0,1),(1,1).",
    "options": [
      "Columns-first 14 KiB; rows-first 14 KiB.",
      "Columns-first 18 KiB; rows-first 24 KiB.",
      "Columns-first 24 KiB; rows-first 24 KiB.",
      "Columns-first 24 KiB; rows-first 18 KiB."
    ],
    "answer": "Columns-first 24 KiB; rows-first 18 KiB.",
    "explanation": "Columns-first loads X twice and W four times (2*2 + 4*5 = 24 KiB); rows-first loads X four times and W twice (4*2 + 2*5 = 18 KiB)."
  },
  {
    "question": "A 24-layer dense model runs 2 reductions/layer at batch 6, hidden 1,024, BF16 over a 4-rank ring all-reduce with 15 us startup per call. What per-rank bytes/call and serialized startup total per step follow?",
    "options": [
      "12 KiB/call; 0.36 ms.",
      "24 KiB/call; 0.72 ms.",
      "18 KiB/call; 0.36 ms.",
      "18 KiB/call; 0.72 ms."
    ],
    "answer": "18 KiB/call; 0.72 ms.",
    "explanation": "Logical payload is 6*1024*2 = 12 KiB; a 4-rank ring sends 2*(4-1)/4 = 1.5x = 18 KiB per rank. 48 calls * 15 us = 0.72 ms."
  }
]
```

> **Next:** Continue to [GPU Profiling & Kernel Optimization Lab](/learn/gpu-kernel-performance-engineering-lab).
