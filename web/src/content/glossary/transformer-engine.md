---
title: NVIDIA Transformer Engine
aliases: ["Transformer Engine", "TransformerEngine", "transformer_engine", "TE"]
importance: 82
kind: code
---
**NVIDIA Transformer Engine** is a library of optimized Transformer building blocks and low-precision training tools for NVIDIA GPUs. It supplies framework integrations for PyTorch and JAX plus a framework-independent C++ API.

Transformer Engine supports FP8 and manages quantization recipes, scaling factors, [amax](glossary://amax) statistics, fused operations, and precision-sensitive execution around linear layers, attention, normalization, and Transformer blocks. Current releases also expose MXFP8 and NVFP4 paths on supported Blackwell GPUs.

## Intuition

A model author wants to write a familiar linear layer. Hardware wants aligned tensor shapes, efficient kernels, safe accumulation, and scaling rules that keep narrow datatypes from overflowing or losing useful signal. Transformer Engine sits between those views:


The recipe says which low-precision format and scaling strategy to use. Transformer Engine decides which inputs are safe to cast, runs optimized kernels, and updates metadata needed by later steps.

## FP8 needs scaling

FP8 stores each value in eight bits, leaving less precision and dynamic range than BF16 or FP16. Transformer Engine tracks a maximum absolute value, often called [amax](glossary://amax), then derives scale factors that map useful tensor values into the representable FP8 range.

For delayed scaling, a simplified view is:

$$
s = \frac{x_{\max}^{\text{FP8}}}{\max(\operatorname{amax\_history})}
$$

Values are multiplied by $s$ before conversion and divided by $s$ when interpreted in a wider format. This simplified ratio assumes a positive finite history maximum; real implementations handle zero and nonfinite statistics and specify FP8 formats, history length, margin, reduction across ranks, and scaling policy. NVIDIA's [current precision primer](https://docs.nvidia.com/deeplearning/transformer-engine/examples/fp8_primer.html) documents the FP8, MXFP8, and NVFP4 recipes and hardware constraints.

Keep reductions, normalization statistics, softmax, optimizer state, and gradient accumulation in wider precision when numerics require it. Transformer Engine applies low precision to supported paths while retaining wider representations where needed.

## Example

```python
import torch
import transformer_engine.pytorch as te
from transformer_engine.common import recipe

layer = te.Linear(6144, 12288, bias=False).cuda()
inputs = torch.randn(2048, 6144, device="cuda")

fp8_recipe = recipe.DelayedScaling(
    fp8_format=recipe.Format.HYBRID,
    amax_history_len=16,
)

with te.autocast(enabled=True, recipe=fp8_recipe):
    outputs = layer(inputs)
```

The context enables Transformer Engine's FP8 path for supported operations. Other operations follow the kernel eligibility, tensor shape, recipe, hardware, and framework integration rules that determine effective execution.

## Relationship to Megatron

[NVIDIA Megatron](glossary://nvidia-megatron) and Transformer Engine solve different layers:

| Layer | Owns |
| --- | --- |
| Megatron Core | Model partitioning, process groups, pipeline schedules, distributed optimizer, training loop building blocks |
| Transformer Engine | Optimized Transformer modules, fused kernels, low-precision recipes, scaling metadata |
| CUDA libraries and GPU | Kernel execution, memory operations, hardware instructions |

Megatron can construct a tensor-parallel linear layer backed by Transformer Engine. Megatron decides which ranks own each shard; Transformer Engine accelerates local math and precision handling on each rank.

## Common mistake

**Verify that enabling FP8 selects efficient kernels and preserves numerical behavior.**

Check effective module type, recipe, hardware support, tensor divisibility, fallback kernels, amax and scale behavior, overflow signals, loss curves, and throughput. A run can be mathematically stable but slower from unfavorable shapes. It can also benchmark quickly for a few steps while diverging later because scaling behavior is wrong.

## Why it matters here

Transformer Engine is a major boundary in NVIDIA training stacks. Megatron configurations may select BF16, FP8, MXFP8, or NVFP4 behavior whose implementation lives partly inside Transformer Engine. Version skew among Megatron Core, PyTorch, CUDA, cuDNN, and Transformer Engine can break imports, change kernel selection, or alter checkpoint metadata.

Performance analysis should therefore record exact container and package versions, resolved precision recipe, fallback rate, matrix shapes, and convergence checks; `fp8=true` alone leaves out these execution details.

## Official references

- [Transformer Engine documentation](https://docs.nvidia.com/deeplearning/transformer-engine/user-guide/)
- [FP8 and FP4 guide](https://docs.nvidia.com/deeplearning/transformer-engine/user-guide/examples/fp8_primer.html)
- [Transformer Engine repository](https://github.com/NVIDIA/TransformerEngine)

## Related terms

- [NVIDIA Megatron](glossary://nvidia-megatron)
- [NVIDIA NeMo](glossary://nvidia-nemo)
- [FP8](glossary://fp8)
- [amax](glossary://amax)
- [BF16](glossary://bf16)
- [Mixed precision](glossary://mixed-precision)
- [GEMM](glossary://gemm)
- [Tensor Core](glossary://tensor-core)
- [CUDA](glossary://cuda)
