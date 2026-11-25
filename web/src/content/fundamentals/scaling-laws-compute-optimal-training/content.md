---
{
  "id": "scaling-laws-compute-optimal-training",
  "title": "Scaling Laws & Compute-Optimal Training",
  "slug": "scaling-laws-compute-optimal-training",
  "section": "Training, Fine-Tuning & Alignment",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "prerequisites": [
    "decoding-strategies-greedy-beam-nucleus"
  ],
  "coverImage": "illustrations/_generated/scaling_curves_dark.png",
  "companies": [
    "Google DeepMind",
    "OpenAI",
    "Meta",
    "Anthropic",
    "Microsoft"
  ],
  "shortDescription": "Kaplan, Chinchilla, and later inference-aware fits split a training budget between parameters and tokens, including when a smaller model wins on lifetime cost.",
  "order": 1,
  "keyConceptsTested": [
    "Kaplan scaling laws (parameters vs. data vs. compute)",
    "Chinchilla-optimal training (Hoffmann et al.)",
    "Compute-optimal model sizing",
    "6ND training-compute heuristic",
    "Inference-cost-aware scaling",
    "Over-training and under-training regimes",
    "The data wall and finite public-text availability",
    "Test-time compute as a new scaling axis",
    "Scaling law extrapolation for new architectures"
  ],
  "aliases": [
    "bitter-lesson-compute-over-heuristics"
  ]
}
---

You have a fixed training budget of $10^{24}$ FLOPs. One plan trains a 200B-parameter model on modest data; another trains a 30B model on nearly seven times as many tokens. Both burn the exact same cluster bill, yet one can finish with higher loss or cost four times as much to serve.

<span data-glossary="scaling-law">Scaling laws</span> resolve that choice before you rent a cluster by fitting empirical power laws to <span data-glossary="cross-entropy">cross-entropy</span> loss over three quantities: **parameters ($N$)** (check whether <span data-glossary="embedding">embedding</span>/output heads are counted), **training token presentations ($D$)** (total <span data-glossary="subword-tokenization">subword</span> presentations, distinct from unique corpus size), and **compute ($C$)** (useful training FLOPs, distinct from wall-clock time or dollars). Kaplan et al. scaled parameters much faster than tokens,[^kaplan2020] Hoffmann et al.'s <span data-glossary="chinchilla-scaling">Chinchilla study</span> scaled both equally,[^hoffmann2022] and later work reconciled their disagreement and added lifetime inference cost.[^porian2024][^sardana2024]

### Why scale beats hand-crafted heuristics: the Bitter Lesson

In *The Bitter Lesson*, Rich Sutton summarized seventy years of AI history: as compute grows by orders of magnitude, general **learning** and **search** overtake hand-crafted human heuristics.[^sutton2019] Deep Blue and AlphaZero discarded human chess heuristics for search and self-play,[^silver2017] and neural networks overtook hand-engineered SIFT/HOG vision features as datasets and GPUs grew.[^krizhevsky2012] Hand-crafted rules win on day one under tight compute, then hit an irreducible ceiling; general learners turn every 10x jump in FLOPs into a better curve.

### Where the 6ND shortcut comes from

For a dense linear layer $Y = XW$ with $W \in \mathbb{R}^{d_{\text{in}} \times d_{\text{out}}}$, each multiply-add takes 2 FLOPs per weight, giving $C_{\text{forward}} \approx 2N$ FLOPs per token. Backpropagation runs two equally sized matrix multiplications: activation gradients $\nabla_X L = (\nabla_Y L)W^T$ ($2N$) and weight gradients $\nabla_W L = X^T(\nabla_Y L)$ ($2N$). Summing forward and backward across $D$ tokens yields:

$$
C_{\text{forward}} \approx 2N, \qquad C_{\text{backward}} \approx 4N, \qquad C_{\text{train}} \approx 6ND \text{ FLOPs}
$$

Two variations shift that constant immediately: full <span data-glossary="activation-checkpointing">activation checkpointing</span> recomputes one extra forward pass during backprop, raising training compute to **$8ND$**; inference has no backward pass, dropping dense per-token arithmetic to **$2N$**. (Long contexts or huge vocabularies add quadratic attention and output-head costs that need exact FLOP accounting.[^porian2024]) For a 1B model on 20B tokens, $6ND = 1.2 \times 10^{20}$ FLOPs.

## Double parameters, double data, or both

Start from a 1B model on 10B tokens under a fixed tokenizer and validation split (cross-entropy is measured in nats per token, so changing tokenizers breaks loss comparisons):

| Experiment | $N$ | $D$ | Relative compute ($6ND$) | Loss (nats) |
|---|---:|---:|---:|---:|
| Baseline | 1B | 10B | 1x | 2.80 |
| Double parameters | 2B | 10B | 2x | 2.60 |
| Double data | 1B | 20B | 2x | 2.55 |
| Double both | 2B | 20B | 4x | 2.35 |

Both middle runs burn $2\times$ compute, yet more tokens beat more parameters by 0.05 nats; doubling both relieves both bottlenecks. Under a power law $L(C) = E + K C^{-\alpha}$ with irreducible entropy floor $E$, equal multiplicative compute jumps produce steadily shrinking absolute loss drops.

<figure>
  <img src="illustrations/_generated/power_law_returns_dark.png" alt="Log-compute plot of L(C)=2+C^-0.05 showing losses dropping from 3.000 to 2.794 across equal 3.16x steps while per-step gains shrink from 0.056 to 0.047." />
  <figcaption>Equal multiplicative steps along the log-compute axis produce progressively smaller absolute reductions in cross-entropy loss.</figcaption>
</figure>

With Kaplan's parameter exponent $\alpha_N \approx 0.076$, a 2x parameter jump cuts the power-law term by 5.1%, a 10x jump cuts it by 16.1%, and a 100x jump cuts it by 29.5%.

## Kaplan scaling laws (2020)

Kaplan et al.[^kaplan2020] swept non-embedding parameters, fresh tokens, and compute while holding other axes abundant: $L(N) \propto N^{-0.076}$, $L(D) \propto D^{-0.095}$, and $L(C_{\min}) \propto C_{\min}^{-0.050}$. Jointly optimizing $N$ and $D$ at fixed compute produced a heavily parameter-biased rule:

$$
N_{\text{opt}} \propto C^{0.73}, \qquad D_{\text{opt}} \propto C^{0.27}
$$

That recipe drove GPT-3 (175B on 300B tokens, 1.7:1)[^brown2020] and Gopher (280B on 300B tokens, 1.07:1).

| Compute multiplier | Kaplan ($C^{0.73},\; C^{0.27}$) | Chinchilla ($C^{0.50},\; C^{0.50}$) |
|---|---|---|
| **10x** | $N = 5.37\times,\; D = 1.86\times$ | $N = 3.16\times,\; D = 3.16\times$ |
| **100x** | $N = 28.84\times,\; D = 3.47\times$ | $N = 10.00\times,\; D = 10.00\times$ |

<figure>
  <img src="illustrations/_generated/scaling_curves_dark.png" alt="100x iso-FLOP contour comparing Kaplan (28.84x N, 3.47x D), Chinchilla (10x N, 10x D), and overtrained (2.5x N, 40x D) allocations." />
  <figcaption>Along the same 100x iso-FLOP contour, Kaplan prioritizes parameters, Chinchilla splits evenly, and inference-aware overtraining shifts budget toward tokens.</figcaption>
</figure>

## The Chinchilla reallocation (2022)

Hoffmann et al.[^hoffmann2022] trained over 400 models (70M to 16B parameters, 5B to 500B tokens) and found GPT-3 and Gopher severely undertrained: parameters and tokens should scale roughly equally.

Why did the two studies disagree ($C^{0.73}$ vs. $C^{0.50}$)? Hoffmann et al. traced part of it to Kaplan reading intermediate checkpoints off one fixed cosine decay schedule. Porian et al.[^porian2024] later identified three even larger causes: counting vocabulary head FLOPs, avoiding oversized warmup on small runs, and scaling learning rate, batch size, and AdamW $\beta_2$ cleanly with size.

> **Key insight:** Optimal $D/N$ slopes depend on every hyperparameter that interacts with scale. Separate shifts that move loss uniformly from choices that tilt the optimal balance between weights and tokens.

### Deriving the compute-optimal split

Three independent Chinchilla methods agreed closely: empirical lower envelope ($a=0.50, b=0.50$), IsoFLOP slices ($a=0.49, b=0.51$), and parametric L-BFGS fit ($a=0.46, b=0.54$) to:

$$
L(N, D) = E + \frac{A}{N^\alpha} + \frac{B}{D^\beta}
$$

Substituting $D = C/(6N)$ and setting $dL/dN = 0$ balances the marginal log-sensitivities, $\alpha A N^{-\alpha} = \beta B D^{-\beta}$, giving exact closed-form scaling laws:

$$
N^*(C) = \left(\frac{\alpha A}{\beta B}\right)^{\frac{1}{\alpha + \beta}} \left(\frac{C}{6}\right)^{\frac{\beta}{\alpha + \beta}}, \qquad D^*(C) = \left(\frac{\beta B}{\alpha A}\right)^{\frac{1}{\alpha + \beta}} \left(\frac{C}{6}\right)^{\frac{\alpha}{\alpha + \beta}}
$$

Notice that the compute exponents $a = \beta/(\alpha + \beta)$ and $b = \alpha/(\alpha + \beta)$ sum to 1 (notice $\beta$ sits on $N^*$ and $\alpha$ sits on $D^*$). With Hoffmann et al.'s $\alpha \approx 0.34, \beta \approx 0.28$, $a \approx 0.45$ and $b \approx 0.55$, close to $N \propto \sqrt{C}, D \propto \sqrt{C}$, summarized as **~20 tokens per parameter** ($D \approx 20N$). Crucially, equal exponents ($\alpha = \beta = \gamma$) fix the growth slope, **not** the ratio itself: the optimal ratio $D^*/N^* = (B/A)^{1/\gamma}$ depends on your tokenizer, architecture, and data mix.[^hoffmann2022]

<!-- leetllm: test, output=show, deps=numpy -->
```python title="equal-growth-and-chinchilla-sizing.py"
import numpy as np

# Equal exponents (gamma=0.5) fix growth slope, while (B/A)^(1/gamma) sets D/N.
gamma, product = 0.5, 1e6
for a, b in [(1.0, 1.0), (2.0, 8.0)]:
    ratio = (b / a) ** (1.0 / gamma)
    n = np.sqrt(product / ratio)
    print(f"A={a:.0f}, B={b:.0f} -> N={n:.0f}, D={ratio * n:.0f}, optimal D/N={ratio:.0f}:1")

flops, r = 1e24, 20.0
n_opt = np.sqrt(flops / (6.0 * r))
print(f"At 1e24 FLOPs (20:1): N={n_opt / 1e9:.1f}B params, D={r * n_opt / 1e12:.2f}T tokens")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A=1, B=1 -> N=1000, D=1000, optimal D/N=1:1
A=2, B=8 -> N=250, D=4000, optimal D/N=16:1
At 1e24 FLOPs (20:1): N=91.3B params, D=1.83T tokens
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/kaplan_chinchilla_frontier_dark.png" alt="Log-log growth slopes for Kaplan (0.73/0.27) vs Chinchilla (0.50/0.50) alongside historical D/N ratios: GPT-3 1.7:1, Chinchilla 20:1, Llama 3 405B 38.5:1." />
  <figcaption>Fitted growth exponents across compute (left) alongside historical $D/N$ snapshots for GPT-3, Chinchilla, and Llama 3 405B (right).</figcaption>
</figure>

### Chinchilla vs. Gopher: the frontier test

DeepMind tested its prediction by training 70B **Chinchilla** on 1.4T tokens ($6ND = 5.88 \times 10^{23}$, reported budget $5.76 \times 10^{23}$) against 280B **Gopher** on 300B tokens ($6ND = 5.04 \times 10^{23}$, reported budget $5.76 \times 10^{23}$).[^hoffmann2022] Chinchilla beat Gopher across MMLU, BIG-bench, and LAMBADA with $4\times$ fewer weights, cutting weight memory and dense inference FLOPs by $4\times$. That raised an immediate question: if smaller checkpoints cut serving cost so sharply, why stop at the *training*-optimal ratio?

## Beyond Chinchilla: inference-aware scaling

Chinchilla minimizes loss for fixed *training* compute ($C_{\text{train}}$). Under $6ND$ training and $2NQ$ inference proxies, cumulative serving FLOPs surpass training as soon as served volume exceeds $Q > 3D$. Labs therefore **overtrain** smaller models far beyond 20:1, trading upfront training FLOPs for cheaper serving on every user token.

Sardana et al.[^sardana2024] minimized total lifetime compute $C_{\text{total}} = 6ND + 2NQ$. Comparing a larger model $(N_1, D_1)$ and a smaller overtrained model $(N_2 < N_1, D_2)$ at equal target quality, the smaller model pays upfront premium $\Delta C_{\text{train}} = 6(N_2 D_2 - N_1 D_1)$ and saves $\Delta C_{\text{infer/tok}} = 2(N_1 - N_2)$ per served token, breaking even at:

$$
Q_{\text{break-even}} = \frac{3(N_2 D_2 - N_1 D_1)}{N_1 - N_2} = \frac{\Delta C_{\text{train}}}{\Delta C_{\text{infer/tok}}}
$$

When training and inference FLOPs have different unit dollar costs ($p_t, p_i$), the financial break-even scales by $p_t / p_i$.

### Concrete break-even: 70B/1.4T vs. 30B/4.0T

At equal quality, 30B/4.0T ($7.20 \times 10^{23}$ FLOPs) costs $1.32 \times 10^{23}$ more training FLOPs than 70B/1.4T ($5.88 \times 10^{23}$) and saves 80B FLOPs per served token, breaking even at **1.65T served tokens** ($8.19 \times 10^{23}$ lifetime FLOPs).

<figure>
  <img src="illustrations/_generated/inference_break_even_dark.png" alt="Lifetime FLOPs for 70B/1.4T and 30B/4.0T cross at 1.65T served tokens (8.19e23 total FLOPs)." />
  <figcaption>At equal quality, 70B/1.4T and 30B/4.0T tie at 1.65T served tokens ($8.19 \times 10^{23}$ FLOPs). Above 1.65T served tokens, the overtrained 30B model wins.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy -->
```python title="inference-break-even.py"
import numpy as np

names = ["70B / 1.4T", "30B / 4.0T"]
params, tokens = np.array([70e9, 30e9]), np.array([1.4e12, 4.0e12])
train_flops = 6.0 * params * tokens
break_even = (train_flops[1] - train_flops[0]) / (2.0 * (params[0] - params[1]))
print(f"Training FLOPs: A={train_flops[0]:.2e}, B={train_flops[1]:.2e} | break-even={break_even:.2e}")

for demand in (1e12, 3e12):
    winner = names[int(np.argmin(train_flops + 2.0 * demand * params))]
    print(f"At {demand / 1e12:.0f}T served tokens -> cheaper: {winner}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Training FLOPs: A=5.88e+23, B=7.20e+23 | break-even=1.65e+12
At 1T served tokens -> cheaper: 70B / 1.4T
At 3T served tokens -> cheaper: 30B / 4.0T
```
<!-- leetllm: output:end -->

The Llama lineage reflects this shift directly: LLaMA 1 7B trained at 143:1 (1T tokens),[^touvron2023] Llama 2 7B at 286:1 (2T),[^touvron2023a] Llama 3 8B at ~1,875:1 ([15T+ tokens](https://huggingface.co/meta-llama/Meta-Llama-3-8B)), and Llama 3 405B at 38.5:1 (15.6T).[^dubey2024]

## Finite public text and test-time compute

Aggressive overtraining meets the finite supply of high-quality public human text: Villalobos et al.[^villalobos2024] projected single-run token demand intersecting the effective public stock ($\sim 4 \times 10^{14}$ quality- and repetition-adjusted tokens) around 2028 (2026 to 2032).

> **Common mistake:** Training does not consume internet text like oil. Four runs training once on the same 15T corpus log 60T total presentations using only 15T unique tokens. The bottleneck is single-run appetite meeting finite fresh text, addressed via multi-epoch schedules, verifier-checked synthetic data, and multimodal corpora (each requiring re-measured slopes).

At inference, <span data-glossary="test-time-compute">test-time compute</span> brings back search: spend extra compute per hard prompt via longer reasoning chains (DeepSeek-R1[^deepseekai2025]) or Best-of-$k$ sampling. Snell et al.[^snell2024] showed adaptive test-time compute let a smaller model match one ~14x larger on math at equal FLOPs. Sampling $k$ candidates of length $L_{\text{out}}$ multiplies dense generation FLOPs linearly: $2 N L_{\text{out}} k$ (an 8B model generating 512 tokens across 1, 4, and 16 candidates burns $8.19 \times 10^{12}$, $3.28 \times 10^{13}$, and $1.31 \times 10^{14}$ FLOPs). Exact verifiers (tests, compilers) drive pass rates monotonically toward 1.0, whereas maximizing an imperfect proxy reward eventually triggers **Goodhart overoptimization**, where true accuracy peaks and drops at large $k$.[^cobbe2021][^lightman2023]

## Running a scaling study in practice

Turning scaling laws into a cluster plan takes three steps: width-stable hyperparameter transfer, surface fitting with constraints, and mid-scale verification.

### Zero-shot hyperparameter transfer with µP

Standard parametrization diverges or stalls when copying a learning rate from a 100M proxy to a 10B model. **Maximal Update Parametrization ($\mu$P)**[^yang2022] coordinates init scales and layer learning rates so feature updates stay $\Theta(1)$ at every width. On the two-layer model $f(1) = V^\top U$ with loss $\tfrac{1}{2}(f-1)^2$, alternating $U_i = \pm 1$, and base rate $\eta$: standard init $V_i = 1/\sqrt{n}$ with both rates $\eta$ yields one-step prediction $\eta(n+1)$ (blowing up linearly with width), whereas $\mu$P ($V_i = 1/n$, input rate $\eta n$, output rate $\eta / n$) locks the update at $2\eta$ at every width:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="width-and-a-single-sgd-update.py"
import numpy as np

def one_step(u, v, input_lr, output_lr):
    err = float(u @ v) - 1.0
    return float((u - input_lr * err * v) @ (v - output_lr * err * u))

for width in (16, 64, 256):
    u = np.where(np.arange(width) % 2 == 0, 1.0, -1.0)
    std = one_step(u, np.full(width, 1.0 / np.sqrt(width)), 1.0, 1.0)
    mup = one_step(u, np.full(width, 1.0 / width), float(width), 1.0 / width)
    print(f"width={width:>3}: standard={std:5.1f}, muP={mup:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
width= 16: standard= 17.0, muP=2.0
width= 64: standard= 65.0, muP=2.0
width=256: standard=257.0, muP=2.0
```
<!-- leetllm: output:end -->

### Fitting the surface, optimizing under a data cap, and checking mid-scale

Fit proxy runs on a grid of $(N, D)$, verify held-out error, apply data or parameter caps, and gate the full run behind a mid-scale checkpoint:

<figure>
  <img src="illustrations/_generated/scaling_study_fit_dark.png" alt="Eight proxy runs (0.1B-1B, 1B-20B) fit the surface, holdout 1B/100B matches at 2.408 (+0.0002 residual), and target 70B/1.4T forecasts 2.091." />
  <figcaption>Eight small proxy runs fit the surface, one held-out run at 1B/100B verifies recovery, and the fitted curve forecasts 2.091 at 70B/1.4T before a mid-scale check.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=scaling-fit, deps=numpy -->
```python title="fit-optimize-and-verify.py"
# fold:start imports, loss surface, and proxy run grid
import numpy as np

def scaling_loss(n, d, e, a, alpha, b, beta):
    return e + a / np.power(n, alpha) + b / np.power(d, beta)

E, A, B = 1.10, 2.80, 7.80
runs = np.array([
    [1e8, 1e9, 2.895], [1e8, 5e9, 2.745], [1e8, 2e10, 2.634],
    [5e8, 1e9, 2.813], [5e8, 5e9, 2.663], [5e8, 2e10, 2.552],
    [1e9, 5e9, 2.631], [1e9, 2e10, 2.520], [1e9, 1e11, 2.408],
])
train, held = runs[:-1], runs[-1]
# fold:end

grid = np.arange(40, 121, 2) / 1000.0
ag, bg = np.meshgrid(grid, grid, indexing="ij")
preds = scaling_loss(train[:, 0:1, None], train[:, 1:2, None], E, A, ag[None], B, bg[None])
bi, bj = np.unravel_index(np.argmin(np.sum((preds - train[:, 2][:, None, None]) ** 2, axis=0)), ag.shape)
alpha_fit, beta_fit = float(ag[bi, bj]), float(bg[bi, bj])

C = 6 * 70e9 * 1.4e12
n_opt = float(np.exp((np.log(alpha_fit * A / (beta_fit * B)) + beta_fit * np.log(C / 6)) / (alpha_fit + beta_fit)))
d_opt = C / (6 * n_opt)
n_cap = max(n_opt, C / (6 * 2e12))  # 2T unique-token cap, no repeats
d_cap = C / (6 * n_cap)

# fold:start holdout, optimum, and mid-scale verification prints
hold_pred = scaling_loss(held[0], held[1], E, A, alpha_fit, B, beta_fit)
target_70b = scaling_loss(70e9, 1.4e12, E, A, alpha_fit, B, beta_fit)
mid_pred, mid_obs = scaling_loss(10e9, 100e9, E, A, alpha_fit, B, beta_fit), 2.350
print(f"Fitted: alpha={alpha_fit:.3f}, beta={beta_fit:.3f} | holdout err={hold_pred - held[2]:+.4f}")
print(f"Unconstrained: {n_opt/1e9:.2f}B / {d_opt/1e12:.2f}T (loss={scaling_loss(n_opt, d_opt, E, A, alpha_fit, B, beta_fit):.3f} vs 70B/1.4T={target_70b:.3f})")
print(f"Data-capped (<=2T): {n_cap/1e9:.2f}B / {d_cap/1e12:.2f}T (loss={scaling_loss(n_cap, d_cap, E, A, alpha_fit, B, beta_fit):.3f})")
print(f"Mid-scale 10B/100B: pred={mid_pred:.3f}, obs={mid_obs:.3f} -> {'proceed' if abs(mid_obs - mid_pred) <= 0.02 else 'pause_and_investigate'}")
# fold:end
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Fitted: alpha=0.070, beta=0.098 | holdout err=+0.0002
Unconstrained: 7.82B / 12.53T (loss=2.074 vs 70B/1.4T=2.091)
Data-capped (<=2T): 49.00B / 2.00T (loss=2.086)
Mid-scale 10B/100B: pred=2.310, obs=2.350 -> pause_and_investigate
```
<!-- leetllm: output:end -->

When clean tokens are capped at $D_{\max}$ with no repeats, spending full compute requires $N \ge C / (6 D_{\max})$, snapping the constrained optimum to the smallest feasible $N$ above $N^*$ (here 49B). If both $N$ and $D$ are capped, maximum spendable work is simply $N_{\max} D_{\max}$. And the 10B/100B checkpoint catches a 0.040-nat miss against the 0.020 tolerance before committing the full run.

### Why sparse measurements hide floor ambiguity

Fitting a 5-parameter surface across too few scales leaves floor $E$ and exponent $\alpha$ entangled. Two curves can pass exactly through $L(1) = 3.0$ and $L(100) = 2.5$ yet forecast `1.985` ($\alpha=0.1, E=1.645$) vs `2.222` ($\alpha=0.2, E=2.169$) at $C=10^6$; that 0.237-nat gap measures model-choice uncertainty, not run-to-run variance.

<figure>
  <img src="illustrations/_generated/floor_ambiguity_dark.png" alt="Two curves matching L(1)=3 and L(100)=2.5 exactly yet diverging to 1.985 (alpha=0.1) and 2.222 (alpha=0.2) at C=1e6." />
  <figcaption>Two curves match $L(1)=3.0$ and $L(100)=2.5$ identically yet diverge by 0.237 nats at $C=10^6$ because sparse anchors entangle $E$ and $\alpha$.</figcaption>
</figure>

## Where scaling laws break down

Six limits govern production decisions:

- **Extreme overtraining bends curves:** Fits below 100:1 systematically overstated gains when Sardana et al. trained up to 10,000:1.[^sardana2024]
- **FLOPs are not hardware bills:** $6ND$ ignores attention, collectives, and MFU; measure tokens per GPU-second on target hardware.
- **Loss is not deployed capability:** Cross-entropy tracks next-token fit, not instruction following or safety; budget separately for SFT, <span data-glossary="rlhf">RLHF</span>,[^ouyang2022] and task evals.
- **Metric artifacts mimic "emergence":** Exact-match accuracy on an $m$-token answer with independent per-token probability $p$ scales as $p^m$, turning smooth per-token gains into apparent cliffs on small eval sets.[^wei2022b][^schaeffer2023]
- **Non-dense architectures need their own variables:** For <span data-glossary="mixture-of-experts">MoE</span> ([lesson](/learn/mixture-of-experts-architecture)), total weights drive VRAM while active experts plus shared layers drive $6ND$ per-token compute; for [SSMs](/learn/state-space-models-mamba-alternatives), fixed recurrent state changes sequence scaling.
- **Inductive bias and exact invariants still matter:** Hardware-friendly priors (attention, RoPE, GQA) accelerate scaling without hard-coding answers,[^sutton2025] and exact invariants (cryptography, SQL schemas, permissions) always belong in deterministic code.

```mastery-quiz
[
  {
    "question": "A dense-projection training proxy counts forward, input-gradient and weight-gradient contractions. A 2B-parameter model processes 30B token presentations. Selective checkpointing is replaced by recomputing one complete counted forward pass. Ignoring other work, what ordinary and recomputed totals follow?",
    "options": [
      "Ordinary 1.2×10²⁰; recomputed 2.4×10²⁰ FLOPs.",
      "Ordinary 3.6×10²⁰; recomputed 7.2×10²⁰ FLOPs.",
      "Ordinary 3.6×10²⁰; recomputed 4.8×10²⁰ FLOPs.",
      "Ordinary 4.8×10²⁰; recomputed 6.0×10²⁰ FLOPs."
    ],
    "answer": "Ordinary 3.6×10²⁰; recomputed 4.8×10²⁰ FLOPs.",
    "explanation": "The three contractions contribute 6ND=3.6×10²⁰. One full forward recomputation adds 2ND, giving 8ND=4.8×10²⁰. Doubling the backward pass or treating the forward pass as the whole training cost counts the wrong work."
  },
  {
    "question": "A two-term scaling law is L=1+3/√N+6/√D with fixed ND=400. Which allocation minimizes this positive half-power surface?",
    "options": [
      "N=10, D=40.",
      "N=20, D=20.",
      "N=40, D=10.",
      "N=5, D=80."
    ],
    "answer": "N=10, D=40.",
    "explanation": "The equal-exponent balance gives D/N=(B/A)²=(6/3)²=4. Combining that with ND=400 gives N=10, D=40. Equal growth does not require equal counts; reversing the coefficient ratio or using it without the exponent changes the proposed shape."
  },
  {
    "question": "A positive two-penalty fit has parameter exponent α=0.6 and token exponent β=0.3. Under the same 6ND constraint and fixed coefficients, compute increases eightfold. What optimal parameter and token multipliers follow?",
    "options": [
      "Parameters 4×; tokens 2×.",
      "Parameters 2×; tokens 2×.",
      "Parameters 8×; tokens 1×.",
      "Parameters 2×; tokens 4×."
    ],
    "answer": "Parameters 2×; tokens 4×.",
    "explanation": "The parameter exponent on compute is β/(α+β)=1/3; the token exponent is α/(α+β)=2/3. Therefore 8^(1/3)=2 and 8^(2/3)=4. Their product is 8; equating the two allocation exponents or attaching α directly to N reverses the result."
  },
  {
    "question": "Two fitted loss curves, F(C)=2+4/√C and G(C)=8/3+16/(3C), both match the measurements L(4)=4 and L(16)=3. What does each curve predict at C=64, and what does the gap between their forecasts measure?",
    "options": [
      "F=2.75, G=2.50. The gap measures the effect of choosing a different curve.",
      "F=2.50, G=2.75. The gap measures the effect of choosing a different curve.",
      "F=2.50, G=2.75. The gap measures the variation in loss across repeated runs at C=64.",
      "F=2.75, G=2.50. The gap measures the variation in loss across repeated runs at C=64."
    ],
    "answer": "F=2.50, G=2.75. The gap measures the effect of choosing a different curve.",
    "explanation": "F uses the square root of 64, so F(64)=2+4/8=2.50. G uses 64 itself, so G(64)=8/3+16/192=2.75. Reversing the pair assigns the higher forecast to the wrong curve. Both curves fit the two measurements exactly, yet their forecasts differ by 0.25. Measuring run-to-run variation at 64 would require repeated runs there."
  },
  {
    "question": "Assume two candidates meet the same deployed quality requirement. A is 40B parameters trained on 800B tokens; B is 20B on 2T. Use 6ND training and 2N per processed inference token. Training costs twice as many dollars per useful FLOP as serving. At what processed demand do proxy FLOPs and modeled dollars break even?",
    "options": [
      "FLOPs 2.4T; dollars 1.2T tokens.",
      "FLOPs 1.2T; dollars 1.2T tokens.",
      "FLOPs 1.2T; dollars 2.4T tokens.",
      "FLOPs 0.6T; dollars 1.2T tokens."
    ],
    "answer": "FLOPs 1.2T; dollars 2.4T tokens.",
    "explanation": "A costs 1.92×10²³ training FLOPs; B costs 2.40×10²³. The premium 4.8×10²² divided by 40B saved FLOPs/token is 1.2T processed tokens. Doubling the relative training price doubles the dollar crossing to 2.4T. These are token volumes, not request counts."
  },
  {
    "question": "A full training run uses ND=900 units of work, where N is model size and D is token count. Along this curve, fitted loss is lowest at N=10, D=90 and rises as N moves away from 10 in either direction. You have 30 token units and cannot repeat tokens. Which full-budget allocation gives the lowest fitted loss? If model size is then capped at N=20, what is the most work the run can do under both caps?",
    "options": [
      "N=30, D=30. With both caps, the maximum is 600 units.",
      "N=45, D=20. With both caps, the maximum is 600 units.",
      "N=30, D=30. With both caps, the maximum is 900 units.",
      "N=45, D=20. With both caps, the maximum is 900 units."
    ],
    "answer": "N=30, D=30. With both caps, the maximum is 600 units.",
    "explanation": "With at most 30 token units, spending 900 requires N≥900/30=30. Loss rises as N increases beyond 10, so the smallest feasible N gives the lowest loss. Moving from 30-by-30 to 45-by-20 spends the same 900 units but raises the fitted loss. With both caps, the largest run uses 20×30=600 units. Spending 900 at N=20 would take 45 token units."
  },
  {
    "question": "A 6B model generates three complete 256-token candidates per query without early stopping. Count only dense generation arithmetic. A second configuration doubles candidate count at the same length. Which first-configuration FLOPs and second-configuration cost multiplier follow?",
    "options": [
      "4.608×10¹² FLOPs; 2× generation arithmetic.",
      "9.216×10¹² FLOPs; 1× generation arithmetic.",
      "1.8432×10¹³ FLOPs; 2× generation arithmetic.",
      "9.216×10¹² FLOPs; 2× generation arithmetic."
    ],
    "answer": "9.216×10¹² FLOPs; 2× generation arithmetic.",
    "explanation": "2 × 6×10⁹ × 256 × 3 = 9.216×10¹² FLOPs. Doubling to six equal-length candidates doubles that generation term (excluding prompt, attention, and verifier costs)."
  },
  {
    "question": "Use f=ΣUᵢVᵢ at input 1 and loss ½(f−1)². U alternates +1/−1 at even widths. With base η=0.25, standard Vᵢ=1/√n and both rates η. The coordinated alternative uses Vᵢ=1/n, input rate ηn, output rate η/n. Both gradients use old weights. What new predictions at n=32 and n=128 follow?",
    "options": [
      "Standard 0.5/0.5; coordinated 8.25/32.25.",
      "Standard 8.25/32.25; coordinated 0.5/0.5.",
      "Standard 8.25/32.25; coordinated 1.0/1.0.",
      "Standard 8.0/32.0; coordinated 0.25/0.25."
    ],
    "answer": "Standard 8.25/32.25; coordinated 0.5/0.5.",
    "explanation": "The standard result is η(n+1), giving 8.25 and 32.25. The coordinated two old-weight gradient contributions each add η, so the result is 2η=0.5 at either width. Dropping a layer contribution or confusing width stability with exactly reaching target 1 changes the result."
  },
  {
    "question": "A sparse Mixture-of-Experts (MoE) accounting model stores 96B total parameters at 2 bytes each. Per token, it executes 8B selected expert parameters plus 4B shared parameters. For 50B presentations, what total weight payload and active dense-projection 6ND proxy follow, excluding routing, attention and communication?",
    "options": [
      "24 GB weights; 3.6×10²¹ training FLOPs.",
      "192 GB weights; 2.88×10²² training FLOPs.",
      "192 GB weights; 3.6×10²¹ training FLOPs.",
      "16 GB weights; 2.4×10²¹ training FLOPs."
    ],
    "answer": "192 GB weights; 3.6×10²¹ training FLOPs.",
    "explanation": "Storage counts 96B×2=192 decimal GB. Active arithmetic uses 8B+4B=12B, so 6×12B×50B=3.6×10²¹. Counting all stored experts overstates the active dense term; using only selected experts omits shared layers."
  },
  {
    "question": "In an independent-token model, four answer tokens are independently correct with probability p each. Compare p=0.7 and p=0.8. A small exact-match evaluation reports 0 then 2 complete successes. Which expected whole-answer probabilities and interpretation follow?",
    "options": [
      "0.2401/0.4096. Small-sample counts alone are insufficient to infer a phase transition.",
      "0.7/0.8. Exact-match expectations equal token accuracy.",
      "0.2401/0.4096. The first nonzero count identifies a discontinuity.",
      "0.9919/0.9984. A small sample can jump from zero matches to two as token accuracy improves smoothly."
    ],
    "answer": "0.2401/0.4096. Small-sample counts alone are insufficient to infer a phase transition.",
    "explanation": "An exact match requires four correct tokens. Independence gives 0.7⁴=0.2401 and 0.8⁴=0.4096. The exact-match curve rises smoothly with p, yet a small evaluation sample can jump from 0 hits to 2 hits without any underlying discontinuity."
  }
]
```

> **Next:** Continue to [Pre-training Data at Scale](/learn/pre-training-data-pipelines-scale).
