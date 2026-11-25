---
{
  "id": "vision-transformers-image-encoders",
  "title": "Vision Transformers and Image Encoders",
  "slug": "vision-transformers-image-encoders",
  "section": "Transformer & Multimodal Architectures",
  "category": "Multimodal Models",
  "difficulty": "Hard",
  "order": 6,
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

Feed a `224 x 224` street camera image directly into a Transformer one pixel at a time and self-attention explodes: `50,176` tokens demand **2.52 billion** query-key dot products per head in a single layer! Yet downsample that frame too aggressively and the tiny red speed-limit sign reading `35` on the far corner smears into an unreadable `38`.

How do modern vision encoders see both the whole intersection and the fine digits on a distant sign? A **<span data-glossary="vision-transformer">Vision Transformer (ViT)</span>**[^dosovitskiy2020] slices the image into non-overlapping square patches that act like text <span data-glossary="token">tokens</span>, attaches 2D spatial geometry, and runs bidirectional attention across the grid before passing those features into contrastive search (CLIP/SigLIP) or a Vision-Language Model (VLM).

<figure>
  <img src="illustrations/_generated/vit_patch_encoder_dark.png" alt="A 4 by 4 street scene pixel grid splits into four 2 by 2 patches covering sky, crimson speed sign, foliage, and asphalt. Each patch flattens into a row vector, projects linearly into D-wide token embeddings with added position offsets, and pairs with a learnable class token." />
  <figcaption>A $4 \times 4$ crop with patch size $P=2$ flattens into four $2 \times 2 \times 3$ RGB patches, projects into token matrix $Z_0$, and prepends a learnable `[CLS]` token with position embeddings.</figcaption>
</figure>

## From pixels to patches

Tile a `224 x 224` RGB image into $P \times P$ non-overlapping squares ($P = 16$). You get $(224 / 16)^2 = 196$ patches, each containing $P^2 C = 16 \times 16 \times 3 = 768$ raw pixel values. Multiply every flattened patch by one shared projection matrix $\mathbf{E} \in \mathbb{R}^{(P^2 C) \times D}$ (in practice, a single `Conv2d(3, D, kernel_size=P, stride=P)`[^pytorchConv2d2026]):

$$
N_{\text{patch}} = \frac{H}{P}\frac{W}{P}, \qquad D_{\text{raw}} = P^2 C, \qquad \mathbf{Z}_{\text{patch}} \in \mathbb{R}^{N_{\text{patch}} \times D}
$$

Patch size $P$ hits full self-attention with a fourth-power cliff: $O(N^2) = O(H^2 W^2 / P^4)$. Halving $P$ from $16$ to $8$ quadruples token count ($196 \to 784$) and increases pairwise attention comparisons **$16\times$** ($38{,}416 \to 614{,}656$)!

| Patch size | Tokens ($224 \times 224$) | Raw RGB values/patch | Attention pairs/head |
|---|---:|---:|---:|
| $32 \times 32$ | 49 | 3,072 | 2,401 |
| $16 \times 16$ | 196 | 768 | 38,416 |
| $14 \times 14$ | 256 | 588 | 65,536 |
| $8 \times 8$ | 784 | 192 | 614,656 |

<figure>
  <img src="illustrations/_generated/patch_size_cost_dark.png" alt="Patch grids and self-attention cost for a 224 by 224 street scene across patch sizes. Coarse 32 by 32 patches create 49 tokens and trap a 28-pixel speed sign inside a single patch. Fine 14 by 14 patches resolve the sign across 4 tiles with 256 tokens, raising pairwise attention evaluations from 2.4k to 65.5k." />
  <figcaption>On a $224 \times 224$ frame, $P=32$ traps a small speed sign inside one coarse cell (49 tokens), whereas $P=14$ resolves it across four cells (256 tokens, $27\times$ more attention pairs).</figcaption>
</figure>

Notice below that flattening patches manually and applying `Conv2d(..., kernel_size=P, stride=P)` match to machine precision, provided you preserve PyTorch's channels-first (`CHW`) order inside each patch:

<!-- leetllm: test, deps=torch, output=show -->
```python title="verify-convolutional-patch-embedding.py"
import torch

torch.manual_seed(3)
image = torch.arange(2 * 3 * 4 * 6, dtype=torch.float64).reshape(2, 3, 4, 6)
P, D = 2, 5
conv = torch.nn.Conv2d(3, D, P, stride=P).double()

n, c, h, w = image.shape
patches = (
    image.reshape(n, c, h // P, P, w // P, P)
    .permute(0, 2, 4, 1, 3, 5)
    .reshape(n, (h // P) * (w // P), c * P * P)
)
manual = patches @ conv.weight.reshape(D, -1).T + conv.bias
convolved = conv(image).flatten(2).transpose(1, 2)
torch.testing.assert_close(manual, convolved)
print("Token shape:", tuple(manual.shape), "| Conv2d matches manual projection:", torch.allclose(manual, convolved))
print(f"224x224 pair ratios -> pixel/P16={(224*224)**2 // 196**2}, P8/P16={784**2 // 196**2}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Token shape: (2, 6, 5) | Conv2d matches manual projection: True
224x224 pair ratios -> pixel/P16=65536, P8/P16=16x
```
<!-- leetllm: output:end -->

```checkpoint
Why does halving patch width from 16×16 to 8×8 multiply pairwise attention work by 16×?
---
Halving patch width doubles patches along both height and width ($4\times$ tokens: $196 \to 784$), and full self-attention computes $N^2$ pairs ($4^2 = 16\times$).
```

## Spatial geometry: 1D learned grids vs. 2D-RoPE

Without position information, <span data-glossary="self-attention">self-attention</span> is permutation-equivariant: shuffling the sky, tree, sign, and asphalt patches leaves `[CLS]` or mean-pooled readouts completely unchanged! Original ViT prepends a learnable `[CLS]` vector and adds a learned position table $\mathbf{E}_{\text{pos}} \in \mathbb{R}^{(N+1) \times D}$:[^dosovitskiy2020]

$$
\mathbf{z}_0 = [\mathbf{x}_{\text{class}};\ \mathbf{x}_p^1\mathbf{E};\ \dots;\ \mathbf{x}_p^N\mathbf{E}] + \mathbf{E}_{\text{pos}}
$$

What happens when you change image resolution at fine-tuning or inference (e.g., $224 \times 224 \to 256 \times 256$)? You cannot just slice a 1D table because row width changed! Instead:

1. **2D grid interpolation (classic ViT):** Keep `[CLS]` separate, reshape the $N$ patch positions into `[1, D, H_old, W_old]`, interpolate spatially to `[H_new, W_new]` (`scipy.ndimage.zoom` in the original JAX code or bicubic `F.interpolate(..., align_corners=False)` in PyTorch ports[^googleVitPositionResize2026][^pytorchInterpolate2026]), flatten back, and reattach `[CLS]`.
2. **2D Rotary Position Embeddings (2D-RoPE):** Used by native-resolution encoders like Qwen2.5-VL,[^bai2025qwen25vl][^su2021roformer] 2D-RoPE splits each attention head's dimensions into two halves, rotating one half by row angle $y \theta_k$ and the other by column angle $x \theta_k$. Dot products then depend strictly on relative spatial offsets $(\Delta y, \Delta x)$ across any rectangular grid without table interpolation!

<figure>
  <img src="illustrations/_generated/position_embeddings_dark.png" alt="Why vision transformers inject 2D coordinates and how 1D learned tables differ from 2D-RoPE. Shuffling sky, sign, tree, and road patches leaves the unordered bag identical unless position offsets tag each slot. When image width shifts from 3 columns to 4, 1D indices drift off rows whereas 2D-RoPE rotates separate x and y subspaces cleanly." />
  <figcaption>Without position tags, shuffled patches look identical; 2D interpolation preserves row alignment on learned grids, while 2D-RoPE encodes relative $(\Delta y, \Delta x)$ offsets natively.</figcaption>
</figure>

<!-- leetllm: test, deps=torch, output=show -->
```python title="2d-grid-resize-and-2d-rope.py"
import math
import torch
import torch.nn.functional as F

# 1. Interpolate a 14x14 learned position grid to 16x20 while leaving [CLS] untouched.
pos = torch.arange(197 * 3, dtype=torch.float64).reshape(1, 197, 3)
cls, grid = pos[:, :1], pos[:, 1:].reshape(1, 14, 14, 3).permute(0, 3, 1, 2)
resized_grid = F.interpolate(grid, size=(16, 20), mode="bicubic", align_corners=False)
resized = torch.cat((cls, resized_grid.permute(0, 2, 3, 1).reshape(1, 320, 3)), dim=1)
print("Resized position table:", tuple(pos.shape), "->", tuple(resized.shape), "| [CLS] preserved:", torch.equal(cls, resized[:, :1]))

# 2. 2D-RoPE inner product depends only on relative (dy, dx).
def rope2d(v, y, x, theta=0.5):
    cy, sy, cx, sx = math.cos(y * theta), math.sin(y * theta), math.cos(x * theta), math.sin(x * theta)
    return torch.tensor([v[0]*cy - v[1]*sy, v[0]*sy + v[1]*cy, v[2]*cx - v[3]*sx, v[2]*sx + v[3]*cx])

q, k = torch.tensor([1.2, -0.4, 0.7, 0.9]), torch.tensor([0.5, 1.1, -0.3, 0.8])
s1 = float(rope2d(q, 1, 2) @ rope2d(k, 3, 5))
s2 = float(rope2d(q, 4, 6) @ rope2d(k, 6, 9))
print(f"2D-RoPE (1,2)->(3,5): {s1:.6f} | shifted (+3,+4): {s2:.6f} | shift-invariant: {math.isclose(s1, s2, rel_tol=1e-6)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Resized position table: (1, 197, 3) -> (1, 321, 3) | [CLS] preserved: True
2D-RoPE (1,2)->(3,5): -1.984432 | shifted (+3,+4): -1.984432 | shift-invariant: True
```
<!-- leetllm: output:end -->

## Bidirectional blocks and CNN inductive biases

A ViT stacks $L$ Pre-LN encoder blocks (12 layers, $D=768$, 12 heads, 3,072 MLP width for ViT-B/16, carrying shape `[B, 197, 768]` throughout):[^dosovitskiy2020]

$$
\mathbf{z}'_\ell = \operatorname{MHA}(\operatorname{LN}(\mathbf{z}_{\ell-1})) + \mathbf{z}_{\ell-1}, \qquad \mathbf{z}_\ell = \operatorname{MLP}(\operatorname{LN}(\mathbf{z}'_\ell)) + \mathbf{z}'_\ell
$$

Unlike a <span data-glossary="causal-mask">causal</span> language decoder, vision encoders use **bidirectional attention** (globally in standard ViT, or mostly local windows plus a few global layers as in Qwen2.5-VL[^bai2025qwen25vl]) so the speed-limit sign can exchange context with sky, road, and foliage right in layer 1.

<figure>
  <img src="illustrations/_generated/spatial_attention_map_dark.png" alt="Side-by-side comparison of bidirectional encoder attention across [CLS], Sky, Tree, Sign, and Road tokens where all 25 entries are open versus lower-triangular causal decoder attention where future columns above the diagonal are masked" />
  <figcaption>Vision encoders allow symmetric bidirectional attention across all patches in layer 1, unlike lower-triangular causal language decoders.</figcaption>
</figure>

Compared to CNNs like ResNet[^he2015] (which hard-wire local kernels and translation equivariance), vanilla ViT has weak spatial inductive bias: it needed large-scale pretraining (ImageNet-21k/JFT) in the original paper before strong augmentation and distillation (**DeiT**[^touvron2021DeiT]) closed the small-data gap and modernized CNNs (**ConvNeXt**[^liu2022convnext]) narrowed it from the other side.

## Alignment objectives: CLIP, SigLIP, and DINOv2/v3

How do we train a ViT so its features understand language or dense pixel structure? Three paradigms dominate:

1. **CLIP (Symmetric InfoNCE):**[^radford2021][^oord2018] Pairs a vision encoder and text encoder on 400M image-text pairs, computes scaled cosine matrix $S_{ij} = s(\hat{u}_i^\top \hat{v}_j)$ across a batch of $B$ pairs, and averages row-wise ($I \to T$) and column-wise ($T \to I$) cross-entropies:
$$
\mathcal{L}_{\text{CLIP}} = \frac{1}{2}\left(\mathcal{L}_{I \to T} + \mathcal{L}_{T \to I}\right)
$$
This unlocks **zero-shot classification** over arbitrary text prompts. Remember one pitfall: softmax only normalizes over the candidate prompt list you supply, so duplicating a prompt splits its probability share (`0.976` $\to$ `[0.494, 0.494]`) without changing the image!
2. **SigLIP & SigLIP 2 (Pairwise Sigmoid Loss):**[^zhai2023][^zhai2025siglip2] Replaces CLIP's batch-wide softmax with independent binary logistic losses ($z_{ij} = +1$ on diagonal, $-1$ off-diagonal), normalized by batch size $B$ (not $B^2$):
$$
\mathcal{L}_{\text{SigLIP}} = \frac{1}{B} \sum_{i=1}^B \sum_{j=1}^B \log\bigl(1 + \exp(-z_{ij}(\hat{u}_i^\top \hat{v}_j \cdot s + b))\bigr)
$$
SigLIP simplifies distributed chunked training via ring permutes, while **SigLIP 2** adds captioning/localization supervision, self-distillation, multi-head attention pooling (replacing `[CLS]`), and native-aspect **NaFlex** batching (which requires strict attention masking on padded rows!).
3. **DINOv2 / DINOv3 & Register Tokens:**[^oquab2024dinov2][^simeoni2025dinov3][^darcet2024registers] Self-supervised student-teacher distillation over masked patches learns crisp dense spatial features for segmentation and depth without text captions (**DINOv3** adds Gram anchoring to prevent dense-feature drift over long training). Modern backbones also add learnable **register tokens** (typically 4) to absorb background high-norm outlier artifacts.[^darcet2024registers]

<figure>
  <img src="illustrations/_generated/clip_contrastive_dark.png" alt="A 3 by 3 CLIP similarity logit matrix pairs street sign, alpine trail, and coastal beam images with captions. Row softmax turns image 1 logits [3.50, 1.93, 1.47] into probabilities [0.75, 0.16, 0.10] with cross-entropy 0.292, while column softmax turns caption 1 logits [3.50, 1.90, 1.57] into [0.74, 0.15, 0.11] with cross-entropy 0.298 and symmetric InfoNCE mean 0.303." />
  <figcaption>CLIP places matched image-text pairs on the diagonal and averages image-to-text (row) and text-to-image (column) cross-entropies.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="clip-siglip-and-padding-mask.py"
import numpy as np

# 1. CLIP symmetric InfoNCE loss
images = np.eye(3)
texts = np.array([[1.0, 0.2, 0.0], [0.1, 1.0, 0.2], [0.0, 0.3, 1.0]])
texts /= np.linalg.norm(texts, axis=1, keepdims=True)
S = 3.0 * images @ texts.T
def ce(m):
    sh = m - m.max(axis=1, keepdims=True)
    return float(-np.diag(sh - np.log(np.exp(sh).sum(axis=1, keepdims=True))).mean())
print(f"CLIP symmetric loss: {(ce(S) + ce(S.T)) / 2:.3f}")

# 2. SigLIP divides total pairwise logistic loss by B (not B^2)
logits = np.array([[2.0, -1.0], [-0.4, 1.7]])
z = 2 * np.eye(2) - 1
pair_loss = np.logaddexp(0.0, -z * logits)
print(f"SigLIP loss (/B): {pair_loss.sum() / len(logits):.3f} vs entrywise mean: {pair_loss.mean():.3f}")

# 3. Masking padded visual tokens in variable-aspect attention pooling
def readout(tokens, valid):
    scores = np.where(valid, tokens @ np.array([1.0, 0.0]) / np.sqrt(2), -np.inf)
    w = np.exp(scores - scores.max())
    return (w / w.sum()) @ tokens

patches = np.array([[2.0, 0.1], [0.2, 1.5]])
padded = np.vstack([patches, np.zeros((4, 2))])
print("Unpadded readout:", np.round(readout(patches, np.ones(2, bool)), 3).tolist(),
      "| Unmasked padding bug:", np.round(readout(padded, np.ones(6, bool)), 3).tolist(),
      "| Masked:", np.round(readout(padded, np.array([True, True, False, False, False, False])), 3).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
CLIP symmetric loss: 0.155
SigLIP loss (/B): 0.560 vs entrywise mean: 0.280
Unpadded readout: [1.606, 0.406] | Unmasked padding bug: [0.913, 0.231] | Masked: [1.606, 0.406]
```
<!-- leetllm: output:end -->

## Connecting image encoders to VLMs (and the KV token bill)

Vision-Language Models pass spatial patch grids (not just one `[CLS]` vector) into an autoregressive LLM through three main bridges:

| Bridge | Mechanism | Example |
|---|---|---|
| **Token-wise linear / MLP projector** | Projects every patch into $d_{\text{LLM}}$; preserves patch count (256 at $224^2$, 576 at $336^2$) | LLaVA[^liu2023a][^openaiClipLarge14Config2026] |
| **Spatial $2 \times 2$ MLP merger** | Concatenates $2 \times 2$ adjacent patches (requiring side multiples of $2P=28$), cutting prefix tokens $4\times$ | Qwen2.5-VL[^bai2025qwen25vl] |
| **Perceiver Resampler** | Compresses visual features into 64 learned cross-attention latents outside the causal prefix | Flamingo[^alayrac2022] |

<figure>
  <img src="illustrations/_generated/vlm_bridge_dark.png" alt="Three VLM bridge designs connecting visual features to a language decoder for a 224 by 224 image. LLaVA passes all 256 patch tokens linearly into the LLM prefix. Qwen2.5-VL groups adjacent 2 by 2 patches via an MLP merger to cut prefix count fourfold from 256 to 64. Flamingo resamples NFNet features into 64 latents for gated cross-attention outside the prefix. A bar chart compares prefix tokens at 448 pixels (1024 vs 256)." />
  <figcaption>Linear projectors pass all 256 patches into the LLM prefix, $2\times 2$ mergers cut them $4\times$ to 64, and Perceiver cross-attention stores 64 latents outside the prefix stream.</figcaption>
</figure>

Every visual token inserted into the LLM prefix consumes both quadratic prefill compute and linear KV cache memory ($M_{\text{KV}} = 2 L T H_{\text{KV}} d_{\text{head}} b$). For a 32-layer, 8-KV-head, $d_{\text{head}}=128$, BF16 decoder (`0.125 MiB` per retained token) plus 512 text tokens, doubling image resolution ($P=14$) scales the raw KV bill rapidly:

<!-- leetllm: test, output=show -->
```python title="visual-prefix-kv-budget.py"
kv_per_tok_mib = 2 * 32 * 8 * 128 * 2 / 2**20  # 0.125 MiB/token
for side in (224, 448, 896):
    vis = (side // 14) ** 2
    tot = 512 + vis
    print(f"{side}x{side} (P=14): {vis:>4} visual + 512 text = {tot:>4} slots -> {tot * kv_per_tok_mib:5.1f} MiB KV ({(512 + vis//4) * kv_per_tok_mib:5.1f} MiB with 2x2 merger)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
224x224 (P=14):  256 visual + 512 text =  768 slots ->  96.0 MiB KV ( 72.0 MiB with 2x2 merger)
448x448 (P=14): 1024 visual + 512 text = 1536 slots -> 192.0 MiB KV ( 96.0 MiB with 2x2 merger)
896x896 (P=14): 4096 visual + 512 text = 4608 slots -> 576.0 MiB KV (192.0 MiB with 2x2 merger)
```
<!-- leetllm: output:end -->

> **Key insight:** When a VLM misreads a tiny speed-limit sign `35` as `38`, inspect the *actual resized crop* entering the encoder first! Downsampling a 672-pixel frame to 224 pixels shrinks 9-pixel digits to 3 blurry pixels before the ViT even runs.

```checkpoint
An encoder processes a 224×224 image with 16×16 patches, one [CLS] token, and four register tokens. Its VLM bridge slices out only patch features for a linear projector. How many encoder slots and LLM visual tokens exist?
---
$(224/16)^2 = 196$ patches plus 1 `[CLS]` and 4 registers = **201 encoder slots**. Dropping the 5 auxiliary slots leaves **196 visual tokens** entering the LLM prefix.
```

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
    "explanation": "The grid grows from 4×3 to 6×3, so the patch count rises from 12 to 18. Each patch queries every patch, giving 12×12 = 144 pairs before and 18×18 = 324 after."
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
    "explanation": "Both patches sum to 16, giving mean 4. Both also have right-column sum 12 and left-column sum 4, giving half-difference 4. Their difference [1,0,−1,0] lies in the projection's null space."
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
    "explanation": "There are 140 and 216 patch positions, plus one class slot each. Reshape and interpolate only the 2D patch grid while keeping the [CLS] embedding unchanged."
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
    "explanation": "The first residual is [1,3]+[2,−1]=[3,2]. The second adds the MLP output [−0.5,0.25] back onto that intermediate state, yielding [2.5,2.25]."
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
    "explanation": "The new denominator is 4+4+1=9. The duplicated caption splits its probability mass across two identical candidates even though image features and logits stayed fixed."
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
    "explanation": "The loss sum is 2.0. Dividing by batch size B=2 gives 1.0, whereas dividing by B²=4 gives the entrywise mean 0.5."
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
    "explanation": "Only B preserves 25% on the first prototype and 15% on the third. Because self-distilled prototypes have no semantic names by themselves, dense labeling requires a trained segmentation readout."
  }
]
```

> **Next:** Continue to [Vision-Language & Multimodal Architectures](/learn/multimodal-llms-architecture-design).
