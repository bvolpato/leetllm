---
{
  "id": "mechanistic-interpretability-sparse-autoencoders",
  "title": "Mechanistic Interpretability",
  "slug": "mechanistic-interpretability-sparse-autoencoders",
  "section": "Transformer & Multimodal Architectures",
  "category": "Transformer Architecture",
  "difficulty": "Hard",
  "order": 9,
  "prerequisites": [
    "layer-normalization-pre-ln-post-ln"
  ],
  "coverImage": "illustrations/_generated/sae_architecture_dark.png",
  "companies": [
    "Anthropic",
    "OpenAI",
    "Google DeepMind",
    "Meta",
    "Redwood Research",
    "EleutherAI"
  ],
  "shortDescription": "One neuron can fire for credentials and for urgency at once. Sparse autoencoders look for narrower directions you can trace and test.",
  "keyConceptsTested": [
    "Polysemanticity and superposition in neural networks",
    "Johnson-Lindenstrauss lemma and high-dimensional geometry",
    "Sparse autoencoder architecture and training objective",
    "Tied vs untied decoders and L1 shrinkage mitigation",
    "TopK, Gated, and JumpReLU SAE architectures",
    "Loss Recovered and L0 sparsity Pareto frontier",
    "Feature absorption and dead latent tracking with AuxK loss",
    "Attribution graphs and cross-layer transcoders",
    "Activation steering and error-preserving feature clamping",
    "Toy NumPy implementation of dictionary learning"
  ]
}
---

A coding assistant refuses a harmless password-reset script. You inspect its internal activations to find out why: did it react to the word "password," the urgent phrasing, or the shell syntax? Neuron 412 fires for all three. Neuron 789 fires on secret-manager docs and SQL queries alike. Reading individual neurons tells you almost nothing, because a single coordinate participates in many unrelated concepts at once.

This phenomenon is **polysemanticity**, and the **<span data-glossary="superposition">superposition hypothesis</span>** explains why it happens: a transformer represents far more concepts than it has neurons by packing them into slightly non-orthogonal directions across its high-dimensional activation space.[^elhage2022] **<span data-glossary="sparse-autoencoder">Sparse autoencoders (SAEs)</span>** tackle that puzzle with overcomplete dictionary learning, decomposing a dense activation vector into a sparse combination of wider candidate directions that you can inspect, steer, and test causally.[^bricken2023][^cunningham2023sae]

```checkpoint
Why can one neuron fire for credential reset, malicious intent, and urgent tone at the same time?
---
Under superposition, concepts share overlapping non-orthogonal directions instead of dedicating one axis per concept. A single neuron coordinate responds to several directions at once, making raw neurons poor units for explanation.
```

## The problem: polysemantic neurons and superposition

An ambient space $\mathbb{R}^D$ holds at most $D$ mutually orthogonal unit vectors. Yet a language model tracks millions of concepts inside a residual stream of width $D = 4{,}096$. High-dimensional geometry gives it an escape hatch: by concentration bounds related to the **Johnson-Lindenstrauss lemma**,[^johnson1984] a $D$-dimensional space can pack exponentially many *nearly* orthogonal unit directions ($|d_i^T d_j| \le \epsilon$):

$$
\Pr\!\left[\max_{i\ne j}|d_i^Td_j|>\epsilon\right] \le M(M-1)e^{-D\epsilon^2/2}
$$

When features are **sparse** (only a few concepts fire on any given token), packing them with small pairwise overlap $\mu = \max_{i\ne j}|d_i^T d_j|$ works because interference stays bounded by $|d_j^T x| \le \mu \sum_{i \in S} |a_i|$ for any inactive feature $j$.[^elhage2022] Still, small overlaps accumulate: two active directions with magnitude `10` and overlap `0.1` leak `2.0` onto an inactive axis, enough to trip a threshold of `1.0`. Even in two dimensions, two directions at cosine `0.80` (credential `[1, 0]` and urgency `[0.8, 0.6]`) both project onto axis A, raising it from `1.5` to `2.3` so a scalar threshold cannot tell strong credentials apart from credentials plus urgency.

<figure>
  <img
    src="illustrations/_generated/superposition_geometry_dark.png"
    alt="Equal-scale coordinate diagram for a mixed activation vector. A credential direction c=[1,0] contributes 1.5c=[1.5,0]. The urgency direction u=[0.8,0.6] starts at that endpoint and finishes at x=[2.3,0.6]. A dashed origin-to-result vector shows both feature contributions sharing coordinate 1, whose value is 1.5 + 0.8 = 2.3."
  />
  <figcaption>Credential and urgency directions both project onto raw axis A, lifting it from 1.5 to 2.3 when both fire together.</figcaption>
</figure>

Note that polysemantic coordinates can also arise from a rotated orthogonal basis without storing more features than dimensions, so polysemanticity motivates superposition rather than establishing it on its own.

## How sparse autoencoders produce candidate features

An SAE maps a dense activation $x \in \mathbb{R}^D$ into a much wider, sparse latent code $z \in \mathbb{R}^M$ ($M \gg D$) and reconstructs $x$ from active dictionary columns $d_i = W_\text{dec}[:, i]$:[^bricken2023]

$$
z = f\!\bigl(W_\text{enc}(x - b_\text{dec}) + b_\text{enc}\bigr), \qquad \hat{x} = W_\text{dec} z + b_\text{dec}
$$

- **Tied vs. untied decoders:** Tying $W_\text{dec} = W_\text{enc}^T$ saves parameters, while untied weights let the encoder specialize in sharp interference-rejecting detection and the decoder specialize in clean reconstruction.[^bricken2023][^cunningham2023sae] **Tied initialization** ($W_\text{enc} \leftarrow W_\text{dec}^T$ at step 0, then trained freely) gives the best of both worlds.[^gao2024sae]
- **Unit-norm decoder columns:** After every update, renormalize $\|W_\text{dec}[:, i]\|_2 = 1$. Otherwise an L1-penalized SAE cheats by shrinking $z$ toward zero while inflating $W_\text{dec}$ to keep $\hat{x}$ unchanged!

<figure>
  <img src="illustrations/_generated/sae_architecture_dark.png" alt="A sparse autoencoder turns an 8-dimensional activation into a 64-slot feature code with 19 active cells, then decodes it back to 8 dimensions. The encoder matrix is 64 by 8 and the decoder matrix is 8 by 64; an L1 training penalty encourages sparse codes." />
  <figcaption>An overcomplete SAE maps $x \in \mathbb{R}^8$ into 64 sparse ReLU latents (19 active here) and reconstructs $x$ via the decoder columns.</figcaption>
</figure>

### The L1 shrinkage problem and modern SAE variants

Classic SAEs minimize reconstruction MSE plus an L1 penalty:

$$
\mathcal{L} = \frac{\|x - \hat{x}\|_2^2}{D} + \lambda \frac{\|z\|_1}{M}
$$

The catch is **L1 shrinkage**: even when the right feature fires, L1 pulls its magnitude downward. In 1D with a unit decoder, minimizing $(a - z)^2 + \lambda z$ for $z \ge 0$ shrinks the true magnitude $a$ to $z^* = \max(0, a - \lambda/2)$. Three modern architectures solve shrinkage directly:

| Architecture | Mechanism | Why it helps |
|---|---|---|
| **TopK SAE**[^gao2024sae] | Keeps only the $k$ largest nonnegative latents; omits main L1 | Enforces exact $L_0 \le k$ without direct L1 shrinkage; pairs with AuxK to revive dead latents |
| **Gated SAE**[^rajamanoharan2024gated] | Splits binary detection gate (with L1) from nonnegative magnitude path | Removes direct L1 shrinkage on active feature magnitudes |
| **JumpReLU SAE**[^rajamanoharan2024jumprelu] | $\text{JumpReLU}(y, \theta) = y\,\mathbf{1}(y > \theta)$ with learned thresholds + $L_0$ penalty | Preserves full pre-activation above threshold using windowed straight-through gradients |

Scaling dictionary width from 4,096 latents on a 1-layer model[^bricken2023] to 34 million latents on Claude 3 Sonnet[^templeton2024] surfaced crisp candidate features for code vulnerabilities, DNA sequences, sycophancy, and multilingual concepts.

## Where to attach SAEs and how circuits connect them

SAEs attach at specific **hook points**: the **residual stream** (accumulated shared trunk), **MLP outputs** (nonlinear sublayer writes), or **attention outputs** (cross-token routing). A pretrained dictionary is tightly bound to its exact checkpoint, layer, normalization point, and scaling convention.[^cunningham2023sae][^marks2024featurecircuits]

Connecting features across layers yields **feature circuits**: sparse subgraphs linking early detectors through downstream layers to output logits (extending head-level discoveries such as induction heads,[^olsson2022] indirect-object identification,[^wang2022ioi] and greater-than comparison[^hanna2023greater]). Modern **attribution graphs** replace MLP layers with **cross-layer transcoders (CLTs)** (where a feature reads one residual layer and writes to multiple downstream MLP outputs), freeze attention patterns and norm denominators for a prompt, add back reconstruction error as constants, and compute direct edges $\text{Attr}(u \to v) = z_u \frac{\partial a_v}{\partial z_u}$ to surface candidate circuits.[^ameisen2025CircuitTracing][^lindsey2025biology]

<figure>
  <img src="illustrations/_generated/feature_circuit_dark.png" alt="Worked linear readout s = Σzᵢwᵢ with feature contributions credential cue 0.90 × 1.20 = +1.08, urgency cue 0.80 × 0.10 = +0.08, and formatting cue 0.70 × 0 = 0, summing to 1.16. Removing the credential cue reduces the score to 0.08; removing the zero-weight formatting cue leaves the score at 1.16." />
  <figcaption>A linear refusal readout: ablating the credential cue drops the score from 1.16 to 0.08, whereas ablating the correlated but zero-weight formatting cue leaves it unchanged at 1.16.</figcaption>
</figure>

## Activation steering and error-preserving ablation

Because each decoder column $d_f = W_\text{dec}[:, f]$ points along a direction in residual space, you can steer behavior at inference time without touching weights by adding $x_{\text{steered}} = x + \alpha d_f$ (as in Anthropic's Golden Gate Bridge steering or Arditi et al.'s refusal directions).[^templeton2024][^arditi2024refusal] Watch for two subtleties:
1. **Collateral drift:** Moving along $d_f$ leaves orthogonal axes unchanged, but drags any non-orthogonal overlapping direction along with it.
2. **Clamping is not an encoder fixed point:** Setting one coefficient via $x' = x + (c - z_f(x)) d_f$ edits the cached decomposition, yet re-encoding $x'$ need not equal $c$ when encoder and decoder are untied.

<figure>
  <img src="illustrations/_generated/steering_sweep_dark.png" alt="Side-by-side activation sweep diagram for x′ = [0.2, 0.1] + α[0, 1] at α = −1, 0, +1, +2. Left: equal-unit 2D vector space showing the sweep path alongside candidate [0, 1], overlapping [0.6, 0.8], and orthogonal [1, 0] directions. Right: line chart and projection table showing dot products: candidate −0.9, 0.1, 1.1, 2.1; overlap −0.6, 0.2, 1.0, 1.8; orthogonal 0.2 across all steps." />
  <figcaption>Sweeping $\alpha \in \{-1, 0, +1, +2\}$ along $[0, 1]$ leaves orthogonal $[1, 0]$ fixed at 0.20 while pulling overlapping $[0.6, 0.8]$ from $-0.60$ to $+1.80$.</figcaption>
</figure>

### Keep reconstruction error separate from feature ablation

Every SAE leaves an unexplained residual $e = x - \hat{x}$, so $x = \hat{x} + e$. To test feature $f$'s causal role, always use **error-preserving ablation**:

$$
x' = x - z_f d_f \qquad (\text{NOT } \hat{x} - z_f d_f)
$$

Naive ablation (`x_hat - z_f d_f`) simultaneously deletes the unexplained residual $e$! If a downstream readout depends on $e$, even an SAE with tiny MSE (`0.005`) can falsely drop the readout from `10.0` to `0.0` and trick you into thinking feature $f$ caused the drop. Similarly, for gradient-based attribution, always freeze the residual with `error.detach()`, because in `decoded + (original - decoded)` the live gradients of `decoded` cancel to exact zero![^marks2024featurecircuits]

<figure>
  <img src="illustrations/_generated/feature_visualization_dark.png" alt="Equal-scale vector diagram for readout s(v) = 100v₂. The input x = [1, 0.1] separates into reconstruction x-hat = [1, 0] and residual e = [0, 0.1], where the residual carries score 10. Subtracting d1 = [1, 0] from x-hat leaves [0, 0] and score 0; subtracting d1 from x leaves e = [0, 0.1] and score 10." />
  <figcaption>Naive ablation deletes the residual $e = [0, 0.1]$ and collapses the score from 10 to 0. Error-preserving ablation keeps $e$ intact and reveals feature 1 has zero causal effect.</figcaption>
</figure>

<!-- leetllm: test, deps=torch, output=show -->
```python title="error-preserving-ablation-and-grad.py"
import torch

x = torch.tensor([1.0, 0.1], dtype=torch.float64)
direction = torch.tensor([1.0, 0.0], dtype=torch.float64)
z = torch.tensor([1.0], dtype=torch.float64, requires_grad=True)
readout = torch.tensor([3.0, 100.0], dtype=torch.float64)

decoded = z[0] * direction
error = x - decoded

# 1. Error-preserving vs naive ablation on a readout sensitive to coordinate 1
r_only_e = torch.tensor([0.0, 100.0], dtype=torch.float64)
print(f"error-preserving ablation: {((x - decoded.detach()) @ r_only_e).item():.1f} (true)")
print(f"naive ablation (drops e):  {((decoded.detach() - decoded.detach()) @ r_only_e).item():.1f} (confounded!)")

# 2. Gradient cancellation if error is not detached
live_g = torch.autograd.grad((decoded + error) @ readout, z, retain_graph=True)[0]
fixed_g = torch.autograd.grad((decoded + error.detach()) @ readout, z)[0]
print(f"live error grad={live_g.item():.1f} vs detached error grad={fixed_g.item():.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
error-preserving ablation: 10.0 (true)
naive ablation (drops e):  0.0 (confounded!)
live error grad=0.0 vs detached error grad=3.0
```
<!-- leetllm: output:end -->

When evaluating SAE fidelity inside a language model, report **Loss Recovered** alongside raw $\Delta\mathcal{L} = \mathcal{L}_\text{SAE} - \mathcal{L}_\text{clean}$:

$$
\text{Loss Recovered} = 1 - \frac{\mathcal{L}_\text{SAE} - \mathcal{L}_\text{clean}}{\mathcal{L}_\text{ablated} - \mathcal{L}_\text{clean}}
$$

Watch the denominator: with $\mathcal{L}_\text{clean} = 2.0$ and $\mathcal{L}_\text{SAE} = 2.2$, a destructive zero-ablation baseline ($\mathcal{L}_\text{ablated} = 20.0$) reports `98.9%` recovered, while a milder mean-ablation baseline (`2.4`) reports only `50.0%` for the exact same `0.2` loss increase![^gao2024sae]

## A toy NumPy SAE you can run today

Let's pack **24 unit directions** into an **8-dimensional** space, generate 768 sparse linear combinations (2–4 active directions per vector), and train a 64-latent ReLU SAE from scratch in NumPy. Then check three separate things: training MSE, held-out Fraction of Variance Unexplained (FVU), and whether the learned decoder columns actually aligned with the 24 ground-truth directions:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="toy-numpy-sae.py"
import numpy as np

rng = np.random.default_rng(42)
d_model, n_true, n_samples, n_latents = 8, 24, 768, 64

true_dirs = rng.normal(size=(n_true, d_model))
true_dirs /= np.linalg.norm(true_dirs, axis=1, keepdims=True)

def make_batch(r, count):
    data = np.zeros((count, d_model))
    for i in range(count):
        idx = r.choice(n_true, size=r.integers(2, 5), replace=False)
        data[i] = (r.normal(1.5, 0.4, size=len(idx))[:, None] * true_dirs[idx]).sum(axis=0)
    return data + 0.03 * r.normal(size=data.shape)

X_train = make_batch(rng, n_samples)
X_test = make_batch(np.random.default_rng(123), 256)

W_enc = rng.normal(scale=0.1, size=(n_latents, d_model))
b_enc = np.zeros(n_latents)
W_dec = rng.normal(scale=0.1, size=(d_model, n_latents))
W_dec /= np.linalg.norm(W_dec, axis=0, keepdims=True) + 1e-12
init_W_dec = W_dec.copy()
b_dec = np.zeros(d_model)

lr, lam = 0.03, 5.0
for epoch in range(300):
    pre = X_train @ W_enc.T + b_enc
    z = np.maximum(0.0, pre)
    x_hat = z @ W_dec.T + b_dec
    recon = np.mean((X_train - x_hat) ** 2)
    l1 = np.mean(np.abs(z))
    if epoch % 100 == 0:
        print(f"Epoch {epoch:3d} | total={recon + lam*l1:.4f} | recon={recon:.4f} | L1={l1:.4f}")

    d_recon = 2.0 * (x_hat - X_train) / X_train.size
    dW_dec, db_dec = d_recon.T @ z, d_recon.sum(axis=0)
    dz = d_recon @ W_dec + (lam / z.size) * np.sign(z)
    dz[pre <= 0] = 0.0
    W_dec -= lr * dW_dec; b_dec -= lr * db_dec
    W_enc -= lr * (dz.T @ X_train); b_enc -= lr * dz.sum(axis=0)
    W_dec /= np.linalg.norm(W_dec, axis=0, keepdims=True) + 1e-12

z_test = np.maximum(0.0, X_test @ W_enc.T + b_enc)
test_mse = np.mean((X_test - (z_test @ W_dec.T + b_dec)) ** 2)
fvu = test_mse / np.mean((X_test - X_train.mean(axis=0)) ** 2)

def median_align(W):
    cols = W.T / (np.linalg.norm(W.T, axis=1, keepdims=True) + 1e-12)
    return float(np.median(np.abs(true_dirs @ cols.T).max(axis=1)))

print(f"Held-out MSE={test_mse:.3f}, FVU={fvu:.3f}, active={float((z_test > 0).sum(1).mean()):.1f}/64")
print(f"Median max |cosine| to ground truth: {median_align(init_W_dec):.3f} -> {median_align(W_dec):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Epoch   0 | total=1.9426 | recon=1.4259 | L1=0.1033
Epoch 100 | total=0.5301 | recon=0.2370 | L1=0.0586
Epoch 200 | total=0.4394 | recon=0.1564 | L1=0.0566
Held-out MSE=0.128, FVU=0.169, active=19.5/64
Median max |cosine| to ground truth: 0.798 -> 0.799
```
<!-- leetllm: output:end -->

> **Key insight:** Look closely at that output! Reconstruction MSE dropped more than 90% (`1.426 -> 0.128`, held-out FVU `0.169`), yet median cosine alignment to the 24 ground-truth directions barely moved (`0.798 -> 0.799`) and `19.5` latents fired per sample instead of 2–4. **Low reconstruction error never guarantees true feature recovery.**

<figure>
  <img src="illustrations/_generated/sae_training_tradeoff_dark.png" alt="A toy SAE training trace plots reconstruction MSE 1.4259, 0.2370, 0.1564 and weighted L1 contribution 0.5167, 0.2931, 0.2830 at epochs 0, 100, 200. The completed 300-epoch run reports MSE 0.128 and 18.9 active latents of 64; held-out results are MSE 0.128, FVU 0.169, and 19.5 active latents. Median best absolute cosine against known generating directions changes only from 0.798 to 0.799." />
  <figcaption>Training MSE plunges from 1.426 to 0.128 (held-out FVU 0.169), while median alignment to the 24 true directions moves only from 0.798 to 0.799.</figcaption>
</figure>

## Practical pitfalls: dead latents, absorption, and null baselines

Four structural failure modes separate toy demos from trustworthy interpretability:

- **Dead latents:** Units that never fire across millions of tokens waste dictionary capacity. Recipes revive them either via **resampling** onto high-loss input directions[^bricken2023] or via OpenAI's **AuxK loss**, which trains inactive latents to predict the main reconstruction residual $e = x - \hat{x}$.[^gao2024sae]
- **Feature absorption:** When a specific concept ("Paris") always implies a general concept ("capital city"), a single decoder direction pointing along `parent + child` reconstructs `[1, 1]` using only **1 active latent** instead of 2, winning the sparsity objective while blinding the generic detector on every Paris prompt![^chanin2024absorption]
- **Feature splitting & non-identifiability:** Wider SAEs split one concept into finer sub-features, and two independent seeds can achieve identical MSE with different feature indices.[^templeton2024]
- **Null-model baselines & verbalizers:** Heap et al. showed that SAEs trained on randomized or initialization Pythia checkpoints can look surprisingly strong on aggregate automated-interpretability scores, underscoring the need for null-model controls.[^heap2026SAENullModels] Likewise, **natural language autoencoders** (activation $\to$ text $\to$ activation) generate useful hypotheses, but their verbalizers can hallucinate beyond what the activation actually encodes.[^anthropicNLA2026]

## Validate one feature claim

Before naming a latent "the refusal feature" or using it for safety monitoring, run a full causal check: inspect activations across held-out prompts (including translations and counterexamples), state a behavioral prediction, run **error-preserving** ablation or steering alongside matched negative controls, and verify that collateral capabilities stay intact.

```mastery-quiz
[
  {
    "question": "A finite-point embedding has verified distortion below epsilon on all pairs. A team then claims this guarantees recovery of every sparse feature mixture in a transformer. What follows from the JL result itself?",
    "options": [
      "Exact sparse coefficients; finite-point distances then follow from reconstructed latent labels.",
      "Approximate finite-point distances; linear maps at that width inherit the same distortion bound.",
      "Approximate finite-point distances; sparse feature recovery needs additional assumptions and evidence.",
      "Exact learned concepts; sparse feature recovery follows from the model’s residual width."
    ],
    "answer": "Approximate finite-point distances; sparse feature recovery needs additional assumptions and evidence.",
    "explanation": "JL is a finite-point distance-preservation result. Related high-dimensional geometry motivates superposition; identify learned features and test recovery of overlapping signals with model-specific probes and interventions."
  },
  {
    "question": "An untied sparse autoencoder maps 12 activation coordinates to 48 latent slots. It uses column vectors and zero biases. For one slot, how do you compute its score before the activation function and find the direction it writes during reconstruction?",
    "options": [
      "Score the input with an encoder column. Write along the matching decoder row.",
      "Score the input with an encoder row. Write along the matching decoder column.",
      "Score the input with a decoder column. Write along the matching encoder row.",
      "Score the input with a decoder row. Write along the matching encoder column."
    ],
    "answer": "Score the input with an encoder row. Write along the matching decoder column.",
    "explanation": "Each encoder row takes a dot product with the 12 input coordinates to score one slot. The 48 decoder columns form an overcomplete dictionary. Each active slot scales its column to write a 12-coordinate contribution. An encoder column and a decoder row each have 48 entries, so neither can serve as a 12-coordinate vector. Using a decoder column to score and an encoder row to write swaps two vectors of the right length."
  },
  {
    "question": "An encoder entry and its transposed decoder entry both start at 0.40. In each of two SAE runs, one training step raises the encoder entry by 0.15. The optimizer makes no separate update to the decoder. What are the two decoder values after this step, first for tied weights and then for tied initialization only?",
    "options": [
      "0.55 and 0.40",
      "0.40 and 0.55",
      "0.55 and 0.55",
      "0.40 and 0.40"
    ],
    "answer": "0.55 and 0.40",
    "explanation": "The encoder entry reaches 0.55. With tied weights the decoder reads that same parameter at the transposed position. With tied initialization the decoder has its own copy, which stays at 0.40 on this step. Raising both decoder entries treats an initial copy as a lasting constraint. Leaving both at 0.40 overlooks the shared parameter. Raising just the second one reverses the two rules."
  },
  {
    "question": "In the one-dimensional unit-decoder loss (2-z)^2+lambda*z, z>=0 and lambda=1, what optimum and support result follow?",
    "options": [
      "z=0.0; a magnitude penalty removes the positive coefficient at this penalty.",
      "z=2.0; the magnitude penalty controls whether the entry is active.",
      "z=1.0; the optimum subtracts the whole penalty weight from the target.",
      "z=1.5; magnitude shrinks while the one-entry support remains active."
    ],
    "answer": "z=1.5; magnitude shrinks while the one-entry support remains active.",
    "explanation": "For z>0, derivative 2(z-2)+1=0 gives 1.5. Support stays one. The loss convention determines the shrinkage coefficient; TopK instead caps support without this main-path L1 magnitude term."
  },
  {
    "question": "Clean downstream loss is 3, SAE-substitution loss 3.5 and specified ablation loss 8. What is Loss Recovered, and what raw damage must remain visible?",
    "options": [
      "93.75% recovered; raw substitution damage 0.5.",
      "50% recovered; raw substitution damage 5.0.",
      "90% recovered; raw substitution damage 0.5.",
      "10% recovered; raw substitution damage 3.5."
    ],
    "answer": "90% recovered; raw substitution damage 0.5.",
    "explanation": "1-(3.5-3)/(8-3)=0.9. The ratio depends on the chosen ablation baseline; raw substitution damage is 0.5. It does not identify semantic features."
  },
  {
    "question": "An activation is [3, 0.06], reconstruction is [3, 0], and the removed feature contribution is [3, 0]. The score is 50 times coordinate 2. What does error-preserving ablation produce?",
    "options": [
      "[0,0] and score 0; preserving error means discarding the unexplained coordinates.",
      "[0,0.06] and score 3; editing the reconstruction would also discard the residual.",
      "[3,0] and score 0; feature removal targets the small residual coordinate.",
      "[0,0.06] and score 3; preserving error means making no activation edit."
    ],
    "answer": "[0,0.06] and score 3; editing the reconstruction would also discard the residual.",
    "explanation": "Subtract only [3, 0] from the original activation to obtain [0, 0.06]. Its score remains 3. Subtracting from the reconstruction instead gives [0, 0], confounding the feature edit with residual loss."
  },
  {
    "question": "A specialized sparrow latent reconstructs both bird and sparrow coordinates while the generic bird detector stays silent. Reconstruction remains exact with fewer active entries. What diagnosis fits?",
    "options": [
      "Absorption: the specialized direction also writes the broader concept, hiding generic-detector recall.",
      "Splitting: the broader concept partitions among specialized active slots, each reconstructing part of it.",
      "Scale degeneracy: larger decoder norms offset smaller coefficients while leaving the support unchanged.",
      "Dead capacity: competing features leave inactive encoder parameters without a useful learning signal."
    ],
    "answer": "Absorption: the specialized direction also writes the broader concept, hiding generic-detector recall.",
    "explanation": "A specialized latent's decoder can write the broader direction too, allowing fewer active slots while the generic detector stays silent on those examples. Good reconstruction and pure-looking top activations can conceal lost recall."
  },
  {
    "question": "A TopK sparse autoencoder receives $[5,-2]$. Its main pass uses all $k$ slots allowed by the support cap and reconstructs $[3,1]$. Which vector should the selected inactive slots learn to reconstruct in the separate AuxK pass?",
    "options": [
      "$[3,1]$",
      "$[5,-2]$",
      "$[-2,3]$",
      "$[2,-3]$"
    ],
    "answer": "$[2,-3]$",
    "explanation": "The main pass needs 2 more in the first coordinate and 3 less in the second. AuxK trains selected inactive slots to supply that missing vector while the main pass keeps its support cap. Using $[3,1]$ repeats the main reconstruction. Using $[5,-2]$ targets the whole input. Resampling can use that input to initialize a direction. The vector $[-2,3]$ reverses the subtraction."
  },
  {
    "question": "At the hook where an SAE was trained, the cached activation is $[-0.4,0.2,0.7,0.3]$. Feature 17's decoder direction is $[0.6,0.0,0.0,-0.8]$. If you steer with $\\alpha=1.5$ using $x+\\alpha W_{\\text{dec}}[:,17]$, what activation is passed onward?",
    "options": [
      "$[1.1,1.7,2.2,1.8]$",
      "$[0.2,0.2,0.7,-0.5]$",
      "$[0.5,0.2,0.7,-0.9]$",
      "$[0.9,0.0,0.0,-1.2]$"
    ],
    "answer": "$[0.5,0.2,0.7,-0.9]$",
    "explanation": "Scaling the direction by 1.5 gives $[0.9,0.0,0.0,-1.2]$. This is the edit. Add it to the cached activation to get $[0.5,0.2,0.7,-0.9]$. The result starting with 1.1 adds the scale to every coordinate. The result starting with 0.2 adds the direction at unit scale."
  },
  {
    "question": "Two SAEs trained independently at the same hook have equally low reconstruction error. On held-out prompts, adding the unit decoder vector for slot 12 in run A raises a score by 0.40 on average. Slot 7 in run B fires in the most similar contexts. For each run B candidate, you measure its signed cosine with A's direction and the mean score change when you add its unit vector on those prompts. Which slot best matches the direction and effect of A's edit?",
    "options": [
      "Use slot 12 (cosine +0.18, score change +0.39).",
      "Use slot 31 (cosine +0.96, score change +0.39).",
      "Use slot 7 (cosine +0.96, score change +0.05).",
      "Use slot 23 (cosine -0.99, score change -0.39)."
    ],
    "answer": "Use slot 31 (cosine +0.96, score change +0.39).",
    "explanation": "Slot 31 points nearly the same way and produces a similar score increase on these prompts. Slot 12 has the same index and a similar score change, but its direction aligns poorly. Slot 7 fires in similar contexts and aligns closely, but its edit barely raises the score. Slot 23 has the largest absolute cosine and writes in the opposite direction, lowering the score. Equal reconstruction error gives no way to choose among these slots."
  }
]
```

> **Next:** Continue to [Scaling Laws & Compute-Optimal Training](/learn/scaling-laws-compute-optimal-training).
