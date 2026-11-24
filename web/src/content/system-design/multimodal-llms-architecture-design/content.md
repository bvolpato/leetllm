---
{
  "id": "multimodal-llms-architecture-design",
  "title": "Multimodal LLM Architecture",
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
  "shortDescription": "Design a multimodal LLM architecture that processes images, audio, video, and text while preserving visual detail, temporal alignment, and predictable KV-cache memory.",
  "keyConceptsTested": [
    "Modality-specific encoders",
    "Projection layers for cross-modal alignment",
    "Input-byte limits vs visual-token limits",
    "Latent multi-block connectors",
    "Q-Former and Perceiver-style token reduction",
    "Early fusion vs late fusion vs cross-attention",
    "Visual token budgeting and high-resolution tiling",
    "Visual Instruction Tuning",
    "Adapter-based vs jointly trained multimodal stacks",
    "Native multimodal vs bolt-on (Llama 4, GPT-4o, Qwen2.5-VL)",
    "Any-to-any multimodal models",
    "End-to-end multimodal training",
    "Post-training for grounding and abstention",
    "Mixture-of-Experts as a throughput optimization",
    "Modality gap",
    "KV cache pressure from projected visual prefixes",
    "PagedAttention for multimodal serving",
    "Flamingo architecture",
    "BLIP-2",
    "SigLIP"
  ],
  "prerequisites": [
    "vision-language-models-clip-beyond",
    "long-context-window-management",
    "kv-cache-paged-attention-llm-serving",
    "continuous-batching-request-scheduling",
    "lora-parameter-efficient-fine-tuning",
    "model-gateways-routing-fallbacks",
    "design-llm-powered-search-engine"
  ],
  "relatedQuestions": [
    "image-generation-diffusion-models",
    "design-real-time-voice-ai-agent",
    "computer-use-gui-browser-agents",
    "file-ingestion-pdfs-html-ocr-markdown",
    "vision-transformers-image-encoders",
    "prompt-injection-defense-strategies"
  ],
  "section": "System Design Capstones",
  "order": 7
}
---

A single dashboard screenshot, a 40-second audio clip, and a 2,000-token transcript arrive with one question: "Did p95 latency rise after the 14:02 release?" The chart shows a curve climbing near 14:03, while a speaker at 14:22 says, "That started before the change." Feed those three streams naively into a language model and two failures happen at once: five high-resolution image crops blow past a 4,096-token context window (consuming 360 MiB of KV cache per request), and downscaling the image to make it fit blurs the 14:02 axis label into an unreadable smear.

Pixels, waveforms, and text tokens live in completely different coordinate systems and arrive at wildly different rates. A language model can reason over visual or audio signals only after a modality encoder compresses them and a connector exposes them in a shape the decoder was trained to read. If preprocessing drops a tiny axis tick or mixes up speech time (14:22) with event time (14:02), no amount of decoder reasoning can recover the lost evidence.

The previous lesson introduced <span data-glossary="clip">CLIP</span> for global image-text similarity.[^radford2021] Here we build a full generative multimodal stack: sizing visual and audio token budgets, comparing early fusion, late fusion, and gated cross-attention, tracing two-stage vs end-to-end training, and optimizing multimodal KV-cache serving.

## Architecture overview: a multimodal analysis assistant

Our assistant ingests a screenshot, an optional audio clip or meeting transcript, and a user question, returning an answer backed by exact text spans or image bounding boxes, or explicitly returning `partial`, `abstained`, or `review` when supporting visual or temporal evidence is missing.

### Requirements and API

- `POST /v1/sessions` accepts immutable image, audio, and transcript references plus a session key and <span data-glossary="idempotency">idempotency</span> key. Tenant identity comes from server authentication, not the request body. Returns `session_id` and per-modality processing state.
- `POST /v1/sessions/{session_id}/questions` accepts `question` and a latency tier. Returns `answer`, `status` (`grounded`, `partial`, `abstained`, or `review`), supporting text spans or image crop boxes, and active encoder/connector/decoder versions.
- **Latency and throughput:** target 20 QPS and p95 latency below 3 seconds for one image plus an existing transcript; transcribe long audio or video asynchronously.
- **Isolation and safety:** isolate tenant data and caches, treat OCR and image-derived text as untrusted data rather than instructions, and abstain when cited regions or spans are missing.

### Data flow and sizing

Every request passes through three distinct stages: ingestion validates raw bytes, modality frontends turn pixels and waveforms into feature tensors, and the connector bridges those features into the decoder. Raw artifacts remain immutable while each derived feature stores its source hash, preprocessing revision, crop-to-original coordinates, and timestamp mapping (keeping utterance time separate from event time).

```mermaid
flowchart TB
  A["Session artifacts"]:::secondary --> B["Format + access checks"]:::warning
  C["Vision frontend"]:::primary
  D["Audio frontend"]:::primary
  E["Transcript"]:::accent
  F["Connector"]:::primary --> G["Decoder + citation check"]:::success
  B --> C
  B --> D
  B --> E
  C --> F
  D --> F
  E --> G
```

Before picking a GPU cluster, count tokens across the full request. Suppose one dashboard uses a global thumbnail plus four detail crops. A <span data-glossary="vision-transformer">Vision Transformer (ViT)</span> at 336px with 14px patches produces $24 \times 24 = 576$ patch tokens per view, or `5 x 576 = 2,880` visual tokens. A 32-query resampler per view compresses those five views to `5 x 32 = 160` visual tokens:

| Component | Direct projection | Reduced views |
|---|---:|---:|
| Five visual views | 2,880 | 160 |
| Existing transcript | 2,000 | 2,000 |
| System/template tokens | 100 | 100 |
| Question and delimiters | 100 | 100 |
| Reserved output | 300 | 300 |
| **Total** | **5,380** | **2,660** |

A 4,096-token route rejects the direct plan immediately (5,380 > 4,096). The reduced plan fits with 1,436 tokens to spare (even adding 400 compressed audio tokens reaches 3,060), though whether 32 queries per crop preserve small chart labels must be verified on OCR slices. At 20 <span data-glossary="qps">queries per second (QPS)</span>, separating encoder and decoder worker pools prevents slow high-resolution encodes from stalling active autoregressive decoding.

### Recovery, rollout, and evaluation

Each modality pipeline is idempotent (`pending`, `ready`, `failed`, or `quarantined`), so a failed image encode retries without redoing completed transcription. If a required modality is unavailable, return an explicit `partial` status (when allowed) or `abstained`, never letting text priors fabricate unseen chart numbers.

```mermaid
flowchart TB
  Q["Question"]:::secondary --> R{"Evidence ready?"}:::warning
  R -->|"all required"| G["Draft answer"]:::primary
  R -->|"allowed gap"| P["Partial, labeled"]:::accent
  R -->|"required missing"| A["Abstain"]:::danger
  P --> V
  G --> V{"Claim supported?"}:::warning
  V -->|"claim supported"| O["Return labeled answer"]:::success
  V -->|"missing or uncertain"| A
```

Upgrade one component (encoder, connector, or decoder) at a time using offline evaluation slices, shadow traffic, and a small canary, keeping previous versioned feature stores ready for quick revert. Track answer faithfulness, OCR exact match, region-citation IoU, transcript WER, abstention precision, prompt-injection resistance, p95 latency, and GPU memory.

#### Work the chronology before writing the diagnosis

In our opening scenario, suppose the release timestamp maps to $14{:}02 \pm 15\text{ s}$ while reading a coarse chart axis places the spike at $14{:}03 \pm 90\text{ s}$. Even though the midpoint $14{:}03$ looks later, the uncertainty intervals overlap, so strict temporal order is unresolved. The 14:22 spoken comment only tells us when the speaker talked, not when the spike began:

<!-- leetllm: test, output=show -->
```python title="multimodal-temporal-alignment.py"
import numpy as np

def temporal_order(event_a: np.ndarray, event_b: np.ndarray) -> str:
    """Compare two [t_start, t_end] intervals on a shared UTC clock."""
    if event_a[1] < event_b[0]:
        return "after"
    if event_b[1] < event_a[0]:
        return "before"
    return "unresolved"

deploy = np.array([120 - 15, 120 + 15], dtype=np.float32)
coarse_spike = np.array([180 - 90, 180 + 90], dtype=np.float32)
zoomed_spike = np.array([180 - 10, 180 + 10], dtype=np.float32)

print("coarse chart axis:", temporal_order(deploy, coarse_spike))
print("zoomed chart crop:", temporal_order(deploy, zoomed_spike))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
coarse chart axis: unresolved
zoomed chart crop: after
```
<!-- leetllm: output:end -->

Tightening visual perception with a zoomed axis crop narrows the interval from $\pm 90\text{ s}$ to $\pm 10\text{ s}$ and resolves chronological order, though proving causation still requires separate trace or log evidence.

## The concept: one shared evidence path

A multimodal LLM joins three components into one inference pipeline:

- **Text path:** converts transcripts and prompts into token <span data-glossary="embedding">embeddings</span> via a standard [tokenizer](/learn/tokenization-bpe-wordpiece-sentencepiece).
- **Modality encoders:** turn raw RGB pixel grids or audio spectrograms into dense spatial or temporal feature sequences.
- **Connector:** maps those features into decoder-compatible prefix <span data-glossary="token">tokens</span> or a <span data-glossary="cross-attention">cross-attention</span> memory bank.

> **Key insight:** A connector makes visual tensors dimensionally compatible with the language model, but alignment and grounding come from training and evaluation, not matrix shapes alone.

```checkpoint
Why can't a text LLM reason over pixels directly?
---
Raw pixel grids do not live in the language model's learned token embedding space. A modality encoder extracts dense visual features, and a trained connector exposes them as projected prefix tokens or cross-attention memory.
```

## Encoders, connector, decoder

<figure>
  <img src="illustrations/_generated/multimodal_llm_dark.png" alt="Multimodal architecture showing image, audio, and video signals compressed by encoders, then exposed to a language model either as prefix tokens or as side memory." />
  <figcaption>Screenshots, audio clips, and video frames pass through modality encoders before a connector inserts them into the text prefix or a side memory bank.</figcaption>
</figure>

### Adapter-based vs jointly trained stacks

Once the wiring is chosen, the next architectural choice is which parameters train together:

- **Adapter-based stacks** reuse a pretrained vision encoder and text LLM, training a lightweight connector first (and optionally fine-tuning the LLM later). BLIP-2[^li2023] and LLaVA[^liu2023a] popularized this recipe; PaLI similarly begins with frozen-ViT pretraining before unfreezing vision weights.[^chen2023]
- **Jointly trained stacks** optimize multiple modalities together across broader mixtures, as in Gemini,[^team2023] Llama 4 (<span data-glossary="early-fusion">early fusion</span> over text, image, and video with a MetaCLIP-based encoder aligned to Llama),[^meta2025llama4] GPT-4o (one end-to-end network across text, vision, and audio inputs and outputs),[^openai2024] and Qwen2.5-VL (dynamic-resolution ViT with a 2x2 spatial patch merger).[^bai2025qwen25vl]

Keep input and output directions separate in your design: our assistant consumes images/audio and outputs cited text, whereas generating images or speech requires dedicated output decoders (such as the diffusion or audio decoders covered in the next two lessons). Adapter stacks minimize training compute and risk; joint training unlocks tighter cross-modal adaptation at higher data and stability cost.

```checkpoint
When would you choose an adapter-based (bolt-on) stack over native joint training?
---
Choose an adapter stack when reusing strong pretrained encoders and LLMs with minimal training compute fits the task. Move to broader joint training when domain shift or fine-grained visual reasoning requires adapting encoder features directly.
```

### Modality-specific encoders

Different inputs produce features at completely different rates: five 336px image views emit 2,880 ViT patches, 40 seconds of audio at 100 Hz produces 4,000 spectrogram frames before temporal pooling, and a transcript adds 2,000 text tokens.

<figure>
  <img src="illustrations/_generated/modality_encoders_dark.png" alt="Multimodal frontends with different feature rates: five views produce 2,880 patch tokens, 40 seconds of audio compress from 4,000 steps to 400, and a transcript contributes 2,000 tokens; a connector then publishes 160 visual tokens plus the compressed audio and text as prefix tokens or side memory." />
  <figcaption>Each modality frontend operates at its own feature rate. Vision and audio pass through trained connectors, while transcripts enter through the standard text embedding table.</figcaption>
</figure>

Start from pretrained encoders that match the domain: **CLIP**[^radford2021] or **SigLIP**[^zhai2023] for images, **Whisper**[^radford2022] for speech, and **CLAP**[^elizalde2023] for non-speech environmental or alarm audio retrieval (not timestamped speech transcription). Freeze the encoder while aligning the connector first; unfreezing later is a controlled experiment balancing domain accuracy against forgetting.

```checkpoint
Why start from pre-trained modality encoders?
---
Pretrained encoders provide strong visual or acoustic features immediately, reducing moving parts during initial connector alignment before any domain-specific fine-tuning.
```

### Connectors and projection layers

The connector bridges the vision encoder's width $d_v$ to the LLM's hidden width $d_{\text{llm}}$, and simultaneously chooses whether to keep all $N$ spatial patches or compress them into $M \ll N$ learned query vectors:

| Method | Output visual tokens | Mechanism |
|---|---|---|
| Linear projector | $N$ (unchanged) | Single matrix $W \in \mathbb{R}^{d_v \times d_{\text{llm}}}$ per patch |
| 2-layer MLP (LLaVA-1.5) | $N$ (unchanged) | Nonlinear per-patch mapping preserving full grid |
| Q-Former (BLIP-2)[^li2023] | Fixed $M$ (e.g., 32) | Learned queries cross-attend over all $N$ patches |
| Perceiver Resampler (Flamingo)[^alayrac2022] | Fixed $M$ (e.g., 64) | Learned latent bank cross-attends over variable visual inputs |

Notice what Q-Former and Perceiver actually compute: they do not drop 544 patches and keep 32; every learned query attends across all 576 patches to aggregate information into a compact fixed-size tensor. Let's run both a linear projector and a Q-Former cross-attention block in NumPy to see the exact shapes and compression ratio:

<!-- leetllm: test, output=show -->
```python title="projection-token-budget.py"
import numpy as np

rng = np.random.default_rng(7)
N, d_v, d_llm, M = 576, 768, 2048, 32
patches = rng.standard_normal((N, d_v)).astype(np.float32)

# 1. Per-patch linear projection: preserves all 576 spatial positions
W_lin = rng.standard_normal((d_v, d_llm)).astype(np.float32) * 0.02
linear_out = patches @ W_lin

# 2. Q-Former / Perceiver cross-attention: 32 learned queries read all 576 patches
queries = rng.standard_normal((M, d_v)).astype(np.float32) * 0.02
scores = (queries @ patches.T) / np.sqrt(d_v)
weights = np.exp(scores - scores.max(axis=-1, keepdims=True))
weights /= weights.sum(axis=-1, keepdims=True)
qformer_out = (weights @ patches) @ W_lin

print(f"input patches:   {patches.shape}")
print(f"linear output:   {linear_out.shape}  (tokens kept: {linear_out.shape[0]})")
print(f"q-former output: {qformer_out.shape}   (compression: {N // M}x)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
input patches:   (576, 768)
linear output:   (576, 2048)  (tokens kept: 576)
q-former output: (32, 2048)   (compression: 18x)
```
<!-- leetllm: output:end -->

```checkpoint
What failure mode points to the projector rather than the LLM decoder?
---
Fluent text answers that miss or hallucinate visible details point to encoder resolution or connector compression discarding evidence before the decoder ever sees it.
```

```checkpoint
Why do Q-Former and Perceiver-style reducers matter for serving?
---
They cap downstream visual tokens at a fixed count regardless of input patch count, controlling prefill latency and KV-cache growth at the risk of compressing away tiny details.
```

### Connector depth is another design choice

Not every connector injects visual state at layer 0 of the LLM. **MPnP**, for example, taps multi-level features from intermediate vision-encoder blocks and injects projected key-value pairs directly into the final blocks of the decoder with trainable per-block weights.[^huang2025mpnp] Injecting near the output shortens the backpropagation path for lightweight adaptation, at the cost of giving fewer language blocks a chance to reason over visual evidence. Crucially, inserting visual keys and values into the *same* self-attention softmax behaves differently from Flamingo's separate residual cross-attention, as we will verify mathematically below.

| Decision | Trade-off to measure |
|---|---|
| Which encoder blocks to tap | Low-level edges and text vs high-level semantics |
| Which decoder blocks receive vision | Grounding depth vs adaptation compute and memory |
| Visual token count per block | Attention FLOPs vs small-label recall |
| Frozen vs unfrozen backbone | Adaptation speed vs task accuracy |

```checkpoint
What is the difference between tapping deeper vision features and injecting them into deeper language blocks?
---
Tapping encoder layers selects which level of visual abstraction the connector reads; selecting decoder layers determines where inside the LLM those representations become available. They are independent choices.
```

### The token count problem

Patch grids grow quadratically with image resolution. A 224x224 image with 14x14 patches yields $16 \times 16 = 256$ patch tokens (257 with a CLS token). Raising resolution to 336px, as in LLaVA-1.5, produces $24 \times 24 = 576$ tokens.[^liu2023b] More generally, for $V$ processed views of dimensions $H_i \times W_i$ padded to patch size $P$:

$$
N_{\text{patch}} = \sum_{i=1}^{V}
\left\lceil\frac{H_i}{P}\right\rceil
\left\lceil\frac{W_i}{P}\right\rceil
$$

Upload file size does not predict visual token count. A 12 MB JPEG and a 400 KB WebP decode to the exact same patch grid if they share post-resize dimensions, whereas a tiny compressed PNG screenshot tiled across four high-resolution crops can generate thousands of visual tokens. Always enforce two separate ingestion caps: an upload-byte limit (transport and decompression-bomb safety) and a post-preprocessing visual-token limit (GPU prefill and KV-cache memory).

<!-- leetllm: test, output=show -->
```python title="visual-token-scaling.py"
import numpy as np

def patch_tokens(size: int, patch: int, views: int = 1) -> int:
    grid = int(np.ceil(size / patch))
    return grid * grid * views

context_limit, text_and_output = 4096, 2500
cases = [
    ("image_224 (1 view)",   patch_tokens(224, 14, 1)),
    ("image_336 (1 view)",   patch_tokens(336, 14, 1)),
    ("image_672 (1 view)",   patch_tokens(672, 14, 1)),
    ("dashboard (5x 336px)", patch_tokens(336, 14, 5)),
    ("video_60s @ 2fps",     patch_tokens(224, 14, 120)),
]

for label, vis in cases:
    total = vis + text_and_output
    status = "fits 4K" if total <= context_limit else "exceeds 4K"
    print(f"{label:<22} visual={vis:6,d}  total={total:6,d}  [{status}]")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
image_224 (1 view)     visual=   256  total= 2,756  [fits 4K]
image_336 (1 view)     visual=   576  total= 3,076  [fits 4K]
image_672 (1 view)     visual= 2,304  total= 4,804  [exceeds 4K]
dashboard (5x 336px)   visual= 2,880  total= 5,380  [exceeds 4K]
video_60s @ 2fps       visual=30,720  total=33,220  [exceeds 4K]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/visual_token_scaling_dark.png" alt="A shared-scale bar chart compares 256, 1,024 and 2,304 patch tokens for 224px, 448px and 672px square stills with a 4,096-token reference limit and 30,720 tokens for 60 seconds of 224px video at 2fps." />
  <figcaption>A 60-second video at 2 fps emits 30,720 raw ViT-L/14 patches, 7.5 times a 4,096-token context window before adding any text.</figcaption>
</figure>

Three levers keep visual token counts manageable: spatial pooling or resampling (256 $\to$ 64), temporal frame selection and pooling (as studied in TimeSformer[^bertasius2021] and VideoMAE[^tong2022]), and dynamic tiling so only detailed regions receive high-resolution crops.

```checkpoint
A 224x224 image through ViT-L/14 produces how many patch tokens, and why does it matter?
---
224 / 14 = 16 patches per side, giving 16 x 16 = 256 patch tokens. In a direct projected-prefix architecture, every patch enters self-attention and occupies KV-cache memory just like a text token.
```

```checkpoint
Why can a 500 KB screenshot cost more model compute than a 10 MB photograph?
---
Compressed file bytes govern network transfer and decode work, whereas model compute depends on post-preprocessing pixel dimensions, crop count, patch size, and connector compression.
```

## Fusion strategies

<figure>
  <img src="illustrations/_generated/fusion_strategies_dark.png" alt="Comparison of early fusion, cross-attention, and late fusion, showing whether modalities meet before decoder, beside decoder through memory, or only after separate scoring." />
  <figcaption>Three ways modalities meet: inside one shared decoder prefix (early fusion), via side memory read by selected layers (cross-attention), or as pooled embeddings compared after independent encoders (late fusion).</figcaption>
</figure>

| Strategy | Where modalities meet | Best fit | Serving cost profile |
|---|---|---|---|
| **Early fusion** | One mixed prefix before layer 0 | Fine-grained chart QA when visual tokens are controlled | Shared self-attention $O((T_{\text{text}}+T_{\text{vis}})^2)$ and shared KV cache |
| **Cross-attention** | Selected decoder blocks read visual bank | Dense multi-image or video banks kept off the text prefix | Text self-attention plus $O(T_{\text{text}} T_{\text{vis}})$ per fusion block |
| **Late fusion** | Pooled vectors after separate towers | Fast image-text retrieval and ranking | One dot product; no generative decoder over patches |

```checkpoint
What question does a fusion strategy answer?
---
It decides where modalities interact: before the transformer in one unified token sequence, inside selected layers via cross-attention, or after separate encoders via pooled similarity.
```

### Early fusion (visual prefix or interleaving)

Projected visual tokens are concatenated directly into the decoder's input sequence, so standard self-attention mixes image and text from layer 0 onward (used in LLaVA and native multimodal models like Llama 4). Every visual token gains deep layer-by-layer interaction with text, but also inflates prefill FLOPs and KV-cache occupancy identically to text tokens:

<figure>
  <img src="illustrations/_generated/early_fusion_sequence_dark.png" alt="On a shared token scale, the direct plan totals 5,380 tokens and exceeds a 4,096-token context; the reduced plan totals 2,660 including 2,000 transcript, 200 system/question, and 300 output tokens." />
  <figcaption>Both routes pay the same 2,500 tokens for transcript, prompt framing, and output reserve; compressing five views from 2,880 to 160 visual tokens brings the prefix inside a 4,096-token window.</figcaption>
</figure>

```checkpoint
When is early fusion a good fit?
---
Use early fusion when generation requires deep token-level interaction across text and image patches and the visual prefix fits comfortably inside context and KV-cache budgets.
```

### Late fusion

Dual-encoder retrieval encodes image and text independently into compact pooled embeddings and scores them via cosine similarity. That makes million-image search fast because image vectors are precomputed offline, but a pooled vector cannot localize a chart spike or read an axis value without a downstream generative or OCR path.

<figure>
  <img src="illustrations/_generated/late_fusion_retrieval_dark.png" alt="Image and text towers pool each modality into one compact embedding, then a lightweight merge head scores or ranks results without exposing detailed visual evidence to a decoder." />
  <figcaption>Late fusion powers fast CLIP-style retrieval over pooled vectors, whereas grounded chart QA requires a decoder attending over detailed visual tokens.</figcaption>
</figure>

```checkpoint
Why is late fusion insufficient by itself for grounded generation?
---
Pooling collapses spatial tokens into a single vector before merging, leaving no decoder to attend over individual labels, regions, or multi-step visual reasoning.
```

### Cross-attention fusion (Flamingo-style)

Flamingo keeps resampled visual features outside the text prefix and inserts **gated cross-attention** blocks between frozen LLM layers.[^alayrac2022] Text hidden states act as queries $Q$ reading visual keys $K$ and values $V$:

$$
A = \operatorname{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V,
\qquad
h_{\text{out}} = h_{\text{text}} + \tanh(\alpha) \cdot A
$$

Initializing the scalar gate $\alpha = 0$ makes $\tanh(0) = 0$, so training starts from the exact behavior of the pretrained text LLM without initialization shock.

> **Key insight:** Inserting zero-initialized visual K/V pairs directly into the *same* self-attention softmax (as in shared-K/V injection like MPnP[^huang2025mpnp]) does **not** preserve the text-only output! Even an all-zero visual key produces logit `0`, stealing probability mass in the shared softmax denominator. Flamingo's separate residual gate multiplies *after* visual attention, leaving the text path completely intact at $\alpha = 0$.

Let's verify both the Flamingo $\tanh(\alpha)$ gate vs shared-softmax zero-K/V shift and the attention matrix size difference between early fusion and cross-attention in NumPy:

<!-- leetllm: test, output=show -->
```python title="gated-cross-attention.py"
import numpy as np

def attend(q: np.ndarray, k: np.ndarray, v: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    scores = (q @ k.T) / np.sqrt(q.shape[-1])
    w = np.exp(scores - scores.max(axis=-1, keepdims=True))
    w /= w.sum(axis=-1, keepdims=True)
    return w @ v, w

text_h = np.array([0.20, 0.10, 0.70])
vis_k = np.array([[0.20, 0.05, 0.75], [0.80, 0.10, 0.10], [0.05, 0.90, 0.05]])
vis_v = np.array([[0.10, 0.00, 0.90], [0.80, 0.10, 0.10], [0.10, 0.80, 0.10]])

attended, weights = attend(text_h, vis_k, vis_v)
for alpha in [0.0, 0.35]:
    fused = text_h + np.tanh(alpha) * attended
    print(f"Flamingo alpha={alpha:.2f} (tanh={np.tanh(alpha):.3f}) -> {np.round(fused, 3).tolist()}")

# Shared-softmax zero-K/V comparison: text value=2.0 vs inserting zero K/V
text_only, _ = attend(np.array([1.0]), np.array([[0.0]]), np.array([[2.0]]))
with_zero_kv, _ = attend(np.array([1.0]), np.array([[0.0], [0.0]]), np.array([[0.0], [2.0]]))
print(f"shared softmax: text_only={text_only[0]:.1f}, with_zero_kv={with_zero_kv[0]:.1f}")

# Dense attention score counts for T_text=2200, T_vis=160
T_text, T_vis = 2200, 160
print(f"early fusion scores: {(T_text + T_vis)**2:,} | cross-attn scores: {T_text * T_vis:,} (+ text self-attn)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Flamingo alpha=0.00 (tanh=0.000) -> [0.2, 0.1, 0.7]
Flamingo alpha=0.35 (tanh=0.336) -> [0.308, 0.191, 0.837]
shared softmax: text_only=2.0, with_zero_kv=1.0
early fusion scores: 5,569,600 | cross-attn scores: 352,000 (+ text self-attn)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/cross_attention_layers_dark.png" alt="Compressed visual memory stays outside the main text prefix while selected fusion blocks read it beside normal text layers before decode continues." />
  <figcaption>Cross-attention keeps visual memory off the main text prefix, letting selected fusion layers attend over visual features only where needed.</figcaption>
</figure>

```checkpoint
Why does gated cross-attention start with a near-zero gate?
---
At alpha = 0, tanh(alpha) = 0, so the model behaves identically to the pretrained text LLM at step 0 and gradually learns to blend visual residuals without destabilizing language weights.
```

## Training strategies

### Two-stage training (the 2023 LLaVA protocol)

LLaVA[^liu2023a] and LLaVA-1.5[^liu2023b] separate bridge learning from instruction following:

| Stage | Data | Vision encoder | Projector | LLM |
|---|---|---|---|---|
| **1. Feature alignment** | Filtered CC3M captions[^sharma2018] (595K in LLaVA; 558K in LLaVA-1.5) | Frozen | **Train** | Frozen |
| **2. Visual instruction tuning** | Multimodal QA & reasoning (158K GPT-4 pairs; 665K public mix in LLaVA-1.5) | Frozen | **Train** | **Train** (full FT or <span data-glossary="lora">LoRA</span>) |

In Stage 1, the frozen LLM predicts captions <span data-glossary="autoregressive-decoding">autoregressively</span> while gradients flow backward through its activations into the projector weights (keep activation backpropagation enabled even though LLM weight updates are disabled!). LLaVA-1.5 upgraded the connector to a 2-layer MLP and swapped in a 336px CLIP encoder, training end to end in roughly one day on a single 8-A100 node.[^liu2023b]

```checkpoint
Why does two-stage visual instruction tuning start with feature alignment?
---
Stage 1 aligns projected visual features with the frozen LLM's embedding space first, preventing random projector gradients from corrupting pretrained language weights when Stage 2 unfreezes the LLM.
```

### End-to-end training

Unfreezing the vision encoder, connector, and LLM jointly lets <span data-glossary="gradient">gradients</span> adapt visual features directly to fine-grained <span data-glossary="ocr">OCR</span> and chart layouts. The price is higher training compute and optimization risk: imbalanced multimodal batches or aggressive <span data-glossary="learning-rate">learning rates</span> can degrade pure-text reasoning, so monitor text-only benchmarks alongside multimodal slices throughout training.

```checkpoint
What is the main risk of end-to-end multimodal training?
---
Multimodal gradients can shift the LLM away from its pretrained text distribution, causing catastrophic forgetting unless data ratios, per-component learning rates, and pure-text evals are balanced carefully.
```

### Post-training for grounded behavior

Post-training with <span data-glossary="dpo">Direct Preference Optimization (DPO)</span>[^rafailov2023] or <span data-glossary="rlhf">RLHF</span> sharpens abstention, citation formatting, and safety behavior. It cannot recover pixels already erased by aggressive downscaling or compression: if the model hallucinates a chart number because the axis label was unreadable, fix perception (resolution, tiling, connector capacity) before running preference optimization.

```checkpoint
Why can't DPO or RLHF fix missing visual detail by itself?
---
Preference optimization adjusts output behavior over the signal already reaching the decoder; it cannot reconstruct text or chart marks lost in the vision encoder or connector.
```

## Serving the evidence path

### Efficient inference: token budget before parameter budget

In early-fusion VLMs, visual prefix tokens sit in the decoder's [KV cache](/learn/kv-cache-paged-attention-llm-serving) alongside text tokens; <span data-glossary="pagedattention">PagedAttention</span> packs those large irregular caches without fragmentation,[^kwon2023] but does not reduce token count.

When users ask follow-up questions about the same screenshot, caching eliminates redundant stages depending on where the cache hit lands:

<figure>
  <img src="illustrations/_generated/serving_cost_profile_dark.png" alt="Cache boundaries across four request paths: encoder-feature reuse skips encoding; projected-token reuse also skips projection; compatible prefix KV skips shared-prefix prefill. New-question prefill and answer decode remain in every path." />
  <figcaption>Each cache tier skips the stages upstream of it. Prefix-KV reuse skips shared image and transcript prefill, while the new question suffix and answer decode always run.</figcaption>
</figure>

Keep the reusable visual and transcript prefix *before* the changing user question so causal prefix-KV blocks stay identical across turns. Engines like vLLM hash prefix blocks using preceding hashes, token IDs, multimodal input identities, LoRA adapters, and per-tenant cache salts for isolation.[^vllm2026prefix] Always re-verify user access rights before serving a cache hit: matching content hashes confirm byte identity, never current permissions.

Let's calculate the exact per-request KV-cache footprint for a 32-layer GQA decoder (8 KV heads, head dimension 128, FP16/BF16 = 2 bytes per element) and compare the direct vs reduced plans:

<!-- leetllm: test, output=show -->
```python title="visual-kv-budget.py"
import numpy as np

layers, kv_heads, head_dim, dtype_bytes = 32, 8, 128, 2
bytes_per_token = 2 * layers * kv_heads * head_dim * dtype_bytes  # K and V

def kv_mib(tokens: int) -> float:
    return tokens * bytes_per_token / (1024 ** 2)

direct_vis, reduced_vis, full_reduced = 2880, 160, 2660
print(f"bytes per token:        {bytes_per_token:,} B ({bytes_per_token // 1024} KiB)")
print(f"direct visual KV:       {kv_mib(direct_vis):.1f} MiB")
print(f"reduced visual KV:      {kv_mib(reduced_vis):.1f} MiB (saves {kv_mib(direct_vis - reduced_vis):.1f} MiB/req)")
print(f"reduced full request:   {kv_mib(full_reduced):.1f} MiB")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
bytes per token:        131,072 B (128 KiB)
direct visual KV:       360.0 MiB
reduced visual KV:      20.0 MiB (saves 340.0 MiB/req)
reduced full request:   332.5 MiB
```
<!-- leetllm: output:end -->

Compressing five views from 2,880 tokens to 160 frees **340 MiB of KV-cache VRAM per active request**, letting a single GPU hold far larger concurrent batches.

```checkpoint
What should you cache for repeated questions about the same image?
---
Cache encoder features to skip the vision tower, projected tokens to skip projection as well, or compatible prefix KV blocks to skip shared-prefix prefill. The new question suffix and answer decode still run every turn.
```

### Where MoE helps, and where it doesn't

<span data-glossary="mixture-of-experts">Mixture-of-Experts (MoE)</span> activates only a sparse subset of feed-forward experts per token, lowering active FLOPs at high parameter counts (as in Llama 4).[^fedus2022][^meta2025llama4] However, MoE does not shrink the vision encoder pass, does not shorten the visual prefix, and does not reduce KV-cache memory. Control visual token count first; use MoE for model capacity and decode throughput.

```checkpoint
Why doesn't MoE solve visual token explosion?
---
Sparse experts cut active FFN FLOPs per token, but every visual prefix token still executes the vision encoder, attention prefill, and KV-cache allocation.
```

## Handling variable-length visual tokens

### Tiling and multi-crop encoding

High-resolution screenshots and dense charts lose small text when resized to 336x336. **Dynamic tiling** reserves one downscaled global thumbnail (preserving layout and relative positions) plus a capped number of high-resolution crops over dense regions (axis labels, legends, warning badges), storing each crop's original pixel coordinates. Qwen2.5-VL extends this with a native dynamic-resolution ViT and a 2x2 spatial patch merger, plus temporal position encoding aligned to elapsed video time.[^bai2025qwen25vl]

<figure>
  <img src="illustrations/_generated/dynamic_tiling_dark.png" alt="A schematic dashboard highlights a bottom axis and upper-right badge. The selected output retains one global view and separate axis and badge crops, with their original coordinate mapping." />
  <figcaption>Dynamic tiling keeps one global thumbnail for scene layout and spends the remaining crop budget on high-value local regions with preserved coordinate mappings.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="crop-budget-selector.py"
import numpy as np

def select_crops(candidates: list[tuple[str, float]], max_crops: int) -> list[str]:
    local = [(name, score) for name, score in candidates if name != "global_thumbnail"]
    names = np.array([name for name, _ in local])
    scores = np.array([score for _, score in local], dtype=np.float32)
    top_names = names[np.argsort(-scores)[: max_crops - 1]].tolist()
    return ["global_thumbnail", *top_names]

regions = [
    ("global_thumbnail", 0.01),
    ("latency_axis", 0.96),
    ("paging_badge", 0.85),
    ("blank_margin", 0.02),
]

selected = select_crops(regions, max_crops=3)
print("selected_regions:", selected)
print("visual_tokens_before_reduction:", len(selected) * 576)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
selected_regions: ['global_thumbnail', 'latency_axis', 'paging_badge']
visual_tokens_before_reduction: 1728
```
<!-- leetllm: output:end -->

> **Common mistake:** Letting the global thumbnail compete on local saliency score drops overall layout context; conversely, if a hard crop cap excludes a legend needed to answer the question, route to a slower multi-pass reader or abstain instead of guessing.

```checkpoint
When is tiling worth the extra tokens?
---
Use tiling when fine text, chart axes, tables, or small UI badges are essential and downscaling to a single square view would blur them away.
```

### Queried reduction (Perceiver / Q-Former)

When input resolution or frame count varies unpredictably, a learned query bank (Q-Former in BLIP-2,[^li2023] Perceiver Resampler in Flamingo[^alayrac2022]) maps variable-length encoder outputs into a fixed downstream token count. Keep one subtlety in mind: applying 24 queries *per view* or *per video frame* still grows linearly with view or frame count (10 frames $\times$ 3 views $\times$ 24 = 720 tokens). A clip-wide cap requires a clip-level resampler or frame sampling limit.

```checkpoint
What tradeoff does queried reduction make?
---
It converts variable visual inputs into a fixed downstream token budget for predictable latency and memory, trading away fine spatial fidelity if the query bank is too small.
```

## Audio integration

Speech-heavy queries often work best with an asynchronous timestamped transcript (e.g., from Whisper's log-Mel spectrogram frontend[^radford2022]). Pass raw audio embeddings directly into the connector when tone, overlapping voices, or non-speech alarms matter (where encoders like CLAP[^elizalde2023] also help retrieve environmental sounds). Because raw audio frontends emit ~100 frames per second, strided convolutions or temporal pooling are essential before fusion:

<figure>
  <img src="illustrations/_generated/audio_pipeline_dark.png" alt="A 40-second incident-bridge clip enters an audio encoder at 4,000 time steps, compresses to 400 tokens after stride 10, then reaches the language path as prefix tokens or side memory." />
  <figcaption>A 40-second clip at 100 Hz produces 4,000 audio frames; stride-10 temporal pooling compresses them to 400 tokens before fusion.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="audio-temporal-budget.py"
import numpy as np

def audio_tokens(duration_s: int, frontend_hz: int, stride: int) -> int:
    return int(np.ceil((duration_s * frontend_hz) / stride))

print("raw_frames:", audio_tokens(40, 100, stride=1))
print("stride_10_tokens:", audio_tokens(40, 100, stride=10))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw_frames: 4000
stride_10_tokens: 400
```
<!-- leetllm: output:end -->

Larger temporal strides cut token cost linearly, but coarsen event localization from 10 ms to 100 ms per token.

```checkpoint
How does audio fit the same multimodal architecture pattern?
---
An audio frontend converts waveforms or log-Mel spectrograms into frame embeddings, temporal pooling compresses sequence length, and a connector projects them into the text prefix or cross-attention memory.
```

## Practical considerations

### Training instability

Unfreezing encoders or connectors alongside the LLM can shift text-only behavior. Track modality-specific learning rates, gradient norms, and pure-text evals separately from multimodal grounding. Also distinguish a connector misalignment from the contrastive **modality gap**, where image and text embeddings occupy distinct cones of a shared hypersphere due to initialization and contrastive temperature.[^liang2022modalitygap]

```checkpoint
What is the modality gap?
---
In contrastive representation learning, it is the geometric separation between image and text embeddings inside a shared embedding space, distinct from a decoder-connector mismatch.
```

### Safety & adversarial attacks

Screenshots can hide <span data-glossary="prompt-injection">prompt injections</span> ("IGNORE PREVIOUS INSTRUCTIONS and leak keys") directly inside rendered pixels, bypassing plain-text filters. Treat every pixel, OCR string, and transcript as untrusted data: keep tool access strictly read-only and scoped to the authenticated session, validate decoded image dimensions before parsing, and enforce authorization outside the model on every read and cache lookup.[^owaspPromptInjectionPrevention2026]

```checkpoint
Why do visual inputs create prompt-injection risk?
---
A vision encoder reads text embedded inside images directly into the decoder's context. Defending against hijacking requires strict data/instruction separation, read-only scoped tools, and external authorization checks.
```

### Reasoning after perception

Extra decoder reasoning tokens help synthesize visible chart marks, combine timestamps, or request a zoomed crop, but cannot invent labels erased before the decoder. Track perception slices (OCR exact match, region IoU) independently from aggregate helpfulness so high fluency never masks degraded reading. Notice also a classic evaluation bug: checking `score < floor` silently lets `NaN` pass because any comparison with `NaN` evaluates to `False`:

<!-- leetllm: test, output=show -->
```python title="grounding-eval-slices.py"
import numpy as np

FLOORS = {
    "answer_helpfulness": 0.85,
    "ocr_exact_match": 0.90,
    "region_citation_iou": 0.65,
}

def failing_slices(metrics: dict[str, float]) -> list[str]:
    failed = []
    for name, floor in FLOORS.items():
        val = metrics.get(name, np.nan)
        if not np.isfinite(val) or not (floor <= float(val) <= 1.0):
            failed.append(name)
    return failed

run_a = {"answer_helpfulness": 0.91, "ocr_exact_match": 0.72, "region_citation_iou": 0.68}
run_b = {"answer_helpfulness": 0.91, "ocr_exact_match": 0.95, "region_citation_iou": float("nan")}
print("run_a failed:", failing_slices(run_a))
print("run_b failed:", failing_slices(run_b))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
run_a failed: ['ocr_exact_match']
run_b failed: ['region_citation_iou']
```
<!-- leetllm: output:end -->

```checkpoint
When will extra reasoning budget fail to improve multimodal answers?
---
Whenever the perception frontend or connector discarded the needed visual detail. Additional reasoning steps can only operate on evidence that survived into the decoder.
```

## Common pitfalls

#### "Multimodal design is mostly token concatenation"
Matching tensor dimensions gets visual tokens into the forward pass, but reliable grounding requires preserving resolution, aligning the connector, and evaluating region/OCR slices.

#### "Hallucinated detail means the LLM needs more tuning"
Compare answers from raw pixels against answers from verified OCR text. If the text version succeeds, fix image resolution, tiling, or connector compression before tuning the decoder.

#### "Late fusion is fine for grounded generation"
A pooled similarity score retrieves matching screenshots but lacks token-level spatial detail for citing chart axes or values.

#### "Token budget only matters for text"
Five 336px crops add 2,880 tokens and 360 MiB of KV cache on a 32-layer GQA decoder. Always budget visual tokens, text, template framing, and output reserve together.

#### "Preference tuning can recover missing perception"
DPO can improve abstention when evidence is blurry, but cannot reconstruct text erased by downscaling.

#### "MoE solves high-resolution multimodal cost by itself"
MoE lowers active FFN FLOPs per token while leaving vision encoder latency, attention prefill, and visual KV-cache memory untouched.

## Evaluation rubric

A complete multimodal architecture review covers:

- **Temporal and spatial fidelity:** preserve crop-to-original coordinates, audio timestamps, and the distinction between utterance time and event time.
- **Full token and KV math:** account for the 5,380-token direct vs 2,660-token reduced breakdown and the 360 MiB vs 20 MiB visual KV footprint.
- **Connector and fusion trade-offs:** compare per-patch projection, queried reduction, early fusion, late fusion, and gated cross-attention (including why shared-softmax zero-K/V differs from a zero $\tanh$ residual).
- **Cache reuse:** map which stages encoder, projector, and prefix-KV caches skip, why a new question still runs prefill, and how tenant permissions are rechecked.
- **Slice verification:** test OCR exact match, region IoU, semantic support, abstention, and `NaN`/missing-metric handling separately.

## Follow-up questions

### What changes when a continuous video feed replaces the screenshot?

Set a fixed observation window and frame-sampling rate, preserving frame timestamps. Because per-frame query banks still scale linearly with frame count, add a clip-level temporal resampler or clip retrieval stage instead of dropping visual KV entries arbitrarily from a full-attention decoder.

### What if an 8K dashboard exceeds memory but its tiny labels are essential?

Encode one downscaled global thumbnail plus a capped set of native-resolution crops over labels and chart axes. Sequential encoding reduces frontend peak memory, while capping downstream crops protects decoder KV memory; if essential regions exceed the cap, route to a multi-pass extractor or abstain.

### Can a 14:22 transcript sentence support a claim about a 14:02 event?

Yes, if its wording unambiguously refers to the 14:02 event and its time interval resolves cleanly on a shared clock. Utterance time alone never proves event time, and chronological order alone never proves causation.

### What happens to cached evidence when an operator loses access to the case?

The very next request must deny access even if feature or prefix-KV entries remain in cache. Enforce tenant and case permissions outside the model on every request before reading cached intermediates.

### How would you distinguish a connector regression from a decoder regression?

Hold the input image, preprocessing, and encoder outputs fixed, then swap the connector and decoder checkpoints one at a time while running both perception probes (OCR exact match, box IoU) and claim-support evaluations.

```mastery-quiz
[
  {
    "question": "A direct per-feature projector receives A: one 280px square view from an 8 MB file, and B: two 224px square views from a 200 KB file. All views are already divisible into 14px patches and no CLS state is retained. Which visual sequence counts follow?",
    "options": [
      "A: 400; B: 512.",
      "A: 400; B: 256.",
      "A: 1600; B: 512.",
      "A: 800; B: 512."
    ],
    "answer": "A: 400; B: 512.",
    "explanation": "A has (280/14)² = 400 patches. B has 2 × (224/14)² = 512. Per-feature projection changes width, not count; compressed bytes do not determine this sequence."
  },
  {
    "question": "Resolved event identities share one UTC clock. Deploy bounds are [300,330] seconds and chart bounds are initially [325,350]. A separately verified extraction changes only the chart bounds to [331,340]. Which strict-order results follow before and after the change?",
    "options": [
      "Initial: order is after; revised: order is after.",
      "Initial: order is unresolved; revised: order is unresolved.",
      "Initial: order is unresolved; revised: order is after.",
      "Initial: order is before; revised: order is after."
    ],
    "answer": "Initial: order is unresolved; revised: order is after.",
    "explanation": "The first intervals overlap. In the second case, latest deploy 330 is strictly below earliest chart 331, confirming after. Neither result by itself identifies causation."
  },
  {
    "question": "A supported follow-up path hits compatible projected visual tokens but has no compatible decoder KV. Its new question suffix is uncached. Which work remains for the answer?",
    "options": [
      "Encode: run; project: skip; shared prefill: run; question prefill: run; decode: run.",
      "Encode: skip; project: skip; shared prefill: run; question prefill: run; decode: run.",
      "Encode: skip; project: skip; shared prefill: skip; question prefill: run; decode: run.",
      "Encode: skip; project: run; shared prefill: skip; question prefill: run; decode: run."
    ],
    "answer": "Encode: skip; project: skip; shared prefill: run; question prefill: run; decode: run.",
    "explanation": "Projected tokens represent completed encoding and projection. Decoder KV was not reused, so both shared-prefix and new-question prefill still execute, followed by decode."
  },
  {
    "question": "An alignment run freezes the image encoder and language-model weights, training a projector through caption loss. An engineer wraps the entire language-model forward in a no-gradient context, then observes no projector gradient. Which activation-backpropagation and decoder-weight-update settings repair bridge learning while preserving the stated freeze requirement?",
    "options": [
      "Activation backpropagation: enabled; decoder weight updates: enabled.",
      "Activation backpropagation: disabled; decoder weight updates: disabled.",
      "Activation backpropagation: disabled; decoder weight updates: enabled.",
      "Activation backpropagation: enabled; decoder weight updates: disabled."
    ],
    "answer": "Activation backpropagation: enabled; decoder weight updates: disabled.",
    "explanation": "A frozen decoder can still propagate activation gradients into a trainable input bridge. Disabling the entire computation graph blocks gradients from reaching the projector."
  },
  {
    "question": "Three 280px square views use 14px patches without CLS. A configured query bridge emits 24 states independently per view. With ten such three-view frames processed, what are the per-frame direct and reduced counts, and the clip’s reduced count?",
    "options": [
      "Direct 1200; reduced 24; clip 24.",
      "Direct 1200; reduced 72; clip 72.",
      "Direct 1200; reduced 72; clip 720.",
      "Direct 400; reduced 72; clip 720."
    ],
    "answer": "Direct 1200; reduced 72; clip 720.",
    "explanation": "Each view has 400 patches, so three have 1200. Three separate 24-query banks emit 72 states; ten frames emit 720. A per-view or per-frame bottleneck does not cap clip length."
  },
  {
    "question": "In worksheet A, one text score is 0 with value 6; an unmasked visual key/value both zero is inserted into that same softmax. In worksheet B, base state 4 receives a separately computed visual residual through a zero tanh gate. What outputs follow?",
    "options": [
      "A: 6; B: 4.",
      "A: 3; B: 0.",
      "A: 6; B: 0.",
      "A: 3; B: 4."
    ],
    "answer": "A: 3; B: 4.",
    "explanation": "A has two equal zero logits, so each has weight one half and the weighted read is 3. B adds zero times its separate residual to base 4. Shared normalization and a separate residual gate are different operations."
  },
  {
    "question": "A decoder has 1120 text states and a separate bank of 80 visual states. In a dense score-shape model for one fusion head, what does its cross-attention contribute alongside the text backbone?",
    "options": [
      "89,600 cross scores, in addition to text self-attention.",
      "1,254,400 cross scores, replacing text self-attention.",
      "89,600 cross scores, replacing text self-attention.",
      "1,440,000 cross scores, in addition to text self-attention."
    ],
    "answer": "89,600 cross scores, in addition to text self-attention.",
    "explanation": "Cross scores use T × V = 1120 × 80 = 89,600. Text self-attention remains; T² and (T+V)² describe different dense shapes."
  },
  {
    "question": "A release check verifies helpfulness, OCR exact match and region IoU against minimum scores of 0.82, 0.94 and 0.73, respectively. Each score must be a finite number in [0, 1]. In that order, the first run reports (0.86, 0.96, NaN) and the rerun reports (0.86, 0.91, 0.77). Which metric, if any, blocks each run?",
    "options": [
      "None, then OCR.",
      "Region IoU, then none.",
      "Region IoU, then OCR.",
      "None, then none."
    ],
    "answer": "Region IoU, then OCR.",
    "explanation": "On the first run, helpfulness and OCR pass while Region IoU reports NaN. Checking only whether NaN is below 0.73 misses this blocker because comparisons with NaN return false. On the rerun, OCR falls to 0.91, below its 0.94 floor."
  },
  {
    "question": "A verified plot shows that the backlog on the dashed line doubled between noon and 1 p.m. An operator asks which queue that line represents. The queue names appear only in the legend, which is unreadable in the global thumbnail. Each local crop shows just its named region. A two-view rule reserves the thumbnail and ranks local crops by descending score. The thumbnail scores 0.00, the time axis 0.90, the legend 0.80 and the badge 0.70. A slower authorized route can read the original legend. Which views does the rule select, and when can the assistant name the queue?",
    "options": [
      "Thumbnail and time axis. Name the queue from those views.",
      "Time axis and legend. Name the queue from those views.",
      "Thumbnail and badge. Read the original legend before naming the queue.",
      "Thumbnail and time axis. Read the original legend before naming the queue."
    ],
    "answer": "Thumbnail and time axis. Read the original legend before naming the queue.",
    "explanation": "The reserved thumbnail takes one slot and the time axis wins the other at 0.90. Naming the queue from the thumbnail and axis would be a guess; the slower route must read the legend first."
  },
  {
    "question": "Trace A cites an authorized, in-range chart region whose metric differs from its answer claim. Trace B requests a correct cached region after the operator’s case access was revoked. Which paired check outcomes follow?",
    "options": [
      "A: support rejected; B: access denied.",
      "A: support accepted; B: access denied.",
      "A: support rejected; B: access allowed.",
      "A: support accepted; B: access allowed."
    ],
    "answer": "A: support rejected; B: access denied.",
    "explanation": "Valid coordinates and access rights do not make a mismatched chart metric support A. B fails authorization on this read even when cached bytes are identical. Semantic support and access control are independent checks."
  }
]
```

> **Next:** Continue to [Diffusion Models: Images & Text](/learn/image-generation-diffusion-models). The model consumes screenshots and audio and has to decide what to cite. Generating an image reverses that direction. Diffusion starts from noise and cleans toward a prompt, which is a different stack than the encoder-connector-decoder path here.
