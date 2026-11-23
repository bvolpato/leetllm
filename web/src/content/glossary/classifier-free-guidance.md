---
title: Classifier-free guidance
aliases: ["CFG"]
importance: 81
---

Classifier-free guidance (CFG) strengthens conditioning during diffusion-model sampling by combining an unconditional prediction with a condition-aware prediction from the same denoiser. For text-to-image generation, the condition is typically a prompt embedding. The model estimates how the noisy sample should change with and without that prompt, then amplifies their difference. No separate image classifier is required, which distinguishes this method from classifier guidance.

Training usually drops the condition on some examples so the same model learns both predictions. In a text-to-image pipeline, the reference branch can instead receive a negative prompt; it is then negative-conditioned rather than truly unconditional. [Original CFG paper](https://arxiv.org/abs/2207.12598), [Diffusers pipeline documentation](https://huggingface.co/docs/diffusers/api/pipelines/stable_diffusion/text2img)

## Guidance arithmetic and evaluation cost

For unconditional noise prediction $\epsilon_u$, conditional prediction $\epsilon_c$, and guidance scale $w$, a common implementation uses $\epsilon_g = \epsilon_u + w(\epsilon_c - \epsilon_u)$. At $w = 1$, the result is the conditional prediction. Larger values push harder toward prompt-consistent features but can reduce diversity, exaggerate colors, or introduce artifacts. Exact parameter conventions vary between libraries, so inspect the scheduler and pipeline before interpreting a numeric setting.

Conventional CFG evaluates both branches, often by batching them together. Batching can improve utilization but does not turn two denoiser evaluations into one. Distilled or specialized guidance methods may change that accounting and must be measured separately.

## Example

If one latent coordinate receives $\epsilon_u = 0.20$ and $\epsilon_c = 0.50$, guidance scale $w = 3$ produces $0.20 + 3(0.50 - 0.20) = 1.10$. This extrapolates the noise prediction beyond the conditional value; the scheduler converts it into a sample update. A larger predicted value is not itself a quality score. A 20-step sampler making one ordinary two-branch CFG call per step performs 40 branch evaluations, even when each pair is packed into a single batched model call. A solver that evaluates the denoiser more than once per nominal step changes that total.

## Why it matters here

Diffusion serving capacity depends on denoiser evaluations rather than HTTP request count alone. Guidance changes both image quality and GPU demand, so the image-generation capstone must record guidance scale, sampler, step count, prompt, seed, and model version. Otherwise a quality comparison or throughput estimate can confuse stronger conditioning with a different compute budget.

## Related terms

- [Diffusion scheduler](glossary://diffusion-scheduler)
- [DDPM](glossary://ddpm)
- [DDIM](glossary://ddim)
- [Inference scheduler](glossary://inference-scheduler)
