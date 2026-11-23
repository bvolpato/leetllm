---
title: amax
aliases: ["absmax", "amax history"]
importance: 80
kind: code
---
**amax** (absolute max, also written **absmax**) is the largest magnitude in a tensor, or a recent history of those magnitudes, used to compute the scale that maps values into a narrow format such as [FP8](glossary://fp8). Training and inference stacks keep `scale ≈ fp8_max / amax` so a GEMM can run in eight bits without the useful range collapsing to a few codes, or overflowing the format.

Here `amax` denotes a *range* statistic used to produce the scale for FP8 codes. In `torch.amax` and `numpy.amax`, it names a function that takes a maximum along an axis. The same letters refer to different operations.

## Intuition

Narrow floats buy bandwidth. They have a tiny window. If a linear layer's activations sit in $[-6, 6]$ this step and $[-80, 80]$ the next, one fixed scale can't cover both. amax is the live tape measure: watch the peak magnitude, pick a scale, cast, multiply, then interpret the product with that same scale.

[Transformer Engine](glossary://transformer-engine) delayed scaling derives a scale from past amax values, using a configured history length and reduction such as maximum. A large spike can keep the scale conservative until it leaves that window, reducing resolution for smaller subsequent tensors. Current scaling measures the tensor about to be cast. Inspect the recipe rather than assuming a particular window length.

[Loss scaling](glossary://loss-scaling) is a different loop. It multiplies the *scalar loss* so small [FP16](glossary://fp16) gradients stay representable. amax multiplies *tensor values* so they fit in FP8. Mixing the two debug dashboards is a common wild-goose chase.

## Formula

For a tensor $x$:

$$
\operatorname{amax}(x) = \max_i |x_i|
$$

A delayed-scaling sketch used by Transformer Engine is:

$$
s = \frac{x_{\max}^{\mathrm{FP8}}}{\max(\operatorname{amax\_history}) \cdot 2^{m}}
$$

where $x_{\max}^{\mathrm{FP8}}$ is the format's largest finite (448 for E4M3) and $m$ is a margin in powers of two. Values are multiplied by $s$ before the cast and divided by $s$ when read back in a wider type. Real recipes also choose per-tensor vs per-block amax, whether ranks [all-reduce](glossary://all-reduce) the statistic, and which tensors are allowed to go FP8 at all.

## Example

One activation row, E4M3, no margin, current scaling:

| $x$ | $|x|$ | amax | $s = 448 / \mathrm{amax}$ | stored (approx.) |
|---|---|---|---|---|
| $-6.0$ | $6.0$ | $6.0$ | $74.67$ | $-448$ |
| $1.5$ | $1.5$ | $6.0$ | $74.67$ | $112$ |
| $4.0$ | $4.0$ | $6.0$ | $74.67$ | $288$ |

The peak lands on the format max. Round-to-nearest E4M3 stores $4\cdot448/6\approx298.67$ as $288$, recovering about $3.857$ after inverse scaling. Ratios aren't preserved exactly. If the next microbatch peaks at $24$ with the old scale, conversion exceeds the finite range; clipping or nonfinite behavior depends on the cast implementation. Define behavior for zero or nonfinite amax rather than dividing blindly.

A cheap check: dump amax history and scales per module next to saturation / nonfinite counts. If amax stays tiny while activations grow, investigate a stale-scale bug in the scaling path.

## Why it matters here

When evaluating the GLM-5.3 candidate, separate learner compute, serving weights, KV cache, and optimizer precision. An FP8 serving artifact doesn't imply an FP8 learner, and an installed Transformer Engine package doesn't prove that the learner tracks amax. If the selected training recipe uses FP8, include amax history, accumulation width, and kernel support in the convergence checklist: faster matmuls that clip the range can cost more than they save.

## Related terms

- [NVIDIA Transformer Engine](glossary://transformer-engine)
- [FP8](glossary://fp8)
- [Mixed precision](glossary://mixed-precision)
- [Quantization](glossary://quantization)
- [Loss scaling](glossary://loss-scaling)
- [BF16](glossary://bf16)
- [GEMM](glossary://gemm)
- [All-reduce](glossary://all-reduce)
