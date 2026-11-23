## GPU parallel primitives lab benchmark log

This log records one historical run of the lab source with SHA-256 `f5cb863c4f85af3998ee86da56b67456255d2ddc572d3d2b6f1cbd5f97a6feb2`. Later revisions of the source guard shuffle additions, check numeric arguments and grid limits, verify intermediate launches, and stop before timing when correctness fails, so the numbers below describe the older build. Rebuild and rerun the numerical checks, sanitizers, and timing before pairing results with the current download.

The run was captured on 2026-08-29 on a local workstation. It shows what a complete measurement record for this lab looks like: hardware, compiler, launch shape, correctness checks, sanitizer passes, and timed rows together in one place.

### Hardware and software

- GPU: NVIDIA GeForce RTX 5070 Ti
- Compute capability: 12.0
- Driver: 595.71.05
- CUDA compiler and runtime: 13.2
- `nvcc`: V13.2.78, build `cuda_13.2.r13.2/compiler.37668154_0`
- GPU state before measured process: P3, 35 C
- Source SHA-256: `f5cb863c4f85af3998ee86da56b67456255d2ddc572d3d2b6f1cbd5f97a6feb2`

### Workload and algorithms

- Input count: 4,194,304 signed 32-bit integers
- Repeating input pattern: `3,-1,4,1,5,-9,2,6`
- Reduction output: signed 64-bit scalar
- Scan output: signed 64-bit exclusive prefixes
- Warmups: 5 complete launches per variant
- Measured iterations: 30
- Stream: default stream
- Timing: CUDA events around repeated kernel launches
- Baselines: deliberately serial one-thread reduction and scan
- Candidates: hierarchical two-items-per-thread reduction with warp shuffles, and hierarchical 512-item Blelloch block scan with recursive block-offset propagation
- Allocation and host-to-device setup: outside timed region
- Cache policy: buffers reused after warmup; actual cache residency wasn't profiled
- GPU clocks: not locked

The serial kernels isolate dependency and provide a correctness baseline; use the parallel kernels for tuned performance comparisons. `logical_gb_s` is a logical-byte rate: reduction counts input bytes, while scan counts one input read plus one output write. Hardware transactions and cache behavior determine physical DRAM traffic.

### Compile and run

```bash
/usr/local/cuda/bin/nvcc -O3 -std=c++17 -lineinfo -arch=sm_120 \
  assets/primitives_lab.cu -o primitives_lab

./primitives_lab 4194304 30
```

### Raw output

```text
device=NVIDIA GeForce RTX 5070 Ti
compute_capability=12.0
driver_api_version=13020
runtime_api_version=13020
n=4194304
iterations=30
fixture=3,-1,4,1,5,-9,2,6
reference_sum=5767168
timing=CUDA events, 5 warmups, one default stream
operation,variant,correct,detail,average_ms,logical_gb_s
reduce,serial,true,sum=5767168,105.089096,0.159648
reduce,hierarchical,true,sum=5767168,0.015965,1050.887921
exclusive_scan,serial,true,all_prefixes_match,263.426300,0.191065
exclusive_scan,hierarchical,true,all_prefixes_match,0.114976,437.757848
```

### Correctness checks

CPU reference uses same signed integers and 64-bit accumulation. All reduction values and every exclusive prefix must match exactly. An odd-size run at `N=4099` passed numerical checks and exercised partial blocks.

Compute Sanitizer results for that odd-size run:

```text
memcheck: ERROR SUMMARY: 0 errors
racecheck: RACECHECK SUMMARY: 0 hazards displayed (0 errors, 0 warnings)
synccheck: ERROR SUMMARY: 0 errors
```

Commands:

```bash
compute-sanitizer --tool memcheck --error-exitcode=99 ./primitives_lab 4099 1
compute-sanitizer --tool racecheck --error-exitcode=99 ./primitives_lab 4099 1
compute-sanitizer --tool synccheck --error-exitcode=99 ./primitives_lab 4099 1
```

### Reading the numbers

Each timed row reflects the named source, machine, input shape, reused buffers, and compiler together. Reused buffers can stay resident in L2 between iterations, so effective bandwidth here may exceed what a cold DRAM read would sustain. The run did not include a CUB comparison, so these rows say nothing about how the hand-written kernels rank against a tuned library.
