---
title: Fast Hadamard transform
aliases: ["Fast Walsh-Hadamard transform", "FWHT"]
importance: 58
kind: term
---
**Fast Hadamard transform** computes multiplication by a structured Hadamard matrix in $O(d\log d)$ operations. The butterfly computation uses additions and subtractions; scaling by $1/\sqrt d$ makes the square transform orthogonal and inexpensive to apply.

## LLM role

Some quantization methods rotate activations or weights before low-precision conversion so outliers spread across dimensions. Fast Hadamard kernels make that rotation cheaper than multiplying by arbitrary dense orthogonal matrix.

Some quantization recipes apply a fast Hadamard rotation to activations or weights before low-precision conversion. The transform is an optional path; inspect the model's configuration and execution trace to attribute it to the installed package.

## Mathematical shape

An order-$d$ Hadamard matrix has entries $\pm1$ and satisfies $HH^\mathsf{T}=dI$. Its normalized rows are orthonormal, and the normalized transform maps $x$ to $Hx/\sqrt d$. For the standard power-of-two construction, a butterfly factorization computes the result through $\log_2 d$ add/subtract stages. Non-power-of-two widths may need padding or a specialized construction, which changes workspace and kernel support. Padding embeds the vector in a larger space; cropping the transformed output back to the original width generally loses the orthogonality guarantee.

## Example

Quantization recipe can rotate 4,096-dimensional activation with FWHT before low-bit cast so one large coordinate is distributed across output dimensions.

## Why it matters here

Fast Hadamard transforms can support quantization research around serving weights. The GLM-5.3 masterclass describes a candidate serving path; inspect its quantization implementation and execution trace before adding a Hadamard rotation to the architecture diagram.

## Related terms

- [Quantization](glossary://quantization)
- [FP8](glossary://fp8)
- [Fused kernel](glossary://fused-kernel)
- [CUDA](glossary://cuda)
