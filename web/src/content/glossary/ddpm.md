---
title: DDPM
aliases: ["denoising diffusion probabilistic model", "denoising diffusion probabilistic models"]
importance: 80
---

A denoising diffusion probabilistic model (DDPM) learns to reverse a gradual noising process. During training, a clean example is corrupted according to a known noise schedule, and a neural network learns to predict the added noise or an equivalent denoising target. During generation, the process starts from random noise and repeatedly applies learned reverse transitions until an image-like or data-like sample emerges. DDPM names the probabilistic framework; implementations choose an architecture and inference schedule.

## Forward corruption and stochastic reverse steps

Let $x_0$ be clean data and $\bar{\alpha}_t$ the cumulative retained-signal fraction at timestep $t$. A standard training construction samples $\epsilon$ from a unit Gaussian and forms $x_t = \sqrt{\bar{\alpha}_t}x_0 + \sqrt{1-\bar{\alpha}_t}\epsilon$. The network receives $x_t$ and $t$, then learns a prediction associated with the clean sample or injected noise.

The reverse process can inject additional randomness at intermediate steps. To resume an exact sampling trajectory, save the current latent, timestep, scheduler state, and model and schedule configuration. A stochastic sampler also needs its random-generator state so resumed draws continue the same sequence; a deterministic sampler can resume from the saved latent and step when its other state is fixed.

## Example

Take a scalar clean value $x_0 = 2$, retained-signal fraction $\bar{\alpha}_t = 0.25$, and sampled noise $\epsilon = 1$. The corrupted value is $\sqrt{0.25}\cdot2 + \sqrt{0.75}\cdot1 \approx 1.866$. The denoiser learns to recover the injected noise or an equivalent target from that noisy value and timestep. A production sampler repeats such updates over many coordinates and timesteps rather than reconstructing a complete image in one neural-network call.

## Why it matters here

Diffusion-system design must distinguish training corruption, inference scheduling, checkpoint reproducibility, and the cost of iterative denoising. DDPM supplies the baseline against which faster implicit samplers, guidance, and diffusion transformers are compared. A retry policy that ignores intermediate randomness can produce a different asset while incorrectly claiming the original job was reproduced.

## Related terms

- [DDIM](glossary://ddim)
- [Diffusion scheduler](glossary://diffusion-scheduler)
- [Classifier-free guidance](glossary://classifier-free-guidance)
- [Diffusion Transformer](glossary://diffusion-transformer)
