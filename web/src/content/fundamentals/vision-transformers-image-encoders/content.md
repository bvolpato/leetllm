---
{
  "id": "vision-transformers-image-encoders",
  "title": "Vision Transformers and Image Encoders",
  "slug": "vision-transformers-image-encoders",
  "section": "Transformer Deep Dives",
  "category": "Multimodal Models",
  "difficulty": "Hard",
  "order": 4,
  "prerequisites": [
    "scaled-dot-product-attention"
  ],
  "companies": [
    "OpenAI",
    "Google",
    "Meta",
    "Anthropic",
    "Apple"
  ],
  "shortDescription": "A street camera image can hold both a broad intersection scene and a tiny speed-limit sign. Patch size and resolution decide which details a vision encoder preserves.",
  "keyConceptsTested": [
    "Patch embedding and class tokens",
    "Position embeddings and 2D-RoPE for image patches",
    "Bidirectional spatial attention in vision encoders",
    "CLIP and SigLIP image-text representation learning",
    "Visual token handoff into multimodal LLMs",
    "Shape tracking from pixels to visual tokens",
    "Token budget and resolution trade-offs in VLMs"
  ],
  "coverImage": "social_banner.png"
}
---

Consider a street camera frame showing an urban intersection beside a sunlit tree, painted crosswalk stripes, and a small red speed-limit sign reading `35` mounted on the far corner. A vision-language model inspecting that image must handle two distinct recognition regimes at once. First, it needs coarse semantic understanding to recognize the intersection, crosswalk, and traffic context across the entire frame. Second, it needs crisp spatial resolution to distinguish the small digits `35` from `38` or `85` when a connected language model answers questions about the posted limit.

You already saw how self-attention routes information across a sequence of tokens. A <span data-glossary="vision-transformer">Vision Transformer (ViT)</span> applies standard transformer encoder blocks directly to visual inputs by slicing an image into non-overlapping square patches that act like text <span data-glossary="token">tokens</span>.[^dosovitskiy2020] Working with a `224 x 224` RGB crop of our intersection frame clarifies why that tiling step is necessary: feeding every pixel individually produces `224 x 224 = 50,176` tokens, forcing full self-attention to score more than 2.5 billion query-key pairs per head in every layer. Even fused attention kernels that avoid materializing the full score matrix must still evaluate all dense pairs, so grouping pixels into patches keeps compute tractable while three quantities govern the tokenization step: grid patch count, flattened RGB dimensionality, and hidden model width. Every shape transition from raw pixels to embedded patches is explicit in the figure below.

<figure>
  <img src="illustrations/_generated/vit_patch_encoder_dark.png" alt="A 4 by 4 street scene pixel grid splits into four 2 by 2 patches covering sky, crimson speed sign, foliage, and asphalt. Each patch flattens into a row vector, projects linearly into D-wide token embeddings with added position offsets, and pairs with a learnable class token." />
  <figcaption>A 4×4 street crop with patch size P=2 splits into four RGB patches of size 2×2×3, projects linearly into token matrix Z₀, and prepends a learnable [CLS] token with position offsets.</figcaption>
</figure>

## From pixels to patches

Start with a concrete spatial calculation for a standard encoder configuration. Slicing our `224 x 224` intersection crop into square `16 x 16` pixel windows produces fourteen tiles horizontally and fourteen vertically, giving 196 visual tokens per image. Each non-overlapping RGB patch contains $16 \times 16 \times 3 = 768$ raw channel intensities before any linear weights touch the signal:

$$
\begin{aligned}
\frac{224}{16} &= 14 \text{ patches per side}\\
14 \times 14 &= 196 \text{ image patches}
\end{aligned}
$$

ViT flattens each patch into a vector $\mathbf{x}_p \in \mathbb{R}^{P^2 C}$ and multiplies it by a shared linear projection matrix $\mathbf{E} \in \mathbb{R}^{(P^2 C) \times D}$ to produce <span data-glossary="vector">vectors</span> of hidden width $D$ (`d_model`). Standard ViT-Base uses $D = 768$, making the matching raw and hidden widths of 768 a numerical coincidence rather than an architectural constraint; ViT-Large maps the exact same 768 raw values up to $D = 1024$. In real checkpoints, image preprocessing first applies model-specific resizing, cropping, RGB conversion, and channel normalization before patch extraction runs.[^dosovitskiy2020] Notice how patch size $P$ locks in both sequence length and the projection's input dimensionality for any image height $H$, width $W$, and channel count $C$ divisible by $P$:

$$
\begin{aligned}
N_{\text{patch}} &= \frac{H}{P}\frac{W}{P}\\
D_{\text{raw}} &= P^2 C\\
\mathbf{Z}_{\text{patch}} &\in \mathbb{R}^{N_{\text{patch}} \times D}
\end{aligned}
$$

Changing $P$ alters both the token count $N_{\text{patch}}$ and the input column count of $\mathbf{E}$, whereas changing $D$ adjusts the transformer's internal latent dimension alone. Pretrained weights expect the exact $P^2 C$ raw patch dimension seen during optimization, so altering $P$ without reinitializing or interpolating the patch projection causes an immediate shape error. Converting those equations into code clarifies how array axis reordering turns a 2D pixel grid into a sequence matrix without changing a single pixel value.

Once projected, the <span data-glossary="transformer">transformer</span> receives an ordered sequence `[patch_1, patch_2, ..., patch_196]` rather than a 2D image array. This interface matches standard language encoders and lets self-attention exchange features across distant parts of the scene in a single layer. Because the linear projection $\mathbf{E}$ is shared across every spatial location, the top-left sky patch and the speed-limit sign patch pass through identical projection weights, much as a language model embeds every token position through one <span data-glossary="embedding">embedding</span> <span data-glossary="matrix">matrix</span>. In practice, frameworks implement this step as a single 2D convolution with kernel size $P$, <span data-glossary="stride">stride</span> $P$, zero padding, and $D$ output channels, which computes the exact same matrix product as manual flattening followed by a linear layer when weights and biases align.[^pytorchConv2d2026]

<!-- leetllm: test, output=show -->
```python title="from-pixels-to-patches.py"
import numpy as np

def extract_patches(image: np.ndarray, patch_size: int = 16) -> np.ndarray:
    """Split HxWxC image into (N_patches, patch_size*patch_size*C) flat patches."""
    h, w, c = image.shape
    if h % patch_size != 0 or w % patch_size != 0:
        raise ValueError("image dimensions must be divisible by patch_size")
    return (
        image.reshape(h // patch_size, patch_size, w // patch_size, patch_size, c)
        .swapaxes(1, 2)
        .reshape(-1, patch_size * patch_size * c)
    )

def patch_embed(patches: np.ndarray, proj_weight: np.ndarray) -> np.ndarray:
    """Project (N, patch_width) patches with shared (d_model, patch_width) weights."""
    return patches @ proj_weight.T

rng = np.random.default_rng(0)
numbered = np.arange(16).reshape(4, 4, 1)
print("Raster patch rows:", extract_patches(numbered, 2).tolist())
crop = rng.normal(size=(32, 32, 3)).astype(np.float32)
patches = extract_patches(crop, patch_size=8)
print("Patches shape:", patches.shape)

d_model = 256
proj = rng.normal(size=(d_model, 192)).astype(np.float32) * 0.02
embedded = patch_embed(patches, proj)
print("Embedded tokens shape:", embedded.shape)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Raster patch rows: [[0, 1, 4, 5], [2, 3, 6, 7], [8, 9, 12, 13], [10, 11, 14, 15]]
Patches shape: (16, 192)
Embedded tokens shape: (16, 256)
```
<!-- leetllm: output:end -->

Comparing manual patch flattening against PyTorch's `Conv2d` verifies this equivalence while highlighting a key layout difference: NumPy images typically use channels-last (`HWC`) order, whereas PyTorch expects channels-first (`BCHW`) tensors. Transposing the channel order before flattening preserves dimensions while scrambling pixel-to-weight alignment, so checking numerical equivalence across every output entry confirms the spatial layout matches.

<!-- leetllm: test, deps=torch, output=show -->
```python title="verify-convolutional-patch-embedding.py"
import torch

torch.manual_seed(3)
image = torch.arange(2 * 3 * 4 * 6, dtype=torch.float64).reshape(2, 3, 4, 6)
patch_size = 2
d_model = 5
conv = torch.nn.Conv2d(3, d_model, patch_size, stride=patch_size).double()

n, channels, height, width = image.shape
grid_h, grid_w = height // patch_size, width // patch_size
patches = (
    image.reshape(n, channels, grid_h, patch_size, grid_w, patch_size)
    .permute(0, 2, 4, 1, 3, 5)
    .reshape(n, grid_h * grid_w, channels * patch_size * patch_size)
)
tokens = patches @ conv.weight.reshape(d_model, -1).T + conv.bias
convolved = conv(image).flatten(2).transpose(1, 2)
torch.testing.assert_close(tokens, convolved)

wrong_order = patches.reshape(n, grid_h * grid_w, channels, 4).transpose(2, 3).reshape_as(patches)
wrong_tokens = wrong_order @ conv.weight.reshape(d_model, -1).T + conv.bias
print("Token shape:", tuple(tokens.shape))
print("All convolution tokens match:", torch.allclose(tokens, convolved))
print("Wrong channel order matches:", torch.allclose(wrong_tokens, convolved))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Token shape: (2, 6, 5)
All convolution tokens match: True
Wrong channel order matches: False
```
<!-- leetllm: output:end -->

Flattening complete patches is completely reversible: reshaping with the same dimension order recovers the original crop without loss. Information loss inside patch embedding arises only if the linear projection $\mathbf{E}$ lacks full input rank or compresses fine spatial variations into unused subspace directions, or when coarse patches lump tiny strokes together in one vector before later layers see them. Shrinking patch size gives attention finer spatial resolution for small targets like our distant speed-limit sign, while sharply raising token count and attention compute on a fixed `224 x 224` crop:

| Patch size | Tokens for 224 x 224 image | Raw RGB values per patch | Attention pairs per head |
|---|---:|---|---:|
| 32 x 32 | 49 | 3,072 | 2,401 |
| 16 x 16 | 196 | 768 | 38,416 |
| 14 x 14 | 256 | 588 | 65,536 |
| 8 x 8 | 784 | 192 | 614,656 |

<figure>
  <img src="illustrations/_generated/patch_size_cost_dark.png" alt="Patch grids and self-attention cost for a 224 by 224 street scene across patch sizes. Coarse 32 by 32 patches create 49 tokens and trap a 28-pixel speed sign inside a single patch. Fine 14 by 14 patches resolve the sign across 4 tiles with 256 tokens, raising pairwise attention evaluations from 2.4k to 65.5k." />
  <figcaption>On a 224×224 street crop, P=32 merges a small speed sign into a single coarse tile (49 tokens, 2.4k pairs), while P=14 splits the sign across four cells (256 tokens, 65.5k pairs).</figcaption>
</figure>

At fixed head count and model width, full self-attention scales quadratically with token length and inversely with the fourth power of patch width: $O(N^2) = O\left(\frac{H^2 W^2}{P^4}\right)$. Halving patch size from $P = 16$ to $P = 8$ quadruples the token count $N$ and increases pairwise query-key comparisons by $16\times$, which explains why vision encoders carefully balance fine detail preservation against sequence compute budgets. The short calculation below contrasts raw pixel attention with standard `16 x 16`, `14 x 14`, and `8 x 8` patch grids:

<!-- leetllm: test, output=show -->
```python title="patch-size-attention-cost.py"
def patch_tokens(image_size: int, patch_size: int) -> int:
    if image_size % patch_size != 0:
        raise ValueError("image_size must be divisible by patch_size")
    return (image_size // patch_size) ** 2

def attention_pairs(tokens: int) -> int:
    return tokens**2

pixel_tokens = 224 * 224
tokens_16 = patch_tokens(224, 16)
tokens_14 = patch_tokens(224, 14)
tokens_8 = patch_tokens(224, 8)

print(pixel_tokens, tokens_16, tokens_14, tokens_8)
print("pixel vs P=16 pair ratio:", attention_pairs(pixel_tokens) // attention_pairs(tokens_16))
print("P=8 vs P=16 pair ratio:", round(attention_pairs(tokens_8) / attention_pairs(tokens_16), 1))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
50176 196 256 784
pixel vs P=16 pair ratio: 65536
P=8 vs P=16 pair ratio: 16.0
```
<!-- leetllm: output:end -->

Pixel-level attention evaluates 65,536 times as many query-key pairs as `16 x 16` patching on a `224 x 224` crop, making coarse tiling indispensable for dense visual transformers. That quadratic gap stays true even under flash-style kernels because hardware still computes every pairwise score along the inner loop. Even after grouping pixels into patches, however, attention still treats those vectors as an unordered set until spatial positions are attached.

```checkpoint
Why does switching from 16×16 patches to 8×8 patches create 16× as many patch-to-patch attention pairs?
---
Halving patch width doubles patches along height and width, producing $(2 \times 2) = 4\times$ more tokens ($196 \to 784$). Dense self-attention calculates an all-pairs dot product matrix of size $N \times N$, so a $4\times$ increase in tokens causes a $4^2 = 16\times$ increase in attention comparisons ($196^2 \to 784^2$).
```

## Position information

Two distinct street scenes can share the exact same patch contents rearranged across the grid: sky at top versus road at top. Without position offsets or an order-dependent mask, deterministic <span data-glossary="self-attention">self-attention</span> is permutation-equivariant, so permuting the input patch vectors permutes their outputs identically while leaving mean pooling or any fixed-query readout unchanged. Keeping the learnable `[CLS]` token pinned at index 0 while shuffling the patches behind it produces the exact same `[CLS]` representation whenever spatial coordinates are absent.

Original ViT breaks that symmetry by adding a learned **one-dimensional** position embedding table $\mathbf{E}_{\text{pos}} \in \mathbb{R}^{(N+1) \times D}$ directly to the projected tokens.[^dosovitskiy2020] Under zero-based patch indexing, row 0 column 1 is patch index 1, so with `[CLS]` occupying slot 0, that patch sits at slot 2 and receives $\mathbf{E}_{\text{pos}}[2]$. Prepending the learnable classification token $\mathbf{x}_{\text{class}} \in \mathbb{R}^D$ produces an input tensor $\mathbf{z}_0$ of length $N + 1$ and width $D$:

$$
\mathbf{z}_0 = [\mathbf{x}_{\text{class}}; \mathbf{x}_p^1\mathbf{E}; \mathbf{x}_p^2\mathbf{E}; \dots; \mathbf{x}_p^N\mathbf{E}] + \mathbf{E}_{\text{pos}}
$$

Adding distinct position vectors distinguishes swapped arrangements under a fixed query:

<!-- leetllm: test, output=show -->
```python title="position-makes-layout-visible.py"
import numpy as np

def attend(query: np.ndarray, tokens: np.ndarray) -> np.ndarray:
    scores = tokens @ query / np.sqrt(tokens.shape[1])
    scores = scores - scores.max()
    weights = np.exp(scores) / np.exp(scores).sum()
    return weights @ tokens

query = np.array([1.0, 0.0])
patches = np.array([[2.0, 0.1], [0.2, 1.5]])
swapped = patches[::-1]
positions = np.array([[0.0, 0.6], [0.5, 0.0]])

without_position = np.allclose(attend(query, patches), attend(query, swapped))
with_position = np.allclose(
    attend(query, patches + positions),
    attend(query, swapped + positions),
)
print("Same summary after swap without positions:", without_position)
print("Same summary after swap with positions:", with_position)
print("Original positioned summary:", np.round(attend(query, patches + positions), 3).tolist())
print("Swapped positioned summary:", np.round(attend(query, swapped + positions), 3).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Same summary after swap without positions: True
Same summary after swap with positions: False
Original positioned summary: [1.629, 0.928]
Swapped positioned summary: [2.122, 0.429]
```
<!-- leetllm: output:end -->

Tracking tensor shapes across an unbatched ViT-B/16 forward pass at `224 x 224` resolution keeps token counts and feature widths aligned at each step:

| Stage | Shape | Description |
|---|---|---|
| Input image $\mathbf{x}$ | `[3, 224, 224]` | Preprocessed RGB tensor |
| Flattened patches $\mathbf{x}_p$ | `[196, 768]` | 196 non-overlapping $16 \times 16$ patches |
| Projected tokens $\mathbf{x}_p \mathbf{E}$ | `[196, 768]` | Linear projection into model hidden dimension $D$ |
| Encoder input $\mathbf{z}_0$ | `[197, 768]` | Prepended `[CLS]` token plus learned position embeddings |
| Encoded tokens $\mathbf{z}_L$ | `[197, 768]` | Contextualized representation after $L$ transformer blocks |

<figure>
  <img src="illustrations/_generated/position_embeddings_dark.png" alt="Why vision transformers inject 2D coordinates and how 1D learned tables differ from 2D-RoPE. Shuffling sky, sign, tree, and road patches leaves the unordered bag identical unless position offsets tag each slot. When image width shifts from 3 columns to 4, 1D indices drift off rows whereas 2D-RoPE rotates separate x and y subspaces cleanly." />
  <figcaption>Without position tags, shuffled patches form the same unordered bag; reshaping a learned table in 2D preserves row alignment, while 2D-RoPE rotates separate y and x head subspaces directly.</figcaption>
</figure>

### Resolution scaling and 2D position embeddings

A fixed 1D learned table breaks when input dimensions change after pretraining. Moving from `224 x 224` to `256 x 256` at `16 x 16` patch size raises the patch count from 196 to 256, leaving the pretrained 197-slot table short on indices. Furthermore, simply slicing or repeating 1D indices shifts columns when row width changes.

Original ViT resolves this during higher-resolution fine-tuning via **2D grid interpolation**: it sets aside the `[CLS]` position vector, reshapes the 196 patch embeddings into a $14 \times 14$ 2D grid, interpolates that grid spatially to match the target patch grid, flattens back to sequence order, and reattaches `[CLS]`.[^dosovitskiy2020] Google's reference implementation performs linear grid zooming (`scipy.ndimage.zoom(..., order=1)`), whereas PyTorch ports commonly use bicubic interpolation with `align_corners=False`, so matching the checkpoint's coordinate convention matters.[^googleVitPositionResize2026][^pytorchInterpolate2026] Interpolating position slots restores shape compatibility, though fine-tuning or multi-resolution pretraining is still needed for the model to read finer features accurately.

<!-- leetllm: test, output=show -->
```python title="position-table-resolution-mismatch.py"
import numpy as np

def sequence_length(image_size: int, patch_size: int, cls_token: bool = True) -> int:
    if image_size % patch_size != 0:
        raise ValueError("image_size must be divisible by patch_size")
    patch_count = (image_size // patch_size) ** 2
    return patch_count + int(cls_token)

trained_positions = np.zeros((sequence_length(224, 16), 768))
higher_resolution_tokens = np.zeros((sequence_length(256, 16), 768))

print("trained slots:", trained_positions.shape[0])
print("new slots:", higher_resolution_tokens.shape[0])
print("needs resized position table:", trained_positions.shape != higher_resolution_tokens.shape)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
trained slots: 197
new slots: 257
needs resized position table: True
```
<!-- leetllm: output:end -->

Reshaping the 196 spatial entries into `[1, D, 14, 14]` lets PyTorch resize the grid cleanly to rectangular targets such as `16 x 20` while keeping the `[CLS]` vector untouched:

<!-- leetllm: test, deps=torch, output=show -->
```python title="resize-patch-position-grid.py"
import torch
import torch.nn.functional as F

def resize_patch_positions(positions: torch.Tensor, old_grid: tuple[int, int], new_grid: tuple[int, int]) -> torch.Tensor:
    """Resize [1, 1+H*W, D] positions while preserving the class slot."""
    old_h, old_w = old_grid
    cls = positions[:, :1]
    grid = positions[:, 1:].reshape(1, old_h, old_w, -1).permute(0, 3, 1, 2)
    resized = F.interpolate(grid, size=new_grid, mode="bicubic", align_corners=False)
    patches = resized.permute(0, 2, 3, 1).reshape(1, new_grid[0] * new_grid[1], -1)
    return torch.cat((cls, patches), dim=1)

positions = torch.arange(197 * 3, dtype=torch.float64).reshape(1, 197, 3)
resized = resize_patch_positions(positions, (14, 14), (16, 20))
print("Original / resized:", tuple(positions.shape), tuple(resized.shape))
print("Class position preserved:", torch.equal(positions[:, :1], resized[:, :1]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Original / resized: (1, 197, 3) (1, 321, 3)
Class position preserved: True
```
<!-- leetllm: output:end -->

Modern variable-resolution backbones such as Qwen2.5-VL avoid learned position tables entirely by using **2D Rotary Position Embeddings (2D-RoPE)**.[^bai2025qwen25vl][^su2021roformer] Instead of adding an absolute vector at layer 0, 2D-RoPE splits each attention head's channels ($d$ divisible by 4) into two orthogonal halves: complex rotation pairs in the first half rotate by row angle $y\theta_k$, and pairs in the second half rotate by column angle $x\theta_k$. Because rotary inner products satisfy $\langle R(y_q, x_q)\mathbf{q}, R(y_k, x_k)\mathbf{k}\rangle = \langle \mathbf{q}, R(y_k - y_q, x_k - x_q)\mathbf{k}\rangle$, attention scores depend purely on relative spatial offsets $(\Delta y, \Delta x)$ across arbitrary rectangular grids without interpolating a table.

<!-- leetllm: test, output=show -->
```python title="2d-rope-relative-offset.py"
import numpy as np

def apply_2d_rope(vec: np.ndarray, y: float, x: float, theta: float = 0.5) -> np.ndarray:
    """Rotate 4-dim head vector: first pair by row y, second pair by column x."""
    out = np.empty_like(vec)
    cy, sy = np.cos(y * theta), np.sin(y * theta)
    cx, sx = np.cos(x * theta), np.sin(x * theta)
    out[0] = vec[0] * cy - vec[1] * sy
    out[1] = vec[0] * sy + vec[1] * cy
    out[2] = vec[2] * cx - vec[3] * sx
    out[3] = vec[2] * sx + vec[3] * cx
    return out

q = np.array([1.2, -0.4, 0.7, 0.9])
k = np.array([0.5, 1.1, -0.3, 0.8])

score_top_left = apply_2d_rope(q, 1, 2) @ apply_2d_rope(k, 3, 5)
score_shifted = apply_2d_rope(q, 4, 6) @ apply_2d_rope(k, 6, 9)
print("Dot product at (1,2)->(3,5):", round(float(score_top_left), 6))
print("Dot product shifted by (+3,+4):", round(float(score_shifted), 6))
print("Relative (dy=2, dx=3) invariant:", np.isclose(score_top_left, score_shifted))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Dot product at (1,2)->(3,5): -1.984432
Dot product shifted by (+3,+4): -1.984432
Relative (dy=2, dx=3) invariant: True
```
<!-- leetllm: output:end -->

Qwen2.5-VL pairs 2D-RoPE with resizing images to height and width multiples of 28 so every image cleanly groups adjacent `2 x 2` patch neighborhoods (`14 x 2 = 28`) before handing tokens to the language model.[^bai2025qwen25vl]

```checkpoint
What breaks if a ViT receives patch embeddings without position information?
---
With no position information or order-dependent mask, deterministic self-attention is permutation-equivariant. Permuting patches permutes their outputs and leaves a permutation-invariant readout unchanged. The model can inspect patterns inside a patch, but token order alone carries no spatial grid coordinate.
```

## Encoder attention

A ViT stacks standard transformer encoder blocks made of multi-head self-attention and position-wise feed-forward networks, each wrapped with a residual skip connection and LayerNorm. Unlike an autoregressive language decoder that processes tokens left to right with a <span data-glossary="causal-mask">causal mask</span>, the original ViT applies full bidirectional self-attention across the entire sequence. Every patch can query every other patch immediately, so the patch carrying the red `"35"` speed-limit sign can exchange context with the surrounding sky, tree foliage, and asphalt patches in the very first layer. Other vision encoders choose local attention windows for efficiency: Qwen2.5-VL uses windowed self-attention in most layers and full-frame attention in only four of its 32 vision layers, showing that bidirectional visibility need not be globally dense in every block.[^bai2025qwen25vl]

<figure>
  <img src="illustrations/_generated/spatial_attention_map_dark.png" alt="Side-by-side comparison of bidirectional encoder attention across [CLS], Sky, Tree, Sign, and Road tokens where all 25 entries are open versus lower-triangular causal decoder attention where future columns above the diagonal are masked" />
  <figcaption><strong>Bidirectional Spatial Attention vs. Causal Decoder Masking:</strong> A ViT encoder allows every image patch to read earlier and later raster positions symmetrically in layer 1, whereas a causal language mask zeroes out upper-triangular entries.</figcaption>
</figure>

Comparing bidirectional visual attention against causal language masking in matrix form highlights why raster scan order imposes no directional restriction on images. Later raster patches sit below or to the right in two-dimensional space rather than in a causal future, so immediate symmetric visibility lets distant regions of an intersection photograph communicate without waiting for successive local steps:

<!-- leetllm: test, output=show -->
```python title="bidirectional-image-attention.py"
import numpy as np

def softmax(scores: np.ndarray) -> np.ndarray:
    scores = scores - scores.max(axis=-1, keepdims=True)
    probs = np.exp(scores)
    return probs / probs.sum(axis=-1, keepdims=True)

tokens = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
scores = tokens @ tokens.T / np.sqrt(tokens.shape[1])
full_weights = softmax(scores)
causal_scores = np.where(np.triu(np.ones_like(scores), k=1) == 1, -np.inf, scores)
causal_weights = softmax(causal_scores)

print("Vision patch 0 can read later patch 1:", full_weights[0, 1] > 0)
print("Causal token 0 can read later token 1:", causal_weights[0, 1] > 0)
print("Vision row sums to one:", np.isclose(full_weights[0].sum(), 1.0))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Vision patch 0 can read later patch 1: True
Causal token 0 can read later token 1: False
Vision row sums to one: True
```
<!-- leetllm: output:end -->

## The ViT architecture in full

ViT builds contextual visual representations by wrapping Pre-LN transformer blocks inside residual skip streams:[^dosovitskiy2020]

1. **Patch embedding:** linearly project flattened patches from $\mathbb{R}^{P^2 C}$ to hidden width $\mathbb{R}^D$.
2. **Prepend global readout slot:** insert a learnable `[CLS]` vector $\mathbf{x}_{\text{class}} \in \mathbb{R}^D$ at sequence index 0.
3. **Add sequence position embeddings:** sum learned position vectors $\mathbf{E}_{\text{pos}} \in \mathbb{R}^{(N+1) \times D}$ entrywise with the token embeddings.
4. **Apply $L$ encoder blocks:** pass the sequence through layers with identical topology and distinct weights, writing multi-head self-attention as MHA and LayerNorm as LN:

   $$
   \begin{aligned}
   \mathbf{z}'_\ell &= \operatorname{MHA}(\operatorname{LN}(\mathbf{z}_{\ell-1})) + \mathbf{z}_{\ell-1} \\
   \mathbf{z}_\ell &= \operatorname{MLP}(\operatorname{LN}(\mathbf{z}'_\ell)) + \mathbf{z}'_\ell
   \end{aligned}
   $$

5. **Apply final LayerNorm** across the output sequence before downstream heads read it.
6. **Readout:** take the final `[CLS]` state for whole-image classification or contrastive matching, or retain all $N$ patch states for dense prediction and vision-language models.

For ViT-B/16, the hidden width is $D = 768$ across $L = 12$ encoder layers with 12 heads, giving each head a subspace dimension of $d_k = 768 / 12 = 64$. Queries and keys therefore have shape `[B, 12, 197, 64]`, producing `[B, 12, 197, 197]` attention matrices in every layer. Inside each block, the position-wise MLP widens representations by $4\times$ to 3,072 hidden channels before projecting back to 768.

### Inductive biases and pretraining scale

Architectural priors shape what a backbone learns smoothly versus what it must discover from data, making the contrast between a ViT and a convolutional network such as ResNet instructive.[^he2015] An **inductive bias** is any structural assumption wired directly into the layer connectivity rather than learned from weights:

1. **Locality:** small convolution kernels bind adjacent pixels from layer 1 onward, expanding receptive fields gradually through depth, dilation, or pooling without requiring quadratic global pairwise scoring.
2. **Translation equivariance:** on an unbounded discrete grid, stride-1 convolution commutes with spatial shifts so $f(T(x)) = T(f(x))$. Finite borders, padding conventions, and strided downsampling weaken strict equivariance on cropped real photographs, yet shared local weights still reuse edge and texture detectors across the frame.

Original ViT discards convolutional weight sharing inside its transformer blocks, retaining spatial structure only through non-overlapping patch grouping and the 2D layout of its resized position grid. Because full attention lets distant patches interact immediately in layer 1, ViT can model global layout effortlessly once trained with sufficient signal, though weak spatial priors make small-data optimization harder. In Dosovitskiy et al.'s original experiments, ViTs trained from scratch on ImageNet-1K (roughly 1.3 million images) without strong regularization trailed matched ResNets, whereas pretraining at larger scale on ImageNet-21k or JFT unlocked strong downstream transfer.[^dosovitskiy2020]

Subsequent work closed much of that small-data gap while sharpening convolutional baselines from the other direction. DeiT achieved competitive ImageNet-1K accuracy without external data by adding heavy augmentation, regularization, and an optional distillation token, while ConvNeXt showed that modernizing convolutional block structure and training recipes restores competitiveness against ViTs.[^touvron2021DeiT][^liu2022convnext] In practice, for any domain-specific dataset such as dashcam traffic scenes, evaluating pretrained encoders alongside lighter baselines on held-out examples reveals the real accuracy-compute frontier far more reliably than guessing from architecture priors alone.

```checkpoint
In a ViT-B/16 classifier with a [CLS] token, why does the sequence length become 197 instead of 196?
---
A 224×224 image with 16×16 patches yields $(224/16)^2 = 196$ patch tokens. Prepending one learned [CLS] token at slot 0 to aggregate global image context brings the total sequence length to $196 + 1 = 197$ tokens.
```

## CLIP and image-text training

A trained ViT produces visual representations, and matching an intersection photograph against a natural-language query such as `"a street photo with a speed limit sign"` requires placing both modalities inside one shared geometric space. Rather than matching every pixel patch against every language token independently, dual encoders align their global image and text readouts via **contrastive learning**.[^radford2021]

Original CLIP (2021) pairs a vision encoder $f_I$ (either a modified ResNet or a ViT using its `[CLS]` readout) with a causal-masked text transformer $f_T$ (reading its end-of-text token) and trains on 400 million web image-text pairs.[^radford2021] Learned linear projections map both backbones into a common embedding dimension $D_{\text{shared}}$ regardless of internal hidden widths. Given a batch of $B$ paired images and captions, training normalizes each vector to unit L2 length ($\hat{u}_i = u_i / \|u_i\|_2$, $\hat{v}_j = v_j / \|v_j\|_2$) and computes a $B \times B$ cosine similarity matrix scaled by a learned inverse-temperature parameter $s = 1/\tau$:

$$
S_{ij} = s \, (\hat{u}_i^\top \hat{v}_j)
$$

Diagonal cells $S_{ii}$ mark matched `(image_i, caption_i)` pairs, while the $B^2 - B$ off-diagonal cells act as in-batch negatives. Because batch sampling assumes unpaired cross-entries are unrelated, duplicate or semantically overlapping descriptions in a batch create false negatives; batch deduplication and multi-positive losses mitigate this issue, whereas increasing batch size alone does not. CLIP optimizes the **symmetric InfoNCE loss** averaging row-wise (image-to-text) and column-wise (text-to-image) cross-entropies:[^oord2018][^radford2021]

$$
\mathcal{L}_{I \to T} = -\frac{1}{B} \sum_{i=1}^B \log \frac{\exp(S_{ii})}{\sum_{j=1}^B \exp(S_{ij})}, \qquad
\mathcal{L}_{T \to I} = -\frac{1}{B} \sum_{j=1}^B \log \frac{\exp(S_{jj})}{\sum_{i=1}^B \exp(S_{ij})}, \qquad
\mathcal{L}_{\text{CLIP}} = \frac{1}{2} \left(\mathcal{L}_{I \to T} + \mathcal{L}_{T \to I}\right)
$$

<figure>
  <img src="illustrations/_generated/clip_contrastive_dark.png" alt="A 3 by 3 CLIP similarity logit matrix pairs street sign, alpine trail, and coastal beam images with captions. Row softmax turns image 1 logits [3.50, 1.93, 1.47] into probabilities [0.75, 0.16, 0.10] with cross-entropy 0.292, while column softmax turns caption 1 logits [3.50, 1.90, 1.57] into [0.74, 0.15, 0.11] with cross-entropy 0.298 and symmetric InfoNCE mean 0.303." />
  <figcaption>Scaled cosine logits S place matched pairs along the diagonal. Row 1 softmax yields [0.75, 0.16, 0.10] (CE 0.292), column 1 yields [0.74, 0.15, 0.11] (CE 0.298), and batch symmetric InfoNCE loss averages to 0.303.</figcaption>
</figure>

Row softmax trains each image to rank its matching caption highest among all $B$ texts, while column softmax trains each caption to pull its matching image above all $B - 1$ distractors. Averaging both terms keeps similarity alignment symmetric regardless of batch ordering or modality direction. The snippet below computes that exact symmetric InfoNCE loss on normalized batch pairs:

<!-- leetllm: test, output=show -->
```python title="clip-symmetric-training-loss.py"
import numpy as np

images = np.eye(3)
texts = np.array([[1.0, 0.2, 0.0], [0.1, 1.0, 0.2], [0.0, 0.3, 1.0]])
texts /= np.linalg.norm(texts, axis=1, keepdims=True)
logits = 3.0 * images @ texts.T

def matching_loss(scores: np.ndarray) -> float:
    shifted = scores - scores.max(axis=1, keepdims=True)
    log_probs = shifted - np.log(np.exp(shifted).sum(axis=1, keepdims=True))
    return float(-np.diag(log_probs).mean())

row_loss = matching_loss(logits)
column_loss = matching_loss(logits.T)
print("Logits:", np.round(logits, 3).tolist())
print("Row / column loss:", round(row_loss, 3), round(column_loss, 3))
print("Symmetric loss:", round((row_loss + column_loss) / 2, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Logits: [[2.942, 0.293, 0.0], [0.588, 2.928, 0.862], [0.0, 0.586, 2.873]]
Row / column loss: 0.155 0.156
Symmetric loss: 0.155
```
<!-- leetllm: output:end -->

### Zero-shot open-vocabulary classification

Because CLIP maps images and phrases into a single unit hypersphere, it enables **zero-shot open-vocabulary classification** over arbitrary candidate prompts without retraining a fixed linear head. To classify our street camera frame, encode candidate descriptions such as `"a street scene with a red speed limit sign"` and `"an empty country highway"`, take cosine similarities $\hat{\mathbf{u}}^\top \hat{\mathbf{v}}_k$, and pick the top match. Averaging normalized embeddings across several domain-matched prompt templates (prompt ensembling) typically boosts accuracy over a single prompt.[^radford2021]

<!-- leetllm: test, output=show -->
```python title="clip-style-zero-shot-ranking.py"
import numpy as np

def normalize(rows: np.ndarray) -> np.ndarray:
    return rows / np.linalg.norm(rows, axis=-1, keepdims=True)

image = normalize(np.array([[0.95, 0.20, 0.05]]))
prompts = ["a street photo with a speed limit sign", "an open rural highway"]
text = normalize(np.array([[0.90, 0.25, 0.05], [0.05, 0.95, 0.10]]))
logit_scale = 5.0

logits = logit_scale * (image @ text.T)[0]
probabilities = np.exp(logits - logits.max())
probabilities = probabilities / probabilities.sum()

print("Ranked prompt:", prompts[int(np.argmax(probabilities))])
print("Candidate probabilities:", np.round(probabilities, 3).tolist())
duplicated = np.exp(np.array([logits[0], logits[0], logits[1]]) - logits.max())
duplicated /= duplicated.sum()
print("After duplicating first candidate:", np.round(duplicated, 3).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Ranked prompt: a street photo with a speed limit sign
Candidate probabilities: [0.976, 0.024]
After duplicating first candidate: [0.494, 0.494, 0.012]
```
<!-- leetllm: output:end -->

Notice why 0.976 drops to 0.494 without changing the image: softmax only distributes mass across the listed candidate prompts, so duplicating a description splits its probability share while leaving pairwise cosine rankings and unnormalized logits unchanged. A sharp softmax score therefore shows candidate preference inside the prompt set, not calibrated certainty or character-by-character reading of `35`. Generating free-form text answers or transcribing exact numerals requires feeding the encoder's spatial patch sequence straight into a language decoder.

```checkpoint
You compare an intersection photo embedding against candidate prompts like "a street photo with a speed limit sign" and "an open rural highway." What does CLIP return, and what does it leave unsolved?
---
CLIP returns relative image-text similarity scores across the candidate list. It does not output generated text strings, bounding boxes, or verified OCR digits from small signs. Reading exact numerals such as `35` requires either passing spatial patch features into a generative VLM or running dedicated text recognition on legible crops.
```

## From image encoder to VLM

Modern Vision-Language Models (VLMs) feed patch-grid features from a pretrained vision backbone directly into an autoregressive LLM rather than compressing the entire image into one `[CLS]` readout. Original LLaVA (2023) extracts the `[CLS]`-free `256 x 1024` spatial grid from CLIP ViT-L/14 at `224 x 224` and passes each patch linearly into the decoder's embedding space `d_LLM`, later switching to a two-layer MLP over a 336-pixel grid of 576 patches.[^liu2023a][^openaiClipLarge14Config2026] Other architectures shrink sequence length before the LLM: Qwen2.5-VL concatenates neighboring `2 x 2` patch vectors (`4 x 1280`) through a learned MLP merger to halve sequence resolution along both axes (`256 -> 64` tokens at `224 x 224`), while Flamingo uses a Perceiver Resampler to compress variable NFNet features into 64 learned cross-attention latents outside the causal prefix.[^bai2025qwen25vl][^alayrac2022]

<figure>
  <img src="illustrations/_generated/vlm_bridge_dark.png" alt="Three VLM bridge designs connecting visual features to a language decoder for a 224 by 224 image. LLaVA passes all 256 patch tokens linearly into the LLM prefix. Qwen2.5-VL groups adjacent 2 by 2 patches via an MLP merger to cut prefix count fourfold from 256 to 64. Flamingo resamples NFNet features into 64 latents for gated cross-attention outside the prefix. A bar chart compares prefix tokens at 448 pixels (1024 vs 256)." />
  <figcaption>Token-wise projectors preserve every encoder patch as an LLM prefix slot, 2×2 spatial mergers cut prefix tokens fourfold, and Perceiver cross-attention stores 64 visual memory keys outside the token stream.</figcaption>
</figure>

Sizing visual memory cleanly requires keeping three distinct tensor counts separate from end to end. First, the vision encoder emits its spatial patch matrix alongside any `[CLS]` or register tokens; second, the bridge either projects those patches linearly or merges adjacent grid neighborhoods; and third, only the remaining visual prefix slots consume KV-cache memory inside decoder self-attention. The table below summarizes the structural trade-offs across the three main bridge families:

| Bridge | Transformation | LLM integration |
|---|---|---|
| Token-wise linear or MLP projector | Projects each patch vector independently; preserves count | Prefix slots inside decoder self-attention (LLaVA)[^liu2023a] |
| Perceiver Resampler | Learned queries attend over spatial features into fixed latents | 64 memory keys read via gated cross-attention (Flamingo)[^alayrac2022] |
| Spatial `2 x 2` merger | Concatenates adjacent `2 x 2` patches then projects down; cuts count `4x` | Merged prefix slots inside decoder self-attention (Qwen2.5-VL)[^bai2025qwen25vl] |

<!-- leetllm: test, output=show -->
```python title="project-visual-features-into-llm-space.py"
import numpy as np

rng = np.random.default_rng(5)
visual_features = rng.normal(size=(1, 4, 8))
projector = rng.normal(size=(8, 16))
llm_visual_inputs = visual_features @ projector
text_token_count = 3

print("Vision features:", visual_features.shape)
print("Projected features:", llm_visual_inputs.shape)
print("Slots before generation:", llm_visual_inputs.shape[1] + text_token_count)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Vision features: (1, 4, 8)
Projected features: (1, 4, 16)
Slots before generation: 7
```
<!-- leetllm: output:end -->

### Token budget economics in VLMs

Every visual prefix token inserted ahead of text competes directly for attention compute and <span data-glossary="context-window">context window</span> capacity. Prefill attention evaluates pairs quadratically across the combined sequence, while **KV cache memory grows linearly** with total prefix tokens $T$. Cross-attention designs such as Flamingo keep visual latents in separate memory blocks instead of appending them to the causal prefix stream.[^alayrac2022]

With patch size $P = 14$ before merging, doubling image side length quadruples visual prefix count from $(224/14)^2 = 256$ tokens to $(448/14)^2 = 1{,}024$ tokens and $(896/14)^2 = 4{,}096$ tokens at $896 \times 896$. Four high-resolution `448 x 448` frames without merging already fill 4,096 slots before text or delimiter tokens, whereas a `2 x 2` merger reduces the four-image footprint to 1,024 tokens. Let's quantify exact raw KV payload scaling across those resolutions using a 32-layer decoder with eight KV heads, head dimension 128, BF16 storage (two bytes), and 512 text tokens:

$$
M_{\text{KV}} = 2 L T H_{\text{KV}} d_{\text{head}} b_{\text{element}}
$$

<!-- leetllm: test, output=show -->
```python title="visual-prefix-kv-budget.py"
layers, kv_heads, head_width, element_bytes = 32, 8, 128, 2
text_tokens = 512

def raw_kv_mib(retained_tokens: int) -> float:
    return 2 * layers * retained_tokens * kv_heads * head_width * element_bytes / 2**20

for image_side in (224, 448, 896):
    visual_slots = (image_side // 14) ** 2
    prefix_slots = text_tokens + visual_slots
    print(image_side, "visual / prefix:", visual_slots, prefix_slots,
          "raw KV MiB:", raw_kv_mib(prefix_slots))

print("Extra raw KV per retained token, MiB:", raw_kv_mib(1))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
224 visual / prefix: 256 768 raw KV MiB: 96.0
448 visual / prefix: 1024 1536 raw KV MiB: 192.0
896 visual / prefix: 4096 4608 raw KV MiB: 576.0
Extra raw KV per retained token, MiB: 0.125
```
<!-- leetllm: output:end -->

Notice that quadrupling visual tokens from 256 to 1,024 only doubles the total prefix length from 768 to 1,536 because the 512 text slots stay fixed, so the raw KV cache doubles from 96 MiB to 192 MiB rather than quadrupling. Moving once more to `896 x 896` increases visual tokens to 4,096 and pushes the combined cache to 576 MiB. These figures measure raw key-value payload per sequence, excluding model weights, layer activations, CUDA allocator fragmentation, and quantized cache metadata, and decoders with sliding-window retention alter how many prefix slots stay live.

For a $P = 16$ patch encoder across multi-image prompts or higher spatial resolution, prefix slot counts scale with image count and pixel area:

<!-- leetllm: test, output=show -->
```python title="from-image-encoder-to-vlm.py"
def patch_feature_slots(image_size: int, patch_size: int, images: int = 1) -> int:
    if image_size % patch_size != 0:
        raise ValueError("image must split into complete patches")
    per_image = (image_size // patch_size) ** 2
    return images * per_image

base = patch_feature_slots(224, 16, images=1)
two_images = patch_feature_slots(224, 16, images=2)
high_res = patch_feature_slots(448, 16, images=1)

print(base, two_images, high_res)
print("single-image patch features correct:", base == 196)
print("two-image patch features correct:", two_images == 392)
print("high-res patch features correct:", high_res == 784)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
196 392 784
single-image patch features correct: True
two-image patch features correct: True
high-res patch features correct: True
```
<!-- leetllm: output:end -->

Pixel resizing, changing patch granularity, and merging encoded features alter information in very different ways. Downsampling raw pixels blurs thin digit strokes before the first patch projection ever runs, whereas lossless patch flattening preserves every pixel until the linear projection compresses channels, and a learned feature merger pools neighboring tokens only after deep spatial contextualization. Isolating where detail disappears lets you fix preprocessing or bridge pooling before touching the language decoder.

| Concern | Production trade-off |
|---|---|
| Context budget | Passing 1,024 patch states individually uses 1,024 prefix slots. A $2\times 2$ merger reduces that count to 256 while pooling neighboring features, and retaining spatial fidelity still depends on position encoding and training. |
| Detail preservation | Resizing a 672-pixel-wide street frame down to 224 pixels wide shrinks 9-pixel-tall speed-sign numerals to roughly 3 pixels. Taking a native 224-pixel crop around the sign keeps those strokes 9 pixels tall; inspect processed crops alongside OCR or labeled transcription accuracy. |
| Multi-turn chat | Caching projected visual embeddings skips the vision encoder whenever the image, crop, processor, and encoder stay fixed across turns. Avoiding repeated decoder prefill requires separately caching the matching prefix KV states inside the language model. |

## Encoder variants change supervision and token budgets

Even when pixel resolution preserves tiny sign digits cleanly, an image encoder can miss fine text details if its pretraining objective emphasized global scene semantics over local localization, or if extra auxiliary slots shift what gets passed through the bridge. Two influential families, **SigLIP** and **DINOv2/v3**, illustrate how training losses, aspect-ratio handling, and register slots reshape modern ViT backbones.

### SigLIP: independent pair losses

CLIP normalizes similarity rows over captions and columns over images across an entire batch, which commonly pushes distributed trainers to gather embeddings from all workers to evaluate softmax denominators cleanly. Although cross-chunk log-sum-exp accumulation can compute exact softmax mathematically without holding every pair simultaneously, gathering negatives simplifies standard multi-GPU pipelines. SigLIP (Sigmoid Loss for Language-Image Pre-training) replaces matrix-wide softmax normalization with independent binary sigmoid losses on every `(image_i, caption_j)` pair:[^zhai2023]

$$
z_{ij} = \begin{cases} +1 & \text{if } i = j \\ -1 & \text{if } i \neq j \end{cases}
$$

$$
\mathcal{L}_{ij} = \log\left(1 + \exp\left(-z_{ij} \cdot (\hat{u}_i^\top \hat{v}_j \cdot s + b)\right)\right)
$$

Here $s > 0$ is a learned logit scale and $b$ is a learned bias that absorbs the heavy imbalance between $B$ positive diagonal pairs and $B(B - 1)$ off-diagonal negatives. Rather than dividing by all $B^2$ matrix entries, SigLIP sums every pair loss across the $B \times B$ grid and normalizes by batch size **$B$**:

$$
\mathcal{L}_{\text{SigLIP}} = \frac{1}{B}\sum_{i=1}^B\sum_{j=1}^B\mathcal{L}_{ij}
$$

Removing the shared softmax denominator simplifies chunked distributed evaluation because each chunk computes exact logistic terms without waiting for cross-device normalization statistics. SigLIP exchanges negative embeddings across neighboring workers using collective ring permutes to cut peak memory while covering full batch pairs.[^zhai2023] That permute pattern still moves features across workers and keeps gradient all-reduce intact; dropping remote negatives altogether alters the effective training distribution rather than evaluating the same objective cheaply.

<!-- leetllm: test, output=show -->
```python title="siglip-pairwise-loss.py"
import numpy as np

logits = np.array([[2.0, -1.0], [-0.4, 1.7]])
labels = 2 * np.eye(2) - 1
pair_losses = np.logaddexp(0.0, -labels * logits)

print("Positive losses:", np.round(np.diag(pair_losses), 3).tolist())
print("Negative losses:", np.round(pair_losses[labels < 0], 3).tolist())
print("Mean pair loss:", round(float(pair_losses.mean()), 3))
print("SigLIP batch normalization:", round(float(pair_losses.sum() / len(logits)), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Positive losses: [0.127, 0.168]
Negative losses: [0.313, 0.513]
Mean pair loss: 0.28
SigLIP batch normalization: 0.56
```
<!-- leetllm: output:end -->

With $B = 2$, the entrywise mean across four matrix slots is 0.28 whereas SigLIP's sum divided by $B$ returns 0.56, scaling both loss values and parameter gradients by $B$ relative to plain entrywise averaging. Applying class weighting or focusing updates on hard off-diagonal negatives alters that effective balance further. Independent logistic pair terms therefore simplify chunked memory management without eliminating sensitivity to batch curation or loss scaling.

### Variable resolution and dense features

Many fixed-resolution checkpoints warp or center-crop inputs into a square, even though the transformer architecture itself places no square constraint on patch grids. Checking the preprocessor carefully prevents silent spatial geometry bugs before the encoder ever receives a tensor. Squashing a wide `16:9` dashcam frame horizontally into a square distorts `"35"` into narrow glyphs, whereas tight center-cropping risks slicing roadside signs positioned near frame edges completely out of view.

SigLIP 2 (2025) augments the image-text sigmoid objective with captioning and localization supervision followed by self-distillation and masked **teacher-feature prediction**.[^zhai2025siglip2] Its NaFlex variant keeps original aspect ratios nearly intact by resizing images to patch-compatible dimensions under a chosen maximum token budget, interpolating the learned position grid, padding shorter sequence rows inside a batch, and masking padded positions. "Native aspect ratio" therefore preserves shape proportions under a token cap rather than preserving every native pixel or relaxing sequence-length limits. SigLIP 2 also replaces ViT's `[CLS]` vector with multi-head attention pooling for global readout and discards its auxiliary captioning decoder at release, so checking checkpoint slot conventions avoids adding a nonexistent class token or assuming open-ended captioning capability directly from the released encoder weights.[^zhai2025siglip2]

Correct attention masking on padded batches is equally crucial whenever variable-aspect images are grouped together. Leaving zero-valued padding tokens unmasked still gives them positive softmax weight and dilutes valid patches through the denominator. This fixed-query readout isolates how unmasked padding shifts the attention pooling output:

<!-- leetllm: test, output=show -->
```python title="padding-must-not-change-the-image-readout.py"
import numpy as np

def readout(tokens, valid):
    if not valid.any():
        raise ValueError("image has no valid patch tokens")
    query = np.array([1.0, 0.0])
    scores = tokens @ query / np.sqrt(tokens.shape[1])
    scores = np.where(valid, scores, -np.inf)
    weights = np.exp(scores - scores.max())
    weights /= weights.sum()
    return weights @ tokens

patches = np.array([[2.0, 0.1], [0.2, 1.5]])
padded = np.concatenate((patches, np.zeros((4, 2))))
baseline = readout(patches, np.ones(2, dtype=bool))
unmasked = readout(padded, np.ones(6, dtype=bool))
masked = readout(padded, np.array([True, True, False, False, False, False]))
assert not np.allclose(unmasked, baseline)
np.testing.assert_allclose(masked, baseline)
print("Unpadded readout:", np.round(baseline, 3).tolist())
print("Padding treated as patches:", np.round(unmasked, 3).tolist())
print("Padding masked:", np.round(masked, 3).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Unpadded readout: [1.606, 0.406]
Padding treated as patches: [0.913, 0.231]
Padding masked: [1.606, 0.406]
```
<!-- leetllm: output:end -->

Running the same processed image first alone (`batch_size = 1`) and then alongside a longer aspect-matched image inside one batch, with dropout off, catches missing mask propagation across attention layers and pooling readouts immediately. Be careful too that masking a padded key does not automatically zero out outputs at padded query rows, so downstream bridges must exclude padded indices explicitly; likewise, black border pixels padded before patch extraction carry learned projection weights and differ from post-extraction sequence padding. Finally, rejecting an empty-mask input prevents normalizing an all-masked attention row into `NaN`.

For pixel-aligned spatial features without paired text labels, **DINOv2** trains a student ViT via self-distillation to match both global image prototypes and masked-patch feature distributions from an exponential-moving-average teacher.[^oquab2024dinov2] Predicting latent patch distributions rather than raw RGB pixels produces clean dense representations for linear segmentation and monocular depth heads, though raw encoder tensors still require task-specific readouts to emit metric depth or semantic classes. **DINOv3** (2025) addresses dense-feature drift over very long training schedules using **Gram anchoring**, constraining pairwise similarities across teacher patch features across both ViT and ConvNeXt families.[^simeoni2025dinov3] When comparing encoders for a traffic-scene VLM, evaluate fine OCR reading and spatial localization side by side under matched crop geometry and visual token budgets.

Many modern backbones also append **register tokens** after discovering high-norm outlier patches in plain ViTs.[^darcet2024registers] Darcet et al. traced those background spikes to informative tokens repurposed as temporary scratchpads and eliminated the artifacts by adding a small bank of learnable register tokens, commonly four, alongside `[CLS]` and patch embeddings. Always verify whether a checkpoint outputs registers and whether the VLM bridge drops auxiliary slots before forwarding patch states to the decoder.

```checkpoint
Does removing CLIP's batch-wide softmax make SigLIP independent of batch composition?
---
No. Each pair contributes an independent logistic term, but sample choice, positive/negative ratio, false negatives, and normalization still affect gradients. A chunked implementation can reduce peak memory while still exchanging remote features. Removing a softmax denominator does not eliminate communication or make batch curation irrelevant.
```

<!-- leetllm: mastery:start -->

## Trace the encoder pipeline

Whenever a VLM misreads small visual details, tracing the signal cleanly from raw frame pixels to the decoder prefix isolates the cause before touching language weights. Checking each stage in sequence separates early optical blur from encoder patch compression, bridge token merging, and decoder attention:

- Calculate patch count, raw patch width, and projected tensor shapes from input resolution $H \times W \times C$ and patch width $P$.
- Account for quadratic self-attention scaling $O\left(\frac{H^2 W^2}{P^4}\right)$ before shrinking patch size to avoid memory exhaustion.
- Verify the checkpoint's position mechanism: additive tables, rotary queries and keys, or another spatial design.
- Resize learned patch-position grids with the expected interpolation settings, or use the supported rotary coordinates. Keep class and register slots separate.
- Distinguish CLIP ranking from verified character recognition, and track encoder slots, bridge outputs, inserted prefix tokens, and retained KV states separately.

```checkpoint
An encoder processes a 224×224 image with 16×16 patches, one class token, and four registers. Its bridge passes only patch features through a linear projector. How many encoder slots and LLM visual slots are there?
---
There are $(224/16)^2 = 196$ image patches. Adding one [CLS] token and four register tokens produces $196 + 1 + 4 = 201$ encoder slots. Slicing out only the patch tokens removes the five auxiliary slots, so the linear projector receives and outputs exactly 196 visual tokens into the LLM context window.
```

```checkpoint
Your VLM correctly identifies an urban street intersection with a red regulatory sign, yet transcribes the posted speed limit `35` as `38`. How do you isolate the error?
---
Inspect the actual resized or cropped image tensor fed to the encoder. Compare a high-resolution crop around the sign, dedicated OCR, and the VLM against verified ground-truth labels (allowing an explicit "unreadable" outcome when pixels are blurred). If native cropping fixes the reading, preprocessing downsampling erased the stroke gap between `5` and `8`; if the processed crop looks crisp to human inspection yet errors persist, the bottleneck lies in the encoder, feature merger, or decoder.
```

<!-- leetllm: mastery:end -->

```mastery-quiz
[
  {
    "question": "A 48×32 RGB image uses complete 8×8 patches and hidden width 128. What flat-patch and projected shapes follow?",
    "options": [
      "[1536,3] then [1,128].",
      "[24,192] then [24,128].",
      "[6,192] then [6,128].",
      "[24,128] then [24,192]."
    ],
    "answer": "[24,192] then [24,128].",
    "explanation": "The grid is 6×4 = 24 patches, with 8×8×3 = 192 raw values each. A shared projection changes width to 128 and preserves the 24 rows."
  },
  {
    "question": "A vision encoder uses 16×16 patches and no auxiliary tokens. Its input grows from 64×48 to 96×48 pixels (height × width). How do the patch count and the number of ordered query-key pairs per full-attention head change?",
    "options": [
      "16 to 36 patches, 256 to 1296 pairs.",
      "12 to 12 patches, 144 to 144 pairs.",
      "12 to 18 patches, 144 to 216 pairs.",
      "12 to 18 patches, 144 to 324 pairs."
    ],
    "answer": "12 to 18 patches, 144 to 324 pairs.",
    "explanation": "The grid grows from 4×3 to 6×3, so the patch count rises from 12 to 18. Keeping 12 misses the two new rows. Counting 16 and 36 uses the height for both axes. Each patch queries every patch, giving 12×12 = 144 pairs before and 18×18 = 324 after. A count of 216 pairs uses 18 queries with only the original 12 keys."
  },
  {
    "question": "A linear projection outputs the mean of four values and half of (right-column sum − left-column sum). Compare 2×2 raster patches [1,5,3,7] and [2,5,2,7]. Which output pair follows?",
    "options": [
      "[4,4] and [4,4]; this detail is lost.",
      "[4,4] and [4,3]; this detail is retained.",
      "[4,2] and [4,2]; this detail is lost.",
      "[4,4] and [4.5,4]; this detail is retained."
    ],
    "answer": "[4,4] and [4,4]; this detail is lost.",
    "explanation": "Both patches sum to 16, giving mean 4. Both also have right-column sum 12 and left-column sum 4, giving half-difference 4. Their difference [1,0,−1,0] lies in the projection's null space, so downstream layers cannot distinguish those two inputs."
  },
  {
    "question": "A learned patch-position grid changes from 10×14 to 12×18 at the same patch width, with one separate class slot. Which table transformation preserves semantic alignment?",
    "options": [
      "141→217 slots; resize class together with patches.",
      "141→141 slots; retain grid, widen each position.",
      "141→217 slots; resize patch grid, retain class.",
      "140→216 slots; resize patch grid, discard class."
    ],
    "answer": "141→217 slots; resize patch grid, retain class.",
    "explanation": "There are 140 and 216 patch positions, plus one class slot each. Reshape and interpolate only the 2D patch grid using the checkpoint's interpolation settings while keeping the [CLS] embedding unchanged."
  },
  {
    "question": "A Pre-LN block starts with x=[1,3]. Its attention branch returns [2,−1]. After normalizing the first residual, its MLP branch returns [−0.5,0.25]. What final residual follows?",
    "options": [
      "[2.5,2.25], retaining both skip additions.",
      "[−0.5,0.25], replacing the skip with MLP output.",
      "[0.5,3.25], adding MLP directly to the first input.",
      "[3,2], returning before the MLP residual."
    ],
    "answer": "[2.5,2.25], retaining both skip additions.",
    "explanation": "The first residual is [1,3]+[2,−1]=[3,2]. The second adds the MLP output [−0.5,0.25] back onto that intermediate state, yielding [2.5,2.25]. Pre-LN normalizes branch inputs while keeping both skip streams intact."
  },
  {
    "question": "Two candidate text prompts have exponential similarity weights 4 and 1 against an image. Duplicating the first prompt leaves both scores unchanged. What softmax probabilities result?",
    "options": [
      "[1/3,1/3,1/3].",
      "[4/5,4/5,1/5].",
      "[2/5,2/5,1/5].",
      "[4/9,4/9,1/9]."
    ],
    "answer": "[4/9,4/9,1/9].",
    "explanation": "The new denominator is 4+4+1=9. The duplicated caption splits its probability mass across two identical candidates even though image features and logits stayed fixed, demonstrating why softmax ranking scores are not calibrated absolute probabilities."
  },
  {
    "question": "A SigLIP batch has two positive pairs and two negative pairs with pairwise logistic losses 0.2, 0.4, 0.6, and 0.8. Using the paper's batch-size normalization, what objective and relation to the four-pair mean follow?",
    "options": [
      "0.5; equal to the four-pair mean.",
      "1.0; twice the four-pair mean.",
      "2.0; four times the four-pair mean.",
      "0.5; half of the four-pair mean."
    ],
    "answer": "1.0; twice the four-pair mean.",
    "explanation": "The loss sum is 2.0. Dividing by batch size B=2 gives 1.0, whereas dividing by B²=4 gives the entrywise mean 0.5 and scales gradients down by half."
  },
  {
    "question": "A fixed query gives all three keys a logit of zero. Their respective value vectors are [2,0], [0,2], and [0,0]. Only the last position is padding. What is the readout before and after masking the padding key?",
    "options": [
      "[2/3,2/3] unmasked; [1,1] masked.",
      "[2/3,2/3] unmasked; [0,0] masked.",
      "[1,1] unmasked; [2/3,2/3] masked.",
      "[1,1] unmasked; [1,1] masked."
    ],
    "answer": "[2/3,2/3] unmasked; [1,1] masked.",
    "explanation": "Each zero logit contributes exp(0) = 1 to the softmax denominator. The values sum to [2,2], so dividing by three gives [2/3,2/3]. Masking the padding key leaves two equal weights and gives [1,1]."
  },
  {
    "question": "Using this lesson's 0.125 MiB raw KV per retained slot, a 336×336 image uses 14×14 patches alongside 256 text slots. What raw KV cache is needed before and after a 2×2 visual token merger, with all slots retained?",
    "options": [
      "52 MiB before; 25 MiB after.",
      "104 MiB before; 50 MiB after.",
      "72 MiB before; 18 MiB after.",
      "104 MiB before; 26 MiB after."
    ],
    "answer": "104 MiB before; 50 MiB after.",
    "explanation": "A 336×336 frame split into 14×14 patches yields 24² = 576 visual tokens, so (576 + 256) × 0.125 = 104 MiB. A 2×2 merger compresses visual tokens to 144 while leaving all 256 text slots intact, giving (144 + 256) × 0.125 = 50 MiB."
  },
  {
    "question": "A DINOv2 student sees a street scene with one patch masked. Its teacher sees the patch and assigns 25%, 60%, and 15% to three learned features in that order. The student predictions to compare are A=[0.15,0.60,0.25] and B=[0.25,0.60,0.15]. Which one matches the target, and how should you assign a road, sidewalk, or building label to another patch?",
    "options": [
      "A matches. Apply a trained segmentation readout to the other patch’s features.",
      "B matches. Use the other patch’s most probable feature as its class label.",
      "B matches. Apply a trained segmentation readout to the other patch’s features.",
      "A matches. Use the other patch’s most probable feature as its class label."
    ],
    "answer": "B matches. Apply a trained segmentation readout to the other patch’s features.",
    "explanation": "Both predictions assign 60% to the middle feature, while only B preserves 25% on the first prototype and 15% on the third. Because self-distilled prototypes have no semantic names by themselves, dense labeling requires training a supervised segmentation readout on top of the patch features."
  }
]
```

> **Next:** Continue to [Positional Encoding: RoPE & ALiBi](/learn/positional-encoding-rope-alibi). ViT's learned 1D table is one way to stamp slot identity onto tokens. The next chapter compares that additive-table idea with sinusoidal encodings, <span data-glossary="rope">RoPE</span> rotations, and <span data-glossary="alibi">ALiBi</span>'s distance bias, and why those choices matter when sequence length changes.
