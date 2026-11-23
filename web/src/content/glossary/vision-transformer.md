---
title: Vision Transformer
aliases: ["ViT"]
importance: 84
---
A **Vision Transformer (ViT)** turns an image into a sequence of fixed-size patches, projects each patch into a learned vector, adds position information, and processes the sequence with transformer attention. The encoder doesn't receive pixels as an unordered bag: the patch position tells it where each region came from. Dosovitskiy and colleagues introduced the architecture in [An Image is Worth 16x16 Words](https://arxiv.org/abs/2010.11929).

## Patch arithmetic

For an image of height $H$, width $W$, and square patch size $P$, the patch count is $N=(H/P)(W/P)$ when both dimensions divide evenly. Each RGB patch contains $3P^2$ numbers, which a learned projection maps to the model's hidden width $d$. A classification token adds one position when the architecture uses it.

A $224\times224$ image with $16\times16$ patches produces $14\times14=196$ patches. Cutting the patch size to $8$ increases that count to $784$. Dense attention compares roughly $16$ times as many token pairs, the square of the fourfold patch increase.

## Example

A screenshot classifier receives a build-log image containing a red failure banner. It embeds every image patch, adds position vectors, and allows attention to connect the banner with the nearby failing test name. A vision-language model can pass these image features through a bridge into its text model. In a concatenative architecture, each retained image token consumes part of the shared context budget; cross-attention can instead use separate visual memory.

Small text or tiny interface controls may disappear when patches are too large. Diagnose that failure with labeled image regions and patch-size ablations before assuming the language model misunderstood the screenshot.

## Why it matters here

ViTs explain how the same attention mechanism studied for text becomes the image encoder behind screenshot understanding, multimodal retrieval, and vision-language assistants. Patch count links image resolution directly to memory, latency, and context consumption.

## Related terms

- [Transformer](glossary://transformer)
- [Self-attention](glossary://self-attention)
- [Embedding](glossary://embedding)
- [Vision-language model](glossary://vision-language-model)
