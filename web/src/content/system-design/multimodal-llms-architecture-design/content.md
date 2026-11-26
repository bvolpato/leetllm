---
{
  "id": "multimodal-llms-architecture-design",
  "title": "Vision-Language & Multimodal Architectures",
  "slug": "multimodal-llms-architecture-design",
  "category": "Multimodal Models",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/multimodal_llm_dark.png",
  "companies": [
    "Google",
    "OpenAI",
    "Anthropic",
    "Meta",
    "DeepMind"
  ],
  "shortDescription": "Master vision-language and multimodal LLM architectures from CLIP and SigLIP contrastive encoders to ViT patch tokenization, dynamic tiling, connectors, fusion strategies, and KV-cache serving.",
  "keyConceptsTested": [
    "CLIP symmetric InfoNCE contrastive pretraining",
    "SigLIP pairwise sigmoid loss and NaFlex",
    "ViT patch tokenization and visual token scaling",
    "Dynamic resolution and AnyRes multi-crop tiling",
    "Projection layers (linear, MLP, Q-Former, Perceiver Resampler)",
    "Early fusion vs late fusion vs gated cross-attention",
    "Two-stage visual instruction tuning vs joint multimodal pretraining",
    "Native multimodal stacks (Llama 4, GPT-4o, Qwen2.5-VL)",
    "Modality gap and training stability",
    "KV cache pressure and prefix caching for multimodal serving"
  ],
  "prerequisites": [
    "llm-cost-engineering-token-economics"
  ],
  "relatedQuestions": [
    "image-generation-diffusion-models",
    "design-real-time-voice-ai-agent",
    "agentic-architectures-react-plan-execute",
    "chunking-strategies-document-processing",
    "vision-transformers-image-encoders",
    "prompt-injection-defense-strategies"
  ],
  "section": "Transformer & Multimodal Architectures",
  "order": 7,
  "aliases": [
    "vision-language-models-clip-beyond"
  ]
}
---

A single chart or photograph reveals the core tension in multimodal engineering. Type `"line chart showing latency spike"` into an image search bar and a dual-encoder index finds matching figures across millions of images in milliseconds. Ask that same 768-number embedding to read a `14:02` axis tick, count three red markers, or reconcile the chart with a 40-second spoken clip, and it goes completely blind.

Pixels, audio spectrograms, and text tokens live in different coordinate systems and arrive at wildly different token rates. Global pooling makes retrieval fast, whereas grounded reasoning demands keeping spatial patch tokens alive and bridging them into a language model without overflowing context windows or KV-cache memory.

## Contrastive dual-encoders: CLIP and SigLIP

**CLIP (Contrastive Language-Image Pre-training)** aligned whole images and captions inside one shared hypersphere from 400 million web `(image, text)` pairs.[^radford2021] It runs an image tower (ResNet or ViT) and a <span data-glossary="transformer">Transformer</span> text tower independently, joining them only at the output via linear projections and L2 normalization. That **late-fusion** design lets you embed millions of images offline and rank them against any text prompt with a single dot product.

### CLIP symmetric InfoNCE loss

For $N$ paired L2-normalized image and text embeddings $(I_i, T_j)$, CLIP builds the $N \times N$ scaled cosine <span data-glossary="logits">logit</span> matrix $z_{ij} = \exp(t) \cdot I_i^\top T_j = I_i^\top T_j / \tau$, where $t$ is a learned log-scale (with $\exp(t)$ initialized at $1/0.07 \approx 14.3$, so $t \approx 2.66$, and clamped at $\exp(t) \le 100$).[^radford2021] The $N$ diagonal pairs are positives and the $N^2 - N$ off-diagonal pairs serve as in-batch negatives under symmetric InfoNCE <span data-glossary="cross-entropy">cross-entropy</span>:

$$
\mathcal{L}_{I \rightarrow T} = -\frac{1}{N}\sum_{i=1}^{N}\log\frac{\exp(z_{ii})}{\sum_{j=1}^{N}\exp(z_{ij})},
\qquad
\mathcal{L}_{T \rightarrow I} = -\frac{1}{N}\sum_{i=1}^{N}\log\frac{\exp(z_{ii})}{\sum_{j=1}^{N}\exp(z_{ji})},
\qquad
\mathcal{L} = \frac{\mathcal{L}_{I \rightarrow T} + \mathcal{L}_{T \rightarrow I}}{2}
$$

CLIP trained with $N = 32{,}768$ so every image competed against 32,767 negative captions.[^radford2021] Two details trap engineers immediately. First, default CLIP `encode_image` and `encode_text` return *unnormalized* features (with a 77-token text cap);[^openaiClipImplementation2026] skipping L2 normalization lets high-norm captions beat closer directional matches. Second, when two rows in a large batch depict the same concept, InfoNCE treats their off-diagonal pair as a **false negative** and pushes matching representations apart.

### SigLIP: pairwise sigmoid loss

CLIP's batch-wide softmax forces every GPU to synchronize global normalizers. **SigLIP (Sigmoid Loss for Language-Image Pre-training)** replaces softmax with independent pairwise binary classification:[^zhai2023]

$$
\mathcal{L} = -\frac{1}{N} \sum_{i=1}^{N} \sum_{j=1}^{N} \log \sigma\!\big(z_{ij} \cdot (t \cdot v_i^\top u_j + b)\big)
$$

Here $z_{ij} = +1$ on the diagonal and $-1$ off-diagonal, $t = \exp(t_0)$ starts at $10$, and learned bias $b$ starts at $-10$ to reflect negative-heavy batches. Crucially, SigLIP sums all $N^2$ pair losses and **divides by $N$**, not $N^2$ (dividing by $N^2$ shrinks loss and gradients by an extra factor of $N$). Removing the shared denominator lets SigLIP chunk across devices and outperform softmax CLIP below 16k batch size.[^zhai2023] **SigLIP 2** adds captioning, self-distillation, and masked prediction for stronger VLM transfer, with **NaFlex** variants preserving native aspect ratios.[^zhai2025siglip2][^googleSiglip2Implementation2026]

Verify the L2 norm trap, CLIP's false-negative collision spike, and SigLIP's `/N` vs `/N^2` reduction in NumPy:

<!-- leetllm: test, output=show -->
```python title="clip-and-siglip-loss.py"
import numpy as np

def l2_norm(x: np.ndarray) -> np.ndarray:
    return x / np.linalg.norm(x, axis=-1, keepdims=True)

def clip_loss(img_e: np.ndarray, txt_e: np.ndarray, temp: float = 0.2) -> float:
    logits = (l2_norm(img_e) @ l2_norm(txt_e).T) / temp
    idx = np.arange(len(logits))
    def row_ce(m: np.ndarray) -> float:
        s = m - m.max(axis=-1, keepdims=True)
        return float(np.mean(np.log(np.sum(np.exp(s), axis=-1)) + m.max(axis=-1) - m[idx, idx]))
    return 0.5 * (row_ce(logits) + row_ce(logits.T))

# 1. Raw dot product vs L2-normalized cosine
img, cap_a, cap_b = np.array([1.0, 0.0]), np.array([0.8, 0.6]), np.array([9.0, 12.0])
print(f"raw dot: A={img @ cap_a:.1f}, B={img @ cap_b:.1f} | cosine: A={l2_norm(img) @ l2_norm(cap_a):.2f}, B={l2_norm(img) @ l2_norm(cap_b):.2f}")

# 2. Clean 3x3 batch vs false-negative collision
img_c = np.array([[0.95, 0.05, 0.00], [0.05, 0.92, 0.03], [0.00, 0.07, 0.94]])
txt_c = np.array([[0.91, 0.08, 0.01], [0.06, 0.89, 0.04], [0.02, 0.09, 0.90]])
img_d = np.array([[0.95, 0.05, 0.00], [0.92, 0.08, 0.00], [0.00, 0.07, 0.94]])
txt_d = np.array([[0.91, 0.09, 0.00], [0.89, 0.11, 0.00], [0.02, 0.09, 0.90]])
print(f"CLIP clean: {clip_loss(img_c, txt_c):.3f} | collision: {clip_loss(img_d, txt_d):.3f}")

# 3. SigLIP pairwise loss: /N vs /N^2 on 2x2 zero logits
losses = np.logaddexp(0.0, -(2.0 * np.eye(2) - 1.0) * np.zeros((2, 2)))
print(f"SigLIP /N: {losses.sum() / 2:.3f} | /N^2: {losses.sum() / 4:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw dot: A=0.8, B=9.0 | cosine: A=0.80, B=0.60
CLIP clean: 0.022 | collision: 0.469
SigLIP /N: 1.386 | /N^2: 0.693
```
<!-- leetllm: output:end -->

### Zero-shot classification and dual-encoder limits

Embedding prompt templates (`"a photo of a {label}"`) gives **zero-shot classification** without training a new head: CLIP ViT-L/14@336px reached 76.2% ImageNet top-1, with prompt templates plus 80-template ensembling adding nearly +5 points over bare class names.[^radford2021] Never trust single-candidate <span data-glossary="softmax">softmax</span> (`softmax([-10]) = [1.0]`); threshold raw cosine and top-1 vs top-2 margin.

Global pooling still hits four ceilings: no bounding-box localization or counting (requiring detectors like Grounding DINO[^liu2023groundingdino] or grounded VLMs), no text generation, weak attribute binding and multi-digit OCR (CLIP scores 88% on MNIST but 51% on SVHN),[^radford2021] and both web bias[^agarwal2021] and the geometric **modality gap** where image and text embeddings occupy distinct hypersphere cones.[^liang2022modalitygap] Generative VLMs solve this by stopping *before* pooling and handing spatial patch tokens to a decoder.

## Vision tokenization and dynamic resolution

A generative multimodal LLM combines modality encoders, a cross-modal **connector**, and a language decoder into one pipeline.

<figure>
  <img src="illustrations/_generated/multimodal_llm_dark.png" alt="Multimodal architecture: image, audio, and video signals pass through encoders and a connector into a language model prefix or side memory." />
  <figcaption>Images, audio, and video pass through modality encoders before a connector inserts them into the decoder prefix or cross-attention memory.</figcaption>
</figure>

### ViT patchification and token scaling

A <span data-glossary="vision-transformer">Vision Transformer (ViT)</span> slices an $H \times W \times C$ image into $P \times P$ patches, flattens each to $P^2 C$ scalars, projects it to width $D$, adds positional embeddings, and runs global <span data-glossary="self-attention">self-attention</span> from layer 1.[^dosovitskiy2020] For $V$ views of size $H_i \times W_i$ padded to patch size $P$:

$$
N_{\text{patch}} = \sum_{i=1}^{V}
\left\lceil\frac{H_i}{P}\right\rceil
\left\lceil\frac{W_i}{P}\right\rceil
$$

Token counts scale quadratically with resolution: a 224px image at $P=14$ emits 256 patches, while 336px (LLaVA-1.5) emits 576.[^liu2023b] Upload bytes never predict GPU cost: a 12 MB JPEG and a 400 KB WebP yield identical patch counts after resizing, whereas a tiny PNG tiled into five 336px crops emits `2,880` visual tokens. Always cap upload bytes and post-preprocessing visual tokens separately.

<!-- leetllm: test, output=show -->
```python title="visual-token-scaling.py"
import numpy as np

def vit_patchify(image: np.ndarray, patch: int, dim: int) -> np.ndarray:
    H, W, C = image.shape
    gh, gw = H // patch, W // patch
    flat = image.reshape(gh, patch, gw, patch, C).transpose(0, 2, 1, 3, 4).reshape(gh * gw, patch * patch * C)
    return flat @ (np.random.default_rng(0).standard_normal((flat.shape[1], dim)) * 0.02)

print("224px @ P=16 projected shape:", vit_patchify(np.zeros((224, 224, 3), np.float32), 16, 768).shape)
for label, sz, views in [("224px (1 view)", 224, 1), ("336px (1 view)", 336, 1),
                         ("672px (1 view)", 672, 1), ("chart (5x 336px)", 336, 5), ("video 60s @ 2fps", 224, 120)]:
    vis = int(np.ceil(sz / 14)) ** 2 * views
    total = vis + 2500
    print(f"{label:<18} visual={vis:6,d}  total={total:6,d}  [{'fits 4K' if total <= 4096 else 'exceeds 4K'}]")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
224px @ P=16 projected shape: (196, 768)
224px (1 view)     visual=   256  total= 2,756  [fits 4K]
336px (1 view)     visual=   576  total= 3,076  [fits 4K]
672px (1 view)     visual= 2,304  total= 4,804  [exceeds 4K]
chart (5x 336px)   visual= 2,880  total= 5,380  [exceeds 4K]
video 60s @ 2fps   visual=30,720  total=33,220  [exceeds 4K]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/visual_token_scaling_dark.png" alt="Shared-scale bar chart comparing 256, 1,024, and 2,304 patches for 224px, 448px, and 672px stills against a 4,096-token limit and 30,720 tokens for 60s video at 2fps." />
  <figcaption>A 60-second video at 2 fps emits 30,720 raw ViT-L/14 patches, 7.5 times a 4,096-token context window before adding any text.</figcaption>
</figure>

### Dynamic resolution and AnyRes tiling

Downscaling a 4K chart to 336x336 smears small labels into unreadable pixels. Two modern patterns preserve fine text:
- **AnyRes / multi-crop tiling:** Always reserve slot 0 for one downscaled **global thumbnail** (layout context) and spend a capped local crop budget on native-resolution crops over high-detail regions, storing crop-to-original coordinates. Never let the thumbnail compete on local saliency score, and escalate or abstain if a hard crop cap omits a required legend.
- **Native dynamic-resolution ViTs:** **Qwen2.5-VL** encodes images at native aspect ratios using 2D RoPE and a 2x2 spatial patch merger (4x token reduction while preserving local geometry),[^bai2025qwen25vl] while **SigLIP 2 NaFlex** similarly avoids square distortion.[^zhai2025siglip2]

<figure>
  <img src="illustrations/_generated/dynamic_tiling_dark.png" alt="Dashboard highlighting a bottom axis and upper-right badge; output retains one global thumbnail plus separate axis and badge crops with original coordinate maps." />
  <figcaption>Dynamic tiling reserves one global view for layout and spends the remaining crop budget on high-detail local regions with preserved coordinate mappings.</figcaption>
</figure>

## Vision-to-language connectors

The **connector** projects $N$ encoder patches of width $d_v$ into decoder width $d_{\text{llm}}$, choosing between keeping full spatial grids or compressing into $M \ll N$ learned query vectors:

| Connector | Visual tokens | Mechanism | Primary tradeoff |
|---|---|---|---|
| **Linear / 2-layer MLP** (LLaVA-1.5) | $N$ | Per-patch projection (`Linear -> GELU -> Linear`)[^liu2023b] | Preserves spatial layout; high token cost on tiled views |
| **2x2 spatial merger** (Qwen2.5-VL) | $N / 4$ | Merges adjacent $2 \times 2$ patches before MLP[^bai2025qwen25vl] | 4x token cut with intact 2D neighborhoods |
| **Q-Former** (BLIP-2) | Fixed $M$ (e.g., 32) | Learned queries cross-attend over all $N$ patches[^li2023] | Predictable KV budget; can blur tiny OCR strings |
| **Perceiver Resampler** (Flamingo) | Fixed $M$ (e.g., 64) | Learned latent bank cross-attends over variable media[^alayrac2022] | Caps multi-image/video length; same fine-detail risk |

Q-Former and Perceiver do not discard 544 patches; every learned query attends across all 576 patches. Watch one scaling trap: applying 24 queries *per view* or *per frame* still scales linearly (10 frames $\times$ 3 views $\times$ 24 = 720 tokens), so clip caps require a clip-level resampler or frame limit. Connectors can also vary injection depth: **MPnP** taps intermediate vision blocks and injects projected K/V pairs directly into late decoder blocks for lightweight adaptation at the cost of shallower visual reasoning.[^huang2025mpnp]

<!-- leetllm: test, output=show -->
```python title="projection-token-budget.py"
import numpy as np

rng = np.random.default_rng(7)
N, d_v, d_llm, M = 576, 768, 2048, 32
patches = rng.standard_normal((N, d_v)).astype(np.float32)
W_lin = rng.standard_normal((d_v, d_llm)).astype(np.float32) * 0.02

linear_out = patches @ W_lin
queries = rng.standard_normal((M, d_v)).astype(np.float32) * 0.02
scores = (queries @ patches.T) / np.sqrt(d_v)
weights = np.exp(scores - scores.max(axis=-1, keepdims=True))
weights /= weights.sum(axis=-1, keepdims=True)
qformer_out = (weights @ patches) @ W_lin

print(f"linear: {linear_out.shape} | q-former: {qformer_out.shape} ({N // M}x compression)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
linear: (576, 2048) | q-former: (32, 2048) (18x compression)
```
<!-- leetllm: output:end -->

> **Key insight:** Matching matrix shapes puts visual tensors into the forward pass, but grounding comes from resolution and training. Fluent answers that hallucinate visible labels point to encoder downscaling or connector over-compression, not a weak LLM.

## Fusion architectures: early, late, and cross-attention

| Strategy | Interaction point | Best fit | Attention & KV cost |
|---|---|---|---|
| **Early fusion** | Interleaved prefix before layer 0 | Fine OCR, chart QA, native VLMs | Shared $O((T_{\text{text}}+T_{\text{vis}})^2)$ self-attention and shared KV cache |
| **Cross-attention** | Selected decoder layers read visual bank | Frozen backbones, multi-image/video banks | Text self-attention plus $O(T_{\text{text}} T_{\text{vis}})$ per fusion layer |
| **Late fusion** | Pooled vectors after separate towers | Fast million-scale image-text search | One dot product; no generative decoder |

### Early fusion (interleaved visual-text attention)

Early fusion concatenates projected visual tokens directly with text <span data-glossary="embedding">embeddings</span> (from a standard [tokenizer](/learn/tokenization-bpe-wordpiece-sentencepiece)), letting every layer mix vision and language via standard self-attention (used in LLaVA, Qwen2.5-VL, GPT-4o, and Llama 4).[^liu2023a][^bai2025qwen25vl][^openai2024][^meta2025llama4] Every visual token consumes prefill FLOPs and KV cache just like text: pairing five 336px views (`2,880` tokens) with 2,500 transcript/prompt/output tokens totals **5,380 tokens** (exceeding 4K), whereas 32-query resampling (`160` visual tokens) fits cleanly at **2,660 tokens**.

<figure>
  <img src="illustrations/_generated/early_fusion_sequence_dark.png" alt="Direct plan totals 5,380 tokens and exceeds a 4,096-token limit; reduced plan totals 2,660 tokens including 2,000 transcript, 200 prompt, and 300 output tokens." />
  <figcaption>Compressing five views from 2,880 to 160 visual tokens brings a 5,380-token sequence safely inside a 4,096-token window.</figcaption>
</figure>

### Gated cross-attention (Flamingo-style)

**Flamingo** keeps resampled visual memory off the text prefix and inserts **gated <span data-glossary="cross-attention">cross-attention</span>** blocks between frozen LLM layers:[^alayrac2022]

$$
A = \operatorname{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}}\right)V,
\qquad
h_{\text{out}} = h_{\text{text}} + \tanh(\alpha) \cdot A
$$

At $\alpha = 0$, $\tanh(0) = 0$ preserves the pretrained text LLM identically at step 0. Contrast that with inserting zero-initialized visual K/V pairs directly into the *same* self-attention softmax (as in shared-K/V injection like MPnP[^huang2025mpnp]): even a zero key emits logit `0`, stealing probability mass in the shared denominator and halving the text output!

<!-- leetllm: test, output=show -->
```python title="gated-cross-attention.py"
import numpy as np

def attend(q: np.ndarray, k: np.ndarray, v: np.ndarray) -> np.ndarray:
    scores = (q @ k.T) / np.sqrt(q.shape[-1])
    w = np.exp(scores - scores.max(axis=-1, keepdims=True))
    return (w / w.sum(axis=-1, keepdims=True)) @ v

text_h = np.array([0.20, 0.10, 0.70])
vis_k = np.array([[0.20, 0.05, 0.75], [0.80, 0.10, 0.10], [0.05, 0.90, 0.05]])
vis_v = np.array([[0.10, 0.00, 0.90], [0.80, 0.10, 0.10], [0.10, 0.80, 0.10]])
att = attend(text_h, vis_k, vis_v)
for alpha in [0.0, 0.35]:
    print(f"Flamingo alpha={alpha:.2f} -> {np.round(text_h + np.tanh(alpha) * att, 3).tolist()}")

# Shared-softmax zero-K/V dilution: text value 2.0 drops to 1.0
t_only = attend(np.array([1.0]), np.array([[0.0]]), np.array([[2.0]]))[0]
t_zero = attend(np.array([1.0]), np.array([[0.0], [0.0]]), np.array([[0.0], [2.0]]))[0]
print(f"shared softmax: text_only={t_only:.1f}, with_zero_kv={t_zero:.1f}")
T_text, T_vis = 2200, 160
print(f"scores: early={(T_text + T_vis)**2:,} | cross-attn={T_text * T_vis:,} (+ text self-attn)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Flamingo alpha=0.00 -> [0.2, 0.1, 0.7]
Flamingo alpha=0.35 -> [0.308, 0.191, 0.837]
shared softmax: text_only=2.0, with_zero_kv=1.0
scores: early=5,569,600 | cross-attn=352,000 (+ text self-attn)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/cross_attention_layers_dark.png" alt="Compressed visual memory stays outside the text prefix while selected fusion blocks attend over it beside normal text layers." />
  <figcaption>Cross-attention keeps visual memory off the text prefix, letting selected fusion layers read visual features where needed.</figcaption>
</figure>

## Audio, video, and multi-rate frontends

Different modalities emit features at vastly different rates: five 336px crops emit 2,880 patches, 40 seconds of audio at 100 Hz emit 4,000 spectrogram frames, and a transcript adds 2,000 text <span data-glossary="token">tokens</span>.

Match pretrained frontends to signal types: **CLIP**[^radford2021] or **SigLIP**[^zhai2023] for images, **Whisper**[^radford2022] for speech spectrograms, and **CLAP**[^elizalde2023] for non-speech audio retrieval; for video, combine spatial compression with temporal sampling or spatiotemporal pooling (TimeSformer,[^bertasius2021] VideoMAE[^tong2022]). For speech, timestamped transcripts beat raw audio on cost unless tone, overlap, or alarms matter; when feeding raw audio, stride-10 temporal pooling compresses `4,000 -> 400` tokens (trading 10 ms precision for 100 ms steps). Always separate **utterance time** (when someone spoke) from **event time** (when a metric changed on a chart).

## Training recipes and modern VLM tradeoffs

**Adapter-based two-stage training** (BLIP-2,[^li2023] LLaVA,[^liu2023a] LLaVA-1.5,[^liu2023b] early PaLI[^chen2023]) separates bridge alignment from instruction tuning:

| Stage | Data | Vision encoder | Projector | LLM |
|---|---|---|---|---|
| **1. Feature alignment** | Filtered CC3M captions[^sharma2018] (558K in LLaVA-1.5) | Frozen | **Train** | Frozen |
| **2. Visual instruction tuning** | Multimodal QA mix (665K in LLaVA-1.5) | Frozen | **Train** | **Train** (full FT or <span data-glossary="lora">LoRA</span>) |

In Stage 1, freeze LLM weights (`requires_grad=False`) so random projector <span data-glossary="gradient">gradients</span> never corrupt pretrained language weights, while keeping **activation backpropagation enabled** through the <span data-glossary="autoregressive-decoding">autoregressive</span> caption loss (wrapping the LLM in `torch.no_grad()` kills projector training!). LLaVA-1.5 finished both stages in roughly a day on 8 A100 GPUs.[^liu2023b]

**Joint / native multimodal pretraining** unfreezes encoders and backbones together across rich text, image, audio, and video mixtures: **Gemini**,[^team2023] **Llama 4** (<span data-glossary="early-fusion">early fusion</span> with MetaCLIP + sparse MoE),[^meta2025llama4] **GPT-4o** (end-to-end text/vision/audio I/O),[^openai2024] and **Qwen2.5-VL** (dynamic ViT + 2x2 merger).[^bai2025qwen25vl] Joint training excels on dense <span data-glossary="ocr">OCR</span> and charts, but unbalanced multimodal batches can erode pure-text reasoning; use per-component <span data-glossary="learning-rate">learning rates</span> and track text-only evals continuously. Post-training with <span data-glossary="dpo">DPO</span>[^rafailov2023] or <span data-glossary="rlhf">RLHF</span> sharpens abstention and formatting, yet never recovers pixels erased upstream: if verified OCR text succeeds where raw pixels fail, fix resolution or connector compression first.

## Multimodal serving, KV-cache memory, and safety

In early-fusion VLMs, visual tokens occupy the decoder [KV cache](/learn/kv-cache-paged-attention-llm-serving) alongside text. <span data-glossary="pagedattention">PagedAttention</span> eliminates fragmentation[^kwon2023] but not token count. On a 32-layer GQA decoder (8 KV heads, head dim 128, BF16 = 2 B), each token consumes $2 \times 32 \times 8 \times 128 \times 2 = \mathbf{128\text{ KiB}}$ of KV cache: 2,880 direct visual tokens take **360.0 MiB/request**, whereas 160 resampled tokens take **20.0 MiB/request**, freeing **340 MiB/request** for concurrent batches.

<figure>
  <img src="illustrations/_generated/serving_cost_profile_dark.png" alt="Cache tiers across four request paths: encoder-feature reuse skips encoding; projected-token reuse skips projection; prefix-KV reuse skips shared prefill. Question prefill and decode always run." />
  <figcaption>Each cache tier skips upstream stages; prefix-KV reuse skips shared visual and document prefill while new-question prefill and decode still run.</figcaption>
</figure>

Keep reusable visual context *before* the changing user question so causal prefix-KV blocks stay identical across follow-up turns. Engines like vLLM hash prefix blocks using multimodal identities, LoRA IDs, and per-tenant cache salts;[^vllm2026prefix] always re-check access permissions externally before serving cache hits, and isolate vision-encoder workers from decoder pools. Note that <span data-glossary="mixture-of-experts">Mixture-of-Experts (MoE)</span> cuts active FFN FLOPs per token[^fedus2022] without reducing vision encoding, visual prefix length, or visual KV memory.

Finally, images can hide <span data-glossary="prompt-injection">prompt injections</span> inside rendered pixels that bypass text filters.[^owaspPromptInjectionPrevention2026] Treat pixels and OCR text strictly as untrusted data, validate decoded dimensions against decompression bombs, scope downstream tools to read-only access, and evaluate OCR exact match and region IoU separately from fluency (using explicit `np.isfinite` checks so `NaN` never silently passes `score < floor`).

```mastery-quiz
[
  {
    "question": "An L2-normalized image embedding is [0, 1]. Caption A is [0.6, 0.8] (norm 1) and caption B is [12, 5] (norm 13). Which caption wins under raw dot product vs cosine similarity, and what happens if SigLIP divides its total N x N pair loss by N^2 instead of N?",
    "options": [
      "Raw picks B, cosine picks A (0.8 vs 5/13); dividing SigLIP by N^2 shrinks loss and gradients by N.",
      "Raw picks A, cosine picks B (5/13 vs 0.8); dividing SigLIP by N^2 increases gradients by N.",
      "Both pick B; dividing SigLIP by N^2 leaves gradients unchanged.",
      "Raw picks B, cosine picks A (0.8 vs 5/13); dividing SigLIP by N^2 equals CLIP softmax."
    ],
    "answer": "Raw picks B, cosine picks A (0.8 vs 5/13); dividing SigLIP by N^2 shrinks loss and gradients by N.",
    "explanation": "Raw dots are A=0.8 and B=5.0 (picking B). L2-normalized cosines are A=0.8 and B=5/13 (~0.385, picking A). SigLIP divides the sum of N^2 pairs by N; dividing by N^2 scales loss and gradients down by 1/N."
  },
  {
    "question": "Three 280px square views use 14px patches (no CLS). A per-view Q-Former emits 24 queries per view. For a 10-frame clip (3 views/frame), what are the direct per-frame, reduced per-frame, and clip-wide reduced token counts?",
    "options": [
      "Direct 1,200; reduced 24; clip 24.",
      "Direct 1,200; reduced 72; clip 72.",
      "Direct 1,200; reduced 72; clip 720.",
      "Direct 400; reduced 72; clip 720."
    ],
    "answer": "Direct 1,200; reduced 72; clip 720.",
    "explanation": "Each view has (280/14)^2 = 400 patches, so 3 views give 1,200 direct patches. Three 24-query banks give 72 tokens/frame and 720 tokens over 10 frames."
  },
  {
    "question": "In Case A, a text query yields logit 0 with value 6, and an unmasked visual key/value (0, 0) joins the same self-attention softmax. In Case B, base text state 4 adds a separate cross-attention residual multiplied by tanh(0). What outputs follow?",
    "options": [
      "A: 6; B: 4.",
      "A: 3; B: 0.",
      "A: 6; B: 0.",
      "A: 3; B: 4."
    ],
    "answer": "A: 3; B: 4.",
    "explanation": "In A, two equal zero logits split softmax mass 0.5/0.5 between values 6 and 0, producing 3. In B, tanh(0)=0 zeroes only the separate residual, leaving base state 4 intact."
  },
  {
    "question": "During Stage 1 LLaVA alignment, both the vision encoder and LLM weights stay frozen while training only the MLP projector. Wrapping the LLM forward in torch.no_grad() produces zero projector gradients. Which fix preserves the freeze requirement?",
    "options": [
      "Enable activation backpropagation through the LLM while keeping LLM weight updates disabled (requires_grad=False).",
      "Disable activation backpropagation and enable LLM weight updates with lr=0.",
      "Disable both activation backpropagation and LLM weight updates.",
      "Enable both activation backpropagation and LLM weight updates, then discard LLM weights."
    ],
    "answer": "Enable activation backpropagation through the LLM while keeping LLM weight updates disabled (requires_grad=False).",
    "explanation": "Autograd needs the LLM activation graph to propagate caption-loss gradients backward into the projector while requires_grad=False keeps LLM weights frozen."
  },
  {
    "question": "A follow-up request hits cached projected visual tokens but misses decoder prefix KV, with an uncached question suffix. Which stages still execute?",
    "options": [
      "Encode: run; project: skip; shared prefill: run; question prefill: run; decode: run.",
      "Encode: skip; project: skip; shared prefill: run; question prefill: run; decode: run.",
      "Encode: skip; project: skip; shared prefill: skip; question prefill: run; decode: run.",
      "Encode: skip; project: run; shared prefill: skip; question prefill: run; decode: run."
    ],
    "answer": "Encode: skip; project: skip; shared prefill: run; question prefill: run; decode: run.",
    "explanation": "Projected-token cache skips encoding and projection; without cached prefix KV, both shared-prefix and question-suffix prefill run before decode."
  }
]
```

> **Next:** Continue to [Diffusion Models: Images & Text](/learn/image-generation-diffusion-models).
