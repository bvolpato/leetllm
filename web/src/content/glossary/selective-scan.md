---
title: Selective scan
aliases: ["Mamba selective scan", "selective state-space scan"]
importance: 77
---
**Selective scan** computes an input-dependent state-space recurrence efficiently across a sequence. Each token can change how much previous state is retained, how strongly the current input is written, and how the result is read out. Those token-dependent parameters call for a hardware-aware parallel scan and fused kernel; time-invariant state-space models can use a fixed convolution shortcut.

## Input-dependent updates still compose

Write one simplified update as $h_t=a_t h_{t-1}+b_t$. Two consecutive updates combine into one affine transformation:

$$
h_2 = a_2a_1h_0 + (a_2b_1+b_2)
$$

That associative composition lets a parallel scan combine neighboring sequence segments while preserving their order. Mamba's fused selective-scan kernel combines discretization, the scan, and state readout to limit expensive movement between device memory and on-chip storage. The surrounding learned projections are separate operations in the original architecture.


## Example

Starting from $h_0=0$, suppose the first token uses $(a_1,b_1)=(0.2,5)$ and the second uses $(a_2,b_2)=(0.9,1)$. Sequential evaluation gives $h_1=5$ and $h_2=5.5$. Composing the updates first gives $a_2a_1=0.18$ and $a_2b_1+b_2=5.5$, producing the same final state. The second token preserves most of the important first update rather than applying a fixed global decay.

## Why it matters here

Mamba's selective scan composes token-dependent recurrent updates in parallel, giving the model content-dependent memory that remains practical on GPUs. Its compact recurrent state trades exact retrieval of every past token for bounded state.

## Related terms

- [State-space model](glossary://state-space-model)
- [Mamba](glossary://mamba)
- [CUDA](glossary://cuda)
- [Fused kernel](glossary://fused-kernel)
