---
{
  "id": "mechanistic-interpretability-sparse-autoencoders",
  "title": "Mechanistic Interpretability",
  "slug": "mechanistic-interpretability-sparse-autoencoders",
  "section": "Transformer Deep Dives",
  "category": "Transformer Architecture",
  "difficulty": "Hard",
  "order": 7,
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

Imagine a code assistant that refuses a legitimate password-reset script without signaling whether it reacted to credentials, urgent wording, or formatting. Suppose neuron 412 activates across credential resets, SQL queries, and urgent instructions, while neuron 789 fires on secret-manager manuals and shell syntax. Because both units mix unrelated concepts in a single scalar output, inspecting their raw values gives no clear reason for the refusal. That mixture is **polysemanticity**: one neuron participates in several distinct computations, so a raw coordinate rarely isolates a single human-interpretable idea.

Mechanistic interpretability asks how the network computed that refusal when individual neuron coordinates do not separate the competing causes. While [the previous chapter](/learn/layer-normalization-pre-ln-post-ln) showed how <span data-glossary="layernorm">layer normalization</span> changes the vector scale read by transformer branches, normalization alone says nothing about what individual directions compute. To explain why polysemanticity arises, researchers rely on the **<span data-glossary="superposition">superposition hypothesis</span>**: models represent far more features than they have dimensions by packing them into overlapping, non-orthogonal directions. Sparse autoencoders (SAEs) search for candidate directions inside those mixtures by reconstructing a dense activation as a sparse linear combination of learned dictionary vectors that can then be tested experimentally.

```checkpoint
Why can one neuron fire for credential reset, malicious intent, and urgent tone at the same time?
---
Under the superposition hypothesis, useful concepts share overlapping directions instead of separate coordinate axes. A neuron can respond to several of those directions at once, which makes it a weak unit for assigning human labels. The next step is to find more useful candidate units and test them experimentally.
```

Mechanistic interpretability researchers train **<span data-glossary="sparse-autoencoder">sparse autoencoders (SAEs)</span>**, networks that reconstruct language model activations through a wide, sparse bottleneck, to search for these underlying feature directions.[^bricken2023][^cunningham2023sae] Bricken et al. and Cunningham et al. found features with clearer activation patterns than comparison directions in their experiments, including candidates responsive to credential-related instructions or urgent wording.[^bricken2023][^cunningham2023sae] Even so, a feature label and its computational role remain separate hypotheses: a targeted intervention can show an effect on behavior without proving that the label captures every context in which the feature fires.

Reconstruction and causality are distinct claims. A feature can help reconstruct activations while tracking a grammatical correlate of the behavior you care about. Controlled patching, ablation, and steering test the consequences of a specified edit. Held-out prompts, control edits, and collateral-capability measurements determine how far that result supports your explanation.

## The problem: polysemantic neurons and superposition

Inside a <span data-glossary="transformer">transformer</span>, residual-stream vectors and MLP hidden activations carry dense mixtures of information across a shared representation space. An ambient space $\mathbb{R}^D$ holds at most $D$ mutually orthogonal unit vectors, which caps an orthogonal linear dictionary at one activation site. Yet a model tracking $M \gg D$ concepts across layers, nonlinear computations, and context-dependent representations cannot afford to reserve an orthogonal basis axis for every feature. Instead, packing directions slightly non-orthogonally lets one layer represent far more concepts than it has raw dimensions.

The **Johnson-Lindenstrauss lemma** concerns a finite set of $N$ points: a suitable linear map into $D = O(\epsilon^{-2}\log N)$ dimensions preserves all pairwise squared Euclidean distances within factors $1\pm\epsilon$.[^johnson1984] Related concentration arguments let high-dimensional spaces hold many unit directions with small pairwise inner products. For example, draw each direction independently with coordinates $\pm1/\sqrt D$. A concentration bound and a union bound give

$$
\Pr\left[\max_{i\ne j}|d_i^Td_j|>\epsilon\right]
\le M(M-1)e^{-D\epsilon^2/2}.
$$

Keeping the right side below a chosen failure probability lets $M$ grow exponentially with $D$ for fixed $\epsilon$. The bound can be loose or exceed one. It describes this random construction, not the exact capacity of a 4,096-dimensional residual stream or proof that a trained transformer uses such a packing.

**Feature sparsity** reduces interference in toy models of superposition.[^elhage2022] Residual interference follows the coherence overlap bound: for unit directions with maximum pairwise overlap $\mu=\max_{i\ne j}|d_i^T d_j|$ and active sum $x=\sum_{i\in S}a_i d_i$, an inactive direction's readout obeys $|d_j^T x|\le\mu\sum_{i\in S}|a_i|$ for $j\notin S$. Because each active direction's leakage adds up in proportion to its magnitude and active count, even tiny pairwise overlaps accumulate quickly across large activations. As the check below shows, two directions overlapping an inactive axis by only $0.1$ each with magnitude $10$ produce a $2.00$ readout that triggers a detection threshold of $1$.

<!-- leetllm: test, output=show -->
```python title="small-pairwise-overlaps-accumulate.py"
import math

def dot(left, right):
    return sum(a * b for a, b in zip(left, right))

inactive = [1.0, 0.0, 0.0]
active_directions = [[0.1, math.sqrt(0.99), 0.0],
                     [0.1, 0.0, math.sqrt(0.99)]]
magnitudes = [10.0, 10.0]
x = [sum(a * d[index] for a, d in zip(magnitudes, active_directions))
     for index in range(3)]
leakage = dot(inactive, x)
bound = 0.1 * sum(magnitudes)
print(f"inactive readout: {leakage:.2f}; coherence bound: {bound:.2f}")
print("threshold 1 falsely activates:", leakage > 1.0)
assert math.isclose(leakage, bound)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
inactive readout: 2.00; coherence bound: 2.00
threshold 1 falsely activates: True
```
<!-- leetllm: output:end -->

Such packing produces polysemantic coordinates whenever several non-orthogonal directions project onto one axis. However, polysemanticity alone does not prove superposition, because even a rotated orthogonal dictionary mixes concepts across coordinates without storing more features than dimensions. Residual coordinates and MLP neurons also behave differently in practice, since MLP activation functions introduce coordinate-specific nonlinearities that penalize rotation away from neuron axes.

<figure>
  <img
    src="illustrations/_generated/superposition_geometry_dark.png"
    alt="Equal-scale coordinate diagram for a mixed activation vector. A credential direction c=[1,0] contributes 1.5c=[1.5,0]. The urgency direction u=[0.8,0.6] starts at that endpoint and finishes at x=[2.3,0.6]. A dashed origin-to-result vector shows both feature contributions sharing coordinate 1, whose value is 1.5 + 0.8 = 2.3."
  />
  <figcaption>
    The credential and urgency directions both project onto raw axis A. Their linear combination raises that coordinate from the credential-only value $1.5$ to $2.3$, so a high neuron activation conflates strong credential presence with a credential-plus-urgency mixture.
  </figcaption>
</figure>

To make that geometric interference measurable, the calculation below computes the <span data-glossary="cosine-similarity">cosine similarity</span> between two candidate directions and constructs their combined activation. Because both directions project onto coordinate A with positive weight, firing both at once lifts that axis reading from $1.50$ to $2.30$. A simple scalar threshold on coordinate A therefore cannot distinguish a strong credential signal from a joint credential and urgency mixture.

<!-- leetllm: test, output=show, output_title="Overlapping directions" -->
```python title="nonorthogonal-directions-interfere.py"
import math

credential = [1.0, 0.0]
urgency = [0.8, 0.6]

def cosine(left, right):
    dot = sum(a * b for a, b in zip(left, right))
    norm = math.sqrt(sum(a * a for a in left) * sum(b * b for b in right))
    return dot / norm

mixed_activation = [1.5 * credential[0] + urgency[0], 1.5 * credential[1] + urgency[1]]
print(f"credential/urgency cosine: {cosine(credential, urgency):.2f}")
print(f"axis A reading after both fire: {mixed_activation[0]:.2f}")

assert cosine(credential, urgency) > 0
assert mixed_activation[0] > 1.5
```

<!-- leetllm: output:start -->
```text title="Overlapping directions" output compact
credential/urgency cosine: 0.80
axis A reading after both fire: 2.30
```
<!-- leetllm: output:end -->

## How sparse autoencoders produce candidate features

A sparse autoencoder attacks the superposition problem through overcomplete dictionary learning, modeling an activation vector $x \in \mathbb{R}^D$ as a sparse linear combination of directions drawn from a much wider learned dictionary with $M \gg D$. When a model packs features into non-orthogonal directions, the SAE aims to unroll those directions onto distinct latent coordinates. Subtracting the learned decoder bias $b_\text{dec}$ before encoding gives encoder and decoder a shared reference point without requiring $b_\text{dec}$ to equal the exact dataset mean, though simpler formulations omit pre-encoder centering.[^bricken2023] An SAE separates into two linear maps linked by a sparse activation rule:

- **Encoder:** $z = f\bigl(W_\text{enc}(x - b_\text{dec}) + b_\text{enc})\bigr)$ where $W_\text{enc} \in \mathbb{R}^{M \times D}$ with $M \gg D$, and $f$ is an activation function such as ReLU or a TopK operator.
- **Decoder:** $\hat{x} = W_\text{dec} z + b_\text{dec}$ where $W_\text{dec} \in \mathbb{R}^{D \times M}$. Each column $d_i = W_\text{dec}[:, i]$ represents a candidate feature direction in the model's activation space.

### Tied vs untied decoders

Weight tying ($W_\text{dec}=W_\text{enc}^T$) reduces matrix storage. Untied weights let detection and reconstruction directions differ, as in Bricken's SAE and Gao's TopK recipe. Cunningham's study used tied weights and reported no performance reduction on its residual-stream data, with some reduction on MLP data.[^bricken2023][^cunningham2023sae][^gao2024sae]

The reason comes down to an asymmetry in what the two layers do:

1. The encoder solves a feature detection problem under noise. Because other features in superposition create non-zero dot-product interference, the encoder needs sharp geometric selectivity and negative bias margins to keep false positives low.
2. The decoder adds its learned candidate direction $d_i$ to the reconstructed activation, weighted by $z_i$. The reconstruction lives at the chosen hook, which may be a branch output rather than the residual stream.

Tying restricts that independence, though its practical effect depends on the activation site and training recipe. When untied training improves selectivity or reconstruction, practitioners can still warm-start the optimization using **tied initialization**, where Gao initializes encoder weights from the decoder transpose and then lets both matrices train freely.[^gao2024sae] That choice avoids baking early geometric mismatches into the rest of training while preserving separate detection and reconstruction parameters.

### The L1 shrinkage problem

The traditional training loss combines a mean squared error (MSE) reconstruction term with an L1 sparsity penalty:

$$
\mathcal{L} = \underbrace{\frac{\|x - \hat{x}\|_2^2}{D}}_{\text{reconstruction MSE}} + \lambda \underbrace{\frac{\|z\|_1}{M}}_{\text{sparsity penalty}}
$$

For a positive latent, this mean-normalized sparsity term contributes $\lambda/M$ to $\partial\mathcal{L}/\partial z_i$. The optimizer updates encoder parameters through the chain rule, so it doesn't simply subtract $\eta\lambda$ from every latent each step. Nevertheless, the penalty favors smaller magnitudes even when support stays unchanged. With a fixed unit decoder in one dimension, minimizing $(a-z)^2+\lambda z$ over $z\ge0$ gives $z^*=\max(0,a-\lambda/2)$. This is **L1 shrinkage**. Sum/mean conventions change the coefficient. Unconstrained decoder norms introduce a separate scaling loophole discussed below.

Three widely studied designs address magnitude shrinkage in different ways:

1. **TopK SAEs:** A nonnegative variant keeps at most $k$ nonzero values: $z=\text{TopK}(\text{ReLU}(W_\text{enc}(x-b_\text{dec})+b_\text{enc}),k)$. It removes the L1 term from the main reconstruction objective without eliminating every source of downward magnitude bias. Because the hard cutoff creates non-smooth transitions, Gao's full recipe adds an AuxK objective for dead latents, and the GPT-4 16M-latent dictionary omits $b_\text{enc}$ in its main encoder.[^gao2024sae]
2. **Gated SAEs:** A binary gate selects which features fire while a separate magnitude path scales how strongly they activate, sharing projection directions with separate row scales and biases. L1 applies only to **rectified gate pre-activations**, and an auxiliary reconstruction pass through those gate pre-activations provides a learning signal with decoder weights detached. As a result, the magnitude estimate avoids direct L1 shrinkage even though shared parameters can still shift.[^rajamanoharan2024gated]
3. **JumpReLU SAEs:** $\text{JumpReLU}(y,\theta)=y\mathbf{1}(y>\theta)$ preserves the full pre-activation above a learned positive threshold while an L0 penalty controls support. Naively differentiating the indicator threshold yields zero almost everywhere, so the paper introduces custom windowed straight-through estimators whose kernel bandwidth trades estimator bias against variance.[^rajamanoharan2024jumprelu]

Notice how changing the regularization weight flips the preferred dictionary solution across candidate reconstructions. At low sparsity weight $\lambda$, paying a small L1 cost for extra coordinates beats incurring reconstruction error, so a denser mixture wins. At higher $\lambda$, keeping extra active slots costs more than accepting modest reconstruction error, shifting the objective toward the sparse code.

<!-- leetllm: test, output=show, output_title="Objective tradeoff" -->
```python title="reconstruction-sparsity-objective.py"
def mse(target, reconstructed):
    return sum((a - b) ** 2 for a, b in zip(target, reconstructed)) / len(target)

def objective(target, reconstructed, code, sparsity_weight):
    mean_magnitude = sum(abs(value) for value in code) / len(code)
    return mse(target, reconstructed) + sparsity_weight * mean_magnitude

target = [1.0, 0.0]
sparse_code = [0.75, 0.0]
sparse_reconstruction = [0.75, 0.0]
dense_code = [0.75, 0.50]
dense_reconstruction = [1.0, 0.0]

for weight in [0.02, 0.20]:
    sparse_loss = objective(target, sparse_reconstruction, sparse_code, weight)
    dense_loss = objective(target, dense_reconstruction, dense_code, weight)
    chosen = "sparse" if sparse_loss < dense_loss else "dense"
    print(f"lambda={weight:.2f}: sparse={sparse_loss:.4f}, dense={dense_loss:.4f} -> {chosen}")

assert objective(target, dense_reconstruction, dense_code, 0.02) < objective(target, sparse_reconstruction, sparse_code, 0.02)
assert objective(target, sparse_reconstruction, sparse_code, 0.20) < objective(target, dense_reconstruction, dense_code, 0.20)
```

<!-- leetllm: output:start -->
```text title="Objective tradeoff" output compact
lambda=0.02: sparse=0.0387, dense=0.0125 -> dense
lambda=0.20: sparse=0.1063, dense=0.1250 -> sparse
```
<!-- leetllm: output:end -->

The original "Towards Monosemanticity" study (2023) trained an SAE on a one-layer transformer, decomposing a 512-neuron MLP into 4,096 features in run A/1 whose inspected directions specialized cleanly for DNA sequences, Hebrew script, base64 text, and legal formatting.[^bricken2023] Building on those small-model results, "Scaling Monosemanticity" (2024) applied dictionary learning to a middle-layer residual stream of Claude 3 Sonnet. Scaling dictionary widths to 1 million, 4 million, and 34 million latents surfaced abstract candidate features spanning sycophancy, code vulnerabilities, and multilingual entities.[^templeton2024]

```checkpoint
Why is an SAE overcomplete for interpretability?
---
An overcomplete SAE gives the dictionary more latent slots than the activation space has axes, which lets it search for cleaner candidate directions under the superposition hypothesis. A sparsity objective rewards selective use of those slots; a hard support constraint such as TopK enforces a limit directly.
```

<!-- leetllm: test -->
```python title="topk-keeps-largest-latents.py"
def top_k_sparse(values, k):
    if k < 0 or k > len(values):
        raise ValueError("k must be between zero and the latent width")
    positive = [max(0.0, value) for value in values]
    # Stable sorting makes ties deterministic: earlier indices win.
    ranked = sorted(range(len(values)), key=lambda index: positive[index], reverse=True)
    keep = set(ranked[:k])
    return [value if index in keep else 0.0 for index, value in enumerate(positive)]

latent = [0.1, 2.4, 0.3, 1.7, 0.05]
sparse = top_k_sparse(latent, k=2)

assert sparse == [0.0, 2.4, 0.0, 1.7, 0.0]
assert sum(value != 0.0 for value in sparse) == 2
assert top_k_sparse([-2.0, 0.0, 1.0], 2) == [0.0, 0.0, 1.0]
assert top_k_sparse([2.0, 2.0], 1) == [2.0, 0.0]
assert top_k_sparse(latent, 0) == [0.0] * len(latent)
for invalid in [-1, 6]:
    try:
        top_k_sparse(latent, invalid)
    except ValueError:
        pass
    else:
        raise AssertionError("invalid k accepted")
```

<figure>
  <img src="illustrations/_generated/sae_architecture_dark.png" alt="A sparse autoencoder turns an 8-dimensional activation into a 64-slot feature code with 19 active cells, then decodes it back to 8 dimensions. The encoder matrix is 64 by 8 and the decoder matrix is 8 by 64; an L1 training penalty encourages sparse codes." />
  <figcaption>The encoder maps $x \in \mathbb{R}^8$ into 64 ReLU coefficients. Here 19 of the 64 feature slots fire above zero; an L1 term encourages sparse codes during training. The decoder combines its rows to reconstruct eight activation dimensions.</figcaption>
</figure>

This pipeline separates two distinct questions:
1. Does the dictionary reconstruct the activation accurately while activating only a small handful of coordinates?
2. Do those learned directions correspond to true computational features that predict and control model behavior?

A low reconstruction error and high sparsity answer the first question. They don't automatically answer the second. That distinction determines how you choose hook points and how you validate features causally.

## Where to attach SAEs inside a transformer

Researchers attach SAEs at several hook points across a transformer block:

- **Residual stream after attention or MLP:** The residual stream is the model's shared trunk communication channel. Hooking here captures information accumulated across all preceding layers.
- **MLP output update:** Captures the specific non-linear update written by that sublayer into the residual stream.
- **Attention layer output:** Decomposes the cross-token context routing information before it merges into the residual stream.

These sites can use the same SAE architecture, but a pretrained dictionary is tied to its exact checkpoint and hook. Record the layer, token position, pre/post normalization, attention output projection, activation dtype, and any centering or rescaling. Sites can share a width while differing in distribution. Joint dictionaries are possible too, but require an explicit multi-site training design.

Cunningham et al. reported mixed success on MLP data, with many inactive dictionary features in some middle and later layers while untied weights retained more active features in those experiments. Those results do not guarantee a universal ranking of activation sites, so compare reconstruction, sparsity, and downstream behavior at the specific hook you plan to use.[^cunningham2023sae] Marks et al. later trained sublayer SAEs in Pythia-70M alongside pretrained Gemma Scope dictionaries for Gemma-2-2B, noting that Gemma's attention dictionary reads before the output projection while its MLP dictionary reads after the branch output norm.[^marks2024featurecircuits] Choosing a hook therefore determines what your candidate directions represent, and matching a layer index alone is never sufficient.

```checkpoint
Why might a residual-stream SAE and an MLP-output SAE reveal different features?
---
The residual stream is the shared communication channel that carries mixed information forward through the model, whereas MLP outputs hold the nonlinear update written by one sublayer. SAEs trained at either hook yield different candidate descriptions, and controlled experiments must determine which candidates carry behaviorally relevant information.
```

## Feature circuits: from features to algorithms

A dictionary at one hook still leaves open how an individual feature shapes computation in later layers. **Feature circuits** address that gap with sparse subgraphs that connect earlier features through downstream dependencies to the final next-token prediction. While attribution methods suggest candidate edges across layers, statistical correlation along an edge never proves causation on its own. A circuit hypothesis becomes credible only when targeted interventions such as ablation, feature clamping, or activation patching shift model behavior in the predicted direction.[^marks2024featurecircuits]

Circuit studies investigate model- and task-specific mechanisms, with varying completeness:

- Induction heads that complete patterns such as `[A][B] … [A] → [B]`. Olsson's study gives causal evidence in small attention-only models and correlational evidence in larger models with MLPs.[^olsson2022]
- The indirect-object identification (IOI) circuit in GPT-2 small.[^wang2022ioi]
- The greater-than comparison circuit in GPT-2 small.[^hanna2023greater]
- Sparse feature circuits that explain complex behaviors in terms of human-interpretable feature nodes rather than uninterpretable neuron indices.[^marks2024featurecircuits]

### Attribution graphs and cross-layer transcoders

Anthropic's 2025 method uses **cross-layer transcoders** (CLTs). A feature reads at its associated residual-stream layer and has separate decoder vectors contributing to MLP-output reconstructions at that layer and later ones. Each MLP output is reconstructed from features at its own and earlier layers. The model's attention operations remain; CLTs don't replace the entire transformer.[^ameisen2025CircuitTracing]

For a chosen prompt, its **local replacement model** fixes attention patterns and normalization denominators to the original forward pass and adds back reconstruction errors as constants. Baseline activations and logits match by construction; evaluate edited responses separately. Its graph includes feature, token-embedding, unexplained-error, and selected output-logit nodes. Feature edges measure direct contributions to target **pre-activations**, with intervening MLP outputs stopped in the backward pass. A schematic edge is:

$$
\text{Attr}(u\to v)=z_u\frac{\partial a_v}{\partial z_u}\Big|_{\text{specified frozen paths}},
$$

where $a_v$ is the target encoder pre-activation. This isn't the full model's unrestricted total derivative through every intermediate feature. Graph pruning selects a manageable hypothesis.[^ameisen2025CircuitTracing]

The graph explains information flow **given** attention, not how Q/K computations formed that attention. Error nodes and inactive suppressed features can hide essential mechanisms. Check reconstruction fidelity, graph completeness, and interventions in the original model. The companion *Biology* study investigates particular behaviors of Claude 3.5 Haiku.[^ameisen2025CircuitTracing][^lindsey2025biology]

```checkpoint
How does an attribution graph differ from running activation patching one component at a time?
---
Activation patching tests selected edits. Anthropic's local attribution graph uses a replacement model with frozen attention and normalization denominators, plus error corrections, to surface direct contribution paths. It leaves parts of the computation unexplained. Validate important predictions in the original model, rather than treating baseline agreement or a graph edge as a complete explanation.
```

<figure>
  <img src="illustrations/_generated/feature_circuit_dark.png" alt="Worked linear readout s = Σzᵢwᵢ with feature contributions credential cue 0.90 × 1.20 = +1.08, urgency cue 0.80 × 0.10 = +0.08, and formatting cue 0.70 × 0 = 0, summing to 1.16. Removing the credential cue reduces the score to 0.08; removing the zero-weight formatting cue leaves the score at 1.16." />
  <figcaption>Worked linear circuit matching the code check below. The credential-labeled input contributes $+1.08$, about $93\%$ of the score, so removing it leaves $0.08$ while removing zero-weight formatting preserves $1.16$. Testing whether a real model feature isolates safety requires held-out activations and interventions.</figcaption>
</figure>

```checkpoint
What extra evidence do you need before trusting an SAE feature as causal?
---
Specify the edit, hook, positions, and predicted behavioral change, then test held-out prompts and matched controls while preserving reconstruction error. An intervention demonstrates consequences of that edit, while replication, semantic counterexamples, and collateral measurements determine whether the proposed feature explanation is useful.
```

<!-- leetllm: test, output=show, output_title="Intervention check" -->
```python title="intervention-not-correlation.py"
def refusal_score(features):
    weights = {"credential_safety": 1.2, "urgency": 0.1, "formatting": 0.0}
    return sum(features[name] * weights[name] for name in weights)

observed = {"credential_safety": 0.9, "urgency": 0.8, "formatting": 0.7}
credential_ablated = {**observed, "credential_safety": 0.0}
formatting_ablated = {**observed, "formatting": 0.0}

baseline = refusal_score(observed)
target_change = baseline - refusal_score(credential_ablated)
control_change = baseline - refusal_score(formatting_ablated)
print(f"target ablation change: {target_change:.2f}")
print(f"negative-control change: {control_change:.2f}")

assert target_change > 1.0
assert control_change == 0.0
```

<!-- leetllm: output:start -->
```text title="Intervention check" output compact
target ablation change: 1.08
negative-control change: 0.00
```
<!-- leetllm: output:end -->

The formatting feature produces zero score change because its readout weight is zero by construction. In a real language model, a convincing ablation experiment requires held-out prompts, matched control directions, and checks on collateral capabilities such as language modeling perplexity or code execution accuracy. Moreover, a null ablation result can still stem from redundant parallel pathways or an underpowered intervention, so negative controls and negative results both require careful verification.

## Activation steering with SAE features

Because each SAE feature corresponds to a specific column $d_f = W_\text{dec}[:, f]$ in the decoder matrix, we can use that direction for **activation steering** at inference time without modifying model weights:

1. Run the forward pass and cache the residual-stream activation vector $x$ at the target layer.
2. Add a scaled copy of the feature's decoder direction: $x_\text{steered} = x + \alpha \cdot d_f$.
3. Continue the forward pass using $x_\text{steered}$.

To set one coefficient in the cached SAE decomposition to $c$ while preserving its reconstruction error, apply **feature clamping**, which shifts the activation by $\Delta x = \bigl(c - z_f(x)\bigr) d_f$ where $z_f(x)$ is the encoder readout for feature $f$. Notice that this edit modifies one term in the **original decomposition** rather than snapping the re-encoded representation to a fixed point. Re-encoding $x+\Delta x$ need not return $z_f=c$, because encoder and decoder columns need not be dual, encoder thresholds can switch, and overlapping feature readouts can shift at the same time. The snippet below shows how even a unit decoder direction overshoots the requested target from $3.0$ to $4.0$ while pulling an overlapping readout upward.

<!-- leetllm: test, output=show -->
```python title="clamping-is-not-an-encoder-fixed-point.py"
def encode_feature(x):
    return max(0.0, x[0] + 2.0 * x[1])

x = [1.0, 0.5]
decoder_direction = [0.0, 1.0]
old_coefficient = encode_feature(x)
target = 3.0
edited = [value + (target - old_coefficient) * direction
          for value, direction in zip(x, decoder_direction)]
print(f"cached coefficient: {old_coefficient:.1f}; requested: {target:.1f}")
print(f"re-encoded coefficient: {encode_feature(edited):.1f}")
print(f"overlapping readout: {sum(x):.1f} -> {sum(edited):.1f}")
assert encode_feature(edited) != target
```

<!-- leetllm: output:start -->
```text title="Output" output compact
cached coefficient: 2.0; requested: 3.0
re-encoded coefficient: 4.0
overlapping readout: 1.5 -> 2.5
```
<!-- leetllm: output:end -->

Whether a credential-labeled feature increases refusal, and at what scale, must be measured across diverse prompts. In Anthropic's 2024 Sonnet experiments, amplifying a Golden Gate Bridge feature induced bridge-related responses while preserving reconstruction error across token positions, though extreme scales eventually degraded coherence.[^templeton2024] Working instead with difference-of-means refusal directions across 13 open chat models, Arditi et al. demonstrated reliable steering on those evaluations without proving a single universal refusal direction or safety threshold that applies to every model.[^arditi2024refusal]

<figure>
  <img src="illustrations/_generated/steering_sweep_dark.png" alt="Side-by-side activation sweep diagram for x′ = [0.2, 0.1] + α[0, 1] at α = −1, 0, +1, +2. Left: equal-unit 2D vector space showing the sweep path alongside candidate [0, 1], overlapping [0.6, 0.8], and orthogonal [1, 0] directions. Right: line chart and projection table showing dot products: candidate −0.9, 0.1, 1.1, 2.1; overlap −0.6, 0.2, 1.0, 1.8; orthogonal 0.2 across all steps." />
  <figcaption>Adding $\alpha [0, 1]$ moves the activation along the candidate direction across $\alpha \in \{-1, 0, +1, +2\}$. While the orthogonal axis $[1, 0]$ stays invariant at $0.20$, the non-orthogonal overlapping direction $[0.6, 0.8]$ experiences substantial collateral drift from $-0.60$ to $+1.80$.</figcaption>
</figure>

```checkpoint
Why does steering use the decoder vector for a feature rather than the raw latent activation value alone?
---
The latent value tells you how strongly the feature is active. The decoder vector tells you which direction in the model's residual stream represents that feature. To edit the model state, you add or subtract that residual-stream direction.
```

<!-- leetllm: test -->
```python title="activation-steering-with-sae-features.py"
def add_scaled_direction(vector, direction, scale):
    if len(vector) != len(direction):
        raise ValueError("activation and direction must have the same width")
    return [value + scale * delta for value, delta in zip(vector, direction)]

activation = [0.2, -0.1, 0.0, 0.4]
credential_feature_direction = [0.0, 0.5, 0.5, 0.0]
steered = add_scaled_direction(activation, credential_feature_direction, scale=2.0)

assert steered == [0.2, 0.9, 1.0, 0.4]
assert steered[1] > activation[1]
assert steered[2] > activation[2]
```

<!-- leetllm: test, output=show, output_title="Steering sweep" -->
```python title="steering-sweep.py"
def add_scaled(vector, direction, scale):
    return [value + scale * delta for value, delta in zip(vector, direction)]

def project(vector, direction):
    return sum(value * delta for value, delta in zip(vector, direction))

activation = [0.2, 0.1]
candidate_direction = [0.0, 1.0]
unrelated_direction = [1.0, 0.0]
overlapping_direction = [0.6, 0.8]

for alpha in [-1.0, 0.0, 1.0, 2.0]:
    steered = add_scaled(activation, candidate_direction, alpha)
    score = project(steered, candidate_direction)
    control = project(steered, unrelated_direction)
    overlap = project(steered, overlapping_direction)
    print(f"alpha={alpha:+.1f}: candidate={score:+.1f}, orthogonal={control:+.1f}, overlapping={overlap:+.1f}")

assert project(add_scaled(activation, candidate_direction, 2.0), unrelated_direction) == 0.2
```

<!-- leetllm: output:start -->
```text title="Steering sweep" output compact
alpha=-1.0: candidate=-0.9, orthogonal=+0.2, overlapping=-0.6
alpha=+0.0: candidate=+0.1, orthogonal=+0.2, overlapping=+0.2
alpha=+1.0: candidate=+1.1, orthogonal=+0.2, overlapping=+1.0
alpha=+2.0: candidate=+2.1, orthogonal=+0.2, overlapping=+1.8
```
<!-- leetllm: output:end -->

### Keep reconstruction error separate from feature ablation

Any SAE reconstruction leaves an unexplained residual error $e = x - \hat{x}$. The original activation decomposes as:

$$
x = \hat{x} + e = \sum_j z_j d_j + b_\text{dec} + e
$$

When testing the causal effect of feature $f$, an **error-preserving ablation** subtracts only that feature's reconstructed contribution from the clean activation vector:

$$
x' = x - z_f d_f
$$

A dangerous beginner mistake is **naive ablation**: setting $z_f = 0$ inside the SAE reconstruction, yielding $x'_\text{naive} = \hat{x} - z_f d_f$. That naive step removes feature $f$ **and simultaneously discards the unexplained residual $e$**. If downstream attention heads or MLP layers rely on signals inside $e$, the model's performance drops, and researchers falsely attribute that drop to the ablated feature!

A small numerical calculation isolates this trap. Although the SAE achieves a tiny reconstruction MSE of $0.005$, the downstream readout relies entirely on the second coordinate missed by $\hat{x}$. Subtracting the candidate feature from $\hat{x}$ instead of $x$ discards $e$ and creates a spurious drop in score from $10.0$ to $0.0$.

<!-- leetllm: test, output=show, output_title="Reconstruction error confound" -->
```python title="preserve-error-when-ablating.py"
x = [1.0, 0.1]
x_hat = [1.0, 0.0]
feature_contribution = [1.0, 0.0]  # z_f * decoder_column_f

def readout(vector):
    return 100.0 * vector[1]

preserved = [a - b for a, b in zip(x, feature_contribution)]
naive = [a - b for a, b in zip(x_hat, feature_contribution)]
mse = sum((a - b) ** 2 for a, b in zip(x, x_hat)) / len(x)
print(f"reconstruction MSE: {mse:.3f}")
for name, vector in [("original", x), ("reconstructed", x_hat),
                     ("error-preserving ablation", preserved), ("naive ablation", naive)]:
    print(f"{name}: {readout(vector):.1f}")
assert readout(preserved) == readout(x) == 10.0
assert readout(naive) == readout(x_hat) == 0.0
```

<!-- leetllm: output:start -->
```text title="Reconstruction error confound" output compact
reconstruction MSE: 0.005
original: 10.0
reconstructed: 0.0
error-preserving ablation: 10.0
naive ablation: 0.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/feature_visualization_dark.png" alt="Equal-scale vector diagram for readout s(v) = 100v₂. The input x = [1, 0.1] separates into reconstruction x-hat = [1, 0] and residual e = [0, 0.1], where the residual carries score 10. Subtracting d1 = [1, 0] from x-hat leaves [0, 0] and score 0; subtracting d1 from x leaves e = [0, 0.1] and score 10." />
  <figcaption>Naive ablation drops the readout score from $10$ to $0$ by discarding the unexplained residual $e$. Preserving $e$ leaves the score unchanged and separates the target feature's zero causal effect from reconstruction damage, showing that tiny MSE alone never avoids residual confounding.</figcaption>
</figure>

For **gradient-based attribution**, also hold the original error fixed in the backward pass. If you insert `decode(z) + (x - decode(z))` with both copies of `decode(z)` attached to autograd, their derivatives cancel identically inside the sum. As a result, the forward pass matches the model activation while every latent gradient evaluates to zero unless you stop gradients through the residual.[^marks2024featurecircuits] The PyTorch check below compares both passes side by side, verifying that `error.detach()` preserves the true directional derivative $3.0$.

<!-- leetllm: test, deps=torch, output=show, output_title="Forward equality hides gradient cancellation" -->
```python title="freeze-error-for-feature-gradients.py"
import torch

z = torch.tensor([1.0], dtype=torch.float64, requires_grad=True)
direction = torch.tensor([1.0, 0.0], dtype=torch.float64)
original = torch.tensor([1.0, 0.1], dtype=torch.float64)
readout = torch.tensor([3.0, 100.0], dtype=torch.float64)
decoded = z[0] * direction
error = original - decoded

live_score = (decoded + error) @ readout
fixed_score = (decoded + error.detach()) @ readout
live_gradient = torch.autograd.grad(live_score, z, retain_graph=True)[0]
fixed_gradient = torch.autograd.grad(fixed_score, z)[0]
print(f"forward scores: live={live_score.item():.1f}, fixed={fixed_score.item():.1f}")
print(f"latent gradients: live={live_gradient.item():.1f}, fixed={fixed_gradient.item():.1f}")
torch.testing.assert_close(live_score, fixed_score)
torch.testing.assert_close(live_gradient, torch.zeros_like(z))
torch.testing.assert_close(fixed_gradient, torch.full_like(z, 3.0))
```

<!-- leetllm: output:start -->
```text title="Forward equality hides gradient cancellation" output compact
forward scores: live=13.0, fixed=13.0
latent gradients: live=0.0, fixed=3.0
```
<!-- leetllm: output:end -->

The gradient $3$ measures changing this latent while holding the original error constant. Recomputing the error after editing the latent would undo the intervention. This example covers one hook and one feature. For gradients through multiple upstream SAE hooks, detaching errors alone changes upstream derivatives; Marks et al. also use pass-through gradients to preserve those paths. Follow the attribution method's full backward specification rather than applying `detach()` everywhere.[^marks2024featurecircuits]

For an LLM, measure downstream language-model loss as well as activation MSE. **Loss Recovered** expresses one baseline-relative comparison:

$$
\text{Loss Recovered} = 1 - \frac{\mathcal{L}_\text{SAE} - \mathcal{L}_\text{clean}}{\mathcal{L}_\text{ablated} - \mathcal{L}_\text{clean}}
$$

Here $\mathcal{L}_\text{clean}$ uses original activations, $\mathcal{L}_\text{SAE}$ substitutes reconstructions, and $\mathcal{L}_\text{ablated}$ uses a specified mean/zero baseline at the same hooks and positions. The ratio is undefined at a zero denominator and unstable near zero. It can be negative or exceed one. A very destructive baseline can make substantial damage look like excellent recovery; Gao explicitly cautions about residual-stream zero-ablation.[^gao2024sae] Report all three losses, $\Delta\mathcal{L}=\mathcal{L}_\text{SAE}-\mathcal{L}_\text{clean}$, and task effects too.

Because **Loss Recovered** normalizes against an ablation denominator $\mathcal{L}_\text{ablated} - \mathcal{L}_\text{clean}$, two evaluations with identical reconstruction damage can report completely different recovery fractions. With clean loss $2.0$ and SAE loss $2.2$, a harsh ablation baseline at $20.0$ makes the damage look harmless ($0.989$ recovered), whereas a milder baseline at $2.4$ reveals half the gap lost ($0.500$ recovered). Reporting the raw losses alongside the normalized ratio keeps that baseline dependence explicit.

<!-- leetllm: test, output=show -->
```python title="loss-recovered-needs-its-baseline.py"
def loss_recovered(clean, reconstructed, ablated):
    denominator = ablated - clean
    if denominator <= 1e-12:
        raise ValueError("baseline must increase loss by more than the chosen tolerance")
    return 1.0 - (reconstructed - clean) / denominator

for baseline in [20.0, 2.4]:
    recovered = loss_recovered(2.0, 2.2, baseline)
    print(f"baseline={baseline:.1f}; delta loss=0.2; recovered={recovered:.3f}")
print(f"worse than baseline: {loss_recovered(2.0, 5.0, 4.0):.2f}")
print(f"better than clean: {loss_recovered(2.0, 1.9, 4.0):.2f}")
try:
    loss_recovered(2.0, 2.2, 2.0)
except ValueError:
    print("zero denominator: rejected")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
baseline=20.0; delta loss=0.2; recovered=0.989
baseline=2.4; delta loss=0.2; recovered=0.500
worse than baseline: -0.50
better than clean: 1.05
zero denominator: rejected
```
<!-- leetllm: output:end -->

## A toy NumPy SAE you can run today

This self-contained lab trains an uncentered ReLU sparse autoencoder on dense linear mixtures of 24 known unit directions packed into eight dimensions. Copy the training, summary, and alignment blocks into one script in order and run `uv run --with numpy python toy_sae.py`. Although it omits production components such as activation streaming, AuxK auxiliary reconstruction, and a learned threshold, the minimal full-batch SGD trainer with unit-normalized decoder columns already highlights the three separate claims an SAE evaluation must track:

1. Reconstruction MSE should fall across optimization epochs.
2. Active latent counts must be measured explicitly rather than assumed to match the generator's 2 to 4 true directions per sample.
3. Learned decoder columns should align closely with the known generating directions before claiming recovery.

<!-- leetllm: test, deps=numpy, id=toy-sae, output=show, output_title="Training log" -->
```python title="a-toy-numpy-sae-you-can-run-today.py"
import numpy as np

# --- Synthetic data with known superposition ---
rng = np.random.default_rng(42)
d_model = 8
n_true_features = 24          # more features than dimensions
n_samples = 768

# Ground-truth feature directions (unit vectors)
true_features = rng.normal(size=(n_true_features, d_model))
true_features /= np.linalg.norm(true_features, axis=1, keepdims=True)

# Each sample activates only 2-4 features (sparse)
activations = np.zeros((n_samples, d_model))
for i in range(n_samples):
    active_idx = rng.choice(n_true_features, size=rng.integers(2, 5), replace=False)
    coeffs = rng.normal(loc=1.5, scale=0.4, size=len(active_idx))
    activations[i] = (coeffs[:, None] * true_features[active_idx]).sum(axis=0)

# Add a little noise
activations += 0.03 * rng.normal(size=activations.shape)

# --- Tiny SAE implementation ---
n_features = 64               # 8x expansion
learning_rate = 0.03
lambda_sparsity = 5.0         # L1 coefficient
epochs = 300

W_enc = rng.normal(scale=0.1, size=(n_features, d_model))
b_enc = np.zeros(n_features)
W_dec = rng.normal(scale=0.1, size=(d_model, n_features))
W_dec /= np.linalg.norm(W_dec, axis=0, keepdims=True) + 1e-12
initial_W_dec = W_dec.copy()
b_dec = np.zeros(d_model)

def encode(x: np.ndarray):
    pre_activation = x @ W_enc.T + b_enc
    z = np.maximum(0.0, pre_activation)
    return pre_activation, z

def reconstruct(x: np.ndarray):
    _, z = encode(x)
    return z, z @ W_dec.T + b_dec

def reconstruction_loss(x: np.ndarray) -> float:
    _, x_hat = reconstruct(x)
    return float(np.mean((x - x_hat) ** 2))

def train_sae(x: np.ndarray) -> None:
    global W_enc, b_enc, W_dec, b_dec
    for epoch in range(epochs):
        # Forward
        pre_activation, z = encode(x)
        x_hat = z @ W_dec.T + b_dec

        # Loss
        recon_loss = np.mean((x - x_hat) ** 2)
        sparsity_loss = np.mean(np.abs(z))
        total_loss = recon_loss + lambda_sparsity * sparsity_loss

        # Gradients (manual backprop for clarity)
        d_recon = 2 * (x_hat - x) / x.size
        dW_dec = d_recon.T @ z
        db_dec = d_recon.sum(axis=0)

        dz = d_recon @ W_dec
        dz += (lambda_sparsity / z.size) * np.sign(z)
        dz[pre_activation <= 0] = 0.0                    # ReLU backward
        dW_enc = dz.T @ x
        db_enc = dz.sum(axis=0)

        # SGD step
        W_dec -= learning_rate * dW_dec
        b_dec -= learning_rate * db_dec
        W_enc -= learning_rate * dW_enc
        b_enc -= learning_rate * db_enc

        # Keep decoder columns normalized so scale can't move from z into W_dec.
        W_dec /= np.linalg.norm(W_dec, axis=0, keepdims=True) + 1e-12

        if epoch % 100 == 0:
            print(f"Epoch {epoch:4d} | total={total_loss:.4f} | recon={recon_loss:.4f} | sparsity={sparsity_loss:.4f}")

initial_recon = reconstruction_loss(activations)
train_sae(activations)
```

<!-- leetllm: output:start -->
```text title="Training log" output compact
Epoch    0 | total=1.9426 | recon=1.4259 | sparsity=0.1033
Epoch  100 | total=0.5301 | recon=0.2370 | sparsity=0.0586
Epoch  200 | total=0.4394 | recon=0.1564 | sparsity=0.0566
```
<!-- leetllm: output:end -->

Having finished 300 epochs of full-batch updates, the first check summarizes training reconstruction and active latent counts before testing generalization. Evaluating the trained dictionary on 256 fresh samples from the same generating dictionary then separates genuine reconstruction from memorized training batches. Comparing that held-out MSE against the training-mean baseline expresses the remaining error as the Fraction of Variance Unexplained (FVU).

<!-- leetllm: test, id=toy-sae-summary, continue=toy-sae, output=show, output_title="Learned feature summary" -->
```python title="a-toy-numpy-sae-summary.py"
final_recon = reconstruction_loss(activations)
z, _ = reconstruct(activations)
active_per_sample = (z > 0).sum(axis=1).mean()

print(f"Training complete: recon {initial_recon:.3f} -> {final_recon:.3f}, active features {active_per_sample:.1f}")

# Fresh samples from the same known dictionary; no fitting on these samples.
test_rng = np.random.default_rng(123)
heldout = np.zeros((256, d_model))
for i in range(len(heldout)):
    indices = test_rng.choice(n_true_features, size=test_rng.integers(2, 5), replace=False)
    coefficients = test_rng.normal(1.5, 0.4, size=len(indices))
    heldout[i] = (coefficients[:, None] * true_features[indices]).sum(axis=0)
heldout += 0.03 * test_rng.normal(size=heldout.shape)
test_z, test_reconstruction = reconstruct(heldout)
test_mse = np.mean((heldout - test_reconstruction) ** 2)
mean_baseline_mse = np.mean((heldout - activations.mean(axis=0)) ** 2)
fvu = test_mse / mean_baseline_mse
print(f"Held-out MSE: {test_mse:.3f}; mean baseline: {mean_baseline_mse:.3f}; FVU: {fvu:.3f}")
print(f"Held-out active features: {(test_z > 0).sum(axis=1).mean():.1f}")
assert final_recon < initial_recon
assert test_mse < mean_baseline_mse
```

<!-- leetllm: output:start -->
```text title="Learned feature summary" output compact
Training complete: recon 1.426 -> 0.128, active features 18.9
Held-out MSE: 0.128; mean baseline: 0.757; FVU: 0.169
Held-out active features: 19.5
```
<!-- leetllm: output:end -->

The held-out check tests generalization to fresh linear mixtures of the 24 ground-truth directions, achieving a Fraction of Variance Unexplained (FVU) of $0.169$ that confirms solid reconstruction accuracy. Even with low FVU, however, good reconstruction does not prove that the learned decoder vectors recovered the underlying generating directions. To test dictionary recovery directly, the diagnostic below computes the maximum cosine similarity between each ground-truth feature vector and every learned column in the trained decoder.

<!-- leetllm: test, continue=toy-sae-summary, output=show, output_title="Direction alignment" -->
```python title="dictionary-alignment-diagnostic.py"
def direction_alignment(decoder: np.ndarray, ignore_sign=True):
    columns = decoder.T.copy()
    columns /= np.linalg.norm(columns, axis=1, keepdims=True) + 1e-12
    similarities = true_features @ columns.T
    if ignore_sign:
        similarities = np.abs(similarities)
    strongest_per_truth = similarities.max(axis=1)
    return float(np.median(strongest_per_truth)), int((strongest_per_truth >= 0.90).sum())

initial_median, initial_high_matches = direction_alignment(initial_W_dec)
trained_median, trained_high_matches = direction_alignment(W_dec)
print(f"median max |cosine|: {initial_median:.3f} -> {trained_median:.3f}")
print(f"true directions at >= 0.90: {initial_high_matches} -> {trained_high_matches}")
initial_signed, _ = direction_alignment(initial_W_dec, ignore_sign=False)
trained_signed, _ = direction_alignment(W_dec, ignore_sign=False)
print(f"median max signed cosine: {initial_signed:.3f} -> {trained_signed:.3f}")
```

<!-- leetllm: output:start -->
```text title="Direction alignment" output compact
median max |cosine|: 0.798 -> 0.799
true directions at >= 0.90: 1 -> 2
median max signed cosine: 0.695 -> 0.710
```
<!-- leetllm: output:end -->

Reconstruction MSE dropped by over $90\%$ ($1.426 \to 0.128$), while median cosine alignment barely budged ($0.798 \to 0.799$)! **Sparse reconstruction metrics describe reconstruction and sparsity rather than causal feature identification**, so state clearly which modeling assumptions an experiment evaluates before assigning semantic labels. The maximum-match diagnostic also permits multiple true directions to match the same decoder column, and absolute cosine ignores the sign that a nonnegative latent can write, making both the random-initialization baseline and signed alignment informative checks. In a full LLM, where ground-truth directions are unknown, combine semantic counterexamples with causal interventions.

### Key implementation choices in the NumPy trainer

- The generator combines 2–4 of 24 non-orthogonal directions in eight dimensions. This known construction lets us test recovery separately from reconstruction.
- Nonzero decoder columns are renormalized after each step. Otherwise, shrinking $z$ and expanding decoder columns reciprocally can preserve reconstruction while reducing this unweighted L1 penalty. A decoder-norm-weighted penalty is another way to address that reparameterization.[^rajamanoharan2024jumprelu]
- The subgradient of the L1 term ($\text{sign}(z)$) is added to the backward gradient before the ReLU step.
- About $18.9/64=29.5\%$ of slots fire on training samples, and $19.5$ on held-out samples. That's less dense than using every slot, but much denser than the generator's 2–4 active directions. Production sparsity and concept recovery need separate measurements.

<figure>
  <img src="illustrations/_generated/sae_training_tradeoff_dark.png" alt="A toy SAE training trace plots reconstruction MSE 1.4259, 0.2370, 0.1564 and weighted L1 contribution 0.5167, 0.2931, 0.2830 at epochs 0, 100, 200. The completed 300-epoch run reports MSE 0.128 and 18.9 active latents of 64; held-out results are MSE 0.128, FVU 0.169, and 19.5 active latents. Median best absolute cosine against known generating directions changes only from 0.798 to 0.799." />
  <figcaption>The sampled objective components are shown through epoch $200$. The complete $300$-epoch output reports final train MSE $0.128$, $18.9/64$ active latents, and held-out FVU $0.169$. Median best absolute cosine against the known directions changes from $0.798$ to $0.799$; reconstruction quality alone does not show feature recovery.</figcaption>
</figure>

## Practical training details and pitfalls

These failure modes appear in compact experiments as well as frontier language model runs, with prevalence shaped by data distribution, dictionary architecture, and optimizer tuning. Comparing the major training recipes clarifies which parts of an objective trade magnitude bias against dead-latent capacity:

| Architecture / Mechanism | How it works | Why it matters |
|--------------------------|--------------|----------------|
| **TopK SAEs** | Keeps at most $k$ nonzero candidates; main objective omits L1.[^gao2024sae] | Removes direct L1 magnitude shrinkage; improves the tested reconstruction/sparsity tradeoff. Feature purity depends on the model and evaluation. |
| **Gated SAEs** | Binary detection and nonnegative magnitude paths share projection directions; gate pre-activations receive L1 and an auxiliary task.[^rajamanoharan2024gated] | Separates detection from direct magnitude regularization; the hard gate and auxiliary loss are part of the recipe. |
| **JumpReLU SAEs** | Learned positive thresholds, L0 penalty, and custom windowed threshold gradients.[^rajamanoharan2024jumprelu] | Better than Gated and comparable to or slightly better than TopK on the paper's Gemma 2 9B sites; results vary across models and evaluation metrics. |
| **AuxK Loss** | Selected inactive latents reconstruct the main reconstruction error.[^gao2024sae] | Supplies gradients to otherwise unused capacity; monitor revival and fidelity rather than assuming success. |
| **Decoder column normalization** | Enforces $\|W_\text{dec}[:, i]\|_2 = 1$ after updates. | Closes the scaling loophole where the optimizer inflates decoder weights to artificially depress latent L1 loss. |

### Dead latents: tracking and revival

A **dead latent** is inactive according to a specified monitoring rule: Gao's recipe flags zero activations across 10 million tokens, whereas a low nonzero firing rate reflects a different phenomenon.[^gao2024sae] Four observed samples with zero activity show only "not seen in this window," rather than permanent death, so check rare-domain coverage and observation length before resampling a potentially valuable rare feature. When latents genuinely die, the cause is usually an unfavorable random initialization, strong L1 or TopK sparsity pressure, or competing features that consistently explain those inputs earlier and leave the unit with a negative bias and zero gradient. Two primary mechanisms address dead latents:

1. **Anthropic resampling (2023):** At steps 25k/50k/75k/100k, the published recipe checks inactivity over the preceding 12.5k steps. It samples **input vectors** with probabilities proportional to squared per-input SAE loss. The decoder receives the normalized sampled input, not its reconstruction residual. The encoder uses the same direction at $0.2\times$ the average alive-row norm; its bias and modified Adam state are reset. Resampling can cause loss spikes and isn't mandatory in every recipe.[^bricken2023]
2. **AuxK (Gao, 2024):** Select promising dead latents to predict the main error $e=x-\hat{x}$ with an auxiliary decoder pass. The paper typically uses weight $1/32$, alongside tied initialization. Its 16M-latent run reported 7% dead latents; results depend on dictionary and dataset.[^gao2024sae]

<!-- leetllm: test, output=show, output_title="Dead-latent monitor" -->
```python title="dead-latent-monitor.py"
latent_batches = [
    [1.2, 0.0, 0.0, 0.0],
    [0.7, 0.3, 0.0, 0.0],
    [0.0, 0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0, 0.5],
]

rates = [
    sum(row[index] > 0 for row in latent_batches) / len(latent_batches)
    for index in range(len(latent_batches[0]))
]
never_observed = [index for index, rate in enumerate(rates) if rate == 0.0]
print("firing rates:", [round(rate, 2) for rate in rates])
print("never observed in this window:", never_observed)

assert never_observed == [2]
```

<!-- leetllm: output:start -->
```text title="Dead-latent monitor" output compact
firing rates: [0.5, 0.25, 0.0, 0.25]
never observed in this window: [2]
```
<!-- leetllm: output:end -->

### Non-identifiability, absorption, and splitting

Evaluating SAEs requires watching out for three subtle structural failure modes:

| Failure mode | What happens | Practical risk |
|--------------|--------------|----------------|
| **Metrics don't identify a unique dictionary** | Independently trained SAEs can reach similar MSE and L0 with different directions. | Test seed stability, matched features, and circuit effects; don't assume identical indices or labels transfer. |
| **Feature absorption** | A specific latent absorbs instances of a general concept (e.g. "Paris" latent fires, but generic "capital city" latent stays dark).[^chanin2024absorption] | Top-activating examples look pure (high precision), but recall across diverse prompts is secretly broken. |
| **Feature splitting** | A single human concept splits across multiple near-duplicate latents as dictionary width increases. | Steering one latent only moves part of the target behavior; automated dashboards become fragmented. |

Absorption can improve sparsity **without changing reconstruction**. In a toy hierarchy, a "Paris" instance always includes "capital city." A combined decoder direction can write both while the general detector stays silent:

<!-- leetllm: test, output=show -->
```python title="absorption-can-win-the-sparsity-objective.py"
parent = [1.0, 0.0]
child = [0.0, 1.0]
target = [1.0, 1.0]  # general and specific concepts are both present
interpretable_code = [1.0, 1.0]
absorbed_code = [0.0, 1.0]
combined_direction = [a + b for a, b in zip(parent, child)]
reconstruction = [absorbed_code[0] * parent[i]
                  + absorbed_code[1] * combined_direction[i] for i in range(2)]
assert reconstruction == target
print("active latents:", sum(v != 0 for v in interpretable_code),
      "->", sum(v != 0 for v in absorbed_code))
print(f"general latent: {absorbed_code[0]:.1f}; general coordinate: {reconstruction[0]:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
active latents: 2 -> 1
general latent: 0.0; general coordinate: 1.0
```
<!-- leetllm: output:end -->

This hand-computed L0 example isolates support bookkeeping. With unit-normalized combined direction $[1,1]/\sqrt2$, its coefficient becomes $\sqrt2$ while support remains one, and the child direction now writes general information as well. Chanin's study investigates absorption in first-letter tasks and shows why sweeping width or sparsity alone need not eliminate it.[^chanin2024absorption]

## Applications to safety and governance

Safety evaluations demand the highest standard of evidence because plausible latent descriptions can easily mask missing behaviors. Templeton et al. showed that SAEs can surface safety-relevant candidate features in Claude 3 Sonnet, isolating directions associated with scam emails, code exploits, bias, and sycophantic agreement.[^templeton2024] While some features generalize across languages or modalities in specific studies, others track token strings, formatting artifacts, or partial sub-concepts.[^templeton2024] Testing a proposed label with French translations, base64 encodings, and semantic counterexamples reveals how activation patterns depend on surface form, and absorption warns that an inactive general latent is weak evidence that a concept is absent.

Return to the code-assistant password-reset refusal with that standard in mind. Compare benign and harmful credential-related prompts, vary urgency independently, and track proposed features at matched hooks. Test whether edits move a chosen refusal metric and whether legitimate task completion recovers without degrading other code assistance tasks. A shift in refusal phrasing alone does not confirm corrected security judgment or preserved safeguards.

### What changed in 2026?

**Checked September 22, 2026.** Heap et al.'s ICLR 2026 study compared residual-stream SAEs on trained, randomized, and initialization checkpoints from the Pythia family. Aggregate automated interpretability scores and reconstruction metrics often looked similar, especially at larger sizes. This challenges those metrics as stand-alone evidence of learned computation; it doesn't show that every SAE feature is meaningless. Add appropriate null-model baselines to metric-driven claims.[^heap2026SAENullModels]

Anthropic's May 7, 2026 **natural language autoencoders** instead learn an activation → text → activation round trip. They can help generate auditing hypotheses, but their explanations can hallucinate and their verbalizer can infer beyond the stored activation. They don't supply a feature circuit or a verified transcript of reasoning. Corroborate claims with independent methods; readable explanations inherit the same proxy-versus-mechanism problem.[^anthropicNLA2026]

## Limits and caution

An SAE can propose directions and still leave most of the computation unexplained. Four limits keep a dictionary from being a finished account of how the model works:

1. **Reconstruction error matters:** Substituting reconstructions can degrade model performance. Cunningham et al.'s layer-2 Pythia-70M experiment raised Pile perplexity from 25 to 40; test the effect on the target model and intervention.[^cunningham2023sae]
2. **Coverage is incomplete:** The Sonnet study reports missing features and no reliable total-feature count.[^templeton2024] Reconstruction errors, rare contexts, and features spread across layers can leave relevant computation unexplained. Measure coverage with held-out contexts and circuit tests; dictionary width alone cannot verify it.
3. **Feature splitting can change the units:** The Sonnet study observed concepts splitting into narrower sub-features as dictionary size grew.[^templeton2024] Individual feature indices shouldn't be treated as immutable atomic units.
4. **Labels are hypotheses:** Top activations suggest a name, while lower activations and semantic counterexamples test its precision and recall. Causal experiments test the specified direction's role; universal semantic labels, a unique dictionary, and complete understanding require broader evidence.

<!-- leetllm: mastery:start -->

## What to check before moving on

- Distinguish finite-point JL distance preservation from a claim about features learned by a transformer; calculate accumulated interference under a coherence bound.
- Explain how mixed coordinates can arise and why polysemanticity alone does not prove superposition.
- Compare tied weights, tied initialization, untied detection/reconstruction, and optional learned-reference subtraction.
- Identify the L1 shrinkage problem and explain how TopK, Gated, and JumpReLU SAEs eliminate or mitigate it.
- Report activation MSE, L0, raw downstream losses, and baseline-relative Loss Recovered without treating any one metric as feature recovery.
- Diagnose dead latents and contrast Anthropic resampling with OpenAI's AuxK auxiliary loss.
- Explain the difference between naive ablation and error-preserving ablation, identifying why discarding the residual $e$ creates false causal claims.
- Trace CLT input/output layers and explain local attribution graphs' frozen attention, normalization denominators, error nodes, and omitted mechanisms.

### Practice checkpoints

```checkpoint
Why can't we just inspect weights or individual neuron activations?
---
Under the superposition hypothesis, overlapping feature directions make single neurons respond to several concepts. Toy models demonstrate one mechanism; LLM neurons can reflect other mechanisms too. SAE latents offer alternative candidate units, and they require empirical validation.
```

```checkpoint
What is the difference between an L1 SAE and a TopK SAE?
---
An L1 SAE penalizes latent magnitude, with sums or means depending on the convention. Nonnegative TopK retains the largest $k$ candidates, but fewer than $k$ can be positive. It controls support size directly; training still needs a recipe for unused latents and the non-smooth selection step.[^gao2024sae]
```

```checkpoint
How does an SAE enable activation steering?
---
An SAE decoder column gives a direction to write at its matching hook. Add a scaled copy and measure the behavioral effect. The latent coefficient is a detector readout; validate a named concept with targeted examples, and check whether editing the cached coefficient changes the re-encoded value.
```

```checkpoint
What causes dead features?
---
Dead features are latents that never activate over a specified monitoring window. Persistent inactivity can result from sparsity pressure, initialization, competition, or missing contexts. Interpret rare activity against the monitoring window and the feature's expected role. Large SAE recipes monitor this distinction and use resampling or auxiliary losses to revive unused capacity.[^gao2024sae]
```

```checkpoint
How do feature circuits help explain model algorithms?
---
A feature circuit connects human-readable features across layers, then tests whether those edges matter for behavior. The output isn't merely a label like "credential safety." The useful artifact is a candidate causal graph: early features activate, later features combine them, and interventions on selected nodes should shift the model's answer in a predictable way before you trust the explanation.
```

## Common failures and fixes

- Symptom: A raw coordinate responds to unrelated contexts. **Possible cause:** Mixed representations. **Check:** Compare candidate directions, their activation ranges, and controlled effects before attributing the behavior to an overcomplete dictionary.
- Symptom: MSE falls but labels stay messy. **Possible causes:** Dense codes, absorption, splitting, or poor labels. **Check:** Sweep width/sparsity with matched data, test recall and seeds, and report downstream loss. No universal $M/D\ge16$ rule resolves these problems; tighter sparsity can worsen absorption.
- Symptom: A feature label sounds convincing, but ablation changes nothing. **Possible causes:** The label is correlational, the edit magnitude is ineffective, or parallel pathways compensate. **Fix:** Check the hook point, edit magnitude, and alternative pathways before interpreting the null result.
- Symptom: Many slots never fire in the observation window. **Possible causes:** Competition, initialization, sparsity, or missing rare contexts. **Check:** State the window and sample coverage before trying a revival recipe; measure its side effects.
- Symptom: Steering works on a demo but damages other prompts. **Possible causes:** Overlap, scale, wrong hook, or changed attention. **Check:** Match the checkpoint, hook, and token positions, then sweep edits and controls on held-out tasks. A fixed orthogonal probe only tracks that probe; held-out tasks test downstream capabilities.

<!-- leetllm: mastery:end -->

## Practice projects

1. **CPU first:** Sweep the toy's sparsity coefficient and training seed. Record held-out MSE/FVU, L0, signed alignment, and random-initialization alignment. Try to improve recovery rather than only reconstruction.
2. **Inspect an existing dictionary:** Use [SAELens](https://github.com/decoderesearch/SAELens) with its matching model/hook. Sample top, middle, low, and non-activating contexts; test a label's precision and recall. Its current inference interface supports generic PyTorch activation extraction, not only TransformerLens.
3. **Train a dictionary if compute allows:** Freeze a small model and stream activations from a stated corpus. Plan memory: 200k float32 vectors of width 4,096 alone occupy about 3.05 GiB at one hook, before model, SAE, gradients, and optimizer state. Compare L1/TopK under matched width, support, data, and compute; assess coverage on held-out contexts, especially rare ones.
4. **Test an algorithm:** Choose a model-specific comparison task such as greater-than year completion. Find candidate SAE components, preserve error, and test both targeted and control edits. Recovering a known head-level circuit in SAE coordinates remains an open research goal.[^hanna2023greater]
5. **Trace a prompt:** Follow [circuit-tracer's tutorial](https://github.com/decoderesearch/circuit-tracer) with a supported model and pretrained transcoders, then test one graph prediction. A standard SAE alone isn't a CLT. Record the graph's frozen paths, error nodes, edit positions, and original-model behavior.

**Tool compatibility checked October 10, 2026:** SAELens documents a v6 training refactor. [TransformerLens](https://github.com/TransformerLensOrg/TransformerLens) now recommends `TransformerBridge`; its README states that the legacy `HookedTransformer.from_pretrained` API was removed in 4.0. Record installed versions and consult their migration guides before copying older notebooks. Weight folding/centering can change activation coordinates, so match a dictionary's training conventions as well as its model name.

## Validate one feature claim

Take one proposed SAE feature through a complete causal audit. Inspect top activations on held-out text, state a behavioral prediction, ablate or steer the decoder direction, and run matched negative controls alongside reconstruction-damage and downstream capability measurements. If the effect fails to replicate across held-out prompts or the SAE replacement degrades model behavior too much, keep the label as an unconfirmed hypothesis.

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
    "explanation": "For z>0, derivative 2(z-2)+1=0 gives 1.5. Support stays one. The loss convention determines the shrinkage coefficient; TopK instead caps support without this main-path L 1 magnitude term."
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
    "question": "An activation is[3,0.06], reconstruction[3,0], and removed feature contribution[3,0]. The score is 50 times coordinate 2. What does error-preserving ablation produce?",
    "options": [
      "[0,0] and score 0; preserving error means discarding the unexplained coordinates.",
      "[0,0.06] and score 3; editing the reconstruction would also discard the residual.",
      "[3,0] and score 0; feature removal targets the small residual coordinate.",
      "[3,0.06] and score 3; preserving error means making no activation edit."
    ],
    "answer": "[0,0.06] and score 3; editing the reconstruction would also discard the residual.",
    "explanation": "Subtract only[3,0] from the original activation to obtain[0,0.06]. Its score remains 3. Subtracting from the reconstruction instead gives[0,0], confounding the feature edit with residual loss."
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

> **Next:** Continue to [Decoding Strategies: Greedy to Nucleus](/learn/decoding-strategies-greedy-beam-nucleus). SAE features live in the residual stream that later unembeds into logits. Decoding is the policy that turns those logits into the next token, so the same internal direction can look very different once greedy, beam, or <span data-glossary="top-p">nucleus sampling</span> chooses what actually appears.
