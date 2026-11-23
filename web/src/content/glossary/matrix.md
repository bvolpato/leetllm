---
title: Matrix
importance: 88
---
A **matrix** is a rectangular array of numbers arranged in rows and columns. In math it is an element of $\mathbb{R}^{m \times n}$ (or another field). In ML systems it is the 2D case of a [tensor](glossary://tensor): a dense table of parameters, a batch of feature rows, an embedding lookup table, or an intermediate result of a linear map. Almost every dense layer, attention score block, and vocabulary projection is a matrix (or a batch of them) under the hood.

Two views of the same object stay useful at once:

1. **Storage.** An $m \times n$ grid with a dtype and layout (row-major / column-major). Code indexes entries $A_{ij}$ (row $i$, column $j$).
2. **Linear map.** Left-multiplying by $A$ sends $\mathbb{R}^n$ to $\mathbb{R}^m$. Columns of $A$ are the images of the standard basis; rows are coordinate functionals. That is why weight matrices "project" hidden states and why a shape mistake changes the map's geometry.

A [vector](glossary://vector) is a one-column (or one-row) matrix in disguise. Higher-rank tensors batch many matrices: attention often multiplies shapes like $[\text{batch}, \text{heads}, T_q, d]$ by $[\text{batch}, \text{heads}, d, T_k]$, which frameworks treat as batched matrix multiplies.

## Intuition

Name both axes before you multiply. Rows and columns are not symmetric labels:

| Common layout | Row axis | Column axis |
| --- | --- | --- |
| Feature table | example / token | feature |
| Weight $W$ in $XW$ | input dim | output dim |
| Embedding table $E$ | vocabulary id | embedding dim |
| Attention scores | query position | key position |

Once axes have meaning, many bugs become visible: a legal matmul on the wrong semantic axis, a silent transpose that swapped head and sequence, or a weight stored as $[d_{\mathrm{out}}, d_{\mathrm{in}}]$ while the code multiplies as if it were $[d_{\mathrm{in}}, d_{\mathrm{out}}]$. Frameworks differ on that last convention (`nn.Linear` in PyTorch stores weight as $[\text{out}, \text{in}]$ and applies $x W^\top$).

Matrix multiplication is not elementwise multiplication. Elementwise (Hadamard) $A \odot B$ needs matching shapes and never mixes columns. Matmul $AB$ mixes them: each output entry is a [dot product](glossary://dot-product) of a row of $A$ with a column of $B$.

## Formula

**Entrywise definition.** For $A \in \mathbb{R}^{m \times n}$ and $B \in \mathbb{R}^{n \times p}$,

$$
C = AB \in \mathbb{R}^{m \times p}, \qquad
C_{ij} = \sum_{k=1}^{n} A_{ik}\, B_{kj}.
$$

The shared dimension $n$ must match. If it does not, the product is undefined (frameworks raise a shape error; they do not invent a meaning).

**BLAS / GEMM form.** Libraries implement the general matrix multiply

$$
C \leftarrow \alpha\, AB + \beta\, C
$$

with scalars $\alpha, \beta$. Plain $AB$ is the special case $\alpha = 1$, $\beta = 0$. NVIDIA and BLAS name dimensions $M \times K$ for $A$, $K \times N$ for $B$, and $M \times N$ for $C$. Counting a fused multiply-add as two FLOPs,

$$
\mathrm{FLOPs}(AB) = 2 M N K.
$$

**Transpose.** $(AB)^\top = B^\top A^\top$. Transposing swaps row and column indices. NumPy and PyTorch commonly represent this as a strided view without copying data; a requested contiguous layout may materialize a copy.

**Linear layer (math vs code).** As a map on column vectors, $y = Wx + b$ with $W \in \mathbb{R}^{d_{\mathrm{out}} \times d_{\mathrm{in}}}$. With a batch of row vectors $X \in \mathbb{R}^{B \times d_{\mathrm{in}}}$, the same map is often written

$$
Y = X W^\top + b, \qquad Y \in \mathbb{R}^{B \times d_{\mathrm{out}}},
$$

which matches PyTorch `F.linear`. Always check which convention a checkpoint and a kernel share before you hand-roll matmuls.

## Worked numbers

Take

$$
A = \begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}, \quad
B = \begin{bmatrix} 5 & 6 \\ 7 & 8 \end{bmatrix}.
$$

Then

$$
AB =
\begin{bmatrix}
1\cdot5+2\cdot7 & 1\cdot6+2\cdot8 \\
3\cdot5+4\cdot7 & 3\cdot6+4\cdot8
\end{bmatrix}
=
\begin{bmatrix}
19 & 22 \\
43 & 50
\end{bmatrix}.
$$

Shape check: $2 \times 2$ times $2 \times 2$ yields $2 \times 2$. FLOPs: $2 \cdot 2 \cdot 2 \cdot 2 = 16$.

A tiny batch linear map (row-vector convention, already-transposed weights):

```python
import numpy as np

# X: batch=2, d_in=3
X = np.array([[1.0, 0.0, 2.0],
              [0.0, 1.0, 1.0]], dtype=np.float32)
# W: d_in=3, d_out=2  (math "right-multiply" layout)
W = np.array([[0.5, -1.0],
              [0.0,  2.0],
              [1.0,  0.5]], dtype=np.float32)
Y = X @ W
assert Y.shape == (2, 2)
# Y[0] = [1*0.5 + 0 + 2*1, 1*(-1) + 0 + 2*0.5] = [2.5, 0.0]
assert np.allclose(Y[0], [2.5, 0.0])
```

In PyTorch the same geometry is `Y = X @ W.T` when `W` has shape `[d_out, d_in]`, or simply `torch.nn.functional.linear(X, W, b)`.

## Batched products

Batched case: leading dimensions broadcast; the last two dimensions are the matrix multiply, as in `torch.matmul`.

## Example

**1. Dense linear layer.** Activations $X \in \mathbb{R}^{B \times d_{\mathrm{in}}}$, weights laid out as $W_{\mathrm{right}} \in \mathbb{R}^{d_{\mathrm{in}} \times d_{\mathrm{out}}}$:

$$
Y = X W_{\mathrm{right}} + b \in \mathbb{R}^{B \times d_{\mathrm{out}}}.
$$

Each of the $B \cdot d_{\mathrm{out}}$ outputs is one [dot product](glossary://dot-product) of length $d_{\mathrm{in}}$. MLP blocks, Q/K/V projections, and the LM head are stacks of this pattern.

**2. Scaled attention scores.** Queries $Q \in \mathbb{R}^{T_q \times d_k}$ and keys $K \in \mathbb{R}^{T_k \times d_k}$ produce the score matrix

$$
S = \frac{Q K^\top}{\sqrt{d_k}} \in \mathbb{R}^{T_q \times T_k},
$$

then $S$ is softmaxed row-wise and multiplied by values $V$. Every entry of $QK^\top$ is a query–key dot product; packaging them as one matmul is what makes attention GPU-friendly.

**3. Embedding table.** Token embeddings are a matrix $E \in \mathbb{R}^{|V| \times d}$. Looking up id $i$ is selecting row $E_i$ (equivalent to $e_i^\top E$ for a one-hot $e_i$). Storage is $|V| \cdot d$ parameters; the "multiply" is a gather, not a dense GEMM, until you project further.

**4. Production GEMM sizing.** For $M=N=K=4096$ in FP16, FLOPs are $2 \cdot 4096^3 \approx 1.37 \times 10^{11}$. Arithmetic intensity grows with all three dimensions large (prefill, training steps). When the effective batch collapses so one side is 1 (decode, matrix–vector), intensity drops and the same weight matrix becomes memory-bound: you stream weights from HBM for little reuse. That is why batching tokens and continuous batching matter for GPU utilization even when the math is "just" matrix multiplies.

## Axis contract and shape checks

| Check | Why |
| --- | --- |
| Shared matmul dim equal | $A$'s last dim must equal $B$'s second-to-last (for 2D: $n$) |
| Named axes in asserts | `assert x.shape == (B, T, D)` beats guessing from ranks alone |
| Layout convention | `Linear` weight `[out, in]` vs hand-written `[in, out]` |
| Transpose vs reshape | `T` / `.mT` changes strides; wrong reshape can scramble axes while keeping numel |
| Batch broadcast | `matmul` broadcasts leading dims; a silent broadcast can hide a missing head axis |

Typical production failures:

- **Shape-legal, semantics-wrong.** Code runs, loss looks "a bit off," because you multiplied head-dim against sequence length after a bad permute.
- **Contiguous vs strided.** A transpose without `.contiguous()` (when a kernel requires it) can crash or force a hidden copy and hurt latency.
- **Dtype / Tensor Core alignment.** Mixed precision GEMMs want dimensions friendly to Tensor Cores (historically multiples of 8 for FP16 elements; larger powers of two help on newer GPUs). Odd hidden sizes waste work via tile quantization.
- **Numeric scale.** Large unnormalized dot products can produce overly sharp softmax weights or overflow when converted to FP16 output. [NVIDIA's GEMM example](https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/index.html) uses FP16 inputs with FP32 accumulation; input dtype alone does not specify accumulator precision. Attention scaling controls score magnitude, while loss scaling primarily protects small gradients from underflow and must detect overflow before updates.

Print shapes at module boundaries and assert named dimensions in tests. If profiler time sits in `gemm` / `matmul` with low Tensor Core utilization, inspect $M,N,K$, batch, and whether you are in matrix–matrix or matrix–vector regime.

## Why it matters here

Matrices are the concrete type behind linear layers, attention scores, embedding tables, covariance-style diagnostics, and low-rank adapters (a LoRA update is a product of two thin matrices). LLM training and inference spend most FLOPs inside GEMMs. Reading $C = AB$ as both geometry (linear map) and engineering (shape, FLOPs, memory traffic) is what lets you debug silent axis bugs, estimate cost, and connect curriculum topics on tensors, attention, and GPU performance.

## Related terms

- [Tensor](glossary://tensor)
- [Vector](glossary://vector)
- [Dot product](glossary://dot-product)
- [Tensor shape](glossary://tensor-shape)
- [Arithmetic intensity](glossary://arithmetic-intensity)
