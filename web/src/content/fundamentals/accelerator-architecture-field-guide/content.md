---
{
  "id": "accelerator-architecture-field-guide",
  "title": "Accelerator Architecture Field Guide",
  "slug": "accelerator-architecture-field-guide",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 9,
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
    "gpu-profiling-correctness-benchmarking",
    "deep-dive-nccl",
    "jax-for-ml-research",
    "mps-metal-mac-ml-training",
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

An 8-billion-parameter code assistant receives eight repository prompts, each 4,096 <span data-glossary="token">tokens</span> long. It ingests the prompts in a flash, yet stumbles when generating its answers token by token. A chip advertised with double the peak arithmetic per second sounds tempting, but it might leave generation speed almost completely unchanged. What is the machine actually waiting for?

The [CUDA foundation](/learn/cuda-gpu-computing-for-ml) already gave you kernels, warps, and device memory. The [model-parallelism lesson](/learn/model-parallelism-for-llm-inference) shows how to trace links carrying sharded data. Follow both through this projection: how the chip schedules the work, and where each <span data-glossary="tensor">tensor</span> or collective travels.

## One projection, two different machines inside it

Consider a feed-forward projection layer. Each input row has $K = 4{,}096$ features, and the projection produces $N = 11{,}008$ features. Its simplified <span data-glossary="matrix">matrix</span> multiplication is:

$$
Y_{M \times N} = X_{M \times K} W_{K \times N}
$$

`M` is the number of token rows processed together. <span data-glossary="bf16">BF16</span> stores each matrix element in 2 bytes. The weight matrix contains about 86 MiB, independent of phase.

During **<span data-glossary="prefill">prefill</span>**, prompt positions can be processed together. Assume the scheduler puts all eight 4,096-token prompts into this projection at once, giving $M = 32{,}768$. Chunked prefill would use smaller groups. During ordinary one-token **decode**, each active sequence contributes one new token, so the same eight requests give $M = 8$. The weight shape stays the same. What changes is how many rows can reuse each weight tile.

One output element combines 4,096 products. Counting a multiply and an add as two floating-point operations (FLOPs), one row costs about $2 \times 4{,}096 \times 11{,}008 = 90{,}177{,}536$ FLOPs. For $M$ rows:

$$
\text{FLOPs} = 2MKN
$$

For an isolated operation with cold inputs and a materialized BF16 output, count each input and weight read once and each output write once:

$$
\text{bytes} = 2(MK + KN + MN)
$$

Dividing work by traffic gives **<span data-glossary="arithmetic-intensity">arithmetic intensity</span>**, measured in floating-point operations per byte. Run the shape calculation below to compare how much work prefill and decode extract from each byte moved:

<!-- leetllm: test, output=show -->
```python title="projection-phase-intensity.py"
K = 4_096
N = 11_008
bytes_per_value = 2  # BF16

phases = {
    "prefill": 8 * 4_096,
    "decode": 8,
}

weight_mib = K * N * bytes_per_value / 2**20
print(f"weight matrix: {weight_mib:.0f} MiB")

for phase, rows in phases.items():
    flops = 2 * rows * K * N
    traffic = bytes_per_value * (rows * K + K * N + rows * N)
    intensity = flops / traffic
    print(f"{phase:7s}: M={rows:6,d}, ideal intensity={intensity:7.1f} FLOP/byte")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
weight matrix: 86 MiB
prefill: M=32,768, ideal intensity= 2736.0 FLOP/byte
decode : M=     8, ideal intensity=    8.0 FLOP/byte
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/phase_reuse_gap_dark.png" alt="Two schematic matrix-product lanes use the same 86 MiB BF16 weight matrix W. Both mark the fourth of four output-channel partitions in W and Y; that W tile is reused across four aggregated row bands containing eight decode rows or 32,768 prefill rows. The shapes give 8.0 versus 2,736.0 ideal FLOP per byte under the one-read traffic model; row bands are aggregates, and the figure reports no hardware utilization." />
  <figcaption>The same 86 MiB weight tile feeds 8 decode rows or 32,768 prefill rows, shifting arithmetic intensity from 8.0 to 2,736.0 FLOP/byte (a 343x gap) under a cold one-read traffic model.</figcaption>
</figure>

> **Key insight:** Prefill and decode execute the exact same weight matrix, yet prefill reuses each loaded weight across thousands of token rows while low-concurrency decode streams 86 MiB of weights for only 8 tokens.

Real kernels may also fuse intermediate writes, hit caches, or load <span data-glossary="quantization">quantized</span> weights, so measure HBM traffic on target hardware. Even from this first-order count, the contrast is stark. To see which resource limits each phase, add one more number: the machine's compute-to-bandwidth ratio.

### Compare work and traffic before predicting time

Pair that projection with a device offering a 200 TFLOP/s compute ceiling and 1 TB/s memory bandwidth, setting a $200\ \mathrm{FLOP/byte}$ ridge point. Below the balance, the traffic term is larger; above it, the arithmetic term is larger. This is the basic roofline model.[^williams2009]

For work $F$, bytes $Q$, compute rate $P$, and bandwidth $B$, the optimistic time is:

$$
t_{\mathrm{floor}} = \max(F/P, Q/B)
$$

The maximum assumes perfect overlap and excludes launch overhead, synchronization, contention, and work outside this projection. Compare the compute and memory-traffic lower bounds across prefill and decode:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="projection-roofline.py"
import numpy as np

K, N = 4_096, 11_008
compute_flops_s = 200e12
bandwidth_bytes_s = 1e12

phases = ("prefill", "decode")
rows = np.array([32_768, 8], dtype=np.float64)
work = 2.0 * rows * K * N
traffic = 2.0 * (rows * K + K * N + rows * N)
compute_ms = 1_000.0 * work / compute_flops_s
memory_ms = 1_000.0 * traffic / bandwidth_bytes_s
floor_ms = np.maximum(compute_ms, memory_ms)

for phase, c_ms, m_ms, f_ms in zip(phases, compute_ms, memory_ms, floor_ms):
    term = "compute" if c_ms > m_ms else "memory"
    print(f"{phase}: compute={c_ms:.3f} ms, memory={m_ms:.3f} ms, "
          f"floor={f_ms:.3f} ms ({term})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prefill: compute=14.775 ms, memory=1.080 ms, floor=14.775 ms (compute)
decode: compute=0.004 ms, memory=0.090 ms, floor=0.090 ms (memory)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/projection_roofline_terms_dark.png" alt="Paired compute F/P and traffic Q/B bars use independent linear time axes: 0-15 ms for prefill and 0-0.10 ms for decode. Bars use full-precision model values and labels round to 0.001 ms. With 1 TB/s bandwidth and compute ceilings of 200 and 400 TFLOP/s, prefill values display as 14.775 and 7.387 ms compute versus 1.080 ms traffic; decode values display as 0.004 and 0.002 ms compute versus 0.090 ms traffic. A compute-only 0-0.005 ms inset expands the short decode bars 20 times; the exact compute times are 0.00360710144 and 0.00180355072 ms, or 72.142% and 36.071% of that scale. Doubling compute halves F/P time but leaves the decode maximum at 0.090 ms." />
  <figcaption>Independent linear axes compare compute time F/P with traffic time Q/B under 200 or 400 TFLOP/s compute ceilings and a 1 TB/s bandwidth ceiling. Doubling compute halves F/P time, reducing prefill's floor from 14.775 to 7.387 ms while leaving decode's floor at 0.090 ms because Q/B dominates.</figcaption>
</figure>

Doubling the compute ceiling halves the prefill floor (`14.775 ms` to `7.387 ms`) while leaving the decode floor untouched at `0.090 ms`, because memory traffic dominates decode. In a full serving step, KV-cache reads, other layers, collective exchanges, and higher batch concurrency can shift that balance, so always confirm against target-kernel timings.

```checkpoint
Why can the same projection be compute-heavy during prefill and memory-heavy during decode?
---
Prefill applies each loaded weight tile to 32,768 token rows in this workload, while decode applies it to only 8. The large prefill matrix gets far more arithmetic from each byte moved. Decode has much lower arithmetic intensity, so weight traffic and fixed dispatch costs can dominate.
```

## Memory paths: capacity belongs to an owner

As a tile moves through an accelerator, it encounters memories with different sizes, speeds, and owners. Registers, shared memory, caches, and explicit DMA buffers serve distinct roles, and an access may skip tiers. Large memory holds the model and its histories; local storage keeps small, active tiles close to compute.

Use H100 as one concrete latency reference, then measure the other four architectures on their own paths:[^nvidiahoppertuning2026][^nvidia2026h100]

| Resource | H100 reference | What the number lets you decide |
|---|---|---|
| Register file | 64K 32-bit registers per SM, equivalent to 256 KiB | A kernel's per-thread register demand can limit resident warps; register capacity is local to each SM. |
| Shared memory | 228 KB per SM; at most 227 KB for one block | Stage tiles within the block's budget; opt-in and occupancy limits still apply. |
| L2 cache | 50 MB across the GPU | Reuse may avoid some HBM traffic; profile the target workload to see which weights remain cached. |
| H100 SXM HBM | Advertised 80 GB and 3.35 TB/s | Size resident allocations and establish a peak traffic ceiling for this SKU, then measure sustainable rates. |
| Host-to-device path | PCIe, host memory, NUMA placement, and DMA all contribute | Measure the complete path; achieved copy bandwidth depends on the entire transfer route. |

The tuning guide's older HBM summary says up to 3 TB/s; the current product table specifies 3.35 TB/s for H100 SXM. The product's PCIe SKU has different memory and interconnect specifications. Record the SKU with any number you reuse.

### How much offload is enough to hurt?

Suppose a decode step streams 16 GB of dense BF16 weights sequentially across resident HBM at `3.35 TB/s` and a PCIe host link at `64 GB/s` (without overlap or compute):

<!-- leetllm: test, output=show -->
```python title="partial-offload-traffic.py"
weight_bytes = 16e9
resident_rate = 3.35e12
host_rate = 64e9
baseline_s = weight_bytes / resident_rate

for fraction in [0.0, 0.01, 0.10, 1.0]:
    resident_s = weight_bytes * (1 - fraction) / resident_rate
    host_s = weight_bytes * fraction / host_rate
    traffic_s = resident_s + host_s
    print(f"host weights={fraction:4.0%}: traffic={traffic_s * 1000:6.1f} ms, "
          f"ratio={traffic_s / baseline_s:4.1f}x, "
          f"host share={host_s / traffic_s:5.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
host weights=  0%: traffic=   4.8 ms, ratio= 1.0x, host share= 0.0%
host weights=  1%: traffic=   7.2 ms, ratio= 1.5x, host share=34.6%
host weights= 10%: traffic=  29.3 ms, ratio= 6.1x, host share=85.3%
host weights=100%: traffic= 250.0 ms, ratio=52.3x, host share=100.0%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/offload_transfer_cliff_dark.png" alt="One weight stream is split between resident and host reads on separate time scales." />
  <figcaption>Sequential transfer time for a 16 GB weight stream split between HBM (3.35 TB/s) and PCIe (64 GB/s). Moving just 1% of weights to host RAM slows total transfer 1.5x and accounts for 34.6% of transfer time.</figcaption>
</figure>

> **Common mistake:** Assuming that offloading "just 10%" of a model to host RAM adds only 10% latency. Because HBM is roughly 52x faster than a 64 GB/s host link, a 10% host slice stretches sequential transfer time by 6.1x (85.3% of the step is spent waiting on the host link).

Prefetching, compression, compute overlap, and larger batches can soften this cliff, so profile GPU stalls whenever offload is part of your capacity plan. Once bytes are resident, the next question is how the chip turns tiles into arithmetic.

## Thread execution and matrix dataflow

A group of threads can execute one instruction together. That is SIMT. A systolic array flows values through arithmetic cells, passing operands and partial sums from neighbor to neighbor. Both execution styles can support the same matrix multiply-accumulate operation:

$$
D = A \cdot B + C
$$

### SIMT warps and matrix cores

An NVIDIA warp has 32 threads; an AMD CDNA wavefront has 64. For ordinary lane-wise arithmetic, active lanes execute the group instruction on their own operands and registers. Divergence and predication determine which lanes participate; the hardware schedules the group instruction rather than each lane's operation independently.[^cudaProgrammingGuide2026][^amdhipmodel2026]

Matrix multiplication uses specialized units: Tensor Cores on NVIDIA and Matrix Cores on AMD. Threads coordinate to issue operations such as warp-level `mma.sync` or Hopper warp-group `wgmma`. Hopper's warp group contains 128 threads. Depending on the instruction variant, the A operand comes from registers or shared memory, the B operand comes from shared memory, and accumulators occupy registers. Shared-memory operand delivery reduces some register movement; other live values and accumulators still contribute to register pressure.[^nvidiaPtxIsa2026]

The SM or CU also supports scalar, vector, and reduction work used by normalization, rotary embeddings, and sampling. Those operations use suitable execution units and scheduled instructions. Unit utilization and kernel-switch cost depend on the instruction mix and scheduling.

### Systolic arrays

Google's TPU matrix units and Trainium's tensor engines use systolic matrix dataflow. Neighboring processing elements pass operands or partial sums directly from cell to cell, avoiding a trip to large memory for every multiply.[^google2017tpuDataflow][^awsneuroncorev32026]

In a weight-stationary systolic array, we preload weights from matrix $B$ into processing-element (PE) registers and keep them stationary during the sweep. Activations from matrix $A$ stream in from the left, staggered by one clock cycle so products align. Each PE multiplies its activation by its stored weight, adds the partial sum arriving from above, and forwards the updated sum downward.

<figure>
  <img src="illustrations/_generated/systolic_matrix_dataflow_dark.png" alt="Four ordered states hold the 2 by 2 B weights in place as A activations move right and partial sums move down, producing 19, 22, 43, and 50." />
  <figcaption>In a weight-stationary systolic array, each PE holds its B weight while activations advance across columns and partial sums accumulate downward, producing 19 = 1×5 + 2×7 first.</figcaption>
</figure>

Local operand reuse can make dense matrix products efficient. Array dimensions, fill and drain time, padding, and reduction length still affect useful work. If a kernel pads eight active rows to a 128-row hardware tile, only $8/128 = 6.25\%$ of that tile's rows carry useful values. Chip-wide utilization also depends on mapping, batching, concurrent work, and other execution engines. TPU and Trainium have vector and scalar resources for non-matrix work. The unit names change on the next platform; the questions that locate the wait stay the same.

```checkpoint
What additional evidence estimates chip-wide utilization from eight useful rows in a 128-row padded tile?
---
The 6.25% figure measures useful rows in one assumed tile. Chip-wide utilization also depends on tile mapping, overlap with other work, and use of vector and scalar engines. The roofline's achieved fraction of peak arithmetic measures throughput against peak, while idle-cycle counters require their own measurement.
```

## The invariant behind every accelerator

Across these platforms, the names change, but four practical questions help you find where a workload may be waiting:

1. Which group executes one instruction together?
2. Which memory can that group share at low latency?
3. Who schedules movement between large memory and local memory?
4. Which physical link carries bytes when work spans devices?

Time to first token (TTFT) measures from request submission to the first returned token, including queueing and any transport inside the measurement boundary. Time per output token (TPOT) commonly averages the later generation intervals over `output_tokens - 1`; inter-token latency measures the gaps one by one. State which convention you use. A p95 of request-average TPOT can hide an individual long pause.

For a tiled projection, large memory supplies input and weight tiles, on-chip storage holds the active pieces, and compute consumes them. Results travel back in the opposite direction. The arrows below show general data movement; platforms expose different memory instructions.

<figure>
  <img src="illustrations/_generated/memory_owner_paths_dark.png" alt="One projection tile passes through GPU memory owners, while peer traffic uses a separate device link." />
  <figcaption>One possible tiled path loads a weight tile through HBM and GPU-wide L2 into block shared memory and per-thread registers, then stores completed output Y back to HBM. An access can skip cache tiers. A peer transfer crosses a separate device boundary.</figcaption>
</figure>

When you move this model graph to another platform, keep the prompt distribution and output checks fixed so measured changes reflect the execution path under comparison.

> **Hardware targets covered:** Examples below compare NVIDIA Hopper (H100) and Blackwell (B200-class), AMD CDNA 3 (MI300) and CDNA 4 (MI350) on ROCm, Google TPU v6e on JAX/Pallas, AWS Trainium2 on Neuron/NKI, and Apple silicon via <span data-glossary="pytorch">PyTorch</span> MPS.[^nvidiahoppertuning2026][^nvidiablackwelltuning2026][^amdrocm7142026][^googletpuv6e2026][^awsnkimemory2026][^appleMetalPytorch2026]

The local-memory vocabulary changes from chip to chip, yet the ownership map stays recognizable:

| Stack and target | Execution unit to reason about | Fast software-visible storage | Large-memory movement | Multi-device boundary | First porting question |
|---|---|---|---|---|---|
| NVIDIA CUDA, Hopper H100 / Blackwell | 32-thread warp inside a thread block on an SM | registers, shared memory, and Hopper-era distributed shared memory | explicit loads, libraries, compiler scheduling, and TMA for suitable multidimensional copies | NVLink/NVSwitch or PCIe under topology-aware collectives such as <span data-glossary="nccl">NCCL</span> | Does the binary target the device, and does the tile overlap loads without exhausting registers or shared memory? |
| AMD ROCm/HIP, CDNA 3 / CDNA 4 | 64-thread wavefront inside a work-group on a compute unit | vector registers and Local Data Share (LDS) | HIP kernels, libraries, and explicit or compiler-managed copies | Infinity Fabric or PCIe under RCCL | Did <span data-glossary="cuda">CUDA</span> code assume a 32-lane warp, and is the exact `gfx` target supported by the pinned ROCm image? |
| Google TPU v6e, JAX/Pallas | Pallas programs over TensorCore resources: matrix-multiply, vector, and scalar units | vector memory (VMEM) plus scalar memory (SMEM) | compiler-pipelined <span data-glossary="hbm">HBM</span> blocks selected by `BlockSpec` | inter-chip interconnect (ICI) across a declared slice topology | Do block shapes fit TPU constraints, and does grid order preserve useful VMEM reuse? |
| AWS Trainium2, Neuron/NKI | Tensor, <span data-glossary="vector">vector</span>, scalar, or GPSIMD engine inside a NeuronCore-v3 | State Buffer (SBUF) and Partial Sum Buffer (PSUM) | explicit direct-memory-access copies between HBM and SBUF, with PSUM accumulation | NeuronLink-v3 and Neuron collectives across a declared rank group | Which engine owns each operation, and will live tiles spill from SBUF or PSUM? |
| Apple silicon, PyTorch MPS | MPS Graph or tuned MPS kernels submitted to the integrated <span data-glossary="gpu">GPU</span> | caches and threadgroup resources behind the graph or kernel implementation | unified physical memory, still mediated by MPS tensors and command scheduling | normally one Mac for this backend path | Does every operation stay supported on MPS, and does model state leave enough system-memory headroom? |

Use the table to compare where each platform keeps and moves data. Measure speed separately. When a symptom appears, start with the owner named in that platform's row.

## NVIDIA Hopper and Blackwell: preserve mapping, retune pressure

If you've worked through the CUDA foundation, much of this map will feel familiar: grids contain thread blocks, blocks contain threads, and 32-thread warps run on streaming multiprocessors (SMs). Threads in one block can share on-chip memory and synchronize; global device memory holds the larger tensors. That execution model still applies on Hopper and Blackwell.[^cudaProgrammingGuide2026]

Hopper added the Tensor Memory Accelerator (TMA), which can move multidimensional tensor tiles between global and shared memory while thread blocks continue independent work. Hopper also added thread-block clusters and distributed shared memory across blocks in a cluster.[^nvidiahoppertuning2026] Those features are useful only when a kernel has a tile worth reusing. Copying the decode projection's 86 MiB weight matrix through shared memory without enough rows to reuse each tile adds staging without changing the bandwidth problem.

Blackwell retains and extends the CUDA programming model. NVIDIA's Blackwell tuning guide still starts with coalesced global access, reduced redundant traffic, suitable launch configuration, and limited warp divergence. Occupancy limits differ across Blackwell compute capabilities, so use a target-specific register and shared-memory budget.[^nvidiablackwelltuning2026]

For the running workload, use the same algorithmic split on both generations:

- **Prefill:** choose a matrix path whose tile shape keeps Tensor Core work dense, then overlap global-to-shared movement with current computation.
- **Decode:** batch enough active rows to reuse weights, use a kernel specialized for small `M`, or reduce bytes through a verified quantization path.
- **Port from Hopper to Blackwell:** ship native code for the target or a compatible PTX intermediate representation, then retune. PTX using architecture-conditional features is an exception to general forward compatibility: Hopper `compute_90a` PTX is incompatible with Blackwell. A successful launch checks compatibility; profile performance separately.[^nvidiaBlackwellCompatibility2026]

### A CUDA failure that looks like architecture progress

Suppose a Hopper kernel uses more shared memory to stage a larger weight tile. One block now reuses more bytes, but fewer blocks remain resident on each SM. <span data-glossary="tpot">TPOT</span> gets worse.

A slowdown can coexist with improved reuse when a larger tile reduces the number of blocks that fit on each SM. Compare occupancy, memory traffic, and eligible warps, then try a smaller tile. If decode still moves about the same weight bytes per token, extra staging has not increased reuse.

```checkpoint
A Hopper decode kernel gets slower after its shared-memory tile doubles. Which two effects must be separated?
---
The larger tile may reduce global-memory traffic per block, but its shared-memory and register footprint may lower occupancy. Measure both data movement and resident or eligible warps before deciding whether the tile helped.
```

## AMD CDNA and ROCm: familiar syntax, different lane contract

Moving from Hopper to Blackwell keeps the warp width. Moving to these AMD CDNA generations changes that assumption. HIP, AMD's C++ GPU interface, looks familiar if you know CUDA: kernels launch grids of blocks, threads use `threadIdx` and `blockIdx`, and a work-group shares Local Data Share (LDS). Familiar syntax makes a port easier to read, but lane-level algorithms still need a careful check.

The CDNA 3 and CDNA 4 targets here use 64-thread wavefronts. NVIDIA code commonly assumes a 32-thread warp. A reduction that hardcodes masks, lane counts, or “four warps per 128-thread block” can return wrong values or waste half a wave after a mechanical HIP conversion. Check wave width for each AMD target before porting.[^amdhipmodel2026]

Before you change the API calls, check that the algorithm agrees with the target's execution model:

- derive lane behavior from `warpSize` or use library primitives with documented semantics;
- recalculate work-group size as a number of waves on the selected CDNA target;
- remeasure vector-register and LDS pressure, because both limit resident waves;
- compile for the exact LLVM `gfx` target in the pinned environment.

Make the missing-lane failure visible before compiling a port. In this model, each physical wave owns up to 64 inputs and emits one sum, while a faulty helper ported directly from CUDA consumes only its first 32 lanes:

<!-- leetllm: test, output=show -->
```python title="wave-width-ownership.py"
physical_wave = 64

def emitted_sum(values, consumed_lanes):
    return sum(sum(values[start:start + consumed_lanes])
               for start in range(0, len(values), physical_wave))

for size in [63, 64, 65]:
    values = list(range(1, size + 1))
    expected = sum(values)
    faulty = emitted_sum(values, consumed_lanes=32)
    repaired = emitted_sum(values, consumed_lanes=physical_wave)
    assert repaired == expected
    print(f"n={size}: reference={expected}, assumes 32={faulty}, "
          f"uses 64={repaired}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
n=63: reference=2016, assumes 32=528, uses 64=2016
n=64: reference=2080, assumes 32=528, uses 64=2080
n=65: reference=2145, assumes 32=593, uses 64=2145
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/simt_wave_ownership_dark.png" alt="A 64-lane CDNA wave loses lanes 33–64 when a helper consumes only the first 32, even when input 65 starts another wave." />
  <figcaption>Each cell is one physical lane; the rows group lanes by eight without numbering every cell. The helper consumes the first half of a CDNA wave and omits the second half. A new wave for input 65 adds that value but leaves lanes 33–64 missing. CUDA's 32-lane warp is a different hardware rule.</figcaption>
</figure>

The 65th value starts a new wave and contributes 65, but values 33 through 64 remain missing. Real reduction code must agree on lane grouping, participation, shuffle width, and which lanes publish partial sums. Two explicit 32-lane subgroups can be valid on a 64-lane wave if both sums reach the final reduction. Hardcoding 32 becomes a bug when the rest of the algorithm assumes one complete result per physical wave.[^amdhipmodel2026]

AMD's ROCm documentation maps MI300-series accelerators to CDNA 3 (`gfx942`) and MI350-series accelerators to CDNA 4 (`gfx950`).[^amdrocm7142026] Record those identifiers, ROCm version, and library versions in build and benchmark records so another run can reproduce the result.

The ROCm Communication Collectives Library (RCCL) provides operations such as all-reduce across GPUs. Its MI300X guidance describes eight-GPU systems where every accelerator pair has dedicated Infinity Fabric links. Using only part of that topology changes available collective routes, so a <span data-glossary="tensor-parallelism">tensor-parallel</span> result needs the selected ranks, not only `TP=4`.[^amdrccl2026]

For the projection, CDNA's decision remains phase-specific. Dense prefill can keep matrix units busy through large tiles. Decode needs enough concurrent rows, a small-$M$ kernel, or fewer weight bytes. HIP API conversion leaves the workload's $M = 8$ unchanged.

```checkpoint
A 128-thread CUDA reduction is ported to CDNA 3 and keeps a hardcoded 32-lane shuffle mask. Why is this a correctness risk rather than only a tuning issue?
---
CDNA 3 uses 64-thread wavefronts. A hardcoded 32-lane algorithm may combine only half of each wave or apply invalid lane assumptions, so output can be wrong. Replace the assumption with documented cross-lane primitives or a wave-size-aware algorithm, then test against a reference.
```

## TPU and Pallas: map tiles, not CUDA threads

CUDA and HIP ask you to organize work into threads and blocks. A Tensor Processing Unit (TPU) calls for a different mapping. Each v6e chip has one TensorCore containing two matrix-multiply units (MXUs), a vector unit, and a scalar unit. Dense matrix work goes to the MXUs; vector and scalar operations have their own resources. Google's TensorCore is the name of this larger assembly, not NVIDIA's matrix unit.[^googletpuv6e2026]

Pallas is JAX's custom-kernel layer for GPU and TPU. On TPU, kernel inputs usually reside in high-bandwidth memory (HBM), while kernel-body references point into faster vector memory (VMEM) or scalar memory (SMEM). `BlockSpec` describes which input and output tile each program sees; the compiler can overlap HBM transfers with computation.[^googlepallastpu2026]

Grid order can affect how much data you move. Pallas TPU programs normally advance sequentially in lexicographic grid order. If consecutive programs use the same input slice, they can reuse it from VMEM instead of loading it from HBM again.[^googlepallastpu2026] Reordering grid axes can therefore change traffic without changing the mathematical output.

Map the running projection this way:

1. Put the 86 MiB weights in HBM.
2. Use `BlockSpec` to select weight and activation tiles that fit VMEM.
3. Arrange the prefill grid so consecutive output tiles reuse one weight or input slice where possible.
4. Accumulate matrix work on MXUs and keep <span data-glossary="softmax">softmax</span>, normalization, or element-wise work on suitable vector paths.
5. For $M = 8$ decode, test padded or batched shapes against real TPOT. Measure MXU utilization for the skinny matrix on the target TPU.

Pallas block shapes have backend constraints, including divisibility requirements on trailing dimensions for TPU paths.[^googlepallastpu2026] A compile-time shape rejection flags a tile-shape mismatch: pad with correctness masking, choose a legal block, or stay in compiled JAX when a custom kernel does not repay its maintenance cost.

### Which operand does grid order reuse?

For one fixed reduction tile, write an output tile as $Y_{i,j} = X_i W_j$. Visiting `(0,0), (0,1), (1,0), (1,1)` keeps `X[0]` for the first two programs, then `X[1]`. Visiting `(0,0), (1,0), (0,1), (1,1)` instead keeps each weight tile for two programs. Suppose VMEM holds one resident tile per operand, with 1 KiB activation tiles and 4 KiB weight tiles:

<!-- leetllm: test, output=show -->
```python title="tile-order-traffic.py"
orders = {
    "columns first": [(i, j) for i in range(2) for j in range(2)],
    "rows first": [(i, j) for j in range(2) for i in range(2)],
}

for name, order in orders.items():
    previous_i = previous_j = None
    x_loads = w_loads = 0
    for i, j in order:
        x_loads += i != previous_i
        w_loads += j != previous_j
        previous_i, previous_j = i, j
    kib = x_loads * 1 + w_loads * 4
    print(f"{name}: X loads={x_loads}, W loads={w_loads}, input={kib} KiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
columns first: X loads=2, W loads=4, input=18 KiB
rows first: X loads=4, W loads=2, input=12 KiB
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/pallas_grid_reuse_dark.png" alt="Two grid orders visit the same four Y tiles but retain different one-tile X and W slots, yielding 18 KiB or 12 KiB of input traffic." />
  <figcaption>Both grid orders compute the same four output tiles, but because W tiles are four times larger than X tiles, rows-first reuses W and drops input traffic from 18 KiB to 12 KiB.</figcaption>
</figure>

Columns-first saves activation loads, but rows-first moves fewer bytes in this worked example because weights are larger. If both tiles have equal size, the byte totals tie. For a real matrix multiplication with multiple reduction tiles, also preserve Pallas's requirement that updates to the same output slice be consecutive; the reduction axis normally varies last. Inspect the complete grid and transfer trace, including reuse across tiles.[^googlepallastpu2026]

## Trainium and NKI: assign work to engines and memories

Pallas gives the compiler a grid for scheduling tile movement. AWS's Neuron Kernel Interface (NKI) makes you reason directly about another set of engines and buffers. Trainium2's NeuronCore-v3 contains tensor, vector, scalar, and general-purpose single-instruction, multiple-data (GPSIMD) engines, plus software-managed on-chip SRAM.[^awsneuroncorev32026]

For our projection, it helps to keep three NKI memory levels distinct:

- **HBM** holds kernel inputs and outputs.
- **SBUF** is the main software-managed on-chip buffer shared by compute engines.
- **PSUM** holds partial matrix-multiply accumulations near the tensor engine.

An NKI kernel loads HBM tiles into SBUF, performs work from internal memory, accumulates matrix results in PSUM when appropriate, and stores completed outputs back through SBUF to HBM. If live tiles exceed a buffer's capacity, the compiler can spill to the next memory level: PSUM pressure can add SBUF traffic, while SBUF pressure can add HBM traffic. Check which level overflowed before attributing every spill to HBM.[^awsnkimemory2026]

The running projection suggests an engine schedule: direct-memory-access engines prefetch the next `X` and `W` tiles, the tensor engine performs matrix multiplication, vector or scalar engines handle fused follow-up operations they support, and the current output tile accumulates in PSUM. NKI tile dimensions also distinguish partition and free dimensions, so a valid NumPy shape isn't yet a valid physical layout.

Trainium2 systems connect chips through NeuronLink-v3 in a 4-by-4 two-dimensional torus within a 16-chip instance.[^awstrn2arch2026] Keep tensor-parallel ranks aligned with the actual topology. A rank count alone hides routing, exactly as it did for CUDA and ROCm.

### An NKI failure that keeps answers correct

The prefill kernel grows its fused region to remove one HBM round trip. Live intermediates no longer fit SBUF, so the compiler adds spills. Latency increases and the trace shows extra DMA traffic.

Split the fusion or shrink tiles until the live set stays on chip. “More fusion” isn't a monotonic optimization when software-managed local memory is the limiting resource.

<figure>
  <img src="illustrations/_generated/nki_live_set_and_spills_dark.png" alt="A schematic split schedule ends an intermediate lifetime, while fusion extends the live set beyond SBUF and spills through HBM; PSUM pressure spills first to SBUF." />
  <figcaption>Fusion extends overlapping live ranges and can trigger an SBUF spill through HBM despite removing a kernel launch. PSUM overflow spills into SBUF first and reaches HBM only if SBUF then overflows.</figcaption>
</figure>

```checkpoint
Why can a larger fused NKI kernel run slower even though it launches fewer kernels?
---
Fusion lengthens the lifetime of intermediate tiles. If that live set overflows a buffer, spills add traffic to the next memory level. SBUF spills can reach HBM; PSUM spills can first increase SBUF pressure. Fewer launches can lose to extra movement.
```

## Apple MPS: unified memory changes transfer, not capacity

If you're testing a local model on a Mac, Apple silicon changes the memory boundary you've been following. PyTorch's Metal Performance Shaders (MPS) backend maps tensor operations to MPS Graph and tuned MPS kernels on Apple platforms.[^appleMetalPytorch2026][^pytorchMpsBackend2026] MPS Graph represents operations and tensors as a symbolic compute graph that can be compiled into an executable.[^applempsgraph2026] This path targets the GPU; it doesn't mean PyTorch automatically runs the model on the Apple Neural Engine.

Apple silicon uses a unified physical memory pool. The CPU and GPU don't have the discrete host-RAM-to-VRAM boundary used by a typical data-center GPU. PyTorch still treats `cpu` and `mps` as different device targets, and unified memory is still finite.[^mlx2026][^pytorchMpsBackend2026]

For the 8B BF16 model, weights alone need about 16 GB in decimal units. The machine also needs <span data-glossary="kv-cache">KV cache</span>, temporary activations, allocator headroom, macOS, and other applications. A Mac advertised with enough total memory can still hit memory pressure or fail allocation once the full serving budget is counted.

For this comparison, use MPS as the single-Mac path: validate graph behavior, test product logic, and measure an on-device latency envelope. Keep three questions separate:

1. Is the operation implemented on MPS?
2. Does the whole model fit within safe system-memory headroom?
3. Does the graph execute fast enough after warmup and synchronization?

When `PYTORCH_ENABLE_MPS_FALLBACK=1` is enabled, some unsupported MPS operations can fall back to the CPU and create a latency cliff.[^pytorchMpsEnvVars2026] Fallback behavior depends on the operation. For example, MPS cannot allocate `float64` tensors, so a double-precision tensor transfer still fails.[^pytorchMpsTensorAllocation2026] Unified memory gives CPU and GPU shared physical storage, while execution speed still depends on the processor and path. Profile CPU operations and synchronization gaps before blaming GPU arithmetic.

<figure>
  <img src="illustrations/_generated/mps_shared_capacity_dark.png" alt="MPS Graph and CPU fallback use separate execution owners that draw from one finite unified physical memory pool." />
  <figcaption>The 16 GB weight block shares one finite unified pool with KV cache, activations, allocator headroom, macOS, and other apps. MPS Graph targets the GPU, while CPU fallback adds synchronization gaps.</figcaption>
</figure>

## Interconnect topologies: count exchanges, then measure the route

Tensor parallelism (TP) can cross nodes. Keeping its frequent exchanges on a fast fabric may help, but “inside one node” is a tuning preference, not a correctness restriction. Current vLLM guidance supports cross-node TP and also describes using TP inside nodes with pipeline parallelism between them. Within-node pipeline splits can help with uneven layer assignments or systems without NVLink.[^vllm2026distributed]

| Physical route | Concrete reference | What remains to be measured |
|---|---|---|
| HGX H100 eight-GPU NVLink/NVSwitch domain | Fourth-generation NVLink; advertised 900 GB/s GPU-to-GPU bandwidth | Collective latency for the chosen ranks, payload, dtype, algorithm, and concurrency |
| HGX B200 eight-GPU domain | Fifth-generation NVLink; advertised 1,800 GB/s GPU-to-GPU bandwidth | Same checks, plus the actual hardware and software reduction path |
| GB200 NVL72 | One 72-GPU NVLink domain across a rack | Rank placement and legal model shard degrees; domain size isn't a recommended TP size |
| MI300X eight-GPU Infinity Fabric domain | Dedicated links between accelerator pairs in the documented system | How selected ranks use the available routes, including smaller groups |
| PCIe and host-memory paths | Root ports, peer-access support, NUMA placement, and shared links | End-to-end transfers and whether traffic uses direct peer access or host staging |
| InfiniBand or RoCE between nodes | NICs, GPU-to-NIC affinity, switches, and network configuration | End-to-end collectives under the intended load, including congestion and overlap |

These NVIDIA domain specifications come from the HGX reference architecture and GB200 page. The MI300X topology comes from RCCL guidance.[^nvidia2026hgxComponents][^nvidia2026gb200nvl72][^amdrccl2026] Advertised bidirectional or aggregate bandwidth describes the domain. Measure one rank's sustained all-reduce payload rate and collective latency separately.

For one **classic dense Megatron-style** layout, attention's output projection and the MLP down-projection each need a reduction.[^shoeybi2019] With 80 layers, this gives 160 reductions per batched decode iteration:

$$
\text{Reductions per decode iteration} = 2 \times 80 = 160
$$

At batch eight and hidden width 8,192, the BF16 tensor is $8 \times 8{,}192 \times 2 = 131{,}072\ \mathrm{bytes} = 128\ \mathrm{KiB}$. That's the logical input payload. All-reduce's transmitted bytes depend on group size and algorithm; for a ring, each rank sends $\frac{2(p - 1)}{p}$ times that payload. Sequence parallelism, fused implementations, hybrid layers, and MoE can change the communication pattern.[^megatronCoreParallelism2026][^nccltestsPerformance2026]

For an exercise, suppose the startup term is 5 microseconds per collective on route A and 20 on route B. With all 160 startups serialized and exposed, the contributions are `0.8 ms` and `3.2 ms` per batched iteration. These assumed startup costs show how fixed latency can accumulate; collect NVLink or network timings to estimate the target system. The total also includes payload movement, computation, scheduling, and any overlap. A small payload makes fixed costs worth investigating; measure each stage to identify the dominant cost.

Pipeline parallelism communicates at stage boundaries and may reduce exchange frequency, while adding scheduling and stage-balance constraints. Data parallel replicas process separate requests but each replica can still contain TP or EP communication. Expert dispatch occurs at each MoE layer during a forward pass. Choose the grouping with the best measured fit, request latency, and useful throughput for this workload. Then identify the lowest software layer needed to address the measured bottleneck.

```checkpoint
Why might cross-node TP lose to TP within nodes plus pipeline stages between nodes, even though both configurations run correctly?
---
TP repeatedly exchanges partial activations inside layers. A slower cross-node collective can add exposed time at many dependencies. Pipeline stages exchange at fewer boundaries but can introduce bubbles or imbalance. Neither route wins from its name alone; compare complete request traces and serving results at the same workload.
```

## Choose programming depth after the bottleneck

Start at the model graph and move down only when measurements give you a reason. Each lower layer offers more control and adds another surface to maintain. Stop at the highest layer that meets correctness and service-level objectives (SLOs):

| Layer | Typical tools | What you control | What you inherit | Move lower when |
|---|---|---|---|---|
| Model graph | PyTorch, JAX, framework backend | shapes, batching, precision, graph breaks | vendor libraries, compiler lowering, memory planning | trace shows one material unsupported or poorly lowered operation |
| Compiler and library configuration | `torch.compile`, XLA, cuBLAS, hipBLASLt, MPS Graph, Neuron compiler | fusion boundaries, layouts, autotuning, capture, static shapes | tested kernels and many architecture details | existing kernels miss a stable workload shape or move avoidable bytes |
| Portable kernel DSL | <span data-glossary="triton-language">Triton</span> or Pallas where supported | program grid, blocks, local tiles, pipelining | backend code generation and some scheduling | one hotspot has enough volume to repay backend testing |
| Hardware-specific kernel | CUDA C++, HIP, NKI, Metal | engine, memory, synchronization, and launch choices | compiler and runtime support, with backend-specific rules | a measured hotspot needs hardware-specific behavior the higher layer can't express |

Validate portability across a platform test matrix. A Triton kernel may support NVIDIA and AMD while using different legal tile sizes. A Pallas kernel may share `BlockSpec` vocabulary across GPU and TPU while requiring backend-specific memory and shape rules. NKI exposes Trainium's memory hierarchy directly. MPS Graph may compile a complete graph with a different custom-kernel surface from CUDA.

For our assistant, start with graph-level BF16 inference on each candidate. Preserve <span data-glossary="tokenization">tokenization</span>, weights, prompts, decoding settings, and output checks. Move down only after a trace identifies a stable projection, attention, normalization, or collective hotspot.

## Read failures as ownership mistakes

When a run surprises you, the same symptom can have a different cause on each platform. Work outward from evidence: check the output, identify the phase, trace memory movement, inspect execution mapping, then check topology.

| Symptom | Likely ownership error | Disambiguating evidence | First controlled change |
|---|---|---|---|
| Prefill is fast, TPOT is poor | too few decode rows reuse each weight load | small `M`, high weight traffic, low matrix-engine use | increase continuous-batch rows or test a small-`M` / quantized kernel |
| Port is wrong only on AMD | 32-lane warp assumption survived conversion | failing reduction test at wave boundary | use wave-size-aware primitive and test 63, 64, and 65 elements |
| Pallas TPU compile rejects a tile | `BlockSpec` violates backend shape rules | compiler error names block dimensions | choose legal trailing dimensions and mask padding |
| TPU output is correct but HBM traffic rises | grid order lost VMEM reuse | transfer trace changes while operations don't | reorder grid axes so repeated slices are consecutive |
| NKI fusion is correct but slower | live tiles spill from SBUF or PSUM | extra transfers at the overflowing memory level | shrink tile or split fusion |
| MPS latency jumps for one model revision | unsupported op fell back or graph broke | CPU activity and extra command gaps | isolate operation, replace it, or keep explicit CPU baseline |
| Multi-device TPOT regresses | logical shards crossed a worse physical route | collective time and selected link topology | remap ranks within fast domain before changing model |
| New accelerator launches but throughput regresses | compatibility passed; tuning is incomplete | same output, different occupancy, tiling, or library path | rerun phase-specific trace and tune one proven hotspot |

Change one of precision, batching, kernel code, or topology per experiment. Keep one baseline so each result has clear attribution.

## The four-gate hardware evaluation funnel

Suppose our code assistant targets p95 <span data-glossary="ttft">TTFT</span> below 450 ms and p95 TPOT below 45 ms across eight 4,096-token prompts. Checking correctness, memory fit, and latency in order eliminates broken or slow candidates before you spend time comparing cost per token.

<figure>
  <img src="illustrations/_generated/gate_decision_path_dark.png" alt="Four acceptance gates run in order. Gate 1 checks correctness and task quality against declared tolerances and task criteria; failing quality routes to Revise config. Gate 2 checks per-device memory allocations plus measured reserve; OOM or tight headroom routes to Disqualified. Gate 3 requires p95 TTFT below 450 ms and p95 TPOT below 45 ms; tail latency failure routes to Disqualified. Passing all three gates sends the candidate to Gate 4, which ranks useful output by SLO-compliant tokens per dollar." />
  <figcaption>Correctness and task quality, per-device memory fit, and both latency limits must pass before candidates reach cost ranking. Quality failures return to configuration revision; out-of-memory, insufficient-headroom, or tail-latency failures disqualify the candidate.</figcaption>
</figure>

### Gate 1: Correctness and numerical precision

Evaluate whether the candidate runs the model accurately across supported precisions:

- **Dtype mechanics:** Establish a BF16 or other suitable reference. Evaluate reduced formats only where the exact device, kernel, and model configuration support them. FP8 variants and block-scaled formats such as MXFP4 and NVFP4 follow distinct encoding and scaling rules.
- **Tolerance verification:** Check layer outputs against predefined absolute and relative tolerances, inspect nonfinite values, and evaluate representative task cases.
- **Decision:** Accept the configuration only if it meets the declared numerical and task-quality criteria; investigate any NaN/Inf values in outputs expected to be finite.

### Gate 2: Memory fit and residency

Calculate the full per-device memory budget before launching serving benchmarks:

$$
\text{Memory required} = \text{Weights} + \text{KV cache}(B, L) + \text{Activation buffers} + \text{Runtime workspace}
$$

- For an 8B BF16 model, raw weights consume about 16 GB. Size KV cache from the actual layers, KV heads, head dimensions, dtypes, and context allocation (adding separate terms for hybrid attention or recurrent state).
- Build the budget per device, counting graph captures, padding, communication buffers, workspace, and any preallocated KV pool once.
- Measure peak allocations over expected bursts and choose an explicit headroom reserve from that measurement; on Apple silicon, include macOS and other processes sharing unified memory.
- **Decision:** Target concurrency must fit within measured capacity and admission limits. If offload or preemption is part of the design, keep it active during latency testing.

### Gate 3: Latency SLOs under production concurrency

Measure response times under the target prompt arrival distribution:

- **TTFT (Time to First Token):** Includes queueing, prefill, first-token production, and transport within the chosen boundary.
- **TPOT (Time per Output Token):** Reflects subsequent generation, batching, communication, and delivery. Also inspect individual inter-token gaps, since a request average can hide a long stall.
- **Decision:** Disqualify any candidate that fails either p95 TTFT (<450 ms) or p95 TPOT (<45 ms), regardless of its peak batch throughput.

### Gate 4: Goodput and cost-efficiency

Only configurations that clear the first three stages compete on efficiency:

- **Goodput:** Count output tokens from successful requests that meet both per-request latency limits, divided by the full observation interval. Report failed, retried, and canceled requests separately.
- **Cost calculation:** Divide eligible tokens by total cost over the same interval (cloud rates or amortized hardware plus power, network, and idle capacity).
- **Decision:** Rank passing configurations by useful tokens per dollar under the same workload conditions.

Two separate p95 checks do not tell you whether the same requests passed both limits. Here is a 20-request trace with one slow-first-token request and a different slow-generation request (using nearest-rank percentiles):

<!-- leetllm: test, output=show -->
```python title="separate-tails-and-joint-success.py"
from math import ceil

requests = [(500 if i == 0 else 100, 60 if i == 1 else 20, 100)
            for i in range(20)]  # TTFT ms, average TPOT ms, output tokens

def p95(values):
    ordered = sorted(values)
    return ordered[ceil(0.95 * len(ordered)) - 1]

first_ok = sum(first < 450 for first, _, _ in requests)
generation_ok = sum(gap < 45 for _, gap, _ in requests)
joint = [(first, gap, tokens) for first, gap, tokens in requests
         if first < 450 and gap < 45]
print(f"p95 TTFT={p95([r[0] for r in requests])} ms, "
      f"p95 TPOT={p95([r[1] for r in requests])} ms")
print(f"individual pass rates: {first_ok / 20:.0%}, {generation_ok / 20:.0%}")
print(f"joint pass rate: {len(joint) / 20:.0%}")
print(f"eligible output over 10 s: {sum(r[2] for r in joint) / 10:.0f} token/s")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
p95 TTFT=100 ms, p95 TPOT=20 ms
individual pass rates: 95%, 95%
joint pass rate: 90%
eligible output over 10 s: 180 token/s
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/joint_slo_goodput_dark.png" alt="Two overlapping latency filters each pass 19 requests, but only their common 18 requests pass both and contribute 180 useful tokens per second." />
  <figcaption>The overlapping filters show the 18 requests that meet both limits; r0 misses TTFT and r1 misses TPOT. The nearest-rank p95 values still pass individually, while a 95% joint-compliance requirement fails at 90%. Joint-goodput counts only the 18 successful requests.</figcaption>
</figure>

> **Key insight:** Separate p95 checks can both pass at 95% while joint compliance drops to 90% when different requests miss TTFT and TPOT. Always count joint SLO success for goodput.

```checkpoint
Two accelerators pass numerical checks. Candidate A has higher total tokens per second but misses the p95 TPOT limit. Candidate B meets TTFT and TPOT with lower total throughput. Which candidate is eligible?
---
Candidate B. Correctness, memory fit, and latency targets must pass first; throughput ranks only the candidates that satisfy all three.
```

This projection is compute-heavy in prefill and memory-heavy in decode. When a port is wrong, or only slower, ask who owns that step.

```mastery-quiz
[
  {
    "question": "An isolated operation executes 6 trillion FLOPs with 12 decimal GB of memory traffic on hardware rated at 300 TFLOP/s and 1.5 TB/s. Using the perfect-overlap floor, what happens when compute doubles and bandwidth stays fixed?",
    "options": [
      "Floor 20 ms→8 ms; traffic sets both modeled times.",
      "Floor 20 ms→10 ms; compute sets both modeled times.",
      "Floor 8 ms→4 ms; compute sets both modeled times.",
      "Floor 28 ms→18 ms; serial addition sets both times."
    ],
    "answer": "Floor 20 ms→10 ms; compute sets both modeled times.",
    "explanation": "Compute is 6e12/300e12=0.02 s=20 ms; traffic is 12e9/1.5e12=0.008 s=8 ms. Doubling compute makes its term 10 ms, still larger than 8 ms. The floor is the maximum, not a sum, and it omits overhead and other operations."
  },
  {
    "question": "A sequential traffic model streams 8 decimal GB of weights. Five percent comes from a 40 GB/s host path, the rest from 1 TB/s resident memory. Ignore compute and overlap. Which transfer time and slowdown versus all-resident follow?",
    "options": [
      "10.0 ms and 1.25×",
      "8.0 ms and 1.00×",
      "200.0 ms and 25.00×",
      "17.6 ms and 2.20×"
    ],
    "answer": "17.6 ms and 2.20×",
    "explanation": "The host supplies 5% of 8 GB, or 0.4 GB. At 40 GB/s that takes 10 ms. The remaining 7.6 GB at 1,000 GB/s takes 7.6 ms. The reads are sequential, so they take 17.6 ms in total. All 8 GB in resident memory would take 8 ms, giving a slowdown of 17.6/8 = 2.20×. The 10.0 ms estimate omits the resident reads. The 8.0 ms estimate puts every byte in resident memory, and the 200.0 ms estimate sends every byte over the host path."
  },
  {
    "question": "A conceptual weight-stationary array holds B=[[4, 2],[5, 1]]. The first activation row is [2, 1]. Which first output row follows when partial sums accumulate over the reduction dimension?",
    "options": [
      "Output row [13, 5].",
      "Output row [9, 3].",
      "Output row [8, 1].",
      "Output row [10, 11]."
    ],
    "answer": "Output row [13, 5].",
    "explanation": "Each output column accumulates one product per activation. The first gives 2×4 + 1×5 = 13 and the second gives 2×2 + 1×1 = 5. Adding the weights alone gives [4+5, 2+1] = [9, 3] and ignores the activations. Keeping only the diagonal products gives [2×4, 1×1] = [8, 1] and drops one contribution per column. Pairing the activations with the rows of B gives [2×4 + 1×2, 2×5 + 1×1] = [10, 11]."
  },
  {
    "question": "An SM provides 192 KiB of usable shared memory. All other residency limits are ignored. A correct kernel grows its per-block shared allocation from 64 to 96 KiB while reducing device-memory traffic. Which residency and performance inference follows?",
    "options": [
      "Three→two blocks; lower traffic establishes a faster complete kernel.",
      "Two→three blocks; resource and traffic effects remain separate quantities.",
      "Three→two blocks; resource and traffic effects remain separate quantities.",
      "Three→three blocks; allocation changes leave the shared-capacity bound fixed."
    ],
    "answer": "Three→two blocks; resource and traffic effects remain separate quantities.",
    "explanation": "Floor(192/64)=3 and floor(192/96)=2. That is the stated shared-memory-only bound, not a complete occupancy prediction. Lower traffic and fewer resident blocks are distinct changes; timing and eligible-warps evidence determine the actual outcome."
  },
  {
    "question": "One physical 64-lane wave owns each consecutive group of up to 64 values. Values are 1 through 66. A faulty helper sums just the first 32 values of each physical wave. Which faulty and correct totals follow?",
    "options": [
      "Faulty 528; correct 2211, because the second wave contributes nothing.",
      "Faulty 659; correct 2211, because 65 and 66 do not restore omitted lanes.",
      "Faulty 2145; correct 2211, because only the final value is omitted.",
      "Faulty 2211; correct 2211, because two waves repair the first wave."
    ],
    "answer": "Faulty 659; correct 2211, because 65 and 66 do not restore omitted lanes.",
    "explanation": "The first wave contributes 1+…+32=528 and omits 33…64. The second wave contributes 65+66=131, giving 659. The reference sum 66×67/2 is 2211. A later wave does not repair values lost in an earlier ownership group."
  },
  {
    "question": "A 2×2 output grid has one resident tile slot per operand and no reuse after eviction. X tiles are 2 KiB; W tiles 5 KiB. Columns-first visits (0,0),(0,1),(1,0),(1,1); rows-first visits (0,0),(1,0),(0,1),(1,1). Which input traffic follows for those two sequences?",
    "options": [
      "Columns-first 14 KiB; rows-first 14 KiB, retaining both operands.",
      "Columns-first 18 KiB; rows-first 24 KiB, favoring activation-tile reuse.",
      "Columns-first 24 KiB; rows-first 24 KiB, because output coordinates agree.",
      "Columns-first 24 KiB; rows-first 18 KiB, retaining W across adjacent rows."
    ],
    "answer": "Columns-first 24 KiB; rows-first 18 KiB, retaining W across adjacent rows.",
    "explanation": "Columns-first loads X twice and W four times: 2×2+4×5=24 KiB. Rows-first loads X four times and W twice: 4×2+2×5=18 KiB. Both compute the same outputs, but the one-slot lifetime model changes repeated input transfers."
  },
  {
    "question": "An NKI kernel slows down after fusion. For the same input, transfers from PSUM to SBUF rise from 4 to 12 tiles per call. Both runs record zero spill writes from SBUF to HBM and zero refill reads from HBM to SBUF. Which wait time would you compare across runs to test whether the extra transfers delayed the kernel?",
    "options": [
      "Time waiting for on-chip copies of partial sums.",
      "Time waiting for evicted tiles to reach HBM.",
      "Time waiting for evicted tiles to return from HBM.",
      "Time waiting for the runtime to launch the next kernel."
    ],
    "answer": "Time waiting for on-chip copies of partial sums.",
    "explanation": "PSUM holds partial sums. The fused kernel moves eight extra tiles per call into SBUF, which is also on chip. Inspect which partial sums are live together and how long the kernel waits for their copies. Copies that overlap other work can add traffic without adding to elapsed time. Writing an evicted tile to HBM and reading it back would each cross the HBM boundary. Both counters are zero. Launch timing measures dispatch overhead."
  },
  {
    "question": "A Mac trace keeps the same finite unified-memory allocations but adds CPU work and synchronization around one newly unsupported operation. Fallback is enabled. A separate float64 transfer to MPS still raises an allocation error. Which paired diagnosis fits?",
    "options": [
      "Two physical pools; new CPU execution; unsupported allocation stays invalid.",
      "One physical pool; Neural Engine execution; unsupported allocation becomes valid.",
      "One physical pool; new CPU execution; unsupported allocation stays invalid.",
      "One physical pool; unchanged GPU execution; allocation failure indicates OOM."
    ],
    "answer": "One physical pool; new CPU execution; unsupported allocation stays invalid.",
    "explanation": "Shared physical memory does not make CPU and MPS the same execution device. Enabled fallback can introduce CPU work and command gaps for supported fallback cases. The pinned MPS allocator rejects float64, so the flag is not a blanket dtype conversion mechanism."
  },
  {
    "question": "A stated classic dense layout has 24 layers and two reductions per layer. Batch 6, hidden 1024 and BF16 give one logical payload per reduction. With four-rank ring all-reduce and 15 µs serialized startup per call, which per-rank bytes and startup sum follow?",
    "options": [
      "12 KiB sent per call; 0.36 ms startup per iteration.",
      "24 KiB sent per call; 0.72 ms startup per iteration.",
      "18 KiB sent per call; 0.36 ms startup per iteration.",
      "18 KiB sent per call; 0.72 ms startup per iteration."
    ],
    "answer": "18 KiB sent per call; 0.72 ms startup per iteration.",
    "explanation": "Payload 6×1024×2=12288 bytes=12 KiB. A four-rank ring sends 2(4−1)/4=1.5 payloads per rank, or 18 KiB. There are 48 calls, whose assumed exposed startups total 48×15 µs=720 µs=0.72 ms. Payload transfer and overlap need additional measurement."
  },
  {
    "question": "In a 12-second interval, 24 successful requests emit 60 tokens each. TTFT failures are R1, R2; later-token failures are R2, R3. Eligible output requires both conditions. The complete interval costs $0.03. Which goodput and eligible tokens per dollar follow?",
    "options": [
      "120 token/s and 48000 token/$.",
      "100 token/s and 40000 token/$.",
      "105 token/s and 42000 token/$.",
      "110 token/s and 44000 token/$."
    ],
    "answer": "105 token/s and 42000 token/$.",
    "explanation": "The union of failing IDs is {R1, R2, R3}, so 21 requests contribute 1260 eligible tokens. Divide by the full 12 seconds for 105 token/s and by $0.03 for 42000 token/$. Double-counting R2 or ignoring one condition gives the wrong eligible set."
  }
]
```

> **Next:** Continue to [Correct GPU Profiling and Benchmarking](/learn/gpu-profiling-correctness-benchmarking). Architecture vocabulary tells you where work could stall. Next you'll collect synchronized timings, traces, counters, and correctness evidence that show where it actually stalls.
