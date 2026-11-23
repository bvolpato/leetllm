# GPU kernel recovery record

## Environment

- GPU:
- Driver:
- CUDA toolkit:
- Nsight Compute:
- Compute Sanitizer:
- Source SHA-256:
- Host-checking header SHA-256:
- Compile command and target architecture:
- Artifact directory:
- Compiler resource log:

## Stable workload

- Matrix shape:
- Data type:
- Warmup launches:
- Measured launches:
- Timing method:
- Repeated-buffer/cache policy:
- Boundary shapes tested separately:

## Deliberate failure

- Variant: `broken`
- Code change: removed block-wide barrier between shared-memory writes and reads
- `memcheck` result:
- `racecheck` result:
- `synccheck` result:
- Output correctness result:
- Application and sanitizer exit codes:
- Why output correctness alone was or wasn't sufficient:

## Recovery

- Restored invariant:
- Recovered variant:
- `memcheck` result:
- `racecheck` result:
- Exact transpose check:
- Fresh poisoned-buffer checks before and after timing:
- Test shapes and iteration counts:
- Average kernel time:
- Nsight Compute report:

## Decision

- Bound before change:
- Evidence after change:
- Keep, revert, or investigate:
- Remaining uncertainty:
- CUDA/device tests not executed (if any):
