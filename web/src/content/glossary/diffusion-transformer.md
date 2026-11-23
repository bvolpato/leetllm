---
title: Diffusion Transformer
aliases: ["DiT"]
importance: 77
---

A Diffusion Transformer (DiT) uses transformer blocks as the denoising network inside a diffusion or related generative process. It divides a noisy image latent into patches, embeds those patches as tokens, mixes information with attention and feed-forward layers, and predicts the update needed for the next sampling step. The transformer supplies the denoiser within a process that still uses a noise schedule, conditioning, and iterative generation.

## Patch tokens and conditioning

Suppose a latent has height $H$, width $W$, and patch size $p$. With evenly divisible dimensions, the transformer receives $(H / p)(W / p)$ image tokens. Smaller patches preserve more spatial detail but increase the token count and the cost of global attention. Timestep information and text or class conditioning are injected through architecture-specific mechanisms such as adaptive normalization, cross-attention, or joint multimodal token processing.

Multimodal variants can process image and text representations together while preserving distinct modality-specific projections. Calling every architecture with attention a DiT hides important differences in fusion strategy, token budget, and conditioning ownership.

## Example

A `64 x 64` latent split into `2 x 2` patches yields `32 * 32 = 1,024` image tokens. Changing the patch size to `1 x 1` yields 4,096 tokens instead. Full pairwise attention then compares roughly sixteen times as many token pairs, because the token count quadrupled and attention interactions grow quadratically. That tradeoff can dominate serving cost even when the requested output resolution never changes.

## Why it matters here

The image-generation and multimodal capstones connect model architecture to admission control, GPU memory, and latency. DiT explains why latent resolution, patch size, text conditioning, and attention implementation must appear in capacity estimates. It also prevents conflating U-Net-specific conditioning details with transformer-specific normalization and attention paths.

## Related terms

- [Transformer](glossary://transformer)
- [Self-attention](glossary://self-attention)
- [Diffusion scheduler](glossary://diffusion-scheduler)
- [Classifier-free guidance](glossary://classifier-free-guidance)
