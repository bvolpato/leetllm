---
{
  "id": "convolutional-neural-networks-from-scratch",
  "title": "CNNs from Scratch",
  "slug": "convolutional-neural-networks-from-scratch",
  "section": "Preparation & Prerequisites",
  "category": "Model Architecture",
  "difficulty": "Easy",
  "order": 3,
  "coverImage": "illustrations/_generated/conv_kernels_feature_maps_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic",
    "Microsoft",
    "Amazon",
    "Apple"
  ],
  "shortDescription": "A two-pixel shift breaks a model that memorizes coordinates. Trace shared kernels, shapes, pooling, and padding on one 4 by 4 crop.",
  "keyConceptsTested": [
    "Why images need local shared weights",
    "Convolution by hand on a 4 by 4 patch",
    "Stride, padding, and output shapes",
    "Multi-channel filters and parameter counting",
    "Receptive-field growth through stacked layers",
    "Max pooling and saved winner locations",
    "Border-evidence failure without padding",
    "Artificial edges from zero padding",
    "NumPy and PyTorch CNN forward passes"
  ]
}
---

A bright hairline mark cuts diagonally across an equipment panel photo. Shift that mark two pixels right, and any human inspector still spots it instantly. A dense neural network that assigns a separate weight to every pixel coordinate breaks on that tiny shift, because the scratch just moved onto different input wires.

The [previous lesson](/learn/neural-networks-from-scratch) fed named tabular features into dense layers where every column had a fixed meaning. Images carry spatial structure: nearby pixels form edges, corners, and textures, and the same pattern can appear anywhere in the frame. Flattening a photo into a long vector forces a dense layer to relearn the same edge detector at every location from scratch.

Convolutional neural networks bake that spatial structure directly into the architecture through two ideas: **local receptive fields** and **weight sharing**.[^lecun1998][^goodfellow2016] We will trace one `4 x 4` crop by hand through convolution, tensor shapes, max pooling, border padding, and a matching PyTorch forward pass.

## Make reuse pay for itself

Suppose the inspection camera resizes images to `224 x 224` RGB pixels, where each pixel holds red, green, and blue intensities across three channels. Connecting that full input grid to a modest hidden layer of 256 dense units gives every hidden unit its own distinct weight for every single color channel at every spatial coordinate. A convolutional layer replaces this global wiring with localized detectors. Instead of observing all 150,528 numbers at once, each `3 x 3` RGB detector inspects a small spatial window of `3 x 3 x 3 = 27` weights plus one bias scalar, sliding that exact weight bank across every valid position in the image.

<!-- leetllm: test, output=show -->
```python title="dense-versus-conv-parameters.py"
height, width, channels, hidden = 224, 224, 3, 256
dense_weights = height * width * channels * hidden
dense_biases = hidden
dense_parameters = dense_weights + dense_biases

filters, kernel = 16, 3
conv_weights = filters * channels * kernel * kernel
conv_biases = filters
conv_parameters = conv_weights + conv_biases

print(f"dense parameters: {dense_parameters:,} ({dense_weights:,} weights + {dense_biases} biases)")
print(f"conv parameters: {conv_parameters:,} ({conv_weights:,} weights + {conv_biases} biases)")
print(f"parameter-count ratio: {dense_parameters / conv_parameters:,.0f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dense parameters: 38,535,424 (38,535,168 weights + 256 biases)
conv parameters: 448 (432 weights + 16 biases)
parameter-count ratio: 86,017x
```
<!-- leetllm: output:end -->

The dense layer requires over 38.5 million parameters, while the convolutional layer needs just 448. Two design choices drive that 86,000x reduction: **local connectivity** restricts each detector to a small $3 \times 3$ neighborhood, and **weight sharing** slides that single filter bank across every position on the grid.

Without weight sharing, giving each of the `222 x 222` output positions its own private 16-filter bank would still take `222 * 222 * 448 = 22,079,232` parameters. Sharing one filter bank across all positions collapses 22 million weights down to 448 while keeping the exact same `16 x 222 x 222` feature map output.

<figure>
  <img src="illustrations/_generated/output_shape_parameter_savings_dark.png" alt="A tied 16-filter bank is reused across a 222 by 222 field of local output positions, for 448 total parameters. Giving every position its own bank uses 22,079,232 parameters for the same output shape. A dense layer over a flattened 224 by 224 RGB crop uses 38,535,424 parameters and produces 256 scores." />
  <figcaption>One 16-filter bank serves all 222 × 222 output sites with 448 parameters. Independent banks keep that local output shape and use 22,079,232 parameters. A dense layer over the flattened RGB crop uses 38,535,424 parameters for 256 scores.</figcaption>
</figure>

Beyond saving memory, weight sharing gives convolution **<span data-glossary="translation-equivariance">translation equivariance</span>**. An operation $f$ is equivariant to a spatial shift $T_{\Delta}$ when shifting the input shifts the feature map by the exact same amount:

$$
f(T_{\Delta}(x)) = T_{\Delta}(f(x))
$$

For stride-one convolution away from image borders, shifting a scratch three pixels right shifts its detector peak three pixels right. (Image boundaries and strides larger than one break exact equality because patterns cross the border or fall out of phase with the sampling grid.)

> **Key insight:** **Translation equivariance** ($f(T_{\Delta}(x)) = T_{\Delta}(f(x))$) means the feature map moves with the object; **translation invariance** ($g(T_{\Delta}(x)) = g(x)$) means the final prediction stays unchanged when the object moves. Convolutions provide equivariance; pooling and global averaging build invariance on top.

## Let one detector find one pattern

Examine a concrete grayscale crop representing a small defect on a dark metallic surface. Values range between 0.0 (dark surface) and 1.0 (bright scratch). Four bright values form a central `2 x 2` mark surrounded by background:

| Input crop | Column 1 | Column 2 | Column 3 | Column 4 |
| --- | ---: | ---: | ---: | ---: |
| Row 1 | 0.05 | 0.08 | 0.06 | 0.07 |
| Row 2 | 0.12 | 0.92 | 0.88 | 0.09 |
| Row 3 | 0.08 | 0.90 | 0.93 | 0.11 |
| Row 4 | 0.06 | 0.07 | 0.09 | 0.05 |

Select a `3 x 3` filter, also called a kernel. This kernel rewards bright middle rows while penalizing brightness in adjacent rows, acting as a horizontal line and ridge detector:

| Kernel | Column 1 | Column 2 | Column 3 |
| --- | ---: | ---: | ---: |
| Row 1 | -0.6 | -0.6 | -0.6 |
| Row 2 | 1.1 | 1.1 | 1.1 |
| Row 3 | -0.6 | -0.6 | -0.6 |

Placing a `3 x 3` window over a `4 x 4` grid yields `4 - 3 + 1 = 2` valid starting rows and 2 valid starting columns, producing a `2 x 2` output feature map.

Assuming zero bias for this trace, overlay the kernel on the upper-left `3 x 3` patch covering rows 0 to 2 and columns 0 to 2. Multiply aligned values elementwise and sum the products:

$$
\begin{aligned}
y_{0,0} ={}& (-0.6)(0.05 + 0.08 + 0.06) \\
&+ (1.1)(0.12 + 0.92 + 0.88) \\
&+ (-0.6)(0.08 + 0.90 + 0.93) \\
={}& -0.114 + 2.112 - 1.146 \\
={}& 0.852
\end{aligned}
$$

The middle row contributes `+2.112`, exceeding the combined negative contributions from the neighboring rows (`-0.114` and `-1.146`). Summing all three row contributions yields a pre-activation response of `0.852` at output coordinate `(0, 0)`. This positive scalar reflects how strongly the bright central band outweighs the darker top and bottom rows.

<!-- leetllm: test, output=show -->
```python title="one-convolution-window.py"
patch = (
    (0.05, 0.08, 0.06),
    (0.12, 0.92, 0.88),
    (0.08, 0.90, 0.93),
)
kernel = (
    (-0.6, -0.6, -0.6),
    (1.1, 1.1, 1.1),
    (-0.6, -0.6, -0.6),
)

row_contributions = [
    round(sum(pixel * weight for pixel, weight in zip(row, kernel_row)), 3)
    for row, kernel_row in zip(patch, kernel)
]
response = sum(
    pixel * weight
    for row, kernel_row in zip(patch, kernel)
    for pixel, weight in zip(row, kernel_row)
)

print(f"row contributions: {row_contributions}")
print(f"first response: {response:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
row contributions: [-0.114, 2.112, -1.146]
first response: 0.852
```
<!-- leetllm: output:end -->

Slide the identical kernel across the remaining three positions. Each placement computes an inner product between kernel weights and the aligned image window:

| Window | Crop rows, cols | Response |
| --- | --- | ---: |
| Top left | `0:3`, `0:3` | 0.852 |
| Top right | `0:3`, `1:4` | 0.789 |
| Bottom left | `1:4`, `0:3` | 0.817 |
| Bottom right | `1:4`, `1:4` | 0.874 |

The bottom-right window yields `0.874`, the highest activation on the grid, because rows 2 and 3 sit directly beneath the `+1.1` middle strip while row 4's low background intensities (`0.06`, `0.07`, `0.09`) minimize the bottom `-0.6` penalty. Compare that with the top-right offset, where two bright edge pixels fall inside the `-0.6` bottom weights and pull the score down to `0.789`. Because every offset applies the exact same weights, sliding one shared kernel builds a complete spatial map of feature match strength.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="slide-the-kernel.py"
import numpy as np

image = np.array([
    [0.05, 0.08, 0.06, 0.07],
    [0.12, 0.92, 0.88, 0.09],
    [0.08, 0.90, 0.93, 0.11],
    [0.06, 0.07, 0.09, 0.05],
])
kernel = np.array([
    [-0.6, -0.6, -0.6],
    [1.1, 1.1, 1.1],
    [-0.6, -0.6, -0.6],
])

def convolve_valid(image: np.ndarray, kernel: np.ndarray) -> np.ndarray:
    out_height = image.shape[0] - kernel.shape[0] + 1
    out_width = image.shape[1] - kernel.shape[1] + 1
    output = np.empty((out_height, out_width))
    for row in range(out_height):
        for col in range(out_width):
            window = image[row:row + kernel.shape[0], col:col + kernel.shape[1]]
            output[row, col] = np.sum(window * kernel)
    return output

feature_map = convolve_valid(image, kernel)
strongest = tuple(int(pos) for pos in np.unravel_index(np.argmax(feature_map), feature_map.shape))
print(np.round(feature_map, 3))
print("strongest response:", strongest)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[[0.852 0.789]
 [0.817 0.874]]
strongest response: (1, 1)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/conv_kernels_feature_maps_dark.png" alt="A 4 by 4 grayscale crop and a 3 by 3 horizontal detector. The first window uses row sums 0.19, 1.92, and 1.91, producing a response of 0.852. The same kernel scans all four valid positions to make a 2 by 2 feature map with responses 0.852, 0.789, 0.817, and 0.874." />
  <figcaption>The highlighted upper-left 3 × 3 window produces 0.852 from its three row sums. Reusing the kernel at all four valid offsets fills the 2 × 2 feature map; the strongest response, 0.874, lands at the bottom right.</figcaption>
</figure>

Strict mathematical convolution flips the kernel horizontally and vertically before sliding, whereas PyTorch's `nn.Conv2d` computes cross-correlation without flipping.[^goodfellow2016][^pytorchConv2d2026] When weights are learned from data, the network simply learns the flipped or unflipped orientation directly (watch out only when importing a fixed asymmetric filter). Now extend this single grayscale channel to color images, strides, and border padding.

## Shapes, channels, and padding modes

The `4 x 4` crop so far has only one grayscale channel. Real camera images bring multiple color channels, and deeper architectures vary stride, padding, dilation rate, and filter count. Keeping these tensor dimensions consistent ensures every layer hands compatible feature maps to the next.

For an input spatial dimension $W$, kernel size $K$, padding $P$, stride $S$, and dilation rate $D$, the output spatial dimension is:

$$
W_{\text{out}} = \left\lfloor \frac{W + 2P - D(K - 1) - 1}{S} \right\rfloor + 1
$$

When dilation $D = 1$ (standard dense sampling), the effective kernel size equals $K$, simplifying the formula to:

$$
W_{\text{out}} = \left\lfloor \frac{W + 2P - K}{S} \right\rfloor + 1
$$

In both forms, the floor operator discards incomplete windows that hang off the padded border rather than reading out-of-bounds memory. Dilation ($D > 1$) widens the filter's reach by inserting $D - 1$ zeros between kernel taps without adding learned parameters: a $3 \times 3$ kernel with dilation $D = 2$ covers a $5 \times 5$ spatial span while keeping only 9 weights. Padding then decides how input borders are extended before sliding begins:

1. **Valid padding ($P = 0$):** No border cells are added. At stride one, the spatial dimension shrinks by $D(K - 1)$, or by $K - 1$ when dilation is one.
2. **Same padding at stride one:** Choose padding so $W_{\text{out}} = W$. With dilation one and an odd kernel, symmetric padding $P = (K - 1)/2$ works: one pixel for a `3 x 3` kernel, two for `5 x 5`. Dilation changes the required total padding to $D(K - 1)$; an odd total needs unequal padding on the two sides. PyTorch's `padding='same'` supports only stride one.[^pytorchConv2d2026]

<!-- leetllm: test, output=show -->
```python title="convolution-output-size.py"
def conv_size(size: int, kernel: int, stride: int = 1, padding: int = 0, dilation: int = 1) -> int:
    if size <= 0 or kernel <= 0 or stride <= 0 or padding < 0 or dilation <= 0:
        raise ValueError("size, kernel, stride, and dilation must be positive; padding cannot be negative")
    effective_kernel = dilation * (kernel - 1) + 1
    if effective_kernel > size + 2 * padding:
        raise ValueError("effective kernel cannot exceed padded input size")
    return (size + 2 * padding - effective_kernel) // stride + 1

configurations = [
    ("worked crop", 4, 3, 1, 0, 1),
    ("same-size crop", 4, 3, 1, 1, 1),
    ("strided screenshot", 224, 3, 2, 1, 1),
    ("dilated feature map", 28, 3, 1, 0, 2),
]

for name, size, kernel, stride, padding, dilation in configurations:
    output = conv_size(size, kernel, stride, padding, dilation)
    print(f"{name}: {size} -> {output}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
worked crop: 4 -> 2
same-size crop: 4 -> 4
strided screenshot: 224 -> 112
dilated feature map: 28 -> 24
```
<!-- leetllm: output:end -->

Channels introduce a third dimension. In the ordinary `groups=1` convolution used here, one filter has shape $(C_{\text{in}}, K, K)$ and spans all three RGB channels simultaneously. At each spatial stop, the filter computes a three-dimensional inner product across all input channels, sums them into one scalar response, and adds a single bias term. Producing $F$ distinct output feature maps therefore requires $F$ separate filters, giving a weight tensor of shape $(F, C_{\text{in}}, K, K)$ plus $F$ biases.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="rgb-filter-parameters.py"
import numpy as np

image = np.zeros((3, 224, 224))
filters = np.zeros((16, 3, 3, 3))
biases = np.zeros(16)

assert filters.shape[1] == image.shape[0]
print("input shape:", image.shape)
print("one filter shape:", filters[0].shape)
print("output channels:", filters.shape[0])
print("parameters including biases:", filters.size + biases.size)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
input shape: (3, 224, 224)
one filter shape: (3, 3, 3)
output channels: 16
parameters including biases: 448
```
<!-- leetllm: output:end -->

For a PyTorch batch ordered **NCHW** (`batch, channels, height, width`), $F$ filters map $(N, C_{\text{in}}, H_{\text{in}}, W_{\text{in}})$ to $(N, F, H_{\text{out}}, W_{\text{out}})$. In a grouped convolution with $G$ groups, each filter reads only $C_{\text{in}}/G$ input channels (both $C_{\text{in}}$ and $F$ must be divisible by $G$), cutting parameter count by a factor of $G$.[^pytorchConv2d2026]

## Receptive fields and channel expansion

An activation in the first feature map sees a $3 \times 3$ input patch. Stacking a second $3 \times 3$ convolution lets each second-layer activation see a $3 \times 3$ window of the first map, which reaches a $5 \times 5$ region of the raw image. That input footprint is the unit's **<span data-glossary="receptive-field">receptive field</span>**, tracked across layers with two numbers:[^araujo2019ReceptiveFields]

1. `field`: the side length of the receptive field in raw input pixels.
2. `jump`: the spacing between adjacent activation centers in raw input pixels.

For a layer with kernel size $K$, stride $S$, and dilation $D$:

$$
\text{field}_{\text{new}} = \text{field} + D(K - 1) \cdot \text{jump},
\qquad
\text{jump}_{\text{new}} = \text{jump} \cdot S
$$

Tracing a four-layer stack at dilation $D = 1$ shows how stride-two pooling accelerates context growth:

<!-- leetllm: test, output=show -->
```python title="receptive-field-trace.py"
layers = [
    ("conv 3x3", 3, 1),
    ("conv 3x3", 3, 1),
    ("pool 2x2", 2, 2),
    ("conv 3x3", 3, 1),
]

field, jump = 1, 1
for name, kernel, stride in layers:
    field = field + (kernel - 1) * jump
    jump = jump * stride
    print(f"{name:9s} receptive field={field:2d}, jump={jump}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
conv 3x3  receptive field= 3, jump=1
conv 3x3  receptive field= 5, jump=1
pool 2x2  receptive field= 6, jump=2
conv 3x3  receptive field=10, jump=2
```
<!-- leetllm: output:end -->

Notice how pooling accelerates receptive field growth: a stride of 2 doubles the jump from 1 to 2, so the subsequent $3 \times 3$ convolution adds $(3 - 1) \times 2 = 4$ input pixels and reaches a $10 \times 10$ context window. Many classification backbones also increase channel counts as spatial resolution drops, allowing wider channel budgets to represent diverse local combinations, though channel expansion is a design choice rather than an automatic consequence of downsampling. The figure below traces an all-valid sequence matching our exact receptive-field progression across convolution, convolution, pooling, and convolution. Early activations respond to small local neighborhoods while deeper units integrate evidence across wider regions, though aggressive downsampling discards fine spatial detail when inspecting hairline defects just a few pixels wide.

<figure>
  <img src="illustrations/_generated/receptive_field_channel_expansion_dark.png" alt="Nested pixel regions show one activation’s receptive field growing from 1 by 1 at the input to 3 by 3, 5 by 5, 6 by 6 after pooling, and 10 by 10 after the next convolution. A separate channel track shows 3, 16, 32, 32, and 64 channels as spatial maps change from 224 by 224 to 222, 220, 110, and 108." />
  <figcaption>The nested regions trace one activation’s receptive field from 1 × 1 through 3 × 3, 5 × 5, 6 × 6, and 10 × 10. The lower track keeps channel count separate from spatial size: map sides step through 224, 222, 220, 110, and 108; stride-two pooling doubles the jump to two input pixels.</figcaption>
</figure>

## Pooling mechanisms and gradient routing

Downsampling feature maps reduces the number of spatial positions processed by later layers while summarizing evidence over a larger spatial neighborhood. Because pooling operates directly on activations with a fixed reduction rule rather than learned parameters, it shrinks spatial dimensions without increasing weight count, though every downsampling step discards fine localization detail. Two pooling mechanisms cover most convolutional architectures:

1. **Max pooling:** Keeps the peak value in each window. If a crack detector fires strongly anywhere in a $2 \times 2$ cell, max pooling preserves that peak and adds local shift tolerance.
2. **Average pooling:** Takes the arithmetic mean of each window, diluting a sharp single-pixel spike across its neighbors.

**Global Average Pooling (GAP)** averages each channel across its entire spatial grid, collapsing $(N, C, H, W)$ to $(N, C)$. A $Q$-class linear head then needs only $CQ + Q$ parameters instead of $CHWQ + Q$, trading away spatial location in exchange for a dramatically smaller head.

Evaluate standard $2 \times 2$ max pooling with stride 2 over this $4 \times 4$ response grid:

| Feature map | Column 1 | Column 2 | Column 3 | Column 4 |
| --- | ---: | ---: | ---: | ---: |
| Row 1 | 0.10 | 0.42 | 0.18 | 0.30 |
| Row 2 | 0.25 | 0.91 | 0.44 | 0.12 |
| Row 3 | 0.08 | 0.21 | 0.77 | 0.55 |
| Row 4 | 0.16 | 0.14 | 0.32 | 0.49 |

<!-- leetllm: test, deps=numpy, output=show -->
```python title="max-pooling-winners.py"
import numpy as np

feature_map = np.array([
    [0.10, 0.42, 0.18, 0.30],
    [0.25, 0.91, 0.44, 0.12],
    [0.08, 0.21, 0.77, 0.55],
    [0.16, 0.14, 0.32, 0.49],
])

pooled = np.empty((2, 2))
winners = []
for row in range(2):
    for col in range(2):
        block = feature_map[row * 2:row * 2 + 2, col * 2:col * 2 + 2]
        local_row, local_col = np.unravel_index(np.argmax(block), block.shape)
        pooled[row, col] = block[local_row, local_col]
        winners.append((int(row * 2 + local_row), int(col * 2 + local_col)))

print(np.round(pooled, 2))
print("winner coordinates:", winners)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[[0.91 0.44]
 [0.21 0.77]]
winner coordinates: [(1, 1), (1, 2), (2, 1), (2, 2)]
```
<!-- leetllm: output:end -->

The output keeps `0.91`, `0.44`, `0.21`, and `0.77`, picking one winning peak from each `2 x 2` quadrant at zero-based coordinates `(1, 1)`, `(1, 2)`, `(2, 1)`, and `(2, 2)`. Tracking those exact winner positions during the forward pass determines where error signals flow on the backward pass, because non-winning cells did not affect the maximum in that neighborhood. As a result, error gradients $\delta = \frac{\partial \mathcal{L}}{\partial y}$ split along different rules for max and average pooling:

- In **max pooling**, only the winning activation receives the window's incoming gradient: $\frac{\partial \mathcal{L}}{\partial x_{\text{winner}}} = \delta$. All non-winning cells in that window get zero.
- In **average pooling** over an unpadded $K \times K$ window, every cell receives $\delta / K^2$. When windows overlap, a cell accumulates the sum of gradients from every window that covers it.

```checkpoint
For the four pooled values above, suppose the incoming gradients are [[2.0, -1.0], [0.5, 3.0]]. Which entries of the 4 by 4 input-gradient map are nonzero?
---
Only the selected winners: (1,1) gets 2.0, (1,2) gets -1.0, (2,1) gets 0.5, and (2,2) gets 3.0. All other entries are zero in this non-overlapping, unique-winner example. Max pooling sends each incoming gradient to its selected winner, preserving the negative sign at (1,2).
```

Now reduce the stride to one on a `3 x 3` map whose center is the largest value so the center wins all four overlapping windows. Inspecting PyTorch's forward indices and backward result shows whether overlapping routes take only the maximum incoming gradient or accumulate their sum:

<!-- leetllm: test, deps=torch, output=show -->
```python title="overlapping-pooling-gradients.py"
import torch

values = torch.tensor([[1., 2., 3.], [4., 9., 5.], [6., 7., 8.]],
                      dtype=torch.float64, requires_grad=True)
pool = torch.nn.MaxPool2d(kernel_size=2, stride=1, return_indices=True)
pooled, indices = pool(values[None, None])
incoming = torch.tensor([[[[2., -1.], [0.5, 3.]]]], dtype=torch.float64)
pooled.backward(incoming)

print("pooled:", pooled.detach()[0, 0].tolist())
print("flat winner indices:", indices[0, 0].tolist())
print("input gradients:", values.grad.tolist())
assert values.grad[1, 1].item() == 4.5
assert torch.count_nonzero(values.grad).item() == 1
```

<!-- leetllm: output:start -->
```text title="Output" output compact
pooled: [[9.0, 9.0], [9.0, 9.0]]
flat winner indices: [[4, 4], [4, 4]]
input gradients: [[0.0, 0.0, 0.0], [0.0, 4.5, 0.0], [0.0, 0.0, 0.0]]
```
<!-- leetllm: output:end -->

The center's flattened index is `4` in the `3 x 3` input plane. All four outputs return that index, and backward adds their signed contributions: $2-1+0.5+3=4.5$.[^pytorchMaxPool2d2026] A manual implementation must accumulate with `+=`; assigning with `=` would overwrite earlier contributions. Pooling selects the winner from forward activations, then routes the signed incoming gradient to that location.

<figure>
  <img src="illustrations/_generated/pooling_gradient_route_dark.png" alt="A 4 by 4 feature map is split into four non-overlapping 2 by 2 windows. The maxima 0.91, 0.44, 0.21, and 0.77 form the pooled map. Incoming gradients 2.0, minus 1.0, 0.5, and 3.0 return only to the four winning cells, producing a sparse 4 by 4 input-gradient map." />
  <figcaption>Each colored 2 × 2 window contributes its maximum to the pooled map. In the backward example, each incoming gradient returns to that winner; every other cell receives zero.</figcaption>
</figure>

## Failure modes: border evidence and padding artifacts

Our worked windows so far fit neatly inside the crop, whereas at an image edge padding supplies synthetic boundary values that enter the filter's weighted sum. For a stride-one valid `3 x 3` operation on an image of size at least `5 x 5`, a corner pixel participates in only one sliding window while an interior pixel participates in nine. Even on our smaller `4 x 4` crop, the most central pixels contribute to four windows while corners appear in just one, which can leave border evidence underrepresented depending on learned filter weights and the classifier head:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="padding-border-evidence.py"
import numpy as np

def total_window_response(image: np.ndarray, padding: int) -> float:
    padded = np.pad(image, padding)
    kernel = np.ones((3, 3))
    total = 0.0
    for row in range(padded.shape[0] - 2):
        for col in range(padded.shape[1] - 2):
            total += np.sum(padded[row:row + 3, col:col + 3] * kernel)
    return total

edge_signal = np.zeros((5, 5))
edge_signal[0, 0] = 1.0
center_signal = np.zeros((5, 5))
center_signal[2, 2] = 1.0

print(f"valid edge total: {total_window_response(edge_signal, padding=0):.0f}")
print(f"valid center total: {total_window_response(center_signal, padding=0):.0f}")
print(f"padded edge total: {total_window_response(edge_signal, padding=1):.0f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
valid edge total: 1
valid center total: 9
padded edge total: 4
```
<!-- leetllm: output:end -->

Adding one pixel of padding creates extra valid window placements near the edges, raising corner participation from 1 window to 4. However, constant zero padding fills that added border with zeros, creating an abrupt intensity cliff next to bright interior pixels; on a uniform gray surface of intensity `0.6`, an edge kernel can fire strongly along the frame itself. Reflection padding (`mode='reflect'`) mirrors interior pixels across the border so a uniform patch stays uniform across the boundary, though on textured images mirrored borders still synthesize artificial symmetry that can affect edge gradients:[^numpyPad2026]

<!-- leetllm: test, deps=numpy, output=show -->
```python title="zero-padding-artifact.py"
import numpy as np

card = np.full((5, 5), 0.6)
horizontal_edge = np.array([
    [1.0, 1.0, 1.0],
    [0.0, 0.0, 0.0],
    [-1.0, -1.0, -1.0],
])

def response_map(padded: np.ndarray, kernel: np.ndarray) -> np.ndarray:
    output = np.empty((padded.shape[0] - 2, padded.shape[1] - 2))
    for row in range(output.shape[0]):
        for col in range(output.shape[1]):
            output[row, col] = np.sum(padded[row:row + 3, col:col + 3] * kernel)
    return output

for mode in ("constant", "reflect"):
    padded = np.pad(card, 1, mode=mode)
    responses = response_map(padded, horizontal_edge)
    print(f"{mode} max absolute response: {np.abs(responses).max():.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
constant max absolute response: 1.8
reflect max absolute response: 0.0
```
<!-- leetllm: output:end -->

Constant zero padding triggers an artificial edge response of `1.8` on a completely uniform surface, while reflection padding stays at `0.0`.

> **Common mistake:** Ignoring border padding when small defects can appear near the frame edge. Valid padding starves corner pixels of window visits (1 vs. 9 for a $3\times 3$ kernel), while zero padding injects an artificial brightness cliff around every image border.

## Build it: an inspectable forward pass

Put the pieces together on our unpadded `4 x 4` crop: convolution, ReLU, $2 \times 2$ max pooling, and a two-class linear head. Without ReLU between layers, stacked linear convolutions collapse into a single affine map; ReLU lets deeper layers compose nonlinear features.

```mermaid
flowchart TB
  Crop["Input: 4x4 crop"]:::muted --> Conv["Conv2d: 3x3 kernel -> 2x2 map"]:::primary
  Conv --> Relu["ReLU: max(0, x) -> 2x2 map"]:::secondary
  Relu --> Pool["MaxPool2d: 2x2 -> 1 value (0.874)"]:::accent
  Pool --> Head["Linear: 1 in -> 2 logits"]:::success
```

<!-- leetllm: test, deps=numpy, output=show, id=cnn-forward -->
```python title="cnn-forward-numpy.py"
import numpy as np

image = np.array([
    [0.05, 0.08, 0.06, 0.07],
    [0.12, 0.92, 0.88, 0.09],
    [0.08, 0.90, 0.93, 0.11],
    [0.06, 0.07, 0.09, 0.05],
])
kernel = np.array([
    [-0.6, -0.6, -0.6],
    [1.1, 1.1, 1.1],
    [-0.6, -0.6, -0.6],
])

def conv_valid(image: np.ndarray, kernel: np.ndarray) -> np.ndarray:
    output = np.empty((2, 2))
    for row in range(2):
        for col in range(2):
            output[row, col] = np.sum(image[row:row + 3, col:col + 3] * kernel)
    return output

feature_map = conv_valid(image, kernel)
activated = np.maximum(feature_map, 0.0)
pooled = np.array([activated.max()])
classifier_weights = np.array([[1.4], [-0.9]])
classifier_bias = np.array([-0.2, 0.1])
numpy_logits = classifier_weights @ pooled + classifier_bias

assert feature_map.shape == (2, 2)
assert pooled.shape == (1,)
print("feature map:")
print(np.round(feature_map, 3))
print("pooled activation:", np.round(pooled, 3))
print("logits:", np.round(numpy_logits, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
feature map:
[[0.852 0.789]
 [0.817 0.874]]
pooled activation: [0.874]
logits: [ 1.024 -0.687]
```
<!-- leetllm: output:end -->

The NumPy pipeline produces logits `[1.024, -0.687]`. To verify the exact equivalent in PyTorch, remember that `nn.Conv2d` expects either a batched 4D tensor ordered `(N, C, H, W)` or an unbatched `(C, H, W)` tensor. Calling `.unsqueeze(0).unsqueeze(0)` turns the `(4, 4)` image array into `(1, 1, 4, 4)` so we can load our exact NumPy weights and test numerical agreement:

<!-- leetllm: test, deps=pytorch,numpy, output=show, continue=cnn-forward -->
```python title="same-forward-pass-pytorch.py"
import torch
from torch import nn

image_bchw = torch.tensor(image, dtype=torch.float32).unsqueeze(0).unsqueeze(0)

model = nn.Sequential(
    nn.Conv2d(1, 1, kernel_size=3, bias=False),
    nn.ReLU(),
    nn.MaxPool2d(kernel_size=2),
    nn.Flatten(),
    nn.Linear(1, 2),
)

with torch.no_grad():
    model[0].weight.copy_(torch.tensor(kernel, dtype=torch.float32).view(1, 1, 3, 3))
    model[4].weight.copy_(torch.tensor(classifier_weights, dtype=torch.float32))
    model[4].bias.copy_(torch.tensor(classifier_bias, dtype=torch.float32))

pytorch_logits = model(image_bchw).detach().numpy()[0]
assert np.allclose(pytorch_logits, numpy_logits, rtol=0.0, atol=1e-6)
print("pytorch logits:", np.round(pytorch_logits, 3))
print("matches NumPy:", True)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
pytorch logits: [ 1.024 -0.687]
matches NumPy: True
```
<!-- leetllm: output:end -->

The float32 PyTorch result matches our hand-written NumPy pass to `1e-6`. Once LeNet-5 and AlexNet proved convolutional stacks could scale to millions of images,[^lecun1998][^krizhevsky2012] researchers tried stacking dozens of plain layers and hit a surprise: deeper plain networks had *higher training error* than shallower ones. This **degradation problem** persisted even with batch normalization and healthy gradient norms, pointing to an optimization barrier rather than overfitting.[^he2015]

He et al.'s **ResNet** broke through that barrier by letting each block learn a residual correction $\mathcal{F}(\mathbf{x})$ added directly to its input:[^he2015]

$$
\mathbf{y} = \mathcal{F}(\mathbf{x}) + \mathbf{x}
$$

Inside each residual branch, `BatchNorm2d` normalizes every channel using batch and spatial statistics while tracking running averages for inference, and a final ReLU activates the sum (changing spatial size or channel width requires a projection shortcut).[^pytorchBatchNorm2d2026] Build a standard residual block in PyTorch and verify that the shortcut preserves tensor geometry:

<!-- leetllm: test, deps=pytorch, output=show -->
```python title="residual-block-pytorch.py"
import torch
from torch import nn

class ResidualBlock(nn.Module):
    def __init__(self, channels: int):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(channels)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        identity = x
        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += identity
        return self.relu(out)

block = ResidualBlock(channels=16)
dummy_input = torch.randn(1, 16, 28, 28)
output = block(dummy_input)
print("input shape:", list(dummy_input.shape))
print("output shape:", list(output.shape))
print("shape preserved:", dummy_input.shape == output.shape)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
input shape: [1, 16, 28, 28]
output shape: [1, 16, 28, 28]
shape preserved: True
```
<!-- leetllm: output:end -->

The derivative of the residual connection during backpropagation reveals why this works:

$$
\frac{\partial \mathcal{L}}{\partial \mathbf{x}} = \frac{\partial \mathcal{L}}{\partial \mathbf{y}} \left( \frac{\partial \mathcal{F}}{\partial \mathbf{x}} + \mathbf{I} \right)
$$

> **Key insight:** The identity term $\mathbf{I}$ in $\frac{\partial \mathcal{L}}{\partial \mathbf{x}} = \frac{\partial \mathcal{L}}{\partial \mathbf{y}} \left(\frac{\partial \mathcal{F}}{\partial \mathbf{x}} + \mathbf{I}\right)$ creates a direct additive gradient highway across dozens or hundreds of layers. Even when $\frac{\partial \mathcal{F}}{\partial \mathbf{x}}$ shrinks, gradients still flow straight back through $\mathbf{I}$ (unless $\frac{\partial \mathcal{F}}{\partial \mathbf{x}} = -\mathbf{I}$ or a post-addition ReLU zeroes out a negative sum).[^he2015]

```checkpoint
If an identity shortcut exists, can the total input gradient still be zero?
---
Yes. For the residual sum, a branch derivative of -I makes I + (-I) = 0. A zero incoming gradient or an inactive ReLU after the sum can also give zero. The shortcut adds a gradient path, while the full gradient still depends on path interactions and activation state.
```

**Vision Transformers (ViT)** take a contrasting approach.[^dosovitskiy2020] ViT splits an image into non-overlapping patches (commonly $16 \times 16$ pixels) and projects each flattened patch into a $D$-dimensional embedding, an operation mathematically identical to a single `Conv2d(kernel_size=16, stride=16, out_channels=D)`. After that patch stem, the two families diverge:

- **CNNs** enforce local neighborhoods and shared spatial filters throughout the stack, a strong **inductive bias** that learns well from modest datasets.
- **Vision Transformers** rely on positional embeddings and global self-attention so any two patches can interact in layer one, trading built-in locality for global flexibility that shines with large-scale pretraining or strong distillation recipes like DeiT.[^dosovitskiy2020][^touvron2021DeiT]

Modernized convolutional architectures such as ConvNeXt close much of the gap with Vision Transformers,[^liu2022convnext] so both families remain competitive backbones. Every CNN prediction still comes down to the same chain you just traced: a shared local kernel, a saved pooling winner, and the padding choices at the border.

<!-- leetllm: mastery:start -->
## Change the crop, compute the response

Verify your grasp of spatial output shapes, kernel weight arithmetic, and receptive fields across the checkpoints below.

```checkpoint
Using the kernel in this lesson, calculate the first response when its upper-left weight is changed from -0.6 to 0.0. Which input pixel causes the difference?
---
Only the upper-left aligned input value, 0.05, changes its contribution. Removing its -0.6 weight increases the response by 0.03, from 0.852 to 0.882, because 0.05 times -0.6 had contributed -0.03.
```

```checkpoint
An RGB image of shape 64 by 64 enters eight 5 by 5 filters with stride 2 and padding 2. What is the output spatial shape, and how many parameters, including one bias per filter, does the layer have?
---
Each output dimension is floor((64 + 2 times 2 - 5) / 2) + 1 = 32, so output shape is 8 by 32 by 32. Parameters are 8 filters times (3 channels times 5 times 5 weights) plus 8 biases = 600 + 8 = 608 total.
```

```checkpoint
Trace receptive field and jump for two 3 by 3 stride-one convolutions followed by one 3 by 3 stride-two convolution.
---
Start with field 1 and jump 1. First convolution gives field 1 + 2*1 = 3, jump 1. Second gives field 3 + 2*1 = 5, jump 1. The stride-two convolution gives field 5 + (3 - 1)*1 = 7, jump 1 * 2 = 2. One final activation covers a 7 by 7 input footprint, and adjacent final activations move two input pixels apart.
```

```checkpoint
How can zero padding produce a nonzero edge response on a uniform gray panel?
---
With zero bias, a zero-sum edge kernel gives zero response when its whole window sees the same value. A window crossing the zero-padded border mixes gray and black values and can give a nonzero response. The example's maximum absolute response is 1.8. A false-defect prediction also depends on the learned features and decision boundary.
```

<!-- leetllm: mastery:end -->

```mastery-quiz
[
  {
    "question": "A fixed cross-correlation window currently sums to 1.2. Its aligned pixel is 0.4 and its weight changes from −0.5 to 0.25. All other pixels, weights and bias stay fixed. What new response follows?",
    "options": [
      "0.9",
      "1.1",
      "1.5",
      "1.7"
    ],
    "answer": "1.5",
    "explanation": "The weight change is 0.75, so this updated weight adds 0.4×0.75=0.3 to the old response: 1.2+0.3=1.5. This adjusts one term, rather than replacing the whole sum."
  },
  {
    "question": "An NCHW input has shape (2,6,17,17). Conv2d has 8 output channels, a 3×3 kernel, stride 2, padding 1, dilation 2, groups 2 and one bias per output. Which output shape and stored parameter count follow?",
    "options": [
      "(2,8,8,8); 224 parameters.",
      "(2,8,9,9); 224 parameters.",
      "(2,8,8,8); 440 parameters.",
      "(2,6,8,8); 224 parameters."
    ],
    "answer": "(2,8,8,8); 224 parameters.",
    "explanation": "The effective span is 2×(3−1)+1=5, giving floor((17+2−5)/2)+1=8. Each output sees 6/2=3 channels, so 8×3×3×3+8=224 parameters. Batch and output-channel axes remain 2 and 8."
  },
  {
    "question": "Start with receptive field 1 and jump 1. Apply a kernel-3 stride-2 dilation-1 convolution, then a kernel-3 stride-1 dilation-2 convolution. What final field and jump follow?",
    "options": [
      "Field 7; jump 2.",
      "Field 9; jump 1.",
      "Field 11; jump 4.",
      "Field 11; jump 2."
    ],
    "answer": "Field 11; jump 2.",
    "explanation": "The first layer gives field 1+1×2×1=3 and jump 2. The second adds 2×2×2=8, giving field 11; stride 1 leaves jump 2. Dilation changes the footprint without multiplying the jump."
  },
  {
    "question": "A one-dimensional cross-correlation uses kernel [−1,1], stride 2 and valid start indices 0,2,4 on six values. Compare x=[0,0,1,1,1,1] with a one-position-right shifted boundary x′=[0,0,0,1,1,1]. Which response maps and global maxima result?",
    "options": [
      "Maps [0,1,0] and [0,0,0]; maxima 1 and 0.",
      "Maps [0,0,0] and [0,1,0]; maxima 0 and 1.",
      "Maps [0,0,0] and [0,0,0]; maxima 0 and 0.",
      "Maps [0,1,1] and [0,0,1]; maxima 1 and 1."
    ],
    "answer": "Maps [0,0,0] and [0,1,0]; maxima 0 and 1.",
    "explanation": "The three pairs in x are (0,0),(1,1),(1,1), all giving 0. In x′ the middle pair is (0,1), giving 1. A one-pixel shift changes alignment with stride 2, so even the subsequent global maximum changes."
  },
  {
    "question": "Four unpadded 2×2 stride-1 pooling windows overlap at one center cell. That cell is the unique maximum in every window. The four output gradients are [[-2,1],[4,0.5]]. What total center gradient follows for max pooling, and for average pooling over the same four windows?",
    "options": [
      "Max 3.5; average 3.5.",
      "Max 0.5; average 0.125.",
      "Max 3.5; average 0.875.",
      "Max 7.5; average 1.875."
    ],
    "answer": "Max 3.5; average 0.875.",
    "explanation": "Max pooling adds every signed route: −2+1+4+0.5=3.5. The center belongs to all four average windows, each sending one quarter of its gradient, so 3.5/4=0.875. Overwrite, sign loss and missing divisors produce different results."
  },
  {
    "question": "A uniform 5×5 image has brightness 0.4. Use the zero-bias kernel [[1,1,1],[0,0,0],[−1,−1,−1]], stride 1 and a one-cell border. What maximum absolute responses follow under constant-zero padding and reflection padding?",
    "options": [
      "Zero 1.2; reflect 0.0.",
      "Zero 0.4; reflect 0.0.",
      "Zero 0.0; reflect 1.2.",
      "Zero 1.2; reflect 1.2."
    ],
    "answer": "Zero 1.2; reflect 0.0.",
    "explanation": "At a top-border window, three synthetic zeros face three 0.4 values, giving −1.2. Reflection continues the uniform 0.4 values and the zero-sum kernel cancels. Other images can still produce reflection artifacts; this outcome holds for a uniform patch."
  },
  {
    "question": "A batch of 3 has 12 feature channels on a 5×7 spatial grid. A 4-class linear head includes one bias per class. Compare flattening all spatial values with global average pooling before the head. Which pooled shape and parameter counts follow?",
    "options": [
      "Pooled (3,35); flatten 1684; pooled 144.",
      "Pooled (3,12); flatten 1684; pooled 52.",
      "Pooled (3,12); flatten 1680; pooled 48.",
      "Pooled (3,4); flatten 1684; pooled 52."
    ],
    "answer": "Pooled (3,12); flatten 1684; pooled 52.",
    "explanation": "GAP averages spatial positions separately per channel, giving (3,12). Flattened input width is 12×5×7=420, so 420×4+4=1684 parameters. The pooled head has 12×4+4=52. These heads make different use of position."
  },
  {
    "question": "A convolution feature map is [[-0.2,0.3],[0.9,0.4]]. Apply ReLU, then one 2×2 max pool. A two-logit head has weights [2,−1] and biases [−0.1,0.2]. Which logits and zero-based saved pooling winner result?",
    "options": [
      "Logits [1.1,−0.4]; winner (1,0).",
      "Logits [1.7,−0.7]; winner (0,1).",
      "Logits [0.6,−1.3]; winner (1,0).",
      "Logits [1.7,−0.7]; winner (1,0)."
    ],
    "answer": "Logits [1.7,−0.7]; winner (1,0).",
    "explanation": "ReLU removes −0.2, and max pooling keeps 0.9 at (1,0). The logits are 2×0.9−0.1=1.7 and −0.9+0.2=−0.7. The saved location comes from forward activations, not from head weights."
  },
  {
    "question": "A scalar residual block computes ReLU(F(x)+x) at x=2. Its incoming output gradient is 3. Case A has F(x)=−1 and F′(x)=−0.5; case B has F(x)=−3 with the same derivative. What input gradients follow?",
    "options": [
      "A 1.5; B 0.0.",
      "A −1.5; B −1.5.",
      "A 3.0; B 0.0.",
      "A 1.5; B 1.5."
    ],
    "answer": "A 1.5; B 0.0.",
    "explanation": "In A, the sum is 2 − 1 = 1, so ReLU passes the incoming gradient to both paths. The shortcut contributes 3 and the branch contributes 3 × (−0.5) = −1.5, giving 1.5 in total. An answer of 3.0 in A drops the branch contribution. In B, the sum is 2 − 3 = −1, so ReLU blocks both paths and the input gradient is zero. Getting 1.5 in both cases treats B’s gate as open. Getting −1.5 in both cases also drops the shortcut in each case."
  },
  {
    "question": "An 8×8 RGB image is split into nonoverlapping 2×2 patches. The same linear projection maps every flattened patch to 5 features and includes 5 biases. Which patch-token shape and shared parameter count match an equivalent Conv2d(kernel_size=2,stride=2,out_channels=5)?",
    "options": [
      "Tokens (64,5); 65 parameters.",
      "Tokens (16,12); 60 parameters.",
      "Tokens (16,5); 65 parameters.",
      "Tokens (16,5); 1040 parameters."
    ],
    "answer": "Tokens (16,5); 65 parameters.",
    "explanation": "There are 4×4=16 patches, each with 2×2×3=12 entries. Shared projection weights have 5×12=60 entries plus 5 biases, totaling 65. The equivalent convolution returns 5 channels on a 4×4 grid before rearrangement into 16 tokens."
  }
]
```

> **Next:** Continue to [Training & Backpropagation](/learn/training-backpropagation-gradient-descent). A CNN score in this lesson comes from fixed kernel weights, including which pooling cell would receive an error signal. The next lesson calculates how prediction error changes those weights so useful detectors are learned from data.
