---
query: "We are creating a research-backed page for the following: \"CNNs from Scratch\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: preparation\nCurrent page scope: Trace a CNN over a cracked equipment-panel photo patch: shared kernels, feature-map shapes, pooling, padding failures, and a NumPy-to-PyTorch forward pass.\nResearch refresh ID: 2026-08-13\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Prefer plain Markdown links like `[label](https://...)`. Avoid `(Source: Vendor)` wrappers, even when a link is present, and never use footnote-style or opaque citations without the URL.\n- Link directly to the source page. Never use search-result or search-redirect URLs.\n- Do not embed external images, image-search thumbnails, data URLs, or inline SVG. Describe useful visual ideas in text instead.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL.\n\nQuality correction attempt 2: previous response failed validation:\n- research body has 2 opaque source annotation(s) without direct URLs\n\nReplace it with a complete research packet. Keep useful Markdown structure, include at least 3 direct primary-source URLs, and avoid opaque source labels without links."
model: "Pro"
task_id: "c7c67e192bf3cafbc581dea10d4dd473"
status: "completed"
---

Here is a structured curriculum outline and research packet for teaching a from-scratch CNN forward pass, designed to map mathematical theory to a concrete, real-world scenario.

## Module: CNNs from Scratch (Forward Pass)

**Target Audience:** Machine learning students transitioning from ML theory to custom architecture implementation.
**Prerequisites:** Python, basic linear algebra (dot products), and proficiency with NumPy array slicing.

### Learning Outcomes

By the end of this module, learners will be able to:

- Hand-calculate feature map dimensions using stride, padding, and kernel size formulas.
- Trace the exact matrix operations of a convolution and pooling layer.
- Identify how naive zero-padding can introduce false-positive artifacts in edge detection tasks.
- Translate a raw Python/NumPy `for`-loop convolution directly into PyTorch's `torch.nn.Conv2d` API.

### 1. The Motivating Scenario: Equipment Panel Inspection

Instead of standard MNIST digits, this module grounds the math in an industrial use case: **detecting hairline cracks on metal equipment panels**.

- **The Input:** A zoomed-in 7×7 pixel patch of a grayscale photo. Cracks appear as dark, jagged diagonal lines against a lighter gray metallic background.
- **The Kernel:** A 3×3 shared weight matrix specifically initialized to detect diagonal edges.
- **The Goal:** Pass the 7×7 image patch through one convolutional layer and one pooling layer to output a feature map highlighting the crack.

### 2. Core Mechanisms and Mathematics

Explain the theoretical components before coding them.

- **Shared Kernels:** Unlike dense linear layers where every input pixel gets a unique weight, a CNN slides the same 3×3 kernel across the entire image. This provides **translation invariance**: a crack in the top left is detected by the same math as a crack in the bottom right.
- **The Shape Equation:** To predict the spatial dimensions of the output feature map, use the standard spatial dimension formula:

O=⌊SW−K+2P​⌋+1

*(Where O = output size, W = input size, K = kernel size, P = padding, and S = stride).*
- **Padding Failures (The "Artificial Edge" Problem):** A critical failure mode in defect detection. If a 7×7 image is zero-padded (P=1) to 9×9, the sudden transition from gray panel pixels (e.g., pixel value `180`) to black padding pixels (value `0`) creates a stark artificial edge. An edge-detecting kernel might flag the border of the image as a "crack."

- *Solution to teach:* `reflection` or `replicate` padding instead of `zeros`.

### 3. Step-by-Step Implementation

Use this sequence to walk students through the NumPy forward pass.

### 1. Initialize the Tensors: Define the image patch and the kernel

Define the 7×7 NumPy array representing the panel. Define a 3×3 kernel designed for edge detection (e.g., a Sobel-like filter with diagonal positive/negative values).

### 2. Apply Padding: Handle borders carefully to avoid artifacts

Pad the input array. Demonstrate the padding artifact by showing how `numpy.pad(image, pad_width=1, mode='constant', constant_values=0)` creates a false black border.

### 3. Execute the Sliding Window: The nested for-loops

Write the standard 4-deep nested loop (Batch, Channels, Height, Width) to slide the kernel over the padded image. At each stop, calculate the dot product between the kernel and the current 3×3 slice of the image, then sum the results.

### 4. Apply Non-linearity (ReLU): Zero out negative values

Pass the resulting feature map through `numpy.maximum(0, feature_map)`. Explain that this eliminates "negative" edge matches, keeping only the positively identified crack features.

### 5. Max Pooling: Spatial downsampling

Define a 2×2 window with a stride of 2. Slide this window over the ReLU output, taking the `numpy.max()` of each sector to compress the feature map, making the crack detection more robust to slight positional shifts.

### 4. Transitioning to PyTorch

Once students build the nested loops in NumPy and verify the output shape, map the operation directly to PyTorch. This proves that deep learning frameworks are just highly optimized versions of their manual code.

- **Data Formatting:** Remind students that PyTorch expects tensors in `(Batch, Channels, Height, Width)` format, often abbreviated as NCHW. A single grayscale image patch must be reshaped from `(7, 7)` to `(1, 1, 7, 7)`.
- **The PyTorch Equivalent:**

```python
import torch
import torch.nn as nn

# Define the exact same operation mathematically
conv_layer = nn.Conv2d(in_channels=1, out_channels=1, kernel_size=3, stride=1, padding=1, padding_mode='reflect')

# Force PyTorch to use our manual kernel weights to prove the math matches
with torch.no_grad():
    conv_layer.weight = nn.Parameter(torch.tensor(manual_kernel_numpy).float().unsqueeze(0).unsqueeze(0))

output = conv_layer(input_tensor)
```

### 5. Verified Primary Sources & Documentation

Do not rely on third-party tutorials for API behavior. Link students directly to the canonical documentation and original course materials:

- **Spatial Dimension Math & CNN Theory:** [Stanford CS231n: Convolutional Neural Networks for Visual Recognition](https://cs231n.github.io/convolutional-networks/)
- **PyTorch Convolution API & Padding Modes:** [PyTorch `torch.nn.Conv2d` Documentation](https://pytorch.org/docs/stable/generated/torch.nn.Conv2d.html)
- **NumPy Padding Operations:** [NumPy `numpy.pad` Documentation](https://numpy.org/doc/stable/reference/generated/numpy.pad.html)
- **PyTorch Max Pooling API:** [PyTorch `torch.nn.MaxPool2d` Documentation](https://pytorch.org/docs/stable/generated/torch.nn.MaxPool2d.html)
