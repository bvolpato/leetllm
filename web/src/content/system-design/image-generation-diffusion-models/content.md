---
{
  "id": "image-generation-diffusion-models",
  "title": "Diffusion Models: Images & Text",
  "slug": "image-generation-diffusion-models",
  "category": "Multimodal Models",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/diffusion_pipeline_dark.png",
  "companies": [
    "Google",
    "OpenAI",
    "Stability AI",
    "Meta",
    "Midjourney"
  ],
  "shortDescription": "How diffusion models turn pure Gaussian static into coherent images and text: forward schedules, reverse DDPM/DDIM solvers, score and flow matching, U-Net vs. DiT, CFG, and latent diffusion.",
  "keyConceptsTested": [
    "Forward diffusion and closed-form Gaussian noising",
    "Signal-to-noise ratio (SNR) and cosine vs. linear schedules",
    "Tractable reverse posterior q(x_{t-1} | x_t, x_0) and DDPM training",
    "Prediction targets: epsilon, x_0, and velocity v",
    "Score matching, flow matching, and Rectified Flow",
    "U-Net vs. Diffusion Transformer (DiT / MM-DiT) backbones",
    "Timestep conditioning via FiLM/AdaGN and AdaLN-Zero",
    "Classifier-free guidance (CFG) and guidance distillation",
    "DDIM deterministic sampling, ODE solvers, and inversion",
    "Latent diffusion (VAE compression) and cross-attention conditioning",
    "Discrete text diffusion and iterative parallel refinement",
    "ControlNet spatial conditioning and LoRA adapters"
  ],
  "prerequisites": [
    "multimodal-llms-architecture-design",
    "autoencoders-vaes-generative-modeling-basics",
    "scaled-dot-product-attention",
    "positional-encoding-rope-alibi"
  ],
  "relatedQuestions": [
    "design-real-time-voice-ai-agent",
    "computer-use-gui-browser-agents",
    "vision-transformers-image-encoders",
    "mixed-precision-training-loss-scaling",
    "model-quantization-gptq-awq-gguf",
    "prompt-injection-defense-strategies"
  ],
  "section": "Transformer & Multimodal Architectures",
  "order": 8
}
---

How does a neural network conjure a sharp 512x512 photograph of an oak dining table in morning light from 786,432 independent draws of Gaussian static? Mapping unstructured noise directly to coherent pixels in one forward pass forces a single network to solve composition, lighting, perspective, and fine texture simultaneously.

Diffusion models break that leap into gentle denoising steps. A forward process gradually buries real data in Gaussian noise until only static remains; a learned denoiser then predicts small reverse updates while a numerical solver marches from noise back to structure. Compressing pixels into a 64x smaller spatial latent space shrinks self-attention work by 4,096x, while straight-line flow matching and deterministic ODE solvers collapse 1,000 reverse passes down to 4 to 25 steps. The same iterative refinement idea extends to discrete text canvases, where a bidirectional transformer fills and revises masked tokens in parallel.[^google2026diffusiongemma]

<figure>
  <img src="illustrations/_generated/diffusion_pipeline_dark.png" alt="Latent diffusion pipeline: seeded Gaussian noise initializes a latent tensor, a denoiser iterates with timestep and text embeddings under CFG, and a VAE decoder renders RGB pixels." />
  <figcaption>Latent diffusion inference pipeline. Text embeddings steer iterative denoiser passes over compact latents before the VAE decoder renders RGB pixels.</figcaption>
</figure>

## One pixel under a forward noise schedule

Track a single normalized brightness value $x_0 = 1.0$ mixed with one Gaussian draw $\epsilon = -0.4$. Under a variance-preserving schedule with cumulative signal retention $\bar{\alpha}_t \in (0, 1)$, the noisy state is:

$$
x_t = \sqrt{\bar{\alpha}_t} \, x_0 + \sqrt{1 - \bar{\alpha}_t} \, \epsilon
$$

Why square roots? If $x_0$ and $\epsilon$ are independent with unit variance, then $\operatorname{Var}(x_t) = (\sqrt{\bar{\alpha}_t})^2 + (\sqrt{1-\bar{\alpha}_t})^2 = 1$. Linear blending $\bar{\alpha}_t x_0 + (1-\bar{\alpha}_t)\epsilon$ would shrink variance mid-schedule; square-root weights keep activation scale constant across all timesteps.

| $\bar{\alpha}_t$ | Signal $\sqrt{\bar{\alpha}_t}\,x_0$ | Noise $\sqrt{1-\bar{\alpha}_t}\,\epsilon$ | Noisy state $x_t$ | $\mathrm{SNR} = \bar{\alpha}_t/(1-\bar{\alpha}_t)$ |
|---:|---:|---:|---:|---:|
| 0.900 | 0.949 | -0.126 | 0.822 | 9.000 |
| 0.500 | 0.707 | -0.283 | 0.424 | 1.000 |
| 0.001 | 0.032 | -0.400 | -0.368 | 0.001 |

At $\bar{\alpha}_t = 0.5$, the signal keeps $\sqrt{0.5} \approx 70.7\%$ of its amplitude because variance scales with amplitude squared, placing signal and noise at equal variance ($\mathrm{SNR} = 1.0$). The same formula corrupts a full tensor in one vectorized op:

<!-- leetllm: test, output=show -->
```python title="adding-noise-gradually.py"
import numpy as np

def forward_diffuse(x0: np.ndarray, alpha_bar: float, eps: np.ndarray) -> tuple[np.ndarray, float]:
    xt = np.sqrt(alpha_bar) * x0 + np.sqrt(1.0 - alpha_bar) * eps
    return xt, alpha_bar / (1.0 - alpha_bar)

x0 = np.array([1.0, 0.8, -0.5])
eps = np.array([-0.4, 0.2, 0.1])

for ab in [0.9, 0.5, 0.001]:
    xt, snr = forward_diffuse(x0, ab, eps)
    print(f"alpha_bar={ab:<5}  xt={np.round(xt, 3).tolist()}  SNR={snr:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
alpha_bar=0.9    xt=[0.822, 0.822, -0.443]  SNR=9.000
alpha_bar=0.5    xt=[0.424, 0.707, -0.283]  SNR=1.000
alpha_bar=0.001  xt=[-0.368, 0.225, 0.084]  SNR=0.001
```
<!-- leetllm: output:end -->

By $\bar{\alpha}_t = 0.001$, the first coordinate swings from $+1.0$ to $-0.368$, nearly pure static. Generation simply runs this corruption backward.[^ho2020]

## Why iterative denoising displaced one-shot generators

GANs attempt one-shot generation through an adversarial minimax game, yielding single-pass speed at the cost of training instability and mode collapse. VAEs optimize a stable variational lower bound (ELBO) in one decoder pass, but likelihood averaging blurs fine texture. Diffusion models trade single-pass latency for supervised MSE regression over gradual cleanup steps, gaining stable optimization and broad mode coverage:

| Dimension | GANs | VAEs | Diffusion Models |
| :--- | :--- | :--- | :--- |
| **Objective** | Adversarial minimax | Evidence Lower Bound (ELBO) | Supervised MSE / score or flow matching |
| **Sample Quality** | Sharp; sensitive to tuning | Smooth; prone to blur | High detail and global coherence |
| **Mode Coverage** | Prone to mode collapse | High coverage | Broad coverage, minimal collapse |
| **Inference Cost** | 1 forward pass | 1 decoder pass | 4 to 50 iterative passes |

## The forward Markov chain and noise schedules

From a clean sample $x_0$, the forward Markov chain adds Gaussian noise at each step $t \in \{1, \dots, T\}$ under variance schedule $\beta_t \in (0, 1)$:[^sohldickstein2015]

$$
q(x_t \mid x_{t-1}) = \mathcal{N}\!\left(x_t;\, \sqrt{1-\beta_t}\,x_{t-1},\, \beta_t \mathbf{I}\right)
$$

<figure>
  <img src="illustrations/_generated/forward_noising_process_dark.png" alt="Four 12x12 heatmaps of a table silhouette corrupted at alpha-bar 1, 0.9, 0.5, and 0.001 showing structure fading into Gaussian static." />
  <figcaption>Variance-preserving forward diffusion across four stages. Signal amplitude decays while noise variance rises to hold total variance constant.</figcaption>
</figure>

Define $\alpha_t = 1 - \beta_t$ and $\bar{\alpha}_t = \prod_{s=1}^t \alpha_s$. Because sums of independent Gaussians remain Gaussian with additive variances, we jump straight from $x_0$ to any step $t$ in closed form:

$$
q(x_t \mid x_0) = \mathcal{N}\!\left(x_t;\, \sqrt{\bar{\alpha}_t}\,x_0,\, (1 - \bar{\alpha}_t)\mathbf{I}\right)
$$

That closed-form jump makes training fast: each step samples a random $t \sim \mathcal{U}(1, T)$ per example, computes $x_t$ in one vectorized op, and backpropagates without unrolling the chain. Schedule shape sets how $\mathrm{SNR}(t) = \bar{\alpha}_t / (1 - \bar{\alpha}_t)$ decays. Linear $\beta_t$ schedules destroy signal too fast, wasting late steps near zero SNR; cosine schedules decay $\bar{\alpha}_t$ smoothly so capacity spans global layout (low SNR) and surface detail (high SNR).

<figure>
  <img src="illustrations/_generated/snr_schedule_dark.png" alt="Signal coefficient sqrt(alpha_bar) declining from 1 to 0 while noise coefficient sqrt(1 - alpha_bar) rises from 0 to 1 across timesteps." />
  <figcaption>Signal amplitude decays smoothly while noise amplitude rises. At alpha-bar=0.5, signal variance equals noise variance.</figcaption>
</figure>

## Reverse process: DDPM training, targets, and sampling

Reversing the chain requires $q(x_{t-1} \mid x_t)$, which is intractable because it integrates over all clean images $x_0$ consistent with $x_t$. Conditioning on the known training image $x_0$ makes Bayes' rule exact, giving a closed-form Gaussian posterior $q(x_{t-1} \mid x_t, x_0)$:

$$
\tilde{\mu}_t = \frac{\sqrt{\bar{\alpha}_{t-1}}\,\beta_t}{1-\bar{\alpha}_t}x_0 + \frac{\sqrt{\alpha_t}(1-\bar{\alpha}_{t-1})}{1-\bar{\alpha}_t}x_t, \qquad \tilde{\beta}_t = \frac{1-\bar{\alpha}_{t-1}}{1-\bar{\alpha}_t}\beta_t
$$

Substituting $x_0 = (x_t - \sqrt{1-\bar{\alpha}_t}\,\epsilon)/\sqrt{\bar{\alpha}_t}$ reduces predicting $\tilde{\mu}_t$ to predicting the injected noise $\epsilon$. Dropping the ELBO step weights produces Ho et al.'s simple MSE objective:[^ho2020]

$$
\mathcal{L}_{\text{simple}} = \mathbb{E}_{t, x_0, \epsilon}\left[\|\epsilon - \epsilon_\theta(x_t, t)\|^2\right]
$$

Below, a four-parameter linear denoiser trains under a cosine schedule on a 2D cluster, cutting MSE from `0.9679` to `~0.20`:

<!-- leetllm: test, output=show -->
```python title="ddpm-training.py"
import numpy as np

rng = np.random.default_rng(42)
T = 200
steps = np.linspace(0, 1, T + 1)
f = np.cos((steps + 0.008) / 1.008 * np.pi / 2) ** 2
alpha_bars = np.clip(f[1:] / f[0], 1e-4, 0.999)

x0_data = np.array([1.0, -0.5]) + 0.15 * rng.standard_normal((256, 2))
W = np.zeros((2, 4))

for it in range(401):
    t = rng.integers(0, T, size=len(x0_data))
    ab = alpha_bars[t, None]
    eps = rng.standard_normal(x0_data.shape)
    xt = np.sqrt(ab) * x0_data + np.sqrt(1.0 - ab) * eps
    feats = np.column_stack([xt, t / T, np.ones(len(x0_data))])
    err = feats @ W.T - eps
    W -= 0.2 * (err.T @ feats) / len(x0_data)
    if it in (0, 50, 200, 400):
        print(f"iter={it:3d}  mse_loss={float(np.mean(err ** 2)):.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
iter=  0  mse_loss=0.9679
iter= 50  mse_loss=0.2613
iter=200  mse_loss=0.1999
iter=400  mse_loss=0.2208
```
<!-- leetllm: output:end -->

### Prediction targets and reverse DDPM sampling

Besides noise $\epsilon$, a denoiser can predict clean data $x_0$ or **velocity** $v = \sqrt{\bar{\alpha}_t}\,\epsilon - \sqrt{1 - \bar{\alpha}_t}\,x_0$. Recovering $x_0$ via $x_0 = \sqrt{\bar{\alpha}_t}\,x_t - \sqrt{1-\bar{\alpha}_t}\,v$ avoids dividing by tiny $\sqrt{\bar{\alpha}_t}$ at extreme noise and stabilizes step distillation.[^salimans2022] Never mismatch target and sampler: feeding a $v$-prediction checkpoint into an $\epsilon$ formula explodes $\hat{x}_0$.

To sample with DDPM, draw $x_T \sim \mathcal{N}(0, \mathbf{I})$ and step backward from $T$ to $0$, adding fresh noise $z \sim \mathcal{N}(0, \mathbf{I})$ at every step except the final transition to $x_0$:

$$
x_{t-1} = \frac{1}{\sqrt{\alpha_t}} \left(x_t - \frac{\beta_t}{\sqrt{1-\bar{\alpha}_t}} \epsilon_\theta(x_t, t)\right) + \sigma_t z
$$

Because every reverse step depends sequentially on $x_t$, running 1,000 stochastic DDPM steps is slow. Continuous-time formulations fix that bottleneck.

## Score matching, flow matching, and Rectified Flow

In the continuous-time limit ($T \to \infty$), forward diffusion becomes a stochastic differential equation (SDE) whose reverse SDE depends only on the **score function** $\nabla_{x_t} \log p_t(x_t)$, proportional to optimal noise prediction: $\epsilon^*(x_t, t) = -\sqrt{1-\bar{\alpha}_t}\,\nabla_{x_t}\log p_t(x_t)$. Every diffusion SDE also admits a deterministic **probability flow ODE** sharing identical marginals $p_t(x_t)$ at every $t$, turning sampling into numerical ODE integration.

Curved variance-preserving paths still require small solver steps to stay on track. **Flow matching** skips the diffusion schedule and learns a velocity field transporting noise $x_1 \sim \mathcal{N}(0, \mathbf{I})$ directly to data $x_0$.[^lipman2022] **Rectified Flow** connects pairs along straight paths $x_\tau = (1 - \tau)x_0 + \tau x_1$ for $\tau \in [0, 1]$ and regresses against the constant velocity $x_1 - x_0$:[^liu2022]

$$
\mathcal{L}_{\text{FM}} = \mathbb{E}_{\tau, x_0, x_1}\left[\|v_\theta(x_\tau, \tau) - (x_1 - x_0)\|^2\right]
$$

Straight paths have minimal curvature, so simple Euler ODE steps $x_{\tau - \Delta\tau} = x_\tau - \Delta\tau\, v_\theta(x_\tau, \tau)$ follow them accurately in 4 to 8 evaluations, powering models such as Stable Diffusion 3 and Flux.[^esser2024] Watch how four equal Euler steps carry a noisy state cleanly to $x_0$ along a straight trajectory:

<!-- leetllm: test, output=show -->
```python title="rectified-flow-euler.py"
import numpy as np

x0_target = np.array([1.0, -0.5])
x1_noise = np.array([-0.6, 0.9])
velocity = x1_noise - x0_target  # constant velocity along the straight path

x = x1_noise.copy()
dt = 0.25
for step in range(4):
    x = x - dt * velocity
    tau = 1.0 - (step + 1) * dt
    print(f"tau={tau:.2f}  x={np.round(x, 3).tolist()}")
assert np.allclose(x, x0_target)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tau=0.75  x=[-0.2, 0.55]
tau=0.50  x=[0.2, 0.2]
tau=0.25  x=[0.6, -0.15]
tau=0.00  x=[1.0, -0.5]
```
<!-- leetllm: output:end -->

## Denoiser backbones: U-Net vs. Diffusion Transformers

A denoiser must maintain global scene layout and crisp micro-texture simultaneously across all noise levels.

- **Convolutional U-Net:** a downsampling encoder captures wide spatial context while horizontal skip connections pass fine local features directly to matching decoder blocks; cross-attention layers inject prompt embeddings at multiple scales.[^rombach2022]
- **Diffusion Transformers (DiT and MM-DiT):** DiT patchifies the noisy latent into tokens processed by standard transformer blocks, delivering smooth compute scaling laws that steadily lower FID.[^peebles2023] **MM-DiT** gives text and image streams separate linear projections while running joint self-attention across both modalities in every block.[^esser2024]
- **Timestep conditioning:** sinusoidal embeddings pass through an MLP to produce per-channel scale and shift vectors (**FiLM / AdaGN** in U-Nets; **AdaLN-Zero** in DiT), modulating normalized features as $y = \operatorname{LN}(h) \odot (1 + \gamma(t)) + \beta(t)$. Zero-initializing the residual gate in AdaLN-Zero stabilizes deep training.

<figure>
  <img src="illustrations/_generated/unet_denoiser_dark.png" alt="U-Net denoiser showing encoder downsampling from 64x64 to 16x16 with horizontal skip connections to a symmetric upsampling decoder." />
  <figcaption>U-Net denoiser layout. Timestep embeddings modulate ResNet layers while cross-attention injects prompt tokens at multiple spatial scales.</figcaption>
</figure>

```checkpoint
What distinguishes Diffusion Transformers (DiT) from convolutional U-Nets?
---
DiT patchifies continuous latents into sequence tokens processed by transformer blocks with AdaLN-Zero conditioning, delivering predictable scaling laws and joint text-image attention in MM-DiT.
```

## Classifier-free guidance (CFG)

**Classifier-free guidance (CFG)** steers conditional generation without training a separate noisy-image classifier.[^ho2022] During training, the prompt $c$ is randomly replaced with a null embedding $\emptyset$ 10% to 20% of the time so one network learns both $\epsilon_\theta(x_t, c)$ and $\epsilon_\theta(x_t, \emptyset)$. At inference, the sampler extrapolates along the prompt direction by weight $w$:

$$
\tilde{\epsilon}_\theta(x_t, c) = \epsilon_\theta(x_t, \emptyset) + w \cdot \left(\epsilon_\theta(x_t, c) - \epsilon_\theta(x_t, \emptyset)\right)
$$

<figure>
  <img src="illustrations/_generated/cfg_guidance_curve_dark.png" alt="Classifier-free guidance extrapolation in score space from unconditional prediction toward prompt-conditioned prediction scaled by w." />
  <figcaption>CFG linear extrapolation in score space. Moderate weights (4.0 to 7.5) sharpen prompt adherence; extreme weights overshoot into saturated colors and clipping.</figcaption>
</figure>

Setting $w = 0$ ignores the prompt, $w = 1$ gives standard conditional sampling, $w \in [4.0, 7.5]$ sharpens alignment, and $w > 12$ explodes prediction norms and clips colors:

<!-- leetllm: test, output=show -->
```python title="cfg-guidance-formula.py"
import numpy as np

eps_uncond = np.array([0.20, -0.10, 0.05])
eps_cond = np.array([0.05, -0.35, 0.20])

for w in [0.0, 1.0, 7.5, 15.0]:
    guided = eps_uncond + w * (eps_cond - eps_uncond)
    print(f"w={w:4.1f}  guided={np.round(guided, 3).tolist()}  norm={np.linalg.norm(guided):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
w= 0.0  guided=[0.2, -0.1, 0.05]  norm=0.229
w= 1.0  guided=[0.05, -0.35, 0.2]  norm=0.406
w= 7.5  guided=[-0.925, -1.975, 1.175]  norm=2.477
w=15.0  guided=[-2.05, -3.85, 2.3]  norm=4.931
```
<!-- leetllm: output:end -->

Ordinary CFG doubles compute per step because it evaluates both branches. **Guidance distillation** folds $w$ directly into the network as an input, restoring single-branch speed.

## Fast sampling schedules: DDIM and ODE solvers

**DDIM** defines a non-Markovian process sharing the same marginals $q(x_t \mid x_0)$ as DDPM, letting any pretrained DDPM checkpoint sample deterministically ($\eta = 0$) along an ODE.[^song2020] Without fresh noise, DDIM leaps from step $t$ to an earlier step $s$ by estimating $\hat{x}_0$ and re-projecting onto $\bar{\alpha}_s$:

$$
\hat{x}_0 = \frac{x_t - \sqrt{1 - \bar{\alpha}_t}\,\epsilon_\theta(x_t, t)}{\sqrt{\bar{\alpha}_t}},
\qquad
x_s = \sqrt{\bar{\alpha}_s}\,\hat{x}_0 + \sqrt{1 - \bar{\alpha}_s}\,\epsilon_\theta(x_t, t)
$$

This collapses 1,000 DDPM steps into 20 to 50 steps without retraining, and running the ODE in reverse gives **DDIM inversion** (mapping a real image back into noise for editing). Below, we verify both the deterministic DDIM jump and exact $\epsilon \leftrightarrow v$ recovery:

<!-- leetllm: test, output=show -->
```python title="ddim-known-noise-check.py"
import numpy as np

x0, eps = np.array([1.0, 0.5]), np.array([-0.4, 0.2])
alpha_t, alpha_s = 0.5, 0.9

xt = np.sqrt(alpha_t) * x0 + np.sqrt(1.0 - alpha_t) * eps
x0_hat = (xt - np.sqrt(1.0 - alpha_t) * eps) / np.sqrt(alpha_t)
xs = np.sqrt(alpha_s) * x0_hat + np.sqrt(1.0 - alpha_s) * eps
assert np.allclose(xs, np.sqrt(alpha_s) * x0 + np.sqrt(1.0 - alpha_s) * eps)

a, b = np.sqrt(alpha_t), np.sqrt(1.0 - alpha_t)
v = a * eps - b * x0
x0_from_v = a * xt - b * v
assert np.allclose(x0_from_v, x0)
print(f"xt={xt.round(3).tolist()} -> x0_hat={x0_hat.round(3).tolist()} -> xs={xs.round(3).tolist()}")
print(f"v={v.round(3).tolist()} -> x0_from_v={x0_from_v.round(3).tolist()}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
xt=[0.424, 0.495] -> x0_hat=[1.0, 0.5] -> xs=[0.822, 0.538]
v=[-0.99, -0.212] -> x0_from_v=[1.0, 0.5]
```
<!-- leetllm: output:end -->

Higher-order ODE solvers like DPM-Solver++ cut 2-branch CFG sampling to ~25 steps (50 evaluations), while distilled single-branch flow models need only 4 to 8 evaluations:

<figure>
  <img src="illustrations/_generated/sampling_schedule_dark.png" alt="Denoiser evaluation counts per image across DDPM (1000), CFG DDIM (100), DPM-Solver++ (50), and distilled single-branch flow models." />
  <figcaption>Per-image denoiser budgets across sampling strategies. Higher-order ODE solvers and distilled flow models slash 1,000 DDPM steps down to single-digit evaluations.</figcaption>
</figure>

## Latent diffusion and cross-attention conditioning

Running self-attention over a 512x512 RGB image (262,144 spatial positions) exhausts GPU memory immediately. **Latent Diffusion Models (LDMs)** decouple perceptual compression from generation: a frozen VAE encodes pixels into a continuous latent $z_0$ at 8x lower spatial resolution, the denoiser iterates entirely in latent space, and the VAE decoder runs once at the end.[^rombach2022]

<figure>
  <img src="illustrations/_generated/latent_diffusion_architecture_dark.png" alt="Latent diffusion training diagram: a frozen VAE encodes an image into compact continuous latent z0 before forward noising and denoising." />
  <figcaption>Latent diffusion pipeline. A frozen VAE compresses pixels into continuous latents so the denoiser pays far less memory and compute per step.</figcaption>
</figure>

Downsampling each spatial axis by 8x cuts positions by $8^2 = 64\times$ and quadratic self-attention entries by $64^2 = 4,096\times$:

<!-- leetllm: test, output=show -->
```python title="latent-work-state.py"
import numpy as np

pixel_shape, latent_shape = np.array([512, 512, 3]), np.array([64, 64, 4])
pixel_scalars, latent_scalars = int(pixel_shape.prod()), int(latent_shape.prod())
pixel_pos, latent_pos = int(pixel_shape[:2].prod()), int(latent_shape[:2].prod())

print(f"scalars: {pixel_scalars:,} -> {latent_scalars:,} ({pixel_scalars // latent_scalars}x smaller)")
print(f"spatial positions: {pixel_pos:,} -> {latent_pos:,} ({pixel_pos // latent_pos}x smaller)")
print(f"self-attention entries: {(pixel_pos ** 2) // (latent_pos ** 2):,}x smaller")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
scalars: 786,432 -> 16,384 (48x smaller)
spatial positions: 262,144 -> 4,096 (64x smaller)
self-attention entries: 4,096x smaller
```
<!-- leetllm: output:end -->

Continuous VAE latents preserve smooth gradients for diffusion and flow matching, whereas discrete VQ-VAE codebooks quantize patches into token IDs for autoregressive or masked generators. In both cases, VAE reconstruction caps fine detail: if encode-decode alone blurs 8px text, extra denoising steps cannot fix it.

To condition on text, an encoder (CLIP, T5, or both) produces prompt embeddings $c \in \mathbb{R}^{L \times d_{\text{text}}}$. Inside each cross-attention block, noisy spatial patches emit queries $Q = W_Q z_t$ while prompt tokens supply keys $K = W_K c$ and values $V = W_V c$, routing words to matching image regions.

## Discrete text diffusion

Autoregressive LLMs commit tokens left to right with no revision. **Discrete text diffusion** (such as DiffusionGemma) replaces Gaussian noise with token masking, refining a bidirectional canvas in parallel rounds.[^google2026diffusiongemma] Each round scores every slot simultaneously, unmasks confident tokens, revises earlier slots once surrounding context clarifies, and stops when mean entropy drops below threshold and the canvas stabilizes.

<figure>
  <img src="illustrations/_generated/text_diffusion_sequence_refinement_dark.png" alt="Comparison of left-to-right autoregressive decoding versus parallel bidirectional masked text diffusion refinement rounds." />
  <figcaption>Autoregressive left-to-right decoding contrasted with bidirectional masked text diffusion, where confident tokens unmask and revise in parallel.</figcaption>
</figure>

## Spatial control, LoRA, and inference practice

Prompts capture style and subject well but rarely pin exact silhouettes, camera framing, or pose layout. **ControlNet** solves spatial conditioning by freezing the pretrained denoiser and attaching a trainable copy of its encoder blocks through $1 \times 1$ **zero-initialized convolutions** whose weights and biases start at exact zero.[^zhang2023] At optimization step 0, those zero convolutions contribute zero residual signal, so the combined network behaves identically to the pretrained base model; as gradients flow, the side branch smoothly learns to obey Canny edges, depth maps, segmentation masks, or human pose skeletons without corrupting base visual fidelity.

For style, character, or domain specialization without duplicating multi-gigabyte checkpoints, **LoRA** freezes base weights $W_0$ and injects a low-rank update $\Delta W = B A$ (with rank $r \ll d$) into the denoiser's attention projections. One base checkpoint stays resident in VRAM while megabyte-scale LoRA and ControlNet adapters hot-swap per request, or merge directly into $W_0$ when serving a single specialization.

Four optimizations make latent diffusion fast in practice:

1. **BF16/FP16 + compiled kernels:** combine half precision, FlashAttention, and `torch.compile` to saturate tensor cores.
2. **Cross-attention K/V caching:** prompt embeddings are constant across all $N$ solver steps, so project text keys and values once per prompt.
3. **Pre-allocated latent buffers:** reuse fixed-shape scratch tensors per resolution bucket to avoid CUDA allocator stalls.
4. **Overlapped VAE decoding:** decode finished latents on a separate CUDA stream while the denoiser processes the next batch.

### Common pitfalls

- **Treating CFG scale $w$ as a probability:** $w$ is an extrapolation multiplier; pushing $w > 12$ overshoots the data manifold and clips colors.
- **Decoding predicted noise:** the VAE decoder expects clean latent $z_0$, not raw $\epsilon_\theta$.
- **Blaming the denoiser for VAE blur:** run a plain encode-decode sanity check before increasing step count.
- **Assuming DiT is always cheaper than U-Net:** quadratic self-attention over small high-resolution patches can exceed U-Net FLOPs and memory.

```mastery-quiz
[
  {
    "question": "Given clean scalar x_0 = 2.0, Gaussian noise epsilon = -1.0, and alpha_bar = 0.64, what are x_t and SNR?",
    "options": [
      "1.0 / about 1.778.",
      "0.92 / about 1.778.",
      "1.0 / about 0.563.",
      "2.2 / about 0.563."
    ],
    "answer": "1.0 / about 1.778.",
    "explanation": "Signal amplitude is sqrt(0.64) = 0.8 and noise amplitude is sqrt(0.36) = 0.6. Thus x_t = 0.8*(2.0) + 0.6*(-1.0) = 1.0 and SNR = 0.64/0.36 ≈ 1.778."
  },
  {
    "question": "With a = 0.6, b = 0.8, and x_t = 1.0, a velocity model predicts v = -0.5. Compare true x_0 from v against mistakenly plugging v into the epsilon formula.",
    "options": [
      "1.000 / 2.333.",
      "2.333 / 1.000.",
      "1.000 / 1.400.",
      "0.200 / 2.333."
    ],
    "answer": "1.000 / 2.333.",
    "explanation": "True x_0 = a*x_t - b*v = 0.6 - 0.8*(-0.5) = 1.0. Misapplying the epsilon formula yields (1.0 - 0.8*(-0.5))/0.6 = 1.4/0.6 ≈ 2.333."
  },
  {
    "question": "An ordinary CFG step has unconditional prediction [0.1, 0.2], conditional prediction [0.3, -0.1], and scale w = 4. What guided vector results?",
    "options": [
      "[0.9, -1.0].",
      "[1.2, -0.4].",
      "[0.8, -1.2].",
      "[0.3, -0.1]."
    ],
    "answer": "[0.9, -1.0].",
    "explanation": "Delta is [0.2, -0.3]; scaling by 4 gives [0.8, -1.2]; adding base [0.1, 0.2] yields [0.9, -1.0]."
  },
  {
    "question": "A deterministic DDIM step (eta = 0) at x_t = 0.2, alpha_bar_t = 0.36, epsilon = -0.5 targets alpha_bar_s = 0.81. What are x_0 and x_s?",
    "options": [
      "1.000 / 0.6821.",
      "1.000 / 0.9000.",
      "0.600 / 0.3221.",
      "1.000 / 1.1179."
    ],
    "answer": "1.000 / 0.6821.",
    "explanation": "x_0 = (0.2 - 0.8*(-0.5))/0.6 = 1.0. Re-projecting gives x_s = 0.9*(1.0) + sqrt(0.19)*(-0.5) ≈ 0.6821."
  },
  {
    "question": "A VAE maps 768x512x3 RGB images to 96x64x8 latents, and plain encode-decode already blurs 8px text. What is the scalar reduction ratio and first diagnostic target?",
    "options": [
      "24x fewer scalars; inspect VAE reconstruction capacity.",
      "64x fewer scalars; increase denoiser sampling steps.",
      "24x fewer scalars; raise CFG guidance scale w.",
      "8x fewer scalars; switch from U-Net to DiT."
    ],
    "answer": "24x fewer scalars; inspect VAE reconstruction capacity.",
    "explanation": "1,179,648 pixel scalars compress to 49,152 latent scalars (24x). Because encode-decode loses text before diffusion runs, isolate VAE capacity first."
  }
]
```

> **Next:** Continue to [Mechanistic Interpretability](/learn/mechanistic-interpretability-sparse-autoencoders).
