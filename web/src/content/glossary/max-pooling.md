---
title: Max pooling
aliases: ["maximum pooling", "max-pooling"]
importance: 78
---
**Max pooling** downsamples a tensor by keeping the largest activation inside each local window, channel by channel. It preserves the strongest local response, discards the rest, introduces no learnable weights, and is the classic spatial bottleneck in CNNs between stacks of [convolution kernels](glossary://convolution-kernel).

## Intuition

Max pooling says: keep the strongest local evidence and forget the rest. If an edge detector fires at 0.9 next to three near-zeros, the pool stores 0.9. If that peak slides one pixel but stays inside the same window, the pooled value can stay the same. That is a weak form of local shift robustness, not full [translation equivariance](glossary://translation-equivariance) (convolution is equivariant; pooling is closer to local invariance inside each window).

Average pooling keeps more of the mass; max pooling keeps the peak. Boureau, Ponce, and LeCun (ICML 2010) analyzed both as feature aggregators: max is often better when strong, sparse detector responses matter for discrimination; average is smoother when many moderate activations should count.

## Formula

For one channel, a 2D window $R$ of activations:

$$
y = \max_{(i,j) \in R} x_{ij}
$$

PyTorch `nn.MaxPool2d` on input $(N, C, H_{\mathrm{in}}, W_{\mathrm{in}})$ with kernel $(k_H, k_W)$, stride $(s_H, s_W)$, padding $(p_H,p_W)$, and dilation $(d_H,d_W)$ (default $d_H=d_W=1$) computes, per sample and channel:

$$
\begin{aligned}
\mathrm{out}(N_i, C_j, h, w)
&= \max_{m=0,\ldots,k_H-1}\ \max_{n=0,\ldots,k_W-1} \\
&\quad \mathrm{input}\bigl(N_i, C_j,\ s_Hh-p_H+d_Hm,\ s_Ww-p_W+d_Wn\bigr)
\end{aligned}
$$

Indices outside the input are treated as $-\infty$. Output spatial size (floor mode, the default):

$$
H_{\mathrm{out}} = \left\lfloor
\frac{H_{\mathrm{in}} + 2p_H - d_H(k_H - 1) - 1}{s_H}
\right\rfloor + 1
$$

and the same form for $W_{\mathrm{out}}$ with $p_W,d_W,k_W,s_W$. Default `stride` is `kernel_size`. Channel count $C$ is unchanged: pooling never mixes channels.

With $k = s = 2$ and no padding, each non-overlapping $2 \times 2$ block becomes one value and spatial area shrinks by $4\times$ (75% of activations discarded per CS231n's usual accounting).

## Example

Non-overlapping $2 \times 2$ max pool, stride 2, on one channel:

$$
X = \begin{bmatrix}
1 & 3 & 2 & 4 \\
5 & 0 & 1 & 2 \\
2 & 8 & 3 & 1 \\
0 & 1 & 6 & 7
\end{bmatrix}
\quad\rightarrow\quad
Y = \begin{bmatrix}
5 & 4 \\
8 & 7
\end{bmatrix}
$$

Windows: $\max(1,3,5,0)=5$, $\max(2,4,1,2)=4$, $\max(2,8,0,1)=8$, $\max(3,1,6,7)=7$. Shape goes from $4 \times 4$ to $2 \times 2$; depth is untouched.

Same $X$ with $k=2$, $s=1$ (overlapping windows) yields a $3 \times 3$ map because the window steps by one instead of two. Same operator, different compression.

```python
import torch
import torch.nn as nn

x = torch.tensor([[[[1., 3., 2., 4.],
                    [5., 0., 1., 2.],
                    [2., 8., 3., 1.],
                    [0., 1., 6., 7.]]]])  # NCHW
y = nn.MaxPool2d(kernel_size=2, stride=2)(x)
# y[0, 0] == [[5, 4], [8, 7]]
```


## How it works

1. **Per depth slice.** On a volume $H \times W \times C$ (or `NCHW` tensors), each channel is pooled independently. A channel that detects vertical edges is not mixed with a color blob channel.
2. **Slide and reduce.** Place a $k \times k$ window, take $\max$, step by stride $s$, repeat. No weights, no bias: the only hyperparameters are $k$, $s$, padding, dilation, and ceil vs floor for odd sizes.
3. **Backward pass.** $\max$ routes the upstream gradient to a selected maximum in each window ("switches" in CS231n). Tie behavior depends on the implementation; do not assume equal gradients for every tied maximum. Overlapping windows can contribute gradients to the same input. `return_indices=True` exposes the selected indices for `MaxUnpool2d`, which places pooled values back at those indices rather than recovering discarded detail.
4. **Receptive field.** Each pooled cell covers a larger patch of the previous map, so stack depth plus pooling grows the [receptive field](glossary://receptive-field) while shrinking resolution of the [feature map](glossary://feature-map).

Common practical settings (CS231n): $F=2, S=2$ (dominant) and overlapping $F=3, S=2$. Windows larger than $3\times 3$ are usually too lossy for intermediate maps.

## Sizing

| Setting | $H_{\mathrm{in}}=4$, $k=2$ | Notes |
|---------|---------------------------|--------|
| $s=2$, $p=0$ | $H_{\mathrm{out}}=2$ | Standard halving |
| $s=1$, $p=0$ | $H_{\mathrm{out}}=3$ | Overlapping, mild downsample |
| $s=2$, `ceil_mode=True` on odd $H$ | Can keep an extra cell | Border windows may hang off the edge |

VGG-style stacks use $3\times 3$ conv (pad 1, stride 1) then $2\times 2$ max pool stride 2, so only the pool changes spatial size. Many modern backbones (ResNet and descendants) replace intermediate max pools with strided convolutions and keep global average pooling (or a similar collapse) only at the end for a fixed-size vector.

## Trade-offs

| Choice | Strength | Cost |
|--------|----------|------|
| Max pool | Peak responses, cheap, parameter-free, slight local shift robustness | Throws away non-max detail; poor for dense position recovery |
| Average pool | Smoother aggregate, used as global pool in classifiers | Dilutes sparse strong signals |
| Strided conv | Learned downsample, can preserve task-relevant structure | Extra parameters and compute |
| No spatial pool (ViT-style) | Keeps full token grid until the head | Memory and compute grow with resolution |

**What fails in production.** Aggressive early $2\times$ stacks erase small objects, thin text, or UI icons long before the classifier head (total stride $32$ on a $640\times 640$ image yields a $20\times 20$ map). Detection and OCR teams often shorten the pool stack, use feature pyramids, or switch to strided conv with higher-resolution heads. Shape bugs show up when encoder and decoder disagree on pool count or when `ceil_mode` / padding differ between training and export. For embeddings, global max over spatial or token axes can overweight one loud region; mean pool is often more stable for retrieval-style vectors.

## Why it matters here

Max pooling is how classic vision stacks trade spatial detail for compact, somewhat shift-robust features. Curriculum pieces on receptive fields, feature maps, and CNN baselines all assume this operator. In LLM-adjacent systems it still appears inside image encoders, OCR and document pipelines, frozen CNN stems feeding vision-language models, and any place you collapse a local grid to a coarser map or a single vector.

## Related terms

- [Receptive field](glossary://receptive-field)
- [Convolution kernel](glossary://convolution-kernel)
- [Stride](glossary://stride)
- [Feature map](glossary://feature-map)
- [Translation equivariance](glossary://translation-equivariance)
