---
reviewedAt: "2026-09-22"
method: "Manual article, example, question, and illustration review against primary sources"
---

## Range and resolution

- PyTorch type information defines `eps` as the gap above one and `tiny` as the smallest positive normal, not the smallest encoded value. https://docs.pytorch.org/docs/2.14/type_info.html
- `nextafter` exposes the next representable number toward the other argument. At one, downward and upward gaps differ by a factor of two; subtraction cannot use the upward half-gap as an exact threshold. The added CPU example also shows a value below the minimum FP16 subnormal rounding up to it. https://docs.pytorch.org/docs/2.14/generated/torch.nextafter.html
- Cloud TPU rounds FP32-to-BF16 conversion to nearest even and flushes subnormals. BF16's normal exponent range resembles FP32, but encoded subnormal minima and maximum finite values differ. This hardware policy must not be generalized to every CPU or GPU operation. https://docs.cloud.google.com/tpu/docs/bfloat16

## Storage policies and scaling

- Micikevicius et al. maintain FP32 master weights in their recipe, explicitly say these aren't universally necessary, and leave dynamic loss scaling to future work. Their activation-dominated memory argument isn't a promise that every AMP job halves memory. https://arxiv.org/html/1710.03740v1
- Ozkara, Yu, and Park study stochastic rounding with BF16 training state, including temporary FP32 update arithmetic. Their method and comparisons use specific implementations and per-method learning-rate tuning. Autocast doesn't enable their update policy. https://arxiv.org/html/2502.20566v1
- PyTorch autocast selects eligible operation dtypes and can cache converted weights. Parameter storage follows model construction; AMP doesn't create or upgrade the model's parameters. Gradient scaling can fall below one for backward overflow, but cannot repair an already-invalid forward result. https://docs.pytorch.org/docs/2.14/amp.html
- PyTorch's ordinary GradScaler checks and unscales grouped gradients, then makes skip decisions per optimizer. Its ordinary step path reads device flags with `.item()`; AMP-aware optimizers can use a different path. https://github.com/pytorch/pytorch/blob/v2.14.0/torch/amp/grad_scaler.py
- Multiple optimizers step independently and share one subsequent scaler update. Accumulation requires the same scale throughout the complete window and one unscale after all contributions. The new two-optimizer CPU example injects an infinite gradient; it isn't a measured GPU overflow. https://docs.pytorch.org/docs/2.14/notes/amp_examples.html

## Memory and reproducible comparisons

- Autograd's saved-tensor hooks expose the tensors retained for backward. A pack hook must avoid retaining a reference to its input; returning a detached tensor avoids that cycle. The example observes BF16 and FP32 saved dtypes, not peak memory. https://docs.pytorch.org/docs/2.14/autograd.html#torch.autograd.graph.saved_tensors_hooks
- Korthikanti et al. derive activation memory with hidden-state terms and sequence-quadratic attention terms, under explicit storage and architecture assumptions. Recomputation changes the inventory. https://arxiv.org/html/2205.05198v1
- PyTorch documents TF32 controls and reduced-precision GEMM reductions, including cases where partial sums overflow despite a representable final mathematical result. Record those settings alongside tensor dtypes. https://docs.pytorch.org/docs/2.14/notes/numerical_accuracy.html
- CUDA launches are asynchronous; GPU timing needs appropriate synchronization. https://docs.pytorch.org/docs/2.14/notes/cuda.html
- The article's 100-million-parameter/800-million-activation inventory and run-ranking rows are authored arithmetic fixtures. They don't establish a speedup, GPU peak-memory reduction, or quality result for an actual model. Workspaces, cached copies, sharding, and additional buffers need measurement.

## RL and FP8

- Qi et al. report an RL training/inference mismatch reduced by FP16 in their tested algorithms and frameworks. Two local rounding-boundary examples demonstrate why that finding cannot become a universal ordering of formats. https://arxiv.org/html/2510.26788v1
- The FP8 formats paper specifies E4M3 and E5M2 and describes scaling with wider arithmetic/output types; its training experiments emulate FP8 values rather than establish current hardware throughput. https://arxiv.org/html/2209.05433v1
- OCP OFP8 v1.0 specifies maximum finite values 448 and 57,344, no E4M3 infinity, and saturating/non-saturating conversions after rounding. https://www.opencompute.org/documents/ocp-8-bit-floating-point-specification-ofp8-revision-1-0-2023-12-01-pdf-1
- OCP MX v1.0 defines 32-element blocks and E8M0 scales for MXFP8. E8M0 has no zero or infinity; arithmetic precision/order remain implementation-defined, with general dot-product output recommended to support FP32. https://www.opencompute.org/documents/ocp-microscaling-formats-mx-v1-0-spec-final-pdf
- NVIDIA Transformer Engine documentation checked September 22, 2026 identifies version 2.19.0. HYBRID uses E4M3 in the forward path and E5M2 for backward gradients; MXFP8 uses E8M0 block scales and has native Blackwell support. Updated canonical URLs replace older `user-guide` paths. https://docs.nvidia.com/deeplearning/transformer-engine/examples/fp8_primer.html
- Current scaling uses current-tensor `amax`; delayed scaling uses history and can lag new spikes. Both need a declared recipe, not just an `FP8` flag. https://docs.nvidia.com/deeplearning/transformer-engine/api/common.html

## Verification limits

The marked examples run on CPU, including PyTorch autocast and GradScaler behavior. The CUDA training sketch is explanatory and requires compatible hardware and supplied model/data. No GPU fine-tune, RL reproduction, FP8 benchmark, or production deployment is claimed by this review.
